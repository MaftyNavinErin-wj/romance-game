// src/core/scenario_loader.js
//
// 阶段 1b-1: materializeScenario + sync 顶层 const (mutable container 模式)
//
// 设计 doc 参考: docs/scenario_system.md §7.2 + §8.2 + §8.3
//
// 关键约束:
//   - 1b-1 守底: smoke vs main byte-identical (sync 后 FAC/ALL_FACS/etc. 值不变)
//   - top-level 仍是 const (JS 语义不破), 改写内部 key/value 而非 reassign
//   - materializeScenario 是 pure transform (输入 scenario + base tables, 输出新 obj/array)
//   - 1b-1 sync 范围: FAC / ALL_FACS / PLAYABLE_FACS / FAC_IDENTITY / ETHOS_INIT / DIPLO_INIT
//     (其他顶层 const TECH_PREUNLOCK / MERIT_INIT / GEN_META 等留后续 sub-session)
//
// 加载顺序: v181.html 内 在 src/data/factions.js / general_base.js / city_base.js /
//   faction_base.js / scenarios/214.js 之后, src/core/main.js 之前 (initGame 调用此)

'use strict';

// ── pure transforms ──

// 输入: scenarioId (currently only '214')
// 输出: { scenarioId, startYear, FAC, ALL_FACS, PLAYABLE_FACS, FAC_IDENTITY, ETHOS_INIT, DIPLO_INIT }
//
// 数据源: 全局 SCENARIO_214 + FACTION_BASE (已 load 至顶层 const)
//
// 守底 invariant: 输出值 跟 v181 原 src/data/factions.js literal 字符级一致 (smoke 验证)
function materializeScenario(scenarioId) {
  if (scenarioId !== '214') {
    throw new Error(`materializeScenario: unsupported scenarioId '${scenarioId}' (1b-1 only supports 214)`);
  }
  if (typeof SCENARIO_214 === 'undefined') throw new Error('materializeScenario: SCENARIO_214 not loaded');
  if (typeof FACTION_BASE === 'undefined') throw new Error('materializeScenario: FACTION_BASE not loaded');
  const sc = SCENARIO_214;

  // FAC: { fid: { name, full, ruler, color, cls } }
  // name/full/color/cls from FACTION_BASE; ruler scenario-specific
  const FAC_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    const base = FACTION_BASE[fid];
    if (!base) throw new Error(`materializeScenario: FACTION_BASE missing entry '${fid}'`);
    FAC_m[fid] = {
      name:  base.name,
      full:  base.full,
      ruler: sf.ruler,
      color: base.color,
      cls:   base.cls,
    };
  }

  // ALL_FACS: keys of FAC (exclude 'rebel' — rebel 不进 SCENARIO.factions, filter for safety)
  const ALL_FACS_m = Object.keys(FAC_m).filter(f => f !== 'rebel');

  // PLAYABLE_FACS: factions where playable===true
  // 守底 invariant: order matches Object.entries(sc.factions) → [wei, shu, wu, nanman]
  // (v181 原 const PLAYABLE_FACS = ['wei','shu','wu','nanman'] 同序)
  const PLAYABLE_FACS_m = Object.entries(sc.factions)
    .filter(([_, f]) => f.playable === true)
    .map(([fid]) => fid);

  // FAC_IDENTITY: { fid: { type, _baseType, traits, stage, anchorState } }
  // runtime mutable 字段, initGame 之后 v181 / chains 还可能改 .type / .stage / .anchorState
  const FAC_IDENTITY_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    FAC_IDENTITY_m[fid] = {
      type:        sf.type,
      _baseType:   sf._baseType,
      traits:      [...(sf.traits || [])],
      stage:       sf.stage,
      anchorState: sf.anchorState,
    };
  }

  // ETHOS_INIT: { fid: { mandate, power, civil, military, strategy } }
  const ETHOS_INIT_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    ETHOS_INIT_m[fid] = { ...sf.ethos };
  }

  // DIPLO_INIT: { 'a-b': { rel, status, suzerain? } }
  // 从 scenario 4-tuple [a, b, rel, status] (+ 5th suzerain when vassal) → keyed object
  // 守底 invariant: keys 顺序 matches sc.diplo array order (v181 原 6 entries 同序)
  const DIPLO_INIT_m = {};
  for (const e of sc.diplo) {
    const [a, b, rel, status, suzerain] = e;
    const entry = { status, rel };
    // v181 原 'shu-nanman' entry 含 suzerain, 严格匹配 key 顺序 (status, rel, suzerain)
    if (suzerain !== undefined) entry.suzerain = suzerain;
    DIPLO_INIT_m[`${a}-${b}`] = entry;
  }

  return {
    scenarioId,
    startYear: sc.startYear,
    FAC:          FAC_m,
    ALL_FACS:     ALL_FACS_m,
    PLAYABLE_FACS: PLAYABLE_FACS_m,
    FAC_IDENTITY: FAC_IDENTITY_m,
    ETHOS_INIT:   ETHOS_INIT_m,
    DIPLO_INIT:   DIPLO_INIT_m,
  };
}

// ── sync helpers (mutable container 写入,不 reassign const) ──

// 清空 target 所有 key, Object.assign(target, src)
function syncObject(target, src) {
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, src);
}

// 清空 target array, push 全 src
function syncArray(target, src) {
  target.length = 0;
  target.push(...src);
}

// ── 主入口: 给 initGame 调 ──
// 输入: scenarioId (string)
// Side effect: sync 全部 6 个顶层 const 容器 (FAC / ALL_FACS / PLAYABLE_FACS / FAC_IDENTITY / ETHOS_INIT / DIPLO_INIT)
// 返回: materialized obj (initGame 可读 startYear 等 元字段)
function applyScenario(scenarioId) {
  const m = materializeScenario(scenarioId);
  syncObject(FAC,           m.FAC);
  syncArray(ALL_FACS,       m.ALL_FACS);
  syncArray(PLAYABLE_FACS,  m.PLAYABLE_FACS);
  syncObject(FAC_IDENTITY,  m.FAC_IDENTITY);
  syncObject(ETHOS_INIT,    m.ETHOS_INIT);
  syncObject(DIPLO_INIT,    m.DIPLO_INIT);
  return m;
}
