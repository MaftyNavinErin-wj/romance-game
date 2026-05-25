// scenario_validate.js — Scenario 全表 validator (设计 doc §9, 1e scope, A-M 全 13 节)
//
// 用途:
//   静态 schema 检验 — 对 src/data/scenarios/<id>.js + src/data/{general,city,faction}_base.js
//   做全表交叉一致性检查。不依赖 jsdom + initGame (纯静态)。
//
// 跟 verify_scenario_214.js 的关系:
//   verify_scenario_214.js (1a.3): 214 专用子集 validator (B.4 / C.1-5 / E.1/4/5/6 / G.4/5 /
//     I.5/6 / J.1-3 / L.2 + initialUnits + pendingFac). 保留作为历史 baseline.
//   scenario_validate.js   (1e):  通用 全 13 节 (A-M). 支持任 scenarioId 入参.
//     sprint_verify.js 在末尾调本 module strict 模式守底.
//
// 用法:
//   node tests/scenario_validate.js                # 验全 scenarios/<id>.js
//   node tests/scenario_validate.js 214            # 只验 214
//
// sprint_verify hook:
//   末尾 require('./scenario_validate').validateScenario('214'),
//   errors.length>0 → sprint_verify fail. warnings 仅 informational (J.4 regionHint optional /
//   E.3 mirror / D.* 年龄 / I.6 v181 retainer 数据 bug) 不 fail.
//
// 覆盖 (设计 doc §9 13 节):
//   A.1-5  ID 合法性 (unknown fac/city/general/reserved/cross-scenario reuse)
//   B.1-5  数据完整性 (cities 全列 / city.fac valid / capital 计数 / ruler / emperor)
//   C.1-5  武将状态机 (active 字段 / city.fac / wild fac:'wild' / pending availableYear / retainer)
//   D.1-3  年龄一致性 (warning-only,只在 birthYear/deathYear/debutYear 非 null 时 check)
//   E.1-7  关系图 (target valid / status!=unavailable / 双向 / intimacy 范围 / 自相关 / 重复 / type 对称)
//   F.1-5  外交图 (双向 / no self / no dup / status enum / value 范围)
//   G.1-8  命名空间 (color/cls/name 唯一 / status/role enum / aiPersonality 5 维 / version semver / playable)
//   H.1-3  资源 / 经济 sanity (res 非负 / pop>=0 / troops<=pop*0.5)
//   I.1-6  active 字段完整 (fac/city/loyalty/post/role/retainer + ruler 计数)
//   J.1-5  wild/pending wildData (fac:'wild' / availableYear / 6 字段 / regionHint optional / skillsOverride)
//   K.1    diplo status enum (enemy/ally/neutral/vassal)
//   L.1-3  Wild lookup 可见性 (visibility gate / availableYear > startYear / WILD_GENS filter)
//   M.1-2  Stale ID grep (no nanman_214/nanman_190 literal / reserved id 不作 fac key)

'use strict';

const fs = require('fs');
const path = require('path');

// ─── paths ─────────────────────────────────────────────────────────
const SCENARIO_DIR = path.resolve(__dirname, '..', 'src', 'data', 'scenarios');
const GEN_BASE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'general_base.js');
const CITY_BASE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'city_base.js');
const FAC_BASE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'faction_base.js');

function loadConst(filePath, varName) {
  const src = fs.readFileSync(filePath, 'utf8');
  return (new Function(src + `\n; return ${varName};`))();
}

// ─── enums / constants ─────────────────────────────────────────────
const STATUS_ENUM = new Set(['active', 'wild', 'pending']);
const ROLE_ENUM = new Set(['ruler', 'strategist', 'prefect', null]);
const RETAINER_TYPE_ENUM = new Set(['cavalry', 'light', 'heavy', 'archer', 'siege', 'naval', null]);
const DIPLO_STATUS_ENUM = new Set(['enemy', 'ally', 'neutral', 'vassal']);
const RESERVED_FAC_IDS = new Set(['wild', 'rebel']);
const RESERVED_FAC_PREFIXES = ['gentry_'];

// E.7 type 对称表 (table-driven; 列出来的强制对称, 其他单向类型不 check)
const REL_TYPE_MIRROR_MAP = {
  '父亲': '子嗣',
  '子嗣': '父亲',
  '兄长': '弟',
  '弟': '兄长',
  '夫妻': '夫妻',
  '义兄弟': '义兄弟',
  '主君': '臣下',
  '臣下': '主君',
  '宗族': '宗族',
  '同门': '同门',
  '同乡': '同乡',
};

// ─── core validator ────────────────────────────────────────────────
function validateScenario(scenarioId) {
  const scenarioPath = path.resolve(SCENARIO_DIR, `${scenarioId}.js`);
  if (!fs.existsSync(scenarioPath))
    return { errors: [`scenario '${scenarioId}' not found at ${scenarioPath}`], warnings: [] };

  const S = loadConst(scenarioPath, `SCENARIO_${scenarioId}`);
  const GEN_BASE = loadConst(GEN_BASE_PATH, 'GEN_BASE');
  const CITY_BASE = loadConst(CITY_BASE_PATH, 'CITY_BASE');
  const FACTION_BASE = loadConst(FAC_BASE_PATH, 'FACTION_BASE');

  const errors = [];
  const warnings = [];

  const facIds = new Set(Object.keys(S.factions));
  const cityIds = new Set(Object.keys(S.cities));
  const genNames = new Set(Object.keys(S.generals));

  // ── A. ID 合法性 ────────────────────────────────────────────────
  // A.1 faction id ∈ FACTION_BASE
  for (const fid of facIds) {
    if (!(fid in FACTION_BASE))
      errors.push(`A.1 scenario.factions['${fid}'] not in FACTION_BASE`);
  }
  // A.2 city id ∈ CITY_BASE
  for (const cid of cityIds) {
    if (!(cid in CITY_BASE))
      errors.push(`A.2 scenario.cities['${cid}'] not in CITY_BASE`);
  }
  // A.3 general name ∈ GEN_BASE
  for (const name of genNames) {
    if (!(name in GEN_BASE))
      errors.push(`A.3 scenario.generals['${name}'] not in GEN_BASE`);
  }
  // A.4 reserved id 不可作 faction key
  for (const fid of facIds) {
    if (RESERVED_FAC_IDS.has(fid) || RESERVED_FAC_PREFIXES.some(p => fid.startsWith(p)))
      errors.push(`A.4 scenario.factions['${fid}'] uses reserved id`);
  }
  // A.5 cross-scenario faction id reuse — 1f 之前单 scenario 跳过 (留 phase 2 多 scenario 时实装)

  // ── B. 数据完整性 ───────────────────────────────────────────────
  // B.1 cities 必须列全 CITY_BASE
  for (const cid of Object.keys(CITY_BASE)) {
    if (!cityIds.has(cid))
      errors.push(`B.1 CITY_BASE['${cid}'] missing in scenario.cities`);
  }
  // B.2 city.fac ∈ scenario.factions
  for (const [cid, c] of Object.entries(S.cities)) {
    if (!c.fac) errors.push(`B.2 city['${cid}'].fac missing`);
    else if (!facIds.has(c.fac))
      errors.push(`B.2 city['${cid}'].fac='${c.fac}' not in scenario.factions`);
  }
  // B.3 capital 计数: 每 faction 恰好 1 or explicit 0 (蛮族 / 行营势力)
  const capCountByFac = {};
  for (const c of Object.values(S.cities)) {
    if (c.isCapital) capCountByFac[c.fac] = (capCountByFac[c.fac] || 0) + 1;
  }
  for (const fid of facIds) {
    const n = capCountByFac[fid] || 0;
    const f = S.factions[fid];
    // 设计 doc §9 B.3: 蛮族 / 行营势力 explicit 0 cap allowed
    const allowZero = (f.stage === 'nomad' || f.stage === 'shadow'
      || f._baseType === 'nomad' || f._baseType === 'tribal' || f.type === 'tribal');
    if (n > 1) errors.push(`B.3 faction['${fid}'] has ${n} capitals (expected 0 or 1)`);
    else if (n === 0 && !allowZero)
      warnings.push(`B.3 faction['${fid}'] has 0 capitals (stage=${f.stage})`);
  }
  // B.4 faction.ruler ∈ active generals + fac=本势力 (per-faction)
  for (const [fid, f] of Object.entries(S.factions)) {
    if (!f.ruler) { errors.push(`B.4 faction['${fid}'].ruler missing`); continue; }
    const g = S.generals[f.ruler];
    if (!g) errors.push(`B.4 faction['${fid}'].ruler '${f.ruler}' not in scenario.generals`);
    else {
      if (g.status !== 'active')
        errors.push(`B.4 ruler '${f.ruler}' status='${g.status}' (must be active)`);
      if (g.fac !== fid)
        errors.push(`B.4 ruler '${f.ruler}' fac='${g.fac}' (must be '${fid}')`);
    }
  }
  // B.5 emperor: 全 scenario 至多 1 faction.emperor=true + emperor obj cross-ref
  let emperorFacCount = 0;
  for (const f of Object.values(S.factions)) {
    if (f.emperor === true) emperorFacCount++;
  }
  if (emperorFacCount > 1)
    errors.push(`B.5 ${emperorFacCount} factions have emperor=true (expected at most 1)`);
  if (S.emperor) {
    if (!cityIds.has(S.emperor.cityId))
      errors.push(`B.5 emperor.cityId='${S.emperor.cityId}' not in scenario.cities`);
    if (!facIds.has(S.emperor.holder))
      errors.push(`B.5 emperor.holder='${S.emperor.holder}' not in scenario.factions`);
    else if (!S.factions[S.emperor.holder].emperor)
      errors.push(`B.5 emperor.holder='${S.emperor.holder}' but that faction.emperor=false`);
  }

  // ── G. 命名空间 (FACTION_BASE cross-ref + scenario fields) ──────
  // G.1/2/3 color/cls/name 唯一 (per scenario, 通过 FACTION_BASE)
  const colorOwner = new Map();
  const clsOwner = new Map();
  const nameOwner = new Map();
  for (const fid of facIds) {
    const fb = FACTION_BASE[fid];
    if (!fb) continue;  // A.1 已报
    if (colorOwner.has(fb.color))
      errors.push(`G.1 faction['${fid}'].color='${fb.color}' duplicate with '${colorOwner.get(fb.color)}'`);
    else colorOwner.set(fb.color, fid);
    if (clsOwner.has(fb.cls))
      errors.push(`G.2 faction['${fid}'].cls='${fb.cls}' duplicate with '${clsOwner.get(fb.cls)}'`);
    else clsOwner.set(fb.cls, fid);
    if (nameOwner.has(fb.name))
      errors.push(`G.3 faction['${fid}'].name='${fb.name}' duplicate with '${nameOwner.get(fb.name)}'`);
    else nameOwner.set(fb.name, fid);
  }
  // G.6 aiPersonality 5 维 + range
  const AI_KEYS_01 = ['atkThreshold', 'siegeThreshold', 'diploAggro'];
  const AI_KEYS_PM1 = ['deployBias', 'budgetBias'];
  const AI_KEYS_ALL = new Set([...AI_KEYS_01, ...AI_KEYS_PM1]);
  for (const [fid, f] of Object.entries(S.factions)) {
    const ap = f.aiPersonality;
    if (!ap || typeof ap !== 'object') {
      errors.push(`G.6 faction['${fid}'].aiPersonality missing`);
      continue;
    }
    for (const k of AI_KEYS_01) {
      if (typeof ap[k] !== 'number' || ap[k] < 0 || ap[k] > 1)
        errors.push(`G.6 faction['${fid}'].aiPersonality.${k}=${ap[k]} out of [0,1]`);
    }
    for (const k of AI_KEYS_PM1) {
      if (typeof ap[k] !== 'number' || ap[k] < -1 || ap[k] > 1)
        errors.push(`G.6 faction['${fid}'].aiPersonality.${k}=${ap[k]} out of [-1,+1]`);
    }
    for (const k of Object.keys(ap)) {
      if (!AI_KEYS_ALL.has(k))
        errors.push(`G.6 faction['${fid}'].aiPersonality unknown key '${k}'`);
    }
  }
  // G.7 version semver-like
  if (!/^\d+\.\d+(\.\d+)?$/.test(S.version || ''))
    errors.push(`G.7 scenario.version='${S.version}' invalid semver-like format`);
  // G.8 至少 1 playable=true
  if (Object.values(S.factions).filter(f => f.playable === true).length === 0)
    errors.push(`G.8 scenario has 0 playable factions`);

  // ── H. 资源 / 经济 sanity ───────────────────────────────────────
  // H.1 res 4 字段非负 (gold/wood/iron/horses; food 在 city.storage 不在 faction)
  for (const [fid, f] of Object.entries(S.factions)) {
    const r = f.res || {};
    for (const k of ['gold', 'wood', 'iron', 'horses']) {
      if (typeof r[k] !== 'number' || r[k] < 0)
        errors.push(`H.1 faction['${fid}'].res.${k}=${r[k]} invalid (must be number >= 0)`);
    }
  }
  // H.2 city.pop >= 0; H.3 city.troops <= city.pop * 0.5 (warning)
  for (const [cid, c] of Object.entries(S.cities)) {
    if (typeof c.pop !== 'number' || c.pop < 0)
      errors.push(`H.2 city['${cid}'].pop=${c.pop} invalid`);
    if (typeof c.troops !== 'number' || c.troops < 0)
      errors.push(`H.3 city['${cid}'].troops=${c.troops} invalid`);
    else if (c.pop > 0 && c.troops > c.pop * 0.5)
      warnings.push(`H.3 city['${cid}'].troops=${c.troops} > pop*0.5 (${c.pop * 0.5})`);
  }

  // ── F. 外交图 + K.1 status enum ─────────────────────────────────
  const seenPairs = new Set();
  if (!Array.isArray(S.diplo)) errors.push(`F scenario.diplo not array`);
  else {
    for (let i = 0; i < S.diplo.length; i++) {
      const d = S.diplo[i];
      const [a, b, rel, status, suzerain] = d;
      // F.2 no self-pair
      if (a === b) errors.push(`F.2 diplo[${i}] self-pair (${a}-${b})`);
      // F.3 no duplicate (canonical sorted key)
      const key = [a, b].sort().join('|');
      if (seenPairs.has(key)) errors.push(`F.3 diplo[${i}] duplicate pair ${a}-${b}`);
      seenPairs.add(key);
      // F.1 one entry per pair (single-direction; materialize 时 mirror) — 通过 F.3 dup 防御
      // K.1 status enum
      if (!DIPLO_STATUS_ENUM.has(status))
        errors.push(`K.1 diplo[${i}].status='${status}' invalid (must be enemy/ally/neutral/vassal)`);
      // F.5 rel 范围
      if (typeof rel !== 'number' || rel < -100 || rel > 100)
        errors.push(`F.5 diplo[${i}].rel=${rel} out of [-100,100]`);
      // F fac cross-ref
      if (!facIds.has(a)) errors.push(`F diplo[${i}].a='${a}' not in scenario.factions`);
      if (!facIds.has(b)) errors.push(`F diplo[${i}].b='${b}' not in scenario.factions`);
      // F/K vassal suzerain consistency
      if (status === 'vassal') {
        if (!suzerain) errors.push(`F/K diplo[${i}] vassal missing suzerain`);
        else if (suzerain !== a && suzerain !== b)
          errors.push(`F/K diplo[${i}] vassal suzerain='${suzerain}' not in pair ${a}-${b}`);
      } else if (suzerain != null) {
        errors.push(`F/K diplo[${i}] suzerain='${suzerain}' but status='${status}' (only vassal allows)`);
      }
    }
    // F.1 强制 — 每对 fac (a < b) 必须有 1 entry. materialize 时 G.diplo['a-b'] / G.diplo['b-a']
    // 双向 mirror 都从此 entry 派生; 缺则 runtime 访问 crash. (codex trial 1 P1.1)
    const sortedFids = Array.from(facIds).sort();
    for (let i = 0; i < sortedFids.length; i++) {
      for (let j = i + 1; j < sortedFids.length; j++) {
        const expectedKey = [sortedFids[i], sortedFids[j]].sort().join('|');
        if (!seenPairs.has(expectedKey))
          errors.push(`F.1 diplo missing entry for pair ${sortedFids[i]}-${sortedFids[j]}`);
      }
    }
  }

  // ── D. 年龄一致性 (warning-only, null 字段 skip) ─────────────────
  const startYear = S.startYear;
  for (const [name, g] of Object.entries(S.generals)) {
    const base = GEN_BASE[name];
    if (!base) continue;  // A.3 已报
    // D.1 deathYear < startYear -> should not be listed; same-year deaths can be alive at scenario start.
    if (g.status !== 'pending' && base.deathYear != null && base.deathYear < startYear)
      warnings.push(`D.1 general['${name}'] deathYear=${base.deathYear} <= startYear=${startYear} (shouldn't be listed)`);
    // D.2 birthYear > startYear -> active/wild should not be listed; pending is the future arrival pool.
    if (g.status !== 'pending' && base.birthYear != null && base.birthYear > startYear)
      warnings.push(`D.2 general['${name}'] birthYear=${base.birthYear} > startYear=${startYear} (not born yet)`);
    // D.3 active 时 startYear >= max(birthYear+18, debutYear)
    if (g.status === 'active' && base.birthYear != null) {
      const minAge = base.birthYear + 18;
      if (startYear < minAge)
        warnings.push(`D.3 active['${name}'] startYear=${startYear} < birthYear+18=${minAge} (too young)`);
    }
    if (g.status === 'active' && base.debutYear != null) {
      if (startYear < base.debutYear)
        warnings.push(`D.3 active['${name}'] startYear=${startYear} < debutYear=${base.debutYear} (not yet active)`);
    }
  }

  // ── C / E / G.4-5 / I / J / L per-general ──────────────────────
  const rulerCountByFac = {};
  for (const [name, g] of Object.entries(S.generals)) {
    // G.4 status enum
    if (!STATUS_ENUM.has(g.status))
      errors.push(`G.4 general['${name}'].status='${g.status}' invalid`);

    if (g.status === 'active') {
      // C.1 active 字段全
      const REQ = ['fac', 'city', 'loyalty', 'post', 'role', 'retainer'];
      for (const k of REQ) {
        if (!(k in g)) errors.push(`C.1 active['${name}'].${k} missing`);
      }
      // G.5 role enum
      if (!ROLE_ENUM.has(g.role))
        errors.push(`G.5 active['${name}'].role='${g.role}' invalid`);
      if (g.role === 'ruler') rulerCountByFac[g.fac] = (rulerCountByFac[g.fac] || 0) + 1;
      // I.1 fac in scenario.factions 且非 'wild'
      if (g.fac === 'wild') errors.push(`I.1 active['${name}'].fac='wild' (must be real faction)`);
      else if (!facIds.has(g.fac)) errors.push(`I.1 active['${name}'].fac='${g.fac}' not in scenario.factions`);
      // C.2 / I.2 city.fac === active.fac
      if (g.city) {
        const c = S.cities[g.city];
        if (!c) errors.push(`C.2 active['${name}'].city='${g.city}' not in scenario.cities`);
        else if (c.fac !== g.fac)
          errors.push(`I.2 active['${name}'] fac='${g.fac}' but city['${g.city}'].fac='${c.fac}' mismatch`);
      }
      // I.3 loyalty 0-100
      if (typeof g.loyalty !== 'number' || g.loyalty < 0 || g.loyalty > 100)
        errors.push(`I.3 active['${name}'].loyalty=${g.loyalty} out of [0,100]`);
      // I.4 post {name,rank,...} or null
      if (g.post !== null && (typeof g.post !== 'object' || !g.post.name || !g.post.rank))
        errors.push(`I.4 active['${name}'].post invalid (need {name,rank,...} or null)`);
      // I.6 / C.5 initialUnit=true → retainer.count>0 + type 合法
      // (设计 doc §9 标 required, 但 1a.3 verify_scenario_214 已 explicit relax 为 warning:
      //  v181 RETAINER_PRESET 4 个 active 漏 (乐进/满宠/廖化/张翼) — 这是 v181 数据 deficiency,
      //  retainer 字段 src/ 内 无 runtime 读取 (1a.2 抽离 future-use 元数据), 不影响行为.
      //  fix 数据是 data quality sprint 工作 (out of 1e validator scope), validator 仅 surface.)
      if (g.initialUnit) {
        if (!g.retainer || g.retainer.count <= 0)
          warnings.push(`I.6/C.5 active['${name}'] initialUnit=true but retainer.count=${g.retainer && g.retainer.count} (v181 RETAINER_PRESET 可能漏 — data sprint followup)`);
        if (g.retainer && !RETAINER_TYPE_ENUM.has(g.retainer.type))
          errors.push(`I.6 active['${name}'] retainer.type='${g.retainer.type}' invalid (must be cavalry/light/heavy/archer/siege/naval/null)`);
      }
    } else if (g.status === 'wild') {
      // C.3 / J.1 wild fac:'wild' + wildData
      if (g.fac !== 'wild') errors.push(`C.3/J.1 wild['${name}'].fac='${g.fac}' (must be 'wild')`);
      if (!g.wildData || typeof g.wildData !== 'object')
        errors.push(`C.3/J.3 wild['${name}'].wildData missing`);
    } else if (g.status === 'pending') {
      // C.4 / J.2 / L.2 pending availableYear > startYear (sane range)
      if (typeof g.availableYear !== 'number')
        errors.push(`C.4/J.2 pending['${name}'].availableYear missing or not number`);
      else if (g.availableYear <= startYear)
        errors.push(`C.4/L.2 pending['${name}'].availableYear=${g.availableYear} <= startYear=${startYear}`);
      else if (g.availableYear > 300)
        errors.push(`J.2 pending['${name}'].availableYear=${g.availableYear} unreasonable (> 300)`);
      if (g.fac !== 'wild') errors.push(`C.4 pending['${name}'].fac='${g.fac}' (must be 'wild')`);
      if (!g.wildData) errors.push(`C.4/J.3 pending['${name}'].wildData missing`);
      // pendingFac (optional, GENS_FULL minTurn>1)
      if (g.pendingFac && !facIds.has(g.pendingFac))
        errors.push(`pending['${name}'].pendingFac='${g.pendingFac}' not in scenario.factions`);
    }

    // L.1 visibility gate: 任 wild/pending 必须有 status 字段判定 — 已通过 G.4 enum 守 (status 在 STATUS_ENUM)
    // L.3 materialized.WILD_GENS filter pending — 属 materializeScenario integration 行为, 非 static schema; 留 1b runtime sprint_verify case

    // J.3 / J.4 / J.5 wild/pending wildData
    if (g.status === 'wild' || g.status === 'pending') {
      const wd = g.wildData || {};
      const REQ_WD = ['title', 'post', 'loyalty', 'merit', 'retainer', 'relations'];
      for (const k of REQ_WD) {
        if (!(k in wd)) errors.push(`J.3 ${name}.wildData.${k} missing`);
      }
      // J.4 regionHint/clanHint optional; absence is accepted.
      // J.5 skillsOverride: null or array
      if ('skillsOverride' in wd && wd.skillsOverride !== null && !Array.isArray(wd.skillsOverride))
        errors.push(`J.5 ${name}.wildData.skillsOverride must be null or array`);
    }
    // J.5 active.skillsOverride (also)
    if ('skillsOverride' in g && g.skillsOverride !== null && !Array.isArray(g.skillsOverride))
      errors.push(`J.5 active['${name}'].skillsOverride must be null or array`);

    // E.1 / E.4 / E.5 / E.6 relations (per-source dup + intimacy + self + target valid)
    const relsList = (g.status === 'active') ? (g.relations || [])
      : ((g.wildData && g.wildData.relations) || []);
    const seenTargets = new Set();
    for (const r of relsList) {
      if (r.target === name) errors.push(`E.5 ${name} self-relation`);
      if (!genNames.has(r.target))
        errors.push(`E.1 ${name}.relations[${r.target}] not in scenario.generals`);
      if (typeof r.intimacy !== 'number' || r.intimacy < -100 || r.intimacy > 100)
        errors.push(`E.4 ${name}.relations[${r.target}].intimacy=${r.intimacy} out of [-100,100]`);
      if (seenTargets.has(r.target)) errors.push(`E.6 ${name}.relations[${r.target}] duplicate`);
      seenTargets.add(r.target);
      // E.2 target.status != 'unavailable' (设计 doc; v3 status enum 无 'unavailable', G.4 已守)
    }
  }
  // I.5 ruler per fac 恰好 1
  for (const fid of facIds) {
    const n = rulerCountByFac[fid] || 0;
    if (n !== 1) errors.push(`I.5 faction['${fid}'] has ${n} rulers (expected exactly 1)`);
  }

  // ── E.3 双向 mirror + E.7 type 对称 (cross-general) ──────────────
  const relMap = new Map();  // key 'from->to' → {type,intimacy}
  for (const [name, g] of Object.entries(S.generals)) {
    const list = (g.status === 'active') ? (g.relations || [])
      : ((g.wildData && g.wildData.relations) || []);
    for (const r of list) {
      relMap.set(`${name}->${r.target}`, { type: r.type, intimacy: r.intimacy });
    }
  }
  for (const [k, r] of relMap.entries()) {
    const [from, to] = k.split('->');
    if (!genNames.has(to)) continue;  // E.1 已报
    const back = relMap.get(`${to}->${from}`);
    if (!back) {
      warnings.push(`E.3 ${from}->${to} (type='${r.type}') 缺反向 mirror`);
    } else {
      // E.7 type 对称 (table-driven)
      if (r.type && REL_TYPE_MIRROR_MAP[r.type] && REL_TYPE_MIRROR_MAP[r.type] !== back.type)
        warnings.push(`E.7 ${from}->${to} type='${r.type}' should mirror to '${REL_TYPE_MIRROR_MAP[r.type]}' but back='${back.type}'`);
    }
  }

  // ── initialUnits schema (1a.3 扩展) ─────────────────────────────
  const iu = S.initialUnits;
  if (!Array.isArray(iu)) {
    errors.push(`initialUnits not array (got ${typeof iu})`);
  } else {
    const VALID_TYPES = new Set(['cavalry', 'light', 'heavy', 'archer', 'siege', 'naval']);
    iu.forEach((u, ui) => {
      if (!u.fac || !facIds.has(u.fac)) errors.push(`initialUnits[${ui}].fac '${u.fac}' invalid`);
      if (!u.city || !cityIds.has(u.city)) errors.push(`initialUnits[${ui}].city '${u.city}' invalid`);
      if (u.city && S.cities[u.city] && S.cities[u.city].fac !== u.fac)
        errors.push(`initialUnits[${ui}] fac=${u.fac} city.fac=${S.cities[u.city].fac} mismatch`);
      if (!Array.isArray(u.squads) || u.squads.length === 0) {
        errors.push(`initialUnits[${ui}].squads not non-empty array`);
        return;
      }
      u.squads.forEach((s, si) => {
        const tag = `initialUnits[${ui}].squads[${si}]`;
        if (!s.genName || !genNames.has(s.genName))
          errors.push(`${tag}.genName '${s.genName}' not in scenario.generals`);
        if (s.genName) {
          const g = S.generals[s.genName];
          if (g && g.status !== 'active') errors.push(`${tag}.genName '${s.genName}' status=${g.status} (must be active)`);
          if (g && g.fac !== u.fac) errors.push(`${tag}.genName '${s.genName}' fac=${g.fac} (must be ${u.fac})`);
          if (g && g.city !== u.city) errors.push(`${tag}.genName '${s.genName}' city=${g.city} (must be ${u.city})`);
          if (g && !g.initialUnit) errors.push(`${tag}.genName '${s.genName}' initialUnit=false (must be true)`);
        }
        if (!VALID_TYPES.has(s.type)) errors.push(`${tag}.type='${s.type}' invalid`);
        if (typeof s.troops !== 'number' || s.troops <= 0) errors.push(`${tag}.troops=${s.troops} invalid`);
        if (typeof s.maxTroops !== 'number' || s.maxTroops <= 0) errors.push(`${tag}.maxTroops=${s.maxTroops} invalid`);
        if (typeof s.morale !== 'number' || s.morale < 0 || s.morale > 100)
          errors.push(`${tag}.morale=${s.morale} out of [0,100]`);
      });
    });
    // every active.initialUnit=true must appear in initialUnits[].squads
    // (codex trial 1 P1.2: 用 Array.isArray guard, 防 malformed scenario u.squads=undefined 时 forEach crash)
    const inUnit = new Set();
    iu.forEach(u => {
      if (Array.isArray(u.squads)) u.squads.forEach(s => inUnit.add(s.genName));
    });
    for (const [name, g] of Object.entries(S.generals)) {
      if (g.status === 'active' && g.initialUnit && !inUnit.has(name))
        errors.push(`active['${name}'] initialUnit=true but not in initialUnits[].squads`);
    }
  }

  // ── M. Stale ID grep ────────────────────────────────────────────
  // M.1 scenario 源码 'nanman_214'/'nanman_190' literal 必须 0 hit
  const scenarioSrc = fs.readFileSync(scenarioPath, 'utf8');
  if (/nanman_214|nanman_190/.test(scenarioSrc))
    errors.push(`M.1 scenario source contains stale id 'nanman_214'/'nanman_190'`);
  // M.2 (已通过 A.4 守)

  return { errors, warnings };
}

// ─── CLI main ──────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const idArg = args.find(a => !a.startsWith('--'));
  let scenarioIds;
  if (idArg) {
    scenarioIds = [idArg];
  } else {
    scenarioIds = fs.readdirSync(SCENARIO_DIR)
      .filter(f => /^\d+\.js$/.test(f))
      .map(f => f.replace('.js', ''));
  }
  if (scenarioIds.length === 0) {
    console.log('[validate] no scenarios found in', SCENARIO_DIR);
    process.exit(1);
  }
  let totalErrors = 0;
  let totalWarnings = 0;
  for (const sid of scenarioIds) {
    console.log(`\n[validate] scenario '${sid}'`);
    const { errors, warnings } = validateScenario(sid);
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    if (warnings.length) {
      console.log(`  WARNINGS (${warnings.length}):`);
      for (const w of warnings.slice(0, 30)) console.log('    ⚠ ' + w);
      if (warnings.length > 30) console.log(`    ... (+${warnings.length - 30} more)`);
    }
    if (errors.length) {
      console.log(`  ERRORS (${errors.length}):`);
      for (const e of errors.slice(0, 30)) console.log('    ✗ ' + e);
      if (errors.length > 30) console.log(`    ... (+${errors.length - 30} more)`);
    } else {
      console.log(`  PASS (0 errors${warnings.length ? `, ${warnings.length} warnings` : ''})`);
    }
  }
  console.log(`\n[validate] total: ${totalErrors} errors, ${totalWarnings} warnings`);
  if (totalErrors > 0) process.exit(1);
}

if (require.main === module) main();

module.exports = { validateScenario };
