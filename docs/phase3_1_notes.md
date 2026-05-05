# Phase 3.1 Notes — core/state.js + core/helpers.js

> Sub-session:Phase 3.1(REFACTOR_PLAN_v1.md §三阶段 3)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.1-state-helpers` ← `refactor/phase-3` ← `main`
> 起始 commit:`7568431`(phase-2 已 merged 到 main)

---

## 一、范围(制作人 approve)

Phase 3.1 PLAN §二原范围:`core/state.js`(G 顶层状态 + 初始化)+ `core/helpers.js`(safeSub/safeAdd/数组工具等)。

**实装范围(经制作人 approve 收紧)**:
- `state.js`:**选项 A**,只抽 `let G = {...}` 本体 + 直接初始化字段。`initGame()` + `_unitIdCounter` 等兄弟 top-level lets **留 v181**。
- `helpers.js`:**选项 B**,纯 utility(无 G 依赖)抽,任何 G 引用一律留 v181 等后续 sub-session 归到对应 chain。

---

## 二、PLAN §二偏离记录

> 同 phase1_summary §5.3 的处理方式 — **记录但不改 plan**。

`helpers.js` 抽离前 grep 实测,PLAN §二列名与 v181 实际结构存在偏离:

| PLAN 列名 | v181 实测 | 处理 |
|---|---|---|
| `safeSub` | ✅ L17035 单行,纯函数 | **抽** |
| `safeAdd` | ❌ **不存在**(grep 0 命中) | 不抽。v181 直接用 `+=` 内联累加,无独立函数 |
| 数组工具(clamp/sum/avg/sumBy/range/deepCopy) | ❌ **未发现独立顶层 utility**(grep 0 命中) | 不抽。所有数组操作内联在调用点 |

实际 helpers.js 抽出 **3 函数**(`fmt` / `sleep` / `safeSub`)< PLAN 估计的"safeSub/safeAdd + 数组工具"。

---

## 三、helpers.js 抽离逐函数 grep 报告

判定规则(制作人定):**任何 G 引用一律留 v181**,等后续 sub-session 归到对应 chain。

| 函数 | 位置 | G 读 | G 写 | DOM | 判定 |
|---|---|---|---|---|---|
| `fmt(n)` | L16711 | ❌ | ❌ | ❌ | **抽** — 纯函数(数字格式化) |
| `sleep(ms)` | L16718 | ❌ | ❌ | ❌ | **抽** — 纯函数(Promise 延时) |
| `safeSub(res,key,amount)` | L17035 | ❌(参数 res 由调用方注入) | ❌ | ❌ | **抽** — 纯函数 |
| `log(msg,type)` | L16693 | ✅ G.logs | ✅ G.logs.unshift/pop | ✅ .elog innerHTML | 留 v181(读写 G + DOM) |
| `updateFacStats()` | L16700 | ✅ G.factions/cities/units | ✅ G.factions[fid].cityCount/totalTroops/totalPop | ❌ | 留 v181(已 phase 2 决定) |

---

## 四、state.js 抽离边界

### G 范围:**L3489 - L3519**(verbatim 31 行)

边界干净:开始 `let G={`,结束 `};`,中间无内嵌函数 / 无 G 外部追加。

### 紧接 30 行(L3520-L3549)审查结论

无 `G.xxx = ...` 直接初始化追加。后续都是平级 top-level let / const 静态数据 / 函数定义。`_unitIdCounter`(原 L3522)是兄弟 let,选项 A 严格不抽。

### 不抽的相邻 state(留 v181)

- `let _unitIdCounter=1;`(原 L3522)— 兄弟 top-level let
- `initGame()` — 选项 A 明确留 v181,后续 sub-session 处理

---

## 五、关键设计决策

### 5.1 script 标签加载顺序(制作人定)

`<script src="src/core/state.js">` 必须是 src/* 中**第一个加载**的脚本:

```html
<script src="src/core/state.js"></script>      ← 状态根,最前
<script src="src/data/constants.js"></script>
<script src="src/data/tags.js"></script>
<script src="src/data/events.js"></script>
<script src="src/data/generals.js"></script>
<script src="src/data/cities.js"></script>
<script src="src/data/factions.js"></script>
<script src="src/core/helpers.js"></script>    ← 纯 utility,在 data/ 后,render/ 前
<script src="src/render/notifications.js"></script>
<script src="src/render/modals.js"></script>
<script src="src/render/ui_panels.js"></script>
<script src="src/render/ceremonies.js"></script>
<script src="src/render/tooltips.js"></script>
<script>...主代码...</script>
```

**理由**:G 是状态根,放最前防御未来某个 data 文件顶层 IIFE 误读 G 的情况,且符合"基础先出现"的阅读直觉。

### 5.2 跨 classic `<script>` 顶层 `let` 共享 — 真正先例验证锚点

**重要历史记录**:phase 3.1 这次 state.js 抽离的 smoke PASS,是项目内"跨 classic `<script>` 顶层 `let` 共享"的**真正先例**。

phase 2 抽出文件中用过的 `let _leftPanelCache` 等不构成先例:那是**被读状态**(只在 ui_panels.js 内部缓存),量级与"被全代码读写的状态根 G"不可类比。

**权威依据**:日后任何关于"跨 script let 共享是否可靠 / 是否需要改 var / 是否需要 window.G"的争议,以 phase 3.1 的 smoke layer-1+layer-2 51 snapshots PASS 作为权威验证锚点。state.js header 注释亦标注此点。

---

## 六、实测数据

### 6.1 文件行数变化

| 项 | 起点(phase-2 末) | helpers.js 抽后 | state.js 抽后 | 累计 |
|---|---|---|---|---|
| project_romance_v181.html | 34580 | 34569(-11) | **34537**(-32) | **-43 行** |
| src/core/helpers.js | 0 | 34 | 34 | +34 行 |
| src/core/state.js | 0 | 0 | **61** | +61 行 |
| 合计抽出 | 0 | 34 | **95** | +95 行 |

### 6.2 smoke 验证

每次抽离均跑 layer-1+layer-2 全字段比对 `tests/baseline/phase2_complete.json`:

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.1 启动前) | 51 | ✅ identical |
| helpers.js 抽离后 | 51 | ✅ identical |
| state.js 抽离后 | 51 | ✅ identical |

**0 行为漂移**。

---

## 七、commit 清单

| commit | 内容 |
|---|---|
| `1c404c7` | `refactor(p3.1): extract helpers (fmt/sleep/safeSub) to src/core/helpers.js` |
| (本 commit) | `refactor(p3.1): extract G state root to src/core/state.js + add p3.1 notes` |

---

## 八、phase 3.1 完成清单

- ✅ `core/state.js` 抽出(选项 A,L3489-L3519 verbatim)
- ✅ `core/helpers.js` 抽出(3 函数,无 G 依赖)
- ✅ smoke layer-1+layer-2 PASS(每次抽离均验证)
- ✅ PLAN §二偏离记录(safeAdd / 数组工具不存在)
- ✅ script 加载顺序调整(state.js 最前)
- ✅ "跨 script let 共享"验证锚点固化
- ⏭ 工作分支 `refactor/p3.1-state-helpers` → squash merge `refactor/phase-3`(等制作人 approve)

---

## 九、下一 sub-session 衔接

PLAN §三阶段 3 后续 sub-sessions:

- 3.2 `core/hubs.js` — 跨链 hub 函数(triggerFactionEvent / checkEventPromises / applyEthosShock 等)
- 3.3 `core/claude_ai.js` — getGameState / prompt / _exec 派发器
- 3.4 `core/tick.js` + `main.js` — 主循环 + 启动
- 3.5-3.12 8 链
- 3.13 收尾

phase 3.1 留给后续 sub-sessions 的债:
- `_unitIdCounter` 等兄弟 top-level lets 的归属(候选:tick.js / main.js)
- `initGame()` 的归属(候选:tick.js / main.js)
- `log` / `updateFacStats` 的归属(读写 G,等机制阶段归到对应 chain)
