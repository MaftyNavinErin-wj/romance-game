---
name: Session 范围 strict,不顺手做范围外的事
description: 范围外的代码 / D 类 / 文件拆分都不动,严格按制作人指定的文件级/函数级范围工作
type: feedback
originSessionId: 4a001125-872f-4fde-93a1-77ee5e90644e
---
**规则**:每个 session 启动前由制作人指定精确范围(到文件级 / 函数级)。范围外**一律不动**。

**Why**:重构期 audit baseline 是权威基准,任何范围外的改动都会污染 smoke diff,定位回归会变困难;且 D 类等级处理原则已明确,擅自修 HIGH/MEDIUM 会破坏"留 sprint"的整体计划。

**How to apply**:
- ❌ 不允许超出范围动其他文件
- ❌ 不允许顺手修 HIGH/MEDIUM/LOW fix 类 D 类(留 sprint)
- ❌ 不允许自行决定要不要拆某个文件
- ✅ 仅 LOW defer 架构债 + 修复 = 抽离副产物 → 允许"自然 close"(commit 标 `chore: closes D-XXX via centralization`)
- 反模式禁止:"顺手优化一下" / "这个 D 类很容易修,顺便 close 了吧" / "我觉得不需要 smoke test,代码看起来没问题"
- session 结束条件之一:context 余量 < 20% 即收尾(输出 `⚠️ WARNING: context 余量 < 20%`)
