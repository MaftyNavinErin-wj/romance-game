---
name: _exec 归位架构债 sprint 集中 codex review
description: _exec sprint 5 batch 高度同质 (verbatim relocation), 默认集中 codex review 一次, 异常 batch 单独 escalate
type: feedback
---

_exec 归位架构债 sprint(batch-26 ~ 30,5 batch:武将/政治/经济+科技/外交+谋略/军事)默认走**集中 codex review**:每 batch 内部 scout + 抽 + smoke vs main byte-identical + local commit,5 batch 全完成后单次 codex 看合并 diff,LGTM 后一次性 push。

**Why:** _exec sprint 5 batch 高度同质 — verbatim 27~50 行从 v181 剪贴到 chain.js + 维护 chain header(段编号 + 函数总数 + 留 v181 _exec 列表)+ dispatcher 不动。codex 看 5 份 diff 跟看 1 份合并 diff 的 signal 90% 重叠,且 cross-batch consistency(各 chain header 段编号是否冲突 / _exec 依赖跨 chain 引用是否漏一个 helper)只有合并 diff 看得清。单 batch 风险(误编辑 / marker 错行号 / header 数字算错)已被 smoke vs main byte-identical + Edit exact-match 覆盖。

batch-26 武将 2 (_execRecruitWild + _execPoach) 是首次落地此模式 — 整个 batch 从 scout 到 smoke PASS 不到 30 分钟,codex review per batch 边际价值低。

**How to apply:**

1. 每 batch 内部完成后 commit 到 sprint/batch-NN-... 工作分支(不 push)
2. 跨 batch 切工作分支前不需 codex review
3. 5 batch 全完成 → 把所有工作分支合并 diff vs main 给 codex 一次过 review
4. LGTM → 各工作分支按 sprint 标准一个个 squash merge main → 一次性 push 5 个 sprint commit
5. NEEDS-WORK → 定位到具体 batch → 该 batch 单独修 + 单独再 review

**异常 escalate 单独 review 触发**:

- 某 batch _exec 依赖的 helper 不在目标 chain → 需先抽 helper / 跨 chain 引用,scope 已超 verbatim 搬运
- smoke vs main 不 byte-identical(理论不该,但出现要立刻定位)
- 函数体看到 inline magic number / 疑似 bug → 当场 followup 不当场 fix,但该 batch 单独 review
- _exec 函数体超出 ~50 行(整 chain 模板搬运代价上升)

**与其他 streamline 的边界**:

- `feedback_sprint_streamline_batches.md`(实机测 streamline)说的是 user 一次性测多 batch + 一次性 push;codex review streamline 是 codex 一次性 review 多 batch。两者可叠加(同一个 sprint 期):batch-26~30 全 commit 留 local → 集中 codex review LGTM → 制作人一次性实机测 → 一次性 push。
- 行为改动类 batch(D 类 fix / helper 抽离 / lifecycle freeze)**仍走单 batch codex review**(batch-3 ~ 25 的标准模板),不适用本条。
