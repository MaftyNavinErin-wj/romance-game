---
name: codex-single-final-review-streamline
description: "streamline sprint 末是否做 single final-state codex review 而非逐 batch review — 待定, user 在考虑"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 41775176-cb0d-4b01-b8a1-652a588cfc7d
---

streamline mode 多 batch sprint 末是否跑 single final-state codex review (vs 逐 batch review): user 在考虑, 待定。session 末 user 问"codex 看过吗",承认完全跳了,然后让 CC 给出意见。CC 建议是"single final-state review 性价比高",user 回"再说"。

**Why:** Sprint 内 9 batch (W1.1-a/b/c/d + W1.2 + W2.1 + W2.2 + W3 + 4-e) 全跳 codex (streamline 数据填充模式)。末做单次集中 review 性价比比逐 batch 高 (~100K vs ~450K tokens)。价值集中在:
- schema 一致性 + cross-batch invariant 类 (W3 跨剧本对齐 / 删 title/post 之后 残留 / 重复 entries)
- duplicate/missing detection (CC 4-e 内已自 catch 文聘/鲜于辅 dedup, 但可能还有漏的)
- 硬错 (deathYear < birthYear / debutYear < birthYear+某岁)

而 codex 不强项 (CC 也填不准, codex training data 没更权威):
- 细粒度史实年份 (邓艾 debut 243 vs 233 这种)
- wildMeta cross-scenario 合理性 (司马昭"路人皆知" cross-scenario 是否合适)

**How to apply:** 数据填充 sprint 末跟 user 讨论是否做 single final-state codex review。不做也 OK (smoke 守底 + 数据错延迟到 phase 6 wire 实机暴露才处理)。user 已知 trade-off, 让 user 决定, 不擅自启动。 触发关键词: user 问 "codex 看过吗" / sprint 末。

参考: [[feedback_codex_review_workflow]] [[feedback_sprint_streamline_batches]] [[feedback_exec_sprint_streamline]]
