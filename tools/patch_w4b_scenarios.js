// patch_w4b_scenarios.js — §8.4 W4b: 给 SCENARIO_190 / SCENARIO_214 加 gamePost 字段
//   + 190 stage 修正 (6 家 regional→warlord) + 贾诩/李儒 roster 扩充。
// 一次性 patch 脚本 (string-level 定向插入, 保留原文件格式)。run: node tools/patch_w4b_scenarios.js
'use strict';
const fs = require('fs');

// ════════════════════════ 190.js ════════════════════════
const F190 = 'src/data/scenarios/190.js';
let s = fs.readFileSync(F190, 'utf8');

// ── 1. stage: 6 家 regional → warlord (董卓 regime / 刘焉 regional 保持) ──
for (const fid of ['yuanshao', 'yuanshu', 'liubiao', 'liuyu', 'taoqian', 'hanfu']) {
  const re = new RegExp('("' + fid + '":\\s*\\{[\\s\\S]*?"stage":\\s*)"regional"');
  if (!re.test(s)) throw new Error('190 stage pattern not found: ' + fid);
  s = s.replace(re, '$1"warlord"');
}

// ── 2. 贾诩: 删 wild 行 ──
const jiaxuWild = /^ *"贾诩":\s*\{ "status":"wild".*\}\},?\r?\n/m;
if (!jiaxuWild.test(s)) throw new Error('190 贾诩 wild 行 not found');
s = s.replace(jiaxuWild, '');

// ── 3. dongzhuo 块插入 贾诩 + 李儒 (active) ──
const ins =
  '    "贾诩":   { "status":"active", "fac":"dongzhuo", "city":"changan", "role":"strategist", "post":{"name":"讨虏校尉","rank":"文官"}, "title":null, "loyalty":65, "merit":250,"retainer":{"count":150,"type":"light"},"initialUnit":false, "relations":[], "gamePost":"尚书令" },\n' +
  '    "李儒":   { "status":"active", "fac":"dongzhuo", "city":"luoyang", "role":"strategist", "post":{"name":"郎中令","rank":"文官"}, "title":null, "loyalty":95, "merit":350,"retainer":{"count":300,"type":"light"},"initialUnit":false, "relations":[{"target":"董卓","type":"主君","intimacy":90}], "gamePost":"丞相" },\n';
const xurong = /^( *"徐荣":.*\r?\n)/m;
if (!xurong.test(s)) throw new Error('190 徐荣 行 not found');
s = s.replace(xurong, '$1' + ins);

// ── 4. gamePost: 63 active 武将 (190 派官表, 不含已带 gamePost 的 贾诩/李儒) ──
const POST_190 = {
  // 董卓〔政权〕— 武 一档1+二档2+三档3
  '吕布': '大将军', '张辽': '前将军', '高顺': '后将军', '华雄': '校尉', '李傕': '偏将军', '郭汜': '裨将军',
  // 刘焉〔一方〕— 武 二档3+三档2 / 文 二档2
  '张任': '前将军', '严颜': '后将军', '吴懿': '左将军', '吴兰': '校尉', '刘璋': '偏将军', '张松': '尚书令', '王累': '侍中',
  // 袁绍〔军阀〕
  '颜良': '前将军', '文丑': '校尉', '麴义': '偏将军', '田丰': '尚书令', '沮授': '主簿', '审配': '从事',
  // 袁术〔军阀〕
  '纪灵': '前将军', '张勋': '校尉', '桥蕤': '偏将军',
  // 曹操〔军阀〕
  '夏侯惇': '前将军', '曹仁': '校尉', '夏侯渊': '偏将军', '荀彧': '尚书令', '荀攸': '主簿', '程昱': '从事',
  // 孙坚〔军阀〕
  '黄盖': '前将军', '程普': '校尉', '祖茂': '偏将军',
  // 刘表〔军阀〕
  '黄忠': '前将军', '文聘': '校尉', '刘磐': '偏将军', '蒯越': '尚书令', '蒯良': '主簿',
  // 刘虞〔军阀〕
  '阎柔': '前将军', '鲜于辅': '校尉', '鲜于银': '偏将军', '田畴': '尚书令',
  // 公孙瓒〔军阀〕
  '赵云': '前将军', '严纲': '校尉', '田楷': '偏将军', '关靖': '尚书令',
  // 陶谦〔军阀〕
  '曹豹': '前将军', '张闿': '校尉', '糜芳': '偏将军', '陈登': '尚书令', '糜竺': '主簿',
  // 韩馥〔军阀〕
  '张郃': '前将军', '赵浮': '校尉', '耿武': '尚书令', '闵纯': '主簿',
  // 马腾〔军阀〕
  '庞德': '前将军', '阎行': '校尉', '成宜': '偏将军', '韩遂': '尚书令',
  // 孔融〔军阀〕
  '太史慈': '前将军', '武安国': '校尉', '宗宝': '偏将军',
  // 刘备〔军阀〕
  '关羽': '前将军', '张飞': '校尉', '简雍': '尚书令',
};
for (const [name, post] of Object.entries(POST_190)) {
  const re = new RegExp('(^ *"' + name + '":\\s*\\{ "status":"active"[^\\n]*?)("relations":)', 'm');
  if (!re.test(s)) throw new Error('190 gamePost target not found: ' + name);
  s = s.replace(re, '$1"gamePost":"' + post + '", $2');
}

// ── 5. header 计数注释 (active 102→104 / wild 14→13) ──
s = s.replace('// ─── 102 active 武将 (14 ruler + 88 心腹/史实任职) ────────────────────',
              '// ─── 104 active 武将 (14 ruler + 90 心腹/史实任职) ────────────────────');
s = s.replace('// ── wild 池 (14) — 190 时已成年(≥18) 未仕 14 fac 之任何一方 ──',
              '// ── wild 池 (13) — 190 时已成年(≥18) 未仕 14 fac 之任何一方 ──');

fs.writeFileSync(F190, s);
console.log('190.js patched (stage×6 + 贾诩 active + 李儒 new + gamePost×' + Object.keys(POST_190).length + ')');

// ════════════════════════ 214.js ════════════════════════
const F214 = 'src/data/scenarios/214.js';
let t = fs.readFileSync(F214, 'utf8');

// gamePost: 港 旧 INIT_POSTS 中仍在 214 active 名册的 26 条
// (荀彧/周瑜 已死移出名册 / 蒋琬/费祎 status=pending — 现 main 上 INIT_POSTS guard 本就跳过, 留空 = 行为一致)
const POST_214 = {
  // wei
  '夏侯惇': '大将军', '张辽': '前将军', '曹仁': '后将军', '于禁': '左将军', '徐晃': '右将军',
  '荀攸': '尚书令', '司马懿': '侍中', '陈群': '太常', '程昱': '光禄勋',
  // shu
  '关羽': '大将军', '张飞': '前将军', '赵云': '后将军', '马超': '左将军', '黄忠': '右将军',
  '诸葛亮': '丞相', '法正': '尚书令', '董允': '光禄勋',
  // wu
  '吕蒙': '前将军', '甘宁': '后将军', '黄盖': '左将军', '陆逊': '右将军',
  '张昭': '丞相', '鲁肃': '尚书令', '顾雍': '侍中', '诸葛瑾': '太常', '步骘': '光禄勋',
};
for (const [name, post] of Object.entries(POST_214)) {
  // 214.js 多行 pretty-print: 在该武将 "status": "active" 行后插一行 "gamePost"
  const re = new RegExp('("' + name + '":\\s*\\{\\s*\\r?\\n\\s*"status":\\s*"active",\\r?\\n)', 'm');
  if (!re.test(t)) throw new Error('214 gamePost target not found: ' + name);
  t = t.replace(re, '$1      "gamePost": "' + post + '",\n');
}
fs.writeFileSync(F214, t);
console.log('214.js patched (gamePost×' + Object.keys(POST_214).length + ')');
