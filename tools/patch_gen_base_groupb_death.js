#!/usr/bin/env node
// tools/patch_gen_base_groupb_death.js
//
// Task A of SCENARIO_214 reverse-audit:
// 给 18 个 "不在 214 名册的 null-deathYear" 武将补 deathYear + deathCause.
//
// 数据源: tmp/codex_groupb_result.md (codex 史实估算 estDeathYear + deathCause)
//   - 13 个 estDeathYear < 214 (190s-200s 就死了) → membership filter 修正, 不再误进 214
//   - 5 个 estDeathYear >= 214 (降曹活到曹魏) → 是 "该加进 214" 的候选
//
// 两个字段当前都是 null, 替换成估算值.
// 用法: node tools/patch_gen_base_groupb_death.js

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'src/data/general_base.js');
const CODEX_RESULT = path.resolve(__dirname, '..', 'tmp/codex_groupb_result.md');

// ── parse codex 结果 ──
const codexText = fs.readFileSync(CODEX_RESULT, 'utf8');
const PLAN = {};  // name -> {deathYear, deathCause}
for (const line of codexText.split('\n')) {
  // name | estDeathYear | aliveIn214 | deathCause | anchor
  const m = line.match(/^(\S+)\s*\|\s*(\d+)\s*\|\s*(yes|no)\s*\|\s*(natural|violent)\s*\|/);
  if (m) PLAN[m[1]] = { deathYear: parseInt(m[2], 10), deathCause: m[4] };
}
console.log('codex plan 条数: ' + Object.keys(PLAN).length);

const srcText = fs.readFileSync(TARGET, 'utf8');
let output = srcText;
let done = 0;
for (const [name, p] of Object.entries(PLAN)) {
  const nameEsc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 该 entry 当前 deathYear:null + deathCause:null. 定位整个 entry 块, 同时替换两个 null.
  // 用两次独立 replace, 各自限定在该 name 的 entry 内.
  const reDY = new RegExp(`("${nameEsc}":\\s*\\{[\\s\\S]{0,3000}?"deathYear":\\s*)null`);
  const reDC = new RegExp(`("${nameEsc}":\\s*\\{[\\s\\S]{0,3000}?"deathCause":\\s*)null`);
  const before = output;
  output = output.replace(reDY, `$1${p.deathYear}`);
  output = output.replace(reDC, `$1"${p.deathCause}"`);
  if (output !== before) done++;
  else console.warn('!! 替换失败: ' + name);
}

fs.writeFileSync(TARGET, output);
console.log('updated ' + done + ' / ' + Object.keys(PLAN).length + ' entries.');

// 统计
const alive214 = [], dead214 = [];
for (const [n, p] of Object.entries(PLAN)) {
  if (p.deathYear >= 214) alive214.push(n + '(' + p.deathYear + ')');
  else dead214.push(n + '(' + p.deathYear + ')');
}
console.log('\nestDeathYear >= 214 (该加进 214 候选): ' + alive214.length);
console.log('  ' + alive214.join(', '));
console.log('estDeathYear < 214 (修正后不再误进 214): ' + dead214.length);
console.log('  ' + dead214.join(', '));
