// tests/checkers/run_all.js
//
// 顺序跑所有 sprint checker,不因任一 checker exit code != 0 中断。
// 跨平台(Windows / Linux / Mac)。
//
// Exit code 语义(F5 修法,codex review):
//   - exit 1 = 有 blocking HIGH finding(sprint gate 失败)
//     具体:Checker 1 / Checker 2 — sprint gate checker,HIGH finding 报 exit 1
//   - exit 0 = 无 blocking HIGH(可能仍有 advisory WARN finding)
//     具体:Checker 3 — advisory only,永远 exit 0(除非 ERROR)
//   - exit 2 = ERROR(checker 自身崩溃)

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const checkers = [
  // sprint gate checker(HIGH finding 触发 exit 1)
  { file: 'exec_dispatch_audit.js',         gate: true },
  { file: 'faction_event_caller_audit.js',  gate: true },
  // advisory inventory checker(永远 exit 0,WARN finding 不阻断 sprint gate)
  { file: 'state_write_inventory.js',       gate: false },
];

let hadBlockingFinding = false;

for (const c of checkers) {
  const fullPath = path.join(__dirname, c.file);
  const result = spawnSync('node', [fullPath], { stdio: 'inherit' });
  if (result.status === 1 && c.gate) hadBlockingFinding = true;
  if (result.status === 2) {
    console.error(`[run-all] checker ${c.file} ERROR — aborting`);
    process.exit(2);
  }
}

console.log('---');
console.log(hadBlockingFinding
  ? '[run-all] 全部 3 checker 完成,有 HIGH finding(sprint gate 失败,需 batch fix)'
  : '[run-all] 全部 3 checker 完成,无 HIGH finding(可能仍有 advisory WARN — 见 checker 3 报告)');

process.exit(hadBlockingFinding ? 1 : 0);
