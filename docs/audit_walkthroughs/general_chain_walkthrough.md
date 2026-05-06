# 武将链 · 大白话说明（对图 audit 用）

> 配套使用：`Project_Romance_Concept_Map_v5_personnel.html`（默认打开「武将链 v1.1」tab）  
> 用法：对着图上的节点 ID（A1 / B3 / C8 / D2 / E8 等），在这份文档里找对应段落  
> 这份文档**只讲逻辑和设计意图**，不抠数值（数值看节点 desc 或代码）

---

## v1.1 版本说明

武将链 v1.1 是 audit pass 1 完整版，沿用军事链 v1.1 命名表示同代。基于 Step 1 反向 grep 收齐 **47 节点 / 89 边**，Step 3 6 阶段 audit 后产 **28 个 D 类候选**（HIGH 10 / MEDIUM 10 / LOW 8）。

按制作人定的：
- **分区方案**：5 区方案 C（A 输入 / B 状态 / C 派生 / D 出口 / E 跨链）
- **节点颗粒度 A**（与军事链、经济链、豪族链对齐）
- **Q 决策**：B 区 18 字段合并为 11 节点 / C16 Claude AI 单立 / D4 武将俘获 mirror 标 verified-mirror / A7 SKILL_INLINE 仅列入口

---

## 系统总览（30 秒读完）

武将链是游戏的"人事面"——决定**武将怎么来、怎么走、忠诚怎么变、派系怎么分**。比军事链略简单（47 vs 47 节点，但边少 5 条）。

它有 **2 个核心机制** + **3 个出入口**：

**2 个核心机制**：
- **忠诚机制**：每个武将一个 0-100 的忠诚值，每旬动态变化（C1 + C2 + C3 + C4），太低就走人
- **派系机制**：武将根据 origin/政治/战和倾向归属多个派系（C5/C6），派系内部冲突会扣忠诚（C8）

**3 个出入口**：
- **入伙（D1）**：5 路径——开局 / 招募 / 挖角 / 投降 / AI 推荐
- **出口（D2）**：4 路径——下野 / 被挖 / 死亡 / 城丢（跟着易主）
- **任命变更（D3）**：任命/罢免触发派系民意 + 价值观链震荡

**输入因子**（A 区）8 种：派系定义、出身、政治倾向、战和倾向、性格、价值观标签、技能、创始团队。决定每个武将的归属 + 行为倾向。

**派生函数**（C 区）16 个，三组：
1. 忠诚回路：C1 共享计算 / C2 主tick / C3 事件钩子 / C4 阈值检测
2. 派系回路：C5 主派系 / C6 多派系 / C7 修正明细 / C8 主tick / C9 亲密度阈值
3. 操作入口：C10 在野池 / C11 玩家挖角 / C12 玩家野招 / C13 任命罢免 / C14 属性成长 / C15 死亡 / C16 AI 招募/挖角

**状态出口**（D 区）4 种：D1 入伙簇 / D2 出口簇 / D3 任命变更簇 / D4 武将俘获 mirror（指向军事链 D4）。

**外部输入 / 跨链**（E 区）8 种：经济（招募金费 / 欠饷）/ 军事（战果 / 俘获 / 武将技能 hook）/ 豪族（origin 影响）/ 价值观（任命 ethosShock）/ Claude AI v158+。

---

## 主流程（每旬武将相关跑什么）

每旬 `endTurn` 内**武将链相关步骤**按顺序：

1. **C2 `processLoyalty`** — 全将忠诚每旬更新（基于 C1 共享计算函数）
2. **C8 `processFactionLoyalty`** — 派系民意每旬重算 G.genFactionMod 缓存
3. **C4 `checkLoyaltyThresholds`** — 检测下野（<25 忠诚）和可挖角（<45/55 忠诚）
4. **C9 `checkIntimacyThresholds`** — 检测亲密度 ±75 弹义结/宿敌剧情
5. **C10 `refreshWildPool`**（每 5 旬触发）— 在野池洗牌
6. **C14 太守/军师/官职 `addStatExp`** — 每旬给当官武将 +0.3 政治经验

**最关键的设计意图**：

- **忠诚是慢热的**：基础衰减 -0.5/旬，要靠各种加成（魅力、官职、战功）拉回来；不打理就慢慢动摇
- **派系是动态的**：势力内部派系占比变化、价值观变化都会让武将派系修正（B4）随之变
- **入伙都有 9 旬冷却**：B8 genJoinTurn 防止刚招的人立刻被对方挖回去
- **出口要跨链对账**：被俘武将的归宿是武将链 + 军事链共同负责（D4 mirror）

---

## A 区 · 输入因子（决定每个武将"是什么样的人"）

A 区所有节点都在回答一个问题：**这个武将的政治归属、行为倾向、特殊能力**？

### A1 派系定义 FACTION_DEFS
6 大派系：尊汉 uniHan / 强藩 warlord / 务实 pragmatic / 鹰派 hawk / 鸽派 dove / 变节 defector。一个武将可同时属于多个派系（如曹操的荀彧：尊汉 + 务实）。每个派系在势力内的占比影响该派系武将的忠诚修正。

### A2 武将出身 origin
6 类：gentry（士族）/ magnate（地方豪族商贾）/ humble（寒门）/ clan（宗族）/ noble（旧阀贵族）/ foreign（外族）。**这是武将链直连豪族链 + 价值观链 power 维度的入口**——任命士族当官会让寒门派不爽（power -2），任命寒门当官则反过来。

### A3 政治倾向 politics
4 类：尊汉 / 强藩 / 务实 / 中立。决定武将的主派系归属。势力如果称王称帝，尊汉派武将会动摇；反之强藩派认同感会强。

### A4 战和倾向 combat
3 类：鹰派 / 鸽派 / 中立。决定武将对势力价值观链 military 维度的反应。势力黩武，鹰派武将忠诚 +；势力安民，鸽派 +。

### A5 性格 temperament
6 类：狡诈 / 坚毅 / 高傲 / 鲁莽 / 仁厚 / 沉稳。影响：单挑表现（军事链 hook）、亲密度倾向、AI 决策风格。**狡诈和高傲性情容易被挖角**（cunning 性情挖角率 +5%）。

### A6 武将标签 values
动态行为标签：投机 / 忠义 / 重义 / 恋家 等。其中"投机"标签使可挖角阈值 +10（55 而非 45），即更易被挖。

### A7 武将技能 SKILL_INLINE 入口
**这是个清单节点**，不展开语义。30+ 武将技能（关羽单挑 / 步骘安南 / 董允秉公 / 陈群九品 / 黄权持节等）。语义在被调用链处展开（军事链 / 武将链事件触发）。

**重要技术债（D-073）**：技能架构两套并存——SKILL_REGISTRY 数据驱动 29 条 + SKILL_INLINE 硬编码 61 处，无统一注册，技术债。

### A8 创始团队 FOUNDING_CORE
开局核心元老（如曹操的曹氏夏侯氏宗族、刘备的关张赵）。创始成员忠诚衰减更慢、被挖角阈值更高，是势力立身根基。

---

## B 区 · 实体状态（武将链的所有"持久化数据"）

B 区是 `G.gen*` 18 字段的合并节点（11 节点装 18 字段，避免节点爆炸）。

### B1 G.generals 武将名册
每势力武将列表。增删入口：招募/挖角 push、下野/跳槽/死亡 filter。**武将链所有出口和入口最终都改这个表**。

### B2 G.genLoyalty 武将忠诚
0-100，默认 80。每旬 C2 processLoyalty 更新。<25 触发下野，<45/55 触发可挖角。

### B3 G.genPost 官职任命
{fid: {postId: genName}}，每势力官职名册（太守 city.prefect 单存）。**任命/罢免触发派系民意（D3）+ 价值观链 power 震荡（E7）**。

### B4 G.genFactionMod 派系修正缓存
每旬 C8 processFactionLoyalty 重算的派系修正值。UI 共享同一份缓存（getGenFactionModBreakdown）。

### B5 G.genStatBase + genStatExp + genAptExp 属性成长
三字段合一节点（同语义簇）：
- genStatBase：首次记录的原始 4 维属性（cap=base+5 上限）
- genStatExp：4 维经验，到 50 升 1 点
- genAptExp：兵种适性经验，C/B/A/S 4 档（C→B 40 / B→A 60 / A→S 100）

### B6 G.genWinCount + genMerit 战绩功勋
胜场 + 功勋值。功勋未被赏识（升官）会让武将寒心（C1 忠诚 -）。

### B7 G.genWounded 武将受伤
{turns: N} 倒数；战斗 wounded、单挑负伤来源；期间不能出战，每旬 -1。重伤可能直接战死走 C15 killGen。

### B8 G.genJoinTurn + genJoinSource 入伙时机
- genJoinTurn：入伙旬数（用于 9 旬冷却保护）
- genJoinSource：入伙方式 founding/member/recruit/capture/referral——**注意：当前缺 'poach' 取值**（D-066 已记录修复）

### B9 G.genOrigFac + genOrigRole 原属信息
v71 性能缓存：武将首次所属势力 + 原始角色。`addStatExp` 用 origFac 做 O(1) 科技加成查找。**注意：野招/挖角/推荐路径未写 origFac**（D-072 已记录），导致 v115 性能优化失效 + 挖角的 defector 副派系标签丢失。

### B10 G.intimacy + intimacyNotified 亲密度
武将间亲密度 -100~+100（无向，按字典序键）。±75 弹"义结金兰"/"积怨成仇"事件 + 写双方小传。**INTIMACY_PRESET 开局有历史预设关系**（如刘关张三结义、关张同步）。

### B11 G.wildPool + wildPoolTurn + recruitableGens 在野/可挖角池
- wildPool：在野武将池（5 + 举孝廉 extraSlots，每 5 旬刷新）
- recruitableGens：实时检测的"敌方动摇可挖"武将列表
- **wildPool push 上限 3 种行为不一致**（D-068 已记录：正常下野<5 / 势力灭亡<8 / 释放无限）

---

## C 区 · 派生函数（每旬运行的核心逻辑）

C 区分三组：忠诚 / 派系 / 操作入口。

### —— 忠诚回路 ——

### C1 calcLoyaltyDelta 共享计算
**关键设计意图**：UI 显示的"忠诚趋势"和实际每旬扣的数**用同一个函数算**——v93 设计承诺。

8 项 +/- 项：基础衰减 / 君主魅力 / 相性差 / 性格标签 / 官职加成 / 野心-投机无官 / 同僚关系 / 欠饷 / 加 9 项价值观匹配 / 派系修正 / 科技 / 刘封技能。

**严重问题（D-052 HIGH）**：calcLoyaltyDelta 与 C2 processLoyalty **不一致**——UI 缺 2 项（科技 loyaltyRecovery / 刘封 -0.10），主tick 缺 2 项（proud 性情无官 -0.15 / 价值观匹配）。**违反 v93 一致性承诺**。

### C2 processLoyalty 主tick 忠诚
每旬遍历全将调 C1 → 写 G.genLoyalty。在主tick 16443 调用，紧跟 C8 派系民意。

### C3 applyLoyaltyEvent 事件钩子
**外部链**注入忠诚扰动事件的入口：经济链欠饷 / 军事链战败等。

**严重问题（D-053 HIGH）**：定义 3 type（battle_loss / city_lost / siege_broken）但只有 battle_loss 在用，**city_lost 和 siege_broken 是死代码从未被调用**。HANDOVER 设想的"欠饷/久未出战"事件钩子也未通过本函数实装。

### C4 checkLoyaltyThresholds 阈值检测
- 下野阈值 <25 → 移出 generals + 加入 wildPool + 清官职 + 加 chronicle
- 可挖角阈值 <45（基础）/<55（投机标签）/<50（敌方有"唯才是举"科技）
- 9 旬入伙冷却（B8 joinTurn）保护新人

**严重问题（D-055 HIGH）**：可挖角阈值 `Math.max(_poachThr, 45 - pt)` 把基础阈值 45 硬编码——**对投机标签武将（基线 55）科技效果完全失效**！应改为 `_poachThr - pt`。

### —— 派系回路 ——

### C5 getGenFaction（单数）
单将主派系判定，21+ 处调用。

### C6 getGenFactions（复数）
单将多派系归属（数组）。一个武将可同属士族 + 尊汉 + 鸽派多重身份。

### C7 getGenFactionModBreakdown
派系修正明细（哪个派系占比多少、修正多少）。**UI 弹窗 + processFactionLoyalty 共享同一份**。

### C8 processFactionLoyalty 主tick 派系民意
每旬重算 G.genFactionMod。综合考量：
- 派系占高位比例（>40% → 该派系 +0.20/旬）
- 降将任太守（降将 +0.15 / 创始 -0.10）
- 派系紧张（创始 vs 降将/新人/强藩）
- 尊汉皇室占比（>40% 对非尊汉者 -0.10）
- 边缘化（占比 <5%/10% → -0.25/-0.15）

**还有一个并行机制：triggerFactionEvent 8 类一次性事件**：
- execute / defectorPrefect / conquer / truce / warDeclare / betray / appointPost / removePost

**该机制有多个 HIGH 问题**：
- D-048：AI 背刺漏 betray 派系事件，玩家被罚 AI 不被罚（对称性 bug）
- D-049：warDeclare 严重错配——名义是宣战，实际仅在称帝时触发；真正宣战 3 路径全漏
- D-051：任命太守/军师漏 applyEthosShock(power)，跨链 E7 覆盖漏洞
- D-046：execute UI 叙事错配（战死也叫"处决武将"）
- D-045：豪族开城投降不触发 conquer

### C9 checkIntimacyThresholds 亲密度检测
每旬检查玩家势力武将间亲密度，±75 弹剧情。带 intimacyNotified 防重复，**仅玩家可见**（AI 势力不弹）。

### —— 操作入口 ——

### C10 refreshWildPool 在野池刷新
每 5 旬从 WILD_GENS 抽 5 + extraSlots（举孝廉）个写入 G.wildPool。Fisher-Yates 洗牌（v179 已修）。

### C11 poachGen 玩家挖角
玩家手动挖敌方动摇武将。检查冷却 + 付金费 + 计算成功率（君主魅力 + 目标忠诚 + 同乡/同族/同士族 + 陈群九品/黄权持节技能 + 唯才是举科技）。

**HIGH 问题集合**：
- D-063：挖角成功后**漏写 genJoinTurn / genJoinSource**——被挖武将无 9 旬冷却保护，可能立即被挖回去
- D-065：玩家公式 vs AI 公式（_aiDoPoach）严重不对称——双方各有专属 buff，违反 C16 共享原则

### C12 recruitWild 玩家野招
玩家从 wildPool 招募。检查冷却 + 付金费（受 recruitCostMult 科技影响）+ 计算成功率。**与 AI 路径走同一个 _doRecruitWild，玩家 / AI 共享公式 ✓**。

### C13 appointGenPost / clearAllPostsByGen 任命罢免
任命：触发 appointPost 派系事件 + applyEthosShock(power) ±2。
罢免：触发 removePost + 反向 ethosShock。

**问题**：
- D-051 setPrefect/setStrategist 漏 ethosShock（已述）
- D-047 普通官职任命降将不触发 defectorPrefect（**不修，已通过派系占比间接惩罚**）
- D-050 clearAllPostsByGen 不触发 removePost（**不修，被动失去官职不该额外惩罚**）

### C14 addStatExp / addAptExp 属性成长
战后给 squad 武将加 4 维经验 + 兵种适性经验。受科技 statExpMult / aptExpMult 加成 + 董允秉公 ×1.20 加成。

**LOW 问题**：D-070 升级判定用 `if` 不用 `while`，极端情况单次大量经验只升 1 级。

### C15 killGen 武将死亡
4 个调用源：战死（24579）/ 单挑死（28559）/ 处决（23260）/ 大乱清场（30956）。**无历史寿数自动死亡机制**——D-044（HIGH 后续实装提醒）。

**问题**：
- D-061 HIGH：处决俘虏时 killGen(name, **null**) 跳过血仇 + 仇恨扩散——**处决最严重政治事件对凶手势力完全无后果**
- D-058 部分清：死亡后只清 genFactionMod（势力相关临时缓存），其他字段（战绩/经验/小传）保留作人物档案

### C16 Claude AI _exec 武将 action 簇
2 入口：_execRecruitWild（thin wrapper 共享 C12 ✓）+ _execPoach（孤例不对称问题）。

**HIGH 问题**：
- D-064：_execPoach 漏乘 (1 + _techPoachCost) 科技修正，AI 的 poachCostMult 完全失效
- D-065：_aiDoPoach 公式与玩家 poachGen 严重不对称（已述）

**关键洞察**：除挖角外，所有 AI 人事 _exec 都是 thin wrapper 共享玩家函数。**D-065 是孤例**，不需要重构整个 AI 决策层。

---

## D 区 · 状态出口（武将怎么"来"和"走"）

### D1 武将入伙簇
5 路径汇入 G.generals：
1. 野招（recruitWild → genJoinSource='recruit'）
2. 挖角（poachGen / _aiDoPoach → 应该是 'poach'，**当前缺这个 source**）
3. 投降（surrenderGen → 'capture'）
4. 推荐（→ 'referral'）
5. 开局（FOUNDING_CORE → 'founding' / 'member'）

**问题**：
- D-066：genJoinSource 命名混乱，挖角错用 'capture'，与投降同源；isNewDefector 判定混淆两类
- D-059 部分修：surrenderGen 投降时未清 genFactionMod 缓存（**派系事件部分不修——投降是个人行为，不放大成势力级事件**）

### D2 武将出口簇
4 路径离开 G.generals：
1. 下野（loy<25 → wildPool）
2. 跳槽 / 被挖（→ 敌方 generals）
3. 死亡（killGen → 移除不可恢复）
4. 城丢易主（军事链 D2 钩子簇负责）

### D3 任命变更簇
任命/罢免一发生连锁触发：
- G.genPost 写入
- ethosShock(power) 跨链价值观（→ E7）
- processFactionLoyalty 下旬 G.genFactionMod 重算
- UI 太守/官员列表刷新

### D4 武将俘获 mirror（指向军事链 D4）
**这是 mirror 节点**，不重复 audit，跨链一致性由 E4 边检查。
军事链已 verified：单挑败方俘获率 +0.20、CAPTURE_RATE_CAP=0.85。

---

## E 区 · 跨链接口 + Claude AI 路径

### E1 经济→武将：招募金费
经济链科技 recruitCostMult / poachCostMult / poachThreshold 影响金费 + 阈值。**对账：经济链「科技效果」节点**。

### E2 经济→武将：欠饷惩罚
经济链月薪发放失败 → applyLoyaltyEvent('payArrear', ctx)。但当前 'payArrear' type **不存在于 C3 的 type 列表里**（D-053 揭露），实际欠饷在 processLoyalty ⑧ 内嵌处理。

### E3 军事→武将：战果反馈
军事链战斗结束调 applyLoyaltyEvent('battle_loss', ctx)。胜利 / 长期未战路径**未通过本函数实装**（D-053）。

### E4 军事→武将：俘获跨链
军事链 D4 ↔ 武将链 D4 双向 mirror。俘获后投降走 D1 capture 路径，不降走 D2 出口。

### E5 武将→军事：技能 hook
SKILL_INLINE 在战斗 / 单挑 / 城市治理触发。武将链定义清单（A7），被使用链负责具体效果（军事链）。

### E6 武将→豪族：origin 影响
武将的 origin（A2）影响豪族链民意：gentry origin → 豪族支持上升；humble/clan → 寒门/宗族民意修正。**对账：豪族链 v4 applyGentry / processGentryFaction 节点**。

### E7 武将→价值观：ethosShock
任命罢免触发 power 维度震荡（士族 vs 寒门）。**当前覆盖不全（D-051 HIGH）**——仅 appointGenPost / dismissGenPost 完整，setPrefect / setStrategist 漏。

### E8 Claude AI v158+ 招募/挖角入口
case 派发于 37209/37210（recruit_wild / poach）。**单立成跨链节点，标记是为了和军事链 / 经济链的 AI 路径对账**。

---

## audit pass 1 关键发现（28 个 D 类候选）

按集中区域分组：

### 派系事件触发完整性（5 个 HIGH/MED + 1 LOW）
- D-048 HIGH AI 背刺漏 betray
- D-049 HIGH warDeclare 严重错配
- D-051 HIGH 任命太守/军师漏 ethosShock
- D-045 MED 豪族开城不触发 conquer（待修）
- D-046 LOW execute UI 叙事错配（修：'武将身死'）
- D-047 MED 普通官职降将不触发（**不修**）
- D-050 MED clearAllPostsByGen 不触发（**不修**）

### 核心忠诚回路（2 HIGH + 1 LOW）
- D-052 HIGH calcLoyaltyDelta vs processLoyalty 双向 4 项缺漏（违反 v93 承诺）
- D-053 HIGH applyLoyaltyEvent city_lost/siege_broken 死代码 + 欠饷/久未出战钩子未实装
- D-055 HIGH 可挖角阈值科技对投机标签失效

### 挖角玩家/AI 不对称（3 HIGH）
- D-063 HIGH 玩家挖角漏 genJoinTurn cleanup
- D-064 HIGH AI 挖角费用未乘科技修正
- D-065 HIGH 玩家 vs AI 公式严重不对称（建议抽 _calcPoachRate 共享）

### Cleanup 类（1 MED + 2 部分 + 1 LOW）
- D-057 MED 下野未清 genFactionMod 缓存
- D-058 部分清 killGen 仅清势力相关临时缓存
- D-059 部分修 surrenderGen 修 cleanup 不修派系事件
- D-054 LOW 下野时 wildPool 满 5 窗口期

### 身份字段补全（2 MED）
- D-066 MED genJoinSource 命名混乱（新增 'poach'）
- D-072 MED 野招/挖角/推荐未写 genOrigFac/genOrigRole

### 出口跨链（1 HIGH + 1 LOW）
- D-061 HIGH 处决俘虏 killerName=null 跳过血仇/仇恨扩散
- D-062 LOW 释放后忠诚不变（**不修**，中性叙事）

### 散点 / 健壮性（多 LOW + 1 MED）
- D-060 MED AI 死敌不劝降（**不修**，刚性设定）
- D-067 LOW wildPool < 5 硬编码
- D-068 MED wildPool push 上限 3 种行为不一致
- D-069 LOW Math.min 冗余防御（**不修**）
- D-070 LOW addStatExp 用 if 不用 while
- D-073 LOW 技能架构两套并存（**不修**，技术债）

### 已审定 / 复审降级
- D-042 LOW HANDOVER 命名 drift（**已查无 bug**）
- D-043 LOW 亲密度阈值经详查降级（**语义独立合理，不修**）
- D-044 HIGH-future 历史寿数死亡未实装（**后续实装提醒**）

---

## 与军事链 audit pass 1 对比

| 指标 | 军事链 v1.1 | 武将链 v1.1 |
|---|---|---|
| 节点 | 47 | 47 |
| 边 | 94 | 89 |
| D 类总量 | 23 | **28**（+22%） |
| HIGH | 6 | **10**（+67%） |
| audit 阶段 | 6 | 6 |

**武将链历史包袱比军事链略重**，主要集中在：
1. **派系 8 类事件触发**（v71/v73/v94/v161 多次迭代叠加，留下边角触发漏洞）
2. **核心忠诚回路 v93 一致性承诺被破坏**（calcLoyaltyDelta 与 processLoyalty 双向缺漏）
3. **挖角是唯一一个不走 thin wrapper 的 AI 入口**（孤例不对称问题）

**关键洞察**：
- 除挖角外，所有 AI 人事 _exec 都是 thin wrapper 共享玩家函数 → AI 决策层架构整体健康
- 大部分 D 类是"代码迭代留的边角"而非"系统设计错误"
- 修复方案绝大多数是**精确手术**（补一行调用、改一个常量、抽一个共享函数），不需要架构重构

---

## v1.1 后续工作

1. ✅ Step 1 反向 grep（47 节点 / 89 边）
2. ✅ Step 2 节点骨架 + 边图
3. ✅ Step 3 6 阶段 audit（28 个 D 类全部定性）
4. ✅ 概念图 v5.0 渲染
5. ✅ walkthrough 大白话说明（本文）
6. 🔲 HANDOVER §二一〇 持久化记录
7. 🔲 19 个 fix 候选实装方案讨论 + 分组实装

---

# 武将链 v1.2 增量补漏(基于 v1.1)

> **v1.2 不是 v1.1 重做**,是补漏。v1.1 末尾发现"派系本身的计算对其他系统的反馈"未被 cover,经核实是漏掉了一整块:
> 
> - 漏了 1 个核心节点(`calcFactionInfluence` 派系势力值汇总)
> - 漏了 3 个跨链反馈节点(武将→事件 / 武将→外交 / 武将→价值观drift)
> - 6 个 A 节点 desc 错误(沿用 HANDOVER 旧描述未对照代码核实)
>
> v1.2 增量产出:节点 47 → **51**(+4),边 89 → **97**(+8),D 类 28 → **30**(+D-074 / +D-075),6 个 A 节点 desc 修正。

---

## v1.2 新增节点 4 个

### C_facInf — `calcFactionInfluence` 派系势力值汇总

**这是 v1.1 漏掉的核心**。这函数 @ 5496 每旬把势力下所有武将按 16 集团归类,算出各集团 "有多少影响力",带 G.turn 缓存。一共 13 个调用点,是 4 大消费方的统一上游:

1. **C8 主tick 自身**(processFactionLoyalty 5543):用派系比例算每旬派系民意修正
2. **C7 UI 修正明细**(getGenFactionModBreakdown 5724):右侧 Tab 给玩家看派系修正怎么来的
3. **E9 武将→事件链**(4 个 gentry 事件 condition):派系势力值是否到阈值决定哪个事件能触发
4. **E11 武将→价值观 power drift**(_processEthosDrift 16091):士族 7 派系合计占比驱动每旬连续漂移
5. **C2④ 拖延执行器**(16452):士族逼宫拖延选项后 12 旬持续衰减派系全员忠诚
6. **派系 Tab UI**(4 处纯展示)

第 7 个调用点 @ 14528 是 **dead code** — 取了不用,见 D-075。

### E9 武将→事件链:派系斗争触发

EVENTS C 类豪族/派系斗争 4 个事件触发条件:
- `gentry_offer` @ 8849 — 用 C_facInf,本地士族派 inf>20%
- `gentry_pressure` @ 8927 — 用 C_facInf,士族派 inf>35% + ≥3 人无官
- `gentry_unrest` @ 9129 — 用 C_facInf,士族派 inf<10% + 城 gentry<30
- `humble_complaint` @ 9051 — **走 A2 origin 标签**(gentry 占官>60%),不走 C_facInf

事件链负责"什么条件触发哪个事件",武将链负责"派系势力值/origin 标签的实际取值",跨链对账。

### E10 武将→外交:汉室死忠占比抑制

外交宣战 14528:若攻方汉室死忠武将占比 >15% 且目标是汉室宗亲,`imperial_decree`(奉旨讨逆)宣称强度自动降级。**实际走 A6 values 标签遍历,不走 C_facInf**(同行 calcFactionInfluence 调用是 dead code,见 D-075)。

曹操打刘备时,如果朝中汉室死忠武将多,会自我抑制不能用最强宣称。这是**武将身份对外交的约束**。

### E11 武将→价值观:派系占比每旬 drift

`_processEthosDrift` @ 16091 power 维度:每旬基于 calcFactionInfluence,统计士族 7 派系(zhongyuan/hebei/xuzhou/jingzhou/yizhou/jiangdong/xiliang)合计 influence 占比 `gentryRatio`,驱动 ethos drift。

> 士族影响力 >30% → power 向"士族控权"漂移
> 士族影响力 <30% → power 向"寒门掌权"漂移

**与 E7 区分**:E7 是任命/罢免触发的**一次性 ethosShock 冲击**,E11 是**每旬连续 drift**,两套机制互补。v1.1 把这两个混到 E7 里写不准确,v1.2 拆开。

---

## v1.2 修正节点 desc 6 个

| 节点 | v1.1 错误 | v1.2 修正 |
|---|---|---|
| **A1** | "6 大派系(uniHan/warlord/pragmatic/hawk/dove/defector)" | "16 个出身/地缘集团(founding/royalty/noble/warlord_remnant/7 gentry_*/gentry_dongzhou/gentry_huaisi/defector/newcomer/humble)" |
| **A2** | 漏 '士族'/'royalty' 是势力级 ethos 字典键 + humble_complaint 出口 | 补 ④⑤ |
| **A3** | "4 类含 neutral" | "uniHan/warlord/regional/pragmatic"(实际无 neutral) |
| **A4** | "鹰派遇 ethos military 高时忠诚+"(错误描述) | 改为实际 hook:triggerFactionEvent 7 类事件 + _processEthosDrift military + 字典键 |
| **A6** | "投机/忠义/重义/恋家"(重义/恋家不存在) | 5 标签完整列表(忠义/野心/投机/汉室死忠/蛮勇),逐个标 hook 行号 |
| **A8** | 漏 'founding' 是字典键 + 命名混乱 | 补 ⑤⑥ |

---

## v1.2 新增 D 类 2 个

### D-074 LOW no-fix — 派系/标签命名混乱 + 蛮勇死数据

**架构债**。三件事:

**(a) CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS 字典 6 键中 4 键与其他系统同名异义**:
- `'founding'` 字典键 = `seniority(name,fid) === 'founding'` 函数判定;FACTION_DEFS 中的 `founding` 是 16 集团之一(C_facInf 派系势力值)→ **同名不同源**
- `'royalty'` 字典键 = `_isClanRoyalty(name,fid)` 函数;FACTION_DEFS 中的 `royalty` 是 16 集团之一 → **同名不同源**
- `hawk`/`dove` 字典键 = GEN_TAGS.combat → 同源,无问题

**(b) `蛮勇` values 标签是死数据**:只 2 武将带(孟获/祝融),全代码无 hook。保留供未来南蛮特化机制可能使用。

**(c) `humble` 也存在轻度同名问题**:FACTION_DEFS 是 16 集团之一,humble_complaint 用的是 GEN_TAGS.origin === 'humble'(同源,可接受)。

**为什么不修**:命名混乱是架构债,本轮 audit 不修;蛮勇是数据保留,运行无成本。后续大版本重构时可考虑改名 `seniority_founding` / `clan_royalty` 区分语义。

### D-075 LOW fix — 14528 dead code

`14528` 行 `const inf = calcFactionInfluence(fid)` 取值后未使用,实际 `hanRatio` 用 `(G.generals[fid]||[]).filter(g => getGenMeta(g.name).values.includes('汉室死忠'))` 直接遍历 GEN_MAP.values 算。

可能是历史重构残留:原本想用 facInf 中 uniHan 派系占比,后来换成 values 标签更准确,旧调用未删。

**修法**:删 14528 单行。语义无影响,纯 dead code 清理。删除后 calcFactionInfluence 调用点从 13 降至 12。

---

## v1.2 后续工作

1. ✅ 节点骨架 47→51 / 边 89→97
2. ✅ 6 个 A 节点 desc 修正
3. ✅ D-074 / D-075 定性
4. ✅ 概念图 v5 → v5.1
5. ✅ walkthrough 增量段(本节)
6. 🔲 HANDOVER §二一一 持久化记录
7. 🔲 政治链 audit 启动(D-076 起)
