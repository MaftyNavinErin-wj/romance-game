// tools/extract_scenario_214.js
//
// 阶段 1a.1 + 1a.2 数据抽取工具
//
// 流程:
//   1. 用 jsdom 加载 project_romance_v181.html(跟 smoke.js 同 setup)
//   2. 等 v181 inline script 解析完
//   3. expose 现有数据 const 到 window.__data__
//   4. 调 initGame() 取 G.factions[fid].res / G.reputation / G.emperor 等 initGame 字面值
//   5. 输出:
//      - src/data/general_base.js          (1a.1 — GEN_BASE 主表)
//      - src/data/city_base.js             (1a.1 — CITY_BASE 主表)
//      - src/data/faction_base.js          (1a.1 — FACTION_BASE 主表)
//      - src/data/scenarios/214.js         (1a.2 — SCENARIO_214 切片,不含 generals)
//
// 1a 阶段不动现有代码,只新增 4 个未引用的文件。
// smoke vs main byte-identical 自然守底(code 未改)。
//
// 注:1a.2 SCENARIO_214.generals = {} 占位,1a.3 sprint 补全(active/wild/pending 武将切片)。

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('../tests/vendor/seedrandom.js');

const HTML_PATH      = path.resolve(__dirname, '..', 'project_romance_v181.html');
const OUT_DIR        = path.resolve(__dirname, '..', 'src', 'data');
const SCENARIO_DIR   = path.resolve(__dirname, '..', 'src', 'data', 'scenarios');
const EXTRACT_SEED   = 'extract_scenario_seed_001';

function waitFor(predicate, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try {
        if (predicate()) return resolve();
      } catch (_) { /* ignore */ }
      if (Date.now() - start > timeout) return reject(new Error('waitFor timeout'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

async function main() {
  console.log(`[extract] loading ${HTML_PATH}`);
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(win) {
      // 1a.2 codex 应对: seed Math.random,initGame popQuality/morale 等不影响抽取
      // 但保稳态(initGame 顶层 random 调用确定性,DOM build 不抛)
      const rng = seedrandom(EXTRACT_SEED);
      win.Math.random = rng;
      win.__SMOKE_TEST__ = true;   // 1a.2: 让 initGame 知道是非交互环境
      win.addEventListener('error', e => {
        console.error('[extract] window error:', e.error ? (e.error.stack || e.error.message) : e.message);
      });
    },
  });
  const window = dom.window;

  console.log('[extract] waiting for initGame...');
  await waitFor(() => typeof window.initGame === 'function', 15000);

  // expose 现有数据 const 到 window.__data__ + G 引用(initGame 调用前装好)
  const exposeScript = window.document.createElement('script');
  exposeScript.textContent = `
    window.__data__ = {
      GENS_FULL: typeof GENS_FULL !== 'undefined' ? GENS_FULL : null,
      GEN_META: typeof GEN_META !== 'undefined' ? GEN_META : null,
      WILD_GENS: typeof WILD_GENS !== 'undefined' ? WILD_GENS : null,
      WILD_GEN_META: typeof WILD_GEN_META !== 'undefined' ? WILD_GEN_META : null,
      GEN_POOL_INACTIVE: typeof GEN_POOL_INACTIVE !== 'undefined' ? GEN_POOL_INACTIVE : null,
      GEN_CLASS: typeof GEN_CLASS !== 'undefined' ? GEN_CLASS : null,
      GEN_TAGS: typeof GEN_TAGS !== 'undefined' ? GEN_TAGS : null,
      CITIES_DEF: typeof CITIES_DEF !== 'undefined' ? CITIES_DEF : null,
      FAC: typeof FAC !== 'undefined' ? FAC : null,
      // 1a.2 新增: scenario-specific init constants
      FAC_IDENTITY: typeof FAC_IDENTITY !== 'undefined' ? FAC_IDENTITY : null,
      ETHOS_INIT: typeof ETHOS_INIT !== 'undefined' ? ETHOS_INIT : null,
      DIPLO_INIT: typeof DIPLO_INIT !== 'undefined' ? DIPLO_INIT : null,
      TECH_PREUNLOCK: typeof TECH_PREUNLOCK !== 'undefined' ? TECH_PREUNLOCK : null,
      AI_PERSONALITY: typeof AI_PERSONALITY !== 'undefined' ? AI_PERSONALITY : null,
      FOUNDING_CORE: typeof FOUNDING_CORE !== 'undefined'
        ? Object.fromEntries(Object.entries(FOUNDING_CORE).map(([fid, set]) => [fid, [...set]]))
        : null,
      PLAYABLE_FACS: typeof PLAYABLE_FACS !== 'undefined' ? PLAYABLE_FACS : null,
      ALL_FACS: typeof ALL_FACS !== 'undefined' ? ALL_FACS : null,
      // 1a.3 新增: generals scenario-specific 数据源
      INTIMACY_PRESET: typeof INTIMACY_PRESET !== 'undefined' ? INTIMACY_PRESET : null,
      MERIT_INIT: typeof MERIT_INIT !== 'undefined' ? MERIT_INIT : null,
      RETAINER_PRESET: typeof RETAINER_PRESET !== 'undefined' ? RETAINER_PRESET : null,
    };
    window.__G__ = G;
  `;
  window.document.head.appendChild(exposeScript);

  const data = window.__data__;
  if (!data) throw new Error('expose failed: window.__data__ not set');

  const required = ['GENS_FULL','GEN_META','WILD_GENS','WILD_GEN_META','GEN_POOL_INACTIVE',
                    'GEN_CLASS','GEN_TAGS','CITIES_DEF','FAC',
                    'FAC_IDENTITY','ETHOS_INIT','DIPLO_INIT','TECH_PREUNLOCK','AI_PERSONALITY',
                    'FOUNDING_CORE','PLAYABLE_FACS','ALL_FACS',
                    'INTIMACY_PRESET','MERIT_INIT','RETAINER_PRESET'];
  for (const k of required) {
    if (!data[k]) throw new Error(`missing global: ${k}`);
  }

  // 1a.2: 调 initGame() 装 G.factions[fid].res / G.reputation / G.emperor
  console.log('[extract] calling initGame() for runtime init values...');
  window.initGame();
  const G = window.__G__;
  if (!G || !G.factions || !G.reputation || !G.emperor) {
    throw new Error('initGame did not produce expected G.factions/reputation/emperor');
  }
  console.log(`[extract] initGame done; reputation=${JSON.stringify(G.reputation)} emperor=${JSON.stringify(G.emperor)}`);

  console.log(`[extract] GENS_FULL: ${Object.keys(data.GENS_FULL).length} factions, total ${Object.values(data.GENS_FULL).reduce((s,a)=>s+a.length,0)} generals`);
  console.log(`[extract] WILD_GENS: ${data.WILD_GENS.length}`);
  console.log(`[extract] GEN_POOL_INACTIVE: ${data.GEN_POOL_INACTIVE.length}`);
  console.log(`[extract] CITIES_DEF: ${data.CITIES_DEF.length}`);
  console.log(`[extract] FAC: ${Object.keys(data.FAC).length}`);

  // ── 构建 GEN_BASE ──
  // immutable 字段: com/war/int/pol/cha/apt/birthplace/clan/gentry/classTag/skills/values/faction_clan
  // 不进 GEN_BASE 的: title/post/loyalty/relations/role(scenario-specific)
  const GEN_BASE = {};
  const seenNames = new Set();

  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a == null || b == null) return a === b;
    if (typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false;
      if (!deepEqual(a[ka[i]], b[kb[i]])) return false;
    }
    return true;
  }

  function addGen(g, source) {
    if (!g || !g.name) return;
    const meta = data.GEN_META[g.name] || data.WILD_GEN_META[g.name] || {};
    const tags = data.GEN_TAGS[g.name] || {};
    const classTags = data.GEN_CLASS[g.name] || [];

    // 时间线 stable emit(P2 codex 应对):所有 entry 都含 birthYear/deathYear/debutYear,unknown = null
    // GEN_POOL_INACTIVE entries 含 era.birth/death 可用
    const entry = {
      // 战力(immutable)
      com: g.com, war: g.war, int: g.int, pol: g.pol, cha: g.cha,
      apt: { ...g.apt },
      // 时间线 stable nullable
      birthYear: (g.era && g.era.birth) ? g.era.birth : null,
      deathYear: (g.era && g.era.death) ? g.era.death : null,
      debutYear: null,   // 1a 阶段未填,留后续 sprint 补全(出山年)
      // 史实不变(stable nullable)
      birthplace: meta.birthplace || null,
      clan: meta.clan || tags.clan || null,
      faction_clan: meta.faction_clan || null,
      gentry: tags.origin === 'gentry' ? (tags.state || null) : null,
      // 武将分类
      classTag: classTags[0] || null,
      classTagsAll: classTags.length > 0 ? [...classTags] : [],  // empty array vs null,stable type
      // timeless skills
      skills: meta.skills ? JSON.parse(JSON.stringify(meta.skills)) : [],
      values: meta.values ? [...meta.values] : [],
    };

    if (seenNames.has(g.name)) {
      // P3 codex 应对:exact dup OK,字段差异 hard-fail
      const existing = GEN_BASE[g.name];
      if (!deepEqual(existing, entry)) {
        throw new Error(`[extract] DUP CONFLICT: ${g.name} (from ${source}) differs from earlier entry`);
      }
      console.warn(`[extract] duplicate general (exact match): ${g.name} (${source})`);
      return;
    }
    seenNames.add(g.name);
    GEN_BASE[g.name] = entry;
  }

  // GENS_FULL: 4 factions
  for (const [fid, gens] of Object.entries(data.GENS_FULL)) {
    for (const g of gens) addGen(g, `GENS_FULL.${fid}`);
  }
  // WILD_GENS
  for (const g of data.WILD_GENS) addGen(g, 'WILD_GENS');
  // GEN_POOL_INACTIVE
  for (const g of data.GEN_POOL_INACTIVE) {
    // era 字段含 birth/death,可用于填 birthYear/deathYear
    addGen(g, 'GEN_POOL_INACTIVE');
    if (GEN_BASE[g.name] && g.era) {
      if (g.era.birth) GEN_BASE[g.name].birthYear = g.era.birth;
      if (g.era.death) GEN_BASE[g.name].deathYear = g.era.death;
    }
  }

  console.log(`[extract] GEN_BASE built: ${Object.keys(GEN_BASE).length} entries`);

  // ── 构建 CITY_BASE ──
  // immutable: q/r/name/tags/jun/size/base
  // 不进 CITY_BASE: fac/pop/troops/isCapital(scenario-specific)
  const CITY_BASE = {};
  for (const c of data.CITIES_DEF) {
    CITY_BASE[c.id] = {
      name: c.name,
      q: c.q, r: c.r,
      tags: [...(c.tags || [])],
      jun: c.jun,
      size: c.size,
      base: { ...c.base },
    };
  }
  console.log(`[extract] CITY_BASE built: ${Object.keys(CITY_BASE).length} entries`);

  // ── 构建 FACTION_BASE ──
  // immutable: name/full/color/cls
  // 不进 FACTION_BASE: ruler(scenario-specific)
  const FACTION_BASE = {};
  for (const [fid, f] of Object.entries(data.FAC)) {
    FACTION_BASE[fid] = {
      name: f.name,
      full: f.full,
      color: f.color,
      cls: f.cls,
    };
  }
  console.log(`[extract] FACTION_BASE built: ${Object.keys(FACTION_BASE).length} entries`);

  // ── 写文件 ──
  const writeData = (filePath, varName, headerComment, obj) => {
    const json = JSON.stringify(obj, null, 2);
    const content =
`// ${path.basename(filePath)}
//
${headerComment}
//
// 来源:阶段 1a.1 由 tools/extract_scenario_214.js 自动抽取自 project_romance_v181.html。
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3。

const ${varName} = ${json};
`;
    fs.writeFileSync(filePath, content);
    console.log(`[extract] wrote ${filePath} (${(content.length/1024).toFixed(1)} KB)`);
  };

  writeData(
    path.join(OUT_DIR, 'general_base.js'),
    'GEN_BASE',
    '// 武将主表(cross-scenario fix,immutable 字段)\n' +
    '// 字段:com/war/int/pol/cha/apt(战力)+ birthplace/clan/gentry/classTag/skills/values/faction_clan(史实不变)\n' +
    '// 不进 GEN_BASE 的字段(scenario-specific,留 SCENARIO_xxx.generals):title/post/loyalty/relations/role/merit/retainer\n' +
    '// birthYear/deathYear/debutYear:1a 阶段未填(仅 GEN_POOL_INACTIVE 武将含 era 数据),留阶段 6 年龄 hook 补全',
    GEN_BASE
  );

  writeData(
    path.join(OUT_DIR, 'city_base.js'),
    'CITY_BASE',
    '// 城市主表(cross-scenario fix,地理 immutable 字段)\n' +
    '// 字段:name/q/r/tags/jun/size/base(产出基数)\n' +
    '// 不进 CITY_BASE 的字段:fac/pop/troops/isCapital(留 SCENARIO_xxx.cities)\n' +
    '// 1a 阶段 45 城,阶段 1f 扩 4 城(bohai/pingyuan/zhuojun/luyang)→ 49 城',
    CITY_BASE
  );

  writeData(
    path.join(OUT_DIR, 'faction_base.js'),
    'FACTION_BASE',
    '// 势力主表(cross-scenario fix,显示 immutable 字段)\n' +
    '// 字段:name/full/color/cls\n' +
    '// 不进 FACTION_BASE 的字段:ruler/type/stage/ethos/res/...(留 SCENARIO_xxx.factions[fid])\n' +
    '// 跨 scenario 共享 entry(214 / 190 都用同样 wei/shu/wu/nanman/...);ruler 等 scenario-specific',
    FACTION_BASE
  );

  // ════════════════════════════════════════════════════════════════
  // 1a.2 — 构建 SCENARIO_214 切片(factions / diplo / cities / emperor)
  // ════════════════════════════════════════════════════════════════
  //
  // generals 字段:1a.2 留空 {}, 1a.3 sprint 补全(active/wild/pending 武将切片)。
  //
  // 字段来源(scenario-specific,scenario 切的初始 state):
  //   factions[fid]:
  //     - ruler            ← FAC[fid].ruler
  //     - playable         ← PLAYABLE_FACS.includes(fid)
  //     - type/_baseType/traits/stage/anchorState ← FAC_IDENTITY[fid]
  //     - ethos            ← ETHOS_INIT[fid]
  //     - res              ← G.factions[fid].res (initGame 装好)
  //     - reputation       ← G.reputation[fid]
  //     - emperor          ← G.emperor.holder === fid
  //     - techPreunlock    ← TECH_PREUNLOCK[fid]
  //     - aiPersonality    ← AI_PERSONALITY[fid]
  //     - foundingCore     ← FOUNDING_CORE[fid] (Set → Array)
  //   diplo[]: 4-tuple [a, b, rel, status] (+ 5th element suzerain when status='vassal')
  //   cities[cid]: { fac, pop, troops, isCapital }  ← CITIES_DEF 投影
  //   emperor: { cityId, holder }                  ← G.emperor (initGame 字面)
  //
  // 设计文档参考: docs/scenario_system.md §3.4
  // 守底: 1a.2 不动 code,文件不被引用,smoke vs main byte-identical 自然守底

  const PLAYABLE_SET = new Set(data.PLAYABLE_FACS);

  // factions
  const sFactions = {};
  for (const fid of data.ALL_FACS) {
    if (fid === 'rebel') continue;  // 叛军不是 scenario faction
    const idy   = data.FAC_IDENTITY[fid];
    const eth   = data.ETHOS_INIT[fid] || null;
    const tech  = data.TECH_PREUNLOCK[fid] || [];
    const ai    = data.AI_PERSONALITY[fid] || null;
    const core  = data.FOUNDING_CORE[fid] || [];
    const gres  = G.factions[fid] && G.factions[fid].res;
    if (!idy)  throw new Error(`FAC_IDENTITY missing for ${fid}`);
    if (!gres) throw new Error(`G.factions[${fid}].res missing`);
    sFactions[fid] = {
      ruler:        data.FAC[fid].ruler,
      playable:     PLAYABLE_SET.has(fid),
      type:         idy.type,
      _baseType:    idy._baseType,
      traits:       [...(idy.traits || [])],
      stage:        idy.stage,
      anchorState:  idy.anchorState,
      ethos:        eth ? { ...eth } : null,
      res:          { ...gres },
      reputation:   G.reputation[fid] != null ? G.reputation[fid] : null,
      emperor:      G.emperor.holder === fid,
      techPreunlock: [...tech],
      aiPersonality: ai ? { ...ai } : null,
      foundingCore: [...core],
    };
  }
  console.log(`[extract] SCENARIO_214.factions built: ${Object.keys(sFactions).length} entries`);

  // diplo (4-tuple [a, b, rel, status], + 5th suzerain when 'vassal')
  // DIPLO_INIT keys 是 'a-b' 一向(initGame 内 mirror 出 'b-a')—— 这里只产正向 tuple
  const sDiplo = [];
  for (const [key, v] of Object.entries(data.DIPLO_INIT)) {
    const [a, b] = key.split('-');
    const tuple = [a, b, v.rel, v.status];
    if (v.status === 'vassal' && v.suzerain) tuple.push(v.suzerain);
    sDiplo.push(tuple);
  }
  console.log(`[extract] SCENARIO_214.diplo built: ${sDiplo.length} edges`);

  // cities (fac/pop/troops/isCapital,缺省 isCapital 不写 → 用 false 显式写,避免 v3.3 隐式坑)
  const sCities = {};
  for (const c of data.CITIES_DEF) {
    sCities[c.id] = {
      fac:       c.fac,
      pop:       c.pop,
      troops:    c.troops,
      isCapital: c.isCapital === true,  // 显式 bool,缺省=false
    };
  }
  console.log(`[extract] SCENARIO_214.cities built: ${Object.keys(sCities).length} entries`);

  // ════════════════════════════════════════════════════════════════
  // 1a.3 — 构建 SCENARIO_214.generals 切片
  // ════════════════════════════════════════════════════════════════
  //
  // 策略:
  //   GENS_FULL  → active (minTurn<=1) / pending (minTurn>1, 加 pendingFac)
  //   WILD_GENS  → wild   (minTurn<=1) / pending (minTurn>1, 无 pendingFac → wildPool)
  //   GEN_POOL_INACTIVE → skip (设计 doc §3.4 "未出生/已死 不列")
  //
  // 字段:
  //   active: fac/city/role/post/title/loyalty/merit/retainer/initialUnit/relations/skillsOverride
  //   wild:   fac:'wild', wildData{ title/post/loyalty/merit/retainer/relations/skillsOverride }
  //   pending: availableYear + wildData (+ pendingFac 当 from GENS_FULL minTurn>1)
  //
  // 衍生映射:
  //   city: initUnits.city(若 active 在 initUnits 内) else faction.capital fallback
  //         (nanman 无 capital → 用 jianning 唯一 nanman city)
  //   role: GENS_FULL[fid][i].role 当 'ruler', 其他 null (strategist/prefect 起手未指派)
  //   post/title/loyalty: GEN_META[name].{post/title/loyalty}
  //   merit: MERIT_INIT[name] || 20 (active) / 10 (wild/pending)
  //   retainer: RETAINER_PRESET[name] || { count:0, type:null }
  //   initialUnit: true 当在 initUnits 内 (active 才有)
  //   relations: GEN_META[name].relations 一向, intimacy=INTIMACY_PRESET 任向 lookup else 50, drop icon
  //   availableYear: startYear + floor((minTurn-1)/36)  (36 旬/年, minTurn 1-based)
  //   skillsOverride: null (1a 阶段未实装 timeline 解锁; 阶段 6 补)
  //
  // 1a.3 pragmatic decisions (codex review trial 1 catch):
  //   - city fallback to capital for non-initUnit active (v181 不 track per-general city)
  //   - relations 一向 + 漏 INTIMACY_PRESET orphan pair (设计 doc §3.4 不允 separate intimacyPairs 字段)
  //   - pending 加 pendingFac 扩展 (preserve v181 _pendingFac 语义: 出山 → ACTIVE in pre-assigned fac, 非 wildPool)

  // initUnits city map: name → city (复用 v181 initUnits literal,跟 main.js L186-227 一致)
  const initUnits = [
    { fac:'wei', city:'xuchang',  members:['曹操','许褚'] },
    { fac:'wei', city:'nanyang',  members:['曹仁','满宠'] },
    { fac:'wei', city:'xiapi',    members:['张辽','乐进'] },
    { fac:'shu', city:'chengdu',  members:['赵云','张翼'] },
    { fac:'shu', city:'xiangyang',members:['关羽','廖化'] },
    { fac:'wu',  city:'jianye',   members:['吕蒙','程普'] },
    { fac:'wu',  city:'hefei',    members:['甘宁','凌统'] },
  ];
  const NAME_TO_INIT_CITY = {};
  initUnits.forEach(u => u.members.forEach(n => { NAME_TO_INIT_CITY[n] = u.city; }));

  // capital fallback per fac (nanman 无 capital → jianning 唯一 nanman city)
  const FAC_CAPITAL = {};
  for (const [cid, c] of Object.entries(sCities)) {
    if (c.isCapital) FAC_CAPITAL[c.fac] = cid;
  }
  FAC_CAPITAL.nanman = FAC_CAPITAL.nanman || 'jianning';

  // INTIMACY_PRESET 任向 lookup
  function lookupIntimacy(a, b) {
    for (const [x, y, v] of data.INTIMACY_PRESET) {
      if ((x === a && y === b) || (x === b && y === a)) return v;
    }
    return 50;  // 默认中性 (1a.3 pragmatic)
  }

  // build relations list 一向 (per design doc §3.4 line 168-171, drop icon)
  function buildRelations(name) {
    const meta = data.GEN_META[name] || data.WILD_GEN_META[name] || {};
    const rels = meta.relations || [];
    return rels.map(r => ({
      target:   r.name,
      type:     r.type,
      intimacy: lookupIntimacy(name, r.name),
    }));
  }

  // retainer fallback
  function buildRetainer(name) {
    const r = data.RETAINER_PRESET[name];
    if (r) return { count: r.count, type: r.type };
    return { count: 0, type: null };
  }

  // wildData bundle for wild/pending (跟 design doc §3.4 line 192-207)
  function buildWildData(name) {
    const meta = data.WILD_GEN_META[name] || data.GEN_META[name] || {};
    return {
      title:    meta.title || null,
      post:     meta.post ? { ...meta.post } : null,
      loyalty:  meta.loyalty != null ? meta.loyalty : 75,
      merit:    data.MERIT_INIT[name] != null ? data.MERIT_INIT[name] : 10,
      retainer: buildRetainer(name),
      relations: buildRelations(name),
      skillsOverride: null,  // 1a 阶段未实装
    };
  }

  // generals 切片
  const sGenerals = {};

  // GENS_FULL → active (minTurn<=1) / pending (minTurn>1 with pendingFac)
  for (const [fid, gens] of Object.entries(data.GENS_FULL)) {
    for (const g of gens) {
      if (sGenerals[g.name]) {
        console.warn(`[extract] DUP general (GENS_FULL): ${g.name} — skipping later occurrence`);
        continue;
      }
      const mt = g.minTurn || 1;
      if (mt > 1) {
        // pending with pendingFac (1a.3 扩展: 出山 → ACTIVE in pre-assigned fac)
        sGenerals[g.name] = {
          status: 'pending',
          fac: 'wild',
          pendingFac: fid,
          availableYear: 214 + Math.floor((mt - 1) / 36),
          wildData: buildWildData(g.name),
        };
      } else {
        // active
        const meta = data.GEN_META[g.name] || {};
        const initCity = NAME_TO_INIT_CITY[g.name];
        const inInitUnit = !!initCity;
        sGenerals[g.name] = {
          status: 'active',
          fac:    fid,
          city:   inInitUnit ? initCity : FAC_CAPITAL[fid],
          role:   g.role === 'ruler' ? 'ruler' : null,
          post:   meta.post ? { ...meta.post } : null,
          title:  meta.title || null,
          loyalty: meta.loyalty != null ? meta.loyalty : 75,
          merit:   data.MERIT_INIT[g.name] != null ? data.MERIT_INIT[g.name] : 20,
          retainer: buildRetainer(g.name),
          initialUnit: inInitUnit,
          relations: buildRelations(g.name),
          skillsOverride: null,
        };
      }
    }
  }

  // WILD_GENS → wild (minTurn<=1) / pending (minTurn>1 无 pendingFac → wildPool when ready)
  for (const g of data.WILD_GENS) {
    if (sGenerals[g.name]) {
      console.warn(`[extract] DUP general (WILD_GENS overrides GENS_FULL?): ${g.name}`);
      continue;
    }
    const mt = g.minTurn || 1;
    if (mt > 1) {
      sGenerals[g.name] = {
        status: 'pending',
        fac: 'wild',
        availableYear: 214 + Math.floor((mt - 1) / 36),
        wildData: buildWildData(g.name),
      };
    } else {
      sGenerals[g.name] = {
        status: 'wild',
        fac: 'wild',
        wildData: buildWildData(g.name),
      };
    }
  }
  // GEN_POOL_INACTIVE 不列 (设计 doc §3.4 line 225)

  const activeCount  = Object.values(sGenerals).filter(g => g.status === 'active').length;
  const wildCount    = Object.values(sGenerals).filter(g => g.status === 'wild').length;
  const pendingCount = Object.values(sGenerals).filter(g => g.status === 'pending').length;
  const pendingFacCount = Object.values(sGenerals).filter(g => g.status === 'pending' && g.pendingFac).length;
  console.log(`[extract] SCENARIO_214.generals built: ${Object.keys(sGenerals).length} entries (active=${activeCount} wild=${wildCount} pending=${pendingCount} 其中 pendingFac=${pendingFacCount})`);

  // SCENARIO_214 整合
  const SCENARIO_214 = {
    id: '214',
    version: '1.0',
    name: '三足鼎立',
    startYear: 214,
    description: '东汉建安十九年,曹操称魏公,刘备入蜀,孙权割据江东,三国鼎足之势已成。',
    provenance: 'project_romance_v181.html 初始 state(initGame + factions.js + military.js AI_PERSONALITY + generals.js FOUNDING_CORE 等 verbatim 抽离)',
    emperor: { cityId: G.emperor.cityId, holder: G.emperor.holder },
    factions: sFactions,
    diplo: sDiplo,
    cities: sCities,
    generals: sGenerals,
  };

  // 写文件
  if (!fs.existsSync(SCENARIO_DIR)) fs.mkdirSync(SCENARIO_DIR, { recursive: true });
  const sJson = JSON.stringify(SCENARIO_214, null, 2);
  const sContent =
`// 214.js
//
// SCENARIO_214 — 三足鼎立(214 年建安十九年)初始 state 切片
//
// 字段:
//   id/version/name/startYear/description/provenance — 元信息
//   emperor                  — {cityId, holder} 天子位置(initGame 字面)
//   factions[fid]            — ruler/playable/type/_baseType/traits/stage/anchorState/
//                              ethos/res/reputation/emperor/techPreunlock/aiPersonality/foundingCore
//   diplo[]                  — 4-tuple [a, b, rel, status] (+ 5th suzerain 当 status='vassal')
//   cities[cid]              — {fac, pop, troops, isCapital} (CITY_BASE 之外的 scenario fields)
//   generals[name]           — status: 'active'|'wild'|'pending';字段按 status 分支
//                              active:  fac/city/role/post/title/loyalty/merit/retainer/initialUnit/relations/skillsOverride
//                              wild:    fac:'wild', wildData{title/post/loyalty/merit/retainer/relations/skillsOverride}
//                              pending: availableYear + wildData + 可选 pendingFac (GENS_FULL minTurn>1)
//
// 来源:阶段 1a.2 由 tools/extract_scenario_214.js 自动抽取
//   - factions: FAC[fid].ruler + PLAYABLE_FACS + FAC_IDENTITY + ETHOS_INIT
//               + G.factions[fid].res + G.reputation + G.emperor + TECH_PREUNLOCK
//               + AI_PERSONALITY + FOUNDING_CORE
//   - diplo:    DIPLO_INIT(一向,materialize 时双向 mirror)
//   - cities:   CITIES_DEF.{fac, pop, troops, isCapital}
//   - emperor:  G.emperor (initGame: { cityId:'ye', holder:'wei' })
//
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3.4。

const SCENARIO_214 = ${sJson};
`;
  const scenarioPath = path.join(SCENARIO_DIR, '214.js');
  fs.writeFileSync(scenarioPath, sContent);
  console.log(`[extract] wrote ${scenarioPath} (${(sContent.length/1024).toFixed(1)} KB)`);

  // 简要统计
  console.log('\n[extract] Summary:');
  console.log(`  GEN_BASE entries:           ${Object.keys(GEN_BASE).length}`);
  console.log(`  CITY_BASE entries:          ${Object.keys(CITY_BASE).length}`);
  console.log(`  FACTION_BASE entries:       ${Object.keys(FACTION_BASE).length}`);
  console.log(`  SCENARIO_214.factions:      ${Object.keys(sFactions).length}`);
  console.log(`  SCENARIO_214.diplo edges:   ${sDiplo.length}`);
  console.log(`  SCENARIO_214.cities:        ${Object.keys(sCities).length}`);
  console.log(`  SCENARIO_214.emperor:       ${JSON.stringify(SCENARIO_214.emperor)}`);
  console.log(`  SCENARIO_214.generals:      ${Object.keys(sGenerals).length} (active=${activeCount} wild=${wildCount} pending=${pendingCount})`);

  dom.window.close();
}

main().catch(err => {
  console.error('[extract] FAIL:', err);
  process.exit(1);
});
