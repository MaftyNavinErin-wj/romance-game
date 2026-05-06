---
name: 设计决策必须先讨论再 approve
description: CLAUDE.md 硬规则 #1,任何"我觉得这样设计更好"的冲动都要回流讨论
type: feedback
originSessionId: 4a001125-872f-4fde-93a1-77ee5e90644e
---
**规则**:新功能 / 新设计 / 任何设计决策 → 先讨论 → 制作人 approve → 才允许实装。Claude Code 不擅自做设计决策。

**Why**:CLAUDE.md 把这条列为"硬规则 #1"。项目方法论是渐进式三阶段重构,strict 只搬运不改逻辑,设计变更若不走 approval 流程会污染 baseline / 引入未审计的行为变化。

**How to apply**:
- 遇到下列任一情况,**立即停止** + 输出 `🛑 BLOCKED: 需要设计决策`,等制作人发指示:
  - 抽数据时发现循环依赖
  - 函数职责边界模糊,不知道归到哪个模块
  - 接口设计需要选择(如 render 层是否能直读 G state)
  - 发现 audit 漏掉的新 D 类(记录到 followup,不当场 fix)
  - 需要拆分超出 plan 的文件
  - 任何"我觉得这样设计更好"的冲动
- 反模式禁止:"顺手优化一下" / "这里有个 bug 我顺便修了" / "我觉得这样设计更好,我先实现看看"
- 回流不是失败,是硬规则 #1 的体现
