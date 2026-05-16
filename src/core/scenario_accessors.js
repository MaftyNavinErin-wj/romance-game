// src/core/scenario_accessors.js
//
// 阶段 1b-2: scenario accessor functions (additive API)
// 阶段 1d-c: backing 切换 — 顶层 const → _scenarioMaterialized (静态) + G runtime state (mutable)
//
// 设计 doc 参考: docs/scenario_system.md §5.4 + §8.2 + §8.3
//
// ── backing 策略 (1d-c 落地) ──
// 静态数据 (init snapshot, immutable) → _scenarioMaterialized (scenario_loader.js 模块级 cache):
//   - FAC (faction def: name/full/ruler/color/cls)
//   - ALL_FACS / PLAYABLE_FACS
//   - ETHOS_INIT (起手 ethos)
//   - DIPLO_INIT (起手外交边)
//
// 运行时 mutable (随 G save/load) → G runtime state:
//   - G.facIdentity (FAC_IDENTITY 后继, 称帝 / 政体变迁 都 mutate 此)
//   - G._wildGenDefs (WILD_GENS pool 后继, 下野 / audit 修复时 add)
//
// 数据源 (top-level const 保留, 不 mutate):
//   - WILD_GEN_META (in src/data/generals.js, 武将元数据, immutable)
//   - WILD_GENS (in src/data/generals.js, 用于 materialize 初始 G._wildGenDefs;
//                §8.4 W6-pending-2: ALL_GENS spread 已退役 → _scenarioMaterialized.GENS_FULL+WILD_GENS)
//
// ── accessor 列表 ──
//   getFactionDef(fid)              → _scenarioMaterialized.FAC[fid] 或 null
//   getAllFactions()                → _scenarioMaterialized.FAC ref (Object.entries/keys 用例)
//   getScenarioFactions()           → _scenarioMaterialized.ALL_FACS ref
//   getPlayableFactions()           → _scenarioMaterialized.PLAYABLE_FACS ref
//   isPlayableFaction(fid)          → boolean
//   getFactionIdentity(fid)         → G.facIdentity[fid] 或 null
//   setFactionIdentity(fid, k, v)   → G.facIdentity[fid][k] = v (写口)
//   getAllFactionIdentities()       → G.facIdentity ref (Object.entries serialize 用例)
//   getEthos(fid)                   → _scenarioMaterialized.ETHOS_INIT[fid] 或 null
//   getDiploInit()                  → _scenarioMaterialized.DIPLO_INIT ref
//   getWildGenDef(name)             → G._wildGenDefs[name] 或 null
//   getAllWildGenDefs()             → Object.values(G._wildGenDefs) (空时 [])
//   addWildGenDef(genData)          → G._wildGenDefs[genData.name] = genData
//   getWildGenMeta(name)            → WILD_GEN_META[name] 或 null (data 源 const)
//
// 加载顺序: 在 src/core/scenario_loader.js 之后 (依赖 _scenarioMaterialized 已 populated +
// G.facIdentity / G._wildGenDefs 已 init). scenario_loader.js 末尾 auto applyScenario('214')
// 确保 src/ 其他 script 加载时 backing 已就位.

'use strict';

// ── faction accessors (1d-c: backing → _scenarioMaterialized) ──

function getFactionDef(fid) {
  return (_scenarioMaterialized && _scenarioMaterialized.FAC[fid]) || null;
}

function getAllFactions() {
  return (_scenarioMaterialized && _scenarioMaterialized.FAC) || {};
}

function getScenarioFactions() {
  return (_scenarioMaterialized && _scenarioMaterialized.ALL_FACS) || [];
}

function getPlayableFactions() {
  return (_scenarioMaterialized && _scenarioMaterialized.PLAYABLE_FACS) || [];
}

function isPlayableFaction(fid) {
  if (!_scenarioMaterialized) return false;
  return _scenarioMaterialized.PLAYABLE_FACS.indexOf(fid) >= 0;
}

// ── faction identity accessors (1d-c: backing → G.facIdentity) ──

function getFactionIdentity(fid) {
  return (G && G.facIdentity && G.facIdentity[fid]) || null;
}

function setFactionIdentity(fid, key, value) {
  if (!G || !G.facIdentity || !G.facIdentity[fid]) return;
  G.facIdentity[fid][key] = value;
}

function getAllFactionIdentities() {
  return (G && G.facIdentity) || {};
}

// ── ethos / diplo accessors (1d-c: backing → _scenarioMaterialized) ──

function getEthos(fid) {
  return (_scenarioMaterialized && _scenarioMaterialized.ETHOS_INIT[fid]) || null;
}

function getDiploInit() {
  return (_scenarioMaterialized && _scenarioMaterialized.DIPLO_INIT) || {};
}

// ── wild general accessors (1d-c: collection backing → G._wildGenDefs, meta 保留 WILD_GEN_META const) ──

function getWildGenDef(name) {
  return (G && G._wildGenDefs && G._wildGenDefs[name]) || null;
}

function getAllWildGenDefs() {
  return (G && G._wildGenDefs) ? Object.values(G._wildGenDefs) : [];
}

function addWildGenDef(genData) {
  if (!G || !G._wildGenDefs || !genData) return;
  G._wildGenDefs[genData.name] = genData;
}

function getWildGenMeta(name) {
  if (typeof WILD_GEN_META === 'undefined') return null;
  return WILD_GEN_META[name] || null;
}
