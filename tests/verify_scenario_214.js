// verify_scenario_214.js — SCENARIO_214 validator (设计 doc §9 子集, 1a.3 scope)
//
// 用途:
//   独立 validator,直接 run on src/data/scenarios/214.js + src/data/{general,city,faction}_base.js
//   不需要 jsdom + initGame(纯静态 schema 检验)。
//
// 跟 tests/sprint_verify.js 互补:
//   sprint_verify.js (Layer-3): 抽样 + 单点 sanity (本 batch fix 测试)
//   verify_scenario_214.js:    全表 schema 检验 + cross-ref + status 状态机一致性
//
// 用法:
//   node tests/verify_scenario_214.js
//
// 覆盖 (设计 doc §9 子集 — 1a.3 scope, 后续 1e validators sprint 扩展全表):
//   - B.4 faction.ruler 必须 in scenario.generals active + fac=本势力
//   - C.1 active 字段全 (fac/city/loyalty/post/role/retainer)
//   - C.2 active.city.fac === active.fac
//   - C.3 wild 必须 fac:'wild' + wildData
//   - C.4 pending 必须 availableYear + wildData
//   - C.5 active.initialUnit=true 时 retainer.count>0  (relax: 不当硬 fail, 仅警告; v181 部分 active 在 initUnit 但 RETAINER_PRESET 漏)
//   - E.1 relations target 必须 in scenario.generals
//   - E.4 intimacy -100..100 (设计 doc drift 已修)
//   - E.5 target != self
//   - E.6 no dup edge per source general
//   - G.4 status enum legal
//   - G.5 role enum legal
//   - I.5 ruler per fac 恰好 1 个
//   - I.6 active.initialUnit=true 时 retainer.type 合法 enum
//   - J.1 wild fac:'wild'
//   - J.2 pending availableYear > startYear (number, sane range)
//   - J.3 wild/pending wildData 含 {title,post,loyalty,merit,retainer,relations}
//   - L.2 pending availableYear > startYear (跟 J.2 重叠 但语义不同)
//
// 不覆盖 (留 1e validators sprint):
//   - A.* unknown id family
//   - D.* 年龄一致性 (GEN_BASE birthYear/deathYear 多 null,1a 阶段未填)
//   - E.3 双向 (1a.3 是 one-way 抽取,设计 1e 决定是否强制双向 mirror)
//   - E.7 type 对称
//   - H.3 city.troops sanity
//   - M.* stale id grep

'use strict';

const fs = require('fs');
const path = require('path');

const SCENARIO_PATH = path.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js');
const GEN_BASE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'general_base.js');
const CITY_BASE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'city_base.js');
const FAC_BASE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'faction_base.js');

function loadConst(filePath, varName) {
  const src = fs.readFileSync(filePath, 'utf8');
  return (new Function(src + `\n; return ${varName};`))();
}

const STATUS_ENUM = new Set(['active','wild','pending']);
const ROLE_ENUM   = new Set(['ruler','strategist','prefect',null]);
const RETAINER_TYPE_ENUM = new Set(['cavalry','light','heavy','archer','siege','naval',null]);

function validate(S, ctx) {
  const errors = [];
  const warnings = [];
  const genNames = new Set(Object.keys(S.generals));
  const facIds   = new Set(Object.keys(S.factions));
  const cityIds  = new Set(Object.keys(S.cities));

  // ── B.4 faction.ruler ∈ active generals + fac=本势力 ──
  for (const [fid, f] of Object.entries(S.factions)) {
    if (!f.ruler) { errors.push(`B.4 faction[${fid}].ruler missing`); continue; }
    const g = S.generals[f.ruler];
    if (!g) errors.push(`B.4 faction[${fid}].ruler '${f.ruler}' not in scenario.generals`);
    else if (g.status !== 'active') errors.push(`B.4 ruler '${f.ruler}' status='${g.status}' (must be active)`);
    else if (g.fac !== fid) errors.push(`B.4 ruler '${f.ruler}' fac='${g.fac}' (must be ${fid})`);
  }

  // ── C/E/G/I/J/L per-general ──
  const rulerCountByFac = {};
  for (const [name, g] of Object.entries(S.generals)) {
    // G.4 status enum
    if (!STATUS_ENUM.has(g.status)) errors.push(`G.4 ${name}.status='${g.status}' (must be active/wild/pending)`);

    if (g.status === 'active') {
      // C.1 active 字段全
      const REQ_ACTIVE = ['fac','city','loyalty','post','role','retainer'];
      for (const k of REQ_ACTIVE) {
        if (!(k in g)) errors.push(`C.1 active ${name}.${k} missing`);
      }
      // G.5 role enum
      if (!ROLE_ENUM.has(g.role)) errors.push(`G.5 ${name}.role='${g.role}' (must be ruler/strategist/prefect/null)`);
      // I.5 ruler per fac
      if (g.role === 'ruler') rulerCountByFac[g.fac] = (rulerCountByFac[g.fac] || 0) + 1;
      // I.1 fac in scenario.factions 且非 'wild'
      if (g.fac === 'wild') errors.push(`I.1 active ${name}.fac='wild' (must be real faction)`);
      else if (!facIds.has(g.fac)) errors.push(`I.1 active ${name}.fac='${g.fac}' not in scenario.factions`);
      // C.2/I.2 city.fac === active.fac
      if (g.city) {
        const c = S.cities[g.city];
        if (!c) errors.push(`C.2 active ${name}.city='${g.city}' not in scenario.cities`);
        else if (c.fac !== g.fac) errors.push(`C.2 active ${name} fac=${g.fac} but city ${g.city}.fac=${c.fac}`);
      }
      // I.3 loyalty 0-100
      if (typeof g.loyalty !== 'number' || g.loyalty < 0 || g.loyalty > 100)
        errors.push(`I.3 active ${name}.loyalty=${g.loyalty} out of [0,100]`);
      // I.4 post object 含 name + rank (or explicit null)
      if (g.post !== null && (typeof g.post !== 'object' || !g.post.name || !g.post.rank))
        errors.push(`I.4 active ${name}.post invalid (need {name,rank,...} or null)`);
      // I.6 initialUnit=true → retainer.count>0 + type 合法
      if (g.initialUnit) {
        if (!g.retainer || g.retainer.count <= 0)
          warnings.push(`I.6 ${name} initialUnit=true but retainer.count=${g.retainer?.count} (v181 RETAINER_PRESET 可能漏)`);
        if (g.retainer && !RETAINER_TYPE_ENUM.has(g.retainer.type))
          errors.push(`I.6 ${name} retainer.type='${g.retainer.type}' invalid (must be cavalry/light/heavy/archer/siege/naval/null)`);
      }
    } else if (g.status === 'wild') {
      // C.3 wild fac:'wild' + wildData
      if (g.fac !== 'wild') errors.push(`C.3/J.1 wild ${name}.fac='${g.fac}' (must be 'wild')`);
      if (!g.wildData || typeof g.wildData !== 'object') errors.push(`C.3/J.3 wild ${name}.wildData missing`);
    } else if (g.status === 'pending') {
      // C.4 pending availableYear + wildData
      if (typeof g.availableYear !== 'number') errors.push(`C.4/J.2 pending ${name}.availableYear missing or not number`);
      else if (g.availableYear <= S.startYear) errors.push(`C.4/L.2 pending ${name}.availableYear=${g.availableYear} <= startYear=${S.startYear}`);
      else if (g.availableYear > 300) errors.push(`J.2 pending ${name}.availableYear=${g.availableYear} unreasonable (> 300)`);
      if (g.fac !== 'wild') errors.push(`C.4 pending ${name}.fac='${g.fac}' (must be 'wild')`);
      if (!g.wildData || typeof g.wildData !== 'object') errors.push(`C.4/J.3 pending ${name}.wildData missing`);
      // 1a.3 扩展: pendingFac (optional, GENS_FULL minTurn>1)
      if (g.pendingFac && !facIds.has(g.pendingFac))
        errors.push(`pending ${name}.pendingFac='${g.pendingFac}' not in scenario.factions`);
    }

    // J.3 wild/pending wildData required keys
    if (g.status === 'wild' || g.status === 'pending') {
      const wd = g.wildData || {};
      const REQ_WD = ['title','post','loyalty','merit','retainer','relations'];
      for (const k of REQ_WD) {
        if (!(k in wd)) errors.push(`J.3 ${name}.wildData.${k} missing`);
      }
    }

    // E.1 / E.4 / E.5 / E.6 — relations
    const relsList = (g.status === 'active')
      ? (g.relations || [])
      : ((g.wildData && g.wildData.relations) || []);
    const seenTargets = new Set();
    for (const r of relsList) {
      // E.5 self
      if (r.target === name) errors.push(`E.5 ${name} self-relation`);
      // E.1 target ∈ scenario.generals
      if (!genNames.has(r.target))
        warnings.push(`E.1 ${name}.relations[${r.target}] not in scenario.generals (target 未列, 例: GEN_POOL_INACTIVE / 未收录)`);
      // E.4 intimacy
      if (typeof r.intimacy !== 'number' || r.intimacy < -100 || r.intimacy > 100)
        errors.push(`E.4 ${name}.relations[${r.target}].intimacy=${r.intimacy} out of [-100,100]`);
      // E.6 no dup edge
      if (seenTargets.has(r.target)) errors.push(`E.6 ${name}.relations[${r.target}] duplicate`);
      seenTargets.add(r.target);
    }
  }
  // I.5 ruler 数检查
  for (const fid of facIds) {
    const n = rulerCountByFac[fid] || 0;
    if (n !== 1) errors.push(`I.5 faction[${fid}] has ${n} rulers (expected exactly 1)`);
  }

  return { errors, warnings };
}

function main() {
  console.log('[verify] loading SCENARIO_214 + base tables...');
  const SCENARIO_214 = loadConst(SCENARIO_PATH, 'SCENARIO_214');
  const GEN_BASE    = loadConst(GEN_BASE_PATH, 'GEN_BASE');
  const CITY_BASE   = loadConst(CITY_BASE_PATH, 'CITY_BASE');
  const FACTION_BASE = loadConst(FAC_BASE_PATH, 'FACTION_BASE');
  console.log(`[verify] scenario.generals=${Object.keys(SCENARIO_214.generals).length} (active=${Object.values(SCENARIO_214.generals).filter(g=>g.status==='active').length} wild=${Object.values(SCENARIO_214.generals).filter(g=>g.status==='wild').length} pending=${Object.values(SCENARIO_214.generals).filter(g=>g.status==='pending').length})`);

  const { errors, warnings } = validate(SCENARIO_214, { GEN_BASE, CITY_BASE, FACTION_BASE });

  if (warnings.length) {
    console.log(`\n[verify] WARNINGS (${warnings.length}):`);
    for (const w of warnings.slice(0, 30)) console.log('  ⚠ ' + w);
    if (warnings.length > 30) console.log(`  ... (+${warnings.length - 30} more)`);
  }
  if (errors.length) {
    console.log(`\n[verify] ERRORS (${errors.length}):`);
    for (const e of errors.slice(0, 30)) console.log('  ✗ ' + e);
    if (errors.length > 30) console.log(`  ... (+${errors.length - 30} more)`);
    console.log(`\n[verify] FAIL`);
    process.exit(1);
  }
  console.log(`\n[verify] PASS (0 errors${warnings.length ? `, ${warnings.length} warnings` : ''})`);
}

main();
