# Phase 3.6 Notes — chains/gentry.js(chain 模板第二应用)

> Sub-session:Phase 3.6(REFACTOR_PLAN_v1.md §三阶段 3,Wave 1 第二个)
> 完成日期:2026-05-05
> 工作分支:`refactor/p3.6-gentry` ← `refactor/phase-3`
> 起始 commit:`eea8200`(Phase 3.5 完成)

---

## 一、范围(自决,按 chain 阶段模板)

PLAN §三阶段 3.12(原)字面:`chains/gentry.js(豪族链 v4 / 节点 ~37 / ~12 D 类)`。

**实装范围**:6 段 verbatim ~547 行
- G1 county helpers(`_countyClanList / isMagnateCounty`)L4025-L4035
- G2 GENTRY_LEVELS const + 6 mults(`getGentryLevel / _getCountyGentryLevel / getGentryGoldMult / getGentryRecruitMult / getGentryMoraleMod / getGentryDefMult`)L4122-L4187
- G3 corruption-side helper(`CORRUPT_GENTRY_MAP / _getCorruptGentryMod`)L4195-L4205
- G4 I2 主块(section header + 9 函数:`initCityGentry / _isFacHomeRegion / _clanHasMemberInFac / _clanHasOfficeInFac / _aggregateGentry / applyGentryOnCapture / applyFamilyLoyaltyShock / processGentry / _triggerGentryBetray`)L11967-L12378
- G5 攻城后处置 mechanism(`_applySiegeAftermath`)L12382-L12417
- G6 攻城后处置 callback(`_onSiegeAftermath`)L12441-L12452

**留 v181**:
- `showSiegeAftermathChoice`(L12420-L12440)— phase 2 原则,modal HTML 构造
- `calcCityCorruption`(经济 chain,留 v181 等 3.9)
- `calcGentryRecruitBonus`(L7020,武将链 招募 helper)
- `getGenHomeCounty / getGenHomeCity / isGenHomeInFac / getGenLocalBonus`(武将 home info,留 v181 等 3.12)
- `_CLAN_MAP` IIFE(L4086-L4120,GEN_TAGS 数据装配)

---

## 二、写口归属声明

**本 chain 主要写口**:
- `G.cities[id].gentry`(城市豪族支持度,聚合值)
- `G.cities[id].counties[].loyalty / popShare / _initPop / magnate / clanFamily / type / name`
- `G.cities[id].pop`(processGentry 隐匿户口机制)
- `G.cities[id].fac / occupied / siegeDecay / garrison / billetPool / prefect / morale`(`_triggerGentryBetray` 写城市易手副作用)

**G5/G6 攻城后处置**写口跨多链(`G.factions[atkFac].res.gold` / `G.cities[].morale/pop/gentry` / `G.reputation[atkFac]`),语义归 gentry(豪族对屠城/安民的反应),3.11 抽军事时再次确认。

---

## 三、PLAN §二偏离

PLAN 字面:~14 函数(master scout 估)。
实测 + 实装:**18 函数 + 2 const + 1 section header verbatim ~547 行**。
偏差中等,主因:G3 corruption-side helper(2 个,master scout 漏)、G5/G6 aftermath(2 个,master scout 含)、_isFacHomeRegion / _clan*Has*(实测 master scout 已含)。

scout-before-extract 第 6 次应用(本 session 自决,follow 模板规范)。

---

## 四、跨链反向调用(c) 已 approve

### 本 chain 被外部链调用(callers,~30 处)

| 归属链 | 行号(pre-3.6) | 调用 |
|---|---|---|
| 经济链(留 v181 等 3.9) | L4230 / L5447 / L5711 / L5857 / L5864 / L6095-L6096 | calcCityCorruption / 朝议 / 城产 / 迁民 |
| 武将链(留 v181 等 3.12) | L7257 / L10390 / L16926 | poach / surrender / killGen → applyFamilyLoyaltyShock |
| 军事链(留 v181 等 3.11) | L9447 / L9562 / L9783 / L16040 / L16051 / L21657 / L21785 / L21816 / L24701 / 多 unit modal | 征兵 mult / 城防 mult / 守城 morale / 城市易手 / aftermath |
| save / core | L27958 / L27997 / src/core/main.js L352 / src/core/tick.js L512 / L601 | initCityGentry / _aggregateGentry / processGentry / _applySiegeAftermath |
| render(留 v181) | src/render/tooltips.js / ui_panels.js | getGentryLevel / getGentryGoldMult / _getCorruptGentryMod / _countyClanList / isMagnateCounty / getGentryDefMult |

### 本 chain 调外部(callees)

- 武将链:`getGenPostDef / getGenLocalBonus / getGenHomeCounty / getGenHomeCity / isGenHomeInFac`(留 v181 等 3.12)
- 政治链:`getStage`(留 v181 等 3.7)
- ethos 链(已抽):`applyEthosShock`(_applySiegeAftermath 调)
- 跨链 helpers(留 v181):`applySkills / getTechEffect / hasFacGen / genHasOffice / isHostile / isJiangdong / addGenChronicle / getCityProd / getFactionRuler`
- 外交链(留 v181 等 3.8):`trackCityLoss / checkEmperorCapture / addDiplo`
- 军事链(留 v181 等 3.11):`_doRetreat2Hex / hexDist / getUnitTroops / invalidateCityCache / updateFogCitySnapshot / _aiInvalidateThreatCache`
- render:`closeModal / renderAll / showNextPrisonerModal / showCourtCouncil / log / showNotif`
- 数据 / 常量:`GEN_TAGS / GEN_MAP / CITY_MAP / CITY_TO_STATE / STATE_TO_GENTRY_FAC / COUNTY_NAME_TO_CITY / COUNTY_DATA / CLAN_FAMILIES / SIEGE_AFTERMATH / STAGE_GENTRY_BOUNDS / SUPPLY_CITY_RESTORE_TURNS / FAC / ALL_FACS / REPUTATION_DEFAULT / COUNTY_TYPE_SENS_V170 / COUNTY_CLAN_SENS / LOCAL_BONUS_CAP_V170 / _V170_TIER_TABLE`(部分已抽 src/data/)

---

## 五、bug 记录(本 session 实战教训)

**bug**:awk 范围 `NR>=11967 && NR<=12377` 漏掉 1 行 — 实测 `_triggerGentryBetray` 函数 closing `}` 在 v181 L12378(不是 L12377,我 manual 数 line 时misread)。awk 删完后 v181 出现 stray `}`,导致 SyntaxError + smoke FAIL。

**修复**:Edit 直接删 stray `}` + 更新 marker 文字 `L11967-L12378`(包含被漏掉的行)。chains/gentry.js 内容是从我的 read output 复制粘贴,正确包含完整函数。

**教训**(记入 phase 3 工作流):
- awk 删除范围结束应**用 `wc -l` 验证而非 manual 数 line**:
  - 提取后跑 `wc -l src/chains/X.js`
  - 算 verbatim 行数 = 文件总行 - header 行
  - 与预期 awk delete 范围行数对比
- 提取后立即跑 smoke,SyntaxError 在抽完瞬间就能暴露
- chain 阶段后续 sub-session 严格执行此双 check

---

## 六、Phase 3 全局 carry-over 验证

- **backToTitle reset**:0 行涉及 gentry(state 全在 G 子树)
- **map.js 决策**:无关
- **_execXxx 派发**:0 个

---

## 七、实测数据

| 项 | 起点(p3.5 末) | gentry 抽后 | 变化 |
|---|---|---|---|
| project_romance_v181.html | 31903 | **31363** | **-540 行**(-547 verbatim + 6 markers + 1 script tag = -540,1 行差异在 awk 边界 + Edit 修补 stray `}`) |
| src/chains/gentry.js | 0 | **688** | +688(141 header + 547 verbatim) |

累计(phase 3 自 main 起):v181 39547 → 31363 = **-20.7%**(突破 -20% 大关)。
src/ 现状:8 文件 3776 行(core 6 文件 2916 + chains 2 文件 860)。

| 阶段 | snapshots | 结果 |
|---|---|---|
| 零点校准(p3.6 启动前) | 51 | ✅ identical(p3.5 已 PASS) |
| gentry.js 抽离后(修 stray `}` 后) | 51 | ✅ identical |

---

## 八、phase 3.6 完成清单

- ✅ `chains/gentry.js` 抽出(6 段 verbatim ~547 行 + 141 header)
- ✅ smoke layer-1+layer-2 PASS(51 snapshots identical)
- ✅ 6 项 header 模板完整(含写口归属声明)
- ✅ 加载顺序规范(chains/gentry.js 在 chains/ethos.js 之后)
- ✅ phase 2 原则:`showSiegeAftermathChoice` modal 留 v181
- ✅ 0 backToTitle reset / 0 map.js / 0 _execXxx
- ✅ awk 边界 bug 已修(教训记入工作流)
- ⏭ 工作分支 `refactor/p3.6-gentry` → squash merge `refactor/phase-3`

---

## 九、下一 sub-session 衔接

**3.7 chains/politics.js**(政治链,Wave 2 第一个):
- ~50 函数(科技 + stage 演进 + post + merit + 朝议 + 称帝)
- 1 _exec(research)
- 4 backToTitle reset(`_techEffectCache / _facInfluenceCache`)
- 含 court UI(showCourtCouncil)+ tech UI(renderTechTab/openTechResearchPicker)— phase 2 原则候选留 v181
- 沿用 chain 模板 6 项 header + 加载顺序规范
- **scout 时严格 wc -l 验证 awk 边界**(本 session 教训)

phase 3.6 留给后续 sub-sessions 的债:
- 3.9 抽经济时确认 calcCityCorruption 调 _getCorruptGentryMod 是设计认可
- 3.11 抽军事时再次确认 G5/G6 aftermath 跨链写口归属(选 gentry 是语义判定)
- 3.12 抽武将时确认 calcGentryRecruitBonus 留武将链(函数名"gentry"指 gen.metadata.gentry 不是 city.gentry)
