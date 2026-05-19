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
// §8.4 W6-pending-5: WILD_GENS const 已退役 (0-consumer, m.WILD_GENS W5a 真值, G._wildGenDefs runtime)。
// WILD_GEN_META top-level const **保留** — W4c decision 2A: gentry 类稀疏 legacy 数据留 const, materialize
// 输入 + getWildGenMeta accessor 用 (m.wildMeta 由 GEN_BASE + sc.generals + WILD_GEN_META 透传 composite)。
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
//     genMeta, wildMeta, initialIntimacyPairs,                            // W4c 真值 (step-2 + W5a 扩 wild)
//     WILD_GENS, pendingGenPool,                                          // W5a 真值
//     initialPosts, initialMerit, initialRetainers,                        // W4b 真值 (W5a 扩 wild merit/retainer)
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
// §8.4 W5a: WILD_GENS / pendingGenPool / wildMeta 真值化 + applyScenario backing 切 (G._wildGenDefs
//   ← m.WILD_GENS 替代 legacy WILD_GENS const)。
//   - m.WILD_GENS  = sc.generals (status='wild' ∪ status='pending' 无 pendingFac) → 跟 legacy WILD_GENS
//                    全集对应 (8 wild + 10 pending-no-pendingFac = 18); minTurn: wild→1, pending→
//                    (availableYear - startYear)*36+1; 五维/apt ← GEN_BASE。
//   - m.pendingGenPool = sc.generals (status='pending' + pendingFac) → 跟 legacy GENS_FULL minTurn>1
//                    对应 (8 entries 散布在 wei/shu/wu); minTurn=(availableYear-startYear)*36+1;
//                    五维/apt ← GEN_BASE; _pendingFac=pendingFac (跟 main.js v143 出场 loop 同 key)。
//   - m.wildMeta   = composite (title/post/loyalty/relations ← wildData + birthplace/clan/values/skills
//                    ← GEN_BASE + gentry ← legacy WILD_GEN_META 透传); 同时 cover wild + pending
//                    (跟 W4c step-2 genMeta 同适配器模式)。
//   - m.initialMerit / m.initialRetainers 扩 wild+pending 段, 派生自 wildData.merit/retainer。
//   byte-identical 故意破 (跟 W4a/b/c 同模式) — minTurn 8 旬差 (legacy 手填 vs availableYear formula)
//   + wild 段 merit/retainer 从 wildData 来 vs legacy MERIT_INIT/RETAINER_PRESET const。换网: 50 回合
//   不崩 + 全 G dump 审差异。
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
      chronicleName: base.chronicleName,  // 可选 override (nanman "南蛮" 二字, 其他 fall .name)
      ruler: sf.ruler,
      color: base.color,
      cls:   base.cls,
      // F-W4c-2 v2 (制作人 decision「称王是分水岭」): 起手已称王/建国 → chronicle 用 chronicleName||.name (国号);
      //   未称王 → 用 .ruler (军阀名)。214 wei/shu/wu/nanman declared:true, 190 14 势力 default false。
      declared: sf.declared === true,
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
    // §5.6 机制 2 (阶段 6 年龄 hook) 前置: GEN_BASE 史实生卒/死因带入 active entry, initGame 算自然 deathTurn
    entry.birthYear  = gb.birthYear;
    entry.deathYear  = gb.deathYear;
    entry.deathCause = gb.deathCause;
    GENS_FULL_m[fid].push(entry);
    if (scGen.gamePost) initialPosts_m[name] = scGen.gamePost;
    if (typeof scGen.merit === 'number') initialMerit_m[name] = scGen.merit;
    if (scGen.retainer) initialRetainers_m[name] = { count: scGen.retainer.count, type: scGen.retainer.type };
    // W4c step-2: genMeta 混合 composite (getGenMeta 消费; relations 用 target→name, icon 死字段丢弃)
    const _legMeta = (typeof GEN_META !== 'undefined' && GEN_META[name]) ? GEN_META[name] : {};
    const _tags = (typeof GEN_TAGS !== 'undefined' && GEN_TAGS[name]) ? GEN_TAGS[name] : _scenarioTagsFromGenBase(gb);
    const _classes = (typeof GEN_CLASS !== 'undefined' && GEN_CLASS[name]) ? GEN_CLASS[name] : _scenarioClassesFromGenBase(gb);
    const meta = {
      title:        _sharedGeneralTitle(name) || scGen.title || _scenarioTitleFallback(name, gb, sc, scGen, _tags, _classes), // ← shared canonical / sc.generals / fallback
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

  // ── W5a: 在野武将 + 待出场池 真值化 (wild ∪ pending → m.WILD_GENS / m.pendingGenPool / m.wildMeta) ──
  // 区分两路径 (跟 v143 双池机制对应):
  //   1. status='wild' 或 status='pending' 无 pendingFac → 走 m.WILD_GENS (legacy WILD_GENS 全集)
  //      runtime 经 refreshWildPool → G.wildPool → 招募 UI; pending 段 minTurn>G.turn 时不进池
  //   2. status='pending' + pendingFac → 走 m.pendingGenPool (legacy GENS_FULL minTurn>1 类)
  //      runtime 经 G.genPendingPool, turn>=minTurn 时直接进 G.generals[pendingFac] active 名册
  // m.wildMeta 同时 cover 两路径 (getGenMeta 一处入口); merit/retainer 扩 wild+pending 段。
  const WILD_GENS_m = [];
  const pendingGenPool_m = [];
  const wildMeta_m = {};
  for (const [name, scGen] of Object.entries(sc.generals)) {
    if (scGen.status !== 'wild' && scGen.status !== 'pending') continue;
    const gb = GEN_BASE[name];
    if (!gb) throw new Error(`materializeScenario: GEN_BASE missing wild/pending general '${name}'`);
    const wd = scGen.wildData || {};
    // 五维/apt entry (跟 legacy WILD_GENS / GENS_FULL minTurn>1 shape 同)
    const entry = { name, com: gb.com, war: gb.war, int: gb.int, pol: gb.pol, cha: gb.cha, apt: { ...gb.apt } };
    if (scGen.status === 'wild') {
      entry.minTurn = 1;
      WILD_GENS_m.push(entry);
    } else if (scGen.pendingFac) {
      // pending + pendingFac → 出场后直接进 active 名册 (GENS_FULL minTurn>1 类)
      entry.minTurn = (scGen.availableYear - sc.startYear) * 36 + 1;
      entry._pendingFac = scGen.pendingFac;
      pendingGenPool_m.push(entry);
    } else {
      // pending 无 pendingFac → 出场后进 wildPool 招募 (legacy WILD_GENS minTurn>1 类)
      entry.minTurn = (scGen.availableYear - sc.startYear) * 36 + 1;
      WILD_GENS_m.push(entry);
    }
    // wildMeta composite — title/post/loyalty/relations ← wildData (剧本状态);
    //   birthplace/clan/faction_clan/values/skills ← GEN_BASE (史实); gentry ← legacy WILD_GEN_META 透传
    //   (跟 W4c step-2 active genMeta 同适配器, 决定 2A: GEN_TAGS 类稀疏 legacy 数据留 const)。
    const _legWildMeta = (typeof WILD_GEN_META !== 'undefined' && WILD_GEN_META[name]) ? WILD_GEN_META[name] : {};
    const _tags = (typeof GEN_TAGS !== 'undefined' && GEN_TAGS[name]) ? GEN_TAGS[name] : _scenarioTagsFromGenBase(gb);
    const _classes = (typeof GEN_CLASS !== 'undefined' && GEN_CLASS[name]) ? GEN_CLASS[name] : _scenarioClassesFromGenBase(gb);
    const meta = {
      title:        _sharedGeneralTitle(name) || wd.title || _scenarioTitleFallback(name, gb, sc, scGen, _tags, _classes),
      loyalty:      wd.loyalty,
      relations:    (wd.relations || []).map(r => ({ name: r.target, type: r.type })),
      birthplace:   gb.birthplace,
      clan:         gb.clan,
      faction_clan: gb.faction_clan,
      values:       [...(gb.values || [])],
      skills:       (gb.skills || []).map(s => ({ ...s })),
      gentry:       _legWildMeta.gentry,
    };
    if (wd.post) meta.post = { ...wd.post };
    wildMeta_m[name] = meta;
    // merit / retainer 扩 wild+pending 段 (active 已在上方 loop 派生)
    if (typeof wd.merit === 'number') initialMerit_m[name] = wd.merit;
    if (wd.retainer) initialRetainers_m[name] = { count: wd.retainer.count, type: wd.retainer.type };
  }

  // ── W4c step-2: 起手亲密度 (intimacy pairs 全 sc.generals 扫, cover active+wild+pending) ──
  // initialIntimacyPairs: [[a,b,v],...] — 起手亲密度 ← sc.generals[].relations[].intimacy。
  //   relations 经 reverse audit 已对称化 (同 pair 双向都列) → normalized key 去重。
  //   byte-identical 故意破 (vs 旧 INTIMACY_PRESET): 实测 0 值冲突 / −18 orphan (指向 214
  //   已死/非名册武将, 如 典韦|曹操) / +102 richer (audit 关系扩至 130 武将, 77→161 pair)。
  // 注: 武将关系数据随 genMeta[name].relations / wildMeta[name].relations 携带 (legacy 形状),
  //   relationsGraph stub 暂不单列。
  const initialIntimacyPairs_m = [];
  const _intimacySeen = new Set();
  for (const [iname, iscGen] of Object.entries(sc.generals)) {
    // §8.4 W5a: relations source 分支 — active 顶层 .relations, wild/pending 在 .wildData.relations
    const _rels = iscGen.status === 'active'
      ? (iscGen.relations || [])
      : ((iscGen.wildData && iscGen.wildData.relations) || []);
    for (const r of _rels) {
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
    wildMeta:             wildMeta_m, // W5a 真值: composite (wildData + GEN_BASE + gentry 透传), cover wild+pending
    initialIntimacyPairs: initialIntimacyPairs_m, // 起手亲密度 [[a,b,v],...] ← sc.generals[].relations[].intimacy
    // ── W5a 真值 (在野/待出场池) ──
    WILD_GENS:            WILD_GENS_m,         // sc.generals wild ∪ pending-no-pendingFac (legacy WILD_GENS 全集)
    pendingGenPool:       pendingGenPool_m,    // sc.generals pending+pendingFac (legacy GENS_FULL minTurn>1 类)
    // ── W4b 真值 (官职/功绩/部曲, W5a 扩 merit/retainer 含 wild+pending) ──
    initialPosts:         initialPosts_m,     // 起手官职 { genName: postName } ← sc.generals active .gamePost
    initialMerit:         initialMerit_m,     // 起手功绩 { genName: number } ← active .merit + wild/pending .wildData.merit
    initialRetainers:     initialRetainers_m, // 起手部曲 { genName: {count,type} } ← active .retainer + wild/pending .wildData.retainer
    aiPersonalities:      {},   // (未切片) AI 性格 { fid: {...} }, 现仍走顶层 const AI_PERSONALITY
    relationsGraph:       {},   // (W4c subsumed) 关系数据随 genMeta[name].relations 携带, 此 slot 暂保留空
  };
}

function _scenarioStateFromGenBase(gb) {
  const src = `${gb.birthplace || ''} ${gb.faction_clan || ''}`;
  if (src.includes('凉州') || src.includes('武威') || src.includes('陇西') || src.includes('金城') || src.includes('扶风')) return 'liang';
  if (src.includes('并州') || src.includes('五原') || src.includes('太原') || src.includes('雁门')) return 'bing';
  if (src.includes('幽州') || src.includes('辽西') || src.includes('北平') || src.includes('渔阳')) return 'you';
  if (src.includes('冀州') || src.includes('河北') || src.includes('渤海')) return 'ji';
  if (src.includes('青州') || src.includes('北海')) return 'qing';
  if (src.includes('徐州') || src.includes('东海') || src.includes('下邳') || src.includes('琅琊')) return 'xu';
  if (src.includes('兖州') || src.includes('东郡') || src.includes('河内') || src.includes('泰山') || src.includes('鲁国')) return 'yan';
  if (src.includes('豫州') || src.includes('汝南') || src.includes('颍川') || src.includes('谯') || src.includes('淮南') || src.includes('山东')) return 'yu';
  if (src.includes('司隶') || src.includes('河东') || src.includes('洛阳')) return 'si';
  if (src.includes('荆州') || src.includes('襄阳') || src.includes('南阳')) return 'jing';
  if (src.includes('益州') || src.includes('蜀') || src.includes('成都') || src.includes('汉中')) return 'yi';
  if (src.includes('扬州') || src.includes('江东') || src.includes('吴郡') || src.includes('会稽')) return 'yang';
  if (src.includes('交州')) return 'jiao';
  return gb.gentry || null;
}

function _scenarioTagsFromGenBase(gb) {
  const values = gb.values || [];
  const classTags = gb.classTagsAll || [gb.classTag].filter(Boolean);
  let politics = 'pragmatic';
  if (values.includes('野心') || values.includes('暴主') || values.includes('名门') || classTags.includes('ruler')) politics = 'warlord';
  if (values.includes('汉室死忠') || values.includes('宗室') || values.includes('仁主')) politics = 'uniHan';

  let combat = 'neutral';
  if ((gb.war || 0) >= 75 || (gb.com || 0) >= 75 || classTags.includes('warrior')) combat = 'hawk';
  if ((gb.pol || 0) >= 75 && (gb.war || 0) < 60) combat = 'dove';

  let origin = 'humble';
  if (gb.gentry) origin = 'gentry';
  else if ((gb.clan || '').includes('汉室宗亲')) origin = 'clan';
  else if ((gb.clan || '').includes('孔氏')) origin = 'noble';
  else if (values.includes('名门')) origin = 'noble';

  let temperament = 'steady';
  if (values.includes('野心') || values.includes('投机')) temperament = 'cunning';
  if (values.includes('暴主')) temperament = 'reckless';
  if (values.includes('忠义') || values.includes('汉室死忠')) temperament = 'steadfast';
  if (values.includes('仁主')) temperament = 'generous';

  const tags = { politics, combat, origin, temperament };
  const state = _scenarioStateFromGenBase(gb);
  if (state) tags.state = state;
  if (gb.clan) tags.clan = gb.clan;
  return tags;
}

function _scenarioClassesFromGenBase(gb) {
  const raw = gb.classTagsAll || [gb.classTag].filter(Boolean);
  const mapped = raw.map(c => {
    if (c === 'civilian') return 'minister';
    if (c === 'ruler') return 'commander';
    return c;
  }).filter(c => ['warrior', 'commander', 'strategist', 'minister'].includes(c));
  return Array.from(new Set(mapped.length ? mapped : ['warrior']));
}

const SCENARIO_190_TITLE_OVERRIDES = {
  '董卓': '乱世暴相',
  '吕布': '飞将无双',
  '李傕': '凉州悍将',
  '郭汜': '西凉骁骑',
  '华雄': '汜水猛将',
  '胡轸': '凉州宿将',
  '樊稠': '西凉劲旅',
  '张济': '武威旧将',
  '高顺': '陷阵营主',
  '牛辅': '董氏亲将',
  '徐荣': '破曹名帅',
  '李儒': '毒谋深臣',
  '袁绍': '四世盟主',
  '颜良': '河北骁将',
  '文丑': '河北猛锋',
  '审配': '刚直幕臣',
  '麴义': '先登名将',
  '田丰': '河北直谏',
  '沮授': '监军谋主',
  '逢纪': '袁门谋臣',
  '许攸': '旧交奇谋',
  '高览': '河北勇将',
  '淳于琼': '乌巢宿将',
  '袁术': '淮南野心',
  '纪灵': '淮南上将',
  '张勋': '袁术宿将',
  '桥蕤': '淮南偏师',
  '雷薄': '淮南悍将',
  '卫兹': '陈留义士',
  '史涣': '河内忠骑',
  '戏志才': '早逝奇佐',
  '鲍信': '济北义烈',
  '孙坚': '江东猛虎',
  '祖茂': '赤帻护主',
  '刘表': '荆州名牧',
  '蒯越': '荆襄谋主',
  '蒯良': '荆州良佐',
  '蔡瑁': '襄阳水军',
  '张允': '荆州水将',
  '王威': '荆州忠将',
  '刘焉': '益州牧守',
  '刘璋': '益州少主',
  '王累': '益州忠臣',
  '吴兰': '益州牙将',
  '张任': '落凤之弩',
  '张松': '倒持西蜀',
  '刘虞': '幽州仁牧',
  '鲜于辅': '幽州义从',
  '阎柔': '乌桓抚将',
  '田畴': '无终高士',
  '公孙瓒': '白马将军',
  '严纲': '白马先锋',
  '田楷': '青州都督',
  '关靖': '幽州谋佐',
  '邹丹': '北地偏将',
  '单经': '白马旧将',
  '陶谦': '徐州老臣',
  '陈登': '广陵奇士',
  '曹豹': '徐州兵权',
  '张闿': '徐州乱刃',
  '韩馥': '冀州弱牧',
  '耿武': '冀州忠臣',
  '赵浮': '冀州勇将',
  '闵纯': '韩门直臣',
  '马腾': '扶风边帅',
  '韩遂': '金城枭雄',
  '庞德': '抬榇决死',
  '阎行': '西凉锐枪',
  '成宜': '关中部帅',
  '马铁': '扶风少将',
  '马休': '扶风少将',
  '孔融': '北海名士',
  '武安国': '北海猛士',
  '宗宝': '北海牙将',
  '齐周': '幽州书佐',
  '程奂': '冀州偏将',
  '刘磐': '荆南猛将',
  '李严': '蜀中重臣',
  '孟达': '反复无常',
  '申耽': '上庸豪族',
  '雷铜': '蜀中牙将',
  '鲜于银': '幽州旧部',
  '蒋琬': '社稷之器',
  '郝昭': '陈仓坚壁',
  '杨洪': '蜀中干吏',
  '费祎': '折冲良臣',
  '王濬': '楼船灭吴',
  '邓艾': '偷渡阴平',
  '羊祜': '襄阳儒帅',
  '钟会': '志大才疏',
  '文鸯': '单骑退兵',
  '刘琦': '荆州长公子',
  '刘琮': '荆州降嗣',
  '曹丕': '魏文嗣君',
  '孙权': '碧眼紫髯',
  '吕蒙': '白衣渡江',
  '陆逊': '火烧连营',
  '诸葛亮': '卧龙先生',
  '庞统': '凤雏先生',
  '司马懿': '冢虎伏谋',
  '姜维': '天水麒麟儿',
  '陈泰': '抗蜀名将',
};

function _sharedGeneralTitle(name) {
  const sc214Gen = (typeof SCENARIOS !== 'undefined' && SCENARIOS['214'] && SCENARIOS['214'].generals)
    ? SCENARIOS['214'].generals[name]
    : null;
  if (sc214Gen) {
    if (sc214Gen.title) return sc214Gen.title;
    if (sc214Gen.wildData && sc214Gen.wildData.title) return sc214Gen.wildData.title;
  }
  if (typeof WILD_GEN_META !== 'undefined' && WILD_GEN_META[name] && WILD_GEN_META[name].title) {
    return WILD_GEN_META[name].title;
  }
  if (typeof GEN_BASE !== 'undefined' && GEN_BASE[name] && GEN_BASE[name].wildMeta && GEN_BASE[name].wildMeta.title) {
    return GEN_BASE[name].wildMeta.title;
  }
  return null;
}

function _scenarioTitleFallback(name, gb, sc, scGen, tags, classes) {
  const sharedTitle = _sharedGeneralTitle(name);
  if (sharedTitle) return sharedTitle;
  if (sc && sc.id === '190' && SCENARIO_190_TITLE_OVERRIDES[name]) return SCENARIO_190_TITLE_OVERRIDES[name];
  if (scGen.role === 'ruler') return tags.politics === 'uniHan' ? '汉室州牧' : '乱世诸侯';
  if (classes.includes('strategist')) return '帷幄谋臣';
  if (classes.includes('minister')) return '治政能臣';
  if (classes.includes('commander')) return '统兵宿将';
  if ((gb.war || 0) >= 85) return '阵前猛将';
  return '乱世英才';
}

function _backfillScenarioGeneralLegacyTables(sc, m) {
  if (!sc) return;
  if (typeof GEN_BASE === 'undefined') return;
  for (const [name, scGen] of Object.entries(sc.generals || {})) {
    const gb = GEN_BASE[name];
    if (!gb) continue;
    if (typeof GEN_TAGS !== 'undefined' && !GEN_TAGS[name]) {
      GEN_TAGS[name] = _scenarioTagsFromGenBase(gb);
    }
    if (typeof GEN_CLASS !== 'undefined' && !GEN_CLASS[name]) {
      GEN_CLASS[name] = _scenarioClassesFromGenBase(gb);
    }
    if (typeof GEN_META !== 'undefined' && !GEN_META[name]) {
      const src = scGen.status === 'active' ? m.genMeta[name] : m.wildMeta[name];
      if (src) {
        const tags = (typeof GEN_TAGS !== 'undefined' && GEN_TAGS[name]) ? GEN_TAGS[name] : _scenarioTagsFromGenBase(gb);
        const classes = (typeof GEN_CLASS !== 'undefined' && GEN_CLASS[name]) ? GEN_CLASS[name] : _scenarioClassesFromGenBase(gb);
        GEN_META[name] = {
          title: src.title || _scenarioTitleFallback(name, gb, sc, scGen, tags, classes),
          post: src.post ? { ...src.post } : undefined,
          skills: (src.skills || []).map(s => ({ ...s })),
          loyalty: src.loyalty,
          values: [...(src.values || [])],
          birthplace: src.birthplace,
          clan: src.clan,
          gentry: src.gentry,
          faction_clan: src.faction_clan,
          relations: (src.relations || []).map(r => ({ ...r })),
        };
      }
    }
  }
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
  const sc = SCENARIOS[scenarioId];

  _backfillScenarioGeneralLegacyTables(sc, m);

  // 1d-c: FAC_IDENTITY → G.facIdentity (runtime mutable).
  // m.FAC_IDENTITY 是 materializeScenario 每次 call 新建的 obj, 直接 assign 到 G.facIdentity
  // 即获得 mutable 独立副本. setFactionIdentity 会 mutate G.facIdentity[fid][k] (含 _scenarioMaterialized.FAC_IDENTITY,
  // 同 obj). 这是预期 — 外部不应直接读 _scenarioMaterialized.FAC_IDENTITY, 只走 accessor.
  G.facIdentity = m.FAC_IDENTITY;

  // §8.4 W5a: WILD_GENS runtime pool → G._wildGenDefs ← m.WILD_GENS (替代 legacy WILD_GENS const)。
  // m.WILD_GENS 是 materializeScenario 每次 call 新建 (sc.generals wild ∪ pending-no-pendingFac 派生);
  // 直接 assign 到 G._wildGenDefs[name] 即获得独立副本, 后续 mutate (addWildGenDef 下野武将 push,
  // refreshWildPool defectedFrom 字段写) 落在 G 上, 不污染 _scenarioMaterialized.WILD_GENS。
  // legacy WILD_GENS const 在 W6 退役 (删 data/generals.js:42 literal); W5a 阶段它仍存在 (data 层数据源)
  // 但 runtime backing 已切, 不再被消费 — addWildGenDef 等只走 G._wildGenDefs。
  G._wildGenDefs = {};
  for (const g of m.WILD_GENS) G._wildGenDefs[g.name] = g;

  // §8.4 W6-pending-4: CITIES_DEF + CITY_MAP mutable container sync (1b-1 模式跟 FAC/ALL_FACS 同)。
  // m.CITIES_DEF entries 直接 push 到 legacy CITIES_DEF 容器, 共享对象引用 — map.js:599 x/y augment
  // 同时作用 m.CITIES_DEF entries 和 CITIES_DEF entries (同 obj), CITY_MAP[id] 也是同 entry。
  // 切 scenario (190 / future) 时 applyScenario re-sync, 容器自动 refresh。
  CITIES_DEF.length = 0;
  for (const c of m.CITIES_DEF) CITIES_DEF.push(c);
  for (const k of Object.keys(CITY_MAP)) delete CITY_MAP[k];
  for (const c of m.CITIES_DEF) CITY_MAP[c.id] = c;

  // codex W6-pending-4 P1 fix: mid-game applyScenario (startAs 切剧本) 后 CITIES_DEF entries 是新 obj,
  // map.js:599 top-level x/y augment 只在 boot 跑一次, 不会 re-stamp. 加 hexToPixel guard 重 augment.
  // 首次 boot 时 hexToPixel 未定义 (scenario_loader L820 < map.js L828), skip; map.js:599 boot 末尾兜底 stamp.
  // 之后所有 applyScenario call 时 hexToPixel 已定义, 此处 augment 接管。
  if (typeof hexToPixel === 'function') {
    for (const c of m.CITIES_DEF) {
      const p = hexToPixel(c.q, c.r);
      c.x = p.x; c.y = p.y;
    }
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
