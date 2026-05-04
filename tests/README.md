# tests/ — Project Romance Refactor Smoke Test

> **目的**:在重构期保证"行为不变性"。每次抽数据/抽渲染/拆机制后,smoke 必须 PASS。
>
> **不是**:单元测试 / 集成测试 / 性能测试。仅为重构期"代码搬运不改行为"提供安全网。

---

## 一、跑

```bash
# 一次性
npm install jsdom

# 跑 smoke,生成 tests/current.json
node tests/smoke.js

# 与 baseline 比对
node tests/compare.js
```

退出码:0=PASS,1=FAIL(有 diff),2=ERROR(文件读不到等)。

---

## 二、设计

### 第一层:核心状态快照(本 session 实装)

- 跑模式:jsdom + headless,无 UI 渲染
- 固定 seed(`project_romance_test_seed_001`),Math.random 全替换为 Mulberry32
- 50 turn,AI 自动推进,每 turn 末抓 10 类字段
- 输出 `current.json`,与 `baseline/v181_pre_refactor.json` deep-diff
- PASS 标准:**100% 一致**(任何 diff 必须解释或回滚)

### 抓的 10 类字段

| # | 路径 | 频率 |
|---|---|---|
| 1 | `factions[].{gold,grain,wood,iron,troops_total}` | 每 turn |
| 2 | `factions[].ethos.{benevolence,order,legitimacy,martial}` | 每 turn |
| 3 | `factions[].reputation` | 每 turn |
| 4 | `cities[].{fac,occupied,troops}` | 每 turn |
| 5 | `cities[].income_last_turn` | 每 turn |
| 6 | `diplo[].{a,b,status,rel}` | 每 turn |
| 7 | `generals[].{fac,post,loyalty,factionMod,status,lvl}` | 每 turn |
| 8 | `units[].{fac,city,lvl,morale,troops}` | 每 turn |
| 9 | `eventLog[]` 累计 | 每 turn |
| 10 | `G.{turn,currentEvent,_eventQueue.length,_eventPromises.length}` | 每 turn |

### 后续层(留给后续 session,本 session 不做)

- **第二层**(REFACTOR_PLAN 阶段 2.0 升级):决策路径采样 — cityChangeLog / diploChangeLog / loyaltyCrossLog / eventTriggerLog / factionModLog
- **第三层**(默认不做):UI/DOM 快照,仅在阶段 3 实际遇到 UI 时序问题再做

---

## 三、字段命名校准记录(F4 实测结果)

> v181 实测 G 真实结构与 REFACTOR_PLAN §四 文档命名**大幅不一致**。
> 本段记录**实测命名 vs 文档命名**的偏差。
> 硬规则:不擅自改 REFACTOR_PLAN(制作人 approve 过的文档),仅在 smoke 代码内做映射。

### 总览

| # | 文档(REFACTOR_PLAN §四) | v181 实测 |
|---|---|---|
| 1 | `factions[].{gold,grain,wood,iron,troops_total}` | `factions[fid].res.{gold, wood, iron, horses}` + `factions[fid].totalTroops` |
| 2 | `factions[].ethos.{benevolence, order, legitimacy, martial}` (4 维) | `factions[fid].ethos.{mandate, power, civil, military, strategy}` (**5 维**) |
| 3 | `factions[].reputation` | `G.reputation[fid]` (**G 顶层 map**,不是 faction 字段) |
| 4 | `cities[].{fac, occupied, troops}` | 一致 ✅ |
| 5 | `cities[].income_last_turn` | **不存在** — 用 `cities[cid].storage` 替代(当前积粮快照) |
| 6 | `diplo[].{a, b, status, rel}` | `diplo[key].{status, rel, suzerain?}`,key=`"wei-shu"` 双向 |
| 7 | `generals[].{fac, post, loyalty, factionMod, status, lvl}` | `generals[fid][i].{name, com, war, int, pol, cha, role, apt}` 是 base;运行时状态散在 G 顶层多张 map(`genPost / genLoyalty / genFactionMod / genWounded / genJoinTurn / genJoinSource / genMerit / genWinCount`),按武将名做 key |
| 8 | `units[].{fac, city, lvl, morale, troops}` | `units[].{id, fac, hq, hr, status, level, squads:[{genName,type,troops,maxTroops,morale}]}` — 子部队在 `squads` |
| 9 | `eventLog[]` 累计 | **不存在** — 用 `G.logs[]` 替代(综合日志 `[{msg, type}]`,含事件/战斗/系统) |
| 10 | `G.{turn, currentEvent, _eventQueue.length, _eventPromises.length}` | `G.{turn, _pendingEvent, _eventQueue, _eventPromises, _eventCooldown, _eventCatCooldown, _cityChangeLog}` — `currentEvent` → `_pendingEvent` |

### 派生字段(每 turn 重算,作为聚合校验)

`factions[fid].{cityCount, totalTroops, totalPop}` — 这些是派生,但被纳入 baseline 因为它们能快速暴露统计错乱。

### 没抓但重要的字段(后续考虑)

- `factions[fid]._tech`(科技状态)— 体积大,且 v181 重构期不动 tech,暂不抓
- `G.fog / G.fogSnap`(战争迷雾)— 体积大,与玩家主观视角相关,暂不抓
- `G.cityHistory`(城市易主历史)— 类似 cityChangeLog,暂只抓 length

### 校准流程(后续 session 用)

如果重构期间发现新字段需要纳入 / 旧字段需要去除:
1. 改 `captureState`
2. 跑 smoke 三次确认稳定
3. 重新生成 baseline:`cp tests/current.json tests/baseline/v181_pre_refactor.json`
4. commit:`test(p0): extend smoke field X (approved by 制作人)`
5. **不改 REFACTOR_PLAN.md**

---

## 四、加新字段流程

加新字段会改变 baseline 的形状,所以:

1. 先在这个对话里说清"为什么要加"
2. 制作人 approve
3. 改 `captureState`
4. 跑 smoke 三次,确认稳定
5. **覆写** `baseline/v181_pre_refactor.json`(必须基于当前 v181.html,因为这是权威基准)
6. commit:`test(p0): extend smoke layer 1 with field X (approved)`

**禁止**:为了让 smoke PASS 而修改 baseline。baseline 是权威,不是为了让测试过的工具。

---

## 五、回归触发条件

跑 smoke FAIL 时:

1. 先看 `compare.js` 的 diff 报告,定位差异字段
2. 30 分钟内能定位 → fix + 重跑
3. 30 分钟内无法定位 → 工作分支 reset HEAD~1 + 回 Claude.ai 讨论
4. **绝对不允许**:为了 PASS 而修改 baseline.json 或注释掉 captureState 字段

---

## 六、文件清单

| 文件 | 作用 |
|---|---|
| `smoke.js` | 主脚本(jsdom + 50 turn + captureState) |
| `compare.js` | deep-diff baseline vs current |
| `vendor/seedrandom.js` | Mulberry32 PRNG(public domain),注入式替换 Math.random |
| `baseline/v181_pre_refactor.json` | 权威 baseline,基于 v181 原代码 |
| `current.json` | 每次跑 smoke 的输出(.gitignore 排除) |
| `README.md` | 本文件 |

---

## 七、依赖

- Node 18+ (用了 `fs.readFileSync` 等核心,无版本敏感)
- `jsdom` ≥ 22(npm install jsdom)— 仅 dev 依赖,生产代码不依赖

`package-lock.json` 在 .gitignore 中。如需锁版本,后续 session 引入 package.json + lock。

---

## 八、已知坑(F5/F6 实测后补)

### 1. `let G` 不挂 window
v181 用 `let G = {...}` 在脚本顶层声明 — `let/const` 不挂 `window`。jsdom 内拿 G 的方法是**注入新 `<script>`**,classic script 在同 realm 共享 lexical environment,所以注入的 script 可以读 `G`。smoke.js 通过 `window.__G__` 暴露。

### 2. `_fastForward` 是 v181 自带 headless 开关
- 文件位置:L25073 `let _fastForward = false`
- 行为:nextTurn 在 ff=true 时(L16588-16626)自动选第一个非 disabled 事件选项 + 自动消化战斗 + 不 renderAll
- smoke.js 注入 `__setFF__(true)` + 整个 50 turn 都开着 ff
- 默认路径(ff=false)在 jsdom 里跑会卡住,因为 `G._pendingEvent` 一旦被设,下一次 nextTurn 会直接 return(L16306)

### 3. nextTurn 是 async,**必须 await**
v181 L16303 `async function nextTurn()`,内部有多个 `await sleep(...)` 和 `await runAI()`。同步调用会丢动作。

### 4. seed 注入时机
`Math.random` 必须在 jsdom **`beforeParse` 钩子内**替换 — 早于任何内联 `<script>` 执行。如果在 `DOMContentLoaded` 后再换,initGame 已经用 native random 跑了一段,baseline 不可重现。

### 5. captureState 不抓 fog/tech/cityHistory
体积太大;若重构期需要纳入,走「加新字段流程」。

### 6. v181 文件指针
- 当前 baseline 基于 `project_romance_v181.html` (39547 行 / 2.0 MB,即 v181 BUG A/B 修复后版本)
- 阶段 1+ 重构开始后,**v181.html 自身被减重**(抽数据移到 src/data/*.js + 用 `<script src=...>` 引入)
- baseline 不变,因为 baseline 是**行为快照**,与文件结构无关
