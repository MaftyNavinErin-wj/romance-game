// src/chains/general.js
//
// 武将链(GEN)— 部曲 / 武将养成 / 籍贯 / 派系 / chronicle / 招募 / 亲密度 / 忠诚 +
//                挖角 / 太守 / 军师 / 战力 / 伤亡 + 俘虏 / 拜将大典。
//
// 来源:从 project_romance_v181.html + src/render/ceremonies.js 抽离
// (Session 3.12 / Wave 3 收尾 / phase 3 chain 抽离最后一个).
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation).
//
// ── 抽离决策 ──
// 武将链是**中心枢纽**(被几乎所有 chain 反向调用),但函数体量不大(~70 mutator)。
// 复杂度在 carry-over 反向调用清单(§反向调用),不在体量。
//
// ── 抽离范围(15 段 + GEN15 _applyCeremony 归位)──
//   GEN1  部曲                        v181 L887-L912    (4 funcs)
//   GEN2  武将养成 (exp + const)       v181 L919-L985    (2 + 4 const)
//   GEN3  helpers + 伤亡 const         v181 L2061-L2089  (3 + 6 const)
//   GEN4  籍贯                         v181 L2625-L2665  (4 + 1 const)
//   GEN5.a 出身地 + 籍贯地形           v181 L2867-L2904  (3)
//   GEN5.b 派系系统                    v181 L2906-L3353  (9, 含 triggerFactionEvent)
//   GEN6  chronicle                    v181 L3506-L3514  (1)
//   GEN7  招募                         v181 L3790-L4108  (9)
//   GEN8  亲密度阈值                   v181 L4109-L4171  (2)
//   GEN9  忠诚 + 挖角                  v181 L4214-L4643  (5)
//   GEN10 太守                         v181 L4677-L4748  (2)
//   GEN11 军师                         v181 L4750-L4793  (2)
//   GEN12 战力                         v181 L7527-L7535  (2)
//   GEN13 亲密度系统                   v181 L7621-L7755  (8)
//   GEN14 伤亡 + 俘虏                  v181 L7757-L8186  (12)
//   GEN15 _applyCeremony 归位          src/render/ceremonies.js L31-L45 (1)
//   GEN16 AI _exec 入口                v181 L13516-L13542 + L13433-L13442 + L13505-L13513
//                                      (4 funcs, sprint batch-26+27)
//
// 函数总数: 4+2+3+4+3+9+1+9+2+5+2+2+2+8+12+1+4 = **73 函数 + 11 const**
//
// ── 留 v181 / 数据 sprint ──
//   武将数据 const (留 v181 等 src/data/generals.js sprint):
//     GENS_FULL / GEN_META / ALL_GENS / GEN_POOL_INACTIVE / FOUNDING_CORE /
//     GEN_CLASS / CLASS_META
//   squad class helpers (L2175-L2240, 与 GEN_CLASS 数据捆绑等 sprint):
//     getSquadClass / getUnitClassBuffs / getClassDuelWeight /
//     genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml
//   ceremony modal (留 src/render/ceremonies.js):
//     _showCeremonyPicker / _updateCeremonyBtn / _confirmCeremony
//   全部 modal HTML / render Tab (无武将专属 Tab; 武将信息渲染在 renderFactionTab /
//     openGenProfile 留 v181 / openPostAction / openPostAppoint 等)
//   武将相关 _exec 已全数抽到 GEN16 (sprint batch-26+27):
//     RecruitWild + Poach (batch-26) + SetPrefect + SetStrategist (batch-27)
//   AppointPost / DismissPost 按 (a) 原则随 helper 归 politics.js (sprint batch-27)
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - G.generals[fid] (武将数组主写口)
//   - G.genLoyalty / G.loyaltyAccum (忠诚)
//   - G.genStatExp / G.genStatBase / G.genAptExp (经验)
//   - G.genFactionMod / G.genFactionModLog (派系修正)
//   - G.genPost (官职, 与政治共享 — 政治链主写, 武将链通过 setPrefect 副作用)
//   - G.genRetainers / G.genRetainerType (部曲)
//   - G.genJoinTurn / G.genJoinSource / G.genOrigFac (入伍记录)
//   - G.intimacy / G._intimacyShown (亲密度)
//   - G.wounded / G.prisoners (伤亡 + 俘虏)
//   - G.chronicles[name] (武将编年史)
//   - G.wildPool / G.recruitableGens / G.wildRecruitCD (招募池)
//   - G.factionRulers (继任, 与政治共享)
//
// **跨链副作用写口** (整函数归武将, 业务语义优先):
//   - _doRecruitWild / aiDoRecruitTalent / _aiDoPoach: 扣 G.factions[fid].res (经济)
//   - poachGen: 写 G.factions[fid].res / G.reputation (经济 + 外交 hub)
//   - setPrefect: 业务语义是"任命武将做太守" — 武将动作.
//                  G.cities[].prefect 是记录, G.genLoyalty 是核心副作用,
//                  函数主体逻辑处理武将状态变化. 按业务语义归武将.
//                  (制作人 2026-05-05 approve: 业务语义优先于字段位置 —
//                   sprint/audit 时不容易引发"凭什么判核心"的争议)
//   - succeedRuler: 业务语义是"君主继任" — 写 FAC_IDENTITY[fid].ruler (政治)
//                  + 写 G.generals[fid].push(newRuler) (武将), 主体逻辑是
//                  武将晋升 + 派系切换, 归武将.
//   - killGen: 调 checkBloodFeud (外交) / clearAllPostsByGen (政治) /
//              clearPrefectByGen (本 chain 内调) — 武将死亡 hub
//   - _applyCeremony: 写 G._eventFired (事件 cooldown 副作用) +
//                     G.genLoyalty (武将主) + sq.morale (军事副作用) +
//                     调 addStatExp hub. 主写口在武将忠诚, 全军士气 +5 是副作用.
//
// ── triggerFactionEvent 闭环记录 (phase 3 整体决策一致性, audit pass 2 用) ──
// phase 3.2 hubs.js 抽离时排除 triggerFactionEvent (理由: 写口主要在武将链
// 派系状态 G.genFactionMod, 不是真跨链 hub).
// phase 3.12 本 session 归位 chains/general.js GEN5.b.
// 这两个决策一致: 一个函数的"hub-like 调用面" 不等于"跨链归属",
// 应按主写口判定. 3.2 决策正确, 3.12 实现一致.
//
// ── 接口风格 ──
// 全局函数 (同 v181 + 已抽 src/data/ + src/core/* + src/render/ + chains/*).
// 模块共享 hoisted function 全局可见, 无 import/export.
//
// ── 反向调用清单 ((c) 已 approve) ──
//
// 本 chain 被外部链调用 (callers — 16 个 hub-like 函数, 反向调用典型 hub 模式):
//   - triggerFactionEvent (L3217 → 本 chain GEN5.b):
//       diplomacy 4 处 (truce/betray) + military 1 处 (conquer) + politics 2 处
//       (appointPost/removePost) = 7 处
//   - setPrefect / clearPrefectByGen (本 chain GEN10):
//       politics 1 处 (appointGenPost 互斥太守)
//   - getStrategistInt / setStrategist (本 chain GEN11):
//       diplomacy 1 处 (计谋 INT) + claude_ai 1 处 = 2 处
//   - addStatExp / addAptExp (本 chain GEN2):
//       military 8 处 (战斗经验) + politics 1 处 (科技研究奖励) = 9 处
//   - getRetainers / setRetainers / getRetainersDisplay (本 chain GEN1):
//       military 10+ 处 (部曲招募/伤亡)
//   - killGen / surrenderGen / addGenChronicle (本 chain GEN14/GEN6):
//       military 多处 (战斗死亡 + chronicle) + gentry 1 处 (屠城 chronicle)
//   - getGenFaction / getGenFactions / _genInfluence (本 chain GEN5.b):
//       economy 1 处 (太守派系) + politics 6 处 (任命 + 朝议) = 7 处
//   - processFactionLoyalty (本 chain GEN5.b):
//       core/tick.js 1 处 (每旬调) = 1 处
//   - applyLoyaltyEvent (本 chain GEN9):
//       military 1 处 (战败忠诚事件) = 1 处
//   - _applyCeremony (本 chain GEN15):
//       src/render/ceremonies.js _confirmCeremony 1 处 = 1 处
//
// 收口结论: 全部反向调用典型 hub 模式, (c) 原则容许. 不存在真反向耦合
// (没有武将链函数体内反向调已抽 chain 的非 hub 函数). 3.12 抽离后所有调用
// 关系不变, 跨 script hoisted function 全局可见.
//
// 本 chain 调外部 (callees):
//   - addDiplo / applyReputationPenalty / checkBloodFeud / trackCityLoss
//     (已抽 chains/diplomacy.js) — killGen / poachGen / surrenderGen 调
//   - applyEthosShock (已抽 chains/ethos.js) — poachGen 等调
//   - clearAllPostsByGen (已抽 chains/politics.js) — killGen / succeedRuler 调
//   - getGenPostDef / getFactionRuler / hasAnyPost (已抽 chains/politics.js)
//     — 多处 read
//   - getTechEffect (已抽 chains/politics.js) — addStatExp / addAptExp /
//     refreshWildPool / _aiDoPoach 等读科技 buff
//   - hasFacGen / genHasOffice (本 chain self / 政治) — addStatExp /
//     refreshWildPool 读技能前提
//   - safeSub (已抽 src/core/helpers.js) — _doRecruitWild / poachGen /
//     _aiDoPoach 扣资源
//   - log / showNotif (已抽 src/render/notifications.js)
//   - confirm (浏览器 API) — succeedRuler (玩家继任确认)
//   - 数据 / 常量: GEN_TAGS / GEN_MAP / FAC / getScenarioFactions() / FAC_IDENTITY /
//     GENS_FULL / GEN_META / WILD_GENS / GEN_POOL_INACTIVE / FOUNDING_CORE /
//     COUNTY_NAME_TO_CITY / GENTRY_FAC_TO_STATES / STATE_TO_GENTRY_FAC /
//     STATE_CITIES / TROOP_TYPES / 等 (留 v181 / 已抽 src/data/)
//   - G (状态根) (已抽 src/core/state.js)
//
// ── plan §二偏离记录 ──
// PLAN §三阶段 3.12: chains/general.js (武将链 v4 / ~70 mutator / 30 D 类原 audit)
// 实装: **69 函数 + 11 const + _applyCeremony 归位** (master scout ~70 / 实测 69,
// 差异在 squad class helpers 留 v181 等数据 sprint).
// PLAN-vs-reality 偏差小, scout-before-extract 第 12 次应用 + 四件验证 PASS.
//
// ── script 加载顺序 ──
// data/* → core/state → helpers → hubs → claude_ai → tick → main → map →
// chains/ethos → gentry → politics → diplomacy → economy → event → military →
// chains/general.js  ← 本文件
// → render/* (ceremonies.js 删除 _applyCeremony 后) → inline
//
// ── chain 抽离模板第八次应用 (Wave 3 收尾 + phase 3 chain 抽离最后一个) ──
// phase 3.5-3.11 模板七次应用稳定, 本 session 是 Wave 3 收尾 + phase 3 chain
// 抽离最后一个. 3.13 收尾会做 4-batch review.
//   - 6 项 header 必含 ✓ (含写口归属声明 + triggerFactionEvent 闭环记录)
//   - 加载顺序规范 ✓
//   - phase 2 原则 (modal/ceremony picker / 武将数据 const 留 v181 / 留 ceremonies.js) ✓
//   - 跨链反向调用 (c) 容许, callers/callees 按归属链整理 ✓
//   - scout 四件验证 + ranges 无嵌套 (原则 #10) PASS ✓
//   - _applyCeremony 归位 (phase 2 carry-over close) ✓
//   - triggerFactionEvent 闭环 (phase 3.2 → phase 3.12) ✓

// ════════════════════════════════════════════════════════════════════
// ── GEN1 部曲 (v181 L887-L912) ──
// ════════════════════════════════════════════════════════════════════

function getRetainers(genName){
  const r = G.genRetainers && G.genRetainers[genName];
  if(!r) return 0;
  return typeof r === 'object' ? (r.count || 0) : r; // 兼容旧存档纯数字
}

/** v164: 获取武将部曲兵种（无部曲返回null） */
function getRetainerType(genName){
  const r = G.genRetainers && G.genRetainers[genName];
  if(!r) return null;
  if(typeof r === 'object') return r.type || null;
  // 旧存档纯数字：查PRESET补type
  return RETAINER_PRESET[genName]?.type || null;
}

/** v164: 设置武将部曲（count+type） */
function setRetainers(genName, count, type){
  if(!G.genRetainers) G.genRetainers={};
  const c = Math.max(0, Math.floor(count));
  if(c <= 0){ delete G.genRetainers[genName]; return; }
  const oldType = getRetainerType(genName);
  G.genRetainers[genName] = { count: c, type: type || oldType || null };
}

/** v164: 部曲显示值（整百，UI/编制用） */
function getRetainersDisplay(genName){ return Math.floor(getRetainers(genName) / 100) * 100; }

// ════════════════════════════════════════════════════════════════════
// ── GEN2 武将养成 exp + const (v181 L919-L986) ──
// ════════════════════════════════════════════════════════════════════

const STAT_GROW_CAP = 5;         // 每项属性最多成长+5
const STAT_GROW_THRESHOLD = 50;  // 每+1点需要50经验
const APT_GROW_THRESHOLD = { 'C':40, 'B':60, 'A':100 }; // 适性升档阈值（S不再升）
const APT_GRADES = ['C','B','A','S'];

/**
 * 给武将某属性加经验，达到阈值自动+1点（不超过初始值+CAP）
 * @returns {boolean} 是否升了一点
 */
function addStatExp(genName, stat, amount){
  if(!genName || !stat || stat==='cha' || amount<=0) return false;
  // ★ v115: 科技属性经验加成（用G.genOrigFac缓存避免O(n)查找）
  const genFac = G.genOrigFac?.[genName] || Object.keys(G.generals||{}).find(f=>(G.generals[f]||[]).some(g=>g.name===genName));
  if(genFac) amount *= (1 + getTechEffect(genFac, 'statExpMult'));
  // SKILL_INLINE: binggong — 董允秉公：当官/君主时，武将属性经验成长×1.20
  if(genFac && hasFacGen(genFac, '董允') && genHasOffice('董允', genFac)) amount *= 1.20;
  if(!G.genStatExp) G.genStatExp = {};
  if(!G.genStatExp[genName]) G.genStatExp[genName] = {com:0,war:0,int:0,pol:0};
  if(!G.genStatBase) G.genStatBase = {};
  // 首次记录初始值
  const gen = GEN_MAP[genName];
  if(!gen) return false;
  if(G.genStatBase[genName]===undefined) G.genStatBase[genName] = {};
  if(G.genStatBase[genName][stat]===undefined) G.genStatBase[genName][stat] = gen[stat];
  const base = G.genStatBase[genName][stat];
  const cap = base + STAT_GROW_CAP;
  if(gen[stat] >= cap) return false; // 已到成长上限
  G.genStatExp[genName][stat] += amount;
  // D-070 fix: if → while, 单次大量经验可连升多级; gen[stat] < cap 守卫防 cap 时 log 刷屏
  let leveled = false;
  while(G.genStatExp[genName][stat] >= STAT_GROW_THRESHOLD && gen[stat] < cap){
    G.genStatExp[genName][stat] -= STAT_GROW_THRESHOLD;
    gen[stat] += 1;
    log(`📈 ${genName} ${({com:'统率',war:'武力',int:'智力',pol:'政治'})[stat]}成长至 ${gen[stat]}`, 'event');
    leveled = true;
  }
  return leveled;
}

/**
 * 给武将某兵种适性加经验，达到阈值跳一档
 * @returns {boolean} 是否升了一档
 */
function addAptExp(genName, troopType, amount){
  if(!genName || !troopType || amount<=0) return false;
  // ★ v115: 科技适性经验加成（用G.genOrigFac缓存避免O(n)查找）
  const genFac = G.genOrigFac?.[genName] || Object.keys(G.generals||{}).find(f=>(G.generals[f]||[]).some(g=>g.name===genName));
  if(genFac) amount *= (1 + getTechEffect(genFac, 'aptExpMult'));
  if(!G.genAptExp) G.genAptExp = {};
  if(!G.genAptExp[genName]) G.genAptExp[genName] = {};
  const gen = GEN_MAP[genName];
  if(!gen || !gen.apt) return false;
  const _aptKey = TROOP_TYPES[troopType]?.baseType || troopType; // ★ v116: elite→baseType
  const curGrade = gen.apt[_aptKey];
  if(!curGrade || curGrade==='S') return false; // 已S，不再升
  const threshold = APT_GROW_THRESHOLD[curGrade];
  if(!threshold) return false;
  if(!G.genAptExp[genName][_aptKey]) G.genAptExp[genName][_aptKey] = 0; // ★ v116: 用_aptKey
  G.genAptExp[genName][_aptKey] = (G.genAptExp[genName][_aptKey]||0) + amount;
  if(G.genAptExp[genName][_aptKey] >= threshold){
    G.genAptExp[genName][_aptKey] -= threshold;
    const idx = APT_GRADES.indexOf(curGrade);
    if(idx>=0 && idx<APT_GRADES.length-1){
      gen.apt[_aptKey] = APT_GRADES[idx+1];
      log(`📈 ${genName} ${TROOP_TYPES[troopType]?.name||troopType}适性提升至 ${APT_GRADES[idx+1]}`, 'event');
      return true;
    }
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════
// ── GEN3 helpers + 伤亡 const + loyaltyDisplay (v181 L2061-L2092) ──
// ════════════════════════════════════════════════════════════════════

function _deepCloneGen(g){ return {...g, apt: g.apt ? {...g.apt} : undefined}; }

/** ★ v155fix P0: 重建GEN_MAP指向G.generals中的活跃对象
 *  调用时机：initGame末尾、_deserializeG末尾
 *  非活跃武将(GEN_POOL_INACTIVE)保留原始引用（不参与成长） */
function _rebuildGEN_MAP(){
  GEN_MAP = Object.fromEntries(GEN_POOL_INACTIVE.map(g=>[g.name, g]));
  getScenarioFactions().forEach(fid => {
    (G.generals[fid]||[]).forEach(gen => { if(gen.name) GEN_MAP[gen.name] = gen; });
  });
  (G.genPendingPool||[]).forEach(gen => { if(gen.name) GEN_MAP[gen.name] = gen; });
  // 在野武将：WILD_GENS中未被招募的仍需可查（profile/关系），用原始引用
  getAllWildGenDefs().forEach(g => { if(!GEN_MAP[g.name]) GEN_MAP[g.name] = g; });
}

// ═══════════════════════════════════════════════════════
// ⚔ A5 武将俘获/击杀系统常量
// ═══════════════════════════════════════════════════════
const WOUNDED_CD = 6;
const BATTLE_DEATH_LOSS = 0.70;    // 大败战死兵损触发阈值
const BATTLE_DEATH_CHANCE = 0.08;  // 大败战死基础概率
const DUEL_KILL_WAR_GAP = 20;
const DUEL_KILL_CHANCE = 0.30;
const CAPTURE_RATE_CAP = 0.85;


// 忠诚度显示
function loyaltyDisplay(val){
  if(val>=85) return {icon:'😊',label:'忠心耿耿',hint:'誓死效命，不会背叛',col:'#1a7a3a'};
  if(val>=45) return {icon:'😐',label:'尚算忠诚',hint:'有所顾虑，需妥善对待',col:'#6b5530'};  // ★ v72 60→45
  return {icon:'😠',label:'心存异志',hint:'可能在特定条件下倒戈',col:'#c03030'};
}

// ════════════════════════════════════════════════════════════════════
// ── GEN4 籍贯 (v181 L2625-L2665) ──
// ════════════════════════════════════════════════════════════════════

/** ★ v170: 从武将birthplace反查出身县名（遍历COUNTY_NAME_TO_CITY找后缀匹配，null=老家县不在版图内） */
function getGenHomeCounty(genName){
  const bp = getGenBirthplace(genName);
  if(!bp) return null;
  // 优先匹配较长的县名（避免"下邳"吃掉"下邳县"）
  // 简单做法：遍历全表，取最长匹配
  let best = null;
  for(const cname in COUNTY_NAME_TO_CITY){
    if(bp.endsWith(cname) && (!best || cname.length > best.length)){
      best = cname;
    }
  }
  return best;
}

/** ★ v170: 武将出身 city id（null=老家县不在COUNTY_DATA里） */
function getGenHomeCity(genName){
  const cn = getGenHomeCounty(genName);
  return cn ? COUNTY_NAME_TO_CITY[cn] : null;
}

/** ★ v170: 武将出身city当前是否在fid版图内（null情况返回false，即"永久悬置"） */
function isGenHomeInFac(genName, fid){
  const cid = getGenHomeCity(genName);
  return !!cid && G.cities?.[cid]?.fac === fid;
}

/** ★ v170: 按tier返回武将的本县/同城辐射/本族加成基础值 */
const _V170_TIER_TABLE = {
  1: { ownCounty:0.5,  sameCity:0.2, clanBonus:0.1   },
  2: { ownCounty:0.3,  sameCity:0.2, clanBonus:0.05  },
  3: { ownCounty:0.15, sameCity:0.2, clanBonus:0.025 },
};
function getGenLocalBonus(genName, fid){
  const postDef = getGenPostDef(genName);
  let tier = null;
  if(postDef && postDef.tier) tier = postDef.tier;
  else if(fid && getFactionRuler(fid) === genName) tier = 1; // 君主无官按tier1处理
  if(!tier) return { tier:null, ownCounty:0, sameCity:0, clanBonus:0 };
  return { tier, ..._V170_TIER_TABLE[tier] };
}

// ════════════════════════════════════════════════════════════════════
// ── GEN5.a 出身地 + 籍贯地形 (v181 L2867-L2904) ──
// ════════════════════════════════════════════════════════════════════

// 政治链 P3.a (官职 helpers + TRIBUTE_RATES const,L4488-L4558) 已抽离到 src/chains/politics.js
/** ★ v170: 读取武将出身地字符串（纯查表，不做任何解析） */
function getGenBirthplace(genName){
  return GEN_TAGS[genName]?.birthplace || null;
}

// 政治链 P3.b (官职 mutators + merit + seniority,L4564-L4711) 已抽离到 src/chains/politics.js

/** 判断武将籍贯州是否为本土（该势力拥有武将籍贯州或同士族派系州中至少一座城）
 *  v172: 州级本土判定——武将籍贯所属的士族派系对应的任一州，该势力有城 */
function isHomeTerrain(name, fid){
  const tags = GEN_TAGS[name];
  if(!tags || !tags.state) return false;
  const gentryFac = STATE_TO_GENTRY_FAC[tags.state];
  if(!gentryFac) return false;
  // 该士族派系对应的所有州的所有城
  const states = GENTRY_FAC_TO_STATES[gentryFac] || [tags.state];
  return states.some(s => (STATE_CITIES[s] || []).some(cid => G.cities[cid] && G.cities[cid].fac === fid));
}

/** ★ v124 重写：宗亲判定
 *  1. 武将clan === 君主clan → 宗亲（曹仁/夏侯惇在曹操手下）
 *  2. relations里有指向君主的宗族/姻亲关系 → 宗亲（吴懿国舅）
 *  3. 不再检查values标签 */
function _isClanRoyalty(name, fid){
  const gens = G.generals[fid] || [];
  const ruler = gens.find(g => g.role === 'ruler');
  if(!ruler) return false;
  const rulerMeta = getGenMeta(ruler.name);
  const genMeta   = getGenMeta(name);
  // 1. 同clan判定
  if(genMeta.clan && rulerMeta.clan && genMeta.clan === rulerMeta.clan) return true;
  // 2. relations链判定
  const clanRelTypes = new Set(['宗族','义兄弟','国舅','姻亲','养父','养子','父','子']);
  const rels = genMeta.relations || [];
  if(rels.some(r => r.name === ruler.name && clanRelTypes.has(r.type))) return true;
  return false;
}

// ════════════════════════════════════════════════════════════════════
// ── GEN5.b 派系系统 含 triggerFactionEvent (v181 L2906-L3353) ──
// ════════════════════════════════════════════════════════════════════

/** ★ v94: 获取武将所有匹配的派系标签（用于双标签影响力分配）
 *  返回数组，第一个是主派系，后续是副派系 */
function getGenFactions(name, fid){
  const gens = G.generals[fid] || [];
  const gen = gens.find(g => g.name === name);
  if(!gen || gen.role === 'ruler') return [];

  const tags = GEN_TAGS[name] || {};
  const sen = seniority(name, fid);
  const facs = [];

  // 主派系（按优先级）
  if(sen === 'founding') facs.push('founding');
  if(sen === 'defector'){
    const origRole = G.genOrigRole && G.genOrigRole[name];
    const origFac  = G.genOrigFac  && G.genOrigFac[name];
    if(origRole === 'ruler') return ['warlord_remnant']; // 旧主无副标签
    if(origFac){
      const origRuler = Object.values(GENS_FULL).flat().find(g =>
        GENS_FULL[origFac]?.some(og => og.name === g.name) && g.role === 'ruler'
      );
      if(origRuler){
        const rm = getGenMeta(origRuler.name);
        const gm = getGenMeta(name);
        if(gm.clan && rm.clan && gm.clan === rm.clan) return ['warlord_remnant'];
      }
    }
    return ['defector']; // 降将无副标签
  }
  if(sen === 'newcomer') return ['newcomer']; // 新附无副标签

  // 宗亲（副标签——如果不是已作为主派系）
  if(!facs.includes('royalty') && _isClanRoyalty(name, fid)) facs.push('royalty');

  // ★ v124: 旧阀贵族（origin:'noble'且不是本族宗亲）
  if(tags.origin === 'noble' && !_isClanRoyalty(name, fid)){
    if(!facs.includes('noble')) facs.push('noble');
  }

  // 士族（副标签）
  // v172: 优先 clique（客居集团，如东州派/淮泗派），否则按 state → gentry_fac 映射
  // magnate（地方豪族/商贾/豪帅）不贡献士族派系，由 humble 兜底
  if(tags.origin === 'gentry'){
    let gentryFac;
    if(tags.clique === 'dongzhou') gentryFac = 'gentry_dongzhou';
    else if(tags.clique === 'huaisi') gentryFac = 'gentry_huaisi';
    else gentryFac = STATE_TO_GENTRY_FAC[tags.state] || 'gentry_zhongyuan';
    if(!facs.includes(gentryFac)) facs.push(gentryFac);
  }

  // 如果到这里还是空的（非founding、非royalty、非gentry的member，含 magnate/humble）
  if(facs.length === 0){
    // v172: magnate 不再用 pol 兜底到 gentry_zhongyuan（豪族不是士族）
    // humble / 高pol兜底仅对非豪族生效
    if(tags.origin !== 'magnate' && gen.pol >= 70) facs.push('gentry_zhongyuan');
    else facs.push('humble');
  }

  return facs;
}

/** 获取武将所属主派系（按优先级），君主本人返回null */
function getGenFaction(name, fid){
  const gens = G.generals[fid] || [];
  const gen = gens.find(g => g.name === name);
  if(!gen || gen.role === 'ruler') return null;

  const tags = GEN_TAGS[name] || {};
  const sen = seniority(name, fid);
  const home = isHomeTerrain(name, fid);

  // 1. 核心创始：永久
  if(sen === 'founding') return 'founding';

  // 2. 元老（招募/降将满180旬）→ 按origin/home重新归类（同member逻辑）
  // 3. 开局非核心成员（member）→ 按origin/home归类
  // 4. 降将/新附未满180旬
  // ★ v71 旧阀遗族：原为某势力的ruler，或与原势力ruler同clan，且以capture方式加入
  if(sen === 'defector'){
    const origRole = G.genOrigRole && G.genOrigRole[name];
    const origFac  = G.genOrigFac  && G.genOrigFac[name];
    if(origRole === 'ruler'){
      return 'warlord_remnant';  // 原势力之主（如袁绍、吕布）
    }
    if(origFac){
      // 与原势力君主同clan（如马超/马岱与马腾）
      const origRuler = Object.values(GENS_FULL).flat().find(g =>
        GENS_FULL[origFac]?.some(og => og.name === g.name) && g.role === 'ruler'
      );
      if(origRuler){
        const rulerMeta = getGenMeta(origRuler.name);
        const genMeta   = getGenMeta(name);
        if(genMeta.clan && rulerMeta.clan && genMeta.clan === rulerMeta.clan){
          return 'warlord_remnant';  // 原势力宗亲（如马岱与马腾）
        }
      }
    }
    return 'defector';
  }
  if(sen === 'newcomer') return 'newcomer';

  // origin/home 归类（适用于 member / elder）
  // 宗亲：与当前势力君主同clan（不看origin标签，避免跨势力污染）
  if(_isClanRoyalty(name, fid)) return 'royalty';
  // ★ v124: 旧阀贵族（origin:'noble'且不是本族宗亲）→ noble派系
  if(tags.origin === 'noble') return 'noble';
  // ★ v172: gentry 归入士族派系 — 优先 clique（客居集团），否则按 state 查 gentry_fac
  if(tags.origin === 'gentry'){
    if(tags.clique === 'dongzhou') return 'gentry_dongzhou';
    if(tags.clique === 'huaisi')   return 'gentry_huaisi';
    return STATE_TO_GENTRY_FAC[tags.state] || 'gentry_zhongyuan';
  }
  // v172: magnate（地方豪族/商贾/豪帅）始终归 humble 派系（寒门豪族），不参与士族话语权
  if(tags.origin === 'magnate') return 'humble';
  // humble / 非士族-非宗族 → 按政治值判断
  // pol >= 70 → 可能是士族出身（文官型）；否则寒门武将
  if(gen.pol >= 70) return 'gentry_zhongyuan';
  return 'humble';
}

/** 单武将影响力值
 *  ★ v172: 按势力 stage（军阀/一方之主/政权）差异化乘数
 *
 *  数值表（完整）：
 *                   | 军阀   | 一方之主     | 政权
 *  founding         | 3.0    | 2.25         | 1.5
 *  royalty          | 2.0    | 1.5          | 1.0
 *  gentry anchor州  | —      | 1.5          | —
 *  gentry 本土非anchor| 1.0  | 0.8          | 1.2
 *  gentry 外地      | 1.0    | 0.8          | 0.8
 *  gentry_dongzhou/huaisi | 0.8 | 0.8       | 0.8（永远客居）
 *  noble/warlord_remnant/humble/defector/newcomer | baseMult 不变
 */
function _genInfluence(gen, fid){
  const faction = getGenFaction(gen.name, fid);
  const def = FACTION_DEFS.find(f => f.id === faction);
  let mult = def ? def.baseMult : 1.0;
  const stage = getStage(fid);
  const anchor = getAnchorState(fid);

  // 创始/宗亲：军阀 ×2，一方之主 ×1.5，政权 ×1（即恢复 baseMult）
  if(faction === 'founding' || faction === 'royalty'){
    if(stage === 'warlord')       mult = def.baseMult * 2.0;
    else if(stage === 'regional') mult = def.baseMult * 1.5;
    // regime: 使用 baseMult 不变
  }
  // 地域士族：分 anchor 州 / 本土 / 外地
  // ★ v178 fix #9: gentryStates 必须非空——dongzhou/huaisi 是 [] 永远客居（baseMult 0.8 不变），不进 stage 化分支
  else if(def && def.gentryStates && def.gentryStates.length > 0){
    const gStates = def.gentryStates;
    const isHome = gStates.some(s =>
      (STATE_CITIES[s] || []).some(cid => G.cities[cid] && G.cities[cid].fac === fid)
    );
    const isAnchorGentry = anchor && gStates.includes(anchor);
    if(stage === 'warlord'){
      mult = 1.0; // 军阀无本地加成，所有士族一律基准
    } else if(stage === 'regional'){
      if(isAnchorGentry)   mult = 1.5;       // anchor 州士族崛起
      else                 mult = 0.8;       // 其他士族（含本土非anchor+外地）统一压制
    } else { // regime
      mult = isHome ? 1.2 : 0.8;
    }
  }
  // 客居集团（dongzhou/huaisi）：所有阶段都是客居 0.8（已是 baseMult）

  // ★ D1: 官职影响力倍率（tier1=×1.4, tier2=×1.2, tier3=×1.1）
  const postDef = getGenPostDef(gen.name);
  if(postDef){
    if(postDef.tier===1) mult *= 1.4;
    else if(postDef.tier===2) mult *= 1.2;
    else mult *= 1.1;
  }
  // ★ v163: 部曲影响力加成（每500部曲+1基础影响力）
  const _retInf = Math.floor(getRetainers(gen.name) / RETAINER_INFLUENCE_DIV);
  return mult * gen.pol / 100 + _retInf * 0.1;
}

// 政治链 P4 (派系影响力 _facInfluenceCache lets + calcFactionInfluence,L4921-L4952) 已抽离到 src/chains/politics.js

/** 每旬派系忠诚修正（在processLoyalty之后调用） */
// ★ v113: S型曲线——中间段温和，两端急剧
function factionModToLoyaltyDelta(mod) {
  const sign = Math.sign(mod);
  const abs = Math.abs(mod);
  if (abs <= 8)  return mod * 0.05;
  if (abs <= 15) return sign * (0.40 + (abs - 8) * 0.12);
  return sign * (1.24 + (abs - 15) * 0.25);
}

function processFactionLoyalty(){
  if(!G.genFactionMod) G.genFactionMod = {};

  getScenarioFactions().forEach(fid => {
    const gens = (G.generals[fid] || []).filter(g => g.role !== 'ruler');
    if(!gens.length) return;

    const inf = calcFactionInfluence(fid);
    const totalInf = inf.total || 1; // ★ v149fix: 防除零（全员阵亡时total=0）
    const fi = inf.factions;

    // ── 每旬长期类修正 ──

    // ★ v71 Bug2修复：删除战争streak持续影响（鹰/鸽只通过一次性事件触发）

    // 1. 派系占高位 >40%（太守/官职）→ 该派系+0.20/旬
    //    ★ v71 Bug1修复：删除「未占高位 -0.08/旬」默认惩罚，只保留正向奖励
    //    ★ D1: 官职tier1+tier2也算高位
    const prefectFacs = {};
    Object.values(G.cities).filter(c => c.fac === fid && c.prefect).forEach(c => {
      const f = getGenFaction(c.prefect, fid);
      if(f) prefectFacs[f] = (prefectFacs[f]||0) + 1;
    });
    // 官职tier1+tier2纳入高位统计
    getFacPosts(fid).forEach(({genName, postDef})=>{
      if(postDef.tier <= 2){
        const f = getGenFaction(genName, fid);
        if(f) prefectFacs[f] = (prefectFacs[f]||0) + 1;
      }
    });
    const totalPrefects = Object.values(prefectFacs).reduce((a,b)=>a+b,0) || 1;

    // 2. 降将担任太守
    const defectorAsPrefect = (prefectFacs['defector']||0) > 0;

    // 3. 派系紧张关系
    const defectorInf       = fi['defector']?.influence       || 0;
    const newcomerInf       = fi['newcomer']?.influence       || 0;
    const royaltyInf        = fi['royalty']?.influence        || 0;
    const warlordRemnantInf = fi['warlord_remnant']?.influence || 0;
    const defectorRatio     = defectorInf / totalInf;
    const newcomerRatio     = newcomerInf / totalInf;
    const royaltyRatio      = royaltyInf / totalInf;
    const warlordRatio      = warlordRemnantInf / totalInf;

    gens.forEach(gen => {
      const name = gen.name;
      const mainFac = getGenFaction(name, fid);
      if(!G.genFactionMod[name]) G.genFactionMod[name] = 0;

      let mod = 0;

      // 某派系占高位 >40%：只给该派系正向加成
      if(mainFac && (prefectFacs[mainFac]||0)/totalPrefects > 0.4) mod += 0.20;

      // 降将任太守：降将+0.15/旬，创始团队-0.10/旬
      if(defectorAsPrefect){
        if(mainFac === 'defector') mod += 0.15;
        if(mainFac === 'founding') mod -= 0.10;
      }

      // 派系紧张：被压制方受损
      if(mainFac === 'founding'){
        if(defectorRatio > 0.10)     mod -= 0.15;
        if(newcomerRatio > 0.15)     mod -= 0.10;
        if(warlordRatio  > 0.25)     mod -= 0.25;
        else if(warlordRatio > 0.15) mod -= 0.15;
      }
      // ★ v73：localGentry vs outGentry 紧张关系已移除（五大地域士族各自独立，不互相压制）
      if(mainFac !== 'royalty' && royaltyRatio > 0.40) mod -= 0.10;

      // ★ v71 新增：派系边缘化惩罚（影响力占比过低 → 被冷落感）
      // SKILL_INLINE: wuqi_threshold — 李严误期：当官时阈值缩小
      const _liyanA = hasFacGen(fid,'李严') && genHasOffice('李严',fid);
      const _isoT = _liyanA ? 0.03 : 0.05;
      const _weakT = _liyanA ? 0.07 : 0.10;
      // ★ v155fix: 宗亲/创始团队豁免边缘化（与v111 UI层豁免对齐）
      if(mainFac && mainFac !== 'royalty' && mainFac !== 'founding'){
        const facRatio = (fi[mainFac]?.influence || 0) / totalInf;
        if(facRatio > 0 && facRatio < _isoT)       mod -= 0.25;  // 严重边缘化
        else if(facRatio > 0 && facRatio < _weakT)  mod -= 0.15;  // 边缘化
      }

      // 累积并clamp
      G.genFactionMod[name] = Math.max(-20, Math.min(20, (G.genFactionMod[name]||0) + mod));
    });
  });
}

// ★ v113: 派系平均mod（某势力某派系标签下所有非ruler武将的平均genFactionMod）
function getAvgFactionMod(fid, genFacId) {
  const gens = (G.generals[fid] || []).filter(g => g.role !== 'ruler');
  let sum = 0, count = 0;
  gens.forEach(g => {
    if (getGenFaction(g.name, fid) === genFacId) {
      sum += (G.genFactionMod?.[g.name] || 0);
      count++;
    }
  });
  return count > 0 ? sum / count : 6; // 默认6=安全区中间
}

// ★ v113: 派系士气常数overlay（挂在部队上，实时反映）
// avgMod范围[-20,+20], 安全区[-15,+15]=0, 超出后线性到±30
// ≤-15: (avg+15)*6 → -15→0, -20→-30
// ≥+15: (avg-15)*6 → +15→0, +20→+30
function getFactionMoraleMod(genName, fid) {
  const facId = getGenFaction(genName, fid);
  if (!facId) return 0;
  const avg = getAvgFactionMod(fid, facId);
  const _safeZone = 15 + getTechEffect(fid, 'factionSafeZone'); // ★ v115: 九品中正/天下为公
  if (avg <= -_safeZone) return Math.max(-30, Math.round((avg + _safeZone) * 6));
  if (avg >= _safeZone) return Math.min(30, Math.round((avg - _safeZone) * 6));
  return 0;
}

/** 事件类派系忠诚触发（供外部钩子调用）
 *  eventType: 'execute'|'defectorPrefect'|'conquer'|'truce'|'warDeclare'|'betray'
 *             |'appointPost'|'removePost'  ★ v73 新增：任命/卸任官职
 *  fid: 发生事件的势力
 *  extra: 附加数据（如 {killedFaction, appointedGen, removedGen}）
 */
function triggerFactionEvent(eventType, fid, extra){
  if(!G.genFactionMod) G.genFactionMod = {};
  if(!G.genFactionModLog) G.genFactionModLog = {}; // ★ v94: 事件日志
  const gens = (G.generals[fid] || []).filter(g => g.role !== 'ruler');
  const EVENT_LABELS = {
    execute:'武将身死', defectorPrefect:'降将任太守', conquer:'占领新城', // D-046 fix: '处决武将'→'武将身死' (killGen 4 路径战死/单挑死/处决/大乱共用此 eventType, 中性 label)
    truce:'停战/结盟', warDeclare:'宣战', betray:'外交背刺',
    appointPost:'任命官职', removePost:'卸任官职',
  };
  const eventLabel = EVENT_LABELS[eventType] || eventType;

  gens.forEach(gen => {
    const name = gen.name;
    const mainFac = getGenFaction(name, fid);
    const tags = GEN_TAGS[name] || {};
    if(!G.genFactionMod[name]) G.genFactionMod[name] = 0;
    let delta = 0;

    if(eventType === 'execute'){
      // 处决武将 → 被处决者所在派系全体 -5
      const killedFac = extra?.killedFaction;
      if(killedFac && mainFac === killedFac) delta = -5;
    } else if(eventType === 'defectorPrefect'){
      // 降将被任命太守 → 创始团队 -3
      if(mainFac === 'founding') delta = -3;
    } else if(eventType === 'conquer'){
      // 占领新城 → 鹰派 +3
      if(tags.combat === 'hawk') delta = 3;
    } else if(eventType === 'truce'){
      // 停战/结盟 → 鸽派+3，鹰派-1
      if(tags.combat === 'dove') delta = 3;
      if(tags.combat === 'hawk') delta = -1;
    } else if(eventType === 'warDeclare'){
      // 宣战 → 鹰派+2，鸽派-1
      if(tags.combat === 'hawk') delta = 2;
      if(tags.combat === 'dove') delta = -1;
    } else if(eventType === 'betray'){
      // 外交背刺 → 尊汉+士族 -4
      if(tags.politics === 'uniHan' && tags.origin === 'gentry') delta = -4;
    } else if(eventType === 'appointPost'){
      // ★ v73 任命太守/军师 → 被任命者所在派系全体 +2（凝聚感）
      const apFac = extra?.appointedFaction;
      if(apFac && mainFac === apFac) delta = 2;
    } else if(eventType === 'removePost'){
      // ★ v73 卸任太守/军师 → 被卸任者所在派系全体 -1
      const rmFac = extra?.removedFaction;
      if(rmFac && mainFac === rmFac) delta = -1;
    }

    if(delta !== 0){
      G.genFactionMod[name] = Math.max(-20, Math.min(20, G.genFactionMod[name] + delta));
      // ★ v94: 记录事件日志（最多保留最近8条）
      if(!G.genFactionModLog[name]) G.genFactionModLog[name] = [];
      G.genFactionModLog[name].push({turn:G.turn, event:eventLabel, delta, after:G.genFactionMod[name]});
      if(G.genFactionModLog[name].length > 8) G.genFactionModLog[name].shift();
    }
  });
}

/** 派系修正明细分解（用于UI透明化展示）
 *  返回 { items:[{label,delta,type}], currentMod, facDelta }
 *  type: 'good'|'bad'|'neutral'
 */
function getGenFactionModBreakdown(genName, fid){
  const tags = GEN_TAGS[genName] || {};
  const mainFac = getGenFaction(genName, fid);
  const inf = calcFactionInfluence(fid);
  const fi = inf.factions;
  const totalInf = inf.total || 1; // ★ v135fix: 防除零（全员阵亡时total=0）

  const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');

  // 重算各比率（同 processFactionLoyalty）
  const defectorRatio = (fi['defector']?.influence||0)/totalInf;
  const newcomerRatio = (fi['newcomer']?.influence||0)/totalInf;
  const royaltyRatio  = (fi['royalty']?.influence||0)/totalInf;
  const warlordRatio  = (fi['warlord_remnant']?.influence||0)/totalInf;

  // 降将是否担任太守
  const defectorAsPrefect = Object.values(G.cities||{}).some(city=>{
    if(!city.prefect || city.fac !== fid) return false;
    return getGenFaction(city.prefect, fid) === 'defector';
  });

  // 高位占比（太守+军师）
  const allPosts = [];
  Object.values(G.cities||{}).forEach(c=>{ if(c.fac===fid && c.prefect) allPosts.push(c.prefect); });
  if(G.factions[fid]?.strategist) allPosts.push(G.factions[fid].strategist);
  const totalPrefects = allPosts.length;
  const prefectFacs = {};
  allPosts.forEach(n=>{ const f=getGenFaction(n,fid); prefectFacs[f]=(prefectFacs[f]||0)+1; });

  const items = [];

  // ① 高位占比奖励
  if(mainFac && totalPrefects>0 && (prefectFacs[mainFac]||0)/totalPrefects > 0.4){
    items.push({label:'本派系占据高位（太守/军师>40%）', delta:+0.20, type:'good'});
  }

  // ② 降将任太守
  if(defectorAsPrefect){
    if(mainFac==='defector') items.push({label:'本派系武将担任太守', delta:+0.15, type:'good'});
    if(mainFac==='founding') items.push({label:'降将担任太守，创始团队不满', delta:-0.10, type:'bad'});
  }

  // ③ 派系紧张
  if(mainFac==='founding'){
    if(defectorRatio>0.10) items.push({label:`降将影响力过高（${Math.round(defectorRatio*100)}%）`, delta:-0.15, type:'bad'});
    if(newcomerRatio>0.15) items.push({label:`新附武将影响力过高（${Math.round(newcomerRatio*100)}%）`, delta:-0.10, type:'bad'});
    if(warlordRatio>0.25)  items.push({label:`旧阀遗族势力过大（${Math.round(warlordRatio*100)}%）`, delta:-0.25, type:'bad'});
    else if(warlordRatio>0.15) items.push({label:`旧阀遗族影响力扩张（${Math.round(warlordRatio*100)}%）`, delta:-0.15, type:'bad'});
  }
  if(mainFac!=='royalty' && royaltyRatio>0.40){
    items.push({label:`宗亲占据过多影响力（${Math.round(royaltyRatio*100)}%）`, delta:-0.10, type:'bad'});
  }

  // ④ 边缘化
  // SKILL_INLINE: wuqi_threshold — 李严误期：当官时孤立阈值缩小（更少人被判定孤立）
  const _liyanActive = hasFacGen(fid,'李严') && genHasOffice('李严',fid);
  const _isolateThresh = _liyanActive ? 0.03 : 0.05;
  const _weakThresh    = _liyanActive ? 0.07 : 0.10;
  // ★ v155fix: 宗亲/创始团队豁免边缘化（与v111 UI层豁免对齐）
  if(mainFac && mainFac !== 'royalty' && mainFac !== 'founding'){
    const facRatio = (fi[mainFac]?.influence||0)/totalInf;
    const facLabel = FACTION_DEFS.find(f=>f.id===mainFac)?.label || mainFac;
    if(facRatio>0 && facRatio<_isolateThresh){
      items.push({label:`${facLabel}孤立无援（影响力仅${Math.round(facRatio*100)}%）`, delta:-0.25, type:'bad'});
    } else if(facRatio>0 && facRatio<_weakThresh){
      items.push({label:`${facLabel}势单力薄（影响力${Math.round(facRatio*100)}%）`, delta:-0.15, type:'bad'});
    }
  }

  const currentMod = (G.genFactionMod && G.genFactionMod[genName]) || 0;
  const facDelta = currentMod * 0.05;

  return { items, currentMod, facDelta };
}

// ════════════════════════════════════════════════════════════════════
// ── GEN6 chronicle (v181 L3506-L3514) ──
// ════════════════════════════════════════════════════════════════════

function addGenChronicle(genName, text){
  if(!G.genChronicle) return;
  if(!G.genChronicle[genName]) G.genChronicle[genName]=[];
  const yearStr=YEARS[G.year]||`第${G.year+1}年`;
  const seasonStr=SEASONS[G.seasonIdx]||'';
  G.genChronicle[genName].push({turn:G.turn,yearStr,seasonStr,text});
  // 最多保留30条
  if(G.genChronicle[genName].length>30) G.genChronicle[genName].shift();
}

// ════════════════════════════════════════════════════════════════════
// ── GEN7 招募 (v181 L3790-L4108) ──
// ════════════════════════════════════════════════════════════════════

function getAllRecruitedNames(){
  const s = new Set();
  Object.values(G.generals).forEach(arr => arr.forEach(g => s.add(g.name)));
  return s;
}

/** 刷新在野武将池（从 WILD_GENS 中随机抽取，排除已被招募者和未到出场时间者） */
function refreshWildPool(){
  const recruited = getAllRecruitedNames();
  const available = getAllWildGenDefs().filter(g =>
    !recruited.has(g.name) &&
    G.turn >= (g.minTurn || 1)   // 未到出场时间的武将不进池
  );
  const shuffled = _shuffleFY([...available]); // ★ v179fix P39
  // ★ v152: 举孝廉bonus — 额外增加在野武将数
  let extraSlots = 0;
  if(G._juxiaolianBonus){
    getScenarioFactions().forEach(fid => {
      if(G._juxiaolianBonus[fid] > 0){
        extraSlots += G._juxiaolianBonus[fid];
        delete G._juxiaolianBonus[fid];
      }
    });
  }
  G.wildPool = shuffled.slice(0, WILD_POOL_SIZE + extraSlots).map(g => g.name);
  G.wildPoolTurn = G.turn;
}

/**
 * ★ B2: 计算同州士族招募加成（v172: region→state）
 * 势力内同state的武将越多，招募同state在野武将的成功率越高
 * 返回 {bonus: number, count: number, state: string}
 * bonus = min(count * 0.05, 0.20)  → 每人+5%，上限+20%（4人封顶）
 */
function calcRegionRecruitBonus(genName, fid){
  const wildTag = GEN_TAGS[genName];
  if(!wildTag || !wildTag.state) return {bonus:0, count:0, state:''};
  const targetState = wildTag.state;
  // 统计该势力中同state的武将人数（不含在野武将自身）
  const myGens = G.generals[fid] || [];
  const sameStateCount = myGens.filter(g => {
    const tag = GEN_TAGS[g.name];
    return tag && tag.state === targetState;
  }).length;
  const bonus = Math.min(sameStateCount * 0.05, 0.20);
  return {bonus, count: sameStateCount, state: targetState};
}

/**
 * ★ B5: 计算同clan/宗亲招募加成
 * 势力内有同clan的武将→+10%；有2人以上→+15%（封顶）
 * 返回 {bonus: number, count: number, clan: string}
 */
function calcClanRecruitBonus(genName, fid){
  const wildMeta = getGenMeta(genName);
  const wildClan = wildMeta?.clan;
  if(!wildClan) return {bonus:0, count:0, clan:''};
  const myGens = G.generals[fid] || [];
  const sameCount = myGens.filter(g => {
    const meta = getGenMeta(g.name);
    return meta && meta.clan && meta.clan === wildClan;
  }).length;
  const bonus = sameCount >= 2 ? 0.15 : sameCount === 1 ? 0.10 : 0;
  return {bonus, count: sameCount, clan: wildClan};
}

/**
 * ★ B5: 计算同士族圈招募加成
 * gentry字段如"颍川名士"/"颍川名门"，按地域前缀匹配（前2字相同即同圈）
 * 每人+4%，上限+12%（3人封顶）
 * 返回 {bonus: number, count: number, gentry: string}
 */
function calcGentryRecruitBonus(genName, fid){
  const wildMeta = getGenMeta(genName);
  const wildGentry = wildMeta?.gentry;
  if(!wildGentry || wildGentry.length < 2) return {bonus:0, count:0, gentry:''};
  const prefix = wildGentry.slice(0, 2); // 取前两字作为地域前缀（颍川/荆州/江东/冀州...）
  const myGens = G.generals[fid] || [];
  const sameCount = myGens.filter(g => {
    const meta = getGenMeta(g.name);
    return meta?.gentry && meta.gentry.slice(0, 2) === prefix;
  }).length;
  const bonus = Math.min(sameCount * 0.04, 0.12);
  return {bonus, count: sameCount, gentry: wildGentry};
}

/**
 * 招募在野武将（通用，玩家和AI共用）
 * ★ B2: 加入同地域招募加成
 * @param {string} genName - 武将名
 * @param {string} fid - 招募方势力ID
 * @param {boolean} silent - true=AI招募（不弹通知，只log）
 * @returns {boolean} 是否成功
 */
function _doRecruitWild(genName, fid, silent){
  const fac = G.factions[fid];
  const gen = getWildGenDef(genName);
  if(!gen || !G.wildPool.includes(genName)) return false;

  // CD检查
  const cdData = G.wildRecruitCD[genName];
  if(cdData && cdData.until > G.turn) return false;

  const failCount = cdData?.failCount || 0;
  const baseCost = 1500;                          // ★ B5: 统一基础费用
  const cost = baseCost + failCount * 500;

  if(fac.res.gold < cost) return false;

  // 成功率
  const baseRate = 0.70;                           // ★ B5: 统一基础成功率
  const retryBonus = Math.min(failCount * 0.05, 0.15);
  const ruler = (G.generals[fid]||[]).find(g => g.role === 'ruler');
  const chaBonus = ruler ? Math.min(0.15, (ruler.cha - 50) / 300) : 0;
  const regionData = calcRegionRecruitBonus(genName, fid); // ★ B2
  const clanData = calcClanRecruitBonus(genName, fid);     // ★ B5
  const gentryData = calcGentryRecruitBonus(genName, fid); // ★ B5
  const courtWildBuff = getCourtDecreeBuffs(fid).recruitWild || 0; // ★ I3: 招贤令
  const finalRate = Math.min(0.92, baseRate + retryBonus + chaBonus + regionData.bonus + clanData.bonus + gentryData.bonus + courtWildBuff
    // SKILL_INLINE: jiupin_wild — 陈群九品：当官时在野招募率+5%
    + (hasFacGen(fid, '陈群') && genHasOffice('陈群', fid) ? 0.05 : 0)
    // SKILL_INLINE: shicai — 徐庶·识才：当官时在野招募率+10%
    + (hasFacGen(fid, '徐庶') && genHasOffice('徐庶', fid) ? 0.10 : 0)
  );
  const roll = Math.random();

  safeSub(fac.res, 'gold', cost);

  if(roll < finalRate){
    // 成功
    { const _cloned = _deepCloneGen(gen); G.generals[fid].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
    const meta = getGenMeta(genName);
    if(meta) G.genLoyalty[genName] = meta.loyalty ?? 70;
    if(G.loyaltyAccum) G.loyaltyAccum[genName] = G.genLoyalty[genName];
    G.genChronicle[genName] = [];
    // ★ v125: 在野武将招募后生成小传（与开局小传同一套身份标签逻辑）
    {
      const _facName = getFactionDef(fid)?.name || fid;
      const _meta = getGenMeta(genName) || {};
      const _tags = GEN_TAGS[genName] || {};
      const _identParts = [];
      if(_meta.clan){
        const _ruler = (G.generals[fid]||[]).find(g=>g.role==='ruler');
        const _rulerMeta = _ruler ? (getGenMeta(_ruler.name)) : {};
        if(_rulerMeta.clan && _meta.clan === _rulerMeta.clan) _identParts.push('宗亲');
      }
      if(_tags.origin==='gentry'){
        const _GFAC_NAMES={
          gentry_zhongyuan:'中原士族', gentry_hebei:'河北士族', gentry_xuzhou:'徐州士族',
          gentry_jingzhou:'荆州士族', gentry_yizhou:'益州士族', gentry_jiangdong:'江东士族',
          gentry_xiliang:'西凉士族', gentry_dongzhou:'东州派', gentry_huaisi:'淮泗派',
        };
        let _gf2;
        if(_tags.clique === 'dongzhou') _gf2 = 'gentry_dongzhou';
        else if(_tags.clique === 'huaisi') _gf2 = 'gentry_huaisi';
        else _gf2 = STATE_TO_GENTRY_FAC[_tags.state] || 'gentry_zhongyuan';
        if(_GFAC_NAMES[_gf2]) _identParts.push(_GFAC_NAMES[_gf2]);
      } else if(_tags.origin==='humble') _identParts.push('寒门出身');
      else if(_tags.origin==='magnate') _identParts.push('地方豪族');
      else if(_tags.origin==='noble') _identParts.push('旧阀贵族');
      else if(_tags.origin==='foreign') _identParts.push('外族出身');
      const _combatDesc={hawk:'主战',dove:'持重',neutral:''}[_tags.combat]||'';
      if(_combatDesc) _identParts.push(_combatDesc);
      const _temperDesc2={proud:'性傲',reckless:'性莽',steady:'性沉稳',cunning:'性狡黠',steadfast:'性刚毅',generous:'性仁厚'}[_tags.temperament]||'';
      if(_temperDesc2) _identParts.push(_temperDesc2);
      const _identStr = _identParts.length ? `，${_identParts.join('、')}` : '';
      const _birthStr = _meta.birthplace ? `，籍贯${_meta.birthplace}` : '';
      const _VALUE_DESC={'汉室死忠':'心系汉祚，誓扶炎刘','忠义':'忠义之士，逆境不屈','野心':'深藏不露，志在四方','投机':'善审时势，进退灵便'};
      const _valDesc = (_meta.values||[]).filter(v=>_VALUE_DESC[v]).map(v=>_VALUE_DESC[v]).join('，');
      const _valStr = _valDesc ? `。${_valDesc}` : '';
      addGenChronicle(genName, `应${_facName}之邀出仕${_identStr}${_birthStr}${_valStr}。`);
    }
    G.wildPool = G.wildPool.filter(n => n !== genName);
    delete G.wildRecruitCD[genName];
    G.genJoinTurn[genName] = G.turn;
    G.genJoinSource[genName] = 'recruit';
    // D-072 fix: 补 origFac/origRole 缓存 (latch — 仅首次写; 野招路径武将首次入仕势力即 fid)
    if(!G.genOrigFac[genName]) G.genOrigFac[genName] = fid;
    if(!G.genOrigRole[genName]) G.genOrigRole[genName] = gen.role || 'general';
    const timesStr = failCount > 0 ? `（历经${failCount+1}次邀请）` : '';
    if(!silent) showNotif(`${genName} 感念主公诚意，欣然出仕！${timesStr}`, 'success');
    log(`🌟 [${getFactionDef(fid).name}] 招募在野武将 ${genName} 成功${timesStr}`, 'event');
    return true;
  } else {
    const newFailCount = failCount + 1;
    G.wildRecruitCD[genName] = { until: G.turn + 3, failCount: newFailCount };
    const nextCost = baseCost + newFailCount * 500;
    if(!silent) showNotif(`${genName} 婉拒邀请（第${newFailCount}次），3旬后可再请，下次需${nextCost}金`, 'warn');
    log(`💨 [${getFactionDef(fid).name}] 招募 ${genName} 失败（第${newFailCount}次），耗金${cost}`, 'event');
    return false;
  }
}

/** 玩家招募在野武将（UI入口） */
function recruitWild(genName){
  const fid = G.playerFac;
  const fac = G.factions[fid];
  const gen = getWildGenDef(genName);
  if(!gen){ showNotif('武将数据异常','warn'); return; }
  if(!G.wildPool.includes(genName)){ showNotif('该武将已离开在野池','warn'); return; }
  const cdData = G.wildRecruitCD[genName];
  if(cdData && cdData.until > G.turn){
    showNotif(`${genName} 尚未回心转意，还需等待 ${cdData.until - G.turn} 旬`, 'warn');
    return;
  }
  const failCount = cdData?.failCount || 0;
  const cost = 1500 + failCount * 500;             // ★ B5: 统一基础费用
  if(fac.res.gold < cost){
    showNotif(`招募需要${cost}金（第${failCount+1}次邀请），当前不足`, 'warn');
    return;
  }
  _doRecruitWild(genName, fid, false);
  renderAllLight();
}

/**
 * ★ B3: AI势力尝试招募在野武将
 * 每3旬在runAI中调用，三家错峰（魏T%3=0, 蜀T%3=1, 吴T%3=2）
 * AI优先招募：① 同region（有加成） ② 顶属性高的
 */
function aiDoRecruitTalent(fid){
  const fac = G.factions[fid];
  if(!fac) return;
  const talentBudget = Math.min(
    Math.floor(fac.res.gold * 0.15),
    Math.floor((fac._aiBudget?.military || 0) * 0.25)
  );
  if(talentBudget < 1500) return;

  const candidates = [];

  // 来源1: 在野武将池
  G.wildPool.forEach(name => {
    const g = getWildGenDef(name);
    if(!g) return;
    const cdData = G.wildRecruitCD[name];
    if(cdData && cdData.until > G.turn) return;
    const topStat = Math.max(g.com, g.war, g.int, g.pol, g.cha);
    const failCount = cdData?.failCount || 0;
    const cost = 1500 + failCount * 500;
    if(cost > talentBudget) return;
    const regionData = calcRegionRecruitBonus(name, fid);
    const clanData = calcClanRecruitBonus(name, fid);
    const gentryData = calcGentryRecruitBonus(name, fid);
    const score = topStat + regionData.count * 10 + clanData.count * 15 + gentryData.count * 8;
    candidates.push({name, source:'wild', cost, score});
  });

  // 来源2: 可挖角武将池
  Object.entries(G.recruitableGens || {}).forEach(([name, rec]) => {
    if(rec.fid === fid) return;
    const gen = GEN_MAP[name]; // ★ v167fix #33: O(1)查找替代flat().find()
    if(!gen) return;
    const topStat = Math.max(gen.com, gen.war, gen.int, gen.pol, gen.cha);
    const cost = topStat >= 90 ? 3000 : 1500;
    if(cost > talentBudget) return;
    const regionData = calcRegionRecruitBonus(name, fid);
    const clanData = calcClanRecruitBonus(name, fid);
    const gentryData = calcGentryRecruitBonus(name, fid);
    const score = (topStat + regionData.count * 10 + clanData.count * 15 + gentryData.count * 8) * 0.8;
    candidates.push({name, source:'poach', cost, score, srcFid: rec.fid});
  });

  if(!candidates.length) return;
  candidates.sort((a, b) => b.score - a.score);
  const pick = candidates[0];

  if(pick.source === 'wild'){
    _doRecruitWild(pick.name, fid, true);
  } else {
    _aiDoPoach(pick.name, fid, pick.srcFid, pick.cost);
  }
}

function _aiDoPoach(genName, fid, srcFid, cost){
  const fac = G.factions[fid];
  const gen = GEN_MAP[genName]; // ★ v167fix #33
  if(!gen || !fac) return;
  safeSub(fac.res, 'gold', cost);

  // ★ batch-23 D-065: 改用 _calcPoachRate 共享 helper (5 项 buff 与玩家路径对称)
  const _poachRate = _calcPoachRate(genName, fid);

  if(Math.random() < _poachRate){
    // ★ v119fix: 挖角前清除原势力职务 + 从部队squads移除
    clearPrefectByGen(genName);
    clearAllPostsByGen(genName);
    if(G.factions[srcFid]?.strategist === genName) G.factions[srcFid].strategist = null;
    G.units.forEach(u => { if(u.fac === srcFid) u.squads = u.squads.filter(sq => sq.genName !== genName); });
    G.units = G.units.filter(u => u.squads.length > 0 && u.squads.some(sq => sq.troops > 0));
    if(G.selUnitId && !G.units.find(u=>u.id===G.selUnitId)) G.selUnitId=null; // ★ v179 fix #58: 防空指针
    G.generals[srcFid] = (G.generals[srcFid] || []).filter(g => g.name !== genName);
    { const _cloned = _deepCloneGen(gen); G.generals[fid].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
    G.genLoyalty[genName] = 60;
    G.loyaltyAccum[genName] = 60;
    delete G.recruitableGens[genName];
    G.genJoinTurn[genName] = G.turn;
    G.genJoinSource[genName] = 'poach'; // D-066 fix: 'capture'→'poach' (跟玩家 poachGen line 1606 对齐, 区别于 surrenderGen 兵败被俘的 'capture'; isNewDefector 判定不再混淆挖角/投降)
    // D-072 fix: 补 origFac/origRole 缓存 (latch — 仅首次写; 挖角路径 origFac=srcFid 是被挖前所属势力)
    if(!G.genOrigFac[genName]) G.genOrigFac[genName] = srcFid;
    if(!G.genOrigRole[genName]) G.genOrigRole[genName] = gen.role || 'general';
    setRetainers(genName, 0); // ★ v163: 叛逃/被挖角→部曲归零
    addDiplo(fid, srcFid, -15); // ★ v179fix P16: 原仅 G.diplo[minFid-maxFid] 单向写入；G.diplo 双键真双向，反向 key 不更新会让对方下旬外交读到旧 rel
    addGenChronicle(genName, `${getFactionDef(fid)?.name||fid}以厚礼相邀，${genName}遂转投之。`);
    // ★ v161: 叛逃→属县家族忠诚冲击-15
    applyFamilyLoyaltyShock(srcFid, (GEN_TAGS[genName]||{}).clan, -15);
    log(`🎯 [AI] ${getFactionDef(fid)?.name} 成功挖角 ${genName}（原属${getFactionDef(srcFid)?.name}），外交-15`, 'diplo');
  } else {
    log(`❌ [AI] ${getFactionDef(fid)?.name} 挖角 ${genName} 失败，耗金${cost}`, 'event');
  }
}

// ─── 亲密度阈值弹窗 ────────────────────────────────────
// 当某对武将首次跨越 +75（义兄弟）或 -75（宿敌）时弹一次提示
// G.intimacyNotified 记录已弹过的key，防止重复

// ════════════════════════════════════════════════════════════════════
// ── GEN8 亲密度阈值 (v181 L4109-L4171) ──
// ════════════════════════════════════════════════════════════════════

function checkIntimacyThresholds(){
  if(!G.intimacy) return;
  if(!G.intimacyNotified) G.intimacyNotified = {};
  const entries = Object.entries(G.intimacy);
  for(const [key, val] of entries){
    // 只关心玩家势力武将
    const [nameA, nameB] = key.split('|');
    const aInPlayer = G.generals[G.playerFac]?.some(g=>g.name===nameA||g.name===nameB);
    if(!aInPlayer) continue;

    if(val >= 75 && !G.intimacyNotified[key+'_pos']){
      G.intimacyNotified[key+'_pos'] = true;
      const facA = Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(g=>g.name===nameA))||'';
      const facB = Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(g=>g.name===nameB))||'';
      const colA = getFactionDef(facA)?.color||'#6b5530';
      const colB = getFactionDef(facB)?.color||'#6b5530';
      _showIntimacyAlert(nameA, nameB, val, 'bond', colA, colB);
      return; // 每旬最多弹一条，避免一旬多条叠弹
    }
    if(val <= -75 && !G.intimacyNotified[key+'_neg']){
      G.intimacyNotified[key+'_neg'] = true;
      const facA = Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(g=>g.name===nameA))||'';
      const facB = Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(g=>g.name===nameB))||'';
      const colA = getFactionDef(facA)?.color||'#6b5530';
      const colB = getFactionDef(facB)?.color||'#6b5530';
      _showIntimacyAlert(nameA, nameB, val, 'rival', colA, colB);
      return;
    }
  }
}

/**
 * 弹出亲密度阈值提示（非阻塞，插入到待显示队列）
 * type: 'bond'（义兄弟）| 'rival'（宿敌）
 */
function _showIntimacyAlert(nameA, nameB, val, type, colA, colB){
  const isBond = type === 'bond';
  const BOND_NARRATIVES = [
    `${nameA}与${nameB}久历烽火，肝胆相照，已结为生死之交。`,
    `${nameA}与${nameB}并肩征战，情义深厚，誓共此生荣辱。`,
    `${nameA}赞${nameB}道：「此人乃我平生第一知己。」`,
  ];
  const RIVAL_NARRATIVES = [
    `${nameA}与${nameB}积怨已深，视若仇敌，水火不容。`,
    `${nameB}怒道：「此仇不共戴天，必除${nameA}而后快！」`,
    `${nameA}与${nameB}势如冰炭，诸将皆知，再难同堂共事。`,
  ];
  const pool = isBond ? BOND_NARRATIVES : RIVAL_NARRATIVES;
  const narrative = pool[Math.floor(Math.random()*pool.length)];
  const icon = isBond ? '💛' : '⚔';
  const title = isBond ? '义结金兰' : '积怨成仇';
  const borderCol = isBond ? 'rgba(138,106,16,.4)' : 'rgba(192,48,48,.4)';
  const bgCol = isBond ? 'rgba(138,106,16,.05)' : 'rgba(192,48,48,.05)';
  const titleCol = isBond ? '#8a7040' : '#c03030';

  // 用 log panel 推一条特殊事件（非阻塞，不打断游戏流程）
  const timeStr = (YEARS[G.year]||`第${G.year+1}年`) + (SEASONS[G.seasonIdx]||'');
  log(`${icon} 【${title}】${timeStr} · ${narrative}`, 'event');

  // 同时写入双方小传
  addGenChronicle(nameA, `${icon}${title}：与${nameB}${isBond?'义结金兰，情同手足':'积怨至极，视若仇敌'}。`);
  addGenChronicle(nameB, `${icon}${title}：与${nameA}${isBond?'义结金兰，情同手足':'积怨至极，视若仇敌'}。`);
}

// ════════════════════════════════════════════════════════════════════
// ── GEN9 忠诚 + 挖角 (v181 L4214-L4643) ──
// ════════════════════════════════════════════════════════════════════

function calcLoyaltyDelta(genName, fid){
  const ruler = (G.generals[fid]||[]).find(g=>g.role==='ruler');
  const rulerCha = ruler ? ruler.cha : 60;
  const rulerCompat = ruler ? (COMPAT[ruler.name]??50) : 50;
  const genCompat = COMPAT[genName]??50;
  const compatDiff = Math.abs(genCompat - rulerCompat);
  const meta = getGenMeta(genName);
  const values = meta.values||[];
  const hasPost = hasAnyPost(genName, fid);
  const postDef = getGenPostDef(genName);
  const debtRatio = G.factions[fid]?._salaryDebt||0;
  const debtTurns = G.factions[fid]?._salaryDebtTurns||0;
  const facMod = (G.genFactionMod&&G.genFactionMod[genName])||0;
  const items = [];
  let total = 0;

  // ① 基础衰减
  items.push({label:'基础衰减', val:-0.5});
  total -= 0.5;

  // ② 君主魅力
  const chaBonus = (rulerCha-60)/10*0.05;
  items.push({label:`君主魅力（${ruler?.name||'?'} ${rulerCha}）`, val:chaBonus});
  total += chaBonus;

  // ③ 相性
  let compatDelta = 0;
  if(compatDiff<=10) compatDelta=0.30;
  else if(compatDiff<=25) compatDelta=0.10;
  else if(compatDiff<=40) compatDelta=0;
  else if(compatDiff<=60) compatDelta=-0.20;
  else compatDelta=-0.45;
  items.push({label:`相性差 ${compatDiff}`, val:compatDelta});
  total += compatDelta;

  // ④ 性格标签
  if(values.includes('忠义')){
    items.push({label:'忠义', val:0.20}); total+=0.20;
  }
  // ★ v124: 野心/投机差异化
  if(values.includes('野心')){
    items.push({label:'野心', val:-0.40}); total-=0.40;
  }
  if(values.includes('投机')){
    items.push({label:'投机', val:-0.30}); total-=0.30;
  }

  // ⑤ 官职
  if(postDef){
    const isAmb = values.includes('野心')||values.includes('投机');
    const lBonus = isAmb ? postDef.loyalty*1.5 : postDef.loyalty;
    items.push({label:`官职（${postDef.name}）${isAmb?'×1.5':''}`, val:lBonus}); total+=lBonus;
  } else if(hasPost){
    items.push({label:'太守', val:0.20}); total+=0.20;
  }

  // ⑥ 野心/投机无官
  if(values.includes('野心')&&!hasPost){
    items.push({label:'野心且无官', val:-0.30}); total-=0.30;
  }
  if(values.includes('投机')&&!hasPost){
    items.push({label:'投机且无官', val:-0.20}); total-=0.20;
  }

  // ⑥b TEMPERAMENT: proud无官额外-0.15
  const _temper = (GEN_TAGS[genName]||{}).temperament;
  if(_temper === 'proud' && !hasPost){
    items.push({label:'性情（傲）且无官', val:-0.15}); total-=0.15;
  }

  // ⑦ 同僚关系（★ v167fix #5: 只遍历本势力将领，敌方亲密度不应算同僚加分）
  const _factionGens = (G.generals[fid]||[]).map(x=>x.name);
  const relVals = [];
  _factionGens.forEach(other=>{
    if(other===genName) return;
    const iv = getIntimacy(genName, other);
    if(Math.abs(iv)>=20) relVals.push(iv);
  });
  if(relVals.length>0){
    const avg = relVals.reduce((a,b)=>a+b,0)/relVals.length;
    const relDelta = avg/300;
    if(Math.abs(relDelta)>=0.01){
      items.push({label:`同僚关系（均${avg.toFixed(0)}）`, val:relDelta}); total+=relDelta;
    }
  }

  // ⑧ 欠饷
  if(debtRatio>0){
    const depthMult = debtTurns>=10?2.0:debtTurns>=5?1.5:1.0;
    const debtPenalty = -(debtRatio*1.0*depthMult);
    items.push({label:`欠饷（${(debtRatio*100).toFixed(0)}%×${depthMult}）`, val:debtPenalty}); total+=debtPenalty;
  }

  // 派系修正（★ v113: S型曲线）
  const facDelta = factionModToLoyaltyDelta(facMod);
  if(Math.abs(facDelta)>=0.01){
    items.push({label:`派系修正（mod ${facMod>=0?'+':''}${facMod.toFixed(1)}）`, val:facDelta}); total+=facDelta;
  }

  // ★ batch-24 D-052: 补 2 项 UI 缺(主 tick processLoyalty 已有,UI 漏显示)
  // ★ v115: 恩威并施科技 loyaltyRecovery
  const _techLoyalty = getTechEffect(fid, 'loyaltyRecovery');
  if(Math.abs(_techLoyalty)>=0.01){
    items.push({label:'恩威并施(科技)', val:_techLoyalty}); total+=_techLoyalty;
  }
  // SKILL_INLINE: gangbi_loyalty — 刘封刚愎: 忠诚缓降 -0.1/旬
  if(genName==='刘封'){
    items.push({label:'刘封·刚愎', val:-0.10}); total-=0.10;
  }

  // ⑨ 价值观匹配（★ v151）
  const _eth = G.factions[fid]?.ethos;
  if(_eth){
    const _gt = GEN_TAGS[genName] || {};
    let ethDelta = 0;
    // 天命 vs politics
    if(_gt.politics === 'uniHan' && _eth.mandate > 0) ethDelta -= _eth.mandate / 150;       // 崇汉武将不满篡汉势力
    else if(_gt.politics === 'uniHan' && _eth.mandate < 0) ethDelta -= _eth.mandate / 300;   // 崇汉武将认同崇汉势力（正值）
    if(_gt.politics === 'warlord' && _eth.mandate < 0) ethDelta += _eth.mandate / 150;       // 枭雄不满崇汉势力
    // 武略 vs combat
    if(_gt.combat === 'dove' && _eth.military > 20) ethDelta -= (_eth.military - 20) / 200;  // 鸽派不满铁血
    if(_gt.combat === 'hawk' && _eth.military < -20) ethDelta -= (-_eth.military - 20) / 200;// 鹰派不满怀柔
    if(Math.abs(ethDelta) >= 0.01){
      items.push({label:`价值观${ethDelta>0?'契合':'相悖'}`, val:+ethDelta.toFixed(2)}); total+=ethDelta;
    }
  }

  return { items, total };
}

function processLoyalty(){
  if(!G.loyaltyAccum) G.loyaltyAccum = {};
  if(!G.recruitableGens) G.recruitableGens = {};

  // ★ batch-24 D-052: 改用 calcLoyaltyDelta 共享 helper (UI vs 主 tick 公式完全对齐, 4 项双向缺漏统一)
  // 之前 inline 公式漏 ⑥b proud 无官 -0.15 + ⑨ 价值观 ethDelta (UI 已有, 主 tick 漏跟上 v93/v151 设计)
  Object.keys(G.generals).forEach(fid => {
    const gens = G.generals[fid] || [];
    if(!gens.length) return;
    gens.forEach(g => {
      if(g.role === 'ruler') return;
      const name = g.name;
      if(G.loyaltyAccum[name] === undefined) G.loyaltyAccum[name] = G.genLoyalty[name] ?? 80;
      const result = calcLoyaltyDelta(name, fid);
      G.loyaltyAccum[name] = Math.min(100, Math.max(0, G.loyaltyAccum[name] + result.total));
      G.genLoyalty[name] = Math.round(G.loyaltyAccum[name]);
    });
  });
}

/**
 * 事件驱动型忠诚度扣减（战败一次性大幅冲击）
 * @param {string} fid      - 受影响势力
 * @param {string} type     - 'battle_loss'（仅此一种 type；audit pass 1 D-053 删 city_lost/siege_broken 死代码,丢城忠诚通过 processLoyalty 势力衰退维度间接体现）
 * @param {Object} context  - 附加信息（如 {lostRatio}）
 */
function applyLoyaltyEvent(fid, type, context){
  const gens = G.generals[fid] || [];
  if(!gens.length) return;

  let penalty = 0;
  let msg = '';

  if(type === 'battle_loss'){
    // 战败：惩罚力度取决于损失比例
    const lostRatio = context?.lostRatio || 0.3;  // 0~1
    penalty = -(lostRatio * 8);  // 全军覆没 -8；损失30% → -2.4
    penalty = Math.max(-8, penalty);
    msg = `因战败，${getFactionDef(fid)?.name||fid}诸将士气消沉，忠心有所动摇`;
  }
  // D-053 fix: city_lost / siege_broken 分支删除 (audit verdict=closes via deletion).
  // 历史:HANDOVER 设想"失城/破围 → 忠诚震荡",但调用方从未实装,实际是 dead code 多年.
  // 设计意图:丢城后的忠诚下滑由 processLoyalty 内的"势力衰退"维度间接体现 (城少→势弱→人心涣散),
  // 不需要显式事件触发. 若未来要实装显式事件,在此处恢复分支即可.

  if(penalty === 0) return;

  gens.forEach(g => {
    if(g.role === 'ruler') return;
    const name = g.name;
    if(G.loyaltyAccum[name] === undefined) G.loyaltyAccum[name] = G.genLoyalty[name] ?? 80;

    // 忠义：逆境反而坚定，惩罚减半
    const meta = getGenMeta(name);
    const values = meta.values || [];
    const mult = (values.includes('忠义')) ? 0.5 : 1.0;

    G.loyaltyAccum[name] = Math.min(100, Math.max(0, G.loyaltyAccum[name] + penalty * mult));
    G.genLoyalty[name] = Math.round(G.loyaltyAccum[name]);
  });

  if(msg) log(`⚠ ${msg}（忠诚 ${Math.abs(penalty).toFixed(1)}）`, 'warn');
}

/**
 * 每旬末调用：检测忠诚度阈值，处理可挖角/下野逻辑
 */
function checkLoyaltyThresholds(){
  if(!G.recruitableGens) G.recruitableGens = {};

  Object.keys(G.generals).forEach(fid => {
    const gens = G.generals[fid] || [];
    gens.filter(g => g.role !== 'ruler').forEach(g => {
      const name = g.name;
      const loy = G.genLoyalty[name] ?? 80;

      // ★ v161: 入伙冷却 — 新加入9旬内不会下野/被挖角（给玩家和AI安抚时间）
      const joinTurn = G.genJoinTurn?.[name] ?? 0;
      if(G.turn - joinTurn < 9) return;

      // ── 下野（忠诚<25）──
      if(loy < 25){
        // 从势力移除
        G.generals[fid] = G.generals[fid].filter(x => x.name !== name);
        // 移除出征部队中的分队
        G.units.forEach(u => {
          u.squads = u.squads.filter(sq => sq.genName !== name);
        });
        // ★ v114fix: 清理空squads的幽灵部队
        G.units = G.units.filter(u => u.squads.length > 0 && u.squads.some(sq => sq.troops > 0));
        if(G.selUnitId && !G.units.find(u=>u.id===G.selUnitId)) G.selUnitId=null;
        // 加入在野池（若未在其中）
        if(!getWildGenDef(name)){
          // 用GENS_FULL中的数据重建在野条目（标记下野信息）
          const genData = {...g, defectedFrom: fid, defectedTurn: G.turn, minTurn: G.turn};
          addWildGenDef(genData);
        } else {
          const wg = getWildGenDef(name);
          if(wg){ wg.defectedFrom = fid; wg.defectedTurn = G.turn; wg.minTurn = G.turn; }
        }
        // D-054 fix: 池满时顶替最旧条目,保证新下野武将立即可见 (避免最多 5 旬窗口期等下次 refreshWildPool)
        // D-067 fix: 5 硬编码 → WILD_POOL_SIZE const (constants.js:618)
        if(!G.wildPool.includes(name)){
          if(G.wildPool.length >= WILD_POOL_SIZE) G.wildPool.shift();
          G.wildPool.push(name);
        }

        // 从可挖角列表移除
        delete G.recruitableGens[name];

        // 清除太守任职 + 官职 + 军师
        clearPrefectByGen(name);
        clearAllPostsByGen(name); // ★ v119fix: 下野时也清除官职
        if(G.factions[fid]?.strategist === name) G.factions[fid].strategist = null; // ★ v119fix: 下野时清除军师
        // 写入小传
        addGenChronicle(name, `因久感寒心、忠义消磨，${name}悄然离开${getFactionDef(fid)?.full||fid}，飘零江湖。`);
        log(`⚠ ${name}因忠诚过低，已离开${getFactionDef(fid)?.name||fid}势力，流落在野。`, 'warn');
        // D-057 fix: 下野清派系修正缓存,避免被新势力招募后旧 genFactionMod 污染 calcLoyaltyDelta
        if(G.genFactionMod) delete G.genFactionMod[name];
        if(G.genFactionModLog) delete G.genFactionModLog[name];

        // 通知玩家
        if(fid === G.playerFac){
          showNotif(`${name}因心灰意冷，已悄然离去！`, 'error');
        }
        return;
      }

      // ── 可挖角（忠诚<45，或任何敌方势力有唯才是举科技时<50）──
      // ★ v124: 投机标签阈值+10（更容易被挖）
      const _specMeta = getGenMeta(name);
      const _isSpeculator = ((_specMeta.values||[]).includes('投机'));
      let _poachThr = _isSpeculator ? 55 : 45;
      // ★ v131: B3④挖角脆弱标记——不予理会的武将阈值提高
      const _vuln = G._poachVulnerable?.[name];
      if(_vuln) _poachThr = Math.max(_poachThr, _vuln.threshold);
      getScenarioFactions().forEach(otherFid => {
        if(otherFid === fid) return; // 己方科技不影响己方武将被挖
        const pt = getTechEffect(otherFid, 'poachThreshold'); // 负值如-5
        // D-055 fix: 用实际 _poachThr 当基线（投机 55 / 普通 45），不再硬编码 45 失效投机标签科技 buff
        if(pt < 0) _poachThr -= pt; // pt<0 → _poachThr += |pt|，科技抬高阈值
      });
      if(loy < _poachThr){
        if(!G.recruitableGens[name]){
          G.recruitableGens[name] = { fid, since: G.turn };
          if(fid === G.playerFac){
            log(`⚠ ${name}忠诚动摇（${loy}），或有离心之意，须设法安抚。`, 'warn');
          }
        }
      } else if(loy >= _poachThr) {
        // 忠诚回升到阈值以上，移出可挖角列表
        if(G.recruitableGens[name]) delete G.recruitableGens[name];
      }
    });
  });
}

/**
 * D-065 helper: 共享挖角成功率公式 (玩家 / 传统 AI / Claude AI 三路径共用)
 * 历史 bug: 玩家公式 (poachGen) 与 AI 公式 (_aiDoPoach) 5 项 buff 不对称
 *   - 玩家独有: _techPoach (科技) / 陈群九品 / 黄权持节
 *   - AI 独有: 投机 +0.20 / cunning +0.05
 * batch-23 修法: 全 5 项 buff 进 helper, clamp 统一 [0.20, 0.85] (投机/cunning 突破 85% 的特权取消)
 */
function _calcPoachRate(genName, byFid){
  const ruler = (G.generals[byFid] || []).find(g => g.role === 'ruler');
  const chaBonus = ruler ? (ruler.cha - 60) / 100 * 0.3 : 0;
  const loyPenalty = (G.genLoyalty[genName] ?? 30) / 100 * 0.2;
  const regionB = calcRegionRecruitBonus(genName, byFid).bonus * 0.5;
  const clanB = calcClanRecruitBonus(genName, byFid).bonus * 0.5;
  const gentryB = calcGentryRecruitBonus(genName, byFid).bonus * 0.5;
  const _techPoach = getTechEffect(byFid, 'captureRateBonus'); // ★ v115 唯才是举
  // SKILL_INLINE: jiupin_poach — 陈群九品: byFid 有陈群当官 → +5%
  const _chenqun = (hasFacGen(byFid, '陈群') && genHasOffice('陈群', byFid)) ? 0.05 : 0;
  // SKILL_INLINE: chijie_poach — 黄权持节: 被挖时 -20%
  const _huangquan = (genName === '黄权') ? -0.20 : 0;
  // ★ v124: 投机 values 武将被挖 +20%
  const _meta = getGenMeta(genName);
  const _toushui = ((_meta.values || []).includes('投机')) ? 0.20 : 0;
  // TEMPERAMENT: cunning 武将被挖 +5%
  const _cunning = ((GEN_TAGS[genName] || {}).temperament === 'cunning') ? 0.05 : 0;
  const raw = 0.45 + chaBonus + (0.35 - loyPenalty) + regionB + clanB + gentryB
    + _techPoach + _chenqun + _huangquan + _toushui + _cunning;
  return Math.min(0.85, Math.max(0.20, raw));
}

/**
 * 玩家挖角操作：花钱挖角可挖角武将
 */
function poachGen(genName){
  const rec = G.recruitableGens[genName];
  if(!rec) return showNotif(`${genName}忠诚已回升，不再可被挖角`, 'warn');

  const srcFid = rec.fid;
  if(srcFid === G.playerFac) return showNotif('此将已在我方麾下', 'warn');

  const gen = GEN_MAP[genName]; // ★ v167fix #33
  if(!gen) return showNotif('武将数据异常', 'warn');

  // ★ v161: 冷却检查
  if(!G._poachCooldown) G._poachCooldown = {};
  const lastAttempt = G._poachCooldown[genName] || 0;
  if(lastAttempt + 3 > G.turn) return showNotif(`${genName}近期已被接触过，需等${lastAttempt + 3 - G.turn}旬`, 'warn');

  const _techPoachCost = getTechEffect(G.playerFac, 'poachCostMult'); // ★ v115: 唯才是举
  const topStat = Math.max(gen.com, gen.war, gen.int, gen.pol, gen.cha);
  const cost = Math.floor((topStat >= 90 ? 3000 : 1500) * (1 + _techPoachCost));

  const pf = G.factions[G.playerFac];
  if(pf.res.gold < cost) return showNotif(`挖角${genName}需金${cost}，当前仅有${Math.floor(pf.res.gold)}`, 'warn');

  // 扣除金钱 + 记录冷却
  safeSub(pf.res, 'gold', cost);
  G._poachCooldown[genName] = G.turn;

  // ★ batch-23 D-065: 改用 _calcPoachRate 共享 helper (5 项 buff 与 AI 路径对称)
  const rate = _calcPoachRate(genName, G.playerFac);

  if(Math.random() < rate){
    // 成功
    // ★ v119fix: 挖角前清除原势力职务 + 从部队squads移除
    clearPrefectByGen(genName);
    clearAllPostsByGen(genName);
    if(G.factions[srcFid]?.strategist === genName) G.factions[srcFid].strategist = null;
    G.units.forEach(u => { if(u.fac === srcFid) u.squads = u.squads.filter(sq => sq.genName !== genName); });
    G.units = G.units.filter(u => u.squads.length > 0 && u.squads.some(sq => sq.troops > 0));
    G.generals[srcFid] = G.generals[srcFid].filter(g => g.name !== genName);
    { const _cloned = _deepCloneGen(gen); G.generals[G.playerFac].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
    G.genLoyalty[genName] = 60; // 初始忠诚60
    G.loyaltyAccum[genName] = 60;
    // D-063 fix: 补写入伙时机字段（被挖武将得 9 旬冷却保护，避免立即下野/被回挖）
    G.genJoinTurn[genName] = G.turn;
    G.genJoinSource[genName] = 'poach';
    // D-072 fix: 补 origFac/origRole 缓存 (latch — 仅首次写; 玩家挖角 origFac=srcFid 是被挖前所属势力)
    if(!G.genOrigFac[genName]) G.genOrigFac[genName] = srcFid;
    if(!G.genOrigRole[genName]) G.genOrigRole[genName] = gen.role || 'general';
    delete G.recruitableGens[genName];
    setRetainers(genName, 0); // ★ v163: 叛逃/被挖角→部曲归零
    // ★ v161: 叛逃→属县家族忠诚冲击-15
    applyFamilyLoyaltyShock(srcFid, (GEN_TAGS[genName]||{}).clan, -15);
    // 外交惩罚（双向） ★ v149fix: 原只更新单方向，改用addDiplo确保双向同步
    addDiplo(G.playerFac, srcFid, -15);
    addGenChronicle(genName, `经人游说，${genName}转投${getFactionDef(G.playerFac)?.full||G.playerFac}，初心忠诚待观。`);
    log(`✅ 成功挖角 ${genName}（${Math.round(rate*100)}%），其已加入${getFactionDef(G.playerFac)?.name}！（与${getFactionDef(srcFid)?.name}外交-15）`, 'diplo');
    showNotif(`${genName} 已加入我方！`, 'ok');
    renderAllLight();
  } else {
    // 失败
    log(`❌ 挖角 ${genName} 失败（成功率${Math.round(rate*100)}%），金${cost}已消耗，3旬后可再试`, 'warn');
    showNotif(`挖角 ${genName} 失败（${Math.round(rate*100)}%），3旬冷却`, 'warn');
  }
}

// ════════════════════════════════════════════════════════════════════
// ── GEN10 太守 (v181 L4677-L4748) ──
// ════════════════════════════════════════════════════════════════════

function clearPrefectByGen(genName){
  if(!genName) return;
  Object.values(G.cities).forEach(city => {
    if(city.prefect === genName) city.prefect = null;
  });
}

function setPrefect(cityId, genName){
  const city = G.cities[cityId];
  if(!city) return;
  // ★ v179fix P49: 归属性防御 — 防止 stale ctx 把死人/已叛逃武将任命为太守（结合 P27 事件 ctx 不验证 genName 的问题）
  if(genName && city.fac && !_genInFac(genName, city.fac)) return;
  // 若该将领已在其他城市任职，先解除
  if(genName){
    Object.values(G.cities).forEach(c => { if(c.id !== cityId && c.prefect === genName) c.prefect = null; });
  }
  const oldPrefect = city.prefect;
  city.prefect = genName || null;
  const cityFac = city.fac;

  // ★ D1: 太守与官职互斥——任命太守时清除官职
  if(genName) clearAllPostsByGen(genName);

  // 太守任命忠诚度效果
  if(genName && genName !== oldPrefect){
    // 新任太守：+8忠诚（封官稳人心）
    if(G.genLoyalty[genName] !== undefined){
      G.genLoyalty[genName] = Math.min(100, (G.genLoyalty[genName]||70) + 8);
      if(G.loyaltyAccum) G.loyaltyAccum[genName] = G.genLoyalty[genName];
    }
    addGenChronicle(genName, `受命为${city.name}太守，忠心倍增。`);
    if(cityFac && getScenarioFactions().includes(cityFac)){
      // ★ B1 降将任太守事件
      if(seniority(genName, cityFac) === 'defector'){
        triggerFactionEvent('defectorPrefect', cityFac, {});
      }
      // ★ v73 任命官职 → 同派系凝聚感 +2
      const apFac = getGenFaction(genName, cityFac);
      if(apFac) triggerFactionEvent('appointPost', cityFac, {appointedFaction: apFac});
      // D-051 fix: 价值观冲击 — 任命太守（与 appointGenPost 同模式：士族→共治，寒门/宗亲→集权）
      const _apOrigin = (GEN_TAGS[genName]||{}).origin;
      if(_apOrigin === 'gentry') applyEthosShock(cityFac, 'power', -2, '任命士族太守');
      else if(_apOrigin === 'humble' || _apOrigin === 'clan') applyEthosShock(cityFac, 'power', 2, '任命寒门/宗亲太守');
    }
  }
  if(oldPrefect && oldPrefect !== genName){
    // 卸任太守：-3忠诚（失去官职有一定失落感）
    if(G.genLoyalty[oldPrefect] !== undefined){
      G.genLoyalty[oldPrefect] = Math.max(0, (G.genLoyalty[oldPrefect]||70) - 3);
      if(G.loyaltyAccum) G.loyaltyAccum[oldPrefect] = G.genLoyalty[oldPrefect];
    }
    // ★ v73 卸任官职 → 同派系凝聚感 -1
    if(cityFac && getScenarioFactions().includes(cityFac)){
      const rmFac = getGenFaction(oldPrefect, cityFac);
      if(rmFac) triggerFactionEvent('removePost', cityFac, {removedFaction: rmFac});
      // D-051 fix: 价值观冲击 — 卸任太守（与 dismissGenPost 同模式）
      const _rmOrigin = (GEN_TAGS[oldPrefect]||{}).origin;
      if(_rmOrigin === 'gentry') applyEthosShock(cityFac, 'power', 3, '罢免士族太守');
      else if(_rmOrigin === 'humble' || _rmOrigin === 'clan') applyEthosShock(cityFac, 'power', -1, '罢免寒门/宗亲太守');
    }
  }

  closeModal();
  renderAllLight();
  if(genName) showNotif(`${genName} 已就任 ${city.name} 太守（忠诚+8）`, 'ok');
}

// ── 玩家外交行动（每势力每旬限一次）──
// 外交链 D1.b (玩家外交动作 + 实力计算,L9732-L10015) 已抽离到 src/chains/diplomacy.js

/** AI外交决策：每旬评估宣战/求和，有10旬CD */
// 外交链 D2 (AI 外交决策 aiDoDiplo,L10018-L10160) 已抽离到 src/chains/diplomacy.js

/** ★ v165: AI通商协定决策 — 每旬评估是否缔结通商 */
// 经济链 E7.a (aiDoTradeAgreement,L9663-L9690) 已抽离到 src/chains/economy.js

// ═══════════════════════════════════════
// 军师职位 + 计谋系统（D1）
// ═══════════════════════════════════════


// ════════════════════════════════════════════════════════════════════
// ── GEN11 军师 (v181 L4750-L4793) ──
// ════════════════════════════════════════════════════════════════════

function getStrategistInt(fid){
  const sName = G.factions[fid]?.strategist;
  if(sName){
    const gen = (G.generals[fid]||[]).find(g=>g.name===sName);
    if(gen) return gen.int;
  }
  const ruler = (G.generals[fid]||[]).find(g=>g.role==='ruler');
  return ruler ? ruler.int : 60;
}

/** 设置/解除军师 */
function setStrategist(fid, genName){
  if(!G.factions[fid]) return;
  // ★ v179fix P49: 归属性防御 — 防止 stale ctx 把不在该势力的武将设为军师
  if(genName && !_genInFac(genName, fid)) return;
  const prev = G.factions[fid].strategist;
  // D-090 fix: 同人重复任命守卫 — 避免 -2 (prev) + 5 (genName) net +3 忠诚 exploit
  if(genName && prev === genName) return;
  if(prev){
    if(G.genLoyalty[prev] !== undefined){
      G.genLoyalty[prev] = Math.max(0, (G.genLoyalty[prev]||60) - 2);
      if(G.loyaltyAccum) G.loyaltyAccum[prev] = G.genLoyalty[prev];
    }
  }
  G.factions[fid].strategist = genName || null;
  if(genName){
    if(G.genLoyalty[genName] !== undefined){
      G.genLoyalty[genName] = Math.min(100, (G.genLoyalty[genName]||60) + 5);
      if(G.loyaltyAccum) G.loyaltyAccum[genName] = G.genLoyalty[genName];
    }
    // ★ v73 任命军师 → 同派系凝聚感 +2
    if(getScenarioFactions().includes(fid)){
      const apFac = getGenFaction(genName, fid);
      if(apFac) triggerFactionEvent('appointPost', fid, {appointedFaction: apFac});
      // D-051 fix: 价值观冲击 — 任命军师（与 appointGenPost 同模式）
      const _apOrigin = (GEN_TAGS[genName]||{}).origin;
      if(_apOrigin === 'gentry') applyEthosShock(fid, 'power', -2, '任命士族军师');
      else if(_apOrigin === 'humble' || _apOrigin === 'clan') applyEthosShock(fid, 'power', 2, '任命寒门/宗亲军师');
    }
    log(`📜 ${getFactionDef(fid)?.name}任命 ${genName} 为军师`, 'fac');
  } else {
    log(`📜 ${getFactionDef(fid)?.name}撤销军师任命`, 'fac');
  }
  // ★ v73 卸任军师 → 原军师同派系凝聚感 -1
  if(prev && prev !== genName && getScenarioFactions().includes(fid)){
    const rmFac = getGenFaction(prev, fid);
    if(rmFac) triggerFactionEvent('removePost', fid, {removedFaction: rmFac});
    // D-051 fix: 价值观冲击 — 卸任军师（与 dismissGenPost 同模式）
    const _rmOrigin = (GEN_TAGS[prev]||{}).origin;
    if(_rmOrigin === 'gentry') applyEthosShock(fid, 'power', 3, '罢免士族军师');
    else if(_rmOrigin === 'humble' || _rmOrigin === 'clan') applyEthosShock(fid, 'power', -1, '罢免寒门/宗亲军师');
  }
  renderRight(); renderLeft();
}

// ════════════════════════════════════════════════════════════════════
// ── GEN12 战力 (v181 L7527-L7535) ──
// ════════════════════════════════════════════════════════════════════

function comBonus(com){ return 0.75 + (com/100)*0.5; }

/**
 * 将领勇武对士气上限的微加成
 * war=100 → 士气上限提升+8，war=50 → +0，war=1 → 无加成
 * 体现猛将在场激励士卒，但不改变基础战力公式
 * 实际效果：moraleMult 略微提升，对最终 CP 影响约 ±5%
 */
function warMoraleBonus(war){ return Math.max(0, (war - 50) / 50 * 0.08); }

// ════════════════════════════════════════════════════════════════════
// ── GEN13 亲密度系统 (v181 L7621-L7746) ──
// ════════════════════════════════════════════════════════════════════

function _intimacyKey(nameA, nameB){
  return nameA < nameB ? nameA+'|'+nameB : nameB+'|'+nameA;
}

/** 查询亲密度，默认0 */
function getIntimacy(nameA, nameB){
  if(!G.intimacy) return 0;
  return G.intimacy[_intimacyKey(nameA, nameB)] || 0;
}

/** 写入亲密度，clamp [-100,+100] */
function setIntimacy(nameA, nameB, val){
  if(!G.intimacy) G.intimacy = {};
  G.intimacy[_intimacyKey(nameA, nameB)] = Math.max(-100, Math.min(100, Math.round(val)));
}

/** 增减亲密度 */
function addIntimacy(nameA, nameB, delta){
  if(!delta) return;
  setIntimacy(nameA, nameB, getIntimacy(nameA, nameB) + delta);
}

/** 查询相性差 → 增长倍率 */
function getCompatGrowthMult(nameA, nameB){
  const ca = COMPAT[nameA] ?? 50;
  const cb = COMPAT[nameB] ?? 50;
  const diff = Math.abs(ca - cb);
  for(const [threshold, mult] of COMPAT_GROWTH_MULT){
    if(diff <= threshold) return mult;
  }
  return 0.2;
}

/** 亲密度 → 关系标签 & 显示颜色 */
function getRelationLabel(val){
  if(val >= 75)  return {label:'义兄弟/挚友', col:'#8a7040', icon:'💛'};
  if(val >= 50)  return {label:'义友',        col:'#1a7a3a', icon:'🤝'};
  if(val >= 20)  return {label:'同僚',        col:'rgba(92,74,50,.55)', icon:'👥'};
  if(val >= -19) return {label:'陌生',        col:'rgba(80,65,40,.25)', icon:'·'};
  if(val >= -49) return {label:'不和',        col:'#e0a040', icon:'😠'};
  if(val >= -74) return {label:'反感',        col:'#e86040', icon:'👊'};
  return                {label:'宿敌/仇敌',   col:'#c03030', icon:'⚔'};
}

/**
 * 单挑结束后更新双方亲密度
 * diff ≤ 40（相性接近）：双方 +3（惺惺相惜）
 * diff > 40（相性疏远）：双方 -3（固定）；败方额外 -2
 * @param {string} atkName  发起方
 * @param {string} defName  迎战方
 * @param {string} outcome  'atkWin'|'defWin'|'draw'
 */
function applyDuelIntimacy(atkName, defName, outcome){
  if(!atkName || !defName) return;
  const ca = COMPAT[atkName] ?? 50;
  const cb = COMPAT[defName] ?? 50;
  const diff = Math.abs(ca - cb);

  if(diff <= 40){
    // 相性接近：惺惺相惜，双方 +2（统一天下需数十年，慢慢积累）
    addIntimacy(atkName, defName, 2);
  } else {
    // 相性疏远：双方 -2，败方额外 -2（合计 -4）
    addIntimacy(atkName, defName, -2);
    if(outcome === 'atkWin'){
      addIntimacy(atkName, defName, -2); // defName败，额外-2
    } else if(outcome === 'defWin'){
      addIntimacy(atkName, defName, -2); // atkName败，额外-2
    }
    // draw：仅 -2，无额外惩罚
  }
}

/**
 * 战斗结束后，遍历参战双侧所有武将对，更新亲密度
 * @param {Array} attackers  攻方units数组
 * @param {Array} defenders  守方units数组
 * @param {boolean} atkWins  攻方是否胜利
 */
function applyBattleIntimacy(attackers, defenders, atkWins){
  // 提取双方所有武将名
  const atkNames = [];
  const defNames = [];
  attackers.forEach(u=>u.squads.forEach(sq=>{ if(sq.genName) atkNames.push(sq.genName); }));
  defenders.forEach(u=>u.squads.forEach(sq=>{ if(sq.genName) defNames.push(sq.genName); }));

  // ① 同侧共战（慢速积累，百旬才有明显变化）
  // 基础 +0.5×mult（无论胜负），胜利额外 +0.5×mult
  // 相性极近(mult=2.0)胜仗 → +2；相性疏远(mult=0.2)胜仗 → +0.2≈0
  function applySameSide(names, wins){
    for(let i=0;i<names.length;i++){
      for(let j=i+1;j<names.length;j++){
        const m = getCompatGrowthMult(names[i], names[j]);
        const delta = (0.5 + (wins ? 0.5 : 0)) * m;
        addIntimacy(names[i], names[j], Math.round(delta));
        // SKILL_INLINE: fangu_dove — 魏延反骨：与鸽派武将亲密度加速下降
        const _isWeiyanPair = (names[i]==='魏延' || names[j]==='魏延');
        if(_isWeiyanPair){
          const other = names[i]==='魏延' ? names[j] : names[i];
          const otherTags = GEN_TAGS[other];
          if(otherTags && otherTags.combat === 'dove') addIntimacy('魏延', other, -2);
        }
      }
    }
  }
  applySameSide(atkNames, atkWins);
  applySameSide(defNames, !atkWins);

  // SKILL_INLINE: jingong_intimacy — 钟会·矜功：同队其他武将亲密度每战-1
  function applyZhonghuiDebuff(names){
    if(!names.includes('钟会')) return;
    for(const other of names){
      if(other !== '钟会') addIntimacy('钟会', other, -1);
    }
  }
  applyZhonghuiDebuff(atkNames);
  applyZhonghuiDebuff(defNames);

  // ② 敌对交战：固定 -1（不乘倍率，不分胜负）
  // 胜负已经通过单挑和士气体现，敌对积怨缓慢匀速增加
  for(const an of atkNames){
    for(const dn of defNames){
      addIntimacy(an, dn, -1);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// ── GEN14 伤亡 + 俘虏 (v181 L7749-L8075, 含 section header + docstring) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ⚔️ A5 武将韧性 / 俘获 / 处置系统
// ═══════════════════════════════════════════════════════

/**
 * 武将韧性检查：返回 'wounded'（首次，重伤免死）或 'dead'（CD内再次触发）
 * 处决不调用此函数（直接死亡）
 */
function checkWounded(genName){
  if(!G.genWounded) G.genWounded = {};
  const until = G.genWounded[genName];
  if(until && G.turn < until){ return 'dead'; } // ★ v167fix #8: <= → <（修正off-by-one，实际恢复期=WOUNDED_CD旬）
  G.genWounded[genName] = G.turn + WOUNDED_CD;
  addGenChronicle(genName, `身受重伤，暂离战阵（重伤恢复中，${WOUNDED_CD}旬内再度受创则有性命之危）。`);
  return 'wounded';
}

function isGenWounded(genName){
  if(!G.genWounded) return false;
  const until = G.genWounded[genName];
  return !!(until && G.turn < until); // ★ v167fix #8
}

/** 获取武将实际属性值（重伤时仅war/int×0.8，其余属性不受影响） */
function getEffectiveStat(genName, stat){
  const g = GEN_MAP[genName];
  if(!g) return 60;
  const val = g[stat] || 60;
  const woundedStats = ['war', 'int'];
  // SKILL_INLINE: duyan — 夏侯惇独眼：重伤不扣武力
  if(genName === '夏侯惇' && stat === 'war') return val;
  return (isGenWounded(genName) && woundedStats.includes(stat)) ? Math.floor(val * 0.8) : val;
}

/**
 * 计算俘获概率
 * scenario: 'normal'|'city_fall'|'faction_wiped'
 */
function calcCaptureRate(scenario, lossRatio){
  const base = 0.20 + Math.min(0.20, lossRatio * 0.20);
  let bonus = 0;
  if(scenario === 'city_fall')     bonus += 0.30;
  if(scenario === 'faction_wiped') bonus += 0.50;
  return Math.min(CAPTURE_RATE_CAP, base + bonus);
}

/** 劝降成功率 */
function calcSurrenderRate(winnerFid, prisonerName){
  const prisonerMeta = GEN_MAP[prisonerName];
  if(!prisonerMeta) return 0.30;
  const winnerRuler = (G.generals[winnerFid]||[]).find(g=>g.role==='ruler');
  const winnerCha = winnerRuler ? winnerRuler.cha : 60;
  const prisonerLoyalty = G.genLoyalty[prisonerName] ?? 70;
  const ca = COMPAT[winnerRuler?.name] ?? 50;
  const cb = COMPAT[prisonerName] ?? 50;
  const compatDiff = Math.abs(ca - cb);
  const compatMult = compatDiff<=20 ? 0.20 : compatDiff<=40 ? 0.10 : compatDiff<=60 ? 0 : -0.15;
  const intimacyBonus = winnerRuler
    ? Math.max(-0.30, Math.min(0.30, getIntimacy(winnerRuler.name, prisonerName) / 200))
    : 0;
  const chaBonus = (winnerCha - 60) / 100 * 0.15;
  const loyaltyPenalty = (prisonerLoyalty - 50) / 100 * 0.20;
  const origFid = Object.keys(GENS_FULL).find(f => GENS_FULL[f].some(g=>g.name===prisonerName));
  const origFacAlive = origFid && (G.generals[origFid]||[]).length > 0;
  const noFactionBonus = !origFacAlive ? 0.20 : 0;
  // ★ B5: 同乡/同族/同士族加成（劝降场景×0.5）
  const regionB = calcRegionRecruitBonus(prisonerName, winnerFid).bonus * 0.5;
  const clanB = calcClanRecruitBonus(prisonerName, winnerFid).bonus * 0.5;
  const gentryB = calcGentryRecruitBonus(prisonerName, winnerFid).bonus * 0.5;
  return Math.max(0.05, Math.min(0.85,
    0.30 + compatMult + intimacyBonus + chaBonus - loyaltyPenalty + noFactionBonus + regionB + clanB + gentryB
    + getTechEffect(winnerFid, 'captureRateBonus') // ★ v115: 天下归心
    // SKILL_INLINE: jiupin_surrender — 陈群九品：当官时劝降率+5%
    + (hasFacGen(winnerFid, '陈群') && genHasOffice('陈群', winnerFid) ? 0.05 : 0)
    // SKILL_INLINE: chijie_surrender — 黄权持节：被俘后劝降概率-20%
    - (prisonerName === '黄权' ? 0.20 : 0)
    // TEMPERAMENT: steadfast — 劝降成功率-5%
    - ((GEN_TAGS[prisonerName]||{}).temperament === 'steadfast' ? 0.05 : 0)
  ));
}

/** 永久移除武将（击杀/处决） */
function killGen(genName, killerName){
  // ★ B1 处决事件钩子：移除前记录派系信息，再触发事件
  let killedMainFac = null;
  let killedFid = null;
  let wasRuler = false;
  getScenarioFactions().forEach(fid => {
    if((G.generals[fid]||[]).some(g => g.name === genName)){
      killedFid = fid;
      killedMainFac = getGenFaction(genName, fid);
      // ★ v78 继任：记录是否为君主
      const gen = (G.generals[fid]||[]).find(g => g.name === genName);
      if(gen && gen.role === 'ruler') wasRuler = true;
    }
  });

  setRetainers(genName, 0); // ★ v163: 阵亡/处决→部曲归零
  Object.keys(G.generals).forEach(fid=>{
    G.generals[fid] = (G.generals[fid]||[]).filter(g=>g.name!==genName);
  });
  G.wildPool = (G.wildPool||[]).filter(n=>n!==genName);
  Object.values(G.cities).forEach(city=>{ if(city.prefect===genName) city.prefect=null; });
  // ★ v78 继任：君主若任军师也需清除
  getScenarioFactions().forEach(fid => {
    if(G.factions[fid]?.strategist === genName) G.factions[fid].strategist = null;
  });
  G.units.forEach(u=>{ u.squads = u.squads.filter(sq=>sq.genName!==genName); });
  G.units = G.units.filter(u=>u.squads.length>0);
  if(G.selUnitId && !G.units.find(u=>u.id===G.selUnitId)) G.selUnitId=null; // ★ v179 fix #58: 防空指针
  clearAllPostsByGen(genName); // ★ D1: 清除官职
  if(G.genChronicle && G.genChronicle[genName]){
    const killerStr = killerName ? `，殒命于${killerName}之手` : '';
    addGenChronicle(genName, `力竭战败${killerStr}，壮烈捐躯，史册留名。`);
  }
  // 亲密度仇恨扩散
  if(killerName){
    Object.values(GEN_MAP).forEach(g=>{ // ★ v167fix #33: 避免flat()重建数组
      if(g.name === killerName) return;
      const intimacy = getIntimacy(g.name, genName);
      if(intimacy >= 75) addIntimacy(g.name, killerName, -50);
      else if(intimacy >= 50) addIntimacy(g.name, killerName, -30);
    });
  }
  // ★ B1 处决事件：被杀武将所在派系全体忠诚-5
  if(killedFid && killedMainFac){
    triggerFactionEvent('execute', killedFid, {killedFaction: killedMainFac});
  }
  // ★ v161: 处决→属县家族忠诚冲击-30
  if(killedFid) applyFamilyLoyaltyShock(killedFid, (GEN_TAGS[genName]||{}).clan, -30);
  // ★ C3 血仇检测：创始/宗亲被处决 → 对凶手势力产生血仇
  if(killedFid && killerName){
    // 找凶手势力
    let killerFid = null;
    getScenarioFactions().forEach(f => {
      if((G.generals[f]||[]).some(g=>g.name===killerName)) killerFid = f;
    });
    if(killerFid) checkBloodFeud(genName, killedFid, killerFid);
  }
  log('💀 ' + genName + '战死沙场', 'battle');
  // ★ v78 君主继任
  if(wasRuler && killedFid) succeedRuler(killedFid, genName);
  // D-058 fix: 部分清(势力相关临时缓存); 战绩/经验/小传等保留作人物档案 (无复活机制)
  if(G.genFactionMod) delete G.genFactionMod[genName];
  if(G.genFactionModLog) delete G.genFactionModLog[genName];
}

/** ★ v78 君主继任机制
 *  优先级：宗亲(cha最高) → 创始团队(cha最高) → 全势力(cha最高)
 *  继任后：role='ruler'，忠诚100，全势力忠诚波动，卸任太守/军师 */
function succeedRuler(fid, deadRulerName){
  const gens = G.generals[fid] || [];
  if(!gens.length) return; // 无武将，势力实质灭亡（暂不处理）

  // 候选分组
  const clanCandidates = gens.filter(g => _isClanRoyalty(g.name, fid)).sort((a,b) => b.cha - a.cha);
  const foundingCandidates = gens.filter(g => {
    const sen = seniority(g.name, fid);
    return sen === 'founding';
  }).sort((a,b) => b.cha - a.cha);
  const allByChar = [...gens].sort((a,b) => b.cha - a.cha);

  const successor = clanCandidates[0] || foundingCandidates[0] || allByChar[0];
  if(!successor) return;

  const isClanSuccession = clanCandidates.includes(successor);

  // 设为君主
  successor.role = 'ruler';
  G.genLoyalty[successor.name] = 100;
  if(G.loyaltyAccum) G.loyaltyAccum[successor.name] = 100;

  // ★ v179fix P14: 君主继任写 G.factionRulers（FAC.ruler 是不可变剧本初值，不再 mutate）
  setFactionRuler(fid, successor.name);

  // 卸任太守
  Object.values(G.cities).forEach(city => {
    if(city.prefect === successor.name) city.prefect = null;
  });
  // 卸任军师
  if(G.factions[fid]?.strategist === successor.name){
    G.factions[fid].strategist = null;
  }
  // D-084 fix: 清继任者旧文/武官职（避免 ruler + 旧官职双重身份）
  clearAllPostsByGen(successor.name);

  // 全势力忠诚波动
  const loyaltyPenalty = isClanSuccession ? -5 : -10;
  gens.forEach(g => {
    if(g.name === successor.name) return;
    G.genLoyalty[g.name] = Math.max(0, (G.genLoyalty[g.name]||50) + loyaltyPenalty);
    if(G.loyaltyAccum) G.loyaltyAccum[g.name] = G.genLoyalty[g.name];
  });

  // 小传
  addGenChronicle(successor.name, `${deadRulerName}薨逝，${successor.name}${isClanSuccession?'以宗亲之身':'受众臣推举'}继位为${getFactionDef(fid).full}之主。`);

  log(`📜 ${successor.name}继位为${getFactionDef(fid).full}之主${isClanSuccession?'（宗亲继任）':'（非宗亲继任）'}，全势力忠诚${loyaltyPenalty}`, 'diplomacy');
}

/** 武将归降（劝降成功） */
function surrenderGen(genName, targetFid){
  // ★ v119fix: 归降前清除原势力太守/军师
  clearPrefectByGen(genName);
  getScenarioFactions().forEach(f => { if(G.factions[f]?.strategist === genName) G.factions[f].strategist = null; });
  Object.keys(G.generals).forEach(fid=>{
    G.generals[fid] = (G.generals[fid]||[]).filter(g=>g.name!==genName);
  });
  G.wildPool = (G.wildPool||[]).filter(n=>n!==genName);
  const genData = GEN_MAP[genName];
  if(genData){
    if(!G.generals[targetFid]) G.generals[targetFid] = [];
    if(!G.generals[targetFid].some(x=>x.name===genName)){
      { const _cloned = _deepCloneGen(genData); G.generals[targetFid].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
    }
    const origLoyalty = G.genLoyalty[genName] ?? 50;
    G.genLoyalty[genName] = Math.max(45, Math.min(65, 50 + (80-origLoyalty)*0.3 + getTechEffect(targetFid, 'surrenderLoyaltyBonus'))); // ★ v115
    if(G.loyaltyAccum) G.loyaltyAccum[genName] = G.genLoyalty[genName];
    // ★ B1 记录归降来源
    G.genJoinTurn[genName] = G.turn;
    // ★ v92: 回归原势力时恢复原始身份（不标记为降将）
    if(G.genOrigFac[genName] === targetFid){
      const origSrc = FOUNDING_CORE[targetFid]?.has(genName) ? 'founding' : 'member';
      G.genJoinSource[genName] = origSrc;
    } else {
      G.genJoinSource[genName] = 'capture';
    }
    // ★ v71 记录原role和原势力（用于旧阀遗族判定）
    if(!G.genOrigRole[genName]){
      const origFid = Object.keys(G.generals).find(f =>
        f !== targetFid && (G.generals[f]||[]).some(g => g.name === genName)
      );
      const origGen = origFid && (G.generals[origFid]||[]).find(g => g.name === genName);
      if(origGen) G.genOrigRole[genName] = origGen.role;
      if(origFid) G.genOrigFac[genName]  = origFid;
    }
    if(!G.genChronicle[genName]) G.genChronicle[genName] = [];
    addGenChronicle(genName, `兵败被俘，归降${getFactionDef(targetFid)?.full||targetFid}，另谋新主。`);
    // ★ D1: 跳槽功绩减半 + 清除旧官职
    if(G.genMerit) G.genMerit[genName] = Math.floor((G.genMerit[genName]||0) * 0.5);
    clearAllPostsByGen(genName);
    log('🤝 ' + genName + ' 归降' + (getFactionDef(targetFid)?.name||targetFid), 'battle');
    // D-059 (1) cleanup fix: 投降后清旧派系修正缓存 (跟 D-057 同类扩展场景, 防止下旬 calcLoyaltyDelta 读到旧 mod)
    // D-059 (2) 派系/价值观事件不修 (用户决策: 投降是个人行为, processFactionLoyalty 自然反映)
    if(G.genFactionMod) delete G.genFactionMod[genName];
    if(G.genFactionModLog) delete G.genFactionModLog[genName];
  }
}

/** 武将释放 */
function releaseGen(genName, releaserFid){
  const origFid = Object.keys(GENS_FULL).find(f => GENS_FULL[f].some(g=>g.name===genName));
  const origFacAlive = origFid && (G.generals[origFid]||[]).length > 0;
  if(origFacAlive){
    const genData = GEN_MAP[genName];
    if(genData && !(G.generals[origFid]||[]).some(g=>g.name===genName)){
      { const _cloned = _deepCloneGen(genData); G.generals[origFid].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
    }
    addGenChronicle(genName, `被俘后蒙释，重归${getFactionDef(origFid)?.full||origFid}麾下，感念恩德。`);
  } else {
    if(!G.wildPool.includes(genName)) G.wildPool.push(genName);
    if(!G.genChronicle[genName]) G.genChronicle[genName] = [];
    addGenChronicle(genName, '被俘后获释，流落江湖，待价而沽。');
  }
  const releaserRuler = (G.generals[releaserFid]||[]).find(g=>g.role==='ruler');
  if(releaserRuler){
    addIntimacy(genName, releaserRuler.name, 25);  // 双向+25（同一个亲密度值，加一次）
  }
  log('🕊 ' + genName + ' 被' + (getFactionDef(releaserFid)?.name||releaserFid) + '释放', 'battle');
}

/** AI处置俘虏：始终优先尝试劝降（无成本），死敌才考虑处决 */
function aiDisposePrisoner(prisonerName, capturerFid){
  const ruler = (G.generals[capturerFid]||[]).find(g=>g.role==='ruler');
  const intimacy = getIntimacy(ruler?.name||'', prisonerName);
  const isDeadEnemy = intimacy <= -60;
  // 死敌：30%处决，不劝降，直接释放
  if(isDeadEnemy) return Math.random() < 0.30 ? 'execute' : 'release';
  // 其余：始终尝试劝降（成功就赚，失败=释放，无额外损耗）
  const rate = calcSurrenderRate(capturerFid, prisonerName);
  return Math.random() < rate ? 'surrender' : 'release';
}

/**
 * 从loser部队收集被俘武将名单
 * duelLost: 单挑败方（+20%概率）
 */
function collectPrisoners(units, scenario, lossRatio, duelLost, winnerUnits){
  const prisoners = [];
  // SKILL_INLINE: capture_rate — 刘备仁德(-15%)/赵云取将(-20%)/典韦恶来(同部队免疫)：降低被俘率
  // SKILL_INLINE: qinjiang — 潘璋擒将：胜方有潘璋时俘获率+20%
  const _panzhangPresent = winnerUnits && winnerUnits.some(u => u.squads.some(sq => sq.genName === '潘璋'));
  units.forEach(u=>{
    const _uHasDianwei = u.squads.some(sq => sq.genName === '典韦');
    const _uHasLiuBei  = u.squads.some(sq => sq.genName === '刘备');
    const _uHasZhaoyun = u.squads.some(sq => sq.genName === '赵云');
    u.squads.forEach(sq=>{
      if(!sq.genName) return;
      if(_uHasDianwei) return; // 典韦恶来：同部队武将不被俘
      // SKILL_INLINE: huzhu_capture — 周泰护主：孙权同部队时孙权免疫被俘
      const _uHasZhoutai = u.squads.some(s => s.genName === '周泰');
      if(_uHasZhoutai && sq.genName === '孙权') return;
      let rate = calcCaptureRate(scenario, lossRatio);
      if(duelLost) rate = Math.min(CAPTURE_RATE_CAP, rate + 0.20);
      if(_panzhangPresent) rate = Math.min(CAPTURE_RATE_CAP, rate + 0.20);
      if(_uHasLiuBei) rate = Math.max(0, rate - 0.15);
      if(_uHasZhaoyun) rate = Math.max(0, rate - 0.20);
      if(Math.random() < rate) prisoners.push(sq.genName);
    });
  });
  return prisoners;
}

/**
 * 处置俘虏列表
 * 玩家方：推入_pendingPrisoners等待弹窗
 * AI方：自动处置
 * 返回报告数组
 */
function resolvePrisoners(prisonerNames, capturerFid, isPlayer){
  const reports = [];
  prisonerNames.forEach(name=>{
    if(isPlayer){
      if(!G._pendingPrisoners) G._pendingPrisoners = [];
      G._pendingPrisoners.push({name, capturerFid});
      reports.push({name, action:'pending'});
    } else {
      const action = aiDisposePrisoner(name, capturerFid);
      if(action === 'surrender') surrenderGen(name, capturerFid);
      else if(action === 'execute'){
        // D-061 fix: 传入 killerName (capturerFid 主公) 让 killGen 内血仇/亲密度仇恨扩散触发
        const ruler = (G.generals[capturerFid] || []).find(g => g.role === 'ruler');
        killGen(name, ruler?.name || null);
      }
      else releaseGen(name, capturerFid);
      reports.push({name, action});
    }
  });
  return reports;
}

// ════════════════════════════════════════════════════════════════════
// ── GEN15 _applyCeremony 归位 (from src/render/ceremonies.js L28-L45) ──
// ════════════════════════════════════════════════════════════════════

// ★ v131: D1拜将大典——多选面板
// closes phase-2 carry-over: _applyCeremony moved from src/render/ceremonies.js → here at phase 3.12 (mechanism 归位)
function _applyCeremony(picked, fid){
  // ★ v133: 标记已封，不再触发
  if(!G._eventFired) G._eventFired={};
  G._eventFired.general_ceremony = G.turn;
  picked.forEach(name=>{
    if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+10);
    if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
    addStatExp(name, 'com', 25);
    addStatExp(name, 'war', 25);
  });
  G.units.filter(u=>u.fac===fid).forEach(u=>{
    u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); });
  });
  log(`🏅 拜将大典：${picked.join('、')}受封，全军振奋`,'event');
}

// ════════════════════════════════════════════════════════════════════
// ── GEN16 AI _exec 入口 (sprint batch-26+27 D-类架构债 sprint) ──
//    招募/挖角:  v181 L13516-L13542 (batch-26)
//    太守/军师:  v181 L13433-L13442 / L13505-L13513 (batch-27)
// ════════════════════════════════════════════════════════════════════

function _execSetPrefect(fid, act) {
  const cityId = _resolveCityId(act.city);
  const city = G.cities[cityId];
  if (!city || city.fac !== fid) return false;
  const genName = act.general || null;
  if (genName && !_genInFac(genName, fid)) return false;
  if (genName && _genDeployed(genName, fid)) return false;
  setPrefect(cityId, genName);
  return true;
}

function _execSetStrategist(fid, act) {
  const genName = act.general || null;
  if (genName && !_genInFac(genName, fid)) return false;
  if (genName) {
    const gen = (G.generals[fid] || []).find(g => g.name === genName);
    if (!gen || gen.role === 'ruler') return false;
  }
  setStrategist(fid, genName);
  return true;
}

function _execRecruitWild(fid, act) {
  const genName = act.general;
  if (!genName) return false;
  if (!G.wildPool.includes(genName)) return false;
  const cdData = G.wildRecruitCD[genName];
  if (cdData && cdData.until > G.turn) return false;
  const failCount = cdData?.failCount || 0;
  const cost = 1500 + failCount * 500;
  if ((G.factions[fid].res.gold || 0) < cost) return false;
  return _doRecruitWild(genName, fid, true);
}

function _execPoach(fid, act) {
  const genName = act.general;
  if (!genName) return false;
  const rec = G.recruitableGens?.[genName];
  if (!rec || rec.fid === fid) return false;
  const gen = GEN_MAP[genName]; // ★ v167fix #33
  if (!gen) return false;
  const topStat = Math.max(gen.com, gen.war, gen.int, gen.pol, gen.cha);
  // D-064 fix: 加 (1 + _techPoachCost) 科技修正（玩家路径 poachGen L1636 已用，AI 路径漏）
  const _techPoachCost = getTechEffect(fid, 'poachCostMult');
  const cost = Math.floor((topStat >= 90 ? 3000 : 1500) * (1 + _techPoachCost));
  if ((G.factions[fid].res.gold || 0) < cost) return false;
  _aiDoPoach(genName, fid, rec.fid, cost);
  return true;
}

// ═══════════════════════════════════════════════════════
// GEN17 — 桶 2 残余: GEN_MAP let + 6 squad/class funcs (2026-05-09 抽离)
// ═══════════════════════════════════════════════════════
//
// 来源:project_romance_v181.html L904-L906 (GEN_MAP) + L915-L989 (6 funcs).
// 抽离方式:verbatim relocation (跟 phase 4 一致, 决策 1 = A 风格直读 G)。
//
// 内容:
//   - let GEN_MAP            (按 name 快速查将领 O(1) map, v155fix initGame 重建)
//   - getSquadClass         (读 sq._classChoice + GEN_CLASS lookup)
//   - getUnitClassBuffs     (汇总 4 类 buff: warriors/commanders/strategists/ministers)
//   - getClassDuelWeight    (单挑被动选 weight, by class)
//   - genClassTagsHtml      (类型标签 HTML, 列表 / 详情用)
//   - genClassSelectorHtml  (多标签选择器 HTML, 编组弹窗用)
//   - genClassBuffsHtml     (编组 buff 预览 HTML)
//
// 加载顺序: 必须在 src/data/generals.js 之后 (依赖 ALL_GENS / GEN_POOL_INACTIVE /
//           GEN_CLASS / CLASS_META) — 已通过 v181 script tag 顺序保证 (data/generals.js L808
//           在 chains/general.js L825 之前)。
//
// 决策(2026-05-09 制作人 approve):全 7 symbol → general.js 单 destination
//   - GEN_MAP 是 let (initGame 重建), 不适合 data 层 "纯 const" 约定
//   - 6 funcs 是 squad/class 武将机制 + HTML helper 混合, chain 层一并装最简
//

/** 按 name 快速查将领数据（O(1) map）— 含非活跃武将，供关系/profile查询 */
/** ★ v155fix P0: 改为let，initGame中重建指向G.generals活跃对象，避免污染静态定义 */
let GEN_MAP = Object.fromEntries([...ALL_GENS, ...GEN_POOL_INACTIVE].map(g=>[g.name, g]));

/** 获取squad当前生效标签（多标签读_classChoice，单标签读[0]） */
function getSquadClass(sq) {
  if(!sq || !sq.genName) return 'warrior';
  if(sq._classChoice && (GEN_CLASS[sq.genName]||[]).includes(sq._classChoice)) return sq._classChoice;
  return (GEN_CLASS[sq.genName]||['warrior'])[0];
}

/** 计算一支部队的四类buff汇总 */
function getUnitClassBuffs(unit) {
  let warriors=0, commanders=0, strategists=0, ministers=0;
  (unit.squads||[]).forEach(sq => {
    if(!sq) return;
    const cls = getSquadClass(sq);
    if(cls==='warrior') warriors++;
    else if(cls==='commander') commanders++;
    else if(cls==='strategist') strategists++;
    else if(cls==='minister') ministers++;
  });
  const hasCmd = commanders === 1; // ≥2失效
  return {
    morale: hasCmd ? 5 : 0,
    duelPct: warriors * (hasCmd ? 0.05 : 0.03),
    tacticPct: strategists * (hasCmd ? 0.05 : 0.03),
    supplyRange: ministers > 0 ? (hasCmd ? 2 : 1) : 0,
    cmdConflict: commanders >= 2,
    warriors, commanders, strategists, ministers,
  };
}

/** 被动单挑中，按标签修正该武将被选为单挑对象的权重 */
function getClassDuelWeight(genName, classChoice) {
  const cls = classChoice || (GEN_CLASS[genName]||['warrior'])[0];
  if(cls==='commander') return 0.5;
  if(cls==='strategist' || cls==='minister') return 0.1;
  return 1.0; // warrior
}

/** 生成武将类型标签HTML（用于列表/详情等） */
function genClassTagsHtml(genName) {
  const classes = GEN_CLASS[genName] || ['warrior'];
  return classes.map(c => {
    const m = CLASS_META[c];
    return `<span class="gen-class-tag ${c}" title="${m.label}">${m.icon}${m.label}</span>`;
  }).join('');
}

/** 生成多标签选择器HTML（编组弹窗用） */
function genClassSelectorHtml(genName, currentChoice, slotKey) {
  const classes = GEN_CLASS[genName] || ['warrior'];
  if(classes.length <= 1) return genClassTagsHtml(genName); // 单标签直接显示
  const chosen = currentChoice || classes[0];
  return `<span class="gen-class-sel">${classes.map(c => {
    const m = CLASS_META[c];
    return `<span class="gen-class-btn ${c}${c===chosen?' active':''}" onclick="_rmSetClass('${slotKey}','${c}')" title="${m.label}">${m.icon}${m.label}</span>`;
  }).join('')}</span>`;
}

/** 生成编组buff预览HTML */
function genClassBuffsHtml(mainGen, mainClass, sub1Gen, sub1Class, sub1Active, sub2Gen, sub2Class, sub2Active) {
  // 构造虚拟unit计算buff
  const squads = [];
  if(mainGen) squads.push({genName:mainGen, _classChoice:mainClass});
  if(sub1Active && sub1Gen) squads.push({genName:sub1Gen, _classChoice:sub1Class});
  if(sub2Active && sub2Gen) squads.push({genName:sub2Gen, _classChoice:sub2Class});
  if(squads.length === 0) return '';
  const b = getUnitClassBuffs({squads});
  const lines = [];
  if(b.cmdConflict) lines.push('<span class="warn">⚠ 双统帅冲突：统帅增幅失效</span>');
  if(b.morale > 0) lines.push(`🏴 统帅增幅：战斗士气+${b.morale}`);
  if(b.duelPct > 0) lines.push(`⚔️ 武将×${b.warriors}${b.morale>0?'（增幅）':''}：被动单挑+${Math.round(b.duelPct*100)}%`);
  if(b.tacticPct > 0) lines.push(`🧠 谋士×${b.strategists}${b.morale>0?'（增幅）':''}：计谋+${Math.round(b.tacticPct*100)}%`);
  if(b.supplyRange > 0) lines.push(`📜 能臣${b.morale>0?'（增幅）':''}：补给+${b.supplyRange}格`);
  if(lines.length === 0) return '';
  return `<div class="rm-buffs">${lines.join('<br>')}</div>`;
}
