# 跨链 D 类总清单（8 链 audit pass 1）

> 本清单整合 8 链 D 类（D-001~D-145，含豪族链 D11/D12 系列），用于代码 sprint 启动决策。
> 生成时间：2026-05-04
> 累计：**137 个跨链净 D 类**（去重 D-122 cross-chain-close，跨链编号唯一）+ 豪族链 D11/D12 系列（命名独立，约 8 个 finding）= **8 链合计 145 个 D 类**

---

## 总览

| 链 | D 类编号 | 总数 | HIGH | MEDIUM | LOW | dismissed | fix | no-fix | defer | verified-with-notes | verified |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 经济链 v4.3 | D-001~D-014 | 14 | 0 | 1 | 13 | 1(D-004) | 1 | 0 | 1 | 0 | 11 |
| 豪族链 v4 | D11/D12 系列 | ~8 | - | - | - | - | - | - | - | - | - |
| 军事链 v1.1 | D-015~D-041 | 23 | 6 | 12 | 5 | 2(D-034/D-039) | ~17 | ? | ? | ? | ? |
| 武将链 v1.2 | D-042~D-075 | 30 | 10 | 10 | 10 | - | 19 | 7 | 0 | 0 | 4 |
| 政治链 v1.1 | D-076~D-090 | 15 | 3 | 5 | 7 | 0 | 6 | 4 | 4 | 1 | 0 |
| 外交链 v1.1 | D-091~D-120 | 31 | 5 | 13 | 13 | 1(D-098) | ~16 | ? | ? | ? | ? |
| 价值观链 v1.1 | D-121~D-129 | 9 | 1 | 1 | 7 | 0 | 2 | 2 | 1 | 3 | 0 |
| 事件链 v1.1 | D-130~D-145 | 16 | 2 | 2 | 12 | 0 | 7 | 0 | 3 | 5 | 1 |
| **8 链合计** | - | **~145** | **27+** | **44+** | **67+** | **4** | **~70** | **~13+** | **~9+** | **~9+** | **~16+** |

**跨链 close 案例**：
- D-077 (政治链) = 军事链 D-021 — 同代码两面观察，1 字段名修复 close 双链
- D-122 (价值观链) = 外交链 D-095 — 跨链 close
- D-006 (经济链) — 经济链 + 豪族链 D4/D5 入边断裂

---

## 一、HIGH 类 全清单（27+）

代码 sprint 优先级 P0。按链分组：

### 经济链 v4.3：0 HIGH ✓

经济链 D-006 是 MEDIUM。

### 军事链 v1.1：6 HIGH

| ID | 位置 | 议题 |
|---|---|---|
| **D-016** | _execSetCamp @ 37813 | 漏扣金 100 木 80（**免费扎营 exploit**）|
| **D-020** | _execBillet @ 37848 | 功能错位——不是 billet，是"30% 部分裁军 + 改驻守"，部曲全失 |
| **D-021** | _execSetReinforcePolicy @ 37878 | dead code（写 reinforcePolicy 字段，但 processReinforcement 读 policyId）— **跨链 close 政治链 D-077** |
| **D-026** | 大乱易主 8262 | city.occupied 占领期 → 叛乱城市直接满产（潜在 exploit） |
| **D-031** | 开城易主 15989 | _applySiegeAftermath 漏调 → 围城方白嫖一座城（无处置选项零收入）|
| **D-035** | _execRecruit @ 37786 | Claude AI 部队永远 Lv.1 出厂（玩家 Lv.5+，精英 Lv.10）|

### 武将链 v1.2：10 HIGH

**派系 8 类事件触发（3 HIGH）**：
| ID | 议题 |
|---|---|
| **D-048** | AI 主动背刺 + de facto 宣战背刺漏 triggerFactionEvent('betray')（玩家被罚 AI 不被罚，对称性 bug）|
| **D-049** | warDeclare 严重错配——eventType 名义是宣战，实际仅在称帝时触发；真正宣战 3 路径全漏（**与事件链 D-131 同源**）|
| **D-051** | setPrefect/setStrategist 漏 applyEthosShock(power)（跨链 E7 武将→价值观覆盖漏洞）|

**核心忠诚回路（3 HIGH）**：
| ID | 议题 |
|---|---|
| **D-052** | calcLoyaltyDelta UI vs processLoyalty 主tick 双向 4 项缺漏（违反 v93 一致性承诺）|
| **D-053** | applyLoyaltyEvent 定义 3 type 但 city_lost / siege_broken 是死代码 |
| **D-055** | 可挖角阈值 `Math.max(_poachThr, 45 - pt)` 把 45 硬编码（投机标签武将科技 buff 完全失效）|

**挖角玩家/AI 不对称（3 HIGH）**：
| ID | 议题 |
|---|---|
| **D-063** | poachGen 玩家挖角成功后漏写 G.genJoinTurn / G.genJoinSource（无 9 旬冷却保护）|
| **D-064** | _execPoach @ 37423 AI 挖角费用未乘 (1 + _techPoachCost)（AI poachCostMult 完全失效）|
| **D-065** | 玩家 poachGen vs AI _aiDoPoach 公式严重不对称（玩家 4 项 buff，AI 2 项，互不存在）|

**出口跨链（1 HIGH）**：
| ID | 议题 |
|---|---|
| **D-061** | AI 处决俘虏时 killGen(name, **null**)（血仇检测 + 亲密度仇恨扩散全失效，处决无后果）|

### 政治链 v1.1：3 HIGH

| ID | 议题 |
|---|---|
| **D-076** | Claude AI 缺 _execSetCorvee — 永远徭役=low（传统 AI 13470-13472 有自动调档）|
| **D-077** | _execSetReinforcePolicy 写错字段 reinforcePolicy → policyId（**跨链 close 军事链 D-021**，1 字段名修复）|
| **D-084** | succeedRuler 漏 clearAllPostsByGen（1 行修复，继任者双重身份）|

### 外交链 v1.1：5 HIGH

| ID | 议题 |
|---|---|
| **D-091** | _execDemandVassal/SubmitVassal/ReleaseVassal 错配传参（玩家函数硬编 G.playerFac，Claude AI 路径错）|
| **D-104** | _pendingVassalOffer 状态先写后弹窗（v179fix P15c 平行 bug 未修）|
| **D-113** | _resolveVassalDiploConflicts 强制停战漏 _applyPeaceAgreement（v179fix P15c 平行 bug 未修）|
| **D-117c** | checkDiplo 自动宣战（rel≤10）漏 applyWarDeclarationEffects/_syncAllyWarStatus/_diploCD/背刺反复检测/ethosShock |
| **D-120** | G._diploActed_${fid} 顶层字段永不重置 → 玩家附庸 3 入口整局各 1 次 |

### 价值观链 v1.1：1 HIGH

| ID | 议题 |
|---|---|
| **D-121** | Claude AI getGameState @ 36374-36679 305 行函数体零 ethos 引用 + prompt 零 ethos 上下文 + _execEnthrone 绕过 mandate gate |

### 事件链 v1.1：2 HIGH

| ID | 议题 |
|---|---|
| **D-131** | triggerFactionEvent 调用覆盖不全（truce/warDeclare/betray/conquer 多路径漏触发，与武将链 D-049 同源）|
| **D-133** | B4_delayed 承诺机制完全失效（push 后立即被 checkEventPromises 静默清除，gen_referral 死代码）|

---

## 二、HIGH 类共性模式分析

### 模式 1：v179fix P15c 推广不彻底（外交链 3 个）
D-091/D-104/D-113 都是 v179fix 重做停战路径合一时，**附庸路径 + 强制停战 + 自动转换** 边缘路径未应用同模式。

### 模式 2：v130 重构推广不彻底（事件链 2 个 + 武将链关联 1 个）
D-131（triggerFactionEvent caller 漏）+ D-133（B4_delayed 死代码）+ 武将链 D-049（warDeclare 错配）= v130 事件系统重构后接口完整性回归不彻底。

### 模式 3：Claude AI 信息暴露面 / 路径错配（4 链 5+ 个 HIGH）
- 外交链 D-091（Claude AI 附庸 3 函数错配传参）
- 外交链 D-099（prompt 缺 _exec 指令，归在 LOW 但同源）
- 外交链 D-100（派发器漏 enthrone case）
- 价值观链 D-121（Claude AI getGameState 缺 ethos）
- 事件链 D-130（Claude AI getGameState 缺事件状态，MEDIUM）
- 经济链 D-006（_execRecruit 漏 6 个金费修正，MEDIUM）
- 政治链 D-076（Claude AI 缺 _execSetCorvee）
- 军事链 D-016/D-020/D-021/D-035 等 4 HIGH（_exec\* 系列军事 action 错配）
- 武将链 D-064/D-065（_execPoach + 玩家/AI 公式不对称）

**共性**：Claude AI v158+ 高层 action 接口在多链上有"路径错配 / 信息缺失 / 派发漏 case"。可建独立 epic 集中修。

### 模式 4：易主路径漏钩子（军事链 5 + 跨链）
D-022~D-031 集中在攻陷/大乱/开城 3 易主路径的钩子完整性。其中 D-026/D-031 是 HIGH。

### 模式 5：核心算法回路双向不一致（武将链）
D-052/D-053/D-055 集中在忠诚/挖角回路 UI 与 主tick 不一致。

---

## 三、MEDIUM 类 全清单（44+）

代码 sprint 优先级 P1。按链汇总（详细议题见各链 walkthrough）：

### 经济链：1 MEDIUM
- **D-006** _execRecruit Claude AI 征兵金费裸价漏 6 个修正

### 军事链：12 MEDIUM
D-006 / D-015 / D-018 / D-019 / D-022 / D-023 / D-024 / D-027 / D-029 / D-030 / D-036 / D-037 / D-038 / D-040 / D-041

### 武将链：10 MEDIUM
D-045 / D-047 / D-050 / D-057 / D-058 / D-059 / D-060 / D-066 / D-068 / D-072

### 政治链：5 MEDIUM
- D-079 _execSetPrefect _genDeployed 守卫玩家无（设计意图，verified-with-notes）
- D-081 武将主动离开 3 路径漏 removePost
- D-082 大乱漏 dismissPrefect 三件套
- D-086 三任命数值差异（设计意图）
- D-087 setPrefect/setStrategist 缺 ethosShock（4 处补）

### 外交链：13 MEDIUM
分散在 D-092~D-117，主要是 verdict 涉及 fix/no-fix/defer 混合。

### 价值观链：1 MEDIUM
- D-122 cross-chain-close（=外交链 D-095，重复计数 1 个）

### 事件链：2 MEDIUM
- **D-130** Claude AI getGameState 缺事件状态（defer，需新建子系统）
- **D-137** _eventQueue + _popEventQueue 死代码（玩家事件永久积压，fix）

---

## 四、defer 类（架构债集中重构 epic）

代码 sprint 后建议**集中做"中央 const 化重构"**：

| ID | 链 | 议题 |
|---|---|---|
| D-002 | 经济 | v2 文档漏列 2 个 tick（已修） |
| D-007 | 经济 | 通商签约直接 -= 写法不规范，应改 safeSub |
| D-080 | 政治 | 玩家 appoint 守卫只在 UI 层 |
| D-085 | 政治 | anti_corruption ② 缺 clan_base loyalty |
| D-089 | 政治 | INIT_POSTS 无 stage cap 检查 |
| D-123 | 价值观 | 漂移系数无中央 const（散在 8 漂移源内）|
| D-138 | 事件 | 事件 cooldown 全局非势力维度 |
| D-141 | 事件 | catCooldown=3 硬编 4 处无 const |
| D-144 | 事件 | G.reputation 默认值硬编 7 处 |

**通用模式**：硬编 const 散在多处 → 应集中到顶层 CONSTANTS 区，命名规范（如 `EVENT_CAT_COOLDOWN_TURNS = 3`）。

---

## 五、verified-with-notes 类（设计意图 / 边缘行为，仅文档化）

| ID | 链 | 议题简述 |
|---|---|---|
| D-079 | 政治 | _execSetPrefect 守卫严格是设计意图 |
| D-083 | 政治 | 开城漏 dismiss（豪族机制已 cover） |
| D-086 | 政治 | 三任命数值差异（私人战略顾问 vs 正式官位） |
| D-126 | 价值观 | nonRuler 排除 ruler |
| D-127 | 价值观 | 无部队 fieldRatio 边缘行为 |
| D-128 | 价值观 | atWar 不查 rebel |
| D-135 | 事件 | general_ceremony 软 oneTime 模式（设计意图） |
| D-136 | 事件 | 疫病扩散到玩家城无主动通知（UX 改进） |
| D-139 | 事件 | _popEventQueue 验证仅查 city.fac（D-137 fix 时附带） |
| D-140 | 事件 | 4 oneTime story 事件"暂缓"=永远拒绝（设计意图）|
| D-141 | 事件 | catCooldown=3 硬编 4 处（架构债 verified-with-notes）|

---

## 六、跨链 close 案例

### 跨链 close 1：D-077 (政治) = D-021 (军事)
- 字段：`reinforcePolicy` vs `policyId`
- 修法：1 字段名修复，1 commit close 双链

### 跨链 close 2：D-122 (价值观) = D-095 (外交)
- 跨链关闭，双链共用同一 fix

### 跨链关联（同源但分立 verdict）：
- 武将链 D-049 + 事件链 D-131：triggerFactionEvent('warDeclare') 多路径漏触发（v130 重构推广不彻底）
- 经济链 D-006 + 豪族链：getGentryRecruitMult Claude AI 路径下断裂
- 价值观链 D-121 + 事件链 D-130 + 外交链 D-099/D-100：Claude AI 信息暴露面共通弱点

---

## 七、代码 sprint 启动建议

### Sprint 顺序（基于影响半径 + 依赖关系）

**Phase 1：跨链 close 双链 fix（2 commits）**
1. D-077 + D-021：1 字段名修复（reinforcePolicy → policyId）
2. D-122 + D-095：跨链 close

**Phase 2：HIGH 集中区（按 v 重构推广不彻底集中处理，约 5-7 commits）**

集中修 v179fix P15c 模式（外交链 3 HIGH）：
1. D-091 _execDemandVassal/SubmitVassal/ReleaseVassal 重构
2. D-104 _pendingVassalOffer 状态写入顺序
3. D-113 强制停战 _applyPeaceAgreement

集中修 v130 推广不彻底（事件 2 HIGH + 武将 1 HIGH）：
4. D-131 triggerFactionEvent caller 全推广（涉及外交/军事/武将多链）
5. D-049 warDeclare 错配（与 D-131 同源）
6. D-133 B4_delayed 承诺机制

**Phase 3：Claude AI epic（独立，约 4-6 commits）**

集中修 Claude AI v158+ 路径错配 / 信息缺失：
1. _exec\* 军事 action 系列：D-016/D-020/D-021/D-035 + D-006 + D-064（统一工具函数 + 字段补齐）
2. _exec\* 政治 action 系列：D-076 / D-079 / D-080
3. getGameState 暴露子系统：D-121 (ethos) + D-130 (events log) + 后续可扩展
4. _exec 派发器对账：D-100（漏 enthrone case）+ ORDER 表 vs 派发器 case 一致性

**Phase 4：核心算法回路（武将链 3 HIGH，约 3 commits）**
1. D-052 calcLoyaltyDelta vs processLoyalty 双向对齐
2. D-053 applyLoyaltyEvent dead type 处理
3. D-055 投机标签 _poachThr 修复

**Phase 5：易主路径钩子（军事链 4 D 类，2 commits）**
1. 大乱易主补 4 钩子（D-023~D-026）
2. 开城易主补 5 钩子（D-027~D-031）

**Phase 6：剩余单链 HIGH（约 6-8 commits）**
- 政治链 D-076 + D-084
- 武将链 D-048 + D-051 + D-061 + D-063 + D-065
- 军事链 D-026 + D-031（如未在 Phase 5 包含）

**Phase 7：MEDIUM 批量 fix（约 15-20 commits）**

按链分批，每链 2-4 个 commits。

**Phase 8：架构债集中重构（1 epic）**
中央 const 化（D-007/D-080/D-085/D-089/D-123/D-138/D-141/D-144）— 一次 commit 集中修。

**Phase 9：LOW + 文档化（约 10-15 commits）**
verified-with-notes / verified 类不修，但需在 walkthrough 文档化。

### 总估算
- HIGH 27 个 → ~15-18 commits（部分 1 commit 多 fix）
- MEDIUM 44+ → ~15-20 commits（批量）
- LOW fix 类 → ~5-8 commits
- defer 类 → 1 epic
- verified-with-notes / verified → 0 commits（文档化）
- **代码 sprint 总规模：~40-50 commits**

---

## 八、自动化检查工具建议（基于 8 链 audit 经验）

代码 sprint 后建议建立的自动化 checker：

1. **重构接口回归 checker**：列出新机制 caller 全代码 → 自动核覆盖率（如 grep `d.status='ally'` → 核每处是否调 `triggerFactionEvent('truce')`）
2. **Claude AI 暴露面 checker**：getGameState 字段 vs prompt 提及 vs _exec 派发器 三处一致性
3. **状态变化点 checker**：列出所有 `d.status=` / `c.fac=` / `g.role=` 写口 → 核每处是否触发对应 hook
4. **承诺履约 case 链 checker**：列出所有 `_eventPromises.push({type:...})` 的 type → 核 checkEventPromises filter case 是否覆盖
5. **死代码 checker**：列出所有 G.\_xxx 写入但 0 读取 / 写入名 mismatch 读取名 的字段
6. **常量散布 checker**：扫描代码中重复出现的 magic number（如 cooldown=3）→ 提示中央化
7. **跨链对账 checker**：mirror 节点（D3 价值观 / E2 外交 / E4 武将 等）写口数与目标链入口数对齐核查

---

## 九、不做的事（再次重申）

- ❌ 本清单仅作 sprint 启动决策依据，不动游戏代码
- ❌ 各 D 类 verdict 已在 audit pass 1 中锁定，不重审
- ❌ 跨链 close 案例双链同时 fix，不分批
- ❌ defer 类不混进 HIGH/MEDIUM sprint，独立 epic

---

(本清单 v1.0 完结 — 8 链 audit pass 1 完成后产出)
