// src/data/generals.js
//
// 全武将静态数据 — 标签 + 在野池 + 主表 + 元数据 + 派生 + 派系核心 + 类型
//
// 来源(2 阶段抽离):
//
//   Phase 1.2 (Session 1.2 / 阶段 1):
//     - WILD_GENS / WILD_GEN_META(原 L3674-L3731):在野武将池 + 元数据
//     - getGenMeta(原 L3736-L3737):统一武将元数据查找,fallback WILD_GEN_META
//     - GEN_TAGS(原 L3839-L4000):武将五维静态标签(politics/combat/origin/state/temperament/clique)
//
//   refactor/data-completion S1 (本次,2026-05-05):
//     §D 武将主表 + 元数据 + 派生 + 池 + 派系核心 + 类型
//     - GENS_FULL(原 L1186-L1319):势力武将基础属性(攻防智政魅 + apt)
//     - GEN_META(原 L1324-L1944):势力武将元数据(技能 / 官职 / 关系 / 士族)
//     - ALL_GENS(原 L1949,IIFE 派生):全将领扁平列表 = GENS_FULL.flat() + WILD_GENS
//     - GEN_POOL_INACTIVE(原 L1953-L1963):非活跃武将库(剧本不参战,留数据)
//     - FOUNDING_CORE(原 L1981-L1986):核心创始成员白名单(每势力 5-8 人)
//     - GEN_CLASS(原 L1990-L2044):武将四类(warrior/commander/strategist/minister)
//     - CLASS_META(原 L2045-L2050):四类元数据(icon / label / color)
//
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),原则 #8 Node 双脚本 + 标点保留。
// 接口风格:全局 const(同 phase 1 决定),所有调用点不需改。
//
// 留 v181 的(等运行时 helper sprint / squad class sprint):
//   - GEN_MAP / _deepCloneGen / _rebuildGEN_MAP(原 L1965-L1972 区域,顶层 let + helper,
//     phase 3.12 决策延续 + 与 initGame 重建动作绑定,留 v181 等运行时 helper sprint)
//   - squad class 6 函数(原 L2053-L2127):getSquadClass / getUnitClassBuffs /
//     getClassDuelWeight / genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml
//     (DP-B 决策延续 phase3_12_notes §一,留 v181 等 mechanism/render sprint)
//
// loading 顺序:本文件在 v181.html 主 inline script 之前加载,且**必须早于
// src/data/state_county.js**(state_county.js 含 _CLAN_MAP IIFE 装配 GEN_TAGS)。
// 同 realm classic <script> 共享 script-scope,跨 script lazy resolve(p3.1 / p3.4 验证锚点)。

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

// ════════════════════════════════════════════════════════════
// §D refactor/data-completion S1: 武将主表 + 元数据 + 派生 + 池 + 派系核心 + 类型
// (原 project_romance_v181.html 见 RANGES 注释,共 855 行 verbatim)
// ════════════════════════════════════════════════════════════

// ── range A: GENS_FULL + GEN_META + ALL_GENS + GEN_POOL_INACTIVE (原 L1186-L1963, 778 行) ──
const GENS_FULL={
  wei:[
    {name:'曹操', com:97,war:80,int:91,pol:96,cha:87,role:'ruler',   apt:{cavalry:'A',light:'S',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'张辽', com:92,war:95,int:72,pol:60,cha:78, apt:{cavalry:'S',light:'A',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'郭嘉', com:85,war:48,int:99,pol:78,cha:72, apt:{cavalry:'B',light:'B',heavy:'C',archer:'A',siege:'C',naval:'C'}},
    {name:'夏侯惇',com:88,war:91,int:62,pol:55,cha:70,apt:{cavalry:'A',light:'S',heavy:'A',archer:'C',siege:'C',naval:'C'}},
    {name:'荀彧', com:80,war:42,int:96,pol:94,cha:80,apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'曹仁', com:90,war:88,int:76,pol:65,cha:72, apt:{cavalry:'B',light:'A',heavy:'S',archer:'C',siege:'B',naval:'C'}},
    {name:'乐进', com:80,war:88,int:65,pol:52,cha:60, apt:{cavalry:'B',light:'S',heavy:'B',archer:'A',siege:'C',naval:'C'}},
    {name:'于禁', com:84,war:82,int:70,pol:68,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'C'}},
    {name:'徐晃', com:88,war:89,int:74,pol:62,cha:70, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'A',naval:'C'}},
    {name:'张郃', com:86,war:90,int:80,pol:65,cha:72, apt:{cavalry:'S',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'司马懿',com:94,war:55,int:98,pol:92,cha:82,apt:{cavalry:'A',light:'S',heavy:'B',archer:'A',siege:'A',naval:'C'}},
    {name:'夏侯渊',com:84,war:90,int:62,pol:55,cha:65,apt:{cavalry:'S',light:'B',heavy:'B',archer:'B',siege:'C',naval:'C'}},
    {name:'许褚', com:72,war:99,int:42,pol:38,cha:55, apt:{cavalry:'B',light:'S',heavy:'A',archer:'C',siege:'C',naval:'C'}},
    {name:'荀攸', com:78,war:45,int:95,pol:88,cha:75, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'程昱', com:76,war:50,int:90,pol:82,cha:68, apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'A',naval:'C'}},
    {name:'贾诩', com:80,war:45,int:100,pol:85,cha:74,apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    // ── 魏二线武将 ──
    {name:'满宠', com:65,war:62,int:72,pol:78,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'C'}},
    {name:'钟繇', com:42,war:38,int:80,pol:88,cha:75,apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'王朗', com:38,war:30,int:75,pol:82,cha:70,apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'曹洪', com:65,war:70,int:52,pol:58,cha:55, apt:{cavalry:'A',light:'A',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'郭淮', com:72,war:68,int:75,pol:70,cha:62, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'李典', com:74,war:78,int:72,pol:68,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'C',naval:'C'}},
    {name:'臧霸', com:70,war:75,int:55,pol:62,cha:60, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'C',naval:'C'}},
    {name:'蒋济', com:62,war:45,int:82,pol:80,cha:70, apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'刘晔', com:65,war:50,int:85,pol:78,cha:68, apt:{cavalry:'C',light:'B',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'牛金', com:58,war:72,int:45,pol:40,cha:48, apt:{cavalry:'B',light:'A',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'朱灵', com:65,war:70,int:55,pol:52,cha:55, apt:{cavalry:'B',light:'B',heavy:'A',archer:'B',siege:'B',naval:'C'}},
    {name:'陈群', com:55,war:35,int:80,pol:92,cha:78,apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    // ── 魏v124新增 ──
    {name:'曹真', com:85,war:80,int:75,pol:68,cha:72, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'A',naval:'C'}},
    {name:'曹彰', com:72,war:92,int:48,pol:35,cha:65, apt:{cavalry:'S',light:'A',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'华歆', com:45,war:30,int:72,pol:88,cha:70, apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'张绣', com:78,war:85,int:62,pol:48,cha:55, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'C',naval:'C'}},
    {name:'曹休', com:80,war:78,int:70,pol:62,cha:68, apt:{cavalry:'A',light:'B',heavy:'A',archer:'B',siege:'B',naval:'C'}},
    // ── 魏v128新增 ──
    {name:'徐庶', com:85,war:62,int:95,pol:80,cha:82, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    // ── 魏v143新增 ──
    {name:'曹纯', com:72,war:85,int:55,pol:48,cha:62, apt:{cavalry:'S',light:'B',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'毛玠', com:58,war:35,int:75,pol:85,cha:72, apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'B',naval:'C'}},
    {name:'董昭', com:60,war:38,int:82,pol:80,cha:65, apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'B',naval:'C'}},
    {name:'曹丕', com:82,war:68,int:85,pol:88,cha:72, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'曹植', com:55,war:35,int:88,pol:72,cha:85, apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'B',naval:'C'}},
    {name:'郭女王',com:55,war:25,int:80,pol:85,cha:78, apt:{cavalry:'C',light:'C',heavy:'C',archer:'C',siege:'C',naval:'C'}},
    {name:'文聘', com:80,war:85,int:65,pol:60,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'B'}},
    {name:'王平', com:80,war:82,int:70,pol:62,cha:65, apt:{cavalry:'B',light:'A',heavy:'S',archer:'B',siege:'B',naval:'C'}},
    // ── 魏v143 B类延迟出场 ──
    {name:'司马昭',com:85,war:58,int:90,pol:88,cha:75, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'B',naval:'C'}, minTurn:153},
    {name:'陈泰', com:78,war:72,int:80,pol:75,cha:70, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}, minTurn:153},
    {name:'王基', com:75,war:65,int:82,pol:78,cha:68, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'B',naval:'C'}, minTurn:117},
  ],
  shu:[
    {name:'刘备', com:82,war:72,int:78,pol:92,cha:96,role:'ruler',   apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'关羽', com:96,war:98,int:74,pol:62,cha:88, apt:{cavalry:'A',light:'S',heavy:'A',archer:'B',siege:'B',naval:'A'}},
    {name:'张飞', com:85,war:97,int:52,pol:48,cha:68, apt:{cavalry:'B',light:'S',heavy:'A',archer:'C',siege:'C',naval:'C'}},
    {name:'诸葛亮',com:97,war:58,int:100,pol:96,cha:94,apt:{cavalry:'B',light:'A',heavy:'B',archer:'S',siege:'S',naval:'B'}},
    {name:'赵云', com:90,war:96,int:76,pol:68,cha:82, apt:{cavalry:'S',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'马超', com:88,war:95,int:65,pol:52,cha:78, apt:{cavalry:'S',light:'B',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'黄忠', com:82,war:94,int:62,pol:55,cha:68, apt:{cavalry:'C',light:'A',heavy:'B',archer:'S',siege:'B',naval:'C'}},
    {name:'魏延', com:86,war:92,int:70,pol:58,cha:60, apt:{cavalry:'A',light:'S',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'庞统', com:82,war:52,int:96,pol:88,cha:80, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'A',naval:'B'}},
    {name:'法正', com:80,war:55,int:95,pol:86,cha:76, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'廖化', com:72,war:78,int:60,pol:55,cha:58, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'C',naval:'C'}},
    {name:'马岱', com:75,war:82,int:65,pol:55,cha:62, apt:{cavalry:'S',light:'B',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    // ── 蜀二线武将 ──
    {name:'董允', com:42,war:38,int:78,pol:85,cha:75,apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'张翼', com:62,war:65,int:68,pol:70,cha:58, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'C'}},
    {name:'吴懿', com:68,war:72,int:60,pol:65,cha:62, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'马忠', com:65,war:68,int:72,pol:68,cha:65, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'霍峻', com:60,war:65,int:65,pol:68,cha:60, apt:{cavalry:'C',light:'B',heavy:'A',archer:'B',siege:'A',naval:'C'}},
    {name:'黄权', com:70,war:60,int:80,pol:75,cha:68, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'邓芝', com:62,war:58,int:72,pol:76,cha:72,apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'严颜', com:68,war:82,int:58,pol:55,cha:65, apt:{cavalry:'C',light:'A',heavy:'A',archer:'B',siege:'B',naval:'C'}},
    // ── 蜀v124新增 ──
    {name:'关平', com:72,war:82,int:60,pol:50,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'B'}},
    {name:'关兴', com:75,war:85,int:58,pol:48,cha:68, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'C',naval:'B'}, minTurn:45},
    {name:'张苞', com:70,war:88,int:45,pol:38,cha:60, apt:{cavalry:'A',light:'S',heavy:'B',archer:'C',siege:'C',naval:'C'}, minTurn:45},
    {name:'刘封', com:72,war:80,int:55,pol:42,cha:52, apt:{cavalry:'B',light:'A',heavy:'A',archer:'C',siege:'B',naval:'C'}},
    {name:'吴班', com:65,war:72,int:58,pol:55,cha:58, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'C',naval:'C'}},
    // ── 蜀v128新增 ──
    {name:'马谡', com:75,war:55,int:86,pol:68,cha:70, apt:{cavalry:'C',light:'B',heavy:'B',archer:'A',siege:'B',naval:'C'}},
    {name:'向宠', com:75,war:78,int:68,pol:62,cha:65, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    // ── 蜀v143新增 ──
    {name:'糜竺', com:45,war:30,int:62,pol:78,cha:82, apt:{cavalry:'C',light:'C',heavy:'C',archer:'C',siege:'C',naval:'C'}},
    {name:'糜芳', com:55,war:60,int:50,pol:55,cha:45, apt:{cavalry:'C',light:'B',heavy:'B',archer:'C',siege:'C',naval:'C'}},
    {name:'孙乾', com:50,war:32,int:68,pol:75,cha:78, apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'简雍', com:48,war:28,int:65,pol:70,cha:80, apt:{cavalry:'C',light:'C',heavy:'C',archer:'C',siege:'C',naval:'C'}},
    // ── 蜀v143 B类延迟出场 ──
    {name:'夏侯霸',com:75,war:80,int:62,pol:55,cha:60, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'C',naval:'C'}, minTurn:153},
  ],
  wu:[
    {name:'孙权', com:88,war:70,int:84,pol:90,cha:88,role:'ruler',   apt:{cavalry:'C',light:'A',heavy:'B',archer:'B',siege:'B',naval:'B'}},
    {name:'周瑜', com:95,war:82,int:96,pol:78,cha:86, apt:{cavalry:'B',light:'S',heavy:'B',archer:'A',siege:'A',naval:'S'}},
    {name:'甘宁', com:82,war:93,int:64,pol:52,cha:72, apt:{cavalry:'A',light:'S',heavy:'B',archer:'B',siege:'C',naval:'S'}},
    {name:'鲁肃', com:78,war:56,int:90,pol:88,cha:82,apt:{cavalry:'B',light:'B',heavy:'B',archer:'B',siege:'B',naval:'B'}},
    {name:'吕蒙', com:90,war:88,int:88,pol:75,cha:78, apt:{cavalry:'B',light:'S',heavy:'A',archer:'B',siege:'A',naval:'S'}},
    {name:'陆逊', com:94,war:60,int:97,pol:88,cha:85, apt:{cavalry:'B',light:'S',heavy:'B',archer:'A',siege:'A',naval:'S'}},
    {name:'黄盖', com:78,war:88,int:72,pol:65,cha:70, apt:{cavalry:'C',light:'A',heavy:'B',archer:'B',siege:'B',naval:'A'}},
    {name:'凌统', com:80,war:90,int:65,pol:58,cha:72, apt:{cavalry:'B',light:'S',heavy:'B',archer:'B',siege:'C',naval:'A'}},
    {name:'丁奉', com:82,war:88,int:72,pol:60,cha:68, apt:{cavalry:'A',light:'A',heavy:'B',archer:'B',siege:'B',naval:'A'}},
    {name:'程普', com:78,war:85,int:68,pol:62,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'A'}},
    {name:'朱然', com:80,war:78,int:75,pol:68,cha:68, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'A',naval:'A'}},
    // ── 吴二线武将 ──
    {name:'张昭', com:40,war:32,int:82,pol:90,cha:80,apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'诸葛瑾',com:55,war:48,int:75,pol:82,cha:78, apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'C'}},
    {name:'韩当', com:62,war:68,int:55,pol:58,cha:55, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'C',naval:'A'}},
    {name:'徐盛', com:68,war:70,int:65,pol:62,cha:60, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'A'}},
    {name:'潘璋', com:65,war:72,int:55,pol:52,cha:50, apt:{cavalry:'A',light:'S',heavy:'B',archer:'C',siege:'C',naval:'A'}},
    {name:'贺齐', com:72,war:75,int:65,pol:62,cha:60, apt:{cavalry:'B',light:'S',heavy:'B',archer:'B',siege:'C',naval:'A'}},
    {name:'顾雍', com:40,war:30,int:78,pol:88,cha:82,apt:{cavalry:'C',light:'C',heavy:'C',archer:'B',siege:'C',naval:'C'}},
    {name:'步骘', com:55,war:48,int:72,pol:80,cha:70,apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'B',naval:'B'}},
    // ── 吴v124新增 ──
    {name:'周泰', com:75,war:90,int:52,pol:42,cha:68, apt:{cavalry:'B',light:'S',heavy:'A',archer:'C',siege:'C',naval:'A'}},
    {name:'蒋钦', com:72,war:78,int:62,pol:60,cha:68, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'C',naval:'A'}},
    {name:'全琮', com:78,war:75,int:72,pol:70,cha:65, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'B'}},
    {name:'吕范', com:70,war:68,int:72,pol:78,cha:68, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'B',naval:'B'}},
    // ── 吴v143新增 ──
    {name:'朱桓', com:78,war:82,int:68,pol:55,cha:62, apt:{cavalry:'B',light:'A',heavy:'A',archer:'B',siege:'B',naval:'A'}},
    {name:'骆统', com:62,war:55,int:72,pol:78,cha:70, apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'C',naval:'B'}},
    {name:'吕据', com:70,war:72,int:62,pol:58,cha:60, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'C',naval:'B'}},
    {name:'留赞', com:65,war:78,int:52,pol:48,cha:55, apt:{cavalry:'B',light:'A',heavy:'B',archer:'C',siege:'C',naval:'A'}},
    {name:'孙尚香',com:62,war:72,int:58,pol:55,cha:75, apt:{cavalry:'B',light:'A',heavy:'C',archer:'B',siege:'C',naval:'B'}},
    // ── 吴v143 B类延迟出场 ──
    {name:'诸葛恪',com:78,war:62,int:88,pol:72,cha:68, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'B',naval:'B'}, minTurn:117},
    {name:'施绩', com:72,war:68,int:65,pol:60,cha:58, apt:{cavalry:'B',light:'A',heavy:'B',archer:'B',siege:'C',naval:'A'}, minTurn:153},
  ],
  // ★ v144: 南蛮势力
  nanman:[
    {name:'孟获', com:78,war:88,int:45,pol:42,cha:72,role:'ruler', apt:{cavalry:'B',light:'S',heavy:'A',archer:'C',siege:'C',naval:'C'}},
    {name:'祝融', com:65,war:82,int:58,pol:38,cha:70,              apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'C',naval:'C'}},
  ],
};

// ═══════════════════════════════════════════════════════
// 武将元数据：技能 · 官职 · 关系 · 士族/乡党 · 初始忠诚
// ═══════════════════════════════════════════════════════
const GEN_META = {
  // ── 魏 ──
  '曹操':{
    title:'治世能臣',
    post:{name:'魏王',rank:'王',desc:'统御天下，号令三军。政令加成+25%，外交行动无需消耗。'},
    skills:[
      {name:'奸雄',type:'被动',icon:'⚙',desc:'当官/君主时，信誉惩罚减半，信誉自然恢复速度×2。（已实装）'},
    ],
    loyalty:95,
    values:[],
    birthplace:'沛国谯县',
    clan:'谯县曹氏',
    faction_clan:'谯沛',
    relations:[
      {name:'夏侯惇',type:'义兄弟',icon:'🤝'},{name:'夏侯渊',type:'宗族',icon:'🏠'},{name:'曹仁',type:'宗族',icon:'🏠'},
      {name:'荀彧',type:'重臣',icon:'📜'},{name:'郭嘉',type:'谋主',icon:'🧠'},
    ],
  },
  '张辽':{
    title:'威震四方',
    post:{name:'征东将军',rank:'将',desc:'镇守东线，兵马优先补员。统辖合肥一带守备。'},
    skills:[
      {name:'威风',type:'被动',icon:'⚡',desc:'敌方兵力≥己方2倍时，张辽所在部队全体士气+20。（已实装）'},
    ],
    loyalty:85,
    values:['忠义'],
    birthplace:'雁门马邑',
    clan:'雁门马邑',
    faction_clan:'并州',
    relations:[{name:'关羽',type:'义友',icon:'🤝'},{name:'曹操',type:'主公',icon:'👑'},{name:'李典',type:'同僚',icon:'🤝'},{name:'乐进',type:'同僚',icon:'🤝'}],
  },
  '郭嘉':{
    title:'鬼才',
    post:{name:'军师祭酒',rank:'文官',desc:'参赞军机，每旬可为一支部队提供情报加成。'},
    skills:[
      {name:'鬼谋',type:'被动',icon:'🧠',desc:'郭嘉所在部队视野+1格。（已实装）'},
    ],
    loyalty:92,
    values:[],
    birthplace:'颍川阳翟',
    clan:'颍川郭氏',
    gentry:'颍川士族',
    faction_clan:'颍川',
    relations:[{name:'荀彧',type:'同乡',icon:'🏠'},{name:'荀攸',type:'同乡',icon:'🏠'},{name:'曹操',type:'主公',icon:'👑'}],
  },
  '夏侯惇':{
    title:'独目苍狼',
    post:{name:'大将军',rank:'将',desc:'武将之首，统辖全军，本势力所有部队补员速度+5%。'},
    skills:[
      {name:'独眼',type:'被动',icon:'👁',desc:'重伤状态下武力不衰减（免疫war×0.8惩罚）。（已实装）'},
    ],
    loyalty:98,
    values:['忠义'],
    birthplace:'沛国谯县',
    clan:'谯县曹氏',
    faction_clan:'谯沛',
    relations:[{name:'曹操',type:'义兄弟',icon:'🤝'},{name:'夏侯渊',type:'族兄弟',icon:'🏠'},{name:'曹仁',type:'宗族',icon:'🏠'}],
  },
  '荀彧':{
    title:'王佐之才',
    post:{name:'尚书令',rank:'文官',desc:'主持内政，所在势力每旬金产+8%，建筑建设速度+1旬。'},
    skills:[
      {name:'王佐',type:'被动',icon:'📜',desc:'荀彧在任官职时，全城豪族支持回复+0.3/旬。（已实装）'},
    ],
    loyalty:78,
    values:['汉室死忠'],
    birthplace:'颍川颍阴',
    clan:'颍川荀氏',
    gentry:'颍川士族',
    faction_clan:'颍川',
    relations:[{name:'郭嘉',type:'同乡',icon:'🏠'},{name:'荀攸',type:'族侄',icon:'🏠'},{name:'曹操',type:'主公',icon:'👑'}],
  },
  '曹仁':{
    title:'曹氏屏障',
    post:{name:'大司马',rank:'将',desc:'南线防守主将，驻守城池守备+15%。'},
    skills:[
      {name:'坚守',type:'被动',icon:'🛡',desc:'曹仁为主将时，守城(garrison)或营寨(camp)战中DEF+15%。（已实装）'},
    ],
    loyalty:97,
    values:['忠义'],
    birthplace:'沛国谯县',
    clan:'谯县曹氏',
    faction_clan:'谯沛',
    relations:[{name:'曹操',type:'宗族',icon:'🏠'},{name:'夏侯惇',type:'宗族',icon:'🏠'},{name:'牛金',type:'部将',icon:'⚔'}],
  },
  '乐进':{
    title:'先登虎胆',
    post:{name:'右将军',rank:'将',desc:'右翼机动部队统领，轻步兵部队行动力+1。'},
    skills:[
      {name:'先登',type:'被动',icon:'⚔',desc:'攻城战时，所有攻方士气+18。（已实装）'},
    ],
    loyalty:88,
    values:['忠义'],
    birthplace:'阳平卫国',faction_clan:'谯沛',
    relations:[{name:'于禁',type:'同僚',icon:'🤝'},{name:'张辽',type:'同僚',icon:'🤝'},{name:'李典',type:'同僚',icon:'🤝'}],
  },
  '于禁':{
    title:'厉行法纪',
    post:{name:'左将军',rank:'将',desc:'执法严明，部队纪律加成，行军时粮耗减少5%。'},
    skills:[
      {name:'治军',type:'被动',icon:'🏳',desc:'于禁在场时，己方全体战前士气+5。（已实装）'},
    ],
    loyalty:72,
    values:[],
    birthplace:'泰山钜平',
    relations:[{name:'乐进',type:'同僚',icon:'🤝'},{name:'张辽',type:'同僚',icon:'🤝'}],
  },
  '徐晃':{
    title:'长驱良将',
    post:{name:'右将军',rank:'将',desc:'擅长迂回奔袭，行军时可绕道突袭敌后方。'},
    skills:[
      {name:'长驱',type:'被动',icon:'🐎',desc:'徐晃为主将且行军路径>3格时AP+1。（已实装）'},
    ],
    loyalty:87,
    values:['忠义'],
    birthplace:'河东杨县',
    relations:[{name:'关羽',type:'义友',icon:'🤝'},{name:'曹操',type:'主公',icon:'👑'}],
  },
  '张郃':{
    title:'巧变良将',
    post:{name:'征西车骑将军',rank:'将',desc:'西线骑兵主帅，骑兵部队在山地的行动力惩罚减半。'},
    skills:[
      {name:'巧变',type:'被动',icon:'🧠',desc:'张郃所在部队不利地形惩罚减半（如cavalry在forest惩罚0.7→0.85）。（已实装）'},
    ],
    loyalty:80,
    values:[],
    birthplace:'河间鄚县',
    faction_clan:'冀州',
    relations:[{name:'司马懿',type:'同僚',icon:'🤝'}],
  },
  '司马懿':{
    title:'冢虎',
    post:{name:'太尉',rank:'文官',desc:'执掌军政，所在势力AI战略决策效率+20%。（待实装）'},
    skills:[
      {name:'冢虎',type:'被动',icon:'🦅',desc:'司马懿为主将时，作为防守方DEF+15%。（已实装）'},
    ],
    loyalty:60,
    values:['野心'],
    birthplace:'河内温县',
    clan:'河内司马氏',
    gentry:'河内士族',
    faction_clan:'河内',
    relations:[{name:'曹操',type:'主公',icon:'👑'},{name:'张郃',type:'同僚',icon:'🤝'}],
  },
  '夏侯渊':{
    title:'虎步关右',
    post:{name:'征西将军',rank:'将',desc:'西线奔袭专家，骑兵部队每旬可额外移动1个节点。'},
    skills:[
      {name:'虎步',type:'被动',icon:'🐎',desc:'夏侯渊为主将时AP+2，但DEF-10%（重攻轻守）。（已实装）'},
    ],
    loyalty:92,
    values:['忠义'],
    birthplace:'沛国谯县',
    clan:'谯县曹氏',
    faction_clan:'谯沛',
    relations:[{name:'夏侯惇',type:'族兄弟',icon:'🏠'},{name:'曹操',type:'宗族',icon:'🏠'}],
  },
  '许褚':{
    title:'虎痴',
    post:{name:'武卫将军',rank:'将',desc:'曹操亲卫统领，与曹操同在时战斗力+20%。'},
    skills:[
      {name:'虎痴',type:'被动',icon:'💪',desc:'许褚参与单挑时score+20，大幅提高胜率。（已实装）'},
    ],
    loyalty:99,
    values:['忠义'],
    birthplace:'谯国谯县',
    faction_clan:'谯沛',
    relations:[{name:'曹操',type:'主公护卫',icon:'🛡'},{name:'典韦',type:'义友',icon:'🤝'}],
  },
  '典韦':{
    title:'古之恶来',
    post:{name:'校尉',rank:'将',desc:'近身护卫，不适合独立统兵，但同城时守备+20%。'},
    skills:[
      {name:'恶来',type:'被动',icon:'💪',desc:'单挑score+15；同队武将不会被俘；突围必成功。（已实装）'},
    ],
    loyalty:99,
    values:['忠义'],
    birthplace:'陈留己吾',
    faction_clan:'谯沛',
    relations:[{name:'曹操',type:'主公护卫',icon:'🛡'},{name:'许褚',type:'义友',icon:'🤝'}],
  },
  '荀攸':{
    title:'谋主',
    post:{name:'尚书',rank:'文官',desc:'参谋主官，战前分析使己方首轮战斗力+5%。'},
    skills:[
      {name:'奇策',type:'被动',icon:'🧠',desc:'当官时用计成功率+8%。（已实装）'},
    ],
    loyalty:88,
    values:[],
    birthplace:'颍川颍阴',
    clan:'颍川荀氏',
    gentry:'颍川士族',
    faction_clan:'颍川',
    relations:[{name:'荀彧',type:'族叔',icon:'🏠'},{name:'郭嘉',type:'同乡',icon:'🏠'}],
  },
  '程昱':{
    title:'胆烈之士',
    post:{name:'振威将军',rank:'文官',desc:'善守险关，驻守城市时粮草消耗-10%。'},
    skills:[],
    loyalty:85,
    values:[],
    birthplace:'东郡东阿',
    clan:'东郡程氏',
    faction_clan:'兖州',
    relations:[{name:'郭嘉',type:'同僚',icon:'🤝'},{name:'荀彧',type:'同僚',icon:'🤝'}],
  },
  '贾诩':{
    title:'毒士',
    post:{name:'太尉',rank:'文官',desc:'毒士之谋，每旬有概率使敌方两势力外交关系-5。（待实装）'},
    skills:[
      {name:'离间',type:'被动',icon:'🎭',desc:'当官/君主时，反间计成功率+20%。（已实装）'},
    ],
    loyalty:70,
    values:[],
    birthplace:'武威姑臧',
    clan:'武威贾氏',
    faction_clan:'凉州',
    relations:[{name:'张绣',type:'旧主',icon:'👑'},{name:'曹操',type:'主公',icon:'👑'}],
  },

  // ── 蜀 ──
  '刘备':{
    title:'仁德之主',
    post:{name:'蜀汉昭烈帝',rank:'王',desc:'仁德感召，治下城市民心+5，叛乱概率减半。'},
    skills:[
      {name:'仁德',type:'被动',icon:'💛',desc:'刘备所在部队撤退判定更宽松（胜率阈值放宽），部队中武将被俘率-15%。（已实装）'},
    ],
    loyalty:98,
    values:['汉室死忠'],
    birthplace:'涿郡涿县',
    clan:'涿郡刘氏',
    relations:[{name:'关羽',type:'义兄弟',icon:'🤝'},{name:'张飞',type:'义兄弟',icon:'🤝'},{name:'诸葛亮',type:'谋主',icon:'🧠'},{name:'赵云',type:'义臣',icon:'🛡'}],
  },
  '关羽':{
    title:'武圣',
    post:{name:'前将军',rank:'将',desc:'军中威望最高，同城守军士气+10。'},
    skills:[
      {name:'武圣',type:'被动',icon:'⚔',desc:'单挑score+15；被动单挑触发率+15%；AI叫阵概率+15%；单挑胜利后敌方额外-10士气。（已实装）'},
    ],
    loyalty:95,
    values:['忠义','汉室死忠'],
    birthplace:'河东解县',
    relations:[{name:'刘备',type:'义兄弟',icon:'🤝'},{name:'张飞',type:'义兄弟',icon:'🤝'},{name:'张辽',type:'义友',icon:'🤝'},{name:'徐晃',type:'义友',icon:'🤝'}],
  },
  '张飞':{
    title:'万人敌',
    post:{name:'车骑将军',rank:'将',desc:'攻城猛将，攻城战力+15%，但守备管理较差，驻守时民心-2/旬。'},
    skills:[
      {name:'喝阵',type:'被动',icon:'📯',desc:'张飞在场时，接战前敌方所有squad士气-15。（已实装）'},
    ],
    loyalty:93,
    values:['忠义'],
    birthplace:'涿郡涿县',
    relations:[{name:'刘备',type:'义兄弟',icon:'🤝'},{name:'关羽',type:'义兄弟',icon:'🤝'},{name:'诸葛亮',type:'同僚',icon:'🤝'}],
  },
  '诸葛亮':{
    title:'卧龙',
    post:{name:'蜀汉丞相',rank:'文官',desc:'内政全能，所有城市产粮+8%，建筑建设速度+2旬，外交行动效果+20%。'},
    skills:[
      {name:'神算',type:'被动',icon:'🧠',desc:'当官/君主时：①伏击中伏率±10% ②劫营成功率±10% ③火攻成功率+10% ④调粮损耗减半+速度-1旬。（已实装）'},
    ],
    loyalty:99,
    values:['汉室死忠'],
    birthplace:'琅琊阳都',
    clan:'琅琊诸葛氏',
    gentry:'荆州士族',
    relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'庞统',type:'同僚',icon:'🤝'},{name:'法正',type:'同僚',icon:'🤝'},{name:'姜维',type:'弟子',icon:'📜'}],
  },
  '赵云':{
    title:'常山之龙',
    post:{name:'镇军将军',rank:'将',desc:'护卫主公，与刘备同城时刘备部队战斗力+10%。'},
    skills:[
      {name:'取将',type:'被动',icon:'⚔',desc:'被动单挑触发率+15%、单挑score+15、同队武将被俘率-20%。（已实装）'},
    ],
    loyalty:99,
    values:['忠义'],
    birthplace:'常山真定',
    faction_clan:'常山',
    relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'关羽',type:'同僚',icon:'🤝'},{name:'张飞',type:'同僚',icon:'🤝'}],
  },
  '马超':{
    title:'锦马超',
    post:{name:'骠骑将军',rank:'将',desc:'西凉骑兵统帅，骑兵部队行动力+2，征募马匹成本减半。'},
    skills:[
      {name:'锦马',type:'被动',icon:'🐎',desc:'马超为主将且主兵种为骑兵时，部队ATK+12%。（已实装）'},
    ],
    loyalty:72,
    values:[],
    birthplace:'扶风茂陵',
    clan:'扶风马氏',
    faction_clan:'凉州',
    relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'庞德',type:'旧将',icon:'⚔'}],
  },
  '黄忠':{
    title:'老当益壮',
    post:{name:'后将军',rank:'将',desc:'弓兵大师，弓兵部队战斗力+15%。'},
    skills:[
      {name:'老当',type:'被动',icon:'🏹',desc:'黄忠为主将时，每过1年ATK/DEF+1%（上限+10%），老当益壮。（已实装）'},
    ],
    loyalty:85,
    values:['忠义'],
    birthplace:'南阳宛县',
    faction_clan:'荆州',
    relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'关羽',type:'同僚',icon:'🤝'}],
  },
  '魏延':{
    title:'子午奇谋',
    post:{name:'汉中太守',rank:'将',desc:'北线主将，守卫汉中时驻防战斗力+20%。'},
    skills:[
      {name:'反骨',type:'被动',icon:'⚡',desc:'发起进攻时（野战/攻城/攻营）ATK+10%；与鸽派武将亲密度加速下降。（已实装）'},
    ],
    loyalty:78,
    values:['野心'],
    birthplace:'义阳郡',
    relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'诸葛亮',type:'上司',icon:'📜'}],
  },
  '庞统':{
    title:'凤雏',
    post:{name:'军师中郎将',rank:'文官',desc:'战略规划，每旬可为一支己方部队指定目标，战斗力+8%。'},
    skills:[
      {name:'凤雏',type:'被动',icon:'🦅',desc:'当官时，同旬连续用计，第2计起成功率+20%，后续依次叠加。（已实装）'},
    ],
    loyalty:90,
    values:[],
    birthplace:'襄阳',
    gentry:'荆州士族',
    relations:[{name:'诸葛亮',type:'同僚',icon:'🤝'},{name:'刘备',type:'主公',icon:'👑'}],
  },
  '法正':{
    title:'翼侧奇才',
    post:{name:'尚书令',rank:'文官',desc:'战时参谋，每场战斗前有20%概率发现敌方弱点，使其战斗力-10%。'},
    skills:[
      {name:'睚眦',type:'被动',icon:'🧠',desc:'被攻击时（防守方），所在部队ATK+15%。（已实装）'},
    ],
    loyalty:88,
    values:[],
    birthplace:'扶风郿县',
    faction_clan:'益州',
    relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'诸葛亮',type:'同僚',icon:'🤝'}],
  },
  '姜维':{
    title:'幼麟',
    post:{name:'蜀汉大将军',rank:'将',desc:'后期军事核心，所有野战部队补员速度+5%。'},
    skills:[],
    loyalty:92,
    values:['汉室死忠'],
    birthplace:'天水冀县',
    relations:[{name:'诸葛亮',type:'师父',icon:'📜'},{name:'刘备',type:'主公',icon:'👑'}],
  },
  '王平':{
    title:'无当飞军',
    post:{name:'镇北大将军',rank:'将',desc:'山地守备专家，山地/险关地形守卫时战斗力+20%。'},
    skills:[
      {name:'险守',type:'被动',icon:'🏔',desc:'王平所在部队，山地/丘陵/森林地形时DEF+5%。（已实装）'},
    ],
    loyalty:91,
    values:['忠义'],
    birthplace:'巴西宕渠',
    faction_clan:'巴地',
    relations:[{name:'诸葛亮',type:'上司',icon:'📜'},{name:'姜维',type:'同僚',icon:'🤝'}],
  },
  '廖化':{
    title:'蜀汉长青',
    post:{name:'右车骑将军',rank:'将',desc:'老兵统领，所辖部队自动补员速度+5%。'},
    skills:[],
    loyalty:88,
    values:['忠义'],
    birthplace:'襄阳中卢',
    relations:[{name:'诸葛亮',type:'上司',icon:'📜'},{name:'姜维',type:'同僚',icon:'🤝'}],
  },
  '马岱':{
    title:'伏波后裔',
    post:{name:'平北将军',rank:'将',desc:'骑兵奔袭，突袭战（敌军驻扎时）战斗力+10%。'},
    skills:[
      {name:'斩延',type:'被动',icon:'⚔',desc:'骑兵主将ATK×1.05。（已实装）'},
    ],
    loyalty:89,
    values:[],
    birthplace:'扶风茂陵',
    relations:[{name:'马超',type:'族弟',icon:'🏠'},{name:'诸葛亮',type:'上司',icon:'📜'}],
  },

  // ── 吴 ──
  '孙权':{
    title:'碧眼紫髯',
    post:{name:'吴大帝',rank:'王',desc:'坐拥江东，水路贸易加成+20%，港口城市金产+10%。'},
    skills:[
      {name:'坐断',type:'被动',icon:'👑',desc:'当官时江东己方城市garrison守城DEF×1.05，江东己方城市豪族+0.15/旬。（已实装）'},
    ],
    loyalty:98,
    values:[],
    birthplace:'吴郡富春',
    clan:'吴郡孙氏',
    relations:[{name:'周瑜',type:'重臣',icon:'📜'},{name:'陆逊',type:'重臣',icon:'📜'},{name:'孙策',type:'兄长',icon:'🏠'}],
  },
  '周瑜':{
    title:'美周郎',
    post:{name:'大都督',rank:'将',desc:'水军统帅，水路行军不消耗额外行动力，水战战斗力+20%。'},
    skills:[
      {name:'火神',type:'被动',icon:'🔥',desc:'周瑜在场时火攻成功率+20%，火攻伤害×1.3。（已实装）'},
    ],
    loyalty:96,
    values:[],
    birthplace:'庐江舒县',
    clan:'庐江周氏',
    gentry:'江东士族',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'孙策',type:'义兄弟',icon:'🤝'},{name:'鲁肃',type:'挚友',icon:'💛'},{name:'诸葛亮',type:'宿敌',icon:'⚔'}],
  },
  '甘宁':{
    title:'锦帆贼',
    post:{name:'折冲将军',rank:'将',desc:'水上劫掠，每旬有概率从敌方水路城市获得额外金钱。'},
    skills:[
      {name:'锦帆',type:'被动',icon:'⚓',desc:'甘宁所在部队劫营成功率+20%。（已实装）'},
    ],
    loyalty:82,
    values:['忠义'],
    birthplace:'巴郡临江',
    faction_clan:'荆州降将',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'凌统',type:'仇敌',icon:'⚔'}],
  },
  '鲁肃':{
    title:'榻上策',
    post:{name:'大都督',rank:'文官',desc:'外交主轴，每旬外交行动效果+15%，联盟持续时间+2旬。'},
    skills:[
      {name:'榻策',type:'被动',icon:'📜',desc:'当官时，送礼好感度加成+50%。（已实装）'},
    ],
    loyalty:94,
    gentry:'临淮士族',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'周瑜',type:'挚友',icon:'💛'},{name:'诸葛亮',type:'盟友',icon:'🤝'}],
  },
  '太史慈':{
    title:'信义笃烈',
    post:{name:'建昌都尉',rank:'将',desc:'镇守东线，所部弓兵适性提升一级（B→A, A→S）。'},
    skills:[
      {name:'信义',type:'被动',icon:'🏹',desc:'单挑score+10，胜利后敌方士气-10。（已实装）'},
    ],
    loyalty:88,
    values:['忠义'],
    birthplace:'东莱黄县',
    faction_clan:'青州',
    relations:[{name:'孙策',type:'义友',icon:'🤝'},{name:'孙权',type:'主公',icon:'👑'}],
  },
  '吕蒙':{
    title:'白衣渡江',
    post:{name:'大都督',rank:'将',desc:'荆州战略规划者，攻取荆州系城市战斗力+15%。'},
    skills:[
      {name:'攻心',type:'被动',icon:'🎭',desc:'吕蒙围城时，该城豪族支持每旬额外-3，加速促成献城。（已实装）'},
    ],
    loyalty:92,
    values:['忠义'],
    birthplace:'汝南富陂',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'陆逊',type:'同僚',icon:'🤝'},{name:'周瑜',type:'前任',icon:'📜'}],
  },
  '陆逊':{
    title:'书生大将',
    post:{name:'吴国丞相',rank:'文官',desc:'内政与军事兼顾，城市建设速度+1旬，防守战战斗力+15%。'},
    skills:[
      {name:'火营',type:'被动',icon:'🔥',desc:'陆逊在攻方时，攻营战守方DEF加成削弱（1.10→1.00），守方士气-5。（已实装）'},
    ],
    loyalty:90,
    values:[],
    birthplace:'吴郡吴县',
    clan:'吴郡陆氏',
    gentry:'江东士族',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'吕蒙',type:'前任',icon:'📜'},{name:'周瑜',type:'前辈',icon:'📜'}],
  },
  '黄盖':{
    title:'苦肉忠臣',
    post:{name:'武锋中郎将',rank:'将',desc:'三朝老将，所在城市守军自然补员+5%/旬。'},
    skills:[
      {name:'苦肉',type:'被动',icon:'🎭',desc:'squad兵力低于70%时ATK×1.10。（已实装）'},
    ],
    loyalty:93,
    values:['忠义'],
    birthplace:'零陵泉陵',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'孙策',type:'旧主',icon:'👑'},{name:'周瑜',type:'同僚',icon:'🤝'}],
  },
  '凌统':{
    title:'护主悍将',
    post:{name:'荡寇中郎将',rank:'将',desc:'步兵突击手，进攻时轻步兵战斗力+10%。'},
    skills:[],
    loyalty:85,
    values:['忠义'],
    birthplace:'吴郡余杭',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'甘宁',type:'仇敌',icon:'⚔'}],
  },
  '丁奉':{
    title:'雪中短兵',
    post:{name:'吴国大将军',rank:'将',desc:'后期支柱，所辖骑兵部队行动力+1。'},
    skills:[
      {name:'短兵',type:'被动',icon:'❄',desc:'冬季ATK/DEF×1.10。（已实装）'},
    ],
    loyalty:90,
    values:['忠义'],
    birthplace:'庐江安丰',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'陆逊',type:'上司',icon:'📜'}],
  },
  '程普':{
    title:'三朝虎臣',
    post:{name:'荡寇将军',rank:'将',desc:'三朝元老，带兵稳健，行军时不会因粮草不足而溃散。'},
    skills:[
      {name:'虎臣',type:'被动',icon:'🐯',desc:'江东城市作战ATK/DEF×1.10。（已实装）'},
    ],
    loyalty:90,
    relations:[{name:'孙策',type:'旧主',icon:'👑'},{name:'孙权',type:'主公',icon:'👑'},{name:'周瑜',type:'同僚',icon:'🤝'}],
  },
  '孙策':{
    title:'小霸王',
    post:{name:'讨逆将军',rank:'将',desc:'霸主气概，攻城时全军士气+10，每旬行军多移动半格。'},
    skills:[],
    loyalty:99,
    values:['忠义'],
    birthplace:'吴郡富春',
    clan:'吴郡孙氏',
    relations:[{name:'孙权',type:'兄弟',icon:'🏠'},{name:'周瑜',type:'义兄弟',icon:'🤝'},{name:'太史慈',type:'义友',icon:'🤝'}],
  },
  '朱然':{
    title:'坚城名将',
    post:{name:'左大司马',rank:'将',desc:'水陆两用，水战和陆战均无地形惩罚。'},
    skills:[],
    loyalty:91,
    values:['忠义'],
    birthplace:'丹阳故鄣',
    clan:'丹阳朱氏',
    gentry:'江东士族',
    relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'陆逊',type:'同僚',icon:'🤝'}],
  },



  // ── 二线武将元数据 ──
  '满宠' :{title:'坚壁老将', post:{name:'扬州刺史',rank:'将',desc:'镇守东线，驻守城池防御+12%。'},skills:[{name:'坚壁',type:'被动',icon:'🏯',desc:'守城时被围城耐久消耗速度减慢30%。（已实装）'}],loyalty:82,values:['忠义'],birthplace:'山阳昌邑',clan:'兖州满氏',faction_clan:'兖州',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '钟繇' :{title:'楷书鼻祖',       post:{name:'太傅',rank:'文官',desc:'顶级文官，所在城市金产+20%，民心回复+0.5/旬。'},skills:[{name:'楷范',type:'被动',icon:'📜',desc:'当官时势力信誉+0.15/旬。（已实装）'}],loyalty:88,values:[],birthplace:'颍川长社',clan:'颍川钟氏',gentry:'颍川士族',faction_clan:'颍川',relations:[{name:'荀彧',type:'同乡',icon:'🏠'},{name:'曹操',type:'主公',icon:'👑'}]},
  '王朗' :{title:'经学大儒',       post:{name:'司徒',rank:'文官',desc:'主掌民政，城市叛乱概率-25%。'},skills:[{name:'经义',type:'被动',icon:'📜',desc:'当官时全城民心+0.15/旬；对战部队有诸葛亮时自squad士气-20。（已实装）'}],loyalty:80,values:[],birthplace:'东海郯县',clan:'东海王氏',gentry:'东海士族',faction_clan:'中原',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '曹洪' :{title:'曹氏骏驹',   post:{name:'骠骑将军',rank:'将',desc:'宗亲武将，招募骑兵费用-10%。'},skills:[{name:'舍命',type:'被动',icon:'🛡',desc:'曹操同部队时全队DEF+10%。（已实装）'}],loyalty:95,values:['忠义'],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'宗族',icon:'🏠'},{name:'夏侯惇',type:'同族',icon:'🏠'}]},
  '郭淮' :{title:'西境守望',   post:{name:'征西将军',rank:'将',desc:'西线守将，山地地形战力+10%。'},skills:[{name:'西境',type:'被动',icon:'🏔',desc:'主将时山地/丘陵DEF×1.12。（已实装）'}],loyalty:85,values:[],birthplace:'太原阳曲',clan:'太原郭氏',faction_clan:'中原',relations:[{name:'张郃',type:'同僚',icon:'🤝'},{name:'夏侯渊',type:'主将',icon:'👑'},{name:'曹操',type:'主公',icon:'👑'}]},
  '李典' :{title:'儒侠将军',   post:{name:'破虏将军',rank:'将',desc:'儒将型将领，所辖部队行军不扰民，途经城市民心不降。'},skills:[{name:'协阵',type:'被动',icon:'📚',desc:'同部队有张辽/乐进时，每人李典squad ATK/DEF+5%。（已实装）'}],loyalty:82,values:['忠义'],birthplace:'山阳钜野',clan:'山阳李氏',faction_clan:'兖州',relations:[{name:'张辽',type:'同僚',icon:'🤝'},{name:'乐进',type:'同僚',icon:'🤝'},{name:'曹操',type:'主公',icon:'👑'}]},
  '臧霸' :{title:'青徐豪雄',   post:{name:'执金吾',rank:'将',desc:'青徐守将，驻守徐州系城市时防御+10%。'},skills:[{name:'啸聚',type:'被动',icon:'🏴',desc:'所在squad最近己方城市∈青徐时补员×2。（已实装）'}],loyalty:72,values:[],birthplace:'泰山华县',clan:'泰山臧氏',faction_clan:'青徐',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '蒋济' :{title:'庙堂谋臣',   post:{name:'太尉',rank:'文官',desc:'善析敌情，战前情报准确率+15%。'},skills:[],loyalty:84,values:[],birthplace:'楚国平阿',clan:'楚国蒋氏',faction_clan:'中原',relations:[{name:'曹操',type:'主公',icon:'👑'},{name:'司马懿',type:'同僚',icon:'🤝'}]},
  '刘晔' :{title:'佐世之才',   post:{name:'太中大夫',rank:'文官',desc:'善造攻城器械，攻城部队攻城效率+12%。'},skills:[{name:'巧思',type:'被动',icon:'⚙',desc:'当官时己方围城消耗+10%，攻城ATK+5%。（已实装）'}],loyalty:80,values:[],birthplace:'淮南成德',clan:'淮南刘氏',faction_clan:'中原',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '牛金' :{title:'南郡虎将',   post:{name:'后将军',rank:'将',desc:'冲锋型将领，野战首轮战力+8%。'},skills:[],loyalty:88,values:['忠义'],birthplace:'未详',faction_clan:'谯沛',relations:[{name:'曹仁',type:'主将',icon:'👑'}]},
  '朱灵' :{title:'铁壁先锋',   post:{name:'后将军',rank:'将',desc:'中坚战将，所部重步兵防御+8%。'},skills:[],loyalty:75,values:[],birthplace:'清河鄃县',clan:'清河朱氏',faction_clan:'冀州',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '陈群' :{title:'九品宗师',   post:{name:'司空',rank:'文官',desc:'内政大才，所在势力每旬金产+10%，武将征辟效率+20%。'},skills:[{name:'九品',type:'被动',icon:'📋',desc:'当官时，全体招募（劝降/在野/挖角）成功率+5%。（已实装）'}],loyalty:86,values:[],birthplace:'颍川许昌',clan:'颍川陈氏',gentry:'颍川士族',faction_clan:'颍川',relations:[{name:'荀彧',type:'同乡',icon:'🏠'},{name:'曹操',type:'主公',icon:'👑'},{name:'司马懿',type:'同僚',icon:'🤝'}]},
  // ── 魏v124新增 ──
  '曹真' :{title:'伐蜀主帅',post:{name:'大将军',rank:'将',desc:'宗室统帅，守备战略要地。'},skills:[{name:'缓进',type:'被动',icon:'🛡',desc:'在围城部队中时，城防衰减速度+20%。（已实装）'}],loyalty:92,values:['忠义'],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'养父',icon:'👑'},{name:'曹休',type:'宗族',icon:'🏠'},{name:'司马懿',type:'同僚',icon:'🤝'}]},
  '曹彰' :{title:'黄须儿',post:{name:'征北将军',rank:'将',desc:'武勇无双的曹氏猛将。'},skills:[{name:'黄须',type:'被动',icon:'⚔',desc:'主将骑兵非攻城时ATK/DEF×1.05。（已实装）'}],loyalty:90,values:[],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'父',icon:'👑'},{name:'曹仁',type:'宗族',icon:'🏠'}]},
  '华歆' :{title:'逼宫司徒',post:{name:'司徒',rank:'文官',desc:'政务干练，城市金产+8%。'},skills:[{name:'逼宫',type:'被动',icon:'👁',desc:'当官时称帝门槛降低（城市8/信誉30）。（已实装）'}],loyalty:80,values:[],birthplace:'平原高唐',clan:'高唐华氏',gentry:'冀州士族',faction_clan:'冀州',relations:[{name:'曹操',type:'主公',icon:'👑'},{name:'王朗',type:'同僚',icon:'🤝'}]},
  '张绣' :{title:'北地枪王',post:{name:'破虏将军',rank:'将',desc:'宛城降将，骑兵突击型。'},skills:[],loyalty:55,values:['投机'],birthplace:'武威祖厉',clan:'武威张氏',faction_clan:'凉州',relations:[{name:'贾诩',type:'谋主',icon:'🧠'},{name:'曹操',type:'主公',icon:'👑'}]},
  '曹休' :{title:'千里驹',post:{name:'征东大将军',rank:'将',desc:'宗室统帅，擅长指挥大军团作战。'},skills:[{name:'千里驹',type:'被动',icon:'🏇',desc:'骑兵主将时AP+1。（已实装）'}],loyalty:90,values:['忠义'],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'族父',icon:'👑'},{name:'曹真',type:'宗族',icon:'🏠'}]},
  // ── 魏v128新增 ──
  '徐庶' :{title:'颍川名士',post:{name:'右中郎将',rank:'文官',desc:'身在曹营心在汉，识人极准。'},skills:[{name:'识才',type:'被动',icon:'🧠',desc:'当官时招募在野武将成功率+10%。（已实装）'}],loyalty:55,values:['忠义'],birthplace:'颍川',clan:'颍川徐氏',gentry:'颍川士族',faction_clan:'颍川',relations:[{name:'诸葛亮',type:'挚友',icon:'🤝'},{name:'庞统',type:'同窗',icon:'📚'}]},
  // ── 魏v143新增 ──
  '曹纯' :{title:'虎豹骑督',post:{name:'虎豹骑督',rank:'将',desc:'统率曹操精锐虎豹骑，骑兵战力冠绝天下。'},skills:[],loyalty:92,values:['忠义'],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'族弟',icon:'🏠'}]},
  '毛玠' :{title:'清廉选才',post:{name:'东曹掾',rank:'文官',desc:'主管选拔人才，为曹操推行唯才是举。'},skills:[],loyalty:80,values:['忠义'],birthplace:'陈留平丘',clan:'陈留毛氏',gentry:'中原士族',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '董昭' :{title:'迁都谋臣',post:{name:'将作大匠',rank:'文官',desc:'策划迁都许昌，善谋大略。'},skills:[],loyalty:75,values:[],birthplace:'济阴定陶',clan:'济阴董氏',gentry:'中原士族',relations:[{name:'曹操',type:'主公',icon:'👑'}]},
  '曹丕' :{title:'魏文帝',post:{name:'五官中郎将',rank:'文官',desc:'曹操继承人，文武兼备，善诗赋。'},skills:[],loyalty:95,values:['野心'],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'父',icon:'👑'},{name:'曹植',type:'兄弟',icon:'🏠'},{name:'司马懿',type:'近臣',icon:'🤝'}]},
  '曹植' :{title:'七步成诗',post:{name:'临淄侯',rank:'文官',desc:'才高八斗，以文采名动天下。'},skills:[],loyalty:82,values:[],birthplace:'沛国谯县',clan:'谯县曹氏',faction_clan:'谯沛',relations:[{name:'曹操',type:'父',icon:'👑'},{name:'曹丕',type:'兄弟',icon:'🏠'}]},
  '郭女王':{title:'曹丕贤内',post:{name:'贵嫔',rank:'文官',desc:'善察人心，宫廷政治手腕高超。'},skills:[],loyalty:88,values:[],birthplace:'安平广宗',clan:'安平郭氏',gentry:'中原士族',relations:[{name:'曹丕',type:'夫君',icon:'🏠'}]},
  '文聘' :{title:'荆州柱石',post:{name:'守将',rank:'将',desc:'长于守备，驻守城市防御加成+15%。'},skills:[{name:'镇荆',type:'被动',icon:'🏰',desc:'荆州城市守城时DEF×1.20。（已实装）'}],loyalty:75,values:['忠义'],birthplace:'南阳',clan:'南阳文氏',relations:[]},
  '王平' :{title:'无当飞军',post:{name:'镇北大将军',rank:'将',desc:'出身寒门，治军严谨，善用无当飞军。'},skills:[{name:'险守',type:'被动',icon:'🏔',desc:'山地/丘陵守方有王平时DEF×1.10。（已实装）'}],loyalty:78,values:['忠义'],birthplace:'巴西宕渠',clan:'',relations:[{name:'诸葛亮',type:'恩主',icon:'👑'},{name:'马谡',type:'同僚',icon:'🤝'}]},
  // ── v143 B类魏 ──
  '司马昭':{title:'路人皆知',post:{name:'大将军',rank:'文官',desc:'司马懿之子，权倾朝野。'},skills:[],loyalty:88,values:['野心'],birthplace:'河内温县',clan:'河内司马氏',gentry:'中原士族',relations:[{name:'司马懿',type:'父',icon:'👑'}]},
  '陈泰' :{title:'抗蜀名将',post:{name:'征西将军',rank:'将',desc:'陈群之子，善于防守反击。'},skills:[],loyalty:82,values:['忠义'],birthplace:'颍川许昌',clan:'颍川陈氏',gentry:'中原士族',relations:[{name:'陈群',type:'父',icon:'🏠'}]},
  '王基' :{title:'笃行之士',post:{name:'征南将军',rank:'将',desc:'文武兼备，治军严明。'},skills:[],loyalty:85,values:['忠义'],birthplace:'东莱曲城',clan:'',relations:[]},

  // ── 蜀二线武将元数据 ──
  '董允' :{title:'秉公侍中',       post:{name:'侍中',rank:'文官',desc:'清廉持正，所在城市叛乱概率-30%，民心+0.4/旬。'},skills:[{name:'秉公',type:'被动',icon:'⚖',desc:'当官/君主时，武将属性经验成长×1.20。（已实装）'}],loyalty:92,values:['忠义'],birthplace:'南郡枝江',clan:'荆州董氏',faction_clan:'荆州',relations:[{name:'诸葛亮',type:'恩主',icon:'👑'},{name:'费祎',type:'同僚',icon:'🤝'}]},
  '张翼' :{title:'犍为铁壁', post:{name:'左车骑将军',rank:'将',desc:'守城型良将，驻守城市防御加成+10%。'},skills:[],loyalty:80,values:['忠义'],birthplace:'犍为武阳',clan:'益州张氏',faction_clan:'东州',relations:[{name:'诸葛亮',type:'部属',icon:'📜'}]},
  '吴懿' :{title:'东州皇亲',   post:{name:'车骑将军',rank:'将',desc:'皇亲武将，招募部队金钱消耗-8%。'},skills:[],loyalty:85,values:[],birthplace:'陈留',clan:'荆州吴氏',faction_clan:'东州',relations:[{name:'刘备',type:'国舅',icon:'👑'}]},
  '马忠' :{title:'南中柱石', post:{name:'镇南大将军',rank:'将',desc:'南中平叛专家，平叛行动效率+20%。'},skills:[],loyalty:88,values:['忠义'],birthplace:'巴西阆中',clan:'益州马氏',faction_clan:'益州',relations:[{name:'诸葛亮',type:'部属',icon:'📜'}]},
  '霍峻' :{title:'孤城不屈',   post:{name:'梓潼太守',rank:'将',desc:'守城专家，驻守时兵力损耗减少15%。'},skills:[{name:'葭萌',type:'被动',icon:'🏯',desc:'garrison状态时ATK/DEF×1.05。（已实装）'}],loyalty:90,values:['忠义'],birthplace:'南郡枝江',clan:'荆州霍氏',faction_clan:'荆州',relations:[{name:'刘备',type:'主公',icon:'👑'}]},
  '黄权' :{title:'持节巴臣',   post:{name:'车骑将军',rank:'文官',desc:'善析大势，战前敌方部署信息可见范围+1格。'},skills:[{name:'持节',type:'被动',icon:'📜',desc:'被俘后劝降概率-20%，被挖角概率-20%。（已实装）'}],loyalty:82,values:['忠义'],birthplace:'巴西阆中',clan:'巴西黄氏',faction_clan:'益州',relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'诸葛亮',type:'同僚',icon:'🤝'}]},
  '邓芝' :{title:'使吴良臣',   post:{name:'车骑将军',rank:'文官',desc:'外交使臣，出使任务友好度加成+12%。'},skills:[{name:'使吴',type:'被动',icon:'🤝',desc:'当官时，议和/结盟成功率+5%。（已实装）'}],loyalty:86,values:['忠义'],birthplace:'义阳新野',clan:'南阳邓氏',faction_clan:'荆州',relations:[{name:'诸葛亮',type:'上司',icon:'📜'}]},
  '严颜' :{title:'断头将军',   post:{name:'前将军',rank:'将',desc:'老将不屈，守城时士气不低于45。'},skills:[],loyalty:78,values:['忠义'],birthplace:'巴郡临江',clan:'巴郡严氏',faction_clan:'益州',relations:[{name:'张飞',type:'义友',icon:'🤝'},{name:'刘备',type:'主公',icon:'👑'}]},
  // ── 蜀v124新增 ──
  '关平' :{title:'忠孝随父',post:{name:'校尉',rank:'将',desc:'关羽之子，随父征战。'},skills:[{name:'孝义',type:'被动',icon:'🤝',desc:'与关羽同部队时，关平squad士气+5、ATK+5%。（已实装）'}],loyalty:95,values:['忠义'],birthplace:'河东解良',clan:'河东关氏',faction_clan:'荆州',relations:[{name:'关羽',type:'父',icon:'👑'},{name:'关兴',type:'兄弟',icon:'🏠'},{name:'刘备',type:'主公',icon:'👑'}]},
  '关兴' :{title:'小关张',post:{name:'侍中',rank:'将',desc:'继承父志的二代骁将。'},skills:[{name:'过关',type:'被动',icon:'⚔',desc:'单挑触发率+5%、score+5（小关羽）。（已实装）'}],loyalty:92,values:['忠义'],birthplace:'河东解良',clan:'河东关氏',faction_clan:'荆州',relations:[{name:'关羽',type:'父',icon:'👑'},{name:'关平',type:'兄弟',icon:'🏠'},{name:'张苞',type:'义兄弟',icon:'🤝'}]},
  '张苞' :{title:'猛虎之子',post:{name:'校尉',rank:'将',desc:'张飞之子，武勇过人。'},skills:[{name:'喝阵',type:'被动',icon:'📣',desc:'开战时敌方全体士气-5（小张飞）。（已实装）'}],loyalty:90,values:['忠义'],birthplace:'涿郡涿县',clan:'涿郡张氏',faction_clan:'元从',relations:[{name:'张飞',type:'父',icon:'👑'},{name:'关兴',type:'义兄弟',icon:'🤝'}]},
  '刘封' :{title:'刚猛养子',post:{name:'安东将军',rank:'将',desc:'刘备养子，武艺出众但性情刚烈。'},skills:[{name:'刚愎',type:'被动',icon:'⚡',desc:'单squad unit时ATK/DEF×1.08，忠诚每旬-0.1。（已实装）'}],loyalty:60,values:['野心'],birthplace:'长沙罗侯',faction_clan:'元从',relations:[{name:'刘备',type:'养父',icon:'👑'},{name:'孟达',type:'同僚',icon:'🤝'}]},
  '吴班' :{title:'外戚柱石',post:{name:'骠骑将军',rank:'将',desc:'吴懿族弟，可靠的中坚力量。'},skills:[],loyalty:85,values:['忠义'],birthplace:'陈留圉县',clan:'陈留吴氏',faction_clan:'外戚',relations:[{name:'吴懿',type:'族兄',icon:'🏠'},{name:'刘备',type:'主公',icon:'👑'}]},
  // ── 蜀v128新增 ──
  '马谡' :{title:'越嶲太守',post:{name:'参军',rank:'文官',desc:'熟读兵书，言过其实。'},skills:[],loyalty:75,values:[],birthplace:'荆州宜城',clan:'荆州马氏',gentry:'荆州士族',faction_clan:'荆州',relations:[{name:'诸葛亮',type:'恩主',icon:'👑'},{name:'王平',type:'同僚',icon:'🤝'}]},
  '向宠' :{title:'中领军',post:{name:'中领军',rank:'将',desc:'出师表点名推荐，公允持平。'},skills:[],loyalty:85,values:['忠义'],birthplace:'荆州宜城',clan:'荆州向氏',faction_clan:'荆州',relations:[]},
  // ── 蜀v143新增 ──
  '糜竺' :{title:'安汉将军',post:{name:'安汉将军',rank:'文官',desc:'倾家资助刘备起兵，忠心不二。'},skills:[],loyalty:95,values:['忠义'],birthplace:'东海朐县',clan:'东海糜氏',relations:[{name:'刘备',type:'主公',icon:'👑'},{name:'糜芳',type:'兄弟',icon:'🏠'}]},
  '糜芳' :{title:'南郡太守',post:{name:'南郡太守',rank:'将',desc:'糜竺之弟，守荆州不力，性情摇摆。'},skills:[],loyalty:40,values:['投机'],birthplace:'东海朐县',clan:'东海糜氏',relations:[{name:'糜竺',type:'兄弟',icon:'🏠'},{name:'关羽',type:'上司',icon:'👑'}]},
  '孙乾' :{title:'从事中郎',post:{name:'从事中郎',rank:'文官',desc:'刘备元老，善外交斡旋。'},skills:[],loyalty:88,values:['忠义'],birthplace:'北海',clan:'',relations:[{name:'刘备',type:'主公',icon:'👑'}]},
  '简雍' :{title:'说降辩士',post:{name:'昭德将军',rank:'文官',desc:'最早追随刘备，以辩才著称，说降刘璋。'},skills:[],loyalty:85,values:['忠义'],birthplace:'涿郡涿县',clan:'',relations:[{name:'刘备',type:'主公/挚友',icon:'👑'}]},
  // ── 蜀v143 B类 ──
  '夏侯霸':{title:'降蜀宗亲',post:{name:'车骑将军',rank:'将',desc:'夏侯渊之子，因司马氏篡权而降蜀。'},skills:[],loyalty:72,values:[],birthplace:'沛国谯县',clan:'谯县夏侯氏',relations:[{name:'夏侯渊',type:'父',icon:'🏠'}]},

  // ── 吴二线武将元数据 ──
  '张昭' :{title:'江东柱石',   post:{name:'辅吴将军',rank:'文官',desc:'江东第一文官，所在城市金产+22%，民心+0.5/旬。'},skills:[{name:'柱石',type:'被动',icon:'📜',desc:'当官/君主时，势力金产+3%。（已实装）'}],loyalty:85,values:[],birthplace:'彭城',clan:'彭城张氏',gentry:'江东士族',faction_clan:'流寓',relations:[{name:'孙权',type:'元老',icon:'👑'},{name:'孙策',type:'旧主',icon:'👑'}]},
  '诸葛瑾':{title:'联盟使者',    post:{name:'大将军',rank:'文官',desc:'文武兼备，外交行动好感加成+10%。'},skills:[{name:'缓颊',type:'被动',icon:'☮',desc:'当官时所有外交行为好感flat+5。（已实装）'}],loyalty:88,values:[],birthplace:'琅邪阳都',clan:'琅琊诸葛氏',gentry:'琅琊士族',faction_clan:'流寓',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'诸葛亮',type:'兄弟',icon:'🤝'}]},
  '韩当' :{title:'三朝宿将',   post:{name:'昭武将军',rank:'将',desc:'孙坚旧部，麾下部队士气上限+5。'},skills:[{name:'从征',type:'被动',icon:'⚔',desc:'每胜一仗ATK/DEF+0.5%（上限5%）。（已实装）'}],loyalty:92,values:['忠义'],birthplace:'辽西令支',clan:'辽西韩氏',faction_clan:'淮泗',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'程普',type:'旧友',icon:'🤝'}]},
  '徐盛' :{title:'疑城退敌',   post:{name:'安东将军',rank:'将',desc:'守城能将，攻城战守方战力+10%。'},skills:[{name:'疑城',type:'被动',icon:'🏯',desc:'守城战时攻城方ATK-5%。（已实装）'}],loyalty:85,values:['忠义'],birthplace:'琅邪莒县',clan:'琅邪徐氏',faction_clan:'淮泗',relations:[{name:'孙权',type:'主公',icon:'👑'}]},
  '潘璋' :{title:'夺刀悍将',   post:{name:'振威将军',rank:'将',desc:'进攻型勇将，野战首回合战力+8%。'},skills:[{name:'擒将',type:'被动',icon:'⚡',desc:'所在部队击败敌军后俘获概率+20%。（已实装）'}],loyalty:80,values:[],birthplace:'东郡发干',clan:'兖州潘氏',faction_clan:'淮泗',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'凌统',type:'仇人',icon:'⚔'}]},
  '贺齐' :{title:'山越克星',   post:{name:'后将军',rank:'将',desc:'山越克星，丘陵/山地战力+12%。'},skills:[{name:'平越',type:'被动',icon:'⚡',desc:'山地/森林战斗时敌方士气-5。（已实装）'}],loyalty:84,values:['忠义'],birthplace:'会稽山阴',clan:'会稽贺氏',faction_clan:'江东',relations:[{name:'孙权',type:'主公',icon:'👑'}]},
  '顾雍' :{title:'寡言丞相',   post:{name:'吴国丞相',rank:'文官',desc:'治国之才，所在势力城市民心+0.5/旬，金产+8%。'},skills:[],loyalty:90,values:[],birthplace:'吴郡吴县',clan:'吴郡顾氏',gentry:'江东士族',faction_clan:'江东',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'张昭',type:'同僚',icon:'🤝'}]},
  '步骘' :{title:'南疆安石',   post:{name:'骠骑将军',rank:'文官',desc:'南疆治理者，交州城市产出+15%。'},skills:[{name:'安南',type:'被动',icon:'🌏',desc:'当官时南方城市(row≥50)叛乱阈值下调5点。（已实装）'}],loyalty:86,values:[],birthplace:'临淮淮阴',clan:'临淮步氏',gentry:'江东士族',faction_clan:'流寓',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'诸葛瑾',type:'同僚',icon:'🤝'}]},
  // ── 吴v124新增 ──
  '周泰' :{title:'以命护主',post:{name:'奋威将军',rank:'将',desc:'孙权贴身护卫，忠勇无双。'},skills:[{name:'护主',type:'被动',icon:'🛡',desc:'孙权同部队时全队DEF×1.10，孙权免疫被俘。（已实装）'}],loyalty:95,values:['忠义'],birthplace:'九江下蔡',clan:'下蔡周氏',faction_clan:'淮泗',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'孙策',type:'旧主',icon:'👑'},{name:'蒋钦',type:'同僚',icon:'🤝'}]},
  '蒋钦' :{title:'公正宿将',post:{name:'荡寇将军',rank:'将',desc:'早期宿将，治军严整。'},skills:[{name:'严整',type:'被动',icon:'⚖',desc:'被伏击时士气惩罚减半。（已实装）'}],loyalty:88,values:['忠义'],birthplace:'九江寿春',clan:'寿春蒋氏',faction_clan:'淮泗',relations:[{name:'孙权',type:'主公',icon:'👑'},{name:'周泰',type:'同僚',icon:'🤝'},{name:'徐盛',type:'旧怨→推荐',icon:'🤝'}]},
  '全琮' :{title:'石亭功臣',post:{name:'右大司马',rank:'将',desc:'孙权女婿，善于指挥大规模作战。'},skills:[{name:'合围',type:'被动',icon:'⚔',desc:'己方参战units≥2时，全琮unit ATK×1.05。（已实装）'}],loyalty:82,values:[],birthplace:'吴郡钱唐',clan:'钱唐全氏',gentry:'江东士族',faction_clan:'江东',relations:[{name:'孙权',type:'女婿',icon:'👑'},{name:'陆逊',type:'同僚',icon:'🤝'}]},
  '陆抗' :{title:'末代名将',post:{name:'大都督',rank:'将',desc:'吴国最后的栋梁，文武兼备。'},skills:[],loyalty:92,values:['忠义'],birthplace:'吴郡吴县',clan:'吴郡陆氏',gentry:'江东士族',faction_clan:'江东',relations:[{name:'陆逊',type:'父',icon:'👑'},{name:'孙权',type:'主公',icon:'👑'}]},
  '吕范' :{title:'元从干才',post:{name:'大司马',rank:'文官',desc:'文武全才的创业元老，善理财务。'},skills:[],loyalty:90,values:['忠义'],birthplace:'汝南细阳',clan:'细阳吕氏',faction_clan:'淮泗',relations:[{name:'孙策',type:'旧主',icon:'👑'},{name:'孙权',type:'主公',icon:'👑'}]},
  // ── 吴v143新增 ──
  '朱桓' :{title:'濡须虎将',post:{name:'前将军',rank:'将',desc:'性烈如火，濡须之战大破曹仁。'},skills:[],loyalty:82,values:['忠义'],birthplace:'吴郡吴县',clan:'吴郡朱氏',gentry:'江东士族',relations:[{name:'孙权',type:'主公',icon:'👑'}]},
  '骆统' :{title:'忠谏重臣',post:{name:'偏将军',rank:'文官',desc:'文武兼备，善内政，直言进谏。'},skills:[],loyalty:85,values:['忠义'],birthplace:'会稽乌伤',clan:'会稽骆氏',gentry:'江东士族',relations:[{name:'孙权',type:'主公',icon:'👑'}]},
  '吕据' :{title:'吕范之嗣',post:{name:'骠骑将军',rank:'将',desc:'吕范之子，承父业征战。'},skills:[],loyalty:78,values:[],birthplace:'汝南细阳',clan:'细阳吕氏',relations:[{name:'吕范',type:'父',icon:'🏠'},{name:'孙权',type:'主公',icon:'👑'}]},
  '留赞' :{title:'后期勇将',post:{name:'左将军',rank:'将',desc:'勇猛善战，晚年仍奋勇杀敌。'},skills:[],loyalty:80,values:['忠义'],birthplace:'会稽长山',clan:'',relations:[]},
  '孙尚香':{title:'弓腰姬',post:{name:'公主',rank:'将',desc:'孙权之妹，嫁刘备后回吴，武艺不凡。'},skills:[],loyalty:85,values:[],birthplace:'吴郡富春',clan:'富春孙氏',faction_clan:'孙氏',relations:[{name:'孙权',type:'兄长',icon:'🏠'},{name:'刘备',type:'前夫',icon:'⚔'}]},
  // ── 吴v143 B类 ──
  '诸葛恪':{title:'东兴大捷',post:{name:'大将军',rank:'将',desc:'诸葛瑾之子，少年成名，东兴之战大破魏军。'},skills:[],loyalty:78,values:['野心'],birthplace:'琅琊阳都',clan:'琅琊诸葛氏',gentry:'中原士族',relations:[{name:'诸葛瑾',type:'父',icon:'🏠'},{name:'孙权',type:'主公',icon:'👑'}]},
  '施绩' :{title:'朱然之嗣',post:{name:'上大将军',rank:'将',desc:'朱然之子，改姓施，继父业镇守边疆。'},skills:[],loyalty:80,values:['忠义'],birthplace:'丹阳故鄣',clan:'',relations:[{name:'朱然',type:'父',icon:'🏠'}]},

  // ── ★ v144 南蛮 ──
  '孟获' :{title:'南蛮王',post:{name:'蛮王',rank:'王',desc:'南中蛮族首领，勇猛善战，统领南中诸蛮部族。'},skills:[],loyalty:95,values:['蛮勇'],birthplace:'建宁',clan:'南蛮孟氏',relations:[{name:'祝融',type:'妻',icon:'❤'}]},
  '祝融' :{title:'烈焰夫人',post:{name:'蛮将',rank:'将',desc:'孟获之妻，善使飞刀，擅长火攻，勇悍不让须眉。'},skills:[],loyalty:95,values:['蛮勇'],birthplace:'建宁',clan:'南蛮祝氏',relations:[{name:'孟获',type:'夫',icon:'❤'}]},

};



// ─── 全将领扁平列表（预计算，替代28处 Object.values(GENS_FULL).flat()）───
const ALL_GENS = [...Object.values(GENS_FULL).flat(), ...WILD_GENS];


// ★ v126: 非活跃武将库（当前剧本不参战，保留数据供未来剧本/关系查询）
const GEN_POOL_INACTIVE = [
  {name:'孙策', com:92,war:94,int:80,pol:72,cha:90, apt:{cavalry:'A',light:'S',heavy:'B',archer:'B',siege:'B',naval:'B'}, era:{birth:175,death:200}, note:'小霸王，200年遇刺身亡'},
  {name:'典韦', com:70,war:100,int:38,pol:35,cha:52,apt:{cavalry:'C',light:'S',heavy:'A',archer:'C',siege:'C',naval:'C'}, era:{birth:0,death:197}, note:'恶来，197年宛城战死护主'},
  {name:'陆抗', com:88,war:78,int:90,pol:82,cha:80, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'A',naval:'A'}, era:{birth:226,death:274}, note:'陆逊之子，214年未出生'},
  // ── v143: 从在野/势力移入 ──
  {name:'太史慈',com:88,war:95,int:66,pol:58,cha:74,apt:{cavalry:'B',light:'S',heavy:'B',archer:'A',siege:'C',naval:'B'}, era:{birth:166,death:206}, note:'东莱猛将，206年病逝'},
  {name:'陈宫',  com:82,war:58,int:92,pol:78,cha:76, apt:{cavalry:'B',light:'B',heavy:'B',archer:'A',siege:'A',naval:'C'}, era:{birth:0,death:198}, note:'198年吕布败亡时被杀'},
  {name:'田丰',  com:80,war:55,int:94,pol:88,cha:74, apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'A',naval:'C'}, era:{birth:0,death:200}, note:'200年官渡后被袁绍所杀'},
  {name:'沮授',  com:78,war:50,int:92,pol:85,cha:72, apt:{cavalry:'C',light:'B',heavy:'B',archer:'B',siege:'A',naval:'C'}, era:{birth:0,death:200}, note:'200年官渡被俘不降而死'},
  {name:'高顺',  com:82,war:88,int:68,pol:55,cha:62, apt:{cavalry:'B',light:'S',heavy:'A',archer:'C',siege:'B',naval:'C'}, era:{birth:0,death:198}, note:'陷阵营统领，198年吕布败亡时被杀'},
];

// ── range B: section header + FOUNDING_CORE + GEN_CLASS + CLASS_META (原 L1974-L2050, 77 行) ──
// ═══════════════════════════════════════════════════════
// B1 武将标签 & 派系政治系统
// ═══════════════════════════════════════════════════════

/** 核心创始成员白名单（每势力5-8人，开局即显示为"创始团队"）
 *  其余开局武将为 'member'（老臣/同僚），按origin/home正常分派系
 */
const FOUNDING_CORE = {
  wei: new Set(['曹操','夏侯惇','夏侯渊','曹仁','曹洪','许褚']),
  shu: new Set(['刘备','关羽','张飞','赵云']),
  wu:  new Set(['孙权','周瑜','程普','黄盖']),
  nanman: new Set(['孟获','祝融']),
};


// ★ v167: 武将四类系统 — warrior(武将)/commander(统帅)/strategist(谋士)/minister(能臣)
const GEN_CLASS = {
  // ── 魏 (45) ──
  '曹操':['commander','strategist'], '张辽':['warrior'], '郭嘉':['strategist'],
  '夏侯惇':['warrior'], '荀彧':['minister'], '曹仁':['warrior','commander'],
  '乐进':['warrior'], '于禁':['warrior'], '徐晃':['warrior'],
  '张郃':['warrior','commander'], '司马懿':['commander','strategist'], '夏侯渊':['warrior'],
  '许褚':['warrior'], '荀攸':['strategist'], '程昱':['strategist'],
  '贾诩':['strategist'], '满宠':['minister'], '钟繇':['minister'],
  '王朗':['minister'], '曹洪':['warrior'], '郭淮':['warrior'],
  '李典':['warrior'], '臧霸':['warrior'], '蒋济':['strategist'],
  '刘晔':['strategist'], '牛金':['warrior'], '朱灵':['warrior'],
  '陈群':['minister'], '曹真':['warrior','commander'], '曹彰':['warrior'],
  '华歆':['minister'], '张绣':['warrior'], '曹休':['warrior'],
  '徐庶':['strategist'], '曹纯':['warrior'], '毛玠':['minister'],
  '董昭':['strategist'], '曹丕':['commander'], '曹植':['minister'],
  '郭女王':['minister'], '文聘':['warrior'], '王平':['warrior'],
  '司马昭':['commander','strategist'], '陈泰':['warrior'], '王基':['strategist'],
  // ── 蜀 (32) ──
  '刘备':['commander'], '关羽':['warrior','commander'], '张飞':['warrior'],
  '诸葛亮':['commander','strategist','minister'], '赵云':['warrior'], '马超':['warrior'],
  '黄忠':['warrior'], '魏延':['warrior'], '庞统':['strategist'],
  '法正':['strategist'], '廖化':['warrior'], '马岱':['warrior'],
  '董允':['minister'], '张翼':['warrior'], '吴懿':['warrior'],
  '马忠':['warrior'], '霍峻':['warrior'], '黄权':['strategist'],
  '邓芝':['minister'], '严颜':['warrior'], '关平':['warrior'],
  '关兴':['warrior'], '张苞':['warrior'], '刘封':['warrior'],
  '吴班':['warrior'], '马谡':['strategist'], '向宠':['warrior'],
  '糜竺':['minister'], '糜芳':['warrior'], '孙乾':['minister'],
  '简雍':['minister'], '夏侯霸':['warrior'],
  // ── 吴 (30) ──
  '孙权':['commander'], '周瑜':['commander','strategist'], '甘宁':['warrior'],
  '鲁肃':['strategist'], '吕蒙':['warrior','commander'], '陆逊':['commander','strategist'],
  '黄盖':['warrior'], '凌统':['warrior'], '丁奉':['warrior'],
  '程普':['warrior'], '朱然':['warrior'], '张昭':['minister'],
  '诸葛瑾':['minister'], '韩当':['warrior'], '徐盛':['warrior'],
  '潘璋':['warrior'], '贺齐':['warrior'], '顾雍':['minister'],
  '步骘':['minister'], '周泰':['warrior'], '蒋钦':['warrior'],
  '全琮':['warrior'], '吕范':['minister'], '朱桓':['warrior'],
  '骆统':['minister'], '吕据':['warrior'], '留赞':['warrior'],
  '孙尚香':['warrior'], '诸葛恪':['strategist'], '施绩':['warrior'],
  // ── 南蛮 (2) ──
  '孟获':['warrior'], '祝融':['warrior'],
  // ── 在野 (16) ──
  '张松':['strategist'], '庞德':['warrior'], '李严':['warrior'],
  '邓艾':['commander','strategist'], '钟会':['strategist'], '孟达':['warrior'],
  '申耽':['warrior'], '郝昭':['warrior'], '张任':['warrior'],
  '杨洪':['minister'], '蒋琬':['minister'], '费祎':['minister'],
  '姜维':['warrior','strategist'], '文鸯':['warrior'],
  '羊祜':['commander','minister'], '王濬':['warrior'],
  // ── ★ v178 fix #19: GEN_TAGS 已有但 GEN_CLASS 漏定义的 8 武将（事件/在野池等可招募） ──
  '典韦':['warrior'], '高顺':['warrior'], '陈宫':['strategist'],
  '太史慈':['warrior','commander'], '孙策':['warrior','commander'],
  '陆抗':['commander','strategist'],
  '沮授':['strategist','minister'], '田丰':['strategist','minister'],
};
const CLASS_META = {
  warrior:    {icon:'⚔️', label:'武将', color:'#a82a1a'},
  commander:  {icon:'🏴', label:'统帅', color:'#1a5f8a'},
  strategist: {icon:'🧠', label:'谋士', color:'#6a3d7d'},
  minister:   {icon:'📜', label:'能臣', color:'#1a7a3a'},
};

// ── range C: 武将相性 (APT_MULT + COMPAT + COMPAT_GROWTH_MULT + INTIMACY_PRESET, 原 v181 L1439-L1513, 75 行) ──
// 适性乘数：S=+20% A=+10% B=±0% C=-12%
const APT_MULT = {S:1.20, A:1.10, B:1.00, C:0.88};

// ═══════════════════════════════════════════════════════
// 💞 相性与亲密度系统（2.5）
// ═══════════════════════════════════════════════════════

// 武将相性值（0~100，三极：刘备=3 / 曹操=50 / 孙权=93）
const COMPAT = {
  // 魏
  '曹操':50,'张辽':46,'郭嘉':52,'夏侯惇':48,'荀彧':38,'曹仁':51,'乐进':49,
  '于禁':53,'徐晃':47,'张郃':55,'司马懿':60,'夏侯渊':49,'许褚':50,'典韦':50,
  '荀攸':42,'程昱':54,'贾诩':65,
  '满宠':56,'钟繇':44,'王朗':48,'曹洪':50,'郭淮':58,
  // 蜀
  '刘备':3,'关羽':5,'张飞':8,'诸葛亮':10,'赵云':6,'马超':35,'黄忠':14,
  '魏延':22,'庞统':18,'法正':30,'姜维':12,'王平':16,'廖化':9,'马岱':33,
  '董允':8,'张翼':20,'吴懿':25,'马忠':18,'霍峻':12,
  // 吴
  '孙权':93,'周瑜':90,'甘宁':72,'鲁肃':88,'太史慈':78,'吕蒙':91,'陆逊':94,
  '黄盖':89,'凌统':82,'丁奉':92,'程普':87,'孙策':85,'朱然':91,
  '张昭':92,'诸葛瑾':88,'韩当':86,'徐盛':84,'潘璋':75,
  // 在野
  '徐庶':7,'陈宫':40,'田丰':32,'沮授':34,'张松':58,'庞德':44,'文聘':56,
  '高顺':45,'李严':28,'邓艾':62,'钟会':67,'孟达':63,'申耽':60,'马谡':15,
  '郝昭':57,'张任':25,'杨洪':20,'蒋琬':11,'费祎':13,'向宠':16,
};

// 相性差距 → 亲密度增长倍率
const COMPAT_GROWTH_MULT = [
  [10,  2.0],
  [25,  1.5],
  [40,  1.0],
  [60,  0.5],
  [100, 0.2],
];

// 史实初始亲密度预设
const INTIMACY_PRESET = [
  // 蜀汉核心
  ['刘备','关羽',90],   ['刘备','张飞',90],    ['关羽','张飞',85],
  ['刘备','赵云',80],   ['刘备','诸葛亮',85],  ['关羽','诸葛亮',55],
  ['张飞','诸葛亮',50], ['诸葛亮','庞统',60],  ['诸葛亮','姜维',75],
  ['诸葛亮','马谡',65], ['诸葛亮','蒋琬',70],  ['诸葛亮','费祎',65],
  ['刘备','庞统',60],   ['刘备','法正',65],    ['刘备','黄忠',55],
  ['关羽','黄忠',-15],    // ★ v131: D1拜将大典——关羽不服黄忠
  ['刘备','马超',45],   ['诸葛亮','魏延',-30], ['刘备','徐庶',70],
  ['诸葛亮','徐庶',75],
  // 曹魏核心
  ['曹操','夏侯惇',85], ['曹操','夏侯渊',80],  ['曹操','曹仁',80],
  ['曹操','许褚',80],   ['曹操','典韦',80],    ['曹操','荀彧',70],
  ['曹操','郭嘉',85],   ['曹操','贾诩',45],    ['曹操','张辽',65],
  ['曹操','司马懿',40], ['荀彧','荀攸',70],    ['郭嘉','荀攸',55],
  ['夏侯惇','夏侯渊',75],['曹仁','夏侯惇',65], ['张辽','乐进',55],
  ['张辽','于禁',50],
  // 江东核心
  ['孙权','周瑜',85],   ['孙权','鲁肃',80],    ['孙权','陆逊',80],
  ['孙权','吕蒙',75],   ['孙权','黄盖',70],    ['孙权','程普',65],
  ['孙权','孙策',90],   ['周瑜','鲁肃',85],    ['周瑜','孙策',90],
  ['孙策','太史慈',70], ['吕蒙','陆逊',65],    ['凌统','甘宁',-60],
  ['孙权','甘宁',60],
  // 跨阵营特殊关系
  ['关羽','张辽',55],   ['关羽','徐晃',55],    ['马超','庞德',60],
  ['庞德','关羽',-55],  ['诸葛亮','周瑜',-40], ['曹操','陈宫',-80],
  ['田丰','沮授',70],   ['法正','张松',65],
  ['蒋琬','费祎',70],   ['邓艾','钟会',-30],
  // 二线武将史实关系
  ['钟繇','荀彧',60],   ['钟繇','荀攸',55],   ['王朗','钟繇',50],
  ['曹洪','曹操',80],   ['曹洪','夏侯惇',65], ['郭淮','张郃',60],
  ['董允','诸葛亮',70], ['董允','费祎',65],   ['吴懿','刘备',60],
  ['马忠','诸葛亮',65], ['蒋琬','董允',60],
  ['张昭','孙权',65],   ['张昭','孙策',75],   ['诸葛瑾','孙权',80],
  ['诸葛瑾','陆逊',65], ['韩当','程普',70],   ['韩当','黄盖',65],
  ['潘璋','凌统',-40],
];
