// src/chains/economy.js
//
// 经济链(E)— 部曲 helpers / 城市腐败 / 城市经济 read / 迁民 / turn processors /
//             AI 经济决策 / 玩家入口 / trade 通商子组 / 物资 helpers。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.9 / 阶段 3,chain 模板第五应用,Wave 2 收尾)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation,Node 脚本 line-by-line 复制 v181)。
//
// ── 抽离范围(8 段)──
//   E1 部曲 helpers                          v181 L1242-L1250  canBilletToCity / getBilletCities
//   E2 城市腐败                               v181 L3979-L4008  calcCityCorruption
//   E3.a 城市经济 read                        v181 L4806-L4927  getCityProd / getCityFoodCost
//                                                                / getCityFoodNet / getCityFoodTurns
//                                                                / getCityFoodColor
//   E3.b 迁民 mechanism                       v181 L4935-L5040  canMigrate / getMigrateTargets
//                                                                / executeMigration
//   E3.c AI 迁民                              v181 L5174-L5272  _aiConsiderMigration
//   E4  turn processors                       v181 L5279-L5617  processCityFood / garrisonCap
//                                                                / processGarrisonRecovery
//                                                                / _getDeployedGensForMorale
//                                                                / processMorale / getCityCap / processPop
//                                                                / processFacEconomy / getPrefectBuildBuff
//                                                                / processBuildQueues
//   E5  AI 经济决策 + 调粮                    v181 L5622-L5996  aiDoBuild / aiDoTransfer
//                                                                / aiDoAppointments / processTransfers
//                                                                / checkResupply / findBestDonor
//                                                                / cityDist / doTransfer
//   E6  玩家入口                               v181 L10042-L10118 buildBld / setTax / setPolicy
//                                                                / toggleResupply / setCorvee
//                                                                / cancelSupplyLine
//   E7  trade 通商子组(p3.8 carry-over §6 已识别)
//     E7.a aiDoTradeAgreement                  v181 L9663-L9690
//     E7.b _getTradeOffers + _findTradeCity + diploTrade  v181 L9746-L9801
//     E7.c TRADE_POST_NAME const + 7 trade funcs  v181 L9810-L9962
//          _canBuildTradePost / getTradeAgreements / hasTradeAgreement
//          / calcTradeAgrIncome / _cleanTradeAgreements / diploTradeAgreement
//          / cancelTradeAgreement
//   E8  物资 helpers                          v181 L13006-L13030 calcSlotMatCost / mergeMatCosts
//                                                                / canAffordMat / deductMat
//   E9  AI _exec 入口                         v181 L13383-L13455 _execBuild / _execSetTax /
//                                                                _execSetCorvee / _execTransferFood /
//                                                                _execToggleResupply
//                                             (sprint batch-28, 5 funcs)
//
// ── 留 v181 ──
//   modal/UI 紧密耦合(phase 2 原则):
//     `showMigrateDialog`(L5042-L5171)— 迁民弹窗 modal HTML
//     **粮食警报整段**(L6000-L6098)— 7 funcs + 2 顶层 const(`_pendingCards / _shownCities`):
//       `renderAlertStack / confirmCard / dismissCard / renderFoodAlerts /
//        _doFATransfer / confirmFALong / confirmFAOnce / dismissFA`
//       (callback 直接写 DOM `renderFoodAlerts()` / `renderAllLight()`,
//        与 modal 状态双向耦合,整段留 v181 更顺)
//   `_supplyCache`(L13431,军事链 supply state,留 3.11)
//   `createUnit`(L13033,军事链 unit creation,夹在物资 helpers 后,留 3.11)
//   `getStrategistInt / setStrategist`(L9697-L9744,武将链军师,夹在 trade 子组中间,留 3.12)
//   `showSiegeAftermathChoice`(L9977,豪族链 modal,夹在 trade 子组后,已留 v181)
//   注: 经济相关 5 个 `_exec*` 已抽到 E9 (sprint batch-28, 按 (a) 原则归位):
//       _execBuild / _execSetTax / _execSetCorvee / _execTransferFood / _execToggleResupply
//   注: _execSetPrefect 随 setPrefect 归 general.js GEN16 (sprint batch-27)
//   注: _execCancelSupply 由 sprint batch-22 deletion 删除 (D-099)
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G.cities[id].storage / .pop / .morale / .build / .corruption / .garrison /
//      .billetPool / .scrapDrops / .siegeDecay / .occupied`(城市状态)
//   - `G.factions[fid].res.gold / .food / .horses / .iron / .wood`(势力资源)
//   - `G.factions[fid]._postBuffs / ._fiscalReport`(经济 cache,read 在经济;_postBuffs
//      写在 src/core/tick.js)
//   - `G.foodAlertCards / G.supplyLines / G._supplyCD`(警报 + 补给线 state)
//   - `G._tradeAgreements / G._tradeCD`(通商子组 state)
//   - `G._migratedThisTurn`(迁民全局每旬 cache)
//   - 通过 `_aggregateGentry`(已抽 gentry)间接写 `city.gentry`(豪族边界,已 carry-over §3.6)
//
// **跨链副作用写口**(按 (a) 原则,主写口落经济,副作用写口落他链 — 整函数归经济):
//   - `executeMigration`:写 `city.gentry`(豪族,通过 _aggregateGentry)+ ethos 影响
//   - `processMorale`:可能调 `applyEthosShock`(已抽 ethos)
//   - `processFacEconomy`:多处调 `getTechEffect / getCourtDecreeBuffs / calcPostBuffs`
//     (已抽 politics)反向调用
//   - `aiDoAppointments`:调 `setPrefect`(武将链,留 3.12)— 太守任命,主写口在城市 prefect
//     —— 实际 setPrefect 写 city.prefect(经济城市 state)+ G.genLoyalty(武将 副作用)
//        master scout 把 setPrefect 归武将链,本 session aiDoAppointments 反向调
//   - `aiDoBuild`:扣 res(经济)+ 调 `getTechEffect / calcPostBuffs / getCourtDecreeBuffs`(政治)
//   - `diploTrade`:扣 `G.factions[fid].res.gold`(经济)+ 写 `G.scoutReveals`(外交计谋)+
//     调 `addDiplo / _diploActed / _diploMarkActed / _applyScoutReveal`(已抽外交)
//     —— 通商主写口在经济资源,谍报副作用归外交
//   - `aiDoTradeAgreement`:写 `G._tradeAgreements`(经济 trade)+ 扣 res(经济)+
//     调 `addDiplo / getSuzerain / hasTradeAgreement`(外交)
//   - `processTransfers`:写 city.storage(经济)+ city.morale(经济)
//   - `setTax / setPolicy / setCorvee`:写 `G.factions[fid].taxRate / .policy / .corvee`
//     —— 单一写经济政策状态
//
// 3.6 carry-over §1 验证(✓):`calcCityCorruption` 调 `_getCorruptGentryMod`(已抽 gentry)
//   是反向调用,无需动。本 session 直接抽 calcCityCorruption。
// 3.7 carry-over §5 验证(✓):`processTechResearch / startTechResearch` 扣 res 是政治写口
//   副作用,经济**不反取**(本 session 不重复抽 res 写口)。
// 3.8 carry-over §6 验证(✓):trade 子组(aiDoTradeAgreement + 12 个 trade 函数)夹在
//   外交段中间,p3.8 已识别清单,本 session 直接抽。
//
// 该跨链写在对应 chain 抽离时再次确认归属(同 3.5/3.6/3.7/3.8 模式)。
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/ + src/render/ +
// chains/ethos.js + chains/gentry.js + chains/politics.js + chains/diplomacy.js
// 模块共享 hoisted function 全局可见,无 import/export)。
//
// `BILLET_LEVEL_THRESHOLD`(常量,留 v181 L1241,只有本 chain 用 — 本应抽走但只 1 行,
// 留 v181 不影响 chain 归属判定)。
// `TRADE_POST_NAME`(top-level const)抽到本 chain。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(callers):
//   - 军事链(留 v181 等 3.11):
//       `getCityProd / getCityFoodCost / getCityFoodNet / getCityFoodTurns / garrisonCap /
//        getCityCap / canAffordMat / deductMat / mergeMatCosts / calcSlotMatCost /
//        canBilletToCity / getBilletCities` — 多处征兵 / 单位 / 城防计算
//       `processGarrisonRecovery / processMorale / processCityFood / processPop` 被 tick 调
//   - 武将链(留 v181 等 3.12):
//       `setPrefect / clearPrefectByGen` 调 `processPop / processCityFood / processMorale`
//       (反向 callee)— 太守变化影响经济
//       多处武将动作(死亡 / 招募 / 任命)调 `getCityProd / getCityFoodCost / processFacEconomy`
//   - 政治链(已抽 chains/politics.js):
//       `processTechResearch / startTechResearch / calcPostBuffs` 写 res(本 chain 主写口),
//       是政治写口的副作用(已 carry-over §3.7)
//       `appointGenPost / dismissGenPost` 副作用调 `clearPrefectByGen`(武将)
//   - 外交链(已抽 chains/diplomacy.js):
//       `diploGift / diploArmistice / diploAlly / stratEnvoy / strat*` 多处扣 res
//       (本 chain 主写口),是外交写口的副作用
//       `_clearSiegeOnPeace` 写 unit / city.siegeDecay(已抽外交)— 反向调用
//   - 豪族链(已抽 chains/gentry.js):
//       `processGentry` 调 `getCityProd / getCityFoodCost / canBilletToCity` 等(反向)
//       `_aggregateGentry` 被本 chain `executeMigration / processMorale` 调
//   - 价值观链(已抽 chains/ethos.js):
//       `processFacEthos` 调 `aiDoBuild` 路径(?)— 反向(留 v181 检查)
//   - 事件链(留 v181 等 3.10):
//       事件 effects 多处写 res / city.morale / city.pop(本 chain 主写口),是事件副作用
//   - render(留 v181):
//       `tooltips.js / ui_panels.js`:`getCityProd / getCityFoodCost / getCityFoodNet /
//       getCityFoodTurns / getCityFoodColor / garrisonCap / getCityCap / hasTradeAgreement /
//       getTradeAgreements / calcTradeAgrIncome / canAffordMat / mergeMatCosts /
//       calcSlotMatCost / cityDist / canBilletToCity / getBilletCities`
//       v181 inline 多 modal(renderRecruitModal / renderExpandModal 等)调多个经济 helper
//   - core(已抽):
//       `src/core/tick.js`:`processCityFood / processGarrisonRecovery / processMorale /
//       processPop / processFacEconomy / processBuildQueues / processTransfers / checkResupply /
//       _aiConsiderMigration / aiDoBuild / aiDoTransfer / aiDoAppointments / aiDoTradeAgreement /
//       _cleanTradeAgreements`(每旬调用)
//       `src/core/main.js`:initGame / loadFromSlot 调多个经济 helper
//       `src/core/claude_ai.js`:5 个 `_exec*` 调本 chain 的 buildBld / setTax / setPrefect /
//       toggleResupply / cancelSupplyLine / doTransfer
//   - inline backToTitle / startGame / saveGame / loadGame:
//       L6001-L6002 const _pendingCards / _shownCities 留 v181(粮食警报段整段留)
//       backToTitle / startGame 内多处 reset(本 session 实测时确认)
//
// 本 chain 调外部链(callees):
//   - `_aggregateGentry`(已抽 chains/gentry.js)— `executeMigration` 调
//   - `_getCorruptGentryMod`(已抽 chains/gentry.js)— `calcCityCorruption` 调
//     (3.6 carry-over §1 已记)
//   - `getGentryGoldMult`(已抽 chains/gentry.js)— `getCityProd` 调
//   - `getTechEffect / getCourtDecreeBuffs / calcPostBuffs / getStage / getTributeRates`
//     (已抽 chains/politics.js)— 多处调
//   - `applyEthosShock`(已抽 chains/ethos.js)— `processMorale / executeMigration` 等调
//   - `addDiplo / _diploActed / _diploMarkActed / _applyScoutReveal / getDiploStatus /
//      isHostile / alliedFacs / getSuzerain / hasFacGen / genHasOffice / triggerFactionEvent`
//     (已抽 chains/diplomacy.js / 留 v181 武将)— `diploTrade / aiDoTradeAgreement /
//      processFacEconomy` 等调
//   - `setPrefect / clearPrefectByGen`(武将链 太守 helpers,留 v181 等 3.12)
//     — `aiDoAppointments / processTransfers` 等调
//   - `safeSub / safeAdd`(已抽 src/core/helpers.js)
//   - `closeModal / renderRight / renderLeft / renderAll / renderAllLight / renderMap /
//      showNotif / log / fmt / invalidateCityCache`(已抽 / 留 v181)
//   - `setStrategist / getStrategistInt`(武将链军师,留 3.12)
//   - 数据 / 常量:`CITY_MAP / CITIES_DEF / CITY_TO_STATE / SUPPLY_LOSS_RATES /
//      TAX_DEFS / POLICY_DEFS / CORVEE_DEFS / TRADE_AGR_COST / TRADE_AGR_MAX /
//      GAR_SALARY_RATE / SUPPLY_CITY_RESTORE_TURNS / FOOD_ALERT_COOLDOWN /
//      MIGRATION_LOSS_RATE / MIGRATION_RECEIVING_BONUS / BLD_DEFS / SQUAD_DEFS /
//      MAT_PER_TROOP / FAC / getScenarioFactions()`(部分已抽 src/data/,部分留 v181)
//   - `G(状态根)`(已抽 src/core/state.js)
//
// 同 phase 2/3.2/3.3/3.4/3.5/3.6/3.7/3.8 反向调用模式,设计原则 (c) 已 approve。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_*_notes §二)──
// PLAN §三阶段 3.9(原)字面:`chains/economy.js(经济链 v4 / ~65 函数)`
//   字面映射:~65 函数(master scout)
// scout 实测 + 实装:**51 函数 + 1 const(TRIBUTE_RATES 已抽政治 / TRADE_POST_NAME 抽本 chain)
//   verbatim ~1700 行 v181 代码 + 350 header → economy.js ~2050 行**
// PLAN-vs-reality 偏差中等,主因:
//   - 粮食警报整段(8 funcs + 2 const)留 v181(phase 2 原则,UI 紧密耦合)
//   - showMigrateDialog 留 v181(modal HTML)
//   - master scout 估 ~65 包含粮食警报 + dialog,实测 51
//
// scout-before-extract 第 9 次应用(本 session 自决,follow 模板规范 + scout 四件验证)。
// scout 四件验证(p3.8 教训沉淀):
//   (a) ✓ awk 列范围内所有 function — 检测到 trade 子组 L9663-L9985 范围夹了 4 个他链函数
//       (getStrategistInt / setStrategist / showSiegeAftermathChoice + createUnit 在物资范围)
//   (b) ✓ grep -n "^}" 验证每段最后函数真实 closing(每段都精确到函数体结束)
//   (c) ✓ build 脚本 header 提取用 banner 终止标记(idempotent 重跑)
//   (d) ✓ 函数名带 chain 前缀按主写口判定(diploTrade 名字含 diplo,但写 G.factions[].res +
//        G._tradeCD 主写口在经济;aiDoTradeAgreement 同)
//
// ── script 加载顺序(phase 3.5 拍板规范)──
// `data/* → core/* → chains/* → render/* → inline`
// 本文件加在 chains/diplomacy.js 之后,render/notifications.js 之前。chains/ 内顺序无关。
//
// ── chain 抽离模板第五次应用(Wave 2 收尾)──
// phase 3.5 ethos 模板首发 / 3.6 gentry 第二 / 3.7 politics 第三 / 3.8 diplomacy 第四,
// 本 session 是模板第五应用(Wave 2 最后一个,3.10 起进 Wave 3)。
//   - 6 项 header 必含 ✓(含写口归属声明)
//   - 加载顺序规范 ✓
//   - phase 2 原则(modal HTML + 粮食警报 UI 耦合段 留 v181)✓
//   - 跨链反向调用 (c) 容许,callers/callees 按归属链整理 ✓
//   - 跨链 carry-over 验证(§3.6 + §3.7 + §3.8)✓
//   - Node 脚本 line-by-line verbatim 复制(预防 awk 边界 + 字符替换 bug,p3.6+p3.7+p3.8 教训)✓
//   - scout 四件验证全部 PASS ✓

// ════════════════════════════════════════════════════════════════════
// ── E1 部曲 helpers (v181 L1242-L1250) ──
// ════════════════════════════════════════════════════════════════════

function canBilletToCity(cityId, fid) {
  const city = G.cities[cityId];
  if (!city || city.fac !== fid) return false;
  const def = CITY_MAP[cityId];
  return def && (def.size === 'large' || def.isCapital);
}
function getBilletCities(fid) {
  return Object.values(G.cities).filter(c => canBilletToCity(c.id, fid)).map(c => c.id);
}

// ════════════════════════════════════════════════════════════════════
// ── E2 城市腐败 calcCityCorruption (v181 L3979-L4008) ──
// ════════════════════════════════════════════════════════════════════

function isPrefectInFieldUnit(city){
  if(!city?.prefect) return false;
  const cityDef = CITY_MAP[city.id];
  if(!cityDef) return false;
  const unit = G.units.find(u => Array.isArray(u.squads) && u.squads.some(sq => sq.genName === city.prefect));
  if(!unit) return false;
  return unit.hq !== cityDef.q || unit.hr !== cityDef.r;
}

function calcCityCorruption(city, cityCount){
  const baseRate = Math.min(CORRUPT_CAP, Math.max(0, (cityCount - CORRUPT_FREE_CITIES) * CORRUPT_PER_CITY));
  if(baseRate <= 0) return 0;
  // 太守压腐：(pol-50)/250，镜像设计，无太守=0
  let prefectMod = 0;
  if(city.prefect){
    const pol = GEN_MAP[city.prefect]?.pol ?? 50;
    prefectMod = (pol - 50) / 250; // pol=100→+0.20, pol=50→0, pol=0→-0.20
    // 本地士族太守额外+5%（v172: 按"武将州所属士族派系 == 城市州所属士族派系"判定）
    const tags = GEN_TAGS[city.prefect];
    const cityState = CITY_TO_STATE[city.id];
    if(tags && cityState){
      const isLocalGentry = tags.origin === 'gentry'
        && tags.state && STATE_TO_GENTRY_FAC[tags.state] === STATE_TO_GENTRY_FAC[cityState];
      if(isLocalGentry) prefectMod += 0.05;
    }
    if(isPrefectInFieldUnit(city)) prefectMod *= 0.5;
  }
  // 豪族压腐
  const gentryMod = _getCorruptGentryMod(city.gentry);
  // ★ v152: 整肃吏治decree buff
  let decreeMod = 0;
  if(G.courtDecrees){
    G.courtDecrees.filter(d => d.fid === city.fac && d.buffKey === 'corruptReduce' && d.expiresAt > G.turn).forEach(d => {
      decreeMod += d.effectVal; // effectVal is negative e.g. -0.05
    });
  }
  // 实际腐败率 = 基础 - 太守压腐 - 豪族压腐 + decree减免（加减法，直观），clamp 0~1
  const effective = baseRate - prefectMod - gentryMod + decreeMod;
  return Math.max(0, Math.min(1, effective));
}

// ════════════════════════════════════════════════════════════════════
// ── E3.a 城市经济 read (v181 L4806-L4927) ──
// ════════════════════════════════════════════════════════════════════

function getCityProd(city){
  const ts=getCityStats(city.tags||[]);
  const sMod=SEASON_MOD[SEASONS[G.seasonIdx]];
  const b=city.buildings||{};
  const farmLv=b.farm||0,irrLv=b.irr||0,mktLv=b.market||0;
  const harbLv=b.harbor||0,stableLv=b.stable||0;
  const hasPort=(city.tags||[]).includes('港口');
  const hasHorse=(city.tags||[]).includes('产马');

  // v0.5: 驻军不贡献产出，只有民众生产
  const effPop=city.pop*(city.popQuality/100);
  // ★ v167fix #4: 非粮资源人口也封顶在承载力（旧逻辑超承载力人口无上限刷金）
  const _resCap = getCityCap(city);
  const effPopCapped = Math.min(effPop, _resCap * (city.popQuality / 100));
  const popMult=effPopCapped/250000; // v107: pop×5, 分母同步×5

  // ★ v166: 产粮人口封顶在承载力——超过承载力的人口只吃饭不种田
  const _foodCap = _resCap; // 复用同一承载力
  const effPopForFood = Math.min(effPop, _foodCap * (city.popQuality / 100));

  // ★ v165: 屯田——修整兵员贡献粮产（质量100，效率×2基础/×3有科技）
  const _billetTroops = (city.billetPool||[]).reduce((s,bp) => s + (bp.troops||0), 0);
  const _tuntianMult = hasTechEffect(city.fac, 'tuntianBoost') ? 3 : 2; // econ11军屯精耕
  const _tuntianPop = _billetTroops * _tuntianMult;
  const foodPopMult = (effPopForFood + _tuntianPop) / 250000;

  // ★ v124: 农田/市集改为base加值（不再用百分比）
  const FARM_FLAT=[0,100,190,270]; // Lv0/1/2/3 加到base.food（增量100/90/80递减）
  const MKT_FLAT =[0,40,75,105];   // Lv0/1/2/3 加到base.gold（增量40/35/30递减）
  const effBaseFood = city.base.food + FARM_FLAT[farmLv];
  const effBaseGold = city.base.gold + MKT_FLAT[mktLv];

  const irrBonus=irrLv>0&&farmLv>0?[0,1.2,1.4,1.6][irrLv]:1.0;
  const goldHarbMod=1+(hasPort?harbLv*.30:0); // 港口建筑保持百分比不变
  const _tpLv = b.tradepost||0; // ★ v164: 商港/榷场/马市
  // ★ v179fix P30: 索引越界保护 — 若将来 BLDS.tradepost.levels 扩到 lv4+ 而此数组未同步会拿到 NaN
  const _tpModTbl = [0,0.15,0.25,0.35];
  const _tpMod = 1 + (_tpLv>0 && _canBuildTradePost(city.id) ? (_tpModTbl[Math.min(_tpLv, _tpModTbl.length-1)]) : 0);
  const horseBldMod=1+stableLv*(hasHorse?.40:.20);

  // 太守政治加成：金币 +pol/500
  const prefectPol = city.prefect ? (GEN_MAP[city.prefect]?.pol ?? 0) : 0;
  const prefectHalfInProd = isPrefectInFieldUnit(city) ? 0.5 : 1.0;
  const prefectGoldMult = 1 + (prefectPol / 500) * prefectHalfInProd;

  // ★ v113: 太守派系产出修正（阈值同getFactionMoraleMod: ±15）
  let _facProdMult = 1.0;
  if(city.prefect && city.fac){
    const _pfFacId = getGenFaction(city.prefect, city.fac);
    if(_pfFacId){
      const _pfAvg = getAvgFactionMod(city.fac, _pfFacId);
      if(_pfAvg <= -15) _facProdMult = 0.85;
      else if(_pfAvg >= 15) _facProdMult = 1.10;
    }
  }

  return{
    food: Math.floor(effBaseFood*foodPopMult*ts.foodM*sMod*irrBonus * 0.50 // v124: base加值×popMult×tags×season×水利; ★ v165: foodPopMult含屯田
      * (1 + getTechEffect(city.fac, 'foodProdMult'))                        // ★ v115: 科技粮产加成
      * (1 + (hasTechEffect(city.fac,'bigCityFoodBonus') && city.pop > 150000 ? getTechEffect(city.fac,'bigCityFoodBonus') : 0)) // 屯田制
      * (1 + (city._grainBonus||0))                                          // ★ v132 G4: 丰年大收永久粮产加成
    ),
    gold: Math.floor(effBaseGold*popMult*ts.goldM*goldHarbMod*_tpMod*prefectGoldMult*getGentryGoldMult(city)*_facProdMult
      * (1 + getTechEffect(city.fac, 'goldProdMult'))                        // ★ v115: 科技金产加成
      * (1 + getTechEffect(city.fac, 'prefectProdBonus'))                    // ★ v115: 明镜高悬
    ),
    wood: Math.floor(city.base.wood*popMult*ts.woodM),
    iron: Math.floor(city.base.iron*popMult*ts.ironM*.9
      * (1 + getTechEffect(city.fac, 'ironProdMult'))                        // ★ v115: 盐铁官营
    ),
    horses:Math.floor(city.base.horses*popMult*ts.horseM*horseBldMod),
  };
}

/**
 * 获取城市本旬粮食总消耗（民用+驻军）
 * 马匹消耗按势力平摊（各城按粮食产出比例承担）
 */
function getCityFoodCost(city){
  const civil=city.pop*0.0004; // v107: pop×5, 费率÷5
  // v0.5: 驻守×0.004 / 行军×0.010
  const garRate=0.004;  // 城防军粮耗固定（v45：移除全局troopMode）
  const garrison=city.garrison*garRate;
  return{ civil, garrison, total: civil+garrison };
}

// v0.5: 粮食净值（产>耗为正）
function getCityFoodNet(city){
  let prod=getCityProd(city).food;
  // ★ v150fix C1: 叠加官职/朝议粮产buff+蒋琬（对齐processCityFood，影响16处调用）
  const pb = G.factions[city.fac]?._postBuffs;
  if(pb && pb.foodProd) prod = Math.floor(prod * (1 + pb.foodProd));
  if(hasFacGen(city.fac, '蒋琬') && genHasOffice('蒋琬', city.fac)) prod = Math.floor(prod * 1.05);
  const cost=getCityFoodCost(city).total;
  return prod-cost;
}

// 可撑旬数
function getCityFoodTurns(city){
  const net=getCityFoodNet(city);
  if(net>=0) return Infinity;
  if(city.storage<=0) return 0;
  return city.storage/(-net);
}

// 别名
/**
 * ★ 地图颜色判断（新版三态）
 *   绿色 = 自给有余（turns=Infinity）
 *   黄色 = 可撑9~18旬
 *   红色 = 可撑<9旬
 */
function getCityFoodColor(city){
  const t=getCityFoodTurns(city);
  if(t===Infinity) return '#1a7a3a';
  if(t>=9)         return '#8a6a10';
  return '#c03030';
}

// ════════════════════════════════════════════════════════════════════
// ── E3.b 迁民 mechanism (v181 L4935-L5040) ──
// ════════════════════════════════════════════════════════════════════

function canMigrate(srcCityId){
  const city = G.cities[srcCityId];
  if(!city || city.fac !== G.playerFac) return {ok:false, reason:'非己方城市'};
  if(G._migratedThisTurn) return {ok:false, reason:'本旬已迁移过'};
  if((city._migrateCooldown||0) > G.turn) return {ok:false, reason:`冷却中（第${city._migrateCooldown}旬解除）`};
  // 安全检查：来源城2hex内无敌军
  const srcDef = CITY_MAP[srcCityId];
  if(srcDef){
    const hasEnemy = G.units.some(u =>
      isHostile(G.playerFac, u.fac) && getUnitTroops(u)>0 &&
      hexDist(u.hq??0, u.hr??0, srcDef.q, srcDef.r) <= MIGRATE_ENEMY_CHECK_RANGE
    );
    if(hasEnemy) return {ok:false, reason:'来源城附近有敌军（2格内）'};
  }
  // 检查是否有合法目的城
  const dsts = getMigrateTargets(srcCityId);
  if(!dsts.length) return {ok:false, reason:'无可用邻城（需己方且安全）'};
  return {ok:true};
}

/** 获取合法目的城列表 */
function getMigrateTargets(srcCityId){
  const neighbors = ROAD_ADJ[srcCityId] || [];
  return neighbors.filter(nbId => {
    const nb = G.cities[nbId];
    if(!nb || nb.fac !== G.playerFac) return false;
    // 目的城2hex内无敌军
    const nbDef = CITY_MAP[nbId];
    if(!nbDef) return false;
    return !G.units.some(u =>
      isHostile(G.playerFac, u.fac) && getUnitTroops(u)>0 &&
      hexDist(u.hq??0, u.hr??0, nbDef.q, nbDef.r) <= MIGRATE_ENEMY_CHECK_RANGE
    );
  });
}

/** 执行迁民 */
function executeMigration(srcCityId, dstCityId, ratio){
  const src = G.cities[srcCityId], dst = G.cities[dstCityId];
  if(!src || !dst) return;
  const fid = src.fac;

  // ★ v166: 徙民实边科技——降低损耗率和目的城惩罚
  const _migLossReduce = getTechEffect(fid, 'migrateLossReduce'); // 0 or 0.10
  const _migDstReduce = 1 - getTechEffect(fid, 'migrateDstPenReduce'); // 1 or 0.70

  const movedPop = Math.floor(src.pop * ratio);
  const effectiveLossRate = Math.max(0.10, MIGRATE_LOSS_RATE - _migLossReduce); // 下限10%
  const arrivedPop = Math.floor(movedPop * (1 - effectiveLossRate));

  // ── 人口变动 ──
  src.pop -= movedPop;
  src.pop = Math.max(25000, src.pop);
  dst.pop += arrivedPop;

  // ── 比例计算 ──
  const srcScale = ratio / 0.50;  // 以50%迁出为基准
  const dstRatio = arrivedPop / Math.max(1, dst.pop - arrivedPop); // 涌入比（对迁入前人口）
  const dstScale = dstRatio / 0.30; // 以30%涌入为基准

  // ── 来源城惩罚（科技不减免，焦土代价应由来源城承受）──
  src.morale = Math.max(0, src.morale + MIGRATE_SRC_BASE.morale * srcScale);
  src.popQuality = Math.max(20, src.popQuality + MIGRATE_SRC_BASE.quality * srcScale);
  src.storage = Math.max(0, Math.floor(src.storage * (1 + MIGRATE_SRC_BASE.storagePct * srcScale)));

  // ── 目的城惩罚（科技减免）──
  dst.morale = Math.max(0, dst.morale + MIGRATE_DST_BASE.morale * dstScale * _migDstReduce);
  dst.popQuality = Math.max(20, dst.popQuality + MIGRATE_DST_BASE.quality * dstScale * _migDstReduce);

  // ── 属县loyalty冲击 ──
  const srcReg = CITY_TO_STATE[srcCityId];
  const dstReg = CITY_TO_STATE[dstCityId];
  const isSameReg = srcReg && dstReg && srcReg === dstReg;
  const countyMod = isSameReg ? MIGRATE_COUNTY_SAME : MIGRATE_COUNTY_CROSS;
  const srcGentryFac = srcReg ? STATE_TO_GENTRY_FAC[srcReg] : null;
  const dstGentryFac = dstReg ? STATE_TO_GENTRY_FAC[dstReg] : null;

  if(src.counties){
    src.counties.forEach(co => {
      co.loyalty = Math.max(0, Math.min(100, co.loyalty + countyMod.src * srcScale));
      // clan_base额外冲击
      if(co.type === 'clan_base') co.loyalty = Math.max(0, co.loyalty + MIGRATE_CLAN_BASE_EXTRA.src);
    });
    src.gentry = _aggregateGentry(src); // ★ v179fix P29: 原丢弃返回值（_aggregateGentry 是纯函数），导致迁民后 city.gentry 1 旬内仍为旧值
  }
  if(dst.counties){
    dst.counties.forEach(co => {
      co.loyalty = Math.max(0, Math.min(100, co.loyalty + countyMod.dst * dstScale));
      if(co.type === 'clan_base' && !isSameReg) co.loyalty = Math.max(0, co.loyalty + MIGRATE_CLAN_BASE_EXTRA.dst);
    });
    dst.gentry = _aggregateGentry(dst); // ★ v179fix P29
  }

  // ── Ethos冲击：迁民=暴行 ──
  applyEthosShock(G.playerFac, 'civil', 3, '强迁人口');
  applyEthosShock(G.playerFac, 'military', 1, '强迁人口');

  // ── 冷却 + 每旬限制 ──
  src._migrateCooldown = G.turn + MIGRATE_COOLDOWN;
  G._migratedThisTurn = true;

  // ── 通知 ──
  const lostPop = movedPop - arrivedPop;
  showNotif(`${src.name}迁民${fmt(movedPop)}人至${dst.name}，途中损耗${fmt(lostPop)}（${Math.round(effectiveLossRate*100)}%），到达${fmt(arrivedPop)}人`, 'warn');
}


// ════════════════════════════════════════════════════════════════════
// ── E3.c AI 迁民 _aiConsiderMigration (v181 L5174-L5272) ──
// ════════════════════════════════════════════════════════════════════

function _aiConsiderMigration(fid){
  if(fid === G.playerFac || fid === 'rebel') return;
  if(G._migratedThisTurn) return; // ★ v167fix #9: 全局每旬只允许一次迁民
  const fac = G.factions[fid];
  if(!fac) return;
  // 性格限制：reckless不迁，仁政倾向不迁
  const pers = fac.aiPersonality || 'balanced';
  if(pers === 'reckless') return;
  const eth = fac.ethos;
  if(eth && eth.civil < -20) return; // 仁政倾向

  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  for(const city of myCities){
    if(city.pop < 100000) continue;
    if((city._migrateCooldown||0) > G.turn) continue;
    const cityDef = CITY_MAP[city.id];
    if(!cityDef) continue;

    // ── 与玩家完全对称的安全检查：来源城2格内不能有敌军 ──
    const nearEnemy2 = G.units.some(u =>
      isHostile(fid, u.fac) && getUnitTroops(u) > 0 &&
      hexDist(u.hq??0, u.hr??0, cityDef.q, cityDef.r) <= MIGRATE_ENEMY_CHECK_RANGE
    );
    if(nearEnemy2) continue; // 敌军太近，迁不了（和玩家一样）

    // ── 威胁判定：3-6格内有敌军逼近 + 本城守军不足 ──
    const nearbyEnemyTroops = G.units
      .filter(u => isHostile(fid, u.fac) && getUnitTroops(u) > 0 &&
        hexDist(u.hq??0, u.hr??0, cityDef.q, cityDef.r) <= 6)
      .reduce((s, u) => s + getUnitTroops(u), 0);
    if(nearbyEnemyTroops < 3000) continue; // 没有实质威胁

    const myGarrison = city.garrison || 0;
    const myUnitsHere = G.units
      .filter(u => u.fac === fid && getUnitTroops(u) > 0 &&
        hexDist(u.hq??0, u.hr??0, cityDef.q, cityDef.r) <= 2)
      .reduce((s, u) => s + getUnitTroops(u), 0);
    const totalDef = myGarrison + myUnitsHere;
    if(totalDef >= nearbyEnemyTroops * 0.6) continue; // 守得住，不用迁

    // ── 找安全邻城（与玩家完全相同的条件）──
    const neighbors = (ROAD_ADJ[city.id]||[]).filter(nbId => {
      const nb = G.cities[nbId];
      if(!nb || nb.fac !== fid) return false;
      const nbDef = CITY_MAP[nbId];
      if(!nbDef) return false;
      return !G.units.some(u => isHostile(fid, u.fac) && getUnitTroops(u)>0 &&
        hexDist(u.hq??0, u.hr??0, nbDef.q, nbDef.r) <= MIGRATE_ENEMY_CHECK_RANGE);
    });
    if(!neighbors.length) continue;

    // ★ v167fix #3: 选粮食余裕最高的邻城（旧逻辑选人口最多→涌入拥挤城反而崩粮）
    const bestDst = neighbors.sort((a,b) => getCityFoodTurns(G.cities[a]) - getCityFoodTurns(G.cities[b])).pop();
    const aiRatio = 0.50;
    const movedPop = Math.floor(city.pop * aiRatio);
    // ★ v166: 科技减免
    const _aiLossReduce = getTechEffect(fid, 'migrateLossReduce');
    const _aiDstReduce = 1 - getTechEffect(fid, 'migrateDstPenReduce');
    const _aiLossRate = Math.max(0.10, MIGRATE_LOSS_RATE - _aiLossReduce);
    const arrivedPop = Math.floor(movedPop * (1 - _aiLossRate));

    // 执行
    city.pop -= movedPop;
    city.pop = Math.max(25000, city.pop);
    G.cities[bestDst].pop += arrivedPop;

    const srcScale = aiRatio / 0.50;
    const dstRatio = arrivedPop / Math.max(1, G.cities[bestDst].pop - arrivedPop);
    const dstScale = dstRatio / 0.30;

    city.morale = Math.max(0, city.morale + MIGRATE_SRC_BASE.morale * srcScale);
    city.popQuality = Math.max(20, city.popQuality + MIGRATE_SRC_BASE.quality * srcScale);
    city.storage = Math.max(0, Math.floor(city.storage * (1 + MIGRATE_SRC_BASE.storagePct * srcScale)));

    const dst = G.cities[bestDst];
    dst.morale = Math.max(0, dst.morale + MIGRATE_DST_BASE.morale * dstScale * _aiDstReduce);
    dst.popQuality = Math.max(20, dst.popQuality + MIGRATE_DST_BASE.quality * dstScale * _aiDstReduce);

    // 属县冲击
    const srcReg = CITY_TO_STATE[city.id], dstReg = CITY_TO_STATE[bestDst];
    const isSame = srcReg && dstReg && srcReg === dstReg;
    const cMod = isSame ? MIGRATE_COUNTY_SAME : MIGRATE_COUNTY_CROSS;
    if(city.counties){ city.counties.forEach(co => { co.loyalty = Math.max(0, Math.min(100, co.loyalty + cMod.src * srcScale)); if(co.type==='clan_base') co.loyalty = Math.max(0, co.loyalty + MIGRATE_CLAN_BASE_EXTRA.src * srcScale); }); city.gentry = _aggregateGentry(city); } // ★ v167fix #10: 加srcScale；★ v179fix P29: 接收返回值
    if(dst.counties){ dst.counties.forEach(co => { co.loyalty = Math.max(0, Math.min(100, co.loyalty + cMod.dst * dstScale)); if(co.type==='clan_base' && !isSame) co.loyalty = Math.max(0, co.loyalty + MIGRATE_CLAN_BASE_EXTRA.dst); }); dst.gentry = _aggregateGentry(dst); } // ★ v179fix P29

    // Ethos
    applyEthosShock(fid, 'civil', 3, '强迁人口');
    applyEthosShock(fid, 'military', 1, '强迁人口');

    city._migrateCooldown = G.turn + MIGRATE_COOLDOWN;
    G._migratedThisTurn = true; // ★ v167fix #9: AI迁民也受全局每旬一次约束

    // 通知（对玩家可见的AI迁民）
    if(getCityFogLevel(G.playerFac, city.id) === FOG_VISIBLE || getCityFogLevel(G.playerFac, bestDst) === FOG_VISIBLE){
      showNotif(`${getFactionDef(fid)?.name||fid}将${city.name}人口迁往${dst.name}`, 'info');
    }
    break; // AI每旬最多迁一城
  }
}

// ════════════════════════════════════════════════════════════════════
// ── E4 turn processors (v181 L5279-L5617) ──
// ════════════════════════════════════════════════════════════════════

function processCityFood(city){
  if(city.fac === 'rebel') return; // ★ batch-21 D-026: rebel 城状态冻结
  let prod=getCityProd(city).food; // 已含科技粮产加成(getTechEffect)
  const cost=getCityFoodCost(city).total;
  // ★ D1: 官职+朝议 粮食产出buff（与科技加成独立叠加，设计意图：科技是永久基础，官职/朝议是临时加成）
  const pb = G.factions[city.fac]?._postBuffs;
  if(pb && pb.foodProd) prod = Math.floor(prod * (1 + pb.foodProd));
  // SKILL_INLINE: sheji — 蒋琬稳政：当官/君主时粮产+5%
  if(hasFacGen(city.fac, '蒋琬') && genHasOffice('蒋琬', city.fac)) prod = Math.floor(prod * 1.05);
  // ★ v136: 腐损率大幅提高——无粮仓5%，粮仓三级: 3%/1.5%/0.5%（旧2%/1.2%/0.8%/0.3%）
  const granLv=city.buildings.granary||0;
  const spoilRate=SPOIL_RATES[granLv];

  city.storage += prod;
  city.storage -= cost;
  if(city.storage > 0) city.storage -= city.storage * spoilRate; // ★ v167fix #30: 负存粮不应有腐损回弹
  city.storage = Math.max(0, city.storage);
}

// ═══════════════════════════════════════
// 城防军
// ═══════════════════════════════════════
/**
 * 城防军满编上限 = 人口 × 5%（雄关城额外+1%）
 * 这是"常备警察"上限，玩家无法主动调整，靠自然补员恢复
 */
function garrisonCap(city){
  // v109H: 城防兵力比例按规模分级
  const isPass=(city.tags||[]).includes('雄关');
  const sizeRate = {small:0.018, medium:0.012, large:0.010}[city.size||'medium'] || 0.012;
  const passBonus = isPass ? 0.003 : 0; // 雄关额外+0.3%
  return Math.floor(city.pop * (sizeRate + passBonus));
}

/**
 * 每旬自然补员：
 *   - 城市存粮充足（可撑≥4旬）且民心≥40 → 每旬补员 0.4%人口，最多补到满编
 *   - 存粮紧张或民心低 → 不补员（养不起/民不从军）
 *   - 叛乱后等民心回升再补，不强行维持
 */
function processGarrisonRecovery(city){
  if(city.fac === 'rebel') return; // ★ batch-21 D-026: rebel 城状态冻结
  const cap=garrisonCap(city);
  if(city.garrison>=cap) return; // 已满编
  const turns=getCityFoodTurns(city);
  if(turns<4) return;            // 粮食紧张
  if(city.morale<40) return;     // 民心太低，不应募
  // v109I: 补员率适配新上限，按规模分级确保合理补满时间
  const sizeRate = {small:0.0015, medium:0.0010, large:0.0008}[city.size||'medium'] || 0.0010;
  const recover=Math.max(50, Math.floor(city.pop * sizeRate));
  city.garrison=Math.min(cap, city.garrison+recover);
}


// 预计算出征将领set（processMorale被每城调用，避免重复遍历）
let _deployedGensMoraleCache = null;
function _getDeployedGensForMorale(){
  if(!_deployedGensMoraleCache){
    _deployedGensMoraleCache = new Set();
    G.units.forEach(u=>u.squads.forEach(sq=>_deployedGensMoraleCache.add(sq.genName)));
  }
  return _deployedGensMoraleCache;
}

function processMorale(city){
  if(city.fac === 'rebel') return; // ★ batch-21 D-026: rebel 城状态冻结
  const turns=getCityFoodTurns(city);
  const tax=TAX.find(t=>t.id===(G.factions[city.fac]?.taxId||'norm'));
  let d=0;
  if(turns===Infinity) d+=.3;
  else if(turns>=9) d-=.5;
  else d-=1.5;
  d+=tax?tax.moraleMod:0;
  d+=.1;
  if(city.occupied>0) d-=1.5;
  // 太守政治加成民心：pol/400/旬（v108: pol/200→pol/400，减缓民心恢复速度）
  // pol=60→+0.15，pol=90→+0.225
  if(city.prefect){
    const prefectPolM = GEN_MAP[city.prefect]?.pol ?? 0;
    const prefectHalfMorale = isPrefectInFieldUnit(city) ? 0.5 : 1.0;
    d += (prefectPolM / 400) * prefectHalfMorale;
  } else {
    // 无太守：使用全势力最高pol的微弱加成（兜底）
    const gens=G.generals[city.fac]||[];
    const bestPol=gens.length?Math.max(...gens.map(g=>g.pol)):0;
    if(bestPol>=80) d+=.15; else if(bestPol>=60) d+=.05;
  }
  // ★ D1: 太常民心回复buff
  const pbM = G.factions[city.fac]?._postBuffs;
  if(pbM && pbM.morale) d += pbM.morale;
  // ★ v107: 豪族支持→民心（单向：豪族拥戴则民心回复快，抗拒则持续压制）
  const _gentryVal = city.gentry ?? 50;
  if(_gentryVal >= 80)      d += 0.3;   // 拥戴
  else if(_gentryVal >= 60) d += 0.1;   // 支持
  else if(_gentryVal >= 40) {}           // 中立：无影响
  else if(_gentryVal >= 20) d -= 0.3;   // 不满
  else                      d -= 0.6;   // 抗拒
  // ★ v115: 科技民心恢复加成
  d += getTechEffect(city.fac, 'moraleRecovery');
  // SKILL_INLINE: jingyi — 王朗经义：当官时全城民心+0.15/旬
  if(hasFacGen(city.fac,'王朗') && genHasOffice('王朗',city.fac)) d += 0.15;
  // TEMPERAMENT: generous — 太守为仁厚时民心+0.5/旬
  if(city.prefect && (GEN_TAGS[city.prefect]||{}).temperament === 'generous') d += 0.5;
  // ★ v163: 徭役民心代价（仅该城有在建项目时生效）
  if(city.buildQueue && city.buildQueue.length > 0){
    const _corv = CORVEE.find(c=>c.id===(G.factions[city.fac]?.corveeId||'low')) || CORVEE[0];
    const _corvPolMit = (city.prefect && (GEN_MAP[city.prefect]?.pol??0) >= 75) ? 0.5 : 1.0;
    d += _corv.moralePen * _corvPolMit;
  }
  city.morale=Math.max(0,Math.min(100,city.morale+d));
}

// ═══════════════════════════════════════
// POPULATION
// ═══════════════════════════════════════
// v0.5: 人口承载上限
function getCityCap(city){
  const tags=city.tags||[];
  let cap=tags.includes('都市')?600000:300000; // v107: pop×5, 上限×5
  if(tags.includes('平原')) cap*=1.3;
  if(tags.includes('山地')) cap*=0.6;
  if(tags.includes('水乡')) cap*=1.1;
  return Math.floor(cap);
}

function processPop(city){
  if(city.fac === 'rebel') return; // ★ batch-21 D-026: rebel 城状态冻结
  const net=getCityFoodNet(city);
  const tax=TAX.find(t=>t.id===(G.factions[city.fac]?.taxId||'norm'));
  // ★ v166: 人口始终自然增长，粮食制约通过饥荒独立生效
  // 增长率与人口质量挂钩：质量0→0.6%/年，质量50→0.9%/年，质量100→1.2%/年
  const _growRate = (0.00017 + 0.00017 * (city.popQuality / 100)); // 0.00017~0.00034/旬 ≈ 0.6~1.2%/年
  let pd=0;
  pd += Math.floor(city.pop * _growRate);
  if(net < 0 && city.storage <= 0){
    // ★ v166: 饥荒死亡与粮食缺口成正比——缺口越大饿死越快
    const _foodCost = getCityFoodCost(city).total || 1;
    const _deficitRatio = Math.min(1, (-net) / _foodCost); // 吃不上饭的人口比例（0~1）
    pd -= Math.floor(city.pop * _deficitRatio * 0.05); // 挨饿人口每旬死5%
  }
  if(tax) pd+=Math.floor(city.pop*tax.popMod);
  // 战乱惩罚：城市3格hex内有非己方部队 → 人口流失+质量停止恢复
  const cityDef0 = CITY_MAP[city.id];
  const hasHostile = cityDef0 && G.units.some(u=>
    u.fac !== city.fac && getUnitTroops(u)>0 &&
    hexDist(u.hq??0, u.hr??0, cityDef0.q, cityDef0.r) <= 3
  );
  if(hasHostile) pd -= Math.floor(city.pop*0.002); // v107: rate不变（战乱损失率是自然规律）
  // ★ v115: 太平盛世——民心>70城市人口增长+40%
  if(pd > 0 && city.morale > 70) pd = Math.floor(pd * (1 + getTechEffect(city.fac, 'popGrowthMult')));
  city.pop=Math.max(25000, city.pop+pd); // ★ v166: 去掉Math.min(cap)硬钳位，人口可临时超承载力（超标部分只吃不产→粮荒自然回落）
  let qd=.05; // ★ v136: 0.10→0.05（质量恢复减半，征兵代价持续更久）
  if(city.morale>=60) qd+=.02; else if(city.morale<40) qd=0; // v136: 0.04→0.02
  const schoolLv=city.buildings.school||0;
  if(schoolLv>0) qd+=[0,.08,.15,.25][schoolLv]; // ★ v124: 学堂恢复提速（旧0.03/0.06/0.10）
  qd += getTechEffect(city.fac, 'popQualityRecovery'); // ★ v115: 兴学育才
  if(city.occupied>0) qd=0;
  if(hasHostile) qd=0; // 战乱：质量停止恢复
  // TEMPERAMENT: generous — 太守为仁厚时质量恢复+0.02/旬
  if(city.prefect && (GEN_TAGS[city.prefect]||{}).temperament === 'generous') qd += 0.02;
  // ★ v163: 徭役人口质量代价（仅该城有在建项目时生效）
  if(city.buildQueue && city.buildQueue.length > 0){
    const _corvQ = CORVEE.find(c=>c.id===(G.factions[city.fac]?.corveeId||'low')) || CORVEE[0];
    qd += _corvQ.qualPen;
  }
  // v107: 移除garrison/pop对popQuality的惩罚——城防是常驻警察，不影响人口质量
  city.popQuality=Math.max(20,Math.min(100,city.popQuality+qd));
}

// ═══════════════════════════════════════
// ★ 势力经济（非粮食资源：金/木/铁/马）
//   粮食已在城市级处理，此处不再维护势力粮食池
// ═══════════════════════════════════════
function processFacEconomy(){
  Object.keys(G.factions).forEach(fid=>{
    if(fid === 'rebel') return; // 叛乱势力不参与经济结算
    const fac=G.factions[fid];
    const cities=Object.values(G.cities).filter(c=>c.fac===fid);
    let gold=0,wood=0,iron=0,horses=0;
    let _totalCorruptLoss=0; // ★ v148: 腐败总损失（用于UI显示）
    cities.forEach(city=>{
      const p=getCityProd(city);
      // ★ v148: 腐败扣金 — 每城金产按腐败率扣除
      const cRate = calcCityCorruption(city, cities.length);
      const cLoss = Math.floor(p.gold * cRate);
      gold+=(p.gold - cLoss); wood+=p.wood; iron+=p.iron; horses+=p.horses;
      city._corruptRate = cRate;  // 缓存供tooltip读取
      city._corruptLoss = cLoss;
      _totalCorruptLoss += cLoss;
    });
    const tax=TAX.find(t=>t.id===(fac.taxId||'norm'));
    // v45：城防garrison军饷固定GAR_SALARY_RATE/兵/旬（玩家不可控，低成本）
    // 野战部队军饷由 processUnitSalary() 单独按status计费
    const totalGarrison=cities.reduce((s,c)=>s+c.garrison,0);
    const garSalary=Math.floor(totalGarrison*GAR_SALARY_RATE);
    const goldIncome = Math.floor(gold * (tax?.goldM || 1)); // 本旬净产出（税后），用于纳贡基数
    // ★ D1: 官职buff（金币产出加成）
    // ★ v149fix A07: 使用nextTurn已预计算的_postBuffs缓存，不再重复计算
    const postBuffs = fac._postBuffs || calcPostBuffs(fid); // fallback仅首旬安全网
    fac._postBuffs = postBuffs; // 确保缓存存在
    // SKILL_INLINE: zhushi — 张昭柱石：当官/君主时金产+3%
    const _zhangzhaoGold = hasFacGen(fid, '张昭') && genHasOffice('张昭', fid) ? 0.03 : 0;
    const goldWithBuff = Math.floor(goldIncome * (1 + (postBuffs.goldProd||0) + _zhangzhaoGold));
    // ★ v165: 通商协定收入
    const _tradeAgrIncome = calcTradeAgrIncome(fid);
    // ★ D1: 官职俸禄
    const postSalary = calcPostSalary(fid);
    fac.res.gold=Math.max(0,fac.res.gold+goldWithBuff+_tradeAgrIncome-garSalary-postSalary);
    fac._postSalary = postSalary;
    fac._tradeAgrIncome = _tradeAgrIncome; // 缓存供UI显示
    // SKILL_INLINE: zhezhong — 费祎折冲：当官/君主时铁木产出+5%
    const _feiyiMult = hasFacGen(fid, '费祎') && genHasOffice('费祎', fid) ? 1.05 : 1.0;
    fac.res.wood=Math.min(99999,fac.res.wood+Math.floor(wood * _feiyiMult));
    fac.res.iron=Math.min(99999,fac.res.iron+Math.floor(iron * _feiyiMult));
    fac.res.horses=Math.min(99999,fac.res.horses+horses);
    // 存储本旬城防军饷用于显示
    fac._garSalary=garSalary;
    fac._corruptLoss=_totalCorruptLoss; // ★ v148: 腐败总损失

    // ── 附庸纳贡：比例按宗主 stage（warlord 0/0、regional 10%/8%、regime 18%/12%）→ 转宗主 ──
    // ★ v181 #5: 按宗主 stage 差异化纳贡（getTributeRates）
    const suzerainFid = getSuzerain(fid);
    if(suzerainFid && G.factions[suzerainFid]){
      const _tr = getTributeRates(suzerainFid);
      const tributeGold = Math.floor(goldIncome * _tr.gold); // 对本旬收入而非存量
      const actualTribute = Math.min(tributeGold, Math.max(0, fac.res.gold)); // ★ v149fix: 不超过现有金
      fac.res.gold = Math.max(0, fac.res.gold - actualTribute);
      G.factions[suzerainFid].res.gold += actualTribute;
      // 粮食：从各城均摊扣除，转给宗主首都所在城
      const vasalCities = Object.values(G.cities).filter(c=>c.fac===fid);
      const totalFood = vasalCities.reduce((s,c)=>s+(c.storage||0), 0);
      const tributeFood = Math.floor(totalFood * _tr.food);
      let remaining = tributeFood;
      vasalCities.forEach(c=>{ if(remaining<=0) return; const cut=Math.min(c.storage||0, remaining); c.storage=Math.max(0,(c.storage||0)-cut); remaining-=cut; });
      // 宗主最大城获得粮食
      const szCities = Object.values(G.cities).filter(c=>c.fac===suzerainFid).sort((a,b)=>b.pop-a.pop);
      if(szCities.length) szCities[0].storage = (szCities[0].storage||0) + tributeFood;
      fac._tributePaid = tributeGold; // 用于UI显示
      // ★ v181 #5: B 方案 — 即使 0 纳贡（军阀宗主），附庸关系仍 +0.2 维系
      addDiplo(fid, suzerainFid, 0.2);
    } else {
      fac._tributePaid = 0;
    }
  });
}






// ═══════════════════════════════════════
// BUILD QUEUE
// ═══════════════════════════════════════
/** ★ I1: 太守建设速度buff — 按建筑类型×太守标签返回额外加速概率 */
function getPrefectBuildBuff(cityId, bldId){
  const city = G.cities[cityId];
  if(!city || !city.prefect) return { bonus: 0, label: '' };
  const pref = city.prefect;
  const tags = GEN_TAGS[pref];
  if(!tags) return { bonus: 0, label: '' };
  const gen = GEN_MAP[pref];
  const bld = BLDS[bldId];
  if(!bld || !gen) return { bonus: 0, label: '' };
  const cat = bld.cat;
  const cityState = CITY_TO_STATE[cityId];
  const isLocalGentry = tags.origin === 'gentry' && cityState
    && tags.state && STATE_TO_GENTRY_FAC[tags.state] === STATE_TO_GENTRY_FAC[cityState];
  const isGentry = tags.origin === 'gentry';
  const isHumble = tags.origin === 'humble';
  // §8.4 W6-pending: FOUNDING_CORE const 收口 → _scenarioMaterialized.foundingCores (W1 已实装, byte-identical Set 形状)
  const isFounding = _scenarioMaterialized.foundingCores[city.fac]?.has(pref);
  const tenure = G.turn - (G.genJoinTurn[pref] || 0);
  const isNewDefector = G.genJoinSource[pref] === 'capture' && tenure < 180;

  // Type buff: pick highest matching
  let typeBuff = 0, typeLabel = '';
  if(isLocalGentry && cat === 'comm'){
    typeBuff = 0.20; typeLabel = '本地士族商业';
  } else if(isGentry && cat === 'comm'){
    typeBuff = 0.15; typeLabel = '士族商业';
  } else if(isHumble && cat === 'mil'){
    typeBuff = 0.15; typeLabel = '寒门军事';
  } else if(gen.pol >= 75 && (cat === 'agri' || cat === 'civ')){
    typeBuff = 0.12; typeLabel = '高政治民生';
  } else if(gen.com >= 75 && cat === 'mil'){
    typeBuff = 0.12; typeLabel = '高统率军事';
  }

  // Universal modifier
  let univBuff = 0, univLabel = '';
  if(isNewDefector){
    univBuff = -0.10; univLabel = '降将';
  } else if(isFounding){
    univBuff = 0.05; univLabel = '元勋';
  }

  const total = typeBuff + univBuff;
  const parts = [];
  if(typeBuff !== 0) parts.push(`${typeLabel}${typeBuff > 0 ? '+' : ''}${(typeBuff*100).toFixed(0)}%`);
  if(univBuff !== 0) parts.push(`${univLabel}${univBuff > 0 ? '+' : ''}${(univBuff*100).toFixed(0)}%`);
  return { bonus: total, label: parts.join(' ') };
}

function processBuildQueues(){
  Object.values(G.cities).forEach(city=>{
    if(city.fac === 'rebel') return; // ★ batch-21 D-026: rebel 城状态冻结
    if(city._lastBuildFac && city._lastBuildFac !== city.fac){
      if(city.buildQueue.length > 0){
        log(`🏚 ${city.name} 易主，在建工程全部废弃`, 'economy');
        city.buildQueue = [];
      }
    }
    city._lastBuildFac = city.fac;

    // 太守通用加速：pol/100×0.5 概率额外-1旬
    const _prefectPolBuild = city.prefect ? (GEN_MAP[city.prefect]?.pol ?? 0) : 0;
    const _prefectBuildDeployed = isPrefectInFieldUnit(city);
    let _baseAccelProb = _prefectPolBuild ? Math.min(0.6, _prefectPolBuild / 100 * 0.5) * (_prefectBuildDeployed ? 0.5 : 1.0) : 0;
    // ★ D1: 光禄勋建设加速buff（叠加）
    const _bsBuff = G.factions[city.fac]?._postBuffs?.buildSpeed || 0;
    _baseAccelProb += _bsBuff;
    // ★ v163: 徭役建设加速
    const _corvee = CORVEE.find(c=>c.id===(G.factions[city.fac]?.corveeId||'low')) || CORVEE[0];
    _baseAccelProb += _corvee.buildBonus;

    city.buildQueue=city.buildQueue.filter(item=>{
      // ★ I1: 太守建筑类型加速buff叠加
      const i1 = getPrefectBuildBuff(city.id, item.id);
      const _buildAccelProb = Math.min(0.85, _baseAccelProb + i1.bonus);
      item.turnsLeft--;
      if(_buildAccelProb > 0 && Math.random() < _buildAccelProb && item.turnsLeft > 0) item.turnsLeft--;
      if(item.turnsLeft<=0){
        city.buildings[item.id]=item.targetLevel;
        log(`🏗 ${city.name} ${BLDS[item.id].name}升至${item.targetLevel}级`,'economy');
        return false;
      }
      return true;
    });
  });
}

// ════════════════════════════════════════════════════════════════════
// ── E5 AI 经济决策 + 调粮 (v181 L5622-L5996) ──
// ════════════════════════════════════════════════════════════════════

function aiDoBuild(fid){
  const fac = G.factions[fid];
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  if(!myCities.length) return;

  const buildBudget = fac._aiBudget?.build || 0;
  if(buildBudget <= 0) return;

  const salaryCost = getFacUnitSalary(fid);
  const avgFoodTurns = myCities.reduce((s,c) => s + (getCityFoodTurns(c) === Infinity ? 99 : getCityFoodTurns(c)), 0) / myCities.length;
  const needFood = avgFoodTurns < 12;
  const needGold = buildBudget < salaryCost * 4;

  ensureCityNeighbors();
  function isFrontline(cityId){
    const neighbors = G._cityNeighbors[cityId] || [];
    return neighbors.some(nid => G.cities[nid] && G.cities[nid].fac !== fid);
  }

  const tm = _aiGetThreatMatrix(fid);
  const maxThreat = tm.highestThreat || 0;

  function scoreBld(city, bldId){
    const bld = BLDS[bldId];
    if(!bld) return -1;
    const curLv = city.buildings[bldId] || 0;
    if(curLv >= 3) return -1;
    if(city.buildQueue.find(q => q.id === bldId)) return -1;
    const _aitags=[...(city.tags||[])]; if(_canBuildTradePost(city.id))_aitags.push('_tradepost'); // ★ v164
    if(bld.restrict.length && !bld.restrict.some(req=>_aitags.includes(req))) return -1;
    const ts = getCityStats(city.tags || []);
    const usedSlots = Object.keys(city.buildings).length;
    if(!city.buildings[bldId] && usedSlots >= ts.slots) return -1;
    const lvDef = bld.levels[curLv];
    const goldCost = lvDef.c.gold || 0;
    // ★ I3: 朝议军防工程buff — 军事建筑成本折扣
    const _aiRoiMilDisc = (bld.cat==='mil') ? (getCourtDecreeBuffs(fid).milBuildCost||0) : 0;
    const adjGoldCostRoi = _aiRoiMilDisc ? Math.max(100, Math.floor(goldCost*(1+_aiRoiMilDisc))) : goldCost;
    if(adjGoldCostRoi > (fac._aiBudget?.build || 0)) return -1;
    if(!Object.entries(lvDef.c).every(([r,amt]) => (fac.res[r]||0) >= amt)) return -1;

    const front = isFrontline(city.id);
    const prod = getCityProd(city);
    const effGoldCost = Math.max(adjGoldCostRoi, 100);

    if(bldId === 'farm'){
      // ★ v124: base加值模型 — 计算增产量=新base vs旧base经过popMult/tags后的差值
      const FARM_FLAT=[0,100,190,270];
      const ts2 = getCityStats(city.tags||[]);
      const pm = (city.pop*(city.popQuality||80)/100)/250000;
      const incr = (FARM_FLAT[curLv+1] - FARM_FLAT[curLv]) * pm * ts2.foodM * 0.50;
      let s = (incr / effGoldCost) * 600;
      if(needFood) s *= 2.0;
      if(front) s *= 0.7;
      return s;
    }
    if(bldId === 'irr'){
      const farmLv = city.buildings.farm || 0;
      if(farmLv === 0) return -1;
      // 水利乘法不变：从当前irrBonus升级到下一级的增量
      const irrMults = [1.0, 1.2, 1.4, 1.6];
      const curIrrM = irrMults[curLv] || 1.0;
      const nxtIrrM = irrMults[curLv+1] || curIrrM;
      const incr = prod.food * (nxtIrrM / curIrrM - 1);
      let s = (incr / effGoldCost) * 600;
      if(needFood) s *= 2.0;
      if(front) s *= 0.7;
      return s;
    }
    if(bldId === 'granary'){
      let s = 15;
      if(needFood) s *= 1.5;
      if(front) return -1;
      return s;
    }
    if(bldId === 'market'){
      // ★ v124: base加值模型 + 市集权重×1.3
      const MKT_FLAT=[0,40,75,105];
      const ts2 = getCityStats(city.tags||[]);
      const pm = (city.pop*(city.popQuality||80)/100)/250000;
      const incr = (MKT_FLAT[curLv+1] - MKT_FLAT[curLv]) * pm * ts2.goldM;
      let s = (incr / effGoldCost) * 600 * 1.3; // ★ v124: 市集权重×1.3
      if(needGold) s *= 1.5;
      if(front) s *= 0.7;
      return s;
    }
    if(bldId === 'harbor'){
      // 港口保持百分比不变
      const incr = prod.gold * [0.40, 0.40, 0.50][curLv];
      let s = (incr / effGoldCost) * 600;
      if(needGold) s *= 1.5;
      if(front) s *= 0.7;
      return s;
    }
    if(bldId === 'tradepost'){
      // ★ v164: 商港/榷场/马市 — 金产百分比加成，评分逻辑同港口
      const tpIncr = prod.gold * [0.15, 0.10, 0.10][curLv]; // 增量递减
      let s = (tpIncr / effGoldCost) * 600 * 1.2; // 略高权重（海外贸易价值）
      if(needGold) s *= 1.5;
      if(front) s *= 0.5;
      return s;
    }
    if(bldId === 'wall'){
      if(!front) return 3; // v111: 非前线城墙从5降到3
      return 25 * (1 + maxThreat / 5); // v111: 前线城墙从50降到25
    }
    if(bldId === 'barracks'){
      if(!front) return 8;
      return 35 * (1 + maxThreat / 8);
    }
    if(bldId === 'stable' || bldId === 'workshop'){
      if(front) return -1;
      return 12;
    }
    if(bldId === 'school' || bldId === 'clinic' || bldId === 'road'){
      if(front) return -1;
      return 10;
    }
    return 5;
  }

  // Global candidate list: all (city, building) pairs scored, pick top N
  const allCandidates = [];
  for(const city of myCities){
    const ts = getCityStats(city.tags || []);
    const qCap = city.pop >= 500000 ? 4 : city.pop >= 250000 ? 3 : city.pop >= 100000 ? 2 : 1; // v107: pop×5, 阈值×5
    if(city.buildQueue.length >= qCap) continue;

    for(const bldId of Object.keys(BLDS)){
      const s = scoreBld(city, bldId);
      if(s > 0) allCandidates.push({ city, bldId, score: s });
    }
  }

  allCandidates.sort((a, b) => b.score - a.score);

  let built = 0;
  const MAX_BUILDS_PER_TURN = 3;
  const builtCities = new Set();

  for(const cand of allCandidates){
    if(built >= MAX_BUILDS_PER_TURN) break;
    if(builtCities.has(cand.city.id)) continue; // each city max 1 per turn
    // Re-check affordability (previous build may have spent resources)
    const bld = BLDS[cand.bldId];
    const curLv = cand.city.buildings[cand.bldId] || 0;
    if(curLv >= 3) continue;
    const lvDef = bld.levels[curLv];
    const goldCost = lvDef.c.gold || 0;
    // ★ I3: 朝议军防工程buff — 军事建筑金钱折扣
    const _aiMilDisc = (bld.cat==='mil') ? (getCourtDecreeBuffs(fid).milBuildCost||0) : 0;
    const adjGoldCost = _aiMilDisc ? Math.max(100, Math.floor(goldCost*(1+_aiMilDisc))) : goldCost;
    if(adjGoldCost > (fac._aiBudget?.build || 0)) continue;
    const adjCosts = {};
    for(const [r,amt] of Object.entries(lvDef.c)){
      adjCosts[r] = (r==='gold' && _aiMilDisc) ? Math.max(100, Math.floor(amt*(1+_aiMilDisc))) : amt;
    }
    if(!Object.entries(adjCosts).every(([r,amt]) => (fac.res[r]||0) >= amt)) continue;

    for(const [r, amt] of Object.entries(adjCosts)){
      safeSub(fac.res, r, amt); // ★ v155fix: 统一用safeSub
    }
    if(fac._aiBudget) fac._aiBudget.build -= adjGoldCost;
    cand.city.buildQueue.push({id:cand.bldId, targetLevel:curLv+1, turnsLeft:lvDef.t, totalTurns:lvDef.t});
    log(`🏗 [AI] ${cand.city.name} 开始建设 ${bld.name}Lv${curLv+1}（${lvDef.t}旬，ROI=${cand.score.toFixed(0)}）`, 'economy');
    built++;
    builtCities.add(cand.city.id);
  }
}

function aiDoTransfer(fid){
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  for(const city of myCities){
    const turns = getCityFoodTurns(city);
    if(turns === Infinity || turns >= 9) continue;
    if(city.transferCD > 0) continue;
    const donor = findBestDonor(city.id);
    if(!donor) continue;
    const amount = Math.floor(getCityFoodCost(city).total * 8);
    if(amount < 200) continue;
    const dist = cityDist(city.id, donor.id);
    const lossRate = dist <= 1 ? 0.05 : dist <= 2 ? 0.12 : 0.20;
    doTransfer(donor.id, city.id, amount, Math.ceil(dist * 1.5), lossRate);
    log(`🚚 [AI] ${donor.name}→${city.name} 调粮${fmt(amount)}石`, 'economy');
  }
}

/**
 * v111: AI自动任命太守+封官
 * 太守：空缺城选pol最高的闲置武将，优先本地籍贯（提升豪族支持）
 * 封官：遍历空位，merit够+属性匹配的自动封
 */
function aiDoAppointments(fid){
  const gens = (G.generals[fid] || []).filter(g => g.role !== 'ruler');

  // ── 太守任命 ──
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const deployedGens = getDeployedGens(fid);
  myCities.forEach(city => {
    if(city.prefect) return; // 已有太守
    // 候选人：闲置（未部署、未任太守、未任官职）
    const candidates = gens.filter(g => {
      if(deployedGens.has(g.name)) return false;
      if(G.genPost && G.genPost[g.name]) return false;
      if(Object.values(G.cities).some(c => c.fac === fid && c.prefect === g.name)) return false;
      return true;
    });
    if(!candidates.length) return;
    // 打分：pol为主，本地籍贯加分（v172: 按士族派系相同判定，而非严格同州）
    const cityState = CITY_TO_STATE[city.id];
    const cityGentryFac = cityState ? STATE_TO_GENTRY_FAC[cityState] : null;
    const scored = candidates.map(g => {
      let s = g.pol;
      const gt = GEN_TAGS[g.name];
      if(gt && gt.state && cityGentryFac && STATE_TO_GENTRY_FAC[gt.state] === cityGentryFac) s += 15; // 本地人加分
      return { gen: g, score: s };
    }).sort((a,b) => b.score - a.score);
    const best = scored[0];
    if(best && best.gen.pol >= 40) { // 最低pol门槛
      city.prefect = best.gen.name;
      log(`📜 [AI-${fid}] ${best.gen.name} 任${city.name}太守`, 'economy');
    }
  });

  // ── 封官 ──
  const tierSlots = getPostSlots(fid);
  const slotCounts = { mil: [...tierSlots.mil], civ: [...tierSlots.civ] }; // [tier3, tier2, tier1]
  // 扣除已任命的
  gens.forEach(g => {
    const pd = getGenPostDef(g.name);
    if(!pd) return;
    const track = pd.track;
    const ti = pd.tier;
    if(track && slotCounts[track]) {
      const idx = ti === 3 ? 0 : ti === 2 ? 1 : 2;
      if(slotCounts[track][idx] > 0) slotCounts[track][idx]--;
    }
  });
  // 对每个有空位的tier，找merit够+属性匹配的候选人封官
  ['mil','civ'].forEach(track => {
    const postDefs = track === 'mil' ? MIL_POSTS : CIV_POSTS;
    [3,2,1].forEach(tierNum => {
      const slotIdx = tierNum === 3 ? 0 : tierNum === 2 ? 1 : 2;
      while(slotCounts[track][slotIdx] > 0) {
        const tierKey = 'tier' + tierNum;
        const availPosts = (postDefs[tierKey] || []).filter(pd =>
          !gens.some(g => G.genPost && G.genPost[g.name] === pd.name)
        );
        if(!availPosts.length) break;
        const postDef = availPosts[0];
        const stat = postDef.buffStat === 'com' ? 'com' : 'pol';
        const cands = gens.filter(g => {
          if(G.genPost && G.genPost[g.name]) return false;
          if(Object.values(G.cities).some(c => c.fac === fid && c.prefect === g.name)) return false;
          if((G.genMerit[g.name]||0) < postDef.merit) return false;
          return true;
        }).sort((a,b) => (b[stat]||60) - (a[stat]||60));
        if(!cands.length) break;
        appointGenPost(cands[0].name, postDef.name, fid);
        slotCounts[track][slotIdx]--;
      }
    });
  });
}

// v172: _getCityRegion 已移除（直接用 CITY_TO_STATE[cityId]）

// ═══════════════════════════════════════
// ★ 调粮系统（新版）
//   触发条件：可撑旬数 < 9
//   富余城：净消耗缺口≤0 且 storage > 月均消耗×6
//   告急：右下角小卡片（非全屏弹窗）
// ═══════════════════════════════════════
function processTransfers(){
  G.transfers=G.transfers.filter(t=>{
    t.turnsLeft--;
    if(t.turnsLeft<=0){
      const dest=G.cities[t.to];
      // ★ v155fix P1: 调粮到达时检查城市归属，城已易手则粮食丢失
      const _tFac = t.fac || G.cities[t.from]?.fac; // 旧存档兼容
      if(dest && dest.fac !== 'rebel' && _tFac !== 'rebel' && dest.fac === _tFac){ // ★ batch-21 D-026: rebel 城状态冻结(到达时 dest 已大乱则散失)
        dest.storage+=t.amount;
        log(`🚚 调粮抵达：${t.fromName}→${t.toName} +${fmt(t.amount)}石`,'transfer');
      } else {
        log(`🚚 调粮失败：${t.toName}已非己方领地，${fmt(t.amount)}石粮草散失`,'transfer');
      }
      return false;
    }
    return true;
  });
  Object.values(G.cities).forEach(c=>{if(c.transferCD>0)c.transferCD--;});
}

function checkResupply(){
  if(!G.resupplyOn) return;
  // 执行已建立的长期补给线（静默）
  Object.entries(G.supplyLines||{}).forEach(([toId,sl])=>{
    const to=G.cities[toId],from=G.cities[sl.fromId];
    if(!to||!from||to.fac!==from.fac||to.fac==='rebel'||from.transferCD>0) return; // ★ batch-21 D-026: rebel 城状态冻结(残留 supply line 不在 rebel 期间触发)
    if(getCityFoodTurns(to)<18){
      const fromSurplus=from.storage>getCityFoodCost(from).total*6;
      if(fromSurplus){
        const amount=Math.floor(getCityFoodCost(to).total*8);
        if(amount>200){
          const dist=cityDist(toId,sl.fromId);
          const lossRate=dist<=1?.05:dist<=2?.12:.20;
          doTransfer(sl.fromId,toId,amount,Math.ceil(dist*1.5),lossRate,true);
        }
      }
    }
  });
  // 短期告急卡片（无补给线且可撑<9旬）
  Object.values(G.cities).filter(c=>c.fac===G.playerFac&&c.transferCD===0).forEach(city=>{
    const turns=getCityFoodTurns(city);
    const hasLine=!!(G.supplyLines||{})[city.id];
    if(turns<9&&!hasLine){
      const ex=G.foodAlertCards.find(a=>a.cityId===city.id);
      const donor=findBestDonor(city.id);
      if(!ex) G.foodAlertCards.push({cityId:city.id,cityName:city.name,turns,donor});
      else { ex.turns=turns; ex.donor=donor; }
    } else if(turns>=18||hasLine){
      G.foodAlertCards=G.foodAlertCards.filter(a=>a.cityId!==city.id);
    }
  });
  renderFoodAlerts();
}

// v0.5: 全图寻优（不限邻居）
function findBestDonor(targetId){
  const target=G.cities[targetId]; if(!target) return null;
  let best=null,bestScore=0;
  Object.values(G.cities).forEach(c=>{
    if(c.id===targetId||c.fac!==target.fac||c.transferCD>0) return;
    const net=getCityFoodNet(c);
    const monthCost=getCityFoodCost(c).total*6;
    if(net<0||c.storage<=monthCost) return;
    const dist=cityDist(targetId,c.id);
    const score=(c.storage/Math.max(1,monthCost))/Math.pow(dist,1.5);
    if(score>bestScore){ bestScore=score; best=c; }
  });
  return best;
}
function cityDist(a,b){
  const q=[[a,0]],vis=new Set([a]);
  while(q.length){
    const [cur,d]=q.shift();
    if(cur===b) return d;
    ROADS.filter(r=>r.includes(cur)).forEach(r=>{
      const n=r.find(x=>x!==cur);
      if(!vis.has(n)){vis.add(n);q.push([n,d+1]);}
    });
  }
  return 3;
}

function doTransfer(fromId,toId,amount,turns,lossRate,silent){
  const from=G.cities[fromId],to=G.cities[toId];
  // SKILL_INLINE: muniu — 诸葛亮木牛：调粮损耗折半+速度-1旬
  const fromFid = from?.fac;
  const zglActive = fromFid && hasFacGen(fromFid, '诸葛亮') && genHasOffice('诸葛亮', fromFid);
  const effectiveLossRate_base = (zglActive || hasTechEffect(fromFid, 'transferLossHalf')) ? lossRate * 0.5 : lossRate; // ★ v115: 漕运改良
  // SKILL_INLINE: wuqi_loss — 李严误期：当官时调粮损耗×1.20
  const _liyanLoss = fromFid && hasFacGen(fromFid,'李严') && genHasOffice('李严',fromFid) ? 1.20 : 1.0;
  const effectiveLossRate = Math.min(0.95, effectiveLossRate_base * _liyanLoss);
  const effectiveTurns    = zglActive ? Math.max(1, turns - 1) : turns;
  const net=Math.floor(amount*(1-effectiveLossRate));
  // ★ 从源城存粮中扣除
  from.storage=Math.max(0,from.storage-amount);
  G.transfers.push({from:fromId,to:toId,fromName:from.name,toName:to.name,amount:net,turnsLeft:effectiveTurns,totalTurns:effectiveTurns,fac:from.fac}); // ★ v155fix: +fac用于到达时归属校验
  from.transferCD=6;
  if(!silent){
    log(`🚚 ${from.name}→${to.name} 调粮${fmt(amount)}石，${effectiveTurns}旬后到达`,'transfer');
    renderAllLight();
  }
}

// ════════════════════════════════════════════════════════════════════
// ── E7.a aiDoTradeAgreement (v181 L9663-L9690) ──
// ════════════════════════════════════════════════════════════════════

function aiDoTradeAgreement(fid){
  if(getSuzerain(fid)) return; // 附庸不缔结
  if(getTradeAgreements(fid).length >= TRADE_AGR_MAX) return; // 已满
  const fac = G.factions[fid];
  if(!fac || fac.res.gold < TRADE_AGR_COST * 2) return; // 留余量
  const others = getScenarioFactions().filter(f => f !== fid && !getSuzerain(f));
  // 按对方城市数排序（优先大势力=更多通商收入）
  const candidates = others.map(other => {
    const dk = fid < other ? `${fid}-${other}` : `${other}-${fid}`;
    const d = G.diplo[dk];
    if(!d || d.status === 'enemy') return null;
    if(d.rel < 55) return null; // AI要求略高于玩家(50)，保守一些
    if(hasTradeAgreement(fid, other)) return null;
    if(getTradeAgreements(other).length >= TRADE_AGR_MAX) return null;
    const otherCities = Object.values(G.cities).filter(c => c.fac === other).length;
    return { fid: other, cities: otherCities, rel: d.rel };
  }).filter(Boolean).sort((a, b) => b.cities - a.cities);
  if(!candidates.length) return;
  // 取最优候选，30%概率执行（避免AI开局齐刷刷签约）
  if(Math.random() > 0.30) return;
  const best = candidates[0];
  fac.res.gold -= TRADE_AGR_COST;
  if(!G._tradeAgreements) G._tradeAgreements = [];
  G._tradeAgreements.push({ factions: [fid, best.fid], since: G.turn });
  const dk2 = fid < best.fid ? `${fid}-${best.fid}` : `${best.fid}-${fid}`;
  addDiplo(fid, best.fid, 5);
  log(`🤝 ${getFactionDef(fid)?.name}与${getFactionDef(best.fid)?.name}缔结通商协定`, 'diplo');
}

// ════════════════════════════════════════════════════════════════════
// ── E7.b _getTradeOffers + _findTradeCity + diploTrade (v181 L9746-L9801) ──
// ════════════════════════════════════════════════════════════════════

function _getTradeOffers(sellerFid){
  const offers = [];
  const cities = Object.values(G.cities).filter(c=>c.fac===sellerFid);
  const tags = new Set();
  cities.forEach(c=>{ const def=CITY_MAP[c.id]; if(def) def.tags.forEach(t=>tags.add(t)); });
  if(tags.has('产马'))  offers.push({res:'horses',label:'马匹',icon:'🐴',cost:800,qty:500,cityTag:'产马'});
  if(tags.has('产铁'))  offers.push({res:'iron',  label:'铁矿',icon:'🔩',cost:600,qty:400,cityTag:'产铁'});
  if(tags.has('产木'))  offers.push({res:'wood',  label:'木材',icon:'🪵',cost:500,qty:350,cityTag:'产木'});
  return offers;
}

/** 找到卖方拥有某tag的第一座城市（用于互市揭雾） */
function _findTradeCity(sellerFid, cityTag){
  return CITIES_DEF.find(def => G.cities[def.id]?.fac===sellerFid && def.tags.includes(cityTag));
}

/** 互市：玩家从target势力购买资源 */
function diploTrade(target, resKey){
  const fid = G.playerFac;
  if(_diploActed(target)){ log('⚠ 本旬已行动，不可再次外交','diplo'); return; }
  const d = G.diplo[`${fid}-${target}`];
  if(!d || d.status==='enemy'){ log('⚠ 不可与敌对势力互市','diplo'); return; }
  if(d.rel < 30){ log('⚠ 友好度不足30，无法互市','diplo'); return; }
  // 每季度互市次数限制
  if(!G._tradeCD) G._tradeCD = {};
  const cdKey = `${fid}_${target}`;
  if((G._tradeCD[cdKey]||0) > G.turn){ log('⚠ 与该势力本季互市次数已满','diplo'); return; }

  const offers = _getTradeOffers(target);
  const offer = offers.find(o=>o.res===resKey);
  if(!offer){ log('⚠ 对方无此资源可售','diplo'); return; }

  const fac = G.factions[fid];
  if(!fac || fac.res.gold < offer.cost){ log(`⚠ 金币不足（需${offer.cost}）`,'diplo'); return; }

  // 交易执行
  safeSub(fac.res, 'gold', offer.cost);
  fac.res[offer.res] = (fac.res[offer.res]||0) + offer.qty;
  addDiplo(fid, target, 2); // 互市增进微量好感
  _diploMarkActed(target);
  G._tradeCD[cdKey] = G.turn + 9; // 9旬CD（一季度）

  // 揭雾副产出：揭开卖方资源城（持续2旬可见）
  const tradeCity = _findTradeCity(target, offer.cityTag);
  if(tradeCity){
    if(!G.scoutReveals) G.scoutReveals = [];
    if(!G.scoutReveals.some(sr=>sr.fid===fid&&sr.cityId===tradeCity.id&&sr.expiresAt>G.turn)){
      G.scoutReveals.push({fid, cityId:tradeCity.id, expiresAt:G.turn+3});
    }
    _applyScoutReveal(fid, tradeCity.id);
    log(`🏪 互市成功！以${offer.cost}金购入${offer.label}${offer.qty}，商队途经${tradeCity.name}，获取该地情报（2旬）`,'diplo');
  } else {
    log(`🏪 互市成功！以${offer.cost}金购入${offer.label}${offer.qty}`,'diplo');
  }
  renderRight();
}

// ════════════════════════════════════════════════════════════════════
// ── E7.c TRADE_POST_NAME const + 7 trade post funcs (v181 L9810-L9962) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════
// ★ v164: 海外贸易建筑（商港/榷场）
// ═══════════════════════════════════════

// 城市tag→可建贸易建筑名称映射
const TRADE_POST_NAME = {
  '港口': {name:'商港', icon:'🚢', desc:'开放海外贸易，金产'},
  '产木': {name:'榷场', icon:'🏬', desc:'开设边境互市，金产'}, // 建宁等内陆
  '产马': {name:'马市', icon:'🐎', desc:'开放马匹贸易，金产'},
};

/** 判断城市是否可建贸易建筑 */
function _canBuildTradePost(cityId){
  const def = CITY_MAP[cityId];
  if(!def) return null;
  // 优先级：港口 > 产木(内陆) > 产马
  for(const tag of ['港口','产木','产马']){
    if(def.tags.includes(tag)) return TRADE_POST_NAME[tag];
  }
  return null;
}

// ═══════════════════════════════════════
// ★ v165: 通商协定系统（Trade Agreement）
// 非敌对且rel≥50的势力可缔结通商，双方每旬获得对方城市数×5金收入
// ═══════════════════════════════════════

const TRADE_AGR_COST = 500;        // 签约金
const TRADE_AGR_REL_MIN = 50;      // 缔结最低好感
const TRADE_AGR_REL_BREAK = 20;    // 自动中断阈值
const TRADE_AGR_PER_CITY = 5;      // 每城每旬金币
const TRADE_AGR_ALLY_MULT = 1.2;   // 同盟加成
const TRADE_AGR_MAX = 2;           // 每势力最多同时维持数

/** 查询fid当前生效的通商协定列表 */
function getTradeAgreements(fid){
  if(!G._tradeAgreements) G._tradeAgreements = [];
  return G._tradeAgreements.filter(a => a.factions.includes(fid));
}

/** 查询fid与target之间是否有通商协定 */
function hasTradeAgreement(fid, target){
  return getTradeAgreements(fid).some(a => a.factions.includes(target));
}

/** 计算fid从通商协定中每旬获得的金币（含同盟加成） */
function calcTradeAgrIncome(fid){
  const agrs = getTradeAgreements(fid);
  if(!agrs.length) return 0;
  // ★ 己方最高tradepost等级 → 通商收入加成
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  let maxTpLv = 0;
  myCities.forEach(c => { const lv = (c.buildings||{}).tradepost||0; if(lv > maxTpLv) maxTpLv = lv; });
  // ★ v179fix P30: 索引越界保护 — 若 tradepost 等级表扩展，cap 到当前最高加成
  const _tradeMultTbl = [0, 0.10, 0.15, 0.20];
  const tpMult = 1 + _tradeMultTbl[Math.min(maxTpLv, _tradeMultTbl.length-1)]; // Lv1/2/3 → +10%/15%/20%
  let total = 0;
  agrs.forEach(a => {
    const other = a.factions[0] === fid ? a.factions[1] : a.factions[0];
    const otherCities = Object.values(G.cities).filter(c => c.fac === other).length;
    if(otherCities === 0) return; // 灭国
    const dk = fid < other ? `${fid}-${other}` : `${other}-${fid}`;
    const d = G.diplo[dk];
    if(!d || d.status === 'enemy') return; // 战争中不结算
    const allyMult = d.status === 'ally' ? TRADE_AGR_ALLY_MULT : 1.0;
    total += Math.floor(otherCities * TRADE_AGR_PER_CITY * allyMult * tpMult);
  });
  return total;
}

/** 通商协定结算前清理：移除失效协定（敌对/rel<20/灭国） */
function _cleanTradeAgreements(){
  if(!G._tradeAgreements) return;
  G._tradeAgreements = G._tradeAgreements.filter(a => {
    const [fa, fb] = a.factions;
    // 灭国检查
    const citiesA = Object.values(G.cities).filter(c => c.fac === fa).length;
    const citiesB = Object.values(G.cities).filter(c => c.fac === fb).length;
    if(citiesA === 0 || citiesB === 0){
      log(`📦 ${getFactionDef(fa)?.name}与${getFactionDef(fb)?.name}通商协定因势力覆灭而终止`, 'diplo');
      return false;
    }
    // 外交状态检查
    const dk = fa < fb ? `${fa}-${fb}` : `${fb}-${fa}`;
    const d = G.diplo[dk];
    if(!d || d.status === 'enemy'){
      log(`📦 ${getFactionDef(fa)?.name}与${getFactionDef(fb)?.name}通商协定因战争而中断`, 'diplo');
      return false;
    }
    if(d.rel < TRADE_AGR_REL_BREAK){
      log(`📦 ${getFactionDef(fa)?.name}与${getFactionDef(fb)?.name}通商协定因关系恶化（好感${Math.floor(d.rel)}）而终止`, 'diplo');
      return false;
    }
    return true;
  });
}

/** 玩家缔结通商协定 */
function diploTradeAgreement(target){
  const fid = G.playerFac;
  const dk = fid < target ? `${fid}-${target}` : `${target}-${fid}`;
  const d = G.diplo[dk];
  if(!d || d.status === 'enemy'){
    log('⚠ 不可与敌对势力缔结通商', 'diplo'); return;
  }
  if(d.rel < TRADE_AGR_REL_MIN){
    log(`⚠ 友好度不足${TRADE_AGR_REL_MIN}，无法缔结通商`, 'diplo'); return;
  }
  if(getSuzerain(fid)){
    log('⚠ 附庸不可独立缔结通商协定', 'diplo'); return;
  }
  if(getSuzerain(target)){
    log('⚠ 不可与附庸势力缔结通商协定', 'diplo'); return;
  }
  if(hasTradeAgreement(fid, target)){
    log('⚠ 已与该势力签有通商协定', 'diplo'); return;
  }
  if(getTradeAgreements(fid).length >= TRADE_AGR_MAX){
    log(`⚠ 通商协定已达上限（${TRADE_AGR_MAX}个）`, 'diplo'); return;
  }
  if(getTradeAgreements(target).length >= TRADE_AGR_MAX){
    log(`⚠ 对方通商协定已达上限`, 'diplo'); return;
  }
  const fac = G.factions[fid];
  if(!fac || fac.res.gold < TRADE_AGR_COST){
    log(`⚠ 金钱不足（需${TRADE_AGR_COST}金）`, 'diplo'); return;
  }
  // 扣金签约
  fac.res.gold -= TRADE_AGR_COST;
  if(!G._tradeAgreements) G._tradeAgreements = [];
  G._tradeAgreements.push({ factions: [fid, target], since: G.turn });
  addDiplo(fid, target, 5); // 缔结通商增进好感
  const myIncome = calcTradeAgrIncome(fid);
  const otherCities = Object.values(G.cities).filter(c => c.fac === target).length;
  const thisCities = Object.values(G.cities).filter(c => c.fac === fid).length;
  log(`🤝 与${getFactionDef(target)?.name}缔结通商协定！花费${TRADE_AGR_COST}金，预计每旬互利：我方+${Math.floor(otherCities * TRADE_AGR_PER_CITY)}金，对方+${Math.floor(thisCities * TRADE_AGR_PER_CITY)}金`, 'diplo');
  invalidateLeftCache(); renderAllLight(); // ★ v167fix #36
}

/** 玩家主动中止通商协定 */
function cancelTradeAgreement(target){
  const fid = G.playerFac;
  if(!G._tradeAgreements) return;
  const idx = G._tradeAgreements.findIndex(a => a.factions.includes(fid) && a.factions.includes(target));
  if(idx === -1){ log('⚠ 未找到与该势力的通商协定', 'diplo'); return; }
  G._tradeAgreements.splice(idx, 1);
  addDiplo(fid, target, -8);
  // 信誉惩罚（复用现有信誉度系统）
  if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
  G.reputation[fid] = Math.max(0, (G.reputation[fid]||REPUTATION_DEFAULT) - 3);
  log(`❌ 中止与${getFactionDef(target)?.name}的通商协定（好感-8，信誉-3）`, 'diplo');
  invalidateLeftCache(); renderAllLight(); // ★ v167fix #36
}

// ════════════════════════════════════════════════════════════════════
// ── E6 玩家入口 (v181 L10042-L10118) ──
// ════════════════════════════════════════════════════════════════════

function buildBld(cityId,bldId){
  const city=G.cities[cityId];
  const fac=G.factions[city.fac];
  const bld=BLDS[bldId];
  const curLv=city.buildings[bldId]||0;
  if(curLv>=3){showNotif('已达最高等级','warn');return;}
  if(city.buildQueue.find(q=>q.id===bldId)){showNotif('已在建设队列中','warn');return;}
  if(bld.restrict.length){
    const _effTags = [...(city.tags||[])];
    if(_canBuildTradePost(city.id)) _effTags.push('_tradepost'); // ★ v164: 商港/榷场/马市虚拟tag
    const ok=bld.restrict.some(req=>_effTags.includes(req));
    if(!ok){showNotif(`该城不具备建设${bld.name}的条件`,'warn');return;}
  }
  const qCap=city.pop>=500000?4:city.pop>=250000?3:city.pop>=100000?2:1;
  if(city.buildQueue.length>=qCap){showNotif(`建设队列已满（上限${qCap}）`,'warn');return;}
  const ts=getCityStats(city.tags||[]);
  const usedSlots=Object.keys(city.buildings).length;
  if(!(city.buildings[bldId])&&usedSlots>=ts.slots){showNotif(`建筑槽位已满（${ts.slots}/${ts.slots}）`,'warn');return;}
  const lvDef=bld.levels[curLv];
  // ★ I3: 朝议军防工程buff — 军事建筑(wall/barracks)金钱折扣
  const _milBldDiscount = (bld.cat==='mil') ? (getCourtDecreeBuffs(city.fac).milBuildCost||0) : 0;
  const adjCosts = {};
  for(const [res,amt] of Object.entries(lvDef.c)){
    adjCosts[res] = (res==='gold' && _milBldDiscount) ? Math.max(100, Math.floor(amt*(1+_milBldDiscount))) : amt;
  }
  for(const [res,amt] of Object.entries(adjCosts)){
    if((fac.res[res]||0)<amt){showNotif(`资源不足：${res}需要${amt}`,'warn');return;}
  }
  for(const [res,amt] of Object.entries(adjCosts)) fac.res[res]-=amt;
  city.buildQueue.push({id:bldId,targetLevel:curLv+1,turnsLeft:lvDef.t,totalTurns:lvDef.t});
  const _logBldName = (bldId==='tradepost' && _canBuildTradePost(cityId)) ? _canBuildTradePost(cityId).name : bld.name;
  log(`🏗 ${city.name}开始建设${_logBldName}Lv${curLv+1}（${lvDef.t}旬）`,'economy');
  renderAllLight();
}


function setTax(id){
  G.factions[G.playerFac].taxId=id;
  renderLeft();
  log(`📋 ${getFactionDef(G.playerFac)?.name}赋税调整为「${TAX.find(t=>t.id===id).name}」`,'economy');
}

function setPolicy(id){
  G.factions[G.playerFac].policyId=id;
  document.getElementById('polRow').innerHTML=POLICY.map(p=>`<button class="pl-b${G.factions[G.playerFac].policyId===p.id?' active':''}" onclick="setPolicy('${p.id}')">${p.name}</button>`).join('');
  const pol=POLICY.find(p=>p.id===id);
  if(!pol) return; // ★ v149fix: 防御性检查
  log(`⚔ 补员政策→「${pol.name}」（后方精兵${pol.rear*100}% / 就地新兵${pol.front*100}%）`,'economy');
}

function toggleResupply(){
  G.resupplyOn=!G.resupplyOn;
  document.getElementById('resTog').classList.toggle('on',G.resupplyOn);
  log(`🚚 自动调粮${G.resupplyOn?'已开启':'已关闭'}`,'economy');
}

// ★ v163: 徭役档位切换
function setCorvee(id){
  G.factions[G.playerFac].corveeId=id;
  document.getElementById('corveeRow').innerHTML=CORVEE.map(c=>`<button class="pl-b${G.factions[G.playerFac].corveeId===c.id?' active':''}" onclick="setCorvee('${c.id}')">${c.name}</button>`).join('');
  const cv=CORVEE.find(c=>c.id===id);
  if(!cv) return;
  if(cv.id==='low') log(`📋 徭役→「${cv.name}」（不征发徭役）`,'economy');
  else log(`📋 徭役→「${cv.name}」（建设加速+${Math.round(cv.buildBonus*100)}%，有在建城市民心${cv.moralePen}/旬·质量${cv.qualPen}/旬）`,'economy');
}

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
// v0.5: 全局部队状态

function cancelSupplyLine(cityId){
  delete G.supplyLines[cityId];
  const city=G.cities[cityId];
  log(`📦 取消补给线→${city?.name||cityId}`,'economy');
  renderLeft();
}

// ════════════════════════════════════════════════════════════════════
// ── E8 物资 helpers (v181 L13006-L13030) ──
// ════════════════════════════════════════════════════════════════════

function calcSlotMatCost(type, troops){
  if(!type||!troops) return {};
  const td=TROOP_TYPES[type];
  const rc=td?.recruit||{};
  const _cm=td?.costMult||1.0;
  const out={};
  for(const[r,b] of Object.entries(rc)){
    const mult = r === 'horses' ? 1.0 : _cm; // v116: 马不涨
    out[r]=Math.floor(b*mult*troops/5000);
  }
  return out;
}
/** ★ v118: 合并多个材料费对象 */
function mergeMatCosts(...cs){const o={};for(const c of cs)for(const[k,v]of Object.entries(c))o[k]=(o[k]||0)+v;return o;}
/** ★ v118: 检查势力是否负担得起材料费 */
function canAffordMat(fid, matCost){
  const res=G.factions[fid]?.res; if(!res) return false;
  for(const[r,v] of Object.entries(matCost)){ if((res[r]||0)<v) return false; }
  return true;
}
/** ★ v118: 扣除材料费 ★ v154fix: 改用safeSub防负 */
function deductMat(fid, matCost){
  const res=G.factions[fid]?.res; if(!res) return;
  for(const[r,v] of Object.entries(matCost)) safeSub(res, r, v);
}

// ════════════════════════════════════════════════════════════════════
// ── E9 AI _exec 入口 (sprint batch-28 _exec 归位架构债) ──
//    建设/赋税/徭役/调粮/补给开关 — v181 L13383-L13455 verbatim
// ════════════════════════════════════════════════════════════════════

function _execBuild(fid, act) {
  const cityId = _resolveCityId(act.city);
  const city = G.cities[cityId];
  if (!city || city.fac !== fid) { console.warn('[ClaudeAI] build: 城市无效或非己方', act.city); return false; }
  const bldId = act.building;
  const bld = BLDS[bldId];
  if (!bld) { console.warn('[ClaudeAI] build: 建筑ID无效', bldId); return false; }
  const curLv = (city.buildings || {})[bldId] || 0;
  if (curLv >= 3) { console.warn('[ClaudeAI] build: 已满级', cityId, bldId); return false; }
  if ((city.buildQueue || []).find(q => q.id === bldId)) { console.warn('[ClaudeAI] build: 已在队列中', cityId, bldId); return false; }
  if (bld.restrict?.length && !bld.restrict.some(req => (city.tags || []).includes(req))) { console.warn('[ClaudeAI] build: 城市类型不符', cityId, bldId, 'need:', bld.restrict, 'has:', city.tags); return false; }
  const qCap = city.pop >= 500000 ? 4 : city.pop >= 250000 ? 3 : city.pop >= 100000 ? 2 : 1;
  if ((city.buildQueue || []).length >= qCap) { console.warn('[ClaudeAI] build: 队列满', cityId, `${(city.buildQueue||[]).length}/${qCap}`); return false; }
  const ts = getCityStats(city.tags || []);
  const usedSlots = Object.keys(city.buildings || {}).length;
  if (!city.buildings?.[bldId] && usedSlots >= ts.slots) { console.warn('[ClaudeAI] build: 槽位满', cityId, `${usedSlots}/${ts.slots}`); return false; }
  const lvDef = bld.levels?.[curLv];
  if (!lvDef) { console.warn('[ClaudeAI] build: 等级定义不存在', bldId, 'lv', curLv); return false; }
  const fac = G.factions[fid];
  const _milBldDiscount = (bld.cat === 'mil') ? (getCourtDecreeBuffs(fid).milBuildCost || 0) : 0;
  for (const [res, amt] of Object.entries(lvDef.c)) {
    const adj = (res === 'gold' && _milBldDiscount) ? Math.max(100, Math.floor(amt * (1 + _milBldDiscount))) : amt;
    if ((fac.res[res] || 0) < adj) { console.warn('[ClaudeAI] build: 资源不足', cityId, bldId, res, `${Math.round(fac.res[res]||0)}<${adj}`); return false; }
  }
  for (const [res, amt] of Object.entries(lvDef.c)) {
    const adj = (res === 'gold' && _milBldDiscount) ? Math.max(100, Math.floor(amt * (1 + _milBldDiscount))) : amt;
    fac.res[res] -= adj;
  }
  city.buildQueue.push({ id: bldId, targetLevel: curLv + 1, turnsLeft: lvDef.t, totalTurns: lvDef.t });
  log(`🏗 [AI] ${city.name}开始建设${bld.name}Lv${curLv + 1}（${lvDef.t}旬）`, 'economy');
  return true;
}

function _execSetTax(fid, act) {
  const taxId = act.level;
  if (!TAX.find(t => t.id === taxId)) { console.warn('[ClaudeAI] set_tax: 无效税率ID', taxId, '| 合法值:', TAX.map(t=>t.id).join('/')); return false; }
  G.factions[fid].taxId = taxId;
  log(`📋 [AI] ${getFactionDef(fid)?.name}赋税调整为「${TAX.find(t => t.id === taxId).name}」`, 'economy');
  return true;
}

// D-076 fix: 补 _execSetCorvee (Claude AI 缺此 _exec 导致 AI 永远徭役=low)
function _execSetCorvee(fid, act) {
  const corveeId = act.level;
  if (!CORVEE.find(c => c.id === corveeId)) { console.warn('[ClaudeAI] set_corvee: 无效徭役ID', corveeId, '| 合法值:', CORVEE.map(c=>c.id).join('/')); return false; }
  G.factions[fid].corveeId = corveeId;
  log(`📋 [AI] ${getFactionDef(fid)?.name}徭役调整为「${CORVEE.find(c => c.id === corveeId).name}」`, 'economy');
  return true;
}

function _execTransferFood(fid, act) {
  const fromId = _resolveCityId(act.from);
  const toId = _resolveCityId(act.to);
  const from = G.cities[fromId], to = G.cities[toId];
  if (!from || !to || from.fac !== fid || to.fac !== fid) return false;
  // ★ v159fix: prompt不含amount字段，智能默认——调出源城一半存粮（上限10000，下限500）
  const maxTransfer = Math.floor((from.storage || 0) * 0.5);
  const amount = Math.min(act.amount || maxTransfer, from.storage || 0, 10000);
  if (amount < 500) return false; // 太少不值得调
  from.storage -= amount;
  to.storage = (to.storage || 0) + amount;
  log(`🚚 [AI] ${from.name}→${to.name} 调粮${fmt(amount)}`, 'economy');
  return true;
}

function _execToggleResupply(fid, act) {
  // AI势力的resupply开关（各势力独立）
  if (!G._facResupply) G._facResupply = {};
  G._facResupply[fid] = !G._facResupply[fid];
  return true;
}
