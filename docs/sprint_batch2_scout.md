# Sprint Batch-2 Boundary Scout — D-099 Prompt 缺指令(范围缩减版)

> Sprint:`sprint/batch-2-d099-prompts`(从 main `ba4821c` 切出)
> 状态:**v0.3 — codex review 后范围缩减,3 个 AI-safe 指令**
> 工作流:sprint mode(原则 #5 mini scout + #12 入口路径声明 + 三重验证机制)
> 风险等级:**仅对 AI-safe _exec 低风险**(原"纯 prompt 低风险"判定过度乐观,见 §零)
> 来源:`tests/checkers/exec_dispatch_audit.js` checker 1 揭示 7 个 `case_no_prompt` HIGH

---

## 零、Scout 失误 + 范围缩减(v0.3 新增,2026-05-06)

### 失误自报

v0.1/v0.2 scout 把 7 个缺漏指令全部判为"已实装,可暴露",其中 4 个判错:

| 指令 | 失误原因 |
|---|---|
| `cancel_supply` | _execCancelSupply 函数体内 `console.warn('[ClaudeAI] cancel_supply: 当前未实装')` + `return false`(scout v0.1 §二 已读到,但仍标"已实装",DP-A 提了选项但 §六 修法预览仍含其在 7 个内)|
| `diplo_demand_vassal` / `diplo_submit_vassal` / `diplo_release_vassal` | scout 只读 `_exec*` 包装器看到 `(fid, target)` 双参传入 → 误以为 helper 接收双参。**没追下去看 helper 签名**:`function diploDemandVassal(other) { const fid = G.playerFac; ...}` — 单参 + 硬编玩家。JS 静默忽略第二参,Claude AI 触发后 helper 用 `G.playerFac` 当 fid → 写错主体。**这是 cross_chain_d_list:88 标的 D-091 HIGH**(diplomatic_chain_walkthrough §阶段 1.1 audit pass 1 早就发现)|

**根因**:违反原则 #5 scout-before-extract — 没 grep `cross_chain_d_list` 确认本 batch 涉及函数是否有已标 D 类,凭"上层调用看起来对"下判定。

### 沉淀

新原则 #14(本 batch 修文档时同时追加到 `refactor_workflow_principles.md`):

> **每个 sprint batch scout 时,必须 grep `cross_chain_d_list_v1_0.md` 看本 batch 涉及的 `_exec` / 函数是否有已标 D 类。如果有,必须读对应 walkthrough,不能凭"上层调用看起来对"判定。**

### 范围缩减(codex review 修订)

**本 batch 仅暴露 3 个 AI-safe 指令**(对应 7 个原 finding 的子集):

| 指令 | AI-safe? | 理由 |
|---|---|---|
| `toggle_resupply` | ✅ | 函数体仅 flip `G._facResupply[fid]`,fid 来自参数,无硬编 G.playerFac |
| `cancel_siege` | ✅ | `unit.status: 'siege' → 'halt'`,unit 通过 `_findUnit(fid, ...)` 定位,fid 正确 |
| `diplo_armistice` | ✅ | helper 已 fid 参数化(L13649 `_execDiploArmistice` 内部用 fid 不用 G.playerFac)|

**4 个 unsafe 指令本 batch 不暴露,标为 followup**:

| 指令 | 不暴露原因 | Followup batch |
|---|---|---|
| `cancel_supply` | _execCancelSupply 标记未实装(`return false`)| 死代码清理 batch(独立) |
| `diplo_demand_vassal` | helper `diploDemandVassal(other)` 单参 + `G.playerFac` 硬编 | **batch-3 D-091 HIGH 修法**(改 helper 签名 fid 参数化 + caller 校准) |
| `diplo_submit_vassal` | 同上 D-091 模式 | batch-3 D-091 |
| `diplo_release_vassal` | 同上 D-091 模式 | batch-3 D-091 |

### 修订后的 Sprint gate 预期(codex review 修正)

**原 v0.2 写**:checker 1 HIGH 7 → 0,exit 0 = batch 通过。

**修订**:checker 1 HIGH 7 → **4**(剩 cancel_supply + 附庸 3 = intentional out-of-scope 标 followup),exit code **仍 1**(本 batch 不能用 checker 1 exit 0 作 gate)。

→ Sprint gate 证据语义改成:**"checker finding 按 batch 范围正确降级 + 剩余 finding 显式标注 followup batch"**(本 batch 修文档时同时追加到 `refactor_workflow_principles.md`)。

---

---

## 一、Sprint 目标 + 范围

> ⚠️ **§一-§五 是 v0.1/v0.2 scout 阶段的实测记录**(7 个 finding 全部 scout)。
> **最终实装范围见 §零 v0.3 范围缩减 + §六 修法预览(3 个 AI-safe 实装 + 4 个 followup)**。
> 保留 §一-§五 是为留 scout 历史 + 失误自报背景,不代表本 batch 实装范围。

scout v0.1/v0.2 阶段 scout 了 7 个缺漏的 action type 指令(`src/core/claude_ai.js` L1085-L1114 主 prompt + L567-L588 战术 prompt 共缺漏)。

scout 当时认定:这 7 个指令的 `_exec*` 函数都已实装(在 v181.html 内),dispatcher case 也都注册(claude_ai.js:1426-1478),但 prompt 没声明该 type → Claude AI 永远不会输出该 type → dead code(D-099 同模式)。

**v0.3 修订(§零 codex review):** scout 当时判定的"全部已实装"中,4 个判错(cancel_supply 未实装 + 附庸 3 个 helper 签名错配 D-091 HIGH)。本 batch 仅暴露确认 AI-safe 的 3 个,4 个 unsafe 标 followup。

**这是 Claude AI v158+ 实装时遗漏的指令文档化**,不是新功能开发。

---

## 二、7 个缺漏指令清单 + scout(v0.1/v0.2 阶段实测,**含 4 个失误判定**)

> ⚠️ 本节"act schema"列是 scout 阶段判定,§零 已修正:行 #5/6/7 helper 签名实际是单参 + `G.playerFac` 硬编(D-091 HIGH),scout 仅看 _exec* 包装器双参传入误判"已实装"。**最终实装范围以 §六 为准,本表保留作 scout 历史记录**。

| # | type | _exec 函数(v181.html) | 函数体语义(scout 实测) | act schema(scout 阶段判定,**v0.3 已纠错**) | v0.3 实装决策 |
|---|---|---|---|---|---|
| 1 | `toggle_resupply` | `_execToggleResupply` @ L13448-L13453 | 切换势力级 resupply 开关(`G._facResupply[fid]` flip) | `{"type":"toggle_resupply"}`(无参数) | ✅ AI-safe,本 batch 暴露 |
| 2 | `cancel_supply` | `_execCancelSupply` @ L13455-L13459 | **当前未实装**(`return false` + `console.warn`,v159fix 注释明确) | `{"type":"cancel_supply"}` | ❌ unsafe(未实装),followup §3.1.1 |
| 3 | `cancel_siege` | `_execCancelSiege` @ L13948-L13953 | 部队取消围城,`unit.status: 'siege' → 'halt'` | `{"type":"cancel_siege","army_leader":"将名(中文)"}` | ✅ AI-safe,本 batch 暴露 |
| 4 | `diplo_armistice` | `_execDiploArmistice` @ L13649-L13669 | 主动停战(花 1000 金,acceptRate=peaceWillingness),失败退 700 + rel+3 | `{"type":"diplo_armistice","target":"势力ID"}` | ✅ AI-safe(helper fid 参数化),本 batch 暴露 |
| 5 | `diplo_demand_vassal` | `_execDemandVassal` @ L13681-L13686 | scout 当时认为:走 `diploDemandVassal(fid, target)` helper | scout 当时写:`{"type":"diplo_demand_vassal","target":"势力ID"}` | ❌ **unsafe(D-091 HIGH)**,helper 实际单参 + G.playerFac 硬编,batch-3 修复 |
| 6 | `diplo_submit_vassal` | `_execSubmitVassal` @ L13688-L13693 | 同 D-091 模式 | scout 当时写:`{"type":"diplo_submit_vassal","target":"势力ID"}` | ❌ **unsafe(D-091 HIGH)**,batch-3 修复 |
| 7 | `diplo_release_vassal` | `_execReleaseVassal` @ L13695-L13700 | 同 D-091 模式 | scout 当时写:`{"type":"diplo_release_vassal","target":"势力ID"}` | ❌ **unsafe(D-091 HIGH)**,batch-3 修复 |

---

## 三、修法方案(v0.1/v0.2 草案,**v0.3 §零 修订后失效,以 §六 为准**)

> ⚠️ 本节是 v0.1/v0.2 阶段的修法草案(7 个指令全补),**v0.3 §零 codex review 后已修订为 3 个 AI-safe**。最终修法见 §六。

### 修改位置(v0.3 修订)

`src/core/claude_ai.js` 主 prompt(`L1085-L1114`)+ 战术 prompt(`L567-L588`)— 各加 3 个 AI-safe 指令(共 6 行),不达到 37 个 type 全对齐(剩 4 个 followup,见 §零)。

### 修改内容(v0.1/v0.2 草案,**已失效**)

scout v0.1/v0.2 阶段草案的 6 行 prompt 含 3 个 unsafe 指令(diplo_demand/submit/release_vassal),v0.3 已删除这 3 行。最终 prompt 改动见 §六。

### 入口路径声明(原则 #12)

| 入口路径 | 影响 |
|---|---|
| 玩家路径 | **不适用**(纯 prompt 改,玩家 UI 已有对应入口) |
| 传统 AI 路径 | **不适用**(rule-based AI 不读 prompt) |
| Claude AI 路径 | **已修**(prompt 加指令,Claude AI 现可输出该 type;dispatcher case 早就注册不变) |
| 事件路径 | **不适用**(events.js 不调 _exec) |
| 快进路径 | **不适用**(_fastForward 走完整 dispatcher,行为不变) |

### 状态生命周期(原则 #13)

不涉及新增字段 / 字段语义变更 → **不适用**。

### 验证机制(三重 + 新,**v0.3 修订**)

1. **smoke byte-identical**:50 turn smoke 应继续 PASS。理由:prompt 改在 doc string 内,不影响 50 turn AI 行为(非 Claude AI 模式下 prompt 根本不被读)。
2. **checker 1 重跑(v0.3 修订预期)**:`case_no_prompt` HIGH **从 7 降到 4**(剩 cancel_supply + 附庸 3 标 followup),findings 从 10 → 7(4 HIGH + 3 INFO naming_mismatch)。**checker 1 exit 仍 1**(本 batch 不能用 exit 0 作 gate);sprint gate 证据语义 = "降级 + followup 标注"(见 §零 + 工作流原则 §十一)。
3. **代码 review**:3 个新加的 AI-safe prompt 行参数与对应 _exec 函数读取的 `act.xxx` 字段一致(scout §二 v0.3 决策列已对照)。

---

## 四、决策点(等制作人 + codex approve)

### DP-A — `cancel_supply` 是否暴露给 Claude?

**事实**:`_execCancelSupply` 函数体内 `console.warn('[ClaudeAI] cancel_supply: 当前未实装')` + `return false`(v159fix 注释明确)。

**选项**:

| 选项 | 含义 | 取舍 |
|---|---|---|
| (a) **不加 prompt** | 维持 dead code 状态,checker 1 仍报 `case_no_prompt` HIGH for `cancel_supply` | dispatcher case 仍是 dead,无变化;checker 1 finding 数 10 → 4(7-1) |
| (b) **加 prompt + 标 deprecated** | 加 prompt 行 `{"type":"cancel_supply"} — ⚠️ 当前未实装,勿用`;Claude AI 可能输出但 _exec 返回 false | 让 Claude AI 知情;checker 1 finding 数 10 → 3 |
| (c) **删除 dispatcher case + 不加 prompt** | 一次性清死代码 | 改 _execOneAction 函数体,超出"纯 prompt 修改"范围,不建议本 batch 做 |

**我倾向 (a)**:cancel_supply 是 v159fix 明确标记的"未实装"占位,改 prompt 让 Claude 误以为可用反而不对。保持 dispatcher case dead,checker 1 finding 留存作为"D-类未来 fix"提示。本 batch 范围聚焦"实装功能但 prompt 漏声明"的 6 个,不动 (c) 范围内的死代码清理。

### DP-B — `toggle_resupply` 是否需要参数?

**事实**:`_execToggleResupply` 函数体内 `G._facResupply[fid] = !G._facResupply[fid]`(简单 flip 当前势力的 flag,不读 act.xxx)。

**选项**:

| 选项 | 含义 |
|---|---|
| (a) `{"type":"toggle_resupply"}`(无参数,推荐) | 与函数体一致 |
| (b) `{"type":"toggle_resupply","enabled":true/false}`(显式 set) | 改函数体读 act.enabled,本 batch 范围外 |

**我倾向 (a)**:与现有函数体行为一致,纯 prompt 修改不动函数体。

### DP-C — 是否同时修第二处 prompt(L567-L588)?

**事实**:`src/core/claude_ai.js` 还有一个 prompt block(L567-L588,21 个 type),是 Phase 0/1 早期 prompt。checker 1 实测:这个 prompt 也漏 7 个指令中的多个。

**选项**:

| 选项 | 含义 |
|---|---|
| (a) **只修主 prompt**(L1085-L1114)| 简洁,但 Phase 0/1 prompt 仍漏指令 |
| (b) **两个 prompt 都修** | 完整,但需确认 Phase 0/1 prompt 是否还在用(可能是历史 prompt 已 dead) |

**待 scout**:实测 L567 上下文,确认 Phase 0/1 prompt 是否还活着 / 是否暴露给 Claude AI。

---

## 五、scout 实测:L567 prompt block 是否活着?(2026-05-06)

### 实测结果:**活着,且当前在用**

| 项 | 内容 |
|---|---|
| L567 prompt 所属函数 | `_tacticalSystemPrompt(fid)` @ `src/core/claude_ai.js:545` |
| 用法 | `claude_ai.js:1195` / `:1289` 在"战术模式"下作为 systemPrompt 传给 Claude API |
| L1085 prompt 所属函数 | `_claudeSystemPrompt(fid)` @ `:916` |
| 用法 | `claude_ai.js:1189` / `:1285` 在"战略模式"下作为 systemPrompt |
| 切换条件 | 战术 vs 战略两套 prompt,根据 fid 模式 / mode flag 选择(L1186-L1196 / L1280-L1290 上下文) |

### L567 战术 prompt 当前 type 数:**22 个**(vs 主 prompt 30 个)

L567 战术 prompt 缺漏 dispatcher 中 **15 个** type(本 batch-2 关心的 7 个 + 另外 8 个早就缺漏:`cancel_special` / `billet` / `set_reinforce_policy` / `break_alliance` / `scheme_drive_wolf` / `scheme_two_tigers` / `scheme_rumor` / `enthrone`)。

### checker 1 行为说明

Checker 1 当前的 `promptTypeSet` 是**两个 prompt 的并集**(`collectPromptTypes` 扫整个 `claude_ai.js`)。所以只要主 prompt 提到该 type,就视为 prompt 已声明。这会**遗漏** L567 战术 prompt 单独的缺漏。

→ **新发现**:Checker 1 当前粒度对"双 prompt 不一致"无感,需要扩展 — 但这超出本 batch 范围(留 followup)。

### DP-C 决策建议

**修法 (b) 两个 prompt 都修**。理由:

1. 两个 prompt 都活着且都暴露给 Claude AI → 战术模式下的 Claude 仍走 L567 prompt
2. 修一个不修一个会造成"战略模式 Claude 知道 cancel_siege,战术模式 Claude 不知道"的不对称
3. 工作量极小:同样 7 行加到 L567 prompt block

但要做**额外决策**:L567 prompt 还缺另外 8 个 type(早就缺漏,不是本 batch 7 个之内)。本 batch 范围是否扩大到修这 8 个?

**子决策 DP-C.1**:

| 选项 | 含义 |
|---|---|
| (i) 本 batch 仅修 7 个(checker 1 显示的) | 保持 batch 范围聚焦,L567 仍漏 8 个(留下个 batch) |
| (ii) **本 batch 修 L1085 7 个 + L567 15 个**(L567 全对齐 dispatcher) | 一次性把 L567 战术 prompt 拉到完整,但范围扩大 |
| (iii) 修 L1085 7 个 + L567 同样的 7 个(只补本 batch 在 L1085 加的部分) | 折中,L567 仍漏 8 个 |

**我倾向 (iii)**:本 batch 严格聚焦 D-099 7 个 finding,L567 与 L1085 保持同步。L567 的另外 8 个 historic 缺漏作为 sprint followup,下个 batch 处理("L567 战术 prompt 全对齐 dispatcher batch")。

理由:
- 范围可控,验证简单(checker 1 仍只关心"任一 prompt 提到"的并集,本 batch 7 个 finding 同样清零)
- L567 历史漏的 8 个不在 cross_chain D 列表中,审计上没有 audit pass 1 标过(D-099 只标了"prompt 缺 4 外交指令",其余是 checker 1 实测扩展)
- 下个 batch 启动时新建 finding `tactical_prompt_drift` 类,作为独立工作流

---

## 六、修法预览(v0.3 范围缩减,等 DP 通过)

具体 diff(待 approve):

### L1085 主 prompt(`_claudeSystemPrompt`)+3 行

```diff
 - {"type":"set_camp","army_leader":"将名(中文)"} — 扎营
 - {"type":"set_ambush","army_leader":"将名(中文)"} — 设伏
 - {"type":"cancel_special","army_leader":"将名(中文)"}
+- {"type":"cancel_siege","army_leader":"将名(中文)"} — 取消围城转 halt
 - {"type":"billet","army_leader":"将名(中文)","city":"城市ID(大城)"} — 休整遣散
 - {"type":"disband","army_leader":"将名(中文)"}
 - {"type":"set_tax","level":"none/low/norm/heavy/harsh"}
 - {"type":"set_reinforce_policy","policy":"aggr/bal/elit"}
+- {"type":"toggle_resupply"} — 切换/flip 势力 resupply 开关(全军适用,非显式 set)
 - {"type":"set_prefect","city":"城市ID","general":"将名(中文)"}
 ...
 - {"type":"diplo_gift","target":"势力ID","level":1} — level:1/2/3
+- {"type":"diplo_armistice","target":"势力ID"} — 主动停战(花 1000 金,失败退 700)
 - {"type":"research","tech":"科技ID","general":"将名(中文)"}
```

### L567 战术 prompt(`_tacticalSystemPrompt`)+3 行(同步 AI-safe 3 个)

按 L1085 风格在对应位置加 3 行(`cancel_siege` / `toggle_resupply` / `diplo_armistice`)。

**不暴露**(本 batch 范围外):`cancel_supply` / `diplo_demand_vassal` / `diplo_submit_vassal` / `diplo_release_vassal` — 见 §零 followup 标注。

---

## 七、风险评估(v0.3 修正,codex review 反馈)

**v0.2 判定"纯 prompt 低风险"过度乐观**。修正后只对**确认 AI-safe 的 3 个指令**低风险:

| 风险 | 等级(范围缩减后) | 缓解 |
|---|---|---|
| smoke 行为漂移(3 个 AI-safe 指令) | **极低** | 纯 doc string 修改,smoke 50 turn 走 rule-based AI 不读 prompt |
| Claude AI 实际调用 3 个 AI-safe 指令时主体错误 | **低** | scout v0.3 §零 已 grep cross_chain_d_list 验证 3 个指令无已标 D 类;helper 签名 fid 参数化(L13649 _execDiploArmistice 函数体确认);新加 prompt 仅声明已存在的安全能力 |
| Claude AI 输出 act schema 不匹配 | **低** | scout §二 已对照函数体读取的 `act.xxx` 字段,3 个 AI-safe 指令 schema 与函数体一致 |
| 双 prompt 不一致(L567 战术 vs L1085 战略)| **极低** | DP-C 修两个 prompt,3 个 AI-safe 指令同步 |
| **附庸 3 + cancel_supply 暴露后写错主体 / 触发 dead code** | **N/A** | **本 batch 不暴露,标 followup**(见 §零)|

### 已知未覆盖(v0.3 followup 明确)

| 项 | followup |
|---|---|
| cancel_supply dead code 清理 | 独立 batch(范围:删除 dispatcher case + 文档死代码记录) |
| 附庸 3 D-091 HIGH 修复 | **batch-3 D-091**(改 helper signature `diploDemandVassal(other)` → `(fid, other)` + caller 校准 + 多入口一致性验证)|
| L567 战术 prompt 历史 8 个其他缺漏 | 独立 batch(L567 战术 prompt 全对齐 dispatcher) |
| Checker 1 双 prompt 不一致检测 | 独立 enhancement(扩 `collectPromptTypes` 区分两个 prompt)|

---

## 八、batch 完成后预期(v0.3 修订)

| 指标 | 起点 | 终点 |
|---|---|---|
| `claude_ai.js` 行数 | 1481 | ~1487(L1085 +3 + L567 +3 = +6 行 prompt)|
| `_exec*` 函数 | 36 | 36(不变) |
| dispatcher case | 37 | 37(不变) |
| L1085 主 prompt type | 30 | 33(+3 AI-safe)|
| L567 战术 prompt type | 22 | 25(+3 AI-safe,与 L1085 同步)|
| Checker 1 HIGH `case_no_prompt` | 7 | **4**(剩 cancel_supply + 附庸 3,intentional out-of-scope)|
| Checker 1 exit code | 1 | **仍 1**(本 batch 不能用 exit 0 作 gate;新语义 = 降级 + followup)|
| Smoke | byte-identical PASS | byte-identical PASS(行为不变) |
| sprint_followup.md | 4 项历史 | **+4 项 batch-2 followup**(cancel_supply / 附庸 3 个 D-091 / L567 历史 8 / Checker 1 双 prompt 检测增强)|

---

## 九、下一步

1. **本 scout 报告 review**(制作人 + codex 三方)
2. DP-A / DP-B 决策拍板 + DP-C 实测 L567 后决策
3. 实装(纯 prompt doc string 修改)
4. 三重验证 + commit + push 工作分支
5. 等制作人指示是否 squash merge main

---

(Scout v0.3 — codex review approve + 主 Claude.ai 拍板,4 决策点全锁定,准备实装)

---

## 决策点总结(v0.3 全部 approve)

| DP | 内容 | 决议 | approve |
|---|---|---|---|
| DP-A | `cancel_supply` 是否暴露 | **不加**(v159fix 占位 + checker 1 finding 留 followup) | ✅ 制作人 + codex |
| DP-B | `toggle_resupply` 参数 schema | **无参数**,文案"切换/flip"(非"设为开启") | ✅ 制作人 + codex |
| DP-C | 两个 prompt 是否都修 | **都修**(L1085 战略 + L567 战术) | ✅ 制作人 + codex |
| DP-C.1 | L567 战术 prompt 范围 | **(iv) codex 修订**:仅同步 3 个 AI-safe 指令(toggle_resupply / cancel_siege / diplo_armistice),附庸 3 标 D-091 followup batch-3 | ✅ 制作人 + codex |
| DP-D | scout 报告 commit | **是**,本文件 v0.3 commit 到 batch-2 工作分支 | ✅ 制作人 |
| **DP-E**(v0.3 新增)| Sprint gate 证据语义 | **改成降级 + followup**(同时追加到 refactor_workflow_principles.md) | ✅ 制作人 + codex |
| **DP-F**(v0.3 新增)| 工作流原则 #14 sprint scout 必读 walkthrough | **新增**(同时追加到 refactor_workflow_principles.md) | ✅ 制作人 |
