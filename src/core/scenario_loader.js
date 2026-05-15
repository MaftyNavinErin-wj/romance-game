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

// 输入: scenarioId (string, lookup in SCENARIOS register; 2-a: '214' / '190' stub)
// 输出: §7.2 完整 materialized contract —
//   { scenarioId, startYear,
//     FAC, ALL_FACS, PLAYABLE_FACS, FAC_IDENTITY, ETHOS_INIT, DIPLO_INIT,   // 1b 已实装
//     initialRes, reputations, emperorHolder, techPreunlocks,              // W1 真值
//     foundingCores, initLog,                                             // W1 真值
//     CITIES_DEF,                                                         // W2 真值
//     initialUnits,                                                       // W3 真值
//     GENS_FULL,                                                          // W4a 真值 (step-2)
//     genMeta, wildMeta, initialIntimacyPairs,                            // W4c 真值 (step-2)
//     WILD_GENS, pendingGenPool,                                          // W5 stub
//     initialPosts, initialMerit, initialRetainers,                        // W4b 真值
//     aiPersonalities, relationsGraph }                                   // 未切片 / relationsGraph 暂 stub
//
// 数据源: 全局 SCENARIOS[scenarioId] + FACTION_BASE + CITY_BASE + GEN_BASE (已 load 至顶层 const)
//   W4a step-2: GENS_FULL adapter 输入 = GEN_BASE + sc.generals (step-1 的旧 GENS_FULL const 已弃)
//
// 守底 invariant: scenarioId='214' 输出值 跟 v181 原 src/data/factions.js literal 字符级一致
//                 (smoke 验证; SCENARIOS['214'] === SCENARIO_214 同 object).
// 2-a 改: phase 1a 的 hardcoded `if(scenarioId !== '214')` 改 SCENARIOS register lookup,
//        为 phase 2-b/3/4 渐进填充 SCENARIO_190 铺路.
// §8.4 W1: 输出补成 §7.2 完整形状 — W1 真值字段派生自 sc.factions / sc.emperor / sc.initLog,
//          W2-W6 stub 字段先占形状 (空集合, 渐进填充). pure transform 约束不变.
// §8.4 W2: CITIES_DEF 真值化 — sc.cities + CITY_BASE merge (byte-identical legacy CITIES_DEF).
// §8.4 W3: initialUnits 真值化 — sc.initialUnits deep-copy (byte-identical 原硬编码 initUnits).
// §8.4 W4a step-2: GENS_FULL adapter 输入切到 GEN_BASE + SCENARIO.generals (替代 step-1 的旧
//   GENS_FULL const)。byte-identical 故意破 — GEN_BASE deathYear audit + 214 名册 membership
//   audit 改过 (这是目的)。换网: 跑满 50 回合不崩 + 数值合理 + 人工/codex 审差异。
//   实测差异 (step-1 vs step-2): 纯名册 membership +9/-14 (多为史实 214 已死武将正确移除)
//   + 数组顺序; 重叠武将五维/apt 零变化。
// §8.4 W4b: initialPosts/initialMerit/initialRetainers 真值化 — 派生自 sc.generals active 的
//   .gamePost / .merit / .retainer。gamePost = W4b 新增 SCENARIO schema 字段 (① 游戏官职档位,
//   区别于 .post = 招牌头衔)。initialRetainers 是 W4b 新增 contract 槽位 (§7.2 原缺)。
// §8.4 W4c step-1: genMeta/wildMeta/initialIntimacyPairs 真值化 — adapter 输入 = legacy
//   GEN_META / WILD_GEN_META / INTIMACY_PRESET const (byte-identical 守底)。getGenMeta 改读
//   _scenarioMaterialized.genMeta。制作人决策: meta 走「适配器模式」consumer shape 不变。
// §8.4 W4c step-2: genMeta 输入切到 GEN_BASE (birthplace/clan/faction_clan/values/skills) +
//   sc.generals (title/post/loyalty/relations), gentry 保持 legacy GEN_META 透传 (决定 2A);
//   initialIntimacyPairs 切 sc.generals[].relations[].intimacy; wildMeta 仍 legacy 透传 (W5 再切)。
//   byte-identical 故意破 — GEN_BASE audit + 名册改过 (这是目的)。换网: 50 回合 + 全 G dump 审差异。
function materializeScenario(scenarioId) {
  if (typeof SCENARIOS === 'undefined') throw new Error('materializeScenario: SCENARIOS register not loaded (scenarios/index.js missing)');
  if (typeof FACTION_BASE === 'undefined') throw new Error('materializeScenario: FACTION_BASE not loaded');
  if (typeof CITY_BASE === 'undefined') throw new Error('materializeScenario: CITY_BASE not loaded');
  if (typeof GEN_BASE === 'undefined') throw new Error('materializeScenario: GEN_BASE not loaded');
  const sc = SCENARIOS[scenarioId];
  if (!sc) throw new Error(`materializeScenario: unknown scenarioId '${scenarioId}' (registered: ${Object.keys(SCENARIOS).join(',')})`);

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

  // ── W1: 势力杂项 + 入口/叙事 真值派生 ──

  // initialRes: { fid: { gold, wood, iron, horses } }
  // 守底 invariant: 跟 v181 initGame 硬编码 res 字面值一致.
  // rebel 势力不在 sc.factions, 仍由 initGame 硬编码 99999999.
  const initialRes_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    initialRes_m[fid] = { ...(sf.res || {}) };
  }

  // reputations: { fid: number } — 起手声望 (initGame G.reputation 字面)
  const reputations_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    reputations_m[fid] = sf.reputation;
  }

  // emperorHolder: { cityId, holder } — 天子位置 (initGame G.emperor 字面)
  const emperorHolder_m = { ...(sc.emperor || {}) };

  // techPreunlocks: { fid: [techId,...] } — 起手已研究科技
  const techPreunlocks_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    techPreunlocks_m[fid] = [...(sf.techPreunlock || [])];
  }

  // foundingCores: { fid: Set<genName> } — 创业班底.
  // v181 const FOUNDING_CORE 是 Set, initGame coreSet.has() 调用保持 byte-identical;
  // economy / general chain 仍直接读顶层 const FOUNDING_CORE (W1 不动).
  const foundingCores_m = {};
  for (const [fid, sf] of Object.entries(sc.factions)) {
    foundingCores_m[fid] = new Set(sf.foundingCore || []);
  }

  // initLog: [[msg, type], ...] — 开局叙事 log (initGame 末尾 verbatim)
  const initLog_m = (sc.initLog || []).map(e => [...e]);

  // ── W2: 城市 — sc.cities + CITY_BASE merge → legacy CITIES_DEF-shaped array ──
  // 守底 invariant: 跟 legacy CITIES_DEF const byte-identical (array order + key order + 值).
  //   - CITY_BASE[cid]: name/q/r/tags/jun/size/base (地理 immutable)
  //   - sc.cities[cid]: fac/pop/troops/isCapital (scenario state)
  // x/y 像素坐标不在此 — pure transform 不能调 hexToPixel (load 顺序: 本文件早于 map.js);
  //   initGame 消费时 stamp (legacy map.js:599 对 CITIES_DEF const 做同样 augment).
  // isCapital: legacy CITIES_DEF 只在 capital 城带 isCapital:true, 非 capital 省略该 key —
  //   严格复刻 (sc.cities 里非 capital 是 isCapital:false, 此处 falsy 不写, 保 key 集一致).
  const CITIES_DEF_m = [];
  for (const [cid, scity] of Object.entries(sc.cities)) {
    const base = CITY_BASE[cid];
    if (!base) throw new Error(`materializeScenario: CITY_BASE missing entry '${cid}'`);
    const entry = {
      id:     cid,
      name:   base.name,
      q:      base.q,
      r:      base.r,
      tags:   [...base.tags],
      jun:    base.jun,
      fac:    scity.fac,
      pop:    scity.pop,
      troops: scity.troops,
    };
    if (scity.isCapital) entry.isCapital = true;
    entry.size = base.size;
    entry.base = { ...base.base };
    CITIES_DEF_m.push(entry);
  }

  // ── W3: 起手野战部队 — sc.initialUnits deep-copy ──
  // 守底 invariant: 跟 v181 initGame 硬编码 initUnits 数组 byte-identical
  //   (unit 顺序 + {fac,city,squads} key order + 每 squad {genName,type,troops,maxTroops,morale}).
  // deep-copy: 每次 materialize 产新结构 — 复刻 legacy 「literal 每次 initGame 新建」语义,
  //   createUnit 消费 squads 不污染 _scenarioMaterialized.
  const initialUnits_m = (sc.initialUnits || []).map(u => ({
    fac:    u.fac,
    city:   u.city,
    squads: (u.squads || []).map(sq => ({ ...sq })),
  }));

  // ── W4a step-2: 武将名册 — adapter 输入 = GEN_BASE + SCENARIO.generals ──
  // §8.4 adapter 两步走 step-2: 输入从旧 GENS_FULL const 切到 GEN_BASE + sc.generals。
  //   step-1 已证明「adapter + new init path == 旧 runtime」(plumbing 正确),
  //   所以 step-2 任何差异都可归因于「新数据」, 不是 plumbing bug。
  // 映射: sc.generals 中 status==='active' 的武将 → 按 fac 分组进 m.GENS_FULL[fid];
  //   五维 (com/war/int/pol/cha) + apt ← GEN_BASE[name];
  //   role: 旧 GENS_FULL 语义只 ruler 带 role, 故 sc.role==='ruler' 才写 entry.role。
  // wild/pending 武将 (status!=='active') 不进 m.GENS_FULL — 留 W5 (m.WILD_GENS/pendingGenPool)。
  // 输出 shape 跟 step-1 一致 ({fid:[{name,com,war,int,pol,cha,role?,apt}]}) — initGame 名册 loop 不变。
  const GENS_FULL_m = {};
  for (const fid of ALL_FACS_m) GENS_FULL_m[fid] = [];   // 预 init, key order = {wei,shu,wu,nanman}
  // §8.4 W4b: 起手官职 / 功绩 / 部曲 — 单趟 active loop 派生 (sc.generals .gamePost/.merit/.retainer)
  // §8.4 W4c step-2: genMeta 混合 composite 同趟派生 — title/post/loyalty/relations ← sc.generals,
  //   birthplace/clan/faction_clan/values/skills ← GEN_BASE, gentry ← legacy GEN_META 透传
  //   (GEN_BASE.gentry 是州码, 不符 calcGentryRecruitBonus 的「颍川士族」显示标签口径, 无新家
  //    — 制作人决定 2A: GEN_TAGS 类稀疏 legacy 数据留 const, 190 缺口记 followup)。
  const initialPosts_m = {};      // { genName: postName }      ← .gamePost (① 游戏官职档位)
  const initialMerit_m = {};      // { genName: number }        ← .merit
  const initialRetainers_m = {};  // { genName: {count,type} }  ← .retainer
  const genMeta_m = {};           // { genName: metaObj }       W4c step-2 混合 composite (legacy GEN_META 形状)
  for (const [name, scGen] of Object.entries(sc.generals)) {
    if (scGen.status !== 'active') continue;
    const gb = GEN_BASE[name];
    if (!gb) throw new Error(`materializeScenario: GEN_BASE missing active general '${name}'`);
    const fid = scGen.fac;
    if (!GENS_FULL_m[fid]) GENS_FULL_m[fid] = [];        // 防御 (active fac 应都在 ALL_FACS)
    const entry = { name, com: gb.com, war: gb.war, int: gb.int, pol: gb.pol, cha: gb.cha };
    if (scGen.role === 'ruler') entry.role = 'ruler';
    entry.apt = { ...gb.apt };
    GENS_FULL_m[fid].push(entry);
    if (scGen.gamePost) initialPosts_m[name] = scGen.gamePost;
    if (typeof scGen.merit === 'number') initialMerit_m[name] = scGen.merit;
    if (scGen.retainer) initialRetainers_m[name] = { count: scGen.retainer.count, type: scGen.retainer.type };
    // W4c step-2: genMeta 混合 composite (getGenMeta 消费; relations 用 target→name, icon 死字段丢弃)
    const _legMeta = (typeof GEN_META !== 'undefined' && GEN_META[name]) ? GEN_META[name] : {};
    const meta = {
      title:        scGen.title,                                            // ← sc.generals
      loyalty:      scGen.loyalty,                                           // ← sc.generals
      relations:    (scGen.relations || []).map(r => ({ name: r.target, type: r.type })), // ← sc.generals
      birthplace:   gb.birthplace,                                           // ← GEN_BASE
      clan:         gb.clan,                                                 // ← GEN_BASE
      faction_clan: gb.faction_clan,                                         // ← GEN_BASE
      values:       [...(gb.values || [])],                                  // ← GEN_BASE
      skills:       (gb.skills || []).map(s => ({ ...s })),                   // ← GEN_BASE (已实装技能)
      gentry:       _legMeta.gentry,                                         // ← legacy GEN_META 透传 (决定 2A)
    };
    if (scGen.post) meta.post = { ...scGen.post };                           // ← sc.generals 招牌头衔 (②)
    genMeta_m[name] = meta;
  }

  // ── W4c step-2: 在野武将 meta + 起手亲密度 ──
  // 制作人决策 (2026-05-15): meta 接线走「适配器模式」—— consumer 看到的 shape 不变,
  //   getGenMeta 35 处 / GEN_TAGS 19 文件 consumer 零改动 (跟 W4a「心脏」adapter 同哲学)。
  // genMeta 已在上方 active loop 派生 (混合 composite)。
  // wildMeta: 在野武将 meta — 保持 legacy WILD_GEN_META const 透传 (在野/待出场归 W5,
  //   跟 W4a/W4b 只做 active 一致; getGenMeta 对 wild 名册仍走旧 meta, W5 再切到 sc.generals)。
  // initialIntimacyPairs: [[a,b,v],...] — 起手亲密度 ← sc.generals[].relations[].intimacy。
  //   relations 经 reverse audit 已对称化 (同 pair 双向都列) → normalized key 去重。
  //   byte-identical 故意破 (vs 旧 INTIMACY_PRESET): 实测 0 值冲突 / −18 orphan (指向 214
  //   已死/非名册武将, 如 典韦|曹操) / +102 richer (audit 关系扩至 130 武将, 77→161 pair)。
  // 注: 武将关系数据随 genMeta[name].relations 携带 (legacy 形状), relationsGraph stub 暂不单列。
  const wildMeta_m = (typeof WILD_GEN_META !== 'undefined') ? WILD_GEN_META : {};
  const initialIntimacyPairs_m = [];
  const _intimacySeen = new Set();
  for (const [iname, iscGen] of Object.entries(sc.generals)) {
    for (const r of (iscGen.relations || [])) {
      if (typeof r.intimacy !== 'number' || !r.target) continue;
      const key = iname < r.target ? `${iname} ${r.target}` : `${r.target} ${iname}`;
      if (_intimacySeen.has(key)) continue;
      _intimacySeen.add(key);
      initialIntimacyPairs_m.push([iname, r.target, r.intimacy]);
    }
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
    // ── W1 真值 (势力杂项 + 入口/叙事) ──
    initialRes:     initialRes_m,
    reputations:    reputations_m,
    emperorHolder:  emperorHolder_m,
    techPreunlocks: techPreunlocks_m,
    foundingCores:  foundingCores_m,
    initLog:        initLog_m,
    // ── W2 真值 (城市) ──
    CITIES_DEF:     CITIES_DEF_m,   // sc.cities + CITY_BASE merge (byte-identical legacy CITIES_DEF, 无 x/y)
    // ── W3 真值 (起手野战部队) ──
    initialUnits:   initialUnits_m, // sc.initialUnits deep-copy (byte-identical 原硬编码 initUnits)
    // ── W4a step-1 真值 (武将名册) ──
    GENS_FULL:      GENS_FULL_m, // adapter step-1: 旧 GENS_FULL const deep-copy ({fid:[genObj]})
    // ── W4c step-2 真值 (武将 meta + 起手亲密度) ──
    genMeta:              genMeta_m,  // 势力武将 meta 混合 composite (GEN_BASE + sc.generals + gentry 透传)
    wildMeta:             wildMeta_m, // 在野武将 meta — legacy WILD_GEN_META 透传 (W5 再切 sc.generals)
    initialIntimacyPairs: initialIntimacyPairs_m, // 起手亲密度 [[a,b,v],...] ← sc.generals[].relations[].intimacy
    // ── §7.2 contract stub (W5-W6 渐进填充, 暂空集合占形状) ──
    WILD_GENS:            [],   // W5: 在野武将 def
    pendingGenPool:       [],   // W5: 待出场池
    initialPosts:         initialPosts_m,     // W4b: 起手官职 { genName: postName } ← sc.generals active .gamePost
    initialMerit:         initialMerit_m,     // W4b: 起手功绩 { genName: number } ← sc.generals active .merit
    initialRetainers:     initialRetainers_m, // W4b: 起手部曲 { genName: {count,type} } ← sc.generals active .retainer
    aiPersonalities:      {},   // (未切片) AI 性格 { fid: {...} }, 现仍走顶层 const AI_PERSONALITY
    relationsGraph:       {},   // (W4c subsumed) 关系数据随 genMeta[name].relations 携带, 此 slot 暂保留空
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
