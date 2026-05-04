// src/data/generals.js
//
// GEN_TAGS / WILD_GENS / WILD_GEN_META / getGenMeta — 武将标签 + 在野池数据 + tag helper
//
// 来源:从 project_romance_v181.html 整体抽离(Session 1.2 / 阶段 1)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//   - WILD_GENS / WILD_GEN_META(原 L3674-L3731):在野武将池 + 元数据
//   - getGenMeta(原 L3736-L3737):统一武将元数据查找,fallback WILD_GEN_META
//   - GEN_TAGS(原 L3839-L4000):武将五维静态标签(politics/combat/origin/state/temperament/clique)
//
// 留 v181 的:GENS_FULL(势力武将基础属性)、GEN_META(势力武将元数据)、ALL_GENS(派生)、
// GEN_MAP/_deepCloneGen/_rebuildGEN_MAP(运行时 helper)、FOUNDING_CORE(B1 派系)、
// GEN_CLASS/CLASS_META(v167 四类系统)、GEN_POOL_INACTIVE(非活跃池)。
//
// loading 顺序:本文件在 v181.html 主 inline script 之前加载。getGenMeta 依赖
// 的 GEN_META 仍在 v181 inline 中,通过同 realm classic <script> 共享 script-scope
// 在调用时 lazy resolve。

// ═══════════════════════════════════════════════════════
// 在野武将池（中立人才，不属于任何势力）
// ═══════════════════════════════════════════════════════
// minTurn: 最早可进入野池的旬数（1旬=10天，1年=36旬）
// T1 = 建安十九年（214年开局），T45 = 215年，T117 = 217年，T189 = 219年

const WILD_GENS = [
  // ── 名将级（高价值，稀有）──
  {name:'张松',  com:65,war:38,int:90,pol:82,cha:55, apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'B',naval:'C'}, minTurn:1},
  {name:'庞德',  com:84,war:94,int:60,pol:48,cha:65, apt:{cavalry:'A',light:'S',heavy:'B',archer:'B',siege:'C',naval:'C'}, minTurn:1},
  // ── 中坚级──
  {name:'李严',  com:76,war:78,int:72,pol:70,cha:65, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:45},
  {name:'邓艾',  com:88,war:82,int:90,pol:72,cha:70, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'S',naval:'C'}, minTurn:189},
  {name:'钟会',  com:85,war:60,int:92,pol:78,cha:75, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'A',naval:'C'}, minTurn:261},
  {name:'孟达',  com:72,war:75,int:70,pol:65,cha:60, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:1},
  {name:'申耽',  com:65,war:72,int:58,pol:55,cha:52, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'C',naval:'C'}, minTurn:1},
  {name:'郝昭',  com:78,war:82,int:72,pol:60,cha:62, apt:{cavalry:'B',light:'B',heavy:'S',archer:'B',siege:'A',naval:'C'}, minTurn:45},
  {name:'张任',  com:80,war:85,int:68,pol:60,cha:65, apt:{cavalry:'B',light:'S',heavy:'B',archer:'A',siege:'B',naval:'C'}, minTurn:1},
  // ── 普通级 ──
  {name:'杨洪',  com:68,war:45,int:78,pol:82,cha:65,apt:{cavalry:'C',light:'C',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:1},
  {name:'蒋琬',  com:72,war:48,int:80,pol:85,cha:72,apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:117},
  {name:'费祎',  com:70,war:50,int:82,pol:86,cha:76,apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:117},
  // ── v143: 归属修正 ──
  {name:'姜维',  com:92,war:88,int:86,pol:72,cha:78, apt:{cavalry:'A',light:'S',heavy:'B',archer:'A',siege:'B',naval:'C'}, minTurn:80},
  // ── v143 B类在野延迟 ──
  {name:'文鸯',  com:75,war:95,int:55,pol:42,cha:60, apt:{cavalry:'S',light:'A',heavy:'B',archer:'C',siege:'C',naval:'C'}, minTurn:261},
  {name:'羊祜',  com:82,war:55,int:88,pol:90,cha:85, apt:{cavalry:'B',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:261},
  {name:'王濬',  com:80,war:70,int:78,pol:72,cha:68, apt:{cavalry:'B',light:'B',heavy:'B',archer:'B',siege:'B',naval:'S'}, minTurn:189},
];
// 在野武将元数据
const WILD_GEN_META = {
  '徐庶' :{title:'单福·颍川名士',  post:{name:'军师',rank:'文官',desc:'早年化名单福投刘备，智谋出众，识人极准。'},skills:[],loyalty:70,values:['忠义'],birthplace:'颍川',clan:'颍川徐氏',gentry:'颍川士族',relations:[{name:'诸葛亮',type:'挚友',icon:'🤝'},{name:'庞统',type:'同窗',icon:'📚'}]},
  '陈宫' :{title:'宁死不屈',  post:{name:'谋主',rank:'文官',desc:'智谋深远，尤擅分析天下大势，主公决策准确率+15%。'},skills:[{name:'犄角',type:'被动',icon:'🏴',desc:'己方units≥2时，陈宫unit ATK×1.05。（已实装）'}],loyalty:65,values:['忠义'],birthplace:'东郡',clan:'东郡陈氏',relations:[{name:'吕布',type:'旧主',icon:'👑'},{name:'曹操',type:'宿敌',icon:'⚔'}]},
  '田丰' :{title:'刚而犯上',        post:{name:'上计',rank:'文官',desc:'内政全才，己方城市粮产+6%，人口增长+5%。'},skills:[{name:'极谏',type:'被动',icon:'📢',desc:'当官时己方情报精度+2（INT阈值降低）。（已实装）'}],loyalty:75,values:[],birthplace:'巨鹿',clan:'冀州田氏',gentry:'冀州士族',relations:[{name:'沮授',type:'同僚',icon:'🤝'},{name:'袁绍',type:'旧主',icon:'👑'}]},
  '沮授' :{title:'河北谋主', post:{name:'监军',rank:'文官',desc:'军政双修，行军期间部队粮耗-10%，补给线不易被截断。'},skills:[],loyalty:72,values:['忠义'],birthplace:'广平',clan:'冀州沮氏',relations:[{name:'田丰',type:'同僚',icon:'🤝'}]},
  '张松' :{title:'倒持西蜀',        post:{name:'别驾',rank:'文官',desc:'熟知益州山川地理，己方在蜀地行军AP消耗-20%。'},skills:[{name:'献图',type:'被动',icon:'🗺',desc:'当官时细作探报花费减半（800→400金）。（已实装）'}],loyalty:55,values:['投机'],birthplace:'益州',clan:'益州张氏',relations:[{name:'法正',type:'同谋',icon:'🤝'}]},
  '庞德' :{title:'抬棺决死',        post:{name:'先锋',rank:'将',desc:'万人敌之勇，正面冲阵时部队战力+12%。'},skills:[{name:'抬棺',type:'被动',icon:'⚰',desc:'敌总兵力≥己方×3时，庞德squad ATK/DEF×1.20。（已实装）'}],loyalty:80,values:['忠义'],birthplace:'南安',clan:'南安庞氏',relations:[{name:'马超',type:'旧主',icon:'👑'},{name:'关羽',type:'宿敌',icon:'⚔'}]},
  '文聘' :{title:'荆州柱石',        post:{name:'守将',rank:'将',desc:'长于守备，驻守城市防御加成+15%。'},skills:[{name:'镇荆',type:'被动',icon:'🏰',desc:'荆州城市守城时DEF×1.20。（已实装）'}],loyalty:75,values:['忠义'],birthplace:'南阳',clan:'南阳文氏',relations:[]},
  '高顺' :{title:'陷阵营统领',      post:{name:'陷阵将',rank:'将',desc:'统率陷阵营，所部重步兵战力+18%，营寨战强攻成功率+15%。'},skills:[{name:'陷阵',type:'被动',icon:'💥',desc:'所在部队经验获取×1.50。（已实装）'}],loyalty:90,values:['忠义'],birthplace:'未详',clan:'',relations:[{name:'吕布',type:'旧主',icon:'👑'}]},
  '李严' :{title:'托孤重臣',          post:{name:'尚书令',rank:'文官',desc:'蜀汉重臣，主持内政可加速建设速度-1旬。'},skills:[{name:'误期',type:'被动',icon:'⚠',desc:'当官时缓解派系孤立(阈值5→3%/10→7%)，调粮损耗×1.20。（已实装）'}],loyalty:65,values:[],birthplace:'南阳',clan:'荆州李氏',relations:[{name:'诸葛亮',type:'政敌',icon:'⚔'}]},
  '邓艾' :{title:'偷渡阴平',        post:{name:'合围',rank:'将',desc:'善用险道奇兵，山地行军AP消耗减半，奇袭成功率+20%。'},skills:[{name:'裹毡',type:'被动',icon:'🏔',desc:'山地/丘陵ATK/DEF×1.10，全地形AP消耗×0.85。（已实装）'}],loyalty:78,values:['忠义'],birthplace:'义阳棘阳',clan:'',relations:[{name:'钟会',type:'宿敌',icon:'⚔'}]},
  '钟会' :{title:'志大才疏',        post:{name:'谋帅',rank:'文官',desc:'文武兼备，统率与智谋均衡，伏击识破率+25%。'},skills:[{name:'矜功',type:'被动',icon:'👑',desc:'敌方侦查本部队INT阈值+15；同队亲密度每战-1。（已实装）'}],loyalty:55,values:['野心'],birthplace:'颍川长社',clan:'颍川钟氏',gentry:'颍川士族',relations:[{name:'邓艾',type:'宿敌',icon:'⚔'},{name:'司马懿',type:'旧主后人',icon:'👑'}]},
  '孟达' :{title:'反复无常',        post:{name:'守将',rank:'将',desc:'善守关隘，驻守山城防御加成+10%。'},skills:[],loyalty:40,values:['投机'],birthplace:'扶风',clan:'',relations:[{name:'刘封',type:'同僚',icon:'🤝'},{name:'司马懿',type:'宿敌',icon:'⚔'}]},
  '申耽' :{title:'上庸豪族',        post:{name:'郡守',rank:'将',desc:'上庸地方豪族，驻守上庸城城防+8%。'},skills:[],loyalty:50,values:[],birthplace:'上庸',clan:'上庸申氏',relations:[]},
  '马谡' :{title:'言过其实',        post:{name:'参军',rank:'文官',desc:'熟读兵书，制定作战计划时战力评估误差-10%。'},skills:[],loyalty:75,values:[],birthplace:'荆州宜城',clan:'荆州马氏',gentry:'荆州士族',relations:[{name:'诸葛亮',type:'恩主',icon:'👑'},{name:'王平',type:'同僚',icon:'🤝'}]},
  '郝昭' :{title:'陈仓坚守',        post:{name:'守将',rank:'将',desc:'守城专家，攻城方攻城兵器效果对己方城市减半。'},skills:[{name:'拒蜀',type:'被动',icon:'🏯',desc:'守城战守方有郝昭时，城防倍率+0.15。（已实装）'}],loyalty:82,values:['忠义'],birthplace:'太原',clan:'',relations:[]},
  '张任' :{title:'落凤之弓',        post:{name:'先锋',rank:'将',desc:'蜀道险关守将，山地伏击成功率+20%。'},skills:[{name:'落凤',type:'被动',icon:'🏹',desc:'设伏方有张任时，中伏率+15%。（已实装）'}],loyalty:88,values:['忠义'],birthplace:'益州',clan:'',relations:[]},
  '杨洪' :{title:'蜀中干吏',        post:{name:'郡守',rank:'文官',desc:'精于内政，辖区人口增长+8%，民心稳定。'},skills:[],loyalty:80,values:[],birthplace:'犍为武阳',clan:'蜀地杨氏',relations:[]},
  '蒋琬' :{title:'社稷之器',          post:{name:'丞相继任',rank:'文官',desc:'诸葛亮身后蜀汉柱石，内政全面加成+8%。'},skills:[{name:'稳政',type:'被动',icon:'⚖',desc:'当官/君主时粮产+5%。（已实装）'}],loyalty:88,values:['忠义'],birthplace:'零陵湘乡',clan:'荆州蒋氏',relations:[{name:'诸葛亮',type:'继承者',icon:'📜'},{name:'费祎',type:'同僚',icon:'🤝'}]},
  '费祎' :{title:'折冲良臣',          post:{name:'大将军',rank:'文官',desc:'调和文武，外交行动成功率+15%。'},skills:[{name:'折冲',type:'被动',icon:'🍶',desc:'当官/君主时铁/木产出+5%。（已实装）'}],loyalty:85,values:[],birthplace:'江夏鄳县',clan:'荆州费氏',relations:[{name:'蒋琬',type:'同僚',icon:'🤝'},{name:'诸葛亮',type:'恩主',icon:'👑'}]},
  '向宠' :{title:'出师表所荐',          post:{name:'中领军',rank:'将',desc:'公允持平，麾下部队士气稳定，不会因欠饷骤降。'},skills:[],loyalty:85,values:['忠义'],birthplace:'荆州宜城',clan:'荆州向氏',relations:[]},
  // ── v143: 姜维从蜀移入在野 ──
  '姜维' :{title:'天水麒麟儿',post:{name:'镇军将军',rank:'将',desc:'文武双全，诸葛亮衣钵传人，蜀汉后期柱石。'},skills:[{name:'取将',type:'被动',icon:'🎯',desc:'伏击战/劫营中ATK×1.10、命中优先敌主将。（已实装）'}],loyalty:90,values:['忠义'],birthplace:'天水冀县',clan:'天水姜氏',gentry:'西凉士族',relations:[{name:'诸葛亮',type:'恩师',icon:'📜'}]},
  // ── v143 B类在野 ──
  '文鸯' :{title:'单骑退雄兵',post:{name:'前将军',rank:'将',desc:'勇冠三军，单骑冲阵退敌。'},skills:[],loyalty:70,values:[],birthplace:'谯郡',clan:'',relations:[]},
  '羊祜' :{title:'襄阳儒帅',post:{name:'征南大将军',rank:'文官',desc:'以德服人，镇守襄阳，为灭吴奠基。'},skills:[],loyalty:85,values:['忠义'],birthplace:'泰山南城',clan:'泰山羊氏',gentry:'中原士族',relations:[]},
  '王濬' :{title:'楼船灭吴',post:{name:'龙骧将军',rank:'将',desc:'建造楼船，顺江而下灭吴，水军统帅。'},skills:[],loyalty:80,values:[],birthplace:'弘农湖县',clan:'',relations:[]},
}; 

// ★ v130fix: 统一武将元数据查找（GEN_META优先，fallback WILD_GEN_META）
function getGenMeta(genName){ return GEN_META[genName] || WILD_GEN_META[genName] || {}; }

/** 武将五维静态标签
 *  politics:    uniHan(尊汉) | warlord(枭雄) | regional(地域) | pragmatic(实用)
 *  combat:      hawk(鹰派) | dove(鸽派) | neutral
 *  origin:      gentry(士族) | magnate(地方豪族/商贾) | humble(寒门) | clan(宗族) | noble(旧阀贵族) | foreign(外族)
 *  state:       si/yu/yan/xu/qing/ji/you/bing/liang/jing/yang/yi/jiao/nanzhong（东汉十三州+南中）
 *  clique:      dongzhou(东州派) | huaisi(淮泗派) — 仅客居集团武将有此字段
 *  temperament: proud(傲) | reckless(莽) | steady(沉稳) | cunning(狡黠) | steadfast(刚毅) | generous(仁厚)
 */
const GEN_TAGS = {
  // ── 魏（34人）──
  '曹操':    {politics:'warlord',  combat:'hawk',    origin:'gentry',   state:'yu',temperament:'cunning'},
  '张辽':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'bing',temperament:'steady'},
  '郭嘉':    {politics:'pragmatic',combat:'hawk',    origin:'gentry',   state:'yu',temperament:'cunning'},
  '夏侯惇':  {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'steadfast'},
  '荀彧':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'yu',temperament:'steadfast'},
  '曹仁':    {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'steadfast'},
  '乐进':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'yan',temperament:'steady'},
  '于禁':    {politics:'pragmatic',combat:'neutral', origin:'humble',   state:'yan',temperament:'steadfast'},
  '徐晃':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'si',temperament:'steadfast'},
  '张郃':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'ji',temperament:'steadfast'},
  '司马懿':  {politics:'pragmatic',combat:'neutral', origin:'gentry',   state:'si',temperament:'cunning'},
  '夏侯渊':  {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'proud'},
  '许褚':    {politics:'warlord',  combat:'hawk',    origin:'humble',   state:'yu',temperament:'reckless'},
  '典韦':    {politics:'warlord',  combat:'hawk',    origin:'humble',   state:'yu',temperament:'reckless'},
  '荀攸':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'yu',temperament:'cunning'},
  '程昱':    {politics:'warlord',  combat:'hawk',    origin:'gentry',   state:'yan',temperament:'cunning'},
  '贾诩':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'liang',temperament:'cunning'},
  '满宠':    {politics:'warlord',  combat:'hawk',    origin:'gentry',   state:'yan',temperament:'steady'},
  '钟繇':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'yu',temperament:'steadfast'},
  '王朗':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'xu',temperament:'steadfast'},
  '曹洪':    {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'reckless'},
  '郭淮':    {politics:'pragmatic',combat:'hawk',    origin:'gentry',   state:'bing',temperament:'steady'},
  // ── 蜀（27人）──
  '刘备':    {politics:'uniHan',   combat:'neutral', origin:'clan',  state:'you',temperament:'generous'},
  '关羽':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'si',temperament:'proud'},
  '张飞':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'you',temperament:'reckless'},
  '诸葛亮':  {politics:'uniHan',   combat:'neutral', origin:'gentry',   state:'qing',temperament:'steady'},
  '赵云':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'ji',temperament:'steady'},
  '马超':    {politics:'uniHan',   combat:'hawk',    origin:'noble',  state:'liang',temperament:'proud'},
  '黄忠':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'jing',temperament:'steady'},
  '魏延':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'jing',temperament:'proud'},
  '庞统':    {politics:'uniHan',   combat:'neutral', origin:'gentry',   state:'jing',temperament:'proud'},
  '法正':    {politics:'pragmatic',combat:'hawk',    origin:'gentry',   state:'liang',temperament:'cunning',clique:'dongzhou'},
  '姜维':    {politics:'uniHan',   combat:'hawk',    origin:'gentry',   state:'liang',temperament:'cunning'},
  '王平':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'yi',temperament:'steady'},
  '廖化':    {politics:'uniHan',   combat:'neutral', origin:'humble',   state:'jing',temperament:'steady'},
  '马岱':    {politics:'uniHan',   combat:'hawk',    origin:'noble',  state:'liang',temperament:'steady'},
  '董允':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'jing',temperament:'steadfast',clique:'dongzhou'},
  '张翼':    {politics:'uniHan',   combat:'neutral', origin:'gentry',   state:'yi',temperament:'steady'},
  '吴懿':    {politics:'uniHan',   combat:'hawk',    origin:'gentry',   state:'yan',temperament:'generous',clique:'dongzhou'},
  '马忠':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'yi',temperament:'generous'},
  '霍峻':    {politics:'uniHan',   combat:'neutral', origin:'humble',   state:'jing',temperament:'steadfast'},
  // ── 吴（26人）──
  '孙权':    {politics:'regional', combat:'neutral', origin:'clan',  state:'yang',temperament:'steadfast'},
  '周瑜':    {politics:'regional', combat:'hawk',    origin:'gentry',   state:'yang',temperament:'proud',clique:'huaisi'},
  '甘宁':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yi',temperament:'reckless'},
  '鲁肃':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'xu',temperament:'generous',clique:'huaisi'},
  '太史慈':  {politics:'regional', combat:'hawk',    origin:'humble',   state:'qing',temperament:'proud'},
  '吕蒙':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yu',temperament:'cunning',clique:'huaisi'},
  '陆逊':    {politics:'regional', combat:'dove',    origin:'gentry',   state:'yang',temperament:'cunning'},
  '黄盖':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'jing',temperament:'steady'},
  '凌统':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'reckless'},
  '丁奉':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'steadfast'},
  '程普':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'you',temperament:'steady'},
  '孙策':    {politics:'regional', combat:'hawk',    origin:'clan',  state:'yang',temperament:'proud'},
  '朱然':    {politics:'regional', combat:'hawk',    origin:'gentry',   state:'yang',temperament:'proud'},
  '张昭':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'xu',temperament:'steadfast',clique:'huaisi'},
  '诸葛瑾':  {politics:'regional', combat:'dove',    origin:'gentry',   state:'qing',temperament:'generous'},
  '韩当':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'you',temperament:'steady'},
  '徐盛':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'qing',temperament:'steady'},
  '潘璋':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yan',temperament:'reckless'},
  // ── 在野（20人）──
  '徐庶':    {politics:'uniHan',   combat:'neutral', origin:'humble',   state:'yu',temperament:'cunning'},
  '陈宫':    {politics:'uniHan',   combat:'hawk',    origin:'gentry',   state:'yan',temperament:'cunning'},
  '田丰':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'ji',temperament:'steadfast'},
  '沮授':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'ji',temperament:'steadfast'},
  '张松':    {politics:'pragmatic',combat:'neutral', origin:'gentry',   state:'yi',temperament:'cunning'},
  '庞德':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'liang',temperament:'steadfast'},
  '文聘':    {politics:'pragmatic',combat:'neutral', origin:'humble',   state:'jing',temperament:'steadfast'},
  '高顺':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'bing',temperament:'steadfast'},
  '李严':    {politics:'pragmatic',combat:'hawk',    origin:'gentry',   state:'jing',temperament:'cunning',clique:'dongzhou'},
  '邓艾':    {politics:'warlord',  combat:'hawk',    origin:'humble',   state:'yu',temperament:'cunning'},
  '钟会':    {politics:'warlord',  combat:'hawk',    origin:'gentry',   state:'yu',temperament:'cunning'},
  '孟达':    {politics:'pragmatic',combat:'neutral', origin:'magnate',   state:'liang',temperament:'cunning'},
  '申耽':    {politics:'pragmatic',combat:'neutral', origin:'magnate',   state:'jing',temperament:'steady'},
  '马谡':    {politics:'uniHan',   combat:'hawk',    origin:'gentry',   state:'jing',temperament:'proud'},
  '郝昭':    {politics:'pragmatic',combat:'neutral', origin:'humble',   state:'bing',temperament:'steadfast'},
  '张任':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yi',temperament:'reckless'},
  '杨洪':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'yi',temperament:'steadfast'},
  '蒋琬':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'jing',temperament:'steadfast'},
  '费祎':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'jing',temperament:'steadfast'},
  '向宠':    {politics:'uniHan',   combat:'neutral', origin:'humble',   state:'jing',temperament:'generous'},
  // ── 补充势力将（v117审计补全） ──
  // 魏
  '李典':    {politics:'pragmatic',combat:'neutral', origin:'magnate',   state:'yan',temperament:'steady'}, // 山阳巨野李氏，好学儒雅
  '臧霸':    {politics:'regional', combat:'hawk',    origin:'magnate',   state:'xu',temperament:'reckless'}, // 泰山群寇出身，地方豪帅
  '蒋济':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'yang',temperament:'cunning'}, // 楚国平阿，谋主型文官
  '刘晔':    {politics:'uniHan',   combat:'neutral', origin:'gentry',   state:'yang',temperament:'cunning'}, // 淮南成德，汉室宗亲，善奇策
  '朱灵':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'ji',temperament:'steady'},     // 冀州清河，原袁绍部将
  '牛金':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'yu',temperament:'reckless'}, // 曹仁部将，勇猛冲锋
  '陈群':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'yu',temperament:'steadfast'}, // 颍川许昌，九品中正制创始人
  // 魏v124新增
  '曹真':    {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'steady'}, // 曹操养子，伐蜀主帅
  '曹彰':    {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'proud'}, // 黄须儿，纯武将
  '华歆':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'qing',temperament:'steadfast'},     // 平原高唐，逼宫司徒
  '张绣':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'liang',temperament:'reckless'},   // 武威祖厉，宛城降将
  '曹休':    {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'steady'}, // 千里驹，宗室统帅
  // 蜀
  '严颜':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yi',temperament:'steadfast'},    // 巴郡老将，义释张飞
  // 蜀v124新增
  '关平':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'si',temperament:'reckless'},  // 关羽之子，父子同死
  '关兴':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'si',temperament:'proud'},  // 关羽次子，小关张
  '张苞':    {politics:'uniHan',   combat:'hawk',    origin:'humble',   state:'you',temperament:'reckless'}, // 张飞之子，小关张
  '刘封':    {politics:'pragmatic',combat:'hawk',    origin:'noble',  state:'jing',temperament:'proud'},  // 刘备养子，刚猛有野心
  '吴班':    {politics:'uniHan',   combat:'neutral', origin:'gentry',   state:'yan',temperament:'reckless'},    // 外戚，吴懿族弟
  '邓芝':    {politics:'uniHan',   combat:'neutral', origin:'gentry',   state:'jing',temperament:'steady'},  // 南阳新野，善外交，出使东吴
  '黄权':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'yi',temperament:'steadfast'},    // 巴西阆中，刘备谋臣
  // 吴
  '步骘':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'xu',temperament:'steadfast'}, // 临淮淮阴，迁居江东，丞相
  '贺齐':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'cunning'}, // 会稽山阴，平山越名将
  '顾雍':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'yang',temperament:'steadfast'}, // 吴郡吴县，蔡邕弟子，丞相
  // 吴v124新增
  '周泰':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'steadfast'}, // 九江下蔡，以命护主
  '蒋钦':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'generous'}, // 九江寿春，公正宿将
  '全琮':    {politics:'regional', combat:'hawk',    origin:'gentry',   state:'yang',temperament:'steady'}, // 吴郡钱唐，孙权女婿
  '陆抗':    {politics:'regional', combat:'dove',    origin:'gentry',   state:'yang',temperament:'cunning'}, // 吴郡吴县，末代名将
  '吕范':    {politics:'regional', combat:'neutral', origin:'humble',   state:'yu',temperament:'generous'}, // 汝南细阳，元从干才
  // ── v143新增武将 ──
  // 魏
  '曹纯':    {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'steadfast'}, // 虎豹骑统领
  '毛玠':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'yan',temperament:'steadfast'}, // 选才屯田
  '董昭':    {politics:'pragmatic',combat:'dove',    origin:'gentry',   state:'yan',temperament:'cunning'}, // 迁都策划
  '曹丕':    {politics:'warlord',  combat:'neutral', origin:'clan',  state:'yu',temperament:'cunning'}, // 曹操继承人
  '曹植':    {politics:'uniHan',   combat:'dove',    origin:'clan',  state:'yu',temperament:'proud'}, // 七步成诗
  '郭女王':  {politics:'warlord',  combat:'dove',    origin:'gentry',   state:'ji',temperament:'cunning'}, // 曹丕皇后
  // 蜀
  '糜竺':    {politics:'uniHan',   combat:'dove',    origin:'magnate',   state:'xu',temperament:'generous'}, // 资助刘备起家
  '糜芳':    {politics:'pragmatic',combat:'neutral', origin:'magnate',   state:'xu',temperament:'cunning'}, // 后叛变
  '孙乾':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'qing',temperament:'generous'}, // 元老文臣
  '简雍':    {politics:'uniHan',   combat:'dove',    origin:'humble',   state:'you',temperament:'generous'}, // 说客型
  // 吴
  '朱桓':    {politics:'regional', combat:'hawk',    origin:'gentry',   state:'yang',temperament:'reckless'}, // 濡须猛将
  '骆统':    {politics:'regional', combat:'dove',    origin:'gentry',   state:'yang',temperament:'steadfast'}, // 文武兼备
  '吕据':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yu',temperament:'steady'}, // 吕范之子
  '留赞':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'reckless'}, // 勇将
  '孙尚香':  {politics:'regional', combat:'hawk',    origin:'clan',  state:'yang',temperament:'proud'}, // 孙氏公主
  // 在野(姜维)
  '姜维':    {politics:'uniHan',   combat:'hawk',    origin:'gentry',   state:'liang',temperament:'cunning'}, // 天水麒麟儿
  // v143 B类
  '司马昭':  {politics:'warlord',  combat:'hawk',    origin:'gentry',   state:'si',temperament:'cunning'}, // 路人皆知
  '陈泰':    {politics:'pragmatic',combat:'neutral', origin:'gentry',   state:'yu',temperament:'steady'}, // 陈群之子
  '王基':    {politics:'pragmatic',combat:'hawk',    origin:'gentry',   state:'qing',temperament:'steadfast'}, // 魏晚期重臣
  '夏侯霸':  {politics:'warlord',  combat:'hawk',    origin:'clan',  state:'yu',temperament:'reckless'}, // 夏侯渊之子降蜀
  '诸葛恪':  {politics:'regional', combat:'hawk',    origin:'gentry',   state:'qing',temperament:'proud'}, // 诸葛瑾之子
  '施绩':    {politics:'regional', combat:'hawk',    origin:'humble',   state:'yang',temperament:'steady'}, // 朱然之子
  '文鸯':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'yu',temperament:'reckless'}, // 单骑退雄兵
  '羊祜':    {politics:'uniHan',   combat:'dove',    origin:'gentry',   state:'yan',temperament:'generous'}, // 儒帅
  '王濬':    {politics:'pragmatic',combat:'hawk',    origin:'humble',   state:'si',temperament:'cunning'}, // 楼船灭吴
  // ── ★ v144 南蛮 ──
  '孟获':    {politics:'regional', combat:'hawk',    origin:'foreign',  state:'nanzhong',temperament:'reckless'},
  '祝融':    {politics:'regional', combat:'hawk',    origin:'foreign',  state:'nanzhong',temperament:'reckless'},
};
