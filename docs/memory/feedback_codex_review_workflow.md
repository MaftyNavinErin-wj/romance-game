---
name: Codex review workflow (sprint batch 期专用)
description: D 类 sprint batch 期间 CC 改完 → codex.cmd exec read-only review → LGTM 直接 commit / NEEDS-WORK 才 escalate claude.ai. batch-3 trial 1 verified.
type: feedback
originSessionId: 829f5940-656a-4c1f-b64d-334f76d60a33
---
**规则**:D 类 sprint batch 期间,workflow 走 **CC 改 → codex review → CC 决定**,不走 "CC 提案 → claude.ai 复核"。

**Why**:制作人无编程背景,要避免 copy paste 传话(初衷)+ avoid claude.ai 默认介入加流程税. CC 这个 session 已持有 audit 资产 context (walkthrough / D 类清单 / followup),复审 codex finding 不见得弱于另开 claude.ai. codex 默认推荐 "CLI 初审 + claude.ai 复审" 是 self-promote bias,不是客观最优.

**How to apply**:

### CC 改完后调用 codex review
```bash
codex.cmd exec --cd "<repo>" --sandbox read-only \
  --output-last-message "tmp/codex_review_<batch>.md" \
  "Read tmp/<batch>_review_prompt.md and execute the review task. Output report to stdout."
```
- 用 `codex.cmd` (不是 `codex`,避开 PS execution policy)
- `--sandbox read-only` (codex 只读不改,review 不写代码)
- `--output-last-message <file>` (CC 用 Read 拿干净结果,避免 stdout 混 codex 进度日志)
- prompt 拆分: inline 一句"读文件 + 执行",真正的 review 指令(背景 / 关注点 / out-of-scope / 输出格式)写在 `tmp/<batch>_review_prompt.md`,避开 shell 引号转义
- 同时把 `git diff main` 写到 `tmp/<batch>_diff.txt` 给 codex 参考

### 探针先行
正式 review 前先发短探针(`"Output OK"`)确认 codex 能跑通,避免长 prompt 写完才发现 auth / 配置问题. 探针通过 → invest 长 review (~30-60s, 30-50K tokens).

### claude.ai escalate 条件 (6 类,精炼版)
1. CC scout 发现 audit 资产没覆盖到的新现象
2. 跨多条链的设计决策
3. codex 报告里 CC 无法判断真伪的 finding (涉及 audit 资产 / cross-chain history)
4. smoke FAIL 30 分钟卡住
5. 范围分歧 (CC 想扩 / 收范围,与 followup 不一致)
6. **codex 给 NEEDS-WORK / BLOCKER + CC 看后无法独立判断** (新增,batch-3 沉淀)

**关键差别**:
- codex **LGTM** → CC 自己读报告 + 与 scout 对照,一致就直接 commit,**不 escalate**
- codex **NEEDS-WORK / BLOCKER** → CC 先尝试独立判断,**判得动**就处理,**判不动**才 escalate (贴 codex 报告 + diff + CC 自己的疑问到 claude.ai)

### 已知坑
- codex 内部 spawn 的 PowerShell 在 sandbox 内是 constrained language mode,`[Console]::OutputEncoding=...` 会报错,中文乱码 (GB2312-like). 不影响 review 输出本身.
- codex.cmd 第一次跑可能有 `PATH access denied` warning (writable PATH 写入失败). 不 fatal,功能正常.
- PowerShell tool 自动 background 长 timeout 调用,stdout 可能不刷;若卡住 → kill 进程 + 改用 Bash 工具调,会看到完整 output.

### batch-3 trial 1 verified
- 探针 `"Output OK"`: 1690 tokens / model gpt-5.5 / openai backend / "OK"
- 完整 review (D-091 修): 41138 tokens / 跑 rg + git diff + 读 helper / 报告 LGTM 与 scout 一致
- 用时 ~3-5 分钟 (探针 + 完整 review)

### batch-6 trial 2 — codex catch latent bug 经验沉淀
**场景**: D-104 fix(玩家路径推迟 mutate). codex trial 1 NEEDS-WORK,catch 一个 scout 漏掉的 latent bug:`_fastForward` 期 `runAI()` 包含 `G.playerFac`,玩家 fac 走 aiDoDiplo 时 fix 让 vassal transition 变 no-op.

**CC 处理流程**(标准 NEEDS-WORK 路径):
1. 读 codex finding 描述 — 它**只指 bug + 影响**,**没给具体修法**
2. 自己 verify(读 tick.js:177-181 + popup dispatch 逻辑)— 确认 finding 真伪
3. grep `_fastForward` 看 codebase 已有用法,找到 `hubs.js:153` / `military.js:3181` 已有 `fid===G.playerFac && !_fastForward` **同模式先例**
4. 借鉴模式自己设计 fix:加 `&& !_fastForward` 守卫,fastForward 时玩家 fac fall through 到 AI 路径立即 mutate
5. 重新 codex review (trial 2):用更明确的 prompt(声明 previous finding + ask verify),52295 tokens,LGTM

**经验**:
- codex 是**问题挑出者**,不一定是 fix 设计者. CC 应该**自己设计 fix**(基于 codebase 同模式 / 设计意图)
- codex 第二轮 prompt 中明确 reference 第一轮的 finding(让它知道上下文,聚焦 verify)
- 这种"NEEDS-WORK + CC verify + fix + 二轮 LGTM"流程是 codex review workflow 的核心价值,不是 escalate claude.ai 的触发(只有 CC 看不懂 finding 才 escalate)
