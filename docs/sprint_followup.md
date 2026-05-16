# Sprint Followup — D 类 sprint 期间沉淀的待办 / 经验

> 本文档收录 D 类 sprint 期间发现但**不当场处理**的事项(CLAUDE.md 反模式 #3 / 正模式 #4),以及 sprint 工作流 trial 经验。
> sprint 末或 audit pass 2 时统一回看处理。

---

## 一、DP-3 验证机制 trial 经验

### Trial 1(2026-05-06,batch-1a):D-021 + D-077 字段名修复

**fix 类型**:字段名错配(`reinforcePolicy` → `policyId`),1 行修改,跨链 close 双 D 类

**验证组合(成功)**:
1. **smoke byte-identical 守底**:51 snapshots PASS,确认无副作用
2. **grep 全 repo 0 残留**:确认旧字段名彻底清除
3. **读写端字段名对齐**:写端(`v181.html:13986`)= 读端(`src/chains/military.js:6931`)

**结论**:
- ✅ 这套三重验证**适合"字段名/路径错配"类 D**(D-021/D-077/D-091 等命名/路径不一致 bug)
- ❌ **不适合算法回路类 D**(如 D-052 calcLoyaltyDelta vs processLoyalty 双向不一致):算法回路改动会改 baseline,smoke byte-identical 不再守底,需要新机制(届时再调整,不 over-engineer)

**沉淀原则**:**验证模式按 D 类性质分类,sprint 期间逐 batch 调整,不预设 universal scheme**。

---

## 二、smoke 覆盖盲区(已知,不立即处理)

### 盲区 1:AI 路径外 D 类

**发现 batch**:batch-1a(D-021/D-077)

**症状**:50 turn smoke 模拟期间,AI 未触发 `_execSetReinforcePolicy` 派发路径(`tests/current.json` 全程 `policyId="bal"` 初始默认值)。fix 改的是该路径写入字段名,smoke byte-identical PASS 无法直接证明 fix 生效。

**当前缓解**:代码 review(写端/读端字段名对齐)+ 后续 audit pass 2 兜底。

**待处理(sprint 末或 audit pass 2)**:
- 选项 A:扩 smoke layer-3,专测 AI 派发路径覆盖率(列出 11 个 `_execXxx` 命中次数)
- 选项 B:抽样手测 AI 路径(每 sprint 末挑 3-5 个 fix 实玩验证)
- 选项 C:fix-specific 单测(仅极少数复杂 fix)

**不立即处理理由**:trial 1 一例不足以判定哪个选项最优,等 sprint 累积 5-10 例 AI 路径外 fix 后回看选型。

---

## 三、sprint 期间发现的非范围内事项

### 3.1 batch-2 followup(2026-05-06,scout v0.3 codex review 后)

**发现 batch**:batch-2 D-099 prompt 缺指令(scout v0.3 codex review 范围缩减后产生)

#### 3.1.1 `cancel_supply` dead code 清理

**位置**:`project_romance_v181.html:13455-13459` `_execCancelSupply` + `src/core/claude_ai.js:1445` dispatcher case

**症状**:函数体 `console.warn('[ClaudeAI] cancel_supply: 当前未实装')` + `return false`(v159fix 注释明确)。dispatcher case 仍在,但 prompt 不暴露。Checker 1 报 `case_no_prompt` HIGH 1 项。

**Followup batch**:独立"死代码清理 batch"(范围:删 dispatcher case + dead `_exec` 函数 + 文档死代码记录)

**verdict**:架构债,不属于 sprint 修复目标(本来就不该实装),清理后 checker 1 finding 自然减 1。

**Status (2026-05-07)**:✅ batch-22 closes via deletion(合并 D-020 一起删 dispatcher + 函数体)。Checker 1 `case_no_prompt` HIGH 从 1 → 0。

#### 3.1.2 D-091 HIGH 修复(附庸 3 helper 签名错配)

**位置**:`src/chains/diplomacy.js`:
- `:1501` `playerReleaseVassal(other)` 单参 + `const fid = G.playerFac` 硬编
- `:1555` `diploDemandVassal(other)` 同模式
- `:1592` `diploSubmitVassal(other)` 同模式

**症状**:`_exec*` 包装器用 `(fid, target)` 双参调用,但 helper 签名单参,JS 静默忽略第二参 → Claude AI 触发后 helper 用 `G.playerFac` 当 fid → **写错主体**。

**Followup batch**:**batch-3 D-091 HIGH 修法**(独立)
- 范围:改 helper 签名 `(other)` → `(fid, other)` + 找所有 caller(玩家路径 + Claude AI 路径)+ 多入口一致性验证
- 模式归类:**模式 8 多入口一致性类**(团队 + codex 共识)
- 工程量:中等(改 helper + 玩家 caller 校准 + Claude AI caller 校准)
- 验证:smoke + checker 1(3 个 case_no_prompt 清零)+ 实玩(玩家附庸入口) + 代码 review

**触发依据**:`docs/cross_chain_d_list_v1_0.md:88` audit pass 1 已标 D-091 HIGH;`docs/audit_walkthroughs/diplomatic_chain_walkthrough.md` §阶段 1.1 详述。

**优先级**:**P0**(audit pass 1 HIGH,batch-2 暴露其活跃风险)

#### 3.1.3 L567 战术 prompt 历史 8 个其他缺漏

**位置**:`src/core/claude_ai.js:567-588` `_tacticalSystemPrompt`

**症状**:战术 prompt 22 type vs dispatcher 37 case,缺 15 个。本 batch-2 同步 3 个 AI-safe,剩 12 个未补(其中 4 个是 cancel_supply + 附庸 3 已有 followup,另 8 个是 historic 缺漏:`cancel_special` / `billet` / `set_reinforce_policy` / `break_alliance` / `scheme_drive_wolf` / `scheme_two_tigers` / `scheme_rumor` / `enthrone`)。

**Status (2026-05-07)**:batch-22 删除 `billet` dispatcher+prompt+`_execBillet` → 8 个剩 7 个(`cancel_special` / `set_reinforce_policy` / `break_alliance` / `scheme_drive_wolf` / `scheme_two_tigers` / `scheme_rumor` / `enthrone`)。

**影响**:战略 mode Claude 知道这 8 个,战术 mode Claude 不知道,行为不对称。

**Followup batch**:独立"L567 战术 prompt 全对齐 dispatcher batch"
- 范围:补 8 行 prompt,与 L1085 同步
- 验证:smoke + 战术 prompt 完整性 grep 验证

**优先级**:P2(行为不对称但非主要 sprint 路径)

#### 3.1.4 Checker 1 双 prompt 不一致检测增强

**位置**:`tests/checkers/exec_dispatch_audit.js` `collectPromptTypes`(在 sprint/checker-framework 分支)

**症状**:当前 `promptTypeSet` 是两个 prompt 的**并集**(扫整个 claude_ai.js),只要主 prompt 提到该 type 就视为已声明,**遗漏** L567 战术 prompt 单独缺漏。

**Followup enhancement**:扩展 `collectPromptTypes` 区分两个 prompt(`_claudeSystemPrompt` 函数体 vs `_tacticalSystemPrompt` 函数体),分别报告
- finding 类型新增:`prompt_block_drift` 或 `per_prompt_case_no_prompt`
- 集成进 sprint/checker-framework 分支(独立 commit)

**优先级**:P2(checker 增强,服务 followup 3.1.3)

---

### 3.2 batch-22 followup(2026-05-07,实机测发现)

**发现 batch**:batch-22 D-020 + D-099 cancel_supply closes via deletion(玩家测 `_confirmBillet` 路径时顺手发现)

#### 3.2.1 day-1 武将部曲 type vs 初始 squad type 一致性检查(audit pass 2 candidate)

**位置**:`src/data/constants.js:99` (`RETAINER_DEFAULTS`) ↔ 初始 `G.units` squad `type`

**症状**:蜀国开局关羽部队 squad.type = `'light'`(轻步,符合 apt `light:'S'`),但 RETAINER_DEFAULTS 设 `'关羽':{count:1500,type:'heavy'}`。`_confirmBillet` (v181.html:10590) billet 后 pool 拆双条目:
- 部曲条目 `type = getRetainerType(genName) || sq.type` → `'heavy'`(constants 锁)
- 辅兵条目 `type = sq.type` → `'light'`(squad 当前)

两套数据 day-1 就不一致。

**预期**:武将 day-1 有部曲时,部曲 type === 该武将所在初始队 squad type(完全一致)。

**Audit pass 2 任务**:
1. 列出所有 RETAINER_DEFAULTS 有 entry 的武将(`src/data/constants.js`)
2. 对比初始 G.units 中该武将所在 squad 的 type
3. 不一致的逐个判定 fix 方向:
   - constants type 错(应改) → 改 RETAINER_DEFAULTS
   - 初始编队错(应改) → 改 initial state.js
   - 还是设计意图(部曲 = 独立特种部曲) → 文档化 + 改 `_confirmBillet` 不拆双条目

**严禁**:重构 / sprint mechanical 期主动修改;留 audit pass 2 / sprint MEDIUM 阶段。

**示例已知**:
- 关羽:apt `light:'S'` → squad.type=`'light'`,部曲 constants type=`'heavy'` ❌ 不一致(疑似 constants 错)
- 刘备 / 张飞 / 等其他 day-1 有部曲武将待 check

**优先级**:P2(audit pass 2 candidate,不阻塞 sprint;非 HIGH/exploit 类,只是数据语义不一致)

---

## 四、Walkthrough 缺失(2026-05-06)

**发现 batch**:batch-1a 启动 mini scout(D-095/D-122)

**症状**:`find . -name "*walkthrough*" -o -name "*chain_v*.json"` 0 hits。HANDOVER 引用的 8 链 walkthrough(`diplomatic_chain_v1_1.json` 等)+ 各链概念图 + chain JSON 全部不在 repo。

**影响**:cross_chain_d_list 仅是 D-XXX 索引(一行描述),具体 bug 位置 / 修法 / 验证标准依赖 walkthrough。下次 session 起每个 D 类 scout 都需要 walkthrough。

**当前状态**:制作人正在从老对话补充 walkthrough,加到 repo 后下次 session 才能继续 D-095/D-122 + 后续 batch。

**临时缓解**:D-021/D-077 因有 cross_chain D 列表 + 代码两面对照 + smoke layer-1 已锁字段名,不依赖 walkthrough,本 batch 不卡。

---

(sprint_followup v1.2 — batch-22 加 §3.2.1 day-1 部曲 type vs squad type 一致性 audit pass 2 candidate + 3.1.1/3.1.3 status 更新)

---

## 五、战斗机制 bug 候选(战斗机制 systematic bug fix sprint, 2026-05-09 phase 4 4.10 实机测沉淀)

**发现 phase**:phase 4 sub-session 4.10 (battle_anim 抽离) 实机测 + 制作人 insight (memory `project_combat_mechanism_bugfix.md`)

**性质**:**pre-existing v181 bug 而非 4.10 regression**(4.10 verbatim 抽离 + smoke vs main byte-identical PASS + codex LGTM,行为应跟 main 完全一致)。但 4.10 实机测期间触发,值得记录。

### §5.1 AI 攻玩家城 (玩家丢城) 无攻城动画 (2026-05-09)

**症状**:下回合开始,玩家城被 AI 攻陷,**无攻城动画直接弹战报**。

**触发场景**:rebel 大乱期 / 普通 AI 攻玩家城 (tick.js:133 `_pendingBattleAnimations.push({kind:'siege', ...})`)

**怀疑路径**:
- tick.js:626 `_drainPendingBattleAnimations()` fire-and-forget 不 await
- battle_anim.js:91 等 `_pendingSiegeArrival === null` 应直接通过 (AI 攻玩家不走 arrival)
- battle_anim.js:165 `shouldSkip` 中 `if(_battleAnimating) return true` 可疑 — 上一场动画 lock 未释放 → 下一场被跳过
- 或 `shouldSkip` fog 检查:`anyVisible` for 城市 hex 应永远 true (玩家自己城) — 这个不应是问题

**P 级**:P1 (用户体验明显缺失,但不阻塞游戏 progression)

**留给 sprint**:战斗机制 systematic bug fix sprint。复现简单 (rebel 期 / 任意玩家被 AI 攻城),debug 容易 (加 console.log 跟踪 _pendingBattleAnimations queue + _battleAnimating lock 状态)。

**候选 fix 方向** (sprint 启动时再设计):
- (a) tick.js:626 改为 `await _drainPendingBattleAnimations()` (但 fire-and-forget 是 v175 设计意图, 改 await 会阻塞 nextTurn 完成)
- (b) `shouldSkip` 内 `_battleAnimating` 检查改为 wait/retry (跟 showNextBattleReport 一样 setTimeout 200ms 重试)
- (c) `_drainPendingBattleAnimations` 内串行 each anim, 起点确认 _battleAnimating=false 再播

### §5.2 AI 不扎营 (4.9 + 4.10 实机测沉淀, 2026-05-08/09)

**症状**:玩家无法看到 AI 扎营 → 营寨战 confirm + camp 动画 (`_playCampBattleAnim`) 无法触发实机测 (4.9 ② / 4.10 ② 跳过)

**性质**:AI 行为缺失候选 (Claude AI 路径 / 传统 AI 路径都不见扎营行为)

**P 级**:P2 (实机测 coverage 缺失, 但游戏可运转)

**留给 sprint**:战斗机制 systematic bug fix sprint 启动 trace #1 (per `docs/memory/project_combat_mechanism_bugfix.md`)

### §5.3 virtualGarrison 守军损失飘字 isPlayer 用 stale city.fac (2026-05-11 audit pass 2 S1)

**症状**:玩家被 AI 攻陷时,virtualGarrison 飘字色应玩家色 (绿) 但变敌方色 (红)

**触发场景**:AI 攻玩家城 + 玩家城无野战驻军 (defenders=[],走 virtualGarrison 路径) + atkWins=true

**Root cause**: `src/render/battle_anim.js:2278` `_playSiegeBattleAnim` Ph4 飘字阶段
```js
if(virtualGarrison && (report.defLost||0) > 0){
  const isPlayer = (city.fac === G.playerFac);  // ⚠️ city.fac 已被 resolveSiegeBattle (military.js:5967) 改成 atkFac
  ...
  const txt = _baCore.spawnLossText(animG, cityCX, startY, report.defLost, isPlayer, invS);
}
```
- 攻方胜利 → city.fac 已 mutate 成 atkFac → 玩家被攻陷时 city.fac !== G.playerFac → isPlayer=false → 飘字色用敌方色

**性质**:**§5.1 真 root cause 同模式** — virtualGarrison.fac (L2021) 已 fix 用 report.defFac, 但同函数 L2278 飘字判断**漏改**

**P 级**:P2 (UI 视觉色错, 不影响 gameplay 流程)

**修法 (1 行 fix, 跟 §5.1 同模式)**:
```js
const isPlayer = (report.defFac === G.playerFac); // §5.1 同模式 fix
```

**留给 sprint**:战斗机制 sprint 批 2 候选 (与 §5.1 同源, 1 行 fix, sprint_verify entry 复用 D-anim-2 模式)

### §5.4 city.* stale state 同函数读其他点 audit (2026-05-11 audit pass 2 S1)

**总览**:S1 扫 `city.fac` 全 13 个 read site (mutation 3 处: military.js:5967 攻城胜利 / gentry.js:588 豪族开城 / event.js:241 大乱),只 §5.3 是真 bug;其他 read 点 verified-with-notes 不修。

**verified-with-notes 清单**(技术上 stale 但实际无害):

| Site | 字段 | 不是 bug 的原因 |
|---|---|---|
| `battle_anim.js:2013` | city.garrison | 注释 L2008-2009 已显式说明:atkWins 走 else 分支用 report.defLost 推算; defWins 走 if 分支 city.garrison 没 mutate |
| `battle_anim.js:2255` | city.fac (defFac→defColor) | defColor 只在 atkWins=false 路径用 (L2260 '退敌' 文字色), 此分支 city.fac 没 mutate |
| `battle_modals.js:707` | city.garrison | _showSiegeDefendConfirm 是**战前**弹窗 (玩家守城 confirm), city.garrison 还没 mutate |
| `battle_modals.js:1359` | G.cities[u._lastSiegeTarget] | 撤退路径只读 city 位置 (q/r), 不读 fac/garrison |

**字段 2 武将状态 mutation pattern audit**:
- `gen.facId` 字段不存在 (武将归属用 G.generals[fid] 数组组织, 通过 getGenFaction helper 解算)
- killGen / poachGen / surrenderGen mutate 是 **G.generals 数组 splice**,但武将基本信息 (name/war/int/cha/role) 在 GEN_MAP 静态数据**永远可读**
- 战后 anim/UI 读武将信息 robust by design (非 stale state 模式)

**S1 audit 范围全收尾 ✅**(2 个字段 city.fac + 武将状态)

**S2 audit 候选 (后续 session)**:
- `city.prefect` stale state read (mutation 同 city.fac 3 处 + general.js 多处)
- `city.garrison` mutation 完整 read site 扫
- `city.billetPool` / `city.siegeDecay` / `city.morale` 同模式
- `_pendingBattleAnimations` 异步 drain 期间的 stale state pattern 通用扫描

### §5.5 S2 audit 收尾 — city.{prefect, garrison, billetPool, siegeDecay, morale, occupied} (2026-05-11)

**S2 范围**:扫 6 个战后 mutate 字段 (跟 city.fac 同 mutation 函数附带 mutate)

**结论**:**0 新真 bug 候选** — 全 anim/UI 路径 robust by design

**字段-by-字段 audit 结果**:

| 字段 | 战后 anim 路径 read 数 | 战后 modal 路径 read 数 | 评估 |
|---|---|---|---|
| `city.prefect` | **0** | 0 (battle_modals 0 read) | robust ✅ panel/tooltip 按需读 = 已变就显示新主, 不是 stale |
| `city.garrison` | 1 (L2013, S1 已 verified-with-notes) | 1 (L707, 战前 confirm) | robust ✅ |
| `city.billetPool` | **0** | 0 | robust ✅ recruit_modals 按需读 |
| `city.siegeDecay` | **0** | 4 (L589/607/630/705, **全战前 confirm**) | robust ✅ confirm 弹时 siegeDecay 还没 reset |
| `city.morale` | **0** | 0 | robust ✅ |
| `city.occupied` | **0** | 0 | robust ✅ |

**架构观察**(写入 memory):
- 战斗 anim 路径 (`battle_anim.js`) 战后**只读 `city.fac` + `city.garrison`**, 6 字段中其余 4 个 0 read
- 战斗 modal (`battle_modals.js`) 战后路径 (`showNextBattleReport`) 全部读 `r.*` (report 字段), 不读 live `city.*`
- confirm modal (`_showSiegeBattleConfirm` / `_showSiegeDefendConfirm`) 是**战前**弹 → city.* 还没 mutate, 安全
- panel/tooltip (`ui_panels.js` / `tooltips.js`) 按需读 → 城已易主显示新主是正确表现 (panel 上下文是"当前", 不是"事前快照")

**S2 价值**:虽然 0 新 bug, 但 audit 证实:
1. §5.1 + §5.3 是孤立同函数 stale state, **不是系统性架构缺陷**
2. 战斗机制 anim/modal 路径整体设计 robust (showNextBattleReport 用 report.* 是 v175 关键设计)
3. 后续 sprint fix §5.3 时**不需要扩大 scope** 到其他字段

**S3 audit 候选 (后续 session)**:
- `squad.troops` / `squad.morale` 战中 mutate (resolveBattle 内) → battle_anim 战后多处读 phantom troops/morale (是设计意图但需核 stale state)
- `unit.fac` / `unit.status` (squad 转隶 / unit 解散后 anim 路径)
- `_pendingBattleAnimations` push 时传 city/unit 引用 vs snapshot 的架构债 (跨 fire-and-forget 异步通用模式)
- `_battleReports` 内 report 自身字段是否完整快照 (report 字段是 anim/modal 唯一安全来源 — 应 audit 字段全集)

### §5.6 S3 partial audit — squad.troops/morale + unit.fac/status (2026-05-11)

**S3p 范围**:扫 squad/unit 战中战后 mutate + battle_anim 路径读

**结论**:**0 新真 bug 候选** + 关键架构发现

**字段-by-字段**:

| 字段 | 战后 anim 路径 read | mutate 模式 | 评估 |
|---|---|---|---|
| `unit.fac` | 14 处 (玩家方判定) | **immutable** (grep 全 src 0 处 mutate) | robust ✅ unit 无阵营切换机制 |
| `unit.status` | **0** (battle_anim 全 grep) | mutate 多处 (battle_modals/military 战后 ambush→halt / siege→halt) | robust ✅ anim 不依赖 |
| `squad.troops` | 2 处 (L420/470 phantom 旗帜数字) | resolveBattle 内多处 mutate (战后扣减) | **设计意图模糊** — 见下 |
| `squad.morale` | 0 处 anim (L1597/1723/1961/2272/2575 是 isPlayer 判定不读 morale) | resolveBattle mutate | robust ✅ |
| `G.units` 删除 | phantom 内部 cache 引用与 live 解耦 | 战后 wiped filter | robust ✅ |

**squad.troops 设计意图模糊 (P3 候选, 需 user 实机测判定)**:
- battle_anim L420/470 phantom 旗帜数字读 `getUnitTroops(unit)` (live 战后值)
- 视觉表达可能是 (a) 战前兵力 (开战时多少人) 或 (b) 战后兵力 (战完剩多少人)
- 如设计意图是 (a) → 应改读 `report.atkTroops`/`defTroops` (military.js:5247 已记录)
- 如设计意图是 (b) → 当前实现正确
- 静态难判,需 user 实机看 phantom 数字判设计意图,**留 P3 候选**

**架构结论 (S3p 关键发现)**:
- unit.fac **immutable** — 部队无阵营切换机制 (投降是 G.generals 数组 splice + 武将进新 fac, 不动 unit)
- battle_anim 内 phantom 是 **cache 引用** 而非 G.units live state — anim 期间 G.units 删除/修改不影响 phantom 显示
- 战斗机制 anim/modal 唯一 stale state pattern: **city.fac 这种 in-place 字段 mutate** (而非引用层面替换)
- §5.1 + §5.3 是 city.fac in-place mutate 的孤立同函数漏 — 整体架构 robust

**S4 audit 候选 (后续 session, P4 优先级)**:
- _battleReports report 字段全集 audit (字段完整性核, 是 anim/modal 唯一安全来源)
- _pendingBattleAnimations 跨 fire-and-forget 异步通用 stale state 模式扫 (其他 fire-and-forget queue 是否同模式)

### §5.7 S4 audit — fire-and-forget queue 全表 + report 字段完整性 (2026-05-11)

**S4 范围**:全 fire-and-forget queue 同模式扫 + resolveBattle/Siege report 字段完整性

**全 queue 表** (8 个):

| Queue | push 时点 | drain 时点 | stale state 评估 |
|---|---|---|---|
| `_pendingBattleAnimations` | resolveBattle 后 | nextTurn 末 (fire-and-forget drain) | **唯一 stale 风险源** (§5.1+§5.3, city.fac in-place) |
| `_battleReports` | resolveBattle 后 | confirm/anim 后弹 modal | robust ✅ 全 r.* read 不读 live |
| `_pendingBattleConfirms` | mid-tick 战斗判定 | nextTurn 末 modal pump | **跨 confirm wipe** P4 风险 (一个 unit 多 confirm 时被前一战 wipe → 后 confirm 显示 0 兵, 场景罕见) |
| `_currentBattleConfirm` | drain 时 set | modal close 时 null | 单值 cursor, 不存 stale |
| `_currentBattleReport` | drain 时 set | modal close 时发放 exp | 单值 cursor, 不存 stale |
| `_pendingSiegeArrival` | unit arrive 时 push (ID-only `{unitId, cityId}`) | nextTurn 末 _checkSiegeArrival | **robust by design** ✅ ID-only + live state read + 4 防御 guard (`!unit / !city / city.fac===unit.fac / unit.status!=='siege'`) |
| `_pendingPeaceOffer` | aiDoDiplo 求和时 set | UI modal 弹时 read | UI 路径, 玩家点开时 modal 显示当前 state — 不是 stale |
| `_pendingVassalOffer` | AI 称臣判定时 set | UI modal 弹时 read | 同上 |

**report 字段完整性 audit**:

resolveSiegeBattle (military.js:5823) **内部 set 完整** ✅:
- type/atkFac/defFac/atkNames/defNames/node/cityName/citySize
- atkWins/defMult/atkTroops/defTroops/atkLost/defLost
- passiveDuel/breakoutReports/annihilated/skillLogs/_atkUnitIds/_defUnitIds/_siegeAftermathCityId

resolveBattle (military.js:4786) **不 set atkFac/defFac/atkNames/defNames** — 由 caller 补 set (7 callers 全 verified ✅):
- L4583/4682: camp battle 内嵌, 包成 camp report (含 atkFac/defFac)
- L5335: naval battle 内嵌, 包成 naval report
- L5917: siege battle 内嵌, 包成 siege report (上面 ✅)
- L6851: 主战场, L6852 caller 补 set ✅
- battle_modals.js:340: ambush abort, L342-343 caller 补 set ✅

**潜在风险 (P3 候选, 防御性架构 fix)**:
- resolveBattle 不内部 set atkFac/defFac → 未来加新 caller 时若漏补, anim/modal 读 undefined → silent stale state bug
- **修法 (P3)**: resolveBattle return 时内部 default `report.atkFac = attackers[0]?.fac; report.defFac = defenders[0]?.fac;`, caller 仍可 override (兼容现有 callers)
- **价值**: 防 future regression, 类似 §5.1 fix 模式 (defensive at source vs defensive at site)

**S4 关键架构发现**:
- 全 fire-and-forget queue 中 **唯一 stale state 模式源**: `_pendingBattleAnimations` (因 push city/unit 引用 + drain 时 city.fac 已 mutate)
- 其他 queue 全 robust (ID-only push / 单值 cursor / UI 按需读 / report.* 字段读 / 防御 guard)
- §5.1 + §5.3 是该 queue 唯一 stale state 模式的两个孤立同函数漏点 — **整体战斗机制架构 robust by design**

**S5 audit 候选 (后续 session, P5 优先级)**:
- 跨 chain fire-and-forget queue 扫 (event/diplo/economy 内是否有同模式 queue)
- 防御性 P3: resolveBattle 内部 default set atkFac/defFac (低 risk fix, 可走 sprint workflow)

### §5.8 S5 audit — 跨 chain fire-and-forget queue (2026-05-11)

**S5 范围**:event/diplo/general/economy/politics chain 全 G._pending* + G._*Queue 扫,看是否有同 _pendingBattleAnimations stale state 模式

**全跨 chain queue 表** (8 个新, 加 S4 8 个 = 16 queue 总表):

| Queue | Chain | push 内容 | drain 防御 | 评估 |
|---|---|---|---|---|
| `G._pendingEvent` | event | evt 引用 (含 ctx.city) | modal 阻塞 nextTurn (tick.js:298) | robust ✅ modal 阻塞 → state 不能 mutate → ctx 准 |
| `G._eventQueue` | event | t 对象 (含 ctx.city 引用) | `_popEventQueue` L440 重新验证 `ctx.city.fac !== G.playerFac` 跨 tick 城市丢失防御 | robust ✅ 同 §5.1 同模式正确防御写法 |
| `G._pendingPrisoners` | general | `{name, capturerFid}` (string + ID) | `showNextPrisonerModal` L1876 `if(!g) shift+next` 武将死亡防御 | robust ✅ ID-only + 防御 guard |
| `G._pendingEnvoyIntel` | diplomacy | `{targetFid, turn}` (ID + number) | tick.js:664 turn-based filter | robust ✅ ID-only |
| `G._pendingSiegeAftermath` | military(via modals) | cityId (string) | tick.js:612 快进路径清理 | robust ✅ ID-only |
| `G._pendingRetreatResult` | battle_modals | retResult 单值对象 (无 live state 引用) | drain 时直接读 | robust ✅ 不含引用 |
| `window._pendingCourtCouncil` | politics | proposal 对象 | tick.js:614 快进路径清理 + UI 阻塞 | robust ✅ |
| `_pendingPeaceOffer` / `_pendingVassalOffer` | diplomacy | 单值 | UI modal 按需读 | robust ✅ (S4 已 verified) |

**关键架构发现 (S5)**:

跨 chain queue **全 robust by design**, 模式有三类:
1. **ID-only push** (string/number/ID, 无 live state 引用): _pendingPrisoners / _pendingEnvoyIntel / _pendingSiegeAftermath / _pendingSiegeArrival (S4)
2. **modal 阻塞 nextTurn**: _pendingEvent / _pendingPeaceOffer / _pendingVassalOffer / _pendingCourtCouncil (modal 不点 OK 游戏暂停, state 不能 mutate)
3. **drain 时显式重新验证 (跨 tick 防御)**: _eventQueue (event.js:440 重验 city.fac), _pendingPrisoners (general 武将死亡 guard), _pendingSiegeArrival (S4 4 防御 guard)

**唯一例外仍是 `_pendingBattleAnimations`**:
- push 引用 (city/unit) — **不是 ID-only**
- drain 期间 nextTurn 仍跑(fire-and-forget, anim 与 nextTurn 不阻塞) → state 可能 mutate
- 无 drain 时显式重新验证 → §5.1 + §5.3 漏点
- **设计原因**: anim 需要 city/unit snap 做视觉, ID-only 不够; 但应学跨 chain 模式 (3) 加 drain 时 stale state 防御

**整体跨 chain robust by design 总结** (累计 16 queue):
- 战斗机制外的 7 chain queue: 全 robust (3 模式覆盖)
- 战斗机制 8 queue: 7 robust + 1 stale 模式源 (_pendingBattleAnimations)
- §5.1 + §5.3 是该模式源的孤立同函数漏点

**S6 audit 候选 (后续 session, P6 优先级 — 架构层面)**:
- _pendingBattleAnimations 加 drain 时显式重新验证 (跨 chain 模式 3 借鉴)
- 通用扫: 还有没有 fire-and-forget 异步路径不在 queue 模式内 (例如 setTimeout / Promise / await chain)

### §5.9 S6 audit — setTimeout / Promise / await chain 全 src/ 异步路径终极审计 (2026-05-11)

**S6 范围**:全 src/ 异步路径扫, 找不在 queue 模式内的 fire-and-forget stale state 风险

**全 src/ 异步统计**:
- **75 setTimeout** (12 文件): battle_anim 18 + battle_modals 27 + tick 11 + boot_screens 3 + 其他 16
- **31 Promise** (5 文件): battle_anim 24 + tick 4 + 其他 3
- **2 .catch** (prod): tick.js:632 + debug.js:651 (debug only)

**setTimeout 分类 (全 robust by design)**:

| 模式 | 例子 | stale 评估 |
|---|---|---|
| Modal 链 trigger | `setTimeout(showNextBattleReport, 200/300)` | robust ✅ idempotent (showNextX 自带 length check + drain shift) |
| Tick.js modal 链 | `setTimeout(()=>{try{showX()}catch...}, ms)` | robust ✅ try/catch 防御 |
| Yield to event loop | `setTimeout(r, 0)` (Promise wrap) | 非 stale (microtask scheduling) |
| Game end overlay 延迟 | `setTimeout(() => showGameEndOverlay, 500)` | 单触发, 无队列 |
| Modal 二次弹窗 | `setTimeout(()=>showSiegeAftermathChoice, 200)` | modal 阻塞 nextTurn, state 不能 mid-modal mutate |

**Promise/async 分类**:
- **anim 内 Promise.all + tween** (24 处): 全 await, 不是 fire-and-forget
- **claude_ai timeout** (`Promise.race` + setTimeout reject): await, robust
- **modal callback async** (confirmBattle / confirmSiegeBattle 等): event handler fire-and-forget 但 internal await chain + state 阻塞 (modal 期间不 nextTurn)
- **tick.js:697 yield Promise**: await 不 fire-and-forget

**关键发现 (S6 终极验证)**:

**全 src/ prod 路径唯一 fire-and-forget Promise**:
```js
// src/core/tick.js:632
_drainPendingBattleAnimations().catch(e => console.error('[drainAnim] fatal:', e));
```

这就是 **§5.1 + §5.3 的入口路径** — push city/unit 引用到 `_pendingBattleAnimations` queue → fire-and-forget drain (tick 不 await) → 期间 nextTurn 跑 → city.fac mutate → drain 时读 stale。

**S6 终极结论 (整 src/ 异步审计)**:
- 16 queue 中唯一 stale 模式源: `_pendingBattleAnimations` (S4 已锁定)
- 75 setTimeout 全 robust by design
- 31 Promise 中只 1 个 prod fire-and-forget = `_drainPendingBattleAnimations()` (tick.js:632, §5.1+§5.3 入口)
- **全 src/ 异步路径 stale state 风险单一来源已锁定**, §5.1+§5.3 是该唯一来源的孤立同函数漏点
- audit pass 2 S1-S6 系统性证明: 战斗机制 + 全 src/ 异步路径整体 **robust by design**

**S7 audit 候选 (后续 session, 设计层面)**:
- _drainPendingBattleAnimations 是否改 await 设计 (跟 S5 模式 3 借鉴: drain 时显式重新验证 city.fac, 而非改 await)
- await 模式会破坏 v175 fire-and-forget 设计意图 (push 后 nextTurn 仍跑), 需设计层 approve

### §5.10 phantom 旗帜兵力 stale state (P2 真 bug, user 实机 2026-05-11 实测判定)

**症状** (user 实测):
> "现在初始状态是战前兵力,然后(单挑后)突然跳成战后兵力,然后两边碰撞,结算为战后兵力。这里我觉得应该在碰撞前仍是战前兵力,碰撞后才变成战后兵力"

**触发场景**: 任意有 activeDuel 的野战 (单挑前奏后碰撞)

**Root cause 锁定** (sprint_followup §5.10 audit):

时序 (battle_modals.js confirmBattle L1318-1332):
1. 玩家点 confirm OK → squad.troops 战前值 (resolveBattle 还没跑)
2. **`await _playDuelPreludeAnim(activeDuel, atkPos, defPos)`** (L1318) — 单挑前奏 anim, 不动原 unit svg, 玩家看到原 unit 旗帜显示**战前兵力** ✅
3. **`_resolveBattleEngagement(...)`** (L1324) — resolveBattle 内 mutate squad.troops **战后值**
4. **`await _playBattleCollisionAnim(...)`** (L1332) — 创建 phantom (battle_anim.js:1019 `makePhantom(unit, pos)`), phantom 旗帜读 `getUnitTroops(unit)` (battle_anim.js:420) **= 战后值**, 同时隐藏原 unit svg (L1035)
5. **玩家看到旗帜数字从战前(原 unit)突跳战后(phantom)** ⚠️ — 即 user 描述的"单挑后突跳战后"

**Stale state 模式**: 跟 §5.1 同模式 — push anim 时 squad.troops 已 mutate, anim 内读 live state 而非 snapshot

**修法 (1-2 处 fix, 跟 §5.1 同模式 defensive at site)**:

方案 A (推荐): `_battlePosSnap` 扩展为 `_battleSnap`, 含 troops snapshot
- battle_modals.js:1294 push snap 时同步存战前 troops:
  ```js
  _battleSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) };
  ```
- makePhantom 接受 troops 参数, caller 从 snap 取战前值传入:
  ```js
  function makePhantom(animG, unit, startPos, invS, presetTroops){
    ...
    const total = (presetTroops != null) ? presetTroops : getUnitTroops(unit);
  }
  ```
- _playBattleCollisionAnim L1019 `makePhantom(unit, pos)` → `makePhantom(unit, pos, snap[unit.id]?.troops)`
- Phase 4 L1270 `getUnitTroops(p.unit)` 保留战后值 (用于 wipe opacity 判定, 设计意图正确)

方案 B (简单但侵入小): phantom 创建后, 在 collision 阶段(Phase 3 碰撞) 重新 update 旗帜数字 = 战后值
- 不改 makePhantom signature, 在 Phase 3 内 swap 旗帜 text
- 视觉切换在"碰撞瞬间"而非"phantom 创建瞬间", 跟 user 期望对齐

**P 级**: P2 (UI 视觉跳变, 不影响 gameplay 但破坏战前-碰撞-战后的视觉时序连贯)

**留给 sprint**: 战斗机制 sprint 批 2 候选 (与 §5.3 同源同模式, 可一打两个 fix)

**§5.6 升级**: §5.6 audit 时只是怀疑 (设计意图模糊), user 实机判定**确认是 bug + 锁定 root cause + 给出修法**, **§5.6 P3 → §5.10 P2 真 bug**

### §5.3 update — 飘字色 user 实测验证 (2026-05-11)

**user 实测反馈**:
> "如果你说的是损失人数, 那我看飘的都是红字"

**spawnLossText 色逻辑实测** (battle_anim.js:350):
- isPlayer=true → fill 米色 + stroke 红色 (轻飘"自己损失警示")
- isPlayer=false → fill 红色 + stroke 米色 (实心红"敌方伤亡战果")
- **两种色都是红色调**, 视觉差别细微 (描边 vs 实心)

**§5.3 重新评估**:
- code 层 stale 仍是 bug (isPlayer 因 city.fac stale 错判 → 玩家自己损失被显示成"敌方伤亡"色)
- **视觉影响 P3 (而非 P2)**: user 视觉看"都是红字" 难一眼区分玩家方/敌方损失色
- 修法仍同 §5.1 模式: `isPlayer = (report.defFac === G.playerFac)` (1 行)
- **P 级降 P2 → P3** (视觉影响小, 但 code stale 仍应 fix 跟 §5.1 一致)

### Test 2 D-camp-1-runtime sprint_verify 上线 (2026-05-11)

**目的**: 替代 user 50 旬实机等 AI 扎营 — 直接调 _aiChooseDefensePosture 验证 fix 路径

**实现** (tests/sprint_verify.js D-camp-1-runtime entry):
- Mock setup: wei AI 部队 (initGame 拿 G.units.find(u=>u.fac==='wei'))
- Mock threat: 邻 hex 50000 兵 shu 关羽 unit (避开陆逊 huoying_def + raid INT 差 >10)
- 调 `win._aiChooseDefensePosture(aiUnit, 'wei', [threatUnit])`
- assert 返 'camp' (boost 路径 L977 OR fallback L1029)

**结果**: PASS — fix 路径自动触发 'camp' 决策

**价值**:
- user 不用 50 旬实机等 (memory 教训: 战斗机制 fix 必须 user 实机测, 但 D-camp-1 可 mock state 自动化)
- regression 防御: 后续修改 _aiChooseDefensePosture 此 entry 立即 catch fix 失效

### 战斗机制 sprint 批 2 close — §5.10 user 实测 PASS + §5.3 防御性 fix (2026-05-11)

**§5.10 P2 真 bug user 实测 PASS** (commit 76f6f18 上 session 末实装, 本 session 头 user 确认):
- Test A-E phantom 时序: 战前 → 碰撞 → 碰撞后战后, 跟 user 期望对齐
- 方案 A robust (snap 扩 troops + makePhantom presetTroops) 验证生效

**§5.3 P3 防御性 fix close** (本 session, 待 commit):
- battle_anim.js:2287 `city.fac` → `report.defFac` (1 行 fix + 2 行 comment)
- 跟 §5.1 D-anim-2 完全同模式 (同函数 L2028 已 fix, L2287 漏改)
- sprint_verify D-anim-3 entry 加 (跟 D-anim-2 同模板, regex limit 800 char)
- 顺便 fix D-anim-2 regex limit 400→800 (block 实际 492 字符)
- smoke fix vs no-fix byte-identical (除 timestamp) — 跟 §5.7 同模式守底
- codex review LGTM trial 1 (零 finding 零 concern)
- 不 user 实机测: 跟 §5.7 同性质 (defensive at site, user 实测 "都是红字" 视觉差异极小)

**战斗机制 sprint 批 1+2 累计成果**:
- §5.1 P1 close (91680d5, virtualGarrison.fac 真 root cause)
- §5.2 P2 close (60a1f97, _aiChooseDefensePosture camp boost)
- §5.7 P3 close (1be7ff9, resolveBattle default fac)
- §5.10 P2 close (76f6f18, phantom 旗帜 snap)
- §5.3 P3 close (本 commit, virtualGarrison 飘字 isPlayer)
- audit pass 2 S1-S6 完结: 系统性证明战斗机制 + 全 src/ 异步路径 robust by design

**剩余战斗机制 sprint 候选** (P4+ 低优先级 / 设计层):
- §5.7 P4 `_pendingBattleConfirms` 跨 confirm wipe (罕见场景)
- §5.8 P6 `_pendingBattleAnimations` drain 防御 (架构层, §5.1/§5.3 单点 fix 已足)
- §5.9 设计层 `_drainPendingBattleAnimations` await 模式 (需设计 approve, 破坏 v175 fire-and-forget)

---

## phase 6 wire W4c followup (2026-05-15)

### F-W4c-1 — 190-roster GEN_TAGS / GEN_META / GEN_CLASS 大面积缺漏(后续 data sprint)

`src/data/generals.js` 的 `GEN_TAGS`(184 条)/ `GEN_META` 是按旧 214 roster 建的;SCENARIO_190
名册 213 武将里 ~80 个(华雄/李傕/卫兹/戏志才/李儒…)在这两张表**全缺**。同根的 `GEN_CLASS`(133 条)
也缺(W4b 遗留 #2)。

- **根因**:phase 4-a 建 190 名册时只扩 `GEN_BASE`,未同步扩 `GEN_TAGS`/`GEN_META`/`GEN_CLASS`。
- **影响**:190 武将 `getGenMeta()` 的 `gentry` 字段为 undefined(W4c `m.genMeta` 的 gentry 走 legacy
  `GEN_META` 透传 — 制作人决定 2A);`GEN_TAGS[name]` 为 `{}` → 小传身份标签缺失;`GEN_CLASS`
  默认 `['warrior']`。**非崩溃 latent**(190 本就未实机,214 不受影响)。
- **W4c 不修**(制作人决定 2A):W4c 聚焦接线,190 数据缺口归后续 data sprint。
- **建议 fix**:开 data sprint,GEN_TAGS/GEN_META/GEN_CLASS 的 origin/combat/temperament/gentry/
  classTag 等字段为 190 roster 扩充(像 deathCause sprint 那样 codex 史实 sweep);或考虑把这些
  字段并入 `GEN_BASE` 主表(W4c meta 把 class/tags 读法迁到 `GEN_BASE`),一并消除多表维护。

### F-W4c-2 ✅ closed (2026-05-16, commits `c5b3128` + `1b64592`) — 小传 facName 硬编码 214 fid map(190-only 显示缺陷)

`src/core/main.js` initGame chronicle loop:`const facName={wei:'魏',shu:'蜀',wu:'吴',nanman:'南蛮'}[fid]||fid;`
—— 这个 map 只认 214 的 fid。

- **W4c 暴露**:W4c step-2 把 chronicle loop 的 fid lookup 从 legacy `GENS_FULL` 迁到 `m.GENS_FULL`
  后,190 run 拿到的是 190 真 fid(`caocao`/`dongzhuo`/…)→ map miss → `||fid` → 小传显示
  "仕于caocao"(原 main 因 loop 读 214 legacy 数据,曹操 fid=wei → "仕于魏",**是错的但中文**)。
- **非 W4c 回归**:W4c 的 loop 迁移是对的(214 的 9 个新武将必须靠它才拿到正确 fid);facName
  map 是 pre-existing 214-only 缺陷。214 不受影响(fid 仍是 wei/shu/wu/nanman)。
- **W4c 不修的原因**:① 190-only 显示缺陷,跟 "190 render bug 留 W6+" 同 bucket;② 正确 fix
  (`m.FAC[fid].name`)对 214 **不 byte-identical** —— `FACTION_BASE.nanman.name="蛮"` ≠ 硬编码
  "南蛮",会改 214 nanman 武将小传;③ 190 warlord 势力的小传显示名是设计决策(`.name`="曹"
  太短 / `.full`="曹操" → "仕于曹操" 语义怪)。
- **建议 fix**:W6 收尾或专门 session,定 190 势力小传显示口径 + 顺带核 `FACTION_BASE` name/full
  字段口径(214 "蛮" vs "南蛮" 也值得一并理顺)。

**实际 fix(2026-05-16,3 commits)**:
- **part 1 `c5b3128` (byte-identical 守底)**:battle UI 2 处 facName 函数 (`battle_modals.js:390/1441`)
  从 hardcoded `{wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'}[f]||f` 改 `getFactionDef(f)?.name || f`。
- **part 2 `1b64592` (一刀切 ruler — 后被 v2 修正)**:3 处 chronicle 写入改全部 ruler 全名。
  制作人 catch: 214 三国都建国了应该用国号 (仕于魏), 190 都是军阀应用 ruler (仕于董卓), 不能一刀切。
- **v2 `a4c6f2f` + `2d8efc3` (称王分水岭)**:加 SCENARIO.factions[fid].declared boolean
  (214 wei/shu/wu/nanman declared:true; 190 14 default false) + FACTION_BASE.<fid>.chronicleName
  optional override (nanman="南蛮" 覆盖 .name="蛮" 一字太短)。chronicle 逻辑:
  `_fd.declared ? (_fd.chronicleName || _fd.name || fid) : (_fd.ruler || fid)`。
  **codex review LGTM**。

### F-W4c-3 ✅ closed (W5b commit `3feb2ba`) — 在野武将小传 "仕于undefined"

chronicle loop 对在野武将也跑 `addGenChronicle(name, 仕于${facName}...)`;`facName` 由 `fid`
派生,而在野武将的 `fid` lookup(对名册)返回 `undefined`(在野不在势力名册)→ 小传 "仕于undefined..."。

- **pre-existing,非 W4c 回归**:legacy 的 loop 用 `GENS_FULL` const 做 fid lookup,W4c 改用
  `m.GENS_FULL` —— **两者都不含在野武将**,fid 都是 undefined。W4c 全 G dump 实测:在野武将
  chronicle 文本 main vs W4c **byte-identical**(chronicle valDiff=12 全是 active 武将的 GEN_BASE
  birthplace 修正,零在野武将变化)。codex review trial 标 P2 "regression" 是误判 —— 实为 pre-existing。
- **W4c 不修的原因**:W4c 原则是 active 段切新源、**wild 段保持 legacy 行为留 W5**。修在野武将
  小传 = W4c 改 wild 行为,违反 "wild 段 byte-identical 留 W5" 约束。
- **建议 fix**:W5(在野/待出场池)做 wild meta 接线时一并解 —— 在野武将 fid===undefined 时
  跳过 faction-bio 或用 wild-specific 文案。
- **实际 fix(W5b commit `3feb2ba`)**:`tick.js` debut path + `main.js` chronicle init loop 都加
  `fid undefined → facName='在野'` fallback,代替 'undefined' 字面。

---

## phase 6 wire W6-pending-3 followup (2026-05-16)

### F-W6-pending-3-1 ✅ closed (2026-05-16) — battle_modals.js isRuler 改 runtime G.generals scan

**位置**:`src/render/battle_modals.js:1897` (showNextPrisonerModal) + `:1957` (playerDisposePrisoner)

**症状**:prisoner 「是否君主, 不可劝降」检查用 `[...Object.values(m.GENS_FULL).flat()].find(x=>x.name===name)?.role === 'ruler'`。
- m.GENS_FULL 是 scenario static snapshot (W4a 真值, 起手 scenario role)
- Legacy `GENS_FULL.flat()` 也是 static const, 同行为
- 漏判场景: 起手 ruler (曹操) 战死 → succeedRuler 让 曹丕 继位 (曹丕.role='ruler' in G.generals[wei])。此时 曹丕 被俘, scenario static 里 曹丕.role=undefined → isRuler=false → 允许劝降 (但实际是当朝君主, 不应该)。

**non-regression — pre-existing latent bug**:
- W6-pending-3 commit `e80d5bb` 把 legacy `GENS_FULL.flat()` 切到 `m.GENS_FULL.flat()`, 两者均 static, byte-identical 守底成立
- W6-pending-3 codex review trial 1 flag P1 (codex 建议改 runtime G.generals 检查), 但属 pre-existing 不修 (CLAUDE.md 不顺手修原则)

**建议 fix**:改 runtime: `Object.values(G.generals).flat().find(x=>x.name===name)?.role === 'ruler'`。
- 一行改 (×2 处 battle_modals.js)
- 行为变化: 继位后 ruler 不可劝降 (修 latent bug)
- 不是 byte-identical (会改变长 run 的 prisoner UI 选项)
- 推荐 sprint: 战斗机制 bug fix 或 后续游戏体验 sprint, 不进 W6 纯 refactor

**优先级**:P2 (低概率触发, 长 run + 君主战死继位 + 继位者被俘三连)

**实际 fix (2026-05-16, commit 待 sed)**:battle_modals.js L1897 + L1957 两处 isRuler 改
`Object.values(G.generals||{}).flat().find(x=>x.name===name)?.role === 'ruler'`。50 旬 baseline
无 ruler 死, byte-identical 守底成立 (51 snapshots identical)。长 run 行为变化: 继位 ruler
被俘正确阻劝降, 修 latent bug。

## phase 6 wire W6-pending-2 followup (2026-05-16)

### F-W6-GENSFULL ✅ closed (W6-pending-3 commit `e80d5bb`, decision C 实装) — GENS_FULL legacy const 迁 m.* 撞设计墙(origFac lookup 语义)

W6-pending-2 (ALL_GENS) 完成后 scout GENS_FULL 发现:legacy GENS_FULL (109+ entries, 含
8 个 pendingFac gens: 司马昭/陈泰/王基/关兴/张苞/夏侯霸/诸葛恪/施绩) ≠ m.GENS_FULL (104
active only, W4a step-2)。

**18+ live consumer 集中在两个模式**:
- **origFac lookup** (10+ 处): `Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(g=>g.name===X))`
  - chains/general.js:427-428/495-496/1208-1209/1217-1218/2002/2217 (orig 势力查询: surrender/
    relationships/prisoner/return)
  - render/battle_modals.js:1471-1472/1878/1963 (duel 双方 fac / origFid)
  - render/gen_profile.js:85/268 (profile 显示 fac)
- **all-gen enumeration** (3 处): `[...Object.values(GENS_FULL).flat()]`
  - chains/general.js:427/495 origRuler 查询 (全 scenario 名册 scan)
  - render/battle_modals.js:1891/1950 allGens 列表

**byte-identical 风险面**:
- 50 旬 baseline 内 pendingFac gens 不 debut (minTurn=109+), 不触发 → smoke PASS 也无信号
- 长 run / 重玩 / 100+ 旬 实机测会暴露: 司马昭 lookup origFac 从 'wei' 变 undefined→fallback

**待决设计选项 (制作人)**:
- A: 全 m.GENS_FULL only — pendingFac gens orig 信息丢失 (退化但 active-真实)
- B: 抽 helper `getGenOrigFac(name)` 跨 m.GENS_FULL ∪ m.pendingGenPool ∪ m.WILD_GENS, 复刻 legacy
  「全 roster」语义 (byte-identical, 加 1 抽象层); 类似 ALL_GENS-like flat scan 抽 `getScenarioAllGens()`
- C: 混合 — UI/battle 「在场」语义走 m.GENS_FULL (active-only 是对的); orig faction 类查询走 helper B

**优先级**:P2 (50 旬 baseline 不破, 长 run 行为破); 撞设计墙不 fix, 等制作人决定 A/B/C。

---

(sprint_followup v2.7 — 2026-05-16: F-W4c-2 closed via ruler 全名 fix (`c5b3128`+`1b64592`);
F-W4c-3/F-W6-GENSFULL/F-W6-pending-3-1 已 closed;
F-W4c-1 (190 武将 GEN_TAGS/GEN_META/GEN_CLASS 80/99/166 缺漏) 仍 open — 实测大 data sprint,
待制作人定 scope (全量 / 关键 actor / 仅 GEN_CLASS))
