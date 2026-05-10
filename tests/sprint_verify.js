// sprint_verify.js — Layer-3 sprint batch verify 模板
//
// 用途:
//   每个 sprint batch fix 写一个 VERIFY entry, 自动测 fix 路径生效 + 状态变化预期值,
//   不依赖 user F12 console paste, 不会因 clamp/marker/状态依赖产生 false fail.
//
// 跟 smoke.js 的差别:
//   smoke.js (Layer-1+2): 跑 50 旬 + diff baseline.json, catch byte-level 行为漂移
//   sprint_verify.js (Layer-3): 控制初始 state, 调 fix 路径, assert 状态 deltas, catch fix 路径错配
//
// 用法:
//   node tests/sprint_verify.js              # 跑全部 verifies
//   node tests/sprint_verify.js D-093        # 只跑 ID 含 'D-093' 的 verifies
//   node tests/sprint_verify.js B-diplo      # 跑外交链全部 (前缀过滤)
//
// 添加新 verify:
//   在 VERIFIES 数组末尾加 {id, name, fn(G, win) → {passed, detail?}} entry.
//   fn 内自己负责 reset state (rel / status / cd / marker), 调 fix 路径, 验 deltas.

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

const SEED = 'sprint_verify_seed_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');

// ═══════════════════════════════════════════════════════════════════
// VERIFIES — sprint batch fix 自动测试 entry
//
// 每个 entry: { id, name, fn(G, win) → { passed: bool, detail?: string } }
// fn 内须:
//   1. 重置 state (rel / status / cd / marker / 钱) 到已知初始值
//   2. 调 fix 路径 (diploWar / _execXxx / setStrategist 等)
//   3. 读 state, 验 deltas
//   4. return { passed: true } 或 { passed: false, detail: 'why' }
// ═══════════════════════════════════════════════════════════════════

// helper: 重置玩家与目标势力外交状态到 neutral / rel=50 / 清 cd 与 _actedThisTurn marker
function resetDiplo(G, fid, tgt, opts){
  opts = opts || {};
  const k = fid+'-'+tgt, kr = tgt+'-'+fid;
  G.diplo[k].rel = opts.rel != null ? opts.rel : 50;
  G.diplo[kr].rel = opts.rel != null ? opts.rel : 50;
  G.diplo[k].status = opts.status || 'neutral';
  G.diplo[kr].status = opts.status || 'neutral';
  delete G.diplo[k]._actedThisTurn;
  delete G.diplo[kr]._actedThisTurn;
  delete G.diplo[k]._betrayal;
  delete G.diplo[kr]._betrayal;
  delete G.diplo[k]._brokenAllyTurn;
  delete G.diplo[kr]._brokenAllyTurn;
  delete G.diplo[k]._peaceTurn;
  delete G.diplo[kr]._peaceTurn;
  delete G['_diploCD_'+fid+'_'+tgt];
  delete G['_diploCD_'+tgt+'_'+fid];
}

const VERIFIES = [
  // ── B sprint 外交链 (批 7, push 9 commit) ──────────────────────────
  {
    id: 'B-D093',
    name: '玩家 diploWar rel -15 (三入口统一, 非 -20)',
    fn(G, win){
      const fid = G.playerFac;
      const tgt = win.ALL_FACS.find(f => f !== fid && f !== 'rebel');
      resetDiplo(G, fid, tgt);
      win.diploWar(tgt, null);
      const delta = 50 - G.diplo[fid+'-'+tgt].rel;
      return delta === 15
        ? { passed: true }
        : { passed: false, detail: 'expected rel -15, got -'+delta };
    },
  },
  {
    id: 'B-D095',
    name: 'diploWar ethos.strategy +6 单计 (非双计 +12)',
    fn(G, win){
      const fid = G.playerFac;
      const tgt = win.ALL_FACS.find(f => f !== fid && f !== 'rebel');
      resetDiplo(G, fid, tgt);
      const ethB = G.factions[fid].ethos.strategy;
      win.diploWar(tgt, null);
      const ethA = G.factions[fid].ethos.strategy;
      const delta = ethA - ethB;
      return delta === 6
        ? { passed: true }
        : { passed: false, detail: 'expected ethos +6, got +'+delta };
    },
  },
  {
    id: 'B-D092',
    name: '玩家 diploWar 写 _diploCD 双向 15',
    fn(G, win){
      const fid = G.playerFac;
      const tgt = win.ALL_FACS.find(f => f !== fid && f !== 'rebel');
      resetDiplo(G, fid, tgt);
      win.diploWar(tgt, null);
      const cdA = G['_diploCD_'+fid+'_'+tgt];
      const cdB = G['_diploCD_'+tgt+'_'+fid];
      if(cdA !== 15) return { passed: false, detail: '_diploCD '+fid+'->'+tgt+' = '+cdA+' (expected 15)' };
      if(cdB !== 15) return { passed: false, detail: '_diploCD '+tgt+'->'+fid+' = '+cdB+' (expected 15)' };
      return { passed: true };
    },
  },
  {
    id: 'B-D109',
    name: '_execBreakAlliance 解盟 -20 (玩家/AI 统一)',
    fn(G, win){
      const fid = G.playerFac;
      const tgt = win.ALL_FACS.find(f => f !== fid && f !== 'rebel');
      resetDiplo(G, fid, tgt, { rel: 80, status: 'ally' });
      win._execBreakAlliance(fid, { target: tgt });
      const delta = 80 - G.diplo[fid+'-'+tgt].rel;
      return delta === 20
        ? { passed: true }
        : { passed: false, detail: 'expected rel -20, got -'+delta };
    },
  },
  {
    id: 'B-D114',
    name: 'Claude AI _diploCD decay helper exists',
    fn(G, win){
      return typeof win._decayDiploCDForFac === 'function'
        ? { passed: true }
        : { passed: false, detail: '_decayDiploCDForFac not exposed in window' };
    },
  },
  {
    id: 'B-D115',
    name: '斩使立威 effect 含 _diploCD + 背刺反复检测',
    fn(G, win){
      const def = win.EVENT_DEFS.find(d => d.id === 'envoy_visit');
      if(!def) return { passed: false, detail: 'envoy_visit def not found' };
      const choices = def.choices({ fid:'wei', targetFid:'shu', targetName:'蜀' });
      const effStr = choices[2].effect.toString();
      const checks = [
        ['_diploCD_', '_diploCD 写入'],
        ['_brokenAllyTurn', '背刺检测'],
        ['_peaceTurn', '反复检测'],
        ['applyWarDeclarationEffects', '宣战副作用 hub'],
      ];
      const missing = checks.filter(([k]) => effStr.indexOf(k) < 0).map(([,n]) => n);
      return missing.length === 0
        ? { passed: true }
        : { passed: false, detail: '缺: '+missing.join(' / ') };
    },
  },
  {
    id: 'B-D118',
    name: '中立战斗 de facto 写 _diploCD + _warDeclaredTurn (静态 grep verify)',
    fn(G, win){
      // military.js 中立战斗 path 在 resolveBattle 内, 难直接调; 静态 grep 函数源验证
      const src = require('fs').readFileSync(
        require('path').resolve(__dirname, '..', 'src', 'chains', 'military.js'),
        'utf8'
      );
      const block = src.match(/\/\/ 中立状态下发生战斗[\s\S]{0,1500}/);
      if(!block) return { passed: false, detail: 'de facto block not found' };
      const checks = [
        ['_diploCD_', '_diploCD 写入'],
        ['_warDeclaredTurn', '_warDeclaredTurn 写入'],
        ['applyWarDeclarationEffects', '宣战副作用 hub'],
        ["triggerFactionEvent('warDeclare'", 'warDeclare 派系事件'],
      ];
      const missing = checks.filter(([k]) => block[0].indexOf(k) < 0).map(([,n]) => n);
      return missing.length === 0
        ? { passed: true }
        : { passed: false, detail: '缺: '+missing.join(' / ') };
    },
  },
  {
    id: 'B-D096',
    name: '_execProposeAlliance 失败设 _diploCD = 5 旬',
    fn(G, win){
      const fid = 'wei', tgt = 'shu';
      resetDiplo(G, fid, tgt, { rel: 80, status: 'neutral' });
      G.factions[fid].res.gold = 5000;
      // mock Math.random 让 acceptRate 永远不通过 (失败分支)
      const origRand = Math.random;
      Math.random = () => 0.99;
      win._execProposeAlliance(fid, { target: tgt });
      Math.random = origRand;
      const cd = G['_diploCD_'+fid+'_'+tgt];
      // 状态可能仍是 neutral (失败), CD 应 = 5
      return cd === 5
        ? { passed: true }
        : { passed: false, detail: '_diploCD = '+cd+' (expected 5 失败 cd)' };
    },
  },
  {
    id: 'B-D105',
    name: 'rejectPeaceOffer 退 700 金 (玩家拒绝 AI 求和)',
    fn(G, win){
      const fid = 'wei', from = 'shu';
      G.factions[from].res.gold = 1000;
      // 模拟 AI 已扣 1000 准备求和, gold 现 1000 (假设原本 2000 扣 1000 = 1000)
      // 调 rejectPeaceOffer 应退 700 → gold = 1700
      G.diplo[fid+'-'+from].rel = 30;
      G.diplo[from+'-'+fid].rel = 30;
      // rejectPeaceOffer 内会触发 closeModal/_checkPendingCourtAfterPopup 但不应 throw
      try {
        win.rejectPeaceOffer(from);
      } catch(e){ /* DOM modal closeModal 在 jsdom 可能 no-op, 不阻断 */ }
      const goldA = G.factions[from].res.gold;
      return goldA === 1700
        ? { passed: true }
        : { passed: false, detail: 'gold = '+goldA+' (expected 1700 = 1000 + 退 700)' };
    },
  },

  // ── B sprint 价值观链 + 事件链 (批 5+6 push) ────────────────────────
  {
    id: 'B-D129',
    name: 'processFacEthos 灭国势力跳过 (_eliminated guard)',
    fn(G, win){
      const fid = 'wei';
      const ethB = JSON.stringify(G.factions[fid].ethos);
      const logLenB = (G.factions[fid]._ethosLog || []).length;
      G.factions[fid]._eliminated = true;
      win.processFacEthos(fid);
      const ethA = JSON.stringify(G.factions[fid].ethos);
      const logLenA = (G.factions[fid]._ethosLog || []).length;
      delete G.factions[fid]._eliminated;
      if(ethB !== ethA) return { passed: false, detail: 'ethos changed despite _eliminated' };
      if(logLenB !== logLenA) return { passed: false, detail: '_ethosLog grew: '+logLenB+' → '+logLenA };
      return { passed: true };
    },
  },
  {
    id: 'B-D134',
    name: 'rollEventsV2 facs 过滤 _eliminated',
    fn(G, win){
      // 静态 grep verify (rollEventsV2 内部 ALL_FACS.filter logic)
      const src = win.rollEventsV2.toString();
      return src.indexOf('_eliminated') >= 0
        ? { passed: true }
        : { passed: false, detail: 'rollEventsV2 not filtering _eliminated' };
    },
  },
  {
    id: 'B-D145',
    name: 'gen_referral 婉拒 删除 _eventCooldown 死代码',
    fn(G, win){
      const def = win.EVENT_DEFS.find(d => d.id === 'gen_referral');
      if(!def) return { passed: false, detail: 'gen_referral def not found' };
      const choices = def.choices({ fid:'wei', rName:'A', wName:'B', genName:'B' });
      // 找 ② 婉拒
      const reject = choices.find(c => c.label && c.label.indexOf('婉拒') >= 0);
      if(!reject) return { passed: false, detail: '婉拒选项未找到' };
      const effStr = reject.effect.toString();
      return effStr.indexOf("_eventCooldown['gen_referral_") < 0 && effStr.indexOf("_eventCooldown[\"gen_referral_") < 0
        ? { passed: true }
        : { passed: false, detail: 'gen_referral cooldown 死代码未删' };
    },
  },
  {
    id: 'B-D143',
    name: 'return_emperor showNotif gate (event playerOnly:false)',
    fn(G, win){
      const def = win.EVENT_DEFS.find(d => d.id === 'return_emperor');
      if(!def) return { passed: false, detail: 'return_emperor def not found' };
      const choices = def.choices({ fid:'wei', genName:'X' });
      const effStr = choices[0].effect.toString();
      // log 不应硬编 '主公', 应该用 FAC[fid]
      if(effStr.indexOf('主公') >= 0 && effStr.indexOf('FAC[fid]') < 0){
        return { passed: false, detail: '"主公" 仍硬编, 未改 FAC[fid].name' };
      }
      // showNotif 应有 fid===G.playerFac gate
      if(effStr.indexOf('showNotif') >= 0 && effStr.indexOf('playerFac') < 0){
        return { passed: false, detail: 'showNotif 缺 fid===G.playerFac gate' };
      }
      return { passed: true };
    },
  },

  // ── B sprint 政治链 (批 3+4 push) ──────────────────────────────────
  {
    id: 'B-D090',
    name: 'setStrategist 同人重复任命守卫 (无 net +3 exploit)',
    fn(G, win){
      const fid = 'wei';
      const fac = G.factions[fid];
      // 找 wei 一个武将做军师
      const gen = (G.generals[fid] || []).find(g => g.role !== 'ruler');
      if(!gen) return { passed: false, detail: 'wei 无非 ruler 武将' };
      // 先设为军师
      fac.strategist = gen.name;
      G.genLoyalty[gen.name] = 50;
      const loyB = G.genLoyalty[gen.name];
      // 同人再任命 → 应早 return, 忠诚不变
      win.setStrategist(fid, gen.name);
      const loyA = G.genLoyalty[gen.name];
      return loyA === loyB
        ? { passed: true }
        : { passed: false, detail: '忠诚 '+loyB+' → '+loyA+' (差 '+(loyA-loyB)+', 应 0)' };
    },
  },
  {
    id: 'B-D088',
    name: '朝议 _aiCourtSelect N=2 取 1 / N=3+ 取 2',
    fn(G, win){
      // mock 2 提案
      const props2 = [
        { proposal:{ id:'conscript', name:'征兵' }, proposer:{ name:'X' }, postDef:{}, factionId:null, effectVal:0.05 },
        { proposal:{ id:'farm',      name:'劝农' }, proposer:{ name:'Y' }, postDef:{}, factionId:null, effectVal:0.07 },
      ];
      const sel2 = win._aiCourtSelect('wei', props2);
      if(sel2.length !== 1) return { passed: false, detail: 'N=2 期望选 1, 实际选 '+sel2.length };
      // N=3
      const props3 = [...props2, { proposal:{ id:'morale', name:'安民' }, proposer:{ name:'Z' }, postDef:{}, factionId:null, effectVal:0.5 }];
      const sel3 = win._aiCourtSelect('wei', props3);
      if(sel3.length !== 2) return { passed: false, detail: 'N=3 期望选 2, 实际选 '+sel3.length };
      return { passed: true };
    },
  },

  // ── B sprint 军事链 (批 8) ───────────────────────────────────────
  {
    id: 'B-D015',
    name: '_execDisband 清亲卫 (玩家/AI 对称, AI 裁军不留 ghost retainers)',
    fn(G, win){
      // 找 wei 的一支部队 + 武将
      const fid = 'wei';
      const u = G.units.find(u2 => u2.fac === fid && u2.squads && u2.squads.length > 0);
      if(!u) return { passed: false, detail: 'wei 无部队 (initGame 应有)' };
      const sq = u.squads[0];
      // 设亲卫 = 50, 把 unit 移到城市 (确保 _execDisband 城市判定通过)
      win.setRetainers(sq.genName, 50);
      const loc = win.getUnitNodeId(u);
      const city = G.cities[loc];
      if(!city || city.fac !== fid){
        // 把 unit 强行 garrison 到 wei 城
        const myCity = Object.values(G.cities).find(c => c.fac === fid);
        if(!myCity) return { passed: false, detail: 'wei 无城市' };
        u.hq = myCity.hq; u.hr = myCity.hr;
        u.status = 'garrison';
      }
      win._execDisband(fid, { leader: sq.genName });
      const retA = win.getRetainers(sq.genName);
      return retA === 0
        ? { passed: true }
        : { passed: false, detail: 'retainers '+sq.genName+' = '+retA+' (expected 0)' };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// 主流程
// ═══════════════════════════════════════════════════════════════════

async function main(){
  const filter = process.argv[2] || null;
  const toRun = filter
    ? VERIFIES.filter(v => v.id.indexOf(filter) >= 0)
    : VERIFIES;

  if(!toRun.length){
    console.error('[verify] 没匹配 filter "'+filter+'" 的 verify');
    process.exit(2);
  }

  console.log('[verify] seed='+SEED);
  console.log('[verify] loading '+HTML_PATH);
  console.log('[verify] 跑 '+toRun.length+'/'+VERIFIES.length+' verifies'+(filter ? ' (filter: '+filter+')' : ''));

  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window){
      window.Math.random = seedrandom(SEED);
      window.__SMOKE_TEST__ = true;
      window.addEventListener('error', e => {
        console.error('[verify] window error:', e.error ? e.error.stack || e.error.message : e.message);
      });
    },
  });

  const win = dom.window;
  await waitFor(() => typeof win.initGame === 'function', 10000);

  // expose helpers (跟 smoke.js 同模式) — 把 sprint 内 src/chains 的全局 function
  // 都通过 window.<name> 暴露出来。模板假设它们都是 hoisted top-level function
  // (跟 v181 reload pattern 一致, src/chains/*.js classic <script> 共享 lexical env)
  // 所以 win.diploWar / win.setStrategist 等可以直接访问。
  // 如果某 verify 用到的 helper 暴露不到 (let / const 顶层), 再通过 expose script 显式赋值.
  const exposeScript = win.document.createElement('script');
  exposeScript.textContent = `
    window.__G__ = G;
    // 顶层 const / let 不会自动挂到 window, 显式 expose
    window.ALL_FACS = ALL_FACS;
    window.EVENT_DEFS = EVENT_DEFS;
    window.FAC = FAC;
    window.GEN_TAGS = (typeof GEN_TAGS !== 'undefined') ? GEN_TAGS : {};
    window.REPUTATION_DEFAULT = (typeof REPUTATION_DEFAULT !== 'undefined') ? REPUTATION_DEFAULT : 50;
    // (function 顶层声明默认就是 window.<name>, 不需要 expose)
  `;
  win.document.head.appendChild(exposeScript);

  win.initGame();
  const G = win.__G__;
  console.log('[verify] initGame done, G.turn='+G.turn);

  // 跑 verifies
  const results = [];
  for(const v of toRun){
    let result;
    try {
      result = v.fn(G, win);
    } catch(e){
      result = { passed: false, detail: 'EXCEPTION: '+(e.message || e) };
    }
    const symbol = result.passed ? '✓ PASS' : '✗ FAIL';
    const detail = result.detail ? ' — ' + result.detail : '';
    console.log('  '+symbol+'  ['+v.id+'] '+v.name+detail);
    results.push({ ...v, result });
  }

  const passed = results.filter(r => r.result.passed).length;
  const failed = results.length - passed;
  console.log('');
  console.log('[verify] 共 '+results.length+' verifies: '+passed+' PASS, '+failed+' FAIL');

  if(failed > 0){
    console.log('');
    console.log('FAIL 项:');
    results.filter(r => !r.result.passed).forEach(r => {
      console.log('  ✗ ['+r.id+'] '+r.name+' — '+r.result.detail);
    });
    process.exit(1);
  }
}

function waitFor(pred, timeoutMs){
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try { if(pred()) return resolve(); } catch(_){}
      if(Date.now() - start > timeoutMs) return reject(new Error('waitFor timeout '+timeoutMs+'ms'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

main().catch(err => {
  console.error('[verify] FAILED:', err.stack || err.message);
  process.exit(1);
});
