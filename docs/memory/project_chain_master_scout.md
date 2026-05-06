---
name: 8 链总体 scout — chain-by-chain 分布 + 跨链矩阵 + 推荐顺序
description: phase 3 chain 阶段(3.5-3.12)启动前的总图,等制作人拍 8 链顺序
type: project
originSessionId: 4a001125-872f-4fde-93a1-77ee5e90644e
---

**扫描时间**:2026-05-05(在 commit `fba8fc2`(Phase 3.4 完成)上做的 read-only scout)
**目的**:为 chain 阶段(3.5-3.12)定先后顺序,**未动手**

## 1. 8 链 mutator 函数分布(按 v181 现行行号)

### 价值观 (ethos)
| 行号 | 函数 | 性质 |
|---|---|---|
| L12382 | `_applyEthosDrift` | mutator hub(3.2 scout flag) |
| L12394 | `applyEthosShock` | mutator hub |
| L12403 | `_ethosDistance` | pure helper |
| L12410 | `processFacEthos` | turn processor |
| L15422 | `renderEthosTab` | render(留 v181) |
| **小计** | **4 mutator + 1 render** | **最小最集中** |

### 豪族 (gentry)
| 行号 | 函数 | 性质 |
|---|---|---|
| L4129-L4201 | getGentryLevel / _getCountyGentryLevel / getGentryGoldMult / getGentryRecruitMult / getGentryMoraleMod / getGentryDefMult / _getCorruptGentryMod | 7 read helpers |
| L4211 | calcCityCorruption | 经济 边界(读 gentry 写 corruption,主写口在经济) |
| L11971 | initCityGentry | init |
| L12015-L12100 | _isFacHomeRegion / _clanHasMemberInFac / _clanHasOfficeInFac / _aggregateGentry / applyGentryOnCapture / applyFamilyLoyaltyShock | 6 helpers + mutators |
| L12120 | processGentry | turn processor |
| L12319 | _triggerGentryBetray | event-like mutator |
| **小计** | **~14 函数** | 中等,集中 |

### 事件 (event)
| 行号 | 函数 | 性质 |
|---|---|---|
| L7336-L7423 | checkRebellions / _triggerMinorRebellion / _triggerMajorRebellion | 3 反叛 mutator |
| L7483 | processEventCooldowns | turn processor |
| L7497 | processPlagueSpreads | turn processor(疫病) |
| L7540 | rollEventsV2 | **核心扫描器**,写极多 G state |
| L7619 | _popEventQueue | queue handler |
| L7630 | resolveEventChoice | choice handler(玩家 / AI 选择) |
| (已抽) | checkEventPromises → src/core/hubs.js | 真跨链 hub |
| **小计** | **~7 函数** | effect 跨链最广(events 写所有 G),但事件**数据**已抽 src/data/events.js |

### 政治 (politics)
| 行号 | 函数 | 性质 |
|---|---|---|
| L1381-L1516 | _ensureTechCache / getTechEffect / hasTechEffect / canAffordTech / processTechResearch / startTechResearch / aiDoTechResearch | 7 科技 |
| L4247-L4399 | getStage / getAnchorState / countCitiesInState / getQualifiedStates / countFacCities / _updateStateAnchorClock / _selectBestAnchor / checkStagePromotion / promoteStage / processStageEvolution / getStageBadgeText / getStageColor / getStageNarrative | 13 stage 演进 |
| L4571-L4778 | getFacPostTier / getTributeRates / getPostSlots / getFacPosts / countPostsByTier / getGenPostDef / getGenBirthplace / getFactionRuler / setFactionRuler / genHasOffice / appointGenPost / dismissGenPost / clearAllPostsByGen / checkPostDowngrade / calcPostBuffs / calcPostSalary / hasAnyPost / addMerit / seniority | 19 官职 + merit(**与武将链交织**) |
| L5007 | calcFactionInfluence | 派系影响力 |
| L5325-L5602 | _generateCourtProposals / getCourtDecreeBuffs / _applyCourtDecisions / _expireCourtDecrees / _aiCourtSelect / showCourtCouncil / _checkPendingCourtAfterPopup / triggerCourtCouncil | 8 朝议(含 modal,phase 2 原则) |
| L11881-L11933 | canEnthrone / doEnthrone / aiConsiderEnthrone | 3 称帝(写 ethos + politics) |
| L13781-L14131 | renderTechTab / openTechResearchPicker / confirmTechResearch / renderPostTab | 4 render(留 v181) |
| **小计** | **~50 mutator + 4 render** | 最大 chain 之一 |

### 武将 (general)
| 行号 | 函数 | 性质 |
|---|---|---|
| L879-L904 | getRetainers / getRetainerType / setRetainers / getRetainersDisplay | 4 部曲 |
| L1086 / L1118 | addStatExp / addAptExp | 2 exp mutator |
| L3462-L3489 | _deepCloneGen / _rebuildGEN_MAP / loyaltyDisplay | 3 helpers |
| L4025-L4069 | _countyClanList / isMagnateCounty / getGenHomeCounty / getGenHomeCity / isGenHomeInFac / getGenLocalBonus | 6 籍贯 |
| L4798 / L4812 | isHomeTerrain / _isClanRoyalty | 2 helpers |
| L4829-L5232 | getGenFactions / getGenFaction / _genInfluence / factionModToLoyaltyDelta / processFactionLoyalty / getAvgFactionMod / getFactionMoraleMod / **triggerFactionEvent**(3.2 scout flag,武将链 hub)/ getGenFactionModBreakdown | 9 派系 |
| L5627 | addGenChronicle | chronicle |
| L6947-L7218 | getAllRecruitedNames / refreshWildPool / calcRegionRecruitBonus / calcClanRecruitBonus / calcGentryRecruitBonus / _doRecruitWild / recruitWild / aiDoRecruitTalent / _aiDoPoach | 9 招募 |
| L7266-L7301 | checkIntimacyThresholds / _showIntimacyAlert | 2 亲密度 |
| L9972-L10331 | calcLoyaltyDelta / processLoyalty / applyLoyaltyEvent / checkLoyaltyThresholds / poachGen | 5 忠诚度(**poachGen 跨外交**) |
| L10511-L10518 | clearPrefectByGen / setPrefect | 2 太守(经济 边界) |
| L11036-L11047 | getStrategistInt / setStrategist | 2 军师 |
| L16671-L16679 | comBonus / warMoraleBonus | 2 战力公式 |
| L16765-L16898 | _intimacyKey / getIntimacy / setIntimacy / addIntimacy / getCompatGrowthMult / getRelationLabel / applyDuelIntimacy / applyBattleIntimacy | 8 亲密度 |
| L16901-L17204 | checkWounded / isGenWounded / getEffectiveStat / calcCaptureRate / calcSurrenderRate / killGen / succeedRuler / surrenderGen / releaseGen / aiDisposePrisoner / collectPrisoners / resolvePrisoners | 12 伤亡 + 俘虏(**军事边界**) |
| **小计** | **~70 函数** | **最大 chain**(原 audit 30 D 类) |

### 经济 (economy)
| 行号 | 函数 | 性质 |
|---|---|---|
| L1238-L1244 | canBilletToCity / getBilletCities | 2 部曲(经济+武将) |
| L4140-L4201 | getGentryGoldMult / getGentryRecruitMult / getGentryMoraleMod / getGentryDefMult / _getCorruptGentryMod / calcCityCorruption | 6(读豪族 写经济) |
| L5644-L5760 | getCityProd / getCityFoodCost / getCityFoodNet / getCityFoodTurns / getCityFoodColor | 5 城市经济 read |
| L5773-L6012 | canMigrate / getMigrateTargets / executeMigration / showMigrateDialog / _aiConsiderMigration | 5 迁民 |
| L6117-L6240 | processCityFood / garrisonCap / processGarrisonRecovery / _getDeployedGensForMorale / processMorale / getCityCap / processPop | 7 turn processor |
| L6287-L6417 | processFacEconomy / getPrefectBuildBuff / processBuildQueues | 3 turn processor |
| L6460-L6815 | aiDoBuild / aiDoTransfer / aiDoAppointments / processTransfers / checkResupply / findBestDonor / cityDist / doTransfer | 8 调粮 / 建筑 / AI |
| L6842-L6934 | renderAlertStack / confirmCard / dismissCard / renderFoodAlerts / _doFATransfer / confirmFALong / confirmFAOnce / dismissFA | 8 粮食警报 UI |
| L11268-L11574 | _getTradeOffers / _findTradeCity / diploTrade / _canBuildTradePost / getTradeAgreements / hasTradeAgreement / calcTradeAgrIncome / _cleanTradeAgreements / diploTradeAgreement / cancelTradeAgreement / aiDoTradeAgreement | 11 通商(**与外交交织**) |
| L12882-L12953 | buildBld / setTax / setPolicy / toggleResupply / setCorvee / cancelSupplyLine | 6 玩家操作入口 |
| L15846-L15867 | calcSlotMatCost / mergeMatCosts / canAffordMat / deductMat | 4 物资 |
| **小计** | **~65 函数** | 大,有 trade subgroup 与外交边界 |

### 军事 (military)
| 行号 | 函数 | 性质 |
|---|---|---|
| L907-L1164 | getEffectiveSquadLevel / getInitLevel / getLvMult / addUnitExp / applyBattleExp / getBarracksDiscount | 6 unit level + exp |
| L1410-L1420 | getSquadMax / getUnitMax / getAvailableTechs | 3 |
| L1589-L2623 | hex* / fog* / 寻路 / 地形 | **34 函数**(hex / fog / pathfinding / terrain) |
| L3576-L3633 | squad class / 兵种 | 6 |
| L7674-L9902 | aiGetAvailableGens / _aiFrontlineCitiesAgainst / _aiCalcThreat / _aiDeployAnomaly / _aiGetThreatMatrix / _aiInvalidateThreatCache / _aiScoreTarget / _aiEstimateSiegeWinRate / _aiFuzzySiegeWinRate / _aiShouldReview / _aiChooseDefensePosture / _aiFindAmbushHex / aiDefendResponse / _aiIsVisibleToFac / aiSelectTargets / aiExecuteOrders / _aiTrySiege / aiDefenderDecision / aiDoSiege / aiDoDisband / aiDoExpand / aiDoAddSquad / aiDoRecruit / _aiCalcBudget | 24 AI 决策 |
| L15589-L15913 | getCampCost / getMixedComboMult / getMixedComboLabel / applySkills / calcUnitAP / getMainTroopType / newUnitId / getUnitTroops / createUnit | 9 unit 基础 |
| L15913-L16612 | processUnitMovement / getSiegeDefMult / _getSiegeDefMultWithDecay / processSiegeDecay / getUnitFoodRate / getUnitSalaryRate / buildSupplyMap / isUnitSupplied / processSupplyStatus / processUnitFood / processUnitSalary / processMobilizing / getMusterRate / isUnitMustering / isAiMusterReady / processMuster | 16 turn processor(含 supply / mobilize) |
| L17280-L18851 | getTypeMatchMult / getTerrainMult / getMixedBonusMult / getEnemyComposition / _squadBase / squadATK / squadDEF / squadCP / calcUnitATK / calcUnitDEF / calcCombatPower / getMaxInt / getMainCom / canFireAttack / calcFireRate / applyFireEffect / clearFireDebuff / aiDecideFireAttack / resolveAmbush / calcRaidChance / resolveCampBattle / checkUnitSynergy / getSynergyLine / resolveBattle / resolveNavalBattle / estimateWinRate / fuzzyEstimateWinRate / calcRetreatResult / canRetreat / calcPursuitLoss / doRetreat / hasGenInUnits / hasFacGen | 33 战斗解算 |
| L19045-L21275 | _drainPendingBattleAnimations + 7 个 _play*Anim* + _baGetUnitRenderPos / _baDrawCampPalisade / _getDuelEpithet | 11 战斗动画(render 边界) |
| L21562-L24222 | autoResolvePendingBattle / _checkSiegeArrival / _siegeArrivalChoice / calcBreakoutChance / resolveSiegeBattle / collectBattleSides / aiInitiateBattle / checkAmbushTriggers / aiDecideDuelChallenger / getDuelCandidates / resolveDuel / applyDuelMorale / tryPassiveDuel / getStrengthLabel / _battleSideHtml / _showAmbushConfirm / confirmAmbush / confirmAmbushAbort / _doRetreat2Hex / _showCampBattleConfirm / confirmCampBattle / _showSiegeBattleConfirm / _showSiegeDefendConfirm / confirmSiegeDefend / confirmSiegeBattle / _showNextBattleConfirm / selectDuelChallenger / confirmBattle / _resolveBattleEngagement / processReinforcement | 30 战斗调度 + UI(modal) |
| L24356-L24883 | showNextBattleReport / closeBattleModal / showNextPrisonerModal / playerDisposePrisoner | 4 战报弹窗 |
| L24934-L25282 | openRecruitModal / closeRecruitModal / getDeployedGens / renderRecruitModal / rmEditSlot / rmToggleSub / rmPickGen / rmPickType / _rmSetClass / _getBilletRetainerTroops / _getBilletRetainerType / rmSetTroops / rmAdjTroops / confirmRecruit | 14 征兵 modal |
| L25403-L26013 | closeUnitMenu / issueUnitMove / _execInstantMarch / _collectPlayerVisibleKeys / _animateFogReveal / _checkInstantBattleTrigger / clearMovePreview / closeStackPicker / showStackPicker / onStackPickerSelect / onUnitLeftClick / onUnitRightClick / onMapRightClick | 13 单位交互 |
| L26029-L26409 | svgEventCoords / handleMapClick / handleCityClick / getUnitDisplayPos / renderUnitsOnMap / renderUnitDetail | 6 地图交互 + render |
| L26705-L27669 | launchSiegeAttack / cancelSiege / startMoveFromPanel / cancelUnitMove / billetUnit / _confirmBillet / sortieFromCity / setCamp / setAmbush / cancelSpecialStatus / openRedeployModal / _rdpGetReadyPool / _rdpSlotInfo / _renderRedeployModal / _rdpEditSlot / _rdpToggleSub / _rdpPickAux / _rdpPickGen / _confirmRedeploy / disbandUnit / getUnitAtCity / openExpandModal / closeExpandModal / renderExpandModal / exAdj / exSet / confirmExpand / _getIdleGens / openAddSquadModal / closeAddSquadModal / renderAddSquadModal / asPickGen / asPickType / asAdjTroops / asSetTroops / confirmAddSquad | 36 部队管理 modal |
| L27748 | renderMilTab | render |
| **小计** | **~200 函数(粗算,含动画/modal/UI)** | **绝对最大 chain**;严格按 (a) 写口审查后,**纯 mechanism mutator ~70-80 个**;其余动画/modal/UI 是 phase 2 原则候选留 v181 |

### 外交 (diplomacy)
| 行号 | 函数 | 性质 |
|---|---|---|
| L10406-L10823 | showDiploSueForPeace / _clearSiegeOnPeace / acceptPeaceOffer / rejectPeaceOffer / _applyPeaceAgreement / _diploActed / _diploMarkActed / diploGift / diploArmistice / diploAlly / startClaimPrepUI / playerEnthrone / diploBreakAlliance / diploWar / powerIndex / fogPowerEstimate / alliedFacs / isSuzerain / isVassal / getSuzerain / effectivePowerAgainst / peaceWillingness / _syncAllyWarStatus | 23 外交动作 + 实力计算 |
| L10857-L11002 | aiDoDiplo / aiDoTradeAgreement | 2 AI |
| L11084-L11445 | _strategyRate / stratDriveWolf / stratTwoTigers / stratSpy / stratRumor / stratScout / _applyScoutReveal / _buildEnvoyIntel / stratEnvoy | 9 计谋 |
| L11589-L11952 | tickStrategyCDs / getDiploStatus / isHostile / addDiplo / _shuffleFY / applyReputationPenalty / _repPenaltyFactor / _repGiftMult / _areFacsAdjacent / _hasLostCityTo / getAvailableClaims / startClaimPrep / processClaimPrep / getReadyClaim / applyWarDeclarationEffects / _applyClaimFactionEffects / trackCityLoss / checkEmperorCapture / checkBloodFeud / processFeudDecay / processReputation | 21 宣称 + 信誉 + 血仇 |
| L12553-L12882 | applyCommonEnemyDiploBonus / checkDiplo / showDiploVassal / _resolveVassalDiploConflicts / _setVassalStatus / acceptVassalOffer / rejectVassalOffer / playerReleaseVassal / requestVassalIndependence / diploDemandVassal / diploSubmitVassal | 11 附庸 |
| L15030 / L15291 | renderDipTab / renderSchemeTab | 2 render |
| **小计** | **~66 函数** | 大,subgroup:外交动作 / 计谋 / 宣称 / 附庸(原 audit 31 D 类) |

## 2. 跨链引用矩阵

按 (a) "写口" 审查 — 谁写谁的 G state(行=被写的 chain,列=主动写的 chain;数字 = 跨写函数数;**self** 自写不计):

|  | 经济 | 军事 | 武将 | 政治 | 外交 | 事件 | 价值观 | 豪族 |
|---|---|---|---|---|---|---|---|---|
| **经济**(被写) | self | aftermath / supply 影响 storage | recruit 扣 res | tech research 扣 res | gift / strat 扣 res / claim 扣 res | event effects 写 res / morale / pop / plague 写 morale+pop | 屠城写 morale | gentry events 影响 morale |
| **军事**(被写) | supply 限制 | self | killGen 写 squad / 武将 morale → squadMorale | post buff 影响 unit | 停战 / 同盟解 unit 部署 | rebellion 创 rebel units / plague 写 unit.troops | — | gentry 写 garrison |
| **武将**(被写) | — | 战斗 killGen / surrenderGen / addUnitExp / applyDuelIntimacy / applyBattleIntimacy / Wounded | self | appointGenPost / dismissGenPost / processFactionLoyalty 写 genFactionMod | poachGen 写 loyalty / 计谋 stratSpy 写 loyalty | events 写 genLoyalty / chronicle / faction events trigger genFactionMod | — | gentry 写 genFactionMod(豪族派系) |
| **政治**(被写) | — | trackCityLoss → checkPostDowngrade(失城裁官) | — | self | — | events trigger court(?) | — | gentry 影响 stage anchor |
| **外交**(被写) | — | trackCityLoss / checkBloodFeud(战后)/ checkEmperorCapture | poachGen 失败信誉惩罚 | enthrone 写 ethos+diplo | self | events 写 diplo(盟约破裂等) | ethos 影响信誉 | — |
| **事件**(被写) | resource events 触发 | rebellion / plague 触发 | event 触发 / promise 完成 | — | — | self | — | gentry events |
| **价值观**(被写) | 屠城 ethos shock | aftermath ethos shock | — | enthrone 写 mandate | 宣战写 ethos / 撕约写 ethos | events ethos shock | self | gentry events |
| **豪族**(被写) | — | 占领 applyGentryOnCapture / aftermath / 屠城 applyFamilyLoyaltyShock | 太守招募(本地士族)增 gentry | 朝议 / decree 影响 gentry | — | gentry events | ethos 影响 gentry | self |

**关键观察**:
- **武将链**被几乎所有链写(中心枢纽,被读最多)
- **军事链**功能最杂(战斗 / 移动 / 补给 / 招募 / fog / hex 寻路 / 城防全揉一起)
- **事件链**effect 跨写最广(events 实际上是任意 G mutator 的容器)
- **价值观 + 豪族**最少跨写(ethos / gentry G subtree 集中,适合做模板)

## 3. backToTitle reset 行 → 各 chain 待同步处理(carry-over from 3.4)

| 顶层 let | 归属 chain | backToTitle reset 行 |
|---|---|---|
| `_battleReports / _pendingBattleConfirms / _currentBattleReport / _currentBattleConfirm / _pendingSiegeArrival / _pendingBattleAnimations / _marchAnimating / _duelChallenger / _aiBattleProcessedThisTurn / _supplyCache / _unitIdCounter` | **军事**(11 个,最重) | 抽 chains/military.js 时同步处理 |
| `_techEffectCache / _techEffectCacheTurn / _facInfluenceCache / _facInfluenceCacheTurn` | **政治**(4) | 抽 chains/politics.js 时同步处理 |
| `_pendingPeaceOffer / _pendingVassalOffer` | **外交**(2) | 抽 chains/diplomacy.js 时同步处理 |
| `_deployedGensMoraleCache` | **武将**(1) | 抽 chains/general.js 时同步处理 |
| 各 render lets(_ov*Cache / _staticMapCache / _activeOverlay 等) | 留 v181(phase 2 原则) | — |

## 4. 推荐的"第一个 chain 抽离模板"

**首推:价值观链(ethos)**
- ✅ 最小 chain(4 mutator + 1 render)
- ✅ G state 最集中(`G.factions[fid].ethos / ._ethosLog / ._ethosSnap`)
- ✅ 跨链 write 最少(只有自家 processFacEthos 主动写,被写但不主动写跨链)
- ✅ phase 3.2 scout 已 flag(applyEthosShock + _applyEthosDrift 是 ethos hub)
- ✅ 0 个 _execXxx 派发到此链(claude_ai.js K switch 不调 ethos)
- ✅ 0 个 backToTitle reset 行(无 sister-of-G let)
- ✅ phase 3 chain 抽离的"小型样板",验证 pattern 后再做大 chain

**次选:豪族链(gentry)**
- ~14 函数,中等
- G subtree 集中(`G.cities[].gentry / .gentryClans / G.factions[fid].gentryClanMods`)
- 跨链 write 中等(政治朝议 + 战斗 aftermath 写)
- 0 个 _execXxx,0 个 backToTitle reset 行
- 但内部有"战斗 aftermath"(_applySiegeAftermath / showSiegeAftermathChoice / _onSiegeAftermath)是军事边界

## 5. 推荐 8 链顺序(制作人 approve 修订版,2026-05-05)

**修订**:**事件链从 Wave 1 移到 Wave 3 开头**。理由:events effects 跨写所有 G(写口在 effect 函数体内),按 (a) 原则这些写口归各 chain。如果事件链放 Wave 1,effects 写口要么违反 (a) 跟事件链走,要么等 Wave 2 抽完才能定归属,到时要回头改。放 Wave 3 开头更顺 — 此时各链已抽完,事件 effects 写口归宿全部明确。

| Sub-session | Chain | Wave | 理由 |
|---|---|---|---|
| **3.5** | **价值观(ethos)** | 1 | 模板首发:5 函数 / G subtree 集中 / 0 _exec / 0 backToTitle reset |
| **3.6** | **豪族(gentry)** | 1 | 14 函数 / 集中 / 0 _exec / 0 backToTitle reset。模板第二应用 |
| **3.7** | **政治(politics)** | 2 | ~50 函数 / 含 court UI / tech UI / 1 _exec / 4 backToTitle reset |
| **3.8** | **外交(diplomacy)** | 2 | ~66 函数 / 14 _exec / 2 backToTitle reset。31 D 类原 audit |
| **3.9** | **经济(economy)** | 2 | ~65 函数 / 含 trade subgroup 与外交交织 / 5 _exec |
| **3.10** | **事件(event)** | 3 | 7 函数 / events 数据已抽 / **effects 写口此时各链都已抽完,归属明确** |
| **3.11** | **军事(military)** | 3 | ~200 函数(粗算)/ 9 _exec / 11 backToTitle reset。**最大** |
| **3.12** | **武将(general)** | 3 | ~70 mutator / **中心枢纽** / 6 _exec / 1 backToTitle reset。30 D 类。**留最后** |

**整体节奏**:
- **Wave 1**(3.5-3.6):2 个小集中 chain,固化模板
- **Wave 2**(3.7-3.9):3 个中等 chain
- **Wave 3**(3.10-3.12):事件 + 最大两 chain,其中事件第一(各链已抽完,写口归属明确),武将最后

**3.13** 收尾:全量 smoke + phase summary + merge main + 4(及以上)个本地遗留分支统一清理。

## 6. 风险与注意事项

1. **(a) 原则严格执行**:每个 chain 抽时按"写口归 chain"判定。phase 3 至今每次 scout 都偏离 plan §二字面 → chain 阶段更易偏离(很多函数 plan 字面没列)
2. **scout-before-extract**(phase 3.3 起):每个 chain sub-session 必须先做单链 scout,**总 scout(本报告)只是先看大格局,不能跳过单链 scout**
3. **phase 2 原则**(modals 留 v181):各 chain 含的 render 函数(renderEthosTab / renderTechTab / showCourtCouncil / 各战斗 modal 等)按 phase 2 原则留 v181,**chain 抽离纯 mechanism**
4. **carry-over backToTitle reset**:每个 chain scout 时把"backToTitle 中本 chain 涉及的 reset 行"列出来,实装时同步处理(从 v181 内同 script 写自家 let → 跨 script 写已抽走的 let)
5. **军事链特殊 — Phase 3 全局 carry-over(2026-05-05 制作人 approve 记录)**:hex / fog / pathfinding(L1589-L2623,~34 函数)是地图基础设施,不是军事链 mutator。**3.11 启动时正式讨论**是否单独抽到 `src/core/map.js`(候选第三个 carry-over,同 backToTitle reset 集中点处理方式)。本总图先记下,**不开新文件,等 3.11 决策**
6. **武将-政治-军事三角**:appointGenPost(政治写 genPost)/ killGen(军事写 generals)/ processFactionLoyalty(政治写 genFactionMod)— 这些函数的最终归属在各自 chain scout 时确定,本总图只给大致归属

## How to apply

重启 session 时:
1. `git log --oneline -5` 校验 HEAD 仍是 `fba8fc2`
2. 读 memory `project_chain_master_scout.md`(本文件)回放总图
3. 等制作人拍 8 链顺序(可能采用推荐 ethos → gentry → event → politics → diplomacy → economy → military → general,也可调整)
4. 拿到顺序后,**第一个 chain(默认 ethos)启动单链 scout**(per scout-before-extract 原则,本总图不替代单链 scout)
5. 单链 scout 报告 → 制作人 approve → 开 working branch 实装
