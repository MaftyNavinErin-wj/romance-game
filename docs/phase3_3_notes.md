# Phase 3.3 Notes — core/claude_ai.js

> Sub-session:Phase 3.3(REFACTOR_PLAN_v1.md §三阶段 3)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.3-claude-ai` ← `refactor/phase-3`
> 起始 commit:`4f962a0`(Phase 3.2 完成)

---

## 一、范围(选项 A,经制作人 approve)

Phase 3.3 PLAN §二原范围:`core/claude_ai.js — getGameState / prompt 构建 / _exec 派发器 / Claude API 调用(独立模块,根治 D-099/D-100/D-121/D-130)`。

**实装范围(经 scout + 制作人 approve 选项 A,字面 ~860 行 → 实抽 ~1399 行)**:
- C `_claudeAI` 状态根(top-level let)
- D 情报+战略+决策节奏 helper(v159 Phase 5,plan 不知)
- E `_tacticalSystemPrompt` 战术 prompt
- F `getGameState` 快照核心
- G `_claudeSystemPrompt` 战略 prompt
- H API 调用层(callClaudeAPI / callClaudeArtifact / 2 parser)
- I 测试/调试工具(testClaudeAI / inspectState / setClaudeKey)
- J `executeClaudeActions` 行动执行入口
- K `_execOneAction` switch 派发器

**留 v181 等后续 sub-session**:
- A HTML 按钮 + tab help(L601 / L29694-L29706)— UI shell
- B nextTurn 主循环内调度耦合块 — 留 3.4 tick.js
- L 解析器 _resolveCityId 等 5 个 — 留 3.5-3.12 共用判断
- M 39 个 _execXxx 函数 — 按 (a) 原则各回各 chain(3.5-3.12)
- N UI 模态 + API key + ping(247 行)— phase 2 已 approve "modals 留 v181"

---

## 二、PLAN §二偏离记录

> 同 phase1_summary §5.3 / phase3_1_notes §二 / phase3_2_notes §二 — **记录但不改 plan**。

PLAN 字面 vs scout 实测:

| PLAN 字面 | scout 实测(commit `4f962a0` 上) | 处理 |
|---|---|---|
| getGameState | ✅ 段 F(307 行) | 抽 |
| prompt 构建 | ✅ 段 E + G(327 行,prompt **复数**:战略 + 战术 2 个) | 都抽 |
| _exec 派发器 | ✅ 段 K(57 行 switch) | 抽(选项 A 含此) |
| Claude API 调用 | ✅ 段 H(169 行,Anthropic + OpenAI 双格式 + 2 parser) | 抽 |
| (未提)状态根 | ⚠ 段 C(21 行 `_claudeAI` top-level let) | 抽(基础设施) |
| (未提)情报+战略+决策节奏 | ⚠ 段 D(440 行,**v159 Phase 5 加,plan v1.0 不知**) | 抽(配套读路径) |
| (未提)test/inspect | ⚠ 段 I(43 行) | 抽(伴随工具) |
| (未提)executeClaudeActions | ⚠ 段 J(33 行,流水线一环) | 抽(选项 A 含此) |
| (未提)39 个 _execXxx | 段 M(624 行,**(a) 原则各归对应 chain**) | 留 v181 等 3.5-3.12 |
| (未提)UI 模态 | 段 N(247 行,phase 2 已 approve modals 留 v181) | 留 v181 |

**实装抽离:1399 行 verbatim ≈ plan 字面估算 860 行 × 1.6 倍**。差距来源:plan v1.0(2026-05-04)写于 v159 之前,v181 已经长出 plan 不知道的代码(段 D 440 行就是例子)。

---

## 三、选项 A vs D 决策记录

scout 报告 4 选项(A 严格 / B 全集中 / C 改名分层 / D 读路径优先),CC 推荐 D,**制作人选 A**。理由(制作人原话):

1. **流水线完整性**:Claude → H parse → J execute → K dispatch → M。J + K 与 D 段 / H 段是**一条流水线**。D 选项把 J + K 留 v181 拦腰切流水线,plan 没安排后续收口的 session
2. **(a) 原则共同满足**:39 个 _execXxx(段 M)按 chain 归位,A 和 D 都满足(都不抽 M)
3. **D-100 根治**:`_exec 派发器漏 enthrone case` 的 bug 在 K 里。A 抽 K 才能配合 audit 后续根治。D 不抽 K → audit 时 bug 还散在 v181
4. **抽象边界清晰**:抽完后 claude_ai.js 是一个完整的"AI 决策与派发层",跨过这层就是各 chain 的"AI 写 G"地盘,模块边界一刀切开

**记录原则**:CC 推荐 D 时主要顾虑是"D 的读路径已 100% 收口 D-099 信息暴露面",但忽略 J + K 的流水线完整性。A 不仅满足读路径收口,还把派发层一并搬走,边界更干净。**结论:制作人的判断更对**。

---

## 四、claude_ai.js 抽离边界

### 范围:**v181 L30669-L32067**(verbatim 1399 行)

边界干净:
- 起始 L30669 = 段 C 上面的 section header `// ═══...`
- 结束 L32067 = 段 K(`_execOneAction`)的 closing `}`
- 中间无外部追加 / 无内嵌不属本范围的函数

### 反向调用(留 v181,设计原则 (c) 已 approve)

claude_ai.js 抽出后仍会反向调用 v181 留下的:

| 类组 | 调用 | 后续归属 |
|---|---|---|
| K switch 派发到 M | `_execBuild / _execSetTax / ... / _execEnthrone`(39 个) | 3.5-3.12 各 chain |
| 共用查询 helper | `_resolveCityId / _resolveFacId / _findUnit / _genInFac / _genDeployed`(5 个) | 3.5-3.12 共用判定后归 |
| 链原语(读) | `getCityProd / getCityFoodNet / getCityFoodTurns / calcCityCorruption / getCityStats / getSiegeDefMult / aiFrontierEnemyCities / hexDist / calcUnitAP / getUnitTroops / getUnitNodeId / getStrategistInt / fuzzyTroopDisplay / effectivePowerAgainst / getReadyClaim / getAvailableClaims / _aiGetThreatMatrix / hkey / getScoutINT / getFacUnitSalary / canAffordTech / canAffordMat / ensureCityNeighbors` | 各对应 chain 抽时归 |
| 数据 + 全局常量 | `FOG_VISIBLE / ROAD_ADJ / CITY_MAP / GEN_MAP / GEN_TAGS / TECH_TREE / BLDS / FAC / ALL_FACS / TAX / CLAIM_TYPES / REPUTATION_DEFAULT / MAX_FIELD_UNITS_ABS` | 部分已抽 src/data/,其余等 phase 3 后续 |
| 状态根 | `G` | 已抽 src/core/state.js |
| 通知通道 | `log / showNotif / _showEventToPlayer` | 已抽 src/render/ + src/core/helpers.js |

同 phase 2 render → mechanism 反向调用模式,(c) 已 approve。

### D-099/D-100/D-121/D-130 信息暴露面收口

4 个 HIGH 是 Claude AI 信息暴露面(读路径)。本 session 抽完后:
- F getGameState(307)+ G _claudeSystemPrompt(264)+ E _tacticalSystemPrompt(63)+ D 各 builder(440)= **信息暴露面 100% 收口在 claude_ai.js**
- 后续 audit sprint 改信息暴露面只动 1 个文件

---

## 五、关键设计决策

### 5.1 script 标签加载顺序

`<script src="src/core/claude_ai.js">` 加在 `hubs.js` 后、`render/notifications.js` 前:

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
<script src="src/core/claude_ai.js"></script>    ← 本 session 新增
<script src="src/render/notifications.js"></script>
<script src="src/render/modals.js"></script>
<script src="src/render/ui_panels.js"></script>
<script src="src/render/ceremonies.js"></script>
<script src="src/render/tooltips.js"></script>
<script>...主代码 + L 解析器 + M 39 个 _execXxx + N UI 模态...</script>
```

**理由**:claude_ai.js 中 K switch 派发到 M 的 _execXxx 函数,M 仍在 v181 主 `<script>` 块内。classic <script> 间 hoisted function 全局可见,跨 script 顺序对 hoisted function 调用无关紧要,运行时由 JS 引擎解析。phase 3.1 + 3.2 smoke 已反复验证。

### 5.2 `_claudeAI` top-level let 跨 script 共享

`_claudeAI` 是 top-level let,**兄弟于 G,不属 G 子树**。同 phase 3.1 抽 G 的"跨 classic <script> 顶层 let 共享"验证锚点(state.js header §"重要验证锚点"),phase 3.1 / 3.2 smoke 已反复验证可靠。

### 5.3 选项 A 而非 D — 流水线完整性优先于"最小切割"

phase 3.1 是"最小切割"(选项 A 只抽 G 本体)。phase 3.2 是"严格 (a) 审查"(只抽 1 真跨链 hub)。phase 3.3 不同:**当抽离边界遇到流水线时,流水线完整性优先于"最小切割"**。J + K 单独不构成新的写入语义,它们是 H(Claude 返回)→ J(execute)→ K(dispatch)→ M(chain mutator)的中间环节。把中间环节留 v181 = 强行制造未来某个 session 的清理债。选项 A 一并抽走,留下 M(各回各 chain)+ N(UI 模态)+ L(共用查询 helper)是天然的、干净的边界。

---

## 六、新工作流原则(本 session 起正式纳入)

> **plan 写于 v159 之前,实际 v181 已经长出很多 plan 不知道的代码**(段 D 440 行就是例子)。3.3 之后每个 sub-session 都要先 scout 实测,**不能照 plan 字面抽**。

**适用范围**:phase 3 后续所有 sub-sessions(3.4 tick.js + main.js / 3.5-3.12 8 chains / 3.13 收尾)。

**操作规范**:
1. 每个 sub-session 启动后,先做 boundary scout(read-only,不动手)
2. scout 报告必含:代码块位置清单 + G 读写性质 + 跨 chain 引用情况 + plan §二实测偏离 + 抽离方案选项(若 >1 种)
3. 制作人 approve 后才开 working branch 实装

**为什么必须**:
- phase 3.1 已经命中过 1 次(safeAdd / 数组工具不存在)
- phase 3.2 已经命中过 1 次(plan 4 候选 + 1 概念,实际只有 1 真跨链 hub)
- phase 3.3 命中第 3 次(plan 字面 ~860 行,scout 实测 ~1399 行,多出 v159 Phase 5 整层 440 行)
- 三次都同模式 → 应该正式化,不是个案

---

## 七、实测数据

### 7.1 文件行数变化

| 项 | 起点(p3.2 末) | hubs.js 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 34368 | **32971** | **-1397 行**(-1399 verbatim + 1 marker + 1 script 标签新增) |
| src/core/claude_ai.js | 0 | **1481** | +1481 行(82 行 header + 1399 行 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 32971(**-16.6%**),src/core/ 共 4 文件 1782 行(state 61 + helpers 34 + hubs 206 + claude_ai 1481)。

### 7.2 smoke 验证

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.3 启动前) | 51 | ✅ identical(p3.2 已 PASS,直接基线) |
| claude_ai.js 抽离后 | 51 | ✅ identical |

**0 行为漂移**。baseline 仍是 `tests/baseline/phase2_complete.json`。

---

## 八、commit 清单

| commit | 内容 |
|---|---|
| (本 commit) | `refactor(p3.3): extract Claude AI decision+dispatch layer to src/core/claude_ai.js` |

---

## 九、phase 3.3 完成清单

- ✅ `core/claude_ai.js` 抽出(C+D+E+F+G+H+I+J+K verbatim,1399 行)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ PLAN §二偏离记录(plan ~860 行 → 实抽 1399 行,v159 Phase 5 整层多出)
- ✅ script 加载顺序已加 claude_ai.js
- ✅ 选项 A vs D 决策记录(制作人选 A 的 4 条理由固化)
- ✅ D-099/D-100/D-121/D-130 信息暴露面 100% 收口在 claude_ai.js
- ✅ **新工作流原则:每个 sub-session 必须先 scout,不能照 plan 字面抽**
- ⏭ 工作分支 `refactor/p3.3-claude-ai` → squash merge `refactor/phase-3`

---

## 十、下一 sub-session 衔接

PLAN §三阶段 3 后续:
- **3.4** `core/tick.js` + `main.js` — 主循环 + 启动
  - 含本 session 留下的段 B(L10371-L10402 nextTurn 内调度耦合 32 行)
- 3.5-3.12 8 链(general / economy / military / politics / diplomacy / event / ethos / gentry)
  - 各 chain 抽时收对应的 _execXxx(段 M 39 个)
  - 共用查询 helper(段 L)由首个抽到的 chain 一并带走 OR 留通用 helpers.js,等 3.5 第一个 chain sub-session 实测
- 3.13 收尾

phase 3.3 留给后续 sub-sessions 的债:
- 段 A 顶部按钮 + tab help(UI shell,phase 3 末看是否抽 / 留 v181)
- 段 N UI 模态 + API key + ping(phase 2 原则留 v181,phase 3 末复盘)
- 段 M 39 个 _execXxx(各 chain 收)
- 段 L 5 个解析器(留 phase 3 末 OR 第一个 chain sub-session 决定)
- 段 B nextTurn 调度耦合(3.4 tick.js)
