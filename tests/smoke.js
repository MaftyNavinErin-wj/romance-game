// smoke.js — Project Romance v181 行为不变性测试 第一层
//
// 流程:
//   1. 用 jsdom 加载 project_romance_v181.html
//   2. 在脚本执行前注入 seedrandom(确定性 Math.random)
//   3. 注入新 <script> 把 let G 暴露到 window.__G__
//   4. 显式调 initGame()
//   5. 模拟 50 turn(每 turn 末调 captureState 抓快照)
//   6. 输出 tests/current.json
//
// !!! 字段命名校准 !!!
// REFACTOR_PLAN §四 写的字段名与 v181 真实结构大幅不一致,见 tests/README.md「字段命名校准」段。
// 本 captureState 按 v181 真实结构抓,不按文档抓。

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

// ─────────────────────────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────────────────────────

const SEED      = 'project_romance_test_seed_001';
const NUM_TURNS = 50;
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const OUT_PATH  = path.resolve(__dirname, 'current.json');

// ─────────────────────────────────────────────────────────────────
// 状态采样
//
// 第一层(原 10 类核心字段,phase 0 实装):
//   factions / cities / diplo / generals / units / logs / top
//   字段映射详见 tests/README.md §三
//
// 第二层(phase 2.0 升级 — 决策路径采样):
//   - cityChangeLog: count + recent 5 entries
//   - genFactionModLog: count + recent 5 entries (flattened across all gens)
//   - eventQueue: full ID array + queue head detail
//   覆盖事件触发顺序 / 城市易主路径 / 武将派系修正路径,为 phase 2 渲染抽离
//   提供时序不变性安全网。设计参考见 phase1_summary §五的 baseline 探测产出。
// ─────────────────────────────────────────────────────────────────

function pick(obj, keys) {
  if (obj == null) return null;
  const out = {};
  for (const k of keys) out[k] = (k in obj) ? obj[k] : null;
  return out;
}

function captureState(G) {
  if (!G) return { error: 'G is undefined' };

  // 1+2+3. factions
  const factions = {};
  for (const fid of Object.keys(G.factions || {})) {
    const f = G.factions[fid];
    if (!f) { factions[fid] = null; continue; }
    factions[fid] = {
      res: pick(f.res || {}, ['gold', 'wood', 'iron', 'horses']),
      cityCount: f.cityCount ?? null,
      totalTroops: f.totalTroops ?? null,
      totalPop: f.totalPop ?? null,
      taxId: f.taxId ?? null,
      policyId: f.policyId ?? null,
      corveeId: f.corveeId ?? null,
      strategist: f.strategist ?? null,
      ethos: pick(f.ethos || {}, ['mandate', 'power', 'civil', 'military', 'strategy']),
      reputation: (G.reputation && G.reputation[fid]) ?? null,
    };
  }

  // 4+5. cities
  const cities = {};
  for (const cid of Object.keys(G.cities || {})) {
    const c = G.cities[cid];
    if (!c) { cities[cid] = null; continue; }
    cities[cid] = {
      fac: c.fac ?? null,
      occupied: c.occupied ?? null,
      troops: c.troops ?? 0,
      storage: c.storage ?? null,
      pop: c.pop ?? null,
      morale: c.morale ?? null,
      siegeDecay: c.siegeDecay ?? null,
      prefect: c.prefect ?? null,
      garrison: c.garrison ?? null,
    };
  }

  // 6. diplo
  const diplo = {};
  for (const key of Object.keys(G.diplo || {})) {
    const d = G.diplo[key];
    if (!d) { diplo[key] = null; continue; }
    diplo[key] = {
      status: d.status ?? null,
      rel: d.rel ?? null,
      suzerain: d.suzerain ?? null,
    };
  }

  // 7. generals — 把武将运行时状态从 G 顶层多张 map 聚合到每个武将
  // generals[fid] 是数组,每个元素 {name, com, war, int, pol, cha, role, apt}
  const generals = {};
  for (const fid of Object.keys(G.generals || {})) {
    const arr = G.generals[fid];
    if (!Array.isArray(arr)) { generals[fid] = null; continue; }
    generals[fid] = arr.map(g => {
      const name = g.name;
      return {
        name,
        role: g.role ?? null,
        // base stats(只抓数值类,com/war/int/pol/cha 是基础属性,但 v181 也有成长机制)
        com: g.com ?? null, war: g.war ?? null, int: g.int ?? null, pol: g.pol ?? null, cha: g.cha ?? null,
        // 运行时状态从 G 顶层多张 map 聚合
        post:        (G.genPost        && G.genPost[name])        ?? null,
        loyalty:     (G.genLoyalty     && G.genLoyalty[name])     ?? null,
        factionMod:  (G.genFactionMod  && G.genFactionMod[name])  ?? null,
        wounded:     (G.genWounded     && G.genWounded[name])     ?? null,
        joinTurn:    (G.genJoinTurn    && G.genJoinTurn[name])    ?? null,
        joinSource:  (G.genJoinSource  && G.genJoinSource[name])  ?? null,
        merit:       (G.genMerit       && G.genMerit[name])       ?? null,
        winCount:    (G.genWinCount    && G.genWinCount[name])    ?? null,
      };
    });
  }

  // 8. units — squads 是子部队列表
  const units = (G.units || []).map(u => ({
    id: u.id ?? null,
    fac: u.fac ?? null,
    hq: u.hq ?? null,
    hr: u.hr ?? null,
    status: u.status ?? null,
    level: u.level ?? null,
    exp: u.exp ?? null,
    mobilizingTurns: u.mobilizingTurns ?? null,
    movePath: Array.isArray(u.movePath) ? u.movePath.slice() : null,
    squads: Array.isArray(u.squads) ? u.squads.map(sq => ({
      genName: sq.genName ?? null,
      type: sq.type ?? null,
      troops: sq.troops ?? null,
      maxTroops: sq.maxTroops ?? null,
      morale: sq.morale ?? null,
    })) : null,
  }));

  // 9. logs — 替代文档的 eventLog
  const logs = Array.isArray(G.logs) ? G.logs.map(l => ({
    msg: l.msg ?? null,
    type: l.type ?? null,
  })) : [];

  // 10. G 顶层
  const top = {
    turn: G.turn ?? null,
    year: G.year ?? null,
    seasonIdx: G.seasonIdx ?? null,
    pendingEvent: G._pendingEvent ?? null,
    eventQueueLen: Array.isArray(G._eventQueue) ? G._eventQueue.length : null,
    eventPromisesLen: Array.isArray(G._eventPromises) ? G._eventPromises.length : null,
    eventCooldown: G._eventCooldown ?? null,
    eventCatCooldown: G._eventCatCooldown ?? null,
    cityChangeLogLen: Array.isArray(G._cityChangeLog) ? G._cityChangeLog.length : null,
    transfersLen: Array.isArray(G.transfers) ? G.transfers.length : null,
    wildPoolLen: Array.isArray(G.wildPool) ? G.wildPool.length : null,
  };

  // ── 第二层(phase 2.0):决策路径采样 ──

  // (a) cityChangeLog:array of {turn, cityId, from, to},v181 在 turn-24 后会清旧记录
  const ccl = Array.isArray(G._cityChangeLog) ? G._cityChangeLog : [];
  const cityChangeLog = {
    count: ccl.length,
    recent5: ccl.slice(-5).map(e => ({
      turn: e.turn ?? null, cityId: e.cityId ?? null, from: e.from ?? null, to: e.to ?? null,
    })),
  };

  // (b) genFactionModLog:object keyed by gen name,每 gen array of {turn, event, delta, after}
  // 每 gen array cap 8。flatten 全局 + sort by turn desc 取 recent 5
  const gfml = (G.genFactionModLog && typeof G.genFactionModLog === 'object') ? G.genFactionModLog : {};
  let gfmlFlat = [];
  for (const name of Object.keys(gfml)) {
    const arr = Array.isArray(gfml[name]) ? gfml[name] : [];
    for (const e of arr) {
      gfmlFlat.push({
        name, turn: e.turn ?? null, event: e.event ?? null,
        delta: e.delta ?? null, after: e.after ?? null,
      });
    }
  }
  // sort by turn ascending,然后 slice(-5) 取最近 5(turn 相同时按 name 字母序稳定)
  gfmlFlat.sort((a, b) => (a.turn - b.turn) || a.name.localeCompare(b.name));
  const genFactionModLog = {
    count: gfmlFlat.length,
    recent5: gfmlFlat.slice(-5),
  };

  // (c) eventQueue:array of {def, fid, ctx, forPlayer}。def 含函数引用 + ctx 含 city 对象引用,
  // 只取可序列化字段:def.id / fid / forPlayer / ctx 的 ID 化版本(city.id 而非 city ref)
  const eq = Array.isArray(G._eventQueue) ? G._eventQueue : [];
  function safeCtx(ctx) {
    if (!ctx || typeof ctx !== 'object') return null;
    const out = {};
    for (const k of Object.keys(ctx)) {
      const v = ctx[k];
      if (v == null) continue;
      const t = typeof v;
      if (t === 'string' || t === 'number' || t === 'boolean') {
        out[k] = v;
      } else if (t === 'object') {
        // 已知 city 引用 → 取 id
        if ('id' in v && typeof v.id === 'string') out[k] = `<ref:${v.id}>`;
        // 已知 array of refs(generals 等)→ 长度 + 名字采样
        else if (Array.isArray(v)) out[k] = `<arr:${v.length}>`;
        else out[k] = '<obj>';
      }
    }
    return out;
  }
  const eventQueue = {
    ids: eq.map(q => q?.def?.id ?? null),
    head: eq[0] ? {
      id: eq[0].def?.id ?? null,
      fid: eq[0].fid ?? null,
      forPlayer: eq[0].forPlayer ?? null,
      ctx: safeCtx(eq[0].ctx),
    } : null,
  };

  return { factions, cities, diplo, generals, units, logs, top, cityChangeLog, genFactionModLog, eventQueue };
}

// ─────────────────────────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[smoke] seed=${SEED} turns=${NUM_TURNS}`);
  console.log(`[smoke] loading ${HTML_PATH}`);

  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window) {
      // 注入 seedrandom — 在所有 inline <script> 执行之前替换 Math.random
      const rng = seedrandom(SEED);
      window.Math.random = rng;
      window.__SMOKE_TEST__ = true;
      window.__SMOKE_SEED__ = SEED;
      window.addEventListener('error', e => {
        console.error('[smoke] window error:', e.error ? e.error.stack || e.error.message : e.message);
      });
    },
  });

  const window = dom.window;

  // 等 v181 内联 script 解析完(initGame 函数已声明)
  console.log('[smoke] waiting for window.initGame...');
  await waitFor(() => typeof window.initGame === 'function', 10000);
  console.log('[smoke] initGame is available');

  // 注入 expose + setter script(同 realm classic <script> 共享 lexical env)
  // - __G__:       拿 let G
  // - __setFF__:   设 _fastForward(让 nextTurn 走 headless 分支,自动消化 _pendingEvent + 战斗)
  const exposeScript = window.document.createElement('script');
  exposeScript.textContent = `
    window.__G__ = G;
    window.__setFF__ = function(v) { _fastForward = !!v; };
    window.__getFF__ = function() { return _fastForward; };
  `;
  window.document.head.appendChild(exposeScript);

  if (!window.__G__) throw new Error('expose script did not set window.__G__');
  if (typeof window.__setFF__ !== 'function') throw new Error('__setFF__ not exposed');
  console.log('[smoke] G + _fastForward exposed via injected script');

  // 显式调 initGame
  console.log('[smoke] calling initGame()...');
  window.initGame();
  const G = window.__G__;
  console.log(`[smoke] initGame done, G.turn=${G.turn}, factions=${Object.keys(G.factions).length}, cities=${Object.keys(G.cities).length}`);

  // 开启 fastForward —— v181 自带 headless 推进开关(L25073)
  // ff 分支(L16588-16626):自动选第一个非 disabled 事件选项 / 自动消化战报 / 不 renderAll
  // 确定性靠 seeded Math.random
  window.__setFF__(true);
  console.log(`[smoke] _fastForward=${window.__getFF__()}, starting ${NUM_TURNS}-turn loop`);

  // 采样初始状态
  const snapshots = [];
  snapshots.push({ turn_index: 0, state: captureState(G) });

  // 跑 NUM_TURNS turn
  for (let i = 1; i <= NUM_TURNS; i++) {
    if (typeof window.nextTurn !== 'function') {
      throw new Error(`window.nextTurn is not a function at turn ${i}`);
    }
    await window.nextTurn();
    snapshots.push({ turn_index: i, state: captureState(G) });
    if (i % 10 === 0) console.log(`[smoke] turn ${i} done, G.turn=${G.turn}, logs=${G.logs?.length ?? 0}`);
  }

  window.__setFF__(false);

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
  console.log(`[smoke] wrote ${OUT_PATH} (${snapshots.length} snapshots, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);

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
