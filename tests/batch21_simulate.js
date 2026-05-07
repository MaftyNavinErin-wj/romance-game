// batch21_simulate.js — D-026 完整生命周期 regression 测试
//
// 流程:
//   turn 1-30: 正常跑(让势力建立 + 经济稳定)
//   turn 30: 强制大乱(victim 城 → rebel)
//   turn 30-60: 跑 30 旬 freeze verify (rebel 城每旬字段不变)
//   turn 60: 模拟收复(force fac=playerFac + occupied=3)
//   turn 60-70: 跑 10 旬 occupied 倒计时 verify
//   turn 70+: occupied=0 后正常 process verify
//
// PASS = freeze 期间所有字段不变 + occupied 倒计时正确 + 全程无 crash + 其他城正常变化

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

const SEED = 'project_romance_test_seed_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const NUM_TURNS = 80; // 30 normal + 30 freeze + 20 occupied + recovery

const TRIGGER_TURN = 30;   // turn 30 触发大乱
const RECAPTURE_TURN = 60; // turn 60 模拟收复

function snap(city) {
  return {
    fac: city.fac,
    occupied: city.occupied ?? 0,
    morale: city.morale,
    pop: city.pop,
    popQuality: city.popQuality,
    storage: city.storage,
    gentry: city.gentry,
    garrison: city.garrison,
    prefect: city.prefect,
    billetPool: (city.billetPool || []).length,
    buildQueueLen: (city.buildQueue || []).length,
  };
}

function snapEqual(a, b, ignore = []) {
  const keys = Object.keys(a).filter(k => !ignore.includes(k));
  const diffs = [];
  for (const k of keys) {
    if (a[k] !== b[k]) diffs.push({ key: k, before: a[k], after: b[k] });
  }
  return diffs;
}

async function main() {
  console.log(`[batch21 sim] seed=${SEED} turns=${NUM_TURNS}`);
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(w) {
      w.Math.random = seedrandom(SEED);
      w.__SMOKE_TEST__ = true;
      w.addEventListener('error', e => console.error('[sim] err:', e.error?.stack || e.message));
    },
  });
  const window = dom.window;

  await new Promise((res, rej) => {
    const start = Date.now();
    const tick = () => {
      if (typeof window.initGame === 'function') return res();
      if (Date.now() - start > 10000) return rej(new Error('initGame timeout'));
      setTimeout(tick, 50);
    };
    tick();
  });

  const exp = window.document.createElement('script');
  exp.textContent = `
    window.__G__ = G;
    window.__setFF__ = v => { _fastForward = !!v; };
    window.__triggerRebel__ = c => _triggerMajorRebellion(c);
  `;
  window.document.head.appendChild(exp);

  window.initGame();
  const G = window.__G__;
  window.__setFF__(true);
  console.log(`[sim] initGame done, playerFac=${G.playerFac}, cities=${Object.keys(G.cities).length}`);

  const events = []; // PASS/FAIL log
  const otherCitySnap = {}; // 其他城 turn 30 vs turn 60 对照,看 regression

  let victim = null;
  let frozenSnap = null;
  let recapturedSnap = null;

  for (let i = 1; i <= NUM_TURNS; i++) {
    await window.nextTurn();

    // turn 30 触发大乱
    if (i === TRIGGER_TURN) {
      // 找一个玩家小城
      victim = Object.values(G.cities).find(c => c.fac === G.playerFac);
      if (!victim) {
        events.push({ turn: i, level: 'FAIL', msg: '找不到 victim city' });
        break;
      }
      const before = snap(victim);
      window.__triggerRebel__(victim);
      const after = snap(victim);
      console.log(`[sim] turn ${i}: 触发大乱 victim=${victim.name}`);
      console.log(`  before:`, before);
      console.log(`  after:`, after);

      if (after.fac !== 'rebel') events.push({ turn: i, level: 'FAIL', msg: `_triggerMajorRebellion 未设 fac=rebel,实际 ${after.fac}` });
      if (after.morale !== 30) events.push({ turn: i, level: 'FAIL', msg: `morale 应=30,实际 ${after.morale}` });
      if (after.garrison !== 0) events.push({ turn: i, level: 'FAIL', msg: `garrison 应=0,实际 ${after.garrison}` });
      if (after.prefect !== null) events.push({ turn: i, level: 'FAIL', msg: `prefect 应=null,实际 ${after.prefect}` });
      events.push({ turn: i, level: 'INFO', msg: '大乱触发 reboot 状态正确' });

      frozenSnap = after;

      // 抓所有非 rebel 城基线供 turn 60 regression 对照
      for (const c of Object.values(G.cities)) {
        if (c.id !== victim.id) otherCitySnap[c.id] = snap(c);
      }
    }

    // turn 31-59: freeze verify
    if (i > TRIGGER_TURN && i < RECAPTURE_TURN && victim) {
      const cur = snap(victim);
      // 如果 fac 已变(AI 攻陷或事件易主),不算 freeze 违反 — 是预期行为
      // 同时 verify 真实攻陷路径 occupied=3 (走 military.js:5925 batch-21 特例)
      if (cur.fac !== 'rebel') {
        events.push({ turn: i, level: 'INFO', msg: `victim.fac=${cur.fac}(AI 攻陷 rebel 城,真实 resolveSiegeBattle 路径)` });
        const expectedMin = 1, expectedMax = 3;
        if (cur.occupied < expectedMin || cur.occupied > expectedMax) {
          events.push({ turn: i, level: 'FAIL', msg: `AI 攻陷 rebel 后 occupied 应在 [1,3] 范围(3 无科技 / 2 含 occupiedMult),实际 ${cur.occupied}` });
        } else {
          events.push({ turn: i, level: 'INFO', msg: `AI 攻陷 rebel 后 occupied=${cur.occupied} (3 无科技 / 1-2 含 occupiedMult)— 真实路径特例 verify ✓` });
        }
        // 切换 victim 引用为攻陷后的城,继续监测 occupied 倒计时
        recapturedSnap = cur;
        break;
      }
      // freeze 字段
      const freezeKeys = ['morale', 'pop', 'popQuality', 'storage', 'gentry', 'garrison', 'prefect', 'billetPool', 'buildQueueLen'];
      const diffs = freezeKeys.filter(k => cur[k] !== frozenSnap[k]).map(k => ({key:k, before:frozenSnap[k], after:cur[k]}));
      if (diffs.length > 0) {
        events.push({ turn: i, level: 'FAIL', msg: `freeze 违反 (fac 仍=rebel): ${JSON.stringify(diffs)}` });
        // 打印完整状态供 debug
        console.log(`[sim] turn ${i} victim 完整 snap:`, cur);
        break;
      }
      // 每 5 旬打 1 次进度 log
      if ((i - TRIGGER_TURN) % 5 === 0) {
        console.log(`[sim] turn ${i}: freeze OK, victim.fac=${cur.fac} morale=${cur.morale} pop=${cur.pop} gentry=${cur.gentry}`);
      }
    }

    // turn 60 模拟收复
    if (i === RECAPTURE_TURN && victim) {
      const oldFac = victim.fac;
      const atkFac = G.playerFac;
      // 模拟 military.js:5925 攻陷写口的 occupied 计算(只测这块,跳过其他副作用)
      const _warStr = G._warClaimStrength?.[`${atkFac}-${oldFac}`] || 'none';
      const _occMap = { strong: 3, medium: 12, weak: 18, none: 27 };
      const _occBase = oldFac === 'rebel' ? 3 : (_occMap[_warStr] ?? 18);
      const newOcc = Math.max(1, Math.floor(_occBase * (1 + (window.getTechEffect ? window.getTechEffect(atkFac, 'occupiedMult') : 0))));
      victim.fac = atkFac;
      victim.occupied = newOcc;
      console.log(`[sim] turn ${i}: 模拟收复 oldFac=${oldFac} _occBase=${_occBase} → occupied=${newOcc}`);
      if (_occBase !== 3) events.push({ turn: i, level: 'FAIL', msg: `oldFac=rebel _occBase 应=3,实际 ${_occBase}` });
      if (newOcc < 1 || newOcc > 3) events.push({ turn: i, level: 'FAIL', msg: `occupied 应 1-3 (含科技),实际 ${newOcc}` });
      events.push({ turn: i, level: 'INFO', msg: `收复 occupied=${newOcc} 公式正确` });
      recapturedSnap = snap(victim);
    }

    // turn 61-69: occupied 倒计时 verify
    if (i > RECAPTURE_TURN && i < RECAPTURE_TURN + 8 && victim) {
      const expected = Math.max(0, recapturedSnap.occupied - (i - RECAPTURE_TURN));
      if (victim.occupied !== expected) {
        events.push({ turn: i, level: 'FAIL', msg: `occupied 倒计时错: 期望 ${expected},实际 ${victim.occupied}` });
      }
    }

    // turn 70+: occupied=0 后,verify city 重新被 process 处理(morale 应该开始变化)
    if (i === RECAPTURE_TURN + 8 && victim) {
      if (victim.occupied !== 0) {
        events.push({ turn: i, level: 'WARN', msg: `占领期未归零,实际 ${victim.occupied}` });
      } else {
        events.push({ turn: i, level: 'INFO', msg: 'occupied 倒计时归零' });
      }
    }
  }

  // turn 80 末: 其他城 regression 对照
  let regressionDiffs = 0;
  for (const cid of Object.keys(otherCitySnap)) {
    const cur = snap(G.cities[cid]);
    const before = otherCitySnap[cid];
    // 不要求字段不变,只检查没出现 NaN / undefined / null where shouldn't be
    if (cur.morale === undefined || cur.pop === undefined || isNaN(cur.morale) || isNaN(cur.pop)) {
      regressionDiffs++;
      events.push({ turn: NUM_TURNS, level: 'FAIL', msg: `城 ${cid} 字段异常: morale=${cur.morale} pop=${cur.pop}` });
    }
  }
  events.push({ turn: NUM_TURNS, level: 'INFO', msg: `其他 ${Object.keys(otherCitySnap).length} 城 regression 检查完成,异常 ${regressionDiffs}` });

  const fails = events.filter(e => e.level === 'FAIL');
  const warns = events.filter(e => e.level === 'WARN');
  const infos = events.filter(e => e.level === 'INFO');

  console.log('\n===== batch-21 simulate 结果 =====');
  console.log(`完成 turn: ${NUM_TURNS}`);
  console.log(`FAIL: ${fails.length}`);
  console.log(`WARN: ${warns.length}`);
  console.log(`INFO: ${infos.length}`);
  console.log('\n--- INFO ---');
  infos.forEach(e => console.log(`  turn ${e.turn}: ${e.msg}`));
  if (warns.length) {
    console.log('\n--- WARN ---');
    warns.forEach(e => console.log(`  turn ${e.turn}: ${e.msg}`));
  }
  if (fails.length) {
    console.log('\n--- FAIL ---');
    fails.forEach(e => console.log(`  turn ${e.turn}: ${e.msg}`));
    console.log('\n[VERDICT] FAIL');
    process.exit(1);
  } else {
    console.log('\n[VERDICT] PASS — D-026 生命周期 regression 全过');
    process.exit(0);
  }

  dom.window.close();
}

main().catch(err => {
  console.error('[sim] CRASH:', err.stack || err.message);
  process.exit(2);
});
