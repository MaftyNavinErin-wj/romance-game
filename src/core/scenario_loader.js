// src/core/scenario_loader.js
//
// 阶段 1d-c: top-level const 删 + accessor backing 切 G runtime state.
//
// 设计 doc 参考: docs/scenario_system.md §7.2 + §8.2 + §8.3
//
// ── 1d-c 决议 ──
// 1b-1 用 mutable container 模式 (top-level const FAC/ALL_FACS/... 是 empty 容器, applyScenario
// syncObject 填值). 1d-α/a/b 把所有 src/ + v181 直接读写迁移到 accessor 后, top-level const 变 dead
// (零 consumer). 1d-c 删 6 个 top-level const, accessor backing 切到:
//   - 静态数据 (FAC / ALL_FACS / PLAYABLE_FACS / ETHOS_INIT / DIPLO_INIT): 模块级 _scenarioMaterialized 缓存
//   - 运行时 mutable (FAC_IDENTITY): G.facIdentity (随 G save/load)
//   - 运行时 mutable wild gen 池 (WILD_GENS push): G._wildGenDefs (随 G save/load)
//
// WILD_GENS / WILD_GEN_META top-level const **保留** — 它们是数据源 (materialize 输入 +
// data/generals.js:1030 ALL_GENS spread 用), 不是 mutable container.
//
// ── 加载顺序 ──
// v181.html 内 在 src/data/factions.js / general_base.js / city_base.js / faction_base.js /
// scenarios/214.js 之后, src/core/scenario_accessors.js / main.js 之前.
// 本文件末尾自动 applyScenario('214') 确保 G.facIdentity / G._wildGenDefs / _scenarioMaterialized
// 在 accessor 第一次被 call 之前已 populated.

'use strict';

// ── 模块级 materialized cache (静态数据 backing) ──
// 1d-c 新增: 6 个原 top-level const (FAC/ALL_FACS/PLAYABLE_FACS/FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT)
// 中 5 个静态数据 backing 改到此 cache (FAC_IDENTITY 走 G.facIdentity).
// scenario_accessors.js 直接读取此变量 (classic <script> 共享 script scope).
let _scenarioMaterialized = null;

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

// ── 主入口: 给 initGame 调 ──
// 输入: scenarioId (string)
// Side effect:
//   - _scenarioMaterialized 缓存 materialize 输出 (静态数据 backing)
//   - G.facIdentity 写入 (runtime mutable identity, 随 G save/load)
//   - G._wildGenDefs 写入 (runtime mutable wild gen pool, 随 G save/load)
// 返回: materialized obj (initGame 可读 startYear 等 元字段)
function applyScenario(scenarioId) {
  const m = materializeScenario(scenarioId);
  _scenarioMaterialized = m;

  // 1d-c: FAC_IDENTITY → G.facIdentity (runtime mutable).
  // m.FAC_IDENTITY 是 materializeScenario 每次 call 新建的 obj, 直接 assign 到 G.facIdentity
  // 即获得 mutable 独立副本. setFactionIdentity 会 mutate G.facIdentity[fid][k] (含 _scenarioMaterialized.FAC_IDENTITY,
  // 同 obj). 这是预期 — 外部不应直接读 _scenarioMaterialized.FAC_IDENTITY, 只走 accessor.
  G.facIdentity = m.FAC_IDENTITY;

  // 1d-c: WILD_GENS runtime pool → G._wildGenDefs.
  // 初始来源是 WILD_GENS const (data 层数据源, 不动). 用 shared ref 保 byte-identical 行为 — 跟 1d-c
  // 前完全一致 (pre-1d-c WILD_GENS.push 直接 mutate literal, 同 entry shared ref 跨 WILD_GENS / G._wildGenDefs).
  G._wildGenDefs = {};
  if (typeof WILD_GENS !== 'undefined') {
    for (const g of WILD_GENS) G._wildGenDefs[g.name] = g;
  }

  return m;
}

// ── 1c-a codex trial 1 P2 fix: 自动 sync on script load ──
// 1b-1 把 factions.js literal → empty container 后,
// loadFromSlot() (v181 L1747) 等 bypass initGame 的入口 (e.g. 标题画面"读取存档") 会看到
// 6 个 backing 全空, _deserializeG 的 getFactionIdentity check 失败 → 加载存档后游戏破.
//
// 1d-c: backing 从 top-level const 切到 _scenarioMaterialized + G.facIdentity + G._wildGenDefs,
// 但同样需要 auto-apply on script load — 否则脚本加载阶段调 getFactionDef() 会拿空数据.
applyScenario('214');
