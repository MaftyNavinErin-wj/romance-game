# Phase 4 — 渲染层第二轮 Plan (草稿 v0.1)

> 制作时间:2026-05-08
> 适用版本:v181 当前 main HEAD `596cf46`(_exec sprint 收官后)
> 目标:把 v181 桶 3 ~10670 行渲染散布抽到 `src/render/`,完成后 v181 突破 -80% 大关
> 启动条件:HIGH sprint 27/27 + _exec sprint 35/35 双收官
> 预计 sub-session 数:10
> 操作平台:Claude Code(多短 session)

---

## 一、Phase 4 总目标

**从**:v181 当前 15049 行,桶 3 渲染散布 ~10670 行(占剩余 71%)
**到**:v181 ~3000 行(boot/serialize/HTML shell + 顶层 lets),桶 3 全清空
**v181 累计**:39547 → ~3000 = **-92%**

**驱动力**:
- _exec sprint 收官后,v181 剩余结构清晰可见(桶 1+5+6 ~3000 行必留 / 桶 3 ~10670 行渲染待抽)
- phase 2 当时只抽 5 文件 5000 行,phase 4 把剩下大头收掉
- phase 3 chain 阶段 + _exec sprint 工作流已成熟,phase 4 直接套用

**不做的事(继承 CLAUDE.md)**:
- ❌ 不修 D 类(留 sprint)
- ❌ 不重新设计接口(保 verbatim,见决策 1)
- ❌ 不并行 sub-session(每个完成才进下一个)

---

## 二、三大决策(2026-05-08 制作人 approve)

### 决策 1:接口风格 A — verbatim 直读 G

**选项 A 落地**:抽出来的 render 函数照搬,直读 `G.xxx` / 全局 const 不变。跟 phase 3 chain 阶段、_exec sprint 一致。

**理由**:
- phase 2 当时定的"render 不直读 G"接口风格实操中已偏离(已抽 5 文件普遍直读 G)
- 重新设计接口 scope 巨大(~12000 行函数体改签名),且要回头重构 phase 2 抽出的 5 文件
- 保 verbatim 风格 = chain 阶段一致 = scout/搬运成本低

**取舍**:
- ✅ 抽离速度快、风险低
- ❌ render 与机制层耦合保留(理论上不优雅,但项目阶段不追求接口纯净)

### 决策 2:拆分方案 B+C — 按文件类型拆 + 按抽离难度排序

**B(按文件类型)**:每个 sub-session 一个新 src/render/*.js 文件,渲染关注点单一(overlay / map / tabs / modals / battle_anim 等)

**C(按抽离难度排序)**:**先做低风险,后做高风险**(战斗动画 4.8 + 战斗 modals 4.7 留尾,有前面 sub-session 经验后再啃)

### 决策 3:phase4_plan.md 文档化 + CC ↔ codex 协作

本文件即决策 3 的产物。流程:
1. CC 起草 plan(本草稿 v0.1)
2. commit 到 `phase4/plan` 分支
3. `codex review --base main` 走一轮
4. 据反馈迭代到 v1.0
5. plan v1.0 LGTM 后启动 sub-session 4.1

---

## 三、Sub-session 拆分(10 个)

按抽离难度由低到高排序。每 sub-session = 1 个工作分支 + 1 个 squash commit + 1 个 src/render/ 新/扩展文件。

### 4.1 `render/overlay.js` 🟢 低风险首发

| 项 | 值 |
|---|---|
| 函数 | `renderOverlay` / `_renderOvBase` / `renderOverlayFaction` / `renderOverlayGold` / `renderOverlayFood` / `renderOverlaySupply` / `renderOverlayFoodFlow` |
| v181 行 | ~L1621-L1903 ~280 行 |
| 风险 | 低 — overlay 顶层渲染容器,调用频次稳定,纯读取展示 |
| 实测 | scout 时 grep 实际行号 + caller 定位 |

### 4.2 `render/map_render.js` 🟢 低风险

| 项 | 值 |
|---|---|
| 函数 | `renderMap` / `renderUnitsOnly` / `renderUnitsOnMap` / `renderUnitDetail` / `_renderSiegeIndicators` / `_renderMoveRange` |
| v181 行 | ~L2189-L10239 散布 ~500 行 |
| 风险 | 低-中 — map 渲染调用频繁但 isolated;**注意区分**:`src/core/map.js`(hex/pathfinding 数据计算)已抽离,本文件是 SVG/DOM 渲染层 |

### 4.3 `render/notifications.js` 扩展(已存在文件)🟢 低风险

| 项 | 值 |
|---|---|
| 函数 | `renderAlertStack` / `renderFoodAlerts` / `showMigrateDialog` / `closeUnitMenu` / `closeStackPicker` / `showStackPicker` |
| v181 行 | 散布 ~300 行 |
| 风险 | 低 — append 进现有 src/render/notifications.js 末尾,加段头 |

### 4.4 `render/gen_profile.js` 🟢 低-中风险

| 项 | 值 |
|---|---|
| 函数 | `openGenProfile` / `closeGenProfile` / `openPostAppoint` / `openPostAction` |
| v181 行 | ~L2941-L3441 ~500 行 |
| 风险 | 低-中 — modal callback 写 G.genPost / G.factions[fid].strategist |

### 4.5 `render/boot_screens.js` 🟢 低风险(isolated)

| 项 | 值 |
|---|---|
| 函数 | `showTitleScreen` / `showScenarioSelect` / `showFactionSelect` / `showSaveLoadPanel` / `closeSaveLoadPanel` / `showGameEndOverlay` / `showTabHelp` / `closeTabHelp` / `showTutorial` / `closeTutorial` / `_renderTutPage` / `_showApiKeyModal` |
| v181 行 | ~L11879-L13416 散布 ~700 行 |
| 风险 | 低 — boot 时序 isolated,不在主 game loop |

### 4.6 `render/diplo_modals.js` 🟡 中风险

| 项 | 值 |
|---|---|
| 函数 | `showCourtCouncil` / `showDiploSueForPeace` / `showDiploVassal` / `showSiegeAftermathChoice` |
| v181 行 | ~L994-L1577 散布 ~500 行 |
| 风险 | 中 — modal callback 涉及外交 / 政治状态写入,与 chain 跨链耦合 |

### 4.7 `render/recruit_modals.js` 🟡 中风险

| 项 | 值 |
|---|---|
| 函数 | `openRecruitModal` / `closeRecruitModal` / `renderRecruitModal` + 内部 helpers(`rmEditSlot` / `rmToggleSub` / `rmPickGen` / `rmPickType` / `_rmSetClass` / `_getBilletRetainer*` / `rmSetTroops` / `rmAdjTroops` / `confirmRecruit`)+ `openRedeployModal` / `_renderRedeployModal` / `openExpandModal` / `closeExpandModal` / `renderExpandModal` / `openAddSquadModal` / `closeAddSquadModal` / `renderAddSquadModal` |
| v181 行 | ~L8894-L11200 散布 ~1500 行 |
| 风险 | 中 — modal 状态复杂,编制涉及 G.units 写入 + 部曲 / squad 逻辑 |

### 4.8 `render/tabs.js` 🟡 中-高风险(单 session 大 scope)

| 项 | 值 |
|---|---|
| 函数 | `renderTechTab` / `renderStatsTab` / `renderPostTab` / `renderFactionTab` / `renderDipTab` / `renderSchemeTab` / `renderEthosTab` / `renderMilTab` + `renderRight` |
| v181 行 | ~L2399-L11878 散布 ~3200 行(最大单 session) |
| 风险 | 中-高 — 各 tab 内有 modal trigger 耦合 + 内部 helper 函数同步抽 |
| 备选 | 若 scope 太大,拆 4.8.a(left tabs:Tech/Stats/Post)+ 4.8.b(right tabs:Faction/Dip/Scheme/Ethos/Mil)+ 4.8.c(renderRight) |

### 4.9 `render/battle_modals.js` 🔴 高风险

| 项 | 值 |
|---|---|
| 函数 | `_showAmbushConfirm` / `confirmAmbush` / `confirmAmbushAbort` / `_showCampBattleConfirm` / `confirmCampBattle` / `_showSiegeBattleConfirm` / `_showSiegeDefendConfirm` / `confirmSiegeDefend` / `confirmSiegeBattle` / `_showNextBattleConfirm` / `selectDuelChallenger` / `confirmBattle` / `showNextBattleReport` / `closeBattleModal` / `showNextPrisonerModal` / `playerDisposePrisoner` |
| v181 行 | ~L7046-L8893 散布 ~2400 行 |
| 风险 | 高 — 战斗 confirm 链 + 时序耦合;`_pendingBattleConfirms` / `_currentBattleConfirm` lets 已在 military.js MIL7.a 抽离,本 session 抽 modal callback 部分 |

### 4.10 `render/battle_anim.js` 🔴 最高风险收尾

| 项 | 值 |
|---|---|
| 函数 | `_drainPendingBattleAnimations` / 6 `_play*Anim` / `DUEL_EPITHET` const / `_getDuelEpithet` / `_baGetUnitRenderPos` / `_baDrawCampPalisade` / `_siegeArrivalChoice` |
| v181 行 | ~L13474-L16142 散布 ~2500 行 |
| 风险 | 高 — 战斗动画时序最复杂,需确认 animation 调用顺序不破坏 `_pendingBattleAnimations` 队列消费时序 |
| 强制 | 4.10 必须最后做(前 9 个 sub-session 完成累积经验)+ 实机测一场完整战斗(含 ambush / camp / siege / duel) |

---

## 四、Smoke 策略

### 第一层:byte-identical(主守底)

**期望**:每个 sub-session smoke vs main byte-identical(verbatim 抽离不改逻辑,跟 _exec sprint 模式一致)。

**执行**:
```bash
node tests/smoke.js && cp tests/current.json tests/sub_current.json
git stash && node tests/smoke.js && cp tests/current.json tests/main_current.json
git stash pop
node tests/compare.js tests/main_current.json tests/sub_current.json
```

**预期**:`PASS — 51 snapshots identical`

### 第二层:渲染调用次数差异(允许)

phase 2 plan 预留:"第二层允许有少量渲染调用次数差异(若 render 层做了合并优化),但**事件触发顺序必须一致**"。

**phase 4 实操**:决策 1 选 A verbatim 不做合并优化,所以**预期第一层 byte-identical**。任何 diff 必查 + 解释或回滚。

### 异常 escalate

- smoke FAIL 30 分钟无法定位 → BLOCKED 回 Claude.ai 讨论
- smoke FAIL 但确认是 setTimeout/动画时序导致(4.10 高风险) → 接受 + 文档化为可接受 diff

---

## 五、风险 + 缓解

| 风险 | 等级 | 缓解 |
|---|---|---|
| 战斗动画时序改变 | 高 | 4.10 单独 session,实机测验证完整战斗(ambush/camp/siege/duel),console 输出顺序对齐 |
| modal callback 写 G 状态 | 中 | A 风格不重新设计接口,直接搬,callback 仍直写 G 安全 |
| renderAll 调用频次差异 | 低 | smoke 第一层守底,任何 diff 必查 |
| tab 内部 helper 散在 v181 | 中 | sub-session 启动 mini scout grep tab 内调用 helper,确认 helper 是否在 tab 文件内同步抽 / 留 v181 |
| 4.8 tabs 单 session scope 过大 | 中 | 备选拆 4.8.a/b/c 三 sub-session;启动时根据实际行数判 |
| modal HTML 字符串与 chain helper 函数耦合 | 中 | 每个 modal sub-session 启动 grep 该 modal callback 调用 chain helper 清单,确认全 global scope 可访问 |
| 战斗动画 setTimeout 链 | 高 | 4.10 启动前 grep `setTimeout|requestAnimationFrame|_play.*Anim`,实测 v181 战斗动画完整调用栈 |

---

## 六、与 phase 2/3 的关系

| Phase | 状态 | 范围 | render 接口风格 |
|---|---|---|---|
| phase 2 | ✅ 已完成 | 抽 notifications/modals/ui_panels/ceremonies/tooltips 5 文件 | "render 不直读 G" 接口(实操偏离) |
| phase 3 chain | ✅ 已完成 | 8 chain 抽离 + chain 内部带的部分 render(setPrefect modal 等) | verbatim 直读 G |
| phase 4 | 🔄 启动中 | 桶 3 ~10670 行剩余 render | **verbatim 直读 G**(决策 1 = 跟 chain 一致) |

**phase 4 后 src/render/** 总计:5(phase 2)+ 9 新(phase 4)= **14 文件**(其中 4.3 是扩展现有 notifications.js,实际新建 8 文件)。

---

## 七、Workflow

### 每 sub-session 标准流程

1. **scout**(scout-before-extract,工作流原则 #5)
   - grep 实际行号 + caller 定位
   - 列出函数清单 + 内部 helper(若有)
   - 确认依赖 helper 全在 src/ 或 global scope
2. **创建工作分支** `phase4/4.X-name`
3. **抽离**(verbatim,Edit 工具精确匹配)
   - 新建 src/render/X.js + 模板 header(参考 phase 3 chain 模板 6 项 header 必含)
   - v181 删 + 加 marker 注释引用原行号
   - 维护 v181 加载顺序(`<script src="src/render/X.js">` 加到现有 render 块尾部)
4. **smoke vs main byte-identical**
5. **commit**(留 local 不 push,等集中 review)
6. **codex review**:
   - **streamline 模式**(候选):4.1+4.2+4.3+4.5(低风险)集中 codex review 一次过
   - **单 session 模式**:4.4 / 4.6 / 4.7 / 4.8 / 4.9 / 4.10(中-高风险)单独 codex review
7. **LGTM → 制作人实机测**
8. **PASS → push**(等制作人明确 push 授权)

### 工作分支命名

```
phase4/4.1-overlay
phase4/4.2-map-render
phase4/4.3-notifications-extend
phase4/4.4-gen-profile
phase4/4.5-boot-screens
phase4/4.6-diplo-modals
phase4/4.7-recruit-modals
phase4/4.8-tabs (或 4.8.a/b/c)
phase4/4.9-battle-modals
phase4/4.10-battle-anim
```

---

## 八、Estimate

| 类别 | sub-session | 单次 CC time |
|---|---|---|
| 🟢 低 (5) | 4.1 / 4.2 / 4.3 / 4.5 / 4.4 | 30-60 min |
| 🟡 中 (3) | 4.6 / 4.7 / 4.8 | 1-2 h |
| 🔴 高 (2) | 4.9 / 4.10 | 2-3 h |

**总计**:~15-20 h CC time across multiple sessions(对应制作人 ~5-8 sessions 节奏)。

**v181 减肥估**:15049 → ~3000 (-12000 = -80%)。

---

## 九、Baseline 管理

- 现有 `tests/baseline/` 4 个 baseline 保留(phase1/2/3/dc complete)
- phase 4 sub-session 走 vs main 传递性验证(跟 _exec sprint 模式一致),**不需要新 baseline**
- phase 4 全部完成后可选生成 `phase4_complete.json` baseline

---

## 十、设计决策回流触发(继承 CLAUDE.md)

phase 4 sub-session 中,遇到以下情况立即回 Claude.ai 讨论:

1. 抽 render 时发现循环依赖(render → chain → render)
2. modal callback 写口语义模糊(归 render 还是 chain?)
3. 战斗动画时序无法 byte-identical(4.10 风险点)
4. tab 内部 helper 跨 chain 调用,不知道该归 tab 文件还是 chain 文件
5. 任何"我觉得这样设计更好"的接口冲动 → 必须先讨论(决策 1 的 A 风格强制保 verbatim)

---

## 十一、Open Questions(等讨论)

- [ ] 4.8 tabs 单 session 还是拆 4.8.a/b/c?(scout 时定)
- [ ] `_execInstantMarch`(v181 L9373 async 战斗 helper,phase 4.10 的边界)归 render/battle_anim.js 还是留军事链 military.js?
- [ ] `selectDuelChallenger` modal 跟 `_duelChallenger` let(已在 military.js MIL7.b)边界:抽 modal 时拷 callback 但 let 不动?
- [ ] streamline 模式适用 4.1+4.2+4.3+4.5 后,4.4 / 4.6 是否也并入(都是低-中风险)?

---

## 十二、Plan v0.1 → v1.0 流程

1. **v0.1**(本文件,2026-05-08 CC 起草)
2. **codex review --base main**(2026-05-08 后续)
3. **据 codex 反馈 + 制作人 review 迭代**到 v1.0
4. **v1.0 commit + merge phase4/plan → main**
5. **启动 sub-session 4.1**

---

(phase4_plan v0.1 — CC 起草草稿,等 CC ↔ codex 协作迭代)
