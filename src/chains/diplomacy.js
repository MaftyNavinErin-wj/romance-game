// src/chains/diplomacy.js
//
// 外交链(D)— 玩家外交动作 / AI 外交决策 / 计谋 / 宣称+信誉+血仇 / 附庸。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.8 / 阶段 3,chain 模板第四应用)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation,Node 脚本 line-by-line 复制 v181)。
//
// ── 抽离范围(5 段)──
//   D1 玩家外交动作 + 实力计算                  v181 L9591-L9996  22 函数(跳过 L9669-L9729 武将链 setPrefect)
//                                                                _clearSiegeOnPeace / acceptPeaceOffer
//                                                                / rejectPeaceOffer / _applyPeaceAgreement
//                                                                / _diploActed / _diploMarkActed
//                                                                / diploGift / diploArmistice / diploAlly
//                                                                / startClaimPrepUI / playerEnthrone
//                                                                / diploBreakAlliance / diploWar
//                                                                / powerIndex / fogPowerEstimate
//                                                                / alliedFacs / isSuzerain / isVassal
//                                                                / getSuzerain / effectivePowerAgainst
//                                                                / peaceWillingness / _syncAllyWarStatus
//   D2 AI 外交决策                              v181 L10018-L10243  aiDoDiplo / aiDoTradeAgreement
//   D3 计谋                                     v181 L10245-L10750  _strategyRate / stratDriveWolf
//                                                                / stratTwoTigers / stratSpy / stratRumor
//                                                                / stratScout / _applyScoutReveal
//                                                                / _buildEnvoyIntel / stratEnvoy
//                                                                / tickStrategyCDs
//   D4 宣称 + 信誉 + 血仇                       v181 L10759-L11051  getDiploStatus / isHostile / addDiplo
//                                                                / _shuffleFY / applyReputationPenalty
//                                                                / _repPenaltyFactor / _repGiftMult
//                                                                / _areFacsAdjacent / _hasLostCityTo
//                                                                / getAvailableClaims / startClaimPrep
//                                                                / processClaimPrep / getReadyClaim
//                                                                / applyWarDeclarationEffects
//                                                                / _applyClaimFactionEffects / trackCityLoss
//                                                                / checkEmperorCapture / checkBloodFeud
//                                                                / processFeudDecay / processReputation
//   D5 附庸                                     v181 L11091-L11415  10 函数(跳过 L11179-L11210 modal showDiploVassal)
//                                                                applyCommonEnemyDiploBonus / checkDiplo
//                                                                / _resolveVassalDiploConflicts
//                                                                / _setVassalStatus / acceptVassalOffer
//                                                                / rejectVassalOffer / playerReleaseVassal
//                                                                / requestVassalIndependence
//                                                                / diploDemandVassal / diploSubmitVassal
//   D6 顶层 lets(模块 cache state)             v181 L17542-L17543
//                                                                _pendingPeaceOffer / _pendingVassalOffer
//   D7 AI _exec 入口(sprint batch-29 D-类架构债)
//     D7.a 外交主                                v181 L13395-L13476 _execBreakAlliance / _execDiploGift /
//                                                                _execDiploArmistice / _execStartClaim /
//                                                                _execDemandVassal / _execSubmitVassal /
//                                                                _execReleaseVassal (7 funcs)
//     D7.b 计谋                                  v181 L13482-L13605 _execSchemeDriveWolf /
//                                                                _execSchemeTwoTigers / _execSchemeSpy /
//                                                                _execSchemeRumor / _execSchemeScout (5 funcs)
//
// ── 留 v181 ──
//   modal HTML 构造(phase 2 原则):
//     `showDiploSueForPeace`(L9567)
//     `showDiploVassal`(L11179-L11210)
//   render Tab 函数(phase 2 原则):
//     `renderDipTab`(L13568) / `renderSchemeTab`(L13829)
//   武将链(留 3.12,夹在外交段中间):
//     `setPrefect / clearPrefectByGen`(L9669-L9729)
//   注: 外交相关 14 个 _exec 已全数抽到 chain (sprint batch-19 + batch-29):
//     _execDeclareWar / _execProposeAlliance (batch-19, D2 范围)
//     D7.a 外交主 7 + D7.b 计谋 5 (batch-29)
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G.diplo[`${a}-${b}`].status / .rel / .suzerain / ._actedThisTurn /
//      ._warDeclaredTurn / ._brokenAllyTurn / ._peaceTurn / ._betrayal`(双向外交关系 + 时间戳)
//   - `G.reputation[fid]`(信誉)
//   - `G.bloodFeud / G._feudDecay / G._feudKills`(血仇)
//   - `G._warClaimStrength / G._claimGentryHook / G._claimPrep`(宣称)
//   - `G[`_diploCD_${a}_${b}`]` / `G[`_diploActed_${fid}`]` / `G[`_vassalIndepCD_${fid}`]`(各种 CD)
//   - `G.scoutData / G.envoyIntel`(计谋情报)
//   - `_pendingPeaceOffer / _pendingVassalOffer`(模块 lets)
//
// **跨链副作用写口**(按 (a) 原则,主写口落外交,副作用写口落他链 — 整函数归外交):
//   - `_applyPeaceAgreement`:调 `triggerFactionEvent('truce')`(武将派系)+ `_clearSiegeOnPeace`
//     写 `unit.status / .siegeTarget / city.siegeDecay`(军事)— 停战副作用
//   - `applyWarDeclarationEffects / _applyClaimFactionEffects`:调 `applyEthosShock`(已抽 ethos)+ 派系 mod
//   - `diploAlly`:调 `applyEthosShock`(ethos)+ `triggerFactionEvent('truce')`(武将)
//   - `diploWar`:调 `applyReputationPenalty` + `triggerFactionEvent('betray')`(武将)
//   - `stratSpy / stratRumor`:写 `G.genLoyalty`(武将)/ `G.cities[].morale`(经济)
//     —— 计谋的主写口,整函数归外交。3.9 / 3.12 抽时记住边界
//   - `stratScout / _applyScoutReveal`:写 `G.fog`(军事)
//     —— 谍报情报机制,主写口在外交计谋。3.11 抽军事时确认
//   - `trackCityLoss`:调 `checkPostDowngrade`(政治,已抽)
//   - `checkEmperorCapture`:写 `FAC_IDENTITY[fid].type` / `G.emperor`(政治)
//     —— 战时擒帝触发,主写口在外交战争结算。3.12 武将 / 3.11 军事**不反取**
//   - `addDiplo`:被几乎所有 chain 调,本 chain 的核心 helper
//   - `diploGift / diploArmistice` 等玩家入口:扣 `G.factions[fid].res.gold`(经济)
//     —— 外交动作消耗资源,主写口在外交关系
//
// 3.7 carry-over 验证:`doEnthrone`(已抽 politics)写 `G.reputation` 是政治写口副作用,
// 外交链**不反取**(确认 — `playerEnthrone` 只调 `doEnthrone`,不写 reputation)。
//
// 该跨链写在对应 chain 抽离时再次确认归属(同 3.5/3.6/3.7 模式)。
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/ + src/render/ +
// chains/ethos.js + chains/gentry.js + chains/politics.js
// 模块共享 hoisted function 全局可见,无 import/export)。
//
// `_pendingPeaceOffer / _pendingVassalOffer` 是 top-level **let**(模块 cache state,
// phase 3.4 已验证 let 跨 classic <script> 共享。已被 src/core/main.js + src/core/tick.js
// 跨 script 引用,抽到本 chain 后所有引用自动指向新位置)。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(callers):
//   - 经济链(留 v181 等 3.9):
//       trade 路径调 `addDiplo / getDiploStatus / isHostile / hasTradeAgreement`(已含)
//       多处调 `getDiploStatus / isHostile / alliedFacs`
//   - 军事链(留 v181 等 3.11):
//       战斗 / 围城 / 行军 / fog / siege 多处调 `addDiplo / getDiploStatus / isHostile /
//       _syncAllyWarStatus / _clearSiegeOnPeace / trackCityLoss / checkEmperorCapture`
//       城市易手调 `applyCommonEnemyDiploBonus`
//       战斗死亡调 `checkBloodFeud`
//   - 武将链(留 v181 等 3.12):
//       killGen / surrenderGen / poach / 派系事件调 `addDiplo / applyReputationPenalty /
//       checkBloodFeud / isHostile / alliedFacs`
//   - 豪族链(已抽 chains/gentry.js):
//       `_triggerGentryBetray` 调 `trackCityLoss / checkEmperorCapture / addDiplo`
//   - 政治链(已抽 chains/politics.js):
//       `doEnthrone` 调 `addDiplo / _applyClaimFactionEffects`(政治写口的副作用 — 已 carry-over §3.7)
//       `canEnthrone` 调 `isVassal`
//   - 价值观链(已抽 chains/ethos.js):
//       `_ethosDistance` 被 ethos drift 调(ethos→diplo 反向,已 carry-over §3.5)
//   - 事件链(留 v181 等 3.10):
//       事件 effects 多处调 `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud`
//   - render(留 v181):
//       `src/render/tooltips.js / ui_panels.js`:`getDiploStatus / isHostile / alliedFacs /
//       isVassal / isSuzerain / getSuzerain / powerIndex / fogPowerEstimate /
//       getAvailableClaims / getReadyClaim / processClaimPrep / addDiplo`
//       v181 inline `renderDipTab / renderSchemeTab`(留 v181)调多个外交 helper
//   - core(已抽):
//       `src/core/tick.js`:`tickStrategyCDs / processClaimPrep / processFeudDecay /
//       processReputation / aiDoDiplo / aiDoTradeAgreement / checkDiplo`(每旬调用)+
//       `_pendingPeaceOffer / _pendingVassalOffer` 弹窗调度(L636-L643)
//       `src/core/main.js`:initGame / loadFromSlot 调 `addDiplo / _setVassalStatus` 等;
//       backToTitle reset 调 `_pendingPeaceOffer / _pendingVassalOffer = null`(L127-L128)
//       `src/core/claude_ai.js`:14 个 _exec* 调本 chain 的 diplo / strat / claim / vassal 函数
//   - inline backToTitle / startGame:
//       L26835 + L26836:`_pendingPeaceOffer = null; _pendingVassalOffer = null;`(已是跨 script 写)
//       L26495-L26496 saveGame meta / L26520-L26521 loadGame meta 也已跨 script 引用,
//       抽 lets 后**全部保持不变**(自动指向 diplomacy.js 暴露的 lets)
//
// 本 chain 调外部链(callees):
//   - `triggerFactionEvent`(武将链 派系事件 hub,留 v181 等 3.12)
//     —— `_applyPeaceAgreement / diploAlly / diploWar / aiDoDiplo / aiDoTradeAgreement /
//        applyWarDeclarationEffects` 等多处调
//   - `applyEthosShock`(已抽 chains/ethos.js)
//     —— `diploAlly / diploWar / applyWarDeclarationEffects / _applyClaimFactionEffects` 调
//   - `checkPostDowngrade`(已抽 chains/politics.js)— `trackCityLoss` 调
//   - `doEnthrone / canEnthrone`(已抽 chains/politics.js)— `playerEnthrone` 调
//   - `getTributeRates / setFactionRuler / clearAllPostsByGen`(已抽 chains/politics.js)
//     — 附庸 / 城市易手 / 武将处置路径调
//   - `hasFacGen / genHasOffice`(武将 / 政治 helper,留 v181 / 已抽 politics)
//   - `safeSub`(已抽 src/core/helpers.js)— diploGift / diploArmistice / diploAlly 调
//   - `closeModal / renderRight / renderLeft / renderAll / renderAllLight / showNotif / log /
//     _checkPendingCourtAfterPopup`(已抽 src/render/notifications.js / 留 v181 inline modal)
//   - 武将链(留 v181 等 3.12):`addStatExp / loyaltyDisplay / getRetainerType / clearPrefectByGen /
//     killGen / surrenderGen / poachGen / addGenChronicle / hasFacGen / hasGenInUnits / GEN_TAGS /
//     GEN_MAP / addIntimacy / getRelationLabel`(reputation/ blood feud / strat 路径调)
//   - 经济链(留 v181 等 3.9):`hasTradeAgreement / calcTradeAgrIncome / cancelTradeAgreement /
//     diploTradeAgreement / aiDoTradeAgreement` 反向(留 v181)
//   - 军事链(留 v181 等 3.11):`canSeeFactionData / hkey / FOG_VISIBLE / FOG_UNEXPLORED /
//     getKnownCityCount / getUnitTroops / invalidateCityCache / updateFogCitySnapshot` 等
//     —— `fogPowerEstimate / _applyScoutReveal / _clearSiegeOnPeace` 调
//   - `confirm`(浏览器 API)— `playerEnthrone` 调
//   - 数据 / 常量:`FAC / ALL_FACS / FAC_IDENTITY / CLAIM_TYPES / REPUTATION_DEFAULT /
//     REPUTATION_PENALTIES / SCOUT_COSTS / STRAT_DEFS / VASSAL_TRIBUTE_RATES /
//     STAGE_LABEL_CAP / WAR_DECL_FACTION_FX / ENVOY_REVEAL_INFO / GENTRY_FAC_TO_STATES /
//     STATE_CITIES / SUPPLY_CITY_RESTORE_TURNS`(部分已抽 src/data/,部分留 v181)
//   - `G(状态根)`(已抽 src/core/state.js)
//
// 同 phase 2/3.2/3.3/3.4/3.5/3.6/3.7 反向调用模式,设计原则 (c) 已 approve。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_*_notes §二)──
// PLAN §三阶段 3.8(原)字面:`chains/diplomacy.js(外交链 v4 / ~66 函数 / 31 D 类)`
//   字面映射:~66 函数(master scout)
// scout 实测 + 实装:**64 函数 + 2 顶层 lets verbatim ~1660 行 v181 代码**
//   (master scout 估 ~66:`showDiploSueForPeace / showDiploVassal` 2 个 modal HTML 留 v181)
// PLAN-vs-reality 偏差小,主因:phase 2 原则 modal HTML 留 v181。
//
// scout-before-extract 第 8 次应用(本 session 自决,follow 模板规范)。
//
// ── script 加载顺序(phase 3.5 拍板规范)──
// `data/* → core/* → chains/* → render/* → inline`
// 本文件加在 chains/politics.js 之后,render/notifications.js 之前。chains/ 内顺序无关。
//
// ── chain 抽离模板第四次应用 ──
// phase 3.5 ethos 模板首发 / 3.6 gentry 第二应用 / 3.7 politics 第三应用,
// 本 session 是模板第四应用(最大 chain 文件,~1900 行)。
//   - 6 项 header 必含 ✓(含写口归属声明)
//   - 加载顺序规范 ✓
//   - phase 2 原则(modal HTML + render Tab 留 v181)✓
//   - 跨链反向调用 (c) 容许,callers/callees 按归属链整理 ✓
//   - 跨 script lets 抽离(已被 main.js + tick.js 跨 script 引用,抽到本 chain 后保持兼容)✓
//   - Node 脚本 line-by-line verbatim 复制(预防 awk 边界 + 字符替换 bug,p3.6+p3.7 教训)✓

// ════════════════════════════════════════════════════════════════════
// ── D1.a 停战 helpers + accept/reject peace (v181 L9591-L9667) ──
// ════════════════════════════════════════════════════════════════════

function _clearSiegeOnPeace(fid1, fid2){
  G.units.forEach(u => {
    if(u.status !== 'siege' || !u.siegeTarget) return;
    const targetCity = G.cities[u.siegeTarget];
    if(!targetCity) return;
    // fid1的部队围着fid2的城，或fid2的部队围着fid1的城
    if((u.fac === fid1 && targetCity.fac === fid2) ||
       (u.fac === fid2 && targetCity.fac === fid1)){
      u.status = 'halt';
      u.siegeTarget = null;
      u._siegeTurnCount = 0;
      const gname = u.squads[0]?.genName || '?';
      log(`🕊 ${gname}部 解除围城（停战生效）`, 'diplo');
    }
  });
  // 清理被围城市的siegeDecay
  Object.values(G.cities).forEach(city => {
    if(!city.siegeDecay || city.siegeDecay <= 0) return;
    const hasSieger = G.units.some(u => u.status === 'siege' && u.siegeTarget === city.id);
    if(!hasSieger) city.siegeDecay = 0;
  });
}

function acceptPeaceOffer(from){
  // ★ v179fix P15c: 玩家接受 AI 求和——此前 mutation 已推迟到这里
  _applyPeaceAgreement(G.playerFac, from);
  log(`🕊 接受${FAC[from]?.name}求和，双方停战`, 'diplo');
  closeModal();
  renderRight();
  _checkPendingCourtAfterPopup(); // ★ I3
}

function rejectPeaceOffer(from){
  // ★ v179fix P15c: 仅 -5 rel，不再 rollback（mutation 已推迟，没有什么可回滚）
  addDiplo(G.playerFac, from, -5);
  // D-105 trial 3 P2 fix (codex catch): 玩家拒绝时 AI 退 700 金 (跟 aiDoDiplo otherWill 不通过 / _execDiploArmistice 失败一致, 避免 AI 被白扣 1000 金)
  if(G.factions[from]) G.factions[from].res.gold = (G.factions[from].res.gold || 0) + 700;
  log(`❌ 拒绝${FAC[from]?.name}求和，战争继续`, 'diplo');
  closeModal();
  _checkPendingCourtAfterPopup(); // ★ I3
}

/** ★ v179fix P15c: 停战达成的全部状态变更——单一入口
 *  统一了 4 个停战路径（玩家接受 / 玩家发起 / AI peaceWillingness / Claude AI _execDiploArmistice）的副作用：
 *    - status='neutral'、rel=40、_peaceTurn、CD=15
 *    - 清宣称追踪、清 siege 状态
 *    - 诸葛瑾"缓颊"加成（技能描述："所有外交行为"，过去只玩家路径生效）
 *    - truce 事件（ethos 鸽派+3 鹰派-2，过去只玩家路径触发）
 *  调用方负责 log（因为各路径文案不同：玩家"接受"/"达成"/[AI]/AI间）。 */
function _applyPeaceAgreement(fidA, fidB){
  if(!fidA || !fidB || fidA === fidB) return;
  const dAB = G.diplo[`${fidA}-${fidB}`];
  const dBA = G.diplo[`${fidB}-${fidA}`];
  if(dAB) dAB.status = 'neutral';
  if(dBA) dBA.status = 'neutral';
  // 诸葛瑾缓颊：在 fidA 或 fidB 任一方当官并属于该方，停战后好感 +5
  let zhugeJinBonus = 0;
  if(hasFacGen(fidA, '诸葛瑾') && genHasOffice('诸葛瑾', fidA)) zhugeJinBonus = 5;
  else if(hasFacGen(fidB, '诸葛瑾') && genHasOffice('诸葛瑾', fidB)) zhugeJinBonus = 5;
  [`${fidA}-${fidB}`, `${fidB}-${fidA}`].forEach(key => {
    if(G.diplo[key]){
      G.diplo[key].rel = 40 + zhugeJinBonus;
      G.diplo[key]._peaceTurn = G.turn; // C3 停战时间戳
    }
  });
  // 双方CD = 15旬
  G[`_diploCD_${fidA}_${fidB}`] = 15;
  G[`_diploCD_${fidB}_${fidA}`] = 15;
  // 清宣称追踪
  [`${fidA}-${fidB}`, `${fidB}-${fidA}`].forEach(k => {
    if(G._warClaimStrength) delete G._warClaimStrength[k];
    if(G._claimGentryHook) delete G._claimGentryHook[k];
  });
  // 清 siege 状态（双方都清，避免部队卡 siege）
  _clearSiegeOnPeace(fidA, fidB);
  // truce 事件：双方各自的 ethos 鸽派+3 鹰派-2
  if(ALL_FACS.includes(fidA)) triggerFactionEvent('truce', fidA, {});
  if(ALL_FACS.includes(fidB)) triggerFactionEvent('truce', fidB, {});
}

// ════════════════════════════════════════════════════════════════════
// ── D1.b 玩家外交动作 + 实力计算 (v181 L9732-L10015) ──
// ════════════════════════════════════════════════════════════════════

function _diploActed(target){
  const k=`${G.playerFac}-${target}`;
  if(!G.diplo[k]) return false;
  return !!G.diplo[k]._actedThisTurn;
}
function _diploMarkActed(target){
  const k=`${G.playerFac}-${target}`;
  if(G.diplo[k]) G.diplo[k]._actedThisTurn=true;
}

function diploGift(target, level){
  if(_diploActed(target)){ log('⚠ 本旬已行动，不可再次外交','diplo'); return; }
  const costs={1:500,2:1000,3:2000};
  const baseGains={1:5,2:10,3:18};
  const cost=costs[level]||500;
  const fac=G.factions[G.playerFac];
  if(!fac||fac.res.gold<cost){ log('⚠ 金钱不足，无法送礼','diplo'); return; }
  // C3 信誉度修正：rep<60时送礼效果打折
  // ★ D1: 丞相送礼效果buff
  const _geBuff = G.factions[G.playerFac]?._postBuffs?.giftEffect || 0;
  // SKILL_INLINE: tace — 鲁肃榻策：当官时送礼好感+50%
  const _lusuGift = hasFacGen(G.playerFac, '鲁肃') && genHasOffice('鲁肃', G.playerFac) ? 1.5 : 1.0;
  const gain = Math.max(1, Math.round(baseGains[level] * _repGiftMult(G.playerFac) * (1 + _geBuff) * _lusuGift));
  // SKILL_INLINE: huanjia_gift — 诸葛瑾缓颊：当官时外交好感flat+5
  const _zhugeJinGift = hasFacGen(G.playerFac,'诸葛瑾') && genHasOffice('诸葛瑾',G.playerFac) ? 5 : 0;
  const gainFinal = gain + _zhugeJinGift;
  safeSub(fac.res, 'gold', cost);
  addDiplo(G.playerFac,target,gainFinal);
  _diploMarkActed(target);
  const lvLabel=['','小礼','厚礼','重礼'][level];
  const repNote = gainFinal < baseGains[level] ? `（声誉低折扣）` : '';
  log(`🎁 遣使送${lvLabel}予${FAC[target]?.name}，友好度+${gainFinal}${repNote}`,'diplo');
  renderRight();
}

function diploArmistice(target){
  if(_diploActed(target)){ log('⚠ 本旬已行动，不可再次外交','diplo'); return; }
  const k=`${G.playerFac}-${target}`, d=G.diplo[k];
  if(!d||d.status!=='enemy'){ log('⚠ 仅可向敌对势力申请停战','diplo'); return; }
  const fac=G.factions[G.playerFac];
  if(!fac||fac.res.gold<1000){ log('⚠ 金钱不足（需1000）','diplo'); return; }
  safeSub(fac.res, 'gold', 1000);
  _diploMarkActed(target);
  // 接受率 = 对方的议和意愿（对方越弱越想和平）- C3信誉度惩罚
  // SKILL_INLINE: shiwu_armistice — 邓芝使吴：当官时外交成功率+5%
  const _dengzhiBuff = hasFacGen(G.playerFac, '邓芝') && genHasOffice('邓芝', G.playerFac) ? 0.05 : 0;
  const acceptRate = Math.max(0.05, peaceWillingness(target, G.playerFac) - _repPenaltyFactor(G.playerFac) + _dengzhiBuff);
  if(Math.random() < acceptRate){
    // ★ v179fix P15c: 停战成功，全部副作用走 helper
    _applyPeaceAgreement(G.playerFac, target);
    log(`🕊 与${FAC[target]?.name}达成停战协议，转为中立`,'diplo');
  } else {
    // 停战失败：退700金，稍微改善关系
    fac.res.gold+=700;
    const _hjFail = hasFacGen(G.playerFac,'诸葛瑾') && genHasOffice('诸葛瑾',G.playerFac) ? 5 : 0;
    addDiplo(G.playerFac,target,3 + _hjFail);
    log(`❌ ${FAC[target]?.name}拒绝停战，退还700金（关系小幅改善）`,'diplo');
  }
  renderRight();
}

function diploAlly(target){
  if(_diploActed(target)){ log('⚠ 本旬已行动，不可再次外交','diplo'); return; }
  const k=`${G.playerFac}-${target}`, d=G.diplo[k];
  if(!d||d.status!=='neutral'){ log('⚠ 仅可与中立势力结盟','diplo'); return; }
  if(d.rel<75){ log('⚠ 关系尚浅，对方不接受结盟（需≥75）','diplo'); return; }
  const fac=G.factions[G.playerFac];
  if(!fac||fac.res.gold<500){ log('⚠ 金钱不足（需500）','diplo'); return; }
  safeSub(fac.res, 'gold', 500);
  _diploMarkActed(target);
  // 结盟接受率 = 对方议和意愿 × 0.6（结盟门槛更高）- C3信誉度惩罚
  // SKILL_INLINE: shiwu_ally — 邓芝使吴：当官时外交成功率+5%
  const _dengzhiBuff2 = hasFacGen(G.playerFac, '邓芝') && genHasOffice('邓芝', G.playerFac) ? 0.05 : 0;
  const acceptRate = Math.max(0.02, peaceWillingness(target, G.playerFac) * 0.6 - _repPenaltyFactor(G.playerFac) + _dengzhiBuff2);
  if(Math.random() < acceptRate){
    d.status='ally';
    const rev=G.diplo[`${target}-${G.playerFac}`];
    if(rev) rev.status='ally';
    // SKILL_INLINE: huanjia_ally — 诸葛瑾缓颊：结盟后好感+5
    if(hasFacGen(G.playerFac,'诸葛瑾') && genHasOffice('诸葛瑾',G.playerFac)){
      addDiplo(G.playerFac,target,5);
    }
    log(`🤝 与${FAC[target]?.name}正式结盟！`,'diplo');
    applyEthosShock(G.playerFac, 'strategy', -2, '结盟'); // ★ v151
    // ★ B1 结盟=停战（鸽派+3，鹰派-2）
    if(ALL_FACS.includes(G.playerFac)) triggerFactionEvent('truce', G.playerFac, {});
    // D-131 fix: 接口完整性 — 双向触发 truce（避免单向漏 target 派系激活）
    if(ALL_FACS.includes(target)) triggerFactionEvent('truce', target, {});
  } else {
    const _hjAllyFail = hasFacGen(G.playerFac,'诸葛瑾') && genHasOffice('诸葛瑾',G.playerFac) ? 5 : 0;
    addDiplo(G.playerFac,target,2 + _hjAllyFail);
    log(`❌ ${FAC[target]?.name}暂不接受结盟，关系小幅改善`,'diplo');
  }
  renderRight();
}

/** ★ C3 UI: 玩家开始准备宣称 */
function startClaimPrepUI(target, claimType){
  startClaimPrep(G.playerFac, target, claimType);
  const ct = CLAIM_TYPES[claimType];
  if(ct?.prepTime === 0){
    log(`📜 【${ct.label}】即刻可用`, 'diplo');
  } else {
    log(`📜 开始准备【${ct?.label||'?'}】宣称（需${ct?.prepTime||'?'}旬）`, 'diplo');
  }
  renderRight();
}

/** ★ C3 UI: 玩家称帝 */
function playerEnthrone(){
  if(!canEnthrone(G.playerFac)){ log('⚠ 称帝条件不足','diplo'); return; }
  // 简易确认（后续可改为弹窗）
  if(!confirm(`确定要称帝吗？\n\n效果：\n• 身份→皇帝，解锁全对象强宣称\n• 天子概念消亡\n• 第三方关系-15/-25\n• 信誉+10\n• 派系影响取决于当前身份`)) return;
  doEnthrone(G.playerFac);
  renderRight();
  renderAll();
}

function diploBreakAlliance(target){
  if(_diploActed(target)){ log('⚠ 本旬已行动，不可再次外交','diplo'); return; }
  const k=`${G.playerFac}-${target}`, d=G.diplo[k];
  if(!d||d.status!=='ally'){ log('⚠ 仅可解除与盟友的盟约','diplo'); return; }
  // ally → neutral，关系受损
  d.status='neutral';
  const rev=G.diplo[`${target}-${G.playerFac}`];
  if(rev) rev.status='neutral';
  addDiplo(G.playerFac,target,-20);
  // 记录解盟旬数（为信誉度系统预留：6旬内宣战=背刺）
  [`${G.playerFac}-${target}`,`${target}-${G.playerFac}`].forEach(key=>{
    if(G.diplo[key]) G.diplo[key]._brokenAllyTurn = G.turn;
  });
  _diploMarkActed(target);
  log(`💔 解除与${FAC[target]?.name}的盟约，关系转为中立`,'diplo');
  renderRight();
}

function diploWar(target, claimType){
  if(_diploActed(target)){ log('⚠ 本旬已行动，不可再次外交','diplo'); return; }
  const k=`${G.playerFac}-${target}`, d=G.diplo[k];
  if(!d||d.status!=='neutral'){ log('⚠ 仅可向中立势力宣战','diplo'); return; }
  d.status='enemy';
  d._warDeclaredTurn = G.turn; // ★ v123: 宣战当旬记录
  if(G.diplo[`${target}-${G.playerFac}`]) {
    G.diplo[`${target}-${G.playerFac}`].status='enemy';
    G.diplo[`${target}-${G.playerFac}`]._warDeclaredTurn = G.turn;
  }
  // D-093 fix: 玩家 diploWar 数值 -20 → -15 (对齐 _execDeclareWar L477 / aiDoDiplo L718 / checkDiplo D-117c L1471 三入口, 统一三入口宣战 rel 衰减)
  addDiplo(G.playerFac,target,-15);
  // C3 背刺检测：解盟6旬内宣战
  if(d._brokenAllyTurn != null && (G.turn - d._brokenAllyTurn) <= 6){
    d._betrayal = true;
    if(G.diplo[`${target}-${G.playerFac}`]) G.diplo[`${target}-${G.playerFac}`]._betrayal = true;
    applyReputationPenalty(G.playerFac, 'betray');
    if(ALL_FACS.includes(G.playerFac)) triggerFactionEvent('betray', G.playerFac, {});
  }
  // C3 反复检测：停战3旬内宣战
  if(d._peaceTurn != null && (G.turn - d._peaceTurn) <= 3){
    applyReputationPenalty(G.playerFac, 'relapse');
  }
  _diploMarkActed(target);
  // D-092 fix: 玩家 diploWar 也写 _diploCD 双向 15 (对齐 _execDeclareWar L478 / aiDoDiplo L719 / checkDiplo D-117c L1471 三入口); 倒计时模式跟原系统一致 (D-114 改 Claude AI 接管入口打补丁衰减, 保留老存档兼容)
  G[`_diploCD_${G.playerFac}_${target}`] = 15;
  G[`_diploCD_${target}_${G.playerFac}`] = 15;
  _syncAllyWarStatus(G.playerFac, target);
  // ★ C3: 宣称效果结算（替代旧的固定鹰鸽事件）
  applyWarDeclarationEffects(G.playerFac, target, claimType || null);
  // D-049/D-131 fix: 真正宣战路径触发 warDeclare 派系事件（接口完整性不变量）
  if(ALL_FACS.includes(G.playerFac)) triggerFactionEvent('warDeclare', G.playerFac, {});
  const ct = claimType ? CLAIM_TYPES[claimType] : null;
  const claimLabel = ct ? `以【${ct.label}】` : '无名';
  log(`⚔️ ${claimLabel}向${FAC[target]?.name}宣战！`,'diplo');
  renderRight();
}

// ════════════════════════════
// 外交指令执行（参数化版，不依赖G.playerFac）
// 本节起源:v181 L13577-L13630(batch-19.1 抽离 _execDeclareWar / _execProposeAlliance, D-049/D-131 prep)
// _exec 归位架构债 sprint 整体推进时,剩 12 个外交 _exec 将集中迁入此节
// ════════════════════════════

function _execDeclareWar(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  const k = `${fid}-${target}`, d = G.diplo[k];
  if (!d || d.status !== 'neutral') return false;
  // CD检查
  const cdKey = `_diploCD_${fid}_${target}`;
  if (G[cdKey] && G[cdKey] > 0) return false;
  // 宣称
  const claimType = act.claim || null;
  d.status = 'enemy'; d._warDeclaredTurn = G.turn;
  const rev = G.diplo[`${target}-${fid}`];
  if (rev) { rev.status = 'enemy'; rev._warDeclaredTurn = G.turn; }
  addDiplo(fid, target, -15);
  G[cdKey] = 15;
  // 背刺/反复检测
  if (d._brokenAllyTurn != null && (G.turn - d._brokenAllyTurn) <= 6) {
    d._betrayal = true; if (rev) rev._betrayal = true;
    applyReputationPenalty(fid, 'betray');
    // D-131 fix: _execDeclareWar 漏 betray 派系事件（diploWar L431 / aiDoDiplo L647 同模式）
    if(ALL_FACS.includes(fid)) triggerFactionEvent('betray', fid, {});
  }
  if (d._peaceTurn != null && (G.turn - d._peaceTurn) <= 3) applyReputationPenalty(fid, 'relapse');
  applyWarDeclarationEffects(fid, target, claimType);
  _syncAllyWarStatus(fid, target);
  // D-049/D-131 fix: 真正宣战路径触发 warDeclare 派系事件（接口完整性不变量）
  if(ALL_FACS.includes(fid)) triggerFactionEvent('warDeclare', fid, {});
  // D-095/D-122 fix: 删重复 ethosShock 'strategy' +6 — applyWarDeclarationEffects:1319 内部已调一次, 此处删避免双计 strategy +12
  const ct = claimType ? CLAIM_TYPES[claimType] : null;
  const claimLabel = ct ? `以【${ct.label}】` : '';
  log(`⚔️ [AI] ${FAC[fid]?.name}${claimLabel}向${FAC[target]?.name}宣战！`, 'diplo');
  _recordWarJournal(fid, `向${FAC[target]?.name}宣战${claimLabel}`); // ★ v159fix
  return true;
}

function _execProposeAlliance(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  const k = `${fid}-${target}`, d = G.diplo[k];
  if (!d || d.status !== 'neutral') return false;
  if (d.rel < 75) return false;
  // D-096 fix: CD 检查 (避免一旬反复尝试结盟); 倒计时模式跟 _execDeclareWar L471 / aiDoDiplo L658 一致
  const cdKey = `_diploCD_${fid}_${target}`;
  if (G[cdKey] && G[cdKey] > 0) return false;
  const fac = G.factions[fid];
  if (fac.res.gold < 500) return false;
  safeSub(fac.res, 'gold', 500);
  const acceptRate = Math.max(0.02, peaceWillingness(target, fid) * 0.6 - _repPenaltyFactor(fid));
  if (Math.random() < acceptRate) {
    d.status = 'ally';
    const rev = G.diplo[`${target}-${fid}`];
    if (rev) rev.status = 'ally';
    log(`🤝 [AI] ${FAC[fid]?.name}与${FAC[target]?.name}结盟！`, 'diplo');
    applyEthosShock(fid, 'strategy', -2, '结盟');
    // D-131 fix: _execProposeAlliance 成功结盟漏 truce 派系事件（_applyPeaceAgreement L273-274 双向模板）
    if(ALL_FACS.includes(fid)) triggerFactionEvent('truce', fid, {});
    if(ALL_FACS.includes(target)) triggerFactionEvent('truce', target, {});
  } else {
    fac.res.gold += 250;
    addDiplo(fid, target, 2);
    // D-096 fix: 失败设 5 旬 CD (避免本旬反复尝试; 5 旬轻于宣战 15 旬, 跟 _execProposeAlliance 二次成本 250 金 + rel +2 性质相符); 倒计时模式
    G[cdKey] = 5;
    log(`❌ [AI] ${FAC[target]?.name}暂不接受${FAC[fid]?.name}的结盟请求`, 'diplo');
  }
  return true;
}

// ── 外交辅助：双向更新友好度 ──

/** 势力战力指数（兵力+金钱+城市规模） */
function powerIndex(fid){
  const fac = G.factions[fid];
  if(!fac) return 1;
  const troopScore = G.units.filter(u=>u.fac===fid).reduce((s,u)=>s+getUnitTroops(u),0);
  const goldScore  = (fac.res?.gold||0) / 500;
  const cityScore  = Object.values(G.cities).filter(c=>c.fac===fid).length * 2000;
  return Math.max(1, troopScore + goldScore + cityScore);
}

/** C4: AI对他国实力的估算（基于迷雾视野）
 *  viewerFid评估targetFid时：只计可见部队兵力+已知城市数×默认估值 */
function fogPowerEstimate(viewerFid, targetFid) {
  if (viewerFid === targetFid) return powerIndex(targetFid); // 自己的实力完全知道
  if (canSeeFactionData(viewerFid, targetFid)) return powerIndex(targetFid); // 盟友/附庸完全知道
  const vFog = G.fog?.[viewerFid];
  if (!vFog) return powerIndex(targetFid); // 无迷雾数据时退化为全知
  // 统计可见的敌方部队兵力
  let visibleTroops = 0;
  G.units.filter(u => u.fac === targetFid).forEach(u => {
    const fogLv = vFog[hkey(u.hq??0, u.hr??0)] ?? FOG_UNEXPLORED;
    if (fogLv === FOG_VISIBLE) visibleTroops += getUnitTroops(u);
  });
  // 已知城市数
  const knownCities = getKnownCityCount(viewerFid, targetFid);
  // 每个已知城市估算2000（城市本身）+ 2000（潜在驻军/城防估值）
  const cityEstimate = knownCities * 4000;
  // 可见部队按1.3倍估算（假设看不到的比看到的多）
  return Math.max(1, visibleTroops * 1.3 + cityEstimate);
}

/** 议和意愿（越弱越想和平，rel越好越容易接受）
 *  返回 0~1，用于：AI求和触发、玩家申请停战接受率、结盟接受率 */
function alliedFacs(fid){
  return ALL_FACS.filter(other=>{
    if(other===fid) return false;
    const d = G.diplo[`${fid}-${other}`];
    return d && (d.status==='ally' || d.status==='vassal');
  });
}

/** 辅助：fid 是否为 other 的宗主 */
function isSuzerain(fid, other){
  const d = G.diplo[`${other}-${fid}`];
  return !!(d && d.status==='vassal' && d.suzerain===fid);
}
/** 辅助：fid 是否为附庸（有宗主） */
function isVassal(fid){
  return ALL_FACS.some(other=>{
    const d = G.diplo[`${fid}-${other}`];
    return d && d.status==='vassal' && d.suzerain===other;
  });
}
/** 获取 fid 的宗主（无则 null） */
function getSuzerain(fid){
  for(const other of ALL_FACS){
    if(other===fid) continue;
    const d = G.diplo[`${fid}-${other}`];
    if(d && d.status==='vassal' && d.suzerain===other) return other;
  }
  return null;
}
/** 获取 fid 的所有附庸列表 */
/** 考虑同盟联合战力的对比（盟友战力×0.5折算） */
function effectivePowerAgainst(selfFid, targetFid){
  const selfAllies   = alliedFacs(selfFid);
  const targetAllies = alliedFacs(targetFid);
  // C4: 自己和盟友的实力完全知道，对手的实力用迷雾估算
  const selfPow   = powerIndex(selfFid)
                  + selfAllies.reduce((s,f)=>s+powerIndex(f), 0);
  const targetPow = fogPowerEstimate(selfFid, targetFid)
                  + targetAllies.reduce((s,f)=>s+fogPowerEstimate(selfFid, f)*0.5, 0);
  return { selfPow, targetPow };
}

function peaceWillingness(selfFid, otherFid){
  const { selfPow: sp, targetPow: op } = effectivePowerAgainst(selfFid, otherFid);
  const powerRatio = sp / (sp + op); // 0~1，0.5=势均力敌
  // powerRatio=0.5时baseWill=0.15; 0.3劣势时=0.63; 0.2极弱时=0.90
  const will = Math.max(0.05, Math.min(0.90, 0.75 - (powerRatio - 0.5) * 1.2));
  return will;
}

/** 宣战时同步盟友外交状态（轻量联动） */
function _syncAllyWarStatus(aggressor, target){
  // alliedFacs 已涵盖 ally + vassal，直接复用
  // 攻方阵营（盟友+附庸） vs 守方：仅 neutral → enemy
  alliedFacs(aggressor).forEach(ally=>{
    const k1 = `${ally}-${target}`, k2 = `${target}-${ally}`;
    if(G.diplo[k1] && G.diplo[k1].status==='neutral'){
      G.diplo[k1].status='enemy';
      G.diplo[k1]._warDeclaredTurn = G.turn; // ★ v123
      if(G.diplo[k2]) { G.diplo[k2].status='enemy'; G.diplo[k2]._warDeclaredTurn = G.turn; }
      addDiplo(ally, target, -15);
      log(`⚔️ ${FAC[ally]?.name}随${FAC[aggressor]?.name}对${FAC[target]?.name}宣战`,'diplo');
    }
    // ally状态：盟友间不因第三方战争自动翻脸，rel受损即可
    else if(G.diplo[k1] && G.diplo[k1].status==='ally'){
      addDiplo(ally, target, -8); // 关系受损但不直接破裂
    }
  });
  // 守方盟友 vs 攻方：仅 neutral → enemy
  alliedFacs(target).forEach(ally=>{
    const k1 = `${ally}-${aggressor}`, k2 = `${aggressor}-${ally}`;
    if(G.diplo[k1] && G.diplo[k1].status==='neutral'){
      G.diplo[k1].status='enemy';
      G.diplo[k1]._warDeclaredTurn = G.turn; // ★ v123
      if(G.diplo[k2]) { G.diplo[k2].status='enemy'; G.diplo[k2]._warDeclaredTurn = G.turn; }
      addDiplo(ally, aggressor, -15);
      log(`⚔️ ${FAC[ally]?.name}随${FAC[target]?.name}对${FAC[aggressor]?.name}宣战`,'diplo');
    }
    else if(G.diplo[k1] && G.diplo[k1].status==='ally'){
      addDiplo(ally, aggressor, -8);
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// ── D2 AI 外交决策 aiDoDiplo (v181 L10018-L10160) ──
// ════════════════════════════════════════════════════════════════════

/** D-114 fix: Claude AI 接管时跳过 aiDoDiplo, 但 _diploCD 仍需衰减;
 *  单独 helper 跟 aiDoDiplo L658 衰减逻辑同步, tick.js Claude AI 成功路径调用.
 *  保留倒计时模式 (= N 非 G.turn + N) 老存档兼容. */
function _decayDiploCDForFac(fid){
  ALL_FACS.forEach(other => {
    if(other === fid) return;
    const cdKey = `_diploCD_${fid}_${other}`;
    if(G[cdKey] && G[cdKey] > 0) G[cdKey]--;
  });
}

function aiDoDiplo(fid){
  const others = ALL_FACS.filter(f=>f!==fid);
  others.forEach(other=>{
    const k = `${fid}-${other}`;
    const d = G.diplo[k];
    if(!d) return;

    // CD检查
    const cdKey = `_diploCD_${fid}_${other}`;
    if(G[cdKey] && G[cdKey] > 0){ G[cdKey]--; return; }

    if(d.status === 'neutral'){
      // ★ C3: AI宣称评估 + 宣战判定
      const baseAggrWill = 1.0 - peaceWillingness(fid, other);
      // ★ B4: 外交攻击性人格（曹操×1.6，刘备×0.6，孙权×1.0）
      const _p = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
      // ★ v152: strategy越高(扩张)→宣战意愿越强，ethosDistance远→额外+10%
      const _eth = G.factions[fid]?.ethos;
      const _strategyBoost = _eth ? (_eth.strategy / 100) * 0.15 : 0;
      const _eDistBoost = _ethosDistance(fid, other) > 50 ? 0.10 : 0;
      const aggrWill = Math.min(0.95, (baseAggrWill + _strategyBoost + _eDistBoost) * (_p.diploAggro / 0.5));
      // ★ C3修正：有就绪宣称时放宽rel阈值（从30→45），有即时宣称(prep=0)同理
      const claims = getAvailableClaims(fid, other);
      const readyClaim = getReadyClaim(fid, other);
      const hasInstantClaim = claims.some(c => c.prepTime === 0);
      const relThreshold = (readyClaim || hasInstantClaim) ? 45 : 30;
      if(d.rel <= relThreshold && Math.random() < aggrWill){
        // 使用外部已获取的claims和readyClaim
        const bestClaim = [...claims].sort((a,b) => {
          const ord = {strong:3,medium:2,weak:1}; return (ord[b.strength]||0)-(ord[a.strength]||0);
        })[0] || null;

        // AI无宣称时根据信誉决定是否宣战
        let proceedWithWar = true;
        let usedClaimType = null;
        if(readyClaim){
          usedClaimType = readyClaim.type;
        } else if(bestClaim && bestClaim.prepTime === 0){
          usedClaimType = bestClaim.id; // 即时宣称（奉旨讨逆）
        } else if(bestClaim && !readyClaim){
          // 有可用宣称但未准备→开始准备，本旬不宣战
          startClaimPrep(fid, other, bestClaim.id);
          proceedWithWar = false;
        } else {
          // 无宣称：根据信誉决定
          // ★ B4: diploAggro越高越不在乎廉耻（曹操×0.2，刘备×0.7）
          const rep = G.reputation?.[fid] ?? REPUTATION_DEFAULT;
          const shameFactor = 1.0 - (_p.diploAggro || 0.5);
          if(rep < 30 && Math.random() < 0.80 * shameFactor) proceedWithWar = false;
          else if(rep < 60 && Math.random() < 0.50 * shameFactor) proceedWithWar = false;
        }
        // ★ C3: 曹操对刘备用奉旨讨逆：如果汉室死忠占比>15%，降级
        if(usedClaimType === 'imperial_decree' && getFactionIdentity(other)?.type === 'han_royal'){
          const inf = calcFactionInfluence(fid);
          const hanLoyal = (G.generals[fid]||[]).filter(g => {
            const m = getGenMeta(g.name); return (m.values||[]).includes('汉室死忠');
          });
          const hanRatio = hanLoyal.length / Math.max(1,(G.generals[fid]||[]).length);
          if(hanRatio > 0.15){
            const weaker = claims.find(c=>c.strength!=='strong');
            usedClaimType = weaker ? weaker.id : null; // 降级
          }
        }

        if(proceedWithWar){
          d.status = 'enemy';
          d._warDeclaredTurn = G.turn; // ★ v123
          const rev = G.diplo[`${other}-${fid}`];
          if(rev) { rev.status = 'enemy'; rev._warDeclaredTurn = G.turn; }
          addDiplo(fid, other, -15);
          G[cdKey] = 15; // ★ v133: 10→15旬 减缓外交节奏
          // 背刺/反复检测
          if(d._brokenAllyTurn != null && (G.turn - d._brokenAllyTurn) <= 6){
            d._betrayal = true;
            if(G.diplo[`${other}-${fid}`]) G.diplo[`${other}-${fid}`]._betrayal = true;
            applyReputationPenalty(fid, 'betray');
            // D-048 fix: AI 主动背刺也触发 betray 派系事件（与玩家 diploWar L431 对称）
            if(ALL_FACS.includes(fid)) triggerFactionEvent('betray', fid, {});
          }
          if(d._peaceTurn != null && (G.turn - d._peaceTurn) <= 3){
            applyReputationPenalty(fid, 'relapse');
          }
          // ★ C3: 宣称效果结算
          applyWarDeclarationEffects(fid, other, usedClaimType);
          // D-049/D-131 fix: 真正宣战路径触发 warDeclare 派系事件（接口完整性不变量）
          if(ALL_FACS.includes(fid)) triggerFactionEvent('warDeclare', fid, {});
          const ct = usedClaimType ? CLAIM_TYPES[usedClaimType] : null;
          const claimLabel = ct ? `以【${ct.label}】` : '';
          const isPlayerInvolved = fid===G.playerFac || other===G.playerFac;
          if(isPlayerInvolved){
            log(`⚔️ ${FAC[fid]?.name}${claimLabel}向${FAC[other]?.name}宣战！`,'diplo');
          } else {
            log(`⚔️ ${FAC[fid]?.name}${claimLabel}与${FAC[other]?.name}爆发战争`,'diplo');
          }
          _syncAllyWarStatus(fid, other);
          // D-095/D-122 fix: 删重复 ethosShock 'strategy' +6 — applyWarDeclarationEffects:1319 内部已调一次, 此处删避免双计 strategy +12
          // mandate 维度的 strong/weak/none 强度差异是本路径独有 (与 _execDeclareWar / 玩家 diploWar 不同), applyWarDeclarationEffects 内不分 strength → 保留
          if(ct){
            if(ct.strength === 'strong') applyEthosShock(fid, 'mandate', -5, '正义宣称');
            else if(ct.strength === 'weak') applyEthosShock(fid, 'mandate', 3, '弱宣称开战');
          } else { applyEthosShock(fid, 'mandate', 4, '无宣称开战'); }
        }
      } else {
        // 宣战未触发时，检查称臣：极度劣势时主动投靠（powerIndex<对方15%）
        if(!isVassal(fid) && !isVassal(other)){
          const myPow = powerIndex(fid), theirPow = powerIndex(other);
          if(myPow < theirPow * 0.15 && d.rel >= 20 && Math.random() < 0.35){
            // D-104 fix: 玩家介入(交互模式)时只设 _pendingVassalOffer，等玩家选择再 mutate（v179fix P15c 平行 bug 推广）
            // 注: _fastForward 时玩家 fac 托管 AI，走立即 mutate（与 fix 前等价，弹窗在快进期不响应）
            if(fid===G.playerFac && !_fastForward){
              _pendingVassalOffer = { vassal:fid, suzerain:other, type:'aiForced' };
            } else if(other===G.playerFac && !_fastForward){
              _pendingVassalOffer = { vassal:fid, suzerain:other, type:'aiSubmit' };
            } else {
              // AI vs AI（或 _fastForward 时玩家 fac 托管 AI）无玩家介入，直接生效
              _setVassalStatus(fid, other); // ★ v144: 统一入口，处理冲突
              // ★ v179fix P18: 双向 CD，宗主下旬可立即反向发起外交动作
              G[`_diploCD_${fid}_${other}`] = 10;
              G[`_diploCD_${other}_${fid}`] = 10;
              log(`🏳 ${FAC[fid]?.name}向${FAC[other]?.name}称臣，纳入附庸`,'diplo');
            }
          }
        }
      }
    } else if(d.status === 'enemy'){
      // 求和判定
      const will = peaceWillingness(fid, other);
      // ★ B4: 外交攻击性越高，越不愿意求和（曹操0.89，刘备0.74，孙权0.80）
      const _pPeace = AI_PERSONALITY[fid] || AI_PERSONALITY.wei;
      // ★ v152: strategy越高(扩张)→求和门槛越高(越不愿和)
      const _ethPeace = G.factions[fid]?.ethos;
      const _stratPeaceBonus = _ethPeace ? (_ethPeace.strategy / 100) * 0.08 : 0;
      const peaceThreshold = 0.80 + ((_pPeace.diploAggro || 0.5) - 0.5) * 0.30 + _stratPeaceBonus;
      if(will >= peaceThreshold){
        const fac = G.factions[fid];
        // D-105 fix: AI 求和加 1000 金校验 + 扣款 (对齐玩家 startArmistice L329 / Claude AI _execDiploArmistice L1787 模式)
        // D-105 trial 2 P2 fix (codex catch): _pendingPeaceOffer 是单 slot, 同旬多 AI 求玩家时后者覆盖前者. 改 guard: 若 other===playerFac 且 slot 已占用, 本旬本势力跳过 (不扣钱不发起), 让现有 pending 优先处理
        if(other === G.playerFac && _pendingPeaceOffer) return;
        if(fac.res.gold < 1000) return; // 钱不够不发起求和
        safeSub(fac.res, 'gold', 1000);
        const otherWill = peaceWillingness(other, fid);
        // 双方都有一定意愿才能达成（避免单方面乞和被忽视）
        if(Math.random() < otherWill * 0.8){
          // ★ v179fix P15c: 玩家介入则推迟 mutation 到玩家选择后；其他情况直接走 helper
          if(other === G.playerFac){
            // AI(fid) 向玩家求和——只设 pending，等玩家点接受/拒绝再决定
            _pendingPeaceOffer = { from: fid, to: other };
          } else {
            _applyPeaceAgreement(fid, other);
            log(`🕊 ${FAC[fid]?.name}与${FAC[other]?.name}达成停战协议`,'diplo');
          }
        } else {
          // D-105 fix: 求和被拒, 退 700 金 + rel+3 (对齐 _execDiploArmistice L1795-L1796)
          fac.res.gold += 700;
          addDiplo(fid, other, 3);
        }
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// ── D3.a 计谋 strategy + scout (v181 L10245-L10428) ──
// ════════════════════════════════════════════════════════════════════

function _strategyRate(fid, baseRate){
  const int_ = getStrategistInt(fid);
  // ★ D1: 丞相计谋成功率buff
  const _srBuff = G.factions[fid]?._postBuffs?.stratRate || 0;
  // SKILL_INLINE: fengchu_rate — 庞统凤雏：同旬第2计起成功率+20%/次叠加（per-faction计数）
  if(!G._factionSchemeCount) G._factionSchemeCount = {};
  const _facCount = G._factionSchemeCount[fid] || 0;
  const _pangtongBuff = (hasFacGen(fid, '庞统') && genHasOffice('庞统', fid) && _facCount >= 1)
    ? 0.20 * _facCount : 0;
  // SKILL_INLINE: fengchu_count — 庞统凤雏：每次用计递增本势力计数
  G._factionSchemeCount[fid] = _facCount + 1;
  // SKILL_INLINE: qice — 荀攸·奇策：当官时用计成功率+8%
  const _xunyouBuff = (hasFacGen(fid, '荀攸') && genHasOffice('荀攸', fid)) ? 0.08 : 0;
  return Math.max(0.05, Math.min(0.95, baseRate + Math.max(-0.15, Math.min(0.15, (int_-60)/100*0.5)) + _srBuff + _pangtongBuff + _xunyouBuff));
}

// ── 计谋：驱虎吞狼（强制A向B宣战）──
function stratDriveWolf(targetA, targetB){
  const fid = G.playerFac;
  if(!G.strategyCD[fid]) return;
  if(G.strategyCD[fid].driveWolf > 0){ log(`⚠ 驱虎吞狼冷却中（剩${G.strategyCD[fid].driveWolf}旬）`,'diplo'); return; }
  const fac = G.factions[fid];
  if(!fac||fac.res.gold<1500){ log('⚠ 金币不足（需1500）','diplo'); return; }
  if(targetA===fid||targetB===fid||targetA===targetB){ log('⚠ 目标无效','diplo'); return; }
  safeSub(fac.res, 'gold', 1500);
  const rate = _strategyRate(fid, 0.20);
  if(Math.random()<rate){
    const kAB = `${targetA}-${targetB}`, kBA = `${targetB}-${targetA}`;
    if(G.diplo[kAB]&&G.diplo[kAB].status!=='enemy'){
      G.diplo[kAB].status='enemy'; G.diplo[kAB]._warDeclaredTurn=G.turn; if(G.diplo[kBA]) { G.diplo[kBA].status='enemy'; G.diplo[kBA]._warDeclaredTurn=G.turn; }
      addDiplo(targetA,targetB,-15);
      _syncAllyWarStatus(targetA,targetB);
      log(`🐯 驱虎吞狼！${FAC[targetA]?.name}向${FAC[targetB]?.name}宣战`,'diplo');
    } else { log(`🐯 驱虎吞狼成功，但${FAC[targetA]?.name}与${FAC[targetB]?.name}已是敌对`,'diplo'); }
  } else {
    fac.res.gold += 750; // 失败退半数
    log(`❌ 驱虎吞狼失败，退750金`,'diplo');
  }
  G.strategyCD[fid].driveWolf = 12;
  renderRight();
}

// ── 计谋：二虎竞食（两势力rel -20）──
function stratTwoTigers(targetA, targetB){
  const fid = G.playerFac;
  if(!G.strategyCD[fid]) return;
  if(G.strategyCD[fid].twoTigers > 0){ log(`⚠ 二虎竞食冷却中（剩${G.strategyCD[fid].twoTigers}旬）`,'diplo'); return; }
  const fac = G.factions[fid];
  if(!fac||fac.res.gold<800){ log('⚠ 金币不足（需800）','diplo'); return; }
  if(targetA===fid||targetB===fid||targetA===targetB){ log('⚠ 目标无效','diplo'); return; }
  safeSub(fac.res, 'gold', 800);
  const rate = _strategyRate(fid, 0.50);
  if(Math.random()<rate){
    addDiplo(targetA, targetB, -20);
    log(`⚔️ 二虎竞食！${FAC[targetA]?.name}与${FAC[targetB]?.name}关系 -20`,'diplo');
  } else {
    fac.res.gold += 400;
    log(`❌ 二虎竞食失败，退400金`,'diplo');
  }
  G.strategyCD[fid].twoTigers = 8;
  renderRight();
}

// ── 计谋：反间计（目标势力指定武将忠诚-15）──
function stratSpy(target, genName){
  const fid = G.playerFac;
  if(!G.strategyCD[fid]) return;
  if(G.strategyCD[fid].spy > 0){ log(`⚠ 反间计冷却中（剩${G.strategyCD[fid].spy}旬）`,'diplo'); return; }
  const fac = G.factions[fid];
  if(!fac||fac.res.gold<1200){ log('⚠ 金币不足（需1200）','diplo'); return; }
  if(target===fid){ log('⚠ 目标无效','diplo'); return; }
  safeSub(fac.res, 'gold', 1200);
  // SKILL_INLINE: lijian — 贾诩离间：当官/君主时反间计成功率+20%
  const _jiaxuBuff = hasFacGen(fid, '贾诩') && genHasOffice('贾诩', fid) ? 0.20 : 0;
  const rate = _strategyRate(fid, 0.40 + _jiaxuBuff);
  if(Math.random()<rate){
    const gens = (G.generals[target]||[]).filter(g=>g.role!=='ruler');
    // ★ v116fix: 优先使用指定武将，找不到则随机
    const victim = (genName && gens.find(g=>g.name===genName)) || gens[Math.floor(Math.random()*gens.length)];
    if(victim){
      const oldLoy = G.genLoyalty[victim.name] ?? (victim.loyalty||60);
      G.genLoyalty[victim.name] = Math.max(0, oldLoy - 15);
      if(G.loyaltyAccum) G.loyaltyAccum[victim.name] = G.genLoyalty[victim.name];
      const fled = G.genLoyalty[victim.name] < 10 && Math.random()<0.4;
      if(fled){
        G.generals[target] = (G.generals[target]||[]).filter(g=>g.name!==victim.name);
        log(`🕵 反间计！${FAC[target]?.name} ${victim.name} 忠诚骤降，愤而下野`,'diplo');
      } else {
        log(`🕵 反间计！${FAC[target]?.name} ${victim.name} 忠诚 -15（现${Math.round(G.genLoyalty[victim.name]??0)}）`,'diplo');
      }
    }
  } else {
    fac.res.gold += 600;
    log(`❌ 反间计失败，退600金`,'diplo');
  }
  G.strategyCD[fid].spy = 8;
  renderRight();
}

// ── 计谋：散布谣言（目标城市民心-20）── target: 势力fid；cityId: 指定城市id
function stratRumor(target, cityId){
  const fid = G.playerFac;
  if(!G.strategyCD[fid]) return;
  if(G.strategyCD[fid].rumor > 0){ log(`⚠ 散布谣言冷却中（剩${G.strategyCD[fid].rumor}旬）`,'diplo'); return; }
  const fac = G.factions[fid];
  if(!fac||fac.res.gold<600){ log('⚠ 金币不足（需600）','diplo'); return; }
  if(target===fid){ log('⚠ 目标无效','diplo'); return; }
  const targetCities = Object.values(G.cities).filter(c=>c.fac===target);
  const city = G.cities[cityId] || targetCities.sort((a,b)=>b.pop-a.pop)[0];
  if(!city){ log('⚠ 目标势力无城市','diplo'); return; }
  safeSub(fac.res, 'gold', 600);
  const rate = _strategyRate(fid, 0.45);
  if(Math.random()<rate){
    city.morale = Math.max(0, (city.morale||50) - 20);
    log(`📢 谣言四起！${FAC[target]?.name} ${city.name} 民心 -20（现${Math.round(city.morale)}）`,'diplo');
  } else {
    fac.res.gold += 300;
    log(`❌ 谣言失败，退300金`,'diplo');
  }
  G.strategyCD[fid].rumor = 6;
  renderRight();
}

// ── ★ v116 计谋：细作探报（侦察邻接敌城，3旬可见）──
function stratScout(targetCityId){
  const fid = G.playerFac;
  if(!G.strategyCD[fid]) return;
  if(G.strategyCD[fid].scout > 0){ log(`⚠ 细作探报冷却中（剩${G.strategyCD[fid].scout}旬）`,'diplo'); return; }
  const fac = G.factions[fid];
  // SKILL_INLINE: xiantu — 张松·献图：当官时细作探报花费800→400
  const _zhangsongDiscount = (hasFacGen(fid, '张松') && genHasOffice('张松', fid));
  const _scoutCost = _zhangsongDiscount ? 400 : 800;
  if(!fac||fac.res.gold<_scoutCost){ log(`⚠ 金币不足（需${_scoutCost}）`,'diplo'); return; }
  const targetCity = G.cities[targetCityId];
  if(!targetCity||targetCity.fac===fid){ log('⚠ 目标无效','diplo'); return; }
  // 邻接检查：目标城必须通过ROAD_ADJ与己方城市相连
  const myCities = Object.values(G.cities).filter(c=>c.fac===fid);
  const isAdj = myCities.some(c=>(ROAD_ADJ[c.id]||[]).includes(targetCityId));
  if(!isAdj){ log('⚠ 目标城市不与我方领土邻接','diplo'); return; }
  // 已在侦察中不重复
  if((G.scoutReveals||[]).some(sr=>sr.fid===fid&&sr.cityId===targetCityId&&sr.expiresAt>G.turn)){
    log('⚠ 该城已在侦察中','diplo'); return;
  }
  safeSub(fac.res, 'gold', _scoutCost);
  const rate = _strategyRate(fid, 0.75);
  if(Math.random()<rate){
    if(!G.scoutReveals) G.scoutReveals = [];
    G.scoutReveals.push({fid, cityId:targetCityId, expiresAt:G.turn+3});
    // 立即揭开迷雾
    _applyScoutReveal(fid, targetCityId);
    log(`🔍 细作探报！${targetCity.name}周边情报已获取（持续3旬）`,'diplo');
  } else {
    const _refund = Math.floor(_scoutCost / 2);
    fac.res.gold += _refund;
    log(`❌ 细作探报失败，退${_refund}金`,'diplo');
  }
  G.strategyCD[fid].scout = 6;
  renderRight();
}

/** ★ v116: 应用侦察揭雾——目标城市领地范围设为VISIBLE */
function _applyScoutReveal(fid, cityId){
  const fog = G.fog[fid];
  if(!fog) return;
  const territory = _buildTerritoryMap();
  for(const k in territory){
    if(territory[k].cityId === cityId){
      fog[k] = FOG_VISIBLE;
      if(HEX_CITY[k]){
        const city = G.cities[HEX_CITY[k]];
        if(city){
          if(!G.fogSnap[fid]) G.fogSnap[fid] = {};
          G.fogSnap[fid][HEX_CITY[k]] = {fac:city.fac, turn:G.turn};
        }
      }
    }
  }
}

// ═══════════════════════════════════════
// ★ v164: 互市系统（外交面板 — 资源交易）
// ═══════════════════════════════════════

/** 获取某势力可出售的资源列表（基于其拥有的资源城tag） */

// ════════════════════════════════════════════════════════════════════
// ── D3.b 通使 _buildEnvoyIntel + stratEnvoy (v181 L10491-L10593) ──
// ════════════════════════════════════════════════════════════════════

function _buildEnvoyIntel(fid, targetFid){
  const tFac = G.factions[targetFid];
  if(!tFac) return '使者未能获取有效情报。';
  const tCities = Object.values(G.cities).filter(c=>c.fac===targetFid);
  const tUnits  = G.units.filter(u=>u.fac===targetFid && getUnitTroops(u)>0);
  const totalTroops = tUnits.reduce((s,u)=>s+getUnitTroops(u),0);
  const totalGar = tCities.reduce((s,c)=>s+(c.garrison||0),0);

  // 粗略估算金净收入
  const grossGold = tCities.reduce((s,c)=>s+getCityProd(c).gold, 0);
  const garSalary = totalGar * GAR_SALARY_RATE;
  const unitSalary = getFacUnitSalary(targetFid);
  const postSalary = (G.factions[targetFid]?._postSalary || 0);
  const goldNet = grossGold + calcTradeAgrIncome(targetFid) - garSalary - unitSalary - postSalary; // ★ v165: 含通商收入
  const foodOk  = tCities.every(c=>(c.storage||0)>0); // ★ v179fix P51: city字段是storage不是food

  // 兵力描述
  const tDesc = totalTroops >= 40000 ? '兵力雄厚，野战大军数万'
    : totalTroops >= 20000 ? '野战兵力尚可，约万余众'
    : totalTroops >= 8000  ? '野战兵力有限，不过数千'
    : '野战兵力薄弱';

  // 财政描述
  const gDesc = goldNet > 200 ? '府库充盈，金帛有余'
    : goldNet > 0 ? '国用尚可维持'
    : goldNet > -100 ? '财政略有吃紧'
    : '入不敷出，国库虚竭';

  // 粮草描述
  const fDesc = foodOk ? '各城粮草无虞' : '部分城池粮草告急';

  // 部队动向（找兵力最大的部队所在区域）
  let moveDesc = '';
  if(tUnits.length > 0){
    const biggest = tUnits.reduce((a,b)=>getUnitTroops(a)>getUnitTroops(b)?a:b);
    const locCityId = getUnitNodeId(biggest);
    // 找最近城市名——如果不在城上，找最近的CITIES_DEF
    let cityName = '边境';
    if(locCityId && G.cities[locCityId]){
      cityName = G.cities[locCityId].name || CITY_MAP[locCityId]?.name || '边境';
    } else {
      // 找hex距离最近的城市
      let minD = 999;
      CITIES_DEF.forEach(def=>{
        const dd = hexDist(biggest.hq??0, biggest.hr??0, def.q, def.r);
        if(dd < minD){ minD = dd; cityName = def.name + '附近'; }
      });
    }
    moveDesc = `主力部队集结于${cityName}方向。`;
  }

  return `📜 使者归报：\n\n${FAC[targetFid]?.full}当前拥城${tCities.length}座。${tDesc}，${gDesc}，${fDesc}。\n${moveDesc}`;
}

/** 显示通使情报弹窗 */

/** 计谋：通使（好感+揭雾首都+情报弹窗） */
function stratEnvoy(targetFid){
  const fid = G.playerFac;
  if(!G.strategyCD[fid]) return;
  if(G.strategyCD[fid].envoy > 0){ log(`⚠ 通使冷却中（剩${G.strategyCD[fid].envoy}旬）`,'diplo'); return; }
  const d = G.diplo[`${fid}-${targetFid}`];
  if(!d || d.status==='enemy'){ log('⚠ 不可向敌对势力通使','diplo'); return; }
  if(d.rel < 20){ log('⚠ 友好度不足20，对方拒绝接见','diplo'); return; }

  const fac = G.factions[fid];
  const _cost = 600;
  if(!fac || fac.res.gold < _cost){ log(`⚠ 金币不足（需${_cost}）`,'diplo'); return; }

  safeSub(fac.res, 'gold', _cost);
  const rate = _strategyRate(fid, 0.65);

  if(Math.random() < rate){
    // 成功
    const relGain = 8 + Math.floor(Math.random()*5); // +8~12好感
    addDiplo(fid, targetFid, relGain);

    // 揭雾对方首都（持续3旬可见）
    const capDef = CITIES_DEF.find(def => G.cities[def.id]?.fac===targetFid && def.isCapital);
    if(capDef){
      if(!G.scoutReveals) G.scoutReveals = [];
      if(!G.scoutReveals.some(sr=>sr.fid===fid&&sr.cityId===capDef.id&&sr.expiresAt>G.turn)){
        G.scoutReveals.push({fid, cityId:capDef.id, expiresAt:G.turn+4});
      }
      _applyScoutReveal(fid, capDef.id);
    }

    // 情报弹窗延迟到下旬（使者需要时间归来）
    if(!G._pendingEnvoyIntel) G._pendingEnvoyIntel = [];
    G._pendingEnvoyIntel.push({targetFid, turn:G.turn});

    log(`🏛 通使${FAC[targetFid]?.full}成功！友好度+${relGain}，使者已派出，静候回报……`,'diplo');
  } else {
    // 失败
    const _refund = Math.floor(_cost / 2);
    fac.res.gold += _refund;
    addDiplo(fid, targetFid, -5);
    log(`❌ 通使${FAC[targetFid]?.full}失败——使者受冷遇，友好度-5，退${_refund}金`,'diplo');
  }

  G.strategyCD[fid].envoy = 8;
  renderRight();
}

// ════════════════════════════════════════════════════════════════════
// ── D3.c tickStrategyCDs (v181 L10750-L10756) ──
// ════════════════════════════════════════════════════════════════════

function tickStrategyCDs(){
  if(!G.strategyCD) return;
  const fid = G.playerFac;
  const cd = G.strategyCD[fid];
  if(!cd) return;
  ['driveWolf','twoTigers','spy','rumor','scout','envoy'].forEach(k=>{ if(cd[k]>0) cd[k]--; });
}

// ════════════════════════════════════════════════════════════════════
// ── D4 宣称 + 信誉 + 血仇 (v181 L10759-L11056) ──
// ════════════════════════════════════════════════════════════════════

function getDiploStatus(facA, facB){
  if(facA==='rebel'||facB==='rebel') return 'enemy';
  return G.diplo[`${facA}-${facB}`]?.status ?? 'neutral';
}

/** 两势力是否处于交战状态（enemy） */
function isHostile(facA, facB){
  if(getDiploStatus(facA, facB) !== 'enemy') return false;
  // ★ v123: 宣战当旬不生效——下旬才算敌对
  const k1 = `${facA}-${facB}`, k2 = `${facB}-${facA}`;
  const d1 = G.diplo[k1], d2 = G.diplo[k2];
  const declTurn = Math.max(d1?._warDeclaredTurn||0, d2?._warDeclaredTurn||0);
  if(declTurn > 0 && declTurn >= G.turn) return false;
  return true;
}

function addDiplo(facA, facB, delta){
  if(!facA||!facB||facA===facB) return;
  [`${facA}-${facB}`,`${facB}-${facA}`].forEach(k=>{
    if(G.diplo[k]) G.diplo[k].rel = Math.max(0, Math.min(100, G.diplo[k].rel + delta));
  });
}

/** ★ v179fix P39: Fisher-Yates 均匀洗牌（替代 sort(()=>Math.random()-0.5) 非均匀写法） */
function _shuffleFY(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * C3 信誉度惩罚
 * reason: 'betray'（解盟6旬内宣战，-20）| 'relapse'（停战3旬内宣战，-15）
 */
function applyReputationPenalty(fid, reason){
  if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
  const penalties = { betray:20, relapse:15 };
  const labels    = { betray:'背信弃义（解盟后旋即宣战）', relapse:'反复无常（停战后旋即宣战）' };
  let pen = penalties[reason] || 0;
  // SKILL_INLINE: jianxiong_pen — 曹操奸雄：信誉惩罚减半
  if(pen && hasFacGen(fid, '曹操') && genHasOffice('曹操', fid)) pen = Math.floor(pen * 0.5);
  if(!pen) return;
  G.reputation[fid] = Math.max(0, Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT) - pen));
  const isPlayer = fid === G.playerFac;
  if(isPlayer){
    log(`⚠️ ${labels[reason]}，声誉 -${pen}（现为 ${Math.round(G.reputation[fid])}）`,'diplo');
  } else {
    log(`⚠️ ${FAC[fid]?.name}${labels[reason]}，声誉 -${pen}（现为 ${Math.round(G.reputation[fid])}）`,'diplo');
  }
}

/** C3 信誉度惩罚修正系数（仅 rep<60 时生效，高于60无惩罚） */
function _repPenaltyFactor(fid){
  const rep = G.reputation?.[fid] ?? REPUTATION_DEFAULT;
  return rep >= 60 ? 0 : (60 - rep) * 0.003; // rep=30 → 0.09
}

/** C3 送礼友好度倍率（仅 rep<60 时打折，高于60不加成） */
function _repGiftMult(fid){
  const rep = G.reputation?.[fid] ?? REPUTATION_DEFAULT;
  return rep >= 60 ? 1.0 : 1 - (60 - rep) * 0.005; // rep=30 → 0.85
}

// ═══════════════════════════════════════
// C3 宣称 + 天子 + 称帝 — 核心函数
// ═══════════════════════════════════════

/** 检查两势力是否有相邻城市（边境接壤） */
function _areFacsAdjacent(fid1, fid2){
  const cities1 = new Set(Object.values(G.cities).filter(c=>c.fac===fid1).map(c=>c.id));
  return ROADS.some(([a,b]) => (cities1.has(a) && G.cities[b]?.fac===fid2) || (cities1.has(b) && G.cities[a]?.fac===fid2));
}

/** 检查fid是否有被target直接夺走且仍在target手中的城市 */
function _hasLostCityTo(fid, target){
  return Object.entries(G.cityHistory||{}).some(([cid, h]) =>
    h.fromFac === fid && h.takenBy === target && G.cities[cid]?.fac === target
  );
}

/** 获取fid对target可用的所有宣称类型 */
function getAvailableClaims(fid, target){
  const myType = getFactionIdentity(fid)?.type;
  const targetType = getFactionIdentity(target)?.type;
  const results = [];
  Object.entries(CLAIM_TYPES).forEach(([id, ct]) => {
    // 身份要求
    if(ct.reqIdentity && !ct.reqIdentity.includes(myType)) return;
    // 目标身份要求
    if(ct.reqTarget && !ct.reqTarget.includes(targetType)) return;
    // 条件要求
    if(ct.reqCondition === 'has_lost_city' && !_hasLostCityTo(fid, target)) return;
    if(ct.reqCondition === 'has_feud' && !G.feuds?.[`${fid}-${target}`]) return;
    if(ct.reqCondition === 'adjacent' && !_areFacsAdjacent(fid, target)) return;
    if(ct.reqCondition === 'not_emperor' && targetType === 'emperor') return;
    results.push({id, ...ct});
  });
  // emperor状态：所有宣称都走强宣称通道，但仍按类型列出供UI显示
  return results;
}

/** 开始准备宣称 */
function startClaimPrep(fid, target, claimType){
  const ct = CLAIM_TYPES[claimType];
  if(!ct) return;
  // 每势力同时只能准备一条
  Object.keys(G.claims).forEach(k => { if(k.startsWith(fid+'-')) delete G.claims[k]; });
  const key = `${fid}-${target}`;
  if(ct.prepTime === 0){
    G.claims[key] = { type:claimType, prepTurns:0, ready:true, readyTurn:G.turn };
  } else {
    G.claims[key] = { type:claimType, prepTurns:0, ready:false, readyTurn:null };
  }
}

/** 每旬推进宣称准备（在nextTurn中调用） */
function processClaimPrep(){
  Object.entries(G.claims).forEach(([key, claim]) => {
    if(claim.ready) {
      // 过期检查：ready后12旬作废
      if(claim.readyTurn && (G.turn - claim.readyTurn) > 12){
        delete G.claims[key];
      }
      return;
    }
    claim.prepTurns++;
    const ct = CLAIM_TYPES[claim.type];
    if(ct && claim.prepTurns >= ct.prepTime){
      claim.ready = true;
      claim.readyTurn = G.turn;
      const [fid] = key.split('-');
      if(fid === G.playerFac) log(`📜 宣称【${ct.label}】准备完毕，可随时宣战`, 'diplo');
    }
  });
}

/** 获取fid对target当前已就绪的宣称（用于宣战时） */
function getReadyClaim(fid, target){
  const claim = G.claims[`${fid}-${target}`];
  if(!claim || !claim.ready) return null;
  return { type:claim.type, ...CLAIM_TYPES[claim.type] };
}

/** 宣战时结算所有宣称效果（信誉/外交/派系） */
function applyWarDeclarationEffects(fid, target, claimType){
  const ct = claimType ? CLAIM_TYPES[claimType] : null;
  const myType = getFactionIdentity(fid)?.type;
  const targetType = getFactionIdentity(target)?.type;
  // emperor状态所有宣战走强宣称
  const strength = myType === 'emperor' ? 'strong' : (ct?.strength || 'none');
  const fx = CLAIM_EFFECTS[strength];

  // 1. 信誉
  let repChange = fx.repCost;
  // 奉旨讨逆对汉室宗亲：额外-10
  if(claimType === 'imperial_decree' && targetType === 'han_royal') repChange -= 10;
  // 直接操作reputation
  if(G.reputation && repChange !== 0){
    G.reputation[fid] = Math.max(0, Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT) + repChange));
    const repLabels = {strong:'',medium:'',weak:'弱宣称出兵',none:'无名出兵'};
    const lbl = repLabels[strength] || '';
    if(fid === G.playerFac && lbl) log(`⚠️ ${lbl}，声誉 ${repChange}（现为 ${Math.round(G.reputation[fid])}）`, 'diplo');
  }

  // 2. 第三方关系
  if(fx.thirdPartyRel !== 0){
    ALL_FACS.forEach(third => {
      if(third === fid || third === target) return;
      addDiplo(fid, third, fx.thirdPartyRel);
    });
  }
  // 奉旨讨逆：第三方+2（天子号令天下）
  if(claimType === 'imperial_decree' && targetType !== 'han_royal'){
    ALL_FACS.forEach(third => {
      if(third === fid || third === target) return;
      addDiplo(fid, third, 2);
    });
  }

  // 3. 豪族支持钩子（gentryHook）— 标记在攻方数据上，占城时读取
  if(!G._claimGentryHook) G._claimGentryHook = {};
  G._claimGentryHook[`${fid}-${target}`] = fx.gentryHook;
  // ★ v113: 记录宣称强度供占城时分档
  if(!G._warClaimStrength) G._warClaimStrength = {};
  G._warClaimStrength[`${fid}-${target}`] = strength;

  // 4. 派系忠诚
  if(ALL_FACS.includes(fid)){
    let facFx = fx.fac;
    // 奉旨讨逆对汉室宗亲的特殊派系惩罚
    if(claimType === 'imperial_decree' && targetType === 'han_royal'){
      facFx = { '汉室死忠':-4, '士族':-2, hawk:3, dove:0, founding:0 };
    }
    // emperor状态宣战：全正
    if(myType === 'emperor'){
      facFx = { '汉室死忠':2, '士族':1, hawk:3, dove:0, founding:1, royalty:2 };
    }
    _applyClaimFactionEffects(fid, facFx);
  }

  // 清除已使用的宣称
  delete G.claims[`${fid}-${target}`];

  // ★ v151: 价值观冲击 — 宣战
  applyEthosShock(fid, 'strategy', 6, '主动宣战');
  if(strength === 'strong') applyEthosShock(fid, 'mandate', -5, '正义宣称');
  else if(strength === 'weak') applyEthosShock(fid, 'mandate', 3, '弱宣称开战');
  else if(strength === 'none') applyEthosShock(fid, 'mandate', 4, '无宣称开战');
}

/** 内部：应用宣称的派系忠诚效果 */
function _applyClaimFactionEffects(fid, facFx){
  if(!G.genFactionMod) G.genFactionMod = {};
  const gens = (G.generals[fid]||[]).filter(g => g.role !== 'ruler');
  gens.forEach(gen => {
    const tags = GEN_TAGS[gen.name] || {};
    const meta = getGenMeta(gen.name);
    let delta = 0;
    // 汉室死忠
    if((meta.values||[]).includes('汉室死忠') && facFx['汉室死忠']) delta += facFx['汉室死忠'];
    // 士族
    if(tags.origin === 'gentry' && facFx['士族']) delta += facFx['士族'];
    // 鹰鸽
    if(tags.combat === 'hawk' && facFx.hawk) delta += facFx.hawk;
    if(tags.combat === 'dove' && facFx.dove) delta += facFx.dove;
    // 创始
    if(seniority(gen.name, fid) === 'founding' && facFx.founding) delta += facFx.founding;
    // 宗亲
    if(_isClanRoyalty(gen.name, fid) && facFx.royalty) delta += facFx.royalty;
    if(delta !== 0){
      G.genFactionMod[gen.name] = Math.max(-20, Math.min(20, (G.genFactionMod[gen.name]||0) + delta));
    }
  });
}

/** 城市易手追踪（在城市fac赋值后调用） */
function trackCityLoss(cityId, oldFac, newFac){
  if(!oldFac || oldFac === 'rebel' || newFac === 'rebel' || oldFac === newFac) return;
  // 记录：newFac从oldFac手中夺走了cityId
  G.cityHistory[cityId] = { takenBy:newFac, fromFac:oldFac, turn:G.turn };
  // 如果newFac收回了自己曾被夺的城，清除记录
  // （不在这里做，因为收复故土的宣称校验要求takenBy===target）
}

/** 天子易主（在城市易手后调用） */
function checkEmperorCapture(cityId, oldFac, newFac){
  if(!G.emperor || G.emperor.cityId !== cityId) return;
  if(newFac === 'rebel') return; // 叛军夺城：天子仍归原持有者（叛军不配）
  const oldHolder = G.emperor.holder;
  G.emperor.holder = newFac;
  // 旧持有者降级
  const oldIdent = getFactionIdentity(oldHolder);
  if(oldIdent?.type === 'emperor_holder'){
    setFactionIdentity(oldHolder, 'type', oldIdent._baseType || 'warlord');
  }
  // 新持有者获得挟天子（emperor不受影响）
  if(getFactionIdentity(newFac)?.type !== 'emperor'){
    setFactionIdentity(newFac, 'type', 'emperor_holder');
  }
  log(`👑 天子易主！${FAC[newFac]?.name}迎奉天子于${CITY_MAP[cityId]?.name||cityId}`, 'diplo');
}

/** 血仇触发（创始/宗亲被对方处决时调用） */
function checkBloodFeud(deadGenName, deadFid, killerFid){
  if(!deadFid || !killerFid || deadFid === killerFid) return;
  if(deadFid === 'rebel' || killerFid === 'rebel') return;
  const sen = seniority(deadGenName, deadFid);
  const isClan = _isClanRoyalty(deadGenName, deadFid);
  if(sen !== 'founding' && !isClan) return;
  const key = `${deadFid}-${killerFid}`;
  G.feuds[key] = { reason:`${deadGenName}被处决`, turn:G.turn };
  if(deadFid === G.playerFac) log(`🩸 血仇！${deadGenName}遇害，与${FAC[killerFid]?.name}结下不共戴天之仇`, 'diplo');
}

/** 血仇消退（每旬检查，60旬后消失） */
function processFeudDecay(){
  Object.entries(G.feuds||{}).forEach(([key, feud]) => {
    if(G.turn - feud.turn >= 60) delete G.feuds[key];
  });
}

// 政治链 P6 (称帝 canEnthrone/doEnthrone/aiConsiderEnthrone,L11797-L11866) 已抽离到 src/chains/politics.js

/** 信誉自然恢复（每旬调用） */
function processReputation(){
  ALL_FACS.forEach(fid => {
    const atWar = Object.keys(G.diplo).some(k => {
      const [a,b] = k.split('-');
      return (a===fid||b===fid) && G.diplo[k]?.status === 'enemy';
    });
    // SKILL_INLINE: jianxiong_rep — 曹操奸雄：信誉恢复速度×2
    const _caocaoRep = hasFacGen(fid, '曹操') && genHasOffice('曹操', fid) ? 2 : 1;
    // SKILL_INLINE: kaifan — 钟繇楷范：当官时信誉+0.15/旬
    const _zhongyaoRep = hasFacGen(fid, '钟繇') && genHasOffice('钟繇', fid) ? 0.15 : 0;
    G.reputation[fid] = Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT) + (atWar ? 0.1 : 0.2) * _caocaoRep + _zhongyaoRep);
  });
}

// ════════════════════════════════════════════════════════════════════
// ── D5.a 附庸前段 + checkDiplo (v181 L11091-L11178) ──
// ════════════════════════════════════════════════════════════════════

function applyCommonEnemyDiploBonus(atkFac, defFac, bonusDelta){
  if(!atkFac || !defFac || atkFac === defFac) return;
  if(atkFac === 'rebel' || defFac === 'rebel') return;
  const facs = ALL_FACS;
  facs.forEach(third => {
    if(third === atkFac || third === defFac) return;
    // third 须与 defFac 敌对，才算共同敌人
    const thirdVsDef = G.diplo[`${third}-${defFac}`] || G.diplo[`${defFac}-${third}`];
    if(!thirdVsDef || thirdVsDef.status !== 'enemy') return;
    // 防重复：同旬同组合同delta只加一次
    if(!G._commonEnemyDiploThisTurn) G._commonEnemyDiploThisTurn = {};
    const key = `${atkFac}|${third}|${defFac}|${bonusDelta}`;
    if(G._commonEnemyDiploThisTurn[key]) return;
    G._commonEnemyDiploThisTurn[key] = true;
    addDiplo(atkFac, third, bonusDelta);
  });
}

function checkDiplo(){
  const facs=ALL_FACS;

  // ── 先做阈值转换（基于本旬初始rel），再做自动漂移 ──
  // 顺序很重要：如果先漂移，rel=10的中立会先变10.1再判断，永远不触发敌对
  facs.forEach(a=>facs.forEach(b=>{
    if(a>=b) return;
    const k=`${a}-${b}`, d=G.diplo[k];
    if(!d) return;
    if(d.status==='neutral'&&d.rel>=80){
      d.status='ally';
      if(G.diplo[`${b}-${a}`]) G.diplo[`${b}-${a}`].status='ally';
      // D-131 fix: 自动结盟漏 truce 派系事件（_applyPeaceAgreement L273-274 双向模板）
      if(ALL_FACS.includes(a)) triggerFactionEvent('truce', a, {});
      if(ALL_FACS.includes(b)) triggerFactionEvent('truce', b, {});
      log(`🤝 ${FAC[a]?.name}与${FAC[b]?.name}结成同盟！`,'diplo');
    } else if(d.status==='ally'&&d.rel<30){
      d.status='neutral';
      if(G.diplo[`${b}-${a}`]) G.diplo[`${b}-${a}`].status='neutral';
      log(`💔 ${FAC[a]?.name}与${FAC[b]?.name}同盟破裂`,'diplo');
    } else if(d.status==='neutral'&&d.rel<=10){
      d.status='enemy'; d._warDeclaredTurn=G.turn;
      if(G.diplo[`${b}-${a}`]) { G.diplo[`${b}-${a}`].status='enemy'; G.diplo[`${b}-${a}`]._warDeclaredTurn=G.turn; }
      // D-117c fix: v179fix P15c 平行 bug 推广 — 自动宣战补全 5 项副作用（同 D-104/D-113 模式）
      // 入口覆盖：仅 checkDiplo rel≤10 自然漂移路径；D-118 中立战斗/斩使/驱虎是后续 batch
      // 背刺检测：解盟 6 旬内 → _betrayal + 信誉惩罚 + 派系事件（diploWar L427-432 模板）
      if(d._brokenAllyTurn != null && (G.turn - d._brokenAllyTurn) <= 6){
        d._betrayal = true;
        if(G.diplo[`${b}-${a}`]) G.diplo[`${b}-${a}`]._betrayal = true;
        applyReputationPenalty(a, 'betray');
        if(ALL_FACS.includes(a)) triggerFactionEvent('betray', a, {});
      }
      // 反复检测：停战 3 旬内宣战 → 信誉惩罚（diploWar L434-436 模板）
      if(d._peaceTurn != null && (G.turn - d._peaceTurn) <= 3){
        applyReputationPenalty(a, 'relapse');
      }
      // _diploCD 双向 15（_applyPeaceAgreement L263-264 / D-104 fix L1490 模板）
      G[`_diploCD_${a}_${b}`] = 15;
      G[`_diploCD_${b}_${a}`] = 15;
      // 盟友联动 + 宣战副作用 hub（含 ethosShock/信誉/第三方/派系/豪族）（diploWar L438+L440 模板）
      _syncAllyWarStatus(a, b);
      applyWarDeclarationEffects(a, b, null);
      // D-049/D-131 fix: 真正宣战路径触发 warDeclare 派系事件（接口完整性不变量）
      if(ALL_FACS.includes(a)) triggerFactionEvent('warDeclare', a, {});
      log(`⚔️ ${FAC[a]?.name}与${FAC[b]?.name}关系破裂，进入敌对！`,'diplo');
    }
  }));

  // ── 再做每旬自动友好度漂移（简化版） ──
  facs.forEach(a=>facs.forEach(b=>{
    if(a>=b) return;
    const k=`${a}-${b}`, d=G.diplo[k];
    if(!d) return;
    if(d.status==='ally'){
      if(d.rel < 85) addDiplo(a,b, 0.15); // cap at 85，不无限上升
    }
    // ★ v149fix B11: 附庸关系不再像盟友一样正向漂移，改为向50微漂（可因外交事件自然脱离）
    else if(d.status==='vassal'){
      if(d.rel < 50) addDiplo(a,b, 0.08);
      else if(d.rel > 50) addDiplo(a,b, -0.08);
    }
    else if(d.status==='enemy') addDiplo(a,b,-0.15);
    // ★ v133: neutral向30微漂移（和平有惯性）
    else if(d.status==='neutral'){
      if(d.rel < 30) addDiplo(a,b, 0.10);
      else if(d.rel > 30) addDiplo(a,b, -0.10);
    }
    // ★ v151: 价值观距离修正（天命+方略，距离大→友好衰减，距离小→友好回升）
    const _eDist = _ethosDistance(a, b);
    if(_eDist > 50) addDiplo(a, b, -0.10);       // 价值观对立
    else if(_eDist > 30) addDiplo(a, b, -0.05);  // 价值观有分歧
    else if(_eDist < 15) addDiplo(a, b, 0.05);   // 价值观相近
  }));

  // ── 附庸脱离检测（rel<20自动独立） ──
  facs.forEach(a=>facs.forEach(b=>{
    if(a===b) return;
    const d = G.diplo[`${a}-${b}`];
    if(!d || d.status!=='vassal' || d.suzerain!==b) return;
    if(d.rel < 20){
      // 附庸 a 脱离宗主 b → 转中立
      [`${a}-${b}`,`${b}-${a}`].forEach(k=>{
        if(G.diplo[k]){ G.diplo[k].status='neutral'; delete G.diplo[k].suzerain; }
      });
      log(`🔓 ${FAC[a]?.name}脱离${FAC[b]?.name}，宣布独立！`,'diplo');
    }
  }));

  // ── C3 信誉度：由processReputation()统一处理，此处不再重复 ──
}

// T1 nextTurn() 已抽离到 src/core/tick.js (Session 3.4)

// ── 附庸弹窗：AI势力向玩家称臣，或玩家被迫称臣 ──

// ════════════════════════════════════════════════════════════════════
// ── D5.b 附庸 mutators + 玩家入口 (v181 L11212-L11415) ──
// ════════════════════════════════════════════════════════════════════

/** ★ v144: 附庸关系确立时，清理所有冲突外交状态
 *  规则：
 *  1. 附庸的旧同盟 → 解除（附庸无外交自主权）
 *  2. 附庸的旧附庸 → 转移给宗主（宗主继承附庸的附庸）
 *  3. 附庸的战争 → 与宗主阵营对齐：
 *     - 附庸正在与X交战，宗主与X和平 → 附庸与X强制停战
 *     - 宗主正在与X交战，附庸与X和平 → 附庸跟随宗主对X宣战
 *  4. 附庸原有的宗主 → 脱离（不能同时有两个宗主）
 */
function _resolveVassalDiploConflicts(vassalFid, suzerainFid){
  ALL_FACS.forEach(third => {
    if(third === vassalFid || third === suzerainFid) return;
    const vKey = `${vassalFid}-${third}`, vRev = `${third}-${vassalFid}`;
    const sKey = `${suzerainFid}-${third}`;
    const vd = G.diplo[vKey];
    const sd = G.diplo[sKey];
    if(!vd || !sd) return;

    // 1. 附庸旧同盟 → 解除转中立
    if(vd.status === 'ally'){
      [vKey, vRev].forEach(k => { if(G.diplo[k]) G.diplo[k].status = 'neutral'; });
      log(`📜 ${FAC[vassalFid]?.name}称臣后，与${FAC[third]?.name}的同盟自动解除`,'diplo');
    }

    // 2. 附庸的子附庸 → 解放自由（转中立）
    if(vd.status === 'vassal' && vd.suzerain === vassalFid){
      [vKey, vRev].forEach(k => { if(G.diplo[k]){ G.diplo[k].status = 'neutral'; delete G.diplo[k].suzerain; } });
      log(`🔓 ${FAC[third]?.name}因宗主${FAC[vassalFid]?.name}称臣，恢复独立`,'diplo');
    }

    // 3a. 附庸与第三方交战，宗主与第三方和平 → 附庸强制停战
    // D-113 fix: 走 _applyPeaceAgreement 统一停战入口（v179fix P15c 平行 bug 推广）
    if(vd.status === 'enemy' && sd.status !== 'enemy'){
      _applyPeaceAgreement(vassalFid, third);
      addDiplo(vassalFid, third, 5); // 保留 +5 friendly bonus（称臣后跟随和平的友善加成）
      log(`🕊 ${FAC[vassalFid]?.name}称臣后，与${FAC[third]?.name}停战（随宗主外交）`,'diplo');
    }

    // 3b. 宗主与第三方交战，附庸与第三方和平 → 附庸跟随宣战
    if(sd.status === 'enemy' && vd.status !== 'enemy'){
      [vKey, vRev].forEach(k => {
        if(G.diplo[k]){ G.diplo[k].status = 'enemy'; G.diplo[k]._warDeclaredTurn = G.turn; }
      });
      addDiplo(vassalFid, third, -10);
      log(`⚔️ ${FAC[vassalFid]?.name}随宗主${FAC[suzerainFid]?.name}对${FAC[third]?.name}宣战`,'diplo');
    }
  });
  // ★ 不处理旧宗主：调用方应确保vassalFid是自由身才能称臣
}

/** ★ v144: 统一设置附庸关系（确保所有入口走同一逻辑） */
function _setVassalStatus(vassalFid, suzerainFid){
  // 先清理冲突（在设vassal之前，因为要读旧的getSuzerain）
  _resolveVassalDiploConflicts(vassalFid, suzerainFid);
  // 设置附庸关系
  [`${vassalFid}-${suzerainFid}`,`${suzerainFid}-${vassalFid}`].forEach(k=>{
    if(G.diplo[k]){ G.diplo[k].status='vassal'; G.diplo[k].suzerain=suzerainFid; G.diplo[k].rel=Math.max(G.diplo[k].rel||35,35); }
  });
}

function acceptVassalOffer(vassal, suzerain){
  _setVassalStatus(vassal, suzerain);
  // D-104 fix: 双向 CD（原 aiDoDiplo 直 mutate 时立即设，P15c 模式推迟到 accept 才设）
  G[`_diploCD_${vassal}_${suzerain}`] = 10;
  G[`_diploCD_${suzerain}_${vassal}`] = 10;
  log(`🏳 ${FAC[vassal]?.name}正式成为${FAC[suzerain]?.name}附庸`,'diplo');
  addDiplo(vassal, suzerain, 10);
  renderRight(); renderLeft();
  _checkPendingCourtAfterPopup(); // ★ I3
}

function rejectVassalOffer(vassal, suzerain){
  addDiplo(vassal, suzerain, -10);
  log(`❌ ${FAC[suzerain]?.name}拒绝${FAC[vassal]?.name}称臣请求`,'diplo');
  renderRight();
  _checkPendingCourtAfterPopup(); // ★ I3
}

// 玩家主动接受附庸（外交面板按钮）
// 玩家解除附庸关系（附庸独立）
function playerReleaseVassal(fid, other){
  [`${other}-${fid}`,`${fid}-${other}`].forEach(k=>{
    if(G.diplo[k]){ G.diplo[k].status='neutral'; delete G.diplo[k].suzerain; }
  });
  addDiplo(other, fid, 5); // 解放恩情，rel小幅回升
  log(`🔓 ${FAC[fid]?.name}释放${FAC[other]?.name}，恢复独立`,'diplo');
  renderRight();
}

// ★ v144: 附庸请求解除附庸（需宗主同意）
function requestVassalIndependence(suzerainFid){
  const fid = G.playerFac;
  const d = G.diplo[`${fid}-${suzerainFid}`];
  if(!d || d.status !== 'vassal' || d.suzerain !== suzerainFid){
    showNotif('当前非附庸关系','warn'); return;
  }
  // ★ v144: 12旬CD，防止反复刷
  const cdKey = `_vassalIndepCD_${fid}`;
  if(G[cdKey] && G[cdKey] > G.turn){
    showNotif(`请求冷却中（还需${G[cdKey]-G.turn}旬）`,'warn'); return;
  }
  const rel = d.rel || 0;
  // 同意概率：基于好感度 — rel越高宗主越仁慈愿放，rel低则不放
  // 50%基准 + (rel-50)*0.8%，rel70→66%, rel30→34%
  const baseRate = 0.50 + (rel - 50) * 0.008;
  // 宗主军力远超附庸时更不愿放
  const szPower = powerIndex(suzerainFid);
  const myPower = powerIndex(fid);
  const powerRatio = szPower > 0 ? myPower / szPower : 1;
  // 附庸越弱，宗主越愿放（没什么油水）；附庸越强宗主越不放
  const powerMod = powerRatio < 0.1 ? 0.15 : powerRatio > 0.3 ? -0.15 : 0;
  const finalRate = Math.max(0.10, Math.min(0.85, baseRate + powerMod));
  const accepted = Math.random() < finalRate;

  G[cdKey] = G.turn + 12; // 无论成败，12旬后才可再请求

  if(accepted){
    [`${fid}-${suzerainFid}`,`${suzerainFid}-${fid}`].forEach(k=>{
      if(G.diplo[k]){ G.diplo[k].status='neutral'; delete G.diplo[k].suzerain; }
    });
    addDiplo(fid, suzerainFid, -5); // 独立导致关系小幅下降
    log(`🔓 ${FAC[suzerainFid]?.name}同意${FAC[fid]?.name}解除附庸，恢复独立`,'diplo');
    showNotif(`${FAC[suzerainFid]?.name}同意解除附庸！`,'ok');
  } else {
    addDiplo(fid, suzerainFid, -8); // 拒绝+关系恶化
    log(`❌ ${FAC[suzerainFid]?.name}拒绝${FAC[fid]?.name}的独立请求`,'diplo');
    showNotif(`${FAC[suzerainFid]?.name}拒绝了独立请求，关系恶化`,'warn');
  }
  G[`_diploActed_${fid}`] = true; // 本旬外交行动已用
  renderRight();
}

// ★ v144: 玩家要求对方称臣（我当宗主）
function diploDemandVassal(fid, other){
  const d = G.diplo[`${fid}-${other}`];
  if(!d || d.status !== 'neutral'){ showNotif('仅可对中立势力提出','warn'); return; }
  if(G[`_diploActed_${fid}`]){ showNotif('本旬已行动','warn'); return; }
  if(getSuzerain(other)){ showNotif('对方已有宗主','warn'); return; }
  if(getSuzerain(fid)){ showNotif('附庸不可收纳附庸','warn'); return; }

  const myPow = powerIndex(fid);
  const otherPow = powerIndex(other);
  const ratio = myPow / Math.max(1, otherPow); // 我方/对方

  // 基础接受率：实力比3:1→50%，4:1→70%，5:1→85%
  let acceptRate = Math.max(0.05, Math.min(0.90, (ratio - 2.0) * 0.25));
  // 好感度修正：rel高更愿臣服
  acceptRate += ((d.rel||40) - 40) * 0.003;
  // 信誉修正
  acceptRate += ((G.reputation?.[fid] ?? REPUTATION_DEFAULT) - 50) * 0.002;
  acceptRate = Math.max(0.05, Math.min(0.90, acceptRate));

  const accepted = Math.random() < acceptRate;
  G[`_diploActed_${fid}`] = true;

  if(accepted){
    _setVassalStatus(other, fid);
    addDiplo(other, fid, 5);
    log(`🏳 ${FAC[other]?.name}臣服于${FAC[fid]?.name}，纳为附庸`,'diplo');
    showNotif(`${FAC[other]?.name}接受称臣！`,'ok');
  } else {
    addDiplo(other, fid, -15); // 要求称臣被拒，关系大幅恶化
    log(`❌ ${FAC[other]?.name}拒绝向${FAC[fid]?.name}称臣，关系恶化`,'diplo');
    showNotif(`${FAC[other]?.name}拒绝称臣，关系恶化`,'warn');
  }
  renderRight();
}

// ★ v144: 玩家主动请求称臣（我当附庸）
function diploSubmitVassal(fid, other){
  const d = G.diplo[`${fid}-${other}`];
  if(!d || d.status !== 'neutral'){ showNotif('仅可对中立势力请求','warn'); return; }
  if(G[`_diploActed_${fid}`]){ showNotif('本旬已行动','warn'); return; }
  // 附庸不能再附庸别人
  if(getSuzerain(fid)){ showNotif('已有宗主，不可再称臣','warn'); return; }
  if(getSuzerain(other)){ showNotif('对方已是附庸，不可为宗主','warn'); return; }

  const myPow = powerIndex(fid);
  const otherPow = powerIndex(other);
  const ratio = otherPow / Math.max(1, myPow); // 对方/我方

  // 对方接受率：我方越弱越愿收（白捡贡品），但太弱也看不上
  // 实力比1.5:1→60%，2:1→75%，3:1→85%
  let acceptRate = Math.max(0.30, Math.min(0.95, 0.45 + (ratio - 1.0) * 0.15));
  // 好感度修正
  acceptRate += ((d.rel||40) - 40) * 0.003;
  acceptRate = Math.max(0.20, Math.min(0.95, acceptRate));

  const accepted = Math.random() < acceptRate;
  G[`_diploActed_${fid}`] = true;

  if(accepted){
    _setVassalStatus(fid, other);
    addDiplo(fid, other, 10);
    log(`🏳 ${FAC[fid]?.name}向${FAC[other]?.name}称臣，成为附庸`,'diplo');
    showNotif(`已向${FAC[other]?.name}称臣`,'ok');
  } else {
    addDiplo(fid, other, -5); // 被拒绝称臣，轻微关系恶化
    log(`❌ ${FAC[other]?.name}拒绝接纳${FAC[fid]?.name}为附庸`,'diplo');
    showNotif(`${FAC[other]?.name}拒绝了称臣请求`,'warn');
  }
  renderRight();
}

// ════════════════════════════════════════════════════════════════════
// ── D6 顶层 lets _pendingPeaceOffer / _pendingVassalOffer (v181 L17542-L17543) ──
// ════════════════════════════════════════════════════════════════════

let _pendingPeaceOffer  = null; // AI向玩家求和的待处理请求
let _pendingVassalOffer = null; // AI附庸弹窗（称臣/接受附庸）

// ════════════════════════════════════════════════════════════════════
// ── D7 AI _exec 入口 (sprint batch-29 _exec 归位架构债) ──
//    D7.a 外交主 7 funcs (v181 L13395-L13476)
//    D7.b 计谋 5 funcs (v181 L13482-L13605)
// ════════════════════════════════════════════════════════════════════

function _execBreakAlliance(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  const k = `${fid}-${target}`, d = G.diplo[k];
  if (!d || d.status !== 'ally') return false;
  d.status = 'neutral'; d._brokenAllyTurn = G.turn;
  const rev = G.diplo[`${target}-${fid}`];
  if (rev) { rev.status = 'neutral'; rev._brokenAllyTurn = G.turn; }
  // D-109 fix: _execBreakAlliance 解盟 rel -10 → -20 (对齐玩家 breakAlliance L414 -20, 解盟惩罚玩家/AI 一致)
  addDiplo(fid, target, -20);
  log(`💔 [AI] ${FAC[fid]?.name}解除与${FAC[target]?.name}的联盟`, 'diplo');
  return true;
}

function _execDiploGift(fid, act) {
  const target = _resolveFacId(act.target);
  const level = act.level || 1;
  if (!target || target === fid) return false;
  const costs = { 1: 500, 2: 1000, 3: 2000 };
  const baseGains = { 1: 5, 2: 10, 3: 18 };
  const cost = costs[level] || 500;
  const fac = G.factions[fid];
  if (fac.res.gold < cost) return false;
  const _geBuff = fac._postBuffs?.giftEffect || 0;
  const gain = Math.max(1, Math.round((baseGains[level] || 5) * _repGiftMult(fid) * (1 + _geBuff)));
  safeSub(fac.res, 'gold', cost);
  addDiplo(fid, target, gain);
  log(`🎁 [AI] ${FAC[fid]?.name}遣使送礼予${FAC[target]?.name}，友好度+${gain}`, 'diplo');
  return true;
}

function _execDiploArmistice(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  const k = `${fid}-${target}`, d = G.diplo[k];
  if (!d || d.status !== 'enemy') return false;
  const fac = G.factions[fid];
  if (fac.res.gold < 1000) return false;
  safeSub(fac.res, 'gold', 1000);
  const acceptRate = Math.max(0.05, peaceWillingness(target, fid) - _repPenaltyFactor(fid));
  if (Math.random() < acceptRate) {
    // ★ v179fix P15c: 全部副作用走 helper（Claude AI 主动停战已付出 1000 金代价，对玩家也直接生效，不弹模态）
    _applyPeaceAgreement(fid, target);
    log(`🕊 [AI] ${FAC[fid]?.name}与${FAC[target]?.name}达成停战`, 'diplo');
    _recordWarJournal(fid, `与${FAC[target]?.name}达成停战`); // ★ v159fix
  } else {
    fac.res.gold += 700;
    addDiplo(fid, target, 3);
    log(`❌ [AI] ${FAC[target]?.name}拒绝${FAC[fid]?.name}的停战请求`, 'diplo');
  }
  return true;
}

function _execStartClaim(fid, act) {
  const target = _resolveFacId(act.target);
  const claimType = act.claim_type || act.claim;
  if (!target) { console.warn('[ClaudeAI] start_claim: 目标势力无效', act.target); return false; }
  if (!claimType || !CLAIM_TYPES[claimType]) { console.warn('[ClaudeAI] start_claim: 宣称类型无效', claimType); return false; }
  startClaimPrep(fid, target, claimType);
  log(`📜 [AI] ${FAC[fid]?.name}开始准备对${FAC[target]?.name}的宣称【${CLAIM_TYPES[claimType].label}】`, 'diplo');
  return true;
}

function _execDemandVassal(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  if (typeof diploDemandVassal === 'function') { diploDemandVassal(fid, target); return true; }
  return false;
}

function _execSubmitVassal(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  if (typeof diploSubmitVassal === 'function') { diploSubmitVassal(fid, target); return true; }
  return false;
}

function _execReleaseVassal(fid, act) {
  const target = _resolveFacId(act.target);
  if (!target || target === fid) return false;
  if (typeof playerReleaseVassal === 'function') { playerReleaseVassal(fid, target); return true; }
  return false;
}

// ── D7.b 计谋 (v181 L13482-L13605) ──

function _execSchemeDriveWolf(fid, act) {
  const targetA = _resolveFacId(act.targetA);
  const targetB = _resolveFacId(act.targetB);
  if (!targetA || !targetB || targetA === fid || targetB === fid || targetA === targetB) return false;
  if (!G.strategyCD?.[fid] || G.strategyCD[fid].driveWolf > 0) return false;
  const fac = G.factions[fid];
  if (fac.res.gold < 1500) return false;
  safeSub(fac.res, 'gold', 1500);
  const rate = _strategyRate(fid, 0.20);
  if (Math.random() < rate) {
    const kAB = `${targetA}-${targetB}`, kBA = `${targetB}-${targetA}`;
    if (G.diplo[kAB] && G.diplo[kAB].status !== 'enemy') {
      G.diplo[kAB].status = 'enemy'; G.diplo[kAB]._warDeclaredTurn = G.turn;
      if (G.diplo[kBA]) { G.diplo[kBA].status = 'enemy'; G.diplo[kBA]._warDeclaredTurn = G.turn; }
      addDiplo(targetA, targetB, -15);
      _syncAllyWarStatus(targetA, targetB);
      log(`🐯 [AI] ${FAC[fid]?.name}驱虎吞狼！${FAC[targetA]?.name}向${FAC[targetB]?.name}宣战`, 'diplo');
    }
  } else {
    fac.res.gold += 750;
    log(`❌ [AI] ${FAC[fid]?.name}驱虎吞狼失败`, 'diplo');
  }
  G.strategyCD[fid].driveWolf = 12;
  return true;
}

function _execSchemeTwoTigers(fid, act) {
  const targetA = _resolveFacId(act.targetA);
  const targetB = _resolveFacId(act.targetB);
  if (!targetA || !targetB || targetA === fid || targetB === fid || targetA === targetB) return false;
  if (!G.strategyCD?.[fid] || G.strategyCD[fid].twoTigers > 0) return false;
  const fac = G.factions[fid];
  if (fac.res.gold < 800) return false;
  safeSub(fac.res, 'gold', 800);
  const rate = _strategyRate(fid, 0.50);
  if (Math.random() < rate) {
    addDiplo(targetA, targetB, -20);
    log(`⚔️ [AI] ${FAC[fid]?.name}二虎竞食！${FAC[targetA]?.name}与${FAC[targetB]?.name}关系-20`, 'diplo');
  } else {
    fac.res.gold += 400;
    log(`❌ [AI] ${FAC[fid]?.name}二虎竞食失败`, 'diplo');
  }
  G.strategyCD[fid].twoTigers = 8;
  return true;
}

function _execSchemeSpy(fid, act) {
  const target = _resolveFacId(act.target);
  const genName = act.general || null;
  if (!target || target === fid) return false;
  if (!G.strategyCD?.[fid] || G.strategyCD[fid].spy > 0) return false;
  const fac = G.factions[fid];
  if (fac.res.gold < 1200) return false;
  safeSub(fac.res, 'gold', 1200);
  const _jiaxuBuff = hasFacGen(fid, '贾诩') && genHasOffice('贾诩', fid) ? 0.20 : 0;
  const rate = _strategyRate(fid, 0.40 + _jiaxuBuff);
  if (Math.random() < rate) {
    const gens = (G.generals[target] || []).filter(g => g.role !== 'ruler');
    const victim = (genName && gens.find(g => g.name === genName)) || gens[Math.floor(Math.random() * gens.length)];
    if (victim) {
      const oldLoy = G.genLoyalty[victim.name] ?? (victim.loyalty || 60);
      G.genLoyalty[victim.name] = Math.max(0, oldLoy - 15);
      if (G.loyaltyAccum) G.loyaltyAccum[victim.name] = G.genLoyalty[victim.name];
      log(`🕵 [AI] ${FAC[fid]?.name}反间计！${FAC[target]?.name} ${victim.name} 忠诚-15`, 'diplo');
    }
  } else {
    fac.res.gold += 600;
    log(`❌ [AI] ${FAC[fid]?.name}反间计失败`, 'diplo');
  }
  G.strategyCD[fid].spy = 8;
  return true;
}

function _execSchemeRumor(fid, act) {
  const target = _resolveFacId(act.target);
  const cityId = act.city ? _resolveCityId(act.city) : null;
  if (!target || target === fid) return false;
  if (!G.strategyCD?.[fid] || G.strategyCD[fid].rumor > 0) return false;
  const fac = G.factions[fid];
  if (fac.res.gold < 600) return false;
  safeSub(fac.res, 'gold', 600);
  const targetCities = Object.values(G.cities).filter(c => c.fac === target);
  const city = (cityId && G.cities[cityId]?.fac === target) ? G.cities[cityId] : targetCities.sort((a, b) => b.pop - a.pop)[0];
  if (!city) return false;
  const rate = _strategyRate(fid, 0.45);
  if (Math.random() < rate) {
    city.morale = Math.max(0, (city.morale || 50) - 20);
    log(`📢 [AI] ${FAC[fid]?.name}散布谣言！${city.name}民心-20`, 'diplo');
  } else {
    fac.res.gold += 300;
    log(`❌ [AI] ${FAC[fid]?.name}散布谣言失败`, 'diplo');
  }
  G.strategyCD[fid].rumor = 6;
  return true;
}

function _execSchemeScout(fid, act) {
  const cityId = _resolveCityId(act.city);
  if (!cityId) { console.warn('[ClaudeAI] scout: 城市无效', act.city); return false; }
  const targetCity = G.cities[cityId];
  if (!targetCity || targetCity.fac === fid) { console.warn('[ClaudeAI] scout: 目标是己方城市', cityId); return false; }
  if (!G.strategyCD?.[fid] || G.strategyCD[fid].scout > 0) { console.warn('[ClaudeAI] scout: CD中', G.strategyCD?.[fid]?.scout); return false; }
  const fac = G.factions[fid];
  const _zhangsongDiscount = hasFacGen(fid, '张松') && genHasOffice('张松', fid);
  const cost = _zhangsongDiscount ? 400 : 800;
  if (fac.res.gold < cost) { console.warn('[ClaudeAI] scout: 金不足', fac.res.gold, '<', cost); return false; }
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const isAdj = myCities.some(c => (ROAD_ADJ[c.id] || []).includes(cityId));
  if (!isAdj) { console.warn('[ClaudeAI] scout: 目标不相邻', cityId, '己方城:', myCities.map(c=>c.id).join(',')); return false; }
  if ((G.scoutReveals || []).some(sr => sr.fid === fid && sr.cityId === cityId && sr.expiresAt > G.turn)) return false;
  safeSub(fac.res, 'gold', cost);
  const rate = _strategyRate(fid, 0.75);
  if (Math.random() < rate) {
    if (!G.scoutReveals) G.scoutReveals = [];
    G.scoutReveals.push({ fid, cityId, expiresAt: G.turn + 3 });
    _applyScoutReveal(fid, cityId);
    log(`🔍 [AI] ${FAC[fid]?.name}细作探报！${targetCity.name}周边情报已获取`, 'diplo');
  } else {
    fac.res.gold += Math.floor(cost / 2);
    log(`❌ [AI] ${FAC[fid]?.name}细作探报失败`, 'diplo');
  }
  G.strategyCD[fid].scout = 6;
  return true;
}
