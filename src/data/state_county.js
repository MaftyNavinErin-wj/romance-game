// src/data/state_county.js
//
// 州体系 + 派系-州映射 + 豪族家族 + 县属性 + GEN_TAGS clan 装配 IIFE
//
// 来源:从 project_romance_v181.html 整体抽离 (refactor/data-completion S2, 2026-05-05)
// 抽离方式:**只搬运,不改逻辑** (verbatim relocation), 原则 #8 Node 双脚本 + 标点保留.
// 接口风格:全局 const + IIFE 派生 (同 phase 1 决定), 所有调用点不需改.
//
// 抽离的 11 const + 4 IIFE 派生 + 1 嵌套 IIFE-helper (419 行 verbatim, 单段连续):
//   §E 州体系 + 派系-州映射:
//     - STATE_CITIES (原 L982-L1009 区段): 13 州 + 南中 → 城市数组映射
//     - STATE_NAMES / STATE_TIER: 州显示名 + 州 tier
//     - CITY_TO_STATE (IIFE 反查): `Object.entries(STATE_CITIES).forEach(...)`
//     - STATE_TO_GENTRY_FAC: 州 → 豪族派系
//     - GENTRY_FAC_TO_STATES (IIFE 反查): 豪族派系 → 州数组
//     - CLAN_FAMILIES: 豪族家族定义 (士族 / 地方豪族 / 宗族)
//     - MAGNATE_CLANS: 地方豪族 Set
//     - COUNTY_DATA: 县详细数据 (~276 行, 单 const 第三大)
//   §F 派生 + 县属性 + clan 装配 IIFE:
//     - COUNTY_NAME_TO_CITY (IIFE): 县名 → city id 反查
//     - COUNTY_INDEX (IIFE): 县名 → county 对象反查
//     - LOCAL_BONUS_CAP_V170 / COUNTY_CLAN_SENS / COUNTY_TYPE_SENS_V170: 县属性参数
//     - **_CLAN_MAP IIFE (block-scoped)**: 给士族武将批量注入 clan 字段 → GEN_TAGS[name].clan
//
// 跨文件依赖 (DP-A 风险确认可控):
//   - _CLAN_MAP IIFE 写 GEN_TAGS[name].clan, GEN_TAGS 在 src/data/generals.js (phase 1.2 已抽).
//     加载顺序约束:**state_county.js 必须在 generals.js 之后加载**.
//   - CLAN_FAMILIES 同文件内 (本 const, _CLAN_MAP 引用), 内向无外部依赖.
//   - COUNTY_NAME_TO_CITY / COUNTY_INDEX IIFE 依赖同文件 COUNTY_DATA, 内向.
//   - 其他 IIFE 全部内向 (CITY_TO_STATE 依赖 STATE_CITIES; GENTRY_FAC_TO_STATES 依赖 STATE_TO_GENTRY_FAC).
//
// loading 顺序:在 src/data/generals.js 之后 (verbatim 文档 + script tag 顺序双保证).
// 同 realm classic <script> 共享 script-scope, 跨 script lazy resolve (p3.1 / p3.4 验证锚点).

// ════════════════════════════════════════════════════════════
// §E+§F refactor/data-completion S2: 州体系 + 县 + clan IIFE
// 共 419 行 verbatim, 1 段连续 range (原 v181 L981-L1399)
// ════════════════════════════════════════════════════════════

// ── range §E+§F 州县 + 派生 IIFE + _CLAN_MAP IIFE (原 L981-L1399, 419 行) ──
// ═══════════════════════════════════════════════════════
// ★ v172: 州体系（13州+南中）— 取代大区，作为核心地理单位
// 州既用于本土判定，也用于势力演进阶段（军阀→一方之主→政权）的晋升判定
// ═══════════════════════════════════════════════════════
const STATE_CITIES = {
  si:       ['luoyang','changan','hedong'],                                          // 司隶
  yu:       ['xuchang','chenliu','nanyang','xinye','xiaopei'],                       // 豫州（含颍川·陈留·南阳·沛国小沛 1f-p2）
  yan:      ['guandu','puyang'],                                                     // 兖州
  xu:       ['xuzhou','xiapi','guangling','donghai','langya'],                       // 徐州（含东海郡 1f-p2 + 琅琊郡 1f-p3）
  qing:     ['qingzhou','beihai','pingyuan'],                                        // 青州（含平原郡 1f）
  ji:       ['ye','bohai'],                                                          // 冀州（含渤海郡南皮 1f）
  you:      ['youzhou','beiping','zhuojun'],                                         // 幽州（含涿郡 1f）
  bing:     ['bingzhou','shangdang'],                                                // 并州（含上党郡 1f-p2）
  liang:    ['liangzhou','wuwei','tianshui','anding'],                               // 凉州（含安定郡 1f-p2）
  jing:     ['xiangyang','jingzhou','yiling','shangyong','changsha','lingling','wuchang','wuling'], // 荆州（含武陵郡 1f-p2）
  yang:     ['hefei','shouchun','lujiang','jianye','jingkou','huiji','chaigang','yuzhang','suzhou'], // 扬州（含吴郡 1f-p3）
  yi:       ['chengdu','yizhou_n','bazhong','hanzhong','yongan','luocheng'],         // 益州
  jiao:     ['jiaozhou','panyu'],                                                    // 交州
  nanzhong: ['jianning'],                                                            // 南中（非十三州，蛮地）
};

const STATE_NAMES = {
  si:'司隶', yu:'豫州', yan:'兖州', xu:'徐州', qing:'青州', ji:'冀州',
  you:'幽州', bing:'并州', liang:'凉州', jing:'荆州', yang:'扬州',
  yi:'益州', jiao:'交州', nanzhong:'南中',
};

// 州分级：large(≥5城，能培养政权)·medium(3-4城，能培养一方之主)·small(≤2城，边缘州)
// 1f/1f-p2/1f-p3 +10 新城 tier 升级: yu 4→5 / xu 3→5 → large; qing 2→3 / you 2→3 → medium
const STATE_TIER = {
  jing:'large', yang:'large', yi:'large', yu:'large', xu:'large',
  si:'medium', liang:'medium', qing:'medium', you:'medium',
  yan:'small', ji:'small', bing:'small', jiao:'small', nanzhong:'small',
};

// 城市→州反查
const CITY_TO_STATE = {};
Object.entries(STATE_CITIES).forEach(([s, cities]) => cities.forEach(cid => { CITY_TO_STATE[cid] = s; }));

// 州→士族派系：hebei/xuzhou独立；dongzhou/huaisi是客居派不绑州，仅为占位用于反查
const STATE_TO_GENTRY_FAC = {
  si:'gentry_zhongyuan', yu:'gentry_zhongyuan', yan:'gentry_zhongyuan',
  ji:'gentry_hebei', qing:'gentry_hebei', you:'gentry_hebei', bing:'gentry_hebei',
  xu:'gentry_xuzhou',
  jing:'gentry_jingzhou',
  yi:'gentry_yizhou', nanzhong:'gentry_yizhou',
  yang:'gentry_jiangdong', jiao:'gentry_jiangdong',
  liang:'gentry_xiliang',
};

// 士族派系→属州列表（反向映射，用于朝议属县钩子）
const GENTRY_FAC_TO_STATES = {};
Object.entries(STATE_TO_GENTRY_FAC).forEach(([s, fac]) => {
  if(!GENTRY_FAC_TO_STATES[fac]) GENTRY_FAC_TO_STATES[fac] = [];
  GENTRY_FAC_TO_STATES[fac].push(s);
});

// ═══════════════════════════════════════════════════════
// ★ v161 属县系统 — 家族常量 + 属县静态数据
// ═══════════════════════════════════════════════════════
const CLAN_FAMILIES = {
  yc_xun:   '颍川荀氏', yc_zhong: '颍川钟氏', yc_chen:  '颍川陈氏',
  hn_sima:  '河内司马氏', hy_yang: '弘农杨氏',
  wj_gu:    '吴郡顾氏', wj_lu:    '吴郡陆氏', wj_zhu:   '吴郡朱氏',
  // ★ v179fix P31: 删除 dead key — rn_yuan(汝南袁氏)、wj_zhang(吴郡张氏) v170 后已无引用
  lj_zhou:  '庐江周氏', ff_ma:    '扶风马氏', xp_chen:  '下邳陈氏',
  tyjg_wang:'太原王氏', qh_cui:   '清河崔氏',
  sq_zhang: '蜀郡张氏', sq_huang: '蜀郡黄氏', bx_huang: '巴西黄氏',
  sy_shen:  '上庸申氏', nj_huo:   '南郡霍氏',
  px_huang: '平原华氏', // 华歆
  // ★ v170: magnate新增4家
  pg_cao:   '沛国曹氏', pg_xhs:   '沛国夏侯氏',
  qg_xu:    '谯国许氏', dh_mi:    '东海糜氏',
};

/** ★ v170: magnate家族（10家）— 经济×1.5放大 + shock×2.0 敏感 */
const MAGNATE_CLANS = new Set([
  '颍川钟氏', '河内司马氏', '谯国许氏',
  '沛国曹氏', '沛国夏侯氏', '东海糜氏',
  '扶风马氏', '吴郡陆氏', '吴郡顾氏', '吴郡朱氏',
]);

/** 属县静态数据：每城3-5个县，popShare之和≈1.0（initGame时归一化） */
const COUNTY_DATA = {
  // ── 大城(5县) ──
  xuchang:[
    {name:'许县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'颍阴',type:'clan_base',clanFamily:CLAN_FAMILIES.yc_xun,popShare:0.20},
    {name:'长社',type:'clan_base',clanFamily:CLAN_FAMILIES.yc_zhong,magnate:true,popShare:0.18},
    {name:'鄢陵',type:'common',clanFamily:null,popShare:0.15},
    {name:'临颍',type:'common',clanFamily:null,popShare:0.12},
  ],
  luoyang:[
    {name:'洛阳',type:'seat',clanFamily:null,popShare:0.35},
    {name:'温县',type:'clan_base',clanFamily:CLAN_FAMILIES.hn_sima,magnate:true,popShare:0.20},
    {name:'巩县',type:'common',clanFamily:null,popShare:0.18},
    {name:'偃师',type:'common',clanFamily:null,popShare:0.15},
    {name:'缑氏',type:'common',clanFamily:null,popShare:0.12},
  ],
  xuzhou:[
    {name:'彭城',type:'seat',clanFamily:null,popShare:0.40},
    {name:'下邳',type:'clan_base',clanFamily:CLAN_FAMILIES.xp_chen,popShare:0.25},
    // 1f-p4: '朐县' (dh_mi magnate) moved → donghai (东海郡治, history-correct)
    {name:'东海',type:'common',clanFamily:null,popShare:0.15},
    {name:'广戚',type:'common',clanFamily:null,popShare:0.12},
    {name:'兰陵',type:'common',clanFamily:null,popShare:0.08},
  ],
  ye:[
    {name:'邺县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'清河',type:'clan_base',clanFamily:CLAN_FAMILIES.qh_cui,popShare:0.20},
    {name:'魏县',type:'common',clanFamily:null,popShare:0.18},
    {name:'内黄',type:'common',clanFamily:null,popShare:0.15},
    {name:'临漳',type:'common',clanFamily:null,popShare:0.12},
  ],
  changan:[
    {name:'长安',type:'seat',clanFamily:null,popShare:0.35},
    {name:'扶风',type:'clan_base',clanFamily:CLAN_FAMILIES.ff_ma,magnate:true,popShare:0.20},
    {name:'华阴',type:'clan_base',clanFamily:CLAN_FAMILIES.hy_yang,popShare:0.18},
    {name:'新丰',type:'common',clanFamily:null,popShare:0.15},
    {name:'蓝田',type:'common',clanFamily:null,popShare:0.12},
  ],
  chengdu:[
    {name:'成都县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'郫县',type:'clan_base',clanFamily:CLAN_FAMILIES.sq_zhang,popShare:0.20},
    {name:'广都',type:'clan_base',clanFamily:CLAN_FAMILIES.sq_huang,popShare:0.18},
    {name:'新都',type:'common',clanFamily:null,popShare:0.15},
    {name:'繁县',type:'common',clanFamily:null,popShare:0.12},
  ],
  jianye:[
    {name:'建业县',type:'seat',clanFamily:null,popShare:0.45},
    // 1f-p4: '吴县' (wj_gu/wj_lu/wj_zhu magnate) moved → suzhou (吴郡治, history-correct)
    {name:'丹阳',type:'common',clanFamily:null,popShare:0.22},
    {name:'句容',type:'common',clanFamily:null,popShare:0.18},
    {name:'秣陵',type:'common',clanFamily:null,popShare:0.15},
  ],
  jingzhou:[
    {name:'江陵',type:'seat',clanFamily:null,popShare:0.35},
    {name:'枝江',type:'clan_base',clanFamily:CLAN_FAMILIES.nj_huo,popShare:0.20},
    {name:'当阳',type:'common',clanFamily:null,popShare:0.18},
    {name:'华容',type:'common',clanFamily:null,popShare:0.15},
    {name:'公安',type:'common',clanFamily:null,popShare:0.12},
  ],
  wuchang:[
    {name:'武昌县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'吴陵',type:'clan_base',clanFamily:CLAN_FAMILIES.wj_zhu,magnate:true,popShare:0.20}, // ★ v170: wj_lu→wj_zhu
    {name:'鄂县',type:'common',clanFamily:null,popShare:0.18},
    {name:'阳新',type:'common',clanFamily:null,popShare:0.15},
    {name:'下雉',type:'common',clanFamily:null,popShare:0.12},
  ],
  // ── 中城(4县) ──
  nanyang:[
    {name:'宛县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'新野',type:'common',clanFamily:null,popShare:0.25},
    {name:'棘阳',type:'common',clanFamily:null,popShare:0.22},
    {name:'穰县',type:'common',clanFamily:null,popShare:0.18},
  ],
  hedong:[
    {name:'安邑',type:'seat',clanFamily:null,popShare:0.35},
    {name:'闻喜',type:'common',clanFamily:null,popShare:0.25},
    {name:'解县',type:'common',clanFamily:null,popShare:0.22},
    {name:'蒲坂',type:'common',clanFamily:null,popShare:0.18},
  ],
  qingzhou:[
    {name:'临淄',type:'seat',clanFamily:null,popShare:0.35},
    {name:'乐安',type:'common',clanFamily:null,popShare:0.25},
    {name:'千乘',type:'common',clanFamily:null,popShare:0.22},
    {name:'般阳',type:'common',clanFamily:null,popShare:0.18},
  ],
  youzhou:[
    {name:'蓟县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'涿郡',type:'common',clanFamily:null,popShare:0.25},
    {name:'范阳',type:'common',clanFamily:null,popShare:0.22},
    {name:'右北平',type:'common',clanFamily:null,popShare:0.18},
  ],
  hanzhong:[
    {name:'南郑',type:'seat',clanFamily:null,popShare:0.35},
    {name:'褒中',type:'common',clanFamily:null,popShare:0.25},
    {name:'沔阳',type:'common',clanFamily:null,popShare:0.22},
    {name:'成固',type:'common',clanFamily:null,popShare:0.18},
  ],
  xiangyang:[
    {name:'襄阳县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'宜城',type:'common',clanFamily:null,popShare:0.25},
    {name:'中庐',type:'common',clanFamily:null,popShare:0.22},
    {name:'邓县',type:'common',clanFamily:null,popShare:0.18},
  ],
  chenliu:[
    {name:'陈留县',type:'seat',clanFamily:null,popShare:0.40},
    // 1f-p4: '谯县' (pg_cao/pg_xhs/qg_xu magnate) moved → xiaopei (沛国治, history-correct)
    {name:'雍丘',type:'common',clanFamily:null,popShare:0.25},
    {name:'尉氏',type:'common',clanFamily:null,popShare:0.20},
    {name:'扶沟',type:'common',clanFamily:null,popShare:0.15},
  ],
  xiapi:[
    {name:'下邳县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'东城',type:'common',clanFamily:null,popShare:0.25},
    {name:'淮阴',type:'common',clanFamily:null,popShare:0.22},
    {name:'盱眙',type:'common',clanFamily:null,popShare:0.18},
  ],
  guangling:[
    {name:'广陵县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'射阳',type:'common',clanFamily:null,popShare:0.25},
    {name:'海陵',type:'common',clanFamily:null,popShare:0.22},
    {name:'高邮',type:'common',clanFamily:null,popShare:0.18},
  ],
  puyang:[
    {name:'濮阳县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'白马',type:'common',clanFamily:null,popShare:0.25},
    {name:'鄄城',type:'common',clanFamily:null,popShare:0.22},
    {name:'东阿',type:'common',clanFamily:null,popShare:0.18},
  ],
  hefei:[
    {name:'合肥县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'逍遥津',type:'common',clanFamily:null,popShare:0.25},
    {name:'舒县',type:'common',clanFamily:null,popShare:0.22},
    {name:'居巢',type:'common',clanFamily:null,popShare:0.18},
  ],
  shouchun:[
    {name:'寿春县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'安丰',type:'common',clanFamily:null,popShare:0.25},
    {name:'下蔡',type:'common',clanFamily:null,popShare:0.22},
    {name:'义成',type:'common',clanFamily:null,popShare:0.18},
  ],
  huiji:[
    {name:'山阴',type:'seat',clanFamily:null,popShare:0.35},
    {name:'余姚',type:'common',clanFamily:null,popShare:0.25},
    {name:'上虞',type:'common',clanFamily:null,popShare:0.22},
    {name:'剡县',type:'common',clanFamily:null,popShare:0.18},
  ],
  chaigang:[
    {name:'柴桑县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'彭泽',type:'common',clanFamily:null,popShare:0.25},
    {name:'寻阳',type:'common',clanFamily:null,popShare:0.22},
    {name:'鄱阳',type:'common',clanFamily:null,popShare:0.18},
  ],
  changsha:[
    {name:'临湘',type:'seat',clanFamily:null,popShare:0.35},
    {name:'醴陵',type:'common',clanFamily:null,popShare:0.25},
    {name:'益阳',type:'common',clanFamily:null,popShare:0.22},
    {name:'湘南',type:'common',clanFamily:null,popShare:0.18},
  ],
  yuzhang:[
    {name:'南昌',type:'seat',clanFamily:null,popShare:0.35},
    {name:'海昏',type:'common',clanFamily:null,popShare:0.25},
    {name:'庐陵',type:'common',clanFamily:null,popShare:0.22},
    {name:'建昌',type:'common',clanFamily:null,popShare:0.18},
  ],
  lujiang:[
    {name:'庐江县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'皖县',type:'clan_base',clanFamily:CLAN_FAMILIES.lj_zhou,popShare:0.25},
    {name:'龙舒',type:'common',clanFamily:null,popShare:0.22},
    {name:'襄安',type:'common',clanFamily:null,popShare:0.18},
  ],
  // ── 小城(3县) ──
  guandu:[
    {name:'官渡',type:'seat',clanFamily:null,popShare:0.45},
    {name:'中牟',type:'common',clanFamily:null,popShare:0.30},
    {name:'阳武',type:'common',clanFamily:null,popShare:0.25},
  ],
  bingzhou:[
    {name:'晋阳',type:'seat',clanFamily:null,popShare:0.45},
    {name:'祁县',type:'clan_base',clanFamily:CLAN_FAMILIES.tyjg_wang,popShare:0.30},
    {name:'阳曲',type:'common',clanFamily:null,popShare:0.25},
  ],
  liangzhou:[
    {name:'姑臧',type:'seat',clanFamily:null,popShare:0.45},
    {name:'番和',type:'common',clanFamily:null,popShare:0.30},
    {name:'张掖',type:'common',clanFamily:null,popShare:0.25},
  ],
  wuwei:[
    {name:'武威县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'揟次',type:'common',clanFamily:null,popShare:0.30},
    {name:'鸾鸟',type:'common',clanFamily:null,popShare:0.25},
  ],
  tianshui:[
    {name:'冀县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'上邽',type:'common',clanFamily:null,popShare:0.30},
    {name:'清水',type:'common',clanFamily:null,popShare:0.25},
  ],
  yizhou_n:[
    {name:'梓潼县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'涪城',type:'common',clanFamily:null,popShare:0.30},
    {name:'白水',type:'common',clanFamily:null,popShare:0.25},
  ],
  bazhong:[
    {name:'巴中县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'阆中',type:'clan_base',clanFamily:CLAN_FAMILIES.bx_huang,popShare:0.30},
    {name:'宕渠',type:'common',clanFamily:null,popShare:0.25},
  ],
  yiling:[
    {name:'夷陵县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'秭归',type:'common',clanFamily:null,popShare:0.30},
    {name:'佷山',type:'common',clanFamily:null,popShare:0.25},
  ],
  jingkou:[
    {name:'京口县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'曲阿',type:'common',clanFamily:null,popShare:0.30},
    {name:'延陵',type:'common',clanFamily:null,popShare:0.25},
  ],
  jiaozhou:[
    {name:'龙编',type:'seat',clanFamily:null,popShare:0.45},
    {name:'交趾',type:'common',clanFamily:null,popShare:0.30},
    {name:'苍梧',type:'common',clanFamily:null,popShare:0.25},
  ],
  panyu:[
    {name:'番禺县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'博罗',type:'common',clanFamily:null,popShare:0.30},
    {name:'增城',type:'common',clanFamily:null,popShare:0.25},
  ],
  beihai:[
    {name:'营陵',type:'seat',clanFamily:null,popShare:0.45},
    {name:'剧县',type:'common',clanFamily:null,popShare:0.30},
    {name:'都昌',type:'common',clanFamily:null,popShare:0.25},
  ],
  beiping:[
    {name:'土垠',type:'seat',clanFamily:null,popShare:0.45},
    {name:'无终',type:'common',clanFamily:null,popShare:0.30},
    {name:'令支',type:'common',clanFamily:null,popShare:0.25},
  ],
  xinye:[
    {name:'新野县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'朝阳',type:'common',clanFamily:null,popShare:0.30},
    {name:'湖阳',type:'common',clanFamily:null,popShare:0.25},
  ],
  shangyong:[
    {name:'上庸县',type:'seat',clanFamily:null,popShare:0.40},
    {name:'房陵',type:'clan_base',clanFamily:CLAN_FAMILIES.sy_shen,popShare:0.35},
    {name:'西城',type:'common',clanFamily:null,popShare:0.25},
  ],
  luocheng:[
    {name:'雒县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'什邡',type:'common',clanFamily:null,popShare:0.30},
    {name:'绵竹',type:'common',clanFamily:null,popShare:0.25},
  ],
  yongan:[
    {name:'永安县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'朐忍',type:'common',clanFamily:null,popShare:0.30},
    {name:'鱼复',type:'common',clanFamily:null,popShare:0.25},
  ],
  lingling:[
    {name:'零陵县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'泉陵',type:'common',clanFamily:null,popShare:0.30},
    {name:'营道',type:'common',clanFamily:null,popShare:0.25},
  ],
  jianning:[
    {name:'建宁县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'味县',type:'common',clanFamily:null,popShare:0.30},
    {name:'牂牁',type:'common',clanFamily:null,popShare:0.25},
  ],
  // ═══════════════════════════════════════════════════════
  // ★ 1f / 1f-p2 / 1f-p3 — 10 新城 COUNTY_DATA (1f-p4 加)
  // ═══════════════════════════════════════════════════════
  // ── 1f: 河北 3 新城 ──
  bohai:[
    {name:'南皮县',type:'seat',clanFamily:null,popShare:0.40},
    {name:'高城',type:'common',clanFamily:null,popShare:0.25},
    {name:'章武',type:'common',clanFamily:null,popShare:0.20},
    {name:'重合',type:'common',clanFamily:null,popShare:0.15},
  ],
  pingyuan:[
    {name:'平原县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'般县',type:'common',clanFamily:null,popShare:0.30},
    {name:'高唐',type:'common',clanFamily:null,popShare:0.25},
  ],
  zhuojun:[
    {name:'涿县',type:'seat',clanFamily:null,popShare:0.45},
    {name:'故安',type:'common',clanFamily:null,popShare:0.30},
    {name:'良乡',type:'common',clanFamily:null,popShare:0.25},
  ],
  // ── 1f-p2: 徐州 2 + 荆南 1 + 关陇 2 ──
  xiaopei:[
    {name:'沛县',type:'seat',clanFamily:null,popShare:0.40},
    // 1f-p4: '谯县' moved from chenliu (沛国曹氏/沛国夏侯氏/谯国许氏 history-correct)
    {name:'谯县',type:'clan_base',clanFamily:[CLAN_FAMILIES.pg_cao, CLAN_FAMILIES.pg_xhs, CLAN_FAMILIES.qg_xu],magnate:true,popShare:0.35},
    {name:'相县',type:'common',clanFamily:null,popShare:0.25},
  ],
  donghai:[
    {name:'郯县',type:'seat',clanFamily:null,popShare:0.40},
    // 1f-p4: '朐县' moved from xuzhou (东海糜氏 history-correct)
    {name:'朐县',type:'clan_base',clanFamily:CLAN_FAMILIES.dh_mi,magnate:true,popShare:0.35},
    {name:'戚县',type:'common',clanFamily:null,popShare:0.25},
  ],
  wuling:[
    {name:'临沅',type:'seat',clanFamily:null,popShare:0.45},
    {name:'汉寿',type:'common',clanFamily:null,popShare:0.30},
    {name:'索县',type:'common',clanFamily:null,popShare:0.25},
  ],
  shangdang:[
    {name:'长子',type:'seat',clanFamily:null,popShare:0.45},
    {name:'壶关',type:'common',clanFamily:null,popShare:0.30},
    {name:'屯留',type:'common',clanFamily:null,popShare:0.25},
  ],
  anding:[
    {name:'临泾',type:'seat',clanFamily:null,popShare:0.45},
    {name:'高平',type:'common',clanFamily:null,popShare:0.30},
    {name:'乌氏',type:'common',clanFamily:null,popShare:0.25},
  ],
  // ── 1f-p3: 江东 1 + 徐州东北 1 ──
  suzhou:[
    // 1f-p4-p2 (codex catch): 跟 chenliu (陈留县 seat + 谯县 clan_base) 模式一致 — type 单值 限制下,
    // 吴县 用 type='clan_base' 让 顾/陆/朱 clan logic trigger; 娄县 (西汉始置, 史实苏州属县) 做 seat.
    {name:'娄县',type:'seat',clanFamily:null,popShare:0.35},
    {name:'吴县',type:'clan_base',clanFamily:[CLAN_FAMILIES.wj_gu, CLAN_FAMILIES.wj_lu, CLAN_FAMILIES.wj_zhu],magnate:true,popShare:0.35},
    {name:'富春',type:'common',clanFamily:null,popShare:0.18},
    {name:'乌程',type:'common',clanFamily:null,popShare:0.12},
  ],
  langya:[
    {name:'开阳',type:'seat',clanFamily:null,popShare:0.40},
    {name:'阳都',type:'common',clanFamily:null,popShare:0.30}, // 史实诸葛亮籍贯
    {name:'即丘',type:'common',clanFamily:null,popShare:0.30},
  ],
};

/** ★ v170: 属县敏感度 — 已废弃，由 COUNTY_TYPE_SENS_V170 (type惰性) 和 COUNTY_CLAN_SENS (本族放大) 取代 */
// const COUNTY_SENSITIVITY = { seat: 0.5, clan_base: 1.3, common: 0.8 };  // v168 legacy, v170移除

// ═══════════════════════════════════════════════════════
// ★ v170 豪族系统 — 派生表 & 辅助函数
// ═══════════════════════════════════════════════════════

/** ★ v170: 县名 → 所在city id 的反查表（从COUNTY_DATA派生，启动时一次性生成） */
const COUNTY_NAME_TO_CITY = {};
/** ★ v170: 县名 → county对象 的反查表（同源，便于查type/clanFamily） */
const COUNTY_INDEX = {};
Object.entries(COUNTY_DATA).forEach(([cid, counties]) => {
  counties.forEach(c => {
    // 若出现重名县（理论不应发生），保留最先注册的
    if(!(c.name in COUNTY_NAME_TO_CITY)){
      COUNTY_NAME_TO_CITY[c.name] = cid;
      COUNTY_INDEX[c.name] = c;
    } else {
      console.warn(`[v170] 县名重复: ${c.name}（已挂在${COUNTY_NAME_TO_CITY[c.name]}，忽略${cid}的重复）`);
    }
  });
});

// 豪族链 G1 (county helpers _countyClanList + isMagnateCounty,L4025-L4035) 已抽离到 src/chains/gentry.js

// 武将链 GEN4 (籍贯 getGenHomeCounty/getGenHomeCity/isGenHomeInFac + _V170_TIER_TABLE + getGenLocalBonus,L2625-L2665) 已抽离到 src/chains/general.js

/** ★ v170: 第2组单县加成上限（不含shock/第1组） ★ v171: 1.0→1.5 让tier2/tier3在本族匹配下也有边际价值 */
const LOCAL_BONUS_CAP_V170 = 1.5;
/** ★ v170: 本族匹配时的敏感放大系数 */
const COUNTY_CLAN_SENS = 2.0;
/** ★ v170: 第1组普适项的type敏感度 — 治所惰性(×0.5)，其他(×1.0) */
const COUNTY_TYPE_SENS_V170 = { seat: 0.5, common: 1.0, clan_base: 1.0 };

// ★ v161: 为士族武将批量注入clan字段（匹配属县clanFamily）
// 使用CLAN_FAMILIES常量，杜绝拼写不一致
// ★ v170: 修正3处史实错挂（张昭/王基/杨洪已删clan；黄权sq_huang→bx_huang）；新增14人（曹/夏侯/许褚/糜）
{
  const _CLAN_MAP = {
    '荀彧':CLAN_FAMILIES.yc_xun, '荀攸':CLAN_FAMILIES.yc_xun,
    '钟繇':CLAN_FAMILIES.yc_zhong, '钟会':CLAN_FAMILIES.yc_zhong,
    '陈群':CLAN_FAMILIES.yc_chen, '陈泰':CLAN_FAMILIES.yc_chen,
    '司马懿':CLAN_FAMILIES.hn_sima, '司马昭':CLAN_FAMILIES.hn_sima,
    '顾雍':CLAN_FAMILIES.wj_gu,
    '陆逊':CLAN_FAMILIES.wj_lu, '陆抗':CLAN_FAMILIES.wj_lu,
    '朱然':CLAN_FAMILIES.wj_zhu, '朱桓':CLAN_FAMILIES.wj_zhu,
    // '张昭': 删除（史书彭城人，非吴郡张氏）
    '周瑜':CLAN_FAMILIES.lj_zhou,
    '马超':CLAN_FAMILIES.ff_ma, '马岱':CLAN_FAMILIES.ff_ma,
    '华歆':CLAN_FAMILIES.px_huang,
    '黄权':CLAN_FAMILIES.bx_huang, // ★ v170修正：巴西阆中人
    '张翼':CLAN_FAMILIES.sq_zhang, '张松':CLAN_FAMILIES.sq_zhang,
    '申耽':CLAN_FAMILIES.sy_shen,
    '霍峻':CLAN_FAMILIES.nj_huo,
    // '杨洪': 删除（史书犍为武阳人）
    // '王基': 删除（史书东莱曲城人）
    // ★ v170 新增14人：曹氏9 / 夏侯氏3 / 许褚 / 糜氏2
    '曹操':CLAN_FAMILIES.pg_cao, '曹仁':CLAN_FAMILIES.pg_cao,
    '曹洪':CLAN_FAMILIES.pg_cao, '曹纯':CLAN_FAMILIES.pg_cao,
    '曹真':CLAN_FAMILIES.pg_cao, '曹休':CLAN_FAMILIES.pg_cao,
    '曹彰':CLAN_FAMILIES.pg_cao, '曹植':CLAN_FAMILIES.pg_cao, '曹丕':CLAN_FAMILIES.pg_cao,
    '夏侯惇':CLAN_FAMILIES.pg_xhs, '夏侯渊':CLAN_FAMILIES.pg_xhs, '夏侯霸':CLAN_FAMILIES.pg_xhs,
    '许褚':CLAN_FAMILIES.qg_xu,
    '糜竺':CLAN_FAMILIES.dh_mi, '糜芳':CLAN_FAMILIES.dh_mi,
  };
  Object.entries(_CLAN_MAP).forEach(([name, clan]) => {
    if(GEN_TAGS[name]) GEN_TAGS[name].clan = clan;
  });
}
