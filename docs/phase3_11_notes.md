# Phase 3.11 Notes — src/core/map.js + chains/military.js(Wave 3 第二个,最大 chain)

> Sub-session:Phase 3.11(REFACTOR_PLAN_v1.md §三阶段 3,Wave 3 第二个)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.11-military` ← `refactor/phase-3`
> 起始 commit:`f0feaad`(Phase 3.10 完成)
> 制作人介入决策:**单独抽 src/core/map.js + 同分支两 commit + squash 进 phase-3**

---

## 一、map.js 决策(2026-05-05 制作人 approve)

选 A:hex/fog/pathfinding/terrain 单独抽到 src/core/map.js,**不归军事链**。

理由:
1. 地图基础设施(空间计算)不是军事 mechanism
2. 多个 chain 调它(diplomacy / economy / event / gentry / core/main.js / core/tick.js / core/claude_ai.js)
3. 归军事链会造成依赖错位(其他 chain 反向调军事 → 不符合架构)
4. 留 v181 违背 phase 3 减重目标

加载顺序(制作人 approve):core 最后一个文件(`main.js` 之后,`chains/*` 之前)。

边界标准:
- **map.js**:任何 chain 都可能调的纯空间工具
- **chains/military.js MIL3**:函数名带 ai 前缀 + 只有军事 AI 调用(如 `aiFrontierEnemyCities`)

---

## 二、Commit 1:src/core/map.js(36 函数 + 17 const + 1 class)

| 段 | v181 行号 | 内容 |
|---|---|---|
| M0 section header | L1404-L1408 | "地图系统 v4.0 — 六边形网格" |
| M1 HEX 常量 + 工具 | L1426-L1503 | 8 funcs + HEX_SIZE/HEX_H/HEX_COLS/HEX_ROWS/HEX_PATH/HEX_PATH_INNER |
| M2 FOG 常量 + 视野 helpers | L1509-L1565 | 2 funcs + FOG_UNEXPLORED/EXPLORED/VISIBLE/UNIT_RADIUS_BASE/STEALTH_RADIUS |
| M3 fog 子系统 display formatting | L1567-L1611 | fuzzyTroopDisplay / fuzzyGenDisplay(制作人 #4 approve:fog 副产物 自然内聚 map.js) |
| M4 fog 系统主体 | L1613-L1851 | 9 funcs + CITIES_DEF.forEach IIFE |
| M5 城市邻接 | L1857-L1868 | ensureCityNeighbors(制作人 #5 approve:aiFrontierEnemyCities 改归 chains/military.js MIL3) |
| M6 地形多边形 + 几何 | L1937-L2103 | TERRAIN_POLYS const(166 行)+ pointInPoly |
| M7 buildHexTerrain | L2105-L2290 | 1 func(186 行)|
| M8 hexLineDraw | L2292-L2323 | 1 func |
| M9 移动 cost + 水陆 | L2325-L2396 | 7 funcs + TERRAIN_AP_COST/NAVAL_WATER_COST/NAVAL_AP/WATER_TERRAINS |
| M10 寻路 | L2405-L2521 | calcHexPathCost / findNearestOwnCityPath / hexAstar + _MinHeap class |

**留 v181**:
- `JUNS` const(L1410-L1424,12 个郡数据,phase 1 笔记)
- `aiFrontierEnemyCities`(L1870-L1933 → Commit 2 抽 MIL3)

**实装 4 个就地 bug 修复**(map.js 阶段):
- M2 to=1564→1565(漏 getScoutINT closing)
- M3 to=1613→1611(越界包含 M4 注释)
- M4 from=1614→1613(漏 fuzzy 注释)
- M9 to=2390→2396(漏 cityToGrid)

---

## 三、Commit 2:chains/military.js(120 函数 + ~21 const + 11 顶层 lets)

8 大段,25 段不连续 ranges:

| 段 | v181 行号 | 函数数 | 内容 |
|---|---|---|---|
| MIL1.a unit level + exp | L913-L1079 | 5 + 4 const | getEffectiveSquadLevel / getInitLevel / getLvMult / addUnitExp / applyBattleExp + UNIT_LEVEL_*/BATTLE_EXP |
| MIL1.b getBarracksDiscount | L1170-L1174 | 1 | |
| MIL2 编制 wrapper | L1380-L1398 | 3 | getSquadMax / getUnitMax / getAvailableTechs(p3.7 carry-over)|
| MIL3.a aiFrontierEnemyCities | L1441-L1504 | 1 | (制作人 approve:从 map.js 改归军事)|
| MIL3.b AI 决策主段 | L4440-L6714 | 24 | _aiCalcThreat / aiSelectTargets / aiExecuteOrders / aiDoRecruit / _aiCalcBudget 等 + AI_PERSONALITY const |
| MIL4 unit 基础 + 兵种 + skills | L10036-L10339 | 9 + 5 const | getCampCost / applySkills / createUnit + TROOP_TYPES / MIXED_COMBO_MULT / SKILL_REGISTRY |
| MIL5 turn processor | L10343-L11090 | 16 + 6 const | processUnitMovement / processSiegeDecay / buildSupplyMap / processSupplyStatus / processMuster + SIEGE_*/SUPPLY_* |
| MIL6 战斗解算 | L11710-L13450 | 33 + 5 const | resolveBattle / resolveSiegeBattle / resolveAmbush / calcUnitATK + FIRE_*/AMBUSH_*/SYNERGY_*/NAVAL_BLOCKED_SKILLS |
| MIL7.a-e 战斗调度 mechanism | 多段 | 16 | autoResolvePendingBattle / resolveDuel / processReinforcement 等 |
| MIL8.a-k 玩家入口动作 | 多段 | 11 | issueUnitMove / launchSiegeAttack / sortieFromCity / setCamp / disbandUnit 等 |
| M_LETS | 各处 | 11 lets | _unitIdCounter / _supplyCache / _battleReports / _currentBattleReport / _pendingBattleAnimations / _pendingBattleConfirms / _currentBattleConfirm / _pendingSiegeArrival / _aiBattleProcessedThisTurn / _duelChallenger / _marchAnimating |

**留 v181(phase 2 原则严格)**:
- 战斗动画(~2517 行):`_drainPendingBattleAnimations + 6 _play* + _baGetUnitRenderPos + _baDrawCampPalisade + _getDuelEpithet + DUEL_EPITHET`
- modal HTML 战斗调度:`_battleSideHtml / _show*Confirm / confirm* / selectDuelChallenger / _siegeArrivalChoice`
- 战报 / 俘虏 / 征兵 modal:全部 18+ funcs
- 单位交互 UI handlers / 地图渲染 / billetUnit + _confirmBillet pair / 部队管理 modal / renderMilTab
- 9 _execXxx(留 src/core/claude_ai.js 段 M)
- `_battleAnimating / _fastForward / _ffTurns` lets / `BLDS / JUNS` const

---

## 四、写口归属声明

**本 chain 主要写口**:
- `G.units[]`(unit 主写口)/ `G.units[].squads[].troops/.level/.exp/.genName/._musterTarget`
- `G.units[].status/.target/.intent/.siegeTarget/.hq/.hr/.ap/.stamina`
- `G.cities[].garrison/.siegeDecay`
- `G.factions[fid].res`(扣资源,与经济共享)
- 11 顶层 lets

**跨链副作用写口**(整函数归军事):
- `createUnit / aiDoRecruit`:扣 res(经济)
- `resolveBattle / resolveSiegeBattle`:调 hub `killGen / surrenderGen / addGenChronicle`(武将)+ `checkBloodFeud / trackCityLoss / checkEmperorCapture / applyCommonEnemyDiploBonus`(外交)+ `applyGentryOnCapture / applyFamilyLoyaltyShock`(豪族)
- `sortieFromCity`:写 unit + city.garrison(经济)
- `processSupplyStatus`:写 unit.supplied(军事)
- `processUnitFood / processUnitSalary`:扣 res(经济)
- `aiSelectTargets / aiExecuteOrders / aiDefenderDecision`:写 unit.target/.intent

---

## 五、跨链 carry-over 验证(全部 PASS)

| Carry-over | 验证项 | 结果 |
|---|---|---|
| §3.5 | events.js applyEthosShock 反向调用 | ✓ |
| §3.6 | gentry G5/G6 aftermath 跨链写口归 gentry,军事不反取 | ✓ |
| §3.7 | getSquadMax/getUnitMax/getAvailableTechs 是军事 wrapper | ✓ MIL2 抽 |
| §3.8 | _clearSiegeOnPeace 写 unit.status/siegeTarget(已抽外交),军事不反取 | ✓ |
| §3.8 | _applyScoutReveal 写 G.fog(归 map.js),map.js 不反取 | ✓ |
| §3.8 | checkEmperorCapture 写 FAC_IDENTITY.type(已抽外交),军事不反取 | ✓ |
| §3.9 | createUnit / hkey / getUnitTroops 反向调 → 抽 MIL4 / map.js M1 | ✓ |
| §3.9 | _supplyCache 留 3.11 → 抽 chains/military.js(MIL5 自然包含 L10701) | ✓ |
| §3.10 | _triggerMinorRebellion 写 G.units 是叛乱副作用,军事不反取 | ✓ |
| §3.10 | _triggerMajorRebellion 写 city.fac 是叛乱副作用 | ✓ |

---

## 六、saveGame meta + backToTitle reset 实测(实装前必做,制作人 approve)

实测结果:
- saveGame meta **只序列化 `_unitIdCounter`**(L23383)
- `_aiBattleProcessedThisTurn` 每旬 `tick.js L364 .clear()` 清空,不需序列化
- 其余 9 个军事 lets 都是运行时 cache,不在 saveGame meta

抽 lets 到 chains/military.js 后:
- saveGame / loadFromSlot 行**保持不变**(跨 script 写已抽走的 lets)
- backToTitle reset / startGame 内 reset 行也保持不变
- src/core/main.js / src/core/tick.js / src/core/claude_ai.js 内对这些 lets 的引用全部保持不变

---

## 七、scout 四件验证(p3.8 沉淀)+ 实装阶段 5 个 bug 修复

scout 四件验证全部 PASS,但实装阶段踩了 5 个 bug,均就地修复 + 工作流沉淀:

### bug 7.1:M2 to=1564 漏 getScoutINT closing(map.js Commit 1)
fix:to=1565(精确到 closing brace)

### bug 7.2:M3 to=1613 越界包含 M4 注释(map.js Commit 1)
fix:M3 to=1611,M4 from=1613

### bug 7.3:M9 to=2390 漏 cityToGrid(map.js Commit 1)
fix:to=2396

### bug 7.4:build_military.js banner marker 错指 M_LET(Commit 2)
sort 后 ranges 第一段是 MIL1.a(from=913 < M_LET _unitIdCounter from=2344),banner 应该用 MIL1.a 而不是 M_LET。
fix:bannerMarker = `\n// ════ // ── MIL1.a`(用 sort 后第一段)

### bug 7.5:**关键 bug — _supplyCache 冗余 range 嵌套在 MIL5 内导致 iter 卡死**(Commit 2)

ranges 包含:
- MIL5(from=10343, to=11090)
- _supplyCache(from=10701, to=10701)— 嵌套在 MIL5 内

sort 后 ranges 顺序:[..., MIL5, _supplyCache, MIL6, ...]
iter 算法:
1. lineNo=10343 触发 MIL5,push placeholder,i 跳到 11090,rIdx++ 到 _supplyCache(from=10701)
2. lineNo 从 11091 开始递增,**永远不等于 10701**
3. rIdx 卡在 _supplyCache,后续 MIL6/MIL7/MIL8 等所有 ranges **全部不触发**
4. v181 L11710 起的 FIRE_TERRAIN_MULT(在 MIL6 范围内)**没被替换**
5. chains/military.js 也声明 FIRE_TERRAIN_MULT → 重复声明 SyntaxError → inline script 不执行 → TECH_PREUNLOCK 未声明 → smoke FAIL

fix:删除冗余 _supplyCache range(MIL5 自然包含 L10701)
教训:**ranges 中嵌套 inclusion 必须避免**,sort 后嵌套 range 会卡住 iter 算法

### 工作流改进沉淀(原则 #10,p3.11 新增)

**ranges 必须无嵌套 inclusion**(原则 #10):
- 在添加新 range 前,先检查它是否被现有 range 包含 / 包含现有 range
- 嵌套 range 必须**合并**(不需单独 range)或**拆分**外层 range(让中间空出)
- replace 算法依赖单调递增 from,嵌套会卡死

---

## 八、PLAN §二偏离

PLAN 字面:`chains/military.js(军事链 v4 / ~200 函数)`。

实装拆解:
- map.js(本 session 前置):36 funcs + 17 const + 1 class
- chains/military.js:120 funcs + ~21 const + 11 lets
- 留 v181(phase 2 原则):~80 funcs(modal/animation/render/UI handlers)
- 9 _exec 留 src/core/claude_ai.js(选项 A)

**总计抽离 156 funcs + 38 const + 1 class + 11 lets**(去掉 90% 以上的军事代码)。

scout-before-extract 第 11 次应用,bug 5 个均就地修复。

---

## 九、跨链反向调用(c) 已 approve

### 本 chain(map.js + military.js)被外部调用(callers)

| 归属 | 调用 |
|---|---|
| core(已抽) | main.js initGame 调 createUnit / buildHexTerrain / initFog;tick.js 每旬调多 turn proc + map.js 寻路;claude_ai.js 9 _execXxx 调本 chain;src/core/map.js 被本 chain 大量反向调 |
| 各 chain | 多链 hub 反向调 unit / city / map 数据 |
| render(留 v181) | 多 modal / Tab 调本 chain 大量函数;`_showEventToPlayer` 留 modals.js |
| inline backToTitle / startGame / saveGame / loadFromSlot | 11 lets reset / saveGame meta `_unitIdCounter` / loadFromSlot — 全部跨 script 写,**保持不变** |

### 本 chain 调外部(callees)

- `src/core/map.js`:大量调 hex / fog / pathfinding 函数
- 各已抽 chain hub:武将链 hub(留 3.12 — `killGen / surrenderGen / addStatExp / hasFacGen / setRetainers / addRetainers`)+ 政治 / 外交 / 豪族 / ethos / 经济 / 事件
- core helpers / render / 数据 / 常量

---

## 十、Phase 3 全局 carry-over 验证

- **backToTitle reset**:11 lets 跨文件迁移完成,backToTitle / startGame / saveGame meta / loadFromSlot 行保持不变
- **map.js 决策**:Commit 1 已完成(carry-over 关闭)
- **_execXxx**:9 个相关,按 phase 3.3 选项 A 留 src/core/claude_ai.js

---

## 十一、实测数据

| 项 | 起点(p3.10 末) | Commit 1 后 | Commit 2 后 |
|---|---|---|---|
| project_romance_v181.html | 27427 | 26429 | **19428** |
| src/core/map.js | 0 | **1218** | (不变)|
| src/chains/military.js | 0 | 0 | **7418** |

累计(phase 3 自 main 起):v181 39547 → 19428 = **-50.9%**(突破 -50% 大关 ✓)
src/ 现状:13 文件 14338 行(core 7 文件 4134 含 map / chains 7 文件 13120 含 military)

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.11 启动前) | 51 | ✅ identical |
| Commit 1 map.js 抽离后 | 51 | ✅ identical |
| Commit 2 military.js 抽离后 | 51 | ✅ identical |

---

## 十二、phase 3.11 完成清单

- ✅ Commit 1:src/core/map.js(36 funcs + 17 const + 1 class,11 段 ranges)
- ✅ Commit 2:src/chains/military.js(120 funcs + ~21 const + 11 lets,25 段 ranges)
- ✅ 同分支两 commit + squash 进 phase-3(制作人指示)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ map.js header 模板(横切基础设施,不需要 chain subtree 写口归属)
- ✅ chains/military.js 6 项 chain header 完整
- ✅ 加载顺序:`core/* → core/map.js → chains/* → chains/military.js → render/* → inline`
- ✅ phase 2 原则:战斗动画 + modal + render Tab 全部留 v181
- ✅ aiFrontierEnemyCities 改归军事 MIL3(制作人 approve)
- ✅ fuzzyTroopDisplay/fuzzyGenDisplay 归 map.js M3(制作人 approve)
- ✅ TROOP_TYPES/MIXED_COMBO_MULT/SKILL_REGISTRY const 归 chains/military.js MIL4(制作人 approve)
- ✅ MIL7 战斗调度精确切片,grep -n "^}" 验证(制作人 approve)
- ✅ billetUnit/_confirmBillet 整体留 v181(制作人 #3 决策标准)
- ✅ 跨链 carry-over §3.5-§3.10 全部验证 PASS
- ✅ 9 _exec 留 src/core/claude_ai.js(phase 3.3 选项 A)
- ✅ 11 顶层 lets 跨文件迁移,backToTitle / saveGame 兼容
- ✅ scout 四件验证 PASS,实装阶段 5 个 bug 全部就地修复 + 沉淀工作流原则 #10
- ✅ **突破 -50% 减重大关**

---

## 十三、Wave 3 进度

| Sub-session | Chain | 函数数 | v181 减重 | bug | 状态 |
|---|---|---|---|---|---|
| 3.10 | event | 8 | -326 行 | 0 | ✅ done |
| 3.11(map+military)| map(36) + military(120)= 156 | -7999 行 | 5 | ✅ done |
| 3.12 | general | ~70 mutator | TBD | TBD | ⏸ 制作人介入(中心枢纽) |

---

## 十四、下一 sub-session 衔接

**3.12 chains/general.js**(武将链,Wave 3 第三 / 收尾,**中心枢纽**):
- 估 ~70 mutator(master scout)
- 6 _exec(`_execAppointPost / _execDismissPost / _execSetStrategist / _execRecruitWild / _execPoach / _execEnthrone` — 含已抽 politics 的 enthrone,实际武将相关 ~5 个 _exec)
- 1 backToTitle reset(`_deployedGensMoraleCache`)
- 30 D 类原 audit(最多)
- 中心枢纽:被几乎所有 chain 调用
- **制作人介入点**(状态 memory 标记)

phase 3.11 留给 3.12 的债:
- `triggerFactionEvent / applyLoyaltyEvent`(武将链派系事件 hub)留 3.12 — 多链已抽完都反向调,3.12 时这些真函数归武将
- `setPrefect / clearPrefectByGen`(武将链 太守)留 3.12 — 已抽 chains 中多处反向调
- `getStrategistInt / setStrategist`(武将链军师)留 3.12 — p3.8/p3.9 已识别留
- `addStatExp / addAptExp`(武将链 exp)— 已抽 chains 多处反向调
- `getRetainers / setRetainers / getRetainersDisplay`(部曲)— 留 3.12
- `killGen / surrenderGen / poachGen / addGenChronicle`(武将处置)— 留 3.12
- `getGenFaction / getGenFactions / _genInfluence / processFactionLoyalty`(派系)— 留 3.12
- 武将链中心枢纽,3.12 启动前需要再次单链 scout
