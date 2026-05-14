#!/usr/bin/env node
// tools/patch_gen_base_groupa_death.js
//
// SCENARIO_214 reverse-audit followup:
// 给 18 个 "在 214 名册里的 null-deathYear" 武将补 deathYear + deathCause.
//
// 这 18 个都活过 214 (在 214 名册), 对 214 无害, 但未来 SCENARIO_250 之类
// 会因 "null → 永远可进" 规则误算成永远活着. 补估算值修根因.
//
// 数据源: tmp/codex_groupa_result.md (codex 史实估算 estDeathYear + deathCause)
// 两个字段当前都是 null, 替换成估算值.
// 用法: node tools/patch_gen_base_groupa_death.js

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'src/data/general_base.js');
const CODEX_RESULT = path.resolve(__dirname, '..', 'tmp/codex_groupa_result.md');

// ── parse codex 结果: name | estDeathYear | deathCause | anchor ──
const codexText = fs.readFileSync(CODEX_RESULT, 'utf8');
const PLAN = {};
for (const line of codexText.split('\n')) {
  const m = line.match(/^(\S+)\s*\|\s*(\d+)\s*\|\s*(natural|violent)\s*\|/);
  if (m) PLAN[m[1]] = { deathYear: parseInt(m[2], 10), deathCause: m[3] };
}
console.log('codex plan 条数: ' + Object.keys(PLAN).length);

const srcText = fs.readFileSync(TARGET, 'utf8');
let output = srcText;
let done = 0;
for (const [name, p] of Object.entries(PLAN)) {
  const nameEsc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

let nat = 0, vio = 0;
for (const p of Object.values(PLAN)) { if (p.deathCause === 'natural') nat++; else vio++; }
console.log('分布: natural ' + nat + ' / violent ' + vio);
