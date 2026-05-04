# CODE_MAP v174
> 自动生成的代码结构索引，供新对话快速定位代码位置。
> 文件：`project_romance_v174.html`（~36924 行）
> v174 在 v173 基础上新增：**_baCore 共享模块 + 营寨战动画（raid/assault）+ _pendingBattleAnimations 队列机制**。
>
> v174 改动主要是 `_battleAnimating` 声明之后新增 425 行（`_baCore` + 动画队列），以及插入 `_playCampBattleAnim`（435 行）。所有后续模块行号统一偏移 ~ +830 行。
>
> 原 v173 内容保留如下；v174 新增的代码索引见末尾章节。
>

## 模块分区索引
| 行号 | 模块 |
|------|------|
| 783 | CONSTANTS |
| 1063 | D3 武将养成系统 — 属性成长 + 适性成长 |
| 1169 | C3 宣称 + 天子 + 称帝系统 |
| 1202 | ★ v151: 势力价值观系统（Ethos）常量 |
| 1306 | ★ v115: 科技树系统（Tech Tree） |
| 1621 | 地图系统 v4.0 — 六边形网格（Hex Grid） |
| 1722 | 战争迷雾系统（C4 Fog of War） |
| 1724 | 三级: 0=未探索(深黑) 1=已探索(暗色,地形/旧归属可见) 2=可见(实时) |
| 2739 | Hex 移动系统工具函数 |
| 3018 | 武将元数据：技能 · 官职 · 关系 · 士族/乡党 · 初始忠诚 |
| 3643 | 在野武将池（中立人才，不属于任何势力） |
| 3645 | minTurn: 最早可进入野池的旬数（1旬=10天，1年=36旬） |
| 3741 | ⚔ A5 武将俘获/击杀系统常量 |
| 3794 | B1 武将标签 & 派系政治系统 |
| 4105 | ★ v172: 州体系（13州+南中）— 取代大区，作为核心地理单位 |
| 4161 | ★ v161 属县系统 — 家族常量 + 属县静态数据 |
| 4457 | ★ v170 豪族系统 — 派生表 & 辅助函数 |
| 4641 | ★ v148: 腐败系统 — 大势力扩张经济制衡 |
| 4909 | D1 官职系统 — 常量定义 |
| 4993 | D1 官职系统 — 辅助函数 |
| 5689 | I3 朝议系统 — 每季度tier1/2官员提案，玩家4选2 |
| 6362 | ★ 城市粮食核心计算（新版） |
| 6490 | ★ v166: 迁民系统（Population Migration） |
| 6950 | POPULATION |
| 6952 | v0.5: 人口承载上限 |
| 7006 | ★ 势力经济（非粮食资源：金/木/铁/马） |
| 7085 | BUILD QUEUE |
| 7177 | 🏗 AI 基建决策 |
| 7447 | ★ 调粮系统（新版） |
| 7556 | 右下角告急卡片系统（★新增，替换全屏弹窗） |
| 7589 | REBELLIONS & EVENTS |
| 7591 | v0.5: 右下角告急卡片渲染（三按钮） |
| 7659 | 在野武将池 |
| 8253 | ★ v130 事件系统引擎 + A类天灾事件 |
| 8403 | B类：武将人事（4个） |
| 8720 | C类：豪族/派系斗争（4个） |
| 9083 | D类：演义名场面（3个 · 一次性） |
| 10205 | H类：价值观驱动事件（4个）★ v152 |
| 10987 | AI 军事系统 |
| 11038 | G2 AI 战略决策系统（Phase 1：进攻集结 + 战力评估） |
| 11051 | GT1: 威胁矩阵 + 分兵逻辑 |
| 11347 | G2 Phase 2: AI 防守响应 |
| 12449 | GT2: 围城守方博弈 |
| 13378 | 忠诚度系统（A4） |
| 14532 | 军师职位 + 计谋系统（D1） |
| 14793 | ★ v164: 互市系统（外交面板 — 资源交易） |
| 14855 | ★ v164: 通使（计谋Tab — 好感+情报弹窗+揭雾首都） |
| 14977 | ★ v164: 海外贸易建筑（商港/榷场） |
| 14999 | ★ v165: 通商协定系统（Trade Agreement） |
| 15195 | C3 宣称 + 天子 + 称帝 — 核心函数 |
| 15498 | ★ I2 豪族支持系统 — 运行时函数 |
| 15888 | ★ v151: 势力价值观系统 — 回合结算 + 冲击 |
| 16756 | PLAYER ACTIONS |
| 16825 | RENDER |
| 16827 | v0.5: 全局部队状态 |
| 16852 | 叠加层系统（v42新增） |
| 17829 | 📊 统计系统（v40） |
| 17851 | ★ v115: 科技树 Tab 渲染 |
| 18202 | D1 官职Tab |
| 18975 | D1 官职任命/罢免弹窗 |
| 19048 | 武将详情弹窗 |
| 19301 | B1 派系政治 Tab UI — ★ v168: 内政概览重构（五区） |
| 20088 | ★ v151: 价值观Tab |
| 20187 | UTILS |
| 20233 | ★ 数值Breakdown浮窗（P0新增） |
| 21410 | v1.0 战斗系统 |
| 21425 | 部队系统 v3.0 — 格子地图，行动力，A*寻路 |
| 21502 | 🎖 武将技能系统 — Layer 1: 注册表 + 统一调度 |
| 21504 | 纯数值类技能走注册表，副作用类技能(SKILL_INLINE)保留原位。 |
| 22082 | 🚚 v88: 补给线系统 |
| 22407 | 🏰 v114: 集结系统（征兵/扩编渐进集结） |
| 22483 | ⚔ 野战系统 |
| 22510 | 💞 相性与亲密度系统（2.5） |
| 22714 | ⚔️ A5 武将韧性 / 俘获 / 处置系统 |
| 23041 | ⚔️ 兵种克制系统（A1） |
| 23253 | 🎯 伏击系统 |
| 23654 | 🏕 营寨战系统 |
| 24421 | ★ v138 水战系统 |
| 25547 | ⚔ 单挑系统 |
| 28476 | 地图交互：左键选中部队 → 再左键点地图任意位置移动 |
| 29267 | 地图渲染（部队Icon） |
| 29573 | 右侧面板：部队详情 |
| 30423 | 扩征系统（★ v114: 手动补员已删除，补员完全由processReinforcement自动处理） |
| 30432 | ★ v113: 扩编系统（提高maxTroops + 即时征入新兵） |
| 30642 | ★ v120: 增编分队系统（2分队部队→3分队） |
| 31103 | ★ v135: 标题菜单 + 剧本选择 + 存档系统 |
| 31508 | ★ v162: Tab 帮助系统（❓ 按钮 → 机制详解弹窗） |
| 31920 | ★ v137: 新手引导系统（Tutorial Overlay） |
| 32392 | ★ v119: 完整性审计 — 压力测试后批量断言检查 |
| 32628 | ★ v119: 势力淘汰 + 胜利/失败判定 |
| 32835 | ★ v156: Claude AI 决策系统 (Phase 1) |
| 32857 | ★ v159: Phase 5 — AI情报推理层 + 决策节奏 |
| 34138 | ★ v157: Claude AI 决策系统 (Phase 2) |
| 34256 | 内政指令执行 |
| 34340 | 人事指令执行 |
| 34416 | 科技指令执行 |
| 34439 | 外交指令执行（参数化版，不依赖G.playerFac） |
| 34592 | 计谋指令执行（参数化fid版） |
| 34721 | 军事指令执行 |
| 34892 | ★ v157: runAI async化 + Claude分支 |

## 函数/常量索引（按行号排序）
| 行号 | 名称 | 类型 |
|------|------|------|
| 785 | `SEASONS` | data |
| 786 | `SEASON_MOD` | data |
| 787 | `YEARS` | data |
| 791 | `TAGS` | data |
| 803 | `getCityStats` | func |
| 817 | `TAX` | data |
| 824 | `POLICY` | data |
| 830 | `CORVEE` | data |
| 837 | `MIGRATE_MIN_RATIO` | data |
| 838 | `MIGRATE_MAX_RATIO` | data |
| 839 | `MIGRATE_LOSS_RATE` | data |
| 840 | `MIGRATE_COOLDOWN` | data |
| 841 | `MIGRATE_SRC_BASE` | data |
| 842 | `MIGRATE_DST_BASE` | data |
| 843 | `MIGRATE_COUNTY_CROSS` | data |
| 844 | `MIGRATE_COUNTY_SAME` | data |
| 845 | `MIGRATE_CLAN_BASE_EXTRA` | data |
| 846 | `MIGRATE_ENEMY_CHECK_RANGE` | data |
| 848 | `RETAINER_LEVEL` | data |
| 849 | `RETAINER_PROTECT` | data |
| 850 | `RETAINER_INFLUENCE_DIV` | data |
| 852 | `RETAINER_PRESET` | data |
| 867 | `getRetainers` | func |
| 874 | `getRetainerType` | func |
| 883 | `setRetainers` | func |
| 892 | `getRetainersDisplay` | func |
| 895 | `getEffectiveSquadLevel` | func |
| 907 | `UNIT_LEVEL_MAX` | data |
| 908 | `UNIT_LEVEL_MULT_BASE` | data |
| 911 | `UNIT_LEVEL_EXP` | data |
| 917 | `BATTLE_EXP` | data |
| 930 | `getInitLevel` | func |
| 941 | `getLvMult` | func |
| 950 | `addUnitExp` | func |
| 971 | `applyBattleExp` | func |
| 1065 | `STAT_GROW_CAP` | data |
| 1066 | `STAT_GROW_THRESHOLD` | data |
| 1067 | `APT_GROW_THRESHOLD` | data |
| 1068 | `APT_GRADES` | data |
| 1074 | `addStatExp` | func |
| 1106 | `addAptExp` | func |
| 1135 | `BLDS` | data |
| 1152 | `getBarracksDiscount` | func |
| 1158 | `FAC` | data |
| 1165 | `ALL_FACS` | data |
| 1166 | `PLAYABLE_FACS` | data |
| 1177 | `FAC_IDENTITY` | data |
| 1185 | `STAGE_NAMES` | data |
| 1186 | `STAGE_ORDER` | data |
| 1189 | `STAGE_GENTRY_BOUNDS` | data |
| 1196 | `STAGE_PROMO` | data |
| 1207 | `ETHOS_INIT` | data |
| 1213 | `ETHOS_DIMS` | data |
| 1214 | `ETHOS_LABELS` | data |
| 1221 | `ETHOS_DIM_NAMES` | data |
| 1222 | `_ethosTierLabel` | func |
| 1253 | `SIEGE_AFTERMATH` | data |
| 1260 | `CLAIM_TYPES` | data |
| 1272 | `CLAIM_EFFECTS` | data |
| 1280 | `ENTHRONE_FACTION_EFFECTS` | data |
| 1287 | `SQUAD_MAX_TROOPS` | data |
| 1288 | `UNIT_MAX_TROOPS` | data |
| 1292 | `BILLET_LEVEL_THRESHOLD` | data |
| 1293 | `canBilletToCity` | func |
| 1299 | `getBilletCities` | func |
| 1311 | `TECH_TREE` | data |
| 1426 | `TECH_PREUNLOCK` | data |
| 1436 | `_ensureTechCache` | func |
| 1453 | `getTechEffect` | func |
| 1459 | `hasTechEffect` | func |
| 1465 | `getSquadMax` | func |
| 1470 | `getUnitMax` | func |
| 1475 | `getAvailableTechs` | func |
| 1486 | `canAffordTech` | func |
| 1498 | `processTechResearch` | func |
| 1541 | `startTechResearch` | func |
| 1570 | `aiDoTechResearch` | func |
| 1610 | `DIPLO_INIT` | data |
| 1627 | `JUNS` | data |
| 1643 | `HEX_SIZE` | data |
| 1644 | `HEX_H` | data |
| 1645 | `HEX_COLS` | data |
| 1652 | `hexToPixel` | func |
| 1659 | `pixelToHex` | func |
| 1677 | `hkey` | func |
| 1678 | `hparse` | func |
| 1681 | `hexNeighbors` | func |
| 1696 | `toCube` | func |
| 1703 | `hexDist` | func |
| 1710 | `hexPathStr` | func |
| 1718 | `HEX_PATH` | data |
| 1719 | `HEX_PATH_INNER` | data |
| 1725 | `FOG_UNEXPLORED` | data |
| 1726 | `FOG_UNIT_RADIUS_BASE` | data |
| 1736 | `getUnitVisionRadius` | func |
| 1757 | `getScoutINT` | func |
| 1789 | `fuzzyTroopDisplay` | func |
| 1814 | `fuzzyGenDisplay` | func |
| 1830 | `getFogAllyFacs` | func |
| 1845 | `canSeeFactionData` | func |
| 1856 | `fogBFS` | func |
| 1879 | `initFog` | func |
| 1931 | `updateFog` | func |
| 2017 | `updateFogCitySnapshot` | func |
| 2034 | `getFogLevel` | func |
| 2039 | `getCityFogLevel` | func |
| 2047 | `getKnownCityCount` | func |
| 2063 | `CITIES_DEF` | data |
| 2133 | `CITY_MAP` | data |
| 2136 | `JIANGDONG_CITIES` | data |
| 2137 | `QINGXU_CITIES` | data |
| 2139 | `JINGZHOU_CITIES` | data |
| 2140 | `isJiangdong` | func |
| 2141 | `isQingxu` | func |
| 2142 | `isJingzhou` | func |
| 2145 | `ROADS` | data |
| 2191 | `ROAD_ADJ` | data |
| 2200 | `ensureCityNeighbors` | func |
| 2221 | `aiFrontierEnemyCities` | func |
| 2279 | `RIVERS` | data |
| 2300 | `TERRAIN_POLYS` | data |
| 2451 | `HEX_TERRAIN` | data |
| 2452 | `HEX_ROAD` | data |
| 2453 | `HEX_CITY` | data |
| 2456 | `pointInPoly` | func |
| 2468 | `buildHexTerrain` | func |
| 2655 | `hexLineDraw` | func |
| 2688 | `TERRAIN_AP_COST` | data |
| 2703 | `NAVAL_WATER_COST` | data |
| 2704 | `NAVAL_AP` | data |
| 2705 | `WATER_TERRAINS` | data |
| 2708 | `isWaterHex` | func |
| 2714 | `isUnitOnWater` | func |
| 2720 | `getHexMoveCost` | func |
| 2735 | `getTerrainAt` | func |
| 2743 | `getUnitNodeId` | func |
| 2749 | `unitsContact` | func |
| 2755 | `cityToGrid` | func |
| 2765 | `calcHexPathCost` | func |
| 2775 | `findNearestOwnCityPath` | func |
| 2827 | `hexAstar` | func |
| 2882 | `GENS_FULL` | data |
| 3020 | `GEN_META` | data |
| 3647 | `WILD_GENS` | data |
| 3672 | `WILD_GEN_META` | data |
| 3702 | `ALL_GENS` | data |
| 3705 | `getGenMeta` | func |
| 3708 | `GEN_POOL_INACTIVE` | data |
| 3722 | `GEN_MAP` | data |
| 3725 | `_deepCloneGen` | func |
| 3730 | `_rebuildGEN_MAP` | func |
| 3743 | `WOUNDED_CD` | data |
| 3744 | `BATTLE_DEATH_LOSS` | data |
| 3745 | `BATTLE_DEATH_CHANCE` | data |
| 3746 | `DUEL_KILL_WAR_GAP` | data |
| 3747 | `DUEL_KILL_CHANCE` | data |
| 3748 | `CAPTURE_RATE_CAP` | data |
| 3752 | `loyaltyDisplay` | func |
| 3758 | `G` | data |
| 3800 | `FOUNDING_CORE` | data |
| 3815 | `GEN_TAGS` | data |
| 3971 | `GEN_CLASS` | data |
| 4021 | `CLASS_META` | data |
| 4029 | `getSquadClass` | func |
| 4036 | `getUnitClassBuffs` | func |
| 4058 | `getClassDuelWeight` | func |
| 4066 | `genClassTagsHtml` | func |
| 4075 | `genClassSelectorHtml` | func |
| 4086 | `genClassBuffsHtml` | func |
| 4108 | `STATE_CITIES` | data |
| 4125 | `STATE_NAMES` | data |
| 4132 | `STATE_TIER` | data |
| 4139 | `CITY_TO_STATE` | data |
| 4143 | `STATE_TO_GENTRY_FAC` | data |
| 4154 | `GENTRY_FAC_TO_STATES` | data |
| 4163 | `CLAN_FAMILIES` | data |
| 4178 | `MAGNATE_CLANS` | data |
| 4185 | `COUNTY_DATA` | data |
| 4461 | `COUNTY_NAME_TO_CITY` | data |
| 4463 | `COUNTY_INDEX` | data |
| 4477 | `_countyClanList` | func |
| 4484 | `isMagnateCounty` | func |
| 4489 | `getGenHomeCounty` | func |
| 4504 | `getGenHomeCity` | func |
| 4510 | `isGenHomeInFac` | func |
| 4516 | `_V170_TIER_TABLE` | data |
| 4521 | `getGenLocalBonus` | func |
| 4531 | `LOCAL_BONUS_CAP_V170` | data |
| 4533 | `COUNTY_CLAN_SENS` | data |
| 4535 | `COUNTY_TYPE_SENS_V170` | data |
| 4573 | `GENTRY_LEVELS` | data |
| 4581 | `getGentryLevel` | func |
| 4591 | `_getCountyGentryLevel` | func |
| 4592 | `getGentryGoldMult` | func |
| 4603 | `getGentryRecruitMult` | func |
| 4617 | `getGentryMoraleMod` | func |
| 4629 | `getGentryDefMult` | func |
| 4643 | `CORRUPT_PER_CITY` | data |
| 4644 | `CORRUPT_FREE_CITIES` | data |
| 4645 | `CORRUPT_CAP` | data |
| 4646 | `CORRUPT_GENTRY_MAP` | data |
| 4653 | `_getCorruptGentryMod` | func |
| 4663 | `calcCityCorruption` | func |
| 4699 | `getStage` | func |
| 4702 | `getAnchorState` | func |
| 4705 | `countCitiesInState` | func |
| 4710 | `getQualifiedStates` | func |
| 4720 | `countFacCities` | func |
| 4725 | `_updateStateAnchorClock` | func |
| 4744 | `_selectBestAnchor` | func |
| 4769 | `checkStagePromotion` | func |
| 4796 | `promoteStage` | func |
| 4825 | `processStageEvolution` | func |
| 4834 | `getStageBadgeText` | func |
| 4845 | `getStageColor` | func |
| 4850 | `getStageNarrative` | func |
| 4889 | `FACTION_DEFS` | data |
| 4913 | `POST_TIERS` | data |
| 4921 | `MIL_POSTS` | data |
| 4944 | `CIV_POSTS` | data |
| 4967 | `ALL_POSTS` | data |
| 4973 | `MERIT_INIT` | data |
| 4997 | `getFacPostTier` | func |
| 5003 | `getPostSlots` | func |
| 5009 | `getFacPosts` | func |
| 5021 | `countPostsByTier` | func |
| 5032 | `getGenPostDef` | func |
| 5038 | `getGenBirthplace` | func |
| 5043 | `genHasOffice` | func |
| 5051 | `appointGenPost` | func |
| 5078 | `dismissGenPost` | func |
| 5096 | `clearAllPostsByGen` | func |
| 5101 | `checkPostDowngrade` | func |
| 5126 | `calcPostBuffs` | func |
| 5143 | `calcPostSalary` | func |
| 5148 | `hasAnyPost` | func |
| 5154 | `addMerit` | func |
| 5160 | `seniority` | func |
| 5180 | `isHomeTerrain` | func |
| 5194 | `_isClanRoyalty` | func |
| 5211 | `getGenFactions` | func |
| 5271 | `getGenFaction` | func |
| 5342 | `_genInfluence` | func |
| 5388 | `calcFactionInfluence` | func |
| 5420 | `factionModToLoyaltyDelta` | func |
| 5428 | `processFactionLoyalty` | func |
| 5518 | `getAvgFactionMod` | func |
| 5534 | `getFactionMoraleMod` | func |
| 5550 | `triggerFactionEvent` | func |
| 5613 | `getGenFactionModBreakdown` | func |
| 5692 | `COURT_PROPOSALS_MIL` | data |
| 5698 | `COURT_PROPOSALS_CIV` | data |
| 5706 | `_generateCourtProposals` | func |
| 5757 | `getCourtDecreeBuffs` | func |
| 5768 | `_applyCourtDecisions` | func |
| 5834 | `_expireCourtDecrees` | func |
| 5840 | `_aiCourtSelect` | func |
| 5876 | `showCourtCouncil` | func |
| 5973 | `_checkPendingCourtAfterPopup` | func |
| 5982 | `triggerCourtCouncil` | func |
| 6001 | `_MAP_SCALE_MIN` | data |
| 6004 | `initGame` | func |
| 6351 | `addGenChronicle` | func |
| 6368 | `getCityProd` | func |
| 6448 | `getCityFoodCost` | func |
| 6457 | `getCityFoodNet` | func |
| 6468 | `getCityFoodTurns` | func |
| 6482 | `getCityFoodColor` | func |
| 6495 | `canMigrate` | func |
| 6516 | `getMigrateTargets` | func |
| 6532 | `executeMigration` | func |
| 6602 | `showMigrateDialog` | func |
| 6734 | `_aiConsiderMigration` | func |
| 6838 | `SPOIL_RATES` | data |
| 6839 | `processCityFood` | func |
| 6864 | `garrisonCap` | func |
| 6878 | `processGarrisonRecovery` | func |
| 6893 | `_getDeployedGensForMorale` | func |
| 6901 | `processMorale` | func |
| 6953 | `getCityCap` | func |
| 6962 | `processPop` | func |
| 7009 | `processFacEconomy` | func |
| 7088 | `getPrefectBuildBuff` | func |
| 7136 | `processBuildQueues` | func |
| 7179 | `aiDoBuild` | func |
| 7349 | `aiDoTransfer` | func |
| 7371 | `aiDoAppointments` | func |
| 7452 | `processTransfers` | func |
| 7472 | `checkResupply` | func |
| 7507 | `findBestDonor` | func |
| 7521 | `cityDist` | func |
| 7534 | `doTransfer` | func |
| 7561 | `renderAlertStack` | func |
| 7577 | `confirmCard` | func |
| 7583 | `dismissCard` | func |
| 7592 | `renderFoodAlerts` | func |
| 7629 | `_doFATransfer` | func |
| 7638 | `confirmFALong` | func |
| 7648 | `confirmFAOnce` | func |
| 7653 | `dismissFA` | func |
| 7661 | `WILD_POOL_SIZE` | data |
| 7662 | `WILD_POOL_INTERVAL` | data |
| 7663 | `AI_RECRUIT_INTERVAL` | data |
| 7666 | `getAllRecruitedNames` | func |
| 7673 | `refreshWildPool` | func |
| 7700 | `calcRegionRecruitBonus` | func |
| 7719 | `calcClanRecruitBonus` | func |
| 7738 | `calcGentryRecruitBonus` | func |
| 7760 | `_doRecruitWild` | func |
| 7857 | `recruitWild` | func |
| 7883 | `aiDoRecruitTalent` | func |
| 7937 | `_aiDoPoach` | func |
| 7985 | `checkIntimacyThresholds` | func |
| 8020 | `_showIntimacyAlert` | func |
| 8055 | `checkRebellions` | func |
| 8101 | `_triggerMinorRebellion` | func |
| 8142 | `_triggerMajorRebellion` | func |
| 8196 | `runRebelAI` | func |
| 8262 | `EVENT_DEFS` | data |
| 10537 | `processEventCooldowns` | func |
| 10551 | `processPlagueSpreads` | func |
| 10592 | `checkEventPromises` | func |
| 10764 | `rollEventsV2` | func |
| 10843 | `_popEventQueue` | func |
| 10852 | `_showEventToPlayer` | func |
| 10882 | `resolveEventChoice` | func |
| 10915 | `_applyCeremony` | func |
| 10930 | `_showCeremonyPicker` | func |
| 10958 | `_updateCeremonyBtn` | func |
| 10973 | `_confirmCeremony` | func |
| 10994 | `aiGetAvailableGens` | func |
| 11015 | `AI_RECRUIT_TROOPS_BASE` | data |
| 11026 | `MAX_FIELD_UNITS_ABS` | data |
| 11027 | `GAR_SALARY_RATE` | data |
| 11028 | `MIN_SALARY_BUFFER` | data |
| 11043 | `AI_PERSONALITY` | data |
| 11058 | `_aiFrontlineCitiesAgainst` | func |
| 11072 | `_aiCalcThreat` | func |
| 11149 | `_aiDeployAnomaly` | func |
| 11178 | `_aiGetThreatMatrix` | func |
| 11210 | `_aiInvalidateThreatCache` | func |
| 11221 | `_aiScoreTarget` | func |
| 11252 | `_aiEstimateSiegeWinRate` | func |
| 11279 | `_aiFuzzySiegeWinRate` | func |
| 11295 | `_aiShouldReview` | func |
| 11355 | `_aiChooseDefensePosture` | func |
| 11432 | `_aiFindAmbushHex` | func |
| 11486 | `aiDefendResponse` | func |
| 11741 | `_aiIsVisibleToFac` | func |
| 11750 | `aiSelectTargets` | func |
| 11989 | `aiExecuteOrders` | func |
| 12383 | `_aiTrySiege` | func |
| 12457 | `aiDefenderDecision` | func |
| 12561 | `aiDoSiege` | func |
| 12644 | `aiDoDisband` | func |
| 12730 | `aiDoExpand` | func |
| 12807 | `aiDoAddSquad` | func |
| 12928 | `aiDoRecruit` | func |
| 13215 | `_aiCalcBudget` | func |
| 13397 | `calcLoyaltyDelta` | func |
| 13516 | `processLoyalty` | func |
| 13627 | `applyLoyaltyEvent` | func |
| 13672 | `checkLoyaltyThresholds` | func |
| 13756 | `poachGen` | func |
| 13829 | `showGenericModal` | func |
| 13834 | `closeModal` | func |
| 13841 | `showDiploSueForPeace` | func |
| 13865 | `_clearSiegeOnPeace` | func |
| 13888 | `acceptPeaceOffer` | func |
| 13914 | `rejectPeaceOffer` | func |
| 13922 | `openPrefectModal` | func |
| 13973 | `clearPrefectByGen` | func |
| 13980 | `setPrefect` | func |
| 14031 | `_diploActed` | func |
| 14036 | `_diploMarkActed` | func |
| 14041 | `diploGift` | func |
| 14066 | `diploArmistice` | func |
| 14114 | `diploAlly` | func |
| 14148 | `startClaimPrepUI` | func |
| 14160 | `playerEnthrone` | func |
| 14169 | `diploBreakAlliance` | func |
| 14187 | `diploWar` | func |
| 14222 | `powerIndex` | func |
| 14233 | `fogPowerEstimate` | func |
| 14254 | `alliedFacs` | func |
| 14263 | `isSuzerain` | func |
| 14268 | `isVassal` | func |
| 14275 | `getSuzerain` | func |
| 14285 | `effectivePowerAgainst` | func |
| 14296 | `peaceWillingness` | func |
| 14305 | `_syncAllyWarStatus` | func |
| 14339 | `aiDoDiplo` | func |
| 14502 | `aiDoTradeAgreement` | func |
| 14536 | `getStrategistInt` | func |
| 14547 | `setStrategist` | func |
| 14580 | `openStrategistModal` | func |
| 14613 | `_strategyRate` | func |
| 14630 | `stratDriveWolf` | func |
| 14656 | `stratTwoTigers` | func |
| 14677 | `stratSpy` | func |
| 14713 | `stratRumor` | func |
| 14737 | `stratScout` | func |
| 14774 | `_applyScoutReveal` | func |
| 14797 | `_getTradeOffers` | func |
| 14809 | `_findTradeCity` | func |
| 14814 | `diploTrade` | func |
| 14859 | `_buildEnvoyIntel` | func |
| 14914 | `_showEnvoyIntelModal` | func |
| 14929 | `stratEnvoy` | func |
| 14981 | `TRADE_POST_NAME` | data |
| 14988 | `_canBuildTradePost` | func |
| 15003 | `TRADE_AGR_COST` | data |
| 15004 | `TRADE_AGR_REL_MIN` | data |
| 15005 | `TRADE_AGR_REL_BREAK` | data |
| 15006 | `TRADE_AGR_PER_CITY` | data |
| 15007 | `TRADE_AGR_ALLY_MULT` | data |
| 15008 | `TRADE_AGR_MAX` | data |
| 15011 | `getTradeAgreements` | func |
| 15017 | `hasTradeAgreement` | func |
| 15022 | `calcTradeAgrIncome` | func |
| 15045 | `_cleanTradeAgreements` | func |
| 15072 | `diploTradeAgreement` | func |
| 15114 | `cancelTradeAgreement` | func |
| 15129 | `tickStrategyCDs` | func |
| 15138 | `getDiploStatus` | func |
| 15144 | `isHostile` | func |
| 15154 | `addDiplo` | func |
| 15165 | `applyReputationPenalty` | func |
| 15183 | `_repPenaltyFactor` | func |
| 15189 | `_repGiftMult` | func |
| 15199 | `_areFacsAdjacent` | func |
| 15205 | `_hasLostCityTo` | func |
| 15212 | `getAvailableClaims` | func |
| 15233 | `startClaimPrep` | func |
| 15247 | `processClaimPrep` | func |
| 15268 | `getReadyClaim` | func |
| 15275 | `applyWarDeclarationEffects` | func |
| 15342 | `_applyClaimFactionEffects` | func |
| 15367 | `trackCityLoss` | func |
| 15376 | `checkEmperorCapture` | func |
| 15393 | `checkBloodFeud` | func |
| 15405 | `processFeudDecay` | func |
| 15412 | `canEnthrone` | func |
| 15427 | `doEnthrone` | func |
| 15464 | `aiConsiderEnthrone` | func |
| 15483 | `processReputation` | func |
| 15502 | `initCityGentry` | func |
| 15546 | `_isFacHomeRegion` | func |
| 15560 | `_clanHasMemberInFac` | func |
| 15566 | `_clanHasOfficeInFac` | func |
| 15577 | `_aggregateGentry` | func |
| 15583 | `applyGentryOnCapture` | func |
| 15612 | `applyFamilyLoyaltyShock` | func |
| 15632 | `processGentry` | func |
| 15827 | `_triggerGentryBetray` | func |
| 15890 | `_applyEthosDrift` | func |
| 15902 | `applyEthosShock` | func |
| 15911 | `_ethosDistance` | func |
| 15918 | `processFacEthos` | func |
| 15987 | `_applySiegeAftermath` | func |
| 16024 | `showSiegeAftermathChoice` | func |
| 16045 | `_onSiegeAftermath` | func |
| 16061 | `applyCommonEnemyDiploBonus` | func |
| 16079 | `checkDiplo` | func |
| 16522 | `showDiploVassal` | func |
| 16559 | `_resolveVassalDiploConflicts` | func |
| 16602 | `_setVassalStatus` | func |
| 16611 | `acceptVassalOffer` | func |
| 16619 | `rejectVassalOffer` | func |
| 16628 | `playerReleaseVassal` | func |
| 16639 | `requestVassalIndependence` | func |
| 16682 | `diploDemandVassal` | func |
| 16719 | `diploSubmitVassal` | func |
| 16758 | `buildBld` | func |
| 16794 | `setTax` | func |
| 16800 | `setPolicy` | func |
| 16808 | `toggleResupply` | func |
| 16815 | `setCorvee` | func |
| 16829 | `cancelSupplyLine` | func |
| 16836 | `renderAll` | func |
| 16846 | `renderAllLight` | func |
| 16856 | `toggleOverlay` | func |
| 16879 | `renderOverlay` | func |
| 16917 | `_OV_RADIUS` | data |
| 16921 | `_buildTerritoryMap` | func |
| 16995 | `_renderOvBase` | func |
| 17018 | `_OV_FAC_RGB` | data |
| 17021 | `renderOverlayFaction` | func |
| 17061 | `renderOverlayGold` | func |
| 17093 | `renderOverlayFood` | func |
| 17122 | `renderOverlaySupply` | func |
| 17162 | `renderOverlayFoodFlow` | func |
| 17194 | `renderTurnInfo` | func |
| 17204 | `invalidateLeftCache` | func |
| 17205 | `renderLeft` | func |
| 17332 | `toggleMapStyle` | func |
| 17346 | `_buildStaticMapCache` | func |
| 17453 | `_getStaticMapCache` | func |
| 17463 | `invalidateFogCache` | func |
| 17465 | `_getFogSvgCache` | func |
| 17501 | `invalidateCityCache` | func |
| 17502 | `_getCitySvgCache` | func |
| 17579 | `_renderSiegeIndicators` | func |
| 17611 | `_renderMoveRange` | func |
| 17669 | `renderMap` | func |
| 17771 | `renderUnitsOnly` | func |
| 17832 | `_STATS_MAX` | data |
| 17834 | `pushStatsSnapshot` | func |
| 17854 | `renderTechTab` | func |
| 17973 | `openTechResearchPicker` | func |
| 18018 | `confirmTechResearch` | func |
| 18030 | `renderStatsTab` | func |
| 18204 | `renderPostTab` | func |
| 18343 | `renderRight` | func |
| 18357 | `renderCityTab` | func |
| 18367 | `_renderCityList` | func |
| 18414 | `_renderCityDetail` | func |
| 18780 | `renderGenTab` | func |
| 18977 | `openPostAppoint` | func |
| 19008 | `openPostAction` | func |
| 19027 | `showModal` | func |
| 19042 | `closePostModal` | func |
| 19050 | `openGenProfile` | func |
| 19296 | `closeGenProfile` | func |
| 19305 | `getCourtStatusText` | func |
| 19360 | `_buildCourtNarrative` | func |
| 19422 | `_buildCourtWarnings` | func |
| 19479 | `_buildCourtVacancies` | func |
| 19497 | `renderFactionTab` | func |
| 19703 | `renderDipTab` | func |
| 19959 | `renderSchemeTab` | func |
| 20090 | `renderEthosTab` | func |
| 20189 | `selCity` | func |
| 20190 | `selFac` | func |
| 20191 | `switchTab` | func |
| 20192 | `updateTabs` | func |
| 20196 | `hideTip` | func |
| 20198 | `log` | func |
| 20205 | `showNotif` | func |
| 20212 | `updateFacStats` | func |
| 20223 | `fmt` | func |
| 20230 | `sleep` | func |
| 20237 | `fmtSigned` | func |
| 20238 | `_positionTip` | func |
| 20249 | `showBreakdown` | func |
| 20629 | `showUnitBreakdown` | func |
| 20767 | `showLoyaltyBreakdown` | func |
| 20789 | `showFacModBreakdown` | func |
| 20840 | `showFacBreakdown` | func |
| 21004 | `showRepBreakdown` | func |
| 21050 | `hideBreakdown` | func |
| 21056 | `showDiploBreakdown` | func |
| 21109 | `showCountyTip` | func |
| 21304 | `showPopBreakdown` | func |
| 21390 | `handleKeyDown` | func |
| 21430 | `CAMP_COST` | data |
| 21431 | `getCampCost` | func |
| 21436 | `CAMP_MOBILIZE_TURNS` | data |
| 21439 | `TROOP_TYPES` | data |
| 21464 | `MIXED_COMBO_MULT` | data |
| 21484 | `getMixedComboMult` | func |
| 21494 | `getMixedComboLabel` | func |
| 21508 | `SKILL_REGISTRY` | data |
| 21633 | `applySkills` | func |
| 21661 | `calcUnitAP` | func |
| 21676 | `getMainTroopType` | func |
| 21682 | `newUnitId` | func |
| 21685 | `getUnitTroops` | func |
| 21688 | `calcSlotMatCost` | func |
| 21701 | `mergeMatCosts` | func |
| 21703 | `safeSub` | func |
| 21705 | `canAffordMat` | func |
| 21711 | `deductMat` | func |
| 21717 | `createUnit` | func |
| 21750 | `processUnitMovement` | func |
| 21963 | `SIEGE_BASE_DEF_BONUS` | data |
| 21964 | `SIEGE_MAX_TURNS` | data |
| 21966 | `getSiegeDefMult` | func |
| 21977 | `_getSiegeDefMultWithDecay` | func |
| 21987 | `processSiegeDecay` | func |
| 22066 | `getUnitFoodRate` | func |
| 22075 | `getUnitSalaryRate` | func |
| 22089 | `SUPPLY_TERRAIN_COST` | data |
| 22096 | `SUPPLY_ENEMY_PENALTY` | data |
| 22097 | `SUPPLY_MAX_RANGE` | data |
| 22098 | `SUPPLY_RATIONS` | data |
| 22099 | `SUPPLY_CITY_RESTORE_TURNS` | data |
| 22109 | `buildSupplyMap` | func |
| 22182 | `isUnitSupplied` | func |
| 22204 | `processSupplyStatus` | func |
| 22267 | `processUnitFood` | func |
| 22291 | `getFacUnitSalary` | func |
| 22299 | `processUnitSalary` | func |
| 22378 | `processMobilizing` | func |
| 22411 | `getMusterRate` | func |
| 22419 | `isUnitMustering` | func |
| 22424 | `isAiMusterReady` | func |
| 22432 | `processMuster` | func |
| 22491 | `comBonus` | func |
| 22499 | `warMoraleBonus` | func |
| 22507 | `APT_MULT` | data |
| 22514 | `COMPAT` | data |
| 22535 | `COMPAT_GROWTH_MULT` | data |
| 22544 | `INTIMACY_PRESET` | data |
| 22585 | `_intimacyKey` | func |
| 22590 | `getIntimacy` | func |
| 22596 | `setIntimacy` | func |
| 22602 | `addIntimacy` | func |
| 22608 | `getCompatGrowthMult` | func |
| 22619 | `getRelationLabel` | func |
| 22637 | `applyDuelIntimacy` | func |
| 22664 | `applyBattleIntimacy` | func |
| 22721 | `checkWounded` | func |
| 22730 | `isGenWounded` | func |
| 22737 | `getEffectiveStat` | func |
| 22751 | `calcCaptureRate` | func |
| 22760 | `calcSurrenderRate` | func |
| 22795 | `killGen` | func |
| 22859 | `succeedRuler` | func |
| 22908 | `surrenderGen` | func |
| 22953 | `releaseGen` | func |
| 22975 | `aiDisposePrisoner` | func |
| 22990 | `collectPrisoners` | func |
| 23022 | `resolvePrisoners` | func |
| 23046 | `TYPE_ATK` | data |
| 23058 | `TYPE_DEF` | data |
| 23071 | `TROOP_BASE_MULT` | data |
| 23076 | `TYPE_MATCH_MULT` | data |
| 23085 | `TERRAIN_TROOP_MULT` | data |
| 23099 | `getTypeMatchMult` | func |
| 23117 | `getTerrainMult` | func |
| 23131 | `getMixedBonusMult` | func |
| 23140 | `getEnemyComposition` | func |
| 23151 | `_squadBase` | func |
| 23168 | `squadATK` | func |
| 23174 | `squadDEF` | func |
| 23181 | `squadCP` | func |
| 23189 | `calcUnitATK` | func |
| 23219 | `calcUnitDEF` | func |
| 23240 | `calcCombatPower` | func |
| 23260 | `getMaxInt` | func |
| 23272 | `getMainCom` | func |
| 23282 | `FIRE_TERRAIN_MULT` | data |
| 23285 | `FIRE_SEASON_MULT` | data |
| 23288 | `FIRE_COST` | data |
| 23290 | `canFireAttack` | func |
| 23293 | `calcFireRate` | func |
| 23311 | `applyFireEffect` | func |
| 23333 | `clearFireDebuff` | func |
| 23341 | `aiDecideFireAttack` | func |
| 23357 | `AMBUSH_BASE_CHANCE` | data |
| 23359 | `resolveAmbush` | func |
| 23661 | `calcRaidChance` | func |
| 23696 | `resolveCampBattle` | func |
| 23923 | `checkUnitSynergy` | func |
| 23936 | `SYNERGY_LINES` | data |
| 23942 | `getSynergyLine` | func |
| 23947 | `resolveBattle` | func |
| 24425 | `NAVAL_BLOCKED_SKILLS` | data |
| 24451 | `resolveNavalBattle` | func |
| 24509 | `estimateWinRate` | func |
| 24534 | `fuzzyEstimateWinRate` | func |
| 24559 | `calcRetreatResult` | func |
| 24611 | `canRetreat` | func |
| 24618 | `calcPursuitLoss` | func |
| 24660 | `doRetreat` | func |
| 24820 | `hasGenInUnits` | func |
| 24826 | `hasFacGen` | func |
| 24842 | `autoResolvePendingBattle` | func |
| 24884 | `_checkSiegeArrival` | func |
| 24960 | `_siegeArrivalChoice` | func |
| 24989 | `calcBreakoutChance` | func |
| 25002 | `resolveSiegeBattle` | func |
| 25323 | `collectBattleSides` | func |
| 25378 | `aiInitiateBattle` | func |
| 25503 | `checkAmbushTriggers` | func |
| 25564 | `aiDecideDuelChallenger` | func |
| 25620 | `getDuelCandidates` | func |
| 25640 | `resolveDuel` | func |
| 25751 | `applyDuelMorale` | func |
| 25775 | `tryPassiveDuel` | func |
| 25820 | `getStrengthLabel` | func |
| 25837 | `_battleSideHtml` | func |
| 25929 | `_showAmbushConfirm` | func |
| 26025 | `confirmAmbush` | func |
| 26072 | `confirmAmbushAbort` | func |
| 26142 | `_doRetreat2Hex` | func |
| 26172 | `_showCampBattleConfirm` | func |
| 26290 | `confirmCampBattle` | func |
| 26358 | `_showSiegeBattleConfirm` | func |
| 26474 | `_showSiegeDefendConfirm` | func |
| 26536 | `confirmSiegeDefend` | func |
| 26595 | `confirmSiegeBattle` | func |
| 26680 | `_showNextBattleConfirm` | func |
| 26902 | `selectDuelChallenger` | func |
| 26934 | `confirmBattle` | func |
| 27091 | `_resolveBattleEngagement` | func |
| 27309 | `processReinforcement` | func |
| 27443 | `showNextBattleReport` | func |
| 27858 | `closeBattleModal` | func |
| 27886 | `showNextPrisonerModal` | func |
| 27960 | `playerDisposePrisoner` | func |
| 28011 | `openRecruitModal` | func |
| 28022 | `closeRecruitModal` | func |
| 28027 | `getDeployedGens` | func |
| 28036 | `renderRecruitModal` | func |
| 28259 | `rmEditSlot` | func |
| 28260 | `rmToggleSub` | func |
| 28266 | `rmPickGen` | func |
| 28298 | `rmPickType` | func |
| 28317 | `_rmSetClass` | func |
| 28322 | `_getBilletRetainerTroops` | func |
| 28330 | `_getBilletRetainerType` | func |
| 28337 | `rmSetTroops` | func |
| 28357 | `rmAdjTroops` | func |
| 28359 | `confirmRecruit` | func |
| 28480 | `closeUnitMenu` | func |
| 28487 | `issueUnitMove` | func |
| 28869 | `_collectPlayerVisibleKeys` | func |
| 28878 | `_animateFogReveal` | func |
| 28916 | `_checkInstantBattleTrigger` | func |
| 28942 | `clearMovePreview` | func |
| 28949 | `closeStackPicker` | func |
| 28955 | `showStackPicker` | func |
| 28993 | `onStackPickerSelect` | func |
| 29020 | `onUnitLeftClick` | func |
| 29078 | `onUnitRightClick` | func |
| 29083 | `onMapRightClick` | func |
| 29099 | `svgEventCoords` | func |
| 29118 | `handleMapClick` | func |
| 29233 | `handleCityClick` | func |
| 29269 | `getUnitDisplayPos` | func |
| 29273 | `renderUnitsOnMap` | func |
| 29475 | `showUnitTip` | func |
| 29575 | `renderUnitDetail` | func |
| 29871 | `launchSiegeAttack` | func |
| 29910 | `cancelSiege` | func |
| 29921 | `startMoveFromPanel` | func |
| 29933 | `cancelUnitMove` | func |
| 29946 | `billetUnit` | func |
| 29973 | `_confirmBillet` | func |
| 30026 | `sortieFromCity` | func |
| 30069 | `setCamp` | func |
| 30099 | `setAmbush` | func |
| 30121 | `cancelSpecialStatus` | func |
| 30150 | `openRedeployModal` | func |
| 30176 | `_rdpGetReadyPool` | func |
| 30183 | `_rdpSlotInfo` | func |
| 30201 | `_renderRedeployModal` | func |
| 30328 | `_rdpEditSlot` | func |
| 30333 | `_rdpToggleSub` | func |
| 30339 | `_rdpPickAux` | func |
| 30343 | `_rdpPickGen` | func |
| 30364 | `_confirmRedeploy` | func |
| 30420 | `disbandUnit` | func |
| 30426 | `getUnitAtCity` | func |
| 30436 | `openExpandModal` | func |
| 30467 | `closeExpandModal` | func |
| 30471 | `renderExpandModal` | func |
| 30544 | `exAdj` | func |
| 30556 | `exSet` | func |
| 30569 | `confirmExpand` | func |
| 30646 | `_getIdleGens` | func |
| 30657 | `openAddSquadModal` | func |
| 30675 | `closeAddSquadModal` | func |
| 30679 | `renderAddSquadModal` | func |
| 30796 | `asPickGen` | func |
| 30805 | `asPickType` | func |
| 30818 | `asAdjTroops` | func |
| 30826 | `asSetTroops` | func |
| 30835 | `confirmAddSquad` | func |
| 30914 | `renderMilTab` | func |
| 30987 | `_clampMapTransform` | func |
| 30994 | `resetMapView` | func |
| 31000 | `_applyMapTransformOnly` | func |
| 31004 | `_debouncedMapRender` | func |
| 31008 | `zoomMap` | func |
| 31088 | `_onDocKeydown` | func |
| 31106 | `SAVE_SLOT_COUNT` | data |
| 31107 | `SAVE_KEY_PREFIX` | data |
| 31110 | `_serializeG` | func |
| 31136 | `_deserializeG` | func |
| 31380 | `showTitleScreen` | func |
| 31421 | `_exitGame` | func |
| 31431 | `backToTitle` | func |
| 31467 | `showScenarioSelect` | func |
| 31502 | `onScenarioSelect` | func |
| 31511 | `TAB_HELP` | data |
| 31883 | `showTabHelp` | func |
| 31909 | `closeTabHelp` | func |
| 31914 | `_tabHelpHtml` | func |
| 31923 | `TUT_PAGES` | data |
| 32034 | `_TUT_SECTIONS` | data |
| 32036 | `showTutorial` | func |
| 32048 | `closeTutorial` | func |
| 32060 | `_clearTutHighlight` | func |
| 32065 | `_applyTutHighlight` | func |
| 32094 | `_renderTutPage` | func |
| 32145 | `_positionTutCard` | func |
| 32165 | `showFactionSelect` | func |
| 32209 | `startAs` | func |
| 32223 | `showSaveLoadPanel` | func |
| 32295 | `_selectSlot` | func |
| 32303 | `_updateSlotButtons` | func |
| 32383 | `closeSaveLoadPanel` | func |
| 32395 | `runIntegrityAudit` | func |
| 32631 | `checkElimination` | func |
| 32696 | `showGameEndOverlay` | func |
| 32861 | `_updateIntelHistory` | func |
| 32913 | `_buildIntelWarnings` | func |
| 32980 | `_buildFogEstimates` | func |
| 33040 | `_buildFogCities` | func |
| 33060 | `_buildConstraints` | func |
| 33131 | `_recordActionSummary` | func |
| 33170 | `_recordWarJournal` | func |
| 33183 | `_isStrategicTurn` | func |
| 33206 | `_buildDeltaSnapshot` | func |
| 33296 | `_tacticalSystemPrompt` | func |
| 33360 | `getGameState` | func |
| 33667 | `_claudeSystemPrompt` | func |
| 33995 | `_parseOpenAIResponse` | func |
| 34061 | `_parseClaudeResponse` | func |
| 34124 | `inspectState` | func |
| 34131 | `setClaudeKey` | func |
| 34143 | `executeClaudeActions` | func |
| 34177 | `_execOneAction` | func |
| 34235 | `_resolveCityId` | func |
| 34240 | `_resolveFacId` | func |
| 34245 | `_findUnit` | func |
| 34248 | `_genInFac` | func |
| 34251 | `_genDeployed` | func |
| 34259 | `_execBuild` | func |
| 34292 | `_execSetTax` | func |
| 34300 | `_execSetPrefect` | func |
| 34311 | `_execTransferFood` | func |
| 34326 | `_execToggleResupply` | func |
| 34333 | `_execCancelSupply` | func |
| 34343 | `_execAppointPost` | func |
| 34371 | `_execDismissPost` | func |
| 34378 | `_execSetStrategist` | func |
| 34389 | `_execRecruitWild` | func |
| 34401 | `_execPoach` | func |
| 34419 | `_execResearch` | func |
| 34442 | `_execDeclareWar` | func |
| 34473 | `_execProposeAlliance` | func |
| 34497 | `_execBreakAlliance` | func |
| 34510 | `_execDiploGift` | func |
| 34527 | `_execDiploArmistice` | func |
| 34560 | `_execStartClaim` | func |
| 34570 | `_execDemandVassal` | func |
| 34577 | `_execSubmitVassal` | func |
| 34584 | `_execReleaseVassal` | func |
| 34595 | `_execSchemeDriveWolf` | func |
| 34621 | `_execSchemeTwoTigers` | func |
| 34641 | `_execSchemeSpy` | func |
| 34668 | `_execSchemeRumor` | func |
| 34691 | `_execSchemeScout` | func |
| 34724 | `_execMove` | func |
| 34743 | `_execRecruit` | func |
| 34791 | `_execDisband` | func |
| 34805 | `_execSetCamp` | func |
| 34815 | `_execSetAmbush` | func |
| 34827 | `_execCancelSpecial` | func |
| 34837 | `_execCancelSiege` | func |
| 34845 | `_execBillet` | func |
| 34871 | `_execSetReinforcePolicy` | func |
| 34885 | `_execEnthrone` | func |
| 34896 | `toggleClaudeAI` | func |
| 34912 | `_showApiKeyModal` | func |
| 34961 | `_populateApiModal` | func |
| 34982 | `_onModelSelectChange` | func |
| 34989 | `_onApiFormatChange` | func |
| 35002 | `_confirmApiKey` | func |
| 35023 | `_updateAIToggleBtn` | func |
| 35034 | `enableClaudeAI` | func |
| 35039 | `disableClaudeAI` | func |

---

## v172 新增重点函数（快速定位）

| 行号 | 名称 | 说明 |
|------|------|------|
| 4699 | `getStage` | 读取势力当前阶段 |
| 4702 | `getAnchorState` | 读取势力当前 anchor 州 |
| 4705 | `countCitiesInState` | 势力在某州持有的城市数 |
| 4710 | `getQualifiedStates` | 返回满足 anchor 资格的州（≥3城+非小州） |
| 4720 | `countFacCities` | 势力总城市数 |
| 4725 | `_updateStateAnchorClock` | 每旬更新 anchor clock（3城持续时长追踪） |
| 4744 | `_selectBestAnchor` | 客观选出最佳 anchor 州 |
| 4769 | `checkStagePromotion` | 检查势力是否满足晋升条件 |
| 4796 | `promoteStage` | 执行晋升（含日志和通知） |
| 4825 | `processStageEvolution` | 每旬主循环（clock 更新 + 自动晋升） |
| 4834 | `getStageBadgeText` | UI: 势力卡片徽章文本 |
| 4845 | `getStageColor` | UI: 阶段颜色 |
| 4850 | `getStageNarrative` | UI: 派系Tab 阶段栏叙事 |

## v172 新增重点数据（快速定位）

| 行号 | 名称 | 说明 |
|------|------|------|
| 4108 | `STATE_CITIES` | 14州→城市数组 |
| 4125 | `STATE_NAMES` | 州id→中文名 |
| 4132 | `STATE_TIER` | 州→large/medium/small |
| 4139 | `CITY_TO_STATE` | 城市→州反查 |
| 4143 | `STATE_TO_GENTRY_FAC` | 州→士族派系id |
| 4154 | `GENTRY_FAC_TO_STATES` | 士族派系→属州数组 |
| 1185 | `STAGE_NAMES` | warlord/regional/regime → 中文 |
| 1186 | `STAGE_ORDER` | 阶段顺序序数 |
| 1189 | `STAGE_GENTRY_BOUNDS` | 豪族支持度按阶段上下限 |
| 1196 | `STAGE_PROMO` | 晋升条件参数 |
| 1177 | `FAC_IDENTITY` | 势力身份（含 stage + anchorState） |
| 4889 | `FACTION_DEFS` | 派系定义（含 hebei/xuzhou） |

---

## v172+ 内部修订（post-v172）

本轮对 v172 晋升系统做了 audit 修复 + 扩展，**未新增函数**，只修改现有函数内部逻辑。版本号保持 v172。

### 修改点速查

| # | 行号 | 所属函数/位置 | 改动 |
|---|------|--------------|------|
| 1 | 16374-16375 | `nextTurn` | `processStageEvolution()` 提前到 `processGentry()` 之前调用（晋升当旬 gentry clamp 用新 stage） |
| 2 | 17273 | 势力卡片渲染（`fc-stage` 徽章） | 加 `canSee` 迷雾门禁，敌方势力阶段不可见 |
| 3 | 4828 | `processStageEvolution` | 修正误导注释（改为"18旬clock与regime条件天然不会同旬满足"） |
| 4 | 15693-15696, 15699, 15714 | `processGentry` 内 `g1Shared` 计算段 | 新增 `_stage/_occMod/_driftMod`，自然漂移和占领期惩罚按 stage 差异化 |
| 5 | 22170-22186 | `buildSupplyMap` BFS 主循环 | 新增 `gentryCoef` 变量，豪族支持度作用于地形消耗（我方下限0.3/敌方下限0.0/中立=1.0） |

### 关键数值（v172+）

#### gentry 恢复按 stage 差异化（L15693-15696）

| 因子 | warlord | regional | regime |
|---|---|---|---|
| 自然漂移 `_driftMod` | `0` | `+0.05` | `+0.10` |
| 占领期惩罚 `_occMod` | `-0.4` | `-0.3` | `-0.2` |

#### 补给豪族系数（L22175-22185）

```js
// 己方领地（terr.fac === fid）
myCoef = clamp(1 + (50 - gentry) / 50, 0.3, 2.0)

// 敌方领地（isHostile）
enemyCoef = clamp(1 + (gentry - 50) / 50, 0.0, 2.0)

// 中立/同盟/无主/海面：coef = 1.0
totalCost = terrainCost * coef + (isEnemy ? 3 : 0)
```

### 已验证通过（jsdom 实战测试）

- ✅ JS 语法检查
- ✅ 全量加载零错误
- ✅ 30 旬 nextTurn（fastForward）零错误
- ✅ 补给图自动更新（wei 势力覆盖从 1660 hex → 1236 hex）
- ✅ 军阀 bounds 生效（南中 jianning 接近 25 保底）
- ✅ gentry 动态变化（许昌 68.9→80.9 / 30旬）

### 未改动但值得下轮关注

- **小州无法晋升**：已确认为 feature（河北四州 ji/qing/you/bing 全 small，北方势力必须扩张到大中州才能升 regional）
- **regime 外来城 gentry 长期低迷**：测试中 wu 占的徐州城 gentry 跑到 10.4，可能让"自家境内出现断补区"—— 观察 AI 是否会安排本地太守
- **数值平衡**：下轮实战后再评估 clamp 边界是否合适

### 不变的部分（重要）

- **所有函数行号索引保持有效**（改动全部在现有函数内部，未移动整块代码）
- **无新增函数**（本轮是修订，不是扩展）
- **无新增常量**（使用已有 `STAGE_GENTRY_BOUNDS` / `SUPPLY_ENEMY_PENALTY` / `STAGE_PROMO` 等）

---

## v173 变更与行号偏移

### 变更概要

| 项 | 位置 | 新增行数 |
|---|------|---------|
| CSS 动画样式 | 第 496-518 行 | +24 |
| 战斗动画函数组 | 第 24883 行起 | +~900 |
| `confirmBattle` 改 async + 位置快照 + 前奏调用 + 碰撞调用 | 第 27815 行起 | +25 |

**v173 总行数**：36086（v172 为 35190，+896 行）

### v173 新增全局变量 & 常量

| 行号 | 名称 | 类型 | 说明 |
|------|------|------|------|
| 24886 | `_battleAnimating` | let | 动画互斥锁，防重入，不进存档 |
| 24890 | `DUEL_EPITHET` | const | 15 位核心名将的全称号映射表（关羽→美髯公关云长 等） |

### v173 新增函数（按行号排序）

| 行号 | 名称 | 签名 | 说明 |
|------|------|------|------|
| 24909 | `_getDuelEpithet(name)` | `(name) → string` | 核心名将用全称号，其他武将用名字 |
| 24921 | `_playDuelPreludeAnim(duel, atkPos, defPos)` | async, Promise | 叫阵前奏动画（2700ms，4 阶段：出阵/喊话/交锋/结果归阵） |
| 25242 | `_baGetUnitRenderPos(unit, allUnits, posOverride?)` | 返回 `{x, y}` | 计算 unit 在地图上的渲染位置，含 stack 扇形偏移，可接受位置 override |
| 25268 | `_playBattleCollisionAnim(attackers, defenders, report, posSnap)` | async, Promise | 战斗碰撞动画（3200ms，4 阶段：相撞/碰撞特效/飘字/结算） |

### v173 修改的函数

| 行号 | 名称 | 修改 |
|------|------|------|
| 27815 | `confirmBattle(fight)` | `function` → **`async function`**；在 `_resolveBattleEngagement` 前加位置快照 + 前奏动画 await；在 `_resolveBattleEngagement` 后加碰撞动画 await |

### v173 战斗相关函数完整索引（替代原 codemap 中对应段）

| 行号 | 名称 | 类型 | v172→v173 偏移 |
|------|------|------|------|
| 23404 | `resolveAmbush` | func | +45 |
| 23706 | `calcRaidChance` | func | +45 |
| 23741 | `resolveCampBattle` | func | +45 |
| 23968 | `checkUnitSynergy` | func | +45 |
| 23987 | `SYNERGY_LINES` / `getSynergyLine` | func | +45 |
| 23992 | `resolveBattle` | func | +45 |
| 24496 | `resolveNavalBattle` | func | +45 |
| 24554 | `estimateWinRate` | func | +45 |
| 24579 | `fuzzyEstimateWinRate` | func | +45 |
| 24604 | `calcRetreatResult` | func | +45 |
| 24656 | `canRetreat` | func | +45 |
| 24705 | `doRetreat` | func | +45 |
| **24886** | **`_battleAnimating` (v173 新)** | let | — |
| **24890** | **`DUEL_EPITHET` (v173 新)** | const | — |
| **24909** | **`_getDuelEpithet` (v173 新)** | func | — |
| **24921** | **`_playDuelPreludeAnim` (v173 新)** | func | — |
| **25242** | **`_baGetUnitRenderPos` (v173 新)** | func | — |
| **25268** | **`_playBattleCollisionAnim` (v173 新)** | func | — |
| 25723 | `autoResolvePendingBattle` | func | +881 |
| 25883 | `resolveSiegeBattle` | func | +881 |
| 26204 | `collectBattleSides` | func | +881 |
| 26259 | `aiInitiateBattle` | func | +881 |
| 26384 | `checkAmbushTriggers` | func | +881 |
| 26445 | `aiDecideDuelChallenger` | func | +881 |
| 26501 | `getDuelCandidates` | func | +881 |
| 26521 | `resolveDuel` | func | +881 |
| 26632 | `applyDuelMorale` | func | +881 |
| 26656 | `tryPassiveDuel` | func | +881 |
| 26810 | `_showAmbushConfirm` | func | +881 |
| 26906 | `confirmAmbush` | func | +881 |
| 26953 | `confirmAmbushAbort` | func | +881 |
| 27053 | `_showCampBattleConfirm` | func | +881 |
| 27171 | `confirmCampBattle` | func | +881 |
| 27239 | `_showSiegeBattleConfirm` | func | +881 |
| 27355 | `_showSiegeDefendConfirm` | func | +881 |
| 27417 | `confirmSiegeDefend` | func | +881 |
| 27476 | `confirmSiegeBattle` | func | +881 |
| 27561 | `_showNextBattleConfirm` | func | +881 |
| 27783 | `selectDuelChallenger` | func | +881 |
| **27815** | **`confirmBattle`** (改 async) | async func | +881 |
| 28008 | `_resolveBattleEngagement` | func | +896 |
| 28360 | `showNextBattleReport` | func | +896 |
| 28775 | `closeBattleModal` | func | +896 |

**注意**：CSS 插入点之后（>= 520 行）的所有行号都 +24；动画函数插入点之后（>= 24883 行）的行号都 +881~+896 不等（动画本身 ~880 行，confirmBattle 内再加 ~15 行）。其它模块（城市、外交、AI等）的偏移统一按+896 计算，如需精确定位建议用 `grep` 查函数名。

### v173 架构要点

**动画层挂载**：
- `_playBattleCollisionAnim` / `_playDuelPreludeAnim` 都把临时 SVG 动画层挂在 `#mapRoot` 内（不在 `#unitsLayer` 内），自动随 `_mapScale` 缩放
- 动画元素统一使用 `.battle-anim-layer` / `.duel-prelude-layer` 两个 class 作为清理标识
- `_battleAnimating` 在两个函数之间共享，互斥（前奏期间不能再进碰撞，反之亦然）

**动画引擎**（共享基础设施）：
- 两函数内部都实现了相同的 `EASE` / `_runTween` / `_startTween` 辅助
- **已知重复代码**：未来可能提取成 `_baAnimEngine` 模块级工具，当前为求改动最小保留内联

**触发点**（仅一处）：
- `confirmBattle` 内，**叫阵接受** → `_playDuelPreludeAnim` → **战斗结算** → `_playBattleCollisionAnim` → 战报弹窗
- 快进路径 `autoResolvePendingBattle` 不经过任何动画（纯结算）
- 其它 confirm 函数（confirmSiege/confirmCamp/confirmAmbush）**暂不播动画**（v174+ 可能扩展）

**战斗类型不播动画清单**（碰撞动画）：
- `report.type !== 'battle'`（ambush/camp/siege/retreat）
- `report.isNaval === true`
- AI vs AI（双方都非玩家方）
- 所有参战 unit 都在迷雾外

**v173 未做（留待后续迭代）**：
1. 营寨战 / 伏击战 / 攻城战 / 水战 的专属碰撞动画
2. AI 拒绝叫阵 / 玩家拒绝叫阵的视觉反馈
3. 一旬多场战斗的动画递减压缩机制
4. 对峙弹窗独立阶段（方向 A 被跳过，直接选了方向 B）

---

## v174 新增代码索引

### 新模块 / 函数（关键行号，基于 v174 文件）

| 行号 | 名称 | 类型 | 说明 |
|------|------|------|------|
| ~24888 | `_baCore` | IIFE 模块 | 战斗动画共享基础设施，导出 17 API（EASE/runTween/shouldSkip/ensureAnimLayer/spawnClashRing/spawnSlashes/spawnSparks/spawnClashMark/shakeMapSvg/spawnLossText/floatLossText/spawnResultText/animateResultText/makePhantom/cleanupAnimLayers/SVG_NS） |
| ~24894 | `_pendingBattleAnimations` | let [] | 被动战斗（AI 攻玩家等）动画请求队列 |
| ~24904 | `_drainPendingBattleAnimations` | async func | 队列 drain，等事件 modal 关闭再逐个播 |
| ~26040 | `_baDrawCampPalisade` | func | 营寨栅栏剪影（2 墙+8 桩+2 门柱+门楣+2 火把） |
| ~26110 | `_playCampBattleAnim` | async func | 营寨战动画主函数，按 report.mode 路由 raid/assault |

### 改动的已有函数

| 行号（v174）| 名称 | 改动 |
|------|------|------|
| ~16507 | `nextTurn` | renderAll 后调用 `_drainPendingBattleAnimations()` |
| ~25309 | `_playDuelPreludeAnim` | 内部 EASE/runTween 改为 `_baCore.runTween/startTween` 别名 |
| ~25712 | `_playBattleCollisionAnim` | 同上 + `makePhantom` 改为 `_baCore.makePhantom` wrapper |
| ~27047 | `aiInitiateBattle` 营寨战玩家攻方分支 | 保持 push `_pendingBattleConfirms`（走确认弹窗） |
| ~27049 | `aiInitiateBattle` 营寨战玩家守方分支 | 加位置快照 + push `_pendingBattleAnimations`（`kind:'camp'`） |
| ~27067 | `aiInitiateBattle` 营寨战 AI vs AI 分支 | 同上，shouldSkip 按迷雾判断 |
| ~27926 | `confirmCampBattle` | 改 async，位置快照 `_campPosSnap`，await 动画 |
| ~29192 | `showNextBattleReport` | 入口加 `if(_battleAnimating) setTimeout(200, retry)` 等锁 |

### v174 架构要点

**动画挂载层统一规范**：
- 所有新增动画通过 `_baCore.ensureAnimLayer(className)` 创建 animG 挂 mapRoot
- className 命名：`.xxx-anim-layer` 作清理标识（battle/duel-prelude/camp/ambush/siege/naval）
- `_battleAnimating` 全局锁互斥所有动画

**触发模式二分**：
- **主动路径**（玩家发起）：`confirmXxx` async + `await _playXxxAnim(...)` 直接 await 动画
- **被动路径**（AI 主动攻玩家 / AI vs AI）：push 到 `_pendingBattleAnimations` + 由 nextTurn 尾部 drain 统一播

**跳过条件统一**：`_baCore.shouldSkip(attackers, defenders, report, posSnap)` 一处集中判断：
- `_fastForward` / `_battleAnimating` / 空攻守 / AI vs AI（无玩家方）/ 迷雾外 / mapRoot 不存在

**drain 的事件同步**：drain 入口等 `G._pendingEvent` 和 `_pendingSiegeArrival` 都关闭再播动画，避免 modal 挡住动画。

**v173 两老函数的重构状态**：
- `_playBattleCollisionAnim` / `_playDuelPreludeAnim` 内部基建段已切到 `_baCore`
- **它们内部 mapRoot 查找仍内联**（没切 `ensureAnimLayer`），保守保持不改（因为这 2 个函数走的是主动路径，在 confirmBattle 里 await，mapRoot 此时一定存在）

### v174 未做（留待后续）

1. **Step 2 伏击战动画** — `_playAmbushBattleAnim`，原型 v0.2 方向 A
2. **Step 3 攻城战动画** — `_playSiegeBattleAnim`，4 幕长镜头
3. **Step 4 水战动画** — `_playNavalBattleAnim` + `_baCore.makeShipPhantom`
4. **drain 入口锁预占** — 把 `_battleAnimating=true` 上移到等待之前
5. **单挑动画** — 叫阵接受后在弹窗里播（v173 留的 Step 3）

---

## v175 新增代码索引

### 新模块 / 函数（关键行号，基于 v175 文件）

| 行号（v175） | 名称 | 类型 | 说明 |
|------|------|------|------|
| ~25287 | `_baCore.makeShipPhantom` | func | 船型幻影（水战专用）船身 + 桅 + 三角帆 + 名字 + 兵力条 |
| ~26598 | `_playAmbushBattleAnim` | async func | 伏击战动画主函数（方向 A：地形色遮罩 → 潜伏 → 跃出 → 单侧冲击 → 残兵）|
| ~26833 | `_baDrawCityWall` | func | 攻城战专用城墙组件（主墙+5垛口+城门+门楣+城楼，9 子元素）|
| ~26922 | `_playSiegeBattleAnim` | async func | 攻城战动画主函数（4 幕：列阵/箭雨/云梯/垛口碎裂）|
| ~27221 | `_playNavalBattleAnim` | async func | 水战动画主函数（船型幻影 + 冷色水花 + 火攻柱）|

### 改动的已有函数

| 行号（v175）| 名称 | 改动 |
|------|------|------|
| ~24918 | `_drainPendingBattleAnimations` | drain 加 3 个 kind 分支（ambush/siege/naval）|
| ~25392 | `_baCore` export | 加 `makeShipPhantom,` |
| ~8243 | rebellions/events 叛军攻城段 | posSnap + push `_pendingBattleAnimations` kind:'siege' |
| ~12670 | GT2 AI 围城守方博弈段 | posSnap + push 队列 kind:'siege' |
| ~28163 | `aiInitiateBattle` 攻城 AI vs AI 分支 | posSnap + push 队列 kind:'siege' |
| ~28251 | `checkAmbushTriggers` else 分支 | posSnap + push 队列 kind:'ambush' |
| ~27626 | `_siegeArrivalChoice` | 改 `async` + posSnap + await `_playSiegeBattleAnim` |
| ~28742 | `confirmAmbush` | 改 `async` + posSnap + await `_playAmbushBattleAnim` |
| ~29282 | `confirmSiegeDefend` | 改 `async` + posSnap + await `_playSiegeBattleAnim`（玩家守城）|
| ~29356 | `confirmSiegeBattle` | 改 `async` + posSnap + await `_playSiegeBattleAnim`（玩家攻城）|
| ~29711 | `confirmBattle` 水战分叉 | `if(_latestReport?.isNaval) await _playNavalBattleAnim else await _playBattleCollisionAnim` |
| ~29906 | `_resolveBattleEngagement` | 开头加 `_engagePosSnap`；`_battleReports.push` 后条件 push 队列 kind:'naval' |
| ~31590 | `_execInstantMarch` 伏击检测段 | posSnap + 直接 await `_playAmbushBattleAnim` |

### v175 架构要点

**伏击动画路由**：
- `report.ambushHit === true` → 完整潜伏 + 跃出（~3000ms）
- `report.ambushHit === false` → 跳过潜伏，警觉抖动后直接冲击（~2400ms）
- 结果大字 4 种 `(hit, ambWins)` 组合

**攻城动画路由**：
- `report.cityBreach ?? atkWins` 决定破城 vs 退敌分叉
- 破城：中央垛口 2 个（idx=1,3）下坠 + 门楣倒塌 + 攻方冲城门
- 退敌：云梯 `stroke-dasharray` 虚线化 + 攻方后退

**水战动画路由**：
- 总是播船型幻影 + 冷色水花
- `fireResult?.success === true` 触发火焰柱 + 火箭（Bezier path 每 70ms 重绘）
- 败方船 `rotate(-18°)` 半沉姿态

**push 点全局统计（v175 完整版）**：

| kind | push 点数 | 位置 |
|------|-----------|------|
| camp | 2 | aiInitiateBattle 营寨 AI vs AI + 玩家守方 |
| ambush | 1 | checkAmbushTriggers else 分支 |
| siege | 3 | aiInitiateBattle 攻城 AI vs AI + 叛军攻城 + GT2 AI 围城到期 |
| naval | 1 | _resolveBattleEngagement AI vs AI 水战 |
| **合计** | **7** | — |

### 战斗相关函数完整索引（v175 偏移 ~ +1088）

| 行号（v174）| 行号（v175）| 名称 |
|---|---|---|
| 23404 | 23404 | `resolveAmbush` |
| 23706 | 23706 | `calcRaidChance` |
| 23741 | 23741 | `resolveCampBattle` |
| 23992 | 23992 | `resolveBattle` |
| 24496 | 24496 | `resolveNavalBattle` |
| 24886 | 24886 | `_battleAnimating`（let）|
| 24909 | 24909 | `_getDuelEpithet` |
| 24921 | 24921 | `_playDuelPreludeAnim` |
| 25242 | 25242 | `_baGetUnitRenderPos` |
| 25268 | 25268 | `_playBattleCollisionAnim` |
| 25287（v174 不存在）| **25287** | **`makeShipPhantom`（v175 新）** |
| 26040 | 26040 | `_baDrawCampPalisade` |
| 26110 | 26110 | `_playCampBattleAnim` |
| — | **26598** | **`_playAmbushBattleAnim`（v175 新）** |
| — | **26833** | **`_baDrawCityWall`（v175 新）** |
| — | **26922** | **`_playSiegeBattleAnim`（v175 新）** |
| — | **27221** | **`_playNavalBattleAnim`（v175 新）** |
| 27053 | 28128 | `_showCampBattleConfirm` |
| 27171 | 28246 | `checkAmbushTriggers` |
| 27239 | 28314 | `_showSiegeBattleConfirm` |
| 27355 | 28430 | `_showSiegeDefendConfirm` |
| 27417 | 28492 | `confirmSiegeDefend` |
| 27476 | 28551 | `confirmSiegeBattle` |
| 27561 | 28636 | `_showNextBattleConfirm` |
| 27815 | 28900 | `confirmBattle` |
| 28008 | 29093 | `_resolveBattleEngagement` |
| 28360 | 29448 | `showNextBattleReport` |
| 28775 | 29863 | `closeBattleModal` |

**注意**：v175 偏移不统一 — `_baCore` 内新增 57 行，`_drainPendingBattleAnimations` +8 行，
新动画函数集中插入在 ~26598 起约 +924 行。所以 v174 行号加的偏移量取决于所在位置：
`< 25287` 偏移 0；`25287-26110` 偏移 +57；`26598+` 偏移 +65+(924-235)=+754 ~ +1088 不等。
精确定位建议用 `grep` 函数名。

### v175 自审发现的修复

| 行号（v175）| 名称 | 改动 |
|------|------|------|
| ~29473 | `_showNextBattleConfirm` 入口 | 新增等 `_battleAnimating` 锁 + 等 `_pendingBattleAnimations.length` 两层检查 |
| ~30302 | `showNextBattleReport` 入口 | 在已有等 `_battleAnimating` 后补等 `_pendingBattleAnimations.length`（v174 漏的条件）|
| ~29318 | `confirmSiegeDefend` 出城迎战分支 | 加 `_sortiePosSnap` + 按 `isNaval` 分叉挂接 naval/collision 动画（修 v173 就有的历史遗漏）|

**总行数**：v175 最终 38045 行（审计前 38012，审计修复 +33）。

### v175 反馈迭代后的最终行号（玩家实测修复）

| 行号（v175 最终）| 名称 | 说明 |
|------|------|------|
| 18809 | 城市面板"敌军围城中"段 | 字色适配深红底（米黄+亮金）|
| 26598 | `_playAmbushBattleAnim` | 文案"反击奏效"→"伏击失利" |
| 26834 | `_playSiegeBattleAnim` | 重写：去城墙，围绕 city.x/y 展开；virtualGarrison 兜底；缺 x/y 走 hexToPixel fallback |
| 27145 | `_playNavalBattleAnim` | 无改动 |
| 28613, 28621, 28874, 28882 | 火攻 UI 两处弹窗 | 淡黄字 → 深墨字（4 处 CSS）|
| 29242 | `confirmSiegeDefend` 出城迎战 | `_sortiePosSnap` + naval/collision 分叉 |
| 29397 | `_showNextBattleConfirm` | 等 `_battleAnimating` + `_pendingBattleAnimations.length` |
| 30226 | `showNextBattleReport` | 同上（补等队列条件）|

**已删除的函数**：
- `_baDrawCityWall`（-90 行）

**新增的测试文件**：
- `test_v175_garrison.js`（6 项专项测试）

**最终总行数**：37965 行（v174: 36924，v175 实装后 38012，审计修复 38045，反馈迭代后 37965）。

### 反馈迭代改动清单

| # | 位置 | 改动 | 行数 |
|---|------|------|------|
| 1 | `_playAmbushBattleAnim` 结果大字 | 「反击奏效」→「伏击失利」 | 0 |
| 2 | 删除 `_baDrawCityWall` | 整段删除 | -90 |
| 3 | 重写 `_playSiegeBattleAnim` | 去城墙 + virtualGarrison 兜底 + fallback 位置计算 | -11（相对原实装）|
| 4 | 火攻 UI 字色 | 4 处 CSS 替换 | 0 |
| 5 | 围城信息字色 | 3 处 CSS 替换 | 0 |

**净减少 80 行**。

### v175 fix3（第二次反馈迭代）

| 行号（v175 fix3）| 名称 | 改动 |
|------|------|------|
| 26838-26857 | `_playSiegeBattleAnim` 入口 virtualGarrison 兜底 | 去掉 `city.garrison > 0` 判断；数量取 `city.garrison` 或 `report.defLost*0.3`（≥500）；避免 resolveSiegeBattle 清零后失效 |
| 18809-18813 | 城市面板"敌军围城中"区块 | 深红底→米白底，字色深墨，强调色暗金，保留红色标题 |

**最终总行数**：37970 行（fix2: 37965 + 5 行兜底 troops 计算逻辑）

### fix3 新增测试文件

- `test_v175_real_path.js` — 模拟真实玩家路径（含 resolveSiegeBattle 副作用）

### v175 fix4（第三次反馈迭代）

| 行号（v175 fix4）| 改动 |
|------|------|
| 26889-26921 | `_playSiegeBattleAnim`：defPositions 过滤 virtualGarrison，守方 phantom 只来自真实野战部队 |
| 27104-27110 | Ph4 新增 virtualGarrison 的守军损失飘字（从城市 icon 位置发出）|

**最终总行数**：37973 行

---

## v176 终态行号索引(阶段A 完成)

> **以下章节是 v176 收尾时回顾性写的最终行号索引,目的:让未来阅读者直接看这一节就能定位到任何Debug函数。**
> **下面"v176 Debug 模块(阶段A)"章节及之后的 v176-A2/A3/A4/A5 修复章节是5轮迭代的原始记录,作为追溯保留(其中行号均为各历史版本快照,不再准确)。**

### 文件总行数(终态)
**39347行** (v175原文 37973 + Debug代码 1374)。

### 模块分区(终态行号)

| 行号 | 模块 |
|------|------|
| 37951-37956 | v176 Debug Panel HTML注释横幅 |
| 37957-38028 | CSS(全部带 `#_dbg_` / `.dbg-` 前缀) |
| 38030 | IIFE 起始 `(function(){` |
| 38033 | 激活检测 `if(!location.hash.includes('debug')) return;` |
| 38036-38042 | `window._debug` 命名空间初始化(version=v176-A5) |
| 38045-38110 | 辅助函数:toast/safeApply/parseNum/waitForGame |
| 38113-38158 | `_dbgInit` + DOMContentLoaded 监听 + setInterval刷新 |
| 38160-38196 | UI构造:buildUI/sectionHTML/facOptions(5个section注册) |
| 38216-38345 | Section 1:资源/关系 |
| 38347-38595 | Section 2:部队操控(含强制战斗5种类型) |
| 38598-38656 | 瞬移click模式(基于 `svgEventCoords`) |
| 38659-38874 | 强制战斗子系统(`_dbgRunForceBattle` 5分支 + 辅助) |
| 38876-38940 | 战斗动画相关辅助:`_dbgOverrideShouldSkip`/`_dbgRevealAround`/`_dbgPlayPending` |
| 38952-39117 | Section 3:事件触发(含100次试探诊断) |
| 39119-39167 | Section 4:快进/AI托管 |
| 39172-39310 | Section 5:存档(3槽 + 剪贴板) |
| 39313-39327 | 全面刷新 + 暴露API |
| 39329 | IIFE 收尾 `})();` |

### 函数索引(终态行号,按出现顺序)

| 行号 | 名称 | 类别 |
|---|---|---|
| 38045 | `_dbgToast` | 辅助 |
| 38061 | `_dbgSafe` | 辅助 |
| 38076 | `_dbgParseNum` | 辅助 |
| 38089 | `_dbgApplyNum` | 辅助 |
| 38097 | `_dbgWaitForGame` | 辅助 |
| 38113 | `_dbgInit` | 核心 |
| 38160 | `_dbgBuildUI` | 核心 |
| 38198 | `_dbgSectionHTML` | UI |
| 38206 | `_dbgFacOptions` | UI |
| 38216 | `_dbgRSHtml` | Section1 |
| 38240 | `_dbgBindRS` | Section1 |
| 38328 | `_dbgSetRelation` | Section1 |
| 38347 | `_dbgUnitHtml` | Section2 |
| 38414 | `_dbgAllUnitOptions` | Section2 |
| 38427 | `_dbgGetSelUnit` | Section2 |
| 38432 | `_dbgRefreshUnitSection` | Section2 |
| 38445 | `_dbgRefreshCityOptions` | Section2 |
| 38457 | `_dbgRefreshGenOptions` | Section2 |
| 38475 | `_dbgBindUnit` | Section2 |
| 38598 | `_dbgStartTeleport` | 瞬移 |
| 38610 | `_dbgCancelTeleport` | 瞬移 |
| 38618 | `_dbgTeleportClickHandler` | 瞬移 |
| 38641 | `_dbgPickHexFromEvent` | 瞬移(用 `svgEventCoords`) |
| 38659 | `_dbgForceBattleFromDropdowns` | 强制战斗入口 |
| 38687 | `_dbgPrepUnit` | 强制战斗预处理 |
| 38695 | `_dbgEnsureFireFunds` | 火攻充值 |
| 38703 | `_dbgFindNearbyRiverHex` | 水战找hex |
| 38721 | `_dbgPosSnap` | 战前快照 |
| 38727 | `_dbgRunForceBattle` | **强制战斗主分发**(5种类型) |
| 38876 | `_dbgRender` | 包装renderAll |
| 38883 | `_dbgOverrideShouldSkip` | A4增,override `_baCore.shouldSkip` |
| 38893 | `_dbgRestoreShouldSkip` | 恢复 |
| 38902 | `_dbgRevealAround` | A5增,BFS揭雾 |
| 38928 | `_dbgPlayPending` | drain队列+弹战报 |
| 38942 | `_dbgGuessCityForUnit` | 攻城fallback |
| 38952 | `_dbgEventHtml` | Section3 |
| 38971 | `_dbgGameSnapshot` | A3,游戏状态友好展示 |
| 38998 | `_dbgProbeCondition` | A3,100次试探 |
| 39025 | `_dbgBindEvent` | Section3 |
| 39080 | `_dbgRenderDiag` | A3,诊断框渲染 |
| 39119 | `_dbgTimeHtml` | Section4 |
| 39134 | `_dbgBindTime` | Section4 |
| 39145 | `_dbgFastForward` | 包装 `fastForwardTurns` |
| 39163 | `_dbgRefreshTurnDisplay` | A3改名自`_dbgRefreshAutopilotStatus` |
| 39172 | `_dbgSaveHtml` | Section5 |
| 39182 | `_dbgSlotRow` | Section5 |
| 39192 | `_dbgBindSave` | Section5 |
| 39207-39208 | `_dbgSlotKey`/`_dbgSlotMetaKey` | localStorage key |
| 39211 | `_dbgLS` | A2增,localStorage安全wrapper |
| 39220 | `_dbgSlotSave` | Section5 |
| 39240 | `_dbgSlotLoad` | Section5 |
| 39250 | `_dbgSlotDelete` | Section5 |
| 39260 | `_dbgRefreshSlotLabels` | Section5 |
| 39275 | `_dbgExportClipboard` | Section5 |
| 39293 | `_dbgImportClipboard` | Section5 |
| 39313 | `_dbgRefreshAll` | 初次刷新 |

### 调用游戏内函数总清单(终态)

| 函数/常量 | v175行号 | Debug用途 |
|---|---|---|
| `renderAll()` | 16884 | safe包装 + 战斗后 |
| `invalidateFogCache()` | 17511 | 同上 |
| `addUnitExp(unit, n)` | 974 | +经验 |
| `createUnit({fac, spawnCityId, squads})` | 21765 | 创建部队 |
| `_resolveBattleEngagement` | 29864 | 野战/水战入口 |
| `resolveAmbush` | 23423 | 伏击直调 |
| `resolveCampBattle` | 23760 | 营寨战直调 |
| `resolveSiegeBattle` | 27602 | 攻城战直调 |
| `_playBattleCollisionAnim` | 25758 | 野战动画手动await |
| `_playNavalBattleAnim` | 27148 | 水战动画手动await |
| `_drainPendingBattleAnimations` | 24918 | drain队列(伏击/营寨/攻城) |
| `showNextBattleReport` | 30229 | 战报modal |
| `_battleReports` | 24876 | push伏击/营寨/攻城战报 |
| `_pendingBattleAnimations` | 24911 | push动画 |
| `_baCore` | 24955 | shouldSkip override(scope共享) |
| `svgEventCoords(e)` | 31902 | 瞬移坐标(处理 `_mapTx/_mapTy/_mapScale`) |
| `pixelToHex(x, y)` | 1683 | hex坐标 |
| `hexNeighbors(col, row)` | 1705 | BFS揭雾 |
| `hkey(col, row)` | (常量) | hex key |
| `getTerrainAt(col, row)` | 2759 | 地形 |
| `isWaterHex(col, row)` | 2732 | (未直接用,逻辑参考) |
| `canFireAttack(terrain)` | 23354 | 火攻地形检验 |
| `FIRE_COST` | 23352 | 火攻成本充值 |
| `FOG_VISIBLE` | 1749 | 揭雾值 |
| `HEX_TERRAIN` | 2475 | 找river hex |
| `HEX_CITY` | 2477 | hex→city反查 |
| `EVENT_DEFS` | 8294 | 33个事件 |
| `_showEventToPlayer` | 10884 | 玩家事件UI |
| `AI_PERSONALITY` | (常量) | AI事件选择 |
| `fastForwardTurns(n)` | 17836 | 快进+AI托管 |
| `_serializeG()` | 33913 | 存档(返回字符串) |
| `_deserializeG(jsonStr)` | 33939 | 读档(接受字符串) |
| `G` 全局对象的字段 | (G字段) | factions/cities/diplo/units/reputation/generals/playerFac/fog/turn/seasonIdx等 |
| `FAC` / `ALL_FACS` | 1182 | 势力配置/列表 |

### CSS类清单(终态)

```
#_dbg_corner       角标
#_dbg_panel        主面板
#_dbg_toast        toast元素
#_dbg_style        style标签id

.dbg-section       折叠section容器
.dbg-section-header
.dbg-section-arrow ▸/▾
.dbg-section-body
.dbg-row
.dbg-label
.dbg-input         (.dbg-wide)
.dbg-btn           (.dbg-danger / .dbg-active)
.dbg-select
.dbg-info
.dbg-divider
.dbg-checkbox
```

### DOM ID 总清单(终态)

```
角标/面板/toast:
  _dbg_corner / _dbg_panel / _dbg_toast

资源/关系:
  _dbg_rs_fac _dbg_rs_gold _dbg_rs_wood _dbg_rs_iron _dbg_rs_horse
  _dbg_rs_rep _dbg_rs_food _dbg_rs_apply _dbg_rs_max
  _dbg_rs_a _dbg_rs_b _dbg_rs_status _dbg_rs_rel
  _dbg_rs_setrel _dbg_rs_warall _dbg_rs_neutral

部队操控:
  _dbg_unit_body  (动态重建容器)
  _dbg_un_tp _dbg_un_full _dbg_un_ap _dbg_un_hp _dbg_un_exp _dbg_un_del
  _dbg_un_fac _dbg_un_city _dbg_un_gen _dbg_un_troops _dbg_un_type _dbg_un_create

强制战斗:
  _dbg_fb_atk _dbg_fb_def
  _dbg_fb_kind
  _dbg_fb_terrain_row _dbg_fb_terrain
  _dbg_fb_mode_row _dbg_fb_mode
  _dbg_fb_city_row _dbg_fb_city
  _dbg_fb_fire _dbg_fb_go

事件触发:
  _dbg_ev_id _dbg_ev_fac _dbg_ev_luck
  _dbg_ev_fire _dbg_ev_diag _dbg_ev_diag_box

快进/AI托管:
  _dbg_tt_turn _dbg_tt_n _dbg_tt_go _dbg_tt_status

存档:
  _dbg_sv_export _dbg_sv_import
  _dbg_sv_label_1 _dbg_sv_label_2 _dbg_sv_label_3
  (槽位按钮通过 data-sv="save|load|del" + data-n="1|2|3" 委托)
```

### 5轮迭代版本号回顾

| 版本 | 行数 | 主要内容 |
|---|---|---|
| v176-A1 | 39007 | 初版,7 section(含独立的"AI托管") |
| v176-A2 | 39043 | 瞬移修(用 `svgEventCoords`)+ 强制战斗下拉双选 + 事件诊断框 |
| v176-A3 | 39254 | 强制战斗扩5种类型 + 同势力guard + 事件试探100次 + AI托管/时间旅行合并(7→5 section) |
| v176-A4 | 39286 | 守方下拉过滤同势力 + override `_baCore.shouldSkip` 让AI vs AI能播动画 |
| v176-A5 | **39347** | 临时改 `G.playerFac` 修野战retreat过滤+内联hasPlayer检查 + 揭雾 |

### 终态行号索引完。

---

## v176 Debug 模块（阶段A）

> **位置**：游戏主`</script>`(行37950)之后、`<!-- General Profile Modal -->`(行38986)之前。
> **结构**：HTML注释 → `<style id="_dbg_style">` (行37957-38028) → `<script>` IIFE (行38030-38983)
> **激活**：URL `#debug`，否则IIFE首行return。
> **主代码改动**：0行。

### 模块分区索引

| 行号 | 模块 |
|------|------|
| 37951-37956 | v176 Debug Panel HTML 注释横幅 |
| 37957-38028 | CSS（`#_dbg_corner` / `#_dbg_panel` / `.dbg-section` / `.dbg-btn` / `#_dbg_toast` 等，全部带前缀） |
| 38030 | IIFE 起始 `(function(){` |
| 38033 | 激活检测 `if(!location.hash.includes('debug')) return;`（不带#debug时零代码执行） |
| 38036-38044 | `window._debug` 命名空间初始化 |
| 38046-38114 | 辅助函数（toast / safeApply / parseNum / waitForGame） |
| 38116-38162 | `_dbgInit` 主初始化 + DOMContentLoaded 监听 |
| 38164-38220 | UI构造（buildUI / sectionHTML / facOptions） |
| 38222-38351 | Section: 资源/关系 |
| 38353-38659 | Section: 部队操控（含瞬移/强制战斗的click handler） |
| 38661-38715 | Section: 事件触发 |
| 38717-38762 | Section: 时间旅行 |
| 38764-38830 | Section: AI托管玩家 |
| 38832-38966 | Section: 存档（含 localStorage safe wrapper） |
| 38968-38980 | 全面刷新 + 暴露API |
| 38983 | IIFE 收尾 `})();` |

### 函数索引（按行号）

| 行号 | 名称 | 类型 | 说明 |
|------|------|------|------|
| 38030 | IIFE root | wrapper | 顶层包装 |
| 38048 | `_dbgToast` | helper | 屏幕底部提示弹 |
| 38064 | `_dbgSafe` | helper | 安全包装(自动renderAll+invalidateFogCache+toast) |
| 38079 | `_dbgParseNum` | helper | 输入解析(空/数字/+5000/-200) |
| 38092 | `_dbgApplyNum` | helper | 把parse结果应用到当前值 |
| 38100 | `_dbgWaitForGame` | helper | 200ms轮询G就绪,15s超时 |
| 38116 | `_dbgInit` | core | 主初始化(buildUI + setInterval刷新 + ESC监听) |
| 38164 | `_dbgBuildUI` | core | 创建角标和主面板,绑定所有section事件 |
| 38204 | `_dbgSectionHTML` | helper | section template |
| 38212 | `_dbgFacOptions` | helper | 势力下拉html |
| 38222 | `_dbgRSHtml` | section1 ui | 资源/关系HTML |
| 38246 | `_dbgBindRS` | section1 bind | 4个按钮:apply/max/setrel/warall/neutral |
| 38334 | `_dbgSetRelation` | section1 core | 直改G.diplo[k1/k2].status/rel(双向) |
| 38353 | `_dbgUnitHtml` | section2 ui | 部队操控HTML(含选中info) |
| 38391 | `_dbgGetSelUnit` | section2 helper | 取G.selUnitId对应unit |
| 38396 | `_dbgRefreshUnitSection` | section2 helper | 选中变化时仅重建body(避免破坏输入) |
| 38409 | `_dbgRefreshCityOptions` | section2 helper | 创建部队的"城"下拉根据势力联动 |
| 38421 | `_dbgRefreshGenOptions` | section2 helper | 创建部队的"武将"下拉(排除已在squad的) |
| 38439 | `_dbgBindUnit` | section2 bind | 6个按钮(瞬移/满编/清AP/+血/+经验/强制战斗/删除) + 创建按钮 |
| 38519 | `_dbgStartTeleport` | section2 mode | 进瞬移模式(光标改crosshair, capture点击) |
| 38531 | `_dbgCancelTeleport` | section2 mode | 退瞬移模式 |
| 38539 | `_dbgTeleportClickHandler` | section2 mode | 处理瞬移点击(改unit.hq/hr,清path) |
| 38562 | `_dbgPickHexFromEvent` | section2 helper | DOM爬data-q/r → SVG CTM逆变换 → pixelToHex |
| 38599 | `_dbgStartForceBattle` | section2 mode | 进强制战斗选目标模式 |
| 38608 | `_dbgCancelForceBattle` | section2 mode | 退强制战斗模式 |
| 38614 | `_dbgForceBattleClickHandler` | section2 mode | 找点中敌方unit(精确/容差1) → confirm → 触发战斗 |
| 38641 | `_dbgForceBattle` | section2 core | 敌方瞬移到己方hex + 调`_resolveBattleEngagement` |
| 38661 | `_dbgEventHtml` | section3 ui | EVENT_DEFS下拉 + 强制掷骰checkbox |
| 38676 | `_dbgBindEvent` | section3 bind | 触发按钮(condition+monkeypatch Math.random) |
| 38717 | `_dbgTimeHtml` | section4 ui | +1/+5/+10/+30按钮 + 自定义 |
| 38732 | `_dbgBindTime` | section4 bind | 调用`_dbgFastForward` |
| 38744 | `_dbgFastForward` | section4 core | 包装游戏现有`fastForwardTurns(n)` |
| 38764 | `_dbgAutopilotHtml` | section5 ui | 托管旬数+开始/停止 |
| 38776 | `_dbgBindAutopilot` | section5 bind | start/stop按钮 |
| 38790 | `_dbgAutopilot` | section5 core | for循环N次调`fastForwardTurns(1)`,可中途停止 |
| 38823 | `_dbgRefreshAutopilotStatus` | section5 helper | 当前旬显示 |
| 38832 | `_dbgSaveHtml` | section6 ui | 导出/导入剪贴板 + 3槽位 |
| 38842 | `_dbgSlotRow` | section6 helper | 单槽位HTML |
| 38852 | `_dbgBindSave` | section6 bind | 绑定export/import和3槽位的save/load/del |
| 38867 | `_dbgSlotKey` / `_dbgSlotMetaKey` | helper | localStorage key生成 |
| 38871 | `_dbgLS` | helper | localStorage安全wrapper(隐私模式/opaque origin保护) |
| 38880 | `_dbgSlotSave` | section6 core | 序列化G+元信息→localStorage |
| 38900 | `_dbgSlotLoad` | section6 core | localStorage→`_deserializeG` |
| 38910 | `_dbgSlotDelete` | section6 core | confirm后删 |
| 38920 | `_dbgRefreshSlotLabels` | section6 helper | 3槽位元信息刷新 |
| 38934 | `_dbgExportClipboard` | section6 core | navigator.clipboard.writeText |
| 38953 | `_dbgImportClipboard` | section6 core | navigator.clipboard.readText + _deserializeG |
| 38968 | `_dbgRefreshAll` | helper | 初次刷新(slot labels + autopilot status) |
| 38983 | IIFE 收尾 | wrapper | `})();` |

### 调用游戏内函数清单（v176只读不改）

| 函数 | v175行号 | Debug用途 |
|------|---------|-----------|
| `renderAll()` | 16884 | safe包装内自动调用 |
| `invalidateFogCache()` | 17511 | safe包装内自动调用 |
| `addUnitExp(unit, n)` | 974 | +经验按钮 |
| `createUnit({fac,spawnCityId,squads})` | 21765 | 创建部队 |
| `_resolveBattleEngagement(atk,def,label,duel)` | 29864 | 强制战斗 |
| `pixelToHex(x,y)` | 1683 | 地图点击坐标 |
| `EVENT_DEFS` | 8294 | 事件下拉数据源 |
| `_showEventToPlayer({def,ctx})` | 10884 | 玩家事件UI |
| `AI_PERSONALITY` | (常量) | 事件AI选择参数 |
| `fastForwardTurns(n)` | 17836 | 时间旅行+AI托管复用 |
| `_serializeG()` | 33913 | 存档(返回字符串) |
| `_deserializeG(jsonStr)` | 33939 | 读档(接受字符串) |
| `G` / `FAC` / `ALL_FACS` / `G.diplo` / `G.factions` / `G.cities` / `G.units` / `G.reputation` / `G.generals` / `G.selUnitId` | (全局) | 数据读写 |

### CSS类清单

```
#_dbg_corner       角标
#_dbg_panel        主面板(默认display:none, .dbg-visible时display:block)
#_dbg_toast        屏幕底部toast
#_dbg_style        style标签id

.dbg-section       折叠section容器
.dbg-section-header  header bar(点击切换dbg-open)
.dbg-section-arrow ▸/▾ 箭头
.dbg-section-body  body(默认hidden, .dbg-open时display)
.dbg-row           一行控件
.dbg-label         label文字
.dbg-input         数字输入框(.dbg-wide=140px)
.dbg-btn           按钮(.dbg-danger红边, .dbg-active橙底)
.dbg-select        下拉
.dbg-info          灰色提示文字
.dbg-divider       分隔线
.dbg-checkbox      checkbox(垂直对齐)
```

### DOM ID 清单

```
_dbg_corner        角标
_dbg_panel         主面板
_dbg_toast         toast元素

资源/关系:
_dbg_rs_fac _dbg_rs_gold _dbg_rs_wood _dbg_rs_iron _dbg_rs_horse
_dbg_rs_rep _dbg_rs_food _dbg_rs_apply _dbg_rs_max
_dbg_rs_a _dbg_rs_b _dbg_rs_status _dbg_rs_rel
_dbg_rs_setrel _dbg_rs_warall _dbg_rs_neutral

部队:
_dbg_unit_body  (动态重建容器)
_dbg_un_tp _dbg_un_full _dbg_un_ap _dbg_un_hp
_dbg_un_exp _dbg_un_fb _dbg_un_del
_dbg_un_fac _dbg_un_city _dbg_un_gen _dbg_un_troops _dbg_un_type
_dbg_un_create

事件:
_dbg_ev_id _dbg_ev_fac _dbg_ev_luck _dbg_ev_fire

时间:
_dbg_tt_turn _dbg_tt_n _dbg_tt_go _dbg_tt_status

AI托管:
_dbg_ai_n _dbg_ai_start _dbg_ai_stop _dbg_ai_status

存档:
_dbg_sv_export _dbg_sv_import
_dbg_sv_label_1 _dbg_sv_label_2 _dbg_sv_label_3
(slot按钮通过 data-sv="save|load|del" + data-n="1|2|3" 委托)
```

### 总行数

| 文件 | 行数 |
|------|------|
| project_romance_v175.html | 37973 |
| project_romance_v176.html | **39007** (+1034) |

行数增量分布：
- HTML注释横幅：~6行
- CSS：~72行
- JS：~956行（包括空行）

---

## v176-A2 修复后行号变化

实测反馈三点修复(详见 HANDOVER_v176.md "v176-A2 实测反馈修复"段)。
HTML 总行数:39007 → **39043** (+36)。

### 新增/变更函数(替代或追加)

| v176-A1行号 | A2 处理 | 函数 | 说明 |
|---|---|---|---|
| 38353 | **替换** | `_dbgUnitHtml` | UI: 移除按钮区"强制战斗"按钮; 在section末尾追加"强制战斗"双下拉小区 |
| (新增) | new | `_dbgAllUnitOptions` | 列所有 G.units 为下拉选项,跨势力 |
| 38439 | **替换** | `_dbgBindUnit` 中的 `_dbg_un_fb` 段 → `_dbg_fb_go` | 旧"强制战斗"按钮替换为"开打"按钮 |
| 38599-38624 | **删除** | `_dbgStartForceBattle` / `_dbgCancelForceBattle` / `_dbgForceBattleClickHandler` / `_dbgForceBattle`(旧版) | 旧地图点击模式整套移除 |
| (新增) | new | `_dbgForceBattleFromDropdowns` | 从两个下拉读ID,确认后调 `_dbgForceBattle` |
| (新增) | new | `_dbgForceBattle`(新版) | 双方瞬移合hex + status合理化 + AP充值≥10 + `_resolveBattleEngagement` |
| 38562 | **简化** | `_dbgPickHexFromEvent` | 删除DOM爬升和CTM逆变换分支,只保留 `svgEventCoords(e)` + `pixelToHex` |
| 38661 | **替换** | `_dbgEventHtml` | 加"查看condition"按钮和诊断框 `#_dbg_ev_diag_box` |
| (新增) | new | `_dbgGameSnapshot(fid)` | 当前游戏状态摘要(turn/season/资源/城/将/identity等) |
| 38676 | **扩展** | `_dbgBindEvent` | 触发失败时展开诊断框,加"查看condition"按钮的onclick |

### 模块字段变化

| 字段 | 变化 |
|---|---|
| `_debug.version` | `v176-A` → `v176-A2` |
| `_debug.forceBattleMode` | **删除**(模式状态,旧地图点击流用,已不需要) |
| `_debug.forceLuck` | **删除**(从未实际使用) |

### ESC监听简化

行 91-93:删除 `if(_debug.forceBattleMode) _dbgCancelForceBattle();` 一行。
现在ESC只关心 teleportMode。

### 调用游戏函数清单更新

| 函数 | v175行号 | A2 用途 |
|---|---|---|
| `svgEventCoords(e)` | 31902 | **新引用**:替代手写CTM逆变换,用于瞬移点击坐标 |

(其他函数清单不变,见 v176-A1 章节。)

### DOM ID 清单变化

新增:
```
_dbg_fb_atk          强制战斗-攻方部队下拉
_dbg_fb_def          强制战斗-守方部队下拉
_dbg_fb_go           强制战斗-开打按钮
_dbg_ev_diag         事件-查看condition按钮
_dbg_ev_diag_box     事件-诊断输出框(folded by default)
```

移除:
```
_dbg_un_fb           原"强制战斗"按钮(已移除整个交互模式)
```

---

## v176-A3 修复后行号变化

实测反馈四点修复(详见 HANDOVER_v176.md "v176-A3 第二轮反馈修复"段)。
HTML 总行数:39043 → **39254** (+211)。

### 模块字段变化

| 字段 | 变化 |
|---|---|
| `_debug.version` | `v176-A2` → `v176-A3` |
| `_debug.autopilotActive` | **删除**(AI托管section合并入快进) |
| `_debug.autopilotStopRequested` | **删除** |

### Section 变化

| 旧 | 新 |
|---|---|
| 6个section:RS/UN/EV/TT/AI/SV | 5个section:RS/UN/EV/TT/SV |
| `tt` 标题"时间旅行" | `tt` 标题"快进 / AI托管" |
| `ai` 标题"AI托管玩家" | (删除) |

### 删除的函数

| 函数 | 删除原因 |
|---|---|
| `_dbgAutopilotHtml` | AI托管section删除 |
| `_dbgBindAutopilot` | 同上 |
| `_dbgAutopilot(turns)` | 与 fastForwardTurns 路径重复 |
| `_dbgRefreshAutopilotStatus` | 改名为 `_dbgRefreshTurnDisplay`(只剩turn刷新) |

### 新增函数

| 函数 | 说明 |
|---|---|
| `_dbgRunForceBattle(atk, def, kind, opts)` | 异步,5种战斗类型分支 |
| `_dbgPrepUnit(u)` | 通用预处理:清行军/AP充值≥10/mobilizingTurns=0 |
| `_dbgEnsureFireFunds(fac)` | 火攻自动充资源 max(原值, FIRE_COST) |
| `_dbgFindNearbyRiverHex(q, r, maxR)` | 同心环BFS找river hex(用于水战) |
| `_dbgPosSnap(units)` | 战前位置快照(动画用) |
| `_dbgRender()` | 包装 renderAll + invalidateFogCache |
| `_dbgPlayPending()` | await `_drainPendingBattleAnimations` + `showNextBattleReport` |
| `_dbgGuessCityForUnit(u)` | u所在hex是否是城,返回cityId |
| `_dbgProbeCondition(def, fid, n)` | 100次试探返回 {n, ok, err, okWithLuck} |
| `_dbgRenderDiag(def, fid, isFromFailedFire)` | 渲染诊断框人话内容 |
| `_dbgRefreshTurnDisplay` | (改名自 `_dbgRefreshAutopilotStatus`) |

### 替换的函数

| 函数 | 改动 |
|---|---|
| `_dbgUnitHtml` | 强制战斗小区扩展:加 type/terrain/mode/city/fire 5字段 |
| `_dbgBindUnit` 中的 fb 段 | 加 `_dbg_fb_kind.onchange` 联动逻辑(显隐附属行+刷新city下拉) |
| `_dbgForceBattleFromDropdowns` | 加同势力guard;读取5字段;调 `_dbgRunForceBattle` |
| `_dbgForceBattle` | **删除**,被 `_dbgRunForceBattle` 替代 |
| `_dbgEventHtml` | 按钮"查看condition" → "试探100次" |
| `_dbgBindEvent` | 调 `_dbgRenderDiag`;切事件/势力清空诊断框 |
| `_dbgGameSnapshot(fid)` | 简化为游戏tab能看到的信息(去掉facIdentity/stage/strategist等内部字段) |
| `_dbgTimeHtml` | section文案改为"快进/AI托管",注解强调玩家由AI接管 |

### 调用游戏函数清单更新

| 函数 | v175行号 | A3 用途 |
|---|---|---|
| `resolveAmbush(atks, vics, terrain, fire)` | 23423 | **新引用**:伏击战斗解算 |
| `resolveCampBattle(atks, defs, mode, label, fire)` | 23760 | **新引用**:营寨战解算 |
| `resolveSiegeBattle(atks, defs, city, label)` | 27602 | **新引用**:攻城战解算 |
| `_drainPendingBattleAnimations()` | 24918 | **新引用**:播放动画队列 |
| `showNextBattleReport()` | 30229 | **新引用**:弹战报modal |
| `_battleReports` (push) | 24876 | **新引用**:手动push伏击/营寨/攻城战报 |
| `_pendingBattleAnimations` (push) | 24911 | **新引用**:手动push动画 |
| `getTerrainAt(col, row)` | 2759 | **新引用**:自动地形 |
| `isWaterHex(col, row)` | 2732 | (未直接用,逻辑相关) |
| `canFireAttack(terrain)` | 23354 | **新引用**:验证火攻地形 |
| `FIRE_COST` (常量) | 23352 | **新引用**:火攻成本充值 |
| `HEX_TERRAIN` (Map) | 2475 | **新引用**:BFS找river hex |
| `HEX_CITY` (Map) | 2477 | **新引用**:hex→city反查 |
| `hkey(col, row)` | (常量函数) | **新引用**:hex key |

### DOM ID 清单变化

新增:
```
_dbg_fb_kind         强制战斗-类型下拉(field/ambush/camp/siege/naval)
_dbg_fb_terrain_row  地形row容器(field/ambush时显示)
_dbg_fb_terrain      地形下拉
_dbg_fb_mode_row     模式row容器(camp时显示)
_dbg_fb_mode         模式下拉(assault/raid)
_dbg_fb_city_row     城row容器(siege时显示)
_dbg_fb_city         目标城下拉
_dbg_fb_fire         火攻checkbox
```

移除:
```
_dbg_ai_n            原AI托管section的旬数输入
_dbg_ai_start        原"开始托管"按钮
_dbg_ai_stop         原"立即停止"按钮
_dbg_ai_status       原状态显示
```

### 战斗类型分支细节(代码逻辑)

```
field:  def.hq=atk.hq, status=halt → _resolveBattleEngagement
naval:  BFS找river hex → 双方瞬移 → _resolveBattleEngagement (它内部 isWaterHex 走 resolveNavalBattle)
ambush: def.hq=atk.hq, atk.status=ambush, def.status=march → resolveAmbush 直调
camp:   atk.hq=def.hq, def.status=camp, atk.status=halt → resolveCampBattle 直调
siege:  def 进城 status=garrison, atk 同hex status=siege siegeTarget=city.id → resolveSiegeBattle 直调
```

火攻在 ambush/camp/naval 时:
- 检查 `canFireAttack(terrain)` 排除 plain
- 调 `_dbgEnsureFireFunds(G.factions[atk.fac])` 把 gold/wood 补到 FIRE_COST
- 把 useFire=true 传给底层 resolve 函数

### 总行数

| 文件 | 行数 |
|------|------|
| v175 | 37973 |
| v176-A1 | 39007 (+1034) |
| v176-A2 | 39043 (+36) |
| v176-A3 | **39254 (+211)** |

---

## v176-A4 修复后行号变化

实测反馈两点修复(详见 HANDOVER_v176.md "v176-A4 第三轮反馈修复"段)。
HTML 总行数:39254 → **39286** (+32)。

### 模块字段变化

| 字段 | 变化 |
|---|---|
| `_debug.version` | `v176-A3` → `v176-A4` |
| `_debug._lastSkipOverride` | **新增**:布尔诊断标志,记录最后一次 `_dbgPlayPending` 是否成功override了 `_baCore.shouldSkip`(供外部测试和console确认用) |

### 函数变更

| 函数 | 改动 |
|---|---|
| `_dbgAllUnitOptions(excludeFac)` | **加可选参数**:filter掉 `u.fac === excludeFac` 的部队;无参数时与之前相同 |
| `_dbgUnitHtml` | 守方下拉初始用 `_dbgAllUnitOptions(G.units[0]?.fac)` 排除第一支unit的势力 |
| `_dbgBindUnit` 中的 fb 联动段 | 新增 `_dbg_fb_atk.onchange` 监听:重建守方下拉,exclude新攻方fac;尽量保留之前选择 |
| `_dbgPlayPending` | **核心改动**:动画/战报调用前 monkeypatch `_baCore.shouldSkip = ()=>false`,`finally` 恢复;设 `_debug._lastSkipOverride` 诊断标志 |

### Scope 关键技术说明

游戏顶层声明:
```javascript
let G = {...};                  // line 3782
const FAC = {...};               // line 1182
const _baCore = (() => {...})(); // line 24955
const FIRE_COST = {...};         // line 23352
const HEX_TERRAIN = {};          // line 2475
let _battleReports = [];         // line 24876
let _pendingBattleAnimations = []; // line 24911
```

这些 `const`/`let` 变量**不会挂到 `window`** 上(即 `window.G === undefined`),但 Debug script 是另一个 `<script>` 块,与游戏 script 共享 ES 的 script-level global scope,所以 Debug 代码内**直接写 `G` / `_baCore` / `FAC`** 能访问到。

而 function declaration(如 `function renderAll(){...}`)会同时挂 `window.renderAll`,所以 `window.renderAll` 也能用。

这个差异在 jsdom 自动化测试中需要注意:从外部 testing harness 通过 `dom.window.G` 访问不到,但通过 `dom.window._serializeG()` 拿到 G 序列化数据可以。

### `_baCore.shouldSkip` 的6个跳过条件(参考)

来源 v175 行 24995:
```javascript
function shouldSkip(attackers, defenders, report, posSnap){
  if(_fastForward) return true;             // 1
  if(_battleAnimating) return true;          // 2
  if(!attackers || !defenders ||
     attackers.length === 0 ||
     defenders.length === 0) return true;    // 3
  // hasPlayer 检查
  const hasPlayer = attackers.some(u => u.fac === G.playerFac)
                 || defenders.some(u => u.fac === G.playerFac);
  if(!hasPlayer) return true;                // 4 ← AI vs AI 命中这里
  // 迷雾检查
  if(pFog){
    const anyVisible = [...].some(u => pFog[hkey(...)] === FOG_VISIBLE);
    if(!anyVisible) return true;             // 5
  }
  if(!document.getElementById('mapRoot')) return true; // 6
  return false;
}
```

Debug override `()=>false` 直接绕过全部6条。

### 总行数

| 文件 | 行数 |
|------|------|
| v175 | 37973 |
| v176-A1 | 39007 (+1034) |
| v176-A2 | 39043 (+36) |
| v176-A3 | 39254 (+211) |
| v176-A4 | **39286 (+32)** |

---

## v176-A5 修复后行号变化

实测反馈两点修复(详见 HANDOVER_v176.md "v176-A5 第四轮反馈修复"段)。
HTML 总行数:39286 → **39347** (+61)。

### 模块字段变化

| 字段 | 变化 |
|---|---|
| `_debug.version` | `v176-A4` → `v176-A5` |

### 新增函数

| 函数 | 说明 |
|---|---|
| `_dbgRevealAround(q, r, radius=2)` | BFS揭雾:从(q,r)出发radius步内所有hex设FOG_VISIBLE。供5种战斗调用,让动画在阳光下播 |
| `_dbgOverrideShouldSkip()` | 返回原 `_baCore.shouldSkip` 并替换为()=>false;返回值供restore用 |
| `_dbgRestoreShouldSkip(orig)` | 恢复 `_baCore.shouldSkip = orig` |

### 替换的函数

| 函数 | 改动 |
|---|---|
| `_dbgRunForceBattle` 中 field/naval 分支 | 重写:临时改 `G.playerFac = def.fac` 绕过retreat过滤+hasPlayer内联检查;手动await `_playBattleCollisionAnim`/`_playNavalBattleAnim`;finally恢复 playerFac |
| `_dbgRunForceBattle` 中 ambush/camp/siege 分支 | 加 `_dbgRevealAround(...)` 调用 |
| `_dbgPlayPending` | 简化,用新抽出的 `_dbgOverrideShouldSkip/_dbgRestoreShouldSkip` |

### 调用游戏函数清单更新

| 函数/常量 | v175行号 | A5 用途 |
|---|---|---|
| `_playBattleCollisionAnim(atks, defs, report, posSnap)` | 25758 | **新引用**:野战手动await |
| `FOG_VISIBLE` (常量=2) | 1749 | **新引用**:揭雾 |
| `hexNeighbors(col, row)` | 1705 | **新引用**:BFS揭雾邻居 |
| `G.fog[fid]` (Map) | 1907 | **新引用**:玩家迷雾map |
| `G.playerFac` | (G字段) | **新引用**:临时改写以绕过retreat/hasPlayer |

### 关键技术点 — "G.playerFac 临时改写"

`_resolveBattleEngagement` 的 retreat 过滤(行29937)和 `_playBattleCollisionAnim` 的 hasPlayer 内联检查(行25767)都依赖 `G.playerFac`。Debug场景下临时把 `G.playerFac = def.fac`:

| 检查 | 改前(playerFac=玩家) | 改后(playerFac=def.fac) |
|---|---|---|
| `defenders.every(u=>u.fac!==playerFac)` (retreat过滤) | true(全AI守方) → 触发retreat | false(def方就是playerFac)→ 不退跑 |
| `defenders.some(u=>u.fac===playerFac)` (hasPlayer) | false → skip动画 | true → 播动画 |

副作用范围:动画播放期间(2-3秒)G.playerFac 临时为 def.fac,可能影响:
- renderAll 的高亮逻辑
- pFog 切换到 def.fac 的fog
- selUnitId 清空逻辑

无功能性数据污染。`finally` 块保证恢复。

### `_baCore.shouldSkip` vs 内联hasPlayer检查 — 哪些动画函数可被A4 override救?

| 动画函数 | 检查方式 | A4 override shouldSkip有效? |
|---|---|---|
| `_playBattleCollisionAnim` (野战) | 内联(行25761-25768) | **❌** 必须靠A5 改playerFac |
| `_playNavalBattleAnim` (水战) | `_baCore.shouldSkip` (行27151) | ✅ |
| `_playAmbushBattleAnim` (伏击) | `_baCore.shouldSkip` | ✅ |
| `_playCampBattleAnim` (营寨) | `_baCore.shouldSkip` | ✅ |
| `_playSiegeBattleAnim` (攻城) | `_baCore.shouldSkip` | ✅ |

A5 改playerFac 对 4个走 `_baCore.shouldSkip` 的也起作用(让hasPlayer通过),但因为它们已被A4 override覆盖了 shouldSkip,**所以ambush/camp/siege/naval本来A4就够**。A5 改playerFac 主要为了:
1. 解决野战动画(它有内联检查)
2. 解决 retreat 过滤(在 `_resolveBattleEngagement` 内,不是动画层)

### 总行数

| 文件 | 行数 |
|------|------|
| v175 | 37973 |
| v176-A1 | 39007 (+1034) |
| v176-A2 | 39043 (+36) |
| v176-A3 | 39254 (+211) |
| v176-A4 | 39286 (+32) |
| v176-A5 | **39347 (+61)** |

---

## v177 文案 Clean-up（无代码结构变化）

> v177 仅修改文案（剧本名/版本号/新手指导/Tab 帮助），**未新增/修改/删除任何函数或全局变量**。

### 总行数

| 文件 | 行数 |
|------|------|
| v176-A5 | 39347 |
| v177 | **39368 (+21)** |

### v177 修改位置（全部为字符串字面量）

| 行号（v177） | 类型 | 改动 |
|------|------|------|
| 34202 | 字符串 | 标题菜单底部版本号 `v167` → `v177` |
| 34284 | 字符串 | 剧本卡标题 `群雄割據` → `三國鼎立` |
| 34292 | 字符串 | 剧本卡元数据 `107位武将` → `109位武将` |
| 34344-34345 | TUT_PAGES Page 2 | "豪族势力" detail 末尾追加豪强县 qualitative 说明 |
| 34429-34439 | TAB_HELP.mil | 新增 `{label:'战斗演出'}` section（5 战斗动画+叫阵前奏） |
| 34581 | TAB_HELP.faction | "操作指引" section 内追加派系标签顶部内政概览提示 |
| 34583-34589 | TAB_HELP.faction | 新增 `{label:'势力阶段'}` section（军阀/一方之主/政权三阶段） |
| 34769 | TAB_HELP.city | "豪族势力" section 重写扩展（属县三类+豪强县+太守分级+tooltip 指引） |
| 34786 | TUT_PAGES Page 3 | "派系与朝议" detail 中段追加势力三阶段一句话 |
| 34802 | TUT_PAGES Page 4 | 新增 `{label:'部曲与老兵'}` detail（4-5行简介） |
| 34836 | TUT_PAGES Page 7 | "官职" detail 追加四档解锁+称帝 qualitative 说明 |
| 34841-34846 | TUT_PAGES Page 8 | body 追加"徭役"政策行 |

### 行号偏移规则（v176-A5 → v177）

所有改动集中在 34202-34846 区间。受影响范围：

| 区间（v176-A5） | 偏移到 v177 |
|---|---|
| 1 - 34201 | 0（不偏移） |
| 34202 - 34846（TUT_PAGES + TAB_HELP） | 内部插入，行号在区间内位移 |
| 34847 起 | +21 |

如需在 v177 上定位某个 v176-A5 行号 ≥34847 的代码：直接 +21。

### 数据结构变化

| 数据结构 | v176-A5 | v177 | 变化 |
|---|---|---|---|
| `TUT_PAGES.length` | 10 | 10 | 不变 |
| `TUT_PAGES[2].details.length` (城池) | 5 | 5 | 不变（"豪族势力"内部扩写） |
| `TUT_PAGES[3].details.length` (武将) | 4 | 4 | 不变（"派系与朝议"内部扩写） |
| `TUT_PAGES[4].details.length` (军事) | 5 | 6 | +1（新增"部曲与老兵"） |
| `TUT_PAGES[7].details.length` (官职科技) | 2 | 2 | 不变（"官职"内部扩写） |
| `Object.keys(TAB_HELP).length` | 12 | 12 | 不变 |
| `TAB_HELP.city.sections.length` | 7 | 7 | 不变（"豪族势力"内部重写） |
| `TAB_HELP.mil.sections.length` | 12 | 13 | +1（新增"战斗演出"） |
| `TAB_HELP.faction.sections.length` | 4 | 5 | +1（新增"势力阶段"） |
| **TAB_HELP 总 sections** | **61** | **63** | **+2** |

### 验证

| 验证项 | 结果 |
|---|---|
| `node --check` 两个 `<script>` 块 | ✅ |
| TUT_PAGES 数 10 | ✅ |
| TAB_HELP keys 数 12 | ✅ |
| TAB_HELP sections 总数 63（+2） | ✅ |
| 旧字符串"群雄割據"残留 | 0 ✅ |
| 旧字符串"v167 · 三国"残留 | 0 ✅ |
| 旧字符串"107位武将"残留 | 0 ✅ |
| 新手指导无 quantitative 表达（×N、≥N等） | ✅ |

---

## v178 Audit 修复（5 bugs）

> 本轮全部为局部修复，**未新增/删除函数**，仅修改 5 处现有逻辑 + 补 8 个数据 entry。

### 修改清单

| # | 位置（v178 行号） | 函数 | 改动类型 |
|---|---|---|---|
| #19 | 4044-4048 | `GEN_CLASS` 字面量末尾 | 补 8 个 entry（典韦/高顺/陈宫/太史慈/孙策/陆抗/沮授/田丰） |
| #9 | 5384 | `_genInfluence` | 条件 `def.gentryStates` → `def.gentryStates && def.gentryStates.length > 0` |
| #30 | 5602, 5610 | `_clanHasMemberInFac`/`_clanHasOfficeInFac` | 加 `Array.isArray` 兼容数组 |
| #3 | 21769-21789 | `createUnit` | 双扫：先扫单标签 commander 再处理多标签 |
| #33 | 5839-5862 | `_applyCourtDecisions` | 按 county 去重直接 shock，不再走 applyFamilyLoyaltyShock |

### 总行数

| 文件 | 行数 |
|------|------|
| v177 | 39368 |
| v178 | **39388 (+20)** |

### 数据结构变化

| 数据结构 | v177 | v178 | 变化 |
|---|---|---|---|
| `Object.keys(GEN_CLASS).length` | 125 | **133** | +8（与 GEN_TAGS 对齐） |
| `TUT_PAGES.length` | 10 | 10 | 不变 |
| `TAB_HELP keys 数` | 12 | 12 | 不变 |
| `TAB_HELP sections 总数` | 63 | 63 | 不变 |

### 函数签名变化

无。所有修改的函数签名保持不变。

### 行号偏移规则（v177 → v178）

改动分散，影响范围如下：

| 区间（v177） | 偏移到 v178 |
|---|---|
| 1 - 4039 | 0 |
| 4040 - 4044（GEN_CLASS 末尾） | 内部插入，区间扩张 +8 行 |
| 4045 - 5384 | +8 |
| 5385（_genInfluence 修改） | +8（修改不增行） |
| 5386 - 5601 | +8 |
| 5602 - 5613（_clanHas* 重写） | +8（行内扩展，不增整体） |
| 5614 - 5838 | +8 |
| 5839 - 5862（_applyCourtDecisions 重写） | +8（行内重写，不增整体） |
| 5863 - 21770 | +8 |
| 21770 - 21789（createUnit 双扫） | +8 起，区间扩张 +12 行 |
| 21790 起 | +20 |

如需在 v178 上定位某个 v177 行号 ≥21790 的代码：直接 +20。

### 验证

| 验证项 | 结果 |
|---|---|
| `node --check` 两个 `<script>` 块 | ✅ |
| 静态回归 (regress_v178.js) | 15/15 ✅ |
| 行为回归 (behavior_v178.js) | 13/13 ✅ |
| 旧字符串 "v177 · 三国" 残留 | 0 ✅ |

---

## v179 第三轮 Audit 修复（3 bugs）

> 本轮全部为局部修复，**未新增/删除函数**，仅修改 5 个现有函数。

### 修改清单

| # | 位置（v179 行号） | 函数 | 改动类型 |
|---|---|---|---|
| #57 | 23615-23616, 23627-23628 | `resolveAmbushBattle` | 4 行 reduce 改写：`+xxxLost` 移出 reduce |
| #57 | 24380-24381, 24394-24395 | `resolveBattle` | 4 行 reduce 改写 |
| #58 | 7995, 22921 | `poachGen` 内部 + `killGen` | 2 行新增 selUnitId 防空指针 |
| #60 | 15591-15622 | `_isFacHomeRegion` | 函数体改写：从字面量比较改为 STATE_TO_GENTRY_FAC 反查 |

### 总行数

| 文件 | 行数 |
|------|------|
| v178 | 39388 |
| v179 | **39407 (+19)** |

### 函数签名变化

无。所有函数签名保持不变。

### 数据结构变化

无。无新增数据结构。

### 行号偏移规则（v178 → v179）

| 区间（v178） | 偏移到 v179 |
|---|---|
| 1 - 7993 | 0 |
| 7994（poachGen 删除点） | +1（行内插 selUnitId 检查） |
| 7995 - 15600 | +1 |
| 15601（_isFacHomeRegion 旧字面量比较） | 行被替换扩展 |
| 15602 - 15613（函数末尾） | 受 #60 影响位移到 15602-15622 |
| 15614 - 22918 | +14 |
| 22919（killGen 删除点） | +14 加 1 行 selUnitId 检查 |
| 22920 - 23614 | +15 |
| 23615 起（伏击修复块） | 内部修改不变行数 |
| 23624 - 24379 | +15 |
| 24380 起（野战修复块） | 内部修改不变行数 |
| 24389 起 | +15+ ... 实际累计 +19 |

如需在 v179 上定位某个 v178 行号 ≥24389 的代码：直接 +19。

### 验证

| 验证项 | 结果 |
|---|---|
| `node --check` 两个 `<script>` 块 | ✅ |
| 静态回归 (regress_v179.js) | 14/14 ✅ |
| 行为回归 (behavior_v179.js) | 14/14 ✅ |
| 旧 `+xxxLost` 在 reduce 残留 | 0 ✅ |
| 旧 `'zhongyuan'/'hebei'` 字面量比较残留 | 0 ✅ |
| `G.generals[srcFid]` 过滤行未误删 | ✅ |

---

## 二〇〇、v179 冷审修复行号偏移（v179 → v179fix）

> 见 `HANDOVER_v179.md` 「二〇〇、v179 冷审修复」章节。本节列出**行号位移规则**和**新增/重命名定位锚点**。
> 文件：`project_romance_v179.html`，行数 39407 → **39416** (+9)。

### 新增 / 重要锚点（v179fix）

| 锚点 | 行号 | 说明 |
|---|---|---|
| `getFactionRuler(fid)` | 5079-5083 | ★ v179fix P14: 单一读取入口（含 FAC.ruler 旧存档兜底） |
| `setFactionRuler(fid, name)` | 5085-5089 | ★ v179fix P14: 单一写入入口 |
| `G.factionRulers` 初始化 | 6069-6071 | initGame 内，从 FAC.ruler 复制 |
| `_applyPeaceAgreement(fidA, fidB)` | 13978-14015 | ★ v179fix P15c: 4 个停战路径合并入口（status/rel/CD/宣称清/siege清/truce/诸葛瑾） |
| `applyBattleExp` 接受 'battle' | 1030 | ★ v179fix P21 |
| `processTechResearch` cache 失效 | 1550 | ★ v179fix P19 |
| `calcHexPathCost(hexPath, troopType, startOnWater)` | 2789-2803 | ★ v179fix P9: 第 4 参数 |
| `envoy_visit` 斩使副作用 | 9589-9591 | ★ v179fix P37 |
| `acceptPeaceOffer` / `rejectPeaceOffer` | 13961-13975 | ★ v179fix P15c: 调 helper |
| `_buildEnvoyIntel` 粮草字段 | 14926 | ★ v179fix P51: storage 取代 food |
| 援军 `_arrivedThisTurn` | 22038 | ★ v179fix P10 |
| 君主继任写 G | 22987-22988 | ★ v179fix P14 |
| 张辽威风 `_zhangliaoMoraleAdded` | 24333-24345 | ★ v179fix P8 |
| 水战 try/finally | 24601-24613 | ★ v179fix P7 |
| `saveToSlot` 战报检测 | 34205-34211 | ★ v179fix P41 |
| Claude AI `_execDiploArmistice` 调 helper | 37420-37421 | ★ v179fix P15c |

### 行号偏移规则（v179 → v179fix）

| v179 行号区间 | v179fix 偏移 |
|---|---|
| 1 - 1029 | +0 |
| 1030 - 1549 | +0 |
| 1550 - 2788 | +1 |
| 2789 - 4554 | +7（P9 函数注释扩展 +5 行 + 内部 +2） |
| 4555 - 5071 | +7 |
| 5072 - 5075 | +20（P14 helper 新增 ~13 行） |
| 5078 - 6048 | +20 |
| 6049 - 9565 | +23（P14 G.factionRulers 初始化 +3 行） |
| 9566 - 13935 | +26（P37 +3 行） |
| 13936 - 13966 | +9 / +10（P15c 改写 acceptPeaceOffer/rejectPeaceOffer，缩短） |
| 13967 - 14125 | +48（P15c `_applyPeaceAgreement` helper 插入 ~38 行） |
| 14126 - 14513 | +30（P15c 玩家发起停战块缩短） |
| 14514 - 14919 | +6（P15c AI peaceWillingness 路径缩短） |
| 14920 - 22030 | +6 |
| 22031 - 22979 | +7（P10 +1 行） |
| 22980 - 24324 | +7 |
| 24325 - 24416 | +8 → +10（P8 张辽逻辑改写） |
| 24417 - 24590 | +10 |
| 24591 - 31441 | +13（P7 try/finally +3 行） |
| 31442 - 32431 | +13 |
| 32432 - 34190 | +13 |
| 34191 - 37399 | +20（P41 saveToSlot 检测 +7 行） |
| 37400 - 39407 | +9（P15c Claude AI 路径缩短） |

**简化判断**：
- v179 行 < 1550 → 偏移 0
- v179 行 1550-5071 → 偏移 +1 ~ +7
- v179 行 5072-13935 → 偏移 +20 ~ +26
- v179 行 13936-14513 → 偏移大幅波动（P15c 重构区，建议直接搜函数名）
- v179 行 14514-31441 → 偏移 +6 ~ +13
- v179 行 31442+ → 偏移 +9 ~ +20

### 累计修复总量

v178 → v179：+19 行（v179 自身 audit 修复）
v179 → v179fix：+9 行（冷审修复）
**v178 → v179fix：+28 行**

### 验证

| 验证项 | 结果 |
|---|---|
| `node --check` 提取的 `<script>` 块 | ✅ |
| 所有 `★ v179fix Pxx` 标记可 grep | ✅（16 处标记，覆盖 11 个 P 修复） |
| 双方向 diff 干净（仅 v179fix 修改区） | ✅ |

### 下轮 CODE_MAP 维护

下轮做 P16/P18/P29/P49/P50 后需要：
1. 在「新增/重要锚点」追加新增点
2. 更新偏移规则表（这 5 个改动都很小，预计 +5~8 行）
3. 累计修复总量更新

---

## 二〇一、v179 冷审第二轮修复行号偏移（v179fix → v179fix2）

> 见 `HANDOVER_v180.md` 「二〇一、v179 冷审修复（续）— P16/P18/P29/P49/P50」章节。
> 文件：`project_romance_v179.html`，行数 39416 → **39430** (+14)。

### 新增 / 重要锚点（v179fix2）

| 锚点 | 行号 | 说明 |
|---|---|---|
| AI 挖角 `addDiplo` 双向 | 8027 | ★ v179fix P16 |
| `executeMigration` src/dst 接收返回值 | 6633, 6640 | ★ v179fix P29（玩家路径） |
| AI 迁民 src/dst 接收返回值 | 6871, 6872 | ★ v179fix P29（AI 路径） |
| `setPrefect` 入口 `_genInFac` 守卫 | 14077 | ★ v179fix P49 |
| `setStrategist` 入口 `_genInFac` 守卫 | 14605 | ★ v179fix P49 |
| 称臣双向 CD | 14517-14518 | ★ v179fix P18 |
| `backToTitle` modal 集中清理 | 34326-34334 | ★ v179fix P50（替代单行 `_envoyModal`） |

### 行号偏移规则（v179fix → v179fix2）

| v179fix 行号区间 | 偏移 |
|---|---|
| 1 - 6632 | +0 |
| 6633 - 6643 | +2（P29 src/dst 各 +1 行） |
| 6644 - 6870 | +2 |
| 6871 - 6872 | +2（注释 inline，无新行） |
| 6873 - 8026 | +2 |
| 8027 - 8028 | -1（P16 删 2 行 + 加 1 行） |
| 8029 - 14076 | +1 |
| 14077 - 14079 | +3（P49 setPrefect 守卫 +2 行） |
| 14080 - 14516 | +3 |
| 14517 - 14519 | +5（P18 双向 CD +2 行） |
| 14520 - 14604 | +5 |
| 14605 - 14607 | +7（P49 setStrategist 守卫 +2 行） |
| 14608 - 34325 | +7 |
| 34326 - 34334 | +14（P50 modal 清理 +7 行） |
| 34335 - end | +14 |

### 累计修复总量

v179 → v179fix：+9 行（冷审第一轮 12 项）  
v179fix → v179fix2：+14 行（冷审第二轮 5 项）  
**v179 → v179fix2：+23 行**

---

## 二〇二、v179 冷审第三轮修复行号偏移（v179fix2 → v180）

> 见 `HANDOVER_v180.md` 「二〇二、v179 冷审修复（再续）— P30/P31/P39」章节。
> 文件：`project_romance_v179.html` 39430 → **39444** (+14)，最终重命名为 `project_romance_v180.html`。

### 新增 / 重要锚点（v179fix3 / v180）

| 锚点 | 行号 | 说明 |
|---|---|---|
| `CLAN_FAMILIES` 删 dead key（rn_yuan/wj_zhang） | 4203 | ★ v179fix P31（注释行 +1，键删 -1，净 0） |
| 朝议 mil/civ tier2 提案者池 Fisher-Yates | 5779-5780 | ★ v179fix P39 |
| `_tpModTbl` 索引保护（生产加成） | 6459-6460 | ★ v179fix P30 |
| 在野武将池 Fisher-Yates | 7737 | ★ v179fix P39 |
| 武将配对 Fisher-Yates | 9979 | ★ v179fix P39 |
| `_tradeMultTbl` 索引保护（通商收入） | 15090-15091 | ★ v179fix P30 |
| `_shuffleFY` Fisher-Yates helper | 15224-15230 | ★ v179fix P39 — 全局洗牌 helper |

### 行号偏移规则（v179fix2 → v180）

| v179fix2 行号区间 | 偏移 |
|---|---|
| 1 - 4202 | +0 |
| 4203 | +1（P31 注释 +1，但删除两键 0 影响） |
| 4204 - 6458 | +1 |
| 6459 - 6460 | +3（P30 第一处 +2） |
| 6461 - 15089 | +3 |
| 15090 - 15091 | +5（P30 第二处 +2） |
| 15092 - 15223 | +5 |
| 15224 - 15230 | +12（P39 helper 插入 +7） |
| 15231 - end | +12 |

注：P39 的 4 处替换是 inline 单行替换，无行数变化。

### v180 累计修复总量

v179 原始：39407 行  
v179fix（第一轮）：39416 (+9)  
v179fix2（第二轮）：39430 (+14)  
v180（第三轮）：**39444 (+14)**  
**v179 → v180 总计：+37 行**

### v180 验证

| 验证项 | 结果 |
|---|---|
| `node --check` 提取的 `<script>` 块 | ✅ |
| 所有 `★ v179fix Pxx` 标记可 grep | ✅（共 40 处标记，覆盖 19 个唯一 P 修复 + P15c 子项 = 20 项） |
| 非均匀洗牌全 grep 残留 | 0 处（仅 P39 helper 注释自身命中） |
| `wj_zhang/rn_yuan` 残留引用 | 0 处（仅 P31 注释自身命中） |
| 主线机制 major bug | 无 |

### v180 文件指针

| 项目 | 值 |
|---|---|
| 主文件 | **`project_romance_v180.html`** |
| 行数 | 39444 |
| HANDOVER | `HANDOVER_v180.md` |
| CODE_MAP | `CODE_MAP_v180.md`（本文件） |

### v180 结点意义

v180 是 v179 冷审三轮修复的收尾版本，主线无 major bug，可作为后续新功能开发的稳定起点。

下轮做新功能时：
1. 先按规则讨论设计 → 等 approve → 再实装
2. 行号定位优先用函数名 grep（行号已频繁偏移，函数名稳定）
3. CODE_MAP 末尾追加新章节，不重写

---

## 二〇三、v181 官职 tier1 锁死按 stage（v172 老债清理）

> 见 `HANDOVER_v181.md` 「二〇四、v181 官职 tier1 锁死按 stage」章节。
> 文件：`project_romance_v180.html` 39444 → **`project_romance_v181.html`** 39518 (+74 行)。

### 新增常量与函数

| 锚点 | 行号 | 说明 |
|---|---|---|
| `POST_TIERS`（精简） | 4951-4956 | 删 tier1 列，每行 `mil:[t3,t2]` `civ:[t3,t2]` |
| `STAGE_TIER1_SLOTS` 新增 | 4960-4964 | 仅 regime={1,1}，其他 stage={0,0} |
| `STAGE_LABEL_CAP` 新增 | 4968-4972 | warlord:诸侯 / regional:公 / regime:王 |
| `STAGE_LABEL_FLOOR` 新增 | 5052-5056 | warlord:诸侯 / regional:侯 / regime:侯 |
| `getFacPostTier` 改造 | 5058-5071 | 加 cap+floor 钳制 |
| `getPostSlots` 改造 | 5073-5083 | 融合 POST_TIERS 与 STAGE_TIER1_SLOTS |
| `renderTrack` tier1=0 处理 | 18356-18365 | 显示"未解锁"虚线占位 |
| 档位进度条 UI 重写 | 18420-18486 | 「势力规模」+「政权阶段」双行 |
| `_execAppointPost` 改走 helper | 37334-37340 | 不再直读 POST_TIERS |

### 行号偏移规则（v180 → v181）

| v180 行号区间 | 偏移 |
|---|---|
| 1 - 4949 | +0 |
| 4950 - 4956 | -1（POST_TIERS 删 tier1 列，4 行变 4 行但缩短了） |
| 4957 - 4978 | +18（新增 3 个 STAGE 常量，约 19 行） |
| 4979 - 5046 | +18 |
| 5047 - 5077 | +30（getFacPostTier 改造 +12 行） |
| 5078 - 18348 | +30 |
| 18349 - 18365 | +37（renderTrack tier1=0 处理 +7 行） |
| 18366 - 18415 | +37 |
| 18416 - 18486 | +69（进度条 UI 重写 +32 行） |
| 18487 - 37328 | +69 |
| 37329 - 37340 | +71（_execAppointPost +2 行） |
| 37341 - end | +74 |

注：以上偏移为大致估算，精确定位用函数名/常量名 grep。

### v181 文件指针

| 项目 | 值 |
|---|---|
| 主文件 | **`project_romance_v181.html`** |
| 行数 | 39518 |
| HANDOVER | `HANDOVER_v181.md` |
| CODE_MAP | `CODE_MAP_v181.md`（本文件） |

### 关键设计常量参考（开发者速查）

```js
// 直接由 stage 决定（不依赖城市数）
STAGE_TIER1_SLOTS = {
  warlord:  {mil:0, civ:0},   // 锁
  regional: {mil:0, civ:0},   // 锁
  regime:   {mil:1, civ:1},   // 解锁
};

// stage 卡 label 上下限（钳制 POST_TIERS 索引）
STAGE_LABEL_CAP   = { warlord:'诸侯', regional:'公',  regime:'王' };
STAGE_LABEL_FLOOR = { warlord:'诸侯', regional:'侯',  regime:'侯' };
```

---

## 二〇四、v181 附庸纳贡比例差异化（#5 续做）

> 见 `HANDOVER_v181.md` 「二〇五、v181 附庸纳贡比例差异化」章节。
> 文件：39518 → **39545** (+27 行)，仍命名为 `project_romance_v181.html`。

### 新增 / 重要锚点

| 锚点 | 行号 | 说明 |
|---|---|---|
| `TRIBUTE_RATES` 常量 | 5078-5082 | warlord/regional/regime 各自 {gold, food} 比例 |
| `getTributeRates(suzerainFid)` helper | 5084-5087 | 看宗主 stage 返回比例 |
| 纳贡逻辑改造 | 7170-7187 | 走 helper；移除 `if(tributeGold>0)` 让 0 纳贡也加好感 |
| 称臣弹窗文案动态化 | 16689-16693 | 计算 `_trText`，3 stage 文案不同 |
| 地图 tooltip 动态化 | 20035-20038 | 计算 `_trMyText` 注入到军力行 |

### 行号偏移规则（v181 #4 → v181 #5）

| 行号区间 | 偏移 |
|---|---|
| 1 - 5077 | +0 |
| 5078 - 5087 | +10（TRIBUTE_RATES + helper） |
| 5088 - 7169 | +10 |
| 7170 - 7187 | +12（纳贡逻辑 +2 行） |
| 7188 - 16688 | +12 |
| 16689 - 16693 | +16（弹窗文案 +4 行） |
| 16694 - 20034 | +16 |
| 20035 - 20038 | +20（tooltip +4 行） |
| 20039 - end | +27 |

### v181 最终状态

| 项目 | 值 |
|---|---|
| 主文件 | `project_romance_v181.html` |
| 行数 | **39545** |
| HANDOVER | `HANDOVER_v181.md` |
| CODE_MAP | `CODE_MAP_v181.md` |

### v172 老债清理总进度

| 老债项 | 状态 |
|---|---|
| #4 官职 tier1 锁死按 stage | ✅ v181 |
| #5 附庸纳贡比例差异化 | ✅ v181 |
| #6 朝议周期按 stage 差异化 | 待朝议主体先稳定 |
| #7 演进降级 | 待讨论 |

---

## 二〇五、v181 BUG A/B 修复（UI 进度条边界）

> 见 `HANDOVER_v181.md` 「二〇六、v181 测试与 BUG A/B 修复」章节。
> 文件：39545 → **39549** (+4 行)。

### 修复锚点

| 锚点 | 行号 | 说明 |
|---|---|---|
| `stageCapped` / `stageFloored` 拆分 | 18466-18468 | 替代原 `stageBlocked` 单一变量 |
| `nextBlockedByStage` 提前到外层 | 18475-18476 | 用于条件判定下一档是否显示 |
| 进度条条件 | 18488 | `if(nextTier && !stageCapped && !nextBlockedByStage)` |
| 移除内层 `nextBlockedByStage` 计算 | - | 内层删去原 18488-18491 重复计算 |

### v181 文件指针（最终）

| 项目 | 值 |
|---|---|
| 主文件 | `project_romance_v181.html` |
| 行数 | **39549** |

### 累计偏移（v180 → v181 最终）

v180 (39444) → v181 (39549)：**+105 行**
- #4 官职 tier1 锁死按 stage：+74 行
- #5 附庸纳贡比例差异化：+27 行
- BUG A/B 修复：+4 行

### v181 端到端测试覆盖

`test_v181.js` 覆盖 7 组共 44 项 case，全部通过。下次冷审时若新增 stage/官职机制，建议先复用此测试文件回归。

---

## 二〇五、v181 BUG A/B 修复（UI 误导）

> 见 `HANDOVER_v181.md` 「二〇六、v181 #4 内部测试 + BUG A/B 修复」章节。
> 文件：39545 → **39547** (+2 行)。

### 锚点

| 锚点 | 行号 | 说明 |
|---|---|---|
| stageCapped 定义 | 18466-18470 | 替代 stageBlocked，区分 cap vs floor |
| 限制提示渲染条件 | 18485 | `stageCapped ?` |
| nextBlockedByStage 判断 | 18476-18478 | 下一档是否被 stage cap |
| 进度条渲染条件 | 18489 | `nextTier && !stageCapped && !nextBlockedByStage` |

### 行号偏移规则（v181 #5 → v181 BUG fix）

| 行号区间 | 偏移 |
|---|---|
| 1 - 18465 | +0 |
| 18466 - 18491 | +1（注释和重组） |
| 18492 - end | +2 |

### v181 最终行号速查

| 函数/常量 | 行号 |
|---|---|
| `POST_TIERS` | 4951 |
| `STAGE_TIER1_SLOTS` | 4960 |
| `STAGE_LABEL_CAP` | 4968 |
| `STAGE_LABEL_FLOOR` | 5054 |
| `getFacPostTier` | 5060 |
| `getPostSlots` | 5077 |
| `TRIBUTE_RATES` | 5078 |
| `getTributeRates` | 5084 |
| 纳贡逻辑（processFacEconomy） | 7170 |
| 称臣弹窗文案 | 16689 |
| 任命面板进度条 | 18466 |
| 地图 tooltip 纳贡 | 20035 |
| `_execAppointPost` slots 检查 | ~37334 |

### v181 总文件状态

| 项目 | 值 |
|---|---|
| 主文件 | `project_romance_v181.html` |
| 行数 | **39547** |
| HANDOVER | `HANDOVER_v181.md` |
| CODE_MAP | `CODE_MAP_v181.md` |

### v181 累计

v180 → v181：+103 行
- #4 官职 tier1 锁死按 stage：+74 行
- #5 附庸纳贡比例差异化：+27 行
- BUG A/B 修复：+2 行

