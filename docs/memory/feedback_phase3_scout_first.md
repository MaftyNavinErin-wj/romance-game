---
name: Phase 3 工作流 — scout-before-extract
description: phase 3 每个 sub-session 必须先 scout 实测,不能照 REFACTOR_PLAN_v1.md 字面抽
type: feedback
originSessionId: f2729414-4e29-4416-a61a-82a8502a4457
---
phase 3 每个 sub-session 启动后,**必须先做 boundary scout**(read-only,不动手),向制作人交报告 approve 后才开 working branch 实装。

**Why**:`REFACTOR_PLAN_v1.md` v1.0 写于 2026-05-04(v159 之前),v181 已经长出 plan 不知道的代码。三次实战命中同模式:
- 3.1:plan 列的 `safeAdd` / 数组工具在 v181 grep 0 命中
- 3.2:plan 列 4 候选 + 1 概念 hub,实际只有 1 真跨链 hub
- 3.3:plan 字面 ~860 行,scout 实测 ~1399 行(v159 Phase 5 整层 440 行 plan 不知)

三次都同模式 → 不是个案,是工作流必须正式化。

**How to apply**:
1. phase 3 后续 sub-sessions(3.4 tick.js+main.js / 3.5-3.12 8 chains / 3.13 收尾)全部适用
2. scout 报告必含:代码块位置清单(行号 + 简述)/ G 读写性质 / 跨 chain 引用情况 / plan §二实测偏离 / 抽离方案选项(若 >1 种)
3. plan §二偏离按 phase1_summary §5.3 / phase3_1_notes §二 / phase3_2_notes §二 / phase3_3_notes §二同模式记录(commit + 文件 header + sub-session notes 三处),plan doc 不改
4. 制作人 approve 后才实装
5. scout 阶段 CC 推荐方案 ≠ 制作人最终方案 — phase 3.3 制作人选 A 而非 CC 推荐的 D,理由更对(流水线完整性 + D-100 bug 在 K 里需要 A 才能根治)。CC 推荐时要给出选项对比 + 各自风险,**不擅自决定**

**正式纳入位置**:phase3_3_notes §六(2026-05-05 起)。
