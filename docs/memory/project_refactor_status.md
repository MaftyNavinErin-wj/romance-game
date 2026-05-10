---
name: Refactor phase status — Phase 4 + 桶 2 + 桶 6 + F/G/J/H/I/K + B sprint 7 链全 sweep + Layer-3 模板
description: Phase 3 + dc + HIGH sprint + _exec sprint + phase 4 全 10 sub-session + 桶 2 + 桶 6 + F render-cache + G map-interaction + J map-zoom + H utilities + IK streamline (billet+audit) 收尾. v181 39547 → 1799 (-95.5%). 43 src/ js + 1 css. **重构主体彻底收官**. **B sprint 7 链全 sweep 完: 批 1-8 共 22 D 类 close (经济+武将+政治+价值观+事件+外交+军事). D-068/D-137/军事 D-017/036/037/038/040 等 6 项 escalate audit pass 2. Layer-3 sprint_verify.js 模板上线 (24 verifies)**.
type: project
originSessionId: 512dcd0b-fb4e-439d-a8fe-64996a4fc5c8
---
**截至 2026-05-10 的状态(每次 session 启动前请用 git log 校验,不抄)**:**重构 + 数据补完整体收官 + D 类 HIGH sprint 收官 + _exec 架构债 sprint 收官 + phase 4 + 桶 2/6 + F/G/J/H/I/K/M 全收尾 + B sprint 批 1 (D-006) + 批 2 (7 D 类 streamline) 完成**。

**B sprint 进度** (启动 2026-05-10, 7 链全 sweep 完: 经济+武将+政治+价值观+事件+外交+军事):

- **批 8 军事链 streamline 4 fix** (commits 02d7066/93516ed/01259e4 已 push origin/main):
  - D-015 LOW _execDisband 清亲卫 (玩家/AI 对称, AI 裁军不留 ghost retainers, 跟玩家 disbandUnit L7448 对齐)
  - D-018 MED _execCancelSpecial: camp → 1 旬 campMobilizeTurns 整备 (玩家不能即扎即发, AI 同等约束) + ambush 在城内变 garrison
  - D-018 follow-up (codex trial 3 catch): _execMove + _execSetCamp + _execSetAmbush 全加 campMobilizeTurns + camp/ambush status guard
  - D-019 MED _execCancelSiege: 清 siegeTarget + _siegeTurnCount (跟玩家 cancelSiege L7273 对齐)
  - D-041 LOW 乐进 xiandeng 攻城士气 cap 对称 (v179fix P8 模式: 记 actual added, restore 减实际值, 不再硬编码 -18)
  - **codex review 4 trials**: trial 1 P2 (D-023 trackCityLoss 设计就忽略 rebel 撤回) → trial 2 P1 (sprint_verify conflict marker amend) → trial 3 P2 (_execMove campMobilizeTurns 漏 amend) → **trial 4 LGTM ✅**
  - **D-023~D-030 group default close** (audit pass 2 重新核 ID-to-钩子精确映射):
    - D-023~D-025 大乱: trackCityLoss 设计就忽略 rebel (D-119 verified-with-notes 同模式), 大乱钩子套件其他 14 项已含
    - D-027~D-030 开城: batch-3/17/19 多次完整修, 对比攻城胜利样板 15+ 钩子无明显漏
  - **D-022 已被批 1 D-006 附带 close** (calcRecruitCost helper 含 _postBuffs, 玩家 modal 6 处 + AI 4 处)
  - **D-032/D-033 verified-with-notes** (防御性问题非功能 bug)
  - **D-017/D-036/D-037/D-038/D-040 escalate audit pass 2** (concept_map 无 fix 方向线索)
  - **军事链 sprint scope 全收尾 ✅**: 6 HIGH (HIGH sprint close) + 4 fix (D-015/018/019/041) + 7 group default close + 2 verified-with-notes + 5 defer audit pass 2 + 2 dismissed (D-034/039) = 23

- **Layer-3 sprint_verify.js 模板上线** (commit 0f93c1b, push origin/main):
  - 24 verifies 全 PASS (15 外交链 + 1 军事链 D-019 + 3 D-018 + 1 D-015 + 1 D-041 + 价值观/事件/政治/武将累计)
  - tests/sprint_verify.js: 启 jsdom + initGame + 控制初始 state + assert deltas, 取代 user F12 console paste
  - 跟 smoke.js (Layer-1+2 byte-identical 守底) 互补; 后续每 batch 加 entry, node tests/sprint_verify.js B-DXXX 自动测
  - 模板教训: expose 顶层 const/let / _actedThisTurn marker reset / 静态 grep 模式 / mock Math.random 测失败分支
  - reference_layer3_verify.md 入 memory (后续 sprint 复用)

- **批 6 事件链 streamline 4 LOW** (commits f25939a/e29a55b/7668bfe/069da78 已 push origin/main):
  - D-132 LOW tick.js 全局 _fastForward _pendingEvent 路径补 log (跟 rollEventsV2 内 fastForward / AI 静默 / 玩家弹窗三路径一致)
  - D-134 LOW rollEventsV2 facs 过滤 _eliminated (跟 D-129 同模式, 跟 tick.js:184/693/703 _eliminated guard 一致)
  - D-143 LOW events.js quanjin_biao + return_emperor 4 处 log '主公' → FAC[fid]?.name 势力名 + return_emperor ① showNotif 加 fid===G.playerFac gate (event playerOnly:false, AI 触发不弹给玩家)
  - D-145 LOW events.js gen_referral 婉拒 G._eventCooldown['gen_referral_'+wName]=6 死冷却 key 删 (key 跟 def.id 不匹配, 写后永不读, grep 全 src/ 0 read site) + desc '6旬不再来投' 假承诺 desc 改为只描述真实效果
  - codex 集中 trial 1 LGTM (零 finding 零 concern)
  - 实机测真实情况: D-129/D-132/D-134 _eliminated/快进 latch 触发苛刻 smoke 50 旬 5 势力没死 byte-identical 是空 verification, D-143 触发条件苛刻 (oneTime + mandate gate), D-145 gen_referral 普通玩游戏可遇但 desc 改字看一眼即 verify, **不实机测 push**, 后续玩游戏自然遇到时 latent verify
  - **诚实教训**: 之前对"smoke vs main byte-identical = 守底"过度自信, 实际 byte-identical 仅排除回归不证 fix 生效。latch 类 fix (_eliminated guard) smoke 不触发情况下 byte-identical 是空 verification, code review + pattern 一致性是主要 verify 手段
  - **D-137 MEDIUM 设计决策升级**: _popEventQueue 0 caller 死代码, 修法时机 3 选 (A 弹窗即 pop / B 下旬开头 pop / C popup chain), 原代码 line 471-472 注释 '不立即弹出，让玩家喘口气，下旬处理' 暗示 B/C, 但 fix 方向是设计决策超出 '自动化往前推' scope, **escalate user approve, 留下次 batch 实装**
  - **事件链 sprint scope 余下**: D-130/D-138/D-144 defer 架构债 / D-135/D-136/D-139/D-140/D-141 verified-with-notes / D-142 verified — 加 D-137 待 approve 决策

- **批 5 价值观链 streamline 1 LOW** (commit 2a24c79 已 push origin/main):
  - D-129 LOW processFacEthos 灭国势力跳过守卫 (ethos.js:107 加 || G.factions[fid]?._eliminated, 跟 tick.js:184 _eliminated guard 同模式)
  - codex trial 1 LGTM (零 finding 零 concern, 'matching existing elimination semantics ... without breaking active faction processing')
  - 不实机测 (单点机制守卫, 跟 batch-14 D-051 / batch-23 D-065 / 批 3 D-090 同模式)
  - **价值观链 sprint scope 全收尾 ✅**: 1 HIGH (D-121 batch-25 close) + 1 MED 跨链 (D-122 留外交链 sprint) + 1 LOW (D-129 本批 close) + 余 D-123 defer / D-124/126/127 verified-with-notes / D-125/128 no-fix

- **批 3+4 政治链 streamline 2 LOW** (commits 9a0e0d2 + 2557b62 已 push origin/main):
  - D-090 LOW setStrategist 同人重复任命守卫 (general.js:1745, 加 prev===genName guard 避免 -2/+5 net +3 忠诚 exploit)
  - D-088 LOW 朝议 selectCount UX 修正 (diplo_modals.js L43/L67 玩家路径 + politics.js _aiCourtSelect AI 路径对称化):
    - N=2 提案改 selectCount=1 (玩家选 1 of 2 + AI top-1, 不再强求 2/2 无意义点选)
    - N=3+ 不变 (玩家选 2 + AI top-2)
    - N=1 autoPass 不变
    - codex trial 1 P2 catch _aiCourtSelect 漏改 → trial 2 LGTM (玩家/AI 对称化)
  - 实机测: D-088 用 F12 console showCourtCouncil 注入 mock 提案 (开局所有势力满官 N=4, N=2 路径自然不触发, console 是唯一可行测法), Test A/B/C 全 PASS
  - D-090 不实机测 (玩家 UI 按钮 toggle 自然防, smoke vs main byte-identical 守底, 跟 batch-14 D-051 / batch-23 D-065 同模式)
  - **D-087 stale 教训重演**: walkthrough 标 D-087 MEDIUM fix, scout 时按字面看, 但 batch-14 commit message 显式标 "同源 D-051 close D-087", D-087 已收尾。mini scout 阶段查 git log 找 D-051 发现 batch-14 b289739 close D-087, 避免重复 commit (跟 D-045 stale 同模式)
  - **政治链 sprint scope 全收尾 ✅** (3 HIGH + D-087 MED + D-088/D-090 LOW 全 close, 余 D-079/D-081/D-082/D-086 no-fix + D-078/D-080/D-085/D-089 defer 架构债 + D-083 verified-with-notes)

**B sprint 启动期 progress (经济 + 武将 sprint scope 基本扫完, 历史)**:
- **批 1 D-006 MED 经济链** (commit f0e1218, sprint/B-D006-recruit-helper):
  - calcRecruitCost helper 抽到 military.js MIL1.c, 含 6 修正 (豪族/兵营/仪兵/科技/特色兵种/官职 _postBuffs)
  - 10 处 call site 全统一 (recruit_modals.js 6 处 玩家征兵+整备+扩编+增编 + military.js 4 处 AI 主征兵+加分队+扩编+Claude AI _execRecruit)
  - mode 8 多入口一致性 fix, 跟 batch-23 _calcPoachRate / batch-24 calcLoyaltyDelta 同模式
  - 行为变化: AI 任命 大将军/前将军 _postBuffs.recruitCost (-8%/-6%) 此前漏应用本 fix 激活, 玩家整备/扩编/增编 4 modal 也补 _postBuffs (内部不一致清理)
  - smoke vs main: 50+ cascading (3 AI 势力 res.gold 偏高 + 武将 loyalty 下游传播 + 13 eventCooldown pre-existing batch-18 staleness)
  - codex trial 1 LGTM (零 finding 3 非阻塞 concern)
  - 经济链 sprint scope 全收尾 (14 D 类只 D-006 是 fix verdict, 其他 dismissed/defer/verified 不动)
- **批 2 streamline 7 D 类 (commits 871de09 → eb66c02, sprint/B-D070-statexp-while → sprint/B-D072-orig-fields)**:
  - D-070 LOW addStatExp if→while + cap 守卫 (general.js, 1 函数 5 行)
  - D-046 LOW EVENT_LABELS.execute '处决武将'→'武将身死' (general.js, 1 行 label, killGen 4 路径中性叙事)
  - D-066 MED _aiDoPoach genJoinSource 'capture'→'poach' 对齐玩家 poachGen (general.js:1164, 区别 surrenderGen 真投降 'capture')
  - D-067 LOW 下野 wildPool push cap 5 硬编码 → WILD_POOL_SIZE const (general.js:1482)
  - D-054 LOW 下野时池满 shift() 顶替最旧, 消除 5 旬窗口期 (general.js:1482-1486, walkthrough 主张方案 a)
  - D-057+058+059.1 MED+部分 3 路径补 genFactionMod/Log cleanup 二件套 (下野/killGen/surrenderGen)
  - D-072 MED 4 路径补 genOrigFac/genOrigRole latch (野招/AI挖角/玩家挖角/推荐, general.js + events.js)
  - codex trial 1 NEEDS-WORK catch D-045 dup → drop D-045 commit → 余 7 batch LGTM
- **D-045 stale 教训** (codex catch):
  - d-list 标 D-045 待修, 但 batch-19 (commit f6f3b9e, 2026-05-07) 同步 close (gentry.js:637 已有 triggerFactionEvent('conquer', siegingFac) 注释 'D-045/D-131 fix')
  - CC 按 d-list 字面 scout 漏看 batch-19 close 事实 → 加 line 626 dup 触发, 鹰派双计 +6
  - codex catch P1 → CC drop commit + 删误命名分支
  - **新原则候选**: sprint batch 启动 mini scout 时, d-list verdict 须跟 memory `project_refactor_status.md` 交叉核 batch 已 close 列表 (尤其 batch-19/20 architectural / 跨链 close), 不能字面照 scout

**武将链 sprint scope 状态** (除 1 design 待 user, 其他全收尾 ✅):
- 已修 LOW: D-046 / D-054 / D-067 / D-070 ✅
- 已修 MED: D-066 / D-072 ✅
- 已修 partial: D-058 / D-059 ✅
- 已修 fix verdict: D-057 ✅
- D-045: batch-19 已 close ✅ (stale d-list 教训)
- D-068 MED wildPool 3 cap 不一致: **设计问题** (5/8/无限统一?待 user approve)
- 不修: D-047 / D-050 / D-060 / D-062 / D-069 / D-073

**HIGH 进度** (修 27 / 总 27 ✅ 全收尾):
- 政治链 3 HIGH: **全收尾 ✅** (D-076 / D-077 / D-084)
- 外交链 5 HIGH: **全收尾 ✅** (D-091/D-104/D-113/D-117c/D-120)
- 武将链 10 HIGH: **全收尾 ✅** (+batch-24 D-052 calcLoyaltyDelta 4 项缺漏统一)
- 军事链 6 HIGH: **全收尾 ✅** (D-016/D-020/D-021/D-026/D-031/D-035, batch-22 D-020 deletion 收尾)
- 价值观链 1 HIGH: **全收尾 ✅** (batch-25 D-121 Claude AI ethos 三层暴露)
- 事件链 2 HIGH: **全收尾 ✅** (batch-19 D-131 + batch-20 D-133 删除)

**batch-19 架构 robust 选项 D 重大落地 (2026-05-07)**:
- 19.1 verbatim 抽 _execDeclareWar + _execProposeAlliance 从 v181 到 src/chains/diplomacy.js (前置抽离消除 v181 可读不可写约束)
- 19.2 11 caller 补 triggerFactionEvent (warDeclare 5 / truce 3 双向 / betray 1 / conquer 1)
- 19.3 tests/checkers/faction_event_invariant.js — audit §20451 自动化 checker 落地, curated whitelist + bidirectional 支持
- 同步 close D-049 + D-131 + D-045 (跨链)
- codex review LGTM (7 关注点 verify, 提 3 非阻塞增强建议留 followup)

**batch-20 closes via deletion 模式 (2026-05-07, 跟 D-099 cancel_supply 同模式)**:
- D-053 删 applyLoyaltyEvent city_lost/siege_broken 分支 (设计意图: 丢城忠诚通过 processLoyalty 势力衰退维度间接体现)
- D-133 删 gen_referral ② 考察再议 + hubs.js B4_delayed 处理 (B4_delayed 从 v130 起完全失效, 死代码多年)
- 玩家弹窗简化: gen_referral 3 项 → 2 项 (① 立即接纳 / ② 婉拒, 原 ② 考察再议删除原 ③ 婉拒 renumber 为 ②)
- codex trial 1 NEEDS-WORK (③→② renumber UX bug) → trial 2 LGTM (renumber fixed + dead-code token in comments DEFER 接受)
- B4_delayed 实装值得做但放 sprint 之后的 small feature 阶段, 不在 sprint 加 feature

**batch-21 freeze+3 旬路线 (2026-05-07, 设计反转 case)**:
- claude.ai 原方向 = 12 旬 (弱合法性宣称档对齐) → 制作人 insight: 大乱前 morale<20 + 触发已 9 项 reboot 代价, 应 freeze 不叠惩罚 → claude.ai approve freeze + 3 旬
- 10 处改动 (4 文件): rebel 期间 freeze 8 字段 (民心/人口/产出/建筑/豪族/调粮/疫病) + 攻陷 oldFac==='rebel' 特例 occupied=3 + 科技 occupiedMult 仍生效
- exploit 实测不存在: _warStr fallback 'none' = 27 旬已堵, audit pass 1 漏看 → batch-21 改"暂停状态"哲学 + 3 旬轻消化
- codex 4 trials catch latent bugs: trial 1 (1 误报+1 真 plague) / trial 2 (occupied decay + checkResupply guard) / trial 3 (processTransfers 老存档 fallback) / trial 4 LGTM
- **lifecycle simulate 模式首次落地**: tests/batch21_simulate.js 跑 80 旬 (force 大乱 → 9 字段 freeze verify → 真实 AI 攻陷 occupied=3 verify → 44 城无 regression). 比 smoke layer-2 更彻底, 复杂 lifecycle batch 模板, 后续 batch-22-25 可复用
- **设计反转 protocol case**: 制作人 insight 优先级 > claude.ai 决策, scope 可能戏剧扩大 (1 行数值 → 10 处 mini-mechanism)

**batch-22 closes via deletion 模式 (2026-05-07, 跟 batch-20 同模式)**:
- D-020 HIGH _execBillet 功能错位 (玩家路径真 billet, Claude AI 路径 30% 裁军+garrison 语义错位). 修方向 (a) "修成真 billet" 是 sprint 之外功能改造 → 走 deletion (Claude AI 不再尝试)
- D-099 LOW cancel_supply 部分 _execCancelSupply dead 占位 (console.warn+return false). batch-2 已删 prompt, 本 batch 删 dispatcher → checker 1 case_no_prompt HIGH 1→0
- 7 处 deletion (净 -34 行死/错代码): v181.html 2 函数 + claude_ai.js 5 处 (prompt+ORDER×2+dispatch×2)
- codex trial 1 LGTM (无残留 except docs/history)
- smoke fix vs main byte-identical (除时间戳)
- **新发现 audit pass 2 candidate**: day-1 武将部曲 type vs 初始 squad type 不一致 (关羽 squad='light' vs 部曲 constants='heavy'). 留 sprint_followup §3.2.1, audit pass 2 时对所有 day-1 有部曲武将做 check
- **军事链 6 HIGH 全收尾** ✅ (D-016/D-020/D-021/D-026/D-031/D-035 全 close)

**batch-23 trial helper 模式 (2026-05-07, helper 抽离首次落地)**:
- D-065 HIGH 武将链: 玩家 poachGen vs AI _aiDoPoach 公式 5 项 buff 严重不对称 (玩家 3 buff 独有: _techPoach/陈群/黄权-0.20; AI 2 buff 独有: 投机+0.20/cunning+0.05)
- 抽 _calcPoachRate(genName, byFid) 共享 helper, 含全 5 项 buff. 3 路径覆盖: 玩家 poachGen / 传统 AI _aiDoPoach 直接调; Claude AI _execPoach 自动透传 (内部调 _aiDoPoach)
- 制作人决策 clamp 选 (c) 统一 [0.20, 0.85] (投机/cunning 突破 85% 的特权取消, 简洁规则不区分 buff 来源)
- buff 双向对称化效果: 黄权 -0.20 / 陈群 +0.05 / _techPoach AI 也享受; 投机 +0.20 / cunning +0.05 玩家也享受
- 改动 1 文件 +33/-28: general.js 加 helper + 2 路径改用 helper. codex trial 1 LGTM. smoke byte-identical (50 旬 AI 未触发挖角, 公式变化未影响 baseline)
- 实机测 PASS (console 4 项 verify: 基础 0.85 / 黄权 0.59 / 吕布 clamp 顶满 / 全部 ≤ 0.85)
- **trial helper 模式确立**: 单文件 / (target, by) 双参数 / 返回值. batch-24 D-052 _calcLoyaltyDelta 可复用此模式
- 观察 (audit pass 2 candidate, 未记 followup): 普通武将基础 rate 已接近 85% 上限 (基础 0.45 + ruler cha + loyalty fallback + region/clan/gentry 凑齐) → 挖角整体偏易, 设计平衡问题留 sprint MEDIUM 阶段

**batch-24 trial helper 模式复用 (2026-05-07, 武将链最后 1 HIGH close)**:
- D-052 HIGH 武将链: UI calcLoyaltyDelta vs 主 tick processLoyalty 公式 v93 "完全一致"承诺被打破, 双向 4 项缺漏:
  - UI 有/主 tick 缺: ⑥b proud 无官 -0.15 + ⑨ 价值观 ethDelta (politics/combat 6 case)
  - UI 缺/主 tick 有: _techLoyalty (loyaltyRecovery 科技) + _liufengDrain (刘封刚愎 -0.10)
- 影响: ① ② → 玩家以为 buff 生效实际主 tick 没用 (UI 误导); ③ ④ → 玩家看 tooltip 看不到但忠诚实际在变化 (UI 骗了玩家)
- 修法: A) calcLoyaltyDelta 加 _techLoyalty + _liufengDrain (UI 缺补); B) processLoyalty 改用 calcLoyaltyDelta (删 80 行 inline 公式, 主 tick 自动获得 proud 无官 + ethDelta)
- calcLoyaltyDelta 名字保留向后兼容 (v181.html 5 处 + tooltips.js:578), 11 项 → 13 项
- 改动 1 文件 +15/-89 net -74. codex trial 1 LGTM
- smoke 4847 cascading (510 pre-existing stale + 4337 batch-24 引入: 1340 loyalty / 283 factionMod / 468 units / 293 cities / 156 factions / 1797 other). 跟 batch-19 ~13K 同量级, 算法回路类 acceptable
- 实机测 PASS: 6 武将 console verify + 4 真实投机武将 (孟达/张绣/糜芳/张松, 投机-0.30 + 投机且无官-0.20 全正确) + UI tooltip breakdown 弹窗 verify
- 发现 phantom case: 吕布不在游戏数据 (GEN_META/WILD_GEN_META 都没他, 198 年已死游戏没建模) → meta={} → 投机 buff 不触发. 数据补完候选 (audit pass 2 / data-completion 2)
- **trial helper 模式 2 次复用确立**: 单文件 / (target, by) 双参数 / 返回 {items, total} 或 rate. batch-25 D-121 不走此模式 (信息暴露面)
- **武将链 10 HIGH 全收尾 ✅** (D-048/D-049/D-051/D-052/D-053/D-055/D-061/D-063/D-064/D-065 全 close)

**phase 4 sub-session 4.6 单 codex review (2026-05-08, 中风险首发)**:
- 4.6 diplo_modals: 朝议 (3 funcs) + 求和 + 屠城安民 + 附庸 modal 抽到 src/render/diplo_modals.js
- v181: 11927 → 11732 (-195)
- codex review LGTM (零 finding, "straightforward relocation... no load-order issues")
- streamline 模式切换: 4.1-4.5 集中 review → 4.6+ 单 sub-session review (中风险尾段)

**phase 4 sub-session 4.7 单 codex review (2026-05-08, 中风险)**:
- 4.7 recruit_modals: 征兵 + 整备 + 扩编 + 增编分队 4 modal cluster 抽到 src/render/recruit_modals.js
- 4 lets (_rm/_rdp/_ex/_as) + 37 funcs 一起搬
- v181: 11732 → 10507 (-1225, 单 sub-session 减肥最大头, 仅次于 4.5 boot_screens 1461)
- codex review LGTM (零 finding)

**桶 2 残余抽离 (2026-05-09, phase 4 收官后清理)**:
- 7 symbol 抽到 src/chains/general.js GEN17 section: 1 let GEN_MAP + 6 funcs (getSquadClass / getUnitClassBuffs / getClassDuelWeight / genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml)
- 2 非连续 block: v181 L904-L906 (3 行) + L915-L989 (75 行), 中间 L907-L914 已抽离 markers 留 v181 不动
- 归属决策 (制作人 2026-05-09 approve): 全 7 symbol → general.js 单 destination
  - GEN_MAP 是 let (initGame 重建), 不适合 data 层 "纯 const" 约定
  - 6 funcs 是 squad/class 武将机制 + HTML helper 混合, chain 层一并装最简
- v181: 4499 → 4423 (-76, 累计 -88.8%)
- src/chains/general.js: 2323 → 2428 (+105: 78 verbatim + 27 GEN17 section header)
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- Block A (3 行) + Block B (75 行) **byte-identical** verify (diff main vs general.js GEN17 section)
- codex trial 1 LGTM (零 finding, 36494 tokens, "Verified ... GEN_MAP as let, followed by all six expected helper functions ... load order ... no whitespace errors")
- 不实机测 (verbatim + smoke + byte-identical 三重 verify 充分; 制作人 push)
- **桶 2 彻底清空 ✅** (memory `project_refactor_status` "留底架构债 #3" close, 无残余)

**桶 6 _debug panel 抽离 (2026-05-09, dev cluster 首次抽到 src/dev/)**:
- v181 第二段 `<script>` L3104-L4399 (1296 行 IIFE, 52 内部 funcs) → src/dev/debug.js (1294 行 verbatim)
- v181 `<style id="_dbg_style">` L3032-L3102 (71 行 _dbg-* 选择器) → src/dev/debug.css (69 行 verbatim)
- v181 替换为 3 行 marker + `<link>` + `<script src>` 引用 (原位置不变, body 内 link 浏览器接受)
- IIFE 完全自包含: L3109 `if(!location.hash || !location.hash.includes('debug')) return;` 不带 #debug 即提前 return, 主代码零反向引用
- scout 三件验证 = 0 hits: 主 script L840-L3024 grep `_debug|_dbg` / src/ 全文 grep / tests/ 全文 grep
- 外部接口仅 `window._debug` 命名空间 (toast/safe/setRelation 等)
- v181: 4423 → 3052 (-1371, -31.0%, 累计 -92.3%) ⭐ 突破 -92% 大关
- src/ 新建目录 src/dev/ (memory 桶 6 §六预留位置首次落地)
- byte-identical verify: src/dev/debug.{css,js} 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (4 finding 全 LGTM, 1 non-blocking concern: HANDOVER_v181 + CODE_MAP_v181 历史文档仍提 _debug, followup 非阻塞)
- 实机测 PASS (制作人 2026-05-09): #debug URL 激活 panel + 不带 #debug 零角标
- **桶 6 第二段 _debug script 收尾 ✅** (memory "v181 剩余 6 桶分类" 桶 6 第二段 1296 行已清空, 桶 6 残余仅顶层杂项 + 第一段 _debug-related 已属主 script)

**桶 6 combat tables 抽离 (E sub-session, 2026-05-09, 顶层 const 抽离延续 dc.S1/S3)**:
- 主 inline script L1439-L1513 (75 行武将相性 cluster) → src/data/generals.js range C
  - APT_MULT (适性乘数) + COMPAT (65 武将相性表) + COMPAT_GROWTH_MULT (相性差距 → 亲密度增长) + INTIMACY_PRESET (史实初始亲密度 80+ 关系)
- 主 inline script L1523-L1575 (53 行兵种克制 + 地形修正 cluster) → src/data/constants.js range B
  - TYPE_ATK / TYPE_DEF (兵种攻防乘数, 含 11 特色兵种) + TROOP_BASE_MULT (兼容) + TYPE_MATCH_MULT (5×5 克制矩阵) + TERRAIN_TROOP_MULT (6 地形 × 5 兵种)
- 中间 L1514-L1522 (9 行 dead docstring + GEN13/GEN14 markers) 留 v181 (audit pass 2 candidate, phase 3 抽 funcs 时遗漏的 dead 残余, 不在本 sub-session 范围)
- v181 替换为 2 行 marker (净 -126)
- v181: 3052 → 2926 (-126, -4.1%, 累计 -92.6%)
- src/data/generals.js: 1123 → 1200 (+77), constants.js: 553 → 609 (+56)
- byte-identical verify: Block 1 / Block 2 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (零 finding 零 concern, 6 关注点全 PASS, 跨链消费者 chains/general/military + core/main + render/battle_modals 全 lexical lookup 无动态依赖)
- 不实机测 (跟 bucket-2 GEN_MAP 同模式: verbatim const + smoke + byte-identical 三重 verify 充分, 制作人 push)
- **E sub-session 收尾 ✅** (顶层杂项主菜 const block 已抽, 桶 6 残余仅 module-private state ~75 行 跟 funcs 紧耦合, 留 F/G sub-session 处理)

**render-cache 抽离 (F sub-session, 2026-05-09, phase 4 标准 verbatim 整段抽)**:
- v181 L1080-L1350 (271 行 verbatim) → src/render/render_cache.js (新建)
- 9 funcs: renderAll / renderAllLight (orchestrator) + toggleMapStyle + 6 cache funcs (_buildStaticMapCache / _getStaticMapCache / invalidateFogCache / _getFogSvgCache / invalidateCityCache / _getCitySvgCache)
- 9 lets: _staticMapCache / _mapShowGrid (静态地图) + _fogSvgCache / _fogCacheTurn / _fogCacheVersion (迷雾 v117fix 递增版本号) + _citySvgCache / _cityCacheTurn / _cityCacheSelCity / _cityCacheVersion (城市)
- 中间 L1095 R4.1 overlay marker + L1096-L1101 6 行 dead 空行 verbatim 抽 (phase 4 标准模式不切片)
- v181 替换为 1 行 marker + 加 <script src> 引用 (L840, 在 battle_anim.js 之后)
- v181: 2926 → 2657 (-269, -9.2%, 累计 -93.3%) ⭐ 突破 -93%
- src/render/render_cache.js: 0 → 271 (verbatim from v181 L1080-L1350)
- byte-identical verify: render_cache.js 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (1 LGTM finding 6 关注点 5 PASS + 1 minor concern: R4.1 marker 带走语义略误导但不影响行为)
- 实机测 PASS (制作人 2026-05-09): 4 视觉路径 (toggleMapStyle 网格开关 / 读档回标题清 cache / 选城 _cityCacheSelCity rebuild / 战后 fog invalidate) 全 OK
- F sub-session = 桶 6 主菜后续 phase 5 风格抽离, 主题独立 (SVG cache 层 + render orchestrator) 跟 map_render.js layer 不同所以新建文件
- **F sub-session 收尾 ✅** (renderAll + 3 SVG cache 层全归位 src/render/render_cache.js)

**map-interaction 抽离 (G sub-session, 2026-05-09, phase 4 标准 verbatim 整段抽)**:
- v181 L1469-L1794 (326 行 verbatim) → src/render/map_interaction.js (新建)
- 10 funcs:
  - Fog 可见性: _collectPlayerVisibleKeys / _animateFogReveal
  - 战斗触发: _checkInstantBattleTrigger
  - 移动预览: clearMovePreview
  - Unit 鼠标事件: onUnitLeftClick / onUnitRightClick / onMapRightClick
  - Map 事件: svgEventCoords / handleMapClick
  - City 选择: handleCityClick
- 中间 L1547 R4.3.d stack picker marker verbatim 抽 (phase 4 标准模式不切片)
- v181 替换为 1 行 marker + 加 <script src> 引用 (L841, 在 render_cache.js 之后)
- v181: 2657 → 2333 (-324, -12.2%, 累计 -94.1%) ⭐ 突破 -94%
- src/render/map_interaction.js: 0 → 326 (verbatim from v181 L1469-L1794)
- byte-identical verify: map_interaction.js 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (1 LGTM finding + 1 concern smoke 玩家交互盲区, 关注点 6 关注点 4 PASS, 跨链消费者 verified: CITY_MAP/fog/_pendingBattleConfirms/renderAll/updateTabs)
- 实机测 PASS (制作人 2026-05-09): 6 路径 全 OK (左键 unit 选中 / 右键 unit 阻止浏览器菜单 / 移动预览 / 右键空 hex 取消选中 / 左键城市 / 派兵攻城)
  - 注意: onUnitRightClick 实际无功能, 仅 preventDefault(); "取消选中"是 onMapRightClick 做的 (右键空地图)
- 新建文件, 主题独立 (map/unit 交互 controller 层), 跟 map_render.js (view 实现) 同主题但 layer 不同
- **G sub-session 收尾 ✅** (玩家鼠标交互 controller 全归位 src/render/map_interaction.js)

**map-zoom 抽离 (J sub-session, 2026-05-09, 双 block 加进 map_interaction.js)**:
- v181 L931-L935 (5 行 module-private state) → map_interaction.js range C: _mapScale/_mapTx/_mapTy/_MAP_SCALE_MIN/_MAP_SCALE_MAX/_mapDrag
- v181 L1595-L1710 (116 行 funcs cluster) → map_interaction.js range D:
  - 5 funcs: _clampMapTransform / resetMapView / _applyMapTransformOnly / _debouncedMapRender / zoomMap
  - DOMContentLoaded handler (滚轮缩放 + 左键拖拽 + 中键阻止默认 + 嵌套 _onDocMouseMove/_onDocMouseUp + window._mapDocMouseMove/Up 暴露给 backToTitle 清理)
  - 1 let _suppressNextClick (拖拽后抑制 click)
  - 1 let _zoomRenderTimer (debounce 渲染)
  - _onDocKeydown function (Esc/+/-/0 键盘事件)
  - document.addEventListener('keydown', _onDocKeydown) listener install
- v181 L932 (原 L936) `let _unitMenu = null;` 留 v181 — codex catch: **不是 dead code**, src/render/notifications.js:321 closeUnitMenu() 仍在消费. 留 v181 是正确做法 (我之前 commit message 误标 "audit pass 2 candidate" 为误判, 此处纠正)
- v181 替换为 2 行 marker (净 -119)
- v181: 2333 → 2214 (-119, -5.1%, 累计 -94.4%)
- src/render/map_interaction.js: 326 → 451 (+125: 121 verbatim + 4 header/blank)
- byte-identical verify: Block A / Block B 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (1 LGTM finding + 2 concern: _unitMenu 不是 dead code 纠正 / smoke 玩家交互盲区)
- 实机测 PASS (制作人 2026-05-09): 滚轮缩放 / 左键拖拽 / 中键 / 键盘 +/-/0 / backToTitle cleanup 全 OK
  - 制作人观察 Esc 取消选中似乎不触发 — 但他没用过这功能, smoke vs main PASS 证明跟 v181 行为一致, 即使原本不工作也是 pre-existing 不是本次抽离造成
- **J sub-session 收尾 ✅** (地图缩放/平移完整 cluster 含 lets+funcs+listeners 加进 map_interaction.js)
- **重要 lesson**: dead code 判定必须全 src/ grep 不能只搜 v181 (codex catch _unitMenu 在 notifications.js consumer)

**H utilities 抽离 (H sub-session, 2026-05-09, 加进 notifications.js)**:
- v181 L1092-L1128 (37 行 verbatim) → src/render/notifications.js append
- 3 funcs:
  - log(msg, type) — 写 G.logs + 渲染 #elog DOM 消息日志
  - updateFacStats() — 更新右侧势力统计面板
  - handleKeyDown(e) — 全局键盘 dispatcher (实际只处理 Enter/Space/Escape 关闭 modal, 不是 F2)
- v181 替换为 1 行 marker (净 -36)
- v181: 2214 → 2178 (-36, -1.6%, 累计 -94.5%)
- src/render/notifications.js: 399 → 438 (+39: 37 verbatim + 2 header/blank)
- byte-identical verify: 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (零 finding 零 concern, 跨链消费者全 verified, body onkeydown attribute 仍能 lookup handleKeyDown)
- 实机测 PASS (制作人 2026-05-09)
- 加进 notifications.js (主题 = 全局 UI helpers, log 主题完全契合)
- **H sub-session 收尾 ✅** (全局 UI utilities 全归位 src/render/notifications.js)

**streamline batch I+K 抽离 (2026-05-09, streamline 模式 4 次复用)**:
- I billet (commit 080f057): v181 L1443-L1521 (79 行 verbatim) → src/chains/military.js MIL10
  - billetUnit(uid) — 玩家驻扎入口, 弹城市选择 modal
  - _confirmBillet(uid, cityId) — 确认驻扎, 拆双条目 (部曲/辅兵 type), 武将归队
  - MIL10 section header (跟 MIL8.x 玩家入口 owner = military chain)
  - v181: 2178 → 2100 (-78)
- K audit (commit 18e9fbc): v181 L1843-L2145 (303 行 verbatim, I 抽前行号; I 抽后变 L1765-L2067) → src/dev/audit.js (新建)
  - runIntegrityAudit() — 压力测试后批量断言 (8 类: 资源/兵力/忠诚同步/城市fac/死将残留/部队结构/结构完整性/价值观)
  - checkElimination() — 势力淘汰 + 胜利/失败判定 (★ v119)
  - 加 <script src="src/dev/audit.js"> 引用 (L842, 在 map_interaction.js 之后)
  - src/dev/ 第二个文件 (跟 debug.js 同 dev cluster)
  - v181: 2100 → 1799 (-301)
- v181 累计 streamline batch: 2178 → 1799 (-379, -17.4%, 累计 -95.5%) ⭐ 突破 -95.5%
- byte-identical verify: I + K 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2, 含 I+K 两个 commit)
- codex 集中 review trial 1 LGTM (零 finding 7 关注点全 PASS, 跨链消费者全 verified: checkElimination ← tick.js / runIntegrityAudit ← tabs.js / billetUnit ← map_render.js / _confirmBillet ← billet modal inline onclick)
- 实机测 PASS (制作人 2026-05-09): 玩家 billet (选部队+进城+driving modal) + 多旬游戏 (checkElimination + runIntegrityAudit) 全 OK
- 1 minor 设计建议 (非阻塞): checkElimination 偏游戏机制更适合归 src/core/tick.js, 但归 src/dev/audit.js (跟 v119 audit/check block 邻接) 不阻塞 — future organization decision 留 audit pass 2
- streamline batch 第 4 次复用 (前 3 次: phase 4 4.1-4.5 / sprint batch-7-10 / batch-11-14 / batch-15-17 / _exec sprint batch-26-30)
- M 顶层散件 (SPOIL_RATES / WILD_POOL_* / _fastForward 等) 跳过本 batch, 留下次处理 (跨 chain 复杂)
- **I+K 收尾 ✅** (玩家 billet 入口 + audit/check 全归位)

**M-misc 顶层 const 抽离 (M sub-session, 2026-05-09, 双 block 加进 constants.js)**:
- v181 L964-L965 (Block A, 2 行) + L970-L975 (Block B, 6 行) → constants.js range D
- 4 const:
  - SPOIL_RATES (腐损率, 经济链 + renderLeft 共用)
  - WILD_POOL_SIZE / WILD_POOL_INTERVAL (在野武将池规模 + 5 旬刷新)
  - AI_RECRUIT_INTERVAL (AI 3 旬尝试招募)
- 中间 L966-L969 (经济链 E4 + R4.3.b markers + 空行) 留 v181
- v181 替换为 2 行 marker (净 -6)
- v181: 1799 → 1793 (-6, 累计 -95.5%)
- src/data/constants.js: 609 → 620 (+11)
- byte-identical + smoke vs main: PASS — 51 snapshots identical
- codex trial 1 LGTM (零 finding 5 关注点全 PASS, 跨链消费者全 verified: economy.js / tick.js / general.js / ui_panels.js)
- 不实机测 (verbatim const, 同 bucket-2 / bucket-6 combat / dc.S3 模式)
- 跳过: _fastForward/_ffTurns (跨 chain 复杂) / _unitMenu (notifications.js consumer) / SAVE_*/_store (跟 _serializeG 必留)
- **M sub-session 收尾 ✅** (顶层杂项 const 抽离 batch 主菜)

**phase 4 sub-session 4.10 单 codex review (2026-05-09, 最高风险, phase 4 收官)**:
- 4.10 battle_anim: 战斗动画 cluster 抽到 src/render/battle_anim.js (新建)
- 1 段连续 block: v181 L1665-L4233 (2569 行), 1 let + 1 const + 11 顶层 funcs + 1 _baCore IIFE (含 14 内部 helper) = 25 funcs + 1 IIFE 入口
- 1 let: _battleAnimating (anim 专属 lock)
- 1 const: DUEL_EPITHET (16 名将称号表)
- 11 顶层: _drainPendingBattleAnimations / _getDuelEpithet / _playDuelPreludeAnim / _baGetUnitRenderPos / _playBattleCollisionAnim / _baDrawCampPalisade / _playCampBattleAnim / _playAmbushBattleAnim / _playSiegeBattleAnim / _playNavalBattleAnim / _siegeArrivalChoice
- 1 IIFE _baCore (14 内部 helper): SVG_NS / EASE / runTween / startTween / shouldSkip / ensureAnimLayer / spawnClashRing / spawnSlashes / spawnSparks / spawnClashMark / shakeMapSvg / spawnLossText / floatLossText / makePhantom / makeShipPhantom / spawnResultText / animateResultText / cleanupAnimLayers
- scope 决策 (制作人 2026-05-09 approve):
  1. _battleAnimating let 跟 anim cluster 一起抽 (反 MIL7.a 时期 "留 v181" 决策, anim 抽离后 lock semantically 应跟 anim 走)
  2. _execInstantMarch (v181 L4252) 留 v181 (plan §11 边界, 玩家行军核心 + 下游 _collectPlayerVisibleKeys/_animateFogReveal/_checkInstantBattleTrigger 同质 map 交互 cluster 一并留)
- v181: 7066 → 4499 (-2567, -36.3%, 累计 -88.6%) ⭐ 突破 -88% 大关
- src/render/battle_anim.js: 0 → 2638 行
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- **smoke 必要不充分**: _fastForward=true 路径跳过 anim, 必须靠完整战斗实机测 verify
- codex trial 1 LGTM (零 finding, 46585 tokens, "Verified diff shape ... script order ... boundaries: _execInstantMarch remains in v181 ... No blocking extraction, boundary, or load-order issues")
- 实机测 PASS (制作人 2026-05-09): 野战 / 伏击 / 单挑 / 攻城 (玩家攻 AI) / 围城到达 / 战报 / 俘虏处置 全 OK
- 实机测发现 1 个 pre-existing v181 bug (非 4.10 regression, code-level diff verify byte-identical):
  - **AI 攻玩家城无攻城动画** — 直接弹战报. 怀疑路径: tick.js:626 fire-and-forget 不 await + battle_anim.js:165 shouldSkip _battleAnimating 检查 / fog 检查. 已记 sprint_followup §5.1, 留战斗机制 systematic bug fix sprint
- **phase 4 全收官 ✅** (10/10 sub-session 完成)
- **重构主体收官 ✅** (39 src/ 文件 / v181 -88.6% / phase 1+2+3+dc + HIGH/_exec sprint + phase 4 全部完成)

**phase 4 sub-session 4.9 单 codex review (2026-05-09, 高风险首发)**:
- 4.9 battle_modals: 战斗 confirm + dispose modal cluster 抽到 src/render/battle_modals.js (新建)
- 1 段连续 block: v181 L4237-L6173 (1937 行), 17 顶层函数 + 3 内部 helper = 20 funcs
- 17 顶层: _battleSideHtml (modal HTML helper, plan 漏列 11 caller 全在 4.9 一并抽) + 16 plan funcs (4 confirm/abort 系列: ambush/camp/siege battle/siege defend + selectDuelChallenger + confirmBattle + showNextBattleReport + closeBattleModal + showNextPrisonerModal + playerDisposePrisoner)
- 3 内部 helper (showNextBattleReport scope): duelBlockHtml / genEventRows / appendDuelKillRow
- scope 决策: _battleSideHtml plan 漏列但 caller 全在 4.9 一并抽 (跟 4.8 selCity/selFac 同模式邻接 helper 决策)
- 边界: _siegeArrivalChoice (上, L4232) + _execInstantMarch (下, L6187) 留 4.10 处理
- _pendingBattleConfirms / _currentBattleConfirm / _duelChallenger 3 lets 已在 military.js MIL7.a/b 抽离, 本 session verbatim 直读 global scope
- v181: 9001 → 7066 (-1935, -21.5%, 累计 -82.1%) ⭐ 突破 -82% 大关
- src/render/battle_modals.js: 0 → 1987 行
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (零 finding, 44745 tokens, "Verified changed surface is only ... contains expected 17 + 3")
- 实机测 PASS (制作人 2026-05-09): 7/8 场景 (野战 confirm / 攻城 / 守城 / 伏击 / 单挑 / 战报 / 俘虏处置 全 OK), ② 营寨战 因 AI 不扎营跳过 (v181 历史 AI 行为局限, 不是 4.9 抽离 issue)

**制作人 insight (2026-05-09): 战斗机制 systematic bug fix sprint 候选**:
- 4.9 实机测后用户留 "整个战斗机制是重要环节, 估计还有很多 bug 和需要细化, 重构角度看 OK, bug 后面系统性修"
- 含义: 4.9 重构 verbatim 抽离 ≠ 战斗机制设计正确性. 后续 bug fix sprint 应把战斗机制作为重要环节
- AI 不扎营 (4.9 ② 营寨场景跳过) = 已知 AI 行为缺失候选
- 详细见 project_combat_mechanism_bugfix.md

**phase 4 sub-session 4.8 单 codex review (2026-05-09, 中-高风险)**:
- 4.8 tabs: 8 tab 渲染 + renderRight 容器 + tab 系统 UTILS 抽到 src/render/tabs.js (新建)
- 3 不连续 block: R4.8.a (L1432-L2862, 主 block 8 tabs + renderRight + 6 内部 helper) + R4.8.b (L2864-L2872, UTILS 4 funcs) + R4.8.c (L8326-L8395, renderMilTab 孤悬位置)
- 19 函数总数 (8 主渲染 + 6 helper + 4 utils + 1 milTab):
  - 主渲染: renderTechTab/renderStatsTab/renderPostTab/renderRight/renderFactionTab/renderDipTab/renderSchemeTab/renderEthosTab + renderMilTab
  - 6 helper: openTechResearchPicker + confirmTechResearch (Tech tab 选研究 modal) + getCourtStatusText + _buildCourtNarrative + _buildCourtWarnings + _buildCourtVacancies (Post tab 朝堂文本)
  - 4 utils: selCity/selFac/switchTab/updateTabs (tab 系统切换入口)
- scope 决策: 单 session 抽 (plan 备选 4.8.a/b/c 不必要). plan v0.3 估 ~3200 行高估 2 倍, scout 实测 ~1500 行
- 邻接决策: selCity/selFac 跟 switchTab/updateTabs 同 UTILS section 模式同质, 一并抽避免 section 裂开
- v181: 10507 → 9001 (-1506, -14.3%)
- src/render/tabs.js: 0 → 1567
- **codex trial 1 NEEDS-WORK P2 metadata** (函数清单 13→19, scout grep 漏列 6 内部 helper). 用 `^\s*function\s+(name1|name2|...)` 只 grep 已知名字, 没用 `^function\s+\w+` 通配, 漏看夹在 tab 间的 helper. → amend metadata fix (tabs.js header + v181 marker + commit message) → trial 2 LGTM
- 实机测 PASS (制作人 2026-05-09, F12 console 零 error, 9 tabs 切换 + Tech 选研究 modal + city/fac 选择 全 OK)
- **新教训**: scout grep pattern 应该用通配符 (`^function\s+\w+`) 而不是已知函数名列表, 避免漏看夹在中间的 helper. 后续 sub-session 启动 scout 时遵循

**phase 4 渲染层第二轮 streamline batch 1 (sub-session 4.1-4.5, 2026-05-08)**:
- phase 4 plan 文档化: docs/phase4_plan.md v0.1 → v0.3 (CC ↔ codex 协作 2 round, P2 smoke baseline + P3 编号 + Option B uncommitted/untracked 安全)
- 决策 1: 接口风格 A — verbatim 直读 G (跟 chain/_exec sprint 一致)
- 决策 2: 拆分 B+C — 按文件类型 + 按抽离难度排序 (低→高)
- 决策 3: plan 文档化 + CC ↔ codex 协作迭代
- sub-session 4.1 overlay (337 行 → src/render/overlay.js)
- sub-session 4.2 map_render (709 行 → src/render/map_render.js, 4 不连续 block)
- sub-session 4.3 notifications-extend (310 行 append → src/render/notifications.js)
  - **trial 1 踩坑**: Block 4 起点 L9163 错误地包含 clearMovePreview 的 closing }, 导致 SyntaxError. trial 2 修正 L9166 PASS. 经验: Node 多块切片必须实测每个 block first/last 是 function 完整起止
- sub-session 4.4 gen_profile (305 行 → src/render/gen_profile.js)
- sub-session 4.5 boot_screens (1461 行 → src/render/boot_screens.js, 含 Claude AI UI cluster 加进来)
- v181 phase 4 累计: 15049 → 11927 (-3122, -20.7%)
- 5 sub-session 集中 codex review 一次过 LGTM (零 finding, "straight extraction... no discrete regression")
- 实机测 PASS (制作人 2026-05-08)
- streamline 模式 trial 2 验证 (跟 _exec sprint trial 1 同性质, render 层 verbatim 抽离同质度高)

**batch-26~30 _exec 归位架构债 sprint 5 batch streamline (2026-05-08, _exec sprint 全收官)**:
- 35 个 dispatcher targets (_execXxx) 从 v181 段 M 按 (a) 原则归位到对应 chain
- batch-26: 武将 2 (RecruitWild/Poach) → general.js GEN16
- batch-27: 武将续 2 (SetPrefect/SetStrategist) + 政治 2 (AppointPost/DismissPost) → general.js GEN16 + politics.js P7
- batch-28: 经济 5 (Build/SetTax/SetCorvee/TransferFood/ToggleResupply) + 科技 1 (Research) → economy.js E9 + politics.js P8
- batch-29: 外交主 7 (BreakAlliance/DiploGift/DiploArmistice/StartClaim/Demand/Submit/ReleaseVassal) + 计谋 5 (DriveWolf/TwoTigers/Spy/Rumor/Scout) → diplomacy.js D7
- batch-30: 军事 8 (Move/Recruit/Disband/SetCamp/SetAmbush/CancelSpecial/CancelSiege/SetReinforcePolicy) → military.js MIL9
- **最终分布**: diplomacy 14 + military 8 + economy 5 + politics 4 + general 4 + claude_ai dispatcher 1 + v181 _execInstantMarch 1 (战斗动画 helper, 不在 dispatcher)
- **streamline 模式**: 5 batch local commit 留 working branch 不 push, 集中 codex review 一次过 (LGTM 零 finding), 一次性 push (Claude AI 实机测后置 followup)
- **(a) 原则严格分类**: 按 helper 所在 chain 而非命名直觉 (batch-27 _execAppointPost 跟 appointGenPost 归 politics, 不跟"武将相关"命名归 general)
- v181 sprint 起点 → 终点: 15591 → 15049 (-542 行, -3.5%)
- **新原则沉淀**: feedback_exec_sprint_streamline.md (高度同质 sprint 集中 codex review)
- codex review trial 1 LGTM (零 finding, 仅指出"relocate without changing dispatcher or introducing obvious runtime breakage")

**Claude AI 实机测后置 followup**: _exec sprint 是 verbatim relocation + smoke vs main byte-identical + codex LGTM, 但 smoke 不跑 Claude AI 路径. Claude AI 实机测建议 (开 _claudeAI.enabled 跑 10-20 旬 verify 35 dispatch 路径无 ReferenceError) 留 followup, 下次需要 Claude AI 路径相关动作时一并测.

**batch-25 信息暴露面三层补全 (2026-05-08, HIGH sprint 收官 batch)**:
- D-121 HIGH 价值观链 (sprint 唯一剩余 HIGH): Claude AI getGameState 305 行函数体零 ethos + prompt 零 ethos + _execEnthrone 绕过 mandate gate
- 三层修法 (claude.ai 决策方向 + 制作人 token-conscious 调整):
  1. _execEnthrone v181 L13936-13940 verbatim 抽到 src/chains/politics.js (P6, batch-19 模式) + 加 mandate<30 gate 与 aiConsiderEnthrone 对齐
  2. getGameState 战略旬 + _buildDeltaSnapshot 战术旬都加 ethos 紧凑 string ('天命15·天命有归|...') + diplo[].e_dist
  3. _claudeSystemPrompt 加 §四.价值观距离 3 行子节 + enthrone 操作行 mandate 提示
- token 节省: 用紧凑 string 而非对象 (~30 token/旬 vs ~80 token), prompt 走 cache 一次性 ~200 token
- codex trial 1 NEEDS-WORK 2 issue: (a) prompt 误导 propose_alliance 不直接读 _ethosDistance (改为准确措辞: 通过 ethos→rel 漂移间接 + 影响规则 AI 宣战意愿) (b) _buildDeltaSnapshot 战术旬遗漏 ethos (战术旬支持 declare_war/propose_alliance) → trial 2 LGTM
- smoke vs main: byte-identical 除时间戳 (Claude AI 路径不在 smoke 范围, 无回归风险)
- **价值观链 1 HIGH 全收尾 ✅** (D-121 close)
- **sprint 27 HIGH 全收尾 ✅** = HIGH sprint 整体收官

**v179fix P15c 平行 bug 三连收尾**(D-104 + D-113 + D-117c,batch-6 / 5 / 18)。
**Streamline 模式 trial 1+2+3 完成**(batch-7-10 / 11-14 / 15-17),batch-18 / 19 走单独 push (大批 architectural 不混 streamline)。
**batch-17 首次触发算法回路类 smoke FAIL acceptable**(sprint_followup §一 预期场景)。
**batch-18 baseline staleness pre-existing**(eventCooldown 结构,非本 batch 引入)。
**batch-19 cascading smoke ~13K 行 acceptable**(triggerFactionEvent → genFactionMod → 武将忠诚下游传播,sprint_followup §一 算法回路类典型)。

**跳过 / 留 followup 类型**:
- (无, sprint HIGH 全收尾)

## 整体成绩(phase 1+2+3+dc + HIGH sprint + _exec sprint + phase 4 10/10 + 桶 2 + 桶 6 + F+G+J+H+I+K+M 收尾 ✅)
- **v181.html: 39547 → 1793 (-37754, -95.5%)** ⭐ 突破 -95.5% (phase 4 -10550 + 桶 2 -76 + 桶 6 -1497 + F render-cache -269 + G map-interaction -324 + J map-zoom -119 + H utilities -36 + I billet -78 + K audit -301 + M misc -6)
- src/: 0 → **43 js 文件 + 1 css ~41610 行**(data 7 / render 17 / core 7 / chains 8 / dev 2+1css + 2 memory feedback)
- 抽出累计:417 函数 (phase 3) + 65 顶层 const + 5 IIFE + 1 嵌套 IIFE-helper (dc) + ...
- 5 个 baseline 共存 (phase1_post / phase2_complete / phase3_complete / data_completion_complete)
- 4 个 git tags: v181-pre-refactor / phase1-baseline-archive / phase3-complete-archive / data-completion-archive
- 全程 byte-identical 行为零漂移 (snapshots SHA256 = 96ac537219195d5621fe9c96b337cc47338a581b9d5a0cdea38c9714d1abf190)

## refactor/data-completion 数据(2026-05-05/06 完成)
- v181: 17391 → 15656 (-1735, -10.0%)
- src/data/: 6 → 7 文件 (新建 state_county.js)
- 抽出: 1742 行 verbatim / 65 顶层 const + 5 IIFE 派生 + 1 嵌套 IIFE-helper (_CLAN_MAP)
- 5 sub-session: dc.0 scout / dc.S1 generals 扩 / dc.S3 constants 扩 / dc.S2 state_county 新建 / dc.collect 收尾
- 实装 1 bug (S2 行号偏移) + 修复 + 沉淀新原则 #11
- 0 D 类主动 fix (CLAUDE.md 硬规则严守)

## 工作流原则集中索引(2026-05-06)
**`docs/refactor_workflow_principles.md`** — phase 3 + dc + sprint 累积 **9 条原则 + sprint gate 语义节**:
- #5 scout-before-extract (p3.3)
- #6 chain 阶段 chains/*.js 6 项 header 必含 (p3.5, chain 专用)
- #7 awk 边界用 wc -l 验证 (p3.6)
- #8 Node 双脚本 (build + replace 共享 ranges) 代替手打 (p3.7)
- #9 scout 四件验证 + #9 补充 docstring 不跨切 (p3.8 / p3.12)
- #10 ranges 无嵌套 inclusion (p3.11)
- #11 新建文件时 replace 在前 script tag 在后 (dc.S2)
- **#12 D 类 fix 必须显式声明覆盖的入口路径** (sprint 启动期 codex review)
- **#13 状态字段语义变更必须核 5 个生命周期点闭环** (sprint 启动期 codex review)
- **#14 sprint scout 必读 walkthrough** (batch-2 D-091 漏看沉淀)
- **§十一 sprint gate 证据语义** (batch-2 codex review,语义节非编号原则)

phase 4 / sprint 启动 session 必读. 后续新原则触发时追加 #15+.

## 终态(main 已 push, memory update 待 commit + push)
- **main HEAD: `7644cdb refactor(M-misc): 顶层杂项 4 consts (SPOIL_RATES + WILD_POOL_*) 抽到 src/data/constants.js range D` (synced to origin)**
- **重构主体彻底收官 + 桶 2 + 桶 6 + F + G + J + H + I + K + M 收尾** ✅
- M-misc (M sub-session, 2026-05-09 commit):
  - `7644cdb` refactor(M-misc): 4 consts 双 block (SPOIL_RATES + WILD_POOL_SIZE + WILD_POOL_INTERVAL + AI_RECRUIT_INTERVAL, 8 行 verbatim → constants.js range D, -6) [refactor/M-misc-const 已 push]
- streamline batch I+K (2026-05-09 commits):
  - `136c340` docs(memory): I+K 收尾 status update
  - `18e9fbc` refactor(K-audit): 2 funcs (runIntegrityAudit + checkElimination, 303 行 verbatim → src/dev/audit.js 新建, -301, 累计 -95.5%) [refactor/streamline-IK 已 push]
  - `080f057` refactor(I-billet): 2 funcs (billetUnit + _confirmBillet, 79 行 verbatim → military.js MIL10, -78)
- h-utilities (H sub-session, 2026-05-09 commit):
  - `b182b19` docs(memory): H sub-session 收尾 status update
  - `34c1828` refactor(h-utilities): 3 funcs (log + updateFacStats + handleKeyDown, 37 行 verbatim → notifications.js, -36, 累计 -94.5%) [refactor/h-utilities 已 push]
- map-zoom (J sub-session, 2026-05-09 commit):
  - `e1f640b` docs(memory): J sub-session 收尾 status update + _unitMenu 纠正
  - `fa60fac` refactor(map-zoom): 双 block (5 lets/consts + 5 funcs + DOMContentLoaded + _onDocKeydown + listeners, 121 行 verbatim → map_interaction.js range C/D, -119, 累计 -94.4%) [refactor/map-zoom 已 push]
- map-interaction (G sub-session, 2026-05-09 commit):
  - `c7ccff8` docs(memory): G sub-session 收尾 status update
  - `f91dd33` refactor(map-interaction): map/unit 交互 10 funcs (326 行 verbatim → src/render/map_interaction.js, -324, 累计 -94.1%) [refactor/map-interaction 已 push]
- render-cache (F sub-session, 2026-05-09 commit):
  - `0edfaef` docs(memory): F sub-session 收尾 status update
  - `95261b4` refactor(render-cache): renderAll + 3 SVG cache (9 funcs + 9 lets, 271 行 verbatim → src/render/render_cache.js, -269, 累计 -93.3%) [refactor/render-cache 已 push]
- 桶 6 combat tables (E sub-session, 2026-05-09 commit):
  - `43012cc` docs(memory): E sub-session 收尾 status update
  - `8c8fac2` refactor(bucket-6): 战斗 + 相性 9 consts → generals.js range C + constants.js range B (-126, 累计 -92.6%) [refactor/bucket6-combat-tables 已 push]
- 桶 6 _debug 抽离 (2026-05-09 commit):
  - `e5928e0` docs(memory): 桶 6 _debug 收尾 status update
  - `9774c38` refactor(bucket-6): _debug panel (-1371, 累计 -92.3%) [refactor/bucket6-debug 已 push]
- 桶 2 残余 (2026-05-09 commit):
  - `b0406ab` docs(memory): 桶 2 残余收尾 status update
  - `f8c3c18` refactor(bucket-2): GEN_MAP + 6 squad/class funcs (-76, 累计 -88.8%) [refactor/bucket2-squad-class 已 push]
  - `3868e6d` docs: phase 4 sub-session 4.10 收官 + 战斗机制 bug §5.1 §5.2 沉淀
- phase 4 历史 (main 上):
  - `93ae4d1` phase4(4.10): battle_anim (1 let + 1 const + 11 顶层 funcs + _baCore IIFE 14 helper, -2567, -88.6% 累计) [4.10-battle-anim 已 push]
  - `e5a955a` docs(memory): phase 4 sub-session 4.9 完成 + 战斗机制 bug fix sprint 候选 沉淀
  - `758e9bf` phase4(4.9): battle_modals (17 顶层 + 3 内部 helper, -1935) [4.9-battle-modals 已 push]
  - `0bcb2ec` phase4(4.8): tabs.js (8 tabs + renderRight + 6 helper + 4 utils + renderMilTab, -1506) [4.8-tabs 已 push]
  - `66f0fa8` phase4(4.7): recruit_modals (征兵 + 整备 + 扩编 + 增编分队 4 cluster, -1225)
  - `3508405` phase4(4.6): diplo_modals (朝议 + 求和 + 屠城 + 附庸, -195)
  - `04a6c9c` docs(memory): phase 4 batch 1 (4.1-4.5) status update
  - `e020daf` phase4(4.5): boot_screens (启动 / 教程 / 帮助 / 存读档 / 结局 / Claude AI UI, -1461)
  - `aebdf05` phase4(4.4): gen_profile (武将 + 官职弹窗, -305)
  - `78d19c2` phase4(4.3): notifications.js 扩展 (迁民 + 告急卡片 + closeUnitMenu + stack picker, -310)
  - `216c2fc` phase4(4.2): map_render (主地图 + 部队 SVG + 部队详情, -709)
  - `f506c13` phase4(4.1): overlay 子系统 (-337)
  - `757eb17` docs(phase4): plan v0.3 (Option B uncommitted/untracked 安全)
  - `dd32d26` docs(phase4): plan v0.2 (smoke baseline + 编号修正)
  - `05de7a9` docs(phase4): plan v0.1 起草
- sprint 历史 (main 上):
  - `9f7d48d` sprint(batch-30): _exec sprint 收官 — 军事 8 → military.js MIL9
  - `5e2fa8c` sprint(batch-29): _exec — 外交 12 (主 7 + 计谋 5) → diplomacy.js D7
  - `dc2c58b` sprint(batch-28): _exec — 经济 5 + 政治 1 (Research) → economy.js E9 + politics.js P8
  - `b9abb09` sprint(batch-27): _exec — 武将续 2 + 政治 2 → general.js GEN16 + politics.js P7
  - `96b4742` sprint(batch-26): _exec sprint 启动 — 武将 2 → general.js GEN16
  - `bab0be0` docs(memory): batch-25 D-121 sprint 收官 status update + cross-machine sync feedback
  - `d3f7a25` sprint(batch-25): D-121 HIGH Claude AI ethos 三层 (战略+战术 snapshot / _execEnthrone mandate gate, **价值观链 1/1 ✅, HIGH sprint 27/27 ✅ 全收尾**)
  - `c7b2139` sprint(batch-24): D-052 HIGH calcLoyaltyDelta 4 项缺漏 (武将链 10/10 全收尾 ✅, helper 模式 2 次复用)
  - `5d3233d` sprint(batch-23): D-065 HIGH _calcPoachRate helper 抽离 (玩家/AI 5 buff 对称, clamp 统一 [0.20, 0.85])
  - `5dc8fc5` docs(sprint_followup): batch-22 §3.2.1 day-1 部曲 type vs squad type 不一致 audit pass 2 candidate
  - `b4c71fe` sprint(batch-22): D-020+D-099 closes via deletion (净 -34 行死/错代码, 军事链 6/6 全收尾 ✅)
  - `c331d32` test(sprint): batch-21 lifecycle simulate 模板落地 (80 旬 D-026 完整 verify)
  - `9fd73ba` sprint(batch-21): D-026 HIGH 大乱 freeze+3 旬路线 (10 处 freeze + occupied=3 特例 + codex 4 trials)
  - `64f6d89` sprint(batch-20): D-053+D-133 closes via deletion (净 -27 行死代码)
  - `f6f3b9e` sprint(batch-19): D-049+D-131+D-045 architectural robust 3 sub-batch squash (抽 _exec + 11 caller + invariant checker)
  - `6f03407` sprint(batch-18): D-117c HIGH checkDiplo 自动宣战 5 项副作用补全
  - `56304dd` sprint(batch-15-17): 3 HIGH streamline (D-031+D-035+D-048)
  - `80cc4fc` sprint(batch-11-14): 4 HIGH streamline (D-016+D-051+D-055+D-076)
  - `ea55af5` sprint(batch-7-10): 4 HIGH streamline (D-061+D-063+D-064+D-084)
  - `8734e20` sprint(batch-6): D-104 HIGH _pendingVassalOffer P15c 平行
  - `1371287` sprint(batch-5): D-113 HIGH 强制停战漏 _applyPeaceAgreement
  - `110ecfd` sprint(batch-4): D-120 HIGH G._diploActed nextTurn reset
  - `58ebed8` sprint(batch-3): D-091 HIGH 附庸 3 helper 签名错配
  - `26659f9` sprint(batch-2): D-099 prompt 缺指令 + 原则 #14 + sprint gate 语义
  - `ba4821c` sprint(batch-1a): D-021/D-077 cross-chain close
- refactor/data-completion HEAD: `5b61620` (保留)
- refactor/phase-3 HEAD: `afc2b3a` (保留)
- sprint 工作分支保留(部分 push): batch-1a / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 17 / 21 / 22 / 23 / 24 / 25 / 26 / 27 / 28 / 29 / 30 / checker-framework
- phase 4 工作分支保留: phase4/plan / 4.1-overlay / 4.2-map-render / 4.3-notifications-extend / 4.4-gen-profile / 4.5-boot-screens / 4.6-diplo-modals / 4.7-recruit-modals / 4.8-tabs / 4.9-battle-modals / 4.10-battle-anim (全 push)
- tags 全 push: phase1-baseline-archive / phase3-complete-archive / data-completion-archive

## v181 剩余 15656 行 6 桶实测分类(dc 后 grep+wc 实测, 见 docs/data_completion_summary.md §九)
- 桶 1 HTML shell L1-L830: **830** (5.3%) — 必留 v181
- 桶 2 残余 const+squad class L831-L1186: **356** (2.3%) — 数据 sprint 已基本清空, 残余 squad class 75 + GEN_MAP let 5 + markers ~30 + 注释 ~240
- 桶 3 渲染层尾巴 L1187-L11856 散在: **~10670** (68.2%) — phase 4 主目标 (8 right tabs + 战斗动画 + modals)
- 桶 4 _exec 派发 L13381-L14000: **620** (4.0%) — 架构债 sprint 5 batch
- 桶 5 reset+serialize+boot L11857-L13380: **~1524** (9.7%) — 必留 v181
- 桶 6 顶层杂项 + 第二段 _debug script: **~1656** (10.6%) — ~~第二段 1296 行 (_debug 调试块) 可单独抽到 src/dev/~~ ✅ **已抽** (commit 9774c38), 残余仅顶层杂项 ~360 行

注:phase3_summary §10.0 桶 6 ~7378 是 catch-all 估算, 散在 mechanism helpers 实际归桶 3, 总和一致.

## 留底架构债(明确标注, 后续 sprint 处理)
1. ~~**_exec 归位架构债**~~ ✅ **已收官** (sprint batch-26~30 完成, 35 dispatcher targets 全归位)
2. **30 D 类位置文档化** (武将链, phase3_summary §九 + p3.12_notes §五): 武将链 5 batch sprint 建议
3. ~~**squad class 6 函数 + GEN_MAP let region**~~ ✅ **已收官** (2026-05-09 桶 2 残余抽到 general.js GEN17, commit f8c3c18)
4. ~~**桶 6 第二段 _debug script (1296 行) + style (71 行)**~~ ✅ **已收官** (2026-05-09 抽到 src/dev/debug.{js,css}, commit 9774c38)

## How to apply

**新对话启动时**:
1. `git log --oneline -10` 校验 main HEAD (M-misc 后 = `7644cdb`, 后续 memory commit 在它之上)
2. **重构主体彻底收官 + 桶 2 + 桶 6 + F + G + J + H + I + K + M 收尾 ✅** (phase 1+2+3+dc + HIGH sprint + _exec sprint + phase 4 10/10 + 桶 2 + 桶 6 + F + G + J + H + I + K + M 全部完成, v181 -95.5%)
3. **sprint 累计**: 30 sprint batches + 10 phase 4 sub-sessions (全部完成)
4. **phase 4 实测 vs plan**: 累计 -10550 行 (实测远低于 plan 估"突破 -80% 大关 v181 ~3000 行"). 4.10 实测 -2567 vs plan 估 ~2500 (这次比较接近)
5. **下阶段候选** (制作人决):
   - **战斗机制 systematic bug fix sprint** (memory project_combat_mechanism_bugfix.md, sprint_followup §五 §5.1+§5.2)
     - §5.1 AI 攻玩家城无攻城动画 (P1, 4.10 实机测 catch 但 pre-existing v181 bug, 非 4.10 regression)
     - §5.2 AI 不扎营 (P2, 4.9+4.10 实机测都跳过 ②营寨)
   - MEDIUM/LOW D 类 sprint (sprint HIGH 27/27 已收, MEDIUM 44 / LOW fix 67 待启动)
   - audit pass 2 / data-completion 2
   - 桶 2 squad class 6 函数 + GEN_MAP let region 残余 (~85 行)
5. **Claude AI 实机测后置 followup** (_exec sprint 未跑 Claude AI 路径, smoke 不覆盖 _claudeAI.enabled 路径)
6. **下阶段候选** (制作人决, phase 4 完成后): MEDIUM/LOW sprint / audit pass 2 / data-completion 2
6. **verification harness** (claude.ai 决策): 不要 jsdom 全游戏跑, 用函数级 spy + invariant checker. D-052/D-065 都用这套
7. **lifecycle simulate 模式 (batch-21 verified)**: 复杂 freeze/lifecycle batch 用 jsdom + force 触发 + 多旬 invariant assert (tests/batch21_simulate.js 模板). 比 smoke layer-2 更彻底, batch-22-25 可复用
8. 也可改向: phase 4 (渲染层第二轮, 桶 3 ~10670 行) / _exec 归位架构债 sprint (batch-19.1+batch-22 已消化外交 3/14)
9. **invariant checker 维护**: 新增 status='enemy'/'ally'/城市易主写口时, 更新 tests/checkers/faction_event_invariant.js EXPECTED_CALLERS 表
10. **任何 sprint batch 启动必读** `docs/refactor_workflow_principles.md` (9 原则 + sprint gate 语义节, 尤其 #12 #13 #14 + §十一)
11. **codex review workflow** (batch-3-21 verified): 见 feedback_codex_review_workflow.md. batch-21 trial 1-3 NEEDS-WORK (catch 4 latent bugs) → trial 4 LGTM, 复杂 freeze 类多轮 review 是常态
12. **streamline 模式** (batch-7-10 trial 1 verified): 连续简单 batch 累积 commit 留 local, 集中 codex review, user 集中验收 + 一次性 push. 见 feedback_sprint_streamline_batches.md
13. **设计反转 case** (batch-21): 制作人 insight 优先级 > claude.ai 决策方向. 反转后 user 回 Claude.ai 同步 → CC 等同步完再实装. scope 可能从"1 行数值"扩到"10 处 mini-mechanism", 重新 mini scout
14. push 决策权属制作人 (feedback_push_authorization.md), 等明确判定再 push
