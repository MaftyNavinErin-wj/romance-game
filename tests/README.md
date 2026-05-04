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

## 三、字段命名校准记录

> v181 实测 G 真实结构与 REFACTOR_PLAN §四 文档命名可能不一致。
> 本段记录**实测命名 vs 文档命名**的偏差,便于后续 session 维护。
> 不擅自改 REFACTOR_PLAN(那是制作人 approve 过的文档),仅在 smoke 代码内做映射。

| 文档命名 | 实测命名 | 备注 |
|---|---|---|
| (待 F4 实测后填) | | |

校准流程:
1. F5 第一次跑 smoke 时,在 `captureState` 里 `console.log(Object.keys(G), Object.keys(G.factions[0]||{}))`
2. 把实测命名记到上表
3. 改 `tests/smoke.js` 的 `captureState`,让它读真实字段
4. **不改 REFACTOR_PLAN.md**

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

- (待补)
