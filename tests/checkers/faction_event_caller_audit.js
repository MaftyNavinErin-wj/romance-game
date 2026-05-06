// tests/checkers/faction_event_caller_audit.js
//
// Checker 2:triggerFactionEvent eventType ↔ caller 覆盖表
//
// 目的:列出所有 triggerFactionEvent('xxx', fid, extra) 调用点,按 eventType 分组,
//      显示每 caller 的 chain + 函数名,辅助识别"v130 重构推广不彻底"模式 D 类。
//
// 服务的 D 类:
//   D-049 (warDeclare 错配,3 路径漏 triggerFactionEvent('warDeclare'))
//   D-131 (triggerFactionEvent caller 覆盖不全,与 D-049 同源)
//   D-048 (AI 主动背刺 + de facto 宣战漏 triggerFactionEvent('betray'))
//
// 已知 eventType 全集(从 src/chains/general.js triggerFactionEvent 函数 EVENT_LABELS):
//   execute / defectorPrefect / conquer / truce / warDeclare / betray /
//   appointPost / removePost
//
// 工作流原则:
//   - read-only,只产报告
//   - 输出 docs/checker_reports/faction_event_caller_audit.md
//   - 退出码:0 = 至少 1 caller per eventType / 1 = 有 eventType 缺 caller / 2 = ERROR

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..', '..');
const V181     = path.join(ROOT, 'project_romance_v181.html');
const SRC_DIR  = path.join(ROOT, 'src');
const REPORT_DIR = path.join(ROOT, 'docs', 'checker_reports');
const REPORT     = path.join(REPORT_DIR, 'faction_event_caller_audit.md');

const KNOWN_EVENT_TYPES = [
  'execute', 'defectorPrefect', 'conquer', 'truce',
  'warDeclare', 'betray', 'appointPost', 'removePost',
];

// ── 已知 D 类 finding(来自 cross_chain_d_list_v1_0.md + walkthrough)
const KNOWN_GAPS = {
  warDeclare: {
    expected: ['玩家 diploWar', 'aiDoDiplo neutral 分支宣战', '_execDeclareWar'],
    d_class: 'D-049 / D-131',
    note: 'v181 仅 doEnthrone (politics.js:1028) 调,真正宣战 3 路径全漏',
  },
  betray: {
    expected: ['玩家 diploWar betray', 'AI 主动背刺', 'de facto 宣战背刺(中立战斗)'],
    d_class: 'D-048',
    note: '玩家被罚 AI 不被罚,对称性 bug',
  },
};

function listSrcFiles(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...listSrcFiles(fp));
    else if (f.name.endsWith('.js')) out.push(fp);
  }
  return out;
}

function findContainingFunction(lines, lineIdx) {
  // 从 lineIdx 向前搜索,找最近的 `function xxx(` 定义
  for (let i = lineIdx - 1; i >= 0; i--) {
    const m = lines[i].match(/^function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
    if (m) return { name: m[1], defLine: i + 1 };
  }
  return { name: '(top-level)', defLine: 0 };
}

function collectCallers() {
  const callers = [];
  const files = [V181, ...listSrcFiles(SRC_DIR)];
  for (const file of files) {
    const txt = fs.readFileSync(file, 'utf8');
    const lines = txt.split('\n');
    lines.forEach((line, idx) => {
      // 跳过注释行(单行 // 或 /* 块开头)
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      // 匹配 triggerFactionEvent('xxx', ...)
      const m = line.match(/triggerFactionEvent\s*\(\s*['"]([a-zA-Z_]+)['"]/);
      if (!m) return;
      const eventType = m[1];
      const containing = findContainingFunction(lines, idx);
      callers.push({
        eventType,
        file: path.relative(ROOT, file),
        line: idx + 1,
        containingFn: containing.name,
        containingFnLine: containing.defLine,
        snippet: line.trim().slice(0, 120),
      });
    });
  }
  return callers;
}

function chainOfFile(filePath) {
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

function main() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const callers = collectCallers();
  const byType = {};
  for (const t of KNOWN_EVENT_TYPES) byType[t] = [];
  for (const c of callers) {
    if (!byType[c.eventType]) byType[c.eventType] = [];
    byType[c.eventType].push(c);
  }

  // findings
  const findings = [];

  // (1) eventType 0 caller(可能漏完整推广,或该 eventType 是死代码)
  for (const t of KNOWN_EVENT_TYPES) {
    if (byType[t].length === 0) {
      findings.push({
        kind: 'no_caller',
        severity: 'WARN',
        msg: `eventType '${t}' 在 triggerFactionEvent 内有 EVENT_LABELS 定义但全 repo 0 caller → 可能死代码或 v130 重构漏推广`,
        candidate_d: KNOWN_GAPS[t]?.d_class || 'D-131 同模式',
      });
    }
  }

  // (2) 未在已知 EVENT_LABELS 中但有 caller 的 eventType(命名漂移或新增未文档化)
  for (const t of Object.keys(byType)) {
    if (!KNOWN_EVENT_TYPES.includes(t)) {
      findings.push({
        kind: 'unknown_event_type',
        severity: 'INFO',
        msg: `eventType '${t}' 在 caller 出现但不在已知 EVENT_LABELS 中(命名漂移或文档未更新)`,
      });
    }
  }

  // (3) v181.html 仍有 caller(说明未完全抽到 src/)
  for (const c of callers) {
    if (c.file === path.relative(ROOT, V181)) {
      findings.push({
        kind: 'v181_residue',
        severity: 'INFO',
        msg: `v181.html:${c.line} 仍含 triggerFactionEvent('${c.eventType}') 调用 in ${c.containingFn} → 后续 sprint 抽离可能涉及`,
      });
    }
  }

  // (4) 已知 D 类的 expected caller 缺漏提示
  for (const [t, gap] of Object.entries(KNOWN_GAPS)) {
    findings.push({
      kind: 'known_gap',
      severity: 'HIGH',
      msg: `eventType '${t}' 已知缺漏:${gap.note};期望 caller:${gap.expected.join(' / ')};当前 caller=${byType[t].length}`,
      candidate_d: gap.d_class,
    });
  }

  // 写报告
  const lines = [];
  lines.push('# Checker 2:triggerFactionEvent caller 覆盖表');
  lines.push('');
  lines.push(`> 生成时间:${new Date().toISOString()}`);
  lines.push('> 数据源:`project_romance_v181.html` + `src/**/*.js`');
  lines.push('> 服务 D 类:D-048 / D-049 / D-131(v130 重构推广不彻底模式)');
  lines.push('');
  lines.push('## 总览');
  lines.push('');
  lines.push(`| eventType | caller 数 | 状态 |`);
  lines.push('|---|---|---|');
  for (const t of KNOWN_EVENT_TYPES) {
    const n = byType[t].length;
    const known = KNOWN_GAPS[t];
    const status = n === 0 ? '❌ 0 caller' : known ? '⚠️ 已知缺漏' : '✓';
    lines.push(`| \`${t}\` | ${n} | ${status} |`);
  }
  lines.push('');
  lines.push(`总 caller 数:${callers.length} | findings:${findings.length}`);
  lines.push('');

  // eventType × caller 矩阵
  lines.push('## eventType × caller 详细');
  lines.push('');
  for (const t of [...KNOWN_EVENT_TYPES, ...Object.keys(byType).filter(k => !KNOWN_EVENT_TYPES.includes(k))]) {
    lines.push(`### \`${t}\` (${byType[t]?.length || 0} caller)`);
    lines.push('');
    if (KNOWN_GAPS[t]) {
      lines.push(`> **已知缺漏(${KNOWN_GAPS[t].d_class})**:${KNOWN_GAPS[t].note}`);
      lines.push(`> 期望 caller:${KNOWN_GAPS[t].expected.join(' / ')}`);
      lines.push('');
    }
    if (!byType[t] || byType[t].length === 0) {
      lines.push('(0 caller)');
      lines.push('');
      continue;
    }
    lines.push('| chain | 文件:行 | 所在函数 | snippet |');
    lines.push('|---|---|---|---|');
    for (const c of byType[t]) {
      lines.push(`| ${chainOfFile(c.file)} | \`${c.file}:${c.line}\` | \`${c.containingFn}\` | \`${c.snippet.replace(/\|/g, '\\|')}\` |`);
    }
    lines.push('');
  }

  // findings
  lines.push('## findings');
  lines.push('');
  if (findings.length === 0) {
    lines.push('✅ 无 findings(全 eventType 至少 1 caller + v181 已抽干净 + 无漂移命名)。');
  } else {
    lines.push(`共 ${findings.length} 个 finding:`);
    lines.push('');
    lines.push('| # | severity | kind | 描述 | 候选 D 类 |');
    lines.push('|---|---|---|---|---|');
    findings.forEach((f, i) => {
      lines.push(`| ${i + 1} | ${f.severity} | ${f.kind} | ${f.msg.replace(/\|/g, '\\|')} | ${f.candidate_d || '-'} |`);
    });
  }
  lines.push('');

  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log(`[checker-2] wrote ${path.relative(ROOT, REPORT)}`);
  console.log(`[checker-2] callers=${callers.length} eventTypes=${KNOWN_EVENT_TYPES.length} findings=${findings.length}`);

  // 退出码:有 0-caller eventType 时报警
  const hasZeroCaller = KNOWN_EVENT_TYPES.some(t => byType[t].length === 0);
  process.exit(hasZeroCaller || findings.some(f => f.severity === 'HIGH') ? 1 : 0);
}

main();
