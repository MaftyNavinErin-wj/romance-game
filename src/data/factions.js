// src/data/factions.js
//
// 阶段 1b-1 改: 顶层 const 改 empty container, 实际值由 initGame() 内
// materializeScenario + syncObject/syncArray 装入 (src/core/scenario_loader.js).
//
// 设计 doc 参考: docs/scenario_system.md §7 §8.2 §8.3
//
// 守底 invariant (smoke vs main byte-identical):
//   initGame 调用前 这些容器是空 (任何 module-init 读 will see {} / [])
//   initGame 调用后 这些容器 sync 到 scenario.factions 派生值
//   v181 原始 src/data/factions.js literal 值 ≡ materializeScenario('214') 输出
//   (verify: smoke 50 旬 byte-identical)
//
// 原 v181 字面值 (1a.2 抽离至 src/data/scenarios/214.js):
//   - FAC: 4 主势力 (wei/shu/wu/nanman) — name/full/ruler/color/cls
//   - ALL_FACS: Object.keys(FAC).filter(f=>f!=='rebel') 派生
//   - PLAYABLE_FACS: ['wei','shu','wu','nanman']
//   - FAC_IDENTITY: 4 势力 type/_baseType/traits/stage/anchorState
//   - ETHOS_INIT: 4 势力 ethos 5 维
//   - DIPLO_INIT: 6 双向 entry (一向, materialize 时复制为 'b-a')
//
// 1c hardcoded cleanup 阶段后, 这些 const 会被 accessor 替代;
// 1d 阶段, accessor backing 切到 G.facIdentity 等 runtime state.

'use strict';

// ── empty containers (initGame 内 sync) ──
const FAC = {};
const ALL_FACS = [];
const PLAYABLE_FACS = [];
const FAC_IDENTITY = {};
const ETHOS_INIT = {};
const DIPLO_INIT = {};
