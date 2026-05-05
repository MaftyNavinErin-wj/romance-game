# Phase 3.9 Notes — chains/economy.js(chain 模板第五应用,Wave 2 收尾)

> Sub-session:Phase 3.9(REFACTOR_PLAN_v1.md §三阶段 3,Wave 2 第三个 / 收尾)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.9-economy` ← `refactor/phase-3`
> 起始 commit:`5fe9754`(Phase 3.8 完成)

---

## 一、范围(自决,scout 四件验证 PASS)

PLAN §三阶段 3.9(原)字面:`chains/economy.js(经济链 v4 / ~65 函数 / 5 _exec)`。

**实装范围**:12 段不连续 verbatim **51 函数 + 1 const(TRADE_POST_NAME)**。

| 段 | v181 行号 | 函数数 | 内容 |
|---|---|---|---|
| E1 部曲 helpers | L1242-L1250 | 2 | `canBilletToCity / getBilletCities` |
| E2 城市腐败 | L3979-L4008 | 1 | `calcCityCorruption`(3.6 carry-over §1) |
| E3.a 城市经济 read | L4806-L4927 | 5 | `getCityProd / getCityFoodCost / getCityFoodNet / getCityFoodTurns / getCityFoodColor` |
| E3.b 迁民 mechanism | L4935-L5040 | 3 | `canMigrate / getMigrateTargets / executeMigration` |
| E3.c AI 迁民 | L5174-L5272 | 1 | `_aiConsiderMigration` |
| E4 turn processors | L5279-L5617 | 10 | `processCityFood / garrisonCap / processGarrisonRecovery / _getDeployedGensForMorale / processMorale / getCityCap / processPop / processFacEconomy / getPrefectBuildBuff / processBuildQueues` |
| E5 AI 经济决策 + 调粮 | L5622-L5996 | 8 | `aiDoBuild / aiDoTransfer / aiDoAppointments / processTransfers / checkResupply / findBestDonor / cityDist / doTransfer` |
| E6 玩家入口 | L10042-L10118 | 6 | `buildBld / setTax / setPolicy / toggleResupply / setCorvee / cancelSupplyLine` |
| E7.a aiDoTradeAgreement | L9663-L9690 | 1 | (3.8 carry-over §6) |
| E7.b trade offers + diploTrade | L9746-L9801 | 3 | `_getTradeOffers / _findTradeCity / diploTrade` |
| E7.c trade post const + funcs | L9810-L9962 | 7 + 1 const | `TRADE_POST_NAME` + `_canBuildTradePost / getTradeAgreements / hasTradeAgreement / calcTradeAgrIncome / _cleanTradeAgreements / diploTradeAgreement / cancelTradeAgreement` |
| E8 物资 helpers | L13006-L13030 | 4 | `calcSlotMatCost / mergeMatCosts / canAffordMat / deductMat` |

**留 v181**:
- modal/UI 紧密耦合(phase 2 原则):
  - `showMigrateDialog`(L5042-L5171)— 迁民弹窗 modal HTML
  - **粮食警报整段**(L6000-L6098)— 7 funcs + 2 顶层 const(`_pendingCards / _shownCities`):
    `renderAlertStack / confirmCard / dismissCard / renderFoodAlerts / _doFATransfer / confirmFALong / confirmFAOnce / dismissFA`
    (callback 直接写 DOM,与 modal 状态双向耦合,**整段留 v181**)
- 武将链(留 3.12):`getStrategistInt / setStrategist`(L9697-L9744,夹在 trade 子组中间)
- 豪族链(已留):`showSiegeAftermathChoice`(L9977,夹在 trade 子组后)
- 军事链(留 3.11):`createUnit`(L13033,夹在物资 helpers 后)
- 5 个 `_exec*`(`_execBuild / _execSetTax / _execSetPrefect / _execTransferFood / _execToggleResupply / _execCancelSupply`)— 留 src/core/claude_ai.js,phase 3.3 选项 A 决策

---

## 二、写口归属声明

**本 chain 主要写口**:
- `G.cities[id].storage / .pop / .morale / .build / .corruption / .garrison / .billetPool / .scrapDrops / .siegeDecay / .occupied`(城市状态)
- `G.factions[fid].res.gold / .food / .horses / .iron / .wood`(势力资源)
- `G.factions[fid]._postBuffs / ._fiscalReport`(经济 cache;_postBuffs 写在 src/core/tick.js)
- `G.foodAlertCards / G.supplyLines / G._supplyCD`(警报 + 补给线 state)
- `G._tradeAgreements / G._tradeCD`(通商子组 state)
- `G._migratedThisTurn`(迁民全局每旬 cache)

**跨链副作用写口**(整函数归经济):
- `executeMigration`:写 `city.gentry`(豪族,通过 `_aggregateGentry`)+ ethos 影响
- `processMorale`:可能调 `applyEthosShock`
- `processFacEconomy`:多处调 `getTechEffect / getCourtDecreeBuffs / calcPostBuffs`
- `aiDoAppointments`:调 `setPrefect`(武将链,留 3.12)— 太守任命
- `aiDoBuild`:扣 res(经济)+ 调 `getTechEffect / calcPostBuffs / getCourtDecreeBuffs`
- `diploTrade`:扣 `G.factions[fid].res.gold`(经济)+ 写 `G.scoutReveals`(外交计谋)+ 调 `addDiplo / _diploActed / _diploMarkActed / _applyScoutReveal`
- `aiDoTradeAgreement`:写 `G._tradeAgreements`(经济)+ 扣 res + 调 `addDiplo / getSuzerain / hasTradeAgreement`
- `setTax / setPolicy / setCorvee`:写 `G.factions[fid].taxRate / .policy / .corvee`

---

## 三、跨链 carry-over 验证(PASS)

| Carry-over 来源 | 验证项 | 结果 |
|---|---|---|
| §3.6 #1 | `calcCityCorruption` 调 `_getCorruptGentryMod`(已抽 gentry)是反向调用 | ✓ 直接抽 |
| §3.7 #5 | `processTechResearch / startTechResearch` 扣 res 是政治写口副作用,经济**不反取** | ✓ 不重复抽 |
| §3.8 #6 | trade 子组(aiDoTradeAgreement + 12 trade 函数)夹在外交段中间,3.9 直接抽 | ✓ E7.a/E7.b/E7.c 三段抽走 |

---

## 四、PLAN §二偏离

PLAN 字面:~65 函数 / 5 _exec。
scout + 实装:**51 函数 + 1 const**。

偏差中等,主因:
- 粮食警报整段(8 funcs + 2 const)留 v181(phase 2 原则,UI 紧密耦合)
- showMigrateDialog 留 v181(modal HTML)
- master scout ~65 含粮食警报 + dialog,实测 51

scout-before-extract 第 9 次应用,scout 四件验证(p3.8 教训沉淀)全部 PASS。

---

## 五、scout 四件验证应用记录

p3.8 沉淀的 scout 四件验证(原则 #9):

| 验证项 | 本 session 应用 | 发现 |
|---|---|---|
| (a) `awk 'NR>=A && NR<=B && /^function /'` 列范围内所有 function | ✓ 8 个候选 range 全部 awk | 检测到 4 个他链夹击:`getStrategistInt + setStrategist`(L9697 武将)/ `showSiegeAftermathChoice`(L9977 豪族 留 v181)/ `createUnit`(L13033 军事)。3 个被 ranges 跳过,正确分离 |
| (b) `grep -n "^}"` 验证每段最后函数真实 closing | ✓ 全部 12 段验证 | 每段精确到函数体结束(L1250 / L4008 / L4927 / L5040 / L5272 / L5617 / L5996 / L10118 / L9690 / L9801 / L9962 / L13030)|
| (c) build 脚本 header 提取用 banner 终止标记 | ✓ banner = `\n// ════ // ── E1` | idempotent 重跑无 doubled |
| (d) 函数名带 chain 前缀按主写口判定 | ✓ `diploTrade` + `aiDoTradeAgreement` 名字含 diplo,主写口 G.factions[].res + G._tradeAgreements 归经济(p3.8 实装就地修正后,本 session scout 时一次到位) | 0 实装就地修正 |

**0 个 bug**(p3.8 4 bug → p3.9 0 bug),四件验证沉淀有效。

---

## 六、跨链反向调用(c) 已 approve

### 本 chain 被外部链调用(callers)

| 归属链 | 调用 |
|---|---|
| 军事链(留 v181 等 3.11) | `getCityProd / getCityFoodCost / getCityFoodNet / getCityFoodTurns / garrisonCap / getCityCap / canAffordMat / deductMat / mergeMatCosts / calcSlotMatCost / canBilletToCity / getBilletCities`;`processGarrisonRecovery / processMorale / processCityFood / processPop` 被 tick 调 |
| 武将链(留 v181 等 3.12) | `setPrefect / clearPrefectByGen` 调 `processPop / processCityFood / processMorale`(反向 callee);多处武将动作调 `getCityProd / getCityFoodCost / processFacEconomy` |
| 政治链(已抽 chains/politics.js) | `processTechResearch / startTechResearch / calcPostBuffs` 写 res(本 chain 主写口副作用,§3.7 carry-over);`appointGenPost / dismissGenPost` 调 `clearPrefectByGen` |
| 外交链(已抽 chains/diplomacy.js) | `diploGift / diploArmistice / diploAlly / stratEnvoy / strat*` 多处扣 res;`_clearSiegeOnPeace` 写 city.siegeDecay |
| 豪族链(已抽 chains/gentry.js) | `processGentry` 调 `getCityProd / getCityFoodCost / canBilletToCity`(反向);`_aggregateGentry` 被 `executeMigration / processMorale` 调 |
| 价值观链(已抽 chains/ethos.js) | `processFacEthos` 调 `aiDoBuild` 路径(反向)|
| 事件链(留 v181 等 3.10) | 事件 effects 多处写 res / city.morale / city.pop |
| render(留 v181) | `tooltips.js / ui_panels.js / inline 多 modal` 调多个经济 helper |
| core(已抽) | `tick.js`:`processCityFood / processGarrisonRecovery / processMorale / processPop / processFacEconomy / processBuildQueues / processTransfers / checkResupply / _aiConsiderMigration / aiDoBuild / aiDoTransfer / aiDoAppointments / aiDoTradeAgreement / _cleanTradeAgreements`(每旬调用);`main.js`:initGame / loadFromSlot 调多个经济 helper;`claude_ai.js`:5 个 `_exec*` 调本 chain |

### 本 chain 调外部(callees)

- `_aggregateGentry / _getCorruptGentryMod / getGentryGoldMult`(已抽 chains/gentry.js)
- `getTechEffect / getCourtDecreeBuffs / calcPostBuffs / getStage / getTributeRates`(已抽 chains/politics.js)
- `applyEthosShock`(已抽 chains/ethos.js)
- `addDiplo / _diploActed / _diploMarkActed / _applyScoutReveal / getDiploStatus / isHostile / alliedFacs / getSuzerain`(已抽 chains/diplomacy.js)
- `setPrefect / clearPrefectByGen / hasFacGen / genHasOffice / triggerFactionEvent`(武将链,留 v181 等 3.12)
- `setStrategist / getStrategistInt`(武将链军师,留 3.12)
- `safeSub / safeAdd`(已抽 src/core/helpers.js)
- `closeModal / renderRight / renderLeft / renderAll / renderAllLight / renderMap / showNotif / log / fmt / invalidateCityCache`(已抽 / 留 v181)
- 数据 / 常量(部分已抽 src/data/,部分留 v181)

---

## 七、Phase 3 全局 carry-over 验证

- **backToTitle reset**:粮食警报段顶层 const `_pendingCards / _shownCities` 留 v181(L6001-L6002),`src/core/tick.js` L332 已经跨 script 引用 `_shownCities.clear()`(同 phase 3.4 验证 const 跨 classic <script> 共享)。无需变更
- **map.js 决策**:无关
- **_execXxx 派发**:5 个相关,按 phase 3.3 选项 A 留 src/core/claude_ai.js

---

## 八、实测数据

| 项 | 起点(p3.8 末) | economy 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 29159 | **27753** | **-1406 行** |
| src/chains/economy.js | 0 | **1688 行** | +1688(350 header + 1338 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 27753 = **-29.8%**(突破 -30% 大关在即)。
src/ 现状:11 文件 8146 行(core 6 文件 2916 + chains 5 文件 5230)。
**Wave 2 收尾完成**。

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.9 启动前) | 51 | ✅ identical(p3.8 已 PASS) |
| economy.js 抽离后 | 51 | ✅ identical |

---

## 九、phase 3.9 完成清单

- ✅ `chains/economy.js` 抽出(12 段不连续 verbatim ~1338 行 + 350 header)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 6 项 header 模板完整(含写口归属声明)
- ✅ 加载顺序规范(chains/economy.js 在 chains/diplomacy.js 之后)
- ✅ phase 2 原则:`showMigrateDialog`(modal)+ 粮食警报整段(UI 耦合)+ 各 render Tab 留 v181
- ✅ 武将边界排除:`setPrefect / clearPrefectByGen / getStrategistInt / setStrategist` 留 3.12
- ✅ 军事边界排除:`createUnit` 留 3.11
- ✅ 跨链 carry-over §3.6 + §3.7 + §3.8 全部验证 PASS
- ✅ 5 个 `_exec*` 按选项 A 留 claude_ai.js
- ✅ Node 双脚本(共享 ranges 数组)预防 awk 边界 + 字符替换 bug
- ✅ scout 四件验证全部 PASS,**0 个实装阶段 bug**(p3.8 教训沉淀有效)
- ⏭ 工作分支 `refactor/p3.9-economy` → squash merge `refactor/phase-3`

---

## 十、Wave 2 收尾(3.7-3.9)

Wave 2 完成,3 个中等 chain 抽离稳定:

| Sub-session | Chain | 函数数 | v181 减重 | bug |
|---|---|---|---|---|
| 3.7 | politics | 47 + 1 const + 4 lets | -825 行 | 1 个(手打 verbatim 字符替换)|
| 3.8 | diplomacy | 63 + 2 lets | -1379 行 | 4 个(scout 四件验证缺失)|
| 3.9 | economy | 51 + 1 const | -1406 行 | **0** |

3.10 起进 Wave 3(事件 + 军事 + 武将,Wave 3 三大头),工作流持续按四件验证执行。

---

## 十一、下一 sub-session 衔接

**3.10 chains/event.js**(事件链,Wave 3 第一个):
- ~7 函数(事件链最小)
- 0 _exec(事件 effects 写口已经按各自 chain 归属)
- 0 backToTitle reset
- events 数据已抽 src/data/events.js(phase 1)
- **关键**:此时各前置链已抽完,事件 effects 写口归属全部明确(§master scout 推荐顺序的核心理由)

phase 3.9 留给后续 sub-sessions 的债:
- 3.10 抽事件:确认 events.js ~20 处 `applyEthosShock`(已 carry-over §3.5);事件 effects 多处调 `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud`(已抽外交,反向调用 OK)
- 3.11 抽军事:确认 `getCityProd / processGarrisonRecovery / canBilletToCity` 等被军事多处调是反向调用 OK;`createUnit`(L13033)留 3.11 一起抽;`_supplyCache`(L13431)留 3.11
- 3.12 抽武将:确认 `setPrefect / clearPrefectByGen` 在本 session 反向调,3.12 抽武将时这两个真函数归武将;`getStrategistInt + setStrategist`(L9697-L9744)留 3.12
