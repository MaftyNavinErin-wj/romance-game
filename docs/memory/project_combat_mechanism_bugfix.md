---
name: 战斗机制 systematic bug fix sprint 候选
description: 制作人 2026-05-09 留 insight: 战斗机制是重要环节, 4.9 重构后估计仍有很多 bug 和细化空间, 后续作 systematic bug fix sprint 的重要环节
type: project
---
**事实**:phase 4 sub-session 4.9 (battle_modals 抽离) 实机测后,制作人留下 insight:
> "整个战斗机制是重要环节,估计还有很多 bug 和需要细化的。但目前从重构角度看应该 ok,后面的 bug 是后面再系统性修了"

**Why**:
- 4.9 verbatim 抽离 ≠ 战斗机制设计正确性。重构期硬规则不修 D 类 / 不改逻辑,只搬运。
- 实机测 7/8 场景 PASS 是 **抽离动作正确**(modal callback 调通 + 双方阵容 + 战报 + 俘虏处置 等流程没断),不代表战斗 **mechanism** 各路径都符合设计意图。
- 已知 candidate(4.9 实机测过程沉淀):
  - **AI 不扎营**:4.9 ② 营寨战 confirm 测试因 AI 不扎营无法触发,scope 跳过。AI 行为缺失候选,可能影响营寨/夜袭这条 confirm 链的实战覆盖率。
- 战斗 mechanism 涉及多个 chain 跨文件协作(military.js + general.js 单挑 + render/battle_modals.js modal 链 + render/battle_anim.js 动画时序),audit pass 1 时按链做的 D 类清单可能不覆盖战斗整体行为级 bug。

**How to apply**:
- 重构期(phase 4 + 4.10 + 后续 phase 5/收尾)**不处理** mechanism bug。继承 CLAUDE.md 硬规则 #2 + 本 memory。
- 重构完整收官(phase 4 4.10 PASS + 4.10 边界决策落地)后,可启动 **战斗机制 systematic bug/细化 sprint**:
  - 起点候选:把 4.9 跳过的"AI 不扎营"作为第一个 trace
  - 配套 audit pass 2 candidate 沉淀的战斗相关项(如 batch-22 §3.2.1 day-1 部曲 type vs squad type 不一致 / batch-23 普通武将基础挖角率接近上限,虽不是战斗但是同沉淀)
  - 走 sprint workflow(scout-before-extract + codex review + 实机测,跟 HIGH sprint 模式一致)
- 启动新 sprint 前,制作人会 approve 范围 + 策略,CC 不擅自启动。
- 不当场 fix 任何战斗 bug(包括 4.10 中可能发现的)→ 记录到 sprint_followup.md 待 sprint 启动时统一处理。
