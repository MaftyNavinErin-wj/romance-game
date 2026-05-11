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

## 2026-05-11 audit pass 2 S3 partial (squad.troops/morale + unit.fac/status)

**S3p 收益**:
- **0 新真 bug 候选** + 关键架构发现
- §5.6 sprint_followup 入: 字段表 + squad.troops 设计意图模糊 P3 候选 (留 user 实机测判定 phantom 数字是战前/战后)
- 关键架构沉淀:
  - **unit.fac immutable** — 部队无阵营切换机制 (投降是 G.generals splice + 武将进新 fac, 不动 unit)
  - battle_anim phantom 是 **cache 引用** 而非 G.units live state — anim 期间 G.units 删除/修改不影响 phantom 显示
  - 战斗机制 anim/modal **唯一 stale state pattern**: city.fac 这种 **in-place 字段 mutate** (而非引用层面替换)
  - §5.1 + §5.3 是 city.fac in-place mutate 的孤立同函数漏 — 整体架构 robust by design

**累计 audit pass 2 S1+S2+S3p 结论 (沉淀)**:
- 真 bug 候选 1 个 (§5.3 P2, 1 行 fix, 跟 §5.1 同模式)
- verified-with-notes 集合 4 个 (§5.4)
- 6 字段 robust by design (§5.5)
- squad.troops 设计意图模糊 1 个 P3 (§5.6, 需 user 实机测)
- 架构层面: 战斗机制 anim/modal 整体 robust, stale state 风险只在 city.fac in-place mutate

## 2026-05-11 audit pass 2 S4 (8 fire-and-forget queue + report 字段完整性)

**S4 收益**:
- 全 8 个 fire-and-forget queue 同模式扫: `_pendingBattleAnimations` 是**唯一 stale state 模式源**, 其他 7 queue robust
- §5.7 sprint_followup 入: queue 全表 + report 字段完整性 audit + 1 个 P3 防御性 fix 候选
- 1 P4 候选 (_pendingBattleConfirms 跨 confirm wipe, 场景罕见)
- 1 P3 候选 (resolveBattle 内部 default set atkFac/defFac, 防 future caller 漏补)

**S4 关键架构发现 (沉淀)**:
- 全 queue 中**唯一 stale state 模式源 = _pendingBattleAnimations** (push city/unit 引用 + drain 时 city.fac 已 mutate)
- 其他 7 queue 全 robust:
  - _battleReports / _currentBattle* — r.* read robust
  - _pendingSiegeArrival — ID-only push + live state read + 4 防御 guard
  - _pendingPeaceOffer / _pendingVassalOffer — UI 按需读
- §5.1 + §5.3 是该唯一 queue 模式的两个孤立同函数漏点 — **整体战斗机制架构 robust by design**

**resolveBattle 字段缺漏** (P3 候选):
- resolveBattle 不内部 set atkFac/defFac (由 caller 补 set, 7 callers 全 verified)
- 风险: 未来加新 caller 时若漏补 → silent stale state bug
- 修法 P3: resolveBattle return 时内部 default `report.atkFac = attackers[0]?.fac; report.defFac = defenders[0]?.fac;`, caller 仍可 override

**累计 audit pass 2 S1+S2+S3p+S4 完结 (2026-05-11)**:
- 真 bug 候选 1 个 (§5.3 P2, 1 行 fix)
- P3 防御性 fix 候选 1 个 (§5.7 resolveBattle 内部 default set fac)
- P3 设计意图模糊 1 个 (§5.6 squad.troops, 需 user 实机测)
- P4 跨 confirm wipe 1 个 (§5.7 _pendingBattleConfirms, 场景罕见)
- verified-with-notes 4 (§5.4)
- robust by design 字段 6+5 (§5.5+§5.6)
- 8 queue 全表 (§5.7)
- 战斗机制 anim/modal 整体架构 robust, 唯一 stale state 模式源已锁定

## 2026-05-11 §5.7 P3 防御性 fix 实装 (commit 1be7ff9)

**fix**: resolveBattle return 内部 default set `atkFac: attackers[0]?.fac, defFac: defenders[0]?.fac`

**性质**: future-proof 防御 fix, 7 caller 行为不变 (caller override 仍 work, smoke fix vs no-fix byte-identical 51 snapshots)

**意义**: §5.1 (defensive at site) + §5.7 (defensive at source) 两层防御组合
- §5.1 fix anim 端读 stale city.fac → 改读 report.defFac
- §5.7 source 端补 default 字段 → 防 future caller 漏补 silent stale bug

**workflow streamline**: codex trial 1 LGTM, sprint_verify entry + smoke byte-identical 守底, 无 user 实机测 (纯防御性现有 caller 行为不变)

## 2026-05-11 audit pass 2 S5 (跨 chain 8 queue, 累计 16 queue 总表)

**S5 收益**:
- 跨 chain 全 G._pending* + G._*Queue 扫 (event/diplo/general/diplo/military/politics)
- **跨 chain queue 全 robust by design** — 模式有三类:
  1. **ID-only push** (string/number/ID, 无 live state 引用)
  2. **modal 阻塞 nextTurn** (state 不能 mutate)
  3. **drain 时显式重新验证 (跨 tick 防御)** — 如 event.js:440 `_popEventQueue` 重验 city.fac, 跟 §5.1 同模式正确写法
- §5.8 sprint_followup 入: 跨 chain 8 queue + 累计 16 queue 总表 + 三类 robust 模式

**S5 关键架构沉淀**:
- 累计 16 queue 中 **15 robust + 1 stale 模式源 (_pendingBattleAnimations)** — 战斗机制 anim 是唯一例外
- _pendingBattleAnimations push 引用 + drain 不阻塞 nextTurn + 无 drain 时显式重验 → §5.1+§5.3 漏点
- **修法启示**: 学跨 chain 模式 3, 给 _pendingBattleAnimations drain 时加 stale state 防御 (P6 架构层 fix 候选, 但 §5.1/§5.3 单点 fix 已足以)

**累计 audit pass 2 S1+S2+S3p+S4+S5 完结 (2026-05-11)**:
- 真 bug 候选 1 个 (§5.3 P2, 1 行 fix)
- P3 防御性 fix 候选 1 个 (§5.7 resolveBattle 内部 default set fac)
- P3 设计意图模糊 1 个 (§5.6 squad.troops, 需 user 实测)
- P4 跨 confirm wipe 1 个 (§5.7 _pendingBattleConfirms, 罕见)
- P6 架构层 1 个 (§5.8 _pendingBattleAnimations drain 防御, 可选 — §5.1/§5.3 单点已足)
- verified-with-notes 4 (§5.4) + robust 字段 11 (§5.5+§5.6) + 16 queue 总表 (§5.7+§5.8)
- 整体战斗机制架构 robust by design, 唯一 stale 源已锁定且模式已抽象 (3 类跨 chain robust 模式)

## 2026-05-11 §5.10 P2 真 bug fix close (commit 76f6f18, 方案 A robust)

**fix**: _battleSnap 扩 troops snapshot + makePhantom 接 presetTroops 参数

**user 选 robust 方案 A** (相对于 B 方案 phantom 创建后 swap 旗帜):
- 跨 anim 类型一致原则: phantom 旗帜永远显示战前 troops (snapshot-based)
- Phase 4 wipe 判定仍读 live (战后) — 设计意图正确
- 防 future caller 引入新 anim 类型触发同 stale state bug

**改动面 (15 处)**:
- battle_anim.js makePhantom + makeShipPhantom signature 加 presetTroops 参数, 内部优先读 presetTroops, fallback live (向后兼容)
- 14 处 posSnap 创建加 troops 字段: getUnitTroops(u)
  - battle_modals.js 6 处 (_ambushPosSnap/_campPosSnap/_siegePosSnap×3/_sortiePosSnap/_battlePosSnap)
  - military.js 6 处 (_siegePosSnap×2/_campSnap×2/_ambushPosSnap/_engagePosSnap)
  - tick.js 1 处 (_siegePosSnap rebel)
  - battle_anim.js 1 处 (_siegeArrivalChoice _siegePosSnap, codex trial 1 P2 catch)
- 6 处 makePhantom call 传 posSnap?.[unit.id]?.troops
- battle_modals.js 1314/1315 default fallback 也加 troops (defensive)

**workflow streamline**:
- codex trial 1 NEEDS-WORK P2: catch _siegeArrivalChoice 漏 (我 grep `{hq: u.hq, hr: u.hr}` 漏了 battle_anim.js)
- trial 2 LGTM
- sprint_verify D-§5.10-phantom-snap PASS + smoke byte-identical 守底
- 26/26 sprint_verify all PASS

**§5.1 + §5.7 + §5.10 三层 stale state 防御组合** (沉淀):
- §5.1 anim 端 read snap 字段而非 live state (defensive at site)
- §5.7 source 端 resolveBattle default set atkFac/defFac (defensive at source)
- §5.10 snap 端含 troops (snapshot 字段扩展)

**留 user 实机测**:
- Test A: 单挑野战 — phantom 应"战前到碰撞, 碰撞后变战后"
- Test B: 攻城战 / Test C: 营寨战 / Test D: 伏击战 / Test E: 水战 — phantom 战前

---

## 2026-05-11 user 实机反馈 — §5.10 phantom 真 bug + Test 2 模拟上线

**user 实机测 4 项反馈**:
1. **Test 1 PASS** ✅ — §5.1 fix 自然验证通过 (AI 攻陷玩家城有完整动画)
2. **Test 2** — user 觉得 50 旬等 AI 扎营太难, 我做了 runtime 模拟替代
3. **Test 3** — user 看飘字"都是红字", 视觉影响小 (§5.3 P2 → P3)
4. **Test 4 真 bug 锁定** — user 实机判定 phantom 旗帜兵力时序错: 应战前到碰撞,碰撞后才战后; 现象单挑后突跳战后

**§5.10 phantom 旗帜兵力 stale state P2 真 bug** (sprint_followup §5.10):
- 时序: 单挑动画 (squad.troops 战前) → resolveBattle mutate (战后) → collision anim 创建 phantom 读 live state (战后) → 视觉跳变
- Root cause: makePhantom L420 `getUnitTroops(unit)` 读 mutate 后 squad.troops, 应读 snapshot
- 修法 A 推荐: `_battlePosSnap` 扩 `_battleSnap` 含 troops snapshot, makePhantom 接 presetTroops 参数
- 跟 §5.1 fix 同模式 (defensive at site, 用 snap 字段而非 live state)
- §5.6 P3 audit 模糊 → §5.10 P2 真 bug (user 实机判定锁定)

**§5.3 P 级降级** (sprint_followup §5.3 update):
- spawnLossText 玩家方=米填红描, 敌方=红填米描 (两种都偏红)
- user 视觉看"都是红字"难区分 → 视觉影响 P3
- code 层 stale 仍是 bug, fix 1 行同 §5.1 模式
- P 级 P2 → P3

**Test 2 D-camp-1-runtime sprint_verify 上线** (tests/sprint_verify.js):
- Mock: wei AI unit + 邻 hex 50000 兵 shu 关羽 threat (避陆逊 + 避 raid INT 差)
- 调 `_aiChooseDefensePosture(aiUnit, 'wei', [threatUnit])` → 返 'camp' ✅
- 替代 user 50 旬实机等扎营
- 价值: regression 防御 + 自动化 (memory 战斗机制 fix 必须 user 实机测的例外: D-camp-1 mock state 可自动化)

**user 实机测教训沉淀**:
- 实机测发现新真 bug (§5.10) — audit 静态 (squad.troops 设计意图模糊) 不够, user 实测才能定时序问题
- 部分 fix 可 runtime mock 替代 user 实测 (D-camp-1), 部分必须 user 实测 (anim 视觉时序如 §5.10 root cause)
- §5.6 升级 §5.10 教训: audit 模糊 P3 候选, 应优先 user 实测以确认 / 锁定

---

## 2026-05-11 audit pass 2 S6 — 全 src/ 异步路径终极审计

**S6 范围**:全 src/ setTimeout (75) + Promise (31) + async/await (~30) 异步路径扫

**S6 关键发现**:
- 75 setTimeout 全 robust by design (modal 链 idempotent + tick try/catch + state 阻塞 mid-modal)
- 31 Promise 只 1 prod fire-and-forget: **`_drainPendingBattleAnimations()` (tick.js:632)** — §5.1+§5.3 入口路径
- 其他 async 全 await chain 或 modal callback (state 阻塞)

**S6 终极结论 (整 src/ 异步审计)**:
- 16 queue 中唯一 stale 模式源: _pendingBattleAnimations (S4 锁定)
- 全 src/ Promise 中唯一 prod fire-and-forget: tick.js:632 (S6 锁定)
- 两个独立维度 (queue 模式 + Promise 模式) 都指向**同一来源**: _pendingBattleAnimations queue + _drainPendingBattleAnimations() drainer
- §5.1+§5.3 是该唯一来源的孤立同函数漏点
- **整体战斗机制 + 全 src/ 异步路径 robust by design**

**S7 audit 候选 (后续, 设计层面)**:
- _drainPendingBattleAnimations 改 await 设计 vs drain 时显式重新验证 (S5 模式 3 借鉴)
- await 模式破坏 v175 fire-and-forget 设计意图, 需设计层 approve

**累计 audit pass 2 S1-S6 完结 (2026-05-11)**:
- 真 bug 候选 1 (§5.3 P2)
- P3 防御性 fix 已 close: §5.7 (commit 1be7ff9)
- P3 设计意图模糊 1 (§5.6 squad.troops, 需 user 实测)
- P4 跨 confirm wipe 1 (§5.7)
- P6 架构层 1 (§5.8)
- 设计层 1 (§5.9 _drainPendingBattleAnimations 模式)
- verified-with-notes 4 + robust 字段 11 + 16 queue 总表 + 异步终极审计 (75 setTimeout / 31 Promise / 1 唯一 fire-and-forget Promise)
- **整体战斗机制 + 全 src/ 异步路径 stale state 风险已系统性证明 robust by design**, §5.1+§5.3 是孤立漏点

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
