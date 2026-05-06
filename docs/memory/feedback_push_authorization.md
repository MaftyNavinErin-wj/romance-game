---
name: Push 决策权属制作人, 不自决
description: git push (尤其 main / 主干分支 / tag) 必须等制作人明确说"可以 push"才动, "通过即 push" 之类措辞不构成自决许可
type: feedback
originSessionId: 512dcd0b-fb4e-439d-a8fe-64996a4fc5c8
---
**git push 必须等制作人明确说"可以 push"再动。歧义措辞("通过即 push" / "review 通过后 push" 之类)不算自决许可,等明确判定。**

**Why**:制作人 2026-05-05 在 phase 3.13 收官时明示这条:p3.13 review 阶段制作人措辞"通过即 push",我把它当成"review 通过后自动可以 push"执行了。这次实际后果零损失(review 确实通过了),但措辞严格说有歧义 — 应该是"我明确说 review 通过, 可以 push"再动, 不是我自己判定 review 通过就动。push 是 shared state 操作 (visible to others, hard to undo without force-push), 决策权归制作人。

**How to apply**:
- 任何 push 操作 (main / 主干分支 / tag / 共享分支) **必须等制作人明确说"可以 push"再动**
- 歧义措辞如"通过即 push" / "review 通过后 push" / "smoke PASS 后 push" 一律**先做完本地动作 + 报告 + 等明确判定**, 不当作 push 许可
- 工作分支 (refactor/p3.x-*, sprint/* 等) push 也走同一规则
- amend / rebase / tag move 等 history-rewrite 在 push 前可做 (本地操作), 但 push 之后只能新 commit 不能 history-rewrite (会害协作者)
- 同样原则适用于其他 shared state 操作: PR 创建 / issue 评论 / 分支删除 (远程) / Slack/email 等
