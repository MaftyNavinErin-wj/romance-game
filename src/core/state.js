// src/core/state.js
//
// 顶层游戏状态根 G — Project Romance 全局可变状态对象。
//
// 来源:从 project_romance_v181.html L3489-L3519 整体抽离(Session 3.1 / 阶段 3)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
// 范围:PLAN §二阶段 3.1 选项 A — 只抽 `let G = {...}` 本体 + 直接初始化字段
//        (initGame() 留 v181,后续 sub-session 处理)。
//
// 接口风格:`let G = {...}` 顶层声明。classic <script src=...> 同 realm 共享
// script-scope lexical environment,跨脚本 let 可见性与 hoisted function 一致。
// 所有 v181 + 已抽 src/data/ + src/render/ 文件中的 `G` 引用通过 script-scope
// 解析,无需修改。
//
// **重要验证锚点**:
//   phase 3.1 这一次抽 G 的 smoke PASS,是项目内"跨 classic <script> 顶层 `let` 共享"
//   的**真正先例**。phase 2 抽出文件中用过的 `let _leftPanelCache` 等是被读状态,
//   量级与"被全代码读写的状态根 G"不可类比。日后任何关于"跨 script let 共享是否
//   可靠"的争议,以本 commit(p3.1 抽 state.js)的 smoke layer-1+layer-2 PASS
//   作为权威依据。
//
// 加载顺序:本文件**必须是 src/* 中第一个加载**的脚本(在所有 data/ render/ helpers
// 之前),理由:G 是状态根,放最前防御未来某个 data 文件顶层 IIFE 误读 G 的情况,
// 且符合"基础先出现"的阅读直觉。
//
// 不抽的相邻 top-level state(留 v181):
//   - `let _unitIdCounter=1;` (L3522) — G 之外的兄弟 top-level let,选项 A 严格
//     只抽 G 对象本体,_unitIdCounter 等留 v181 由后续 sub-session 处理
//   - initGame() — 选项 A 明确不动,留 v181

let G={
  turn:1,year:0,seasonIdx:0,
  playerFac:'wei',           // ★ 玩家控制的势力（开局选择）
  selCity:null,selFac:'wei',activeTab:'city',autoDuelMode:'none', // 'none'|'best'
  resupplyOn:true,
  // troopMode 已移除（v45）：城防军饷固定，野战部队按自身status计费
  supplyLines:{},        // v0.5: 玩家建立的长期补给线
  foodAlertCards:[],     // v0.5: 右下角告急卡片
  // v1.0: 战斗系统
  attackSource:null,     // 出兵来源城市ID
  attackTroops:0,        // 出兵数量（玩家指定）
  attackGenIdx:-1,       // 选择的将领索引（-1=无）
  cityWalls:{},          // legacy, unused
  factions:{},cities:{},generals:{},diplo:{},
  transfers:[],logs:[],
  units:[],selUnitId:null,
  genChronicle:{},   // {genName: [{turn, year, season, text}]}
  genLoyalty:{},     // {genName: number} 运行时忠诚度，初始从GEN_META读取
  loyaltyAccum:{},   // {genName: float} 忠诚度浮点累积器
  recruitableGens:{}, // {genName: {fid, since}} 可挖角武将池（忠诚<35）
  wildPool:[],       // 在野武将池（最多5人，每5旬刷新）
  wildPoolTurn:0,    // 上次刷新旬数
  wildRecruitCD:{},  // {genName: cdUntilTurn} 招募失败冷却
  reputation:{wei:45,shu:80,wu:60,nanman:30}, // C3 信誉度（0-100），影响外交效果
  genJoinTurn:{},    // B1 {genName: turn} 加入势力的旬数（开局创始=0）
  genJoinSource:{},  // B1 {genName: 'founding'|'capture'|'recruit'}
  genOrigRole:{},    // B1★v71 {genName: 'ruler'|'general'|...} 原势力中的role（捕捉旧阀遗族）
  genOrigFac:{},     // B1★v71 {genName: fid} 原属势力（捕捉旧阀遗族）
  genFactionMod:{},  // B1 {genName: number} 派系系统忠诚累积修正[-20,+20]
  courtDecrees:[],   // I3 朝议buff [{fid, buffKey, effectVal, name, proposer, expiresAt}]
};
