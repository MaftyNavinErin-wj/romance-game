// smoke.js — Project Romance v181 行为不变性测试 第一层
//
// 流程:
//   1. 用 jsdom 加载 project_romance_v181.html
//   2. 在脚本执行前注入 seedrandom(确定性 Math.random)
//   3. stub 动画 / setTimeout 立即触发
//   4. 等 initGame 完成
//   5. 模拟 50 turn(每 turn 末调 captureState 抓快照)
//   6. 输出 tests/current.json
//
// 用法:
//   npm install jsdom        # 一次性
//   node tests/smoke.js

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

// ─────────────────────────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────────────────────────

const SEED      = 'project_romance_test_seed_001';
const NUM_TURNS = 50;
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const OUT_PATH  = path.resolve(__dirname, 'current.json');

// ─────────────────────────────────────────────────────────────────
// 状态采样:第一层 10 类字段
// 实测 G 真实结构后会校准这里(见 tests/README.md「字段命名校准」段)
// ─────────────────────────────────────────────────────────────────

function safe(obj, key, fallback) {
  return (obj != null && key in obj) ? obj[key] : fallback;
}

function captureState(G) {
  if (!G) return { error: 'G is undefined' };

  // 1. factions[].{gold/grain/wood/iron/troops_total} + 2. ethos + 3. reputation
  const factions = (G.factions || []).map(f => ({
    id:   safe(f, 'id', null),
    gold: safe(f, 'gold', 0),
    grain:safe(f, 'grain', 0),
    wood: safe(f, 'wood', 0),
    iron: safe(f, 'iron', 0),
    troops_total: safe(f, 'troops_total', safe(f, 'troopsTotal', 0)),
    ethos: f.ethos ? {
      benevolence: safe(f.ethos, 'benevolence', 0),
      order:       safe(f.ethos, 'order', 0),
      legitimacy:  safe(f.ethos, 'legitimacy', 0),
      martial:     safe(f.ethos, 'martial', 0),
    } : null,
    reputation: safe(f, 'reputation', 0),
  }));

  // 4. cities[].{fac/occupied/troops} + 5. cities[].income_last_turn
  const cities = (G.cities || []).map(c => ({
    id: safe(c, 'id', null),
    fac: safe(c, 'fac', null),
    occupied: safe(c, 'occupied', null),
    troops: safe(c, 'troops', 0),
    income_last_turn: safe(c, 'income_last_turn', safe(c, 'incomeLastTurn', null)),
  }));

  // 6. diplo[].{a, b, status, rel}
  const diplo = (G.diplo || []).map(d => ({
    a: safe(d, 'a', null),
    b: safe(d, 'b', null),
    status: safe(d, 'status', null),
    rel: safe(d, 'rel', null),
  }));

  // 7. generals[].{fac, post, loyalty, factionMod, status, lvl}
  const generals = (G.generals || []).map(g => ({
    name: safe(g, 'name', safe(g, 'id', null)),
    fac: safe(g, 'fac', null),
    post: safe(g, 'post', null),
    loyalty: safe(g, 'loyalty', null),
    factionMod: safe(g, 'factionMod', null),
    status: safe(g, 'status', null),
    lvl: safe(g, 'lvl', null),
  }));

  // 8. units[].{fac, city, lvl, morale, troops}
  const units = (G.units || []).map(u => ({
    id: safe(u, 'id', null),
    fac: safe(u, 'fac', null),
    city: safe(u, 'city', null),
    lvl: safe(u, 'lvl', null),
    morale: safe(u, 'morale', null),
    troops: safe(u, 'troops', null),
  }));

  // 9. eventLog 累计
  const eventLog = Array.isArray(G.eventLog) ? G.eventLog.slice() : [];

  // 10. G 顶层
  const top = {
    turn: safe(G, 'turn', null),
    currentEvent: safe(G, 'currentEvent', null),
    eventQueueLen: Array.isArray(G._eventQueue) ? G._eventQueue.length : null,
    eventPromisesLen: Array.isArray(G._eventPromises) ? G._eventPromises.length : null,
  };

  return { factions, cities, diplo, generals, units, eventLog, top };
}

// ─────────────────────────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[smoke] seed=${SEED} turns=${NUM_TURNS}`);
  console.log(`[smoke] loading ${HTML_PATH}`);

  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // ---- 准备 jsdom ----
  // 关键:beforeParse 钩子里替换 Math.random,确保 v181 内联 <script> 执行时拿到 seeded random
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window) {
      // 1. 注入 seedrandom
      const rng = seedrandom(SEED);
      window.Math.random = rng;
      // 2. 标记测试模式(供 v181 内可能的 hook 使用,目前 v181 无此 hook)
      window.__SMOKE_TEST__ = true;
      window.__SMOKE_SEED__ = SEED;
      // 3. setTimeout / setInterval 改为立即触发(可选 — 先观察是否需要)
      //    暂不开,等 F5 实测看是否卡住再开
    },
  });

  const window = dom.window;

  // ---- 等 initGame 完成 ----
  // v181 用 DOMContentLoaded → 先调内部 init,再绑定按钮
  // 这里用 polling:等 window.G 出现且 G.turn 已初始化
  console.log('[smoke] waiting for initGame...');
  await waitFor(() => window.G && typeof window.G.turn === 'number', 10000);
  console.log(`[smoke] initGame done, G.turn=${window.G.turn}`);

  // ---- 采样初始状态(turn 0)----
  const snapshots = [];
  snapshots.push({ turn_index: 0, state: captureState(window.G) });

  // ---- 跑 50 turn ----
  for (let i = 1; i <= NUM_TURNS; i++) {
    if (typeof window.nextTurn !== 'function') {
      throw new Error(`window.nextTurn is not a function at turn ${i}`);
    }
    await window.nextTurn();
    snapshots.push({ turn_index: i, state: captureState(window.G) });
    if (i % 10 === 0) console.log(`[smoke] turn ${i} done, G.turn=${window.G.turn}`);
  }

  // ---- 写入 current.json ----
  const out = {
    meta: {
      seed: SEED,
      turns: NUM_TURNS,
      v181_html: path.basename(HTML_PATH),
      generated_at: new Date().toISOString(),
    },
    snapshots,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`[smoke] wrote ${OUT_PATH} (${snapshots.length} snapshots)`);

  dom.window.close();
}

function waitFor(pred, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try {
        if (pred()) return resolve();
      } catch (_) { /* swallow */ }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('waitFor timeout after ' + timeoutMs + 'ms'));
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}

main().catch(err => {
  console.error('[smoke] FAILED:', err.stack || err.message);
  process.exit(1);
});
