// verify_w5b.js — 验 F-W4c-3 fix + pendingPool 切换
'use strict';
const d = require('./w5b_tree.json');
for (const sid of ['214', '190']) {
  const fishy = Object.entries(d[sid].chronicleText).filter(([n, t]) => t.includes('仕于undefined'));
  const fixed = Object.entries(d[sid].chronicleText).filter(([n, t]) => t.includes('仕于在野'));
  console.log(`[${sid}] pendingPool=${d[sid].pendingPoolCount} 仕于undefined=${fishy.length} 仕于在野=${fixed.length}`);
  if (fishy.length) console.log(`   undefined hits: ${fishy.slice(0, 5).map(([n]) => n).join(', ')}`);
  if (fixed.length) console.log(`   在野 e.g.: ${fixed.slice(0, 5).map(([n]) => n).join(', ')}`);
  if (d[sid].pendingPoolEntries.length) {
    console.log(`   pendingPool entries: ${d[sid].pendingPoolEntries.slice(0, 5).map(p => `${p.name}→${p._pendingFac}@${p.minTurn}`).join(', ')}${d[sid].pendingPoolEntries.length > 5 ? `... (+${d[sid].pendingPoolEntries.length - 5})` : ''}`);
  }
}
