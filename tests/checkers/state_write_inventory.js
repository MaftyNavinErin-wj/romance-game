// tests/checkers/state_write_inventory.js
//
// Checker 3:G 写口 advisory inventory(粗粒度)
//
// ⚠️ F2 修法(codex review):本 checker 是 advisory inventory,**不是 D-120 closure gate**
//   - D-120 真正语义是"per-turn reset"(`nextTurn` 末 `forEach delete`),本 checker 不检查
//   - 本 checker 只看"整局 reset"(backToTitle / initGame)+ save/load idiom
//   - 即使 D-120 修复(per-turn reset 加上),本 checker 仍会报字段为 lifecycle_gap WARN(不是 bug)
//   - 反向也成立:本 checker 通过 ≠ D-120 修好(可能漏)
//
// 目的:
//   (1) 列出所有 G._xxx 顶层动态字段 + 写入 / 读取位置 inventory
//   (2) 标注哪些字段在整局 reset / save / load 闭环中缺失(advisory)
//   (3) 为模式 6 状态生命周期类提供 raw data,人工 + walkthrough 二次确认才是 closure
//
// 服务的 D 类(advisory only,不作 closure):
//   D-120 (G._diploActed_${fid} per-turn reset 缺) — 本 checker 仅 inventory,需配合 walkthrough
//   模式 6 状态生命周期类(普适 inventory)
//
// 工作流原则:
//   - read-only,只产报告
//   - 输出 docs/checker_reports/state_write_inventory.md
//   - 退出码:0 = 报告生成成功(无论 finding 数) / 2 = ERROR
//     注:本 checker 不参与 sprint gate(F5),所有 finding 都是 advisory WARN

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..', '..');
const V181     = path.join(ROOT, 'project_romance_v181.html');
const SRC_DIR  = path.join(ROOT, 'src');
const REPORT_DIR = path.join(ROOT, 'docs', 'checker_reports');
const REPORT     = path.join(REPORT_DIR, 'state_write_inventory.md');

function listSrcFiles(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...listSrcFiles(fp));
    else if (f.name.endsWith('.js')) out.push(fp);
  }
  return out;
}

function classifyChain(filePath) {
  if (filePath.includes('/chains/') || filePath.includes('\\chains\\')) {
    const m = filePath.match(/chains[\/\\](\w+)\.js/);
    return m ? m[1] : 'chains/?';
  }
  if (filePath.includes('/core/') || filePath.includes('\\core\\')) return 'core';
  if (filePath.includes('/data/') || filePath.includes('\\data\\')) return 'data';
  if (filePath.includes('/render/') || filePath.includes('\\render\\')) return 'render';
  if (filePath.endsWith('.html')) return 'v181';
  return '?';
}

// ── (1) 顶层动态字段 G._xxx 全集
function collectDynamicFields() {
  const fields = new Map(); // name -> { writes:[], reads:[], dynamicTemplate?:bool }
  const files = [V181, ...listSrcFiles(SRC_DIR)];
  for (const file of files) {
    const txt = fs.readFileSync(file, 'utf8');
    const lines = txt.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const isComment = trimmed.startsWith('//') || trimmed.startsWith('*');
      // 匹配 G._xxx (限制下划线开头的顶层动态字段)
      const matches = [...line.matchAll(/G\._([A-Za-z][A-Za-z0-9_]*)/g)];
      for (const m of matches) {
        const fullName = 'G._' + m[1];
        if (!fields.has(fullName)) {
          fields.set(fullName, { writes: [], reads: [], comments: [], usages: 0 });
        }
        const f = fields.get(fullName);
        f.usages++;
        if (isComment) {
          // skip; comment 行不计 read/write
          f.comments.push({ file: path.relative(ROOT, file), line: idx + 1 });
          continue;
        }
        // F3 修法(codex review):扩展 mutation 检测,避免低估写口
        // 写形式覆盖:
        //   1. 直接赋值:G._xxx = ... / G._xxx[k] = ... / G._xxx.prop = ...
        //   2. delete:delete G._xxx
        //   3. compound assignment:G._xxx += / -= / *= / /= / **= / %=
        //   4. 自增/自减:G._xxx++ / G._xxx-- / ++G._xxx / --G._xxx
        //   5. mutation methods:.push() / .pop() / .shift() / .unshift() /
        //                       .splice() / .sort() / .reverse() / .fill() / .copyWithin()
        //   6. Object.assign(G._xxx, ...)(注:外面的 Object.assign 调用 — 反向 grep 在 caller 处)
        const afterMatch = line.slice(m.index + m[0].length);
        const beforeMatch = line.slice(0, m.index);
        const isAssign = /^\s*(?:\[[^\]]*\]|\.\w+)*\s*=(?!=)/.test(afterMatch);
        const isCompoundAssign = /^\s*(?:\[[^\]]*\]|\.\w+)*\s*(?:\+=|-=|\*=|\/=|\*\*=|%=)/.test(afterMatch);
        const isIncDec = /^\s*(?:\+\+|--)/.test(afterMatch) || /(?:\+\+|--)\s*$/.test(beforeMatch);
        const isDelete = /\bdelete\s+$/.test(beforeMatch);
        const isMutationMethod = /^\s*\.\s*(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)\s*\(/.test(afterMatch);
        // Object.assign(G._xxx, ...) 检测:本行含 `Object.assign(`,且 G._xxx 是其首参
        const isObjectAssignTarget = /Object\.assign\s*\(\s*G\._/.test(beforeMatch + 'G._' + m[1]) &&
                                      /Object\.assign\s*\(\s*$/.test(beforeMatch);
        const isWrite = isAssign || isDelete || isCompoundAssign || isIncDec || isMutationMethod || isObjectAssignTarget;
        if (isWrite) {
          let kind = 'assign';
          if (isDelete) kind = 'delete';
          else if (isCompoundAssign) kind = 'compound';
          else if (isIncDec) kind = 'inc/dec';
          else if (isMutationMethod) kind = 'mutation';
          else if (isObjectAssignTarget) kind = 'Object.assign';
          f.writes.push({ file: path.relative(ROOT, file), line: idx + 1, kind });
        } else {
          f.reads.push({ file: path.relative(ROOT, file), line: idx + 1 });
        }
      }
      // 模板键 G[`_xxx_${...}`] 检测(D-120 模式)
      const templateMatches = [...line.matchAll(/G\s*\[\s*[`'"]_([A-Za-z][A-Za-z0-9_]*)/g)];
      for (const m of templateMatches) {
        const baseName = 'G._' + m[1] + '_<dynamic>';
        if (!fields.has(baseName)) {
          fields.set(baseName, { writes: [], reads: [], comments: [], usages: 0, dynamicTemplate: true });
        }
        const f = fields.get(baseName);
        f.usages++;
        if (isComment) continue;
        // 模板键完整形式 G[`_xxx_${...}`] 之后是 `]`,然后才是赋值/方法调用/运算符
        const afterMatch = line.slice(m.index + m[0].length);
        const beforeMatch = line.slice(0, m.index);
        // 找模板字面量的结束位置(] 后面的位置)
        const closingBracketMatch = afterMatch.match(/^[^\]]*\]/);
        const afterBracket = closingBracketMatch ? afterMatch.slice(closingBracketMatch[0].length) : afterMatch;
        const isAssign = /^\s*(?:\[[^\]]*\]|\.\w+)*\s*=(?!=)/.test(afterBracket);
        const isCompoundAssign = /^\s*(?:\[[^\]]*\]|\.\w+)*\s*(?:\+=|-=|\*=|\/=|\*\*=|%=)/.test(afterBracket);
        const isIncDec = /^\s*(?:\+\+|--)/.test(afterBracket);
        const isDelete = /\bdelete\s+$/.test(beforeMatch);
        const isMutationMethod = /^\s*\.\s*(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)\s*\(/.test(afterBracket);
        const isWrite = isAssign || isDelete || isCompoundAssign || isIncDec || isMutationMethod;
        if (isWrite) {
          let kind = 'assign';
          if (isDelete) kind = 'delete';
          else if (isCompoundAssign) kind = 'compound';
          else if (isIncDec) kind = 'inc/dec';
          else if (isMutationMethod) kind = 'mutation';
          f.writes.push({ file: path.relative(ROOT, file), line: idx + 1, kind });
        } else {
          f.reads.push({ file: path.relative(ROOT, file), line: idx + 1 });
        }
      }
    });
  }
  return fields;
}

// ── (2) 检测生命周期 hook(reset / save / load)
function checkLifecycleHooks(fields) {
  // 在 backToTitle / initGame / saveGame / _serializeG / _deserializeG / loadFromSlot 函数体内检查每个字段
  const allFiles = [V181, ...listSrcFiles(SRC_DIR)];
  // 实测此 repo 的 lifecycle 函数(grep 'function xxx(' 验证)
  // 注:saveGame / loadFromSlot 不存在,实际是 _serializeG / _deserializeG
  const lifecycleFns = ['backToTitle', 'initGame', '_serializeG', '_deserializeG'];
  const fnBodies = {};

  for (const fnName of lifecycleFns) fnBodies[fnName] = '';

  for (const file of allFiles) {
    const txt = fs.readFileSync(file, 'utf8');
    for (const fnName of lifecycleFns) {
      const re = new RegExp(`function\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
      const m = re.exec(txt);
      if (!m) continue;
      // 提取函数体(简易 brace 计数)
      let depth = 0;
      let i = m.index + m[0].length - 1;
      let bodyStart = i + 1;
      for (; i < txt.length; i++) {
        const ch = txt[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            fnBodies[fnName] += txt.slice(bodyStart, i + 1) + '\n';
            break;
          }
        }
      }
    }
  }

  // 整体序列化 / 反序列化 idiom 识别(避免误报)
  // _serializeG 内含 JSON.stringify(G,...) → 所有 G.xxx 自动 save
  // _deserializeG 内含 Object.assign 整 G / Object.keys(snap).forEach → 整体 load
  const serializesAll = /JSON\.stringify\s*\(\s*G\s*[,)]/.test(fnBodies._serializeG || '');
  const deserializesAll = /Object\.keys\s*\(\s*snap\s*\)\s*\.forEach|Object\.assign\s*\(\s*G/.test(fnBodies._deserializeG || '');

  // 对每个 field,看哪些 lifecycle fn 提及了它
  const result = {};
  for (const [name, f] of fields) {
    const baseName = name.replace('_<dynamic>', ''); // 模板字段查 base
    const flags = {};
    for (const fnName of lifecycleFns) {
      const body = fnBodies[fnName];
      if (!body) { flags[fnName] = '(fn missing)'; continue; }
      // 严格匹配:G._xxx (assign / delete / read / forEach pattern)
      const escaped = baseName.replace('G.', 'G\\.').replace(/[._]/g, m => m === '.' ? '\\.' : '_');
      const explicit = new RegExp(escaped).test(body);
      // 整体 idiom 兜底:_serializeG 用 JSON.stringify(G) → 所有字段自动 save
      // _deserializeG 用 Object.keys(snap).forEach → 整体 load
      let mark = explicit ? '✓' : '✗';
      if (!explicit) {
        if (fnName === '_serializeG' && serializesAll) mark = '✓ (整体)';
        else if (fnName === '_deserializeG' && deserializesAll) mark = '✓ (整体)';
      }
      flags[fnName] = mark;
    }
    result[name] = flags;
  }
  return result;
}

function main() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const fields = collectDynamicFields();
  const lifecycle = checkLifecycleHooks(fields);

  const findings = [];

  // 排序 + 分类
  const sortedFields = [...fields.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // 已知 D 类:D-120 G._diploActed_${fid}(模板字段双下划线,因为 _diploActed_ 末尾自带 _)
  const KNOWN = {
    'G._diploActed__<dynamic>': { d_class: 'D-120', note: '顶层字段每旬不重置(玩家附庸 3 入口整局各 1 次)' },
  };

  // F2 修法(codex review):全部 finding 降为 WARN(advisory)
  // 即使 KNOWN(D-120),checker 也不能 close — D-120 真正语义是 per-turn reset,本 checker 不查
  for (const [name, f] of sortedFields) {
    const lc = lifecycle[name];
    if (f.writes.length === 0) continue;
    const inReset = lc.backToTitle === '✓' || lc.initGame === '✓';
    const inSave = lc._serializeG === '✓' || lc._serializeG === '✓ (整体)';
    const inLoad = lc._deserializeG === '✓' || lc._deserializeG === '✓ (整体)';
    if (!inReset || !inSave || !inLoad) {
      const known = KNOWN[name];
      findings.push({
        kind: 'lifecycle_gap',
        severity: 'WARN',  // F2: 全部 advisory,checker 不作为 closure gate
        field: name,
        msg: `${name} 写入存在(${f.writes.length}处)但整局生命周期闭环不完整: reset=${inReset?'✓':'✗'} save=${inSave?'✓':'✗'} load=${inLoad?'✓':'✗'}`,
        candidate_d: known?.d_class || '模式 6 同模式',
        note: known ? `${known.note} (注:本 checker 不查 per-turn,advisory inventory only)` : null,
      });
    }
  }

  // 写报告
  const lines = [];
  lines.push('# Checker 3:G 写口 advisory inventory(NOT D-120 closure gate)');
  lines.push('');
  lines.push('> Generated by `tests/checkers/state_write_inventory.js`(无 timestamp,git commit 即可追溯)');
  lines.push('> 数据源:`project_romance_v181.html` + `src/**/*.js`');
  lines.push('> 检查范围:`G._xxx` 顶层动态字段 + `G[`_xxx_${...}`]` 模板字段');
  lines.push('');
  lines.push('> ⚠️ **Sprint gate 能力:NO — 本 checker 是 advisory inventory,不是 D-120 closure gate**');
  lines.push('>');
  lines.push('> - D-120 真正语义是"per-turn reset"(`nextTurn` 末 `forEach delete`),本 checker 不检查');
  lines.push('> - 本 checker 只看"整局 reset"(backToTitle / initGame)+ save/load idiom');
  lines.push('> - 即使 D-120 修好(per-turn reset 加上),本 checker 仍报字段为 lifecycle_gap WARN(不是 bug)');
  lines.push('> - 反向也成立:本 checker 通过 ≠ D-120 修好(可能漏)');
  lines.push('> - **D-120 closure 必须靠 walkthrough + 人工 review,不能用 checker 自动判定**');
  lines.push('');
  lines.push('> 服务方式:为模式 6 状态生命周期类提供 raw inventory 数据,sprint 期 batch fix 时人工核每个字段语义');
  lines.push('');
  lines.push('## 总览');
  lines.push('');
  lines.push(`| 项 | 数 |`);
  lines.push('|---|---|');
  lines.push(`| 静态字段 \`G._xxx\` | ${[...fields.keys()].filter(k => !k.endsWith('<dynamic>')).length} |`);
  lines.push(`| 模板字段 \`G[\`_xxx_\${...}\`]\` | ${[...fields.keys()].filter(k => k.endsWith('<dynamic>')).length} |`);
  lines.push(`| 生命周期 finding | ${findings.length} |`);
  lines.push('');

  // 详细表
  lines.push('## 字段生命周期闭环表');
  lines.push('');
  lines.push('| 字段 | 写口 | 读取 | reset (backToTitle / initGame) | save (_serializeG) | load (_deserializeG) | 备注 |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const [name, f] of sortedFields) {
    if (f.writes.length === 0 && f.reads.length === 0) continue;
    const lc = lifecycle[name];
    const reset = `${lc.backToTitle} / ${lc.initGame}`;
    const save = `${lc._serializeG}`;
    const load = `${lc._deserializeG}`;
    const isDynamic = name.endsWith('<dynamic>');
    const note = KNOWN[name]?.note || (isDynamic ? '(模板字段)' : '');
    lines.push(`| \`${name}\` | ${f.writes.length} | ${f.reads.length} | ${reset} | ${save} | ${load} | ${note} |`);
  }
  lines.push('');

  // findings
  lines.push('## 生命周期 findings');
  lines.push('');
  if (findings.length === 0) {
    lines.push('✅ 所有字段生命周期闭环完整。');
  } else {
    lines.push(`共 ${findings.length} 个 finding(每条按原则 #13 5 点闭环检查):`);
    lines.push('');
    lines.push('| # | severity | 字段 | 描述 | 候选 D 类 | 备注 |');
    lines.push('|---|---|---|---|---|---|');
    findings.forEach((f, i) => {
      lines.push(`| ${i + 1} | ${f.severity} | \`${f.field}\` | ${f.msg} | ${f.candidate_d} | ${f.note || '-'} |`);
    });
    lines.push('');
    lines.push('### Advisory only — 全部 WARN(F2 修法,codex review)');
    lines.push('');
    lines.push('**已识别**(checker 1.1 增强):');
    lines.push('- ✅ save / load 整体 idiom(`JSON.stringify(G)` / `Object.keys(snap).forEach`)识别为 ✓');
    lines.push('- ✅ mutation 写口扩展:`.push() / .pop() / .splice() / += / ++ / Object.assign(G._xxx, ...)` 等(F3 修法)');
    lines.push('');
    lines.push('**仍未覆盖**(下版本扩展候选):');
    lines.push('- ❌ **per-turn reset 检查**(D-120 真正语义)— 不扫 `nextTurn` / `processXxx` 函数体内 forEach delete');
    lines.push('- ❌ 不区分"该字段应整局保存"vs"该字段应每旬重置"(语义判定靠 audit walkthrough)');
    lines.push('- ❌ 误报:某字段已在更高层 reset 函数(如某个 `_resetXxx`)处理,本 checker 未追溯');
    lines.push('- ❌ 深层对象写入(如 `G._foo.bar.baz = ...`)只识别为 G._foo 的 read');
    lines.push('');
    lines.push('Sprint 修 D-120 / 模式 6 时**必须**结合 walkthrough + 代码 review 二次确认每个 finding 的真实语义。');
    lines.push('checker 不能 close 这些 D 类。');
  }
  lines.push('');

  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log(`[checker-3] wrote ${path.relative(ROOT, REPORT)}`);
  const totalFields = [...fields.keys()].length;
  console.log(`[checker-3] dynamic_fields=${totalFields} findings=${findings.length} (all advisory WARN)`);

  // F5 修法(codex review):本 checker 是 advisory inventory,不参与 sprint gate
  // 全部 finding 是 WARN(F2),exit 0 永远(除非 ERROR)
  process.exit(0);
}

main();
