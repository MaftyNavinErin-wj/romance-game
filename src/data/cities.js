// src/data/cities.js
//
// 城市初始数据 + 地理关系 — 55 城市 (1a: 45; 1f: +3 河北 → 48; 1f-p2: +5 徐州/荆南/关陇 → 53; 1f-p3: +2 江东 suzhou + 徐州东北 langya + bingzhou 上移 r=11→8 → 55) + 道路网 + 河流路径 + 地域分组
//
// 来源:从 project_romance_v181.html 整体抽离(Session 1.3 / 阶段 1)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//   - CITIES_DEF(原 L2090-L2152):§8.4 W6-pending-4 已改 1b-1 mutable container 模式
//                                   (legacy 76 行数据退役 → CITY_BASE + sc.cities materialize);
//                                   容器仍存在, ~20 consumer 零改动
//   - CITY_MAP(原 L2160):同 W6-pending-4 mutable container 模式; ~87 consumer 零改动
//   - JIANGDONG_CITIES / QINGXU_CITIES / JINGZHOU_CITIES(原 L2163-L2166):地域 Set,技能用
//   - isJiangdong / isQingxu / isJingzhou(原 L2167-L2169):地域查询 helper
//   - ROADS(原 L2172-L2215):城市路网双向边数组
//   - ROAD_ADJ(原 L2218-L2224):派生邻接表,从 ROADS 双向构建
//   - RIVERS(原 L2306-L2324):河流 SVG path 字符串(渲染用)
//
// 留 v181 的:
//   - L2155-L2158 CITIES_DEF.forEach(c => { c.x = hexToPixel(c.q,c.r).x; ... })
//     原因:依赖 hexToPixel 函数,该函数在 v181 主 script 中,加载顺序上 cities.js
//     先于 v181 inline 执行,本文件加载时 hexToPixel 尚未声明。把 forEach 留 v181
//     可以在 hexToPixel 已定义后再执行,行为不变。
//   - JUNS(郡系统,独立概念)、TERRAIN_POLYS / HEX_TERRAIN / HEX_ROAD / HEX_CITY
//     (hex 渲染系统,phase 2/render 范围)
//   - ensureCityNeighbors / aiFrontierEnemyCities(运行时 mechanism,phase 3)
//
// loading 顺序:本文件在 v181.html 主 inline script 之前加载;cities.js 内部代码
// 仅声明数据 + 派生 const(Object.fromEntries / forEach)和函数,不调用任何外部
// 函数,顶层执行安全。

// ─── 城市数据 ───
// §8.4 W6-pending-4 (2026-05-16): CITIES_DEF + CITY_MAP 改 1b-1 mutable container 模式
//   (跟 phase 1b FAC/ALL_FACS 同模式)。legacy 76 行 CITIES_DEF data 已退役:
//   - 城市几何 (q/r/name/tags/jun/size/base) 真值源 = src/data/city_base.js CITY_BASE
//   - 城市起手状态 (fac/pop/troops/isCapital) 真值源 = SCENARIO_214/190.cities (scenarios/*.js)
//   - materializeScenario W2 (scenario_loader.js) merge CITY_BASE + sc.cities → m.CITIES_DEF
//   - applyScenario 末尾 sync m.CITIES_DEF entries → 此 CITIES_DEF/CITY_MAP 容器
//   - map.js:599 x/y 像素坐标 augment 跟旧行为同 (同 entry 对象引用)
//   - ~110 consumer site (20 CITIES_DEF + 87 CITY_MAP grep hit) 零改动, byte-identical 守底
let CITIES_DEF = [];  // empty container, sync by scenario_loader.js applyScenario
let CITY_MAP = {};    // empty container, sync by scenario_loader.js applyScenario

// ★ v126: 地域城市集合（技能用）
const JIANGDONG_CITIES = new Set(['jianye','jingkou','huiji','wuchang','chaigang','jiaozhou','panyu','changsha','yuzhang','lingling','hefei','shouchun','lujiang','suzhou']);  // 1f-p3: +suzhou (吴郡, 江东东部)
const QINGXU_CITIES = new Set(['xuzhou','qingzhou','beihai','guangling','xiapi','puyang','xiaopei','donghai','langya']);  // 1f-p2: +xiaopei/donghai (徐州西门 + 徐州东沿海); 1f-p3: +langya (徐州东北 琅琊郡)
// v128: 荆州城市集合（文聘·镇荆用）
const JINGZHOU_CITIES = new Set(['xiangyang','jingzhou','yiling','shangyong','changsha','lingling','wuling']);  // 1f-p2: +wuling (荆南山区, 文聘 isJingzhou boost 覆盖)
function isJiangdong(cityId){ return JIANGDONG_CITIES.has(cityId); }
function isQingxu(cityId){ return QINGXU_CITIES.has(cityId); }
function isJingzhou(cityId){ return JINGZHOU_CITIES.has(cityId); }

// ─── 道路网络（保留连接关系，用于AI寻路参考）───
const ROADS = [
  ['luoyang','xuchang'],['luoyang','ye'],['luoyang','hedong'],
  ['luoyang','nanyang'],['luoyang','guandu'],
  ['xuchang','guandu'],['xuchang','xuzhou'],['xuchang','nanyang'],
  ['ye','qingzhou'],['ye','bingzhou'],['ye','guandu'],
  ['qingzhou','xuzhou'],['qingzhou','youzhou'],
  ['bingzhou','youzhou'],['bingzhou','hedong'],
  ['hedong','liangzhou'],['hedong','tianshui'],
  ['wuwei','liangzhou'],['wuwei','tianshui'],
  ['tianshui','hanzhong'],['tianshui','changan'],
  ['changan','luoyang'],['changan','hedong'],['changan','hanzhong'],
  ['nanyang','xiangyang'],['nanyang','hanzhong'],
  ['hanzhong','yizhou_n'],['hanzhong','bazhong'],
  ['yizhou_n','chengdu'],['bazhong','chengdu'],
  ['bazhong','yiling'],
  ['xiangyang','jingzhou'],['xiangyang','hefei'],
  ['jingzhou','yiling'],['jingzhou','wuchang'],
  ['wuchang','chaigang'],['wuchang','jianye'],
  ['chaigang','hefei'],
  ['jianye','jingkou'],['jianye','shouchun'],
  ['jingkou','shouchun'],
  ['shouchun','hefei'],['shouchun','xuzhou'],
  ['hefei','xuzhou'],
  ['jiaozhou','panyu'],
  // ── 新增城市路网 ──
  ['chengdu','jianning'],['jianning','jiaozhou'],            // 建宁连成都+交州
  ['yiling','yongan'],['yongan','jianning'],                // 永安连夷陵+建宁
  ['wuchang','changsha'],['chaigang','changsha'],            // 长沙连武昌+柴桑
  ['changsha','jiaozhou'],                                  // 长沙连交州
  ['chaigang','yuzhang'],['yuzhang','changsha'],            // 豫章连柴桑+长沙
  ['qingzhou','beihai'],['beihai','guangling'],              // 北海连青州+广陵
  ['xuzhou','guangling'],['jingkou','guangling'],            // 广陵连徐州+京口
  ['youzhou','beiping'],['beiping','beihai'],                // 北平连蓟城+北海
  // ── v77 新增城市路网 ──
  ['chenliu','luoyang'],['chenliu','guandu'],['chenliu','xuchang'],  // 陈留连洛阳+官渡+许昌
  ['xinye','nanyang'],['xinye','xiangyang'],                          // 新野连南阳+襄阳
  ['puyang','ye'],['puyang','qingzhou'],['puyang','chenliu'],        // 濮阳连邺城+青州+陈留
  ['xiapi','xuzhou'],['xiapi','guangling'],['xiapi','shouchun'],     // 下邳连徐州+广陵+寿春
  ['shangyong','hanzhong'],['shangyong','xiangyang'],['shangyong','nanyang'], // 上庸连汉中+襄阳+南阳
  ['luocheng','yizhou_n'],['luocheng','chengdu'],['luocheng','yongan'], // 雒城连梓潼+成都+永安（益州内部山道）
  ['lujiang','hefei'],['lujiang','jianye'],['lujiang','chaigang'],   // 庐江连合肥+建业+柴桑
  ['lingling','changsha'],['lingling','jiaozhou'],['lingling','panyu'], // 零陵连长沙+交州+番禺
  // ── 1f 扩 — 河北 3 新城路网 ──
  ['bohai','ye'],['bohai','qingzhou'],['bohai','beiping'],          // 南皮连邺城+青州+北平 (河北沿海)
  ['pingyuan','ye'],['pingyuan','qingzhou'],['pingyuan','bohai'],   // 平原连邺城+青州+南皮 (河北中部)
  ['zhuojun','youzhou'],['zhuojun','ye'],['zhuojun','beiping'],     // 涿郡连蓟城+邺城+北平 (河北北部)
  // ── 1f-p2 扩 — 徐州 / 荆南 / 关陇 5 新城路网 ──
  ['xiaopei','xuchang'],['xiaopei','xuzhou'],['xiaopei','chenliu'], // 小沛连许昌+徐州+陈留 (徐州西门)
  ['donghai','xiapi'],['donghai','guangling'],                     // 东海连下邳+广陵 (徐州东沿海)
  ['wuling','jingzhou'],['wuling','lingling'],['wuling','yiling'], // 武陵连江陵+零陵+夷陵 (荆南山区)
  ['shangdang','bingzhou'],['shangdang','hedong'],['shangdang','ye'], // 上党连晋阳+河东+邺城 (山西-河北枢纽)
  ['anding','changan'],['anding','tianshui'],['anding','hedong'],  // 安定连长安+天水+河东 (关中-凉州枢纽)
  // ── 1f-p3 扩 — 江东 + 徐州东北 路网 ──
  ['suzhou','huiji'],['suzhou','jingkou'],                         // 吴郡连会稽+京口 (江东东部；去掉直穿太湖的建业直连)
  ['langya','beihai'],['langya','donghai'],['langya','qingzhou'],  // 琅琊连北海+东海+青州 (徐州东北)
];

// G2: 城市邻接图（双向，从ROADS构建）
const ROAD_ADJ = {};
ROADS.forEach(([a, b]) => {
  if (!ROAD_ADJ[a]) ROAD_ADJ[a] = [];
  if (!ROAD_ADJ[b]) ROAD_ADJ[b] = [];
  if (!ROAD_ADJ[a].includes(b)) ROAD_ADJ[a].push(b);
  if (!ROAD_ADJ[b].includes(a)) ROAD_ADJ[b].push(a);
});

// ─── 河流路径（SVG path，视觉用，坐标更新为hex坐标系）───
const RIVERS = [
  // 黄河（从西北来，经河东大拐弯，向东经邺城北，入渤海）
  'M49,155 Q121,145 192,140 Q264,135 324,142 Q383,148 443,152 Q503,158 562,162 Q622,165 690,150 Q730,135 760,120',
  // 渭水（天水→关中平原→洛阳附近汇入黄河）
  // 天水(212,259)北侧 → 洛阳(374,217)南侧汇入黄河
  'M139,230 Q180,240 228,245 Q276,238 324,225 Q353,215 377,200',
  // 汉水（汉中→襄阳→武昌附近汇入长江）
  // 汉中(266,331) → 南阳(392,331)南 → 襄阳(410,352) → 武昌(473,430)
  'M228,340 Q276,338 324,342 Q371,348 413,358 Q443,375 467,400 Q479,418 493,432',
  // 长江（夷陵→洞庭湖→武昌→鄱阳湖→建业→京口→入东海）
  // 夷陵(356,404) → 洞庭湖(458,425) → 武昌(473,430) → 柴桑(527,451)/鄱阳湖(575,440) → 建业(608,394) → 京口(644,352) → 入海(720,330)
  'M312,410 Q335,408 357,405 Q395,415 443,422 Q476,428 497,432 Q532,442 562,448 Q598,445 626,432 Q652,410 670,392 Q693,370 720,350 Q748,336 782,326 Q810,318 835,312',
  // 湘水（零陵→长沙→洞庭/长江水系）
  'M464,581 Q488,558 518,513 Q512,500 493,432',
  // 淮河（寿春一带向东入海）
  // 寿春(545,305)附近 → 向东入东海(~700,290)
  'M514,298 Q550,302 584,305 Q622,300 670,292 Q718,286 762,292 Q802,286 835,278',
  // 岷江/嘉陵江（成都→巴中方向→汇入长江）
  // 成都(212,425) → 巴中(275,399) → 夷陵(356,404)方向
  'M186,418 Q216,410 250,405 Q282,402 312,408',
];
