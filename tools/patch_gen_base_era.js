// tools/patch_gen_base_era.js
//
// 用途: 批量 patch GEN_BASE entries 的 birthYear / deathYear / debutYear 三字段
//       (W1.1-a/b/c/d 复用,本次 batch 用 --batch=wei 等参数指定 mapping)
//
// 用法: node tools/patch_gen_base_era.js --batch=wei
//       (mapping 在本 script 末尾按 batch key 维护)
//
// 设计:
// - idempotent: 已 patched (birthYear: <num>) 的 entry skip
// - 未在 GEN_BASE 的 name 报错列出
// - null 用 'null' literal 保持原样 (未详)
// - patch 后 syntax check (node --check)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FILE = 'src/data/general_base.js';

// ── mapping 定义区 (按 batch key) ────────────────────────────────────
const BATCH_MAPPINGS = {
  // ── batch W1.1-a: wei 45 武将 ────────────────────────────────────
  wei: {
    '曹操':   { b: 155,  d: 220,  du: 174 },  // 举孝廉 → 洛阳北部尉
    '张辽':   { b: 169,  d: 222,  du: 189 },  // 丁原召为从事
    '郭嘉':   { b: 170,  d: 207,  du: 191 },  // 初仕袁绍
    '夏侯惇': { b: null, d: 220,  du: 190 },  // 随曹起兵
    '荀彧':   { b: 163,  d: 212,  du: 189 },  // 举孝廉 守宫令
    '曹仁':   { b: 168,  d: 223,  du: 190 },  // 随曹起兵
    '乐进':   { b: null, d: 218,  du: 190 },  // 从曹起兵募吏
    '于禁':   { b: null, d: 221,  du: 184 },  // 鲍信黄巾募兵
    '徐晃':   { b: 169,  d: 227,  du: 192 },  // 杨奉部曲
    '张郃':   { b: null, d: 231,  du: 184 },  // 韩馥黄巾募兵
    '司马懿': { b: 179,  d: 251,  du: 208 },  // 曹操辟为文学掾
    '夏侯渊': { b: null, d: 219,  du: 190 },  // 随曹起兵
    '许褚':   { b: null, d: null, du: 197 },  // 投曹于汝南
    '荀攸':   { b: 157,  d: 214,  du: 184 },  // 黄门侍郎
    '程昱':   { b: 141,  d: 220,  du: 192 },  // 随曹入兖州
    '贾诩':   { b: 147,  d: 223,  du: 184 },  // 举孝廉
    '满宠':   { b: null, d: 242,  du: 196 },  // 郡督邮
    '钟繇':   { b: 151,  d: 230,  du: 184 },  // 举孝廉廷尉正
    '王朗':   { b: null, d: 228,  du: 188 },  // 陶谦举茂才→会稽太守
    '曹洪':   { b: null, d: 232,  du: 190 },  // 随曹起兵
    '郭淮':   { b: null, d: 255,  du: 215 },  // 举孝廉 平原府丞
    '李典':   { b: null, d: 209,  du: 190 },  // 从族父李乾
    '臧霸':   { b: null, d: null, du: 184 },  // 黄巾随父讨贼
    '蒋济':   { b: null, d: 249,  du: 208 },  // 辟为丹阳太守
    '刘晔':   { b: null, d: 234,  du: 198 },  // 说服庐江郑宝
    '牛金':   { b: null, d: null, du: 209 },  // 从曹仁
    '朱灵':   { b: null, d: null, du: 192 },  // 袁绍部
    '陈群':   { b: null, d: 237,  du: 198 },  // 刘备豫州辟为别驾
    '曹真':   { b: null, d: 231,  du: 200 },  // 随曹从军
    '曹彰':   { b: null, d: 223,  du: 218 },  // 代郡太守
    '华歆':   { b: 157,  d: 232,  du: 184 },  // 举孝廉
    '张绣':   { b: null, d: 207,  du: 189 },  // 从张济入凉州军
    '曹休':   { b: null, d: 228,  du: 200 },  // 随曹起兵
    '徐庶':   { b: null, d: null, du: 201 },  // 投刘备
    '曹纯':   { b: 170,  d: 210,  du: 190 },  // 随曹起兵
    '毛玠':   { b: null, d: 216,  du: 192 },  // 兖州治中从事
    '董昭':   { b: 156,  d: 236,  du: 184 },  // 举孝廉
    '曹丕':   { b: 187,  d: 226,  du: 204 },  // 官渡后随父出征
    '曹植':   { b: 192,  d: 232,  du: 210 },  // 任平原侯
    '郭女王': { b: 184,  d: 235,  du: 213 },  // 嫁曹丕
    '文聘':   { b: null, d: null, du: 208 },  // 刘琮降曹归
    '王平':   { b: null, d: 248,  du: 215 },  // 从徐晃伐汉中 (后投蜀)
    '司马昭': { b: 211,  d: 265,  du: 235 },  // 任洛阳典农中郎将
    '陈泰':   { b: null, d: 260,  du: 232 },  // 任公府掾
    '王基':   { b: 190,  d: 261,  du: 222 },  // 琅琊王徽举孝廉
  },

  // ── batch W1.1-b: shu 32 武将 ────────────────────────────────────
  shu: {
    '刘备':   { b: 161,  d: 223,  du: 184 },  // 黄巾起兵
    '关羽':   { b: null, d: 219,  du: 184 },  // 从刘备起兵
    '张飞':   { b: null, d: 221,  du: 184 },  // 从刘备起兵
    '诸葛亮': { b: 181,  d: 234,  du: 207 },  // 出隆中
    '赵云':   { b: null, d: 229,  du: 191 },  // 公孙瓒部
    '马超':   { b: 176,  d: 222,  du: 195 },  // 随父马腾
    '黄忠':   { b: null, d: 220,  du: 200 },  // 刘表/长沙太守韩玄部
    '魏延':   { b: null, d: 234,  du: 211 },  // 随刘备入蜀
    '庞统':   { b: 179,  d: 214,  du: 209 },  // 周瑜功曹
    '法正':   { b: 176,  d: 220,  du: 200 },  // 入蜀任新都令
    '廖化':   { b: null, d: 264,  du: 211 },  // 关羽主簿
    '马岱':   { b: null, d: null, du: 211 },  // 随马超归蜀
    '董允':   { b: null, d: 246,  du: 221 },  // 太子洗马
    '张翼':   { b: null, d: 264,  du: 211 },  // 从刘备入蜀
    '吴懿':   { b: null, d: 237,  du: 200 },  // 随刘璋
    '马忠':   { b: null, d: 249,  du: 222 },  // 巴西太守
    '霍峻':   { b: 178,  d: 217,  du: 211 },  // 随刘备入蜀
    '黄权':   { b: null, d: 240,  du: 200 },  // 刘璋主簿
    '邓芝':   { b: 178,  d: 251,  du: 214 },  // 任郫县令
    '严颜':   { b: null, d: null, du: 211 },  // 刘璋巴郡太守
    '关平':   { b: null, d: 219,  du: 200 },  // 随父关羽
    '关兴':   { b: null, d: 234,  du: 215 },  // 蜀后期
    '张苞':   { b: null, d: null, du: 215 },  // 蜀后期
    '刘封':   { b: null, d: 220,  du: 200 },  // 刘备养子
    '吴班':   { b: null, d: null, du: 215 },  // 族吴懿
    '马谡':   { b: 190,  d: 228,  du: 211 },  // 从刘备入蜀
    '向宠':   { b: null, d: 240,  du: 221 },  // 牙门将
    '糜竺':   { b: null, d: 221,  du: 194 },  // 徐州陶谦从事
    '糜芳':   { b: null, d: null, du: 194 },  // 糜竺弟
    '孙乾':   { b: null, d: 215,  du: 194 },  // 从刘备
    '简雍':   { b: null, d: null, du: 184 },  // 从刘备起兵 同乡
    '夏侯霸': { b: null, d: null, du: 219 },  // 随父夏侯渊 (后 248 投蜀)
  },

  // ── batch W1.1-c: wu 30 武将 ─────────────────────────────────────
  wu: {
    '孙权':   { b: 182,  d: 252,  du: 200 },  // 继兄孙策
    '周瑜':   { b: 175,  d: 210,  du: 195 },  // 投孙策
    '甘宁':   { b: null, d: 219,  du: 200 },  // 黄祖部
    '鲁肃':   { b: 172,  d: 217,  du: 200 },  // 周瑜引荐孙权
    '吕蒙':   { b: 178,  d: 219,  du: 195 },  // 随姊夫邓当
    '陆逊':   { b: 183,  d: 245,  du: 204 },  // 孙权幕府
    '黄盖':   { b: null, d: 215,  du: 184 },  // 孙坚黄巾
    '凌统':   { b: 189,  d: 217,  du: 204 },  // 随父凌操
    '丁奉':   { b: null, d: 271,  du: 225 },  // 孙权部
    '程普':   { b: null, d: 215,  du: 184 },  // 孙坚黄巾
    '朱然':   { b: 182,  d: 249,  du: 200 },  // 余姚长
    '张昭':   { b: 156,  d: 236,  du: 194 },  // 孙策幕府
    '诸葛瑾': { b: 174,  d: 241,  du: 200 },  // 孙权幕府
    '韩当':   { b: null, d: 226,  du: 184 },  // 孙坚黄巾
    '徐盛':   { b: null, d: null, du: 210 },  // 孙权部柴桑长
    '潘璋':   { b: null, d: 234,  du: 200 },  // 孙权部
    '贺齐':   { b: null, d: 227,  du: 199 },  // 会稽剡令
    '顾雍':   { b: 168,  d: 243,  du: 200 },  // 合肥长
    '步骘':   { b: null, d: 247,  du: 200 },  // 主记
    '周泰':   { b: null, d: null, du: 193 },  // 孙策部
    '蒋钦':   { b: null, d: 219,  du: 193 },  // 孙策部
    '全琮':   { b: 198,  d: 247,  du: 219 },  // 孙权部
    '吕范':   { b: null, d: 228,  du: 195 },  // 孙策都督
    '朱桓':   { b: 176,  d: 238,  du: 200 },  // 余姚长
    '骆统':   { b: 193,  d: 228,  du: 212 },  // 孙权部
    '吕据':   { b: null, d: 256,  du: 232 },  // 吕范子
    '留赞':   { b: null, d: 255,  du: 220 },  // 吴后期
    '孙尚香': { b: null, d: null, du: 209 },  // 嫁刘备
    '诸葛恪': { b: 203,  d: 253,  du: 222 },  // 太子辅佐
    '施绩':   { b: null, d: 270,  du: 240 },  // 朱然子 吴后期
  },

  // ── batch W1.1-d: wild 16 + inactive 8 + nanman 2 + 80 新加 = 106 武将 ──
  misc: {
    // ── WILD_GENS 16 ──
    '张松':   { b: null, d: 212,  du: 190 },  // 益州刘焉部
    '庞德':   { b: null, d: 219,  du: 194 },  // 马腾部 (后 219 樊城战死)
    '李严':   { b: null, d: 234,  du: 200 },  // 刘璋成都令 (后 213 投刘备)
    '邓艾':   { b: 197,  d: 264,  du: 243 },  // 太尉府辟
    '钟会':   { b: 225,  d: 264,  du: 247 },  // 尚书郎
    '孟达':   { b: null, d: 234,  du: 200 },  // 刘璋部
    '申耽':   { b: null, d: null, du: 200 },  // 上庸豪族
    '郝昭':   { b: null, d: 229,  du: 215 },  // 太原阳曲
    '张任':   { b: null, d: 213,  du: 200 },  // 刘璋部州从事
    '杨洪':   { b: null, d: 228,  du: 218 },  // 蜀地杨氏
    '蒋琬':   { b: null, d: 246,  du: 211 },  // 随刘备入蜀
    '费祎':   { b: null, d: 253,  du: 221 },  // 太子舍人
    '姜维':   { b: 202,  d: 264,  du: 220 },  // 天水中郎
    '文鸯':   { b: 238,  d: 291,  du: 255 },  // 魏后期
    '羊祜':   { b: 221,  d: 278,  du: 243 },  // 中书侍郎前任
    '王濬':   { b: 206,  d: 286,  du: 240 },  // 河东从事
    // ── GEN_POOL_INACTIVE 8 (era 已有 → debutYear 补充) ──
    '孙策':   { b: 175,  d: 200,  du: 189 },  // 从父孙坚
    '典韦':   { b: null, d: 197,  du: 190 },  // 张邈部 (后归曹)
    '陆抗':   { b: 226,  d: 274,  du: 246 },  // 建武校尉 (陆逊子)
    '太史慈': { b: 166,  d: 206,  du: 190 },  // 北海郡奏曹
    '陈宫':   { b: null, d: 198,  du: 190 },  // 东郡名士
    '田丰':   { b: null, d: 200,  du: 189 },  // 举茂才
    '沮授':   { b: null, d: 200,  du: 189 },  // 韩馥别驾
    '高顺':   { b: null, d: 198,  du: 190 },  // 吕布部
    // ── nanman 2 (虚构/小说人物 — debut 用 225 南征) ──
    '孟获':   { b: null, d: null, du: 225 },  // 诸葛亮南征
    '祝融':   { b: null, d: null, du: 225 },  // 孟获夫人 (小说)
    // ── 董卓集团 10 ──
    '董卓':   { b: null, d: 192,  du: 184 },  // 东中郎将 黄巾
    '吕布':   { b: null, d: 198,  du: 189 },  // 并州刺史丁原主簿
    '华雄':   { b: null, d: 191,  du: 189 },  // 董卓部 (汜水关被斩)
    '李傕':   { b: null, d: 198,  du: 189 },  // 董卓部校尉
    '郭汜':   { b: null, d: 197,  du: 189 },  // 董卓部
    '张济':   { b: null, d: 196,  du: 189 },  // 董卓部 (张绣之叔)
    '樊稠':   { b: null, d: 195,  du: 189 },  // 董卓部
    '牛辅':   { b: null, d: 192,  du: 189 },  // 董卓女婿
    '胡轸':   { b: null, d: null, du: 190 },  // 董卓部
    '徐荣':   { b: null, d: 192,  du: 189 },  // 董卓部 (王允乱中战死)
    // ── 袁绍集团 9 ──
    '袁绍':   { b: null, d: 202,  du: 188 },  // 大将军何进掾
    '颜良':   { b: null, d: 200,  du: 190 },  // 袁绍冀州部
    '文丑':   { b: null, d: 200,  du: 190 },  // 袁绍冀州部
    '审配':   { b: null, d: 204,  du: 191 },  // 韩馥治中 (后归袁)
    '逢纪':   { b: null, d: 202,  du: 189 },  // 袁绍部
    '许攸':   { b: null, d: 204,  du: 189 },  // 袁绍部 (后投曹)
    '麴义':   { b: null, d: null, du: 191 },  // 袁绍前锋
    '高览':   { b: null, d: null, du: 190 },  // 袁绍部 (后投曹)
    '淳于琼': { b: null, d: 200,  du: 188 },  // 西园校尉
    // ── 袁术 5 ──
    '袁术':   { b: null, d: 199,  du: 184 },  // 虎贲中郎将
    '张勋':   { b: null, d: null, du: 190 },  // 袁术大将
    '纪灵':   { b: null, d: null, du: 190 },  // 袁术大将
    '桥蕤':   { b: null, d: 197,  du: 190 },  // 袁术部
    '雷薄':   { b: null, d: null, du: 190 },  // 袁术部
    // ── 早期反董 3 ──
    '卫兹':   { b: null, d: 190,  du: 189 },  // 陈留孝廉 (荥阳战死)
    '鲍信':   { b: 152,  d: 192,  du: 184 },  // 济北相 反董
    '戏志才': { b: null, d: 196,  du: 190 },  // 曹操早期谋士
    // ── 孙坚 2 ──
    '孙坚':   { b: 155,  d: 191,  du: 172 },  // 盐渎丞
    '祖茂':   { b: null, d: 191,  du: 184 },  // 孙坚部 (阳人战死)
    // ── 刘表集团 9 ──
    '刘表':   { b: 142,  d: 208,  du: 184 },  // 大将军何进掾
    '蒯越':   { b: null, d: 214,  du: 189 },  // 大将军何进东曹掾
    '蒯良':   { b: null, d: null, du: 190 },  // 刘表部
    '蔡瑁':   { b: null, d: null, du: 190 },  // 刘表部 姻亲
    '张允':   { b: null, d: 208,  du: 190 },  // 刘表部
    '王威':   { b: null, d: null, du: 200 },  // 刘表部从事
    '刘磐':   { b: null, d: null, du: 200 },  // 刘表侄
    '刘琦':   { b: null, d: 209,  du: 204 },  // 刘表长子
    '刘琮':   { b: null, d: null, du: 208 },  // 刘表次子
    // ── 刘焉刘璋 5 ──
    '刘焉':   { b: null, d: 194,  du: 178 },  // 洛阳令
    '刘璋':   { b: null, d: 219,  du: 194 },  // 奉车都尉 (后继益州)
    '王累':   { b: null, d: 212,  du: 200 },  // 刘璋从事
    '吴兰':   { b: null, d: 218,  du: 200 },  // 刘璋部
    '雷铜':   { b: null, d: 218,  du: 200 },  // 刘璋部
    // ── 刘虞 6 ──
    '刘虞':   { b: null, d: 193,  du: 170 },  // 郎中
    '鲜于辅': { b: null, d: null, du: 190 },  // 刘虞部从事
    '鲜于银': { b: null, d: null, du: 190 },  // 刘虞部
    '阎柔':   { b: null, d: null, du: 190 },  // 刘虞部
    '齐周':   { b: null, d: null, du: 190 },  // 刘虞部
    '田畴':   { b: 169,  d: 214,  du: 190 },  // 刘虞部 (出使长安)
    // ── 公孙瓒 6 ──
    '公孙瓒': { b: null, d: 199,  du: 180 },  // 举孝廉为郎
    '严纲':   { b: null, d: 192,  du: 190 },  // 公孙瓒部冀州刺史 (界桥战死)
    '田楷':   { b: null, d: null, du: 190 },  // 公孙瓒部青州刺史
    '关靖':   { b: null, d: 199,  du: 190 },  // 公孙瓒部
    '邹丹':   { b: null, d: 199,  du: 190 },  // 公孙瓒部
    '单经':   { b: null, d: null, du: 190 },  // 公孙瓒部兖州刺史
    // ── 陶谦 5 ──
    '陶谦':   { b: 132,  d: 194,  du: 172 },  // 举茂才尚书郎
    '曹豹':   { b: null, d: null, du: 194 },  // 陶谦部
    '笮融':   { b: null, d: 195,  du: 190 },  // 陶谦部下邳相
    '张闿':   { b: null, d: null, du: 194 },  // 陶谦部司马 (191 攻杀曹嵩)
    '陈登':   { b: null, d: 206,  du: 196 },  // 徐州典农校尉
    // ── 韩馥 5 ──
    '韩馥':   { b: null, d: 191,  du: 189 },  // 御史中丞
    '耿武':   { b: null, d: 191,  du: 190 },  // 韩馥部
    '闵纯':   { b: null, d: 191,  du: 190 },  // 韩馥部
    '赵浮':   { b: null, d: null, du: 190 },  // 韩馥部
    '程奂':   { b: null, d: null, du: 190 },  // 韩馥部
    // ── 马腾韩遂 6 ──
    '马腾':   { b: null, d: 212,  du: 184 },  // 天水军吏
    '韩遂':   { b: null, d: 215,  du: 184 },  // 凉州反乱
    '阎行':   { b: null, d: null, du: 200 },  // 韩遂部 (后归曹)
    '成宜':   { b: null, d: 211,  du: 200 },  // 马超部 (渭水战死)
    '马铁':   { b: null, d: 212,  du: 200 },  // 马腾子
    '马休':   { b: null, d: 212,  du: 200 },  // 马腾子
    // ── 孔融 2 ──
    '孔融':   { b: 153,  d: 208,  du: 184 },  // 司徒辟
    '武安国': { b: null, d: null, du: 190 },  // 孔融部 (小说人物)
    // ── 张邈/张超 2 ──
    '张邈':   { b: null, d: 195,  du: 184 },  // 陈留太守 反董盟主
    '张超':   { b: null, d: 195,  du: 184 },  // 广陵太守 (张邈弟)
    // ── 王匡/桥瑁 2 ──
    '王匡':   { b: null, d: null, du: 189 },  // 河内太守 反董
    '桥瑁':   { b: null, d: 190,  du: 189 },  // 东郡太守 (被刘岱杀)
    // ── 早期归曹 2 ──
    '韩浩':   { b: null, d: null, du: 189 },  // 王匡部 (后归曹)
    '史涣':   { b: null, d: 215,  du: 190 },  // 从曹起兵
    // ── 杂 1 ──
    '宗宝':   { b: null, d: null, du: 200 },  // 袁谭部 (小说人物)
  },
};

// ── 主逻辑 ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const batchArg = args.find(a => a.startsWith('--batch='));
if (!batchArg) {
  console.error('Usage: node tools/patch_gen_base_era.js --batch=<wei|shu|wu|misc>');
  process.exit(1);
}
const batchKey = batchArg.split('=')[1];
const mapping = BATCH_MAPPINGS[batchKey];
if (!mapping) {
  console.error(`Unknown batch '${batchKey}'. Available: ${Object.keys(BATCH_MAPPINGS).join(', ')}`);
  process.exit(1);
}

let text = fs.readFileSync(FILE, 'utf8');
const before = text;
const patched = [];
const alreadyPatched = [];
const notFound = [];

for (const [name, era] of Object.entries(mapping)) {
  // 匹配 entry 内的 birthYear/deathYear/debutYear (按当前 schema 固定字段顺序 + 缩进)
  const entryRe = new RegExp(
    `("${name}":\\s*\\{[\\s\\S]*?)"birthYear":\\s*null,([\\s\\S]*?)"deathYear":\\s*null,([\\s\\S]*?)"debutYear":\\s*null,`,
    'u'
  );
  const m = text.match(entryRe);
  if (!m) {
    // 检查 entry 是否存在
    const nameInFile = new RegExp(`"${name}":\\s*\\{`).test(text);
    if (!nameInFile) {
      notFound.push(name);
    } else {
      alreadyPatched.push(name);
    }
    continue;
  }
  const bStr = era.b === null ? 'null' : String(era.b);
  const dStr = era.d === null ? 'null' : String(era.d);
  const duStr = era.du === null ? 'null' : String(era.du);
  text = text.replace(entryRe, (match, p1, p2, p3) =>
    `${p1}"birthYear": ${bStr},${p2}"deathYear": ${dStr},${p3}"debutYear": ${duStr},`
  );
  patched.push(name);
}

fs.writeFileSync(FILE, text, 'utf8');

console.log(`Batch '${batchKey}': patched ${patched.length} / ${Object.keys(mapping).length}`);
if (alreadyPatched.length) console.log(`  Already patched (skipped): ${alreadyPatched.length} — ${alreadyPatched.join(', ')}`);
if (notFound.length) console.log(`  NOT FOUND in GEN_BASE: ${notFound.length} — ${notFound.join(', ')}`);

// syntax check
try {
  execSync(`node --check ${FILE}`, { stdio: 'pipe' });
  console.log('  Syntax OK');
} catch (e) {
  console.error('  ❌ Syntax error after patch!');
  fs.writeFileSync(FILE, before, 'utf8');
  console.error('  Reverted file.');
  process.exit(1);
}
