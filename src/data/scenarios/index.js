// src/data/scenarios/index.js
//
// SCENARIOS register — 集中注册所有 scenario constants.
//
// 各 scenario 文件 (scenarios/<id>.js) 定义 const SCENARIO_<id>;
// 本文件在所有 scenario 文件 load 后 build SCENARIOS object, 供 scenario_loader.js
// 通用化 lookup (替代 phase 1a 硬编码的 typeof SCENARIO_214 check).
//
// 加载顺序 (project_romance_v181.html):
//   src/data/scenarios/214.js   (SCENARIO_214 定义)
//   src/data/scenarios/190.js   (SCENARIO_190 定义, 2-a stub)
//   src/data/scenarios/index.js (本文件 — 注册 SCENARIOS)
//   src/core/scenario_loader.js (用 SCENARIOS[id] lookup)

'use strict';

const SCENARIOS = {};
if (typeof SCENARIO_214 !== 'undefined') SCENARIOS['214'] = SCENARIO_214;
if (typeof SCENARIO_190 !== 'undefined') SCENARIOS['190'] = SCENARIO_190;
