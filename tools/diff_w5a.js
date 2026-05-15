// diff_w5a.js — 对比 W5a-tree vs main dump, 审差异区分 (1) 预期 audit (2) plumbing bug
'use strict';
const fs = require('fs');
const main = JSON.parse(fs.readFileSync('tools/w5a_main.json', 'utf8'));
const tree = JSON.parse(fs.readFileSync('tools/w5a_tree.json', 'utf8'));

function setDiff(a, b) {
  const sA = new Set(a), sB = new Set(b);
  return { onlyA: [...sA].filter(x => !sB.has(x)).sort(), onlyB: [...sB].filter(x => !sA.has(x)).sort() };
}
function compareNumMap(mapA, mapB, names) {
  const drift = [];
  for (const n of names) {
    if (mapA[n] !== mapB[n]) drift.push(`${n}: ${mapA[n]} → ${mapB[n]}`);
  }
  return drift;
}

for (const sid of ['214', '190']) {
  console.log(`\n===== SCENARIO ${sid} =====`);
  const m = main[sid], t = tree[sid];

  console.log('-- counts --');
  console.log(`wildDefs:   ${m.wildDefsCount} → ${t.wildDefsCount}`);
  console.log(`wildPool:   ${m.wildPoolCount} → ${t.wildPoolCount}`);
  console.log(`pendingPool:${m.pendingPoolCount} → ${t.pendingPoolCount}`);
  console.log(`genLoyalty: ${m.counts.genLoyalty} → ${t.counts.genLoyalty}`);
  console.log(`intimacy:   ${m.counts.intimacy} → ${t.counts.intimacy}`);
  console.log(`chronicle:  ${m.counts.chronicle} → ${t.counts.chronicle}`);
  console.log(`genMerit:   ${m.counts.genMerit} → ${t.counts.genMerit}`);
  console.log(`genRetainers:${m.counts.genRetainers} → ${t.counts.genRetainers}`);
  console.log(`m.WILD_GENS:${m.mWildGensCount} → ${t.mWildGensCount}`);
  console.log(`m.pendingPool:${m.mPendingPoolCount} → ${t.mPendingPoolCount}`);
  console.log(`m.wildMeta: ${m.mWildMetaCount} → ${t.mWildMetaCount}`);
  console.log(`m.intimacyPairs:${m.mIntimacyPairsCount} → ${t.mIntimacyPairsCount}`);
  console.log(`m.initialMerit:${m.mInitialMeritCount} → ${t.mInitialMeritCount}`);
  console.log(`m.initialRetainers:${m.mInitialRetainersCount} → ${t.mInitialRetainersCount}`);
  console.log(`NaN: ${m.nanHits.length} → ${t.nanHits.length}`);
  console.log(`initGameThrew: ${m.initGameThrew} → ${t.initGameThrew}`);

  // wildDefs 名册 diff
  const wd = setDiff(m.wildDefsNames, t.wildDefsNames);
  if (wd.onlyA.length || wd.onlyB.length) {
    console.log('-- wildDefsNames diff --');
    if (wd.onlyA.length) console.log(`  removed (main只): [${wd.onlyA.join(', ')}]`);
    if (wd.onlyB.length) console.log(`  added (tree只):   [${wd.onlyB.join(', ')}]`);
  }
  // wildDefs minTurn drift (overlap)
  const overlap = m.wildDefsNames.filter(n => t.wildDefsNames.includes(n));
  const minTurnDrift = compareNumMap(m.wildDefsMinTurn, t.wildDefsMinTurn, overlap);
  if (minTurnDrift.length) {
    console.log('-- minTurn drift (overlap, legacy 手填 → availableYear formula) --');
    minTurnDrift.forEach(d => console.log(`  ${d}`));
  }
  // wildPool 内容 diff
  const wp = setDiff(m.wildPool, t.wildPool);
  if (wp.onlyA.length || wp.onlyB.length) {
    console.log('-- wildPool diff (refreshWildPool 取 5 个, seed 相同但 m.WILD_GENS 不同会变) --');
    if (wp.onlyA.length) console.log(`  removed: [${wp.onlyA.join(', ')}]`);
    if (wp.onlyB.length) console.log(`  added:   [${wp.onlyB.join(', ')}]`);
  }
  // genLoyalty / genMerit drift (only show names present in both)
  const lOver = Object.keys(m.genLoyalty).filter(n => n in t.genLoyalty);
  const lDrift = compareNumMap(m.genLoyalty, t.genLoyalty, lOver);
  if (lDrift.length) {
    console.log(`-- genLoyalty drift (${lDrift.length} entries) --`);
    lDrift.slice(0, 10).forEach(d => console.log(`  ${d}`));
    if (lDrift.length > 10) console.log(`  ... +${lDrift.length - 10} more`);
  }
  const mOver = Object.keys(m.genMerit).filter(n => n in t.genMerit);
  const mDrift = compareNumMap(m.genMerit, t.genMerit, mOver);
  if (mDrift.length) {
    console.log(`-- genMerit drift (${mDrift.length} entries) --`);
    mDrift.slice(0, 10).forEach(d => console.log(`  ${d}`));
    if (mDrift.length > 10) console.log(`  ... +${mDrift.length - 10} more`);
  }
  // genRetainers added/removed names
  const rd = setDiff(Object.keys(m.genRetainers), Object.keys(t.genRetainers));
  if (rd.onlyA.length || rd.onlyB.length) {
    console.log('-- genRetainers names diff --');
    if (rd.onlyA.length) console.log(`  removed (${rd.onlyA.length}): [${rd.onlyA.slice(0,8).join(', ')}${rd.onlyA.length>8?'...':''}]`);
    if (rd.onlyB.length) console.log(`  added   (${rd.onlyB.length}): [${rd.onlyB.slice(0,8).join(', ')}${rd.onlyB.length>8?'...':''}]`);
  }
  // intimacy diff: new keys
  const iAdded = Object.keys(t.intimacy).filter(k => !(k in m.intimacy));
  const iRemoved = Object.keys(m.intimacy).filter(k => !(k in t.intimacy));
  if (iAdded.length || iRemoved.length) {
    console.log('-- intimacy diff --');
    if (iAdded.length) console.log(`  added   (${iAdded.length}): [${iAdded.slice(0,6).join(', ')}${iAdded.length>6?'...':''}]`);
    if (iRemoved.length) console.log(`  removed (${iRemoved.length}): [${iRemoved.slice(0,6).join(', ')}${iRemoved.length>6?'...':''}]`);
  }
  // chronicle 仕于undefined 检查
  const fishyChron = Object.entries(t.chronicleText).filter(([n, txt]) => txt.includes('仕于undefined')).map(([n]) => n);
  if (fishyChron.length) {
    console.log(`-- chronicle "仕于undefined" (F-W4c-3, W5b 修): ${fishyChron.length} 武将 --`);
    console.log(`  e.g. ${fishyChron.slice(0,5).join(', ')}`);
  }
}
