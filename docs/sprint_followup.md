# Sprint Followup — D 类 sprint 期间沉淀的待办 / 经验

> 本文档收录 D 类 sprint 期间发现但**不当场处理**的事项(CLAUDE.md 反模式 #3 / 正模式 #4),以及 sprint 工作流 trial 经验。
> sprint 末或 audit pass 2 时统一回看处理。

---

## 一、DP-3 验证机制 trial 经验

### Trial 1(2026-05-06,batch-1a):D-021 + D-077 字段名修复

**fix 类型**:字段名错配(`reinforcePolicy` → `policyId`),1 行修改,跨链 close 双 D 类

**验证组合(成功)**:
1. **smoke byte-identical 守底**:51 snapshots PASS,确认无副作用
2. **grep 全 repo 0 残留**:确认旧字段名彻底清除
3. **读写端字段名对齐**:写端(`v181.html:13986`)= 读端(`src/chains/military.js:6931`)

**结论**:
- ✅ 这套三重验证**适合"字段名/路径错配"类 D**(D-021/D-077/D-091 等命名/路径不一致 bug)
- ❌ **不适合算法回路类 D**(如 D-052 calcLoyaltyDelta vs processLoyalty 双向不一致):算法回路改动会改 baseline,smoke byte-identical 不再守底,需要新机制(届时再调整,不 over-engineer)

**沉淀原则**:**验证模式按 D 类性质分类,sprint 期间逐 batch 调整,不预设 universal scheme**。

---

## 二、smoke 覆盖盲区(已知,不立即处理)

### 盲区 1:AI 路径外 D 类

**发现 batch**:batch-1a(D-021/D-077)

**症状**:50 turn smoke 模拟期间,AI 未触发 `_execSetReinforcePolicy` 派发路径(`tests/current.json` 全程 `policyId="bal"` 初始默认值)。fix 改的是该路径写入字段名,smoke byte-identical PASS 无法直接证明 fix 生效。

**当前缓解**:代码 review(写端/读端字段名对齐)+ 后续 audit pass 2 兜底。

**待处理(sprint 末或 audit pass 2)**:
- 选项 A:扩 smoke layer-3,专测 AI 派发路径覆盖率(列出 11 个 `_execXxx` 命中次数)
- 选项 B:抽样手测 AI 路径(每 sprint 末挑 3-5 个 fix 实玩验证)
- 选项 C:fix-specific 单测(仅极少数复杂 fix)

**不立即处理理由**:trial 1 一例不足以判定哪个选项最优,等 sprint 累积 5-10 例 AI 路径外 fix 后回看选型。

---

## 三、sprint 期间发现的非范围内事项

### 3.1 batch-2 followup(2026-05-06,scout v0.3 codex review 后)

**发现 batch**:batch-2 D-099 prompt 缺指令(scout v0.3 codex review 范围缩减后产生)

#### 3.1.1 `cancel_supply` dead code 清理

**位置**:`project_romance_v181.html:13455-13459` `_execCancelSupply` + `src/core/claude_ai.js:1442` dispatcher case

**症状**:函数体 `console.warn('[ClaudeAI] cancel_supply: 当前未实装')` + `return false`(v159fix 注释明确)。dispatcher case 仍在,但 prompt 不暴露。Checker 1 报 `case_no_prompt` HIGH 1 项。

**Followup batch**:独立"死代码清理 batch"(范围:删 dispatcher case + dead `_exec` 函数 + 文档死代码记录)

**verdict**:架构债,不属于 sprint 修复目标(本来就不该实装),清理后 checker 1 finding 自然减 1。

#### 3.1.2 D-091 HIGH 修复(附庸 3 helper 签名错配)

**位置**:`src/chains/diplomacy.js`:
- `:1501` `playerReleaseVassal(other)` 单参 + `const fid = G.playerFac` 硬编
- `:1555` `diploDemandVassal(other)` 同模式
- `:1592` `diploSubmitVassal(other)` 同模式

**症状**:`_exec*` 包装器用 `(fid, target)` 双参调用,但 helper 签名单参,JS 静默忽略第二参 → Claude AI 触发后 helper 用 `G.playerFac` 当 fid → **写错主体**。

**Followup batch**:**batch-3 D-091 HIGH 修法**(独立)
- 范围:改 helper 签名 `(other)` → `(fid, other)` + 找所有 caller(玩家路径 + Claude AI 路径)+ 多入口一致性验证
- 模式归类:**模式 8 多入口一致性类**(团队 + codex 共识)
- 工程量:中等(改 helper + 玩家 caller 校准 + Claude AI caller 校准)
- 验证:smoke + checker 1(3 个 case_no_prompt 清零)+ 实玩(玩家附庸入口) + 代码 review

**触发依据**:`docs/cross_chain_d_list_v1_0.md:88` audit pass 1 已标 D-091 HIGH;`docs/audit_walkthroughs/diplomatic_chain_walkthrough.md` §阶段 1.1 详述。

**优先级**:**P0**(audit pass 1 HIGH,batch-2 暴露其活跃风险)

#### 3.1.3 L567 战术 prompt 历史 8 个其他缺漏

**位置**:`src/core/claude_ai.js:567-588` `_tacticalSystemPrompt`

**症状**:战术 prompt 22 type vs dispatcher 37 case,缺 15 个。本 batch-2 同步 3 个 AI-safe,剩 12 个未补(其中 4 个是 cancel_supply + 附庸 3 已有 followup,另 8 个是 historic 缺漏:`cancel_special` / `billet` / `set_reinforce_policy` / `break_alliance` / `scheme_drive_wolf` / `scheme_two_tigers` / `scheme_rumor` / `enthrone`)。

**影响**:战略 mode Claude 知道这 8 个,战术 mode Claude 不知道,行为不对称。

**Followup batch**:独立"L567 战术 prompt 全对齐 dispatcher batch"
- 范围:补 8 行 prompt,与 L1085 同步
- 验证:smoke + 战术 prompt 完整性 grep 验证

**优先级**:P2(行为不对称但非主要 sprint 路径)

#### 3.1.4 Checker 1 双 prompt 不一致检测增强

**位置**:`tests/checkers/exec_dispatch_audit.js` `collectPromptTypes`(在 sprint/checker-framework 分支)

**症状**:当前 `promptTypeSet` 是两个 prompt 的**并集**(扫整个 claude_ai.js),只要主 prompt 提到该 type 就视为已声明,**遗漏** L567 战术 prompt 单独缺漏。

**Followup enhancement**:扩展 `collectPromptTypes` 区分两个 prompt(`_claudeSystemPrompt` 函数体 vs `_tacticalSystemPrompt` 函数体),分别报告
- finding 类型新增:`prompt_block_drift` 或 `per_prompt_case_no_prompt`
- 集成进 sprint/checker-framework 分支(独立 commit)

**优先级**:P2(checker 增强,服务 followup 3.1.3)

---

## 四、Walkthrough 缺失(2026-05-06)

**发现 batch**:batch-1a 启动 mini scout(D-095/D-122)

**症状**:`find . -name "*walkthrough*" -o -name "*chain_v*.json"` 0 hits。HANDOVER 引用的 8 链 walkthrough(`diplomatic_chain_v1_1.json` 等)+ 各链概念图 + chain JSON 全部不在 repo。

**影响**:cross_chain_d_list 仅是 D-XXX 索引(一行描述),具体 bug 位置 / 修法 / 验证标准依赖 walkthrough。下次 session 起每个 D 类 scout 都需要 walkthrough。

**当前状态**:制作人正在从老对话补充 walkthrough,加到 repo 后下次 session 才能继续 D-095/D-122 + 后续 batch。

**临时缓解**:D-021/D-077 因有 cross_chain D 列表 + 代码两面对照 + smoke layer-1 已锁字段名,不依赖 walkthrough,本 batch 不卡。

---

(sprint_followup v1.1 — batch-1a 起开始记录;batch-2 D-099 + codex review 沉淀 4 项 followup + 原则 #14 失误自报)
