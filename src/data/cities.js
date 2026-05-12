// src/data/cities.js
//
// 城市初始数据 + 地理关系 — 55 城市 (1a: 45; 1f: +3 河北 → 48; 1f-p2: +5 徐州/荆南/关陇 → 53; 1f-p3: +2 江东 suzhou + 徐州东北 langya + bingzhou 上移 r=11→8 → 55) + 道路网 + 河流路径 + 地域分组
//
// 来源:从 project_romance_v181.html 整体抽离(Session 1.3 / 阶段 1)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//   - CITIES_DEF(原 L2090-L2152):45 城市初始定义(hex 坐标 q/r、属性、初始 fac/troops/pop/base 资源);1f +3 → 48;1f-p2 +5 → 53;1f-p3 +2 → 55 (含 bingzhou r 修订)
//   - CITY_MAP(原 L2160):派生 O(1) 查表
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

// ─── 城市 hex 坐标映射 ───
// 从旧像素坐标转换到hex坐标并手动校准
const CITIES_DEF = [
  // ── 魏 司豫 ──
  {id:'xuchang',  name:'许昌', q:52,r:26, tags:['都市','平原','产铁'],jun:'siyujun',    fac:'wei',pop:425000, troops:4000,isCapital:true, size:'large',  base:{food:480,gold:131,wood:60,iron:110,horses:5}},
  {id:'nanyang',  name:'南阳', q:43,r:31, tags:['平原'],             jun:'siyujun',    fac:'wei',pop:300000, troops:2200,               size:'medium', base:{food:520,gold:92, wood:65,iron:55,horses:5}},
  {id:'xuzhou',   name:'徐州', q:66,r:26, tags:['都市','平原'],      jun:'siyujun',    fac:'wei',pop:310000, troops:3000,               size:'large',  base:{food:560,gold:105, wood:55,iron:60,horses:4}},
  // ── 魏 河洛 ──
  {id:'luoyang',  name:'洛阳', q:40,r:20, tags:['都市','平原','产铁'],jun:'heluojun',   fac:'wei',pop:325000, troops:3000,               size:'large',  base:{food:520,gold:118, wood:50,iron:100,horses:2}},
  {id:'guandu',   name:'官渡', q:52,r:22, tags:['雄关'],             jun:'heluojun',   fac:'wei',pop:125000, troops:1500,               size:'small',  base:{food:200,gold:52, wood:30,iron:35,horses:2}},
  {id:'hedong',   name:'河东', q:34,r:18, tags:['产马','平原'],      jun:'heluojun',   fac:'wei',pop:200000, troops:1200,               size:'medium', base:{food:360,gold:79, wood:40,iron:45,horses:140}},
  // ── 魏 冀青 ──
  {id:'ye',       name:'邺城', q:52,r:15, tags:['都市','平原','产铁'],jun:'jiqingjun',  fac:'wei',pop:400000, troops:2500,               size:'large',  base:{food:440,gold:123, wood:55,iron:95,horses:4}},
  {id:'qingzhou', name:'青州', q:66,r:16, tags:['平原'],              jun:'jiqingjun',  fac:'wei',pop:275000, troops:1500,               size:'medium', base:{food:520,gold:92, wood:45,iron:50,horses:3}},
  {id:'youzhou',  name:'蓟城', q:56,r:6, tags:['产马','都市'],       jun:'jiqingjun',  fac:'wei',pop:150000, troops:1000,               size:'medium', base:{food:320,gold:71, wood:45,iron:40,horses:180}},
  // ── 魏 西北 ──
  {id:'bingzhou', name:'晋阳', q:37,r:8,  tags:['产马'],              jun:'xibejun',    fac:'wei',pop:140000, troops:1000,               size:'small',  base:{food:300,gold:58, wood:40,iron:50,horses:160}},
  {id:'liangzhou',name:'姑臧', q:8,r:18, tags:['产马','山地'],       jun:'xibejun',    fac:'wei',pop:110000, troops:800,                size:'small',  base:{food:240,gold:52, wood:30,iron:45,horses:200}},
  {id:'wuwei',    name:'武威', q:12,r:15, tags:['产马'],               jun:'xibejun',    fac:'wei',pop:90000, troops:500,                size:'small',  base:{food:220,gold:45, wood:25,iron:35,horses:170}},
  {id:'tianshui', name:'天水', q:19,r:24, tags:['雄关','山地','产铁'],jun:'xibejun',    fac:'wei',pop:100000, troops:1000,               size:'small',  base:{food:230,gold:54, wood:35,iron:80,horses:5}},
  {id:'changan',  name:'长安', q:31,r:22, tags:['都市','平原'],       jun:'xibejun',    fac:'wei',pop:275000, troops:2500,               size:'large',  base:{food:480,gold:112, wood:45,iron:65,horses:25}},
  // ── 蜀 汉中 ──
  {id:'hanzhong', name:'汉中', q:26,r:31, tags:['雄关','山地'],      jun:'hanzhongjun',fac:'shu',pop:175000, troops:2000,               size:'medium', base:{food:280,gold:65, wood:80,iron:60,horses:5}},
  // ── 蜀 益州 ──
  {id:'chengdu',  name:'成都', q:19,r:40, tags:['都市','平原','产马'],jun:'yizhoujun',  fac:'shu',pop:390000, troops:3500,isCapital:true, size:'large',  base:{food:600,gold:123, wood:90,iron:70,horses:160}},
  {id:'yizhou_n', name:'梓潼', q:24,r:35, tags:['山地'],              jun:'yizhoujun',  fac:'shu',pop:90000, troops:500,                size:'small',  base:{food:240,gold:52, wood:70,iron:60,horses:2}},
  {id:'bazhong',  name:'巴中', q:27,r:37, tags:['山地','产木'],       jun:'yizhoujun',  fac:'shu',pop:140000, troops:800,                size:'small',  base:{food:260,gold:58, wood:140,iron:55,horses:3}},
  // ── 蜀 荆州 ──
  {id:'xiangyang',name:'襄阳', q:45,r:33, tags:['水乡'],              jun:'jingzhoujun',fac:'shu',pop:210000, troops:2000,               size:'medium', base:{food:320,gold:86, wood:60,iron:50,horses:5}}, // v109B: 去雄关
  {id:'jingzhou', name:'江陵', q:47,r:40, tags:['都市','平原','水乡'],jun:'jingzhoujun',fac:'shu',pop:325000, troops:2500,               size:'large',  base:{food:560,gold:110, wood:75,iron:55,horses:2}},
  {id:'yiling',   name:'夷陵', q:38,r:38, tags:['山地','水乡','产木'],jun:'jingzhoujun',fac:'shu',pop:150000, troops:1000,               size:'small',  base:{food:400,gold:79, wood:170,iron:40,horses:2}},
  // ── 吴 扬州 ──
  {id:'jianye',   name:'建业', q:71,r:37, tags:['都市','港口','水乡'],jun:'yangzhoujun',fac:'wu', pop:350000, troops:3500,isCapital:true, size:'large',  base:{food:400,gold:150,wood:80,iron:50,horses:2}},
  {id:'jingkou',  name:'京口', q:77,r:33, tags:['港口','水乡'],       jun:'yangzhoujun',fac:'wu', pop:175000, troops:1000,               size:'small',  base:{food:280,gold:105,wood:60,iron:30,horses:2}},
  {id:'huiji',    name:'会稽', q:82,r:42, tags:['港口','水乡'],       jun:'yangzhoujun',fac:'wu', pop:210000, troops:1500,               size:'medium', base:{food:340,gold:138,wood:75,iron:35,horses:1}},
  // ── 吴 江夏 ──
  {id:'wuchang',  name:'武昌', q:53,r:40, tags:['都市','港口','水乡','产铁'],jun:'jiaxiajun',  fac:'wu', pop:260000, troops:2000,               size:'large',  base:{food:360,gold:118,wood:85,iron:90,horses:2}},
  {id:'chaigang', name:'柴桑', q:61,r:42, tags:['港口','水乡'],       jun:'jiaxiajun',  fac:'wu', pop:190000, troops:1500,               size:'medium', base:{food:320,gold:123,wood:70,iron:40,horses:1}},
  {id:'jiaozhou', name:'交州', q:43,r:59, tags:['水乡','产木'],       jun:'jiaxiajun',  fac:'wu', pop:75000, troops:500,                size:'small',  base:{food:360,gold:92, wood:150,iron:30,horses:1}},
  {id:'panyu',    name:'番禺', q:52,r:62, tags:['港口','水乡'],       jun:'jiaxiajun',  fac:'wu', pop:125000, troops:800,                size:'small',  base:{food:300,gold:118, wood:100,iron:25,horses:1}},
  // ── 吴 淮南 ──
  {id:'hefei',    name:'合肥', q:64,r:29, tags:['雄关','产铁'],       jun:'huainanjun', fac:'wu', pop:190000, troops:1500,               size:'medium', base:{food:280,gold:71, wood:55,iron:80,horses:2}},
  {id:'shouchun', name:'寿春', q:63,r:28, tags:['都市','平原'],       jun:'huainanjun', fac:'wu', pop:210000, troops:1000,               size:'medium', base:{food:380,gold:79, wood:50,iron:55,horses:2}},
  // ── 蜀 南中 ──
  {id:'jianning', name:'建宁', q:16,r:52, tags:['山地','产木'],       jun:'nanzhongjun',fac:'nanman',pop:60000, troops:400,                size:'small',  base:{food:300,gold:37, wood:155,iron:25,horses:3}},
  {id:'yongan',   name:'永安', q:29,r:46, tags:['山地'],              jun:'yizhoujun',  fac:'shu',pop:110000, troops:800,                size:'small',  base:{food:280,gold:52, wood:75,iron:40,horses:2}}, // v109B: 去雄关
  // ── 魏 东部 ──
  {id:'beihai',   name:'北海', q:76,r:12, tags:['港口','平原'],       jun:'jiqingjun',  fac:'wei',pop:160000, troops:800,                size:'small',  base:{food:400,gold:84, wood:40,iron:35,horses:2}},
  {id:'beiping',  name:'北平', q:68,r:7,  tags:['产马'],              jun:'jiqingjun',  fac:'wei',pop:100000, troops:600,                size:'small',  base:{food:260,gold:47, wood:35,iron:40,horses:10}},
  {id:'guangling', name:'广陵',q:80,r:28, tags:['港口','平原'],       jun:'siyujun',    fac:'wei',pop:175000, troops:1000,               size:'medium', base:{food:420,gold:97, wood:50,iron:40,horses:2}},
  // ── 吴 荆湘 ──
  {id:'changsha', name:'长沙', q:55,r:50, tags:['平原','水乡'],       jun:'jingxiangjun',fac:'wu',pop:200000, troops:1200,               size:'medium', base:{food:450,gold:90, wood:80,iron:35,horses:1}},
  {id:'yuzhang',  name:'豫章', q:64,r:50, tags:['平原','水乡'],       jun:'jingxiangjun',fac:'wu',pop:175000, troops:1000,               size:'medium', base:{food:400,gold:84, wood:70,iron:30,horses:1}},
  {id:'lingling', name:'零陵', q:50,r:55, tags:['水乡','产木'],       jun:'jingxiangjun',fac:'wu',pop:110000, troops:600,                size:'small',  base:{food:380,gold:60, wood:140,iron:25,horses:1}},
  // ── 魏 新增 ──
  {id:'chenliu',  name:'陈留', q:50,r:20, tags:['平原'],              jun:'heluojun',   fac:'wei',pop:240000, troops:1800,               size:'medium', base:{food:480,gold:97, wood:45,iron:55,horses:3}},
  {id:'xinye',    name:'新野', q:44,r:28, tags:['平原'],              jun:'siyujun',    fac:'wei',pop:125000, troops:1000,               size:'small',  base:{food:360,gold:65, wood:50,iron:40,horses:3}},
  {id:'puyang',   name:'濮阳', q:58,r:18, tags:['平原'],              jun:'jiqingjun',  fac:'wei',pop:190000, troops:1200,               size:'medium', base:{food:440,gold:86, wood:40,iron:50,horses:3}},
  {id:'xiapi',    name:'下邳', q:70,r:30, tags:['平原'],              jun:'siyujun',    fac:'wei',pop:200000, troops:1500,               size:'medium', base:{food:460,gold:90, wood:50,iron:55,horses:2}},
  // ── 蜀 新增 ──
  {id:'shangyong',name:'上庸', q:35,r:34, tags:['山地','雄关'],       jun:'jingzhoujun',fac:'shu',pop:90000, troops:800,                size:'small',  base:{food:240,gold:49, wood:70,iron:45,horses:2}},
  {id:'luocheng', name:'雒城', q:21,r:38, tags:['平原'],              jun:'yizhoujun',  fac:'shu',pop:150000, troops:1000,               size:'small',  base:{food:400,gold:71, wood:65,iron:50,horses:3}},
  // ── 吴 新增 ──
  {id:'lujiang',  name:'庐江', q:66,r:35, tags:['平原','水乡'],       jun:'huainanjun', fac:'wu',pop:160000, troops:1000,               size:'medium', base:{food:340,gold:79, wood:55,iron:45,horses:2}},
  // ── 1f 扩 — 魏 河北 3 新城 ──
  {id:'bohai',    name:'南皮', q:64,r:11, tags:['平原','水乡'],       jun:'jiqingjun', fac:'wei',pop:180000, troops:1200,               size:'medium', base:{food:280,gold:80, wood:45,iron:30,horses:4}},
  {id:'pingyuan', name:'平原', q:60,r:14, tags:['平原'],              jun:'jiqingjun', fac:'wei',pop:130000, troops:900,                size:'small',  base:{food:280,gold:60, wood:35,iron:35,horses:3}},
  {id:'zhuojun',  name:'涿郡', q:53,r:8,  tags:['平原','产马'],       jun:'jiqingjun', fac:'wei',pop:110000, troops:800,                size:'small',  base:{food:220,gold:48, wood:30,iron:35,horses:80}},
  // ── 1f-p2 扩 — 徐州 2 新城 + 荆南 1 新城 + 关陇 2 新城 ──
  {id:'xiaopei',  name:'小沛', q:62,r:24, tags:['平原'],              jun:'siyujun',   fac:'wei',pop:120000, troops:1000,               size:'small',  base:{food:320,gold:60, wood:40,iron:35,horses:2}},
  {id:'donghai',  name:'东海', q:74,r:28, tags:['平原'],              jun:'siyujun',   fac:'wei',pop:110000, troops:900,                size:'small',  base:{food:300,gold:55, wood:35,iron:35,horses:2}},
  {id:'wuling',   name:'武陵', q:44,r:47, tags:['水乡','山地'],       jun:'jingzhoujun',fac:'shu',pop:100000, troops:700,                size:'small',  base:{food:280,gold:50, wood:80,iron:30,horses:2}},
  {id:'shangdang',name:'上党', q:36,r:14, tags:['山地','产铁'],       jun:'xibejun',   fac:'wei',pop:120000, troops:900,                size:'small',  base:{food:260,gold:55, wood:60,iron:75,horses:30}},
  {id:'anding',   name:'安定', q:23,r:20, tags:['山地','产马'],       jun:'xibejun',   fac:'wei',pop:90000,  troops:600,                size:'small',  base:{food:220,gold:45, wood:30,iron:35,horses:100}},
  // ── 1f-p3 扩 — 江东 1 + 徐州东北 1 (+ bingzhou 上移 r=11→8) ──
  {id:'suzhou',   name:'吴郡', q:78,r:39, tags:['都市','港口','水乡'], jun:'yangzhoujun',fac:'wu', pop:210000, troops:1500,               size:'medium', base:{food:380,gold:145,wood:70,iron:40,horses:1}},
  {id:'langya',   name:'琅琊', q:75,r:20, tags:['平原'],              jun:'siyujun',   fac:'wei',pop:120000, troops:800,                size:'small',  base:{food:300,gold:60, wood:40,iron:40,horses:2}},
];
// Note: CITIES_DEF.forEach 在 v181.html 主 script 中执行,会给每个 city 对象添加 x/y 像素坐标
// (依赖 hexToPixel,后定义)

// ★ O1: 城市ID→定义的O(1)查表（替代32处CITIES_DEF.find）
const CITY_MAP = Object.fromEntries(CITIES_DEF.map(c => [c.id, c]));

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
  ['bingzhou','youzhou'],['bingzhou','hedong'],['bingzhou','wuwei'],
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
  ['chaigang','jianye'],['chaigang','hefei'],
  ['jianye','jingkou'],['jianye','shouchun'],['jianye','huiji'],
  ['jingkou','huiji'],['jingkou','shouchun'],
  ['shouchun','hefei'],['shouchun','xuzhou'],
  ['hefei','xuzhou'],
  ['jingzhou','jiaozhou'],['jiaozhou','panyu'],['wuchang','panyu'],
  // ── 新增城市路网 ──
  ['chengdu','jianning'],['jianning','jiaozhou'],            // 建宁连成都+交州
  ['yiling','yongan'],['yongan','jianning'],                // 永安连夷陵+建宁
  ['wuchang','changsha'],['chaigang','changsha'],            // 长沙连武昌+柴桑
  ['changsha','jiaozhou'],['changsha','panyu'],              // 长沙连交州+番禺
  ['chaigang','yuzhang'],['yuzhang','changsha'],            // 豫章连柴桑+长沙
  ['yuzhang','panyu'],                                      // 豫章连番禺
  ['qingzhou','beihai'],['beihai','guangling'],              // 北海连青州+广陵
  ['xuzhou','guangling'],['jingkou','guangling'],            // 广陵连徐州+京口
  ['youzhou','beiping'],['beiping','beihai'],                // 北平连蓟城+北海
  // ── v77 新增城市路网 ──
  ['chenliu','luoyang'],['chenliu','guandu'],['chenliu','xuchang'],  // 陈留连洛阳+官渡+许昌
  ['xinye','nanyang'],['xinye','xiangyang'],                          // 新野连南阳+襄阳
  ['puyang','ye'],['puyang','qingzhou'],['puyang','chenliu'],        // 濮阳连邺城+青州+陈留
  ['xiapi','xuzhou'],['xiapi','guangling'],['xiapi','shouchun'],     // 下邳连徐州+广陵+寿春
  ['shangyong','hanzhong'],['shangyong','xiangyang'],['shangyong','nanyang'], // 上庸连汉中+襄阳+南阳
  ['luocheng','yizhou_n'],['luocheng','chengdu'],                    // 雒城连梓潼+成都
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
  ['suzhou','jianye'],['suzhou','huiji'],['suzhou','jingkou'],     // 吴郡连建业+会稽+京口 (江东东部)
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
  'M312,410 Q335,408 357,405 Q395,415 443,422 Q476,428 497,432 Q532,442 562,448 Q598,445 622,435 Q646,418 660,400 Q679,378 703,355 Q729,340 765,330 Q801,320 825,315',
  // 淮河（寿春一带向东入海）
  // 寿春(545,305)附近 → 向东入东海(~700,290)
  'M514,298 Q550,302 584,305 Q622,300 670,292 Q717,285 765,280 Q801,275 825,272',
  // 岷江/嘉陵江（成都→巴中方向→汇入长江）
  // 成都(212,425) → 巴中(275,399) → 夷陵(356,404)方向
  'M186,418 Q216,410 250,405 Q282,402 312,408',
];
