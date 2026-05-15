// dump_w4c.js — §8.4 W4c 安全网: dump initGame 后的 关系/亲密度/meta/小传/忠诚 state (214 + 190)
//   用法: node tools/dump_w4c.js <out.json>
//   配合 git stash 做 W4c-tree vs main-HEAD 全 G dump 审差异 (W4 网: byte-identical 必破)。
//   注: initGame 末尾 renderAll 对 scenario 190 会撞 pre-existing render bug
//   (_renderCityList 读 legacy JUNS) — 与 W4c 无关。renderAll 是 initGame 最后一句,
//   G state 此时已完整 build, 故 catch 后照常 dump G。
//   harness 结构沿用 tools/dump_w4b.js。
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('../tests/vendor/seedrandom.js');

const SEED = 'project_romance_test_seed_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const OUT = process.argv[2] || 'tools/w4c_dump.json';

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
      window.addEventListener('error', () => {}); // 静默 render 错误
    },
  });
  const window = dom.window;
  await waitFor(() => typeof window.initGame === 'function', 10000);
  const expose = window.document.createElement('script');
  expose.textContent = 'window.__G__=G;';
  window.document.head.appendChild(expose);
  return window;
}

async function dumpScenario(scenarioId) {
  const window = await loadWindow();
  let initGameThrew = null;
  try { window.initGame(scenarioId); }
  catch (e) { initGameThrew = e.message; } // renderAll 撞 190 pre-existing bug — G 已 build 完
  const G = window.__G__;
  // 小传只 dump 开局那条 (initGame 末 addGenChronicle), text 是 meta/tags 派生 — 审差异关键
  const chronicleText = {};
  for (const [name, arr] of Object.entries(G.genChronicle || {})) {
    chronicleText[name] = (arr && arr.length) ? arr.map(e => e.text).join(' | ') : '';
  }
  const dump = {
    initGameThrew,
    turn: G.turn,
    genLoyalty:   { ...G.genLoyalty },
    loyaltyAccum: { ...G.loyaltyAccum },
    intimacy:     { ...G.intimacy },
    chronicleText,
    counts: {
      genLoyalty:   Object.keys(G.genLoyalty || {}).length,
      loyaltyAccum: Object.keys(G.loyaltyAccum || {}).length,
      intimacy:     Object.keys(G.intimacy || {}).length,
      chronicle:    Object.keys(G.genChronicle || {}).length,
    },
  };
  const nanHits = [];
  scanNaN({ genLoyalty: dump.genLoyalty, loyaltyAccum: dump.loyaltyAccum, intimacy: dump.intimacy }, scenarioId, nanHits);
  dump.nanHits = nanHits;
  return dump;
}

async function main() {
  const out = {};
  for (const sid of ['214', '190']) out[sid] = await dumpScenario(sid);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  for (const sid of ['214', '190']) {
    const d = out[sid];
    console.log(`[${sid}] genLoyalty=${d.counts.genLoyalty} loyaltyAccum=${d.counts.loyaltyAccum} ` +
      `intimacy=${d.counts.intimacy} chronicle=${d.counts.chronicle} ` +
      `NaN=${d.nanHits.length} initGameThrew=${d.initGameThrew ? 'Y' : 'N'}`);
    if (d.nanHits.length) console.log('   NaN hits:', d.nanHits.slice(0, 12));
    if (d.initGameThrew) console.log('   initGame err:', d.initGameThrew);
  }
  console.log('[dump] wrote', OUT);
}
main().catch(e => { console.error(e); process.exit(1); });
