# Sprint Followup — D 类 sprint 期间沉淀的待办 / 经验

> 本文档收录 D 类 sprint 期间发现但**不当场处理**的事项(CLAUDE.md 反模式 #3 / 正模式 #4),以及 sprint 工作流 trial 经验。
> sprint 末或 audit pass 2 时统一回看处理。

---

## 一、DP-3 验证机制 trial 经验

### Trial 1(2026-05-06,batch-1a):D-021 + D-077 字段名修复

**fix 类型**:字段名错配(`reinforcePolicy` → `policyId`),1 行修改,跨链 close 双 D 类

**验证组合(成功)**:
1. **smoke byte-identical 守底**:51 snapshots PASS,确认无副作用
2. **grep 全 repo 0 残留**:确认旧字段名彻底清除
3. **读写端字段名对齐**:写端(`v181.html:13986`)= 读端(`src/chains/military.js:6931`)

**结论**:
- ✅ 这套三重验证**适合"字段名/路径错配"类 D**(D-021/D-077/D-091 等命名/路径不一致 bug)
- ❌ **不适合算法回路类 D**(如 D-052 calcLoyaltyDelta vs processLoyalty 双向不一致):算法回路改动会改 baseline,smoke byte-identical 不再守底,需要新机制(届时再调整,不 over-engineer)

**沉淀原则**:**验证模式按 D 类性质分类,sprint 期间逐 batch 调整,不预设 universal scheme**。

---

## 二、smoke 覆盖盲区(已知,不立即处理)

### 盲区 1:AI 路径外 D 类

**发现 batch**:batch-1a(D-021/D-077)

**症状**:50 turn smoke 模拟期间,AI 未触发 `_execSetReinforcePolicy` 派发路径(`tests/current.json` 全程 `policyId="bal"` 初始默认值)。fix 改的是该路径写入字段名,smoke byte-identical PASS 无法直接证明 fix 生效。

**当前缓解**:代码 review(写端/读端字段名对齐)+ 后续 audit pass 2 兜底。

**待处理(sprint 末或 audit pass 2)**:
- 选项 A:扩 smoke layer-3,专测 AI 派发路径覆盖率(列出 11 个 `_execXxx` 命中次数)
- 选项 B:抽样手测 AI 路径(每 sprint 末挑 3-5 个 fix 实玩验证)
- 选项 C:fix-specific 单测(仅极少数复杂 fix)

**不立即处理理由**:trial 1 一例不足以判定哪个选项最优,等 sprint 累积 5-10 例 AI 路径外 fix 后回看选型。

---

## 三、sprint 期间发现的非范围内事项

(暂无 — 本节随 sprint 推进追加)

---

## 四、Walkthrough 缺失(2026-05-06)

**发现 batch**:batch-1a 启动 mini scout(D-095/D-122)

**症状**:`find . -name "*walkthrough*" -o -name "*chain_v*.json"` 0 hits。HANDOVER 引用的 8 链 walkthrough(`diplomatic_chain_v1_1.json` 等)+ 各链概念图 + chain JSON 全部不在 repo。

**影响**:cross_chain_d_list 仅是 D-XXX 索引(一行描述),具体 bug 位置 / 修法 / 验证标准依赖 walkthrough。下次 session 起每个 D 类 scout 都需要 walkthrough。

**当前状态**:制作人正在从老对话补充 walkthrough,加到 repo 后下次 session 才能继续 D-095/D-122 + 后续 batch。

**临时缓解**:D-021/D-077 因有 cross_chain D 列表 + 代码两面对照 + smoke layer-1 已锁字段名,不依赖 walkthrough,本 batch 不卡。

---

(sprint_followup v1.0 — batch-1a 起开始记录,后续 batch 追加)
