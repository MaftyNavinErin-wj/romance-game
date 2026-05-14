#!/usr/bin/env node
// tools/patch_gen_base_birthyear.js
//
// 补 GEN_BASE.birthYear null 字段, 156 entries 全覆盖.
//
// 数据源 (优先级):
//   1. CODEX_H_M (73): codex 史实/KOEI 标定 (H + M) — 优先
//   2. MANUAL_OVERRIDE: CC spot-check 修 codex 错值 (蒋琬 等)
//   3. HEURISTIC (83): codex 给 L 的, 用算法兜底
//      - warrior/commander → debutYear - 20
//      - strategist/civilian/other → debutYear - 25
//      - 若 deathYear 已知 且 计算寿命 < 30 → 改成 deathYear - 35 (sanity)
//
// 设计意图: 史实优先, 不详的用 不出戏 heuristic. 不追求 100% 精度.
// birthYear 当前不影响 runtime (phase 6 wire 才用).
//
// 用法: node tools/patch_gen_base_birthyear.js

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'src/data/general_base.js');

// ── codex 史实/KOEI 标定 (H + M = 73 entries) ─────────────────
const CODEX_VALUES = {
  // H (10) — 史载卒年年齿反推
  '夏侯惇': 157, '王朗': 152, '李典': 174, '刘晔': 171, '陈群': 189,
  '曹彰': 189, '陈泰': 200, '董允': 192, '陈登': 163,
  // 蒋琬 codex 给 168 错, 史载"年六十二", 死 246 → 184 (CC manual override)
  '蒋琬': 184,
  // M (63) — KOEI 常用标定
  '乐进': 160, '于禁': 162, '张郃': 167, '夏侯渊': 160, '许褚': 170,
  '满宠': 178, '曹洪': 168, '郭淮': 187, '臧霸': 162, '蒋济': 188,
  '朱灵': 156, '曹真': 185, '曹休': 188, '徐庶': 174, '文聘': 178,
  '王平': 199, '关羽': 160, '张飞': 167, '赵云': 168, '黄忠': 148,
  '魏延': 174, '廖化': 170, '马岱': 185, '张翼': 188, '吴懿': 166,
  '马忠': 190, '黄权': 179, '关平': 178, '关兴': 194, '刘封': 188,
  '糜竺': 165, '孙乾': 163, '简雍': 161, '夏侯霸': 202, '甘宁': 175,
  '黄盖': 145, '丁奉': 190, '程普': 154, '韩当': 156, '徐盛': 177,
  '潘璋': 180, '贺齐': 178, '步骘': 179, '周泰': 163, '蒋钦': 168,
  '吕范': 160, '吕据': 210, '留赞': 183, '施绩': 235, '庞德': 170,
  '李严': 175, '孟达': 176, '郝昭': 195, '费祎': 200, '典韦': 160,
  '陈宫': 154, '董卓': 132, '吕布': 156, '袁绍': 154, '袁术': 155,
  '公孙瓒': 154, '马腾': 156, '韩遂': 145,
};

// ── codex final review catch 后 CC 决定的 override (6 entries) ───
// 父子代差 / KOEI 折中 ; 触发 codex 终审 NEEDS-WORK 后 CC 修.
const MANUAL_OVERRIDE = {
  '夏侯霸': 195,  // codex 202 → 195: 父 夏侯渊 b160, 代差 35 更合理
  '陆抗':   218,  // codex 226 → 218: 父 陆逊 b183, 代差 35; 史载 274 卒 56 岁
  '马休':   178,  // heuristic 170 → 178: 父 马腾 b156, 跟 马超 b176 同辈
  '马铁':   178,  // 同 马休
  '刘琮':   177,  // codex 183 → 177: 父 刘表 b142, 代差 35
  '廖化':   180,  // heuristic 191 → 180: 折中, 史载"年八十余" → 寿 84
  // 保留 (codex 提议不改):
  //   - 钟会 b225 (父 钟繇 b151, 代差 74): 史载钟繇高龄得子, 特殊
  //   - 董卓 b132 (debut 189, debutAge 57): KOEI 史载经典, 矛盾来自 debutYear schema 局限 (董卓
  //     早期凉州羽林郎未含), 留 debutYear followup, 不动 birthYear
};

function deriveHeuristic(entry){
  if(entry.debutYear == null) return null;
  const tag = entry.classTag || 'other';
  const offset = (tag === 'warrior' || tag === 'commander') ? 20 : 25;
  let by = entry.debutYear - offset;
  if(entry.deathYear != null && entry.deathYear - by < 30){
    by = entry.deathYear - 35;
  }
  return by;
}

// Load GEN_BASE
const srcText = fs.readFileSync(TARGET, 'utf8');
const cleaned = srcText
  .replace(/^const GEN_BASE = /m, 'module.exports = ')
  .replace(/^if\s*\(typeof[\s\S]*$/m, '');
const tmpPath = path.resolve(__dirname, '..', 'tmp/tmp_gen_base.js');
fs.writeFileSync(tmpPath, cleaned);
delete require.cache[tmpPath];
const data = require(tmpPath);

// Compute updates: codex first, sanity check, heuristic fallback
const updates = {};
const sourceOf = {};
const sanityFallback = [];
let codexCount = 0, heuristicCount = 0, skippedCount = 0;
let nullCount = 0;
for(const [name, entry] of Object.entries(data)){
  if(entry.birthYear != null) continue;
  nullCount++;
  const codex = CODEX_VALUES[name];
  if(codex != null){
    // sanity: 若 codex 值与我们 audit'd debutYear/deathYear 冲突
    // (debutAge < 15 = 童子出仕 / lifespan > 80 = 长寿过头) → 弃 codex, 用 heuristic
    const debutAge = entry.debutYear - codex;
    const lifespan = entry.deathYear != null ? entry.deathYear - codex : 50;
    if(debutAge < 15 || lifespan > 85){
      const h = deriveHeuristic(entry);
      if(h != null){
        sanityFallback.push({name, codex, heuristic: h, debutAge, lifespan});
        updates[name] = h;
        sourceOf[name] = 'heuristic(codex-rejected)';
        heuristicCount++;
        continue;
      }
    }
    updates[name] = codex;
    sourceOf[name] = 'codex';
    codexCount++;
  } else {
    const h = deriveHeuristic(entry);
    if(h == null){
      skippedCount++;
      continue;
    }
    updates[name] = h;
    sourceOf[name] = 'heuristic';
    heuristicCount++;
  }
}

if(sanityFallback.length > 0){
  console.log(`\nSanity rule rejected ${sanityFallback.length} codex values (conflict with audit'd debut/death):`);
  sanityFallback.forEach(s => console.log(`  ${s.name}: codex b${s.codex} (debut age ${s.debutAge}, lifespan ${s.lifespan}) → heuristic b${s.heuristic}`));
}

// ── apply MANUAL_OVERRIDE (post codex final review) ───
// 注意: override 不限于本批次 null fill, 可覆盖 pre-existing entry
// (e.g., 陆抗 pre-existing b226 跟 父陆逊 b183 代差 43, 改 218)
let overrideCount = 0;
for(const [name, by] of Object.entries(MANUAL_OVERRIDE)){
  if(!data[name]) continue;
  const prev = updates[name] != null ? updates[name] : data[name].birthYear;
  updates[name] = by;
  sourceOf[name] = 'manual_override';
  overrideCount++;
  console.log(`Manual override: ${name} ${prev} → ${by}`);
}
console.log(`Applied ${overrideCount} manual overrides.`);

console.log(`Total entries: ${Object.keys(data).length}`);
console.log(`birthYear null before: ${nullCount}`);
console.log(`Codex史实/KOEI 标定: ${codexCount}`);
console.log(`Heuristic 推算: ${heuristicCount}`);
console.log(`Skipped (no anchor): ${skippedCount}`);

// Stats
const lifespans = [];
const debutAges = [];
for(const [name, by] of Object.entries(updates)){
  const e = data[name];
  if(e.deathYear != null) lifespans.push({name, lifespan: e.deathYear - by, src: sourceOf[name]});
  debutAges.push({name, age: e.debutYear - by, src: sourceOf[name]});
}
lifespans.sort((a,b) => a.lifespan - b.lifespan);
debutAges.sort((a,b) => a.age - b.age);
console.log(`\nLifespan range:`);
console.log(`  shortest 5:`, lifespans.slice(0,5).map(x => `${x.name}(${x.lifespan},${x.src[0]})`).join(', '));
console.log(`  longest 5:`, lifespans.slice(-5).map(x => `${x.name}(${x.lifespan},${x.src[0]})`).join(', '));
console.log(`\nDebut age range:`);
console.log(`  earliest 5:`, debutAges.slice(0,5).map(x => `${x.name}(${x.age},${x.src[0]})`).join(', '));
console.log(`  latest 5:`, debutAges.slice(-5).map(x => `${x.name}(${x.age},${x.src[0]})`).join(', '));

// Write back: in-place regex replace. Match both null and number.
let output = srcText;
let replaced = 0;
for(const [name, by] of Object.entries(updates)){
  const nameEscaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`("${nameEscaped}":\\s*\\{[\\s\\S]{0,3000}?"birthYear":\\s*)(?:null|\\d+)`);
  const before = output;
  output = output.replace(re, `$1${by}`);
  if(output !== before) replaced++;
  else console.warn(`!! failed to replace birthYear for ${name}`);
}

fs.writeFileSync(TARGET, output);
console.log(`\nWrote ${TARGET}`);
console.log(`Replaced ${replaced} / ${Object.keys(updates).length} entries.`);
