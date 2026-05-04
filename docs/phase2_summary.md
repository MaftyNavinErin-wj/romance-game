# Phase 2 Summary — 渲染层抽离

> 阶段:Phase 2(REFACTOR_PLAN_v1.md §三 阶段 2)
> 完成日期:2026-05-04
> 起始 commit:`888a522`(phase-1 merged + .gitattributes 等 review fixups 完成)
> 结束 commit:见末尾 phase-2 → main 合并 commit hash

---

## 一、目标 vs 实际

PLAN §三阶段 2 目标:把 DOM 操作 / 弹窗 / 通知 / UI 渲染从 v181.html 抽到 `src/render/*.js`,**只搬运不改逻辑**,接口风格全局函数。

阶段 2 完成 7 个 sub-session(2.0 ~ 2.6),原 PLAN 估计 ~3000 行新文件,实际产出 **2391 行**(略低于估计,主因 PLAN 范围"事件选择/确认/任命/外交弹窗"实际只覆盖部分 modals,大量 modal 留 v181 等 phase 3 处理)。

---

## 二、文件清单(阶段 2 终态)

| 文件 | 行数 | 内容 |
|---|---|---|
| `src/render/notifications.js` | 21 | showNotif(右上角浮动通知,3 秒消失) |
| `src/render/modals.js` | 197 | 6 个 modal 渲染:showGenericModal / closeModal / showModal / closePostModal(通用 infra)+ _showEventToPlayer(事件选择)+ openPrefectModal / openStrategistModal(任命)+ _showEnvoyIntelModal(外交) |
| `src/render/ui_panels.js` | 787 | 4 个面板渲染:renderTurnInfo(顶部信息栏)+ renderLeft + invalidateLeftCache + _leftPanelCache(势力面板)+ renderCityTab + _renderCityList + _renderCityDetail(城市面板)+ renderGenTab(武将列表) |
| `src/render/ceremonies.js` | 95 | 拜将大典(任命典礼)4 函数:_applyCeremony / _showCeremonyPicker / _updateCeremonyBtn / _confirmCeremony |
| `src/render/tooltips.js` | 1291 | 12+ 个 hover/breakdown 函数:hideTip / fmtSigned / _positionTip / showBreakdown(城市)/ showUnitBreakdown / showLoyaltyBreakdown / showFacModBreakdown / showFacBreakdown / showRepBreakdown / hideBreakdown / showDiploBreakdown / showCountyTip / showPopBreakdown / showUnitTip(部队 hover) |
| **合计** | **2391** | |

v181.html 行数变化:**36799 → 34580 行**(-2219,~6% 减重 / 阶段 2 内)。
phase-1 起点 36799,phase-2 终点 34580。

阶段 1+2 累计:**39547 → 34580 行(-4967,~12.6% 减重)**。

---

## 三、Sub-session 进度

| Session | 提交 | 净行数 |
|---|---|---|
| 2.0 smoke layer-2 升级 + baseline rename | `9f20e88` | tests/ 内变更,无 v181 改动 |
| 2.1 showNotif → notifications.js | `d507c55` | v181 -5 / notifications.js +21 |
| 2.2 6 个 modal → modals.js | `d1666ad` | v181 -149 / modals.js +197 |
| 2.3 4 个面板 → ui_panels.js | `b8db66b` | v181 -746 / ui_panels.js +787 |
| 2.4 拜将大典 → ceremonies.js | `03940e4` | v181 -67 / ceremonies.js +95 |
| 2.5 1253 行 tooltips → tooltips.js | `68b0213` | v181 -1252 / tooltips.js +1291 |
| 2.6 收尾 + summary | (本 commit) | docs/phase2_summary.md + tests/baseline/phase2_complete.json |

---

## 四、Smoke layer-2 升级关键产出

**Phase 2.0** 把 smoke 第一层(10 字段)扩展为第一+二层(13 字段),增加 3 个决策路径采样:
- `cityChangeLog`:{count, recent5} — 城市易主路径(seed_001 baseline max=10)
- `genFactionModLog`:{count, recent5 flat across all gens} — 武将派系修正路径(max=587,高密度!)
- `eventQueue`:{ids, head} — 事件队列 ID 数组 + 队首详情(max ids length=6)

**baseline 文件变更**:
- DELETED `tests/baseline/v181_pre_refactor.json`(layer-1 only)
- DELETED `tests/baseline/phase1_complete.json`(layer-1 only,phase 1 末)
- CREATED `tests/baseline/phase1_post.json`(单一权威 layer-1+layer-2,phase 1 末重新捕获)
- 旧 baseline 通过 git tag `phase1-baseline-archive`(指向 commit `888a522`)归档

**Phase 2 期间 baseline 不变** — `phase1_post.json` 在 sub-session 2.1-2.5 间 byte-identical PASS,证明渲染抽离对游戏 state 行为 0 影响。

**Phase 2 末锁定**:`tests/baseline/phase2_complete.json`(本 session 锁定),snapshots 部分 byte-identical 等价于 `phase1_post.json`(meta.generated_at 时间戳除外)。

---

## 五、关键设计决策

### 5.1 接口风格:全局函数 verbatim
按 phase 2.1 启动时确定:**不引入命名空间(render.foo)或事件总线**,所有抽出函数仍以 `function fooBar(...)` 顶层声明形式,通过同 realm classic `<script>` 共享 script-scope hoisting,所有 v181 + events.js 调用点不需修改。

### 5.2 紧耦合 helper 一起抽,共用的留 v181
- `_applyCeremony` 严格算 mechanism(mutates G state),但仅由 ceremony 流程内部调用,phase 2.4 与 ceremony renders 一起抽
- `fmt / log / updateFacStats / sleep` 通用 utility 跨多模块共用,**留 v181**(避免循环依赖 + 不引入 cross-render-module 共享层)

### 5.3 大量 modal 留 v181 待 phase 3
PLAN 2.2 列了 4 类 modal,但 v181 实际有 ~25 个 modal 函数。strict 范围只抽 4 类对应的 6 个函数,其余因深耦合(_pendingBattleConfirms queue / _pendingPeaceOffer queue / animation lock / proposal selection)留 v181。phase 3 mechanism extraction 时统一重组。

未抽 modals 清单(留 v181):
- 战斗确认:`_showCampBattleConfirm` / `_showSiegeBattleConfirm` / `_showSiegeDefendConfirm` / `_showNextBattleConfirm`
- 朝议:`showCourtCouncil`
- 外交:`showDiploSueForPeace` / `showDiploVassalOffer` 等
- 军事专项:`openRecruitModal` / `openExpandModal` / `openAddSquadModal` / `openRedeployModal` / `_confirmBillet` / `_confirmRedeploy`
- 其他:`showMigrateDialog` / `_showApiKeyModal` / `_confirmApiKey` / `closeBattleModal` / `showNextPrisonerModal` / `openPostAppoint` / `openPostAction` / `openGenProfile` / `closeGenProfile`

### 5.4 ui_panels 严格 4 项,renderRight 留 v181
PLAN 2.3 4 项是 "势力 / 城市 / 武将 / 顶部",strict 抽离 4 项对应 renders。renderRight(8-tab dispatcher)留 v181 — 它需要调用 ui_panels.js 的 renderCityTab / renderGenTab(共 script-scope OK)+ v181 内的 renderMilTab / renderPostTab / renderStatsTab / renderTechTab / renderSchemeTab / renderEthosTab / renderDipTab / renderFactionTab(留 v181)。如果把 renderRight 抽到 ui_panels.js,跨文件依赖会变多,反而不直观。

未抽的右侧 tabs 留 v181(7 个):MilTab / PostTab / StatsTab / TechTab / SchemeTab / EthosTab / DipTab / FactionTab 等。

---

## 六、遇到的边缘 case

### 6.1 P2.3 提取 renderLeft 的范围错误 + 修正
首次 sed 提取 L14491-L14619 时多取了 3 行(`_staticMapCache` / `_mapShowGrid` 是地图相关 declarations,不是 renderLeft 的内容)。检查 boundaries 时发现并修正为 L14491-L14614,`/tmp/p_left.txt` truncate 到 124 行。这个错误若没发现会把 map 系统 lets 误移到 ui_panels.js,可能 phase 3 处理 hex 系统时引发 dual-declaration 错误。

教训:每次 sed 提取后必须 head/tail 检查 extracted 文件首尾,确认没有 over-grab。

### 6.2 P2.5 tooltips 是单 sub-session 最大改动(1253 行)
12+ 个 breakdown 函数 + showUnitTip 一气抽出。所有函数都依赖 v181 内的 `fmt`(L16711),通过 shared script-scope hoisting 解析,运行时 OK。本想拆 2 个 sub-session 但 PLAN 只允许 phase 2 共 7 个,且这些 tooltip 都是 hover-popup 概念上属同一类。

### 6.3 _applyCeremony 是 mechanism but 抽到 render 层
严格说 _applyCeremony 是 mechanism(mutates G.genLoyalty / G.units.squads.morale)。但它是 ceremony 流程的 atomic part(picker → confirm → apply),拆分会破坏代码 coherence。phase 2.4 一起抽,在文件 header 显式标注。phase 3 若需要重新归位,可移到 chains/general.js。

### 6.4 v181 内 mechanism 函数仍调用 render 函数
ceremony / breakdown / panel 等渲染函数被 v181 的 mechanism 调用。phase 2 抽离后,调用关系反向:render 层(被引用) ← mechanism 层(调用方,在 v181 inline)。这违反"render 层不直接读 G state"的最终架构原则,但 phase 2 strict 不改逻辑,问题留 phase 3 解决。

---

## 七、阶段 3 启动准备

阶段 3 目标(PLAN §三阶段 3):把机制层按 8 链拆到 `src/chains/*.js`,跨链 hub / state / helpers / Claude AI 拆到 `src/core/*.js`。

**阶段 3 关注点(基于 phase 2 实测)**:
- v181.html 当前 34580 行,绝大部分是 mechanism 代码 + 少量留 v181 的 render 代码(未抽的 modals / tabs)
- core/state.js 拆 G 时需小心 `_leftPanelCache` 等已抽出文件的 lets 与 v181 主 script 的 G 在 script-scope 共享
- chains/event.js 拆事件机制时需把 `_pendingEvent / _eventQueue / rollEventsV2 / _showEventToPlayer / resolveEventChoice / _popEventQueue / _processEventPromises` 一起处理,虽然 _showEventToPlayer 已在 modals.js
- chains/general.js 拆武将链时考虑是否回调 _applyCeremony

阶段 3 共 13 sessions(3.0 第三层 smoke 可选 / 3.1 state+helpers / 3.2 hubs / 3.3 claude_ai / 3.4 tick+main / 3.5-3.12 8 链 / 3.13 收尾)。

---

## 八、阶段 1 + 2 累计

| 指标 | 起点(v181 原版) | 阶段 1 末 | 阶段 2 末 | 累计变化 |
|---|---|---|---|---|
| v181.html 行数 | 39547 | 36799 | 34580 | **-4967(-12.6%)** |
| 抽出文件总行数 | 0 | 2913(src/data/) | 5304(src/data/ + src/render/) | +5304 |
| D 类自然 close | 0 | 2(D-141 + D-144) | 2 | 不变 |
| smoke 字段层数 | — | 1 层 | 2 层 | +3 字段 |
| baseline 文件 | v181_pre_refactor.json | phase1_complete.json | phase1_post.json + phase2_complete.json | renamed/extended |

---

## 九、phase-2 → main 合并

合并方式:`git merge --no-ff refactor/phase-2`(保留 phase-2 分支历史)。合并 commit hash 见 main 分支 git log。**等制作人和 Claude.ai 的 review 通过后才执行**。

phase-2 远程分支可保留(参考)或删除(已合并完成)。
