// src/data/factions.js
//
// 阶段 1d-c: 6 个顶层 const (FAC / ALL_FACS / PLAYABLE_FACS / FAC_IDENTITY / ETHOS_INIT / DIPLO_INIT) 已删.
// backing 切换:
//   - 静态数据 → _scenarioMaterialized 模块级 cache (src/core/scenario_loader.js)
//   - 运行时 mutable (FAC_IDENTITY 后继) → G.facIdentity
//   全部读写走 accessor (src/core/scenario_accessors.js):
//     getFactionDef / getAllFactions / getScenarioFactions / getPlayableFactions / isPlayableFaction /
//     getFactionIdentity / setFactionIdentity / getAllFactionIdentities / getEthos / getDiploInit
//
// 设计 doc 参考: docs/scenario_system.md §7 §8.2 §8.3
//
// 历史 (1a-1c-α-a-b 阶段沿革):
//   1a.2: SCENARIO_214 切片 → src/data/scenarios/214.js (factions/diplo/cities/emperor + generals)
//   1b-1: 此文件改 empty container (const FAC = {}; ...), initGame 内 materializeScenario + syncObject sync
//   1b-2: 加 src/core/scenario_accessors.js (additive API)
//   1c-a/b/c/d: src/ 全 module 直接 const 读 → accessor migrate (413 sites)
//   1d-α: _serializeG / _deserializeG verbatim 抽离 → src/core/persist.js
//   1d-a: WILD_GENS 集合操作 7 site migrate + 2 new accessor
//   1d-b: persist.js + getGenMeta 9 site migrate + 1 new accessor
//   1d-c: 6 顶层 const 删, backing 切 _scenarioMaterialized + G runtime state
//
// 此文件现在只剩历史 doc, 不导出任何 symbol. 仍由 v181.html L811 装载 (load order 占位, 待 phase 4 移除).
//
// 原 v181 字面值 (现已通过 SCENARIO_214 + materializeScenario 派生):
//   - FAC: 4 主势力 (wei/shu/wu/nanman) — name/full/ruler/color/cls
//   - ALL_FACS: Object.keys(FAC).filter(f=>f!=='rebel') 派生
//   - PLAYABLE_FACS: ['wei','shu','wu','nanman']
//   - FAC_IDENTITY: 4 势力 type/_baseType/traits/stage/anchorState (runtime mutable, 现 G.facIdentity)
//   - ETHOS_INIT: 4 势力 ethos 5 维
//   - DIPLO_INIT: 6 双向 entry (一向, materialize 时复制为 'b-a')

'use strict';
