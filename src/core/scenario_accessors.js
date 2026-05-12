// src/core/scenario_accessors.js
//
// 阶段 1b-2: scenario accessor functions
//
// 设计 doc 参考: docs/scenario_system.md §5.4 + §8.2 + §8.3
//
// 目的:
//   - 给 module-by-module 1c 阶段 grep+替换提供稳定 API 表面
//   - accessor backing 在阶段 1d 切换到 G runtime state, 时 module 端 0 改
//
// 1b-2 范围: 仅新增 accessor 函数 (additive API). 现有模块仍直接读 FAC[fid] 等顶层 const,
//   行为 byte-identical. 模块迁移在 1c, accessor backing 切换在 1d.
//
// accessor 列表 (设计 doc §8.2 + §5.4):
//   getFactionDef(fid)              → FAC[fid] 或 null
//   getScenarioFactions()           → ALL_FACS (ref, 不复制 — 保 forEach byte-identical)
//   getPlayableFactions()           → PLAYABLE_FACS (ref)
//   isPlayableFaction(fid)          → boolean (convenience)
//   getFactionIdentity(fid)         → FAC_IDENTITY[fid] 或 null
//   setFactionIdentity(fid, k, v)   → FAC_IDENTITY[fid][k] = v (写口, 1d 后会改写 G.facIdentity)
//   getEthos(fid)                   → ETHOS_INIT[fid] 或 null
//   getDiploInit()                  → DIPLO_INIT (ref)
//   getWildGenDef(name)             → WILD_GENS.find(g => g.name === name) (1d 会改 G._wildGenDefs[name])
//   getAllWildGenDefs()             → WILD_GENS (ref, 1d-a 新加) — collection forEach/filter/some/spread (1d-c 切 Object.values(G._wildGenDefs))
//   addWildGenDef(genData)          → WILD_GENS.push(genData)   (1d-a 新加) — 下野 / audit 修复写口
//   getWildGenMeta(name)            → WILD_GEN_META[name] (1d 会改 G.wildPoolMeta[name] | G._wildGenMetaInit[name])
//
// 加载顺序: 在 src/data/factions.js + src/core/scenario_loader.js 之后,
//   src/data/generals.js (WILD_GENS / WILD_GEN_META) 也已 load.
//   src/core/main.js initGame 之前.

'use strict';

// ── faction accessors ──

function getFactionDef(fid) {
  return (typeof FAC !== 'undefined' && FAC[fid]) || null;
}

// 1c-c: 返回 FAC 整 object ref (Object.entries / .keys 用例)
function getAllFactions() {
  return (typeof FAC !== 'undefined') ? FAC : {};
}

function getScenarioFactions() {
  return (typeof ALL_FACS !== 'undefined') ? ALL_FACS : [];
}

function getPlayableFactions() {
  return (typeof PLAYABLE_FACS !== 'undefined') ? PLAYABLE_FACS : [];
}

function isPlayableFaction(fid) {
  return (typeof PLAYABLE_FACS !== 'undefined') && PLAYABLE_FACS.indexOf(fid) >= 0;
}

// ── faction identity accessors (1d 后 backing 切到 G.facIdentity) ──

function getFactionIdentity(fid) {
  return (typeof FAC_IDENTITY !== 'undefined' && FAC_IDENTITY[fid]) || null;
}

function setFactionIdentity(fid, key, value) {
  if (typeof FAC_IDENTITY === 'undefined') return;
  if (!FAC_IDENTITY[fid]) return;
  FAC_IDENTITY[fid][key] = value;
}

// ── ethos / diplo accessors ──

function getEthos(fid) {
  return (typeof ETHOS_INIT !== 'undefined' && ETHOS_INIT[fid]) || null;
}

function getDiploInit() {
  return (typeof DIPLO_INIT !== 'undefined') ? DIPLO_INIT : {};
}

// ── wild general accessors (设计 doc §5.4; 1b-2 仍读 WILD_GENS / WILD_GEN_META literal) ──

function getWildGenDef(name) {
  if (typeof WILD_GENS === 'undefined') return null;
  return WILD_GENS.find(g => g.name === name) || null;
}

// 1d-a: 集合 ref (forEach / filter / some / spread 用例).
// 1c-d 留下的 collection 操作 (1c 只迁移 .find): forEach/filter/some/spread/push.
// 1d-c backing 切换后改 Object.values(G._wildGenDefs).
function getAllWildGenDefs() {
  return (typeof WILD_GENS !== 'undefined') ? WILD_GENS : [];
}

// 1d-a: 写口 — 新条目入池 (下野 / audit 修复).
// 1d-c backing 切换后改 G._wildGenDefs[genData.name] = genData.
function addWildGenDef(genData) {
  if (typeof WILD_GENS === 'undefined') return;
  WILD_GENS.push(genData);
}

function getWildGenMeta(name) {
  if (typeof WILD_GEN_META === 'undefined') return null;
  return WILD_GEN_META[name] || null;
}
