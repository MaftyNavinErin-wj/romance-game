# 政治链 · 大白话说明(对图 audit 用)

> 配套使用:`Project_Romance_Concept_Map_v6_political.html`(默认打开「政治链 v1.0」tab)
> 用法:对着图上的节点 ID(A1 / B3 / C8 / D2 / E7 等),在这份文档里找对应段落
> 这份文档**只讲逻辑和设计意图**,不抠数值(数值看节点 desc 或代码)

---

## v1.0 版本说明

政治链 v1.0 是 audit pass 1 的 Step 1 反向 grep + Step 2 节点骨架版本,沿用经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 命名同代。基于 Step 1 反向 grep 收齐 **45 节点 / 90 边**,所有节点 audit.status='pending',待 Step 3 6 阶段逐节点深审。

按制作人定的:
- **分区方案**:5 区方案 C(A 输入 / B 状态 / C 派生 / D 出口 / E 跨链)
- **节点颗粒度 A**(与经济链/军事链/武将链/豪族链对齐)
- **Q 决策**:Q2 太守独立(C9) / Q3 月费扣款单立(C2) / Q4 三大政策 SET 簇合并(C11) / Q5 Claude AI 政治 _exec 单立(E7)
- **K 决策**:K1 clearAllPostsByGen 并入 C8 / K2 5 个 _exec 全并入 E7 / K3 朝议簇 D2 与任命变更 D1 分立 / K4 processStageEvolution 不单立(只作 E6 上游)

---

## 系统总览(30 秒读完)

政治链是游戏的"势力级官僚体系"——决定**势力的官职/政策/朝议怎么运行**。比武将链略简单(45 vs 51 节点),但**跨链辐射比经济链宽**(7 个 E 节点 vs 经济链 11)。

它有 **4 个核心机制** + **3 大产出簇**:

**4 个核心机制**:
- **官职机制**:tier1/2/3 三级 22 职 + buff 11 key + 月费;城市数+stage 决定名额
- **太守机制**:1 城 1 太守,影响腐败/民心/建设;独立于官职树
- **军师机制**:1 势力 1 军师,影响计谋成功率
- **朝议机制**:每季度首旬触发,4-8 提案 → 玩家 4 选 2(或动态)/AI 评分选 2 → decree 3 旬 → 9 buff key

**3 大产出簇**:
- **任命变更簇 D1**:任命/罢免/换太守/换军师 → 武将忠诚 ± + 派系事件 + ethosShock
- **朝议簇 D2**:每季度 → decree + 派系修正 + clan_base loyalty + ethosShock(4 跨链 hook 同时)
- **月费扣款簇 D3**:每旬 → 国库扣金 + 欠饷状态(欠饷再蔓延到补员/裁军/忠诚)

**输入因子**(A 区)10 种:官职常量 4(POST_TIERS/STAGE/MIL/CIV)、政策常量 3(TAX/POLICY/CORVEE)、朝议提案 1、腐败常量 1、纳贡常量 1。

**派生函数**(C 区)16 个,4 组:
1. 数值计算:C1 calcPostBuffs / C2 calcPostSalary / C3 calcCityCorruption / C4 getCourtDecreeBuffs
2. 名额查询:C5 getPostSlots / C6 getTributeRates
3. 任命操作:C7 appointGenPost / C8 dismiss+clearAll / C9 太守簇 / C10 setStrategist / C11 三大政策 set 簇
4. 朝议生命周期:C12 提案生成 / C13 应用决议 / C14 AI 选 / C15 主入口+清过期 / C16 失城裁官

**状态出口**(D 区)4 种:D1 任命变更 / D2 朝议 / D3 月费扣款 / D4 政策切换。

**外部输入 / 跨链**(E 区)7 种:E1 经济(8 类输出最广)/ E2 军事(4 mil-key)/ E3 武将(忠诚+派系事件+派系修正)/ E4 豪族(双向)/ E5 价值观(6+ ethosShock)/ E6 阶段(getStage 入边)/ E7 Claude AI(5 _exec,缺 2 个)。

---

## 主流程(每旬政治链相关跑什么)

每旬 `nextTurn` 内**政治链相关步骤**按顺序:

1. **预计算 _postBuffs**(16350-16356) — 全 4 势力 calcPostBuffs + getCourtDecreeBuffs 合并写入缓存
2. **processFacEconomy**(7140-) — 月费扣款(7156)、附庸纳贡(7173)
3. **processUnitSalary**(22526) — 读 _postBuffs.upkeep 算军饷 → 写 _salaryDebt(经济链 C8 主体)
4. **generals 主循环**(16470-16482) — 太守/军师/官职 addMerit + addStatExp;**checkPostDowngrade**(16481)失城裁官
5. **每 9 旬触发朝议**(16540) — `triggerCourtCouncil`:先清过期 decree → 4 势力遍历(玩家弹窗 / AI 评分选 2 → 应用决议 → 4 跨链 hook)

**最关键的设计意图**:

- **官职 vs 太守 vs 军师是 3 套并行系统**:官职是中央行政,太守是地方行政,军师是势力级唯一战略顾问。三者数值不一致(+8/-3 / +8/-3 / +5/-2),需 Step 3 时与制作人对齐
- **decree 短而激烈**:朝议 9 旬一次,decree 只 3 旬有效。每季度只有前 1/3 时间有 buff,后 2/3 时间空窗
- **腐败是设计制衡**:大势力扩张时,腐败会吃掉 30% 金产上限,要靠太守政治 + 豪族支持 + 整肃吏治 decree 三管齐下
- **政治链对经济链辐射极广**:_postBuffs 7 key + decree 9 key + 月费 + 纳贡 + TAX/POLICY/CORVEE 3 政策 = 经济链多个 tick 都被政治链调控
- **Claude AI 政治覆盖不全**:5/7 _exec 实装,缺 setPolicy/setCorvee。这是 v158+ 的耦合断点

---

## A 区 · 输入因子(决定政治链的"规则参数")

A 区所有节点都在回答一个问题:**这条规则的常量值是什么**?

### A1 官职规模 POST_TIERS
4 档城市数(王/公/侯/诸侯)→ tier3/tier2 名额。1 城以下默认诸侯档。v181 拆耦合后只管 tier3/tier2。

### A2 阶段官职约束 STAGE_TIER1_SLOTS+CAP+FLOOR
v181 三常量合并。STAGE_TIER1_SLOTS 决定 tier1 名额(只 regime={1,1});STAGE_LABEL_CAP/FLOOR 决定 label 上下限(warlord 至诸侯/regional 侯-公/regime 侯-王)。

### A3 武官定义 MIL_POSTS
11 武官:大将军(t1)+ 4 将军(t2)+ 6 三品。每职带 buff(recruitCost/reinforce/upkeep/foodCost/expGain),buffStat='com'。

### A4 文官定义 CIV_POSTS
11 文官:丞相(t1)+ 4 卿(t2)+ 6 三品。buff(goldProd/foodProd/morale/buildSpeed/stratRate/giftEffect),buffStat='pol'。

### A5 税收常量 TAX
5 档(none/low/norm/heavy/harsh),每档 goldM(乘金产)/moraleMod(每旬叠民心)/popMod(每旬叠人口质量)。重税以上还触发价值观 strategy drift。

### A6 补员政策常量 POLICY
3 档(aggr/bal/elit),决定 front(就地新兵)/rear(后方精兵)比例。Claude AI 不能切。

### A7 徭役常量 CORVEE(v163 引入)
3 档(low/mid/high),只对在建项目的城市生效。Claude AI 不能切。

### A8 朝议提案常量 COURT_PROPOSALS
8 提案合并:4 武(征兵/扩军/充员/军防)+ 4 文(劝农/兴商/安民/招贤)。每提案带 baseVal,实际生效值由提案者属性 +0.1%/点(>70 时)缩放,封顶 +5%。

### A9 腐败常量 CORRUPT(v148 引入)
4 常量合并:_PER_CITY=0.02 / _FREE_CITIES=3 / _CAP=0.30 / _GENTRY_MAP 5 档。仅服务 calcCityCorruption。

### A10 附庸纳贡常量 TRIBUTE_RATES(v181 #5 引入)
按宗主 stage 决定纳贡比例:warlord 0/0、regional 10%/8%、regime 18%/12%。不是按附庸的 stage。

---

## B 区 · 实体状态(政治链的所有"持久化数据")

B 区所有节点都是 G.* 上的字段,运行时被 C 区函数读写。

### B1 三大政策状态
G.factions[fid].taxId / .policyId / .corveeId。3 个枚举字段。

### B2 军师状态
G.factions[fid].strategist。武将名 / null。势力唯一职位,不像太守每城一个。

### B3 官职 buff 缓存
G.factions[fid]._postBuffs(11 key 缓存)+ ._postSalary(月费缓存)。每旬 nextTurn 重算一次,decree 也合并进来。

### B4 欠饷状态
G.factions[fid]._salaryDebt(0..1 比例)+ ._salaryDebtTurns(连续旬数)。政治链产生月费扣款 → 经济链 processUnitSalary 写入欠饷 → 蔓延到补员/裁军/忠诚。

### B5 武将官职映射
G.genPost[name] = postName。1 武将 1 官职互斥,与太守也互斥(任太守自动卸官职)。

### B6 武将功绩 + MERIT_INIT
G.genMerit + 开局种子。是任命官职的资本(大将军 60 / 丞相 50 / 二品 25-30 / 三品 8-10)。

### B7 朝议 decree 列表
G.courtDecrees = [{fid, buffKey, effectVal, expiresAt}]。push 主路径是 _applyCourtDecisions,**但 anti_corruption 事件直 push 绕开**(D 类候选 6)。

### B8 城市太守 city.prefect
G.cities[cid].prefect。**写入 3 路径不统一**(完整 setPrefect / 裸 clearPrefectByGen / 直 c.prefect=null),9+ 处直接置空(D 类候选 2)。

---

## C 区 · 派生函数(政治链的"计算与操作")

### 数值计算组(C1-C4)

#### C1 calcPostBuffs 11 key 汇总
遍历当前所有官职,按 buff 字段加总,buffStat 决定按统帅(com)还是政治(pol)缩放(scale=stat/100)。每旬 nextTurn 调一次,缓存进 B3。

#### C2 calcPostSalary 月费扣款
sum(getFacPosts.salary)。在 processFacEconomy 7156-7157 调,直接扣 fac.res.gold。**Q3 单立**:这是政治链对经济链最直接的"消耗"出口。

#### C3 calcCityCorruption 腐败计算
4 修正源:base(城市数)+ prefect(太守 pol)+ gentry(豪族 5 档)+ decree(整肃吏治)。8 调用点无缓存,按需算。

#### C4 getCourtDecreeBuffs 9 key
filter G.courtDecrees(同 fid 未过期)累加。9 key 中 7 个会合并进 _postBuffs(B3),还有 2 个 decree-only(milBuildCost / recruitWild)直接读。

### 名额查询组(C5-C6)

#### C5 getPostSlots+getFacPostTier 名额
v181 拆耦合统一入口。tier3/2 名额来自城市数 + stage cap;tier1 来自 STAGE_TIER1_SLOTS。

#### C6 getTributeRates 纳贡比例
查 TRIBUTE_RATES[getStage(suzerainFid)]。关键设计:用宗主 stage 而非附庸 stage。

### 任命操作组(C7-C11)

#### C7 appointGenPost 任命官职(参考实现)
完整 7 步:互斥太守 → 互斥旧官职 → 写 G.genPost → 忠诚 +8 → factionEvent → ethosShock → log。是政治链最完整的"任命三件套"参考。

#### C8 dismissGenPost+clearAllPostsByGen 罢免簇
**K1 合并**。dismissGenPost 完整版(silent=false 时扣 -3 + factionEvent + ethosShock),clearAllPostsByGen 裸版(只清字段,服务武将出口路径)。Step 3 时要核 6+ 调用点是不是该走 silent=false。

#### C9 setPrefect+clearPrefectByGen 太守簇(Q2 单立)
setPrefect 完整路径(+8/-3 + 派系事件,**无 ethosShock**);clearPrefectByGen 裸清。**最大问题:9+ 处其他路径直接置空,完全绕过**(D 类候选 2)。

#### C10 setStrategist 军师任免
+5/-2 数值,**与官职任命的 +8/-3 不一致**(D 类候选 3),**无 ethosShock**(D 类候选 4)。其他清空路径(下野/单挑死/末期清理)裸清。

#### C11 三大政策 set 簇(Q4 合并)
3 setter 合一节点。代码极简(改字段+刷UI+log)。**Claude AI 仅有 _execSetTax,缺 _execSetPolicy / _execSetCorvee**(D 类候选 1)。

### 朝议生命周期组(C12-C16)

#### C12 _generateCourtProposals 提案生成
按 tier1 全员 + tier2 抽样(_shuffleFY v179fix P39),每提案者从对应 track 池抽 1 案,生成 [{proposal, proposer, postDef, factionId, effectVal}]。

#### C13 _applyCourtDecisions 应用决议
**朝议是政治链辐射最广的钩子点**。同时碰 4 件事:
- 写 B7(decree push)
- 写 ethos(ethosShock 多维度)
- 写 武将派系mod(±1.5/-0.8)
- 写 豪族 clan_base 属县 loyalty(±5/-3 × COUNTY_CLAN_SENS=2.0,v178 fix #33 按 county 去重)

#### C14 _aiCourtSelect AI 评分选 2
启发式打分:粮少劝农、金少兴商、民心低安民、兵多扩军备战。length<=2 短路全选。每次必选 2 个,与玩家对称。

#### C15 triggerCourtCouncil+_expireCourtDecrees 朝议主入口
每 9 旬一次(turn>1 && turn%9===1)。先 _expireCourtDecrees 清过期 → 全势力遍历:玩家排队等弹窗 / AI 自动评分选。

#### C16 checkPostDowngrade 失城裁官
每旬调,按名额超额比对,按功绩低优先裁(silent=false dismissGenPost,扣 -3 + 触事件)。仅按名额裁,不按合适度。

---

## D 区 · 状态出口(对应运行时的 4 大产出簇)

### D1 任命变更簇
C7+C8+C9+C10 写入 B5/B2/B8 的统一出口。6 类操作(任命/罢免官职/任命卸太守/任命卸军师)。每类触发 1-3 个跨链 hook。

### D2 朝议簇(K3 独立)
C12+C13+C14+C15 的统一出口。每季度首旬触发,4 跨链 hook 同时(经济/武将/豪族/价值观)。decree 3 旬有效后清。

### D3 月费扣款簇(Q3 单立)
C2 calcPostSalary 在 processFacEconomy 内扣 fac.res.gold。是政治链对经济链最直接的消耗出口。语义归政治链,但代码执行在经济链 C7 内。

### D4 政策切换簇(Q4 合并)
C11 setTax/setPolicy/setCorvee 写 B1。无忠诚/派系/价值观 hook(政策切换不改人际关系),但**TAX 字段 ID='heavy'/'harsh' 时间接触发 ethos strategy drift**(D4 → E5)。

---

## E 区 · 跨链(7 个跨链节点)

### E1 政治→经济(辐射最广)
8 类输出:
1. _postBuffs 7 key → processFacEconomy 金产 / processUnitSalary 维护费 / 征兵 / 补员 / 建设
2. decree milBuildCost / recruitWild → build queue / refreshWildPool
3. 月费扣款 → fac.res.gold
4. TAX.goldM → 税率乘金产
5. TAX.moraleMod / popMod → processMorale / processPop
6. POLICY.front/rear → processReinforcement
7. CORVEE.buildBonus / moralePen / qualPen → build queue / 民心 / 人口质量
8. getTributeRates → 附庸纳贡

### E2 政治→军事
仅 4 mil-related buff key(upkeep / recruitCost / reinforce / foodCost)。**军事链 v1.1 已审 verified-with-notes**:无战斗 buff key 是设计意图。

### E3 政治→武将
3 大类:
1. 任命忠诚 ±(+8/-3/+5/-2)→ 武将链 C3
2. triggerFactionEvent 6 类(appointPost/removePost/defectorPrefect)→ 武将链 C8
3. 朝议派系修正 ±1.5/-0.8 写 G.genFactionMod → 武将链 C7

### E4 政治↔豪族(双向)
**入**:city.gentry 5 档 → 腐败修正(C3)+ 太守"本地士族判定"。
**出**:朝议 → clan_base 属县 loyalty(_aggregateGentry 重算 city.gentry,**1 旬延迟正反馈环**)。

### E5 政治→价值观
ethosShock 6+ 类:任命 power ±(C7)、罢免 power ±(C8)、朝议 conscript/upkeep/reinforce military ±、朝议 milBuild strategy ±、朝议 farm/morale/trade civil ±、朝议 recruit power -1。

**注意**:setPrefect / setStrategist 缺 ethosShock(D 类候选 4)。

### E6 阶段→政治(单向入边)
getStage(fid) 输入 3 处:① STAGE_TIER1_SLOTS(tier1 名额);② STAGE_LABEL_CAP/FLOOR(label 上下限);③ TRIBUTE_RATES(纳贡比例)。stage 不归本链管,是外部驱动节点(K4 决策)。

### E7 Claude AI v158+ 政治指令(Q5 单立)
5 _exec 已实装(_execSetTax / _execSetPrefect / _execAppointPost / _execDismissPost / _execSetStrategist),**缺 _execSetPolicy / _execSetCorvee**(D 类候选 1)。其中 4 是 thin wrapper 共享玩家函数,**只有 _execSetTax 不走 setter**(D 类候选 5,小 bug)。

---

## v1.0 已识别的 8 个 D 类候选(等 Step 3 正式编号 D-076 起)

| # | 严重度估计 | 内容 | 类比已审链 |
|---|---|---|---|
| 1 | HIGH | Claude AI 缺 _execSetPolicy / _execSetCorvee | 军事链 D-006/D-021 同类 |
| 2 | HIGH | city.prefect 清空 3 路径未共享 helper(9+ 处) | 军事链 D2 易主簇 D-023~D-031 |
| 3 | MEDIUM | 三任命函数数值不一致(+8/-3 / +8/-3 / +5/-2) | 武将链 D-072 类似 |
| 4 | MEDIUM | setPrefect / setStrategist 缺 ethosShock | 一致性 |
| 5 | LOW | _execSetTax 裸写不走 setTax | 小 |
| 6 | MEDIUM | anti_corruption 事件直 push G.courtDecrees | 设计意图待问 |
| 7 | LOW | MERIT_INIT 覆盖性待查 | 数据完整性 |
| 8 | LOW | 朝议 selectCount=2 时 UI 强求点选两次 | UX 小议题 |

预估最终 D 类总数:**8-15 个**(Step 3 阶段 1-6 时可能再发现 2-7 个新候选)。

---

## v1.0 后续工作(Step 3 6 阶段 audit pass 1)

按经济链/军事链/武将链流程:

1. **阶段 1 高优 D 类**:E7 Claude AI 5 _exec + B8 prefect 9+ 路径(D 类候选 1+2)
2. **阶段 2 一致性差**:三任命函数 + setPrefect/setStrategist 缺 ethosShock(D 类候选 3+4)
3. **阶段 3 边界 case**:_execSetTax 裸写 + anti_corruption 直 push + MERIT_INIT 覆盖性(D 类候选 5+6+7)
4. **阶段 4 散点扫描**:G.courtDecrees / G.genPost / G.genMerit 等状态字段散点写入对账
5. **阶段 5 节点级模糊**:朝议 selectCount UX(D 类候选 8)+ 9 vs 11 buff key 差(C4 vs C1)
6. **阶段 6 批量 verified**:剩余 ~37 节点逐一确认

预期产出:**v1.1**(45 节点 audit.status 全更新 + 90 边批量 verified + 完整 D 类清单)。

---

# 政治链 v1.1 — Step 3 6 阶段 audit pass 1 完成

> **v1.1 不是 v1.0 重做**,是 Step 3 阶段 1-6 完整审计后的标定升级。45 节点 audit.status 全更新,15 D 类全部定性。

---

## v1.1 终态摘要

**节点状态分布**(45 节点):
- verified 22 / verified-with-findings 7 / verified-mirror 6 / verified-with-notes 3 / discrepancy 7

**D 类全集**(15 个,D-076~D-090):
| 严重度 | 数量 | 编号 |
|---|---|---|
| HIGH | 3 | D-076 / D-077 / D-084 |
| MEDIUM | 5 | D-079 / D-081 / D-082 / D-086 / D-087 |
| LOW | 7 | D-078 / D-080 / D-083 / D-085 / D-088 / D-089 / D-090 |

**verdict 分布**:
- **fix 6**:D-076 / D-077 / D-084 / D-087 / D-088 / D-090
- **no-fix 4**:D-079 / D-081 / D-082 / D-086
- **defer 4**:D-078 / D-080 / D-085 / D-089
- **verified-with-notes 1**:D-083

---

## v1.1 Step 3 阶段执行结果

### 阶段 1.1 — E7 Claude AI 5 _exec 政治路径(5 D 类)

5 _exec 完整对账(verified _execAppointPost / _execDismissPost / _execSetStrategist 3 个 thin wrapper):

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-076** | HIGH | fix | Claude AI 缺 set_corvee — 加 _execSetCorvee + case + prompt |
| **D-077** | HIGH | fix | _execSetReinforcePolicy 写错字段 reinforcePolicy → policyId(跨链 close 军事链 D-021)|
| D-078 | LOW | defer | _execSetTax 裸写不走 setter(setTax 写死 G.playerFac 是历史包袱)|
| D-079 | MEDIUM | no-fix | _execSetPrefect 不允许出征武将任太守(玩家允许)— 设计意图 |
| D-080 | LOW | defer | 玩家 appoint 守卫只在 UI 层 — 架构债 |

### 阶段 1.2 — B8 prefect 11 路径对账(4 D 类)

11 路径分类:
- **转岗**(1 路径):**verified-with-notes** — 净 +8 单事件简化合理
- **武将主动离开**(3 路径):**D-081 no-fix** — 派系事件语义不该触发
- **失城易主**(3 路径):D-082 no-fix(大乱)/ D-083 verified-with-notes(开城)/ verified-with-notes(攻陷,军事链 D2 已审)
- **武将出口**(2 路径):**verified** + **verified-with-notes**(execute 事件 cover 派系层)
- **势力消亡**(1 路径):**verified**
- **特殊**:**D-084 HIGH fix** — succeedRuler 漏 clearAllPostsByGen,1 行修复

### 阶段 2 — 一致性差(3 D 类)

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| D-085 | LOW | defer | anti_corruption ② 缺 clan_base loyalty(事件已 cover ethosShock)|
| D-086 | MEDIUM | verified-with-notes | 三任命数值差异(军师 +5/-2 异于 +8/-3)— 设计意图,文档化 |
| **D-087** | MEDIUM | fix | setPrefect/setStrategist 缺 ethosShock — 4 处补 |

### 阶段 3 — 边界 case(1 D 类 + MERIT_INIT 取消)

D 类候选 7(MERIT_INIT 覆盖性)— **覆盖完整,verified,候选取消**。

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| D-088 | LOW | fix | 朝议 selectCount=2 时 UI 强求点选两次 — 1 字符改动 |

6 个边界 case 全 verified:0 提案 / decree 过期检测时机 / stage 不可逆与残余势力 / checkPostDowngrade vs processStageEvolution 顺序 / 已淘汰势力朝议幽灵流程 / ruler 任命互斥。

### 阶段 4 — 散点扫描(1 D 类)

**散点扫描在政治链特别干净** — 4 状态字段(G.courtDecrees/G.genPost/G.genMerit/city.prefect)+ G.factions.strategist + 三大政策字段散点扫描,只发现 1 个 LOW:

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| D-089 | LOW | defer | INIT_POSTS @ 6353 无 stage cap 检查 — 当前剧本无副作用,扩展性问题 |

**散点干净的原因**:政治链状态字段少 + 入口收敛(setter 函数主导),大部分"野生写入"在阶段 1.2 prefect 路径已展开。

### 阶段 5 — 节点级模糊(1 D 类 + C4 desc 修正)

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-090** | LOW | fix | _execSetStrategist 同人重复任命 net +3 忠诚 exploit — 加守卫 |

**C4 节点 desc 修正**(v1.0 误写):
- getCourtDecreeBuffs 实际返回 **8 key**(不是 9 key):goldProd/foodProd/recruitCost/reinforce/upkeep/morale/milBuildCost/recruitWild
- 与朝议 COURT_PROPOSALS 8 buff key 闭合
- _postBuffs 11 - 6 重叠 = **5 个 decree-碰不到 key**(foodCost/buildSpeed/stratRate/giftEffect/expGain),只能通过官职 buff(右将军/光禄勋/丞相/大将军),设计意图是"私人职务赋能"vs "国家政策"分层

### 阶段 6 — 批量 verified(0 新发现)

剩余 ~30 节点逐一确认,无新 D 类。45 节点全部 status 标定完成。

---

## v1.1 设计巧思汇总(政治链特有)

### 1. 朝议 9 旬周期 + decree 3 旬有效
每季度只 1/3 时间有 decree buff,后 2/3 空窗。设计意图:朝议是冲刺机会(集中资源做一件事),不是常态加成。

### 2. tier1 由 stage 锁死,tier3/2 由城市数锁死(v181 拆耦合)
STAGE_TIER1_SLOTS 只 regime={1,1},其他 stage tier1 名额 0。POST_TIERS 4 档城市数决定 tier3/2。**两个维度独立**:再大的"军阀"也不能任丞相(stage 不够),"政权"残余也能保留大将军/丞相(城少不影响 tier1)。

### 3. 三任命函数数值差异有意图
- 官职 +8/-3:中央正式官位
- 太守 +8/-3:地方军政一把抓(数值同官职,因为同等正式性)
- **军师 +5/-2**:私人战略顾问,不是正式官位,信号更柔性
**未文档化前易被误判为 bug,v1.1 节点 desc 已说清**。

### 4. anti_corruption 9 旬 decree 绕朝议 ceremony(事件特化)
朝议主路径 _applyCourtDecisions 5878 写 expiresAt = G.turn + 3,anti_corruption 事件直 push expiresAt = G.turn + 9。
- 9 旬 = 1 季度 = 朝议下次召开前不会过期
- 不调 _applyCourtDecisions → 无派系 mod / clan_base loyalty(事件自己 ethosShock 处理)
- 设计意图:事件型 decree 是"应玩家选择产生的特别法令",绕开常规 ceremony 合理

### 5. INIT_POSTS @ 6353 v95 直写不触发事件
开局预填 tier1+2 官职(每势力 5 武 5 文 = 10 个),**直写 G.genPost 不触发 +8 忠诚 / appointPost 派系事件 / ethosShock**。设计意图:开局武将本来就是初始忠诚,触发事件会破坏开局平衡。

### 6. stage 不可逆 + 残余 regime 保留 tier1(政权身份的尊严)
stage 只升不降。残余 regime 势力(打到 3 城)选档"侯",但 STAGE_TIER1_SLOTS[regime]={1,1} 仍允许任丞相/大将军。**叙事上保留政权身份的最低尊严** — 即使败退,仍是正统朝廷。

### 7. _execSetReinforcePolicy 字段名混乱(D-077 真因)
- 接口名:set_reinforce_policy(部队级补员策略)
- 写入字段:reinforcePolicy(无效字段)
- 应写入字段:policyId(政治链 B1 三大政策状态)
- processReinforcement 30287 读 policyId,所以**写错字段相当于 dead code**(军事链 D-021 视角)
- **政治链视角**:这是 _execSetPolicy 的真正实装,只是命名错位。1 字段名修复 close 双链 D 类

---

## v1.1 跨链对账(与已审 4 链)

### 与经济链 v4.3 ✓
- E1 政治→经济(8 类输出最广)
- C2 月费扣款 → 经济链 C7 processFacEconomy
- D4 三大政策(TAX/POLICY/CORVEE)→ 经济链多 tick
- C3 腐败 → 经济链 _corruptLoss 7167
- C6 纳贡 → 经济链 7173-7188

**verified**:政治链与经济链交界面 8 类全 verified。

### 与军事链 v1.1 ✓
- E2 _postBuffs 4 mil-key → 军事链 E2 verified-with-notes(已审)
- **D-077 与军事链 D-021 跨链 close**:同处代码两面观察,1 字段名修复同时 close 两链 D 类
- 军事链 E8 _execRecruit 与政治链 E7 _execAppointPost 是平行的"v158+ 高层接口"模式

**verified-mirror**:E2 与军事链 E2 互证。

### 与豪族链 v4 ✓
- E4 双向耦合
  - 入:city.gentry → 腐败修正(C3)+ 太守"本地士族判定"(STATE_TO_GENTRY_FAC)
  - 出:朝议 → clan_base 属县 loyalty ±5/-3 × COUNTY_CLAN_SENS=2.0
- **1 旬延迟正反馈环**:朝议碰对了士族派系 → 该派系州 clan_base 涨 → 城市 gentry 涨 → 腐败更低 → 金产更多

**verified-mirror**:E4 与豪族链 v4 双向 verified。

### 与武将链 v1.2 ✓
- E3 政治→武将 3 大类:
  1. 任命忠诚 ±(+8/-3/+5/-2)→ 武将链 C3 applyLoyaltyEvent 入边
  2. triggerFactionEvent('appointPost'/'removePost'/'defectorPrefect') → 武将链 C8 派系 8 类事件
  3. 朝议派系修正 ±1.5/-0.8 写 G.genFactionMod → 武将链 C7 修正明细的最大变量来源

**verified-mirror**:E3 与武将链 v1.2 C3/C7/C8 入边对齐。

### 与价值观链(待审)mirror
- E5 ethosShock 6+ 类:任命 power ±(C7) + 罢免 power ±(C8) + 朝议 4 维度 + 强迁人口
- D-087 修后,setPrefect/setStrategist 也有 power ethosShock,**与官职任命对齐**
- 价值观链 audit 时本节点作为入边对账参考

---

## v1.1 与已审 4 链严重度对比

| 链 | D 类总数 | HIGH | MEDIUM | LOW | audit 阶段 |
|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 全 verified |
| 豪族链 v4 | 12 | - | - | - | 早期 |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | Step 3 全过 |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | Step 3 全过 + v1.2 增量 |
| **政治链 v1.1** | **15** | **3** | **5** | **7** | **Step 3 全过** |

**政治链特点**:
- 节奏中等(比经济链复杂,比军事链/武将链干净)
- D 类高度集中在 **C9 太守簇 + C10 军师 + E7 Claude AI**(15 D 类中 11 个,73%)
- 散点扫描特别干净(只 1 LOW)— 状态字段少 + 入口收敛
- HIGH 全集中在 Claude AI 路径(D-076/D-077)+ 君主继任(D-084)

---

## v1.1 工作流方法论沉淀(基于 5 链 audit)

继承 §二〇九.11 / §二一〇.8 / §二一一.11 方法论,本轮新发现:

### 1. 散点扫描的链路特性
- 经济链散点扫描 → 1 个 MEDIUM(D-006)
- 军事链散点扫描 → 5 个 D 类(D-035~D-040,Claude AI _execRecruit 部队属性)
- 武将链散点扫描 → 3 个 D 类(D-069~D-072,在野池+挖角)
- **政治链散点扫描 → 1 个 LOW(D-089)**

**规律**:状态字段越少 + 入口越收敛,散点扫描越干净。政治链 4 状态字段 + 函数化 setter,远比军事链 unit.squads.troops 24+ 写入点干净。

### 2. 跨链 D 类的"两面观察"模式
- D-077(政治链 _execSetReinforcePolicy 写错字段)= 军事链 D-021 dead code
- D-006(经济链 fac.res.gold 漏修正)= 军事链 D-006(同 ID 跨链记录)
- **跨链 D 类应在两条链都登记,实际只是同一处代码的不同视角**

### 3. 设计意图 vs bug 的辨识
政治链 D-079(玩家 vs AI 太守任命行为不对称)/ D-086(三任命数值差异)/ D-083(开城太守失城无忠诚惩罚)等多处都是**设计意图**而非 bug,关键鉴别指标:
- 是否有现存机制 cover 该语义?(D-082 大乱已 -3 全员 / D-083 豪族机制 / D-079 buff 减半提示)
- 是否其他系统已经处理?(D-081 派系事件本身是"君主主动"语义,武将自然脱离不该套用)

### 4. 政治链 vs 武将链命名混乱(D-074 框架延伸)
- 武将链 D-074:CLAIM_EFFECTS 字典键 founding/royalty 与 FACTION_DEFS 同名异义
- 政治链 D-077:_execSetReinforcePolicy 接口名 vs 写入字段 vs 应写字段三层命名混乱
- **共同根因**:演化中加新接口未严格对齐字段名/枚举值,留下命名债
- 待重构 sprint 统一处理

---

## v1.1 不做的事(再次重申)

- ❌ 不动游戏代码(包括 15 个政治链 D 类的 6 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 数据
- ❌ 不重写 HANDOVER 早期章节
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

代码 sprint 时机:等所有链 audit 完成后(剩余 **外交链 / 事件链 / 价值观链** 3 条)。

---

## 下个对话指引(外交链 audit 启动)

**继承的素材**:
- 政治链 v1.1 三件套(JSON / 概念图 v6.1 / walkthrough)
- 15 个政治链 D 类全部定性,不重审
- 5 链工作流方法论
- **D 类清单累计 67 + 15 = 82 个跨链 D 类**(外交链 audit 时对账用)

**新对话启动**:外交链 audit pass 1
- 同样 5 步:Step 1 反向 grep → Step 2 节点骨架 → Step 3 6 阶段 → 概念图 → walkthrough
- 与已审 4 链同代命名(v1.0→v1.1)
- D 类编号从 **D-091** 起

**Step 1 反向 grep 分组建议**(外交链特性):
1. 主 tick:processFeudDecay / processReputation / processClaimPrep
2. 派生入口:diploGift / diploArmistice / diploDemandVassal / declareWar / proposeAlliance / break_alliance / start_claim / submit_vassal / release_vassal
3. 状态读写:G.diplo / G.claims / G._warClaimStrength / G._feuds / G._cityChangeLog / .reputation
4. 常量:CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / TRIBUTE_RATES(政治链 A10 mirror)
5. 跨链:经济(送礼/通商) / 武将(挖角外交惩罚 ±15) / 政治(信誉影响送礼 / TRIBUTE_RATES)/ 价值观(背刺 ethosShock)
6. 外围因子:isHostile 170 处调用(军事链 E3 已审)/ canEnthrone / claim 准备时长

