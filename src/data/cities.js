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

// Optional per-edge waypoint hints for roads whose strategic adjacency should remain direct,
// but whose map/terrain path should follow bitmap geography instead of a city-to-city straight line.
// Keys are sorted city ids joined by "-"; values are intermediate hex centers.
const ROAD_WAYPOINTS = {
  'jianye-wuchang': [[59, 37], [66, 35]], // Wuchang -> Chaigang/Poyang corridor -> Lujiang -> Jianye
};

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
  'M105,365 Q150,354 205,354 Q255,348 298,327 Q342,297 392,232 Q445,232 492,226 Q532,210 566,198 Q600,170 642,145 Q686,118 724,118 Q745,133 728,162 Q700,202 680,242 Q668,274 688,294 Q728,302 772,286 Q812,268 846,252',
  // 渭水（天水→关中平原→洛阳附近汇入黄河）
  // 天水(212,259)北侧 → 洛阳(374,217)南侧汇入黄河
  'M188,266 Q226,254 266,247 Q298,238 329,225 Q350,215 374,210',
  // 汉水（汉中→襄阳→武昌附近汇入长江）
  // 汉中(266,331) → 南阳(392,331)南 → 襄阳(410,352) → 武昌(473,430)
  'M228,340 Q276,338 324,342 Q371,348 413,358 Q443,375 467,400 Q479,418 493,432',
  // 长江（夷陵→洞庭湖→武昌→鄱阳湖→建业→京口→入东海）
  // 夷陵(356,404) → 洞庭湖(458,425) → 武昌(473,430) → 柴桑(527,451)/鄱阳湖(575,440) → 建业(608,394) → 京口(644,352) → 入海(720,330)
  'M312,410 Q335,408 357,405 Q395,415 443,422 Q476,428 497,432 Q532,442 562,448 Q598,445 626,432 Q652,410 670,392 Q693,370 720,350 Q748,336 782,326 Q810,318 835,312',
  // Gan River / Poyang basin.
  'M610,620 Q606,580 604,540 Q602,504 590,472 Q582,452 562,448',
  // Qiantang / lower Jiangnan waterway.
  'M742,520 Q766,494 790,466 Q812,438 842,414 Q870,394 898,382',
  // 湘水（零陵→长沙→洞庭/长江水系）
  'M464,581 Q488,558 518,513 Q512,500 493,432',
  // 淮河（寿春一带向东入海）
  // 寿春(545,305)附近 → 向东入东海(~700,290)
  'M514,298 Q550,302 584,305 Q622,300 670,292 Q718,286 762,292 Q802,286 835,278',
  // 岷江/嘉陵江（成都→巴中方向→汇入长江）
  // 成都(212,425) → 巴中(275,399) → 夷陵(356,404)方向
  'M186,418 Q216,410 250,405 Q282,402 312,408',
  // Pearl / Xi River trunk across Lingnan.
  'M230,592 Q278,580 330,590 Q382,604 435,620 Q486,636 540,632 Q598,618 655,596 Q700,578 748,566',
  // Southwest visible waterway at southern Yunnan.
  'M170,610 Q198,634 228,658 Q258,680 296,694',
];

// Final river hexes that land on dark bitmap mountain texture. These are kept as
// base terrain instead of being overwritten by RIVERS so the rule layer matches
// the visible ink map. `tools/audit_bitmap_alignment.js` validates this list and
// reports stale entries if a skipped hex no longer samples as bitmap mountain.
const RIVER_BITMAP_MOUNTAIN_SKIP = new Set([
  '44,58','45,58','46,39','46,59','47,39','47,58','48,40','48,59','49,36','50,40',
  '50,59','51,38','51,40','51,54','51,59','52,60','53,59','54,60','55,50','56,28',
  '56,41','57,41','58,42','58,60','59,41','59,59','60,42','62,42','62,43','63,41',
  '63,42','64,42','65,41','65,48','65,51','66,28','66,41','66,58','67,27','67,28',
  '67,40','67,41','68,28','68,57','69,27','69,39','69,57','71,27','71,38','72,38',
  '73,25','74,24','74,25','75,55','76,20','77,27','78,33','80,27',
  '80,32','81,31','83,27','83,46','86,26','86,30','90,24','91,24',
]);
