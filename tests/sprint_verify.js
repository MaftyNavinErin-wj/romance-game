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
      const fid = 'wei';
      const u = G.units.find(u2 => u2.fac === fid && u2.squads && u2.squads.length > 0);
      if(!u) return { passed: false, detail: 'wei 无部队 (initGame 应有)' };
      const sq = u.squads[0];
      win.setRetainers(sq.genName, 50);
      const loc = win.getUnitNodeId(u);
      const city = G.cities[loc];
      if(!city || city.fac !== fid){
        const myCity = Object.values(G.cities).find(c => c.fac === fid);
        if(!myCity) return { passed: false, detail: 'wei 无城市' };
        u.hq = myCity.q; u.hr = myCity.r;
        u.status = 'garrison';
      }
      win._execDisband(fid, { leader: sq.genName });
      const retA = win.getRetainers(sq.genName);
      return retA === 0
        ? { passed: true }
        : { passed: false, detail: 'retainers '+sq.genName+' = '+retA+' (expected 0)' };
    },
  },
  {
    id: 'B-D019',
    name: '_execCancelSiege 清 siegeTarget + _siegeTurnCount (玩家/AI 对称)',
    fn(G, win){
      const fid = 'wei';
      const u = G.units.find(u2 => u2.fac === fid);
      if(!u) return { passed: false, detail: 'wei 无部队' };
      u.status = 'siege';
      u.siegeTarget = 'mock_city';
      u._siegeTurnCount = 5;
      win._execCancelSiege(fid, { leader: u.squads[0]?.genName });
      const fails = [];
      if(u.status !== 'halt') fails.push('status='+u.status+' (expected halt)');
      if(u.siegeTarget !== null) fails.push('siegeTarget='+u.siegeTarget+' (expected null)');
      if(u._siegeTurnCount !== 0) fails.push('_siegeTurnCount='+u._siegeTurnCount+' (expected 0)');
      return fails.length === 0 ? { passed: true } : { passed: false, detail: fails.join(', ') };
    },
  },
  {
    id: 'B-D018-camp',
    name: '_execCancelSpecial camp → 1 旬整备 (玩家不能即扎即发, AI 同等约束)',
    fn(G, win){
      const fid = 'wei';
      const u = G.units.find(u2 => u2.fac === fid);
      if(!u) return { passed: false, detail: 'wei 无部队' };
      u.status = 'camp';
      u.campMobilizeTurns = 0;
      win._execCancelSpecial(fid, { leader: u.squads[0]?.genName });
      if(u.campMobilizeTurns !== win.CAMP_MOBILIZE_TURNS){
        return { passed: false, detail: 'campMobilizeTurns='+u.campMobilizeTurns+' (expected '+win.CAMP_MOBILIZE_TURNS+')' };
      }
      return { passed: true };
    },
  },
  {
    id: 'B-D018-ambush',
    name: '_execCancelSpecial ambush 在城内变 garrison (玩家路径对齐)',
    fn(G, win){
      const fid = 'wei';
      const u = G.units.find(u2 => u2.fac === fid);
      if(!u) return { passed: false, detail: 'wei 无部队' };
      const myCity = Object.values(G.cities).find(c => c.fac === fid);
      if(!myCity) return { passed: false, detail: 'wei 无城市' };
      u.hq = myCity.q; u.hr = myCity.r;
      u.status = 'ambush';
      win._execCancelSpecial(fid, { leader: u.squads[0]?.genName });
      return u.status === 'garrison'
        ? { passed: true }
        : { passed: false, detail: 'status='+u.status+' (expected garrison since on city)' };
    },
  },
  {
    id: 'B-D018-execmove-guard',
    name: '_execMove 拔营中拒绝 + camp/ambush 状态拒绝 (D-018 follow-up codex catch)',
    fn(G, win){
      const fid = 'wei';
      const u = G.units.find(u2 => u2.fac === fid);
      if(!u) return { passed: false, detail: 'wei 无部队' };
      // 测 1: campMobilizeTurns > 0 拒绝
      u.status = 'halt';
      u.campMobilizeTurns = 1;
      const r1 = win._execMove(fid, { leader: u.squads[0]?.genName, target: '洛阳' });
      if(r1 !== false) return { passed: false, detail: 'campMobilizeTurns>0 时 _execMove 应 return false' };
      // 测 2: status='camp' 拒绝
      u.campMobilizeTurns = 0;
      u.status = 'camp';
      const r2 = win._execMove(fid, { leader: u.squads[0]?.genName, target: '洛阳' });
      if(r2 !== false) return { passed: false, detail: 'status=camp 时 _execMove 应 return false' };
      return { passed: true };
    },
  },
  {
    id: 'B-D041',
    name: '乐进 xiandeng 攻城士气 cap 对称 (静态 grep verify v179fix P8 模式)',
    fn(G, win){
      const src = require('fs').readFileSync(
        require('path').resolve(__dirname, '..', 'src', 'chains', 'military.js'),
        'utf8'
      );
      const block = src.match(/SKILL_INLINE: xiandeng[\s\S]{0,800}/);
      if(!block) return { passed: false, detail: 'xiandeng block not found' };
      const checks = [
        ['const before', '记录战前 morale (v179fix P8 模式)'],
        ['const added', '记录实际增加值'],
        ['_lejinMoraleAdded.push({sq, added})', 'push 含 added'],
      ];
      const missing = checks.filter(([k]) => block[0].indexOf(k) < 0).map(([,n]) => n);
      const restoreBlock = src.match(/xiandeng restore[\s\S]{0,400}/);
      if(restoreBlock && restoreBlock[0].indexOf('sq.morale - added') < 0){
        missing.push('restore 用 added 实际值 (非硬编码 18)');
      }
      return missing.length === 0
        ? { passed: true }
        : { passed: false, detail: '缺: '+missing.join(' / ') };
    },
  },

  // ── 战斗机制 sprint (sprint_followup §五) ──────────────────────────
  {
    id: 'D-anim-2',
    name: 'virtualGarrison.fac 用 report.defFac 而非 city.fac (§5.1 真 root cause)',
    fn(G, win){
      const src = require('fs').readFileSync(
        require('path').resolve(__dirname, '..', 'src', 'render', 'battle_anim.js'),
        'utf8'
      );
      const block = src.match(/virtualGarrison = \{[\s\S]{0,400}\}/);
      if(!block) return { passed: false, detail: 'virtualGarrison block not found' };
      if(block[0].indexOf('report.defFac') < 0){
        return { passed: false, detail: 'fac 字段未用 report.defFac (city.fac 战胜后已变 atkFac)' };
      }
      return { passed: true };
    },
  },
  {
    id: 'D-anim-3',
    name: 'virtualGarrison 飘字 isPlayer 用 report.defFac (§5.3, 跟 §5.1 同模式)',
    fn(G, win){
      const src = require('fs').readFileSync(
        require('path').resolve(__dirname, '..', 'src', 'render', 'battle_anim.js'),
        'utf8'
      );
      // virtualGarrison 飘字 block (cityCX/cityCY 紧邻 defLost 判断)
      const m = src.match(/if\(virtualGarrison && \(report\.defLost[\s\S]{0,800}?\}/);
      if(!m) return { passed: false, detail: 'virtualGarrison 飘字 block 未找到' };
      const block = m[0];
      if(block.indexOf('report.defFac === G.playerFac') < 0){
        return { passed: false, detail: 'isPlayer 未用 report.defFac (city.fac 战胜后已变 atkFac)' };
      }
      if(/const isPlayer = \(city\.fac === G\.playerFac\)/.test(block)){
        return { passed: false, detail: 'stale city.fac 判断仍在 block 内' };
      }
      return { passed: true };
    },
  },
  {
    id: 'D-camp-1',
    name: '_aiChooseDefensePosture halt 前评估 camp +10% DEF 胜率 (§5.2 P2 fix)',
    fn(G, win){
      const src = require('fs').readFileSync(
        require('path').resolve(__dirname, '..', 'src', 'chains', 'military.js'),
        'utf8'
      );
      const block = src.match(/function _aiChooseDefensePosture[\s\S]{0,4000}/);
      if(!block) return { passed: false, detail: '_aiChooseDefensePosture not found' };
      const checks = [
        ["if (fieldWR >= threshold) return 'halt'", '原 halt 优先级保留'],
        ['_campDEFMult', 'camp DEF mult (含陆逊+raid 双降级 codex trial 1+3 P2)'],
        ['_luxunInThreats', '陆逊 huoying_def 检测 (codex trial 1 P2)'],
        ['_modeRaidLikely', '敌方 raid 模式检测 (intDiff > 10) codex trial 3 P2'],
        ["if (campWR >= threshold) return 'camp'", 'camp 优先于 ambush 触发'],
        ['CAMP_COST.gold', '资源校验'],
      ];
      const missing = checks.filter(([k]) => block[0].indexOf(k) < 0).map(([,n]) => n);
      const idxField = block[0].indexOf("fieldWR >= threshold");
      const idxCamp  = block[0].indexOf("campWR >= threshold");
      const idxAmbush = block[0].indexOf('// ── 2. 伏击评估');
      if(idxField < 0 || idxCamp < 0 || idxAmbush < 0){
        return { passed: false, detail: '关键 anchor 找不到' };
      }
      if(!(idxField < idxCamp && idxCamp < idxAmbush)){
        return { passed: false, detail: '顺序错: 期望 fieldWR < campWR < ambush' };
      }
      return missing.length === 0
        ? { passed: true }
        : { passed: false, detail: '缺: '+missing.join(' / ') };
    },
  },
  {
    id: 'D-§5.10-phantom-snap',
    name: 'phantom 旗帜战前 troops snap (§5.10 P2 真 bug fix, user 实测判定)',
    fn(G, win){
      const fs = require('fs'), path = require('path');
      const baSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'render', 'battle_anim.js'), 'utf8');
      const bmSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'render', 'battle_modals.js'), 'utf8');
      const milSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'chains', 'military.js'), 'utf8');
      const tickSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'core', 'tick.js'), 'utf8');

      // Check 1: makePhantom + makeShipPhantom signature 加 presetTroops
      if(!/function makePhantom\(animG, unit, startPos, invS, presetTroops\)/.test(baSrc)){
        return { passed: false, detail: 'makePhantom signature 缺 presetTroops 参数' };
      }
      if(!/function makeShipPhantom\(animG, unit, startPos, invS, presetTroops\)/.test(baSrc)){
        return { passed: false, detail: 'makeShipPhantom signature 缺 presetTroops 参数' };
      }

      // Check 2: 内部 read 优先 presetTroops, fallback live state
      if(!/\(presetTroops != null\) \? presetTroops/.test(baSrc)){
        return { passed: false, detail: 'makePhantom 内 troops read 未优先 presetTroops' };
      }

      // Check 3: posSnap 创建加 troops 字段 (战前 snapshot)
      // 14 push site (battle_modals 6 + military 6 + tick 1 + battle_anim 1 _siegeArrivalChoice) 全应有 `troops: getUnitTroops(u)`
      // codex trial 1 P2 catch: battle_anim.js _siegeArrivalChoice (L2629) 也是 push site, 我之前漏了
      const expectedSnapSites = [
        { src: bmSrc, file: 'battle_modals.js', expected: 6 },
        { src: milSrc, file: 'military.js', expected: 6 },
        { src: tickSrc, file: 'tick.js', expected: 1 },
        { src: baSrc, file: 'battle_anim.js', expected: 1 }, // _siegeArrivalChoice
      ];
      for(const site of expectedSnapSites){
        const matches = (site.src.match(/\{ hq: u\.hq, hr: u\.hr, troops: getUnitTroops\(u\) \}/g) || []).length;
        if(matches < site.expected){
          return { passed: false, detail: site.file+' posSnap push troops 漏 (expected '+site.expected+', got '+matches+')' };
        }
      }

      // Check 4: makePhantom 调用传 posSnap[unit.id]?.troops (6 处)
      const callMatches = (baSrc.match(/posSnap\?\.\[unit\.id\]\?\.troops/g) || []).length;
      if(callMatches < 6){
        return { passed: false, detail: 'makePhantom 调用传 presetTroops 漏 (expected ≥6, got '+callMatches+')' };
      }

      return { passed: true };
    },
  },
  {
    id: 'D-camp-1-runtime',
    name: '_aiChooseDefensePosture 实际调用返 camp (D-camp-1 runtime 验证, 替代 user 50 旬等扎营)',
    fn(G, win){
      // Mock setup: 找 wei AI 第一个 unit (开局 wei res >> CAMP_COST)
      const fid = 'wei';
      const aiUnit = G.units.find(u => u.fac === fid && u.squads && u.squads.length);
      if(!aiUnit){ return { passed: false, detail: 'wei 无 AI unit' }; }
      // 确保 fac.res 满足 CAMP_COST (initGame wei 默认 gold=10000, wood=2000)
      const fac = G.factions[fid];
      if(!fac || (fac.res.gold||0) < 100 || (fac.res.wood||0) < 80){
        return { passed: false, detail: 'wei res 不足 CAMP_COST (gold=100, wood=80)' };
      }
      // Mock threat: 邻 hex 大兵力 + INT 中等 (避开 raid 模式 INT 差 >10 + 避开陆逊 huoying_def)
      const threatUnit = {
        id: '_mock_threat_camp1',
        fac: 'shu',
        hq: (aiUnit.hq||0) + 1, hr: aiUnit.hr||0,
        status: 'halt',
        movePath: [],
        squads: [{
          genName: '关羽', type: 'heavy', troops: 50000, maxTroops: 50000,
          morale: 80, level: 3,
        }],
      };
      let result;
      try {
        result = win._aiChooseDefensePosture(aiUnit, fid, [threatUnit]);
      } catch(e){
        return { passed: false, detail: 'EXCEPTION: ' + (e.message || e) };
      }
      // 期望返 'camp' (boost 路径 L977 OR fallback L1029) 或 ambush object
      // 'garrison' / 'halt' 是 fix-broken 信号 (前者 threat 检测错, 后者 res 不足回退)
      if(result === 'camp'){ return { passed: true }; }
      if(result && typeof result === 'object' && result.type === 'ambush'){
        return { passed: true, detail: 'ambush 路径 hit (亦合理, 因 fix 后 camp 优先 ambush 评估)' };
      }
      return { passed: false, detail: 'expected camp/ambush, got ' + JSON.stringify(result) };
    },
  },
  {
    id: 'D-resolveBattle-defFac',
    name: 'resolveBattle 内部 default set atkFac/defFac (§5.7 P3 防御性 fix)',
    fn(G, win){
      const src = require('fs').readFileSync(
        require('path').resolve(__dirname, '..', 'src', 'chains', 'military.js'),
        'utf8'
      );
      // 锚 resolveBattle return 块, 验证 atkFac/defFac default set
      const block = src.match(/function resolveBattle\([\s\S]{0,40000}?return \{[\s\S]{0,1000}?\};\n\}/);
      if(!block) return { passed: false, detail: 'resolveBattle return 块找不到' };
      if(block[0].indexOf('atkFac: attackers[0]?.fac') < 0){
        return { passed: false, detail: 'atkFac default set 漏 (期望 attackers[0]?.fac)' };
      }
      if(block[0].indexOf('defFac: defenders[0]?.fac') < 0){
        return { passed: false, detail: 'defFac default set 漏 (期望 defenders[0]?.fac)' };
      }
      return { passed: true };
    },
  },

  // ── 阶段 1a.1 主表抽离 (scenario_system §3) ──────────────────────────────
  // GEN_BASE / CITY_BASE / FACTION_BASE 从 src/data/ 静态 require, 字段完整性验证
  {
    id: 'scenario-1a-gen-base-count',
    name: 'GEN_BASE 武将数量 == 133 (109 GENS_FULL + 16 WILD_GENS + 8 GEN_POOL_INACTIVE)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'general_base.js'), 'utf8');
      const GEN_BASE = (new Function(src + '\n; return GEN_BASE;'))();
      const n = Object.keys(GEN_BASE).length;
      if(n !== 133) return { passed: false, detail: `expected 133, got ${n}` };
      return { passed: true };
    },
  },
  {
    id: 'scenario-1a-gen-base-fields-sample',
    name: 'GEN_BASE 抽样字段完整 (曹操/关羽/徐庶/孙策)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'general_base.js'), 'utf8');
      const GEN_BASE = (new Function(src + '\n; return GEN_BASE;'))();
      const required = ['com','war','int','pol','cha','apt','classTag','skills','values'];
      const errs = [];
      for(const name of ['曹操','关羽','徐庶','孙策']){
        const g = GEN_BASE[name];
        if(!g){ errs.push(`${name} missing`); continue; }
        for(const k of required){
          if(!(k in g)) errs.push(`${name}.${k} missing`);
        }
        if(typeof g.apt !== 'object' || !g.apt.cavalry) errs.push(`${name}.apt 不全`);
      }
      // 曹操特定: faction_clan='谯沛', classTag='commander'
      if(GEN_BASE['曹操']?.faction_clan !== '谯沛') errs.push('曹操.faction_clan != 谯沛');
      if(GEN_BASE['曹操']?.classTag !== 'commander') errs.push('曹操.classTag != commander');
      // 孙策 (GEN_POOL_INACTIVE): birthYear=175, deathYear=200
      if(GEN_BASE['孙策']?.birthYear !== 175) errs.push('孙策.birthYear != 175');
      if(GEN_BASE['孙策']?.deathYear !== 200) errs.push('孙策.deathYear != 200');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a-city-base-count',
    name: 'CITY_BASE 城市数量 == 45',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'city_base.js'), 'utf8');
      const CITY_BASE = (new Function(src + '\n; return CITY_BASE;'))();
      const n = Object.keys(CITY_BASE).length;
      if(n !== 45) return { passed: false, detail: `expected 45, got ${n}` };
      return { passed: true };
    },
  },
  {
    id: 'scenario-1a-city-base-fields-sample',
    name: 'CITY_BASE 抽样字段完整 (xuchang/luoyang/chengdu/jianye)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'city_base.js'), 'utf8');
      const CITY_BASE = (new Function(src + '\n; return CITY_BASE;'))();
      const required = ['name','q','r','tags','jun','size','base'];
      const errs = [];
      for(const cid of ['xuchang','luoyang','chengdu','jianye']){
        const c = CITY_BASE[cid];
        if(!c){ errs.push(`${cid} missing`); continue; }
        for(const k of required){
          if(!(k in c)) errs.push(`${cid}.${k} missing`);
        }
      }
      // 不含 scenario-specific 字段
      const forbidden = ['fac','pop','troops','isCapital'];
      const xuchang = CITY_BASE['xuchang'];
      for(const k of forbidden){
        if(k in xuchang) errs.push(`xuchang.${k} 不应在 CITY_BASE (scenario-specific)`);
      }
      // xuchang 特定: q=52, r=26, base.food=480
      if(xuchang.q !== 52 || xuchang.r !== 26) errs.push('xuchang q/r != 52/26');
      if(xuchang.base?.food !== 480) errs.push('xuchang.base.food != 480');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a-faction-base',
    name: 'FACTION_BASE 含 wei/shu/wu/nanman 4 entry,各 name/full/color/cls 完整',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'faction_base.js'), 'utf8');
      const FACTION_BASE = (new Function(src + '\n; return FACTION_BASE;'))();
      const errs = [];
      if(Object.keys(FACTION_BASE).length !== 4) errs.push(`expected 4 entries, got ${Object.keys(FACTION_BASE).length}`);
      const required = ['name','full','color','cls'];
      for(const fid of ['wei','shu','wu','nanman']){
        const f = FACTION_BASE[fid];
        if(!f){ errs.push(`${fid} missing`); continue; }
        for(const k of required){
          if(!(k in f)) errs.push(`${fid}.${k} missing`);
        }
        // 不含 scenario-specific 字段
        if('ruler' in f) errs.push(`${fid}.ruler 不应在 FACTION_BASE (scenario-specific)`);
      }
      // wei 特定
      if(FACTION_BASE['wei']?.full !== '曹魏') errs.push('wei.full != 曹魏');
      if(FACTION_BASE['wei']?.color !== '#1a5f8a') errs.push('wei.color mismatch');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    // P2 codex trial 1 应对: 全 GEN_BASE entries schema 验证 (133 entries 一致)
    id: 'scenario-1a-gen-base-schema-all',
    name: 'GEN_BASE 全 133 entries: required keys 全有 + 禁 scenario-specific bleed',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'general_base.js'), 'utf8');
      const GEN_BASE = (new Function(src + '\n; return GEN_BASE;'))();
      // GEN_BASE 每 entry 必含的 keys (stable schema, null OK)
      const REQUIRED_KEYS = ['com','war','int','pol','cha','apt',
                             'birthYear','deathYear','debutYear',
                             'birthplace','clan','faction_clan','gentry',
                             'classTag','classTagsAll','skills','values'];
      // 禁出现的 scenario-specific keys
      const FORBIDDEN_KEYS = ['fac','city','role','post','title','loyalty','merit','retainer','relations',
                              'initialUnit','skillsOverride','status','availableYear','wildData'];
      const errs = [];
      let count = 0;
      for(const [name, entry] of Object.entries(GEN_BASE)){
        count++;
        for(const k of REQUIRED_KEYS){
          if(!(k in entry)) errs.push(`${name}.${k} missing`);
        }
        for(const k of FORBIDDEN_KEYS){
          if(k in entry) errs.push(`${name}.${k} scenario bleed`);
        }
        // 战力字段值合法 (number)
        for(const stat of ['com','war','int','pol','cha']){
          if(typeof entry[stat] !== 'number') errs.push(`${name}.${stat} not number (${typeof entry[stat]})`);
        }
        // apt 必须 object 含 6 兵种
        if(typeof entry.apt !== 'object' || !entry.apt.cavalry || !entry.apt.light || !entry.apt.heavy
           || !entry.apt.archer || !entry.apt.siege || !entry.apt.naval){
          errs.push(`${name}.apt 缺兵种`);
        }
        // skills / values / classTagsAll 必须 array
        if(!Array.isArray(entry.skills)) errs.push(`${name}.skills not array`);
        if(!Array.isArray(entry.values)) errs.push(`${name}.values not array`);
        if(!Array.isArray(entry.classTagsAll)) errs.push(`${name}.classTagsAll not array`);
        if(errs.length > 30) break;  // cap
      }
      if(count !== 133) errs.unshift(`expected 133 entries, got ${count}`);
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') + (errs.length>10?` (+${errs.length-10} more)`:'') } : { passed: true };
    },
  },
  {
    // P3 codex trial 1 应对: table-wide forbidden scan for CITY_BASE
    id: 'scenario-1a-city-base-schema-all',
    name: 'CITY_BASE 全 45 entries: required keys + 禁 scenario-specific bleed (fac/pop/troops/isCapital)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'city_base.js'), 'utf8');
      const CITY_BASE = (new Function(src + '\n; return CITY_BASE;'))();
      const REQUIRED = ['name','q','r','tags','jun','size','base'];
      const FORBIDDEN = ['fac','pop','troops','isCapital','garrison','storage','morale','popQuality','buildings','prefect','gentry','occupied','siegeDecay'];
      const errs = [];
      for(const [cid, c] of Object.entries(CITY_BASE)){
        for(const k of REQUIRED){
          if(!(k in c)) errs.push(`${cid}.${k} missing`);
        }
        for(const k of FORBIDDEN){
          if(k in c) errs.push(`${cid}.${k} scenario bleed`);
        }
        if(typeof c.q !== 'number' || typeof c.r !== 'number') errs.push(`${cid} q/r not number`);
        if(!Array.isArray(c.tags)) errs.push(`${cid}.tags not array`);
        if(typeof c.base !== 'object') errs.push(`${cid}.base not object`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') + (errs.length>10?` (+${errs.length-10} more)`:'') } : { passed: true };
    },
  },
  {
    // P3 codex trial 1 应对: table-wide forbidden scan for FACTION_BASE
    id: 'scenario-1a-faction-base-schema-all',
    name: 'FACTION_BASE 全 4 entries: required keys + 禁 scenario-specific bleed',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'faction_base.js'), 'utf8');
      const FACTION_BASE = (new Function(src + '\n; return FACTION_BASE;'))();
      const REQUIRED = ['name','full','color','cls'];
      const FORBIDDEN = ['ruler','type','_baseType','traits','stage','anchorState','ethos','res','reputation',
                         'emperor','techPreunlock','aiPersonality','foundingCore','playable'];
      const errs = [];
      for(const [fid, f] of Object.entries(FACTION_BASE)){
        for(const k of REQUIRED){
          if(!(k in f)) errs.push(`${fid}.${k} missing`);
        }
        for(const k of FORBIDDEN){
          if(k in f) errs.push(`${fid}.${k} scenario bleed`);
        }
      }
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') } : { passed: true };
    },
  },

  // ── 阶段 1a.2 SCENARIO_214 主体 (scenario_system §3.4) ──────────────────────
  // 验证 src/data/scenarios/214.js 的 factions / diplo / cities / emperor 切片完整性。
  // generals = {} 占位,1a.3 sprint 补全(active/wild/pending 武将切片)。
  {
    id: 'scenario-1a2-top-fields',
    name: 'SCENARIO_214 顶层字段齐 (id/version/name/startYear/emperor/factions/diplo/cities/generals)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const REQ = ['id','version','name','startYear','description','provenance',
                   'emperor','factions','diplo','cities','generals'];
      for(const k of REQ){
        if(!(k in S)) errs.push(`${k} missing`);
      }
      if(S.id !== '214') errs.push(`id != '214' (got ${S.id})`);
      if(S.startYear !== 214) errs.push(`startYear != 214 (got ${S.startYear})`);
      if(typeof S.factions !== 'object') errs.push('factions not object');
      if(!Array.isArray(S.diplo)) errs.push('diplo not array');
      if(typeof S.cities !== 'object') errs.push('cities not object');
      if(typeof S.emperor !== 'object') errs.push('emperor not object');
      // 1a.3: generals 已填充 (125 entries 来自 GENS_FULL 109 + WILD_GENS 16)
      if(typeof S.generals !== 'object' || Array.isArray(S.generals)) errs.push('generals not plain object');
      if(Object.keys(S.generals).length === 0) errs.push('generals empty (1a.3 should populate from GENS_FULL + WILD_GENS)');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a2-emperor',
    name: 'SCENARIO_214.emperor == {cityId:"ye", holder:"wei"}',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      if(S.emperor?.cityId !== 'ye') errs.push(`emperor.cityId != 'ye' (got ${S.emperor?.cityId})`);
      if(S.emperor?.holder !== 'wei') errs.push(`emperor.holder != 'wei' (got ${S.emperor?.holder})`);
      // 一致性: factions[holder].emperor === true, 其他 false (设计 doc §3.4 + §9 B.5)
      const holder = S.emperor?.holder;
      let truthyCount = 0;
      for(const [fid, f] of Object.entries(S.factions || {})){
        if(f.emperor === true) truthyCount++;
        if(fid === holder && f.emperor !== true) errs.push(`factions[${fid}].emperor should be true (is holder)`);
        if(fid !== holder && f.emperor !== false) errs.push(`factions[${fid}].emperor should be false`);
      }
      if(truthyCount !== 1) errs.push(`exactly 1 faction.emperor=true required (got ${truthyCount})`);
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a2-factions-count-keys',
    name: 'SCENARIO_214.factions 4 entries (wei/shu/wu/nanman), 全 required keys + ruler/playable',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const fids = Object.keys(S.factions || {});
      if(fids.length !== 4) errs.push(`expected 4 factions, got ${fids.length}`);
      const REQ = ['ruler','playable','type','_baseType','traits','stage','anchorState','ethos',
                   'res','reputation','emperor','techPreunlock','aiPersonality','foundingCore'];
      for(const fid of ['wei','shu','wu','nanman']){
        const f = S.factions[fid];
        if(!f){ errs.push(`${fid} missing`); continue; }
        for(const k of REQ){
          if(!(k in f)) errs.push(`${fid}.${k} missing`);
        }
        if(typeof f.playable !== 'boolean') errs.push(`${fid}.playable not bool`);
        if(typeof f.emperor !== 'boolean') errs.push(`${fid}.emperor not bool`);
        if(!Array.isArray(f.traits)) errs.push(`${fid}.traits not array`);
        if(!Array.isArray(f.techPreunlock)) errs.push(`${fid}.techPreunlock not array`);
        if(!Array.isArray(f.foundingCore)) errs.push(`${fid}.foundingCore not array`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,15).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a2-factions-sample-values',
    name: 'SCENARIO_214.factions 抽样值 (wei.ruler 曹操 / shu.type han_royal / nanman.stage warlord / shu.res.horses 2500)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const wei = S.factions.wei, shu = S.factions.shu, wu = S.factions.wu, nm = S.factions.nanman;
      if(wei?.ruler !== '曹操') errs.push(`wei.ruler != 曹操 (got ${wei?.ruler})`);
      if(shu?.ruler !== '刘备') errs.push(`shu.ruler != 刘备 (got ${shu?.ruler})`);
      if(wu?.ruler !== '孙权')  errs.push(`wu.ruler != 孙权 (got ${wu?.ruler})`);
      if(nm?.ruler !== '孟获')  errs.push(`nanman.ruler != 孟获 (got ${nm?.ruler})`);
      if(shu?.type !== 'han_royal')       errs.push(`shu.type != han_royal (got ${shu?.type})`);
      if(wei?.type !== 'emperor_holder')  errs.push(`wei.type != emperor_holder (got ${wei?.type})`);
      if(nm?.stage !== 'warlord')         errs.push(`nanman.stage != warlord (got ${nm?.stage})`);
      // res 抽样: initGame 字面值
      if(wei?.res?.gold !== 10000) errs.push(`wei.res.gold != 10000 (got ${wei?.res?.gold})`);
      if(shu?.res?.horses !== 2500) errs.push(`shu.res.horses != 2500 (got ${shu?.res?.horses})`);
      if(wu?.res?.iron !== 1000) errs.push(`wu.res.iron != 1000 (got ${wu?.res?.iron})`);
      if(nm?.res?.gold !== 1500) errs.push(`nanman.res.gold != 1500 (got ${nm?.res?.gold})`);
      // reputation 抽样
      if(wei?.reputation !== 45) errs.push(`wei.reputation != 45`);
      if(shu?.reputation !== 80) errs.push(`shu.reputation != 80`);
      // techPreunlock
      if(!Array.isArray(wei?.techPreunlock) || !wei.techPreunlock.includes('mil1'))
        errs.push(`wei.techPreunlock missing mil1`);
      // foundingCore
      if(!wei?.foundingCore?.includes('曹操')) errs.push(`wei.foundingCore missing 曹操`);
      if(!nm?.foundingCore?.includes('孟获'))  errs.push(`nanman.foundingCore missing 孟获`);
      // ethos 抽样
      if(wei?.ethos?.mandate !== 15) errs.push(`wei.ethos.mandate != 15`);
      // aiPersonality 抽样
      if(wei?.aiPersonality?.diploAggro !== 0.65) errs.push(`wei.aiPersonality.diploAggro != 0.65`);
      return errs.length ? { passed: false, detail: errs.slice(0,15).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a2-diplo-edges',
    name: 'SCENARIO_214.diplo 6 edges, 全 4-tuple [a,b,rel,status] (vassal 5-tuple suzerain)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      if(S.diplo?.length !== 6) errs.push(`expected 6 edges, got ${S.diplo?.length}`);
      const VALID_STATUS = new Set(['neutral','ally','enemy','truce','vassal']);
      const VALID_FIDS = new Set(Object.keys(S.factions || {}));
      const seen = new Set();
      for(const e of S.diplo || []){
        if(!Array.isArray(e) || e.length < 4) { errs.push(`edge not 4-tuple: ${JSON.stringify(e)}`); continue; }
        const [a, b, rel, status, suzerain] = e;
        // F.2 no self-pair
        if(a === b) errs.push(`self-pair ${a}-${b}`);
        // F.1 fids must exist in scenario.factions
        if(!VALID_FIDS.has(a)) errs.push(`unknown fid ${a}`);
        if(!VALID_FIDS.has(b)) errs.push(`unknown fid ${b}`);
        // F.3 no duplicate (canonical key a-b lex sorted)
        const k = [a,b].sort().join('-');
        if(seen.has(k)) errs.push(`duplicate edge ${k}`); else seen.add(k);
        if(typeof rel !== 'number') errs.push(`${a}-${b} rel not number`);
        if(!VALID_STATUS.has(status)) errs.push(`${a}-${b} invalid status ${status}`);
        if(status === 'vassal'){
          if(!suzerain) errs.push(`${a}-${b} vassal missing suzerain`);
          else if(suzerain !== a && suzerain !== b) errs.push(`${a}-${b} suzerain ${suzerain} not in pair`);
        } else if(e.length > 4){
          errs.push(`${a}-${b} non-vassal has 5th element`);
        }
      }
      // 具体抽样
      const find = (a,b) => (S.diplo || []).find(e => (e[0]===a && e[1]===b) || (e[0]===b && e[1]===a));
      const shuWu = find('shu','wu');
      if(!shuWu || shuWu[3] !== 'ally' || shuWu[2] !== 78) errs.push(`shu-wu should be ally rel=78`);
      const shuNm = find('shu','nanman');
      if(!shuNm || shuNm[3] !== 'vassal' || shuNm[4] !== 'shu') errs.push(`shu-nanman should be vassal suzerain=shu`);
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a2-cities-count-fields',
    name: 'SCENARIO_214.cities 45 entries, 全 {fac,pop,troops,isCapital} 4 fields',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const cids = Object.keys(S.cities || {});
      if(cids.length !== 45) errs.push(`expected 45 cities, got ${cids.length}`);
      const REQ = ['fac','pop','troops','isCapital'];
      // 禁出现的 CITY_BASE / runtime 字段(同 city_base sprint_verify 防 bleed)
      const FORBIDDEN = ['name','q','r','tags','jun','size','base',
                         'garrison','storage','morale','popQuality','buildings','prefect','gentry','occupied','siegeDecay'];
      const VALID_FIDS = new Set(Object.keys(S.factions || {}));
      for(const [cid, c] of Object.entries(S.cities || {})){
        for(const k of REQ){
          if(!(k in c)) errs.push(`${cid}.${k} missing`);
        }
        for(const k of FORBIDDEN){
          if(k in c) errs.push(`${cid}.${k} should be in CITY_BASE / runtime, not SCENARIO`);
        }
        if(typeof c.fac !== 'string' || !VALID_FIDS.has(c.fac)) errs.push(`${cid}.fac '${c.fac}' invalid`);
        if(typeof c.pop !== 'number') errs.push(`${cid}.pop not number`);
        if(typeof c.troops !== 'number') errs.push(`${cid}.troops not number`);
        if(typeof c.isCapital !== 'boolean') errs.push(`${cid}.isCapital not bool (must be explicit true/false)`);
        if(errs.length > 30) break;
      }
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') + (errs.length>10?` (+${errs.length-10} more)`:'') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a2-cities-capitals',
    name: 'SCENARIO_214.cities 恰 4 个 isCapital (xuchang/chengdu/jianye/? — 每势力 1 个,B.3 spec)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const capitals = Object.entries(S.cities || {}).filter(([_, c]) => c.isCapital === true);
      // 已知 capitals: xuchang(wei) / chengdu(shu) / jianye(wu). nanman 无 capital(蛮族,设计 doc §9 B.3 允许)
      if(capitals.length !== 3) errs.push(`expected 3 capitals (wei/shu/wu — nanman 无), got ${capitals.length}`);
      const caps = new Set(capitals.map(([cid]) => cid));
      for(const expected of ['xuchang','chengdu','jianye']){
        if(!caps.has(expected)) errs.push(`expected capital ${expected} missing`);
      }
      // B.3: 每 faction 至多 1 capital
      const byFac = {};
      for(const [cid, c] of capitals){
        const fac = c.fac;
        byFac[fac] = (byFac[fac] || 0) + 1;
      }
      for(const [fac, n] of Object.entries(byFac)){
        if(n > 1) errs.push(`faction ${fac} has ${n} capitals (max 1)`);
      }
      // 抽样: cities[xuchang] 完整值
      const xc = S.cities?.xuchang;
      if(xc?.fac !== 'wei') errs.push(`xuchang.fac != wei`);
      if(xc?.pop !== 425000) errs.push(`xuchang.pop != 425000 (got ${xc?.pop})`);
      if(xc?.troops !== 4000) errs.push(`xuchang.troops != 4000`);
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    // 跨表一致性: SCENARIO_214.cities 的 cid 全在 CITY_BASE 里 (B.1 spec 一半)
    id: 'scenario-1a2-cities-base-cross-ref',
    name: 'SCENARIO_214.cities 全 cid 都在 CITY_BASE (cross-table 引用一致, B.1)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const cbSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'city_base.js'), 'utf8');
      const CITY_BASE = (new Function(cbSrc + '\n; return CITY_BASE;'))();
      const sSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(sSrc + '\n; return SCENARIO_214;'))();
      const errs = [];
      const baseKeys = new Set(Object.keys(CITY_BASE));
      const sceKeys  = new Set(Object.keys(S.cities || {}));
      for(const cid of sceKeys){
        if(!baseKeys.has(cid)) errs.push(`scenario cid ${cid} not in CITY_BASE`);
      }
      // 1a 阶段 CITY_BASE 全 45 城都该列在 scenario.cities (设计 doc §3.4 注释 "必列全 CITY_BASE")
      for(const cid of baseKeys){
        if(!sceKeys.has(cid)) errs.push(`CITY_BASE.${cid} missing from scenario.cities`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    // codex P2: ethos 5 required keys + numeric type (per design doc §3.4 ETHOS schema)
    id: 'scenario-1a2-factions-ethos-schema',
    name: 'SCENARIO_214.factions[fid].ethos 5 keys (mandate/power/civil/military/strategy) 全 number',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const ETHOS_KEYS = ['mandate','power','civil','military','strategy'];
      const errs = [];
      for(const [fid, f] of Object.entries(S.factions || {})){
        if(typeof f.ethos !== 'object' || f.ethos === null){ errs.push(`${fid}.ethos missing/null`); continue; }
        const keys = Object.keys(f.ethos);
        if(keys.length !== ETHOS_KEYS.length) errs.push(`${fid}.ethos has ${keys.length} keys, expected ${ETHOS_KEYS.length}`);
        for(const k of ETHOS_KEYS){
          if(!(k in f.ethos)) errs.push(`${fid}.ethos.${k} missing`);
          else if(typeof f.ethos[k] !== 'number') errs.push(`${fid}.ethos.${k} not number (${typeof f.ethos[k]})`);
        }
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    // codex P2: aiPersonality 5 required keys + per-key legal ranges (G.6 spec)
    id: 'scenario-1a2-factions-ai-personality-schema',
    name: 'SCENARIO_214.factions[fid].aiPersonality 5 keys + 范围 (atk/siege/diplo 0..1, deploy/budget -1..+1) + 禁 legacy/unknown keys',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const REQ_01 = ['atkThreshold','siegeThreshold','diploAggro'];
      const REQ_PM = ['deployBias','budgetBias'];
      const ALL_REQ = new Set([...REQ_01, ...REQ_PM]);
      for(const [fid, f] of Object.entries(S.factions || {})){
        const ai = f.aiPersonality;
        if(!ai || typeof ai !== 'object'){ errs.push(`${fid}.aiPersonality missing`); continue; }
        for(const k of REQ_01){
          if(!(k in ai)) errs.push(`${fid}.aiPersonality.${k} missing`);
          else if(typeof ai[k] !== 'number' || ai[k] < 0 || ai[k] > 1)
            errs.push(`${fid}.aiPersonality.${k}=${ai[k]} out of [0,1]`);
        }
        for(const k of REQ_PM){
          if(!(k in ai)) errs.push(`${fid}.aiPersonality.${k} missing`);
          else if(typeof ai[k] !== 'number' || ai[k] < -1 || ai[k] > 1)
            errs.push(`${fid}.aiPersonality.${k}=${ai[k]} out of [-1,+1]`);
        }
        // codex trial 2 P3: reject extra/legacy keys (e.g. aggression/expansion 旧 schema)
        for(const k of Object.keys(ai)){
          if(!ALL_REQ.has(k)) errs.push(`${fid}.aiPersonality.${k} unknown key (legacy / typo / schema drift)`);
        }
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    // codex P2: techPreunlock entries 全在 TECH_TREE (cross-ref consts.js)
    id: 'scenario-1a2-tech-preunlock-cross-ref',
    name: 'SCENARIO_214.factions[fid].techPreunlock 全 id 都在 TECH_TREE',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const sSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(sSrc + '\n; return SCENARIO_214;'))();
      // win.TECH_TREE 已在 v181 inline script 装好 (constants.js 在 main script 前 load)
      const techTree = win.TECH_TREE;
      if(!techTree || typeof techTree !== 'object') return { passed: false, detail: 'TECH_TREE not exposed in window' };
      const knownTechs = new Set(Object.keys(techTree));
      const errs = [];
      for(const [fid, f] of Object.entries(S.factions || {})){
        for(const tid of (f.techPreunlock || [])){
          if(!knownTechs.has(tid)) errs.push(`${fid}.techPreunlock[${tid}] not in TECH_TREE`);
        }
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    // codex P2: diplo.rel range -100..100 (设计 doc §9 F.5)
    id: 'scenario-1a2-diplo-rel-range',
    name: 'SCENARIO_214.diplo[*].rel 全部 in [-100, 100] (F.5 spec)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      for(const e of S.diplo || []){
        const [a, b, rel, status] = e;
        if(typeof rel !== 'number' || rel < -100 || rel > 100)
          errs.push(`${a}-${b} rel=${rel} out of [-100,100]`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,6).join(' / ') } : { passed: true };
    },
  },
  {
    // codex P2: version semver-like format (设计 doc G.7)
    id: 'scenario-1a2-version-semver',
    name: 'SCENARIO_214.version semver-like (G.7 spec: N.M[.P])',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const v = S.version;
      if(typeof v !== 'string') return { passed: false, detail: `version not string (got ${typeof v})` };
      if(!/^\d+\.\d+(\.\d+)?$/.test(v)) return { passed: false, detail: `version '${v}' not semver-like` };
      return { passed: true };
    },
  },
  {
    // 跨表一致性: SCENARIO_214.factions[fid].foundingCore 武将名都在 GEN_BASE
    id: 'scenario-1a2-founding-core-gen-base',
    name: 'SCENARIO_214 foundingCore 武将名全部在 GEN_BASE (cross-ref 完整, 1a.3 generals 补全 precondition)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const gbSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'general_base.js'), 'utf8');
      const GEN_BASE = (new Function(gbSrc + '\n; return GEN_BASE;'))();
      const sSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(sSrc + '\n; return SCENARIO_214;'))();
      const errs = [];
      const genSet = new Set(Object.keys(GEN_BASE));
      for(const [fid, f] of Object.entries(S.factions || {})){
        for(const name of (f.foundingCore || [])){
          if(!genSet.has(name)) errs.push(`${fid}.foundingCore[${name}] not in GEN_BASE`);
        }
        // ruler 也应在 GEN_BASE
        if(f.ruler && !genSet.has(f.ruler)) errs.push(`${fid}.ruler ${f.ruler} not in GEN_BASE`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },

  // ── 阶段 1a.3 SCENARIO_214.generals (scenario_system §3.4 + §9 C/E/G/I/J/L) ──
  // 125 entries (109 GENS_FULL + 16 WILD_GENS, GEN_POOL_INACTIVE skip).
  // status: active 101 / wild 6 / pending 18 (含 pendingFac 8)
  {
    id: 'scenario-1a3-generals-count-dist',
    name: 'SCENARIO_214.generals 125 entries (active=101 / wild=6 / pending=18)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const total = Object.keys(S.generals).length;
      if(total !== 125) errs.push(`expected 125 generals, got ${total}`);
      const a = Object.values(S.generals).filter(g => g.status === 'active').length;
      const w = Object.values(S.generals).filter(g => g.status === 'wild').length;
      const p = Object.values(S.generals).filter(g => g.status === 'pending').length;
      if(a !== 101) errs.push(`active=${a} (expected 101)`);
      if(w !== 6)   errs.push(`wild=${w} (expected 6)`);
      if(p !== 18)  errs.push(`pending=${p} (expected 18)`);
      // pendingFac: 8 (来自 GENS_FULL minTurn>1)
      const pf = Object.values(S.generals).filter(g => g.status === 'pending' && g.pendingFac).length;
      if(pf !== 8) errs.push(`pendingFac=${pf} (expected 8)`);
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-active-schema',
    name: 'SCENARIO_214 active 武将全表 schema (fac/city/role/post/title/loyalty/merit/retainer/initialUnit/relations/skillsOverride)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const REQ = ['status','fac','city','role','post','title','loyalty','merit','retainer','initialUnit','relations','skillsOverride'];
      const ROLE_ENUM = new Set(['ruler','strategist','prefect',null]);
      const errs = [];
      for(const [name, g] of Object.entries(S.generals)){
        if(g.status !== 'active') continue;
        for(const k of REQ){
          if(!(k in g)) errs.push(`${name}.${k} missing`);
        }
        if(g.fac === 'wild') errs.push(`${name} active fac='wild' (illegal)`);
        if(!ROLE_ENUM.has(g.role)) errs.push(`${name}.role='${g.role}' invalid`);
        if(typeof g.loyalty !== 'number' || g.loyalty < 0 || g.loyalty > 100) errs.push(`${name}.loyalty=${g.loyalty} out of [0,100]`);
        if(typeof g.merit !== 'number') errs.push(`${name}.merit not number`);
        if(typeof g.initialUnit !== 'boolean') errs.push(`${name}.initialUnit not bool`);
        if(!Array.isArray(g.relations)) errs.push(`${name}.relations not array`);
        if(g.retainer === undefined || g.retainer === null) errs.push(`${name}.retainer null/undefined`);
        else {
          if(typeof g.retainer.count !== 'number') errs.push(`${name}.retainer.count not number`);
          if(g.retainer.type !== null && typeof g.retainer.type !== 'string') errs.push(`${name}.retainer.type invalid`);
        }
        if(errs.length > 40) break;
      }
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') + (errs.length>10?` (+${errs.length-10} more)`:'') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-active-city-fac-consistent',
    name: 'SCENARIO_214 active.city.fac == active.fac (设计 doc §9 C.2, 城市归属一致)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      for(const [name, g] of Object.entries(S.generals)){
        if(g.status !== 'active') continue;
        const c = S.cities[g.city];
        if(!c) errs.push(`${name}.city='${g.city}' not in scenario.cities`);
        else if(c.fac !== g.fac) errs.push(`${name} fac=${g.fac} city.fac=${c.fac} mismatch`);
        if(errs.length > 15) break;
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-rulers',
    name: 'SCENARIO_214 每 fac 恰好 1 ruler (设计 doc §9 I.5; 曹操/刘备/孙权/孟获)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const rulers = {};
      for(const [name, g] of Object.entries(S.generals)){
        if(g.status === 'active' && g.role === 'ruler'){
          rulers[g.fac] = (rulers[g.fac] || []);
          rulers[g.fac].push(name);
        }
      }
      const expected = { wei:'曹操', shu:'刘备', wu:'孙权', nanman:'孟获' };
      for(const fid of Object.keys(S.factions)){
        const r = rulers[fid] || [];
        if(r.length !== 1) errs.push(`${fid}: ${r.length} rulers (${r.join(',')})`);
        else if(r[0] !== expected[fid]) errs.push(`${fid}.ruler=${r[0]} expected ${expected[fid]}`);
        // 一致 with faction.ruler
        if(S.factions[fid].ruler !== r[0]) errs.push(`${fid}.faction.ruler=${S.factions[fid].ruler} != active ruler=${r[0]}`);
      }
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-wild-pending-schema',
    name: 'SCENARIO_214 wild/pending fac="wild" + wildData{title,post,loyalty,merit,retainer,relations,skillsOverride}',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const REQ_WD = ['title','post','loyalty','merit','retainer','relations','skillsOverride'];
      const errs = [];
      for(const [name, g] of Object.entries(S.generals)){
        if(g.status !== 'wild' && g.status !== 'pending') continue;
        if(g.fac !== 'wild') errs.push(`${name} ${g.status} fac='${g.fac}' (must be 'wild')`);
        const wd = g.wildData;
        if(!wd || typeof wd !== 'object'){ errs.push(`${name}.wildData missing`); continue; }
        for(const k of REQ_WD){
          if(!(k in wd)) errs.push(`${name}.wildData.${k} missing`);
        }
        if(typeof wd.loyalty !== 'number' || wd.loyalty < 0 || wd.loyalty > 100) errs.push(`${name}.wildData.loyalty=${wd.loyalty} out of [0,100]`);
        if(!Array.isArray(wd.relations)) errs.push(`${name}.wildData.relations not array`);
        if(errs.length > 30) break;
      }
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-pending-availableYear',
    name: 'SCENARIO_214 pending availableYear > startYear, sane range, sample 验证 (司马昭/邓艾)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      for(const [name, g] of Object.entries(S.generals)){
        if(g.status !== 'pending') continue;
        if(typeof g.availableYear !== 'number') errs.push(`${name}.availableYear not number`);
        else if(g.availableYear <= S.startYear) errs.push(`${name}.availableYear=${g.availableYear} <= startYear=${S.startYear}`);
        else if(g.availableYear > 300) errs.push(`${name}.availableYear=${g.availableYear} > 300`);
      }
      // sample: 司马昭 pendingFac=wei + 邓艾 wildPool 路径无 pendingFac
      const sma = S.generals['司马昭'];
      if(!sma) errs.push('司马昭 missing');
      else {
        if(sma.status !== 'pending') errs.push(`司马昭.status=${sma.status} expected pending`);
        if(sma.pendingFac !== 'wei') errs.push(`司马昭.pendingFac=${sma.pendingFac} expected wei`);
        // minTurn=153 → 214 + floor(152/36)=214+4=218
        if(sma.availableYear !== 218) errs.push(`司马昭.availableYear=${sma.availableYear} expected 218`);
      }
      const dy = S.generals['邓艾'];
      if(!dy) errs.push('邓艾 missing');
      else {
        if(dy.status !== 'pending') errs.push(`邓艾.status=${dy.status} expected pending`);
        if(dy.pendingFac) errs.push(`邓艾.pendingFac=${dy.pendingFac} should be absent (WILD_GENS → wildPool)`);
        // minTurn=189 → 214 + floor(188/36)=214+5=219
        if(dy.availableYear !== 219) errs.push(`邓艾.availableYear=${dy.availableYear} expected 219`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-generals-gen-base-cross-ref',
    name: 'SCENARIO_214 全 generals 名都在 GEN_BASE (no orphan)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const gbSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'general_base.js'), 'utf8');
      const GEN_BASE = (new Function(gbSrc + '\n; return GEN_BASE;'))();
      const sSrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(sSrc + '\n; return SCENARIO_214;'))();
      const errs = [];
      const genSet = new Set(Object.keys(GEN_BASE));
      for(const name of Object.keys(S.generals)){
        if(!genSet.has(name)) errs.push(`${name} not in GEN_BASE`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-relations-intimacy-range',
    name: 'SCENARIO_214 relations intimacy ∈ [-100,100] (E.4 modified: 允许 负值 表 仇怨)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      for(const [name, g] of Object.entries(S.generals)){
        const rels = (g.status === 'active')
          ? (g.relations || [])
          : ((g.wildData && g.wildData.relations) || []);
        for(const r of rels){
          if(typeof r.intimacy !== 'number') errs.push(`${name}→${r.target} intimacy not number`);
          else if(r.intimacy < -100 || r.intimacy > 100) errs.push(`${name}→${r.target} intimacy=${r.intimacy} out of [-100,100]`);
          if(r.target === name) errs.push(`${name} self-relation`);
        }
        if(errs.length > 20) break;
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1a3-cao-cao-spec',
    name: 'SCENARIO_214.generals.曹操 specific (active/wei/xuchang/ruler + initialUnit + 5 relations + retainer cavalry 2500)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      const c = S.generals['曹操'];
      if(!c) return { passed: false, detail: '曹操 missing' };
      if(c.status !== 'active')  errs.push(`status=${c.status}`);
      if(c.fac !== 'wei')        errs.push(`fac=${c.fac}`);
      if(c.city !== 'xuchang')   errs.push(`city=${c.city}`);
      if(c.role !== 'ruler')     errs.push(`role=${c.role}`);
      if(c.title !== '治世能臣') errs.push(`title=${c.title}`);
      if(c.loyalty !== 95)       errs.push(`loyalty=${c.loyalty}`);
      if(c.merit !== 150)        errs.push(`merit=${c.merit}`);
      if(c.initialUnit !== true) errs.push(`initialUnit=${c.initialUnit}`);
      if(c.retainer?.count !== 2500) errs.push(`retainer.count=${c.retainer?.count}`);
      if(c.retainer?.type !== 'cavalry') errs.push(`retainer.type=${c.retainer?.type}`);
      // 收编 后:5 GEN_META + 5 INTIMACY_PRESET orphan (许褚/贾诩/张辽/司马懿/曹洪) = 10
      if(!Array.isArray(c.relations) || c.relations.length !== 10) errs.push(`relations length=${c.relations?.length} (expected 10 after INTIMACY_PRESET 收编)`);
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    // codex trial 1 P1.1 fix: relations 全收编 INTIMACY_PRESET (orphan pair 不丢)
    // 每个 INTIMACY_PRESET 双方都在 scenario.generals 的 pair → 两侧都该有对方 relation entry
    id: 'scenario-1a3-intimacy-preset-coverage',
    name: 'INTIMACY_PRESET 全 pair (双方 ∈ scenario.generals) → 双向 relations 全收编 (codex P1.1 fix)',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      // win.INTIMACY_PRESET via inline script: 1a.3 extract tool 已 expose, 但 sprint_verify 还没 expose 直接 — 改读 src
      const gsrc = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'generals.js'), 'utf8');
      // 不要 eval 全 generals.js (大), 仅 grep INTIMACY_PRESET 块
      const m = gsrc.match(/const INTIMACY_PRESET\s*=\s*(\[[\s\S]*?\]);/);
      if(!m) return { passed: false, detail: 'INTIMACY_PRESET not parsed from generals.js' };
      const INTIMACY_PRESET = (new Function('return ' + m[1] + ';'))();

      function getRels(name){
        const g = S.generals[name];
        if(!g) return null;
        return (g.status === 'active') ? (g.relations || []) : ((g.wildData && g.wildData.relations) || []);
      }

      const errs = [];
      let okPairs = 0;
      for(const [a, b, v] of INTIMACY_PRESET){
        if(!S.generals[a] || !S.generals[b]) continue;  // skip if not both in scenario
        const ra = getRels(a) || [];
        const rb = getRels(b) || [];
        const ab = ra.find(r => r.target === b);
        const ba = rb.find(r => r.target === a);
        if(!ab) errs.push(`${a} → ${b} relation missing (preset intimacy=${v})`);
        else if(ab.intimacy !== v) errs.push(`${a} → ${b} intimacy=${ab.intimacy} != preset ${v}`);
        if(!ba) errs.push(`${b} → ${a} relation missing (preset intimacy=${v})`);
        else if(ba.intimacy !== v) errs.push(`${b} → ${a} intimacy=${ba.intimacy} != preset ${v}`);
        okPairs++;
      }
      return errs.length ? { passed: false, detail: `${okPairs} pairs covered, ${errs.length} 漏: ` + errs.slice(0,6).join(' / ') } : { passed: true };
    },
  },
  {
    // codex trial 1 P1.2 fix: scenario.initialUnits 字段 (1b byte-identical 必需)
    id: 'scenario-1a3-initial-units',
    name: 'SCENARIO_214.initialUnits 7 units / 14 squads 完整 spec + cross-ref generals/cities',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'scenarios', '214.js'), 'utf8');
      const S = (new Function(src + '\n; return SCENARIO_214;'))();
      const errs = [];
      if(!Array.isArray(S.initialUnits)) errs.push('initialUnits not array');
      else {
        if(S.initialUnits.length !== 7) errs.push(`expected 7 units, got ${S.initialUnits.length}`);
        const totalSquads = S.initialUnits.reduce((s,u)=>s+(u.squads||[]).length, 0);
        if(totalSquads !== 14) errs.push(`expected 14 squads total, got ${totalSquads}`);
        const VALID_TYPES = new Set(['cavalry','light','heavy','archer','siege','naval']);
        for(const u of S.initialUnits){
          if(!S.cities[u.city]) errs.push(`unit city ${u.city} not in scenario.cities`);
          else if(S.cities[u.city].fac !== u.fac) errs.push(`unit fac=${u.fac} city.fac=${S.cities[u.city].fac} mismatch`);
          for(const sq of (u.squads || [])){
            const gen = S.generals[sq.genName];
            if(!gen) errs.push(`squad gen ${sq.genName} not in scenario.generals`);
            else {
              if(gen.status !== 'active') errs.push(`${sq.genName} status=${gen.status} (must be active)`);
              if(gen.fac !== u.fac) errs.push(`${sq.genName} fac=${gen.fac} != unit.fac=${u.fac}`);
              if(gen.city !== u.city) errs.push(`${sq.genName} city=${gen.city} != unit.city=${u.city}`);
              if(!gen.initialUnit) errs.push(`${sq.genName} initialUnit=false (must be true)`);
            }
            if(!VALID_TYPES.has(sq.type)) errs.push(`${sq.genName} type=${sq.type} invalid`);
            if(typeof sq.troops !== 'number' || sq.troops <= 0) errs.push(`${sq.genName} troops=${sq.troops}`);
            if(typeof sq.morale !== 'number' || sq.morale < 0 || sq.morale > 100) errs.push(`${sq.genName} morale=${sq.morale}`);
          }
        }
        // 抽样: 曹操 in xuchang squad, cavalry, 3000 troops, 88 morale
        const wei0 = S.initialUnits.find(u => u.city === 'xuchang');
        if(!wei0) errs.push('xuchang unit missing');
        else {
          const cc = wei0.squads.find(s => s.genName === '曹操');
          if(!cc) errs.push('曹操 squad in xuchang missing');
          else {
            if(cc.type !== 'cavalry') errs.push(`曹操.type=${cc.type}`);
            if(cc.troops !== 3000) errs.push(`曹操.troops=${cc.troops}`);
            if(cc.morale !== 88) errs.push(`曹操.morale=${cc.morale}`);
          }
        }
      }
      return errs.length ? { passed: false, detail: errs.slice(0,8).join(' / ') } : { passed: true };
    },
  },
  // ── 阶段 1b-1 materializeScenario + sync top-level const ──────────────
  // src/core/scenario_loader.js applyScenario(scenarioId) sync FAC/ALL_FACS/
  // PLAYABLE_FACS/FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT. initGame 顶部调用.
  // 守底 invariant: sync 后值 ≡ 原 src/data/factions.js literal (smoke byte-identical 验证)
  {
    id: 'scenario-1b1-applyScenario-defined',
    name: 'applyScenario / materializeScenario / syncObject / syncArray 已 expose (window 内)',
    fn(G, win){
      const errs = [];
      if(typeof win.applyScenario !== 'function') errs.push('applyScenario not function');
      if(typeof win.materializeScenario !== 'function') errs.push('materializeScenario not function');
      if(typeof win.syncObject !== 'function') errs.push('syncObject not function');
      if(typeof win.syncArray !== 'function') errs.push('syncArray not function');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b1-sync-byte-identical',
    name: 'initGame 后 FAC/ALL_FACS/PLAYABLE_FACS/FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT ≡ scenario 派生值',
    fn(G, win){
      const errs = [];
      // FAC (4 entries, 各 name/full/ruler/color/cls)
      const FAC = win.FAC;
      if(!FAC || Object.keys(FAC).length !== 4) errs.push(`FAC count=${Object.keys(FAC||{}).length}, expected 4`);
      if(FAC?.wei?.ruler !== '曹操') errs.push(`FAC.wei.ruler=${FAC?.wei?.ruler}`);
      if(FAC?.shu?.full !== '蜀汉') errs.push(`FAC.shu.full=${FAC?.shu?.full}`);
      if(FAC?.wei?.color !== '#1a5f8a') errs.push(`FAC.wei.color mismatch`);
      if(FAC?.nanman?.cls !== 'nanman') errs.push(`FAC.nanman.cls mismatch`);
      // ALL_FACS
      const ALL_FACS = win.ALL_FACS;
      if(!Array.isArray(ALL_FACS) || ALL_FACS.length !== 4) errs.push(`ALL_FACS length=${ALL_FACS?.length}`);
      for(const f of ['wei','shu','wu','nanman']) if(!ALL_FACS.includes(f)) errs.push(`ALL_FACS missing ${f}`);
      // PLAYABLE_FACS
      const PLAY = win.PLAYABLE_FACS;
      if(!Array.isArray(PLAY) || PLAY.length !== 4) errs.push(`PLAYABLE_FACS length=${PLAY?.length}`);
      // FAC_IDENTITY
      const FI = win.FAC_IDENTITY;
      if(FI?.wei?.type !== 'emperor_holder') errs.push(`FAC_IDENTITY.wei.type=${FI?.wei?.type}`);
      if(FI?.shu?.type !== 'han_royal') errs.push(`FAC_IDENTITY.shu.type=${FI?.shu?.type}`);
      if(FI?.wei?.stage !== 'regime') errs.push(`FAC_IDENTITY.wei.stage=${FI?.wei?.stage}`);
      if(FI?.nanman?.stage !== 'warlord') errs.push(`FAC_IDENTITY.nanman.stage=${FI?.nanman?.stage}`);
      if(!Array.isArray(FI?.wei?.traits) || FI.wei.traits[0] !== '枭雄') errs.push(`FAC_IDENTITY.wei.traits mismatch`);
      // ETHOS_INIT
      const EI = win.ETHOS_INIT;
      if(EI?.wei?.mandate !== 15) errs.push(`ETHOS_INIT.wei.mandate=${EI?.wei?.mandate}`);
      if(EI?.shu?.power !== 0) errs.push(`ETHOS_INIT.shu.power=${EI?.shu?.power}`);
      // DIPLO_INIT (6 一向 entries)
      const DI = win.DIPLO_INIT;
      if(!DI || Object.keys(DI).length !== 6) errs.push(`DIPLO_INIT count=${Object.keys(DI||{}).length}, expected 6`);
      if(DI?.['shu-wu']?.status !== 'ally') errs.push(`DIPLO_INIT.shu-wu.status=${DI?.['shu-wu']?.status}`);
      if(DI?.['shu-nanman']?.suzerain !== 'shu') errs.push(`DIPLO_INIT.shu-nanman.suzerain mismatch`);
      if(DI?.['wei-shu']?.rel !== 40) errs.push(`DIPLO_INIT.wei-shu.rel=${DI?.['wei-shu'].rel}`);
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b1-mutable-container-preserved',
    name: 'top-level const 仍是 mutable container (运行时 mutate works, e.g. FAC_IDENTITY.wei.type 可改)',
    fn(G, win){
      const errs = [];
      // FAC_IDENTITY.wei.type runtime mutation 后再 sync 应恢复
      const FI = win.FAC_IDENTITY;
      const origType = FI.wei.type;
      FI.wei.type = 'test_value';
      if(FI.wei.type !== 'test_value') errs.push('FAC_IDENTITY mutate failed');
      // 重新 applyScenario 后应恢复 (清空 + Object.assign)
      win.applyScenario('214');
      if(FI.wei.type !== origType) errs.push(`re-apply did not restore FAC_IDENTITY.wei.type (got ${FI.wei.type})`);
      // 但 FI 引用本身不变 (const 容器 unchanged)
      if(win.FAC_IDENTITY !== FI) errs.push('FAC_IDENTITY const ref changed (should be same container)');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    // codex trial 1 P2: 严格 byte-identical 验证 — exact key order + deep equality
    // 6 容器 sync 后必须跟 v181 原 src/data/factions.js literal 完全一致 (key 顺序 + 值)
    id: 'scenario-1b1-byte-identical-strict',
    name: 'sync 后 6 容器 deep-equal + exact key order vs v181 原 factions.js literal',
    fn(G, win){
      const errs = [];
      // FAC: key 顺序 wei/shu/wu/nanman + each entry 字段顺序 name/full/ruler/color/cls
      const facKeys = Object.keys(win.FAC);
      const expectFacKeys = ['wei','shu','wu','nanman'];
      if(facKeys.join(',') !== expectFacKeys.join(','))
        errs.push(`FAC keys order: got [${facKeys.join(',')}], expected [${expectFacKeys.join(',')}]`);
      // FAC entry field order (Object.keys 应 name/full/ruler/color/cls)
      const wei = win.FAC.wei;
      const weiKeys = Object.keys(wei);
      if(weiKeys.join(',') !== 'name,full,ruler,color,cls')
        errs.push(`FAC.wei keys order: got [${weiKeys.join(',')}]`);
      // deep-equal: 严格匹配 v181 原 literal (cherry-pick 全部 4 fac)
      const expectFAC = {
        wei:    { name:'魏', full:'曹魏', ruler:'曹操', color:'#1a5f8a', cls:'wei' },
        shu:    { name:'蜀', full:'蜀汉', ruler:'刘备', color:'#1a7a3a', cls:'shu' },
        wu:     { name:'吴', full:'孙吴', ruler:'孙权', color:'#a82a1a', cls:'wu' },
        nanman: { name:'蛮', full:'南蛮', ruler:'孟获', color:'#8b6914', cls:'nanman' },
      };
      const facStr = JSON.stringify(win.FAC);
      const expFacStr = JSON.stringify(expectFAC);
      if(facStr !== expFacStr) errs.push(`FAC JSON mismatch:\n  got: ${facStr.slice(0,200)}\n  exp: ${expFacStr.slice(0,200)}`);

      // ALL_FACS: exact array (Object.keys(FAC).filter(f=>f!=='rebel'))
      const allFacsStr = JSON.stringify(win.ALL_FACS);
      if(allFacsStr !== '["wei","shu","wu","nanman"]') errs.push(`ALL_FACS=${allFacsStr}`);

      // PLAYABLE_FACS: exact ['wei','shu','wu','nanman']
      const playStr = JSON.stringify(win.PLAYABLE_FACS);
      if(playStr !== '["wei","shu","wu","nanman"]') errs.push(`PLAYABLE_FACS=${playStr}`);

      // FAC_IDENTITY: key order + each entry 字段顺序 type/_baseType/traits/stage/anchorState
      const fiKeys = Object.keys(win.FAC_IDENTITY);
      if(fiKeys.join(',') !== 'wei,shu,wu,nanman') errs.push(`FAC_IDENTITY keys order: [${fiKeys.join(',')}]`);
      const fiWeiKeys = Object.keys(win.FAC_IDENTITY.wei);
      if(fiWeiKeys.join(',') !== 'type,_baseType,traits,stage,anchorState')
        errs.push(`FAC_IDENTITY.wei keys order: [${fiWeiKeys.join(',')}]`);
      const expectFI = {
        wei:    { type:'emperor_holder', _baseType:'warlord',  traits:['枭雄'],     stage:'regime',  anchorState:null },
        shu:    { type:'han_royal',      _baseType:'han_royal', traits:['仁主','汉室'], stage:'regime',  anchorState:null },
        wu:     { type:'warlord',        _baseType:'warlord',  traits:[],            stage:'regime',  anchorState:null },
        nanman: { type:'tribal',         _baseType:'tribal',   traits:['蛮族'],      stage:'warlord', anchorState:null },
      };
      const fiStr = JSON.stringify(win.FAC_IDENTITY);
      const expFiStr = JSON.stringify(expectFI);
      if(fiStr !== expFiStr) errs.push(`FAC_IDENTITY JSON mismatch`);

      // ETHOS_INIT: 各 entry 顺序 mandate/power/civil/military/strategy
      const eiWeiKeys = Object.keys(win.ETHOS_INIT.wei);
      if(eiWeiKeys.join(',') !== 'mandate,power,civil,military,strategy')
        errs.push(`ETHOS_INIT.wei keys order: [${eiWeiKeys.join(',')}]`);
      const expectEI = {
        wei:    { mandate:  15, power:  20, civil:  0, military: 10, strategy: 15 },
        shu:    { mandate: -30, power:   0, civil:  5, military:-20, strategy: 10 },
        wu:     { mandate:   0, power: -20, civil:  0, military:  0, strategy:-20 },
        nanman: { mandate:   0, power:   0, civil:-10, military: 15, strategy:  5 },
      };
      if(JSON.stringify(win.ETHOS_INIT) !== JSON.stringify(expectEI)) errs.push(`ETHOS_INIT JSON mismatch`);

      // DIPLO_INIT: key order 'wei-shu','wei-wu','shu-wu','wei-nanman','shu-nanman','wu-nanman'
      const diKeys = Object.keys(win.DIPLO_INIT);
      const expectDiKeys = ['wei-shu','wei-wu','shu-wu','wei-nanman','shu-nanman','wu-nanman'];
      if(diKeys.join(',') !== expectDiKeys.join(',')) errs.push(`DIPLO_INIT keys order: [${diKeys.join(',')}]`);
      const expectDI = {
        'wei-shu':   {status:'neutral', rel:40},
        'wei-wu':    {status:'neutral', rel:45},
        'shu-wu':    {status:'ally',    rel:78},
        'wei-nanman':{status:'neutral', rel:25},
        'shu-nanman':{status:'vassal',  rel:50, suzerain:'shu'},
        'wu-nanman': {status:'neutral', rel:30},
      };
      if(JSON.stringify(win.DIPLO_INIT) !== JSON.stringify(expectDI)) errs.push(`DIPLO_INIT JSON mismatch`);

      return errs.length ? { passed: false, detail: errs.slice(0,6).join(' | ') } : { passed: true };
    },
  },
  // ── 阶段 1b-2 scenario accessor functions ─────────────────────────────
  // src/core/scenario_accessors.js: 10 accessor 函数 (additive API).
  // 1b-2 scope: 仅新增 API, 现有模块仍读 FAC[fid] 等顶层 const, 行为 byte-identical.
  // 1c module-by-module 改 FAC[fid] → getFactionDef(fid); 1d accessor backing 切到 G runtime state.
  {
    id: 'scenario-1b2-accessors-defined',
    name: '10 个 accessor 全 expose (getFactionDef / getScenarioFactions / getPlayableFactions / isPlayableFaction / getFactionIdentity / setFactionIdentity / getEthos / getDiploInit / getWildGenDef / getWildGenMeta)',
    fn(G, win){
      const errs = [];
      const REQ = ['getFactionDef','getScenarioFactions','getPlayableFactions','isPlayableFaction',
                   'getFactionIdentity','setFactionIdentity','getEthos','getDiploInit',
                   'getWildGenDef','getWildGenMeta'];
      for(const fn of REQ){
        if(typeof win[fn] !== 'function') errs.push(`${fn} not function`);
      }
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b2-faction-accessors-byte-identical',
    name: 'getFactionDef / getScenarioFactions / getPlayableFactions / isPlayableFaction 返回值 ≡ 直接读 const',
    fn(G, win){
      const errs = [];
      // getFactionDef: ref equal to FAC[fid]
      if(win.getFactionDef('wei') !== win.FAC.wei) errs.push('getFactionDef(wei) !== FAC.wei (not ref)');
      if(win.getFactionDef('shu') !== win.FAC.shu) errs.push('getFactionDef(shu) !== FAC.shu');
      if(win.getFactionDef('unknown') !== null) errs.push(`getFactionDef('unknown') should be null (got ${win.getFactionDef('unknown')})`);
      // getScenarioFactions: ref equal to ALL_FACS
      if(win.getScenarioFactions() !== win.ALL_FACS) errs.push('getScenarioFactions() !== ALL_FACS (not ref)');
      // getPlayableFactions: ref equal
      if(win.getPlayableFactions() !== win.PLAYABLE_FACS) errs.push('getPlayableFactions() !== PLAYABLE_FACS');
      // isPlayableFaction
      if(!win.isPlayableFaction('wei')) errs.push('isPlayableFaction(wei) false');
      if(win.isPlayableFaction('rebel')) errs.push('isPlayableFaction(rebel) true');
      if(win.isPlayableFaction('unknown')) errs.push('isPlayableFaction(unknown) true');
      return errs.length ? { passed: false, detail: errs.slice(0,5).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b2-identity-ethos-diplo-accessors',
    name: 'getFactionIdentity / setFactionIdentity / getEthos / getDiploInit 返回值 + 写入路径',
    fn(G, win){
      const errs = [];
      // getFactionIdentity: ref equal
      if(win.getFactionIdentity('wei') !== win.FAC_IDENTITY.wei) errs.push('getFactionIdentity(wei) !== FAC_IDENTITY.wei');
      if(win.getFactionIdentity('unknown') !== null) errs.push('getFactionIdentity(unknown) !== null');
      // setFactionIdentity: writes through to FAC_IDENTITY
      const origStage = win.FAC_IDENTITY.wei.stage;
      win.setFactionIdentity('wei', 'stage', 'test_stage');
      if(win.FAC_IDENTITY.wei.stage !== 'test_stage') errs.push(`setFactionIdentity 未写入 (stage=${win.FAC_IDENTITY.wei.stage})`);
      // restore
      win.setFactionIdentity('wei', 'stage', origStage);
      // setFactionIdentity on unknown fac: no-op (no throw)
      try { win.setFactionIdentity('unknown', 'stage', 'x'); } catch(e){ errs.push(`setFactionIdentity('unknown') threw: ${e.message}`); }
      // getEthos: ref equal
      if(win.getEthos('wei') !== win.ETHOS_INIT.wei) errs.push('getEthos(wei) !== ETHOS_INIT.wei');
      if(win.getEthos('unknown') !== null) errs.push('getEthos(unknown) !== null');
      // getDiploInit: ref equal
      if(win.getDiploInit() !== win.DIPLO_INIT) errs.push('getDiploInit() !== DIPLO_INIT');
      return errs.length ? { passed: false, detail: errs.slice(0,5).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b2-wild-gen-accessors',
    name: 'getWildGenDef / getWildGenMeta 返回值 ≡ WILD_GENS.find / WILD_GEN_META[name]',
    fn(G, win){
      const errs = [];
      // getWildGenDef: same ref as WILD_GENS.find
      const dengAi = win.getWildGenDef('邓艾');
      if(!dengAi) errs.push('getWildGenDef(邓艾) null');
      // WILD_GENS is global in v181 — find via getWildGenDef which wraps it
      const dengAiDirect = win.WILD_GENS ? win.WILD_GENS.find(g => g.name === '邓艾') : null;
      // 若 WILD_GENS not exposed, 直接验 dengAi 字段
      if(dengAi){
        if(dengAi.name !== '邓艾') errs.push(`wild def name=${dengAi.name}`);
        if(dengAi.minTurn !== 189) errs.push(`邓艾.minTurn=${dengAi.minTurn} expected 189`);
      }
      if(win.getWildGenDef('曹操') !== null) errs.push('getWildGenDef(曹操) should be null (not in WILD_GENS)');
      if(win.getWildGenDef('unknown') !== null) errs.push('getWildGenDef(unknown) should be null');
      // getWildGenMeta
      const xushu = win.getWildGenMeta('徐庶');
      if(!xushu) errs.push('getWildGenMeta(徐庶) null');
      else {
        if(xushu.loyalty !== 70) errs.push(`徐庶.loyalty=${xushu.loyalty} expected 70`);
        if(!xushu.post || xushu.post.name !== '军师') errs.push(`徐庶.post.name=${xushu.post?.name}`);
      }
      if(win.getWildGenMeta('unknown') !== null) errs.push('getWildGenMeta(unknown) should be null');
      return errs.length ? { passed: false, detail: errs.slice(0,5).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b2-no-module-migration-yet',
    name: '1b-2 仅 additive API: 现有模块 src/chains/* 仍读 FAC[fid] / ALL_FACS 等直接 const (1c 才迁移)',
    fn(G, win){
      // grep 验证: src/chains/* + src/core/main.js 中 FAC[ / ALL_FACS / FAC_IDENTITY[ 仍然存在
      const fsM = require('fs'), pathM = require('path');
      const errs = [];
      const filesToCheck = [
        'src/chains/diplomacy.js',
        'src/chains/economy.js',
        'src/chains/ethos.js',
        'src/chains/event.js',
        'src/chains/general.js',
        'src/chains/gentry.js',
        'src/chains/military.js',
        'src/chains/politics.js',
        'src/core/main.js',
        'src/render/tabs.js',
        'src/render/ui_panels.js',
      ];
      let totalConstReads = 0;
      for(const f of filesToCheck){
        const src = fsM.readFileSync(pathM.resolve(__dirname, '..', f), 'utf8');
        // count direct FAC[/ALL_FACS/FAC_IDENTITY[ reads
        const m = src.match(/\b(FAC\[|ALL_FACS\b|FAC_IDENTITY\[|ETHOS_INIT\[|DIPLO_INIT\[)/g) || [];
        totalConstReads += m.length;
      }
      // 1b-2 应有 > 0 (没人迁移). 1c 应逐渐减到 0.
      if(totalConstReads === 0) errs.push('1b-2: expected direct const reads > 0 across modules (premature migration?)');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  // ── 阶段 1c-a FAC_IDENTITY / ETHOS_INIT / DIPLO_INIT migration ───────
  // Migrate ~28 sites: read → getFactionIdentity/getEthos/getDiploInit, write → setFactionIdentity.
  // 同时 close 1b-1 P3 deferred: main.js:139-144 hardcoded FAC_IDENTITY reset 删除 (SCENARIO_214 sync 是 single source).
  {
    id: 'scenario-1c-a-no-direct-fac-identity-reads',
    name: 'src/ 全部 FAC_IDENTITY[ / .wei / .shu 等直接 read 在 code 行 (非注释) = 0',
    fn(G, win){
      const fsM = require('fs'), pathM = require('path');
      // strip line comments helper
      function stripLineComments(src){
        return src.split('\n').map(line => {
          // 简化: 找到第一个 // 不在 string 内的位置, 截断
          let inStr = null;
          for(let i = 0; i < line.length; i++){
            const c = line[i];
            if(inStr){
              if(c === inStr && line[i-1] !== '\\') inStr = null;
            } else {
              if(c === '"' || c === "'" || c === '`') inStr = c;
              else if(c === '/' && line[i+1] === '/') return line.slice(0, i);
            }
          }
          return line;
        }).join('\n');
      }
      const filesToCheck = [
        'src/chains/diplomacy.js', 'src/chains/economy.js', 'src/chains/ethos.js',
        'src/chains/event.js', 'src/chains/general.js', 'src/chains/gentry.js',
        'src/chains/military.js', 'src/chains/politics.js',
        'src/core/main.js', 'src/core/tick.js', 'src/core/hubs.js', 'src/core/claude_ai.js',
        'src/core/helpers.js', 'src/core/map.js',
        'src/render/tabs.js', 'src/render/ui_panels.js', 'src/render/modals.js',
        'src/render/boot_screens.js', 'src/render/diplo_modals.js',
        'src/data/events.js',
      ];
      const errs = [];
      for(const f of filesToCheck){
        const full = pathM.resolve(__dirname, '..', f);
        if(!fsM.existsSync(full)) continue;
        const codeOnly = stripLineComments(fsM.readFileSync(full, 'utf8'));
        // FAC_IDENTITY[ or FAC_IDENTITY.{wei|shu|wu|nanman} (literal-key writes)
        const m1 = codeOnly.match(/\bFAC_IDENTITY\[/g) || [];
        const m2 = codeOnly.match(/\bFAC_IDENTITY\.(wei|shu|wu|nanman)\b/g) || [];
        const m3 = codeOnly.match(/\bETHOS_INIT\[/g) || [];
        const m4 = codeOnly.match(/\bDIPLO_INIT\b/g) || [];
        if(m1.length) errs.push(`${f}: ${m1.length} × FAC_IDENTITY[`);
        if(m2.length) errs.push(`${f}: ${m2.length} × FAC_IDENTITY.<fid>`);
        if(m3.length) errs.push(`${f}: ${m3.length} × ETHOS_INIT[`);
        if(m4.length) errs.push(`${f}: ${m4.length} × DIPLO_INIT`);
      }
      return errs.length ? { passed: false, detail: errs.slice(0,10).join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1c-a-applyScenario-still-syncs-fac-identity',
    name: '1c-a migration 后 applyScenario 仍 sync FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT (regression guard)',
    fn(G, win){
      // 验证 sync 链路完整: 调 applyScenario 后 6 容器仍有正确值
      const errs = [];
      // mutate 一些 known values 后 re-apply, 应恢复
      const origType = win.FAC_IDENTITY.wei.type;
      win.FAC_IDENTITY.wei.type = 'corrupted';
      // clear ETHOS_INIT 测重 sync
      const origMandate = win.ETHOS_INIT.wei.mandate;
      win.ETHOS_INIT.wei.mandate = 999;
      // clear DIPLO_INIT 测
      const origRel = win.DIPLO_INIT['shu-wu'].rel;
      win.DIPLO_INIT['shu-wu'].rel = 999;
      // re-apply
      win.applyScenario('214');
      if(win.FAC_IDENTITY.wei.type !== origType) errs.push(`FAC_IDENTITY.wei.type ${win.FAC_IDENTITY.wei.type} != ${origType}`);
      if(win.ETHOS_INIT.wei.mandate !== origMandate) errs.push(`ETHOS_INIT.wei.mandate ${win.ETHOS_INIT.wei.mandate} != ${origMandate}`);
      if(win.DIPLO_INIT['shu-wu'].rel !== origRel) errs.push(`DIPLO_INIT.shu-wu.rel ${win.DIPLO_INIT['shu-wu'].rel} != ${origRel}`);
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    id: 'scenario-1b1-empty-before-init',
    name: 'src/data/factions.js 顶层 const 改 empty container (initGame 前空, smoke 验证有效)',
    fn(G, win){
      // 间接验证: 直接读 src/data/factions.js,确保字面值是 empty
      const fsM = require('fs'), pathM = require('path');
      const src = fsM.readFileSync(pathM.resolve(__dirname, '..', 'src', 'data', 'factions.js'), 'utf8');
      const errs = [];
      // const FAC = {}; const ALL_FACS = []; 等 6 个 empty container
      if(!/const\s+FAC\s*=\s*\{\}\s*;/.test(src)) errs.push('FAC not empty container');
      if(!/const\s+ALL_FACS\s*=\s*\[\]\s*;/.test(src)) errs.push('ALL_FACS not empty array');
      if(!/const\s+PLAYABLE_FACS\s*=\s*\[\]\s*;/.test(src)) errs.push('PLAYABLE_FACS not empty array');
      if(!/const\s+FAC_IDENTITY\s*=\s*\{\}\s*;/.test(src)) errs.push('FAC_IDENTITY not empty container');
      if(!/const\s+ETHOS_INIT\s*=\s*\{\}\s*;/.test(src)) errs.push('ETHOS_INIT not empty container');
      if(!/const\s+DIPLO_INIT\s*=\s*\{\}\s*;/.test(src)) errs.push('DIPLO_INIT not empty container');
      // 不许残留 literal value
      if(src.indexOf('曹操') !== -1) errs.push('factions.js 残留 literal "曹操" (未清干净)');
      if(src.indexOf('mandate:') !== -1) errs.push('factions.js 残留 ETHOS literal');
      if(src.indexOf("'wei-shu'") !== -1 || src.indexOf('"wei-shu"') !== -1) errs.push('factions.js 残留 DIPLO literal');
      return errs.length ? { passed: false, detail: errs.join(' / ') } : { passed: true };
    },
  },
  {
    // 验证 verify_scenario_214.js validator 在当前 SCENARIO_214 上 PASS (0 errors)
    // 这是 1a.3 的核心 守底: validator + sprint_verify 都 PASS = 数据 schema 一致
    id: 'scenario-1a3-validator-tool-pass',
    name: 'tests/verify_scenario_214.js validator 在当前 SCENARIO_214 上 0 errors (warnings 允许)',
    fn(G, win){
      const { execSync } = require('child_process');
      const pathM = require('path');
      try {
        const out = execSync('node ' + pathM.resolve(__dirname, 'verify_scenario_214.js'), {
          cwd: pathM.resolve(__dirname, '..'),
          encoding: 'utf8',
          stdio: ['ignore','pipe','pipe'],
          timeout: 60000,
        });
        if(out.indexOf('PASS') < 0) return { passed: false, detail: 'no PASS marker in output' };
        return { passed: true };
      } catch(e){
        return { passed: false, detail: 'validator FAIL: ' + (e.stdout || '').slice(-400) };
      }
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
    window.CAMP_MOBILIZE_TURNS = (typeof CAMP_MOBILIZE_TURNS !== 'undefined') ? CAMP_MOBILIZE_TURNS : 1;
    // 1a.2 codex P2 verify: TECH_TREE cross-ref check 用
    window.TECH_TREE = (typeof TECH_TREE !== 'undefined') ? TECH_TREE : {};
    // 1b-1 verify: scenario loader + 新 sync containers
    window.PLAYABLE_FACS = (typeof PLAYABLE_FACS !== 'undefined') ? PLAYABLE_FACS : [];
    window.FAC_IDENTITY = (typeof FAC_IDENTITY !== 'undefined') ? FAC_IDENTITY : {};
    window.ETHOS_INIT = (typeof ETHOS_INIT !== 'undefined') ? ETHOS_INIT : {};
    window.DIPLO_INIT = (typeof DIPLO_INIT !== 'undefined') ? DIPLO_INIT : {};
    window.applyScenario = (typeof applyScenario !== 'undefined') ? applyScenario : null;
    window.materializeScenario = (typeof materializeScenario !== 'undefined') ? materializeScenario : null;
    window.syncObject = (typeof syncObject !== 'undefined') ? syncObject : null;
    window.syncArray = (typeof syncArray !== 'undefined') ? syncArray : null;
    // 1b-2 scenario accessors
    window.getFactionDef = (typeof getFactionDef !== 'undefined') ? getFactionDef : null;
    window.getScenarioFactions = (typeof getScenarioFactions !== 'undefined') ? getScenarioFactions : null;
    window.getPlayableFactions = (typeof getPlayableFactions !== 'undefined') ? getPlayableFactions : null;
    window.isPlayableFaction = (typeof isPlayableFaction !== 'undefined') ? isPlayableFaction : null;
    window.getFactionIdentity = (typeof getFactionIdentity !== 'undefined') ? getFactionIdentity : null;
    window.setFactionIdentity = (typeof setFactionIdentity !== 'undefined') ? setFactionIdentity : null;
    window.getEthos = (typeof getEthos !== 'undefined') ? getEthos : null;
    window.getDiploInit = (typeof getDiploInit !== 'undefined') ? getDiploInit : null;
    window.getWildGenDef = (typeof getWildGenDef !== 'undefined') ? getWildGenDef : null;
    window.getWildGenMeta = (typeof getWildGenMeta !== 'undefined') ? getWildGenMeta : null;
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
