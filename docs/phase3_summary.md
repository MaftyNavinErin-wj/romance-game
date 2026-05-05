# Phase 3 Summary — 机制层抽离 + 8 链落位

> 阶段:Phase 3(REFACTOR_PLAN_v1.md §三 阶段 3)
> 完成日期:2026-05-05
> 起始 commit:`7568431`(phase-2 merged to main)
> 结束 commit:见末尾"phase-3 → main 合并"段
> 本 phase 是 v181 → 四层架构重构的最大阶段(13 sub-session,8 链 + map.js + 4 core 文件 + 1 phase 2 carry-over close)

---

## 一、目标 vs 实际

PLAN §三阶段 3 目标:把游戏机制层(8 条逻辑链)从 v181.html 拆到 `src/chains/*.js`,跨链 hub / state root / helpers / Claude AI / 主循环 / 启动 / 地图基础设施拆到 `src/core/*.js`。**只搬运不改逻辑**,接口风格全局函数。

阶段 3 完成 13 sub-session(3.1–3.13),原 PLAN §二字面估计各 chain ~2000–3000 行,实际产出:

| 指标 | 数值 |
|---|---|
| v181.html 起点(phase-2 末) | 34580 行 |
| v181.html 终点(phase-3 末) | **17391 行** |
| Phase 3 阶段内减重 | **-17189 行(-49.7%)** |
| **累计 phase 1+2+3 减重** | **39547 → 17391(-22156,-56.0%)** |
| Phase 3 抽出的 src/ 文件数 | 15(core 7 + chains 8) |
| Phase 3 抽出的 src/ 总行数 | 19567 行(core 4134 + chains 15433) |
| 抽出的函数总数 | **417 函数 + 38 const + 11 顶层 lets + 1 class** |
| 实装阶段累计 bug | **13(全部就地修复)** |

阶段 3 是项目重构最大单阶段,**单文件抽离峰值 7418 行(chains/military.js)**,**单 sub-session 减重峰值 -7999 行(p3.11 map+military)**。

---

## 二、Sub-session 全表(13 sessions)

| Session | Commit | 抽出文件 / 函数数 | v181 减重 | bug | 关键决策 |
|---|---|---|---|---|---|
| **3.1** state + helpers | `e84e429` | `core/state.js`(31 行 G 本体) + `core/helpers.js`(3 funcs) | -43 | 0 | 选项 A 严格(只抽 G 本体);选项 B helpers(纯 utility,无 G 依赖);state.js 顺序最前 |
| **3.2** hubs | `4f962a0` | `core/hubs.js`(1 func: checkEventPromises) | -169 | 0 | 严格 (a) 审查:plan 4 候选 + 1 概念,实测**只 1 个真跨链 hub**(其余按写口归对应链) |
| **3.3** claude_ai | `83ce9c2` | `core/claude_ai.js`(C+D+E+F+G+H+I+J+K 9 段,1399 行 verbatim) | -1397 | 0 | **选项 A vs D 决策**:制作人选 A,流水线完整性优先;D-099/D-100/D-121/D-130 信息暴露面 100% 收口;**新工作流原则:scout-before-extract** |
| **3.4** tick + main | `fba8fc2` | `core/tick.js`(T1-T5,623 行) + `core/main.js`(M1+M2,356 行) | -973 | 0 | 选项 C(2 文件 + 顶层 lets 全留 v181);第二个验证锚点(`_statsHistory` const 跨 script);M5 boot call 留 v181;Carry-over backToTitle reset |
| **3.5** ethos(Wave 1 起点) | `eea8200` | `chains/ethos.js`(5 funcs,98 行) | -95 | 0 | **chain 模板 5 决策点**:目录命名 `src/chains/`、section header 抽走、`_ethosDistance` 跨文件消费数据 OK、加载顺序 `data → core → chains → render → inline`、**6 项 header 必含**(写口归属声明) |
| **3.6** gentry | `f7befb2` | `chains/gentry.js`(18 funcs + 2 const,547 行) | -540 | 1(awk 边界) | 模板第二应用;G5/G6 攻城后处置归 gentry;**bug 教训沉淀:awk 边界用 `wc -l` 验证** |
| **3.7** politics | `0f63599` | `chains/politics.js`(47 funcs + 1 const + 4 lets,849 行) | -825 | 1(手打 verbatim) | 模板第三应用;**Node 双脚本(build + replace 共享 ranges)预防字符替换 bug**;`backToTitle reset` 2 处跨 script 写已抽走的 lets;4 个 `_exec*` 留 claude_ai.js |
| **3.8** diplomacy(最大 chain V2) | `5fe9754` | `chains/diplomacy.js`(63 funcs + 2 lets,1350 行) | -1379 | 4(scout 四件验证缺失) | **scout 四件验证沉淀**(原则 #9):(a) awk 列范围内所有 function;(b) `grep -n "^}"` 验证 closing;(c) banner 终止标记 idempotent;(d) 按主写口判定不看函数名;**实装就地修正 1 项**(aiDoTradeAgreement 归经济) |
| **3.9** economy(Wave 2 收尾) | `880b6a2` | `chains/economy.js`(51 funcs + 1 const,1338 行) | -1406 | **0**(四件验证沉淀有效) | 12 段不连续;3.6/3.7/3.8 carry-over 全验证 PASS;粮食警报段(8 funcs + 2 const)整段留 v181(UI 紧密耦合);trade 子组归位 |
| **3.10** event(Wave 3 起点) | `f0feaad` | `chains/event.js`(8 funcs,332 行) | -326 | 0 | Wave 3 开头是事件链的核心理由:**前置链已抽完,事件 effects 写口归属此时全部明确**;突破 -30% 减重大关 |
| **3.11** map + military(最大 chain V1) | `cd125b0` | `core/map.js`(36 funcs + 17 const + 1 class,1218 行) + `chains/military.js`(120 funcs + ~21 const + 11 lets,7418 行) | -7999 | 5(关键 bug 7.5 嵌套 ranges) | **map.js 决策(carry-over §2 关闭)**:hex/fog/pathfinding 单独抽到 core,不归军事链;同分支两 commit + squash;**新工作流原则:ranges 无嵌套 inclusion**(原则 #10);突破 -50% 大关 |
| **3.12** general + _applyCeremony 归位(Wave 3 收尾) | `5d66421` | `chains/general.js`(69 funcs + 11 const,2063 行) + `render/ceremonies.js` -18 行(_applyCeremony 归位) | -2036 | 2(漏 closing + docstring 跨切) | **3 个补充记录**:triggerFactionEvent 闭环 / D-064 关联 D-065 / setPrefect 业务语义优先;**30 D 类位置文档化**;**phase 2 _applyCeremony carry-over 关闭**;**原则 #9 补充:docstring 不能跨 range 切片**;突破 -55% 大关 |
| **3.13** 收尾 review | (本 commit) | docs/phase3_summary.md + tests/baseline/phase3_complete.json | — | — | 全量 smoke 3 次 byte-identical 验证;锁 phase3 baseline;phase-3 → main `--no-ff` merge;12 工作分支清理;tag `phase3-complete-archive` |

**13 sub-session 累计:417 函数 + 38 const + 11 顶层 lets + 1 class verbatim + 13 实装 bug 全修复**。

---

## 三、文件清单(阶段 3 终态)

### 3.1 新增/动到的 src/ 文件(本 phase)

**`src/core/`(7 文件,Phase 3 全新)**

| 文件 | 行数 | 来源 v181 行号(实装时) | 内容 |
|---|---|---|---|
| `core/state.js` | 61 | L3489-L3519 | `let G={...}` 状态根(选项 A) |
| `core/helpers.js` | 34 | L16711 / L16718 / L17035 | 3 纯函数:`fmt / sleep / safeSub` |
| `core/hubs.js` | 206 | L7945-L8115 | 1 真跨链 hub:`checkEventPromises` |
| `core/claude_ai.js` | 1481 | L30669-L32067 | C+D+E+F+G+H+I+J+K 9 段(状态根 + 情报+战略+决策节奏 + 战术 prompt + getGameState + 战略 prompt + API + test/inspect + executeClaudeActions + _execOneAction switch) |
| `core/tick.js` | 733 | T3 L7818-L7883 / T2 L10360-L10472 / T1 L13160-L13538 / T4 L14675-L14718 / T5 L14720-L14740 | runRebelAI / runAI / nextTurn / fastForwardTurns / _statsHistory + pushStatsSnapshot |
| `core/main.js` | 401 | M1 L5622-L5969 / M2 L30045-L30052 | initGame + startAs |
| `core/map.js` | 1218 | M0-M10 L1404-L2521(11 段) | hex 系统 / FOG / fuzzy display / 城市邻接 / 地形多边形 / buildHexTerrain / hexLineDraw / 移动 cost / 寻路(`hexAstar` + `_MinHeap` class) |

`core/` 小计:**7 文件 / 4134 行**

**`src/chains/`(8 文件,Phase 3 全新)**

| 文件 | 行数 | 来源 v181 段数 | 内容 |
|---|---|---|---|
| `chains/ethos.js` | 172 | E1-E5(1 段连续) | 价值观 5 维 + 漂移 + shock + distance + processFacEthos |
| `chains/gentry.js` | 688 | G1-G6(6 段) | 县豪族 + 等级 + corruption-side + initCityGentry + processGentry + 攻城后处置 |
| `chains/politics.js` | 1049 | P1-P6(6 段) | 科技 + 阶段演进 + 官职 + 朝议 + 称帝 + TRIBUTE_RATES + 4 顶层 lets |
| `chains/diplomacy.js` | 1633 | D1-D5 + D6 lets(9 段不连续) | 停战 + 玩家外交 + AI 外交 + 计谋 + 通使 + 宣称 + 信誉 + 血仇 + 附庸 + 2 顶层 lets |
| `chains/economy.js` | 1688 | E1-E8(12 段不连续) | 部曲 + 城市腐败 + 城市经济 + 迁民 + turn proc + AI 经济 + 玩家入口 + trade 子组 + 物资 helpers + TRADE_POST_NAME |
| `chains/event.js` | 472 | EV1(1 段连续) | 叛乱 + 事件 cooldown + 疫病 + rollEventsV2 + resolveEventChoice + _popEventQueue |
| `chains/military.js` | 7418 | MIL1-MIL8 + M_LETS(25 段不连续) | unit 等级/exp + 编制 + AI 决策 + unit 基础/兵种/skills + turn proc(含 supply)+ 战斗解算 + 战斗调度 mechanism + 玩家动作 + 11 顶层 lets |
| `chains/general.js` | 2313 | GEN1-GEN15(15 段 v181 + 1 段 ceremonies.js) | 部曲 + 养成 + helpers + 籍贯 + 派系系统 + chronicle + 招募 + 亲密度 + 忠诚 + 太守 + 军师 + 战力 + 亲密度系统 + 伤亡俘虏 + _applyCeremony |

`chains/` 小计:**8 文件 / 15433 行**

### 3.2 Phase 1+2 已抽出的 src/ 文件(本 phase 不动)

**`src/data/`(6 文件,Phase 1)**

| 文件 | 行数 |
|---|---|
| `data/cities.js` | 182 |
| `data/constants.js` | 29 |
| `data/events.js` | 2293 |
| `data/factions.js` | 65 |
| `data/generals.js` | 242 |
| `data/tags.js` | 102 |

`data/` 小计:**6 文件 / 2913 行**

**`src/render/`(5 文件,Phase 2 + Phase 3.12 ceremonies.js -18 调整)**

| 文件 | 行数 |
|---|---|
| `render/ceremonies.js` | 80(p3.12 _applyCeremony 归位后,从 98 减到 80) |
| `render/modals.js` | 197 |
| `render/notifications.js` | 21 |
| `render/tooltips.js` | 1291 |
| `render/ui_panels.js` | 787 |

`render/` 小计:**5 文件 / 2376 行**

### 3.3 src/ 总览(phase 3 末)

| 目录 | 文件数 | 行数 |
|---|---|---|
| `src/data/` | 6 | 2913 |
| `src/render/` | 5 | 2376 |
| `src/core/` | 7 | 4134 |
| `src/chains/` | 8 | 15433 |
| **合计** | **26** | **24856** |

加上 `project_romance_v181.html` 17391 行,项目代码总计 **42247 行**。

### 3.4 加载顺序(phase 3 末终态)

```html
<script src="src/core/state.js"></script>           ← 状态根,最前
<script src="src/data/constants.js"></script>
<script src="src/data/tags.js"></script>
<script src="src/data/events.js"></script>
<script src="src/data/generals.js"></script>
<script src="src/data/cities.js"></script>
<script src="src/data/factions.js"></script>
<script src="src/core/helpers.js"></script>         ← 纯 utility
<script src="src/core/hubs.js"></script>            ← 真跨链 hub
<script src="src/core/claude_ai.js"></script>       ← Claude AI 决策与派发层
<script src="src/core/tick.js"></script>            ← 主循环
<script src="src/core/main.js"></script>            ← 启动
<script src="src/core/map.js"></script>             ← 地图基础设施(p3.11 决策:不归军事)
<script src="src/chains/ethos.js"></script>
<script src="src/chains/gentry.js"></script>
<script src="src/chains/politics.js"></script>
<script src="src/chains/diplomacy.js"></script>
<script src="src/chains/economy.js"></script>
<script src="src/chains/event.js"></script>
<script src="src/chains/military.js"></script>
<script src="src/chains/general.js"></script>
<script src="src/render/notifications.js"></script>
<script src="src/render/modals.js"></script>
<script src="src/render/ui_panels.js"></script>
<script src="src/render/ceremonies.js"></script>
<script src="src/render/tooltips.js"></script>
<script>...inline 主代码 + 留 v181 的部分...</script>
```

加载顺序反映依赖方向:`state → data → core(helpers/hubs/claude_ai/tick/main/map) → chains → render → inline`。chains/ 内顺序无关(各 chain self-cohesive,跨 chain 依赖通过同 realm classic <script> hoisted function 全局可见)。

---

## 四、Smoke 验证 + baseline 锁定

### 4.1 阶段全程 smoke 状态

Phase 3 13 sub-session **全程 baseline = `tests/baseline/phase2_complete.json`**(layer-1 + layer-2,51 snapshots)。每个 sub-session 抽离前后均跑全字段比对,**全部 PASS,0 行为漂移**。

证据:phase 3 终点(commit `5d66421`)的 snapshots SHA256 = `phase2_complete.json` 的 snapshots SHA256 = `96ac5372...d1abf190`。**整 phase 3 对游戏 state 行为 byte-identical 0 影响**。

### 4.2 phase3_complete.json baseline 锁定(sub-session 3.13)

Phase 3.13 收尾跑 3 次完整 smoke 验证稳定性:

| 跑次 | snapshots SHA256 | compare vs phase2_complete |
|---|---|---|
| run 1 | `96ac5372...d1abf190` | ✅ PASS |
| run 2 | `96ac5372...d1abf190` | ✅ PASS |
| run 3 | `96ac5372...d1abf190` | ✅ PASS |

**3 次 byte-identical 稳定 → 锁 `tests/baseline/phase3_complete.json`**(snapshots 与 phase2_complete.json 完全等价,meta.generated_at 不同)。

`tests/baseline/` 目录终态:

| baseline 文件 | 用途 | 来源 |
|---|---|---|
| `phase1_post.json` | layer-1+layer-2 phase 1 末权威基线 | phase 2.0 |
| `phase2_complete.json` | layer-1+layer-2 phase 2 末权威基线(整 phase 3 直接基线) | phase 2.6 |
| `phase3_complete.json` | layer-1+layer-2 phase 3 末权威基线(后续 sprint / phase 4 基线) | phase 3.13(本 session) |

**3 baseline 共存模式**(同 phase 1+2 渡过 phase 2 时的 phase1_post + phase2_complete 共存模式)。`phase3-complete-archive` git tag 锚定本阶段 baseline。

---

## 五、PLAN §二偏离汇总

> 同 phase1_summary §5.3 / phase2_summary §五 的处理方式 — **每个 sub-session 记录但不改 plan**(CLAUDE.md 硬规则 #1)。
> Phase 3 起强化为 **scout-before-extract 工作流**(p3.3 起正式纳入,见 §六)。

| Session | PLAN 字面 | scout 实测 / 实抽 | 偏离类型 |
|---|---|---|---|
| 3.1 helpers | safeSub / safeAdd + 数组工具(clamp/sum/avg/sumBy/range/deepCopy) | 只 safeSub 存在;safeAdd / 数组工具不存在 | **plan 字面找不到对应代码** |
| 3.2 hubs | 4 候选 hub + 1 概念 hub(triggerFactionEvent / checkEventPromises / applyEthosShock / _applyEthosDrift / "易主路径 hub") | 只 1 真跨链 hub(checkEventPromises),其余按写口归对应链;"易主路径 hub" 不存在为单一函数 | **plan 边界过宽** |
| 3.3 claude_ai | ~860 行字面估算 | 实抽 1399 行(段 D 情报+战略+决策节奏 440 行是 v159 Phase 5 加,plan v1.0 不知)| **plan 写于 v159 之前,代码已生长** |
| 3.4 tick + main | nextTurn + 主循环 + 启动逻辑 | T3 runRebelAI / T4 fastForwardTurns / T5 stats / M2 startAs / M3-M6 plan 不知 | **plan 笼统,scout 拆分** |
| 3.5 ethos | 节点 27 / 9 D 类 / ~95 行 | E1-E5,98 行 | **高度一致**(scout-before-extract 第 5 次,第 1 次高度一致) |
| 3.6 gentry | 节点 ~37 / ~14 函数 | 18 funcs + 2 const + 1 section header(G3 corruption-side helper 漏数 / G5+G6 aftermath) | **中等偏差** |
| 3.7 politics | ~50 函数 / 1 _exec / 4 backToTitle reset | 47 funcs + 1 const + 4 lets;实测 4 _exec(plan 误数);2 backToTitle reset(plan 误数);减武将链 + 留 v181 modal/render 7 个 | **plan 多处误数** |
| 3.8 diplomacy | ~66 函数 / 14 _exec / 31 D 类 | 64(scout)→ 63(实装就地修正:aiDoTradeAgreement 归经济);留 4 modal/render | **小偏差 + 实装就地修正 1 项** |
| 3.9 economy | ~65 函数 / 5 _exec | 51 funcs + 1 const(粮食警报 8 funcs + 2 const + showMigrateDialog 留 v181) | **plan 含 UI 段** |
| 3.10 event | ~7 函数 | 8 funcs(_popEventQueue 漏数) | **小偏差** |
| 3.11 map + military | ~200 函数(plan 字面对军事链一锅估)| map.js 36 funcs + 17 const + 1 class;military.js 120 funcs + ~21 const + 11 lets;留 v181 ~80 funcs(modal/animation/render/UI)| **map.js 决策(carry-over §2)使 plan 字面无法直接对照** |
| 3.12 general | ~70 mutator + 30 D 类 | 69 funcs + 11 const(_applyCeremony 归位);数据 const + squad class 留 v181/数据 sprint | **小偏差** |

**结论**:Phase 3 全程 plan 字面与 scout 实测有偏离,但**通过 scout-before-extract 工作流提前发现并书面记录**(commit message + chain header + sub-session notes 三处留档),全程 0 因偏离引发的 BLOCKED。

PLAN v1.0 写于 v159 之前,**v181 已经长出 plan 不知道的代码**(p3.3 段 D 440 行就是典型例子)。这是 scout-before-extract 必须正式化的根本原因。

---

## 六、关键设计决策(13 sub-session 沉淀)

### 6.1 chain 模板规范(p3.5 起)

**chain 阶段所有 chains/*.js 必含 6 项 header**(决策点 5,制作人 approve):

1. **来源**(v181 行号 + 抽离方式 verbatim 声明)
2. **抽离范围 + 留 v181 部分**
3. **写口归属声明**((a) 原则核心,审计一眼可验)— **制作人新增项**
4. **反向调用清单**(callers + callees,按归属链整理)
5. **plan §二 偏离记录**(commit + header + sub-session notes 三处留档)
6. **script 加载位置 + 模板说明**

### 6.2 加载顺序规范(p3.5 起)

**`data → core → chains → render → inline`** 反映依赖方向。chains/ 内顺序无关。

详见 §三.4。

### 6.3 写口归属判定(p3.2 起)

**(a) 原则**:函数归属看主写口落哪个 G subtree。

精化记录(p3.12 §二.3):**业务语义优先于字段位置**。
- `setPrefect` 字段写 `G.cities[].prefect` + `G.genLoyalty`,业务是"任命武将做太守" → 归武将链
- `appointGenPost` 字段写 `G.genPost` + 副作用 `G.genLoyalty`,业务是"任命官职" → 归政治链
- `succeedRuler` 武将晋升 + 派系切换,业务主体武将处理 → 归武将链
- `aiDoTradeAgreement` 名字含 "diplo trade",写口 `G._tradeAgreements` 是经济 → 归经济链(p3.8 实装就地修正)

### 6.4 反向调用 (c) 原则容许

phase 2 已 approve:render → mechanism / mechanism → render 的反向调用通过同 realm classic <script> hoisted function 全局可见,**不强制单向依赖**。phase 3 沿用,扩展到 chain → chain 反向(典型 hub 模式,如 diplomacy 调 ethos.applyEthosShock / military 调 general.killGen)。

### 6.5 跨 classic <script> 顶层 let / const 共享(验证锚点)

| 锚点 sub-session | 验证项 | 结论 |
|---|---|---|
| **p3.1**(let 锚点) | `let G = {...}` 跨 script 共享 | smoke layer-1+layer-2 PASS = "跨 script let 顶层共享可靠" 权威依据 |
| **p3.4**(const 锚点) | `const _statsHistory / _STATS_MAX` 跨 script 共享(`.length = 0` reset 跨 script 写) | smoke PASS = "跨 script const 顶层共享可靠" 权威依据 |

phase 3 后续所有 chain 抽离的顶层 lets / const 共享行为依赖这两个锚点。

### 6.6 选项决策记录(p3.1 / p3.3 / p3.4 / p3.5)

**Phase 3 的"边界清晰" > "切割彻底"**。每个 sub-session 抽完后留下的 v181 / src 边界都干净,**不为追求"v181 减重"而硬抽 ambiguous 部分**:

| Sub-session | 选项 | 风格 |
|---|---|---|
| 3.1 | 选项 A(state)+ 选项 B(helpers) | 收紧:只抽 G 本体 + 纯 utility(无 G 依赖一律抽,有 G 引用一律留) |
| 3.2 | 严格 (a) 审查 | 收紧:只抽 1 真跨链 hub |
| 3.3 | 选项 A vs D,**制作人选 A** | 流水线完整性优先:H parse → J execute → K dispatch 一并搬,M 39 个 _execXxx 留 v181 等各 chain 收 |
| 3.4 | 选项 C | verbatim 强 + 顶层 lets 全留 v181 + 与 3.1/3.3 风格一致 |
| 3.5 | 5 决策点全 approve | chain 模板规范固化 |
| 3.11 | map.js 决策选 A | hex/fog/pathfinding 单独抽到 core,不归军事链 |

### 6.7 phase 2 carry-over close(p3.12)

phase 2 留下的 `_applyCeremony` TODO(在 src/render/ceremonies.js header)在 p3.12 关闭:函数从 ceremonies.js 抽到 chains/general.js GEN15 段。phase 2 → phase 3 的渲染→机制 carry-over 闭环。

---

## 七、工作流原则沉淀(phase 3 期间正式纳入)

### 原则 #5(p3.3 起):scout-before-extract

**plan 写于 v159 之前,实际 v181 已经长出很多 plan 不知道的代码**。phase 3.3 之后每个 sub-session 都要先 scout 实测,**不能照 plan 字面抽**。

**操作规范**:
1. 每个 sub-session 启动后,先做 boundary scout(read-only,不动手)
2. scout 报告必含:代码块位置清单 + G 读写性质 + 跨 chain 引用情况 + plan §二实测偏离 + 抽离方案选项(若 >1 种)
3. 制作人 approve 后才开 working branch 实装

**必须正式化的依据**:
- p3.1 命中 1 次(safeAdd / 数组工具不存在)
- p3.2 命中 1 次(plan 4 候选 + 1 概念,实际只有 1 真跨链 hub)
- p3.3 命中 1 次(plan ~860 行,scout 实测 1399 行,多出 v159 Phase 5 整层 440 行)
- 三次同模式 → 个案 → 工作流原则

### 原则 #6(p3.5 起):chain 阶段 chains/*.js 6 项 header 必含

详见 §六.1。

### 原则 #7(p3.6 起):awk 边界用 wc -l 验证

**bug 教训**:awk 范围结束行未用 `wc -l` 校验,manual 数 line 偏差导致 `_triggerGentryBetray` 函数 closing 行漏 1,SyntaxError + smoke FAIL。

**操作规范**:
- 提取后跑 `wc -l src/chains/X.js`
- 算 verbatim 行数 = 文件总行 - header 行
- 与预期 awk delete 范围行数对比

### 原则 #8(p3.7 起):chain 文件用 Node 脚本 verbatim 复制 v181,禁止手打

**bug 教训**:第一次写 politics.js 时手打中文标点把 `（）` `！` `：` 等替换成了 ASCII 半角,verbatim 原则要求字符级一致。

**操作规范**:
- **双脚本(build + replace)共享 ranges 数组**,逻辑等价,少一步 off-by-one 风险
- 先 build_X.js(从 v181 verbatim 提取段落)→ syntax check
- 再 replace_v181.js(同样的 ranges 数组用 placeholder 替换)→ smoke check
- grep 验证中文标点 `，！?:()` 保留

### 原则 #9(p3.8 起):scout 必须四件验证

**bug 教训**:p3.8 实装阶段踩 4 个 bug,均因 scout 不充分:
- 文件累积 doubled / scout 范围 end 不到函数体结束 / scout 漏检中间夹的他链函数 / scout 边界判定错误(aiDoTradeAgreement 误归外交)

**四件验证**:
- **(a)** `awk 'NR>=A && NR<=B && /^function /'` 列范围内**所有** function(检测他链夹击)
- **(b)** `grep -n "^}"` 验证每段最后函数真实 closing brace(避免漏函数体)
- **(c)** build 脚本 header 提取用 banner 终止标记(idempotent 重跑无 doubled)
- **(d)** 函数名带 chain 前缀**不等于**归该 chain,严格按主写口判定

**沉淀效果**:p3.8 4 bug → p3.9 0 bug → p3.10 0 bug,沉淀有效。

#### 原则 #9 补充(p3.12 起):docstring 不能跨 range 切片

**bug 教训(p3.12 bug 7.2)**:GEN13 to=7755 + GEN14 from=7757 跨 docstring 切片,v181 留下 dangling `*/` → SyntaxError → inline script 不执行 → smoke FAIL(与 p3.11 bug 7.5 同类,跨边界处理)。

**操作规范**:**ranges 边界跨 docstring 时,docstring 必须整段在某一 range 内,不能跨 range 切片**。否则 dangling `/**` 或 `*/` 会破坏 v181 inline script syntax。验证手段:`grep -n "^}"` + 上下文 awk 看前后 5-10 行。

### 原则 #10(p3.11 起):ranges 中嵌套 inclusion 必须避免

**关键 bug 教训(p3.11 bug 7.5)**:`_supplyCache` from=10701 嵌套在 `MIL5` from=10343 to=11090 内,replace 算法 sort by from + line-by-line iter,嵌套 range 卡死 iter,后续 ranges 全部不触发,导致部分函数没被替换 → chain 文件 + v181 重复声明 → SyntaxError → smoke FAIL。

**操作规范**:
- 在添加新 range 前,先检查它是否被现有 range 包含 / 包含现有 range
- 嵌套 range 必须**合并**(自然包含,不需单独 range)或**拆分**外层 range(让中间空出)
- build 脚本 banner marker 用 sort 后的第一段(不是声明顺序的第一段)

### 原则总览

| 原则 | 起 sub-session | 主题 | 触发教训 |
|---|---|---|---|
| #5 | 3.3 | scout-before-extract | plan v159 之前 vs v181 实测偏差 |
| #6 | 3.5 | chains/*.js 6 项 header 必含 | chain 模板首次设计 |
| #7 | 3.6 | awk 边界用 wc -l 验证 | awk 漏 1 行 closing |
| #8 | 3.7 | Node 双脚本(共享 ranges)代替手打 | 中文标点字符替换 |
| #9 | 3.8 | scout 四件验证((a)-(d))| 4 个实装 bug 同源 |
| #9 补充 | 3.12 | docstring 不跨 range 切片 | dangling `*/` SyntaxError |
| #10 | 3.11 | ranges 无嵌套 inclusion | 嵌套 range 卡死 iter |

---

## 八、Carry-over 全收口表

### 8.1 Phase 3 期间各 sub-session 之间的 carry-over

| Carry-over 编号 | 来源 sub-session | 内容 | 关闭 sub-session | 关闭方式 |
|---|---|---|---|---|
| §1 backToTitle reset | 3.4 | 20+ top-level lets reset 集中点,各 chain 抽自家 mechanism let 时同步处理 | 3.7 / 3.8 / 3.11(11 lets 跨文件迁移完成) | reset / saveGame meta / loadFromSlot 行**保持不变**(跨 script 写已抽走的 lets,let / const 顶层共享原则验证锚点) |
| §2 map.js 决策 | 3.4(总 scout)| hex/fog/pathfinding(L1589-L2623,~34 函数)归属待定 | 3.11 | 制作人 approve 选 A:单独抽 src/core/map.js,不归军事链。同分支两 commit + squash |
| §3 ethos 跨链消费 | 3.5 | `_ethosDistance` 被外交链 + render 跨文件调 | 3.8 / 3.10 验证认可,各 caller 不"反取" | 设计认可,(c) 原则容许 |
| §4 gentry G5/G6 aftermath | 3.6 | 攻城后处置写口跨多链(经济 + 豪族 + 外交),归 gentry 是语义判定 | 3.11 | 军事链不反取,验证 PASS |
| §5 政治写口副作用 | 3.7 | `doEnthrone` 写 `G.reputation`(外交)/ `processTechResearch` 扣 res(经济)/ `appointGenPost` 写 `G.genLoyalty`(武将)/ `_applyCourtDecisions` 写 `G.genFactionMod`(武将)| 3.8 / 3.9 / 3.12 | 各 chain 不"反取"政治写口副作用,(c) 原则容许 |
| §6 外交 carry-over | 3.8 | trade 子组(aiDoTradeAgreement + 12 trade 函数)夹在外交段中间 / `_clearSiegeOnPeace` 写 unit.status(军事)/ `_applyScoutReveal` 写 G.fog(军事)/ `checkEmperorCapture` 写 FAC_IDENTITY.type(政治)/ `stratSpy/stratRumor` 写 G.genLoyalty(武将)| 3.9(trade 子组直接抽)/ 3.11(军事不反取)/ 3.12(武将不反取) | 经济直接抽 trade 子组;其余 chain 不反取外交副作用 |
| §7 经济 carry-over | 3.9 | `getCityProd / processGarrisonRecovery / canBilletToCity` 等被军事多处调 / `createUnit` / `_supplyCache` 留 3.11 / `setPrefect / clearPrefectByGen` 留 3.12 / `getStrategistInt + setStrategist` 留 3.12 / 粮食警报段(`_pendingCards / _shownCities`)整段留 v181 | 3.10 / 3.11 / 3.12 | 反向调用 OK;`createUnit` + `_supplyCache` 在 p3.11 自然包含;武将相关在 p3.12 抽 |
| §8 事件 carry-over | 3.10 | events.js ~20 处 `applyEthosShock`(已 carry-over §3.5)/ 事件 effects 调 hub | 3.10 内验证 PASS | 通过已抽 hub,反向调用 (c) 容许 |
| §9 ranges 嵌套 bug 教训 | 3.11 | 工作流原则 #10(见 §七)| 3.12 应用,无问题 | sub-session 工作流改进 |
| §10 phase 2 _applyCeremony | (phase 2.6)| 函数体 100% mechanism,但 phase 2 时与 ceremony render 一起抽到 src/render/ceremonies.js,header 标 TODO 等 phase 3 归位 | 3.12 GEN15 | 函数从 ceremonies.js 归位到 chains/general.js |

### 8.2 phase 2 留下的"接口风格段补注" carry-over(**未在 phase 3 处理**)

phase 2 期间 `src/render/notifications.js` + `src/render/modals.js` header 含"接口风格"段(说明全局函数风格 + verbatim relocation 原则);**`src/render/ui_panels.js / ceremonies.js / tooltips.js` 三个文件 header 缺此段**。

**phase 3 期间未处理**:
- p3.12 抽 `_applyCeremony` 时只动 ceremonies.js 的函数体,未补 header"接口风格"段
- 其他 phase 3 sub-session 严格不动 src/render/(scope 之外)
- 实测验证(p3.13):`grep -l "接口风格" src/render/` 命中 modals.js + notifications.js,**ui_panels.js / ceremonies.js / tooltips.js 缺**

**carry-over 状态**:**未关闭,留 phase 4 或某次 fixup**。不属于 phase 3 范围内动(scope 之外 + 非 mechanism)。
- 处理方式建议:某次 fixup commit 把 3 个文件 header 补"接口风格"段,与 modals.js / notifications.js 文字对齐
- 不影响游戏运行 / 不影响 audit 单点切入(现有 6 项 chain header 已覆盖 chain 文件;render 文件靠 phase 2 §5.1 集中说明)

### 8.3 全收口结论

**所有 Phase 3 内部 carry-over + phase 2 _applyCeremony carry-over 全部关闭**;**phase 2 接口风格段补注 carry-over 未关闭,留 phase 4 / fixup**(见 §8.2)。Phase 3 末除"接口风格段"外没有遗留的跨 sub-session / 跨阶段债。

---

## 九、D 类位置文档化总表 + sprint 批次建议

> CLAUDE.md 硬规则:HIGH/MEDIUM/LOW fix 全留 sprint。Phase 3 期间 **0 主动 fix**,但 p3.12 把 30 D 类按 chain 段位置文档化,便于 sprint 启动决策。

### 9.1 8 链 D 类位置(已知)

各 chain 抽离时记录的 D 类位置(从 phase3_X_notes 沉淀):

**武将链(chains/general.js,p3.12 §五)— 30 D 类原 audit 最多**

| D-XX | 严重度 | 涉及函数 / 标记 | chains/general.js 段 / 其他 |
|---|---|---|---|
| D-048 | HIGH | `triggerFactionEvent('betray')` 调用方漏 | 跨 chain caller bug,sprint 修各 caller(diplomacy / military)|
| D-049 | HIGH | `triggerFactionEvent('warDeclare')` 多路径漏触发(与事件链 D-131 同源)| GEN5.b `triggerFactionEvent` 本身 OK,callers 漏触 |
| D-051 | HIGH | `setPrefect / setStrategist` 漏 `applyEthosShock(power)` | GEN10 / GEN11 |
| D-052 | HIGH | `calcLoyaltyDelta` UI vs `processLoyalty` 主 tick 双向 4 项缺漏 | GEN9 |
| D-053 | HIGH | `applyLoyaltyEvent` 定义 3 type 但 `city_lost / siege_broken` 死代码 | GEN9 |
| D-055 | HIGH | 投机标签 `_poachThr` 把 45 硬编码(科技 buff 失效)| GEN9 `poachGen` |
| D-061 | HIGH | AI 处决俘虏 `killGen(name, **null**)` | GEN14 `aiDisposePrisoner` |
| D-063 | HIGH | `poachGen` 玩家挖角成功后漏写 `G.genJoinTurn / G.genJoinSource` | GEN9 `poachGen` |
| **D-064** | HIGH | `_execPoach` AI 挖角费用未乘 `(1 + _techPoachCost)` | **留 src/core/claude_ai.js**(不在武将链)。**与 D-065 关联**(见 p3.12 §二.2)|
| D-065 | HIGH | 玩家 `poachGen` vs AI `_aiDoPoach` 公式严重不对称 | GEN9 / GEN7。**sprint 修 D-065 时大概率同步修 D-064** |
| D-084 | HIGH | `succeedRuler` 漏 `clearAllPostsByGen` | GEN14 `succeedRuler` |
| D-042~D-075 其余 19 MEDIUM/LOW | (统称) | calcLoyaltyDelta 公式细节 / 派系 mod / 招募 / 亲密度 / 战死概率 等 | GEN9 / GEN5.b / GEN7 / GEN8 / GEN14 各对应段 |

**外交链(chains/diplomacy.js)— 31 D 类原 audit 第二多**:位置文档化随 audit pass 2 sprint 启动时补做,本 phase notes 未逐一标段。

**经济 / 政治 / 军事 / 价值观 / 豪族 / 事件链**:各 chain 抽离时 phase3_X_notes 已记录函数位置,sprint 时按 chain header §三(写口归属声明)+ 各 notes §五(D 类位置)定位。

### 9.2 武将链 sprint 批次建议(p3.12 §五)

基于 30 D 类位置文档化 + D-064/D-065 关联记录:

- **武将链 batch 1**:`poachGen` 全套(D-055 + D-063 + D-065 + 关联 D-064)= 4 个 D 类合并修 → GEN9 + GEN7 + claude_ai _execPoach
- **武将链 batch 2**:`triggerFactionEvent caller` 全套(D-048 + D-049,与事件链 D-131 同源)= 跨链 caller 修
- **武将链 batch 3**:`calcLoyaltyDelta vs processLoyalty 双向对齐`(D-052 + D-053)= GEN9 内部对齐
- **武将链 batch 4**:`俘虏 + 继任`(D-061 + D-084)= GEN14
- **武将链 batch 5**:`setPrefect/setStrategist 漏 applyEthosShock`(D-051)= GEN10 + GEN11

### 9.3 sprint 启动注意事项

- D 类全部 sprint 阶段处理,不在 phase 3 范围(CLAUDE.md 硬规则)
- 武将链 batch 1 D-064 跨 src/core/claude_ai.js + chains/general.js,sprint 启动需要包含两文件
- audit pass 2 决策依据:**triggerFactionEvent 闭环**(p3.2 排除 + p3.12 归位的决策一致性证明,见 p3.12 §二.1)
- audit pass 2 / sprint 决策依据:**setPrefect 业务语义优先于字段位置**(见 p3.12 §二.3)

---

## 十、v181 剩余内容审查(phase 3 末还剩什么)

phase 3 末 `project_romance_v181.html` 剩 **17391 行**(从 39547 起,-22156,-56.0%)。

### 10.0 实测分类清单(grep + wc,p3.13 锚定 commit `28a1c3a`)

p3.13 收尾用 `grep -n` + `awk` + `wc -l` 在 v181 上实测,把 17391 行按桶分类。这是 sprint 启动决策的关键基础数据。

**inline `<script>` 结构**(2 段):
- L1-L830:HTML shell + style + button bar + canvas
- L830 `<script>` 起 / L15992 `</script>` 止 → **第一段 inline script 主代码 15163 行**
- L16072 `<script>` 起 / L17367 `</script>` 止 → **第二段 inline script 1296 行**(顶层 `_debug` 调试块 + dbg refresh helpers)
- 收尾 closing tags + tail = 24 行

**6 桶分类(实测行号)**:

| 桶 | 关键行号 | 行数 | % | 内容(实测函数 / 段) |
|---|---|---|---|---|
| **桶 1**:HTML shell + style + button bar | L1-L830 | **830** | 4.8% | `<head>` + `<style>` + `<body>` + `.topbar` + 顶部按钮 + canvas + main `<script>` opening |
| **桶 2**:顶层静态数据 const(数据 sprint 主目标)| L838-L2900 集中区 | **~2063** | ~11.9% | 38+ 大表 const:`TAX / POLICY / CORVEE / MIGRATE_* / RETAINER_* / RETAINER_PRESET / BLDS / STAGE_GENTRY_BOUNDS / STAGE_PROMO / SIEGE_AFTERMATH / CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / SQUAD_MAX_TROOPS / UNIT_MAX_TROOPS / BILLET_LEVEL_THRESHOLD / TECH_TREE / TECH_PREUNLOCK / JUNS / GENS_FULL / GEN_META / ALL_GENS / GEN_POOL_INACTIVE / FOUNDING_CORE / GEN_CLASS / CLASS_META / STATE_CITIES / STATE_NAMES / STATE_TIER / CITY_TO_STATE / STATE_TO_GENTRY_FAC / GENTRY_FAC_TO_STATES / CLAN_FAMILIES / MAGNATE_CLANS / COUNTY_DATA / COUNTY_NAME_TO_CITY / COUNTY_INDEX / LOCAL_BONUS_CAP_V170 / COUNTY_CLAN_SENS / FACTION_DEFS / POST_TIERS / ALL_POSTS / COURT_PROPOSALS_MIL / COURT_PROPOSALS_CIV` 等 |
| **桶 3**:渲染层尾巴(留 v181 / phase 2 原则)| L4100-L5900 + L13000-L15115 散在 | **~5500** | ~31.6% | 8 right tabs + renderRight(L4134/L4310/L4484/L4657/L5177/L5383/L5644/L5775/L13139,集中区 1801 行)+ renderMilTab + 战斗动画 ~2517 行 + 各 modal HTML 构造(战斗确认 / 朝议 / 外交 / 招募 / 调动 / billet / migrate / api-key / 战报 / 俘虏 / ceremony picker)+ 各 modal handler(`_show* / _confirm* / open* / close* / dismiss* / cancel*`)+ tooltip helper 留 v181 部分。**grep 命中 77 个 show/open/render/_show/close/_confirm/render/_baDraw/_baGet/_play/_drainPending 等 UI 函数** |
| **桶 4**:_exec 派发(**架构债,见 §10.5**)| L15116-L15735 | **620** | 3.6% | **36 个 _execXxx**(实测,plan 字面"39 个"实测 36 个):`_execBuild / _execSetTax / _execSetPrefect / _execTransferFood / _execToggleResupply / _execCancelSupply / _execAppointPost / _execDismissPost / _execSetStrategist / _execRecruitWild / _execPoach / _execResearch / _execDeclareWar / _execProposeAlliance / _execBreakAlliance / _execDiploGift / _execDiploArmistice / _execStartClaim / _execDemandVassal / _execSubmitVassal / _execReleaseVassal / _execSchemeDriveWolf / _execSchemeTwoTigers / _execSchemeSpy / _execSchemeRumor / _execSchemeScout / _execMove / _execRecruit / _execDisband / _execSetCamp / _execSetAmbush / _execCancelSpecial / _execCancelSiege / _execBillet / _execSetReinforcePolicy / _execEnthrone` |
| **桶 5**:reset + serialize + boot 集中点 | L13592-L14602 集中区 + 散在 | **~1000** | ~5.7% | `loadFromSlot`(L13592)/ `showTitleScreen`(L13612)/ `_exitGame`(L13653)/ `backToTitle`(L13663,M4 carry-over §1 集中 reset 20+ lets)/ `saveGame` meta + slot codec / 顶层 boot call / 各 boot helper / `_checkSavesForTitle` / keyboard handler |
| **桶 6**:顶层 lets + 工具 + 第二段 _debug script + 主代码散在 | 散在 + L16072-L17367 | **~7378** | ~42.4% | **第二段 inline `<script>` 1296 行**(L16072-L17367,顶层 `_debug` 对象 + `_dbgRefreshGenOptions / _dbgRefreshSlotLabels` 等调试块)+ **28+ 顶层 lets**(`_fastForward / _ffTurns / _battleAnimating / _activeOverlay / _ovTerritoryCache / _ovTerritoryTurn / _ovBaseCache / _ovBaseTurn / _staticMapCache / _mapShowGrid / _fogSvgCache / _fogCacheTurn / _fogCacheVersion / _citySvgCache / _cityCacheTurn / _cityCacheSelCity / _cityCacheVersion / _moveRangeCache / _rm / _stackPickerOpen / _rdp / _ex / _as / _zoomRenderTimer / _suppressNextClick / _tutPage / _mapScale / _mapTx / _mapTy / _mapDrag / _unitMenu / _pendingCourtCouncil / _pendingCards / _shownCities` 等)+ 工具(`log` / `updateFacStats` / `_unitTouch` / `_facTouch` 等留 v181,跨多模块共用)+ 各 chain 留 v181 的 helper(p3.7 `getGenBirthplace / setStrategist / getStrategistInt`(p3.7→p3.12 已抽)/ p3.9 粮食警报段 8 funcs + 2 const / p3.12 squad class 6 funcs / p3.12 武将数据 const 区域)+ tail closing tags + 各 chain reverse-callee 留 v181 的 helper |
| **总计** | — | **17391** | 100% | |

**桶分类的 sprint 决策启发**:

- **桶 2 数据 sprint**:~2063 行(11.9%),单 sprint 可减重 ~2000 行,无机制风险。**优先级最高**(单纯 verbatim 搬运到新 src/data/ 文件)
- **桶 4 _exec 架构债**:620 行(3.6%),**已知架构债**(见 §10.5),按 (a) 原则各回各 chain 是后续工作,但需要 chain 级单独讨论(写口跨 9 chain,sprint 范围中)
- **桶 3 渲染层尾巴**:~5500 行(31.6%),**phase 4 主目标**(右 tab 拆分 / modal 队列重组),但要先决定是否继续重构 v181
- **桶 6 顶层杂项**:~7378 行(42.4%,**最大桶**),含第二段 _debug `<script>`(1296 行可单独抽到 src/dev/_debug.js)+ 顶层 lets 跨模块共用 + 留 v181 的 helper。零散难一锅端,sprint 时分批
- **桶 1 + 桶 5**:~1830 行,基本属于"必留 v181"(HTML shell / boot 时序)。**phase 4/sprint 不动这两桶**

### 10.1 留 v181 / phase 2 原则(modal + UI 紧密耦合)

**未抽 modals(phase 2 §5.3 列出 + phase 3 各 chain 严格遵守,落桶 3):**
- 战斗确认:`_showCampBattleConfirm` / `_showSiegeBattleConfirm` / `_showSiegeDefendConfirm` / `_showNextBattleConfirm`(p3.11)
- 战斗动画 + 战报 + 俘虏 + 征兵 modal(p3.11,~2517 行 + 18+ funcs)
- 朝议:`showCourtCouncil / _checkPendingCourtAfterPopup / triggerCourtCouncil`(p3.7)
- 外交:`showDiploSueForPeace / showDiploVassal`(p3.8)
- 军事专项:`openRecruitModal / openExpandModal / openAddSquadModal / openRedeployModal / billetUnit / _confirmBillet / _confirmRedeploy`(p3.11)
- 经济:`showMigrateDialog`(p3.9)+ 粮食警报段(p3.9,8 funcs + 2 const,落桶 6)
- 武将:ceremony modal 部分(`_showCeremonyPicker / _updateCeremonyBtn / _confirmCeremony` 留 src/render/ceremonies.js)
- 其他:`_showApiKeyModal / _confirmApiKey / showNextPrisonerModal / openPostAppoint / openPostAction / openGenProfile / closeGenProfile`(phase 2 留下 + p3.3 留下)

**未抽 right tabs(phase 2 §5.4 列出 + phase 3 不动,落桶 3):**
- `renderRight`(10-tab dispatcher)+ 8 个 right tabs(`renderMilTab / renderPostTab / renderStatsTab / renderFactionTab / renderTechTab / renderSchemeTab / renderEthosTab / renderDipTab`)— phase 3 各 chain 抽离时严格遵守

### 10.2 留 v181 / 启动 / save / boot 时序(落桶 5)

- `M3 showTitleScreen / M4 backToTitle / M5 顶层 boot call / M6 _exitGame / _checkSavesForTitle`(p3.4 留下,phase 3 末复盘维持留 v181)
- `saveGame / loadFromSlot` meta 序列化路径(p3.11 实测:跨 script 写已抽走的 lets,无需变更)

### 10.3 留 v181 / 顶层 lets(p3.4 carry-over §1 / 各 chain 已迁移,落桶 6)

phase 3 期间 11 顶层 lets 已迁移到 chains/military.js(p3.11);其余 28+ 跨 chain 共享 / 渲染缓存 lets 留 v181(实测桶 6 列出)。

### 10.4 留 v181 / 数据 sprint(落桶 2)

- 武将数据 const:`GENS_FULL / GEN_META / ALL_GENS / GEN_POOL_INACTIVE / FOUNDING_CORE / GEN_CLASS / CLASS_META`(p3.12 留 v181 等 src/data/generals.js sprint)
- squad class helpers(p3.12 L2175-L2240):`getSquadClass / getUnitClassBuffs / getClassDuelWeight + genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml`(留 v181 与 GEN_CLASS 数据捆绑等 sprint)
- 城市 / 县 / 派系 / 科技 / 朝议 / 攻城后处置 / 军政经济参数 const(桶 2 完整列出)

### 10.5 留 v181 / Claude AI 配套(phase 3.3 选项 A 决策 → **架构债**)

**实测**(p3.13):
- claude_ai.js 内只有 **1 个 `_execOneAction`**(段 K switch 派发器)
- **36 个 _execXxx 函数体仍在 v181 L15116-L15735(620 行)**(段 M)
- 段 A HTML 按钮 + tab help(L601 + 顶部 button bar 区域)— UI shell,留桶 1
- 段 L 5 个解析器:`_resolveCityId / _resolveFacId / _findUnit / _genInFac / _genDeployed`(共用判断)— 留桶 6
- 段 N UI 模态 + API key + ping — phase 2 原则,留桶 3

**phase 3 已知架构债**(p3.13 review 暴露):

phase 3.3 选项 A 当时描述"M 段留 v181 等 chain 阶段 3.5-3.12 各自带走",但 chain 阶段实际**没有任何 _exec 抽到对应 chain**(scout-before-extract 工作流聚焦在 chain mechanism 上,_exec 派发被视为 claude_ai 配套层,但 claude_ai 只抽 K 派发器)。

**结果**:36 个 _execXxx 仍留 v181(写口跨 9 chain),违反 (a) 原则按写口归 chain 的设计。

**判定**:这是 phase 3 的**已知架构债**,**sprint 阶段处理**。phase 3 不动(超 phase 3 范围,且涉及 36 个函数 + 至少 9 chain header 写口归属声明更新)。

**sprint 启动决策建议**:
- batch _exec 1:经济 _exec → chains/economy.js(`_execBuild / _execSetTax / _execSetPrefect / _execTransferFood / _execToggleResupply / _execCancelSupply` = 6 个)
- batch _exec 2:外交 _exec → chains/diplomacy.js(`_execDeclareWar / _execProposeAlliance / _execBreakAlliance / _execDiploGift / _execDiploArmistice / _execStartClaim / _execDemandVassal / _execSubmitVassal / _execReleaseVassal / _execSchemeDriveWolf / _execSchemeTwoTigers / _execSchemeSpy / _execSchemeRumor / _execSchemeScout` = 14 个)
- batch _exec 3:军事 _exec → chains/military.js(`_execMove / _execRecruit / _execDisband / _execSetCamp / _execSetAmbush / _execCancelSpecial / _execCancelSiege / _execBillet / _execSetReinforcePolicy` = 9 个)
- batch _exec 4:政治 _exec → chains/politics.js(`_execResearch / _execEnthrone` = 2 个)
- batch _exec 5:武将 _exec → chains/general.js(`_execAppointPost / _execDismissPost / _execSetStrategist / _execRecruitWild / _execPoach` = 5 个,**含 D-064**)

5 batch 完成 = v181 -620 行 + 9 chain header §三写口归属声明扩展。**与 D-064 sprint 同步处理**(见 §九 武将链 batch 1)。

### 10.6 留 v181 / inline 主代码(实测桶分布,见 §10.0)

剩余 17391 行 6 桶分布已实测列出。汇总:
- 桶 1 HTML shell(830,4.8%)+ 桶 5 boot/save(~1000,5.7%)= **必留 v181** ~1830(10.5%)
- 桶 2 静态数据(~2063,11.9%)= **数据 sprint 主目标**
- 桶 4 _exec(620,3.6%)= **架构债 sprint**(§10.5)
- 桶 3 渲染层(~5500,31.6%)= **phase 4 候选**
- 桶 6 顶层杂项 + 第二段 _debug(~7378,42.4%)= **零散 sprint 分批**

### 10.7 phase 4 / sprint 路径建议(本 doc 不计划,只列入留底)

phase 3 末后续可能的工作方向(**phase 3 收尾后单独讨论**,不在本 doc 范围):
- **数据 sprint**(桶 2,~2063 行):优先级最高,无机制风险
- **_exec 架构债 sprint**(桶 4,620 行,5 batch,见 §10.5):与 D-064 同步
- **audit sprint 修 D 类**(参考 §九 sprint 批次建议):武将链 5 batch + 各链 batch
- **phase 4 渲染层补刀**(桶 3,~5500 行):右 tab 拆分 / modal 队列重组 — 是否进 phase 4 待决
- **第二段 _debug `<script>` 单独抽**(桶 6 子集,1296 行):可单独抽到 src/dev/_debug.js,纯调试代码无运行时影响

---

## 十一、阶段 1 + 2 + 3 累计

| 指标 | 起点(v181 原版) | 阶段 1 末 | 阶段 2 末 | **阶段 3 末** | 累计变化 |
|---|---|---|---|---|---|
| v181.html 行数 | 39547 | 36799 | 34580 | **17391** | **-22156(-56.0%)** |
| src/data/ 文件数 / 行数 | 0 / 0 | 6 / 2913 | 6 / 2913 | 6 / 2913 | +2913 |
| src/render/ 文件数 / 行数 | 0 / 0 | 0 / 0 | 5 / 2391 | 5 / 2376 | +2376 |
| src/core/ 文件数 / 行数 | 0 / 0 | 0 / 0 | 0 / 0 | **7 / 4134** | +4134 |
| src/chains/ 文件数 / 行数 | 0 / 0 | 0 / 0 | 0 / 0 | **8 / 15433** | +15433 |
| src/ 总文件数 | 0 | 6 | 11 | **26** | +26 |
| src/ 总行数 | 0 | 2913 | 5304 | **24856** | +24856 |
| 项目代码总行数 | 39547 | 39712 | 39884 | **42247** | +2700(注释 / header / 加载 tag 增量) |
| D 类自然 close | 0 | 2(D-141 + D-144) | 2 | 2 | 不变(phase 3 0 主动 fix) |
| smoke 字段层数 | — | 1 层 | 2 层 | 2 层 | +3 字段(phase 2.0) |
| baseline 文件 | v181_pre_refactor.json | phase1_complete.json | phase1_post + phase2_complete | **phase1_post + phase2_complete + phase3_complete**(3 baseline 共存) | +1 baseline / phase |
| git tag(baseline 归档) | v181-pre-refactor | phase1-baseline-archive | (无新增) | **phase3-complete-archive** | +1 tag |

**项目代码总量"变重"是预期效果**:抽离 + verbatim + 6 项 header 必含 + script tag + section header marker → src/ 增量大于 v181 减重。这是为可维护性付出的合理代价(每个 chain 的 6 项 header 是审计单点切入,不是冗余)。

---

## 十二、phase-3 → main 合并

合并方式:`git merge --no-ff refactor/phase-3`(保留 phase-3 分支历史 + 13 sub-session commit,便于追溯)。

合并 commit hash 见 main 分支 git log。

**配套清理动作(p3.13 收尾)**:
- 12 个本地工作分支(`refactor/p3.1-state-helpers` 到 `refactor/p3.12-general`)统一删除;`refactor/phase-3` 主分支保留
- 加 git tag `phase3-complete-archive` 锚定本阶段 baseline(同 phase 1+2 模式)
- `tests/baseline/phase3_complete.json` 锁定(本 session,见 §四.2)

---

(Phase 3 Summary 完结 — 8 链 + map.js + 4 core + 1 phase 2 carry-over close,13 sub-session,smoke 全程 byte-identical,0 D 类主动 fix,5 工作流原则沉淀)
