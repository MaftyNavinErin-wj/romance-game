# Phase 3.4 Notes — core/tick.js + core/main.js

> Sub-session:Phase 3.4(REFACTOR_PLAN_v1.md §三阶段 3)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.4-tick-main` ← `refactor/phase-3`
> 起始 commit:`83ce9c2`(Phase 3.3 完成)

---

## 一、范围(选项 C,经制作人 approve)

PLAN §二原范围:`core/tick.js` + `core/main.js` — 主循环 + 启动逻辑。

**实装范围(选项 C,scout 后 approve)**:
- **tick.js**:T3 runRebelAI + T2 runAI + T1 nextTurn + T4 fastForwardTurns + T5 stats(`_statsHistory / _STATS_MAX / pushStatsSnapshot`)
- **main.js**:M1 initGame + M2 startAs

**留 v181 等后续 sub-session**:
- M3 showTitleScreen / M4 backToTitle / M5 顶层 boot call(L31571)/ M6 _exitGame
- 全部顶层 lets(`_unitIdCounter / _fastForward / _ffTurns / _aiBattleProcessedThisTurn / _battleReports / _pending* 队列 / _techEffectCache / _supplyCache / _facInfluenceCache / _deployedGensMoraleCache / 各 render lets`)— phase 2 原则 + (a) 原则各回各家
- 各 chain 的 process*/check*/ai* mutator(~50 个)— 留 3.5-3.12 各 chain 抽

---

## 二、PLAN §二偏离记录

> 同 phase1_summary §5.3 / phase3_1_notes §二 / phase3_2_notes §二 / phase3_3_notes §二 — **记录但不改 plan**。

| PLAN 字面 | scout 实测 | 处理 |
|---|---|---|
| nextTurn | T1(376 行)✅ | 抽 |
| 主循环 | 字面笼统,实有 T2 runAI(110)+ T3 runRebelAI(62)+ T4 fastForwardTurns(44) | 抽(plan 笼统含)|
| 启动逻辑 | M1 initGame(348)+ M5 顶层 boot call(1) | M1 抽,M5 留 v181 |
| (未提)T5 stats | `_statsHistory / _STATS_MAX / pushStatsSnapshot`(21 行,nextTurn 副产物) | 抽(制作人 approve)|
| (未提)M2 startAs | 8 行,调 initGame,与 M1 成对 | 抽 |
| (未提)M3 showTitleScreen | 26 行 UI | 留 v181 |
| (未提)M4 backToTitle | 43 行,reset 20+ top-level lets | 留 v181(carry-over,见 §六) |

**实装抽离:**
- tick.js:**623 行 verbatim**(T3 66 + T2 113 + T1 379 + T4 44 + T5 21)
- main.js:**356 行 verbatim**(M1 348 + M2 8)
- 总:979 行,字面 PLAN ~824 行 → 实抽 979 行(1.19 倍,差距来源:T3/T4/T5 plan 不知)

**新工作流原则**(phase 3.3 起正式纳入,本 session 第 4 次命中):3.3 之后每个 sub-session 都要先 scout 实测,不照 plan 字面抽。

---

## 三、选项 A vs B vs C vs D 决策记录

scout 报告 4 选项,**制作人选 C(2 文件,只抽函数,顶层 lets 全留 v181)**。CC 同推 C。

| 选项 | 抽 | 优点 | 缺点 |
|---|---|---|---|
| A 1 文件合并 | tick + main 合 1 文件 | 1 个抽象边界 | 偏离 plan §二 字面("tick.js + main.js"似 2 文件);文件较大 |
| B 2 文件 + lets | 抽顶层 lets 到 tick/main | 符合 plan §二 字面 | tick + main 共享 lets,跨文件 reference 脆弱 |
| **C 2 文件 + lets 全留 v181** ✅ | 只抽函数 | verbatim + (a) + 与 3.1/3.3 风格一致;边界清晰 | M4 backToTitle 留 v181 显得割裂(但 backToTitle 操作的 20+ lets 都在 v181,留一起反而合理) |
| D 最小切割 | 不抽 T5 / M2 | 切割最小 | M2 startAs 调 initGame 拆开生硬;T5 与 nextTurn 割裂 |

**T5 抽到 tick.js**(制作人 approve 单独细节):
- 写口在 nextTurn 内(`pushStatsSnapshot()` L13397 调用 + `_statsHistory.push(snap)`)
- 留 v181 会割裂主循环
- `_statsHistory` 是 **const**,跨 script 共享需 smoke 验证(phase 3.1 锚点只覆盖 let)

---

## 四、抽离边界

### 范围:tick.js
| # | 函数 | v181 行号 | 行数 |
|---|---|---|---|
| T3 | runRebelAI | L7818-L7883 | 66 |
| T2 | runAI(含段 B Claude 调度耦合 L10371-L10402) | L10360-L10472 | 113 |
| T1 | nextTurn(含 section header) | L13160-L13538 | 379 |
| T4 | fastForwardTurns(含 section comment + jsdoc) | L14675-L14718 | 44 |
| T5 | _statsHistory + _STATS_MAX + pushStatsSnapshot(含 section header) | L14720-L14740 | 21 |
| 合计 | | | **623** |

**选项 C 关键决策**(本 session 决定):
- T3/T2/T1/T4/T5 在 tick.js 中**保持 v181 source order**(T3 → T2 → T1 → T4 → T5),不 reorder

### 范围:main.js
| # | 函数 | v181 行号 | 行数 |
|---|---|---|---|
| M1 | initGame | L5622-L5969 | 348 |
| M2 | startAs | L30045-L30052 | 8 |
| 合计 | | | **356** |

### M5 顶层 boot call 留 v181 的理由

`showTitleScreen()` 在 v181 inline `<script>` 末尾(L31571,本 session 后位置不变)。

如果搬到 main.js:main.js 作为 `<script src=>` 在 inline script 之前 parse,**parse 期 showTitleScreen 还未定义**(在 inline script L29186)→ ReferenceError。

可以包 DOMContentLoaded 解决,但**这违反 verbatim 原则**(改变了 boot 时序)。选项 C 干脆把 M5 留 v181,1 行无害。

### 段 B Claude 调度耦合(phase 3.3 留下)

phase 3.3 scout 中 B 段 = nextTurn 内 Claude 调度耦合(L10371-L10402)。本 session 抽 T2 runAI 时**自然带走整段 B**,无需单独处理。phase 3.3 留下的债清零 ✓。

---

## 五、关键设计决策

### 5.1 script 标签加载顺序

新增 2 个 script,加在 `claude_ai.js` 后、`render/notifications.js` 前:

```html
<script src="src/core/state.js"></script>
<script src="src/data/constants.js"></script>
<script src="src/data/tags.js"></script>
<script src="src/data/events.js"></script>
<script src="src/data/generals.js"></script>
<script src="src/data/cities.js"></script>
<script src="src/data/factions.js"></script>
<script src="src/core/helpers.js"></script>
<script src="src/core/hubs.js"></script>
<script src="src/core/claude_ai.js"></script>
<script src="src/core/tick.js"></script>      ← 本 session 新增
<script src="src/core/main.js"></script>      ← 本 session 新增
<script src="src/render/notifications.js"></script>
<script src="src/render/modals.js"></script>
<script src="src/render/ui_panels.js"></script>
<script src="src/render/ceremonies.js"></script>
<script src="src/render/tooltips.js"></script>
<script>...主代码 + 顶层 lets + showTitleScreen + backToTitle + boot call...</script>
```

**理由**:tick.js / main.js 中函数被定义,但调用全部发生在 runtime(button click / setTimeout / fastForwardTurns)。runtime 时 inline script 已 parse 完,所有 v181 留下的链原语 hoisted function 全局可见。

### 5.2 跨 classic `<script>` 顶层 const 共享 — 第二个验证锚点

phase 3.1 验证了 G 这个 **let** 的跨 script 共享。本 session 抽出 T5 的 `_statsHistory` 和 `_STATS_MAX` 是 **const**(不是 let),跨 script 共享理论上同 let 但需要显式验证。

**验证结果**(本 session smoke):
- `_statsHistory` 在 tick.js 声明 `const`
- v181 留 3 处 reads/writes:L14925(stats render 读)、L29003(loadFromSlot reset)、L29264(backToTitle reset)
- smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ **const 跨 classic `<script>` 共享可靠**(`.length = 0` reset 跨 script 也能写到原 binding)

**权威依据**:日后任何关于"跨 script const 共享是否可靠"的争议,以本 commit smoke PASS 作为权威验证锚点。

### 5.3 选项 C 强 verbatim 原则 — 第 4 次连续应用

| Phase | 选项风格 | 抽离比例 |
|---|---|---|
| 3.1 | 选项 A,只抽 G 本体 | 收紧 |
| 3.2 | 严格 (a) 审查,只抽真跨链 hub | 收紧 |
| 3.3 | 选项 A(制作人选),抽 9 段不抽 _execXxx + UI | 边界清晰 |
| 3.4 | 选项 C,只抽函数不抽顶层 lets | 边界清晰 |

**模式固化**:phase 3 的"边界清晰" > "切割彻底"。每个 sub-session 抽完后留下的 v181 / src 边界都干净,**不为追求"v181 减重"而硬抽 ambiguous 部分**。

---

## 六、Carry-over 备忘(本 session 不解决,记下来)

**M4 backToTitle(留 v181 L29237-L29279)是顶层 lets reset 集中点**。它当前 reset 20+ top-level lets:

```
_battleReports / _pendingBattleConfirms / _pendingSiegeArrival / _currentBattleReport
_currentBattleConfirm / _marchAnimating / _fastForward / _supplyCache
_techEffectCache / _techEffectCacheTurn / _deployedGensMoraleCache
_ovTerritoryCache / _ovTerritoryTurn / _activeOverlay / _duelChallenger
_pendingPeaceOffer / _pendingVassalOffer / _statsHistory.length / _staticMapCache
_ovBaseCache / _ovBaseTurn
```

**问题**:各 chain 阶段(3.5-3.12)抽离自家 mechanism let 时(例如 chains/military.js 抽 `_supplyCache`),需要同步处理 backToTitle 里对应的 reset 行 — 从"v181 内同 script 写自家 let"变成"v181 backToTitle 跨 script 写已抽走的 let"。

**这不是 3.4 解决的事,但 chain 阶段会反复遇到**。各 sub-session scout 时需要把"backToTitle 中本 chain 涉及的 reset 行"列出来,实装时同步处理。

---

## 七、实测数据

### 7.1 文件行数变化

| 项 | 起点(p3.3 末) | tick+main 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 32971 | **31998** | **-973 行**(-979 verbatim + 6 marker 行 + 2 script 标签新增 = -971,有 2 行差异为 awk 处理空白行的实际 effect) |
| src/core/tick.js | 0 | **733** | +733(110 header + 623 verbatim) |
| src/core/main.js | 0 | **401** | +401(45 header + 356 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 31998 = **-19.1%**,src/core/ 6 文件 2916 行(state 61 + helpers 34 + hubs 206 + claude_ai 1481 + tick 733 + main 401)。

### 7.2 smoke 验证

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.4 启动前) | 51 | ✅ identical(p3.3 已 PASS) |
| tick.js + main.js 抽离后 | 51 | ✅ identical |

**0 行为漂移**。`_statsHistory` const 跨 script 共享显式验证 ✓。baseline 仍是 `tests/baseline/phase2_complete.json`。

---

## 八、commit 清单

| commit | 内容 |
|---|---|
| (本 commit) | `refactor(p3.4): extract tick.js + main.js to src/core/` |

---

## 九、phase 3.4 完成清单

- ✅ `core/tick.js` 抽出(T3+T2+T1+T4+T5 verbatim,623 行)
- ✅ `core/main.js` 抽出(M1+M2 verbatim,356 行)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ `_statsHistory` const 跨 script 共享显式验证(第二个验证锚点固化)
- ✅ 段 B(phase 3.3 留下的 Claude 调度耦合)随 T2 自然带走
- ✅ PLAN §二偏离记录(plan ~824 → 实 979,T3/T4/T5 plan 不知)
- ✅ script 加载顺序已加 tick.js + main.js
- ✅ 选项 C 决策记录(verbatim 强 + lets 留 v181 + 与 3.1/3.3 风格一致)
- ✅ Carry-over 备忘(backToTitle reset 行 — 各 chain 阶段需同步处理)
- ⏭ 工作分支 `refactor/p3.4-tick-main` → squash merge `refactor/phase-3`

---

## 十、下一 sub-session 衔接

PLAN §三阶段 3 后续:
- 3.5-3.12 8 链(general / economy / military / politics / diplomacy / event / ethos / gentry)
  - 各 chain 抽 chain-specific function 集
  - 各 chain 收对应的 _execXxx(claude_ai.js K switch 派发到的,目前留 v181)
  - 共用查询 helper(段 L from 3.3 scout)由首个抽到的 chain 一并带走 OR 留通用 helpers.js
  - **Carry-over**:M4 backToTitle 中本 chain 涉及的 reset 行同步处理
- 3.13 收尾(含遗留分支 p3.1-state-helpers / p3.2-hubs / p3.3-claude-ai / p3.4-tick-main 统一清理 + phase summary + merge main)

phase 3.4 留给后续 sub-sessions 的债:
- M3 showTitleScreen(UI shell,phase 3 末看是否抽)
- M4 backToTitle(各 chain 同步 reset 行,见 §六)
- M5 顶层 boot call(留 v181 直到 phase 3 末重看)
- M6 _exitGame / _checkSavesForTitle(UI helper,phase 3 末看)
- 全部顶层 lets(各 chain 抽时各回各家,phase 2 原则的留 v181)
