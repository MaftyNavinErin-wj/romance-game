// dump_w5a.js — §8.4 W5a 安全网: dump initGame 后的 在野/待出场池 + meta + 受影响 G state (214 + 190)
//   用法: node tools/dump_w5a.js <out.json>
//   配合 git stash 做 W5a-tree vs main-HEAD 全 G dump 审差异 (W4+ 网: byte-identical 必破)。
//   W5a 关键 delta:
//     - G._wildGenDefs / G.wildPool — applyScenario backing 切 m.WILD_GENS, minTurn 由 availableYear 算 (vs legacy 手填差 8 旬)
//     - G.genPendingPool — main.js:99-112 仍扫 m.GENS_FULL (W5b 切), W5a 不变
//     - G.intimacy — W5a 修 wildData.relations 漏扫, 新增 wild/pending intimacy pair
//     - G.genLoyalty / loyaltyAccum — wild段 meta 现 composite, loyalty 字段从 wildData 来
//     - G.genRetainers — W5a 扩 m.initialRetainers wild段, 现 wild武将 retainer 进 init loop
//     - G.genMerit — main wild merit loop 仍 legacy (W5b 切), 但 W5a 扩 m.initialMerit wild段
//     - chronicleText — 「仕于facName」F-W4c-3 (W5b 修) wild武将 facName=undefined
//   harness 沿用 dump_w4c.js。
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('../tests/vendor/seedrandom.js');

const SEED = 'project_romance_test_seed_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const OUT = process.argv[2] || 'tools/w5a_dump.json';

function scanNaN(obj, pathStr, hits) {
  if (obj == null) return;
  if (typeof obj === 'number') { if (Number.isNaN(obj)) hits.push(pathStr); return; }
  if (typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) scanNaN(obj[k], pathStr + '.' + k, hits);
}
function waitFor(cond, ms) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    (function loop() {
      if (cond()) return res();
      if (Date.now() - t0 > ms) return rej(new Error('waitFor timeout'));
      setTimeout(loop, 20);
    })();
  });
}

async function loadWindow() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window) {
      window.Math.random = seedrandom(SEED);
      window.__SMOKE_TEST__ = true;
      window.addEventListener('error', () => {});
    },
  });
  const window = dom.window;
  await waitFor(() => typeof window.initGame === 'function', 10000);
  const expose = window.document.createElement('script');
  expose.textContent = 'window.__getG=()=>G; window.__getM=()=>_scenarioMaterialized;';
  window.document.head.appendChild(expose);
  return window;
}

async function dumpScenario(scenarioId) {
  const window = await loadWindow();
  let initGameThrew = null;
  try { window.initGame(scenarioId); }
  catch (e) { initGameThrew = e.message; }
  const G = window.__getG();
  const M = window.__getM();
  const chronicleText = {};
  for (const [name, arr] of Object.entries(G.genChronicle || {})) {
    chronicleText[name] = (arr && arr.length) ? arr.map(e => e.text).join(' | ') : '';
  }
  // 单独 dump 在野/待出场关键 state — 名册数 + minTurn 分布
  const wildDefsNames = Object.keys(G._wildGenDefs || {}).sort();
  const wildDefsMinTurn = {};
  for (const n of wildDefsNames) wildDefsMinTurn[n] = G._wildGenDefs[n].minTurn;
  const pendingPoolEntries = (G.genPendingPool || []).map(p => ({
    name: p.name, minTurn: p.minTurn, _pendingFac: p._pendingFac,
  })).sort((a,b) => a.name.localeCompare(b.name));
  const dump = {
    initGameThrew,
    turn: G.turn,
    // —— W5a 直接受影响 ——
    wildDefsCount: wildDefsNames.length,
    wildDefsNames,
    wildDefsMinTurn,
    wildPool: [...(G.wildPool || [])].sort(),
    wildPoolCount: (G.wildPool || []).length,
    pendingPoolCount: (G.genPendingPool || []).length,
    pendingPoolEntries,
    // —— ripple effect ——
    genLoyalty:   { ...G.genLoyalty },
    loyaltyAccum: { ...G.loyaltyAccum },
    intimacy:     { ...G.intimacy },
    genMerit:     { ...G.genMerit },
    genRetainers: { ...G.genRetainers },
    chronicleText,
    counts: {
      genLoyalty:   Object.keys(G.genLoyalty || {}).length,
      loyaltyAccum: Object.keys(G.loyaltyAccum || {}).length,
      intimacy:     Object.keys(G.intimacy || {}).length,
      chronicle:    Object.keys(G.genChronicle || {}).length,
      genMerit:     Object.keys(G.genMerit || {}).length,
      genRetainers: Object.keys(G.genRetainers || {}).length,
    },
    // —— materialized stats ——
    mWildGensCount: (M && M.WILD_GENS) ? M.WILD_GENS.length : null,
    mPendingPoolCount: (M && M.pendingGenPool) ? M.pendingGenPool.length : null,
    mWildMetaCount: (M && M.wildMeta) ? Object.keys(M.wildMeta).length : null,
    mIntimacyPairsCount: (M && M.initialIntimacyPairs) ? M.initialIntimacyPairs.length : null,
    mInitialMeritCount: (M && M.initialMerit) ? Object.keys(M.initialMerit).length : null,
    mInitialRetainersCount: (M && M.initialRetainers) ? Object.keys(M.initialRetainers).length : null,
  };
  const nanHits = [];
  scanNaN({
    genLoyalty: dump.genLoyalty, loyaltyAccum: dump.loyaltyAccum,
    intimacy: dump.intimacy, genMerit: dump.genMerit, genRetainers: dump.genRetainers,
    wildDefsMinTurn,
  }, scenarioId, nanHits);
  dump.nanHits = nanHits;
  return dump;
}

async function main() {
  const out = {};
  for (const sid of ['214', '190']) out[sid] = await dumpScenario(sid);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  for (const sid of ['214', '190']) {
    const d = out[sid];
    console.log(`[${sid}] wildDefs=${d.wildDefsCount} wildPool=${d.wildPoolCount} pendingPool=${d.pendingPoolCount} ` +
      `genLoyalty=${d.counts.genLoyalty} intimacy=${d.counts.intimacy} chronicle=${d.counts.chronicle} ` +
      `genMerit=${d.counts.genMerit} genRetainers=${d.counts.genRetainers} ` +
      `NaN=${d.nanHits.length} initGameThrew=${d.initGameThrew ? 'Y' : 'N'}`);
    console.log(`     m.WILD_GENS=${d.mWildGensCount} m.pendingPool=${d.mPendingPoolCount} m.wildMeta=${d.mWildMetaCount} ` +
      `m.intimacyPairs=${d.mIntimacyPairsCount} m.initialMerit=${d.mInitialMeritCount} m.initialRetainers=${d.mInitialRetainersCount}`);
    if (d.nanHits.length) console.log('   NaN hits:', d.nanHits.slice(0, 12));
    if (d.initGameThrew) console.log('   initGame err:', d.initGameThrew);
  }
  console.log('[dump] wrote', OUT);
}
main().catch(e => { console.error(e); process.exit(1); });
