// tools/patch_190_4e.js
//
// 4-e: SCENARIO_190 active 20 + pending 3 漏列补充 (sprint W1-W3 audit 发现的 missing 23 entries)
//
// 来源: W2.1/W2.2 audit 报告内 "应 active/pending 但 SCENARIO_190 漏列" 名单
// 插入: active 各 fac group 内 / pending 池末尾

const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'src/data/scenarios/190.js';

// ── 20 active entries (按 fac 分组, 插在该 fac block 内) ────────────
// 用 patch script append style: 在 fac 第一个 active entry 后 append 该 fac 漏的 entries
const ACTIVE_INSERTS = {
  // caocao 漏 4 — 插在 卫兹 (caocao 集团末) 之后
  'caocao': {
    afterEntry: '"卫兹"',
    entries: [
      `    "乐进":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":null, "post":{"name":"军假司马","rank":"将"}, "title":null, "loyalty":85, "merit":120,"retainer":{"count":600,"type":"heavy"},   "initialUnit":false, "relations":[] },`,
      `    "李典":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":null, "post":{"name":"军假司马","rank":"将"}, "title":null, "loyalty":80, "merit":100,"retainer":{"count":500,"type":"light"},   "initialUnit":false, "relations":[] },`,
      `    "曹纯":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":null, "post":{"name":"虎豹骑前身","rank":"将"}, "title":null, "loyalty":95, "merit":80, "retainer":{"count":400,"type":"cavalry"}, "initialUnit":false, "relations":[{"target":"曹操","type":"宗族","intimacy":90}] },`,
      `    "史涣":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":null, "post":{"name":"中军校尉","rank":"将"}, "title":null, "loyalty":85, "merit":80, "retainer":{"count":400,"type":"heavy"},   "initialUnit":false, "relations":[] },`,
    ],
  },
  // dongzhuo 漏 4 — 插在 华雄 之后
  'dongzhuo': {
    afterEntry: '"华雄"',
    entries: [
      `    "胡轸":   { "status":"active", "fac":"dongzhuo", "city":"luoyang", "role":null, "post":{"name":"中郎将","rank":"将"}, "title":null, "loyalty":80, "merit":120,"retainer":{"count":800, "type":"cavalry"},"initialUnit":false, "relations":[] },`,
      `    "樊稠":   { "status":"active", "fac":"dongzhuo", "city":"changan", "role":null, "post":{"name":"中郎将","rank":"将"}, "title":null, "loyalty":85, "merit":150,"retainer":{"count":1000,"type":"cavalry"},"initialUnit":false, "relations":[] },`,
      `    "张济":   { "status":"active", "fac":"dongzhuo", "city":"hedong",  "role":null, "post":{"name":"骁骑校尉","rank":"将"}, "title":null, "loyalty":85, "merit":130,"retainer":{"count":900, "type":"cavalry"},"initialUnit":false, "relations":[] },`,
      `    "高顺":   { "status":"active", "fac":"dongzhuo", "city":"luoyang", "role":null, "post":{"name":"陷阵将","rank":"将"}, "title":null, "loyalty":90, "merit":150,"retainer":{"count":700, "type":"heavy"},  "initialUnit":false, "relations":[{"target":"吕布","type":"主君","intimacy":90}] },`,
    ],
  },
  // yuanshao 漏 2 (高览/淳于琼) — 插在 许攸 之后
  'yuanshao': {
    afterEntry: '"许攸"',
    entries: [
      `    "高览":   { "status":"active", "fac":"yuanshao", "city":"ye", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":80, "merit":130,"retainer":{"count":800, "type":"heavy"},  "initialUnit":false, "relations":[] },`,
      `    "淳于琼": { "status":"active", "fac":"yuanshao", "city":"ye", "role":null, "post":{"name":"虎贲中郎将","rank":"将"}, "title":null, "loyalty":75, "merit":200,"retainer":{"count":1200,"type":"light"},  "initialUnit":false, "relations":[] },`,
    ],
  },
  // liubiao 漏 2 (张允/王威) — 插在 蔡瑁 之后
  'liubiao': {
    afterEntry: '"蔡瑁"',
    entries: [
      `    "张允":   { "status":"active", "fac":"liubiao", "city":"xiangyang", "role":null, "post":{"name":"水军将","rank":"将"}, "title":null, "loyalty":75, "merit":100,"retainer":{"count":500, "type":"naval"},  "initialUnit":false, "relations":[{"target":"蔡瑁","type":"同僚","intimacy":75}] },`,
      `    "王威":   { "status":"active", "fac":"liubiao", "city":"xiangyang", "role":null, "post":{"name":"治中从事","rank":"文官"}, "title":null, "loyalty":80, "merit":80, "retainer":{"count":200, "type":"light"},   "initialUnit":false, "relations":[] },`,
    ],
  },
  // liuyan 漏 3 (刘璋/王累/吴兰) — 插在 刘焉 之后
  'liuyan': {
    afterEntry: '"刘焉"',
    entries: [
      `    "刘璋":   { "status":"active", "fac":"liuyan", "city":"chengdu", "role":null, "post":{"name":"奉车都尉","rank":"将"}, "title":null, "loyalty":100,"merit":200,"retainer":{"count":600, "type":"light"},  "initialUnit":false, "relations":[{"target":"刘焉","type":"父","intimacy":95}] },`,
      `    "王累":   { "status":"active", "fac":"liuyan", "city":"chengdu", "role":null, "post":{"name":"治中从事","rank":"文官"}, "title":null, "loyalty":95, "merit":120,"retainer":{"count":200, "type":"light"},  "initialUnit":false, "relations":[] },`,
      `    "吴兰":   { "status":"active", "fac":"liuyan", "city":"chengdu", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":80, "merit":100,"retainer":{"count":600, "type":"heavy"},  "initialUnit":false, "relations":[] },`,
    ],
  },
  // taoqian 漏 1 — 插在 曹豹 之后
  'taoqian': {
    afterEntry: '"曹豹"',
    entries: [
      `    "张闿":   { "status":"active", "fac":"taoqian", "city":"xiapi", "role":null, "post":{"name":"司马","rank":"将"}, "title":null, "loyalty":60, "merit":80, "retainer":{"count":500, "type":"cavalry"},"initialUnit":false, "relations":[] },`,
    ],
  },
  // matenghan 漏 2 (马铁/马休) — 插在 成宜 之后
  'matenghan': {
    afterEntry: '"成宜"',
    entries: [
      `    "马铁":   { "status":"active", "fac":"matenghan", "city":"liangzhou", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":95, "merit":80, "retainer":{"count":400, "type":"cavalry"},"initialUnit":false, "relations":[{"target":"马腾","type":"父","intimacy":95},{"target":"马超","type":"兄","intimacy":85}] },`,
      `    "马休":   { "status":"active", "fac":"matenghan", "city":"liangzhou", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":95, "merit":80, "retainer":{"count":400, "type":"cavalry"},"initialUnit":false, "relations":[{"target":"马腾","type":"父","intimacy":95},{"target":"马超","type":"兄","intimacy":85}] },`,
    ],
  },
  // hanfu 漏 1 (张郃) — 插在 闵纯 之后
  'hanfu': {
    afterEntry: '"闵纯"',
    entries: [
      `    "张郃":   { "status":"active", "fac":"hanfu", "city":"ye", "role":null, "post":{"name":"司马","rank":"将"}, "title":null, "loyalty":70, "merit":100,"retainer":{"count":600, "type":"cavalry"},"initialUnit":false, "relations":[] },`,
    ],
  },
  // kongrong 漏 1 (宗宝 — 小说人物 北海部) — 插在 武安国 之后
  'kongrong': {
    afterEntry: '"武安国"',
    entries: [
      `    "宗宝":   { "status":"active", "fac":"kongrong", "city":"beihai", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":85, "merit":80, "retainer":{"count":500, "type":"heavy"},  "initialUnit":false, "relations":[] },`,
    ],
  },
};

// ── 3 pending entries (刘磐/刘琦/刘琮 liubiao) — 插在 pending 池末尾 ──
const PENDING_INSERTS = {
  afterEntry: '"文鸯":',
  entries: [
    `    "刘磐":   { "status":"pending", "fac":"wild", "pendingFac":"liubiao", "availableYear":200, "wildData":{ "title":null, "post":{"name":"待时未仕","rank":"民","desc":"200 才出仕"}, "loyalty":50, "merit":0, "retainer":{"count":0,"type":""}, "relations":[] }},`,
    `    "刘琦":   { "status":"pending", "fac":"wild", "pendingFac":"liubiao", "availableYear":204, "wildData":{ "title":null, "post":{"name":"待时未仕","rank":"民","desc":"204 才出仕"}, "loyalty":50, "merit":0, "retainer":{"count":0,"type":""}, "relations":[] }},`,
    `    "刘琮":   { "status":"pending", "fac":"wild", "pendingFac":"liubiao", "availableYear":208, "wildData":{ "title":null, "post":{"name":"待时未仕","rank":"民","desc":"208 才出仕"}, "loyalty":50, "merit":0, "retainer":{"count":0,"type":""}, "relations":[] }},`,
  ],
};

let text = fs.readFileSync(FILE, 'utf8');
const before = text;
let insertCount = 0;

// 处理 active inserts (按 fac key 顺序 patch)
// marker 是 generals entry 起始: `    "<name>":   { "status":"active"` (4-space indent + status)
for (const [fac, info] of Object.entries(ACTIVE_INSERTS)) {
  // 用具体 entry-start pattern, 避免 marker 在 foundingCore 等 array 内误匹配
  const markerPat = new RegExp(`    ${info.afterEntry}:\\s*\\{\\s*"status":"active"`);
  const m = text.match(markerPat);
  if (!m) { console.error(`marker ${info.afterEntry} not found for ${fac}`); continue; }
  const idx = m.index;
  // 找该 marker entry 的行末 (next \n)
  const lineEnd = text.indexOf('\n', idx);
  const insertPoint = lineEnd + 1;
  const insertText = info.entries.join('\n') + '\n';
  text = text.slice(0, insertPoint) + insertText + text.slice(insertPoint);
  insertCount += info.entries.length;
}

// 处理 pending inserts — marker 文鸯 是 pending entry
{
  const markerPat = new RegExp(`    ${PENDING_INSERTS.afterEntry}\\s*\\{\\s*"status":"pending"`);
  const m = text.match(markerPat);
  if (!m) { console.error(`pending marker ${PENDING_INSERTS.afterEntry} not found`); }
  else {
    const lineEnd = text.indexOf('\n', m.index);
    const insertPoint = lineEnd + 1;
    const insertText = PENDING_INSERTS.entries.join('\n') + '\n';
    text = text.slice(0, insertPoint) + insertText + text.slice(insertPoint);
    insertCount += PENDING_INSERTS.entries.length;
  }
}

fs.writeFileSync(FILE, text, 'utf8');
console.log(`Inserted ${insertCount} entries (20 active + 3 pending)`);

try { execSync(`node --check ${FILE}`, { stdio:'pipe' }); console.log('Syntax OK'); }
catch (e) { console.error('❌ syntax error — KEEPING file for diagnose'); console.error(e.stderr ? e.stderr.toString() : e.message); process.exit(1); }
