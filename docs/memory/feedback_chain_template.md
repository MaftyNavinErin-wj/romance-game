---
name: Phase 3 chain 阶段 chains/*.js 抽离模板
description: phase 3.5 起所有 chains/*.js 必含的 6 项 header + 加载顺序规范
type: feedback
originSessionId: f2729414-4e29-4416-a61a-82a8502a4457
---
phase 3 chain 阶段(3.5-3.12)所有 `src/chains/*.js` 必含的模板规范,phase 3.5 ethos 抽离时由制作人拍板固化。后续 7 chain(gentry / politics / diplomacy / economy / event / military / general)沿用。

**Why**:phase 3.3-3.4 抽核心层时每个文件 header 风格略有不同;chain 阶段 8 个文件,如果不统一规范会越来越乱。3.5 ethos 是模板,固化后续一致。

**How to apply**:每个 chain sub-session 实装时,chains/*.js 文件 header 必含以下 6 项;script 加载顺序按依赖方向。

## 1. chains/*.js header 6 项必含(决策点 5)

1. **来源**:v181 行号 + 抽离方式 verbatim 声明
2. **抽离范围 + 留 v181 部分**:具体函数清单
3. **写口归属声明**:**(a) 原则核心**,显式写"本 chain 主要写口落在 G 的哪些 subtree"。审计一眼能验证 — **制作人新增项**
4. **反向调用清单**:callers + callees,按归属链整理
5. **plan §二 偏离记录**:同 phase1_summary §5.3 模式,commit + header + sub-session notes 三处留档,plan doc 不改
6. **script 加载位置 + 模板说明**:本 session 在 chain 阶段中的角色

## 2. script 加载顺序(决策点 4)

按依赖方向:`data/* → core/* → chains/* → render/* → inline`

具体:`<script src="src/chains/*.js">` 插在 `core/main.js` 之后、`render/notifications.js` 之前。chains/ 内顺序无关(各 chain self-cohesive)。

## 3. 模板源头

phase 3.5 ethos 抽离时拍板,见:
- `docs/phase3_5_notes.md §二`(5 决策点完整记录)
- `src/chains/ethos.js` header(模板示例)
- commit `eea8200`(模板首次应用)

## 4. 跨链反向调用(c) 已 approve,但需在 header 列出

(c) 原则容许 chain 反向调外部链函数(callees)和被外部链调用(callers)。但 chains/*.js header 必须列出所有 callers / callees 按归属链整理 — 这样 audit 时能看清楚跨链耦合。

特别情况(如 ethos 的 `_ethosDistance` 被外交/render 跨文件调)需在 header 内显式说明"设计认可,非 bug",并在后续抽对应链时**再次确认**。
