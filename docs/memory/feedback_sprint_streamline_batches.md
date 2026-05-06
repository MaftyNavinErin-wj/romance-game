---
name: Sprint streamline 多 batch 集中测
description: 连续做几个简单 mechanical batch (commit 留 local),最后集中给 user 实机测 checklist,不每 batch 单独 console 测
type: feedback
originSessionId: 829f5940-656a-4c1f-b64d-334f76d60a33
---
**规则**:连续做几个**简单 mechanical** batch(+5 行内,smoke PASS,codex LGTM)时,可以**累积 commits 在 local**,**不每 batch 单独要求 user 测**。最后**集中给一份多 batch 实机测 checklist**,user 测完一次性 push 所有 batches。

**Why**:console 模拟测多次重复 + 单 batch 价值低,每 batch user 单独测占用时间。集中测试更高效 — CC 用 codex review 把住 implementation correctness,user 用实机测 verify 行为闭环。

**How to apply**:
- 每 batch 仍走完整 mini scout → approve → 实装 → smoke → codex review LGTM → commit (留 local)
- **跳过 per-batch console 模拟测**(codex review 是 implementation check,够了)
- 累积 N 个 batch(N=2-4 通常)→ 给 user 集中实机测 checklist
  - 列每个 batch 测什么 UI/console 行为(简短可执行)
  - 单 console copy paste 块或 UI 操作 step
- user 测 PASS → 一次性 push:每个 batch 推工作分支 + squash main + push main 序列
- 任一 batch FAIL → 定位修复(独立 fixup commit 或 amend 工作分支),不阻塞其他 PASS 的

**例外仍 per-batch 测**(立即给 console 脚本):
- 复杂 batch(>10 行 / 跨多函数 / 涉及设计决策)
- batch 之间有依赖(下一个 batch 依赖前一个行为)
- user 主动要求 per-batch 测

**触发 streamline 模式**:
- user 说"连续做几个" / "集中测" / "streamline" / "几个 batch 一起" 类似措辞 → 进入 streamline 模式
- 如果 user 没说,**默认仍 per-batch 测**(保守)

---

## 扩展:修法 approve 也 streamline (batch-11 起 verified)

**规则**:streamline 模式下 mechanical fix **不需 user approve 修法选择**。CC 看 walkthrough/HANDOVER 推荐 + 自己判 + 直接实装. 仅以下情况 escalate user approve:
- 跨链 / 跨多 chain / 涉及新 helper 创建(架构改造)
- 字段语义变化(参 D-117c 设计 ambiguity 类)
- smoke FAIL 难定位
- codex review NEEDS-WORK 涉及 audit 资产判断
- walkthrough 没给精确修法 / 修法选项有歧义

**Why**:user 无编程背景,mechanical fix 修法选择(walkthrough 已给精确版本)CC 比 user 更适合判断. user reserve "major 不确定"决策即可. Mini scout 报告仍写,但不再"等 approve" — CC 看完 scout 直接开干(scout 是给 user 知情用,不是阻塞决策).

**Mini scout 报告输出格式调整**(streamline 期):
- 仍列 bug + 修法 + 5 路径 + smoke 预期
- 但**不再列"决策点 approve?"** — 改为"开干"
- 若发现 major 不确定 → 列"⚠️ 需 approve 的设计决策点"段, 等 user

**触发 fix-streamline**:
- user 说"修法不用 approve" / "按你想的来" / "你判" 类似措辞 → 进入 fix-streamline 模式
- 默认仍 mini scout + approve 流程(保守)
