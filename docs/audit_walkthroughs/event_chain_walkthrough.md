# 事件链 · 大白话说明（对图 audit 用）

> 配套使用：`Project_Romance_Concept_Map_v6_4_events.html`（默认打开「事件链 v1.1」tab）
> 用法：对着图上的节点 ID（A1 / B4 / C6 / D1 / E9 等），在这份文档里找对应段落
> 这份文档**只讲逻辑和设计意图**，不抠数值（数值看节点 desc 或代码）

---

## v1.0 版本说明

事件链 v1.0 是 audit pass 1 的 Step 1+2+3 一次完成版本，与已审 7 链（经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 / 外交链 v1.1 / 价值观链 v1.1 / 豪族链 v4）命名同代。**36 节点 / 63 边 / 16 D 类全 verdict 锁定**（D-130~D-145）。

按制作人定的：
- **分区方案**：5 区方案 C（A 输入 / B 状态 / C 派生 / D 出口 / E 跨链）
- **节点颗粒度 A**（与已审 7 链对齐）
- **Q 决策**：Q3.1 EVENT_DEFS 34 def 按 8 categories 切分到 A 区（disaster 3/personnel 7/gentry 4/story 5/intel 4/diplomacy 4/daily 6/military 1）/ Q3.2 triggerFactionEvent 派系事件子系统单立 C6 节点（mirror 武将链 genFactionMod）/ Q3.3 _eventPromises 9 type 单 hub C4 / Q3.4 D 区按 8 目标链切分（武将/城市/价值观 mirror/经济/军事/外交/政治/豪族）/ Q3.5 playerOnly 不立独立节点（验证 Claude AI 永不接管玩家）/ Q4 派生长尾 6 字段并入 B5

---

## 系统总览（30 秒读完）

事件链是**游戏内"剧情触发"系统** — 每旬扫描 33 个事件定义（EVENT_DEFS），按 condition 判定是否触发，触发后让 AI 静默处理或弹窗给玩家选择。

它有 **3 个核心机制** + **2 个独立子系统** + **8 大输出簇**：

**3 个核心机制**：
- **EVENT_DEFS 主表**：34 def（33 events + 1 _sys 内嵌 / 1278 行 / 8 categories），每个 def 含 condition/narrative/choices/aiChoose 四件套 + cooldown/priority/oneTime/playerOnly/season 字段元数据
- **rollEventsV2 主扫**：每旬 nextTurn 16371 调用，gate（cooldown+oneTime+catCooldown+season）→ playerOnly 判定 → triggered.sort(priority) → AI 静默 vs 玩家弹窗分流
- **9 type 承诺机制**：某些事件选项给玩家"3 旬内做 X"承诺，到期不履约则惩罚（B1_deploy/B1_office/B3_office/B4_delayed/C2_office/C3_office/C4_unrest/G7_deploy/G7_office）

**2 个独立子系统**：
- **EVENT_DEFS 系统**（C1 主扫 + C2-C5 配套函数）：用户可见事件，含弹窗/选项/承诺
- **triggerFactionEvent 系统**（C6 单立）：8 eventType（execute/defectorPrefect/conquer/truce/warDeclare/betray/appointPost/removePost）→ 写 G.genFactionMod，被 14 处其他链 caller 调用

**8 大输出簇**（D 区按目标链切分）：
- **D1 武将链**：107 写口（genLoyalty 84+genFactionMod 13+intimacy 6+statExp 4，事件链最大写口源）
- **D2 城市状态**：58 写口（c.morale/storage/pop/gentry/popQuality/garrison/siegeDecay/_plague/_grainBonus）
- **D3 价值观链 mirror**：33 applyEthosShock（已在价值观链 audit verified）
- **D4 经济链**：22 写口（safeSub fac.res + res.gold +=）
- **D5 军事链**：22 处 G.units（主要 sq.morale 7 写）
- **D6 外交链**：14 写口（reputation 7+addDiplo 5+G.diplo 2）
- **D7 政治链**：10 写口（courtDecrees 4+appointGenPost 3+setPrefect 3）
- **D8 豪族链**：4 处 calcFactionInfluence read（实际是读，写口归 D2 城市）

**输入因子**（A 区）8 个：8 categories EVENT_DEFS（disaster 3 / personnel 7 / gentry 4 / story 5 / intel 4 / diplomacy 4 / daily 6 / military 1 + 元数据汇总）。

**实体状态**（B 区）5 个：B1 冷却簇（_eventCooldown + _eventCatCooldown）/ B2 队列簇（_eventQueue + _pendingEvent）/ B3 一次性记录（_eventFired）/ B4 承诺数组（_eventPromises 9 type）/ B5 派生长尾簇（6 字段：_poachVulnerable / _factionLoyaltyDecay / _juxiaolianBonus / _threatBonus / c._plague / c._grainBonus）。

**派生函数**（C 区）6 个：C1 rollEventsV2 主扫 / C2 玩家弹窗对（7 函数）/ C3 processEventCooldowns 冷却 hub / C4 checkEventPromises 承诺 hub / C5 processPlagueSpreads 疫病扩散 / C6 triggerFactionEvent 派系事件子系统。

**外部输入 / 跨链**（E 区）9 个：E1 政治链（7 入 + 10 出）/ E2 外交链（4 入 + 14 出，**D-131 HIGH 主战场**）/ E3 军事链（1 入 + 22 出）/ E4 武将链（1 入 + 107 出，**D-133 HIGH wildPool**）/ E5 称帝链（1 入语义偏离）/ E6 价值观链 mirror / E7 经济链 / E8 豪族链 / E9 Claude AI（**D-130 MEDIUM**：getGameState 缺事件状态）。

---

## 主流程（每旬事件链相关跑什么）

每旬 `nextTurn` 内**事件链相关步骤**按顺序：

1. **`processEventCooldowns()`** @ 16336 — `G.turn++` 之后立即执行，递减所有 cooldown
2. （其他 process_xxx：经济/建造/转运 etc）
3. **`rollEventsV2()`** @ 16371 — 主扫 33 events × 4 势力 = 132 候选，gate 后触发
4. **`processPlagueSpreads()`** @ 16372 — plague 事件后续扩散 sub-tick
5. **`checkEventPromises()`** @ 16373 — 9 type 承诺履约/到期/惩罚
6. （其他 process_xxx：runAI/价值观漂移/checkElimination 等）

**关键观察**：事件触发在 checkElimination（16535）之前 → 灭国势力当旬仍可触发事件（D-134 LOW，horse_trader 可能在灭国势力上误触发）。

**事件 → 价值观链 反馈环**：rollEventsV2 → applyEthosShock → 下旬 processFacEthos → ethos 影响下旬事件 condition 判定（如 quanjin_biao mandate gate）。1 旬延迟。

---

## A 区 · 输入因子（8 节点 — 8 categories）

### A1 — disaster (3 灾害)
8389-8531：drought / plague / flood。秋/夏季节限制，5-8% 触发概率。**playerOnly 字段未设 → AI 势力共享触发**。aiChoose 用 AI_PERSONALITY.diploAggro 决策。

### A2 — personnel (7 武将事件)
8532-10336（分散）：gen_restless / gen_conflict / gen_overpowered / gen_referral / warrior_rivalry / defector_test / reckless_trouble。**全 playerOnly:true**。push 6 type 承诺。**D-133 HIGH**：gen_referral push B4_delayed 后被 checkEventPromises 静默清除（"考察再议 3 旬后自动加入"完全失效）。**D-145 LOW**：gen_referral 8834 设 `_eventCooldown['gen_referral_'+wName]=6` 写后永不读（"婉拒武将 6 旬不再来投"死代码）。

### A3 — gentry (4 豪族事件)
8849-9211：gentry_offer / gentry_pressure / humble_complaint / gentry_unrest。全 playerOnly:true。push 4 type（C2_office/C3_office/C4_unrest）。calcFactionInfluence read 4 处。

### A4 — story (5 剧本事件)
9212-10478（分散）：general_ceremony / bronze_tower / chu_shi_biao / quanjin_biao(playerOnly:false) / return_emperor(playerOnly:false)。3 oneTime:true + 1 软 oneTime + 1 普通。**D-135**：general_ceremony 软 oneTime 模式（设计意图）。**D-140**：4 oneTime 选"暂缓"=永远拒绝（设计意图）。**D-143 LOW fix**：return_emperor showNotif 无 gate + log 文案"主公"语气在 AI 触发时玩家困惑（quanjin_biao 同问题）。

### A5 — intel (4 情报事件)
9385-9596：scout_report / lure_ambush / supply_crisis / enemy_starving。全 playerOnly:true。读 G.units status + 敌方位置。

### A6 — diplomacy (4 外交事件)
9597-10252（分散）：envoy_visit / distant_alliance / three_kingdoms_settled(oneTime) / propaganda_war。全 playerOnly:true。distant_alliance 写 G._threatBonus（B5 派生长尾）。

### A7 — daily (6 日常事件)
9806-10602（分散）：scholar_visit / refugee_influx / harvest_bounty / horse_trader(playerOnly:false) / anti_corruption / juxiaolian。harvest_bounty 写 c._grainBonus。juxiaolian 写 G._juxiaolianBonus。**D-134 LOW**：horse_trader 9984 仅查 rebel 不查 _eliminated → 灭国势力上仍可能触发，浪费 CPU。

### A8 — military (1) + EVENT_DEFS 元数据
flood_siege 10603-10659（playerOnly:false）。EVENT_DEFS 数组定义 8386-10659（34 def）+ 元数据字段（cooldown/priority/oneTime/playerOnly/season/category）汇总。**D-141 LOW**：catCooldown=3 硬编 4 处。**D-138 LOW defer**：cooldown 全局而非势力维度（7 个非 playerOnly 事件一旬内可在多势力触发但下旬全压住）。

---

## B 区 · 实体状态（5 节点）

### B1 — _eventCooldown + _eventCatCooldown 冷却簇
6326-6327 init。两个字典：单事件 cooldown（`{eventId: 剩余旬数}`）+ 同 category cooldown（`{category: 3}`）。每旬递减。设值 4 路径（AI 静默/玩家快进/玩家弹窗/全局快进），gate 2 处（rollEventsV2 10901+10905）。

### B2 — _eventQueue + _pendingEvent 队列簇
6330+6332 init。**D-137 MEDIUM fix**：_eventQueue 是死代码 — rollEventsV2 push 但 _popEventQueue 全代码 0 调用。多事件并发玩家只看 first，其余永久丢失（同 category 被 catCooldown 压制覆盖；不同 category 队列内存泄漏）。**D-139 LOW**：_popEventQueue 重新验证仅查 city.fac，不查 gen 仍在势力（死代码 → 无副作用，D-137 fix 时附带处理）。

### B3 — _eventFired 一次性记录
6329 init `{eventId: turn}`。oneTime 事件触发后写入。5 写口 + 2 读口（condition 自检 9215 + rollEventsV2 gate 10903）。loadGame 34154 类型校正。

### B4 — _eventPromises 承诺数组（9 type）
6328 init []。9 type：B1_deploy/B1_office/B3_office/**B4_delayed**/C2_office/C3_office/C4_unrest/G7_deploy/G7_office。push 10 处全在 EVENT_DEFS effect 内。**D-133 HIGH fix**：B4_delayed 在 checkEventPromises 10733 静默清除（gen 是在野武将不在 G.generals[fid]） → 永远到不了 10848 wildPool 加入分支。

### B5 — 派生长尾簇（6 字段）
事件 effect 写入的"长尾状态"（多旬持续）：G._poachVulnerable（挖角脆弱）/ G._factionLoyaltyDecay（派系忠诚衰减）/ G._juxiaolianBonus（察举 bonus）/ G._threatBonus（威胁加成）/ c._plague（疫病 flag）/ c._grainBonus（丰年粮产）。3 G 级 + 2 city 级共 6 字段。所有 G 级写前都有 `if(!G._xxx) G._xxx={}` 防御 → 旧存档兼容良好。

---

## C 区 · 派生函数（6 节点）

### C1 — rollEventsV2 主扫 hub
10891-10967。每旬调用。流程：① EVENT_DEFS.forEach gate（global cooldown + oneTime + catCooldown + season）→ ② facs.forEach（playerOnly 跳 AI）+ condition 触发判定 → ③ triggered.sort(priority) → ④ AI 静默路径（aiChoose+effect+cooldown）→ ⑤ 玩家路径（first 弹窗 + 其余 push queue）。

**多个 D 类汇集**：
- **D-134 LOW fix**：facs 用 ALL_FACS 不查 _eliminated
- **D-137 MEDIUM fix**：queue push 后无 popEventQueue 调用（死代码）
- **D-138 LOW defer**：cooldown 全局非势力维度
- **D-139 LOW**：_popEventQueue 验证不全（死代码 → 无副作用）

### C2 — 玩家弹窗对（7 函数）
10970-11108：_popEventQueue（死代码）/ _showEventToPlayer / resolveEventChoice / _applyCeremony（拜将大典执行）/ _showCeremonyPicker（多选弹窗）/ _updateCeremonyBtn / _confirmCeremony。

**D-132 LOW fix**：nextTurn 全局快进路径 16588-16603 缺 log 调用，与 AI 静默/玩家弹窗/rollEventsV2 内快进三路径不一致。

### C3 — processEventCooldowns 冷却 hub
10664-10675。`G.turn++` 之后立即调用，先于 rollEventsV2。简单递减所有 cooldown，<=0 删除。逻辑正确，顺序正确。

### C4 — checkEventPromises 承诺 hub
10719-10888。流程：履约 filter（7 type case + C4_unrest 特殊 + **B4_delayed 漏**）→ 履约日志 → 提醒 deadline-1 → 合并提醒弹窗（_sys 内嵌 _promise_reminder）→ expire filter → expire 处理（C4_unrest 暴动+_sys _c4_riot / B4_delayed wildPool 加入 / default penalty）→ 惩罚日志。

**D-133 HIGH fix**：10733 `if(!gen) return false` 把 B4_delayed 静默清除（在野武将不在 G.generals[fid]） → "B4_delayed wildPool 加入"分支死代码。"考察再议 3 旬后自动加入"功能从 v130 引入起就完全不工作。

### C5 — processPlagueSpreads 疫病扩散
10678-10716。处理 plague 事件后续扩散：找 c._plague.hopsLeft>0 城 → 30% 概率向邻城扩散 → AI 城市自动处理（diploAggro+gold）→ delete 当前城 _plague flag。

**D-136 LOW verified-with-notes**：扩散到玩家城无 showNotif 通知（仅普通 log）。玩家邻城被扩散后吃完损失，玩家完全无感。UX 改进而非 bug。

### C6 — triggerFactionEvent 派系事件子系统
5658-5715。**独立子系统**（不属 EVENT_DEFS）。8 eventType：execute/defectorPrefect/conquer/truce/warDeclare/betray/appointPost/removePost。流程：对 G.generals[fid]（排除 ruler）.forEach 按 eventType+tags 计 delta → 写 G.genFactionMod ±20 clamp + push genFactionModLog cap 8。

**14 调用点跨链分布**：政治链 7 / 外交链 4 / 军事链 1 / 武将链 1 / 称帝链 1。

**D-131 HIGH fix**（本链 HIGH 之一）：覆盖率不全：
- **truce**：14073-14074 hub 双向 ✓ / 14274 玩家结盟 modal 单向 ❌ / 16243 自动结盟 ❌ / _execProposeAlliance 37498 ❌
- **warDeclare**：仅 15590 称帝路径触发（语义偏离）/ **14327/14447/14462/14540/16251/_execDeclareWar 37466/9648 全部缺失** ❌
- **betray**：14339 玩家 ✓ / 14547 AI 路径 ❌ / _execDeclareWar 37472 ❌
- **conquer**：27949 标准攻城 ✓ / 15989 豪族开城迎降 ❌

**根因**：v130 引入 triggerFactionEvent 时未做完整推广。与外交链 D-104/D-113（v179fix P15）+ 武将链 D-066 等"重构推广不彻底"模式同源。

---

## D 区 · 状态出口（8 节点，按目标链切分）

**重要：D 区按目标链切分**（与价值观链按维度切分不同）。原因：事件链 effect 写口分散（295 处），按目标链聚类最清晰。

### D1 — 武将链出口（综合）
107 写口：genLoyalty 84+genFactionMod 13+intimacy 6+statExp 4。辅助：addGenChronicle 7+wildPool 改 1+G.generals push 1。**事件链是武将链最大写口源**。**D-131 HIGH 间接**（C6 漏 → genFactionMod 不更新）+ **D-133 HIGH 间接**（B4_delayed 武将永不加入 G.generals）。

### D2 — 城市状态出口
58 写口：c.morale 18 / c.gentry 15 / c.pop 8 / c.storage 7 / c.popQuality 6 / c.garrison 1 / c.siegeDecay 1 / c._plague 1 / c._grainBonus 1。事件对城市冲击大。

### D3 — 价值观链出口（mirror）
33 处 applyEthosShock。**Mirror 价值观链 v1.1 E2 入边**已 verified。

### D4 — 经济链出口
22 写口：safeSub fac.res + res.gold +=（gentry_offer 资助 / horse_trader 售马等）。

### D5 — 军事链出口
22 处 G.units（主要 sq.morale 7 写，15 处 read filter）。chu_shi_biao 全军士气+10 / general_ceremony 全军士气+5 等。**无 push/splice 增删**（invalidateCache 不需）。

### D6 — 外交链出口
14 写口：G.reputation 7（propaganda_war 等 ±）+ addDiplo 5 + G.diplo 2（distant_alliance）。**D-131 HIGH 间接** + **D-144 LOW defer**（reputation 默认值 7 处硬编）。

### D7 — 政治链出口
10 写口：courtDecrees push 4 + appointGenPost 3 + setPrefect 3。事件 effect 内自动执行政治动作。

### D8 — 豪族链出口
4 处 calcFactionInfluence **read**（用于派系判定，写口在 D2 城市状态 c.gentry）。

---

## E 区 · 跨链（9 节点）

### E1 — 政治链（7 入 + 10 出）
**入边**：triggerFactionEvent caller 7 处（任命/卸任 + setPrefect/setStrategist）。**出边**：D7 政治链出口 10。verified-mirror 政治链 v1.1。

### E2 — 外交链（4 入 + 14 出 + helper read 13）
**入边**：truce 3 + betray 1 = 4。**出边**：D6 外交链出口 14。**helper read**：G.diplo + getDiploStatus → 事件 condition 13 read。**D-131 HIGH 主战场**。

### E3 — 军事链（1 入 + 22 出 + helper read 22）
**入边**：conquer 1（27949）。**出边**：D5 军事链出口 22。**helper read**：G.units status → 事件 condition 22 read。

### E4 — 武将链（1 入 + 107 出 + helper read 60）
**入边**：execute 1（23066）。**出边**：D1 武将链出口 107。**helper read**：GEN_TAGS 26 + wildPool 5 + generals 29 = 60。**D-131 HIGH（execute 路径）+ D-133 HIGH（wildPool B4_delayed）**。

### E5 — 称帝链（语义修正 + helper read 2）
**入边 1（语义偏离）**：15590 doEnthrone 内 ALL_FACS.forEach → triggerFactionEvent('warDeclare', f, {})（他国鹰派激活）。**注意**：这是称帝链调用 C6 子系统，不是真正的"事件链入边"语义。**helper read**：G.emperor → 事件 condition 2 read（return_emperor/quanjin_biao 持有天子判定）。

### E6 — 价值观链（mirror + helper read 7）
**出边 33**：D3 mirror 价值观链 v1.1 E2 入边已 verified。**helper read**：G.factions[fid].ethos → 5 ETHOS aiChoose（quanjin_biao/return_emperor/anti_corruption/juxiaolian/flood_siege）+ condition gate 7 read。

### E7 — 经济链（出 22）
22 出口（fac.res 修改），无入边。verified-mirror 经济链 v4.3。

### E8 — 豪族链（出 4 + helper read 4）
4 出口属 read（calcFactionInfluence 用于派系判定）。helper read 4 处分布在 humble_complaint/gentry_offer/gentry_pressure/anti_corruption。

### E9 — Claude AI（**D-130 MEDIUM defer**）
**discrepancy** 状态。getGameState @ 36374-36679 305 行函数体**零事件状态引用**。_claudeSystemPrompt @ 36681-36941 264 行**零事件上下文**（`recent_events` 字段 36283 来源 war_journal 不是 EVENT_DEFS，命名歧义）。_exec 派发器 42 case **无 event_choice/resolveEventChoice 处理**。executeClaudeActions ORDER 表 37171 含 `event_choice:8 / court_choice:8` 但派发器无对应 case → **死代码字段**。

**结果**：Claude AI 接管 AI 势力（13413 `fid !== G.playerFac`，永不接管玩家）遇事件时由 hardcoded aiChoose（用 AI_PERSONALITY 而非 Claude 决策）静默处理，且 Claude 在做战略决策时不知道本势力近期发生过疫病/灾荒/暗杀等事件。

**修法**：(1) 新建 G._eventLog 数组 push {turn, eventId, choiceId, fid}；(2) getGameState 增 recent_events 输出；(3) prompt 加 1-2 句说明"事件由系统自动按人格处理，仅做战略决策时参考"。

**defer 理由**：fix 需要新建事件日志状态，属功能性新增不在 audit 修复范围。

**同源**：外交链 D-099（prompt 缺 _exec 指令）+ 价值观链 D-121（getGameState 缺 ethos）模式 — 'Claude AI 信息缺失'类型。

---

## D 类完整清单（D-130~D-145，16 项）

| ID | 严重度 | verdict | 核心议题 |
|---|---|---|---|
| D-130 | MEDIUM | defer | Claude AI 接管时 getGameState 不含事件状态 + ORDER 表 event_choice 死代码 |
| **D-131** | **HIGH** | **fix** | **triggerFactionEvent 调用覆盖不全（truce/warDeclare/betray/conquer 多路径漏）** |
| D-132 | LOW | fix | nextTurn 全局快进路径缺 log |
| **D-133** | **HIGH** | **fix** | **B4_delayed 承诺机制完全失效（push 后立即被静默清除）** |
| D-134 | LOW | fix | rollEventsV2 facs 不查 _eliminated（horse_trader 受影响） |
| D-135 | LOW | verified-with-notes | general_ceremony "软 oneTime" 模式（设计意图） |
| D-136 | LOW | verified-with-notes | 疫病扩散到玩家城无主动通知（UX 改进） |
| D-137 | MEDIUM | fix | _eventQueue 死代码（玩家事件永久积压） |
| D-138 | LOW | defer | 事件 cooldown 全局非势力维度（架构债） |
| D-139 | LOW | verified-with-notes | _popEventQueue 验证仅查 city.fac（D-137 fix 时附带处理） |
| D-140 | LOW | verified-with-notes | oneTime:true 4 story 事件"暂缓"=永远拒绝（设计意图） |
| D-141 | LOW | verified-with-notes | catCooldown=3 硬编 4 处（架构债） |
| D-142 | LOW | verified | c._plague hopsLeft 链合理 |
| D-143 | LOW | fix | return_emperor showNotif 无 gate + log 文案"主公"语气 |
| D-144 | LOW | defer | G.reputation 默认值硬编 7 处（架构债） |
| D-145 | LOW | fix | gen_referral 婉拒冷却 key 写后永不读（死代码） |

**HIGH 2 / MEDIUM 2 / LOW 12 = 16。fix 8 / defer 3 / verified-with-notes 4 / verified 1。**

**HIGH 集中规律**：D-131 + D-133 都是 v130（事件系统重构）引入新机制时**推广不彻底** ——
- D-131：triggerFactionEvent 应在所有 status 变化点触发，但只覆盖了一部分路径
- D-133：B4_delayed 创建路径与 checkEventPromises 履约 case 链脱节，承诺类型未在 case 链中处理

与外交链 D-104/D-113（v179fix P15 系列）+ 武将链 D-066 等"重构推广不彻底"模式同源。

---

## 与已审 7 链对比

| 链 | D 类 | HIGH | MEDIUM | LOW | 节点 | 边 |
|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | ~95 |
| 豪族链 v4 | 12 | - | - | - | ~37 | ? |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | ? |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | ? |
| 政治链 v1.1 | 15 | 3 | 5 | 7 | 45 | 90 |
| 外交链 v1.1 | 31 | 5 | 13 | 13 | 51 | 118 |
| 价值观链 v1.1 | 9 | 1 | 1 | 7 | 27 | 47 |
| **事件链 v1.1** | **16** | **2** | **2** | **12** | **36** | **63** |

**事件链特点**：
- **D 类总数 16，居中**（少于外交/武将/军事/政治，多于经济/豪族/价值观）
- **HIGH 2 个**（D-131 / D-133）— 都是 v130 重构推广不彻底
- **节点 36 / 边 63**，hub 集中度高（C1 + C6 双 hub）
- **跨链 effect 写口最密**（295 处）— 事件链是其他链最大的事件源

---

## 设计巧思汇总（非 bug，值得记录）

1. **双 hub 架构**：C1 rollEventsV2 主扫（用户可见 EVENT_DEFS 系统）+ C6 triggerFactionEvent（独立 8 eventType 子系统）。两个 hub 互不干扰，分工清晰。

2. **9 type 承诺机制**：让某些事件选项有"3 旬内做 X"的延迟惩罚（如 gen_restless"答应将来上阵"），增加事件后续张力。但 v130 引入时 B4_delayed 推广不彻底（D-133 HIGH）。

3. **D 区按目标链切分**：与价值观链按维度切分不同，事件链 effect 写口分散到 8 链，按目标链聚类最清晰。

4. **AI 静默 vs 玩家弹窗分流**：rollEventsV2 内 fid===G.playerFac 判定 forPlayer，AI 走 hardcoded aiChoose，玩家弹窗。playerOnly:true 字段进一步过滤（26/33 events 仅玩家）。

5. **catCooldown=3 旬"喘口气"**：避免轰炸玩家。但同 category cooldown 也压住其他事件，多事件并发场景体验受限（与 D-137 死 queue 叠加）。

6. **派生长尾 6 字段**：事件影响延续多旬（_juxiaolianBonus 下次在野+2 / _threatBonus 威胁加成 / c._grainBonus 永久粮产 / c._plague 扩散链 / etc）。让事件不只是单旬冲击。

7. **EVENT_DEFS 数据驱动**：34 def 数组 + 字段元数据（cooldown/priority/oneTime/playerOnly/season/category），rollEventsV2 仅扫描 + gate，无硬编逻辑。新增事件只需 append def。

---

## 工作流方法论沉淀（基于 8 链 audit）

继承 §二〇九.11 / §二一〇.8 / §二一一.11 / §二一二.10 / §二一三.8 / §二一四.8 方法论，本轮新增：

### 9.1 双 hub 链审计要分两阶段
事件链有 EVENT_DEFS 系统（C1 主）+ triggerFactionEvent 系统（C6 单立）两个独立 hub。**审计经验**：双 hub 链审 stage 2 hub 完整性时分两阶段，先核 hub 内部完整性，再核两 hub 间接口（如 EVENT_DEFS effect 是否调 triggerFactionEvent — 不调，独立子系统）。

### 9.2 重构推广不彻底是 HIGH 集中点
事件链 2 HIGH（D-131 / D-133）+ 外交链 D-104/D-113 + 武将链 D-066 等都是"v130 / v179fix P15 等大重构"引入新机制时未做完整推广。**审计经验**：每次大重构后应做"接口完整性回归 audit" — 列出新机制所有应调用的 caller，逐个核实。可建自动化检查工具（如 grep `d.status='ally'` 全代码 → 核每处是否调 `triggerFactionEvent('truce')`）。

### 9.3 死代码识别五要素
事件链发现 3 处死代码（D-137 _eventQueue / D-133 B4_delayed wildPool / D-145 gen_referral_${wildName}）。**审计经验**：死代码识别看 5 要素：① 字段被 init 否；② 被 push/写入否；③ 被 shift/读取否；④ 写口与读口在同一 closure 内还是跨函数；⑤ key 命名是否一致（如 `gen_referral_${wildName}` 写但 `def.id` 读，名字不匹配）。

### 9.4 跨链 helper-read 边补边经验
本链 stage 6 补 6 dashed 边（E2/E3/E4/E5/E6/E8 → C1）。比价值观链补 5 多。**审计经验**：每个主扫 hub 函数（rollEventsV2 / processFacEthos / applyWarDeclarationEffects 等）若 condition/effect 读多链状态，补 helper read 入边。事件链 condition 读跨链最频繁（GEN_TAGS 26 + G.units 22 + G.diplo 13 + G.cities 40），补边数随 condition 复杂度递增。

### 9.5 Claude AI 信息暴露面跨链共通弱点
D-130（事件链）+ D-121（价值观链）+ D-099/D-100（外交链）= 已审 8 链中 4 个 D 类集中在 Claude AI 路径。**审计经验**：每条链 audit 时必看 getGameState/prompt/_exec 派发器三处 — 子系统暴露 / 指令接口 / 派发完整性。事件链 D-130 还发现 ORDER 表 37171 含 event_choice 死代码字段，**补充检查项**：派发器 case 列表 vs ORDER 表字段对账。

### 9.6 节点 desc 数值偏差是常见 stage 5 发现
本轮 stage 5 发现：A 区 desc 写"line 范围"误导（事件 category 在 EVENT_DEFS 中交叉分布）+ C2 desc 应含 7 函数（漏 _updateCeremonyBtn/_confirmCeremony）+ D 区写口数把 read 误算 write（D1 武将 148→107，D6 外交 24→14，D7 政治 16→10）+ B 区 B5 漏 c._grainBonus（5→6 字段）+ E5 称帝链定位语义偏离。**审计经验**：Step 1 反向 grep 数节点时 line/call/read/write 容易混。stage 5 节点级模糊用更精确的 awk/python 区间精数 + 区分读写。

### 9.7 fastForward 路径独立审计
事件链有 4 路径处理事件（AI 静默 / 玩家弹窗 / rollEventsV2 内快进 / nextTurn 全局快进）。**审计经验**：玩家事件类系统须核所有快进/批处理路径与正常路径的一致性（cooldown 设值/oneTime 标记/log 写入是否对齐）。本轮发现 D-132 nextTurn 全局快进路径缺 log。

---

## 不做的事（再次重申）

- ❌ 不动游戏代码（包括 16 个事件链 D 类的 8 个 fix verdict）
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 / 外交链 v1.1 / 价值观链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节（本节追加为 §二一五）
- ❌ 不混改多个 D 类（代码 sprint 时一个 D 类对应一个 commit）

---

## 下个对话指引

**继承的素材**：
- 事件链 v1.1 三件套（JSON / 概念图 v6.4 / walkthrough v1.0）
- 16 个事件链 D 类全部定性，不重审
- 8 链工作流方法论（§二〇八+§二〇九.11+§二一〇.8+§二一一+§二一二+§二一三+§二一四+本节）
- **D 类清单累计 137 个跨链净 D 类**（121 已审 7 链 + 事件链净 16 = 137。已审 8 链）

**新对话启动**：**8 链 audit pass 1 全部完成 ✅** — 下一步可启动**代码 sprint**（按 D 类清单逐项修复）。

**代码 sprint 启动建议**：
- **先修 HIGH（按链先后）**：经济 0 / 豪族 ? / 军事 6 / 武将 10 / 政治 3 / 外交 5 / 价值观 1 / 事件 2 = 27 HIGH 个 commits
- **MEDIUM 跨链 close 先并修**：D-122（外交 D-095 = 价值观 D-122）等
- **defer 类延后**：架构债集中重构（D-123 / D-138 / D-141 / D-144 / G.reputation 默认值等中央 const 化）
- **verified-with-notes / verified 不修**：约 30 个仅文档化记录

**自动化检查工具建议**（基于 8 链 audit 经验）：
1. **Claude AI 暴露面 checker**：getGameState 字段 vs prompt 提及 vs _exec 派发器 三处一致性
2. **状态变化点 checker**：列出所有 `d.status=` 写口 → 核每处是否触发对应的 triggerFactionEvent
3. **承诺履约 case 链 checker**：列出所有 `_eventPromises.push({type:...})` 的 type → 核 checkEventPromises filter case 是否覆盖
4. **死代码 checker**：列出所有 G._xxx 写入但 0 读取 / 写入名 mismatch 读取名 的字段

---

(本 walkthrough v1.0 完结)
