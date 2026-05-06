# 外交链 · 大白话说明(对图 audit 用)

> 配套使用:`Project_Romance_Concept_Map_v6_2_diplomatic.html`(默认打开「外交链 v1.0」tab)
> 用法:对着图上的节点 ID(A1 / B3 / C8 / D2 / E7 等),在这份文档里找对应段落
> 这份文档**只讲逻辑和设计意图**,不抠数值(数值看节点 desc 或代码)

---

## v1.0 版本说明

外交链 v1.0 是 audit pass 1 的 Step 1 反向 grep + Step 2 节点骨架版本,沿用经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 命名同代。基于 Step 1 反向 grep 收齐 **51 节点 / 102 边**(Step 6 补 16 边后达 118 边),所有节点 audit.status='pending',待 Step 3 6 阶段逐节点深审。

按制作人定的:
- **分区方案**:5 区方案 C(A 输入 / B 状态 / C 派生 / D 出口 / E 跨链)
- **节点颗粒度 A**(与经济链/军事链/武将链/政治链对齐)
- **Q 决策**:Q3.1 玩家 4 件套 + aiDoDiplo 5 节点单立 / Q3.2 附庸 5 函数拆 2 节点(玩家入口 C15 + helper C18)/ Q3.3 主 tick 3 函数 3 单立(C9/C10/C11)/ Q3.4 applyWarDeclarationEffects 入 C20 hub
- **Q 决策**:Q4 TRIBUTE_RATES 单立 A4 标 mirror 政治链 A10 / Q5 isHostile 入 C1 查询簇

---

## 系统总览(30 秒读完)

外交链是游戏的"势力间关系层"——决定**势力之间怎么交往,怎么打仗,怎么和好,怎么称霸**。比武将链/政治链复杂(51 节点 vs 51/45),**跨链辐射全图**(7 个 E 节点辐射经济/军事/武将/豪族/政治/价值观/Claude AI)。

它有 **5 个核心机制** + **5 大产出簇**:

**5 个核心机制**:
- **状态机**:每对势力 4 状态(neutral/enemy/ally/vassal)+ 0~100 友好度 + 多种时间戳(_warDeclaredTurn/_peaceTurn/_brokenAllyTurn 等)
- **宣称机制**:8 类宣称(奉旨讨逆/讨贼兴汉/吊民伐罪/讨伐伪帝/蛮族劫掠/收复故土/兴兵复仇/边境清寇)+ 4 强度档(strong/medium/weak/none)→ 影响信誉/第三方/豪族支持/派系/价值观
- **信誉机制**:0~100 的"国家 PR 值",影响送礼效果/求和接受率/称帝门槛,自然恢复 0.1~0.2/旬
- **附庸机制**:从主权独立到藩属再到独立的完整生命周期,跟随宗主外交联动
- **称帝机制**:turn≥24 + 城≥10 + rep≥40 + 非附庸 → 解锁全对象强宣称 / 第三方关系崩塌 / 全势力价值观冲击

**5 大产出簇**:
- **宣战簇 D1**:diploWar / aiDoDiplo / _execDeclareWar → 5 件事(status + rep ± + 第三方 rel + gentryHook + 派系 fac mod + ethosShock)
- **停战 / 解盟簇 D2**:_applyPeaceAgreement(v179fix P15c 4 路径合一)+ diploBreakAlliance
- **附庸生命周期簇 D3**:_setVassalStatus 统一入口 + 4 玩家入口 + AI 极弱投靠 + 附庸独立请求
- **称帝 / 天子易主簇 D4**:doEnthrone + checkEmperorCapture
- **通商协定簇 D5**:diploTradeAgreement / cancelTradeAgreement / _cleanTradeAgreements / aiDoTradeAgreement / calcTradeAgrIncome

**输入因子**(A 区)11 种:宣称类型 / 强度 / 称帝派系效果 / 纳贡(mirror 政治链)/ 通商常量 / AI 人格 / 称帝门槛 / 背刺反复阈值 / 时长常量(prep/ready/feud)/ AI 节奏 / CD 常量。

**派生函数**(C 区)20 个,4 组:
1. 查询/计算:C1-C8(状态查询簇/附庸查询簇/战力估算/议和意愿/宣称查询/信誉修正/通商收入/纳贡查询)
2. 主 tick:C9-C12(宣称推进/血仇消退/信誉恢复/通商清理)
3. 玩家/AI 入口:C13-C17(玩家 4 件套/玩家解盟/玩家附庸 4 入口/玩家其他 5 入口/AI 主入口 3)
4. helper / hub:C18-C20(附庸 helper / 停战 helper / 宣战副作用 hub + 称帝 + 易主)

**状态出口**(D 区)5 种:D1 宣战 / D2 停战解盟 / D3 附庸生命周期 / D4 称帝天子易主 / D5 通商协定。

**外部输入 / 跨链**(E 区)7 种:E1 经济(5 类输出)/ E2 军事(170+ isHostile 调用 + 清 siege)/ E3 武将(挖角 + 派系事件 + claim 派系 mod)/ E4 豪族(占城 hook + TRIBUTE mirror)/ E5 政治(TRIBUTE A10 mirror)/ E6 价值观(6 类 ethosShock)/ E7 Claude AI(9 _exec 但 prompt 缺 4 指令)。

---

## 主流程(每旬外交链相关跑什么)

每旬 `nextTurn` 内**外交链相关步骤**按顺序:

1. **重置 _actedThisTurn**(16347)— 全 G.diplo[k]._actedThisTurn=false
2. **_cleanTradeAgreements**(16367)— 清失效通商协定(灭国/敌对/rel<20)
3. **processFacEconomy 内**(7140-)— calcTradeAgrIncome 注入金 + getTributeRates 纳贡转金粮
4. **processClaimPrep**(16520)— 推进宣称准备 + 12 旬过期清理
5. **processFeudDecay**(16521)— 60 旬血仇消退
6. **processReputation**(16522)— 信誉自然恢复 0.1~0.2/旬(曹操×2/钟繇+0.15)
7. **AI 决策(规则 AI)**:每 3 旬错峰 aiDoDiplo / 每 6 旬 aiDoTradeAgreement / 每 12 旬 aiConsiderEnthrone(13447-13449,16527)
8. **Claude AI 决策**(_claudeAI.enabled 时):callClaudeAPI → executeClaudeActions → _execOneAction 派发器调用 9 _exec(37214-37222)
9. **checkDiplo**(16234)— 阈值转换 + 自动漂移 + 附庸自动脱离

**最关键的设计意图**:

- **双键真双向**(v179fix P16):G.diplo['A-B'] 和 G.diplo['B-A'] 是两个独立 key,任何写都要双向同步,addDiplo 已 helper 化
- **v179fix P15c 停战统一入口**:4 路径(玩家接受 / 玩家发起 / aiDoDiplo / _execDiploArmistice)全走 _applyPeaceAgreement,避免漏副作用(_diploCD/清 siege/清宣称池/truce 事件)
- **isHostile 当旬不生效**(v123):宣战当旬 declTurn>=G.turn → false,守方有 1 旬反应时间
- **宣称强度 vs 派系/信誉/豪族 4 维联动**:strong 全正面(+10 豪族支持)/ none 全负面(-25 豪族,-12 信誉)
- **emperor 状态特权**:所有宣战都走强宣称通道,派系全正(汉室死忠+2/士族+1)
- **称帝是不可逆事件**:全游戏 mandate +12 推高,汉室正统性崩塌

---

## A 区 · 输入因子(决定外交链的"规则参数")

A 区所有节点都在回答一个问题:**这条规则的常量值是什么**?

### A1 宣称类型 CLAIM_TYPES
8 类:imperial_decree(强,prep0,emperor_holder,hanRoyalPenalty)/ restore_han(强,prep2,han_royal,target=emperor_holder/emperor)/ punish_tyrant(强,prep1,emperor)/ overthrow_pretender(强,prep1,emperor,target=emperor)/ tribal_raid(弱,prep0,tribal,repCost-5)/ recover_lost(中,prep1,reqCondition=has_lost_city)/ blood_feud(中,prep2,reqCondition=has_feud)/ border_conflict(弱,prep3,reqCondition=adjacent,repCost-3)。

### A2 宣称强度效果 CLAIM_EFFECTS
4 强度查询表(strong/medium/weak/none)。每档 4 字段:repCost(0/0/-3/-12)/ thirdPartyRel(0/0/-3/-10)/ gentryHook(+10/0/-10/-25)/ fac(派系 5 维度)。emperor 状态自动走 strong + 派系全正特殊覆盖。

### A3 称帝派系效果 ENTHRONE_FACTION_EFFECTS
3 身份(warlord/emperor_holder/han_royal)称帝时一次性派系 mod。warlord 称帝最遭忠汉派系反对(汉室死忠-15);han_royal 称帝最温和(+5)。所有档 hawk +3/founding +3/royalty +5。

### A4 纳贡比例 TRIBUTE_RATES (mirror 政治链 A10)
按宗主 stage:warlord 0/0、regional 10%/8%、regime 18%/12%。**用宗主 stage 而非附庸 stage**(大宗主才有"剥削"能力)。Mirror 政治链 A10。**纳贡执行点在经济链 C7 processFacEconomy 7170-7191**,本节点只是常量+查询函数。

### A5 通商协定常量 TRADE_AGR_*
6 常量。COST=500(签约金)/ REL_MIN=50(缔结门槛)/ REL_BREAK=20(自动中断)/ PER_CITY=5(每城每旬金)/ ALLY_MULT=1.2(同盟加成)/ MAX=2(每势力最多 2 协定)。tradepost 加成表 [0,0.10,0.15,0.20]。**互市常量(diploTrade)另**:9 旬 CD / 3 资源(马 800/500、铁 600/400、木 500/350)。

### A6 AI 外交人格 diploAggro (mirror)
曹操 0.65 / 刘备 0.3 / 孙权 0.5 / 南蛮 0.4(v144+v149 调档)。3 处影响 aiDoDiplo:① 宣战概率倍率 ② 无宣称放弃率 ③ 求和阈值。Mirror 武将链/AI 模块。

### A7 称帝门槛
canEnthrone:turn≥24 + 城≥10(华歆 8)+ rep≥40(华歆 30)+ 非附庸。aiConsiderEnthrone 进一步要求 mandate≥30 不称帝(崇汉 AI)+ mandate≥60 大幅降城市优势要求。3 身份基础概率:emperor_holder 0.60 / han_royal 0.40 / warlord 0.80。

### A8 背刺/反复阈值
betray('背信弃义':_brokenAllyTurn 后 ≤6 旬宣战,信誉-20)/ relapse('反复无常':_peaceTurn 后 ≤3 旬宣战,信誉-15)。曹操奸雄技能信誉惩罚减半。

### A9 时长常量
5 个:① 宣称 prepTime 0~3 旬 ② ready 后 12 旬作废 ③ 血仇 60 旬消退 ④ _cityChangeLog 24 旬清理 ⑤ 互市揭雾 expiresAt = G.turn+3。

### A10 AI 节奏 diploOffset/CD
aiDoDiplo 每 3 旬(diploOffset wei=0/shu=1/wu=2/nanman=1)/ aiDoTradeAgreement 每 6 旬(同 offset)/ aiConsiderEnthrone 每 12 旬。**Claude AI 接管时不调 aiDoDiplo**(D-114 根因)。

### A11 外交 CD 常量
3 类:① _diploCD_${a}_${b} 宣战/停战 15 旬,双向写(v179fix P18)② _vassalIndepCD_${fid} 12 旬(无论成败)③ _tradeCD[${fid}_${target}] 9 旬。**注**:_diploCD 单位是"决策回合"非自然旬(D-114 根因)。

---

## B 区 · 实体状态(外交链的所有"持久化数据")

### B1 外交主表 G.diplo[k]
G.diplo['fidA-fidB']:双键真双向(v179fix P16+P18)。每键含 status(neutral/enemy/ally/vassal)+ rel(0~100)+ suzerain(附庸专属)+ 多种时间戳:_warDeclaredTurn(宣战当旬,v123 用于 isHostile 当旬不生效)/ _peaceTurn(停战旬)/ _brokenAllyTurn(解盟旬)/ _betrayal(背刺标记)/ _actedThisTurn(玩家 4 件套本旬已动)。**45 处字段写入散布全代码**。

### B2 宣称池 G.claims
'fid-target': {type, prepTurns, ready, readyTurn}。每势力对每势力同时只能 1 条(startClaimPrep 先 forEach 清同 fid- 前缀的)。ready 后 12 旬未用作废(processClaimPrep)。占用 + 撤销在 applyWarDeclarationEffects 末 delete。

### B3 占城读取池 G._warClaimStrength + G._claimGentryHook
两表平行写入(applyWarDeclarationEffects 15442-15446)。① _warClaimStrength = strength,供占城分档 ② _claimGentryHook = fx.gentryHook(±10/0/±25),供占城豪族读取。**停战时 _applyPeaceAgreement 14067-14068 同时清两表**。

### B4 血仇池 G.feuds
'fid-target' = {reason, turn}。checkBloodFeud 触发条件:① 双方非 rebel ② 死者势力≠杀手势力 ③ 死者必须是 founding 创始派或 _isClanRoyalty 宗亲。processFeudDecay 每旬检查,**60 旬消退**。blood_feud 宣称 reqCondition='has_feud' 读取此表。

### B5 信誉度 G.reputation
wei:45 / shu:80 / wu:60 / nanman:30 起,0~100 范围。**13 处读写**。读取面 5 类(_repPenaltyFactor 阻挠 send / _repGiftMult 送礼打折 / canEnthrone 称帝门槛 / _aiCourtSelect AI 朝议偏好 / 等)。写入面 7 类(applyReputationPenalty / applyWarDeclarationEffects / processReputation / doEnthrone / cancelTradeAgreement / 攻城选择 / 事件 effect)。

### B6 通商协定 + 互市 CD G._tradeAgreements + G._tradeCD
两表分开:① G._tradeAgreements = [{factions:['a','b'], since:turn}],每势力最多 2 协定,_cleanTradeAgreements 每旬清失效(灭国/敌对/rel<20)② G._tradeCD = {fid_target: expiresAtTurn},互市 9 旬 CD,**绝对 turn 模式**(D-114 修法的样板)。

### B7 易主/天子状态 G._cityChangeLog + G.cityHistory + G.emperor
三表协同:① G._cityChangeLog = [{turn, cityId, from, to}],24 旬清理,fac 转主 trackCityLoss 写入(8264/15991/27918)② G.cityHistory = {cityId: {takenBy, fromFac, turn}} 城市历史(收复故土宣称依据)③ G.emperor = {cityId, holder} 天子状态。

### B8 外交 CD 状态字段
3 类 CD 散点写入 G 顶层:① _diploCD_${a}_${b} 宣战/停战 15 旬,双向写(_applyPeaceAgreement / aiDoDiplo / _execDeclareWar)② _vassalIndepCD_${fid} 12 旬 ③ _diploActed_${fid} 玩家附庸入口本旬已行动。**严重 bug:_diploActed_${fid} 永不重置(D-120 HIGH)**。

---

## C 区 · 派生函数(外交链的"计算与操作")

### 查询簇(C1-C5)

#### C1 状态查询簇 getDiploStatus + isHostile
全游戏统一敌对判定。isHostile 多了一条:刚宣战那一旬不算敌对(v123)。**全游戏 170 处调用**。军事链 E3 已审 verified。

#### C2 附庸/盟友查询簇
5 函数:alliedFacs(列 ally+vassal)/ isSuzerain / isVassal / getSuzerain / canSeeFactionData(盟友/附庸完全可见)。

#### C3 战力估算
3 层:① powerIndex 自身全知 ② fogPowerEstimate 盟友/附庸全知,否则按可见部队*1.3 + 已知城市×4000 ③ effectivePowerAgainst 含同盟战力联合(自方+盟友 1.0 倍 / 守方+盟友 0.5 倍折算)。peaceWillingness 主入口。

#### C4 议和意愿 peaceWillingness
powerRatio = sp/(sp+op),will = clamp(0.05~0.90, 0.75 - (powerRatio-0.5)*1.2)。0.5(势均)→ 0.15;0.3(劣势)→ 0.63;0.2(极弱)→ 0.90。**外交核心 0~1 公式**,5 用例。

#### C5 宣称查询 getAvailableClaims + getReadyClaim
按 reqIdentity / reqTarget / reqCondition(has_lost_city/has_feud/adjacent/not_emperor)4 条件过滤。**emperor 状态特殊:所有宣称走强宣称通道**。

### 计算簇(C6-C8)

#### C6 信誉修正/惩罚
3 函数:① _repPenaltyFactor(rep<60 时阻挠 send)② _repGiftMult(rep<60 时送礼打折)③ applyReputationPenalty(betray-20 / relapse-15,曹操奸雄减半)。

#### C7 通商收入 calcTradeAgrIncome
对方城市数 × 5 × ally 1.2 × tradepost(0/+10/+15/+20%)。v179fix P30 索引保护(cap 至最高加成)。被经济链 C7 注入 fac.res.gold。**vassal 状态无 ally 加成**(设计意图:附庸已通过纳贡贡献)。

#### C8 纳贡比例查询 getTributeRates (mirror)
返回 TRIBUTE_RATES[getStage(suzerainFid)]。**Mirror 政治链 C6**,跨链共用。**实际收金粮的执行点在经济链 C7 processFacEconomy 内**。

### 主 tick(C9-C12)

#### C9 processClaimPrep
每旬调,推进宣称 prepTurns,达 prepTime 设 ready=true,ready 后 12 旬作废。

#### C10 processFeudDecay
每旬遍历 G.feuds,turn-feud.turn≥60 则 delete。

#### C11 processReputation
每旬 4 势力遍历。atWar 检查(任一 status='enemy' 视为战中)→ 战时 0.1/旬 / 平时 0.2/旬 自然恢复。曹操奸雄当官×2 / 钟繇楷范当官+0.15。

#### C12 _cleanTradeAgreements
每旬清失效协定:① 灭国 ② enemy 状态 ③ rel<20。**调用早于 checkElimination**,不依赖 _eliminated 标记。

### 玩家入口(C13-C16)

#### C13 玩家 4 件套
① diploGift(3 档 500/1000/2000 → 5/10/18,_repGiftMult+丞相 giftEffect+鲁肃 1.5x+诸葛瑾 +5)② diploArmistice(1000 金,acceptRate=peaceWillingness-rep+邓芝 0.05,成功走 _applyPeaceAgreement)③ diploAlly(500 金,需 rel≥75,acceptRate=*0.6)④ diploWar(只能从 neutral,设 enemy + addDiplo -20,触 applyWarDeclarationEffects + _syncAllyWarStatus)。**玩家路径无 _diploCD 写入(D-092)**。

#### C14 玩家解盟 diploBreakAlliance
仅 ally → neutral。无金成本,addDiplo **-20** 双向,设 _brokenAllyTurn(为后续 6 旬背刺检测留印)。

#### C15 玩家附庸 4 入口
① diploDemandVassal(我当宗主要求称臣)② diploSubmitVassal(我当附庸主动投靠)③ requestVassalIndependence(附庸求独立,12 旬 CD)④ playerReleaseVassal(玩家宗主主动放附庸)。⚠ **全 4 函数硬编 G.playerFac**(D-091 _exec 错配根因 + D-120 _diploActed 永不重置)。

#### C16 玩家其他入口簇
5 入口杂项:① startClaimPrepUI ② playerEnthrone(confirm 弹窗 → doEnthrone)③ diploTradeAgreement(5 校验 + push G._tradeAgreements + addDiplo +5)④ cancelTradeAgreement(splice + addDiplo -8 + reputation -3)⑤ diploTrade(互市,9 旬 CD,3 资源,addDiplo +2,副产 scoutReveals 揭雾 3 旬)。

### AI/helper/hub(C17-C20)

#### C17 AI 主入口
① aiDoDiplo:每 3 旬调,3 状态分支(neutral 评估宣战 / enemy 评估求和 / vassal 不动)。宣战分支含 v152 strategyBoost+eDistBoost,relThreshold 30→45 if 有 readyClaim;无宣称按 rep+shameFactor 决定。求和走 peaceThreshold = 0.80 + (diploAggro-0.5)*0.30 + stratPeaceBonus。**玩家介入则 _pendingPeaceOffer 推迟 mutation(v179fix P15c)**。② aiDoTradeAgreement:每 6 旬,30% 概率,选最大对方城市数候选。③ aiConsiderEnthrone:每 12 旬,3 身份概率,mandate 修正。

#### C18 附庸 helper
v144 统一附庸入口:① _resolveVassalDiploConflicts:遍历第三方 4 处理(附庸旧同盟 → 中立 / 附庸的子附庸 → 解放 / 附庸 enemy 而宗主 neutral → 强制停战 / 宗主 enemy 而附庸 neutral → 跟随宣战)② _setVassalStatus:先调 1,再设双向 status='vassal'+suzerain+rel max(35)。所有附庸入口必走此 helper。⚠ **D-113 强制停战分支漏 _applyPeaceAgreement → 部队卡 siege**。

#### C19 停战/盟友联动 helper
4 helper 簇:① _applyPeaceAgreement(v179fix P15c 停战统一入口,4 路径合一)② _clearSiegeOnPeace(停战清部队 siege + 城市 siegeDecay)③ _diploActed/_diploMarkActed(玩家 4 件套本旬已动校验,硬编 G.playerFac)④ _syncAllyWarStatus(宣战时盟友联动)。**verified ✓**

#### C20 宣战副作用 hub + 称帝 + 易主
外交链最大 hub,7 函数簇:① applyWarDeclarationEffects(宣战 4 大副作用:信誉±+第三方 rel + gentryHook 写 B3 + claim 强度写 B3 + 派系 fac mod 走 _applyClaimFactionEffects + 价值观 ethosShock + delete G.claims。emperor 状态特殊路径)② _applyClaimFactionEffects(遍历 generals 按 6 派系写 G.genFactionMod,**跳过 ruler**)③ startClaimPrep(prep 0 直 ready,否则计时)④ doEnthrone(称帝 5 件事)⑤ checkBloodFeud(founding/宗亲被杀 → G.feuds[k])⑥ trackCityLoss(写 G.cityHistory)⑦ checkEmperorCapture(天子城被夺 → G.emperor.holder + FAC_IDENTITY type 切换)。3 调用入口(_triggerMajorRebellion / 攻陷 主路径 / 攻陷 _triggerGentryBetray)。

---

## D 区 · 状态出口(对应运行时的 5 大产出簇)

### D1 宣战簇
3 入口(diploWar / aiDoDiplo / _execDeclareWar)汇聚到 applyWarDeclarationEffects。同时碰 5 件事:status=enemy + reputation ± + 第三方 rel + 占城豪族 hook + 派系 fac mod + ethosShock。delete G.claims。

### D2 停战 / 解盟簇
两条出口:① 停战(_applyPeaceAgreement,4 路径合一)② 解盟(diploBreakAlliance / _execBreakAlliance)。停战要清的事很多(siege/宣称池/CD/事件);解盟简单,只改状态标个时间戳让 6 旬内宣战会被认定背刺。

### D3 附庸生命周期簇
4 路径 → _setVassalStatus 统一入口:玩家 demand/submit + AI 极弱投靠 + acceptVassalOffer + 解除附庸(requestVassalIndependence/playerReleaseVassal/checkDiplo 自动脱离)。每入口写 status=vassal/neutral + suzerain,触 _resolveVassalDiploConflicts 4 类冲突解决,经济链 C7 纳贡 +0.2 维系。

### D4 称帝 / 天子易主簇
2 出口:① doEnthrone+playerEnthrone+aiConsiderEnthrone → FAC_IDENTITY[fid].type='emperor' + 信誉+10 + 第三方 rel -15(-25 if 对 emperor) + 派系 mod + 全势力 ethosShock(mandate +12)+ 自身 mandate +28 + triggerFactionEvent('warDeclare') 全势力激活鹰派 ② checkEmperorCapture → G.emperor.holder + 旧 emperor_holder 降级 + 新 emperor_holder 升级。

### D5 通商协定簇
4 入口:① diploTradeAgreement(玩家)/ aiDoTradeAgreement → push G._tradeAgreements + 扣 500 金 + addDiplo +5 ② cancelTradeAgreement(玩家)→ splice + addDiplo -8 + reputation -3 ③ _cleanTradeAgreements 每旬清失效 ④ calcTradeAgrIncome 每旬被经济链读取注入 fac.res.gold。

---

## E 区 · 跨链(7 个跨链节点)

### E1 外交→经济
5 输出:① 通商协定收入 calcTradeAgrIncome → 经济链 C7 注入 fac.res.gold ② 纳贡 getTributeRates → 经济链 C7 7170-7191 转金粮 ③ 送礼/停战/结盟成本 → fac.res.gold 直扣 ④ 通商签约金 500 直扣 ⑤ 互市买马/铁/木 800/600/500 金购入。

### E2 外交→军事
2 输出:① isHostile **170 处调用**,军事链 E3 verified-with-notes 已审 ② _clearSiegeOnPeace → 停战时清部队 status=halt+siegeTarget=null+清城市 siegeDecay。

### E3 外交→武将
4 输出:① poachGen 写 G.diplo -15 双向(v149fix+v179fix P16 已修)② blood_feud 宣称读 G.feuds(reqCondition='has_feud')③ 派系 fac mod:_applyClaimFactionEffects 写 G.genFactionMod ±(汉室死忠/士族/hawk/dove/founding/royalty 6 维度)④ triggerFactionEvent 6 类('betray'/'truce'/'warDeclare' 称帝时全势力)。

### E4 外交↔豪族
1 出 + 1 mirror:① 出:_claimGentryHook 写 B3 → 占城时 _aggregateGentry 15738 读 → city.gentry +base hook(+10/0/-10/-25 按强度)② mirror:TRIBUTE_RATES = 政治链 A10 同表(豪族链与政治链已对账)。

### E5 外交→政治 (单向 mirror)
1 mirror:TRIBUTE_RATES = 政治链 A10 同表(由本链 owner 函数 getTributeRates,经济链 C7 共调,政治链 A10 mirror)。**外交链不反向影响政治链字段**。

### E6 外交→价值观 (待审)
applyEthosShock 6 类:① 主动宣战 strategy+6 自身 ② 强宣称 mandate-5 / 弱宣称 mandate+3 / 无宣称 mandate+4 ③ 称帝自身 mandate+28 ④ 全势力被'有人称帝'冲击 mandate+12 ⑤ truce 事件鸽派 +3 鹰派 -2 双方 ⑥ ethosDistance 影响 aiDoDiplo aggrWill +0.10。**待价值观链 audit 时本节点作入边对账**。

### E7 Claude AI v158+ 9 _exec 外交簇
9 _exec(_execOneAction 派发器 37214-37222):_execDeclareWar / _execProposeAlliance / _execBreakAlliance / _execDiploGift / _execDiploArmistice / _execStartClaim / _execDemandVassal / _execSubmitVassal / _execReleaseVassal。⚠ **后 3 个传 (fid,target) 但玩家函数 (other) 单参 → AI 操作变玩家被要求**(D-091 HIGH 严重 bug)。⚠ **派发器漏 _execEnthrone**(D-100)。⚠ **prompt 缺 4 指令**(D-099)。

---

# 外交链 v1.1 — Step 3 6 阶段 audit pass 1 完成

> **v1.1 不是 v1.0 重做**,是 Step 3 阶段 1-6 完整审计后的标定升级。51 节点 audit.status 全更新,31 D 类全部定性。

---

## v1.1 终态摘要

**节点状态分布**(51 节点):
- verified 23 / verified-mirror 12 / verified-with-notes 5 / verified-with-findings 4 / discrepancy 6 / pending 1(E6 价值观链)

**D 类全集**(31 个,D-091~D-120,D-098 取消,D-117 拆 a/b/c):
| 严重度 | 数量 | 编号 |
|---|---|---|
| HIGH | 5 | D-091 / D-104 / D-113 / D-117c / D-120 |
| MEDIUM | 13 | D-092~D-096 / D-099 / D-105 / D-107 / D-109 / D-115 / D-117a / D-118 |
| LOW | 13 | D-097 / D-100~D-103 / D-108 / D-110~D-112 / D-114 / D-116 / D-117b / D-119 |

**verdict 分布**:
- **fix 19**:D-091 / D-092 / D-093 / D-094 / D-095 / D-096 / D-099 / D-100 / D-104 / D-105 / D-107 / D-109 / D-113 / D-114 / D-115 / D-117a / D-117c / D-118 / D-120
- **defer 4**:D-097 / D-101 / D-108 / D-110
- **no-fix 7**:D-102 / D-103 / D-106 / D-111 / D-112 / D-116 / D-117b
- **verified-with-notes 1**:D-119

---

## v1.1 Step 3 阶段执行结果

### 阶段 1.1 — E7 Claude AI 9 _exec 完整对账(11 D 类)

发现 11 个 D 类 + prompt/派发器各 1 漏:

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-091** | HIGH | fix | **3 处 _exec 附庸函数错配传参**:_execDemandVassal/SubmitVassal/ReleaseVassal 调用玩家函数 (fid, target) 双参,但玩家函数 (other) 单参且硬编 G.playerFac → AI 操作变成玩家被要求 |
| D-092 | MEDIUM | fix | 玩家 diploWar 不写 _diploCD → 玩家可一旬连战多势力 |
| D-093 | MEDIUM | fix | 三入口宣战数值不一致(-20/-15/-15),统一 -15 |
| D-094 | MEDIUM | fix | _execDeclareWar 漏 triggerFactionEvent('betray') |
| D-095 | MEDIUM | fix | aiDoDiplo+_execDeclareWar 重复调 ethosShock,strategy +12 而非 +6 |
| D-096 | MEDIUM | fix | _execProposeAlliance 失败漏 _diploMarkActed |
| D-097 | LOW | defer | _execDiploArmistice 失败漏诸葛瑾 _hjFail |
| **D-099** | MEDIUM | fix | **prompt 缺 4 外交指令**(armistice/demand/submit/release_vassal),Claude AI dead code |
| **D-100** | LOW | fix | **派发器漏 enthrone case**,Claude AI 想称帝指令被吞 |
| D-101 | LOW | defer | _execStartClaim 缺资格校验 |
| D-102 | LOW | no-fix | aiDoTradeAgreement 30% 概率门槛(防 AI 开局齐刷) |
| D-103 | LOW | no-fix | cancelTradeAgreement 仅玩家路径 |

### 阶段 1.2 — 玩家 4 件套 vs aiDoDiplo vs _exec 横向一致性(9 D 类)

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-104** | HIGH | fix | **_pendingVassalOffer 状态先写后弹窗**:aiDoDiplo 极弱投靠 14578 直 _setVassalStatus,弹窗"拒绝"按钮(rejectVassalOffer)只 -10 rel 不 rollback。**与 v179fix P15c 求和路径同模式但未修复** |
| D-105 | MEDIUM | fix | AI 求和零金成本,玩家/Claude 都付 1000 金,统一加 1000 金校验 |
| D-106 | MEDIUM | no-fix | AI 求和需双方意愿(避免单方乞和) |
| D-107 | MEDIUM | fix | _execProposeAlliance 成功漏 triggerFactionEvent('truce') |
| D-108 | LOW | defer | _execProposeAlliance 失败退 250 金 |
| D-109 | MEDIUM | fix | 解盟数值 -20 vs -10 不一致,统一 -20 |
| D-110 | LOW | defer | _execBreakAlliance 漏 _diploMarkActed |
| D-111 | LOW | no-fix | _diploActed 硬编 G.playerFac(架构债) |
| D-112 | LOW | no-fix | 玩家 SKILL_INLINE 路径专属(6 处武将技能) |

### 阶段 2 — helper / hub 完整性(1 D 类)

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-113** | HIGH | fix | **_resolveVassalDiploConflicts 强制停战漏 _applyPeaceAgreement**:附庸跟随宗主停战时,围攻第三方城市的部队不会清 siege,**与 v179fix P15c 同模式平行 bug** |

C19 _applyPeaceAgreement 主体 verified ✓(v179fix P15c 完整闭合)。
C20 hub 主体 verified-with-findings(applyWarDeclarationEffects medium 档无 mandate mod 是设计意图)。

### 阶段 3 — 边界 case(1 D 类)

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-114** | LOW | fix | **Claude AI 接管时 _diploCD 永不递减**:aiDoDiplo 不调用 → CD 永不衰减 → 该势力对同一目标永久只能宣战 1 次。修法:改 _diploCD 为绝对 turn 模式(与 _vassalIndepCD/_tradeCD 统一) |

9 边界 case 全 verified/verified-with-notes:han_royal 持天子失 restore_han 资格 / emperor_holder 唯一性 / checkElimination 清理不彻底无害 / reputation 13 处单边 clamp / _diploCD 决策回合单位 / 等。

### 阶段 4 — 散点扫描(7 D 类)

10 状态字段 ~250 处读写,**外交链是散点最不干净的**(对比政治链 1 LOW)。

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| D-115 | MEDIUM | fix | 斩使立威漏 4 项宣战副作用(_diploCD/_syncAllyWarStatus/背刺反复检测/triggerFactionEvent 'betray') |
| D-116 | LOW | no-fix | 驱虎吞狼计谋路径漏 applyWarDeclarationEffects(被挑唆非主动设计意图) |
| D-117a | MEDIUM | fix | checkDiplo 自动结盟漏 truce 事件 |
| D-117b | LOW | no-fix | checkDiplo 自动解盟漏 _brokenAllyTurn(自然解盟非背信合理) |
| **D-117c** | HIGH | fix | **checkDiplo 自动宣战(rel≤10)漏全套副作用**(applyWarDeclarationEffects/_syncAllyWarStatus/_diploCD/背刺反复检测/ethosShock) |
| D-118 | MEDIUM | fix | 中立战斗 de facto 宣战漏 _warDeclaredTurn / applyWarDeclarationEffects / _diploCD |
| D-119 | LOW | verified-with-notes | _triggerMajorRebellion 大乱漏 trackCityLoss(rebel 不参与外交无害) |
| **D-120** | HIGH | fix | **G._diploActed_${fid} 永不重置**:nextTurn 16347 只重置 G.diplo[k]._actedThisTurn 不重置顶层字段 → 玩家附庸 3 入口整局各只能用 1 次 |

### 阶段 5 — 节点级模糊(0 新发现)

剩余 23 节点(C1-C12 + D1-D5 + E1-E6)逐一 verified/verified-mirror/verified-with-notes。**D-101 误报澄清**(getAvailableClaims 4 reqCondition 全校验,但 _execStartClaim 不调用它,defer 仍成立)。

### 阶段 6 — 整体校验 + 补 16 边

51 节点全部 audit.status 标定。补 16 边(C20→B3/B7 + C13→B8 + C17→B8 + C19→B8 + E7→B8 + C15→B8 + C16→B6 + B1→C14 + C7→E1 + C8→E1 + D3→E1+E3 + A4→E5 + C13→E7 + 等)修复连通性,边总数 102→118。

---

## v1.1 设计巧思汇总(外交链特有)

### 1. v179fix P15c 停战统一入口模式
4 路径(玩家接受/玩家发起/aiDoDiplo/_execDiploArmistice)全走 `_applyPeaceAgreement`。模式:**玩家介入时只设 _pendingPeaceOffer 推迟 mutation,等玩家选择再触发**。这避免漏副作用(_diploCD/清 siege/清宣称池/truce 事件)。

**审计中发现 3 处平行 bug 未修复**(同模式但未应用):
- D-104 附庸投靠路径(aiDoDiplo 14578 直 _setVassalStatus)
- D-113 _resolveVassalDiploConflicts 强制停战(14750-14752 直 set status)
- D-117c checkDiplo 自动宣战(rel≤10 直 set enemy)

3 个 HIGH 全是 v179fix P15c 模式的"未推广"产物。

### 2. 双键真双向(v179fix P16/P18)
G.diplo['A-B'] 和 G.diplo['B-A'] 是两个独立 key。`addDiplo` 已 helper 化保证双向同步。**poachGen 8089 + 13950 都已 v149fix+v179fix 修复**(原单向写,反向 key 不更新会让对方下旬读到旧 rel)。

### 3. isHostile 当旬不生效(v123)
宣战当旬 `_warDeclaredTurn = G.turn`,`isHostile` 检测 `declTurn>=G.turn` 返回 false → 守方有 1 旬反应时间。**这条规则被战斗 30063/checkDiplo 16250/斩使 9648 等多处自动 enemy 路径漏写**(D-117c/D-118 含此问题)。

### 4. 宣称强度 4 维联动
strong/medium/weak/none 4 档同时影响:
- 自身信誉(0/0/-3/-12)
- 第三方 rel(0/0/-3/-10)
- 占城豪族支持(+10/0/-10/-25)
- 派系 fac mod(汉室死忠/士族/hawk/dove/founding 5 维)
- 价值观 mandate(strong-5/medium 0/weak+3/none+4)

**强宣称是"白费"代价**(信誉零损 + 占城豪族支持 + 派系正反应),**裸宣战代价惨重**(信誉-12 + 第三方-10 + 豪族-25)。

### 5. emperor 状态外交特权
`FAC_IDENTITY[fid].type === 'emperor'` 时:
- applyWarDeclarationEffects 自动走强宣称(无视 claimType)
- 派系 fac mod 全正(汉室死忠+2/士族+1/hawk+3/founding+1/royalty+2)
- 宣战对第三方无 rel 影响(strong 档 thirdPartyRel=0)

### 6. _diploCD 单位是决策回合非自然旬
aiDoDiplo 14483 内递减,每 3 旬调用 → CD=15 实际 ~45 自然旬。**Claude AI 接管时不调 aiDoDiplo → CD 永不递减(D-114)**。修法:改绝对 turn 模式(与 _vassalIndepCD/_tradeCD 统一)。

### 7. 附庸纳贡 vs 通商协定 ally 加成
通商协定 ally 状态有 1.2x 加成,**vassal 状态无**(C7 calcTradeAgrIncome)。设计意图:附庸已通过纳贡贡献,通商不再叠加。

### 8. 称帝是不可逆事件
doEnthrone 一次性效果:
- FAC_IDENTITY[fid].type='emperor'(永久)
- 信誉+10 / 自身 mandate +28
- 第三方 rel -15(对其他 emperor -25)
- ENTHRONE_FACTION_EFFECTS 派系 mod
- **全游戏其他势力 mandate +12**(汉室正统性崩塌)
- triggerFactionEvent('warDeclare') 全势力激活鹰派
- G.emperor=null(挟天子概念消亡)

### 9. 跟随宣战 vs 主动宣战
**附庸跟随宗主宣战(_resolveVassalDiploConflicts 3b)不付主动宣战代价**:无信誉惩罚 / 无第三方关系恶化 / 无派系冲击 / 无 ethosShock。设计意图:跟随是被动行为。**审计 verified-with-notes**(虽有"白手套"漏洞嫌疑,但符合附庸语义)。

### 10. 自然解盟非背信
`checkDiplo` 16247 ally.rel<30 自动 neutral,**不设 _brokenAllyTurn**(D-117b)。设计意图:自然解盟是关系自然恶化,非背信。**与玩家主动 diploBreakAlliance 14316 设 _brokenAllyTurn 区别对待**。

---

## v1.1 跨链对账(与已审 5 链 + 价值观链 pending)

### 与经济链 v4.3 ✓
- E1 外交→经济(5 类输出)
- C7 calcTradeAgrIncome → 经济链 C7 processFacEconomy 注入 fac.res.gold
- C8 getTributeRates → 经济链 C7 7170-7191 转金粮
- 玩家 4 件套 + 通商签约金 + 互市 → fac.res.gold 直扣

**verified-mirror**:外交链与经济链交界面 5 类全 verified。

### 与军事链 v1.1 ✓
- E2 isHostile **170 处调用**(军事链 E3 verified-with-notes 已审)
- _clearSiegeOnPeace 停战时清 siege 部队(已 v179fix 注入 3 处停战入口)

**verified-mirror**:E2 与军事链 E3 互证。

### 与武将链 v1.2 ✓
- E3 4 输出
  - poachGen 写 G.diplo -15 双向(v149fix + v179fix P16 已修)
  - blood_feud 宣称读 G.feuds(创始/宗亲被杀触发)
  - _applyClaimFactionEffects 写 G.genFactionMod(6 派系维度)
  - triggerFactionEvent 6 类('betray'/'truce'/'warDeclare')

**verified-mirror**:E3 与武将链 v1.2 入边对齐。

### 与豪族链 v4 ✓
- E4 双向耦合
  - 出:_claimGentryHook 写 → 占城时 _aggregateGentry 读 → city.gentry +base hook
  - mirror:TRIBUTE_RATES = 政治链 A10 同表

**verified-mirror**:E4 与豪族链 v4 已对账。

### 与政治链 v1.1 ✓
- E5 单向 mirror
  - TRIBUTE_RATES = 政治链 A10 同表,getTributeRates owner 在外交链 C8
  - 经济链 C7 共调

**verified-mirror**:与政治链 A10 mirror 已对账。

### 与价值观链(待审)mirror
- E6 ethosShock 6 类(strategy/mandate 多维度)
- 价值观链 audit 时本节点作入边对账参考

**pending**:E6 节点保留 pending 状态,等价值观链 audit 时闭合。

---

## v1.1 与已审 5 链严重度对比

| 链 | D 类总数 | HIGH | MEDIUM | LOW | 节点 | 边 | audit 阶段 |
|---|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | ~95 | 全 verified |
| 豪族链 v4 | 12 | - | - | - | ~37 | ? | 早期 |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | ? | Step 3 全过 |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | ? | Step 3 + v1.2 增量 |
| 政治链 v1.1 | 15 | 3 | 5 | 7 | 45 | 90 | Step 3 全过 |
| **外交链 v1.1** | **31** | **5** | **13** | **13** | **51** | **118** | **Step 3 全过** |

**外交链特点**:
- D 类总数最多(31 vs 政治链 15 / 军事链 23 / 武将链 30)— 状态字段多 + 入口分散 + Claude AI 路径多 _exec
- HIGH 5 居中(武将链 10 / 军事链 6 居首,外交链第三)
- D 类高度集中在 4 处:**C15 玩家附庸入口(4 D 类)+ C17 aiDoDiplo(3 D 类)+ E7 Claude AI(11 D 类)+ B8/B1 状态字段散点(7 D 类)= 25/31 = 81% 集中度**
- HIGH 全部源于"未走 helper 的状态先写"模式:D-091(_exec 错配) / D-104(附庸先写后弹窗)/ D-113(强制停战漏 helper)同源 v179fix P15c 平行 bug 系列;D-117c / D-120 是新模式
- 散点扫描特别**不干净**(7 D 类),对比政治链 1 LOW — 状态字段多 + 自动转换路径(checkDiplo)+ 战斗 de facto 宣战(30063)+ 斩使 / 计谋等多处绕开 hub

---

## v1.1 工作流方法论沉淀(基于 6 链 audit)

继承 §二〇九.11 / §二一〇.8 / §二一一.11 / §二一二.10 方法论,本轮新发现:

### 1. v179fix P15c 模式的"推广不彻底"D 类
v179fix P15c 重做了 4 个停战路径合一 _applyPeaceAgreement,但**附庸路径(D-104)/ 强制停战(D-113)/ 自动宣战(D-117c)未应用同模式**。

**规律**:制作人重做 helper 时,容易**只覆盖最频繁路径**,边缘路径(附庸/自动转换/事件触发等)被遗漏。代码 sprint 时应用同模式 fix。

### 2. 玩家函数硬编 G.playerFac 是跨链 D 类温床
外交链 4 函数(diploDemandVassal/diploSubmitVassal/playerReleaseVassal/_diploActed)硬编 G.playerFac,_exec 路径接驳时**错配传参**(D-091 HIGH)。**政治链 D-078 _execSetTax 同源问题**(setTax 写死 G.playerFac)。

**规律**:玩家函数应**统一参数化 fid**,_exec 改 thin wrapper。这是重构 sprint 的统一目标。

### 3. 散点扫描 vs hub 完整性的链路特性
外交链 31 D 类中 hub(C20)主体只 verified-with-findings(0 fix),但散点(B1 字段写入 45 处)+ 自动转换(checkDiplo)+ 战斗 de facto(30063)+ 计谋(stratDriveWolf)+ 事件(斩使)等**hub 外旁路 7 D 类**(D-115~D-120 系列)。

**规律**:外交链状态机分散度高(每对势力独立),hub 集中后**周边代码绕开 hub 写状态**容易漏副作用。**审计应同等关注 hub 外旁路**。

### 4. Claude AI prompt 缺指令是隐形 dead code 源
D-099 prompt 缺 4 外交指令:diplo_armistice / diplo_demand_vassal / diplo_submit_vassal / diplo_release_vassal。_exec 实装但 Claude AI 不知道有 → dead code。

**规律**:**实装 _exec 后必须更新 prompt**,否则 Claude AI 永远不会调用。可建立 _exec ↔ prompt 一致性检查工具。

### 5. CD 单位混乱(决策回合 vs 自然旬)
_diploCD 在 aiDoDiplo 内递减,每 3 旬递减 1 → CD=15 实际 ~45 自然旬。Claude AI 接管时不调 aiDoDiplo → CD 永不衰减(D-114)。**_vassalIndepCD/_tradeCD 用绝对 turn 模式正确**。

**规律**:CD 应统一**绝对 turn 模式**(`G[cdKey] = G.turn + N` + 检查 `if G[cdKey] > G.turn`),避免依赖递减时机。代码 sprint 时统一改造。

### 6. 顶层 G._fieldName_${fid} 字段无重置易漏
D-120 G._diploActed_${fid} 永不重置,只在 G.diplo[k]._actedThisTurn 内重置(B1 字段)。两套机制混用是历史包袱。

**规律**:**散点写入 G 顶层的"本旬"标记字段必须有显式重置点**。审计应专扫 `G[\`_${name}_${fid}\`] = ` 模式。

---

## v1.1 不做的事(再次重申)

- ❌ 不动游戏代码(包括 31 个外交链 D 类的 19 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节(本节追加)
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

代码 sprint 时机:等所有链 audit 完成后开(剩余 **事件链 / 价值观链** 2 条)。

---

## 下个对话指引(事件链 audit 启动 / 价值观链 audit 启动 二选一)

**继承的素材**:
- 外交链 v1.1 三件套(JSON / 概念图 v6.2 / walkthrough)
- 31 个外交链 D 类全部定性,不重审
- 6 链工作流方法论
- **D 类清单累计 82 + 31 = 113 个跨链 D 类**(后续链 audit 时对账用)

**新对话启动**:外交链 audit 完成,下一条建议链:
- **价值观链**:外交链 E6 已 pending,优先审完闭合 mirror
- **事件链**:9648 斩使、_triggerMajorRebellion 8255、_triggerGentryBetray 15981 等都是事件链入口,与外交链 D-115/D-119 需要 audit 时对账

**Step 1 反向 grep 分组建议**(价值观链特性):
1. 主 tick:processFacEthos / _applyEthosDrift
2. 派生入口:applyEthosShock / triggerFactionEvent 6 类(betray/truce/warDeclare/appointPost/removePost/defectorPrefect)
3. 状态读写:G.factions[fid].ethos.{strategy/mandate/civil/military/...}
4. 常量:ETHOS_DIMS / ETHOS_DRIFT 阈值 / 漂移基准
5. 跨链入边:外交链 E6(本链 audit 时闭合)/ 政治链朝议 ethosShock / 武将链 / 军事链
6. 跨链出边:_repPenaltyFactor 信誉影响 / TAX 重税触 strategy drift / aiDoDiplo aggrWill 修正 / canEnthrone mandate≥30 / aiConsiderEnthrone mandate≥60 / 等
