// scenario_advance.js — §8.4 W5b 出场链回归测试
//   验 pending → active 转换 (tick.js:541 path)。
//   策略: initGame(214) → fastForward 推进 N turns 跨过 pending minTurn → 验出场
//     - G.genPendingPool minTurn<=G.turn 的 entries 应清空
//     - G.generals[fid] 应包含原 pendingFac 武将
//     - 0 NaN / nextTurn 不 throw / 出场 chronicle 「迎来新锐」记录正确
//   190 因 pre-existing renderAll bug (W4c memory), 单独跑 initialState 验证 pendingPool 装载,
//     不跑 nextTurn 推进 (避免误归因 W5b)。
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

const SEED = 'project_romance_test_seed_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const TURNS_214 = 200;   // 200 旬 ≈ 5.5 年 — cover 214 大多数 pending (除钟会 261/文鸯 261/羊祜 261)

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
  // codex W5b P3 fix: 等所有 external script load 完 + initGame + 关键 helper 已 hoist
  //   (jsdom resources:'usable' 异步 load, initGame 可能在 chains/general.js 之前 defined →
  //    _deepCloneGen 等可能未就绪)。同时等 load event + helper sentinel 防 race。
  await new Promise((res, rej) => {
    if (window.document.readyState === 'complete') return res();
    window.addEventListener('load', () => res());
    setTimeout(() => rej(new Error('load event timeout')), 15000);
  });
  await waitFor(() => typeof window.initGame === 'function' && typeof window._deepCloneGen === 'function', 5000);
  const expose = window.document.createElement('script');
  expose.textContent = 'window.__getG=()=>G; window.__setFF__=v=>{ _fastForward=!!v; };';
  window.document.head.appendChild(expose);
  return window;
}

async function deepRun214() {
  console.log('--- 214 deep run (initGame + 200 turn fastForward) ---');
  const w = await loadWindow();
  let throws = { init: null, advance: null, advanceCount: 0 };
  try { w.initGame('214'); } catch (e) { throws.init = e.message; }
  const G0 = w.__getG();
  const pendingStart = (G0.genPendingPool || []).map(p => ({ name: p.name, _pendingFac: p._pendingFac, minTurn: p.minTurn }));
  console.log(`  pendingStart=${pendingStart.length} (minTurn 分布: ${pendingStart.map(p => p.minTurn).sort((a,b)=>a-b).join(',')})`);

  w.__setFF__(true);
  for (let i = 1; i <= TURNS_214; i++) {
    try { await w.nextTurn(); }
    catch (e) { throws.advance = `turn ${i}: ${e.message}`; throws.advanceCount = i; break; }
  }
  const G = w.__getG();
  const pendingEnd = (G.genPendingPool || []).map(p => ({ name: p.name, _pendingFac: p._pendingFac, minTurn: p.minTurn }));
  const activeEnd = {};
  for (const fid of Object.keys(G.generals || {})) activeEnd[fid] = (G.generals[fid] || []).map(g => g.name);

  // 验证: pendingStart 中 minTurn <= G.turn 的应该「曾出场」(chronicle 录 迎来新锐 + 不在 pendingEnd)。
  //   inActive 是 soft check: 出场后可能战死/被俘/降, 不卡 PASS。出场事件 (tick.js:572) 录入是
  //   W5b consumer 切换正确性的核心信号 — record 必中, 武将后续状态由 runtime 主宰。
  const expectedArrivals = pendingStart.filter(p => p.minTurn <= G.turn);
  const arrivedOK = [], arrivedFail = [], arrivedSoftFail = [];
  for (const a of expectedArrivals) {
    const stillPending = pendingEnd.some(p => p.name === a.name);
    const inActive = (activeEnd[a._pendingFac] || []).includes(a.name);
    const chronicleHasArrival = (G.genChronicle[a.name] || []).some(e => /迎来新锐/.test(e.text || ''));
    if (!stillPending && chronicleHasArrival) {
      arrivedOK.push(a.name);
      if (!inActive) arrivedSoftFail.push(`${a.name}@${a._pendingFac}(出场后离开 active, runtime 中性)`);
    } else {
      arrivedFail.push({ name: a.name, fac: a._pendingFac, stillPending, inActive, chronicleHasArrival });
    }
  }

  // pending 仍未出场的应该 minTurn > G.turn
  const pendingStillValid = pendingEnd.every(p => p.minTurn > G.turn);

  const nanHits = [];
  scanNaN({ genLoyalty: G.genLoyalty, genMerit: G.genMerit, intimacy: G.intimacy }, '214', nanHits);

  console.log(`  G.turn=${G.turn} (expected ${TURNS_214 + 1})`);
  console.log(`  pending: ${pendingStart.length} → ${pendingEnd.length}; expectedArrivals=${expectedArrivals.length} OK=${arrivedOK.length} HARD-FAIL=${arrivedFail.length} soft-fail=${arrivedSoftFail.length}`);
  console.log(`  pendingStillValid (minTurn > G.turn): ${pendingStillValid}`);
  console.log(`  wildPool=${(G.wildPool || []).length} NaN=${nanHits.length} advance throws: ${throws.advance || 'none'}`);
  if (arrivedOK.length) console.log(`  arrived OK: ${arrivedOK.join(', ')}`);
  if (arrivedSoftFail.length) console.log(`  soft (chronicle 录但出 active): ${arrivedSoftFail.join(', ')}`);
  if (arrivedFail.length) {
    console.log(`  HARD ARRIVAL MISMATCH (${arrivedFail.length}):`);
    arrivedFail.slice(0, 8).forEach(m => console.log(`    ${m.name}@${m.fac} stillPending=${m.stillPending} inActive=${m.inActive} chronicle=${m.chronicleHasArrival}`));
  }

  return {
    turn: G.turn, throws, expectedArrivals: expectedArrivals.length, arrivedOK: arrivedOK.length,
    arrivedFail, pendingStillValid, nanCount: nanHits.length,
  };
}

async function shallowCheck190() {
  console.log('\n--- 190 shallow check (initGame only, pre-existing renderAll bug 不推进) ---');
  const w = await loadWindow();
  let initThrew = null;
  try { w.initGame('190'); } catch (e) { initThrew = e.message; }
  const G = w.__getG();
  const pendingCount = (G.genPendingPool || []).length;
  const wildPoolCount = (G.wildPool || []).length;
  const nanHits = [];
  scanNaN({ genLoyalty: G.genLoyalty, genMerit: G.genMerit, intimacy: G.intimacy }, '190', nanHits);
  console.log(`  initThrew: ${initThrew || 'none'}`);
  console.log(`  pendingPool=${pendingCount} (expect >0 from m.pendingGenPool 93 entries)`);
  console.log(`  wildPool=${wildPoolCount} NaN=${nanHits.length}`);
  const isExpectedThrow = initThrew && initThrew.includes('taxId');
  return { pendingCount, wildPoolCount, nanCount: nanHits.length, initThrew, isExpectedThrow };
}

async function main() {
  console.log(`[advance] seed=${SEED}`);
  const r214 = await deepRun214();
  const r190 = await shallowCheck190();

  let pass = true;
  if (r214.nanCount > 0) { pass = false; console.log('FAIL: 214 NaN'); }
  if (r214.arrivedFail.length > 0) { pass = false; console.log('FAIL: 214 arrival mismatch'); }
  if (r214.throws.advance) { pass = false; console.log('FAIL: 214 advance threw'); }
  if (!r214.pendingStillValid) { pass = false; console.log('FAIL: 214 pendingEnd 有 minTurn <= G.turn 仍卡 pending'); }
  if (r190.nanCount > 0) { pass = false; console.log('FAIL: 190 NaN'); }
  if (r190.pendingCount === 0) { pass = false; console.log('FAIL: 190 pendingPool 空 (m.pendingGenPool consumer 未切换?)'); }
  if (r190.initThrew && !r190.isExpectedThrow) { pass = false; console.log('FAIL: 190 init threw 非 pre-existing (taxId): ' + r190.initThrew); }
  console.log(`\n[advance] ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
