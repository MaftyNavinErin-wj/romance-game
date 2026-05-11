---
name: 战斗机制 systematic bug fix sprint — 批 1 close + 2026-05-11 audit pass 2 S1
description: 批 1 close §5.1 + §5.2 (2026-05-11). 同日 audit pass 2 S1 扫 city.fac + 武将状态 stale state 模式: 1 真 bug 候选 §5.3 (battle_anim L2278 isPlayer 同 §5.1 模式漏改) + §5.4 verified-with-notes 集合. S2 候选: city.prefect/garrison/billetPool 同模式
type: project
---

## 2026-05-11 audit pass 2 S1 (2 字段: city.fac + 武将状态)

**S1 收益**:
- **§5.3 真 bug 候选 P2** (sprint_followup): `battle_anim.js:2278` virtualGarrison 守军飘字 `isPlayer = (city.fac === G.playerFac)` 跟 §5.1 同函数同模式漏改. 玩家被攻陷时飘字色错 (敌方红 而非玩家绿). Fix 1 行: `isPlayer = (report.defFac === G.playerFac)`. 留下次 sprint
- **§5.4 verified-with-notes 集合** (sprint_followup): 4 个 city.* read 站 (battle_anim L2013/2255 + battle_modals L707/1359) 技术 stale 但实际无害 (设计意图 / 战前 confirm / 不依赖 mutate 字段)
- **武将状态 (字段 2) audit**: `gen.facId` 不存在 (G.generals 数组 + GEN_MAP 静态 helper); killGen/poachGen/surrenderGen 是数组 splice 但 GEN_MAP 永远可读 → robust by design, 无 stale state 风险

**S1 审计教训**:
- §5.1 fix 漏了同函数另一处 (L2278) 同模式 read — 单点 fix 时应 grep 同函数全字段 read 站避免漏
- city.* mutation 集中 3 处 (military.js:5967 / gentry.js:588 / event.js:241), 但 mutation 同时**附带** mutate 6 字段 (city.prefect/garrison/siegeDecay/billetPool/occupied/_supplyRestoreTurns/_yibingBuff) — S2 扫这些字段同模式

## 2026-05-11 audit pass 2 S2 (6 字段: city.{prefect,garrison,billetPool,siegeDecay,morale,occupied})

**S2 收益**:
- **0 新真 bug 候选** — 全 anim/UI 路径 robust by design
- §5.5 sprint_followup 入: 6 字段 audit 表 + 架构观察 (战斗 anim 战后只读 city.fac + city.garrison, 战报 modal 全读 report.* 不读 live city.*, confirm modal 战前弹安全, panel/tooltip 按需读不依赖事前快照)
- 证实 §5.1 + §5.3 是孤立同函数 stale state, **不是系统性架构缺陷**
- 后续 fix §5.3 时**不需要扩大 scope** 到其他字段

**S2 架构观察 (沉淀)**:
- v175 战报 modal `showNextBattleReport` 用 `r.*` (report 字段) 是关键设计 — 战后唯一安全来源
- confirm modal 是战前弹 → city.* 还没 mutate
- panel/tooltip 按需读 (玩家点开看时), city 已变是正确表现 (上下文是"当前"非"事前快照")
- 真 stale state 风险只在 **fire-and-forget anim drain** 期间 (battle_anim 同函数同模式漏 — §5.1 + §5.3)

**S3 audit 候选** (后续 session):
- squad.troops / squad.morale 战中 mutate + battle_anim 战后 phantom 多处读
- unit.fac / unit.status (squad 转隶 / unit 解散后 anim 路径)
- _pendingBattleAnimations push city/unit 引用 vs snapshot 的架构债通用模式
- _battleReports 内 report 字段全集 audit (是 anim/modal 唯一安全来源, 应核字段完整性)

---

## 批 1 收尾 (2026-05-11)

**§5.1 P1 close** ✅ — AI 攻玩家城无攻城动画 (commit 91680d5):
- **真 root cause**: virtualGarrison.fac 用 stale `city.fac` (战胜后已变 atkFac), shouldSkip 误判 'AI vs AI no player'
- **修法**: virtualGarrison.fac = report.defFac (战前守方 fac, resolveBattle L6852 set, 不受 city.fac mutation 影响)
- **教训**:
  - **D-anim-1 race lock 推断错** — boolean lock + promise share 都不是 root cause (race 理论存在但实测无关)
  - 没 user F12 console log 实测前纯静态分析推断 root cause **两次错推**
  - 战斗机制 sprint 必须 user 协作 reproduce + 复制 console log 才能定位真 bug
- **stale state 模式** (audit pass 2 候选): city.fac 在攻城胜利后改成 atkFac, 全 anim/UI 路径凡依赖原 fac 的应用 report 字段 (battle_anim 4 类 anim 全核)

**§5.2 P2 close** ✅ — AI 不扎营 (commit 60a1f97):
- **root cause**: _aiChooseDefensePosture 优先级 halt > ambush > camp(fallback), 50 旬 smoke AI 扎营 0 次 (设计副作用非 bug)
- **user-approved 修法**: halt check 之后, ambush 评估前, 加 camp boost 评估 — 加 +10% DEF 能过 threshold + 资源够 → 优先扎营
- **架构鲁棒性**: 双降级处理 — 陆逊 huoying_def (camp DEF =1.00) + 攻方 INT 优势 raid 模式 (intDiff>10) → _campDEFMult=1.00
- **codex 4 trials catch**: trial 1 漏陆逊 → trial 2 boolean lock 误 → trial 3 漏 raid 模式 → trial 4 LGTM

## 批 1 工作流沉淀

- **debug log batch 模式**: bug 静态推断不出真 root cause 时, 加 console.log batch 让 user F12 复现, 收集 console 输出 → 定位 root cause → 真 fix → cleanup log batch
- **战斗机制 sprint 节奏**: 单 fix → user 实机测 → 出问题 amend OR 加 debug log → 下一 batch
- **codex review 重要性**: 战斗机制 sprint 4 trials catch 多个 P2 (AI 模式 / save 兼容 / race / 边界), 单 trial 不够

## 批 1 后续候选 (留下次)

- audit pass 2: 全 anim/UI 路径核 stale state (city.fac / city.prefect / 等战后 mutate 字段)
- AI 玩游戏自然观察 D-camp-1 fix 后是否真扎营 + 营寨战 anim 是否触发
- §5.3+: 自然玩到的新战斗 bug

---

(以下为初始 sprint 启动期 context, 2026-05-09 沉淀)


**事实**:phase 4 sub-session 4.9 (battle_modals 抽离) 实机测后,制作人留下 insight:
> "整个战斗机制是重要环节,估计还有很多 bug 和需要细化的。但目前从重构角度看应该 ok,后面的 bug 是后面再系统性修了"

**Why**:
- 4.9 verbatim 抽离 ≠ 战斗机制设计正确性。重构期硬规则不修 D 类 / 不改逻辑,只搬运。
- 实机测 7/8 场景 PASS 是 **抽离动作正确**(modal callback 调通 + 双方阵容 + 战报 + 俘虏处置 等流程没断),不代表战斗 **mechanism** 各路径都符合设计意图。
- 已知 candidate(4.9 + 4.10 实机测过程沉淀,详见 docs/sprint_followup.md §五):
  - **§5.1 AI 攻玩家城无攻城动画** (P1, 4.10 实机测 catch):下回合开始,玩家城被 AI 攻陷,**无攻城动画直接弹战报**。pre-existing v181 bug, **非 4.10 regression**(code-level diff verify byte-identical)。怀疑路径:tick.js:626 fire-and-forget 不 await + battle_anim.js:165 shouldSkip _battleAnimating 检查。3 个候选 fix 方向已记 sprint_followup。
  - **§5.2 AI 不扎营** (P2, 4.9 + 4.10 都遇到):4.9 ② 营寨战 confirm + 4.10 ② 营寨动画 都因 AI 不扎营无法触发实机测,scope 跳过。AI 行为缺失候选,影响营寨/夜袭整条 confirm + anim 链的实战覆盖率。
- 战斗 mechanism 涉及多个 chain 跨文件协作(military.js + general.js 单挑 + render/battle_modals.js modal 链 + render/battle_anim.js 动画时序),audit pass 1 时按链做的 D 类清单可能不覆盖战斗整体行为级 bug。

**How to apply**:
- 重构期(phase 4 + 4.10 + 后续 phase 5/收尾)**不处理** mechanism bug。继承 CLAUDE.md 硬规则 #2 + 本 memory。
- 重构完整收官(phase 4 4.10 PASS + 4.10 边界决策落地)后,可启动 **战斗机制 systematic bug/细化 sprint**:
  - 起点候选:把 4.9 跳过的"AI 不扎营"作为第一个 trace
  - 配套 audit pass 2 candidate 沉淀的战斗相关项(如 batch-22 §3.2.1 day-1 部曲 type vs squad type 不一致 / batch-23 普通武将基础挖角率接近上限,虽不是战斗但是同沉淀)
  - 走 sprint workflow(scout-before-extract + codex review + 实机测,跟 HIGH sprint 模式一致)
- 启动新 sprint 前,制作人会 approve 范围 + 策略,CC 不擅自启动。
- 不当场 fix 任何战斗 bug(包括 4.10 中可能发现的)→ 记录到 sprint_followup.md 待 sprint 启动时统一处理。
