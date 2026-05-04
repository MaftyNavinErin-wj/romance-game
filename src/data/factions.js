// src/data/factions.js
//
// 势力初始 + 君主初始 + 势力 ethos 初始 + 初始外交关系
//
// 来源:从 project_romance_v181.html 整体抽离(Session 1.4 / 阶段 1)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//   - FAC(原 L1185-L1190):4 主势力定义 + 君主(name/full/ruler/color/cls)
//   - ALL_FACS(原 L1192):派生,所有正式势力(不含叛军)
//   - PLAYABLE_FACS(原 L1193):可选玩家势力列表
//   - FAC_IDENTITY(原 L1199-L1209):势力身份初始(type/stage/anchorState),
//     用于 C3 宣称/天子/称帝系统;运行时可变,称帝/天子易主时修改 type
//   - ETHOS_INIT(原 L1234-L1239):势力价值观 5 维初始值
//   - DIPLO_INIT(原 L1638-L1646):势力间双向初始外交关系
//
// 留 v181 的:
//   - STAGE_NAMES / STAGE_ORDER / STAGE_GENTRY_BOUNDS / STAGE_PROMO
//     (stage 演进系统枚举,Session 1.6 共用枚举)
//   - ETHOS_DIMS / ETHOS_LABELS / ETHOS_DIM_NAMES(ethos schema enum,1.6)
//   - STAGE_TIER1_SLOTS / STAGE_LABEL_CAP / STAGE_LABEL_FLOOR / TRIBUTE_RATES
//     (stage 派生常量,Session 1.5 / 1.6)
//   - FACTION_DEFS L4561(B1 政治派系定义,非势力本身)
//   - FOUNDING_CORE(B1 创始团队系统)
//
// loading 顺序:本文件在 v181.html 主 inline script 之前加载;factions.js 内部
// 仅声明数据 + Object.keys.filter 派生,不调用任何外部函数,顶层执行安全。

// ── FACTIONS ──
const FAC={
  wei:{name:'魏',full:'曹魏',ruler:'曹操',color:'#1a5f8a',cls:'wei'},
  shu:{name:'蜀',full:'蜀汉',ruler:'刘备',color:'#1a7a3a',cls:'shu'},
  wu: {name:'吴',full:'孙吴',ruler:'孙权',color:'#a82a1a',cls:'wu'},
  nanman:{name:'蛮',full:'南蛮',ruler:'孟获',color:'#8b6914',cls:'nanman'},
};
// ★ v144: 动态势力列表（替代硬编码['wei','shu','wu']，为190剧本多势力做准备）
const ALL_FACS = Object.keys(FAC).filter(f=>f!=='rebel'); // 所有正式势力（不含叛军）
const PLAYABLE_FACS = ['wei','shu','wu','nanman']; // 可选玩家势力

/** 势力身份标签（运行时可变，称帝/天子易主时修改type） */
// v172: 新增 stage（势力演进阶段）和 anchorState（一方之主的根据地州）
//   type:  对外合法性（emperor_holder/han_royal/warlord/tribal/emperor）— 影响宣战/信誉
//   stage: 对内治理阶段（warlord/regional/regime）— 影响派系影响力+豪族上下限
//   anchorState: 仅 regional 阶段有值，军阀/政权均为 null
const FAC_IDENTITY = {
  wei:    { type:'emperor_holder', _baseType:'warlord',  traits:['枭雄'],     stage:'regime',  anchorState:null },
  shu:    { type:'han_royal',      _baseType:'han_royal', traits:['仁主','汉室'], stage:'regime',  anchorState:null },
  wu:     { type:'warlord',        _baseType:'warlord',  traits:[],            stage:'regime',  anchorState:null },
  nanman: { type:'tribal',         _baseType:'tribal',   traits:['蛮族'],      stage:'warlord', anchorState:null },
};

const ETHOS_INIT = {
  wei:    { mandate:  15, power:  20, civil:  0, military: 10, strategy: 15 },
  shu:    { mandate: -30, power:   0, civil:  5, military:-20, strategy: 10 },
  wu:     { mandate:   0, power: -20, civil:  0, military:  0, strategy:-20 },
  nanman: { mandate:   0, power:   0, civil:-10, military: 15, strategy:  5 },
};

const DIPLO_INIT={ // ★ v120: 三国开局全面和平，需经外交恶化/宣战才开战
  'wei-shu':{status:'neutral',rel:40}, // ★ v133: 30→40 给外交缓冲
  'wei-wu': {status:'neutral',rel:45}, // ★ v133: 38→45 给外交缓冲
  'shu-wu': {status:'ally',rel:78},
  // ★ v144: 南蛮外交初始化
  'wei-nanman':{status:'neutral',rel:25},
  'shu-nanman':{status:'vassal',rel:50,suzerain:'shu'}, // 南蛮为蜀附庸
  'wu-nanman': {status:'neutral',rel:30},
};
