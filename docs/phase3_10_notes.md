# Phase 3.10 Notes — chains/event.js(chain 模板第六应用,Wave 3 第一个)

> Sub-session:Phase 3.10(REFACTOR_PLAN_v1.md §三阶段 3,Wave 3 第一个)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.10-event` ← `refactor/phase-3`
> 起始 commit:`880b6a2`(Phase 3.9 完成,Wave 2 收尾)

---

## 一、范围(自决,scout 四件验证 PASS)

PLAN §三阶段 3.10(原)字面:`chains/event.js(事件链 v4 / ~7 函数)`。

**实装范围**:1 段连续 verbatim **8 函数**(master scout 估 7,_popEventQueue 漏数 1)。

| 段 | v181 行号 | 函数 |
|---|---|---|
| EV1 事件链整段 | L5420-L5747 | `checkRebellions / _triggerMinorRebellion / _triggerMajorRebellion / processEventCooldowns / processPlagueSpreads / rollEventsV2 / _popEventQueue / resolveEventChoice` |

**留 v181 / 已抽其他文件**:
- `_showEventToPlayer`(已抽 src/render/modals.js,phase 2 时)
- 事件 modal HTML 构造(已在 src/render/modals.js)
- `EVENT_DEFS / AI_PERSONALITY / EVENT_CAT_COOLDOWN / SEASONS`(已抽 src/data/events.js + seasons.js,phase 1)
- 事件 effects 跨链 hub 函数(已抽各 chain):`applyEthosShock / addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud / addMerit / appointGenPost / setFactionRuler / startTechResearch / _aggregateGentry / applyFamilyLoyaltyShock`
- `triggerFactionEvent / applyLoyaltyEvent`(武将链 hub,留 3.12)

---

## 二、写口归属声明

**本 chain 主要写口**:
- `G._eventQueue / G._eventCooldown / G._eventCatCooldown / G._eventFired / G._pendingEvent`(事件 state)
- `G.cities[id].rebellionCooldown / .minorRebellionCooldown / .majorRebellionCooldown`(叛乱冷却)
- `G.cities[id].plague / .plagueTurns`(疫病 state)
- `G.cities[id].fac / .morale / .pop / .garrison / .occupied`(叛乱触发时易手 / 屠杀)
- `G.units`(叛乱触发时 spawn rebel 野战部队)

**跨链副作用写口**(整函数归事件):
- `_triggerMinorRebellion`:写 `G.units`(spawn rebel 野战部队 — 军事 state)。叛乱触发是事件机制核心,**3.11 抽军事不反取**
- `_triggerMajorRebellion`:写 `G.cities[id].fac = 'rebel'`(经济城市归属变更)+ 调 `clearAllPostsByGen`(政治)+ 调 `clearPrefectByGen`(武将)。城市易手是叛乱机制核心,**3.9 经济不反取 / 3.12 武将不反取**
- `processPlagueSpreads`:写 `city.plague / .plagueTurns / .morale`(经济边界)。疫病主写口在事件
- `rollEventsV2 / resolveEventChoice`:调 `effect()` 闭包(已抽 src/data/events.js),效果落各链已抽 hub。本 chain 函数体内**不直接写跨链 G subtree**

---

## 三、Wave 3 起点关键观察

事件链是 master scout §5 推荐顺序的核心 — **事件链放 Wave 3 开头**:

| 关键事实 | 现状(p3.10 启动前)|
|---|---|
| 各前置链已抽完 | ethos / gentry / politics / diplomacy / economy 全部已抽 |
| 事件 effects 跨链 hub | 全部已抽到对应 chain(applyEthosShock / addDiplo / addMerit 等)|
| 本 chain 函数体内跨链写口 | **无**(rebellions 的 G.units / city.fac 写口除外,叛乱机制核心整函数归事件)|
| effect 闭包跨链调用 | 在 src/data/events.js 内,通过已抽 hub,反向调用 (c) 容许 |

这印证 master scout §5 修订(2026-05-05 制作人 approve):**事件链从 Wave 1 移到 Wave 3 开头**的核心理由 — 事件 effects 写口归属此时全部明确,不需要回头改。

---

## 四、跨链 carry-over 验证(PASS)

| Carry-over 来源 | 验证项 | 结果 |
|---|---|---|
| §3.5 | events.js ~20 处 `applyEthosShock` 是反向调用,已抽 ethos | ✓ EVENT_DEFS effect 闭包通过 hub 调用 |
| §3.7-§3.9 | 事件 effects 多处调 `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud / addMerit / appointGenPost / setFactionRuler / startTechResearch` | ✓ 全部已抽对应链,反向调用 OK |
| §3.7 | events.js 不"反取"政治写口(addMerit 等) | ✓ 通过 hub 调,不直接写 G.genMerit |

---

## 五、scout 四件验证应用记录

p3.8 沉淀的 scout 四件验证(原则 #9),p3.9 验证 0 bug,本 session 继续 0 bug:

| 验证项 | 本 session 应用 | 发现 |
|---|---|---|
| (a) `awk 'NR>=A && NR<=B && /^function /'` 列范围内所有 function | ✓ L5400-L5800 范围 awk | 8 个事件链函数全部范围内,L5764 起 `aiGetAvailableGens` 是军事链(留 3.11),正确分离 |
| (b) `grep -n "^}"` 验证每段最后函数真实 closing | ✓ 验证 resolveEventChoice closing 在 L5747 | 1 段精确 |
| (c) build 脚本 banner 终止标记 | ✓ banner = `\n// ════ // ── EV1` | idempotent 重跑无 doubled |
| (d) 函数名带 chain 前缀按主写口判定 | ✓ rebellions 写 G.units / city.fac 是叛乱机制核心,整函数归事件(不归军事/经济)| 0 实装就地修正 |

**0 个 bug**(p3.8 4 bug → p3.9 0 bug → p3.10 0 bug,沉淀有效)。

---

## 六、PLAN §二偏离

PLAN 字面:~7 函数。
实测 + 实装:**8 函数**。
偏差小,主因:`_popEventQueue` 是事件队列出列 helper,与 rollEventsV2 + resolveEventChoice 配对,master scout 漏数 1。

scout-before-extract 第 10 次应用,Wave 3 起点最小 chain。

---

## 七、跨链反向调用(c) 已 approve

### 本 chain 被外部链调用(callers)

| 归属链 | 调用 |
|---|---|
| core(已抽) | `src/core/tick.js` 每旬调用 `processEventCooldowns / processPlagueSpreads / rollEventsV2 / checkRebellions / _popEventQueue` |
| render(已抽 src/render/modals.js) | 事件 modal 按钮 onclick 调 `resolveEventChoice` |
| 经济链(已抽 chains/economy.js) | `_triggerMinorRebellion / _triggerMajorRebellion` 被 `processCityFood / processMorale / processPop / aiDoBuild` 等触发(实际是 checkRebellions 触发,反向调用 OK)|

### 本 chain 调外部(callees)

- `EVENT_DEFS / AI_PERSONALITY / EVENT_CAT_COOLDOWN / SEASONS / PLAGUE_SPREAD_PROB`(已抽 src/data/)
- `_showEventToPlayer`(已抽 src/render/modals.js)
- `triggerFactionEvent / applyLoyaltyEvent`(武将链 hub,留 v181 等 3.12)
- `clearAllPostsByGen / setFactionRuler`(已抽 chains/politics.js)
- `getUnitTroops / createUnit / hkey`(军事链,留 v181 等 3.11)
- `clearPrefectByGen`(武将链,留 v181 等 3.12)
- `log / fmt / showNotif`(已抽 src/render/notifications.js)
- `safeSub`(已抽 src/core/helpers.js)
- 数据 / 常量(部分已抽 src/data/,部分留 v181)

---

## 八、Phase 3 全局 carry-over 验证

- **backToTitle reset**:0 行(事件 state 全在 G subtree,跟随 G 自动 reset)
- **map.js 决策**:无关
- **_execXxx 派发**:0 个(事件 effects 不通过 _exec)

---

## 九、实测数据

| 项 | 起点(p3.9 末) | event 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 27753 | **27427** | **-326 行** |
| src/chains/event.js | 0 | **472 行** | +472(140 header + 332 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 27427 = **-30.7%**(突破 -30% 大关 ✓)。
src/ 现状:12 文件 8618 行(core 6 文件 2916 + chains 6 文件 5702)。

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.10 启动前) | 51 | ✅ identical(p3.9 已 PASS) |
| event.js 抽离后 | 51 | ✅ identical |

---

## 十、phase 3.10 完成清单

- ✅ `chains/event.js` 抽出(1 段连续 verbatim ~328 行 + 140 header)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 6 项 header 模板完整(含写口归属声明 + Wave 3 起点说明)
- ✅ 加载顺序规范(chains/event.js 在 chains/economy.js 之后)
- ✅ phase 2 原则:`_showEventToPlayer` modal 已在 render/modals.js
- ✅ 跨链 carry-over §3.5 + §3.7-§3.9 全部验证 PASS
- ✅ 0 个 _exec / 0 backToTitle reset / 0 map.js
- ✅ Node 双脚本(共享 ranges 数组)预防 awk 边界 + 字符替换 bug
- ✅ scout 四件验证全部 PASS,**0 个实装阶段 bug**(p3.8→p3.9→p3.10 连续 0 bug)
- ✅ **突破 -30% 减重大关**
- ⏭ 工作分支 `refactor/p3.10-event` → squash merge `refactor/phase-3`

---

## 十一、Wave 3 进度

| Sub-session | Chain | 函数数 | v181 减重 | bug | 状态 |
|---|---|---|---|---|---|
| 3.10 | event | 8 | -326 行 | 0 | ✅ done |
| 3.11 | military | ~200 (粗) | TBD | TBD | ⏸ 制作人介入(最大 chain) |
| 3.12 | general | ~70 mutator | TBD | TBD | ⏸ 制作人介入(中心枢纽) |

3.11 / 3.12 是最大两 chain,按 master scout §5 + 状态 memory 标记**制作人介入点**(非自决)。

---

## 十二、下一 sub-session 衔接

**3.11 chains/military.js**(军事链,Wave 3 第二个,**最大 chain**):
- 估 ~200 函数(粗算,含动画 / modal / UI)
- 严格按 (a) 写口审查后,**纯 mechanism mutator ~70-80 个**;其余动画 / modal / UI 是 phase 2 原则候选留 v181
- 9 _exec / 11 backToTitle reset
- **map.js 决策点**:hex / fog / pathfinding(L1589-L2623,~34 函数)是地图基础设施,3.11 启动时正式讨论是否单独抽到 `src/core/map.js`(候选第三个 carry-over)
- **制作人介入**(状态 memory 标记)

phase 3.10 留给后续 sub-sessions 的债:
- 3.11 抽军事:`_triggerMinorRebellion` 写 `G.units` 是叛乱副作用,**军事链不反取**;`createUnit / hkey / getUnitTroops` 在本 session 反向调,3.11 时这些真函数归军事
- 3.12 抽武将:`clearPrefectByGen` 在本 session 反向调,3.12 时真函数归武将;`triggerFactionEvent / applyLoyaltyEvent` 在本 session + 各 effect 闭包反向调,3.12 时真函数归武将
- 3.9 carry-over 验证完成:`_triggerMajorRebellion` 写 `city.fac = 'rebel'` 是叛乱副作用,经济链已知不反取
