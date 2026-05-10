// src/chains/military.js
//
// 军事链(MIL)— 单位等级 / 编制 / AI 决策 / 单位基础 / turn processors / 战斗解算 /
//                战斗调度 mechanism / 玩家入口动作。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.11 Commit 2,Wave 3 第二个,**最大 chain**)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation,Node 脚本 line-by-line 复制 v181)。
//
// ── 抽离决策(2026-05-05 制作人 approve)──
// 1. **map.js 前置抽离**:hex/fog/pathfinding/terrain 单独抽到 src/core/map.js
//    (Session 3.11 Commit 1,作为本 session 前置子动作,不开新 sub-session 编号)
// 2. **aiFrontierEnemyCities 改归本 chain MIL3**(scout §10.5):函数名带 ai 前缀,
//    只有军事 AI 调用,不符合 map.js"任何 chain 都可能调的纯空间工具"边界
// 3. **战斗动画 / modal HTML 严格留 v181**(phase 2 原则):
//    _drainPendingBattleAnimations + 6 _play* / _show*Confirm / confirm* /
//    selectDuelChallenger / _battleSideHtml / _siegeArrivalChoice 等
// 4. **9 _execXxx 留 src/core/claude_ai.js 段 M**(phase 3.3 选项 A 决策,sprint batch-30 已归位 8 个到 MIL9;
//    第 9 个 _execBillet 由 sprint batch-22 deletion 删除 D-020)
// 5. **MIL7 战斗调度精确切片**:mechanism vs UI 拆段,实装就地用 grep -n "^}" 验证 closing
// 6. **billetUnit / _confirmBillet 一对**:billetUnit 调 modal 入口,**留 v181**;
//    _confirmBillet 是 modal callback,**留 v181**(整体留 v181,拆不开)
//
// ── 抽离范围(8 大段,实装时 ~25 段不连续 ranges)──
//   MIL1 unit level + exp                v181 L913-L1079 + L1170-L1174 (6 funcs + 4 const)
//        getEffectiveSquadLevel / getInitLevel / getLvMult / addUnitExp /
//        applyBattleExp / getBarracksDiscount + UNIT_LEVEL_MAX / UNIT_LEVEL_MULT_BASE /
//        UNIT_LEVEL_EXP / BATTLE_EXP
//   MIL2 编制 wrapper(p3.7 carry-over)   v181 L1380-L1398 (3 funcs)
//        getSquadMax / getUnitMax / getAvailableTechs
//   MIL3 AI 决策                          v181 L1441-L1504 + L4440-L6714 (24 funcs +
//                                          AI_PERSONALITY/AI_RECRUIT_TROOPS_BASE/
//                                          MAX_FIELD_UNITS_ABS/GAR_SALARY_RATE const)
//        aiFrontierEnemyCities(MIL3.a)+ aiGetAvailableGens / _aiFrontlineCitiesAgainst /
//        _aiCalcThreat / _aiDeployAnomaly / _aiGetThreatMatrix / _aiInvalidateThreatCache /
//        _aiScoreTarget / _aiEstimateSiegeWinRate / _aiFuzzySiegeWinRate / _aiShouldReview /
//        _aiChooseDefensePosture / _aiFindAmbushHex / aiDefendResponse / _aiIsVisibleToFac /
//        aiSelectTargets / aiExecuteOrders / _aiTrySiege / aiDefenderDecision / aiDoSiege /
//        aiDoDisband / aiDoExpand / aiDoAddSquad / aiDoRecruit / _aiCalcBudget(MIL3.b)
//   MIL4 unit 基础 + 兵种 + skills        v181 L10036-L10339 (9 funcs + 5 const)
//        getCampCost / getMixedComboMult / getMixedComboLabel / applySkills / calcUnitAP /
//        getMainTroopType / newUnitId / getUnitTroops / createUnit +
//        CAMP_COST / CAMP_MOBILIZE_TURNS / TROOP_TYPES / MIXED_COMBO_MULT / SKILL_REGISTRY
//   MIL5 turn processor                  v181 L10343-L11090 (16 funcs + 6 const)
//        processUnitMovement / getSiegeDefMult / _getSiegeDefMultWithDecay / processSiegeDecay /
//        getUnitFoodRate / getUnitSalaryRate / buildSupplyMap / isUnitSupplied /
//        processSupplyStatus / processUnitFood / getFacUnitSalary / processUnitSalary /
//        processMobilizing / getMusterRate / isUnitMustering / isAiMusterReady / processMuster +
//        SIEGE_BASE_DEF_BONUS / SIEGE_MAX_TURNS / SUPPLY_TERRAIN_COST / SUPPLY_ENEMY_PENALTY /
//        SUPPLY_MAX_RANGE / SUPPLY_RATIONS / SUPPLY_CITY_RESTORE_TURNS
//   MIL6 战斗解算                         v181 L11710-L13450 (33 funcs + 5 const)
//        getTypeMatchMult / getTerrainMult / getMixedBonusMult / getEnemyComposition /
//        _squadBase / squadATK / squadDEF / squadCP / calcUnitATK / calcUnitDEF /
//        calcCombatPower / getMaxInt / getMainCom / canFireAttack / calcFireRate /
//        applyFireEffect / clearFireDebuff / aiDecideFireAttack / resolveAmbush /
//        calcRaidChance / resolveCampBattle / checkUnitSynergy / getSynergyLine /
//        resolveBattle / resolveNavalBattle / estimateWinRate / fuzzyEstimateWinRate /
//        calcRetreatResult / canRetreat / calcPursuitLoss / doRetreat / hasGenInUnits /
//        hasFacGen + FIRE_TERRAIN_MULT / FIRE_SEASON_MULT / FIRE_COST /
//        AMBUSH_BASE_CHANCE / SYNERGY_LINES / NAVAL_BLOCKED_SKILLS
//   MIL7 战斗调度 mechanism(精确切片)    v181 多段 (16 funcs + 3 lets in-range)
//        autoResolvePendingBattle(MIL7.a)+ _checkSiegeArrival(MIL7.a)+
//        calcBreakoutChance / resolveSiegeBattle / collectBattleSides / aiInitiateBattle /
//        checkAmbushTriggers / aiDecideDuelChallenger / getDuelCandidates / resolveDuel /
//        applyDuelMorale / tryPassiveDuel / getStrengthLabel(MIL7.b)+
//        _doRetreat2Hex(MIL7.c)+ _resolveBattleEngagement(MIL7.d)+
//        processReinforcement(MIL7.e)
//        + _pendingBattleConfirms / _currentBattleConfirm / _pendingSiegeArrival
//          (lets in MIL7.a)+ _aiBattleProcessedThisTurn / _duelChallenger
//          (lets in MIL7.b)
//   MIL8 玩家入口动作                     v181 多段 (11 funcs + 1 let in-range)
//        issueUnitMove / launchSiegeAttack / cancelSiege / startMoveFromPanel /
//        cancelUnitMove / sortieFromCity / setCamp / setAmbush / cancelSpecialStatus /
//        disbandUnit / getUnitAtCity + _marchAnimating let
//   M_LETS 顶层 lets(分散 declaration)    v181 各处 (4 个独立 ranges)
//        _unitIdCounter(L2344)/ _supplyCache(L10701)/ _battleReports(L13433)/
//        _currentBattleReport(L13435)/ _pendingBattleAnimations(L13467)
//   MIL9 AI _exec 入口                    v181 L13395-L13536 (8 funcs, sprint batch-30)
//        _execMove / _execRecruit / _execDisband / _execSetCamp / _execSetAmbush /
//        _execCancelSpecial / _execCancelSiege / _execSetReinforcePolicy
//
// **总计 11 顶层 lets**(4 独立 ranges + 7 in-range);**~120 函数 + ~21 const**。
//
// ── 留 v181(phase 2 原则严格)──
//   战斗动画段(L13474-L15990 ~2517 行):_drainPendingBattleAnimations +
//     DUEL_EPITHET / _getDuelEpithet + 6 _play*Anim + _baGetUnitRenderPos /
//     _baDrawCampPalisade — render/SVG 动画
//   modal/UI 战斗调度(L17037-L17354 + L17386-L18418):_battleSideHtml /
//     _showAmbushConfirm / confirmAmbush / confirmAmbushAbort / _showCampBattleConfirm /
//     confirmCampBattle / _showSiegeBattleConfirm / _showSiegeDefendConfirm /
//     confirmSiegeDefend / confirmSiegeBattle / _showNextBattleConfirm /
//     selectDuelChallenger / confirmBattle
//   _siegeArrivalChoice(L16109-L16142):modal callback + 调动画
//   战报弹窗 / 俘虏弹窗(L18785-L19361):showNextBattleReport / closeBattleModal /
//     showNextPrisonerModal / playerDisposePrisoner — modal/UI
//   征兵 modal(L19363-L19829):openRecruitModal / closeRecruitModal / getDeployedGens /
//     renderRecruitModal / rmEditSlot / rmToggleSub / rmPickGen / rmPickType /
//     _rmSetClass / _getBilletRetainerTroops / _getBilletRetainerType / rmSetTroops /
//     rmAdjTroops / confirmRecruit
//   单位交互 UI(L19832-L20831):closeUnitMenu / _execInstantMarch /
//     _collectPlayerVisibleKeys / _animateFogReveal / _checkInstantBattleTrigger /
//     clearMovePreview / _stackPickerOpen let / closeStackPicker / showStackPicker /
//     onStackPickerSelect / onUnitLeftClick / onUnitRightClick / onMapRightClick /
//     svgEventCoords / handleMapClick / handleCityClick / getUnitDisplayPos /
//     renderUnitsOnMap
//   地图渲染(L20838-L21131):renderUnitDetail
//   billetUnit + _confirmBillet(L21209-L21286):modal 入口 + callback
//   部队管理 modal(L21407-L21681):redeploy modal 13 funcs + _rdp let;
//     openExpandModal / 等 expand modal;openAddSquadModal 等 addSquad modal
//   renderMilTab(L23173+):render Tab
//   9 _execXxx(留 src/core/claude_ai.js 段 M):_execMove / _execRecruit / _execDisband /
//     _execSetCamp / _execSetAmbush / _execCancelSpecial / _execCancelSiege / _execBillet /
//     _execSetReinforcePolicy
//   `_battleAnimating / _fastForward / _ffTurns` lets(动画 / 快进控制,留 v181)
//   `BLDS` const(L1154,建筑数据,跨链使用,留 v181 等 src/data/buildings.js sprint)
//   `JUNS` const(L1407,郡数据,phase 1 笔记标记留 v181)
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G.units[]`(unit 数组主写口 — createUnit 加 / disbandUnit 删 /
//      移动 / 战斗 / 招募 / 解散 全在军事链)
//   - `G.units[i].squads[].troops / .level / .exp / .genName / ._musterTarget / ._mustered`
//      (squad 主属性)
//   - `G.units[i].status / .target / .intent / .siegeTarget / ._siegeTurnCount /
//      .hq / .hr / .ap / .lastApUsage / .stamina`(unit 战术状态)
//   - `G.cities[].garrison / .siegeDecay`(城防 + 围城衰减)
//   - `G.factions[fid].res.gold / .food / .wood / .iron`(扣资源 — 招募 / 扎营 /
//      建设,与经济链共享主写口,主写口在动作发起的链)
//   - `G.factions[fid].lastUnitSalary`(军饷 cache)
//   - 11 顶层 lets:_unitIdCounter / _supplyCache / _battleReports /
//      _currentBattleReport / _pendingBattleAnimations / _pendingBattleConfirms /
//      _currentBattleConfirm / _pendingSiegeArrival / _aiBattleProcessedThisTurn /
//      _duelChallenger / _marchAnimating
//
// **跨链副作用写口**(整函数归军事):
//   - createUnit:写 G.units(主)+ 扣 res(经济)
//   - applyBattleExp / addUnitExp:写 unit/squad.exp / level(军事)
//   - resolveBattle / resolveSiegeBattle / resolveCampBattle / resolveAmbush /
//      resolveNavalBattle:战斗结算,主写 unit.troops + city.garrison;副作用通过
//      hub 调 killGen / surrenderGen(武将)/ checkBloodFeud(外交)/ trackCityLoss(外交)
//   - sortieFromCity:写 unit + city.garrison(经济)— 出城核心
//   - aiDoRecruit:扣 res + 调 createUnit
//   - processSupplyStatus:写 unit.supplied(军事补给状态)
//   - processUnitFood / processUnitSalary:扣 res(经济)
//   - aiSelectTargets / aiExecuteOrders / aiDefenderDecision:写 unit.target / .intent
//
// 跨链 carry-over 验证(本 session 启动前):
//   §3.5:events.js applyEthosShock 反向调用 ✓ 已 PASS
//   §3.6:gentry G5/G6 aftermath 跨链写口归 gentry,军事不反取 ✓
//   §3.7:getSquadMax/getUnitMax/getAvailableTechs 是军事 wrapper(本 session MIL2 抽)✓
//   §3.8:_clearSiegeOnPeace 写 unit.status/siegeTarget(已抽外交),军事不反取 ✓
//   §3.8:_applyScoutReveal 写 G.fog(已抽外交,但 G.fog 现归 map.js),map.js 不反取 ✓
//   §3.8:checkEmperorCapture 写 FAC_IDENTITY.type(已抽外交),军事不反取 ✓
//   §3.9:createUnit / hkey / getUnitTroops 反向调用 → 本 session MIL4 抽 createUnit /
//        getUnitTroops,hkey 已抽 map.js M1 ✓
//   §3.9:_supplyCache 留 3.11 → 本 session 抽到 chains/military.js M_LETS ✓
//   §3.10:_triggerMinorRebellion 写 G.units 是叛乱副作用(已抽事件),军事不反取 ✓
//   §3.10:_triggerMajorRebellion 写 city.fac 是叛乱副作用 ✓
//
// ── 接口风格 ──
// 全局函数 + 顶层 const + 顶层 let(同 v181 + 已抽 src/data/ + src/core/* +
// src/render/ + chains/* 模块共享 hoisted function 全局可见,无 import/export)。
// 11 顶层 lets 跨 classic <script> 共享(phase 3.4 已验证)。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(callers):
//   - core(已抽):
//       `src/core/main.js`:initGame 调 createUnit / 写 G.units 初始化
//       `src/core/tick.js`:每旬调用 processUnitMovement / processSiegeDecay /
//         processSupplyStatus / processUnitFood / processUnitSalary / processMobilizing /
//         processMuster / processBuildQueues(经济)/ 各 AI 决策入口
//       `src/core/claude_ai.js`:9 _execXxx 调本 chain 玩家入口动作
//       `src/core/map.js`(本 session Commit 1):被本 chain 大量调用(反向)
//   - 经济链(已抽 chains/economy.js):
//       processFacEconomy / processTransfers / aiDoBuild / aiDoTransfer 等读 unit /
//       garrison / supply 状态 — 反向调用
//   - 武将链(留 v181 等 3.12):
//       killGen / surrenderGen / processFactionLoyalty 等被 resolveBattle / 被擒处理
//       路径调用 — 反向调用
//   - 政治链(已抽 chains/politics.js):
//       trackCityLoss → checkPostDowngrade(失城裁官);doEnthrone 写 emperor 触发
//       全局战争 — 反向调用
//   - 外交链(已抽 chains/diplomacy.js):
//       applyCommonEnemyDiploBonus / checkBloodFeud / trackCityLoss / checkEmperorCapture
//       被战斗结算 / 城市易手调 — 反向调用
//   - 豪族链(已抽 chains/gentry.js):
//       _triggerGentryBetray / applyGentryOnCapture / applyFamilyLoyaltyShock 被
//       战斗 / 城市易手 / killGen 调 — 反向调用
//   - 价值观链(已抽 chains/ethos.js):
//       processFacEthos 调 hasFacGen / genHasOffice — 反向调用
//   - 事件链(已抽 chains/event.js):
//       _triggerMinorRebellion 写 G.units(spawn rebel)— 已 carry-over §3.10
//   - render(留 v181):
//       多 modal / Tab 调本 chain 大量函数
//   - inline backToTitle / startGame / saveGame / loadFromSlot:
//       11 顶层 lets reset:L26835+ backToTitle / L26829+ startGame 写已抽 lets
//       saveGame meta 序列化 _unitIdCounter(L23383),loadFromSlot 反序列化(L23408)
//       — 全部跨 script 写,**保持不变**
//
// 本 chain 调外部(callees):
//   - `src/core/map.js`(本 session Commit 1):大量调 hexDist / hkey / hexAstar /
//      hexNeighbors / getHexMoveCost / getTerrainAt / getUnitNodeId / unitsContact /
//      ensureCityNeighbors / canSeeFactionData / getFogLevel / fogBFS / TERRAIN_AP_COST 等
//   - `src/core/claude_ai.js`(已抽):被 9 _execXxx 反向调
//   - 经济链:读 G.factions[].res / G.cities[].garrison / G.cities[].storage 等
//   - 武将链(留 3.12):addStatExp / addAptExp / killGen / surrenderGen / addGenChronicle /
//      hasFacGen / hasGenInUnits / getGenFactions / getGenFaction / addIntimacy /
//      addRetainers / setRetainers / getRetainers / getRetainersDisplay
//   - 政治链(已抽):getTechEffect / hasTechEffect / getStage / addMerit / calcPostBuffs /
//      getCourtDecreeBuffs / clearAllPostsByGen
//   - 外交链(已抽):addDiplo / getDiploStatus / isHostile / alliedFacs / isVassal /
//      getSuzerain / addCommonEnemyDiploBonus / trackCityLoss / checkEmperorCapture /
//      checkBloodFeud / applyReputationPenalty / getReadyClaim / applyCommonEnemyDiploBonus
//   - 豪族链(已抽):applyGentryOnCapture / applyFamilyLoyaltyShock / _aggregateGentry /
//      getGentryDefMult / getGentryRecruitMult / getGentryMoraleMod / _applySiegeAftermath /
//      _onSiegeAftermath / _triggerGentryBetray
//   - 价值观链(已抽):applyEthosShock
//   - 经济链(已抽):getCityProd / getCityFoodCost / canBilletToCity / getBilletCities /
//      garrisonCap / getCityCap / canAffordMat / deductMat / mergeMatCosts / calcSlotMatCost
//   - core helpers(已抽):safeSub / safeAdd
//   - render(已抽):log / showNotif / fmt / closeModal / renderAll / renderAllLight /
//      renderRight / renderMap / invalidateCityCache / updateFogCitySnapshot
//   - 数据 / 常量(已抽 src/data/ 或留 v181):FAC / ALL_FACS / GEN_TAGS / GEN_MAP /
//      CITY_MAP / CITIES_DEF / FAC_IDENTITY / TECH_TREE / BLDS / SUPPLY_LOSS_RATES 等
//   - `G(状态根)`(已抽 src/core/state.js)
//
// 同 phase 2/3.2-3.10 反向调用模式,设计原则 (c) 已 approve。
//
// ── plan §二偏离记录 ──
// PLAN §三阶段 3.11(原)字面:`chains/military.js(军事链 v4 / ~200 函数)`
//   字面映射:含 hex/fog/pathfinding 34 funcs(归 map.js)+ 大量 modal/animation/render
// scout 实测 + 制作人 approve 修订:
//   - map.js 抽 36 funcs + 17 const + 1 class(Commit 1 已完成)
//   - chains/military.js 抽 ~120 函数 + ~21 const + 11 顶层 lets(本 session Commit 2)
//   - 留 v181:~80 个 modal/animation/render funcs(phase 2 原则)
//   - 9 _exec 留 src/core/claude_ai.js(phase 3.3 选项 A)
// PLAN-vs-reality 偏差大,主因:phase 2 原则严格 + map.js 单独抽 + 选项 A _exec 留 v181。
//
// scout-before-extract 第 11 次应用,scout 四件验证(p3.8 沉淀)PASS。
// 实装阶段 4 个就地修正(map.js Commit 1 边界):见 phase3_11_notes §四教训沉淀。
//
// ── script 加载顺序(制作人 2026-05-05 approve)──
// `data/* → core/state → helpers → hubs → claude_ai → tick → main → map →
//  chains/ethos → gentry → politics → diplomacy → economy → event → military →
//  render/* → inline`
// 本文件加在 chains/event.js 之后,render/notifications.js 之前。
//
// ── chain 抽离模板第七次应用(Wave 3 第二个,最大 chain)──
// phase 3.5-3.10 模板六次应用稳定,本 session 是模板第七应用 + 最大 chain 收尾。
//   - 6 项 header 必含 ✓(含写口归属声明 + 跨链 carry-over 验证全部 PASS)
//   - 加载顺序规范 ✓
//   - phase 2 原则(modal HTML / animation / render Tab 全部留 v181)✓
//   - 跨链反向调用 (c) 容许,callers/callees 按归属链整理 ✓
//   - 跨链 carry-over §3.5-§3.10 全部验证 PASS ✓
//   - Node 双脚本 line-by-line verbatim 复制(预防 awk 边界 + 字符替换 bug)✓
//   - scout 四件验证全部 PASS ✓
//   - 11 顶层 lets 跨 script 共享(phase 3.4 验证 + 本 session 启动前 saveGame meta 实测)✓

// ════════════════════════════════════════════════════════════════════
// ── MIL1.a unit level + exp + applyBattleExp (v181 L913-L1079) ──
// ════════════════════════════════════════════════════════════════════

/** v163: 计算squad有效等级（部曲加权） */
function getEffectiveSquadLevel(sq, unitLevel){
  const ret = getRetainers(sq.genName);
  if(ret <= 0) return unitLevel;
  const inSquad = Math.min(ret, sq.troops);
  const normal = sq.troops - inSquad;
  if(sq.troops <= 0) return unitLevel;
  return Math.round((inSquad * RETAINER_LEVEL + normal * unitLevel) / sq.troops);
}

// ── 部队等级系统（D2）──
// 等级 1~20，新兵基础5级，popQuality每降10分降1级，最低1级
// lvMult = 1 + (level-1)*0.05，满级=1.95（约为5级新兵的1.63倍）
const UNIT_LEVEL_MAX = 20;
const UNIT_LEVEL_MULT_BASE = 0.05;  // 每级+5%战力
// 升级经验阈值：exp[i] = 需要从第i级升到第i+1级的经验值
// 基础15，每级+7.5（取整），共19档
const UNIT_LEVEL_EXP = (()=>{
  const arr=[];
  for(let i=0;i<19;i++) arr.push(Math.round(15 + i*7.5));
  return arr; // arr[0]=15(1→2), arr[18]=150(19→20)
})();
// 战报经验发放表
const BATTLE_EXP = {
  field_win: 10, field_lose: 4,
  ambush_atk_win: 12, ambush_def_lose: 2,
  camp_atk_win: 12, camp_def_lose: 2,
  siege_atk_win: 15, siege_def_lose: 5,
  siege_def_win: 10, siege_atk_lose: 4,
};

/**
 * 根据城市popQuality计算新兵初始等级
 * popQuality >= 80 → 5级（基准）
 * 每降10分 → -1级，最低1级
 */
function getInitLevel(city){
  if(!city) return 5;
  const q = city.popQuality ?? 80;
  const penalty = Math.max(0, Math.floor((80 - q) / 10));
  const techBonus = getTechEffect(city.fac, 'initLevelBonus'); // ★ v115
  return Math.max(1, Math.min(UNIT_LEVEL_MAX, 5 - penalty + techBonus));
}

/**
 * 获取等级对应战力倍率
 */
function getLvMult(level){
  const lv = Math.max(1, Math.min(UNIT_LEVEL_MAX, level||1));
  return 1 + (lv-1) * UNIT_LEVEL_MULT_BASE;
}

/**
 * 给unit增加经验，触发升级
 * @returns {number} 升级次数（用于log）
 */
function addUnitExp(unit, expGain){
  if(!expGain || expGain<=0) return 0;
  if(!unit.exp) unit.exp = 0;
  if(!unit.level) unit.level = 1;
  unit.exp += expGain;
  let leveled = 0;
  while(unit.level < UNIT_LEVEL_MAX){
    const needed = UNIT_LEVEL_EXP[unit.level-1];
    if(unit.exp >= needed){ unit.exp -= needed; unit.level++; leveled++; }
    else break;
  }
  if(unit.level >= UNIT_LEVEL_MAX) unit.exp = 0; // 满级不再积经验
  return leveled;
}

/**
 * 战报关闭后发放经验（方案A）
 * ★ v149fix B01: 仅对实际参战部队发放经验，不再全势力发放
 * report._atkUnitIds / report._defUnitIds 记录参战部队ID
 * 兼容旧存档（无ID字段时降级为全势力发放）
 */
function applyBattleExp(report){
  if(!report) return;
  const t = report.type || 'field';

  // ── 统一提取胜败方势力 ──
  let winFac, loseFac;
  let winUnitIds, loseUnitIds;
  if(t === 'ambush'){
    winFac  = report.ambushWins ? report.ambushFac : report.victimFac;
    loseFac = report.ambushWins ? report.victimFac : report.ambushFac;
    winUnitIds  = report.ambushWins ? report._atkUnitIds : report._defUnitIds;
    loseUnitIds = report.ambushWins ? report._defUnitIds : report._atkUnitIds;
  } else {
    const atkWins = report.atkWins;
    winFac  = atkWins ? report.atkFac : report.defFac;
    loseFac = atkWins ? report.defFac : report.atkFac;
    winUnitIds  = atkWins ? report._atkUnitIds : report._defUnitIds;
    loseUnitIds = atkWins ? report._defUnitIds : report._atkUnitIds;
  }

  // ★ v149fix B01: 按参战ID精确筛选；若无ID字段（旧存档兼容）降级为全势力
  const getUnits = (fac, ids) => {
    if(!fac) return [];
    if(ids && ids.length > 0){
      const idSet = new Set(ids);
      return G.units.filter(u => idSet.has(u.id) && getUnitTroops(u) > 0);
    }
    return G.units.filter(u => u.fac === fac && getUnitTroops(u) > 0);
  };

  const winUnits  = getUnits(winFac, winUnitIds);
  const loseUnits = getUnits(loseFac, loseUnitIds);

  // 经验值查表
  let winExp=0, loseExp=0;
  if(t==='field' || t==='battle'){  // ★ v179fix P21: 野战resolveBattle设type='battle'，对齐'field'查表
    winExp = BATTLE_EXP.field_win; loseExp = BATTLE_EXP.field_lose;
  } else if(t==='ambush'){
    winExp = BATTLE_EXP.ambush_atk_win; loseExp = BATTLE_EXP.ambush_def_lose;
  } else if(t==='camp'){
    winExp = BATTLE_EXP.camp_atk_win; loseExp = BATTLE_EXP.camp_def_lose;
  } else if(t==='siege'){
    if(report.atkWins){ winExp=BATTLE_EXP.siege_atk_win; loseExp=BATTLE_EXP.siege_def_lose; }
    else        { winExp=BATTLE_EXP.siege_def_win; loseExp=BATTLE_EXP.siege_atk_lose; }
  }

  const isAmbushOrCamp = (t==='ambush' || t==='camp');

  winUnits.forEach(u=>{
    // ★ D1: 经验获取buff（大将军）
    const pb = G.factions[u.fac]?._postBuffs;
    let expMult = 1 + (pb?.expGain || 0);
    // SKILL_INLINE: xianzhen — 高顺·陷阵：所在部队经验获取×1.50
    if(u.squads.some(sq => sq.genName === '高顺')) expMult *= 1.50;
    const leveled = addUnitExp(u, Math.floor(winExp * expMult));
    if(leveled>0) log(`🎖 ${u.squads[0]?.genName||'?'}部 升至Lv.${u.level}！`, 'battle');
    // ★ D1: 功绩 — 参战+3, 胜利额外+5
    u.squads.forEach(sq=>{ if(sq.genName) addMerit(sq.genName, 8); });
    // ★ D3: 武将属性成长（胜方）
    u.squads.forEach(sq=>{
      if(!sq.genName) return;
      addStatExp(sq.genName, 'com', 2);                            // 参战胜→统+2exp
      if(isAmbushOrCamp) addStatExp(sq.genName, 'int', 4);         // 伏击/劫营成功→智+4exp
      addAptExp(sq.genName, sq.type, 3);                           // 兵种适性+3exp（胜）
      // ★ v163: 部曲——胜方老兵晋升（存活非部曲×2%×等级/10 转化为部曲）
      const _ret = getRetainers(sq.genName);
      const _nonRet = Math.max(0, sq.troops - Math.min(_ret, sq.troops));
      if(_nonRet > 0){
        const _promote = Math.max(1, Math.floor(_nonRet * 0.02 * (u.level||1) / 10));
        const _newRet = Math.min(_ret + _promote, Math.floor(sq.troops * 0.50)); // ★ v167fix: 部曲上限50%
        if(_newRet > _ret) setRetainers(sq.genName, _newRet);
      }
    });
  });
  loseUnits.forEach(u=>{
    // SKILL_INLINE: xianzhen_lose — 高顺·陷阵：败方经验也受益
    let _loseExpMult = 1;
    if(u.squads.some(sq => sq.genName === '高顺')) _loseExpMult = 1.50;
    addUnitExp(u, Math.floor(loseExp * _loseExpMult));
    // ★ D1: 功绩 — 参战+3（败方也有）
    u.squads.forEach(sq=>{ if(sq.genName) addMerit(sq.genName, 3); });
    // ★ D3: 武将属性成长（败方）
    u.squads.forEach(sq=>{
      if(!sq.genName) return;
      addStatExp(sq.genName, 'com', 0.5);                          // 参战败→统+0.5exp
      if(isAmbushOrCamp) addStatExp(sq.genName, 'int', 1);         // 被伏击/被劫营→智+1exp
      addAptExp(sq.genName, sq.type, 1);                           // 兵种适性+1exp（败）
    });
  });
}

// ════════════════════════════════════════════════════════════════════
// ── MIL1.b getBarracksDiscount (v181 L1170-L1174) ──
// ════════════════════════════════════════════════════════════════════

/** v111: 兵营征兵费折扣 — lv0:×1.0, lv1:×0.90, lv2:×0.80, lv3:×0.70 */
function getBarracksDiscount(city){
  const lv = city.buildings?.barracks || 0;
  return [1.0, 0.90, 0.80, 0.70][lv] || 1.0;
}

// ════════════════════════════════════════════════════════════════════
// ── MIL1.c calcRecruitCost (D-006 fix, mode 8 多入口一致性 helper) ──
// ════════════════════════════════════════════════════════════════════

/**
 * 征兵金费统一 helper (D-006 MEDIUM fix)
 * 含 6 修正: 豪族 / 兵营 / 仪兵 / 科技 / 特色兵种 / 官职(_postBuffs.recruitCost)
 * 覆盖 10 处 call site: 玩家征兵/整备/扩编/增编 modals + 传统 AI 主征兵/加分队/扩编 + Claude AI _execRecruit
 *
 * @param {string} fid           势力 id
 * @param {string} cityId        城市 id
 * @param {number} troops        新征兵数(已扣除 billet 后的纯新增)
 * @param {number} eliteCostMult 兵种 costMult (单 type: TROOP_TYPES[t].costMult; 多 type: Math.max)
 * @returns {number} 总金费 (Math.floor)
 */
function calcRecruitCost(fid, cityId, troops, eliteCostMult){
  const city = G.cities[cityId];
  const fac = G.factions[fid];
  if(!city || !fac) return 0;
  const _rcBuff   = fac._postBuffs?.recruitCost || 0;
  const _gentry   = getGentryRecruitMult(cityId);
  const _barrDisc = getBarracksDiscount(city);
  const _yibing   = city._yibingBuff && city._yibingBuff.expiresAt > G.turn ? 0.70 : 1.0;
  const _techRC   = 1 + getTechEffect(fid, 'recruitCostMult');
  const _elite    = eliteCostMult || 1.0;
  return Math.floor(1200 * troops / 5000 * _gentry * _barrDisc * _yibing * _techRC * _elite * (1 + _rcBuff));
}

// ════════════════════════════════════════════════════════════════════
// ── MIL2 编制 wrapper (v181 L1380-L1398) ──
// ════════════════════════════════════════════════════════════════════

function getSquadMax(fid) {
  return SQUAD_MAX_TROOPS + getTechEffect(fid, 'squadMaxBonus');
}

/** 获取势力的unit编制上限（squadMax×3） */
function getUnitMax(fid) {
  return getSquadMax(fid) * 3;
}

/** 获取可研究的科技列表（前置全满足+未研究） */
function getAvailableTechs(fid) {
  const tech = G.factions[fid]?._tech;
  if (!tech) return [];
  return Object.keys(TECH_TREE).filter(tid => {
    if (tech.researched.has(tid)) return false;
    const def = TECH_TREE[tid];
    return def.prereq.every(p => tech.researched.has(p));
  });
}

// ════════════════════════════════════════════════════════════════════
// ── MIL3.a aiFrontierEnemyCities (v181 L1441-L1504) ──
// ════════════════════════════════════════════════════════════════════

/**
 * G2: 找出fid势力的"前线邻接敌城"
 * BFS从己方所有城市出发，沿ROADS扩展：
 *   - 己方城市：穿透，继续扩展
 *   - 敌方城市：记录为可攻击目标，但不穿透（不能绕过前线打后方）
 *   - 中立/其他：不穿透（AI不应假设能借道）
 * 返回：Set of cityId（前线敌城）
 */
function aiFrontierEnemyCities(fid) {
  const frontier = new Set();
  const visited = new Set();
  const queue = [];

  // 起点：己方所有城市
  const myCityIds = new Set();
  Object.values(G.cities).forEach(c => {
    if (c.fac === fid) {
      queue.push(c.id);
      visited.add(c.id);
      myCityIds.add(c.id);
    }
  });

  while (queue.length > 0) {
    const cur = queue.shift();
    const neighbors = ROAD_ADJ[cur] || [];
    for (const nb of neighbors) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      const nbCity = G.cities[nb];
      if (!nbCity) continue;

      if (nbCity.fac === fid) {
        // 己方城市：穿透继续
        queue.push(nb);
      } else if (isHostile(fid, nbCity.fac)) {
        // 敌方城市：记录为前线目标，不穿透
        frontier.add(nb);
      }
      // 中立/其他城市：不穿透（AI不应假设能借道）
    }
  }

  // v109: 叛军城特殊处理——穿透叛军城继续搜索后方叛军城
  // 否则被叛军城隔开的第二层叛军城永远不会被发现
  const rebelQueue = [...frontier].filter(cid => G.cities[cid]?.fac === 'rebel');
  const rebelVisited = new Set(visited);
  while (rebelQueue.length > 0) {
    const cur = rebelQueue.shift();
    const neighbors = ROAD_ADJ[cur] || [];
    for (const nb of neighbors) {
      if (rebelVisited.has(nb)) continue;
      rebelVisited.add(nb);
      const nbCity = G.cities[nb];
      if (!nbCity) continue;
      if (nbCity.fac === 'rebel') {
        frontier.add(nb);
        rebelQueue.push(nb); // 穿透叛军城继续
      }
    }
  }

  return frontier;
}

// ════════════════════════════════════════════════════════════════════
// ── M_LET _unitIdCounter (v181 L2344) ──
// ════════════════════════════════════════════════════════════════════

let _unitIdCounter=1;

// ════════════════════════════════════════════════════════════════════
// ── MIL3.b AI 决策主段 24 funcs + AI const (v181 L4440-L6714) ──
// ════════════════════════════════════════════════════════════════════

function aiGetAvailableGens(fid){
  const deployed = new Set();
  G.units.filter(u=>u.fac===fid).forEach(u=>{
    u.squads.forEach(sq=>deployed.add(sq.genName));
  });
  // 查G.generals（运行时副本）而非静态GENS_FULL，确保下野武将不被重新征召
  return (G.generals[fid]||[]).filter(g=>!deployed.has(g.name));
}

/**
 * 寻找最近的敌方城市（按道路距离）
 * fromId: 出发节点ID
 * enemyFac: 敌方势力（null = 所有敌对势力）
 * selfFac: 己方势力
 */

/**
 * AI 征兵：每隔 AI_RECRUIT_INTERVAL 旬，在有闲置将领的城市征兵
 * 条件：金钱充足、存粮充足、该城本旬未征兵
 */
// ─── AI 征兵参数 ───────────────────────────────────────────
const AI_RECRUIT_TROOPS_BASE = 5000; // 主将分队基准兵力（v87: 4000→5000 匹配万人编制）
/**
 * AI 征兵决策（v87 Phase 3 重写：预算驱动）
 * 逻辑：
 *   1. 统计"闲置将领数"（未编入任何部队）
 *   2. 若无闲置将领，直接跳过
 *   3. 金钱约束：从军事预算（_aiBudget.military）扣除
 *   4. 每支新部队：选 com 最高闲置将为主将 + 最多2副将
 *   5. 资源检查（金+城内存粮），不足则推迟
 *   6. 绝对上限 MAX_FIELD_UNITS_ABS = 20，防止极端情况无限扩军
 */
const MAX_FIELD_UNITS_ABS = 20;   // 绝对上限（宽松，仅兜底）
const GAR_SALARY_RATE = 0.001;    // Q1: 城防garrison军饷费率（固定，不随野战状态变化）
const MIN_SALARY_BUFFER   = 2;    // 保底储备：至少维持全军 N 旬军饷（v87: 6→2，预算系统已接管）

/**
 * AI 裁军决策（v47重写：纯经济驱动，不设兵民比硬线）
 *
 * 触发条件：连续欠饷 ≥ DISBAND_DEBT_TURNS 旬
 * 裁军逻辑：每次解散兵力最少的部队，直到预估军饷能被当前金钱存量支撑
 * 设计意图：没钱才裁军，有钱随便养——经济是唯一约束
 */
// ═══════════════════════════════════════
// G2 AI 战略决策系统（Phase 1：进攻集结 + 战力评估）
// ═══════════════════════════════════════

/** 人格参数接口（Phase 1统一值，B4人格化时按势力调参） */
// ★ B4: 君主人格化 — 三家AI行为差异化
const AI_PERSONALITY = {
  wei: { atkThreshold: 0.50, siegeThreshold: 0.50, diploAggro: 0.65, deployBias: +0.15, budgetBias: +0.10 }, // ★ v133: 0.8→0.65 缓解魏国过度好战
  shu: { atkThreshold: 0.55, siegeThreshold: 0.60, diploAggro: 0.3, deployBias:  0.00, budgetBias: -0.05 },
  wu:  { atkThreshold: 0.50, siegeThreshold: 0.55, diploAggro: 0.5, deployBias: -0.10, budgetBias:  0.00 },
  nanman:{ atkThreshold: 0.60, siegeThreshold: 0.65, diploAggro: 0.4, deployBias: -0.10, budgetBias: -0.10 }, // ★ v146: 南蛮偏保守
};

// ═══════════════════════════════════════
// GT1: 威胁矩阵 + 分兵逻辑
// ═══════════════════════════════════════

/**
 * GT1: 取得 myFac 面向 enemyFac 的前线城市列表（ROADS邻接定义）
 * 前线城 = 我方城市中，ROADS邻居里有至少一座属于 enemyFac 的城市
 */
function _aiFrontlineCitiesAgainst(myFac, enemyFac) {
  const result = [];
  Object.values(G.cities).forEach(c => {
    if (c.fac !== myFac) return;
    const neighbors = ROAD_ADJ[c.id] || [];
    if (neighbors.some(nb => G.cities[nb]?.fac === enemyFac)) result.push(c);
  });
  return result;
}

/**
 * GT1: 计算 fid 对 enemyFid 的威胁分
 * threat = intent × capability × vulnerability
 */
function _aiCalcThreat(fid, enemyFid) {
  if (fid === enemyFid) return 0;
  const diplo = getDiploStatus(fid, enemyFid);

  // ── 因子1: 攻击意图 (intent, 0~1) ──
  let intent;
  if (diplo === 'enemy') intent = 0.9;
  else if (diplo === 'neutral') intent = 0.5;
  else if (diplo === 'truce') {
    // 部署异常度（停战时观察对方边境集结）
    const anomaly = _aiDeployAnomaly(fid, enemyFid);
    intent = 0.15 * (1 + anomaly);
  } else if (diplo === 'ally') {
    const anomaly = _aiDeployAnomaly(fid, enemyFid);
    intent = 0.05 * (1 + anomaly);
  } else {
    intent = 0.5; // vassal等fallback
  }

  // ── 因子2: 攻击能力 (capability, 0~∞) ──
  const fog = G.fog?.[fid];
  let knownThreat = 0;
  G.units.forEach(u => {
    if (u.fac !== enemyFid) return;
    if (fog) {
      const k = hkey(u.hq ?? 0, u.hr ?? 0);
      if ((fog[k] ?? 0) < FOG_VISIBLE) return; // ★ v149fix: 常量替代魔法数字
    }
    knownThreat += getUnitTroops(u);
  });
  const enemyCityCount = Object.values(G.cities).filter(c => c.fac === enemyFid).length;
  const estimatedTotal = enemyCityCount * 8000; // 平均每城8000产兵估值
  const unknownThreat = Math.max(0, estimatedTotal - knownThreat) * 0.5;
  const capability = (knownThreat + unknownThreat) / 10000;

  // ── 因子3: 我方脆弱度 (vulnerability, 0~3) ──
  const frontline = _aiFrontlineCitiesAgainst(fid, enemyFid);
  if (!frontline.length) return 0; // 不接壤，无威胁
  let deficitSum = 0;
  frontline.forEach(city => {
    const cdef = CITY_MAP[city.id];
    if (!cdef) return;
    // 我方该城及周边2格野战兵力
    const myTroops = G.units.filter(u =>
      u.fac === fid && getUnitTroops(u) > 0 &&
      hexDist(u.hq ?? 0, u.hr ?? 0, cdef.q, cdef.r) <= 2
    ).reduce((s, u) => s + getUnitTroops(u), 0) + (city.garrison || 0);
    // 敌方对应边境野战兵力（ROADS邻接敌城周边2格，去重）
    let enemyBorderTroops = 0;
    const countedUnits = new Set();
    (ROAD_ADJ[city.id] || []).forEach(nb => {
      const nbCity = G.cities[nb];
      if (!nbCity || nbCity.fac !== enemyFid) return;
      const nbDef = CITY_MAP[nb];
      if (!nbDef) return;
      G.units.forEach(u => {
        if (u.fac !== enemyFid || countedUnits.has(u.id) || getUnitTroops(u) <= 0) return;
        if (hexDist(u.hq ?? 0, u.hr ?? 0, nbDef.q, nbDef.r) <= 2) {
          countedUnits.add(u.id);
          enemyBorderTroops += getUnitTroops(u);
        }
      });
    });
    const coverage = enemyBorderTroops > 0 ? myTroops / enemyBorderTroops : 2;
    deficitSum += Math.max(0, 1 - coverage);
  });
  const avgDeficit = deficitSum / frontline.length;
  const vulnerability = Math.min(3, avgDeficit * (1 + deficitSum * 0.3));

  // ★ v132 F2: 远交近攻威胁注入
  const _threatInjection = G._threatBonus?.[fid]?.[enemyFid] || 0;
  return intent * capability * vulnerability + _threatInjection;
}

/**
 * GT1: 部署异常度——对方面向我边境2格内野战兵力占其总野战兵力的比例
 */
function _aiDeployAnomaly(fid, enemyFid) {
  const frontline = _aiFrontlineCitiesAgainst(fid, enemyFid);
  if (!frontline.length) return 0;
  // 敌方总野战兵力
  const totalEnemy = G.units.filter(u => u.fac === enemyFid && getUnitTroops(u) > 0)
    .reduce((s, u) => s + getUnitTroops(u), 0);
  if (totalEnemy <= 0) return 0;
  // 敌方面向我边境2格内的兵力
  const borderSet = new Set();
  let borderTroops = 0;
  frontline.forEach(city => {
    const cdef = CITY_MAP[city.id];
    if (!cdef) return;
    G.units.forEach(u => {
      if (u.fac !== enemyFid || borderSet.has(u.id) || getUnitTroops(u) <= 0) return;
      if (hexDist(u.hq ?? 0, u.hr ?? 0, cdef.q, cdef.r) <= 3) {
        borderSet.add(u.id);
        borderTroops += getUnitTroops(u);
      }
    });
  });
  const borderRatio = borderTroops / totalEnemy;
  return Math.max(0, borderRatio - 0.3) * 3;
}

/**
 * GT1: 获取fid的完整威胁矩阵（带缓存，每3旬刷新 + 事件驱动刷新）
 * 返回 { threats: {enemyFid: score}, highestThreat, secondThreat, maxDeployRatio }
 */
function _aiGetThreatMatrix(fid) {
  const fac = G.factions[fid];
  if (!fac) return { threats: {}, highestThreat: 0, secondThreat: 0, maxDeployRatio: 1.0 };
  // 外交状态哈希（自愈机制：即使漏了invalidate也能检测到变化）
  const diploHash = ALL_FACS.filter(f=>f!==fid)
    .map(f=>getDiploStatus(fid,f)).join(',');
  // 缓存检查（每3旬 或 被标脏 或 外交变化）
  if (fac._aiThreatCache && !fac._aiThreatDirty &&
      fac._aiThreatCache.diploHash === diploHash &&
      G.turn - fac._aiThreatCache.turn < 3) {
    return fac._aiThreatCache.data;
  }
  const threats = {};
  const allFacs = ALL_FACS.filter(f => f !== fid); // ★ v146: 硬编码→ALL_FACS，含南蛮
  allFacs.forEach(ef => {
    threats[ef] = _aiCalcThreat(fid, ef);
  });
  const sorted = Object.values(threats).sort((a, b) => b - a);
  const highestThreat = sorted[0] || 0;
  const secondThreat = sorted[1] || 0;
  // 出兵上限：威胁越高越保守（★ v146: floor 0.20→0.25，确保最低留25%后备；A+C负责回防）
  const baseDeployRatio = 0.90 - (highestThreat / (highestThreat + 5)) * 0.5;
  // ★ B4: 人格偏移（曹操敢集中兵力，孙权更保守留守）
  const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
  const maxDeployRatio = Math.max(0.25, Math.min(0.90, baseDeployRatio + (personality.deployBias || 0)));
  const data = { threats, highestThreat, secondThreat, maxDeployRatio };
  fac._aiThreatCache = { data, turn: G.turn, diploHash };
  fac._aiThreatDirty = false;
  return data;
}

/** GT1: 标脏所有势力的威胁缓存（外交变化/丢城时调用） */
function _aiInvalidateThreatCache() {
  ALL_FACS.forEach(fid => { // ★ v146: 硬编码→ALL_FACS
    const fac = G.factions[fid];
    if (fac) fac._aiThreatDirty = true;
  });
}

/**
 * G2: 目标城市打分（前线城已由aiFrontierEnemyCities过滤，不需距离因子）
 * score = 价值分 × 防守弱度
 */
function _aiScoreTarget(fid, city) {
  const cdef = CITY_MAP[city.id];
  if (!cdef) return 0;

  // 价值分：人口/10000 + 都市/港口/雄关加分
  let valuePts = (city.pop || 100000) / 50000; // v107: pop×5, 基准×5
  const tags = cdef.tags || [];
  if (tags.includes('都市')) valuePts += 3;
  if (tags.includes('港口')) valuePts += 2;
  if (tags.includes('雄关')) valuePts += 2;
  if (tags.includes('产马')) valuePts += 1;
  if (city.isCapital) valuePts += 2;

  // ★ v116: 有特色兵种的城市额外加分
  const _hasElite = Object.values(TROOP_TYPES).some(td => td.elite && td.homeCity === city.id);
  if (_hasElite) valuePts *= 1.30;

  // 防守弱度：估算守方总兵力（城防+驻军部队）
  const garTroops = city.garrison || 0;
  const defUnits = G.units.filter(u => u.fac === city.fac && getUnitNodeId(u) === city.id);
  const defTroops = garTroops + defUnits.reduce((s, u) => s + getUnitTroops(u), 0);
  const weakPts = 1 / (1 + defTroops / 5000); // 守方5000兵 → 0.5

  return valuePts * weakPts;
}

/**
 * G2: 估算进攻某城的胜率
 * 考虑：攻方部队 vs 守方部队+城防驻军
 * 城防驻军（city.garrison）不可移动，但攻城时会还击（与resolveSiegeBattle一致）
 */
function _aiEstimateSiegeWinRate(attackers, cityId, projectedDecay) {
  const city = G.cities[cityId];
  if (!city) return 0;
  const defUnits = G.units.filter(u => u.fac === city.fac && getUnitNodeId(u) === city.id);
  // v110: projectedDecay参数——传1.0表示"围城完成后"的预期胜率
  const defMult = (projectedDecay !== undefined && projectedDecay !== null)
    ? _getSiegeDefMultWithDecay(city, projectedDecay)
    : getSiegeDefMult(city);
  // 攻方ATK
  const atkATK = attackers.reduce((s, u) => s + calcUnitATK(u, defUnits), 0);
  // 守方DEF：野战部队 + 城防驻军（含城墙加成）
  const defFieldDEF = defUnits.reduce((s, u) => s + calcUnitDEF(u), 0);
  const garrisonTroops = city.garrison || 0;
  const defGarrisonDEF = garrisonTroops * (TYPE_DEF?.heavy || 3.2) * defMult;
  const defDEFTotal = defFieldDEF + defGarrisonDEF;
  // 守方ATK：野战部队 + 城防驻军还击（与resolveSiegeBattle虚拟unit对齐）
  const defFieldATK = defUnits.reduce((s, u) => s + calcUnitATK(u, attackers), 0);
  const defGarrisonATK = garrisonTroops * (TYPE_ATK?.heavy || 2.6) * 0.5; // 驻军攻击力打折（非正规野战部队）
  const defATKTotal = defFieldATK + defGarrisonATK;
  const atkDEF = attackers.reduce((s, u) => s + calcUnitDEF(u), 0);
  const rollA = atkATK / Math.max(1, defDEFTotal);
  const rollB = defATKTotal / Math.max(1, atkDEF);
  if (rollA + rollB <= 0) return 0.5;
  return rollA / (rollA + rollB);
}

/** v97: 模糊版攻城胜率（AI侧），逻辑同fuzzyEstimateWinRate */
function _aiFuzzySiegeWinRate(attackers, cityId, fid) {
  const trueWR = _aiEstimateSiegeWinRate(attackers, cityId);
  let maxInt = 0;
  attackers.forEach(u => (u.squads || []).forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if (g && g.int > maxInt) maxInt = g.int;
  }));
  const margin = maxInt >= 90 ? 0.10 : maxInt >= 75 ? 0.20 : maxInt >= 60 ? 0.30 : 0.40;
  const noise = (Math.random() * 2 - 1) * margin;
  return Math.max(0, Math.min(1, trueWR + noise));
}

/**
 * G2: 判断是否需要重新review目标
 * 事件驱动：目标城已攻下/外交变化/部队全灭
 */
function _aiShouldReview(fid) {
  const fac = G.factions[fid];
  if (!fac) return true;
  const plan = fac._aiPlan;
  if (!plan || !plan.targets || !plan.targets.length) return true;

  // v111: "和平太久"检测——如果连续12旬没有任何attack部队，强制清冷却+review
  const hasAttack = G.units.some(u => u.fac === fid && u._aiRole === 'attack');
  if(!hasAttack) {
    if(!fac._aiIdleSince) fac._aiIdleSince = G.turn;
    if(G.turn - fac._aiIdleSince >= 12) {
      // 清除所有冷却
      fac._aiTargetCooldowns = {};
      G.units.filter(u => u.fac === fid).forEach(u => {
        delete u._aiCooldownTarget;
        delete u._aiCooldownUntil;
      });
      delete fac._aiIdleSince;
      return true; // 强制review
    }
  } else {
    delete fac._aiIdleSince;
  }

  for (const tgt of plan.targets) {
    const city = G.cities[tgt.cityId];
    // 目标城已被己方攻下
    if (!city || city.fac === fid) return true;
    // 外交变化：不再敌对
    if (!isHostile(fid, city.fac)) return true;
    // 分配的部队全灭
    const alive = tgt.assignedUnits.filter(uid => G.units.some(u => u.id === uid && getUnitTroops(u) > 0));
    if (alive.length === 0 && tgt.assignedUnits.length > 0) return true;
  }

  // 有未分配目标的可用部队（新征兵、打完仗回来的）→ 也需要重新规划
  const assignedIds = new Set(plan.targets.flatMap(t => t.assignedUnits));
  const hasUnassigned = G.units.some(u =>
    u.fac === fid &&
    (u.status === 'garrison' || u.status === 'halt') &&
    (u.mobilizingTurns || 0) <= 0 &&
    isAiMusterReady(u) && // ★ v114
    !assignedIds.has(u.id) &&
    u._aiRole !== 'garrison' &&
    u._aiRole !== 'defend'   // G2P2: 回防部队不算未分配
  );
  if (hasUnassigned) return true;

  return false;
}

// ═══════════════════════════════════════════════════════
// G2 Phase 2: AI 防守响应
// ═══════════════════════════════════════════════════════

/**
 * ★ AI伏击/扎营：防守姿态决策
 * 防守部队到达目标城附近后，根据战力对比选择最优姿态：
 *   halt（正面能打）→ ambush（伏击打得过）→ camp（都不行，扎营等援）
 */
function _aiChooseDefensePosture(unit, fid, threatEnemies) {
  if (!threatEnemies || !threatEnemies.length) return 'garrison';
  const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
  const threshold = personality.atkThreshold || 0.50;

  // ── 1. 野战胜率评估 ──
  // v110: 友军范围统一为4格，与鹰鸽判断一致
  const nearbyAllies = G.units.filter(au =>
    au.fac === fid && au.id !== unit.id && getUnitTroops(au) > 0 &&
    au.status !== 'ambush' && au.status !== 'siege' &&
    hexDist(au.hq??0, au.hr??0, unit.hq??0, unit.hr??0) <= 4
  );
  const defenders = [unit, ...nearbyAllies];
  const fieldWR = fuzzyEstimateWinRate(defenders, threatEnemies, fid);
  if (fieldWR >= threshold) return 'halt'; // 正面能打

  // ── 2. 伏击评估 ──
  const ambushHex = _aiFindAmbushHex(unit, threatEnemies[0], unit._aiTarget, fid);
  if (ambushHex) {
    const terrain = ambushHex.terrain;
    // 计算中伏概率（与resolveAmbush公式一致）
    const mainGenName = unit.squads[0]?.genName;
    const myInt = GEN_MAP[mainGenName]?.int || 60;
    const enemyMainName = threatEnemies[0]?.squads[0]?.genName;
    const enemyInt = GEN_MAP[enemyMainName]?.int || 60;
    const baseChance = AMBUSH_BASE_CHANCE[terrain] || 0.15;
    const capHigh = (terrain==='plain'||terrain==='road') ? 0.45 : (terrain==='water') ? 0.20 : 0.90;
    const capLow  = (terrain==='plain'||terrain==='road') ? 0.05 : (terrain==='water') ? 0.02 : 0.10;
    let ambushChance = Math.min(capHigh, Math.max(capLow, baseChance + (myInt - enemyInt) * 0.008));
    // SKILL_INLINE: shensuan_ai_defense — 诸葛亮神算：AI防守伏击决策中伏率±10%
    if (hasFacGen(fid, '诸葛亮') && genHasOffice('诸葛亮', fid)) ambushChance = Math.min(capHigh, ambushChance + 0.10);
    const enemyFid = threatEnemies[0]?.fac;
    if (enemyFid && hasFacGen(enemyFid, '诸葛亮') && genHasOffice('诸葛亮', enemyFid)) ambushChance = Math.max(capLow, ambushChance - 0.10);

    // 伏击胜率估算：模拟中伏后敌方ATK/DEF×0.65（cpMult惩罚）
    // 不能直接用fieldWR×1.35，因为fieldWR=0时结果永远是0
    // 用ATK/DEF比值直接估算
    const ter = getTerrainAt(unit.hq??0, unit.hr??0) || 'plain';
    const myATK = calcUnitATK(unit, threatEnemies, ter);
    const myDEF = calcUnitDEF(unit, ter);
    const enemyATK_raw = threatEnemies.reduce((s,u)=>s+calcUnitATK(u,[unit],ter),0);
    const enemyDEF_raw = threatEnemies.reduce((s,u)=>s+calcUnitDEF(u,ter),0);
    // 中伏惩罚：敌方ATK/DEF × 0.65
    const cpMult = 0.65;
    const enemyATK = enemyATK_raw * cpMult;
    const enemyDEF = enemyDEF_raw * cpMult;
    const rollBase_me = myATK / Math.max(1, enemyDEF);
    const rollBase_en = enemyATK / Math.max(1, myDEF);
    // 蒙特卡洛估算（简化版，30次）
    let ambushWins = 0;
    for(let _s=0; _s<30; _s++){
      const rMe = rollBase_me * (0.50 + Math.random());
      const rEn = rollBase_en * (0.50 + Math.random());
      if(rMe >= rEn) ambushWins++;
    }
    const ambushWR = ambushWins / 30;
    const expectedPayoff = ambushChance * ambushWR;

    if (ambushChance >= 0.35 && expectedPayoff >= 0.40) {
      return { type: 'ambush', hex: ambushHex };
    }
  }

  // ── 3. 扎营 ──
  const fac = G.factions[fid];
  if (fac && (fac.res.gold || 0) >= CAMP_COST.gold && (fac.res.wood || 0) >= CAMP_COST.wood) {
    return 'camp';
  }

  // 资源不足扎营，只能halt硬扛
  return 'halt';
}

/**
 * ★ AI伏击选点：沿敌方→目标城路径找最佳伏击地形
 * 优先forest > hill，距离≤8hex（约2旬行军），排除有友军/敌城的hex
 */
function _aiFindAmbushHex(unit, enemyUnit, targetCityId, fid) {
  if (!enemyUnit || !targetCityId) return null;
  const targetCdef = CITY_MAP[targetCityId];
  if (!targetCdef) return null;

  const eCol = enemyUnit.hq ?? 0, eRow = enemyUnit.hr ?? 0;
  const tCol = targetCdef.q, tRow = targetCdef.r;

  // 沿敌方→城市路径找hex（用A*）
  const pathResult = hexAstar(eCol, eRow, tCol, tRow, 'light', null);
  if (!pathResult || pathResult.path.length < 2) return null;

  // 搜索路径上前8个hex（约2旬行军距离）
  const searchPath = pathResult.path.slice(1, Math.min(9, pathResult.path.length));
  let bestHex = null;
  let bestScore = -1;

  const terrainScores = { forest: 3, hill: 2, mountain: 1 }; // mountain中伏率高但行军难

  for (const {col, row} of searchPath) {
    const terrain = getTerrainAt(col, row);
    const score = terrainScores[terrain] || 0;
    if (score <= 0) continue; // plain/water等不适合伏击

    // 排除：有其他己方部队占据
    const occupied = G.units.some(u =>
      u.id !== unit.id && u.fac === fid &&
      (u.hq??0) === col && (u.hr??0) === row
    );
    if (occupied) continue;

    // 排除：敌方城市hex
    const k = hkey(col, row);
    const cityAtHex = HEX_CITY?.[k];
    if (cityAtHex && G.cities[cityAtHex]?.fac !== fid) continue;

    if (score > bestScore) {
      bestScore = score;
      bestHex = { col, row, terrain };
    }
  }

  return bestHex;
}

/**
 * G2P2: AI防守响应——检测视野内接近己方城市的敌军，调兵回防
 * 在aiSelectTargets之前执行，确保防守优先于进攻规划
 *
 * 设计要点：
 * - 只响应FOG_VISIBLE区域内的敌方部队（explored是旧情报，不触发）
 * - 威胁消失后（敌军撤退/被消灭），defend部队自动恢复idle
 * - 只有紧急情况才召回正在进攻的部队
 */
function aiDefendResponse(fid) {
  const fac = G.factions[fid];
  if (!fac) return;
  const aiFog = G.fog?.[fid];

  // ── Step 0: 清理过期的defend任务 ──
  // 如果defend目标城已丢失、或目标城领土范围内威胁已消失 → 恢复idle
  const territory0 = _buildTerritoryMap(); // ★ v146: 领土检测
  G.units.filter(u => u.fac === fid && u._aiRole === 'defend').forEach(unit => {
    const targetId = unit._aiTarget;
    const targetCity = G.cities[targetId];
    // 城丢了 → idle
    if (!targetCity || targetCity.fac !== fid) {
      unit._aiRole = 'idle';
      unit._aiTarget = null;
      return;
    }
    // 检查目标城领土内是否还有威胁（★ v146: 领土范围替代6hex固定圈）
    const cdef = CITY_MAP[targetId];
    if (!cdef) { unit._aiRole = 'idle'; unit._aiTarget = null; return; }
    const threatNearby = G.units.some(eu => {
      if(eu.fac === fid || !isHostile(fid, eu.fac) || getUnitTroops(eu) <= 0) return false;
      if(!_aiIsVisibleToFac(eu, fid, aiFog)) return false;
      const ek = hkey(eu.hq ?? 0, eu.hr ?? 0);
      const terr = territory0[ek];
      return terr && terr.fac === fid && terr.cityId === targetId;
    });
    if (!threatNearby) {
      // 威胁消失，恢复idle
      unit._aiRole = 'idle';
      unit._aiTarget = null;
      delete unit._aiAmbushTarget;
      // 如果在行军中，停下来
      if (unit.status === 'march' && unit.hexPath?.length) {
        unit.status = 'halt';
        unit.hexPath = [];
        unit.movePath = [];
      }
      // ★ AI伏击/扎营：威胁消失，解除特殊状态
      if (unit.status === 'ambush') {
        unit.status = 'halt';
      }
      if (unit.status === 'camp') {
        unit.campMobilizeTurns = CAMP_MOBILIZE_TURNS; // 拔营需要时间
        unit.status = 'camp'; // 保持camp直到拔营完成（由processUnitMovement处理）
      }
    }
  });

  // ── Step 1: 扫描领土内入侵的敌军，按最近城市聚合威胁 ──
  // ★ v146: 使用_buildTerritoryMap领土归属——踏入己方领土即触发防守
  const territory = _buildTerritoryMap();
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const threats = []; // { cityId, cityDef, enemyUnits[], enemyTroops, minDist, urgency }

  // 收集所有在己方领土内且可见的敌军，按归属城市分组
  const intrudersByCity = {}; // cityId → [{unit, dist}]
  G.units.forEach(eu => {
    if(eu.fac === fid || !isHostile(fid, eu.fac) || getUnitTroops(eu) <= 0) return;
    if(!_aiIsVisibleToFac(eu, fid, aiFog)) return;
    const ek = hkey(eu.hq ?? 0, eu.hr ?? 0);
    const terr = territory[ek];
    if(!terr || terr.fac !== fid) return; // 不在己方领土内
    const cityId = terr.cityId;
    const cdef = CITY_MAP[cityId];
    if(!cdef) return;
    const dist = hexDist(eu.hq ?? 0, eu.hr ?? 0, cdef.q, cdef.r);
    if(!intrudersByCity[cityId]) intrudersByCity[cityId] = [];
    intrudersByCity[cityId].push({ unit: eu, dist });
  });

  // 对每个受威胁城市生成threat条目
  Object.entries(intrudersByCity).forEach(([cityId, enemies]) => {
    const city = G.cities[cityId];
    if(!city || city.fac !== fid) return;
    const cdef = CITY_MAP[cityId];
    if(!cdef) return;

    enemies.sort((a, b) => a.dist - b.dist);
    const enemyTroops = enemies.reduce((s, e) => s + getUnitTroops(e.unit), 0);
    const minDist = enemies[0].dist;

    // 计算城内/城旁己方守军
    const defenders = G.units.filter(u =>
      u.fac === fid &&
      getUnitTroops(u) > 0 &&
      hexDist(u.hq ?? 0, u.hr ?? 0, cdef.q, cdef.r) <= 1
    );

    // 守军已足够 → 胜率≥0.6 → 不需增援
    if (defenders.length > 0) {
      const enemyForEval = enemies.map(e => e.unit);
      const winRate = fuzzyEstimateWinRate(defenders, enemyForEval, fid);
      if (winRate >= 0.60) return; // 守得住

      // ★ AI伏击/扎营：守不住，让城旁现有守军选姿态
      defenders.forEach(dUnit => {
        // 跳过：已在特殊状态 / 正在行军 / 已是defend角色（避免重复评估）
        if (dUnit.status === 'ambush' || dUnit.status === 'camp' || dUnit.status === 'siege') return;
        if (dUnit.status === 'march') return;
        if (dUnit._aiPostureEvalTurn === G.turn) return; // 本旬已评估过
        dUnit._aiPostureEvalTurn = G.turn;

        const posture = _aiChooseDefensePosture(dUnit, fid, enemyForEval);
        const gname = dUnit.squads[0]?.genName || '?';

        if (posture && posture.type === 'ambush') {
          const ah = posture.hex;
          const curDist = hexDist(dUnit.hq??0, dUnit.hr??0, ah.col, ah.row);
          if (curDist <= 1) {
            dUnit.hq = ah.col; dUnit.hr = ah.row;
            dUnit.status = 'ambush';
            dUnit.hexPath = []; dUnit.movePath = [];
            log(`🌿 [AI-${fid}] ${gname}部 出城设伏于${ah.terrain==='forest'?'林地':'丘陵'}（防守${city.name}）`, 'battle');
          } else {
            const hexResult = hexAstar(dUnit.hq??0, dUnit.hr??0, ah.col, ah.row, 'light', fid);
            if (hexResult && hexResult.path.length > 1) {
              dUnit.hexPath = hexResult.path.slice(1);
              dUnit.movePath = []; dUnit.status = 'march';
              dUnit._aiAmbushTarget = { col: ah.col, row: ah.row };
              dUnit._aiRole = 'defend'; dUnit._aiTarget = city.id;
              log(`🌿 [AI-${fid}] ${gname}部 前往伏击点（防守${city.name}）`, 'battle');
            }
          }
        } else if (posture === 'camp' && dUnit.status !== 'garrison') {
          // garrison在城内不扎营（城防已有加成），只有城外halt的才扎营
          const facR = G.factions[fid];
          if (facR && (facR.res.gold||0) >= CAMP_COST.gold && (facR.res.wood||0) >= CAMP_COST.wood) {
            safeSub(facR.res, 'gold', CAMP_COST.gold);
            safeSub(facR.res, 'wood', CAMP_COST.wood);
            dUnit.status = 'camp';
            dUnit.campMobilizeTurns = 0;
            dUnit.hexPath = []; dUnit.movePath = [];
            log(`🏕 [AI-${fid}] ${gname}部 于${city.name}旁立寨扎营`, 'battle');
          }
        }
        // halt: 保持当前状态不动
      });
    }

    // 紧急度 = 敌方兵力 / (距离+1) × 城市价值因子
    const cityVal = (city.pop || 50000) / 50000; // 归一化 (v107: pop×5, 基准×5)
    const urgency = (enemyTroops / (minDist + 1)) * Math.max(0.5, cityVal);

    threats.push({
      cityId: city.id,
      cdef,
      enemyUnits: enemies.map(e => e.unit),
      enemyTroops,
      minDist,
      urgency,
      currentDefenders: defenders,
    });
  });

  if (!threats.length) return;

  // 按紧急度降序
  threats.sort((a, b) => b.urgency - a.urgency);

  // ── Step 2: 对每个受威胁城市调兵 ──
  const assignedToDefend = new Set(
    G.units.filter(u => u.fac === fid && u._aiRole === 'defend').map(u => u.id)
  );

  for (const threat of threats) {
    // 已在回防的部队算入守方
    const incomingDefenders = G.units.filter(u =>
      u.fac === fid &&
      u._aiRole === 'defend' &&
      u._aiTarget === threat.cityId &&
      getUnitTroops(u) > 0
    );
    const allDefenders = [...threat.currentDefenders, ...incomingDefenders];

    // 重新评估：加上已在路上的援军够不够
    if (allDefenders.length > 0) {
      const winRate = fuzzyEstimateWinRate(allDefenders, threat.enemyUnits, fid);
      if (winRate >= 0.55) continue; // 加上援军够了
    }

    // 需要更多部队 — 收集可调部队
    const candidates = G.units.filter(u =>
      u.fac === fid &&
      getUnitTroops(u) > 0 &&
      !assignedToDefend.has(u.id) &&
      (u.mobilizingTurns || 0) <= 0 &&
      isAiMusterReady(u) && // ★ v114
      u.status !== 'siege' &&       // 围城中不调
      u.status !== 'ambush' &&      // 伏击中不调
      // 不在该城的现有守军（已算过了）
      !threat.currentDefenders.some(d => d.id === u.id)
    ).map(u => ({
      unit: u,
      dist: hexDist(u.hq ?? 0, u.hr ?? 0, threat.cdef.q, threat.cdef.r),
      isAttacking: u._aiRole === 'attack',
    })).sort((a, b) => {
      // 非进攻部队优先，同类按距离排序
      if (a.isAttacking !== b.isAttacking) return a.isAttacking ? 1 : -1;
      return a.dist - b.dist;
    });

    // 逐步分配直到预估胜率够
    const reinforcements = [];
    for (const cand of candidates) {
      // 进攻部队：领土受入侵时更积极召回（★ v146: 3hex→5hex, WR 0.30→0.50）
      if (cand.isAttacking) {
        const isUrgent = threat.minDist <= 5;
        if (!isUrgent) continue;
        const currentWR = allDefenders.length > 0
          ? fuzzyEstimateWinRate([...allDefenders, ...reinforcements.map(r => r.unit)], threat.enemyUnits, fid)
          : 0;
        if (currentWR >= 0.50) continue; // 守方胜率尚可，不急于召回
      }

      // 太远的不调（★ v146: 15hex→20hex，配合领土检测扩大响应范围）
      if (cand.dist > 20) continue;

      reinforcements.push(cand);
      assignedToDefend.add(cand.unit.id);

      // 检查是否够了
      const testDef = [...allDefenders, ...reinforcements.map(r => r.unit)];
      const testWR = fuzzyEstimateWinRate(testDef, threat.enemyUnits, fid);
      if (testWR >= 0.55) break;

      // 最多调4支部队回防一座城
      if (reinforcements.length >= 4) break;
    }

    // ── Step 3: 给调回的部队分配defend任务 ──
    reinforcements.forEach(r => {
      const unit = r.unit;
      // 如果正在进攻，清除进攻任务
      if (unit._aiRole === 'attack') {
        // 从aiPlan中移除
        const plan = fac._aiPlan;
        if (plan?.targets) {
          plan.targets.forEach(tgt => {
            tgt.assignedUnits = tgt.assignedUnits.filter(uid => uid !== unit.id);
          });
        }
      }
      unit._aiRole = 'defend';
      unit._aiTarget = threat.cityId;

      const gname = unit.squads[0]?.genName || '?';
      log(`🛡 [AI-${fid}] ${gname}部 回防${G.cities[threat.cityId]?.name || threat.cityId}`, 'battle');
    });
  }
}

/**
 * G2P2: 判断敌方部队是否在己方视野内（FOG_VISIBLE）
 */
function _aiIsVisibleToFac(enemyUnit, fid, fog) {
  if (!fog) return true; // 无迷雾系统=全可见
  const k = hkey(enemyUnit.hq ?? 0, enemyUnit.hr ?? 0);
  return fog[k] === FOG_VISIBLE;
}

/**
 * G2: 势力级目标选择+部队分配（替代旧aiDoMove的核心逻辑）
 */
function aiSelectTargets(fid) {
  const fac = G.factions[fid];
  if (!fac) return;

  // 初始化plan
  if (!fac._aiPlan) fac._aiPlan = { targets: [], lastReviewTurn: 0 };

  // 事件驱动检查
  if (!_aiShouldReview(fid)) return;

  // ── 清空旧计划 ──
  fac._aiPlan.targets = [];
  fac._aiPlan.lastReviewTurn = G.turn;

  // ── 收集可用部队（闲置 + 非作战状态） ──
  // 包括_aiRole为null/idle/garrison的（重新评估全部可用部队）
  // ★ v102: 排除正在前线交战区的attack部队（4格内有可见敌军），保留其当前任务
  const fog = G.fog?.[fid];
  const availableUnits = G.units.filter(u => {
    if (u.fac !== fid) return false;
    if (u.status !== 'garrison' && u.status !== 'halt') return false;
    if ((u.mobilizingTurns || 0) > 0) return false;
    if (!isAiMusterReady(u)) return false; // ★ v114: 集结未满80%不出发
    if (u._aiRole === 'defend') return false;  // G2P2: 回防部队不参与进攻分配
    // ★ v102: 前线交战中的attack部队不参与重分配
    if (u._aiRole === 'attack' && u._aiTarget && u.status === 'halt') {
      const hasNearbyEnemy = G.units.some(eu => {
        if (eu.fac === fid || !isHostile(fid, eu.fac) || getUnitTroops(eu) <= 0) return false;
        if (fog) {
          const ek = hkey(eu.hq ?? 0, eu.hr ?? 0);
          if ((fog[ek] ?? 0) < 2) return false;
        }
        return hexDist(u.hq ?? 0, u.hr ?? 0, eu.hq ?? 0, eu.hr ?? 0) <= 4;
      });
      if (hasNearbyEnemy) return false; // 前线交战中，保留当前角色
    }
    return true;
  });

  // v111: defend积压释放——如果可用进攻部队太少，强制释放部分defend部队
  // 根因：边境上到处有弱敌→所有部队被分配defend→进攻池为空→势力停滞
  const defendUnits = G.units.filter(u =>
    u.fac === fid && u._aiRole === 'defend' &&
    (u.status === 'garrison' || u.status === 'halt') &&
    getUnitTroops(u) > 0
  );
  if(availableUnits.length < 2 && defendUnits.length >= 3) {
    // 释放defend部队的一半（按兵力降序，强的优先转进攻）
    const toRelease = defendUnits
      .sort((a,b) => getUnitTroops(b) - getUnitTroops(a))
      .slice(0, Math.ceil(defendUnits.length / 2));
    toRelease.forEach(u => {
      u._aiRole = null;
      u._aiTarget = null;
      availableUnits.push(u);
    });
  }
  // 清除旧角色标记（重新分配）
  availableUnits.forEach(u => { u._aiRole = null; u._aiTarget = null; });

  // ── 守备分配：每个前线城至少留1支部队 ──
  // ★ GT1: 前线城改用ROADS邻接定义（统一全系统）
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const frontlineCities = myCities.filter(cityObj => {
    const neighbors = ROAD_ADJ[cityObj.id] || [];
    return neighbors.some(nb => {
      const nbCity = G.cities[nb];
      return nbCity && nbCity.fac !== fid && isHostile(fid, nbCity.fac);
    });
  });

  const garrisonAssigned = new Set();
  // 已有部队驻守的城市
  G.units.filter(u => u.fac === fid && u.status !== 'halt').forEach(u => {
    const loc = getUnitNodeId(u);
    if (loc && G.cities[loc]?.fac === fid) garrisonAssigned.add(loc);
  });

  // 按兵力升序，弱部队优先守备
  const sortedByTroops = [...availableUnits].sort((a, b) => getUnitTroops(a) - getUnitTroops(b));
  const garrisonUnits = new Set();
  for (const unit of sortedByTroops) {
    const loc = getUnitNodeId(unit);
    if (loc && frontlineCities.some(c => c.id === loc) && !garrisonAssigned.has(loc)) {
      garrisonAssigned.add(loc);
      garrisonUnits.add(unit.id);
      unit._aiRole = 'garrison';
      unit._aiTarget = null;
    }
  }

  // ── 进攻部队池 ──
  // ★ GT1: 威胁矩阵驱动出兵上限
  const threatMatrix = _aiGetThreatMatrix(fid);
  const { highestThreat, secondThreat, maxDeployRatio } = threatMatrix;

  // GT1: 两个方向威胁都>3 → 本旬全防守，不进攻
  if (highestThreat > 3 && secondThreat > 3) {
    availableUnits.filter(u => !garrisonUnits.has(u.id)).forEach(u => {
      u._aiRole = 'idle';
      u._aiTarget = null;
    });
    return;
  }

  const allAttackable = availableUnits.filter(u => !garrisonUnits.has(u.id));
  // GT1: 按maxDeployRatio限制进攻部队数量
  const maxAttackCount = Math.max(1, Math.floor(allAttackable.length * maxDeployRatio));
  // 按兵力降序，强部队优先进攻
  allAttackable.sort((a, b) => getUnitTroops(b) - getUnitTroops(a));
  const attackPool = allAttackable.slice(0, maxAttackCount);
  // 超出限额的部队标为idle（留作机动/防守储备）
  allAttackable.slice(maxAttackCount).forEach(u => {
    u._aiRole = 'idle';
    u._aiTarget = null;
  });
  if (!attackPool.length) return;

  // ── C4: 只考虑已探索/可见的敌方城市 ──
  // ── G2: 只攻击前线邻接敌城（BFS沿ROADS，不穿透敌城） ──
  const aiFog = G.fog?.[fid];
  const frontierSet = aiFrontierEnemyCities(fid);
  const enemyCities = [...frontierSet]
    .map(cid => G.cities[cid])
    .filter(c => {
      if (!c) return false;
      // C4: AI只攻击已探索/可见的城市
      if (aiFog) {
        const cdef = CITY_MAP[c.id];
        if (cdef) {
          const fogLv = aiFog[hkey(cdef.q, cdef.r)] ?? 0;
          if (fogLv === 0) return false;
        }
      }
      return true;
    });

  if (!enemyCities.length) {
    // 无敌城：闲置部队回城
    attackPool.forEach(u => {
      u._aiRole = 'idle';
      u._aiTarget = null;
      const loc = getUnitNodeId(u);
      if (loc && G.cities[loc]?.fac !== fid) {
        const nearest = findNearestOwnCityPath(loc, fid);
        if (nearest?.hexPath) {
          u.hexPath = nearest.hexPath.slice(1);
          u.movePath = [nearest.city.id];
          u.status = 'march';
        }
      }
    });
    return;
  }

  // ── 目标打分：价值×防守弱度×部队就近度（有兵在附近的目标优先） ──
  const scored = enemyCities.map(c => {
    const cdef = CITY_MAP[c.id];
    const baseScore = _aiScoreTarget(fid, c);
    // 部队就近度：最近可用部队到目标的hex距离
    if (!cdef || !attackPool.length) return { city: c, score: baseScore };
    const nearestUnitDist = attackPool.reduce((best, u) => {
      const d = hexDist(u.hq ?? 0, u.hr ?? 0, cdef.q, cdef.r);
      return d < best ? d : best;
    }, Infinity);
    const proximityMult = 1 / (1 + nearestUnitDist * 0.06); // dist=10→0.63, dist=20→0.45
    return { city: c, score: baseScore * proximityMult };
  }).sort((a, b) => b.score - a.score);

  // 选最多3个目标 (v111: 2→3，避免魏国20城只打2个方向)
  const maxTargets = Math.min(3, scored.length);
  const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;

  // ── 分配部队到目标 ──
  const usedUnits = new Set();
  for (let ti = 0; ti < maxTargets; ti++) {
    const tgt = scored[ti];
    if (!tgt || tgt.score <= 0) break;

    // v110: 势力级冷却——整个势力短期内不再选此目标
    const facCooldowns = fac._aiTargetCooldowns || {};
    if (facCooldowns[tgt.city.id] && facCooldowns[tgt.city.id] > G.turn) continue;

    const targetCdef = CITY_MAP[tgt.city.id];
    if (!targetCdef) continue;

    // 按离目标距离排序，近的优先
    // v109: 跳过对此目标有冷却的部队（刚放弃的不重新分配）
    const candidates = attackPool
      .filter(u => !usedUnits.has(u.id))
      .filter(u => !(u._aiCooldownTarget === tgt.city.id && (u._aiCooldownUntil||0) > G.turn))
      .map(u => ({
        unit: u,
        dist: hexDist(u.hq ?? 0, u.hr ?? 0, targetCdef.q, targetCdef.r),
      }))
      .sort((a, b) => a.dist - b.dist);

    if (!candidates.length) break;

    // 逐步分配部队直到预估胜率 > 阈值（或用完候选）
    const assigned = [];
    for (const c of candidates) {
      assigned.push(c.unit);
      // 粗略胜率估算（用全部已分配部队 vs 目标城）
      const winRate = _aiFuzzySiegeWinRate(assigned, tgt.city.id, fid);
      if (winRate >= personality.atkThreshold) break;
      // 最多分配5支部队到一个目标
      if (assigned.length >= 5) break;
    }

    // 至少分配1支
    if (!assigned.length) continue;

    const targetEntry = {
      cityId: tgt.city.id,
      score: tgt.score,
      assignedUnits: assigned.map(u => u.id),
      status: 'gathering',
    };
    fac._aiPlan.targets.push(targetEntry);

    assigned.forEach(u => {
      usedUnits.add(u.id);
      u._aiRole = 'attack';
      u._aiTarget = tgt.city.id;
    });
  }

  // 未分配到任何目标的部队标记为idle
  attackPool.filter(u => !usedUnits.has(u.id)).forEach(u => {
    u._aiRole = 'idle';
    u._aiTarget = null;
  });
}

/**
 * G2: 部队执行层——按_aiTarget行军/集结/围城
 * 替代旧aiDoMove
 */
function aiExecuteOrders(fid) {
  const fac = G.factions[fid];
  if (!fac) return;
  const plan = fac._aiPlan;

  // ── 0. v109: 对峙超时9旬→释放部队换目标（v110: 仅halt状态，siege状态不受影响） ──
  G.units.filter(u =>
    u.fac === fid && u._aiRole === 'attack' && u.status === 'halt' && u._aiHaltTurn
  ).forEach(u => {
    const stale = G.turn - u._aiHaltTurn;
    if (stale >= 9) {
      const gname = u.squads[0]?.genName || '?';
      const tgtName = G.cities[u._aiTarget]?.name || '?';
      log(`🔄 [AI-${fid}] ${gname}部 对峙${stale}旬，放弃${tgtName}，寻找新目标`, 'battle');
      u._aiCooldownTarget = u._aiTarget; // 冷却：下次aiSelectTargets跳过此目标
      u._aiCooldownUntil = G.turn + 15;  // v110: 冷却6→15旬，避免反复分配同一目标
      // v110: 势力级冷却——整个势力短期内不再选此目标
      if (!fac._aiTargetCooldowns) fac._aiTargetCooldowns = {};
      fac._aiTargetCooldowns[u._aiTarget] = G.turn + 6; // v111: 势力级冷却10→6旬
      u._aiTarget = null;
      u._aiRole = null;
      delete u._aiHaltTurn;
    }
  });

  // ── 1. 有目标的进攻部队：向目标行军 ──
  // ★ v153fix: garrison部队可能有残留hexPath（旬末校正不清路径）
  // 如果目标已更换，旧hexPath指向错误方向，必须清除后重新寻路
  G.units.forEach(u => {
    if (u.fac !== fid || u._aiRole !== 'attack' || !u._aiTarget) return;
    if (u.status === 'garrison' && u.hexPath && u.hexPath.length > 0) {
      // 检查hexPath终点是否在目标城附近（距离≤2），不是则清除
      const last = u.hexPath[u.hexPath.length - 1];
      const tdef = CITY_MAP[u._aiTarget];
      if (tdef && hexDist(last.col, last.row, tdef.q, tdef.r) > 2) {
        u.hexPath = [];
        u.movePath = [];
      }
    }
  });

  const attackUnits = G.units.filter(u =>
    u.fac === fid &&
    u._aiTarget &&
    u._aiRole === 'attack' &&
    (u.status === 'garrison' || u.status === 'halt') &&
    (u.mobilizingTurns || 0) <= 0 &&
    isAiMusterReady(u) && // ★ v114: 集结未满80%不出发
    (!u.hexPath || u.hexPath.length === 0)
  );

  attackUnits.forEach(unit => {
    const targetId = unit._aiTarget;
    const targetCity = G.cities[targetId];
    if (!targetCity || targetCity.fac === fid || !isHostile(fid, targetCity.fac)) {
      // 目标已攻下或外交变化，清除目标
      unit._aiTarget = null;
      unit._aiRole = 'idle';
      delete unit._aiHaltTurn;
      return;
    }

    const targetCdef = CITY_MAP[targetId];
    if (!targetCdef) return;

    // ★ GT2: 鹰鸽遭遇判断——行军前检查视野内敌军
    const fog = G.fog?.[fid];
    const nearbyEnemies = G.units.filter(eu => {
      if (eu.fac === fid || !isHostile(fid, eu.fac) || getUnitTroops(eu) <= 0) return false;
      if (fog) {
        const ek = hkey(eu.hq ?? 0, eu.hr ?? 0);
        if ((fog[ek] ?? 0) < 2) return false; // 不在视野内
      }
      return hexDist(unit.hq ?? 0, unit.hr ?? 0, eu.hq ?? 0, eu.hr ?? 0) <= 4;
    });

    if (nearbyEnemies.length > 0) {
      // ★ v101 Bug3修复：收集周围友军一起评估胜率（不只是自己1v多）
      // v110: 友军检测范围从2格扩至4格，与敌军检测范围一致
      // 旧值2格导致"看到远处敌军多支但只算身边友军"→双方都觉得自己寡不敌众→互鸽
      const nearbyAllies = G.units.filter(au =>
        au.fac === fid && au.id !== unit.id &&
        getUnitTroops(au) > 0 &&
        au.status !== 'ambush' &&
        hexDist(au.hq??0, au.hr??0, unit.hq??0, unit.hr??0) <= 4
      );
      const evalAttackers = [unit, ...nearbyAllies];
      const wr = fuzzyEstimateWinRate(evalAttackers, nearbyEnemies, fid);
      const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
      // v109: 对峙超时降低门槛
      const haltTurns = unit._aiHaltTurn ? (G.turn - unit._aiHaltTurn) : 0;
      const thresholdMult = haltTurns >= 5 ? 0.70 : 1.0;
      let shouldHalt = false;

      const effThresh020 = 0.20 * thresholdMult;
      const effThresh040 = 0.40 * thresholdMult;
      const effThresh060 = 0.60 * thresholdMult;

      if (wr < effThresh020) {
        shouldHalt = true;
      } else if (wr < effThresh040) {
        const targetUnderSiege = G.units.some(su =>
          su.fac === fid && su.status === 'siege' && su.siegeTarget === targetId
        );
        if (!targetUnderSiege) shouldHalt = true;
      } else if (wr < effThresh060) {
        if (unit._aiRole === 'defend') shouldHalt = true;
      }
      // wr >= effThresh060: 鹰，继续行军

      if (shouldHalt) {
        unit.status = 'halt';
        unit.hexPath = [];
        if (!unit._aiHaltTurn) unit._aiHaltTurn = G.turn;
      } else {
        // 鹰 → 清除等待标记
        delete unit._aiHaltTurn;
        delete unit._aiBlockedCount;
        // ★ v100: 鹰派且与敌军相邻 → 显式发起战斗
        const contactEnemy = nearbyEnemies.find(eu =>
          unitsContact(unit, eu)
        );
        if (contactEnemy) {
          aiInitiateBattle(unit);
          return; // 战斗已发起，不再发行军命令
        }
        // v111: 鹰派但不贴脸（2-4格距离）→ 主动走向最近敌军
        // 解决"双方都判定鹰但保持2格距离永远不接触"的对峙死锁
        const closestEnemy = nearbyEnemies
          .map(eu => ({ eu, d: hexDist(unit.hq??0, unit.hr??0, eu.hq??0, eu.hr??0) }))
          .sort((a,b) => a.d - b.d)[0];
        if (closestEnemy && closestEnemy.d <= 4) {
          const hr = hexAstar(unit.hq??0, unit.hr??0, closestEnemy.eu.hq??0, closestEnemy.eu.hr??0, 'light', fid);
          if (hr && hr.path.length > 1) {
            unit.hexPath = hr.path.slice(1);
            unit.status = 'march';
            return; // 向敌军推进，下旬应该能贴脸
          }
        }
      }
    }

    // ★ v102→v109: 鸽派halt对峙——每旬重新检查敌军是否还在
    if (unit._aiHaltTurn && unit.status === 'halt') {
      // 视野内敌军消失 → 恢复行军
      const stillThreatened = G.units.some(eu => {
        if (eu.fac === fid || !isHostile(fid, eu.fac) || getUnitTroops(eu) <= 0) return false;
        if (fog) {
          const ek = hkey(eu.hq ?? 0, eu.hr ?? 0);
          if ((fog[ek] ?? 0) < 2) return false;
        }
        return hexDist(unit.hq ?? 0, unit.hr ?? 0, eu.hq ?? 0, eu.hr ?? 0) <= 4;
      });
      if (!stillThreatened) {
        delete unit._aiHaltTurn;
        // 继续行军（下面的逻辑会发命令）
      } else {
        // v109: 对峙5旬+允许强行推进（不再无限等待）
        const staleHalt = G.turn - unit._aiHaltTurn;
        if (staleHalt < 5) return; // 5旬内继续对峙
        // v111修复：5旬+允许推进，但**不清除_aiHaltTurn**
        // 旧逻辑delete后计时器重置→9旬超时永远不触发→部队永远卡住
        // 现在保留原始时间戳，步骤0的9旬超时能正确从最初停下那旬算起
        unit._aiForceAdvance = true; // 临时标记：本旬允许推进
      }
    }

    // 检查是否已在目标城旁（距离<=1）
    const dist = hexDist(unit.hq ?? 0, unit.hr ?? 0, targetCdef.q, targetCdef.r);
    if (dist <= 1) {
      // 已到达——判断是否围城
      _aiTrySiege(unit, targetId, fid);
      return;
    }

    // 行军到目标
    const fromCol = unit.hq ?? 0, fromRow = unit.hr ?? 0;
    const hexResult = hexAstar(fromCol, fromRow, targetCdef.q, targetCdef.r, 'light', fid);
    if (hexResult && hexResult.path.length > 1) {
      unit.hexPath = hexResult.path.slice(1);
      unit.movePath = [targetId];
      unit.status = 'march';
      delete unit._aiBlockedCount; // v111: 成功行军，清除被堵计数
      const gname = unit.squads[0]?.genName || '?';
      log(`🗺 [AI-${fid}] ${gname}部 → ${targetCity.name}`, 'battle');
    }
  });

  // ── 2. halt的attack部队：到达目标城旁 → 围城，或被敌军阻挡 → 鹰鸽判断后攻击 ──
  G.units.filter(u =>
    u.fac === fid &&
    u._aiTarget &&
    u._aiRole === 'attack' &&
    u.status === 'halt'
  ).forEach(unit => {
    const targetId = unit._aiTarget;
    const targetCdef = CITY_MAP[targetId];
    if (!targetCdef) return;
    const dist = hexDist(unit.hq ?? 0, unit.hr ?? 0, targetCdef.q, targetCdef.r);
    if (dist <= 1) {
      _aiTrySiege(unit, targetId, fid);
      return;
    }
    // ★ v100: 被敌军阻挡而halt（有残留hexPath）→ 检查是否与敌军相邻并发起攻击
    if (unit.hexPath && unit.hexPath.length > 0) {
      const contactEnemy = G.units.find(eu =>
        eu.fac !== fid && isHostile(fid, eu.fac) &&
        getUnitTroops(eu) > 0 &&
        eu.status !== 'ambush' && unitsContact(unit, eu)
      );
      if (contactEnemy) {
        // ★ v101 Bug3修复：用collectBattleSides收集实际参战双方再评估胜率
        const sides = collectBattleSides(unit);
        const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
        if (sides) {
          const wr = fuzzyEstimateWinRate(sides.attackers, sides.defenders, fid);
          // v109: 对峙超时降低门槛
          const haltTurns = unit._aiHaltTurn ? (G.turn - unit._aiHaltTurn) : 0;
          const effThreshold = personality.atkThreshold * (haltTurns >= 5 ? 0.70 : 1.0);
          if (wr >= effThreshold) {
            aiInitiateBattle(unit);
            return;
          }
        }
        // 鸽派继续对峙
        if (!unit._aiHaltTurn) unit._aiHaltTurn = G.turn;
      } else {
        // 旁边没相邻敌军 → 清hexPath让步骤1下旬重新评估
        // v110修复：旧逻辑恢复march会反复走同一条路撞同一堵墙→死循环
        // v111修复：记录被堵次数，连续3旬被非敌军堵住→放弃目标避免无效绕圈
        unit._aiBlockedCount = (unit._aiBlockedCount || 0) + 1;
        if (unit._aiBlockedCount >= 3) {
          unit._aiRole = 'idle';
          unit._aiTarget = null;
          delete unit._aiHaltTurn;
          delete unit._aiBlockedCount;
        }
        unit.hexPath = [];
        unit.movePath = [];
      }
    }
  });

  // ── 2b. G2P2: defend部队：向己方受威胁城市行军，到达后garrison ──
  // v110: defend部队遇敌能打就打（出城迎击/路上遭遇/解围）
  G.units.filter(u =>
    u.fac === fid &&
    u._aiRole === 'defend' &&
    u._aiTarget &&
    (u.status === 'garrison' || u.status === 'halt') &&
    (u.mobilizingTurns || 0) <= 0 &&
    isAiMusterReady(u) && // ★ v114
    (!u.hexPath || u.hexPath.length === 0)
  ).forEach(unit => {
    const targetId = unit._aiTarget;
    const targetCity = G.cities[targetId];
    // 目标城已丢失 → 恢复idle
    if (!targetCity || targetCity.fac !== fid) {
      unit._aiRole = 'idle';
      unit._aiTarget = null;
      return;
    }

    const targetCdef = CITY_MAP[targetId];
    if (!targetCdef) return;

    // v110: defend部队遇敌主动出击（统一处理出城/路上/解围）
    const fog = G.fog?.[fid];
    const contactEnemies = G.units.filter(eu =>
      eu.fac !== fid && isHostile(fid, eu.fac) && getUnitTroops(eu) > 0 &&
      eu.status !== 'ambush' &&
      unitsContact(unit, eu) &&
      (!fog || (fog[hkey(eu.hq??0, eu.hr??0)] ?? 0) >= FOG_VISIBLE)
    );
    if (contactEnemies.length > 0) {
      // 有敌军贴脸 → 集合附近友军评估胜率
      const nearbyAllies = G.units.filter(au =>
        au.fac === fid && au.id !== unit.id && getUnitTroops(au) > 0 &&
        au.status !== 'ambush' && hexDist(au.hq??0, au.hr??0, unit.hq??0, unit.hr??0) <= 4
      );
      const allDefenders = [unit, ...nearbyAllies];
      const wr = fuzzyEstimateWinRate(allDefenders, contactEnemies, fid);
      const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
      if (wr >= personality.atkThreshold) {
        aiInitiateBattle(unit);
        return;
      }
    }

    const dist = hexDist(unit.hq ?? 0, unit.hr ?? 0, targetCdef.q, targetCdef.r);
    if (dist <= 1) {
      // ★ AI伏击/扎营：到达防守目标后评估姿态
      const aiFog = G.fog?.[fid];
      const nearbyThreats = G.units.filter(eu =>
        eu.fac !== fid && isHostile(fid, eu.fac) && getUnitTroops(eu) > 0 &&
        hexDist(eu.hq??0, eu.hr??0, targetCdef.q, targetCdef.r) <= 6 &&
        _aiIsVisibleToFac(eu, fid, aiFog)
      );
      const posture = _aiChooseDefensePosture(unit, fid, nearbyThreats);
      const gname = unit.squads[0]?.genName || '?';

      if (posture && posture.type === 'ambush') {
        // 移动到伏击点并设伏
        const ah = posture.hex;
        const curDist = hexDist(unit.hq??0, unit.hr??0, ah.col, ah.row);
        if (curDist <= 1) {
          // 已在伏击点旁/上，直接设伏
          unit.hq = ah.col; unit.hr = ah.row;
          unit.status = 'ambush';
          unit.hexPath = [];
          unit.movePath = [];
          log(`🌿 [AI-${fid}] ${gname}部 于${ah.terrain==='forest'?'林地':'丘陵'}设伏（防守${targetCity.name}）`, 'battle');
        } else {
          // 需要先走到伏击点
          const hexResult = hexAstar(unit.hq??0, unit.hr??0, ah.col, ah.row, 'light', fid);
          if (hexResult && hexResult.path.length > 1) {
            unit.hexPath = hexResult.path.slice(1);
            unit.movePath = [];
            unit.status = 'march';
            unit._aiAmbushTarget = { col: ah.col, row: ah.row }; // 到达后自动设伏
          } else {
            // 寻路失败，fallback garrison
            unit.status = 'garrison'; unit.hexPath = []; unit.movePath = [];
          }
        }
      } else if (posture === 'camp') {
        // 扎营 — v111: 二次检查资源防止同旬多支部队扎营导致资源为负
        const fac = G.factions[fid];
        if ((fac.res.gold || 0) >= CAMP_COST.gold && (fac.res.wood || 0) >= CAMP_COST.wood) {
          safeSub(fac.res, 'gold', CAMP_COST.gold);
          safeSub(fac.res, 'wood', CAMP_COST.wood);
          unit.status = 'camp';
          unit.campMobilizeTurns = 0;
          unit.hexPath = []; unit.movePath = [];
          log(`🏕 [AI-${fid}] ${gname}部 于${targetCity.name}旁立寨扎营（防守）`, 'battle');
        } else {
          // 资源不够，fallback garrison
          unit.status = 'garrison';
          unit.hexPath = []; unit.movePath = [];
        }
      } else {
        // halt 或 garrison
        unit.status = 'garrison';
        unit.hexPath = []; unit.movePath = [];
      }
      // 保持defend角色直到aiDefendResponse的清理逻辑判断威胁消失
      return;
    }

    // 行军到目标
    const fromCol = unit.hq ?? 0, fromRow = unit.hr ?? 0;
    const hexResult = hexAstar(fromCol, fromRow, targetCdef.q, targetCdef.r, 'light', fid);
    if (hexResult && hexResult.path.length > 1) {
      unit.hexPath = hexResult.path.slice(1);
      unit.movePath = [targetId];
      unit.status = 'march';
    }
  });

  // ── 3. 闲置部队：非前线的往前线靠近，前线的不动 ──
  G.units.filter(u =>
    u.fac === fid &&
    u._aiRole === 'idle' &&
    (u.status === 'garrison' || u.status === 'halt') &&
    (u.mobilizingTurns || 0) <= 0 &&
    isAiMusterReady(u) && // ★ v114
    (!u.hexPath || u.hexPath.length === 0)
  ).forEach(unit => {
    const loc = getUnitNodeId(unit);
    // 如果在非己方领土，回城
    if (loc && G.cities[loc]?.fac !== fid) {
      const nearest = findNearestOwnCityPath(loc, fid);
      if (nearest?.hexPath) {
        unit.hexPath = nearest.hexPath.slice(1);
        unit.movePath = [nearest.city.id];
        unit.status = 'march';
      }
    }
  });

  // ── 4. 中立领土行军友好度惩罚（保留旧逻辑） ──
  G.units.filter(u => u.fac === fid && u.status === 'march').forEach(u => {
    const loc = getUnitNodeId(u);
    const locCity = G.cities[loc];
    if (!locCity || locCity.fac === fid || locCity.fac === 'rebel') return;
    const st = getDiploStatus(fid, locCity.fac);
    if (st === 'neutral') addDiplo(fid, locCity.fac, -1);
  });
}

/**
 * G2: 单部队围城/等待决策
 * 到达敌城旁后：野战能打 + 守方出城也能打 → siege，否则 halt等待
 */
function _aiTrySiege(unit, targetId, fid) {
  const city = G.cities[targetId];
  if (!city || city.fac === fid) return;

  // 收集目标城周围所有己方部队（已到达的）
  // v110: 范围统一为3格，与敌军检测范围一致
  const targetCdef = CITY_MAP[targetId];
  if (!targetCdef) return;
  const nearbyAllies = G.units.filter(u =>
    u.fac === fid &&
    hexDist(u.hq ?? 0, u.hr ?? 0, targetCdef.q, targetCdef.r) <= 3 &&
    getUnitTroops(u) > 0
  );

  // 检查1：周围有敌方野战部队能拦截？（城内garrison不算）
  const nearbyEnemyField = G.units.filter(u =>
    u.fac !== fid &&
    isHostile(fid, u.fac) &&
    u.status !== 'garrison' &&
    hexDist(u.hq ?? 0, u.hr ?? 0, targetCdef.q, targetCdef.r) <= 3 &&
    getUnitTroops(u) > 0
  );

  const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
  // v109: 对峙超时降低门槛（5旬+: ×0.7）
  const haltTurns = unit._aiHaltTurn ? (G.turn - unit._aiHaltTurn) : 0;
  const thresholdMult = haltTurns >= 5 ? 0.70 : 1.0;
  const effectiveThreshold = personality.atkThreshold * thresholdMult;

  // 检查1：野战打得过（如有附近敌方野战部队）
  if (nearbyEnemyField.length > 0) {
    const fieldWinRate = fuzzyEstimateWinRate(nearbyAllies, nearbyEnemyField, fid);
    if (fieldWinRate < effectiveThreshold) {
      // 打不过，halt等援
      unit.status = 'halt';
      if (!unit._aiHaltTurn) unit._aiHaltTurn = G.turn;
      return;
    }
  }

  // v110: 检查2（重写）：围城完成后能否攻下？
  // 用projectedDecay=1.0预估城防完全消除后的攻城胜率
  const projectedWR = _aiEstimateSiegeWinRate(nearbyAllies, targetId, 1.0);
  if (projectedWR < effectiveThreshold) {
    // 即使围完城防也打不过 → halt等援军
    unit.status = 'halt';
    if (!unit._aiHaltTurn) unit._aiHaltTurn = G.turn;
    return;
  }

  // 野战安全 + 围完打得过 → 进入siege状态
  delete unit._aiHaltTurn; // 清除对峙计时
  if (unit.status !== 'siege') {
    // ★ v162fix: 水上部队不可围城
    if(isUnitOnWater(unit)) return;
    unit.status = 'siege';
    unit.siegeTarget = targetId;
    unit._siegeTurnCount = 0;
    unit.hexPath = [];
    unit.movePath = [targetId];
    const gname = unit.squads[0]?.genName || '?';
    log(`🏰 [AI-${fid}] ${gname}部 对${city.name}发起围城（预期胜率${(projectedWR*100).toFixed(0)}%）`, 'battle');
  }
}

// ═══════════════════════════════════════
// GT2: 围城守方博弈
// ═══════════════════════════════════════

/**
 * GT2: 被围城市AI守方决策
 * 评估：援军是否在路上？城防还剩多少？出城打有没有赢面？
 * 决策：死守 / 出城野战
 */
function aiDefenderDecision(fid) {
  // 找己方被围的城市
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const besiegedCities = myCities.filter(city => {
    // 城旁有敌方siege部队
    const cdef = CITY_MAP[city.id];
    if (!cdef) return false;
    return G.units.some(u =>
      u.fac !== fid && isHostile(fid, u.fac) &&
      u.status === 'siege' && u.siegeTarget === city.id
    );
  });

  besiegedCities.forEach(city => {
    const cdef = CITY_MAP[city.id];
    if (!cdef) return;

    // 守方部队（驻城内的）
    const defenders = G.units.filter(u =>
      u.fac === fid &&
      getUnitNodeId(u) === city.id &&
      getUnitTroops(u) > 0
    );
    if (!defenders.length) return; // 纯garrison守军无法出城

    // 攻方部队
    const attackers = G.units.filter(u =>
      u.fac !== fid && isHostile(fid, u.fac) &&
      hexDist(u.hq ?? 0, u.hr ?? 0, cdef.q, cdef.r) <= 2 &&
      getUnitTroops(u) > 0
    );
    if (!attackers.length) return;

    // 己方援军是否在路上（≤3旬到达）
    const hasReinforcement = G.units.some(u => {
      if (u.fac !== fid || !u._aiTarget) return false;
      if (u._aiTarget !== city.id && u._aiRole !== 'defend') return false;
      if (u.status !== 'march' || !u.hexPath?.length) return false;
      // 粗略估算：hexPath长度 / AP ≈ 剩余旬数
      const ap = calcUnitAP(u);
      const turnsToArrive = Math.ceil(u.hexPath.length / Math.max(1, ap));
      return turnsToArrive <= 3;
    });

    const decay = city.siegeDecay || 0;
    const defMult = getSiegeDefMult(city);
    const winRate = fuzzyEstimateWinRate(defenders, attackers, fid);

    // 决策逻辑
    // v111: 胜率>80%时主动出城消灭弱敌（1万人不该看700人围城）
    if (winRate >= 0.80) {
      // 压倒性优势 → 出城歼灭
      const gname = defenders[0]?.squads[0]?.genName || '?';
      log(`⚔ [AI-${fid}] ${city.name}守军(${gname}部)主动出城迎击弱敌（胜率${(winRate*100).toFixed(0)}%）`, 'battle');
      aiInitiateBattle(defenders[0]);
      return;
    }
    if (hasReinforcement) return; // 有援军 → 死守
    if (decay < 0.70) return; // 城防加成还够 → 死守
    if (winRate < 0.20) return; // 太弱了 → 死守到底（等城破突围判定）
    if (winRate > 0.50) return; // 中等优势 → 不需要冒险出城

    // 无援 + 城防衰减>70% + 胜率20-50% → 出城野战
    defenders.forEach(u => {
      u.status = 'halt'; // 出城准备野战
      // 移到城外1格（攻方方向的反方向）
      const atkCenter = attackers.reduce((acc, a) => ({
        q: acc.q + (a.hq ?? 0), r: acc.r + (a.hr ?? 0)
      }), { q: 0, r: 0 });
      atkCenter.q = Math.round(atkCenter.q / attackers.length);
      atkCenter.r = Math.round(atkCenter.r / attackers.length);
      // 向远离攻方的方向出城1格
      const nbs = hexNeighbors(cdef.q, cdef.r);
      const best = nbs
        .filter(nb => {
          const t = getTerrainAt(nb.col, nb.row);
          if(!t || t === 'impassable' || t === 'water' || t === 'deep_water') return false;
          // ★ v101 Bug4修复：排除已被其他部队占据的格子
          const occupied = G.units.some(ou =>
            ou.id !== u.id && ou.hq === nb.col && ou.hr === nb.row
          );
          return !occupied;
        })
        .sort((a, b) => {
          const da = hexDist(a.col, a.row, atkCenter.q, atkCenter.r);
          const db = hexDist(b.col, b.row, atkCenter.q, atkCenter.r);
          return db - da; // 远离攻方
        })[0];
      if (best) {
        u.hq = best.col; u.hr = best.row;
      }
    });
    const gname = defenders[0]?.squads[0]?.genName || '?';
    log(`⚔ [AI-${fid}] ${city.name}守将${gname}率军出城迎战！（城防衰减${Math.round(decay*100)}%，胜率${Math.round(winRate*100)}%）`, 'battle');
    // ★ v100: 出城后立即发起战斗（不再等下旬被动扫描）
    if (defenders.length > 0) {
      aiInitiateBattle(defenders[0]);
    }
  });
}

/**
 * G2: AI 攻城决策（替代旧aiDoSiege，用estimateWinRate替代随机掷骰）
 */
function aiDoSiege(fid){
  const siegeUnits = G.units.filter(u =>
    u.fac === fid &&
    u.status === 'siege' &&
    u.siegeTarget
  );

  const personality = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;

  // ── B2修复：按cityId去重，每城每旬只处理一次攻城决策 ──
  const processedCities = new Set();

  siegeUnits.forEach(unit => {
    const cityId = unit.siegeTarget;
    const city = G.cities[cityId];
    if(!city || city.fac === fid) {
      // 目标城市已是己方，解除围城
      unit.status = 'garrison';
      unit.siegeTarget = null;
      unit._siegeTurnCount = 0;
      unit._aiTarget = null;
      unit._aiRole = 'idle';
      return;
    }

    // 外交状态检查：目标已非 enemy → 立即解围
    if(!isHostile(fid, city.fac)){
      unit.status = 'halt';
      unit.siegeTarget = null;
      unit._siegeTurnCount = 0;
      unit._aiTarget = null;
      unit._aiRole = 'idle';
      const gname = unit.squads[0]?.genName || '?';
      log(`🕊 [AI-${fid}] ${gname}部 解除对${city.name}的围城（外交状态变更）`, 'diplo');
      return;
    }

    // 已处理过此城 → 跳过（避免同城多次resolveSiegeBattle）
    if(processedCities.has(cityId)) return;
    processedCities.add(cityId);

    // 收集攻方（siege + 附近己方halt部队，2格内）
    const targetCdef = CITY_MAP[cityId];
    const attackers = G.units.filter(u => {
      if(u.fac !== fid) return false;
      if(u.status === 'siege' && u.siegeTarget === cityId) return true;
      if((u.status === 'halt' || u.status === 'garrison') && targetCdef &&
         hexDist(u.hq??0, u.hr??0, targetCdef.q, targetCdef.r) <= 2) return true;
      return false;
    });
    const defenders = G.units.filter(u => {
      if(u.fac !== city.fac) return false;
      return getUnitNodeId(u) === cityId;
    });

    if(!attackers.length) return;

    // G2: 用fuzzyEstimateWinRate判断是否攻城（v97模糊化）
    const winRate = _aiFuzzySiegeWinRate(attackers, cityId, fid);
    const decay = city.siegeDecay || 0;

    // 城防衰减>=70% 或 胜率>阈值 → 攻城
    if(decay < 0.70 && winRate < personality.siegeThreshold) return;

    // 更新所有围此城的部队的旬数
    siegeUnits.filter(su => su.siegeTarget === cityId).forEach(su => {
      su._siegeTurnCount = (su._siegeTurnCount || 0) + 1;
    });

    const nodeLabel = city.name;
    // ★ v175: 战前位置快照
    const _siegePosSnap = {};
    [...attackers, ...defenders].forEach(u => { _siegePosSnap[u.id] = { hq: u.hq, hr: u.hr }; });
    const siegeReport = resolveSiegeBattle(attackers, defenders, city, nodeLabel);
    if(!siegeReport) return;
    siegeReport.playerWasAttacker = false;
    _battleReports.push(siegeReport);
    _pendingBattleAnimations.push({
      kind: 'siege', report: siegeReport,
      attackers, defenders, posSnap: _siegePosSnap, city,
    });
    log('🏰 [AI] 【' + nodeLabel + '】' + (unit.squads[0]?.genName||'?') + '部 攻城' + (siegeReport.atkWins?'得手！':'失败'), 'battle');

    // 攻城后清理AI标记
    if(siegeReport.atkWins) {
      attackers.forEach(u => { u._aiTarget = null; u._aiRole = 'idle'; });
    }
  });
}

function aiDoDisband(fid){
  const fac = G.factions[fid]; if(!fac) return;

  // v111: 自动解散极小兵力残部（<100兵），避免6/6/6残兵卡在地图上
  const tinyUnits = G.units.filter(u => u.fac === fid && getUnitTroops(u) < 100 && getUnitTroops(u) > 0);
  if(tinyUnits.length) {
    tinyUnits.forEach(u => {
      const genNames = u.squads.map(sq=>sq.genName).join('、');
      log(`✂ [AI-${fid}] ${genNames}部残兵(${getUnitTroops(u)}人)就地遣散`, 'event');
    });
    const tinySet = new Set(tinyUnits.map(u => u.id));
    G.units = G.units.filter(u => !tinySet.has(u.id));
  }

  const DISBAND_DEBT_TURNS = 3; // 连续欠饷满3旬才触发裁军（给一点缓冲，避免偶发欠饷就裁）

  if((fac._salaryDebtTurns||0) < DISBAND_DEBT_TURNS) return; // 欠饷不够久，暂不裁

  // ⚠ B1修复：只裁 halt/garrison 闲置部队，不裁 march/siege/camp/ambush 作战中部队
  const disbandable = ['halt','garrison'];
  let fieldUnits = G.units.filter(u=>u.fac===fid && disbandable.includes(u.status));
  const allUnits  = G.units.filter(u=>u.fac===fid); // 全部队，用于军饷估算
  if(fieldUnits.length <= 1) return; // 最少保留1支，不能全裁光

  // 按兵力从少到多排序（优先裁残部，保留核心部队）
  fieldUnits = fieldUnits.slice().sort((a,b) => getUnitTroops(a) - getUnitTroops(b));

  // 裁到"全军halt军饷能被金钱存量撑住MIN_SALARY_BUFFER旬"为止
  let removedSet = new Set();
  let billetedSet = new Set();
  for(const unit of fieldUnits){
    const remaining = allUnits.filter(u=>!removedSet.has(u)&&!billetedSet.has(u));
    if(remaining.filter(u=>disbandable.includes(u.status)).length <= 1) break;
    const totalTroops = remaining.reduce((s,u)=>s+getUnitTroops(u),0);
    const salaryPerTurn = Math.floor(totalTroops * 0.008);
    if(fac.res.gold >= salaryPerTurn * MIN_SALARY_BUFFER) break; // 能撑住了，停止

    const genNames = unit.squads.map(sq=>sq.genName).join('、');
    // ★ v113: 高等级部队billet而非裁军
    if((unit.level||1) >= BILLET_LEVEL_THRESHOLD){
      const billetCities = getBilletCities(fid);
      if(billetCities.length){
        const cityId = billetCities[0]; // AI选第一个大城
        const city = G.cities[cityId];
        city.billetPool = city.billetPool || [];
        unit.squads.forEach(sq=>{
          if(sq.troops<=0) return;
          // ★ v164: AI billet也拆双条目（部曲绑武将+辅兵通用）
          const _ret = getRetainers(sq.genName);
          const _retInSq = Math.min(_ret, sq.troops);
          const _auxTroops = sq.troops - _retInSq;
          const _retType = getRetainerType(sq.genName) || sq.type;
          if(_retInSq > 0){
            city.billetPool.push({
              id:'bp_'+G.turn+'_'+Math.random().toString(36).slice(2,6),
              troops:_retInSq, maxTroops:_retInSq,
              type:_retType, level:RETAINER_LEVEL, billetTurn:G.turn,
              readyTurn:G.turn,
              genName:sq.genName,
            });
          }
          if(_auxTroops <= 0) return;
          city.billetPool.push({
            id:'bp_'+G.turn+'_'+Math.random().toString(36).slice(2,6),
            troops:_auxTroops, maxTroops:Math.max(_auxTroops,(sq.maxTroops||sq.troops)-_retInSq),
            type:sq.type, level:unit.level||1, billetTurn:G.turn,
            readyTurn:G.turn, // ★ v114fix: AI裁军部队已在城，即刻可用
          });
          // ★ v167fix: AI billet也清零户口本
          if(_retInSq > 0) setRetainers(sq.genName, 0);
        });
        billetedSet.add(unit);
        log(`🏠 [AI-${fid}] ${genNames}部(Lv${unit.level},${getUnitTroops(unit)}兵)休整屯田于${city.name}，保留老兵`, 'event');
        continue;
      }
    }
    removedSet.add(unit);
    log(`✂ [AI-${fid}] 欠饷${fac._salaryDebtTurns}旬→裁军：${genNames}部(${getUnitTroops(unit)}兵)`, 'event');
  }
  // 统一移除
  const removeAll = new Set([...removedSet, ...billetedSet]);
  if(removeAll.size > 0){
    G.units = G.units.filter(u=>!removeAll.has(u));
  }
}
// ★ v113: AI扩编（garrison在城的部队，squad未满7000时扩编）
function aiDoExpand(fid){
  const fac = G.factions[fid];
  if(!fac) return;
  const budget = fac._aiBudget?.military || 0;
  if(budget <= 200) return;

  // 找garrison在己方城市、有squad未满7000的部队
  const candidates = G.units.filter(u =>
    u.fac === fid && u.status === 'garrison' && (u.mobilizingTurns||0) <= 0 && !isUnitMustering(u)
  ).filter(u => {
    const atCity = getUnitAtCity(u);
    return atCity && atCity.fac === fid;
  });

  for(const unit of candidates){
    const atCity = getUnitAtCity(unit);
    if(!atCity) continue;
    const totalMax = unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
    if(totalMax >= getUnitMax(fid)) continue;

    for(const sq of unit.squads){
      const currentMax = sq.maxTroops || sq.troops;
      if(currentMax >= getSquadMax(fid)) continue;
      const squadRoom = getSquadMax(fid) - currentMax;
      const unitRoom = getUnitMax(fid) - unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
      const expandAmt = Math.min(squadRoom, unitRoom, 2000); // AI每次最多扩编2000
      if(expandAmt < 500) continue;

      // 费用 (D-006 fix: calcRecruitCost helper, 6 修正含 _postBuffs)
      const costGold = calcRecruitCost(fid, atCity.id, expandAmt, TROOP_TYPES[sq.type]?.costMult || 1.0);
      if(costGold > budget || fac.res.gold < costGold) continue;
      // ★ v118fix: AI扩编也扣材料
      const _aiExMatCost = calcSlotMatCost(sq.type, expandAmt);
      if(!canAffordMat(fid, _aiExMatCost)) continue;

      // 执行扩编
      safeSub(fac.res, 'gold', costGold);
      deductMat(fid, _aiExMatCost);
      fac._aiBudget.military -= costGold;

      // ★ v136: 征兵惩罚大幅加重——质量×100，民心×120
      const rcRatio = expandAmt / atCity.pop;
      atCity.popQuality = Math.max(20, (atCity.popQuality||80) - rcRatio * 100);
      atCity.morale = Math.max(0, (atCity.morale||50) - rcRatio * 120);

      // 等级加权（★ v121fix: 基于部队总兵力而非单分队）
      // ★ v116: 特色兵种扩编eliteLevel
      const _aiExEliteLv = TROOP_TYPES[sq.type]?.eliteLevel || 0;
      const cityLevel = _aiExEliteLv > 0 ? Math.max(_aiExEliteLv, getInitLevel(atCity)) : getInitLevel(atCity);
      const oldLevel = unit.level || 1;
      const oldTotal = getUnitTroops(unit);
      const newLevelRaw = (oldTotal * oldLevel + expandAmt * cityLevel) / (oldTotal + expandAmt);
      unit.level = Math.max(1, Math.min(UNIT_LEVEL_MAX, Math.round(newLevelRaw)));

      // ★ v114: AI扩编——当旬立即集结第一批 + 整备1旬
      const aiExpandRate = getMusterRate(atCity.id);
      const firstBatch = Math.min(aiExpandRate, expandAmt);
      sq.maxTroops = currentMax + expandAmt;
      sq.troops += firstBatch;
      if(firstBatch < expandAmt) {
        sq._musterTarget = sq.troops + (expandAmt - firstBatch);
        sq._mustered = sq.troops;
      }
      unit.mobilizingTurns = 1;
      unit._apRemaining = 0;

      log(`⬆ [AI-${fid}] ${sq.genName}队 扩编${fmt(expandAmt)}人，编制→${fmt(sq.maxTroops)}`, 'economy');
      return; // 每旬每势力最多扩编一支
    }
  }
}

// ★ v121: AI增编分队（<3分队部队 → 补至3分队）
function aiDoAddSquad(fid){
  const fac = G.factions[fid];
  if(!fac) return;
  const budget = fac._aiBudget?.military || 0;
  if(budget <= 200) return;

  const availableGens = aiGetAvailableGens(fid);
  if(!availableGens.length) return;

  // 找garrison在己方城市、<3分队、未整备、未集结的部队
  const candidates = G.units.filter(u =>
    u.fac === fid && u.status === 'garrison' &&
    u.squads.length < 3 &&
    (u.mobilizingTurns||0) <= 0 && !isUnitMustering(u)
  ).filter(u => {
    const atCity = getUnitAtCity(u);
    return atCity && atCity.fac === fid;
  });
  if(!candidates.length) return;

  // 优先补1分队→2分队，其次2分队→3分队；同等时选兵力最大的
  candidates.sort((a,b) => a.squads.length - b.squads.length || getUnitTroops(b) - getUnitTroops(a));

  for(const unit of candidates){
    const atCity = getUnitAtCity(unit);
    if(!atCity) continue;
    const totalMax = unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
    if(totalMax >= getUnitMax(fid)) continue;
    const unitRoom = getUnitMax(fid) - totalMax;
    const squadMax = getSquadMax(fid);
    const amt = Math.min(squadMax, unitRoom, AI_RECRUIT_TROOPS_BASE);
    if(amt < 500) continue;

    // 选将（com排序取最高）
    const gen = [...availableGens].sort((a,b) => (b.com||70) - (a.com||70))[0];
    if(!gen) return;

    // 选兵种：考虑适性+混编加分，与现有分队配合
    const existingTypes = unit.squads.map(sq => sq.type);
    const combatTypes = Object.entries(TROOP_TYPES)
      .filter(([tid, td]) => tid !== 'siege' && (!td.elite || td.homeCity === atCity.id))
      .filter(([tid, td]) => {
        if(!td.elite) return true;
        const cur = G.units.filter(u => u.fac === fid).flatMap(u => u.squads).filter(sq => sq.type === tid).length;
        return cur < (td.maxSquads || 3);
      })
      .map(([tid]) => tid);
    if(!combatTypes.length) continue;

    const gradeScore = {'S':1.20,'A':1.10,'B':1.00,'C':0.88};
    const getAptMult = (g, type) => {
      const td = TROOP_TYPES[type];
      const aptKey = td?.baseType || type;
      const base = gradeScore[g?.apt?.[aptKey]] || 1.0;
      return td?.elite ? base + 0.15 : base;
    };

    let bestType = combatTypes[0], bestScore = -1;
    for(const tid of combatTypes){
      const aptScore = getAptMult(gen, tid);
      const comboTypes = [...existingTypes, tid];
      const comboMult = getMixedComboMult(comboTypes);
      const score = aptScore * comboMult;
      if(score > bestScore){ bestScore = score; bestType = tid; }
    }

    // 费用 (D-006 fix: calcRecruitCost helper, 6 修正含 _postBuffs)
    const costGold = calcRecruitCost(fid, atCity.id, amt, TROOP_TYPES[bestType]?.costMult || 1.0);
    if(costGold > budget || fac.res.gold < costGold) continue;
    const matCost = calcSlotMatCost(bestType, amt);
    if(!canAffordMat(fid, matCost)) continue;

    // 扣资源
    safeSub(fac.res, 'gold', costGold);
    deductMat(fid, matCost);
    fac._aiBudget.military -= costGold;

    // ★ v136: 征兵惩罚大幅加重——质量×100，民心×120
    const rcRatio = amt / atCity.pop;
    atCity.popQuality = Math.max(20, (atCity.popQuality||80) - rcRatio * 100);
    atCity.morale = Math.max(0, (atCity.morale||50) - rcRatio * 120);

    // 等级加权（基于部队总兵力）
    const _eliteLv = TROOP_TYPES[bestType]?.eliteLevel || 0;
    const cityLevel = _eliteLv > 0 ? Math.max(_eliteLv, getInitLevel(atCity)) : getInitLevel(atCity);
    const oldLevel = unit.level || 1;
    const oldTotal = getUnitTroops(unit);
    const newLevelRaw = (oldTotal * oldLevel + amt * cityLevel) / (oldTotal + amt);
    unit.level = Math.max(1, Math.min(UNIT_LEVEL_MAX, Math.round(newLevelRaw)));

    // 集结
    const mRate = getMusterRate(atCity.id);
    const firstBatch = Math.min(mRate, amt);
    const newSq = {
      genName: gen.name, type: bestType,
      troops: firstBatch, maxTroops: amt, morale: 80,
    };
    if(firstBatch < amt) {
      newSq._musterTarget = amt;
      newSq._mustered = firstBatch;
    }
    unit.squads.push(newSq);

    // 整备1旬
    unit.mobilizingTurns = 1;
    unit._apRemaining = 0;

    // 从可用将领中移除
    const genIdx = availableGens.findIndex(g => g.name === gen.name);
    if(genIdx >= 0) availableGens.splice(genIdx, 1);

    log(`＋ [AI-${fid}] ${unit.squads[0]?.genName}部 增编分队：${gen.name}·${TROOP_TYPES[bestType]?.name||bestType}·${fmt(amt)}兵（${unit.squads.length}分队）`, 'economy');
    return; // 每旬最多增编一支
  }
}

function aiDoRecruit(fid){
  const fac = G.factions[fid];
  if(!fac) return;

  const budget = fac._aiBudget?.military || 0;
  if(budget <= 0) return;

  const availableGens = aiGetAvailableGens(fid);
  if(!availableGens.length) return;

  const currentUnits = G.units.filter(u=>u.fac===fid);
  if(currentUnits.length >= MAX_FIELD_UNITS_ABS) return;

  // ── v112: 兵力供需检查——有缺口才征，没缺口就攒钱 ──
  // 需求侧：各attack目标所需兵力 + 各defend任务所需兵力
  let demandTroops = 0;
  const plan = fac._aiPlan;
  if(plan?.targets) {
    plan.targets.forEach(tgt => {
      const city = G.cities[tgt.cityId];
      if(!city || city.fac === fid) return;
      // 目标城守军（野战部队+城防驻军）
      const defTroops = G.units.filter(u => u.fac === city.fac && getUnitNodeId(u) === tgt.cityId)
        .reduce((s,u) => s + getUnitTroops(u), 0) + (city.garrison || 0);
      demandTroops += Math.ceil(defTroops * 1.5); // 进攻需1.5倍兵力优势
    });
  }
  // defend任务：需要匹配威胁兵力（按城市去重，同城多支defend不重复计算）
  const defendCities = new Set();
  G.units.filter(u => u.fac === fid && u._aiRole === 'defend' && u._aiTarget).forEach(u => {
    if(defendCities.has(u._aiTarget)) return;
    defendCities.add(u._aiTarget);
    const cdef = CITY_MAP[u._aiTarget];
    if(!cdef) return;
    const threatTroops = G.units.filter(eu =>
      eu.fac !== fid && isHostile(fid, eu.fac) && getUnitTroops(eu) > 0 &&
      hexDist(eu.hq??0, eu.hr??0, cdef.q, cdef.r) <= 6
    ).reduce((s,eu) => s + getUnitTroops(eu), 0);
    demandTroops += threatTroops; // 防守只需1:1
  });

  // 供给侧：所有己方部队总兵力
  const supplyTroops = currentUnits.reduce((s,u) => s + getUnitTroops(u), 0);

  // 闲置兜底：idle部队≥3支说明aiSelectTargets分配不出去，征了也白堆
  const idleUnits = currentUnits.filter(u =>
    !u._aiRole || u._aiRole === 'idle' || u._aiRole === 'garrison'
  ).filter(u =>
    (u.mobilizingTurns||0) <= 0 && getUnitTroops(u) > 0
  );
  if(idleUnits.length >= 3) return;

  // 供给已覆盖需求 → 不征
  if(supplyTroops >= demandTroops && demandTroops > 0) return;

  // ★ v113: 优先从billetPool重编老兵（比征新兵省钱且等级高）
  // ★ v164: 部曲条目绑武将，AI选将后优先拉部曲条目+同兵种通用条目
  {
    const billetCities = getBilletCities(fid);
    for(const cid of billetCities){
      const city = G.cities[cid];
      const pool = city?.billetPool;
      if(!pool || !pool.length) continue;
      if(availableGens.length < 1) break;
      if(G.units.filter(u=>u.fac===fid).length >= MAX_FIELD_UNITS_ABS) break;
      const readyPool = pool.map((e,i)=>({e,i})).filter(({e})=>!e.readyTurn || e.readyTurn <= G.turn);
      if(!readyPool.length) continue;
      // AI: 先看有没有某武将的部曲条目，优先用那个武将
      const retainerEntries = readyPool.filter(({e})=>e.genName);
      let gen = null, mainEntry = null, mainIdx = -1;
      if(retainerEntries.length){
        // 找有对应闲置武将的部曲条目（最高level优先）
        retainerEntries.sort((a,b)=>b.e.level-a.e.level);
        for(const re of retainerEntries){
          const g = availableGens.find(g=>g.name===re.e.genName);
          if(g){ gen=g; mainEntry=re.e; mainIdx=re.i; break; }
        }
      }
      if(!gen){
        // 无部曲条目可用→选最高等级通用条目+最佳闲将
        const genericEntries = readyPool.filter(({e})=>!e.genName);
        if(!genericEntries.length) continue;
        genericEntries.sort((a,b)=>b.e.level-a.e.level);
        mainEntry = genericEntries[0].e; mainIdx = genericEntries[0].i;
        gen = availableGens.shift();
      } else {
        // 从可用将领中移除已选的
        const gi = availableGens.findIndex(g=>g.name===gen.name);
        if(gi>=0) availableGens.splice(gi,1);
      }
      if(!gen || !mainEntry) continue;
      const squads=[{genName:gen.name, type:mainEntry.type, troops:mainEntry.troops, maxTroops:mainEntry.maxTroops, morale:75}];
      const unit=createUnit({fac:fid, spawnCityId:cid, squads});
      if(!unit) continue;
      unit.level=mainEntry.level; unit.exp=0;
      unit.mobilizingTurns=2; unit._apRemaining=0;
      G.units.push(unit);
      pool.splice(mainIdx,1);
      // ★ v167fix: 写回户口本（部曲条目取出）
      if(mainEntry.genName) setRetainers(mainEntry.genName, mainEntry.troops, mainEntry.type);
      // ★ v167fix: 吸收同城同兵种辅兵条目（防止辅兵永久堆积）
      const _sqMax = getSquadMax(fid);
      const sq0 = unit.squads[0];
      for(let pi=pool.length-1; pi>=0; pi--){
        if(sq0.troops >= _sqMax) break;
        const bp = pool[pi];
        if(bp.genName || bp.type !== sq0.type) continue;
        if(bp.readyTurn > G.turn) continue;
        const absorb = Math.min(bp.troops, _sqMax - sq0.troops);
        sq0.troops += absorb; sq0.maxTroops = Math.max(sq0.maxTroops, sq0.troops);
        bp.troops -= absorb;
        if(bp.troops <= 0) pool.splice(pi, 1);
      }
      log(`⚔ [AI-${fid}] ${gen.name} 于${city.name}重编${fmt(sq0.troops)}老兵（Lv${mainEntry.level}），2旬整备`, 'economy');
      return; // 每旬最多redeploy一支
    }
  }

  // ── Step 1: 选将（com排序，ruler优先）──
  const sortedGens = [...availableGens].sort((a,b)=>b.com-a.com);
  const mainGen = sortedGens.find(g=>g.role==='ruler') || sortedGens[0];
  if(!mainGen) return;
  const secondGen = sortedGens.find(g=>g.name!==mainGen.name);
  const thirdGen = sortedGens.find(g=>g.name!==mainGen.name && (!secondGen || g.name!==secondGen.name));

  // ── Step 2: 选城（后方大城优先）──
  const myCities = Object.values(G.cities).filter(c=>c.fac===fid && !c.recruitedThisTurn);
  if(!myCities.length) return;
  ensureCityNeighbors();
  // ★ GT3: 征兵选址联动——威胁高且防守不足的方向优先征兵
  const tm = _aiGetThreatMatrix(fid);
  const _recruitCityScore = (cid) => {
    // 前线城：看该方向的威胁分
    const neighbors = ROAD_ADJ[cid] || [];
    let maxDirThreat = 0;
    neighbors.forEach(nb => {
      const nbCity = G.cities[nb];
      if (nbCity && nbCity.fac !== fid && isHostile(fid, nbCity.fac)) {
        maxDirThreat = Math.max(maxDirThreat, tm.threats[nbCity.fac] || 0);
      }
    });
    // 后方城=0威胁，前线城=该方向威胁分
    return maxDirThreat;
  };
  const city = myCities.sort((a,b) => {
    const ta = _recruitCityScore(a.id);
    const tb = _recruitCityScore(b.id);
    // 威胁高的方向优先（当威胁都>1时），否则后方大城优先
    if (tm.highestThreat > 1) {
      if (ta !== tb) return tb - ta; // 高威胁方向优先
      // ★ v108: 同等威胁下优先大城（减少征兵对小城的质量冲击）
      return b.pop - a.pop;
    } else {
      // 和平时后方大城优先
      const fa = ta > 0 ? 1 : 0;
      const fb = tb > 0 ? 1 : 0;
      if (fa !== fb) return fa - fb;
    }
    return b.pop - a.pop;
  })[0];
  if(!city) return;

  // ── Step 3: 费用检查 ──
  const mainTroops = AI_RECRUIT_TROOPS_BASE;
  const subTroops1 = secondGen ? Math.floor(AI_RECRUIT_TROOPS_BASE * 0.8) : 0;
  const subTroops2 = thirdGen  ? Math.floor(AI_RECRUIT_TROOPS_BASE * 0.6) : 0;
  const totalNew   = mainTroops + subTroops1 + subTroops2;
  const costGold = calcRecruitCost(fid, city.id, totalNew, 1.0); // D-006 fix: pre-pick budget check (elite=1.0, 含 _postBuffs)
  // ★ v108: 移除征兵粮食初始消耗（持续军粮由processUnitFood处理）
  if(costGold > budget) return;
  if(fac.res.gold < costGold) return;

  // ── Step 4: 选兵种组合（适性×混编乘数 最优化）──
  // ★ v116: 动态兵种列表——含势力可用的特色兵种
  const combatTypes = Object.entries(TROOP_TYPES)
    .filter(([tid, td]) => tid !== 'siege' && (!td.elite || td.homeCity === city.id))
    .filter(([tid, td]) => {
      if (!td.elite) return true;
      // 特色兵种上限检查（单势力maxSquads）
      const cur = G.units.filter(u => u.fac === fid).flatMap(u => u.squads).filter(sq => sq.type === tid).length;
      return cur < (td.maxSquads || 3);
    })
    .map(([tid]) => tid);
  const gradeScore = {'S':1.20,'A':1.10,'B':1.00,'C':0.88};
  // ★ v116: 特色兵种适性读baseType + elite偏好加分
  const getAptMult = (gen, type) => {
    const td = TROOP_TYPES[type];
    const aptKey = td?.baseType || type;
    const base = gradeScore[gen?.apt?.[aptKey]] || 1.0;
    return td?.elite ? base + 0.15 : base; // elite偏好
  };

  // 获取每将适性≥B的候选兵种（至少保留最高适性那个）
  const getCandidates = (gen) => {
    if(!gen) return ['light'];
    const scored = combatTypes.map(t=>({t, s:getAptMult(gen,t)})).sort((a,b)=>b.s-a.s);
    const candidates = scored.filter(x=>x.s>=1.0).map(x=>x.t);
    return candidates.length ? candidates : [scored[0].t];
  };

  const gens = [mainGen, secondGen, thirdGen].filter(Boolean);
  const candidatesByGen = gens.map(getCandidates);

  let bestScore = -1, bestTypes = null;
  // 枚举所有组合
  for(const t0 of candidatesByGen[0]){
    if(gens.length === 1){
      const score = getAptMult(gens[0],t0);
      if(score > bestScore){ bestScore=score; bestTypes=[t0]; }
    } else if(gens.length === 2){
      for(const t1 of candidatesByGen[1]){
        const comboMult = getMixedComboMult([t0,t1]);
        const aptScore = getAptMult(gens[0],t0) * getAptMult(gens[1],t1);
        const score = aptScore * comboMult;
        if(score > bestScore){ bestScore=score; bestTypes=[t0,t1]; }
      }
    } else {
      for(const t1 of candidatesByGen[1]){
        for(const t2 of candidatesByGen[2]){
          const comboMult = getMixedComboMult([t0,t1,t2]);
          const aptScore = getAptMult(gens[0],t0) * getAptMult(gens[1],t1) * getAptMult(gens[2],t2);
          const score = aptScore * comboMult;
          if(score > bestScore){ bestScore=score; bestTypes=[t0,t1,t2]; }
        }
      }
    }
  }
  if(!bestTypes) return;

  // ── Step 5: 扣资源 + 创建部队 ──
  // ★ v116: 特色兵种costMult——重算gold（有elite类型时加成）
  const _hasEliteType = bestTypes.some(t => TROOP_TYPES[t]?.elite);
  const _eliteCostMult = _hasEliteType ? Math.max(...bestTypes.map(t => TROOP_TYPES[t]?.costMult || 1.0)) : 1.0;
  const finalCostGold = calcRecruitCost(fid, city.id, totalNew, _eliteCostMult); // D-006 fix: 含 _postBuffs + _eliteCM (替代 Math.floor(costGold * eliteCM))
  // ★ v118fix: AI征兵也扣材料（铁/木/马）
  const _aiMatCost = mergeMatCosts(
    calcSlotMatCost(bestTypes[0], mainTroops),
    secondGen && bestTypes[1] ? calcSlotMatCost(bestTypes[1], subTroops1) : {},
    thirdGen && bestTypes[2] ? calcSlotMatCost(bestTypes[2], subTroops2) : {}
  );
  if(finalCostGold > budget || fac.res.gold < finalCostGold) return;
  if(!canAffordMat(fid, _aiMatCost)) return;
  safeSub(fac.res, 'gold', finalCostGold);
  deductMat(fid, _aiMatCost);
  fac._aiBudget.military -= finalCostGold;
  city.recruitedThisTurn = true;
  // ★ v136: 征兵惩罚大幅加重——质量×100，民心×120（AI同等适用）
  const _aiRcRatio = totalNew / city.pop;
  city.popQuality = Math.max(20, (city.popQuality||80) - _aiRcRatio * 100);
  city.morale     = Math.max(0,  (city.morale||50)     - _aiRcRatio * 120);

  // ★ v114: AI征兵——当旬立即集结第一批兵
  const aiMRate = getMusterRate(city.id);
  const _mk = (target, morale) => {
    const first = Math.min(aiMRate, target);
    const sq = { genName:'', type:'', troops:first, maxTroops:target, morale };
    if(first < target) { sq._musterTarget = target; sq._mustered = first; }
    return sq;
  };
  const squads = [
    Object.assign(_mk(mainTroops, 82), {genName:mainGen.name, type:bestTypes[0]}),
  ];
  if(secondGen && bestTypes[1]){
    squads.push(Object.assign(_mk(subTroops1, 80), {genName:secondGen.name, type:bestTypes[1]}));
  }
  if(thirdGen && bestTypes[2]){
    squads.push(Object.assign(_mk(subTroops2, 78), {genName:thirdGen.name, type:bestTypes[2]}));
  }

  const unit = createUnit({fac: fid, spawnCityId: city.id, squads});
  // ★ v116: 特色兵种出厂10级
  const _maxEliteLv = Math.max(...bestTypes.map(t => TROOP_TYPES[t]?.eliteLevel || 0));
  unit.level = _maxEliteLv > 0 ? Math.max(_maxEliteLv, getInitLevel(city)) : getInitLevel(city);
  unit.exp = 0;
  unit.mobilizingTurns = 1;
  unit._apRemaining = 0;
  G.units.push(unit);

  const genStr = squads.map(sq => sq.genName + '(' + fmt(sq.troops) + '/' + sq.maxTroops + ' ' + sq.type + ')').join('+');
  log(`⚔ [AI-${fid}] ${genStr} 于${city.name}编组（集结中）`, 'battle');
}


/**
 * G2 Phase 3: AI 预算分配系统
 * ★ GT3: 基于威胁矩阵的连续映射替代硬编码三档
 */
function _aiCalcBudget(fid){
  const fac = G.factions[fid];
  if(!fac) return;

  // 保底储备：至少维持全军 MIN_SALARY_BUFFER 旬军饷
  const salary = getFacUnitSalary(fid);
  const reserveGold = salary * MIN_SALARY_BUFFER;
  const availableGold = Math.max(0, fac.res.gold - reserveGold);

  // ★ GT3: 整体威胁聚合 → 驱动预算比例
  const tm = _aiGetThreatMatrix(fid);
  const overallThreat = tm.highestThreat + tm.secondThreat * 0.3;

  // 紧急修正：有defend部队时额外上浮
  const hasDefendUnits = G.units.some(u => u.fac === fid && u._aiRole === 'defend');

  let militaryPct;
  if (hasDefendUnits)         militaryPct = 0.85;
  else if (overallThreat > 5) militaryPct = 0.85;
  else if (overallThreat > 3) militaryPct = 0.70;
  else if (overallThreat > 1) militaryPct = 0.50;
  else                        militaryPct = 0.30;

  // ★ B4: 军费人格偏移（曹操+0.10重军事，刘备-0.05重建设）
  const _pBudget = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
  militaryPct += (_pBudget.budgetBias || 0);

  // GT3: cap 在 30%-85% 之间 (v111: 下限20→30%，确保基建有钱)
  militaryPct = Math.max(0.30, Math.min(0.85, militaryPct));

  const milBudget = Math.floor(availableGold * militaryPct);
  let buildBudget = Math.floor(availableGold * (1 - militaryPct));

  // v111: 基建最低保障——每旬至少从总金产的20%中拨出基建预算
  // 解决"缺钱→availableGold≈0→基建预算=0→永远不建经济→更缺钱"的死循环
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const grossGoldIncome = myCities.reduce((s, c) => s + getCityProd(c).gold, 0);
  const minBuildBudget = Math.floor(grossGoldIncome * 0.20);
  if(buildBudget < minBuildBudget && fac.res.gold > minBuildBudget) {
    buildBudget = minBuildBudget;
  }

  fac._aiBudget = {
    military: milBudget,
    build:    buildBudget,
  };
}

// ════════════════════════════════════════════════════════════════════
// ── MIL4 unit 基础 + 兵种 + skills (v181 L10036-L10339) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 部队系统 v3.0 — 格子地图，行动力，A*寻路
// ═══════════════════════════════════════════════════════

// ─── 兵种行动力（AP/旬，在平原/道路格每格消耗1AP）───
// 扎营消耗（每次下令扎营，一次性消耗）
const CAMP_COST = { gold: 100, wood: 80 }; // v111: 降低扎营费用（旧：金200木150）
function getCampCost(fid) { // ★ v115
  const m = 1 + getTechEffect(fid, 'campCostMult');
  return { gold: Math.floor(CAMP_COST.gold * m), wood: Math.floor(CAMP_COST.wood * m) };
}
// 拔营需要整备旬数
const CAMP_MOBILIZE_TURNS = 1;

// 扎营消耗（每次下令扎营，一次性消耗）
const TROOP_TYPES = {
  // recruit: 每5000兵的额外资源消耗（iron/wood/horses），gold/food 由基础公式统一计算
  // ★ v145: 马匹1:1（5000马/5000骑兵）+ 铁木涨50%
  cavalry: {name:'骑兵',  icon:'🐴', ap:6, desc:'平原机动最强，山地受阻',    recruit:{horses:5000, iron:80}},
  light:   {name:'轻步兵',icon:'⚔',  ap:3, desc:'全地形均衡',               recruit:{iron:45}},
  archer:  {name:'弓兵',  icon:'🏹', ap:3, desc:'远程压制',                 recruit:{iron:120, wood:90}},
  heavy:   {name:'重步兵',icon:'🛡', ap:2, desc:'防御强，移动慢',            recruit:{iron:220, wood:50}},
  siege:   {name:'攻城器',icon:'⚙',  ap:1, desc:'攻城必备，崎岖地形极慢',   recruit:{wood:750, iron:180}},
  // ── ★ v116: 特色兵种（城市绑定王牌） ──
  danyang:  {name:'丹阳兵',  icon:'🔥', ap:3, desc:'丹阳山越精锐，剽悍善战',         baseType:'light',   elite:true, homeCity:'jianye',   maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:45}},
  xiliang:  {name:'西凉铁骑',icon:'⚔',  ap:6, desc:'西凉骑兵天下闻名',              baseType:'cavalry', elite:true, homeCity:'tianshui', maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{horses:5000, iron:80}},
  hubao:    {name:'虎豹骑',  icon:'🐯', ap:6, desc:'曹氏精锐亲卫骑兵',              baseType:'cavalry', elite:true, homeCity:'chenliu',  maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{horses:5000, iron:80}},
  wudu:     {name:'无当飞军',icon:'🪶', ap:3, desc:'南中叟兵组建，擅长山地弓射',     baseType:'archer',  elite:true, homeCity:'chengdu',  maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:120, wood:90}},
  beiwei:   {name:'北军精锐',icon:'🏛', ap:2, desc:'汉朝北军五校，天子禁卫',         baseType:'heavy',   elite:true, homeCity:'luoyang',  maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:220, wood:50}},
  rattan:   {name:'藤甲兵',  icon:'🌿', ap:2, desc:'南蛮藤甲刀枪不入，惧火',         baseType:'heavy',   elite:true, homeCity:'jianning', maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:220, wood:50}},
  qiangbing:{name:'羌兵',    icon:'🏹', ap:3, desc:'氐羌部落兵，山地游击',           baseType:'light',   elite:true, homeCity:'hanzhong', maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:45}},
  danqi:    {name:'淮南突骑',icon:'🐴', ap:6, desc:'淮南骑兵传统，突击迅猛',         baseType:'cavalry', elite:true, homeCity:'shouchun', maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{horses:5000, iron:80}},
  baier:    {name:'白毦兵',  icon:'🦅', ap:2, desc:'陈到统领，刘备亲卫精锐',         baseType:'heavy',   elite:true, homeCity:'yongan',   maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:220, wood:50}},
  xianzhen: {name:'陷阵营',  icon:'💀', ap:2, desc:'高顺陷阵营，攻无不克',           baseType:'heavy',   elite:true, homeCity:'puyang',   maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{iron:220, wood:50}},
  piliche:  {name:'霹雳车营',icon:'💥', ap:1, desc:'官渡霹雳车，攻城利器兼有野战力', baseType:'siege',   elite:true, homeCity:'xuchang',  maxSquads:3, eliteLevel:10, costMult:1.7, recruit:{wood:750, iron:180}},
};

// ─── 兵种混编乘数表（查表制） ───
// key = 兵种排序后用'+'拼接，值 = 全部队统一乘数
// 单一兵种 = ×1.00（基准）
const MIXED_COMBO_MULT = {
  // 双兵种
  'cavalry+light':1.08, 'archer+heavy':1.08,
  'heavy+light':1.04, 'archer+light':1.04,
  'cavalry+archer':1.00, 'light+siege':1.00,
  'heavy+siege':1.02, 'archer+siege':0.94,
  'cavalry+heavy':0.94, 'cavalry+siege':0.90,
  // 三兵种
  'archer+heavy+light':1.06, 'archer+heavy+siege':1.04,
  'archer+cavalry+light':1.02, 'heavy+light+siege':1.02,
  'cavalry+heavy+light':1.00, 'archer+light+siege':0.98,
  'archer+cavalry+heavy':0.94, 'cavalry+light+siege':0.94,
  'cavalry+heavy+siege':0.90, 'archer+cavalry+siege':0.90,
};

/**
 * 获取一组兵种的混编乘数
 * @param {string[]} types - 兵种数组，如 ['cavalry','light','archer']
 * @returns {number} 混编乘数（单一兵种或未知组合返回1.0）
 */
function getMixedComboMult(types){
  const unique = [...new Set(types.map(t => TROOP_TYPES[t]?.baseType || t))].sort(); // ★ v116: elite→baseType
  if(unique.length <= 1) return 1.0;
  return MIXED_COMBO_MULT[unique.join('+')] ?? 1.0;
}

/**
 * 获取混编乘数的显示标签
 * @returns {{mult:number, label:string, color:string}}
 */
function getMixedComboLabel(types){
  const mult = getMixedComboMult(types);
  if(mult > 1.01) return {mult, label:`协同 ×${mult.toFixed(2)}`, color:'#1a7a3a'};
  if(mult < 0.99) return {mult, label:`冲突 ×${mult.toFixed(2)}`, color:'#c03030'};
  return {mult, label:`中性 ×${mult.toFixed(2)}`, color:'rgba(44,36,22,.45)'};
}

// ═══════════════════════════════════════════════════════
// 🎖 武将技能系统 — Layer 1: 注册表 + 统一调度
// ═══════════════════════════════════════════════════════
// 纯数值类技能走注册表，副作用类技能(SKILL_INLINE)保留原位。
// trigger: 挂载时机 | scope: 作用域判定 | effect: 返回 {flatX, multX}
// 叠加规则：最终值 = (base + Σ flat) × Π mult

const SKILL_REGISTRY = [
  // ── ATK 类 ──
  { id:'jinma', gen:'马超', name:'锦马', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='马超' && ctx.unit.squads[0]?.type==='cavalry'; },
    effect(){ return {multATK:1.15}; } },
  { id:'laodang_atk', gen:'黄忠', name:'老当(ATK)', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='黄忠'; },
    effect(){ return {multATK: 1 + Math.min(0.10, (G.year||0)*0.01)}; } },

  { id:'yazi', gen:'法正', name:'睚眦', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads.some(sq=>sq.genName==='法正') && ctx.unit._isDefenderThisBattle; },
    effect(){ return {multATK:1.15}; } },
  { id:'fangu', gen:'魏延', name:'反骨', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='魏延' && ctx.unit._isDefenderThisBattle === false; },
    effect(){ return {multATK:1.10}; } },

  // ── DEF 类 ──
  { id:'jianshou', gen:'曹仁', name:'坚守', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='曹仁' && (ctx.unit.status==='garrison'||ctx.unit.status==='camp'); },
    effect(){ return {multDEF:1.15}; } },
  { id:'zhonghu', gen:'司马懿', name:'冢虎', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='司马懿' && ctx.unit._isDefenderThisBattle; },
    effect(){ return {multDEF:1.15}; } },
  { id:'hubu_def', gen:'夏侯渊', name:'虎步(DEF)', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='夏侯渊'; },
    effect(){ return {multDEF:0.90}; } },
  { id:'laodang_def', gen:'黄忠', name:'老当(DEF)', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='黄忠'; },
    effect(){ return {multDEF: 1 + Math.min(0.10, (G.year||0)*0.01)}; } },
  { id:'xianshou', gen:'王平', name:'险守', trigger:'onCalcDEF',
    condition(ctx){ const t=ctx.terrain||'plain'; return ctx.unit.squads.some(sq=>sq.genName==='王平') && (t==='mountain'||t==='hill'||t==='forest'); },
    effect(){ return {multDEF:1.05}; } },

  // ── AP 类 ──
  { id:'hubu_ap', gen:'夏侯渊', name:'虎步(AP)', trigger:'onCalcAP',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='夏侯渊'; },
    effect(){ return {flatAP:2}; } },
  { id:'changqu', gen:'徐晃', name:'长驱', trigger:'onCalcAP',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='徐晃' && ctx.unit.hexPath?.length > 3; },
    effect(){ return {flatAP:1}; } },

  // ── 势力级（经济/内政）──
  { id:'wangzuo', gen:'荀彧', name:'王佐', trigger:'onGentry',
    condition(ctx){ return hasFacGen(ctx.fac, '荀彧') && genHasOffice('荀彧', ctx.fac); },
    effect(){ return {flatGentry:0.3}; } },

  // ── 组合条件 ──
  // SKILL_INLINE: huzhu_def — 周泰护主：孙权同部队时全队DEF×1.10
  { id:'huzhu', gen:'周泰', name:'护主', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads.some(sq=>sq.genName==='周泰') && ctx.unit.squads.some(sq=>sq.genName==='孙权'); },
    effect(){ return {multDEF:1.10}; } },

  // ── v125b batch ──
  { id:'xijing', gen:'郭淮', name:'西境', trigger:'onCalcDEF',
    condition(ctx){ const t=ctx.terrain||'plain'; return ctx.unit.squads[0]?.genName==='郭淮' && (t==='mountain'||t==='hill'); },
    effect(){ return {multDEF:1.12}; } },
  { id:'huangxu_atk', gen:'曹彰', name:'黄须(ATK)', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='曹彰' && ctx.unit.squads[0]?.type==='cavalry' && ctx.unit.status!=='siege'; },
    effect(){ return {multATK:1.05}; } },
  { id:'huangxu_def', gen:'曹彰', name:'黄须(DEF)', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='曹彰' && ctx.unit.squads[0]?.type==='cavalry' && ctx.unit.status!=='siege'; },
    effect(){ return {multDEF:1.05}; } },
  { id:'jiameng_atk', gen:'霍峻', name:'葭萌(ATK)', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads.some(sq=>sq.genName==='霍峻') && ctx.unit.status==='garrison'; },
    effect(){ return {multATK:1.05}; } },
  { id:'jiameng_def', gen:'霍峻', name:'葭萌(DEF)', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads.some(sq=>sq.genName==='霍峻') && ctx.unit.status==='garrison'; },
    effect(){ return {multDEF:1.05}; } },
  { id:'duanbing_atk', gen:'丁奉', name:'短兵(ATK)', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads.some(sq=>sq.genName==='丁奉') && G.seasonIdx===3; },
    effect(){ return {multATK:1.10}; } },
  { id:'duanbing_def', gen:'丁奉', name:'短兵(DEF)', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads.some(sq=>sq.genName==='丁奉') && G.seasonIdx===3; },
    effect(){ return {multDEF:1.10}; } },

  // ── v126 batch ──
  { id:'guozhan_atk', gen:'邓艾', name:'裹毡(ATK)', trigger:'onCalcATK',
    condition(ctx){ const t=ctx.terrain||'plain'; return ctx.unit.squads[0]?.genName==='邓艾' && (t==='mountain'||t==='hill'); },
    effect(){ return {multATK:1.10}; } },
  { id:'guozhan_def', gen:'邓艾', name:'裹毡(DEF)', trigger:'onCalcDEF',
    condition(ctx){ const t=ctx.terrain||'plain'; return ctx.unit.squads[0]?.genName==='邓艾' && (t==='mountain'||t==='hill'); },
    effect(){ return {multDEF:1.10}; } },
  { id:'zhanyan', gen:'马岱', name:'斩延', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads[0]?.genName==='马岱' && ctx.unit.squads[0]?.type==='cavalry'; },
    effect(){ return {multATK:1.05}; } },
  { id:'gangbi_atk', gen:'刘封', name:'刚愎(ATK)', trigger:'onCalcATK',
    condition(ctx){ return ctx.unit.squads.length===1 && ctx.unit.squads[0]?.genName==='刘封'; },
    effect(){ return {multATK:1.08}; } },
  { id:'gangbi_def', gen:'刘封', name:'刚愎(DEF)', trigger:'onCalcDEF',
    condition(ctx){ return ctx.unit.squads.length===1 && ctx.unit.squads[0]?.genName==='刘封'; },
    effect(){ return {multDEF:1.08}; } },
  { id:'huchen_atk', gen:'程普', name:'虎臣(ATK)', trigger:'onCalcATK',
    condition(ctx){ if(!ctx.unit.squads.some(sq=>sq.genName==='程普')) return false;
      const nid=getUnitNodeId(ctx.unit); return nid && isJiangdong(nid); },
    effect(){ return {multATK:1.10}; } },
  { id:'huchen_def', gen:'程普', name:'虎臣(DEF)', trigger:'onCalcDEF',
    condition(ctx){ if(!ctx.unit.squads.some(sq=>sq.genName==='程普')) return false;
      const nid=getUnitNodeId(ctx.unit); return nid && isJiangdong(nid); },
    effect(){ return {multDEF:1.10}; } },
  // ── v127 新增 ──
  // 曹洪·舍命：曹操同队时，曹操squad DEF×1.10（荥阳让马护主）
  { id:'sheming', gen:'曹洪', name:'舍命', trigger:'onCalcDEF',
    condition(ctx){
      if(ctx.sq?.genName !== '曹操') return false;
      return ctx.unit.squads.some(s => s.genName === '曹洪');
    },
    effect(){ return {multDEF:1.10}; } },
  // 曹休·千里驹：骑兵主将AP+1
  { id:'qianlijv', gen:'曹休', name:'千里驹', trigger:'onCalcAP',
    condition(ctx){
      if(!ctx.unit) return false;
      const lead = ctx.unit.squads[0];
      if(lead?.genName !== '曹休') return false;
      const bt = TROOP_TYPES[lead.type]?.baseType || lead.type;
      return bt === 'cavalry';
    },
    effect(){ return {flatAP:1}; } },
];

/**
 * 统一技能调度：收集指定trigger下所有生效技能的效果
 * @param {string} trigger - 挂载时机
 * @param {object} ctx - 上下文 {unit, fac, terrain, ...}
 * @returns {object} 合并后的效果 {flatATK, multATK, flatDEF, multDEF, flatAP, multAP, flatGentry, ...}
 */
function applySkills(trigger, ctx) {
  const r = {flatATK:0, multATK:1, flatDEF:0, multDEF:1, flatAP:0, multAP:1, flatGentry:0};
  const _naval = ctx.unit?._isNavalBattle; // ★ v138: 水战技能过滤
  for (let i = 0; i < SKILL_REGISTRY.length; i++) {
    const sk = SKILL_REGISTRY[i];
    if (sk.trigger !== trigger) continue;
    if (_naval && NAVAL_BLOCKED_SKILLS.has(sk.id)) continue; // ★ v138
    try {
      if (!sk.condition(ctx)) continue;
      const fx = sk.effect(ctx);
      if (fx.flatATK)   r.flatATK   += fx.flatATK;
      if (fx.multATK && fx.multATK !== 1) r.multATK *= fx.multATK;
      if (fx.flatDEF)   r.flatDEF   += fx.flatDEF;
      if (fx.multDEF && fx.multDEF !== 1) r.multDEF *= fx.multDEF;
      if (fx.flatAP)    r.flatAP    += fx.flatAP;
      if (fx.multAP && fx.multAP !== 1)  r.multAP  *= fx.multAP;
      if (fx.flatGentry) r.flatGentry += fx.flatGentry;
    } catch(e) { /* 单个技能condition/effect出错不影响其他技能 */ }
  }
  // TEMPERAMENT: steadfast — 主将防守时DEF+2%
  if(trigger === 'onCalcDEF' && ctx.unit){
    const _mainTemper = (GEN_TAGS[ctx.unit.squads[0]?.genName]||{}).temperament;
    if(_mainTemper === 'steadfast' && ctx.unit._isDefenderThisBattle) r.multDEF *= 1.02;
  }
  return r;
}

// ─── 部队综合行动力（加权平均，取最慢的兵种为短板）───
function calcUnitAP(unit) {
  // ★ v138: 水上部队统一AP
  if (isUnitOnWater(unit)) return NAVAL_AP;
  const squads = unit.squads.filter(s => s && s.troops > 0);
  if (!squads.length) return 2;
  const total = squads.reduce((s,q) => s+q.troops, 0);
  const weighted = squads.reduce((s,q) => s + q.troops * (TROOP_TYPES[q.type]?.ap||4), 0) / total;
  const slowest = Math.min(...squads.map(q => TROOP_TYPES[q.type]?.ap||4));
  let ap = Math.max(2, Math.floor(weighted * 0.8 + slowest * 0.2));
  const fx = applySkills('onCalcAP', {unit});
  ap += fx.flatAP;
  return ap;
}

// 主兵种（用于地形消耗计算）
function getMainTroopType(unit) {
  if (!unit.squads.length) return 'light';
  return unit.squads.reduce((a,b) => (b.troops > a.troops ? b : a)).type;
}

// ─── 部队 ID & 工具函数 ───
function newUnitId() { return 'u'+(_unitIdCounter++); }

/** 返回一支部队的当前总兵力 */
function getUnitTroops(unit){ return (unit?.squads||[]).reduce((s,q)=>s+(q.troops||0),0); }

/** ★ v118: 计算单个分队的材料费（铁/木/马），按兵力比例 */
// 经济链 E8 (物资 helpers calcSlotMatCost / mergeMatCosts / canAffordMat / deductMat,L13006-L13030) 已抽离到 src/chains/economy.js

// ─── 创建部队 ───
function createUnit({fac, spawnCityId, squads}) {
  const cg = cityToGrid(spawnCityId);
  // ★ v167: AI自动选择最优标签（玩家在编组弹窗手选）
  if(fac !== G.playerFac){
    // ★ v178 fix #3: 先扫一遍单标签 squads，标记已存在的 commander
    //   旧实现只扫多标签，但若已有"单标签 commander 武将"（如刘备）在场，
    //   多标签武将（如关羽 [warrior,commander]）仍会贪心选 commander → 双 commander 冲突 → 增幅全失效
    let hasCmd = false;
    squads.forEach(sq => {
      const classes = GEN_CLASS[sq.genName] || ['warrior'];
      if(classes.length === 1 && classes[0] === 'commander') hasCmd = true;
    });
    // 再扫多标签 squads，按 hasCmd 状态决定能否选 commander
    squads.forEach(sq => {
      const classes = GEN_CLASS[sq.genName] || ['warrior'];
      if(classes.length <= 1) return;
      // 贪心：优先选commander（如果还没有），否则warrior > strategist > minister
      if(!hasCmd && classes.includes('commander')){ sq._classChoice = 'commander'; hasCmd = true; }
      else if(classes.includes('warrior')) sq._classChoice = 'warrior';
      else if(classes.includes('strategist')) sq._classChoice = 'strategist';
      else sq._classChoice = classes[0];
    });
  }
  const unit = {
    id: newUnitId(), fac,
    hq: cg.hq, hr: cg.hr,
    status: 'garrison',
    squads,
    level: 1, exp: 0,
    mobilizingTurns: 0,
    _noSupplyTurns: 0,
    movePath: spawnCityId ? [spawnCityId] : [],
    hexPath: [],
  };
  unit._apRemaining = calcUnitAP(unit); // ★ v99: 满AP（非疲劳状态）
  return unit;
}

// ════════════════════════════════════════════════════════════════════
// ── MIL5 turn processor (v181 L10343-L11090) ──
// ════════════════════════════════════════════════════════════════════

function processUnitMovement(){
  G.units.forEach(unit=>{
    // ★ v99: 玩家部队已通过即时移动消耗AP，跳过旬末统一移动
    // 但仍处理hexPath剩余路径（跨旬行军的续走部分由nextTurn重置AP后生效）
    if(unit.fac === G.playerFac && unit._apSpentThisTurn) return;
    if(unit.status==='halt'||unit.status==='camp'||unit.status==='ambush'||unit.status==='siege') return;
    if(unit.mobilizingTurns>0) return;
    if(unit.status!=='march') return;

    // hex路径移动
    if(!unit.hexPath || unit.hexPath.length <= 0) {
      unit.status = 'halt'; return;
    }

    const troopType = getMainTroopType(unit);
    const _unitOnWater = isUnitOnWater(unit); // ★ v138: 记录本旬开始时水陆状态
    let ap = calcUnitAP(unit);
    unit._apRemaining = ap; // ★ v99: 追踪剩余AP（供撤退疲劳判定）

    // 沿hexPath逐格前进
    while(ap > 0 && unit.hexPath.length > 0) {
      const next = unit.hexPath[0];
      const _curOnWater = isWaterHex(unit.hq, unit.hr);
      const _nextIsWater = isWaterHex(next.col, next.row);
      const _rawCost = getHexMoveCost(next.col, next.row, troopType, _curOnWater);
      // SKILL_INLINE: guozhan_ap — 邓艾裹毡：主将邓艾时全地形AP消耗×0.85（水域除外）
      const _dengaiAP = (unit.squads[0]?.genName === '邓艾' && !_curOnWater && !_nextIsWater) ? 0.85 : 1.0;
      const cost = _rawCost >= 999 ? _rawCost : Math.max(1, Math.floor(_rawCost * _dengaiAP));
      if(cost >= 999) { unit.hexPath = []; break; } // 不可通行

      const nextKey = hkey(next.col, next.row);
      const isCityHex = !!HEX_CITY[nextKey];

      // ★ v133fix: 敌方城市检测优先于敌军阻挡（城hex上的敌军=守军，走围城流程）
      // ★ v78 Bug2: 敌方城市 → 停在当前格（相邻格），设为围城
      if(isCityHex) {
        const cityId = HEX_CITY[nextKey];
        const destCity = G.cities[cityId];
        if(destCity && destCity.fac !== unit.fac && destCity.fac !== 'none' && isHostile(unit.fac, destCity.fac)) {
          // ★ v138: 水上部队不可围城
          if(isUnitOnWater(unit)) { unit.status = 'halt'; unit.hexPath = []; return; }
          // 不进入城市hex，在当前位置围城
          unit.status = 'siege';
          unit.siegeTarget = cityId;
          unit._siegeTurnCount = 0;
          unit.hexPath = [];
          unit.movePath = [cityId];
         
          const gname = unit.squads[0]?.genName||'?';
          log('🏰 '+gname+'部 兵临'+destCity.name+'城下，开始围城', 'battle');

          // ★ v86: 玩家部队到达敌城旁 → 弹窗选择直接攻城/围而不攻
          if(unit.fac === G.playerFac && !_fastForward){
            _pendingSiegeArrival = { unitId: unit.id, cityId };
          }
          return;
        }
        // ★ v102: 中立/非己方城市 → 不进入城hex，在当前格halt
        if(destCity && destCity.fac !== unit.fac && destCity.fac !== 'none') {
          unit.status = 'halt';
          unit.hexPath = [];
          const gname = unit.squads[0]?.genName||'?';
          log('⛺ '+gname+'部 抵达'+destCity.name+'城外（非己方领土，就地驻扎）', 'economy');
          return;
        }
      }

      // ★ v78 Bug2: 敌军占据野外hex → 停在当前格（不进入敌军hex）
      const hasHostileUnit = G.units.some(u =>
        u.id !== unit.id &&
        u.hq === next.col && u.hr === next.row &&
        u.fac !== unit.fac &&
        isHostile(unit.fac, u.fac)
      );
      if(hasHostileUnit) {
        // ★ v100: 设halt停下（保留hexPath供后续恢复行军）
        unit.status = 'halt';
        break;
      }

      // ★ v103→v112: 堆叠检查——野外hex友军可穿越但不可停留；城市hex同势力可共存
      {
        const occupied = G.units.some(u =>
          u.id !== unit.id && u.hq === next.col && u.hr === next.row
        );
        if(occupied) {
          // 己方城市hex允许堆叠（garrison共存）
          const nxCityId = HEX_CITY[nextKey];
          const nxCity = nxCityId ? G.cities[nxCityId] : null;
          if(nxCity && nxCity.fac === unit.fac) {
            // 己方城市：允许进入
          } else {
            // 野外hex：友军可穿越，但不可停留
            const isFriendly = G.units.some(u =>
              u.id !== unit.id && u.hq === next.col && u.hr === next.row && u.fac === unit.fac
            );
            if(isFriendly) {
              // 友军占位：如果是路径终点→不能停→halt；如果还有后续路径→穿越
              if(unit.hexPath.length <= 1) {
                // 最后一格被友军占→停在当前格
                unit.hexPath = [];
                unit.status = 'halt';
                break;
              }
              // ★ v114: 穿越前检查AP是否够走过这格到下一格——不够就别进去
              const nextNext = unit.hexPath[1]; // 穿越后的下一格
              if(nextNext) {
                const nnCost = getHexMoveCost(nextNext.col, nextNext.row, troopType);
                if(ap < cost + nnCost) {
                  // AP不够穿越+走下一格→停在当前格等下旬
                  unit.status = 'halt';
                  break;
                }
              }
              // AP够→允许穿越（继续走，不break）
            } else {
              // 敌方/中立占位→堵住
              unit.hexPath = [];
              unit.status = 'halt';
              break;
            }
          }
        }
      }

      if(ap >= cost) {
        ap -= cost;
        unit._apRemaining = ap; // ★ v99: 同步剩余AP
        unit.hexPath.shift();
        unit.hq = next.col;
        unit.hr = next.row;

        // ★ v138: 水陆转换——入水或上岸时AP清零，强制停留一旬
        // ★ v148fix: 保持march状态，下旬AP恢复后自动继续沿hexPath走，避免AI误判为被堵
        if(_curOnWater !== _nextIsWater) {
          ap = 0; unit._apRemaining = 0;
          // 不改status——保持march，hexPath保留，下旬继续
        }

        // 检查是否到达城市（己方）
        const cityId = HEX_CITY[hkey(next.col, next.row)];
        if(cityId) {
          const destCity = G.cities[cityId];
          // ★ v102: 非己方城市已在pre-entry阶段拦截，此处只处理己方城市到达
          // 到达目标城市（己方）
          if(unit.movePath && unit.movePath.length > 0) {
            const destId = unit.movePath[unit.movePath.length - 1];
            if(cityId === destId) {
              unit.status = 'garrison';
              unit.hexPath = [];
              unit.movePath = [cityId];
             
              const gname = unit.squads[0]?.genName||'?';
              log('🗺 '+gname+'部 抵达'+(destCity?.name||cityId), 'economy');
              return;
            }
          }
        }
      } else {
        // ★ v114: AP不足停下——检查是否停在友军hex上（穿越后卡住）
        const stuckKey = hkey(unit.hq, unit.hr);
        const stuckCityId = HEX_CITY[stuckKey];
        const stuckCity = stuckCityId ? G.cities[stuckCityId] : null;
        const isOwnCity = stuckCity && stuckCity.fac === unit.fac;
        if (!isOwnCity) {
          const stuckOnFriendly = G.units.some(u =>
            u.id !== unit.id && u.hq === unit.hq && u.hr === unit.hr
          );
          if (stuckOnFriendly) {
            // 停在友军hex上——这是穿越后AP不足的情况，halt等下旬继续
            // 不回退（回退也可能重叠），但标记halt让下旬重新寻路
            unit.status = 'halt';
            unit.hexPath = [];
          }
        }
        break; // AP不足
      }
    }

    // hexPath耗尽
    if(unit.hexPath.length <= 0) {
      // ★ AI伏击：到达伏击目标hex后自动设伏
      if(unit._aiAmbushTarget) {
        const at = unit._aiAmbushTarget;
        if(unit.hq === at.col && unit.hr === at.row) {
          unit.status = 'ambush';
          unit.hexPath = []; unit.movePath = [];
          delete unit._aiAmbushTarget;
          const gname = unit.squads[0]?.genName || '?';
          const terrain = getTerrainAt(at.col, at.row);
          log(`🌿 [AI-${unit.fac}] ${gname}部 抵达伏击点（${terrain==='forest'?'林地':'丘陵'}），设伏`, 'battle');
          return;
        }
        delete unit._aiAmbushTarget; // 没到预定点，清除标记
      }
      const cityId = HEX_CITY[hkey(unit.hq, unit.hr)];
      if(cityId) {
        const destCity = G.cities[cityId];
        if(destCity && destCity.fac === unit.fac) {
          unit.status = 'garrison';
          unit._arrivedThisTurn = true; // ★ v179fix P10: 援军到达解围（对齐16326行旬末校正路径）
        } else {
          unit.status = 'halt';
        }
        unit.movePath = [cityId];
      } else {
        unit.status = 'halt';
      }
     
    }
  });
}

// ─── 围城衰减处理 ───
const SIEGE_BASE_DEF_BONUS = {small:2.00, medium:3.00, large:4.00}; // ★ v145: 配合durM地形乘数，baseDef下调（原3.5/5/7）
const SIEGE_MAX_TURNS = {small:3, medium:9, large:18};

function getSiegeDefMult(city){
  const size = city.size || 'medium';
  const wallBonus = Math.min(0.15, (city.buildings && city.buildings.wall || 0) * 0.05);
  const baseDef = SIEGE_BASE_DEF_BONUS[size] || 2.00; // v109F: fallback同步
  const durM = getCityStats(city.tags || []).durM || 1.0; // ★ v145: 地形耐久乘数（雄关2.0/山地1.4/水乡1.1）
  const decay = Math.min(1.0, city.siegeDecay || 0);
  const gentryDef = getGentryDefMult(city.id); // ★ v113: 豪族城防乘数
  return 1 + (baseDef * durM + wallBonus) * (1 - decay) * gentryDef;
}

// v110: 用指定decay值计算城防倍率（AI预估围城完成后的城防）
function _getSiegeDefMultWithDecay(city, overrideDecay){
  const size = city.size || 'medium';
  const wallBonus = Math.min(0.15, (city.buildings && city.buildings.wall || 0) * 0.05);
  const baseDef = SIEGE_BASE_DEF_BONUS[size] || 2.00;
  const durM = getCityStats(city.tags || []).durM || 1.0; // ★ v145: 地形耐久乘数
  const decay = Math.min(1.0, overrideDecay);
  const gentryDef = getGentryDefMult(city.id); // ★ v113
  return 1 + (baseDef * durM + wallBonus) * (1 - decay) * gentryDef;
}

function processSiegeDecay(){
  // 找所有正在被围攻的城市
  const siegedCities = new Set();
  G.units.forEach(u => {
    if(u.status === 'siege' && u.siegeTarget){
      siegedCities.add(u.siegeTarget);
      u._siegeTurnCount = (u._siegeTurnCount || 0) + 1;
    }
  });

  // 如果没有城市被围攻，siegeDecay慢慢自然恢复（可选）
  Object.values(G.cities).forEach(city => {
    if(!siegedCities.has(city.id)){
      // 无围攻：decay不推进（援军进入时另行重置）
      return;
    }
    const size = city.size || 'medium';
    const maxTurns = SIEGE_MAX_TURNS[size] || 9;

    // 计算攻城部队兵力
    const siegeUnits = G.units.filter(u => u.status === 'siege' && u.siegeTarget === city.id);
    const defUnits = G.units.filter(u => {
      if(u.fac !== city.fac) return false;
      const nodeId = getUnitNodeId(u);
      return nodeId === city.id;
    });

    const siegeTroops = siegeUnits.reduce((s,u)=>s+getUnitTroops(u),0);
    const defTroops = city.garrison + defUnits.reduce((s,u)=>s+getUnitTroops(u),0);
    const troopRatio = siegeTroops / Math.max(defTroops, 1);
    const ratioClamp = Math.min(2.0, Math.max(0.3, troopRatio));

    // ★ v133: 指数衰减曲线（前重后轻），k=0.35为基础速率
    // 旧：decayPerTurn = (1/maxTurns) * ratioClamp （线性）
    // 新：每旬 remaining = remaining * e^(-k)，decay = 1 - remaining
    const baseK = 0.35;
    let k = baseK * ratioClamp;

    // 有攻城器额外加速（+30%速率）
    const hasSiegeEquip = siegeUnits.some(u => u.squads.some(sq => sq.type === 'siege'));
    if(hasSiegeEquip) k *= 1.30;

    // SKILL_INLINE: jianbi — 满宠坚壁：被围城时decay增速×0.70（消耗慢30%）
    const _manchong = defUnits.some(u => u.squads.some(sq => sq.genName === '满宠'))
      || (G.generals[city.fac]||[]).some(g => g.name === '满宠' && !G.units.some(u => u.squads.some(sq => sq.genName === '满宠')));
    // 满宠需在守城部队中或驻守该城（非出征状态）
    const _manchongInCity = defUnits.some(u => u.squads.some(sq => sq.genName === '满宠'));
    if(_manchongInCity) k *= 0.70;

    // SKILL_INLINE: huanjin — 曹真缓进：曹真在围城部队中时decay+20%
    const _caozhen = siegeUnits.some(u => u.squads.some(sq => sq.genName === '曹真'));
    if(_caozhen) k *= 1.20;

    // SKILL_INLINE: qiaosi_siege — 刘晔巧思：当官时己方围城decay+10%
    const atkFac = siegeUnits[0]?.fac;
    if(atkFac && hasFacGen(atkFac, '刘晔') && genHasOffice('刘晔', atkFac)) k *= 1.10;

    // 指数衰减：remaining *= e^(-k)，前几旬收益大，后面递减
    const oldRemaining = 1.0 - (city.siegeDecay || 0);
    const newRemaining = oldRemaining * Math.exp(-k);
    city.siegeDecay = Math.min(1.0, 1.0 - newRemaining);
  });

  // 友军进入己方被围城市 → 重置decay（援军解围）
  // ★ v133fix: 只有本旬新到达的援军才重置，已在城内的守军不算
  G.units.forEach(u => {
    if(u.status !== 'garrison') return;
    if(!u._arrivedThisTurn) return; // ★ v133fix: 只有本旬从外部进入的部队才算援军
    const nodeId = getUnitNodeId(u);
    if(!nodeId) return;
    const city = G.cities[nodeId];
    if(city && city.fac === u.fac && (city.siegeDecay || 0) > 0 && siegedCities.has(city.id)){
      city.siegeDecay = 0;
      const gname = u.squads[0]?.genName || '?';
      log('🛡 ' + gname + '部 抵达' + city.name + '，城防重振！', 'battle');
    }
  });
}

function getUnitFoodRate(unit){
  // v88: 简化为三档——出征(100%) / 驻扎(50%) / billeted(20%)
  // 出征：行军和围城一样贵，大军在外都得吃饭
  // 驻扎：就地安顿省粮（halt/garrison/camp/ambush）
  // billeted：解散回家，仅维持最低消耗
  // ★ v136: 行军/围城粮耗提高 0.010→0.014，远征消耗更重
  if(unit.status==='march' || unit.status==='siege') return 0.014;
  return 0.014 * 0.50; // halt / garrison / camp / ambush
}
function getUnitSalaryRate(unit){
  // v88→v96→v108: 简化为两档——正常(100%) / billeted(20%)
  // v108经济平衡：0.0096→0.008（史实兵民比4-5%校准，含实际在野7折修正）
  return 0.008;
}

// ═══════════════════════════════════════════════════════
// 🚚 v88: 补给线系统
// ═══════════════════════════════════════════════════════

/**
 * 补给距离消耗表（每格消耗的补给点数）
 * 己方领地只算地形消耗；敌方领地额外+2
 */
const SUPPLY_TERRAIN_COST = {
  plain: 1, road: 1,
  hill: 2, forest: 2,
  mountain: 3, swamp: 3,
  water: 5, coastal_water: 6, deep_water: 999, impassable: 999,
  river: 3,
};
const SUPPLY_ENEMY_PENALTY = 3;  // 敌方领地额外消耗（v140: 2→3，深入敌境更快断粮）
const SUPPLY_MAX_RANGE = 11;     // 补给最大距离（v140: 13→11，收紧补给覆盖）
const SUPPLY_RATIONS = 3;        // 自带存粮（旬）
const SUPPLY_CITY_RESTORE_TURNS = 3; // 新占城市恢复补给所需旬数（v140: 2→3）

/**
 * 计算势力的补给覆盖图（BFS洪泛扩散）
 * 从该势力所有城市同时出发，按地形消耗扩散
 * 敌方部队所在格不可通过
 * @returns Map<hexKey, remainingRange> 可达hex及其剩余补给距离
 */
let _supplyCache = {};   // { fid: { map, turn } }

function buildSupplyMap(fid) {
  // 每旬缓存
  if (_supplyCache[fid] && _supplyCache[fid].turn === G.turn) return _supplyCache[fid].map;

  const supplyMap = {}; // hexKey -> remaining range (higher = better)
  const territory = _buildTerritoryMap();

  // 收集敌方部队所在hex（阻断补给）——只算己方可见的敌军
  const enemyBlockedHex = new Set();
  const fog = G.fog?.[fid];
  G.units.forEach(u => {
    if (u.fac !== fid && isHostile(fid, u.fac) && getUnitTroops(u) > 0) {
      const uk = hkey(u.hq, u.hr);
      // 只有在己方视野内（FOG_VISIBLE）的敌军才阻断补给
      if (!fog || (fog[uk] ?? 0) >= 2) {
        enemyBlockedHex.add(uk);
      }
    }
  });

  // BFS优先队列（用数组+排序模拟，规模可控）
  // 起点：该势力所有城市的hex
  const starts = [];
  CITIES_DEF.forEach(def => {
    const city = G.cities[def.id];
    if (!city || city.fac !== fid) return;
    // 新占城市需要恢复时间
    if ((city._supplyRestoreTurns || 0) > 0) return;
    const k = hkey(def.q, def.r);
    const _supplyRange = SUPPLY_MAX_RANGE + getTechEffect(fid, 'supplyRangeBonus'); // ★ v115
    starts.push({ col: def.q, row: def.r, remaining: _supplyRange });
    supplyMap[k] = _supplyRange;
  });

  // BFS（Dijkstra-like：按remaining降序处理，确保最优路径先到）
  // 用简单BFS+覆盖检查即可（remaining更高的先到就不再更新）
  const queue = [...starts];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    const nbs = hexNeighbors(cur.col, cur.row);
    for (const nb of nbs) {
      if (nb.col < 0 || nb.col >= HEX_COLS || nb.row < 0 || nb.row >= HEX_ROWS) continue;
      const nk = hkey(nb.col, nb.row);

      // 敌方部队阻断
      if (enemyBlockedHex.has(nk)) continue;

      // 地形消耗
      const terrain = HEX_TERRAIN[nk] || 'plain';
      const terrainCost = SUPPLY_TERRAIN_COST[terrain] ?? 2;
      if (terrainCost >= 999) continue; // 不可通过

      // 敌方领地额外消耗
      const terr = territory[nk];
      const isEnemy = terr && terr.fac !== fid && isHostile(fid, terr.fac);
      // ★ v172+: 豪族支持度作用于补给消耗（基准50，镜像到两侧）
      //   - 我方领地：gentry高→消耗减（下限0.3防无限穿透）
      //   - 敌方领地：该hex所属城gentry高→我方消耗增（下限0.0,+3敌境惩罚兜底"资敌"不为零成本）
      //   - 中立/无主/海面：系数1.0
      let gentryCoef = 1.0;
      if(terr){
        const _cityG = G.cities[terr.cityId]?.gentry;
        if(_cityG != null){
          if(terr.fac === fid){
            gentryCoef = Math.max(0.3, Math.min(2.0, 1 + (50 - _cityG) / 50));
          } else if(isEnemy){
            gentryCoef = Math.max(0.0, Math.min(2.0, 1 + (_cityG - 50) / 50));
          }
          // 中立/同盟领地保持1.0
        }
      }
      const totalCost = terrainCost * gentryCoef + (isEnemy ? SUPPLY_ENEMY_PENALTY : 0);

      const newRemaining = cur.remaining - totalCost;
      if (newRemaining < 0) continue; // 超出补给范围

      // 只有更好的路径才更新
      if (supplyMap[nk] !== undefined && supplyMap[nk] >= newRemaining) continue;
      supplyMap[nk] = newRemaining;
      queue.push({ col: nb.col, row: nb.row, remaining: newRemaining });
    }
  }

  _supplyCache[fid] = { map: supplyMap, turn: G.turn };
  return supplyMap;
}

/** 检查部队是否在补给范围内 */
function isUnitSupplied(unit) {
  if (unit.fac === 'rebel') return true; // 叛军无需补给
  const supplyMap = buildSupplyMap(unit.fac);
  const k = hkey(unit.hq, unit.hr);
  if(supplyMap[k] !== undefined) return true;
  // ★ v167: 武将四类 — 能臣标签扩展补给范围（+1或+2格）
  const _classSupply = getUnitClassBuffs(unit).supplyRange;
  if(_classSupply > 0){
    // 检查hex邻域内是否有补给覆盖（扩展1-2格）
    const nbs = hexNeighbors(unit.hq, unit.hr);
    if(_classSupply >= 1 && nbs.some(nb => supplyMap[hkey(nb.col, nb.row)] !== undefined)) return true;
    if(_classSupply >= 2){
      for(const nb of nbs){
        const nbs2 = hexNeighbors(nb.col, nb.row);
        if(nbs2.some(nb2 => supplyMap[hkey(nb2.col, nb2.row)] !== undefined)) return true;
      }
    }
  }
  return false;
}

/** 每旬处理补给状态和断粮惩罚（在processUnitFood之前调用） */
function processSupplyStatus() {
  // 清除缓存（每旬重算）
  _supplyCache = {};

  // 新占城市恢复倒计时
  Object.values(G.cities).forEach(city => {
    if ((city._supplyRestoreTurns || 0) > 0) {
      city._supplyRestoreTurns--;
    }
  });

  G.units.forEach(unit => {
    if (unit.fac === 'rebel') return;

    const supplied = isUnitSupplied(unit);
    if (supplied) {
      unit._noSupplyTurns = 0; // 补给恢复，清零
      return;
    }

    // 断粮计数
    unit._noSupplyTurns = (unit._noSupplyTurns || 0) + 1;
    const turns = unit._noSupplyTurns;
    const gname = unit.squads[0]?.genName || '?';

    const _rations = SUPPLY_RATIONS + getTechEffect(unit.fac, 'supplyRationsBonus') + (unit._extraRations||0); // ★ v115 + v132 E3
    if (turns <= _rations) {
      // 存粮期，仅提示
      if (turns === 1) log(`⚠ ${gname}部 补给断绝，开始消耗存粮（剩余${_rations - turns}旬）`, 'economy');
      return;
    }

    const penaltyTurns = turns - _rations; // 实际惩罚旬数（第4旬=1，第5旬=2...）

    if (penaltyTurns >= 4) {
      // 断粮惩罚满4旬（总断粮7旬）：全军饿死/溃散
      unit.squads.forEach(sq => { sq.troops = 0; });
      log(`💀 ${gname}部 断粮第${turns}旬，全军饿殍溃散`, 'economy');
      return;
    }

    // 士气惩罚（逐旬加重）
    const moralePenalty = 15 + penaltyTurns * 5; // 15→20→25

    // 士气惩罚
    unit.squads.forEach(sq => {
      sq.morale = Math.max(5, sq.morale - moralePenalty);
    });

    // 逃兵：每旬maxTroops的10%
    let totalDeserted = 0;
    unit.squads.forEach(sq => {
      const deserted = Math.ceil(sq.maxTroops * 0.10);
      sq.troops = Math.max(0, sq.troops - deserted);
      totalDeserted += deserted;
    });

    if (totalDeserted > 0) {
      log(`🍚 ${gname}部 断粮第${turns}旬，士气-${moralePenalty}，逃散${totalDeserted}人`, 'economy');
    }
  });
}

function processUnitFood() {
  G.units.forEach(unit => {
    if(unit.fac === 'rebel') return; // 叛军无需粮食维持
    // v88: 断粮部队不从城市扣粮（吃存粮或挨饿）
    if((unit._noSupplyTurns || 0) > 0) return;
    const total = getUnitTroops(unit);
    // ★ D1: 粮耗buff（右将军/大将军）
    const _fcBuff = G.factions[unit.fac]?._postBuffs?.foodCost || 0;
    const consume = Math.floor(total*getUnitFoodRate(unit) * (1 + _fcBuff));
    if (!consume) return;
    // ★ v167fix #31: 用hex距离（而非像素距离）找最近己方城市，与补给系统一致
    const uq = unit.hq ?? 0, ur = unit.hr ?? 0;
    let nearest=null, minD=9e9;
    CITIES_DEF.forEach(def => {
      const c = G.cities[def.id];
      if(!c || c.fac !== unit.fac) return;
      const d = hexDist(uq, ur, def.q, def.r);
      if(d < minD){ minD = d; nearest = c; }
    });
    if(nearest) nearest.storage=Math.max(0,nearest.storage-consume);
  });
}

/** 势力野战部队本旬总军饷 */
function getFacUnitSalary(fid){
  let s = G.units.filter(u=>u.fac===fid).reduce((s,u)=>s+Math.floor(getUnitTroops(u)*getUnitSalaryRate(u)),0);
  // ★ v113: billetPool粮饷（1/5费率）（★ v167fix: 行军中条目免算）
  Object.values(G.cities).filter(c=>c.fac===fid).forEach(c=>{
    (c.billetPool||[]).forEach(bp=>{ if((bp.readyTurn||0) <= G.turn) s+=Math.floor(bp.troops*0.008*0.20); });
  });
  return s;
}
function processUnitSalary() {
  // v45：军饷赤字链条（逃兵逻辑 v45b 修正）
  // 阶段1（即时）：欠饷 → 全军士气下降 + 无法补员
  // 阶段2（延迟）：连续欠饷满5旬 → 开始逐旬逃兵（与士气无关，纯粹时间积累）
  //               连续欠饷满10旬 → 逃兵率加倍
  ALL_FACS.forEach(fid=>{
    const fac=G.factions[fid];
    const units=G.units.filter(u=>u.fac===fid);

    // 计算本旬所需军饷
    // ★ D1: 维护费buff（左将军/大将军）
    const _upkeepBuff = fac._postBuffs?.upkeep || 0;
    const _techSalary = getTechEffect(fid, 'salaryMult'); // ★ v115: 精简军制
    const needed=units.reduce((s,u)=>{
      const t=getUnitTroops(u);
      return s+Math.floor(t*getUnitSalaryRate(u) * (1 + _upkeepBuff + _techSalary));
    },0);

    const available=fac.res.gold;
    fac.res.gold=Math.max(0, available-needed);

    // 欠饷比例 0.0（全付）~ 1.0（分文未付）
    const debtRatio = needed>0 ? Math.max(0,(needed-Math.min(available,needed))/needed) : 0;
    fac._salaryDebt = debtRatio;  // 供processReinforcement读取

    if(debtRatio <= 0){
      fac._salaryDebtTurns = 0;  // 足额发饷，连续欠饷计数清零
      return;
    }

    // 连续欠饷旬数累计
    fac._salaryDebtTurns = (fac._salaryDebtTurns || 0) + 1;
    const debtTurns = fac._salaryDebtTurns;

    // 阶段1：即时士气惩罚（行军中额外-5，离家远断饷更绝望）
    units.forEach(unit=>{
      const morPenalty = Math.round(debtRatio * 12) + (unit.status==='march' ? 5 : 0);
      unit.squads.forEach(sq=>{
        sq.morale = Math.max(5, sq.morale - morPenalty);
      });
    });

    // 阶段2：延迟逃兵（连续欠饷≥5旬才开始）
    // v111重做：用maxTroops做分母（不会越减越慢），10旬直接消灭
    // v112：billeted部队免疫逃兵阶段，终极溃散门槛延长至15旬
    if(debtTurns < 5) return;
    // 终极溃散：野战部队10旬，billeted部队15旬
    const activeUnits = units;
    if(debtTurns >= 10) {
      // 野战部队10旬溃散
      activeUnits.forEach(unit => {
        const genNames = unit.squads.map(sq=>sq.genName).join('、');
        log(`💀 [${fid}] ${genNames}部 欠饷${debtTurns}旬，全军溃散`, 'event');
        unit.squads.forEach(sq => { sq.troops = 0; });
      });
    }
    if(debtTurns >= 15) {
      // ★ v113: billetPool 15旬欠饷→兵员溃散
      Object.values(G.cities).filter(c=>c.fac===fid).forEach(c=>{
        if(c.billetPool && c.billetPool.length){
          log(`💀 [${fid}] ${c.name}屯田兵员(${c.billetPool.length}支) 欠饷${debtTurns}旬，全部溃散`, 'event');
          c.billetPool = [];
        }
      });
    }
    if(debtTurns >= 10) return; // 野战已溃散（或15旬后全溃散），不再走逃兵逻辑
    // 5-9旬：每旬逃散maxTroops的5%（billeted免疫——已遣散回乡，不会逃）
    activeUnits.forEach(unit=>{
      unit.squads.forEach(sq=>{
        const deserted = Math.ceil(sq.maxTroops * 0.05);
        if(deserted > 0){
          sq.troops = Math.max(0, sq.troops - deserted);
        }
      });
    });
  });
}

// 每旬整备倒计时
function processMobilizing(){
  G.units.forEach(unit=>{
    if(!unit.mobilizingTurns) return;
    unit.mobilizingTurns--;
    if(unit.mobilizingTurns===0){
      // ★ v114: 整备刚结束→立即给AP（旬初AP重置时mobilizingTurns还没减，会被设0）
      unit._apRemaining = calcUnitAP(unit);
      if(unit.fac===G.playerFac){
        const name=unit.squads[0]?.genName||'?';
        log(`🔔 ${name}部整备完成，可以下令出发`,'event');
        showNotif(`${name}部整备完成，可以出发！`,'info');
      }
    }
  });
  // 拔营倒计时
  G.units.forEach(unit=>{
    if(unit.status!=='camp'||!unit.campMobilizeTurns) return;
    unit.campMobilizeTurns--;
    if(unit.campMobilizeTurns===0){
      const curNode=getUnitNodeId(unit);
      unit.status=G.cities[curNode]?'garrison':'halt';
      const name=unit.squads[0]?.genName||'?';
      log(`🏕 ${name}部拔营完毕，可出发`,'economy');
      if(unit.fac===G.playerFac) showNotif(`${name}部拔营完毕，可以出发！`,'info');
    }
  });
}

// ═══════════════════════════════════════════════════════
// 🏰 v114: 集结系统（征兵/扩编渐进集结）
// ═══════════════════════════════════════════════════════

/** 计算城市每旬集结速率（per squad） */
function getMusterRate(cityId) {
  const city = G.cities[cityId];
  if (!city) return 2000;
  const pop = city.pop || 100000;
  return 2000 + Math.floor(pop / 100000) * 500;
}

/** 检查部队是否仍在集结中（任意squad有未完成的_musterTarget） */
function isUnitMustering(unit) {
  return unit.squads.some(sq => sq._musterTarget && (sq._mustered || 0) < sq._musterTarget);
}

/** AI专用：集结进度是否达到80%（所有squad都≥80%目标才算达标） */
function isAiMusterReady(unit) {
  return unit.squads.every(sq => {
    if (!sq._musterTarget) return true; // 没在集结=已就绪
    return (sq._mustered || 0) >= sq._musterTarget * 0.80;
  });
}

/** 每旬处理所有部队的集结进度（在processMobilizing之后调用） */
function processMuster() {
  G.units.forEach(unit => {
    // ★ v114: 非garrison部队——终止集结，清理标记（离城=集结终止）
    if (unit.status !== 'garrison') {
      unit.squads.forEach(sq => {
        if (sq._musterTarget) { sq._musterTarget = null; sq._mustered = null; }
      });
      return;
    }
    const atCity = getUnitAtCity(unit);
    if (!atCity || atCity.fac !== unit.fac) {
      // 不在己方城市——也终止
      unit.squads.forEach(sq => {
        if (sq._musterTarget) { sq._musterTarget = null; sq._mustered = null; }
      });
      return;
    }

    let anyMustering = false;
    const rate = getMusterRate(atCity.id);

    unit.squads.forEach(sq => {
      if (!sq._musterTarget || sq._musterTarget <= 0) return;
      if ((sq._mustered || 0) >= sq._musterTarget) {
        // 已满，清理标记
        sq._musterTarget = null;
        sq._mustered = null;
        return;
      }
      anyMustering = true;
      const prev = sq._mustered || 0;
      const added = Math.min(rate, sq._musterTarget - prev);
      sq._mustered = prev + added;
      sq.troops = sq._mustered;
    });

    if (anyMustering && unit.fac === G.playerFac) {
      // 检查是否全部集结完成
      const allDone = unit.squads.every(sq => !sq._musterTarget || (sq._mustered || 0) >= sq._musterTarget);
      if (allDone) {
        const name = unit.squads[0]?.genName || '?';
        log(`🔔 ${name}部集结完毕，满编可战`, 'event');
        showNotif(`${name}部集结完毕！`, 'info');
        // 清理所有集结标记
        unit.squads.forEach(sq => { sq._musterTarget = null; sq._mustered = null; });
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// ── MIL6 战斗解算 33 funcs + 5 const (v181 L11710-L13450) ──
// ════════════════════════════════════════════════════════════════════

function getTypeMatchMult(atkType, defComposition){
  const _atkBase = TROOP_TYPES[atkType]?.baseType || atkType; // ★ v116: elite→baseType
  const row = TYPE_MATCH_MULT[_atkBase];
  if(!row) return 1.0;
  const total = Object.values(defComposition).reduce((s,v)=>s+v, 0);
  if(total <= 0) return 1.0;
  let weighted = 0;
  for(const [defType, count] of Object.entries(defComposition)){
    const _defBase = TROOP_TYPES[defType]?.baseType || defType; // ★ v116
    const mult = row[_defBase] || 1.0;
    weighted += mult * (count / total);
  }
  return weighted;
}

/**
 * 获取地形修正乘数
 */
function getTerrainMult(troopType, terrain, hasZhangHe){
  const _tBase = TROOP_TYPES[troopType]?.baseType || troopType; // ★ v116: elite→baseType
  const row = TERRAIN_TROOP_MULT[terrain];
  if(!row) return 1.0;
  const base = row[_tBase] ?? 1.0;
  // SKILL_INLINE: qiaobian — 张郃巧变：地形惩罚（<1.0）向1.0折半，地形加成不变
  if(hasZhangHe && base < 1.0) return base + (1.0 - base) * 0.5;
  return base;
}

/**
 * 获取混编协同加成（作用于整个unit的squads）
 * 返回 Map<squadIndex, mult> 各分队的协同乘数
 */
function getMixedBonusMult(unit){
  const types = unit.squads.map(sq=>sq.type);
  const mult = getMixedComboMult(types);
  return new Array(unit.squads.length).fill(mult);
}

/**
 * 获取敌方兵种构成（兵力分布）
 */
function getEnemyComposition(enemyUnits){
  const comp = { cavalry:0, light:0, heavy:0, archer:0, siege:0 };
  if(!enemyUnits || !enemyUnits.length) return comp;
  enemyUnits.forEach(u => u.squads.forEach(sq=>{
    const baseType = TROOP_TYPES[sq.type]?.baseType || sq.type; // ★ v117fix: elite→baseType
    if(comp.hasOwnProperty(baseType)) comp[baseType] += sq.troops;
  }));
  return comp;
}

// 共用基础乘数项（troops × lvMult × moraleMult × comBonus × aptMult × fireDebuff）
function _squadBase(sq, unitLevel, com, war, unitFac){
  const _effLv    = getEffectiveSquadLevel(sq, unitLevel); // ★ v163: 部曲加权等级
  const lvMult    = getLvMult(_effLv);
  // ★ v113: 派系士气常数overlay
  const _facMorale = unitFac ? getFactionMoraleMod(sq.genName, unitFac) : 0;
  const _moraleCap = 100 + (unitFac ? getTechEffect(unitFac, 'moraleCapBonus') : 0); // ★ v115: 科技士气上限
  const effectiveMorale = Math.max(5, Math.min(_moraleCap, sq.morale + _facMorale));
  const moraleBase = Math.max(0.3, effectiveMorale/100);
  const moraleMult = Math.min(1.0, moraleBase + warMoraleBonus(war||60));
  const gen       = GEN_MAP[sq.genName];
  const _aptKey   = sq._navalApt ? 'naval' : (TROOP_TYPES[sq.type]?.baseType || sq.type); // ★ v138: 水战读naval适性
  const aptGrade  = gen?.apt?.[_aptKey] || 'B';
  const aptMult   = APT_MULT[aptGrade] || 1.0;
  const fireDebuff = sq._fireDebuff || 1.0;
  return sq.troops * lvMult * moraleMult * comBonus(com) * aptMult * fireDebuff;
}
// ATK：含克制/地形/混编等进攻乘数（extraMult传入）
function squadATK(sq, unitLevel, com, war, extraMult, unitFac){
  const _techAtk = 1 + (unitFac ? getTechEffect(unitFac, 'atkMult') : 0); // ★ v115
  const _xiaoyiAtk = sq._xiaoyi_atk || 1.0; // SKILL_INLINE: xiaoyi — 关平孝义ATK+5%
  return _squadBase(sq, unitLevel, com, war, unitFac) * (TYPE_ATK[sq.type]||1.0) * (extraMult||1.0) * _techAtk * _xiaoyiAtk;
}
// DEF：含地形修正（terrainMult传入）+ 营寨/城防临时防御加成（_defBonus）
function squadDEF(sq, unitLevel, com, war, terrainMult, unitFac){
  const defBonus = sq._defBonus || 1.0;
  const siegeDebuff = sq._siegeDebuff ? 0.95 : 1.0;
  const _techDef = 1 + (unitFac ? getTechEffect(unitFac, 'defMult') : 0); // ★ v115
  return _squadBase(sq, unitLevel, com, war, unitFac) * (TYPE_DEF[sq.type]||1.0) * (terrainMult||1.0) * defBonus * siegeDebuff * _techDef;
}
// 向后兼容：squadCP退化为squadATK（无克制/地形时行为一致）
function squadCP(sq, unitLevel, com, war, extraMult, unitFac){
  return squadATK(sq, unitLevel, com, war, extraMult, unitFac);
}

/**
 * 计算部队进攻值（含克制+地形+混编，传入敌方units和地形）
 * enemyUnits可选；不传则退化为纯ATK基础值（向后兼容）
 */
function calcUnitATK(unit, enemyUnits, terrain){
  if(!unit.squads.length) return 0;
  const mainGen  = GEN_MAP[unit.squads[0]?.genName];
  const isRebel  = unit.fac === 'rebel';
  const mainCom  = mainGen ? mainGen.com : (isRebel ? 50 : 60);
  const mainWar  = mainGen ? getEffectiveStat(mainGen.name,'war') : (isRebel ? 50 : 60);

  const fx = applySkills('onCalcATK', {unit});

  if(!enemyUnits || !enemyUnits.length){
    return unit.squads.reduce((s,sq)=> s + squadATK(sq, unit.level||1, mainCom, mainWar, 1, unit.fac), 0) * fx.multATK;
  }

  const defComp     = getEnemyComposition(enemyUnits);
  const mixedMults  = getMixedBonusMult(unit);
  const ter         = terrain || 'plain';
  const hasZhangHe  = unit.squads.some(sq => sq.genName === '张郃');

  return unit.squads.reduce((s, sq, i)=>{
    const typeMult    = getTypeMatchMult(sq.type, defComp);
    const terrainMult = getTerrainMult(sq.type, ter, hasZhangHe);
    const mixedMult   = mixedMults[i];
    const extra = typeMult * terrainMult * mixedMult * fx.multATK;
    return s + squadATK(sq, unit.level||1, mainCom, mainWar, extra, unit.fac);
  }, 0);
}

/**
 * 计算部队防御值（含地形修正，不含克制/混编）
 */
function calcUnitDEF(unit, terrain){
  if(!unit.squads.length) return 0;
  const mainGen  = GEN_MAP[unit.squads[0]?.genName];
  const isRebel  = unit.fac === 'rebel';
  const mainCom  = mainGen ? mainGen.com : (isRebel ? 50 : 60);
  const mainWar  = mainGen ? getEffectiveStat(mainGen.name,'war') : (isRebel ? 50 : 60);
  const ter      = terrain || 'plain';
  const hasZhangHe = unit.squads.some(sq => sq.genName === '张郃');

  const fx = applySkills('onCalcDEF', {unit, terrain: ter});

  return unit.squads.reduce((s, sq)=>{
    const terrainMult = getTerrainMult(sq.type, ter, hasZhangHe);
    return s + squadDEF(sq, unit.level||1, mainCom, mainWar, terrainMult * fx.multDEF, unit.fac);
  }, 0);
}

/**
 * 向后兼容：calcCombatPower → calcUnitATK
 * 旧调用点（不传enemyUnits）退化为纯ATK基础值，行为与原逻辑一致
 */
function calcCombatPower(unit, enemyUnits, terrain){
  return calcUnitATK(unit, enemyUnits, terrain);
}

/**
 * 获取部队当前所在节点ID
 */

/**
 * 获取部队像素坐标（用于判断"接触"）
 */

// ═══════════════════════════════════════════════════════
// 🎯 伏击系统
// ═══════════════════════════════════════════════════════

/**
 * 取一方所有在场将领中最高的智力值
 */

function getMaxInt(units){
  let best = 0;
  units.forEach(u => u.squads.forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if(g && g.int > best) best = g.int;
  }));
  return best;
}

/**
 * 取一方主将（squads[0]）的统帅值，用于缓解中伏惩罚
 */
function getMainCom(units){
  const mainGenName = units[0]?.squads[0]?.genName;
  const g = GEN_MAP[mainGenName];
  return g ? g.com : 60;
}

// 🔥 火攻系统（A2）
// ═══════════════════════════════════════════════════════

// 火攻地形倍率（不在此表的地形不可用火攻）
const FIRE_TERRAIN_MULT = { forest:1.5, mountain:1.2, hill:1.0, water:1.3 };

// 火攻季节倍率
const FIRE_SEASON_MULT = { '夏':1.3, '秋':1.2, '春':1.0, '冬':0.5 };

// 火攻固定消耗
const FIRE_COST = { gold:300, wood:200 };
/** 判断地形是否允许火攻 */
function canFireAttack(terrain){ return FIRE_TERRAIN_MULT.hasOwnProperty(terrain); }

/** 计算火攻成功率 [0.20, 0.60]，由双方最高智力差决定 */
function calcFireRate(attackers, defenders){
  const atkInt = getMaxInt(attackers);
  const defInt = getMaxInt(defenders);
  const intDiff = atkInt - defInt;
  const intBonus = Math.max(-0.20, Math.min(0.20, intDiff / 10 * 0.08));
  let rate = Math.max(0.20, Math.min(0.60, 0.40 + intBonus));
  // SKILL_INLINE: chibi_rate — 周瑜赤壁：火攻成功率+20%
  if(hasGenInUnits('周瑜', attackers)) rate = Math.min(0.90, rate + 0.20);
  // ★ v167: 武将四类 — 谋士标签增加火攻成功率
  const _fireClassBonus = attackers.reduce((sum,u) => sum + getUnitClassBuffs(u).tacticPct, 0);
  if(_fireClassBonus > 0) rate = Math.min(0.90, rate + _fireClassBonus);
  return rate;
}

/**
 * 施加火攻效果到防御方
 * 返回实际施加的士气惩罚 pct 和战力惩罚 pct（用于战报显示）
 */
function applyFireEffect(defenders, terrain, season, attackers){
  const tMult = FIRE_TERRAIN_MULT[terrain] || 1.0;
  const sMult = FIRE_SEASON_MULT[season]   || 1.0;
  const combined = tMult * sMult;
  // SKILL_INLINE: chibi_damage — 周瑜赤壁：火攻伤害×1.3
  const _zhouyuMult = (attackers && hasGenInUnits('周瑜', attackers)) ? 1.3 : 1.0;
  const moralePenaltyPct = Math.min(0.90, 0.15 * combined * _zhouyuMult); // 士气降幅比例
  const cpPenaltyPct     = Math.min(0.50, 0.10 * combined * _zhouyuMult); // 战力降幅比例
  defenders.forEach(u => u.squads.forEach(sq => {
    // ★ v116: 藤甲惧火——火攻对藤甲兵额外×1.40
    const _rattanMult = sq.type === 'rattan' ? 1.40 : 1.0;
    sq.morale = Math.max(10, Math.round(sq.morale * (1 - moralePenaltyPct * _rattanMult)));
    sq._fireDebuff = (sq._fireDebuff || 1.0) * (1 - cpPenaltyPct * _rattanMult); // 叠加战力惩罚乘数
  }));
  return {
    moralePct: Math.round(moralePenaltyPct * 100),
    cpPct:     Math.round(cpPenaltyPct     * 100),
    combined:  combined.toFixed(2),
  };
}

/** 清除火攻战力惩罚标记 */
function clearFireDebuff(units){
  units.forEach(u => u.squads.forEach(sq => { delete sq._fireDebuff; }));
}

/**
 * AI 决定是否使用火攻
 * 成功率>0.45 且资源充足 且地形可用 → 使用
 */
function aiDecideFireAttack(attackers, defenders, terrain, fid){
  if(!canFireAttack(terrain)) return false;
  const fac = G.factions[fid];
  if(!fac) return false;
  if((fac.res.gold||0) < FIRE_COST.gold) return false;
  if((fac.res.wood||0) < FIRE_COST.wood) return false;
  const rate = calcFireRate(attackers, defenders);
  return rate > 0.45; // AI 在胜率>45% 时才冒险用火攻
}

/**
 * 伏击结算
 * ambushUnits: 处于 ambush 状态的一方（伏击方）
 * victimUnits: 撞入的一方（受害方，单支部队，1v1）
 * 返回 ambushReport 对象
 */
const AMBUSH_BASE_CHANCE={mountain:0.65,forest:0.55,hill:0.40,plain:0.15,road:0.15,water:0.05,river:0.10,impassable:0,deep_water:0,coastal_water:0};

function resolveAmbush(ambushUnits,victimUnits,terrainType,useFireAttack){
  const rand=(lo,hi)=>lo+Math.random()*(hi-lo);
  const ambushInt=getMaxInt(ambushUnits);
  const victimInt=getMaxInt(victimUnits);
  const intDiff=ambushInt-victimInt;
  const baseTerrain=terrainType||"plain";
  const ter = baseTerrain; // Fix: ter was undefined, ATK/DEF calculations need it

  // ── 火攻前置处理 ──
  let fireResult = null; // { success, moralePct, cpPct, combined, rate }
  if(useFireAttack && canFireAttack(baseTerrain)){
    const attackFid = ambushUnits[0]?.fac;
    const fac = attackFid ? G.factions[attackFid] : null;
    // 二次资源校验：防止弹窗期间资源被其他途径消耗导致负数
    if(fac && (fac.res.gold||0) >= FIRE_COST.gold && (fac.res.wood||0) >= FIRE_COST.wood){
      safeSub(fac.res, 'gold', FIRE_COST.gold);
      safeSub(fac.res, 'wood', FIRE_COST.wood);
      const fireRate = calcFireRate(ambushUnits, victimUnits);
      const fireSuccess = Math.random() < fireRate;
      if(fireSuccess){
        const curSeason = SEASONS[G.seasonIdx] || '春';
        const effects = applyFireEffect(victimUnits, baseTerrain, curSeason, ambushUnits);
        fireResult = { success:true, rate:Math.round(fireRate*100), ...effects };
      } else {
        fireResult = { success:false, rate:Math.round(fireRate*100) };
      }
    }
  }
  const baseChance=AMBUSH_BASE_CHANCE[baseTerrain]||0.15;
  const capHigh=(baseTerrain==="plain"||baseTerrain==="road")?0.45:(baseTerrain==="water")?0.20:0.90;
  const capLow=(baseTerrain==="plain"||baseTerrain==="road")?0.05:(baseTerrain==="water")?0.02:0.10;
  const ambushChance_raw = Math.min(capHigh,Math.max(capLow,baseChance+intDiff*0.008));
  // SKILL_INLINE: shensuan_ambush — 诸葛亮神算：伏击中伏率±10%
  const _ambSkillLogs = [];
  const ambushFid = ambushUnits[0]?.fac;
  const victimFid = victimUnits[0]?.fac;
  const zglAmbush = ambushFid && hasFacGen(ambushFid, '诸葛亮') && genHasOffice('诸葛亮', ambushFid);
  const zglVictim = victimFid && hasFacGen(victimFid, '诸葛亮') && genHasOffice('诸葛亮', victimFid);
  let ambushChance = ambushChance_raw;
  if(zglAmbush){ ambushChance = Math.min(capHigh, ambushChance + 0.10); _ambSkillLogs.push({icon:'🧠', gen:'诸葛亮', name:'神算', desc:'中伏率+10%'}); }
  if(zglVictim){ ambushChance = Math.max(capLow,  ambushChance - 0.10); _ambSkillLogs.push({icon:'🧠', gen:'诸葛亮', name:'神算', desc:'识破伏兵，中伏率-10%'}); }
  // SKILL_INLINE: luofeng — 张任落凤：设伏方有张任时中伏率+15%
  if(hasGenInUnits('张任', ambushUnits)){ ambushChance = Math.min(capHigh, ambushChance + 0.15); _ambSkillLogs.push({icon:'🏹', gen:'张任', name:'落凤', desc:'设伏精妙，中伏率+15%'}); }
  // ★ v132 E2: 诱敌深入事件加成+10%
  if(ambushUnits.some(u=>u._advisedAmbush)){
    ambushChance = Math.min(capHigh, ambushChance + 0.10);
    _ambSkillLogs.push({icon:'🪤', gen:'谋士', name:'诱敌深入', desc:'依计设伏，中伏率+10%'});
    ambushUnits.forEach(u=>{ delete u._advisedAmbush; }); // 触发后清除
  }
  // TEMPERAMENT: reckless(受伏方) → 中伏率+5%；cunning(受伏方) → 中伏率-5%
  const _victimMainTemper = (GEN_TAGS[victimUnits[0]?.squads[0]?.genName]||{}).temperament;
  if(_victimMainTemper === 'reckless') ambushChance = Math.min(capHigh, ambushChance + 0.05);
  if(_victimMainTemper === 'cunning')  ambushChance = Math.max(capLow,  ambushChance - 0.05);
  // ★ v167: 武将四类 — 谋士标签增加伏击中伏率
  const _ambClassBonus = ambushUnits.reduce((sum,u) => sum + getUnitClassBuffs(u).tacticPct, 0);
  if(_ambClassBonus > 0){ ambushChance = Math.min(capHigh, ambushChance + _ambClassBonus); _ambSkillLogs.push({icon:'🧠', gen:'谋士', name:'谋士增幅', desc:`中伏率+${Math.round(_ambClassBonus*100)}%`}); }
  const ambushHit=Math.random()<ambushChance;

  // ── 受伏击方统帅缓解系数（统帅100 → 最多抵消50%惩罚）──
  const victimCom = getMainCom(victimUnits);
  const comMitigate = 0.5 * (victimCom / 100);  // 0~0.5

  let moralePenalty = 0;
  let cpMult = 1.0;  // 受伏击方战力乘数

  if(ambushHit){
    // 中伏：士气 -25~-40（统帅缓解后实际扣减）
    const rawMoraleDrop = 25;  // 固定-25，统帅缓解后实际扣减
    moralePenalty = Math.round(rawMoraleDrop * (1 - comMitigate));
    // 战力削减：基础 -30%，统帅缓解最多减半 → 实际 -15%~-30%
    const rawCpPenalty = 0.35;  // 基础×0.65，统帅100时减半→实际最低×0.825
    const actualCpPenalty = rawCpPenalty * (1 - comMitigate);
    cpMult = 1 - actualCpPenalty;

    // 立即扣士气（影响后续 resolveBattle 的 moraleMult）
    // SKILL_INLINE: yanzheng — 蒋钦严整：被伏击时士气惩罚减半
    const _jiangqinPresent = victimUnits.some(u => u.squads.some(sq => sq.genName === '蒋钦'));
    let _actualMoralePen = _jiangqinPresent ? Math.round(moralePenalty * 0.5) : moralePenalty;
    // TEMPERAMENT: steady(受伏方主将) → 士气惩罚-5
    if(_victimMainTemper === 'steady') _actualMoralePen = Math.max(0, _actualMoralePen - 5);
    victimUnits.forEach(u => u.squads.forEach(sq => {
      sq.morale = Math.max(10, sq.morale - _actualMoralePen);
    }));
  } else {
    // 未中伏：伏击方被发现，士气微降，状态自动解除（后续统一处理）
    ambushUnits.forEach(u => u.squads.forEach(sq => {
      sq.morale = Math.max(10, sq.morale - 5);
    }));
  }

  // ── 战斗结算（1v1，有被动单挑，无叫阵，无撤退）──

  // 被动单挑（可触发，伏击氛围下仍有阵中厮杀）
  const passiveDuel = tryPassiveDuel(ambushUnits, victimUnits);
  let passiveCPMult = {atk:1, def:1};
  if(passiveDuel){
    if(passiveDuel.outcome==='atkWin')      passiveCPMult = {atk:1.12, def:0.88};
    else if(passiveDuel.outcome==='defWin') passiveCPMult = {atk:0.88, def:1.12};
    applyDuelMorale(ambushUnits, victimUnits, passiveDuel);
  }

  // ★ v167: 武将四类 — 统帅buff（伏击战双方均适用）
  [...ambushUnits, ...victimUnits].forEach(u => {
    const cb = getUnitClassBuffs(u);
    if(cb.morale > 0) u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + cb.morale); });
  });

  // ATK计算：伏击方正常，受伏方乘以中伏削减系数
  // ★ v125: 仅伏击成功时，受伏方标记为defender（法正睚眦/司马懿冢虎触发）
  // 设伏方和伏击失败时不标记（undefined），魏延反骨也不触发（需===false）
  if(ambushHit) victimUnits.forEach(u => { u._isDefenderThisBattle = true; });
  const ambushATK = ambushUnits.reduce((s,u)=>s+calcUnitATK(u, victimUnits, ter),0);
  const ambushDEF = ambushUnits.reduce((s,u)=>s+calcUnitDEF(u, ter),0);
  const victimATKBase = victimUnits.reduce((s,u)=>s+calcUnitATK(u, ambushUnits, ter),0);
  const victimDEF     = victimUnits.reduce((s,u)=>s+calcUnitDEF(u, ter),0) * (ambushHit ? cpMult : 1.0);
  const victimATK     = victimATKBase * (ambushHit ? cpMult : 1.0);

  // v61：胜负判定改为 ATK/敌DEF 对比，随机范围扩大到±30%
  const ambushRoll = (ambushATK / Math.max(1, victimDEF)) * passiveCPMult.atk * rand(0.50, 1.50);
  const victimRoll = (victimATK / Math.max(1, ambushDEF)) * passiveCPMult.def * rand(0.50, 1.50);
  const ambushWins = ambushRoll >= victimRoll;

  const cpRatio = ambushWins
    ? ambushRoll / Math.max(1, victimRoll)
    : victimRoll / Math.max(1, ambushRoll);

  function applyLoss(units, lossRate){
    let total = 0;
    units.forEach(u => u.squads.forEach(sq => {
      const lost = Math.floor(sq.troops * lossRate * rand(0.8, 1.2));
      // ★ v163: 部曲战损分配（保护系数0.35）
      const ret = getRetainers(sq.genName);
      if(ret > 0 && sq.troops > 0){
        const retInSq = Math.min(ret, sq.troops);
        const retShare = (retInSq / sq.troops) * RETAINER_PROTECT;
        const retLost = Math.min(retInSq, Math.floor(lost * retShare));
        setRetainers(sq.genName, ret - retLost);
      }
      sq.troops = Math.max(0, sq.troops - lost);
      total += lost;
    }));
    return total;
  }
  function applyAnnihilationAmbush(losers, ratio){
    if(ratio < 3.0) return false;
    losers.forEach(u => u.squads.forEach(sq => { sq.troops = 0; setRetainers(sq.genName, 0); }));
    return true;
  }

  // ATK/DEF损失公式（与resolveBattle一致，v78重构）
  function calcAmbushLossRates(winnerATK, winnerDEF, loserATK, loserDEF){
    const hitOnLoser  = winnerATK / Math.max(1, loserDEF);
    const hitOnWinner = loserATK  / Math.max(1, winnerDEF);
    let lL = 0.28 * Math.pow(hitOnLoser, 0.8) * 1.12;
    lL = Math.max(0.12, Math.min(0.65, lL));
    let wL = 0.28 * Math.pow(hitOnWinner, 0.8) * 0.90;
    wL = Math.max(0.05, Math.min(0.45, wL));
    return {wL, lL};
  }

  let ambushLost, victimLost, annihilated = false;
  if(ambushWins){
    const {wL, lL} = calcAmbushLossRates(ambushATK, ambushDEF, victimATK, victimDEF);
    victimLost = applyLoss(victimUnits, lL);
    ambushLost = applyLoss(ambushUnits, wL);
    // v85: 兵力比修正
    // ★ v179 fix #57: +xxxLost 必须移出 reduce
    const ambTr = ambushUnits.reduce((s,u)=>s+getUnitTroops(u),0) + ambushLost;
    const vicTr = victimUnits.reduce((s,u)=>s+getUnitTroops(u),0) + victimLost;
    if(ambTr > vicTr){
      const corrected = Math.round(ambushLost * Math.pow(vicTr/ambTr, 0.5));
      ambushLost = Math.min(corrected, victimLost);
    }
    annihilated = applyAnnihilationAmbush(victimUnits, cpRatio);
    ambushUnits.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+Math.floor(rand(8,15))); }));
    victimUnits.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.max(10, sq.morale-Math.floor(rand(15,25))); }));
  } else {
    const {wL, lL} = calcAmbushLossRates(victimATK, victimDEF, ambushATK, ambushDEF);
    ambushLost = applyLoss(ambushUnits, lL);
    victimLost = applyLoss(victimUnits, wL);
    // v85: 兵力比修正
    // ★ v179 fix #57: +xxxLost 必须移出 reduce — 否则按 N 部队加 N 次，导致兵力虚高、修正过度
    const ambTr = ambushUnits.reduce((s,u)=>s+getUnitTroops(u),0) + ambushLost;
    const vicTr = victimUnits.reduce((s,u)=>s+getUnitTroops(u),0) + victimLost;
    if(vicTr > ambTr){
      const corrected = Math.round(victimLost * Math.pow(ambTr/vicTr, 0.5));
      victimLost = Math.min(corrected, ambushLost);
    }
    annihilated = applyAnnihilationAmbush(ambushUnits, cpRatio);
    victimUnits.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+Math.floor(rand(5,12))); }));
    ambushUnits.forEach(u=>u.squads.forEach(sq=>{ sq.morale=Math.max(10, sq.morale-Math.floor(rand(15,25))); }));
  }

  // 经验值：由 applyBattleExp 在战报关闭后统一发放（D2）

  // 清除火攻战力惩罚标记
  clearFireDebuff(victimUnits);

  // 伏击方无论胜负，战后解除 ambush 状态，清空移动指令
  ambushUnits.forEach(u => {
    const curNode = getUnitNodeId(u);
    const curCity = curNode ? G.cities[curNode] : null;
    u.status = (curCity && curCity.fac === u.fac) ? 'garrison' : 'halt';
    u.movePath = curNode ? [curNode] : [];
    u.siegeTarget = null; u._siegeTurnCount = 0; // 清除围城残留
  });

  // 无撤退：败方原地 halt，胜方就地停下，双方均清空移动指令
  const losers  = ambushWins ? victimUnits  : ambushUnits;
  const winners = ambushWins ? ambushUnits  : victimUnits;
  const wiped   = losers.filter(u => u.squads.every(sq => sq.troops <= 0));
  wiped.forEach(u => {
    G.units = G.units.filter(x => x.id !== u.id);
    if(G.selUnitId === u.id) G.selUnitId = null;
    log(`💀 ${u.squads[0]?.genName||'?'}部 在伏击战中全军覆没`, 'battle');
  });
  const survivors = losers.filter(u => u.squads.some(sq => sq.troops > 0));
  survivors.forEach(u => {
    const curNode = getUnitNodeId(u);
    const curCity = curNode ? G.cities[curNode] : null;
    u.status = (curCity && curCity.fac === u.fac) ? 'garrison' : 'halt';
    u.movePath = curNode ? [curNode] : [];
    u.siegeTarget = null; u._siegeTurnCount = 0; // 清除围城残留
  });
  winners.forEach(u => {
    const curNode = getUnitNodeId(u);
    u.movePath = curNode ? [curNode] : [];
  });

  // 小传记录
  const ambushGenName = ambushUnits[0]?.squads[0]?.genName || '?';
  const victimGenName = victimUnits[0]?.squads[0]?.genName || '?';
  if(ambushHit && ambushWins){
    const fireChronicle = (fireResult?.success) ? '，以火攻大破敌军' : '';
    addGenChronicle(ambushGenName, `设伏于险地${fireChronicle}，${victimGenName}部轻进中伏，我军大获全胜，歼敌无算。`);
    addGenChronicle(victimGenName, `行军不慎，中${ambushGenName}伏兵${fireResult?.success?'，遭火攻洗礼':''}，士卒大乱，折损惨重。`);
  } else if(ambushHit && !ambushWins){
    addGenChronicle(ambushGenName, `设伏${victimGenName}部，虽奇袭得手，然战力不足，未竟全功。`);
    addGenChronicle(victimGenName, `遭${ambushGenName}伏击，部众虽乱，主将从容指挥，力挽颓势，转败为胜。`);
  } else if(!ambushHit){
    if(ambushWins){
      addGenChronicle(ambushGenName, `于险地设伏，伏兵虽被识破，然战力占优，仍力战克敌。`);
      addGenChronicle(victimGenName, `识破${ambushGenName}伏兵，奇袭虽未成，然对方战力强盛，仍遭败绩。`);
    } else {
      addGenChronicle(ambushGenName, `于险地设伏，然敌将机警，伏兵泄露，奇袭失效，反遭击败。`);
      addGenChronicle(victimGenName, `${ambushGenName}意图设伏，为我将识破，反将其击退。`);
    }
  }
  if(passiveDuel) {
    const {atkName, defName, outcome} = passiveDuel;
    const atkEntry = outcome==='atkWin'
      ? `伏击战中单挑${defName}，力而胜之。`
      : outcome==='defWin' ? `伏击战中与${defName}交手，不敌而退。`
      : `伏击混战中与${defName}大战数合，不分胜负。`;
    addGenChronicle(atkName, atkEntry);
    const defEntry = outcome==='defWin'
      ? `伏击战中单挑${atkName}，力而胜之。`
      : outcome==='atkWin' ? `伏击战中与${atkName}交手，不敌而退。`
      : `伏击混战中与${atkName}大战数合，不分胜负。`;
    addGenChronicle(defName, defEntry);
  }

  const _ambResult = {
    type: 'ambush',
    ambushHit,
    ambushWins,
    ambushFac: ambushUnits[0].fac,
    victimFac: victimUnits[0].fac,
    ambushNames: ambushUnits.map(u=>u.squads[0]?.genName+'部').join('、'),
    victimNames:  victimUnits.map(u=>u.squads[0]?.genName+'部').join('、'),
    ambushInt, victimInt,
    moralePenalty,
    cpMult: cpMult.toFixed(2),
    victimCom,
    ambushTroops: ambushUnits.reduce((s,u)=>s+getUnitTroops(u),0),
    victimTroops:  victimUnits.reduce((s,u)=>s+getUnitTroops(u),0),
    ambushRoll: Math.round(ambushRoll),
    victimRoll: Math.round(victimRoll),
    ambushLost, victimLost,
    annihilated,
    cpRatio: cpRatio.toFixed(2),
    passiveDuel: passiveDuel || null,
    terrainType:baseTerrain,
    ambushChancePct:Math.round(ambushChance*100),
    fireResult: fireResult || null,
    node: '',  // 由调用方填入
    skillLogs: _ambSkillLogs.length ? _ambSkillLogs : null,
    // ★ v149fix B01: 参战部队ID
    _atkUnitIds: ambushUnits.map(u => u.id).filter(Boolean),
    _defUnitIds: victimUnits.map(u => u.id).filter(Boolean),
  };
  // ★ v125: 清理防守方标记
  [...ambushUnits, ...victimUnits].forEach(u => { delete u._isDefenderThisBattle; });
  return _ambResult;
}

// ═══════════════════════════════════════════════════════
// 🏕 营寨战系统
// ═══════════════════════════════════════════════════════

/**
 * 劫营成功率计算
 * base=0.40 + intDiff×0.012 + atkWar/100×0.15，clamp[0.10, 0.88]
 */
function calcRaidChance(attackers, defenders){
  const atkMaxInt = getMaxInt(attackers);
  const defMaxInt = getMaxInt(defenders);
  const intDiff = atkMaxInt - defMaxInt;
  let atkMaxWar = 60;
  attackers.forEach(u => u.squads.forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if(g && g.war > atkMaxWar) atkMaxWar = g.war;
  }));
  const raw = 0.25 + intDiff * 0.018 + atkMaxWar / 100 * 0.10;
  let chance = Math.min(0.72, Math.max(0.08, raw));
  // SKILL_INLINE: shensuan_nightraid — 诸葛亮神算：劫营成功率±10%
  const atkFid = attackers[0]?.fac;
  const defFid = defenders[0]?.fac;
  if(atkFid && hasFacGen(atkFid, '诸葛亮') && genHasOffice('诸葛亮', atkFid)) chance = Math.min(0.88, chance + 0.10);
  if(defFid && hasFacGen(defFid, '诸葛亮') && genHasOffice('诸葛亮', defFid)) chance = Math.max(0.04, chance - 0.10);
  // SKILL_INLINE: jinfan — 甘宁锦帆：劫营成功率+20%
  const _ganningRaid = attackers.some(u => u.squads.some(sq => sq.genName === '甘宁'));
  if(_ganningRaid) chance = Math.min(0.88, chance + 0.20);
  // TEMPERAMENT: reckless(守方) → 被劫营率+5%；cunning(守方) → 被劫营率-5%
  const _defMainTemper = (GEN_TAGS[defenders[0]?.squads[0]?.genName]||{}).temperament;
  if(_defMainTemper === 'reckless') chance = Math.min(0.88, chance + 0.05);
  if(_defMainTemper === 'cunning')  chance = Math.max(0.04, chance - 0.05);
  // ★ v167: 武将四类 — 谋士标签增加劫营成功率
  const _raidClassBonus = attackers.reduce((sum,u) => sum + getUnitClassBuffs(u).tacticPct, 0);
  if(_raidClassBonus > 0) chance = Math.min(0.88, chance + _raidClassBonus);
  return chance;
}

/**
 * 营寨战结算
 * mode: 'assault'（强攻）| 'raid'（劫营夜袭）
 * 强攻：守方战力×1.10，走完整野战流程
 * 劫营：成功→守方士气-30、战力加成失效，攻方先手×1.10；失败→攻方士气-20、战力×0.80，强制撤退
 */
function resolveCampBattle(attackers, defenders, mode, nodeLabel, useFireAttack){
  const atkFac = attackers[0].fac;
  const defFac = defenders[0].fac;
  const atkNames = attackers.map(u=>u.squads[0]?.genName+'部').join('、');
  const defNames = defenders.map(u=>u.squads[0]?.genName+'部').join('、');

  // SKILL_INLINE: huoying — 陆逊火营：攻camp时守方士气-5
  const _luxunCamp = attackers.some(u => u.squads.some(sq => sq.genName === '陆逊'));
  if(_luxunCamp){
    defenders.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
  }

  // ── 火攻前置处理（劫营和强攻均可用）──
  let fireResult = null;
  const campTerrain0 = attackers[0] ? getTerrainAt(attackers[0].hq||0, attackers[0].hr||0) : 'plain';
  if(useFireAttack && canFireAttack(campTerrain0)){
    const fac = G.factions[atkFac];
    // 二次资源校验：防止弹窗期间资源被其他途径消耗导致负数
    if(fac && (fac.res.gold||0) >= FIRE_COST.gold && (fac.res.wood||0) >= FIRE_COST.wood){
      safeSub(fac.res, 'gold', FIRE_COST.gold);
      safeSub(fac.res, 'wood', FIRE_COST.wood);
      const fireRate = calcFireRate(attackers, defenders);
      const fireSuccess = Math.random() < fireRate;
      if(fireSuccess){
        const curSeason = SEASONS[G.seasonIdx] || '春';
        const effects = applyFireEffect(defenders, campTerrain0, curSeason, attackers);
        fireResult = { success:true, rate:Math.round(fireRate*100), ...effects };
      } else {
        fireResult = { success:false, rate:Math.round(fireRate*100) };
      }
    }
  }

  if(mode === 'raid'){
    const raidChance = calcRaidChance(attackers, defenders);
    const raidRoll = Math.random();
    const raidSuccess = raidRoll < raidChance;

    if(raidSuccess){
      // 劫营成功：守方士气-30（每squad），攻方先手加成×1.10
      // TEMPERAMENT: steady(守方主将) → 士气惩罚-5
      const _raidDefTemper = (GEN_TAGS[defenders[0]?.squads[0]?.genName]||{}).temperament;
      const _raidMoralePen = _raidDefTemper === 'steady' ? 25 : 30;
      defenders.forEach(u => u.squads.forEach(sq => {
        sq.morale = Math.max(10, sq.morale - _raidMoralePen);
      }));
      // 走战斗结算，攻方先手加成通过临时提升 squad 战力模拟（先手乘数记录到报告）
      const campTerrain1 = attackers[0] ? getTerrainAt(attackers[0].hq||0, attackers[0].hr||0) : 'plain';
      const battleReport = resolveBattle(attackers, defenders, campTerrain1);
      battleReport.raidBonus = 1.10; // 记录先手加成（已通过士气差体现）

      // 胜负处理
      const losers  = battleReport.atkWins ? defenders : attackers;
      const winners = battleReport.atkWins ? attackers : defenders;
      const wiped = losers.filter(u=>u.squads.every(sq=>sq.troops<=0));
      wiped.forEach(u=>{
        G.units = G.units.filter(x=>x.id!==u.id);
        if(G.selUnitId===u.id) G.selUnitId=null;
      });
      const survivors = losers.filter(u=>u.squads.some(sq=>sq.troops>0));
      if(survivors.length > 0) doRetreat(survivors, winners, 'partial'); // ★ v101: 传chasers
      winners.forEach(u=>{
        if(u.fac!==G.playerFac){
          const curN=getUnitNodeId(u);
          u.movePath=curN?[curN]:u.movePath;
          u.status=G.cities[curN]?'garrison':'halt';
        }
      });
      // 攻方胜利则营寨被摧毁
      if(battleReport.atkWins){
        defenders.forEach(u=>{
          if(u.status==='camp'){
            const curN=getUnitNodeId(u);
            u.status=G.cities[curN]?'garrison':'halt';
            u.campMobilizeTurns=0;
          }
        });
      }

      // 小传
      const winSide = battleReport.atkWins ? attackers : defenders;
      const loseSide = battleReport.atkWins ? defenders : attackers;
      winSide.forEach(u=>u.squads.forEach(sq=>{
        addGenChronicle(sq.genName, battleReport.atkWins
          ? '趁夜劫营，奇袭得手，破营歼敌，威震三军。'
          : '劫营得手，然守方殊死抵抗，终以落败，铩羽而归。');
      }));
      loseSide.forEach(u=>u.squads.forEach(sq=>{
        addGenChronicle(sq.genName, battleReport.atkWins
          ? '营寨遭夜袭，士卒惊溃，营寨被破，损兵折将。'
          : '营寨遭夜袭，士卒奋力死战，终将敌军击退，保全营垒。');
      }));

      clearFireDebuff(defenders);
      return {
        type: 'camp', mode: 'raid', raidSuccess: true,
        raidChancePct: Math.round(raidChance * 100),
        atkFac, defFac, atkNames, defNames, node: nodeLabel,
        atkWins: battleReport.atkWins,
        atkTroops: battleReport.atkTroops, defTroops: battleReport.defTroops,
        atkLost: battleReport.atkLost, defLost: battleReport.defLost,
        cpRatio: battleReport.cpRatio, annihilated: battleReport.annihilated,
        passiveDuel: battleReport.passiveDuel || null,
        pursued: battleReport.pursued || false,
        fireResult: fireResult || null,
        skillLogs: battleReport.skillLogs || null,
        // ★ v149fix B01: 参战部队ID
        _atkUnitIds: attackers.map(u => u.id).filter(Boolean),
        _defUnitIds: defenders.map(u => u.id).filter(Boolean),
      };
    } else {
      // 劫营失败：攻方士气-20，强制撤退，营寨保留
      // ⑥ 劫营失败ATK/DEF惩罚：通过局部变量降低士气实现（士气-20 → moraleMult下降约0.80）
      attackers.forEach(u => u.squads.forEach(sq => {
        sq.morale = Math.max(10, sq.morale - 20);
      }));
      doRetreat(attackers, defenders, 'partial'); // ★ v101: 传chasers

      // 小传
      attackers.forEach(u=>u.squads.forEach(sq=>{
        addGenChronicle(sq.genName, '夜袭营寨，事泄被觉，功败垂成，狼狈而退。');
      }));
      defenders.forEach(u=>u.squads.forEach(sq=>{
        addGenChronicle(sq.genName, '敌军夜袭，警觉识破，击退来犯，营垒安然无恙。');
      }));

      clearFireDebuff(defenders);
      return {
        type: 'camp', mode: 'raid', raidSuccess: false,
        raidChancePct: Math.round(raidChance * 100),
        atkFac, defFac, atkNames, defNames, node: nodeLabel,
        atkWins: false,
        fireResult: fireResult || null,
        // ★ v149fix B01: 参战部队ID
        _atkUnitIds: attackers.map(u => u.id).filter(Boolean),
        _defUnitIds: defenders.map(u => u.id).filter(Boolean),
      };
    }
  } else {
    // 强攻营寨：守方DEF×1.10（临时_defBonus，只影响防御不影响进攻）
    // SKILL_INLINE: huoying_def — 陆逊火营：削弱扎营方DEF加成（1.10→1.00）
    const _campDefMult = _luxunCamp ? 1.00 : 1.10;
    defenders.forEach(u => u.squads.forEach(sq => {
      sq._defBonus = (sq._defBonus || 1.0) * _campDefMult;
    }));

    const campTerrain2 = attackers[0] ? getTerrainAt(attackers[0].hq||0, attackers[0].hr||0) : 'plain';
    const battleReport = resolveBattle(attackers, defenders, campTerrain2);

    // 还原临时加成标记，清除火攻debuff
    defenders.forEach(u => u.squads.forEach(sq => {
      delete sq._defBonus;
    }));
    clearFireDebuff(defenders);

    // 胜负处理
    const losers  = battleReport.atkWins ? defenders : attackers;
    const winners = battleReport.atkWins ? attackers : defenders;
    const wiped = losers.filter(u=>u.squads.every(sq=>sq.troops<=0));
    wiped.forEach(u=>{
      G.units = G.units.filter(x=>x.id!==u.id);
      if(G.selUnitId===u.id) G.selUnitId=null;
    });
    const survivors = losers.filter(u=>u.squads.some(sq=>sq.troops>0));
    if(survivors.length > 0) doRetreat(survivors, winners, 'partial'); // ★ v101: 传chasers
    winners.forEach(u=>{
      if(u.fac!==G.playerFac){
        const curN=getUnitNodeId(u);
        u.movePath=curN?[curN]:u.movePath;
        u.status=G.cities[curN]?'garrison':'halt';
      }
    });
    // 攻方胜利则营寨被摧毁
    if(battleReport.atkWins){
      defenders.forEach(u=>{
        if(u.status==='camp'){
          const curN=getUnitNodeId(u);
          u.status=G.cities[curN]?'garrison':'halt';
          u.campMobilizeTurns=0;
          log('🏕 ' + (u.squads[0]?.genName||'?') + '部营寨被攻破', 'battle');
        }
      });
    }

    // 小传
    const winSide = battleReport.atkWins ? attackers : defenders;
    const loseSide = battleReport.atkWins ? defenders : attackers;
    winSide.forEach(u=>u.squads.forEach(sq=>{
      addGenChronicle(sq.genName, battleReport.atkWins
        ? '强攻营寨，力克坚垒，摧毁敌营，扬威沙场。'
        : '依托营垒，力挫来犯之敌，营寨守御完固，威名益盛。');
    }));
    loseSide.forEach(u=>u.squads.forEach(sq=>{
      addGenChronicle(sq.genName, battleReport.atkWins
        ? '营寨遭强攻，虽奋力抵抗，终不敌攻方之势，营破军退。'
        : '强攻敌营，攻坚不克，损兵折将，无功而返。');
    }));

    return {
      type: 'camp', mode: 'assault',
      atkFac, defFac, atkNames, defNames, node: nodeLabel,
      atkWins: battleReport.atkWins,
      atkTroops: battleReport.atkTroops, defTroops: battleReport.defTroops,
      atkLost: battleReport.atkLost, defLost: battleReport.defLost,
      cpRatio: battleReport.cpRatio, annihilated: battleReport.annihilated,
      passiveDuel: battleReport.passiveDuel || null,
      activeDuel: battleReport.activeDuel || null,
      fireResult: fireResult || null,
      pursued: battleReport.pursued || false,
      skillLogs: battleReport.skillLogs || null,
      // ★ v149fix B01: 参战部队ID
      _atkUnitIds: attackers.map(u => u.id).filter(Boolean),
      _defUnitIds: defenders.map(u => u.id).filter(Boolean),
    };
  }
}

/**
 * 战斗结算核心
 * attackers/defenders: unit数组（同侧多支合并）
 * 返回详细战报对象
 */
/**
 * D4 连携系统：检测unit内任意一对武将亲密度≥75，触发连携
 * 返回 { triggered:bool, pair:[nameA,nameB], synergyLine:string }
 * 每unit最多触发一次（找到第一对即止）
 */
function checkUnitSynergy(unit){
  const gens = unit.squads.map(sq=>sq.genName).filter(Boolean);
  for(let i=0;i<gens.length;i++){
    for(let j=i+1;j<gens.length;j++){
      if(getIntimacy(gens[i],gens[j]) >= 75){
        return { triggered:true, pair:[gens[i],gens[j]] };
      }
    }
  }
  return { triggered:false };
}

// 连携战报文言文模板
const SYNERGY_LINES = [
  (a,b)=>`${a}、${b}义气相投，协力破敌！`,
  (a,b)=>`${a}与${b}肝胆相照，并肩奋战！`,
  (a,b)=>`${a}、${b}情同手足，连携而战！`,
  (a,b)=>`${a}与${b}心意相通，勇冠三军！`,
];
function getSynergyLine(a,b){
  const idx = (a.charCodeAt(0)+b.charCodeAt(0)) % SYNERGY_LINES.length;
  return SYNERGY_LINES[idx](a,b);
}

function resolveBattle(attackers, defenders, terrain){
  const rand = (lo,hi) => lo + Math.random()*(hi-lo);
  const ter = terrain || 'plain';

  // 带克制+地形的ATK计算（用于胜负判定roll）
  const calcCP = (units, enemyUnits) =>
    units.reduce((s,u) => s + calcUnitATK(u, enemyUnits, ter), 0);

  // 双方兵力
  const atkTroops = attackers.reduce((s,u)=>s+getUnitTroops(u), 0);
  const defTroops = defenders.reduce((s,u)=>s+getUnitTroops(u), 0);

  // ★ 标记攻守方，供REGISTRY技能读取（法正睚眦/司马懿冢虎/魏延反骨）
  defenders.forEach(u => { u._isDefenderThisBattle = true; });
  attackers.forEach(u => { u._isDefenderThisBattle = false; });

  function applyLoss(units, lossRate){
    let totalLost=0;
    units.forEach(unit=>{
      unit.squads.forEach(sq=>{
        const lost = Math.floor(sq.troops * lossRate * rand(0.8,1.2));
        // ★ v163: 部曲战损分配（保护系数0.35）
        const ret = getRetainers(sq.genName);
        if(ret > 0 && sq.troops > 0){
          const retInSq = Math.min(ret, sq.troops);
          const retShare = (retInSq / sq.troops) * RETAINER_PROTECT;
          const retLost = Math.min(retInSq, Math.floor(lost * retShare));
          setRetainers(sq.genName, ret - retLost);
        }
        sq.troops = Math.max(0, sq.troops - lost);
        totalLost += lost;
      });
    });
    return totalLost;
  }

  // v85: 全歼判定——确定性，cpRatio≥3.0必定全歼，无随机
  function applyAnnihilation(losers, ratio){
    if(ratio < 3.0) return false;
    losers.forEach(u=>{ u.squads.forEach(sq=>{ sq.troops=0; setRetainers(sq.genName, 0); }); });
    return true;
  }

  // 士气变化
  function applyMorale(units, delta){
    units.forEach(u=>u.squads.forEach(sq=>{
      sq.morale = Math.max(10, Math.min(100, sq.morale+delta));
    }));
  }

  let atkLost, defLost, annihilated=false;

  // ── 技能触发日志（战报显示用）──
  const _skillLogs = [];

  // ★ v167: 武将四类 — 统帅buff：战斗开始时全军士气+5
  [...attackers, ...defenders].forEach(u => {
    const cb = getUnitClassBuffs(u);
    if(cb.morale > 0){
      u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + cb.morale); });
      const cmdName = u.squads.find(sq => getSquadClass(sq)==='commander')?.genName || '统帅';
      _skillLogs.push({icon:'🏴', gen:cmdName, name:'统帅增幅', desc:`全军士气+${cb.morale}`});
    }
  });

  // SKILL_INLINE: hezhen — 张飞喝阵：直接mutate敌方士气-15，无恢复
  if(hasGenInUnits('张飞', attackers)){
    defenders.forEach(u => u.squads.forEach(sq => {
      sq.morale = Math.max(10, sq.morale - 15);
    }));
    _skillLogs.push({icon:'🗣', gen:'张飞', name:'喝阵', desc:'敌方全体士气-15'});
  }
  if(hasGenInUnits('张飞', defenders)){
    attackers.forEach(u => u.squads.forEach(sq => {
      sq.morale = Math.max(10, sq.morale - 15);
    }));
    _skillLogs.push({icon:'🗣', gen:'张飞', name:'喝阵', desc:'敌方全体士气-15'});
  }

  // SKILL_INLINE: zhijun — 于禁治军：己方全体战前士气+5，无恢复
  if(hasGenInUnits('于禁', attackers)){
    attackers.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
    _skillLogs.push({icon:'🛡', gen:'于禁', name:'治军', desc:'己方全体士气+5'});
  }
  if(hasGenInUnits('于禁', defenders)){
    defenders.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
    _skillLogs.push({icon:'🛡', gen:'于禁', name:'治军', desc:'己方全体士气+5'});
  }

  // SKILL_INLINE: zhangbao_hezhen — 张苞喝阵：敌方全体士气-5
  if(hasGenInUnits('张苞', attackers)){
    defenders.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
    _skillLogs.push({icon:'📣', gen:'张苞', name:'喝阵', desc:'敌方全体士气-5'});
  }
  if(hasGenInUnits('张苞', defenders)){
    attackers.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
    _skillLogs.push({icon:'📣', gen:'张苞', name:'喝阵', desc:'敌方全体士气-5'});
  }

  // SKILL_INLINE: xiaoyi — 关平孝义：与关羽同部队时，关平squad士气+5、ATK×1.05
  [...attackers, ...defenders].forEach(u => {
    const hasGuanyu = u.squads.some(sq => sq.genName === '关羽');
    if(!hasGuanyu) return;
    u.squads.forEach(sq => {
      if(sq.genName === '关平'){
        sq.morale = Math.min(100, sq.morale + 5);
        sq._xiaoyi_atk = 1.05; // 标记，在squadATK中读取
        _skillLogs.push({icon:'🤝', gen:'关平', name:'孝义', desc:'父子同阵，士气+5 ATK+5%'});
      }
    });
  });

  // SKILL_INLINE: xiezhen — 李典协阵：同unit有张辽/乐进时，李典squad ATK/DEF +5%/人
  [...attackers, ...defenders].forEach(u => {
    const hasZhangliao = u.squads.some(sq => sq.genName === '张辽');
    const hasLejin = u.squads.some(sq => sq.genName === '乐进');
    const comboCount = (hasZhangliao ? 1 : 0) + (hasLejin ? 1 : 0);
    if(comboCount > 0){
      u.squads.forEach(sq => {
        if(sq.genName === '李典'){
          const mult = 1 + comboCount * 0.05;
          sq._xiaoyi_atk = (sq._xiaoyi_atk || 1.0) * mult;
          sq._defBonus = (sq._defBonus || 1.0) * mult;
          _skillLogs.push({icon:'🤝', gen:'李典', name:'协阵', desc:`合肥三人组 ATK/DEF+${comboCount*5}%`});
        }
      });
    }
  });

  // SKILL_INLINE: pingyue — 贺齐平越：山地/森林战斗时敌方士气-5
  const _heqiSide = hasGenInUnits('贺齐', attackers) ? 'atk' : hasGenInUnits('贺齐', defenders) ? 'def' : null;
  if(_heqiSide && (ter === 'mountain' || ter === 'hill' || ter === 'forest')){
    const enemy = _heqiSide === 'atk' ? defenders : attackers;
    enemy.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
    _skillLogs.push({icon:'⚡', gen:'贺齐', name:'平越', desc:'山林作战，敌方士气-5'});
  }

  // SKILL_INLINE: taiguan — 庞德抬棺：敌总兵力≥己方×3时，庞德squad ATK/DEF×1.20
  const _pangdeCleanup = [];
  function applyPangde(mySide, enemySide){
    const myTroops = mySide.reduce((s,u)=>s+getUnitTroops(u),0);
    const enTroops = enemySide.reduce((s,u)=>s+getUnitTroops(u),0);
    if(enTroops >= myTroops * 3){
      mySide.forEach(u => u.squads.forEach(sq => {
        if(sq.genName==='庞德'){
          sq._xiaoyi_atk = (sq._xiaoyi_atk||1.0) * 1.20;
          sq._defBonus = (sq._defBonus||1.0) * 1.20;
          _pangdeCleanup.push(sq);
          _skillLogs.push({icon:'⚰', gen:'庞德', name:'抬棺', desc:'决死一战，ATK/DEF+20%'});
        }
      }));
    }
  }
  if(hasGenInUnits('庞德', attackers)) applyPangde(attackers, defenders);
  if(hasGenInUnits('庞德', defenders)) applyPangde(defenders, attackers);

  // SKILL_INLINE: kurou — 黄盖苦肉：squad兵力低于70%时ATK×1.10（★ v167fix #13: 旧条件恒true，改为70%阈值）
  [...attackers, ...defenders].forEach(u => {
    u.squads.forEach(sq => {
      if(sq.genName==='黄盖' && sq.maxTroops && sq.troops < sq.maxTroops * 0.70){
        sq._xiaoyi_atk = (sq._xiaoyi_atk||1.0) * 1.10;
        _skillLogs.push({icon:'🔥', gen:'黄盖', name:'苦肉', desc:'伤痕累累，ATK+10%'});
      }
    });
  });

  // SKILL_INLINE: jingyi_debuff — 王朗经义：对战部队有诸葛亮时，王朗squad士气-20
  const _wanglangMoraleRestore = [];
  function applyWanglangDebuff(mySide, enemySide){
    if(!hasGenInUnits('诸葛亮', enemySide)) return;
    mySide.forEach(u => u.squads.forEach(sq => {
      if(sq.genName==='王朗'){
        const before = sq.morale;
        sq.morale = Math.max(5, sq.morale - 20);
        _wanglangMoraleRestore.push({sq, restore: before - sq.morale});
        _skillLogs.push({icon:'📜', gen:'王朗', name:'经义', desc:'诸葛亮阵前舌辩，士气-20'});
      }
    }));
  }
  if(hasGenInUnits('王朗', attackers)) applyWanglangDebuff(attackers, defenders);
  if(hasGenInUnits('王朗', defenders)) applyWanglangDebuff(defenders, attackers);

  // SKILL_INLINE: hewei — 全琮合围：己方参战units≥2时，全琮unit ATK×1.05（v128 nerf: DEF移除）
  function applyQuancong(mySide){
    if(mySide.length < 2) return;
    mySide.forEach(u => {
      if(u.squads.some(sq=>sq.genName==='全琮')){
        u.squads.forEach(sq => {
          sq._xiaoyi_atk = (sq._xiaoyi_atk||1.0) * 1.05;
        });
        _skillLogs.push({icon:'🏴', gen:'全琮', name:'合围', desc:'协同作战，ATK+5%'});
      }
    });
  }
  applyQuancong(attackers);
  applyQuancong(defenders);

  // SKILL_INLINE: jijiao — 陈宫·犄角：己方units≥2时，陈宫所在unit ATK×1.05
  function applyChenGong(mySide){
    if(mySide.length < 2) return;
    mySide.forEach(u => {
      if(u.squads.some(sq=>sq.genName==='陈宫')){
        u.squads.forEach(sq => {
          sq._xiaoyi_atk = (sq._xiaoyi_atk||1.0) * 1.05;
        });
        _skillLogs.push({icon:'🏴', gen:'陈宫', name:'犄角', desc:'犄角之势，ATK+5%'});
      }
    });
  }
  applyChenGong(attackers);
  applyChenGong(defenders);

  // SKILL_INLINE: congzheng — 韩当·从征：每胜一仗ATK/DEF+0.5%，cap 5%（10胜封顶）
  if(!G.genWinCount) G.genWinCount = {};
  [...attackers, ...defenders].forEach(u => {
    u.squads.forEach(sq => {
      if(sq.genName === '韩当'){
        const wins = Math.min(G.genWinCount['韩当']||0, 10);
        if(wins > 0){
          const bonus = 1 + wins * 0.005;
          sq._xiaoyi_atk = (sq._xiaoyi_atk||1.0) * bonus;
          sq._defBonus = (sq._defBonus||1.0) * bonus;
          _skillLogs.push({icon:'⚔', gen:'韩当', name:'从征', desc:`百战老将(${wins}胜) ATK/DEF+${(wins*0.5).toFixed(1)}%`});
        }
      }
    });
  });

  // ── D4 连携：各unit检测亲密度≥75将领对，触发则士气+8，CP乘数×1.10 ──
  const synergyLogs = [];
  // 记录每个unit的连携乘数，传给后续calcCP
  const synMult = new Map(); // unit -> multiplier
  [...attackers, ...defenders].forEach(unit => {
    const s = checkUnitSynergy(unit);
    if(s.triggered){
      unit.squads.forEach(sq => {
        sq.morale = Math.min(100, sq.morale + 8);
      });
      synMult.set(unit, 1.10);
      synergyLogs.push(getSynergyLine(s.pair[0], s.pair[1]));
    }
  });

  // ── ④ 宿敌同部队惩罚：unit内任意一对亲密度≤-75 → 该unit ATK×0.92、DEF×0.92 ──
  const rivalMult = new Map(); // unit -> multiplier (0.92 if rival pair found)
  [...attackers, ...defenders].forEach(unit => {
    const gens = unit.squads.map(sq=>sq.genName).filter(Boolean);
    let hasRival = false;
    for(let i=0;i<gens.length&&!hasRival;i++){
      for(let j=i+1;j<gens.length&&!hasRival;j++){
        if(getIntimacy(gens[i], gens[j]) <= -75) hasRival = true;
      }
    }
    if(hasRival) rivalMult.set(unit, 0.92);
  });

  // 覆盖局部calcATK以注入连携乘数（胜负判定用ATK roll）
  const calcCPWithSyn = (units, enemyUnits) =>
    units.reduce((s,u) => s + calcUnitATK(u, enemyUnits, ter) * (synMult.get(u)||1.0) * (rivalMult.get(u)||1.0), 0);
  // 防御值（用于损失计算，含地形，含宿敌惩罚）
  const calcDEF = (units) =>
    units.reduce((s,u) => s + calcUnitDEF(u, ter) * (rivalMult.get(u)||1.0), 0);

  // ── 被动单挑（在士气变化之前触发，影响战力）──
  const passiveDuel = tryPassiveDuel(attackers, defenders);
  let passiveCPMult = {atk:1, def:1};
  if(passiveDuel){
    // 单挑结果影响本次战斗双方战力乘数（作用在骰子上）
    if(passiveDuel.outcome==='atkWin'){
      passiveCPMult = {atk:1.12, def:0.88};
    } else if(passiveDuel.outcome==='defWin'){
      passiveCPMult = {atk:0.88, def:1.12};
    }
    // 士气立即变动（影响 moraleMult，从而影响实际 CP roll）
    applyDuelMorale(attackers, defenders, passiveDuel);
  }

  // SKILL_INLINE: weifeng — 张辽威风：临时mutate士气+20，战后恢复
  // ★ v179fix P8: cap 对称——记录每个 squad 实际加的量（避免 morale=90 时加 cap 到 100、战后扣 20 净 -10）
  const _zhangliaoMoraleAdded = [];
  function applyZhangliaoSkill(zhangliaoSide, enemySide){
    const zhangliaoTroops = zhangliaoSide.reduce((s,u)=>s+getUnitTroops(u),0);
    const enemyTroops2    = enemySide.reduce((s,u)=>s+getUnitTroops(u),0);
    if(enemyTroops2 >= zhangliaoTroops * 2){
      zhangliaoSide.forEach(u => {
        if(!hasGenInUnits('张辽', [u])) return;
        u.squads.forEach(sq => {
          const before = sq.morale;
          sq.morale = Math.min(100, sq.morale + 20);
          const added = sq.morale - before; // 实际加的量（被 cap 时小于 20）
          if(added > 0) _zhangliaoMoraleAdded.push({sq, added});
        });
      });
      _skillLogs.push({icon:'🦁', gen:'张辽', name:'威风', desc:'以少敌多，士气+20'});
    }
  }
  if(hasGenInUnits('张辽', attackers)) applyZhangliaoSkill(attackers, defenders);
  if(hasGenInUnits('张辽', defenders)) applyZhangliaoSkill(defenders, attackers);

  // 重新用调整后的士气算最终胜负（passiveDuel 已改了 morale，CP 重算）
  // v61：胜负判定改为 ATK/敌DEF 对比，DEF正式参与判定；随机范围从±15%扩大到±30%
  const atkATK_val = calcCPWithSyn(attackers, defenders);  // 已含连携
  const defATK_val = calcCPWithSyn(defenders, attackers);
  const atkDEF_val = calcDEF(attackers);
  const defDEF_val = calcDEF(defenders);

  // ── 收集Layer 1注册表技能触发日志 ──
  [...attackers, ...defenders].forEach(u => {
    const fxA = applySkills('onCalcATK', {unit: u});
    const fxD = applySkills('onCalcDEF', {unit: u, terrain: ter});
    for (const sk of SKILL_REGISTRY) {
      if (sk.trigger !== 'onCalcATK' && sk.trigger !== 'onCalcDEF') continue;
      try {
        const ctx = sk.trigger === 'onCalcATK' ? {unit: u} : {unit: u, terrain: ter};
        if (!sk.condition(ctx)) continue;
        const fx = sk.effect(ctx);
        const val = fx.multATK || fx.multDEF || 1;
        if (Math.abs(val - 1) < 0.001) continue;
        const pct = val > 1 ? '+' + Math.round((val-1)*100) + '%' : Math.round((val-1)*100) + '%';
        const stat = sk.trigger === 'onCalcATK' ? 'ATK' : 'DEF';
        _skillLogs.push({icon:'⚔', gen: sk.gen, name: sk.name, desc: stat + pct});
      } catch(e) { /* 技能日志收集出错不影响战斗 */ }
    }
  });

  const atkRollFinal = (atkATK_val / Math.max(1, defDEF_val)) * passiveCPMult.atk * rand(0.50,1.50);
  const defRollFinal = (defATK_val / Math.max(1, atkDEF_val)) * passiveCPMult.def * rand(0.50,1.50);
  const atkWins = atkRollFinal >= defRollFinal;
  const cpRatio = atkWins ? atkRollFinal/Math.max(1,defRollFinal) : defRollFinal/Math.max(1,atkRollFinal);

  function calcLossRates(winnerATK, winnerDEF, loserATK, loserDEF){
    const hitOnLoser  = winnerATK / Math.max(1, loserDEF);
    const hitOnWinner = loserATK  / Math.max(1, winnerDEF);
    let lL = 0.28 * Math.pow(hitOnLoser, 0.8) * 1.12;  // 败军溃散+12%
    lL = Math.max(0.12, Math.min(0.65, lL));
    let wL = 0.28 * Math.pow(hitOnWinner, 0.8) * 0.90;  // 胜军士气-10%
    wL = Math.max(0.05, Math.min(0.45, wL));
    return {wL, lL};
  }

  if(atkWins){
    const {wL, lL} = calcLossRates(atkATK_val, atkDEF_val, defATK_val, defDEF_val);
    defLost = applyLoss(defenders, lL);
    atkLost = applyLoss(attackers, wL);
    // v85: 兵力比修正——兵多方赢时，绝对损失乘 √(少方/多方)，且不超过败方损失
    // ★ v179 fix #57: +xxxLost 必须移出 reduce
    const atkTr = attackers.reduce((s,u)=>s+getUnitTroops(u),0) + atkLost; // 战前兵力
    const defTr = defenders.reduce((s,u)=>s+getUnitTroops(u),0) + defLost;
    if(atkTr > defTr){
      const corrected = Math.round(atkLost * Math.pow(defTr/atkTr, 0.5));
      atkLost = Math.min(corrected, defLost);
    }
    annihilated = applyAnnihilation(defenders, cpRatio);
    applyMorale(attackers, +Math.floor(rand(5,12)));
    applyMorale(defenders, -Math.floor(rand(15,30)));
  } else {
    const {wL, lL} = calcLossRates(defATK_val, defDEF_val, atkATK_val, atkDEF_val);
    atkLost = applyLoss(attackers, lL);
    defLost = applyLoss(defenders, wL);
    // v85: 兵力比修正
    // ★ v179 fix #57: +xxxLost 必须移出 reduce
    const atkTr = attackers.reduce((s,u)=>s+getUnitTroops(u),0) + atkLost;
    const defTr = defenders.reduce((s,u)=>s+getUnitTroops(u),0) + defLost;
    if(defTr > atkTr){
      const corrected = Math.round(defLost * Math.pow(atkTr/defTr, 0.5));
      defLost = Math.min(corrected, atkLost);
    }
    annihilated = applyAnnihilation(attackers, cpRatio);
    applyMorale(defenders, +Math.floor(rand(5,12)));
    applyMorale(attackers, -Math.floor(rand(15,30)));
  }

  // 恢复张辽「威风」临时士气加成（★ v179fix P8: 还原"实加量"而非硬编码 20）
  _zhangliaoMoraleAdded.forEach(({sq, added}) => {
    sq.morale = Math.max(10, sq.morale - added);
  });

  // 经验值：由 applyBattleExp 在战报关闭后统一发放（D2）

  // ── 亲密度更新（战斗结束）──
  applyBattleIntimacy(attackers, defenders, atkWins);

  // ── 忠诚度事件（战败方受损）──
  const loserSide = atkWins ? defenders : attackers;
  const loserFid = loserSide[0]?.fac;
  const winnerSide = atkWins ? attackers : defenders;
  const winnerFid = winnerSide[0]?.fac;
  let captureReports = [];
  let deathReports = [];
  if(loserFid){
    const loserTroops = atkWins ? defTroops : atkTroops;
    const loserLost   = atkWins ? defLost   : atkLost;
    const lostRatio = loserTroops > 0 ? Math.min(1, loserLost / loserTroops) : 0;
    if(lostRatio >= 0.2) applyLoyaltyEvent(loserFid, 'battle_loss', {lostRatio});

    // ── A5: 大败战死判定 ──
    if(lostRatio >= BATTLE_DEATH_LOSS){
      loserSide.forEach(u=>{
        u.squads.forEach(sq=>{
          if(!sq.genName) return;
          if(Math.random() < BATTLE_DEATH_CHANCE){
            const result = checkWounded(sq.genName);
            if(result === 'dead'){ killGen(sq.genName, null); deathReports.push(sq.genName); }
          }
        });
      });
    }

    // ── A5: 俘获判定（败方兵损>60%时）──
    if(lostRatio >= 0.60 && winnerFid){
      // 排除已战死的武将
      const eligibleLosers = loserSide.map(u=>({
        ...u, squads: u.squads.filter(sq=>sq.genName && !deathReports.includes(sq.genName))
      }));
      // duelLost = 败方的单挑武将也输了单挑（atkWins时败方=def，def输=atkWin；反之亦然）
      const duelLost = passiveDuel
        ? (atkWins && passiveDuel.outcome==='atkWin') || (!atkWins && passiveDuel.outcome==='defWin')
        : false;
      const prisoners = collectPrisoners(eligibleLosers, 'normal', lostRatio, duelLost, winnerSide);
      if(prisoners.length > 0){
        captureReports = resolvePrisoners(prisoners, winnerFid, winnerFid===G.playerFac);
      }
    }
  }

  // ★ 清除临时战斗标记
  [...attackers, ...defenders].forEach(u => {
    delete u._isDefenderThisBattle;
    // 清除关平孝义/黄盖苦肉/庞德抬棺/全琮合围/韩当从征等临时ATK/DEF标记
    u.squads.forEach(sq => { delete sq._xiaoyi_atk; delete sq._defBonus; });
  });
  // ★ v167fix #21: 庞德抬棺_defBonus冗余清理已删（上方全量delete已覆盖）
  // 王朗经义 士气恢复（临时debuff战后还原）
  _wanglangMoraleRestore.forEach(({sq, restore}) => { sq.morale = Math.min(100, sq.morale + restore); });

  // SKILL_INLINE: congzheng_count — 韩当·从征：胜利计数
  {
    const _winSide = atkWins ? attackers : defenders;
    for(const u of _winSide){
      for(const sq of u.squads){
        if(sq.genName === '韩当'){
          if(!G.genWinCount) G.genWinCount = {};
          G.genWinCount['韩当'] = (G.genWinCount['韩当']||0) + 1;
          break;
        }
      }
    }
  }

  // 技能日志去重（同一gen+name只显示一次）
  const _skillLogsDeduped = [];
  const _skillSeen = new Set();
  _skillLogs.forEach(s => {
    const key = s.gen + s.name;
    if (!_skillSeen.has(key)) { _skillSeen.add(key); _skillLogsDeduped.push(s); }
  });

  return {
    atkWins,
    atkATK:Math.round(atkATK_val), atkDEF:Math.round(atkDEF_val),
    defATK:Math.round(defATK_val), defDEF:Math.round(defDEF_val),
    atkTroops, defTroops, atkLost, defLost, annihilated,
    cpRatio: cpRatio.toFixed(2),
    passiveDuel: passiveDuel || null,
    captureReports, deathReports,
    synergyLogs: synergyLogs.length ? synergyLogs : null,
    skillLogs: _skillLogsDeduped.length ? _skillLogsDeduped : null,
    // ★ v149fix B01: 记录参战部队ID，用于精确发放经验（不再全势力发放）
    _atkUnitIds: attackers.map(u => u.id).filter(Boolean),
    _defUnitIds: defenders.map(u => u.id).filter(Boolean),
  };
}

/**
 * 撤退判断：逃方AP是否显著高于追方（>50%）
 * 同时考虑地形：山地/水乡/雄关 骑兵AP折半（无法发挥机动优势）
 * 逃方有效AP > 追方有效AP × 1.5 → 可以撤退
 */
// ═══════════════════════════════════════════════════════
// ★ v138 水战系统
// ═══════════════════════════════════════════════════════

/** 水战中被清除的SKILL_REGISTRY技能（兵种/地形/陆战AP绑定） */
const NAVAL_BLOCKED_SKILLS = new Set([
  'jinma',        // 马超·锦马（骑兵ATK）
  'jianshou',     // 曹仁·坚守（garrison/camp DEF）
  'hubu_def',     // 夏侯渊·虎步DEF
  'hubu_ap',      // 夏侯渊·虎步AP
  'changqu',      // 徐晃·长驱（行军AP）
  'xianshou',     // 王平·险守（山地DEF）
  'xijing',       // 郭淮·西境（山地DEF）
  'huangxu_atk',  // 曹彰·黄须ATK（骑兵）
  'huangxu_def',  // 曹彰·黄须DEF（骑兵）
  'jiameng_atk',  // 霍峻·葭萌ATK（garrison）
  'jiameng_def',  // 霍峻·葭萌DEF（garrison）
  'guozhan_atk',  // 邓艾·裹毡ATK（山地）
  'guozhan_def',  // 邓艾·裹毡DEF（山地）
  'zhanyan',      // 马岱·斩延（骑兵ATK）
  'qianlijv',     // 曹休·千里驹（骑兵AP）
]);

/**
 * 水战解算 wrapper
 * 核心思路：临时替换squad的type→light + apt读naval，调用原resolveBattle，再还原
 * @param {Array} attackers - 攻方部队数组
 * @param {Array} defenders - 守方部队数组（在水域hex上）
 * @param {boolean} useFireAttack - 是否使用火攻
 * @returns {Object} - resolveBattle的返回对象 + naval标记
 */
function resolveNavalBattle(attackers, defenders, useFireAttack) {
  const allUnits = [...attackers, ...defenders];
  const saved = []; // 保存原始数据用于还原

  // ── 战前：保存并替换 ──
  allUnits.forEach(u => {
    u._isNavalBattle = true; // 标记（供INLINE技能判定）
    u.squads.forEach(sq => {
      saved.push({ sq, origType: sq.type, origXiaoyi: sq._xiaoyi_atk });
      // 所有兵种统一为light数值
      sq.type = 'light';
      sq._navalApt = true; // ★ _squadBase读naval适性
      // 清除兵种绑定的INLINE技能标记
      delete sq._xiaoyi_atk;
    });
  });

  // ── 火攻处理（水域地形） ──
  let fireResult = null;
  if (useFireAttack && canFireAttack('water')) {
    const atkFac = attackers[0]?.fac;
    const fac = atkFac ? G.factions[atkFac] : null;
    if (fac && (fac.res.gold||0) >= FIRE_COST.gold && (fac.res.wood||0) >= FIRE_COST.wood) {
      safeSub(fac.res, 'gold', FIRE_COST.gold);
      safeSub(fac.res, 'wood', FIRE_COST.wood);
      const fireRate = calcFireRate(attackers, defenders);
      const fireSuccess = Math.random() < fireRate;
      if (fireSuccess) {
        const curSeason = SEASONS[G.seasonIdx] || '春';
        const effects = applyFireEffect(defenders, 'water', curSeason, attackers);
        fireResult = { success:true, rate:Math.round(fireRate*100), ...effects };
      } else {
        fireResult = { success:false, rate:Math.round(fireRate*100) };
      }
    }
  }

  // ── 调用原resolveBattle（try/finally确保还原一定执行） ──
  let result;
  try {
    result = resolveBattle(attackers, defenders, 'water');
  } finally {
    // ── 战后：还原（★ v179fix P7：异常时也必须还原，否则squad永久变light） ──
    saved.forEach(({ sq, origType, origXiaoyi }) => {
      sq.type = origType;
      delete sq._navalApt; // ★ v138
      if (origXiaoyi !== undefined) sq._xiaoyi_atk = origXiaoyi;
    });
    allUnits.forEach(u => { delete u._isNavalBattle; });
  }

  // 附加水战标记和火攻结果
  result.isNaval = true;
  result.fireResult = fireResult;
  return result;
}

/**
 * 估算sideA vs sideB的胜率（0~1，>0.5=sideA优势）
 * 复用战斗结算的ATK/DEF公式，不含随机roll
 */
function estimateWinRate(sideA, sideB) {
  const ter = getTerrainAt(sideA[0]?.hq||0, sideA[0]?.hr||0) || 'plain';
  const atkA = sideA.reduce((s,u)=>s+calcUnitATK(u, sideB, ter), 0);
  const defA = sideA.reduce((s,u)=>s+calcUnitDEF(u, ter), 0);
  const atkB = sideB.reduce((s,u)=>s+calcUnitATK(u, sideA, ter), 0);
  const defB = sideB.reduce((s,u)=>s+calcUnitDEF(u, ter), 0);
  const rollBaseA = atkA / Math.max(1, defB);
  const rollBaseB = atkB / Math.max(1, defA);
  if(rollBaseA + rollBaseB <= 0) return 0.5;
  // v88: 蒙特卡洛估算——模拟80次roll比大小，与resolveBattle的rand(0.50,1.50)一致
  let wins = 0;
  const N = 80;
  for(let i = 0; i < N; i++){
    const rA = rollBaseA * (0.50 + Math.random() * 1.00);
    const rB = rollBaseB * (0.50 + Math.random() * 1.00);
    if(rA >= rB) wins++;
  }
  return wins / N;
}

/**
 * v97: 模糊胜率估算（AI侧）
 * 在精确estimateWinRate结果上按己方最高INT武将加噪声
 * INT阈值沿用v95统一规则：90+→±10%, 75-89→±20%, 60-74→±30%, <60→±40%
 */
function fuzzyEstimateWinRate(sideA, sideB, fid) {
  const trueWR = estimateWinRate(sideA, sideB);
  let maxInt = 0;
  sideA.forEach(u => (u.squads || []).forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if (g && g.int > maxInt) maxInt = g.int;
  }));
  const margin = maxInt >= 90 ? 0.10 : maxInt >= 75 ? 0.20 : maxInt >= 60 ? 0.30 : 0.40;
  const noise = (Math.random() * 2 - 1) * margin;
  return Math.max(0, Math.min(1, trueWR + noise));
}

/**
 * AI撤退判定：胜率低才想跑，跑得快才能跑掉
 * @param fleeSide  想要撤退的一方
 * @param chaseSide 追击方
 * @returns true = 成功撤退
 */
/**
 * v87: 撤退追击三档系统
 * 返回 { canRetreat:bool, retreatResult:'full'|'partial'|'failed'|null }
 * full = 完全脱离（退2格，零损失）
 * partial = 部分脱离（退1格，追击损失）
 * failed = 脱离失败（强制交战，士气debuff）
 */
function calcRetreatResult(fleeSide, chaseSide){
  // 叛军永不撤退
  if(fleeSide.some(u => u.fac === 'rebel')) return {canRetreat:false, retreatResult:null};
  // 本旬已撤退过 → 不可再撤
  if(fleeSide.some(u => u._retreatedThisTurn)) return {canRetreat:false, retreatResult:null};

  // 胜率>=35%就不跑（还有一搏之力）
  // SKILL_INLINE: rende_retreat — 刘备仁德：撤退阈值放宽至50%
  const _hasLiuBei = fleeSide.some(u => u.squads.some(sq => sq.genName === '刘备'));
  const _retreatThreshold = _hasLiuBei ? 0.50 : 0.35;
  const winRate = estimateWinRate(fleeSide, chaseSide);
  if(winRate >= _retreatThreshold) return {canRetreat:false, retreatResult:null};

  // 机动力对比
  const battleTerrain = getTerrainAt(fleeSide[0]?.hq ?? 0, fleeSide[0]?.hr ?? 0);
  const restrictedTerrain = battleTerrain === 'mountain' || battleTerrain === 'swamp' ||
    battleTerrain === 'water' || battleTerrain === 'river' || battleTerrain === 'deep_water' || battleTerrain === 'coastal_water';

  function effectiveAP(unit){
    let base = calcUnitAP(unit);
    if(restrictedTerrain && getMainTroopType(unit)==='cavalry') base = Math.floor(base * 0.5);
    // ★ v99: 行军疲劳惩罚——本旬AP消耗越多，撤退机动力越低（最多打5折）
    if(unit._apRemaining !== undefined){
      const fullAP = calcUnitAP(unit);
      const fatigue = fullAP > 0 ? 1 - (unit._apRemaining / fullAP) : 0; // 0~1
      base = Math.round(base * (1 - fatigue * 0.5)); // AP耗尽→打5折
    }
    return Math.max(1, base);
  }

  const fleeAP  = Math.max(...fleeSide.map(effectiveAP));
  const chaseAP = Math.max(...chaseSide.map(effectiveAP));
  const apDiff = fleeAP - chaseAP;

  // 概率表
  let pFull, pPartial, pFail;
  if(apDiff >= 2)      { pFull=0.70; pPartial=0.25; pFail=0.05; }
  else if(apDiff === 1) { pFull=0.40; pPartial=0.45; pFail=0.15; }
  else if(apDiff === 0) { pFull=0.15; pPartial=0.45; pFail=0.40; }
  else if(apDiff === -1){ pFull=0.05; pPartial=0.25; pFail=0.70; }
  else                  { pFull=0.00; pPartial=0.10; pFail=0.90; }

  const roll = Math.random();
  let retreatResult;
  if(roll < pFull)                retreatResult = 'full';
  else if(roll < pFull + pPartial) retreatResult = 'partial';
  else                             retreatResult = 'failed';

  return { canRetreat: retreatResult !== 'failed', retreatResult };
}

// 向后兼容：旧的 canRetreat 签名
function canRetreat(fleeSide, chaseSide){
  return calcRetreatResult(fleeSide, chaseSide).canRetreat;
}

/**
 * 追击损失计算（部分脱离时）
 */
function calcPursuitLoss(fleeSide, chaseSide){
  const fleeTroops = fleeSide.reduce((s,u) => s + getUnitTroops(u), 0);
  const chaseTroops = chaseSide.reduce((s,u) => s + getUnitTroops(u), 0);
  if(fleeTroops <= 0) return 0;

  // ★ v99: 行军疲劳影响追击损失（疲劳部队跑得慢，被追上砍得更多）
  function _fleeEffAP(unit){
    let base = calcUnitAP(unit);
    if(unit._apRemaining !== undefined){
      const fullAP = calcUnitAP(unit);
      const fatigue = fullAP > 0 ? 1 - (unit._apRemaining / fullAP) : 0;
      base = Math.round(base * (1 - fatigue * 0.5));
    }
    return Math.max(1, base);
  }
  const fleeAP = Math.max(...fleeSide.map(_fleeEffAP));
  const chaseAP = Math.max(...chaseSide.map(u => calcUnitAP(u)));

  // 地形修正
  const terrain = getTerrainAt(fleeSide[0]?.hq ?? 0, fleeSide[0]?.hr ?? 0);
  const terrainMult = (terrain === 'plain') ? 1.3
    : (terrain === 'hill') ? 1.0
    : (terrain === 'mountain' || terrain === 'forest') ? 0.7
    : (terrain === 'swamp') ? 0.5
    : 1.0;

  const ratioMult = Math.min(2.0, Math.sqrt(chaseTroops / fleeTroops));
  const apMult = Math.min(1.5, fleeAP > 0 ? chaseAP / fleeAP : 1.5);
  const randomMult = 0.8 + Math.random() * 0.4; // ±20%

  let loss = Math.floor(fleeTroops * 0.06 * ratioMult * apMult * terrainMult * randomMult);
  loss = Math.min(loss, Math.floor(fleeTroops * 0.25)); // cap 25%
  loss = Math.max(loss, 1); // 至少1人
  return loss;
}

/**
 * 撤退执行（重写）
 * @param {Array} units - 撤退方部队
 * @param {Array} chasers - 追击方部队（用于方向计算和追击）
 * @param {string} retreatResult - 'full'|'partial'|'failed'
 */
function doRetreat(units, chasers, retreatResult){
  // 兼容旧调用（无chasers参数时按旧逻辑处理）
  if(!chasers || !retreatResult){
    retreatResult = retreatResult || 'partial';
    chasers = chasers || [];
  }

  let _retreatOrigPos = null; // 记录第一个败方unit的原位置，供胜方前进

  units.forEach(u => {
    if(u.fac === 'rebel'){ u.status = 'halt'; return; }

    const origCol = u.hq, origRow = u.hr;

    // 脱离失败 → 不移动，标记强制交战
    if(retreatResult === 'failed'){
      u.status = 'halt';
      return;
    }

    // 计算撤退方向：远离追击方
    const enemyCenter = chasers.length ? {
      col: Math.round(chasers.reduce((s,e) => s+(e.hq||0), 0) / chasers.length),
      row: Math.round(chasers.reduce((s,e) => s+(e.hr||0), 0) / chasers.length)
    } : null;

    // ★ v99: 撤退距离受AP余量影响——体力充沛跑得更远
    let bonusSteps = 0;
    if(u._apRemaining !== undefined){
      const fullAP = calcUnitAP(u);
      const freshness = fullAP > 0 ? u._apRemaining / fullAP : 0;
      bonusSteps = Math.floor(freshness * 2);
    }
    const baseSteps = retreatResult === 'full' ? 2 : 1;
    const steps = baseSteps + (retreatResult === 'full' ? bonusSteps : Math.floor(bonusSteps / 2));
    for(let step = 0; step < steps; step++){
      const nbs = hexNeighbors(u.hq, u.hr);
      const _retOnWater = isWaterHex(u.hq, u.hr); // ★ v138: 每步判断
      let bestNb = null, bestDist = -1;
      let landFallback = null, landFallbackDist = -1; // ★ v138: 水上退无路时上岸fallback
      for(const nb of nbs){
        const t = HEX_TERRAIN[hkey(nb.col, nb.row)];
        if(t === 'impassable' || t === 'deep_water' || t === 'coastal_water') continue;
        // ★ v102: 排斥所有部队（不只是敌军），防止撤退堆叠
        // ★ v162fix: 突围撤退豁免堆叠检测（拼死冲出）
        const nbCityId = HEX_CITY[hkey(nb.col, nb.row)];
        const isOwnCity = nbCityId && G.cities[nbCityId] && G.cities[nbCityId].fac === u.fac;
        if(!u._breakoutRetreat && !isOwnCity && G.units.some(ou => ou.id !== u.id && ou.hq === nb.col && ou.hr === nb.row)) continue;
        const dist = enemyCenter ? hexDist(nb.col, nb.row, enemyCenter.col, enemyCenter.row) : 0;
        const nbIsWater = WATER_TERRAINS.has(t);
        if(_retOnWater) {
          // 水上撤退：优先走水路
          if(nbIsWater) { if(dist > bestDist){ bestDist = dist; bestNb = nb; } }
          else { if(dist > landFallbackDist){ landFallbackDist = dist; landFallback = nb; } }
        } else if(u._breakoutRetreat) {
          // ★ v162fix: 突围撤退——陆地优先，水路也可接受
          if(!nbIsWater) { if(dist > bestDist){ bestDist = dist; bestNb = nb; } }
          else { if(dist > landFallbackDist){ landFallbackDist = dist; landFallback = nb; } }
        } else {
          // 陆上撤退：不走水路
          if(!nbIsWater && dist > bestDist){ bestDist = dist; bestNb = nb; }
        }
      }
      if(bestNb){
        u.hq = bestNb.col; u.hr = bestNb.row;
      } else if((_retOnWater || u._breakoutRetreat) && landFallback) {
        // ★ v138: 水上退无路→上岸 / v162fix: 突围陆地退无路→入水
        u.hq = landFallback.col; u.hr = landFallback.row;
        break;
      } else if(!_retOnWater) {
        // ★ v146: 陆上退无路（周围全是水域/部队）→ 尝试任意可通行邻居（含水路）作为最终退路
        let anyFallback = null, anyFallbackDist = -1;
        for(const nb of nbs){
          const t = HEX_TERRAIN[hkey(nb.col, nb.row)];
          if(t === 'impassable' || t === 'deep_water' || t === 'coastal_water') continue;
          const nbCityId = HEX_CITY[hkey(nb.col, nb.row)];
          const isOwnCity = nbCityId && G.cities[nbCityId] && G.cities[nbCityId].fac === u.fac;
          if(!isOwnCity && G.units.some(ou => ou.id !== u.id && ou.hq === nb.col && ou.hr === nb.row)) continue;
          // 排除敌城hex（不能退回敌城里）
          if(nbCityId && G.cities[nbCityId] && G.cities[nbCityId].fac !== u.fac && isHostile(u.fac, G.cities[nbCityId].fac)) continue;
          const dist = enemyCenter ? hexDist(nb.col, nb.row, enemyCenter.col, enemyCenter.row) : 0;
          if(dist > anyFallbackDist){ anyFallbackDist = dist; anyFallback = nb; }
        }
        if(anyFallback){
          u.hq = anyFallback.col; u.hr = anyFallback.row;
          break; // 紧急退路，停止继续移动
        } else if(u._breakoutRetreat) {
          // ★ v162fix: 突围最终退路——忽略堆叠限制，允许水路，只排除impassable和敌城
          let lastResort = null, lastResortDist = -1;
          for(const nb of nbs){
            const t = HEX_TERRAIN[hkey(nb.col, nb.row)];
            if(t === 'impassable' || t === 'deep_water' || t === 'coastal_water') continue;
            const nbCityId2 = HEX_CITY[hkey(nb.col, nb.row)];
            if(nbCityId2 && G.cities[nbCityId2] && G.cities[nbCityId2].fac !== u.fac && isHostile(u.fac, G.cities[nbCityId2].fac)) continue;
            const dist = enemyCenter ? hexDist(nb.col, nb.row, enemyCenter.col, enemyCenter.row) : 0;
            if(dist > lastResortDist){ lastResortDist = dist; lastResort = nb; }
          }
          if(lastResort){
            u.hq = lastResort.col; u.hr = lastResort.row;
            break;
          } else break;
        } else break; // 真的无路可退
      } else break; // 无路可退
    }

    // 追击损失（部分脱离）
    if(retreatResult === 'partial' && chasers.length > 0){
      const loss = calcPursuitLoss([u], chasers);
      const totalTroops = u.squads.reduce((s,sq) => s+sq.troops, 0);
      if(totalTroops > 0){
        u.squads.forEach(sq => {
          const sqLoss = Math.floor(loss * sq.troops / totalTroops);
          sq.troops = Math.max(0, sq.troops - sqLoss);
        });
      }
      u.squads.forEach(sq => { sq.morale = Math.max(10, (sq.morale||80) - 8); });
      const genName = u.squads[0]?.genName || '?';
      log(`🏃 ${genName}部撤退被追击，损失${loss}人`, 'battle');
    }

    // 记录第一个撤退者的原位置（供胜方前进用）
    if(!_retreatOrigPos) _retreatOrigPos = { col: origCol, row: origRow };

    u.hexPath = [];
    u.movePath = [];
    u.status = 'halt';
    u._retreatedThisTurn = true; // 本旬已撤退，不可再撤
  });

  // ★ v102: 胜方前进到败方原位置（移到forEach外，只执行一次，加堆叠检查）
  if(_retreatOrigPos && chasers.length > 0 && (retreatResult === 'full' || retreatResult === 'partial')){
    const chaser = chasers[0];
    const oc = _retreatOrigPos.col, or = _retreatOrigPos.row;
    if(chaser && (chaser.hq !== oc || chaser.hr !== or)){
      const origKey = hkey(oc, or);
      const origTerrain = HEX_TERRAIN[origKey];
      if(origTerrain && origTerrain !== 'impassable' && origTerrain !== 'deep_water' && origTerrain !== 'coastal_water'){
        const origCityId = HEX_CITY[origKey];
        const origCity = origCityId ? G.cities[origCityId] : null;
        const isHostileCity = origCity && origCity.fac !== chaser.fac && origCity.fac !== 'none' && isHostile(chaser.fac, origCity.fac);
        // 堆叠检查：目标hex不能有其他部队（己方城市hex除外）
        const isOwnCity = origCity && origCity.fac === chaser.fac;
        const hasUnit = G.units.some(ou => ou.id !== chaser.id && ou.hq === oc && ou.hr === or);
        if(!isHostileCity && (!hasUnit || isOwnCity)){
          chaser.hq = oc; chaser.hr = or;
        }
      }
    }
  }
}

// 待显示的战报队列（每旬可能多场战斗）
let _battleReports = [];
// 外交链 D6 (顶层 lets _pendingPeaceOffer / _pendingVassalOffer,L17542-L17543) 已抽离到 src/chains/diplomacy.js
let _currentBattleReport = null;  // D2：当前显示的战报，关闭时发放经验

// ─── 武将技能辅助函数 ────────────────────────────────────

/** 检测将领是否在给定部队列表中 */
function hasGenInUnits(genName, units){
  return units.some(u => u.squads.some(sq => sq.genName === genName));
}

/** 检测势力在役将领（势力级技能用）
 *  在役 = 存在于 G.generals[fid] 中（含驻守+出征，排除下野/被俘） */
function hasFacGen(fid, genName){
  const gens = G.generals?.[fid];
  if(!gens) return false;
  return gens.some(g => g.name === genName);
}

// ════════════════════════════════════════════════════════════════════
// ── M_LET _pendingBattleAnimations (v181 L13467) ──
// ════════════════════════════════════════════════════════════════════

let _pendingBattleAnimations = [];

// ════════════════════════════════════════════════════════════════════
// ── MIL7.a autoResolvePendingBattle + 3 lets + _checkSiegeArrival (v181 L15991-L16107) ──
// ════════════════════════════════════════════════════════════════════

function autoResolvePendingBattle(conf){
  if(!conf) return;
  const { playerSide, enemySide, nodeLabel, campBattle, campRole,
          siegeBattle, siegeCity, siegeInterdict } = conf;
  _duelChallenger = null;

  if(conf.ambushBattle){
    // 伏击战：快进时不使用火攻（避免资源消耗）
    const r = resolveAmbush(playerSide, enemySide, conf.ambushTerrain, false);
    r.node = nodeLabel; _battleReports.push(r);
  } else if(siegeBattle && siegeCity){
    // ★ v130fix: 攻城战——根据playerIsAttacker决定攻守方向
    if(conf.playerIsAttacker === false){
      // 玩家是守方：enemySide是攻方，playerSide是守方
      const r = resolveSiegeBattle(enemySide, playerSide, siegeCity, nodeLabel);
      if(r){ r.playerWasAttacker = false; _battleReports.push(r); }
    } else {
      const r = resolveSiegeBattle(playerSide, enemySide, siegeCity, nodeLabel);
      if(r){ r.playerWasAttacker = true; _battleReports.push(r); }
    }
  } else if(campBattle && campRole==='attacker'){
    // 营寨战：直接强攻（快进时不劫营，规避概率波动）
    const r = resolveCampBattle(playerSide, enemySide, 'assault', nodeLabel);
    r.playerWasAttacker = true; _battleReports.push(r);
  } else {
    // 普通野战 / siegeInterdict：直接迎战
    const ffAtk = (conf.playerIsAttacker !== false) ? playerSide : enemySide;
    const ffDef = (conf.playerIsAttacker !== false) ? enemySide : playerSide;
    _resolveBattleEngagement(ffAtk, ffDef, nodeLabel, null);
  }
}

/**
 * 每旬移动结算后，检测所有接触触发战斗
 */
// 待确认的玩家战斗队列
let _pendingBattleConfirms = [];
let _currentBattleConfirm = null;

// ★ v86: 围城到达弹窗
let _pendingSiegeArrival = null; // { unitId, cityId }

function _checkSiegeArrival(){
  if(!_pendingSiegeArrival) return;
  const { unitId, cityId } = _pendingSiegeArrival;
  _pendingSiegeArrival = null;
  const unit = G.units.find(u => u.id === unitId);
  const city = G.cities[cityId];
  if(!unit || !city || city.fac === unit.fac) return;
  if(unit.status !== 'siege') return; // 已被其他逻辑改变

  const cityDef = CITY_MAP[cityId];
  const defMult = getSiegeDefMult(city);
  const maxTurns = SIEGE_MAX_TURNS[city.size||'medium'] || 9;
  const decayPct = Math.round((city.siegeDecay||0)*100);
  const turnsToFull = Math.max(0, Math.ceil((1-(city.siegeDecay||0))*maxTurns));

  // 收集攻守方（与launchSiegeAttack一致）
  const attackers = G.units.filter(u => {
    if(u.fac !== unit.fac) return false;
    if(u.status === 'siege' && u.siegeTarget === cityId) return true;
    if(!cityDef) return false;
    return hexDist(u.hq??0, u.hr??0, cityDef.q, cityDef.r) <= 2 &&
      (u.status === 'halt' || u.status === 'garrison');
  });
  const defenders = G.units.filter(u => {
    if(u.fac !== city.fac) return false;
    return getUnitNodeId(u) === cityId;
  });
  const atkTroops = attackers.reduce((s,u) => s + getUnitTroops(u), 0);
  const defTroops = defenders.reduce((s,u) => s + getUnitTroops(u), 0) + (city.garrison||0);
  const winRate = _aiFuzzySiegeWinRate(attackers, cityId, G.playerFac);
  const wrDesc = winRate >= 0.7 ? '胜券在握' : winRate >= 0.55 ? '略占上风' : winRate >= 0.45 ? '势均力敌' : winRate >= 0.3 ? '形势不利' : '凶多吉少';
  const wrCol = winRate >= 0.55 ? '#1a8a45' : winRate >= 0.4 ? '#8a7030' : '#b04040';
  const defMultCol = defMult<=1.05?'#1a8a45':defMult<=1.15?'#8a7030':'#e07040';

  const gname = unit.squads[0]?.genName||'?';

  // 弹窗
  const modal = document.createElement('div');
  modal.id = 'siegeArrivalModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:900';
  modal.innerHTML = `
    <div style="background:rgba(245,238,225,.98);border:2px solid rgba(92,74,50,.5);padding:20px 24px;max-width:380px;width:90%;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12)">
      <div style="font-family:'Noto Serif SC',serif;font-size:14px;color:rgba(44,36,22,.90);font-weight:700;margin-bottom:12px;letter-spacing:1px">
        🏰 ${gname}部 兵临${city.name}城下
      </div>
      <div style="font-size:10px;color:rgba(44,36,22,.55);line-height:2;margin-bottom:12px">
        攻方兵力 <b style="color:rgba(44,36,22,.80)">${atkTroops>=10000?(atkTroops/10000).toFixed(1)+'万':fmt(atkTroops)}</b>
        &emsp;守方兵力 <b style="color:rgba(44,36,22,.80)">${defTroops>=10000?(defTroops/10000).toFixed(1)+'万':fmt(defTroops)}</b><br>
        城防加成 <b style="color:${defMultCol}">×${defMult.toFixed(2)}</b>
        &emsp;攻城胜算 <b style="color:${wrCol}">${wrDesc}</b><br>
        ${decayPct<100 ? '围满城防约需 <b style="color:#8a7030">'+turnsToFull+'旬</b>，围久城防越弱' : '城防已瓦解，可直接进攻'}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button onclick="_siegeArrivalChoice('attack')"
          style="padding:10px;font-family:'Noto Serif SC',serif;font-size:12px;font-weight:700;color:#c03030;
          background:rgba(192,48,48,.12);border:2px solid rgba(192,48,48,.35);border-radius:6px;
          cursor:pointer;letter-spacing:1px">
          ⚔ 直接攻城
        </button>
        <button onclick="_siegeArrivalChoice('siege')"
          style="padding:10px;font-family:'Noto Serif SC',serif;font-size:12px;font-weight:700;
          color:rgba(44,36,22,.85);background:rgba(80,65,40,.08);border:1px solid rgba(92,74,50,.4);
          border-radius:6px;cursor:pointer;letter-spacing:1px">
          🏰 围而不攻
        </button>
      </div>
      <div style="font-size:9px;color:rgba(92,74,50,.35);text-align:center;margin-top:8px">
        围城期间城防逐渐衰减，攻城难度降低
      </div>
    </div>`;
  document.body.appendChild(modal);

  // 存储上下文
  modal._ctx = { unitId, cityId, attackers, defenders };
}

// ════════════════════════════════════════════════════════════════════
// ── MIL7.b 11 funcs + 2 lets (v181 L16145-L17027) ──
// ════════════════════════════════════════════════════════════════════

function calcBreakoutChance(unit){
  // SKILL_INLINE: elai_breakout — 典韦恶来：同队突围必成功
  if(unit.squads.some(sq => sq.genName === '典韦')) return 1.0;
  let mainCom = 60, mainWar = 60;
  unit.squads.forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if(g){ if(g.com > mainCom) mainCom = g.com; if(g.war > mainWar) mainWar = g.war; }
  });
  const raw = 0.30 + (mainCom - 50) / 100 * 0.25 + (mainWar - 50) / 100 * 0.15;
  return Math.min(0.65, Math.max(0.10, raw));
}

// ─── 攻城战结算 ───
function resolveSiegeBattle(attackers, defenders, city, nodeLabel){
  if(!attackers.length) return null;
  const atkFac = attackers[0].fac;
  // defenders 可能为空（守城方只有城防军无野战部队）
  const defFac = defenders.length ? defenders[0].fac : city.fac;
  const atkNames = attackers.map(u => u.squads[0]?.genName + '部').join('、');
  const defNames = defenders.length ? defenders.map(u => u.squads[0]?.genName + '部').join('、') : city.name + '守军';

  const _rawDefMult = getSiegeDefMult(city);
  // SKILL_INLINE: jushu — 郝昭拒蜀：守方有郝昭时城防倍率+0.15
  const _haozhaoInDef = defenders.some(u => u.squads.some(sq => sq.genName==='郝昭'));
  const defMult = _haozhaoInDef ? _rawDefMult + 0.15 : _rawDefMult;

  // SKILL_INLINE: zuoduan_def — 孙权坐断：当官时江东己方城市garrison部队守城DEF+5%
  const _sunquanFac = (() => {
    for(const f of ALL_FACS){ if(hasFacGen(f,'孙权') && genHasOffice('孙权',f)) return f; }
    return null;
  })();
  const _zuoduanActive = _sunquanFac && city.fac === _sunquanFac && isJiangdong(city.id);
  const size = city.size || 'medium';

  // 城防军作为虚拟 unit 参与守城结算（morale 联动城市民心，低民心一触即溃）
  let garrisonUnit = null;
  if(city.garrison > 0){
    const garMorale = Math.max(10, Math.min(100, Math.round(city.morale * 0.8) + getGentryMoraleMod(city.id))); // ★ I2: 豪族士气修正
    garrisonUnit = {
      id: '_garrison_' + city.id,
      fac: defFac,
      status: 'garrison',
      movePath: [city.id],
      squads: [{
        genName: city.name + '守军',
        type: 'heavy',
        troops: city.garrison,
        maxTroops: city.garrison,
        morale: garMorale,
        level: 3, // v109G: 城防lv1→3（常驻守军有基本训练）
        apt: { cavalry:'C', light:'B', heavy:'B', archer:'C', siege:'C' },
      }],
      _isGarrisonUnit: true,
    };
    defenders = defenders.concat([garrisonUnit]);
  }

  // ★ v167: 武将四类 — 统帅buff（攻城战双方均适用）
  [...attackers, ...defenders].forEach(u => {
    const cb = getUnitClassBuffs(u);
    if(cb.morale > 0) u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + cb.morale); });
  });

  // SKILL_INLINE: xiandeng — 乐进先登：攻城临时士气+18，战后恢复
  const _lejinMoraleAdded = [];
  if(hasGenInUnits('乐进', attackers)){
    attackers.forEach(u => u.squads.forEach(sq => {
      sq.morale = Math.min(100, sq.morale + 18);
      _lejinMoraleAdded.push(sq);
    }));
  }

  // SKILL_INLINE: qiaosi_atk — 刘晔巧思：当官时攻城部队ATK+5%
  const _liuyeAtkMult = (atkFac && hasFacGen(atkFac, '刘晔') && genHasOffice('刘晔', atkFac)) ? 1.05 : 1.0;
  if(_liuyeAtkMult > 1) attackers.forEach(u => u.squads.forEach(sq => { sq._xiaoyi_atk = (sq._xiaoyi_atk || 1.0) * _liuyeAtkMult; }));

  // SKILL_INLINE: yicheng — 徐盛·疑城：守城战时攻城方部队ATK×0.95
  {
    let _hasXusheng = false;
    for(const u of defenders){ if(u.squads.some(s => s.genName==='徐盛')){ _hasXusheng=true; break; } }
    if(_hasXusheng){
      attackers.forEach(u => u.squads.forEach(sq => { sq._xiaoyi_atk = (sq._xiaoyi_atk||1.0) * 0.95; }));
    }
  }

  // SKILL_INLINE: zhenjing — 文聘·镇荆：荆州城市守城时守方DEF×1.20
  const _wenpin = defenders.some(u => u.squads.some(sq => sq.genName==='文聘'));
  const _wenpinActive = _wenpin && isJingzhou(city.id);
  if(_wenpinActive){
    defenders.forEach(u => u.squads.forEach(sq => {
      sq._defBonus = (sq._defBonus || 1.0) * 1.20;
    }));
  }

  // 守方临时增加城防加成（作用于DEF，不影响ATK）
  defenders.forEach(u => u.squads.forEach(sq => {
    let mult = defMult;
    // SKILL_INLINE: zuoduan_def — 孙权坐断：江东己方garrison DEF+5%
    if(_zuoduanActive && u.status === 'garrison') mult *= 1.05;
    sq._defBonus = (sq._defBonus || 1.0) * mult; // v129fix: 乘法累积，保留文聘镇荆等先设置的_defBonus
  }));

  // 攻城战地形固定为 plain（城市节点）
  const battleReport = resolveBattle(attackers, defenders, 'plain');

  // 乐进先登日志注入（resolveBattle不感知siege context）
  if(hasGenInUnits('乐进', attackers)){
    if(!battleReport.skillLogs) battleReport.skillLogs = [];
    battleReport.skillLogs.unshift({icon:'🪜', gen:'乐进', name:'先登', desc:'攻城士气+18'});
  }
  // 郝昭拒蜀日志
  if(_haozhaoInDef){
    if(!battleReport.skillLogs) battleReport.skillLogs = [];
    battleReport.skillLogs.unshift({icon:'🏯', gen:'郝昭', name:'拒蜀', desc:'城防加成+0.15'});
  }
  // 孙权坐断日志
  if(_zuoduanActive){
    if(!battleReport.skillLogs) battleReport.skillLogs = [];
    battleReport.skillLogs.unshift({icon:'👑', gen:'孙权', name:'坐断', desc:'江东守城DEF+5%'});
  }
  // 徐盛疑城日志
  if(defenders.some(u => u.squads.some(s => s.genName==='徐盛'))){
    if(!battleReport.skillLogs) battleReport.skillLogs = [];
    battleReport.skillLogs.unshift({icon:'🏯', gen:'徐盛', name:'疑城', desc:'攻城方ATK-5%'});
  }
  // 文聘镇荆日志
  if(_wenpinActive){
    if(!battleReport.skillLogs) battleReport.skillLogs = [];
    battleReport.skillLogs.unshift({icon:'🏰', gen:'文聘', name:'镇荆', desc:'荆州守城DEF+20%'});
  }

  // 还原临时加成
  defenders.forEach(u => u.squads.forEach(sq => {
    delete sq._defBonus;
  }));
  // SKILL_INLINE: xiandeng restore
  _lejinMoraleAdded.forEach(sq => {
    sq.morale = Math.max(10, sq.morale - 18);
  });

  const losers  = battleReport.atkWins ? defenders : attackers;
  const winners = battleReport.atkWins ? attackers : defenders;

  // 虚拟守城 unit 战后：按兵力损耗同步回写 garrison，然后移除
  if(garrisonUnit){
    const sqAfter = garrisonUnit.squads[0];
    const remaining = sqAfter ? sqAfter.troops : 0;
    city.garrison = remaining;  // 守城伤亡扣减（攻方赢则下面直接清零）
  }

  if(battleReport.atkWins){
    // 攻方胜利：城市易主
    const oldFac = city.fac;
    city.fac = atkFac;
    // ★ v132 F3/G3: 城市易手记录
    if(!G._cityChangeLog) G._cityChangeLog=[];
    G._cityChangeLog.push({turn:G.turn, cityId:city.id, from:oldFac, to:atkFac});
    invalidateCityCache(); // ★ v117fix: 城市易主即刻刷新地图颜色
    if(city.billetPool && city.billetPool.length){
      log(`💀 ${city.name}失守，${city.billetPool.length}支屯田兵员溃散`, 'event');
      city.billetPool = [];
    }
    // ★ C3: 城市易手追踪 + 天子易主检测
    trackCityLoss(city.id, oldFac, atkFac);
    checkEmperorCapture(city.id, oldFac, atkFac);
    applyGentryOnCapture(city.id, atkFac, oldFac); // ★ I2: 豪族支持度
    city.siegeDecay = 0;
    city.garrison = 0;
    // ★ v113: 占领期按宣称强度分档
    // ★ batch-21 D-026: rebel 城收复短期消化档(3 旬,科技 occupiedMult 仍生效)
    const _warStr = G._warClaimStrength?.[`${atkFac}-${oldFac}`] || 'none';
    const _occMap = { strong: 3, medium: 12, weak: 18, none: 27 };
    const _occBase = oldFac === 'rebel' ? 3 : (_occMap[_warStr] ?? 18);
    city.occupied = Math.max(1, Math.floor(_occBase * (1 + getTechEffect(atkFac, 'occupiedMult')))); // ★ v115: 士族联姻
    // ★ v113: 强宣称→义兵buff（9旬征兵费-30%）
    if(_warStr === 'strong') city._yibingBuff = { expiresAt: G.turn + 9 };
    city.prefect = null; // 易主时清除旧太守（敌将不能继续担任太守）
    city._supplyRestoreTurns = SUPPLY_CITY_RESTORE_TURNS; // v88: 新占城市需恢复才能提供补给
    _aiInvalidateThreatCache(); // ★ GT1: 城市易主 → 刷新威胁缓存

    // C4: 城市易主时更新所有参战方的迷雾快照
    updateFogCitySnapshot(city.id, atkFac);

    // 占城扣外交友好度（rebel 不触发）— ★ C3修正：从-20降为-8
    if(oldFac && oldFac !== 'rebel' && atkFac !== 'rebel') addDiplo(atkFac, oldFac, -8);
    // 共同抗敌加成：占领共同敌人的城市，与盟友/友方友好度+2
    if(oldFac && oldFac !== 'rebel' && atkFac !== 'rebel') applyCommonEnemyDiploBonus(atkFac, oldFac, 2);
    // ★ B1 占领新城事件：鹰派+3
    if(atkFac && ALL_FACS.includes(atkFac)) triggerFactionEvent('conquer', atkFac, {});
    // ★ D1: 攻城方全员功绩+10
    attackers.forEach(u=>u.squads.forEach(sq=>{ if(sq.genName) addMerit(sq.genName, 10); }));
    // ★ v151: 攻克城池 → 方略偏扩张
    applyEthosShock(atkFac, 'strategy', 4, '攻克城池');
    // ★ v151: AI自动选择攻城后处置
    if(atkFac !== G.playerFac){
      const aiEth = G.factions[atkFac]?.ethos;
      const aiMil = aiEth ? aiEth.military : 0;
      const aiChoice = aiMil > 60 ? 'massacre' : aiMil > 30 ? 'loot' : 'pacify';
      _applySiegeAftermath(city.id, atkFac, aiChoice);
    }

    // 失城不触发忠诚惩罚（战场胜负是士气问题，不是忠诚问题）
    // 忠诚惩罚仅在大乱（_triggerMajorRebellion）时触发

    // 城内守方野战部队触发突围判定
    // ★ v126fix: 排除已在resolveBattle中被俘获的武将（避免双重俘获）
    const _alreadyCaptured = new Set((battleReport.captureReports||[]).map(p=>p.name));
    const cityDefUnits = defenders.filter(u => {
      const nodeId = getUnitNodeId(u);
      return nodeId === city.id;
    });
    const breakoutReports = [];
    cityDefUnits.forEach(u => {
      const chance = calcBreakoutChance(u);
      const success = Math.random() < chance;
      const gname = u.squads[0]?.genName || '?';
      if(success){
        // 突围成功：损失25%~40%兵力后撤退
        const lossRate = 0.25 + Math.random() * 0.15;
        u.squads.forEach(sq => { sq.troops = Math.max(0, Math.floor(sq.troops * (1 - lossRate))); });
        u._breakoutRetreat = true; // ★ v162fix: 标记突围撤退，放宽退路规则
        doRetreat([u], attackers, 'full'); // ★ v162fix: 传入围城方为chasers，full=不受追击额外损失
        delete u._breakoutRetreat;
        breakoutReports.push({name: gname, success: true, lossRate: Math.round(lossRate * 100)});
        log('🏃 ' + gname + '部 突围成功，损失' + Math.round(lossRate * 100) + '%兵力', 'battle');
        addGenChronicle(gname, '城破之际，力战突围，损兵' + Math.round(lossRate * 100) + '%，保全部分兵力撤退。');
      } else {
        // 突围失败：全军覆没
        u.squads.forEach(sq => { sq.troops = 0; });
        G.units = G.units.filter(x => x.id !== u.id);
        if(G.selUnitId === u.id) G.selUnitId = null;
        breakoutReports.push({name: gname, success: false, lossRate: 100});
        log('💀 ' + gname + '部 突围失败，全军覆没', 'battle');
        addGenChronicle(gname, '城破，突围失败，全军覆没，身陷重围。');
        // A5: 城内突围失败的武将进入俘获判定（+30%加成）
        u.squads.forEach(sq => {
          if(!sq.genName) return;
          if(_alreadyCaptured.has(sq.genName)) return; // ★ v126fix: 已在战斗中被俘，跳过
          const captureRate = Math.min(CAPTURE_RATE_CAP, calcCaptureRate('city_fall', 1.0));
          if(Math.random() < captureRate){
            const rpts = resolvePrisoners([sq.genName], atkFac, atkFac===G.playerFac);
            if(rpts.length) breakoutReports.forEach(r=>{});  // 已有报告，不额外记录
            log('⛓ ' + sq.genName + '被' + (FAC[atkFac]?.name||atkFac) + '俘获', 'battle');
          }
        });
      }
    });

    // 攻方siege部队进城变garrison
    const siegeAttackers = attackers.filter(u => u.status === 'siege');
    siegeAttackers.forEach(u => {
      u.status = 'garrison';
      u.siegeTarget = null;
      u._siegeTurnCount = 0;
      u._apRemaining = 0; // ★ v146: 攻城胜利后AP清零，不可继续行军
      const cityDef = CITY_MAP[city.id];
      if(cityDef){ u.hq = cityDef.q; u.hr = cityDef.r; }
    });
    // 其他攻方（非siege野战部队）也停下来
    winners.forEach(u => {
      if(u.status !== 'garrison'){
        if(u.fac !== G.playerFac){
          const curN = getUnitNodeId(u);
          u.movePath = curN ? [curN] : u.movePath;
          u.status = G.cities[curN] ? 'garrison' : 'halt';
        }
      }
    });

    // 小传
    attackers.forEach(u => u.squads.forEach(sq => {
      addGenChronicle(sq.genName, '围攻' + city.name + '（城防×' + defMult.toFixed(2) + '），攻城克捷，占领城池，威震天下。');
    }));

    return {
      type: 'siege', atkFac, defFac, atkNames, defNames, node: nodeLabel,
      cityName: city.name, citySize: size,
      atkWins: true, defMult,
      atkTroops: battleReport.atkTroops, defTroops: battleReport.defTroops,
      atkLost: battleReport.atkLost, defLost: battleReport.defLost,
      passiveDuel: battleReport.passiveDuel || null,
      breakoutReports,
      annihilated: battleReport.annihilated,
      skillLogs: battleReport.skillLogs || null,
      // ★ v149fix B01: 参战部队ID
      _atkUnitIds: attackers.map(u => u.id).filter(Boolean),
      _defUnitIds: defenders.map(u => u.id).filter(Boolean),
      _siegeAftermathCityId: (atkFac === G.playerFac) ? city.id : null, // ★ v151
    };
  } else {
    // 攻方败退：siege状态解除，清除围城状态
    const wiped = losers.filter(u => u.squads.every(sq => sq.troops <= 0));
    wiped.forEach(u => {
      G.units = G.units.filter(x => x.id !== u.id);
      if(G.selUnitId === u.id) G.selUnitId = null;
    });
    const survivors = losers.filter(u => u.squads.some(sq => sq.troops > 0));
    if(survivors.length > 0) doRetreat(survivors, winners, 'partial'); // ★ v101: 传chasers
    survivors.forEach(u => {
      u.status = u.status === 'siege' ? 'halt' : u.status;
      u.siegeTarget = null;
      u._siegeTurnCount = 0;
    });

    // 小传
    attackers.forEach(u => u.squads.forEach(sq => {
      addGenChronicle(sq.genName, '攻城' + city.name + '（城防×' + defMult.toFixed(2) + '），力战不克，撤围退兵。');
    }));
    defenders.forEach(u => u.squads.forEach(sq => {
      addGenChronicle(sq.genName, '坚守' + city.name + '，击退攻城之敌，城防稳固，威名益盛。');
    }));

    return {
      type: 'siege', atkFac, defFac, atkNames, defNames, node: nodeLabel,
      cityName: city.name, citySize: size,
      atkWins: false, defMult,
      atkTroops: battleReport.atkTroops, defTroops: battleReport.defTroops,
      atkLost: battleReport.atkLost, defLost: battleReport.defLost,
      passiveDuel: battleReport.passiveDuel || null,
      breakoutReports: [],
      annihilated: battleReport.annihilated,
      skillLogs: battleReport.skillLogs || null,
      // ★ v149fix B01: 参战部队ID
      _atkUnitIds: attackers.map(u => u.id).filter(Boolean),
      _defUnitIds: defenders.map(u => u.id).filter(Boolean),
    };
  }
}

// ★ v100: 战斗参战方收集（共享逻辑，AI和玩家通用）
// aggressorUnit: 发起攻击的部队
// 返回 { attackers, defenders, defFac } 或 null（无敌军接触）
//
// 收集规则：
//   守方 = 与发起者相邻的敌军 + 这些敌军各自1格内的同阵营友军（守方支援）
//   攻方 = 与发起者相邻的友军（攻方支援）+ 与任一守方单位相邻的友军（围攻/夹击）
function collectBattleSides(aggressorUnit) {
  const allUnits = G.units.filter(u => u.squads.some(s => s.troops > 0));
  const fid = aggressorUnit.fac;

  // 第一步：找与发起者直接接触的敌军（种子守方）
  const seedEnemies = allUnits.filter(u =>
    u.fac !== fid &&
    isHostile(fid, u.fac) &&
    u.status !== 'ambush' &&
    unitsContact(aggressorUnit, u)
  );
  if(!seedEnemies.length) return null;

  const defFac = seedEnemies[0].fac;

  // 第二步：守方扩展——种子敌军各自1格内的同阵营友军
  const defenderSet = new Set(seedEnemies.filter(u => u.fac === defFac).map(u => u.id));
  seedEnemies.filter(u => u.fac === defFac).forEach(eu => {
    allUnits.forEach(u => {
      if(u.fac === defFac && !defenderSet.has(u.id) &&
         u.status !== 'ambush' &&
         unitsContact(eu, u)) {
        defenderSet.add(u.id);
      }
    });
  });
  const defenders = allUnits.filter(u => defenderSet.has(u.id));

  // 第三步：攻方 = 发起者1格内友军 + 任一守方单位1格内的攻方友军
  const attackerSet = new Set();
  // 3a: 发起者周围1格友军（支援）
  allUnits.forEach(u => {
    if(u.fac === fid && u.status !== 'ambush' && unitsContact(aggressorUnit, u)) {
      attackerSet.add(u.id);
    }
  });
  // 3b: 守方每个单位周围1格的攻方友军（围攻/夹击）
  defenders.forEach(du => {
    allUnits.forEach(u => {
      if(u.fac === fid && !attackerSet.has(u.id) &&
         u.status !== 'ambush' && unitsContact(du, u)) {
        attackerSet.add(u.id);
      }
    });
  });
  const attackers = allUnits.filter(u => attackerSet.has(u.id));

  return { attackers, defenders, defFac };
}

// ★ v100: AI显式发起战斗（替代旧checkBattleTriggers第二轮的被动扫描）
// aggressorUnit: 发起攻击的AI部队（决定攻方阵营）
// 收集双方 → 营寨战/普通野战 → 弹窗或自动结算
// 返回true=战斗已触发，false=未触发
let _aiBattleProcessedThisTurn = new Set(); // 每旬去重
function aiInitiateBattle(aggressorUnit) {
  if(!aggressorUnit || getUnitTroops(aggressorUnit) <= 0) return false;

  const sides = collectBattleSides(aggressorUnit);
  if(!sides) return false;
  const { attackers, defenders, defFac } = sides;
  const fid = aggressorUnit.fac;

  // ★ v101: 去重——用势力对+区域标识，防止同一交战区域重复触发
  // 城市hex用cityId，野外用攻守双方hex中较小者（规范化，确保正反方向key相同）
  const atkNode = getUnitNodeId(aggressorUnit);
  const defNode = getUnitNodeId(defenders[0]);
  let dedupLoc;
  if (atkNode) dedupLoc = atkNode;
  else if (defNode) dedupLoc = defNode;
  else {
    // 双方都在野外——用坐标排序规范化
    const ah = hkey(aggressorUnit.hq??0, aggressorUnit.hr??0);
    const dh = hkey(defenders[0].hq??0, defenders[0].hr??0);
    dedupLoc = ah < dh ? ah + ':' + dh : dh + ':' + ah;
  }
  const facPair = fid < defFac ? fid + '|' + defFac : defFac + '|' + fid;
  const dedupKey = facPair + '|' + dedupLoc;
  if(_aiBattleProcessedThisTurn.has(dedupKey)) return false;
  _aiBattleProcessedThisTurn.add(dedupKey);
  const nodeLabel = G.cities[atkNode || defNode]?.name || '野外';

  // ── 营寨战检测 ──
  const hasCampDefender = defenders.some(u => u.status === 'camp');
  if(hasCampDefender){
    const campDefenders = defenders.filter(u => u.status === 'camp');
    const playerIsAttacker = attackers.some(u => u.fac === G.playerFac);
    const playerIsDefender = campDefenders.some(u => u.fac === G.playerFac);
    if(playerIsAttacker){
      _pendingBattleConfirms.push({ playerSide: attackers, enemySide: campDefenders, nodeLabel, campBattle: true, campRole: 'attacker' });
    } else if(playerIsDefender){
      const atkMaxInt = getMaxInt(attackers);
      const defMaxInt = getMaxInt(campDefenders);
      const mode = (atkMaxInt - defMaxInt) > 10 ? 'raid' : 'assault';
      const aiFireCampDef = aiDecideFireAttack(attackers, campDefenders, getTerrainAt(attackers[0]?.hq??0,attackers[0]?.hr??0), attackers[0]?.fac);
      // ★ v175: 战前位置快照（fire-and-forget 动画用）
      const _campSnap = {};
      [...attackers, ...campDefenders].forEach(u => { _campSnap[u.id] = { hq: u.hq, hr: u.hr }; });
      const campReport = resolveCampBattle(attackers, campDefenders, mode, nodeLabel, aiFireCampDef);
      campReport.playerWasAttacker = false;
      _battleReports.push(campReport);
      log('🏕 ' + (attackers[0]?.squads[0]?.genName||'?') + '部 对' + nodeLabel + '营寨发动' + (mode==='raid'?'劫营夜袭':'强攻') + (aiFireCampDef?'（火攻）':''), 'battle');
      // ★ v175: 把动画请求 push 到队列，等 renderAll 完成后统一播放
      if(!_fastForward){
        _pendingBattleAnimations.push({
          kind: 'camp',
          report: campReport,
          attackers: [...attackers],
          defenders: [...campDefenders],
          posSnap: _campSnap,
        });
      }
    } else {
      const atkMaxInt = getMaxInt(attackers);
      const defMaxInt = getMaxInt(campDefenders);
      const mode = (atkMaxInt - defMaxInt) > 10 ? 'raid' : 'assault';
      const aiFireCamp = aiDecideFireAttack(attackers, campDefenders, getTerrainAt(attackers[0]?.hq??0,attackers[0]?.hr??0), attackers[0]?.fac);
      // ★ v175: 位置快照
      const _campSnap2 = {};
      [...attackers, ...campDefenders].forEach(u => { _campSnap2[u.id] = { hq: u.hq, hr: u.hr }; });
      const campReport = resolveCampBattle(attackers, campDefenders, mode, nodeLabel, aiFireCamp);
      _battleReports.push(campReport);
      log('🏕 AI营寨战于' + nodeLabel + '（' + (mode==='raid'?'劫营':'强攻') + '）' + (aiFireCamp?'🔥火攻':''), 'battle');
      // ★ v175: push 到队列（shouldSkip 会判断迷雾）
      if(!_fastForward){
        _pendingBattleAnimations.push({
          kind: 'camp',
          report: campReport,
          attackers: [...attackers],
          defenders: [...campDefenders],
          posSnap: _campSnap2,
        });
      }
    }
    return true;
  }

  // ── ★ v122fix→v133fix: 攻城判定——defender在己方城内 → 攻城战 ──
  // ★ v133fix: 额外排除围城方被误判为守城方的情况：
  //   1. defender不能有siege状态的部队（围城方不可能是被攻城方）
  //   2. 城市必须属于defFac（defender所属势力），不能是attacker的城
  const _defNodeSiege = getUnitNodeId(defenders[0]);
  const _defCitySiege = _defNodeSiege ? G.cities[_defNodeSiege] : null;
  const _isSiegeBattle = _defCitySiege && _defCitySiege.fac === defFac
    && defenders.every(u => getUnitNodeId(u) === _defNodeSiege)
    && !defenders.some(u => u.status === 'siege'); // ★ v133fix: 围城方不是守城方

  if(_isSiegeBattle){
    const playerInvolved = attackers.some(u => u.fac === G.playerFac) || defenders.some(u => u.fac === G.playerFac);
    if(playerInvolved){
      const playerIsAttacker = attackers.some(u => u.fac === G.playerFac);
      const playerSide = playerIsAttacker ? attackers : defenders;
      const enemySide  = playerIsAttacker ? defenders : attackers;
      _pendingBattleConfirms.push({
        playerSide, enemySide,
        nodeLabel: _defCitySiege.name,
        siegeBattle: true, siegeCity: _defCitySiege,
        playerIsAttacker,  // ★ v130fix: 记录玩家是攻方还是守方
      });
    } else {
      // AI vs AI 攻城
      // ★ v175: 战前位置快照
      const _siegePosSnap = {};
      [...attackers, ...defenders].forEach(u => { _siegePosSnap[u.id] = { hq: u.hq, hr: u.hr }; });
      const siegeReport = resolveSiegeBattle(attackers, defenders, _defCitySiege, _defCitySiege.name);
      _battleReports.push(siegeReport);
      // push 动画队列（shouldSkip 内按迷雾判断是否真播）
      _pendingBattleAnimations.push({
        kind: 'siege', report: siegeReport,
        attackers, defenders, posSnap: _siegePosSnap, city: _defCitySiege,
      });
      log('⚔ [AI] ' + (attackers[0]?.squads[0]?.genName||'?') + '部 攻城' + _defCitySiege.name, 'battle');
    }
    if(_pendingBattleConfirms.length && !_fastForward) _showNextBattleConfirm();
    return true;
  }

  // ── 普通野战 ──
  const playerInvolved = attackers.some(u => u.fac === G.playerFac) || defenders.some(u => u.fac === G.playerFac);
  if(playerInvolved){
    const playerIsAttacker = attackers.some(u => u.fac === G.playerFac);
    const playerSide = playerIsAttacker ? attackers : defenders;
    const enemySide  = playerIsAttacker ? defenders : attackers;
    _pendingBattleConfirms.push({ playerSide, enemySide, nodeLabel, playerIsAttacker });
  } else {
    // AI vs AI：叫阵（水战禁叫阵）
    let aiAiDuel = null;
    const _aiNavalBattle = defenders.some(u => isUnitOnWater(u)); // ★ v138
    const atkChallenger = _aiNavalBattle ? null : aiDecideDuelChallenger(attackers, 'attacker', defenders);
    if(atkChallenger){
      const defCandidates = getDuelCandidates(defenders, false);
      if(defCandidates.length){
        const bestDef = defCandidates
          .map(c => ({ ...c, war: (GEN_MAP[c.name] || { war: 60 }).war }))
          .sort((a, b) => b.war - a.war)[0];
        const acceptPct = Math.min(0.95, Math.max(0.15, (bestDef.war - 5) / 100));
        if(Math.random() < acceptPct){
          aiAiDuel = resolveDuel(atkChallenger, bestDef.name, 'active');
          aiAiDuel.accepted = true;
          applyDuelMorale(attackers, defenders, aiAiDuel);
        } else {
          attackers.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
          defenders.forEach(u => u.squads.forEach(sq => { sq.morale = Math.max(10, sq.morale - 5); }));
          aiAiDuel = { accepted: false, challengerName: atkChallenger, refuserName: bestDef.name, refuserWar: bestDef.war };
        }
      }
    }
    _resolveBattleEngagement(attackers, defenders, nodeLabel, aiAiDuel);
  }
  if(_pendingBattleConfirms.length && !_fastForward) _showNextBattleConfirm();
  return true;
}

// ★ v100: 只保留伏击扫描（原checkBattleTriggers第一轮）
// 普通野战已改为AI/玩家显式发起，不再被动扫描
function checkAmbushTriggers(){
  const processed = new Set();
  const allUnits = G.units.filter(u=>u.squads.some(s=>s.troops>0));

  allUnits.forEach(victim => {
    if(victim.status === 'ambush') return;

    const ambushEnemies = allUnits.filter(u =>
      u.fac !== victim.fac &&
      isHostile(u.fac, victim.fac) &&
      u.status === 'ambush' &&
      unitsContact(victim, u)
    );
    if(!ambushEnemies.length) return;

    const ambusher = ambushEnemies[0];
    const node = getUnitNodeId(ambusher) || getUnitNodeId(victim) || '?';
    const pairKey = ['ambush', ambusher.fac, victim.fac, node].join('|');
    if(processed.has(pairKey)) return;
    processed.add(pairKey);
    processed.add([ambusher.fac, victim.fac, node].join('|'));
    processed.add([victim.fac, ambusher.fac, node].join('|'));

    const nodeLabel = G.cities[node]?.name || '野外';
    const ambushTerrain=getTerrainAt(ambusher.hq,ambusher.hr);

    if(ambusher.fac === G.playerFac){
      _pendingBattleConfirms.push({
        playerSide:[ambusher], enemySide:[victim],
        nodeLabel, ambushBattle:true, ambushTerrain,
      });
    } else {
      const aiUseFireAmb = aiDecideFireAttack([ambusher],[victim],ambushTerrain,ambusher.fac);
      // ★ v175: 战前位置快照（供动画定位 — 必须在 resolveAmbush 之前，因 resolveAmbush 可能改 hq/hr）
      const _ambushPosSnap = {};
      [ambusher, victim].forEach(u => { _ambushPosSnap[u.id] = { hq: u.hq, hr: u.hr }; });
      const report=resolveAmbush([ambusher],[victim],ambushTerrain,aiUseFireAmb);
      report.node = nodeLabel;
      _battleReports.push(report);
      // ★ v175: push 到动画队列（shouldSkip 内判断玩家可见/迷雾等）
      _pendingBattleAnimations.push({
        kind: 'ambush', report,
        attackers: [ambusher], defenders: [victim],
        posSnap: _ambushPosSnap,
      });
      log(`🎯 ${ambusher.squads[0]?.genName||'?'}部 于${nodeLabel}设伏，${report.ambushHit?'奇袭得手！':'伏兵被识破！'}`, 'battle');
    }
  });

  if(_pendingBattleConfirms.length && !_fastForward) _showNextBattleConfirm();
}

// ═══════════════════════════════════════════════════════
// ⚔ 单挑系统
// ═══════════════════════════════════════════════════════

// 当前主动叫阵选择的将领名
let _duelChallenger = null;   // null = 不叫阵

/**
 * AI 叫阵判定：返回叫阵将领名，或 null（不叫阵）
 * @param {Array}  units      AI 方部队列表
 * @param {string} role       'attacker' | 'defender'
 */
/**
 * AI 叫阵判定：返回叫阵将领名，或 null（不叫阵）
 * @param {Array}  units         AI 方部队列表
 * @param {string} role          'attacker' | 'defender'
 * @param {Array}  [enemyUnits]  对方部队（用于相对勇武修正），可选
 */
function aiDecideDuelChallenger(units, role, enemyUnits) {
  // 收集候选武将（非谋士/文官）
  const candidates = [];
  units.forEach(u => {
    u.squads.forEach(sq => {
      const g = GEN_MAP[sq.genName];
      if (!g) return;
      if (g.war < 70) return; // 武力不足70不主动叫阵
      candidates.push(g);
    });
  });
  if (!candidates.length) return null;

  // 找己方 war 最高者
  const best = candidates.slice().sort((a, b) => b.war - a.war)[0];

  // 4.4节公式：aiDuelPct = clamp(0.05, 0.60, (bestWar-60)/100×1.5)
  let aiDuelPct = Math.min(0.60, Math.max(0.05, (best.war - 60) / 100 * 1.5));

  // 相对勇武修正：若对方最强 war 武将已知，则根据优劣势微调
  // 己方 war 高于对方 → 概率上浮；低于对方 → 概率下浮（但不完全阻止）
  if (enemyUnits && enemyUnits.length) {
    const enemyCandidates = [];
    enemyUnits.forEach(u => {
      u.squads.forEach(sq => {
        const g = GEN_MAP[sq.genName];
        if (!g || g.war < 70) return; // 武力不足70不参与叫阵评估
        enemyCandidates.push(g);
      });
    });
    if (enemyCandidates.length) {
      const bestEnemy = enemyCandidates.slice().sort((a, b) => b.war - a.war)[0];
      const warDiff = best.war - bestEnemy.war;  // 正 = 己方占优
      // 每差10点war，概率±0.10，但限制范围：最低0.03，最高0.75
      const relativeAdj = Math.min(0.20, Math.max(-0.20, warDiff / 10 * 0.10));
      aiDuelPct = Math.min(0.75, Math.max(0.03, aiDuelPct + relativeAdj));
    }
  }

  // ★ v167fix #2: 删除双重roll（旧代码连掷两次，60%概率被压缩为36%）
  if (Math.random() > aiDuelPct) {
    // 关羽「武圣」：即使未通过基础概率，额外15%补救机会
    if (best.name === '关羽' && Math.random() < 0.15) return best.name;
    return null;
  }
  return best.name;
}

/**
 * AI 主动叫阵后，玩家方应战判定
 * 返回 activeDuel 对象（含 accepted 字段）或 null
 */
/**
 * 获取某方所有上场将领的 war 属性
 * 谋士类（role=advisor/minister）不参与叫阵（可被动触发但概率极低）
 */
function getDuelCandidates(units, allowWeak=false){
  const result = [];
  units.forEach(u=>{
    u.squads.forEach(sq=>{
      const g = GEN_MAP[sq.genName];
      if(!g) return;
      if(!allowWeak && g.war < 70) return; // 武力不足70默认不参与叫阵
      result.push({name:g.name, war:g.war, role:g.role, unitId:u.id});
    });
  });
  return result;
}

/**
 * 核心单挑结算
 * @param {string} atkName  进攻方将领名
 * @param {string} defName  防守方将领名
 * @param {string} mode     'active'|'passive'
 * @returns {object}  {atkWar, defWar, roll, outcome:'atkWin'|'defWin'|'draw', atkMoraleDelta, defMoraleDelta, narrative}
 */
function resolveDuel(atkName, defName, mode){
  const atk = GEN_MAP[atkName] || {name:atkName, war:60};
  const def = GEN_MAP[defName] || {name:defName, war:60};

  const atkWar = getEffectiveStat(atkName, 'war');
  const defWar = getEffectiveStat(defName, 'war');

  // 50% 运气 + 50% 武力差
  const luck = (Math.random() - 0.5) * 100;          // ±50
  const skill = (atkWar - defWar) * 0.8;              // 武力差权重
  // SKILL_INLINE: duel_score — 关羽武圣/赵云取将/许褚虎痴：单挑score加减分
  const _duelSkills = [];
  const guanyuBonus = (atkName === '关羽' || defName === '关羽')
    ? (atkName === '关羽' ? +15 : -15)
    : 0;
  if(guanyuBonus) _duelSkills.push({gen:'关羽', name:'武圣', val:'+15'});
  const zhaoyunBonus = (atkName === '赵云' || defName === '赵云')
    ? (atkName === '赵云' ? +15 : -15)
    : 0;
  if(zhaoyunBonus) _duelSkills.push({gen:'赵云', name:'取将', val:'+15'});
  const xuchuBonus = (atkName === '许褚' || defName === '许褚')
    ? (atkName === '许褚' ? +20 : -20)
    : 0;
  if(xuchuBonus) _duelSkills.push({gen:'许褚', name:'虎痴', val:'+20'});
  // SKILL_INLINE: elai_duel — 典韦恶来：单挑score+15
  const dianweiBonus = (atkName === '典韦' || defName === '典韦')
    ? (atkName === '典韦' ? +15 : -15)
    : 0;
  if(dianweiBonus) _duelSkills.push({gen:'典韦', name:'恶来', val:'+15'});
  // SKILL_INLINE: guoguan_duel — 关兴过关：单挑score+5
  const guanxingBonus = (atkName === '关兴' || defName === '关兴')
    ? (atkName === '关兴' ? +5 : -5)
    : 0;
  if(guanxingBonus) _duelSkills.push({gen:'关兴', name:'过关', val:'+5'});
  // SKILL_INLINE: xinyi_duel — 太史慈信义：单挑score+10
  const taishiciBonus = (atkName === '太史慈' || defName === '太史慈')
    ? (atkName === '太史慈' ? +10 : -10)
    : 0;
  if(taishiciBonus) _duelSkills.push({gen:'太史慈', name:'信义', val:'+10'});
  const score = skill + luck + guanyuBonus + zhaoyunBonus + xuchuBonus + dianweiBonus + guanxingBonus + taishiciBonus;

  let outcome, atkMoraleDelta, defMoraleDelta;

  if(score > 12){
    outcome = 'atkWin';
    atkMoraleDelta = mode==='active' ? +18 : +10;
    defMoraleDelta = mode==='active' ? -22 : -12;
  } else if(score < -12){
    outcome = 'defWin';
    atkMoraleDelta = mode==='active' ? -22 : -12;
    defMoraleDelta = mode==='active' ? +18 : +10;
  } else {
    outcome = 'draw';
    atkMoraleDelta = +3;
    defMoraleDelta = +3;
  }

  // 叙事文案
  const narratives = {
    atkWin: [
      `${atkName}纵马而出，数合之间力斩${defName}于马下，敌军大骇。`,
      `${atkName}与${defName}大战三十余合，${defName}渐落下风，拨马而走。`,
      `${atkName}一声断喝，${defName}心生怯意，不敌而退。`,
    ],
    defWin: [
      `${defName}挺枪迎战，斗不数合，${atkName}败走，我军军心动摇。`,
      `${atkName}出马叫阵，${defName}力敌千钧，将其击退，敌阵哗然。`,
      `两将交手，${atkName}力竭不支，拨马回阵，己方士气受挫。`,
    ],
    draw: [
      `${atkName}与${defName}大战五十余合，不分胜负，各自鸣金收兵。`,
      `两将各施本领，难分轩轾，战至日暮，方才罢手。`,
      `${atkName}与${defName}势均力敌，战平而退，双方皆肃然起敬。`,
    ],
  };
  const pool = narratives[outcome];
  const narrative = pool[Math.floor(Math.random()*pool.length)];

  // ── 亲密度更新（单挑结束）──
  applyDuelIntimacy(atkName, defName, outcome);

  // ★ D1: 单挑功绩
  if(outcome==='atkWin'){ addMerit(atkName, 5); addMerit(defName, 1); }
  else if(outcome==='defWin'){ addMerit(defName, 5); addMerit(atkName, 1); }
  else { addMerit(atkName, 2); addMerit(defName, 2); }

  // ★ D3: 单挑武力成长
  if(outcome==='atkWin'){      addStatExp(atkName,'war',4); addStatExp(defName,'war',1); }
  else if(outcome==='defWin'){ addStatExp(defName,'war',4); addStatExp(atkName,'war',1); }
  else {                       addStatExp(atkName,'war',1); addStatExp(defName,'war',1); }

  // ── A5: 单挑击杀/重伤判定 ──
  let duelKillResult = null;
  const duelLoserName = outcome==='atkWin' ? defName : outcome==='defWin' ? atkName : null;
  const duelWinnerName = outcome==='atkWin' ? atkName : outcome==='defWin' ? defName : null;
  if(duelLoserName && duelWinnerName){
    const winnerWar = getEffectiveStat(duelWinnerName, 'war');
    const loserWar  = getEffectiveStat(duelLoserName, 'war');
    if(winnerWar >= loserWar + DUEL_KILL_WAR_GAP && Math.random() < DUEL_KILL_CHANCE){
      const woundResult = checkWounded(duelLoserName);
      duelKillResult = { loser: duelLoserName, result: woundResult };
      if(woundResult === 'dead') killGen(duelLoserName, duelWinnerName);
    }
  }

  return { atkName, defName, atkWar, defWar, score:Math.round(score), outcome, atkMoraleDelta, defMoraleDelta, narrative, mode, duelKillResult, duelSkills: _duelSkills.length ? _duelSkills : null };
}

/**
 * 把单挑士气结果应用到双方部队
 */
function applyDuelMorale(attackers, defenders, duelResult){
  // SKILL_INLINE: wusheng_morale — 关羽武圣：单挑胜利后敌方额外-10士气
  // SKILL_INLINE: xinyi_morale — 太史慈信义：单挑胜利后敌方额外-10士气
  let _atkWinExtra = 0, _defWinExtra = 0; // 额外扣败方士气
  ['关羽','太史慈'].forEach(name => {
    if(duelResult.outcome === 'atkWin' && duelResult.atkName === name) _defWinExtra -= 10;
    if(duelResult.outcome === 'defWin' && duelResult.defName === name) _atkWinExtra -= 10;
  });
  // TEMPERAMENT: proud — 单挑胜利时己方士气额外+5
  let _proudAtkBonus = 0, _proudDefBonus = 0;
  if(duelResult.outcome === 'atkWin' && (GEN_TAGS[duelResult.atkName]||{}).temperament === 'proud') _proudAtkBonus = 5;
  if(duelResult.outcome === 'defWin' && (GEN_TAGS[duelResult.defName]||{}).temperament === 'proud') _proudDefBonus = 5;
  attackers.forEach(u=>u.squads.forEach(sq=>{
    sq.morale = Math.max(10, Math.min(100, sq.morale + duelResult.atkMoraleDelta + _atkWinExtra + _proudAtkBonus));
  }));
  defenders.forEach(u=>u.squads.forEach(sq=>{
    sq.morale = Math.max(10, Math.min(100, sq.morale + duelResult.defMoraleDelta + _defWinExtra + _proudDefBonus));
  }));
}

/**
 * 被动单挑触发判定（在 resolveBattle 内部调用）
 * 返回 duelResult 或 null
 */
function tryPassiveDuel(attackers, defenders){
  const atkCP = attackers.reduce((s,u)=>s+calcUnitATK(u),0);
  const defCP = defenders.reduce((s,u)=>s+calcUnitATK(u),0);
  const ratio = Math.max(atkCP, defCP) / Math.max(1, Math.min(atkCP, defCP));

  // 战力越均衡越容易触发：ratio=1.0→15%, ratio=1.5→7%, ratio=2.0→0%
  // SKILL_INLINE: duel_trigger — 关羽武圣/赵云取将：单挑触发率+15%，关兴过关+5%
  const guanyuPresent = hasGenInUnits('关羽', attackers) || hasGenInUnits('关羽', defenders);
  const zhaoyunPresent = hasGenInUnits('赵云', attackers) || hasGenInUnits('赵云', defenders);
  const guanxingPresent = hasGenInUnits('关兴', attackers) || hasGenInUnits('关兴', defenders);
  const basePct = Math.max(0, 0.15 - (ratio-1)*0.15) + (guanyuPresent ? 0.15 : 0) + (zhaoyunPresent ? 0.15 : 0) + (guanxingPresent ? 0.05 : 0);
  // TEMPERAMENT: reckless — 任一方有莽将时单挑触发率+10%
  const _recklessPresent = [...attackers,...defenders].some(u=>u.squads.some(sq=>(GEN_TAGS[sq.genName]||{}).temperament==='reckless'));
  // ★ v167: 武将四类 — 武将标签增加被动单挑触发率
  const _classDuelBonus = [...attackers,...defenders].reduce((sum,u) => sum + getUnitClassBuffs(u).duelPct, 0);
  const finalPct = basePct + (_recklessPresent ? 0.10 : 0) + _classDuelBonus;
  if(Math.random() > finalPct) return null;

  // 从进攻方挑 war 最高的武将（谋士概率 ÷10）
  function pickDuelist(units){
    const pool = [];
    units.forEach(u=>u.squads.forEach(sq=>{
      const g = GEN_MAP[sq.genName];
      if(!g) return;
      // 武力越低越不可能被动卷入单挑（war<50几乎不会）
      let weight = g.war >= 70 ? 1.0 : g.war >= 50 ? 0.15 : 0.03;
      // ★ v167: 按标签修正权重（帅×0.5，谋/臣×0.1）
      weight *= getClassDuelWeight(sq.genName, sq._classChoice);
      if(Math.random() < weight) pool.push(g);
    }));
    if(!pool.length) return null;
    return pool.sort((a,b)=>b.war-a.war)[0].name;
  }

  const atkName = pickDuelist(attackers);
  const defName = pickDuelist(defenders);
  if(!atkName || !defName) return null;

  return resolveDuel(atkName, defName, 'passive');
}

/**
 * v61：弹窗胜率改为定性描述（避免虚假精确感）
 * myATK / enemyDEF 对比（含已知加成）
 */
function getStrengthLabel(myATK, enemyDEF){
  const ratio = myATK / Math.max(1, enemyDEF);
  if (ratio >= 1.5) return '<span style="color:#1a8a45">🟢 我方大幅占优</span>';
  if (ratio >= 1.2) return '<span style="color:#a0d860">🟡 我方略占优势</span>';
  if (ratio >= 0.85) return '<span style="color:#8a7030">🟠 势均力敌</span>';
  if (ratio >= 0.67) return '<span style="color:#e08840">🔴 敌方略占优势</span>';
  return '<span style="color:#b04040">💀 敌方大幅占优</span>';
}

// ════════════════════════════════════════════════════════════════════
// ── MIL7.c _doRetreat2Hex (v181 L17356-L17384) ──
// ════════════════════════════════════════════════════════════════════

function _doRetreat2Hex(unit, enemies){
  if(!unit || unit.squads.every(sq=>sq.troops<=0)) return;
  const enemyCenter = enemies.length ? {
    col: Math.round(enemies.reduce((s,e)=>s+(e.hq||0),0)/enemies.length),
    row: Math.round(enemies.reduce((s,e)=>s+(e.hr||0),0)/enemies.length)
  } : null;

  for(let step=0; step<2; step++){
    const nbs = hexNeighbors(unit.hq, unit.hr);
    let bestNb = null, bestDist = -1;
    for(const nb of nbs){
      const t = HEX_TERRAIN[hkey(nb.col, nb.row)];
      if(t === 'impassable' || t === 'water' || t === 'deep_water' || t === 'coastal_water') continue;
      // ★ v102: 排斥所有部队，防止撤退堆叠（己方城市hex除外）
      const nbCityId = HEX_CITY[hkey(nb.col, nb.row)];
      const isOwnCity = nbCityId && G.cities[nbCityId] && G.cities[nbCityId].fac === unit.fac;
      if(!isOwnCity && G.units.some(ou => ou.id !== unit.id && ou.hq === nb.col && ou.hr === nb.row)) continue;
      // 优先远离敌方
      const dist = enemyCenter ? hexDist(nb.col, nb.row, enemyCenter.col, enemyCenter.row) : 0;
      if(dist > bestDist){ bestDist = dist; bestNb = nb; }
    }
    if(bestNb){
      unit.hq = bestNb.col; unit.hr = bestNb.row;
    } else break;
  }
  unit.hexPath = [];
  unit.movePath = [];
  unit.status = 'halt';
}

// ════════════════════════════════════════════════════════════════════
// ── MIL7.d _resolveBattleEngagement (v181 L18420-L18629) ──
// ════════════════════════════════════════════════════════════════════

function _resolveBattleEngagement(attackers, defenders, nodeLabel, activeDuel, navalFire){
  const atkFac0 = attackers[0].fac;
  const defFac = defenders[0].fac;

  // ★ v175: 战前位置快照（水战动画用；doRetreat 会改 unit.hq/hr）
  const _engagePosSnap = {};
  [...attackers, ...defenders].forEach(u => { _engagePosSnap[u.id] = { hq: u.hq, hr: u.hr }; });

  // 战斗发起扣外交友好度（rebel 不触发）
  if(atkFac0 !== 'rebel' && defFac !== 'rebel'){
    // Fix4：宗主/附庸之间因联动参战不互扣rel（只有主动背刺才扣）
    const isVassalBond = isSuzerain(atkFac0, defFac) || isSuzerain(defFac, atkFac0);
    if(!isVassalBond){
      const bk0 = `${atkFac0}-${defFac}`;
      const isEnemy = G.diplo[bk0]?.status === 'enemy';
      if(isEnemy){
        // ★ C3修正：enemy状态下战斗扣rel减为-2，且每旬最多扣一次
        const dedupKey = `_battleRelDedup_${bk0}`;
        if(!G[dedupKey]){ addDiplo(atkFac0, defFac, -2); G[dedupKey] = true; }
      } else {
        addDiplo(atkFac0, defFac, -10); // 中立状态下战斗仍-10
      }
    }

    const bk = `${atkFac0}-${defFac}`;
    if(G.diplo[bk] && G.diplo[bk].status === 'neutral'){
      // 中立状态下发生战斗 → 自动转为敌对（de facto宣战）
      G.diplo[bk].status = 'enemy';
      // D-118 fix: _warDeclaredTurn 双向写 (跟三入口宣战 / 斩使一致)
      G.diplo[bk]._warDeclaredTurn = G.turn;
      const rev = G.diplo[`${defFac}-${atkFac0}`];
      if(rev) {
        rev.status = 'enemy';
        rev._warDeclaredTurn = G.turn;
      }
      // C3 反复/背刺检测（与 diploWar 相同逻辑）
      if(G.diplo[bk]._brokenAllyTurn != null && (G.turn - G.diplo[bk]._brokenAllyTurn) <= 6){
        G.diplo[bk]._betrayal = true;
        if(rev) rev._betrayal = true;
        applyReputationPenalty(atkFac0, 'betray');
        // D-048 fix: de facto 宣战背刺也触发 betray 派系事件（与玩家 diploWar 对称）
        if(ALL_FACS.includes(atkFac0)) triggerFactionEvent('betray', atkFac0, {});
      }
      if(G.diplo[bk]._peaceTurn != null && (G.turn - G.diplo[bk]._peaceTurn) <= 3){
        applyReputationPenalty(atkFac0, 'relapse');
      }
      // D-118 fix: _diploCD 双向 15 (倒计时模式, 跟三入口宣战/斩使一致; D-114 改 Claude AI 接管入口打补丁衰减保留老存档兼容)
      G[`_diploCD_${atkFac0}_${defFac}`] = 15;
      G[`_diploCD_${defFac}_${atkFac0}`] = 15;
      _syncAllyWarStatus(atkFac0, defFac);
      // D-118 fix: applyWarDeclarationEffects 全套副作用 (信誉/第三方/派系/ethos), 跟三入口一致 (de facto = 无名宣战, claimType=null)
      applyWarDeclarationEffects(atkFac0, defFac, null);
      // D-118 fix: warDeclare 派系事件 (跟三入口宣战 + 斩使 D-049/D-131 fix 一致)
      if(ALL_FACS.includes(atkFac0)) triggerFactionEvent('warDeclare', atkFac0, {});
      log(`⚔️ ${FAC[atkFac0]?.name}对${FAC[defFac]?.name}动兵，双方进入敌对状态`, 'diplo');
    }

    // Fix1：守方有宗主时，宗主自动联动参战（无论攻守方初始是否enemy）
    const defSuzerain = getSuzerain(defFac);
    if(defSuzerain && defSuzerain !== atkFac0){
      const sk = `${atkFac0}-${defSuzerain}`;
      const sd = G.diplo[sk];
      if(sd && sd.status !== 'enemy'){
        sd.status = 'enemy';
        const srev = G.diplo[`${defSuzerain}-${atkFac0}`];
        if(srev) srev.status = 'enemy';
        addDiplo(atkFac0, defSuzerain, -15);
        log(`⚔️ ${FAC[defSuzerain]?.name}因${FAC[defFac]?.name}遭攻，对${FAC[atkFac0]?.name}宣战`, 'diplo');
      }
    }
    // Fix1：攻方有宗主时，同步宗主也对守方进入敌对
    const atkSuzerain = getSuzerain(atkFac0);
    if(atkSuzerain && atkSuzerain !== defFac){
      const ak = `${atkSuzerain}-${defFac}`;
      const ad = G.diplo[ak];
      if(ad && ad.status !== 'enemy'){
        ad.status = 'enemy';
        const arev = G.diplo[`${defFac}-${atkSuzerain}`];
        if(arev) arev.status = 'enemy';
        addDiplo(atkSuzerain, defFac, -15);
        log(`⚔️ ${FAC[atkSuzerain]?.name}随附庸${FAC[atkFac0]?.name}对${FAC[defFac]?.name}宣战`, 'diplo');
      }
    }
  }
  // 共同抗敌加成：攻方打击了第三方的共同敌人，双方友好度+1
  applyCommonEnemyDiploBonus(atkFac0, defFac, 1);
  const defRetResult = calcRetreatResult(defenders, attackers);
  const defRetreated = defRetResult.canRetreat && defenders.every(u=>u.fac!==G.playerFac);

  // 推断交战地形（取攻方当前位置）
  const atkUnit = attackers[0];
  const defUnit = defenders[0];
  // ★ v138: 水战判定——按被攻击方位置
  const _defOnWater = defUnit ? isWaterHex(defUnit.hq??0, defUnit.hr??0) : false;
  const battleTerrain = _defOnWater ? 'water' : (atkUnit ? getTerrainAt(atkUnit.hq??0, atkUnit.hr??0) : 'plain');

  let report;
  if(defRetreated){
    doRetreat(defenders, attackers, defRetResult.retreatResult);
    // doRetreat内部处理追击损失+撤退方向+胜方前进
    report = {
      type:'retreat', atkFac:attackers[0].fac, defFac,
      atkNames: attackers.map(u=>u.squads[0]?.genName+'部').join('、'),
      defNames: defenders.map(u=>u.squads[0]?.genName+'部').join('、'),
      node: nodeLabel,
      activeDuel: activeDuel||null,
      retreatResult: defRetResult.retreatResult,
      isNaval: _defOnWater, // ★ v138
    };
  } else {
    // ★ v138: 水战走wrapper，陆战走原逻辑
    report = _defOnWater
      ? resolveNavalBattle(attackers, defenders, !!(navalFire))
      : resolveBattle(attackers, defenders, battleTerrain);
    report.type='battle'; report.atkFac=attackers[0].fac; report.defFac=defFac;
    report.atkNames=attackers.map(u=>u.squads[0]?.genName+'部').join('、');
    report.defNames=defenders.map(u=>u.squads[0]?.genName+'部').join('、');
    report.node=nodeLabel;
    report.activeDuel = activeDuel||null;

    const losers  = report.atkWins ? defenders : attackers;
    const winners = report.atkWins ? attackers : defenders;

    const wiped = losers.filter(u=>u.squads.every(sq=>sq.troops<=0));
    wiped.forEach(u=>{
      G.units = G.units.filter(x=>x.id!==u.id);
      if(G.selUnitId===u.id) G.selUnitId=null;
      log(`💀 ${u.squads[0]?.genName||'?'}部 全军覆没`, 'battle');
    });
    const survivors = losers.filter(u=>u.squads.some(sq=>sq.troops>0));
    // siege部队败退时解除围城状态
    survivors.forEach(u=>{
      if(u.status==='siege'){ u.status='halt'; u.siegeTarget=null; u._siegeTurnCount=0; }
    });

    if(survivors.length > 0){
      // ★ v101修复：传入winners作为追击方，确保撤退方向正确（远离胜方）+追击损失统一在doRetreat内处理+胜方前进占据战场
      doRetreat(survivors, winners, 'partial');
      report.pursued = true; // partial撤退必有追击损失，标记供战报显示
    }
    winners.forEach(u=>{
      if(u.fac!==G.playerFac){
        // ★ v86: 围城部队赢了野战后保持siege状态
        if(u.status==='siege') return;
        const curN=getUnitNodeId(u);
        u.movePath=curN?[curN]:u.movePath;
        u.status=G.cities[curN]?'garrison':'halt';
      }
    });
    // 攻方胜利：移除守方 camp 状态（营寨被攻破）
    if(report.atkWins){
      defenders.forEach(u=>{
        if(u.status==='camp'){
          const curN=getUnitNodeId(u);
          u.status=G.cities[curN]?'garrison':'halt';
          u.campMobilizeTurns=0;
          log('🏕 ' + (u.squads[0]?.genName||'?') + '部营寨被攻破', 'battle');
        }
      });
    }
  }

  // ★ v99: 撤退（没打起来）不弹战报弹窗，只写日志+小传
  if(report.type === 'retreat'){
    const retreatDesc = report.retreatResult === 'partial' ? '且战且退，遭敌追击' : '从容撤退，保全部众';
    log(`🏃 ${report.defNames}成功撤退，避开${report.atkNames}`, 'battle');
    defenders.forEach(u=>u.squads.forEach(sq=>{
      addGenChronicle(sq.genName,`与${attackers[0]?.squads[0]?.genName||'敌军'}战于${report.node}，审时度势，${retreatDesc}。`);
    }));
  } else {
    _battleReports.push(report);
    // ★ v175: 水战 + AI vs AI（玩家无参战方）→ push 动画队列，由 drain 统一播
    // 玩家主动水战走 confirmBattle 路径已 await 动画，不在这里 push
    const _hasPlayer = attackers.some(u => u.fac === G.playerFac) || defenders.some(u => u.fac === G.playerFac);
    if(report.isNaval && !_hasPlayer){
      _pendingBattleAnimations.push({
        kind: 'naval', report,
        attackers, defenders, posSnap: _engagePosSnap,
      });
    }
  }

  // 清除临时战斗debuff字段（_siegeDebuff：围城方出城被突袭的DEF惩罚）
  [...attackers, ...defenders].forEach(u => u.squads.forEach(sq => { delete sq._siegeDebuff; }));

  // ── 单挑小传 ──
  function recordDuelChronicle(duel){
    if(!duel || duel.accepted===false) return;
    const {atkName, defName, outcome, mode} = duel;
    const modeStr = mode==='active' ? '战前叫阵' : '阵中单挑';
    const atkEntry = outcome==='atkWin'
      ? `${modeStr}，力挫${defName}，威名大震，全军士气为之大振。`
      : outcome==='defWin'
      ? `${modeStr}，与${defName}交手，不敌而退，心有不甘。`
      : `${modeStr}，与${defName}大战数十合，不分胜负，各自收兵。`;
    const defEntry = outcome==='defWin'
      ? `${modeStr}，力退${atkName}，勇冠三军，士气倍增。`
      : outcome==='atkWin'
      ? `${modeStr}，败于${atkName}之手，拨马而回，部众为之气沮。`
      : `${modeStr}，与${atkName}平分秋色，众将皆服其勇。`;
    addGenChronicle(atkName, atkEntry);
    addGenChronicle(defName, defEntry);
  }
  recordDuelChronicle(report.activeDuel);
  recordDuelChronicle(report.passiveDuel);

  if(report.type !== 'retreat'){
    const winner = report.atkWins ? report.atkNames : report.defNames;
    log(`⚔ 【${report.node}】${report.atkNames} vs ${report.defNames} → ${winner}胜${report.annihilated?' 全歼！':''}`, 'battle');
    // 小传：胜负双方各记一条
    const winSide=report.atkWins?attackers:defenders;
    const loseSide=report.atkWins?defenders:attackers;
    const winFacName={wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'}[winSide[0]?.fac]||'';
    const loseFacName={wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'}[loseSide[0]?.fac]||'';
    winSide.forEach(u=>u.squads.forEach(sq=>{
      const desc=report.annihilated?`大破${loseFacName}军于${report.node}，歼敌殆尽，威震一方。`:`战于${report.node}，力挫${loseFacName}军，斩获颇丰。`;
      addGenChronicle(sq.genName, desc);
    }));
    loseSide.forEach(u=>u.squads.forEach(sq=>{
      const desc=report.annihilated?`战于${report.node}，遭${winFacName}军合围，全军覆没。`:`战于${report.node}，败于${winFacName}军，损兵折将，退守待命。`;
      addGenChronicle(sq.genName, desc);
    }));
  }
}

// ════════════════════════════════════════════════════════════════════
// ── MIL7.e processReinforcement (v181 L18631-L18782) ──
// ════════════════════════════════════════════════════════════════════

/**
 * 处理补员（每旬）
 * 双轨制：就地新兵（front）+ 后方精兵（rear）
 *
 * 准入：部队必须在己方城市控制半径内（large=100px, medium=80px, small=60px）
 *       城外（敌境行军）无法补员；等补给线系统实装后升级此判断
 *
 * 速度：
 *   front速率 = baseRate × 0.68 × inCityMult × clamp(0.5,3.0, 当地人口/15万)
 *     → 当地人口越多front越快，大城front占比高
 *   rear速率  = baseRate × 2.0 × clamp(0.5,2.0, 全势力总人口/250万)
 *     → 后方精兵调配，不受当地人口影响
 *   ★ v116: 参数从 front×1.0+rear×0.4 调整为 front×0.68+rear×2.0
 *     均衡策略下大城约6:4，中城约4.5:5.5，小城约2.5:7.5，总量不变
 *
 * 政策取舍（front/rear份额）：
 *   激进 front×0.7 rear×0.3：当地人口充足时最快，但等级稀释
 *   均衡 front×0.5 rear×0.5：中庸
 *   精兵 front×0.3 rear×0.7：总速度偏慢但等级保持好
 */
function processReinforcement(){
  // v147: 补员改用领土系统——在己方领土内按归属城市人口补员
  const territory = _buildTerritoryMap();
  const BASE = 200; // ★ v133: 500→200 大幅减缓补员速度，让战损更有意义

  // 缓存全势力总人口
  const facTotalPop = {};
  Object.values(G.cities).forEach(c=>{
    if(!facTotalPop[c.fac]) facTotalPop[c.fac] = 0;
    facTotalPop[c.fac] += c.pop;
  });

  G.units.forEach(unit=>{
    const fac = unit.fac;
    // 欠饷超50%停止补员
    const debtRatio = G.factions[fac]?._salaryDebt || 0;
    if(debtRatio > 0.5) return;

    const pol = POLICY.find(p=>p.id===(G.factions[fac]?.policyId||'bal')) || POLICY[1];

    // ★ v147: 查领土归属——不在己方领土则不补员
    const tk = hkey(unit.hq??0, unit.hr??0);
    const terr = territory[tk];
    if(!terr || terr.fac !== fac) return; // 敌方/无主领土：不补员

    const nearCity = G.cities[terr.cityId];
    if(!nearCity) return;

    // 位置判定：领土BFS距离0-1格=城中
    const inCity = terr.dist <= 1;
    const inCityMult = inCity ? 1.5 : 1.0;

    // 就地front: BASE × frontPopMult × inCityMult × pol.front × 0.68
    const frontPopMult = Math.min(3.0, Math.max(0.5, nearCity.pop / 150000));

    // 后方rear: BASE × rearPopMult × 2.0 × pol.rear
    // ★ v116: front×0.68 + rear×2.0 (原front×1.0 + rear×0.4)
    //   均衡策略下大城约6:4，中城约4.5:5.5，小城约2.5:7.5，总量不变
    const totalFacPop = facTotalPop[fac] || 1;
    const rearPopMult = Math.min(2.0, Math.max(0.5, totalFacPop / 2500000));

    // ★ D1: 补员速度buff（后将军/大将军）
    const _rBuff = G.factions[fac]?._postBuffs?.reinforce || 0;

    const frontAmt = Math.floor(BASE * frontPopMult * inCityMult * pol.front * 0.68 * (1 + _rBuff));
    const rearAmt  = Math.floor(BASE * rearPopMult * 2.0 * pol.rear * (1 + _rBuff));
    const unitRecover = Math.max(BASE, frontAmt + rearAmt); // 保底BASE

    // 粮食检查
    const turns = getCityFoodTurns(nearCity);
    if(turns < 2) return;
    const foodMult = turns < 5 ? 0.5 : 1.0;

    // v109E: 金消耗检查（0.05金/兵）
    const facObj = G.factions[fac];
    if(!facObj || (facObj.res?.gold ?? 0) <= 0) return; // ★ v149fix: facObj.gold→facObj.res.gold

    unit.squads.forEach(sq=>{
      // ★ v114: 集结中squad补员规则
      // - 新征（全squad都有_musterTarget且_mustered从0开始）→ 不补员（troops全靠集结）
      // - 扩编（_musterTarget存在但_mustered>0从旧troops开始）→ 补员上限=_mustered（只补已集结部分的缺口）
      let effectiveMax = sq.maxTroops || sq.troops;
      if (sq._musterTarget) {
        // 集结中：补员上限=已集结量（不超过集结进度去补员）
        effectiveMax = sq._mustered || 0;
        // 如果还没集结任何兵（纯新征），直接跳过
        if (effectiveMax <= 0) return;
      }
      const missing = effectiveMax - sq.troops;
      if(missing <= 0) return;

      // ★ v116: 特色兵种双轨补员——front看绑定城人口，rear看全国
      let _sqFrontAmt = frontAmt, _sqRearAmt = rearAmt;
      const _sqTd = TROOP_TYPES[sq.type];
      if (_sqTd?.elite && _sqTd.homeCity) {
        const _homeCity = G.cities[_sqTd.homeCity];
        if (_homeCity && _homeCity.fac === fac) {
          // 绑定城在手：front用绑定城人口
          const _homeFrontMult = Math.min(3.0, Math.max(0.5, _homeCity.pop / 150000));
          _sqFrontAmt = Math.floor(BASE * _homeFrontMult * inCityMult * pol.front * 0.68 * (1 + _rBuff));
        } else {
          // 绑定城丢了：front归零
          _sqFrontAmt = 0;
        }
      }
      const _sqRecover = Math.max(_sqTd?.elite ? 0 : BASE, _sqFrontAmt + _sqRearAmt);
      // SKILL_INLINE: xiaoju — 臧霸啸聚：所在squad最近己方城市∈青徐时front补员×2
      const _zangbaBoost = (sq.genName==='臧霸' && nearCity && isQingxu(nearCity.id)) ? 2.0 : 1.0;

      let recover = Math.min(missing, Math.floor(_sqRecover * foodMult * _zangbaBoost));
      if(recover <= 0) return;

      // v109E: 补员金消耗 0.05金/兵
      const goldCost = recover * 0.05;
      if((facObj.res?.gold ?? 0) < goldCost){
        recover = Math.floor((facObj.res?.gold ?? 0) / 0.05); // 金不够则按金库上限补
        if(recover <= 0) return;
      }
      safeSub(facObj.res, 'gold', recover * 0.05); // ★ v149fix: facObj.gold→facObj.res.gold

      // 等级加权：就地新兵用当地initLevel，后方精兵保持原等级
      const currentLevel = unit.level || 1;
      const frontLv = getInitLevel(nearCity);
      const rearLv  = currentLevel;
      const totalBefore = sq.troops;
      const totalAfter = Math.min(effectiveMax, sq.troops + recover);
      const actualRecover = totalAfter - totalBefore;
      if(actualRecover > 0){
        const frac = frontAmt / (frontAmt + rearAmt || 1);
        const aFront = Math.round(actualRecover * frac);
        const aRear  = actualRecover - aFront;
        const newLevelRaw = (totalBefore*currentLevel + aFront*frontLv + aRear*rearLv) / totalAfter;
        unit.level = Math.max(1, Math.min(UNIT_LEVEL_MAX, Math.round(newLevelRaw)));
      }
      sq.troops = totalAfter;
    });
  });

  // ★ v163: 部曲——和平驻扎训练（garrison状态每旬微量非部曲→部曲）
  G.units.forEach(unit=>{
    if(unit.status !== 'garrison') return;
    unit.squads.forEach(sq=>{
      if(!sq.genName || sq.troops <= 0) return;
      const _ret = getRetainers(sq.genName);
      const _nonRet = Math.max(0, sq.troops - Math.min(_ret, sq.troops));
      if(_nonRet > 0){
        const _train = Math.max(1, Math.floor(_nonRet * 0.003));
        setRetainers(sq.genName, _ret + _train);
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════════
// ── M_LET _marchAnimating (v181 L19837) ──
// ════════════════════════════════════════════════════════════════════

let _marchAnimating = false; // 行军动画锁，防止重入+禁用UI

// ════════════════════════════════════════════════════════════════════
// ── MIL8.a issueUnitMove (v181 L19839-L19969) ──
// ════════════════════════════════════════════════════════════════════

function issueUnitMove(unit, destCol, destRow, destLabel, attackIntent){
  if(_marchAnimating){ showNotif('行军中，请稍候','warn'); return false; }
  // ★ v99: 非可移动状态检查
  if(unit.mobilizingTurns > 0){ showNotif(`整备中，还需${unit.mobilizingTurns}旬`,'warn'); return false; }
  if(unit.status === 'camp'){ showNotif('扎营中，请先拔营','warn'); return false; }
  if(unit.status === 'ambush'){ showNotif('埋伏中，请先解除','warn'); return false; }
  if(unit.status === 'siege'){ showNotif('围城中，请先撤围','warn'); return false; }
  // ★ v133: 被围城部队不能自由移动出城（只能通过出城迎击按钮打围城方）
  if(unit.status === 'garrison'){
    const _nodeId = getUnitNodeId(unit);
    if(_nodeId){
      const _besieged = G.units.some(u => u.status === 'siege' && u.siegeTarget === _nodeId && u.fac !== unit.fac);
      if(_besieged && !attackIntent){
        showNotif('城池被围，无法自由出城。可在城池面板选择出城迎击','warn');
        return false;
      }
    }
  }
  // ★ v114: 离城即终止集结，带走已集结兵力
  unit.squads.forEach(sq => {
    if(sq._musterTarget) {
      sq._musterTarget = null;
      sq._mustered = null;
    }
  });
  const result = hexAstar(unit.hq, unit.hr, destCol, destRow, getMainTroopType(unit), unit.fac);
  if(!result){ showNotif('无法到达该位置','warn'); return false; }

  const gname = unit.squads[0]?.genName||'?';
  const label = destLabel && G.cities[destLabel] ? G.cities[destLabel].name : '目标地点';

  // AI部队或快进：旧逻辑（设hexPath等下旬走）
  if(unit.fac !== G.playerFac || _fastForward){
    unit.hexPath = result.path.slice(1);
    unit.movePath = destLabel ? [destLabel] : [];
    unit.status = 'march';
    const turns = Math.max(1, Math.ceil(result.cost / calcUnitAP(unit)));
    log(`🗺 ${gname}部 → ${label}，约${turns}旬`, 'economy');
    G.selUnitId = null;
    clearMovePreview();
    renderAllLight();
    return true;
  }

  // ★ v99: 玩家部队即时移动
  const fullPath = result.path.slice(1);
  if(!fullPath.length){ showNotif('已在目标位置','warn'); return false; }

  // ★ v99: 已与敌军相邻且有攻击意图时，直接触发战斗（不走行军动画）
  if(attackIntent){
    const destHostile = G.units.find(u =>
      u.id !== unit.id && u.hq === destCol && u.hr === destRow &&
      u.fac !== unit.fac && isHostile(unit.fac, u.fac) && getUnitTroops(u) > 0
    );
    if(destHostile && hexDist(unit.hq??0, unit.hr??0, destCol, destRow) <= 1){
      G.selUnitId = null;
      clearMovePreview();
      const sides = collectBattleSides(unit);
      if(!sides || !sides.defenders.length){ showNotif('附近未发现可攻击的敌军','warn'); renderAllLight(); return false; }
      const { attackers: sideA, defenders: sideB } = sides;
      const nodeLabel = G.cities[getUnitNodeId(unit)]?.name || '野外';
      const hasCampDef = sideB.some(u => u.status === 'camp');
      if(hasCampDef){
        _pendingBattleConfirms.push({
          playerSide: sideA, enemySide: sideB.filter(u => u.status === 'camp'),
          nodeLabel, campBattle: true, campRole: 'attacker',
        });
      } else {
        // ★ v133cleanup: 野战（此路径不再处理攻城——攻城统一走围城系统）
        _pendingBattleConfirms.push({
          playerSide: sideA, enemySide: sideB, nodeLabel,
          playerIsAttacker: true,
        });
      }
      setTimeout(_showNextBattleConfirm, 100);
      return true;
    }
  }

  // AP检查
  if(unit._apRemaining === undefined) unit._apRemaining = calcUnitAP(unit);
  if(unit._apRemaining <= 0){ showNotif('本旬行动力已耗尽，请推进下一旬','warn'); return false; }

  unit.movePath = destLabel ? [destLabel] : [];
  unit.status = 'march';
  unit._apSpentThisTurn = true;
  G.selUnitId = null;
  clearMovePreview();

  // 计算本旬AP可走多远
  const troopType = getMainTroopType(unit);
  let apSim = unit._apRemaining;
  let stepsThisTurn = 0;
  let _simOnWater = isUnitOnWater(unit); // ★ v138
  for(let i = 0; i < fullPath.length; i++){
    const _simNextWater = isWaterHex(fullPath[i].col, fullPath[i].row); // ★ v138
    const cost = getHexMoveCost(fullPath[i].col, fullPath[i].row, troopType, _simOnWater);
    if(cost >= 999) break;
    if(apSim < cost) break;
    apSim -= cost;
    stepsThisTurn++;
    // ★ v138: 水陆转换后本旬停止
    if(_simOnWater !== _simNextWater) { apSim = 0; break; }
    _simOnWater = _simNextWater;
  }
  if(stepsThisTurn === 0){
    // AP不够走第一格（地形消耗太高），提示并设为march等下旬
    const firstCost = getHexMoveCost(fullPath[0].col, fullPath[0].row, troopType);
    showNotif(`行动力不足（需${firstCost}，剩${unit._apRemaining}），下旬继续`, 'warn');
    unit.hexPath = fullPath;
    unit.status = 'march';
    unit._apSpentThisTurn = true;
    renderAllLight();
    return true;
  }

  const walkPath = fullPath.slice(0, stepsThisTurn);
  const remainPath = fullPath.slice(stepsThisTurn);

  if(remainPath.length > 0){
    const remCost = calcHexPathCost(remainPath, troopType, _simOnWater); // ★ v179fix P9
    const remTurns = Math.max(1, Math.ceil(remCost / calcUnitAP(unit)));
    log(`🗺 ${gname}部 → ${label}，本旬行进${walkPath.length}格，余约${remTurns}旬`, 'economy');
  } else {
    log(`🗺 ${gname}部 → ${label}，本旬抵达`, 'economy');
  }

  // 启动逐格行军动画
  _execInstantMarch(unit, walkPath, apSim, remainPath, attackIntent);
  return true;
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.b launchSiegeAttack (v181 L21134-L21170) ──
// ════════════════════════════════════════════════════════════════════

function launchSiegeAttack(uid){
  const unit = G.units.find(x => x.id === uid);
  if(!unit || unit.status !== 'siege') return;
  const cityId = unit.siegeTarget;
  const city = G.cities[cityId];
  if(!city){ showNotif('围城目标不存在', 'warn'); return; }
  if(city.fac === unit.fac){ showNotif('目标已是己方城市', 'warn'); return; }

  // 攻方：siege部队 + 附近己方halt/garrison部队（城市2格hex内）
  const cityDef = CITY_MAP[cityId];
  const attackers = G.units.filter(u => {
    if(u.fac !== unit.fac) return false;
    if(u.status === 'siege' && u.siegeTarget === cityId) return true;
    if(!cityDef) return false;
    return hexDist(u.hq??0, u.hr??0, cityDef.q, cityDef.r) <= 2 &&
      (u.status === 'halt' || u.status === 'garrison');
  });

  // 守方：城内garrison（用虚拟单位代表）+ 城内野战部队
  const defenders = G.units.filter(u => {
    if(u.fac !== city.fac) return false;
    const nodeId = getUnitNodeId(u);
    return nodeId === cityId;
  });

  unit._siegeTurnCount = (unit._siegeTurnCount || 0) + 1;

  _pendingBattleConfirms.push({
    playerSide: attackers,
    enemySide: defenders,
    nodeLabel: city.name,
    siegeBattle: true,
    siegeCity: city,
    playerIsAttacker: true,  // ★ v133fix: 玩家主动攻城必须标记为攻方，否则走守城弹窗导致攻守反转
  });
  _showNextBattleConfirm();
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.c cancelSiege (v181 L21173-L21182) ──
// ════════════════════════════════════════════════════════════════════

function cancelSiege(uid){
  const unit = G.units.find(x => x.id === uid);
  if(!unit) return;
  unit.status = 'halt';
  unit.siegeTarget = null;
  unit._siegeTurnCount = 0;
  const gname = unit.squads[0]?.genName || '?';
  log('🚶 ' + gname + '部 解除围城，撤退', 'battle');
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.d startMoveFromPanel (v181 L21184-L21195) ──
// ════════════════════════════════════════════════════════════════════

function startMoveFromPanel(uid){
  const u=G.units.find(x=>x.id===uid);
  if(!u) return;
  if(u.mobilizingTurns>0){ showNotif(`整备中，还需${u.mobilizingTurns}旬`,'warn'); return; }
  if(u.status==='camp'){ showNotif('扎营中，请先拔营出发','warn'); return; }
  if(u.status==='ambush'){ showNotif('埋伏中，请先解除埋伏','warn'); return; }
  G.selUnitId=uid;
  clearMovePreview();
  G.activeTab='mil';updateTabs();
  renderAllLight();
  showNotif('点击地图上任意节点设定目标','warn');
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.e cancelUnitMove (v181 L21196-L21206) ──
// ════════════════════════════════════════════════════════════════════

function cancelUnitMove(uid){
  const u=G.units.find(x=>x.id===uid);
  if(!u) return;
  u.hexPath = [];
  const curNode=getUnitNodeId(u);
  u.movePath=curNode?[curNode]:[];
  
  u.status=curNode && G.cities[curNode]?'garrison':'halt';
  log(`${u.squads[0]?.genName}部 取消移动指令`,'economy');
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.f sortieFromCity (v181 L21289-L21329) ──
// ════════════════════════════════════════════════════════════════════

function sortieFromCity(cityId){
  const city = G.cities[cityId];
  if(!city) return;

  const myUnits = G.units.filter(u => {
    if(u.fac !== city.fac) return false;
    return getUnitNodeId(u) === cityId;
  });
  if(!myUnits.length){ showNotif('城内无可出击部队', 'warn'); return; }

  const enemySiegeUnits = G.units.filter(u =>
    u.status === 'siege' && u.siegeTarget === cityId && u.fac !== city.fac
  );
  if(!enemySiegeUnits.length){ showNotif('已无围城之敌', 'info'); return; }

  // siege敌军战力×0.95（专注攻城，阵型不整）
  enemySiegeUnits.forEach(u => u.squads.forEach(sq => {
    sq._siegeDebuff = true;
    sq.morale = Math.max(10, sq.morale - 5);
  }));

  const nodeLabel = city.name + '（守方出城）';
  if(myUnits.some(u => u.fac === G.playerFac)){
    _pendingBattleConfirms.push({ playerSide: myUnits, enemySide: enemySiegeUnits, nodeLabel, siegeInterdict: true });
    // 注意：_siegeDebuff保留至战斗结算后由confirmBattle清除（DEF惩罚生效）
    // 只还原士气扣减（士气变化不应在弹窗确认前持久化）
    enemySiegeUnits.forEach(u => u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); }));
    _showNextBattleConfirm();
  } else {
    // AI守方出城决策（此处已由玩家触发，应不会走到这里）
    _resolveBattleEngagement(myUnits, enemySiegeUnits, nodeLabel, null);
    enemySiegeUnits.forEach(u => {
      u.squads.forEach(sq => { sq.morale = Math.min(100, sq.morale + 5); delete sq._siegeDebuff; });
      if(u.squads.some(sq => sq.troops > 0) && u.status !== 'garrison'){
        u.siegeTarget = null; u._siegeTurnCount = 0;
      }
    });
    renderAll();
    if(_battleReports.length && !_fastForward) setTimeout(showNextBattleReport, 300);
  }
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.g setCamp (v181 L21332-L21359) ──
// ════════════════════════════════════════════════════════════════════

function setCamp(uid){
  const u=G.units.find(x=>x.id===uid); if(!u) return;
  if(isUnitOnWater(u)){ showNotif('水域中无法扎营','warn'); return; } // ★ v138 水战
  if(u.mobilizingTurns>0){ showNotif(`整备中，还需${u.mobilizingTurns}旬`,'warn'); return; }
  if(u.status==='camp'){ showNotif('已在扎营状态','warn'); return; }
  if(u.status==='garrison'){ showNotif('城内驻守无需扎营，请先出城','warn'); return; } // ★ v136
  // 消耗金钱与木材（建造营寨）
  const fac=G.factions[u.fac];
  if(!fac){ showNotif('势力数据异常','warn'); return; }
  const _cc = getCampCost(u.fac); // ★ v115
  if((fac.res.gold||0)<_cc.gold){
    showNotif(`金钱不足（扎营需${_cc.gold}金）`,'warn'); return;
  }
  if((fac.res.wood||0)<_cc.wood){
    showNotif(`木材不足（扎营需${_cc.wood}木）`,'warn'); return;
  }
  safeSub(fac.res, 'gold', _cc.gold);
  safeSub(fac.res, 'wood', _cc.wood);
  const curNode=getUnitNodeId(u);
  u.status='camp';
  u.campMobilizeTurns=0; u.hexPath=[]; // 拔营倒计时（拔营指令下达后才开始计）
  u.movePath=curNode?[curNode]:u.movePath;
  
  const name=u.squads[0]?.genName||'?';
  const loc=G.cities[curNode]?.name||'野外';
  log(`🏕 ${name}部 于${loc}立寨扎营（耗金${CAMP_COST.gold} 木${CAMP_COST.wood}），粮耗降低`,'economy');
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.h setAmbush (v181 L21362-L21381) ──
// ════════════════════════════════════════════════════════════════════

function setAmbush(uid){
  const u=G.units.find(x=>x.id===uid); if(!u) return;
  if(isUnitOnWater(u)){ showNotif('水域中无法设伏','warn'); return; } // ★ v138 水战
  if(u.mobilizingTurns>0){ showNotif(`整备中，还需${u.mobilizingTurns}旬`,'warn'); return; }
  if(u.status==='ambush'){ showNotif('已在埋伏状态','warn'); return; }
  if(u.status==='garrison'){ showNotif('城内驻守无法设伏，请先出城','warn'); return; } // ★ v136
  // 任意地形均可埋伏，平原仅警告不阻止
  const terrain=getTerrainAt(u.hq, u.hr);
  if(terrain==='plain'||terrain==='road'){
    showNotif('平原一马平川，中伏概率仅15%，智力差也难补（封顶45%）','warn');
  }
  const curNode=getUnitNodeId(u);
  u.status='ambush';
  u.hexPath=[]; u.movePath=curNode?[curNode]:u.movePath;
  
  const name=u.squads[0]?.genName||'?';
  const loc=G.cities[curNode]?.name||'山野';
  log(`🌿 ${name}部 于${loc}设伏，等待敌军通过`,'battle');
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.i cancelSpecialStatus (v181 L21384-L21401) ──
// ════════════════════════════════════════════════════════════════════

function cancelSpecialStatus(uid){
  const u=G.units.find(x=>x.id===uid); if(!u) return;
  if(u.status!=='camp'&&u.status!=='ambush'){ showNotif('当前不在扎营/埋伏状态','warn'); return; }
  const name=u.squads[0]?.genName||'?';
  if(u.status==='camp'){
    // 拔营需要1旬整备（不能即扎即发）
    if(u.campMobilizeTurns>0){ showNotif(`拔营中，还需${u.campMobilizeTurns}旬`,'warn'); return; }
    u.campMobilizeTurns=CAMP_MOBILIZE_TURNS;
    log(`🏕 ${name}部 开始拔营，${CAMP_MOBILIZE_TURNS}旬后可出发`,'economy');
    renderAllLight();
    return;
  }
  // 埋伏：立即解除
  const curNode=getUnitNodeId(u);
  u.status=G.cities[curNode]?'garrison':'halt';
  log(`🌿 ${name}部 解除埋伏，恢复待命`,'economy');
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.j disbandUnit (v181 L21683) ──
// ════════════════════════════════════════════════════════════════════

function disbandUnit(uid){const u=G.units.find(x=>x.id===uid);if(!u||u.fac!==G.playerFac)return;const _dRetWarn=u.squads.filter(sq=>getRetainers(sq.genName)>0).map(sq=>`${sq.genName}部曲${getRetainersDisplay(sq.genName)}人`).join('、');const _dMsg=_dRetWarn?`确认解散${u.squads[0]?.genName}部？\n\n⚠ 将永久损失：${_dRetWarn}！建议改用休整屯田保留部曲。`:`确认解散${u.squads[0]?.genName}部？`;if(!confirm(_dMsg))return;u.squads.forEach(sq=>setRetainers(sq.genName,0));G.units=G.units.filter(x=>x.id!==uid);if(G.selUnitId===uid)G.selUnitId=null;log(`${u.squads[0]?.genName}部 已解散`,'economy');renderAll();}

// ════════════════════════════════════════════════════════════════════
// ── MIL8.k getUnitAtCity (v181 L21689-L21692) ──
// ════════════════════════════════════════════════════════════════════

function getUnitAtCity(unit){
  const cityId = HEX_CITY[hkey(unit.hq??0, unit.hr??0)];
  return cityId ? G.cities[cityId] : null;
}

// ════════════════════════════════════════════════════════════════════
// ── MIL9 AI _exec 入口 (sprint batch-30 _exec 归位架构债, v181 L13395-L13536) ──
//    8 funcs: Move / Recruit / Disband / SetCamp / SetAmbush /
//             CancelSpecial / CancelSiege / SetReinforcePolicy
// ════════════════════════════════════════════════════════════════════

function _execMove(fid, act) {
  const unit = _findUnit(fid, act.leader);
  if (!unit) { console.warn('[ClaudeAI] move: 找不到部队', act.leader, `| ${FAC[fid]?.name}部队:`, G.units.filter(u=>u.fac===fid).map(u=>u.squads.map(s=>s.genName).join('+')).join(', ')); return false; }
  if (unit.mobilizingTurns > 0) { console.warn('[ClaudeAI] move: 整备中', act.leader, unit.mobilizingTurns, '旬'); return false; }
  const cityId = _resolveCityId(act.target);
  if (!cityId) { console.warn('[ClaudeAI] move: 目标城市无效', act.target); return false; }
  const cdef = CITY_MAP[cityId];
  if (!cdef) { console.warn('[ClaudeAI] move: CITY_MAP无此城', cityId); return false; }
  const troopType = getMainTroopType(unit);
  const path = hexAstar(unit.hq, unit.hr, cdef.q, cdef.r, troopType, fid);
  if (!path) { console.warn('[ClaudeAI] move: 寻路失败', act.leader, '→', cityId); return false; }
  unit.hexPath = path.path.slice(1);
  unit.movePath = [cityId];
  unit.status = 'march';
  unit._aiRole = act.type === 'attack' ? 'attack' : (act.role || 'move'); // ★ v159fix: attack type直接标记进攻意图
  unit._aiTarget = cityId;
  return true;
}

function _execRecruit(fid, act) {
  // Claude指定城市和武将征兵
  const cityId = _resolveCityId(act.city);
  const city = G.cities[cityId];
  if (!city || city.fac !== fid) { console.warn('[ClaudeAI] recruit: 城市无效或非己方', act.city); return false; }
  if (city.recruitedThisTurn) { console.warn('[ClaudeAI] recruit: 本旬已征兵', act.city); return false; }
  if (G.units.filter(u => u.fac === fid).length >= (typeof MAX_FIELD_UNITS_ABS !== 'undefined' ? MAX_FIELD_UNITS_ABS : 12)) { console.warn('[ClaudeAI] recruit: 部队数达上限'); return false; }
  // ★ v158: 未指定武将时自动选最高统帅的闲置武将
  let genName = act.general;
  if (!genName) {
    const idle = (G.generals[fid] || []).filter(g => {
      if (g.role === 'ruler') return false;
      if (_genDeployed(g.name, fid)) return false;
      if (Object.values(G.cities).some(c => c.fac === fid && c.prefect === g.name)) return false;
      if (G.factions[fid]?.strategist === g.name) return false;
      if (G.factions[fid]?._tech?.current?.genName === g.name) return false;
      return true;
    }).sort((a, b) => b.com - a.com);
    genName = idle[0]?.name;
  }
  if (!genName || !_genInFac(genName, fid)) { console.warn('[ClaudeAI] recruit: 无可用武将', genName); return false; }
  if (_genDeployed(genName, fid)) { console.warn('[ClaudeAI] recruit: 武将已部署', genName); return false; }
  // 检查太守/研究中也不能征
  if (Object.values(G.cities).some(c => c.fac === fid && c.prefect === genName)) { console.warn('[ClaudeAI] recruit: 武将是太守', genName); return false; }
  const tech = G.factions[fid]?._tech;
  if (tech?.current?.genName === genName) { console.warn('[ClaudeAI] recruit: 武将在研究中', genName); return false; }
  const troopType = act.troop_type || 'light';
  const troops = Math.min(act.troops || 3000, Math.floor(city.pop * 0.10), 5000);
  if (troops < 500) { console.warn('[ClaudeAI] recruit: 人口不足', city.name, city.pop); return false; }
  const goldCost = calcRecruitCost(fid, cityId, troops, TROOP_TYPES[troopType]?.costMult || 1.0); // D-006 fix: 6 修正 (此前裸价)
  const fac = G.factions[fid];
  if (fac.res.gold < goldCost) { console.warn('[ClaudeAI] recruit: 金钱不足', fac.res.gold, '<', goldCost); return false; }
  // 兵种资源检查
  const matCost = calcSlotMatCost(troopType, troops);
  if (!canAffordMat(fid, matCost)) { console.warn('[ClaudeAI] recruit: 材料不足', troopType, matCost, '| 资源:', JSON.stringify(fac.res)); return false; }
  safeSub(fac.res, 'gold', goldCost);
  deductMat(fid, matCost);
  city.pop -= troops;
  city.recruitedThisTurn = true;
  const squads = [{ genName, type: troopType, troops, maxTroops: troops, morale: 70 }];
  const unit = createUnit({ fac: fid, spawnCityId: cityId, squads });
  // D-035 fix: 设 unit.level（v116 特色兵种 eliteLevel + 玩家路径同公式 v181.html:9314-9315）
  // createUnit 默认 level=1 → AI 永远 Lv.1 出厂；玩家路径 max(eliteLevel, getInitLevel(city))
  const _eliteLv = TROOP_TYPES[troopType]?.eliteLevel || 0;
  unit.level = _eliteLv > 0 ? Math.max(_eliteLv, getInitLevel(city)) : getInitLevel(city);
  unit.mobilizingTurns = 3;
  unit._apRemaining = 0;
  G.units.push(unit);
  log(`⚔ [AI] ${FAC[fid]?.name} ${genName}于${city.name}征兵${fmt(troops)}${troopType}，3旬整备`, 'economy');
  return true;
}

function _execDisband(fid, act) {
  const unit = _findUnit(fid, act.leader);
  if (!unit) return false;
  const loc = getUnitNodeId(unit);
  if (!loc) return false;
  const city = G.cities[loc];
  if (!city || city.fac !== fid) return false;
  const troops = getUnitTroops(unit);
  city.pop += Math.floor(troops * 0.6);
  // D-015 fix: 清亲卫 (跟玩家 disbandUnit L7448 对齐, 玩家/AI 对称); 否则 AI 裁军后亲卫数 ghost 残留 (武将名下 retainers 永不归零)
  unit.squads.forEach(sq => setRetainers(sq.genName, 0));
  G.units = G.units.filter(u => u.id !== unit.id);
  log(`🔻 [AI] ${FAC[fid]?.name}于${city.name}裁军${fmt(troops)}`, 'economy');
  return true;
}

function _execSetCamp(fid, act) {
  const unit = _findUnit(fid, act.leader);
  if (!unit) { console.warn('[ClaudeAI] set_camp: 找不到部队', act.leader); return false; }
  if (unit.status === 'garrison') { console.warn('[ClaudeAI] set_camp: 城内驻守无需扎营', act.leader); return false; }
  if ((unit.mobilizingTurns || 0) > 0) { console.warn('[ClaudeAI] set_camp: 整备中', act.leader); return false; }
  // D-016 fix: 扣金 + 木资源（模仿玩家 setCamp src/chains/military.js:7344-7345，原本免费扎营 exploit）
  const fac = G.factions[fid];
  if (!fac) return false;
  const _cc = getCampCost(fid);
  if ((fac.res.gold || 0) < _cc.gold) { console.warn('[ClaudeAI] set_camp: 金钱不足', _cc.gold); return false; }
  if ((fac.res.wood || 0) < _cc.wood) { console.warn('[ClaudeAI] set_camp: 木材不足', _cc.wood); return false; }
  safeSub(fac.res, 'gold', _cc.gold);
  safeSub(fac.res, 'wood', _cc.wood);
  unit.status = 'camp';
  unit.hexPath = [];
  return true;
}

function _execSetAmbush(fid, act) {
  const unit = _findUnit(fid, act.leader);
  if (!unit) { console.warn('[ClaudeAI] set_ambush: 找不到部队', act.leader); return false; }
  if (unit.status === 'garrison') { console.warn('[ClaudeAI] set_ambush: 城内驻守无法设伏', act.leader); return false; }
  if ((unit.mobilizingTurns || 0) > 0) { console.warn('[ClaudeAI] set_ambush: 整备中', act.leader); return false; }
  const terrain = HEX_TERRAIN[hkey(unit.hq, unit.hr)];
  if (!['forest', 'hill', 'mountain', 'swamp'].includes(terrain)) { console.warn('[ClaudeAI] set_ambush: 地形不允许', act.leader, terrain); return false; }
  unit.status = 'ambush';
  unit.hexPath = [];
  return true;
}

function _execCancelSpecial(fid, act) {
  const unit = _findUnit(fid, act.leader);
  if (!unit) return false;
  if (unit.status === 'camp' || unit.status === 'ambush') {
    unit.status = 'halt';
    return true;
  }
  return false;
}

function _execCancelSiege(fid, act) {
  const unit = _findUnit(fid, act.leader);
  if (!unit || unit.status !== 'siege') return false;
  unit.status = 'halt';
  return true;
}

// ★ v159fix: 补员策略设置
function _execSetReinforcePolicy(fid, act) {
  const policy = act.policy;
  if (!['aggr', 'bal', 'elit'].includes(policy)) return false;
  if (!G.factions[fid]) return false;
  G.factions[fid].policyId = policy;
  const labels = { aggr: '激进', bal: '均衡', elit: '精兵' };
  log(`📋 [AI] ${FAC[fid]?.name}补员策略调整为「${labels[policy]}」`, 'economy');
  return true;
}

// ════════════════════════════════════════════════
// MIL10 — 玩家 billet 入口 (driving 休整驻扎流程)
// ════════════════════════════════════════════════
// ── owner: military chain ── (玩家主动 billet, 跟 MIL8.x 玩家入口同质)
// 原 v181 L1443-L1521, 79 行 verbatim
// 转入休整驻扎（立即，需在可驻扎城市上）
function billetUnit(uid){
  const u=G.units.find(x=>x.id===uid);
  if(!u||u.fac!==G.playerFac) return;
  const cities = getBilletCities(u.fac);
  if(!cities.length){ showNotif('无可用大城','warn'); return; }
  // 弹窗选目标城市
  const body = cities.map(cid=>{
    const c=G.cities[cid]; if(!c) return '';
    const def=CITY_MAP[cid];
    const dist=def?hexDist(u.hq??0,u.hr??0,def.q,def.r):0;
    const poolCount=(c.billetPool||[]).length;
    const travelT = dist <= 5 ? 0 : Math.ceil((dist - 5) / 5);
    const travelStr = travelT > 0 ? `行程${travelT}旬` : '即到';
    return `<div onclick="_confirmBillet('${uid}','${cid}')" style="cursor:pointer;padding:8px 12px;border-bottom:1px solid rgba(80,65,40,.07);display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background='rgba(80,65,40,.06)'" onmouseout="this.style.background='none'">
      <div><span style="color:${FAC[u.fac]?.color||'#ccc'}">${c.name}</span>${def?.isCapital?'<span style="color:var(--ink-l);font-size:9px;margin-left:2px">★</span>':''}
        <span style="font-size:9px;color:rgba(92,74,50,.35);margin-left:4px">${poolCount?'已有'+poolCount+'支休整':'空'}</span></div>
      <span style="font-size:9px;color:rgba(92,74,50,.35)">${dist}格 · ${travelStr}</span>
    </div>`;
  }).join('');
  const el=document.getElementById('genericModal');
  document.getElementById('genericModalTitle').textContent='选择休整屯田大城';
  document.getElementById('genericModalBody').innerHTML=`
    <div style="padding:8px 14px;font-size:10px;color:rgba(92,74,50,.45)">
      部队将休整屯田，武将释放回闲置池。<br>兵员保留于选定城市，粮饷降至1/5，屯田产粮。
    </div>${body}`;
  el.style.display='flex';
}
function _confirmBillet(uid, cityId){
  closeModal();
  const u=G.units.find(x=>x.id===uid);
  if(!u) return;
  const city=G.cities[cityId];
  if(!city||!canBilletToCity(cityId,u.fac)){ showNotif('城市不可用','warn'); return; }
  // ★ v113: 遣散行程——按距离决定几旬后兵员到达
  const def=CITY_MAP[cityId];
  const dist=def?hexDist(u.hq??0,u.hr??0,def.q,def.r):0;
  const travelTurns = dist <= 5 ? 0 : Math.ceil((dist - 5) / 5); // 5格内即到，每多5格+1旬
  const readyTurn = G.turn + travelTurns;
  // 提取兵员信息
  const pool = city.billetPool = city.billetPool || [];
  u.squads.forEach(sq=>{
    if(sq.troops<=0) return;
    // ★ v164: billet拆双条目——部曲条目(绑武将)+辅兵条目(通用)
    const _ret = getRetainers(sq.genName);
    const _retInSq = Math.min(_ret, sq.troops);
    const _auxTroops = sq.troops - _retInSq;
    const _retType = getRetainerType(sq.genName) || sq.type;
    // 部曲条目（绑武将，别人不可用）
    if(_retInSq > 0){
      pool.push({
        id: 'bp_'+G.turn+'_'+Math.random().toString(36).slice(2,6),
        troops: _retInSq, maxTroops: _retInSq,
        type: _retType, level: RETAINER_LEVEL, billetTurn: G.turn,
        readyTurn: readyTurn,
        genName: sq.genName, // ★ v164: 绑定武将，只有此武将可用
      });
    }
    // 辅兵条目（通用，兵种锁定）
    if(_auxTroops > 0){
      pool.push({
        id: 'bp_'+G.turn+'_'+Math.random().toString(36).slice(2,6),
        troops: _auxTroops, maxTroops: Math.max(_auxTroops, (sq.maxTroops||sq.troops) - _retInSq),
        type: sq.type, level: u.level||1, billetTurn: G.turn,
        readyTurn: readyTurn,
      });
    }
    // ★ v167fix: 部曲数据转移到仓库后，清零户口本（防止双写）
    if(_retInSq > 0) setRetainers(sq.genName, 0);
  });
  const genNames=u.squads.map(sq=>sq.genName).join('、');
  const totalTroops=getUnitTroops(u);
  const travelMsg = travelTurns > 0 ? `（行程${travelTurns}旬）` : '';
  log(`🏠 ${genNames} 休整屯田于${city.name}，${fmt(totalTroops)}兵入库（Lv${u.level||1}）${travelMsg}，武将归队`,'economy');
  // 删除部队
  G.units=G.units.filter(x=>x.id!==uid);
  if(G.selUnitId===uid) G.selUnitId=null;
  renderAllLight();
}
