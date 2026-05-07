// src/core/hubs.js
//
// 跨链 hub 函数 — 写口跨多个链的 mechanism 调度器。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.2 / 阶段 3)
//   - checkEventPromises  L7946-L8115  承诺追踪检查(每旬 nextTurn 中调用)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
// 接口风格:全局函数(同 v181 + 已抽 src/data/ + src/core/state.js + helpers.js
// + src/render/ 模块共享 hoisted function 全局可见,无 import/export)。
//
// 归属判定(已 approve 设计原则 (a) 严格审查):
//   `checkEventPromises` 是**真跨链 hub**,7 种 promise type 写口跨链:
//     - B1_deploy / B1_office / B3_office / C2_office / C3_office / G7_deploy
//       / G7_office  → 武将链(G.units / cities[].prefect / G.genLoyalty 等)
//     - C4_unrest                                     → 城市链(garrison / morale / pop / gentry)
//   D-133 fix (batch-20): B4_delayed 死代码删除. 原 9 type → 现 7 type.
//   写口落跨多个链 → 不属任一单链 → 收 hubs.js。
//
// PLAN §二偏离记录(同 phase1_summary §5.3 / phase3_1_notes §二处理方式 — 记录但不改 plan):
//   PLAN §二阶段 3.2 列了 4 候选 hub,scout 实测后按 (a) 原则严格审查:
//     - `triggerFactionEvent`   L5165   写口 100% G.genFactionMod        → 武将链 hub,留 3.7
//     - `checkEventPromises`    L7946   写口跨 7 种 promise 多链         → ✅ 抽
//     - `applyEthosShock`       L13084  写口 100% G.factions[fid].ethos  → 价值观链 hub,留 3.11
//     - `_applyEthosDrift`      L13072  写口同上                          → 价值观链 mutator,留 3.11
//     - "易主路径 hub"          ❌ v181 中**不存在为单一函数**(grep 0 命中,逻辑散在 city.fac 赋值点)
//   实际抽离 1 函数(checkEventPromises)< PLAN 估计的 4。
//
// 反向调用(已 approve 设计原则 (c) 副作用通道):
//   checkEventPromises 抽出后仍会反向调用以下 v181 留下的函数:
//     - `getGenPostDef / addGenChronicle / addIntimacy / _deepCloneGen` — 武将 helper(留 v181,3.7 时归 chains/general.js)
//     - `WILD_GENS / GEN_MAP / FAC` — 部分已抽数据
//     - `_fastForward` — 兄弟 top-level let
//     - `log` / `_showEventToPlayer` / `showNotif` — 已抽通知通道(合理副作用)
//   同 phase 2 render → mechanism 反向调用模式,(c) 已 approve。

/** 承诺追踪检查（每旬nextTurn中调用） */
function checkEventPromises(){
  if(!G._eventPromises) G._eventPromises=[];
  // 先检查是否已履约——提前清除
  const fulfilled = [];
  G._eventPromises = G._eventPromises.filter(p=>{
    const fid = p.fid || G.playerFac;
    const gen = (G.generals[fid]||[]).find(g=>g.name===p.genName);
    // C4_unrest特殊：检查gentry是否回升>=30
    if(p.type==='C4_unrest' && p._c4data){
      const city = G.cities[p._c4data.cityId];
      if(!city || city.fac!==fid){ fulfilled.push({p, reason:'城市丢失'}); return false; }
      if((city.gentry||50) >= 30){ fulfilled.push({p, reason:'豪族已安抚', target:city.name}); return false; }
      return true;
    }
    if(!gen) return false; // 武将已不在势力，静默清除
    if(p.type==='B1_deploy'){
      if(G.units.some(u=>u.fac===fid && u.squads.some(sq=>sq.genName===p.genName))){ fulfilled.push({p, reason:'已编入部队'}); return false; }
    } else if(p.type==='B1_office'){
      if(getGenPostDef(p.genName) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===p.genName)){ fulfilled.push({p, reason:'已任命'}); return false; }
    } else if(p.type==='B3_office'){
      if(getGenPostDef(p.genName) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===p.genName)){ fulfilled.push({p, reason:'已任命'}); return false; }
    } else if(p.type==='C2_office' || p.type==='C3_office'){
      if(getGenPostDef(p.genName) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===p.genName)){ fulfilled.push({p, reason:'已任命'}); return false; }
    } else if(p.type==='G7_deploy'){
      if(G.units.some(u=>u.fac===fid && u.squads.some(sq=>sq.genName===p.genName))){ fulfilled.push({p, reason:'已编入部队'}); return false; }
    } else if(p.type==='G7_office'){
      if(getGenPostDef(p.genName) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===p.genName)){ fulfilled.push({p, reason:'已任命'}); return false; }
    }
    return true;
  });
  // 履约成功日志（按reason分组）
  if(fulfilled.length){
    const byReason = {};
    fulfilled.forEach(f => {
      const r = f.reason;
      if(!byReason[r]) byReason[r] = [];
      byReason[r].push(f.target || f.p.genName);
    });
    Object.entries(byReason).forEach(([reason, names]) => {
      log(`✅ 承诺履约：${names.join('、')}（${reason}）`,'event');
    });
  }
  // ★ v130: deadline前1旬提醒弹窗（仅玩家势力）
  const PROMISE_DESC = {
    'B1_deploy': '编入部队', 'B1_office': '任命官职或太守', 'B3_office': '任命官职',
    'C2_office': '任命官职', 'C3_office': '任命官职',
    'C4_unrest': '安抚豪族（豪族支持度≥30）',
    'G7_deploy': '编入部队（降将试心）',
    'G7_office': '任命官职或太守（降将试心）',
  };
  G._eventPromises.forEach(p=>{
    if((p.fid||G.playerFac) !== G.playerFac) return;
    if(G.turn === p.deadline - 1) p._remindNeeded = true;
  });
  // 合并同类同deadline的提醒为一个弹窗
  if(!G._pendingEvent){
    const reminders = G._eventPromises.filter(p=>p._remindNeeded);
    if(reminders.length){
      // 按type分组
      const grouped = {};
      reminders.forEach(p=>{
        const key = p.type;
        if(!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
      });
      // 取第一组弹窗
      const firstKey = Object.keys(grouped)[0];
      const group = grouped[firstKey];
      const what = PROMISE_DESC[firstKey] || '履行承诺';
      const isC4 = firstKey==='C4_unrest';
      const names = isC4
        ? (G.cities[group[0]._c4data?.cityId]?.name||'某城')
        : group.map(p=>p.genName).join('、');
      const penaltyVal = group[0].penalty;
      const penaltyDesc = isC4
        ? '将爆发豪族暴动（城防清零、民心-25、人口-5%）'
        : (penaltyVal ? `忠诚${penaltyVal}` : '');
      _showEventToPlayer({
        def: {
          id:'_promise_reminder', category:'_sys', priority:1, cooldown:0,
          icon:'⚠', name:'承诺到期提醒',
          narrative(){ return isC4
            ? `${names}豪族不满日益加剧，期限还剩1旬。若不${what}，${penaltyDesc}。`
            : `您曾允诺为${names}${what}，期限还剩1旬。若不履约，${names}${penaltyDesc}。`; },
          choices(){ return [
            { label:'知道了', desc:'请尽快履约', effect(){} },
          ]; },
        },
        ctx: { fid: G.playerFac, genName: names },
      });
    }
    // 清除标记
    G._eventPromises.forEach(p=>delete p._remindNeeded);
  }
  // 检查到期未履约
  const expired=[];
  G._eventPromises = G._eventPromises.filter(p=>{
    if(G.turn > p.deadline){
      expired.push(p);
      return false;
    }
    return true;
  });
  // 执行惩罚
  expired.forEach(p=>{
    // C4豪族暴动
    if(p.type==='C4_unrest' && p._c4data){
      const city = G.cities[p._c4data.cityId];
      const fid = p.fid || G.playerFac;
      if(city && city.fac===fid && (city.gentry||50) < 30){
        city.garrison = 0;
        city.morale = Math.max(0, city.morale - 25);
        city.pop = Math.floor(city.pop * 0.95);
        city.gentry = 0;
        log(`🔥 ${city.name}豪族暴动！城防清零、民心骤降、人口流失！`,'event');
        if(fid===G.playerFac && !_fastForward){
          _showEventToPlayer({
            def:{id:'_c4_riot',category:'_sys',priority:1,cooldown:0,icon:'🔥',name:'豪族暴动',
              narrative(){ return `${city.name}士族揭竿而起！城防军哗变，城中大乱。城防清零，民心骤降，百姓四散逃亡。`; },
              choices(){ return [{label:'知道了',desc:'局势已不可挽回',effect(){}}]; },
            },
            ctx:{fid,genName:city.name},
          });
        }
      }
      return;
    }
    // D-133 fix: B4_delayed 处理删除 (audit verdict=closes via deletion).
    // 原"考察期满自动加入"分支永远到不了 (push 后立即被前置 !gen 静默清除),纯死代码.
    const penalty = p.penalty || 0;
    if(penalty && G.genLoyalty[p.genName]!==undefined){
      G.genLoyalty[p.genName] = Math.max(0, G.genLoyalty[p.genName] + penalty);
      if(G.loyaltyAccum) G.loyaltyAccum[p.genName] = G.genLoyalty[p.genName];
      p._penalized = true;
    }
  });
  // 合并惩罚日志（按penalty值分组）
  const penalized = expired.filter(p=>p._penalized);
  if(penalized.length){
    const byPenalty = {};
    penalized.forEach(p => {
      const pen = p.penalty;
      if(!byPenalty[pen]) byPenalty[pen] = [];
      byPenalty[pen].push(p.genName);
    });
    Object.entries(byPenalty).forEach(([pen, names]) => {
      log(`⚠ 承诺未兑现：${names.join('、')}忠诚${pen}`,'event');
    });
  }
}
