---
name: Project Romance overview
description: 三国题材策略游戏,正在做单 HTML → 四层架构(data/render/chains/core)的渐进式重构
type: project
originSessionId: 4a001125-872f-4fde-93a1-77ee5e90644e
---
**项目**:Project Romance(三国题材策略游戏)
**技术栈**:原生 JavaScript + HTML(单文件起点 v181 = 2.0 MB / 39547 行)
**当前位置**:8 链 audit pass 1 完成 → 重构期

**Why**:audit pass 1 发现 145 D 类(27 HIGH / 44 MEDIUM / 67 LOW),其中 HIGH 集中在"重构推广不彻底 / Claude AI 路径错配 / 跨链 helper 散布"等架构性问题。单文件结构无法支撑后续 audit pass 2 + 新功能。

**How to apply**:
- 重构期 strict "只搬运不改逻辑";HIGH/MEDIUM D 类一律不修(留 sprint)
- 仅 LOW defer 类"修复 = 抽离副产物"才允许自然 close
- 8 链架构:economy / military / general / politics / diplomacy / event / ethos / gentry
- 每个 session 必须跑 smoke test(layer-1 全字段 PASS 才允许 commit,任何 diff 必修或回滚)
- 绝对禁止为让 smoke PASS 而修改 baseline.json
