// src/core/tick.js
//
// 主循环层 — turn loop body + AI orchestrator + fast-forward driver + stats snapshot.
//
// 来源:从 project_romance_v181.html 抽离(Session 3.4 / 阶段 3,选项 C)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// ── 抽离范围(选项 C,经制作人 approve)──
//   T3 `runRebelAI()`            v181 L7818-L7883    叛军 AI(被 nextTurn 调)
//   T2 `runAI()`                 v181 L10360-L10472  AI 主循环(含 phase 3.3 留下的段 B
//                                                    Claude 调度耦合 L10371-L10402,本 session 一并归位)
//   T1 `nextTurn()`              v181 L13160-L13538  主回合体,async,调 ~50 个
//                                                    process*/check*/ai* chain mutator
//   T4 `fastForwardTurns(n)`     v181 L14675-L14718  快进驱动(调 nextTurn in loop)
//   T5 `_statsHistory / _STATS_MAX / pushStatsSnapshot`
//                                v181 L14720-L14740  每旬 stats 快照(被 nextTurn 调用)
//
// ── 留 v181(选项 C 不抽,后续 sub-session 处理)──
//   M3 showTitleScreen / M4 backToTitle / M6 _exitGame / _checkSavesForTitle
//   顶层 lets 全部留 v181(`_unitIdCounter / _fastForward / _ffTurns / _aiBattleProcessedThisTurn
//   / _battleReports / _pending* 队列 / _techEffectCache / _supplyCache / _facInfluenceCache
//   / _deployedGensMoraleCache / 各 render lets`)— mechanism 等各 chain 抽时归位,
//   render 按 phase 2 原则留 v181
//   M5 顶层 boot call `showTitleScreen()`(L31571)— 留 v181 inline script 末尾,
//   避免跨 script 解析期 `showTitleScreen` 未定义的 race
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/state.js / helpers.js / hubs.js
// / claude_ai.js + src/render/ 模块共享 hoisted function 全局可见,无 import/export)。
//
// T5 的 `_statsHistory` 和 `_STATS_MAX` 是 top-level **const**(不是 let)。跨 classic
// `<script>` 顶层 const 共享理论上同 let,但 phase 3.1 的"重要验证锚点"只覆盖了 let
// (G、`_claudeAI` 等)。本 session 抽离时**显式做一次 smoke**验证 const 共享可靠 —
// 制作人 3.4 决策时的明确要求(_statsHistory 量级远小于 G,基本无风险但还是显式跑一次)。
//
// ── 反向调用(已 approve 设计原则 (c) 副作用通道)──
// 本文件抽出后仍会反向调用 v181 留下的(数量极多,T1 nextTurn 调 ~50 个 chain mutator):
//   - 经济: processCityFood / processFacEconomy / processBuildQueues / processTransfers
//           / processGarrisonRecovery / processUnitFood / processUnitSalary
//           / _cleanTradeAgreements
//   - 军事: processUnitMovement / checkAmbushTriggers / processSiegeDecay
//           / processReinforcement / processMobilizing / processMuster
//           / processSupplyStatus / aiInitiateBattle / updateFog / processPlagueSpreads
//           / resolveSiegeBattle / hexAstar / hexNeighbors / getHexMoveCost
//   - 武将: processLoyalty / addMerit / addStatExp / getFacPosts / checkPostDowngrade
//           / checkLoyaltyThresholds / refreshWildPool / addGenChronicle / addUnitExp
//           / getGenMeta / _deepCloneGen / setIntimacy
//   - 政治: processFactionLoyalty / processStageEvolution / triggerCourtCouncil
//           / aiConsiderEnthrone / calcPostBuffs / getCourtDecreeBuffs
//           / calcFactionInfluence
//   - 外交: checkDiplo / processClaimPrep / processFeudDecay / processReputation
//           / getDiploStatus / isHostile
//   - 事件: processEventCooldowns / rollEventsV2(checkEventPromises 已抽 hubs.js)
//   - 价值观: processFacEthos
//   - 豪族: processGentry
//   - AI 决策: aiExecuteOrders / aiDefenderDecision / aiDoSiege / aiDoRecruitTalent
//           / aiDoTechResearch / aiDoDiplo / aiDoTradeAgreement / aiDoDisband
//           / aiDoExpand / aiDoAddSquad / aiDoRecruit / aiDoBuild / aiDoTransfer
//           / _aiConsiderMigration / aiDoAppointments / aiDefendResponse
//           / aiSelectTargets / _aiCalcBudget / _aiInvalidateThreatCache
//           / _aiCourtSelect / _applyCourtDecisions
//   - Claude AI(已抽 claude_ai.js): callClaudeAPI / executeClaudeActions
//           / _updateIntelHistory / _isStrategicTurn / _recordActionSummary
//           / _claudeAI(状态根)
//   - 通用 / 其他: updateFacStats / checkElimination / checkResupply
//           / checkIntimacyThresholds / tickStrategyCDs / invalidateCityCache
//           / invalidateFogCache / renderAll / log / showNotif
//           / _drainPendingBattleAnimations / _checkSiegeArrival
//           / _showNextBattleConfirm / showNextBattleReport / showDiploSueForPeace
//           / showDiploVassal / showCourtCouncil / _showEnvoyIntelModal
//           / _buildEnvoyIntel / autoResolvePendingBattle / applyBattleExp
//           / _applySiegeAftermath / showGameEndOverlay / fuzzyTroopDisplay
//           / getUnitTroops / getUnitNodeId / calcUnitAP / unitsContact
//           / sleep / hkey / _shownCities / HEX_CITY / CITY_MAP / GEN_MAP
//           / FAC / getScenarioFactions() / YEARS / SEASONS / WILD_POOL_INTERVAL
//           / EVENT_CAT_COOLDOWN / AI_RECRUIT_INTERVAL
//           §8.4 W6-pending: MERIT_INIT 已退役 → _scenarioMaterialized.initialMerit (W4b/W5a 实装)
//           / CITIES_DEF
//   - 顶层 lets(留 v181): _marchAnimating / _fastForward / _deployedGensMoraleCache
//           / _pendingSiegeArrival / _aiBattleProcessedThisTurn / _battleReports
//           / _pendingBattleConfirms / _currentBattleConfirm / _pendingBattleAnimations
//           / _pendingPeaceOffer / _pendingVassalOffer / G(状态根)/ window._pendingCourtCouncil
// 同 phase 2/3.2/3.3 反向调用模式,(c) 已 approve。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_1_notes §二 / phase3_2_notes §二
//                      / phase3_3_notes §二)──
// PLAN 字面:"core/tick.js + main.js — 主循环 + 启动逻辑(nextTurn / 主循环 / 启动逻辑)"
//   字面映射:T1(376)+ M1(348)≈ 824 行
// scout 实测后选项 C 实抽(本文件):
//   T3 runRebelAI(plan 不知)+ T2 runAI(plan 笼统含)+ T1 nextTurn + T4 fastForwardTurns
//   (plan 不知)+ T5 stats(plan 不知)= ~623 行 verbatim
// **新工作流原则**(phase 3.3 起正式纳入):3.3 之后每个 sub-session 都要先 scout 实测,
// 不照 plan 字面抽。本 session 也命中(T3/T4/T5 plan 不知)。
//
// ── 选项 C(制作人选)──
// scout 报告 4 选项,制作人选 C(2 文件,只抽函数,顶层 lets 全留 v181):
//   1. 与 3.3 选项 A 风格一致(verbatim + 抽函数不抽配套 UI/lets,边界清晰)
//   2. 与 3.1 选项 A 一致("只抽根本体,兄弟 lets 留 v181")
//   3. 顶层 lets 各有所属(mechanism / cache / render),应跟所有者走
//   4. M4 backToTitle reset 20+ lets,这些 lets 留 v181 → backToTitle 也留 v181 自然成组
// T5 抽到 tick.js(写口在 nextTurn 内,留 v181 会割裂主循环)— 制作人 approve。
//
// ── carry-over 备忘 ──
// **M4 backToTitle(留 v181 L29237-L29279)是顶层 lets reset 集中点**。各 chain 阶段
// (3.5-3.12)抽离自家 mechanism let 时,需要同步处理 backToTitle 里对应的 reset 行
// (从 v181 写自家 let → 跨文件写)。这不是 3.4 解决的事,但 chain 阶段会反复遇到。

/**
 * 叛军AI：每旬在runAI后调用
 * - 找附近最弱己方城市，兵力>守军×0.6则进军围城，否则随机游走
 */
function runRebelAI(){
  G.units.filter(u=>u.fac==='rebel' && getUnitTroops(u)>0).forEach(unit=>{
    if(unit.hexPath && unit.hexPath.length>0) return; // 已在移动中

    // ★ v102 Bug6修复：叛军围城处理——围≥2旬后自动攻城（暴民不做胜率评估）
    if(unit.status === 'siege' && unit.siegeTarget){
      unit._siegeTurnCount = (unit._siegeTurnCount || 0) + 1;
      if(unit._siegeTurnCount >= 2){
        const city = G.cities[unit.siegeTarget];
        if(city && city.fac !== 'rebel' && isHostile('rebel', city.fac)){
          const attackers = [unit];
          const defenders = G.units.filter(u =>
            u.fac === city.fac && getUnitNodeId(u) === city.id && getUnitTroops(u) > 0
          );
          const nodeLabel = city.name;
          // ★ v175: 战前位置快照
          const _siegePosSnap = {};
          [...attackers, ...defenders].forEach(u => { _siegePosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) }; });
          const siegeReport = resolveSiegeBattle(attackers, defenders, city, nodeLabel);
          if(siegeReport){
            siegeReport.playerWasAttacker = false;
            _battleReports.push(siegeReport);
            _pendingBattleAnimations.push({
              kind: 'siege', report: siegeReport,
              attackers, defenders, posSnap: _siegePosSnap, city,
            });
            log('🔥 叛军攻打' + nodeLabel + '！' + (siegeReport.atkWins ? '城池沦陷！' : '被守军击退'), 'battle');
          }
        } else {
          // 目标城已是叛军或不再敌对，解除围城
          unit.status = 'halt';
          unit.siegeTarget = null;
          unit._siegeTurnCount = 0;
        }
      }
      return; // siege状态下不走下面的行军逻辑
    }

    // Bug4修复：叛军只攻打叛乱原城（rebelOrigin）
    const originCity = G.cities[unit.rebelOrigin];
    const curNode = getUnitNodeId(unit) || unit.rebelOrigin;

    if(originCity && originCity.fac !== 'rebel'){
      // 原城已被收复，进军围城
      const fromDef = CITY_MAP[curNode];
      const toDef = CITY_MAP[unit.rebelOrigin];
      if(fromDef && toDef){
        const hexR = hexAstar(fromDef.q, fromDef.r, toDef.q, toDef.r, 'light');
        if(hexR){ unit.hexPath = hexR.path.slice(1); unit.movePath=[unit.rebelOrigin]; unit.status='march'; }
      }
    } else {
      // 原城仍是叛军控制或不存在，随机游走骚扰
      // Rebel random walk on hex
      const nbs = hexNeighbors(unit.hq, unit.hr).filter(n=>getHexMoveCost(n.col,n.row,'light')<999);
      if(nbs.length){
        const pick = nbs[Math.floor(Math.random()*nbs.length)];
        unit.hexPath = [pick];
        unit.status = 'march';
      }
    }
  });
}

/**
 * AI 主函数
 */
async function runAI(){
  // 快进模式下玩家势力也托管给AI，实现完全对等的模拟
  const aiFacs = _fastForward
    ? getScenarioFactions()
    : getScenarioFactions().filter(f=>f!==G.playerFac);

  for(const fid of aiFacs){
    if(G.factions[fid]?._eliminated) continue; // ★ v119: 已淘汰势力不执行AI

    // ★ v157: Claude AI分支 — 优先用LLM决策，失败则fallback规则AI
    // ★ v158: 单城势力跳过API调用（决策空间小，省token）
    // ★ v159: Phase 5 情报更新 + 行动记录
    const _facCityCount = CITIES_DEF.filter(c => G.cities[c.id]?.fac === fid).length;
    if(_claudeAI.enabled && fid !== G.playerFac && _facCityCount >= 2){
      _updateIntelHistory(fid); // ★ v159: 更新情报历史（在getGameState前）
      const isStrat = _isStrategicTurn(fid);
      console.log(`[ClaudeAI] 🔄 ${getFactionDef(fid)?.name} 开始Claude决策（${_facCityCount}城, ${isStrat ? '★战略旬★' : '战术旬'}）...`);
      try {
        const result = await Promise.race([
          callClaudeAPI(fid),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), isStrat ? 30000 : 15000))
        ]);
        if(result?.actions?.length){
          const stats = executeClaudeActions(fid, result.actions);
          // ★ v159: 记录成功执行的指令到战略记忆
          if (stats._executedActions?.length) {
            _recordActionSummary(fid, stats._executedActions);
          }
          if (isStrat) _claudeAI._lastStrategicTurn[fid] = G.turn;
          console.log(`[ClaudeAI] ${getFactionDef(fid)?.name} 执行结果: ${stats.executed}成功, ${stats.skipped}跳过`, stats.errors.length ? stats.errors : '');
          if(stats.executed > 0){
            log(`🤖 [Claude] ${getFactionDef(fid)?.name}：${stats.executed}条指令执行`, 'event');
            // D-114 fix: Claude AI 接管时跳过下面的 aiDoDiplo, 手动衰减 _diploCD (跟 aiDoDiplo L658 同模式)
            // 频率: 每 3 旬一次 (跟 aiDoDiplo 调用频率一致, diploOffset 三家错峰)
            const _diploOff = {wei:0, shu:1, wu:2, nanman:1}[fid] || 0;
            if(((G.turn - 1) + _diploOff) % 3 === 0) _decayDiploCDForFac(fid);
            continue; // 成功，跳过规则AI
          }
        }
        console.warn(`[ClaudeAI] ${fid} fallback到规则AI（无有效指令）`);
      } catch(e){
        console.warn(`[ClaudeAI] ${fid} fallback到规则AI:`, e.message);
      }
    } else if(_claudeAI.enabled && fid !== G.playerFac && _facCityCount < 2){
      console.log(`[ClaudeAI] ⏭ ${getFactionDef(fid)?.name} 跳过（仅${_facCityCount}城，走规则AI）`);
    }
    // ── 0. G2P3: 计算本旬预算分配（军事/基建）──
    _aiCalcBudget(fid);

    // ── 1. AI 外交决策（每3旬评估一次，三家错峰：魏T%3=0, 蜀T%3=1, 吴T%3=2）──
    const diploOffset = {wei:0, shu:1, wu:2, nanman:1}[fid] || 0; // ★ v144: nanman同蜀偏移
    if(((G.turn - 1) + diploOffset) % 3 === 0) aiDoDiplo(fid);
    // ★ v165: AI通商协定（每6旬评估一次，与外交错开）
    if(((G.turn - 1) + diploOffset) % 6 === 0) aiDoTradeAgreement(fid);

    // ── 2. AI 裁军（兵民比超限时优先裁军，在征兵前执行）──
    aiDoDisband(fid);

    // ── 2b. ★ v113: AI 扩编（garrison在城的部队，优先扩编再征新兵）──
    aiDoExpand(fid);

    // ── 2c. ★ v121: AI 增编分队（<3分队部队补至3分队）──
    aiDoAddSquad(fid);

    // ── 3. AI 征兵 ──
    aiDoRecruit(fid);

    // ── 4. AI 基建 ──
    // ★ v163: AI 徭役管理 — 有建设项目时提中/高徭，无建设时回低徭
    {
      const _aiFac = G.factions[fid];
      const _aiCities = Object.values(G.cities).filter(c=>c.fac===fid);
      const _aiBuilding = _aiCities.some(c=>c.buildQueue && c.buildQueue.length > 0);
      const _aiAtWar = getScenarioFactions().some(of => of!==fid && of!=='rebel' && getDiploStatus(fid,of)==='enemy');
      if(_aiBuilding && _aiAtWar) _aiFac.corveeId = 'mid';      // 战时建设：中徭（保守，避免民心崩）
      else if(_aiBuilding && !_aiAtWar) _aiFac.corveeId = 'high'; // 和平建设：重徭冲刺
      else _aiFac.corveeId = 'low';                               // 无建设：不征发
    }
    aiDoBuild(fid);

    // ── 4b. ★ v104: AI 调粮（缺粮城从富余城调拨） ──
    aiDoTransfer(fid);

    // ── 4b2. ★ v166: AI 迁民（被围城时焦土策略） ──
    _aiConsiderMigration(fid);

    // ── 4c. ★ v111: AI 任命太守+封官（每6旬，与外交错峰） ──
    if(G.turn % 6 === ({wei:2, shu:4, wu:0, nanman:3}[fid] || 0)) {
      try { aiDoAppointments(fid); } catch(e) { console.error('[v111] aiDoAppointments crashed for', fid, e); log(`⚠️ AI异常: ${getFactionDef(fid)?.name||fid} 官职任命模块`, 'warn'); }
    }

    // ── 5. G2P2: AI 防守响应（在进攻规划之前，确保防守优先） ──
    try { aiDefendResponse(fid); } catch(e) { console.error('[G2P2] aiDefendResponse crashed for', fid, e); log(`⚠️ AI异常: ${getFactionDef(fid)?.name||fid} 防守响应模块`, 'warn'); }

    // ── 6. G2: AI 战略决策（目标选择+部队分配） ──
    try { aiSelectTargets(fid); } catch(e) { console.error('[G2] aiSelectTargets crashed for', fid, e); log(`⚠️ AI异常: ${getFactionDef(fid)?.name||fid} 战略决策模块`, 'warn'); }

    // ── 7. G2: AI 执行层（行军/集结/围城判断） ──
    try { aiExecuteOrders(fid); } catch(e) { console.error('[G2] aiExecuteOrders crashed for', fid, e); log(`⚠️ AI异常: ${getFactionDef(fid)?.name||fid} 行军执行模块`, 'warn'); }

    // ── 8. ★ GT2: AI 围城守方博弈（在攻城决策前判断是否出城） ──
    try { aiDefenderDecision(fid); } catch(e) { console.error('[GT2] aiDefenderDecision crashed for', fid, e); log(`⚠️ AI异常: ${getFactionDef(fid)?.name||fid} 守城决策模块`, 'warn'); }

    // ── 9. G2: AI 攻城决策（用胜率替代随机） ──
    try { aiDoSiege(fid); } catch(e) { console.error('[G2] aiDoSiege crashed for', fid, e); log(`⚠️ AI异常: ${getFactionDef(fid)?.name||fid} 攻城决策模块`, 'warn'); }

    // ── 7. ★ v104: AI人才招募（在野+挖角统一，每3旬，与外交错峰） ──
    const recruitOffset = {wei:1, shu:2, wu:0, nanman:1}[fid] || 0;
    if(((G.turn - 1) + recruitOffset) % AI_RECRUIT_INTERVAL === 0) aiDoRecruitTalent(fid);

    // ── 10. ★ v115: AI 科技研究 ──
    aiDoTechResearch(fid);
  } // end for(fid of aiFacs)
}

// ═══════════════════════════════════════
// TURN
// ═══════════════════════════════════════
async function nextTurn(){
  if(_marchAnimating) return; // ★ v99: 行军动画中不可推进
  // ★ v130: 事件弹窗阻塞
  if(G._pendingEvent){ showNotif('请先处理当前事件','warn'); return; }
  // ★ v119: 胜利/失败后阻止推进（快进模式除外，允许继续观战）
  if(!_fastForward && G._victoryShown) return;
  // ★ v115优化: 清除增量渲染缓存，旬切换必须全量重建（迷雾/城市归属可能变）
  const _mr = document.getElementById('mapRoot');
  if(_mr) _mr.remove();
  invalidateCityCache(); invalidateFogCache();
  _deployedGensMoraleCache = null; // 重置每旬缓存
  _pendingSiegeArrival = null;     // ★ v86: 重置围城到达标记
  G._commonEnemyDiploThisTurn = {}; // 重置共同抗敌外交加成去重表
  // ★ C3：重置战斗rel扣减去重标记
  Object.keys(G).filter(k=>k.startsWith('_battleRelDedup_')).forEach(k=>delete G[k]);
  G.units.forEach(u => { u._retreatedThisTurn = false; delete u._aiForceAdvance; delete u._arrivedThisTurn; }); // ★ v87: 重置撤退标记 / v111: 清理强推标记 / v133: 清理援军标记
  // ★ v99: 全部队AP重置（玩家用于即时移动，AI用于撤退疲劳判定）
  // ★ v108: 整备中部队AP保持0
  G.units.forEach(u => {
    u._apRemaining = (u.mobilizingTurns > 0) ? 0 : calcUnitAP(u);
  });
  // 玩家部队额外重置即时移动标记
  G.units.filter(u => u.fac === G.playerFac).forEach(u => {
    u._apSpentThisTurn = false;
  });
  const btn=document.getElementById('btnTurn');
  btn.disabled=true;
  const ov=document.getElementById('turnOv');
  ov.classList.add('show');
  G.turn++;
  // SKILL_INLINE: fengchu_reset — 庞统凤雏：旬初重置各势力计谋计数器
  G._factionSchemeCount = {};
  // ★ v130: 事件系统冷却递减
  processEventCooldowns();
  // ★ v78: 1旬=10天，1季=9旬，1年=36旬
  G.seasonIdx = Math.floor(((G.turn - 1) % 36) / 9); // 0春1夏2秋3冬
  if(G.turn > 1 && (G.turn - 1) % 36 === 0) G.year = Math.min(G.year + 1, YEARS.length - 1);
  document.getElementById('ovMsg').textContent=`${YEARS[G.year]} · ${SEASONS[G.seasonIdx]}`;

  // §5.6 机制 2: 自然死亡 hook — 每旬维护 G.genNaturalDeathTurn + 触发死亡
  //   3 步: (a) orphan sweep — 武将已不在 active (反间计 fled / 其他 .filter 删) → 清 entry
  //         (b) newcomer sweep — 后来加入 active (上旬 pending debut / wild 招募 / surrender) 无 entry → 派生 deathTurn
  //         (c) trigger — G.turn >= deathTurn → killGen natural_age 分支
  //   位置: G.turn++ 后 + 任何战斗/事件队列前 (codex P1: 防 killGen 删 _pendingBattleConfirms 引用的武将)
  //   newcomer 派生: entry.birthYear/deathYear/deathCause (W4a 后已带) 优先, fallback GEN_BASE
  //   rawDeathTurn <= G.turn (e.g. 出场已过寿命窗口) → reschedule G.turn + 1-36 旬
  //   ruler 自然死走 succeedRuler (killGen 内部已 cover)
  if(G.genNaturalDeathTurn){
    const _activeNames = new Set();
    Object.values(G.generals).forEach(arr => arr.forEach(g => _activeNames.add(g.name)));
    // (a) orphan sweep
    Object.keys(G.genNaturalDeathTurn).forEach(name => {
      if(!_activeNames.has(name)) delete G.genNaturalDeathTurn[name];
    });
    // (b) newcomer sweep
    const _stY = G.startYear ?? 214;
    Object.values(G.generals).forEach(arr => arr.forEach(g => {
      if(G.genNaturalDeathTurn[g.name] != null) return;
      const gb = (typeof GEN_BASE !== 'undefined' && GEN_BASE) ? GEN_BASE[g.name] : null;
      const birth = (g.birthYear != null) ? g.birthYear : (gb && gb.birthYear);
      if(birth == null) return;
      const dy = (g.deathYear != null) ? g.deathYear : (gb && gb.deathYear);
      const dc = g.deathCause || (gb && gb.deathCause);
      let deathYearRoll;
      if(dc === 'natural' && dy != null){
        deathYearRoll = dy + Math.floor(Math.random()*5) - 2;
      } else {
        deathYearRoll = birth + 60 + Math.floor(Math.random()*21);
      }
      const yearOff = deathYearRoll - _stY;
      const turnInYear = 1 + Math.floor(Math.random()*36);
      const raw = yearOff*36 + turnInYear;
      G.genNaturalDeathTurn[g.name] = raw > G.turn ? raw : (G.turn + 1 + Math.floor(Math.random()*36));
    }));
    // (c) trigger
    const _toAge = [];
    Object.keys(G.genNaturalDeathTurn).forEach(name => {
      if(G.turn >= G.genNaturalDeathTurn[name]) _toAge.push(name);
    });
    _toAge.forEach(name => killGen(name, null, {trigger: 'natural_age'}));
  }

  if(!_fastForward) await sleep(350);

  // 清除本旬已弹城市记录，重新检测
  _shownCities.clear();

  // 重置外交行动标记
  Object.values(G.diplo).forEach(d=>{ d._actedThisTurn=false; });
  // D-120 fix: 重置顶层 _diploActed_${fid}（与 B1 字段同时机）
  getScenarioFactions().forEach(fid => { delete G[`_diploActed_${fid}`]; });

  // ★ I3 fix: 预计算 _postBuffs（含朝议decree），使 processCityFood/processMorale 在首旬即能读到
  Object.keys(G.factions).forEach(fid => {
    if(fid === 'rebel') return;
    const pb = calcPostBuffs(fid);
    const db = getCourtDecreeBuffs(fid);
    Object.keys(db).forEach(k => { if(pb.hasOwnProperty(k)) pb[k] += db[k]; });
    G.factions[fid]._postBuffs = pb;
  });

  Object.values(G.cities).forEach(city=>{
    city.recruitedThisTurn=false; // 重置征兵冷却
    processCityFood(city);   // ★ 城市级粮食先处理
    processMorale(city);
    processPop(city);
    processGarrisonRecovery(city); // 城防军自然补员
    if(city.fac !== 'rebel' && city.occupied>0) city.occupied--; // ★ batch-21 D-026: rebel 期间 occupied 字段冻结
  });
  G._migratedThisTurn = false; // ★ v166: 重置迁民冷却
  _cleanTradeAgreements();   // ★ v165: 清理失效通商协定
  processFacEconomy();       // 非粮食资源
  processBuildQueues();
  processTransfers();
  rollEventsV2();            // ★ v130: 新事件系统
  processPlagueSpreads();    // ★ v130: A2疫病扩散
  checkEventPromises();      // ★ v130: 承诺追踪
  checkRebellions();
  // ★ v100: 重置AI战斗去重集合（在runAI之前清空，确保本旬AI决策用干净状态）
  _aiBattleProcessedThisTurn.clear();
  await runAI();
  runRebelAI(); // 叛军AI（C1）
  // 非城节点的 halt 部队：仅对"真正无目标的游离部队"自动回城
  // ★ v79 修复：不再强制回城被友军/敌军阻挡而halt的部队（保留其战术位置）
  // ★ v100: 排除有AI任务的部队（attack/defend被GT2鹰鸽halt的不回城）
  // 触发条件：halt + 不在城市 + 无残留hexPath + 无AI任务
  G.units.filter(u=>u.status==='halt').forEach(u=>{
    const loc=getUnitNodeId(u);
    if(loc && G.cities[loc]) return; // 已在城市，无需处理
    if(u.hexPath && u.hexPath.length > 0) return; // 有残留路径（被临时堵住），保留位置
    if(u.fac === G.playerFac) return; // ★ 玩家部队永不auto-return，交给玩家自行决定
    if(u._aiRole === 'attack' || u._aiRole === 'defend') return; // ★ v100: 有任务的AI部队不自动回城
    // AI部队：真正无目标的游离部队回城
    let bestCity=null, bestCost=Infinity, bestHexPath=null;
    Object.values(G.cities).filter(c=>c.fac===u.fac).forEach(c=>{
      const cdef=CITY_MAP[c.id];
      if(!cdef) return;
      const hr=hexAstar(u.hq,u.hr,cdef.q,cdef.r,'light',u.fac);
      if(hr && hr.cost<bestCost){bestCost=hr.cost;bestCity=c;bestHexPath=hr.path;}
    });
    if(bestCity && bestHexPath){ u.hexPath=bestHexPath.slice(1); u.movePath=[bestCity.id]; u.status='march'; }
  });
  processUnitMovement();
  // ★ v100: 旬末garrison校正——所有落在己方/友方城市hex上的部队自动进城
  // 不清hexPath，下旬processUnitMovement继续走剩余路径
  G.units.forEach(u => {
    if(u.status === 'siege' || u.status === 'ambush' || u.status === 'camp') return;
    if(u.status === 'garrison') return; // 已经是了
    const ck = HEX_CITY[hkey(u.hq, u.hr)];
    if(!ck) return;
    const city = G.cities[ck];
    if(city && city.fac === u.fac) {
      u.status = 'garrison';
      u._arrivedThisTurn = true; // ★ v133: 标记本旬新入城（供围城解围判定）
    }
  });
  // ★ C4: 更新所有势力迷雾（移动后、战斗前）
  getScenarioFactions().forEach(fid => updateFog(fid));
  // 不在旬初强清战报队列——玩家未看完的战报应保留到关闭后自然消化
  checkAmbushTriggers();      // ★ v100: 只检测伏击（普通野战已由AI/玩家显式发起）
  // ★ v100: 叛军战斗检测（叛军不经过aiExecuteOrders，需独立处理）
  // 叛军march被敌军阻挡后halt在旁边 → 自动发起攻击（叛军永远是鹰派）
  G.units.filter(u => u.fac === 'rebel' && u.status === 'halt' && getUnitTroops(u) > 0).forEach(rebel => {
    // ★ v149fix B09: 跳过已被处理过的叛军（避免重复战斗）
    if(_aiBattleProcessedThisTurn.has(rebel.id)) return;
    const contactEnemy = G.units.find(eu =>
      eu.fac !== 'rebel' && isHostile('rebel', eu.fac) &&
      getUnitTroops(eu) > 0 &&
      !_aiBattleProcessedThisTurn.has(eu.id) &&
      eu.status !== 'ambush' && unitsContact(rebel, eu)
    );
    if(contactEnemy){
      _aiBattleProcessedThisTurn.add(rebel.id);
      _aiBattleProcessedThisTurn.add(contactEnemy.id);
      aiInitiateBattle(rebel);
    }
  });
  processSiegeDecay();         // 推进围城衰减
  processReinforcement();     // 野战部队补员
  processMobilizing();        // 整备倒计时
  processMuster();            // ★ v114: 征兵/扩编集结进度
  processTechResearch();      // ★ v115: 科技研究进度
  processSupplyStatus();       // ★ v88: 补给线检测+断粮惩罚
  processUnitFood();
  processUnitSalary();
  checkDiplo();
  processLoyalty();         // ★ 忠诚度每旬更新
  processFactionLoyalty();  // ★ B1 派系政治修正
  // ★ v130: C2④ 士族逼宫拖延——派系忠诚持续衰减
  if(G._factionLoyaltyDecay){
    Object.keys(G._factionLoyaltyDecay).forEach(key=>{
      const d = G._factionLoyaltyDecay[key];
      if(!d || d.remaining <= 0){ delete G._factionLoyaltyDecay[key]; return; }
      const realFacId = key.substring(0, key.lastIndexOf('_'));
      const realFid = key.substring(key.lastIndexOf('_')+1);
      const inf = calcFactionInfluence(realFid);
      const facGens = inf.factions[realFacId]?.gens || [];
      facGens.forEach(name=>{
        // 检查武将是否还在势力
        if(!(G.generals[realFid]||[]).some(g=>g.name===name)) return;
        if(G.genLoyalty[name]!==undefined){
          G.genLoyalty[name] = Math.max(0, G.genLoyalty[name] + d.perTurn);
          if(G.loyaltyAccum) G.loyaltyAccum[name] = G.genLoyalty[name];
        }
      });
      d.remaining--;
      if(d.remaining <= 0) delete G._factionLoyaltyDecay[key];
    });
  }
  // ★ D1: 官职功绩每旬积累（太守/军师/官职 +0.3/旬）
  // ★ D3: 太守/官职每旬政治经验
  getScenarioFactions().forEach(fid=>{
    Object.values(G.cities).filter(c=>c.fac===fid && c.prefect).forEach(c=>{
      addMerit(c.prefect, 0.3);
      addStatExp(c.prefect, 'pol', 0.3);   // 太守每旬+0.3 pol exp
    });
    if(G.factions[fid]?.strategist){
      addMerit(G.factions[fid].strategist, 0.3);
      addStatExp(G.factions[fid].strategist, 'pol', 0.3); // 军师每旬+0.3 pol exp
    }
    getFacPosts(fid).forEach(({genName})=>{
      addMerit(genName, 0.2);
      addStatExp(genName, 'pol', 0.3);     // 官职每旬+0.3 pol exp
    });
    checkPostDowngrade(fid); // 失城降档裁官
  });
  checkLoyaltyThresholds(); // ★ 检测下野/可挖角
  tickStrategyCDs();        // ★ 计谋CD递减（D1）
  if(G.scoutReveals) G.scoutReveals = G.scoutReveals.filter(sr=>sr.expiresAt>G.turn); // ★ v116: 清理过期侦察
  // ★ v132 E1: 清理过期探子视野加成
  G.units.forEach(u=>{ if(u._scoutBonus && u._scoutBonus.expiresAt <= G.turn) delete u._scoutBonus; });
  // ★ v132 E4: 断粮监视——敌军溃散则获200exp，过期则清除
  G.units.forEach(u=>{
    if(!u._starvWatch) return;
    const sw = u._starvWatch;
    const target = G.units.find(t=>t.id===sw.targetId);
    if(!target || getUnitTroops(target)<=0){
      // 敌军已溃散/消失
      if(G.turn <= sw.expireTurn){
        addUnitExp(u, 200);
        const gn = u.squads?.[0]?.genName||'';
        log(`🎖 ${gn}部扼守卡位奏效，敌军溃散，获200经验`,'battle');
      }
      delete u._starvWatch;
    } else if(G.turn > sw.expireTurn){
      delete u._starvWatch; // 超期未溃散，清除
    }
  });
  // ★ v132 F2: 威胁注入逐旬递减10
  if(G._threatBonus){
    let anyLeft = false;
    Object.keys(G._threatBonus).forEach(fid=>{
      Object.keys(G._threatBonus[fid]).forEach(ef=>{
        G._threatBonus[fid][ef] -= 10;
        if(G._threatBonus[fid][ef] <= 0) delete G._threatBonus[fid][ef];
        else anyLeft = true;
      });
      if(!Object.keys(G._threatBonus[fid]).length) delete G._threatBonus[fid];
    });
    if(anyLeft) _aiInvalidateThreatCache();
  }
  // ★ v132 F3/G3: 清理超过24旬的城市易手记录（节省内存）
  if(G._cityChangeLog) G._cityChangeLog = G._cityChangeLog.filter(e=>e.turn > G.turn-24);
  processClaimPrep();       // ★ C3: 宣称准备推进
  processFeudDecay();       // ★ C3: 血仇消退
  processReputation();      // ★ C3: 信誉自然恢复
  processStageEvolution();  // ★ v172: 势力演进阶段（军阀→一方之主→政权）自动判定（须先于processGentry，以便当旬clamp用新stage）
  processGentry();          // ★ I2: 豪族支持度每旬变化（内含按stage的bounds clamp + stage差异化恢复速率）
  getScenarioFactions().forEach(fid => processFacEthos(fid)); // ★ v151: 价值观每旬漂移
  // ★ C3: AI称帝评估（每12旬）
  getScenarioFactions().forEach(fid => {
    if(fid !== G.playerFac && G.turn >= 24 && G.turn % 12 === 0) aiConsiderEnthrone(fid);
  });
  // 清除残部：兵力<50的部队自动解散（含逃兵流散至极少的情况）
  // v111: 阈值从0→50，避免十几人的幽灵部队卡在地图上
  G.units = G.units.filter(u => getUnitTroops(u) >= 50);
  if(G.selUnitId && !G.units.find(u=>u.id===G.selUnitId)) G.selUnitId=null; // ★ v114fix: 防空指针
  updateFacStats();
  checkElimination();          // ★ v119: 势力淘汰 + 胜利判定
  checkResupply();           // ★ 检查调粮（可撑旬数<9触发卡片）
  pushStatsSnapshot();       // 统计快照
  checkIntimacyThresholds(); // 亲密度阈值弹窗
  // ★ I3: 朝议系统（每季度首旬，即turn%9===1）
  if(G.turn > 1 && G.turn % 9 === 1) triggerCourtCouncil();
  // ★ 每5旬刷新在野武将池（R1）
  if((G.turn - G.wildPoolTurn) >= WILD_POOL_INTERVAL) refreshWildPool();

  // ★ v143: 延迟出场武将检查
  if(G.genPendingPool && G.genPendingPool.length){
    const arrived = [];
    G.genPendingPool = G.genPendingPool.filter(pg => {
      if(G.turn >= pg.minTurn){
        arrived.push(pg);
        return false;
      }
      return true;
    });
    arrived.forEach(pg => {
      const fid = pg._pendingFac;
      delete pg._pendingFac;
      delete pg.minTurn;
      if(!G.generals[fid]) return;
      // 防止重复（被俘/投降等边界情况）
      if(G.generals[fid].some(g => g.name === pg.name)) return;
      { const _cloned = _deepCloneGen(pg); G.generals[fid].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
      // 初始化全套武将数据
      const meta = getGenMeta(pg.name);
      G.genLoyalty[pg.name] = meta.loyalty ?? 75;
      if(G.loyaltyAccum) G.loyaltyAccum[pg.name] = G.genLoyalty[pg.name];
      G.genJoinTurn[pg.name] = G.turn;
      G.genJoinSource[pg.name] = 'member';
      G.genOrigRole[pg.name] = pg.role || 'general';
      G.genOrigFac[pg.name] = fid;
      // §8.4 W6-pending: MERIT_INIT const 收口 → _scenarioMaterialized.initialMerit
      //   (W5a 扩 wild+pending wildData.merit, 214 pendingFac gens wildData.merit=10 跟旧 fallback 等价)
      G.genMerit[pg.name] = _scenarioMaterialized.initialMerit[pg.name] || 10;
      if(!G.genChronicle[pg.name]) G.genChronicle[pg.name] = [];
      if(!G.genStatExp[pg.name]) G.genStatExp[pg.name] = {com:0,war:0,int:0,pol:0};
      if(!G.genStatBase[pg.name]) G.genStatBase[pg.name] = {com:pg.com,war:pg.war,int:pg.int,pol:pg.pol};
      if(!G.genAptExp[pg.name]) G.genAptExp[pg.name] = {};
      if(!G.genFactionMod[pg.name]) G.genFactionMod[pg.name] = 0;
      // 小传 — F-W4c-2 v2 (制作人 decision「称王是分水岭」): 已称王 → .name 国号 / 未称王 → .ruler
      const _fdT = getFactionDef(fid);
      const facN = _fdT ? (_fdT.declared ? (_fdT.name || fid) : (_fdT.ruler || fid)) : fid;
      addGenChronicle(pg.name, `${facN}迎来新锐——${pg.name}前来效力。`);
      // 通知
      if(fid === G.playerFac){
        log(`🎉 ${pg.name}成年出仕，前来效力！`,'event');
        showNotif(`${pg.name}前来效力！`,'good');
      }
    });
  }


  // 快进模式：静默消化所有待确认战斗，清空战报
  if(_fastForward){
    // ★ v149fix B07: 快进时自动处理阻塞事件（选默认选项0），避免卡死
    if(G._pendingEvent){
      const _ffEvt = G._pendingEvent;
      const _ffChoices = _ffEvt.def.choices(_ffEvt.ctx);
      // 选第一个非disabled选项
      const _ffIdx = _ffChoices.findIndex(ch => !ch.disabled);
      if(_ffIdx >= 0) _ffChoices[_ffIdx].effect();
      if(!G._eventCooldown) G._eventCooldown={};
      if(!G._eventCatCooldown) G._eventCatCooldown={};
      G._eventCooldown[_ffEvt.def.id] = _ffEvt.def.cooldown;
      G._eventCatCooldown[_ffEvt.def.category] = EVENT_CAT_COOLDOWN;
      if(_ffEvt.def.oneTime){ if(!G._eventFired) G._eventFired={}; G._eventFired[_ffEvt.def.id]=G.turn; }
      // D-132 fix: 全局快进路径补 log, 跟 rollEventsV2 内 fastForward (event.js:427) / AI 静默 (line 405) / 玩家弹窗 (resolveEventChoice line 465) 三路径一致
      log(`${_ffEvt.def.icon} ${_ffEvt.ctx.city?.name||_ffEvt.ctx.genName||_ffEvt.ctx.facLabel||_ffEvt.ctx.complainerName||''}${_ffEvt.def.name}`,'event');
      G._pendingEvent = null;
      document.getElementById('eventModal').style.display = 'none';
    }
    while(_pendingBattleConfirms.length){
      const conf = _pendingBattleConfirms.shift();
      _currentBattleConfirm = conf;
      autoResolvePendingBattle(conf);
      _currentBattleConfirm = null;
    }
    _battleReports.forEach(r => {
      applyBattleExp(r);  // D2：快进时也发放经验
      // ★ v151: 快进时自动安民
      if(r._siegeAftermathCityId && r.atkFac === G.playerFac) _applySiegeAftermath(r._siegeAftermathCityId, G.playerFac, 'pacify');
    });
    _battleReports = [];
    G._pendingSiegeAftermath = null; // ★ v151: 清理
    // ★ I3: 快进时朝议自动选择
    if(window._pendingCourtCouncil){
      const p = window._pendingCourtCouncil;
      window._pendingCourtCouncil = null;
      const chosen = _aiCourtSelect(G.playerFac, p);
      _applyCourtDecisions(G.playerFac, p, chosen);
    }
    if(G._pendingEnvoyIntel) G._pendingEnvoyIntel = []; // ★ v164: 快进时清空通使情报
    ov.classList.remove('show');
    return;  // 不 renderAll，不弹弹窗，由 fastForwardTurns 最后统一 render
  }

  await sleep(250);
  ov.classList.remove('show');
  btn.disabled=false;
  renderAll();
  // ★ v175: 播放本旬所有被动战斗（AI 攻玩家等）的动画队列
  // renderAll 完成后 mapRoot 已重建，可以挂载动画；showNextBattleReport 入口会等锁
  if(_pendingBattleAnimations.length){
    _drainPendingBattleAnimations().catch(e => console.error('[drainAnim] fatal:', e));
  }
  // ★ v86: 围城到达弹窗（优先于战报，让玩家先选择攻/围）
  if(_pendingSiegeArrival){
    _checkSiegeArrival();
    return; // 玩家选择后由_siegeArrivalChoice触发后续战报
  }
  // 弹出战报（renderAll之后）——如果有待确认的玩家战斗，先弹确认框
  if(_pendingBattleConfirms.length) setTimeout(()=>{ try{_showNextBattleConfirm();}catch(e){console.error('弹窗链异常:battleConfirm',e);} }, 300);
  else if(_battleReports.length) setTimeout(()=>{ try{showNextBattleReport();}catch(e){console.error('弹窗链异常:battleReport',e);} }, 300);
  // AI向玩家求和弹窗（战报之后处理）
  let _hasPopupQueued = false; // ★ I3: 追踪是否有前序弹窗排队
  if(_pendingPeaceOffer && !_pendingBattleConfirms.length && !_battleReports.length){
    const _po = _pendingPeaceOffer; _pendingPeaceOffer = null;
    setTimeout(()=>{ try{showDiploSueForPeace(_po);}catch(e){console.error('弹窗链异常:peace',e);} }, 500);
    _hasPopupQueued = true;
  }
  // AI附庸弹窗
  if(_pendingVassalOffer && !_pendingBattleConfirms.length && !_battleReports.length && !_hasPopupQueued){
    const _vo = _pendingVassalOffer; _pendingVassalOffer = null;
    setTimeout(()=>{ try{showDiploVassal(_vo);}catch(e){console.error('弹窗链异常:vassal',e);} }, 600);
    _hasPopupQueued = true;
  }
  // ★ I3: 朝议弹窗（仅在无其他弹窗时直接弹出；有前序弹窗则由链式回调触发）
  if(window._pendingCourtCouncil && !_pendingBattleConfirms.length && !_battleReports.length && !_hasPopupQueued){
    const proposals = window._pendingCourtCouncil;
    window._pendingCourtCouncil = null;
    setTimeout(()=>{ try{showCourtCouncil(proposals);}catch(e){console.error('弹窗链异常:court',e);} }, 700);
    _hasPopupQueued = true;
  }
  // ★ v164: 通使情报弹窗（使者上旬派出，本旬归来报告）
  if(G._pendingEnvoyIntel && G._pendingEnvoyIntel.length && !_hasPopupQueued){
    const pending = G._pendingEnvoyIntel.filter(p=>p.turn < G.turn); // 上旬派出的
    G._pendingEnvoyIntel = G._pendingEnvoyIntel.filter(p=>p.turn >= G.turn);
    if(pending.length){
      const p = pending[0]; // 一次弹一个
      if(pending.length > 1) G._pendingEnvoyIntel.push(...pending.slice(1).map(x=>({...x,turn:x.turn}))); // 剩余下旬继续弹
      const intel = _buildEnvoyIntel(G.playerFac, p.targetFid);
      setTimeout(()=>{ try{_showEnvoyIntelModal(p.targetFid, intel);}catch(e){console.error('弹窗链异常:envoy',e);} }, 800);
      log(`📜 通使${getFactionDef(p.targetFid)?.full}的使者归来，带回情报。`,'diplo');
    }
  }
}

// ─── 快进推进 ──────────────────────────────────────────────
/**
 * fastForwardTurns(n)
 * 连续推进 n 旬，期间跳过所有 sleep 和弹窗，完成后统一 renderAll
 */
async function fastForwardTurns(n){
  const btn = document.getElementById('btnTurn');
  const ffBtn = document.getElementById('btnFastForward');
  if(btn) btn.disabled = true;
  if(ffBtn){ ffBtn.disabled=true; ffBtn.textContent='⏩ 推进中…'; }

  _fastForward = true;
  for(let i=0;i<n;i++){
    const _tStart = performance.now();
    await nextTurn();
    // 安全阀：单旬超10秒视为卡死，强制中断
    if(performance.now() - _tStart > 10000) {
      console.error(`❌ Turn ${G.turn} exceeded 10s, aborting fast-forward`);
      break;
    }
    // 每5旬让出事件循环，防止浏览器判定脚本卡死
    if(i % 5 === 4) await new Promise(r => setTimeout(r, 0));
    // ★ v119: 胜利/玩家淘汰时中断快进
    const alive = getScenarioFactions().filter(f => !G.factions[f]?._eliminated);
    if(alive.length <= 1) { log(`⏩ 快进中断：天下已定`, 'event'); break; }
  }
  _fastForward = false;

  if(btn) btn.disabled = false;
  if(ffBtn){ ffBtn.disabled=false; ffBtn.textContent='⏩ 快进'; }
  renderAll();
  log(`⏩ 快进 ${n} 旬完成（第${G.turn}旬）`, 'economy');
  // ★ v119: 快进结束后若已有胜负，弹出结算画面
  const _aliveFF = getScenarioFactions().filter(f => !G.factions[f]?._eliminated);
  if(_aliveFF.length <= 1 && !G._victoryShown){
    G._victoryShown = true;
    const winner = _aliveFF[0];
    if(winner === G.playerFac) setTimeout(() => showGameEndOverlay(true), 500);
    else setTimeout(() => showGameEndOverlay(false, winner), 500);
  } else if(G.factions[G.playerFac]?._eliminated && !G._defeatShown){
    G._defeatShown = true;
    setTimeout(() => showGameEndOverlay(false), 500);
  }
}

// ═══════════════════════════════════════════════════════
// 📊 统计系统（v40）
// ═══════════════════════════════════════════════════════
const _statsHistory = []; // [{turn,year,season, wei:{pop,troops,gold,cities}, shu:{...}, wu:{...}}]
const _STATS_MAX = 40;    // 最多保留40旬历史

function pushStatsSnapshot(){
  const snap = { turn:G.turn, year:G.year, seasonIdx:G.seasonIdx };
  getScenarioFactions().forEach(fid=>{
    const fc = Object.values(G.cities).filter(c=>c.fac===fid);
    const ut = G.units.filter(u=>u.fac===fid);
    snap[fid]={
      pop:   fc.reduce((s,c)=>s+c.pop,0),
      troops:fc.reduce((s,c)=>s+c.garrison,0) + ut.reduce((s,u)=>s+getUnitTroops(u),0),
      gold:  Math.round(G.factions[fid]?.res.gold||0),
      cities:fc.length,
    };
  });
  _statsHistory.push(snap);
  if(_statsHistory.length>_STATS_MAX) _statsHistory.shift();
}
