// tmp_audit_190_wild.js — 一次性 audit, 算 SCENARIO_190 wild + pending 候选名单
//
// 规则:
//   if deathYear !== null && deathYear ≤ 190: 不进 (190 时已死)
//   elif debutYear ≤ 190: candidate wild (190 时已出仕但 not in active list)
//   else (debutYear > 190 || debutYear === null): candidate pending
//
// "未出生" (birthYear > 190) 也进 pending (按 design)
// active 名单从 SCENARIO_190.generals 提取
const fs = require('fs');

// 读 GEN_BASE
const gbText = fs.readFileSync('src/data/general_base.js', 'utf8');
const entryRe = /^  "([^"]+)":\s*\{/gm;
const names = [...gbText.matchAll(entryRe)].map(m=>m[1]);

function getField(name, field) {
  const idx = gbText.indexOf(`"${name}":`);
  const block = gbText.slice(idx, idx + 1500);
  const m = block.match(new RegExp(`"${field}":\\s*(null|\\d+)`));
  if (!m) return null;
  return m[1] === 'null' ? null : parseInt(m[1]);
}

// 读 SCENARIO_190 active 名单
const s190 = fs.readFileSync('src/data/scenarios/190.js', 'utf8');
const activeNames = [...s190.matchAll(/"([^"]+)":\s*\{\s*"status":"active"/g)].map(m=>m[1]);
console.log(`SCENARIO_190 active 名单: ${activeNames.length} entries`);

const wildCandidates = [];
const pendingCandidates = [];
const dead = [];
const inActive = [];

for (const name of names) {
  const b = getField(name, 'birthYear');
  const d = getField(name, 'deathYear');
  const du = getField(name, 'debutYear');

  if (activeNames.includes(name)) { inActive.push(name); continue; }
  if (d !== null && d <= 190) { dead.push({name, d}); continue; }

  if (du !== null && du <= 190) {
    wildCandidates.push({name, b, d, du});
  } else {
    // pending: debutYear > 190 or null
    pendingCandidates.push({name, b, d, du});
  }
}

console.log(`\n=== Wild 候选 (${wildCandidates.length}) — 190 时已出仕但 not in active ===`);
wildCandidates.sort((a,b)=>(a.du||0)-(b.du||0)).forEach(g => {
  console.log(`  ${g.name.padEnd(8,' ')} b=${g.b ?? '?'} d=${g.d ?? '?'} debut=${g.du}`);
});

console.log(`\n=== Pending 候选 (${pendingCandidates.length}) — debutYear > 190 或 null ===`);
pendingCandidates.sort((a,b)=>(a.du??9999)-(b.du??9999)).forEach(g => {
  console.log(`  ${g.name.padEnd(8,' ')} b=${g.b ?? '?'} d=${g.d ?? '?'} debut=${g.du ?? '?'}`);
});

console.log(`\n=== 190 已死 (${dead.length}) — 不进 scenario ===`);
dead.forEach(g => console.log(`  ${g.name} d=${g.d}`));

console.log(`\n汇总: active=${inActive.length} wild_cand=${wildCandidates.length} pending_cand=${pendingCandidates.length} dead=${dead.length} 总=${names.length}`);
