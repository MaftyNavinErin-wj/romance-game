# refactor/data-completion Summary — 桶 2 静态数据补完

> 阶段:refactor/data-completion(phase 3 收官后的 phase 1 数据层补完,**不属于 phase 4 / sprint**)
> 完成日期:2026-05-05
> 起始 commit:`ddf50c0`(phase 3 merged + 接口风格段 fixup pushed)
> 结束 commit:见末尾"refactor/data-completion → main 合并"段
> 命名理由:**phase 1 数据层抽离的延伸 / 补完**(纯 verbatim 搬运,smoke byte-identical 守底,0 D 类主动 fix);**不命名 sprint** 因 cross_chain_d_list §七 sprint 专指"修 D 类"工作

---

## 一、目标 vs 实际

phase3_summary §10.0 实测桶 2 静态数据集中区:**v181 L838-L2754,1917 行**(含 squad class 6 函数 75 行留 v181)。**纯数据 + 派生 IIFE,无 G 引用**。本工作把这 1842 行可抽数据搬到 `src/data/`,phase 1 数据层从 6 文件 2913 行扩到 7 文件 4655 行。

| 指标 | 起点(`ddf50c0`)| 终点(`9eb3216`)| 变化 |
|---|---|---|---|
| project_romance_v181.html 行数 | 17391 | **15656** | **-1735(-10.0%)** |
| src/data/ 文件数 | 6 | **7** | +1(state_county.js 新建) |
| src/data/ 总行数 | 2913 | **4746** | +1833 |
| 抽出统计 | — | **1742 行 verbatim**(855+468+419)| **65 顶层 const + 5 IIFE 派生 + 1 嵌套 IIFE-helper(_CLAN_MAP)** |
| 实装阶段 bug | — | **1**(S2 行号偏移)| 已修复 + 沉淀新原则 #11 |
| 新工作流原则 | — | **+1(#11)**:新建文件时 replace 在前 script tag 在后 | 写入 docs/refactor_workflow_principles.md |
| smoke baseline | phase3_complete.json | **+ data_completion_complete.json** | 4 baseline 共存 |
| D 类自然 close | 0 | 0(纯数据 sprint **0 主动 fix**)| 不变 |

---

## 二、Sub-session 进度

| Sub-session | Commit | 抽出文件 / 函数数 | v181 减重 | bug | 关键决策 |
|---|---|---|---|---|---|
| **dc.0** scout 报告 | `7a3a704` | docs/sprint_data_scout.md(401 行,7 决策点 approved)| — | — | 7 决策点拍板,scout 完整 boundary 报告 |
| **dc.S1** §D generals 扩展 | `362d603` | `src/data/generals.js` 242 → 1123(+881) | -853 | 0 | DP-D 顺序第 1 步(最低风险);scout 报告漏检 GEN_MAP let + 2 phase 3 markers 夹中间(L1964-L1973),实测发现需 **2 段不连续 range** |
| **dc.S3** §A+§B+§C+§G+§H constants 扩展 | `9e1197c` | `src/data/constants.js` 29 → 522(+493) | -465 | 0 | DP-D 顺序第 2 步;**scout 估 558 行实测 468 行**(差 90 行,见 §三诚实纠错) |
| **dc.S2** §E+§F state_county 新建 | `9eb3216` | `src/data/state_county.js` 0 → 459(+459,新建) | -417 | **1**(行号偏移)| DP-D 顺序第 3 步(风险最高);_CLAN_MAP IIFE 跨文件依赖 GEN_TAGS 实测可控;**实装 bug 沉淀新原则 #11**(replace 在前 script tag 在后) |
| **dc.collect** 收尾 | (本 commit)| docs/data_completion_summary.md + docs/refactor_workflow_principles.md + tests/baseline/data_completion_complete.json | — | — | 全量 smoke 3 次稳定;锁 baseline;tag `data-completion-archive`;merge `--no-ff` 到 main |

---

## 三、scout 估算精度纠错(诚实记录)

> **dc.S3 实测 vs scout 估算偏差 90 行**,**不是 marker 占位**问题,**是 scout 估算精度问题**。诚实写入本 summary。

### scout 估算逻辑(原 sprint_data_scout.md §六 方案 B)
```
§A 杂参数 60 + §B 建筑等 87 + §C 科技+郡 191 + §G 腐败+派系等 146 + §H 朝议 38 = 522 行
(scout 报告写 ~558,本身已偏 36 行,scout 用粗估 / 范围加和未扣 phase 3 markers)
```

### 实测真实(dc.S3 commit message)
```
range A (§A+§B): L838-L984    = 147 行(scout 估 60+87 = 147,精确)
range B (§C):    L995-L1143   = 149 行(scout 估 191,**偏 +42 行**)
range C (§G+§H): L1700-L1871  = 172 行(scout 估 146+38 = 184,**偏 -12 行**)
合计 verbatim = 468 行
```

### 偏差根因(诚实记录)

**真正原因**:scout 估算 §C "191 行" 是**用 const 起始行号粗算**(原 v181 L995 TECH_TREE 起到 L1185 JUNS 末区间 = 191),但区间内实际:
- L985-L994 是 §B/§C 之间的 phase 3 marker + section header(已抽离的经济链 E1 marker 等),**这 10 行不属 §C 数据**,但 scout 估算把它们算进 §C 起点
- §C 区间 L995-L1143 是 149 行,**比 scout 估的 191 少 42 行**

**§G+§H 同样**:scout 估 184 行实测 172 行,差 12 行因 const 之间的 docstring + 注释行 scout 算估时偏多。

**纠错措辞**:
- ❌ 不写"差 90 行因 marker 占位"(这是错误归因)
- ✅ 写"scout 估 558 行实测 468 行,**差 90 行是 scout 估算精度问题**"(诚实记录原因)

### 教训

**scout 估算行数应该 ±20% 容忍**,不是绝对精确。data-completion 实装时以 grep + awk 实测为准,不照 scout 字面估抽。

---

## 四、实装 bug 详情 + 新工作流原则 #11

### dc.S2 bug:script tag 偏移导致 ranges 错位

**症状**:
- 初次 attempt 顺序:① build state_county.js ② 加 script tag ③ run replace ④ smoke FAIL(SyntaxError: Unexpected token `}`)
- 错误位置:v181.html:152(inline script 内 line 152 = v181 file L981)
- 根因:加 script tag(+1 行)后,§E+§F 实际位置从 `[981, 1399]` 偏移到 `[982, 1400]`,但 replace 仍用 scout ranges `[981, 1399]`,导致漏抽 _CLAN_MAP block IIFE closing `}`(原 L1399)→ stray `}` 残留 v181 → SyntaxError

### 修复

**回滚 + 调换顺序**:
1. `git checkout project_romance_v181.html`(撤回 script tag + replace 改动)
2. **先 run replace**(此时 v181 行号与 scout 一致,replace 干净)
3. **再加 script tag**(此时 §E+§F 已抽走,行号偏移无害)
4. smoke PASS

### 新原则 #11(写入 `docs/refactor_workflow_principles.md` §七)

**新建数据文件 / 新建 chain 文件 / 任何需要在 v181 加新 `<script src=...>` 的工作**:**replace 必须在 script tag 之前完成**。

详细操作规范见 `docs/refactor_workflow_principles.md` §七。phase 4 / 后续 sprint 必须遵循。

---

## 五、关键设计决策(7 决策点全 approved)

| DP | 内容 | 决议 | 实装结果 |
|---|---|---|---|
| **DP-A** | `_CLAN_MAP` IIFE(原 L2516-L2552 / 当前 L1368-L1399)处理 | scout 阶段已 read 全段,确认依赖 CLAN_FAMILIES(同文件)+ GEN_TAGS(generals.js,跨文件),搬到 state_county.js 可控 | dc.S2 实装 PASS,加载顺序 generals.js 早于 state_county.js |
| **DP-B** | squad class 6 函数(L2053-L2127)归属 | **B1 留 v181**(纯数据 sprint,函数留作 mechanism/render sprint 处理)| 延续 phase3_12_notes §一 决策 |
| **DP-C** | 文件拆分方案 | **方案 B**:扩展 generals.js + 扩展 constants.js + 新建 state_county.js | 3 文件按主题清晰 |
| **DP-D** | sub-session 划分 | **3 sub-session,顺序 S1 → S3 → S2**(最低风险到稍高风险)| dc.S1 / S3 / S2 完整执行 |
| **DP-E** | 工作流原则 | 沿用 phase 3 全部 5 原则 | 实装期间应用 + 新增 #11 沉淀 |
| **DP-F** | branch 命名 | **`refactor/data-completion`**(`sprint/*` 否决)| commit 命名 `refactor(dc.SN)` |
| **DP-G** | baseline 策略 | 全程 phase3_complete.json 守底 + 末锁 data_completion_complete.json | 本 commit 完成 |

---

## 六、Smoke 验证 + baseline 锁定

### 6.1 阶段全程 smoke 状态

每 sub-session 抽离前后均跑全字段比对 `tests/baseline/phase3_complete.json`,**全部 PASS,0 行为漂移**。

证据:终点(commit `9eb3216`)的 snapshots SHA256 = `phase3_complete.json` 的 snapshots SHA256 = `96ac5372...d1abf190`。**整 data-completion 对游戏 state 行为 byte-identical 0 影响**。

### 6.2 data_completion_complete.json baseline 锁定(dc.collect)

dc.collect 跑 3 次完整 smoke 验证稳定性:

| 跑次 | snapshots SHA256 | compare vs phase3_complete |
|---|---|---|
| run 1 | `96ac5372...d1abf190` | ✅ PASS |
| run 2 | `96ac5372...d1abf190` | ✅ PASS |
| run 3 | `96ac5372...d1abf190` | ✅ PASS |

**3 次 byte-identical 稳定 → 锁 `tests/baseline/data_completion_complete.json`**(snapshots 与 phase3_complete.json 完全等价,meta.generated_at 不同)。

`tests/baseline/` 终态:

| baseline 文件 | 用途 |
|---|---|
| `phase1_post.json` | layer-1+layer-2 phase 1 末权威基线 |
| `phase2_complete.json` | layer-1+layer-2 phase 2 末权威基线 |
| `phase3_complete.json` | layer-1+layer-2 phase 3 末权威基线(整 data-completion 直接基线)|
| `data_completion_complete.json` | layer-1+layer-2 data-completion 末权威基线(本 commit,后续 sprint 基线)|

**4 baseline 共存模式**(phase 1+2+3 + data-completion 累积)。`data-completion-archive` git tag 锚定本工作 baseline。

---

## 七、文件清单(data-completion 终态)

### src/data/(7 文件,从 phase 1 6 文件扩展)

| 文件 | 行数(终)| 来源 phase | 内容 |
|---|---|---|---|
| `data/cities.js` | 182 | 1.3 | CITIES_DEF / CITY_MAP / 3 region Sets/helpers / ROADS / ROAD_ADJ / RIVERS |
| `data/constants.js` | **522** | 1.5 + **dc.S3** | 跨文件硬编 magic number(EVENT_CAT_COOLDOWN / REPUTATION_DEFAULT)+ §A+§B+§C+§G+§H 杂参数 + 大表(44 const + 1 IIFE 派生 ALL_POSTS) |
| `data/events.js` | 2293 | 1.1 | EVENT_DEFS 34 def / 8 categories |
| `data/factions.js` | 65 | 1.4 | FAC / ALL_FACS / PLAYABLE_FACS / FAC_IDENTITY / ETHOS_INIT / DIPLO_INIT |
| `data/generals.js` | **1123** | 1.2 + **dc.S1** | WILD_GENS / WILD_GEN_META / GEN_TAGS / getGenMeta + §D 武将主表(7 const + 1 IIFE 派生 ALL_GENS) |
| `data/state_county.js` | **459** | **dc.S2(新建)** | §E+§F 州体系 + 县属性 + clan 装配 IIFE(14 const + 4 IIFE 派生 + 1 嵌套 IIFE-helper `_CLAN_MAP`) |
| `data/tags.js` | 102 | 1.6 | SEASONS+SEASON_MOD+YEARS / TAGS+getCityStats / STAGE_NAMES+STAGE_ORDER / ETHOS schema+_ethosTierLabel |
| **合计** | **4746** | | **65 顶层 const + 5 IIFE 派生 + 1 嵌套 IIFE-helper** |

### 加载顺序(data-completion 终态)

```html
<script src="src/core/state.js"></script>           ← 状态根,最前
<script src="src/data/constants.js"></script>       ← phase 1.5 + dc.S3 扩展(数据多)
<script src="src/data/tags.js"></script>
<script src="src/data/events.js"></script>
<script src="src/data/generals.js"></script>        ← phase 1.2 + dc.S1 扩展
<script src="src/data/state_county.js"></script>    ← dc.S2 新建(必须在 generals.js 之后,_CLAN_MAP 装配 GEN_TAGS)
<script src="src/data/cities.js"></script>
<script src="src/data/factions.js"></script>
<script src="src/core/helpers.js"></script>
... (后续 phase 3 文件不变)
```

**约束**:`state_county.js` 必须在 `generals.js` 之后(`_CLAN_MAP` IIFE 写 GEN_TAGS[name].clan,GEN_TAGS 在 generals.js)。同 realm classic <script> 共享 script-scope(p3.1 / p3.4 验证锚点)。

---

## 八、工作流原则沉淀(新原则 #11)

详见 `docs/refactor_workflow_principles.md`(本工作新建,集中收录 phase 3 #5-#10 + dc.S2 #11)。

### 新原则 #11(本工作沉淀):新建文件时 replace 在前 script tag 在后

**普适规则**:任何新建数据 / chain / core / render 文件,需要在 v181 加 `<script src=...>` 标签的工作:

```
✅ 正确顺序:
  1-3. scout / build / 验证
  4. ⭐ Run replace 脚本 → v181 缩短(此步行号必须与 scout 一致)
  5. ⭐ 加 script tag 到 v181.html(此步在 replace 之后,行号偏移无害)
  6. Smoke 验证 + commit

❌ 错误顺序(dc.S2 初次 attempt):
  1-3. scout / build / 验证
  4. 加 script tag(+1 行偏移)
  5. Run replace(用未偏移的 ranges)→ 漏抽边界 → SyntaxError
```

### 适用范围

- 新建数据文件(如 dc.S2 state_county.js)
- 新建 chain 文件 / core 文件 / render 文件(若有未来抽离)
- **任何需要在 v181 加新 script tag 的工作**

**不适用**:扩展现有文件(append 模式,无新 script tag 需求,如 dc.S1 / dc.S3)。

### 7 原则总览(phase 3 + dc 累积)

| # | 原则 | 起 sub-session | 触发教训 |
|---|---|---|---|
| #5 | scout-before-extract | p3.3 | plan vs 实测偏差 |
| #6 | chains/*.js 6 项 header(chain 阶段专用) | p3.5 | chain 模板首次设计 |
| #7 | awk 边界用 wc -l 验证 | p3.6 | awk 漏 1 行 closing |
| #8 | Node 双脚本(共享 ranges)代替手打 | p3.7 | 中文标点字符替换 |
| #9 | scout 四件验证 + #9 补充(docstring 不跨切) | p3.8 / p3.12 | 4 个 bug 同源 + dangling docstring |
| #10 | ranges 无嵌套 inclusion | p3.11 | 嵌套 range 卡死 iter |
| **#11** | **新建文件时 replace 在前 script tag 在后** | **dc.S2** | **script tag 偏移 ranges 错位** |

---

## 九、dc 后 v181 剩余审查(6 桶实测重测)

> phase3_summary §10.0 的 6 桶分类基于 v181 17391 行(phase 3 末)。dc 完成后 v181 = 15656 行,本节用 grep + awk + wc 实测重测各桶,**不引用 phase3_summary 旧数字**。phase 4 / 后续 sprint 启动决策必读。

### 9.1 dc 后 v181 结构实测(L 行号 = current v181 post-dc)

**inline script 结构**(2 段):
- L1-L830:HTML shell + style + button bar + canvas(**830 行**,unchanged)
- L831 `<script>` → L14257 `</script>` = inline script 第一段(13427 行)
- L14258-L14336 = 中间段(79 行,含 `<script>` 间隔 + 剩余 closing tags)
- L14337 `<script>` → L15632 `</script>` = inline script 第二段(1296 行,顶层 `_debug` 调试块)
- L15633-L15656 = 收尾 closing tags + tail(24 行)

### 9.2 dc 后 6 桶分类(实测)

| 桶 | 关键行号 | 行数 | % | dc 前 (phase3_summary §10.0) | 变化 | 内容 |
|---|---|---|---|---|---|---|
| **桶 1**:HTML shell + style + button bar | L1-L830 | **830** | 5.3% | 830(4.8%)| **不变** | `<head>` + `<style>` + `<body>` + `.topbar` + canvas + main `<script>` opening |
| **桶 2**:顶层静态数据 const **残余**(数据 sprint 后)| L831-L1186 | **356** | 2.3% | ~2063(11.9%)| **-1707**(-82.7%) | dc/phase 3 markers (~30 行) + squad class 6 函数 (L907-L985, 75 行) + 散在 section headers + GEN_MAP let (L1188-L1190 区域) + 散在注释空行. **dc 已抽 1742 行 verbatim 到 src/data/(constants.js / generals.js / state_county.js)** |
| **桶 3**:渲染层尾巴(留 v181 / phase 2 原则)| L1187-L11856 散在 | **~10670** | ~68.2% | ~5500(31.6%)| **不变量级**(行号偏移)| 8 right tabs + renderRight(L2399/L2575/L2749/L2922/L3442/L3648/L3909/L4040/L11404)+ 战斗动画 ~2517 行 + 各 modal HTML 构造 + 各 modal handler. **(此区段同时含散在的 mechanism helpers / 顶层 lets,与桶 6 部分混杂,精确切分困难,粗归桶 3)** |
| **桶 4**:_exec 派发(架构债)| L13381-L14000 | **620** | 4.0% | 620(3.6%)| **不变** | 36 个 _execXxx(plan 字面 39 实测 36;**phase 3 已知架构债,sprint 5 batch 处理**,见 phase3_summary §10.5)|
| **桶 5**:reset+serialize+boot 集中点 | L11857-L13380 区域 | **~1524** | ~9.7% | ~1000(5.7%)| **+524**(范围扩,此区段也含 boot 周围其他 mechanism)| `loadFromSlot`(L11857)/ `showTitleScreen`(L11877)/ `_exitGame`(L11918)/ `backToTitle`(L11928,M4 carry-over §1 集中 reset 20+ lets)/ saveGame meta + slot codec / 顶层 boot call |
| **桶 6**:顶层杂项 + 第二段 _debug script | L14001-L14336 + L14337-L15632 + L15633-L15656 散在 | **~1656** | ~10.6% | ~7378(42.4%)| **-5722**(范围重定义)| _exec 后到第一段 script 末(L14001-L14257, 257 行)+ 中间段(L14258-L14336, 79 行)+ **第二段 inline `<script>` `_debug` 调试块**(L14337-L15632, **1296 行**)+ closing tail(L15633-L15656, 24 行)+ 散在桶 3 区内未精确切出的顶层 lets(粗估几十行,精确无法分) |
| **总计** | — | **15656** | 100% | 17391 | **-1735** | |

### 9.3 桶 6 范围重定义说明(诚实记录)

phase3_summary §10.0 桶 6 估 ~7378 行(42.4%),是把 inline script 内"非 _exec 非顶层 const"的顶层 lets / mechanism helpers / 工具 / 第二段全部归桶 6 的 **catch-all 估算**(estimate)。

dc 实测后采取**更精确的边界划分**:
- **桶 6 严格定义**:_exec 后段 + 中间段 + 第二段 _debug + closing tail = **~1656 行**(不再含散在 mechanism helpers)
- **散在的 mechanism helpers / 顶层 lets**:**归桶 3**(渲染层 + 机制 mixed,本就难精确切分)

**这不是 dc 工作改动了内容**,而是分桶方法精化:**phase3_summary §10.0 桶 6 是 catch-all 粗估,本节桶 6 是精确测量**。

如要回比:phase 3 末桶 6 catch-all ~7378 行 = 本节桶 6 精确 ~1656 + 散归桶 3 的 mechanism helpers ~5722,总和一致。

### 9.4 dc 影响范围结论

- **桶 2 大幅减少**:~2063 → **356 行(-82.7%)**,数据 sprint 主目标达成
- **桶 1 / 4 不变**(HTML shell / _exec 段 byte-identical)
- **桶 3 / 5 / 6 行号偏移但内容不变**(范围重定义后行数对应)

### 9.5 桶 2 残余内容(356 行,sprint 启动决策依据)

**核心残余**:
- **squad class 6 函数**(L907-L985,~79 行):`getSquadClass / getUnitClassBuffs / getClassDuelWeight / genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml`(DP-B 决策延续 phase3_12_notes §一,留 v181 等 mechanism/render sprint)
- **GEN_MAP let region**(L1188-L1192,~5 行):`let GEN_MAP = Object.fromEntries([...ALL_GENS, ...GEN_POOL_INACTIVE].map(g=>[g.name, g]));` + 周围 docstring(留 v181 等运行时 helper sprint,phase 3.12 决策延续)
- **dc + phase 3 markers**(~5 dc + ~25+ phase 3 = ~30 行):placeholder marker 注释,仅文档作用,无运行时影响
- **散在 section headers + 注释 + 空行**(~240 行):各历史阶段留下的 section header / docstring / 隔行,可在后续 sprint 清理但**优先级低**(纯注释)

### 9.6 sprint 启动决策启发(基于 dc 后 6 桶实测)

| sprint 候选 | 行数 | 优先级 | 备注 |
|---|---|---|---|
| **桶 4 _exec 架构债 sprint**(5 batch)| 620 | 高 | 与 D-064 同步,phase3_summary §10.5 已写出 5 batch 建议 |
| **桶 2 squad class + GEN_MAP helper sprint**(零碎)| ~85 | 中低 | 75 squad class + 5 GEN_MAP + ~5 周围,适合做 audit pass 2 衍生 sprint;独立做收益不大 |
| **桶 3 渲染层 phase 4**(~10670 行)| 大 | 待决 | 8 right tabs + 战斗动画 + modals,phase 4 主目标(若进 phase 4)|
| **桶 6 第二段 _debug 抽离**(1296 行)| 中 | 低 | 可单独抽到 src/dev/_debug.js,纯调试代码无运行时影响 |
| **桶 2 markers + section headers 清理**(~270 行,纯注释)| 小 | 极低 | 后续整体修订时清理,**不值得单独 sprint** |

**核心结论**:dc 后桶 2 已基本"清空数据",剩余 356 行主要是 markers / squad class 函数 / GEN_MAP helper / 注释。**桶 2 数据 sprint 收尾**(本工作目标达成)。

---

## 十、累计 phase 1+2+3+data-completion 统计

| 指标 | 起点(v181 原版)| 阶段 1 末 | 阶段 2 末 | 阶段 3 末 | **dc 末** | 累计变化 |
|---|---|---|---|---|---|---|
| v181.html 行数 | 39547 | 36799 | 34580 | 17391 | **15656** | **-23891(-60.4%)** |
| src/data/ 文件数 / 行数 | 0 / 0 | 6 / 2913 | 6 / 2913 | 6 / 2913 | **7 / 4746** | +4746 |
| src/render/ 文件数 / 行数 | 0 / 0 | 0 / 0 | 5 / 2391 | 5 / 2376 | 5 / 2376 | +2376 |
| src/core/ 文件数 / 行数 | 0 / 0 | 0 / 0 | 0 / 0 | 7 / 4134 | 7 / 4134 | +4134 |
| src/chains/ 文件数 / 行数 | 0 / 0 | 0 / 0 | 0 / 0 | 8 / 15433 | 8 / 15433 | +15433 |
| src/ 总文件数 | 0 | 6 | 11 | 26 | **27** | +27 |
| src/ 总行数 | 0 | 2913 | 5304 | 24856 | **26689** | +26689 |
| 项目代码总行数 | 39547 | 39712 | 39884 | 42247 | **42345** | +2798(注释 / header / script tag 增量) |
| D 类自然 close | 0 | 2 | 2 | 2 | 2 | 不变(dc 0 主动 fix)|
| smoke 字段层数 | — | 1 层 | 2 层 | 2 层 | 2 层 | +3 字段(phase 2.0)|
| baseline 文件数 | 1 | 1 | 2 | 3 | **4** | +1 / phase |
| git tag(baseline 归档)| v181-pre-refactor | phase1-baseline-archive | (无新增)| phase3-complete-archive | **+ data-completion-archive** | +1 tag |

**v181.html 突破 -60% 大关**(累计减重 -23891 行)。**重构 + data-completion 总计**:39547 → 15656,**60.4% 代码已抽到模块化 src/ 结构**。

---

## 十一、refactor/data-completion → main 合并

合并方式:`git merge --no-ff refactor/data-completion`(保留 5 commit 历史 + 1 merge,便于追溯)。

合并 commit hash 见 main 分支 git log。

**配套清理动作(dc.collect)**:
- `refactor/data-completion` 工作分支保留(同 phase 3 模式)
- 加 git tag `data-completion-archive` 锚定本工作 baseline
- `tests/baseline/data_completion_complete.json` 锁定(本 commit,见 §六.2)
- `docs/refactor_workflow_principles.md` 新建(集中 phase 3 + dc 沉淀的全部 7 原则)

---

(refactor/data-completion Summary 完结 — 7 文件 src/data/,5 sub-session(0+S1+S3+S2+collect),smoke 全程 byte-identical,0 D 类主动 fix,1 新工作流原则沉淀,v181 突破 -60% 大关)
