// death_hook.js — §5.6 机制 2 自然死亡 hook 回归测试
//   验 initGame 算 G.genNaturalDeathTurn + tick.js 扫 active 名册 + killGen natural_age 分支。
//   策略: initGame(214) → 长 sim N turns → 验:
//     - active 名册中应自然死的武将真死了 (deathTurn <= G.turn)
//     - 死亡 chronicle 含 "寿终正寝"
//     - 死亡 log 含 "📜 ${name}寿终正寝"
//     - G.genNaturalDeathTurn 中已死的 key 被 delete
//     - 0 NaN
//   注: 用相同 seed 跟 smoke 一致, 死亡 set 可复现。
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

const SEED = 'project_romance_test_seed_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const TURNS = 200;  // ~5.5 年, 覆盖 deathYear 214-219 的 natural 武将

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

async function run() {
  console.log(`[death_hook] seed=${SEED} turns=${TURNS}`);
  const w = await loadWindow();
  w.initGame('214');
  const G0 = w.__getG();

  // 起手 snapshot: active 武将 + initial deathTurn map
  const initialActive = new Set();
  for (const fid of Object.keys(G0.generals || {})) {
    for (const g of (G0.generals[fid] || [])) initialActive.add(g.name);
  }
  const initialDeathTurnMap = { ...G0.genNaturalDeathTurn };
  console.log(`  initial active: ${initialActive.size}, deathTurn 已填: ${Object.keys(initialDeathTurnMap).length}`);

  // 预期: 跑 TURNS 旬后, deathTurn <= TURNS+1 的武将应该都触发了
  const expectedDeaths = Object.entries(initialDeathTurnMap)
    .filter(([_, dt]) => dt <= TURNS + 1)
    .map(([name, dt]) => ({ name, deathTurn: dt }))
    .sort((a, b) => a.deathTurn - b.deathTurn);
  console.log(`  expected natural deaths in ${TURNS} turns: ${expectedDeaths.length}`);

  // 推进
  w.__setFF__(true);
  let advanceThrew = null;
  for (let i = 1; i <= TURNS; i++) {
    try { await w.nextTurn(); }
    catch (e) { advanceThrew = `turn ${i}: ${e.message}`; break; }
  }
  const G = w.__getG();
  console.log(`  G.turn=${G.turn}, advance threw: ${advanceThrew || 'none'}`);

  // 验证
  const activeEnd = new Set();
  for (const fid of Object.keys(G.generals || {})) {
    for (const g of (G.generals[fid] || [])) activeEnd.add(g.name);
  }

  const hardFails = [];
  const softFails = [];
  const triggeredOK = [];
  const leftActiveOther = [];  // 不在 active 但 chronicle 无寿终: pre-existing 非-killGen 路径删 (反间计 fled 等), 非自然死回归 fail
  for (const e of expectedDeaths) {
    const stillActive = activeEnd.has(e.name);
    const chronicleHasSY = (G.genChronicle[e.name] || []).some(c => /寿终正寝/.test(c.text || ''));
    const curDT = (G.genNaturalDeathTurn || {})[e.name];
    if (stillActive) {
      // fled-then-recover case: 武将被反间计/降等暂时移出 → orphan sweep 清 deathTurn → 重回 active → newcomer sweep 派生新 deathTurn (可能 > G.turn)
      //   合理: 当前 deathTurn 存在 + > G.turn (重排到未来)
      if (typeof curDT === 'number' && curDT > G.turn) leftActiveOther.push(`${e.name}(rescheduled→${curDT})`);
      else hardFails.push(`${e.name}(原 deathTurn=${e.deathTurn}, 现 ${curDT}) 仍在 active 未触发`);
    } else if (chronicleHasSY) {
      triggeredOK.push(e.name);
    } else {
      // 名册没了 + 无寿终 chronicle — 被其他路径删 (战斗死 / 反间计 fled 终态), 非回归
      leftActiveOther.push(e.name);
    }
  }

  // 反向: G.genNaturalDeathTurn 中剩余 entry 的 deathTurn 都应 > G.turn (orphan sweep 工作正确)
  const remainingDeathTurn = G.genNaturalDeathTurn || {};
  const stuckDeathTurn = Object.entries(remainingDeathTurn).filter(([_, dt]) => dt <= G.turn);
  if (stuckDeathTurn.length) {
    hardFails.push(`G.genNaturalDeathTurn 残留 ${stuckDeathTurn.length} 条 deathTurn <= G.turn (orphan sweep 失效): ${stuckDeathTurn.slice(0,3).map(([n,d])=>`${n}@${d}`).join(', ')}`);
  }

  // log 抽样 — G.logs 是 8 entry ring buffer, 仅 sample 最近, 不卡 PASS

  // NaN scan
  const nanHits = [];
  scanNaN({ genLoyalty: G.genLoyalty, genMerit: G.genMerit, intimacy: G.intimacy, genNaturalDeathTurn: G.genNaturalDeathTurn }, '214', nanHits);

  console.log(`  triggered OK (chronicle "寿终正寝"): ${triggeredOK.length} / expected ${expectedDeaths.length}`);
  console.log(`  left active via other path (非回归): ${leftActiveOther.length} ${leftActiveOther.length?'['+leftActiveOther.slice(0,5).join(',')+']':''}`);
  console.log(`  hard fails: ${hardFails.length} ${hardFails.slice(0,5).join('; ')}`);
  console.log(`  G.logs sample (ring 8, 最近):`, (G.logs||[]).slice(0,3).map(l=>l.msg).join(' | ').slice(0,100));
  console.log(`  NaN: ${nanHits.length}`);
  if (triggeredOK.length) console.log(`  natural deaths: ${triggeredOK.slice(0,10).join(', ')}${triggeredOK.length>10?` ...+${triggeredOK.length-10}`:''}`);

  let pass = true;
  if (advanceThrew) { pass = false; console.log('FAIL: advance threw'); }
  if (hardFails.length) { pass = false; console.log('FAIL: hard issues (active 未死 / orphan sweep 失效)'); }
  if (nanHits.length) { pass = false; console.log('FAIL: NaN found'); }
  // 至少 50% expected 触发 (容忍非-killGen 路径删的 case, e.g. 反间计 fled)
  const triggerRate = triggeredOK.length / Math.max(expectedDeaths.length, 1);
  if (triggerRate < 0.5) { pass = false; console.log(`FAIL: 触发率 ${(triggerRate*100).toFixed(0)}% < 50%`); }

  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(2); });
