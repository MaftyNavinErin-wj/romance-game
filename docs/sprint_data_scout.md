# Sprint 数据搬运 Boundary Scout — 桶 2 静态数据(GENS_FULL 等)

> Sprint 候选:数据 sprint(选项 2,phase3_summary §10.0 桶 2)
> 状态:**Boundary scout 报告,未实装,等制作人 approve**
> 锚点 commit:main = `ddf50c0`(接口风格段 fixup 后)
> 工作流:phase 1 模式(纯 verbatim 搬运,无机制改动) + phase 3 scout-before-extract 原则 #5
> 风险等级:**低**(纯静态数据 + IIFE,无 G 引用,无函数定义,smoke byte-identical 可守)

---

## 一、Sprint 目标 + 范围

phase3_summary §10.0 实测桶 2 数据集中区:**v181 L838-L2754**,1917 行(本 scout 精确测量)。**纯数据 + 派生 IIFE,无 G 引用**。

抽离后预计 v181 减重 ~1842 行(扣除中间夹的 squad class 6 函数 L2053-L2127 75 行,仍留 v181)。

**与 phase 1 已抽数据对照**(避免重复):

| Phase 1 已抽到 src/data/ | 范围 |
|---|---|
| cities.js(CITIES_DEF / CITY_MAP / 地域 Set / ROADS / ROAD_ADJ / RIVERS)| phase 1.3,L2090-L2324(已不在 v181)|
| constants.js(EVENT_CAT_COOLDOWN + REPUTATION_DEFAULT)| phase 1.5 |
| events.js(EVENT_DEFS)| phase 1.1 |
| factions.js(FAC / ALL_FACS / PLAYABLE_FACS / FAC_IDENTITY / ETHOS_INIT / DIPLO_INIT)| phase 1.4 |
| generals.js(WILD_GENS / WILD_GEN_META / GEN_TAGS / getGenMeta)| phase 1.2 |
| tags.js(SEASONS / SEASON_MOD / YEARS / TAGS / getCityStats / STAGE_NAMES / STAGE_ORDER / ETHOS schema / _ethosTierLabel)| phase 1.6 |

**桶 2 候选(未抽,本 sprint 范围)**:38 个顶层 const + 3 个 IIFE 填充 const + 1 个 IIFE-helper(_CLAN_MAP)。

---

## 二、桶 2 实测 const 完整清单(38 const,按区段分类)

| 区段 | v181 行号 | 行数 | const 名 | 类型 | src/ 引用次数 |
|---|---|---|---|---|---|
| **§A 杂参数(经济 / 政策 / 迁民 / 部曲)** | L838-L897 | **60** | | | |
| | L838-L857 | 20 | TAX / POLICY / CORVEE | 数组 of 对象 | 14 / 7 / 11 |
| | L858-L867 | 10 | MIGRATE_MIN_RATIO / MIGRATE_MAX_RATIO / MIGRATE_LOSS_RATE / MIGRATE_COOLDOWN / MIGRATE_SRC_BASE / MIGRATE_DST_BASE / MIGRATE_COUNTY_CROSS / MIGRATE_COUNTY_SAME / MIGRATE_CLAN_BASE_EXTRA / MIGRATE_ENEMY_CHECK_RANGE | 数字 / 对象 | low |
| | L869-L897 | 29 | RETAINER_LEVEL / RETAINER_PROTECT / RETAINER_INFLUENCE_DIV / RETAINER_PRESET | 数字 / 对象 | low |
| **§B 建筑 + 阶段 + 攻城后处置 + 宣战 + 称帝** | L898-L984 | **87** | | | |
| | L898-L924 | 27 | BLDS | 大对象(建筑数据) | 15 |
| | L925-L944 | 20 | STAGE_GENTRY_BOUNDS / STAGE_PROMO | 对象 | 4 / 20 |
| | L945-L971 | 27 | SIEGE_AFTERMATH / CLAIM_TYPES / CLAIM_EFFECTS | 对象 | 3 / 11 / 2 |
| | L972-L978 | 7 | ENTHRONE_FACTION_EFFECTS | 对象 | 3 |
| | L979-L984 | 6 | SQUAD_MAX_TROOPS / UNIT_MAX_TROOPS / BILLET_LEVEL_THRESHOLD | 数字 | low |
| **§C 科技 + 郡** | L995-L1185 | **191** | | | |
| | L995-L1109 | 115 | TECH_TREE | 大对象(科技树) | 15 |
| | L1110-L1129 | 20 | TECH_PREUNLOCK | 对象 | 2 |
| | L1130-L1185 | 56 | JUNS | 对象(12 郡) | 6 |
| **§D 武将主表 + 元数据 + 派生 + 池 + 派系核心 + 类型** | L1186-L2052 | **867** | | | |
| | L1186-L1323 | 138 | GENS_FULL | 对象(势力武将基础属性,**单 const 第二大**)| 21 |
| | L1324-L1948 | **625** | GEN_META | 对象(势力武将元数据,**单 const 最大**)| 7 |
| | L1949-L1952 | 4 | ALL_GENS(IIFE 派生)| `[...Object.values(GENS_FULL).flat(), ...WILD_GENS]` | 5 |
| | L1953-L1980 | 28 | GEN_POOL_INACTIVE | 数组 | 5 |
| | L1981-L1989 | 9 | FOUNDING_CORE | 对象 | 9 |
| | L1990-L2044 | 55 | GEN_CLASS | 对象(武将类型) | 5 |
| | L2045-L2052 | 8 | CLASS_META | 对象 | 2 |
| **(留 v181 / squad class 函数,夹在数据中间)** | **L2053-L2127** | **75** | (`getSquadClass / getUnitClassBuffs / getClassDuelWeight / genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml`) | **函数,不抽** | — |
| **§E 州 + 县 + 派系-州映射** | L2128-L2497 | **370** | | | |
| | L2128-L2155 | 28 | STATE_CITIES | 对象(13 州→城市映射) | 14 |
| | L2156-L2166 | 11 | STATE_NAMES / STATE_TIER | 对象 | 7 / 7 |
| | L2163-L2165 | 3 | CITY_TO_STATE(IIFE 反查) | `Object.entries(STATE_CITIES).forEach(...)` | 19 |
| | L2167-L2186 | 20 | STATE_TO_GENTRY_FAC + GENTRY_FAC_TO_STATES IIFE | 对象 + IIFE 反查 | 27 / 5 |
| | L2187-L2202 | 16 | CLAN_FAMILIES | 对象(豪族家族)| 1 |
| | L2203-L2209 | 7 | MAGNATE_CLANS | `new Set([...])` | 3 |
| | L2210-L2485 | 276 | COUNTY_DATA | 对象(郡县数据,**单 const 第三大**)| 5 |
| | L2486-L2497 | 12 | COUNTY_NAME_TO_CITY + COUNTY_INDEX(IIFE 派生) | 空 const + IIFE 填充 | 5 / **0** |
| **§F 地理参数 + 县属性敏感度 + _CLAN_MAP IIFE** | L2506-L2552 | **47** | | | |
| | L2506-L2511 | 6 | LOCAL_BONUS_CAP_V170 / COUNTY_CLAN_SENS / COUNTY_TYPE_SENS_V170 | 数字 / 对象 | low |
| | L2516-L2552 | 37 | **`_CLAN_MAP` 嵌套 IIFE**(`{ const _CLAN_MAP = {...}; Object.entries(_CLAN_MAP).forEach(...) }`)| **嵌套 IIFE**,填充 GEN_TAGS 关联?待 scout 确认 | — |
| **§G 腐败 + 派系定义 + 官职** | L2553-L2698 | **146** | | | |
| | L2553-L2571 | 19 | CORRUPT_PER_CITY / CORRUPT_FREE_CITIES / CORRUPT_CAP | 数字 | low |
| | L2572-L2596 | 25 | FACTION_DEFS | 数组 | 9 |
| | L2597-L2604 | 8 | POST_TIERS | 数组 | 8 |
| | L2605-L2612 | 8 | STAGE_TIER1_SLOTS / STAGE_LABEL_CAP | 对象 | 5 / 5 |
| | L2613-L2642 | 30 | MIL_POSTS / CIV_POSTS | 对象 | 4 / 4 |
| | L2643-L2665 | 23 | ALL_POSTS(IIFE concat MIL_POSTS+CIV_POSTS)+ MERIT_INIT | 数组 + 对象 | 6 / 5 |
| | L2666-L2698 | 33 | STAGE_LABEL_FLOOR + 散在 | 对象 | 4 |
| **§H 朝议提案** | L2713-L2750 | **38** | | | |
| | L2713-L2750 | 38 | COURT_PROPOSALS_MIL / COURT_PROPOSALS_CIV | 数组 | 2 / 2 |
| **总计(v181 减重候选)** | L838-L2754 | **1917** | 38 const + 4 IIFE + 1 嵌套 IIFE-helper(`_CLAN_MAP`)| | — |
| **扣除 squad class 函数(留 v181)** | -75 | | | | |
| **本 sprint verbatim 抽离候选** | | **1842** | | | |

---

## 三、跨文件引用统计(高 / 中 / 低 traffic 分桶)

src/ 内全部引用次数(grep 实测):

| Traffic 等级 | 引用次数阈值 | const(本 sprint 范围内)|
|---|---|---|
| **High traffic(≥10)** | 10+ | TAX(14)/ CORVEE(11)/ BLDS(15)/ TECH_TREE(15)/ GENS_FULL(21)/ STATE_CITIES(14)/ CITY_TO_STATE(19)/ STATE_TO_GENTRY_FAC(27)/ CLAIM_TYPES(11) |
| **Medium traffic(5-9)** | 5-9 | POLICY(7)/ JUNS(6)/ GEN_META(7)/ ALL_GENS(5)/ GEN_POOL_INACTIVE(5)/ FOUNDING_CORE(9)/ GEN_CLASS(5)/ STATE_NAMES(7)/ STATE_TIER(7)/ GENTRY_FAC_TO_STATES(5)/ COUNTY_DATA(5)/ COUNTY_NAME_TO_CITY(5)/ FACTION_DEFS(9)/ POST_TIERS(8)/ ALL_POSTS(6)/ MERIT_INIT(5)/ STAGE_LABEL_CAP(5)/ STAGE_TIER1_SLOTS(5)/ STAGE_PROMO(20) |
| **Low traffic(1-4)** | 1-4 | TECH_PREUNLOCK(2)/ STAGE_GENTRY_BOUNDS(4)/ SIEGE_AFTERMATH(3)/ CLAIM_EFFECTS(2)/ ENTHRONE_FACTION_EFFECTS(3)/ CLASS_META(2)/ CLAN_FAMILIES(1)/ MAGNATE_CLANS(3)/ MIL_POSTS(4)/ CIV_POSTS(4)/ COURT_PROPOSALS_MIL(2)/ COURT_PROPOSALS_CIV(2)/ STAGE_LABEL_FLOOR(4) |
| **0 引用(只 v181 inline 用?)** | 0 | COUNTY_INDEX(0)|

**结论**:
- 大部分 const 被 src/chains/ 多处消费(已抽 chain 通过同 realm `<script>` 共享 lazy resolve)
- COUNTY_INDEX 在 src/ 0 引用(可能仅 v181 inline render 用)— 抽走时仍要保留(v181 inline 仍引用)
- 加载顺序对 high-traffic const 必须保证:**新数据文件加载在 src/chains/* 之前**(同 phase 1 / phase 3 chain 加载顺序原则)

---

## 四、IIFE 填充链 + _CLAN_MAP 嵌套 IIFE(关键决策点)

桶 2 内含 4 个 IIFE 派生 const(从其他 const 计算):

| IIFE | 依赖 | 行号 | 风险 |
|---|---|---|---|
| **ALL_GENS**:`[...Object.values(GENS_FULL).flat(), ...WILD_GENS]` | GENS_FULL(本 sprint 抽)+ WILD_GENS(已在 src/data/generals.js)| L1949-L1952 | **跨文件依赖**:抽到新文件时 WILD_GENS 必须已加载(generals.js 在新文件之前)|
| **CITY_TO_STATE**:`Object.entries(STATE_CITIES).forEach(...)` | STATE_CITIES(同区段)| L2163-L2165 | 同文件,低风险 |
| **GENTRY_FAC_TO_STATES**:`Object.entries(STATE_TO_GENTRY_FAC).forEach(...)` | STATE_TO_GENTRY_FAC(同区段)| L2179-L2181 | 同文件,低风险 |
| **COUNTY_NAME_TO_CITY / COUNTY_INDEX**:`Object.entries(COUNTY_DATA).forEach(...)` | COUNTY_DATA(同区段)| L2489-L2497 | 同文件,低风险 |
| **ALL_POSTS**:`[...MIL_POSTS, ...CIV_POSTS]` 类似 | MIL_POSTS + CIV_POSTS(同区段)| L2666 附近 | 同文件,低风险 |

**关键决策点 DP-A**:`_CLAN_MAP` 嵌套 IIFE(L2516-L2552)— scout 发现这是一个 **block-scoped IIFE**(`{ const _CLAN_MAP = {...}; Object.entries(_CLAN_MAP).forEach(([name, clan]) => { ... }); }`),内部应是给 GEN_TAGS 或某全局对象添加 clan 字段的逻辑(phase 3.6 carry-over §3 提到 `_CLAN_MAP` 是 `GEN_TAGS 数据装配`)。

**风险**:`_CLAN_MAP` 内部 forEach 依赖 GEN_TAGS(已在 src/data/generals.js 中?——不,GEN_TAGS 在 src/data/tags.js 错位,实测在 generals.js)。如果 _CLAN_MAP IIFE 抽到新文件,加载顺序必须保证 GEN_TAGS 已在 src/data/ 中加载。**实装前必须 read 全段确认 _CLAN_MAP 内部具体逻辑**(scout 阶段未深入阅读)。

---

## 五、squad class 函数(留 v181)— 边界决策点

L2053-L2127 夹在 §D(GEN_CLASS / CLASS_META 数据)和 §E(STATE_CITIES)之间,共 6 个函数 75 行:

```
L2053 function getSquadClass(sq) { ... }            (mechanism, 读 GEN_CLASS)
L2060 function getUnitClassBuffs(unit) { ... }      (mechanism, 读 GEN_CLASS / CLASS_META)
L2082 function getClassDuelWeight(genName, ...) { } (mechanism, 读 GEN_CLASS)
L2090 function genClassTagsHtml(genName) { ... }    (render, 读 GEN_CLASS / CLASS_META)
L2099 function genClassSelectorHtml(genName, ...) { (render, 读 GEN_CLASS / CLASS_META)
L2110 function genClassBuffsHtml(...) { ... }       (render, 调 getUnitClassBuffs)
```

**关键决策点 DP-B**:这 6 个函数 phase 3.12 注释说"留 v181 与 GEN_CLASS 数据捆绑等 sprint",但**捆绑等哪个 sprint?**:
- **(B1)**:本数据 sprint 把 GEN_CLASS / CLASS_META 抽走时,这 6 个函数仍留 v181 — 它们通过同 realm `<script>` 共享 lazy resolve 引用 GEN_CLASS / CLASS_META(同 phase 3 模式)
- **(B2)**:把这 6 个函数也一起搬到新 src/chains/general.js 或新 src/render/squad_class.js — 但 3 个是 mechanism(归 chains/general.js?),3 个是 render(归 src/render/?),拆 2 个文件
- **(B3)**:把 6 个函数搬到一个新 src/data/generals_full.js 或 src/chains/general.js,作为"配套"— 但破坏纯数据原则

**决策(2026-05-05 制作人 approve)**:**B1**(纯数据 sprint,只抽数据,函数留 v181)。

**phase 3 决策延续证据**(显式引用 phase3_12_notes):
- `phase3_12_notes.md §一`(范围段)明确列 squad class 6 函数为"留 v181 / 数据 sprint":`squad class helpers(L2175-L2240):getSquadClass / getUnitClassBuffs / getClassDuelWeight + genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml(留 v181 与 GEN_CLASS 数据捆绑等 sprint)`
- B1 是该决策的直接执行 — 数据搬走时函数继续留 v181,以同 realm `<script>` 共享 lazy resolve(phase 3 多次实测可靠,p3.1 / p3.4 锚点)
- 6 个函数的最终归位(mechanism vs render 拆分)视为**本 sprint 之后的独立工作**,可与 _exec 架构债 sprint 同 batch 处理(均属"phase 3 留 v181 的非数据 helpers 归位")

---

## 六、文件拆分方案(**核心决策点 DP-C — 3 方案完整对比 + 38 const 显式分配**)

桶 2 实测**包含 64 个顶层声明**(简单 const + IIFE 派生 + 嵌套 IIFE-helper):
- **简单 const(数据本体)59 个**:数字 / 数组 / 简单对象,无外部依赖
- **IIFE 派生 const 4 段(产生 5 个 const)**:`ALL_GENS` / `CITY_TO_STATE` / `GENTRY_FAC_TO_STATES` / `COUNTY_NAME_TO_CITY + COUNTY_INDEX`(同段 IIFE 产生 2 个)/ `ALL_POSTS`
- **嵌套 IIFE-helper 1 个**:`_CLAN_MAP`(L2516-L2552,后处理 GEN_TAGS)

下面 3 方案各自把这 64 个声明分到不同文件,显式列出所有 const 名字。

---

### 方案 A:1 大文件 `src/data/static_data.js`(~1842 行)

**全部 64 声明放一个文件**:

| 文件 | 内容(全部 const) | 行数 |
|---|---|---|
| `src/data/static_data.js` | TAX / POLICY / CORVEE / MIGRATE_*(10 const)/ RETAINER_*(4 const)/ BLDS / STAGE_GENTRY_BOUNDS / STAGE_PROMO / SIEGE_AFTERMATH / CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / SQUAD_MAX_TROOPS / UNIT_MAX_TROOPS / BILLET_LEVEL_THRESHOLD / TECH_TREE / TECH_PREUNLOCK / JUNS / GENS_FULL / GEN_META / ALL_GENS / GEN_POOL_INACTIVE / FOUNDING_CORE / GEN_CLASS / CLASS_META / STATE_CITIES / STATE_NAMES / STATE_TIER / CITY_TO_STATE / STATE_TO_GENTRY_FAC / GENTRY_FAC_TO_STATES / CLAN_FAMILIES / MAGNATE_CLANS / COUNTY_DATA / COUNTY_NAME_TO_CITY / COUNTY_INDEX / LOCAL_BONUS_CAP_V170 / COUNTY_CLAN_SENS / COUNTY_TYPE_SENS_V170 / `_CLAN_MAP` IIFE / CORRUPT_PER_CITY / CORRUPT_FREE_CITIES / CORRUPT_CAP / FACTION_DEFS / POST_TIERS / STAGE_TIER1_SLOTS / STAGE_LABEL_CAP / MIL_POSTS / CIV_POSTS / ALL_POSTS / MERIT_INIT / STAGE_LABEL_FLOOR / COURT_PROPOSALS_MIL / COURT_PROPOSALS_CIV(64 声明) | ~1842 |

**优点**:
- 单文件抽离 = 1 个抽象边界,**1 commit 完成**
- 加载顺序只需加 1 个 script tag
- 所有 IIFE 派生在同文件内,**0 跨文件依赖风险**(包括 ALL_GENS 依赖 WILD_GENS — 因为 WILD_GENS 仍在 generals.js,加载在 static_data.js 之前即可)

**缺点**:
- 1842 行单文件偏大(phase 1 events.js 2293 行最大,本文件第二位)
- 内容杂烩(武将 / 州县 / 科技 / 建筑 / 官职 / 朝议 6 大主题混一文件),sprint 之后 audit pass 2 / D 类 fix 时定位某 const 要 grep 1842 行
- 与 phase 1 主题拆分原则不一致(phase 1 拆 6 文件平均 485 行 / 文件)

**取舍**:**简单度最高,可读性 / 可维护性最低**。适合"赶时间一锅端 + sprint 后再拆"。

---

### 方案 B:3 文件按主题(**推荐**)

| 文件 | 包含 const | 估行数 |
|---|---|---|
| **(扩展) `src/data/generals.js`** 现有 242 → ~1109 行 | **(新增 §D 7 const + 1 IIFE 派生)**:GENS_FULL / GEN_META / ALL_GENS(IIFE)/ GEN_POOL_INACTIVE / FOUNDING_CORE / GEN_CLASS / CLASS_META | +867(新增) |
| **(新建) `src/data/state_county.js`** | **§E + §F(11 const + 4 IIFE 派生 + 1 嵌套 IIFE-helper)**:STATE_CITIES / STATE_NAMES / STATE_TIER / CITY_TO_STATE(IIFE)/ STATE_TO_GENTRY_FAC / GENTRY_FAC_TO_STATES(IIFE)/ CLAN_FAMILIES / MAGNATE_CLANS / COUNTY_DATA / COUNTY_NAME_TO_CITY(IIFE)/ COUNTY_INDEX(IIFE)/ LOCAL_BONUS_CAP_V170 / COUNTY_CLAN_SENS / COUNTY_TYPE_SENS_V170 / `_CLAN_MAP` IIFE | ~417 |
| **(扩展) `src/data/constants.js`** 现有 29 → ~587 行 | **§A + §B + §C + §G + §H(剩余 41 const + 2 IIFE 派生)**:TAX / POLICY / CORVEE / MIGRATE_*(10)/ RETAINER_*(4)/ BLDS / STAGE_GENTRY_BOUNDS / STAGE_PROMO / SIEGE_AFTERMATH / CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / SQUAD_MAX_TROOPS / UNIT_MAX_TROOPS / BILLET_LEVEL_THRESHOLD / TECH_TREE / TECH_PREUNLOCK / JUNS / CORRUPT_PER_CITY / CORRUPT_FREE_CITIES / CORRUPT_CAP / FACTION_DEFS / POST_TIERS / STAGE_TIER1_SLOTS / STAGE_LABEL_CAP / MIL_POSTS / CIV_POSTS / ALL_POSTS(IIFE)/ MERIT_INIT / STAGE_LABEL_FLOOR / COURT_PROPOSALS_MIL / COURT_PROPOSALS_CIV | +558(新增) |
| **总计** | 64 声明 | **~1842 新增** |

**优点**:
- **主题清晰**:武将 / 州县 / 杂参数+表,与 phase 1 命名 + 拆分原则一致(generals.js / cities.js / factions.js / tags.js)
- **generals.js 主题统一**:把 §D 合并到现有 generals.js(WILD_GENS / WILD_GEN_META / GEN_TAGS / getGenMeta) → "src/data/generals.js 一个文件 = 全部武将数据",audit / fix 时单文件定位
- **`_CLAN_MAP` IIFE 自然落 state_county.js**(它装配 GEN_TAGS,但 GEN_TAGS 在 generals.js 早加载,跨文件 lazy resolve)
- 3 文件抽离 = 3 sub-session(DP-D 通过)
- **取舍中庸**:可读性 + 简单度平衡

**缺点**:
- 3 文件 = 3 个 script tag,加载顺序需要安排(state_county.js 必须在 generals.js 之后)
- constants.js 扩展后 ~587 行,**杂参数 / 大表混在一起**(BLDS / TECH_TREE / FACTION_DEFS / 朝议提案 / STAGE_* 等)
- generals.js 扩展到 ~1109 行,接近 phase 1 events.js 体量(但主题统一 OK)

---

### 方案 C:5 文件细分

| 文件 | 包含 const | 估行数 |
|---|---|---|
| **(扩展) `src/data/generals.js`** 现有 242 → ~1109 行 | §D 7 const | +867 |
| **(新建) `src/data/state_county.js`** | §E + §F 15 声明 | ~417 |
| **(新建) `src/data/tech_buildings.js`** | TECH_TREE / TECH_PREUNLOCK / BLDS / SQUAD_MAX_TROOPS / UNIT_MAX_TROOPS / BILLET_LEVEL_THRESHOLD | ~168 |
| **(新建) `src/data/posts_court.js`** | POST_TIERS / STAGE_TIER1_SLOTS / STAGE_LABEL_CAP / MIL_POSTS / CIV_POSTS / ALL_POSTS(IIFE)/ MERIT_INIT / STAGE_LABEL_FLOOR / COURT_PROPOSALS_MIL / COURT_PROPOSALS_CIV(10 声明) | ~184 |
| **(扩展) `src/data/constants.js`** 现有 29 → ~235 行 | TAX / POLICY / CORVEE / MIGRATE_*(10)/ RETAINER_*(4)/ STAGE_GENTRY_BOUNDS / STAGE_PROMO / SIEGE_AFTERMATH / CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / JUNS / CORRUPT_PER_CITY / CORRUPT_FREE_CITIES / CORRUPT_CAP / FACTION_DEFS | +206 |
| **总计** | 64 声明 | **~1842 新增** |

**优点**:
- **最细粒度,主题最清晰**:5 文件平均 ~370 行,**audit 时定位最快**(科技/建筑 → tech_buildings.js;官职/朝议 → posts_court.js)
- 每文件单一主题(generals / 地理州县 / 科技建筑参数 / 官职朝议 / 杂参数)
- 边界后续 audit 演进时不需要再拆

**缺点**:
- 5 文件 = 5 script tag,加载顺序更复杂(虽然只需保证 generals 在 state_county 之前,其他无序)
- 5 sub-session(超 DP-D 制作人 approve 的 3 sub-session)— 抽离时间 / commit 数翻倍
- **边界判定歧义**:`STAGE_GENTRY_BOUNDS / STAGE_PROMO / STAGE_LABEL_CAP / STAGE_LABEL_FLOOR / STAGE_TIER1_SLOTS` 是政治阶段相关,部分归 constants 部分归 posts_court,sprint 时拍板成本高
- `JUNS` 是郡数据(L1130,与 STATE_/COUNTY_ 主题相关),归 constants 还是 state_county?有歧义

---

### 取舍对比表

| 维度 | 方案 A(1 文件)| **方案 B(3 文件)推荐** | 方案 C(5 文件)|
|---|---|---|---|
| 文件数 | 1 新建 | 1 新建 + 2 扩展 | 3 新建 + 2 扩展 |
| 抽离 sub-session 数 | 1(超 DP-D 范围)| **3(对齐 DP-D)** | 5(超 DP-D 范围)|
| 加载顺序复杂度 | 极简(+1 tag)| 中(+1 tag,保持 generals 早于 state_county)| 高(+3 tag) |
| 主题清晰度 | 低(6 主题混)| 中(3 主题,但 constants 仍混)| 高(5 单一主题)|
| 与 phase 1 一致性 | 低 | **高** | 中 |
| audit 定位成本 | 高(grep 1842 行)| 中(grep ~600 行 / 文件)| 低(grep ~370 行 / 文件)|
| sub-session 边界歧义 | 无 | 低 | 中(STAGE_* / JUNS 归属)|
| 风险等级 | 中(单文件 1842 行 verbatim 风险)| **低**(分 3 块,按 phase 1 模板)| 低 |
| 抽离时间(估)| 1 commit / 半天 | **3 commit / 1 天** | 5 commit / 1.5 天 |

### 推荐:**方案 B(3 文件,与 DP-D 3 sub-session 对齐)**

**核心理由**:
1. **与 phase 1 拆分粒度一致**(phase 1 拆 6 文件平均 485 行,本 sprint 3 新增/扩展平均 ~614 行,同量级)
2. **主题清晰但不过度细分**:武将 / 州县 / 杂参数+表 — 各主题自然内聚
3. **generals.js 主题统一**:武将所有静态数据落同一文件(现有 242 行 WILD_GENS / GEN_TAGS + 新增 867 行 GENS_FULL / GEN_META 等 = ~1109 行),audit 单点切入
4. **DP-D 制作人 approve 3 sub-session**,方案 B 是唯一对齐的拆分;A 强行 1 sub-session,C 强行 5 sub-session 都不对齐
5. **风险最低**:每 sub-session 抽 ~600 行,smoke 守底单点暴露窗口小;失败时回滚单 sub-session 不影响其他

---

## 七、加载顺序候选位置

新数据文件加载位置(基于 phase 3 终态加载顺序):

```html
<script src="src/core/state.js"></script>           ← 状态根,最前
<script src="src/data/constants.js"></script>       ← 扩展(本 sprint 加内容)
<script src="src/data/tags.js"></script>
<script src="src/data/events.js"></script>
<script src="src/data/generals.js"></script>        ← 扩展(合并 generals_full)/ 或 generals_full.js 在此之后新增
<script src="src/data/state_county.js"></script>    ← 新增,在 generals 之后(因 _CLAN_MAP 可能依赖 GEN_TAGS)
<script src="src/data/cities.js"></script>
<script src="src/data/factions.js"></script>
<script src="src/core/helpers.js"></script>
... (后续 phase 3 文件不变)
```

**约束**:
- `state_county.js` 必须在 `generals.js` 之后(`_CLAN_MAP` IIFE 可能依赖 GEN_TAGS)— 实装前 read 全段确认
- `constants.js` 扩展不影响顺序(现有最早位置可保留)
- `cities.js` 已有 IIFE 依赖 hexToPixel(留 v181 forEach 行,phase 1 决定)— 与本 sprint 无关

---

## 八、决策点总结(等制作人 approve)

| 决策点 | 内容 | 推荐 | 备选 |
|---|---|---|---|
| **DP-A** | `_CLAN_MAP` 嵌套 IIFE(L2516-L2552) | **(scout 阶段已 read 全段)** 内容确认:依赖 `CLAN_FAMILIES`(同区段 §E,本 sprint 抽到 state_county.js)+ `GEN_TAGS`(已在 src/data/generals.js)。功能:给特定武将名加 clan 字段(33 个武将 → CLAN_FAMILIES 引用)。**搬到 state_county.js 安全**,加载顺序保证 generals.js 早于 state_county.js 即可(DP-A 风险确认**可控**)| 留 v181(否决,函数依赖关系简单清楚)|
| **DP-B** | squad class 6 函数(L2053-L2127,75 行)归属 | **B1**:留 v181(纯数据 sprint,函数留作 mechanism/render sprint 处理)| B2 拆 2 文件;B3 一锅搬到 generals_full.js |
| **DP-C** | 文件拆分方案 | **方案 B**:3 文件(generals_full 合并到 generals.js + state_county.js + constants.js 扩展)| A 1 大文件;C 5 细分 |
| **DP-D** | 抽离顺序(sub-session 划分) | **3 sub-session,顺序 S1 → S3 → S2**(制作人 approve,最低风险到稍高风险):S1 generals 扩展(§D 7 const,~867 行,跨文件依赖只 1 处 ALL_GENS→WILD_GENS)/ S3 constants 扩展(§A+§B+§C+§G+§H 41 const + 2 IIFE 派生,~558 行,大表多但 IIFE 内向)/ S2 state_county 新建(§E+§F 11 const + 4 IIFE 派生 + 1 嵌套 IIFE-helper,~417 行,**风险最高**因 _CLAN_MAP 跨文件依赖 GEN_TAGS)。每 sub-session 独立 smoke + commit | 1 大 sub-session;6 sub-session 过度细分;S1→S2→S3 顺序也可(scout / Node 双脚本能控)|
| **DP-E** | 工作流原则 | **沿用 phase 3 全部原则**:scout-before-extract / Node 双脚本 / scout 四件验证 / ranges 无嵌套 / docstring 不跨切 | — |
| **DP-F** | branch 命名 | **`refactor/data-completion`**(见下方"DP-F 命名建议")| `refactor/p1-data-extension` / `sprint/data-static`(后者**否决**,见下) |
| **DP-G** | baseline 策略 | 全程 baseline = `tests/baseline/phase3_complete.json`,smoke byte-identical 守底;sprint 末锁 `tests/baseline/sprint_data_complete.json`(扩展 phase 1+2+3 模式)| 不锁新 baseline(view 本 sprint 为 fixup)|

---

## 八.5、DP-F 命名建议(branch 命名重新讨论)

### 命名问题

scout 报告原写"sprint/data-static",但**`sprint` 在本项目 `cross_chain_d_list_v1_0.md §七` 专指"修 D 类"工作**(audit pass 2 / D 类去重 / 跨链 fix 等修代码动作)。本工作本质是:

- **纯 verbatim 搬运**(phase 1 / phase 3 chain 阶段相同模式)
- **smoke byte-identical 守底**(0 行为漂移)
- **0 D 类主动 fix**(CLAUDE.md 硬规则)

→ 本质上是 **phase 1 数据层抽离的延续 / 补完**,不是 sprint。

### 候选命名 + 取舍

| 候选 | 含义 | 优点 | 缺点 | 推荐度 |
|---|---|---|---|---|
| **`sprint/data-static`** | 把"数据搬运"叫 sprint | — | **与 `cross_chain_d_list §七` "sprint = 修 D 类"冲突**;混淆"修代码"和"搬代码"两种工作的本质区别;对项目历史可读性有害(后续 audit 翻 git log 时 "sprint" prefix 会触发"这是修 D 类工作"的预期)| **否决** |
| **`refactor/data-completion`** | "数据层抽离的补完"(承接 phase 1 6 个 data 文件)| ① 表明本质是 refactor 类工作(verbatim 搬运)② "data-completion" 暗示 phase 1 数据层 audit pass 1 漏掉的 ~1842 行 + ~75 行 squad class 数据补抽 ③ 简洁中性,后续 audit 翻 git log 时清楚 ④ 与 phase 3 子分支 `refactor/p3.x-*` 命名一致 | "completion" 略激进(暗示数据层抽完,实际还有 squad class 6 函数 + render 文件部分参数 const 留 v181) | **强推** |
| **`refactor/p1-data-extension`** | "phase 1 数据层延伸"(更明确指向 phase 1)| ① 直接挂 phase 1 ② "extension" 表明这是 phase 1.x 后续 ③ git log 时翻到 phase 1 commits 对照清楚 ④ 与 phase 1 sub-session prefix 风格一致(p1.1-p1.7)| ① 命名稍长 ② "p1-extension" 暗示这是 phase 1 的子 session,但 phase 1 已 merged + tag,严格意义上不能延伸 phase 1 ③ 与 cross_chain_d_list / GDD 不一致(它们用 "phase N" 不用 "pN") | 备选 |
| `refactor/data-sprint`(混合)| 表明 refactor + 涉及多 sub-session | 简洁 | "sprint" 仍触发"修 D 类"误判 | 否决 |
| `refactor/audit-pass-2-data`(歧义)| 把这视为 audit pass 2 的数据子项 | 与 audit pass 概念挂钩 | audit pass 2 严格指 D 类去重 / 修 fix,本工作是搬代码,不属 audit pass 2 | 否决 |

### 推荐:**`refactor/data-completion`**

**核心理由**(对应制作人提示"命名不影响动作,但影响项目历史可读性"):

1. **避开 sprint 命名陷阱**:`cross_chain_d_list §七` 里 "sprint" = "修 D 类",本工作 0 D 类主动 fix,严格不属 sprint
2. **`refactor/` prefix 与 phase 3 工作分支一致**:`refactor/phase-3` / `refactor/p3.x-*` 都是 refactor prefix,本分支用 `refactor/data-completion` 与项目历史一脉相承
3. **`data-completion` 语义**:这是 phase 1 数据层抽离的"补完"(phase 1 抽 2913 行,本工作再抽 ~1842 行,phase 1 audit pass 1 漏掉的部分补抽;squad class 6 函数 + 部分 render 文件参数 const 仍留 v181 / phase 3 决策 → "completion" 不是绝对完整,而是相对 phase 1 数据范围的补完)
4. **项目历史可读性**:后续 audit / phase 4 启动时翻 git log 看到 `refactor/data-completion`,立刻明白"这是 phase 1 后期的数据补抽工作,不是 D 类 fix"

### sub-session commit 命名(派生)

按 phase 3 风格:

```
refactor(dc.S1): extract §D generals data to src/data/generals.js (扩展)
refactor(dc.S3): extract §A+§B+§C+§G+§H constants to src/data/constants.js (扩展)
refactor(dc.S2): extract §E+§F state+county to src/data/state_county.js (新建,含 _CLAN_MAP IIFE)
test(dc.collect): lock data_completion_complete baseline + write data_completion_summary
```

(`dc` = data-completion 缩写,与 phase 3 `p3.x` 风格一致;**或**用全名 `refactor(data-completion S1): ...`,稍长但更清楚)

---

## 九、本 refactor/data-completion 完成后的预期

(命名按 DP-F 推荐;若选 `refactor/p1-data-extension` 数字相同)

| 指标 | 起点(main `ddf50c0`)| 预期终点 | 变化 |
|---|---|---|---|
| project_romance_v181.html 行数 | 17391 | **~15549**(-1842) | -10.6% |
| src/data/ 文件数 | 6 | **7**(方案 B:扩展 generals.js + 扩展 constants.js + 新建 state_county.js)| +1 |
| src/data/ 总行数 | 2913 | **~4755**(+1842) | +63% |
| 项目代码总行数 | 42250 | ~42250(基本不变,header 增量微小) | 微增 |
| src/ 总文件数 | 26 | **27** | +1 |
| smoke baseline | phase3_complete.json | phase3_complete.json(全程)+ `data_completion_complete.json`(末)| +1 baseline |
| D 类自然 close | 2 | 2(0 主动 fix,严守 CLAUDE.md 硬规则)| 不变 |
| git tag(baseline 归档)| phase3-complete-archive | + `data-completion-archive` | +1 tag |

---

## 十、风险评估

| 风险 | 等级 | 缓解 |
|---|---|---|
| 跨文件 const lazy resolve 失败 | **低** | phase 3 多次实测可靠(p3.1 / p3.4 锚点);加载顺序保证 |
| `_CLAN_MAP` IIFE 内部依赖 GEN_TAGS 错乱 | **中** | 实装前 read 全段确认 + smoke layer-1+layer-2 守底 |
| 大对象搬运字符替换(中文标点) | **低** | phase 3 原则 #8 Node 双脚本(共享 ranges)预防 |
| 边界 off-by-one 漏函数 | **低** | phase 3 原则 #9 scout 四件验证 + 嵌套 IIFE 边界仔细 |
| docstring 跨 range 切片 | **低** | phase 3 原则 #9 补充,本 sprint 桶 2 数据基本无 docstring |
| smoke 行为漂移 | **极低** | 纯数据 verbatim 搬运,smoke 应 byte-identical |

---

## 十一、scout 报告生效边界

**本报告范围内**:
- 桶 2 静态数据 const 抽离方案 + 3 文件候选(方案 B 推荐)+ 38 const 显式分配 + 加载顺序 + 工作流
- DP-A 至 DP-G 决策点 + DP-F 命名详细论证
- DP-A `_CLAN_MAP` IIFE 全段已 read(scout §四,风险确认可控)
- 实装前还需:scout 四件验证(原则 #9)+ 边界 read 前后 5-10 行(原则 #9 补充,docstring 不跨切)

**不在本报告范围**:
- _exec 架构债 work(`phase3_summary §10.5`,与本工作解耦,留后续讨论)
- D 类 fix sprint(选项 1,真 sprint = 修 D 类,工作流不同,需要单独讨论新验证机制)
- phase 4 渲染层(选项 4,优先级低)
- 接口风格段 fixup(选项 5,**已完成 + pushed,见 main commit `ddf50c0`**)

---

## 十二、本对话决策点状态总结(2026-05-05)

| DP | 状态 | 决议 |
|---|---|---|
| DP-A | ✅ 通过 | 实装前 read `_CLAN_MAP` 全段 — **scout 阶段已完成**,内容确认依赖 CLAN_FAMILIES + GEN_TAGS,搬到 state_county.js 可控 |
| DP-B | ✅ 通过 | B1 留 v181(squad class 6 函数),延续 phase3_12_notes §一 决策 |
| DP-C | ✅ 通过(本次补完后)| **方案 B**:3 文件(扩展 generals.js + 扩展 constants.js + 新建 state_county.js),38 const 已显式分配(本报告 §六)|
| DP-D | ✅ 通过 | 3 sub-session,**顺序 S1 → S3 → S2**(最低风险到稍高风险)|
| DP-E | ✅ 通过 | 沿用 phase 3 全部 5 工作流原则 |
| DP-F | ✅ 通过(本次补完后)| **`refactor/data-completion`**(`sprint/*` 否决,与 cross_chain_d_list §七 sprint=修 D 类冲突)|
| DP-G | ✅ 通过 | 全程 phase3_complete.json 守底 + 末锁 `data_completion_complete.json` baseline + `data-completion-archive` tag |

**全部 7 决策点拍板,可启动实装**。

---

(Scout 报告完结 — 全部决策点拍板。**新对话启动 `refactor/data-completion` 实装,带:CLAUDE.md / phase3_summary.md / docs/sprint_data_scout.md / 本对话 7 决策点反馈**)
