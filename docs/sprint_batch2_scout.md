# Sprint Batch-2 Boundary Scout — D-099 Prompt 缺 7 指令

> Sprint:`sprint/batch-2-d099-prompts`(从 main `ba4821c` 切出)
> 状态:**Boundary scout 报告,未实装,等制作人 + codex 三方 review approve**
> 工作流:sprint mode(原则 #5 mini scout + #12 入口路径声明 + 三重验证机制)
> 风险等级:**极低**(纯 prompt doc string 修改,不动 _exec 函数体)
> 来源:`tests/checkers/exec_dispatch_audit.js` checker 1 揭示 7 个 `case_no_prompt` HIGH

---

## 一、Sprint 目标 + 范围

修 `src/core/claude_ai.js` 主 prompt(L1085-L1114)中 7 个缺漏的 action type 指令声明。
这 7 个指令的 `_exec*` 函数都已实装(在 v181.html 内),dispatcher case 也都注册(claude_ai.js:1426-1478),但 **prompt 没声明该 type → Claude AI 永远不会输出该 type → 实际是 dead code**(D-099 同模式)。

**这是 Claude AI v158+ 实装时遗漏的指令文档化**,不是新功能开发。

---

## 二、7 个缺漏指令清单 + scout

| # | type | _exec 函数(v181.html) | 函数体语义(scout 实测) | act schema(从函数体推) |
|---|---|---|---|---|
| 1 | `toggle_resupply` | `_execToggleResupply` @ L13448-L13453 | 切换势力级 resupply 开关(`G._facResupply[fid]` flip) | `{"type":"toggle_resupply"}`(无参数) |
| 2 | `cancel_supply` | `_execCancelSupply` @ L13455-L13459 | **当前未实装**(`return false` + `console.warn`,v159fix 注释明确) | `{"type":"cancel_supply"}` — **应否暴露?见决策点 DP-A** |
| 3 | `cancel_siege` | `_execCancelSiege` @ L13948-L13953 | 部队取消围城,`unit.status: 'siege' → 'halt'` | `{"type":"cancel_siege","army_leader":"将名(中文)"}` |
| 4 | `diplo_armistice` | `_execDiploArmistice` @ L13649-L13669 | 主动停战(花 1000 金,acceptRate=peaceWillingness),失败退 700 + rel+3 | `{"type":"diplo_armistice","target":"势力ID"}` |
| 5 | `diplo_demand_vassal` | `_execDemandVassal` @ L13681-L13686 | 要求他势力称臣(`fid → target`),走 `diploDemandVassal(fid, target)` helper | `{"type":"diplo_demand_vassal","target":"势力ID"}` |
| 6 | `diplo_submit_vassal` | `_execSubmitVassal` @ L13688-L13693 | 主动投靠他势力(`fid → target`),走 `diploSubmitVassal(fid, target)` helper | `{"type":"diplo_submit_vassal","target":"势力ID"}` |
| 7 | `diplo_release_vassal` | `_execReleaseVassal` @ L13695-L13700 | 释放附庸(`fid 释放 target`),走 `playerReleaseVassal(fid, target)` helper | `{"type":"diplo_release_vassal","target":"势力ID"}` |

---

## 三、修法方案

### 修改位置

`src/core/claude_ai.js` 主 prompt(`L1085-L1114`)— 30 个 type 列表。新增 7 个,达到 37 个 type 与 dispatcher 完全对齐。

### 修改内容(待制作人 + codex approve)

按现有指令格式延续(简短中文注释 + 关键参数说明):

```
- {"type":"cancel_siege","army_leader":"将名(中文)"} — 取消围城转 halt
- {"type":"toggle_resupply"} — 切换势力 resupply 开关(全军适用)
- {"type":"diplo_armistice","target":"势力ID"} — 主动停战(花 1000 金,失败退 700)
- {"type":"diplo_demand_vassal","target":"势力ID"} — 要求他势力称臣
- {"type":"diplo_submit_vassal","target":"势力ID"} — 主动投靠他势力
- {"type":"diplo_release_vassal","target":"势力ID"} — 释放附庸
```

`cancel_supply` 暂不加(见 DP-A)。

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

### 验证机制(三重 + 新)

1. **smoke byte-identical**:50 turn smoke 应继续 PASS。理由:prompt 改在 doc string 内,不影响 50 turn AI 行为(非 Claude AI 模式下 prompt 根本不被读)。
2. **checker 1 重跑**:7 个 `case_no_prompt` HIGH 应清零,findings 从 10 → 3(只剩 3 个 INFO `naming_mismatch`)。`exit 0`(无 HIGH)= sprint gate 通过证据。
3. **代码 review**:7 个新加的 prompt 行参数与对应 _exec 函数读取的 `act.xxx` 字段一致(scout §二 已对照)。

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

## 六、修法预览(等 DP 通过)

具体 diff(待 approve):

```diff
 - {"type":"set_camp","army_leader":"将名(中文)"} — 扎营
 - {"type":"set_ambush","army_leader":"将名(中文)"} — 设伏
 - {"type":"cancel_special","army_leader":"将名(中文)"}
+- {"type":"cancel_siege","army_leader":"将名(中文)"} — 取消围城转 halt
 - {"type":"billet","army_leader":"将名(中文)","city":"城市ID(大城)"} — 休整遣散
 - {"type":"disband","army_leader":"将名(中文)"}
 - {"type":"set_tax","level":"none/low/norm/heavy/harsh"}
 - {"type":"set_reinforce_policy","policy":"aggr/bal/elit"}
+- {"type":"toggle_resupply"} — 切换势力 resupply 开关(全军适用)
 - {"type":"set_prefect","city":"城市ID","general":"将名(中文)"}
 - ...
 - {"type":"declare_war","target":"势力ID","claim":"宣称ID或null"}
 - {"type":"propose_alliance","target":"势力ID"}
 - {"type":"break_alliance","target":"势力ID"}
 - {"type":"start_claim","target":"势力ID","claim_type":"宣称ID"}
 - {"type":"diplo_gift","target":"势力ID","level":1} — level:1/2/3
+- {"type":"diplo_armistice","target":"势力ID"} — 主动停战(花 1000 金,失败退 700)
+- {"type":"diplo_demand_vassal","target":"势力ID"} — 要求他势力称臣
+- {"type":"diplo_submit_vassal","target":"势力ID"} — 主动投靠他势力
+- {"type":"diplo_release_vassal","target":"势力ID"} — 释放附庸
 - {"type":"research","tech":"科技ID","general":"将名(中文)"}
 - ...
```

(行序按 dispatcher case 同分组顺序排,不打乱现有 30 个 type 顺序)

---

## 七、风险评估

| 风险 | 等级 | 缓解 |
|---|---|---|
| smoke 行为漂移 | **极低** | 纯 doc string 修改,smoke 50 turn 默认走 rule-based AI 不读 prompt |
| Claude AI 实际调用时新指令报错 | **低** | 7 个 _exec 函数都已实装(scout 已读函数体),dispatcher case 也注册;新加 prompt 仅"声明已存在的能力" |
| Claude AI 输出 act schema 不匹配 | **低** | scout §二 已对照函数体读取的 act.xxx 字段,prompt schema 与函数体一致 |
| Phase 0/1 prompt 仍活但本 batch 没修 | **中** | DP-C 决策点,待 scout L567 上下文 |

---

## 八、batch 完成后预期

| 指标 | 起点 | 终点 |
|---|---|---|
| `claude_ai.js` 行数 | 1481 | ~1487(+6 行 prompt)|
| `_exec*` 函数 | 36 | 36(不变) |
| dispatcher case | 37 | 37(不变) |
| prompt type | 30 | 36 (+6,DP-A 选 a 时;若 DP-A 选 b 则 +7=37)|
| Checker 1 HIGH finding | 7(`case_no_prompt`) | 0 或 1(取决于 DP-A) |
| Checker 1 exit code | 1 | 0(预期 — sprint gate 通过证据)|
| Smoke | byte-identical PASS | byte-identical PASS(行为不变) |

---

## 九、下一步

1. **本 scout 报告 review**(制作人 + codex 三方)
2. DP-A / DP-B 决策拍板 + DP-C 实测 L567 后决策
3. 实装(纯 prompt doc string 修改)
4. 三重验证 + commit + push 工作分支
5. 等制作人指示是否 squash merge main

---

(Scout v0.2 — §五 L567 实测完成,等 DP-A / DP-B / DP-C / DP-C.1 决策拍板)

---

## 决策点总结(等 review)

| DP | 内容 | 我的推荐 | 待 approve |
|---|---|---|---|
| DP-A | `cancel_supply` 是否暴露 | (a) 不加(v159fix 标 dead 占位) | 制作人 + codex |
| DP-B | `toggle_resupply` 参数 schema | (a) 无参数(与函数体一致) | 制作人 + codex |
| DP-C | 两个 prompt 是否都修 | (b) 都修 | 制作人 + codex |
| DP-C.1 | L567 战术 prompt 范围 | (iii) 同步 7 个,L567 历史 8 个缺漏留下 batch | 制作人 + codex |
| DP-D | scout 报告本身 commit 到工作分支? | 是,作为 batch-2 的 design doc(类似 sprint_data_scout.md 模式) | 制作人 |
