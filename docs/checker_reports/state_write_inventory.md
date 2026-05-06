# Checker 3:G 写口反向索引 + 生命周期闭环检查

> 生成时间:2026-05-06T07:23:09.488Z
> 数据源:`project_romance_v181.html` + `src/**/*.js`
> 服务 D 类:D-120 + 模式 6 状态生命周期类
> 检查范围:`G._xxx` 顶层动态字段 + `G[`_xxx_${...}`]` 模板字段

## 总览

| 项 | 数 |
|---|---|
| 静态字段 `G._xxx` | 34 |
| 模板字段 `G[`_xxx_${...}`]` | 3 |
| 生命周期 finding | 30 |

## 字段生命周期闭环表

| 字段 | 写口 | 读取 | reset (backToTitle / initGame) | save (_serializeG) | load (_deserializeG) | 备注 |
|---|---|---|---|---|---|---|
| `G._cityChangeLog` | 5 | 12 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._cityNeighbors` | 2 | 8 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._claimGentryHook` | 3 | 3 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._commonEnemyDiploThisTurn` | 3 | 2 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._defeatShown` | 1 | 1 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._diploActed__<dynamic>` | 3 | 2 | ✗ / ✗ | ✓ (整体) | ✓ (整体) | 顶层字段每旬不重置(玩家附庸 3 入口整局各 1 次) |
| `G._diploCD__<dynamic>` | 5 | 0 | ✗ / ✗ | ✓ (整体) | ✓ (整体) | (模板字段) |
| `G._eventCatCooldown` | 10 | 8 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._eventCooldown` | 11 | 8 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._eventFired` | 11 | 10 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._eventPromises` | 4 | 16 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._eventQueue` | 2 | 5 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._facResupply` | 2 | 2 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._factionLoyaltyDecay` | 5 | 4 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._factionSchemeCount` | 3 | 2 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._juxiaolianBonus` | 3 | 5 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._log` | 0 | 1 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._migratedThisTurn` | 5 | 3 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._movePreview` | 4 | 5 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._pendingEnvoyIntel` | 4 | 9 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._pendingEvent` | 4 | 6 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._pendingPrisoners` | 2 | 15 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._pendingRetreatResult` | 1 | 1 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._pendingSiegeAftermath` | 3 | 2 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._poachCooldown` | 2 | 3 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._poachVulnerable` | 3 | 2 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._threatBonus` | 4 | 11 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._tradeAgreements` | 6 | 12 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._tradeCD` | 4 | 7 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._victoryShown` | 2 | 3 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |
| `G._warClaimStrength` | 4 | 3 | ✗ / ✗ | ✓ (整体) | ✓ (整体) |  |

## 生命周期 findings

共 30 个 finding(每条按原则 #13 5 点闭环检查):

| # | severity | 字段 | 描述 | 候选 D 类 | 备注 |
|---|---|---|---|---|---|
| 1 | WARN | `G._cityChangeLog` | G._cityChangeLog 写入存在(5处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 2 | WARN | `G._cityNeighbors` | G._cityNeighbors 写入存在(2处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 3 | WARN | `G._claimGentryHook` | G._claimGentryHook 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 4 | WARN | `G._commonEnemyDiploThisTurn` | G._commonEnemyDiploThisTurn 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 5 | WARN | `G._defeatShown` | G._defeatShown 写入存在(1处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 6 | HIGH | `G._diploActed__<dynamic>` | G._diploActed__<dynamic> 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | D-120 | 顶层字段每旬不重置(玩家附庸 3 入口整局各 1 次) |
| 7 | WARN | `G._diploCD__<dynamic>` | G._diploCD__<dynamic> 写入存在(5处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 8 | WARN | `G._eventCatCooldown` | G._eventCatCooldown 写入存在(10处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 9 | WARN | `G._eventCooldown` | G._eventCooldown 写入存在(11处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 10 | WARN | `G._eventFired` | G._eventFired 写入存在(11处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 11 | WARN | `G._eventPromises` | G._eventPromises 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 12 | WARN | `G._eventQueue` | G._eventQueue 写入存在(2处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 13 | WARN | `G._facResupply` | G._facResupply 写入存在(2处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 14 | WARN | `G._factionLoyaltyDecay` | G._factionLoyaltyDecay 写入存在(5处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 15 | WARN | `G._factionSchemeCount` | G._factionSchemeCount 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 16 | WARN | `G._juxiaolianBonus` | G._juxiaolianBonus 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 17 | WARN | `G._migratedThisTurn` | G._migratedThisTurn 写入存在(5处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 18 | WARN | `G._movePreview` | G._movePreview 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 19 | WARN | `G._pendingEnvoyIntel` | G._pendingEnvoyIntel 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 20 | WARN | `G._pendingEvent` | G._pendingEvent 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 21 | WARN | `G._pendingPrisoners` | G._pendingPrisoners 写入存在(2处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 22 | WARN | `G._pendingRetreatResult` | G._pendingRetreatResult 写入存在(1处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 23 | WARN | `G._pendingSiegeAftermath` | G._pendingSiegeAftermath 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 24 | WARN | `G._poachCooldown` | G._poachCooldown 写入存在(2处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 25 | WARN | `G._poachVulnerable` | G._poachVulnerable 写入存在(3处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 26 | WARN | `G._threatBonus` | G._threatBonus 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 27 | WARN | `G._tradeAgreements` | G._tradeAgreements 写入存在(6处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 28 | WARN | `G._tradeCD` | G._tradeCD 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 29 | WARN | `G._victoryShown` | G._victoryShown 写入存在(2处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |
| 30 | WARN | `G._warClaimStrength` | G._warClaimStrength 写入存在(4处)但生命周期闭环不完整: reset=✗ save=✓ load=✓ | 模式 6 同模式 | - |

### 注:本 checker 是粗粒度初版,只覆盖"整局 reset"(backToTitle / initGame)语义

**已知限制**:
- ✅ save / load 整体 idiom(`JSON.stringify(G)` / `Object.keys(snap).forEach`)已识别为 ✓
- ❌ **D-120 真正的问题是"每旬末重置"(per-turn expire),不是整局 reset**
  - D-120 语义:`G._diploActed_${fid}` 在 nextTurn 末没有 `ALL_FACS.forEach(f => delete G[\`_diploActed_${f}\`])`
  - 当前 checker 不检查 per-turn expire(下个版本可加 nextTurn / processXxx 函数体扫描)
- ❌ checker 不区分"该字段应整局保存"vs"该字段应每旬重置"(语义判定靠 audit walkthrough)
- ❌ 误报:某字段已在更高层 reset 函数(如某个 `_resetXxx`)处理,本 checker 未追溯

Sprint 修 D-120 / 模式 6 时需结合 walkthrough + 代码 review 二次确认每个 finding 的真实语义。
