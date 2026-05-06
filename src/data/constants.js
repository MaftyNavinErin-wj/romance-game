// src/data/constants.js
//
// 跨文件多处硬编魔术数字 + 杂参数 + 大表数据(2 阶段抽离)
//
// 来源:
//
//   Phase 1.5 (Session 1.5 / 阶段 1):
//     跨文件多处硬编魔术数字集中化。严格判定:只收录"跨多个引用点的数字
//     字面量"(典型 magic number),单点使用的函数内 tuning 系数留原位。
//     - EVENT_CAT_COOLDOWN(D-141 自然 close): G._eventCatCooldown[X] = 3 硬编 4 处
//     - REPUTATION_DEFAULT(D-144 自然 close): G.reputation 默认 50 硬编 23 处
//
//   refactor/data-completion S3 (本次,2026-05-05):
//     §A+§B+§C+§G+§H 杂参数 + 大表数据(纯 verbatim 搬运,DP-C 方案 B 决策),共 468 行 / 44 const
//     - §A 杂参数(原 L838-L897):TAX/POLICY/CORVEE/MIGRATE_*(10)/RETAINER_*(4)
//     - §B 建筑+阶段+攻城后处置+宣战+称帝(原 L898-L984):BLDS/STAGE_GENTRY_BOUNDS/
//       STAGE_PROMO/SIEGE_AFTERMATH/CLAIM_TYPES/CLAIM_EFFECTS/ENTHRONE_FACTION_EFFECTS/
//       SQUAD_MAX_TROOPS/UNIT_MAX_TROOPS/BILLET_LEVEL_THRESHOLD
//     - §C 科技+郡(原 L995-L1143):TECH_TREE/TECH_PREUNLOCK/JUNS
//     - §G 腐败+派系定义+官职(原 L1700-L1845):CORRUPT_*(3)/FACTION_DEFS/POST_TIERS/
//       STAGE_TIER1_SLOTS/STAGE_LABEL_CAP/MIL_POSTS/CIV_POSTS/ALL_POSTS(IIFE)/MERIT_INIT/STAGE_LABEL_FLOOR
//     - §H 朝议提案(原 L1860-L1871):COURT_PROPOSALS_MIL/COURT_PROPOSALS_CIV
//
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),原则 #8 Node 双脚本 + 标点保留。
// 接口风格:全局 const(同 phase 1 决定),所有调用点不需改。
//
// 留 v181 的(scout 实测决策):
//   - §D 武将主表(GENS_FULL/GEN_META/...)已抽到 src/data/generals.js (S1 完成)
//   - §E+§F 州县(STATE_*/COUNTY_*/_CLAN_MAP)将抽到 src/data/state_county.js (S2 待做)
//   - 跨段 phase 3 markers + section headers(原 L985-L994 / L1144-L1699 / L1872+)留 v181
//
// loading 顺序:本文件早期加载,无跨文件依赖(全部 const 自含或仅依赖同文件)。
// 同 realm classic <script> 共享 script-scope(p3.1 / p3.4 验证锚点)。

// ── 事件系统冷却 ──
// 每个事件 category 触发后冷却 N 旬不再触发同 category 事件
// ── owner: event chain ──
const EVENT_CAT_COOLDOWN = 3;

// ── 信誉度系统默认 ──
// 当 G.reputation[fid] 未初始化时的 fallback 值(也是"中立信誉"基线)
// 注:开局初始值 wei=45 / shu=80 / wu=60 / nanman=30,此 50 仅在 fid 不在
//    G.reputation 时(如 rebel)或测试代码中使用
// ── owner: diplomacy chain ──
const REPUTATION_DEFAULT = 50;

// ════════════════════════════════════════════════════════════
// refactor/data-completion S3: 杂参数 + 大表 (§A+§B+§C+§G+§H)
// 共 468 行 verbatim, 3 段不连续 ranges (见 RANGES 注释)
// ════════════════════════════════════════════════════════════

// ── range A: §A+§B 杂参数 + 建筑 + 阶段 + 攻城后处置 + 宣战 + 称帝 + unit 容量 (原 L838-L984, 147 行) ──
// ── owner: economy chain ──
const TAX=[
  {id:'none', name:'无税', goldM:.50,moraleMod:+.8,popMod:+.0008},
  {id:'low',  name:'轻税', goldM:.75,moraleMod:+.3,popMod:+.0003},
  {id:'norm', name:'正常', goldM:1.0,moraleMod: 0, popMod: 0    },
  {id:'heavy',name:'重税', goldM:1.35,moraleMod:-1.5,popMod:-.0008},
  {id:'harsh',name:'苛政', goldM:1.6,moraleMod:-4.0,popMod:-.0025},
];
// ── owner: military chain ── (补员策略 policyId,processReinforcement 消费)
const POLICY=[
  {id:'aggr',name:'激进',front:.7,rear:.3},
  {id:'bal', name:'均衡',front:.5,rear:.5},
  {id:'elit',name:'精兵',front:.3,rear:.7},
];
// ★ v163: 徭役制度 — 建设加速 vs 民心+质量代价（仅有在建项目的城市生效）
// ── owner: economy chain ── (建设加速 / 民心+质量代价)
const CORVEE=[
  {id:'low',  name:'轻徭', buildBonus:0,    moralePen:0,    qualPen:0},
  {id:'mid',  name:'中徭', buildBonus:0.12, moralePen:-0.20,qualPen:-0.03},
  {id:'high', name:'重徭', buildBonus:0.22, moralePen:-0.50,qualPen:-0.08},
];

// ★ v166: 迁民系统常量
// ── owner: cross-chain (gentry + economy) ── (迁民触发豪族属县影响 + 城市人口/腐败)
const MIGRATE_MIN_RATIO = 0.20;   // 最低迁出比例20%
const MIGRATE_MAX_RATIO = 0.80;   // 最高迁出比例80%
const MIGRATE_LOSS_RATE = 0.40;   // 途中损耗40%
const MIGRATE_COOLDOWN  = 6;      // 来源城冷却6旬
const MIGRATE_SRC_BASE  = {morale:-15, quality:-10, storagePct:-0.20}; // 来源城基准惩罚（50%迁出时）
const MIGRATE_DST_BASE  = {morale:-8, quality:-5};                      // 目的城基准惩罚（30%涌入时）
const MIGRATE_COUNTY_CROSS = {src:-8, dst:-5};  // 跨地域属县loyalty冲击
const MIGRATE_COUNTY_SAME  = {src:-5, dst:-3};  // 同地域属县loyalty冲击
const MIGRATE_CLAN_BASE_EXTRA = {src:-3, dst:-2}; // clan_base属县额外冲击
const MIGRATE_ENEMY_CHECK_RANGE = 2; // 安全检查：双城Nhex内不可有敌军
// ★ v164: 部曲绑兵种（{count,type}），billet拆双条目，征兵/重编兵种锁定
// ── owner: military chain ── (部曲 squad 内嵌,applyLoss 保护系数)
const RETAINER_LEVEL = 10;        // 部曲按Lv10计算
const RETAINER_PROTECT = 0.35;    // 战损保护系数：部曲承担同比例损失×0.35
const RETAINER_INFLUENCE_DIV = 500; // 每500部曲=+1派系影响力
// 开局部曲preset（{count, type}绑兵种，史实依据见handover）
const RETAINER_PRESET = {
  // 魏
  '曹操':{count:2500,type:'cavalry'},'曹仁':{count:2000,type:'heavy'},'夏侯惇':{count:1800,type:'cavalry'},
  '夏侯渊':{count:1500,type:'cavalry'},'张辽':{count:1200,type:'cavalry'},
  '徐晃':{count:800,type:'heavy'},'许褚':{count:1000,type:'heavy'},'于禁':{count:600,type:'heavy'},'曹洪':{count:1000,type:'cavalry'},
  // 蜀
  '刘备':{count:1500,type:'cavalry'},'关羽':{count:1500,type:'heavy'},'张飞':{count:1200,type:'cavalry'},
  '赵云':{count:800,type:'cavalry'},'魏延':{count:600,type:'heavy'},
  '黄忠':{count:500,type:'archer'},'马超':{count:1000,type:'cavalry'},
  // 吴
  '孙权':{count:2000,type:'heavy'},'周瑜':{count:1500,type:'cavalry'},'甘宁':{count:800,type:'light'},'凌统':{count:600,type:'heavy'},
  '程普':{count:700,type:'cavalry'},'黄盖':{count:700,type:'heavy'},'吕蒙':{count:500,type:'light'},'陆逊':{count:400,type:'light'},
};

/** v164: 获取武将部曲数（精确值，用于计算） */
// 武将链 GEN1 (部曲 getRetainers/getRetainerType/setRetainers/getRetainersDisplay,L887-L912) 已抽离到 src/chains/general.js (Session 3.12)

// 军事链 MIL1.a (unit level + exp + applyBattleExp,L913-L1079) 已抽离到 src/chains/military.js (Session 3.11 Commit 2)

// ═══════════════════════════════════════
// D3 武将养成系统 — 属性成长 + 适性成长
// ═══════════════════════════════════════
// 武将链 GEN2 (武将养成 STAT_GROW_CAP/THRESHOLD/APT_GROW_THRESHOLD/APT_GRADES + addStatExp/addAptExp,L919-L986) 已抽离到 src/chains/general.js

// ── BUILDINGS ──
// ── owner: cross-chain (economy + military + politics) ── (建筑数据,各 chain 消费)
const BLDS={
  farm:    {name:'农田',  icon:'🌾',cat:'agri', levels:[{c:{gold:400,wood:200},t:2,eff:'基础粮+100'},{c:{gold:700,wood:400},t:3,eff:'基础粮+190'},{c:{gold:1200,wood:700},t:4,eff:'基础粮+270'}],restrict:[]},
  irr:     {name:'水利',  icon:'💧',cat:'agri', levels:[{c:{gold:800,wood:600},t:3,eff:'农田×1.2'},{c:{gold:1400,wood:1000},t:4,eff:'农田×1.4'},{c:{gold:2200,wood:1600},t:6,eff:'农田×1.6'}],restrict:['平原','水乡']},
  granary: {name:'粮仓',  icon:'🏚',cat:'agri', levels:[{c:{gold:400,wood:400},t:2,eff:'腐损→1.2%'},{c:{gold:700,wood:700},t:3,eff:'腐损→0.8%'},{c:{gold:1100,wood:1100},t:4,eff:'腐损→0.3%'}],restrict:[]},
  market:  {name:'市集',  icon:'🏪',cat:'comm', levels:[{c:{gold:500,wood:300},t:2,eff:'基础金+40'},{c:{gold:850,wood:500},t:3,eff:'基础金+75'},{c:{gold:1400,wood:800},t:5,eff:'基础金+105'}],restrict:[]},
  road:    {name:'驿道',  icon:'🛤',cat:'comm', levels:[{c:{gold:700,wood:500},t:2,eff:'行军+15%'},{c:{gold:1200,wood:900},t:3,eff:'行军+25%'},{c:{gold:1900,wood:1400},t:4,eff:'行军+40%'}],restrict:[]},
  harbor:  {name:'港口',  icon:'⚓',cat:'comm', levels:[{c:{gold:1200,wood:800},t:3,eff:'金+40%'},{c:{gold:2000,wood:1400},t:4,eff:'金+80%'},{c:{gold:3200,wood:2200},t:6,eff:'金+130%'}],restrict:['港口']},
  barracks:{name:'兵营',  icon:'⚔',cat:'mil',  levels:[{c:{gold:400,iron:200},t:2,eff:'征兵费-10%'},{c:{gold:700,iron:400},t:3,eff:'征兵费-20%'},{c:{gold:1100,iron:600},t:4,eff:'征兵费-30%'}],restrict:[]},
  workshop:{name:'作坊',  icon:'🔨',cat:'mil',  levels:[{c:{gold:600,iron:500},t:3,eff:'铁耗-15%'},{c:{gold:1000,iron:900},t:4,eff:'铁耗-30%'},{c:{gold:1600,iron:1400},t:5,eff:'铁耗-45%'}],restrict:[]},
  stable:  {name:'马厩',  icon:'🐴',cat:'mil',  levels:[{c:{gold:500,wood:300},t:2,eff:'马+20%'},{c:{gold:900,wood:550},t:3,eff:'马+40%'},{c:{gold:1400,wood:850},t:4,eff:'马+65%'}],restrict:[]},
  wall:    {name:'城墙',  icon:'🏯',cat:'mil',  levels:[{c:{gold:800,iron:600},t:3,eff:'耐久+20%'},{c:{gold:1400,iron:1000},t:4,eff:'耐久+40%'},{c:{gold:2200,iron:1600},t:5,eff:'耐久+65%'}],restrict:[]},
  school:  {name:'学堂',  icon:'📚',cat:'civ',  levels:[{c:{gold:800,wood:400},t:3,eff:'质量恢复+0.08'},{c:{gold:1400,wood:700},t:4,eff:'质量恢复+0.15'},{c:{gold:2200,wood:1100},t:5,eff:'质量恢复+0.25'}],restrict:[]},
  clinic:  {name:'医馆',  icon:'💊',cat:'civ',  levels:[{c:{gold:600,wood:300},t:2,eff:'疫病-30%'},{c:{gold:1000,wood:550},t:3,eff:'疫病-55%'},{c:{gold:1600,wood:850},t:4,eff:'疫病-75%'}],restrict:[]},
  tradepost:{name:'商港',icon:'🚢',cat:'comm', levels:[{c:{gold:1000,wood:600},t:3,eff:'金+15%'},{c:{gold:1800,wood:1000},t:4,eff:'金+25%'},{c:{gold:2800,wood:1600},t:5,eff:'金+35%'}],restrict:['_tradepost']},
};

// 军事链 MIL1.b (getBarracksDiscount,L1170-L1174) 已抽离到 src/chains/military.js


// ═══════════════════════════════════════
// C3 宣称 + 天子 + 称帝系统
// ═══════════════════════════════════════


/** v172: 势力演进阶段常量 */

// 豪族支持度按阶段 clamp 的上下限（军阀强权保底25+不得拥戴封70；其他完全解锁）
// ── owner: politics chain ── (stage 阶段演进系统)
const STAGE_GENTRY_BOUNDS = {
  warlord:  { min:25, max:70 },
  regional: { min:0,  max:100 },
  regime:   { min:0,  max:100 },
};

// 晋升条件参数
// ── owner: politics chain ──
const STAGE_PROMO = {
  toRegional: { stateMinCities:3, stateDurationTurns:18, totalMinCities:5 },
  toRegime:   { totalMinCities:10, stateMinCities:2, requireStates:2 },
};

// ═══════════════════════════════════════
// ★ v151: 势力价值观系统（Ethos）常量
// 正值方向: mandate→篡汉, power→集权, civil→暴政, military→铁血, strategy→扩张
// 负值方向: mandate→崇汉, power→共治, civil→仁政, military→怀柔, strategy→守成
// 范围 -100 ~ +100, 0为中立
// ═══════════════════════════════════════

/** 攻城胜利后处置选项 */
// ── owner: military chain ── (攻城后处置主入军事,含 ethosShocks 触发 ethos)
const SIEGE_AFTERMATH = {
  pacify:   { label:'安民', desc:'秋毫无犯，安抚百姓', goldMult:0, moraleMod:10, popMult:1.0, gentryMod:5, repCost:0, ethosShocks:{military:-6, civil:-3} },
  loot:     { label:'劫掠', desc:'纵兵劫掠，充实军资', goldMult:0.4, moraleMod:-20, popMult:0.9, gentryMod:-15, repCost:-3, ethosShocks:{military:8, civil:5} },
  massacre: { label:'屠城', desc:'屠城示威，鸡犬不留', goldMult:0.8, moraleMod:-50, popMult:0.7, gentryMod:-40, repCost:-10, ethosShocks:{military:18, civil:12} },
};

/** 宣称类型定义 */
// ── owner: diplomacy chain ──
const CLAIM_TYPES = {
  imperial_decree:    { label:'奉旨讨逆', strength:'strong', prepTime:0, reqIdentity:['emperor_holder'], reqTarget:null, reqCondition:null, repCost:0, hanRoyalPenalty:true, desc:'以天子诏令讨伐不臣' },
  restore_han:        { label:'讨贼兴汉', strength:'strong', prepTime:2, reqIdentity:['han_royal'],      reqTarget:['emperor_holder','emperor'], reqCondition:null, repCost:0, desc:'以汉室正统讨伐篡逆之臣' },
  punish_tyrant:      { label:'吊民伐罪', strength:'strong', prepTime:1, reqIdentity:['emperor'],        reqTarget:null, reqCondition:'not_emperor', repCost:0, desc:'以帝王之名讨伐暴政' },
  overthrow_pretender: { label:'讨伐伪帝', strength:'strong', prepTime:1, reqIdentity:['emperor'],        reqTarget:['emperor'], reqCondition:null, repCost:0, desc:'天无二日，讨伐僭越称帝者' },
  tribal_raid:        { label:'蛮族劫掠', strength:'weak',   prepTime:0, reqIdentity:['tribal'],         reqTarget:null, reqCondition:null, repCost:-5, desc:'蛮族出山劫掠，不需理由！' }, // ★ v144: 南蛮专属，0准备但信誉-5
  recover_lost:       { label:'收复故土', strength:'medium', prepTime:1, reqIdentity:null,               reqTarget:null, reqCondition:'has_lost_city', repCost:0, desc:'收复沦陷之城池' },
  blood_feud:         { label:'兴兵复仇', strength:'medium', prepTime:2, reqIdentity:null,               reqTarget:null, reqCondition:'has_feud', repCost:0, desc:'为阵亡将士复仇雪恨' },
  border_conflict:    { label:'边境清寇', strength:'weak',   prepTime:3, reqIdentity:null,               reqTarget:null, reqCondition:'adjacent', repCost:-3, desc:'以边境冲突为由出兵' },
};

/** 宣称强度→外交/内政效果表 */
// ── owner: diplomacy chain ── (applyWarDeclarationEffects 主入参)
const CLAIM_EFFECTS = {
  strong: { repCost:0,  thirdPartyRel:0,   gentryHook:10,  fac:{ '汉室死忠':3, '士族':1, hawk:3, dove:0, founding:1 } },
  medium: { repCost:0,  thirdPartyRel:0,   gentryHook:0,  fac:{ '汉室死忠':0, '士族':0, hawk:2, dove:-1, founding:0 } },
  weak:   { repCost:-3, thirdPartyRel:-3,  gentryHook:-10, fac:{ '汉室死忠':-2,'士族':-1,hawk:2, dove:-2, founding:0 } },
  none:   { repCost:-12,thirdPartyRel:-10, gentryHook:-25,fac:{ '汉室死忠':-5,'士族':-3,hawk:2, dove:-3, founding:-2 } },
};

/** 称帝时一次性派系影响 */
// ── owner: diplomacy chain ── (称帝走外交链 doEnthrone)
const ENTHRONE_FACTION_EFFECTS = {
  warlord:        { '汉室死忠':-15, '士族':-5, hawk:3, dove:-2, founding:3, royalty:5 },
  emperor_holder: { '汉室死忠':-12, '士族':-3, hawk:3, dove:-1, founding:3, royalty:5 },
  han_royal:      { '汉室死忠':5,   '士族':2,  hawk:3, dove:0,  founding:3, royalty:5 },
};

// ★ v113: 扩编系统常量
// ── owner: military chain ──
const SQUAD_MAX_TROOPS = 7000;   // 单squad兵力天花板
const UNIT_MAX_TROOPS  = 21000;  // 单部队总兵力天花板（7000×3）

// 可驻扎休整的核心城市（各势力2座）
// ★ v113: Billet重做——遣散休整保留老兵
// ── owner: military chain ──
const BILLET_LEVEL_THRESHOLD = 7; // 部队等级≥此值才值得billet（低于此直接裁军）

// ── range B: §C TECH_TREE + TECH_PREUNLOCK + JUNS (原 L995-L1143, 149 行) ──
// ── owner: politics chain ── (科技研究主入政治链 P1.b)
const TECH_TREE = {
  // ── 经济枝（INT）──
  econ1:  {name:'农桑初兴',branch:'经济',icon:'🌾',prereq:[],           cost:{gold:600,wood:400},  turns:6,  stat:'int', expReward:5,
           effect:{foodProdMult:0.06}, desc:'粮产+6%'},
  econ2:  {name:'精耕细作',branch:'经济',icon:'🌾',prereq:['econ1'],    cost:{gold:1000,wood:600}, turns:10, stat:'int', expReward:8,
           effect:{foodProdMult:0.06}, desc:'粮产再+6%'},
  econ3:  {name:'沃野千里',branch:'经济',icon:'🌾',prereq:['econ2'],    cost:{gold:1800,wood:1000},turns:16, stat:'int', expReward:12,
           effect:{foodProdMult:0.08}, desc:'粮产再+8%'},
  econ4:  {name:'通商惠工',branch:'经济',icon:'💰',prereq:[],           cost:{gold:700,wood:300},  turns:6,  stat:'int', expReward:5,
           effect:{goldProdMult:0.06}, desc:'金产+6%'},
  econ5:  {name:'互市兴利',branch:'经济',icon:'💰',prereq:['econ4'],    cost:{gold:1200,wood:500}, turns:10, stat:'int', expReward:8,
           effect:{goldProdMult:0.06}, desc:'金产再+6%'},
  econ6:  {name:'富国强兵',branch:'经济',icon:'💰',prereq:['econ5'],    cost:{gold:2200,wood:800}, turns:16, stat:'int', expReward:12,
           effect:{goldProdMult:0.08}, desc:'金产再+8%'},
  econ7:  {name:'漕运改良',branch:'经济',icon:'🚢',prereq:['econ2'],    cost:{gold:1200,wood:800}, turns:12, stat:'int', expReward:8,
           effect:{transferLossHalf:true}, desc:'调粮损耗减半'},
  econ8:  {name:'屯田制',  branch:'经济',icon:'🏘',prereq:['econ3'],    cost:{gold:2000,wood:600}, turns:18, stat:'int', expReward:18,
           effect:{bigCityFoodBonus:0.10}, desc:'人口>15万城市粮+10%'},
  econ9:  {name:'盐铁官营',branch:'经济',icon:'⚒',prereq:['econ5'],    cost:{gold:1800,iron:600}, turns:14, stat:'int', expReward:12,
           effect:{goldProdMult:0.05, ironProdMult:0.20}, desc:'金产+5%，铁产+20%'},
  econ10: {name:'轻赋薄徭',branch:'经济',icon:'📜',prereq:['econ6'],    cost:{gold:2500},          turns:20, stat:'int', expReward:18,
           effect:{recruitCostMult:-0.10}, desc:'征兵金费用-10%'},
  econ11: {name:'军屯精耕',branch:'经济',icon:'🌾',prereq:['econ8'],    cost:{gold:1500,wood:400}, turns:12, stat:'int', expReward:10,
           effect:{tuntianBoost:true}, desc:'休整屯田效率×3（基础×2）'},

  // ── 军事枝（COM）──
  mil1:   {name:'锐兵',    branch:'军事',icon:'⚔',prereq:[],            cost:{gold:500,iron:300},  turns:6,  stat:'com', expReward:5,
           effect:{atkMult:0.03}, desc:'ATK+3%'},
  mil2:   {name:'精锐之师',branch:'军事',icon:'⚔',prereq:['mil1'],     cost:{gold:900,iron:500},  turns:10, stat:'com', expReward:8,
           effect:{atkMult:0.03}, desc:'ATK再+3%'},
  mil3:   {name:'攻无不克',branch:'军事',icon:'⚔',prereq:['mil2'],     cost:{gold:1600,iron:800}, turns:16, stat:'com', expReward:12,
           effect:{atkMult:0.04}, desc:'ATK再+4%'},
  mil4:   {name:'坚盾',    branch:'军事',icon:'🛡',prereq:[],            cost:{gold:500,iron:300},  turns:6,  stat:'com', expReward:5,
           effect:{defMult:0.03}, desc:'DEF+3%'},
  mil5:   {name:'铁壁',    branch:'军事',icon:'🛡',prereq:['mil4'],     cost:{gold:900,iron:500},  turns:10, stat:'com', expReward:8,
           effect:{defMult:0.03}, desc:'DEF再+3%'},
  mil6:   {name:'固若金汤',branch:'军事',icon:'🛡',prereq:['mil5'],     cost:{gold:1600,iron:800}, turns:16, stat:'com', expReward:12,
           effect:{defMult:0.04}, desc:'DEF再+4%'},
  mil7:   {name:'扩军令',  branch:'军事',icon:'📯',prereq:['mil2'],     cost:{gold:1200,iron:600}, turns:12, stat:'com', expReward:8,
           effect:{squadMaxBonus:1000}, desc:'编制上限→8000'},
  mil8:   {name:'大军编制',branch:'军事',icon:'📯',prereq:['mil7'],     cost:{gold:2000,iron:1000},turns:16, stat:'com', expReward:12,
           effect:{squadMaxBonus:1000}, desc:'编制上限→9000'},
  mil9:   {name:'百万雄师',branch:'军事',icon:'📯',prereq:['mil8'],     cost:{gold:3000,iron:1500},turns:22, stat:'com', expReward:18,
           effect:{squadMaxBonus:1000}, desc:'编制上限→10000'},
  mil10:  {name:'营垒精通',branch:'军事',icon:'🏕',prereq:['mil5'],     cost:{gold:1000,wood:600}, turns:10, stat:'com', expReward:8,
           effect:{campCostMult:-0.40}, desc:'扎营消耗-40%'},
  mil11:  {name:'火攻秘术',branch:'军事',icon:'🔥',prereq:['mil10'],    cost:{gold:1400,wood:800}, turns:14, stat:'com', expReward:12,
           effect:{fireCostMult:-0.30}, desc:'火攻消耗-30%'},
  mil12:  {name:'斥候网',  branch:'军事',icon:'👁',prereq:['mil2','mil5'],cost:{gold:1200},         turns:12, stat:'com', expReward:8,
           effect:{visionBonus:1}, desc:'部队视野+1'},
  mil13:  {name:'精简军制',branch:'军事',icon:'💎',prereq:['mil6'],     cost:{gold:1800},          turns:14, stat:'com', expReward:12,
           effect:{salaryMult:-0.05}, desc:'野战军饷-5%'},

  // ── 练兵枝（WAR）──
  train1: {name:'乡勇操练',branch:'练兵',icon:'🏋',prereq:[],           cost:{gold:600},           turns:6,  stat:'war', expReward:5,
           effect:{initLevelBonus:1}, desc:'出厂等级+1'},
  train2: {name:'严格练兵',branch:'练兵',icon:'🏋',prereq:['train1'],   cost:{gold:1100},          turns:12, stat:'war', expReward:8,
           effect:{initLevelBonus:1}, desc:'出厂等级再+1'},
  train3: {name:'百战精兵',branch:'练兵',icon:'🏋',prereq:['train2'],   cost:{gold:2000,iron:500}, turns:18, stat:'war', expReward:18,
           effect:{initLevelBonus:1}, desc:'出厂等级再+1'},
  train4: {name:'武学',    branch:'练兵',icon:'📖',prereq:['train1'],   cost:{gold:800,wood:500},  turns:8,  stat:'war', expReward:5,
           effect:{statExpMult:0.15}, desc:'属性经验+15%'},
  train5: {name:'兵法传承',branch:'练兵',icon:'📖',prereq:['train4'],   cost:{gold:1500,wood:800}, turns:14, stat:'war', expReward:12,
           effect:{statExpMult:0.15}, desc:'属性经验再+15%'},
  train6: {name:'适性操演',branch:'练兵',icon:'🎯',prereq:['train4'],   cost:{gold:1000,wood:600}, turns:10, stat:'war', expReward:8,
           effect:{aptExpMult:0.20}, desc:'适性经验+20%'},
  train7: {name:'百炼成钢',branch:'练兵',icon:'🎯',prereq:['train6'],   cost:{gold:1800,wood:1000},turns:16, stat:'war', expReward:12,
           effect:{aptExpMult:0.20}, desc:'适性经验再+20%'},
  train8: {name:'士气如虹',branch:'练兵',icon:'🔥',prereq:['train2'],   cost:{gold:1200},          turns:12, stat:'war', expReward:8,
           effect:{moraleCapBonus:5}, desc:'士气上限+5'},
  train9: {name:'军魂不灭',branch:'练兵',icon:'🔥',prereq:['train8','train5'],cost:{gold:2500},     turns:22, stat:'war', expReward:18,
           effect:{moraleCapBonus:5}, desc:'士气上限再+5'},

  // ── 政治枝（CHA）──
  pol1:   {name:'怀柔远人',branch:'政治',icon:'🤝',prereq:[],           cost:{gold:500},           turns:6,  stat:'cha', expReward:5,
           effect:{surrenderLoyaltyBonus:5}, desc:'降将初始忠诚+5'},
  pol2:   {name:'推心置腹',branch:'政治',icon:'🤝',prereq:['pol1'],     cost:{gold:1000},          turns:10, stat:'cha', expReward:8,
           effect:{surrenderLoyaltyBonus:5}, desc:'降将初始忠诚再+5'},
  pol3:   {name:'恩威并施',branch:'政治',icon:'⚖',prereq:['pol1'],     cost:{gold:800},           turns:8,  stat:'cha', expReward:5,
           effect:{loyaltyRecovery:0.1}, desc:'忠诚自然恢复+0.1/旬'},
  pol4:   {name:'明镜高悬',branch:'政治',icon:'🏛',prereq:['pol3'],     cost:{gold:1200},          turns:12, stat:'cha', expReward:8,
           effect:{prefectProdBonus:0.05}, desc:'太守产出修正+5%'},
  pol5:   {name:'九品中正',branch:'政治',icon:'📋',prereq:['pol3','pol2'],cost:{gold:1500},         turns:14, stat:'cha', expReward:12,
           effect:{factionSafeZone:2}, desc:'派系安全区±15→±17'},
  pol6:   {name:'天下为公',branch:'政治',icon:'📋',prereq:['pol5'],     cost:{gold:2200},          turns:18, stat:'cha', expReward:18,
           effect:{factionSafeZone:2}, desc:'派系安全区±17→±19'},
  pol7:   {name:'唯才是举',branch:'政治',icon:'🎓',prereq:['pol5'],     cost:{gold:2000},          turns:16, stat:'cha', expReward:12,
           effect:{poachThreshold:-5, poachCostMult:-0.20}, desc:'挖角阈值↓5，费用-20%'},
  pol8:   {name:'天下归心',branch:'政治',icon:'👑',prereq:['pol6','pol7'],cost:{gold:3000},         turns:24, stat:'cha', expReward:18,
           effect:{captureRateBonus:0.10}, desc:'投降/挖角/招募率+10%'},

  // ── 民生枝（POL）──
  civ1:   {name:'安民告示',branch:'民生',icon:'📢',prereq:[],           cost:{gold:400},           turns:6,  stat:'pol', expReward:5,
           effect:{moraleRecovery:0.15}, desc:'民心恢复+0.15/旬'},
  civ2:   {name:'教化兴邦',branch:'民生',icon:'📢',prereq:['civ1'],     cost:{gold:900},           turns:10, stat:'pol', expReward:8,
           effect:{moraleRecovery:0.15}, desc:'民心恢复再+0.15'},
  civ3:   {name:'兴学育才',branch:'民生',icon:'🏫',prereq:['civ1'],     cost:{gold:700,wood:400},  turns:8,  stat:'pol', expReward:5,
           effect:{popQualityRecovery:0.05}, desc:'人口质量恢复+0.05/旬'},
  civ4:   {name:'百工兴盛',branch:'民生',icon:'🏫',prereq:['civ3'],     cost:{gold:1400,wood:700}, turns:14, stat:'pol', expReward:12,
           effect:{popQualityRecovery:0.05}, desc:'人口质量恢复再+0.05'},
  civ5:   {name:'地方自治',branch:'民生',icon:'🏘',prereq:['civ2'],     cost:{gold:1000},          turns:10, stat:'pol', expReward:8,
           effect:{gentryRecovery:0.15}, desc:'豪族恢复+0.15/旬'},
  civ6:   {name:'士族联姻',branch:'民生',icon:'🏘',prereq:['civ5'],     cost:{gold:1800},          turns:16, stat:'pol', expReward:12,
           effect:{gentryRecovery:0.15, occupiedMult:-0.20}, desc:'豪族恢复再+0.15，占领期-20%'},
  civ7:   {name:'军屯补给',branch:'民生',icon:'🚚',prereq:['civ3'],     cost:{gold:1200,wood:600}, turns:12, stat:'pol', expReward:8,
           effect:{supplyRangeBonus:2}, desc:'补给范围+2'},
  civ8:   {name:'千里粮道',branch:'民生',icon:'🚚',prereq:['civ7'],     cost:{gold:2000,wood:1000},turns:18, stat:'pol', expReward:18,
           effect:{supplyRangeBonus:2, supplyRationsBonus:1}, desc:'补给范围再+2，断粮缓冲+1旬'},
  civ9:   {name:'太平盛世',branch:'民生',icon:'🌸',prereq:['civ6','civ4'],cost:{gold:3000},        turns:24, stat:'pol', expReward:18,
           effect:{popGrowthMult:0.40}, desc:'民心>70城市人口增长+40%'},
  civ10:  {name:'徙民实边',branch:'民生',icon:'⇄',prereq:['civ5'],     cost:{gold:1200,wood:500}, turns:12, stat:'pol', expReward:10,
           effect:{migrateLossReduce:0.10, migrateDstPenReduce:0.30}, desc:'迁民损耗-10%，目的城惩罚-30%'},
};

// 开局预解锁
// ── owner: politics chain ──
const TECH_PREUNLOCK = {
  wei: ['mil1','econ4','pol1'],
  shu: ['train1','civ1','pol1'],
  wu:  ['econ1','civ1','mil4'],
  nanman: [], // ★ v144: 南蛮无预解锁科技
};

// 政治链 P1.a (科技 cache lets + helpers,L1380-L1409) 已抽离到 src/chains/politics.js (Session 3.7)

/** 获取势力的squad编制上限（基础7000+科技加成） */
// 军事链 MIL2 (编制 wrapper getSquadMax/getUnitMax/getAvailableTechs,L1380-L1398) 已抽离到 src/chains/military.js

// 政治链 P1.b (科技 affordability + research workflow,L1432-L1554) 已抽离到 src/chains/politics.js




// 地图基础设施 M0 (section header,L1404-L1408) 已抽离到 src/core/map.js (Session 3.11 Commit 1)

// ─── 郡 ───
// ── owner: cross-chain (multiple consumers) ── (郡数据,军事/政治/经济共用)
const JUNS = {
  siyujun:    {name:'司豫郡',  fac:'wei'},
  heluojun:   {name:'河洛郡',  fac:'wei'},
  jiqingjun:  {name:'冀青郡',  fac:'wei'},
  xibejun:    {name:'西北郡',  fac:'wei'},
  yizhoujun:  {name:'益州郡',  fac:'shu'},
  hanzhongjun:{name:'汉中郡',  fac:'shu'},
  jingzhoujun:{name:'荆州郡',  fac:'shu'},
  nanzhongjun:{name:'南中郡',  fac:'nanman'},
  yangzhoujun:{name:'扬州郡',  fac:'wu'},
  jiaxiajun:  {name:'江夏郡',  fac:'wu'},
  huainanjun: {name:'淮南郡',  fac:'wu'},
  jingxiangjun:{name:'荆湘郡', fac:'wu'},
};

// ── range C: §G+§H 腐败 + 派系定义 + 官职 + 朝议提案 (原 L1700-L1871, 172 行) ──
// ── owner: economy chain ── (腐败 calcCityCorruption 主入经济链 E2)
const CORRUPT_PER_CITY = 0.02;   // 每多1城 +2% 基础腐败率
const CORRUPT_FREE_CITIES = 3;   // 3城以下无腐败
const CORRUPT_CAP = 0.30;        // 基础腐败率上限30%
// 豪族链 G3 (CORRUPT_GENTRY_MAP + _getCorruptGentryMod,L4195-L4205) 已抽离到 src/chains/gentry.js
/**
 * 计算单城实际腐败率
 * @param {Object} city - 城市对象
 * @param {number} cityCount - 该势力总城数
 * @returns {number} 0~1之间的实际腐败率
 */
// 经济链 E2 (城市腐败 calcCityCorruption,L3979-L4008) 已抽离到 src/chains/economy.js

/** ═══════════════════════════════════════════════════════
 *  ★ v172: 势力演进阶段（军阀 → 一方之主 → 政权）
 *  ═══════════════════════════════════════════════════════ */

// 政治链 P2 (阶段演进,L4163-L4352) 已抽离到 src/chains/politics.js


// ── owner: cross-chain (general + gentry) ── (派系定义,武将链 GEN5.b 派系系统 + 豪族链州派系映射)
const FACTION_DEFS = [
  {id:'founding',          label:'创始团队', baseMult:1.5},
  {id:'royalty',           label:'宗亲',     baseMult:1.0},
  {id:'noble',             label:'旧阀贵族', baseMult:0.8},  // ★ v124: 马超等外部贵族/旧军阀
  {id:'warlord_remnant',   label:'旧阀遗族', baseMult:1.2},
  {id:'gentry_zhongyuan',  label:'中原士族', baseMult:1.0, gentryStates:['si','yu','yan']},
  {id:'gentry_hebei',      label:'河北士族', baseMult:1.0, gentryStates:['ji','qing','you','bing']}, // ★ v172: 独立为河北集团
  {id:'gentry_xuzhou',     label:'徐州士族', baseMult:1.0, gentryStates:['xu']},                    // ★ v172: 独立为徐州陈登集团
  {id:'gentry_jingzhou',   label:'荆州士族', baseMult:1.0, gentryStates:['jing']},
  {id:'gentry_yizhou',     label:'益州士族', baseMult:1.0, gentryStates:['yi','nanzhong']},
  {id:'gentry_jiangdong',  label:'江东士族', baseMult:1.0, gentryStates:['yang','jiao']},
  {id:'gentry_xiliang',    label:'西凉士族', baseMult:1.0, gentryStates:['liang']},
  {id:'gentry_dongzhou',   label:'东州派',   baseMult:0.8, gentryStates:[]}, // ★ v161: 永远的客居者
  {id:'gentry_huaisi',     label:'淮泗派',   baseMult:0.8, gentryStates:[]}, // ★ v161: 永远的客居者
  {id:'defector',          label:'降将',     baseMult:0.4},
  {id:'newcomer',          label:'新附',     baseMult:0.6},
  {id:'humble',            label:'寒门豪族', baseMult:1.0}, // v172: 含寒门武将+地方豪族(magnate)
];

// ═══════════════════════════════════════════════════════
// D1 官职系统 — 常量定义
// ═══════════════════════════════════════════════════════

/** 官职规模档位（按城市数 — 仅 tier3/tier2 名额，tier1 由 stage 决定）
 *  ★ v181: 拆耦合 — POST_TIERS 只管 tier3/tier2，tier1 走 STAGE_TIER1_SLOTS */
// ── owner: politics chain ── (官职任命 D1 系统)
const POST_TIERS = [
  {minCities:10, label:'王', mil:[6,4], civ:[6,4]},  // [tier3, tier2]
  {minCities:6,  label:'公', mil:[5,3], civ:[5,3]},
  {minCities:3,  label:'侯', mil:[3,2], civ:[3,2]},
  {minCities:1,  label:'诸侯',mil:[2,1], civ:[2,1]},
];

/** ★ v181: stage 决定的 tier1 名额（武/文）— 只有政权阶段才能任 tier1 */
// ── owner: politics chain ──
const STAGE_TIER1_SLOTS = {
  warlord:  {mil:0, civ:0},
  regional: {mil:0, civ:0},
  regime:   {mil:1, civ:1},
};

/** ★ v181: stage 卡 label 上限 — 军阀至多"诸侯"，一方之主至多"公"，政权至"王"
 *  即使城市数推到王档，stage 不够也只能用上限的 label */
// ── owner: politics chain ──
const STAGE_LABEL_CAP = {
  warlord:  '诸侯',
  regional: '公',
  regime:   '王',
};

/** 武官定义 */
// ── owner: politics chain ──
const MIL_POSTS = {
  tier1: [
    {name:'大将军', tier:1, track:'mil', merit:60, loyalty:0.40, salary:50,
     buff:{recruitCost:-0.08, reinforce:0.08, upkeep:-0.05, expGain:0.20}, buffStat:'com',
     buffDesc:'征兵费-8%·补员+8%·维护费-5%·经验+20%'},
  ],
  tier2: [
    {name:'前将军', tier:2, track:'mil', merit:30, loyalty:0.25, salary:30,
     buff:{recruitCost:-0.06}, buffStat:'com', buffDesc:'征兵费-6%'},
    {name:'后将军', tier:2, track:'mil', merit:30, loyalty:0.25, salary:30,
     buff:{reinforce:0.06}, buffStat:'com', buffDesc:'补员速度+6%'},
    {name:'左将军', tier:2, track:'mil', merit:30, loyalty:0.25, salary:30,
     buff:{upkeep:-0.05}, buffStat:'com', buffDesc:'维护费-5%'},
    {name:'右将军', tier:2, track:'mil', merit:30, loyalty:0.25, salary:30,
     buff:{foodCost:-0.06}, buffStat:'com', buffDesc:'粮耗-6%'},
  ],
  tier3: [
    {name:'校尉'},  {name:'偏将军'}, {name:'裨将军'},
    {name:'都尉'},  {name:'牙门将'}, {name:'奋威将'},
  ].map(p=>({...p, tier:3, track:'mil', merit:10, loyalty:0.15, salary:15, buff:null, buffStat:null, buffDesc:''})),
};

/** 文官定义 */
// ── owner: politics chain ──
const CIV_POSTS = {
  tier1: [
    {name:'丞相', tier:1, track:'civ', merit:50, loyalty:0.40, salary:45,
     buff:{goldProd:0.06, foodProd:0.06, stratRate:0.08, giftEffect:0.20}, buffStat:'pol',
     buffDesc:'金+6%·粮+6%·计谋率+8%·送礼+20%'},
  ],
  tier2: [
    {name:'尚书令', tier:2, track:'civ', merit:25, loyalty:0.25, salary:25,
     buff:{goldProd:0.05}, buffStat:'pol', buffDesc:'金币产出+5%'},
    {name:'侍中',   tier:2, track:'civ', merit:25, loyalty:0.25, salary:25,
     buff:{foodProd:0.05}, buffStat:'pol', buffDesc:'粮食产出+5%'},
    {name:'太常',   tier:2, track:'civ', merit:25, loyalty:0.25, salary:25,
     buff:{morale:0.20}, buffStat:'pol', buffDesc:'民心回复+0.2/旬'},
    {name:'光禄勋', tier:2, track:'civ', merit:25, loyalty:0.25, salary:25,
     buff:{buildSpeed:0.15}, buffStat:'pol', buffDesc:'建设加速15%'},
  ],
  tier3: [
    {name:'主簿'}, {name:'从事'}, {name:'长史'},
    {name:'功曹'}, {name:'参军'}, {name:'典农'},
  ].map(p=>({...p, tier:3, track:'civ', merit:8, loyalty:0.15, salary:12, buff:null, buffStat:null, buffDesc:''})),
};

/** 所有官职平铺表（方便查找） */
// ── owner: politics chain ── (IIFE 派生 from MIL_POSTS + CIV_POSTS)
const ALL_POSTS = [
  ...MIL_POSTS.tier1, ...MIL_POSTS.tier2, ...MIL_POSTS.tier3,
  ...CIV_POSTS.tier1, ...CIV_POSTS.tier2, ...CIV_POSTS.tier3,
];

/** 初始功绩值（开局势力武将） */
// ── owner: politics chain ── (功绩属官职任命系统)
const MERIT_INIT = {
  // 魏
  曹操:150, 张辽:95, 郭嘉:85, 夏侯惇:90, 荀彧:100, 曹仁:85, 乐进:65,
  于禁:70, 徐晃:80, 张郃:75, 司马懿:120, 夏侯渊:80, 许褚:70, 典韦:75,
  荀攸:80, 程昱:70, 贾诩:85, 满宠:55, 钟繇:65, 王朗:45, 曹洪:60, 郭淮:50,
  // 蜀
  刘备:150, 关羽:100, 张飞:95, 诸葛亮:140, 赵云:90, 马超:70, 黄忠:75,
  魏延:60, 庞统:75, 法正:70, 姜维:40, 王平:45, 廖化:35, 马岱:45,
  董允:35, 张翼:30, 吴懿:40, 马忠:35, 霍峻:40,
  // 吴
  孙权:140, 周瑜:130, 甘宁:70, 鲁肃:85, 太史慈:70, 吕蒙:80, 陆逊:80,
  黄盖:60, 凌统:55, 丁奉:50, 程普:65, 孙策:90, 朱然:55,
  张昭:75, 诸葛瑾:60, 韩当:55, 徐盛:50, 潘璋:40,
  // 在野
  徐庶:30, 陈宫:35, 田丰:40, 沮授:40, 张松:20, 庞德:50, 文聘:40,
  高顺:45, 李严:30, 邓艾:15, 钟会:10, 孟达:20, 申耽:15, 马谡:10,
  郝昭:30, 张任:35, 杨洪:15, 蒋琬:15, 费祎:15, 向宠:15,
};

// ═══════════════════════════════════════════════════════
// D1 官职系统 — 辅助函数
// ═══════════════════════════════════════════════════════

/** 获取势力当前规模档位（label 受 stage 上下限约束）
 *  ★ v181: 城市数定基础档，但 stage 设上下限 cap：
 *    warlord 至多"诸侯"；regional 至少"侯"至多"公"；regime 至少"侯"至多"王"
 *    下限存在意义：失城但 stage 不降级时，叙事上仍保持政权身份的最低尊严 */
// ── owner: politics chain ──
const STAGE_LABEL_FLOOR = {
  warlord:  '诸侯',
  regional: '侯',
  regime:   '侯',
};

// 武将链 GEN5.a (出身地 + 籍贯地形 getGenBirthplace/isHomeTerrain/_isClanRoyalty,L2867-L2904) 已抽离到 src/chains/general.js

// 武将链 GEN5.b (派系系统 9 funcs 含 triggerFactionEvent,L2906-L3353) 已抽离到 src/chains/general.js

// ═══════════════════════════════════════════════════════
// I3 朝议系统 — 每季度tier1/2官员提案，玩家4选2
// ═══════════════════════════════════════════════════════

// ── owner: politics chain ── (朝议 I3 提案系统)
const COURT_PROPOSALS_MIL = [
  {id:'conscript',  name:'征兵令',   desc:'全势力征兵费-15%',          buffKey:'recruitCost', baseVal:-0.15, statScale:'com', scaleDesc:'征兵费'},
  {id:'upkeep',     name:'扩军备战', desc:'全势力部队维护费-10%',      buffKey:'upkeep',      baseVal:-0.10, statScale:'com', scaleDesc:'维护费'},
  {id:'reinforce',  name:'充员令',   desc:'全势力补员速度+10%',        buffKey:'reinforce',   baseVal:0.10,  statScale:'com', scaleDesc:'补员'},
  {id:'milBuild',   name:'军防工程', desc:'全境城墙·兵营建设成本-30%', buffKey:'milBuildCost',baseVal:-0.30, statScale:'com', scaleDesc:'军建成本'},
];
// ── owner: politics chain ──
const COURT_PROPOSALS_CIV = [
  {id:'farm',    name:'劝农令', desc:'全势力粮食产出+12%',      buffKey:'foodProd',    baseVal:0.12,  statScale:'pol', scaleDesc:'粮产'},
  {id:'trade',   name:'兴商令', desc:'全势力金币产出+10%',      buffKey:'goldProd',    baseVal:0.10,  statScale:'pol', scaleDesc:'金产'},
  {id:'morale',  name:'安民策', desc:'全势力民心回复+0.5/旬',   buffKey:'morale',      baseVal:0.50,  statScale:'pol', scaleDesc:'民心'},
  {id:'recruit', name:'招贤令', desc:'在野武将投效概率+25%',     buffKey:'recruitWild', baseVal:0.25,  statScale:'pol', scaleDesc:'招贤'},
];
