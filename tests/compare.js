// compare.js — deep-diff between baseline.json and current.json
//
// 用法:
//   node tests/compare.js [baseline_path] [current_path]
// 默认:
//   baseline = tests/baseline/phase1f_p4_p4_complete.json (最新阶段 baseline)
//   current  = tests/current.json
//
// Baseline 演进顺序(每阶段完成时锁定一份,旧 baseline 保留供回归):
//   v181_pre_refactor (重构前权威基准,phase 0)
//     → phase1_post (phase 1 数据层抽离完成)
//     → phase2_complete (phase 2 渲染层抽离完成)
//     → phase3_complete (phase 3 机制 chain 抽离完成)
//     → data_completion_complete (data-completion sprint 数据补完)
//     → phase1f_complete (scenario 1f 河北 3 新城 bohai/pingyuan/zhuojun, 48 cities)
//     → phase1f_p2_complete (1f-p2 +徐州 xiaopei/donghai +荆南 wuling +关陇 shangdang/anding, 53 cities)
//     → phase1f_p3_complete (1f-p3 +江东 suzhou +徐州东北 langya + bingzhou r=11→8, 55 cities)
//     → phase1f_p3_p2_complete (1f-p3-p2 STATE_CITIES 10 新城分州 + STATE_TIER 升级)
//     → phase1f_p4_complete (1f-p4 10 新城 COUNTY_DATA + 3 magnate move 谯县/朐县/吴县;吴县 type=seat latent — clan logic 未 trigger)
//     → phase1f_p4_p2_complete (1f-p4-p2 codex catch: 吴县 type='clan_base' + 娄县 seat, 顾陆朱 clan 真正 trigger, 55 cities)
//     → phase1f_p4_p3_complete (1f-p4-p3 v181 latent fix: getGenBirthplace 改读 GEN_META — v170 籍贯系统 (getGenHomeCounty/Home City + 县属 loyalty 本族放大 ×2.0) 终于真正 work, 55 cities)
//     → phase1f_p4_p4_complete (1f-p4-p4 audit-driven: COUNTY_DATA langya 补 莒县 / suzhou 补 钱唐 — 徐盛/全琮 birthplace orphan fix, 55 cities, **当前默认**)
//
// 退出码:
//   0 = PASS(完全一致)
//   1 = FAIL(有 diff)
//   2 = ERROR(文件读不到等)

'use strict';

const fs = require('fs');
const path = require('path');

const BASELINE_DEFAULT = path.resolve(__dirname, 'baseline', 'phase1f_p4_p4_complete.json');
const CURRENT_DEFAULT  = path.resolve(__dirname, 'current.json');

function diff(a, b, p, out, max) {
  if (out.length >= max) return;
  if (a === b) return;
  if (typeof a !== typeof b) {
    out.push({ path: p, expected: a, actual: b, kind: 'type' });
    return;
  }
  if (a == null || b == null) {
    out.push({ path: p, expected: a, actual: b, kind: 'null' });
    return;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      out.push({ path: p, expected: a, actual: b, kind: 'arrayShape' });
      return;
    }
    if (a.length !== b.length) {
      out.push({ path: p + '.length', expected: a.length, actual: b.length, kind: 'length' });
    }
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      diff(a[i], b[i], `${p}[${i}]`, out, max);
      if (out.length >= max) return;
    }
    return;
  }
  if (typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      diff(a[k], b[k], p ? `${p}.${k}` : k, out, max);
      if (out.length >= max) return;
    }
    return;
  }
  // primitive 不等
  out.push({ path: p, expected: a, actual: b, kind: 'value' });
}

function fmt(v) {
  if (v === undefined) return 'undefined';
  const s = JSON.stringify(v);
  return s.length > 80 ? s.slice(0, 77) + '...' : s;
}

function main() {
  const args = process.argv.slice(2);
  const basePath = args[0] || BASELINE_DEFAULT;
  const curPath  = args[1] || CURRENT_DEFAULT;
  const MAX_DIFFS = 50;

  if (!fs.existsSync(basePath)) {
    console.error('[compare] baseline not found:', basePath);
    process.exit(2);
  }
  if (!fs.existsSync(curPath)) {
    console.error('[compare] current not found:', curPath);
    process.exit(2);
  }

  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const cur  = JSON.parse(fs.readFileSync(curPath, 'utf8'));

  // meta 字段忽略 generated_at(每次跑都不同)
  const baseSnap = base.snapshots;
  const curSnap  = cur.snapshots;

  const diffs = [];
  diff(baseSnap, curSnap, 'snapshots', diffs, MAX_DIFFS);

  if (diffs.length === 0) {
    console.log(`[compare] PASS — ${baseSnap.length} snapshots identical`);
    process.exit(0);
  }

  console.log(`[compare] FAIL — ${diffs.length}${diffs.length === MAX_DIFFS ? '+' : ''} diffs (showing first ${diffs.length})`);
  for (const d of diffs) {
    console.log(`  ${d.path}: expected=${fmt(d.expected)} actual=${fmt(d.actual)} [${d.kind}]`);
  }
  process.exit(1);
}

main();
