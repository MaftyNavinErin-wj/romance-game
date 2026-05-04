# Project Romance — Refactor Plan v1.0

> 制作时间:2026-05-04
> 适用版本:v181(8 链 audit pass 1 完成后启动)
> 目标:从单 HTML 2.0 MB / ~39500 行拆为 data / render / chains / core 四层架构
> 操作平台:Claude Code(多短 session)

---

## 一、重构总目标

**从**:`project_romance_v181.html` 单文件 2.0 MB / ~39500 行(机制 + 渲染 + 数据混在一起)
**到**:四层模块化结构(data / render / chains / core),每层职责清晰

**驱动力**:
- 8 链 audit pass 1 完成,发现 **145 D 类**,其中 27 HIGH 集中在"重构推广不彻底 / Claude AI 路径错配 / 跨链 helper 散布"等架构性问题
- 单文件结构已无法支撑后续 audit pass 2 + 新功能开发
- robustness 优先(无时间压力,不发版,不卡 token)

**不做的事(再次重申)**:
- ❌ 重构期不修 HIGH/MEDIUM D 类(留到重构完成后 sprint)
- ❌ 不擅自添加新功能
- ❌ 不重写 HANDOVER 早期章节
- ❌ 不并行多阶段(阶段 1 完成才进阶段 2)

---

## 二、最终架构(终态预览)

```
project_romance/
├── index.html                    壳,<script> 引入 main.js
├── src/
│   ├── data/                     阶段 1 抽出
│   │   ├── events.js             EVENT_DEFS 34 def(8 categories)
│   │   ├── generals.js           GEN_TAGS / wildPool 初始
│   │   ├── cities.js             城市初始数据
│   │   ├── factions.js           势力初始 + 配置
│   │   ├── constants.js          cooldown / threshold / 各种 magic number
│   │   └── tags.js               8 链共用枚举(tags / categories)
│   ├── render/                   阶段 2 抽出
│   │   ├── notifications.js      showNotif 系列
│   │   ├── modals.js             弹窗(事件选择 / 确认 / 任命)
│   │   ├── ui_panels.js          主 UI(势力面板 / 城市面板 / 武将列表)
│   │   ├── ceremonies.js         典礼(称帝 / 任命典礼)
│   │   └── tooltips.js           tooltip / hover
│   ├── chains/                   阶段 3 抽出
│   │   ├── economy.js            E1 经济
│   │   ├── military.js           E2 军事
│   │   ├── general.js            E3 武将(含派系修正)
│   │   ├── politics.js           E4 政治
│   │   ├── diplomacy.js          E5 外交
│   │   ├── event.js              E6 事件(含 EVENT_DEFS 调度)
│   │   ├── ethos.js              E7 价值观
│   │   └── gentry.js             E8 豪族
│   ├── core/                     阶段 3 抽出
│   │   ├── state.js              G 顶层状态 + 初始化
│   │   ├── hubs.js               跨链 hub(triggerFactionEvent / checkEventPromises / applyEthosShock 等)
│   │   ├── helpers.js            通用 helper(safeSub / safeAdd / 数组工具)
│   │   ├── claude_ai.js          getGameState / prompt / _exec 派发器(独立模块,根治 D-099/D-100/D-121/D-130)
│   │   └── tick.js               主循环 / nextTurn
│   └── main.js                   启动入口
└── tests/
    ├── smoke.js                  smoke test 主脚本
    ├── compare.js                baseline 比对工具
    ├── baseline/
    │   ├── v181_pre_refactor.json   重构前 baseline(权威)
    │   ├── phase1_complete.json     阶段 1 完成后 baseline
    │   └── phase2_complete.json     阶段 2 完成后 baseline
    └── README.md                 使用说明
```

---

## 三、三阶段路线图

### 阶段 0:Smoke Test 框架(前置必做)

**目标**:在动游戏代码前,先建立"行为不变性"安全网。

**Session 0.1:建 smoke test 第一层 + 跑 baseline**
- 建 `tests/smoke.js` 主脚本(headless 启动 + 固定 seed + 50 turn 模拟)
- 建 `tests/compare.js` 比对工具(deep diff + 报告输出)
- 第一层抓 10 类核心字段(见下文 §四 smoke test 详细设计)
- 在 v181 原代码上跑 baseline,存成 `tests/baseline/v181_pre_refactor.json`
- 写 `tests/README.md`
- **验证标准**:连续跑 3 次 smoke,3 次结果完全一致(无随机性泄漏)

**估计代码量**:300-500 行 JS
**估计 session 时长**:2-3 小时
**输出**:smoke test 框架 + baseline.json

---

### 阶段 1:抽数据(低风险,先行)

**目标**:把所有"常量定义 / 静态数据"从 v181.html 抽到 `src/data/*.js`。**只搬运,不改逻辑**。

**风险评估**:低
- 数据抽离不应改变任何运行行为
- smoke test 第一层应该 100% PASS

**Session 1.1:抽 EVENT_DEFS → data/events.js**
- 范围:34 个 event def + 8 categories + helper(getEventDef 等)
- 修改 v181.html:用 `<script src="src/data/events.js">` 引入,删除原内联定义
- **smoke 验证**:必须 PASS,任何 diff 即 bug
- **D 类自然 close**:无(EVENT_DEFS 本身无 LOW defer)

**Session 1.2:抽 GEN_TAGS → data/generals.js**
- 范围:GEN_TAGS 全表 + wildPool 初始 + tag helper
- **smoke 验证**:必须 PASS
- **D 类自然 close**:D-145(gen_referral 死代码 key 抽离时不带)

**Session 1.3:抽城市初始数据 → data/cities.js**
- 范围:CITIES 初始定义 + 地理关系(city.adjacent 等)
- **smoke 验证**:必须 PASS

**Session 1.4:抽势力初始 → data/factions.js**
- 范围:FACTIONS 初始 + 君主初始 + 势力 ethos 初始
- **smoke 验证**:必须 PASS

**Session 1.5:抽常量 → data/constants.js**
- 范围:cooldown / threshold / 默认值 / magic number 集中化
- **D 类自然 close**(LOW defer):
  - D-141: catCooldown=3 集中化
  - D-144: G.reputation 默认值集中化
  - D-123: 漂移系数集中化
  - 其他 magic number 见 cross_chain_d_list_v1_0.md §四 defer 类
- **smoke 验证**:必须 PASS

**Session 1.6:抽共用枚举 → data/tags.js**
- 范围:8 链共用的 tags / categories / status enum
- **smoke 验证**:必须 PASS

**Session 1.7:阶段 1 收尾**
- 全量 smoke test
- 跑 baseline 在阶段 1 完成代码上,存成 `tests/baseline/phase1_complete.json`
- 验证 `phase1_complete.json` == `v181_pre_refactor.json`(必须完全一致)
- 写 `docs/phase1_summary.md` 记录:抽出文件清单 / 自然 close 的 D 类 / 遇到的边缘 case

**阶段 1 总估计**:7 sessions / 约 1500-2500 行新文件 + v181.html 减重

---

### 阶段 2:抽渲染(中等风险)

**目标**:把所有 DOM 操作 / 弹窗 / 通知 / UI 渲染从 v181.html 抽到 `src/render/*.js`。机制层留 hook 调用,render 层不直接读 G state(除非通过明确接口)。

**风险评估**:中等
- 渲染抽离可能改变弹窗时序,间接影响事件触发
- 需要 smoke 第二层(事件触发记录)

**Session 2.0:smoke test 第二层升级**
- 在游戏代码插入 5-8 个关键状态变化 hook
- 累计记录到 `eventLog[]` / `cityChangeLog[]` / `diploChangeLog[]` / `loyaltyCrossLog[]`
- 跑 baseline 在阶段 1 末代码上,扩展 `phase1_complete.json` 增加第二层数据

**Session 2.1:抽 showNotif → render/notifications.js**
- 范围:showNotif 全部调用点 + 通知队列管理
- 接口设计:render.showNotif(msg, type, timeout) ← 由机制层调用
- **smoke 验证**:第一层 PASS + 第二层 eventLog 一致

**Session 2.2:抽弹窗 → render/modals.js**
- 范围:事件选择弹窗 / 确认弹窗 / 任命弹窗 / 外交弹窗
- 接口设计:render.openModal(type, data, callbacks) ← 由机制层调用
- **smoke 验证**:第一层 + 第二层 PASS

**Session 2.3:抽主 UI → render/ui_panels.js**
- 范围:势力面板 / 城市面板 / 武将列表 / 顶部信息栏
- 接口设计:render.refreshPanel(panelId) ← 每 turn 末由机制层调用
- **smoke 验证**:同上

**Session 2.4:抽典礼 → render/ceremonies.js**
- 范围:称帝典礼 / 任命典礼 / 退位典礼 等特殊渲染
- **smoke 验证**:同上

**Session 2.5:抽 tooltip → render/tooltips.js**
- 范围:hover 提示 + 详情面板
- **smoke 验证**:同上

**Session 2.6:阶段 2 收尾**
- 全量 smoke test(第一层 + 第二层)
- 跑 baseline 存成 `tests/baseline/phase2_complete.json`
- 验证 `phase2_complete.json` 第一层 == `phase1_complete.json` 第一层
- 第二层允许有少量"渲染调用次数"差异(若 render 层做了合并优化),但**事件触发顺序必须一致**
- 写 `docs/phase2_summary.md`

**阶段 2 总估计**:7 sessions(含 smoke 升级)

---

### 阶段 3:拆机制(最高风险)

**目标**:把机制层按 8 链拆到 `src/chains/*.js`,跨链 hub / state / helpers / Claude AI 拆到 `src/core/*.js`。

**风险评估**:高
- 机制拆分涉及函数移位 + import/export 重构
- 跨链 helper 调用关系复杂
- 是 audit 145 D 类大部分 HIGH 的根源

**Session 3.0:smoke test 第三层升级(可选)**
- 仅在阶段 3 中实际遇到 UI 时序问题时再做
- 用 puppeteer 截 5-10 个关键弹窗 DOM 快照
- **默认不做,先观察阶段 3 是否需要**

**Session 3.1:抽 core/state.js + core/helpers.js**
- 范围:G 顶层状态定义 + 初始化 + 通用 helper(safeSub/safeAdd 等)
- **smoke 验证**:第一层 + 第二层 PASS

**Session 3.2:抽 core/hubs.js**
- 范围:triggerFactionEvent / checkEventPromises / applyEthosShock / 易主路径 hub 等跨链 hub 函数
- **关键**:这是 D-131/D-133 的根源所在,抽离后可见接口完整性
- **smoke 验证**:严格 PASS

**Session 3.3:抽 core/claude_ai.js**
- 范围:getGameState / prompt 构建 / _exec 派发器 / Claude API 调用
- **关键**:根治 D-099/D-100/D-121/D-130(Claude AI 信息暴露面)
- **smoke 验证**:严格 PASS

**Session 3.4:抽 core/tick.js + main.js**
- 范围:nextTurn / 主循环 / 启动逻辑
- **smoke 验证**:严格 PASS

**Session 3.5-3.12:按 8 链拆 chains/**

每个 session 抽一条链:

- 3.5: chains/economy.js(经济链 v4.3 / 节点 44 / 14 D 类)
- 3.6: chains/military.js(军事链 v1.1 / 节点 47 / 23 D 类)
- 3.7: chains/general.js(武将链 v1.2 / 节点 51 / 30 D 类)
- 3.8: chains/politics.js(政治链 v1.1 / 节点 45 / 15 D 类)
- 3.9: chains/diplomacy.js(外交链 v1.1 / 节点 51 / 31 D 类)
- 3.10: chains/event.js(事件链 v1.1 / 节点 36 / 16 D 类)
- 3.11: chains/ethos.js(价值观链 v1.1 / 节点 27 / 9 D 类)
- 3.12: chains/gentry.js(豪族链 v4 / 节点 ~37 / ~12 D 类)

每个 session 完成后 smoke 必须 PASS。

**Session 3.13:阶段 3 收尾**
- 全量 smoke test
- 验证 `phase3_complete.json` == `phase2_complete.json`(机制重组不应改行为)
- 写 `docs/phase3_summary.md`
- v181.html 应该已经成为薄壳(只剩 `<script>` 引入)

**阶段 3 总估计**:13 sessions(1 smoke 升级 + 4 core + 8 chains + 1 收尾)

---

## 四、Smoke Test 详细设计

### 第一层:核心状态快照(阶段 0 建,贯穿全程)

**模拟方式**:
- 固定 seed(`Math.random = seedrandom('project_romance_test_seed_001')`)
- AI 自动推进,玩家不手动决策(default action)
- 跑 50 turn

**抓的字段(10 类)**:

| 类别 | 字段 | 频率 |
|---|---|---|
| 1. 势力资源 | `factions[].gold/grain/wood/iron/troops_total` | 每 turn |
| 2. 价值观 | `factions[].ethos.{benevolence/order/legitimacy/martial}` | 每 turn |
| 3. 声望 | `factions[].reputation` | 每 turn |
| 4. 城市归属 | `cities[].fac/occupied/troops` | 每 turn |
| 5. 城市经济 | `cities[].income_last_turn` | 每 turn |
| 6. 外交 | `diplo[].{a, b, status, rel}` | 每 turn |
| 7. 武将状态 | `generals[].{fac, post, loyalty, factionMod, status, lvl}` | 每 turn |
| 8. 部队 | `units[].{fac, city, lvl, morale, troops}` | 每 turn |
| 9. 事件累计 | `eventLog[]` 累计列表 | 每 turn |
| 10. G 顶层 | `G.{turn, currentEvent, _eventQueue.length, _eventPromises.length}` | 每 turn |

**输出**:`current.json` (vs baseline.json deep diff)

**PASS 标准**:阶段 1/2 全字段必须 100% 一致;阶段 3 第一层必须 100% 一致。

### 第二层:决策路径采样(阶段 2.0 升级)

**Hook 点**:
- 城市易主时: `cityChangeLog.push({turn, cityId, oldFac, newFac, path})`
- 外交关系变化时: `diploChangeLog.push({turn, a, b, oldStatus, newStatus, oldRel, newRel})`
- 武将忠诚跨阈值时(80/50/30): `loyaltyCrossLog.push({turn, genName, oldLoy, newLoy, threshold, event})`
- 事件触发时: `eventTriggerLog.push({turn, eventId, fac, mode: silent/popup/fastForward, decided?})`
- 派系修正变化时: `factionModLog.push({turn, genName, oldMod, newMod, source})`

**输出**:扩展 `current.json` 增加第二层数据

**PASS 标准**:
- 阶段 2:事件触发顺序必须一致(允许渲染调用次数差异)
- 阶段 3:全部一致

### 第三层:UI / DOM 快照(默认不做)

**触发条件**:仅在阶段 3 实际遇到 UI 时序问题时再考虑

---

## 五、Git 工作流

### 分支结构

```
main                              永远可玩,每个阶段完成才合并
  └─ refactor/phase-0             smoke test 框架
  └─ refactor/phase-1             阶段 1 主分支
       ├─ refactor/p1-events      session 1.1 工作分支
       ├─ refactor/p1-generals    session 1.2 工作分支
       └─ ...
  └─ refactor/phase-2             阶段 2 主分支
  └─ refactor/phase-3             阶段 3 主分支
```

### Commit 规则

- **1 个搬运动作 = 1 个 commit**
- **1 个 D 类自然 close = 1 个 commit**(单独标 `closes D-XXX`)
- commit message 格式:
  - `refactor(p1.1): extract EVENT_DEFS to data/events.js`
  - `refactor(p1.5): centralize catCooldown constant`
  - `chore: closes D-141 via centralization`
  - `test(p0): add smoke test layer 1`

### Merge 规则

- 工作分支(refactor/p1-events 等)→ smoke PASS → squash merge 回阶段分支
- 阶段分支(refactor/phase-1 等)→ 全量 smoke PASS + summary doc 写完 → merge 回 main

### 回滚机制

- 任何 session 内 smoke FAIL 且 30 分钟内无法定位 → 工作分支 reset 到上一 commit
- 任何阶段 summary 阶段发现遗留问题 → 阶段分支不合并 main,在阶段分支内修

---

## 六、D 类处理原则(重申)

| D 类等级 | 重构期处理 | 何时处理 |
|---|---|---|
| HIGH(27 个) | ❌ 不修 | 重构完成后 sprint |
| MEDIUM(44+ 个) | ❌ 不修 | 重构完成后 sprint |
| LOW fix(部分) | ❌ 不修 | 重构完成后 sprint |
| LOW defer 架构债 | ✅ **重构期自然 close** | 阶段 1.5 / 1.6 |
| verified-with-notes | ❌ 不动 | 已是设计意图 |
| verified | ❌ 不动 | 已确认无问题 |

**自然 close 的 LOW defer 候选**(阶段 1.5/1.6 处理):
- D-007: 通商签约 -= 不规范
- D-080: 玩家 appoint 守卫 UI 层
- D-085: anti_corruption ② 缺 clan_base loyalty
- D-089: INIT_POSTS 无 stage cap 检查
- D-123: 漂移系数无中央 const
- D-138: 事件 cooldown 全局非势力维度(若结构允许阶段 1 处理,否则留 sprint)
- D-141: catCooldown=3 硬编 4 处
- D-144: G.reputation 默认值硬编 7 处
- D-145: gen_referral 死代码 key

**注**:实际"自然 close"还是"留 sprint"取决于该 D 类是否在阶段 1 抽数据时即被消除。**判定原则**:**该 D 类的修复 = 数据抽离的副产物**,则自然 close;**否则不动**。

---

## 七、总规模预估

| 阶段 | sessions | 估计代码量(新文件) | 估计自然 close D 类 |
|---|---|---|---|
| 阶段 0 | 1 | ~500 行 | 0 |
| 阶段 1 | 7 | ~2000 行 | 5-9 个 LOW defer |
| 阶段 2 | 7 | ~3000 行 | 0(渲染抽离不消除 D 类) |
| 阶段 3 | 13 | ~5000 行 | 5-15 个(机制重组消除死代码) |
| **合计** | **28** | **~10500 行** | **10-25 个** |

**重构后 145 D 类清单更新**:估计剩 120-135 个待 sprint。

---

## 八、Session 调度规则

### Session 长度判断

- **默认每个 session 一个搬运动作**(如 1.1 / 1.2 各一个 session)
- **若 context 余量充足**,可一个 session 连续做多个搬运(如 1.1 + 1.2 + 1.3 合并)
- **判定时机**:每个搬运动作完成 + smoke PASS 后,Claude Code 自评 context 余量,与制作人协商是否继续

### Session 结束条件

满足任一条件 session 立即结束:

1. 当前搬运动作完成 + smoke PASS + Git commit 已 push
2. context 余量预警(建议低于 20% 时收尾)
3. 制作人主动结束
4. smoke FAIL 且 30 分钟内无法定位
5. 遇到设计决策需要回这个对话讨论

### Session 启动 checklist

每个 session 启动时,Claude Code 必须确认:

- [ ] 已读 `CLAUDE.md`
- [ ] 已读 `REFACTOR_PLAN_v1.md` 当前 session 对应章节
- [ ] 已确认当前在哪个 Git 分支
- [ ] 已确认 baseline.json 存在且最新
- [ ] 已知本 session 范围(具体到文件 / 函数级)
- [ ] 已知 out-of-scope(本 session 不允许动的事)

---

## 九、与 audit 文档的关系

**保留不动的文档**:
- `HANDOVER_v181_v1_6.md` — 历史记录,只追加不重写
- `cross_chain_d_list_v1_0.md` — D 类清单,verdict 锁定
- 8 链各自的 walkthrough — 审计已封存

**重构期新增文档**:
- `REFACTOR_PLAN_v1.md` — 本文件
- `CLAUDE.md` — Claude Code 启动宪法
- `docs/phase1_summary.md` — 阶段 1 完成后写
- `docs/phase2_summary.md` — 阶段 2 完成后写
- `docs/phase3_summary.md` — 阶段 3 完成后写
- `tests/README.md` — smoke test 使用说明

**重构后建议(不在本计划内)**:
- HANDOVER 追加 §二一六(重构 epic 总结)
- D 类清单增补"重构后状态"列(自然 close / 待 sprint / 设计变更后失效)

---

## 十、不在本计划内的事

明确划清边界,以下事项**不在本重构计划内**,留到重构完成后再讨论:

- 修 HIGH/MEDIUM/LOW fix 类 D 类(留 sprint)
- audit pass 2(回归测试)
- 新功能开发
- 性能优化
- 代码风格统一(eslint / prettier)
- 单元测试 / 集成测试(smoke 之外的测试体系)
- 类型系统迁移(JS → TS)
- 模块化打包工具(webpack / vite / rollup)— 阶段 3 完成后再考虑是否需要
- UI 框架迁移(原生 → React / Vue)

---

## 十一、风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---|---|---|
| smoke test FAIL 但 diff 无法定位 | 中 | 高 | 工作分支 reset + 拆小 session 重做 |
| 抽数据时发现循环依赖 | 中 | 中 | 暂停搬运 + 在这个对话讨论解依赖方案 |
| 阶段 2 渲染抽离改变事件时序 | 高 | 中 | smoke 第二层抓事件触发顺序,任何顺序 diff 必修 |
| 阶段 3 拆链时发现 hub 函数职责模糊 | 高 | 中 | 在这个对话讨论 hub 边界 → approve → 实装 |
| Claude Code session 超 context 后丢失上下文 | 中 | 低 | session 启动 checklist 强制重读关键文档 |
| baseline.json 因外部因素变化 | 低 | 高 | baseline 锁定在 v181 原代码 + Git tag 标记 |

---

## 十二、本计划版本演进

- **v1.0**(2026-05-04):初版,8 链 audit pass 1 完成后启动
- **v1.x**:每个阶段完成后增量更新(追加 phase summary 引用 + 实际 session 数对比)
- **v2.0**:重构完成后总结版

(本计划 v1.0 完结)
