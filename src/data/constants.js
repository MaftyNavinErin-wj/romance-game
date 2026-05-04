// src/data/constants.js
//
// 跨文件多处硬编魔术数字集中化(Session 1.5 / 阶段 1)
//
// 严格判定:本文件只收录"跨多个引用点的数字字面量"(典型 magic number),
// 单点使用的函数内 tuning 系数留原位(它们不是真正的"分散硬编",抽出来
// 只是改名,不构成 CLAUDE.md L83 所说的"修复 = 抽离副产物")。
//
// 本 session 自然 close 的 D 类:
//   - D-141: G._eventCatCooldown[X] = 3 硬编 4 处 → EVENT_CAT_COOLDOWN
//   - D-144: G.reputation[X] 默认 50 硬编 23 处(v181 内 16 + events.js 内 7)
//            → REPUTATION_DEFAULT
//
// 本 session 不 close 的(已审视,不符合"抽离副产物"标准):
//   - D-123 ethos 漂移系数:processFacEthos 内多处 0.5 / 0.3 / 0.4 / 0.6 / 0.15
//     等系数,但全都**单点使用**,抽出来只是 literal→named const,不形成跨
//     文件中心化。留 sprint 由机制层重构(phase 3 chains/ethos.js)处理。
//   - D-007 / D-080 / D-085 / D-089 / D-138:都是 bug fix / 设计变更类,不是
//     magic number 抽离,严格不在 1.5 范围。

// ── 事件系统冷却 ──
// 每个事件 category 触发后冷却 N 旬不再触发同 category 事件
const EVENT_CAT_COOLDOWN = 3;

// ── 信誉度系统默认 ──
// 当 G.reputation[fid] 未初始化时的 fallback 值(也是"中立信誉"基线)
// 注:开局初始值 wei=45 / shu=80 / wu=60 / nanman=30,此 50 仅在 fid 不在
//    G.reputation 时(如 rebel)或测试代码中使用
const REPUTATION_DEFAULT = 50;
