#!/usr/bin/env node
// tools/patch_214_membership_cleanup.js
//
// 机制 1 (剧本成员过滤) 应用到 SCENARIO_214:
// 移除史实 deathYear < 214 的 8 个武将 + 清理下游引用.
//
// 8 dead: 郭嘉(207)/荀彧(212)/李典(209)/张绣(207)/曹纯(210)/周瑜(210)/张松(212)/张任(213)
//
// 动作:
//   1. 删 SCENARIO_214.generals 里 8 个 entry
//   2. 删 factions.wu.foundingCore 里的 周瑜
//   3. 清所有 entry 的 relations / wildData.relations 里指向这 8 个的反引
//
// 安全: round-trip check — 确保 JSON.stringify 重出格式跟原文 body 一致, 不一致则 abort.
//
// 用法: node tools/patch_214_membership_cleanup.js

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'src/data/scenarios/214.js');
const DEAD = ['郭嘉', '荀彧', '李典', '张绣', '曹纯', '周瑜', '张松', '张任'];
const DEAD_SET = new Set(DEAD);

const srcText = fs.readFileSync(TARGET, 'utf8');

// ── split header + JSON body ──
const marker = 'const SCENARIO_214 = ';
const markerIdx = srcText.indexOf(marker);
if (markerIdx === -1) { console.error('!! marker not found'); process.exit(1); }
const header = srcText.slice(0, markerIdx + marker.length);
let rest = srcText.slice(markerIdx + marker.length);
// rest = "{ ... };\n"  —— strip trailing ; and whitespace
const semiIdx = rest.lastIndexOf('}');
const bodyText = rest.slice(0, semiIdx + 1);
const trailer = rest.slice(semiIdx + 1); // ";\n" 等

const data = JSON.parse(bodyText);

// ── round-trip safety check ──
const roundTrip = JSON.stringify(data, null, 2);
if (roundTrip !== bodyText) {
  console.error('!! round-trip mismatch — JSON.stringify 重出格式跟原文不一致, abort.');
  // 找第一处差异
  for (let i = 0; i < Math.max(roundTrip.length, bodyText.length); i++) {
    if (roundTrip[i] !== bodyText[i]) {
      console.error('   first diff at char ' + i + ':');
      console.error('   orig: ...' + JSON.stringify(bodyText.slice(Math.max(0,i-40), i+40)));
      console.error('   rt  : ...' + JSON.stringify(roundTrip.slice(Math.max(0,i-40), i+40)));
      break;
    }
  }
  process.exit(1);
}
console.log('round-trip check: PASS (格式可安全重出)');

// ── 1. 删 8 个 generals entry ──
let removed = [];
for (const name of DEAD) {
  if (data.generals[name]) {
    removed.push(name + '(' + data.generals[name].status + ')');
    delete data.generals[name];
  } else {
    console.warn('   !! ' + name + ' not in generals roster');
  }
}
console.log('删 generals: ' + removed.join(', '));

// ── 2. 删 foundingCore 引用 ──
let fcRemoved = [];
for (const [fid, f] of Object.entries(data.factions || {})) {
  if (Array.isArray(f.foundingCore)) {
    const before = f.foundingCore.length;
    f.foundingCore = f.foundingCore.filter(n => !DEAD_SET.has(n));
    if (f.foundingCore.length !== before) {
      fcRemoved.push(fid + ' (-' + (before - f.foundingCore.length) + ')');
    }
  }
}
console.log('删 foundingCore 引用: ' + (fcRemoved.join(', ') || '(无)'));

// ── 3. 清 relations / wildData.relations 反引 ──
let relCleaned = [];
function cleanRelations(arr, ownerName) {
  if (!Array.isArray(arr)) return arr;
  const before = arr.length;
  const filtered = arr.filter(r => !DEAD_SET.has(r.target));
  if (filtered.length !== before) {
    const dropped = arr.filter(r => DEAD_SET.has(r.target)).map(r => r.target);
    relCleaned.push(ownerName + ' → ' + dropped.join(','));
  }
  return filtered;
}
for (const [name, entry] of Object.entries(data.generals)) {
  if (Array.isArray(entry.relations)) {
    entry.relations = cleanRelations(entry.relations, name);
  }
  if (entry.wildData && Array.isArray(entry.wildData.relations)) {
    entry.wildData.relations = cleanRelations(entry.wildData.relations, name + '(wildData)');
  }
}
console.log('清 relations 反引 (' + relCleaned.length + ' entries):');
relCleaned.forEach(r => console.log('  ' + r));

// ── counts ──
let active = 0, wild = 0, pending = 0;
for (const v of Object.values(data.generals)) {
  if (v.status === 'active') active++;
  else if (v.status === 'wild') wild++;
  else if (v.status === 'pending') pending++;
}
console.log('\n移除后 count: active ' + active + ' / wild ' + wild + ' / pending ' + pending + ' = ' + (active + wild + pending));

// ── write back ──
const newBody = JSON.stringify(data, null, 2);
fs.writeFileSync(TARGET, header + newBody + trailer);
console.log('\nWrote ' + TARGET);
