// faction_base.js
//
// 势力主表(cross-scenario fix,显示 immutable 字段)
// 字段:name/full/color/cls
// 不进 FACTION_BASE 的字段:ruler/type/stage/ethos/res/...(留 SCENARIO_xxx.factions[fid])
// 跨 scenario 共享 entry(214 / 190 都用同样 wei/shu/wu/nanman/...);ruler 等 scenario-specific
//
// 来源:阶段 1a.1 由 tools/extract_scenario_214.js 自动抽取自 project_romance_v181.html。
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 2-a (phase 2) 阶段扩 +14 entry 给 190 剧本 (诸侯讨董前夕 14 势力).
//   190 entry cls 不依赖 .fac-XXX CSS class — 渲染层用 getFactionDef(fid).color inline,
//   见 scout: src/render/* 全用 .color 不用 .cls hook (cls 留作 future 渲染 hook).
// 字段说明见 docs/scenario_system.md §3。

const FACTION_BASE = {
  // ── 214 势力 ──
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
    "chronicleName": "南蛮",
    "color": "#8b6914",
    "cls": "nanman"
  },
  // ── 190 势力 (2-a 加, 诸侯讨董前夕) ──
  "dongzhuo":   { "name":"董",   "full":"董卓",       "color":"#5a2a3a", "cls":"dongzhuo" },
  "yuanshao":   { "name":"袁",   "full":"袁绍",       "color":"#3a5a8a", "cls":"yuanshao" },
  "caocao":     { "name":"曹",   "full":"曹操",       "color":"#1a4a7a", "cls":"caocao" },
  "sunjian":    { "name":"孙",   "full":"孙坚",       "color":"#8a1a1a", "cls":"sunjian" },
  "gongsunzan": { "name":"公孙", "full":"公孙瓒",     "color":"#cccccc", "cls":"gongsunzan" },
  "liubei":     { "name":"刘",   "full":"刘备",       "color":"#1a6a3a", "cls":"liubei" },
  "yuanshu":    { "name":"袁术", "full":"袁术",       "color":"#5a4a3a", "cls":"yuanshu" },
  "matenghan":  { "name":"凉",   "full":"马腾韩遂",   "color":"#7a4a1a", "cls":"matenghan" },
  "liubiao":    { "name":"刘表", "full":"刘表",       "color":"#3a7a4a", "cls":"liubiao" },
  "liuyan":     { "name":"刘焉", "full":"刘焉",       "color":"#5a3a5a", "cls":"liuyan" },
  "liuyu":      { "name":"刘虞", "full":"刘虞",       "color":"#3a3a8a", "cls":"liuyu" },
  "taoqian":    { "name":"陶",   "full":"陶谦",       "color":"#5a5a3a", "cls":"taoqian" },
  "hanfu":      { "name":"韩",   "full":"韩馥",       "color":"#3a4a4a", "cls":"hanfu" },
  "kongrong":   { "name":"孔",   "full":"孔融",       "color":"#4a3a3a", "cls":"kongrong" },
};
