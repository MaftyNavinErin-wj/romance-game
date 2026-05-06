// tests/checkers/state_write_inventory.js
//
// Checker 3:G 写口反向索引(粗粒度)
//
// 目的:
//   (1) 列出所有 G._xxx 顶层动态字段 + 写入 / 读取位置 + 重置 / save / load 检查
//   (2) 服务 D-120 + 模式 6 状态生命周期类
//   (3) 列出核心 G subtree 写口高度集中的位置(模式 5 双向不一致检查辅助)
//
// 服务的 D 类:
//   D-120 (G._diploActed_${fid} 顶层字段永不重置)
//   D-052 / D-053 / D-055 (核心算法回路双向不一致,辅助检查)
//   模式 6 状态生命周期类(普适)
//
// 工作流原则:
//   - read-only,只产报告
//   - 输出 docs/checker_reports/state_write_inventory.md
//   - 退出码:0 = 全部字段闭环 / 1 = 有字段缺生命周期点 / 2 = ERROR

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
        // 简易判定 write vs read:`= ` 后面或 `delete G._xxx` 视为写
        // `G._xxx = ...`(直接赋值)/ `delete G._xxx`(删除)
        const afterMatch = line.slice(m.index + m[0].length);
        const beforeMatch = line.slice(0, m.index);
        const isAssign = /^\s*(?:\[[^\]]*\])?\s*=(?!=)/.test(afterMatch);
        const isDelete = /\bdelete\s+$/.test(beforeMatch);
        if (isAssign || isDelete) {
          f.writes.push({ file: path.relative(ROOT, file), line: idx + 1, kind: isDelete ? 'delete' : 'assign' });
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
        const afterMatch = line.slice(m.index + m[0].length);
        const isAssign = /^[^=]*\]\s*=(?!=)/.test(afterMatch);
        const beforeMatch = line.slice(0, m.index);
        const isDelete = /\bdelete\s+$/.test(beforeMatch);
        if (isAssign || isDelete) {
          f.writes.push({ file: path.relative(ROOT, file), line: idx + 1, kind: isDelete ? 'delete' : 'assign' });
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

  for (const [name, f] of sortedFields) {
    const lc = lifecycle[name];
    // 只关注 write 存在但 reset 不闭环的(模式 6)
    if (f.writes.length === 0) continue;
    const inReset = lc.backToTitle === '✓' || lc.initGame === '✓';
    // save / load 接受"整体 idiom"为闭环
    const inSave = lc._serializeG === '✓' || lc._serializeG === '✓ (整体)';
    const inLoad = lc._deserializeG === '✓' || lc._deserializeG === '✓ (整体)';
    if (!inReset || !inSave || !inLoad) {
      const known = KNOWN[name];
      findings.push({
        kind: 'lifecycle_gap',
        severity: known ? 'HIGH' : 'WARN',
        field: name,
        msg: `${name} 写入存在(${f.writes.length}处)但生命周期闭环不完整: reset=${inReset?'✓':'✗'} save=${inSave?'✓':'✗'} load=${inLoad?'✓':'✗'}`,
        candidate_d: known?.d_class || '模式 6 同模式',
        note: known?.note,
      });
    }
  }

  // 写报告
  const lines = [];
  lines.push('# Checker 3:G 写口反向索引 + 生命周期闭环检查');
  lines.push('');
  lines.push(`> 生成时间:${new Date().toISOString()}`);
  lines.push('> 数据源:`project_romance_v181.html` + `src/**/*.js`');
  lines.push('> 服务 D 类:D-120 + 模式 6 状态生命周期类');
  lines.push('> 检查范围:`G._xxx` 顶层动态字段 + `G[`_xxx_${...}`]` 模板字段');
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
    lines.push('### 注:本 checker 是粗粒度初版,只覆盖"整局 reset"(backToTitle / initGame)语义');
    lines.push('');
    lines.push('**已知限制**:');
    lines.push('- ✅ save / load 整体 idiom(`JSON.stringify(G)` / `Object.keys(snap).forEach`)已识别为 ✓');
    lines.push('- ❌ **D-120 真正的问题是"每旬末重置"(per-turn expire),不是整局 reset**');
    lines.push('  - D-120 语义:`G._diploActed_${fid}` 在 nextTurn 末没有 `ALL_FACS.forEach(f => delete G[\\`_diploActed_${f}\\`])`');
    lines.push('  - 当前 checker 不检查 per-turn expire(下个版本可加 nextTurn / processXxx 函数体扫描)');
    lines.push('- ❌ checker 不区分"该字段应整局保存"vs"该字段应每旬重置"(语义判定靠 audit walkthrough)');
    lines.push('- ❌ 误报:某字段已在更高层 reset 函数(如某个 `_resetXxx`)处理,本 checker 未追溯');
    lines.push('');
    lines.push('Sprint 修 D-120 / 模式 6 时需结合 walkthrough + 代码 review 二次确认每个 finding 的真实语义。');
  }
  lines.push('');

  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log(`[checker-3] wrote ${path.relative(ROOT, REPORT)}`);
  const totalFields = [...fields.keys()].length;
  console.log(`[checker-3] dynamic_fields=${totalFields} findings=${findings.length}`);

  process.exit(findings.some(f => f.severity === 'HIGH') ? 1 : 0);
}

main();
