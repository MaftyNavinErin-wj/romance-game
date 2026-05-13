// tools/patch_w3_214_audit.js
//
// W3: SCENARIO_214 跨剧本对齐 audit
//
// 两步:
//   1. 扩 GEN_BASE.wildMeta +8 entries (SCENARIO_214 pending 内 GEN_BASE.wildMeta 未覆盖的)
//      → 司马昭/陈泰/王基/关兴/张苞/夏侯霸/诸葛恪/施绩
//   2. 删 SCENARIO_214 24 entries (6 wild + 18 pending) 内 wildData.title 和 wildData.post
//      → 由 GEN_BASE.wildMeta 派生 (cross-scenario default)
//      → wildData 内只留 loyalty/merit/retainer/relations (+ pendingFac/availableYear @pending)
//
// 风险: GEN_BASE / SCENARIO_214 zero runtime consumer (wire @ phase 6), W3 不影响 smoke.

const fs = require('fs');
const { execSync } = require('child_process');

const GB = 'src/data/general_base.js';
const S214 = 'src/data/scenarios/214.js';

// ── Step 1: 扩 wildMeta 8 entries ──────────────────────────────────
const NEW_WILD_META = {
  '司马昭': { title:'路人皆知', post:{ name:'大将军',rank:'文官',desc:'司马懿之子,权倾朝野。' } },
  '陈泰':   { title:'抗蜀名将', post:{ name:'征西将军',rank:'将',desc:'陈群之子,善于防守反击。' } },
  '王基':   { title:'笃行之士', post:{ name:'征南将军',rank:'将',desc:'文武兼备,治军严明。' } },
  '关兴':   { title:'小关张',   post:{ name:'侍中',rank:'将',desc:'继承父志的二代骁将。' } },
  '张苞':   { title:'猛虎之子', post:{ name:'校尉',rank:'将',desc:'张飞之子,武勇过人。' } },
  '夏侯霸': { title:'降蜀宗亲', post:{ name:'车骑将军',rank:'将',desc:'夏侯渊之子,因司马氏篡权而降蜀。' } },
  '诸葛恪': { title:'东兴大捷', post:{ name:'大将军',rank:'将',desc:'诸葛瑾之子,少年成名,东兴之战大破魏军。' } },
  '施绩':   { title:'朱然之嗣', post:{ name:'上大将军',rank:'将',desc:'朱然之子,改姓施,继父业镇守边疆。' } },
};

function entryAlreadyHasWildMeta(text, name) {
  const entryStart = text.indexOf(`"${name}":`);
  if (entryStart < 0) return false;
  const nextEntryRe = /\n  "[^"]+":\s*\{/;
  const after = text.slice(entryStart + name.length + 5);
  const nm = after.match(nextEntryRe);
  const entryEnd = nm ? entryStart + name.length + 5 + nm.index : text.length;
  return text.slice(entryStart, entryEnd).includes('"wildMeta"');
}

let gbText = fs.readFileSync(GB, 'utf8');
const gbBefore = gbText;
const wildPatched = [];

for (const [name, meta] of Object.entries(NEW_WILD_META)) {
  if (entryAlreadyHasWildMeta(gbText, name)) continue;
  const wildMetaJson = JSON.stringify(meta);
  // single-line 格式 (80 新加 entries 风格): `"debutYear": NNN, "birthplace":`
  const slRe = new RegExp(`("${name}":\\s*\\{[^}]*?"debutYear":\\s*\\d+,)\\s*("birthplace":)`);
  const sl = gbText.match(slRe);
  if (sl) {
    gbText = gbText.replace(slRe, (_, p1, p2) => `${p1} "wildMeta": ${wildMetaJson}, ${p2}`);
    wildPatched.push(name);
    continue;
  }
  // multi-line 格式
  const mlRe = new RegExp(`("${name}":\\s*\\{[\\s\\S]*?"debutYear":\\s*\\d+,)(\\s*\\n\\s*)("birthplace":)`);
  const ml = gbText.match(mlRe);
  if (ml) {
    gbText = gbText.replace(mlRe, (_, p1, p2, p3) => `${p1}${p2}"wildMeta": ${wildMetaJson},${p2}${p3}`);
    wildPatched.push(name);
    continue;
  }
  console.log(`  ${name}: not matched`);
}

fs.writeFileSync(GB, gbText, 'utf8');
console.log(`Step 1: wildMeta extended +${wildPatched.length}/8 entries`);

try { execSync(`node --check ${GB}`, { stdio:'pipe' }); }
catch (e) { console.error('❌ GB syntax error'); fs.writeFileSync(GB, gbBefore, 'utf8'); process.exit(1); }

// ── Step 2: 删 SCENARIO_214 24 entries 内 wildData.title/post ────────
let s214Text = fs.readFileSync(S214, 'utf8');
const s214Before = s214Text;

const TARGET_NAMES = [
  '张松','庞德','孟达','申耽','张任','杨洪',  // wild 6
  '司马昭','陈泰','王基','关兴','张苞','夏侯霸','诸葛恪','施绩',  // pending 8 (新加 wildMeta)
  '李严','邓艾','钟会','郝昭','蒋琬','费祎','姜维','文鸯','羊祜','王濬',  // pending 10 (原 wildMeta)
];

let deleted = 0;
for (const name of TARGET_NAMES) {
  // 找该 entry 内 wildData 块
  const entryStart = s214Text.indexOf(`"${name}":`);
  if (entryStart < 0) { console.log(`  ${name}: not in 214`); continue; }
  const nextEntryRe = /\n    "[^"]+":\s*\{/;
  const after = s214Text.slice(entryStart + name.length + 5);
  const nm = after.match(nextEntryRe);
  const entryEnd = nm ? entryStart + name.length + 5 + nm.index : s214Text.length;
  let block = s214Text.slice(entryStart, entryEnd);

  // 删 title (一行)
  const titleRe = /\s*"title":\s*"[^"]+",?\n/;
  if (titleRe.test(block)) block = block.replace(titleRe, '\n');

  // 删 post block (多行)
  const postRe = /\s*"post":\s*\{[\s\S]*?\},?\n/;
  if (postRe.test(block)) block = block.replace(postRe, '\n');

  s214Text = s214Text.slice(0, entryStart) + block + s214Text.slice(entryEnd);
  deleted++;
}
fs.writeFileSync(S214, s214Text, 'utf8');
console.log(`Step 2: SCENARIO_214 ${deleted}/24 entries title/post 删除`);

try { execSync(`node --check ${S214}`, { stdio:'pipe' }); }
catch (e) { console.error('❌ S214 syntax error'); fs.writeFileSync(S214, s214Before, 'utf8'); process.exit(1); }

console.log('Done.');
