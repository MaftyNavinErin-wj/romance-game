# Phase 3.7 Notes — chains/politics.js(chain 模板第三应用)

> Sub-session:Phase 3.7(REFACTOR_PLAN_v1.md §三阶段 3,Wave 2 第一个)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.7-politics` ← `refactor/phase-3`
> 起始 commit:`f7befb2`(Phase 3.6 完成)

---

## 一、范围(scout 实测,制作人 approve)

PLAN §三阶段 3.7(原)字面:`chains/politics.js(政治链 v4 / ~50 函数)`。

**实装范围**:6 段 verbatim **47 函数 + 1 const(TRIBUTE_RATES)+ 4 顶层 lets**

| 段 | v181 行号 | 内容 |
|---|---|---|
| P1.a 科技 cache lets + helpers | L1380-L1409 | `_techEffectCache / _techEffectCacheTurn` lets + `_ensureTechCache / getTechEffect / hasTechEffect` |
| P1.b 科技 affordability + research | L1432-L1554 | `canAffordTech / processTechResearch / startTechResearch / aiDoTechResearch` |
| P2 阶段演进 | L4163-L4352 | `getStage / getAnchorState / countCitiesInState / getQualifiedStates / countFacCities / _updateStateAnchorClock / _selectBestAnchor / checkStagePromotion / promoteStage / processStageEvolution / getStageBadgeText / getStageColor / getStageNarrative` |
| P3.a 官职 helpers + TRIBUTE_RATES | L4488-L4558 | `getFacPostTier / TRIBUTE_RATES / getTributeRates / getPostSlots / getFacPosts / countPostsByTier / getGenPostDef` |
| P3.b 官职 mutators + merit | L4564-L4711 | `getFactionRuler / setFactionRuler / genHasOffice / appointGenPost / dismissGenPost / clearAllPostsByGen / checkPostDowngrade / calcPostBuffs / calcPostSalary / hasAnyPost / addMerit / seniority` |
| P4 派系影响力 | L4921-L4952 | `_facInfluenceCache / _facInfluenceCacheTurn` lets + `calcFactionInfluence` |
| P5 朝议 | L5241-L5410 | `_generateCourtProposals / getCourtDecreeBuffs / _applyCourtDecisions / _expireCourtDecrees / _aiCourtSelect` |
| P6 称帝 | L11797-L11866 | `canEnthrone / doEnthrone / aiConsiderEnthrone` |

**留 v181**:
- `getSquadMax / getUnitMax / getAvailableTechs`(L1411-L1430)— 军事链 wrapper(用 getTechEffect 计算编制),留 3.11
- `getGenBirthplace`(L4560)— 武将链 GEN_TAGS 查表,留 3.12
- `setStrategist / getStrategistInt`(L10953-)— 武将链 军师,留 3.12
- modal/UI 队列入口(phase 2 原则保留 v181):
  - `showCourtCouncil`(L5413) / `_checkPendingCourtAfterPopup`(L5510) / `triggerCourtCouncil`(L5519,写 `window._pendingCourtCouncil` UI 队列)
- render Tab 函数(phase 2 原则保留 v181):
  - `renderTechTab`(L13144) / `openTechResearchPicker`(L13263) / `confirmTechResearch`(L13308) / `renderPostTab`(L13494)
- `_execAppointPost / _execDismissPost / _execResearch / _execEnthrone`— 在 src/core/claude_ai.js,phase 3.3 选项 A 决策不搬

---

## 二、写口归属声明

**本 chain 主要写口**:
- `G.factions[fid]._tech.researched / .current`(科技研究状态)
- `G.factions[fid]._stateAnchorClock`(阶段演进 anchor 时钟)
- `FAC_IDENTITY[fid].stage / .anchorState / .type`(势力身份)
- `G.emperor`(称帝时清空旧天子)
- `G.factionRulers[fid]`(势力君主)
- `G.genPost[genName]`(官职归属)
- `G.genMerit[genName]`(功绩)
- `G.courtDecrees`(朝议法令)

**跨链副作用写口**(按 (a) 原则,主写口落政治,副作用写口落他链 — 整函数归政治):
- `appointGenPost / dismissGenPost`:副作用写 `G.genLoyalty / G.loyaltyAccum`(武将)— 任命/罢免 → 忠诚 ±X 是核心机制,不拆。3.12 抽武将时记住边界
- `_applyCourtDecisions`:副作用写 `G.genFactionMod / G.genFactionModLog`(武将)+ `county.loyalty`(豪族,通过 `_aggregateGentry` 已抽 chains/gentry.js)
- `doEnthrone`:副作用写 `G.reputation[fid]`(外交)— 称帝主写政治,信誉 +10 是副作用。3.8 抽外交时记住边界
- `processTechResearch / startTechResearch`:扣 `G.factions[fid].res`(经济)— 研究消耗资源,主写口在 _tech 状态

---

## 三、PLAN §二偏离

PLAN 字面:~50 函数 / 1 _exec / 4 backToTitle reset(master scout 估)。
实测 + 实装:**47 函数 + 1 const + 4 顶层 lets verbatim ~1100 行 v181 代码 + 200 行 header → 1049 行 politics.js**。

偏差中等,主因:
- master scout "1 _exec" 误数,实测 4 个 _exec(`_execAppointPost / _execDismissPost / _execResearch / _execEnthrone`),按 phase 3.3 选项 A 决策不搬 chain
- master scout "4 backToTitle reset",实测 **2 处**(只有 `_techEffectCache / _techEffectCacheTurn` 一对 lets,在 backToTitle L26560 + startGame L26829 共 2 处 reset)。`_facInfluenceCache / _facInfluenceCacheTurn` **不在** backToTitle reset(只在 `promoteStage` 内 self-clear)
- master scout 估 ~50 函数实测 47:`getGenBirthplace` 归武将 / `setStrategist + getStrategistInt` 归武将 / `_exec*` 4 个留 claude_ai.js / modal+render 7 个留 v181

scout-before-extract 第 7 次应用(本 session 自决,follow 模板规范)。

---

## 四、实战教训(awk 边界教训本次预防)

phase 3.6 教训:awk 范围结束行未用 `wc -l` 校验,manual 数 line 偏差导致 SyntaxError。

**本 session 预防**:
- 未用 awk 删行,改用 Node 脚本生成新 v181(`/c/Users/DELL/AppData/Local/Temp/replace_v181.js`)
- 脚本对每段 ranges 数组用 1-indexed inclusive `[from, to]` 明确标注
- 抽离顺序:**先**写 build_politics.js(从 v181 verbatim 提取段落)→ syntax check → **再**写 replace_v181.js(同样的 ranges 数组用 placeholder 替换)→ smoke check
- 双脚本共享 ranges 定义,逻辑等价,少一步 off-by-one 风险

另一个教训:**chain 文件不能"手打 verbatim"**。第一次写 politics.js 时手打中文标点把 `（）` `！` `：` 等替换成了 ASCII 半角,verbatim relocation 原则要求字符级一致。改用 Node 脚本从 v181 line-by-line 复制后修复(grep 验证 `，！？：（）` 标点保留)。

---

## 五、跨链反向调用(c) 已 approve

### 本 chain 被外部链调用(callers)

| 归属链 | 调用 |
|---|---|
| 经济链(留 v181 等 3.9) | `getCityProd / getCityFoodCost / processCityFood / processFacEconomy / processCityPop / processGarrisonRecovery / processBuildQueues / aiDoBuild / aiDoTransfer / aiDoAppointments` 等多处调 `getTechEffect / getStage / calcPostBuffs / getCourtDecreeBuffs / getTributeRates` |
| 军事链(留 v181 等 3.11) | `getSquadMax / getUnitMax / getAvailableTechs`(留 v181 wrapper)+ 多处征兵/战斗/单位计算调 `getTechEffect / hasTechEffect / calcPostBuffs / getStage` |
| 武将链(留 v181 等 3.12) | `processFactionLoyalty / processLoyalty 调 calcFactionInfluence / calcPostBuffs`;`killGen / surrenderGen / poach 等调 clearAllPostsByGen / addMerit` |
| 豪族链(已抽 chains/gentry.js) | `processGentry 调 getStage`;`initCityGentry 调 isMagnateCounty`(反向) |
| 价值观链(已抽 chains/ethos.js) | `processFacEthos 调 hasFacGen / genHasOffice` |
| 外交链(留 v181 等 3.8) | `doEnthrone 调 addDiplo / applyEthosShock / triggerFactionEvent / _applyClaimFactionEffects`;`checkEnthrone / claimWar / vassal 路径调 getFactionRuler / canEnthrone / doEnthrone`;`trackCityLoss → checkPostDowngrade`(失城裁官) |
| 事件链(留 v181 等 3.10) | 事件 effects 多处调 `startTechResearch / addMerit / appointGenPost / setFactionRuler / getStage` |
| render(留 v181) | `src/render/tooltips.js / ui_panels.js`:`getStage / getStageBadgeText / getStageColor / getStageNarrative / getFactionRuler / getGenPostDef / hasAnyPost / seniority / getFacPosts / countPostsByTier / calcFactionInfluence / calcPostBuffs / getCourtDecreeBuffs / getTechEffect / hasTechEffect`;v181 inline render Tab(`renderTechTab / renderPostTab` 留 v181)调 `getTechEffect / canAffordTech / startTechResearch / getFacPosts / appointGenPost / dismissGenPost / getPostSlots / countPostsByTier` |
| core(已抽) | `src/core/tick.js`:`processTechResearch / processStageEvolution / _expireCourtDecrees`(每旬调用);`src/core/main.js`:initGame 路径调 `getFactionRuler` 等;`src/core/claude_ai.js`:4 个 `_exec*` 调本 chain |
| inline backToTitle / startGame | L26560 + L26829:`_techEffectCache = {}; _techEffectCacheTurn = -1;`(跨 script 直接写本 chain 暴露的 lets)|

### 本 chain 调外部(callees)

- 武将链(留 v181 等 3.12):`addStatExp / clearPrefectByGen / getGenFaction / getGenFactions / _genInfluence / triggerFactionEvent`
- ethos 链(已抽):`applyEthosShock`
- gentry 链(已抽):`_aggregateGentry`
- 外交链(留 v181 等 3.8):`addDiplo / _applyClaimFactionEffects / isVassal / _shuffleFY`
- core helpers(已抽 src/core/helpers.js):`safeSub`
- render(已抽):`log / showNotif`
- 数据 / 常量:`TECH_TREE / ALL_POSTS / POST_TIERS / FAC_IDENTITY / FAC / ALL_FACS / GEN_TAGS / STAGE_NAMES / STAGE_PROMO / STAGE_LABEL_CAP / STAGE_LABEL_FLOOR / STAGE_TIER1_SLOTS / STATE_CITIES / STATE_NAMES / STATE_TIER / FACTION_DEFS / GENTRY_FAC_TO_STATES / COUNTY_CLAN_SENS / COURT_PROPOSALS_MIL / COURT_PROPOSALS_CIV / ENTHRONE_FACTION_EFFECTS / REPUTATION_DEFAULT`(部分已抽 src/data/,部分留 v181)

---

## 六、Phase 3 全局 carry-over 验证

- **backToTitle reset**:2 行(L26560 + L26829),都写 `_techEffectCache + _techEffectCacheTurn` lets。已抽走的 chain 暴露顶层 lets,跨 script 直接 reset(同 phase 3.4 验证 let 跨 classic <script> 共享原则)
- **map.js 决策**:无关
- **_execXxx 派发**:4 个相关(`_execAppointPost / _execDismissPost / _execResearch / _execEnthrone`),按 phase 3.3 选项 A 留 src/core/claude_ai.js

---

## 七、实测数据

| 项 | 起点(p3.6 末) | politics 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 31363 | **30538** | **-825 行** |
| src/chains/politics.js | 0 | **1049 行** | +1049(200 header + 849 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 30538 = **-22.8%**。
src/ 现状:9 文件 4825 行(core 6 文件 2916 + chains 3 文件 1909)。

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.7 启动前) | 51 | ✅ identical(p3.6 已 PASS) |
| politics.js 抽离后 | 51 | ✅ identical |

---

## 八、phase 3.7 完成清单

- ✅ `chains/politics.js` 抽出(6 段 verbatim ~849 行 + 200 header)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 6 项 header 模板完整(含写口归属声明)
- ✅ 加载顺序规范(chains/politics.js 在 chains/gentry.js 之后)
- ✅ phase 2 原则:`showCourtCouncil / _checkPendingCourtAfterPopup / triggerCourtCouncil / renderTechTab / openTechResearchPicker / confirmTechResearch / renderPostTab` 留 v181
- ✅ 武将边界排除:`getGenBirthplace / setStrategist / getStrategistInt` 留 3.12
- ✅ 4 个 `_exec*` 按选项 A 留 claude_ai.js
- ✅ backToTitle reset 2 处(L26560 + L26829)直接跨 script 写已抽走的 lets
- ✅ Node 脚本(双脚本共享 ranges)预防 awk 边界 bug
- ⏭ 工作分支 `refactor/p3.7-politics` → squash merge `refactor/phase-3`

---

## 九、下一 sub-session 衔接

**3.8 chains/diplomacy.js**(外交链,Wave 2 第二个):
- ~66 函数(外交动作 + 计谋 + 宣称 + 信誉 + 血仇 + 附庸)
- ~14 _exec(diplomacy 是 _exec 大户)
- 2 backToTitle reset(`_pendingPeaceOffer / _pendingVassalOffer`)
- 含多个 modal(showDiploSueForPeace / showDiploVassal 等)— phase 2 原则候选留 v181
- 31 D 类原 audit 最多

phase 3.7 留给后续 sub-sessions 的债:
- 3.8 抽外交时确认 `doEnthrone` 写 `G.reputation` 是政治写口的副作用(已记入 politics header),外交链不"反取"该写口
- 3.9 抽经济时确认 `processTechResearch / startTechResearch` 扣 `G.factions[fid].res` 是政治写口的副作用,经济链不"反取"该写口
- 3.11 抽军事时:`getSquadMax / getUnitMax / getAvailableTechs` 留 v181 是军事链 wrapper(用 getTechEffect 计算编制),3.11 时随军事链一起抽
- 3.12 抽武将时:确认 `appointGenPost / dismissGenPost` 副作用写 `G.genLoyalty / G.loyaltyAccum` 归政治(任命/罢免的核心机制);确认 `_applyCourtDecisions` 副作用写 `G.genFactionMod / G.genFactionModLog` 归政治(朝议派系反应)
