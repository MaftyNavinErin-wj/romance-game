# Sprint Checkers — D 类 sprint 期静态对账工具

> 来源:codex review(2026-05-06)建议建立 sprint 验证最小框架。3 个静态 checker 一次性投入,后续 145 D 类全部受益。
>
> 工作流原则:**read-only**(不动代码,只产报告) + **粗粒度**(覆盖率优先,精度二级)。每个 finding 都需结合代码 review + walkthrough 二次确认。

---

## 3 个 checker

| # | 脚本 | 服务 D 类 / 模式 | 输出 | 退出码 |
|---|---|---|---|---|
| 1 | `exec_dispatch_audit.js` | D-099 / D-100 / D-016 / D-020 / D-064 / D-076(Claude AI 路径错配模式 3) | `docs/checker_reports/exec_dispatch_audit.md` | 0/1 |
| 2 | `faction_event_caller_audit.js` | D-048 / D-049 / D-131(v130 推广不彻底模式 2)| `docs/checker_reports/faction_event_caller_audit.md` | 0/1 |
| 3 | `state_write_inventory.js` | D-120 + 模式 6 状态生命周期类 | `docs/checker_reports/state_write_inventory.md` | 0/1 |

退出码:**0 = 全 PASS / 1 = 有 finding(预期,sprint 期间不应让它降为 0)/ 2 = ERROR**。

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
- 表 A:`function _exec*` 函数定义全集(grep `src/` + `project_romance_v181.html`)
- 表 B:`_execOneAction` dispatcher case 全集(`src/core/claude_ai.js`)
- 表 C:prompt action type 指令全集(`src/core/claude_ai.js` 多 prompt 块)
- 表 D:case ↔ function 映射(snake_case ↔ camelCase 命名规则)

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
- `warDeclare`(D-049 / D-131):应有 4 caller(玩家 diploWar / aiDoDiplo neutral / `_execDeclareWar` / doEnthrone),实际 1
- `betray`(D-048):应有 3+ caller(玩家 diploWar betray / AI 主动背刺 / de facto 宣战背刺),实际 1

### 输出 finding 类型

| kind | severity | 含义 |
|---|---|---|
| `no_caller` | WARN | 已知 eventType 但 0 caller → 推广漏 / 死代码 |
| `unknown_event_type` | INFO | caller 用了 EVENT_LABELS 之外的 type → 命名漂移 |
| `v181_residue` | INFO | v181.html 仍有 caller(说明该 chain 没完全抽离) |
| `known_gap` | HIGH | 已知 D 类 finding 提示(对照 KNOWN_GAPS) |

---

## Checker 3:G 写口反向索引 + 生命周期闭环

### 数据源
- 全 repo `G._xxx` 顶层动态字段 grep(包括 `G[`_xxx_${...}`]` 模板字段)
- lifecycle 函数体扫描:`backToTitle` / `initGame` / `_serializeG` / `_deserializeG`

### 整体 idiom 兜底
- `_serializeG` 内含 `JSON.stringify(G,...)` → 视为所有 G.xxx 自动 save 闭环
- `_deserializeG` 内含 `Object.keys(snap).forEach(k => G[k] = ...)` 或 `Object.assign(G,...)` → 整体 load 闭环

### 已知限制
1. **只覆盖"整局 reset"语义**(backToTitle / initGame),**不覆盖"每旬末重置"(per-turn expire)**
   - D-120 真正问题:`G._diploActed_${fid}` 在 nextTurn 末没有 `ALL_FACS.forEach(f => delete G[\`_diploActed_${f}\`])`
   - 下版本可扩展 nextTurn / processXxx 函数体扫描
2. checker 不区分"该字段应整局保存"vs"该字段应每旬重置"(语义判定靠 audit walkthrough)
3. 可能误报:某字段在更高层 reset 函数(如自定义 `_resetXxx`)处理,本 checker 未追溯

### 输出 finding 类型

| kind | severity | 含义 |
|---|---|---|
| `lifecycle_gap` (KNOWN) | HIGH | 已知 D 类(D-120) |
| `lifecycle_gap` (其他) | WARN | 模式 6 候选(待二次复核) |

---

## Sprint 工作流集成

### 启动 sprint batch 前
1. 跑 `npm run checkers` 生成最新 3 份报告
2. 选定本 batch 要修的 D 类
3. 在 checker 报告中找到对应 finding 行,作为 fix scout 起点

### batch 末
1. 重跑 `npm run checkers`,对比修后报告
2. 已修 D 类对应 finding 应消失或降级
3. commit message 引用 checker 报告 commit hash 作为 fix 验证锚点

### 维护
- 每个 checker 是 `node` 单脚本,无外部依赖(jsdom 仅 smoke 用)
- KNOWN_GAPS / KNOWN map 在 sprint 推进时按需补充新 D 类
- checker 本身的 limitations 在每个报告 footer 列出
