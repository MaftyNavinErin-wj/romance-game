# Phase 3.12 Notes — chains/general.js(武将链,Wave 3 收尾,phase 3 chain 抽离最后一个)

> Sub-session:Phase 3.12(REFACTOR_PLAN_v1.md §三阶段 3,Wave 3 收尾)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.12-general` ← `refactor/phase-3`
> 起始 commit:`cd125b0`(Phase 3.11 完成,最大 chain 收尾)
> **phase 3 chain 抽离最后一个 sub-session**;3.13 收尾会做 4-batch review

---

## 一、范围(scout 通过 4 件重点 + 实装就地修正)

PLAN 字面:`chains/general.js(武将链 v4 / ~70 mutator / 30 D 类原 audit)`。
实装:**69 函数 + 11 const**(15 段 v181 + 1 段 ceremonies.js 归位)。

| 段 | v181 行号 | 函数数 | 内容 |
|---|---|---|---|
| GEN1 部曲 | L887-L912 | 4 | `getRetainers / getRetainerType / setRetainers / getRetainersDisplay` |
| GEN2 武将养成 | L919-L986 | 2 + 4 const | `STAT_GROW_*/APT_GROW_*/APT_GRADES + addStatExp/addAptExp` |
| GEN3 helpers + 伤亡 const | L2061-L2092 | 3 + 6 const | `_deepCloneGen / _rebuildGEN_MAP / loyaltyDisplay + WOUNDED_CD/BATTLE_DEATH_*/DUEL_KILL_*/CAPTURE_RATE_CAP` |
| GEN4 籍贯 | L2625-L2665 | 4 + 1 const | `getGenHomeCounty/getGenHomeCity/isGenHomeInFac + _V170_TIER_TABLE + getGenLocalBonus` |
| GEN5.a 出身地 + 籍贯地形 | L2867-L2904 | 3 | `getGenBirthplace/isHomeTerrain/_isClanRoyalty` |
| GEN5.b 派系系统 | L2906-L3353 | 9 | `getGenFactions/getGenFaction/_genInfluence/factionModToLoyaltyDelta/processFactionLoyalty/getAvgFactionMod/getFactionMoraleMod/triggerFactionEvent/getGenFactionModBreakdown` |
| GEN6 chronicle | L3506-L3514 | 1 | `addGenChronicle` |
| GEN7 招募 | L3790-L4108 | 9 | `getAllRecruitedNames/refreshWildPool/calcRegionRecruitBonus/calcClanRecruitBonus/calcGentryRecruitBonus/_doRecruitWild/recruitWild/aiDoRecruitTalent/_aiDoPoach` |
| GEN8 亲密度阈值 | L4109-L4171 | 2 | `checkIntimacyThresholds/_showIntimacyAlert` |
| GEN9 忠诚 + 挖角 | L4214-L4643 | 5 | `calcLoyaltyDelta/processLoyalty/applyLoyaltyEvent/checkLoyaltyThresholds/poachGen` |
| GEN10 太守 | L4677-L4748 | 2 | `clearPrefectByGen/setPrefect` |
| GEN11 军师 | L4750-L4793 | 2 | `getStrategistInt/setStrategist` |
| GEN12 战力 | L7527-L7535 | 2 | `comBonus/warMoraleBonus` |
| GEN13 亲密度系统 | L7621-L7746 | 8 | `_intimacyKey/getIntimacy/setIntimacy/addIntimacy/getCompatGrowthMult/getRelationLabel/applyDuelIntimacy/applyBattleIntimacy` |
| GEN14 伤亡 + 俘虏 | L7749-L8075 | 12 | `checkWounded/isGenWounded/getEffectiveStat/calcCaptureRate/calcSurrenderRate/killGen/succeedRuler/surrenderGen/releaseGen/aiDisposePrisoner/collectPrisoners/resolvePrisoners` |
| GEN15 _applyCeremony 归位 | src/render/ceremonies.js L28-L45 | 1 | 从 ceremonies.js 搬到 chains/general.js GEN15 段 |

**留 v181 / 数据 sprint**:
- 武将数据 const:`GENS_FULL / GEN_META / ALL_GENS / GEN_POOL_INACTIVE / FOUNDING_CORE / GEN_CLASS / CLASS_META`(留 v181 等 src/data/generals.js sprint)
- squad class helpers(L2175-L2240):`getSquadClass / getUnitClassBuffs / getClassDuelWeight + genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml`(留 v181 与 GEN_CLASS 数据捆绑等 sprint)
- ceremony modal(留 src/render/ceremonies.js):`_showCeremonyPicker / _updateCeremonyBtn / _confirmCeremony`
- 武将相关 5 _exec(留 src/core/claude_ai.js 段 M):`_execAppointPost / _execDismissPost / _execSetStrategist / _execRecruitWild / _execPoach`

---

## 二、3 个补充记录(制作人 2026-05-05 approve)

### 二.1 triggerFactionEvent 闭环记录(audit pass 2 用)

**phase 3 整体决策一致性的证据**:
- **phase 3.2** 抽 `src/core/hubs.js` 时 `triggerFactionEvent` 被排除。理由:写口主要在武将链派系状态 `G.genFactionMod / G.genFactionModLog`,不是真跨链 hub
- **phase 3.12** 本 session 归位 `chains/general.js` GEN5.b

两个决策一致:**一个函数的"hub-like 调用面"不等于"跨链归属",应按主写口判定**。3.2 决策正确,3.12 实现一致。

audit pass 2 用价值:这是 phase 3 期间多次决策(3.2 hubs / 3.5 ethos hub / 3.6 gentry hub / 3.12 武将 hub)按"写口判定"原则保持一致的证据。

### 二.2 D-064 关联 D-065 标注

**D-064**:`_execPoach` AI 挖角费用未乘 `(1 + _techPoachCost)`(AI poachCostMult 完全失效)
- 位置:`src/core/claude_ai.js _execPoach`(留 v181 段 M / 实际 phase 3.3 选项 A 留 v181)
- **不在武将链**,但与 D-065 紧密关联

**D-065**:玩家 `poachGen` vs AI `_aiDoPoach` 公式严重不对称(玩家 4 项 buff,AI 2 项,互不存在)
- 位置:`chains/general.js` GEN9(`poachGen`)+ GEN7(`_aiDoPoach`)

**关联关系**:挖角公式不对称(D-065)是设计层面的不对称;`_techPoachCost` 失效(D-064)是实现层面的 AI buff 丢失。**sprint 修 D-065 时大概率要同步修 D-064**(否则修对称性时漏 buff 还会再次出现)。

记录这条关联的目的:audit sprint 启动决策时,把 D-064 + D-065 当作**一对**处理,而不是分别走两个 batch。

### 二.3 setPrefect 判定理由精确化

**判定**:setPrefect 归武将链(GEN10)— 同 scout §六 (d) 结论。

**理由**(本 session 起记录):**业务语义优先于字段位置**。

具体说:
- 业务语义:setPrefect 是"任命武将做太守"(武将动作)
- 字段位置:`G.cities[].prefect`(经济城市 state)是记录,`G.genLoyalty`(武将忠诚)是核心副作用
- 函数主体逻辑:处理武将状态变化(忠诚 +8 / 派系事件 / 价值观冲击 / log)

按业务语义归武将。

**为什么不用"哪个写口是核心"**:那个标准容易引发"凭什么判核心"的争议。`G.cities[].prefect` 字段在经济 state 下,但是是单一字段;`G.genLoyalty[name]` 在武将,函数内多行处理。两者都"核心",分不出谁主谁副。

**业务语义优先**给出了清晰判定 — 函数描述什么业务,就归该业务的链。sprint/audit 引用更稳定。

同样原则适用于:
- `appointGenPost / dismissGenPost`(政治链 GEN1)— 任命/罢免官职是政治动作,主体写 G.genPost,副作用写 G.genLoyalty;按业务语义归政治
- `succeedRuler`(本 chain GEN14)— 君主继任是武将晋升 + 派系切换,主体逻辑武将处理;按业务语义归武将

---

## 三、carry-over 反向调用收口清单((c) 原则容许)

| 武将链函数 | v181 当前位置 | 跨 chain 调用方 | (c) 容许判定 |
|---|---|---|---|
| `triggerFactionEvent` | GEN5.b | diplomacy 4 处 / military 1 处 / politics 2 处 = 7 | ✓ 派系事件 hub |
| `setPrefect / clearPrefectByGen` | GEN10 | politics 1 处 | ✓ 太守任命与朝议交互 |
| `getStrategistInt / setStrategist` | GEN11 | diplomacy 1 处 / claude_ai 1 处 = 2 | ✓ 军师 INT 用于计谋 |
| `addStatExp / addAptExp` | GEN2 | military 8 处 / politics 1 处 = 9 | ✓ 经验 hub |
| `getRetainers / setRetainers / getRetainersDisplay` | GEN1 | military 10+ 处 | ✓ 部曲 hub |
| `killGen / surrenderGen / addGenChronicle` | GEN14 / GEN6 | military 多处 / gentry 1 处 | ✓ 武将死亡 / chronicle hub |
| `getGenFaction / getGenFactions / _genInfluence` | GEN5.b | economy 1 处 / politics 6 处 = 7 | ✓ 派系 hub |
| `processFactionLoyalty` | GEN5.b | core/tick.js 1 处(每旬)| ✓ turn proc 入口 |
| `applyLoyaltyEvent` | GEN9 | military 1 处(战败)| ✓ 忠诚事件 hub |
| `_applyCeremony` | GEN15 | ceremonies.js _confirmCeremony 1 处 | ✓ 同文件外的 ceremony modal callback |

**收口结论**:全部反向调用 typical hub 模式,(c) 原则容许。**不存在真反向耦合**(没有武将链函数体内反向调已抽 chain 的非 hub 函数)。3.12 抽离后所有调用关系不变,跨 script hoisted function 全局可见。

---

## 四、_applyCeremony 归位(phase 2 carry-over close)

**源**:`src/render/ceremonies.js:31-45`(phase 2 carry-over,文件 header L29 自带 TODO 标记 `will be moved to chains/ during phase 3 mechanism extraction`)

**实装动作**(单 commit,GEN15 是 chains/general.js 一部分):
1. ✅ 把 `_applyCeremony` 函数体(15 行)从 src/render/ceremonies.js 抽出
2. ✅ 添加到 src/chains/general.js GEN15 段
3. ✅ ceremonies.js L28-L45 替换为 placeholder marker,_confirmCeremony(L93)调用关系不变(跨 script hoisted function 全局可见)
4. ✅ ceremonies.js header TODO 注释自动随 placeholder 失效

**写口归属**:主写 G.genLoyalty / G.loyaltyAccum(武将)+ 调 addStatExp hub(武将)。**100% 武将链**(已 phase 2 review 验证)。

**3 个跨链副作用**(整函数归武将,不反取):
- `G._eventFired`(事件链 cooldown)
- `sq.morale`(军事 squad 全军士气 +5)
- `addStatExp`(本 chain hub,自然内聚)

---

## 五、30 D 类位置文档化(scout §四,**不修,sprint 修**)

CLAUDE.md 硬规则:HIGH/MEDIUM/LOW fix 全留 sprint。本 session **文档化位置**便于 sprint 定位。

| D-XX | 严重度 | 涉及函数 / 标记 | chains/general.js 段 / 其他 |
|---|---|---|---|
| D-048 | HIGH | `triggerFactionEvent('betray')` 调用方漏 | 跨 chain caller bug,sprint 修各 caller(diplomacy / military)|
| D-049 | HIGH | `triggerFactionEvent('warDeclare')` 多路径漏触发(与事件链 D-131 同源)| GEN5.b `triggerFactionEvent` 本身 OK,callers 漏触 |
| D-051 | HIGH | `setPrefect / setStrategist` 漏 `applyEthosShock(power)` | GEN10 / GEN11 |
| D-052 | HIGH | `calcLoyaltyDelta` UI vs `processLoyalty` 主 tick 双向 4 项缺漏 | GEN9 |
| D-053 | HIGH | `applyLoyaltyEvent` 定义 3 type 但 `city_lost / siege_broken` 死代码 | GEN9 |
| D-055 | HIGH | 投机标签 `_poachThr` 把 45 硬编码(科技 buff 失效)| GEN9 `poachGen` |
| D-061 | HIGH | AI 处决俘虏 `killGen(name, **null**)` | GEN14 `aiDisposePrisoner` |
| D-063 | HIGH | `poachGen` 玩家挖角成功后漏写 `G.genJoinTurn / G.genJoinSource` | GEN9 `poachGen` |
| **D-064** | HIGH | `_execPoach` AI 挖角费用未乘 `(1 + _techPoachCost)` | **留 src/core/claude_ai.js**(不在武将链)。**与 D-065 关联**(见 §二.2)|
| D-065 | HIGH | 玩家 `poachGen` vs AI `_aiDoPoach` 公式严重不对称 | GEN9 / GEN7。**sprint 修 D-065 时大概率同步修 D-064** |
| D-084 | HIGH | `succeedRuler` 漏 `clearAllPostsByGen` | GEN14 `succeedRuler` |
| D-042~D-075 其余 19 MEDIUM/LOW | (统称) | calcLoyaltyDelta 公式细节 / 派系 mod / 招募 / 亲密度 / 战死概率 等 | GEN9 / GEN5.b / GEN7 / GEN8 / GEN14 各对应段 |

**sprint 启动决策建议**(基于位置文档化):
- 武将链 batch 1:`poachGen` 全套(D-055 + D-063 + D-065 + 关联 D-064)= 4 个 D 类合并修 → GEN9 + GEN7 + claude_ai _execPoach
- 武将链 batch 2:`triggerFactionEvent caller` 全套(D-048 + D-049,与事件链 D-131 同源)= 跨链 caller 修
- 武将链 batch 3:`calcLoyaltyDelta vs processLoyalty 双向对齐`(D-052 + D-053)= GEN9 内部对齐
- 武将链 batch 4:`俘虏 + 继任`(D-061 + D-084)= GEN14
- 武将链 batch 5:`setPrefect/setStrategist 漏 applyEthosShock`(D-051)= GEN10 + GEN11

---

## 六、scout 四件验证(原则 #9)+ ranges 无嵌套(原则 #10)

| 验证项 | 结果 |
|---|---|
| (a) awk 列范围内所有 function | ✓ 已逐段 awk |
| (b) `grep -n "^}"` 验证每段最后函数真实 closing | ✓ 全部 16 段验证 |
| (c) build 脚本 banner 终止标记 | ✓ |
| (d) 主写口判定 + 业务语义优先 | ✓ setPrefect / succeedRuler 按业务语义 |
| (e) ranges 无嵌套 inclusion(原则 #10) | ✓ 16 段全部检查无嵌套 |

---

## 七、实装阶段 2 个 bug 修复

### bug 7.1:GEN2 to=985 + GEN3 to=2089 漏 closing

- GEN2 `addAptExp` closing 在 L986,我写 to=985 漏 1 行
- GEN3 `loyaltyDisplay` closing 在 L2092,我写 to=2089 漏 3 行

修复:GEN2 to=986,GEN3 to=2092。grep `^}` 验证(原则 #9b 应用)。

### bug 7.2:GEN13 to=7755 + GEN14 from=7757 跨 docstring 切片

- pre v181 L7747-L7752 是空行 + section header `// ⚔️ A5 武将韧性 ...`
- L7753-L7756 是 `checkWounded` 的 docstring
- L7757 是 `checkWounded` function

GEN13 to=7755 抽走 section header + docstring 起始 `/**`,但没抽 closing `*/`(L7756);GEN14 from=7757 没包含 docstring。结果 v181 留下 dangling `*/` → SyntaxError(`Unexpected token '*'`)→ inline script 不执行 → TECH_PREUNLOCK 未声明 → smoke FAIL。

**与 p3.11 bug 7.5 同类**:跨边界的 docstring 处理。

修复:GEN13 to=7746(applyBattleIntimacy 真 closing),GEN14 from=7749(包含 section header + docstring)。grep `^}` + 上下文 awk 验证(原则 #9b 应用)。

**沉淀**(原则 #9 补充):**ranges 边界跨 docstring 时,docstring 必须整段在某一 range 内,不能跨 range 切片**。否则 dangling `/**` 或 `*/` 会破坏 v181 inline script syntax。

---

## 八、PLAN §二偏离

PLAN 字面:~70 mutator + 30 D 类。
实装:**69 函数 + 11 const + _applyCeremony 归位**。
偏差小,scout-before-extract 第 12 次应用 + 四件验证 + 原则 #10 全部 PASS。

---

## 九、Phase 3 全局 carry-over 全部关闭

- ✅ **§3.4 backToTitle reset**:全 chain 抽离时 11 lets 跨文件迁移完成(p3.11)
- ✅ **§3.5 ethos 跨链消费**:phase 3.5+ 各 chain 通过 applyEthosShock hub
- ✅ **§3.6 gentry G5/G6 aftermath**:p3.6 已抽,p3.11 军事不反取
- ✅ **§3.7 政治写口副作用**:p3.7+ 各 chain 不反取
- ✅ **§3.8 trade 子组识别**:p3.9 直接抽
- ✅ **§3.9 经济 carry-over**:p3.10/p3.11 不反取
- ✅ **§3.10 事件 effects 写口**:Wave 3 起点已明确
- ✅ **§3.11 map.js carry-over**:p3.11 Commit 1 关闭
- ✅ **§3.11 ranges 嵌套 bug 教训(原则 #10)**:p3.12 应用,bug 7.2 修复后无问题
- ✅ **phase 2 _applyCeremony carry-over**:本 session GEN15 关闭

---

## 十、实测数据

| 项 | 起点(p3.11 末)| general.js 抽后 |
|---|---|---|
| project_romance_v181.html | 19427 | **17391** |
| src/chains/general.js | 0 | **2313** 行(~250 header + ~2063 verbatim)|
| src/render/ceremonies.js | 98 | **80**(删除 _applyCeremony 18 行 + 替换 placeholder)|

累计(phase 3 自 main 起):v181 39547 → 17391 = **-56.0%**(突破 -55% 大关 ✓)。

src/ 现状:14 文件(core 7 文件 4134 / chains 8 文件 15433)+ render 5 文件。
**Wave 3 收尾完成 + phase 3 chain 抽离全部完成**。

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.12 启动前) | 51 | ✅ identical |
| general.js + ceremonies.js 抽离后 | 51 | ✅ identical |

---

## 十一、phase 3.12 完成清单

- ✅ chains/general.js 抽离(15 段 v181 + 1 段 ceremonies.js,69 funcs + 11 const)
- ✅ _applyCeremony 从 src/render/ceremonies.js 归位(phase 2 carry-over close)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 6 项 header 模板完整(含写口归属声明 + triggerFactionEvent 闭环记录)
- ✅ 加载顺序规范(chains/general.js 在 chains/military.js 之后)
- ✅ phase 2 原则:武将数据 const + squad class + ceremony modal 留 v181/数据 sprint
- ✅ 16 hub-like 函数反向调用 (c) 原则容许
- ✅ 5 个武将相关 _exec 留 src/core/claude_ai.js(phase 3.3 选项 A)
- ✅ scout 四件验证 + 原则 #10 PASS,实装阶段 2 个 bug 修复(原则 #9 补充:docstring 不能跨 range 切片)
- ✅ **3 个补充记录**(triggerFactionEvent 闭环 / D-064 关联 D-065 / setPrefect 业务语义优先)
- ✅ **30 D 类位置文档化**(便于 sprint 定位)
- ✅ Phase 3 全局 carry-over 全部关闭
- ✅ **突破 -55% 大关 + Wave 3 收尾 + phase 3 chain 抽离最后一个**

---

## 十二、phase 3 chain 抽离全表(8 chain + map.js)

| Sub-session | Chain | 函数数 | v181 减重 | bug | 状态 |
|---|---|---|---|---|---|
| 3.5 | ethos | 5 | -98 行 | 0 | ✅ |
| 3.6 | gentry | 18 | -540 行 | 1(awk 边界)| ✅ |
| 3.7 | politics | 47 + 1 const | -825 行 | 1(手打 verbatim)| ✅ |
| 3.8 | diplomacy | 63 | -1379 行 | 4(scout 四件验证缺失)| ✅ |
| 3.9 | economy | 51 + 1 const | -1406 行 | 0 | ✅ |
| 3.10 | event | 8 | -326 行 | 0 | ✅ |
| 3.11 | map(36)+ military(120)| 156 | -7999 行 | 5(关键 bug 7.5 嵌套 ranges)| ✅ |
| 3.12 | general | 69 | -2036 行 | 2(漏 closing + docstring 跨切)| ✅ |
| **合计** | **8 chain + map.js** | **417** | **-22156 行** | **13** | **3.13 收尾** |

累计 phase 3 减重 **39547 → 17391 = -56.0%**。

---

## 十三、下一步:3.13 收尾 + 4-batch review(制作人介入)

phase 3 chain 抽离全部完成。3.13 是收尾 sub-session,制作人重新介入做 **4-batch review**:
- batch 1-4 待制作人定义
- 全量 smoke + phase summary + merge main
- 4(及以上)个本地遗留分支统一清理

phase 3.12 留给 3.13 的清单:
- 12 个本地遗留工作分支:p3.1 / p3.2 / p3.3 / p3.4 / p3.5 / p3.6 / p3.7 / p3.8 / p3.9 / p3.10 / p3.11-military / p3.12-general
- D 类位置文档化已完成,sprint 启动决策可用本 notes §五
- triggerFactionEvent 闭环 + D-064 关联 D-065 + setPrefect 业务语义优先 = 3 条 audit pass 2 / sprint 决策依据
