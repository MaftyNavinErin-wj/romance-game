# Phase 3.8 Notes — chains/diplomacy.js(chain 模板第四应用,最大 chain 文件)

> Sub-session:Phase 3.8(REFACTOR_PLAN_v1.md §三阶段 3,Wave 2 第二个)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.8-diplomacy` ← `refactor/phase-3`
> 起始 commit:`0f63599`(Phase 3.7 完成)

---

## 一、范围(scout 实测,制作人 approve + 实装阶段就地修正 1 项)

PLAN §三阶段 3.8(原)字面:`chains/diplomacy.js(外交链 v4 / ~66 函数 / 31 D 类)`。

scout 报告 approve 64 函数。**实装阶段就地修正**:`aiDoTradeAgreement`(L10163,主写口 `G._tradeAgreements` 归经济 trade)留 v181 等 3.9。最终 **63 函数 + 2 顶层 lets**。

| 段 | v181 行号 | 函数数 | 内容 |
|---|---|---|---|
| D1.a 停战 helpers + accept/reject peace | L9591-L9667 | 4 | `_clearSiegeOnPeace / acceptPeaceOffer / rejectPeaceOffer / _applyPeaceAgreement` |
| D1.b 玩家外交动作 + 实力计算 | L9732-L10015 | 18 | `_diploActed / _diploMarkActed / diploGift / diploArmistice / diploAlly / startClaimPrepUI / playerEnthrone / diploBreakAlliance / diploWar / powerIndex / fogPowerEstimate / alliedFacs / isSuzerain / isVassal / getSuzerain / effectivePowerAgainst / peaceWillingness / _syncAllyWarStatus` |
| D2 AI 外交决策 | L10018-L10160 | 1 | `aiDoDiplo` |
| D3.a 计谋 strategy + scout | L10245-L10428 | 7 | `_strategyRate / stratDriveWolf / stratTwoTigers / stratSpy / stratRumor / stratScout / _applyScoutReveal` |
| D3.b 通使 | L10491-L10593 | 2 | `_buildEnvoyIntel / stratEnvoy` |
| D3.c tickStrategyCDs | L10750-L10756 | 1 | `tickStrategyCDs` |
| D4 宣称 + 信誉 + 血仇 | L10759-L11056 | 20 | `getDiploStatus / isHostile / addDiplo / _shuffleFY / applyReputationPenalty / _repPenaltyFactor / _repGiftMult / _areFacsAdjacent / _hasLostCityTo / getAvailableClaims / startClaimPrep / processClaimPrep / getReadyClaim / applyWarDeclarationEffects / _applyClaimFactionEffects / trackCityLoss / checkEmperorCapture / checkBloodFeud / processFeudDecay / processReputation` |
| D5.a 附庸前段 | L11091-L11178 | 2 | `applyCommonEnemyDiploBonus / checkDiplo` |
| D5.b 附庸 mutators + 玩家入口 | L11212-L11415 | 8 | `_resolveVassalDiploConflicts / _setVassalStatus / acceptVassalOffer / rejectVassalOffer / playerReleaseVassal / requestVassalIndependence / diploDemandVassal / diploSubmitVassal` |
| D6 顶层 lets | L17542-L17543 | (2 lets) | `_pendingPeaceOffer / _pendingVassalOffer` |

**留 v181**:
- modal HTML 构造:`showDiploSueForPeace`(L9567)/ `showDiploVassal`(L11179-L11210)— phase 2 原则
- render Tab:`renderDipTab`(L13568)/ `renderSchemeTab`(L13829)— phase 2 原则
- 武将链(留 3.12,夹在外交段中间):`setPrefect / clearPrefectByGen`(L9669-L9729)/ `getStrategistInt / setStrategist`(L10197-L10240)
- 经济 trade(留 3.9,夹在 D2/D3 中间):
  - `aiDoTradeAgreement`(L10163-L10190)— **就地修正,scout 时误归外交**
  - `_getTradeOffers / _findTradeCity / diploTrade`(L10429-L10489)
  - `TRADE_POST_NAME` const + `_canBuildTradePost / getTradeAgreements / hasTradeAgreement / calcTradeAgrIncome / _cleanTradeAgreements / diploTradeAgreement / cancelTradeAgreement`(L10594-L10748)
- 14 个 `_exec*`(L28446-L28699)— 留 src/core/claude_ai.js,phase 3.3 选项 A 决策

---

## 二、写口归属声明

**本 chain 主要写口**:
- `G.diplo[`${a}-${b}`].status / .rel / .suzerain / ._actedThisTurn / ._warDeclaredTurn / ._brokenAllyTurn / ._peaceTurn / ._betrayal`(双向外交关系 + 时间戳)
- `G.reputation[fid]`(信誉)
- `G.bloodFeud / G._feudDecay / G._feudKills`(血仇)
- `G._warClaimStrength / G._claimGentryHook / G._claimPrep`(宣称)
- 各种 CD:`G[`_diploCD_${a}_${b}`]` / `G[`_diploActed_${fid}`]` / `G[`_vassalIndepCD_${fid}`]`
- `G.scoutData / G.envoyIntel / G.scoutReveals / G._pendingEnvoyIntel`(计谋情报)
- `_pendingPeaceOffer / _pendingVassalOffer`(模块 lets)

**跨链副作用写口**(整函数归外交):
- `_applyPeaceAgreement`:调 `triggerFactionEvent('truce')`(武将)+ `_clearSiegeOnPeace` 写 `unit.status / .siegeTarget / city.siegeDecay`(军事)
- `applyWarDeclarationEffects / _applyClaimFactionEffects`:调 `applyEthosShock`(已抽 ethos)+ 派系 mod
- `diploAlly / diploWar`:调 `applyEthosShock` + `triggerFactionEvent`
- `stratSpy / stratRumor`:写 `G.genLoyalty`(武将)/ `G.cities[].morale`(经济)— 计谋核心机制,3.9 / 3.12 抽时记住边界
- `stratScout / _applyScoutReveal`:写 `G.fog`(军事)— 谍报情报,3.11 抽军事时确认
- `trackCityLoss`:调 `checkPostDowngrade`(已抽政治)
- `checkEmperorCapture`:写 `FAC_IDENTITY[fid].type` / `G.emperor`(政治)— 战时擒帝触发,3.12 / 3.11 不反取
- `addDiplo`:被几乎所有 chain 调,核心 helper
- `diploGift / diploArmistice / diploAlly / stratEnvoy`:扣 `G.factions[fid].res.gold`(经济)— 外交动作消耗资源,主写口在外交关系

---

## 三、PLAN §二偏离 + 实装就地修正

PLAN 字面:~66 函数 / 14 _exec / 2 backToTitle reset(master scout 估)。
scout approve:64 函数(showDiploSueForPeace + showDiploVassal 留 v181)。
实装就地修正:**63 函数**(aiDoTradeAgreement scout 误归外交,实装时发现主写口 `G._tradeAgreements` 归经济,留 3.9)。

| 阶段 | 函数数 | 偏离原因 |
|---|---|---|
| PLAN 字面(master scout) | ~66 | — |
| scout 报告 approve | 64 | 减 2 modal HTML 留 v181 |
| 实装就地修正 | **63** | 再减 1:aiDoTradeAgreement scout 误判,主写口归经济 |

scout-before-extract 第 8 次应用,PLAN-vs-reality 偏差小。

---

## 四、实战教训(本 session 实装阶段 4 个 bug)

phase 3.6 / 3.7 教训叠加沉淀,本 session 实装阶段又踩了 4 个 bug,记入 §四工作流。

### bug 4.1:第一次 build_diplomacy.js 文件累积

第一次跑 build_diplomacy.js 后,第二次重跑发现 diplomacy.js 暴增到 3624 行(应该 1900)。原因:脚本读 src/chains/diplomacy.js 当 header 时**把上次跑的 verbatim 部分也读进来**了,导致每次重跑函数定义被 doubled。

**修复**:脚本只读到第一个 `\n// ════ ... // ── D1.a` banner 标记前的内容当 header。
**教训**:重复运行脚本要 idempotent,header 提取必须有 banner 终止标记。

### bug 4.2:scout 范围 end 不到函数体结束

第一次 ranges 设置:
- `_syncAllyWarStatus` end 9996 → 实际到 10015(漏 19 行函数体)
- `tickStrategyCDs` end 10750 → 实际到 10756(只抽 function 头一行!)
- `processReputation` end 11051 → 实际到 11056

**修复**:用 `grep -n "^}"` 找每个范围最后一个函数的真实 closing brace。
**教训**:scout 时不能凭"下一个函数行号 -1"定 end,必须找当前函数真实 closing。

### bug 4.3:scout 漏检中间夹的他链函数

scout 时认为 D2 范围 L10018-L10240 = aiDoDiplo + aiDoTradeAgreement。**实装跑 grep 函数列表才发现** L10018-L10240 还夹了:
- `aiDoTradeAgreement`(L10163,scout 时误归外交,实际归经济)
- `getStrategistInt + setStrategist`(L10197-L10240,scout 时已知归武将)

D3 范围 L10245-L10756 也夹了**12 个 trade 子组函数**:
- `_getTradeOffers / _findTradeCity / diploTrade`(L10429-L10489)
- `TRADE_POST_NAME` const(L10600-L10604)
- `_canBuildTradePost / getTradeAgreements / hasTradeAgreement / calcTradeAgrIncome / _cleanTradeAgreements / diploTradeAgreement / cancelTradeAgreement`(L10607-L10748)

**修复**:把 D2 / D3 拆成多个不连续 sub-ranges 跳过他链函数。
**教训**:**scout 时必须 `awk 'NR>=A && NR<=B && /^function /'` 列出范围内所有 function**,而不是只看 master scout 列出的目标函数。chain 范围常常夹其他 chain 的函数。

### bug 4.4:scout 边界判定错误(aiDoTradeAgreement)

scout 报告把 `aiDoTradeAgreement` 归外交链(因为函数名 `diplo` + 主调用方在 AI 外交决策旁)。但实际主写口 `G._tradeAgreements` 是经济 trade 状态,应留 3.9。

**修复**:实装阶段就地修正 — 不抽 aiDoTradeAgreement,在 phase3_8_notes §三记录"实装就地修正"。
**教训**:scout 时按 (a) 写口判定,**函数名带 chain 前缀≠归该 chain**。aiDoTradeAgreement 名字含 "diplo trade",但写口在经济。

### 工作流改进(本 session 沉淀)

1. scout 报告必须含一个 `awk 'NR>=A && NR<=B && /^function /'` 输出截图,明确"范围内所有 function"
2. ranges 边界用 `grep -n "^}"` 验证每段最后函数真实 closing
3. scout 后实装前再跑一次 build 脚本 + `grep -c '^function'` 对比 scout 函数数
4. 实装阶段如发现 scout 边界错误,**就地修正 + commit message + phase notes 三处留档**(不 BLOCKED 回报)

---

## 五、跨链反向调用(c) 已 approve

### 本 chain 被外部链调用(callers)

| 归属链 | 调用 |
|---|---|
| 经济链(留 v181 等 3.9) | trade 路径调 `addDiplo / getDiploStatus / isHostile / hasTradeAgreement`;多处调 `getDiploStatus / isHostile / alliedFacs` |
| 军事链(留 v181 等 3.11) | 战斗 / 围城 / 行军 / fog / siege 多处调 `addDiplo / getDiploStatus / isHostile / _syncAllyWarStatus / _clearSiegeOnPeace / trackCityLoss / checkEmperorCapture / applyCommonEnemyDiploBonus`;战斗死亡调 `checkBloodFeud` |
| 武将链(留 v181 等 3.12) | `killGen / surrenderGen / poach / 派系事件` 调 `addDiplo / applyReputationPenalty / checkBloodFeud / isHostile / alliedFacs` |
| 豪族链(已抽 chains/gentry.js) | `_triggerGentryBetray` 调 `trackCityLoss / checkEmperorCapture / addDiplo` |
| 政治链(已抽 chains/politics.js) | `doEnthrone` 调 `addDiplo / _applyClaimFactionEffects`(已 carry-over §3.7);`canEnthrone` 调 `isVassal` |
| 价值观链(已抽 chains/ethos.js) | `_ethosDistance` 被 ethos drift 调(反向,已 carry-over §3.5) |
| 事件链(留 v181 等 3.10) | 事件 effects 多处调 `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud` |
| render(留 v181) | `tooltips.js / ui_panels.js`:`getDiploStatus / isHostile / alliedFacs / isVassal / isSuzerain / getSuzerain / powerIndex / fogPowerEstimate / getAvailableClaims / getReadyClaim / processClaimPrep / addDiplo`;`renderDipTab / renderSchemeTab` 调多个外交 helper |
| core(已抽) | `tick.js`:`tickStrategyCDs / processClaimPrep / processFeudDecay / processReputation / aiDoDiplo / checkDiplo`(每旬调用)+ `_pendingPeaceOffer / _pendingVassalOffer` 弹窗调度(L636-L643);`main.js`:initGame / loadFromSlot 调 `addDiplo / _setVassalStatus`;backToTitle reset 调 `_pendingPeaceOffer / _pendingVassalOffer = null`(L127-L128);`claude_ai.js`:14 个 `_exec*` 调本 chain |
| inline backToTitle / startGame / saveGame / loadGame | L26835 + L26836 reset / L26495-L26496 saveGame meta / L26520-L26521 loadGame meta — 全部已是跨 script 写,**抽 lets 后保持不变** |

### 本 chain 调外部(callees)

- `triggerFactionEvent`(武将链派系事件 hub,留 v181 等 3.12)— `_applyPeaceAgreement / diploAlly / diploWar / aiDoDiplo / applyWarDeclarationEffects` 等多处
- `applyEthosShock`(已抽 chains/ethos.js)— `diploAlly / diploWar / applyWarDeclarationEffects / _applyClaimFactionEffects`
- `checkPostDowngrade`(已抽 chains/politics.js)— `trackCityLoss`
- `doEnthrone / canEnthrone`(已抽 chains/politics.js)— `playerEnthrone`
- `getTributeRates / setFactionRuler / clearAllPostsByGen`(已抽 chains/politics.js)
- `aiDoTradeAgreement / hasTradeAgreement / calcTradeAgrIncome / cancelTradeAgreement / diploTradeAgreement`(经济 trade,留 v181 等 3.9)
- `safeSub`(已抽 src/core/helpers.js)
- `closeModal / renderRight / renderLeft / renderAll / renderAllLight / showNotif / log / _checkPendingCourtAfterPopup`(已抽 / 留 v181 inline modal)
- 武将链(留 3.12):`addStatExp / loyaltyDisplay / getRetainerType / clearPrefectByGen / killGen / surrenderGen / poachGen / addGenChronicle / hasFacGen / hasGenInUnits / GEN_TAGS / GEN_MAP / addIntimacy / getRelationLabel`
- 军事链(留 3.11):`canSeeFactionData / hkey / FOG_VISIBLE / FOG_UNEXPLORED / getKnownCityCount / getUnitTroops / getUnitNodeId / invalidateCityCache / updateFogCitySnapshot / getCityProd / GAR_SALARY_RATE / getFacUnitSalary`
- `confirm`(浏览器 API)— `playerEnthrone`

---

## 六、Phase 3 全局 carry-over 验证

- **backToTitle reset**:2 行(L26835 + L26836)写 `_pendingPeaceOffer / _pendingVassalOffer = null`。这两个 lets **抽前已经被 main.js + tick.js 跨 script 引用**,抽到 chain 后所有引用自动指向 chain 暴露的 lets。reset 行 / saveGame meta / loadGame meta 全部**保持不变**
- **map.js 决策**:无关
- **_execXxx 派发**:14 个相关(diplomacy 是 _exec 大户),按 phase 3.3 选项 A 留 src/core/claude_ai.js

---

## 七、实测数据

| 项 | 起点(p3.7 末) | diplomacy 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 30538 | **29159** | **-1379 行** |
| src/chains/diplomacy.js | 0 | **1633 行** | +1633(283 header + 1350 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 29159 = **-26.3%**(突破 -25% 大关)。
src/ 现状:10 文件 6458 行(core 6 文件 2916 + chains 4 文件 3542)。

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.8 启动前) | 51 | ✅ identical(p3.7 已 PASS) |
| diplomacy.js 抽离后 | 51 | ✅ identical |

---

## 八、phase 3.8 完成清单

- ✅ `chains/diplomacy.js` 抽出(9 段不连续 verbatim ~1350 行 + 283 header)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 6 项 header 模板完整(含写口归属声明)
- ✅ 加载顺序规范(chains/diplomacy.js 在 chains/politics.js 之后)
- ✅ phase 2 原则:`showDiploSueForPeace / showDiploVassal / renderDipTab / renderSchemeTab` 留 v181
- ✅ 武将边界排除:`setPrefect / clearPrefectByGen / getStrategistInt / setStrategist` 留 3.12
- ✅ 经济边界排除:`aiDoTradeAgreement` + 12 个 trade 子组函数留 3.9(实装就地修正 1 项)
- ✅ 14 个 `_exec*` 按选项 A 留 claude_ai.js
- ✅ backToTitle reset / saveGame meta / loadGame meta 已是跨 script 写,抽 lets 后保持不变
- ✅ Node 双脚本(共享 ranges 数组)预防 awk 边界 + 字符替换 bug
- ✅ 4 个实装阶段 bug 修复 + 工作流改进沉淀(§四)
- ⏭ 工作分支 `refactor/p3.8-diplomacy` → squash merge `refactor/phase-3`

---

## 九、下一 sub-session 衔接

**3.9 chains/economy.js**(经济链,Wave 2 第三个,Wave 2 收尾):
- ~65 函数(含已识别 trade 子组)
- 5 _exec
- 0 backToTitle reset(scout 时再确认)
- 含粮食警报 UI(renderAlertStack 等)— phase 2 原则候选留 v181
- **承接边界**:
  - 3.6 carry-over:`calcCityCorruption` 调 `_getCorruptGentryMod`(已抽 gentry)— 反向调用,无需动
  - 3.7 carry-over:`processTechResearch / startTechResearch` 扣 `G.factions[fid].res` 是政治写口副作用,经济**不反取**
  - 3.8 carry-over:`aiDoTradeAgreement` + 12 个 trade 子组函数(scout 时本 session 已识别清单,3.9 直接抽);`stratSpy/stratRumor` 写 `G.cities[].morale` 是外交计谋副作用,经济**不反取**

phase 3.8 留给后续 sub-sessions 的债:
- 3.9 抽经济:**aiDoTradeAgreement + 12 个 trade 子组**(本 session 已 carry-over 列出清单,3.9 直接抽)
- 3.10 抽事件:确认事件 effects 多处调 `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud` 是反向调用 OK
- 3.11 抽军事:确认 `_clearSiegeOnPeace` 写 unit.status/siegeTarget 是外交副作用 carry-over;确认 `_applyScoutReveal` 写 G.fog 是外交副作用;确认 `checkEmperorCapture` 写 FAC_IDENTITY.type 是外交副作用
- 3.12 抽武将:确认 `stratSpy / stratRumor` 写 G.genLoyalty 是外交副作用;确认 `triggerFactionEvent` 被外交多处调用是反向调用 OK;`getStrategistInt / setStrategist` 在本 session 留 v181 等 3.12 抽
