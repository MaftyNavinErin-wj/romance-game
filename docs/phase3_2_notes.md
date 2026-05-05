# Phase 3.2 Notes — core/hubs.js

> Sub-session:Phase 3.2(REFACTOR_PLAN_v1.md §三阶段 3)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.2-hubs` ← `refactor/phase-3`
> 起始 commit:`e84e429`(Phase 3.1 完成)

---

## 一、范围(制作人 approve)

Phase 3.2 PLAN §二原范围:`core/hubs.js`(跨链 hub 函数,plan 列了 4 候选 + "易主路径 hub")。

**实装范围(经制作人 approve 收紧)**:
- 严格按已 approve 的设计原则 (a) "chain 归属看写口"做边界审查
- 实际抽出**1 函数**(`checkEventPromises`)
- 其余 3 候选属各自单链,留对应 sub-session

---

## 二、PLAN §二偏离记录

> 同 phase1_summary §5.3 / phase3_1_notes §二的处理方式 — **记录但不改 plan**。

`hubs.js` 抽离前 scout 实测,PLAN §二阶段 3.2 列名与 v181 实际结构 + 设计原则 (a) 对照后存在偏离:

| PLAN 列名 | v181 位置 | 函数体 | 调用点 | 写口 | 实测归属 | 处理 |
|---|---|---|---|---|---|---|
| `triggerFactionEvent` | L5165 | ~58 行 | 14 处 | 100% G.genFactionMod | 武将链 hub | 留 3.7 chains/general.js |
| `checkEventPromises` | L7946 | ~170 行 | 1 处(nextTurn) | 7 种 promise 跨武将+城市+豪族+事件 | **真跨链 hub** | **抽** ✅ |
| `applyEthosShock` | L13084 | ~7 行 | 30 处 | 100% G.factions[fid].ethos | 价值观链 hub | 留 3.11 chains/ethos.js |
| `_applyEthosDrift` | L13072 | ~10 行 | 11 处 | 同上 | 价值观链 mutator | 留 3.11 chains/ethos.js |
| "易主路径 hub" | — | **不存在为单一函数** | — | 散在 city.fac 赋值点 | — | 不创造,留 sprint |

实际 hubs.js 抽出 **1 函数**(`checkEventPromises`)< PLAN 估计的 4 候选 + 1 概念 hub。

判定规则(同 phase 3.1):**写口落单一链 = 单链 hub,不属真正跨链 hub**。仅当写口跨多个链 G 状态,才归 hubs.js。

---

## 三、checkEventPromises 抽离边界

### 范围:**L7945(doc comment) - L8115**(verbatim 171 行)

边界干净:开始 `/** 承诺追踪检查（每旬nextTurn中调用） */`,结束 `}`,中间无内嵌函数 / 无外部追加。

### G 读写(全部 7 字段)

`G._eventPromises` / `G.cities` / `G.units` / `G.generals` / `G.genLoyalty` / `G.loyaltyAccum` / `G.wildPool` / `G.genJoinTurn` / `G.genJoinSource` / `G.genChronicle` / `G.turn` / `G.playerFac` / `G._pendingEvent`

写口跨多个链:武将 promise(B1/B3/C2/C3/G7)+ 城市/豪族 promise(C4_unrest)+ 武将+引荐 promise(B4_delayed)。

### 反向调用(留 v181,设计原则 (c) 已 approve)

| 调用 | 来源 | 后续归属 |
|---|---|---|
| `getGenPostDef` | 武将 helper(留 v181) | 3.7 chains/general.js |
| `addGenChronicle` | 武将 helper(留 v181) | 3.7 chains/general.js |
| `addIntimacy` | 武将 helper(留 v181) | 3.7 chains/general.js |
| `_deepCloneGen` | 武将 helper(留 v181) | 3.7 chains/general.js |
| `WILD_GENS` / `GEN_MAP` / `FAC` | 数据(部分已抽 src/data/) | — |
| `_fastForward` | 兄弟 top-level let(留 v181) | 候选 tick.js |
| `log` | 已抽 src/core/helpers.js 之外的 G 读写函数(留 v181) | 后续 sub-session |
| `_showEventToPlayer` | 已抽 src/render/modals.js | — |

同 phase 2 render → mechanism 反向调用模式。设计原则 (c) 已 approve 此类副作用通道。

---

## 四、关键设计决策

### 4.1 script 标签加载顺序

`<script src="src/core/hubs.js">` 加在 `helpers.js` 后、`render/notifications.js` 前:

```html
<script src="src/core/state.js"></script>      ← 状态根
<script src="src/data/constants.js"></script>
<script src="src/data/tags.js"></script>
<script src="src/data/events.js"></script>
<script src="src/data/generals.js"></script>
<script src="src/data/cities.js"></script>
<script src="src/data/factions.js"></script>
<script src="src/core/helpers.js"></script>    ← 纯 utility
<script src="src/core/hubs.js"></script>       ← 跨链 hub(本 session 新增)
<script src="src/render/notifications.js"></script>
<script src="src/render/modals.js"></script>
<script src="src/render/ui_panels.js"></script>
<script src="src/render/ceremonies.js"></script>
<script src="src/render/tooltips.js"></script>
<script>...主代码...</script>
```

**理由**:hubs.js 调用 render 层(`_showEventToPlayer`)的函数依赖 hoisted function 全局可见性,顺序不影响运行时;但语义上 core/ 在 render/ 之前更符合"基础先出现"。

### 4.2 严格按 (a) 原则审查的样板效果

3.2 是 phase 3 第一次执行 (a) 原则严格审查。结论:**plan §二的"hubs"概念偏宽,实测 v181 后真跨链 hub 极少**。后续 3.5-3.12 各链抽离时,`triggerFactionEvent` / `applyEthosShock` 等会自然回到对应 chain,不会丢。

---

## 五、实测数据

### 5.1 文件行数变化

| 项 | 起点(p3.1 末) | hubs.js 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 34537 | **34368** | **-169 行**(-170 函数体 / 注释 + 1 script 标签新增) |
| src/core/hubs.js | 0 | **206** | +206 行(35 行 header + 171 行函数体) |

累计(phase 3 自 main 起):v181 39547 → 34368(**-13.1%**),src/core/ 共 301 行(state 61 + helpers 34 + hubs 206)。

### 5.2 smoke 验证

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.2 启动前) | 51 | ✅ identical(p3.1 已 PASS,直接基线) |
| hubs.js 抽离后 | 51 | ✅ identical |

**0 行为漂移**。baseline 仍是 `tests/baseline/phase2_complete.json`。

---

## 六、commit 清单

| commit | 内容 |
|---|---|
| (本 commit) | `refactor(p3.2): extract checkEventPromises to src/core/hubs.js` |

---

## 七、phase 3.2 完成清单

- ✅ `core/hubs.js` 抽出(1 函数 checkEventPromises,L7945-L8115 verbatim)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ PLAN §二偏离记录(4 候选 + 1 概念 → 实抽 1)
- ✅ script 加载顺序已加 hubs.js
- ✅ (a) 原则严格审查样板固化
- ⏭ 工作分支 `refactor/p3.2-hubs` → squash merge `refactor/phase-3`(等制作人 approve)

---

## 八、下一 sub-session 衔接

PLAN §三阶段 3 后续 sub-sessions:

- 3.3 `core/claude_ai.js` — getGameState / prompt / _exec 派发器
- 3.4 `core/tick.js` + `main.js` — 主循环 + 启动
- 3.5-3.12 8 链(general / economy / military / politics / diplomacy / event / ethos / gentry)
  - 3.7 chains/general.js 时收 `triggerFactionEvent` + 武将 helper(getGenPostDef / addGenChronicle / addIntimacy / _deepCloneGen)
  - 3.11 chains/ethos.js 时收 `applyEthosShock` + `_applyEthosDrift`
- 3.13 收尾

phase 3.2 留给后续 sub-sessions 的债:
- "易主路径 hub" 概念在 v181 中**不存在为函数**(散在 city.fac 赋值点)— 若后续要抽,需要先 introduce 函数,属"新设计"必须先讨论 approve
