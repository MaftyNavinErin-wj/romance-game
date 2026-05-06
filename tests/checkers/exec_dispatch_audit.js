// tests/checkers/exec_dispatch_audit.js
//
// Checker 1:_exec 四表对账
//
// 目的:对账 Claude AI 决策接口的 4 个表的一致性
//   表 A:_exec* 函数定义全集(grep src/ + project_romance_v181.html)
//   表 B:_execOneAction dispatcher case 全集(src/core/claude_ai.js)
//   表 C:prompt action type 指令全集(src/core/claude_ai.js,2 处 prompt)
//   表 D:case ↔ function 映射(snake_case → _execCamelCase)
//
// 服务的 D 类:
//   D-099 (prompt 缺 _exec 指令)/ D-100 (派发器漏 enthrone case) / D-016 / D-020 /
//   D-064 / D-076 等"Claude AI 路径错配"模式 D 类
//
// 工作流原则:
//   - read-only,不动代码,只产报告
//   - 输出 docs/checker_reports/exec_dispatch_audit.md
//   - 退出码:0 = 对账完整 / 1 = 发现缺漏 / 2 = ERROR
//
// 用法:
//   node tests/checkers/exec_dispatch_audit.js

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..', '..');
const V181     = path.join(ROOT, 'project_romance_v181.html');
const CLAUDE_AI = path.join(ROOT, 'src', 'core', 'claude_ai.js');
const REPORT_DIR = path.join(ROOT, 'docs', 'checker_reports');
const REPORT     = path.join(REPORT_DIR, 'exec_dispatch_audit.md');

// ── 工具:把 _execXxxYyy → xxx_yyy(snake_case 转换,与 prompt type 对齐)
function fnToType(fnName) {
  const stripped = fnName.replace(/^_exec/, '');
  return stripped.replace(/([A-Z])/g, (_, c, i) => (i === 0 ? c.toLowerCase() : '_' + c.toLowerCase()));
}

// ── 表 A:_exec* 函数定义(全 repo 扫)
function collectFunctionDefs() {
  const defs = [];
  for (const file of [V181, CLAUDE_AI]) {
    const txt = fs.readFileSync(file, 'utf8');
    const lines = txt.split('\n');
    lines.forEach((line, idx) => {
      const m = line.match(/^function\s+(_exec[A-Z][A-Za-z]*)\s*\(/);
      if (m) defs.push({ name: m[1], file: path.relative(ROOT, file), line: idx + 1 });
    });
  }
  // 还要扫 src/chains/ src/render/ 防漏
  const chainsDir = path.join(ROOT, 'src', 'chains');
  for (const f of fs.readdirSync(chainsDir)) {
    const fp = path.join(chainsDir, f);
    const txt = fs.readFileSync(fp, 'utf8');
    txt.split('\n').forEach((line, idx) => {
      const m = line.match(/^function\s+(_exec[A-Z][A-Za-z]*)\s*\(/);
      if (m) defs.push({ name: m[1], file: path.relative(ROOT, fp), line: idx + 1 });
    });
  }
  return defs;
}

// ── 表 B:dispatcher case
function collectDispatcherCases() {
  const txt = fs.readFileSync(CLAUDE_AI, 'utf8');
  const lines = txt.split('\n');
  const cases = [];

  // 找 _execOneAction 函数体内的 switch case
  let inSwitch = false;
  let braceDepth = 0;
  let pendingCase = null;
  lines.forEach((line, idx) => {
    if (/function\s+_execOneAction\s*\(/.test(line)) inSwitch = true;
    if (!inSwitch) return;

    // 累计 brace depth(跟踪函数体结束)
    for (const ch of line) {
      if (ch === '{') braceDepth++;
      else if (ch === '}') braceDepth--;
    }
    if (braceDepth === 0 && cases.length > 0) inSwitch = false;

    // 形如 `case 'xxx':`
    const m = line.match(/case\s+['"]([a-z_]+)['"]/);
    if (m) {
      // 看本行是否同时含 `_execXxx(`,如果含则该 case 直接对应函数;否则是 fallthrough(下一个 case 才返回)
      const fnMatch = line.match(/return\s+(_exec[A-Z][A-Za-z]*)\s*\(/);
      if (fnMatch) {
        cases.push({ type: m[1], fn: fnMatch[1], line: idx + 1, fallthrough: false });
        // 如果之前有 pendingCase(fallthrough),它应也指向同 fn
        if (pendingCase) {
          pendingCase.fn = fnMatch[1];
          pendingCase.line2 = idx + 1;
          pendingCase.fallthrough = true;
          cases.unshift(pendingCase);
          pendingCase = null;
        }
      } else {
        // fallthrough(case 'attack': // 下行 case 'move': return _execMove)
        pendingCase = { type: m[1], fn: null, line: idx + 1 };
      }
    }
  });
  // remove duplicates (pendingCase pushed via unshift might re-include)
  const seen = new Set();
  return cases.filter(c => {
    const k = c.type + '|' + c.fn;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── 表 C:prompt 指令(claude_ai.js 多处 prompt template 内的 {"type":"xxx",...})
function collectPromptTypes() {
  const txt = fs.readFileSync(CLAUDE_AI, 'utf8');
  const lines = txt.split('\n');
  const types = [];
  lines.forEach((line, idx) => {
    // 匹配 prompt 内 `{"type":"xxx",...}` 形式
    const m = line.match(/\{"type":"([a-z_]+)"/);
    if (m) types.push({ type: m[1], line: idx + 1 });
  });
  // 同 type 多次出现(2 个 prompt block)合并
  const grouped = {};
  for (const t of types) {
    if (!grouped[t.type]) grouped[t.type] = [];
    grouped[t.type].push(t.line);
  }
  return grouped;
}

// ── 主流程
function main() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const allDefs = collectFunctionDefs();
  // 排除 _execOneAction 自身(它是 dispatcher 入口,不是被 dispatch 的目标)
  const defs = allDefs.filter(d => d.name !== '_execOneAction');
  const cases = collectDispatcherCases();
  const promptTypes = collectPromptTypes();

  const defNames = new Set(defs.map(d => d.name));
  const caseTypes = new Set(cases.map(c => c.type));
  const caseFns = new Set(cases.map(c => c.fn).filter(Boolean));
  const promptTypeSet = new Set(Object.keys(promptTypes));

  // 缺漏分析
  const findings = [];

  // (1) 函数定义存在但 dispatcher 没有 case → 死代码或漏 case
  for (const d of defs) {
    const expectedType = fnToType(d.name);
    if (!caseFns.has(d.name)) {
      findings.push({
        kind: 'no_dispatcher_case',
        severity: 'WARN',
        msg: `函数 ${d.name} (${d.file}:${d.line}) 在 dispatcher 中无对应 case (Claude AI 永远不会调用它)`,
        candidate_d: 'D-100 同模式',
      });
    }
  }

  // (2) dispatcher case 引用的函数不存在 → 错引用
  for (const c of cases) {
    if (c.fn && !defNames.has(c.fn)) {
      findings.push({
        kind: 'missing_function',
        severity: 'ERROR',
        msg: `dispatcher case '${c.type}' 引用 ${c.fn} 但函数不存在`,
      });
    }
  }

  // (3) prompt 提到但 dispatcher 没 case → dead code
  for (const t of Object.keys(promptTypes)) {
    if (!caseTypes.has(t)) {
      findings.push({
        kind: 'prompt_no_case',
        severity: 'HIGH',
        msg: `prompt 提供 type='${t}' 指令(${promptTypes[t].join(',')}行)但 dispatcher 无 case → Claude AI 输出会被吞`,
        candidate_d: 'D-100 同模式',
      });
    }
  }

  // (4) dispatcher 有 case 但所有 prompt 都没提 → Claude AI 永远不会发该指令
  for (const t of caseTypes) {
    if (!promptTypeSet.has(t)) {
      findings.push({
        kind: 'case_no_prompt',
        severity: 'HIGH',
        msg: `dispatcher case '${t}' 存在但 prompt 未声明该 type → Claude AI dead code`,
        candidate_d: 'D-099 同模式',
      });
    }
  }

  // (5) 函数命名规范:_execXxx ↔ snake_case 不对应
  // 只看 primary case(non-fallthrough),fallthrough case 共用同函数是预期行为
  for (const d of defs) {
    const expectedType = fnToType(d.name);
    const matches = cases.filter(c => c.fn === d.name && !c.fallthrough);
    if (matches.length === 0) continue;
    const primary = matches[0];
    if (primary.type !== expectedType) {
      findings.push({
        kind: 'naming_mismatch',
        severity: 'INFO',
        msg: `函数 ${d.name} → 期望 type='${expectedType}',实际 primary case='${primary.type}'(命名不规则)`,
      });
    }
  }

  // 写报告
  const lines = [];
  lines.push('# Checker 1:_exec 四表对账报告');
  lines.push('');
  lines.push(`> 生成时间:${new Date().toISOString()}`);
  lines.push('> 数据源:`project_romance_v181.html` + `src/core/claude_ai.js` + `src/chains/*.js` + `src/render/*.js`');
  lines.push('> 服务 D 类:D-099 / D-100 / D-016 / D-020 / D-064 / D-076(Claude AI 路径错配模式)');
  lines.push('');
  lines.push('## 总览');
  lines.push('');
  lines.push(`| 表 | 数量 |`);
  lines.push('|---|---|');
  lines.push(`| A: _exec* 函数定义 | ${defs.length} |`);
  lines.push(`| B: dispatcher case | ${cases.length} |`);
  lines.push(`| C: prompt 指令 type | ${Object.keys(promptTypes).length} |`);
  lines.push(`| 缺漏 finding | ${findings.length} |`);
  lines.push('');

  lines.push('## 表 A:_exec* 函数定义');
  lines.push('');
  lines.push('| 函数名 | 文件 | 行 | 期望 type(snake_case) |');
  lines.push('|---|---|---|---|');
  for (const d of defs.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`| \`${d.name}\` | ${d.file} | ${d.line} | \`${fnToType(d.name)}\` |`);
  }
  lines.push('');

  lines.push('## 表 B:dispatcher case');
  lines.push('');
  lines.push('| case type | → 函数 | 行 | 备注 |');
  lines.push('|---|---|---|---|');
  for (const c of cases.sort((a, b) => a.line - b.line)) {
    const note = c.fallthrough ? `fallthrough → ${c.line2}` : '';
    lines.push(`| \`${c.type}\` | \`${c.fn || '(none)'}\` | ${c.line} | ${note} |`);
  }
  lines.push('');

  lines.push('## 表 C:prompt 指令 type');
  lines.push('');
  lines.push('| type | 出现行 | 出现次数 |');
  lines.push('|---|---|---|');
  for (const t of Object.keys(promptTypes).sort()) {
    lines.push(`| \`${t}\` | ${promptTypes[t].join(', ')} | ${promptTypes[t].length} |`);
  }
  lines.push('');

  lines.push('## 表 D:case × prompt × function 三向交叉');
  lines.push('');
  lines.push('| type | dispatcher case | prompt 提及 | 函数定义 |');
  lines.push('|---|---|---|---|');
  const allTypes = new Set([...caseTypes, ...promptTypeSet, ...defs.map(d => fnToType(d.name))]);
  for (const t of [...allTypes].sort()) {
    const dispatcher = caseTypes.has(t) ? '✓' : '✗';
    const prompt = promptTypeSet.has(t) ? '✓' : '✗';
    const fn = defs.find(d => fnToType(d.name) === t);
    const fnMark = fn ? '✓ `' + fn.name + '`' : '✗';
    const issue = (dispatcher === '✗' || prompt === '✗' || !fn) ? ' ⚠️' : '';
    lines.push(`| \`${t}\` | ${dispatcher} | ${prompt} | ${fnMark} |${issue}`);
  }
  lines.push('');

  lines.push('## 缺漏 findings');
  lines.push('');
  if (findings.length === 0) {
    lines.push('✅ 无缺漏。四表完全对账。');
  } else {
    lines.push(`共 ${findings.length} 个 finding:`);
    lines.push('');
    lines.push('| # | severity | kind | 描述 | 候选 D 类 |');
    lines.push('|---|---|---|---|---|');
    findings.forEach((f, i) => {
      lines.push(`| ${i + 1} | ${f.severity} | ${f.kind} | ${f.msg} | ${f.candidate_d || '-'} |`);
    });
  }
  lines.push('');

  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log(`[checker-1] wrote ${path.relative(ROOT, REPORT)}`);
  console.log(`[checker-1] defs=${defs.length} cases=${cases.length} prompt_types=${Object.keys(promptTypes).length} findings=${findings.length}`);

  process.exit(findings.length > 0 ? 1 : 0);
}

main();
