// src/chains/gentry.js
//
// 豪族链(E8)— 县级豪族支持度 + 家族忠诚 + 攻城后处置。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.6 / 阶段 3,chain 模板第二应用)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// ── 抽离范围(6 段)──
//   G1 county helpers                          v181 L4025-L4035  _countyClanList / isMagnateCounty
//   G2 gentry level + 4 mults                  v181 L4122-L4187  GENTRY_LEVELS const +
//                                                                getGentryLevel / _getCountyGentryLevel
//                                                                / getGentryGoldMult / getGentryRecruitMult
//                                                                / getGentryMoraleMod / getGentryDefMult
//   G3 gentry-side corruption helper           v181 L4195-L4205  CORRUPT_GENTRY_MAP const + _getCorruptGentryMod
//   G4 main gentry block(I2 section header + 9 函数) v181 L11967-L12377
//                                              initCityGentry / _isFacHomeRegion / _clanHasMemberInFac
//                                              / _clanHasOfficeInFac / _aggregateGentry
//                                              / applyGentryOnCapture / applyFamilyLoyaltyShock
//                                              / processGentry / _triggerGentryBetray
//   G5 攻城后处置 mechanism                     v181 L12382-L12417  _applySiegeAftermath
//   G6 攻城后处置 callback                       v181 L12441-L12452  _onSiegeAftermath
//
// ── 留 v181 ──
//   `showSiegeAftermathChoice`(L12420-L12440)— modal HTML 构造,phase 2 原则
//   v181 内 `calcCityCorruption`(经济 chain,留 v181 等 3.9)— 腐败率 effective 计算
//      含 CORRUPT_PER_CITY / CORRUPT_FREE_CITIES / CORRUPT_CAP 3 个经济侧 const
//   `calcGentryRecruitBonus`(L7020,武将链 招募 helper,留 v181 等 3.12)
//      — 函数名含 gentry 但读 gen.metadata.gentry(地域名),非 city.gentry,归武将链
//   `getGenHomeCounty / getGenHomeCity / isGenHomeInFac / getGenLocalBonus`
//      (L4037-L4077,武将 home info,留 v181 等 3.12)
//   `_CLAN_MAP` IIFE 注入块(L4086-L4120)— GEN_TAGS 数据装配,留 v181
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G.cities[id].gentry`(城市豪族支持度,聚合值)
//   - `G.cities[id].counties[].loyalty`(县级豪族忠诚,gentry 的细粒度子结构)
//   - `G.cities[id].counties[].popShare / _initPop / magnate / clanFamily / type / name`
//     (县级元数据,initCityGentry / processGentry 维护)
//   - `G.cities[id].pop`(processGentry 内"隐匿户口"机制,豪族不满时人口流失)
//   - `G.cities[id].fac / occupied / siegeDecay / garrison / billetPool / prefect / morale`
//     (`_triggerGentryBetray` 写——开城投降时整体易手副作用)
//   - `G.cities[id].counties[].loyalty`(applyFamilyLoyaltyShock 写)
//
// **G5/G6 攻城后处置**(_applySiegeAftermath / _onSiegeAftermath)写口跨多链,语义归 gentry
// (豪族对屠城/安民的反应是该函数的核心):
//   - `G.factions[atkFac].res.gold`(战利品)
//   - `G.cities[cityId].morale / pop / gentry`
//   - `G.reputation[atkFac]`
//   - 委托 `applyEthosShock`(已抽 chains/ethos.js)写 ethos
//   - 委托 `addGenChronicle`(留 v181 等 3.12)
// 该跨链写在 3.11 抽军事时再次确认归属(同 3.5 ethos 的跨文件 `_ethosDistance` carry-over 模式)。
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/ + src/render/ + chains/ethos.js
// 模块共享 hoisted function 全局可见,无 import/export)。
//
// `GENTRY_LEVELS / CORRUPT_GENTRY_MAP` 是 top-level **const**(已 phase 3.4 验证 const
// 跨 classic <script> 共享)。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(callers):
//   - 经济链(留 v181 等 3.9):
//       L4230 calcCityCorruption 调 _getCorruptGentryMod
//       L5447 _applyCourtDecisions(政治朝议)调 _aggregateGentry
//       L5711 getCityProd 调 getGentryGoldMult
//       L5857 / L5864 executeMigration 调 _aggregateGentry
//       L6095-L6096 _aiConsiderMigration 调 _aggregateGentry
//   - 武将链(留 v181 等 3.12):
//       L7257 / L10390 poach / surrender 路径调 applyFamilyLoyaltyShock
//       L16926 killGen 调 applyFamilyLoyaltyShock
//   - 军事链(留 v181 等 3.11):
//       L9447 / L9562 / L9783 各征兵路径调 getGentryRecruitMult
//       L16040 / L16051 城防计算调 getGentryDefMult
//       L21657 守城 garMorale 调 getGentryMoraleMod
//       L21785 城市易手调 applyGentryOnCapture
//       L21816 AI 攻城后调 _applySiegeAftermath
//       L24701 玩家攻城后调 showSiegeAftermathChoice(留 v181 modal)→ _onSiegeAftermath
//       L24874 / L25208 / L27223 / L27323 / L27476 / L27599 多 unit modal 调 getGentryRecruitMult
//   - core / save:
//       L27958 loadFromSlot 调 initCityGentry
//       L27997 loadFromSlot 调 _aggregateGentry
//   - render(留 v181):
//       src/render/tooltips.js: getGentryLevel / getGentryGoldMult / _getCorruptGentryMod
//                               / _countyClanList / isMagnateCounty
//       src/render/ui_panels.js: getGentryLevel / getGentryDefMult
//   - core(已抽):
//       src/core/main.js L352: initCityGentry(initGame 调用)
//       src/core/tick.js L512: processGentry(每旬调用)
//       src/core/tick.js L601: _applySiegeAftermath(快进时自动安民)
//
// 本 chain 调外部链(callees):
//   - `getGenPostDef`(武将链 post helper,留 v181 等 3.12)— _clanHasOfficeInFac 调
//   - `getGenLocalBonus / getGenHomeCounty / getGenHomeCity / isGenHomeInFac`
//     (武将 home info,留 v181)— processGentry 调
//   - `getStage`(政治链 stage,留 v181 等 3.7)— processGentry 调
//   - `applySkills / getTechEffect / hasFacGen / genHasOffice / isHostile / isJiangdong`
//     (跨链 helpers,留 v181)— processGentry 调
//   - `applyEthosShock`(已抽 chains/ethos.js)— _applySiegeAftermath 调
//   - `addGenChronicle / getCityProd / getFactionRuler`(留 v181)
//   - `trackCityLoss / checkEmperorCapture / addDiplo`(外交链,留 v181 等 3.8)
//     — _triggerGentryBetray 调
//   - `_doRetreat2Hex / hexDist / getUnitTroops`(军事链,留 v181 等 3.11)
//   - `invalidateCityCache / updateFogCitySnapshot / _aiInvalidateThreatCache`
//     (军事 / 缓存 helpers,留 v181)
//   - `closeModal / renderAll / showNextPrisonerModal / showCourtCouncil`(render 弹窗链,
//     已抽 src/render/ 或留 v181)
//   - `log / showNotif`(已抽 src/render/notifications.js)
//   - `GEN_TAGS / GEN_MAP / CITY_MAP / CITY_TO_STATE / STATE_TO_GENTRY_FAC
//     / COUNTY_NAME_TO_CITY / COUNTY_DATA / CLAN_FAMILIES / SIEGE_AFTERMATH
//     / SUPPLY_CITY_RESTORE_TURNS / STAGE_GENTRY_BOUNDS / FAC / ALL_FACS
//     / REPUTATION_DEFAULT`(数据 / 常量,部分已抽 src/data/,部分留 v181)
//   - `G(状态根)`(已抽 src/core/state.js)
//
// 同 phase 2/3.2/3.3/3.4/3.5 反向调用模式,设计原则 (c) 已 approve。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_*_notes §二)──
// PLAN §三阶段 3.12(原)字面:`chains/gentry.js(豪族链 v4 / 节点 ~37 / ~12 D 类)`
//   字面映射:~14 函数(master scout)
// scout 实测 + 实装:**18 函数 + 2 const + 1 section header verbatim ~547 行**
//   (含 G3 corruption-side helper 2 / G5+G6 aftermath 2,master scout 已含 14 / 漏 corruption 2 / aftermath 2 已含)
// PLAN-vs-reality 偏差中等,主因:_applySiegeAftermath / _onSiegeAftermath 跨链写但语义归 gentry。
//
// ── script 加载顺序(phase 3.5 拍板规范)──
// `data/* → core/* → chains/* → render/* → inline`
// 本文件加在 chains/ethos.js 之后,render/notifications.js 之前。chains/ 内顺序无关。
//
// ── chain 抽离模板第二次应用 ──
// phase 3.5 ethos 是模板首发,本 session 是模板第二应用,验证模板可扩展性。
//   - 6 项 header 必含 ✓(含写口归属声明)
//   - 加载顺序规范 ✓
//   - section header 抽走 ✓
//   - phase 2 原则(showSiegeAftermathChoice 留 v181)✓
//   - 跨链反向调用 (c) 容许,callers/callees 按归属链整理 ✓

/** ★ v170: 统一处理county.clanFamily（单值或数组）→ 返回族名数组（排除null/undefined） */
function _countyClanList(county){
  if(!county || !county.clanFamily) return [];
  return Array.isArray(county.clanFamily) ? county.clanFamily.filter(Boolean) : [county.clanFamily];
}

/** ★ v170→v171: magnate县判定。v170用 clan_base && clan∈MAGNATE_CLANS；v171解耦，直接读county.magnate字段。
 *  MAGNATE_CLANS常量保留作为数据标注参考（见COUNTY_DATA里magnate:true的县对应的clan），但不再参与判定逻辑。 */
function isMagnateCounty(county){
  return !!county && county.magnate === true;
}

const GENTRY_LEVELS = [
  { min:80, label:'拥戴', goldMult:1.15, recruitMult:0.85, moraleMod: 5, defMult:1.25, color:'#daa520' },
  { min:60, label:'支持', goldMult:1.05, recruitMult:0.95, moraleMod: 2, defMult:1.00, color:'#4caf50' },
  { min:40, label:'中立', goldMult:1.00, recruitMult:1.00, moraleMod: 0, defMult:0.90, color:'#888'    },
  { min:20, label:'不满', goldMult:0.90, recruitMult:1.15, moraleMod:-5, defMult:0.70, color:'#e67e22' },
  { min:0,  label:'抗拒', goldMult:0.75, recruitMult:1.30, moraleMod:-10,defMult:0.50, color:'#a82a1a' },
];

function getGentryLevel(val) {
  const v = val ?? 50;
  return GENTRY_LEVELS.find(lv => v >= lv.min) || GENTRY_LEVELS[GENTRY_LEVELS.length - 1];
}
/** ★ v170: 按county加权计算 gentry 乘数
 *   - 每个县依自己的loyalty独立算level
 *   - magnate县（clan_base且family∈MAGNATE_CLANS）的经济乘数额外×1.5
 *   - 用popShare加权聚合回城级
 *   若city无counties（旧存档/fallback）→ 用city.gentry直出，等价v168行为
 */
function _getCountyGentryLevel(c){ return getGentryLevel(c.loyalty); }
function getGentryGoldMult(city) {
  if(!city.counties || !city.counties.length) return getGentryLevel(city.gentry).goldMult;
  let sum = 0, tot = 0;
  city.counties.forEach(c => {
    const lv = _getCountyGentryLevel(c);
    let m = lv.goldMult;
    if(isMagnateCounty(c)) m *= 1.5;
    sum += m * c.popShare; tot += c.popShare;
  });
  return tot > 0 ? sum / tot : 1;
}
function getGentryRecruitMult(cityId) {
  const city = G.cities[cityId];
  if(!city) return 1;
  if(!city.counties || !city.counties.length) return getGentryLevel(city.gentry).recruitMult;
  let sum = 0, tot = 0;
  city.counties.forEach(c => {
    const lv = _getCountyGentryLevel(c);
    // 征兵费用: magnate县更好招（费用×1/1.5 = ÷1.5，即0.667）
    let m = lv.recruitMult;
    if(isMagnateCounty(c)) m /= 1.5;
    sum += m * c.popShare; tot += c.popShare;
  });
  return tot > 0 ? sum / tot : 1;
}
function getGentryMoraleMod(cityId) {
  const city = G.cities[cityId];
  if(!city) return 0;
  if(!city.counties || !city.counties.length) return getGentryLevel(city.gentry).moraleMod;
  // 士气不×1.5 (规格书只说"经济/征兵"，士气保持原有逻辑,按popShare加权)
  let sum = 0, tot = 0;
  city.counties.forEach(c => {
    sum += _getCountyGentryLevel(c).moraleMod * c.popShare; tot += c.popShare;
  });
  return tot > 0 ? sum / tot : 0;
}
// ★ v113: 豪族城防乘数
function getGentryDefMult(cityId) {
  const city = G.cities[cityId];
  if(!city) return 1.0;
  if(!city.counties || !city.counties.length) return getGentryLevel(city.gentry).defMult;
  let sum = 0, tot = 0;
  city.counties.forEach(c => {
    sum += _getCountyGentryLevel(c).defMult * c.popShare; tot += c.popShare;
  });
  return tot > 0 ? sum / tot : 1.0;
}

const CORRUPT_GENTRY_MAP = [
  { min:80, mod: 0.15 },  // 拥戴 → 压腐15%
  { min:60, mod: 0.08 },  // 支持 → 压腐8%
  { min:40, mod: 0.00 },  // 中立
  { min:20, mod:-0.08 },  // 不满 → 加剧8%
  { min:0,  mod:-0.15 },  // 抗拒 → 加剧15%
];
function _getCorruptGentryMod(gentryVal){
  const v = gentryVal ?? 50;
  return (CORRUPT_GENTRY_MAP.find(lv => v >= lv.min) || CORRUPT_GENTRY_MAP[CORRUPT_GENTRY_MAP.length-1]).mod;
}

// ═══════════════════════════════════════════════════════
// ★ I2 豪族支持系统 — 运行时函数
// ═══════════════════════════════════════════════════════

/** initGame 时设置每城初始豪族支持度 */
function initCityGentry(){
  // ★ v161: 属县系统初始化 — 为每座城市生成counties数组
  Object.entries(G.cities).forEach(([cityId, city]) => {
    if(city.counties && city.counties.length > 0) return; // 已有counties（存档加载）
    const template = COUNTY_DATA[cityId];
    if(!template){
      // 无属县数据的城市：fallback单county
      city.counties = [{name:CITY_MAP[cityId]?.name||cityId, type:'seat', clanFamily:null, popShare:1.0, loyalty:50, _initPop:city.pop}];
      city.gentry = 50;
      return;
    }
    const fid = city.fac;
    const reg = CITY_TO_STATE[cityId];
    // 判定本土/外来：城市region所属的势力核心region
    const isHomeFac = fid && fid !== 'rebel' && _isFacHomeRegion(fid, reg);
    city.counties = template.map(t => {
      let loyalty;
      if(isHomeFac){
        // 本势力本土城市
        if(t.type === 'seat') loyalty = 90;
        else if(t.type === 'clan_base'){
          loyalty = _clanHasOfficeInFac(t.clanFamily, fid) ? 70 : 55;
        } else loyalty = 50;
      } else {
        // 外来政权占领 / 叛军
        if(fid === 'rebel'){ loyalty = 50; }
        else if(t.type === 'seat') loyalty = 40;
        else if(t.type === 'clan_base'){
          if(_clanHasMemberInFac(t.clanFamily, fid)){
            loyalty = _clanHasOfficeInFac(t.clanFamily, fid) ? 45 : 30;
          } else loyalty = 20;
        } else loyalty = 30;
      }
      return { name:t.name, type:t.type, clanFamily:t.clanFamily, popShare:t.popShare, magnate:t.magnate===true, loyalty, _initPop:Math.floor(city.pop * t.popShare) };
    });
    // popShare归一化
    const total = city.counties.reduce((s,c) => s + c.popShare, 0);
    if(Math.abs(total - 1.0) > 0.001) city.counties.forEach(c => c.popShare /= total);
    // 聚合gentry
    city.gentry = _aggregateGentry(city);
  });
}

/** 判断势力fid是否以reg为核心地域 */
function _isFacHomeRegion(fid, reg){
  if(!reg || !fid) return false;
  // 势力首都所在region
  const cap = Object.values(G.cities).find(c => c.fac === fid && CITY_MAP[c.id]?.isCapital);
  if(!cap) return false;
  const capReg = CITY_TO_STATE[cap.id];
  if(!capReg) return false;
  // 同region本土
  if(reg === capReg) return true;
  // ★ v179 fix #60: v172 重构后 reg/capReg 都是 14 州名（si/yu/...），
  //   不再是旧派系名 'zhongyuan'/'hebei' — 改用 STATE_TO_GENTRY_FAC 反查同派系州互通
  //   覆盖：颍川/陈留/南阳(yu) 与洛阳(si) 都是 gentry_zhongyuan → 互认本土
  //         邺城(ji)/青州(qing)/幽州(you)/并州(bing) 都是 gentry_hebei
  //   保留 zhongyuan/hebei 跨派系互通（旧设计意图：曹魏的中原+河北一体化）
  const capGentryFac = STATE_TO_GENTRY_FAC[capReg];
  const regGentryFac = STATE_TO_GENTRY_FAC[reg];
  if(capGentryFac && regGentryFac){
    if(capGentryFac === regGentryFac) return true;
    // zhongyuan ↔ hebei 互通（曹魏统治传统核心带）
    const _zhYHbPair = (capGentryFac === 'gentry_zhongyuan' && regGentryFac === 'gentry_hebei') ||
                       (capGentryFac === 'gentry_hebei' && regGentryFac === 'gentry_zhongyuan');
    if(_zhYHbPair) return true;
  }
  return false;
}

/** 检查势力中是否有该家族成员 */
function _clanHasMemberInFac(clanFamily, fid){
  if(!clanFamily || !fid) return false;
  // ★ v178 fix #30: clanFamily 可能是单值或数组（v170 一县多族）
  const clans = Array.isArray(clanFamily) ? clanFamily.filter(Boolean) : [clanFamily];
  if(!clans.length) return false;
  return (G.generals[fid]||[]).some(g => clans.includes((GEN_TAGS[g.name]||{}).clan));
}

/** 检查势力中该家族是否有人任官 */
function _clanHasOfficeInFac(clanFamily, fid){
  if(!clanFamily || !fid) return false;
  // ★ v178 fix #30: clanFamily 可能是单值或数组（v170 一县多族）
  const clans = Array.isArray(clanFamily) ? clanFamily.filter(Boolean) : [clanFamily];
  if(!clans.length) return false;
  return (G.generals[fid]||[]).some(g => {
    if(!clans.includes((GEN_TAGS[g.name]||{}).clan)) return false;
    // 有官职 或 是太守
    if(getGenPostDef(g.name)) return true;
    return Object.values(G.cities).some(c => c.fac === fid && c.prefect === g.name);
  });
}

/** 聚合属县loyalty为city.gentry */
function _aggregateGentry(city){
  if(!city.counties || !city.counties.length) return city.gentry ?? 50;
  return Math.round(city.counties.reduce((s,c) => s + c.loyalty * c.popShare, 0) * 10) / 10;
}

/** ★ v161: 城市易手时按县设loyalty（消费C3预留的gentryHook） */
function applyGentryOnCapture(cityId, newFac, oldFac){
  const city = G.cities[cityId];
  if(!city) return;
  // gentryHook
  const hookKey = `${newFac}-${oldFac}`;
  const hook = G._claimGentryHook?.[hookKey] || 0;
  if(!city.counties || !city.counties.length){
    // fallback旧逻辑
    let base = 30;
    if(hook) base += hook;
    city.gentry = Math.max(0, Math.min(100, base));
    return;
  }
  city.counties.forEach(county => {
    let base;
    if(county.type === 'seat') base = 40;
    else if(county.type === 'clan_base'){
      if(_clanHasMemberInFac(county.clanFamily, newFac)) base = 25;
      else base = 15;
    } else base = 25;
    base += hook;
    county.loyalty = Math.max(0, Math.min(100, base));
    county._initPop = Math.floor(city.pop * county.popShare); // 重置基准
  });
  city.gentry = _aggregateGentry(city);
}

/** ★ v161→v170: 家族忠诚冲击（处决/叛逃/朝议时调用）
 *  v170改动：① clanFamily支持数组形式（_countyClanList）② delta×COUNTY_CLAN_SENS（作用县必是clan_base且本族匹配→恒2.0） */
function applyFamilyLoyaltyShock(fid, clanName, delta){
  if(!clanName || !fid) return;
  Object.values(G.cities).forEach(city => {
    if(city.fac !== fid || !city.counties) return;
    let touched = false;
    city.counties.forEach(county => {
      if(county.type === 'clan_base' && _countyClanList(county).includes(clanName)){
        county.loyalty = Math.max(0, Math.min(100, county.loyalty + delta * COUNTY_CLAN_SENS));
        touched = true;
      }
    });
    if(touched) city.gentry = _aggregateGentry(city);
  });
}

/** 每旬处理豪族支持度变化 — ★ v170 重写：3层结构
 *  第1组（shared × TYPE_SENS）：太守因子 + 占领期 + 围城 + 技能 + 科技 + 孙权江东 + 漂移
 *  第2组（按县 × 本族sens）：本县/同城辐射/本族加成（上限1.0）
 *  shock（independent）：applyFamilyLoyaltyShock 直加（已在外部调用，独立于此函数）
 */
function processGentry(){
  // ★ v113: 清理过期义兵buff
  Object.values(G.cities).forEach(city => {
    if(city._yibingBuff && city._yibingBuff.expiresAt <= G.turn) delete city._yibingBuff;
  });
  ALL_FACS.forEach(fid => {
    // ★ v170: 预计算在朝武将加成清单（每个fac一次，所有城共享）
    const facGens = G.generals[fid] || [];
    const genBonusList = [];
    const seenNames = new Set();
    facGens.forEach(g => {
      const b = getGenLocalBonus(g.name, fid);
      if(!b.tier) return;
      seenNames.add(g.name);
      genBonusList.push({
        name: g.name,
        clan: GEN_TAGS[g.name]?.clan || null,
        homeCounty: getGenHomeCounty(g.name),
        homeCity: getGenHomeCity(g.name),
        homeInFac: isGenHomeInFac(g.name, fid),
        ownCounty: b.ownCounty,
        sameCity: b.sameCity,
        clanBonus: b.clanBonus,
      });
    });
    // 君主若在列表但没官职 → 手动补tier1
    const ruler = getFactionRuler(fid);
    if(ruler && !seenNames.has(ruler) && facGens.some(g => g.name === ruler)){
      const t1 = _V170_TIER_TABLE[1];
      genBonusList.push({
        name: ruler,
        clan: GEN_TAGS[ruler]?.clan || null,
        homeCounty: getGenHomeCounty(ruler),
        homeCity: getGenHomeCity(ruler),
        homeInFac: isGenHomeInFac(ruler, fid),
        ownCounty: t1.ownCounty,
        sameCity: t1.sameCity,
        clanBonus: t1.clanBonus,
      });
    }

    Object.values(G.cities).forEach(city => {
      if(city.fac !== fid) return;
      // ★ v161: 旧存档兼容 — 无counties时初始化
      if(!city.counties || !city.counties.length){
        const template = COUNTY_DATA[city.id];
        if(template){
          city.counties = template.map(t => ({
            name:t.name, type:t.type, clanFamily:t.clanFamily, popShare:t.popShare,
            magnate:t.magnate===true, // ★ v171
            loyalty: city.gentry ?? 50, _initPop: Math.floor(city.pop * t.popShare)
          }));
          const tot = city.counties.reduce((s,c) => s + c.popShare, 0);
          if(Math.abs(tot-1)>0.001) city.counties.forEach(c => c.popShare /= tot);
        } else {
          city.counties = [{name:CITY_MAP[city.id]?.name||city.id, type:'seat', clanFamily:null, popShare:1.0, loyalty:city.gentry??50, _initPop:city.pop}];
        }
      }

      // ── 第1组（共享部分 — 和具体县/太守身份无关） ──
      // ★ v172+: 按势力 stage 差异化（政权制度威望恢复快，军阀靠刀把子摁但人心难聚）
      const _stage = getStage(fid);
      const _occMod   = _stage === 'warlord' ? -0.4 : _stage === 'regional' ? -0.3 : -0.2;
      const _driftMod = _stage === 'warlord' ?  0   : _stage === 'regional' ?  0.05 : 0.10;
      let g1Shared = 0;
      // 占领期（军阀更重、政权更轻）
      if(city.occupied > 0) g1Shared += _occMod;
      // SKILL_INLINE: gongxin — 吕蒙攻心
      const _lvmengSiege = G.units.some(u =>
        u.status === 'siege' && u.siegeTarget === city.id &&
        u.fac !== fid && isHostile(u.fac, fid) &&
        u.squads.some(sq => sq.genName === '吕蒙')
      );
      if(_lvmengSiege) g1Shared -= 3.0;
      // 武将技能: onGentry
      const gfx = applySkills('onGentry', {fac: fid});
      g1Shared += gfx.flatGentry;
      g1Shared += getTechEffect(fid, 'gentryRecovery');
      // SKILL_INLINE: zuoduan_gentry — 孙权坐断
      if(hasFacGen(fid,'孙权') && genHasOffice('孙权',fid) && city.fac===fid && isJiangdong(city.id)) g1Shared += 0.15;
      // 自然漂移（军阀0/一方之主0.05/政权0.10）
      g1Shared += _driftMod;

      // ── 太守信息（按县计prefectMod）──
      const pref = city.prefect;
      let prefOrigin = null, prefHomeCounty = null, prefHomeCity = null, prefIsDefect = false;
      if(pref){
        prefOrigin = GEN_TAGS[pref]?.origin;
        prefHomeCounty = getGenHomeCounty(pref);
        prefHomeCity = getGenHomeCity(pref);
        prefIsDefect = G.genJoinSource?.[pref] === 'defect';
      }
      const prefIsLocal = !!pref && prefHomeCity === city.id;

      // ── 逐县更新 loyalty ──
      city.counties.forEach(county => {
        const typeSens = COUNTY_TYPE_SENS_V170[county.type] ?? 1.0;

        // 第1组按县：shared + prefectMod
        let prefectMod;
        if(pref){
          if(prefIsLocal){
            prefectMod = (prefHomeCounty === county.name) ? 0.5 : 0.3;
          } else if(prefOrigin === 'gentry'){
            prefectMod = -0.1;
          } else if(prefOrigin === 'humble' || prefIsDefect){
            prefectMod = -0.2;
          } else {
            // 其他（origin未知/宗亲非本地等）按gentry量级处理
            prefectMod = -0.1;
          }
        } else {
          prefectMod = -0.15;
        }

        const g1 = (g1Shared + prefectMod) * typeSens;

        // 第2组按县：本县 + 同城辐射 + 本族 （各项可乘本族sens，最后封顶）
        let g2 = 0;
        const isClanBase = county.type === 'clan_base';
        const countyClans = _countyClanList(county);
        for(const gb of genBonusList){
          if(!gb.homeInFac) continue; // 悬置：武将老家不在版图（或永久null）
          const isBothClan = gb.clan && isClanBase && countyClans.includes(gb.clan);
          const clanSens = isBothClan ? COUNTY_CLAN_SENS : 1.0;
          // 本县加成（乘clanSens，即本族匹配时×2.0）
          if(gb.homeCounty === county.name){
            g2 += gb.ownCounty * clanSens;
          } else if(gb.homeCity === city.id){
            // 同城辐射（排除本县）— 永远×1.0
            g2 += gb.sameCity;
          }
          // 本族加成（与本县加成可并存，仅clan_base且本族匹配）— 乘clanSens恒×2.0
          if(isBothClan){
            g2 += gb.clanBonus * clanSens;
          }
        }
        if(g2 > LOCAL_BONUS_CAP_V170) g2 = LOCAL_BONUS_CAP_V170;

        const finalDelta = g1 + g2;
        county.loyalty = Math.max(0, Math.min(100, county.loyalty + finalDelta));
      });

      // ── 聚合gentry ──
      city.gentry = _aggregateGentry(city);

      // ── 隐匿户口（县级判定）──
      city.counties.forEach(county => {
        if(county.loyalty < 20){
          const countyPop = city.pop * county.popShare;
          const initPop = county._initPop || countyPop;
          if(countyPop > initPop * 0.30){
            const loss = Math.floor(city.pop * county.popShare * 0.05);
            city.pop = Math.max(25000, city.pop - loss);
            if(fid === G.playerFac && loss > 0) log(`⚠ ${CITY_MAP[city.id]?.name||city.id}·${county.name}豪族隐匿户口，人口流失${loss}`, 'event');
          }
        }
      });
    });
  });

  // ★ v161: 献城（县级判定）— 任一属县loyalty<20 + popShare≥20% + 被围城 + 非最后一城
  Object.entries(G.cities).forEach(([cityId, city]) => {
    if(!city.fac || city.fac === 'rebel') return;
    const siegingUnit = G.units.find(u =>
      u.status === 'siege' && u.siegeTarget === cityId && u.fac !== city.fac && isHostile(u.fac, city.fac)
    );
    if(!siegingUnit) return;
    const facCities = Object.values(G.cities).filter(c => c.fac === city.fac);
    if(facCities.length <= 1) return;
    if(!city.counties) return;
    for(const county of city.counties){
      if(county.loyalty < 20 && county.popShare >= 0.20){
        _triggerGentryBetray(cityId, siegingUnit.fac);
        break; // 只触发一次
      }
    }
  });

  // ★ v172: 按势力 stage 对所有城 gentry 做 bounds clamp
  // 军阀：25-70（强权保底+不得拥戴），一方之主/政权：0-100（完全解锁）
  Object.values(G.cities).forEach(city => {
    if(!city.fac || city.fac === 'rebel') return;
    const bounds = STAGE_GENTRY_BOUNDS[getStage(city.fac)] || STAGE_GENTRY_BOUNDS.regime;
    if(city.gentry == null) return;
    if(city.gentry < bounds.min) city.gentry = bounds.min;
    else if(city.gentry > bounds.max) city.gentry = bounds.max;
    // 对 county.loyalty 也做同样处理（保持县级粒度的一致性）
    if(city.counties){
      city.counties.forEach(c => {
        if(c.loyalty == null) return;
        if(c.loyalty < bounds.min) c.loyalty = bounds.min;
        else if(c.loyalty > bounds.max) c.loyalty = bounds.max;
      });
    }
  });
}

// ★ v113/v161: 豪族开城投降（逻辑不变，仅清理旧gentry=0判定）
function _triggerGentryBetray(cityId, siegingFac){
  const city = G.cities[cityId];
  if(!city) return;
  const oldFac = city.fac;
  const cityName = CITY_MAP[cityId]?.name || cityId;
  const siegingName = FAC[siegingFac]?.name || siegingFac;

  // 城市易手
  city.fac = siegingFac;
  // ★ v132 F3/G3: 城市易手记录
  if(!G._cityChangeLog) G._cityChangeLog=[];
  G._cityChangeLog.push({turn:G.turn, cityId, from:oldFac, to:siegingFac});
  invalidateCityCache(); // ★ v117fix
  city.siegeDecay = 0;
  city.garrison = 0;
  city.billetPool = [];
  city.prefect = null;

  // 围城方解除siege → garrison
  G.units.filter(u => u.siegeTarget === cityId).forEach(u => {
    u.status = 'garrison';
    delete u.siegeTarget;
    delete u._siegeTurnCount;
  });

  // 城内守方部队溃败：撤退2格或消灭
  const cityDef = CITY_MAP[cityId];
  const defUnits = G.units.filter(u => u.fac === oldFac && cityDef &&
    hexDist(u.hq??0, u.hr??0, cityDef.q, cityDef.r) <= 1);
  defUnits.forEach(u => {
    const troops = getUnitTroops(u);
    if(troops < 200){
      u.squads.forEach(sq => { sq.troops = 0; });
    } else {
      // 溃败：损失30%兵力+士气归20，尝试撤退
      u.squads.forEach(sq => {
        sq.troops = Math.floor(sq.troops * 0.7);
        sq.morale = Math.min(sq.morale, 20);
      });
      if(typeof _doRetreat2Hex === 'function') _doRetreat2Hex(u, G.units.filter(eu=>eu.fac===siegingFac));
      else { u.status = 'halt'; u.hexPath = []; }
    }
  });

  // 标准城市易手钩子
  trackCityLoss(cityId, oldFac, siegingFac);
  checkEmperorCapture(cityId, oldFac, siegingFac);
  applyGentryOnCapture(cityId, siegingFac, oldFac);
  city.occupied = 12; // 开城降较温和
  city._supplyRestoreTurns = SUPPLY_CITY_RESTORE_TURNS;
  _aiInvalidateThreatCache();
  updateFogCitySnapshot(cityId, siegingFac);
  if(oldFac !== 'rebel' && siegingFac !== 'rebel') addDiplo(siegingFac, oldFac, -5);
  // D-031 fix: 开城易主补 _applySiegeAftermath（修补"围城方白嫖一座城无收入/处置选项"漏洞，'pacify' 安民与开城温和语义匹配）
  if(siegingFac !== 'rebel') _applySiegeAftermath(cityId, siegingFac, 'pacify');
  // D-045/D-131 fix: 豪族开城迎降 = 攻方占城，触发 conquer 派系事件（military.js:5942 标准攻城同模式，鹰派 +3）
  if(ALL_FACS.includes(siegingFac)) triggerFactionEvent('conquer', siegingFac, {});

  log(`⚠ ${cityName}豪族举事，开城迎降${siegingName}！`, 'event');
  if(oldFac === G.playerFac || siegingFac === G.playerFac){
    showNotif(`${cityName}豪族开城迎降${siegingName}！`, oldFac===G.playerFac?'warn':'info');
  }
}

/** ★ v151: 攻城胜利后处置 — 结算 */
function _applySiegeAftermath(cityId, atkFac, choiceId){
  const city = G.cities[cityId];
  if(!city) return;
  const opt = SIEGE_AFTERMATH[choiceId];
  if(!opt) return;
  // 金钱收益（基于城市实际旬产金）
  if(opt.goldMult > 0){
    const prod = getCityProd(city);
    const loot = Math.floor((prod?.gold || 50) * opt.goldMult * 12);
    G.factions[atkFac].res.gold += loot;
    if(atkFac === G.playerFac) log(`💰 ${city.name}${opt.label}获金${loot}`, 'event');
  }
  // 民心
  city.morale = Math.max(0, Math.min(100, city.morale + opt.moraleMod));
  // 人口
  if(opt.popMult < 1) city.pop = Math.max(500, Math.floor(city.pop * opt.popMult));
  // 豪族
  if(city.gentry != null) city.gentry = Math.max(0, Math.min(100, city.gentry + opt.gentryMod));
  // 信誉
  if(opt.repCost){
    G.reputation[atkFac] = Math.max(0, (G.reputation[atkFac]||REPUTATION_DEFAULT) + opt.repCost);
    if(atkFac === G.playerFac && opt.repCost < 0) log(`📉 信誉${opt.repCost}（${opt.label}）`, 'diplo');
  }
  // 价值观冲击
  if(opt.ethosShocks){
    Object.entries(opt.ethosShocks).forEach(([dim, delta]) => {
      applyEthosShock(atkFac, dim, delta, opt.label);
    });
  }
  // 小传
  const ruler = (G.generals[atkFac]||[]).find(g=>g.role==='ruler');
  if(ruler && choiceId !== 'pacify'){
    addGenChronicle(ruler.name, `攻克${city.name}后下令${opt.label}。${opt.desc}。`);
  }
}

function _onSiegeAftermath(cityId, atkFac, choiceId){
  _applySiegeAftermath(cityId, atkFac, choiceId);
  closeModal();
  renderAll();
  // ★ v151: 继续弹窗链——俘虏处置 → 朝议
  if(G._pendingPrisoners && G._pendingPrisoners.length) setTimeout(showNextPrisonerModal, 200);
  else if(window._pendingCourtCouncil){
    const _ccProps = window._pendingCourtCouncil;
    window._pendingCourtCouncil = null;
    setTimeout(()=>showCourtCouncil(_ccProps), 400);
  }
}
