// tests/checkers/run_all.js
//
// 顺序跑所有 sprint checker,不因任一 checker exit code != 0 中断。
// 跨平台(Windows / Linux / Mac)。

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const checkers = [
  'exec_dispatch_audit.js',
  'faction_event_caller_audit.js',
  'state_write_inventory.js',
];

let totalFindings = 0;
let hadHighFinding = false;

for (const c of checkers) {
  const fullPath = path.join(__dirname, c);
  const result = spawnSync('node', [fullPath], { stdio: 'inherit' });
  if (result.status === 1) hadHighFinding = true;
  if (result.status === 2) {
    console.error(`[run-all] checker ${c} ERROR — aborting`);
    process.exit(2);
  }
}

console.log('---');
console.log(hadHighFinding
  ? '[run-all] 全部 3 checker 完成,有 finding(预期 — sprint 期间)'
  : '[run-all] 全部 3 checker 完成,0 finding');

process.exit(hadHighFinding ? 1 : 0);
