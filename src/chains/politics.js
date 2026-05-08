// src/chains/politics.js
//
// 政治链(P)— 科技 / 阶段演进 / 官职 + 功绩 / 派系影响力 / 朝议 / 称帝。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.7 / 阶段 3,chain 模板第三应用)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// ── 抽离范围(6 段)──
//   P1 科技子组                                v181 L1381-L1554  _techEffectCache lets +
//                                                                _ensureTechCache / getTechEffect / hasTechEffect
//                                                                / canAffordTech / processTechResearch
//                                                                / startTechResearch / aiDoTechResearch
//   P2 阶段演进子组                             v181 L4164-L4352  getStage / getAnchorState / countCitiesInState
//                                                                / getQualifiedStates / countFacCities
//                                                                / _updateStateAnchorClock / _selectBestAnchor
//                                                                / checkStagePromotion / promoteStage
//                                                                / processStageEvolution
//                                                                / getStageBadgeText / getStageColor
//                                                                / getStageNarrative
//   P3 官职 + 功绩子组                          v181 L4488-L4711  getFacPostTier / TRIBUTE_RATES const
//                                                                / getTributeRates / getPostSlots
//                                                                / getFacPosts / countPostsByTier
//                                                                / getGenPostDef / getFactionRuler
//                                                                / setFactionRuler / genHasOffice
//                                                                / appointGenPost / dismissGenPost
//                                                                / clearAllPostsByGen / checkPostDowngrade
//                                                                / calcPostBuffs / calcPostSalary
//                                                                / hasAnyPost / addMerit / seniority
//   P4 派系影响力                                v181 L4923-L4952  _facInfluenceCache lets +
//                                                                calcFactionInfluence
//   P5 朝议子组                                  v181 L5242-L5410  _generateCourtProposals
//                                                                / getCourtDecreeBuffs / _applyCourtDecisions
//                                                                / _expireCourtDecrees / _aiCourtSelect
//   P6 称帝子组                                  v181 L11798-L11866 canEnthrone / doEnthrone
//                                                                / aiConsiderEnthrone
//                                                + v181 L13936-L13940 _execEnthrone (sprint batch-25
//                                                  D-121 carry-over, 加 mandate gate 对齐 aiConsiderEnthrone)
//   P7 AI _exec 入口 (官职)                       v181 L13470-L13503 _execAppointPost / _execDismissPost
//                                                  (sprint batch-27, 随 appointGenPost / dismissGenPost
//                                                   按 (a) 原则归政治)
//
// ── 留 v181 ──
//   `getGenBirthplace`(L4560,武将链 GEN_TAGS 查表,留 3.12)
//   `setStrategist / getStrategistInt`(L10953-,武将链 军师,留 3.12)
//   modal/UI 队列入口(phase 2 原则保留 v181):
//     `showCourtCouncil`(L5413) / `_checkPendingCourtAfterPopup`(L5510) /
//     `triggerCourtCouncil`(L5519,写 `window._pendingCourtCouncil` UI 队列)
//   render Tab 函数(phase 2 原则保留 v181):
//     `renderTechTab`(L13144) / `openTechResearchPicker`(L13263) /
//     `confirmTechResearch`(L13308) / `renderPostTab`(L13494)
//   `_execResearch` (在 src/core/claude_ai.js 派发, 函数体留 v181, phase 3.3 选项 A 决策不搬)
//   注: _execEnthrone 由 sprint batch-25 D-121 抽到本 chain (P6, 加 mandate gate)
//   注: _execAppointPost / _execDismissPost 由 sprint batch-27 抽到本 chain (P7,
//       按 (a) 原则随 appointGenPost / dismissGenPost helper 归政治)
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G.factions[fid]._tech.researched / .current`(科技研究状态)
//   - `G.factions[fid]._stateAnchorClock`(阶段演进 anchor 时钟)
//   - `FAC_IDENTITY[fid].stage / .anchorState / .type`(势力身份)
//   - `G.emperor`(称帝时清空旧天子)
//   - `G.factionRulers[fid]`(势力君主)
//   - `G.genPost[genName]`(官职归属)
//   - `G.genMerit[genName]`(功绩)
//   - `G.courtDecrees`(朝议法令)
//
// **跨链副作用写口**(按 (a) 原则,主写口落政治,副作用写口落他链 — 整函数归政治):
//   - `appointGenPost / dismissGenPost`:副作用写 `G.genLoyalty / G.loyaltyAccum`(武将)
//     —— 任命/罢免 → 忠诚 ±X 是核心机制,不拆。3.12 武将链抽离时记住边界
//   - `_applyCourtDecisions`:副作用写 `G.genFactionMod / G.genFactionModLog`(武将)
//     + `county.loyalty`(豪族,通过 `_aggregateGentry` 已抽 chains/gentry.js)
//   - `doEnthrone`:副作用写 `G.reputation[fid]`(外交)
//     —— 称帝主写政治(FAC_IDENTITY.type / G.emperor),信誉 +10 是副作用。3.8 外交链抽离时记住边界
//   - `processTechResearch / startTechResearch`:扣 `G.factions[fid].res`(经济)
//     —— 研究消耗资源,主写口在 _tech 状态
//
// 该跨链写在对应 chain 抽离时再次确认归属(同 3.5/3.6 模式)。
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/ + src/render/ + chains/ethos.js + chains/gentry.js
// 模块共享 hoisted function 全局可见,无 import/export)。
//
// `TRIBUTE_RATES` 是 top-level **const**(已 phase 3.4 验证 const 跨 classic <script> 共享)。
// `_techEffectCache / _techEffectCacheTurn / _facInfluenceCache / _facInfluenceCacheTurn`
// 是 top-level **let**(模块级 cache state,phase 3.4 已验证 let 跨 classic <script> 共享)。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(callers):
//   - 经济链(留 v181 等 3.9):
//       getCityProd / getCityFoodCost / processCityFood / processFacEconomy / processCityPop /
//       processGarrisonRecovery / processBuildQueues / aiDoBuild / aiDoTransfer / aiDoAppointments
//       等多处调 getTechEffect / getStage / calcPostBuffs / getCourtDecreeBuffs / getTributeRates
//   - 军事链(留 v181 等 3.11):
//       getSquadMax / getUnitMax / getAvailableTechs(留 v181)调 getTechEffect
//       L1412-L1429 使用 getTechEffect 计算编制上限,这 3 个 wrapper 留 v181(科技用法,非政治写口)
//       多处征兵 / 战斗 / 单位计算调 getTechEffect / hasTechEffect / calcPostBuffs / getStage
//   - 武将链(留 v181 等 3.12):
//       processFactionLoyalty / processLoyalty 调 calcFactionInfluence / calcPostBuffs
//       _genInfluence / getGenFactions 等被 calcFactionInfluence 调(callee 方向)
//       killGen / surrenderGen / poach 等调 clearAllPostsByGen / addMerit
//       getRetainerType / hasFacGen / hasGenInUnits 等被本 chain 调(callee 方向)
//   - 豪族链(已抽 chains/gentry.js):
//       processGentry 调 getStage(政治阶段影响豪族)
//       initCityGentry 调 isMagnateCounty(豪族 helper,反向)
//   - 价值观链(已抽 chains/ethos.js):
//       processFacEthos 调 hasFacGen / genHasOffice(政治 helper,反向)
//   - 外交链(留 v181 等 3.8):
//       doEnthrone 调 addDiplo / applyEthosShock / triggerFactionEvent / _applyClaimFactionEffects
//       checkEnthrone / claimWar / vassal 路径调 getFactionRuler / canEnthrone / doEnthrone
//       trackCityLoss → checkPostDowngrade(失城裁官)
//   - 事件链(留 v181 等 3.10):
//       事件 effects 多处调 startTechResearch / addMerit / appointGenPost / setFactionRuler / getStage
//   - render(留 v181):
//       src/render/tooltips.js / ui_panels.js: getStage / getStageBadgeText / getStageColor
//                                              / getStageNarrative / getFactionRuler / getGenPostDef
//                                              / hasAnyPost / seniority / getFacPosts / countPostsByTier
//                                              / calcFactionInfluence / calcPostBuffs / getCourtDecreeBuffs
//                                              / getTechEffect / hasTechEffect
//       v181 inline render Tab(renderTechTab / renderPostTab 留 v181)调 getTechEffect / canAffordTech
//                                              / startTechResearch / getFacPosts / appointGenPost / dismissGenPost
//                                              / getPostSlots / countPostsByTier 等
//   - core(已抽):
//       src/core/tick.js: processTechResearch / processStageEvolution / _expireCourtDecrees(每旬调用)
//       src/core/main.js: initGame 路径调 getFactionRuler 等
//       src/core/claude_ai.js: _execAppointPost / _execDismissPost / _execResearch / _execEnthrone
//                              调 appointGenPost / dismissGenPost / startTechResearch / canEnthrone / doEnthrone
//   - inline backToTitle / startGame:
//       L27385 + L27654:`_techEffectCache = {}; _techEffectCacheTurn = -1;`
//       (本 chain 暴露 cache lets 跨 script 共享,reset 行直接跨写)
//
// 本 chain 调外部链(callees):
//   - `addStatExp`(武将链 exp,留 v181 等 3.12)— processTechResearch 调
//   - `safeSub`(已抽 src/core/helpers.js)— startTechResearch 调
//   - `clearPrefectByGen`(武将链 prefect helper,留 v181 等 3.12)— appointGenPost 调
//   - `getGenFaction / getGenFactions / _genInfluence`(武将链 派系 helpers,留 v181 等 3.12)
//     — appointGenPost / dismissGenPost / _applyCourtDecisions / calcFactionInfluence 调
//   - `triggerFactionEvent`(武将链 派系事件 hub,留 v181 等 3.12)
//     — appointGenPost / dismissGenPost / doEnthrone 调
//   - `applyEthosShock`(已抽 chains/ethos.js)
//     — appointGenPost / dismissGenPost / _applyCourtDecisions / doEnthrone 调
//   - `_aggregateGentry`(已抽 chains/gentry.js)— _applyCourtDecisions 调
//   - `addDiplo / _applyClaimFactionEffects`(外交链,留 v181 等 3.8)— doEnthrone 调
//   - `isVassal`(外交链,留 v181 等 3.8)— canEnthrone 调
//   - `hasFacGen / genHasOffice`(本 chain self-call + 武将链 helper)
//   - `_shuffleFY`(外交链 / 通用 helper,留 v181 等 3.8)— _generateCourtProposals 调
//   - `log / showNotif`(已抽 src/render/notifications.js)
//   - `TECH_TREE / ALL_POSTS / POST_TIERS / FAC_IDENTITY / FAC / ALL_FACS / GEN_TAGS
//      / STAGE_NAMES / STAGE_PROMO / STAGE_LABEL_CAP / STAGE_LABEL_FLOOR
//      / STAGE_TIER1_SLOTS / STATE_CITIES / STATE_NAMES / STATE_TIER
//      / FACTION_DEFS / GENTRY_FAC_TO_STATES / COUNTY_CLAN_SENS / COURT_PROPOSALS_MIL
//      / COURT_PROPOSALS_CIV / ENTHRONE_FACTION_EFFECTS / REPUTATION_DEFAULT`
//     (数据 / 常量,部分已抽 src/data/,部分留 v181)
//   - `G(状态根)`(已抽 src/core/state.js)
//
// 同 phase 2/3.2/3.3/3.4/3.5/3.6 反向调用模式,设计原则 (c) 已 approve。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_*_notes §二)──
// PLAN §三阶段 3.7(原)字面:`chains/politics.js(政治链 v4 / ~50 函数)`
//   字面映射:~50 函数(master scout)
// scout 实测 + 实装:**47 函数 + 1 const(TRIBUTE_RATES) + 4 顶层 lets verbatim ~1100-1200 行**
//   (master scout ~50 / 实测 47:`getGenBirthplace` 归武将 / `setStrategist + getStrategistInt`
//    归武将 / `_exec*` 4 个留 claude_ai.js / modal+render 7 个留 v181)
// PLAN-vs-reality 偏差中等,主因:
//   - master scout "1 _exec" 误数,实测 4 个 _exec(_execAppointPost / _execDismissPost
//     / _execResearch / _execEnthrone),按 phase 3.3 选项 A 决策不搬
//   - master scout "4 backToTitle reset",实测 2(只有 _techEffectCache 一对 lets,
//     在 L27385 + L27654 共 2 处 reset。_facInfluenceCache 不在 backToTitle reset,
//     只在 promoteStage 自家清)
//
// ── script 加载顺序(phase 3.5 拍板规范)──
// `data/* → core/* → chains/* → render/* → inline`
// 本文件加在 chains/gentry.js 之后,render/notifications.js 之前。chains/ 内顺序无关。
//
// ── chain 抽离模板第三次应用 ──
// phase 3.5 ethos 模板首发 + phase 3.6 gentry 第二应用,本 session 是模板第三应用。
//   - 6 项 header 必含 ✓(含写口归属声明)
//   - 加载顺序规范 ✓
//   - 跨 script 顶层 let 同步(_techEffectCache 在 L27385 + L27654 reset)✓
//   - phase 2 原则(modal/UI 队列入口 + render Tab 留 v181)✓
//   - 跨链反向调用 (c) 容许,callers/callees 按归属链整理 ✓


// ════════════════════════════════════════════════════════════════════
// ── P1.a 科技 cache lets + helpers (v181 L1380-L1409) ──
// ════════════════════════════════════════════════════════════════════

/** 获取势力已研究科技的累计效果（带每旬缓存） */
let _techEffectCache = {}; // { fid: { key: value } }
let _techEffectCacheTurn = -1;
function _ensureTechCache(fid) {
  if (_techEffectCacheTurn !== G.turn) { _techEffectCache = {}; _techEffectCacheTurn = G.turn; }
  if (_techEffectCache[fid]) return;
  const tech = G.factions[fid]?._tech;
  const cache = {};
  if (tech) {
    tech.researched.forEach(tid => {
      const def = TECH_TREE[tid];
      if (!def?.effect) return;
      for (const [k, v] of Object.entries(def.effect)) {
        cache[k] = (cache[k] || 0) + (typeof v === 'number' ? v : 0);
        if (typeof v === 'boolean' && v) cache['_bool_' + k] = true;
      }
    });
  }
  _techEffectCache[fid] = cache;
}
function getTechEffect(fid, key) {
  _ensureTechCache(fid);
  return _techEffectCache[fid]?.[key] || 0;
}

/** 获取势力已研究科技中的布尔效果 */
function hasTechEffect(fid, key) {
  _ensureTechCache(fid);
  return !!_techEffectCache[fid]?.['_bool_' + key];
}

// ════════════════════════════════════════════════════════════════════
// ── P1.b 科技 affordability + research workflow (v181 L1432-L1554) ──
// ════════════════════════════════════════════════════════════════════

/** 检查势力是否有足够资源研究某科技 */
function canAffordTech(fid, techId) {
  const def = TECH_TREE[techId];
  if (!def) return false;
  const res = G.factions[fid]?.res;
  if (!res) return false;
  for (const [r, v] of Object.entries(def.cost)) {
    if ((res[r] || 0) < v) return false;
  }
  return true;
}

/** 每旬处理科技研究进度（在nextTurn中调用） */
function processTechResearch() {
  ALL_FACS.forEach(fid => {
    const tech = G.factions[fid]?._tech;
    if (!tech || !tech.current) return;
    const cur = tech.current;

    // 检查研究武将是否仍然有效（在势力中+未出征+未担任太守）
    const gen = (G.generals[fid] || []).find(g => g.name === cur.genName);
    if (!gen) {
      // 武将丢失（下野/被挖角）→ 研究作废
      log(`⚠ [${fid}] ${cur.genName}离开，${TECH_TREE[cur.techId]?.name||''}研究中止`, 'event');
      tech.current = null;
      return;
    }
    // 检查武将是否被拉去出征了（防御性检查）
    const deployed = new Set();
    G.units.filter(u => u.fac === fid).forEach(u => u.squads.forEach(sq => deployed.add(sq.genName)));
    if (deployed.has(cur.genName)) {
      log(`⚠ [${fid}] ${cur.genName}已出征，${TECH_TREE[cur.techId]?.name||''}研究中止`, 'event');
      tech.current = null;
      return;
    }

    cur.turnsLeft--;
    if (cur.turnsLeft <= 0) {
      // 研究完成
      const def = TECH_TREE[cur.techId];
      tech.researched.add(cur.techId);
      delete _techEffectCache[fid]; // ★ v179fix P19: 立即失效cache，让下旬粮/金/招募buff生效
      // 武将经验奖励
      if (def?.stat && def?.expReward) {
        addStatExp(cur.genName, def.stat, def.expReward);
      }
      const techName = def?.name || cur.techId;
      log(`🔬 [${FAC[fid]?.name||fid}] ${techName}研究完成！（${cur.genName}主持）`, 'event');
      if (fid === G.playerFac) {
        showNotif(`${techName} 研究完成！`, 'info');
      }
      tech.current = null;
    }
  });
}

/** 开始研究科技（玩家/AI通用） */
function startTechResearch(fid, techId, genName) {
  const tech = G.factions[fid]?._tech;
  if (!tech) return false;
  if (tech.current) return false; // 已有研究中
  const def = TECH_TREE[techId];
  if (!def) return false;
  if (tech.researched.has(techId)) return false;
  if (!def.prereq.every(p => tech.researched.has(p))) return false;
  if (!canAffordTech(fid, techId)) return false;
  // 检查武将有效
  const gen = (G.generals[fid] || []).find(g => g.name === genName);
  if (!gen) return false;
  const deployed = new Set();
  G.units.filter(u => u.fac === fid).forEach(u => u.squads.forEach(sq => deployed.add(sq.genName)));
  if (deployed.has(genName)) return false;
  // 检查武将是否担任太守
  const isPrefect = Object.values(G.cities).some(c => c.fac === fid && c.prefect === genName);
  if (isPrefect) return false;

  // 扣资源 ★ v154fix H2: safeSub防负
  const res = G.factions[fid].res;
  for (const [r, v] of Object.entries(def.cost)) safeSub(res, r, v);

  tech.current = { techId, genName, turnsLeft: def.turns, turnsTotal: def.turns };
  log(`🔬 [${FAC[fid]?.name||fid}] 开始研究${def.name}（${genName}主持，${def.turns}旬）`, 'event');
  return true;
}

/** AI科技决策（每旬调用，简单逻辑） */
function aiDoTechResearch(fid) {
  const tech = G.factions[fid]?._tech;
  if (!tech || tech.current) return; // 已有研究中

  const available = getAvailableTechs(fid);
  if (!available.length) return;

  // 简单优先级：按分支均衡推进，优先廉价的
  const affordable = available.filter(tid => canAffordTech(fid, tid));
  if (!affordable.length) return;

  // 按费用从低到高排序，优先便宜的科技
  affordable.sort((a, b) => {
    const ca = Object.values(TECH_TREE[a].cost).reduce((s, v) => s + v, 0);
    const cb = Object.values(TECH_TREE[b].cost).reduce((s, v) => s + v, 0);
    return ca - cb;
  });

  // 选研究武将：闲置（非出征+非太守+非已在研究）中属性最高的
  const deployed = new Set();
  G.units.filter(u => u.fac === fid).forEach(u => u.squads.forEach(sq => deployed.add(sq.genName)));
  const prefects = new Set(Object.values(G.cities).filter(c => c.fac === fid && c.prefect).map(c => c.prefect));

  const candidates = (G.generals[fid] || []).filter(g =>
    g.role !== 'ruler' && !deployed.has(g.name) && !prefects.has(g.name)
  );
  if (!candidates.length) return;

  const techId = affordable[0];
  const def = TECH_TREE[techId];
  // 选对应属性最高的武将
  const statKey = def.stat || 'int';
  candidates.sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));
  const gen = candidates[0];

  startTechResearch(fid, techId, gen.name);
}

// ════════════════════════════════════════════════════════════════════
// ── P2 阶段演进 (v181 L4163-L4352) ──
// ════════════════════════════════════════════════════════════════════

/** 返回势力当前阶段（warlord/regional/regime） */
function getStage(fid){ return FAC_IDENTITY[fid]?.stage || 'regime'; }

/** 返回势力当前的 anchorState（一方之主阶段的根据地州id，否则 null） */
function getAnchorState(fid){ return FAC_IDENTITY[fid]?.anchorState || null; }

/** 返回势力在指定州持有的城市数 */
function countCitiesInState(fid, stateId){
  return (STATE_CITIES[stateId] || []).filter(cid => G.cities[cid]?.fac === fid).length;
}

/** 返回该势力"符合一方之主 anchor 资格"的州列表（≥3城+非小州） */
function getQualifiedStates(fid){
  const qs = [];
  Object.keys(STATE_CITIES).forEach(s => {
    if(STATE_TIER[s] === 'small') return;
    if(countCitiesInState(fid, s) >= STAGE_PROMO.toRegional.stateMinCities) qs.push(s);
  });
  return qs;
}

/** 势力城市总数 */
function countFacCities(fid){
  return Object.values(G.cities).filter(c => c.fac === fid).length;
}

/** 追踪每个势力每个州"首次满足3城"的旬数（用于18旬持续时间判定） */
function _updateStateAnchorClock(){
  ALL_FACS.forEach(fid => {
    if(!G.factions[fid]) return;
    if(!G.factions[fid]._stateAnchorClock) G.factions[fid]._stateAnchorClock = {};
    const clock = G.factions[fid]._stateAnchorClock;
    Object.keys(STATE_CITIES).forEach(s => {
      if(STATE_TIER[s] === 'small') return;
      const qualified = countCitiesInState(fid, s) >= STAGE_PROMO.toRegional.stateMinCities;
      if(qualified){
        if(clock[s] == null) clock[s] = G.turn; // 首次满足，记录起始旬
      } else {
        if(clock[s] != null) delete clock[s];    // 不满足则重置
      }
    });
  });
}

/** 选出"最佳 anchor 州"——给一方之主晋升时用
 *  规则：满足时长最久（时间最早）→ 城数最多 → 大州优先 → 人口最多 */
function _selectBestAnchor(fid){
  const clock = G.factions[fid]?._stateAnchorClock || {};
  const candidates = Object.keys(clock).filter(s =>
    (G.turn - clock[s]) >= STAGE_PROMO.toRegional.stateDurationTurns
    && STATE_TIER[s] !== 'small'
    && countCitiesInState(fid, s) >= STAGE_PROMO.toRegional.stateMinCities
  );
  if(!candidates.length) return null;
  // 打分：首次满足越早分越高；城数越多分越高；大州再加分；人口作tiebreak
  candidates.sort((a, b) => {
    const ta = clock[a], tb = clock[b];
    if(ta !== tb) return ta - tb; // 时间早的优先（数值小）
    const ca = countCitiesInState(fid, a), cb = countCitiesInState(fid, b);
    if(ca !== cb) return cb - ca;
    const tierOrd = { large:2, medium:1, small:0 };
    const diffT = (tierOrd[STATE_TIER[b]]||0) - (tierOrd[STATE_TIER[a]]||0);
    if(diffT !== 0) return diffT;
    const popA = (STATE_CITIES[a]||[]).reduce((sm, cid) => sm + (G.cities[cid]?.pop || 0), 0);
    const popB = (STATE_CITIES[b]||[]).reduce((sm, cid) => sm + (G.cities[cid]?.pop || 0), 0);
    return popB - popA;
  });
  return candidates[0];
}

/** 检查势力是否满足晋升条件，返回 {canPromote, nextStage, anchorState?} 或 null */
function checkStagePromotion(fid){
  const ident = FAC_IDENTITY[fid];
  if(!ident) return null;
  const stage = ident.stage || 'regime';
  const totalCities = countFacCities(fid);

  if(stage === 'warlord'){
    if(totalCities < STAGE_PROMO.toRegional.totalMinCities) return null;
    const bestAnchor = _selectBestAnchor(fid);
    if(!bestAnchor) return null;
    return { canPromote:true, nextStage:'regional', anchorState:bestAnchor };
  }

  if(stage === 'regional'){
    if(totalCities < STAGE_PROMO.toRegime.totalMinCities) return null;
    const states = Object.keys(STATE_CITIES).filter(s =>
      STATE_TIER[s] !== 'small'
      && countCitiesInState(fid, s) >= STAGE_PROMO.toRegime.stateMinCities
    );
    if(states.length < STAGE_PROMO.toRegime.requireStates) return null;
    return { canPromote:true, nextStage:'regime', anchorState:null };
  }

  return null; // regime 已是最终阶段
}

/** 执行晋升（自动调用） */
function promoteStage(fid){
  const promo = checkStagePromotion(fid);
  if(!promo) return false;
  const ident = FAC_IDENTITY[fid];
  const oldStage = ident.stage;
  ident.stage = promo.nextStage;
  ident.anchorState = promo.anchorState || null;
  // 清空影响力缓存（阶段变化改变了乘数）
  if(typeof _facInfluenceCache !== 'undefined'){
    _facInfluenceCache = {};
    _facInfluenceCacheTurn = -1;
  }
  // 日志与通知
  const facName = FAC[fid]?.name || fid;
  const oldLabel = STAGE_NAMES[oldStage] || oldStage;
  const newLabel = STAGE_NAMES[promo.nextStage] || promo.nextStage;
  const anchorLabel = promo.anchorState ? `，根据地：${STATE_NAMES[promo.anchorState]}` : '';
  log(`🏛 ${facName}势力演进：${oldLabel} → ${newLabel}${anchorLabel}`, 'diplo');
  if(fid === G.playerFac){
    const note = promo.nextStage === 'regional'
      ? `你已扎根${STATE_NAMES[promo.anchorState]}，成为一方之主。本地士族话语权提升，宗族与元从影响力开始下降。`
      : '你已建立政权。派系系统全面运转，创始与宗亲影响力回归基准。';
    if(typeof showNotif === 'function') showNotif(`演进：${newLabel}`, 'info');
    log(`⚑ ${note}`, 'diplo');
  }
  return true;
}

/** 每旬调用：更新 anchor clock + 尝试自动晋升 */
function processStageEvolution(){
  _updateStateAnchorClock();
  ALL_FACS.forEach(fid => {
    // 每旬一次判定：warlord→regional 要求18旬anchor持续，与 regional→regime 条件天然不会同旬满足，
    // 所以此处调用一次即可，不会出现跨级跳跃
    promoteStage(fid);
  });
}

/** UI辅助：返回势力阶段的简短徽章文本（含 anchor 州） */
function getStageBadgeText(fid){
  const stage = getStage(fid);
  const label = STAGE_NAMES[stage] || stage;
  if(stage === 'regional'){
    const a = getAnchorState(fid);
    return a ? `${label}·${STATE_NAMES[a]||a}` : label;
  }
  return label;
}

/** UI辅助：返回阶段颜色（CSS 颜色值） */
function getStageColor(stage){
  return { warlord:'#8b6914', regional:'#c2690a', regime:'#b8860b' }[stage] || '#888';
}

/** UI辅助：返回阶段简短叙事（派系Tab顶部用） */
function getStageNarrative(fid){
  const stage = getStage(fid);
  const total = countFacCities(fid);
  if(stage === 'warlord'){
    // 离一方之主还差什么
    const clock = G.factions[fid]?._stateAnchorClock || {};
    const qualified = Object.keys(clock);
    if(qualified.length === 0){
      return `【军阀】家臣政治·宗族抱团。尚无任一州持有 ${STAGE_PROMO.toRegional.stateMinCities} 城。${total<STAGE_PROMO.toRegional.totalMinCities?`总城数不足（${total}/${STAGE_PROMO.toRegional.totalMinCities}）。`:''}`;
    }
    const bestSt = qualified.sort((a,b)=>clock[a]-clock[b])[0];
    const dur = G.turn - clock[bestSt];
    const remain = Math.max(0, STAGE_PROMO.toRegional.stateDurationTurns - dur);
    if(total < STAGE_PROMO.toRegional.totalMinCities){
      return `【军阀】家臣政治·宗族抱团。${STATE_NAMES[bestSt]} 已持 ${dur} 旬（需 ${STAGE_PROMO.toRegional.stateDurationTurns}），但总城数不足（${total}/${STAGE_PROMO.toRegional.totalMinCities}）。`;
    }
    if(remain > 0){
      return `【军阀】家臣政治·宗族抱团。${STATE_NAMES[bestSt]} 已持 ${dur} 旬，再过 ${remain} 旬可晋升为一方之主。`;
    }
    return `【军阀】家臣政治·宗族抱团。条件已满足，下旬起自动晋升。`;
  }
  if(stage === 'regional'){
    const a = getAnchorState(fid);
    const aName = a ? STATE_NAMES[a] : '—';
    const nonSmallStates = Object.keys(STATE_CITIES).filter(s => STATE_TIER[s]!=='small'
      && countCitiesInState(fid, s) >= STAGE_PROMO.toRegime.stateMinCities);
    const msg = `【一方之主·${aName}】根据地士族崛起，宗族影响力减半。`;
    if(total < STAGE_PROMO.toRegime.totalMinCities){
      return `${msg}距政权：总城 ${total}/${STAGE_PROMO.toRegime.totalMinCities}。`;
    }
    if(nonSmallStates.length < STAGE_PROMO.toRegime.requireStates){
      return `${msg}距政权：需 ${STAGE_PROMO.toRegime.requireStates} 州各持 ${STAGE_PROMO.toRegime.stateMinCities}+ 城（当前 ${nonSmallStates.length}/${STAGE_PROMO.toRegime.requireStates}）。`;
    }
    return `${msg}条件已满足，下旬起自动晋升为政权。`;
  }
  return `【政权】制度化治理，派系系统全面运转，所有士族平等角力。`;
}

// ════════════════════════════════════════════════════════════════════
// ── P3.a 官职 helpers + TRIBUTE_RATES const (v181 L4488-L4558) ──
// ════════════════════════════════════════════════════════════════════

function getFacPostTier(fid){
  const cityCount = Object.values(G.cities).filter(c=>c.fac===fid).length;
  const cityTier = POST_TIERS.find(t=>cityCount>=t.minCities) || POST_TIERS[POST_TIERS.length-1];
  const stage = getStage(fid);
  const capLabel   = STAGE_LABEL_CAP[stage]   || '王';
  const floorLabel = STAGE_LABEL_FLOOR[stage] || '诸侯';
  // POST_TIERS 数组按高到低：[王(0), 公(1), 侯(2), 诸侯(3)]，index 越小 label 越高
  const capIdx   = POST_TIERS.findIndex(t => t.label === capLabel);   // 上限索引（更小的 idx）
  const floorIdx = POST_TIERS.findIndex(t => t.label === floorLabel); // 下限索引（更大的 idx）
  const cityIdx  = POST_TIERS.indexOf(cityTier);
  // 把 cityIdx 钳到 [capIdx, floorIdx] 区间
  const finalIdx = Math.max(capIdx, Math.min(floorIdx, cityIdx));
  return POST_TIERS[finalIdx];
}

/** ★ v181: 附庸纳贡比例 — 按宗主 stage 决定
 *  warlord 仅名义臣属（0/0），regional 中等抽取（10%/8%），regime 完整制度抽税（18%/12%）
 *  附庸自身 stage 不影响（既已称臣，自己合法性不再算数） */
const TRIBUTE_RATES = {
  warlord:  {gold:0,    food:0   },
  regional: {gold:0.10, food:0.08},
  regime:   {gold:0.18, food:0.12},
};
/** 获取附庸→宗主的纳贡比例（按宗主 stage） */
function getTributeRates(suzerainFid){
  const stage = getStage(suzerainFid);
  return TRIBUTE_RATES[stage] || TRIBUTE_RATES.warlord;
}

/** 获取势力各tier可用名额 {mil:[t3,t2,t1], civ:[t3,t2,t1], label}
 *  ★ v181: tier3/tier2 来自 POST_TIERS（城市数+stage cap），tier1 来自 STAGE_TIER1_SLOTS（纯 stage） */
function getPostSlots(fid){
  const t = getFacPostTier(fid);
  const stage = getStage(fid);
  const t1 = STAGE_TIER1_SLOTS[stage] || STAGE_TIER1_SLOTS.warlord;
  return {
    mil: [t.mil[0], t.mil[1], t1.mil],
    civ: [t.civ[0], t.civ[1], t1.civ],
    label: t.label,
  };
}

/** 获取势力当前所有在任官职 [{genName, postDef}, ...] */
function getFacPosts(fid){
  if(!G.genPost) return [];
  return Object.entries(G.genPost)
    .filter(([name, postName])=>{
      const gens = G.generals[fid]||[];
      return gens.some(g=>g.name===name) && postName;
    })
    .map(([name, postName])=>({genName:name, postDef:ALL_POSTS.find(p=>p.name===postName)}))
    .filter(x=>x.postDef);
}

/** 统计势力各tier已用名额 */
function countPostsByTier(fid){
  const posts = getFacPosts(fid);
  const count = {mil:{1:0,2:0,3:0}, civ:{1:0,2:0,3:0}};
  posts.forEach(({postDef:p})=>{
    if(p.track==='mil') count.mil[p.tier]++;
    else count.civ[p.tier]++;
  });
  return count;
}

/** 获取某人的官职定义，无则null */
function getGenPostDef(genName){
  if(!G.genPost || !G.genPost[genName]) return null;
  return ALL_POSTS.find(p=>p.name===G.genPost[genName]) || null;
}


// ════════════════════════════════════════════════════════════════════
// ── P3.b 官职 mutators + merit + seniority (v181 L4564-L4711) ──
// ════════════════════════════════════════════════════════════════════

/** ★ v179fix P14: 势力当前君主——单一读取入口
 *  读 G.factionRulers，旧存档 / 引擎初始化早期回退到 FAC[fid].ruler 剧本初值 */
function getFactionRuler(fid){
  if(!fid) return null;
  return (G.factionRulers && G.factionRulers[fid]) || FAC[fid]?.ruler || null;
}
/** ★ v179fix P14: 势力君主继任——单一写入入口 */
function setFactionRuler(fid, name){
  if(!fid || !name) return;
  if(!G.factionRulers) G.factionRulers = {};
  G.factionRulers[fid] = name;
}

/** ★ v125: 技能前提——当官或为君主 */
function genHasOffice(genName, fid){
  if(getGenPostDef(genName)) return true;
  if(fid && getFactionRuler(fid) === genName) return true;
  // fallback: check all factions
  if(!fid){ for(const f of ALL_FACS){ if(getFactionRuler(f) === genName && hasFacGen(f, genName)) return true; } }
  return false;
}
/** 任命官职 */
function appointGenPost(genName, postName, fid){
  if(!G.genPost) G.genPost={};
  const postDef = ALL_POSTS.find(p=>p.name===postName);
  if(!postDef) return;
  // 互斥：卸任太守
  Object.values(G.cities).forEach(c=>{
    if(c.prefect===genName && c.fac===fid) clearPrefectByGen(genName);
  });
  // 若已有其他官职，先卸任
  if(G.genPost[genName]){
    dismissGenPost(genName, fid, true); // silent=true，不重复触发-3
  }
  G.genPost[genName] = postName;
  // 忠诚+8
  if(G.genLoyalty[genName]!==undefined) G.genLoyalty[genName]=Math.min(100,G.genLoyalty[genName]+8);
  if(G.loyaltyAccum[genName]!==undefined) G.loyaltyAccum[genName]=Math.min(100,G.loyaltyAccum[genName]+8);
  // 派系事件
  const apFac = getGenFaction(genName, fid);
  if(apFac) triggerFactionEvent('appointPost', fid, {appointedFaction:apFac});
  // ★ v151: 价值观冲击 — 任命官职（士族→共治，寒门/宗亲→集权）
  const _apOrigin = (GEN_TAGS[genName]||{}).origin;
  if(_apOrigin === 'gentry') applyEthosShock(fid, 'power', -2, '任命士族');
  else if(_apOrigin === 'humble' || _apOrigin === 'clan') applyEthosShock(fid, 'power', 2, '任命寒门/宗亲');
  log(`📜 ${genName} 被任命为 ${postName}`, 'economy');
}

/** 卸任官职 */
function dismissGenPost(genName, fid, silent){
  if(!G.genPost || !G.genPost[genName]) return;
  const oldPost = G.genPost[genName];
  delete G.genPost[genName];
  if(!silent){
    if(G.genLoyalty[genName]!==undefined) G.genLoyalty[genName]=Math.max(0,G.genLoyalty[genName]-3);
    if(G.loyaltyAccum[genName]!==undefined) G.loyaltyAccum[genName]=Math.max(0,G.loyaltyAccum[genName]-3);
    const rmFac = getGenFaction(genName, fid);
    if(rmFac) triggerFactionEvent('removePost', fid, {removedFaction:rmFac});
    // ★ v151: 价值观冲击 — 罢免官职
    const _rmOrigin = (GEN_TAGS[genName]||{}).origin;
    if(_rmOrigin === 'gentry') applyEthosShock(fid, 'power', 3, '罢免士族');
    else if(_rmOrigin === 'humble' || _rmOrigin === 'clan') applyEthosShock(fid, 'power', -1, '罢免寒门/宗亲');
    log(`📜 ${genName} 被免去 ${oldPost}`, 'economy');
  }
}

/** 清除武将所有职务（死亡/被俘/下野时调用） */
function clearAllPostsByGen(genName){
  if(G.genPost) delete G.genPost[genName];
}

/** 检查降档裁官：城市数减少导致名额不够 */
function checkPostDowngrade(fid){
  const slots = getPostSlots(fid);
  const used = countPostsByTier(fid);
  const posts = getFacPosts(fid);
  // 按tier从高到低裁：先裁tier1多出的，再tier2，再tier3
  ['mil','civ'].forEach(track=>{
    [1,2,3].forEach(tier=>{
      const max = slots[track][3-tier]; // slots数组顺序: [t3,t2,t1]
      const curCount = used[track][tier];
      if(curCount > max){
        // 裁掉功绩最低的
        const candidates = posts
          .filter(({postDef:p})=>p.track===track && p.tier===tier)
          .sort((a,b)=>(G.genMerit[a.genName]||0)-(G.genMerit[b.genName]||0));
        for(let i=0; i<curCount-max; i++){
          if(candidates[i]) dismissGenPost(candidates[i].genName, fid, false);
        }
      }
    });
  });
}

/** 计算势力所有官职buff汇总
 *  返回 {goldProd, foodProd, recruitCost, reinforce, upkeep, foodCost,
 *         morale, buildSpeed, stratRate, giftEffect, expGain} */
function calcPostBuffs(fid){
  const buffs = {goldProd:0, foodProd:0, recruitCost:0, reinforce:0, upkeep:0,
                 foodCost:0, morale:0, buildSpeed:0, stratRate:0, giftEffect:0, expGain:0};
  getFacPosts(fid).forEach(({genName, postDef})=>{
    if(!postDef.buff) return;
    const gen = (G.generals[fid]||[]).find(g=>g.name===genName);
    if(!gen) return;
    const statVal = postDef.buffStat==='com' ? gen.com : gen.pol;
    const scale = statVal / 100;
    Object.entries(postDef.buff).forEach(([k,v])=>{
      buffs[k] = (buffs[k]||0) + v * scale;
    });
  });
  return buffs;
}

/** 获取势力官职总俸禄/旬 */
function calcPostSalary(fid){
  return getFacPosts(fid).reduce((s,{postDef})=>s+(postDef.salary||0), 0);
}

/** 武将是否有官职或太守（用于忠诚⑤⑥判定）*/
function hasAnyPost(genName, fid){
  if(G.genPost && G.genPost[genName]) return true;
  return Object.values(G.cities).some(c=>c.fac===fid && c.prefect===genName);
}

/** 添加功绩 */
function addMerit(genName, amount){
  if(!G.genMerit) G.genMerit={};
  G.genMerit[genName] = (G.genMerit[genName]||0) + amount;
}

/** 获取武将资历标签 */
function seniority(name, fid){
  if(!G.genJoinTurn) return 'founding';
  const jt = G.genJoinTurn[name];
  if(jt === undefined) return 'founding';
  const src = G.genJoinSource[name] || 'member';
  const tenure = G.turn - jt;

  // 核心创始：永久保留，不因tenure升级分流
  if(src === 'founding') return 'founding';
  // 降将/新附满180旬(≈5年) → 元老（按origin重新归类）
  if(tenure >= 180) return 'elder';
  // 降将/新附未满180旬
  if(src === 'capture') return 'defector';
  if(src === 'recruit') return 'newcomer';
  // 开局非核心成员（'member'）：始终按origin/home分类，不进创始团队
  return 'member';
}

// ════════════════════════════════════════════════════════════════════
// ── P4 派系影响力 (v181 L4921-L4952) ──
// ════════════════════════════════════════════════════════════════════

/** 计算势力各派系影响力分布（★ v155fix: 旬级缓存）
 *  返回 {factionId: {influence, gens:[name,...]}, total} */
let _facInfluenceCache = {}, _facInfluenceCacheTurn = -1;
function calcFactionInfluence(fid){
  if(_facInfluenceCacheTurn === G.turn && _facInfluenceCache[fid]) return _facInfluenceCache[fid];
  if(_facInfluenceCacheTurn !== G.turn){ _facInfluenceCache = {}; _facInfluenceCacheTurn = G.turn; }

  const gens = (G.generals[fid] || []).filter(g => g.role !== 'ruler');
  const result = {};
  FACTION_DEFS.forEach(fd => { result[fd.id] = {influence:0, gens:[]}; });
  let total = 0;

  gens.forEach(gen => {
    const facs = getGenFactions(gen.name, fid);
    if(!facs.length) return;
    const inf = _genInfluence(gen, fid);
    // ★ v94: 双标签影响力分配 = baseInf × 1.5 / tagCount（每标签）
    const perTag = facs.length > 1 ? (inf * 1.5 / facs.length) : inf;
    const totalContrib = facs.length > 1 ? inf * 1.5 : inf;
    total += totalContrib;
    facs.forEach(facId => {
      if(result[facId]){
        result[facId].influence += perTag;
        if(!result[facId].gens.includes(gen.name)) result[facId].gens.push(gen.name);
      }
    });
  });

  const ret = {factions: result, total: Math.max(0.01, total)};
  _facInfluenceCache[fid] = ret;
  return ret;
}

// ════════════════════════════════════════════════════════════════════
// ── P5 朝议 generate/apply/expire/AI-select (v181 L5241-L5410) ──
// ════════════════════════════════════════════════════════════════════

/** 生成本季朝议提案列表 [{proposal, proposer(genObj), postDef, factionId}] */
function _generateCourtProposals(fid){
  const posts = getFacPosts(fid);
  const t1mil = [], t1civ = [], t2mil = [], t2civ = [];
  posts.forEach(({genName, postDef}) => {
    if(postDef.tier > 2) return;
    const gen = (G.generals[fid]||[]).find(g=>g.name===genName);
    if(!gen) return;
    const entry = {gen, postDef, factionId: getGenFaction(genName, fid)};
    if(postDef.tier === 1){
      (postDef.track === 'mil' ? t1mil : t1civ).push(entry);
    } else {
      (postDef.track === 'mil' ? t2mil : t2civ).push(entry);
    }
  });
  const proposers = [];
  // tier1 all contribute
  t1mil.forEach(e => proposers.push({...e, track:'mil'}));
  t1civ.forEach(e => proposers.push({...e, track:'civ'}));
  // tier2: pick 1 per track; if tier1 missing from that track, pick 2
  const milNeeded = t1mil.length === 0 ? Math.min(2, t2mil.length) : Math.min(1, t2mil.length);
  const civNeeded = t1civ.length === 0 ? Math.min(2, t2civ.length) : Math.min(1, t2civ.length);
  const shuffMil = _shuffleFY(t2mil); // ★ v179fix P39
  const shuffCiv = _shuffleFY(t2civ); // ★ v179fix P39
  for(let i=0;i<milNeeded;i++) proposers.push({...shuffMil[i], track:'mil'});
  for(let i=0;i<civNeeded;i++) proposers.push({...shuffCiv[i], track:'civ'});

  if(proposers.length === 0) return [];

  // Assign proposals: each proposer draws from their track pool, no duplicates within track
  const usedMil = new Set(), usedCiv = new Set();
  const results = [];
  proposers.forEach(p => {
    const pool = p.track === 'mil' ? COURT_PROPOSALS_MIL : COURT_PROPOSALS_CIV;
    const used = p.track === 'mil' ? usedMil : usedCiv;
    const available = pool.filter(pr => !used.has(pr.id));
    if(!available.length) return;
    const chosen = available[Math.floor(Math.random()*available.length)];
    used.add(chosen.id);
    // Stat scaling: per point above 70, +0.1% absolute (cap +5%)
    const stat = p.gen[chosen.statScale] || 70;
    const bonus = Math.min(0.05, Math.max(0, (stat - 70) * 0.001));
    const scaledVal = Math.abs(chosen.baseVal) < 1
      ? (chosen.baseVal > 0 ? chosen.baseVal + bonus : chosen.baseVal - bonus)
      : (chosen.baseVal > 0 ? chosen.baseVal + bonus * 100 : chosen.baseVal - bonus * 100);
    results.push({proposal: chosen, proposer: p.gen, postDef: p.postDef,
                  factionId: p.factionId, effectVal: scaledVal});
  });
  return results;
}

/** 获取朝议decree buff合计（从G.courtDecrees） */
function getCourtDecreeBuffs(fid){
  const buffs = {goldProd:0, foodProd:0, recruitCost:0, reinforce:0, upkeep:0,
                 morale:0, milBuildCost:0, recruitWild:0};
  if(!G.courtDecrees) return buffs;
  G.courtDecrees.filter(d => d.fid === fid && d.expiresAt > G.turn).forEach(d => {
    if(buffs.hasOwnProperty(d.buffKey)) buffs[d.buffKey] += d.effectVal;
  });
  return buffs;
}

/** 应用朝议结果：选中的提案生效+派系mod */
function _applyCourtDecisions(fid, proposals, chosenIndices){
  if(!G.courtDecrees) G.courtDecrees = [];
  const expiresAt = G.turn + 3; // 持续1月(3旬)，季度9旬中仅前3旬有效
  proposals.forEach((p, i) => {
    const chosen = chosenIndices.includes(i);
    // Apply decree buff
    if(chosen){
      G.courtDecrees.push({
        fid, buffKey: p.proposal.buffKey, effectVal: p.effectVal,
        name: p.proposal.name, proposer: p.proposer.name, expiresAt
      });
      log(`📜 朝议通过「${p.proposal.name}」（${p.proposer.name}提案）`, 'diplo');
      // ★ v152: 朝议提案通过时价值观微调
      const pid = p.proposal.id;
      if(pid==='conscript'||pid==='upkeep') applyEthosShock(fid,'military',2,'朝议·'+p.proposal.name);
      if(pid==='conscript') applyEthosShock(fid,'strategy',1,'朝议·征兵令');
      if(pid==='reinforce') applyEthosShock(fid,'military',1,'朝议·充员令');
      if(pid==='milBuild') applyEthosShock(fid,'strategy',-1,'朝议·军防工程');
      if(pid==='farm'||pid==='morale') applyEthosShock(fid,'civil',-2,'朝议·'+p.proposal.name);
      if(pid==='trade') applyEthosShock(fid,'civil',-1,'朝议·兴商令');
      if(pid==='recruit') applyEthosShock(fid,'power',-1,'朝议·招贤令');
    }
    // Faction mod: +1.5 for adopted, -0.8 for rejected
    if(p.factionId){
      const delta = chosen ? 1.5 : -0.8;
      const gens = (G.generals[fid]||[]).filter(g => g.role !== 'ruler');
      gens.forEach(gen => {
        if(getGenFaction(gen.name, fid) === p.factionId){
          if(!G.genFactionMod) G.genFactionMod = {};
          if(!G.genFactionModLog) G.genFactionModLog = {};
          const old = G.genFactionMod[gen.name] || 0;
          G.genFactionMod[gen.name] = Math.max(-20, Math.min(20, old + delta));
          if(!G.genFactionModLog[gen.name]) G.genFactionModLog[gen.name] = [];
          G.genFactionModLog[gen.name].push({
            turn:G.turn, event: chosen ? `朝议采纳「${p.proposal.name}」` : `朝议否决「${p.proposal.name}」`,
            delta, after: G.genFactionMod[gen.name]
          });
          if(G.genFactionModLog[gen.name].length > 8) G.genFactionModLog[gen.name].shift();
        }
      });
      // ★ v161→v170: 朝议→属县clan_base忠诚（采纳+5 / 驳回-3，×COUNTY_CLAN_SENS=2.0）
      // ★ v178 fix #33: 改为按 county 去重——一县多族（吴县/谯县）原先被叠加 N 次 shock
      const countyDelta = chosen ? 5 : -3;
      const regions = GENTRY_FAC_TO_STATES[p.factionId] || [];
      const _shockedCounties = new Set(); // 避免同县被多region触发（理论不会，但兜底）
      for(const reg of regions){
        const regionCityIds = STATE_CITIES[reg] || [];
        for(const cid of regionCityIds){
          const ct = G.cities[cid];
          if(!ct || ct.fac !== fid || !ct.counties) continue;
          let touched = false;
          ct.counties.forEach(county => {
            if(county.type !== 'clan_base') return;
            const key = cid + '·' + county.name;
            if(_shockedCounties.has(key)) return;
            _shockedCounties.add(key);
            county.loyalty = Math.max(0, Math.min(100, county.loyalty + countyDelta * COUNTY_CLAN_SENS));
            touched = true;
          });
          if(touched) ct.gentry = _aggregateGentry(ct);
        }
      }
    }
  });
}

/** 清除过期朝议decree */
function _expireCourtDecrees(){
  if(!G.courtDecrees) return;
  G.courtDecrees = G.courtDecrees.filter(d => d.expiresAt > G.turn);
}

/** AI自动选朝议提案（选对当前局势最有利的） */
function _aiCourtSelect(fid, proposals){
  if(proposals.length <= 2){
    return proposals.map((_,i)=>i);
  }
  const fac = G.factions[fid];
  const cities = Object.values(G.cities).filter(c=>c.fac===fid);
  // Score each proposal by situation
  const scores = proposals.map((p,i) => {
    let s = 0;
    const id = p.proposal.id;
    if(id==='conscript') s = 4; // always useful
    if(id==='upkeep'){
      const unitCount = G.units.filter(u=>u.fac===fid).length;
      s = unitCount > 5 ? 6 : 3;
    }
    if(id==='reinforce') s = 3;
    if(id==='milBuild') s = 2;
    if(id==='farm'){
      const avgFood = cities.reduce((a,c)=>a+(c.storage||0),0) / Math.max(1,cities.length);
      s = avgFood < 3000 ? 7 : 3;
    }
    if(id==='trade'){
      s = (fac.res.gold < 5000) ? 6 : 3;
    }
    if(id==='morale'){
      const avgMorale = cities.reduce((a,c)=>a+c.morale,0) / Math.max(1,cities.length);
      s = avgMorale < 60 ? 6 : 2;
    }
    if(id==='recruit') s = 2;
    return {i, s};
  });
  scores.sort((a,b)=>b.s-a.s);
  return [scores[0].i, scores[1].i];
}

// ════════════════════════════════════════════════════════════════════
// ── P6 称帝 (v181 L11797-L11866) ──
// ════════════════════════════════════════════════════════════════════

/** 称帝条件检查 */
function canEnthrone(fid){
  if(FAC_IDENTITY[fid]?.type === 'emperor') return false;
  if(G.turn < 24) return false;
  // SKILL_INLINE: bigong — 华歆·逼宫：当官时称帝城市门槛10→8、信誉门槛40→30
  const _huaxinBonus = hasFacGen(fid, '华歆') && genHasOffice('华歆', fid);
  const _enthroneMinCities = _huaxinBonus ? 8 : 10;
  const _enthroneMinRep = _huaxinBonus ? 30 : 40;
  const cityCount = Object.values(G.cities).filter(c=>c.fac===fid).length;
  if(cityCount < _enthroneMinCities) return false;
  if((G.reputation?.[fid]||REPUTATION_DEFAULT) < _enthroneMinRep) return false;
  if(isVassal(fid)) return false;
  return true;
}

/** 执行称帝 */
function doEnthrone(fid){
  if(!canEnthrone(fid)) return;
  const oldType = FAC_IDENTITY[fid]?.type || 'warlord';
  // 天子消亡
  if(G.emperor){
    // 所有emperor_holder降级
    ALL_FACS.forEach(f => {
      if(FAC_IDENTITY[f]?.type === 'emperor_holder'){
        FAC_IDENTITY[f].type = FAC_IDENTITY[f]._baseType || 'warlord';
      }
    });
    G.emperor = null;
  }
  FAC_IDENTITY[fid].type = 'emperor';
  // 信誉+10
  G.reputation[fid] = Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT) + 10);
  // 第三方关系
  ALL_FACS.forEach(other => {
    if(other === fid) return;
    const otherIsEmperor = FAC_IDENTITY[other]?.type === 'emperor';
    addDiplo(fid, other, otherIsEmperor ? -25 : -15);
    // ★ v152: 有人称帝→汉室正统性崩塌→所有其他势力mandate被推高
    applyEthosShock(other, 'mandate', 12, `${FAC[fid]?.name||fid}称帝·汉统动摇`);
  });
  // 派系影响
  const facKey = oldType === 'han_royal' ? 'han_royal' : (oldType === 'emperor_holder' ? 'emperor_holder' : 'warlord');
  const fx = ENTHRONE_FACTION_EFFECTS[facKey];
  if(fx && ALL_FACS.includes(fid)) _applyClaimFactionEffects(fid, fx);
  log(`👑 ${FAC[fid]?.name}${getFactionRuler(fid)}称帝！天下震动`, 'diplo');
  applyEthosShock(fid, 'mandate', 28, '称帝'); // ★ v151
  // 派系事件通知
  ALL_FACS.forEach(f => {
    if(f !== fid) triggerFactionEvent('warDeclare', f, {}); // 他国鹰派被激活
  });
}

/** AI称帝评估（每12旬调用） */
function aiConsiderEnthrone(fid){
  if(!canEnthrone(fid)) return;
  // ★ v152: mandate低→拒绝称帝（崇汉AI不会称帝）；mandate高→降低门槛
  const _ethEnt = G.factions[fid]?.ethos;
  if(_ethEnt && _ethEnt.mandate < 30) return; // 崇汉倾向，不称帝
  const myType = FAC_IDENTITY[fid]?.type;
  let chance = myType === 'emperor_holder' ? 0.60 : myType === 'han_royal' ? 0.40 : 0.80;
  // mandate越高越积极
  if(_ethEnt && _ethEnt.mandate >= 60) chance = Math.min(0.95, chance + 0.15);
  // 额外条件：城市数应多于至少一个对手
  const myCities = Object.values(G.cities).filter(c=>c.fac===fid).length;
  const maxOther = Math.max(...ALL_FACS.filter(f=>f!==fid).map(f=>Object.values(G.cities).filter(c=>c.fac===f).length));
  // ★ v152: mandate>=60时降低城市优势要求（不需要是最强的也敢称帝）
  const cityAdvantageNeeded = (_ethEnt && _ethEnt.mandate >= 60) ? -2 : 0;
  if(myCities <= maxOther + cityAdvantageNeeded) return;
  if(Math.random() < chance) doEnthrone(fid);
}

/** Claude AI 称帝执行 (v181 L13936-L13940 verbatim 抽离 + D-121 mandate gate)
 *  对齐 aiConsiderEnthrone (L1037): mandate<30 崇汉倾向拒绝称帝, 防止 Claude AI 绕过设定 */
function _execEnthrone(fid, act) {
  if (!canEnthrone(fid)) return false;
  // D-121: 与 aiConsiderEnthrone mandate gate 对齐, 崇汉倾向不称帝
  const _ethEnt = G.factions[fid]?.ethos;
  if (_ethEnt && _ethEnt.mandate < 30) return false;
  doEnthrone(fid);
  return true;
}

// ════════════════════════════════════════════════════════════════════
// ── P7 AI _exec 入口 (sprint batch-27, v181 L13470-L13503) ──
//    官职任命 / 罢免 — 随 appointGenPost / dismissGenPost 归 politics
// ════════════════════════════════════════════════════════════════════

function _execAppointPost(fid, act) {
  const genName = act.general;
  const postName = act.post;
  if (!genName || !postName) { console.warn('[ClaudeAI] appoint: 缺general或post', act); return false; }
  if (!_genInFac(genName, fid)) { console.warn('[ClaudeAI] appoint: 武将不在势力', genName); return false; }
  const gen = (G.generals[fid] || []).find(g => g.name === genName);
  if (!gen || gen.role === 'ruler') { console.warn('[ClaudeAI] appoint: 武将不存在或是君主', genName); return false; }
  const postDef = ALL_POSTS.find(p => p.name === postName);
  if (!postDef) { console.warn('[ClaudeAI] appoint: 官职不存在', postName); return false; }
  if ((G.genMerit[genName] || 0) < postDef.merit) { console.warn('[ClaudeAI] appoint: 功绩不足', genName, G.genMerit[genName] || 0, '<', postDef.merit); return false; }
  if (G.genPost && G.genPost[genName]) { console.warn('[ClaudeAI] appoint: 已有官职', genName, G.genPost[genName]); return false; }
  if (Object.values(G.cities).some(c => c.fac === fid && c.prefect === genName)) { console.warn('[ClaudeAI] appoint: 是太守', genName); return false; }
  // ★ v158: 检查该官职名额是否已满
  // ★ v181: 改走 getPostSlots（自动应用 stage cap tier1），不再直读 POST_TIERS
  const allSlots = getPostSlots(fid);
  const track = postDef.track; // 'mil' or 'civ'
  const postTier = postDef.tier; // 1,2,3
  const slots = track === 'mil' ? allSlots.mil : allSlots.civ;
  const maxSlots = slots[3 - postTier] || 0; // tier1=index2, tier2=index1, tier3=index0
  const currentHolders = Object.entries(G.genPost || {}).filter(([gn, pn]) => {
    const pd = ALL_POSTS.find(p => p.name === pn);
    return pd && pd.track === track && pd.tier === postTier && _genInFac(gn, fid);
  }).length;
  if (currentHolders >= maxSlots) { console.warn('[ClaudeAI] appoint: 名额已满', postName, `${currentHolders}/${maxSlots}`); return false; }
  appointGenPost(genName, postName, fid);
  return true;
}

function _execDismissPost(fid, act) {
  const genName = act.general;
  if (!genName || !G.genPost?.[genName]) return false;
  dismissGenPost(genName, fid);
  return true;
}
