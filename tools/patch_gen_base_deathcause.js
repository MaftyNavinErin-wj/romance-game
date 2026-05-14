#!/usr/bin/env node
// tools/patch_gen_base_deathcause.js
//
// 给 GEN_BASE 212 entries 加 deathCause 字段 (插在 debutYear 之后).
//
// 数据源:
//   - 176 个有 deathYear 的: codex 史实分类 natural/violent (tmp/codex_deathcause_result.md)
//   - 36 个 deathYear=null 的: deathCause=null (史载不详, 跟 deathYear=null 语义一致;
//     runtime 当 compute 处理 — 跟 violent 同行为, 但不贴假 label)
//
// 设计见 docs/scenario_system.md §5.6.
// 用法: node tools/patch_gen_base_deathcause.js

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'src/data/general_base.js');
const CODEX_RESULT = path.resolve(__dirname, '..', 'tmp/codex_deathcause_result.md');

// ── parse codex 分类结果 ──
const codexText = fs.readFileSync(CODEX_RESULT, 'utf8');
const CODEX_CAUSE = {};
for (const line of codexText.split('\n')) {
  const m = line.match(/^(\S+)\s*\|\s*(natural|violent)\s*\|/);
  if (m) CODEX_CAUSE[m[1]] = m[2];
}
console.log('codex 分类条数: ' + Object.keys(CODEX_CAUSE).length);

// ── load GEN_BASE ──
const srcText = fs.readFileSync(TARGET, 'utf8');
const cleaned = srcText
  .replace(/^const GEN_BASE = /m, 'module.exports = ')
  .replace(/^if\s*\(typeof[\s\S]*$/m, '');
const tmpPath = path.resolve(__dirname, '..', 'tmp/tmp_gen_base.js');
fs.writeFileSync(tmpPath, cleaned);
delete require.cache[tmpPath];
const data = require(tmpPath);

// ── 决定每个 entry 的 deathCause ──
const cause = {};   // value: 'natural' | 'violent' | null
let fromCodex = 0, forcedNull = 0, missing = [];
for (const [name, entry] of Object.entries(data)) {
  if (entry.deathCause !== undefined) { continue; } // 已有, 跳过
  if (entry.deathYear == null) {
    cause[name] = null;        // 史载不详 — 跟 deathYear=null 语义一致
    forcedNull++;
  } else if (CODEX_CAUSE[name]) {
    cause[name] = CODEX_CAUSE[name];
    fromCodex++;
  } else {
    missing.push(name);        // 有 deathYear 但 codex 没分类 — 不该发生
  }
}
console.log('from codex: ' + fromCodex + ', deathCause=null (null deathYear): ' + forcedNull);
if (missing.length) {
  console.error('!! 有 deathYear 但 codex 漏分类: ' + missing.join(', '));
  process.exit(1);
}

// 分布统计
let nat = 0, vio = 0, nul = 0;
for (const c of Object.values(cause)) {
  if (c === 'natural') nat++; else if (c === 'violent') vio++; else nul++;
}
console.log('最终分布: natural ' + nat + ' / violent ' + vio + ' / null ' + nul + ' = ' + (nat + vio + nul));

// ── write back: 在 debutYear 之后插入 deathCause ──
let output = srcText;
let inserted = 0;
for (const [name, c] of Object.entries(cause)) {
  const nameEsc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 捕获 "<name>": { ... "debutYear": <num>,  + 其后的空白(可能是 " " 或 "\n    ")
  const re = new RegExp(`("${nameEsc}":\\s*\\{[\\s\\S]{0,3000}?"debutYear":\\s*-?\\d+,)(\\s*)"`);
  const valStr = (c === null) ? 'null' : `"${c}"`;
  const before = output;
  output = output.replace(re, `$1$2"deathCause": ${valStr},$2"`);
  if (output !== before) inserted++;
  else console.warn('!! 插入失败: ' + name);
}
fs.writeFileSync(TARGET, output);
console.log('\nWrote ' + TARGET);
console.log('inserted ' + inserted + ' / ' + Object.keys(cause).length + ' deathCause fields.');
