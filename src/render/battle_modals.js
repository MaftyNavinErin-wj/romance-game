// src/render/battle_modals.js
//
// 渲染层(R)— 战斗 confirm/dispose modal cluster.
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.9)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// 4.9 是渲染层第二轮的 🔴 高风险 sub-session(战斗 confirm 链 + 时序耦合)。
// 战斗 modal cluster 是 v181 桶 3 渲染层最后一段大 block:
//   L4237-L6173 (1937 行) 紧接 _siegeArrivalChoice (4.10 边界) 之后,
//   _execInstantMarch (4.10 边界) 之前,中间无杂质。
// _battleSideHtml 是 modal HTML helper,plan 漏列但 11 处 caller 全在 4.9 范围, 一并抽。
// _pendingBattleConfirms / _currentBattleConfirm / _duelChallenger lets 已在 military.js MIL7.a/b 抽离,
//   本 session 抽 modal callback 部分,verbatim 直读这些 let 的 global scope。
//
// ── 抽离范围(1 段连续 block)──
//   R4.9 战斗 modal cluster                                   v181 L4237-L6173  (1937 行)
//                                                17 顶层函数 + 3 内部 helper:
//                                                  _battleSideHtml (HTML helper, 11 caller 全在 4.9)
//                                                  _showAmbushConfirm / confirmAmbush / confirmAmbushAbort
//                                                  _showCampBattleConfirm / confirmCampBattle
//                                                  _showSiegeBattleConfirm / _showSiegeDefendConfirm
//                                                    confirmSiegeDefend / confirmSiegeBattle
//                                                  _showNextBattleConfirm
//                                                  selectDuelChallenger / confirmBattle
//                                                  showNextBattleReport
//                                                    + 内部 helper(scope 内): duelBlockHtml /
//                                                      genEventRows / appendDuelKillRow
//                                                  closeBattleModal
//                                                  showNextPrisonerModal / playerDisposePrisoner
//
// 函数总数: **17 顶层 + 3 内部 = 20 函数**
//
// ── 加载顺序约束 ──
// 必须在以下文件之后加载(直读 G + 调用其中函数):
//   src/core/state.js        (G state)
//   src/data/*               (constants / generals / cities / factions)
//   §8.4 W6-pending-3: GENS_FULL 已退役, origFac lookup → getGenOrigFac, 在场列表 → m.GENS_FULL
//   src/core/helpers.js      (fmt / 各类 calc helper)
//   src/chains/military.js   (_pendingBattleConfirms / _currentBattleConfirm / _duelChallenger lets,
//                             getUnitTroops / calcSurrenderRate / surrenderGen / releaseGen / killGen 等)
//   src/chains/general.js    (addGenChronicle 等)
//   src/render/notifications.js (log)
//   src/render/tabs.js       (renderAll / renderAllLight, 注:仍在 v181 inline)
//   src/render/diplo_modals.js (showCourtCouncil)
//
// 必须在以下加载之前 / 平级:
//   v181 inline (renderAll / renderAllLight 等仍在 v181)
//

/**
/**
 * v97: 战斗确认弹窗的阵容显示——敌方侧应用情报模糊
 * @param {Array} units 一方的部队列表
 * @param {number} troops 该方总兵力
 * @param {boolean} isEnemySide 是否是敌方（true→模糊）
 * @param {Array} [playerUnits] 玩家参战部队（用于取INT，仅isEnemySide=true时需要）
 */
function _battleSideHtml(units, troops, isEnemySide, playerUnits) {
  if (!isEnemySide) {
    // ★ v101: 己方按部队拆分，精确显示
    if (units.length <= 1) {
      // 单部队：原样
      const genInfos = units.flatMap(u => u.squads.map(sq => {
        const g = GEN_MAP[sq.genName] || {war:60, int:60};
        return sq.genName + '<span style="font-size:8px;color:rgba(92,74,50,.40);margin-left:1px">武' + g.war + ' 智' + g.int + '</span>';
      })).join('、');
      const troopStr = troops >= 10000 ? (troops/10000).toFixed(1) + '万' : fmt(troops);
      return '<div style="font-size:11px;font-weight:700;color:rgba(44,36,22,.85);margin-bottom:6px;line-height:1.8">' + genInfos + '</div>' +
        '<div style="font-size:10px;color:rgba(44,36,22,.50);line-height:2">兵力 <b style="color:rgba(44,36,22,.80);margin-left:4px">' + troopStr + '</b></div>';
    }
    // 多部队：逐部队拆分
    let html = '';
    units.forEach((u, i) => {
      const ut = getUnitTroops(u);
      const genNames = u.squads.map(sq => {
        const g = GEN_MAP[sq.genName] || {war:60, int:60};
        return sq.genName + '<span style="font-size:8px;color:rgba(92,74,50,.40);margin-left:1px">武' + g.war + ' 智' + g.int + '</span>';
      }).join('、');
      const tStr = ut >= 10000 ? (ut/10000).toFixed(1) + '万' : fmt(ut);
      html += '<div style="font-size:10px;color:rgba(44,36,22,.80);line-height:1.9;' + (i > 0 ? 'margin-top:2px;' : '') + '">' +
        '<span style="font-weight:700">' + genNames + '</span>' +
        '<span style="color:rgba(44,36,22,.45);margin-left:6px;font-size:9px">' + tStr + '</span></div>';
    });
    const totalStr = troops >= 10000 ? (troops/10000).toFixed(1) + '万' : fmt(troops);
    html += '<div style="font-size:9px;color:rgba(44,36,22,.40);margin-top:4px;border-top:1px solid rgba(80,65,40,.08);padding-top:3px">合计兵力 <b style="color:rgba(44,36,22,.65)">' + totalStr + '</b></div>';
    return html;
  }

  // ★ v101: 敌方按部队拆分，逐部队模糊
  let maxInt = 0;
  (playerUnits || []).forEach(u => (u.squads || []).forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if (g && g.int > maxInt) maxInt = g.int;
  }));

  if (units.length <= 1) {
    // 单部队敌方：原逻辑
    let genInfos;
    if (maxInt >= 90) {
      genInfos = units.flatMap(u => u.squads.map(sq => {
        const g = GEN_MAP[sq.genName] || {war:60, int:60};
        return sq.genName + '<span style="font-size:8px;color:rgba(92,74,50,.40);margin-left:1px">武' + g.war + ' 智' + g.int + '</span>';
      })).join('、');
    } else if (maxInt >= 75) {
      genInfos = units.flatMap(u => u.squads.map(sq => sq.genName)).join('、');
    } else if (maxInt >= 60) {
      genInfos = (units[0]?.squads[0]?.genName || '?') + '部';
    } else {
      genInfos = '<span style="color:rgba(92,74,50,.40)">不明将领</span>';
    }
    const troopStr = fuzzyTroopDisplay(troops, maxInt);
    const intelHint = maxInt >= 90 ? '' : ' <span style="font-size:8px;color:rgba(80,65,40,.15)">(' +
      (maxInt >= 75 ? '情报较清晰' : maxInt >= 60 ? '情报模糊' : '情报极模糊') + ')</span>';
    return '<div style="font-size:11px;font-weight:700;color:rgba(44,36,22,.85);margin-bottom:6px;line-height:1.8">' + genInfos + intelHint + '</div>' +
      '<div style="font-size:10px;color:rgba(44,36,22,.50);line-height:2">兵力 <b style="color:rgba(44,36,22,.80);margin-left:4px">' + troopStr + '</b></div>';
  }

  // 多部队敌方：逐部队模糊
  const intelHint = maxInt >= 90 ? '' : ' <span style="font-size:8px;color:rgba(80,65,40,.15)">(' +
    (maxInt >= 75 ? '情报较清晰' : maxInt >= 60 ? '情报模糊' : '情报极模糊') + ')</span>';
  let html = '';
  units.forEach((u, i) => {
    const ut = getUnitTroops(u);
    let genStr;
    if (maxInt >= 90) {
      genStr = u.squads.map(sq => {
        const g = GEN_MAP[sq.genName] || {war:60, int:60};
        return sq.genName + '<span style="font-size:8px;color:rgba(92,74,50,.40);margin-left:1px">武' + g.war + ' 智' + g.int + '</span>';
      }).join('、');
    } else if (maxInt >= 75) {
      genStr = u.squads.map(sq => sq.genName).join('、');
    } else if (maxInt >= 60) {
      genStr = (u.squads[0]?.genName || '?') + '部';
    } else {
      genStr = '不明部队';
    }
    const tStr = fuzzyTroopDisplay(ut, maxInt);
    html += '<div style="font-size:10px;color:rgba(44,36,22,.80);line-height:1.9;' + (i > 0 ? 'margin-top:2px;' : '') + '">' +
      '<span style="font-weight:700">' + genStr + '</span>' +
      '<span style="color:rgba(44,36,22,.45);margin-left:6px;font-size:9px">' + tStr + '</span></div>';
  });
  const totalStr = fuzzyTroopDisplay(troops, maxInt);
  html += '<div style="font-size:9px;color:rgba(44,36,22,.40);margin-top:4px;border-top:1px solid rgba(80,65,40,.08);padding-top:3px">合计兵力 <b style="color:rgba(44,36,22,.65)">' + totalStr + '</b>' + intelHint + '</div>';
  return html;
}

/**
 * 伏击战确认弹窗（玩家为伏击方）
 */
function _showAmbushConfirm(ambushers, victims, nodeLabel, terrain){
  const atkCP = ambushers.reduce((s,u)=>s+calcUnitATK(u, victims),0);
  const victimDEF = victims.reduce((s,u)=>s+calcUnitDEF(u),0);  // 用于 getStrengthLabel
  const atkTroops = ambushers.reduce((s,u)=>s+getUnitTroops(u),0);
  const defTroops = victims.reduce((s,u)=>s+getUnitTroops(u),0);
  const ambushInt = getMaxInt(ambushers);
  const victimInt = getMaxInt(victims);
  const baseTerrain = terrain || 'plain';
  const baseChance = AMBUSH_BASE_CHANCE[baseTerrain]||0.15;
  const capHigh = (baseTerrain==='plain'||baseTerrain==='road')?0.45:(baseTerrain==='water')?0.20:0.90;
  const capLow  = (baseTerrain==='plain'||baseTerrain==='road')?0.05:(baseTerrain==='water')?0.02:0.10;
  let ambushChance = Math.min(capHigh,Math.max(capLow, baseChance+(ambushInt-victimInt)*0.008));
  if(hasFacGen(G.playerFac,'诸葛亮') && genHasOffice('诸葛亮', G.playerFac)) ambushChance = Math.min(capHigh, ambushChance+0.10);
  // ★ v101: 敌方有诸葛亮时识破-10%（与resolveAmbush保持一致）
  const victimFid = victims[0]?.fac;
  if(victimFid && hasFacGen(victimFid,'诸葛亮') && genHasOffice('诸葛亮', victimFid)) ambushChance = Math.max(capLow, ambushChance-0.10);

  const terrainLabel = {mountain:'山地',forest:'林地',hill:'丘陵',plain:'平原',road:'平原',water:'水路'}[baseTerrain]||baseTerrain;

  document.getElementById('bcLocation').textContent = '【' + nodeLabel + '】伏击战';

  document.getElementById('bcPlayerContent').innerHTML =
    '<div style="font-size:9px;color:#8040a0;margin-bottom:4px">🌿 伏击方</div>'+_battleSideHtml(ambushers, atkTroops, false);
  document.getElementById('bcEnemyContent').innerHTML =
    '<div style="font-size:9px;color:rgba(44,36,22,.45);margin-bottom:4px">🚶 行军方</div>'+_battleSideHtml(victims, defTroops, true, ambushers);

  document.getElementById('bcOdds').innerHTML =
    '地形：<b style="color:#8a7030">'+terrainLabel+'</b>&emsp;中伏率约 <b style="color:'+(ambushChance*100>=55?'#1a8a45':ambushChance*100>=35?'#8a7030':'#b04040')+';font-size:12px">'+Math.round(ambushChance*100)+'%</b>'+
    '&emsp;&emsp;态势：'+getStrengthLabel(atkCP, victimDEF);

  // 叫阵区域：显示伏击说明 + 火攻选项
  const existing = document.getElementById('bcDuelArea');
  if(existing) existing.remove();
  const fireAreaOld = document.getElementById('bcFireArea');
  if(fireAreaOld) fireAreaOld.remove();

  // 伏击说明 + 火攻勾选
  const season = SEASONS[G.seasonIdx]||'春';
  const firePossible = canFireAttack(baseTerrain);
  const pfac = G.factions[G.playerFac]||{};
  const hasRes = (pfac.res.gold||0)>=FIRE_COST.gold && (pfac.res.wood||0)>=FIRE_COST.wood;
  const fireDisabled = !firePossible || !hasRes;
  const tMult = FIRE_TERRAIN_MULT[baseTerrain]||1.0;
  const sMult = FIRE_SEASON_MULT[season]||1.0;
  const fireRate = firePossible ? Math.round(calcFireRate(ambushers,victims)*100) : 0;
  const disabledReason = !firePossible ? '（'+terrainLabel+'不可用火攻）'
    : !hasRes ? '（资源不足：需金'+FIRE_COST.gold+'/粮'+FIRE_COST.food+'/木'+FIRE_COST.wood+'）' : '';

  const duelEl = document.createElement('div');
  duelEl.id = 'bcDuelArea';
  duelEl.innerHTML =
    '<div style="margin:10px 0 6px;padding:10px 14px;background:rgba(245,240,228,.5);border-radius:6px;border:1px solid rgba(128,64,160,.15)">' +
    '<div style="font-size:10px;color:rgba(192,96,224,.75);font-weight:700;margin-bottom:8px">🌿 伏击战</div>' +
    '<div style="font-size:9px;color:rgba(44,36,22,.55);line-height:1.9">'+
    '中伏率 <b style="color:#8a7030">'+Math.round(ambushChance*100)+'%</b>（智力'+ambushInt+' vs '+victimInt+'，地形：'+terrainLabel+'）<br>'+
    '奇袭得手：受伏方士气大降，战力削减，无法撤退。'+
    '</div></div>' +
    '<div style="margin:6px 0 4px;padding:8px 12px;background:rgba(245,235,218,.55);border-radius:6px;border:1px solid rgba(220,100,30,'+(fireDisabled?'.15':'.35')+');opacity:'+(fireDisabled?'0.5':'1')+'">' +
    '<label style="display:flex;align-items:center;gap:8px;cursor:'+(fireDisabled?'not-allowed':'pointer')+';font-size:10px;color:rgba(44,36,22,.85)">' +
    '<input type="checkbox" id="bcFireCheck" '+(fireDisabled?'disabled':'')+' style="width:14px;height:14px;accent-color:#e85020;cursor:'+(fireDisabled?'not-allowed':'pointer')+'">' +
    '<span>🔥 发动<b style="color:#e85020">火攻</b>' +
    (fireDisabled
      ? '<span style="color:rgba(92,74,50,.35);margin-left:4px">'+disabledReason+'</span>'
      : '&emsp;<span style="color:rgba(92,74,50,.65)">消耗 金'+FIRE_COST.gold+' 粮'+FIRE_COST.food+' 木'+FIRE_COST.wood+'（无论成败）</span>') +
    '</span></label>' +
    (firePossible && hasRes
      ? '<div style="margin-top:5px;font-size:9px;color:rgba(92,74,50,.75);line-height:1.8;padding-left:22px">'+
        '成功率 <b style="color:#8a7030">'+fireRate+'%</b>&emsp;'+
        '地形×'+tMult+'&emsp;季节（'+season+'）×'+sMult+'&emsp;叠加 <b style="color:#e85020">×'+(tMult*sMult).toFixed(2)+'</b>&emsp;'+
        '效果：敌士气-<b>'+Math.round(15*tMult*sMult)+'%</b> 战力-<b>'+Math.round(10*tMult*sMult)+'%</b>'+
        '</div>'
      : '') +
    '</div>';
  document.getElementById('bcRetreatHint').before(duelEl);

  // 计算放弃伏击被发现率
  const enemyMaxInt = victimInt;
  const abortDetectRate = Math.min(0.85, Math.max(0.10, 0.30 + enemyMaxInt * 0.003));

  document.getElementById('bcRetreatHint').innerHTML = '放弃伏击：悄然撤离，被发现率约<b style="color:#8a7030">' + Math.round(abortDetectRate*100) + '%</b>（敌方智谋' + enemyMaxInt + '）<br><span style="color:rgba(44,36,22,.35)">被发现则强制进入野战且己方士气-15，未发现则安全撤走</span>';
  const retBtn = document.getElementById('bcBtnRetreat');
  retBtn.disabled = false;
  retBtn.style.cssText = 'padding:8px 18px;font-size:11px;color:rgba(92,74,50,.7);background:rgba(80,65,40,.1);border:1px solid rgba(92,74,50,.3);border-radius:5px;cursor:pointer';
  retBtn.textContent = '🚶 放弃伏击（被发现率' + Math.round(abortDetectRate*100) + '%）';
  retBtn.onclick = function(){ confirmAmbushAbort(); };

  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){
    fightBtn.textContent = '⚔ 发起伏击';
    fightBtn.style.cssText = 'padding:10px 24px;font-size:13px;font-weight:700;color:#8040a0;background:rgba(128,64,160,.12);border:2px solid rgba(128,64,160,.35);border-radius:6px;cursor:pointer;text-shadow:none;letter-spacing:1px';
    fightBtn.onclick = function(){ confirmAmbush(); };
  }

  document.getElementById('battleConfirmModal').style.display='flex';
}

async function confirmAmbush(){
  document.getElementById('battleConfirmModal').style.display='none';
  if(!_currentBattleConfirm){ console.warn('[ambush] _currentBattleConfirm is null'); return; }
  const { playerSide, enemySide, nodeLabel, ambushTerrain } = _currentBattleConfirm;
  _currentBattleConfirm = null;

  const useFireAttack = !!(document.getElementById('bcFireCheck')?.checked);
  const fireAreaEl = document.getElementById('bcFireArea');
  if(fireAreaEl) fireAreaEl.remove();
  // 还原按钮
  const retBtn = document.getElementById('bcBtnRetreat');
  if(retBtn){ retBtn.disabled=false; retBtn.style.opacity='1'; retBtn.style.cursor='pointer'; retBtn.textContent='🏃 撤退'; retBtn.onclick=function(){ confirmBattle(false); }; }
  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){ fightBtn.style.cssText=''; fightBtn.textContent='⚔ 迎战'; fightBtn.onclick=function(){ confirmBattle(true); }; }

  // 校验部队有效性（防止弹窗期间部队被其他逻辑清除）
  const validPlayer = playerSide.filter(u => u.squads && u.squads.some(sq => sq.troops > 0));
  const validEnemy  = enemySide.filter(u => u.squads && u.squads.some(sq => sq.troops > 0));
  if(!validPlayer.length || !validEnemy.length){
    console.warn('[ambush] 部队已失效, player:', validPlayer.length, 'enemy:', validEnemy.length);
    log('⚠ 伏击战取消：部队已不在战场', 'battle');
    // 解除伏击状态
    playerSide.forEach(u => { if(u.status === 'ambush') u.status = 'halt'; });
    renderAll();
    if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
    else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
    return;
  }

  // ★ v175: 战前位置快照（供动画定位）
  const _ambushPosSnap = {};
  [...validPlayer, ...validEnemy].forEach(u => {
    _ambushPosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) };
  });

  let ambushReport = null;
  try {
    ambushReport = resolveAmbush(validPlayer, validEnemy, ambushTerrain, useFireAttack);
    ambushReport.node = nodeLabel;
    _battleReports.push(ambushReport);
    log('🎯 【'+nodeLabel+'】'+(validPlayer[0]?.squads[0]?.genName||'?')+'部 发起伏击'+(useFireAttack?'（火攻）':'')+'，'+(ambushReport.ambushHit?'奇袭得手！':'伏兵被识破！'), 'battle');
  } catch(err) {
    console.error('[ambush] resolveAmbush crashed:', err);
    log('⚠ 伏击结算异常：'+err.message, 'battle');
    // 兜底：解除伏击状态，避免部队卡死
    playerSide.forEach(u => { if(u.status === 'ambush') u.status = 'halt'; });
  }

  // ★ v175: 播放伏击战动画（attackers=伏击方=玩家, defenders=受伏方=敌方）
  if(ambushReport){
    try {
      await _playAmbushBattleAnim(ambushReport, validPlayer, validEnemy, _ambushPosSnap);
    } catch(e){ console.error('[AmbushAnim] trigger failed:', e); }
  }

  renderAll();
  if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
  else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
}

/** v83: 放弃伏击——悄然撤离，有被发现的风险 */
function confirmAmbushAbort(){
  document.getElementById('battleConfirmModal').style.display='none';
  if(!_currentBattleConfirm){ console.warn('[ambushAbort] _currentBattleConfirm is null'); return; }
  const { playerSide, enemySide, nodeLabel } = _currentBattleConfirm;
  _currentBattleConfirm = null;

  // 清理UI元素
  const fireAreaEl = document.getElementById('bcFireArea');
  if(fireAreaEl) fireAreaEl.remove();
  const retBtn = document.getElementById('bcBtnRetreat');
  if(retBtn){ retBtn.disabled=false; retBtn.style.cssText=''; retBtn.textContent='🏃 撤退'; retBtn.onclick=function(){ confirmBattle(false); }; }
  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){ fightBtn.style.cssText=''; fightBtn.textContent='⚔ 迎战'; fightBtn.onclick=function(){ confirmBattle(true); }; }

  try {
    // 解除伏击状态
    playerSide.forEach(u => { u.status = 'halt'; });

    // 敌方察觉判定
    const enemyMaxInt = getMaxInt(enemySide);
    const detectRate = Math.min(0.85, Math.max(0.10, 0.30 + enemyMaxInt * 0.003));
    const detected = Math.random() < detectRate;

    if(detected){
      // 被发现：强制野战，己方士气-15
      playerSide.forEach(u => u.squads.forEach(sq => {
        sq.morale = Math.max(5, (sq.morale||80) - 15);
      }));
      log('⚠ 【'+nodeLabel+'】伏兵撤退时被敌军发现！仓促应战，士气大降！', 'battle');

      // 用普通野战结算（敌方为攻方，我方为守方）
      const terrain = getTerrainAt(playerSide[0]?.hq||0, playerSide[0]?.hr||0);
      const report = resolveBattle(enemySide, playerSide, terrain);
      report.type = 'battle';
      report.atkFac = enemySide[0].fac;
      report.defFac = playerSide[0].fac;
      report.atkNames = enemySide.map(u=>u.squads[0]?.genName+'部').join('、');
      report.defNames = playerSide.map(u=>u.squads[0]?.genName+'部').join('、');
      report.node = nodeLabel;
      report.ambushAbortDetected = true;
      _battleReports.push(report);

      // 战后败方撤退2格
      const losers = report.atkWins ? playerSide : enemySide;
      const winners = report.atkWins ? enemySide : playerSide;
      const wiped = losers.filter(u=>u.squads.every(sq=>sq.troops<=0));
      wiped.forEach(u=>{
        G.units = G.units.filter(x=>x.id!==u.id);
        if(G.selUnitId===u.id) G.selUnitId=null;
      });
      const survivors = losers.filter(u=>u.squads.some(sq=>sq.troops>0));
      survivors.forEach(u => _doRetreat2Hex(u, winners));
    } else {
      // 未被发现：安全撤离2格
      log('🌿 【'+nodeLabel+'】伏兵悄然撤离，敌军未曾察觉。', 'battle');
      playerSide.forEach(u => _doRetreat2Hex(u, enemySide));
    }

  } catch(err) {
    console.error('[ambushAbort] crashed:', err);
    log('⚠ 放弃伏击结算异常：'+err.message, 'battle');
    playerSide.forEach(u => { if(u.status === 'ambush') u.status = 'halt'; });
  }

  renderAll();
  if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
  else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
}

/** v83: 撤退2格——向远离敌方的方向移动2步 */
// 军事链 MIL7.c (_doRetreat2Hex,L17356-L17384) 已抽离到 src/chains/military.js

function _showCampBattleConfirm(attackers, defenders, nodeLabel){
  const atkATK_camp = attackers.reduce((s,u)=>s+calcUnitATK(u, defenders),0);
  const defDEF_camp = defenders.reduce((s,u)=>s+calcUnitDEF(u),0);
  const atkTroops = attackers.reduce((s,u)=>s+getUnitTroops(u),0);
  const defTroops = defenders.reduce((s,u)=>s+getUnitTroops(u),0);
  const raidChance = calcRaidChance(attackers, defenders);
  const assaultRatio = atkATK_camp / (defDEF_camp * 1.10 || 1); // 强攻：守方DEF×1.10
  const assaultWinPct = Math.round(Math.min(95, Math.max(5, 50 + (assaultRatio-1)*28)));

  const facName = f => ({wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'}[f]||f);

  // 复用 battleConfirmModal 结构，先清空再注入营寨战专属内容
  document.getElementById('bcLocation').textContent = '【' + nodeLabel + '】营寨战';

  document.getElementById('bcPlayerContent').innerHTML =
    '<div style="font-size:9px;color:#8a7030;margin-bottom:4px">⚔ 攻方</div>' + _battleSideHtml(attackers, atkTroops, false);
  document.getElementById('bcEnemyContent').innerHTML =
    '<div style="font-size:9px;color:#1a8a45;margin-bottom:4px">🏕 守方（营寨防御+10%防御）</div>' + _battleSideHtml(defenders, defTroops, true, attackers);

  document.getElementById('bcOdds').innerHTML =
    '强攻态势：' + getStrengthLabel(atkATK_camp, defDEF_camp * 1.10) +
    '&emsp;&emsp;劫营成功率约 <b style="color:' + (raidChance*100>=55?'#1a8a45':raidChance*100>=35?'#8a7030':'#b04040') + ';font-size:12px">' + Math.round(raidChance*100) + '%</b>';

  // 清除叫阵区域
  const duelArea = document.getElementById('bcDuelArea');
  if(duelArea) duelArea.remove();

  // 注入营寨战说明
  const campInfo = document.createElement('div');
  campInfo.id = 'bcDuelArea';
  campInfo.innerHTML =
    '<div style="margin:10px 0 6px;padding:10px 14px;background:rgba(245,240,228,.5);border-radius:6px;border:1px solid rgba(92,74,50,.18)">' +
    '<div style="font-size:10px;color:rgba(44,36,22,.7);font-weight:700;margin-bottom:8px">🏕 营寨战策略选择</div>' +
    '<div style="font-size:9px;color:rgba(44,36,22,.55);line-height:1.9">' +
    '<span style="color:#8a7030">【强攻】</span> 正面强攻营寨，守方战力+10%，可叫阵单挑，可撤退。守方叫阵胜利士气额外+30。<br>' +
    '<span style="color:#c03030">【劫营】</span> 趁夜奇袭，成功率' + Math.round(raidChance*100) + '%（取决于智力差与武力）。成功：守方士气-30、战力加成失效，我方先手×1.10；失败：我方士气-20、无法交战。' +
    '</div></div>';
  document.getElementById('bcRetreatHint').before(campInfo);

  // 修改按钮文字和逻辑
  // ── 火攻勾选区（地形允许时显示）──
  {
    const existingFire = document.getElementById('bcFireArea');
    if(existingFire) existingFire.remove();
    const campTerrain = _currentBattleConfirm
      ? getTerrainAt(_currentBattleConfirm.playerSide[0]?.hq||0, _currentBattleConfirm.playerSide[0]?.hr||0)
      : 'plain';
    const firePossible = canFireAttack(campTerrain);
    const playerFac = G.playerFac;
    const pfac = G.factions[playerFac] || {};
    const hasRes = (pfac.res.gold||0)>=FIRE_COST.gold && (pfac.res.wood||0)>=FIRE_COST.wood;
    const fireArea = document.createElement('div');
    fireArea.id = 'bcFireArea';
    const season = SEASONS[G.seasonIdx]||'春';
    const tMult = FIRE_TERRAIN_MULT[campTerrain]||1.0;
    const sMult = FIRE_SEASON_MULT[season]||1.0;
    const fireRate = firePossible ? Math.round(calcFireRate(_currentBattleConfirm.playerSide, _currentBattleConfirm.enemySide)*100) : 0;
    const fireDisabled = !firePossible || !hasRes;
    const disabledReason = !firePossible ? `（${({forest:'林地',mountain:'山地',hill:'丘陵',plain:'平原',water:'水路'})[campTerrain]||campTerrain}不可用）`
      : !hasRes ? `（资源不足：需金${FIRE_COST.gold}/粮${FIRE_COST.food}/木${FIRE_COST.wood}）` : '';
    fireArea.innerHTML =
      '<div style="margin:8px 0 4px;padding:8px 12px;background:rgba(245,235,218,.55);border-radius:6px;border:1px solid rgba(220,100,30,' + (fireDisabled?'.15':'.35') + ');opacity:' + (fireDisabled?'0.5':'1') + '">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:' + (fireDisabled?'not-allowed':'pointer') + ';font-size:10px;color:rgba(44,36,22,.85)">' +
      '<input type="checkbox" id="bcFireCheck" ' + (fireDisabled?'disabled':'') + ' style="width:14px;height:14px;accent-color:#e85020;cursor:' + (fireDisabled?'not-allowed':'pointer') + '">' +
      '<span>🔥 发动<b style="color:#e85020">火攻</b>' +
      (fireDisabled
        ? '<span style="color:rgba(92,74,50,.35);margin-left:4px">' + disabledReason + '</span>'
        : '&emsp;<span style="color:rgba(92,74,50,.65)">消耗 金' + FIRE_COST.gold + ' 粮' + FIRE_COST.food + ' 木' + FIRE_COST.wood + '（无论成败）</span>') +
      '</span></label>' +
      (firePossible && hasRes
        ? '<div style="margin-top:5px;font-size:9px;color:rgba(92,74,50,.75);line-height:1.8;padding-left:22px">' +
          '成功率 <b style="color:#8a7030">' + fireRate + '%</b>&emsp;' +
          '地形 ×' + tMult + '&emsp;季节（' + season + '）×' + sMult + '&emsp;' +
          '叠加倍率 <b style="color:#e85020">×' + (tMult*sMult).toFixed(2) + '</b>&emsp;' +
          '效果：敌士气-<b>' + Math.round(15*tMult*sMult) + '%</b> 战力-<b>' + Math.round(10*tMult*sMult) + '%</b>' +
          '</div>'
        : '') +
      '</div>';
    document.getElementById('bcRetreatHint').before(fireArea);
  }

  document.getElementById('bcRetreatHint').textContent = '劫营失败则强制撤退，不进行战斗结算';
  const retBtn = document.getElementById('bcBtnRetreat');
  retBtn.disabled = false;
  retBtn.style.opacity = '1';
  retBtn.style.cursor = 'pointer';
  retBtn.textContent = '💤 劫营夜袭';
  retBtn.onclick = function(){ confirmCampBattle('raid'); };

  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){
    fightBtn.textContent = '⚔ 强攻营寨';
    fightBtn.onclick = function(){ confirmCampBattle('assault'); };
  }

  document.getElementById('battleConfirmModal').style.display='flex';
  // ── AI 守方叫阵检测（营寨战）──
  {
    const campAiChallenger = aiDecideDuelChallenger(defenders, 'defender', attackers);
    if (campAiChallenger && _currentBattleConfirm) {
      _currentBattleConfirm._aiPreDuel = { challengerName: campAiChallenger, pending: true };
      const challGCA = GEN_MAP[campAiChallenger] || { war: 60 }; // ★ v146fix: allGensCA→GEN_MAP
      const atkCandsCA = getDuelCandidates(attackers, false);
      const bestAtkCA = atkCandsCA.length
        ? atkCandsCA.map(c => ({ ...c, war: (GEN_MAP[c.name] || { war: 60 }).war })).sort((a, b) => b.war - a.war)[0]
        : null;
      const myAccCA = bestAtkCA ? Math.round(Math.min(95, Math.max(15, bestAtkCA.war - 5))) : 50;
      const campBanner = document.createElement('div');
      campBanner.style.cssText = 'margin-bottom:8px;padding:8px 12px;background:rgba(192,48,48,.08);border:1px solid rgba(192,48,48,.25);border-radius:5px;font-size:10px;color:rgba(44,36,22,.7);line-height:1.8';
      campBanner.innerHTML = '⚠ 守将 <b style="color:#c03030">' + campAiChallenger + '</b>（武' + challGCA.war + '）出营叫阵！' +
        (bestAtkCA ? '我方<b>' + bestAtkCA.name + '</b>（武' + bestAtkCA.war + '）迎战概率约 <b style="color:' + (myAccCA>=60?'#c03030':myAccCA>=40?'#8a7030':'#2a7a9a') + '">' + myAccCA + '%</b>' : '') +
        '<span style="color:rgba(92,74,50,.45);font-size:9px">（仅强攻时触发）</span>';
      const duelAreaCA = document.getElementById('bcDuelArea');
      if (duelAreaCA) duelAreaCA.prepend(campBanner);
    }
  }
}

async function confirmCampBattle(mode){
  document.getElementById('battleConfirmModal').style.display='none';
  if(!_currentBattleConfirm) return;
  const { playerSide, enemySide, nodeLabel, _aiPreDuel: campAiPreDuel } = _currentBattleConfirm;
  _currentBattleConfirm = null;

  // 读取火攻勾选状态
  const useFireAttack = !!(document.getElementById('bcFireCheck')?.checked);
  // 清理火攻区域
  const fireAreaEl = document.getElementById('bcFireArea');
  if(fireAreaEl) fireAreaEl.remove();

  // 重置按钮文字和 onclick 回到默认
  const retBtn = document.getElementById('bcBtnRetreat');
  if(retBtn){ retBtn.textContent = '🏃 撤退'; retBtn.onclick = function(){ confirmBattle(false); }; }
  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){ fightBtn.textContent = '⚔ 迎战'; fightBtn.onclick = function(){ confirmBattle(true); }; }

  // ★ v175: 战前位置快照（防止 doRetreat 改动 unit.hq/hr 导致动画位置错位）
  const _campPosSnap = {};
  [...playerSide, ...enemySide].forEach(u => {
    _campPosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) };
  });

  let campReport = null;

  if(mode === 'assault'){
    // ── AI 守方先叫阵（强攻时）──
    let assaultActiveDuel = null;
    if (campAiPreDuel) {
      const atkCandsC = getDuelCandidates(playerSide, false);
      const bestAtkC = atkCandsC.length
        ? atkCandsC.map(c => ({ ...c, war: (GEN_MAP[c.name] || { war: 60 }).war })).sort((a, b) => b.war - a.war)[0]
        : null;
      if (bestAtkC) {
        const acceptPctC = Math.min(0.95, Math.max(0.15, (bestAtkC.war - 5) / 100));
        if (Math.random() < acceptPctC) {
          assaultActiveDuel = resolveDuel(campAiPreDuel.challengerName, bestAtkC.name, 'active');
          assaultActiveDuel.accepted = true;
          assaultActiveDuel.aiWasChallenger = true;
          applyDuelMorale(enemySide, playerSide, assaultActiveDuel);
        } else {
          playerSide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
          enemySide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
          assaultActiveDuel = { accepted: false, challengerName: campAiPreDuel.challengerName, aiWasChallenger: true };
        }
      }
    }
    // 强攻：走完整野战弹窗（含叫阵），但守方有camp加成
    // 先给守方士气临时+10模拟营寨防御加成
    playerSide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale); }));
    enemySide.forEach(u => u.squads.forEach(sq => {
      sq._campAssaultBonus = true;
      sq.morale = Math.min(100, sq.morale + 10);
    }));
    // 直接进行战斗结算（带叫阵提示展示已在 _showCampBattleConfirm 中说明）
    campReport = resolveCampBattle(playerSide, enemySide, 'assault', nodeLabel, useFireAttack);
    campReport.playerWasAttacker = true;
    if (assaultActiveDuel) campReport.activeDuel = assaultActiveDuel;
    _battleReports.push(campReport);
    // 还原临时加成
    enemySide.forEach(u => u.squads.forEach(sq => { sq._campAssaultBonus = false; }));
    log('🏕 【' + nodeLabel + '】' + (playerSide[0]?.squads[0]?.genName||'?') + '部 强攻营寨' + (useFireAttack?'（火攻）':''), 'battle');
  } else {
    // 劫营夜袭
    campReport = resolveCampBattle(playerSide, enemySide, 'raid', nodeLabel, useFireAttack);
    campReport.playerWasAttacker = true;
    _battleReports.push(campReport);
    log('🏕 【' + nodeLabel + '】' + (playerSide[0]?.squads[0]?.genName||'?') + '部 劫营夜袭' + (useFireAttack?'（火攻）':''), 'battle');
  }

  // ★ v175: 播放营寨战动画（自动按 report.mode 路由到 raid/assault）
  if(campReport){
    try {
      await _playCampBattleAnim(campReport, playerSide, enemySide, _campPosSnap);
    } catch(e){ console.error('[CampAnim] trigger failed:', e); }
  }

  renderAll();
  if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
  else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
}

function _showSiegeBattleConfirm(attackers, defenders, city, nodeLabel){
  const atkCP = attackers.reduce((s,u)=>s+calcUnitATK(u, defenders),0);
  const defDEF = defenders.reduce((s,u)=>s+calcUnitDEF(u),0);
  const atkTroops = attackers.reduce((s,u)=>s+getUnitTroops(u),0);
  const defTroops = defenders.reduce((s,u)=>s+getUnitTroops(u),0);
  const defMult = getSiegeDefMult(city);
  const size = city.size || 'medium';
  const sizeLabel = {small:'小城',medium:'中城',large:'大城'}[size]||size;
  const decayPct = Math.round((city.siegeDecay||0)*100);
  const maxTurns = SIEGE_MAX_TURNS[size]||9;
  const defDEFActual = defDEF * defMult;  // 含城防加成的守方DEF估算

  document.getElementById('bcLocation').textContent = '【' + nodeLabel + '】攻城战';

  document.getElementById('bcPlayerContent').innerHTML =
    '<div style="font-size:9px;color:#8a7030;margin-bottom:4px">⚔ 攻方（已围城' + (attackers[0]?._siegeTurnCount||0) + '旬）</div>' +
    _battleSideHtml(attackers, atkTroops, false);
  document.getElementById('bcEnemyContent').innerHTML =
    '<div style="font-size:9px;color:#1a8a45;margin-bottom:4px">🏰 守方（' + sizeLabel + '）</div>' +
    _battleSideHtml(defenders, defTroops, true, attackers);

  const defMultCol = defMult<=1.05?'#1a8a45':defMult<=1.15?'#8a7030':'#e07040';
  const strengthLabel = getStrengthLabel(atkCP, defDEFActual);
  document.getElementById('bcOdds').innerHTML =
    '守方城防加成 <b style="color:' + defMultCol + '">×' + defMult.toFixed(2) + '</b>' +
    '（围城进度' + decayPct + '%' +
    (decayPct<100 ? '，继续围约' + Math.ceil((1-(city.siegeDecay||0))*maxTurns) + '旬可瓦解' : '，城防已瓦解') +
    '）<br>攻城态势：' + strengthLabel;

  // 叫阵区域
  // ★ v86: 守方无武将（纯驻军城市）时隐藏叫阵——没有对手
  const defHasGenerals = defenders.some(u => u.squads.some(sq => GEN_MAP[sq.genName]));
  const candidates = getDuelCandidates(attackers);
  let duelHtml = '';
  if(candidates.length > 0 && defHasGenerals){
    const genBtns = candidates.map(cand=>{
      const g = GEN_MAP[cand.name]||{war:60};
      return '<div class="bc-duel-gen" id="duelBtn_' + cand.name + '" onclick="selectDuelChallenger(\'' + cand.name + '\')">' +
        cand.name + ' <span style="font-size:8px;color:rgba(92,74,50,.55)">武' + g.war + '</span></div>';
    }).join('');
    duelHtml = '<div class="bc-duel-section">' +
      '<div class="bc-duel-title">⚔ 战前叫阵 <span style="font-size:8px;color:rgba(92,74,50,.35);font-weight:400">（可选）</span></div>' +
      '<div class="bc-duel-gen-list" id="bcDuelGenList">' +
      '<div class="bc-duel-gen" id="duelBtn_none" onclick="selectDuelChallenger(null)" style="color:rgba(80,65,40,.25)">不叫阵</div>' +
      genBtns + '</div>' +
      '<div class="bc-duel-hint" id="bcDuelHint">单挑胜者大幅提升己方士气，影响攻城走向。</div></div>';
  }

  // 城防信息面板
  const turnsToFull = Math.max(0, Math.ceil((1-(city.siegeDecay||0))*maxTurns));
  const cityInfoHtml =
    '<div style="margin:10px 0 6px;padding:10px 14px;background:rgba(245,240,228,.5);border-radius:6px;border:1px solid rgba(92,74,50,.18)">' +
    '<div style="font-size:10px;color:rgba(44,36,22,.7);font-weight:700;margin-bottom:6px">🏰 攻城情报</div>' +
    '<div style="height:6px;background:rgba(80,65,40,.12);border-radius:3px;overflow:hidden;margin-bottom:6px">' +
    '<div style="width:' + decayPct + '%;height:100%;background:' + (decayPct>70?'#1a8a45':decayPct>35?'#8a7030':'#e07040') + ';border-radius:3px"></div></div>' +
    '<div style="font-size:9px;color:rgba(44,36,22,.55);line-height:2">' +
    '围城进度 <b style="color:rgba(44,36,22,.80)">' + decayPct + '%</b>' +
    (decayPct<100 ? '（约' + turnsToFull + '旬可瓦解城防）' : '（城防已瓦解）') + '<br>' +
    '守方城防 <b style="color:' + defMultCol + '">×' + defMult.toFixed(2) + '</b>' +
    (decayPct<100 ? ' → 围满后降至 <b style="color:#1a8a45">×1.00</b>' : '') + '<br>' +
    '攻方胜利：城市易主，守军尝试突围<br>' +
    '攻方失败：围城解除，部队撤退' +
    '</div></div>';

  const existing = document.getElementById('bcDuelArea');
  if(existing) existing.remove();
  const duelEl = document.createElement('div');
  duelEl.id = 'bcDuelArea';
  duelEl.innerHTML = duelHtml + cityInfoHtml;
  document.getElementById('bcRetreatHint').before(duelEl);

  document.getElementById('bcRetreatHint').textContent = '撤围后需重新移动至城下方可再次围城';
  const retBtn = document.getElementById('bcBtnRetreat');
  retBtn.disabled = false; retBtn.style.opacity = '1'; retBtn.style.cursor = 'pointer';
  retBtn.textContent = '🚶 撤围退兵';
  retBtn.style.cssText = 'padding:8px 18px;font-size:11px;color:rgba(92,74,50,.7);background:rgba(80,65,40,.1);border:1px solid rgba(92,74,50,.3);border-radius:5px;cursor:pointer';
  retBtn.onclick = function(){ confirmSiegeBattle(false); };

  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){
    fightBtn.textContent = '⚔ 发动攻城（城防×' + defMult.toFixed(2) + '）';
    fightBtn.style.cssText = 'padding:10px 24px;font-size:13px;font-weight:700;color:#c03030;background:rgba(192,48,48,.12);border:2px solid rgba(192,48,48,.35);border-radius:6px;cursor:pointer;text-shadow:none;letter-spacing:1px';
    fightBtn.onclick = function(){ confirmSiegeBattle(true); };
  }

  // ── AI 守方叫阵检测（★ v86: 纯驻军无武将时跳过） ──
  if(defHasGenerals){
    const defCandidates = getDuelCandidates(defenders, false);
    const aiDefChallenger = aiDecideDuelChallenger(defenders, 'defender', attackers);
    if (aiDefChallenger && _currentBattleConfirm) {
      _currentBattleConfirm._aiPreDuel = { challengerName: aiDefChallenger, pending: true, aiIsDefender: true };
      const challGLocal = allGensLocal.find(x => x.name === aiDefChallenger) || { war: 60 };
      const atkCandidates = getDuelCandidates(attackers, false);
      const bestAtk = atkCandidates.length
        ? atkCandidates.map(c => ({ ...c, war: (allGensLocal.find(x => x.name === c.name) || { war: 60 }).war })).sort((a, b) => b.war - a.war)[0]
        : null;
      const myAcceptPct = bestAtk ? Math.round(Math.min(95, Math.max(15, bestAtk.war - 5))) : 50;
      // 在叫阵提示区显示守方叫阵横幅
      const existing2 = document.getElementById('bcDuelArea');
      if (existing2) {
        const banner = document.createElement('div');
        banner.style.cssText = 'margin-bottom:8px;padding:8px 12px;background:rgba(192,48,48,.08);border:1px solid rgba(192,48,48,.25);border-radius:5px;font-size:10px;color:rgba(44,36,22,.7);line-height:1.8';
        banner.innerHTML = '⚠ 守将 <b style="color:#c03030">' + aiDefChallenger + '</b>（武' + challGLocal.war + '）出城叫阵！' +
          (bestAtk ? '我方<b>' + bestAtk.name + '</b>（武' + bestAtk.war + '）迎战概率约 <b style="color:' + (myAcceptPct>=60?'#c03030':myAcceptPct>=40?'#8a7030':'#2a7a9a') + '">' + myAcceptPct + '%</b>' : '') +
          '<span style="color:rgba(92,74,50,.45);font-size:9px">（点击攻城后自动判定）</span>';
        existing2.prepend(banner);
      }
    }
  }

  _duelChallenger = null;
  setTimeout(()=>selectDuelChallenger(null), 0);
  document.getElementById('battleConfirmModal').style.display = 'flex';
}

// ★ v130fix: 玩家守城视角弹窗
function _showSiegeDefendConfirm(playerDefenders, enemyAttackers, city, nodeLabel){
  const defDEF = playerDefenders.reduce((s,u)=>s+calcUnitDEF(u),0);
  const atkATK = enemyAttackers.reduce((s,u)=>s+calcUnitATK(u, playerDefenders),0);
  const defTroops = playerDefenders.reduce((s,u)=>s+getUnitTroops(u),0);
  const atkTroops = enemyAttackers.reduce((s,u)=>s+getUnitTroops(u),0);
  const defMult = getSiegeDefMult(city);
  const size = city.size || 'medium';
  const sizeLabel = {small:'小城',medium:'中城',large:'大城'}[size]||size;
  const decayPct = Math.round((city.siegeDecay||0)*100);
  const defMulCol = defMult<=1.05?'#1a8a45':defMult<=1.15?'#8a7040':'#e07040';
  const garTroops = city.garrison||0;

  document.getElementById('bcLocation').textContent = '【' + nodeLabel + '】敌军攻城';

  // 左侧=守方(玩家)，右侧=攻方(敌方)
  document.getElementById('bcPlayerSide').style.borderColor = 'rgba(26,138,69,.3)';
  document.getElementById('bcPlayerSide').style.background = 'rgba(26,138,69,.04)';
  document.getElementById('bcPlayerContent').innerHTML =
    '<div style="font-size:9px;color:#1a8a45;margin-bottom:4px">🏰 守方（' + sizeLabel + '）</div>' +
    _battleSideHtml(playerDefenders, defTroops, false) +
    (garTroops>0 ? '<div style="font-size:9px;color:rgba(92,74,50,.45);margin-top:4px">+ 城防军 ' + garTroops + '人</div>' : '');
  document.getElementById('bcEnemySide').style.borderColor = 'rgba(192,48,48,.3)';
  document.getElementById('bcEnemySide').style.background = 'rgba(192,48,48,.04)';
  document.getElementById('bcEnemyContent').innerHTML =
    '<div style="font-size:9px;color:#c03030;margin-bottom:4px">⚔ 攻方（已围城' + (enemyAttackers[0]?._siegeTurnCount||0) + '旬）</div>' +
    _battleSideHtml(enemyAttackers, atkTroops, true, playerDefenders);

  // 城防信息
  document.getElementById('bcOdds').innerHTML =
    '我方城防加成 <b style="color:' + defMulCol + '">×' + defMult.toFixed(2) + '</b>' +
    '（围城进度' + decayPct + '%' +
    (decayPct>=100 ? '，城防已瓦解' : '') +
    '）<br>坚守城池可享受城防加成；出城迎战则为野战，双方无城防加成。';

  // 清除可能残留的叫阵区域
  const existing = document.getElementById('bcDuelArea');
  if(existing) existing.remove();

  document.getElementById('bcRetreatHint').textContent = '';

  // 按钮：坚守城池 / 出城迎战
  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){
    fightBtn.textContent = '🏰 坚守城池（城防×' + defMult.toFixed(2) + '）';
    fightBtn.style.cssText = 'padding:10px 24px;font-size:13px;font-weight:700;color:#1a8a45;background:rgba(26,138,69,.10);border:2px solid rgba(26,138,69,.35);border-radius:6px;cursor:pointer;letter-spacing:1px';
    fightBtn.onclick = function(){ confirmSiegeDefend('defend'); };
    fightBtn.onmouseover = function(){ this.style.background='rgba(26,138,69,.18)'; };
    fightBtn.onmouseout = function(){ this.style.background='rgba(26,138,69,.10)'; };
  }
  const retBtn = document.getElementById('bcBtnRetreat');
  if(retBtn){
    retBtn.textContent = '⚔ 出城迎战';
    retBtn.style.cssText = 'padding:10px 18px;font-size:11px;color:#c03030;background:rgba(192,48,48,.08);border:1px solid rgba(192,48,48,.25);border-radius:5px;cursor:pointer';
    retBtn.onclick = function(){ confirmSiegeDefend('sortie'); };
    retBtn.onmouseover = function(){ this.style.background='rgba(192,48,48,.15)'; };
    retBtn.onmouseout = function(){ this.style.background='rgba(192,48,48,.08)'; };
  }

  document.getElementById('battleConfirmModal').style.display = 'flex';
}

// ★ v130fix: 玩家守城确认
async function confirmSiegeDefend(choice){
  document.getElementById('battleConfirmModal').style.display = 'none';
  if(!_currentBattleConfirm) return;
  const { playerSide, enemySide, nodeLabel, siegeCity } = _currentBattleConfirm;
  _currentBattleConfirm = null;

  // 重置按钮样式（防残留）
  const retBtn = document.getElementById('bcBtnRetreat');
  if(retBtn){ retBtn.textContent = '🏃 撤退'; retBtn.onclick = function(){ confirmBattle(false); }; }
  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){ fightBtn.textContent = '⚔ 迎战'; fightBtn.onclick = function(){ confirmBattle(true); }; }
  // 重置侧边栏颜色
  document.getElementById('bcPlayerSide').style.borderColor = 'rgba(92,74,50,.3)';
  document.getElementById('bcPlayerSide').style.background = 'rgba(80,65,40,.04)';

  let siegeReport = null;
  let _defendAttackers = null, _defendDefenders = null;
  const _siegePosSnap = {};

  if(choice === 'defend'){
    // 坚守城池：攻方=enemySide，守方=playerSide，正确的攻守方向
    _defendAttackers = enemySide;
    _defendDefenders = playerSide;
    // ★ v175: 战前位置快照
    [...enemySide, ...playerSide].forEach(u => { _siegePosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) }; });
    siegeReport = resolveSiegeBattle(enemySide, playerSide, siegeCity, nodeLabel);
    if(!siegeReport){ renderAll(); return; }
    siegeReport.playerWasAttacker = false;
    _battleReports.push(siegeReport);
    log('🏰 【' + nodeLabel + '】敌军攻城：' + (enemySide[0]?.squads[0]?.genName||'?') + '部 攻城' + (siegeReport.atkWins?'得手！':'我军守住了！'), 'battle');
  } else {
    // 出城迎战：野战，双方无城防加成
    // ★ v133fix: 走_resolveBattleEngagement统一路径，确保战报字段完整（node/atkFac/defFac等）
    // 出城迎战时玩家是守方出城，但战斗按野战处理：playerSide为一方，enemySide为另一方
    // enemySide是围城方（攻方发起者），playerSide是守方出城
    // ★ v175: 战前位置快照（供出城野战/水战动画）
    const _sortiePosSnap = {};
    [...enemySide, ...playerSide].forEach(u => { _sortiePosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) }; });
    const _brLenBeforeSortie = _battleReports.length;
    _resolveBattleEngagement(enemySide, playerSide, nodeLabel, null);
    log('⚔ 【' + nodeLabel + '】我军出城迎战', 'battle');
    // ★ v175: 出城迎战的战斗动画（野战 collision / 水战 naval）
    if(_battleReports.length > _brLenBeforeSortie){
      const _latestReport = _battleReports[_battleReports.length - 1];
      try {
        if(_latestReport?.isNaval){
          await _playNavalBattleAnim(_latestReport, enemySide, playerSide, _sortiePosSnap);
        } else if(_latestReport?.type === 'battle'){
          await _playBattleCollisionAnim(enemySide, playerSide, _latestReport, _sortiePosSnap);
        }
        // type='retreat' 不播动画（v173 原设计）
      } catch(e){ console.error('[SortieAnim] trigger failed:', e); }
    }
    // ★ v133: 出城迎击胜利后，守方部队留在城内（不追击出城）
    const _cityDef = CITY_MAP[siegeCity.id];
    if(_cityDef){
      playerSide.forEach(u => {
        if(u.squads.some(sq => sq.troops > 0)){
          u.hq = _cityDef.q; u.hr = _cityDef.r;
          u.status = 'garrison';
          u.hexPath = []; u.movePath = [siegeCity.id];
        }
      });
    }
    // 出城迎战后，敌方围城状态清除（已经打过了）
    enemySide.forEach(u => {
      if(u.status === 'siege' && u.siegeTarget === siegeCity.id){
        u.status = 'halt';
        u.siegeTarget = null;
        u._siegeTurnCount = 0;
      }
    });
  }

  // 清除叫阵区域残留
  const duelArea = document.getElementById('bcDuelArea');
  if(duelArea) duelArea.remove();

  // ★ v175: 守城路径播攻城战动画
  if(siegeReport && _defendAttackers && _defendDefenders){
    try {
      await _playSiegeBattleAnim(siegeReport, _defendAttackers, _defendDefenders, _siegePosSnap, siegeCity);
    } catch(e){ console.error('[SiegeAnim] defend trigger failed:', e); }
  }

  if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
  else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
  renderAll();
}

async function confirmSiegeBattle(fight){
  document.getElementById('battleConfirmModal').style.display = 'none';
  if(!_currentBattleConfirm) return;
  const { playerSide, enemySide, nodeLabel, siegeCity, _aiPreDuel: siegeAiPreDuel } = _currentBattleConfirm;
  _currentBattleConfirm = null;

  // 重置按钮
  const retBtn = document.getElementById('bcBtnRetreat');
  if(retBtn){ retBtn.textContent = '🏃 撤退'; retBtn.onclick = function(){ confirmBattle(false); }; }
  const fightBtn = document.getElementById('bcBtnFight');
  if(fightBtn){ fightBtn.textContent = '⚔ 迎战'; fightBtn.onclick = function(){ confirmBattle(true); }; }

  let siegeReport = null;
  let _siegeAttackers = null, _siegeDefenders = null;
  const _siegePosSnap = {};

  if(fight){
    // ── AI 守方先叫阵处理 ──
    let activeDuel = null;
    if (siegeAiPreDuel) {
      const challG2 = GEN_MAP[siegeAiPreDuel.challengerName] || { war: 60 };
      const atkCands = getDuelCandidates(playerSide, false);
      const bestAtk2 = atkCands.length
        ? atkCands.map(c => ({ ...c, war: (GEN_MAP[c.name] || { war: 60 }).war })).sort((a, b) => b.war - a.war)[0]
        : null;
      if (bestAtk2) {
        const acceptPct2 = Math.min(0.95, Math.max(0.15, (bestAtk2.war - 5) / 100));
        if (Math.random() < acceptPct2) {
          // 守将叫阵，攻将应战：守将为 atk（挑战者），攻将为 def
          activeDuel = resolveDuel(siegeAiPreDuel.challengerName, bestAtk2.name, 'active');
          activeDuel.accepted = true;
          activeDuel.aiWasChallenger = true;
          applyDuelMorale(enemySide, playerSide, activeDuel); // 守方是挑战者
        } else {
          playerSide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
          enemySide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
          activeDuel = { accepted: false, challengerName: siegeAiPreDuel.challengerName, refuserName: bestAtk2.name, refuserWar: bestAtk2.war, aiWasChallenger: true };
        }
      }
    }
    // ── 玩家主动叫阵（若 AI 守方没先叫阵）──
    if (!activeDuel && _duelChallenger) {
      const enemyCandidates = getDuelCandidates(enemySide, false);
      const enemyGensSorted = enemyCandidates
        .map(cd=>({...cd, war:(GEN_MAP[cd.name]||{war:60}).war}))
        .sort((a,b)=>b.war-a.war);
      const bestEnemy = enemyGensSorted[0];
      if(bestEnemy){
        const acceptPct = Math.min(0.95, Math.max(0.15, (bestEnemy.war - 5) / 100));
        if(Math.random() < acceptPct){
          activeDuel = resolveDuel(_duelChallenger, bestEnemy.name, 'active');
          applyDuelMorale(playerSide, enemySide, activeDuel);
          activeDuel.accepted = true;
        } else {
          playerSide.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); }));
          enemySide.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.max(10,sq.morale-5); }));
          activeDuel = { accepted:false, challengerName:_duelChallenger, refuserName:bestEnemy.name, refuserWar:bestEnemy.war };
        }
      }
    }
    _duelChallenger = null;

    const city = siegeCity;
    // 守方包括城内garrison + 守方野战部队
    const allDefenders = enemySide;
    _siegeAttackers = playerSide;
    _siegeDefenders = allDefenders;
    // ★ v175: 战前位置快照
    [...playerSide, ...allDefenders].forEach(u => { _siegePosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) }; });

    siegeReport = resolveSiegeBattle(playerSide, allDefenders, city, nodeLabel);
    if(!siegeReport){ renderAll(); return; }
    siegeReport.activeDuel = activeDuel || null;
    siegeReport.playerWasAttacker = playerSide.some(u=>u.fac===G.playerFac);
    _battleReports.push(siegeReport);
    log('🏰 【' + nodeLabel + '】攻城战：' + (playerSide[0]?.squads[0]?.genName||'?') + '部 攻城' + (siegeReport.atkWins?'得手！':'失败'), 'battle');
  } else {
    // 撤围
    _duelChallenger = null;
    playerSide.forEach(u => {
      if(u.status === 'siege'){
        u.status = 'halt';
        u.siegeTarget = null;
        u._siegeTurnCount = 0;
      }
    });
    log('🚶 我方撤围，围城状态解除', 'battle');
  }

  // ★ v175: 播放攻城战动画（玩家主动攻城路径）
  if(siegeReport && _siegeAttackers && _siegeDefenders){
    try {
      await _playSiegeBattleAnim(siegeReport, _siegeAttackers, _siegeDefenders, _siegePosSnap, siegeCity);
    } catch(e){ console.error('[SiegeAnim] trigger failed:', e); }
  }

  renderAll();
  if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
  else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
}

function _showNextBattleConfirm(){
  if(!_pendingBattleConfirms.length) return;

  // ── 快进模式：静默消化所有待确认战斗，不弹窗 ──
  if(_fastForward){
    while(_pendingBattleConfirms.length){
      const conf = _pendingBattleConfirms.shift();
      _currentBattleConfirm = conf;
      autoResolvePendingBattle(conf);
      _currentBattleConfirm = null;
    }
    return;
  }

  // ★ v175: drain 的被动动画正在播时推迟弹战斗确认，避免弹窗挡在动画前面
  // 也避免玩家点"迎战"后 confirm 内的 await 动画被 _battleAnimating 锁提前跳过
  if(_battleAnimating){
    setTimeout(_showNextBattleConfirm, 200);
    return;
  }
  // ★ v175: drain 在等事件 modal 关闭的阶段，_battleAnimating=false 但队列非空 — 也要推迟
  if(_pendingBattleAnimations.length && !_fastForward){
    setTimeout(_showNextBattleConfirm, 200);
    return;
  }

  _currentBattleConfirm = _pendingBattleConfirms.shift();
  const { playerSide, enemySide, nodeLabel, campBattle, campRole } = _currentBattleConfirm;

  // ★ v138: 自动检测水战（守方/被攻方在水域）
  const _anyDefOnWater = enemySide.some(u => isUnitOnWater(u));
  _currentBattleConfirm._isNaval = _anyDefOnWater;

  // ── 营寨战专属弹窗（攻方玩家：强攻/劫营）──
  if(campBattle && campRole === 'attacker'){
    _showCampBattleConfirm(playerSide, enemySide, nodeLabel);
    return;
  }

  // ── 伏击战弹窗（玩家为伏击方）──
  if(_currentBattleConfirm.ambushBattle){
    _showAmbushConfirm(_currentBattleConfirm.playerSide, _currentBattleConfirm.enemySide,
      _currentBattleConfirm.nodeLabel, _currentBattleConfirm.ambushTerrain);
    return;
  }

  // ── 攻城战弹窗 ──
  if(_currentBattleConfirm.siegeBattle){
    const sc = _currentBattleConfirm.siegeCity;
    if(sc){
      if(_currentBattleConfirm.playerIsAttacker){
        _showSiegeBattleConfirm(playerSide, enemySide, sc, nodeLabel);
      } else {
        // ★ v130fix: 玩家是守方——显示守城视角弹窗
        _showSiegeDefendConfirm(playerSide, enemySide, sc, nodeLabel);
      }
    }
    return;
  }

  // ── ★ v134: 出城迎击弹窗标签 ──
  const _isNavalConfirm = _currentBattleConfirm._isNaval; // ★ v138
  if(_currentBattleConfirm.siegeInterdict){
    document.getElementById('bcLocation').textContent = '【' + nodeLabel + '】出城迎击';
  } else if(_isNavalConfirm){
    document.getElementById('bcLocation').textContent = '⚓【' + nodeLabel + '】水战';
  } else {
    // ★ v101: 普通野战——重置bcLocation标题（防止上一场伏击/营寨/攻城标题残留）
    document.getElementById('bcLocation').textContent = '【' + nodeLabel + '】遭遇战';
  }

  // ★ v101: 重置按钮样式（防止伏击弹窗紫色渐变残留）
  const _fightBtnReset = document.getElementById('bcBtnFight');
  if(_fightBtnReset){
    _fightBtnReset.style.cssText = 'padding:12px;background:rgba(192,48,48,.1);border:1px solid rgba(192,48,48,.35);color:#c03030;font-family:\"Noto Serif SC\",serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s';
    _fightBtnReset.textContent = '⚔ 迎战';
    _fightBtnReset.onclick = function(){ confirmBattle(true); };
    _fightBtnReset.onmouseover = function(){ this.style.background='rgba(192,48,48,.18)'; };
    _fightBtnReset.onmouseout = function(){ this.style.background='rgba(192,48,48,.1)'; };
  }
  const _retBtnReset = document.getElementById('bcBtnRetreat');
  if(_retBtnReset){
    _retBtnReset.style.cssText = 'padding:12px;background:rgba(26,95,138,.08);border:1px solid rgba(26,95,138,.3);color:#1a5f8a;font-family:\"Noto Serif SC\",serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s';
    _retBtnReset.textContent = '🏃 撤退';
    _retBtnReset.onclick = function(){ confirmBattle(false); };
    _retBtnReset.onmouseover = function(){ this.style.background='rgba(26,95,138,.16)'; };
    _retBtnReset.onmouseout = function(){ this.style.background='rgba(26,95,138,.08)'; };
  }

  const playerATK = playerSide.reduce((s,u)=>s+calcUnitATK(u, enemySide),0);
  const enemyATK  = enemySide.reduce((s,u)=>s+calcUnitATK(u, playerSide),0);
  const playerDEF = playerSide.reduce((s,u)=>s+calcUnitDEF(u),0);
  const enemyDEF  = enemySide.reduce((s,u)=>s+calcUnitDEF(u),0);
  const playerTroops = playerSide.reduce((s,u)=>s+getUnitTroops(u),0);
  const enemyTroops  = enemySide.reduce((s,u)=>s+getUnitTroops(u),0);

  _duelChallenger = null; // 重置叫阵选择

  // ── AI 先叫阵检测（攻守双方均可叫阵，取先出手者）──
  // enemySide 是 AI 方，playerSide 是玩家方
  // 先判定 AI 方叫阵概率（带相对勇武修正）
  let _aiPreDuel = null;
  {
    // AI 方（敌方）判定——不区分攻守，均可叫阵
    const aiChallengerName = aiDecideDuelChallenger(enemySide, 'attacker', playerSide);
    if (aiChallengerName) {
      _aiPreDuel = { challengerName: aiChallengerName, pending: true };
    }
  }

  document.getElementById('bcPlayerContent').innerHTML = _battleSideHtml(playerSide, playerTroops, false);
  document.getElementById('bcEnemyContent').innerHTML  = _battleSideHtml(enemySide, enemyTroops, true, playerSide);

  document.getElementById('bcOdds').innerHTML =
    `战场态势：${getStrengthLabel(playerATK, enemyDEF)}`;

  // 存储 AI 叫阵状态到当前确认对象，供 confirmBattle 使用
  if (_currentBattleConfirm) _currentBattleConfirm._aiPreDuel = _aiPreDuel;

  // ── 叫阵区域 ──
  const candidates = _isNavalConfirm ? [] : getDuelCandidates(playerSide); // ★ v138: 水战禁叫阵
  let duelHtml = '';

  // AI 先叫阵提示横幅
  let aiChallengeBanner = '';
  if (_aiPreDuel) {
    const challG = GEN_MAP[_aiPreDuel.challengerName] || { war: 60 };
    // 估算我方最强应战武将
    const bestPlayer = candidates.length
      ? [...candidates].map(c => ({ ...c, war: (GEN_MAP[c.name] || { war: 60 }).war })).sort((a, b) => b.war - a.war)[0]
      : null;
    const myAcceptPct = bestPlayer ? Math.round(Math.min(95, Math.max(15, bestPlayer.war - 5))) : 50;
    aiChallengeBanner = '<div style="margin-bottom:8px;padding:8px 12px;background:rgba(192,48,48,.08);border:1px solid rgba(192,48,48,.25);border-radius:5px;font-size:10px;color:rgba(44,36,22,.7);line-height:1.8">' +
      '⚠ <b style="color:#c03030">' + _aiPreDuel.challengerName + '</b>（武' + challG.war + '）出阵叫阵！ ' +
      (bestPlayer ? '我方<b>' + bestPlayer.name + '</b>（武' + bestPlayer.war + '）迎战概率约 <b style="color:' + (myAcceptPct>=60?'#c03030':myAcceptPct>=40?'#8a7030':'#2a7a9a') + '">' + myAcceptPct + '%</b>' : '') +
      ' <span style="color:rgba(92,74,50,.45);font-size:9px">（点击迎战后自动判定）</span>' +
      '</div>';
  }

  if(candidates.length > 0){
    const genBtns = candidates.map(c=>{
      const g = GEN_MAP[c.name]||{war:60};
      return `<div class="bc-duel-gen" id="duelBtn_${c.name}" onclick="selectDuelChallenger('${c.name}')">
        ${c.name} <span style="font-size:8px;color:rgba(92,74,50,.55)">武${g.war}</span>
      </div>`;
    }).join('');
    duelHtml = aiChallengeBanner + `<div class="bc-duel-section">
      <div class="bc-duel-title">⚔ 战前叫阵
        <span style="font-size:8px;color:rgba(92,74,50,.35);font-weight:400">（可选）选择出阵武将，对方视勇武决定是否接受</span>
      </div>
      <div class="bc-duel-gen-list" id="bcDuelGenList">
        <div class="bc-duel-gen" id="duelBtn_none" onclick="selectDuelChallenger(null)" style="color:rgba(80,65,40,.25)">不叫阵</div>
        ${genBtns}
      </div>
      <div class="bc-duel-hint" id="bcDuelHint">单挑胜者大幅提升己方士气，影响战斗走向。运气各占50%，武力差决定另50%。</div>
    </div>`;
  }

  // 把叫阵区域注入按钮上方
  const existing = document.getElementById('bcDuelArea');
  if(existing) existing.remove();
  const duelEl = document.createElement('div');
  duelEl.id = 'bcDuelArea';
  duelEl.innerHTML = duelHtml;
  document.getElementById('bcRetreatHint').before(duelEl);

  // ★ v138: 水战火攻勾选区
  const existingNavalFire = document.getElementById('bcNavalFireArea');
  if(existingNavalFire) existingNavalFire.remove();
  if(_isNavalConfirm){
    const _nfFac = G.factions[G.playerFac];
    const _nfGoldOk = (_nfFac?.res?.gold||0) >= FIRE_COST.gold;
    const _nfWoodOk = (_nfFac?.res?.wood||0) >= FIRE_COST.wood;
    const _nfCanFire = _nfGoldOk && _nfWoodOk;
    const _nfRate = Math.round(calcFireRate(playerSide, enemySide)*100);
    const nfEl = document.createElement('div');
    nfEl.id = 'bcNavalFireArea';
    nfEl.innerHTML = '<div style="margin:8px 0;padding:8px 12px;background:rgba(232,80,32,.06);border:1px solid rgba(232,80,32,.2);border-radius:5px;font-size:10px;color:rgba(44,36,22,.7);line-height:1.8">' +
      '<label style="cursor:'+(_nfCanFire?'pointer':'not-allowed')+';display:flex;align-items:center;gap:6px">' +
      '<input type="checkbox" id="bcNavalFireCheck" '+(_nfCanFire?'':'disabled')+' style="width:14px;height:14px;accent-color:#e85020;cursor:'+(_nfCanFire?'pointer':'not-allowed')+'">' +
      '🔥 <b>火攻焚船</b> — 成功率 <b style="color:#8a7030">'+_nfRate+'%</b>' +
      '&emsp;消耗 💰'+FIRE_COST.gold+' 🪵'+FIRE_COST.wood +
      (!_nfCanFire ? ' <span style="color:#c03030">（资源不足）</span>' : '') +
      '</label></div>';
    document.getElementById('bcRetreatHint').before(nfEl);
  }

  const retResult = calcRetreatResult(playerSide, enemySide);
  const canRet = retResult.canRetreat;
  // 存储结果供按钮点击时使用
  G._pendingRetreatResult = retResult;
  const wr = fuzzyEstimateWinRate(playerSide, enemySide, G.playerFac);
  // 文言文模糊表述胜率
  const wrDesc = wr >= 0.7 ? '我军占尽优势，胜券在握'
    : wr >= 0.55 ? '我军略占上风，可战'
    : wr >= 0.45 ? '势均力敌，胜负难料'
    : wr >= 0.35 ? '敌强我弱，苦战方有一线生机'
    : wr >= 0.2  ? '敌众我寡，形势危急'
    : '以卵击石，断难取胜';
  const retBtn = document.getElementById('bcBtnRetreat');
  // 胜率>=35%时不显示撤退（canRetreat内部已判断，但UI也需处理）
  const showRetreat = wr < 0.35;
  retBtn.disabled = !showRetreat;
  retBtn.style.opacity = showRetreat?'1':'0.35';
  retBtn.style.cursor = showRetreat?'pointer':'not-allowed';
  // 撤退提示：根据retreatResult显示风险
  let retHint;
  if(!showRetreat){
    retHint = `${wrDesc}——尚可一战`;
  } else if(retResult.retreatResult === 'full'){
    retHint = `${wrDesc}——全师而退，敌军追之不及`;
  } else if(retResult.retreatResult === 'partial'){
    retHint = `${wrDesc}——可退，但恐遭追击损失`;
  } else {
    retHint = `${wrDesc}——退路已断，唯有死战`;
  }
  document.getElementById('bcRetreatHint').textContent = retHint;

  // 自动叫阵模式：根据 G.autoDuelMode 决定默认选谁
  if(G.autoDuelMode === 'best' && candidates.length > 0){
    const best = [...candidates].sort((a,b)=>{
      const wa = (allGensFlat.find(x=>x.name===a.name)||{war:0}).war;
      const wb = (allGensFlat.find(x=>x.name===b.name)||{war:0}).war;
      return wb - wa;
    })[0];
    setTimeout(()=>selectDuelChallenger(best?.name||null), 0);
  } else {
    // 默认不叫阵
    setTimeout(()=>selectDuelChallenger(null), 0);
  }

  document.getElementById('battleConfirmModal').style.display='flex';
}

function selectDuelChallenger(name){
  _duelChallenger = name;
  document.querySelectorAll('.bc-duel-gen').forEach(el=>{
    el.classList.toggle('sel',
      (name===null && el.id==='duelBtn_none') ||
      (name && el.id===`duelBtn_${name}`)
    );
  });
  const hint = document.getElementById('bcDuelHint');
  if(!hint) return;
  if(!name){
    hint.textContent='单挑胜者大幅提升己方士气，影响战斗走向。运气各占50%，武力差决定另50%。';
    hint.style.color='rgba(92,74,50,.40)';
  } else {
    const g = GEN_MAP[name]||{war:60};
    // 估算叫阵接受率：敌方最高 war 武将 vs 我方挑战者
    const { enemySide } = _currentBattleConfirm;
    const enemyCandidates = getDuelCandidates(enemySide, false);
    const bestEnemy = enemyCandidates.sort((a,b)=>{
      const ga=GEN_MAP[a.name]||{war:60};
      const gb=GEN_MAP[b.name]||{war:60};
      return gb.war-ga.war;
    })[0];
    const enemyWar = bestEnemy ? (GEN_MAP[bestEnemy.name]||{war:60}).war : 60;
    // 勇武越高越倾向接受：war≥85 → 必接；war<60 → 多半拒绝
    const acceptPct = Math.round(Math.min(95, Math.max(20, enemyWar - 5)));
    hint.innerHTML=`<b style="color:var(--ink)">${name}</b>（武${g.war}）出阵叫阵。
      敌方${bestEnemy?`<b>${bestEnemy.name}</b>（武${enemyWar}）`:'武将'}接受概率约 <b style="color:${acceptPct>=70?'#c03030':acceptPct>=50?'#8a7030':'#2a7a9a'}">${acceptPct}%</b>`;
    hint.style.color='rgba(44,36,22,.60)';
  }
}

async function confirmBattle(fight){
  document.getElementById('battleConfirmModal').style.display='none';
  if(!_currentBattleConfirm) return;
  const { playerSide, enemySide, nodeLabel, _aiPreDuel: aiPreDuel, playerIsAttacker: pIsAtk } = _currentBattleConfirm;
  _currentBattleConfirm = null;

  if(fight){
    // ── AI 先叫阵处理（在玩家自己叫阵之前）──
    let activeDuel = null;
    if (aiPreDuel) {
      const challG = GEN_MAP[aiPreDuel.challengerName] || { war: 60 };
      // 我方找 war 最高的非谋士武将应战
      const playerCandidates = getDuelCandidates(playerSide, false);
      const bestPlayer = playerCandidates.length
        ? playerCandidates.map(c => ({ ...c, war: (GEN_MAP[c.name] || { war: 60 }).war })).sort((a, b) => b.war - a.war)[0]
        : null;
      if (bestPlayer) {
        const acceptPct = Math.min(0.95, Math.max(0.15, (bestPlayer.war - 5) / 100));
        if (Math.random() < acceptPct) {
          // 玩家方接受：AI为挑战者(atk)，玩家为被挑战者(def)
          activeDuel = resolveDuel(aiPreDuel.challengerName, bestPlayer.name, 'active');
          activeDuel.accepted = true;
          activeDuel.aiWasChallenger = true;
          // AI 是 atk → atkMoraleDelta 给 enemySide，defMoraleDelta 给 playerSide
          applyDuelMorale(enemySide, playerSide, activeDuel);
        } else {
          // 玩家方拒绝：AI方士气微升，玩家方微降
          enemySide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
          playerSide.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
          activeDuel = {
            accepted: false,
            challengerName: aiPreDuel.challengerName,
            refuserName: bestPlayer.name,
            refuserWar: bestPlayer.war,
            aiWasChallenger: true,
          };
        }
      }
    }

    // ── 玩家主动叫阵（若玩家也选了叫阵，且 AI 没先叫阵或叫阵被拒）──
    if (!activeDuel && _duelChallenger) {
      // 敌方选出最有可能应战的武将（war最高的非谋士）
      const enemyCandidates = getDuelCandidates(enemySide, false);
      const enemyGensSorted = enemyCandidates
        .map(c=>({...c, war:(GEN_MAP[c.name]||{war:60}).war}))
        .sort((a,b)=>b.war-a.war);
      const bestEnemy = enemyGensSorted[0];

      if(bestEnemy){
        // 接受判定：war越高越倾向接受（≥85必接，<50必拒）
        const acceptPct = Math.min(0.95, Math.max(0.15, (bestEnemy.war - 5) / 100));
        if(Math.random() < acceptPct){
          // 接受！进行单挑（我方=攻，敌=守，为了 narrative 方向正确）
          activeDuel = resolveDuel(_duelChallenger, bestEnemy.name, 'active');
          // 结果立刻作用到双方士气（在战斗结算之前）
          applyDuelMorale(playerSide, enemySide, activeDuel);
          activeDuel.accepted = true;
        } else {
          // 拒绝叫阵：敌方士气微降（怯战之名），我方微升
          playerSide.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); }));
          enemySide.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.max(10,sq.morale-5); }));
          activeDuel = {
            accepted:false,
            challengerName:_duelChallenger,
            refuserName:bestEnemy.name,
            refuserWar:bestEnemy.war,
          };
        }
      }
    }
    _duelChallenger = null;
    // ★ v138: 读取水战火攻勾选
    const _navalFireChecked = !!(document.getElementById('bcNavalFireCheck')?.checked);
    // ★ 用真实攻守关系调用（playerIsAttacker记录谁是真正攻方）
    const trueAtk = (pIsAtk !== false) ? playerSide : enemySide;
    const trueDef = (pIsAtk !== false) ? enemySide : playerSide;
    // ★ v173: 战前位置快照（防止 doRetreat 在结算中改动 unit.hq/hr 导致动画位置错位）
    const _battlePosSnap = {};
    [...trueAtk, ...trueDef].forEach(u => {
      _battlePosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) };
    });
    // ★ v173: 叫阵前奏动画（仅在普通野战路径的 confirmBattle 中触发；伏击/营寨/攻城/水战各有自己的 confirm 函数）
    // 触发条件：activeDuel 存在且 accepted === true
    if(activeDuel && activeDuel.accepted === true){
      try {
        // 找到挑战方和应战方所在的 unit 位置
        const findUnitByGen = (genName) => {
          for(const u of G.units){
            for(const sq of u.squads){
              if(sq.genName === genName) return u;
            }
          }
          return null;
        };
        const atkUnit = findUnitByGen(activeDuel.atkName);
        const defUnit = findUnitByGen(activeDuel.defName);
        if(atkUnit && defUnit){
          const snapA = _battlePosSnap[atkUnit.id] || {hq: atkUnit.hq, hr: atkUnit.hr, troops: getUnitTroops(atkUnit)}; // §5.10 fix: 默认 fallback 也补 troops snap
          const snapD = _battlePosSnap[defUnit.id] || {hq: defUnit.hq, hr: defUnit.hr, troops: getUnitTroops(defUnit)};
          const atkPos = _baGetUnitRenderPos(atkUnit, G.units, snapA);
          const defPos = _baGetUnitRenderPos(defUnit, G.units, snapD);
          await _playDuelPreludeAnim(activeDuel, atkPos, defPos);
        }
      } catch(e){ console.error('[DuelPrelude] trigger failed:', e); }
    }
    // ★ v173: 记录 push 前的战报数，用于找出本次新增的战报
    const _brLenBefore = _battleReports.length;
    _resolveBattleEngagement(trueAtk, trueDef, nodeLabel, activeDuel, _navalFireChecked);
    // ★ v173: 播放战斗碰撞动画（仅野战、玩家方参与、非迷雾外等条件已在函数内判断）
    // ★ v175: 水战分叉 — report.isNaval 走 _playNavalBattleAnim，否则走 _playBattleCollisionAnim
    if(_battleReports.length > _brLenBefore){
      const _latestReport = _battleReports[_battleReports.length - 1];
      if(_latestReport?.isNaval){
        await _playNavalBattleAnim(_latestReport, trueAtk, trueDef, _battlePosSnap);
      } else {
        await _playBattleCollisionAnim(trueAtk, trueDef, _latestReport, _battlePosSnap);
      }
    }
    // 出城迎击结算后：如围城方败退，自动清除其siege状态
    if(_currentBattleConfirm === null){ // already cleared
      playerSide.concat(enemySide).forEach(u => {
        if(u.status === 'siege' && u.squads.every(sq => sq.troops <= 0)){
          u.siegeTarget = null; u._siegeTurnCount = 0;
        }
      });
    }
  } else {
    _duelChallenger = null;
    const rr = G._pendingRetreatResult?.retreatResult || 'partial';
    // ★ v133: 标记围城方（doRetreat会清除siege状态，需要提前记录）
    playerSide.forEach(u => {
      if(u.status === 'siege'){
        u._wasSiegeBeforeRetreat = true;
        u._lastSiegeTarget = u.siegeTarget;
      }
    });
    doRetreat(playerSide, enemySide, rr);
    // ★ v133: 围城方撤退后，确保脱离城市范围（防止无限围→撤退→再围exploit）
    playerSide.forEach(u => {
      if(u._wasSiegeBeforeRetreat){
        delete u._wasSiegeBeforeRetreat;
        // 找最近的被围城市，确保距离>=4
        const siegeCity = u._lastSiegeTarget ? G.cities[u._lastSiegeTarget] : null;
        const cityDef = siegeCity ? CITY_MAP[u._lastSiegeTarget] : null;
        delete u._lastSiegeTarget;
        if(cityDef){
          let pushAttempts = 0;
          while(pushAttempts < 6 && hexDist(u.hq, u.hr, cityDef.q, cityDef.r) < 4){
            const nbs = hexNeighbors(u.hq, u.hr);
            const best = nbs
              .filter(nb => {
                const t = HEX_TERRAIN[hkey(nb.col, nb.row)];
                if(!t || t==='impassable' || t==='water' || t==='deep_water' || t==='coastal_water') return false;
                if(G.units.some(ou => ou.id!==u.id && ou.hq===nb.col && ou.hr===nb.row)) return false;
                return true;
              })
              .sort((a,b) => hexDist(b.col,b.row,cityDef.q,cityDef.r) - hexDist(a.col,a.row,cityDef.q,cityDef.r))[0];
            if(best){ u.hq = best.col; u.hr = best.row; } else break;
            pushAttempts++;
          }
        }
      }
    });
    // ★ v133: AI守方出城迎击后回城
    enemySide.forEach(u => {
      const nodeId = getUnitNodeId(u);
      // 如果敌方单位属于某个城市（出城迎击者），战后回城
      if(!nodeId){
        // 找最近己方城市回去
        let bestCity = null, bestDist = 9e9;
        Object.values(G.cities).filter(c => c.fac === u.fac).forEach(c => {
          const cd = CITY_MAP[c.id];
          if(!cd) return;
          const d = hexDist(u.hq, u.hr, cd.q, cd.r);
          if(d < bestDist){ bestDist = d; bestCity = c; }
        });
        if(bestCity && bestDist <= 3){
          const cd = CITY_MAP[bestCity.id];
          u.hq = cd.q; u.hr = cd.r;
          u.status = 'garrison';
          u.hexPath = []; u.movePath = [bestCity.id];
        }
      }
    });
    if(rr !== 'failed'){
      const lossNote = rr === 'partial' ? '（遭追击）' : '';
      log(`🏃 我方${playerSide.map(u=>u.squads[0]?.genName+'部').join('、')}撤退${lossNote}`, 'battle');
    } else {
      // failed → 强制交战（不应到达此处，UI已禁用按钮）
      log(`⚠ 撤退失败，被迫迎战`, 'battle');
    }
  }
  renderAll();
  if(_pendingBattleConfirms.length && !_fastForward) setTimeout(_showNextBattleConfirm, 400);
  else if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
}

// 军事链 MIL7.d (_resolveBattleEngagement,L18420-L18629) 已抽离到 src/chains/military.js

// 军事链 MIL7.e (processReinforcement,L18631-L18782) 已抽离到 src/chains/military.js

// 显示战报弹窗（队列逐个弹）
function showNextBattleReport(){
  if(!_battleReports.length) return;
  // 快进模式：发放经验后清空战报，不弹窗
  if(_fastForward){
    _battleReports.forEach(r => applyBattleExp(r));
    _battleReports=[];
    return;
  }
  // ★ v175: 动画正在播放时推迟弹战报（给被动战斗的 fire-and-forget 动画留出时间）
  if(_battleAnimating){
    setTimeout(showNextBattleReport, 200);
    return;
  }
  // ★ v175: drain 队列非空（在等事件 modal 或事件正播放）→ 推迟战报
  if(_pendingBattleAnimations.length && !_fastForward){
    setTimeout(showNextBattleReport, 200);
    return;
  }
  const r = _battleReports.shift();
  _currentBattleReport = r;  // D2：供closeBattleModal发放经验
  const modal = document.getElementById('battleModal');
  const facName = f=>({wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'}[f]||f);
  const facCol  = f=>({wei:'var(--wei)',shu:'var(--shu)',wu:'var(--wu)',nanman:'var(--nanman)'}[f]||'var(--ink-l)');

  document.getElementById('brTitle').textContent = r.ambushAbortDetected
    ? `⚔ 野战（伏兵撤退被发现）· ${r.node}`
    : r.isNaval ? `⚓ 水战 · ${r.node}` : `⚔ 野战 · ${r.node}`;

  // ── 单挑 HTML 生成 ──
  function duelBlockHtml(duel, isActive){
    if(!duel) return '';
    const isAiChallenger = duel.aiWasChallenger;
    const title = isActive
      ? (isAiChallenger ? '⚔ 敌方叫阵' : '⚔ 战前叫阵')
      : '⚔ 阵中单挑';

    // 拒绝叫阵
    if(isActive && duel.accepted===false){
      const challengerLabel = duel.aiWasChallenger ? '敌将' : '';
      const refuserLabel = duel.aiWasChallenger ? '我方' : '敌方';
      return `<div class="br-duel">
        <div class="br-duel-title">${title}</div>
        <div class="br-duel-narrative">
          ${challengerLabel}<b>${duel.challengerName}</b>纵马出阵，高声叫骂，
          ${refuserLabel}<b>${duel.refuserName}</b>（武${duel.refuserWar}）惧其武勇，按兵不动，
          ${duel.aiWasChallenger ? '我军士气因怯战小挫，敌方气势大涨。' : '敌军士气因怯战小挫。'}
        </div>
      </div>`;
    }

    const atkG = GEN_MAP[duel.atkName]||{war:60};
    const defG = GEN_MAP[duel.defName]||{war:60};
    // §8.4 W6-pending-3: origFac lookup → getGenOrigFac (helper 跨 m.GENS_FULL ∪ m.pendingGenPool)
    const atkFac = getGenOrigFac(duel.atkName);
    const defFac = getGenOrigFac(duel.defName);

    const outcomeLabel = {atkWin:'胜',defWin:'负',draw:'平'}[duel.outcome]||'平';
    const atkOutcome   = duel.outcome==='atkWin'?'win':duel.outcome==='defWin'?'lose':'draw';
    const defOutcome   = duel.outcome==='defWin'?'win':duel.outcome==='atkWin'?'lose':'draw';

    const moraleStr = d=>{
      if(d>0) return `<span style="color:#1a7a3a">士气+${d}</span>`;
      if(d<0) return `<span style="color:#c03030">士气${d}</span>`;
      return `<span style="color:rgba(92,74,50,.55)">士气±0</span>`;
    };

    // 亲密度变化提示
    const intimacyAfter = getIntimacy(duel.atkName, duel.defName);
    const ca2 = COMPAT[duel.atkName]??50, cb2 = COMPAT[duel.defName]??50;
    const compatDiff2 = Math.abs(ca2-cb2);
    let intimacyHint = '';
    if(compatDiff2 <= 40){
      intimacyHint = `<span style="color:#1a7a3a;font-size:9px">💛 惺惺相惜 亲密度+2 → ${intimacyAfter}</span>`;
    } else {
      const loserName = duel.outcome==='atkWin'?duel.defName:(duel.outcome==='defWin'?duel.atkName:null);
      const penalty = duel.outcome==='draw'?-2:-4;
      intimacyHint = `<span style="color:#e07040;font-size:9px">⚔ 立场相悖 亲密度${penalty} → ${intimacyAfter}${loserName?' ('+loserName+'额外-2)':''}</span>`;
    }

    return `<div class="br-duel">
      <div class="br-duel-title">${title}${isActive?'':' <span style="font-size:8px;color:rgba(92,74,50,.35)">(战中自发)</span>'}</div>
      <div class="br-duel-row">
        <span class="br-duel-name" style="color:${facCol(atkFac)}">${duel.atkName}</span>
        <span class="br-duel-war">武${atkG.war}</span>
        <span class="br-duel-result ${atkOutcome}">${atkOutcome==='win'?'胜':atkOutcome==='lose'?'败':'平'}</span>
        <span class="br-duel-vs">VS</span>
        <span class="br-duel-result ${defOutcome}">${defOutcome==='win'?'胜':defOutcome==='lose'?'败':'平'}</span>
        <span class="br-duel-war">武${defG.war}</span>
        <span class="br-duel-name" style="color:${facCol(defFac)};text-align:right">${duel.defName}</span>
        <span class="br-duel-morale">${moraleStr(duel.atkMoraleDelta)} / ${moraleStr(duel.defMoraleDelta)}</span>
      </div>
      <div class="br-duel-narrative">${duel.narrative}</div>
      ${duel.duelSkills && duel.duelSkills.length ? '<div style="margin-top:4px;font-size:9px;color:#7a50a0">' + duel.duelSkills.map(s => '⚔ ' + s.gen + '「' + s.name + '」战力' + s.val).join('　') + '</div>' : ''}
      <div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(80,65,40,.08)">${intimacyHint}</div>
    </div>`;
  }

  if(r.type==='ambush'){
    const facCol2 = f => facCol(f);
    const ambushFacName = facName(r.ambushFac);
    const victimFacName = facName(r.victimFac);
    const winFac    = r.ambushWins ? r.ambushFac  : r.victimFac;
    const loseFac   = r.ambushWins ? r.victimFac  : r.ambushFac;
    const winNames  = r.ambushWins ? r.ambushNames : r.victimNames;
    const loseNames = r.ambushWins ? r.victimNames : r.ambushNames;
    const winLost   = r.ambushWins ? r.ambushLost  : r.victimLost;
    const loseLost  = r.ambushWins ? r.victimLost  : r.ambushLost;

    document.getElementById('brTitle').textContent = `🎯 伏击战 · ${r.node}`;
    const resEl = document.getElementById('brResult');
    resEl.className = 'br-result ' + (winFac===G.playerFac?'win':'lose');
    resEl.textContent = `${facName(winFac)}方胜`;

    // 火攻信息行
    const fireRowAmb = r.fireResult
      ? (r.fireResult.success
          ? `<div class="br-result-row"><span>🔥 火攻</span><b style="color:#e85020">✅ 火势大起！士气-${r.fireResult.moralePct}% 战力-${r.fireResult.cpPct}%（综合倍率×${r.fireResult.combined}）</b></div>`
          : `<div class="br-result-row"><span>🔥 火攻</span><b style="color:rgba(200,140,80,.6)">❌ 火攻未能奏效（成功率${r.fireResult.rate}%，资源已耗）</b></div>`)
      : '';
    const intRow = r.ambushHit
      ? `<div class="br-result-row"><span>伏击地形</span><b style="color:rgba(92,74,50,.7)">${({mountain:"山地",forest:"林地",hill:"丘陵",plain:"平原",road:"平原",water:"水路"})[r.terrainType]||r.terrainType} · 基础中伏率${r.ambushChancePct}%</b></div>
         <div class="br-result-row"><span>中伏判定</span><b style="color:#c03030">✅ 奇袭得手（智力差${r.ambushInt}-${r.victimInt}=${r.ambushInt-r.victimInt}）</b></div>
         <div class="br-result-row"><span>中伏惩罚</span><b style="color:#c03030">受伏方士气-${r.moralePenalty}，战力×${r.cpMult}（统帅${r.victimCom}缓解）</b></div>
         ${fireRowAmb}`
      : `<div class="br-result-row"><span>伏击地形</span><b style="color:rgba(92,74,50,.7)">${({mountain:"山地",forest:"林地",hill:"丘陵",plain:"平原",road:"平原",water:"水路"})[r.terrainType]||r.terrainType} · 基础中伏率${r.ambushChancePct}%</b></div>
         <div class="br-result-row"><span>中伏判定</span><b style="color:#1a7a3a">❌ 伏兵泄露（智力差${r.ambushInt}-${r.victimInt}=${r.ambushInt-r.victimInt}）</b></div>
         ${fireRowAmb}`

    document.getElementById('brBody').innerHTML =
      duelBlockHtml(r.passiveDuel, false)+
      `<div class="br-sides">
        <div class="br-side">
          <div class="br-side-name" style="color:${facCol2(r.ambushFac)}">伏击方 · ${ambushFacName}</div>
          <div class="br-side-val">将领：<b>${r.ambushNames}</b><br>智力：<b>${r.ambushInt}</b></div>
        </div>
        <div class="br-vs">🎯</div>
        <div class="br-side">
          <div class="br-side-name" style="color:${facCol2(r.victimFac)}">受伏方 · ${victimFacName}</div>
          <div class="br-side-val">将领：<b>${r.victimNames}</b><br>智力：<b>${r.victimInt}</b></div>
        </div>
      </div>
      <div class="br-result-bar">
        ${intRow}
        <div class="br-result-row"><span>胜方</span><b style="color:${facCol2(winFac)}">${winNames}</b></div>
        <div class="br-result-row"><span>胜方损失</span><b class="loss">-${fmt(winLost)}兵</b></div>
        <div class="br-result-row"><span>败方损失</span><b class="loss">-${fmt(loseLost)}兵</b></div>
        <div class="br-result-row"><span>兵力对比</span><b>${fmt(r.ambushTroops)} : ${fmt(r.victimTroops)}</b></div>
        <div class="br-result-row"><span style="color:rgba(92,74,50,.55);font-size:9px">※ 伏击战：无叫阵 · 无撤退</span></div>
      </div>
      <div class="br-narrative">
        ${r.ambushHit
          ? `<span style="color:${facCol2(r.ambushFac)}">${r.ambushNames}</span>于险地布下埋伏，
             <span style="color:${facCol2(r.victimFac)}">${r.victimNames}</span>轻进中伏，部众大乱（士气-${r.moralePenalty}）。
             ${r.ambushWins
               ? `伏击方一举奠定胜局，歼敌${fmt(loseLost)}人，自损${fmt(winLost)}人。`
               : `然受伏方主将（统${r.victimCom}）从容调度，力挽颓势，反败为胜，歼敌${fmt(loseLost)}人。`}`
          : `<span style="color:${facCol2(r.victimFac)}">${r.victimNames}</span>将帅机警，识破
             <span style="color:${facCol2(r.ambushFac)}">${r.ambushNames}</span>伏兵，奇袭失效。
             ${r.ambushWins ? '然伏击方战力仍占优，战而胜之。' : '反遭痛击，铩羽而归。'}`}
      </div>`;
  } else if(r.type==='camp'){
    const isCampRaid = r.mode === 'raid';
    const modeLabel = isCampRaid ? '劫营夜袭' : '强攻营寨';
    document.getElementById('brTitle').textContent = '🏕 营寨战（' + modeLabel + '）· ' + r.node;

    const resEl = document.getElementById('brResult');
    if(isCampRaid && !r.raidSuccess){
      resEl.className = 'br-result lose';
      resEl.textContent = '劫营失败';
    } else {
      const winFac2 = r.atkWins ? r.atkFac : r.defFac;
      resEl.className = 'br-result ' + (winFac2===G.playerFac?'win':'lose');
      resEl.textContent = facName(winFac2) + '方胜';
    }

    const fireRowRaidFail = r.fireResult
      ? (r.fireResult.success
          ? '<div class="br-result-row"><span>🔥 火攻</span><b style="color:#e85020">✅ 火势大起！士气-' + r.fireResult.moralePct + '% 战力-' + r.fireResult.cpPct + '%（综合×' + r.fireResult.combined + '）</b></div>'
          : '<div class="br-result-row"><span>🔥 火攻</span><b style="color:rgba(200,140,80,.6)">❌ 火攻未能奏效（成功率' + r.fireResult.rate + '%，资源已耗）</b></div>')
      : '';
    let campBody = '';
    if(isCampRaid && !r.raidSuccess){
      campBody =
        '<div class="br-sides">' +
        '<div class="br-side"><div class="br-side-name" style="color:' + facCol(r.atkFac) + '">进攻方 · ' + facName(r.atkFac) + '</div>' +
        '<div class="br-side-val">将领：<b>' + r.atkNames + '</b></div></div>' +
        '<div class="br-vs">🏕</div>' +
        '<div class="br-side"><div class="br-side-name" style="color:' + facCol(r.defFac) + '">守方营寨 · ' + facName(r.defFac) + '</div>' +
        '<div class="br-side-val">将领：<b>' + r.defNames + '</b></div></div>' +
        '</div>' +
        '<div class="br-result-bar">' +
        '<div class="br-result-row"><span>劫营方式</span><b style="color:#c03030">劫营夜袭</b></div>' +
        '<div class="br-result-row"><span>成功率</span><b style="color:rgba(92,74,50,.7)">' + r.raidChancePct + '%</b></div>' +
        '<div class="br-result-row"><span>结果</span><b style="color:#c03030">❌ 事泄告败</b></div>' +
        fireRowRaidFail +
        '<div class="br-result-row"><span>攻方惩罚</span><b style="color:#c03030">士气-20，强制撤退</b></div>' +
        '<div class="br-result-row"><span style="color:rgba(92,74,50,.55);font-size:9px">※ 劫营失败：无战斗结算，营寨保留</span></div>' +
        '</div>' +
        '<div class="br-narrative">' +
        '<span style="color:' + facCol(r.atkFac) + '">' + r.atkNames + '</span>趁夜劫营，' +
        '然守方<span style="color:' + facCol(r.defFac) + '">' + r.defNames + '</span>警觉，伏兵泄露，' +
        '攻方士卒（士气-20）狼狈而退，营垒安然无恙。' +
        '</div>';
    } else {
      const winFac3 = r.atkWins ? r.atkFac : r.defFac;
      const winNames3 = r.atkWins ? r.atkNames : r.defNames;
      const winLost3 = r.atkWins ? r.atkLost : r.defLost;
      const loseLost3 = r.atkWins ? r.defLost : r.atkLost;
      const fireRowCamp = r.fireResult
        ? (r.fireResult.success
            ? '<div class="br-result-row"><span>🔥 火攻</span><b style="color:#e85020">✅ 火势大起！士气-' + r.fireResult.moralePct + '% 战力-' + r.fireResult.cpPct + '%（综合×' + r.fireResult.combined + '）</b></div>'
            : '<div class="br-result-row"><span>🔥 火攻</span><b style="color:rgba(200,140,80,.6)">❌ 火攻未能奏效（成功率' + r.fireResult.rate + '%，资源已耗）</b></div>')
        : '';
      const campTag = isCampRaid
        ? '<div class="br-result-row"><span>劫营判定</span><b style="color:#1a7a3a">✅ 奇袭得手（成功率' + r.raidChancePct + '%）</b></div>' +
          '<div class="br-result-row"><span>守方惩罚</span><b style="color:#c03030">士气-30，战力加成失效</b></div>' +
          '<div class="br-result-row"><span>攻方先手</span><b style="color:#1a7a3a">×1.10 加成</b></div>' +
          fireRowCamp
        : '<div class="br-result-row"><span>强攻加成</span><b style="color:#1a8a45">守方营寨防御+10%战力</b></div>' +
          fireRowCamp;
      campBody =
        duelBlockHtml(r.passiveDuel, false) +
        '<div class="br-sides">' +
        '<div class="br-side"><div class="br-side-name" style="color:' + facCol(r.atkFac) + '">进攻方 · ' + facName(r.atkFac) + '</div>' +
        '<div class="br-side-val">将领：<b>' + r.atkNames + '</b><br>兵力：<b>' + fmt(r.atkTroops) + '</b></div></div>' +
        '<div class="br-vs">🏕</div>' +
        '<div class="br-side"><div class="br-side-name" style="color:' + facCol(r.defFac) + '">守方营寨 · ' + facName(r.defFac) + '</div>' +
        '<div class="br-side-val">将领：<b>' + r.defNames + '</b><br>兵力：<b>' + fmt(r.defTroops) + '</b></div></div>' +
        '</div>' +
        '<div class="br-result-bar">' +
        campTag +
        '<div class="br-result-row"><span>胜方</span><b style="color:' + facCol(winFac3) + '">' + winNames3 + '</b></div>' +
        '<div class="br-result-row"><span>胜方损失</span><b class="loss">-' + fmt(winLost3) + '兵</b></div>' +
        '<div class="br-result-row"><span>败方损失</span><b class="loss">-' + fmt(loseLost3) + '兵</b></div>' +
        '<div class="br-result-row"><span>兵力对比</span><b>' + fmt(r.atkTroops) + ' : ' + fmt(r.defTroops) + '</b></div>' +
        (r.atkWins
          ? '<div class="br-result-row"><span>营寨</span><b style="color:#c03030">守方营寨被攻破</b></div>'
          : '<div class="br-result-row"><span>营寨</span><b style="color:#1a7a3a">守方营寨完好保全</b></div>') +
        '</div>' +
        '<div class="br-narrative">' +
        (isCampRaid
          ? ('<span style="color:' + facCol(r.atkFac) + '">' + r.atkNames + '</span>劫营夜袭得手，' +
            '<span style="color:' + facCol(r.defFac) + '">' + r.defNames + '</span>营中士卒大乱（士气-30）。' +
            (r.atkWins
              ? '攻方借乱一举攻破营垒，歼敌' + fmt(loseLost3) + '人，自损' + fmt(winLost3) + '人。'
              : '然守方主将力挽颓势，奋勇反击，将攻方逐出营外，自损' + fmt(loseLost3) + '人。'))
          : ('<span style="color:' + facCol(r.atkFac) + '">' + r.atkNames + '</span>强攻营垒，' +
            '<span style="color:' + facCol(r.defFac) + '">' + r.defNames + '</span>凭营据守（防御+10%战力）。' +
            (r.atkWins
              ? '攻方以绝对优势攻破营寨，歼敌' + fmt(loseLost3) + '人，自损' + fmt(winLost3) + '人。'
              : '守方以逸待劳，击退来犯之敌，自损' + fmt(loseLost3) + '人，营寨完好。'))
        ) +
        '</div>';
    }
    document.getElementById('brBody').innerHTML = campBody;

  } else if(r.type==='siege'){
    const sizeLabel = {small:'小城',medium:'中城',large:'大城'}[r.citySize||'medium']||'中城';
    document.getElementById('brTitle').textContent = '🏰 攻城战 · ' + r.cityName + '（' + sizeLabel + '）';

    const resEl = document.getElementById('brResult');
    const winFacS = r.atkWins ? r.atkFac : r.defFac;
    resEl.className = 'br-result ' + (winFacS===G.playerFac?'win':'lose');
    resEl.textContent = r.atkWins ? facName(r.atkFac) + '方攻克！' : facName(r.defFac) + '方守住！';

    const breakoutHtml = (r.breakoutReports||[]).length > 0
      ? '<div class="br-result-row"><span>突围判定</span><b>' +
        r.breakoutReports.map(br =>
          br.success
            ? '<span style="color:#1a7a3a">' + br.name + '突围成功（-' + br.lossRate + '%）</span>'
            : '<span style="color:#c03030">' + br.name + '突围失败，全军覆没</span>'
        ).join(' / ') + '</b></div>'
      : '';

    document.getElementById('brBody').innerHTML =
      duelBlockHtml(r.activeDuel, true) +
      duelBlockHtml(r.passiveDuel, false) +
      '<div class="br-sides">' +
      '<div class="br-side">' +
      '<div class="br-side-name" style="color:' + facCol(r.atkFac) + '">进攻方 · ' + facName(r.atkFac) + '</div>' +
      '<div class="br-side-val">将领：<b>' + r.atkNames + '</b><br>兵力：<b>' + fmt(r.atkTroops) + '</b></div>' +
      '</div>' +
      '<div class="br-vs">🏰</div>' +
      '<div class="br-side">' +
      '<div class="br-side-name" style="color:' + facCol(r.defFac) + '">守方 · ' + facName(r.defFac) + ' · ' + r.cityName + '</div>' +
      '<div class="br-side-val">将领：<b>' + r.defNames + '</b><br>兵力：<b>' + fmt(r.defTroops) + '</b></div>' +
      '</div></div>' +
      '<div class="br-result-bar">' +
      '<div class="br-result-row"><span>城防加成</span><b style="color:#8a7030">×' + (r.defMult||1).toFixed(2) + '（' + sizeLabel + '）</b></div>' +
      '<div class="br-result-row"><span>胜方</span><b style="color:' + facCol(winFacS) + '">' + (r.atkWins?r.atkNames:r.defNames) + '</b></div>' +
      '<div class="br-result-row"><span>胜方损失</span><b class="loss">-' + fmt(r.atkWins?r.atkLost:r.defLost) + '兵</b></div>' +
      '<div class="br-result-row"><span>败方损失</span><b class="loss">-' + fmt(r.atkWins?r.defLost:r.atkLost) + '兵</b></div>' +
      '<div class="br-result-row"><span>兵力对比</span><b>' + fmt(r.atkTroops) + ' : ' + fmt(r.defTroops) + '</b></div>' +
      (r.atkWins ? '<div class="br-result-row"><span>城市</span><b style="color:#c03030">' + r.cityName + '易主！' + facName(r.atkFac) + '占领</b></div>' : '') +
      breakoutHtml +
      '</div>' +
      '<div class="br-narrative">' +
      (r.atkWins
        ? '<span style="color:' + facCol(r.atkFac) + '">' + r.atkNames + '</span>历经围城，率军攻破<span style="color:' + facCol(r.defFac) + '">' + r.defNames + '</span>城防（×' + (r.defMult||1).toFixed(2) + '），克城占地，威震天下。' +
          (r.breakoutReports?.some(b=>b.success) ? '部分守军突围逃脱。' : '')
        : '<span style="color:' + facCol(r.defFac) + '">' + r.defNames + '</span>凭借' + r.cityName + '坚城（城防×' + (r.defMult||1).toFixed(2) + '），力挫<span style="color:' + facCol(r.atkFac) + '">' + r.atkNames + '</span>攻势，围城解除。') +
      '</div>';

  } else if(r.type==='retreat'){
    document.getElementById('brResult').textContent='撤退';
    document.getElementById('brResult').className='br-result draw';
    document.getElementById('brBody').innerHTML=
      duelBlockHtml(r.activeDuel, true)+
      `<div class="br-narrative">
        <span style="color:${facCol(r.defFac)}">${r.defNames}</span>
        凭借更高的机动速度，成功规避了
        <span style="color:${facCol(r.atkFac)}">${r.atkNames}</span>
        的进攻，撤离战场。
      </div>`;
  } else {
    const winFac  = r.atkWins ? r.atkFac : r.defFac;
    const loseFac = r.atkWins ? r.defFac : r.atkFac;
    const winNames  = r.atkWins ? r.atkNames : r.defNames;
    const loseNames = r.atkWins ? r.defNames : r.atkNames;
    const winLost   = r.atkWins ? r.atkLost  : r.defLost;
    const loseLost  = r.atkWins ? r.defLost  : r.atkLost;

    const resEl = document.getElementById('brResult');
    resEl.className = 'br-result ' + (winFac===G.playerFac?'win':'lose');
    resEl.textContent = `${facName(winFac)}方胜`;

    const pursued = r.pursued ? `<div class="br-result-row"><span>追击</span><b style="color:#c03030">败方溃退遭追击，额外损伤</b></div>` : '';

    // 单挑对战力的影响描述
    const duelEffect = (r.passiveDuel||r.activeDuel) ? (()=>{
      const d = r.activeDuel?.accepted!==false ? (r.activeDuel||r.passiveDuel) : r.passiveDuel;
      if(!d) return '';
      if(d.outcome==='draw') return '';
      const beneficiary = d.outcome==='atkWin' ? '进攻方' : '防守方';
      return `<div class="br-result-row"><span>单挑影响</span><b style="color:var(--ink-l)">${beneficiary}因单挑胜势，战力获得加成</b></div>`;
    })() : '';

    document.getElementById('brBody').innerHTML=
      duelBlockHtml(r.activeDuel, true)+
      duelBlockHtml(r.passiveDuel, false)+
      `<div class="br-sides">
        <div class="br-side">
          <div class="br-side-name" style="color:${facCol(r.atkFac)}">进攻方 · ${facName(r.atkFac)}</div>
          <div class="br-side-val">
            将领：<b>${r.atkNames}</b><br>
            兵力：<b>${fmt(r.atkTroops)}</b>
          </div>
        </div>
        <div class="br-vs">VS</div>
        <div class="br-side">
          <div class="br-side-name" style="color:${facCol(r.defFac)}">防守方 · ${facName(r.defFac)}</div>
          <div class="br-side-val">
            将领：<b>${r.defNames}</b><br>
            兵力：<b>${fmt(r.defTroops)}</b>
          </div>
        </div>
      </div>
      <div class="br-result-bar">
        <div class="br-result-row"><span>胜方</span><b style="color:${facCol(winFac)}">${winNames}</b></div>
        <div class="br-result-row"><span>胜方损失</span><b class="loss">-${fmt(winLost)}兵</b></div>
        <div class="br-result-row"><span>败方损失</span><b class="loss">-${fmt(loseLost)}兵</b></div>
        ${pursued}${duelEffect}
        <div class="br-result-row"><span>兵力对比</span><b>${fmt(r.atkTroops)} : ${fmt(r.defTroops)}</b></div>
      </div>
      <div class="br-narrative">
        <span style="color:${facCol(winFac)}">${winNames}</span>凭兵力优势力压<span style="color:${facCol(loseFac)}">${loseNames}</span>，
        ${r.cpRatio>1.3?'形成压倒性优势，':'势均力敌，'}
        歼敌${fmt(loseLost)}人，自损${fmt(winLost)}人。
        ${r.pursued?'败军溃逃时遭到追击，伤亡进一步扩大。':'败方成功脱离接触。'}
      </div>`;
  }

  // ── D4 连携：战报显示连携触发行 ──
  if(r.synergyLogs && r.synergyLogs.length){
    const bar = document.getElementById('brBody')?.querySelector('.br-result-bar');
    if(bar){
      r.synergyLogs.forEach(line => {
        bar.innerHTML += `<div class="br-result-row"><span>✨ 连携</span><b style="color:#8a6a10">${line}</b></div>`;
      });
    }
  }

  // ── 武将技能触发行 ──
  if(r.skillLogs && r.skillLogs.length){
    const bar = document.getElementById('brBody')?.querySelector('.br-result-bar');
    if(bar){
      r.skillLogs.forEach(s => {
        bar.innerHTML += `<div class="br-result-row"><span style="color:#9060b0">${s.icon} 技能</span><b style="color:#7a50a0">${s.gen}「${s.name}」${s.desc}</b></div>`;
      });
    }
  }

  // ── A5：战报追加俘获/战死/单挑击杀行 ──
  // 判定俘获方向：captureReports记录的是胜方俘获败方
  const _playerWon = r.playerWasAttacker ? r.atkWins : (r.playerWasAttacker===false ? !r.atkWins : null);
  function genEventRows(captureReports, deathReports){
    let rows = '';
    (deathReports||[]).forEach(name=>{
      rows += `<div class="br-result-row"><span>💀 战死</span><b style="color:#c03030">${name} 阵亡（永久）</b></div>`;
    });
    (captureReports||[]).forEach(p=>{
      if(p.action==='pending')    rows += `<div class="br-result-row"><span>⛓ 我方俘获</span><b style="color:#6b5530">${p.name} 被俘，待处置</b></div>`;
      else if(p.action==='surrender') rows += `<div class="br-result-row"><span>⛓ ${_playerWon?'我方俘获':'被敌俘获'}</span><b style="color:#60c060">${p.name} 被俘后归降</b></div>`;
      else if(p.action==='execute')   rows += `<div class="br-result-row"><span>⛓ ${_playerWon?'我方俘获':'被敌俘获'}</span><b style="color:#c03030">${p.name} 被俘后遭处决</b></div>`;
      else if(p.action==='release')   rows += `<div class="br-result-row"><span>⛓ ${_playerWon?'我方俘获':'被敌俘获'}</span><b style="color:#60a0d0">${p.name} 被俘后获释</b></div>`;
    });
    return rows;
  }
  const evRows = genEventRows(r.captureReports||r.siegeCaptureReports, r.deathReports);
  if(evRows){ const bar=document.getElementById('brBody')?.querySelector('.br-result-bar'); if(bar) bar.innerHTML+=evRows; }

  // 单挑击杀/重伤行
  function appendDuelKillRow(duel){
    if(!duel||!duel.duelKillResult) return;
    const dk = duel.duelKillResult;
    const bar = document.getElementById('brBody')?.querySelector('.br-result-bar');
    if(!bar) return;
    if(dk.result==='dead') bar.innerHTML += `<div class="br-result-row"><span>💀 单挑击杀</span><b style="color:#c03030">${dk.loser} 被斩于马下（永久）</b></div>`;
    else bar.innerHTML += `<div class="br-result-row"><span>🩸 单挑重伤</span><b style="color:#a85020">${dk.loser} 被击落马下，身负重伤（war/int×0.8，${WOUNDED_CD}旬）</b></div>`;
  }
  if(r.passiveDuel) appendDuelKillRow(r.passiveDuel);
  if(r.activeDuel)  appendDuelKillRow(r.activeDuel);

  modal.style.display='flex';
}

function closeBattleModal(){
  // 发放本条战报经验（D2）
  if(typeof _currentBattleReport !== 'undefined' && _currentBattleReport){
    // ★ v151: 如果是攻城胜利，缓存处置城市ID
    if(_currentBattleReport._siegeAftermathCityId){
      G._pendingSiegeAftermath = _currentBattleReport._siegeAftermathCityId;
    }
    applyBattleExp(_currentBattleReport);
    _currentBattleReport = null;
  }
  document.getElementById('battleModal').style.display='none';
  if(_battleReports.length){ setTimeout(showNextBattleReport, 200); return; }
  // ★ v151: 攻城胜利后处置弹窗（全部战报消化完、俘虏前）
  if(G._pendingSiegeAftermath){
    const _aCityId = G._pendingSiegeAftermath;
    G._pendingSiegeAftermath = null;
    setTimeout(()=>showSiegeAftermathChoice(_aCityId, G.playerFac), 200);
    return;
  }
  // 战报全部消化后，弹出俘虏处置弹窗
  if(G._pendingPrisoners && G._pendingPrisoners.length) setTimeout(showNextPrisonerModal, 200);
  else if(window._pendingCourtCouncil){ // ★ I3: 战报+俘虏都清完后弹朝议
    const _ccProps = window._pendingCourtCouncil;
    window._pendingCourtCouncil = null;
    setTimeout(()=>showCourtCouncil(_ccProps), 400);
  }
}
// ── A5：俘虏处置弹窗 ──
function showNextPrisonerModal(){
  if(!G._pendingPrisoners || !G._pendingPrisoners.length) return;
  const {name, capturerFid} = G._pendingPrisoners[0];
  const g = GEN_MAP[name];
  if(!g){ G._pendingPrisoners.shift(); showNextPrisonerModal(); return; }
  const facCol = f=>({wei:'var(--wei)',shu:'var(--shu)',wu:'var(--wu)',nanman:'var(--nanman)'}[f]||'var(--ink-l)');
  // §8.4 W6-pending-3: origFac lookup → getGenOrigFac
  const origFid = getGenOrigFac(name);
  const origFacAlive = origFid && (G.generals[origFid]||[]).length > 0;
  const surrenderRate = Math.round(calcSurrenderRate(capturerFid, name)*100);
  const origFacStr = origFid ? (getFactionDef(origFid)?.full||origFid) : '无主';
  const noFacNote = !origFacAlive
    ? '<span style="color:#f0a040;font-size:9px">（原势力已灭，劝降+20%）</span>' : '';
  const woundedNote = isGenWounded(name)
    ? '<span style="color:#c03030;font-size:9px">⚠ 重伤中</span>' : '';
  const statColor = (stat, val) =>
    (stat==='war'||stat==='int') && isGenWounded(name)
      ? '#c03030' : (val>=90?'#8a7040':val>=75?'#1a7a3a':val>=60?'#1a5f8a':'#888');

  // Bug修复：君主不可劝降
  // §8.4 W6-pending-3 (制作人 decision C): 在场列表语义 → m.GENS_FULL (active-only 是对的);
  // 君主必在 active, role 查 m.GENS_FULL 即可 byte-identical (legacy GENS_FULL 含 pendingFac 但
  // pendingFac entries 无 .role='ruler', 同结果 undefined)
  const allGens = [...Object.values(_scenarioMaterialized.GENS_FULL).flat()];
  const genData = allGens.find(x=>x.name===name);
  const isRuler = genData?.role === 'ruler';

  let pm = document.getElementById('prisonerModal');
  if(!pm){
    pm = document.createElement('div');
    pm.id = 'prisonerModal';
    pm.style.cssText = 'position:fixed;inset:0;background:rgba(80,65,40,.12);display:flex;align-items:center;justify-content:center;z-index:3000';
    document.body.appendChild(pm);
  }

  const surrenderBtn = isRuler
    ? `<button disabled style="padding:9px;background:rgba(60,180,60,.04);border:1px solid rgba(60,180,60,.12);color:rgba(96,192,96,.3);border-radius:2px;cursor:not-allowed;font-family:'Noto Serif SC',serif;font-size:11px;text-align:left;opacity:.4">
        🤝 <b>劝降</b> — 君主不可招降<br>
        <span style="font-size:9px;margin-left:16px">一国之君，宁死不事二主</span>
      </button>`
    : `<button onclick="playerDisposePrisoner('surrender')" style="padding:9px;background:rgba(60,180,60,.12);border:1px solid rgba(60,180,60,.4);color:#60c060;border-radius:2px;cursor:pointer;font-family:'Noto Serif SC',serif;font-size:11px;text-align:left">
        🤝 <b>劝降</b> — 招募入${getFactionDef(capturerFid)?.name||capturerFid}军<br>
        <span style="font-size:9px;color:rgba(60,180,60,.65);margin-left:16px">成功率 ${surrenderRate}%（失败则自行离去）</span>
      </button>`;

  pm.innerHTML = `<div style="background:rgba(245,238,225,.99);border:1px solid rgba(92,74,50,.4);border-radius:4px;padding:22px 24px;min-width:300px;max-width:360px;font-family:'Noto Serif SC',serif;box-shadow:0 8px 40px rgba(80,65,40,.12)">
    <div style="font-size:13px;color:var(--ink);margin-bottom:14px;letter-spacing:1px">⛓ 俘虏处置${isRuler ? '<span style=\"font-size:9px;color:#c03030;margin-left:8px\">（敌主）</span>' : ''}</div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:10px;background:rgba(80,65,40,.05);border:1px solid rgba(92,74,50,.15);border-radius:3px">
      <div style="width:40px;height:40px;border-radius:3px;background:${facCol(origFid||capturerFid)}22;border:1px solid ${facCol(origFid||capturerFid)}44;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:${facCol(origFid||capturerFid)}">${name[0]}</div>
      <div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span style="font-size:13px;color:var(--ink-l)">${name}</span>
          <span style="font-size:9px;color:rgba(92,74,50,.40)">${origFacStr}${isRuler ? '·君主' : ''}</span>
          ${woundedNote}
        </div>
        <div style="font-size:9px;color:rgba(92,74,50,.55)">
          ${[['统',g.com,'com'],['武',g.war,'war'],['智',g.int,'int'],['政',g.pol,'pol'],['魅',g.cha,'cha']].map(([l,v,s])=>
            `<span style="color:${statColor(s,v)}">${l}${isGenWounded(name)&&(s==='war'||s==='int')?Math.floor(v*0.8)+'↓':v}</span>`
          ).join(' ')} · 忠${G.genLoyalty[name]??70}
          ${noFacNote}
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${surrenderBtn}
      <button onclick="playerDisposePrisoner('release')" style="padding:9px;background:rgba(80,160,220,.10);border:1px solid rgba(80,160,220,.35);color:#60a0d0;border-radius:2px;cursor:pointer;font-family:'Noto Serif SC',serif;font-size:11px;text-align:left">
        🕊 <b>释放</b> — ${isRuler ? '放虎归山，令其归国' : (origFacAlive ? '归还原势力' : '流入在野池')}<br>
        <span style="font-size:9px;color:rgba(80,160,220,.55);margin-left:16px">${isRuler ? '外交关系小幅改善' : '好感+25，日后劝降概率提升'}</span>
      </button>
      <button onclick="playerDisposePrisoner('execute')" style="padding:9px;background:rgba(200,40,40,.10);border:1px solid rgba(200,40,40,.30);color:#d06060;border-radius:2px;cursor:pointer;font-family:'Noto Serif SC',serif;font-size:11px;text-align:left">
        ☠ <b>处决</b> — 永久移除（不受重伤CD保护）<br>
        <span style="font-size:9px;color:rgba(200,40,40,.5);margin-left:16px">${isRuler ? '势力覆灭，余部瓦解' : '亲密≥50的友方武将对你-30好感'}</span>
      </button>
    </div>
  </div>`;
  pm.style.display = 'flex';
}

function playerDisposePrisoner(action){
  if(!G._pendingPrisoners || !G._pendingPrisoners.length) return;
  const {name, capturerFid} = G._pendingPrisoners.shift();
  // 君主守卫：不可劝降
  // §8.4 W6-pending-3: 同上, 在场列表语义 → m.GENS_FULL
  const allGens = [...Object.values(_scenarioMaterialized.GENS_FULL).flat()];
  const isRuler = allGens.find(x=>x.name===name)?.role === 'ruler';
  if(action === 'surrender' && isRuler){
    log(`⚠ ${name}乃一国之君，不可劝降`, 'battle');
    // 视作释放处理
    action = 'release';
  }
  if(action === 'surrender'){
    const rate = calcSurrenderRate(capturerFid, name);
    if(Math.random() < rate){
      surrenderGen(name, capturerFid);
    } else {
      // 劝降失败：武将自行离去（进在野池或保留原势力）
      // §8.4 W6-pending-3: origFac lookup → getGenOrigFac
      const origFid = getGenOrigFac(name);
      const origFacAlive = origFid && (G.generals[origFid]||[]).length>0;
      if(!origFacAlive){
        if(!G.wildPool.includes(name)) G.wildPool.push(name);
      }
      addGenChronicle(name, '被俘后拒绝归降，宁死不屈，自行离去。');
      log('💨 ' + name + ' 拒绝归降', 'battle');
    }
  } else if(action === 'execute'){
    // D-061 fix: 传入 killerName (capturerFid 主公) 让 killGen 内血仇/亲密度仇恨扩散触发
    const ruler = (G.generals[capturerFid] || []).find(g => g.role === 'ruler');
    killGen(name, ruler?.name || null);
  } else {
    releaseGen(name, capturerFid);
  }
  const pm = document.getElementById('prisonerModal');
  if(pm) pm.style.display = 'none';
  renderAllLight();
  if(G._pendingPrisoners && G._pendingPrisoners.length) setTimeout(showNextPrisonerModal, 300);
  else if(window._pendingCourtCouncil){ // ★ I3: 俘虏处置完毕后弹朝议
    const _ccProps = window._pendingCourtCouncil;
    window._pendingCourtCouncil = null;
    setTimeout(()=>showCourtCouncil(_ccProps), 400);
  }
}
