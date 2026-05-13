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
