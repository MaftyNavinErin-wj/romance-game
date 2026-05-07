---
name: Refactor phase status — phase 3 + dc 收官 + sprint 23 batches 完成
description: Phase 3 + data-completion 收官 + sprint 23 batches done (main 5d3233d). v181 39547 → 15569 (-60.7%). 28 src/. 工作流原则 9 + #15 接口完整性 invariant + streamline trial 3 + trial helper 模式 (batch-23). 政治+外交+事件+军事 全收尾 / 武将 9/10 (剩 D-052) / 价值观 0/1. batch-23 D-065 抽 _calcPoachRate helper (玩家/AI 公式对称化 5 buff).
type: project
originSessionId: 512dcd0b-fb4e-439d-a8fe-64996a4fc5c8
---
**截至 2026-05-07 的状态(每次 session 启动前请用 git log 校验,不抄)**:**重构 + 数据补完整体收官 + D 类 sprint 进行中,共 23 batches 完成 (1a / 2 / 3-6 单独 / 7-10 / 11-14 / 15-17 streamline / 18 / 19 architectural / 20 / 21 / 22 / 23 单独 push)**。

**HIGH 进度** (修 25 / 总 27):
- 政治链 3 HIGH: **全收尾 ✅** (D-076 / D-077 / D-084)
- 外交链 5 HIGH: **全收尾 ✅** (D-091/D-104/D-113/D-117c/D-120)
- 武将链 10 HIGH: 修 9 (+batch-23 D-065 helper 抽离),剩 D-052
- 军事链 6 HIGH: **全收尾 ✅** (D-016/D-020/D-021/D-026/D-031/D-035, batch-22 D-020 deletion 收尾)
- 价值观链 1 HIGH: 剩 D-121 (跨链复杂)
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

**v179fix P15c 平行 bug 三连收尾**(D-104 + D-113 + D-117c,batch-6 / 5 / 18)。
**Streamline 模式 trial 1+2+3 完成**(batch-7-10 / 11-14 / 15-17),batch-18 / 19 走单独 push (大批 architectural 不混 streamline)。
**batch-17 首次触发算法回路类 smoke FAIL acceptable**(sprint_followup §一 预期场景)。
**batch-18 baseline staleness pre-existing**(eventCooldown 结构,非本 batch 引入)。
**batch-19 cascading smoke ~13K 行 acceptable**(triggerFactionEvent → genFactionMod → 武将忠诚下游传播,sprint_followup §一 算法回路类典型)。

**跳过 / 留 followup 类型**:
- D-052 算法回路双向 4 项缺漏 (smoke baseline 不再守底, 需新验证机制)
- D-117c 外交新模式 (设计层 ambiguity, 已 batch-18 close)
- D-121 价值观跨链 (剩, batch-25)

## 整体成绩(phase 1+2+3+data-completion)
- **v181.html: 39547 → 15656 (-23891, -60.4%)** ⭐ 突破 -60% 大关
- src/: 0 → **27 文件 26689 行**(data 7 / render 5 / core 7 / chains 8)
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

## 终态(已 push 到 origin)
- **main HEAD: `5d3233d sprint(batch-23): D-065 HIGH 抽 _calcPoachRate 共享 helper` (origin/main)**
- sprint 历史 (main 上):
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
- sprint 工作分支保留(全 push): batch-1a / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 17 / 21 / 22 / 23 / checker-framework
- tags 全 push: phase1-baseline-archive / phase3-complete-archive / data-completion-archive

## v181 剩余 15656 行 6 桶实测分类(dc 后 grep+wc 实测, 见 docs/data_completion_summary.md §九)
- 桶 1 HTML shell L1-L830: **830** (5.3%) — 必留 v181
- 桶 2 残余 const+squad class L831-L1186: **356** (2.3%) — 数据 sprint 已基本清空, 残余 squad class 75 + GEN_MAP let 5 + markers ~30 + 注释 ~240
- 桶 3 渲染层尾巴 L1187-L11856 散在: **~10670** (68.2%) — phase 4 主目标 (8 right tabs + 战斗动画 + modals)
- 桶 4 _exec 派发 L13381-L14000: **620** (4.0%) — 架构债 sprint 5 batch
- 桶 5 reset+serialize+boot L11857-L13380: **~1524** (9.7%) — 必留 v181
- 桶 6 顶层杂项 + 第二段 _debug script: **~1656** (10.6%) — 第二段 1296 行 (_debug 调试块) 可单独抽到 src/dev/

注:phase3_summary §10.0 桶 6 ~7378 是 catch-all 估算, 散在 mechanism helpers 实际归桶 3, 总和一致.

## 留底架构债(明确标注, 后续 sprint 处理)
1. **_exec 归位架构债**: 36 个 _execXxx (L13381-L14000, 620 行) 留 src/core/claude_ai.js / 实际 v181 段 M, 违反 (a) 原则按写口归 chain. **5 batch sprint** (经济 6 / 外交 14 / 军事 9 / 政治 2 / 武将 5, 武将 batch 含 D-064)
2. **30 D 类位置文档化** (武将链, phase3_summary §九 + p3.12_notes §五): 武将链 5 batch sprint 建议
3. **squad class 6 函数 + GEN_MAP let region** (~85 行, 桶 2 残余): 等 mechanism/render sprint 或 audit pass 2 衍生 sprint

## How to apply

**新对话启动时**:
1. `git log --oneline -8 main` 校验 HEAD = `5d3233d` (batch-23 D-065 helper push 后)
2. **重构 + dc 整体收官**, 不再做 phase 3 / dc 任何事
3. **D 类 sprint 进行中**: 23 batches 完成
4. **HIGH 进度**: 政治 + 外交 + 事件 + **军事** 全收尾 ✅ / 武将 10 修 9 (剩 D-052) / 价值观 0/1
5. **剩余 2 HIGH 全 followup 复杂类 (claude.ai 决策方向 + batch 顺序已定)**:
   - **batch-24 D-052** 抽 _calcLoyaltyDelta 共享 helper (复杂 cascading, 复用 batch-23 trial helper 模式)
   - **batch-25 D-121** Claude AI ethos 三层暴露 (getGameState 加 ethos N×1 + prompt 简略 + _execEnthrone mandate gate)
6. **verification harness** (claude.ai 决策): 不要 jsdom 全游戏跑, 用函数级 spy + invariant checker. D-052/D-065 都用这套
7. **lifecycle simulate 模式 (batch-21 verified)**: 复杂 freeze/lifecycle batch 用 jsdom + force 触发 + 多旬 invariant assert (tests/batch21_simulate.js 模板). 比 smoke layer-2 更彻底, batch-22-25 可复用
8. 也可改向: phase 4 (渲染层第二轮, 桶 3 ~10670 行) / _exec 归位架构债 sprint (batch-19.1+batch-22 已消化外交 3/14)
9. **invariant checker 维护**: 新增 status='enemy'/'ally'/城市易主写口时, 更新 tests/checkers/faction_event_invariant.js EXPECTED_CALLERS 表
10. **任何 sprint batch 启动必读** `docs/refactor_workflow_principles.md` (9 原则 + sprint gate 语义节, 尤其 #12 #13 #14 + §十一)
11. **codex review workflow** (batch-3-21 verified): 见 feedback_codex_review_workflow.md. batch-21 trial 1-3 NEEDS-WORK (catch 4 latent bugs) → trial 4 LGTM, 复杂 freeze 类多轮 review 是常态
12. **streamline 模式** (batch-7-10 trial 1 verified): 连续简单 batch 累积 commit 留 local, 集中 codex review, user 集中验收 + 一次性 push. 见 feedback_sprint_streamline_batches.md
13. **设计反转 case** (batch-21): 制作人 insight 优先级 > claude.ai 决策方向. 反转后 user 回 Claude.ai 同步 → CC 等同步完再实装. scope 可能从"1 行数值"扩到"10 处 mini-mechanism", 重新 mini scout
14. push 决策权属制作人 (feedback_push_authorization.md), 等明确判定再 push
