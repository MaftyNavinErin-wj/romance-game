# Sprint Checkers — D 类 sprint 期静态对账工具

> 来源:codex review(2026-05-06)建议建立 sprint 验证最小框架。3 个静态 checker 一次性投入,后续 145 D 类全部受益。
>
> 工作流原则:**read-only**(不动代码,只产报告) + **粗粒度**(覆盖率优先,精度二级)。每个 finding 都需结合代码 review + walkthrough 二次确认。

---

## 3 个 checker — sprint gate 能力差异 ⚠️ **重要**

经 codex 二次 review,3 个 checker 的能力分两层:

| # | 脚本 | 服务 D 类 | Sprint gate 能力 | 退出码语义 |
|---|---|---|---|---|
| 1 | `exec_dispatch_audit.js` | D-099 / D-100 / D-016 / D-020 / D-064 / D-076(模式 3 Claude AI 路径错配) | ✅ **Yes — sprint gate** | HIGH finding → exit 1;清零 → exit 0 |
| 2 | `faction_event_caller_audit.js` | D-048 / D-049 / D-131(模式 2 v130 推广不彻底) | ✅ **Yes — sprint gate** | KNOWN_GAPS HIGH → exit 1;闭合后降为 INFO → exit 0 |
| 3 | `state_write_inventory.js` | D-120 + 模式 6 状态生命周期类 | ❌ **No — advisory inventory** | 永远 exit 0(除非 ERROR);所有 finding 是 WARN |

**关键差异**:

- **Checker 1 + 2 是 sprint gate** — 修对应 D 类后 finding 自动清零或降级,可作为 batch 通过证据。`npm run checkers` exit code 1 反映这两个 checker 的 HIGH finding 状态。
- **Checker 3 是 advisory inventory** — 不能 close D-120(D-120 真正语义是 per-turn reset,本 checker 只查整局 reset)。即使 D-120 修好,checker 3 仍报 WARN(不是 bug)。**D-120 closure 必须靠 walkthrough + 人工 review,不能用 checker 自动判定**。

### Run-all exit code(`npm run checkers`)

- **exit 1** = 有 sprint gate 阻断 HIGH finding(checker 1 或 2 报)→ batch 未完成
- **exit 0** = 无 sprint gate 阻断 HIGH(checker 3 advisory WARN 即使存在也不阻断)
- **exit 2** = ERROR

---

## 用法

### 单独跑

```sh
node tests/checkers/exec_dispatch_audit.js
node tests/checkers/faction_event_caller_audit.js
node tests/checkers/state_write_inventory.js
```

### 一键跑全部(npm script)

```sh
npm run checkers      # 跑全部 3 个 checker,输出报告到 docs/checker_reports/
```

---

## Checker 1:_exec 四表对账

### 数据源
- 表 A:`function _exec*` 函数定义全集(grep `src/core` + `src/chains` + `project_romance_v181.html`,不扫 `src/render`)
- 表 B:`_execOneAction` dispatcher case 全集(`src/core/claude_ai.js`)
- 表 C:prompt action type 指令全集(`src/core/claude_ai.js` 多 prompt 块,使用 `matchAll` 单行多 type 安全)
- 表 D:**主键 = dispatcher case**(权威 source-of-truth),反查 case→fn(F4 修法,避免 `fnToType` 反推假阴性)

### 输出 finding 类型

| kind | severity | 含义 |
|---|---|---|
| `case_no_prompt` | HIGH | dispatcher 有 case 但 prompt 未声明该 type → Claude AI dead code(D-099 模式) |
| `prompt_no_case` | HIGH | prompt 提供 type 但 dispatcher 无 case → Claude AI 输出会被吞(D-100 模式) |
| `no_dispatcher_case` | WARN | 函数定义但 dispatcher 中无 case → 死代码 |
| `missing_function` | ERROR | dispatcher case 引用的函数不存在 |
| `naming_mismatch` | INFO | `_execXxx` ↔ snake_case 命名不规则 |

---

## Checker 2:triggerFactionEvent caller 覆盖表

### 数据源
- 全 repo `triggerFactionEvent('xxx', fid, ...)` 调用点(grep,排除注释行)
- `triggerFactionEvent` 函数体内 EVENT_LABELS 定义(`src/chains/general.js:710`)定义 8 类 eventType:
  `execute / defectorPrefect / conquer / truce / warDeclare / betray / appointPost / removePost`

### 已知 D 类 expected caller(`KNOWN_GAPS`)
- `warDeclare`(D-049 / D-131):应有 **7** caller(walkthrough event_chain `event_chain_walkthrough.md:155` 校准 — `14327/14447/14462/14540/16251/_execDeclareWar 37466/9648`),实际 1
- `betray`(D-048):应有 3+ caller(玩家 diploWar betray / AI 主动背刺 / de facto 宣战背刺),实际 1

### 输出 finding 类型

| kind | severity | 含义 |
|---|---|---|
| `no_caller` | WARN | 已知 eventType 但 0 caller → 推广漏 / 死代码 |
| `unknown_event_type` | INFO | caller 用了 EVENT_LABELS 之外的 type → 命名漂移 |
| `v181_residue` | INFO | v181.html 仍有 caller(说明该 chain 没完全抽离) |
| `known_gap` | HIGH | 已知 D 类未闭合(actual < expected_count)|
| `known_gap_closed` | INFO | 已知 D 类已闭合(actual ≥ expected_count,F1 修法,batch 通过证据)|

### eventType 状态文案(F6 修法)

避免"≥1 caller = 完整覆盖"误导:
- **❌ 0 caller**:可能死代码 / 推广漏
- **⚠️ 已知缺漏 (N/M)**:在 `KNOWN_GAPS`,actual < expected
- **✅ 已知缺漏闭合 (N/M)**:在 `KNOWN_GAPS`,actual ≥ expected(D 类已修)
- **present (N, 完整性未校准)**:不在 `KNOWN_GAPS`,N ≥ 1 但 walkthrough 未提供 expected_count(待 audit pass 2 补充)

---

## Checker 3:G 写口 advisory inventory(NOT D-120 closure gate)

⚠️ **本 checker 是 advisory inventory,不是 D-120 closure gate(F2 修法)**

### 数据源
- 全 repo `G._xxx` 顶层动态字段 grep(包括 `G[`_xxx_${...}`]` 模板字段)
- lifecycle 函数体扫描:`backToTitle` / `initGame` / `_serializeG` / `_deserializeG`

### 写口检测扩展(F3 修法)

| 形式 | 标记 |
|---|---|
| 直接赋值 `G._xxx = ... / G._xxx[k] = ... / G._xxx.prop = ...` | `assign` |
| 删除 `delete G._xxx` | `delete` |
| 复合赋值 `+= / -= / *= / /= / **= / %=` | `compound` |
| 自增/自减 `++` / `--`(前后置) | `inc/dec` |
| Mutation methods `.push() / .pop() / .shift() / .unshift() / .splice() / .sort() / .reverse() / .fill() / .copyWithin()` | `mutation` |
| `Object.assign(G._xxx, ...)` | `Object.assign` |

之前只识别 assign / delete,会漏 `G._eventQueue.push()` 等大量真实 mutation 写口(F3 修法)。

### 整体 idiom 兜底
- `_serializeG` 内含 `JSON.stringify(G,...)` → 视为所有 G.xxx 自动 save 闭环
- `_deserializeG` 内含 `Object.keys(snap).forEach(k => G[k] = ...)` 或 `Object.assign(G,...)` → 整体 load 闭环

### Sprint gate 能力 = NO(advisory only)

- ❌ **D-120 真正问题**:`G._diploActed_${fid}` 在 nextTurn 末没有 `ALL_FACS.forEach(f => delete G[\`_diploActed_${f}\`])` — 这是 **per-turn reset**,本 checker 不查
- 即使 D-120 修好(per-turn reset 加上),本 checker 仍报字段为 lifecycle_gap WARN(不是 bug)
- 反向也成立:本 checker 通过 ≠ D-120 修好(可能漏)
- **D-120 closure 必须靠 walkthrough + 人工 review,不能用 checker 自动判定**

### 仍未覆盖(下版本扩展候选)

1. per-turn reset 检查(扫 `nextTurn` / `processXxx` 函数体内 `forEach delete` pattern)
2. 不区分"该字段应整局保存"vs"该字段应每旬重置"(语义判定靠 audit walkthrough)
3. 可能误报:某字段在更高层 reset 函数(如自定义 `_resetXxx`)处理,本 checker 未追溯
4. 深层对象写入(如 `G._foo.bar.baz = ...`)只识别为 G._foo 的 read

### 输出 finding 类型

| kind | severity | 含义 |
|---|---|---|
| `lifecycle_gap` | WARN | 整局 lifecycle gap(advisory only,F2 修法 — 全部 WARN,不再有 HIGH) |

---

## Sprint 工作流集成

### 启动 sprint batch 前
1. 跑 `npm run checkers` 生成最新 3 份报告
2. 选定本 batch 要修的 D 类
3. 在 checker 报告中找到对应 finding 行,作为 fix scout 起点

### batch 末
1. 重跑 `npm run checkers`,对比修后报告
2. **Checker 1 / 2(sprint gate)**:已修 D 类对应 HIGH finding 应清零或降为 INFO("已闭合"),`npm run checkers` 应 exit 0
3. **Checker 3(advisory)**:WARN finding 可能保留(per-turn reset 修复不被 checker 识别),需 walkthrough + 代码 review 二次确认
4. commit message 引用 checker 报告 commit hash 作为 fix 验证锚点

### 维护
- 每个 checker 是 `node` 单脚本,无外部依赖(jsdom 仅 smoke 用)
- KNOWN_GAPS / KNOWN map 在 sprint 推进时按需补充新 D 类
- checker 本身的 limitations 在每个报告 footer 列出
