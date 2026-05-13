// tools/patch_190_pending.js
//
// W2.2: 给 SCENARIO_190.generals 加 96 pending 武将 (基于 GEN_BASE 三年字段派生)
//
// 规则: GEN_BASE.debutYear > 190 AND deathYear > 190 (或 null) AND 不在 active/wild
// pendingFac 按史实最终归属:
//   - 14 fac SCENARIO_190 内: caocao/yuanshao/yuanshu/dongzhuo/sunjian/liubiao/liuyan/
//                              liuyu/gongsunzan/taoqian/hanfu/matenghan/liubei/kongrong
//   - 后期 wei/shu/wu 武将归属 SCENARIO_190 内同源 fac (e.g. 诸葛亮→liubei, 周瑜→sunjian)
//   - 南蛮 fac 不存在 (190 期不参与) → 孟获/祝融 pendingFac=null
//   - 上庸豪族 申耽 → null (无 fac)
//
// wildData schema: title/post 用 placeholder (后续 W3 wildMeta 集成时精细化),
//                  loyalty/merit/retainer/relations 用最简 default.

const fs = require('fs');

const FILE = 'src/data/scenarios/190.js';

// 96 pending 武将 mapping (按 audit 顺序排, debutYear 升序)
const PENDING = {
  '郭嘉':   { fac:'caocao',  year:191 },
  '徐晃':   { fac:'caocao',  year:192 },
  '朱灵':   { fac:'caocao',  year:192 },
  '毛玠':   { fac:'caocao',  year:192 },
  '周泰':   { fac:'sunjian', year:193 },
  '蒋钦':   { fac:'sunjian', year:193 },
  '孙乾':   { fac:'liubei',  year:194 },
  '张昭':   { fac:'sunjian', year:194 },
  '齐周':   { fac:'liuyu',   year:194 },
  '程奂':   { fac:'hanfu',   year:194 },
  '周瑜':   { fac:'sunjian', year:195 },
  '吕蒙':   { fac:'sunjian', year:195 },
  '吕范':   { fac:'sunjian', year:195 },
  '满宠':   { fac:'caocao',  year:196 },
  '许褚':   { fac:'caocao',  year:197 },
  '刘晔':   { fac:'caocao',  year:198 },
  '陈群':   { fac:'caocao',  year:198 },
  '贺齐':   { fac:'sunjian', year:199 },
  '曹真':   { fac:'caocao',  year:200 },
  '曹休':   { fac:'caocao',  year:200 },
  '黄忠':   { fac:'liubiao', year:200 },
  '法正':   { fac:'liuyan',  year:200 },
  '黄权':   { fac:'liuyan',  year:200 },
  '关平':   { fac:'liubei',  year:200 },
  '刘封':   { fac:'liubei',  year:200 },
  '孙权':   { fac:'sunjian', year:200 },
  '甘宁':   { fac:'sunjian', year:200 },
  '鲁肃':   { fac:'sunjian', year:200 },
  '朱然':   { fac:'sunjian', year:200 },
  '诸葛瑾': { fac:'sunjian', year:200 },
  '潘璋':   { fac:'sunjian', year:200 },
  '顾雍':   { fac:'sunjian', year:200 },
  '步骘':   { fac:'sunjian', year:200 },
  '朱桓':   { fac:'sunjian', year:200 },
  '李严':   { fac:'liuyan',  year:200 },
  '孟达':   { fac:'liuyan',  year:200 },
  '申耽':   { fac:null,      year:200 },  // 上庸豪族 无 fac
  '雷铜':   { fac:'liuyan',  year:200 },
  '徐庶':   { fac:'liubei',  year:201 },
  '曹丕':   { fac:'caocao',  year:204 },
  '陆逊':   { fac:'sunjian', year:204 },
  '凌统':   { fac:'sunjian', year:204 },
  '鲜于辅': { fac:'liuyu',   year:204 },
  '诸葛亮': { fac:'liubei',  year:207 },
  '司马懿': { fac:'caocao',  year:208 },
  '蒋济':   { fac:'caocao',  year:208 },
  '文聘':   { fac:'liubiao', year:208 },
  '鲜于银': { fac:'liuyu',   year:208 },
  '牛金':   { fac:'caocao',  year:209 },
  '庞统':   { fac:'liubei',  year:209 },
  '孙尚香': { fac:'sunjian', year:209 },
  '曹植':   { fac:'caocao',  year:210 },
  '徐盛':   { fac:'sunjian', year:210 },
  '魏延':   { fac:'liubei',  year:211 },
  '廖化':   { fac:'liubei',  year:211 },
  '马岱':   { fac:'matenghan', year:211 },
  '张翼':   { fac:'liubei',  year:211 },
  '霍峻':   { fac:'liubei',  year:211 },
  '马谡':   { fac:'liubei',  year:211 },
  '蒋琬':   { fac:'liubei',  year:211 },
  '骆统':   { fac:'sunjian', year:212 },
  '郭女王': { fac:'caocao',  year:213 },
  '邓芝':   { fac:'liubei',  year:214 },
  '郭淮':   { fac:'caocao',  year:215 },
  '王平':   { fac:'caocao',  year:215 },  // 215 时归曹, 后投蜀
  '关兴':   { fac:'liubei',  year:215 },
  '张苞':   { fac:'liubei',  year:215 },
  '吴班':   { fac:'liubei',  year:215 },
  '郝昭':   { fac:'caocao',  year:215 },
  '曹彰':   { fac:'caocao',  year:218 },
  '杨洪':   { fac:'liubei',  year:218 },
  '夏侯霸': { fac:'caocao',  year:219 },
  '全琮':   { fac:'sunjian', year:219 },
  '留赞':   { fac:'sunjian', year:220 },
  '姜维':   { fac:'caocao',  year:220 },  // 220 时归曹魏, 后归蜀
  '董允':   { fac:'liubei',  year:221 },
  '向宠':   { fac:'liubei',  year:221 },
  '费祎':   { fac:'liubei',  year:221 },
  '王基':   { fac:'caocao',  year:222 },
  '马忠':   { fac:'liubei',  year:222 },
  '诸葛恪': { fac:'sunjian', year:222 },
  '丁奉':   { fac:'sunjian', year:225 },
  '孟获':   { fac:null,      year:225 },  // 南蛮 无 fac
  '祝融':   { fac:null,      year:225 },  // 南蛮 无 fac
  '陈泰':   { fac:'caocao',  year:232 },
  '吕据':   { fac:'sunjian', year:232 },
  '司马昭': { fac:'caocao',  year:235 },
  '施绩':   { fac:'sunjian', year:240 },
  '王濬':   { fac:'caocao',  year:240 },
  '邓艾':   { fac:'caocao',  year:243 },
  '羊祜':   { fac:'caocao',  year:243 },
  '陆抗':   { fac:'sunjian', year:246 },
  '钟会':   { fac:'caocao',  year:247 },
  '文鸯':   { fac:'caocao',  year:255 },
};

function genEntry(name, p) {
  const facPart = p.fac !== null ? `"pendingFac":"${p.fac}", ` : '';
  return `    "${name}": { "status":"pending", "fac":"wild", ${facPart}"availableYear":${p.year}, "wildData":{ "title":null, "post":{"name":"待时未仕","rank":"民","desc":"${p.year} 才出仕"}, "loyalty":50, "merit":0, "retainer":{"count":0,"type":""}, "relations":[] }},`;
}

let text = fs.readFileSync(FILE, 'utf8');
const before = text;

// 插入点: 14 wild 之后, 在 `  },` (generals block close) 之前
const insertMarker = '"臧霸":   { "status":"wild"';
const idx = text.indexOf(insertMarker);
if (idx < 0) { console.error('insert marker not found'); process.exit(1); }
// 找该行的下一个 newline, 再找下一个 newline (空行)
const lineEnd = text.indexOf('\n', idx);
const insertPoint = lineEnd + 1;

const entries = Object.entries(PENDING).map(([n, p]) => genEntry(n, p)).join('\n');
const insertText = `\n    // ── pending 池 (96) — 191+ 出仕,按 availableYear 升序 ──\n${entries}\n`;
text = text.slice(0, insertPoint) + insertText + text.slice(insertPoint);

fs.writeFileSync(FILE, text, 'utf8');

const count = Object.keys(PENDING).length;
console.log(`Inserted ${count} pending entries`);

try {
  require('child_process').execSync(`node --check ${FILE}`, { stdio: 'pipe' });
  console.log('Syntax OK');
} catch (e) {
  console.error('❌ Syntax error, reverting');
  fs.writeFileSync(FILE, before, 'utf8');
  process.exit(1);
}
