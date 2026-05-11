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

---

(sprint_followup v1.4 — 2026-05-11 audit pass 2 S1 加 §5.3 真 bug 候选 + §5.4 verified-with-notes 集合)
