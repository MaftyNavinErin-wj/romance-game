#!/usr/bin/env node
'use strict';
//
// Checker: triggerFactionEvent 接口完整性不变量
//
// 来源: audit pass 1 §20451 自动化推荐 + sprint batch-19.3 沉淀.
// 起源 D 类: D-049 (武将链 HIGH warDeclare 错配) + D-131 (事件链 HIGH caller 覆盖不全) + D-045 (武将链 MED 豪族开城漏 conquer).
//
// 不变量:
//   I1. 真正"宣战"路径必须紧邻 triggerFactionEvent('warDeclare', fid, {})
//   I2. 真正"结盟"路径必须紧邻 triggerFactionEvent('truce', fid, {}) — 双向(fid + target)
//   I3. 真正"含背刺宣战"路径必须紧邻 triggerFactionEvent('betray', fid, {})
//   I4. 真正"占城/易主"路径必须紧邻 triggerFactionEvent('conquer', fid, {})
//
// 设计: curated whitelist — 列每个真正语义入口的 anchor,核 anchor 后 N 行内有对应 trigger.
//   - 新增 status='enemy'/'ally' 写口或城市易主路径时,加 entry 到 EXPECTED_CALLERS.
//   - 设计层 helper / fan-out / lifecycle 转换 (e.g., _syncAllyWarStatus / _setVassalStatus) 不在本表,
//     因其语义不是"主动触发",而是从主动触发派生 (主动方已 fire trigger).
//   - v181.html 内未抽离 caller 留 followup (constitution 'project_romance_v181.html 可读不可写' 约束).
//
// 退出码: 0 PASS / 1 不变量违反

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');

const EXPECTED_CALLERS = [
  // ──────── I1 warDeclare 7 处 ────────
  { file: 'src/chains/diplomacy.js', anchor: /^function diploWar\(/,
    name: 'diploWar 玩家正式宣战',                           trigger: 'warDeclare', within: 50 },
  { file: 'src/chains/diplomacy.js', anchor: /^function _execDeclareWar\(/,
    name: '_execDeclareWar Claude AI 派发宣战',             trigger: 'warDeclare', within: 35 },
  { file: 'src/chains/diplomacy.js', anchor: /^function aiDoDiplo\(/,
    name: 'aiDoDiplo AI 主动宣战',                           trigger: 'warDeclare', within: 250 },
  { file: 'src/chains/diplomacy.js', anchor: /D-117c fix.*P15c/,
    name: 'checkDiplo D-117c rel<=10 自然漂移宣战',         trigger: 'warDeclare', within: 30 },
  { file: 'src/data/events.js',     anchor: /id:'envoy_visit'/,
    name: 'envoy_visit 斩使立威 de facto 宣战',              trigger: 'warDeclare', within: 80 },
  { file: 'src/chains/military.js',  anchor: /中立状态下发生战斗/,
    name: '中立战斗 de facto 宣战',                           trigger: 'warDeclare', within: 90 },
  { file: 'src/chains/diplomacy.js', anchor: /^function _applyDriveWolfWar\(/,
    name: '驱虎吞狼 targetA 被迫宣战',                         trigger: 'warDeclare', within: 40 },

  // ──────── I2 truce 3 处 ────────
  { file: 'src/chains/diplomacy.js', anchor: /^function diploAlly\(/,
    name: 'diploAlly 玩家结盟 modal (fid+target 双向)',     trigger: 'truce', within: 60, bidirectional: true },
  { file: 'src/chains/diplomacy.js', anchor: /^function _execProposeAlliance\(/,
    name: '_execProposeAlliance Claude AI 结盟 (双向)',     trigger: 'truce', within: 30, bidirectional: true },
  { file: 'src/chains/diplomacy.js', anchor: /'neutral'&&d\.rel>=80/,
    name: 'checkDiplo neutral->ally 自动结盟 (双向)',        trigger: 'truce', within: 10, bidirectional: true },

  // ──────── I3 betray 4 处 ────────
  { file: 'src/chains/diplomacy.js', anchor: /^function diploWar\(/,
    name: 'diploWar 玩家含背刺宣战',                         trigger: 'betray', within: 30 },
  { file: 'src/chains/diplomacy.js', anchor: /^function _execDeclareWar\(/,
    name: '_execDeclareWar Claude AI 含背刺宣战',           trigger: 'betray', within: 30 },
  { file: 'src/chains/diplomacy.js', anchor: /^function aiDoDiplo\(/,
    name: 'aiDoDiplo AI 含背刺宣战',                         trigger: 'betray', within: 250 },
  { file: 'src/chains/diplomacy.js', anchor: /D-117c fix.*P15c/,
    name: 'checkDiplo D-117c 含背刺自动宣战',               trigger: 'betray', within: 30 },
  { file: 'src/chains/military.js',  anchor: /中立状态下发生战斗/,
    name: '中立战斗 de facto 含背刺宣战',                    trigger: 'betray', within: 90 },
  { file: 'src/chains/diplomacy.js', anchor: /^function _applyDriveWolfWar\(/,
    name: '驱虎吞狼 targetA 含背刺宣战',                       trigger: 'betray', within: 25 },

  // ──────── I4 conquer 2 处 ────────
  { file: 'src/chains/military.js', anchor: /triggerFactionEvent\('conquer'/,
    name: '战斗标准攻城',                                    trigger: 'conquer', within: 0 },
  { file: 'src/chains/gentry.js',   anchor: /^function _triggerGentryBetray\(/,
    name: '_triggerGentryBetray 豪族开城迎降',              trigger: 'conquer', within: 80 },
];

const KNOWN_FOLLOWUPS = [
  'v181.html 内 _exec 函数(经济/军事/政治/武将 12+ 个)留 _exec 归位架构债 sprint',
];

function readFile(rel) {
  const p = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8').split(/\r?\n/);
}

let pass = 0, fail = 0;
const failures = [];

for (const e of EXPECTED_CALLERS) {
  const lines = readFile(e.file);
  if (!lines) {
    failures.push(`MISSING FILE: ${e.file} — ${e.name}`);
    fail++;
    continue;
  }

  let anchorLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (e.anchor.test(lines[i])) { anchorLine = i; break; }
  }
  if (anchorLine === -1) {
    failures.push(`ANCHOR NOT FOUND: ${e.name} (${e.file}) — ${e.anchor}`);
    fail++;
    continue;
  }

  const triggerPattern = new RegExp(`triggerFactionEvent\\(['"]${e.trigger}['"]`);
  const checkUntil = Math.min(lines.length, anchorLine + e.within + 1);
  let foundCount = 0;
  for (let i = anchorLine; i < checkUntil; i++) {
    if (triggerPattern.test(lines[i])) foundCount++;
  }

  const expectedCount = e.bidirectional ? 2 : 1;
  if (foundCount >= expectedCount) {
    pass++;
  } else {
    failures.push(
      `MISSING TRIGGER: ${e.name}\n` +
      `  → triggerFactionEvent('${e.trigger}', ...) 期望 ${expectedCount} 处, 在 ${e.file} L${anchorLine+1} 后 ${e.within} 行内仅找到 ${foundCount} 处`
    );
    fail++;
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('triggerFactionEvent 接口完整性不变量 checker (audit §20451)');
console.log('═══════════════════════════════════════════════════════════');
console.log(`期望 caller: ${EXPECTED_CALLERS.length}`);
console.log(`PASS: ${pass}`);
console.log(`FAIL: ${fail}`);
if (failures.length) {
  console.log('\n违反不变量:');
  failures.forEach(f => console.log(`  ❌ ${f}`));
}
console.log('\n已知 followup (不在本 checker 范围):');
KNOWN_FOLLOWUPS.forEach(f => console.log(`  ⏸  ${f}`));

process.exit(fail > 0 ? 1 : 0);
