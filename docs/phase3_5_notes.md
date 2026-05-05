# Phase 3.5 Notes — chains/ethos.js(chain 阶段第一个,模板)

> Sub-session:Phase 3.5(REFACTOR_PLAN_v1.md §三阶段 3,chain 阶段第一个)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.5-ethos` ← `refactor/phase-3`
> 起始 commit:`fba8fc2`(Phase 3.4 完成)

---

## 一、范围(经制作人 approve,5 决策点拍板)

PLAN §三阶段 3.11 字面:`chains/ethos.js(价值观链 v1.1 / 节点 27 / 9 D 类)`。

**实装范围(5 决策点全部 approve)**:
- E1 section header(L12379-L12381)
- E2 `_applyEthosDrift`(L12382-L12392)
- E3 `applyEthosShock`(L12394-L12400)
- E4 `_ethosDistance`(L12402-L12407)
- E5 `processFacEthos`(L12409-L12476)

**留 v181**:`renderEthosTab`(L15422)— phase 2 原则,modals/tabs render 留 v181

---

## 二、5 决策点记录(本 session 拍板的 chain 模板规范)

### 决策点 1:目录命名 `src/chains/`

**approve**:`src/chains/ethos.js`(新目录,与 `src/data/` `src/render/` `src/core/` 同级)

**理由**(制作人原话):plan 终态架构 4 层并列,chains 不是 core 子集。

### 决策点 2:section header 抽走

**approve**:L12379-L12381 的 3 行 `// ★ v151: 势力价值观系统` section header 随函数一起抽到 chains/ethos.js,v181 这块清净。

### 决策点 3:`_ethosDistance` 归 ethos 链

**approve**:E4 `_ethosDistance` 归 chains/ethos.js,虽然被外交链(L10876 aiDoDiplo / L12615 checkDiplo)和 render(L15466 renderEthosTab)跨文件调。

**显式记录(制作人要求)**:外交链 / render 跨文件调 `_ethosDistance`,这是设计上**认可**的"消费 ethos 数据"反向,**不是 bug**。3.8 抽外交时再次确认。

记录在三处:本文件(本节)/ commit message / `chains/ethos.js` header §"特别说明"。

### 决策点 4:script 加载顺序按依赖方向

**approve**:加载顺序反映依赖方向 = `data/* → core/* → chains/* → render/* → inline`。

具体:`<script src="src/chains/ethos.js">` 插在 `core/main.js` 之后、`render/notifications.js` 之前。

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
<script src="src/core/tick.js"></script>
<script src="src/core/main.js"></script>
<script src="src/chains/ethos.js"></script>      ← 本 session 新增
<script src="src/render/notifications.js"></script>
<script src="src/render/modals.js"></script>
<script src="src/render/ui_panels.js"></script>
<script src="src/render/ceremonies.js"></script>
<script src="src/render/tooltips.js"></script>
<script>...inline 主代码 + 留 v181 的部分...</script>
```

**理由**:加载顺序反映依赖方向(chains 调 core 在 core 后,render 调 chains 在 chains 后)。

后续 7 chain(gentry / politics / diplomacy / economy / event / military / general)同位置加,chains/ 内顺序无关(各 chain self-cohesive)。

### 决策点 5:chains/ethos.js header 模板 6 项(本 session 起 chain 阶段所有 chains/*.js 必含)

**approve**:CC 推荐 5 项 + 制作人加 1 项 = 6 项必含:

1. **来源**(v181 行号 + 抽离方式 verbatim 声明)
2. **抽离范围 + 留 v181 部分**
3. **写口归属声明**((a) 原则核心,审计一眼可验)— **制作人新增项**
4. **反向调用清单**(callers + callees,按归属链整理)
5. **plan §二 偏离记录**(commit + header + sub-session notes 三处留档)
6. **script 加载位置 + 模板说明**

**理由**(制作人原话):(a) 原则核心是"写口归 chain",header 显式声明后任何后续 audit 一眼能验证。

**模板生效范围**:本 session 起 chain 阶段所有 chains/*.js(7 个后续:gentry / politics / diplomacy / economy / event / military / general)必须含此 6 项 header。

---

## 三、写口归属声明(本 chain 主要写口)

按 (a) 原则,本 chain 主要写口 100% 落:
- `G.factions[fid].ethos[dim]`(5 维:mandate / power / civil / military / strategy)
- `G.factions[fid]._ethosLog`(漂移日志,push + 100 上限 shift)
- `G.factions[fid]._ethosSnap`(每旬城数快照)

写口由 E2 `_applyEthosDrift` **单点写入**(E3 委托 E2,E5 委托 E2);E5 额外写 `G.factions[fid]._ethosSnap`。**100% 落 ethos G subtree,(a) 严格满足**。

---

## 四、PLAN §二偏离记录

> 同 phase1_summary §5.3 / phase3_1_notes §二 / phase3_2_notes §二 / phase3_3_notes §二 / phase3_4_notes §二 — **记录但不改 plan**。

PLAN §三阶段 3.11 字面:`chains/ethos.js(价值观链 v1.1 / 节点 27 / 9 D 类)`,~95 行。

scout 实测 + 实装:E1+E2+E3+E4+E5 verbatim = **98 行**,plan 字面与实测**高度一致**。

**phase 3.3 起 scout-before-extract 第 5 次应用,第 1 次 plan 字面与实测高度一致**。这是 ethos 适合做 chain 抽离模板的核心原因 — 几乎没有 plan-vs-reality gap,可专注于 chain 抽离 pattern 本身的设计决策(5 决策点)。

---

## 五、跨链引用(verbatim 不改)

### 本 chain 被外部链调用(~30 callers,跨链反向 (c) 已 approve)

| 归属链 | 行号 | 调用 |
|---|---|---|
| 武将链(留 v181 等 3.12) | L4690-L4708 | appointGenPost / dismissGenPost |
| 政治链(留 v181 等 3.7) | L5401-L5407 / L11918 / L11925 | _applyCourtDecisions(7 处朝议)+ doEnthrone(2 处称帝)|
| 经济链(留 v181 等 3.9) | L5867-L5868 / L6098-L6099 | executeMigration / _aiConsiderMigration(强迁人口) |
| 外交链(留 v181 等 3.8) | L10654 / L10949-L10953 / L11804-L11807 | diploAlly / aiDoDiplo / applyWarDeclarationEffects |
| 军事链(留 v181 等 3.11) | L12505 / L21906 | _applySiegeAftermath / resolveBattle |
| 事件链(events 数据已抽 src/data/events.js) | ~20 处 | effect 内 applyEthosShock 调用 |
| claude_ai.js(已抽) | L29931 / L29954 | _execDeclareWar / _execProposeAlliance |

### `_ethosDistance` 跨文件调(决策点 3 显式认可)

| 调用方 | 行号 | 用途 |
|---|---|---|
| 外交链(留 v181 等 3.8) | L10876 | aiDoDiplo 用作 boost 系数 |
| 外交链(留 v181 等 3.8) | L12615 | checkDiplo 用作 ally rel decay |
| render(留 v181) | L15466 | renderEthosTab 显示距离 |

**显式认可**:这 3 处跨文件调是设计上认可的"消费 ethos 数据"反向,**不是 bug**。3.8 抽外交时再次确认。

### `processFacEthos` 调用方

- src/core/tick.js L513:`ALL_FACS.forEach(fid => processFacEthos(fid));`(每旬调用)— 已抽,跨 script 反向调用 (c) 已 approve

### 本 chain 调外部(callees)

- `calcFactionInfluence(fid)`(政治链,留 v181 等 3.7)— E5 内调用
- `showNotif`(已抽 src/render/notifications.js)— E3 内调用
- `ETHOS_LABELS / ETHOS_DIM_NAMES`(已抽 src/data/tags.js)
- `GEN_TAGS`(已抽 src/data/tags.js)— E5 内调用
- `ALL_FACS / G(状态根)`(已抽)

---

## 六、Phase 3 全局 carry-over 验证

| Carry-over | 本 chain 触发 |
|---|---|
| backToTitle reset 行(3.4 carry-over) | **0 行**涉及 ethos(state 全在 G 子树,initGame 整体重置时已覆盖) |
| map.js 决策(总 scout carry-over) | 无关 |
| _execXxx 派发 | 0 个(claude_ai.js K switch 不调 ethos)|

ethos 是**最干净的 chain**,0 个 phase 3 全局 carry-over 触发。这是它适合做模板的另一原因。

---

## 七、实测数据

### 7.1 文件行数变化

| 项 | 起点(p3.4 末) | ethos 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 31998 | **31903** | **-95 行**(-98 verbatim + 1 marker + 1 script 标签新增 = -96,有 1 行差异为 awk 处理空白行 effect) |
| src/chains/ethos.js | 0 | **172** | +172(74 header + 98 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 31903 = **-19.3%**。
src/ 现状:7 文件 3088 行(state 61 + helpers 34 + hubs 206 + claude_ai 1481 + tick 733 + main 401 + ethos 172)。

### 7.2 smoke 验证

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.5 启动前) | 51 | ✅ identical(p3.4 已 PASS) |
| ethos.js 抽离后 | 51 | ✅ identical |

**0 行为漂移**。baseline 仍是 `tests/baseline/phase2_complete.json`。

---

## 八、commit 清单

| commit | 内容 |
|---|---|
| (本 commit) | `refactor(p3.5): extract ethos chain to src/chains/ethos.js (chain 阶段第一个,模板)` |

---

## 九、phase 3.5 完成清单

- ✅ `chains/ethos.js` 抽出(E1-E5 verbatim,98 行 + 74 header)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 5 决策点全部 approve + 文件 header / commit / 本文件三处留档
- ✅ chain 抽离模板 6 项 header 规范固化(决策点 5)
- ✅ script 加载顺序规范固化(决策点 4):`data/* → core/* → chains/* → render/* → inline`
- ✅ `_ethosDistance` 跨文件消费 ethos 数据 — 显式认可,3.8 再次确认(决策点 3)
- ✅ 0 backToTitle reset / 0 map.js / 0 _execXxx — phase 3 全局 carry-over 0 触发
- ✅ plan 字面与实测高度一致(scout-before-extract 第 5 次,第 1 次高度一致)
- ⏭ 工作分支 `refactor/p3.5-ethos` → squash merge `refactor/phase-3`

---

## 十、下一 sub-session 衔接

**3.6 chains/gentry.js**(豪族链,Wave 1 第二个):
- 14 函数(L4129-L4211 / L11971-L12100 / L12120 / L12319 / L12479-L12537)
- 含战斗 aftermath 子集(_applySiegeAftermath / showSiegeAftermathChoice / _onSiegeAftermath)
- 0 _exec / 0 backToTitle reset
- 用本 session 固化的 6 项 header 模板 + 加载顺序规范

phase 3.5 留给后续 sub-sessions 的债:
- 3.8 抽外交时确认 `_ethosDistance` 跨文件调用是设计认可(决策点 3)
- 3.10 抽事件时确认 events.js 中 ~20 处 applyEthosShock 调用是设计认可
