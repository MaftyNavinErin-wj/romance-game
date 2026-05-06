# 军事链 · 大白话说明（对图 audit 用）

> 配套使用：`Project_Romance_Concept_Map_v4_military.html`（点「军事链 v1」tab）  
> 用法：对着图上的节点 ID（A1 / B3 / C8 / D2 / E8 等），在这份文档里找对应段落  
> 这份文档**只讲逻辑和设计意图**，不抠数值（数值看节点 desc 或代码）

---

## v1.0 版本说明

军事链 v1.0 是首版，沿用经济链 / 豪族链 v4 命名表示同一代 audit。基于 Step 1 反向 grep 收齐 **47 节点 / 94 边 / 16 跨链引用**。所有节点 `audit.status='pending'`，等 Step 3 逐节点深审时改 verified 或 discrepancy。

按制作人定的：
- **分区方案**：5 区方案 C（A 输入 / B 状态 / C 派生 / D 出口 / E 跨链）
- **节点颗粒度 A**（与经济链、豪族链对齐，汇总为主）
- **Q 决策**：C12 单挑系统单立 / C15 部队生命周期 5 tick 聚合 / D2 易主钩子簇聚合 / E8 Claude AI 单立

---

## 系统总览（30 秒读完）

军事链是整个游戏最复杂的链路，比经济链稍微复杂一点（47 vs 44 节点）。它有 **6 类战斗** + **3 套状态层**：

**6 类战斗各立一个节点**（C7-C12）：
- C7 野战 / C8 攻城 / C9 伏击 / C10 营寨 / C11 水战 / C12 单挑

**3 套状态层**：
- 部队级（unit.*）— B1 兵力 / B2 士气 / B3 等级经验 / B4 编制上限 / B5 AP / B6 状态机 / B7 整备倒计时 / B8 AI 字段
- 城市级（city.*）— B9 城防军 / B10 围城衰减
- 武将级 — B11 亲卫数

**输入因子**（A 区）8 种：地形、季节、兵种、武将技能、兵种克制、等级经验、适性、派系民意。决定每场战斗的双方战力、伏击概率、火攻威力等。

**派生函数**（C 区）16 个，三组：
1. 数值层：C1 AP / C2 战力基底 / C3 攻击力 / C4 防御力 / C5 火攻 / C6 伏击
2. 战斗主体：C7-C12（6 类战斗 resolve）
3. tick 与派发：C13 战斗触发派发 / C14 围城进度 / C15 部队生命周期 5 tick 合一 / C16 补给与流亡

**状态出口**（D 区）4 种：D1 战损出口 / D2 易主钩子簇 / D3 战利品 / D4 武将出口。

**外部输入 / 跨链**（E 区）8 种：豪族（城防+征兵）/ 政治（朝议+官职）/ 外交（敌我判定）/ 科技（多 buff）/ 事件（直写城防）/ 经济链 C11 流亡机制 / 价值观（处置+全灭）/ **Claude AI v158+ 高层接口（D-006 起点）**。

---

## 主流程（每旬军事相关跑什么）

每旬 `nextTurn` 内**军事链相关步骤**按顺序：

1. 旬初 AP 重置（每支部队满 AP，整备中除外）
2. `checkRebellions()` — 叛乱检测（产生叛军部队）
3. `runAI()` / `runRebelAI()` — AI 决策（含目标选择 / 部队调度 / 围城）
4. halt 部队 auto-return（无任务的游离 AI 部队回城）
5. `processUnitMovement()` — 部队按 hexPath 推进 + 碰撞触发战斗
6. 旬末 garrison 校正（落在己方城市 hex 上的部队入城）
7. `updateFog(fid)` — 移动后、战斗前更新迷雾
8. `checkAmbushTriggers()` — 伏击检测（不直接 resolve，仅触发弹窗）
9. 叛军 halt 战斗检测（叛军主动攻击邻接敌军）
10. `processSiegeDecay()` — 围城进度推进
11. `processReinforcement()` — 野战部队自然补员
12. `processMobilizing()` — 整备倒计时
13. `processMuster()` — 征兵 / 扩编集结进度
14. `processSupplyStatus()` — 补给线 BFS + 断粮惩罚
15. `processUnitFood()` — 部队就近扣城里粮
16. `processUnitSalary()` — 势力级扣军饷

**最关键的设计意图**：

- 战斗触发是**事件式**的（部队接触/伏击触发/攻城到期），不是每旬批量 roll
- AI 战略是**势力级先选目标、再分给部队**（G2 重构），而不是每支部队各自找最近敌城
- 攻陷城池触发**钩子簇**（15+ 钩子），易主必须每个钩子都跑——**v118 已经修过 4 钩子缺失，但只覆盖叛乱/大乱/谣言 3 个场景，攻城胜利路径作为最完整样板，需要 Step 3 逐场景对账**

---

## A 区 · 输入因子（决定每场战斗的参数）

A 区所有节点都是为了回答一个问题：**这场战斗，双方战力多少、能不能伏击、能不能放火？**

### A1 地形 TERRAIN
7 类地形：plain（平原）/ forest（林）/ mountain（山）/ hill（丘陵）/ water（水）/ swamp（沼）/ road（道路）。hex 级查询。同时影响 5 个东西：
- 行军 AP 消耗（山路慢）
- 兵种克制乘数（骑兵在山地打折）
- 伏击基础概率（林地 55% / 平原 15%）
- 火攻倍率（森林 1.5×）
- 战斗时整体地形修正

**白话**：地形是军事链最基础的输入。整个战场的"环境"。

### A2 季节 SEASON
4 季只对**火攻**有用（夏 1.3 / 秋 1.2 / 春 1.0 / 冬 0.5）。其他季节效应都在经济链（粮草季节倍率）。

**白话**：夏天放火最猛，冬天放火失效。其他时候季节不影响军事。

### A3 兵种 TROOP_TYPES
**16 兵种数据表 = 5 普通 + 11 精英**。每兵种自带：
- ap（基础行动力）
- baseType（5 大基础类，精英兵种归到对应基础类计算克制 / 适性）
- maxSquads（编制上限，**精英固定 ≤3 队**）
- eliteLevel（精英最低出厂等级，**固定 10 级出厂**）
- costMult（**精英固定 1.7 倍贵**）
- recruit（每人耗多少铁/木/马）
- homeCity（**精英绑定特定城市才能征**）

**5 个普通兵种**：cavalry / light / archer / heavy / siege

**11 个精英兵种**（绑定原产地）：
| 精英 | 绑定城 | 基础类 |
|---|---|---|
| 虎豹骑 | chenliu（陈留）| 骑兵 |
| 西凉铁骑 | tianshui（天水）| 骑兵 |
| 淮南突骑 | shouchun（寿春）| 骑兵 |
| 丹阳兵 | jianye（建业）| 轻步 |
| 羌兵 | hanzhong（汉中）| 轻步 |
| 无当飞军 | chengdu（成都）| 弓兵 |
| 白毦兵 | yongan（永安）| 重步 |
| 陷阵营 | puyang（濮阳）| 重步 |
| 北军精锐 | luoyang（洛阳）| 重步 |
| 藤甲兵 | jianning（建宁）| 重步 |
| 霹雳车营 | xuchang（许昌）| 攻城 |

**白话**：兵种数据库。5 普通 + 11 精英 = 16 种。精英全部是城市绑定的（虎豹骑只能在陈留征、白毦兵只能在永安征），10 级出厂、贵 1.7 倍、每势力每种最多 3 个分队。这是把"演义王牌部队"映射到游戏机制——你想要虎豹骑就得拿陈留。

### A4 武将技能（战斗类）
两套实现并行：
- **SKILL_REGISTRY 注册表**：纯数值类，4 个 trigger（onCalcAP / onCalcATK / onCalcDEF / onGentry）。每个技能用 try-catch 包，**单技能出错不影响其他技能**。
- **SKILL_INLINE 内联**：副作用类，写在战斗代码具体位置。共 12+ 处战斗类内联：
  - hezhen 张飞喝阵（敌方士气-15）
  - zhijun 于禁治军（己方士气+5）
  - xiandeng 乐进先登（攻城士气+18 战后恢复）
  - qiaosi_atk / qiaosi_siege 刘晔巧思（攻城+5%）
  - jushu 郝昭拒蜀（守城+0.15）
  - zuoduan_def 孙权坐断（江东守城+5%）
  - yicheng 徐盛疑城（攻方-5%）
  - zhenjing 文聘镇荆（荆州+20%）
  - huoying 陆逊火营（守营寨士气-5）
  - shensuan_ambush 诸葛亮神算（伏击±10%）
  - duel_score / elai+15 / guoguan+5 / xinyi+10（单挑加分）
  - duel_trigger 关羽/赵云被动单挑+15%

**白话**：武将技能在战斗中的作用。注册表是统一调度的（数值算 4 hook 自动跑），内联是写死在战斗代码里的（喝阵直接砍士气这种）。**A4 是 A 区出度最高的节点（8 出边）**，符合"武将带兵种"的核心定位。

### A5 兵种克制矩阵
5×5 矩阵（cavalry / light / heavy / archer / siege）。`getTypeMatchMult` 按敌方各兵种**占比加权平均**，不是简单查表。**只作用 ATK，不双向作用 DEF**（设计精妙处）。

**白话**：骑兵打弓兵优势、弓兵打骑兵劣势。但敌方是混编的话按比例加权算，不是看主兵种一刀切。只乘进攻方乘数，避免双向放大。

### A6 部队等级 / 经验
1-20 级，每级 +5% 战力。`UNIT_LEVEL_EXP[]` 是升级经验表。战后 `applyBattleExp` 自动发经验、升级。新兵出厂等级由人口质量 + 科技决定。**满级后 exp 归 0 不再积累**。

**白话**：打仗自动加经验、攒满升级。屯田休整保留等级（v117 BILLET_LEVEL_THRESHOLD），扩编新兵会按比例稀释整支部队的等级。

### A7 适性 APT_MULT
**4 档（S/A/B/C）**。武将对每种兵种的适应度。`_squadBase` 内 aptMult。v138 起水战读专门的 naval 适性。

**白话**：关羽适合带步兵、马超适合带骑兵这种。S 档 +20%、A 档 +10%、B 档基准、C 档 -12%。水战时不读陆战适性，读独立的 naval 适性表。

### A8 派系民意 overlay
v113 加入。`getFactionMoraleMod(genName, fid)` @ 5642 — **派系得势 / 失势的动态士气加成**。

机制：
1. 取武将所属派系 `facId`（GEN_TAGS 标记，如鹰派 / 鸽派 / 尊汉派 / 士族派 / 创始派 等）
2. 算该派系在该势力的**平均势力值** `getAvgFactionMod(fid, facId)`——派系所有武将势力值的均值
3. **安全区 ±15**（科技九品中正 / 天下为公会拉宽）
4. 超出安全区才生效：
   - **得势**（派系平均 ≥ +15）→ +morale，最多 +30
   - **失势**（派系平均 ≤ -15）→ -morale，最多 -30
   - 在 [-15, +15] 安全区内 = 0

派系势力值由 `triggerFactionEvent` 动态调整（8 类事件）：
- 处决武将 → 被杀者所在派系全体 -5
- 占领新城 → 鹰派 +3
- 停战 / 结盟 → 鸽派 +3 / 鹰派 -1
- 宣战 → 鹰派 +2 / 鸽派 -1
- 外交背刺 → 尊汉+士族派 -4
- 任命同派系武将做太守/军师 → 同派系全体 +2
- 卸任 → 同派系 -1
- 降将任太守 → 创始派 -3

**直接 overlay 到 sq.morale 进入战力公式，不进城市民心系统。**

**白话**：**得势的派系武将带兵有加成、失势的派系武将带兵被扣**。每个武将归属一个派系（鹰派/鸽派/尊汉派/士族派/创始派 等），派系会因为各种事件涨跌势力值（处决伤同派系-5、占领新城鹰派+3、停战鸽派+3、任命同派系+2 等）。势力值进入 ±15 安全区外才生效——派系得势超过 +15 时该派系所有武将带兵 +morale 最多 +30、失势低于 -15 反过来扣 -30。安全区内不加不扣（避免微小波动一直影响战力）。

---

## B 区 · 实体状态（部队 / 城市 / 武将的核心数）

### B1 unit.squads[].troops
**整个军事链的核心数**——每个分队的实际兵力。**24+ 处写入**：
- 12926 征兵首批
- 16013 价值观全灭（v152）
- 22467 / 22579 断粮欠饷溃散
- 22484 / 22597 逃兵
- 22692 集结到位
- 23725 / 24206 / 25010 战损（野战/攻城/伏击）
- 23732 / 24216 全歼
- 27980 / 27989 攻城战损 / 全灭
- 30383 自然补员
- 33600 增编首批
- 37864 _execDisband Claude AI 解散
- 38682+ debug

读取统一走 `getUnitTroops(u)` 求和。

**白话**：兵力是军事链最重要的数。从 24 个不同的地方被改，所以最容易出 bug。审计时要核每个写入点的"扣前检查 / 扣后边界 / retainers 同步"是否完整。

### B2 unit.squads[].morale
分队士气，10-100。战斗内 `applyMorale` 加减（clamp）；SKILL_INLINE 直接 mutate（喝阵 -15、治军 +5、先登 +18）；统帅类武将 buff（v167）。**最低锁底 10**，避免负值。

**白话**：士气直接乘进战力公式（士气低战力暴跌）。低于 10 强制锁住——保证再差的部队还能打一下。

### B3 unit.level / unit.exp
部队等级（1-20）+ 累积经验。战后 `applyBattleExp` 加经验、自动升级。扩编时稀释等级（新兵+老兵平均）。屯田保留等级。

**白话**：打仗加经验、升级加战力。但扩编是"加新兵"，会拉低整体等级——这是设计意图（鼓励小队精兵 vs 大军摊薄）。

### B4 unit.maxTroops（squad 级）
分队编制上限。征兵以这个数为目标、扩编是抬高这个数。受 `TROOP_TYPES.maxSquads` 间接限制（精英 ≤3 队）。

**白话**：每队的"瓶颈天花板"。征兵把当前兵力补到这个数为止，扩编先抬天花板再补。

### B5 unit._apRemaining
本旬剩余 AP（v99 即时移动追踪）。旬初重置满 AP，整备中=0，行军扣对应 cost，水陆转换清零，攻城后清零（v146）。

**白话**：本旬还能走多少格。即时移动每走一格就扣，攻城打完就清零（不能再行军跑路）。整备中部队 AP=0 不能动。

### B6 unit.status（状态机）
6 态状态机：
- garrison 驻守城市
- march 行军中
- halt 被堵停下
- siege 围城
- ambush 设伏中
- camp 扎营中

~30 处切换。**状态切换有讲究**：拔营 / 集结 / 撤围都需要配合 mobilizingTurns / hexPath 同步。

**白话**：部队当前在干嘛。每个状态对应不同的可行动作，转换时要清理对应的辅助字段（不能 ambush 直接变 march 而留一堆 ambush 残留状态）。

### B7 unit.mobilizingTurns
整备 / 集结倒计时。新征兵默认 1 旬整备到位、拔营也是 1 旬。整备中 `_apRemaining=0`。

**白话**：部队"在等准备"的旬数。等到 0 就可用。

### B8 unit._aiRole / _aiTarget / _aiPlan（G2 战略字段）
- `unit._aiRole` = 'attack' / 'defend' / 'idle' / 'garrison'
- `unit._aiTarget` = cityId（当前目标）
- `fac._aiPlan` = `{targets:[{cityId,score,assignedUnits[]}], lastReviewTurn}` 势力级计划

势力级先选目标（aiSelectTargets），再分给部队（_aiRole/_aiTarget），部队按分配执行（aiExecuteOrders）。**事件驱动重选**（目标被攻下 / 外交变化 / 部队全灭）。

**白话**：G2 重构后 AI 不再"每支部队各自找最近敌城"，而是势力先选好目标再分配给部队。事件驱动重选，不是每旬都重算。

### B9 city.garrison
城防军兵力。每旬自然补员（`processGarrisonRecovery`），上限 `garrisonCap(city)`。被攻陷 / 叛乱 / 大乱清零。**攻城战时这部分兵力作虚拟"_garrison_X"分队加入守方阵容参战**。

**白话**：城防军是"白送的守城兵"。每旬自动恢复一点，但有上限（看城墙等级）。攻城时它会作为一支虚拟部队上场，被打没了城就守不住了。

### B10 city.siegeDecay
围城衰减进度，0-1。0 = 城防完整，1 = 城防归零。每旬有围城方在场就推进，按城市大小决定多少旬打满（小 3 / 中 9 / 大 18）。撤围或攻陷直接清零。

`getSiegeDefMult(city)` 公式：`1 + (baseDef × durM + wallBonus) × (1 - decay) × gentryDef`

**白话**：围城进度条。0 时城里有"城防加成"，1 时加成归零（裸打）。围着城等几旬等加成削平再正面打，是经典攻城节奏。

### B11 retainers（武将亲卫）
武将级亲卫数。战损保护：v163 `RETAINER_PROTECT=0.35`，亲卫部分受保护（损失率打 0.35 折扣）。全歼时 `setRetainers(0)`。集结时按比例预占。

**白话**：每个武将带的"私兵"，比普通士兵更顶损。打仗时亲卫部分扛得住，但整个分队全灭时也会归零。retainers 和 troops 是两套并行系统，但耦合在战损公式里。

---

## C 区 · 派生函数（核心计算层）

### 上半部分：6 个数值计算节点

### C1 calcUnitAP
水军固定 4 AP（`isUnitOnWater` 判定）。陆军 = 各分队加权平均 ×0.8 + 最慢分队 ×0.2，至少 2 AP。+ 技能 `onCalcAP` flatAP。

**白话**：部队每旬能动多少 AP。水军全部一样 4 AP；陆军是混编时按"加权 + 最慢短板"算，避免一队骑兵带一队步兵能跑骑兵速度的不合理。

### C2 _squadBase 战力基础
**ATK / DEF 共同的基底公式**：
```
troops × lvMult × moraleMult × comBonus(com) × aptMult × fireDebuff
```
- effectiveMorale = clamp(5, _moraleCap, sq.morale + _facMorale)
- _moraleCap = 100 + 科技 moraleCapBonus
- aptMult = APT_MULT[gen.apt[aptKey]]

**白话**：战力公式的核心基底。把 6 个因素乘起来：兵力 × 等级 × 士气 × 统帅 × 适性 × 火攻 debuff。这个值再乘各自的 ATK / DEF 修正得到最终战力。**整个军事链战力计算的"心脏"**——C2 入度 8（只低于 C13），所有战力路径都过这里。

### C3 calcUnitATK / squadATK
进攻力。在 C2 基底之上额外乘：
- TYPE_ATK[type]（兵种基础 ATK 系数）
- 克制矩阵 × 地形 × 混编（C5 内汇总）
- 技能 onCalcATK multATK
- 科技 atkMult
- _xiaoyi_atk（关平孝义+5%）

`enemyUnits=null` 时退化为纯 ATK 基础值（向后兼容旧调用）。**defenders 标 `_isDefenderThisBattle`**（供法正/司马懿/魏延等技能识别攻守方）。

**白话**：进攻战力。要知道敌方组成（克制要敌方占比），所以传 enemyUnits。守方算 ATK 时把攻守方角色标好，让某些技能能区分"我是被打的还是来打人的"。

### C4 calcUnitDEF / squadDEF
防御力。在 C2 基底之上额外乘：
- TYPE_DEF[type]
- 地形（terrainMult）
- _defBonus（攻城战城防倍率 / 营寨防御加成临时设）
- siegeDebuff = 0.95 if `_siegeDebuff`（围城方反向折扣）
- 技能 onCalcDEF + steadfast 主将守方+2%
- 科技 defMult

**白话**：防御战力。守城时整支部队的 _defBonus 会被叠加为城防倍率。围城方有反向 debuff（5%）——围城太久军纪松散。

### C5 火攻判定
`FIRE_TERRAIN_MULT`（forest 1.5 / mountain 1.2 / hill 1.0 / water 1.3）× `FIRE_SEASON_MULT`（夏 1.3 / 冬 0.5）。资源消耗 300 金 200 木。`aiDecideFireAttack` 决定 AI 要不要烧。受方 `_fireDebuff` 写入。**可触发于野战 / 伏击 / 营寨 / 水战，不可触发于攻城战**。

**白话**：火攻发动条件和效果。要烧 300 金 + 200 木，威力看地形 × 季节（冬天森林 1.5 × 0.5 = 只有 0.75 倍效果，可能不值得烧）。攻城战放不了火（设计上认为攻城不适合烧）。

### C6 伏击判定
基础概率（plain 0.15 / forest 0.55 / mountain 0.65 / hill 0.40 / water 0.05 / impassable 0）。`checkAmbushTriggers` 每旬扫所有 ambush 状态部队。`resolveAmbush` 内中伏率 = base + 战力差修正 ± 诸葛亮 10%。

**白话**：伏击概率公式。地形决定基础值（林山高 / 平原低），战力差和技能再修。诸葛亮在场敌方中伏率 +10%、自家中敌方伏少 10%（对称）。

### 中半部分：6 类战斗 resolve 主体

### C7 resolveBattle（野战）
野战 + 水战壳。流程：
1. `calcCP` = Σ calcUnitATK → cpRatio → roll 结果
2. `applyLoss(units, lossRate)` 内嵌：sq.troops -= lost；retainers 按 0.35 折扣同步扣
3. `applyMorale(units, delta)` clamp 10-100
4. `applyAnnihilation(losers, ratio≥3.0)` 全歼（**确定性，不 roll**）
5. SKILL_INLINE 内嵌：hezhen / zhijun / yicheng 等

**水战调它**（用 'water' 地形参数）。standalone 调用入口 7 处。

**白话**：野战主体。算双方战力比、roll 结果、按比例扣兵、低于阈值（cpRatio≥3.0）必定全歼。途中各种武将技能内联触发——张飞喝阵直接砍敌方士气、于禁治军己方+5。

### C8 resolveSiegeBattle（攻城战）— **军事链最复杂的节点**
出度 8（与 A4 并列最高）。流程：
1. `garrison>0` 时构造**虚拟分队** `_garrison_X` 加入 defenders
2. `getSiegeDefMult` 城防倍率：`1 + (baseDef × durM + wallBonus) × (1 - decay) × gentryDef`
3. SKILL_INLINE：jushu 郝昭+0.15 / zuoduan_def 孙权江东+5% / qiaosi_atk 刘晔+5% / yicheng 徐盛-5% / zhenjing 文聘荆州+20% / xiandeng 乐进+18 士气
4. 地形固定 'plain'（城市节点）
5. **内调 C7 `resolveBattle`** 复用核心公式
6. 胜 → city.fac 易主 → **触发 D2 钩子簇 15+ 钩子**
7. SIEGE_AFTERMATH 三档处置（pacify / loot / massacre）
8. `calcBreakoutChance` 城内野战部队按概率突围

9 处调用入口。

**白话**：攻城战主体。城防军作为"虚拟分队"入守方阵容。城防倍率是个复合公式：基础 × 地形耐久 × 墙等级 ×（1- 围城衰减）× 豪族支持。攻方赢就触发城市易主，然后跑 15+ 个钩子（缓存刷新 / 占领期 / 太守清空 / 外交关系 / 价值观冲击 / 等等）。城内的野战守军会按概率突围逃出（calcBreakoutChance）。

### C9 resolveAmbush（伏击战）
中伏率 = `AMBUSH_BASE_CHANCE[ter]` + 战力差修正 + 诸葛亮±10%。
- 中伏：受方损失高（30-50%）+ 士气暴跌
- 未中伏：转普通野战或受方撤退

`useFireAttack` 时叠加 `_fireDebuff`。**siege 状态部队也可被伏击**（v85 设计：部队路过想围城，先被截住）。

**白话**：伏击战主体。先 roll 中伏率，中伏方损失大、不中就转野战或脱身。siege 状态也能被伏——这是有意为之的，避免伏击成空挡。

### C10 resolveCampBattle（营寨战）
mode 二选一：
- **raid 劫营**：智谋差 >10（攻方智将偷袭）→ 减员快
- **assault 强攻**：智谋差 ≤10 → 偏对耗

营寨方有 `_defBonus` 加成。SKILL_INLINE huoying 陆逊火营守方士气-5。fire 可叠加。

**白话**：营寨战。攻方智谋比守方智谋高 10 以上才能选"劫营"（偷袭，减员快），否则只能强攻。陆逊在守方时火攻额外加成。

### C11 resolveNavalBattle（水战）
`NAVAL_BLOCKED_SKILLS` 屏蔽部分陆战技能（骑兵冲阵之类水上没用）。NAVAL_AP=4。NAVAL_WATER_COST=2。武将读 naval 适性（独立查表）。fire 倍率 water=1.3。

**白话**：水战独立。和野战分开是因为陆战技能（骑兵冲阵）水上没用，要屏蔽。武将的水战适性是独立的（不是陆战适性的延伸）。

### C12 单挑系统 resolveDuel（单立节点）
聚合 7 函数：`resolveDuel` 主 + `getDuelCandidates` / `aiDecideDuelChallenger` / `applyDuelMorale` / `applyDuelIntimacy` / `tryPassiveDuel` / `pickDuelist`。

模式：
- **主动单挑（叫阵）**：玩家 / AI 在战前选挑战者
- **被动单挑**：5% 基础 + 技能加成（关羽 / 赵云 +15%、关兴 +5%）

斩杀触发：`DUEL_KILL_WAR_GAP=20` + roll `DUEL_KILL_CHANCE=0.30`。SKILL_INLINE：duel_score 加分 / elai+15 / guoguan+5 / xinyi+10。结果影响双方士气和武将亲密度（→ 人物链）。8 处调用（嵌入 4 个 resolve + 1 个 passive + 3 个 confirm 主动）。

**白话**：单挑独立节点。主动叫阵 + 被动触发两条路径。武勇差超过 20 就有 30% 概率斩杀。技能影响 score 和触发率。结果影响士气和武将亲密度，跨链到人物链。

### 下半部分：tick 与派发节点

### C13 战斗触发派发（**入度最高 10**）
6 类战斗的总调度。流程：
1. `aiInitiateBattle(aggressor)` 主入口
2. `collectBattleSides` 收集双方所有单位
3. **按守方状态分流**：
   - `hasCampDefender` → C10 营寨战
   - `_isSiegeBattle`（守在己方城内）→ C8 攻城战
   - 否则 → C7 野战 或 C11 水战（由 `_resolveBattleEngagement` 路由）
4. 玩家 4 个 confirm 弹窗：confirmBattle / confirmSiegeBattle / confirmAmbush / confirmCampBattle
5. `_aiBattleProcessedThisTurn` Set 同旬去重（facPair + dedupLoc 规范化，防止重复触发）
6. **前置 isHostile 判定**（停战/同盟期间不触发）

`checkAmbushTriggers` 单独走（不进 aiInitiateBattle，直接 push 弹窗或 resolveAmbush）。

**白话**：战斗发起的总调度。AI 一支部队接触敌军时进 aiInitiateBattle，按守方状态分发到 6 类战斗。玩家在弹窗里按选择走 confirm 路径。同旬同区域只能打一次（去重防止重复触发）。

### C14 processSiegeDecay
每旬 tick。扫描所有围城方在场的城市，按 `SIEGE_MAX_TURNS`（small 3 / medium 9 / large 18）推进 decay。**remaining 严格递减不会回退**（v114 audit 确认无死循环）。无围城方 → 立即清零。

**白话**：每旬推进围城进度。多少旬打满取决于城市大小。围城方撤了或被打跑就直接清零（重新围要从 0 开始）——这是设计意图（避免 AI 反复围而不打）。

### C15 部队生命周期 process（5 tick 聚合）
**聚合 5 个 process tick**（部队生命周期同一阶段，无独立产出公式所以合一节点）：
1. `processUnitMovement`（hexPath 推进 + 碰撞检测 + 城市进入判定）
2. `processMobilizing`（mobilizingTurns 倒计时）
3. `processMuster`（征兵集结到位 sq.troops = sq._mustered）
4. `processReinforcement`（reinforce 政策自然补员，扣城里人口）
5. `processGarrisonRecovery`（城防自然补员，受 garrisonCap 上限）

**白话**：部队生命周期 5 个 tick 合一节点。移动一格 + 整备倒数 + 新兵到位 + 自然补员 + 城防恢复——这些每旬都要跑，但都是"部队生命周期"同一阶段，没有独立产出公式所以合一处审。

### C16 补给与流亡
聚合 3 函数：
1. `buildSupplyMap(fid)` BFS（remaining 严格递减+覆盖检查无死循环，v114 已审）
2. `processSupplyStatus` 检测断粮 + 欠饷逃兵（断粮 10%/旬 maxTroops，欠饷 5%/旬，连续超阈值全军溃散）
3. `processUnitFood` 野战部队就近扣城里粮（**C11 流亡兜底**：势力丢光所有城但部队还在 → `_rations` 旬再饿死）

`SUPPLY_RATIONS` + 科技 `supplyRationsBonus` + `_extraRations` 决定容忍旬数。

**白话**：补给系统。每旬 BFS 建势力补给图（哪些城是连通的），野战部队按补给图就近扣粮。势力丢光所有城但部队还在的"流亡"状态有几旬缓冲，撑过缓冲期才彻底饿死（C11 流亡机制，v119 设计）。

---

## D 区 · 状态出口

### D1 战损出口（squads → 0/clear）
**所有让分队兵力清零的出口聚合**。来源：
- C7-C11 五类战斗 `applyLoss` / `applyAnnihilation`
- C16 断粮溃散 + 欠饷溃散
- E7 价值观冲击全灭（v152 行 16013）
- `checkLoyaltyThresholds` 武将下野删 squad（v114 已修）
- 残部清理 `G.units.filter(troops>=50)`

**retainers 同步**：`setRetainers(0)` 全歼时调用。`getUnitTroops` 求和兜底（防 NaN）。

**白话**：所有"让兵力归零"的出口。战斗、断粮、欠饷、价值观冲击、武将下野、残部清理——这些路径都要正确处理 retainers 同步（亲卫数同步清零）。

### D2 易主钩子簇（**军事链最关键的审计点**）
城市易主时**必须触发的 15+ 钩子聚合**。攻城胜利路径（27916+）最完整：
- `city.fac = 新势力`
- `cityChangeLog 记录`
- `invalidateCityCache`（地图刷新）
- `billetPool 清空`（屯田兵员溃散）
- `trackCityLoss`
- `checkEmperorCapture`（天子易主）
- `applyGentryOnCapture`（豪族支持度调整）
- `city.siegeDecay = 0`
- `city.garrison = 0`
- `city.occupied` 占领期分档（强宣称 3 旬 / 中 12 / 弱 18 / 无 27）
- `city._yibingBuff`（强宣称 9 旬 -30% 征兵费）
- `city.prefect = null`（旧太守清除）
- `city._supplyRestoreTurns`（v88 新占需恢复才能提供补给）
- `_aiInvalidateThreatCache`
- `updateFogCitySnapshot`
- `addDiplo(-8)` 外交关系扣
- `applyCommonEnemyDiploBonus(+2)` 共同抗敌加成
- `triggerFactionEvent('conquer')` 鹰派+3
- `applyEthosShock` 方略+4 扩张
- AI 自动 SIEGE_AFTERMATH（aiMil>60 屠 / 30 劫 / 否则安）
- 城内野战部队 `calcBreakoutChance` 突围

**v118 链路 2 已修过 4 钩子**（叛乱 / 大乱 / 谣言）—— 但只覆盖 3 个易主场景，**攻城胜利作为最完整样板**，需要 Step 3 把 4 个易主场景（攻陷 / 叛乱 / 大乱 / 谣言）逐一对账 15+ 钩子的完整性。

**白话**：城市易主的钩子大全。攻城胜利路径有 15+ 个钩子。叛乱 / 大乱 / 谣言这 3 个易主路径 v118 已经修过钩子缺失，但攻城胜利作为最完整样板。Step 3 要把 4 个路径逐一对账，看其他路径还有没有缺钩子。

### D3 战利品出口（→ fac.res.gold）
SIEGE_AFTERMATH 三档处置：
- **pacify 安民**：goldMult 0，moraleMod +10，gentryMod +5，repCost 0，ethosShocks {military:-6, civil:-3}
- **loot 劫掠**：goldMult 0.4，moraleMod -20，popMult 0.9，gentryMod -15，repCost -3
- **massacre 屠城**：goldMult 0.8，moraleMod -50，popMult 0.7，gentryMod -40，repCost -10

`_applySiegeAftermath` 计算金量并写入 `fac.res.gold`。AI 按军事价值观 aiMil 自动选。

**白话**：攻陷的战利品。三档：安民 0 金但民心+10 / 劫掠 40% 但民心-20 人口-10% / 屠城 80% 但民心-50 人口-30% 信誉-10。AI 按军事价值观自动选——铁血派屠 / 中庸派劫 / 怀柔派安。

### D4 武将出口（俘获 / 战死）
- `collectPrisoners` 战后俘虏收集，`CAPTURE_RATE_CAP=0.85`，单挑败方 +0.20
- `surrenderGen(genName, targetFid)` 投降（loyalty=50± + loyaltyAccum 同步，v118 已修）
- `releaseGen` 释放
- `applyBattleExp` 经验发放（A6 触发）
- retainers 战损 / 全灭同步清零

**白话**：武将战后归宿。俘虏（最多 85% 概率，单挑败方再 +20%）/ 投降归化新主（忠诚 50 起步）/ 释放回原主。战死的武将正式从势力里删除。亲卫同步清零。这条出口跨到人物链。

---

## E 区 · 跨链接口（外部输入与 Claude AI 路径）

### E1 ← 豪族（城防 / 征兵 / 民心）
3 函数入边：
- `getGentryDefMult(cityId)` → C8 攻城战城防倍率
- `getGentryRecruitMult(cityId)` → 10 条征兵路径金费乘数（**D-006 漏点**）
- `getGentryMoraleMod(cityId)` → 攻城战 garMorale 计算

**白话**：豪族对军事的影响——攻城时城防倍率乘豪族系数（拥戴+25% / 抗拒-50%）、征兵金费乘豪族系数、城防守军士气受豪族修正。**已知 D-006 是 _execRecruit 路径漏乘豪族系数**。

### E2 ← 政治（朝议 / 官职 buff）
- `getCourtDecreeBuffs(fid).milBuildCost` → 城墙 / 兵营建造打折
- `_postBuffs.recruitCost` → 前 / 大将军职位征兵打折

**审计点**：grep 发现 `_postBuffs.combat / battleATK / battleDEF / siege / ambush / camp / naval / duel` **均为 0 处**——意味着官职 buff 在战斗本体没有挂载点。**待确认这是设计意图（只在征兵阶段加成不在战斗阶段加成）还是漏挂**。

**白话**：政治对军事的影响——朝议下令的"整军令"给军建打折、前 / 大将军职位给征兵打折。但是没有任何官职给战斗本体加 buff（无前线攻防加成）——这是设计意图（武将技能管战斗 buff、官职管职务 buff）还是漏挂？Step 3 确认。

### E3 ← 外交（敌我判定）
`isHostile(facA, facB)` 170 处调用，前置于所有战斗 resolve 入口。停战 / 同盟期间 isHostile=false → 战斗触发被阻止。`G.diplo[pair]` 双向状态机（enemy / neutral / ally）。

**审计点**：17 处战斗 resolve 调用入口的 `isHostile` 前置检查是否完整（已知 v100 修过类似遗漏）。

**白话**：外交关系决定能不能打。停战 / 同盟期间敌我判定 false，战斗触发会被卡住。所有战斗发起入口都要前置 `isHostile` 检查，要审一遍是不是有遗漏。

### E4 ← 科技（多 buff）
科技对军事的 7 个 effectKey：
- `atkMult` → C3 / 统计面板（2 处）
- `defMult` → C4 / 统计面板（2 处）
- `recruitCostMult` → 9 处征兵
- `supplyRationsBonus` → C16 补给天数
- `moraleCapBonus` → C2 士气上限
- `aptExpMult` → A6 经验加成
- `occupiedMult` → D2 占领期延长

**白话**：科技对军事的影响。攻防双向 mult、征兵金费打折、补给天数延长、士气上限提升、经验倍率、占领期延长——科技几乎所有军事节点都加。

### E5 ← 事件（直写军事字段）
事件直写 `city.garrison` 4 处：
- 8269 叛乱清零
- 9912 某事件 +500
- 10830 大乱清零
- 15995 v118fix 钩子

叛乱触发 → `checkRebellions` → 产生叛军部队推入 `G.units`。

**v118 链路 2 已修**：谣言叛乱（删内联）+ 大乱（补 4 钩子）。

**白话**：事件链直接写军事字段——叛乱 / 大乱清零城防、某些事件给城防+500。叛乱产生新的"叛军"部队。v118 已经审过钩子缺失（谣言叛乱 + 大乱），但不排除还有其他事件路径。

### E6 ↔ 经济链 C11 流亡机制
势力丢光所有城但部队还在 → 进入流亡状态：`processUnitFood` 用 `unit._rations` 倒计时。流亡期 _rations 旬内不饿死，超期 → 部队溃散 → 势力淘汰。**与 C16 共享逻辑**。

**白话**：v119 流亡机制。势力地都打没了但部队还在野外，给几旬流亡缓冲再饿死。这条边是经济链 C11 的镜像，但触发逻辑在军事链（势力检查所有城<=0 + 部队>0 = 流亡）。

### E7 ← 价值观（处置 / 全灭）
- aiMil（military 维度）→ D2 SIEGE_AFTERMATH 自动选择（>60 屠 / >30 劫 / 否则安）
- `applyEthosShock` 攻克城池 +方略 4
- SIEGE_AFTERMATH.ethosShocks 反向影响（劫 +military 8 +civil 5 / 屠 +military 18 +civil 12 / 安 -military 6 -civil 3）
- v152 价值观冲击全灭（行 16013）：极端价值观下分队 sq.troops=0

**白话**：价值观对军事的影响。AI 按军事价值观自动选择处置（铁血派屠 / 中庸派劫 / 怀柔派安）。处置反向加深价值观（屠完更铁血——正反馈循环，玩家选择有"惯性"）。极端价值观下还有冲击全灭。

### E8 ← Claude AI v158+ 高层接口（**军事链 D 类候选最重要节点**）
Claude AI 决策系统。11 个 _exec* 军事 action @ 37191 派发：
- `_execMove` @ 37727（move / attack 共用，设 _aiRole）
- **`_execRecruit` @ 37746**（**已知 D-006 漏 6 个修正**）
- `_execDisband` @ 37794
- `_execSetCamp` @ 37808
- `_execSetAmbush` @ 37818
- `_execCancelSpecial` @ 37830
- `_execCancelSiege` @ 37840
- `_execBillet` @ 37848
- `_execSetReinforcePolicy` @ 37874
- `_execRecruitWild` @ 37403

**审计点**：经济链 D-006 已识别 `_execRecruit` 漏 6 修正（豪族 / 兵营 / 仪兵 / 科技 / 特色 / 官职），其他 10 个 _exec* 是否同类断点？

**白话**：Claude AI 高层 action 接口。LLM 决定要做啥（move / recruit / set_camp 等），dispatch 到对应 _exec* 函数执行。这是经济链 D-006 真 bug 所在路径——_execRecruit 漏了 6 个征兵金费修正乘数。**军事链审计要扩展核 11 个 action 是否还有同类耦合断点**。

---

## 关键设计意图汇总（非 bug，值得记录）

按经济链 walkthrough 的"设计巧思"段惯例，军事链有以下值得记录的精妙处：

1. **C8 攻城战 1 节点 8 出边** — 与 A4 武将技能并列出度最高，反映"攻城战是军事链最复杂场景"的设计现实（豪族 / 城防 / 围城衰减 / SIEGE_AFTERMATH / 钩子簇 / 突围 / 内调野战 / 6 个 SKILL_INLINE 都汇这里）

2. **A5 兵种克制只乘 ATK 不乘 DEF** — 避免双向放大。攻方按敌方占比加权、守方不反向算，否则克制效果 ×2 失衡。

3. **C7 野战 applyAnnihilation 确定性全歼** — cpRatio≥3.0 必定全歼无 roll。v85 设计：避免 90% 应该全歼但 roll 失败的离谱结果。

4. **C9 伏击允许 siege 状态部队被伏** — v85 设计：部队路过想围城，先被截住。siege 不是免伏盾。

5. **C13 战斗触发去重 facPair + dedupLoc 规范化** — 同旬同区域只能打一次，防止重复触发。fac 对按字典序规范化、坐标按 hkey 排序，确保正反方向 key 相同。

6. **C14 围城衰减无围城方立即清零** — 不渐衰、不保留、不冷却。围城方撤了 / 被打跑 → 重新围要从 0 开始。设计上避免 AI 反复围而不打。

7. **C15 5 tick 聚合无独立公式** — 这 5 个 tick 都是"部队生命周期"同一阶段（移动 / 整备 / 补员 / 城防恢复），无独立产出公式所以合一节点（与经济链 C 区每个 tick 单立的设计不同）。

8. **C16 流亡机制 v119** — 势力丢光所有城但部队还在 → 流亡 _rations 旬再饿死。给"绝地反击"留窗口，避免一夜亡国。

9. **D2 易主钩子簇 v118 修复了 3 个场景但攻城胜利样板最完整** — Step 3 要把 4 路径逐一对账 15+ 钩子。

10. **D4 武将俘获单挑败方 +20%** — 单挑败的武将被俘概率显著提高（85% 上限基础上加 20%），符合演义"被擒"叙事。

11. **E2 官职 buff 战斗本体 0 处挂载** — 设计上**官职管职务 buff（征兵打折）、武将技能管战斗 buff**，不交叉。Step 3 确认是设计意图还是漏挂。

12. **E4 科技多 buff 几乎覆盖全军事链** — 科技几乎所有军事节点都加（攻 / 防 / 征兵 / 补给 / 士气 / 经验 / 占领期），是军事节奏的"全局加速器"。

---

## 与已 audit 链的对接情况

### 经济链对接（v4.3 已 audit）

| 跨链边 | 经济链节点 | 状态 |
|---|---|---|
| C13 _execRecruit → 经济链 D1 fac.res.gold | D1 国库金 ✓ verified | **D-006 已识别**，军事链 Step 3 要扩展 |
| C13 征兵 → 经济链 E11 popQuality 砍 | E11 征兵冲击 ✓ verified | 10 条征兵路径需对账一致性 |
| C8 攻城胜 → 经济链 D1 战利品收金 | D1 ✓ | 设计干净 |
| C16 → 经济链 C10 processUnitFood | C10 ✓ verified | 设计干净 |
| C15 → 经济链 B1 city.pop（补员扣人口） | B1 ✓ verified | 设计干净 |
| E6 ↔ 经济链 C11 流亡 | C11 ✓ verified | 双向耦合，无矛盾 |

### 豪族链对接（v4 已 audit）

| 跨链边 | 豪族链节点 | 状态 |
|---|---|---|
| E1 城防 ← getGentryDefMult | （豪族链派生函数）| 干净 |
| E1 征兵金费 ← getGentryRecruitMult | （豪族链派生函数）| **D-006 在此断裂** |
| E1 民心修正 ← getGentryMoraleMod | （豪族链派生函数）| 干净 |
| D2 易主 → applyGentryOnCapture | （豪族链 D11/D12 已知 bug 区域）| Step 3 关注是否有反向影响 |

---

## Step 3 优先级路线图

按经济链 Step 3 经验"先 D 类候选问题、再边界 case、再散点扫描、再节点级模糊点、最后批量 verified"，军事链 Step 3 排：

| 阶段 | 重点 | 节点 | 预期发现 |
|---|---|---|---|
| **1. D 类候选高优** | E8 + 11 个 _exec* 是否还有同类 D-006 | E8 | 可能 D-015~D-018（同根） |
| **2. D 类候选中优** | D2 易主钩子簇 4 场景对账 | D2 | 可能 D-019~D-021（钩子缺失） |
| **3. 边界 case** | 17 处 resolve 入口 isHostile 前置 + 去重 + collectBattleSides | C13 | 可能 D-022（同盟误击穿） |
| **4. 散点扫描** | 10 条征兵金费一致性 + _postBuffs 战斗 buff 0 处 | E1 + E2 | 可能 D-023（设计意图 / 漏挂确认） |
| **5. 节点级模糊** | applySkills 4 hook 鲁棒性 + 6 类 SKILL_INLINE 完整性 | A4 + C7-C12 | 可能 LOW 文档级 |
| **6. 批量 verified** | 剩余 30+ 节点逐一确认 | 全部 | 大部分 verified |

discrepancy 命名延续：从 **D-015** 开始（D-001~D-014 已用于经济链）。

---

## 不做的事（再次重申）

- ❌ 不动游戏代码（包括 D-006 修复 / 任何 Step 3 发现的 bug）
- ❌ 不动豪族链 v4 / 经济链 v4.3 数据
- ❌ 不重写 HANDOVER 早期章节（每轮追加章节）

Step 3 的产出是 audit 报告，发现的 bug 等到代码 sprint 时再统一修。
