// faction_base.js
//
// 势力主表(cross-scenario fix,显示 immutable 字段)
// 字段:name/full/color/cls
// 不进 FACTION_BASE 的字段:ruler/type/stage/ethos/res/...(留 SCENARIO_xxx.factions[fid])
// 跨 scenario 共享 entry(214 / 190 都用同样 wei/shu/wu/nanman/...);ruler 等 scenario-specific
//
// 来源:阶段 1a.1 由 tools/extract_scenario_214.js 自动抽取自 project_romance_v181.html。
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3。

const FACTION_BASE = {
  "wei": {
    "name": "魏",
    "full": "曹魏",
    "color": "#1a5f8a",
    "cls": "wei"
  },
  "shu": {
    "name": "蜀",
    "full": "蜀汉",
    "color": "#1a7a3a",
    "cls": "shu"
  },
  "wu": {
    "name": "吴",
    "full": "孙吴",
    "color": "#a82a1a",
    "cls": "wu"
  },
  "nanman": {
    "name": "蛮",
    "full": "南蛮",
    "color": "#8b6914",
    "cls": "nanman"
  }
};
