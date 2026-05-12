// 190.js
//
// SCENARIO_190 — 诸侯讨董(190 年初平元年)初始 state 切片
//
// 状态: phase 2-a stub — 元信息字段定型, factions/diplo/cities/generals 待后续 phase 实装:
//   - phase 2-b: factions (14 势力 ruler/stage/traits/ethos/res/reputation) + diplo (双向外交)
//   - phase 3:   cities (190 城市归属, ~55 城分配)
//   - phase 4:   generals (190 武将归属 + 关系图, 数据量大头)
//
// 字段 schema 同 SCENARIO_214 (见 214.js header + docs/scenario_system.md §3.4).
// 设计参考: docs/scenario_system.md §4 (190 配置清单).
//
// Day-1 注意: 本文件 load 时 stub 内容**不会被 initGame 调用** —
// scenario_loader.js applyScenario('214') 是 default, 默认 214 行为不变.

const SCENARIO_190 = {
  "id": "190",
  "version": "0.1",
  "name": "诸侯讨董",
  "startYear": 190,
  "description": "东汉初平元年,董卓废少帝立献帝,关东诸侯起兵讨董,群雄并起。",
  "provenance": "phase 2-a stub",
  "emperor": null,
  "factions": {},
  "diplo": [],
  "cities": {},
  "generals": {},
  "initialUnits": []
};
