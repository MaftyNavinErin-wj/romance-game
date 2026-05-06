# 价值观链 · 大白话说明(对图 audit 用)

> 配套使用:`Project_Romance_Concept_Map_v6_3_ethos.html`(默认打开「价值观链 v1.1」tab)
> 用法:对着图上的节点 ID(A1 / B1 / C3 / D1 / E7 等),在这份文档里找对应段落
> 这份文档**只讲逻辑和设计意图**,不抠数值(数值看节点 desc 或代码)

---

## v1.0 版本说明

价值观链 v1.0 是 audit pass 1 的 Step 1+2+3 一次完成版本(因价值观链架构干净,Step 间隔短,无双段必要),沿用经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 / 外交链 v1.1 命名同代。**27 节点 / 47 边 / 9 D 类全 verdict 锁定**(D-121~D-129)。

按制作人定的:
- **分区方案**:5 区方案 C(A 输入 / B 状态 / C 派生 / D 出口 / E 跨链)
- **节点颗粒度 A**(与已审 6 链对齐)
- **Q 决策**:Q3.1 SIEGE_AFTERMATH.ethosShocks 单立 A3 mirror 军事链 / Q3.2 processFacEthos 单 hub C3(5 维度内嵌不拆)/ Q3.3 applyEthosShock 64 调用点按 5 维度切分到 D 出口 / Q4 _ethosTierLabel 30 tier 内嵌 ETHOS_LABELS 同节点(A2)

---

## 系统总览(30 秒读完)

价值观链是**势力的"行为镜子"** — 5 维度(`mandate`天命/`power`权柄/`civil`文治/`military`武略/`strategy`方略),每维度 ±100,**不是玩家选的,是势力做的事自动塑造的**。

它有 **5 个核心机制** + **5 大产出簇**:

**5 个核心机制**:
- **5 维度状态**:G.factions[fid].ethos = {mandate, power, civil, military, strategy},范围 ±100,clamp 安全。**全代码唯一写口** = `_applyEthosDrift` @ 16044(架构超干净)
- **每旬漂移**:processFacEthos @ 16072 每旬 8 漂移源(武将立场/挟天子/士族影响力/税率/民心/鹰鸽比/城市增减/部队动向/和平期)。**渐进无通知**(走 _applyEthosDrift 不走 shock)
- **离散冲击**:applyEthosShock @ 16056,64 line/70+ call 散点。**有玩家通知**(|delta|≥5 && 玩家)
- **跨势力距离**:_ethosDistance @ 16065,**仅 mandate+strategy 两维度**均值。影响外交友好度漂移
- **30 tier 描述**:_ethosTierLabel @ 1246,5 维度 × 2 方向 × 3 等级 = 30 个独立四字 tier(<15 不偏不倚 / <40 / <70 / 70+)

**5 大产出簇**(D 区按 5 维度切分,与其他链按动作切分不同):
- **mandate 出口 D1**:劝进 condition / 还政 condition / 辞让/拒还政 weight / 武将忠诚 / aiConsiderEnthrone gate(7 处)
- **power 出口 D2**:严刑/重用士族 weight / 举孝廉 weight(2 处)
- **civil 出口 D3**:豪族强迁屏蔽 / 水淹围城屏蔽(2 处,均"仁政"路线阻挡极端手段)
- **military 出口 D4**:攻城 AI choice(屠/劫/安)/ 鹰鸽派忠诚(2 处)
- **strategy 出口 D5**:aiDoDiplo aggrWill / peace 门槛 / checkDiplo 友好度漂移(4 处)

**输入因子**(A 区)6 种:ETHOS_INIT 4 势力开局值 / ETHOS_DIMS+LABELS+30 tier / SIEGE_AFTERMATH ethosShocks(mirror 军事链)/ taxDrift 5 档表 / processFacEthos 8 漂移系数簇 / applyEthosShock 通知阈值 5。

**实体状态**(B 区)3 种:ethos 5 维度主表 / _ethosLog 漂移日志(cap 100) / _ethosSnap 城市数快照。

**派生函数**(C 区)6 个:_applyEthosDrift(底层水管)/ applyEthosShock(对外入口)/ processFacEthos(每旬 hub)/ _ethosDistance(跨势力距离)/ renderEthosTab(UI)/ sanityCheck(防御性 audit)。

**外部输入 / 跨链**(E 区)7 种:E1 政治(11 入边:任命+朝议)/ E2 事件(33 line/40+ call 入边 + 7 出边 condition/weight)/ E3 外交(11 入边:结盟+宣战 hub+exec + 4 出边)/ E4 武将(GEN_TAGS politics/combat helper read 入 + 5 出边武将忠诚)/ E5 军事(SIEGE_AFTERMATH+G.units 入 + 攻城 AI choice 出)/ E6 豪族(强迁 4 入 + calcFactionInfluence helper read 入 + 屏蔽 1 出)/ E7 Claude AI(**D-121 HIGH:getGameState 完全不暴露 ethos**)。

---

## 主流程(每旬价值观链相关跑什么)

每旬 `nextTurn` 内**价值观链相关步骤**按顺序:

1. (跨链事件触发)— 在 `processClaimPrep`/`processFeudDecay`/`processReputation`/`processGentry` 期间,各类事件 effect 调 applyEthosShock 写入 ethos
2. **`processFacEthos(fid)`** @ 16525 — 每势力 5 维度 8 漂移源 ALL_FACS.forEach
3. **`aiConsiderEnthrone(fid)`** @ 16527 — 每 12 旬 + 非玩家(读 mandate gate)
4. (战斗结算期)— 攻克城池 27953 / SIEGE_AFTERMATH 16165 写 ethos
5. (UI 渲染)— renderEthosTab 读 ethos+_ethosLog+_ethosDistance

**关键观察**:processFacEthos 在 nextTurn 中位置**早于 checkElimination**(16535)→ 灭国势力当旬走完正常 processFacEthos,**下旬开始** _eliminated 标记起作用,但代码不跳过 → **D-129**(已 fix verdict)。

---

## A 区 · 输入因子(6 节点)

### A1 — ETHOS_INIT 4 势力开局值
4 势力定调:**曹魏**篡汉 +15/集权 +20/铁血 +10/扩张 +15(冷血枭雄定位)/ **蜀汉**崇汉 -30/怀柔 -20(最浓重的崇汉色彩)/ **孙吴**共治 -20/守成 -20(江东派系压君,守土心态)/ **南蛮**仁政 -10/铁血 +15(部落式怀柔但战斗力强)。

### A2 — ETHOS_DIMS + LABELS + 30 tier
5 维度元数据。**30 tier 描述**是把每维度分成 4 档:不偏不倚(<15)/ 弱倾向(<40)/ 强倾向(<70)/ 极端倾向(70+),独立四字(如"心系汉室→矢志兴汉→汉贼不两立")。UI 用,逻辑不读。

### A3 — SIEGE_AFTERMATH.ethosShocks(mirror 军事链)
3 处置 × 2 维度 × 数值:**安民**(military -6, civil -3)/ **劫掠**(+8, +5)/ **屠城**(+18, +12)。屠城 +18 单次必触发玩家通知(>=5)。**Mirror 军事链**主体定义。

### A4 — taxDrift 5 档表(civil 漂移)
processFacEthos 内嵌 const(16100):none -0.5 / low -0.3 / norm 0 / heavy +0.4 / harsh +0.6。**handover 笔误澄清:此表写 civil 不写 strategy**。**D-123 候选**(LOW defer):未中央 const 化,改数值需精确定位行号。

### A5 — processFacEthos 漂移系数簇
8 漂移源全硬编(mandate 0.5+0.3 / power 1.2 / civil 1/200 / military 0.5 / strategy 0.4/0.3+0.6+0.15)。**D-123**:架构债,未来重构 sprint 抽 ETHOS_DRIFT_COEF 中央 const。

### A6 — applyEthosShock 通知阈值 5
`|delta|>=5 && fid===G.playerFac` 才弹窗。**D-125**(LOW no-fix):屠城 18 通知,劫掠 8 通知,安民 -6 通知 -3 不通知 → 玩家容易感觉"做坏事有反馈,做好事只有一半"。设计意图是避免轰炸玩家,但维度间不对称是用户体验细节。

---

## B 区 · 实体状态(3 节点)

### B1 — G.factions[fid].ethos 5 维度
**全代码唯一写口** _applyEthosDrift 16048。15 处读取(豪族链强迁屏蔽 / 事件 condition+weight / 武将忠诚 / aiDoDiplo / aiConsiderEnthrone / checkDiplo / 军事 AI choice)。clamp ±100 安全。架构超干净。

### B2 — _ethosLog 漂移日志
push {turn, dim, delta, source}, cap 100(v167fix #16 30→100)。**D-124**(LOW verified-with-notes):cap 100 实测容 12-25 旬历史(初评 5 旬偏低)。重大事件并发可拉低到 10-15 旬,但 UI 仅看末 8 条不影响。

### B3 — _ethosSnap 城市数快照
单字段 cityCount,processFacEthos 写。计算 cityDelta 用(开疆 +0.4 / 失地 -0.3)。

---

## C 区 · 派生函数(6 节点)

### C1 — _applyEthosDrift(底层水管)
11 行核心:`|delta|<0.01` short-circuit + clamp ±100 + push log。**唯一写口**,架构干净。无玩家通知(由上层 applyEthosShock 处理)。processFacEthos 内 8 漂移源直调 _applyEthosDrift(渐进无通知合理)。

### C2 — applyEthosShock(对外入口)
thin wrapper:调 _applyEthosDrift + 玩家通知。**64 line/70+ call 调用点**全核(Step 3 阶段 4),无新 D 类。详细分布见 E 区各链。

### C3 — processFacEthos(每旬 hub)
65 行 hub,5 维度独立漂移块。8 漂移源:
- mandate:武将立场((warlord-uniHan)/gc × 0.5)+ 挟天子(+0.3)
- power:士族派系影响力((0.3 - gentryRatio) × 1.2)
- civil:税率(taxDrift 5 档)+ 民心((50-avgM)/200)
- military:鹰鸽((hawk-dove)/gc × 0.5)
- strategy:城市 delta(+0.4 增/-0.3 减)+ 部队 fieldRatio((ratio - 0.35) × 0.6)+ 和平期(-0.15)

**多个 D 类汇集**:
- **D-126**(verified-with-notes):nonRuler 排除 ruler → 君主立场不计 mandate/military 漂移。设计意图(君主是"势力本体"非"贡献者")
- **D-127**(verified-with-notes):无部队势力 fieldRatio=0 → strategy -0.21,语义略奇怪
- **D-128**(no-fix):atWar 不查 rebel,被 rebel 围攻仍计和平期 -0.15(rebel 非外交对象,设计意图)
- **D-129**(fix):**灭国势力 processFacEthos 不跳过 _eliminated**,每旬冗余 strategy -0.36+log push 浪费。修复方法 16073 加 `|| G.factions[fid]?._eliminated` 条件

### C4 — _ethosDistance
仅 mandate+strategy 两维度均值,0-100。**为什么只两维度?** 设计意图:外交对立看"统治正当性"(mandate)和"野心"(strategy),不看治理风格(power/civil/military)。3 调用点:checkDiplo(友好度漂移)/ aiDoDiplo(>50 +10% 宣战意愿)/ renderEthosTab(UI 显示)。

### C5 — renderEthosTab(UI)
3 区:5 维度横条(玩家)/ 其他势力一览(_ethosDistance 4 档标签:道不同/貌合神离/和而不同/志同道合)/ 最近变化日志(_ethosLog 末 8 条)。

### C6 — sanityCheck(防御性 audit)
35588-35596 检 ethos 存在 + 5 维度 typeof number + clamp [-100,100]。架构防御性,正常游戏 _applyEthosDrift clamp 已保证。

---

## D 区 · 状态出口(5 节点,按维度切分)

**重要:D 区按 5 维度切分,不按"动作"切分**(与其他链不同)。原因:64 处 applyEthosShock 的下游影响是按维度收敛,符合"价值观是势力气质镜子"设计。

### D1 — mandate 出口(7 处:称帝/劝进/还政/忠诚)
- **事件 4**:劝进 condition(`mandate<20` 屏蔽事件触发,10342)/ 辞让劝进 weight(`mandate>=35` 倾向辞让,10411)/ 还政姿态 condition(`mandate<25` 屏蔽,10422)/ 拒绝还政 weight(`mandate<40` 倾向拒绝,10473)
- **武将 1**:崇汉武将不满篡汉势力(uniHan + mandate>0,13636-13638)
- **称帝 2**:aiConsiderEnthrone gate(`mandate<30` 不称帝,15599)+ bonus(`mandate>=60` chance+0.15+城市优势放宽,15603+15608)

### D2 — power 出口(2 处事件 weight)
严刑/重用士族 weight(`power>0`,10537)+ 举孝廉 weight(`power<0`,10597)。仅事件 weight 调整,**无强制 gate**。

### D3 — civil 出口(2 处屏蔽)
**仁政路线阻挡极端手段**:豪族强迁屏蔽(`civil<-20`,6857)+ 水淹围城屏蔽(`civil<-30`,10655)。注意均为负值阈值。

### D4 — military 出口(2 处)
攻城 AI 选择(`military>60` 屠城/`>30` 劫掠/否则安民,27957)+ 鹰鸽派忠诚(鸽派 military>20 不满 / 鹰派 military<-20 不满,13640-13641)。

### D5 — strategy 出口(4 处)
全在外交链:aiDoDiplo aggrWill strategyBoost(strategy/100×0.15,14493)+ aiDoDiplo _ethosDistance>50 → +10%(14494)+ aiDoDiplo peace 门槛 stratPeaceBonus(14599)+ checkDiplo 友好度漂移(_ethosDistance 4 档,16277-16280)。

---

## E 区 · 跨链(7 节点)

### E1 — 政治链(11 入边)
- 任命 4(5179/5180/5196/5197):power ±1~3,基于 GEN_TAGS.origin(gentry/humble/clan)
- 朝议 7(5890-5896):military/strategy/civil/power 各 1~2 数值,按 proposal.id 匹配

**verified-mirror 政治链 v1.1**。

### E2 — 事件链(33 line/40+ call 入边 + 7 出边)
**入边 33 line(40+ call)**:灾荒/疫病/水患/功臣/礼贤/流民/檄文/武将处置/劝进/治理/察举/水淹,12 类事件。**verified-with-findings**(stage 4 全核,数值合理无 D 类)。

**出边 7 处**:condition/weight 读 mandate(4)+ power(2)+ civil(1)。

### E3 — 外交链(11 入边 + 4 出边)
- **入边 11**:玩家结盟 14272(strategy-2)/ aiDoDiplo 宣战 4(14567,14569,14570,14571 — **D-122 双计**)/ applyWarDeclarationEffects hub 4(15466-15469)/ _execDeclareWar 1(37479 — **D-122 双计**)/ _execProposeAlliance 1(37502)
- **出边 4**:aiDoDiplo aggrWill+strategyBoost+eDistBoost(14493-14494)+ peace 门槛(14599)+ checkDiplo 漂移(16277-16280)

**D-122 跨链 close = 外交链 D-095**(已 fix verdict 等代码 sprint)。

### E4 — 武将链(1 入 + 5 出)
- **入边 1**(stage 6 补):GEN_TAGS politics/combat helper read 入 processFacEthos hub
- **出边 5**:武将忠诚价值观匹配(13631-13641)读 mandate+military

**verified-mirror 武将链 v1.2**。

### E5 — 军事链(5+1 入 + 1 出)
- **入边 5**:攻克 27953(strategy+4)+ SIEGE_AFTERMATH forEach 4(16165-16168 数据驱动从 A3)+ stage 6 补 G.units helper read
- **出边 1**:攻城 AI choice(27957)读 military 决定 屠/劫/安

**verified-mirror 军事链 v1.1**。

### E6 — 豪族链(4+1 入 + 1 出)
- **入边 4+1**:玩家强迁 6703-6704(civil+3,military+1)+ AI 强迁 6934-6935(同)+ stage 6 补 calcFactionInfluence helper read 入 processFacEthos hub power 漂移
- **出边 1**:强迁屏蔽 6857(`civil<-20`)

### E7 — Claude AI(**D-121 HIGH** 唯一 HIGH)
**discrepancy** 状态。getGameState @ 36374-36679 305 行函数体**零 ethos 引用**(grep 全函数体 0 命中 'ethos|mandate|civil|power|military|strategy_dim'),prompt 也零 ethos 上下文。

**多重副作用**:
- (a) Claude AI 接管的外交决策无 strategyBoost/eDistBoost(仅 fallback aiDoDiplo 14492-14494 生效)
- (b) Claude AI 称帝**绕过** aiConsiderEnthrone mandate<30 拒绝 gate(因走 _execEnthrone @ 37888 仅查 canEnthrone 硬门槛 turn≥24/城≥10/rep≥40/非附庸,**无 mandate 检查**)
- (c) Claude AI 不感知价值观距离 _ethosDistance,无法做"价值观对立"外交

**修法**:(1) getGameState 添加 ethos 5 维度+tier label+_ethosDistance 表;(2) prompt 添加价值观相关指引;(3) 可选 _execEnthrone 加 mandate gate 对齐 aiConsiderEnthrone 15599。

**同源外交链 D-099 模式**(Claude AI 信息缺失类型)。

---

## D 类完整清单(D-121~D-129,9 项)

| ID | 严重度 | verdict | 核心议题 |
|---|---|---|---|
| **D-121** | **HIGH** | fix | Claude AI getGameState 完全不暴露 ethos + prompt 零上下文 + _execEnthrone 绕过 mandate gate |
| D-122 | MEDIUM | 跨链 close | aiDoDiplo+_execDeclareWar ethos 双计 = 外交链 D-095 已 fix verdict |
| D-123 | LOW | defer | taxDrift+8 漂移系数无中央 const,架构债 |
| D-124 | LOW | verified-with-notes | _ethosLog cap 100 实测容 12-25 旬,初评 5 旬偏低 |
| D-125 | LOW | no-fix | applyEthosShock 通知阈值 5 不对称(屠城通知/安民部分通知,设计意图) |
| D-126 | LOW | verified-with-notes | nonRuler 排除 ruler → 君主立场不计漂移(设计意图) |
| D-127 | LOW | verified-with-notes | 无部队 fieldRatio=0 strategy -0.21(实际无害) |
| D-128 | LOW | no-fix | atWar 不查 rebel,被 rebel 围攻仍计和平期(设计意图) |
| D-129 | LOW | fix | 灭国势力 processFacEthos 不跳过 _eliminated,每旬冗余 strategy -0.36+log push |

**HIGH 1 / MEDIUM 1 / LOW 7 = 9。fix 2 / no-fix 2 / defer 1 / verified-with-notes 3 / 跨链 close 1。**

---

## 与已审 6 链对比

| 链 | D 类 | HIGH | MEDIUM | LOW | 节点 | 边 |
|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | ~95 |
| 豪族链 v4 | 12 | - | - | - | ~37 | ? |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | ? |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | ? |
| 政治链 v1.1 | 15 | 3 | 5 | 7 | 45 | 90 |
| 外交链 v1.1 | 31 | 5 | 13 | 13 | 51 | 118 |
| **价值观链 v1.1** | **9** | **1** | **1** | **7** | **27** | **47** |

**价值观链特点**:
- **D 类总数最少**(9),**HIGH 也最少**(1)— 7 链最干净
- **节点/边数最少**(27/47)— hub 集中度高(_applyEthosDrift 唯一写口 + processFacEthos 单 hub)
- 8 LOW 中 5 是 verified-with-notes/no-fix(架构合理但有边缘行为可记录),实际需 fix 仅 2 个(D-121 + D-129)

---

## 设计巧思汇总(非 bug,值得记录)

1. **唯一写口架构**:全代码 _applyEthosDrift @ 16048 是唯一写 ethos 的口。clamp ±100 + log 集中,审计零盲点。这是 7 链里架构最干净的一个。

2. **5 维度切分 D 区**:与其他链按"动作"切分不同,本链 D 区按维度切分 — 因 64 处冲击下游影响按维度收敛,符合"价值观是镜子,不是事件"设计。

3. **_ethosDistance 仅 mandate+strategy**:故意排除 power/civil/military。外交对立看"统治正当性"和"野心",不看治理风格 — 否则蜀汉(仁政+怀柔)与南蛮(仁政+铁血)会因 civil 一致而拉近,不符合"汉夷之分"逻辑。

4. **渐进 vs 离散**:processFacEthos 走 _applyEthosDrift 不走 shock(每旬几条不通知玩家);事件/政治/外交走 applyEthosShock(单次 |≥5| 通知玩家)。**通知粒度匹配玩家心智模型**。

5. **30 tier 描述独立设计**:每维度 × 方向 × 等级 = 独立四字,不复用同模板。"心系汉室→矢志兴汉→汉贼不两立"远比"轻度→中度→重度崇汉"有沉浸感。

6. **AI 攻城 choice 直接读 military**:`military>60 屠 / >30 劫 / 否则 安`。让"势力气质"自动驱动 AI 行为是设计的精髓 — 不需要额外人格参数,价值观本身就是行为指南。

---

## 工作流方法论沉淀(基于 7 链 audit)

继承 §二〇九.11 / §二一〇.8 / §二一一 / §二一二.10 / §二一三.8 方法论,本轮新增:

### 8.1 hub 集中度高 → D 类总数低
价值观链 27 节点 / 9 D 类 vs 外交链 51 节点 / 31 D 类,差异主因是**单一 hub**(processFacEthos)+ **单一写口**(_applyEthosDrift)。**审计经验**:hub 集中度高的链审计起来快,但 hub 内部漂移源系数一旦多就要逐条核(8 漂移源每个都验证)。

### 8.2 跨链 close 模式延续
D-122 = 外交链 D-095 同源,继承"政治链 D-077 = 军事链 D-021"模式。**审计经验**:跨链 D 类不做新 verdict,继承首次审计的 verdict + 标 cross-chain-close。代码 sprint 时一次性 fix 双侧。

### 8.3 节点 desc 数值核对偏差是常见 stage 5 发现
本轮 stage 5 发现 E2 desc "32 line"实为 33 line(40+ call)+ D1 desc 7 处口径(逻辑分组而非 read line 数)。**审计经验**:Step 1 反向 grep 数节点时容易把"line"和"call"混(line 含 multi-call 行如 8407 一行 2 call)。stage 5 节点级模糊用 awk 区间精数。

### 8.4 灭国/eliminated 跳过逻辑应核每个 process_ 函数
D-129 (processFacEthos 不跳过 _eliminated)与历史经济链/豪族链类似议题相通。**审计经验**:每个 process_xxx 主 tick 函数应核 `if(fid === 'rebel' || G.factions[fid]?._eliminated) return;` 二件套。

### 8.5 Claude AI 信息暴露面是隐形 D 类温床
D-121 (getGameState 缺 ethos)+ 外交链 D-099(prompt 缺 4 _exec)+ 外交链 D-100(派发器漏 enthrone case)= "Claude AI 信息缺失"三种典型。**审计经验**:每条链 audit 时必看 getGameState/prompt/派发器三处 — 子系统暴露 / 指令接口 / 派发完整性。可建自动化检查工具。

### 8.6 跨链 helper read 边的取舍
本链 stage 6 补 5 dashed 边(E1/E3/E4/E5/E6 → C3 hub helper read)。**审计经验**:每个 hub 函数(processFacEthos / applyWarDeclarationEffects 等)若读多链状态,补 helper read 入边能让概念图更准确。但要避免边数爆炸 — 仅补"读取产生影响"的(processFacEthos 8 漂移源对应 5 链入边,合理);不补"纯 query"的(如 ALL_FACS.includes 这类)。

---

## 不做的事(再次重申)

- ❌ 不动游戏代码(包括 9 个价值观链 D 类的 2 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 / 外交链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节(本节追加为 §二一四)
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

代码 sprint 时机:等所有链 audit 完成后(剩余 **事件链** 1 条)。

---

## 下个对话指引

**继承的素材**:
- 价值观链 v1.1 三件套(JSON / 概念图 v6.3 / walkthrough)
- 9 个价值观链 D 类全部定性,不重审
- 7 链工作流方法论(§二〇八+§二〇九.11+§二一〇.8+§二一一+§二一二+§二一三+本节)
- **D 类清单累计 122 个跨链 D 类**(后续链 audit 时对账用)

**新对话启动建议** **事件链 audit pass 1**(剩最后一条):
- 同样 5 步:Step 1 反向 grep → Step 2 节点骨架 → Step 3 6 阶段 → 概念图 → walkthrough
- 与已审 7 链同代命名(v1.0 → v1.1)
- D 类编号从 **D-130** 起

**Step 1 反向 grep 分组建议**(事件链特性):
1. 主 tick:processEvents / EVENT_REGISTRY / triggerEvent
2. 派生入口:33 类事件 condition / effect / aiChoose
3. 状态读写:G.events / G._eventCD / G._activeEvents
4. 常量:EVENT_REGISTRY 33 事件 / 7 promise 类型 / 优先级
5. 跨链入边:经济/军事/武将/政治/外交/价值观/豪族/Claude AI 都可能触发事件
6. 跨链出边:事件 effect 写入各链状态(applyEthosShock 33 处 / 经济 buff / 军事变化 / 武将变化等)

**事件链特别关注**:
- 12 类事件(灾荒/疫病/水患/功臣/礼贤/流民/檄文/武将处置/劝进/治理/察举/水淹)各自 condition+effect+aiChoose 三件套
- v179fix P15 系列推广不彻底模式(继承外交链 D-104/D-113 等 HIGH 集中规律,事件链可能也有平行 bug)
- Claude AI 暴露面(getGameState 是否含活跃事件,_exec 是否覆盖事件分支)

---

(本 walkthrough v1.0 完结)
