# 三国·苍生问策 — 累积机制文档 v174
> **用途**：每次新对话开始前，将本文件作为背景读入。所有已实装机制在此留存，不依赖对话历史记忆。
> **文件**：`project_romance_v174.html`（当前最新，下轮继续在此基础上开发）（单体 HTML，~36924 行，浏览器直接运行）
> **更新规则**：每轮开发结束后，将新内容追加至对应章节，版本号递增。**原文档内容不删除，只在末尾追加新章节**。

---

## 零、项目快照（每轮更新）

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v174.html |
| 总行数 | ~36924行 |
| 势力数 | 4（魏/蜀/吴/南蛮），南蛮为蜀附庸，ALL_FACS动态列表替代硬编码 |
| 武将总数 | 魏45/蜀32/吴30/南蛮2（共109位势力将领）+ 16位在野武将（WILD_GENS）+ 8 inactive = 135人数据总量 |
| 城市数 | 45城市（魏21/蜀10/吴13/南蛮1），其中11城绑定特色兵种 |
| 地理单位 | **v172: 东汉 13 州 + 南中**（si/yu/yan/xu/qing/ji/you/bing/liang/jing/yang/yi/jiao/nanzhong），取代大区 |
| 士族派系 | **v172: 9 个**（中原/河北/徐州/荆州/益州/江东/西凉/东州派/淮泗派）— 新增 hebei/xuzhou |
| 势力阶段 | **v172: warlord/regional/regime 三阶段**（军阀→一方之主→政权），自动晋升，不可逆 |
| 地图系统 | 六边形网格（102×68≈6936 hex），Hex A* 寻路 |
| 地形类型 | plain / hill / mountain / forest / water / river / impassable / swamp / coastal_water / deep_water |
| 部队状态类型 | garrison / march / halt / camp / ambush / siege |
| 兵种 | cavalry / light / archer / heavy / siege + 11个特色兵种 |
| 右侧面板 | 10个Tab（城池/军事/武将/官职/外交/计谋/派系/科技/**价值观**/统计） |
| 迷雾系统 | 三级（未探索/已探索/可见），城市=领地范围/部队2/隐蔽1 |
| 渲染优化 | renderAllLight（部队层分离，交互不重建地图底层） |
| 补给系统 | BFS洪泛扩散，范围13，地形消耗差异化，可视化overlay |
| 豪族支持 | I2实装+v161属县系统，每城3-5属县各有loyalty，聚合为city.gentry，影响税收/征兵/城防士气 |
| 腐败系统 | v148实装，城数越多金产腐败越重，太守pol和豪族支持可压腐 |
| 战斗触发 | v100重构：废除被动扫描，AI/玩家显式发起 |
| 技能系统 | v106架构 + v125-129实装：SKILL_REGISTRY(29)+SKILL_INLINE(99标签)，85个武将已实装，全部审计通过 |
| 武将四类 | v167新增：GEN_CLASS(125人) → warrior/commander/strategist/minister，多标签13人，影响单挑/士气/计谋/补给 |
| 坐标系 | 统一hq/hr，gx/gy已清除（v106） |
| 集结系统 | v114：征兵/扩编渐进集结，按城市人口决定速率 |
| 科技树 | v115→v165：5分支51节点（+econ11军屯精耕/+civ10徙民实边），29效果接入，武将绑定研究 |
| 特色兵种 | v116：11个城市绑定王牌兵种，单势力上限3squad，出厂Lv10 |
| AI系统 | G2三层架构（v85-87）：威胁矩阵→防守响应→进攻集结，B4人格参数已接入 |
| 宣称系统 | C3（v90）：5种宣称类型+天子+称帝，影响外交/忠诚/派系 |
| 美术风格 | v117/v122：水墨宣纸风地图+城楼图标，hex网格叠加可选 |
| 标签系统 | v124：origin 5值(gentry/humble/clan/noble/foreign)，values 4标签(忠义/野心/投机/汉室死忠)，temperament 6标签(proud/reckless/steady/cunning/steadfast/generous) |
| 地域系统 | v126：JIANGDONG_CITIES(13城)+QINGXU_CITIES(6城)+JINGZHOU_CITIES(6城, v128)，技能用地域判定 |
| 称帝门槛 | 默认10城/40信誉，华歆当官时8城/30信誉（v127） |
| 事件系统 | v132+v139：引擎框架 + 33个事件，7种promise类型，一次性事件引擎 |
| 启动界面 | v135：标题菜单→剧本选择→势力选择，三级流程 |
| 存档系统 | v135：5槽位手动存档，_store兼容层 |
| 价值观系统 | v151+v152：5维度，事件12写入点+朝议8提案+AI读取 |
| **Claude AI** | **v156-v160：getGameState+prompt+API+指令执行层(35种)+runAI async+fallback+单城门槛+ID速查表+情报推理+战略记忆+决策节奏。v167: Cloudflare Worker CORS代理（romance-proxy.wangjiejie89.workers.dev），itch.io可直接使用，proxyUrl硬编码** |
| **互市系统** | **v164：外交面板购买对方特产资源（马/铁/木），揭雾资源城2旬，9旬CD** |
| **通使系统** | **v164：计谋Tab，花600金+INT判定→好感+揭雾首都3旬+下旬情报弹窗（叙事描述）** |
| **海外贸易建筑** | **v164：tradepost建筑3级（金+15%/25%/35%），港口城→商港，产木内陆→榷场，产马城→马市** |
| **通商协定** | **v165：外交面板缔结通商，双方每旬获对方城数×5金，同盟×1.2，tradepost放大，rel<20自动中断** |

---

[以下内容从 v81 文档原样保留，仅在末尾追加 v82 内容]

---

## v81 C4 战争迷雾系统（摘要，完整内容见上一版handover）

三级迷雾：FOG_UNEXPLORED=0 / FOG_EXPLORED=1 / FOG_VISIBLE=2
数据结构：`G.fog` + `G.fogSnap`
新增函数12个（initFog/updateFog/fogBFS/getFogAllyFacs等）
撤退系统重写：canRetreat 用 estimateWinRate 判断是否有一战之力
性能优化：静态地图SVG缓存 + 迷雾SVG按旬缓存

---

## v82 本轮修复记录

### 地形修复

#### 底部水道消除
**问题**：`big_east`（东海poly）西南角延伸至番禺以南，water 优先级(6) > impassable(5)，无法用poly覆盖。

**修复**：`buildHexTerrain` 步骤5.5 地理硬规则——row≥64 且 col<63 的所有水格强制改为 impassable：
```js
for (let col = 0; col < 63; col++) {
  for (let row = 64; row < HEX_ROWS; row++) {
    const k = hkey(col, row);
    const t = HEX_TERRAIN[k];
    if (t === 'water' || t === 'coastal_water' || t === 'deep_water') HEX_TERRAIN[k] = 'impassable';
  }
}
```
番禺（col52, row62）安全；col≥63 东南沿海正常保留。

#### 孤岛消除（buildHexTerrain 步骤6）
连通分量检测：非主分量的 passable hex 自动标为 impassable。通用解，未来调整poly产生新孤岛也自动处理。

### 迷雾系统修复

#### initFog 开局探索范围改进
**旧**：己方 visible 区域的1格邻居设为 explored。
**新**：通过 `_buildTerritoryMap()`，找出与己方 visible 相邻格所属的非己方城市，把这些城市的**整个辖区**设为 explored。效果：曹操控广陵，开局即可看到京口完整辖区。

---

## ~~⚠️ 下轮首要任务：修复迷雾归属颜色显示（本轮引入的bug）~~ ✅ v83已修复

> 以下为原始bug描述，保留作为设计参考。v83已完成全部5处修复。

### 正确设计（三级颜色规则）

| 状态 | 城市图标颜色 | 归属显示 | 说明 |
|------|------------|---------|------|
| FOG_VISIBLE (2) | 势力色（正常亮度） | 实时归属 | 完全可见 |
| FOG_EXPLORED (1) | 势力色（opacity降至约0.5~0.6） | 快照归属（可能过时） | 探索过、有情报记录 |
| FOG_UNEXPLORED (0) | 灰色 | 不显示归属 | 一抹黑 |

### 当前错误状态
本轮把 explored 的归属颜色全部改成了灰色，等同于 unexplored——这是错的。

### 需要修复的4处位置

**1. 地图图标渲染**（约第7155行，`renderMap` 内 CITIES_DEF.forEach）
```js
// 当前错误：
if (fogLv === FOG_EXPLORED || fogLv === FOG_UNEXPLORED) { displayFac = 'none'; }

// 应改为：
let displayFac = city.fac;
if (fogLv === FOG_EXPLORED) {
  const snap = G.fogSnap?.[G.playerFac]?.[def.id];
  displayFac = snap ? snap.fac : 'none';
} else if (fogLv === FOG_UNEXPLORED) {
  displayFac = 'none';
}
// strokeCol/darkFill 在 explored 时用归属色但降 opacity（约0.5）
```

**2. 左侧郡县列表**（约第6965行）
```js
// 当前错误：
const displayFac = fogLv === FOG_VISIBLE ? city.fac : 'none';

// 应改为：
const displayFac = fogLv === FOG_VISIBLE ? city.fac
  : fogLv === FOG_EXPLORED ? (G.fogSnap?.[G.playerFac]?.[cd.id]?.fac || 'none')
  : 'none';
// cityCol 在 explored 时用归属色但加 aa 半透明后缀
```

**3. 城市 Tooltip**（约第8770行）
```js
// 当前错误：显示"归属未知"
// 应改为：
const snap = G.fogSnap?.[G.playerFac]?.[cityId];
const snapFacName = snap ? (FAC[snap.fac]?.name || '未知') : '未知';
const snapCol = snap ? (FAC[snap.fac]?.color || '#888') : '#888';
// 显示：城市名用 snapCol，正文显示"归属：${snapFacName}（旧情报）"
```

**4. 右侧城池 Tab**（约第7628行）
```js
// 当前错误：显示"归属未知"，城市名灰色
// 应改为：从 fogSnap 取归属色和名称，显示"归属：XXX（旧情报，第N旬）"
```

### initFog 快照建立也需同步修复
```js
// 当前错误（只给 visible 建快照）：
if (fog[k] === FOG_VISIBLE && HEX_CITY[k]) { ... }

// 应改为（explored 也建快照）：
if (fog[k] >= FOG_EXPLORED && HEX_CITY[k]) { ... }
```

---

---

## v83 迷雾归属颜色修复

### 修复内容（5处）

| # | 位置 | 修复前 | 修复后 |
|---|------|--------|--------|
| 1 | `initFog` 快照建立（~行1107） | 只给 `FOG_VISIBLE` 城市建快照 | `fog[k] >= FOG_EXPLORED` 即建快照 |
| 2 | `initFog` 城市初始fog（~行1076） | 所有45城开局全部标为 `FOG_EXPLORED` | 只有己方城市标为explored，远方城市保持unexplored |
| 3 | 地图图标渲染（~行7157） | explored 和 unexplored 都 `displayFac='none'` | explored 从 `fogSnap` 取归属，用归属色+`88`后缀降opacity |
| 4 | 左侧郡县列表（~行6967） | explored 显示 `'none'` | explored 从 `fogSnap` 取归属色+`88`半透明 |
| 5 | 城市Tooltip（~行8767） | explored 显示"归属未知" | 从 `fogSnap` 取归属，显示"归属：XXX（旧情报，第N旬）" |
| 6 | 右侧城池Tab（~行7637） | explored 显示"归属未知"，城市名灰色 | 从 `fogSnap` 取归属色和名称，显示旧情报+旬数 |
| 7 | `updateFogCitySnapshot`（~行1167） | `fogLv >= FOG_EXPLORED` 时更新快照（explored也感知远处易主） | 改为仅 `FOG_VISIBLE` 时更新，explored不应感知不在视野内的易主 |
| 8 | `canRetreat`（~行11226） | 叛军也能触发撤退判定 | 叛军永不撤退，函数开头直接 `return false` |

### 围城/攻城UI重做

**堆叠逻辑修改**：敌方城市相邻hex允许多个友军部队停留（围城支援），不再被堆叠检查阻止。第一个到达的部队进入siege状态，后续部队halt在附近，攻城发起时2格内己方halt部队自动参战。

**围城面板重做**（部队详情中siege状态显示）：
- 围城进度条（百分比=siegeDecay，直观颜色渐变）
- 已围旬数 + 预计满衰减剩余旬数
- 守方城防加成倍率（颜色标注高/中/低）+ 围满后降至×1.00
- 提示文案"可随时攻城，围久城防越弱"
- **攻城按钮**：大号红色渐变按钮，标注当前城防倍率
- **撤围按钮**：次要样式

**攻城确认弹窗优化**：
- 围城进度条 + 守方城防倍率 + 围满预估
- 攻城按钮标注城防倍率，红色大号
- 撤围按钮改为"撤围退兵"
- 去除"_battleCooldown=3"等技术性文案

### 三级迷雾显示规则（最终实装）

| 状态 | 地形 | 城市图标颜色 | 归属显示 |
|------|------|------------|---------|
| FOG_VISIBLE (2) | 完全可见 | 势力色（正常亮度） | 实时归属 |
| FOG_EXPLORED (1) | 半透明覆盖(opacity 0.52) | 势力色（opacity降至约0.5） | 快照归属（旧情报+旬数） |
| FOG_UNEXPLORED (0) | 深色覆盖(opacity 0.88) | 灰色 | 不显示归属 |

---

### 武将池bug修复

**问题**：征兵选将池用了静态 `GENS_FULL[fac]`，投降/招募/挖角加入的武将只进了 `G.generals[fac]`，不在征兵列表中。同时 `GEN_MAP` 不含 `WILD_GENS`，导致在野武将招募后战斗属性查找失败。

**修复4处**：

| # | 位置 | 修复 |
|---|------|------|
| 1 | `ALL_GENS` / `GEN_MAP` 初始化 | `WILD_GENS` 也加入，确保所有武将可通过 `GEN_MAP[name]` 查到 |
| 2 | `renderRecruitModal` 征兵选将池 | `GENS_FULL[playerFac]` → `G.generals[playerFac]`（动态列表） |
| 3 | `openGenProfile` 武将详情 | 兼容在野武将：优先 `GEN_MAP`，兜底 `G.generals` |
| 4 | 部队详情面板 `allGens`（死代码） | 同步改为 `G.generals[unit.fac]` 防患未然 |

---

## 遗留代码质量问题

| # | 问题 | 状态 |
|---|------|------|
| Q6 | `unit.gx/gy` 与 `unit.hq/hr` 完全冗余 | ✅ v106已清除，0处引用 |
| Q7 | `_unitMenu` 防御性清理 | 仍存在，功能正常，极低优先级 |
| Q9 | `playerAcceptVassal()` 无UI调用入口 | ✅ 已删除，函数不存在 |

---

### 伏击放弃机制（v83新增）

**设计**：伏击触发后，玩家可选择"放弃伏击"悄然撤离，而非强制交战。

**流程**：
1. 敌方撞上伏击 → 弹窗显示三个选择：⚔发起伏击 / 🚶放弃伏击 / 火攻勾选
2. 放弃伏击：解除ambush→halt，敌方察觉判定
3. 发现率 = 30% + 敌方主将INT × 0.3%（INT80→54%）
4. 被发现 → 强制野战（敌方先手），己方士气-15，战后败方撤退2格
5. 未被发现 → 安全撤离2格，伏击白费
6. 无论结果，部队冷却1旬

**新增函数**：
- `confirmAmbushAbort()` — 放弃伏击主逻辑
- `_doRetreat2Hex(unit, enemies)` — 向远离敌方方向撤退2格（通用撤退工具函数）

**UI改动**：伏击弹窗撤退按钮从disabled改为可用，显示被发现率百分比

---

## 待办事项（v125时点）

**已完成的主要里程碑**：
- ✅ G2 AI大重构（v85-87）：三层架构+威胁矩阵+防守响应+进攻集结+审计
- ✅ B4 人格参数（v85+）：AI_PERSONALITY三家差异化（曹操激进/刘备保守/孙权均衡）
- ✅ C3 宣称+天子+称帝（v90）：5种宣称类型，外交/忠诚/派系联动
- ✅ C4 战争迷雾（v81-83）：三级迷雾+快照+归属显示
- ✅ E1 科技树（v115）：5分支49节点，29效果接入
- ✅ E2 特色兵种（v116）：11城绑定王牌兵种
- ✅ G1 美术重制（v117/v122）：水墨宣纸风+城楼图标
- ✅ 武将技能实装（v105-106架构 + v125-127实装）：REGISTRY 29 + INLINE 88标签，覆盖78个武将
- ✅ 武将扩充（v117+v124）：72→107人（+35）
- ✅ 标签系统梳理（v124）：origin 5值 + values 4标签 + noble派系
- ✅ 基建经济重平衡（v124）：农田/市集改为base加值
- ✅ Q6 gx/gy清除（v106）、Q9 playerAcceptVassal删除

**尚未实装/可考虑**：
1. 反伏击机制（被伏击方的反制手段）
2. 地图裁剪（边缘无用区域）
3. AI经济动态化+预算分配（G2 Phase3概念，未实装）
4. 小地图战斗系统（正在别的对话做demo）

### Sprint 状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 + AI人格化 | ✅ 已关闭（B4已实装） |
| C 战略层博弈 | ✅ 已关闭（C3宣称v90 + C4迷雾v81-83） |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ✅ 已关闭（E1科技v115 + E2特色兵种v116） |
| F 内容扩展 | ✅ 已关闭（v117+v124武将扩充+28人） |
| G 美术 & AI优化 | ✅ 已关闭（G1水墨v117/v122 + G2 AI v85-87） |

---

## v84 伏击系统bug修复

### 修复内容（7处）

| # | 位置 | 修复前 | 修复后 |
|---|------|--------|--------|
| 1 | `resolveAmbush`（~行10471） | ATK/DEF计算使用未定义变量`ter` | 加 `const ter = baseTerrain`，地形加成正常生效 |
| 2 | `confirmAmbush`（~行12084） | `resolveAmbush`若抛异常，弹窗已隐藏但无战报，"无事发生" | 加try-catch + 部队有效性校验，异常时给日志提示并解除ambush状态 |
| 3 | `resolveAmbush` 战后状态（~行10615） | 败方/伏击方在敌方城市被错误设为`garrison` | 检查城市归属，只有己方城市才garrison，否则halt |
| 4 | `applyBattleExp`（~行740） | 伏击战报用`ambushFac/ambushWins`，但经验发放读`atkFac/atkWins`，字段不匹配导致经验完全失效 | type==='ambush'时特殊处理，使用正确字段 |
| 5 | `confirmAmbushAbort`（~行12136） | 同confirmAmbush，无try-catch防护 | 加try-catch + 日志，异常时兜底解除ambush |
| 6 | `confirmAmbushAbort` 地形获取 | 使用`gx/gy`获取地形 | 改用`hq/hr`（更可靠，优先hq/hr，兜底gx/gy） |
| 7 | `resolveAmbush` 围城残留清理 | siege部队被伏击后`siegeTarget/_siegeTurnCount`未清除 | 战后统一清除围城相关字段 |

### 根因分析

**"无事发生"最可能原因**：`confirmAmbush`第一行隐藏弹窗，随后`resolveAmbush`内部抛出JS运行时异常（`ter`未定义虽有fallback但其他潜在边界情况），导致后续`_battleReports.push`和`showNextBattleReport`不执行。用户看到弹窗消失但无战报弹出。

**修复策略**：
1. 修复根本原因（`ter`变量未定义）
2. 加防御性编程（try-catch + 部队有效性校验），确保即使异常也有用户反馈
3. 修复战后状态逻辑（garrison判定、siege清理），防止级联问题

### 设计确认

- siege部队应可被伏击（部队路过伏击点后想围城，先被截住），保留当前触发逻辑
- 伏击触发流程不变：弹窗→选择伏击/放弃→分支结算

---

## v85 伏击系统Audit + Bug修复

### Audit方法

对伏击系统全部相关代码（resolveAmbush / checkBattleTriggers / _showAmbushConfirm / confirmAmbush / confirmAmbushAbort / _doRetreat2Hex / setAmbush / applyBattleExp / 战报渲染）进行完整审读，并用提取的核心逻辑跑1000次蒙特卡洛模拟验证数值正确性。

### 模拟验证结果（全部通过）

中伏率、损失率、全歼率、放弃伏击发现率等数值全部与设计预期吻合，无极端失衡。

### 修复内容（4处）

| # | 位置 | 严重度 | 修复前 | 修复后 |
|---|------|--------|--------|--------|
| 1 | `_showAmbushConfirm`（~行11997） | MEDIUM | UI只计算己方诸葛亮+15%，不减敌方诸葛亮-25% | 加入`victimFid`检测，敌方有诸葛亮时`ambushChance-0.25`，与`resolveAmbush`逻辑一致 |
| 2 | `confirmAmbushAbort`（~行12190） | MEDIUM | 放弃伏击被发现→强制野战后，敌方胜利者无`_battleCooldown` | 胜方统一设`_battleCooldown=1`，防止同旬二次战斗 |
| 3 | 野战战报标题（~行13233） | LOW | `ambushAbortDetected`标志写了但战报不读，显示普通"野战" | 检测该标志，显示"野战（伏兵撤退被发现）" |
| 4 | `setAmbush`（~行14774） | NEGLIGIBLE | 用`gx/gy`获取地形 | 改为`hq??gx, hr??gy`，与v84统一hq/hr方向一致 |

### Audit确认无误的部分

- resolveAmbush核心逻辑（ter变量、siege清理、garrison判定）✅
- 双向pairKey防止同旬重复战斗 ✅
- try-catch防护（confirmAmbush + confirmAmbushAbort）✅
- applyBattleExp伏击字段处理 ✅
- 叛军永不撤退 ✅
- 火攻资源二次校验 ✅
- 被动单挑触发 + 全歼判定 ✅

---

## v85 G2 AI大重构 Phase 1：进攻集结 + 战力评估

### 设计理念

旧AI（`aiDoMove`）的核心问题：每支部队独立找最近敌城直线推进，导致添油战术、无集结、无协同、攻城随机掷骰。

G2重构为**势力级战略决策 → 部队执行**的两层架构，核心改变：
1. AI不再"每支部队独立找目标"，改为势力统一选目标、统一分配部队
2. 用`estimateWinRate`替代随机掷骰，AI基于客观战力评估做决策
3. 事件驱动的目标重选（而非定时重算），避免频繁改道

### 新增数据结构

```
G.factions[fid]._aiPlan = {
  targets: [{ cityId, score, assignedUnits:[uid...], status }],
  lastReviewTurn: N,
}
unit._aiTarget = cityId | null   // 当前分配的攻击目标
unit._aiRole = 'attack'|'garrison'|'idle'  // 部队角色
```

### 人格参数接口（预留B4人格化）

```js
AI_PERSONALITY = {
  wei: { atkThreshold: 0.50, siegeThreshold: 0.55 },
  shu: { atkThreshold: 0.50, siegeThreshold: 0.55 },
  wu:  { atkThreshold: 0.50, siegeThreshold: 0.55 },
};
```
Phase 1统一值，B4实装时按势力调参（曹操激进/刘备保守）。

### 新增/重构函数

| 函数 | 说明 |
|------|------|
| `aiFrontierEnemyCities(fid)` | ★核心：BFS沿ROADS图找前线邻接敌城（只穿透己方城，敌城记录不穿透） |
| `_aiScoreTarget(fid, city)` | 目标城打分：价值×防守弱度（无需距离因子，前线已由BFS过滤） |
| `_aiEstimateSiegeWinRate(attackers, cityId)` | 估算攻城胜率（含城防加成） |
| `_aiShouldReview(fid)` | 事件驱动重选判断（目标攻下/外交变化/部队全灭） |
| `aiSelectTargets(fid)` | 势力级：全局目标选择 + 部队分配 + 守备分配 |
| `aiExecuteOrders(fid)` | 部队级：按_aiTarget行军/集结/围城判断 |
| `_aiTrySiege(unit, targetId, fid)` | 围城决策：野战+守方出城双重胜率检查 |
| `aiDoSiege(fid)` | **重写**：用estimateWinRate替代随机掷骰 |

### 删除函数

| 函数 | 原因 |
|------|------|
| `aiDoMove(fid)` | 被`aiSelectTargets` + `aiExecuteOrders`替代 |
| 旧`aiDoSiege(fid)` | 被新版`aiDoSiege`替代（随机→胜率评估） |

### runAI 新执行顺序

```
1. aiDoDiplo        → 外交（每3旬错峰）
2. aiDoDisband      → 裁军
3. aiDoRecruit      → 征兵+补员
4. aiDoBuild        → 基建
5. aiSelectTargets  → ★ G2: 战略决策（目标+部队分配）
6. aiExecuteOrders  → ★ G2: 执行层（行军/集结/围城）
7. aiDoSiege        → ★ G2: 攻城决策（胜率评估）
8. aiDoRecruitWild  → 招募在野武将
```

### 关键设计决策

1. **目标锁定**：选定后不每旬重算，事件驱动重选（目标被攻下/外交变化/部队全灭）
2. **先到者行为**：先到的部队双重检查（野战打得过 + 守方出城也打得过）才围城，否则halt等援
3. **攻城阈值**：城防衰减≥70% 或 胜率>siegeThreshold 才发动攻城
4. **守备逻辑**：前线城至少留1支最弱部队守备，与旧版一致
5. **最多2个主攻目标**：避免三线作战兵力过散

### 模拟测试驱动的重大设计改进

**问题**：初版用距离衰减打分，AI仍会选择远处高价值城（如跨越整个地图打成都），不符合逐城推进的历史逻辑。

**解决方案**：用ROADS城市连接图做BFS，只让AI攻击"前线邻接敌城"。

**新增数据结构**：
- `ROAD_ADJ`：从ROADS双向邻接表（城市连接图）
- `aiFrontierEnemyCities(fid)`：BFS从己方所有城市出发，沿ROADS扩展，己方城穿透、敌城记录不穿透、中立城不穿透

**效果**：
- 魏vs蜀标准局面 → 只出现襄阳、汉中（正确），不出现江陵、成都（后方）
- 攻下襄阳后 → 江陵自动进入前线范围
- 攻下汉中后 → 梓潼、巴中进入前线范围
- 逐城推进，完全符合历史逻辑

**打分简化**：前线BFS已过滤，不需距离因子，score = 价值 × 防守弱度。

### 模拟验证结果

| 测试 | 结果 |
|------|------|
| 前线BFS：魏vs蜀标准 | ✅ 只出现襄阳+汉中，不含江陵/成都 |
| 前线BFS：攻下襄阳后 | ✅ 江陵进入前线 |
| 前线BFS：攻下襄阳+汉中 | ✅ 梓潼+巴中进入前线 |
| 前线BFS：三方混战 | ✅ 各势力只看到直接邻接敌城 |
| 前线BFS：中立不穿透 | ✅ 不会借道吴国绕后 |
| 守备分配 | ✅ 已有garrison的前线城不重复分配 |
| 事件驱动review（外交变化） | ✅ 议和后目标清空 |
| 事件驱动review（部队全灭） | ✅ 触发重选 |
| 计划稳定性（10旬无事件） | ✅ 只review 1次 |
| 围城决策（强/弱/有敌援） | ✅ 全部正确 |
| 边界情况（无敌人/丢光城） | ✅ 不崩溃 |

### 待做（Phase 2） → ✅ v86已完成

~~- 防守响应：视野内敌方接近时调兵回防~~ ✅ v86已实装
- 伏击/扎营：AI在有利地形主动设伏（拆出为独立任务）
- 经济动态化：预算分配（移至Phase 3）

### Sprint 状态更新

| Sprint | 状态 |
|--------|------|
| G AI优化 | 🔄 G2 Phase 1 ✅ Phase 2 ✅ Phase 3 待做 |

---

## v85 战斗公式重平衡 + Bug修复

### 战损公式修正（resolveBattle + resolveAmbush）

**问题**：旧公式双方各按自己兵力的百分比扣血，导致兵多方（赢方）绝对损失反而比兵少方大。关羽3000 vs 普通6000，普通将赢了但绝对损失更多（1333 > 1159）。

**修复**：保留原百分比计算，新增兵力比修正因子：
```
当赢方兵力 > 败方兵力时：
  winnerLost *= √(loserTroops / winnerTroops)
  winnerLost = min(winnerLost, loserLost)  // 硬cap：赢方绝对损失不超过败方
```
- 1:1 → 无修正
- 1:2 → 赢方损失×0.71
- 1:3 → 赢方损失×0.58
- 1:10 → 赢方损失×0.32

**注意**：applyLoss先执行（从troops扣血），然后用"战前兵力"（当前troops+已扣损失）算修正因子。修正只影响winnerLost的最终数值记录，不影响已扣的troops——实际实现是先applyLoss败方再applyLoss赢方，赢方的applyLoss结果被修正后cap。

### 全歼判定改为确定性

**旧**：`cpRatio ≥ 2.0` 时按概率全歼（20%~85%随机）
**新**：`cpRatio ≥ 3.0` 时必定全歼，`< 3.0` 不全歼，无随机因素

### 攻城战报经验发放bug修复（v83遗留）

**问题**：`applyBattleExp` 的 siege 分支用了裸变量 `atkWins` 而非 `report.atkWins`，导致点击攻城战报"确认"按钮抛 ReferenceError，弹窗无法关闭。
**修复**：`atkWins` → `report.atkWins`

### AI部队不动bug修复

**问题**：新征兵/打完仗的部队没有 `_aiRole`/`_aiTarget`，但 `_aiShouldReview` 认为旧计划仍有效不触发重选，导致这些部队永远idle。
**修复**：
1. `_aiShouldReview` 新增条件：有未分配的可用部队时也触发review
2. `aiSelectTargets` review时清除所有可用部队的旧标记，重新分配

---

## v86 G2 Phase 2: AI防守响应

### 设计理念

Phase 1解决了"AI怎么进攻"，Phase 2解决"AI被打时怎么办"。核心原则：防守优先于进攻——`aiDefendResponse`在`aiSelectTargets`之前执行，确保受威胁的城市先得到增援。

### 新增函数

| 函数 | 说明 |
|------|------|
| `aiDefendResponse(fid)` | ★核心：扫描视野内敌军威胁→评估守军胜率→调兵回防 |
| `_aiIsVisibleToFac(unit, fid, fog)` | 判断敌方部队是否在己方`FOG_VISIBLE`视野内 |

### 修改函数

| 函数 | 修改 |
|------|------|
| `_aiShouldReview` | defend部队不算"未分配"，不触发不必要的review |
| `aiSelectTargets` | defend部队排除在进攻池外，不清除其role/target |
| `aiExecuteOrders` | 新增2b段：defend部队向目标行军，到达后garrison |
| `runAI` | 步骤5插入aiDefendResponse（防守优先于进攻） |

### `_aiRole`新增值

`'defend'` — 正在回防的部队。行为类似attack（向目标行军），但目标是己方城市。

### 防守逻辑详解

**Step 0 — 清理过期defend任务**：
- defend目标城已丢失 → 恢复idle
- 目标城6hex内无可见敌军 → 威胁消失，恢复idle，停止行军

**Step 1 — 扫描威胁**：
- 遍历己方城市，找视野内（`FOG_VISIBLE`）6hex内的敌方部队
- explored = 旧情报，不触发防守
- 守军胜率≥0.6 → 不需增援
- 威胁紧急度 = 敌方兵力 / (距离+1) × 城市价值因子，按紧急度降序处理

**Step 2 — 调兵**：
- 收集可调部队，按距离排序，非进攻部队优先
- 进攻部队只在紧急时召回（敌军≤3hex且守军胜率<0.3）
- 距离>15hex不调（赶不上）
- 每城最多调4支援军
- 逐步分配直到预估胜率≥0.55
- siege/ambush状态部队不被调走
- 召回进攻部队时同步从`_aiPlan.targets`移除

**Step 3 — 执行（在aiExecuteOrders中）**：
- defend部队向目标城行军
- 到达后转为garrison，保持defend角色直到威胁消失
- 目标城丢失则恢复idle

### runAI 新执行顺序

```
1. aiDoDiplo        → 外交
2. aiDoDisband      → 裁军
3. aiDoRecruit      → 征兵+补员
4. aiDoBuild        → 基建
5. aiDefendResponse → ★ G2P2: 防守响应（优先于进攻）
6. aiSelectTargets  → G2: 战略决策
7. aiExecuteOrders  → G2: 执行层
8. aiDoSiege        → G2: 攻城决策
9. aiDoRecruitWild  → 招募在野武将
```

### 测试验证

| 测试 | 结果 |
|------|------|
| 基本防守触发（敌军接近→调闲置部队） | ✅ |
| 守军足够时不调兵（胜率≥0.6） | ✅ |
| 迷雾外敌军不触发 | ✅ |
| 进攻部队非紧急不召回 | ✅ |
| 进攻部队紧急时召回（dist≤3无守军） | ✅ |
| 威胁消失→defend恢复idle | ✅ |
| defend不被aiSelectTargets抢走 | ✅ |
| defend不触发_aiShouldReview | ✅ |
| 目标城丢失→恢复idle | ✅ |
| 距离>15hex不调 | ✅ |
| siege部队不被调走 | ✅ |
| 全流程无进攻/防守冲突 | ✅ |
| _aiIsVisibleToFac边界 | ✅ |
| 召回时从aiPlan移除 | ✅ |
| 集成：进攻中遭反攻→分工协作 | ✅ |
| 集成：威胁消失→恢复→可重新进攻 | ✅ |
| 集成：多旬角色互斥不变量 | ✅ |

### v86 战损公式模拟验证

对v85新增的兵力比修正因子和确定性全歼做了10000次蒙特卡洛模拟，验证结果：

| 检验项 | 结果 |
|--------|------|
| 全歼确定性（cpRatio≥3.0 ↔ 全歼） | ✅ 50000场0误判 |
| 兵力比修正对兵多赢方生效 | ✅ 所有碾压场景0违规 |
| v85修复效果（关羽3000vs6000） | ✅ 损失从852降至602 |
| 名将/等级/士气/克制/地形差异 | ✅ 合理体现 |
| 兵力对等时偶尔赢方损失>败方（~0.4%） | ⚠️ 已知，属正常随机波动，不修 |

---

## v86 AI审计 + Bug修复 + UX重做 + 模拟验证

### AI G2 Phase 1 & Phase 2 审计

对G2全部AI代码进行完整审计，编写52个单元测试 + 1000次蒙特卡洛随机压力测试。

**测试结果**：51/52通过，1000次随机0崩溃。

### AI Bug修复（3处）

| # | Bug | 严重度 | 修复 |
|---|-----|--------|------|
| B1 | `_aiEstimateSiegeWinRate`：纯驻军城市WR永远=1.0 | HIGH | 加入garrison的ATK贡献（`garrisonTroops * TYPE_ATK.heavy * 0.5`），与`resolveSiegeBattle`虚拟unit对齐 |
| B2 | `aiDoSiege`：多个siege部队围同一城，`resolveSiegeBattle`被调用N次 | MEDIUM | 按cityId去重（`processedCities` Set），每城每旬只处理一次 |
| D1 | `aiFrontierEnemyCities` JSDoc说"中立穿透"但代码"不穿透" | TRIVIAL | 注释修正 |

### 伏击公式调整

诸葛亮守方debuff：**-25% → -15%**，与攻方+15%对称。修改位置：`resolveAmbush`（L11167）+ `_showAmbushConfirm`（L12675），共2处。

**效果**：曹操(INT91)伏击关羽(INT74)，平原+对方有诸葛亮：旧=5%（个位数），新=~20%。

### 紫色按钮残留Bug修复

**问题**：`confirmAmbush`恢复战斗确认按钮文字但没恢复style，伏击专用的紫色渐变背景残留到下一次普通战斗弹窗。
**修复**：`confirmAmbush`中加`fightBtn.style.cssText=''`。

### 移动/攻击UX重做

#### 移动路径预览 + 二次确认

**数据结构**：`G._movePreview = { destCol, destRow, hexPath, cost, turns, label } | null`

**流程**：
1. 选中己方部队 + 点击目标hex → 计算hexAstar路径 → 显示黄色虚线预览 + 旬数标签 + "再次点击确认"提示
2. 再次点击同一目标 → 执行移动（`issueUnitMove`）
3. 点击其他位置 → 切换预览到新目标
4. 右键 → 取消预览（保留选中）；再右键 → 取消选中

**新增函数**：无独立函数，逻辑集成在`handleMapClick`和`handleCityClick`中。

#### hex点击自动检测敌军

选中己方部队 + 点击hex → 如果该hex有可见敌方部队 → 自动转为"向敌军进军"（直接执行，不走预览）。解决了"必须精确点到旗帜才能攻击"的问题。

#### 攻击野外部队修复

`onUnitLeftClick`攻击分支原来依赖`getUnitNodeId(target)`（野外部队返回null → 攻击无效）。改为直接用hex坐标寻路。

### 渲染性能优化

**问题**：每次交互调`renderAll()`重建整个SVG（6936 hex + 45城市 + 部队旗帜），导致卡顿。

**方案**：分离部队渲染层。

| 函数 | 说明 |
|------|------|
| `renderUnitsOnly()` | 只更新`<g id="unitsLayer">`的innerHTML（部队旗帜+路径+预览） |
| `renderAllLight()` | = `renderUnitsOnly()` + 右侧面板 + 顶栏（跳过地图底层和左侧列表） |

**替换规则**：选中/取消/预览等交互操作用`renderAllLight`；实际移动/攻城/回合结算等游戏状态变更用完整`renderAll`。

### 围城到达弹窗

**触发**：`processUnitMovement`中玩家部队到达敌城相邻hex时，设`_pendingSiegeArrival`标记。`nextTurn`末尾（renderAll之后）检测标记并弹窗。

**弹窗内容**：
- 攻守兵力对比 + 城防倍率 + 胜算评估 + 围满预估旬数
- **⚔ 直接攻城** → 调用`launchSiegeAttack`（正常攻城弹窗流程）
- **🏰 围而不攻** → 保持siege状态

**新增数据**：`let _pendingSiegeArrival = null`，每旬开头重置。

**关键设计**：弹窗在`nextTurn`末尾显示（renderAll之后），避免与`checkBattleTriggers`的战斗弹窗冲突。选择后正确链到后续战报。

### Siege部队可被野战拦截

**问题**：`checkBattleTriggers`第二轮无条件跳过siege部队（`if(unit0.status==='siege') return`），导致援军到达城旁也无法拦截围城敌军。

**修复**：
1. siege部队仍然不**主动**触发野战（保留`if(unit0.status==='siege') return`）
2. 但非siege部队检测敌军时不再过滤siege敌军（移除`u.status !== 'siege'`过滤条件）
3. march/halt/garrison部队可以对相邻的siege敌军发起野战解围

**战后处理**：
- siege部队作为败方 → 解除siege状态（`status='halt'`, 清除`siegeTarget`/`_siegeTurnCount`），撤退
- siege部队作为赢方 → 保持siege状态继续围城（加`_battleCooldown=1`）

**测试**：16个场景全部通过（march/halt/garrison vs siege, 距离/冷却/同阵营/ambush等边界）。

### 攻城纯驻军无叫阵

**修复**：`_showSiegeBattleConfirm`中加`defHasGenerals`检测：守方defenders中无武将（`GEN_MAP[sq.genName]`不存在）时，隐藏攻方叫阵UI + 跳过AI守方叫阵检测。

### 死代码清理（-36行）

| 函数/代码 | 原因 |
|-----------|------|
| `getFogCityFac` | 定义但从未调用 |
| `aiFindNearestEnemyCity` | G2重构后被`aiFrontierEnemyCities`替代，无调用 |
| `playerAcceptVassal` | 无UI入口（Q9遗留） |
| `getVassals` | 无调用 |
| 过时注释（aiFindNearestEnemyCity引用、确认移动no-op注释） | 清理 |

### 10局AI模拟验证

使用Node.js headless模拟器（DOM stub + 快进模式），三方全AI托管，每局180旬（5年）：

| 指标 | 魏 | 蜀 | 吴 |
|------|-----|-----|-----|
| 初始城数 | 21 | 11 | 13 |
| 终局平均 | 16.2 | 15.8 | 13.0 |
| 优势次数 | 3/10 | 6/10 | 0/10 |

**分析**：
- 蜀将单体战力偏强（关羽+张飞6000兵 vs 魏任何单部队胜率56-82%），开局第一波打赢就滚雪球
- 魏军虽有5支部队24000总兵力 vs 蜀3支16000，但每支兵力弱于蜀、1v1打不过
- 吴国基本不参与（初始外交neutral，AI不攻中立势力），符合史实孙权守成风格
- 方差大：要么魏碾压(24:8)要么蜀碾压(21:11)，开局交战决定走向

---

## 遗留代码质量问题

| # | 问题 | 优先级 |
|---|------|--------|
| Q6 | `unit.gx/gy` 与 `unit.hq/hr` 冗余（gx/gy残留34处引用，hq/hr 164处） | 中 |
| Q7 | `_unitMenu` 防御性清理 | 极低 |

---

## 待办事项（下轮）

**下一步路线图**：AI系统完善（平衡性+经济+征兵）→ C3（宣战宣称）→ 游戏可玩

### 优先级1 — AI系统完善（下轮重点）

1. **AI平衡性调参**：
   - 初始部队编制调整：魏军提高单部队兵力基数（弥补武将战力劣势）
   - 蜀军开局部队分散/兵力降低（历史上蜀汉确实国力不如魏）
   - 征兵节奏优化：AI当前征兵不够积极，魏国守着8000金不征兵
2. **G2 Phase 3 经济动态化**：
   - 预算分配：AI根据局势动态分配金钱到军事/基建/征兵
   - 前线城少建设、后方城多基建
   - 资源不足时的优先级决策
3. **AI征兵策略**：确保AI在有钱时积极征兵扩军，特别是被打后快速补充

### 优先级2 — 应做

4. **C3 宣战宣称 + 挟天子**
5. 武将技能实装（60将技能desc已写）
6. 反伏击机制
7. AI伏击/扎营（从Phase 2拆出）

### 优先级3 — 可选

8. 地图裁剪
9. Q6: `gx/gy` → `hq/hr` 统一

### Sprint 状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 + AI人格化 | ✅ 已关闭（B4并入G2） |
| C 战略层博弈 | 🔄 C3待做，C4迷雾✅已完成 |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ⏳ 未开始 |
| G AI优化 | 🔄 G2 P1✅ P2✅ P3待做，平衡性调参待做 |
| H UX优化 | 🔄 移动预览✅ 围城弹窗✅ 渲染优化✅ |

---

## v87 新增武将 + 部队重配 + G2 Phase 3 经济动态化

### 新增13位武将

**魏国 +7**（22→29将）：李典、臧霸、蒋济、刘晔、牛金、朱灵、陈群
**蜀国 +3**（19→22将）：黄权、邓芝、严颜
**吴国 +3**（19→22将）：贺齐、顾雍、步骘

每位新将都有完整的：GENS_FULL属性/适性/role、GEN_META（title雅号、post官职、skills被动技能、loyalty、values、birthplace、clan/gentry/faction_clan、relations）

### 全部武将title改为四字雅号

73位武将（60原有+13新增）的title从官职名改为四字以内的历史雅号，如：
- 曹操"治世能臣"、关羽"武圣"、诸葛亮"卧龙"、张辽"威震四方"、周瑜"美周郎"、孙策"小霸王"
- 新增：李典"儒侠将军"、陈群"九品宗师"、严颜"断头将军"、顾雍"寡言丞相"等

### 初始部队全面重配

**设计原则**：
- 参照建安后期（约219年）势力分布
- 每支部队1名将主将 + 2二线副将（智勇互补）
- 魏国前线兵力基数高于蜀吴（国力优势）
- 蜀国名将分散：关羽守襄阳、张飞黄忠守汉中、赵云后方

| 势力 | 部队数 | 总兵力 | 配置 |
|------|-------|--------|------|
| 魏 | 7支 | ~106,000 | 每支3 squads，单位过万 |
| 蜀 | 4支 | ~60,000 | 每支3 squads，单位过万 |
| 吴 | 4支 | ~62,000 | 每支3 squads，单位过万 |

**魏国7支部队**：
- 许昌：曹操+许褚+荀攸（中枢机动）
- 南阳：曹仁+满宠+牛金（对蜀襄樊前线）
- 天水：夏侯渊+郭淮+朱灵（对蜀汉中前线）
- 下邳：张辽+乐进+李典（对吴淮南前线）
- 邺城：夏侯惇+曹洪+臧霸（后方守备）
- 洛阳：徐晃+于禁+蒋济（中原策应）
- 徐州：张郃+典韦+刘晔（东线守备）

**蜀国4支部队**：
- 汉中A：张飞+马忠+法正（汉中前线）
- 汉中B：黄忠+王平+吴懿（汉中前线）
- 襄阳：关羽+廖化+严颜（襄樊前线）
- 成都：赵云+张翼+霍峻（后方机动）

**吴国4支部队**：
- 建业：孙策+程普+朱然（首都守备）
- 武昌：吕蒙+韩当+黄盖（西线）
- 合肥：甘宁+凌统+丁奉（北线主力）
- 柴桑：太史慈+徐盛+潘璋（江防机动）

### 现有武将relations补充

张辽↔李典/乐进互为同僚、曹仁↔牛金主将/部将、郭淮↔夏侯渊主将关系

### G2 Phase 3：经济动态化（预算分配系统）

#### 新增函数

| 函数 | 说明 |
|------|------|
| `_aiCalcBudget(fid)` | ★核心：每旬计算可用预算，按战争状态分配到军事/基建 |

#### 预算分配逻辑

```
reserveGold = 全军军饷 × MIN_SALARY_BUFFER（2旬）
availableGold = fac.res.gold - reserveGold

紧急（有defend部队）→ 军事90% / 基建10%
战争（有enemy势力）→ 军事70% / 基建30%
和平               → 军事30% / 基建70%

存入 fac._aiBudget = { military, build }
```

#### aiDoRecruit 重写

- **删除**：3旬间隔限制（每旬可征兵）
- **删除**：残兵加速补员机制（依赖自动补员 processReinforcement）
- **删除**：旧的金钱软约束（MIN_SALARY_BUFFER=6旬缓冲）
- **新增**：从 `fac._aiBudget.military` 扣费
- **新增**：支持3 squads征兵（主将5000 + 副将1×4000 + 副将2×3000 = 12000）
- **新增**：后方大城优先征兵（前线城排后面）
- **新增**：副将选择放宽条件（`g.war>=60 || g.com>=65`，文官也可编入）
- **新增**：城市邻接表懒初始化（不再依赖aiDoBuild先跑）

#### aiDoBuild 改写

- 金钱约束改为从 `fac._aiBudget.build` 扣除
- 删除旧的"保留6旬军饷缓冲"独立判断

#### 参数调整

| 参数 | 旧值 | 新值 | 原因 |
|------|------|------|------|
| `AI_RECRUIT_TROOPS_BASE` | 4000 | 5000 | 匹配万人编制 |
| `MIN_SALARY_BUFFER` | 6 | 2 | 预算系统已接管，保底储备降低 |
| 魏初始金 | 8000 | 20000 | 兵力×3需更多启动资金 |
| 蜀初始金 | 5000 | 12000 | 同上 |
| 吴初始金 | 9000 | 15000 | 同上 |

#### runAI 新执行顺序

```
0. _aiCalcBudget      → ★ G2P3: 计算本旬预算分配
1. aiDoDiplo           → 外交
2. aiDoDisband         → 裁军
3. aiDoRecruit         → ★ G2P3: 征兵（用军事预算）
4. aiDoBuild           → ★ G2P3: 基建（用基建预算）
5. aiDefendResponse    → G2P2: 防守响应
6. aiSelectTargets     → G2: 战略决策
7. aiExecuteOrders     → G2: 执行层
8. aiDoSiege           → G2: 攻城决策
9. aiDoRecruitWild     → 招募在野武将
```

### 模拟验证

5局60旬全hostile模拟（无经济循环，仅验证AI逻辑）：
- 魏 avg 16.2城（21→16.2），兵力优势保持但两线被蚕食
- 蜀 avg 15.4城（11→15.4），名将强度换城数
- 吴 avg 13.4城（13→13.4），征兵积极（4→7支部队）
- 三方均无一边倒，方差合理
- runAI / checkBattleTriggers 零JS错误

---

## 遗留代码质量问题

| # | 问题 | 优先级 |
|---|------|--------|
| Q6 | `unit.gx/gy` 与 `unit.hq/hr` 冗余 | 中 |
| Q7 | `_unitMenu` 防御性清理 | 极低 |

---

## v88 战斗公式修正 + 补给线系统

### estimateWinRate 蒙特卡洛修正

**问题**：旧公式 `rollA/(rollA+rollB)` 是线性近似，与实际战斗（双方各×rand(0.50,1.50)比大小）的非线性结果有严重偏差。偏差最大达±35个百分点——估算说35%胜率，实际只有1-8%。

**修复**：改为80次蒙特卡洛模拟，模拟与resolveBattle相同的随机roll比大小，偏差降至±1.2pp。

**影响范围**：所有依赖estimateWinRate的系统自动获益——AI进攻/防守/围城决策、撤退判定、UI胜率显示。无需调整阈值参数。

### 战斗随机范围调整

**改动**：`rand(0.70, 1.30)` → `rand(0.50, 1.50)`，影响3处：
- `resolveBattle`（2处）
- `resolveAmbush`（2处）

**效果**：以弱胜强过渡带拉宽。名将约值1.5-1.7倍兵力（关羽3400兵 ≈ 普通将5000兵）。

**胜率曲线对比**（普通将A light vs 关羽5000 heavy）：

| 兵力 | v87(±30%) | v88(±50%) |
|------|-----------|-----------|
| 5000 | 0% | 4% |
| 6000 | 6% | 19% |
| 7000 | 35% | 41% |
| 8000 | 74% | 65% |

### 粮饷费率简化

**旧**：5档费率（行军/围城/扎营/驻扎/billeted），区分过细。

**新**：

| 状态 | 粮食 | 金钱 |
|------|------|------|
| 行军/围城 | 0.010 (100%) | 0.018 (100%) |
| 驻扎/扎营/埋伏 | 0.005 (50%) | 0.018 (100%) |
| billeted | 0.002 (20%) | 0.0036 (20%) |

**修改函数**：`getUnitFoodRate` / `getUnitSalaryRate`（简化为三档/两档）
**同步修改**：`aiDoDisband`硬编码费率、UI显示文案、billeted提示

### 补给线系统（新增）

#### 核心机制

从己方所有城市同时做BFS洪泛扩散，标记"补给可达"的hex。部队在可达hex内=补给通畅，不在=断补。

#### 新增常量

| 常量 | 值 | 说明 |
|------|---|------|
| `SUPPLY_MAX_RANGE` | 13 | 补给最大距离（BFS总预算） |
| `SUPPLY_RATIONS` | 3 | 自带存粮（旬） |
| `SUPPLY_CITY_RESTORE_TURNS` | 2 | 新占城市恢复补给所需旬数 |
| `SUPPLY_ENEMY_PENALTY` | 2 | 敌方领地额外消耗 |

#### 地形补给消耗

| 地形 | 消耗 |
|------|------|
| 平原/道路 | 1 |
| 丘陵/森林 | 2 |
| 山地/沼泽/河流 | 3 |
| 水域(water) | 5 |
| 近海(coastal) | 6 |
| 深海/impassable | 不可通过 |

敌方领地内每格额外+2（如敌方平原=1+2=3，敌方山地=3+2=5）。

#### 补给阻断

- 敌方部队所在格直接阻断补给路径
- 只有**己方FOG_VISIBLE视野内**的敌军才算阻断（迷雾中的不影响）
- 新占领城市需要2旬恢复才能作为补给节点

#### 断粮惩罚

| 断粮旬数 | 效果 |
|----------|------|
| 1-3旬 | 吃存粮，无影响 |
| 4-6旬 | 士气-15/旬，逃兵5%/旬 |
| 7-9旬 | 士气-20/旬，逃兵10%/旬 |
| 10旬+ | 士气-25/旬，逃兵15%/旬 |

#### 新增函数

| 函数 | 说明 |
|------|------|
| `buildSupplyMap(fid)` | ★核心：BFS洪泛扩散，返回补给可达hex Map，每旬缓存 |
| `isUnitSupplied(unit)` | 检查部队是否在补给范围内 |
| `processSupplyStatus()` | 每旬处理补给状态+断粮惩罚，在processUnitFood前调用 |
| `renderOverlaySupply()` | 🚚补给overlay可视化（绿=通/暗红=断） |

#### 新增数据字段

| 字段 | 位置 | 说明 |
|------|------|------|
| `unit._noSupplyTurns` | unit | 连续断补旬数，补给恢复时清零 |
| `city._supplyRestoreTurns` | city | 新占城市补给恢复倒计时 |
| `_supplyCache` | 全局 | 势力补给图缓存 `{fid: {map, turn}}` |

#### UI改动

- 新增🚚补给overlay按钮（右上角overlay面板）
- 补给可达区域：绿色渐变（越远越暗）
- 补给不可达区域：暗红色
- 断粮部队标注：闪烁红圈+存粮/断粮旬数
- 部队tooltip新增补给状态显示（✅补给通畅 / ⚠存粮X旬 / 🍚断粮X旬）

#### runAI/nextTurn执行顺序更新

```
...
processUnitMovement();
updateFog();
checkBattleTriggers();
processSiegeDecay();
processReinforcement();
processMobilizing();
processSupplyStatus();    ★ v88新增：补给线检测+断粮惩罚
processUnitFood();        ★ v88修改：断补部队不从城市扣粮
processUnitSalary();
...
```

### 发现的遗留问题：兵种混编违规

**问题**：15支初始部队中9支违反VALID_COMBOS限制——cavalry+heavy不在合法搭配列表中，但大量部队使用了该组合。

**根因**：v87新增部队时按史实编制，没有对照VALID_COMBOS规则检查。

**计划修复方案**（下轮）：
1. 取消VALID_COMBOS硬限制，改为全面放开兵种搭配
2. 重写`getMixedBonusMult`为查表制——25种组合各有预定义乘数（buff/debuff）
3. 征兵UI实时显示当前组合乘数，引导玩家选择高buff搭配
4. AI征兵逻辑同步查表，优先高buff组合

**混编乘数表（待实装）**：

| 组合 | 乘数 | 定位 |
|------|------|------|
| cavalry+light | ×1.08 | 轻骑协同 |
| heavy+archer | ×1.08 | 弓步配合 |
| light+heavy+archer | ×1.06 | 步弓全能 |
| light+heavy | ×1.04 | 步兵互补 |
| light+archer | ×1.04 | 掩护射击 |
| heavy+archer+siege | ×1.04 | 攻城最佳 |
| cavalry+light+archer | ×1.02 | 轻骑+弓 |
| light+heavy+siege | ×1.02 | 步兵护攻城 |
| heavy+siege | ×1.02 | 重步护攻城 |
| cavalry+light+heavy | ×1.00 | 能用但不协同 |
| cavalry+archer | ×1.00 | 不经典 |
| light+siege | ×1.00 | 凑合 |
| 单一兵种 | ×1.00 | 基准 |
| light+archer+siege | ×0.98 | 缺重步扛线 |
| cavalry+heavy | ×0.94 | 速度冲突 |
| cavalry+heavy+archer | ×0.94 | 骑兵被拖 |
| cavalry+light+siege | ×0.94 | 骑+攻城冲突 |
| archer+siege | ×0.94 | 弓兵护不了攻城 |
| cavalry+siege | ×0.90 | 骑兵+攻城全冲突 |
| cavalry+heavy+siege | ×0.90 | 全面冲突 |
| cavalry+archer+siege | ×0.90 | 全面冲突 |

---

## 遗留代码质量问题

| # | 问题 | 优先级 |
|---|------|--------|
| Q6 | `unit.gx/gy` 与 `unit.hq/hr` 冗余 | 中 |
| Q7 | `_unitMenu` 防御性清理 | 极低 |

---

## 待办事项（下轮）

### 优先级1 — 近期必做

1. **兵种混编重做**：取消VALID_COMBOS限制，改查表制buff/debuff，征兵UI引导+AI适配
2. **C3 宣战宣称 + 挟天子**
3. **AI伏击/扎营**（从Phase 2拆出）
3. **AI平衡性持续调参**：在浏览器内用快进模式做完整经济循环测试

### 优先级2 — 应做

4. 武将技能实装（73将技能desc已写）
5. 反伏击机制

### 优先级3 — 可选

6. 地图裁剪
7. Q6: `gx/gy` → `hq/hr` 统一

### Sprint 状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 + AI人格化 | ✅ 已关闭 |
| C 战略层博弈 | 🔄 C3宣称设计已确认待实装，C4迷雾✅，补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2 P1✅ P2✅ P3✅，estimateWinRate修正✅ |
| H UX优化 | 🔄 移动预览✅ 围城弹窗✅ 渲染优化✅ 补给overlay✅ |

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v90.html |
| 总行数 | ~17000 行 |
| 武将总数 | 魏29/蜀22/吴21（共72位势力将领）+ 20位在野武将（WILD_GENS）|
| 初始部队 | 魏7支(106k)/蜀4支(60k)/吴4支(62k)，每支3 squads |

---

### v87 追加：role标签清理 + 撤退追击三档系统

#### role标签清理

**删除**：`general`/`advisor`/`minister` 三个role值（89处），只保留 `ruler`（6处）。

**改为属性驱动**：
| 原逻辑 | 新逻辑 |
|--------|--------|
| 单挑叫阵排除advisor/minister | war < 70 不主动叫阵 |
| 被动单挑卷入按role权重 | war≥70: 100%, ≥50: 15%, <50: 3% |
| AI征兵选主将优先general | 纯com排序，ruler优先 |
| AI征兵选副将role过滤 | 纯com排序，无过滤 |
| 士族/寒门兜底按role | pol≥70视为士族出身 |

#### 撤退追击三档系统（重写 canRetreat + doRetreat）

**新增函数**：

| 函数 | 说明 |
|------|------|
| `calcRetreatResult(fleeSide, chaseSide)` | ★核心：三档概率判定（完全脱离/部分脱离/脱离失败） |
| `calcPursuitLoss(fleeSide, chaseSide)` | 追击损失计算（部分脱离时） |

**三档概率表**（基于 apDiff = fleeAP - chaseAP）：

| apDiff | 完全脱离 | 部分脱离 | 脱离失败 |
|--------|---------|---------|---------|
| ≥2（骑兵跑步兵） | 70% | 25% | 5% |
| 1 | 40% | 45% | 15% |
| 0（同速） | 15% | 45% | 40% |
| -1 | 5% | 25% | 70% |
| ≤-2（步兵跑骑兵） | 0% | 10% | 90% |

**三档效果**：

| 档位 | 撤退方 | 追击方 |
|------|--------|--------|
| 完全脱离 | 退2格，零损失 | 前进到撤退方原位置 |
| 部分脱离 | 退1格，追击损失+士气-8 | 前进到撤退方原位置 |
| 脱离失败 | 原地，强制野战（UI已禁用撤退按钮） | — |

**追击损失公式**：
```
loss = 撤退方兵力 × 0.06
  × min(2.0, sqrt(追方兵力/退方兵力))
  × min(1.5, 追方AP/退方AP)
  × 地形(平原1.3/hill1.0/mountain forest0.7/swamp0.5)
  × 随机±20%
cap: min(撤退方兵力×25%, 计算值)
```

**防死循环**：`unit._retreatedThisTurn` 标记每旬只能撤退1次，nextTurn开头重置。

**doRetreat改写**：
- 新增 `chasers` 和 `retreatResult` 参数
- 方向性撤退（远离追击方）
- 追击方自动占据撤退方原位置
- 部分脱离时均摊追击损失到各分队
- 向后兼容旧调用（无参数时按partial处理）

**UI更新**：战斗确认弹窗撤退按钮显示三档风险提示（"全师而退"/"恐遭追击"/"退路已断"）

---

## v89 兵种混编重做

### 设计变更

**旧系统**：`VALID_COMBOS`硬限制（6种合法双兵种搭配），不合法组合在征兵时直接拦截。`getMixedBonusMult`用if-else叠加计算每个squad独立乘数。

**新系统**：取消硬限制，改为查表制buff/debuff。任何兵种组合都允许，但不同搭配有不同乘数（×0.90~×1.08），引导玩家/AI选择高效组合而非强制禁止。

### 删除代码

| 代码 | 原因 |
|------|------|
| `VALID_COMBOS` 数组 | 被`MIXED_COMBO_MULT`查表替代 |
| `isValidTroopCombo()` 函数 | 不再需要合法性校验 |
| `confirmRecruit`中的combo校验拦截 | 不再阻止任何组合 |

### 新增代码

| 代码 | 说明 |
|------|------|
| `MIXED_COMBO_MULT` | 混编乘数查表（19种双/三兵种组合预定义乘数） |
| `getMixedComboMult(types)` | 核心查表函数：兵种数组→去重排序→拼key→查表 |
| `getMixedComboLabel(types)` | UI辅助：返回`{mult, label, color}`用于征兵面板显示 |

### 重写代码

| 代码 | 修改 |
|------|------|
| `getMixedBonusMult(unit)` | 旧：if-else按squad差异化乘数。新：调用`getMixedComboMult`返回统一乘数数组（向后兼容`calcUnitATK`的`mixedMults[i]`索引） |
| `aiDoRecruit(fid)` | 旧：每将独立选适性最高兵种。新：先选将→枚举候选兵种组合→`score = 适性乘数之积 × 混编乘数`→选最高分组合 |
| 征兵UI `renderRecruitModal` | 旧：显示"⚠搭配不符合史实编制"拦截。新：实时显示混编乘数预览（绿=协同buff / 红=冲突debuff / 灰=中性） |

### 混编乘数表

| 组合 | 乘数 | 定位 |
|------|------|------|
| cavalry+light | ×1.08 | 轻骑协同 |
| archer+heavy | ×1.08 | 弓步配合 |
| archer+heavy+light | ×1.06 | 步弓全能 |
| heavy+light | ×1.04 | 步兵互补 |
| archer+light | ×1.04 | 掩护射击 |
| archer+heavy+siege | ×1.04 | 攻城最佳 |
| archer+cavalry+light | ×1.02 | 轻骑+弓 |
| heavy+light+siege | ×1.02 | 步兵护攻城 |
| heavy+siege | ×1.02 | 重步护攻城 |
| cavalry+heavy+light | ×1.00 | 能用但不协同 |
| cavalry+archer | ×1.00 | 不经典 |
| light+siege | ×1.00 | 凑合 |
| 单一兵种 | ×1.00 | 基准 |
| archer+light+siege | ×0.98 | 缺重步扛线 |
| cavalry+heavy | ×0.94 | 速度冲突 |
| archer+cavalry+heavy | ×0.94 | 骑兵被拖 |
| cavalry+light+siege | ×0.94 | 骑+攻城冲突 |
| archer+siege | ×0.94 | 弓兵护不了攻城 |
| cavalry+siege | ×0.90 | 骑兵+攻城全冲突 |
| cavalry+heavy+siege | ×0.90 | 全面冲突 |
| archer+cavalry+siege | ×0.90 | 全面冲突 |

### AI征兵优化逻辑

1. **选将**：com排序，ruler优先（不变）
2. **候选兵种**：每将取适性≥B（APT_MULT≥1.0）的兵种，至少保留最高适性那个
3. **枚举组合**：3将×各自候选兵种，最多约4³=64种组合
4. **打分**：score = ∏(各将APT_MULT) × getMixedComboMult
5. **选最高分**：自然避开高适性但混编冲突的搭配

---

## 待办事项（v95 基准，全量）

> 每项标注状态（待做/钩子已埋/设计已确认），方便逐项 check & audit。

---

### ⚡ P1 — AI 智能化 Sprint（下轮重点）

#### GT1. 威胁矩阵 + 安全边际（~100-150行）｜✅ v96已实装

**问题**：当前AI只看"打谁最赚"，不考虑"打A时B会不会趁虚而入"。三方混战时经常倾巢进攻被偷家。

**设计方向**：
- 新增 `_aiThreatMatrix(fid)` — 对每个邻接势力算威胁分（权重因子：边境兵力、外交关系、历史攻击记录、城市暴露度）
- 在 `aiSelectTargets` 中加"后方暴露度"检查：
  - 若第三方威胁分高 → 限制最多派出总兵力的60%进攻，保留40%机动
  - 若两面受敌 → 只选1个主攻目标（当前最多2个）
  - 若后方城市无守军且邻接高威胁势力 → 优先守备而非进攻
- 威胁分每3旬更新一次（缓存），事件驱动刷新（外交变化/丢城）

**改动范围**：`aiSelectTargets` 内部 + 新增1个评估函数，不动其他系统

#### GT2. 鹰鸽博弈（~50-80行）｜✅ v96已实装（精确胜率版，fuzzyWR待做）

**问题**：当前AI部队遭遇敌军只有"打"和"被动撤退"两种行为，弱势方不会主动避战保存实力。

**设计方向**：
- 在 `aiExecuteOrders` 的行军阶段加入遭遇判断：
  - 行军路径上检测到视野内敌军 → 评估胜率
  - 胜率 < 35% → 主动绕路或halt等援（鸽）
  - 胜率 35-50% → 根据任务重要度决定（进攻任务可冒险，defend任务保守）
  - 胜率 > 50% → 继续推进（鹰）
- 围城博弈：守方AI在被围时评估"援军到达前能否撑住"：
  - 城防高+粮食足+援军在路上 → 死守
  - 城防低+无援 → 主动出城野战（趁城防加成还在时博一把）或弃城突围

**改动范围**：`aiExecuteOrders` + `aiDoSiege` 守方逻辑

#### GT3. 军备竞赛感知（~30-50行）｜✅ v96已实装

**问题**：当前 `_aiCalcBudget` 用固定比例分配预算（战争70/30、和平30/70），不感知敌方军力变化。

**设计方向**：
- 在 `_aiCalcBudget` 中加入敌方军力增长感知：
  - 记录上旬敌方总兵力快照 `fac._aiEnemyPowerSnap`
  - 敌方兵力增长 > 15% → 军事预算比例上浮10%（对方在扩军，我也得跟）
  - 己方兵力优势 > 1.5倍 → 军事比例下调10%，多投基建（领先就发展经济）
  - cap在20%-90%之间，避免极端
- 效果：形成自然的军备竞赛/和平发展动态

**改动范围**：`_aiCalcBudget` 内部，约30行

#### B4. 君主人格化｜钩子已埋

**现状**：`AI_PERSONALITY` 对象已存在（~行5064），三家用完全相同的值 `{atkThreshold:0.50, siegeThreshold:0.55}`。

**待做**：
- 三家差异化参数：曹操低阈值激进扩张 / 刘备高阈值稳守反击 / 孙权中间偏守
- 扩展维度：征兵激进度、外交倾向（主动结盟vs单干）、扩军节奏
- 与GT联动：GT1的后方留兵比例、GT2的鹰鸽阈值、GT3的预算弹性均读 AI_PERSONALITY

#### AI 经济/基建决策优化｜待做

**现状**：
- `_aiCalcBudget`（~行6024）：硬编码比例（被攻90%/战争70%/和平30%军事），不考虑产出最大化
- `aiDoBuild`（~行4229）：静态优先级列表，前线完全不建，不做投资回报评估
- AI不做调粮（只有玩家有 `checkResupply`）
- AI不管理太守任命（太守POL影响民心和建设速度，但AI从不换太守）
- AI不调整官职（v95开局有INIT_POSTS预填，但之后不会根据情况换人）

**待做**：
- `aiDoBuild` 加投资回报评估（farm Lv2 vs market Lv1 哪个回本快）
- 前线城允许建城墙/兵营（当前一刀切不建）
- 新增 `aiManagePrefects` — AI每N旬评估太守-城市匹配度
- 新增 `aiManagePosts` — AI根据功绩和需求调整官职任命
- AI调粮逻辑（富余城→缺粮城）

#### AI 挖角｜钩子已埋

**现状**：`aiDoRecruitWild` 已实装（每3旬评分招最优在野武将，~行4711）。`recruitableGens` 池已维护（忠诚<45自动入池，~行6402）。但AI完全不挖角——只有玩家可以调用 `poachGen`。

**待做**：新增 `aiDoPoach(fid)` — 遍历 `recruitableGens` 中非己方武将，评估价值（属性/技能/稀缺性），花钱尝试挖角。在 `runAI` 中调用，频率可与招募在野错峰。

---

### P2 — 战斗升级 + 内政深化 + 战斗补完

| # | 项目 | 状态 | 说明 |
|---|------|------|------|
| 0 | **战斗prototype验证** | 待做 | 独立文件 `battle_prototype.html`，验证2D半即时战斗核心手感。30×20小地图，10单位以内（最多三支部队=9squads），暂停下令+实时执行，Canvas 2D。详见下方设计备忘 |
| 1 | **I1 太守建设buff** | 设计已确认 | 太守标签+属性→建筑加成，~50-80行，详见下方Sprint I设计方案 |
| 2 | **I3 朝议系统** | 设计已确认 | 每12旬派系谏言+取舍，~150-200行，详见下方Sprint I设计方案 |
| 3 | **武将技能实装** | 待做 | 73将技能desc已写（107处"待实装"），分批挂载到战斗/内政/外交 |
| 4 | **AI伏击/扎营** | 待做 | AI主动利用ambush/camp状态，aiExecuteOrders扩展 |
| 5 | **反伏击机制** | 待做 | 侦察/斥候探路，INT影响识破概率 |
| 6 | **玩家即时移动** | 设计已确认 | 玩家部队点击目标后即时逐hex执行（带动画+视野刷新），中途发现敌军可手动停下/改目标。改 `processUnitMovement` 为玩家侧即时执行，AI侧保持nextTurn批量处理。架构改动较大 |
| 7 | **情报模糊（玩家UI）** | 设计已确认 | 视野内敌方部队信息按己方最高INT分层显示（兵力模糊/武将识别/士气可见度）。详见GT2设计方案中的INT阈值表 |

---

### P3 — 系统完整性（Sprint E）

| # | 项目 | 说明 |
|---|------|------|
| 1 | **E1 水战系统** | 水域节点切换水战规则，新增ship兵种，火攻效果翻倍（需风向条件） |
| 2 | **E2 地域特色兵种** | 占领特定城市解锁：丹阳兵(light S) / 西凉铁骑(cavalry S) / 荆州水军(ship)。依赖E1 |
| 3 | **E3 科技树（基础版）** | 三轨（军事/内政/外交），有CD，解锁被动加成 |

---

### 远期 — 内容扩展 + 美术

| # | 项目 | 说明 |
|---|------|------|
| 1 | **整体美术优化** | 当前纯文字/emoji/CSS → 武将头像、地图贴图、UI主题。可分步：头像→地图→UI |
| 2 | **三国百科** | 武将/城市/战役历史词条，游戏内可查阅 |
| 3 | **190剧本** | 初平元年群雄讨董，多势力、不同城市/武将配置。需支持>3势力 |

---

### 技术债（可选）

| # | 项目 |
|---|------|
| 1 | 地图裁剪（边缘区域优化） |
| 2 | `gx/gy` → `hq/hr` 坐标统一 |
| 3 | AI平衡性调参（快进模式经济循环测试） |

---

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭（战斗/单挑/伏击/公式平衡/俘获） |
| B 武将深度 | ✅ 已关闭（派系/忠诚/双标签），B4人格化待做 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭（官职/等级/成长/亲密度） |
| E 系统完整性 | ⏳ 未开始（E1水战/E2地域兵种/E3科技树） |
| F 内容扩展 | ✅ v87新增13将+title重做。远期：百科+190剧本 |
| G AI优化 | 🔄 G2三阶段✅ 混编✅ GT三件套✅ → **B4人格化+经济优化+挖角+fuzzyWR 待做** |
| H UX优化 | ✅ 移动预览✅ 围城弹窗✅ 渲染优化✅ 补给overlay✅ 混编预览✅ |
| I 内政深化 | 🔄 I2豪族✅ → I1太守buff待做 / I3朝议待做 |

---

## GT 博弈论AI三件套 — 设计方案（✅ v96已实装，不含fuzzyEstimateWinRate）

> 设计原则：先做理性框架，B4人格化时再叠性格扰动。每个功能预留 `AI_PERSONALITY` 接口。
> 实装顺序：GT1威胁矩阵+分兵 ✅ → GT3预算 ✅ → GT2鹰鸽 ✅（不含模糊胜率）

---

### GT1. 威胁矩阵 + 分兵逻辑 ✅ v96已实装

**核心**：AI每3旬（+事件驱动）对每个邻接势力算一个威胁分，驱动出兵上限和部队分配。

#### 威胁公式

```
threat = intent × capability × vulnerability
```

**因子1：攻击意图（intent, 0~1）**

```js
if (敌对)  intent = 0.9;
if (中立)  intent = 0.5;
if (停战)  intent = 0.15 × (1 + anomaly);
if (盟友)  intent = 0.05 × (1 + anomaly);

// 部署异常度（仅盟友/停战可见对方部署时计算）
anomaly = max(0, borderRatio - 0.3) × 3;
borderRatio = 对方面向我边境2格内野战兵力 / 对方总野战兵力;
// borderRatio ≤ 0.3 → anomaly=0（正常），0.5 → 0.6，0.7 → 1.2
```

B4接口：anomaly系数（多疑君主更敏感）

**因子2：攻击能力（capability, 0~∞，通常0~10）**

```js
knownThreat = FOG_VISIBLE内确认的敌方部队总兵力;
estimatedTotal = 敌方城市数 × 平均每城产兵估值;
unknownThreat = max(0, estimatedTotal - knownThreat) × 0.5; // 不确定的算一半
capability = (knownThreat + unknownThreat) / 10000;
```

**因子3：我方脆弱度（vulnerability, 0~3）**

```js
// 对每座面向敌方的前线城，算兵力覆盖比
coverageRatio_i = 我方该城及周边1格野战兵力 / 敌方对应边境野战兵力;
deficit_i = max(0, 1 - coverageRatio_i);

// 加权聚合（裸露越多加速增长）
avgDeficit = Σ deficit_i / totalFrontline;
vulnerability = avgDeficit × (1 + Σdeficit_i × 0.3);
```

关键改进：用兵力比值而非布尔覆盖。3000残兵"覆盖"的前线城面对17000敌军，deficit=0.82，接近裸露。

#### 前线城定义

```
frontlineCitiesAgainst(myFac, enemyFac):
  我方城市中，ROADS邻居里有至少一座属于enemyFac的城市
```

同一座城可同时面向多个敌方势力（三面受敌的战略要冲）。190剧本多势力时逻辑不变。

#### 威胁分驱动输出

```js
maxDeployRatio = 1.0 - (highestThreat / (highestThreat + 5)) × 0.6;
// 威胁0→100%, 威胁2→83%, 威胁5→70%, 威胁10→60%

if (两个方向威胁都 > 3) → 本旬不主动进攻，全部防守
```

B4接口：分母常数5（激进君主更大→同等威胁下敢派更多兵）

#### 分兵逻辑（改 `aiSelectTargets`）

```
1. GT1算各方向威胁分
2. 进攻部队数 = floor(总部队 × maxDeployRatio)
3. 防守部队数 = 总部队 - 进攻部队数
4. 防守按威胁比例分配（±10%模糊带），低于门槛(1.5)的方向不分配野战部队
5. 进攻目标由 _aiScoreTarget 在敌对势力中选最优
6. 防守和进攻可面向同一方向（蜀国2支守汉中+2支北伐天水=正常）
```

#### 更新频率
- 每3旬定期更新（缓存）
- 事件驱动刷新：丢城、外交变化、部队被歼灭

#### 开局验证数据（v95数值推演）

| 视角 | vs魏 | vs蜀 | vs吴 | 最高威胁 | 出兵上限 |
|------|------|------|------|---------|---------|
| 魏 | — | 0.00 | 0.06 | 0.06 | 99% |
| 蜀 | 4.98 | — | 0.49 | 4.98 | 70% |
| 吴 | 2.66 | 0.21 | — | 2.66 | 79% |

蜀国面对魏国兵力劣势（60k vs 106k），威胁最高，出兵最保守。符合预期。

---

### GT2. 鹰鸽博弈 ✅ v96已实装（精确胜率版）

**核心**：AI部队行军前检查视野内敌军，基于胜率做打/停/搏决策。v96用精确estimateWinRate，fuzzyEstimateWinRate待后续叠加。

#### 行军遭遇决策

```
每旬开头，AI march状态部队检查当前位置视野内敌方部队：
  胜率 > 60%  → 鹰（继续行军）
  胜率 40-60% → 进攻任务→鹰，防守任务→鸽
  胜率 20-40% → 鸽（halt），除非目标城正被围→搏
  胜率 < 20%  → 无条件鸽（halt）
```

B4接口：各档阈值偏移（曹操60%→55%更激进，刘备60%→65%更保守）

#### halt等待机制

```
鸽 → halt，保留 _aiTarget 和 hexPath
新增 unit._aiHaltTurn = G.turn
每旬重评：
  → 视野内敌军消失 或 胜率回升超过对应阈值 → 清除 _aiHaltTurn，恢复march
  → G.turn - _aiHaltTurn >= 3 → 放弃任务，清除 _aiTarget，回城或转defend
```

#### 围城守方博弈

```
被围城市AI检查：己方有没有部队 _aiTarget 指向本城且预计≤3旬到达？

有援军（≤3旬）      → 死守
无援 + 城防衰减<70%  → 死守（加成还够）
无援 + 城防衰减>70% + 胜率20-50% → 出城野战（搏一把）
无援 + 胜率<20%      → 死守到底（等城破突围判定，30-65%概率保存有生力量）
```

不做主动弃城突围——城破时现有突围判定已覆盖有生力量保存。

#### 信息不对称（核心创新）

**AI不使用完美信息的 `estimateWinRate`，改用模糊估算版。**

```js
// 模糊精度由己方部队最高INT决定
INT >= 90 → 误差 ±10%
INT >= 75 → 误差 ±20%
INT >= 60 → 误差 ±30%
INT <  60 → 误差 ±40%

// AI估算敌方数据
估算兵力 = 实际兵力 × (1 + random(-误差, +误差))
估算士气 = 默认75（不知道真实值）
敌方武将属性 = 兵种平均值（不知道具体属性）
```

效果：A和B对同一场遭遇的胜率估算不同。A高估自己55%想打，B也高估自己52%想打——仗就打起来了。INT高的部队估算更准，决策质量更高。

**玩家侧也应显示模糊信息**（单独feature，本次不实装）：

| INT | 兵力显示 | 武将识别 | 士气 |
|-----|---------|---------|------|
| 90+ | ±10%近似 | 全部武将+大致属性 | ±10%近似 |
| 75-89 | ±20%模糊 | 主将+副将姓名 | 粗略区间 |
| 60-74 | ±30%模糊 | 可识别主将 | "高昂/低迷" |
| <60 | "数千"/"万余" | "不明将领" | 不可见 |

#### 实装范围（第一版）

- AI侧遭遇决策 + halt等待 + 围城守方 → 改 `aiExecuteOrders`
- 模糊estimateWinRate → 新增 `fuzzyEstimateWinRate(sideA, sideB, intLevel)`
- 玩家侧即时移动 + UI模糊显示 → 后续独立feature

---

### GT3. 军备竞赛感知 ✅ v96已实装

**核心**：GT1方向性威胁 → 聚合整体威胁 → 驱动军事vs基建预算比例。

#### 整体威胁聚合

```js
overallThreat = max(各方向威胁分) + 次高威胁分 × 0.3;
// 主要威胁决定基调，次要威胁增加紧张感
// 两面都高威胁时整体分更高
```

#### 预算比例（替代现有硬编码）

```js
// 现有：underAttack→90%, atWar→70%, peace→30%
// 新：基于整体威胁连续映射
if (overallThreat > 5)      militaryPct = 0.85;
else if (overallThreat > 3)  militaryPct = 0.70;
else if (overallThreat > 1)  militaryPct = 0.50;
else                         militaryPct = 0.30;
```

B4接口：各档阈值和比例可按君主性格调参

#### 征兵选址联动（改 `aiDoRecruit`）

```js
征兵优先度 = 该方向威胁分 × 该方向兵力缺口
```

威胁高且防守不足的方向优先征兵，作为"慢速部队调配"手段。

---

### GT 已实装内容

| 项目 | 状态 |
|------|------|
| 视野系统（基础3 + INT加成） | ✅ v95已实装 |
| GT1 威胁矩阵 | ✅ v96已实装 |
| GT1 分兵逻辑 | ✅ v96已实装 |
| GT2 鹰鸽博弈（行军遭遇+halt等待+围城守方） | ✅ v96已实装（用精确estimateWinRate） |
| GT2 情报模糊（AI侧 fuzzyEstimateWinRate） | 设计已确认，待实装（叠加到GT2上） |
| GT2 情报模糊（玩家UI） | 设计已确认，后续独立feature |
| GT2 玩家即时移动 | 设计方向已确认，后续独立feature |
| GT3 军备竞赛感知 | ✅ v96已实装 |

### GT 实装顺序

```
GT1威胁矩阵+分兵 ✅ → GT3预算 ✅ → GT2鹰鸽（不含模糊） ✅ → fuzzyEstimateWinRate 待做
```

---

## 战斗prototype设计备忘（待实装）

> 产品方向：未来2A版本（定价200+元）需要半即时战斗系统替代当前自动结算。先做独立prototype验证手感，通过后再设计与主项目的集成接口。

### 核心约束
- **独立文件**：`battle_prototype.html`，不嵌入主项目（17000+行单体HTML的稳定性风险 + 帧驱动vs事件驱动两套执行模型冲突）
- **技术栈**：HTML Canvas 2D，不换引擎。未来2A若需3D再考虑迁移
- **规模**：战场30×20格，每方最多3支部队（9个squad unit），总计不超过10个可操控单位
- **时长**：单场3-5分钟，必须保留自动结算选项（优势碾压局不强制手操）

### 操控模式
- 暂停下令 + 实时执行（不拼手速，和大战略气质一致）
- 前期只有一支部队（3个unit）也要有足够操作感——站位、目标选择、技能时机

### 核心机制（现有系统在半即时中的升级）
| 现有机制 | 当前（自动结算） | 半即时中 |
|---------|----------------|---------|
| 单挑 | 概率弹窗 | 武将单位间可主动发起的战术行为 |
| 连携 | 数值加成 | 相邻squad配合效果，需考虑站位 |
| 兵种搭配 | 乘数查表 | 空间博弈：骑兵绕后需真实移动、弓兵需射程和遮挡 |
| 伏击 | 自动判定 | 玩家预先在战场布置伏兵位置 |
| 地形 | 战力修正系数 | 高地视野/森林隐蔽/河流阻碍实际移动 |

### 技术要素
- 单位状态机：idle / move / attack / skill / retreat
- A*寻路（小格子地图，计算量可控）
- 碰撞：距离判定（不需要物理引擎）
- 渲染：requestAnimationFrame循环，Canvas 2D sprite
- 数据：硬编码几组典型配置（关羽骑兵队vs张辽混编队等），不接入主项目

### 验证标准（及格线）
- [ ] 单位寻路不犯蠢
- [ ] 碰撞检测不穿模
- [ ] AI对手行为看起来合理
- [ ] 暂停/下令操控手感流畅
- [ ] 3-5分钟能打完一场不拖沓
- [ ] 3个unit（单支部队）就有足够决策空间

### 集成接口（prototype通过后设计）
- 进入战斗时：传入双方部队数据（squads、武将属性、兵种、地形类型）
- 战斗结束后：返回结果（伤亡、经验、俘虏、单挑结果等）
- 与主项目通信方式待定（同页面iframe / 独立窗口postMessage / 合并代码）

---

## Sprint I 内政深化 — 设计方案（已确认，待实装）

> 设计原则（已与制作人确认）：
> - 基建决策权在玩家手里，太守只提供被动buff
> - 豪族是地域士族的"民间延伸"，影响征兵成本和税收效率
> - 朝议是真实的派系取舍，不是选buff
> - 不设收集障碍，招降来者不拒（满足武将收集欲）
> - 继承危机暂缓，后期再加

### I1. 太守建设buff（~50-80行）

**核心思路**：太守的派系标签和属性值决定他对哪类建筑有加成，玩家仍然自主选择建什么，但安排对的人管对的城能获得效率加成。

**太守buff映射规则**：

| 太守特征 | buff类型 | 效果 |
|---------|---------|------|
| 士族（任意地域） | 商业建筑 | 建设速度+15%，产出+10% |
| 士族 + 本地地域匹配 | 商业建筑 | 建设速度+20%，产出+15%（叠加本地优势） |
| 寒门武将（humble） | 军事建筑 | 建设速度+15%，城防修复+10% |
| pol ≥ 75 | 民生建筑（农业/治安） | 建设速度+12% |
| com ≥ 75 | 军事建筑 | 建设速度+12% |
| 创始团队/元老 | 全类型 | 建设速度+5%（经验老道的通用加成） |
| 降将（tenure < 180旬） | 全类型 | 建设速度-10%（地方不配合） |

**叠加规则**：取最高的一条类型buff + 创始/降将的通用修正，不无限叠加。

**UI**：城池建设面板里，每个建筑选项旁显示太守buff（绿色箭头+百分比）。

**代码**：新增 `getPrefectBuildBuff(cityId, buildingType)` 函数，改动建设速度计算和建设UI。

### I2. 地方豪族系统（~60-80行）

**核心思路**：每个城市新增"豪族支持度"（0-100），绑定该城市所在地域的士族派系。影响征兵成本和税收效率。

**豪族支持度变化因素**：

| 因素 | 影响 |
|------|------|
| 太守是本地域士族 | +0.3/旬 |
| 太守是外地域士族 | -0.1/旬 |
| 太守是寒门/降将 | -0.2/旬 |
| 该地域士族派系影响力 > 20% | +0.1/旬（中央重视本派系） |
| 该地域士族派系影响力 < 5% | -0.2/旬（中央边缘化本地人） |
| 朝议中采纳本地域相关提议 | 一次性+5 |
| 朝议中驳回本地域相关提议 | 一次性-3 |

**豪族支持度效果**：

| 支持度区间 | 征兵成本修正 | 税收效率修正 | 额外效果 |
|-----------|------------|------------|---------|
| 80-100（拥戴） | -15% | +15% | 解锁"乡勇动员"（紧急额外征兵） |
| 60-79（支持） | -5% | +5% | — |
| 40-59（中立） | 基准 | 基准 | — |
| 20-39（不满） | +15% | -10% | — |
| 0-19（抗拒） | +30% | -25% | 可能触发"隐匿户口"事件 |

**初始值**：势力本土城市60，新占领城市30，新占领且本地域无士族在朝40。

**数据**：`G.cities[cityId].gentrySupport`，新增 `processGentrySupport()` 每旬调用。

### I3. 朝议系统（~150-200行）

**核心思路**：每12旬触发一次朝议，影响力前2-3的派系各提一条谏言，玩家必须选择采纳其中一条（或全部驳回但代价大）。谏言是真实取舍，不是纯buff。

**谏言池示例**（每条有前置条件+采纳效果+驳回效果）：

**士族系**：
- "减免赋税以安民心"：采纳→税收-20%持续4旬，全城民心+8、豪族支持+5。驳回→提议派系忠诚-3
- "广开才路，举荐贤能"：采纳→在野武将投效概率+30%持续4旬，军事预算-15%。驳回→提议派系忠诚-3
- "修缮学宫，兴文教"：采纳→指定1城文化产出+25%持续8旬，花费500金。驳回→提议派系忠诚-2

**武将系/寒门**：
- "趁敌疲惫，厉兵秣马"：采纳→征兵费-20%持续4旬，民心-3。驳回→提议派系忠诚-3
- "整军备战，加固前线"：采纳→前线城城防+15%持续8旬，后方城建设暂停2旬。驳回→提议派系忠诚-2

**创始团队/宗亲**：
- "清查降将，以防内患"：采纳→降将忠诚-5，降将叛逃率-50%持续8旬。驳回→创始忠诚-3
- "赏赐元勋，以酬旧功"：采纳→创始全体忠诚+5，花费800金。驳回→创始忠诚-4

**降将/旧阀**（影响力够高时才有资格提）：
- "既往不咎，用人唯才"：采纳→降将全体忠诚+6，创始忠诚-2。驳回→降将全体忠诚-5

**全部驳回**：所有提议派系忠诚-4，获"乾纲独断"buff（下4旬建设/征兵不受派系影响）。

**UI**：弹窗形式，每条谏言一张卡片（派系色标+内容+采纳/驳回效果），底部"全部驳回"按钮。

**代码**：新增 `COUNCIL_PROPOSALS` 谏言池、`triggerCouncil(fid)` 生成、`resolveCouncil(fid, choice)` 结算，`nextTurn` 中每12旬检查触发。

### I1/I2/I3 实装优先级

1. I1（太守buff）— 最轻量，立刻增加城市管理决策维度
2. I2（豪族支持）— 和派系系统咬合最紧密
3. I3（朝议）— 工作量最大，体验冲击力最强

三个模块互相独立，可分轮实装。I2的豪族支持度可被I3朝议决策影响，但I2不依赖I3存在。

---

## C3 宣称 + 天子 + 称帝系统 — 设计方案（已确认，待实装）

> 核心理念（已与制作人确认）：
> - 不新增"正统值"，用现有信誉度(reputation) + 势力身份标签(facIdentity)解决
> - 宣称影响宣战的外交成本（信誉/第三方关系）和内政成本（派系忠诚）
> - 天子是可抢夺的战略资源，绑定城市（邺城），城市易手则天子易主
> - 称帝 = 对外全部强宣称 + 对内宣战负面效果消失
> - 任意一方称帝 → 天子概念彻底消亡
> - 玩家可以无宣称/弱宣称/强宣称宣战，都允许，代价不同

### 一、势力身份标签

```js
const FAC_IDENTITY = {
  wei: { type:'emperor_holder', _baseType:'warlord', traits:['枭雄'] },
  shu: { type:'han_royal',      _baseType:'han_royal', traits:['仁主','汉室'] },
  wu:  { type:'warlord',        _baseType:'warlord', traits:[] },
};
```

四种身份：`emperor_holder`（挟天子）/ `han_royal`（汉室宗亲）/ `warlord`（普通诸侯）/ `emperor`（称帝）

`_baseType`：失去天子时回退到的身份。刘备失去天子→回到han_royal，孙权→回到warlord。

### 二、天子系统

```js
G.emperor = { cityId:'ye', holder:'wei' }; // 天子在邺城，曹操控制
```

**城市易手时**：
- 天子所在城被攻下 → `G.emperor.holder = newFac`
- 旧持有者：`emperor_holder` → 降级为 `_baseType`
- 新持有者：身份变为 `emperor_holder`（覆盖原身份，包括han_royal）
- 无双重标签，只切换
- 称帝者(emperor)不受天子易手影响

### 三、称帝系统

**前置条件**（全部满足）：

| 条件 | 值 |
|------|-----|
| 城市数 | ≥ 10 |
| 信誉 | ≥ 40 |
| 非附庸 | — |
| 回合数 | ≥ 24（开局2年后） |
| 当前非emperor | — |

**称帝效果**：

全局：`G.emperor = null`（天子消亡，所有emperor_holder降级）

| 效果 | 说明 |
|------|------|
| 身份→emperor | 解锁吊民伐罪/讨伐伪帝 |
| 第三方rel | -15（其他未称帝势力）/ -25（已称帝势力） |
| 信誉 +10 | 正式称帝是正统性宣言 |

**称帝时一次性派系影响**：

| 武将标签 | warlord称帝 | emperor_holder称帝 | han_royal称帝 |
|---------|------------|-------------------|--------------|
| 汉室死忠 | **-15** | **-12** | **+5** |
| 士族 | -5 | -3 | +2 |
| 鹰派 | +3 | +3 | +3 |
| 鸽派 | -2 | -1 | 0 |
| 创始团队 | +3 | +3 | +3 |
| 宗亲 | +5 | +5 | +5 |
| 降将 | 0 | 0 | 0 |

**AI称帝逻辑**：每12旬检查一次。满足条件时：
- emperor_holder: 60%概率
- han_royal: 40%概率
- warlord: 80%概率

### 四、宣称类型

| 宣称 | 强度 | 准备旬数 | 谁能用 | 对谁用 | 条件 |
|------|------|---------|--------|--------|------|
| 奉旨讨逆 | 强 | 0 | emperor_holder | 任何 | 对han_royal有副作用 |
| 讨贼兴汉 | 强 | 2 | han_royal | emperor_holder/emperor | — |
| 吊民伐罪 | 强 | 1 | emperor | 任何非emperor | — |
| 讨伐伪帝 | 强 | 1 | emperor | emperor | — |
| 收复故土 | 中 | 1 | 任何 | 亲手从我夺城者 | 城市被对方直接夺走且仍在对方手中 |
| 兴兵复仇 | 中 | 2 | 任何 | 有血仇者 | 创始/宗亲被对方处决 |
| 边境清寇 | 弱 | 3 | 任何 | 接壤势力 | 有相邻城市 |

**宣称准备机制**：
- 每势力同时只能对一个目标准备一条宣称
- 准备期间目标不知情（迷雾内）
- ready后12旬有效期，过期作废
- 挟天子的"奉旨讨逆"prep=0，即时可用（核心优势）

### 五、宣战效果大表

**外交成本**：

| 宣称强度 | 信誉变化 | 第三方rel | 战后占城豪族支持 |
|---------|---------|----------|----------------|
| 强宣称 | 0 | 0（奉旨讨逆: +2） | +5 |
| 中宣称 | 0 | 0 | 不变 |
| 弱宣称 | -3 | -3 | -5 |
| 无宣称 | -12 | -10 | -15 |

**奉旨讨逆对han_royal使用**：信誉-10，汉室死忠-4，士族-2

**内政成本（派系忠诚）— 非emperor状态**：

| 武将标签 | 无宣称 | 弱宣称 | 中宣称 | 强宣称 |
|---------|--------|--------|--------|--------|
| 汉室死忠 | -5 | -2 | 0 | +3 |
| 士族 | -3 | -1 | 0 | +1 |
| 鹰派 | +2 | +2 | +2 | +3 |
| 鸽派 | -3 | -2 | -1 | 0 |
| 创始团队 | -2 | 0 | 0 | +1 |

**emperor状态宣战（全部走强宣称通道）**：

| 武将标签 | 效果 |
|---------|------|
| 汉室死忠 | +2 |
| 士族 | +1 |
| 鹰派 | +3 |
| 鸽派 | 0 |
| 创始团队 | +1 |
| 宗亲 | +2 |

全正或零。称帝后打仗是帝国扩张，无内政摩擦。

### 六、收复故土追踪

```js
// 城市易手时记录
G.cityHistory[cityId] = { takenBy:'wei', fromFac:'shu', turn:45 };
```

**校验**：`target === cityHistory.takenBy && fromFac === fid`，必须是对方亲手从你夺走。城市后被第三方拿走→该记录对原失主作废。

### 七、血仇系统

```js
G.feuds = { 'shu-wei': { reason:'关羽被处决', turn:45 } };
```

**触发**：创始团队或宗亲被对方处决（seniority==='founding' || _isClanRoyalty）
**消退**：60旬后自然消失
**效果**：解锁"兴兵复仇"宣称

### 八、信誉自然恢复

每旬：和平状态+0.2/旬，战争状态+0.1/旬，cap 100。

### 九、AI宣称逻辑

`aiDoDiplo` 宣战判定前插入：
1. 评估可用宣称（遍历CLAIM_TYPES）
2. 有强宣称 → 直接宣战
3. 有中/弱宣称 → 正常流程
4. 无宣称 → reputation>60可打；30-60时50%放弃；<30时80%放弃
5. AI选最强可用宣称开始准备，准备完成后下次检查时宣战
6. 曹操(emperor_holder)对刘备(han_royal)：如果汉室死忠占比>15%，降级用弱宣称（避免内部崩盘）

### 十、代码改动范围

| 模块 | 估算行数 |
|------|---------|
| FAC_IDENTITY + CLAIM_TYPES + G.emperor 常量 | ~80 |
| getAvailableClaims(fid, target) | ~50 |
| startClaimPrep / processClaimPrep | ~35 |
| applyWarDeclarationEffects(fid, target, claimType) | ~70 |
| onCityCapture 天子易主 | ~25 |
| 称帝系统（条件+效果+UI+AI） | ~80 |
| trackCityLoss | ~20 |
| 血仇系统 | ~25 |
| diploWar 改写 | ~30 |
| aiDoDiplo 改写 | ~50 |
| 外交面板UI | ~80 |
| processReputation 自然恢复 | ~15 |
| **合计** | **~560行** |

---

## v90 C3 宣称 + 天子 + 称帝系统实装

### 新增常量

| 常量 | 说明 |
|------|------|
| `FAC_IDENTITY` | 势力身份标签（emperor_holder/han_royal/warlord/emperor） |
| `CLAIM_TYPES` | 7种宣称类型定义（强度/准备时间/身份要求/目标要求/条件） |
| `CLAIM_STRENGTH_EFFECTS` | 宣称强度→外交成本映射（信誉/第三方rel/豪族钩子） |
| `CLAIM_FACTION_EFFECTS` | 宣称强度→派系忠诚delta映射（非emperor状态） |
| `EMPEROR_WAR_FACTION_EFFECT` | emperor状态宣战→派系忠诚delta（全正无负面） |
| `ENTHRONE_FACTION_EFFECTS` | 称帝时一次性派系影响（按原身份分三档） |
| `ENTHRONE_REQ` | 称帝前置条件（≥10城/≥40信誉/≥24旬） |

### 新增运行时数据（initGame中初始化）

| 数据 | 说明 |
|------|------|
| `G.emperor` | `{cityId:'ye', holder:'wei'}` — 天子所在城市+控制者 |
| `G.claims` | 宣称准备记录 |
| `G.cityHistory` | 城市易手历史（收复故土用） |
| `G.feuds` | 血仇记录 |

### 新增函数（19个）

| 函数 | 说明 |
|------|------|
| `processReputation()` | 信誉自然恢复（每旬，和平+0.2/战争+0.1） |
| `getFacIdentity(fid)` | 获取势力身份类型 |
| `_areFacsAdjacent(fid1,fid2)` | 两势力是否有相邻城市（边境清寇条件） |
| `_hasLostCityTo(fid,target)` | 是否有被target亲手夺走的城市（收复故土条件） |
| `_hasFeud(fid,target)` | 是否有血仇（60旬内） |
| `getAvailableClaims(fid,target)` | 获取可用宣称列表（按强度降序） |
| `startClaimPrep(fid,target,claimId)` | 开始准备宣称 |
| `processClaimPrep()` | 每旬推进宣称准备+过期清理 |
| `getReadyClaim(fid,target)` | 获取已就绪的宣称 |
| `getPrepClaim(fid,target)` | 获取准备中的宣称 |
| `applyWarDeclarationEffects(fid,target,claimId)` | 宣战效果结算（信誉/外交/派系/豪族钩子） |
| `onCityOwnerChange(cityId,oldFac,newFac)` | 城市易手处理（天子/历史/豪族钩子） |
| `checkFeudTrigger(killedName,killedFac,killerFac)` | 创始/宗亲被处决→血仇 |
| `canEnthrone(fid)` | 称帝条件检查 |
| `doEnthrone(fid)` | 执行称帝（天子消亡/身份变更/信誉/外交/派系） |
| `_playerStartClaim(target,claimId)` | 玩家UI：开始准备宣称 |
| `_playerEnthrone()` | 玩家UI：称帝 |

### 修改函数

| 函数 | 修改 |
|------|------|
| `diploWar(target,claimId)` | 新增claimId参数，接入applyWarDeclarationEffects，替代旧的triggerFactionEvent('warDeclare') |
| `aiDoDiplo(fid)` | 新增AI称帝检查（每12旬）+ 宣称评估/准备/使用 + 信誉感知的无宣称宣战决策 |
| `resolveSiegeBattle` | 攻城成功时调用onCityOwnerChange（天子+历史+豪族钩子） |
| `renderDipTab` | 新增身份显示/天子状态/称帝按钮 + 宣称按钮（准备/就绪/无宣称警告） |
| `nextTurn` | 新增processClaimPrep + processReputation调用 |
| `initGame` | 新增G.emperor/G.claims/G.cityHistory/G.feuds初始化 |

### 豪族支持钩子（预留）

`applyWarDeclarationEffects`中将`gentryHook`值存入`G.diplo[dk]._claimGentryHook`。`onCityOwnerChange`中读取该值，当前以TODO注释标注，待I2豪族系统实装后嵌入：
```js
// TODO: 当I2豪族系统实装后，在此处调用：
// if(G.cities[cityId].gentrySupport != null) G.cities[cityId].gentrySupport += hook;
```

### 测试验证

| 测试 | 结果 |
|------|------|
| 魏(emperor_holder) vs 蜀(han_royal)：奉旨讨逆(强)+边境清寇(弱) | ✅ |
| 蜀(han_royal) vs 魏(emperor_holder)：讨贼兴汉(强)+边境清寇(弱)+兴兵复仇(中,有血仇时) | ✅ |
| 吴(warlord) vs 任何：只有边境清寇(弱) | ✅ |
| 魏称帝→身份变emperor，天子消亡 | ✅ |
| 称帝后 vs 蜀：吊民伐罪(强)+边境清寇(弱) | ✅ |
| 蜀攻下邺城→cityHistory正确记录 | ✅ |
| 关羽被处决→血仇触发→解锁兴兵复仇 | ✅ |
| 宣称准备：每旬+1，3旬border_conflict就绪 | ✅ |
| 宣称强度排序：strong > medium > weak | ✅（修复了||9 falsy bug） |
| JS语法检查 | ✅ |

### Bug修复

| Bug | 修复 |
|-----|------|
| `getAvailableClaims`排序：`order['strong']`=0被`\|\|9`当作falsy变成9 | 改为`??9`（nullish coalescing） |

---

## v91 I2 豪族支持系统实装

### 核心机制

每座城市新增 `gentry` 字段（0-100），代表地方豪族对统治者的支持程度。豪族是该城市所在地域的士族势力，他们的态度直接影响城市经济和军事效率。

### 新增常量

| 常量 | 说明 |
|------|------|
| `CITY_TO_REGION` | 城市→地域反查表（从REGION_CITIES反转生成） |
| `REGION_TO_GENTRY_FAC` | 地域→士族派系映射（zhongyuan/hebei→gentry_zhongyuan等） |
| `GENTRY_LEVELS` | 5级区间定义（拥戴80+/支持60+/中立40+/不满20+/抗拒0+），每级含goldMult/recruitMult/moraleMod/color |

### 数据修复

`REGION_CITIES.zhongyuan` 新增 `hefei`、`shouchun`（原缺失，导致这两城无地域映射）。

### 新增函数（7个）

| 函数 | 说明 |
|------|------|
| `getGentryLevel(val)` | 返回支持度对应的级别对象（label/goldMult/recruitMult/moraleMod/color） |
| `getGentryGoldMult(city)` | 金币产出乘数（拥戴×1.15 ~ 抗拒×0.75） |
| `getGentryRecruitMult(cityId)` | 征兵费乘数（拥戴×0.85 ~ 抗拒×1.30） |
| `getGentryMoraleMod(cityId)` | 城防军士气修正（拥戴+5 ~ 抗拒-10） |
| `initCityGentry()` | initGame中设置初始值（本土有士族在朝60，否则50） |
| `processGentry()` | 每旬处理变化（太守/派系影响力/占领期/隐匿户口事件） |
| `applyGentryOnCapture(cityId, newFac, oldFac)` | 城市易手时设值（base30 + 地域士族+10 + gentryHook） |

### 每旬变化因素（processGentry）

| 因素 | delta/旬 |
|------|----------|
| 太守是本地域士族 | +0.3 |
| 太守是外地域士族 | -0.1 |
| 太守是寒门/降将 | -0.2 |
| 无太守 | -0.15 |
| 该地域士族派系影响力 > 20% | +0.1 |
| 该地域士族派系影响力 < 5% | -0.2 |
| 占领期（city.occupied > 0） | -0.3 |
| 隐匿户口（gentry<20, 5%概率） | 人口-3% |

### 效果表

| 支持度 | 标签 | 金币修正 | 征兵修正 | 城防士气 |
|--------|------|---------|---------|---------|
| 80-100 | 拥戴 | +15% | -15% | +5 |
| 60-79 | 支持 | +5% | -5% | +2 |
| 40-59 | 中立 | 基准 | 基准 | 0 |
| 20-39 | 不满 | -10% | +15% | -5 |
| 0-19 | 抗拒 | -25% | +30% | -10 |

### 城市易手规则

新占城gentry = 30 + (有本地士族在朝 ? +10 : 0) + gentryHook

`gentryHook` 来自C3宣称系统已预留的 `G._claimGentryHook[fid-target]`：强宣称+5、中宣称0、弱宣称-5、无宣称-15。

### 修改现有函数

| 函数 | 修改 |
|------|------|
| `initGame` | 调用 `initCityGentry()` |
| `nextTurn` | 调用 `processGentry()` |
| `getCityProd` | gold产出乘以 `getGentryGoldMult(city)` |
| `confirmRecruit` | 征兵金钱乘以 `getGentryRecruitMult(cityId)` |
| `renderRecruitModal` | 征兵费显示含gentry修正 + 官职buff |
| `resolveSiegeBattle` | 城市易手时调用 `applyGentryOnCapture()` |
| `resolveSiegeBattle` | 城防军士气 += `getGentryMoraleMod(cityId)` |
| `aiDoRecruit` | AI征兵费乘以 `getGentryRecruitMult(city.id)` |
| `renderCityTab` | 民心条下方新增豪族支持度条 |
| 城市Tooltip | 新增豪族支持度显示 |

### 与C3宣称系统的连接

v90预留的 `G._claimGentryHook` 在本版正式消费：
1. `applyWarDeclarationEffects` 写入 `G._claimGentryHook[fid-target]` = gentryHook值
2. `applyGentryOnCapture` 读取该值，叠加到新占城初始gentry

### 测试验证

| 测试 | 结果 |
|------|------|
| CITY_TO_REGION 45城全覆盖 | ✅ |
| REGION_TO_GENTRY_FAC 6地域映射 | ✅ |
| getGentryLevel 区间边界判定（0/19/20/39/40/59/60/79/80/100/null/undefined） | ✅ |
| 金币乘数（5级） | ✅ |
| 征兵费乘数（5级+nonexistent） | ✅ |
| 城防军士气修正（5级） | ✅ |
| 征兵费实际计算（高/低/中gentry） | ✅ |
| 城市易手初始值（强宣称/无宣称/基准） | ✅ |
| 每旬变化模拟（本地士族太守/无太守/寒门+低影响力/占领期） | ✅ |
| 边界值clamp [0,100] | ✅ |
| 隐匿户口触发条件 | ✅ |
| 城防军士气公式验证（morale×0.8+gentryMod, clamp[10,100]） | ✅ |
| JS语法检查 | ✅ |
| 全104项单元测试 | ✅ 通过 |

### I1/I2/I3 实装状态更新

| 模块 | 状态 |
|------|------|
| I1 太守buff | ⏳ 待做 |
| I2 豪族支持 | ✅ v91已实装 |
| I3 朝议系统 | ⏳ 待做 |


---

## v92 UI增强 + Bug修复

### 1. 金净显示修复（补上官职俸禄）

**问题**：左侧势力面板"金净"和金钱breakdown弹窗只扣了城防军饷+野战军饷，缺少官职俸禄。实际`processEconomy`里已扣但显示端漏算。

**修复**：
- 左侧面板`goldNet`计算新增`-postSalDisplay`（`calcPostSalary(fid)`）
- `showFacBreakdown`金钱弹窗新增"官职俸禄"行
- `showBreakdown`城市级金钱弹窗新增"官职俸禄（全势力）"行

### 2. 豪族支持 breakdown 弹窗（A）

点击城池Tab豪族条→弹窗展示完整计算链：
- 当前支持度 + 级别
- 所属地域 + 对应士族派系
- 每旬变化因素逐项列出（太守/派系影响力/占领期）
- 净变化/旬
- 当前效果（金币/征兵/士气修正）
- 支持度<20时显示隐匿户口警告

### 3. 忠诚 breakdown 弹窗（B）

点击武将详情忠诚数值→弹窗展示完整8项计算链：
①基础衰减-0.5 ②君主魅力 ③相性 ④性格标签 ⑤官职加成 ⑥野心无官惩罚 ⑧欠饷惩罚 + 派系修正
每项显示具体数值和公式参数，底部汇总净变化/旬。

### 4. 派系Mod tooltip（C/F）

派系Tab中武将右侧绿色/红色数字添加`cursor:help` + `title`属性：
悬停显示"派系事件累积修正 +X.X，每旬影响忠诚 +Y.YY"

### 5. 降将回归bug修复（D）

**问题**：曹仁等创始武将被俘→投降敌方→被招回/再俘获→`genJoinSource`仍为`'capture'`，被系统视为降将。

**修复**：`transferGenToFac`中新增判定——若`G.genOrigFac[genName] === targetFid`（回归原势力），则恢复原始身份（`FOUNDING_CORE`中的用`'founding'`，否则`'member'`），不标记为`'capture'`。

### 6. Reset按钮（E）

快进按钮右侧新增"↻ 重置"按钮（红色样式），点击后confirm确认→`initGame()` + `renderAll()`重置到初始状态。

### 金钱breakdown新增：每城豪族标记

金钱breakdown弹窗中每城条目旁显示豪族修正（如"豪+15%"或"豪-25%"），方便一眼看出哪些城被豪族影响。

### 测试验证

| 测试 | 结果 |
|------|------|
| 金净=grossGold-garSal-unitSal-postSal | ✅ |
| 降将回归：曹仁→founding | ✅ |
| 降将回归：非创始→member | ✅ |
| 非回归保持capture | ✅ |
| 忠诚公式各项数值 | ✅ |
| 豪族每旬因素最好/最差验证 | ✅ |
| 派系Mod tooltip格式 | ✅ |
| JS语法检查 | ✅ |
| 全20项单元测试 | ✅ 通过 |


---

## v93 Breakdown一致性修复 + 派系Mod弹窗

### 1. 忠诚弹窗z-index修复

`#bdTip` z-index从600提升到9999，确保在武将详情modal（z-index 700）之上显示。

### 2. 忠诚公式统一（calcLoyaltyDelta共享函数）

**问题**：武将详情面板的趋势箭头（`_approxDelta`）与实际`processLoyalty`公式有严重偏差——基础衰减(-0.3 vs -0.5)、魅力系数(0.2 vs 0.05)、义士加成(0.3 vs 0.2)、官职(固定0.3 vs tier差异化)、缺少同僚关系和欠饷因素。

**修复**：新增 `calcLoyaltyDelta(genName, fid)` 共享函数，返回 `{items:[{label,val}], total}`。三处统一调用：
- `showLoyaltyBreakdown`（忠诚弹窗）
- 武将详情面板趋势箭头（`_approxDelta`）
- 与 `processLoyalty` 实际扣减完全一致的8项因素

### 3. 金钱breakdown补官职俸禄明细

势力级和城市级金钱breakdown弹窗中，官职俸禄行展开显示每位武将的具体官职和俸禄（缩进子行）。

### 4. 派系Mod弹窗（替代tooltip）

原派系Tab中绿色/红色数字从hover tooltip改为**可点击弹窗**（`showFacModBreakdown`），展示：
- 所属派系名称
- 累积修正值（±上限20）
- 忠诚影响公式（mod × 0.05 = delta/旬）
- 累积修正来源说明（事件触发机制）
- 当前结构性压力明细（高位占比/降将太守/边缘化等，来自`getGenFactionModBreakdown`）

### 新增函数

| 函数 | 说明 |
|------|------|
| `calcLoyaltyDelta(genName, fid)` | 共享忠诚delta计算（8项因素完整），返回items+total |
| `showFacModBreakdown(e, genName, fid)` | 派系修正详细弹窗 |

### 测试验证

| 测试 | 结果 |
|------|------|
| JS语法检查 | ✅ |
| bdTip z-index=9999 | ✅ |
| calcLoyaltyDelta 定义 | ✅ |
| _approxDelta 使用 calcLoyaltyDelta | ✅ |
| showLoyaltyBreakdown 使用 calcLoyaltyDelta | ✅ |
| showFacModBreakdown 定义 | ✅ |
| 官职俸禄明细展开（2处） | ✅ |


---

## v94 双标签派系 + Mod事件日志 + 小传重写

### 1. 双标签影响力分配（150%/标签数）

**设计**：每位武将可同时属于多个派系标签，影响力按 `baseInfluence × 1.5 / tagCount` 分配到各标签。单标签者100%，双标签各75%（总150%），三标签各50%。

**新增函数**：`getGenFactions(name, fid)` — 返回武将所有匹配的派系标签数组。判定规则：
- `founding`：seniority=founding 时加入
- `royalty`：与当前势力君主同clan时加入
- `gentry_*`：origin=gentry时按region加入
- `humble`：无其他标签时兜底
- 降将/新附：单标签，不做多标签

**修改函数**：`calcFactionInfluence` — 改为遍历 `getGenFactions` 返回的标签数组，按比例分配。

**效果**：
- 魏：曹仁/曹洪/夏侯惇/夏侯渊 → founding+royalty（各75%），宗亲派系影响力>0
- 蜀：诸葛亮 → gentry_jingzhou（非创始），创始团队缩小为关张赵
- 吴：孙策 → founding+royalty（各75%）

### 2. 数据调整

| 改动 | 说明 |
|------|------|
| 夏侯惇/夏侯渊 clan | `谯县夏侯氏` → `谯县曹氏`（与曹操同clan → 宗亲） |
| 刘备 | 新增 `clan:'涿郡刘氏'` |
| 诸葛亮 | 从 `FOUNDING_CORE.shu` 移除（非创始元勋） |

### 3. Mod事件日志

`triggerFactionEvent` 触发时，记录事件明细到 `G.genFactionModLog[genName]`（每人最多8条）。
格式：`{turn, event(中文), delta, after}`

`showFacModBreakdown` 弹窗新增"事件记录"区块，按时间倒序展示近8条事件及其影响值。

### 4. 小传开篇重写

开局小传第一条由 `初仕X` 改为包含完整身份标签信息：
```
仕于魏，任大将军（创始元勋·宗亲·中原宗室·鹰派），籍贯沛国谯县。忠勇无双，临阵不退。
```
标签包括：创始元勋、宗亲、地域+出身（中原士族/荆州寒门等）、鹰派/鸽派。

### 新增/修改函数

| 函数 | 说明 |
|------|------|
| `getGenFactions(name, fid)` | 新增：返回所有匹配的派系标签数组 |
| `calcFactionInfluence` | 修改：使用多标签150%/N分配 |
| `triggerFactionEvent` | 修改：新增事件日志记录 |
| `showFacModBreakdown` | 修改：展示多标签+事件日志 |
| initGame 小传生成 | 修改：包含完整标签信息 |

### 新增运行时数据

| 数据 | 说明 |
|------|------|
| `G.genFactionModLog` | 派系事件日志 `{genName: [{turn,event,delta,after}]}` |


---

## v94 双标签派系系统 + Mod事件日志 + 小传标签

### 1. 双标签影响力分配

**旧逻辑**：每个武将只归入一个主派系，影响力100%计入该派系。
**新逻辑**：武将可同属多个派系，影响力按 `150% / 标签数` 分配到每个标签。

| 标签数 | 每标签影响力 | 总影响力 |
|--------|------------|---------|
| 1 | 100% | 100% |
| 2 | 75% | 150% |
| 3 | 50% | 150% |

**新增函数** `getGenFactions(name, fid)`：返回所有匹配派系的数组。判定规则：
- founding（FOUNDING_CORE中）→ 标签1
- royalty（同clan或values含'宗亲'/'汉室宗亲'）→ 标签2
- gentry_xxx（origin=gentry按region）→ 标签3
- humble / 高pol兜底

**示例**：
- 曹仁 → [founding, royalty]（创始+宗亲，各75%）
- 夏侯惇 → [founding, royalty]（clan改为曹氏后匹配）
- 诸葛亮 → [gentry_jingzhou]（不再是founding，纯荆州士族）
- 赵云 → [founding]（humble不产生副标签）
- 吴懿 → [gentry_yizhou, royalty]（values含'宗亲'）
- 荀彧 → [gentry_zhongyuan]（纯中原士族）

### 2. 数据修改

| 修改 | 内容 |
|------|------|
| 夏侯惇/夏侯渊 clan | `谯县夏侯氏` → `谯县曹氏`（与曹操同clan，简化为曹氏宗亲） |
| 诸葛亮 | 从 `FOUNDING_CORE.shu` 移除（主派系变为 gentry_jingzhou） |
| 刘备 | 补 `clan:'涿郡刘氏'` |
| `_isClanRoyalty` | 新增 values 包含'宗亲'/'汉室宗亲'也判定为royalty |

### 3. Mod事件日志

`triggerFactionEvent` 每次触发时，将事件写入 `G.genFactionModLog[genName]`（最多保留8条），格式：`{turn, event, delta, after}`。

`showFacModBreakdown` 弹窗新增"事件记录"区，展示最近8条历史事件及每次的delta和累积值变化。

### 4. 小传开篇补齐标签

`initGame` 中武将小传第一条从简单的"初仕X"改为丰富描述：
- 身份标签：创始元勋、宗亲/皇亲、地域士族、寒门出身
- 政治倾向：主战、持重
- 性格价值观（原有）
- 籍贯（原有）

示例：`仕于魏，任大将军，创始元勋、宗亲、主战，籍贯沛国谯县。忠勇无双。`

### 测试验证

| 测试 | 结果 |
|------|------|
| 150%/n 分配公式（1/2/3标签） | ✅ |
| 诸葛亮不在FOUNDING_CORE | ✅ |
| 夏侯 clan = 曹氏 | ✅ |
| 刘备 has clan | ✅ |
| 宗亲判定扩展（values标签） | ✅ |
| 双标签示例推演（曹仁/诸葛亮/赵云） | ✅ |
| Mod事件日志结构 | ✅ |
| JS语法检查 | ✅ |
| 全21项单元测试 | ✅ 通过 |


---

## v94 双标签派系 + Mod事件日志 + 小传重写

### 1. 双标签影响力分配（150%/标签数）

**设计**：每个武将可同时属于多个派系标签。影响力分配公式：
- 单标签：100%影响力归该派系
- 多标签：`baseInfluence × 1.5 / 标签数` 分配到每个标签

**新增函数**：`getGenFactions(name, fid)` 返回所有匹配的派系数组。

**副标签判定规则**：
- `_isClanRoyalty` → royalty（与君主同clan，或values含'宗亲'）
- `origin === 'gentry'` → 对应地域士族
- founding 由 FOUNDING_CORE 决定
- 降将/新附/旧阀 无副标签

**示例**：

| 武将 | 标签 | 每标签影响力 |
|------|------|-------------|
| 夏侯惇 | 创始+宗亲 | 各75% |
| 曹仁 | 创始+宗亲 | 各75% |
| 诸葛亮 | 荆州士族 | 100% |
| 赵云 | 创始 | 100% |
| 荀彧 | 中原士族 | 100% |

**`calcFactionInfluence` 修改**：遍历 `getGenFactions` 而非 `getGenFaction`，按公式分配。

### 2. 数据修正

| 修改 | 说明 |
|------|------|
| 诸葛亮移出 FOUNDING_CORE.shu | 非创始元勋，归入荆州士族 |
| 夏侯惇/夏侯渊 clan → '谯县曹氏' | 与曹操同clan，判定为宗亲 |
| 刘备补 clan:'涿郡刘氏' | 使蜀汉宗亲判定可用 |
| `_isClanRoyalty` 扩展 | values含'宗亲'/'汉室宗亲'也算宗亲 |

### 3. Mod事件日志

`triggerFactionEvent` 中每次修改 `genFactionMod` 时记录到 `G.genFactionModLog[genName]`（最多保留8条）。

日志格式：`{turn, event, delta, after}`

`showFacModBreakdown` 弹窗新增"近期事件记录"区域，按时间倒序展示。

### 4. 小传重写

开局小传不再写"初仕X"，改为"籍贯+仕于X+官职+身份标签+性格"：

示例：
- 曹仁：`沛国谯县人，仕于魏，任大司马（创始元勋、宗亲、主战）。忠勇无双。`
- 诸葛亮：`琅琊阳都人，仕于蜀，任丞相（荆州士族）。心系汉祚，誓扶炎刘。`
- 赵云：`常山真定人，仕于蜀，任翊军将军（创始元勋、寒门出身、主战）。忠勇无双。`

### 测试验证

| 测试 | 结果 |
|------|------|
| 150%/n 公式（1/2/3标签） | ✅ |
| 诸葛亮不在 FOUNDING_CORE | ✅ |
| 夏侯 clan = 谯县曹氏 | ✅ |
| 刘备有 clan | ✅ |
| 宗亲判定含 values 标签 | ✅ |
| 双标签示例推演 | ✅ |
| Mod事件日志结构 | ✅ |
| JS语法检查 | ✅ |
| 全21项单元测试 | ✅ |


---

## v95 武将界面修复（3项）

### 1. 五维属性 — 删除不准确的效果描述

**问题**：`statBonusMap` 中五维效果描述与实际游戏机制严重不符——INT显示"用计成功率"但游戏未实装用计系统；POL描述民心/建设效果但仅太守生效、面板却人人显示；CHA描述招募/外交百分比但实际公式不对应。

**修复**：删除 `statBonusMap` 整个对象及 `gpm-stat-bonus` 渲染行，五维只保留数值条（标签+进度条+数值）。CSS类 `.gpm-stat-bonus` 保留（无害死代码）。

### 2. 官职栏 — 改读动态系统 + 开局预填 tier 1&2

**问题A**：武将详情面板官职栏读的是 `meta.post`（GEN_META 静态数据），与官职Tab的动态任命系统 `G.genPost` 完全独立，导致显示与实际不一致。

**修复A**：`postHtml` 改为调用 `getGenPostDef(genName)` 读取动态 `G.genPost`，无任命则显示"尚未授官"。

**问题B**：`G.genPost` 开局为空，所有武将无官职，导致忠诚计算中"野心无官惩罚"立即生效，不合理。

**修复B**：`initGame` 中新增 `INIT_POSTS` 静态映射表，开局直接写入 `G.genPost`（不调用 `appointGenPost`，避免触发忠诚+8和派系事件）。每势力预填 tier1 各1人 + tier2 各4人（武文各半），共30人：

| 势力 | 大将军(mil T1) | 前/后/左/右将军(mil T2) | 丞相(civ T1) | 尚书令/侍中/太常/光禄勋(civ T2) |
|------|---------------|----------------------|-------------|------------------------------|
| 魏 | 夏侯惇 | 张辽/曹仁/于禁/徐晃 | 荀彧 | 荀攸/司马懿/陈群/程昱 |
| 蜀 | 关羽 | 张飞/赵云/马超/黄忠 | 诸葛亮 | 法正/蒋琬/费祎/董允 |
| 吴 | 周瑜 | 吕蒙/甘宁/太史慈/陆逊 | 张昭 | 鲁肃/顾雍/诸葛瑾/步骘 |

**问题C**：小传开局文案包含 `任${meta.post.name}`（静态官职名），与动态系统脱节。

**修复C**：小传开局文案删除 `任${postName}` 部分，改为 `仕于${facName}${identStr}${birthStr}${valStr}。`

### 3. 关系 section — 删除，保留亲密度

**问题**：武将详情面板"关系"section（读 `meta.relations` 静态数据，标签式：义兄弟/同乡/谋主等）与"亲密度"section（读 `G.intimacy` 动态数值）高度重叠，且关系数据无游戏机制意义。

**修复**：
- 删除 `relTypes` 对象 + `relsHtml` 构建代码（~20行死代码清理）
- `gpmBody` innerHTML 中删除"关系"section
- "出身"section 保留（条件改为仅 `meta.gentry||meta.clan||meta.faction_clan`）
- "亲密度"section 保留，为武将间关系的唯一展示入口

### 代码变更摘要

| 改动 | 行为 |
|------|------|
| `statBonusMap` + `gpm-stat-bonus` 行 | 删除 |
| `postHtml` 条件 `meta.post?` | 改为 `getGenPostDef(genName)?`，读动态 `G.genPost` |
| `initGame` → `G.genPost={}` 后 | 新增 `INIT_POSTS` 映射 + 遍历写入 |
| 小传 `任${postName}` | 删除 |
| `relTypes` / `relsHtml` | 删除 |
| `gpmBody` 关系 section | 删除 |
| `gpmBody` 出身 section 条件 | 简化（不再依赖 `meta.relations.length`） |


### 4. 追加修复：两处 undefined 显示

**问题A — 标题栏 undefined**：`gpmSubtitle` 模板中 `${ri[g.role]||g.role}` — 绝大多数武将在 GENS_FULL 中没有 `role` 字段（只有 ruler 有），`g.role` 为 `undefined`，`ri[undefined]||undefined` 在模板字面量中输出字符串 "undefined"。

**修复A**：改为 `${ri[g.role]||g.role||'武将'}`，增加兜底默认值。

**问题B — 官职栏 undefined**：`postHtml` 引用 `_dynPost.rank`，但 ALL_POSTS 数据结构中没有 `rank` 字段（`rank` 仅存在于旧的 `meta.post` 静态数据）。

**修复B**：
- 删除对 `_dynPost.rank` 的引用
- 从 `_dynPost.track` 派生标签：`mil→'将'`，`civ→'文官'`
- 颜色从 `RANK_COLOR` 改为直接根据 track 赋色（将=#e07840，文官=#60b0e0）
- 标签格式改为 `{将/文官}·{一品/二品/三品}`（从 `_dynPost.tier` 派生）
- `desc` 行改为 `buffDesc`：tier1&2 有实际效果描述则显示，tier3 的 `buffDesc` 为空字符串则不渲染

---

## v95 追加：部队视野系统（INT加成）

### 改动内容

**问题**：部队视野硬编码为2格，AP远高于视野导致敌军"冷不丁从阴影冒出来"，玩家和AI均无反应时间。且所有部队视野相同，智将（诸葛亮）和猛将（张飞）无战场差异。

**修复**：

| 改动 | 旧 | 新 |
|------|----|----|
| 基础视野 | `FOG_UNIT_RADIUS = 2` | `FOG_UNIT_RADIUS_BASE = 3` |
| INT加成 | 无 | INT≥90 → +2, INT≥75 → +1, <75 → +0 |
| camp/ambush | 三元判断在updateFog内 | 统一由 `getUnitVisionRadius(unit)` 处理 |

**新增函数**：`getUnitVisionRadius(unit)`
- 读取部队中最高INT武将的int值
- 返回 `FOG_UNIT_RADIUS_BASE + bonus`（正常状态）或 `FOG_STEALTH_RADIUS`（camp/ambush）

**视野表**：

| INT | 视野格数 | 代表武将 |
|-----|---------|---------|
| 90+ | 5 | 诸葛亮(99)、司马懿(97)、郭嘉(99)、周瑜(96)、陆逊(95) |
| 75-89 | 4 | 荀彧(96→pol但int也96)、法正(92)、鲁肃(88)、庞统(98) |
| 60-74 | 3 | 张辽(72)、赵云(68)、关羽(70)、吕蒙(82→实际是75+) |
| <60 | 3 | 张飞(42)、许褚(32)、典韦(28) |

**改动文件位置**：
- 常量定义：~行1065（`FOG_UNIT_RADIUS_BASE`）
- 新函数：~行1074（`getUnitVisionRadius`）
- updateFog调用：~行1213（`const radius = getUnitVisionRadius(unit)`）

**后续关联**（本次未实装，记录设计方向）：
- 情报模糊系统：视野内敌方部队信息按INT精度分层显示（±10%~±40%误差）
- GT2遭遇决策：AI基于模糊信息评估胜率，INT决定估算精度
- 玩家UI也应显示模糊信息（兵力"约万余"而非精确数字）

**INT阈值统一规则**（视野+未来情报精度共用）：

| INT | 视野加成 | 情报误差（待实装） | 武将识别（待实装） |
|-----|---------|------------------|------------------|
| 90+ | +2 | ±10% | 全部武将+大致属性 |
| 75-89 | +1 | ±20% | 主将+副将姓名 |
| 60-74 | +0 | ±30% | 可识别主将 |
| <60 | +0 | ±40% | "不明将领" |



---

## v96 GT博弈论AI三件套实装

### GT1. 威胁矩阵 + 分兵逻辑

#### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `_aiFrontlineCitiesAgainst(myFac, enemyFac)` | ~5096 | 取得面向特定敌方的前线城市（ROADS邻接定义） |
| `_aiCalcThreat(fid, enemyFid)` | ~5110 | 威胁公式：intent × capability × vulnerability |
| `_aiDeployAnomaly(fid, enemyFid)` | ~5183 | 部署异常度：停战/盟友边境集结检测 |
| `_aiGetThreatMatrix(fid)` | ~5212 | 完整威胁矩阵（带缓存，每3旬+事件刷新+外交哈希自愈） |
| `_aiInvalidateThreatCache()` | ~5241 | 标脏所有势力缓存（城市易主时调用） |

#### 威胁公式三因子

```
threat = intent × capability × vulnerability

intent:  enemy=0.9, neutral=0.5, truce=0.15×(1+anomaly), ally=0.05×(1+anomaly)
capability: (visibleTroops + unknownEstimate×0.5) / 10000
vulnerability: min(3, avgDeficit × (1 + deficitSum×0.3))
  deficit_i = max(0, 1 - myBorderTroops/enemyBorderTroops)
```

#### 威胁驱动输出

```
maxDeployRatio = 1.0 - (highestThreat / (highestThreat + 5)) × 0.6
  威胁0→100%, 威胁2→83%, 威胁5→70%, 威胁10→60%

两方向威胁都>3 → 跳过进攻，全部防守
```

#### aiSelectTargets 改动（3处）

| 改动 | 旧 | 新 |
|------|----|----|
| 前线城守备判定 | hexDist≤8（粗暴） | ROADS邻接（统一全系统） |
| 进攻部队数量 | 全部非守备 | `floor(可用 × maxDeployRatio)`，强部队优先 |
| 两面威胁保护 | 无 | highestThreat>3 && secondThreat>3 → 全防守 |

#### 缓存策略

- 存放：`fac._aiThreatCache = { data, turn, diploHash }`
- 刷新条件（任一触发）：每3旬定时 / `fac._aiThreatDirty` / 外交哈希变化
- 标脏钩子：`resolveSiegeBattle` 城市易主时调用 `_aiInvalidateThreatCache()`
- 外交哈希自愈：`diploHash = getDiploStatus(fid,f1) + ',' + getDiploStatus(fid,f2)`，即使遗漏标脏也能在下次调用时检测到变化

### GT3. 预算连续映射

#### `_aiCalcBudget` 改动

**旧**：三档硬编码（underAttack→90%, atWar→70%, else→30%）

**新**：基于GT1 `overallThreat` 的连续映射：

```
overallThreat = highestThreat + secondThreat × 0.3

有defend部队     → 85%
overallThreat>5  → 85%
overallThreat>3  → 70%
overallThreat>1  → 50%
else             → 30%

cap: 20%~90%
```

#### `aiDoRecruit` 征兵选址联动

**旧**：后方大城优先征兵（前线城排后面）

**新**：
- 威胁>1时：按 `_recruitCityScore`（该城面向的最高敌方威胁分）降序，高威胁方向优先征兵
- 威胁≤1时（和平）：后方大城优先（原逻辑保留）

### GT2. 鹰鸽博弈（精确胜率版）

#### 行军遭遇决策（改 `aiExecuteOrders`）

```
每旬 attack/defend 部队行军前，检查视野内(FOG_VISIBLE)4格内敌军：
  胜率 ≥ 60%  → 鹰（继续行军）
  胜率 40-60% → 进攻任务→鹰，防守任务→鸽
  胜率 20-40% → 鸽（halt），除非己方正围该目标城→搏
  胜率 < 20%  → 无条件鸽（halt）
```

#### halt等待机制

```
鸽 → halt，设 unit._aiHaltTurn = G.turn，保留 _aiTarget
每旬重评：
  → 视野内4格敌军消失 → 清除 _aiHaltTurn，恢复行军
  → 等3旬 → 放弃任务，_aiRole='idle'，_aiTarget=null
  → 鹰鸽重评后判定为鹰 → 清除 _aiHaltTurn，继续行军
```

#### 围城守方博弈（新增 `aiDefenderDecision`）

```
被围城市AI检查（每旬，aiDoSiege前执行）：

有援军（march中，≤3旬到达）      → 死守
城防衰减<70%                     → 死守（加成还够）
胜率<20%                         → 死守到底（等城破突围判定）
胜率>50%                         → 不需冒险
无援 + 城防衰减>70% + 胜率20-50% → 出城野战
```

出城行为：守方部队 `status='halt'`，位移到城外1格（远离攻方方向），下旬 `checkBattleTriggers` 自动触发野战。

#### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `aiDefenderDecision(fid)` | ~6044 | 围城守方博弈决策 |

#### 新增运行时数据

| 数据 | 说明 |
|------|------|
| `fac._aiThreatCache` | GT1威胁矩阵缓存 `{data, turn, diploHash}` |
| `fac._aiThreatDirty` | GT1缓存脏标记 |
| `unit._aiHaltTurn` | GT2鹰鸽halt开始旬数 |

#### runAI 新执行顺序

```
0. _aiCalcBudget      → ★ GT3: 威胁驱动预算分配
1. aiDoDiplo           → 外交
2. aiDoDisband         → 裁军
3. aiDoRecruit         → ★ GT3: 威胁驱动征兵选址
4. aiDoBuild           → 基建
5. aiDefendResponse    → G2P2: 防守响应
6. aiSelectTargets     → ★ GT1: 威胁矩阵驱动分兵
7. aiExecuteOrders     → ★ GT2: 鹰鸽遭遇判断
8. aiDefenderDecision  → ★ GT2: 围城守方博弈
9. aiDoSiege           → G2: 攻城决策
10. aiDoRecruitWild    → 招募在野武将
```

### 代码变更摘要

| 改动 | 类型 | 说明 |
|------|------|------|
| `_aiFrontlineCitiesAgainst` | 新增 | ROADS邻接前线城 |
| `_aiCalcThreat` | 新增 | 三因子威胁公式 |
| `_aiDeployAnomaly` | 新增 | 部署异常度 |
| `_aiGetThreatMatrix` | 新增 | 缓存威胁矩阵 |
| `_aiInvalidateThreatCache` | 新增 | 缓存标脏 |
| `aiDefenderDecision` | 新增 | 围城守方博弈 |
| `aiSelectTargets` | 修改 | 前线城改ROADS + maxDeployRatio + 双威胁保护 |
| `aiExecuteOrders` | 修改 | 鹰鸽遭遇判断 + halt等待 + 超时放弃 |
| `_aiCalcBudget` | 修改 | 三档硬编码 → 威胁连续映射 |
| `aiDoRecruit` | 修改 | 征兵选址威胁联动 |
| `runAI` | 修改 | 新增 aiDefenderDecision 调用 |
| `resolveSiegeBattle` | 修改 | 城市易主时调用 `_aiInvalidateThreatCache()` |

---

## v97 fuzzyEstimateWinRate（AI模糊胜率）

### 设计思路

AI判断胜率不再使用上帝视角精确值，而是在精确结果上按己方最高INT武将加随机噪声。路径选择：精确计算→模糊结果（而非模糊信息→精确计算），效果等价但实现简单一个数量级。

### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `fuzzyEstimateWinRate(sideA, sideB, fid)` | ~13550 | 野战模糊胜率，wrapper on `estimateWinRate` |
| `_aiFuzzySiegeWinRate(attackers, cityId, fid)` | ~5305 | 攻城模糊胜率，wrapper on `_aiEstimateSiegeWinRate` |

### INT噪声档位（沿用v95统一规则）

| INT | 误差幅度 | 示例（真实0.60） |
|-----|---------|-----------------|
| 90+ | ±10% | 0.54~0.66 |
| 75-89 | ±20% | 0.48~0.72 |
| 60-74 | ±30% | 0.42~0.78 |
| <60 | ±40% | 0.36~0.84 |

噪声模型：均匀分布 `[-margin, +margin]`，clamp到 `[0, 1]`。每次调用独立计算（不缓存），INT取sideA（己方）所有部队中最高值。

### 调用点替换（10处AI侧→fuzzy）

| 行号 | 函数 | 改动 |
|------|------|------|
| ~5443 | aiDefendResponse | `estimateWinRate` → `fuzzyEstimateWinRate` |
| ~5484 | aiDefendResponse | 同上 |
| ~5518 | aiDefendResponse | 同上 |
| ~5531 | aiDefendResponse | 同上 |
| ~5737 | aiSelectTargets | `_aiEstimateSiegeWinRate` → `_aiFuzzySiegeWinRate` |
| ~5815 | aiExecuteOrders GT2鹰鸽 | `estimateWinRate` → `fuzzyEstimateWinRate` |
| ~6016 | 围城前野战检查 | `estimateWinRate` → `fuzzyEstimateWinRate` |
| ~6026 | 围城前守方检查 | 同上 |
| ~6101 | aiDefenderDecision | 同上 |
| ~6202 | aiDoSiege攻城判断 | `_aiEstimateSiegeWinRate` → `_aiFuzzySiegeWinRate` |

### 保持精确的调用点（2处，不改）

| 行号 | 函数 | 原因 |
|------|------|------|
| ~13649 | `calcRetreatResult` | 撤退是机械判定，不应受情报模糊影响 |

### v97追加：玩家侧情报模糊

#### 设计思路

玩家视野内的敌方部队信息按**覆盖该敌方的己方部队最高INT**分层模糊显示。城市视野只提供存在感知（等于INT=0，最低档），要看清细节需派部队侦察。

#### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `getScoutINT(targetUnit)` | ~1091 | 取覆盖目标的己方部队中最高INT（视野范围内） |
| `fuzzyTroopDisplay(real, intVal)` | ~1114 | 兵力模糊显示（纯显示层） |
| `fuzzyGenDisplay(unit, intVal)` | ~1139 | 武将识别模糊显示 |

#### INT分层显示规则

| INT | 兵力 | 武将 | 属性 | 地图旗帜 |
|-----|------|------|------|---------|
| 90+ | 精确数字 | 主将+副将+属性 | 统武智可见 | 正常名字 |
| 75-89 | 约X千 | 主将+副将+兵种 | 不可见 | 正常名字 |
| 60-74 | 约X万/X千 | 仅主将 | 不可见 | 正常名字 |
| <60 | 约X万余 | "不明将领" | 不可见 | "？？" |

#### 修改点（10处）

| # | 位置 | 改动 |
|---|------|------|
| 1 | `renderUnitsOnMap` (~17049) | 敌方旗帜：兵力用`fuzzyTroopDisplay`，INT<60名字显示"？？" |
| 2 | `showUnitTip` (~17150) | 敌方tooltip：分层显示武将/兵力/隐藏AP/补给等内部信息 + 情报精度提示 |
| 3 | `renderUnitDetail` (~17265) | 敌方右侧面板：完全替换为简化侦知面板，按INT分层 |
| 4 | 战斗确认弹窗-野战 (~15341) | `sideHtml` → `_battleSideHtml`，敌方按参战部队INT模糊 |
| 5 | 战斗确认弹窗-伏击 (~14674) | 同上 |
| 6 | 战斗确认弹窗-营寨 (~14912) | 同上 |
| 7 | 战斗确认弹窗-攻城 (~15099) | 同上 |
| 8 | 野战胜率 (~15397) | `estimateWinRate` → `fuzzyEstimateWinRate`（玩家参战部队INT决定判断精度） |
| 9 | 围城胜率 (~13904) | `_aiEstimateSiegeWinRate` → `_aiFuzzySiegeWinRate`（同上） |
| 10 | tooltip堆叠部队 | 同格其他敌方部队名也按INT模糊 |

#### 新增通用函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `_battleSideHtml(units, troops, isEnemySide, playerUnits)` | ~14611 | 战斗确认弹窗双方阵容显示，敌方侧按玩家参战部队最高INT模糊 |

替代了4个弹窗各自的本地 `sideHtml` 函数（已删除，代码量净减~30行）。

#### 不改的地方

- 战报（战后复盘，精确显示）
- 己方/盟友部队（永远精确）
- `calcRetreatResult`（机械判定）

### v97追加：代码审计 & 清理

**审计结论**：18k行在单体HTML可维护性边界上但未过线。48%是UI渲染（逻辑密度低），逻辑密集代码（AI+战斗+迷雾+基础设施）合计~7,750行，可控。

**清理项**：
| # | 改动 | 说明 |
|---|------|------|
| 1 | 删除 `getPrepClaim` | 死函数，从未调用 |
| 2 | 删除 `getUnitMaxTroops` | 死函数，从未调用 |

**已知遗留（暂不动）**：
- `gx/gy` 残留22处（Q6，改需连带写入点+fallback，中等工作量）
- `calcAmbushLossRates` vs `calcLossRates` 可能可合并（需确认伏击损失公式差异）

---

## 待办事项（下轮）

### 优先级1 — 近期必做

1. **AI经济/基建决策优化**：aiDoBuild投资回报评估、前线城允许建城墙、AI太守管理、AI调粮
2. **AI挖角**：aiDoPoach(fid)
3. **君主更替系统**：君主死亡→继任者选择→人格切换（B4后续）

### 优先级2 — 应做

4. **I1 太守建设buff**
5. **I3 朝议系统**
6. 武将技能实装（73将技能desc已写）
7. AI伏击/扎营

### 优先级3 — 可选

8. ~~玩家即时移动~~ ✅ v99已实装
9. 地图裁剪
10. `gx/gy` → `hq/hr` 坐标统一

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | 🔄 G2三阶段✅ 混编✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4人格化✅ → 经济优化+挖角 待做 |
| H UX优化 | ✅ 移动预览✅ 围城弹窗✅ 渲染优化✅ 补给overlay✅ 混编预览✅ 即时移动✅v99 |
| I 内政深化 | 🔄 I2豪族✅ → I1太守buff待做 / I3朝议待做 |

---

## v96 追加：经济平衡调整

### 问题

v87将部队从每方3-4支×4000兵扩编到4-7支×15000兵（兵力翻4-5倍），但城市金产出未调整。三家开局全部赤字：
- 旧均衡兵民比仅4.3%，三家开局9-13%，全部入不敷出
- 魏约18旬、蜀约16旬烧完初始金

### 修复方案（方案C：两头调）

| 参数 | 旧值 | 新值 | 倍率 |
|------|------|------|------|
| 45城 `base.gold` | 原值 | ×1.87 | +87% |
| 军饷费率 `getUnitSalaryRate` | 0.018 | 0.0096 | -47% |
| billeted军饷 | 0.018×0.20=0.0036 | 0.0096×0.20=0.0019 | -47% |

### 新均衡点

**兵民比15%为收支平衡点**——低于15%盈余，高于15%赤字。

| 势力 | 开局兵民比 | 开局净收支 | 15%上限可征 |
|------|-----------|-----------|------------|
| 魏(20城) | 10.5% | +460/旬 | 还能征45k兵 |
| 蜀(10城) | 13.3% | +45/旬 | 仅能征7.5k |
| 吴(15城) | 8.9% | +445/旬 | 还能征43k兵 |

### 改动位置

| 改动 | 数量 |
|------|------|
| CITIES_DEF `base.gold` | 45城全改 |
| `getUnitSalaryRate` | 2处（正常+billeted） |
| `aiDoDisband` 硬编码费率 | 1处 |
| UI显示文案 | 2处 |

---

## v98 B4 君主人格化

### 设计思路

在 `AI_PERSONALITY` 上做参数差异化，不改任何结构逻辑。三家各有特色：曹操敢集中兵力+外交狡诈，刘备稳扎稳打+重信义，孙权折中偏守。

### AI_PERSONALITY 参数表（行5150-5153）

| 参数 | 曹操(wei) | 刘备(shu) | 孙权(wu) | 效果 |
|------|-----------|-----------|----------|------|
| `atkThreshold` | 0.50 | 0.55 | 0.50 | 进攻发起最低胜率 |
| `siegeThreshold` | 0.50 | 0.60 | 0.55 | 攻城发起最低胜率 |
| `diploAggro` | 0.8 | 0.3 | 0.5 | 外交攻击性（宣战/廉耻/求和） |
| `deployBias` | +0.15 | 0.00 | -0.10 | 集中兵力偏移（加在maxDeployRatio上） |
| `budgetBias` | +0.10 | -0.05 | 0.00 | 军费比例偏移（加在militaryPct上） |

### 改动点（6处）

| # | 位置 | 改动 | 公式 |
|---|------|------|------|
| 1 | `AI_PERSONALITY` (~5150) | 三家参数差异化+新增3字段 | — |
| 2 | `_aiGetThreatMatrix` maxDeployRatio (~5303) | 加deployBias | `min(0.95, baseRatio + deployBias)`, clamp [0.20, 0.95] |
| 3 | `aiDoDiplo` 宣战概率 (~7395) | aggrWill乘以diploAggro系数 | `min(0.95, baseAggrWill × diploAggro/0.5)` |
| 4 | `aiDoDiplo` 无宣称放弃率 (~7423) | 放弃概率乘以(1-diploAggro) | `0.80 × (1-diploAggro)`，曹操×0.2几乎不犹豫 |
| 5 | `aiDoDiplo` 求和阈值 (~7492) | 阈值按diploAggro偏移 | `0.80 + (diploAggro-0.5)×0.30`，曹操0.89/刘备0.74 |
| 6 | `_aiCalcBudget` (~6510) | militaryPct加budgetBias | `militaryPct += budgetBias`, cap [0.20, 0.90] |

### 三家行为差异总结

**曹操（激进/狡诈）**：
- 敢把85%+兵力集中进攻一路（deployBias +0.15）
- 宣战概率×1.6，无宣称也几乎不犹豫（shameFactor 0.2）
- 要被打得很惨才肯求和（阈值0.89）
- 和平时期也多投军费（budgetBias +0.10）

**刘备（稳健/信义）**：
- 需要55%胜率才发起进攻，60%才攻城
- 宣战概率×0.6，无宣称大概率放弃（shameFactor 0.7）
- 稍有不利就愿意谈判止损（阈值0.74）
- 倾向建设（budgetBias -0.05）

**孙权（守成/折中）**：
- 所有参数居于基准值，行为中庸
- 留守比例最高（deployBias -0.10），不轻易倾巢出动

### 间接效应（不改代码，自然涌现）

- 曹操宣战频繁 → 信誉(reputation)掉更快 → 玩家对曹操求停战/结盟更难成功（`_repPenaltyFactor`惩罚加大）→ 正反馈循环，符合历史人设
- 刘备开局信誉80 + diploAggro=0.3 → 信誉维持高位 → 外交选项对刘备更友好

### 未改动的地方

- `peaceWillingness` 函数本身（纯实力计算，不含人格）
- 玩家侧外交操作（停战/结盟接受率不受AI人格影响）
- GT2鹰鸽硬编码阈值（0.20/0.40/0.60）— 已有atkThreshold差异化，不再叠加hawkBias
- 外交Tab UI显示（纯展示层不受影响）

### 后续：君主更替系统（未实装）

设计方向：君主死亡→继任者选择→AI_PERSONALITY切换。当前人格绑在fac上，后续需追踪君主身份。可与I3朝议系统或事件系统联动实装。

---

## v99 玩家即时移动系统

### 设计思路

**核心改变**：玩家部队的移动指令从"下令→等下旬统一结算"变为"下令→当旬立即执行"。AI部队不受影响，仍在 `nextTurn` 的 `processUnitMovement` 中统一结算。

行军带逐格动画 + 迷雾渐显效果，部队一格一格前进时视野实时扩展。

### 新增数据

| 数据 | 说明 |
|------|------|
| `unit._apRemaining` | 本旬剩余AP（仅玩家部队追踪） |
| `unit._apSpentThisTurn` | 本旬是否已通过即时移动消耗AP（防止processUnitMovement重复处理） |
| `_marchAnimating` | 全局行军动画锁（动画中禁用所有UI交互） |

### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `_execInstantMarch(unit, walkPath, apLeftAfter, remainPath)` | ~16760 | 逐格行军核心：动画+迷雾揭开+战斗检测 |
| `_collectPlayerVisibleKeys()` | ~16934 | 收集玩家当前可见hex集合（用于增量迷雾计算） |
| `_animateFogReveal(revealedKeys)` | ~16943 | 迷雾揭开动画：SVG临时遮罩层渐隐消失 |
| `_checkInstantBattleTrigger(playerUnit)` | ~16977 | 即时战斗检测（移动后检查野战/营寨战接触） |

### 改动点（10处）

| # | 位置 | 改动 |
|---|------|------|
| 1 | `nextTurn()` 旬初 (~8232) | 重置玩家部队 `_apRemaining` 和 `_apSpentThisTurn` |
| 2 | `nextTurn()` 入口 (~8225) | 行军动画中阻止推进 |
| 3 | `initGame()` (~3984) | 初始化玩家部队AP |
| 4 | `issueUnitMove()` (~16695) | 完全重写：玩家部队走即时移动+动画，AI走旧逻辑 |
| 5 | `processUnitMovement()` (~11537) | 跳过本旬已即时移动的玩家部队 |
| 6 | `handleMapClick()` (~17183) | 增加动画锁 + 短距离(1-2格)直接移动跳过预览 |
| 7 | `handleCityClick()` (~17292) | 增加动画锁 + 短距离直接移动 |
| 8 | `onUnitLeftClick()` (~17100) | 攻击敌军走issueUnitMove即时移动 |
| 9 | `onStackPickerSelect()` (~17072) | 同上 |
| 10 | `renderUnitsOnMap()` 移动预览 (~17455) | 双色路径（绿色本旬可达+黄色跨旬）+ AP徽章 |

### 即时行军流程

```
玩家点击目标 → issueUnitMove
  ├─ AI部队 → 旧逻辑（设hexPath等下旬走）
  └─ 玩家部队 → _execInstantMarch
      └─ 逐格循环：
          1. 敌军阻挡检测 → 中断halt
          2. 敌方城市检测 → 围城弹窗
          3. 堆叠检测 → 中断halt
          4. 移动到该格（更新hq/hr、扣AP）
          5. updateFog + invalidateFogCache
          6. 计算新揭开hex → _animateFogReveal
          7. renderMap + renderUnitsOnly
          8. 友方城市检测 → garrison
          9. 伏击检测 → 立即结算
          10. sleep(140ms) → 下一格
      └─ 结束后：设最终状态、最终renderAll、战斗检测
```

### 迷雾揭开动画原理

零侵入现有迷雾渲染系统。动画流程：

1. 每格移动后调 `updateFog` + `invalidateFogCache` 正式更新迷雾数据
2. 调 `renderMap` 重建迷雾SVG（此时新揭开区域已无遮罩）
3. 在SVG最上层叠加**临时遮罩组**（`<g>`），只覆盖本步新揭开的hex
4. 用CSS `transition: opacity 0.35s` 将遮罩渐隐到0
5. 350ms后移除临时DOM元素

效果：部队前进时，前方迷雾如晨雾散开般渐渐消退。

### UI变化

- **AP徽章**：选中己方部队时，旗帜右侧显示剩余AP数值
- **双色路径预览**：绿色实线=本旬可达段，黄色虚线=需跨旬段
- **标签文案**：本旬可达显示绿色"本旬抵达"，跨旬显示黄色"约N旬"
- **短距直接移动**：1-2格内单击直接移动（跳过预览确认），远距保持二次确认
- **动画锁**：行军动画播放中禁用一切点击和推进操作

### 不改的

- AI移动/决策逻辑完全不变（仍在nextTurn中统一结算）
- 经济/补给/军饷等旬末结算不变
- 扎营/伏击/驻扎等状态切换已是即时的，不需改
- 征兵/基建/外交等内政仍为旬级
- 快进模式中玩家部队与AI统一处理，不走即时逻辑

### v99 追加：行军疲劳撤退惩罚 + 动态撤退距离

**设计思路**：AP消耗影响撤退能力（疲兵难跑），AP充沛加大撤退距离（体力好跑得远）。**AI和玩家完全对等**——`processUnitMovement` 中所有部队都追踪 `_apRemaining`。

#### 疲劳惩罚（影响撤退概率+追击损失）

```
疲劳度 = 1 - (_apRemaining / calcUnitAP)     // 0=没动, 1=AP耗尽
有效逃跑AP = base × (1 - 疲劳度 × 0.5)       // 最多打5折
```

| 本旬消耗 | 有效逃跑AP | 影响 |
|---------|-----------|------|
| 没动 | 100% | 不变 |
| 走一半 | 75% | 轻微劣势 |
| 走到底 | 50% | 大幅劣势 |

#### 动态撤退距离（AP充沛→跑得更远）

```
充沛度 = _apRemaining / calcUnitAP             // 0~1
额外格数 = floor(充沛度 × 2)                    // 0~2

完全脱离距离 = 2 + 额外格数                      // 2~4格
部分脱离距离 = 1 + floor(额外格数 / 2)           // 1~2格
```

| 充沛度 | full距离 | partial距离 |
|-------|---------|------------|
| 0（走到底） | 2格 | 1格 |
| 0.5（半AP） | 3格 | 1格 |
| 1.0（没动） | 4格 | 2格 |

#### 改动点（5处）

| # | 位置 | 改动 |
|---|------|------|
| 1 | `nextTurn()` (~8232) | 全部队（含AI）重置 `_apRemaining` |
| 2 | `initGame()` (~3984) | 同上 |
| 3 | `processUnitMovement()` (~11549,11619) | AI部队行军时追踪 `_apRemaining` |
| 4 | `calcRetreatResult` → `effectiveAP()` (~13675) | 疲劳因子修正逃跑AP |
| 5 | `calcPursuitLoss` → `_fleeEffAP()` (~13727) | 疲劳因子修正追击损失AP |
| 6 | `doRetreat` → `steps` (~13786) | 动态撤退距离 |

### v99 追加：撤退战报精简

**设计**：没打起来的撤退（无论玩家还是AI）不弹战报弹窗，只写日志。真正打了有战损的才弹战报。

**改动**：`_resolveBattleEngagement` 中，`type==='retreat'` 的报告不再 push 到 `_battleReports`，改为直接写日志+武将小传。部分脱离有追击损失时额外补一条损失日志。

### v99 追加：战斗触发重构（对峙系统）

#### 设计思路

即时移动打破了旧系统的时序假设（"下令→下旬统一移动→统一检测战斗"），需要重新定义"什么时候触发战斗"：

**核心规则**：`march`/`siege` = 有攻击意图，`halt` = 无攻击意图（对峙）。只有至少一方有攻击意图时才触发战斗。

#### 攻击意图（attackIntent）系统

`issueUnitMove` 新增第5参数 `attackIntent`：
- **点击敌军部队** → `attackIntent = true`（明确要打）
- **点击空地/城市** → `attackIntent = false`（只是移动）

| 场景 | 行为 |
|------|------|
| 玩家点击敌军（已相邻） | 直接弹战斗确认，不走行军动画 |
| 玩家点击敌军（远距离） | 行军动画走过去 → 到了弹战斗确认 |
| 玩家点击空地，途中遇敌 | 停在敌军旁边（halt），不自动开打 |
| AI march到玩家旁边 | processUnitMovement被阻挡 → 保持march → checkBattleTriggers触发 |
| AI halt + 玩家halt对峙 | checkBattleTriggers跳过 → 不打 |
| AI siege + 守方出城(halt) | siege算攻击意图 → 触发战斗 |

#### `checkBattleTriggers` 改动

普通战斗（第二轮）新增前置条件：
```js
const aHasAggressor = sideA.some(u => u.status==='march' || u.status==='siege');
const bHasAggressor = sideB.some(u => u.status==='march' || u.status==='siege');
if(!aHasAggressor && !bHasAggressor) return; // 对峙——无人主动进攻
```

伏击检测（第一轮）不受影响——伏击是被动触发的。

#### `processUnitMovement` 改动

AI部队被敌军阻挡时，**不再清空hexPath和设halt**，保持 `march` 状态：
```js
if(hasHostileUnit) {
  unit.status = 'march'; // 保持（仍想前进）
  break;
}
```

这样 `checkBattleTriggers` 会将其识别为有攻击意图，触发战斗。AI会持续进攻直到打赢或鹰鸽判断翻转。

#### 改动点汇总

| # | 位置 | 改动 |
|---|------|------|
| 1 | `issueUnitMove` 签名 (~16737) | 新增 `attackIntent` 参数 |
| 2 | `issueUnitMove` 相邻快捷路径 (~16768) | 仅 `attackIntent` 时直接弹战斗确认 |
| 3 | `_execInstantMarch` (~16842) | 接收 `attackIntent`，仅有意图时触发 `_checkInstantBattleTrigger` |
| 4 | `onStackPickerSelect` (~17174) | 传 `attackIntent=true` |
| 5 | `onUnitLeftClick` (~17200) | 传 `attackIntent=true` |
| 6 | `handleMapClick` enemyOnHex (~17310) | 传 `attackIntent=true` |
| 7 | `checkBattleTriggers` (~14345) | 双方都halt/非march/非siege → 跳过（对峙） |
| 8 | `processUnitMovement` 敌军阻挡 (~11573) | 保持march状态，不清hexPath |
| 9 | `doRetreat` 追击前进 (~13837) | 不得进入敌方城市hex |

#### Bug修复

| Bug | 修复 |
|-----|------|
| 相邻敌军点击无反应 | `attackIntent` + 相邻快捷路径直接弹战斗确认 |
| 追击进入敌方城市 | `doRetreat` 追击前进增加敌方城市检测 |
| AI出城迎击(halt) vs 围城方(siege) 不触发 | siege也算攻击意图 |
| AI被阻挡设halt → 下旬对峙不打 | 被阻挡保持march |

### 待debug（下轮）— ✅ v100已重构解决

以下7种情景在v100中通过战斗触发重构全面解决：

1. **玩家点击敌军 → 行军 → 到达 → 弹战斗确认**：✅ 正常（v99即时移动已覆盖）+ v100修复伏击后二次战斗
2. **玩家移动路过敌军 → 停下不打**：✅ 正常（attackIntent=false时不触发）
3. **AI march到玩家旁边 → 触发战斗**：✅ v100改为AI在aiExecuteOrders中显式调用aiInitiateBattle
4. **双方对峙 → 推进多旬 → 不打**：✅ v100修复（自动回城排除有任务的AI部队 + 废除march状态被动触发）
5. **AI鹰鸽切换**：✅ v100修复（GT2 halt不再被自动回城覆盖，鹰鸽逻辑正常生效）
6. **围城守方出城 → siege方被触发**：✅ v100改为aiDefenderDecision出城后立即调用aiInitiateBattle
7. **伏击不受影响**：✅ 正常（checkAmbushTriggers独立保留）

---

## v100 战斗触发重构

### 设计思路

**核心改变**：废除"接触自动开打"的被动扫描机制，改为所有战斗由某一方**显式发起**。没人发起就不打。

旧系统（v99）：`checkBattleTriggers` 每旬末扫描全地图，发现相邻敌对部队+至少一方march/siege → 自动触发战斗。依赖march状态作为"攻击意图"信号。

新系统（v100）：
- **玩家侧**：不变（点击敌军 → `_checkInstantBattleTrigger` 弹确认，已经是显式的）
- **AI侧**：`aiExecuteOrders` 中AI部队鹰派决定进攻时，显式调用 `aiInitiateBattle()`
- **伏击**：保留自动扫描（伏击本质是被动触发，独立函数 `checkAmbushTriggers`）

### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `collectBattleSides(aggressorUnit)` | ~14337 | 共享参战方收集逻辑（攻方=发起者1格友军+守方周围1格友军，守方=种子敌军+其1格友军） |
| `aiInitiateBattle(aggressorUnit)` | ~14393 | AI显式发起战斗：调用collectBattleSides → 营寨战/普通野战/叫阵 → 弹窗或自动结算 |

### 参战方收集规则（collectBattleSides）

```
攻方 = 与发起者相邻的友军（支援）+ 与任一守方单位相邻的友军（围攻/夹击）
守方 = 与发起者相邻的敌军（种子）+ 这些敌军各自1格内的同阵营友军（守方支援）
```

**三处统一调用**：`aiInitiateBattle`、`_checkInstantBattleTrigger`、`issueUnitMove`（相邻快捷战斗）

**围城夹击场景**：
```
[城内己方B] ←1格→ [敌军X围城] ←1格→ [己方援军A发起]
→ 攻方: A(发起者) + B(守方X的1格内友军) = 2v1
```

### 改动点（13处）

| # | 位置 | 改动 |
|---|------|------|
| 1 | `checkBattleTriggers` → `checkAmbushTriggers` | 删除第二轮（普通野战扫描），只保留第一轮（伏击扫描），改名 |
| 2 | `processUnitMovement` 敌军阻挡 (~11607) | AI遇敌恢复halt（不再保持march），保留hexPath供后续恢复 |
| 3 | `aiExecuteOrders` GT2鹰派分支 (~5918) | 鹰派+与敌军相邻 → 显式调用 `aiInitiateBattle()` |
| 4 | `aiExecuteOrders` halt attack部队 (~5997) | 被敌军阻挡的halt部队 → 鹰鸽判断 → 鹰则 `aiInitiateBattle()`，鸽则超时3旬放弃，敌消失则恢复march |
| 5 | `aiDefenderDecision` (~6240) | 守方出城后立即调用 `aiInitiateBattle()` |
| 6 | `nextTurn` 自动回城逻辑 (~8312) | 排除 `_aiRole==='attack'\|\|'defend'` 的部队（GT2鹰鸽halt的不回城） |
| 7 | `nextTurn` 调用链 (~8329) | `checkBattleTriggers()` → `checkAmbushTriggers()` + 旬初清空去重集合 |
| 8 | `_execInstantMarch` (~16867,16989,17038) | 新增 `ambushed` 标记，伏击中断后跳过战斗检测（修复Bug1） |
| 9 | `aiExecuteOrders` 第二段超时逻辑 (~6001) | 被阻halt鸽派部队：3旬超时放弃任务+清hexPath；敌军消失恢复march（修复D1） |
| 10 | `nextTurn` 叛军战斗扫描 (~8344) | checkAmbushTriggers后，叛军halt+相邻敌军 → `aiInitiateBattle`（修复D2） |
| 11 | 新增 `collectBattleSides` (~14337) | 共享参战方收集：攻方支援+围攻夹击，守方支援扩展 |
| 12 | `_checkInstantBattleTrigger` + `issueUnitMove` 相邻战斗 | 改用 `collectBattleSides` 替代旧的单层unitsContact收集 |
| 13 | `nextTurn` processUnitMovement后 (~8338) | 旬末garrison校正：落在己方城hex上的部队自动garrison（不清hexPath） |

### 新增数据

| 数据 | 说明 |
|------|------|
| `_aiBattleProcessedThisTurn` | Set，每旬去重，防止同一对势力+同一地点重复发起战斗 |
| `ambushed`（_execInstantMarch局部变量） | 伏击中断标记，跳过行军后的额外战斗检测 |

### 战斗触发对照表（v100最终）

| 战斗类型 | 触发方式 | 触发函数 |
|---------|---------|---------|
| 玩家主动野战 | 点击敌军 | `_checkInstantBattleTrigger` |
| AI主动野战 | aiExecuteOrders中鹰派决定 | `aiInitiateBattle` |
| 伏击 | 旬末自动扫描（被动） | `checkAmbushTriggers` |
| 营寨战 | AI/玩家主动攻击camp目标 | `aiInitiateBattle` / `_checkInstantBattleTrigger` |
| 围城守方出城 | aiDefenderDecision决策后 | `aiInitiateBattle` |
| AI攻城 | aiDoSiege胜率判断后 | `resolveSiegeBattle`（已是显式） |
| 叛军攻击 | nextTurn旬末叛军halt扫描 | `aiInitiateBattle`（叛军永远鹰派） |

### Bug修复

| Bug | 根因 | 修复 |
|-----|------|------|
| AI对峙无效（Bug4） | 自动回城逻辑把GT2 halt部队强制march回家 | 排除有AI任务的部队 + 废除march被动触发 |
| GT2鹰鸽切换无效（Bug5） | 被Bug4覆盖 | 随Bug4修复自然生效 |
| 伏击后二次战斗（Bug1） | `_execInstantMarch` 伏击中断后仍执行 `_checkInstantBattleTrigger` | 新增 `ambushed` 标记跳过 |
| GT2鸽派被阻永不超时（D1） | 超时逻辑在第一段（要求hexPath为空），被阻部队有hexPath进不了第一段 | 第二段加超时+恢复行军逻辑 |
| 叛军不再触发战斗（D2） | 叛军不经过aiExecuteOrders，删除旧被动扫描后没有替代 | nextTurn中checkAmbushTriggers后加叛军halt战斗扫描 |

### 不改的

- 玩家侧即时移动/战斗逻辑完全不变
- 伏击检测逻辑不变（独立保留为 `checkAmbushTriggers`）
- AI围城决策 `aiDoSiege` 不变（已是显式调用 `resolveSiegeBattle`）
- 战斗结算函数全部不变（`_resolveBattleEngagement`、`resolveCampBattle`、叫阵系统等）
- 撤退/追击/经验/战报等后处理全部不变

### 待验证（下轮）

1. **AI鹰派攻击玩家**：aiInitiateBattle推入_pendingBattleConfirms → 弹窗是否正常显示
2. **AI vs AI战斗**：aiInitiateBattle中的叫阵+自动结算是否正常
3. **多支AI部队到达同一敌军旁**：去重集合是否正确防止重复战斗
4. **GT2鸽派→3旬超时→放弃→idle**：部队是否被自动回城正确处理（hexPath已清空+_aiRole=idle → 满足回城条件）
5. **快进模式**：玩家部队也托管给AI时，aiInitiateBattle是否正确处理玩家方战斗
6. **叛军攻城**：叛军march到城市旁→围城→aiDoSiege是否正常处理叛军

---

## v101 AI攻击逻辑 + 增援结算逻辑 Bug修复

### 修复内容（6处）

| # | 位置 | 严重度 | 修复前 | 修复后 |
|---|------|--------|--------|--------|
| 1 | `collectBattleSides` 步骤3a+3b（~行14389,14397） | — | 攻方支援收集无 `_battleCooldown` 过滤 | **不修（设计确认）**：冷却中部队仍可被拉为周围支援参战，带战损状态数值公平。大兵团同旬多次交战是合理战场行为。未来可做"参战勾选UI"让玩家选择哪些部队参战。 |
| 2 | `_resolveBattleEngagement` 撤退分支（~行15816） | LOW | `pursuitLoss` 计算公式错误（`ss + Math.max(0, ss)` 永远返回0），且计算结果未被使用——死代码 | 删除整行死代码 |
| 3a | `aiExecuteOrders` 段1 GT2鹰鸽判断（~行5889） | MEDIUM | 只用 `[unit]` vs `nearbyEnemies` 做1v多评估，忽略己方周围友军 | 收集2hex内友军 `nearbyAllies` 组成 `[unit, ...nearbyAllies]` 一起评估胜率 |
| 3b | `aiExecuteOrders` 段2 halt攻击鹰鸽判断（~行6001） | MEDIUM | 只用 `[unit]` vs `[contactEnemy]` 做1v1评估，忽略周围所有友军/敌军 | 改用 `collectBattleSides(unit)` 收集实际参战双方再做胜率评估 |
| 4 | `aiDefenderDecision` 守方出城方向选择（~行6247） | MEDIUM | 只过滤不可通行地形，未检查目标格是否已被部队占据 | filter加 `G.units.some(...)` 排除已有部队的hex |
| 6 | `aiInitiateBattle` 营寨战 + `_resolveBattleEngagement` 野战地形获取（~行14443,14451,15827） | LOW | 使用 `gx/gy` 获取地形（Q6遗留方向） | 改为 `hq??gx, hr??gy`，与项目统一hq/hr方向一致 |

### Bug根因分析

**Bug 1 — 冷却部队参战（设计确认，不修）**：`collectBattleSides` 攻方支援不过滤 `_battleCooldown`。经讨论确认为合理设计：战斗结算后部队带着减员状态参战下一场，ATK/DEF自然降低，数值上公平。大兵团集结时同旬多线作战符合战场逻辑。后续可作为独立feature做"战斗确认弹窗中勾选参战部队"的UI。

**Bug 3 — 鹰鸽1v1评估**：AI部队行军遇敌时做鹰鸽判断，旧逻辑只用单部队对比。如果3支己方部队集结在同一区域面对1支敌军，单部队评估可能得出胜率<0.5（鸽派），实际3v1明显能赢。修复后收集实际参战双方（段1用2hex邻近友军，段2用 `collectBattleSides`），AI决策更准确。

**Bug 4 — 出城hex重叠**：守方出城时 `hq/hr` 被直接赋值到选定hex，如果该hex已有攻方部队占据，会出现同hex敌对部队重叠但不触发战斗的异常状态。

### 不改的

- `aiInitiateBattle` 主体流程不变（营寨战/普通野战/叫阵分支）
- `collectBattleSides` 守方收集逻辑不变（步骤1+步骤2已正确）
- `aiDefendResponse` 增援调度逻辑不变
- `aiDoSiege` 攻城决策不变
- `checkAmbushTriggers` 伏击检测不变
- 玩家侧所有逻辑不变

### v100 待验证清单状态

| # | 验证项 | 状态 |
|---|--------|------|
| 1 | AI鹰派攻击玩家弹窗 | ⏳ 待验证 |
| 2 | AI vs AI叫阵+自动结算 | ⏳ 待验证 |
| 3 | 多支AI部队去重 | ⏳ 待验证 |
| 4 | GT2鸽派超时→idle→回城 | ⏳ 待验证 |
| 5 | 快进模式AI处理玩家方 | ⏳ 待验证 |
| 6 | 叛军攻城 | ⏳ 待验证 |

---

### v101 追加：诸葛亮伏击debuff调整

**修改前**：守方有诸葛亮 → 伏击命中率 -15%（v86从-25%降到-15%）
**修改后**：守方有诸葛亮 → 伏击命中率 -10%

**效果对比**（司马懿INT95伏击INT75部队，森林地形）：

| 场景 | 旧(v86) | 新(v101) |
|------|---------|----------|
| 无诸葛亮 | 56% | 56%（不变） |
| 守方有诸葛亮 | 41% | 46% |
| 攻方有诸葛亮 | 71% | 71%（不变） |
| 双方都有诸葛亮 | 56% | 61% |

**修改位置**：`resolveAmbush`（~行12974）+ `_showAmbushConfirm`（~行14890），共2处。

**设计确认**：伏击保持强制1v1。伏击是突袭行为，周围友军来不及反应。大兵团集结时伏击的作用是打士气差、造成前哨损失，不是决战工具。

---

### v101 追加：战斗确认弹窗UI修复

#### 迎战按钮黑字（Bug修复）

**根因**：伏击弹窗覆写 `bcBtnFight.style.cssText` 为紫色渐变；`confirmAmbush` 还原时用 `cssText=''` 清空全部inline style，连 `color:#f08080` 也丢失。后续普通野战弹窗不重设按钮样式，按钮文字回退为浏览器默认黑色。

**修复**：`_showNextBattleConfirm` 进入普通野战分支后，立即重置 `bcBtnFight` 和 `bcBtnRetreat` 为原始HTML模板中的完整inline style（含color、background、border、hover效果）。

#### bcLocation标题残留（Bug修复）

**根因**：伏击弹窗设 `bcLocation = '【XX】伏击战'`、营寨/攻城同理，但普通野战弹窗不设bcLocation，上一场的标题残留。

**修复**：普通野战分支开头设 `bcLocation = '【nodeLabel】遭遇战'`。

#### 部队信息按unit拆分显示

**修改前**：`_battleSideHtml` 将所有部队武将名flatten成单行，兵力加总显示。多部队时看不出各队构成。

**修改后**：
- **单部队**：保持原样（无变化）
- **多部队**：逐部队一行，格式为"武将名 兵力"，底部加"合计兵力 X"
- **己方**：精确显示每支部队的武将（武/智属性）+ 精确兵力
- **敌方**：逐部队按己方最高INT模糊（≥90全明/≥75名字无属性/≥60仅主将/\<60不明部队），兵力逐部队模糊 + 合计模糊

**修改位置**：`_battleSideHtml`（~行14785），完整重写。

---

### v101 追加：野外战斗去重bug修复

**问题**：`aiInitiateBattle` 用 `getUnitNodeId(aggressorUnit) || '?'` 作为去重key的位置部分。野外部队不在城市hex上，`getUnitNodeId` 返回null，fallback到 `'?'`。导致同旬两场**不同位置**的野外战斗（同一对势力），第二场被错误去重不触发。

**修复**：去重key重新设计为三部分规范化：
1. 势力对排序（`fid < defFac ? fid|defFac : defFac|fid`），确保正反方向key一致
2. 位置标识：城市hex用cityId，野外用攻守双方hex坐标排序组合（`min:max`）
3. 最终key格式：`sortedFacPair|normalizedLocation`

**修改位置**：`aiInitiateBattle`（~行14420），1处。

---

### v101 追加：战败撤退方向+追击修复

**问题**：`_resolveBattleEngagement`、`resolveCampBattle`、`resolveSiegeBattle` 中战败方调用 `doRetreat(survivors)` 时不传chasers参数，导致三个问题：

1. **撤退方向错误**：`enemyCenter=null` 时方向评分失效，败方总是往hexNeighbors数组的第一个合法方向走（固定偏向，与敌方位置无关），而非远离胜方
2. **追击损失重复/缺失**：`_resolveBattleEngagement` 中 `doRetreat` 内部因无chasers不算追击损失，外部又用固定12%扣血——逻辑重复且不一致；其他三处（营寨战×2、攻城战）则完全无追击损失
3. **胜方不前进**：`chasers.length===0` 时胜方不占据败方腾出的hex

**修复**：5处 `doRetreat` 调用统一传入胜方作为chasers + `'partial'` 作为retreatResult：

| 调用点 | 场景 | 修复 |
|--------|------|------|
| `_resolveBattleEngagement` (~15947) | 野战败方 | `doRetreat(survivors, winners, 'partial')` + 删除外部重复12%追击 |
| `resolveCampBattle` 劫营败方 (~13271) | 劫营结算败方 | 同上 |
| `resolveCampBattle` 劫营失败攻方 (~13326) | 劫营失败攻方撤退 | `doRetreat(attackers, defenders, 'partial')` |
| `resolveCampBattle` 强攻败方 (~13371) | 营寨强攻败方 | `doRetreat(survivors, winners, 'partial')` |
| `resolveSiegeBattle` 攻城败方 (~14316) | 攻城失败攻方 | 同上 |

**不改的**：
- `resolveSiegeBattle` 城破突围 `doRetreat([u])`：混乱突围场景，方向随机合理
- 路径A战前撤退 `doRetreat(defenders, attackers, retreatResult)`：已正确传参
- 玩家撤退确认 `doRetreat(playerSide, enemySide, rr)`：已正确传参

**追击损失对比**：
- 旧：固定12%兵力（且仅在`_resolveBattleEngagement`中，其他战斗类型无追击）
- 新：`calcPursuitLoss` 动态计算（基础6% × 兵力比 × AP修正 × 地形 × 随机，上限25%），所有战斗类型统一

**战报文案**：`report.pursued` 描述从"额外损失约12%"改为"败方溃退遭追击，额外损伤"。
---

## v102 缩放性能 + 城市进入规则 + AI前线撤退修复

### Bug1: 缩放/拖拽卡顿（性能优化）

**根因**：`zoomMap()` 每次调用都执行 `renderMap()` + `renderOverlay()`——全量重建SVG innerHTML（~6000+hex迷雾+45城市+部队+图例）。滚轮事件高频触发导致每秒重建DOM十几次。

**修复**：缩放/拖拽时只更新 `<g id="mapRoot">` 的 `transform` 属性（零开销），debounce 180ms后才做一次全量renderMap更新反缩放文字。

| # | 位置 | 修复 |
|---|------|------|
| 1 | `zoomMap` (~行18594) | `renderMap();renderOverlay()` → `_applyMapTransformOnly(); _debouncedMapRender()` |
| 2 | 拖拽 `mousemove` (~行18648) | 同上，只更新transform属性 |
| 3 | 拖拽 `mouseup` (~行18661) | 拖拽结束立即做一次全量渲染（确保反缩放文字正确），清除debounce timer |

**新增函数**：
- `_applyMapTransformOnly()` — 只更新mapRoot的transform属性，不重建DOM
- `_debouncedMapRender()` — debounce 180ms后触发 `renderMap()` + `renderOverlay()`

### Bug2: 部队走进敌对/中立城市

**根因**：两层问题。
1. **寻路层（hexAstar）**：不考虑城市归属，路径可能穿过敌方/中立城市hex
2. **移动层（processUnitMovement）**：敌对城市有拦截（围城），但中立城市允许进入hex后才halt——部队已经站在对方城里

**修复（4处+全局hexAstar调用更新）**：

| # | 位置 | 修复 |
|---|------|------|
| 1 | `hexAstar` (~行2018) | 新增第6参数 `unitFac`：非己方城市hex（fac≠unitFac且fac≠'none'）视为不可通行（终点除外，允许围城寻路） |
| 2 | `processUnitMovement` (~行11674) | 敌方城市拦截后追加中立城市拦截：不进入城hex，在当前格halt |
| 3 | `processUnitMovement` (~行11735) | 删除原有的进入hex后才检测中立城市的死代码（已被pre-entry拦截替代） |
| 4 | renderMap 移动范围BFS (~行9366) | 非己方城市hex不纳入可达范围（显示与实际一致） |

**hexAstar调用更新（8处传入unitFac）**：

| 调用点 | 位置 |
|--------|------|
| `findNearestOwnCityPath` | ~行2006，传 `fac` |
| AI attack行军 | ~行5975，传 `fid` |
| AI defend行军 | ~行6071，传 `fid` |
| 自动回城 | ~行8357，传 `u.fac` |
| `issueUnitMove` | ~行16946，传 `unit.fac` |
| 玩家点击城市预览 | ~行17526，传 `unit.fac` |
| 玩家hex移动预览 | ~行17555，传 `unit.fac` |
| 玩家hex移动确认 | ~行17599，传 `unit.fac` |

**不传unitFac的调用（2处，保留原行为）**：
- 叛军被驱逐后寻路（~行5029）：叛军无城池，传fac会导致无法寻路
- 叛军进攻寻路（~行5055）：同上

### Bug3: AI前线部队被战略重评估召回

**根因**：`aiSelectTargets` 触发重评估时，行5672 `availableUnits.forEach(u => { u._aiRole = null; u._aiTarget = null; })` 无条件清空所有可用部队的角色标记。正在前线对峙的attack部队被清为idle → 自动回城逻辑（行8338-8352）将其march回后方。

**流程还原**：蜀军刘备/关羽部队在襄阳一带与玩家拉锯 → `_aiShouldReview` 触发重评估 → 角色清空 → 威胁矩阵判断多方向威胁>3 → 全部标idle → 自动回城 → 前线撤空。

**修复**：`aiSelectTargets` 收集 availableUnits 时，排除"正在前线交战区的attack部队"（status=halt + _aiRole=attack + 4格内有可见敌军）。这些部队保留当前角色和目标，不参与重分配。

| # | 位置 | 修复 |
|---|------|------|
| 1 | `aiSelectTargets` availableUnits收集 (~行5669) | 原 `.filter()` 改为 `function body`，增加attack+halt+近敌检测，return false保留角色 |

**设计逻辑**：
- `_aiRole='attack'` + `_aiTarget` 存在 + `status='halt'`（被鹰鸽判断暂停）
- 4格内有可见（FOG_VISIBLE）敌军 → 判定为前线交战中
- 不纳入availableUnits → 角色不被清空 → 不会被自动回城
- 如果敌军撤走（4格内无敌军），下次重评估时恢复为可用，正常重分配

### 不改的

- renderMap全量渲染逻辑不变（只是减少调用频率）
- 伏击/围城/战斗相关逻辑不变
- AI鹰鸽判断逻辑不变
- 叛军移动逻辑不变
- 战斗结算/撤退/追击不变

### v100 待验证清单状态

| # | 验证项 | 状态 |
|---|--------|------|
| 1 | AI鹰派攻击玩家弹窗 | ⏳ 待验证 |
| 2 | AI vs AI叫阵+自动结算 | ⏳ 待验证 |
| 3 | 多支AI部队去重 | ⏳ 待验证 |
| 4 | GT2鸽派超时→idle→回城 | ⏳ 待验证 |
| 5 | 快进模式AI处理玩家方 | ⏳ 待验证 |
| 6 | 叛军攻城 | ⏳ 待验证 |

---

### v102 追加：_battleCooldown 机制删除

**设计决策**：战斗冷却机制（败方3旬/胜方1旬不能移动和战斗）提供的防重复战斗保护已由 `_aiBattleProcessedThisTurn` 去重集合覆盖（同旬同位置同势力对不重复触发），且AI每旬 `runAI()` 只跑一次、玩家侧需点击才触发，自然隐含了每旬最多一次主动战斗的限制。显式冷却额外冻结移动，惩罚败方（钉在原地不能撤退），不符合战场逻辑。

**删除范围（~60处）**：

| 类别 | 处理方式 | 数量 |
|------|---------|------|
| 赋值（`u._battleCooldown = N`） | 删除整行或清除赋值 | ~25处 |
| 条件检查（filter中的cooldown过滤） | 删除条件分支 | ~25处 |
| `processUnitMovement` 递减+跳过 | 删除整个if块 | 1处 |
| 玩家UI守卫（"战斗冷却中"提示） | 删除if块 | 3处 |
| `aiInitiateBattle` 入口守卫 | 删除 | 1处 |
| `checkAmbushTriggers` activeUnits过滤 | 改为直接用allUnits | 1处 |
| 空forEach / 废弃注释 | 删除死代码 | ~10处 |

**保留**：`_battleCooldown: 0` 初始属性声明（无害，兼容旧存档）。

**语法修复**：删除过滤条件后产生2处 dangling `&&`（段2 halt attack filter、aiDefenderDecision defender filter），已修复。

---

### v102 追加：GT2 鸽派3旬超时放弃机制删除

**设计决策**：原机制在鸽派halt 3旬后强制设idle放弃任务，部队被自动回城逻辑拉回后方。对防守方等同于放弃国门。历史上前线对峙数年是常态，应由局势自然演化（经济提升→兵力增长→打破均衡），不应人为强制退出。

**修改（2处）**：

| # | 位置 | 修改前 | 修改后 |
|---|------|--------|--------|
| 1 | `aiExecuteOrders` 段1 超时检查 (~行5949) | 等≥3旬 → idle + 清目标 + return | 删除idle分支，敌军在→继续对峙，敌军走→恢复行军 |
| 2 | `aiExecuteOrders` 段2 超时检查 (~行6022) | 等≥3旬 → idle + 清目标 + 清hexPath | 删除超时放弃分支，只记录_aiHaltTurn |

**鸽派部队新行为**：
- 每旬重新评估：敌军消失→恢复行军 / 敌军还在→继续对峙 / 增援到达胜率过线→变鹰开打
- 无超时强制退出

**与Bug3修复的协同**：两条后退路径均已堵死：
1. ~~GT2超时→idle→自动回城~~ （超时已删除）
2. ~~aiSelectTargets重评估→清空角色→idle→自动回城~~ （v102已保护前线部队）

---

### v102 追加：battleCooldown残留清理（7处）

| # | 类型 | 行号 | 修复 |
|---|------|------|------|
| Bug1 | 文案错误 | ~16948 | `showNotif('敌方战斗冷却中')` → `'附近未发现可攻击的敌军'` |
| Bug2 | 文案错误 | ~15356 | 攻城确认弹窗 `'部队需冷却3旬'` → `'部队撤退'` |
| R1 | 注释清理 | ~13861 | 删除 `// 不设cooldown，立刻被迫交战` |
| R2 | 注释清理 | ~13940 | 删除 `// 追击方也设cooldown` 悬空死注释 |
| R3 | 注释修正 | ~15888 | `已设cooldown + 追击损失` → `处理追击损失+撤退方向+胜方前进` |
| R4 | 注释修正 | ~8335 | `无battleCooldown（刚打完仗的先不管）` → `无AI任务` |
| R5 | 注释清理 | ~15061 | 删除 `// BUG-8 fix: 胜方也设冷却，防止同旬二次战斗` |

文件中已无任何 `cooldown`（英文）或 `战斗冷却`/`冷却3旬` 残留。`_battleCooldown` 仅余初始属性声明 `_battleCooldown: 0`（兼容旧存档）。

---

### v102 追加：v100待验证清单走查结果

| # | 验证项 | 状态 | 说明 |
|---|--------|------|------|
| 1 | AI鹰派攻击玩家弹窗 | ✅ 通过 | aiExecuteOrders段1鹰派→aiInitiateBattle→playerInvolved→_pendingBattleConfirms→弹窗，攻守关系正确传递 |
| 2 | AI vs AI叫阵+自动结算 | ✅ 通过 | aiInitiateBattle内AI vs AI分支→aiDecideDuelChallenger→resolveDuel→applyDuelMorale→_resolveBattleEngagement完整 |
| 3 | 多支AI部队去重 | ✅ 通过 | 去重key=facPair|dedupLoc，势力对排序+位置规范化，不误杀不遗漏 |
| 4 | 鸽派对峙+恢复行军 | ✅ 通过 | 敌军撤走→stillThreatened=false→delete _aiHaltTurn→恢复行军；增援到达→nearbyAllies提升胜率→变鹰 |
| 5 | 快进模式AI处理玩家方 | ✅ 通过 | _fastForward时玩家也被AI托管，战斗push到_pendingBattleConfirms→nextTurn中while循环autoResolvePendingBattle消化 |
| 6 | 叛军攻城 | ✅ 已修复 | 原bug：叛军siege后无攻城逻辑永久卡死。修复：runRebelAI中围城≥2旬后自动resolveSiegeBattle |

---

### v102 追加：叛军攻城修复（Bug6）

**问题**：叛军进入siege状态后，无任何代码触发攻城决策。`aiDoSiege`只服务wei/shu/wu，叛军战斗检测只捕获`status==='halt'`，`runRebelAI`因`curNode=null`导致寻路失败。叛军永远卡在siege状态。

**修复**：`runRebelAI` 中新增siege处理分支（在hexPath检查之后、行军逻辑之前）：
- `unit.status === 'siege' && unit.siegeTarget` → 进入围城处理
- `_siegeTurnCount` 每旬递增
- ≥2旬 → 直接 `resolveSiegeBattle`（叛军不做胜率评估，暴民行为）
- 目标城已是叛军或不再敌对 → 解除围城
- `return` 跳过后续行军逻辑

---

### v102 追加：堆叠规则统一 + 攻城弹窗合并

#### 核心规则变更

**旧规则**：敌方城市相邻hex允许友军堆叠（围城支援）
**新规则**：**野外任何hex最多一个部队，唯一例外是城市hex内（garrison共存）**

围城支援不再需要堆叠——`launchSiegeAttack` 已支持2hex内halt部队自动参战，部队停在不同hex也能协同攻城。

#### 修复内容（7处）

| # | 位置 | 修复 |
|---|------|------|
| 1 | `processUnitMovement` 堆叠检查 (~行11727) | 删除围城支援堆叠例外（`nearHostileCity`检查），野外hex occupied即halt |
| 2 | 玩家移动堆叠检查 (~行17090) | 同上，删除`nearHostileCity`例外 |
| 3 | `doRetreat` 败方撤退方向 (~行13902) | 排斥**所有部队**（不只敌军），己方城市hex除外，防止败方撤退堆叠 |
| 4 | `doRetreat` 胜方前进 (~行13941) | 从forEach内移到forEach外只执行一次；记录第一个败方unit的原位置；加堆叠检查（目标hex有部队则不前进，己方城市hex除外） |
| 5 | 移动范围BFS显示 (~行9374) | 已有部队的非城市hex不纳入可达范围（显示与实际一致） |
| 6 | `_siegeArrivalChoice` (~行14112) | 选"直接攻城"后直接`resolveSiegeBattle`结算，不再走`launchSiegeAttack`的二次确认弹窗 |
| 7 | `_doRetreat2Hex` (~行15123) | 伏击撤退也排斥所有部队（与doRetreat一致） |

#### 攻城弹窗合并

**旧流程**：到达敌城旁 → 弹窗1（直接攻城/围而不攻）→ 选攻城 → `launchSiegeAttack` → 弹窗2（迎战/撤退）
**新流程**：到达敌城旁 → 弹窗（直接攻城/围而不攻）→ 选攻城 → 直接 `resolveSiegeBattle` 结算 → 战报

已在siege状态的部队仍可通过面板上的"⚔ 立即攻城"按钮（`launchSiegeAttack`）发起攻城，该路径保留不变（围了若干旬后主动发起，走正常确认流程）。

#### 不改的

- `launchSiegeAttack` 函数本身不变（面板按钮入口保留）
- `collectBattleSides` 攻方支援收集不变（1hex内友军仍自动参战）
- `aiDefenderDecision` 出城逻辑不变（已有部队占据排斥，v101 Bug4修复）
- 城市hex内garrison共存不变
- hexAstar寻路逻辑不变

### 待办事项（下轮）

## v103 堆叠规则全面加固

### 审计范围

对所有可能导致两个部队共存同一hex的代码路径进行全面排查，涉及：

| 代码路径 | 状态 |
|----------|------|
| `processUnitMovement` 堆叠检查 | ✅ 已加固 |
| 玩家即时移动堆叠检查 | ✅ 已加固 |
| BFS移动范围显示 | ✅ 已加固 |
| `_triggerMinorRebellion` 叛军出生 | ✅ 已修复 |
| `doRetreat` 败方撤退 | ✅ 已正确（v102） |
| `doRetreat` 胜方前进 | ✅ 已正确（v102） |
| `_doRetreat2Hex` 伏击撤退 | ✅ 已正确（v102） |
| `aiDefenderDecision` 出城 | ✅ 已正确（v101） |
| `createUnit` 征兵出生 | ✅ 无问题（garrison在城市hex） |
| `hexAstar` 寻路 | ✅ 已正确（v102，非己方城市不可穿越） |

### Bug A: 叛军出生不检查堆叠（~行4962）

**问题**：`_triggerMinorRebellion` 在城市邻格随机选一个passable hex出生叛军，完全不检查该hex是否已有部队。如果该hex恰好有部队，叛军直接叠上去。

**修复**：`spawnNbs` 过滤条件增加堆叠检查（`G.units.some` 排除已有部队的hex）。所有邻格均被占据时 `return`（叛乱被镇压，不出生）。

### Bug B: 城市hex堆叠检查过于宽松（processUnitMovement ~行11737 & 玩家移动 ~行17124）

**问题**：v102的堆叠检查用 `if(!isCityHex)` 完全跳过城市hex，意味着任何势力的部队理论上可以共存于城市hex。虽然前面有pre-entry拦截（敌城→围城/halt），但逻辑不完整——城市hex也应验证是否同势力。

**修复**：改为统一检查所有hex是否有其他部队，仅当该hex是**己方城市**（`G.cities[cityId].fac === unit.fac`）时才允许共存。

| # | 位置 | 修复 |
|---|------|------|
| 1 | `processUnitMovement` (~行11737) | `if(!isCityHex)` → 统一检查，仅己方城市hex例外 |
| 2 | 玩家即时移动 (~行17124) | 同上 |
| 3 | BFS移动范围显示 (~行9386) | `if(!cid)` → 统一检查，仅己方城市hex例外 |

### Bug C: 玩家即时移动缺少"非己方非敌对城市"拦截（~行17111）

**问题**：`processUnitMovement` 有两层城市拦截（敌对→围城，非己方→halt），但玩家即时移动只有敌对城市→围城，缺少第二层。虽然 `hexAstar` 在寻路层面阻止穿越非己方城市，但防御性编程应在移动执行层也补上。

**修复**：在敌对城市围城检查之后，增加非己方城市halt拦截（与 `processUnitMovement` 逻辑一致）。

### 堆叠规则最终版（v103确认）

> **野外hex**：最多一个部队，无例外
> **城市hex**：仅允许**同势力**多支部队共存（garrison共存）
> **不同势力**：任何hex上不允许不同势力部队共存（战斗/围城/halt拦截保证）

### 不改的

- `hexAstar` 寻路逻辑不变（v102已正确阻止穿越非己方城市）
- `doRetreat` / `_doRetreat2Hex` 撤退逻辑不变（v102已正确排斥所有部队）
- `aiDefenderDecision` 出城逻辑不变（v101已正确排斥已占据hex）
- `createUnit` 征兵逻辑不变（garrison在城市hex，天然合法）
- `collectBattleSides` 攻方支援收集不变
- 战斗结算/追击不变

### 待办事项（下轮）

**下一步路线图**：G2（AI大重构）→ C3（宣战宣称）→ 游戏可玩

**优先级1 — 近期必做**：
1. **G2 AI大重构**：进攻集结 / 防守增援 / 资源分配 / 封官 / B4人格参数 / 多线协调
2. **C3 宣战宣称 + 挟天子**

**优先级2 — 应做**：
3. 武将技能实装（60将技能desc已写）
4. 反伏击机制

**优先级3 — 可选**：
5. 地图裁剪
6. Q6: `gx/gy` → `hq/hr` 统一

---

## v104 AI基建ROI + AI调粮 + AI人才招募统一

### 1. aiDoBuild ROI重写

**旧逻辑**：静态优先级列表（farm→market→barracks...），前线城一刀切不建。
**新逻辑**：每个城市×每个建筑算ROI score，选分最高的建。

**评分规则**：

| 建筑类型 | score公式 | 前线城 |
|---------|----------|--------|
| farm/irr/granary | 预估增量收益/金钱成本×100，缺粮时×2.0 | 不建 |
| market/harbor | 预估增量收益/金钱成本×100，缺金时×1.5 | 不建 |
| wall | 50 × (1 + maxThreat/5)，读_aiGetThreatMatrix | ★可建 |
| barracks | 35 × (1 + maxThreat/8) | ★可建 |
| stable/workshop | 12（固定低分） | 不建 |
| school/clinic/road | 10（固定低分） | 不建 |

**关键改进**：
- 前线城允许建城墙和兵营（旧版完全不建），威胁越高score越高
- 后方城仍优先（排序不变），前线城排最后但不再被`break`跳过
- 港口城建harbor的ROI天然高（base.gold×0.40/1200），自动优先
- irr依赖farm存在（farmLv===0时return -1），避免空建水利

**改动位置**：`aiDoBuild`（~行4328），完整重写内部逻辑，函数签名不变。

**模拟发现的问题及修复**：原方案按城市顺序遍历（后方优先），`MAX_BUILDS_PER_TURN=2`名额被后方经济建筑消耗完，前线城轮不到。改为**全局候选排序**：所有(城市×建筑)对按score降序排，取top N，每城每旬最多1项。`MAX_BUILDS_PER_TURN`从2提升到3。

### 36旬快进模拟验证结果

| 指标 | 结果 |
|------|------|
| 崩溃 | 0次 |
| AI基建决策 | 60次，城墙15+兵营8+粮仓7+农田1 |
| 前线军事建筑 | 45次（南阳城墙ROI=112排第一） |
| AI调粮 | 0次（所有城市food net>0，正确不触发） |
| AI招募 | 魏招陈宫(在野)，挖角池积累4人(司马懿/贾诩/潘璋/步骘) |
| 挖角池触发条件 | 忠诚<45自动入池，AI每3旬评估 |

**AI调粮验证**：手动drain城市storage到200后确认`getCityFoodTurns`仍返回Infinity（因产>耗），调粮正确不触发。调粮系统是安全网，仅在城市赤字时（围城/大规模驻军导致消耗超产出）生效。

### 2. aiDoTransfer 新增（AI调粮）

**设计**：遍历己方缺粮城，复用现有 `findBestDonor` + `doTransfer`。

```
遍历己方城市:
  getCityFoodTurns(city) < 9 且 transferCD === 0:
    findBestDonor(city.id) → donor
    doTransfer(donor, city, 8旬消耗量, ceil(dist×1.5), 距离损耗率)
```

**改动位置**：
- 新增函数 `aiDoTransfer(fid)`（~行4471，~15行）
- `runAI`（~行6748）：`aiDoBuild` 之后调用

### 3. aiDoRecruitTalent 人才招募统一（替代aiDoRecruitWild）

**旧逻辑**：`aiDoRecruitWild` 只从在野池招人，AI不挖角。
**新逻辑**：统一候选池（在野+可挖角），统一评分，统一预算。

**统一候选池**：

| 来源 | 候选条件 | score修正 |
|------|---------|----------|
| 在野 `G.wildPool` | CD内跳过，cost=1500+fail×500 | 原始score |
| 可挖角 `G.recruitableGens` | 非己方，cost按属性(1500/3000) | score×0.8（风险折扣） |

**预算**：`min(金库×15%, 军事预算×25%)`，每3旬最多招1人。

**新增函数**：
| 函数 | 行号 | 说明 |
|------|------|------|
| `aiDoRecruitTalent(fid)` | ~4860 | 替代aiDoRecruitWild，统一在野+挖角 |
| `_aiDoPoach(genName, fid, srcFid, cost)` | ~4914 | AI挖角执行，复用poachGen成功率公式 |

**删除函数**：`aiDoRecruitWild`（被aiDoRecruitTalent完全替代）

**`_aiDoPoach` 逻辑**：
- 成功率公式与玩家`poachGen`一致（魅力+忠诚+同乡同族同士族）
- 成功：转移武将+忠诚设60+外交-15+小传记录
- 失败：扣金，无其他惩罚
- `genJoinSource`标记为`'capture'`（与俘获同类处理）

**runAI调用更新**：
```
...
4. aiDoBuild           → ★ v104: ROI基建
4b. aiDoTransfer       → ★ v104: AI调粮
5. aiDefendResponse
6. aiSelectTargets
7. aiExecuteOrders
8. aiDefenderDecision
9. aiDoSiege
10. aiDoRecruitTalent  → ★ v104: 在野+挖角统一（每3旬）
```

### Bug修复

| Bug | 位置 | 修复 |
|-----|------|------|
| `aiDoBuild`读不存在的`fac._aiThreatMatrix` | ~行4357 | 改为调用`_aiGetThreatMatrix(fid)`，读`.highestThreat` |
| `getCityFoodTurns`返回`Infinity`导致avgFoodTurns=NaN | ~行4339 | Infinity时用99代替 |

### 不改的

- `_aiCalcBudget` 预算系统不变（military/build二分）
- `aiDoRecruit` 征兵逻辑不变
- `poachGen` 玩家侧挖角不变
- `_doRecruitWild` 底层招募函数不变（aiDoRecruitTalent调用它）
- `findBestDonor` / `doTransfer` 调粮底层不变（aiDoTransfer调用它们）
- 战斗/外交/UI 不变

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v104.html |
| 总行数 | ~18956 行 |

### 待办事项（下轮）

**v103末尾待办勘误**：原写"G2 AI大重构+C3宣称待做"为旧版残留，实际v85-v98已全部完成。

**真实待做清单**：

**优先级1 — 近期必做**：
1. **君主更替系统**：君主死亡→继任者选择→AI_PERSONALITY切换
2. **I3 朝议系统**：设计已确认（~150-200行）

**优先级2 — 应做**：
4. 武将技能实装（73将，107处"待实装"）
5. AI伏击/扎营（aiExecuteOrders扩展）
6. 反伏击机制（斥候/INT识破）

**优先级3 — 系统完整性**：
7. E1 水战系统
8. E2 地域特色兵种
9. E3 科技树

**技术债**：
10. 地图裁剪
11. gx/gy → hq/hr 坐标统一
12. AI平衡性调参

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ **基建ROI✅ 调粮✅ 挖角✅ v104** |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | 🔄 I2豪族✅ **I1太守建设buff✅v104** → I3朝议待做 |

---

## v104 追加：I1 太守建设速度buff

### 设计

在现有太守系统（pol→金币产出、标签→豪族支持）基础上新增**建设速度**维度。太守的派系标签和属性决定对哪类建筑有额外加速概率，鼓励玩家为每座城匹配合适标签+高pol的太守。

### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `getPrefectBuildBuff(cityId, bldId)` | ~4290 | 返回 `{bonus, label}`，bonus为额外加速概率 |

### buff规则

**类型buff（取最高一条）**：

| 太守特征 | 建筑类型 | 加速概率 |
|---------|---------|---------|
| 本地域士族 | comm（市集/港口/驿道） | +20% |
| 外地域士族 | comm | +15% |
| 寒门 | mil（兵营/城墙/马厩/作坊） | +15% |
| pol≥75 | agri/civ（农田/水利/粮仓/学堂/医馆） | +12% |
| com≥75 | mil | +12% |

**通用修正（叠加在类型buff上）**：

| 特征 | 效果 |
|------|------|
| 创始元勋 | +5% |
| 降将（tenure<180旬） | -10% |

**总上限**：`_buildAccelProb` cap在0.85（含pol通用加速+光禄勋buff+I1类型buff）。

### 验证数据

| 太守 | 城市 | 建筑 | bonus | 说明 |
|------|------|------|-------|------|
| 荀彧 | 许昌 | 市集 | +20% | 本地中原士族→商业 |
| 荀彧 | 许昌 | 城墙 | +12% | com=78≥75→军事 |
| 张飞 | 汉中 | 兵营 | +20% | 寒门15%+元勋5% |
| 张飞 | 汉中 | 农田 | +5% | 仅元勋通用 |
| 诸葛亮 | 成都 | 农田 | +12% | pol=95≥75→民生 |
| 诸葛亮 | 成都 | 市集 | +15% | 外地士族→商业(荆州≠益州) |
| 曹仁 | 南阳 | 农田 | +5% | 纯元勋通用 |
| 无太守 | 任何 | 任何 | 0 | — |

### 修改位置

| 位置 | 改动 |
|------|------|
| `processBuildQueues`（~行4338） | `_buildAccelProb`从全城统一值改为每个建筑项单独计算（叠加I1 bonus） |
| renderCityTab 建筑列表（~行10058） | 每个建筑选项旁显示太守加速标签（绿色⬆/红色⬇+百分比） |

### 与现有太守系统的关系

| 维度 | 机制 | 来源 |
|------|------|------|
| 金币产出 | pol/500乘数 | 原有 |
| 豪族支持 | 本地/外地/寒门→gentry±0.3/旬 | I2 v91 |
| **建设速度** | **标签×建筑类型→加速概率** | **I1 v104** |

三层互相独立但方向一致：找对的人管对的城 = 全方位加成。

---

## v105 I3 朝议系统

### 设计概要

每季度首旬（`G.turn % 9 === 1`），势力内tier1/tier2在任官员各提一策，玩家从中择二而行。被采纳提案生效1月（3旬），季度9旬中仅前3旬有效（后6旬空窗），提案人派系获正面忠诚反馈；未采纳的派系受负面反馈。

### 触发条件

- 每9旬触发一次（第10、19、28旬...）
- 玩家势力≥1个tier1/2在任官员即触发朝议弹窗
- 0个在任 → 跳过（无日志，安静跳过）
- AI势力同步触发，自动选择最优提案

### 提案人选取

- **Tier 1**（大将军/丞相）：全部出提案
- **Tier 2**（前后左右将军/尚书令/侍中/太常/光禄勋）：武官随机挑1人、文官随机挑1人
- 若某track无tier1，tier2补位（多出1人）
- 最终提案数 = 实际提案人数（1~4个），不硬凑
- 提案数≥2 → 选2个；提案数=1 → 自动通过

### 提案池

**武官（mil track）**：

| id | 名称 | buffKey | 基础效果 |
|---|------|---------|---------|
| conscript | 征兵令 | recruitCost | 征兵费-15% |
| upkeep | 扩军备战 | upkeep | 维护费-10% |
| reinforce | 充员令 | reinforce | 补员速度+10% |
| milBuild | 军防工程 | milBuildCost | 城墙·兵营建设成本-30% |

**文官（civ track）**：

| id | 名称 | buffKey | 基础效果 |
|---|------|---------|---------|
| farm | 劝农令 | foodProd | 粮食产出+12% |
| trade | 兴商令 | goldProd | 金币产出+10% |
| morale | 安民策 | morale | 民心回复+0.5/旬 |
| recruit | 招贤令 | recruitWild | 在野投效概率+25% |

**属性微调**：提案人的COM（武官）或POL（文官）每高于70一点，效果绝对值+0.1%（上限+5%）。

### 派系反馈

| 情况 | 效果 |
|------|------|
| 提案被采纳 | 提案人派系全员 `genFactionMod` +1.5 |
| 提案被否决 | 提案人派系全员 `genFactionMod` -0.8 |

复用现有 `genFactionMod` 累积忠诚修正[-20,+20]，朝议事件同时写入 `genFactionModLog`。

### Buff生效管道

| buffKey | 生效路径 |
|---------|---------|
| goldProd / foodProd / morale / recruitCost / reinforce / upkeep | 合并到 `_postBuffs` 缓存（`processFacEconomy` 内），与官职buff叠加 |
| milBuildCost | 玩家 `buildBld` + AI `aiDoBuild` 内显式读取，对 cat='mil' 建筑金钱成本打折 |
| recruitWild | `_doRecruitWild` 内显式读取，叠加到 finalRate |

### 数据结构

```js
G.courtDecrees = [
  { fid:'wei', buffKey:'recruitCost', effectVal:-0.15, name:'征兵令', proposer:'张辽', expiresAt:13 }
];
// 每季度首旬 triggerCourtCouncil() 内调用 _expireCourtDecrees() 清除过期
// 持续3旬（1月），季度9旬中仅前1/3有buff
```

### 新增函数

| 函数 | 说明 |
|------|------|
| `_generateCourtProposals(fid)` | 生成提案列表 [{proposal, proposer, postDef, factionId, effectVal}] |
| `getCourtDecreeBuffs(fid)` | 汇总该势力当前生效decree buff |
| `_applyCourtDecisions(fid, proposals, chosenIndices)` | 写入decree + 派系mod |
| `_expireCourtDecrees()` | 清除过期decree |
| `_aiCourtSelect(fid, proposals)` | AI按局势评分选最优2个 |
| `showCourtCouncil(proposals)` | 玩家朝议弹窗（专用courtModal，680px宽） |
| `triggerCourtCouncil()` | 主入口：三势力统一处理 |

### 常量

| 常量 | 说明 |
|------|------|
| `COURT_PROPOSALS_MIL[4]` | 武官提案池 |
| `COURT_PROPOSALS_CIV[4]` | 文官提案池 |

### UI改动

| 位置 | 改动 |
|------|------|
| 朝议弹窗 | 专用 `#courtModal` 元素（680px宽，z-index:460），`querySelectorAll`+`addEventListener`绑定事件 |
| 派系Tab | 新增"朝议令"区块，显示当前生效decree（名称+提案人+剩余旬数） |
| 城市Tab建筑列表 | 军事建筑旁显示朝议金钱折扣标签（💰-30%） |

### nextTurn集成

```
...
processGentry()
aiConsiderEnthrone()
...
checkIntimacyThresholds()
★ triggerCourtCouncil()   ← G.turn%9===1时触发
...
// 弹窗优先级链（从高到低）：
// 围城到达 > 战报 > 求和 > 附庸 > ★朝议
```

快进模式下玩家朝议自动用 `_aiCourtSelect` 选择。

### 不改的

- `calcPostBuffs` 函数本身不变（decree buff在缓存阶段合并）
- `processFactionLoyalty` 每旬逻辑不变
- `triggerFactionEvent` 不变（朝议直接写genFactionMod，不经过事件系统）
- 官职任命/卸任逻辑不变
- 太守系统不变

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v105.html |
| 总行数 | ~19283 行 |

### 待办事项（下轮）

**优先级2 — 应做**：
1. **君主继任→AI性格切换**：`succeedRuler`已实装(v78)，但继任后`AI_PERSONALITY`不变。设计方向：基于继任者com/pol/cha自动生成atkThreshold/siegeThreshold/diploWeight，不硬编码每个继任者
2. 武将技能实装（73将，107处"待实装"）
3. AI伏击/扎营（aiExecuteOrders扩展）
4. 反伏击机制（斥候/INT识破）

**优先级3 — 系统完整性**：
5. E1 水战系统
6. E2 地域特色兵种
7. E3 科技树

**技术债**：
8. 地图裁剪
9. gx/gy → hq/hr 坐标统一
10. AI平衡性调参

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ v104 |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 **I3朝议✅v105** |

### v105 下轮首要：测试朝议系统

朝议系统刚实装，尚未经过完整游戏内测试。下轮新对话请优先做以下验证：

1. **基础触发**：推进到第10旬（首个季度末），确认朝议弹窗弹出（前提：已有tier1/2官职在任——默认开局预填了，应该有）
2. **卡片交互**：点击卡片能选中（金色边框+✓），再点取消，选满2个后"批准"按钮可点
3. **buff生效**：批准后检查派系Tab"朝议令"区块是否显示，以及实际buff是否影响经济/征兵等
4. **派系mod**：批准后检查被采纳/否决提案人所属派系成员的genFactionMod变化
5. **过期清除**：推进9旬后decree自动消失
6. **快进兼容**：快进10+旬不崩溃
7. **AI势力**：AI是否也在生成decree（日志里应有AI的"📜 朝议通过"）
8. **边界**：卸任所有tier1/2官职后下个季度应无朝议

如发现按钮仍不可点击，检查浏览器控制台是否有JS报错。`courtModal`（专用弹窗，680px宽）的事件绑定使用 `querySelectorAll('.court-card')` + `addEventListener`，不使用inline onclick。

---

## v105 朝议系统 Debug

### Audit方法

对朝议系统全部代码（triggerCourtCouncil / showCourtCouncil / _generateCourtProposals / _applyCourtDecisions / _aiCourtSelect / getCourtDecreeBuffs / _expireCourtDecrees）及其与 processFacEconomy / processCityFood / processMorale / nextTurn弹窗链 的集成点进行完整审读。

### 修复内容（5处）

| # | Bug | 严重度 | 位置 | 修复前 | 修复后 |
|---|-----|--------|------|--------|--------|
| 1 | goldProd朝议buff永久失效 | 🔴CRITICAL | `processFacEconomy`~行4535 | decree buff在`goldWithBuff`计算之后才合并，兴商令对金币收入完全无效 | 将decree合并移到`goldWithBuff`计算之前 |
| 2 | 战报/外交同旬朝议弹窗丢失 | 🟡MEDIUM | nextTurn弹窗链 + closeBattleModal + playerDisposePrisoner + acceptPeaceOffer等 | 有战报/求和/附庸弹窗时`_pendingCourtCouncil`不被消费，链结束后无检查 | 新增`_checkPendingCourtAfterPopup()`工具函数，在战报→俘虏→求和→附庸链末尾统一检查；nextTurn用`_hasPopupQueued`标志防止court与peace/vassal同时setTimeout |
| 3 | 派系Tab buff汇总不含朝议 | 🟡MEDIUM | `renderPostTab`~行10181 | `calcPostBuffs(fid)`只含官职buff | 叠加`getCourtDecreeBuffs(fid)`后再显示 |
| 4 | foodProd/morale首旬延迟 | 🟢LOW | nextTurn城市循环前~行8818 | `processCityFood`/`processMorale`在`processFacEconomy`之前运行，读的是上一旬`_postBuffs` | 在城市循环前预计算`_postBuffs`（含decree），确保首旬即生效 |
| 5 | autoPass无关闭按钮 | 🟢LOW | `showCourtCouncil`~行3866 | 仅1提案时弹窗强制玩家手动点批准 | autoPass时跳过弹窗，直接应用+日志通知 |

### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `_checkPendingCourtAfterPopup()` | ~3956 | 弹窗链尾端检查——前序弹窗关闭后，若有待处理朝议则弹出 |

### 弹窗优先级链（修复后完整路径）

```
nextTurn
  ├→ 围城到达 → return（由_siegeArrivalChoice触发后续）
  ├→ 战斗确认 → 战报 → 俘虏 → ★朝议
  ├→ 求和 → ★朝议
  ├→ 附庸 → ★朝议
  └→ ★朝议（无前序弹窗时直接弹出）
```

### Audit确认无误的部分

- `getCourtDecreeBuffs` 过滤逻辑 ✅
- `_expireCourtDecrees` 清除逻辑 ✅
- `_aiCourtSelect` 评分逻辑 ✅
- 提案去重（usedMil/usedCiv Set） ✅
- 派系mod写入（genFactionMod范围clamp[-20,+20]） ✅
- 快进模式处理 ✅
- `getFacPosts` 已过滤不存在的武将 ✅
- `milBuildCost` / `recruitWild` 直接读 `getCourtDecreeBuffs`，无时序问题 ✅
- 事件监听无泄漏（innerHTML替换销毁旧节点） ✅

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v105.html |
| 总行数 | ~19326 行 |

### 下轮测试重点

朝议debug完成，建议下轮验证：
1. 推进到第10旬，确认朝议弹窗正常弹出（≥2提案时需选择，1提案自动通过仅日志）
2. 选择"兴商令"后检查金币收入是否实际增加（Bug #1核心验证）
3. 在季度首旬同时有战斗发生时，战报关闭后朝议是否正确弹出（Bug #2核心验证）
4. 派系Tab → 官职Tab的"势力加成汇总"是否反映朝议buff（Bug #3验证）
5. 快进10+旬不崩溃

---

## v105 AI伏击/扎营（防守姿态决策）

### 设计概要

防守部队到达目标城附近后，不再无脑garrison，而是根据战力对比自动选择最优防守姿态：

1. **halt**（野战胜率 ≥ atkThreshold）→ 正面能打，等敌人来
2. **ambush**（中伏概率≥40% 且 期望胜率≥50%）→ 正面打不过，伏击打得过
3. **camp**（都不行，有资源）→ 扎营获防御加成等援军
4. **halt**（兜底）→ 连扎营资源都没有，硬扛

### 伏击决策公式

```
中伏概率 = clamp(AMBUSH_BASE_CHANCE[terrain] + (myINT - enemyINT)×0.008, capLow, capHigh)
         + 诸葛亮己方+15% / 敌方-10%

伏击胜率：蒙特卡洛模拟（敌方ATK/DEF×0.65后重新跑roll对比，30次采样）

期望收益 = 中伏概率 × 伏击胜率

触发条件：中伏概率 ≥ 35% AND 期望收益 ≥ 40%
```

### 伏击选点逻辑

- 从敌方当前位置→防守城市做A*寻路
- 在路径前8格（约2旬行军）中找地形最优的hex
- 优先级：forest(3) > hill(2) > mountain(1)
- 排除：有友军占据、敌方城市hex、plain/water等不适合地形
- 找不到合适地形 → 放弃伏击，走camp/halt

### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `_aiChooseDefensePosture(unit, fid, threatEnemies)` | ~5948 | 防守姿态决策主函数，返回'halt'/'camp'/`{type:'ambush', hex}` |
| `_aiFindAmbushHex(unit, enemyUnit, targetCityId, fid)` | ~6010 | 沿敌方→城市路径找最佳伏击地形hex |

### 修改位置

| 位置 | 改动 |
|------|------|
| `aiExecuteOrders` 2b defend到达（~行6661） | 从"直接garrison"改为调用`_aiChooseDefensePosture`，根据返回值设ambush/camp/garrison |
| `processUnitMovement` hexPath耗尽（~行12484） | 新增`_aiAmbushTarget`检测——AI部队到达伏击目标hex后自动设伏 |
| `aiDefendResponse` Step0 威胁消失清理（~行6081） | 扩展：ambush→halt，camp→发起拔营，清除`_aiAmbushTarget` |

### 新增数据字段

| 字段 | 说明 |
|------|------|
| `unit._aiAmbushTarget` | `{col, row}` 伏击目标hex，行军到达后自动设伏 |

### 不改的

- 伏击触发/战斗逻辑（resolveAmbush等）不变
- 扎营机制（camp状态、CAMP_COST、防御加成DEF×1.10）不变
- 玩家侧伏击/扎营操作不变
- 进攻部队行为不变（仅defend部队触发姿态评估）

### 压力测试结果

100旬快进：0 errors。AI正常使用camp（11次日志事件），伏击作为高风险选项仅在特定条件满足时触发（需要：单兵劣势+路径上有forest/hill+中伏率≥35%+期望收益≥40%）。

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v105.html |
| 总行数 | ~19564 行 |

### 待办事项（下轮）

**优先级2 — 应做**：
1. **君主继任→AI性格切换**：`succeedRuler`已实装(v78)，但继任后`AI_PERSONALITY`不变。设计方向：基于继任者com/pol/cha自动生成atkThreshold/siegeThreshold/diploWeight，不硬编码每个继任者
2. 武将技能实装（73将，107处"待实装"）
3. 反伏击机制（斥候/INT识破）

**优先级3 — 系统完整性**：
4. E1 水战系统
5. E2 地域特色兵种
6. E3 科技树

**技术债**：
7. 地图裁剪
8. gx/gy → hq/hr 坐标统一
9. AI平衡性调参

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ **伏击/扎营✅v105** |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 I3朝议✅v105 |

---

## v105 武将技能实装

### 新实装技能（4个）

| 武将 | 技能 | 效果 | 作用域 | 挂载点 |
|------|------|------|--------|--------|
| 刘备 | 仁德 | 撤退阈值0.35→0.50、部队中武将被俘率-15% | 刘备所在部队 | `calcRetreatResult` + `collectPrisoners` |
| 马超 | 锦马 | 主将马超且cavalry时ATK+12% | 马超为主将的部队 | `calcUnitATK` |
| 荀彧 | 王佐 | 全城豪族gentry回复+0.3/旬 | 势力级 | `processGentry` |
| 曹仁 | 坚守 | garrison/camp状态时DEF+15% | 曹仁为主将的部队 | `calcUnitDEF` |

### Desc标记修正（4个）

| 武将 | 技能 | 修正 |
|------|------|------|
| 张辽 | 威风 | 待实装→已实装（敌方兵力≥己方2倍时己方士气+20），删除勇冠 |
| 张飞 | 喝阵 | 待实装→已实装（接战前敌方士气-15），删除莫当/长坂 |
| 关羽 | 武圣 | desc已标记已实装（单挑score+10、触发率+15%）——确认无误 |
| 诸葛亮 | 神算+木牛 | 已整理（神算±10%、木牛调粮），删除尽瘁/空城 |

### 已实装技能总览

| 武将 | 技能 | 效果 |
|------|------|------|
| 诸葛亮 | 神算 | 伏击/火攻±10% |
| 诸葛亮 | 木牛 | 调粮损耗减半+速度-1旬 |
| 关羽 | 武圣 | 单挑score+10、触发率+15% |
| 张飞 | 喝阵 | 接战前敌方士气-15 |
| 张辽 | 威风 | 人数劣势2倍时己方士气+20 |
| 刘备 | 仁德 | 撤退阈值放宽+被俘率-15% |
| 马超 | 锦马 | cavalry主将ATK+12% |
| 荀彧 | 王佐 | 全城gentry+0.3/旬 |
| 曹仁 | 坚守 | 守城/营寨DEF+15% |
| 张郃 | 巧变 | 山地/丘陵地形战力加成（已有代码） |

### 待实装技能数：96处（从105降至96）

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v105.html |
| 总行数 | ~19572 行 |

### v105 追加：武将技能第二批实装（9个）

| 武将 | 技能 | 效果 | 范围 | 挂载点 |
|------|------|------|------|--------|
| 于禁 | 治军 | 战前己方全体士气+5 | 参战己方 | `resolveBattle`战前效果区 |
| 司马懿 | 冢虎 | 被攻击时DEF+15% | 司马懿为主将部队 | `calcUnitDEF`+`_isDefenderThisBattle`标记 |
| 夏侯渊 | 虎步 | AP+2、DEF-10% | 夏侯渊为主将部队 | `calcUnitAP`+`calcUnitDEF` |
| 赵云 | 取将 | 被动单挑触发率+15%、score+15、同队被俘率-20% | 赵云所在部队 | `tryPassiveDuel`+`resolveDuel`+`collectPrisoners` |
| 黄忠 | 老当 | 每年ATK/DEF+1%（上限+10%） | 黄忠为主将部队 | `calcUnitATK`+`calcUnitDEF`读`G.year` |
| 王平 | 险守 | 山地/丘陵/森林地形DEF+5% | 王平所在部队 | `calcUnitDEF` |
| 周瑜 | 赤壁 | 火攻成功率+20%、伤害×1.3 | 周瑜在攻方 | `calcFireRate`+`applyFireEffect` |
| 徐晃 | 长驱 | 行军路径>3格时AP+1 | 徐晃为主将部队 | `calcUnitAP` |
| 许褚 | 虎痴 | 单挑score+20 | 许褚参与单挑 | `resolveDuel` |

### 已实装技能总览（20个）

| 武将 | 技能 | 效果 | 范围 |
|------|------|------|------|
| 诸葛亮 | 神算 | 伏击/火攻±10% | 势力级(需官职) |
| 诸葛亮 | 木牛 | 调粮损耗减半+速度-1旬 | 势力级(需官职) |
| 关羽 | 武圣 | 单挑score+10、触发率+15% | 关羽所在部队 |
| 张飞 | 喝阵 | 接战前敌方士气-15 | 参战敌方 |
| 张辽 | 威风 | 人数劣势2倍时己方士气+20 | 张辽所在部队 |
| 刘备 | 仁德 | 撤退阈值放宽+被俘率-15% | 刘备所在部队 |
| 马超 | 锦马 | cavalry主将ATK+12% | 马超为主将部队 |
| 荀彧 | 王佐 | 全城gentry+0.3/旬 | 势力级(需官职) |
| 曹仁 | 坚守 | garrison/camp时DEF+15% | 曹仁为主将部队 |
| 乐进 | 先登 | 攻城战攻方士气+18 | 参战攻方 |
| 张郃 | 巧变 | 不利地形惩罚减半 | 张郃所在部队 |
| 于禁 | 治军 | 战前己方士气+5 | 参战己方 |
| 司马懿 | 冢虎 | 被攻击时DEF+15% | 司马懿为主将部队 |
| 夏侯渊 | 虎步 | AP+2、DEF-10% | 夏侯渊为主将部队 |
| 赵云 | 取将 | 单挑触发+15%、score+15、被俘-20% | 赵云所在部队 |
| 黄忠 | 老当 | 每年ATK/DEF+1%(上限10%) | 黄忠为主将部队 |
| 王平 | 险守 | 险要地形DEF+5% | 王平所在部队 |
| 周瑜 | 赤壁 | 火攻成功率+20%、伤害×1.3 | 周瑜在攻方 |
| 徐晃 | 长驱 | 行军路径>3格时AP+1 | 徐晃为主将部队 |
| 许褚 | 虎痴 | 单挑score+20 | 许褚参与单挑 |

### 待实装技能数：85处

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v105.html |
| 总行数 | ~19619 行 |

---

## v106 gx/gy坐标统一 + 武将技能框架化 + 朝议验证

### 1. gx/gy → hq/hr 坐标统一（技术债Q6）

**背景**：`unit.gx/gy` 与 `unit.hq/hr` 完全冗余（handover Q6记录），两套坐标在不同代码路径中写入/读取，存在不同步风险。

**改动**：28处，分4类：

| 类型 | 数量 | 改法 |
|------|------|------|
| 初始化移除 | 4处 | `cityToGrid`/`createUnit`/rebel unit/`initUnits`不再产生gx/gy |
| 写入替换 | 9处 | `unit.gx=X` → `unit.hq=X` |
| fallback读简化 | 8处 | `unit.hq??unit.gx` → `unit.hq` |
| 纯gx读修正 | 7处 | `unit.gx`(无fallback) → `unit.hq`（**修正潜在bug**） |

**结果**：gx/gy残留=0，hq/hr引用139→145（净增来自原本只写gx的位置）。

**附带修复**：马超「锦马」技能检查 `.troopType`（不存在字段），应为 `.type`。此bug导致锦马ATK+12%从未生效，v106已修正。

### 2. 武将技能系统框架化

**设计**：双层架构

| 层级 | 机制 | 技能数 | 适用范围 |
|------|------|--------|---------|
| **Layer 1 注册表** | `SKILL_REGISTRY[]` + `applySkills(trigger, ctx)` | 10 | 纯数值乘数/加值，无副作用 |
| **Layer 2 原位标签** | `// SKILL_INLINE: <id>` 注释标记 | 14标签(10技能) | 有副作用/时序依赖（mutate士气、战后恢复等） |

**Layer 1 — SKILL_REGISTRY**

新增数据结构（~行12368）：
```js
const SKILL_REGISTRY = [
  { id, gen, name, trigger, condition(ctx){...}, effect(ctx){...} },
  ...
];
function applySkills(trigger, ctx) → {flatATK, multATK, flatDEF, multDEF, flatAP, multAP, flatGentry}
```

叠加规则：`最终值 = (base + Σ flat) × Π mult`，先加后乘，顺序无关。

trigger枚举：`onCalcATK` / `onCalcDEF` / `onCalcAP` / `onGentry`

注册表技能清单：

| id | 武将 | trigger | 效果 |
|----|------|---------|------|
| jinma | 马超 | onCalcATK | cavalry主将ATK×1.12 |
| laodang_atk | 黄忠 | onCalcATK | 主将ATK×(1+year%) |
| jianshou | 曹仁 | onCalcDEF | garrison/camp时DEF×1.15 |
| zhonghu | 司马懿 | onCalcDEF | 被攻击时DEF×1.15 |
| hubu_def | 夏侯渊 | onCalcDEF | DEF×0.90 |
| laodang_def | 黄忠 | onCalcDEF | 主将DEF×(1+year%) |
| xianshou | 王平 | onCalcDEF | mountain/hill/forest时DEF×1.05 |
| hubu_ap | 夏侯渊 | onCalcAP | AP+2 |
| changqu | 徐晃 | onCalcAP | hexPath>3时AP+1 |
| wangzuo | 荀彧 | onGentry | gentry+0.3/旬 |

**Layer 2 — SKILL_INLINE 标签**

| 标签ID | 武将/技能 | 位置 | 不走注册表原因 |
|--------|---------|------|---------------|
| hezhen | 张飞喝阵 | resolveBattle | 直接mutate敌方士气 |
| zhijun | 于禁治军 | resolveBattle | 直接mutate己方士气 |
| weifeng | 张辽威风 | resolveBattle | 临时mutate+战后恢复 |
| xiandeng | 乐进先登 | resolveSiegeBattle | 临时mutate+战后恢复 |
| duel_score | 关羽/赵云/许褚 | resolveDuel | 双向score加减 |
| duel_trigger | 关羽/赵云 | tryPassiveDuel | 触发率改概率 |
| capture_rate | 刘备/赵云 | collectPrisoners | 被俘率改概率 |
| rende_retreat | 刘备 | calcRetreatResult | 撤退阈值判定 |
| chibi_rate | 周瑜 | calcFireRate | 火攻成功率 |
| chibi_damage | 周瑜 | applyFireEffect | 火攻伤害乘数 |
| shensuan_ambush | 诸葛亮 | resolveAmbush | 伏击中伏率 |
| shensuan_nightraid | 诸葛亮 | calcNightRaidChance | 劫营成功率 |
| shensuan_ai_defense | 诸葛亮 | _aiChooseDefensePosture | AI防守伏击决策 |
| muniu | 诸葛亮 | transferFood | 调粮损耗+速度 |

**改造的函数**：

| 函数 | 改动 |
|------|------|
| `calcUnitAP` | 移除夏侯渊/徐晃硬编码 → `applySkills('onCalcAP', {unit})` |
| `calcUnitATK` | 移除马超/黄忠硬编码 → `applySkills('onCalcATK', {unit})` |
| `calcUnitDEF` | 移除曹仁/司马懿/夏侯渊/黄忠/王平硬编码 → `applySkills('onCalcDEF', {unit, terrain})` |
| `processGentry` | 移除荀彧硬编码 → `applySkills('onGentry', {fac})` |

**后续新增技能的流程**：
- 纯数值类（改ATK/DEF/AP/gentry等）→ 往 `SKILL_REGISTRY` 填一条，不改任何函数
- 副作用类（mutate士气/改概率/临时加减）→ 在对应函数原位写代码，加 `SKILL_INLINE:` 标签

### 3. 朝议系统验证

自动化测试覆盖结果：

| 测试项 | 结果 |
|--------|------|
| 6个核心函数存在 | ✅ |
| 提案生成（5 posts → 4 proposals） | ✅ |
| buff值精确（goldProd=0.12） | ✅ |
| buff叠加（0.12+0.08=0.20） | ✅ |
| decree过期清除 | ✅ |
| 20x快速触发无crash | ✅ |
| 无posts势力=0提案 | ✅ |
| AI选择/apply/buff生效 | ⏭ 需浏览器运行时 |

**下轮浏览器验证**：推进到第10旬，确认朝议弹窗弹出、选择后buff生效（特别是兴商令影响金币收入）。

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v107.html |
| 总行数 | ~19732 行 |

### 待办事项（下轮）

**优先级1 — 应做**：
1. **朝议浏览器验证**：第10旬弹窗+buff生效+战报冲突测试
2. **君主继任→AI性格动态切换**
3. **AI平衡性调参**（跑局观察）

**优先级2 — 技能批量实装**：
4. 武将技能批量实装（85处待实装，现在有框架，纯数值类只需填表）

**优先级3 — 系统完整性**：
5. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
6. ~~gx/gy → hq/hr 坐标统一~~ ✅ v106已完成
7. 地图裁剪
8. AI平衡性调参

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅v105 |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 I3朝议✅v105 |
| J 技能框架 | ✅ **v106 SKILL_REGISTRY + SKILL_INLINE 双层架构 + 战报技能行** |

---

### v106 追加：战报技能触发显示

**需求**：武将技能触发时在战报中显示描述行，让玩家直观看到技能效果。

**实现**：

数据管道：
- `resolveBattle` 内收集 `_skillLogs[]`（战前士气技能 + Layer 1 ATK/DEF技能），去重后放入返回值 `skillLogs`
- `resolveAmbush` 内收集 `_ambSkillLogs[]`（诸葛亮神算），放入返回值
- `resolveDuel` 内收集 `_duelSkills[]`（关羽/赵云/许褚 score加分），放入返回值 `duelSkills`
- `resolveSiegeBattle` 注入乐进先登后透传 `battleReport.skillLogs`
- `resolveCampBattle` 透传 `battleReport.skillLogs`

渲染：
- `showNextBattleReport` 中，在连携行之后渲染 `r.skillLogs`，紫色高亮行
- `duelBlockHtml` 中，在叙事文段下方渲染 `duel.duelSkills`，9px紫色字

**覆盖的所有战报类型**：

| 战报类型 | skillLogs来源 |
|---------|--------------|
| 野战 (field) | resolveBattle直接产出 |
| 伏击战 (ambush) | resolveAmbush产出 |
| 攻城战 (siege) | resolveBattle→resolveSiegeBattle透传 + 乐进注入 |
| 营寨战-劫营 (camp/raid) | resolveBattle→resolveCampBattle透传 |
| 营寨战-强攻 (camp/assault) | resolveBattle→resolveCampBattle透传 |

**战报中可能出现的技能行**：

| 图标 | 触发时机 | 技能 |
|------|---------|------|
| 🗣 | 战前 | 张飞「喝阵」敌方士气-15 |
| 🛡 | 战前 | 于禁「治军」己方士气+5 |
| 🦁 | 战前 | 张辽「威风」以少敌多，士气+20 |
| 🪜 | 攻城 | 乐进「先登」攻城士气+18 |
| 🧠 | 伏击 | 诸葛亮「神算」中伏率±10% |
| ⚔ | 战力 | 马超/曹仁/司马懿/夏侯渊/黄忠/王平 ATK/DEF% |
| ⚔ | 单挑 | 关羽/赵云/许褚 战力+N（显示在单挑段落内） |

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v107.html |
| 总行数 | ~19732 行 |

### v106 追加：单城金产弹窗修复

**问题**：单城金产详情弹窗（点击城池Tab金产数字弹出）显示了全势力的城防军饷、野战军饷、官职俸禄——玩家容易误以为每座城都被扣了一遍全势力俸禄。

**修复**：
- 移除全势力城防军饷、野战军饷、官职俸禄的显示
- 只保留本城城防军饷（`city.garrison × GAR_SALARY_RATE`）
- 标题改为"本城金产·计算链"
- 底部加引导："军饷/俸禄等势力级支出见统计Tab"
- 统计Tab原有的势力级支出明细不变（已包含全部军饷+俸禄+净金产）

### 下轮测试重点

1. **框架稳定性**：开局后快进20-50旬，观察是否有JS报错或崩溃
2. **朝议系统浏览器验证**：推进到第10旬，确认弹窗弹出→选择→buff生效→过期清除
3. **战报技能行**：触发有技能武将参与的战斗，确认战报中出现紫色技能描述行
4. **马超锦马修复验证**：马超带cavalry部队，ATK应比同等级其他cavalry高约12%
5. **单城金产弹窗**：点击城池金产，确认只显示本城数据，不再显示全势力俸禄
6. **gx/gy清除验证**：部队移动、战斗、撤退等操作正常（坐标不出错）

### 待办事项（下轮）

**优先级1 — 应做**：
1. 朝议浏览器验证（第10旬弹窗+buff生效+战报冲突）
2. AI平衡性调参（跑局观察）
3. 君主继任→AI性格动态切换

**优先级2 — 技能扩展**：
4. 武将技能批量实装（85处待实装，纯数值类只需填SKILL_REGISTRY表）
5. 非战斗技能的UI体现统一梳理（战斗力弹窗显示技能buff、城池Tab显示势力级技能等）

**优先级3 — 系统完整性**：
6. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
7. ~~gx/gy → hq/hr 坐标统一~~ ✅ v106
8. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅v105 |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 I3朝议✅v105 |
| J 技能框架 | ✅ **v106 SKILL_REGISTRY + SKILL_INLINE + 战报技能行 + 金产弹窗修复** |
| K 经济再平衡 | ✅ **v107 人口×5 + 征兵惩罚 + 豪族→民心 + 粮产下调** |

---

## v107 经济再平衡

### 背景与问题诊断

经济系统全链路审计发现以下结构性问题：

1. **征兵→民心/人口质量的反馈链断裂**：征兵只扣金+粮，不影响城市民心和人口质量。processMorale无征兵/兵民比因子，processPop的garRatio惩罚只看garrison（野战unit不计入）。30旬暴力征兵25k兵，民心从65涨到77、质量从80涨到83——不降反升。
2. **粮食永远不是瓶颈**：魏粮食盈余6747/旬，理论承载67万行军兵，而金钱只够养11.4万。粮/金承载比6~20倍，农田/水利建筑ROI趋近无穷。
3. **豪族支持与民心完全孤立**：processMorale无gentry引用，processGentry无morale引用。
4. **游戏人口数值偏低**：游戏pop（85k许昌）vs史实辖区人口（颍川郡50万），差约×5.7倍。城市代表的是郡级行政区，pop应反映辖区总人口。

### 改动清单（6大项）

#### 1. 城市人口×5（45城 + 8城微调）

所有城市pop统一×5，使数值接近史实辖区人口量级。8座城市额外微调后再×5：

| 城市 | 旧pop | 微调目标 | ×5后 | 理由 |
|------|-------|---------|------|------|
| 南阳 | 50k | 60k | 300k | 东汉第一大郡，应与徐州平级 |
| 邺城 | 68k | 80k | 400k | 曹丕实际都城，应接近许昌 |
| 洛阳 | 72k | 65k | 325k | 董卓焚毁后重建中 |
| 长安 | 60k | 55k | 275k | 关中经战乱凋敝 |
| 柴桑 | 45k | 38k | 190k | 军事前线基地，非经济中心 |
| 会稽 | 48k | 42k | 210k | 偏远，不应超武昌 |
| 交州 | 20k | 15k | 75k | 极南蛮荒 |
| 建宁 | 15k | 12k | 60k | 南中，诸葛亮南征前几无汉民 |

**调整后势力总人口**：魏4415k(441万) / 蜀1890k(189万) / 吴2430k(243万) = 总计873万（接近史实户籍767万）

#### 2. 15处公式常数÷5（保持行为等价）

| # | 公式 | 旧值 | 新值 | 验证 |
|---|------|------|------|------|
| 1 | popMult分母 | 50000 | 250000 | 许昌425k×0.8/250k=1.36 ✅ |
| 2 | 民用粮耗率 | 0.002 | 0.0004 | 425k×0.0004=170 ✅ |
| 3 | 城防上限 | 5%/6% | 1%/1.2% | 425k×1%=4250 ✅ |
| 4 | 城防补员率 | 0.004 | 0.0008 | 425k×0.0008=340 ✅ |
| 5 | 人口增长r | 0.0015 | **不改** | 自然规律不随人口基数变，rate不变+cap×5=logistic比例天然一致 |
| 6 | 饥荒流失率 | 0.001 | **不改** | 自然规律，绝对流失量自然×5合理 |
| 7 | 战乱流失率 | 0.002 | **不改** | 同上 |
| 8 | 叛军规模 | 2~4% | 0.4~0.8% | 425k×0.004~0.008=1700~3400 ✅ |
| 9 | initStorage | pop×0.002×20 | pop×0.0004×20 | 425k×0.0004×20=3400 ✅ |
| 10 | 建筑队列阈值 | 100k/50k/20k | 500k/250k/100k | 425k≥250k→3队列 ✅ |
| 11 | AI城市价值 | pop/10000 | pop/50000 | 等价 ✅ |
| 12 | 就地补员基准 | 40000 | 200000 | 等价 ✅ |
| 13 | 后方补员基准 | 500000 | 2500000 | 等价 ✅ |
| 14 | AI征兵加分 | 50000 | 250000 | 等价 ✅ |
| 15 | 人口上限 | 都市120k/普通60k | 600k/300k | ×平原/山地/水乡照旧 ✅ |

**附加修复**（审计发现的遗漏）：

| # | 位置 | 旧值 | 新值 | 问题 |
|---|------|------|------|------|
| A | 叛乱·大乱阈值 | garRatio<0.01 | <0.002 | 不改则正常城防就触发大乱 |
| B | 叛乱·小乱阈值 | garRatio<0.03 | <0.006 | 同上 |
| C | processPop garRatio惩罚 | >0.15, ×0.5 | **已删除** | 城防是警察，不影响人口质量 |
| D | AI威胁评估 | pop/10000 | pop/50000 | 不改则价值暴增 |
| E | 隐匿户口下限 | Math.max(1000) | Math.max(25000) | 与全局下限一致 |
| F | 人口下限 | 5000 | 25000 | ×5 |
| G | UI粮耗文案 | "×0.002" | "×0.0004" | 显示修正 |

#### 3. 征兵即时惩罚（新增机制）

**公式**：每次征兵时，对征兵城市即时扣减：
```
qualPenalty  = (征兵人数 / 城市人口) × 30
moralePenalty = (征兵人数 / 城市人口) × 30
```

**物理含义**：抽走青壮劳力→人口质量下降+民众不满。

**实装位置**：玩家征兵函数（~行17853）+ AI征兵函数（~行7236），各3行代码。

**冲击数据**（pop×5后）：

| 城市 | pop | 征5k占比 | 质量惩罚 | 民心惩罚 | 评价 |
|------|-----|---------|---------|---------|------|
| 许昌 | 425k | 1.2% | -0.35 | -0.35 | 几乎无感 |
| 官渡 | 125k | 4.0% | -1.20 | -1.20 | 显著 |
| 建宁 | 60k | 8.3% | -2.50 | -2.50 | 严重但不致命 |

**反馈链**：征兵→民心↓(急性)+质量↓(慢性)→民心<60时质量恢复减速→民心<40时质量停止恢复→恶性循环。适度征兵可承受，暴力征兵会触发恶性循环。

#### 4. 豪族→民心（新增联动）

在`processMorale`中新增豪族支持因子（单向：豪族影响民心，民心不影响豪族）：

| 豪族支持度 | 标签 | 民心影响 |
|-----------|------|---------|
| ≥80 | 拥戴 | +0.3/旬 |
| ≥60 | 支持 | +0.1/旬 |
| ≥40 | 中立 | 0 |
| ≥20 | 不满 | -0.3/旬 |
| <20 | 抗拒 | -0.6/旬 |

**物理含义**：豪族掌握地方资源和人脉，拥戴时治理通顺民心高，抗拒时阳奉阴违民心低。

#### 5. 粮产全局下调×0.50

在`getCityProd`的food计算末尾乘以0.50。

**效果**：粮食从"永远盈余"变为"需要经营"。农田/水利建筑终于有存在价值。港口城（高金低粮）的trade-off体现出来。

#### 6. UI文案修正

粮食消耗弹窗中民用粮耗率文案从"×0.002"更新为"×0.0004"。

### 三系统联动关系图（v107最终）

```
征兵行为 ──→ 民心↓（即时，M=30）
征兵行为 ──→ 人口质量↓（即时，K=30）
豪族支持 ──→ 民心（持续，+0.3~-0.6/旬，单向）
民心 ──→ 人口质量恢复速度（门槛：≥60正常，<40停滞）
人口质量 ──→ 经济产出（effPop=pop×quality/100）
人口质量 ──→ 新兵等级（≥80→Lv5, ≥70→Lv4, ...）
人口质量 ──→ 补员速度（localEffPop）
豪族支持 ──→ 金产乘数（0.75~1.15）
豪族支持 ──→ 征兵成本乘数（0.85~1.30）
粮食 ──→ 民心（可撑旬数影响民心±0.3~-1.5/旬）
```

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v107.html |
| 总行数 | ~19732 行 |
| 总人口 | 873万（魏441万/蜀189万/吴243万） |
| 人口量级 | 辖区人口（≈史实×1.0~1.5） |

### 下轮测试重点

1. **浏览器运行验证**：开局不崩溃，人口数字显示正常
2. **征兵惩罚体感**：征兵后观察城市民心和质量是否有可见下降
3. **粮食平衡**：非平原城市是否会缺粮，农田建筑是否被AI优先建造
4. **豪族→民心联动**：豪族低支持城市的民心是否持续下降
5. **快进稳定性**：快进20-50旬无崩溃

### 待办事项（下轮）

**优先级1 — 验证与调参**：
1. 浏览器验证v107经济再平衡效果
2. AI平衡性调参（跑局观察经济节奏）
3. 确认征兵惩罚K=30/M=30的体感是否合适

**优先级2 — 应做**：
4. 君主继任→AI性格动态切换
5. confirmBattle补try-catch防护

**优先级3 — 技能扩展**：
6. 武将技能批量实装（85处待实装，纯数值类只需填SKILL_REGISTRY表）

**优先级4 — 系统完整性**：
7. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
8. ~~gx/gy → hq/hr 坐标统一~~ ✅ v106
9. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅v105 |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 I3朝议✅v105 |
| J 技能框架 | ✅ v106 SKILL_REGISTRY + SKILL_INLINE + 战报技能行 + 金产弹窗修复 |
| K 经济再平衡 | ✅ **v107 人口×5辖区化 + 征兵惩罚K30/M30 + 豪族→民心 + 粮产×0.50** |

---

## v108 经济→军事再平衡 + UI补全

### 背景

v107实装了经济再平衡（人口×5、征兵惩罚、豪族→民心、粮产×0.50），v108基于浏览器实测和全链路数学审计，修复以下问题：

1. **征兵初始耗粮不合理**：新兵还没吃饭就扣了粮，持续军粮压力已由processUnitFood覆盖
2. **征兵惩罚弹窗缺失**：惩罚已生效但玩家无处看到预估
3. **军饷率偏高**：0.0096导致金瓶颈过紧，60旬实际在野兵民比仅2.6%，低于三国史实4-5%
4. **民心恢复过快/质量恢复过慢**：太守pol/200让典型城市民心+0.85/旬（征5k于小城3旬即恢复），质量仅+0.10/旬（恢复需25旬），两者差距8.5倍不合理
5. **民心弹窗逻辑过时**：使用全局bestPol而非城市prefect，缺少豪族/朝议因子
6. **质量弹窗不存在**：质量数字虽有onclick但handler缺失
7. **新征部队当回合可动**：mobilizingTurns=0，违背整备常识
8. **AI征兵选城**：高威胁时不考虑城市人口大小，小城频繁征兵质量崩溃

### 改动清单（9项）

#### ① 移除征兵粮食初始消耗

**物理逻辑**：征兵=招募动员，只需金钱（安家费/装备费）+ 材料（铁/木/马），粮食是持续消耗而非一次性买单。

**改动位置**：
- `renderRecruitModal`：删除`costFood`变量和粮食显示行
- `confirmRecruit`：删除`costFood`扣减、粮食不足检查、粮食告警
- `aiDoRecruit`：删除`costFood`计算和检查

**保留**：手动补员（`confirmReinforce`）仍消耗粮食（补员是把人编入部队并喂饱，与初始征兵不同）

#### ② 征兵弹窗增加惩罚预估

征兵弹窗费用栏下方新增一行：
```
📉 民力影响：质量-X.XX · 民心-X.XX [✓轻微 / ⚠过重]
```
颜色分级：绿色(<0.5) / 橙色(0.5~1.5) / 红色(>1.5)

公式：`penalty = (totalTroops / city.pop) × 30`

#### ③ 军饷率 0.0096→0.008

**史实论证**：
- 三国兵民比（按实际人口）：曹魏5.0%、蜀汉4.1%、东吴4.6%
- 游戏pop定位为辖区实际人口，应对标4-5%
- 考虑实际在野部队仅为理论最大值的70%（战损/补员/轮换）

**动态均衡曲线（0.008）**：

| 阶段 | 理论养兵 | 部队数 | 实际兵民比 |
|------|---------|--------|-----------|
| 开局 | 11.8万 | ~10支 | 1.9% |
| 30旬 | 16.4万 | ~14支 | 2.5% |
| 60旬 | 21.5万 | ~18支 | 3.3% |
| 120旬 | 28.5万 | ~24支 | 4.2% |

玩家可选大编制（15k/支）减少操控单位数。

**改动位置**：`getUnitSalaryRate`函数、AI预算计算、统计Tab文案

#### ④ 民心恢复减速

太守民心加成：`pol/200`→`pol/400`

| 太守政治 | 旧加成/旬 | 新加成/旬 |
|---------|----------|----------|
| pol=60 | +0.30 | +0.15 |
| pol=70 | +0.35 | +0.175 |
| pol=90 | +0.45 | +0.225 |

典型好城总恢复：0.85→0.55/旬。征5k于建宁(60k)民心惩罚-2.5，恢复从3旬延长到5旬。

#### ⑤ 质量恢复加速

基础qd：0.06→0.10（+0.04如morale>=60，+school加成不变）

典型好城质量恢复：0.10→0.14/旬（含morale≥60奖励）。质量降2.5恢复从25旬缩短到18旬。

**恢复速度比**：民心0.55 vs 质量0.14 = 3.9倍（旧版8.5倍→合理化）。民怨消散较快，人口素质恢复较慢，符合"治标容易治本难"的现实逻辑。

#### ⑥ 民心弹窗修复

`showBreakdown(e,'morale',cityId)` 完全重写：
- 太守：使用`city.prefect`而非全局bestPol，显示太守名+政治值+出征减半
- 豪族→民心：显示豪族等级和对应影响值
- 朝议/官职buff：显示合并后的加成
- 本旬征兵：若`city._lastRecruitTurn === G.turn`，显示即时惩罚值

#### ⑦ 新增质量弹窗

`showBreakdown(e,'quality',cityId)` 新增：
- 基础恢复+0.10/旬
- 民心门槛：≥60加速、<40停滞
- 学堂等级加成
- 占领/战乱→归零
- 本旬征兵即时惩罚
- 满质量预估旬数

城池Tab中质量数字已有`onclick="showBreakdown(event,'quality','${city.id}')"`。

#### ⑧ AI征兵选城加pop权重

同等威胁方向下，优先在大城征兵（减少对小城质量的冲击）。排序逻辑改为：威胁方向 > 城市人口。

#### ⑨ 新征部队整备1旬

`createUnit`后设`unit.mobilizingTurns = 1`，玩家和AI同等适用。

已有UI支持：显示"⚙整备中·还需1旬"，按钮禁用，下旬`processMobilizing`自动倒计时清零。

新增：`unit._apRemaining = 0`确保整备期间AP=0；nextTurn的AP重置跳过mobilizing部队；地图AP badge显示"⚙整备"而非数字；征兵后不自动选中该部队。

#### ⑩ 新征部队无移动范围显示

选中mobilizing/billeted/camp/ambush/siege状态的部队时，不显示移动范围BFS高亮（`_canShowRange`检查）。

#### ⑪ Tooltip残留修复

**问题**：城市/部队hover tooltip(`_tip`)在鼠标快速移出或渲染刷新后残留不消失，影响操作。

**原因**：SVG元素的`onmouseleave="hideTip()"`在renderAll重建DOM时不触发。

**修复3处**：
- `renderAll()`开头加`hideTip()`
- `renderAllLight()`开头加`hideTip()`
- `<body onclick>`加`hideTip()`（点击任何地方清除残留）

### 经济全链路数据（v108最终）

**三势力均衡点（开局无建筑，popQuality=80，军饷率0.008）**：

| 势力 | 人口 | 粮盈余/旬 | 金产/旬 | 粮养驻兵 | 金养兵 | 兵民比瓶颈 |
|------|------|----------|--------|---------|--------|-----------|
| 魏 | 441万 | 1102 | 1324 | 22万 | 11.8万 | 金=2.7% |
| 蜀 | 189万 | 413 | 509 | 8.3万 | ~3.5万 | 金=1.9% |
| 吴 | 243万 | 316 | 820 | 6.3万 | ~7.3万 | 粮=2.6% |

**魏国发展曲线（含建筑/人口增长）**：

| 阶段 | 金养兵(0.008) | 部队数 | 兵民比 | 对标史实 |
|------|-------------|--------|--------|---------|
| 开局 | 11.8万 | ~10支 | 2.7% | 初创期 |
| 30旬 | 16.4万 | ~14支 | 3.6% | 接近蜀汉 |
| 60旬 | 21.5万 | ~18支 | 4.7% | 接近曹魏鼎盛 |
| 120旬 | 28.5万 | ~24支 | 5.9% | 统一战争 |

### 三系统联动关系图（v108更新）

```
征兵行为 ──→ 民心↓（即时，K=30）
征兵行为 ──→ 人口质量↓（即时，K=30）
征兵行为 ──→ 金钱↓（一次性安家费）
征兵行为 ──→ 整备1旬（不可即时出动）

民心恢复 ≈ 0.55/旬（太守pol/400 + 豪族 + 粮食 + 税率）
质量恢复 ≈ 0.14/旬（基础0.10 + morale≥60奖0.04 + 学堂）
恢复比 ≈ 4:1（民心快于质量，治标易治本难）

金钱约束 → 野战兵力天花板（0.008/兵/旬）
粮食约束 → 行军兵力天花板（0.010/兵/旬行军，0.005驻扎）
双约束中：魏/蜀金为瓶颈，吴粮为瓶颈
```

### 项目快照更新（v108时）

| 项目 | v108值 |
|------|--------|
| 文件名 | project_romance_v108.html |
| 总行数 | ~19796 行 |
| 军饷率 | 0.008/兵/旬（billeted×0.20） |
| 民心恢复 | ~0.55/旬（太守pol/400） |
| 质量恢复 | ~0.14/旬（基础0.10） |

### 下轮测试重点（v108时，已被v109覆盖）

见v109下轮测试重点。

---

## v109 已实装 — 经济再平衡Phase3（蜀国/补员/城防）

### 背景

v108经济系统headless模拟发现三个结构性问题：
1. 蜀国开局即赤字（4支部队6万兵军饷480金/旬，可用金仅122金/旬）
2. 补员太快且无成本（城内5旬满编，几乎免费回血，战争无持久消耗）
3. 城防太弱（6k名将一支就能轻松破medium城，不需要围城）

### 实装清单（9项）

#### A. 蜀国开局部队减兵力20%（已实装）

4支部队保持4支，每个squad的troops和maxTroops各减20%：
- 张飞6000→4800, 马忠5000→4000, 法正4000→3200（合计12000）
- 黄忠5000→4000, 王平5000→4000, 吴懿4000→3200（合计11200）
- 关羽7000→5600, 廖化5000→4000, 严颜4000→3200（合计12800）
- 赵云6000→4800, 张翼5000→4000, 霍峻4000→3200（合计12000）
- **总计 60000→48000**，军饷480→384金/旬

#### B. 蜀国经济提升——襄阳/永安去雄关（已实装）

- 襄阳：`['雄关','水乡']` → `['水乡']`
- 永安：`['山地','雄关']` → `['山地']`
- 汉中/上庸保留雄关不变

#### C. 山地金debuff（❌ 未实装，设计取消）

原计划给山地tag加`goldM:-0.15`，但测试发现v108代码中山地本来就没有金产惩罚（`goldM:0`，即×1.00），handover描述的"从0.70→0.85"是误判。加了反而让蜀国金产下降4.1%，与设计意图相反。经确认取消此改动，山地保持`goldM:0`。

#### D. 补员改为固定基准制（已实装）

**核心重写**`processReinforcement`：

旧：`recover = missing × rate`（按缺员比例，前快后慢）
新：`recover = BASE × popMult × inCityMult × policyMult × buff`（固定基准，不乘缺员数）

```
BASE = 500（每旬基准补充人数）

front(就地) = 500 × frontPopMult × inCityMult × pol.front
  · frontPopMult = clamp(0.5, 3.0, nearCity.pop / 150000)
  · inCityMult: 城中(0-1格)=1.5, 城辖(控制半径内)=1.0, 超出=不补员

rear(后方) = 500 × rearPopMult × 0.4 × pol.rear
  · rearPopMult = clamp(0.5, 2.0, totalFacPop / 2500000)

总补员 = max(500, front + rear)，cap到实际缺员数
```

控制半径：large 8格, medium 6格, small 4格（不变）。
等级加权平均（v108）保持不变。

**补员速度弹窗同步重写**：显示基准500、就地/后方分项、金消耗。

#### E. 补员金消耗（已实装）

每补1兵花**0.05金**。从势力金库扣。金库不足按剩余金额上限补。
**移除**原粮食消耗（0.1/兵 → 删除）。

#### F. 城防加成大幅提高（已实装）

`SIEGE_BASE_DEF_BONUS`：

| 规模 | 旧值 | 新值 | 新乘数(满城防时) |
|------|------|------|----------------|
| small | 0.15 | 1.50 | ×2.50 |
| medium | 0.25 | 2.00 | ×3.00 |
| large | 0.40 | 2.50 | ×3.50 |

`getSiegeDefMult`中fallback同步更新为2.00。

#### G. 城防level 1→3（已实装）

`resolveSiegeBattle`中虚拟garrison unit的level从1改为3（lv3 mult = 1.10）。

#### H. 城防兵力比例按规模分级（已实装）

`garrisonCap`重写：

| 规模 | 旧比例 | 新比例 |
|------|--------|--------|
| small | pop×1.0% | pop×1.8% |
| medium | pop×1.0% | pop×1.2% |
| large | pop×1.0% | pop×1.0% |
| 雄关 | 额外+0.2% | 额外+0.3% |

#### I. 城防补员率适配（已实装）

`processGarrisonRecovery`按规模分级：
- small: pop×0.15%
- medium: pop×0.10%
- large: pop×0.08%
- 保底50人/旬

### 附加修复

- 补员速度弹窗（`showBreakdown('reinforce',...)`）完全重写适配新公式
- `getSiegeDefMult` fallback值 0.25→2.00
- **`_triggerMajorRebellion` ReferenceError修复**：缺失 `const cityDef = CITY_MAP[city.id]`，导致叛乱触发时JS异常→快进卡死。一行修复。
- **快进卡死debug工具**：`nextTurn`内加了性能计时（每5旬输出各阶段耗时到console），`fastForwardTurns`加了每旬计时+10秒安全阀+每5旬yield事件循环。下轮定位后可移除。

### AI对峙超时机制（v109新增）

**问题**：v109城防提高后，AI部队到达敌城旁评估"打不过" → halt → 永远不进siege → 扎堆不动。

**方案**：两阶段递进

| 对峙旬数 | AI行为 | 原理 |
|---------|--------|------|
| 0-4旬 | 正常等待（现有逻辑） | 等援军集结 |
| 5-8旬 | 降低atkThreshold为×0.70 | 久围不下，被迫冒险 |
| 9旬+ | 释放部队（清除_aiTarget/_aiRole） | 认定目标打不动，下轮aiSelectTargets自动选更弱目标 |

**涉及函数**：
- `_aiTrySiege`：检查2/3的门槛读取 `_aiHaltTurn`，5旬+用降低后门槛
- `aiExecuteOrders`：鹰鸽判断同理降低门槛；对峙5旬+允许强行推进；9旬+释放部队
- `_aiHaltTurn`字段：记录开始对峙的旬数，进入siege或恢复行军时清除

### AI叛军城目标修复（v109新增）

**问题**：`aiFrontierEnemyCities` BFS不穿透敌城，被叛军城隔开的后方叛军城永远不会被AI发现。

**修复**：BFS结束后，额外从已发现的叛军城出发，穿透叛军城继续搜索，确保连片叛军城全部进入目标列表。

### 下轮测试重点

1. 蜀国开局金库消耗速度（应能撑约6旬不赤字）
2. 补员速度：许昌城中应约1000+/旬 vs 建宁500/旬（保底）
3. 补员金消耗：补5000人扣250金是否体感合理
4. 攻城：6k名将打medium城是否需要围城才能破（城防×3.00）
5. 城防兵力：small城应约pop×1.8%，medium约pop×1.2%
6. 对峙超时：5旬后是否开始变积极，9旬后是否换目标
7. ~~山地城金产~~（C项已取消）

### 待办事项（下轮）

**优先级1 — AI战略专项（本轮观察到的问题）**：
1. **AI进攻太保守**：城防×3.0后AI评估攻城胜率低→不敢围城。需要在`_aiEstimateSiegeWinRate`中纳入围城衰减预期（"围N旬后的胜率"而非"当前满城防胜率"），让AI做出"值得围"的判断
2. **魏国不攻蜀**：`aiSelectTargets`最多2目标，汉中(雄关+山地+驻军)分数低永远不被选中。需要让AI更均衡地在多方向施压，或增加目标上限
3. **吴国过强**：模拟中吴军表现强势，可能是港口金产+水乡地形组合让吴国经济/军事效率偏高。需观察确认
4. **蜀国后期崩盘**：48k兵打几仗就没钱了。设计预期蜀弱，但需确认是否"弱得合理"
5. **对峙死锁残余**：v109加了超时机制但双方mutual hesitation仍可能发生（攻方5旬降门槛，但守方没有对应机制）
6. **移除debug计时工具**：`nextTurn`性能计时、`fastForwardTurns`安全阀（确认稳定后移除）

**优先级2 — 应做**：
7. 君主继任→AI性格动态切换
8. confirmBattle补try-catch防护

**优先级3 — 技能扩展**：
9. 武将技能批量实装（85处待实装）

**优先级4 — 系统完整性**：
10. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
11. 地图裁剪

### AI战略问题详细记录（供下轮参考）

**截图场景1：合肥附近魏吴扎堆（70+旬）**
- 魏国曹操/牛金/张郃等多支部队 vs 吴国孙策/张辽/甘宁/吕蒙/孙权等
- 双方各有5-6支部队在寿春-合肥一线对峙
- 魏方有兵力优势但评估攻城胜率不够→不围城
- 吴方守住合肥→双方都不动
- v109超时机制应该让攻方5旬后变积极，但如果双方都是defend角色则无效

**截图场景2：300+旬长期模拟**
- 吴国整体表现强势（经济效率高？港口加成？）
- 蜀国后期经济崩溃（金产563 vs 军饷+补员消耗）
- 魏国20城但兵力分散，每个方向投入不够集中
- AI从不进攻叛军城（v109已修复frontier搜索，但打分可能仍偏低）

**根因分析**：
- `_aiEstimateSiegeWinRate`用当前满城防评估，不考虑围城衰减→AI觉得攻城永远打不过
- `aiSelectTargets`最多2目标→魏国20城只能选2个方向，蜀国方向永远排不上
- `_aiGetThreatMatrix`两方向威胁>3则全防守→魏国两线受压时完全不进攻
- `fuzzyEstimateWinRate`的模糊噪声可能让胜率在阈值附近反复横跳→对峙不稳定

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅v105 |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 I3朝议✅v105 |
| J 技能框架 | ✅ v106 SKILL_REGISTRY + SKILL_INLINE + 战报技能行 + 金产弹窗修复 |
| K 经济再平衡 | ✅ **v107 人口×5 + 征兵惩罚 → v108 军饷0.008 + 征兵去粮 + 恢复速度校准 → v109 蜀国平衡 + 固定基准补员 + 补员金消耗 + 城防大幅强化（C山地debuff取消）** |

---

## v110 已实装 — AI围城预期胜率（G2修正）

### 背景

v109城防大幅强化（medium×3.0, large×3.5）后，AI到达敌城旁评估"攻城打不过"→halt→对峙→超时放弃。根因审计发现`_aiTrySiege`的判断逻辑有两个断点：

1. **检查2（守军出城野战）不合理**：原逻辑要求"守军出城打你你也打得过"才围城——但围城的目的恰恰是不让守军出来，守军出城对围城方反而是好事（城防加成消失变野战）
2. **缺乏围城预期评估**：AI从未考虑"围城完成后城防消除，我能不能打过"，只看当前满城防下的胜率

### 逻辑链审计结果

完整链路：`aiSelectTargets → aiExecuteOrders(行军) → _aiTrySiege(进siege判断) → aiDoSiege(每旬攻城判断) → processSiegeDecay(衰减推进)`

| 步骤 | 函数 | 改前状态 | 问题 |
|------|------|---------|------|
| 进siege判断 | `_aiTrySiege` 检查1 | 附近敌方野战部队→野战胜率评估 | ✅ 合理保留 |
| 进siege判断 | `_aiTrySiege` 检查2 | 守军出城野战胜率评估 | ❌ 不合理，删除 |
| 进siege判断 | `_aiTrySiege` 检查3 | 不存在 | ❌ 缺失围城预期评估 |
| 攻城发起 | `aiDoSiege` | decay≥70%或winRate≥threshold→攻 | ✅ 逻辑正确 |
| 超时释放 | `aiExecuteOrders` 步骤0 | 9旬halt→释放 | ✅ 已隐式排除siege |

### 实装清单（3项）

#### 改动1：`_aiEstimateSiegeWinRate` 增加 `projectedDecay` 参数

```js
function _aiEstimateSiegeWinRate(attackers, cityId, projectedDecay) {
  // projectedDecay !== undefined 时：用指定decay替代city.siegeDecay
  // 传1.0 = "假设围城完成，城防完全消除"
  const defMult = (projectedDecay !== undefined && projectedDecay !== null)
    ? _getSiegeDefMultWithDecay(city, projectedDecay)
    : getSiegeDefMult(city); // 不传 = 用当前decay（向后兼容）
}
```

新增辅助函数 `_getSiegeDefMultWithDecay(city, overrideDecay)`：与 `getSiegeDefMult` 相同逻辑，但用 `overrideDecay` 替代 `city.siegeDecay`。当 `overrideDecay=1.0` 时，`defMult` 恒等于 `1.00`（城防完全消除）。

**向后兼容**：所有现有调用（`_aiFuzzySiegeWinRate`、`aiDoSiege`等）不传第三参数，行为完全不变。

#### 改动2：`_aiTrySiege` 重写围城判断

删除原检查2（守军出城野战），替换为围城预期胜率评估：

```
检查1（保留）：附近敌方野战部队 → 野战打不过 → halt
检查2（新）：_aiEstimateSiegeWinRate(allies, cityId, 1.0) >= threshold？
  YES → 进siege（围完能打过，值得围）
  NO → halt等援（围完也打不过，兵力不够）
```

围城日志增加预期胜率显示：`"🏰 [AI-wei] 曹操部 对合肥发起围城（预期胜率72%）"`

#### 改动3：超时释放显式注释

9旬超时释放（`aiExecuteOrders` 步骤0）过滤条件已有 `u.status === 'halt'`，siege状态不受影响。添加注释明确此设计意图。

### 测试验证

| 场景 | defMult(满) | defMult(围完) | WR(满) | WR(围完) | AI决策 |
|------|------------|-------------|--------|---------|--------|
| 6k vs medium城（仅2400 garrison） | 3.00 | 1.00 | 79% | 92% | 围城 ✅ |
| 15k vs medium城（2400 garrison + 8k守军） | 3.00 | 1.00 | 58% | 67% | 围城 ✅ |
| 6k vs medium城（2400 garrison + 8k守军） | 3.00 | 1.00 | 18% | 25% | 等援 ✅ |
| 6k vs large雄关（4000 garrison + 10k守军） | 3.55 | 1.00 | 10% | 16% | 等援 ✅ |

### 追加修复（对峙根因 + 粮草圆圈）

#### 改动4：粮草输送蓝色圆圈清理

删除 `renderMap` 中粮草输送点的地图渲染代码（原行10066-10073）。这是早期调试代码，`r="4"` 的蓝色圆圈没有做invS反缩放，放大地图时显得异常大。改为注释行 `// 粮草输送点（不做地图视觉体现）`。

#### 改动5：对峙根因修复——友军/敌军检测范围不对称

**根因**：鹰鸽判断中敌军检测4格、友军检测2格。每个部队都看到更多敌人、更少友军 → 双方都觉得寡不敌众 → 双方都鸽 → 互相对峙。

**举例**（合肥场景）：
```
曹仁评估: 己方=曹仁1万(2格内无友军) vs 敌方=孙权1.1万+孙策1.3万+太史1万(4格内)=3.4万 → WR≈15% → 鸽
孙权评估: 己方=孙权1.1万+孙策1.3万(2格内)=2.4万 vs 敌方=曹仁1万+徐晃1万+夏侯1.5万(4格内)=3.5万 → WR≈40% → 鸽
双方都鸽 = 永久对峙
```

**修复2处**：
- `aiExecuteOrders` 步骤1 鹰鸽判断：友军检测范围 **2格→4格**，与敌军一致
- `_aiTrySiege` 友军集结检测：**2格→3格**，与敌军检测3格一致

**修复后预期**：
```
曹仁评估: 己方=曹仁1万+徐晃1万+夏侯1.5万(4格内)=3.5万 vs 敌方=3.4万 → WR≈50%+ → 鹰
孙权评估: 己方=孙权1.1万+孙策1.3万+太史1万(4格内)=3.4万 vs 敌方=3.5万 → WR≈48% → 鸽
→ 一方鹰一方鸽 → 鹰方推进/交战 → 对峙解除
```

### 待办事项（下轮）

#### 改动6：步骤2死循环修复（1v1对峙根因）

**根因**：步骤1判定鹰→发行军命令→`processUnitMovement`走到敌军旁被堆叠halt→hexPath残留→步骤1的filter（要求hexPath为空）跳过→步骤2接管→敌军不相邻（2格）→else分支恢复march→又走又撞→无限循环。`_aiHaltTurn`每次被删除，9旬超时永远不触发。

**修复**：步骤2的else分支（敌军不相邻）不再恢复march，而是**清空hexPath**，让步骤1下旬重新接管。步骤1有完整的鹰鸽判断+发起战斗能力。

#### 改动7：`_aiChooseDefensePosture` 友军范围统一

防守姿态选择中友军检测范围从2格扩到4格，与鹰鸽判断一致。避免守方过度悲观（明明正面打得过却去扎营/伏击）。

#### 改动8：defend部队主动出击

**问题**：defend部队到达防守城市后只会garrison，即使敌军就在城门口且明显打得过也不出去。回防路上被堵、援军到城外无法进被围的城时，也不会主动打敌军。

**修复**：在步骤2b的defend部队处理中，**最先**检查是否有敌军贴脸（`unitsContact`，1格内）。有 → 集合4格内友军评估胜率 → 打得过 → `aiInitiateBattle`出击。打不过才走原来的garrison/扎营/伏击逻辑。覆盖出城迎击、路上遭遇、解围三个场景。

#### 改动9：冷却机制加强（防止反复攻打同一目标）

**问题**：9旬超时放弃后，部队冷却只有6旬，走3旬+对峙9旬+冷却6旬→又分配同一城→无限循环。冷却只绑部队，势力可派其他部队去打同一个打不下的城。

**修复**：
- 部队级冷却：6旬→**15旬**
- 新增**势力级冷却**：`fac._aiTargetCooldowns[cityId] = G.turn + 10`，10旬内整个势力不再选该目标
- `aiSelectTargets`中检查势力级冷却，冷却中的目标直接skip

**优先级1 — AI战略专项（继续G2修正）**：
1. **魏国不攻蜀**：`aiSelectTargets`最多2目标，汉中(雄关+山地+驻军)分数低永远不被选中。需增加目标上限或均衡多方向施压
2. **吴国过强**：模拟中吴军表现强势，可能是港口金产+水乡地形组合让经济效率偏高。需观察确认
3. **蜀国后期崩盘**：48k兵打几仗就没钱了。设计预期蜀弱，但需确认是否"弱得合理"
4. **移除debug计时工具**：`nextTurn`性能计时、`fastForwardTurns`安全阀

**优先级2 — 应做**：
5. 君主继任→AI性格动态切换
6. confirmBattle补try-catch防护

**优先级3 — 技能扩展**：
7. 武将技能批量实装（85处待实装）

**优先级4 — 系统完整性**：
8. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
9. 地图裁剪

### 下轮首要debug重点

v110做了9项AI改动，需要快进测试验证：

1. **对峙是否缓解**：合肥/下邳方向，双方部队是否不再长期对峙（友军4格对称+步骤2死循环修复）
2. **defend出城打弱敌**：城里守军2万+，门口敌军1.5万，守军是否主动出城（改动8）
3. **围城是否发生**：AI到城旁后是否进入siege状态而非无限halt（围城预期胜率改动1-2）
4. **冷却是否生效**：放弃目标后是否换城打，而非反复攻同一城（改动9：部队15旬+势力10旬冷却）
5. **蓝色圆圈是否消失**：粮草输送点渲染已删除（改动4）

**如果仍有对峙问题**，排查方向：
- 鹰鸽判断的WR具体值（可能需要加console.log临时调试）
- `_aiHaltTurn`是否被正确设置/清除
- 步骤1 vs 步骤2的filter是否正确分流（hexPath有无残留）
- attack vs defend角色分配是否符合预期

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2三阶段✅ GT三件套✅ fuzzyWR✅ 情报模糊✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅v105 **v110: 围城预期胜率✅ 对峙范围4格✅ 步骤2死循环✅ defend出击✅ 冷却加强✅** |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ I2豪族✅ I1太守建设buff✅v104 I3朝议✅v105 |
| J 技能框架 | ✅ v106 SKILL_REGISTRY + SKILL_INLINE + 战报技能行 + 金产弹窗修复 |
| K 经济再平衡 | ✅ **v107→v108→v109 完成** |

---

### v110 下轮首要Debug任务

**下邳对峙问题**：孙权1.7万在下邳旁2格，城内守军3.7万（夏侯+朱+李典）。孙权打不过→鸽→halt。需验证v110的冷却机制（势力级10旬+部队级15旬）是否生效让孙权换目标。如果仍卡住，排查：
1. `_aiHaltTurn` 是否被正确设置和保持（不被意外清除）
2. 9旬超时释放是否触发
3. 势力级冷却 `fac._aiTargetCooldowns` 是否在 `aiSelectTargets` 中生效
4. 可加console.log在超时释放处确认触发

**更深层问题**：`aiSelectTargets` 只派1支部队去打3.7万守军的城——兵力分配不足。可能需要在分配时就判断"这支部队够不够"，不够就不派或多派。

### v110 实装总结（9项改动）

| # | 改动 | 类型 |
|---|------|------|
| 1 | `_aiEstimateSiegeWinRate` 加 `projectedDecay` 参数 | 围城AI |
| 2 | `_aiTrySiege` 删除守军出城检查，改用围城预期胜率 | 围城AI |
| 3 | 超时释放注释明确排除siege状态 | 鲁棒性 |
| 4 | 粮草输送蓝色圆圈删除 | 渲染清理 |
| 5 | 鹰鸽判断友军范围2格→4格（与敌军一致） | 对峙修复 |
| 6 | 步骤2清hexPath让步骤1接管（修1v1死循环） | 对峙修复 |
| 7 | `_aiChooseDefensePosture` 友军范围2格→4格 | 防守AI |
| 8 | defend部队贴脸敌军时主动出击 | 防守AI |
| 9 | 冷却机制加强：部队15旬+势力级10旬 | 目标选择 |

---

## v111 AI对峙bug修复 + 扎营调整

### 审计方法

对v110的9项AI改动逐一定位代码，追踪完整调用链（`aiExecuteOrders` 步骤0/1/2 → `processUnitMovement` → `nextTurn`），分析所有while循环终止条件、`_aiHaltTurn`的全部设置/清除点、`_pendingBattleConfirms`队列是否可能循环推送。用提取的核心逻辑跑时间线模拟验证。

### 审计确认无死循环风险的部分

- `processUnitMovement` while循环：AP消耗保证终止 ✅
- 快进 `while(_pendingBattleConfirms.length)`：`autoResolvePendingBattle`不往队列推新元素 ✅
- `fastForwardTurns` 10秒安全阀 ✅
- `aiInitiateBattle` 有 `_aiBattleProcessedThisTurn` 去重 ✅
- v110步骤2清hexPath→步骤1接管的流转（不会同旬内循环）✅

### Bug #1 修复 [高优先级]：5旬强推导致9旬超时永远不触发

**根因**：`aiExecuteOrders` 步骤1对峙重检（~行6710）中，5旬强行推进时 `delete unit._aiHaltTurn`，部队被堵回来后鸽派判断重设 `_aiHaltTurn = 当前旬`（计时器从头算）。步骤0的9旬超时检查永远等不到9旬（每5旬被清零重算），部队陷入"5旬等→冲一下→被堵→5旬等"的低效无限循环。势力级冷却也因此无法触发。

**修复**：5旬强推时**不再delete `_aiHaltTurn`**，改为设置临时标记 `unit._aiForceAdvance = true`（允许本旬推进）。`_aiHaltTurn` 保留原始设置时间，步骤0的9旬超时从最初停下那旬算起。`_aiForceAdvance` 在每旬 `nextTurn` 开始时自动清理。

**涉及代码**：
- `aiExecuteOrders` 步骤1对峙重检（~行6709-6717）：`delete unit._aiHaltTurn` → `unit._aiForceAdvance = true`
- `nextTurn` 重置区（~行9142）：每旬清理 `_aiForceAdvance`

**模拟验证**：旧逻辑下旬15清零后永远到不了9旬超时；修复后旬19正确触发放弃目标。

### Bug #2 修复 [低优先级]：被友军堆叠反复绕圈

**根因**：步骤2 else分支（旁边没敌军）清hexPath→步骤1重新寻路→同一条路→又被友军堆叠堵住→每旬重复。

**修复**：新增 `unit._aiBlockedCount` 计数器。被非敌军堵住时+1，连续3旬被堵→放弃目标变idle（`_aiRole='idle'`）。成功发行军命令时清零。

**涉及代码**：
- `aiExecuteOrders` 步骤2 else分支（~行6783-6789）
- `aiExecuteOrders` 步骤1 行军命令处（~行6735）

### Bug #3 修复 [低优先级]：扎营资源二次检查 + 降价

**根因**：`_aiChooseDefensePosture` 返回'camp'前检查资源，但同旬多个defend部队都返回'camp'时，执行扎营的代码不二次检查，第二支起可能导致资源为负。

**修复**：
- 步骤2b扎营执行处（~行6878-6893）加二次资源检查，不够则fallback garrison
- `CAMP_COST` 降低：金200→**100**，木150→**80**（扎营更实用，AI更愿意用）

### v111 实装总结（10项改动）

| # | 改动 | 类型 |
|---|------|------|
| 1 | 5旬强推保留`_aiHaltTurn`，用`_aiForceAdvance`临时标记 | **对峙核心修复** |
| 2 | 被友军堵3旬→放弃目标变idle（`_aiBlockedCount`） | 防堵修复 |
| 3 | AI扎营二次资源检查 + CAMP_COST金100木80 | 资源安全+平衡 |
| 4 | 派系列表改用`getGenFactions`多标签，双标签人两边都显示 | 派系UI |
| 5 | 宗亲/创始团队豁免边缘化告警 + 移除宗亲超标告警 | 派系平衡 |
| 6 | 新增`aiDoAppointments`：AI自动任命太守（优先本地籍贯提升豪族）+自动封官 | **AI内政** |
| 7 | 官职merit门槛减半（武tier1:60, tier2:30, tier3:10 / 文tier1:50, tier2:25, tier3:8） | 官职平衡 |
| 8 | 初始资金砍半（魏10000/蜀6000/吴8000） | 经济平衡 |
| 9 | AI基建预算下限20%→30%，经济建筑评分×2倍，城墙评分减半 | **AI基建** |
| 10 | 兵营改为征兵费折扣10%/20%/30%（`getBarracksDiscount`），玩家/AI征兵均生效 | 建筑ROI |

### 改动详细说明

#### 改动4-5：派系系统调整
- 派系tab武将列表从`getGenFaction`（单主标签）改为`getGenFactions`（多标签），一个武将如果同属创始团队+宗亲（如吴懿），两个派系下都会出现
- `marginalizedFacs`计算跳过`royalty`和`founding`——宗亲和创始团队是君主嫡系，哪怕只有一个人也不该显示"势单力薄"
- 移除`royaltyRatio > 0.40`的紧张关系告警

#### 改动6：AI任命太守+封官（`aiDoAppointments`）
- 每6旬执行一次，三家错峰（魏偏移2/蜀偏移4/吴偏移0）
- **太守**：遍历无太守的己方城市，从闲置武将中选pol最高者。本地籍贯（`GEN_TAGS[name].region`匹配`REGION_CITIES`）加15分，提升豪族支持
- **封官**：用`getPostSlots`获取各tier空位，从高tier到低tier遍历空位。候选人条件：merit够+无官职+无太守。按对应属性（武官看com、文官看pol）排序选最强者
- 新增辅助函数`_getCityRegion(cityId)`：查`REGION_CITIES`反向映射

#### 改动8：初始资金
魏20000→10000，蜀12000→6000，吴15000→8000。避免开局AI把大量钱砸进征兵后维持不了。

#### 改动9：AI基建权重
- `_aiCalcBudget`军费上限90%→85%，下限20%→**30%**，确保即使乱战也有基建预算
- `scoreBld`中farm/irr/market/harbor评分乘数从×100→**×200**，经济建筑优先级翻倍
- 城墙：前线50→**25**，非前线5→**3**

#### 改动10：兵营→征兵费折扣
- 定义改为`征兵费-10%/-20%/-30%`，建造成本略降（金500→400，铁300→200等）
- 新增`getBarracksDiscount(city)`：按兵营等级返回×1.0/0.90/0.80/0.70
- 玩家征兵（`confirmRecruit`）和AI征兵（`aiDoRecruit`）的`costGold`计算都乘以折扣
- 征兵UI预览显示兵营折扣百分比标签（绿色）

### 测试验证重点

1. **快进50-100旬**：观察AI是否不再长期对峙（Bug#1），日志搜"🔄"看9旬超时是否触发
2. **日志搜"📜"**：应能看到AI任命太守和封官的日志
3. **派系tab**：双标签武将（如吴懿）应在两个派系下都出现；宗亲/创始不显示"势单力薄"
4. **初始资金**：开局金钱减半后AI是否仍能正常运转（不至于第一旬就赤字）
5. **AI基建**：快进观察AI是否建了市集/农场（日志搜"🏗"），而非全堆城墙
6. **兵营折扣**：在有兵营的城市征兵，UI应显示绿色"-10%"等标签，实际花费减少
7. **官职tab**：merit门槛降低后，更多武将应符合封官条件

### v111 迭代修复（测试反馈后追加）

以下为v111首批改动交付后，经多轮快进测试发现并修复的问题：

#### 迭代A：AI基建预算最低保障 + 蜀国初始金调整
- `_aiCalcBudget`新增基建最低保障：`minBuildBudget = grossGoldIncome × 20%`，即使军费紧张也能建经济建筑
- 经济建筑（market/farm/harbor/irr）前线不再return -1，改为`s *= 0.7`降权但不禁止
- 蜀国初始金6000→**8000**（官职负担重，需要缓冲）

#### 迭代B：魏国停滞修复——迷雾+冷却+defend积压
**迷雾根因**：`updateFog`只在开局(`initFog`)把邻接敌城设为explored，之后攻下新城不会探索下一个敌城→AI看不到目标→不进攻

**修复**：`updateFog` Step 4——每旬用ROADS邻接判断己方城市旁的敌城，把其领地范围设为explored+建立快照

**其他修复**：
- 目标上限2→**3**
- 势力冷却10→**6旬**
- 12旬无attack部队→清除全部冷却强制review
- defend积压释放：可用进攻部队<2且defend≥3→释放一半defend转进攻

#### 迭代C：残兵/逃兵机制重做
- AI自动解散兵力<100的残部（`aiDoDisband`开头）
- 全局僵尸清理阈值从0→**50**
- **欠饷逃兵重做**：分母改为`maxTroops`（编制，不再越减越慢），5%/旬，连续欠饷**10旬全军溃散**
- **断粮逃兵重做**：分母改为`maxTroops`，10%/旬，断粮惩罚触发**3旬后全军饿殍**（总断粮7旬）

#### 迭代D：围城守方出击 + 官职俸禄
- `aiDefenderDecision`：胜率≥80%时主动出城歼灭弱敌（修复1万人看700人围城不动的问题）
- 官职俸禄全面砍半（大将军100→50，丞相90→45，tier2武60→30文50→25，tier3武30→15文25→12）

#### 迭代E：对峙死锁 + 迷雾溢出 + AI路线隐藏
- **鹰派主动推进**：鹰派判定通过但不贴脸（2-4格距离）→主动寻路走向最近敌军（修复"双方都判鹰但保持距离永远不打"的百旬对峙）
- **迷雾溢出修复**：Step4从territory hex边界判断改为**ROADS邻接**判断，避免无限BFS回填导致半张地图变explored
- **AI行军路线隐藏**：渲染行军路线时加`unit.fac === G.playerFac`条件

### v111 完整改动汇总（含所有迭代）

| # | 改动 | 类型 |
|---|------|------|
| 1 | 5旬强推保留`_aiHaltTurn`，用`_aiForceAdvance`临时标记 | 对峙修复 |
| 2 | 被友军堵3旬→放弃目标变idle | 防堵修复 |
| 3 | AI扎营二次资源检查 + CAMP_COST金100木80 | 资源安全 |
| 4 | 派系列表多标签显示 | 派系UI |
| 5 | 宗亲/创始豁免边缘化 | 派系平衡 |
| 6 | `aiDoAppointments`：AI太守（本地籍贯优先）+ AI封官 | AI内政 |
| 7 | merit门槛减半 | 官职平衡 |
| 8 | 初始资金（魏10000/蜀8000/吴8000） | 经济平衡 |
| 9 | AI基建预算下限30% + 最低保障金产20% + 经济建筑评分×6 + 城墙降分 | AI基建 |
| 10 | 兵营→征兵费折扣10/20/30% | 建筑ROI |
| 11 | `updateFog` Step4：ROADS邻接敌城→explored | **迷雾核心修复** |
| 12 | 残兵自动解散(<100) + 全局清理阈值50 | 残兵清理 |
| 13 | 欠饷逃兵重做：maxTroops 5%/旬，10旬溃散 | 逃兵机制 |
| 14 | 断粮逃兵重做：maxTroops 10%/旬，7旬饿殍 | 逃兵机制 |
| 15 | 守方胜率≥80%主动出城歼敌 | 围城AI |
| 16 | 官职俸禄全面砍半 | 经济平衡 |
| 17 | 鹰派不贴脸→主动走向敌军 | **对峙核心修复** |
| 18 | 迷雾Step4改用ROADS邻接（修溢出） | 迷雾修复 |
| 19 | AI行军路线不显示给玩家 | UX修复 |
| 20 | defend积压释放 + 12旬发呆检测 | AI进攻 |

### 待办事项（下轮）

**优先级1 — UI重构**：
1. **左右面板重构**：城池列表移到右侧城池tab（两级：列表→详情），左侧去掉城池/部队列表
2. **Billeted重做**：任意己方领土可触发→部队消失→附近大城regroup（3旬）→军事tab显示列表
3. **扩招系统**：回城后可扩编已有部队（锁定兵种，新兵稀释等级）

**优先级2 — 代码审计**：
4. v111改动量大（20项），需要全面audit确认无副作用
5. 迷雾系统稳定性（Step4 ROADS邻接是否覆盖所有场景）
6. 逃兵机制是否有边界情况（部队在战斗中被触发溃散？）

**优先级3 — AI战略**：
7. 观察v111多项修复后三家平衡（初始资金/俸禄/基建/对峙修复的综合效果）
8. 移除debug计时工具

**优先级4 — 技能扩展**：
9. 武将技能批量实装（85处待实装）

**优先级5 — 系统完整性**：
10. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
11. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2✅ GT✅ fuzzyWR✅ 情报✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅ v110围城/对峙/冷却✅ **v111: 强推计时器✅ 堵路✅ 扎营✅ 太守/封官✅ 基建提权✅ 迷雾探索✅ defend释放✅ 守方出城✅ 鹰派推进✅ 发呆检测✅** |
| H UX优化 | ✅ **v111: AI路线隐藏✅** |
| I 内政深化 | ✅ I2豪族✅ I1太守✅ I3朝议✅ **v111: AI太守✅ 兵营折扣✅ 派系豁免✅ 俸禄砍半✅** |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ v107-v109✅ **v111: 初始资金✅ merit✅ 逃兵重做✅ 残兵清理✅** |

---

## v112 代码审计修复

### 审计方法

对v111的20项改动进行全面代码审读，重点追踪：迷雾Step4逻辑链、逃兵/溃散时机与边界情况、defend释放机制、变量遮蔽、死代码。逐函数验证数据流和时序。

### 审计确认无问题的部分

| 项目 | 结论 |
|------|------|
| 迷雾Step4 ROADS邻接 | ✅ 只升级unexplored→explored，不覆盖已有快照，territory复用Step2a变量无重复调用 |
| `_aiForceAdvance` 清理时机 | ✅ 旬初清理→AI设标记→本旬生效→下旬清除 |
| 9旬超时 vs 5旬强推交互 | ✅ `_aiHaltTurn`保留原始时间戳，超时正确触发 |
| `_aiBlockedCount` 所有清除路径 | ✅ 成功行军/达标放弃/鹰派通过三条路径都有清除 |
| 残部清理阈值50 vs troops>0 | ✅ 1-49兵力幽灵部队仅存在旬内，AI逻辑之后清理，战力极低不影响决策 |
| 扎营资源二次检查 | ✅ aiDefendResponse和aiExecuteOrders两处均有实时余额检查 |
| defend释放后角色清零 | ✅ 行6563重复清零无害，未来如需在释放时设临时标记需注意此行 |

### 修复内容（3处）

| # | 位置 | 严重度 | 修复前 | 修复后 |
|---|------|--------|--------|--------|
| 1 | `processUnitSalary` 阶段2（~行13397） | **HIGH** | 欠饷10旬全军溃散包含billeted部队（与断粮免疫不对称） | billeted免疫5-9旬逃兵阶段；野战10旬溃散；billeted15旬溃散 |
| 2 | `aiDefendResponse` 伏击设防（~行6350） | LOW | `dUnit.hq/hr`赋值重复两行 | 删除重复行 |
| 3 | `processSupplyStatus` 断粮溃散（~行13302） | **MEDIUM** | `penaltyTurns >= 3` 实际总断粮6旬溃散，与设计文档"7旬"不符 | 改为 `penaltyTurns >= 4`，总断粮7旬（存粮3+惩罚4）与设计一致 |

### 改动1详细说明：billeted欠饷豁免

**设计理念**：billeted是和平时期低消耗保编制的操作，部队已遣散回乡。断粮已完全免疫（v111），欠饷也应给予缓冲。

**新逻辑**：
- 欠饷5-9旬逃兵：billeted免疫（已遣散回乡，不会跑）
- 欠饷10旬：野战部队全军溃散，billeted不受影响
- 欠饷10-14旬：野战部队已死，billeted继续存活
- 欠饷≥15旬：billeted部队也编制解散（长期分文没有最终散伙）

**实现**：`units`拆分为`activeUnits`（非billeted）和`billetedUnits`（billeted），分别处理溃散门槛。

### 改动3详细说明：断粮溃散时机修正

**根因**：`SUPPLY_RATIONS=3`，旧代码`penaltyTurns >= 3`即`turns >= 6`（第6旬溃散），但设计文档写"总断粮7旬"。

**时间线（修正后）**：
| 旬数 | _noSupplyTurns | penaltyTurns | 效果 |
|------|---------------|-------------|------|
| 1-3 | 1-3 | — | 吃存粮 |
| 4 | 4 | 1 | 逃兵10%+士气-20 |
| 5 | 5 | 2 | 逃兵10%+士气-25 |
| 6 | 6 | 3 | 逃兵10%+士气-30 |
| 7 | 7 | 4 | **全军溃散** |

### 待办事项（下轮）

**优先级1 — UI重构**：
1. **左右面板重构**：城池列表移到右侧城池tab（两级：列表→详情），左侧去掉城池/部队列表
2. **Billeted重做**：任意己方领土可触发→部队消失→附近大城regroup（3旬）→军事tab显示列表
3. **扩招系统**：回城后可扩编已有部队（锁定兵种，新兵稀释等级）

**优先级2 — AI战略**：
4. 观察v111多项修复后三家平衡（初始资金/俸禄/基建/对峙修复的综合效果）
5. 移除debug计时工具

**优先级3 — 技能扩展**：
6. 武将技能批量实装（85处待实装）

**优先级4 — 系统完整性**：
7. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
8. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ G2✅ GT✅ fuzzyWR✅ 情报✅ B4✅ 混编✅ 基建ROI✅ 调粮✅ 挖角✅ 伏击/扎营✅ v110围城/对峙/冷却✅ v111全20项✅ |
| H UX优化 | ✅ v111: AI路线隐藏✅ |
| I 内政深化 | ✅ I2豪族✅ I1太守✅ I3朝议✅ v111: AI太守✅ 兵营折扣✅ 派系豁免✅ 俸禄砍半✅ |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ v107-v109✅ v111全项✅ **v112: billeted欠饷豁免✅ 断粮溃散7旬修正✅** |

---

## v112 UI布局重构 + 代码清理

### UI布局改动

**左面板瘦身**（255px→220px）：
- 删除：城池列表（`#junList`，按郡分组45城）
- 删除：野战部队概览（`#unitOverview`，部队卡片列表）
- 保留：势力总览（三家卡片）、全局政策（税/补员/调粮）、运粮途中、补给线

**右侧城池Tab两级结构**：
- 默认无选城 → 显示城池列表（从左面板迁移的按郡分组列表）
- 点击城市 → 切到城池详情（原renderCityTab内容）
- 详情顶部有"← 返回城池列表"按钮（清空`G.selCity`回到列表）
- 迷雾城市详情同样有返回按钮

**函数变更**：
| 函数 | 变更 |
|------|------|
| `renderCityTab(c)` | 重写为两级分发：有`G.selCity`→`_renderCityDetail(c)`，无→`_renderCityList(c)` |
| `_renderCityList(c)` | **新增**：按郡分组城池列表（迁移自renderLeft） |
| `_renderCityDetail(c)` | **重命名**：原renderCityTab的全部详情逻辑 |
| `renderUnitOverview()` | **删除**：右侧军事Tab已有完整部队列表 |
| `renderLeft()` | 删除junList渲染（~30行） |
| `selCity()` | 移除`renderLeft()`调用 |
| `renderAll()` | 移除`renderUnitOverview()`调用 |
| `renderAllLight()` | 移除`renderUnitOverview()`调用 |

**CSS变更**：
- `.main` grid-template-columns: `255px 1fr 370px` → `220px 1fr 370px`
- 删除 `.jun-city.sel`（列表不再标记选中态，点击直接切到详情）

**HTML变更**：
- 左面板删除 `<div id="unitOverview">` 和 `<div class="pt">城池列表</div>` + `<div id="junList">`

### 代码清理（四轮审计累计）

**删除的死代码**：
| 项目 | 说明 |
|------|------|
| `BATTLE_TYPES` | 战斗类型枚举，零引用 |
| `RANK_COLOR` | 官职颜色映射，零引用 |
| `HEX_RIVER_EDGES` | 空Set，从未填充或读取 |
| `_spaceDown` | 布尔flag，赋值后从未读取 |
| `UNIT_MAX_TROOPS` | 局部常量，零引用 |
| `GENS` | 迷你3-ruler对象，被GENS_FULL完全取代 |
| `HEX_W` | hex宽度常量，零引用 |
| `MAP_W` / `MAP_H` | viewBox尺寸常量，实际viewBox硬编码 |
| `nextTurn._t0/_dbg` | v109 debug性能计时（14处） |
| `fastForward`性能日志 | `_ffStart`/console.log（保留10秒安全阀） |
| 15个死CSS类 | `sp-sub` `reg-lbl` `clbl` `jun-boundary` `tag-icon` `slot-info` `gen-tags-mini` `gen-tag-mini` `gpm-stat-bonus` `gpm-rel-row` `gpm-rel-tag` `dip-s` `mbtn` `move-mode` `unit-g` |

**重构优化**：
| 项目 | 说明 |
|------|------|
| `toCube()` | 从hexDist/hexLineDraw内部提取为顶级函数，去重 |
| `ensureCityNeighbors()` | 从aiDoBuild/aiDoRecruit提取为公共函数，去重14行 |
| `unit.hq??0` | 4处hexDist调用统一null-coalescing风格 |
| 空catch块 | 技能日志收集处加注释说明意图 |

**Bug修复**：
| 项目 | 说明 |
|------|------|
| billeted欠饷豁免 | 5-9旬逃兵免疫，野战10旬溃散，billeted15旬溃散 |
| 断粮溃散修正 | `penaltyTurns>=3`→`>=4`，总断粮7旬与设计一致 |
| viewBox注释 | 700→740修正 |
| 重复赋值 | aiDefendResponse伏击设防`dUnit.hq/hr`删除重复行 |

### 待办事项（下轮）

**优先级1 — UI继续**：
1. **Billeted重做**：任意己方领土可触发→部队消失→附近大城regroup（3旬）→军事tab显示列表
2. **扩招系统**：回城后可扩编已有部队（锁定兵种，新兵稀释等级）

**优先级2 — 快进平衡测试**：
3. 验证v111的20项改动综合效果（对峙/围城/经济/基建）
4. 观察三家平衡

**优先级3 — 技能扩展**：
5. 武将技能批量实装（85处待实装）

**优先级4 — 系统完整性**：
6. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
7. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ 全部完成（v85-v111） |
| H UX优化 | ✅ v111: AI路线隐藏✅ **v112: 左右面板重构✅ 城池Tab两级✅** |
| I 内政深化 | ✅ 全部完成（v104-v111） |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ v107-v112: billeted欠饷豁免✅ 断粮7旬修正✅ |

---

## v112 AI征兵节制（供需动态分析）

### 问题

`aiDoRecruit`每旬调用，只要budget够+有闲将就无脑征兵。导致AI在后方大城（如邺城）每旬征一支5000人部队，前线却不需要那么多兵→部队堆积闲置。

### 修复：兵力供需检查

在`aiDoRecruit`开头加入动态供需分析，**有缺口才征，没缺口就攒钱**。

**需求侧**：
- 每个attack目标城：守军兵力（野战+城防）× 1.5（进攻需优势）
- 每个defend目标城（按城市去重）：威胁敌军兵力 × 1.0（防守需持平）

**供给侧**：
- 己方所有部队总兵力

**决策**：
- `供给 ≥ 需求 且 需求 > 0` → 不征
- `需求 = 0`（无目标） → 由闲置兜底控制（≥3支idle就停）
- `供给 < 需求` → 征兵

**闲置兜底**：idle/无任务部队 ≥ 3支 → 不征（说明aiSelectTargets分配不出去）

### 效果预期

- 邺城不再每旬出一支新部队
- 打了败仗→缺口出现→恢复征兵
- 和平期保留≤2支常备军
- 完全动态，无硬编码间隔/上限

---

## v112 友军穿越修复（堆叠规则重做）

### 问题

v103的堆叠检测规则：野外hex**完全禁止**任何部队重叠。导致友军变成路障——部队无法穿越己方部队到达目的地，玩家无法点击被友军阻挡的目标hex，AI部队在前线互相卡位加剧对峙。

### 修复：友军可穿越但不可停留

**新规则**：
- 野外hex友军占位：行军中可**穿越**（不停下），但如果是路径**终点**则不能停在该格上
- 己方城市hex：不变，允许多部队共存（garrison）
- 敌方/中立占位：不变，堵住halt

**修改位置**：
| 函数 | 影响 |
|------|------|
| `processUnitMovement`（~行12974） | AI/旬结算移动：友军格判断路径是否还有后续，有→穿越，无→halt在当前格 |
| `_execInstantMarch`（~行18527） | 玩家即时移动：同上逻辑，用`isLastStep`判断终点 |

### 预期效果

- 玩家可以让部队穿过友军抵达目标hex
- AI部队不再被己方友军卡在前线后方
- 围城时多支部队可以穿过先到的友军抵达城旁
- 大幅缓解"友军路障型对峙"

---

## ~~⚠ 下轮首要任务~~ ✅ v113已完成

> 以下为v112原始待办，v113已完成全部3项。

### ~~1. 友军穿越测试（必做）~~ ✅ v113审查通过，零改动

### ~~2. 堵路根因回溯：哪些旧fix可能需要回滚~~ ✅ v113审查完成，零回滚

### ~~3. Billeted重做 + 扩招系统~~ ✅ v113已实装

## v112 完整改动汇总

| # | 改动 | 类型 |
|---|------|------|
| 1 | billeted欠饷豁免（5-9旬免逃兵，15旬溃散） | 经济平衡 |
| 2 | 断粮溃散修正（penaltyTurns>=3→>=4，总7旬） | Bug修复 |
| 3 | aiDefendResponse重复赋值删除 | 代码清理 |
| 4 | 死代码清除：BATTLE_TYPES/RANK_COLOR/HEX_RIVER_EDGES/_spaceDown/UNIT_MAX_TROOPS/GENS/HEX_W/MAP_W/MAP_H | 代码清理 |
| 5 | debug计时移除（_t0/_dbg 14处 + fastForward日志） | 代码清理 |
| 6 | 15个死CSS类清除 | 代码清理 |
| 7 | `toCube()`提取为顶级函数（去重） | 重构 |
| 8 | `ensureCityNeighbors()`提取为公共函数（去重14行） | 重构 |
| 9 | `unit.hq??0`统一null-coalescing（4处） | 一致性 |
| 10 | 空catch块加注释 | 鲁棒性 |
| 11 | viewBox注释修正（700→740） | 注释修正 |
| 12 | **UI布局重构**：左面板瘦身（255→220px），城池列表+部队概览移至右侧 | **UI重构** |
| 13 | **城池Tab两级结构**：列表↔详情，返回按钮 | **UI重构** |
| 14 | `renderUnitOverview()`删除 | UI清理 |
| 15 | **AI征兵供需检查**：兵力需求缺口动态分析，有缺口才征 | **AI平衡** |
| 16 | **友军穿越修复**：野外hex友军可穿越但不可停留 | **核心修复** |

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ 全部完成 **v112: 征兵供需✅ 友军穿越✅** |
| H UX优化 | ✅ **v112: 左右面板重构✅ 城池Tab两级✅** |
| I 内政深化 | ✅ 全部完成 |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ **v112: billeted欠饷✅ 断粮7旬✅** |

---

## v113 友军穿越审查 + Billeted重做 + 扩招系统

### 友军穿越测试（代码审查，零改动）

v112核心改动（野外hex友军可穿越但不可停留）审读通过：
- `processUnitMovement`（12974行）和`_execInstantMarch`（18527行）逻辑正确
- **边界情况**：连续两格友军占位且第二格是终点→部队会停在第一个友军格上（短暂重叠）。极端罕见且渲染侧stackPicker已兜底，不修
- 结论：穿越代码无需改动

### 旧fix回溯审查（零回滚）

| 版本 | 改动 | 判定 | 理由 |
|------|------|------|------|
| v109 | 对峙5旬强推 | ✅ meaningful | 解决敌我鸽派无限对峙，与友军堵路无关 |
| v110 | 友军检测范围2格→4格 | ⚠ 观察项 | 穿越修复后可能过度协同，但不造成bug。快进观察后可缩回2格 |
| v111 | `_aiForceAdvance`临时标记 | ✅ meaningful | v109的配套修复，绑定保留 |
| v111 | `_aiBlockedCount` 3旬放弃 | ❌ 死代码 | 触发条件=被友军堵。穿越后友军不堵路，永远不触发。保留无害 |
| v111 | 鹰派主动走向敌军 | ✅ meaningful | 解决2-4格距离不接触的对峙，与堵路无关 |
| v111 | defend积压释放 | ✅ meaningful | 目标分配逻辑问题，与堵路无关 |

### Billeted重做（核心改动）

**设计理念**：Billet ≠ 旧版"驻扎休整"。新版billet = 遣散部队，兵员保留于大城，武将释放。保留老兵等级是billet存在的核心理由（否则直接裁军）。

**删除**：
- `BILLET_CITIES` 硬编码常量（旧：每势力2城）
- `mobilizeUnit()` 函数（旧：billeted→2旬整备→原地出发）

**新增常量/函数**：

| 项目 | 说明 |
|------|------|
| `BILLET_LEVEL_THRESHOLD = 7` | 部队等级≥7才值得billet（新兵Lv5，打几仗到Lv7） |
| `canBilletToCity(cityId, fid)` | 判断城市是否可接收billet（large城市或首都） |
| `getBilletCities(fid)` | 返回某势力所有可billet城市列表 |

**数据结构**：

```js
G.cities[cityId].billetPool = [
  { id: 'bp_45_a3f2', troops: 4000, maxTroops: 5000,
    type: 'cavalry', level: 8, billetTurn: 45 },
  ...
]
```

**Billet流程**：
1. 部队任意位置 → 点"遣散休整" → 弹窗选大城（large/首都）
2. 确认 → unit从`G.units`删除，武将回闲置池
3. 每个squad的兵员存入目标城`billetPool`
4. 粮饷按billetPool条目计算（`troops × 0.008 × 0.20` = 正常1/5）

**Redeploy流程**：
1. 城池详情 → billetPool列表 → 点"编组"（选中第一个兵员条目）
2. 弹窗：3个slot（主将★/副将一/副将二），类似征兵界面
3. 每个slot独立选：一个billetPool条目 + 一个将领
4. 副将slot需勾选"启用"才可编辑
5. 确认 → 选中的pool条目全部消耗，合编成一支部队（等级=兵力加权平均）
6. `mobilizingTurns=2`，2旬整备后可移动

**与征兵区别**：征兵选兵种+兵力数量；redeploy选已有兵员条目（兵种/兵力/等级锁定）

**新增函数**：

| 函数 | 说明 |
|------|------|
| `billetUnit(uid)` | **重写**：弹窗选城→`_confirmBillet`遣散 |
| `_confirmBillet(uid, cityId)` | 提取兵员到billetPool，删除unit |
| `openRedeployModal(cityId, poolIdx)` | 打开编组弹窗 |
| `_renderRedeployModal()` | 渲染武将选择UI |
| `_rdpPick(slot, name)` | 武将选择切换 |
| `_confirmRedeploy()` | 从pool创建新unit，2旬整备 |

**UI改动**：

| 位置 | 改动 |
|------|------|
| 部队详情·行动面板 | billet按钮改为"遣散休整"（任意位置可用，弹窗选城） |
| 城池详情 | 新增"休整兵员"分区（列表+编组按钮） |
| 军事Tab | 新增"休整兵员"汇总（点击跳转城池） |

**AI逻辑**：

| 函数 | 改动 |
|------|------|
| `aiDoDisband` | 等级≥7→billet到最近大城；<7→裁军 |
| `aiDoRecruit` | 征新兵前优先从billetPool重编（等级高、免征兵费） |

**城市易手清理**：
- 攻城胜利（15679行）→ billetPool清空
- 叛乱（`_triggerMajorRebellion`）→ billetPool清空
- 间谍造反（8869行）→ billetPool清空
- 欠饷15旬溃散 → billetPool清空

### closeModal重复定义Bug修复

**问题**：`closeModal()`在8113行和11423行各定义一次，第二个覆盖第一个。第一个关`genericModal`，第二个关`postModal`。导致billetUnit弹窗（用genericModal）调closeModal时关的是postModal→弹窗卡死无法退出。

**修复3处**：
| # | 位置 | 修复 |
|---|------|------|
| 1 | `closeModal()`（8113行） | 改为同时关闭`genericModal`和`postModal` |
| 2 | 旧第二个`closeModal()`（11423行） | 重命名为`closePostModal()` |
| 3 | `postModal` backdrop click（11414行） | `closeModal()` → `closePostModal()` |

**根因**：历史代码中`showModal`和`closeModal`各有两套定义（genericModal系 vs postModal系），后定义覆盖前定义。之前恰好所有调用方都通过第二套走postModal所以没暴露。v113新增的billetUnit首次通过genericModal系弹窗调用closeModal，触发了这个隐藏bug。

### 遣散行程机制

部队遣散休整不是瞬间完成——兵员需要行军到目标大城。

**行程公式**：
- 距离 ≤ 5格：即到（`travelTurns = 0`，下旬可redeploy）
- 距离 > 5格：`travelTurns = ceil((dist - 5) / 5)`
- 例：距离12格 → ceil((12-5)/5) = ceil(1.4) = 2旬

**数据**：billetPool条目新增`readyTurn`字段（`G.turn + travelTurns`）

**UI**：
- 城市选择器：每城显示"距离X格 · 即到/行程N旬"
- 城池详情billetPool列表：在途兵员显示"🚶 行军中·N旬后抵达"，编组按钮灰掉
- 点击在途兵员编组 → 提示"兵员行军中，还需N旬抵达"

**AI**：AI的`aiDoRecruit`中redeploy检查自动跳过`readyTurn > G.turn`的条目（`openRedeployModal`的校验不走AI路径，需在AI侧也加检查）

现有`openReinforceModal`扩征系统保持不变。billetPool部队通过redeploy重编后即为正常garrison部队，可直接使用现有扩征流程。

### v113 完整改动汇总

| # | 改动 | 类型 |
|---|------|------|
| 1 | 友军穿越代码审查（通过，零改动） | 审查 |
| 2 | 旧fix回溯审查（零回滚，标注观察/死代码） | 审查 |
| 3 | `BILLET_CITIES`删除 → 动态`canBilletToCity` | **Billeted重做** |
| 4 | `billetUnit()`重写：遣散→选城→兵入pool→释放武将 | **Billeted重做** |
| 5 | `mobilizeUnit()`删除 → redeploy系统（选将编组） | **Billeted重做** |
| 6 | `billetPool`数据结构（城市级兵员储备） | **Billeted重做** |
| 7 | billetPool粮饷纳入`getFacUnitSalary`（1/5费率） | 经济 |
| 8 | 城池详情：billetPool列表 + 编组按钮 | UI |
| 9 | 军事Tab：休整兵员汇总分区 | UI |
| 10 | AI裁军：等级≥7→billet，<7→裁 | AI |
| 11 | AI征兵：优先从billetPool重编老兵 | AI |
| 12 | 城市易手/叛乱/间谍 → billetPool清空 | 鲁棒性 |
| 13 | 欠饷15旬 → billetPool溃散 | 经济 |
| 14 | `closeModal()`重复定义bug修复 | **Bug修复** |
| 15 | 遣散行程机制（距离→行军旬数→readyTurn） | **Billeted重做** |
| 16 | AI redeploy跳过在途兵员（readyTurn检查） | AI |

### 待办事项（下轮）

**优先级1 — 快进验证**：
1. 快进50-100旬验证billeted系统运转：AI是否正确billet/redeploy、billetPool是否合理积累/消耗
2. v110友军检测范围4格→观察是否过度协同，可能缩回2格

**优先级2 — 技能扩展**：
3. 武将技能批量实装（85处待实装）

**优先级3 — 系统完整性**：
4. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
5. v111 `_aiBlockedCount` 死代码清理（不急）
6. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ 全部完成 **v113: AI billet/redeploy✅** |
| H UX优化 | ✅ v112: 左右面板重构✅ **v113: billetPool UI✅** |
| I 内政深化 | ✅ **v113: 豪族城防✅ 派系非线性✅ 宣称追踪✅** |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ **v113: billetPool粮饷✅ 欠饷溃散✅ 义兵buff✅ 太守产出✅** |

---

## v113 内政反馈强化（三系统联动）

> 设计目标：让豪族、派系、宣称三个现有系统的后果更直观。不加新系统，只补断裂点和奖励点。

### 一、豪族城防联动

**GENTRY_LEVELS新增defMult**：拥戴1.25 / 支持1.00 / 中立0.90 / 不满0.70 / 抗拒0.50

**getSiegeDefMult / _getSiegeDefMultWithDecay**：城防加成部分 × gentryDef

**gentry=0开城投降**（`_triggerGentryBetray`）：
- 触发条件：gentry=0 + 被围城 + 非最后一城
- 效果：城市直接易手，围城方garrison，守军溃败（-30%兵力+士气归20+撤退2格），occupied=12
- 最后一城保护

**围城UI**：两处（守方城池详情 + 攻方部队详情）显示豪族城防修正标签

### 二、宣称战争追踪

**`G._warClaimStrength`**：宣战时记录强度，和平时清除（3条路径+顺修`_claimGentryHook`未清除旧bug）

**gentryHook加大**：强+10 / 中0 / 弱-10 / 无-25（旧：+5/0/-5/-15）

**占领期分档**：强3旬 / 中12 / 弱18 / 无27旬

**义兵buff**：强宣称攻城→9旬征兵费×0.70。玩家+AI+UI三处生效。`processGentry`开头清理过期。

### 三、派系忠诚非线性 + 分轨影响

**S型曲线**（`factionModToLoyaltyDelta`）：±8内线性，±8~15加速，±15+急剧。替换processLoyalty + breakdown两处。

**派系士气overlay**（`getFactionMoraleMod`）：avgMod≤5→-5~-30 / ≥16→+5~+25 / 6~15=0。`_squadBase`战斗计算实时生效（`squadATK`/`squadDEF`/`squadCP`新增可选`unitFac`参数）。

**太守产出修正**：`getCityProd`金产出×`_facProdMult`（离心0.85 / 效死1.10）。

### v113 内政改动汇总

| # | 改动 | 类型 |
|---|------|------|
| 17 | `GENTRY_LEVELS`新增defMult | 豪族城防 |
| 18 | `getGentryDefMult` + 城防公式乘入 | 豪族城防 |
| 19 | `_triggerGentryBetray` gentry=0开城 | 豪族城防 |
| 20 | 围城UI显示豪族城防修正（2处） | UI |
| 21 | `G._warClaimStrength`存储/初始化/清理 | 宣称追踪 |
| 22 | `CLAIM_EFFECTS` gentryHook加大 | 宣称追踪 |
| 23 | `city.occupied`按宣称强度分档 | 宣称追踪 |
| 24 | 义兵buff（征兵-30%×9旬，3处生效） | 宣称追踪 |
| 25 | `_claimGentryHook`和平清除（旧bug修复） | Bug修复 |
| 26 | `factionModToLoyaltyDelta` S型曲线 | 派系非线性 |
| 27 | `getFactionMoraleMod`士气常数overlay | 派系士气 |
| 28 | `_squadBase`战斗计算应用派系士气 | 派系士气 |
| 29 | `getCityProd`太守派系产出×0.85/1.10 | 派系产出 |
| 30 | 部队详情+城池详情UI显示派系修正 | UI |

---

## 远期探索：LLM驱动AI（端到端策略决策）

### 核心思路

用大模型替代hand-crafted rules做AI决策。规则通过prompt直接告诉模型（不需要学），模型负责的是"理解规则后怎么玩"——战略权衡、多目标取舍、情境推理。

### 为什么可行

- **回合制**：每旬一次决策，不需要实时响应，延迟无所谓
- **状态结构化**：G对象可直接序列化，不需要感知层（vs自动驾驶需要从像素识别）
- **零安全要求**：决策错了就打输了，没有现实后果
- **推理能力现成**：不需要训练数据或微调，模型天然能做"吴国内乱该不该偷袭但我钱不够"这种权衡

### 架构设计

```
每旬:
  1. 状态压缩 → 结构化文本（~1500 token）
     - 己方城市列表（名/兵/粮/建筑）
     - 己方部队列表（将/兵力/位置/状态）
     - 资源（金/木/铁/马）
     - 可见敌军（位置/兵力估算）
     - 外交关系
     
  2. System prompt（~3000 token）
     - 精简版规则文档（战斗公式/经济循环/征兵成本/围城机制）
     - 可用行动列表（征兵/移动/建造/外交/围城/撤退）
     - 输出格式约束（JSON schema）
     
  3. 模型输出 → JSON决策
     {
       "recruit": [...],
       "move": [...],
       "build": [...],
       "diplomacy": [...],
       "reasoning": "吴国东线空虚，集中兵力突破合肥..."
     }
     
  4. 游戏引擎解析JSON → 调用现有函数执行
```

### 实施路径

**Phase 0（实验验证）**：
- 只替换一家（魏国）的`aiDoDiplo`，让模型决定外交策略
- 验证：API调用链通、JSON解析稳定、决策质量合理
- 预估成本：Sonnet ~$0.01/旬，100旬~$1

**Phase 1（单层替换）**：
- 替换`aiSelectTargets`——让模型决定"打谁、派多少兵"
- 底层执行（行军/鹰鸽/围城）仍走现有规则代码
- 这是投入产出比最高的替换点——战略决策正是rule-based最痛苦、LLM最擅长的

**Phase 2（全面接管）**：
- 模型做全部决策（征兵/基建/外交/战略/战术）
- 现有rule-based AI保留作为fallback（API失败时降级）
- reasoning字段可展示给玩家："曹操的战略意图：趁吴蜀交战，集中兵力突破合肥..."（沉浸感极强）

### 技术前提

- Artifact已支持Anthropic API调用（`anthropic_api_in_artifacts`）
- 需要设计稳定的JSON schema + 容错解析
- 需要状态压缩函数（从G对象提取摘要）

### 独特优势（vs rule-based）

- 能处理"模糊权衡"（该不该冒险、该不该趁火打劫）
- 不会出现"规则互相矛盾"——模型是整体推理不是规则叠加
- reasoning字段可作为游戏内容（AI军师的战略分析）
- 不同模型参数可实现不同人格（温度高=冒险、温度低=保守）

### 优先级

**远期探索**，排在billeted/扩招/技能实装之后。但Phase 0实验量很小（~50行代码），可以随时试。

## v113 内政反馈强化 — Bug修复补丁

### Bug #1：派系士气overlay战斗计算完全失效（严重）

**问题**：`_squadBase(sq, unitLevel, com, war, unitFac)` 的 `unitFac` 参数用于调用 `getFactionMoraleMod`，但所有上层调用方（`calcUnitATK`、`calcUnitDEF`、UI展示）从未传入 `unit.fac`，导致 `unitFac` 始终为 `undefined`，`getFactionMoraleMod` 返回 0。

**表现**：部队详情面板正确显示"派系-10"/"派系+5"标签（行19734直接调用`getFactionMoraleMod`），但实际战斗（`resolveBattle`→`calcUnitATK`→`squadATK`）和AI决策（`estimateWinRate`）中完全不生效。玩家看到数值，但打仗没效果。

**修复（5处）**：

| # | 位置 | 修复前 | 修复后 |
|---|------|--------|--------|
| 1 | `calcUnitATK` 简单路径（~行14366） | `squadATK(sq, ..., mainWar)` 无unitFac | 追加 `, 1, unit.fac`（extraMult=1占位） |
| 2 | `calcUnitATK` 带敌军路径（~行14379） | `squadATK(sq, ..., extra)` 无unitFac | 追加 `, unit.fac` |
| 3 | `calcUnitDEF`（~行14399） | `squadDEF(sq, ..., terrainMult*fx.multDEF)` 无unitFac | 追加 `, unit.fac` |
| 4 | UI展示 sqAtk（~行12660） | `squadATK(sq, level, com)` 无unitFac | 改为 `squadATK(sq, level, com, undefined, 1, unit.fac)` |
| 5 | UI展示 sqDef（~行12661） | `squadDEF(sq, level, com)` 无unitFac | 改为 `squadDEF(sq, level, com, undefined, 1, unit.fac)` |

**影响范围**：修复后 `resolveBattle`、`estimateWinRate`、`fuzzyEstimateWinRate` 自动通过 `calcUnitATK`/`calcUnitDEF` 获得派系士气修正，无需额外改动。

### v113 内政审计结论

| 项目 | 状态 |
|------|------|
| 豪族城防联动（defMult 5档） | ✅ 通过 |
| 开城投降（gentry=0+被围+非末城） | ✅ 通过 |
| 围城UI豪族标签（2处） | ✅ 通过 |
| 宣称追踪存储/清理（3条和平路径+旧bug修复） | ✅ 通过 |
| gentryHook加大（+10/0/-10/-25） | ✅ 通过 |
| 占领期分档（3/12/18/27旬） | ✅ 通过 |
| 义兵buff（玩家+AI+UI三处） | ✅ 通过 |
| S型曲线（processLoyalty两处替换） | ✅ 通过 |
| 派系士气overlay定义 | ✅ 通过 |
| 派系士气overlay战斗生效 | 🔴 → ✅ 已修复 |
| 太守产出修正 | ✅ 通过 |
| 部队详情UI派系修正显示 | ✅ 通过 |

### 平衡性评估

**豪族城防**：拥戴(1.25)vs抗拒(0.50)在大城无围衰时差距 4.25x vs 2.30x（~1.85倍），设计合理。

**S型曲线**：±8内=0.05/pt/旬（温和），8~15=0.12/pt/旬（加速），15+=0.25/pt/旬（急剧）。mod=20时忠诚变化2.49/旬，约40旬从100→0，节奏合理。

**派系士气overlay**：avgMod=0时morale-30（显著但不致命），avgMod=20时morale+25。通过 `_squadBase` 的 `effectiveMorale = clamp(morale + _facMorale, 5, 100)` 生效，再转化为 `moraleBase = max(0.3, effectiveMorale/100)`，实际战力影响约±15-25%，与派系系统重要性匹配。


### Bug #2：派系士气overlay阈值错位（严重）

**问题**：`getFactionMoraleMod` 的安全区设为 [6, 15]，但 `genFactionMod` 范围是 [-20, +20]、初始=0。开局所有武将的 avgMod=0 命中 `≤5` 惩罚区，全员显示"派系-30"。

**根因**：原设计注释写"avgMod ≤5"但没意识到 mod 范围包含整个负半轴。avg=0 是正常起始状态，不应有惩罚。

**修复（3处）**：

| # | 位置 | 修复前 | 修复后 |
|---|------|--------|--------|
| 1 | `getFactionMoraleMod`（~行3631） | `avg≤5: (avg-6)*5`, `avg≥16: (avg-15)*5` | `avg≤-15: (avg+15)*6`, `avg≥15: (avg-15)*6`（安全区[-15,+15], ±30上限） |
| 2 | `getCityProd` _facProdMult（~行4417） | `avg≤5→0.85`, `avg≥16→1.10` | `avg≤-15→0.85`, `avg≥15→1.10` |
| 3 | 城池详情UI太守标签（~行12568） | 同上旧阈值 | 同上新阈值 |

**新阈值设计**：
- 安全区 [-15, +15]：无士气修正（覆盖mod范围的75%）
- ≤-15 → 线性到-30（极端离心）
- ≥+15 → 线性到+30（效死）
- 开局 avg=0 → 安全区内，无修正


## v113 扩编系统

### 设计

扩编 = 提高squad的maxTroops上限 + 即时征入新兵。区别于补员（补到已有上限）和征兵（创建新部队）。

### 常量

| 常量 | 值 | 说明 |
|------|---|------|
| `SQUAD_MAX_TROOPS` | 7000 | 单squad兵力天花板 |
| `UNIT_MAX_TROOPS` | 21000 | 单部队总兵力天花板（7000×3） |

征兵界面单squad上限也统一为7000（旧：主将10000/副将5000），部队总上限21000（旧：15000）。

### 玩家扩编

- **前提**：garrison在己方城市 + squad未满7000 + 部队总编制未满21000
- **入口**：部队详情面板，每个squad卡片下方"⬆ 扩编"按钮（蓝色边框，区别于补员按钮）
- **费用**：与征兵同价（金1200×人数/5000 × 豪族/兵营/义兵修正）+ 征兵惩罚（民心/人口质量）
- **等级**：新兵等级=城市initLevel，扩编后部队等级=兵力加权平均
- **整备**：`mobilizingTurns=1`，AP清零

### 新增函数

| 函数 | 说明 |
|------|------|
| `openExpandModal(unitId, squadIdx)` | 打开扩编弹窗 |
| `closeExpandModal()` | 关闭弹窗 |
| `renderExpandModal()` | 渲染弹窗内容（兵力滑块+费用+等级预览） |
| `exAdj(delta)` / `exSet(v)` | 兵力±调整 |
| `confirmExpand()` | 确认扩编（扣资源+提maxTroops+加兵+整备） |
| `aiDoExpand(fid)` | AI扩编决策 |

### AI扩编

- 时机：AI turn loop，裁军之后、征兵之前
- 条件：garrison在己方城市 + squad未满7000 + 有军事预算
- 每旬每势力最多扩编一支部队，每次最多扩编2000人
- 优先级：扩编现有部队 > 征新兵（省将领资源）

### UI改名

- ~~"扩征"按钮 → "补员"（`openReinforceModal`，补到maxTroops）~~ **v114已删除手动补员**
- 新增"扩编"按钮（`openExpandModal`，提高maxTroops）
- 提示文案："扩编需驻扎于己方城市"

---

## v114 集结系统（征兵/扩编渐进集结）

### 设计核心

征兵/扩编不再一步到位。下令时当旬立即集结第一批兵（按城市集结速率），mobilizingTurns=1不能动。下旬整备完成可动，后续旬继续集结直到满编。离城即终止集结，带走已集结兵力，不可回城续集。

### 集结速率公式

```
getMusterRate(cityId):
  baseRate = 2000
  cityBonus = floor(city.pop / 100000) × 500
  musterRate = baseRate + cityBonus
```

| 城市 | 人口 | 速率/旬/squad | 征满7000需 |
|------|------|--------------|-----------|
| 建宁 | 6万 | 2000 | 4旬 |
| 官渡 | 12.5万 | 2500 | 3旬 |
| 洛阳 | 32.5万 | 3500 | 2旬 |
| 许昌 | 42.5万 | 4000 | 2旬 |

### 征兵时序

```
旬0: confirmRecruit → troops = min(mRate, target), mobilizingTurns=1 (有兵不能动)
旬1: processMobilizing → mobilizingTurns=0 + AP重置 (可动)
     processMuster → troops += min(mRate, remaining) (继续集结)
旬2+: processMuster继续，直到满编
     离城 → 终止集结，清理_musterTarget
```

### 扩编时序

```
旬0: confirmExpand → troops += min(mRate, amt), maxTroops提升, mobilizingTurns=1
旬1: 解冻 + 集结继续
```

### 数据结构

```js
squad新增字段（集结中才存在，满编后清除）:
  _musterTarget: number  // 目标兵力
  _mustered: number      // 已集结兵力（= troops）
```

### 新增函数

| 函数 | 说明 |
|------|------|
| `getMusterRate(cityId)` | 城市集结速率：2000 + pop/100k × 500 |
| `isUnitMustering(unit)` | 检查部队是否有未完成的集结 |
| `isAiMusterReady(unit)` | AI专用：所有squad集结≥80%才算就绪 |
| `processMuster()` | 每旬处理集结进度（processMobilizing之后调用） |

### 改动函数汇总（19处）

| # | 函数 | 改动 |
|---|------|------|
| 1 | `confirmRecruit` | troops=min(mRate,target), 设_musterTarget/_mustered |
| 2 | `confirmExpand` | troops+=min(mRate,amt), 设_musterTarget, mobilizingTurns=1 |
| 3 | `aiDoRecruit` | 同#1 |
| 4 | `aiDoExpand` | 同#2 |
| 5 | `nextTurn` 调用链 | processMobilizing后追加processMuster |
| 6 | `processMobilizing` | 整备结束后立即重置AP（修复旬初AP=0的bug） |
| 7 | `issueUnitMove` | 离城终止集结，清理_musterTarget |
| 8 | `processMuster` | 非garrison自动终止集结 |
| 9 | `_aiShouldReview` | +isAiMusterReady过滤 |
| 10 | `aiDefendResponse` | +isAiMusterReady过滤 |
| 11 | `aiExecuteOrders` attack | +isAiMusterReady过滤 |
| 12 | `aiExecuteOrders` defend | +isAiMusterReady过滤 |
| 13 | `aiExecuteOrders` idle | +isAiMusterReady过滤 |
| 14 | `aiDoExpand` | +!isUnitMustering过滤 |
| 15 | `openExpandModal` | 集结中阻止再扩编 |
| 16 | 部队详情squad卡片 | 集结进度条 + 状态标签"🏰集结中" |
| 17 | 征兵弹窗 | 显示集结速率和预估旬数 |
| 18 | 扩编弹窗 | 显示集结时间预估 |
| 19 | `processReinforcement` | 集结中squad补员上限=_mustered，纯新征跳过 |

### 补员规则（自动processReinforcement与集结的交互）

| 场景 | 补员行为 |
|------|---------|
| 新征集结中（_mustered从0开始） | 不补员（troops完全靠集结） |
| 扩编集结中（_mustered从原troops开始） | 补员上限=_mustered（补原有缺口，不超过集结进度） |
| 集结完成（无_musterTarget） | 正常补员（补到maxTroops） |

### 手动补员系统删除

**删除原因**：手动补员（openReinforceModal）允许花金+粮一次性快速补到maxTroops，有钱势力可以瞬间恢复满编，不合理。

**删除范围**：`_rf`变量、`openReinforceModal`、`closeReinforceModal`、`renderReinforceModal`、`rfAdj`、`rfSet`、`confirmReinforce` 共7项，UI按钮同步删除。

**补员现在完全由 `processReinforcement` 每旬自动处理**（基准500/旬，受城市人口/政策/粮食/金修正）。

### Billet复员不走集结

billetPool重编（玩家_confirmRedeploy + AI aiDoRecruit中的billetPool路径）创建squad时直接带满troops，无_musterTarget字段。老兵复员是已有兵员重新编组，不需要集结。

### 堆叠bug修复

**问题**：`processUnitMovement`中友军穿越逻辑允许部队进入友军hex，但如果AP不够走到下一格，部队就停在友军hex上——野外两支部队重叠。

**修复**：穿越前pre-check AP是否够走过该格到下一格（`ap < cost + getHexMoveCost(nextNext)`），不够就halt在当前格等下旬。

**修复位置**：`processUnitMovement`（~行13325），友军穿越分支新增AP预检查。

### AP解冻bug修复

**问题**：旬初AP重置（行9642）检查`mobilizingTurns > 0`时，mobilizingTurns还没被processMobilizing减。整备结束那旬AP被错误设为0。

**根因**：执行顺序——旬初AP重置 → ... → processMobilizing减mobilizingTurns。

**修复**：`processMobilizing`中，mobilizingTurns减到0后立即调用`calcUnitAP(unit)`重置AP。这是v108引入mobilizingTurns时就存在的旧bug。

### 待办事项（下轮）

**优先级1 — Debug验证**：
1. 快进50-100旬验证集结系统：AI征兵/扩编是否正确逐旬集结、80%阈值是否生效
2. 堆叠修复验证：快进后是否仍有野外同hex重叠
3. 征兵→整备→集结→出发的完整流程验证

**优先级2 — 技能扩展**：
4. 武将技能批量实装（85处待实装）

**优先级3 — 系统完整性**：
5. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
6. v111 `_aiBlockedCount` 死代码清理
7. 地图裁剪

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭，B4人格化✅v98 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ 全部完成 |
| H UX优化 | ✅ v112: 左右面板重构✅ |
| I 内政深化 | ✅ v113: 豪族城防✅ 派系非线性✅ 宣称追踪✅ |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ v113完成 |
| L 集结系统 | ✅ **v114: 渐进集结✅ 手动补员删除✅ 堆叠修复✅ AP解冻修复✅** |

---

## v114 Debug轮 — Billet/扩编/集结系统审计

### 审计方法

完整审读billet（`canBilletToCity`/`billetUnit`/`_confirmBillet`/AI裁军billet路径）、扩编（`openExpandModal`/`confirmExpand`/`aiDoExpand`）、集结（`getMusterRate`/`processMuster`/`isUnitMustering`/`isAiMusterReady`）三大系统全部代码，并编写Node.js无头测试框架进行自动化验证。

### 无头测试验证项

| 测试项 | 方法 | 结果 |
|--------|------|------|
| processMuster逻辑 | 手动创建集结中squad，调用processMuster | ✅ 集结递增正确，满编后清理标记 |
| AI征兵→集结 | 注入资源+战争，调用aiDoRecruit | ✅ 首批兵力=min(mRate,target)，_musterTarget/_mustered正确 |
| AI扩编→集结 | 设squad未满+预算，调用aiDoExpand | ✅ maxTroops提升+首批集结+mob=1 |
| Billet→pool完整性 | 模拟billet流程，检查pool entry字段 | ✅ 全部字段存在（含readyTurn修复） |
| Billet重编→无集结标记 | AI从pool重编，检查_musterTarget | ✅ 老兵直接满编，无集结标记，mob=2 |
| 50旬快进zero-crash | nextTurn×50，每旬检查所有invariant | ✅ troops/maxTroops/堆叠/编制/pool全通过 |
| 30旬注入场景验证 | 注入战争+资源+损兵后快进30旬 | ✅ 零bug |

### 修复内容（4处）

| # | 位置 | 严重度 | 修复前 | 修复后 |
|---|------|--------|--------|--------|
| 1 | `aiDoDisband` billet路径（~行7459） | 极低 | pool entry无`readyTurn`字段 | 加`readyTurn: G.turn`（AI裁军部队已在城，即刻可用，与玩家一致） |
| 2 | `_confirmRedeploy`（~行20543） | 低 | 两套等级加权计算，第一套是死代码 | 删除冗余的avgLv计算（5行） |
| 3a | `_confirmRedeploy`（~行20541） | 中 | 玩家重编无部队上限检查 | 加`MAX_FIELD_UNITS_ABS`校验 |
| 3b | `confirmRecruit`（~行18760） | 中 | 玩家征兵无部队上限检查 | 加`MAX_FIELD_UNITS_ABS`校验 |

### 审计确认无误的部分

- `confirmExpand` _musterTarget数学：总新增=amt，firstBatch+后续集结=amt ✅
- `aiDoExpand` 逻辑与玩家一致 ✅
- `processMuster` 安全网：非garrison自动清理集结标记 ✅
- `issueUnitMove` 离城清理：正确清理_musterTarget ✅
- billetPool行军过滤：`openRedeployModal`和`_rdpGetReadyPool`检查readyTurn ✅
- 城池陷落billetPool清空 ✅
- `processReinforcement`与集结交互：新征不补员、扩编补上限=已集结量 ✅
- `doRetreat`不清理_musterTarget但processMuster下旬兜底 ✅
- billetPool粮饷计算（0.008×0.20=1/5费率）✅

### 待办事项（下轮）

**优先级1 — 浏览器实操验证**：
1. 玩家征兵→观察集结进度条递增→满编通知
2. 玩家扩编→观察集结+整备→出发
3. 遣散休整→选城→确认pool显示→重编出发
4. 快进50旬验证AI征兵/扩编集结+80%阈值

**优先级2 — 技能扩展**：
5. 武将技能批量实装（85处待实装）

**优先级3 — 系统完整性**：
6. E1 水战 / E2 特色兵种 / E3 科技树

**技术债**：
7. 地图裁剪

---

## v114 Code Audit轮 — 全局代码审计

### 审计范围

21000+行全量代码结构扫描，覆盖：经济系统（`processFacEconomy`/`updateFacStats`）、nextTurn完整调用链（39步）、战斗系统（`resolveBattle`/`resolveSiegeBattle`/`applyLoss`）、撤退系统（`doRetreat`/`calcRetreatResult`）、AP系统（`calcUnitAP`）、技能系统（`applySkills`）、部队增删一致性（`G.units`赋值14处）、NaN/除零防护。

### 修复内容（1处Bug + 技术债清理）

| # | 位置 | 严重度 | 修复 |
|---|------|--------|------|
| 6 | `nextTurn` 残部清理（~行9773） | 低 | `G.units.filter(troops>=50)` 后加 `if(G.selUnitId && !G.units.find(...)) G.selUnitId=null` 防空指针 |

### 技术债清理

| 项 | 处理 | 影响 |
|---|------|------|
| `billeted` flag（28处引用） | 全部删除。`billeted`永远为false（v113已将billet机制改为billetPool），28处引用全是dead guard check或dead UI分支 | 净减约20行，零功能变化 |
| `_aiBlockedCount`（5处引用） | **保留**。审查确认这是v111加的active逻辑（连续3旬路被堵→放弃目标避免死循环），handover标注有误 |

### 审计确认无误的部分

| 模块 | 结论 |
|------|------|
| `estimateWinRate` | ✅ 蒙特卡洛80次模拟，rand范围与resolveBattle一致 |
| `calcUnitAP` | ✅ 加权+短板，技能try-catch防护 |
| `applySkills` | ✅ 每个技能单独try-catch，单个出错不影响全局 |
| `processFacEconomy` | ✅ 收入-城防军饷-官职俸禄-纳贡链完整 |
| `nextTurn` 39步调用链 | ✅ 顺序正确，processMobilizing→processMuster→processSupply链无遗漏 |
| `G.units` 删除一致性（14处赋值） | ✅ 单个删除全部清理selUnitId；批量删除（AI裁军/残部清理）已修复 |
| NaN/除零防护 | ✅ 关键除法路径均有 `Math.max(1,...)` 或 `\|\|1` 兜底 |
| `processMuster` 覆盖troops与战损交互 | ✅ 预期行为：城内集结中部队受损后新兵继续报到（城市还在，征兵来源还在）|
| `createUnit` 6处调用 | ✅ squads结构一致 |

---

## v114 最终Audit轮 — 深度全模块审计

### 审计范围

470个函数、21000行代码的全模块扫描。覆盖：战报对象结构、武将投降/下野系统、补给BFS死循环检测、围城衰减边界、叛乱系统失控检测、人口下限防护、快进模式弹窗处理、外交状态机一致性、兵种克制数值表、技能系统(REGISTRY 10条 + INLINE 14标签)、事件系统坐标引用、gentry初始化。

### 修复内容（4处Bug + 代码清理）

| # | 位置 | 严重度 | 修复 |
|---|------|--------|------|
| 7a-d | 战报return对象（4处） | 极低 | 删除重复的 `atkTroops`/`defTroops` 字段声明（后者覆盖前者，值相同无功能影响，但不整洁） |
| 9 | `checkLoyaltyThresholds`（~行8148） | 低 | 武将下野删除squad后加 `G.units.filter(u=>u.squads.length>0 && u.squads.some(sq=>sq.troops>0))` + selUnitId清理 |
| 10 | `initGame` 城市初始化（~行4097） | 极低 | 加 `gentry:50`（原靠 `processGentry` 中 `?? 50` 兜底，现在显式初始化更规范）|

### 审计确认无误的模块（最终轮补充）

| 模块 | 结论 |
|------|------|
| 补给BFS `buildSupplyMap` | ✅ remaining严格递减+覆盖检查，无死循环风险 |
| 围城衰减 `processSiegeDecay` | ✅ siegeDecay clamp到[0,1]，城防倍率公式 `1+(base+wall)*(1-decay)*gentry` 正确 |
| 叛乱 `checkRebellions` | ✅ 独立冷却10旬，叛军靠残部清理回收，概率合理 |
| 人口 `processPop` | ✅ `Math.max(25000,...)` 下限兜底 |
| 快进 `_fastForward` | ✅ autoResolve战斗+朝议自动选+经验发放，完整覆盖 |
| 外交状态机 | ✅ enemy/neutral/ally三态，双向key同步 |
| 兵种克制 `TYPE_MATCH_MULT` | ✅ 5×5矩阵完整，`getTypeMatchMult`加权平均+total<=0 guard |
| 技能系统 | ✅ REGISTRY 10条condition/effect全正确，try-catch包裹；INLINE 14标签嵌入点无拼写错误 |
| 事件 `rollEvents` | ✅ `c.y` 来自CITIES_DEF展开（行1441 `c.x=p.x; c.y=p.y`），有效 |
| 武将投降 `surrenderGen` | ✅ `genOrigFac` 在initGame已设好（行4152），首次投降不受行14319的查找问题影响 |

### 三轮Audit累计修复总览

| 轮次 | Bug修复 | 技术债清理 |
|------|---------|-----------|
| Debug轮 | #1 AI billet readyTurn · #2 死代码 · #3a/3b 部队上限 | — |
| Audit轮1 | #6 残部清理selUnitId | billeted 28处全清 |
| Audit轮2 | #7a-d 战报重复字段 · #9 下野空squads · #10 gentry初始化 | — |
| **合计** | **11处修复** | **28处死代码清理** |

### 待办事项（下轮）

**优先级1 — 浏览器实操验证**：
1. 征兵→集结进度条递增→满编通知
2. 扩编→集结+整备→出发
3. 遣散休整→选城→pool显示→重编
4. 快进50旬验证AI系统

**优先级2 — 技能扩展**：
5. 武将技能批量实装（85处待实装）

**优先级3 — 系统完整性**：
6. E1 水战 / E2 特色兵种

---

## v115 科技树系统

### 设计概述

势力级全局buff科技树，5大分支49节点，同质化树各方开局解锁不同。研究绑定一名闲置武将，完成后武将获对应属性经验。每势力同时只研究1项，约16-18年全点完。

### 五大分支

| 分支 | 节点数 | 属性 | 主要效果 |
|------|--------|------|---------|
| 经济 | 10 | INT | 粮/金/铁产+6~20%，调粮减半，屯田，征兵费-10% |
| 军事 | 13 | COM | ATK/DEF+3~10%，编制→10000，扎营-40%，火攻-30%，视野+1，军饷-5% |
| 练兵 | 9 | WAR | 出厂等级+1~3，属性经验+30%，适性经验+40%，士气上限+10 |
| 政治 | 8 | CHA | 降将忠诚+10，派系安全区±19，忠诚+0.1/旬，挖角强化，投降率+10% |
| 民生 | 9 | POL | 民心+0.30，人口质量+0.10，豪族+0.30，补给+4/缓冲+1旬，人口增长+40% |

### 新增函数13个，效果接入29处，UI新增科技Tab。详见代码注释。

### 完整待办清单（v115基准）

**🔴 高优先级——核心可玩性**：

| # | 项目 | 规模 | 说明 |
|---|------|------|------|
| 1 | 存档/读档 | ~100行 | localStorage序列化G对象，Set→Array转换。无存档无法长期游玩 |
| 2 | 胜利条件/结局判定 | ~60行 | 每旬检查城市归属，消灭所有敌方→胜利画面 |
| 3 | 武将技能批量实装 | ~400行 | ~75将缺技能（已有18将），分2-3批实装 |

**🟡 中优先级——体验提升**：

| # | 项目 | 规模 | 说明 |
|---|------|------|------|
| 4 | 科技树状可视化 | ~250行 | 当前列表式→全战三国风格树状SVG |
| 5 | 整体美术/地图美化 | ~200行 | 地形纹理、城市图标、UI主题、武将头像 |
| 6 | 地图裁剪 | ~40行 | 边缘impassable区域优化 |
| 7 | 反伏击/斥候机制 | ~80行 | 侦察阶段，INT影响识破概率 |

**🟢 低优先级——锦上添花**：

| # | 项目 | 规模 | 说明 |
|---|------|------|------|
| 8 | ~~E2 特色兵种~~ | ~~~180行~~ | ✅ v116已实装：11个城市绑定王牌兵种 |
| 9 | E1 水战系统 | ~250行 | 水域战斗规则+船兵种+风向火攻 |
| 10 | 新手引导 | ~120行 | 首旬弹窗序列 |
| 11 | 三国百科 | ~400行 | 武将/城市/战役历史词条 |
| 12 | 190剧本 | ~500行 | 多势力、不同配置，需支持>3势力 |
| 13 | 音效/BGM | — | — |

### 已确认完成的Sprint（勿重复列入待办）

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 战斗/单挑/伏击/克制/俘获 |
| B 武将深度 | ✅ 派系/忠诚/双标签/B4人格化(三家差异化AI_PERSONALITY) |
| C 战略层博弈 | ✅ C3宣称/C4迷雾/C5补给线 |
| D 养成与沉浸 | ✅ 官职/等级/成长/亲密度 |
| G AI优化 | ✅ G2三阶段/GT三件套/混编/伏击/扎营/调粮/挖角/太守/封官 |
| H UX优化 | ✅ 移动预览/围城弹窗/渲染优化/补给overlay |
| I 内政深化 | ✅ I2豪族/I3朝议/派系非线性/宣称追踪 |
| J 技能框架 | ✅ SKILL_REGISTRY(10)+SKILL_INLINE(14) |
| K 经济再平衡 | ✅ 预算系统/军饷/补员 |
| L 集结系统 | ✅ 渐进集结/手动补员删除/堆叠修复/AP解冻 |
| E3 科技树 | ✅ v115: 49节点/5分支/29效果接入/UI面板/武将绑定 |
| E2 特色兵种 | ✅ v116: 11个城市绑定王牌兵种/出厂Lv10/双轨补员/藤甲惧火 |

### Feature接入审查机制（Grep-Driven Checklist）

#### 设计原则

代码已21000+行，不可能靠记忆判断新feature影响哪些位置。采用**实装前grep扫描**机制：

1. **确认改动目标**：这个feature修改/新增了什么数据？
2. **grep扫描**：在代码中搜索相关关键词，列出所有命中位置+行号
3. **三级分类**：
   - 🔴 **需要改动**：不改就功能缺失或报错
   - 🟡 **需要检查**：可能自动兼容（有fallback），但需验证数值是否合理
   - ⚪ **无关**：命中关键词但不受影响
4. **生成适用checklist**：只列本次feature实际需要检查的项，跳过不适用的
5. **提交review**：扫描报告发给用户确认后再动手写代码

#### 通用检查项（每次都过一遍，但标注"适用/不适用"）

```
□ 核心数据表是否需要扩展
□ UI展示点是否需要同步（grep TROOP_TYPES/showBreakdown等，按命中结果判断）
□ AI路径是否同步（grep aiDo*/runAI相关函数）
□ 玩家路径是否同步（grep confirm*/open*Modal）
□ 武将锁定/过滤是否涉及新占用状态
□ 费用计算 vs 费用展示是否一致
□ 存档序列化是否覆盖新字段
□ 常量是否需要函数化
□ 迷雾/快进模式是否需要特殊处理
□ 语法验证通过
□ 无头测试通过（50旬快进零bug）
```

#### 判断"适用/不适用"的核心逻辑

不是每个feature都需要全部检查。判断依据是**沿数据流追踪下游**：
- feature修改了一个**已有数值的计算**（如铁产量+10%）→ 追踪该数值在哪些UI被展示
- feature**扩展了一张数据表**（如新增兵种）→ 追踪该表在哪些地方被读取
- feature**新增了一种占用状态**（如武将研究中）→ 追踪所有"选将"入口是否过滤
- feature是**纯UI改动**（如美化）→ AI路径、费用计算等均不适用

注意区分同名但不同流向的数据。例如"铁产出"（城市每旬产铁）和"铁消耗"（征兵花铁）是独立数据流，修改铁产出不需要检查征兵弹窗。

---

### 特色兵种（E2）— 实装前扫描报告

> 本报告为v116实装准备。基于v115代码grep生成。

#### Feature定义

新增势力专属兵种（如丹阳兵、西凉铁骑等），本质：**扩展 `TROOP_TYPES` 表 + 新增势力限定过滤**。

#### 🔴 需要改动（不改则功能缺失/报错）

| 行号 | 位置 | 原因 |
|------|------|------|
| 13624 | `TROOP_TYPES` 定义 | 新增兵种条目（name/icon/ap/recruit/fac限定） |
| 14987-14998 | `TYPE_ATK` / `TYPE_DEF` | 新兵种攻防基础乘数 |
| 15007-15018 | `TYPE_MATCH_MULT` 5×5矩阵 | 扩展为N×N，新兵种克制关系 |
| 15020-15030 | `TERRAIN_TROOP_MULT` | 新兵种地形修正 |
| 13633-13648 | `MIXED_COMBO_MULT` 混编乘数表 | 新兵种与旧兵种的混编组合 |
| 2317 | 移动消耗特判（siege非平原×2） | 新兵种是否需要类似特判 |
| 8009-8014 | AI征兵选兵种逻辑 | AI需能选到新兵种，且按势力过滤 |
| 19203 | 征兵弹窗兵种选择列表 | 玩家可选兵种需按势力过滤 |
| 2438-2516, 3118-3139 | 93位武将apt定义 | 每个武将补新兵种适性等级 |

#### 🟡 需要检查（可能自动兼容）

| 行号 | 位置 | 说明 |
|------|------|------|
| 15087 | `gen?.apt?.[sq.type]` 适性读取 | 无新key则fallback `'B'`——可接受但不精确 |
| 15095, 15102 | `squadATK`/`squadDEF` | `TYPE_ATK[sq.type]||1.0` fallback——不崩但数值不对 |
| 15132-15155 | `getTypeMatchMult`/`getTerrainMult` | 新兵种不在矩阵则fallback 1.0——克制失效 |
| ~20处 | 所有 `TROOP_TYPES[sq.type]?.icon` UI展示点 | 自动兼容——只要TROOP_TYPES有条目即可 |
| 783, 795 | `addAptExp` 适性经验 | 自动兼容——只要apt有对应key |
| 13751-13752 | `calcUnitAP` | 自动兼容——读 `TROOP_TYPES[q.type]?.ap` |
| 19161, 19338 | 征兵资源消耗 | 自动兼容——读 `TROOP_TYPES[type]?.recruit` |

#### ⚪ 无关

| 行号 | 位置 | 说明 |
|------|------|------|
| 4483-4573 | `initGame` 开局部队 | 初始部队type硬编码，不影响（除非开局就用特色兵种） |
| 6381, 6385 | 驻军战力估算 | 硬编码heavy，无关 |
| 7784 | billet存储`sq.type` | 透传字段，自动兼容 |

#### 本次适用checklist

```
■ 核心数据表扩展
  □ TROOP_TYPES（定义+icon/ap/recruit）
  □ TYPE_ATK / TYPE_DEF（攻防乘数）
  □ TYPE_MATCH_MULT（克制矩阵5×5→N×N）
  □ TERRAIN_TROOP_MULT（地形修正）
  □ MIXED_COMBO_MULT（混编乘数）
  □ 武将apt（93位武将补新兵种适性）

■ 势力限定逻辑（新增）
  □ 征兵弹窗兵种列表按势力过滤
  □ AI征兵选兵种按势力过滤
  □ 移动消耗特判

■ 自动兼容验证
  □ 约20处TROOP_TYPES[sq.type]?.xxx UI展示——确认有条目即可
  □ squadATK/squadDEF fallback数值合理性
  □ 适性经验系统

■ 不适用（本次跳过）
  ✗ breakdown浮窗——无新数值modifier
  ✗ 费用计算一致性——公式不变，只是新recruit材料
  ✗ 存档序列化——type是字符串，自动覆盖
  ✗ 武将锁定/过滤——不涉及新占用状态
  ✗ 迷雾/快进——不涉及
```

### v116 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v117.html |
| 总行数 | ~21714行 |
| 武将总数 | 魏29/蜀22/吴21（共72位势力将领）+ 20位在野武将 |
| 城市数 | 45城市（魏20/蜀10/吴15），11城绑定特色兵种 |
| 科技节点 | 49个（经济10/军事13/练兵9/政治8/民生9） |
| 右侧面板 | 8个Tab（城池/军事/武将/官职/外交/派系/科技/统计） |
| 技能系统 | SKILL_REGISTRY(10)+SKILL_INLINE(14)，18将有技能 |
| 部队状态类型 | garrison / march / halt / camp / ambush / siege |
| 兵种 | 5基础 + 11特色（城市绑定王牌） |
| 渲染优化 | renderMap增量更新（分层DOM），静态层+迷雾层+城市层缓存 |


---

## v116 特色兵种系统（E2）

### 设计概述

城市绑定王牌兵种系统。11个特色兵种分别绑定11座城市，谁占城谁能征募。本质是现有5基础兵种的强化版（ATK/DEF +15%左右），出厂即Lv10，造价×1.7（马匹除外），单势力最多3个squad同编制。补员双轨制：本地部分看绑定城人口（丢城归零），全国部分照旧。

### 11个特色兵种

| # | 绑定城市(id) | key | 名称 | icon | baseType | AP | 典故 | 初控 |
|---|-------------|-----|------|------|----------|----|------|------|
| 1 | 建业(jianye) | danyang | 丹阳兵 | 🔥 | light | 3 | 丹阳山越剽悍善战 | 吴 |
| 2 | 天水(tianshui) | xiliang | 西凉铁骑 | ⚔ | cavalry | 6 | 马腾马超西凉铁骑 | 魏 |
| 3 | 陈留(chenliu) | hubao | 虎豹骑 | 🐯 | cavalry | 6 | 曹纯曹真精锐亲卫 | 魏 |
| 4 | 成都(chengdu) | wudu | 无当飞军 | 🪶 | archer | 3 | 诸葛亮南中叟兵 | 蜀 |
| 5 | 洛阳(luoyang) | beiwei | 北军精锐 | 🏛 | heavy | 2 | 汉朝北军五校禁卫 | 魏 |
| 6 | 建宁(jianning) | rattan | 藤甲兵 | 🌿 | heavy | 2 | 南蛮藤甲惧火 | 蜀 |
| 7 | 汉中(hanzhong) | qiangbing | 羌兵 | 🏹 | light | 3 | 氐羌山地游击 | 蜀 |
| 8 | 寿春(shouchun) | danqi | 淮南突骑 | 🐴 | cavalry | 6 | 淮南骑兵传统 | 吴 |
| 9 | 永安(yongan) | baier | 白毦兵 | 🦅 | heavy | 2 | 陈到刘备亲卫 | 蜀 |
| 10 | 濮阳(puyang) | xianzhen | 陷阵营 | 💀 | heavy | 2 | 高顺攻无不克 | 魏 |
| 11 | 许昌(xuchang) | piliche | 霹雳车营 | 💥 | siege | 1 | 曹操官渡霹雳车 | 魏 |

分布：魏5（天水/陈留/洛阳/濮阳/许昌）、蜀4（成都/汉中/建宁/永安）、吴2（建业/寿春）

### 数值

ATK/DEF: danyang 1.15/1.15, xiliang 1.28/1.24, hubao 1.30/1.26, wudu 1.22/1.06, beiwei 1.04/1.30, rattan 0.82/1.40, qiangbing 1.12/1.10, danqi 1.24/1.20, baier 1.02/1.28, xianzhen 1.10/1.24, piliche 0.68/0.62

### 核心机制

**baseType映射**：克制/地形/混编/适性全部映射回baseType（5基础类型），不扩矩阵。改动点：getTypeMatchMult/getTerrainMult/getMixedComboMult/`_squadBase`适性/addAptExp

**出厂Lv10**：eliteLevel=10。征兵和扩编中 unit.level = max(eliteLevel, getInitLevel)

**征兵成本×1.7**：costMult=1.7。gold和iron/wood均×1.7，horses×1.0不涨。军饷军粮不受影响。

**单势力3 squad上限**：maxSquads=3。检查时机：征兵弹窗(灰化)+confirmRecruit(拦截)+AI征兵(过滤)

**城市绑定过滤**：homeCity字段。征兵弹窗只在绑定城显示。AI征兵combatTypes动态构建。

**补员双轨制**（processReinforcement）：特色兵种front看绑定城人口（丢城→front=0），rear照旧。绑定城丢失时无BASE保底。

**藤甲惧火**（applyFireEffect）：rattan受火攻额外×1.40

**AI行为**：_aiScoreTarget elite城市×1.30；AI征兵elite偏好+0.15；AI costMult重算

### 改动清单（24处）

TROOP_TYPES+11 / TYPE_ATK+11 / TYPE_DEF+11 / getTypeMatchMult baseType / getTerrainMult baseType / getMixedComboMult baseType / _aiScoreTarget +30% / AI征兵combatTypes动态化 / AI征兵getAptMult baseType / AI征兵costMult+eliteLevel / applyFireEffect rattan / processReinforcement双轨 / troopRow过滤+UI / calcSlotMatCost costMult / 弹窗costGold / 弹窗显示 / confirmRecruit全套 / confirmExpand costMult+eliteLevel / AI扩编costMult+eliteLevel / renderExpandModal / _squadBase apt / addAptExp baseType / 部队面板apt / 征兵弹窗apt

### 完整待办清单（v116基准）

🔴 高优先级：1.存档/读档(~100行) 2.胜利条件(~60行) 3.武将技能批量实装(~400行)

🟡 中优先级：4.科技树状可视化(~250行) 5.整体美术(~200行) 6.反伏击/斥候(~80行)

🟢 低优先级：7.E1水战(~250行) 8.新手引导(~120行) 9.190剧本(~500行) 10.音效/BGM

### v116 补员参数再平衡

**问题**：原有 front×1.0 + rear×0.4 导致rear占比极低（均衡策略下仅7%），特色兵种丢城后补员断崖式下跌（-93%），补员策略切换也几乎无感。

**修正**：front×0.68 + rear×2.0，总补员量不变。

| 城市类型 | 均衡策略 f:r | 原来 |
|---------|-------------|------|
| 大城(成都) | 64:36 | 93:7 |
| 中城(汉中) | 44:56 | 85:15 |
| 小城(永安) | 33:67 | 55:45(保底) |
| 小城(建宁) | 25:75 | 37:63(保底) |

**改动3处**：processReinforcement中frontAmt(×0.68)、rearAmt(×2.0)、elite双轨frontAmt(×0.68)

**特色兵种丢城效果**（均衡策略）：无当飞军-66%，羌兵-46%，白毦兵-35%。大城打击大，小城影响小。

### v116 细作探报（侦察计谋）

**机制**：新增第5个计谋「细作探报」，花800金侦察一座邻接己方领土的敌城，成功后该城及其领地范围3旬内变为FOG_VISIBLE。

**参数**：baseRate=0.75（INT=90时约90%成功率），冷却6旬，失败退400金

**数据结构**：
- `G.strategyCD[fid].scout` — 冷却计数
- `G.scoutReveals[]` — `{fid, cityId, expiresAt}` 持续效果列表

**改动6处**：
1. `initGame` — strategyCD加scout:0 + scoutReveals初始化
2. `stratScout()` — 新增函数，邻接检查+费用+成功率+揭雾
3. `_applyScoutReveal()` — 新增函数，目标城市领地territory设VISIBLE
4. `updateFog` Step3.5 — 每旬对未过期scoutReveals持续揭雾
5. `nextTurn` — 清理过期scoutReveals
6. 外交Tab计谋UI — 新增细作探报行（邻接敌城下拉+按钮）

**约束**：只能侦察ROAD_ADJ邻接的敌城，已侦察中的不可重复。AI不使用。

### v116 地图显示优化

- `map-wrap`背景从#c2a06a(淡黄)改为#0a0704(暗色)，消除地图周围刺眼的空白
- 右面板从370px加宽到430px

### v116 军师任命bug修复

**问题**：`openStrategistModal`写入`getElementById('modal')`+`modalBody`，但HTML中modal结构是`id="modal"`+`moBody`，且`closeModal()`关闭的是`genericModal`。导致军师弹窗打不开或无法关闭。

**修复**：改用`genericModal`+`genericModalBody`，与其他弹窗一致。

### v116 敌方城池信息受限

**改动2处**：
1. `_renderCityList`：FOG_UNEXPLORED城市不显示在列表中
2. `_renderCityDetail`：新增`isOwnOrAlly`判定——敌方城市即使FOG_VISIBLE也只显示有限信息（势力、规模大/中/小、有无驻军），不显示人口数字/民心/存粮/建筑等内政。己方+盟友城市正常显示全部详情。

**三级信息可见性**：

| 状态 | 列表 | 详情 |
|------|------|------|
| UNEXPLORED | 不显示 | — |
| EXPLORED | 显示城名+快照势力 | 城名+旧情报势力+??? |
| VISIBLE+敌方 | 显示城名+势力色 | 势力+规模+有无驻军 |
| VISIBLE+己方/盟友 | 完整显示 | 完整内政信息 |

### v116 反间计bug修复

**问题**：UI传了势力+武将名两个参数，但`stratSpy(target)`只接收势力，内部随机选武将，完全忽略下拉选中的武将。

**修复**：`stratSpy(target, genName)` 接收第二个参数，优先用指定武将，找不到才随机fallback。

---

## v117 水墨宣纸风美术重制 + 代码审计

### 美术重制：Dark→Light（水墨宣纸风）

**整体方向**：暗色底金字 → 宣纸底墨字，水墨画质感。

**CSS根变量**：
```css
/* 旧 */  --gold:#c9a227; --panel:rgba(16,11,3,0.94); body{background:#080502}
/* 新 */  --ink:#2c2416; --ink-l:#5c4a32; --ink-ll:#8a7a60;
          --paper:#f5eee1; --paper-warm:#ede4d0;
          --panel:rgba(245,238,225,0.97); body{background:var(--paper)}
```

**字体统一**：
- 全局正文字体：Noto Sans SC → **Noto Serif SC**（29处替换）
- 点睛标题：ZCOOL XiaoWei 保留（logo/城市名/武将名/大标题）
- Google Fonts链接：去掉Noto Sans SC，Serif SC补300/500字重

**颜色映射（旧→新）**：
- 金色 `rgba(201,162,39,*)` → 墨色 `rgba(80,65,40,*)`
- 亮绿 `#40c060` → 深绿 `#1a7a3a`
- 亮红 `#e84040` → 深红 `#c03030`
- 亮蓝 `#4090e0` → 深蓝 `#1a5f8a`
- 势力色：wei `#2980b9`→`#1a5f8a`, shu `#27ae60`→`#1a7a3a`, wu `#c0392b`→`#a82a1a`

**地图改动**：
- 背景 `#0a0704` → `#e8dfc8`，地形色全面降饱和
- 城市图标：暗底亮字 → 亮底描边
- 迷雾：三级差异化（unexplored `rgba(110,100,80,.93)` / explored `rgba(180,170,148,.30)` / visible 透明）
- 地图图例重做：两行5+4色块，加沼泽/官道

**JS内联样式全面替换**（弹窗/tooltip/按钮/进度条等）：
- 模态overlay: `rgba(4,2,0,.88)` → `rgba(0,0,0,.25~.35)`
- 模态面板: `rgba(16,11,3,.98)` → `rgba(245,238,225,.99)`
- 按钮: 暗色实底 → 浅色底+有色描边

**开局势力选择页**：背景改为不透明 `#ede4d0`（消除地图透底）

### 功能新增：城市标签tooltip + 特色兵种图标

- 城市列表（左面板）：每城tag始终显示，hover显示tooltip描述
- 城市详情（右面板）：tag行 + 特色兵种badge
- 特色兵种badge：`tag-elite` CSS类，红色调，tooltip显示"特色兵种：XXX（谁占城谁可征募）"
- tag/elite badge均视为地理公共信息，不受迷雾限制

### 代码审计（8 pass，逐模块）

#### Bug修复汇总（4个🔴 + 1个结构修复）

| Pass | Bug | 行号 | 根因 | 修复 |
|------|-----|------|------|------|
| 4 | AI朝议粮食判断永远失灵 | 4252 | `c.foodStorage` 字段不存在 | → `c.storage` |
| 4 | 自然灾害用像素坐标判南北 | 6101,6118 | `c.y`(px) 依赖渲染尺寸 | → `c.r`(hex row)，阈值 `<19`/`>27` |
| 5 | AI守军出城坐标丢失 | 7647-7662 | hexNeighbors返回`{col,row}`但代码用`[c,r]`解构 | 改用 `nb.col`/`nb.row` |
| 8 | 伏击火攻无资源校验 | 15497-15511 | `if(资源检查)` 条件行被删只剩注释 | 补回 `if(fac && gold>=cost && wood>=cost)` |
| 8 | 迷雾+城市缓存同旬不刷新 | 10958-10988 | 缓存key用 `G.turn`，同旬多次渲染命中旧缓存 | 改用递增 `_fogCacheVersion`/`_cityCacheVersion` |

#### 代码清理汇总

| 项 | 改动 |
|-----|------|
| YEARS数组4→1 | 3处局部重复定义删除，统一引用顶级常量（"建安二十四年"全称） |
| 死代码spawnRef | 叛乱函数中无用像素坐标计算删除 |
| doTransfer补silent参数 | 长期补给线静默调粮不再刷log/renderAll |
| calcUnitATK/DEF性能 | `ALL_GENS.find()` O(n) → `GEN_MAP[]` O(1) |
| processCityFood注释 | 说明科技+官职双层粮产加成是设计意图 |

#### 数据补全：13个势力将GEN_TAGS

| 武将 | 势力 | origin | region | combat | 依据 |
|------|------|--------|--------|--------|------|
| 李典 | 魏 | gentry | zhongyuan | neutral | 山阳巨野李氏 |
| 臧霸 | 魏 | humble | zhongyuan | hawk | 泰山群寇 |
| 蒋济 | 魏 | gentry | zhongyuan | dove | 楚国平阿 |
| 刘晔 | 魏 | gentry | zhongyuan | neutral | 淮南成德，汉室宗亲 |
| 朱灵 | 魏 | humble | hebei | hawk | 冀州清河 |
| 牛金 | 魏 | humble | zhongyuan | hawk | 曹仁部将 |
| 陈群 | 魏 | gentry | zhongyuan | dove | 颍川许昌 |
| 严颜 | 蜀 | humble | yizhou | hawk | 巴郡老将 |
| 邓芝 | 蜀 | gentry | jingzhou | neutral | 南阳新野 |
| 黄权 | 蜀 | gentry | yizhou | dove | 巴西阆中 |
| 步骘 | 吴 | gentry | jiangdong | dove | 临淮→江东 |
| 贺齐 | 吴 | humble | jiangdong | hawk | 会稽山阴 |
| 顾雍 | 吴 | gentry | jiangdong | dove | 吴郡吴县 |

#### 朝议弹窗颜色修复

- 未选中卡片背景：`rgba(30,24,16,.6)` → `rgba(255,252,245,.50)`
- 提案人名色：`#e8d8a0`(金) → `#6b5530`(墨)
- 效果数值色：`#8c8`(亮绿) → `#1a7a3a`(深绿)

### 审计进度

| Pass | 模块 | 行范围 | 状态 | 发现 |
|------|------|--------|------|------|
| 1 | CSS + HTML骨架 | 1–625 | ✅ 清理 | 🟡暗色×5 + 死代码清理 |
| 2 | 常量 + 数据表 | 625–2350 | ✅ 干净 | 无bug，吴实际21将(非22) |
| 3 | 武将 + 派系数据 | 2350–4120 | ✅ 补全 | 13将GEN_TAGS缺失→已补 |
| 4 | 经济 + 初始化 + 事件 | 4120–6130 | ✅ 修复 | 🔴×2 |
| 5 | AI系统 | 6130–8650 | ✅ 修复 | 🔴×1 |
| 6 | 外交 + 策略 + 回合 | 8650–10070 | ✅ 修复 | 🔴×2（忠诚写入错字段） |
| 7 | 渲染 + UI面板 | 10070–13770 | ⏳ 未做 | — |
| 8 | 战斗 + 交互 | 13770–21860 | ✅ 修复 | 🔴×1 + 缓存🔴×1 |

### 已知残留问题（下轮处理）

1. ~~**迷雾explored/visible对比度不够**~~ ✅ v118已修复
2. ~~**部队移动迷雾实时更新**~~ ✅ v118已修复（pFog空值兜底bug）
3. Pass 1/6/7 审计待做

### v117 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v117.html |
| 总行数 | ~21867行 |
| 武将总数 | 魏29/蜀22/吴21（共72位势力将领）+ 20位在野武将 |
| GEN_TAGS覆盖 | 92/92（72势力+20在野，100%覆盖） |
| 字体 | Noto Serif SC（主力）+ ZCOOL XiaoWei（点睛） |
| 美术风格 | 水墨宣纸风（浅底深字） |
| 缓存机制 | 迷雾/城市SVG均改为递增版本号（支持同旬多次刷新） |

---

## v118 迷雾对比度增强 + 缓存兜底修复

### 1. 迷雾 explored 对比度增强

**问题**：explored 覆盖层 `rgba(180,170,148,.30)` 和 visible（透明）差异过小，玩家难以区分。

**修复（3处）**：

| # | 位置 | 旧值 | 新值 |
|---|------|------|------|
| 1 | `_getFogSvgCache` explored fill | `rgba(180,170,148,.30)` | `rgba(170,160,138,.48)` |
| 2 | `_getFogSvgCache` explored stroke | `rgba(165,155,135,.32)` sw=0.3 | `rgba(155,145,125,.50)` sw=0.5 |

**三级迷雾最终参数（v118）**：

| 状态 | fill | stroke | 
|------|------|--------|
| unexplored | `rgba(110,100,80,.93)` | `rgba(95,85,68,.95)` sw=0.5 |
| explored | `rgba(170,160,138,.48)` | `rgba(155,145,125,.50)` sw=0.5 |
| visible | 透明 | — |

### 2. 迷雾缓存 pFog 空值兜底修复

**问题**：`_getFogSvgCache` 中 pFog 为空时，`_fogCacheTurn` 被赋值为 `G.turn` 而非 `_fogCacheVersion`，导致版本号比较体系断裂——后续 `invalidateFogCache()` 递增 `_fogCacheVersion` 后，`_fogCacheTurn`（=G.turn）可能意外等于新版本号，命中旧缓存。

**修复**：`_fogCacheTurn = G.turn` → `_fogCacheTurn = _fogCacheVersion`（1行）

### 3. 行军迷雾揭开动画黑块修复（_animateFogReveal）

**问题**：`_animateFogReveal` 的遮罩颜色仍是 v117 美术重制前的暗色系（`rgba(12,6,2,.52)` / `rgba(8,4,1,.88)`）。在宣纸风浅底地图上，fade-out 期间显示为刺眼的黑色 hex 块。且逐格行军时上一步的动画层可能尚未移除就叠加了新层。

**修复（2处）**：
1. 遮罩颜色改为匹配当前迷雾色值：explored `rgba(170,160,138,.48)` / unexplored `rgba(110,100,80,.93)`
2. 函数开头新增 `svg.querySelectorAll('.fog-reveal-anim').forEach(el => el.remove())`，清理残留动画层；`<g>` 增加 `class="fog-reveal-anim"` 供清理选择器使用

### 4. ★ 行军迷雾不刷新根因修复（renderMap增量路径遗漏fogLayer）

**问题**：v115 增量渲染优化中，`renderMap` 在 `mapRoot` 已存在时走增量路径，只更新 citiesLayer / siegeLayer / unitsLayer / moveLayer 四个命名层。**迷雾SVG直接拼在 `h` 字符串中，没有独立的 `<g id>` 包裹，增量路径完全跳过迷雾层更新。** 导致：
- `updateFog()` 正确更新了 `G.fog` 数据
- `invalidateFogCache()` 正确递增了版本号
- `_getFogSvgCache()` 在增量路径中被调用但结果写入了 citiesLayer 之前（实际上根本没被调用——增量路径不走 `h += _getFogSvgCache()` 那段代码）
- 迷雾DOM始终停留在首次全量渲染时的状态
- 行军揭雾动画 fade-out 后，底层旧迷雾DOM仍在，视觉上迷雾"没有揭开"

**修复（2处）**：
1. 迷雾SVG包裹 `<g id="fogLayer">...</g>`（全量构建路径）
2. 增量路径新增：`const fl = document.getElementById('fogLayer'); if(fl) fl.innerHTML = _getFogSvgCache();`

**影响范围**：所有触发 `renderMap()` 的场景（行军/回合结束/城市选中等）现在都能正确刷新迷雾层。此前只有首次加载或浏览器刷新后的第一次 `renderMap` 能正确显示迷雾。

### 行军迷雾实时更新验证

代码流程审读确认无短路问题：
1. `_execInstantMarch` 每步：`updateFog()` → `invalidateFogCache()` → `renderMap()` → `_getFogSvgCache()`（cache miss → 重建）
2. `renderMap` 无额外缓存层或 early return（除了 `!svg` 检查）
3. pFog 空值兜底修复后，版本号比较体系完整

### v118 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v118.html |
| 总行数 | ~21869行 |
| 迷雾explored opacity | .48（v117为.30） |
| 待做审计 | ✅ 全部8个Pass已完成 |

### 代码审计 Pass 7 — 渲染 + UI面板（行10070–13770）✅

**结论**：无新增功能性 bug。v118 已修的4个迷雾问题是此范围内最重要的发现。

**🟡 暗色系残留修复（~16处颜色替换）**：

| # | 位置 | 旧值 | 新值 |
|---|------|------|------|
| 1 | `toggleOverlay` 激活态 | `rgba(50,35,5,.95)` 暗底 + `rgba(240,200,80,1)` 金字 | `rgba(220,210,190,.95)` 宣纸底 + `rgba(44,36,22,.9)` 墨字 |
| 2 | `toggleOverlay` 非激活态 | `rgba(8,5,2,.85)` 纯黑 | `rgba(245,238,225,.85)` 半透明宣纸 |
| 3 | 4个 overlay 图例框 | `fill="rgba(12,8,2,.90)"` + 金色文字 | `fill="rgba(245,238,225,.94)"` + 墨色文字 |
| 4 | `renderFactionTab` 标题 | `#e8c43c`（金色） | `var(--ink)` |
| 5 | 派系武将名 | `#e0c97f`（金色） | `var(--ink-l)` |
| 6 | 派系小字 `#555`/`#666`/`#ccc` | 暗底高对比灰 | `rgba(92,74,50,.45)` / `rgba(44,36,22,.7)` 等宣纸风色值 |
| 7 | 朝议令颜色 | `#8c8`（亮绿） | `#1a7a3a`（深绿） |
| 8 | 称帝按钮disabled | `#555` | `rgba(92,74,50,.35)` |

### 代码审计 Pass 6 — 外交 + 策略 + 回合（行8650–10070）✅

**🔴 Bug × 2**：

| # | Bug | 行号 | 根因 | 修复 |
|---|-----|------|------|------|
| 1 | 军师任免忠诚无效 | 9271,9276 | `setStrategist` 写入 `gen.loyalty`（武将对象的旧字段），忠诚系统用 `G.genLoyalty[name]` 为唯一真值源。+5/-2 忠诚变化静默丢失。 | 改为写 `G.genLoyalty[name]` + 同步 `G.loyaltyAccum` |
| 2 | 反间计忠诚无效 | 9396-9397 | `stratSpy` 同上，`victim.loyalty -= 15` 写的是武将对象旧字段，-15 忠诚和下野判定都基于错误值。 | 改为读写 `G.genLoyalty[victim.name]` + 同步 `G.loyaltyAccum` |

**🟡 暗色残留 × 1**：太守弹窗 `hintCol` `#888` → `rgba(92,74,50,.45)`

**✅ 干净（无bug）**：

| 模块 | 说明 |
|------|------|
| 外交行动（送礼/停战/结盟/解盟/宣战） | 状态机转换正确，CD/acted/金扣除顺序正确 |
| AI外交（aiDoDiplo） | 宣战/求和/称臣判定逻辑完整，人格参数接入正确 |
| 宣称系统（C3） | 准备/就绪/过期/结算/清除全链路正确 |
| 信誉度 | 惩罚/恢复/修正系数三函数一致 |
| 豪族系统（I2） | processGentry delta计算正确，开城投降逻辑完整 |
| 共同抗敌外交加成 | 去重逻辑正确 |
| checkDiplo 阈值转换 | 先阈值后漂移，顺序正确 |
| tickStrategyCDs | 仅玩家（AI不使用计谋），符合设计 |

**审计进度**：

| Pass | 模块 | 状态 |
|------|------|------|
| 1 | CSS + HTML骨架 | ✅ 清理（🟡暗色×5 + 死代码） |
| 2 | 常量 + 数据表 | ✅ 干净 |
| 3 | 武将 + 派系数据 | ✅ 补全 |
| 4 | 经济 + 初始化 + 事件 | ✅ 修复 🔴×2 |
| 5 | AI系统 | ✅ 修复 🔴×1 |
| 6 | 外交 + 策略 + 回合 | ✅ 修复 🔴×2 |
| 7 | 渲染 + UI面板 | ✅ 修复（🟡暗色×16处） |
| 8 | 战斗 + 交互 | ✅ 修复 🔴×1 + 缓存🔴×1 |

### 代码审计 Pass 1 — CSS + HTML骨架（行1–625）✅

**结论**：无功能性 bug。清理暗色残留和死代码。

**🟡 暗色系残留修复（5处HTML内联 + 2处JS重置）**：

| # | 位置 | 旧值 | 新值 |
|---|------|------|------|
| 1 | 朝议弹窗标题 | `#f0d870`（金色） | `var(--ink)` |
| 2 | 遭遇战标题 | `#f0d870`（金色） | `var(--ink)` |
| 3 | 迎战按钮 | `#f08080` 亮红 | `#c03030` 深红 |
| 4 | 撤退按钮 | `#80a0e0` 亮蓝 | `#1a5f8a` 深蓝(魏色) |
| 5 | 敌方面板文字 | `rgba(200,100,100,.8)` | `#c03030` |
| 6-7 | JS按钮重置代码 | 同上旧值 | 同上新值 |

**代码清理**：

| # | 改动 |
|---|------|
| 1 | 删除重复 `.gen-item` CSS规则（2条→1条） |
| 2 | 删除空 `handleKeyDown` 占位函数（行627，被行13772覆盖） |
| 3 | 删除未使用CSS变量：`--parch`、`--accent`、`--paper-deep` |
| 4 | Google Fonts 字重精简：`300;400;500;600;700;900` → `400;600;700;900`（去掉未使用的300/500） |

**遗留（不修）**：版本号不统一（title v1.2 / logo v0.9 / header v1.0）— 等正式发版时统一。

### 🎉 全部8个审计Pass完成

| Pass | 🔴功能Bug | 🟡美术残留 | ✅代码清理 |
|------|----------|-----------|-----------|
| 1 CSS骨架 | 0 | 5+2处 | 4项 |
| 2 常量数据 | 0 | 0 | 0 |
| 3 武将派系 | 0 | 0 | 13将GEN_TAGS |
| 4 经济初始化 | 2 | 0 | 0 |
| 5 AI系统 | 1 | 0 | 0 |
| 6 外交策略 | 2 | 1处 | 0 |
| 7 渲染UI | 4(迷雾) | 16+处 | 派系icon升级 |
| 8 战斗交互 | 2 | 0 | 0 |
| **合计** | **11** | **~25处** | **多项** |

---

## v118 横切审计 — 链路1：忠诚度全生命周期 ✅

**方法**：全文 grep 所有 `.loyalty` 读写点 + 所有 `G.genLoyalty[]=` 写入点，逐一检查是否同步 `G.loyaltyAccum`。

**背景**：忠诚系统有两层数据——`G.genLoyalty[name]`（整数真值，UI读取）和 `G.loyaltyAccum[name]`（浮点累加器，`processLoyalty` 每旬用它计算微量变化后写回 `genLoyalty`）。如果直接改 `genLoyalty` 而不同步 `loyaltyAccum`，下一旬 `processLoyalty` 会用旧的 `loyaltyAccum` 覆盖掉修改，等于白改。

**🔴 Bug × 4（loyaltyAccum 未同步）**：

| # | 位置 | 场景 | 后果 |
|---|------|------|------|
| 1 | `recruitWild` (行5711) | 在野武将招募，设 loyalty=70 | 下旬被 loyaltyAccum(旧值) 覆盖回80 |
| 2 | 继承人 (行15035) | 新君 loyalty=100 | 下旬被覆盖回旧值（可能60+） |
| 3 | 君主去世惩罚 (行15053) | 全势力 loyalty-5/-10 | 下旬被覆盖，惩罚无效 |
| 4 | 投降武将 (行15075) | surrender loyalty=50±调整 | 下旬被覆盖回旧忠诚值 |

**修复**：4处均在 `G.genLoyalty[name]=` 后增加 `if(G.loyaltyAccum) G.loyaltyAccum[name] = G.genLoyalty[name];`

**✅ 已确认正确的写入点**（10处）：
- `initGame`（惰性初始化兜底） ✅
- `processLoyalty`（从 accum→genLoyalty 方向，无需反向sync） ✅
- `setPrefect` +8/-3 ✅
- `setStrategist` +5/-2（v118已修） ✅
- `stratSpy` -15（v118已修） ✅
- 官职任命/罢免 +8/-3 ✅
- 俘获招降 ✅

**✅ 已确认无旧路径残留**：全文无 `gen.loyalty=` / `g.loyalty=` 直接写入（v118已清除）。

---

## v118 横切审计 — 链路2：城市易手完整性 ✅

**方法**：找出所有 `city.fac = X` 赋值点，对比钩子调用完整性。

**4个易手场景对比**：

| 钩子 | 攻城胜利 | 豪族投降 | 大乱 | 谣言叛乱(修前) |
|------|:---:|:---:|:---:|:---:|
| `invalidateCityCache` | ✅ | ✅ | ✅ | ❌ |
| `city.prefect=null` | ✅ | ✅ | ✅ | ❌ |
| `city.garrison=0` | ✅ | ✅ | ❌ | ❌ |
| `checkEmperorCapture` | ✅ | ✅ | ❌ | ❌ |
| `_aiInvalidateThreatCache` | ✅ | ✅ | ❌ | ❌ |
| `city._supplyRestoreTurns` | ✅ | ✅ | ❌ | ❌ |
| 部队驱逐 | ✅ | ✅ | ✅ | ❌ |
| `updateFogCitySnapshot` | ✅ | ✅ | ✅ | ✅ |

**🔴 Bug × 2**：

| # | Bug | 修复 |
|---|-----|------|
| 1 | **谣言叛乱绕过正常判定**：`stratRumor` 在砍民心后内联了一个独立的叛乱判定（固定35%概率，无garrison检查，无prefect修正），绕过了 `checkRebellions()` 的统一逻辑，且钩子严重缺失 | 删除内联叛乱判定，谣言只管砍民心，叛乱完全由下旬 `checkRebellions()` 统一触发 |
| 2 | **大乱缺4个钩子**：`_triggerMajorRebellion` 缺 `garrison=0`、`checkEmperorCapture`、`_aiInvalidateThreatCache`、`_supplyRestoreTurns` | 补齐4个钩子 |

**✅ 干净**：攻城胜利（最完整）、豪族投降（完整）。

---

## v118 横切审计 — 链路5：资源扣除原子性 ✅

**方法**：全文 grep 所有 `res.gold -=` / `res.iron -=` 等资源扣除点，逐一检查"检查够不够→扣除→执行效果"三步原子性。

**🔴 Bug × 3（材料费遗漏）**：

| # | 位置 | 问题 | 修复 |
|---|------|------|------|
| 1 | `aiDoRecruit` | AI征兵只扣金币，不扣铁/木/马。AI骑兵零马匹征募，弓兵零铁征募。 | 加 `calcSlotMatCost` + `canAffordMat` + `deductMat` |
| 2 | `aiDoExpand` | AI扩编同上，只扣金不扣材料 | 同上 |
| 3 | `confirmExpand`（玩家） | 玩家扩编也只扣金不扣材料，与征兵不一致 | 同上 + 扩编弹窗UI显示材料费 |

**代码重构**：将 `confirmRecruit` 内的局部 `slotMat`/`mergeMat` 提升为全局函数：
- `calcSlotMatCost(type, troops)` — 单分队材料费
- `mergeMatCosts(...costs)` — 合并多个材料费
- `canAffordMat(fid, matCost)` — 检查是否负担得起
- `deductMat(fid, matCost)` — 扣除材料

4个函数定义在 `getUnitTroops` 旁边（行~13970），征兵/扩编/AI征兵/AI扩编4处统一调用。

**✅ 确认正确的消费点**：

| 操作 | 状态 |
|------|------|
| 建设 (`buildBld`) | ✅ 全资源检查+扣除 |
| 科技 (`startTechResearch`) | ✅ `canAffordTech` 全资源检查 |
| 火攻 | ✅ 二次校验金+木 |
| 扎营 | ✅ 检查金+木 |
| 计谋5种 | ✅ 检查金→扣金→失败退半 |
| 外交送礼/停战/结盟 | ✅ 检查金→扣金 |
| 玩家征兵 (`confirmRecruit`) | ✅ 金+材料全检查（已重构为全局函数） |

---

## 🎉 全部5条横切链路审计完成

| 链路 | 🔴 Bug | 修复 |
|------|--------|------|
| 1 忠诚度全生命周期 | 4（loyaltyAccum未同步） | 4处补sync |
| 2 城市易手完整性 | 2（谣言叛乱/大乱缺钩子） | 删内联+补4钩子 |
| 3 部队生命周期 | 0 | — |
| 4 迷雾×信息可见性 | 0 | — |
| 5 资源扣除原子性 | 3（材料费遗漏） | 全局函数+3处补扣 |
| **合计** | **9** | |


---

## v119 自动化压力测试 — 完整性审计系统

### 新增功能

**`runIntegrityAudit()`**（行~21908）：快进100旬后自动扫描 `G` 全局状态，批量断言检查。

**触发方式**：
- 统计Tab "🔍 压测100旬" 按钮（`fastForwardTurns(100).then(runIntegrityAudit)`）
- 浏览器 console 手动调用：`fastForwardTurns(N).then(runIntegrityAudit)` 或单独 `runIntegrityAudit()`
- 快进下拉新增 100旬 选项

### 7 大检查组

| # | 检查组 | 断言内容 |
|---|--------|---------|
| 1 | 资源合法性 | `G.factions[fid].res` 五种资源 + 城市 pop/garrison/morale/popQuality 不为 NaN/undefined/负数 |
| 2 | 兵力NaN/负数 | 所有 `unit.squads[].troops` ≥0 非NaN；`getUnitTroops(u)` ≥50；城市 garrison ≥0 非NaN |
| 3 | loyaltyAccum同步 | `G.genLoyalty[name]` 与 `G.loyaltyAccum[name]` 差值 ≤1.5；两者非 undefined/NaN |
| 4 | 城市fac合法性 | `city.fac` ∈ {wei,shu,wu,rebel}；prefect 所属势力与城市 fac 一致 |
| 5 | 死武将残留 | 部队 squads.genName / 城市 prefect / 军师 / 官职表 中的武将均在活武将池 |
| 6 | 部队结构 | squads 非空；fac/status 为合法枚举值；hq/hr 已定义非NaN |
| 7 | 结构完整性 | 无重复 unit.id；无武将分身（多部队）；genLoyalty 无幽灵武将；城市总数=45；太守势力匹配 |

### 输出

- **Console**：完整报告（每组 pass/fail + 每条异常详情）
- **Alert 弹窗**：摘要（N/7 通过，异常数）
- **游戏日志**：一行摘要

### UI 改动

| 位置 | 改动 |
|------|------|
| 统计Tab 快进栏 | 新增"🔍 压测100旬"按钮（蓝色调，与重置按钮并排） |
| 快进下拉 | 新增 100旬 选项 |

### v119 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v119.html |
| 总行数 | ~22370行 |
| 新增代码 | runIntegrityAudit 函数 (~220行) + UI按钮 (3行) + 下拉选项 (1行) |

### 压测第一轮结果 → 定向修复（50→1→0）

首次压测（100旬）发现 50 个异常，分三类修复：

| # | 问题 | 根因 | 修复 |
|---|------|------|------|
| 1 | `res.food`/`res.horse` = undefined（6个） | **审计误报**：实际字段是 `gold/wood/iron/horses`（复数），food 是城市级不在势力 res 中 | 审计脚本检查项改为 `['gold','wood','iron','horses']` |
| 2 | loyaltyAccum 不存在（23个：3君主+20在野） | `initGame` 行4664 写了 `G.genLoyalty` 但没写 `G.loyaltyAccum`；在野武将下野后不在势力列表中不需要 loyaltyAccum | initGame 补 `G.loyaltyAccum[g.name] = G.genLoyalty[g.name]`；审计改为只检查当前在势力中的武将 |
| 3 | genLoyalty 幽灵条目（21个） | 武将下野后 genLoyalty 条目未清理 + 审计的在野池检查用 `w.name` 但 wildPool 是字符串数组 | 审计改为同时检查 `wildPool.includes(name)` 和 `WILD_GENS.some(w=>w.name===name)` |
| 4 | **下野武将官职/军师残留**（1个：刘晔） | `checkLoyaltyThresholds` 下野路径只调了 `clearPrefectByGen`，没调 `clearAllPostsByGen` 和清军师 | 下野时补 `clearAllPostsByGen(name)` + `strategist=null` 检查 |

### 代码清理

- `// DEBUG:` 标签改为 `// ★ v119:` 保持全文标注风格一致
- 审计函数保留为永久开发工具（非临时 debug 代码）
- `v119fix` 注释保留（与全文 `★ vXXX` 标注一致）

### ✅ 压测任务完成

两轮独立压测均 **7/7 通过**，共修复 2 个游戏 bug + 3 个审计脚本 bug：

| 类型 | 修复 |
|------|------|
| 🔴 游戏Bug | initGame loyaltyAccum 初始化缺失（影响所有武将） |
| 🔴 游戏Bug | 下野武将官职/军师未清理（genPost + strategist 残留） |
| 🟡 审计修正 | 资源字段名 food/horse → 实际不存在，改为 gold/wood/iron/horses |
| 🟡 审计修正 | loyaltyAccum 检查范围过宽，改为只查在势力中的武将 |
| 🟡 审计修正 | wildPool 是字符串数组不是对象数组，增加 WILD_GENS 交叉检查 |

360旬压测亦 7/7 通过。

---

### v119 势力淘汰 + 胜利/失败系统

#### 新增函数

| 函数 | 说明 |
|------|------|
| `checkElimination()` | 每旬末调用，检测势力淘汰（0城+0部队）+ 胜利判定（仅剩1家） |
| `showGameEndOverlay(isVictory, winnerFid)` | 胜利/失败全屏结算画面，水墨宣纸风 |

#### 淘汰逻辑

- **触发条件**：`cityCount === 0` 且该势力无存活部队
- **淘汰后处理**：
  - `G.factions[fid]._eliminated = true` + `_eliminatedTurn` 记录
  - 非君主武将全部流入 WILD_GENS + wildPool（上限8人）
  - 清除太守/官职/军师
  - 外交关系重置为 neutral
  - `runAI` 跳过已淘汰势力

#### 胜利判定

- 三家中仅剩一家未淘汰 → 胜利
- 玩家势力 = 胜者 → "天下一统" 胜利画面
- 玩家势力 ≠ 胜者 → "大势已去" 失败画面
- 玩家被淘汰（非最终胜负）→ 即时失败画面

#### 结算画面设计

- 水墨宣纸风卡片，势力色带 + 印章（统/亡）
- 统计网格：用时/疆域/兵力/人口/武将数/淘汰记录
- 入场动画：背景渐暗 + 卡片 scale+fade
- 两个按钮："继续观战"（关闭遮罩）/"再战天下"（重新选势力）

#### 安全防护

| 位置 | 机制 |
|------|------|
| `nextTurn` 入口 | `G._victoryShown` 时阻止推进（快进除外） |
| `runAI` 入口 | `_eliminated` 势力跳过所有AI逻辑 |
| `fastForwardTurns` 循环 | `alive.length <= 1` 时 break |
| `fastForwardTurns` 结束后 | 检测胜负，弹出结算画面 |

#### 小修复

| 位置 | 修复 |
|------|------|
| 重置按钮 | 补 `mapRoot.remove()` + `invalidateCityCache()` + `invalidateFogCache()` 防城市颜色残留 |
| 压测按钮 | 100旬 → 360旬 |
| 快进下拉 | 新增 360旬 选项 |


---

## v120 开局节奏重构 + 增编分队系统

### 改动A：初始部队缩编

**目标**：开局从"立刻开打"改为"发展窗口期"，迫使玩家/AI先经营再扩军。

**原始配置**（v119）：15支部队，总野战兵力 ~211,000
- 魏 7支 ~105,000
- 蜀 4支 ~44,000
- 吴 4支 ~62,000

**新配置**（v120）：7支部队，总野战兵力 ~39,500，每支仅2分队

| 势力 | 部队 | 驻地 | 分队1 | 分队2 | 兵力 |
|------|------|------|-------|-------|------|
| 魏 | 曹操亲卫 | 许昌 | 曹操·骑3000 | 许褚·重2500 | 5,500 |
| 魏 | 曹仁守军 | 南阳 | 曹仁·重3500 | 满宠·弓2000 | 5,500 |
| 魏 | 张辽前线 | 下邳 | 张辽·骑3500 | 乐进·轻2500 | 6,000 |
| 蜀 | 赵云亲卫 | 成都 | 赵云·骑3000 | 张翼·轻2000 | 5,000 |
| 蜀 | 关羽守军 | 襄阳 | 关羽·轻3500 | 廖化·骑2000 | 5,500 |
| 吴 | 孙策亲卫 | 建业 | 孙策·轻3500 | 程普·重2500 | 6,000 |
| 吴 | 甘宁前线 | 合肥 | 甘宁·骑3500 | 凌统·轻2500 | 6,000 |

**闲将**（不带兵，等待征兵编入）：
- 魏：荀攸、牛金、夏侯渊、郭淮、朱灵、李典、夏侯惇、曹洪、臧霸、徐晃、于禁、蒋济、张郃、典韦、刘晔
- 蜀：张飞、马忠、法正、黄忠、王平、吴懿、严颜、霍峻
- 吴：朱然、吕蒙、韩当、黄盖、丁奉、太史慈、徐盛、潘璋

### 改动B：三国开局全面和平

```js
const DIPLO_INIT = {
  'wei-shu': {status:'neutral', rel:30},  // 原 enemy/15
  'wei-wu':  {status:'neutral', rel:38},   // 不变
  'shu-wu':  {status:'ally',    rel:78},   // 不变
};
```

配合缩编，neutral状态下AI不会主动进攻（需宣战），给5-10旬发展窗口。

### 改动C：增编分队系统（新功能）

**功能**：允许2分队部队在驻扎城市增编第3个分队，填补缩编后的升级路径。

**触发条件**：
- `unit.squads.length < 3`
- `unit.status === 'garrison'`（驻扎己方城市）
- 部队总兵力 < `UNIT_MAX_TROOPS`
- 势力有闲将（`_getIdleGens()`）

**新增函数**：

| 函数 | 说明 |
|------|------|
| `_getIdleGens(fid)` | 获取势力闲将列表（不在部队/太守/军师中的武将） |
| `openAddSquadModal(unitId)` | 打开增编分队弹窗 |
| `closeAddSquadModal()` | 关闭弹窗 |
| `renderAddSquadModal()` | 渲染弹窗内容（选将+选兵种+选兵力+费用） |
| `asPickGen(name)` | 选择武将 |
| `asPickType(tid)` | 选择兵种（含特色兵种支持） |
| `asAdjTroops(delta)` / `asSetTroops(v)` | 调整兵力 |
| `confirmAddSquad()` | 确认增编（扣资源+集结+整备） |

**UI**：
- 部队详情面板（军事Tab）编制区域下方显示 "＋ 增编分队（当前N/3）" 按钮
- 弹窗复用征兵UI风格：武将卡片选择 + 兵种选择 + 兵力滑块 + 费用预览

**新增HTML**：`#addSquadModal` 弹窗（与 `#expandModal` 并列）

**费用机制**：与征兵完全一致（金币+材料+豪族修正+兵营折扣+科技减免）

**集结机制**：与扩编一致（当旬集结第一批，整备1旬，后续按 `getMusterRate` 逐旬集结）

**特色兵种**：支持增编时选择城市绑定的特色兵种（受上限检查）

**Bug修复**：初版误用 `td.city`（不存在字段），修正为 `td.homeCity`（TROOP_TYPES定义的实际字段）；同时修复所属检查从静态 `cityDef.fac` 改为运行时 `atCity.fac`；eliteCards HTML重构为字符串拼接避免嵌套模板字面量语法错误。

### v120 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v120.html |
| 总行数 | ~22586行 |
| 新增代码 | 增编分队系统 (~170行函数) + 弹窗HTML (7行) + UI按钮 (5行) |
| 初始部队 | 7支(原15支)，总兵力~39.5k(原~211k) |
| 初始外交 | 三国全neutral(原魏蜀enemy) |

---

## v121 增编分队Debug + AI增编分队实装

### 🔴 Bug修复 × 4

| # | 位置 | 问题 | 修复 |
|---|------|------|------|
| 1 | **AI缺失增编分队能力** | AI只有 `aiDoExpand`（扩编现有分队兵力）和 `aiDoRecruit`（新建部队），无法把2分队部队升级到3分队。v120开局7支部队全为2分队，AI永远停留在2分队 | 新增 `aiDoAddSquad(fid)` 函数，插入 `aiDoExpand` 和 `aiDoRecruit` 之间 |
| 2 | **`aiDoExpand` 等级加权基数错误** | `oldTroops = sq.troops`（单分队兵力），但 `unit.level` 是部队级属性，应基于部队总兵力加权 | 改为 `oldTotal = getUnitTroops(unit)` |
| 3 | **`confirmExpand`（玩家）同样的等级加权bug** | 同上，玩家扩编也用单分队兵力加权部队等级 | 同上修复 |
| 4 | **`openAddSquadModal` 缺失整备/集结检查** | 部队整备中（`mobilizingTurns>0`）或集结中（`isUnitMustering`）时仍可打开增编弹窗 | 增加 `mobilizingTurns` 和 `isUnitMustering` 前置校验 |

### 新增函数

| 函数 | 说明 |
|------|------|
| `aiDoAddSquad(fid)` | AI增编分队主逻辑（~120行） |

### `aiDoAddSquad` 设计详解

**执行时机**：`runAI` 中 `aiDoExpand` 之后、`aiDoRecruit` 之前（步骤2c）

**选部队逻辑**：
- 筛选：`fac===fid`、`garrison`状态、`squads.length < 3`、无整备/集结
- 排序：1分队优先于2分队，同等时兵力大的优先

**选将**：从 `aiGetAvailableGens(fid)` 取 `com` 最高者（与 `aiDoRecruit` 一致）

**选兵种**：考虑武将适性 + 与现有分队的混编加分（`getMixedComboMult`），特色兵种含 `maxSquads` 上限检查

**费用/集结/整备**：与玩家 `confirmAddSquad` 完全一致（金币+材料+征兵惩罚+等级加权+集结机制+整备1旬）

**限制**：每旬每势力最多增编1支部队（与 `aiDoExpand` 同策略）

### UI改动

| 位置 | 改动 |
|------|------|
| 增编分队按钮条件 | 新增 `mobilizingTurns<=0` 和 `!isUnitMustering(unit)` 检查 |
| `openAddSquadModal` | 新增 `unit.fac === G.playerFac` 安全校验 + 整备/集结前置拦截 |

### v121 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v121.html |
| 总行数 | ~22711行 |
| 新增代码 | `aiDoAddSquad` (~120行) + runAI调用 (1行) + UI修复 (4行) |
| 等级加权修复 | `aiDoExpand` + `confirmExpand` 共2处 |

---

## v122 水墨风地图 + 城楼图标 + 攻城判定修复

### 改动范围

地图视觉层重写 + 城市图标重做 + 攻城战判定逻辑修复。不动其他游戏逻辑。

### 1. `_buildStaticMapCache` 重写为水墨风

**原则**：干净宣纸底 + 浓墨符号。plain=纯留白，靠符号区分地形。

| 地形 | 底色opacity | 符号风格 |
|------|------------|---------|
| plain | 0（透明） | 无（留白） |
| hill | 0 | 皴法弧线，墨色.45 |
| mountain | .04 | 填充三角+副峰+雪顶，墨色.55 |
| forest | .03 | 椭圆树冠群2-3个，墨绿.45 |
| water | .10 | 花青水纹曲线，.35 |
| river | .06 | 花青波纹，.38 |
| swamp | .04 | 芦苇竖笔，.40 |
| impassable | .35 | 重墨折线，.60 |

每个hex符号有伪随机微变（位置/大小/透明度），基于col/row确定性hash。

底色改为更白净的宣纸色：`#f0ebe0` → `#ebe5d8` → `#e2dac8`。无SVG滤镜。

### 2. Hex网格叠加开关

`_mapShowGrid`（默认false）：点击"⬡ 网格"按钮在水墨地形上方叠加半透明hex边框（`rgba(80,65,40,.18)` + `stroke-width 0.35`）。地形渲染始终是水墨风，网格只是叠加辅助线。

### 3. 城楼图标

结构：透明hitbox rect + 城墙基座rect + 城门拱形path + 城楼主体rect + 飞檐屋顶三角path + 城垛锯齿

- 缩放因子 `s = r * 0.65`
- 势力色体现在描边strokeCol上
- 去掉了原来的势力色小圆点（描边已表达势力归属）
- 迷雾/快照/选中逻辑全部保留

### 4. 🔴 攻城判定修复

**问题**：`_checkInstantBattleTrigger` 和 `aiInitiateBattle` 在攻击城内garrison部队时，不检查defender是否在己方城内，一律走野战。

**修复**（两处）：

| 位置 | 修复 |
|------|------|
| `_checkInstantBattleTrigger` (~行20296) | 营寨战else分支内：检查 `defCity.fac === sideB[0].fac && sideB.every(在同一城)`，是则push `siegeBattle:true, siegeCity` |
| `aiInitiateBattle` (~行17320) | 营寨战检测之后、普通野战之前：同样检查，AI vs AI直接调 `resolveSiegeBattle`，有玩家参与则push确认弹窗 |

**兼容性**：`autoResolvePendingBattle`（快进模式）已原生支持 `siegeBattle` flag。`resolveSiegeBattle` 不依赖attacker的siege状态。`_showSiegeBattleConfirm` 只需 `siegeCity` 计算城防倍率。

### 新增全局变量/函数

| 名称 | 说明 |
|------|------|
| `_mapShowGrid` | bool，hex网格叠加开关 |
| `toggleMapStyle()` | 切换网格叠加，清缓存重渲染 |

### v122 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v122.html |
| 总行数 | ~22835行 |
| 新增代码 | `_buildStaticMapCache` 重写 (~130行) + 城楼图标 (~40行) + 切换函数 (12行) + 攻城判定修复 (~30行) |
| 地图风格 | 水墨（常驻） + hex网格叠加（可选） |

### 攻城判定bug根因分析

**为什么以前没这个问题？**

v99之前，战斗由 `checkBattleTriggers` 旬末被动扫描触发。那时攻城的唯一路径是：部队走到城旁 → 进入siege状态 → 从面板点"攻城"按钮 → `startSiegeAssault` → `siegeBattle:true`。这条路径一直有效。

v99引入玩家即时移动后，新增了两条战斗触发快捷路径：
1. **相邻快捷攻击**（`issueUnitMove` 行~19972）：玩家部队与敌军相邻时，直接push战斗确认，跳过行军动画
2. **远距离到达触发**（`_checkInstantBattleTrigger` 行~20281）：玩家部队行军到达后检测

这两条路径在v99设计时**只考虑了野战和营寨战**，没有加攻城判定——因为v99的设计假设是"攻城必须先围城再从面板发起"。但实际玩家体验是：部队移到敌城旁 → 点击城内敌军 → 期望触发攻城战。这个期望与v99快捷路径的行为不匹配。

v100重构废除被动扫描后，`aiInitiateBattle` 成为AI侧唯一触发点，同样只处理了野战和营寨战。

**修复覆盖的3条路径**：

| 路径 | 函数 | 场景 |
|------|------|------|
| 相邻快捷攻击 | `issueUnitMove` | 玩家部队与敌城内部队相邻，点击攻击 |
| 远距离到达触发 | `_checkInstantBattleTrigger` | 玩家部队行军到敌城hex后触发 |
| AI显式发起 | `aiInitiateBattle` | AI部队到达敌城hex后发起攻击 |

**判定逻辑（3处统一）**：
```js
const defNode = getUnitNodeId(defenders[0]);
const defCity = defNode ? G.cities[defNode] : null;
const isSiege = defCity && defCity.fac === defenders[0].fac
  && defenders.every(u => getUnitNodeId(u) === defNode);
```
即：所有defender在同一城市内，且该城市属于defender的势力 → 攻城战。

---

## v123 途经己城不停 + 宣战延迟生效

### 🔴 Bug修复1：途经己方城市中断行军

**问题**：`_execInstantMarch` 行~20195，部队经过己方/友方城市hex时无条件 `interrupted=true; break;`，导致每经过一个己方城市都要重新下移动命令。

**修复**：增加终点判定——只有 `i === walkPath.length - 1 && remainPath.length === 0`（真正的终点）才garrison+中断。途经城市继续行军不停。

### 新功能：宣战当旬不生效

**设计**：宣战后 `status='enemy'`，但 `isHostile()` 在 `_warDeclaredTurn >= G.turn` 时返回false。效果：宣战当旬双方部队无法互相攻击，下旬才算真正敌对。给防守方1旬准备时间。

**改动点**（7处记录 `_warDeclaredTurn`）：

| 位置 | 场景 |
|------|------|
| `diploWar` | 玩家宣战 |
| `aiDoDiplo` | AI宣战 |
| `_syncAllyWarStatus` × 4 | 盟友联动宣战（攻方盟友k1/k2 + 守方盟友k1/k2） |
| 驱虎吞狼计谋 | 谋略触发第三方宣战 |
| 关系破裂（rel≤10） | 自然衰减触发敌对 |

**不加延迟的场景**（已排除）：
- 战斗中de facto宣战（中立方交战自动转enemy）
- 宗主联动参战
- 这些是即时战场反应，不需要准备时间

**`isHostile` 改动**：
```js
function isHostile(facA, facB){
  if(getDiploStatus(facA, facB) !== 'enemy') return false;
  const d1 = G.diplo[`${facA}-${facB}`], d2 = G.diplo[`${facB}-${facA}`];
  const declTurn = Math.max(d1?._warDeclaredTurn||0, d2?._warDeclaredTurn||0);
  if(declTurn > 0 && declTurn >= G.turn) return false;
  return true;
}
```

### v123 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v124.html |
| 总行数 | ~22873行 |
| 修复 | 途经己城不停(1处) + 宣战延迟(isHostile改1处 + _warDeclaredTurn记录7处) |

### 追加修复：营寨战campRole缺失（v99遗留bug）

**问题**：`issueUnitMove`（相邻快捷攻击）和 `_checkInstantBattleTrigger`（远距离到达）push营寨战时缺少 `campRole: 'attacker'`。消费端 `_showNextBattleConfirm` 要求 `campBattle && campRole === 'attacker'` 才弹营寨战弹窗，缺失则fallthrough到普通野战弹窗，camp防御加成丢失。

**修复**：2处push各加 `campRole: 'attacker'`。

| 位置 | 行 |
|------|---|
| `issueUnitMove` 相邻快捷攻击 | ~20001 |
| `_checkInstantBattleTrigger` | ~20357 |

**验证**：全部3个campBattle push点（含 `aiInitiateBattle`）均有 `campRole: 'attacker'`。消费端 `_showNextBattleConfirm` + `autoResolvePendingBattle` + `confirmCampBattle` → `resolveCampBattle` 链路完整。

---

## v124 基建经济重平衡 + 学堂提速 + AI市集权重

### 核心改动：农田/市集从百分比改为base加值

**设计目标**：解决小城基建ROI极低的问题（现状小城市集120旬回本、山地城417旬），让所有城市的基建都有正向回报感。大城槽位有限（5槽）很快建满，玩家自然转向小城——小城建设必须有意义。

**机制变更**：农田/市集效果从"乘以城市产出的百分比"改为"加到城市基础产值(base)上"。加到base上后仍走完整 `× popMult × tagsMult × seasonMod × ...` 链路，与产出体系一致。大城popMult高所以增产绝对值大、回本快；小城popMult低增产小、回本慢——但不再是绝望级别的慢。

**参数（`getCityProd`内`FARM_FLAT`/`MKT_FLAT`常量）**：

| 建筑 | 旧机制 | 新机制Lv1 | Lv2 | Lv3 |
|------|--------|----------|-----|-----|
| 农田 | base.food × (1+Lv×0.15) | base.food **+100** | +190 | +270 |
| 市集 | base.gold × (1+Lv×0.20) | base.gold **+40** | +75 | +105 |

**建造成本同步下调（~15-20%）**：

| 建筑 | Lv1 旧→新 | Lv2 旧→新 | Lv3 旧→新 | 工期不变 |
|------|----------|----------|----------|---------|
| 农田 | 金500木300→**金400木200** | 金900木550→**金700木400** | 金1500木900→**金1200木700** | 2/3/4旬 |
| 市集 | 金600木400→**金500木300** | 金1000木700→**金850木500** | 金1600木1100→**金1400木800** | 2/3/5旬 |

注：农田Lv3工期从5旬缩短为4旬。

**回本旬数对比（Lv1，粮折金@0.3）**：

| 城市 | 规模 | 农田旧→新 | 市集旧→新 |
|------|------|----------|----------|
| 许昌 | 大城 | 24→14旬 | 14→8旬 |
| 南阳 | 中城 | 32→20旬 | 35→13旬 |
| 新野 | 小城 | 111→48旬 | 120→31旬 |
| 梓潼 | 山地 | 417→111旬 | 200→42旬 |
| 建宁 | 最小 | 417→167旬 | 600→71旬 |

**不变的部分**：港口建筑保持百分比（harbLv×0.30）、水利保持乘法（×1.2/1.4/1.6）、马厩/兵营等军事民政建筑全不动。

### 改动点汇总

| # | 位置 | 改动 |
|---|------|------|
| 1 | `BLDS.farm` 定义 (~行886) | 成本降低 + eff描述更新为"基础粮+N" |
| 2 | `BLDS.market` 定义 (~行889) | 成本降低 + eff描述更新为"基础金+N" |
| 3 | `BLDS.school` 定义 (~行896) | eff描述更新为+0.08/+0.15/+0.25 |
| 4 | `getCityProd` (~行4700) | 新增FARM_FLAT/MKT_FLAT常量，effBaseFood/effBaseGold替代旧foodBldMod/goldBldMod；金产的港口乘法拆为独立goldHarbMod |
| 5 | `processCityEconomy` 学堂恢复 (~行4925) | `[0,.03,.06,.10]` → `[0,.08,.15,.25]` |
| 6 | `aiDoBuild.scoreBld` 农田分支 (~行5136) | 用FARM_FLAT差值×popMult×tagsMult计算增产，替代旧prod.food×百分比 |
| 7 | `aiDoBuild.scoreBld` 水利分支 (~行5149) | 改用irrMults比值计算增量，更准确 |
| 8 | `aiDoBuild.scoreBld` 市集分支 (~行5165) | 用MKT_FLAT差值计算增产 + **分数×1.3权重加成** |
| 9 | 城池Tab产出明细(食) (~行13443-13460) | 基础产量行显示"base + 农田加值"；建筑加成行改为仅显示水利 |
| 10 | 城池Tab产出明细(金) (~行13497-13502) | 基础金产行显示"base + 市集加值"；建筑加成行改为仅显示港口 |

### 学堂恢复速度提升

| 等级 | 旧恢复/旬 | 新恢复/旬 | 从pq80→100所需旬数 |
|------|---------|---------|------------------|
| Lv1 | +0.03 | **+0.08** | 667→250旬（约21年→20年计基础0.10） |
| Lv2 | +0.06 | **+0.15** | 334→134旬（约11年→80旬计基础） |
| Lv3 | +0.10 | **+0.25** | 200→80旬（约6.7年→57旬计基础） |

注：基础恢复0.10/旬+士气≥60时+0.04，学堂叠加后Lv3总恢复速率=0.10+0.04+0.25=0.39/旬，从80→100需约51旬（约4.3年），体感合理。

### AI市集建设权重

`aiDoBuild.scoreBld` 市集分支的最终score乘以1.3系数，使AI在同等增产ROI下优先选择市集。金币是AI最通用的资源（可征兵、建设、外交），粮食只要不缺就不急。

### v124 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v124.html |
| 总行数 | ~22873行 |
| 改动文件 | getCityProd重写 + aiDoBuild.scoreBld重写 + BLDS定义×3 + 学堂逻辑×1 + UI产出明细×2 |
| 核心变更 | 农田/市集百分比→base加值 |

### v124 武将扩充（+15人）

| 势力 | 新增 | 新增后总数 |
|------|------|-----------|
| 魏 | 曹真、曹彰、华歆、张绣、曹休 | 29→34 |
| 蜀 | 关平、关兴、张苞、刘封、吴班 | 22→27 |
| 吴 | 周泰、蒋钦、全琮、陆抗、吕范 | 21→26 |
| 在野 | 不变 | 20 |
| **总计** | **+15** | **107** |

三张表同步更新：`GENS_FULL`（属性/适性）、`GEN_META`（技能/官职/派系/关系）、`GEN_TAGS`（四维标签）。`ALL_GENS`/`GEN_MAP` 由代码自动构建，无需手动维护。

新增将领均为1.5线——不是超级明星但各有鲜明典故和辨识度：
- 魏：曹氏宗族三将（曹真/曹彰/曹休）+ 逼宫文臣华歆 + 降将张绣
- 蜀：二代将领（关平/关兴/张苞）+ 悲剧养子刘封 + 外戚吴班
- 吴：护主猛将周泰 + 公正宿将蒋钦 + 外戚全琮 + 末代名将陆抗 + 元从吕范

### v124 标签系统梳理

#### 核心变更：两类标签职责分离

**第一类：GEN_TAGS.origin（派系归属标签，5值）**

| origin值 | 含义 | 派系归属 | 人数 |
|---------|------|---------|------|
| `gentry` | 士族 | → 按region归入对应地域士族派系 | 46人 |
| `humble` | 寒门 | → humble寒门武将派系 | 48人 |
| `clan` | 宗族 | → 运行时判定royalty（需clan字段匹配君主） | 10人 |
| `noble` | 旧阀贵族 | → noble派系（新增） | 3人(马超/马岱/刘封) |
| `foreign` | 外族 | → defector/newcomer（按资历） | 0人(预留) |

旧值`royalty`拆为`clan`（本族宗亲，运行时判定）和`noble`（外部贵族，静态归入noble派系）。

**第二类：GEN_META.values（性格标签，各有独立gameplay效果）**

| 标签 | 效果 | 改动 |
|------|------|------|
| `忠义` | +0.20忠诚/旬，逆境惩罚×0.5 | 合并原义士+忠勇 |
| `野心` | -0.40忠诚/旬，官位加成×1.5，无官额外-0.30 | 从旧-0.60差异化 |
| `投机` | -0.30忠诚/旬，无官额外-0.20，被挖角+20%，可挖角阈值+10 | 从旧-0.60差异化 |
| `汉室死忠` | 宣称/称帝事件忠诚波动 | 不变 |

**删除21个死标签**：枭雄、勇武、边将、权臣、仁主、仁义、公正、功名、务实、刚烈、自保、明哲保身、豪强、死节、廉洁、刚正、孝道、沉稳、法家、稳健、儒雅、汉室宗亲、宗亲(values版)等。

#### 改动点汇总

| # | 位置 | 改动 |
|---|------|------|
| 1 | GEN_META全部values数组(54处) | 批量清理：义士/忠勇→忠义，删除死标签 |
| 2 | `_isClanRoyalty` (~行3749) | 重写：clan字段匹配+relations链判定，不再读values |
| 3 | `getGenFactions` (~行3799) | 新增origin:'noble'分支→noble派系 |
| 4 | `getGenFaction` member路径 (~行3871) | 新增origin:'noble'→return 'noble' |
| 5 | `FACTION_DEFS` (~行3476) | 新增`{id:'noble', label:'旧阀贵族', baseMult:0.8}` |
| 6 | 忠诚显示计算 (~行8498) | 野心-0.40/投机-0.30差异化+无官惩罚拆分 |
| 7 | 忠诚实际处理 (~行8612) | 同上 |
| 8 | `_aiDoPoach` (~行5863) | 投机标签被挖角成功率+20% |
| 9 | `checkLoyaltyThresholds` (~行8767) | 投机标签可挖角阈值45→55 |
| 10 | UI身份展示 (~行4700) | 删除values宗亲/汉室宗亲展示，新增origin:'noble'展示 |
| 11 | VALUE_DESC (~行4709) | 精简为4个有效标签描述 |
| 12 | FACTION_COLORS (~行12947) | 新增noble颜色'#d97706' |
| 13 | origin注释 (~行3298) | 更新为5值说明 |

#### 野心 vs 投机 数值对比

| | 野心 | 投机 |
|---|------|------|
| 基础衰减/旬 | -0.40 | -0.30 |
| 无官额外惩罚 | -0.30 (合计-0.70) | -0.20 (合计-0.50) |
| 官位加成 | ×1.5 | ×1.5 |
| 被挖角成功率 | 正常 | **+20%** |
| 可挖角忠诚阈值 | 45 | **55** |
| 设计意图 | 喂官位就稳 | 给了官也可能跑 |

#### v124 标签系统审计（实装验证）

**审计范围**：GEN_TAGS全部107人origin值、GEN_META全部105条values数组、FACTION_DEFS/FACTION_COLORS/getGenFaction/getGenFactions/忠诚计算/挖角逻辑/UI展示。

**结论：全部13处改动点已正确实装，无遗漏，无预期外副作用。**

| 验证项 | 状态 | 说明 |
|--------|------|------|
| origin 5值覆盖 | ✅ | 107人全有origin，马超/马岱/刘封为noble，0人foreign（预留） |
| values仅4个有效标签 | ✅ | grep确认：忠义56人、空37人、野心4人、汉室死忠4人、投机3人、忠义+汉室死忠1人 |
| 21个死标签已清除 | ✅ | values数组中无任何死标签残留；代码中同名词汇仅出现在描述文本/注释/宣称traits/技能名中，与values系统无交集 |
| noble派系链路 | ✅ | origin:'noble' → getGenFaction return 'noble' → FACTION_DEFS baseMult:0.8 → FACTION_COLORS '#d97706' |
| clan→royalty判定 | ✅ | _isClanRoyalty基于clan字段+relations链，不读values；跨势力clan不匹配时正确fallthrough |
| 野心vs投机差异化 | ✅ | 衰减/无官惩罚/挖角率/阈值四维度全部差异化 |
| 忠义逆境保护 | ✅ | 逆境惩罚×0.5（行8703） |

**残留同名词汇（非标签，无需修改）**：枭雄(宣称traits)、勇武(=武力值war)、仁主(宣称traits)、公正/刚烈/豪强/稳健/儒雅/忠勇(人物desc/技能名/注释)

---

## v125 在野武将招募小传修复

### Bug修复：在野武将招募后无小传

**问题**：`_doRecruitWild`（行~5748）招募成功时执行`G.genChronicle[genName] = []`清空小传数组，但之后没有调用`addGenChronicle`写入初始小传。其他所有加入路径（降将/俘虏/挖角/释放）均有小传写入。

**修复**：在`G.genChronicle[genName] = []`之后，加入小传生成块，复用开局小传的身份标签逻辑（origin→士族/寒门/旧阀贵族、clan→宗亲、combat→主战/持重、values→性格描述、birthplace→籍贯），文案为"应XX之邀出仕"语境。

**改动点**：1处（`_doRecruitWild`函数，+25行）

**武将加入路径小传覆盖审计**：

| 路径 | 函数 | 有小传 |
|------|------|--------|
| 开局 | initGame (~行4718) | ✅ "仕于XX..." |
| 在野招募 | _doRecruitWild (~行5748) | ✅ v125修复："应XX之邀出仕..." |
| AI挖角 | _aiDoPoach (~行5906) | ✅ "XX以厚礼相邀..." |
| 玩家挖角 | 行8840 | ✅ "经人游说，转投..." |
| 俘虏归降 | recruitCaptive (~行15460) | ✅ "兵败被俘，归降..." |
| 俘虏释放回原势力 | releaseGen (~行15477) | ✅ "被俘后蒙释..." |
| 俘虏释放入野 | releaseGen (~行15481) | ✅ "被俘后获释..." |
| 拒降离去 | 行19691 | ✅ "宁死不屈..." |

### 新附/降将资历机制备忘

`seniority()`函数返回武将当前资历等级，非永久身份：

| 资历 | 条件 | baseMult | 说明 |
|------|------|----------|------|
| founding | genJoinSource='founding' | 1.5 | 永久，不受tenure影响 |
| defector | genJoinSource='capture' 且 tenure<180旬 | 0.4 | 俘虏/挖角来源 |
| newcomer | genJoinSource='recruit' 且 tenure<180旬 | 0.6 | 在野招募来源 |
| elder | 任何非founding来源 且 tenure≥180旬 | 按origin重归 | 期满后按origin/home归入正式派系 |
| member | 开局非核心成员 | 按origin归类 | 始终按origin |

180旬=5年（1年=36旬，1旬=10天）。期满后defector/newcomer自动转elder，按GEN_TAGS.origin重新归入士族/寒门/宗亲/noble等正式派系。

### v125 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v125.html |
| 总行数 | ~22977行 |
| 改动 | _doRecruitWild小传生成(+25行) |

---

## v125 武将技能大批实装（+12个武将，总计30人已实装）

### 概述

本轮从107个武将中挑选12个最大牌的未实装武将，完成技能代码实装。同时修复关羽单挑score（+10→+15），清理GEN_META中已实装武将的冗余待实装技能条目（每人只保留1个技能，可多效果）。

### 架构改进

#### genHasOffice 辅助函数（新增）
所有势力级技能的前提从"当官"扩展为"**当官或君主**"。新增`genHasOffice(genName, fid)`函数：
```js
function genHasOffice(genName, fid){
  if(getGenPostDef(genName)) return true;          // 有官职
  if(fid && FAC[fid]?.ruler === genName) return true; // 是君主
  return false;
}
```
全部19处技能condition调用已从`getGenPostDef`替换为`genHasOffice`。

#### _isDefenderThisBattle 标记完善
- `resolveBattle`：攻方设`false`，守方设`true`，战后`delete`
- `resolveAmbush`：伏击成功时受伏方设`true`，设伏方**不标记**（undefined），伏击失败双方不标记（undefined）
- 魏延反骨用`=== false`严格匹配：只有`resolveBattle`攻方（显式false）触发，undefined不触发

### 新增技能清单（12个武将）

| # | 武将 | 技能名 | 类型 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 1 | **郭嘉** | 🧠鬼谋 | INLINE | 所在部队视野+1格 | `getUnitVisionRadius` |
| 2 | **法正** | 🧠睚眦 | REGISTRY | 被攻击时（defender）ATK×1.15 | `onCalcATK` |
| 3 | **魏延** | ⚡反骨 | REGISTRY+INLINE | 进攻方ATK×1.10；与鸽派(combat:'dove')武将亲密度每战额外-2 | `onCalcATK` + `applyBattleIntimacy` |
| 4 | **典韦** | 💪恶来 | INLINE×3 | 单挑score+15；同队武将全部免疫被俘；突围成功率=100% | `resolveDuel` + `collectPrisoners` + `calcBreakoutChance` |
| 5 | **庞统** | 🦅凤雏 | INLINE | 当官/君主时，同旬第2计起成功率+20%，后续叠加（旬初重置计数器） | `_strategyRate` + `nextTurn` |
| 6 | **甘宁** | ⚓锦帆 | INLINE | 所在部队劫营成功率+20% | `calcRaidChance` |
| 7 | **陆逊** | 🔥火营 | INLINE | 攻营战守方DEF加成削弱(1.10→1.00) + 守方士气-5 | `resolveCampBattle` |
| 8 | **吕蒙** | 🎭攻心 | INLINE | 围城时该城豪族支持每旬额外-3.0（促成献城） | `processGentry` |
| 9 | **鲁肃** | 📜榻策 | INLINE | 当官/君主时，送礼好感度+50% | `diploGift` |
| 10 | **曹操** | ⚙奸雄 | INLINE×2 | 当官/君主时，信誉惩罚减半 + 信誉恢复速度×2 | `applyReputationPenalty` + `processReputation` |
| 11 | **贾诩** | 🎭离间 | INLINE | 当官/君主时，**仅反间计**成功率+20%（不影响其他计谋） | `stratSpy`内baseRate+0.20 |
| 12 | **陈群** | 📋九品 | INLINE×3 | 当官/君主时，劝降/在野招募/挖角各+5% | `calcSurrenderRate` + `_doRecruitWild` + `poachGen` |

### Bugfix

- **关羽武圣**：单挑score从+10修正为**+15**
- **魏延REGISTRY去重**：删除重复的SKILL_REGISTRY条目

### 技能名变更

| 武将 | 旧名 | 新名 |
|------|------|------|
| 魏延 | 子午 | **反骨** |
| 周瑜 | 赤壁 | **火神** |

### 诸葛亮技能合并

木牛合并进神算，变为1个技能4个效果：
- ①伏击中伏率±10% ②劫营成功率±10% ③火攻成功率+10% ④调粮损耗减半+速度-1旬

### GEN_META清理

每个已实装武将只保留1个技能条目。删除的冗余待实装条目：

| 武将 | 删除 | 保留 |
|------|------|------|
| 曹操 | 挟天 | 奸雄 |
| 郭嘉 | 遗计 | 鬼谋 |
| 司马懿 | 龟缩 | 冢虎 |
| 贾诩 | 毒士 | 离间 |
| 关羽 | 义绝、过关 | 武圣 |
| 周瑜 | 既生 | 火神 |
| 陆逊 | 忍辱 | 火营 |

### 伏击战技能触发规则

| 场景 | 法正·睚眦 | 司马懿·冢虎 | 魏延·反骨 |
|------|----------|------------|----------|
| 伏击成功，受伏方 | ✅(ATK+15%) | ✅(DEF+15%) | ❌ |
| 伏击成功，设伏方 | ❌ | ❌ | ❌ |
| 伏击失败，任何一方 | ❌ | ❌ | ❌ |
| 正常野战攻方 | ❌ | ❌ | ✅(ATK+10%) |
| 正常野战守方 | ✅ | ✅ | ❌ |

### 全部已实装武将技能总表（30人，44效果点）

**SKILL_REGISTRY（12条，数值类统一调度）**

| 武将 | 技能 | trigger | 效果 |
|------|------|---------|------|
| 马超 | 锦马 | onCalcATK | 骑兵主将ATK×1.12 |
| 黄忠 | 老当(ATK) | onCalcATK | ATK×(1+年份×0.01)上限+10% |
| 法正 | 睚眦 | onCalcATK | defender时ATK×1.15 |
| 魏延 | 反骨 | onCalcATK | 攻方(===false)ATK×1.10 |
| 曹仁 | 坚守 | onCalcDEF | garrison/camp时DEF×1.15 |
| 司马懿 | 冢虎 | onCalcDEF | defender时DEF×1.15 |
| 夏侯渊 | 虎步(DEF) | onCalcDEF | DEF×0.90（攻高防低代价） |
| 黄忠 | 老当(DEF) | onCalcDEF | DEF同ATK公式 |
| 王平 | 险守 | onCalcDEF | 山地/丘陵/森林DEF×1.05 |
| 夏侯渊 | 虎步(AP) | onCalcAP | AP+2 |
| 徐晃 | 长驱 | onCalcAP | 路径>3格AP+1 |
| 荀彧 | 王佐 | onGentry | 当官/君主时豪族+0.3/旬 |

**SKILL_INLINE（32效果点，副作用类原位嵌入）**

| 武将 | 技能 | 效果 |
|------|------|------|
| 诸葛亮 | 神算 | 伏击±10% / 劫营±10% / 火攻+10% / 调粮减半加速 |
| 周瑜 | 火神 | 火攻成功率+20% / 火攻伤害×1.3 |
| 张飞 | 喝阵 | 敌方全体士气-15 |
| 于禁 | 治军 | 己方全体士气+5 |
| 张辽 | 威风 | 以少敌多(敌≥2倍)士气+20（临时） |
| 刘备 | 仁德 | 同队被俘率-15% / 撤退阈值放宽至50% |
| 赵云 | 取将 | 被动单挑触发+15% / score+15 / 同队被俘率-20% |
| 关羽 | 武圣 | 被动+主动单挑触发+15% / score+15 |
| 许褚 | 虎痴 | 单挑score+20 |
| 乐进 | 先登 | 攻城士气+18（临时） |
| 典韦 | 恶来 | 单挑score+15 / 同队免疫被俘 / 突围100% |
| 郭嘉 | 鬼谋 | 部队视野+1格 |
| 甘宁 | 锦帆 | 劫营成功率+20% |
| 陆逊 | 火营 | 攻营守方DEF削弱(1.10→1.00) + 士气-5 |
| 吕蒙 | 攻心 | 围城豪族-3.0/旬 |
| 鲁肃 | 榻策 | 送礼好感+50% |
| 曹操 | 奸雄 | 信誉惩罚÷2 + 恢复×2 |
| 贾诩 | 离间 | 反间计成功率+20% |
| 陈群 | 九品 | 劝降/招募/挖角各+5% |
| 庞统 | 凤雏 | 同旬连续用计第2计起+20%叠加 |
| 魏延 | 反骨(dove) | 与鸽派武将亲密度加速下降-2/战 |
| 张郃 | 巧变 | 地形惩罚（<1.0）向1.0折半，ATK+DEF双生效 |

### v125 技能实装项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v125.html |
| 已实装武将 | 31人（魏13/蜀11/吴7） |
| 已实装技能效果 | 45个（REGISTRY 12 + INLINE 33） |
| 待实装 | 83条GEN_META标记 |
| 新增helper | genHasOffice() |
| GEN_META规范 | 每人最多1技能（可多效果），已实装武将冗余条目已清理 |

### 游戏整体完整度评估

**已完成的核心系统**：
- 战略层：宣称/天子/称帝、外交（送礼/议和/结盟/离间/计谋5种）、信誉度
- 战术层：野战/攻城/营寨战/伏击、单挑（主动+被动）、火攻、撤退/突围
- 经济层：税收/粮产/建筑/贸易、豪族支持、补给系统
- 武将层：107人五维属性+兵种适性、亲密度/相性、忠诚/被俘/招募、57人技能实装
- AI层：三层架构（威胁矩阵→防守→进攻）、三家人格差异化、建设/外交/征兵AI
- 视觉层：水墨宣纸风地图、三级迷雾、战报系统

**剩余主要工作**：
1. 小地图战斗系统（正在别的对话做demo）
2. 平衡性调优

---

## v125 技能审计Bugfix

### 审计范围

对v125全部45个技能效果点（REGISTRY 12 + INLINE 33）逐一代码核对，覆盖：condition/effect逻辑、触发时机、per-unit vs per-faction作用域、战报日志渲染、helper函数（genHasOffice/hasFacGen）正确性。

### 修复内容（3处代码 + 1处标签规范 + handover文档修正）

| # | 位置 | 严重度 | 修复前 | 修复后 |
|---|------|--------|--------|--------|
| 1 | `_strategyRate` (~行9577) | 🔴HIGH | 庞统凤雏用全局计数器`G._pangtongSchemeCount`，所有势力共用 → AI用计会抬高玩家庞统buff，反之亦然 | 改为per-faction计数器`G._factionSchemeCount[fid]`，各势力独立计数 |
| 2 | `nextTurn` (~行10376) | — | 旬初重置`G._pangtongSchemeCount = 0` | 改为`G._factionSchemeCount = {}` |
| 3 | `collectPrisoners` (~行15551) | 🟡MEDIUM | 典韦/刘备/赵云检测扫描所有`units`(跨部队)：典韦在任一败方部队即全员免俘 | 改为per-unit检测：典韦恶来仅保护**同部队**武将，刘备仁德/赵云取将同理 |
| 4 | `getTerrainMult` (~行15677) | 🟢LOW | 张郃巧变缺少`SKILL_INLINE:`注释标签 | 补加`SKILL_INLINE: qiaobian`标签 |

### 文档修正

| # | 位置 | 修正 |
|---|------|------|
| 1 | `_isDefenderThisBattle`伏击描述 | "设伏方设true" → "设伏方**不标记**（undefined）"。代码一直是正确的，文档描述有误 |
| 2 | 技能总表 | 补加张郃·巧变（INLINE于`getTerrainMult`），已实装从30人→31人，效果点44→45 |
| 3 | 快照/里程碑/待办 | 全部同步更新人数 |

### 审计确认无问题的部分

REGISTRY全12条condition/effect/try-catch ✅、genHasOffice 19处调用 ✅、applySkills叠加逻辑 ✅、郭嘉鬼谋视野+1 ✅、法正睚眦defender匹配 ✅、魏延反骨===false严格匹配 ✅、曹操奸雄双效果 ✅、贾诩离间仅反间计 ✅、陈群九品三效果 ✅、鲁肃榻策送礼+50%(仅玩家合理) ✅、吕蒙攻心围城检测 ✅、甘宁锦帆劫营+20% ✅、陆逊火营双效果 ✅、典韦恶来突围100% ✅、典韦恶来单挑+15 ✅、魏延反骨dove亲密度-2 ✅、张郃巧变ATK+DEF双传参 ✅、战报skillLogs去重渲染 ✅

---

## v125 技能第二批实装（+9人，Batch A）

### 概述

9个武将新增技能 + 关羽追加1效果，共12个新效果点。

### 新增技能清单

| # | 武将 | 技能名 | 类型 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 1 | 夏侯惇 | 独眼 | INLINE | 重伤不扣武力（跳过war×0.8） | `getEffectiveStat` |
| 2 | 关羽 | 武圣(追加) | INLINE | 单挑胜利后敌方额外-10士气 | `applyDuelMorale` |
| 3 | 关平 | 孝义 | INLINE×2 | 同unit有关羽时，关平squad士气+5、ATK×1.05（`_xiaoyi_atk`标记+战后cleanup） | `resolveBattle`战前 + `squadATK` |
| 4 | 关兴 | 过关 | INLINE×2 | 单挑触发+5%、score+5 | `tryPassiveDuel` + `resolveDuel` |
| 5 | 张苞 | 喝阵 | INLINE | 敌方全体士气-5（小张飞，父子叠加共-20） | `resolveBattle`战前 |
| 6 | 周泰 | 护主 | REGISTRY+INLINE | 孙权同队DEF×1.10 + 孙权免俘 | `onCalcDEF` + `collectPrisoners` |
| 7 | 张昭 | 柱石 | INLINE | 当官时金产+3% | `processFacEconomy` |
| 8 | 邓芝 | 使吴 | INLINE×2 | 当官时议和/结盟成功率+5% | `diploArmistice` + `diploAlly` |
| 9 | 董允 | 秉公 | INLINE | 当官时武将属性经验×1.20 | `addStatExp` |

---

## v125 技能第三批实装（+17人，Batch B）

### 概述

17个武将新增技能，涵盖围城系统、伏击防御、经济内政、单挑、俘虏、叛乱等多个新hook点。

### 新增技能清单

**魏（6人）**

| # | 武将 | 技能名 | 类型 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 1 | 满宠 | 坚壁 | INLINE | 守城时被围城耐久消耗×0.70（慢30%） | `processSiegeDecay` |
| 2 | 郭淮 | 西境 | REGISTRY | 主将+山地/丘陵 DEF×1.12（不含森林，比王平条件严倍率高） | `onCalcDEF` |
| 3 | 李典 | 协阵 | INLINE | 同unit有张辽/乐进，每人李典squad ATK/DEF+5%（最高+10%） | `resolveBattle`战前 + `_xiaoyi_atk`/`_defBonus` |
| 4 | 刘晔 | 巧思 | INLINE×2 | 当官时：①围城decay+10% ②攻城ATK+5% | `processSiegeDecay` + `resolveSiegeBattle` |
| 5 | 曹真 | 缓进 | INLINE | 在围城部队中时decay+20% | `processSiegeDecay` |
| 6 | 曹彰 | 黄须 | REGISTRY×2 | 主将骑兵非siege状态ATK×1.05/DEF×1.05 | `onCalcATK` + `onCalcDEF` |

**蜀（4人）**

| # | 武将 | 技能名 | 类型 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 7 | 霍峻 | 葭萌 | REGISTRY×2 | garrison状态ATK×1.05/DEF×1.05 | `onCalcATK` + `onCalcDEF` |
| 8 | 黄权 | 持节 | INLINE×2 | 被俘后劝降-20%/被挖角-20% | `calcSurrenderRate` + `poachGen` |
| 9 | 蒋琬 | 稳政 | INLINE | 当官时粮产+5% | `processCityFood` |
| 10 | 费祎 | 折冲 | INLINE | 当官时铁/木+5% | `processFacEconomy` |

**吴（6人）**

| # | 武将 | 技能名 | 类型 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 11 | 太史慈 | 信义 | INLINE×2 | 单挑score+10 + 胜利后敌方-10士气 | `resolveDuel` + `applyDuelMorale` |
| 12 | 潘璋 | 擒将 | INLINE | 胜方有潘璋时俘获率+20%（`collectPrisoners`加`winnerUnits`参数） | `collectPrisoners` |
| 13 | 贺齐 | 平越 | INLINE | 山地/森林战斗时敌方士气-5 | `resolveBattle`战前 |
| 14 | 步骘 | 安南 | INLINE | 当官时南方城市(row≥50)大小叛乱阈值各-5 | `checkRebellions` |
| 15 | 蒋钦 | 严整 | INLINE | 被伏击时士气惩罚减半 | `resolveAmbush` |
| 16 | 丁奉 | 短兵 | REGISTRY×2 | 冬季(seasonIdx=3) ATK×1.10/DEF×1.10 | `onCalcATK` + `onCalcDEF` |

### 新开hook点（Batch B新增）

- `processSiegeDecay` — 围城衰减速率（满宠/曹真/刘晔）
- `resolveAmbush`士气惩罚 — 反伏击防御（蒋钦）
- `processCityFood` — 粮产加成（蒋琬）
- `collectPrisoners`增加`winnerUnits`参数 — 胜方俘获加成（潘璋）
- `checkRebellions` — 叛乱阈值调整（步骘）

### 技能总表更新

REGISTRY 20条（+7: 郭淮1+曹彰2+霍峻2+丁奉2），INLINE 62标签
已实装：57人（魏20/蜀21/吴15/在野1张郃）
待实装：50人

---

## v125 性能优化 + 城市接近性修复

### renderAll降级优化

**问题**：renderAll()被调用50次，其中约60%的场景（外交/官职/招募/建设等UI操作）不涉及地图状态变更，却触发了完整的renderMap重建。

**修复**：29处renderAll()降级为renderAllLight()（跳过renderLeft+renderMap+renderOverlay，仅更新部队层+右侧面板+回合信息）。

| 降级场景 | 数量 |
|---------|------|
| 外交操作（送礼/议和/结盟） | 3处 |
| 官职任免（任命/罢免） | 2处 |
| 招募/挖角/俘虏处置 | 4处 |
| 建筑/科技/调粮 | 4处 |
| 部队状态操作（扎营/伏击/取消/驻扎/扩编等） | 10处 |
| 其他面板交互（选中/缩放/朝议等） | 6处 |

保留renderAll的21处：initGame / nextTurn结束 / 快进 / 重置 / 战斗结算（野战/攻城/营寨/伏击） / 围城到达选择 / 出城迎战 / 行军完成(含fog更新) / 称帝 / 城市选中 / 军事tab点击

### 死代码清理

| 函数 | 行数 | 说明 |
|------|------|------|
| `showTip()` | -50行 | 旧版城市tooltip，已被新tooltip系统完全替代，0处调用 |
| `getFireCost()` | -4行 | 火攻cost计算（v115科技），0处调用，实际cost在调用点内联计算 |

### 城市接近性修复

**问题**：山区城市（如蓟城/晋阳）周围hex为mountain地形(3AP/格)，如果从非道路方向接近，部队AP不足以走完最后几格进入城市，导致"卡在城门口"无法攻城。

**修复**：`buildHexTerrain`步骤3中，城市周围1格自动铺设道路（`HEX_ROAD[nk]=true`），使mountain降为1.5AP、hill/forest降为1AP。确保任何方向都能合理接近城市。

**改动点**：1处（buildHexTerrain步骤3，+3行）

---

## 事件系统设计（A类已实装v130，B~G待实装）

> **状态**：框架设计完成，全部7类24个事件已经过详细讨论并确认。A类天灾3事件已于v130实装。引擎框架（冷却/弹窗/AI静默/阻塞/承诺追踪骨架）已就绪，后续B~G类只需追加EVENT_DEFS条目。
> **原则**：零新机制——所有事件的condition和effect只读写现有字段（loyalty/intimacy/gentry/pop/popQuality/morale/storage/金/fog/fogSnap/supply/diplo/reputation/values/origin/combat/posts/unit.status/garrison/exp）。

### 引擎架构

| 参数 | 设计值 | 理由 |
|------|--------|------|
| 扫描周期 | 每旬1次（接入nextTurn，扩展现有rollEvents） | 自然接入 |
| 玩家事件上限 | 每旬最多1个弹窗事件 | 多了烦，多余的排队到下旬 |
| 全局冷却 | 同一事件ID冷却12~36旬不等 | 防重复 |
| 同类冷却 | 同一类别冷却3旬 | 防同类扎堆 |
| 优先级 | 危机(1) > 机遇(2) > 日常(3) | 危机不能被排队延误 |
| AI事件 | AI势力静默处理（根据人格自动选最符合的选项），不弹窗 | 保持节奏 |
| 阻塞 | 事件弹窗期间不允许nextTurn（同战斗确认弹窗，用_pendingEvent标记） | 防跳过 |

**事件数据结构（概念）**：
```js
{
  id: 'gentry_offer',
  category: 'gentry',       // 分类冷却用
  priority: 2,              // 1=危机 2=机遇 3=日常
  cooldown: 18,             // 该事件再次触发的最短间隔（旬）
  condition: (fid) => ...,  // 返回 {triggered, context} 或 false
  narrative: (ctx) => ...,  // 返回叙事文本
  choices: (ctx) => [...],  // 返回2~3个选项，每个有label/desc/effect
}
```

**承诺追踪机制**：部分事件选项附带deadline（如B1"3旬内须编入部队"）。数据结构：
```js
G._eventPromises = [
  { genName, type:'B1_deploy', promisedAt: G.turn, deadline: G.turn+3 }
]
```
每旬nextTurn检查：deadline到期时验证是否履约，未履约则执行惩罚（忠诚大跌）。武将被俘/阵亡则清除promise不惩罚。

### 七大事件类别总览

| 类别 | 事件数 | 平均频率 | 设计倾向 | 确认状态 |
|------|--------|---------|----------|----------|
| A. 天灾改造 | 3 | 沿用现有概率 | 危机决策 | ✅ v130已实装 |
| B. 武将人事 | 4 | 约每8~12旬1次 | 人物戏剧 | ✅ 已确认 |
| C. 豪族派系 | 4 | 约每12~18旬1次 | 政治博弈（核心） | ✅ 已确认 |
| D. 演义名场面 | 3 | 一次性 | 惊喜/致敬 | ✅ 已确认 |
| E. 情报军事 | 4 | 约每6~10旬1次 | 战术决策 | ✅ 已确认 |
| F. 外交大势 | 3 | 约每12~18旬1次 | 战略格局 | ✅ 已确认 |
| G. 日常氛围 | 3 | 约每6~8旬1次 | 轻量微决策 | ✅ 已确认 |
| **合计** | **24个** | **平均每3~4旬1个弹窗** | | |

预估引擎增量：约800~1200行（事件定义数组 + 扫描引擎 + 弹窗UI + promise追踪）。

---

### A类：天灾改造（3个 · ✅ 已确认）

改造现有 `rollEvents()` 中的三个天灾，从"自动扣数值+log"升级为"弹窗给选择"。频率维持现有概率不变。

**注意**：天灾影响的是民心（city.morale），不是部队士气。疫病额外扣popQuality（影响征兵等级）。

#### A1. 旱灾（秋 · 北方row<19 · 8%）

| 选项 | 效果 | 适合场景 |
|------|------|----------|
| ① 开仓赈济 | 存粮×0.6（比不管更狠），民心仅-2，gentry+5 | 粮多钱少时，保民心 |
| ② 强征余粮 | 存粮×0.85（比不管轻），gentry-15，民心-12 | 战时需保粮，牺牲民心 |
| ③ 听天由命 | pop×0.95，民心-8，存粮×0.8（现有效果原样） | 穷得没办法 |

三选项形成清晰取舍：花粮保民心 vs 保粮牺牲gentry vs 全面小亏。

#### A2. 疫病（夏 · 全国 · 5%）

| 选项 | 效果 | 扩散 |
|------|------|------|
| ① 派医赈疫 | 金-300，pop×0.96（不论有无医馆），民心-5，**popQuality-5**，gentry+3 | **不扩散** |
| ② 封城隔断 | 金-150，pop×0.94，民心-10，**popQuality-10** | **不扩散** |
| ③ 不管 | pop×0.92（有医馆×0.96），民心-15，**popQuality-15** | **下旬30%概率扩散到一座邻城，最多扩散2跳** |

**扩散机制**：不管时，城市标记 `city._plague = { turn: G.turn, hopsLeft: 2 }`。下旬nextTurn检查：有`_plague`且`hopsLeft>0`，30%概率选一座地理邻城（**含敌方城市**，不区分阵营），该邻城受同等疫病效果（AI城市自动处理）。扩散后`hopsLeft-1`，到0不再扩散。扩散目标已有`_plague`则跳过。

**设计意图**：扩散到敌方城市是合法策略——边境城市爆疫故意不治，让它传过去拖累敌方。popQuality下降影响征兵等级（通过现有getInitLevel函数），学堂可缓慢恢复。

#### A3. 水患（夏 · 南方row>27 · 6%）

| 选项 | 效果 |
|------|------|
| ① 征民修堤 | 金-200，存粮仅×0.95，民心-3，gentry-5 |
| ② 迁民避水 | pop×0.90，民心-5（人口自然恢复需要时间） |
| ③ 听天由命 | 民心-8，存粮×0.9（现有效果原样） |

#### A类边界case

- 存粮乘以系数后 → `Math.max(0, ...)`
- 疫病扩散目标城已有`_plague` → 跳过不叠加
- `_plague`标记在扩散处理完毕后 → 立刻`delete city._plague`
- 扩散到的敌方城市 → AI根据人格自动选项（保守选①花钱治，激进选③不管继续传）

---

### B类：武将人事（4个 · ✅ 已确认）

全部条件来自现有values/loyalty/intimacy/combat标签/relations。B5"拥兵自立"已砍除（rebel部队边界case太多），改为B3④通过挖角阈值惩罚。

#### B1. 请命出战

**触发**：values含"野心"或combat='hawk'，闲置>6旬（不在任何部队、无官职），忠诚<65

**叙事**："{武将名}求见主公，言辞恳切——'末将宝刀未老，愿领一军为主公开疆拓土。'其眉宇间隐有不平之色。"

| 选项 | 效果 | 备注 |
|------|------|------|
| ① 允其出征 | 忠诚+8，**3旬内须将该武将编入某部队，否则忠诚-15** | 选项标注deadline提醒 |
| ② 委以重任 | 忠诚+5，**3旬内须任命太守或官职，否则忠诚-10** | 选项标注deadline提醒 |
| ③ 温言安抚 | 忠诚-5（"投机"标签额外-5） | 当面拒绝，伤害明确但可控 |

**承诺追踪**：选①或②时写入 `G._eventPromises`，每旬检查deadline。履约判定：
- ①：该武将出现在任一部队的squads中 → 履约
- ②：该武将有getGenPostDef返回值或被任命为某城prefect → 履约
- 武将被俘/阵亡/叛逃 → 清除promise不惩罚

**冷却**：24旬。同一武将不重复触发。

#### B2. 将相不和

**触发**：同一部队中两武将亲密度<-30，且至少一方有官职

**叙事**："{A}与{B}在军议上争执不下。{A}拍案而去，言'此人不除，大事难成'。"（若A是hawk、B是dove，叙事改为鹰鸽路线之争）

| 选项 | 效果 |
|------|------|
| ① 力挺A，斥B | A忠+5，B忠-10，B对君主亲密度-8 |
| ② 力挺B，斥A | 反向 |
| ③ 设宴调和 | 金-100，两人亲密度+10，各忠+2。**亲密<-50则失败**（"积怨太深，强颜欢笑不过一夕"），金照扣但效果减半 |

**设计说明**：砍掉了"出走"（太激烈）和"分而用之"（无同城概念）。被冷落的一方忠诚骤降到低位后，自然进入现有挖角系统的射程，不需要额外惩罚机制。

**冷却**：18旬。

#### B3. 功高震主

**触发**：某武将war+com合计>170，当前在部队中连续征战>12旬，非"忠义"标签

**叙事**：随seniority变化：
- founding："朝中有人议论{名}拥兵自重，请主公定夺。"
- defector/newcomer："降将{名}统兵日久，军中只知有{名}不知有主公。"

| 选项 | 效果 |
|------|------|
| ① 加封安抚 | 忠诚+8（"野心"标签仅+3），**3旬内须任命官职，否则忠-12**（承诺追踪，同B1机制） |
| ② 召回述职 | 自动为该部队设march回最近己方城市的hexPath（玩家可中途取消/改道），忠-5，部队全体squad士气-8 |
| ③ 遣使慰劳 | 金-200，忠+5，不影响部队行动 |
| ④ 不予理会 | 该武将被挖角忠诚阈值从45提升到65（投机标签提到75），被劝降率+15%。持续到忠诚回升≥70时自动解除。AI挖角排序中该武将权重+50（优先被盯上） |

**②实现细节**：`unit.hexPath = findPath(unit.hq, unit.hr, nearestFriendlyCity.q, nearestFriendlyCity.r)`，`unit.status = 'march'`。如在siege中先清除siegeTarget/_siegeTurnCount。部队已在己方城市hex上时②选项不可选。

**④实现细节**：`G._poachVulnerable[genName] = { threshold:65, surrenderBonus:0.15 }`。`_aiDoPoach`中检查此标记，满足时排序权重+50优先挖角。忠诚回升≥70时自动delete该标记。

**冷却**：36旬。

#### B4. 故人来投

**触发**：在野武将池中某人的relations包含你麾下武将（type='义兄弟'/'义友'/'同乡'/'同窗'），且你麾下该引荐人忠诚>70

**叙事**："{在野武将}闻{你的武将}在{势力名}帐下，慕名来投。{你的武将}亲自引荐——'此人与我有旧，才堪大用。'"

| 选项 | 效果 |
|------|------|
| ① 欣然接纳 | 该武将直接加入（免费，跳过正常招募流程），初始忠诚=引荐人忠诚×0.8，引荐人忠+3，双方亲密+15 |
| ② 考察再议 | 3旬后自动加入，初始忠诚=引荐人忠诚×0.8-10（等久了不爽） |
| ③ 婉拒 | 引荐人忠-8（驳了面子），该武将6旬内不再触发此事件 |

**冷却**：12旬。

#### B类边界case

| 场景 | 处理 |
|------|------|
| B1：弹窗期间武将被敌方挖走 | effect执行时验证武将仍在G.generals[fac]中，否则跳过 |
| B1：选①但没有任何部队 | 忠诚+8照给，promise照记，3旬内征兵编入即可履约 |
| B1：deadline前武将被俘/阵亡 | 清除promise，不惩罚 |
| B2：金不够100 | ③选项变灰不可选 |
| B2：部队正在行军/战斗中 | 允许触发，效果正常（不影响行军） |
| B3：部队在siege中被召回 | 清除siegeTarget/_siegeTurnCount后设march |
| B3：部队已在己方城市 | ②选项不可选 |
| B3④：武将被交易/释放到其他势力 | 换势力时清除_poachVulnerable |
| B4：effect执行时在野武将已被AI招募 | 检查在野池，不在则弹"该武将已另投他处"，引荐人忠不变 |
| B4：引荐人忠诚在弹窗期间跌破70 | effect照常执行（弹窗已出，不反悔） |
| 通用：同旬多个B类事件满足条件 | 同类冷却3旬，只出1个，其余排队 |

---

### C类：豪族/派系斗争（4个 · ✅ 已确认）

核心矛盾："士族要权力 vs 君主要控制力"。不可能三角：士族要权、寒门要权、你要控制力，三者最多满足两个。

#### C1. 豪族献策（冷却18旬）

**触发**：某城gentry>70 + 该城gentryFac影响力>20%

**叙事**："{城名}的{士族名}大族联名上书，愿出私财资助建设，但请求主公'用人当用本地贤达'。"

**设计意图**：gentry高不是安全，是士族来要权了。接钱就让他们更嚣张，拒绝就压支持度。

| 选项 | 效果 |
|------|------|
| ① 接受资助 | 金+500，但gentry+8，非本地太守忠-5 |
| ② 接受但换太守 | 金+500，gentry+3，须换本地士族太守 |
| ③ 婉拒 | gentry-8，保持控制力 |

#### C2. 士族逼宫（冷却24旬）

**触发**：某士族派系影响力>35% + 该派系≥3人无官职

**叙事**："{士族名}诸臣联名进言——'某某、某某、某某，皆才堪大任，久居闲散，非明主之道。'"

**设计意图**：核心政治博弈。封了被士族绑架且得罪其他派系。不封得罪士族。与C3不可能同时满足。

| 选项 | 效果 |
|------|------|
| ① 批量封官 | 3人各得tier3官位，忠各+10，其他派系武将忠各-3，该派系影响力+5% |
| ② 只封一人 | 最高声望者封官+忠+8，其余忠-5 |
| ③ 以能力论官 | 该派系全体忠-5，相关城市gentry各-5，但humble武将忠+3 |
| ④ 拖延 | 该派系忠诚额外-0.3/旬持续12旬（不满持续累积） |

**注意**：C2与C4为独立事件，不存在因果链触发关系。

#### C3. 寒门抱怨（冷却24旬）

**触发**：≥3个humble武将无官职 + gentry origin武将占官位>60%

**叙事**："{寒门武将}私下牢骚——'朝中尽是世家子弟，我等出生入死，反不如坐而论道之人。'"

**设计意图**：C2的对偶面。提拔寒门得罪士族（gentry跌），两头都顾是不可能的。

| 选项 | 效果 |
|------|------|
| ① 破格提拔 | 选一名humble封官，该人忠+15，全体humble忠+3，相关城市gentry各-3 |
| ② 唯才是举 | 全体武将忠+2 |
| ③ 不回应 | humble武将忠各-3 |

#### C4. 豪族不满（冷却24旬）

**触发**：某城gentry<30 + 该城gentryFac的势力内影响力<10% + 太守不是该地域origin='gentry'的武将

**叙事**："{城名}士族怨声载道，地方豪强暗中串联。若不安抚，恐生变故。"

**设计意图**：压制士族的反噬。最可怕的是garrison清零——敌人趁虚来攻就完了。与现有民心→叛乱（checkRebellions）是两套独立机制。

| 选项 | 效果 |
|------|------|
| ① 拨款安抚 | 金-400，gentry+15，民心+5 |
| ② 换本地士族太守 | gentry+12，须从该地域gentry origin武将中选一人任太守 |
| ③ 不管 | 6旬后如果gentry仍<30 → **豪族暴动**（garrison清零，民心-25，pop-5%，gentry归零）。用promise机制追踪 |

#### C类边界case

| 场景 | 处理 |
|------|------|
| C1：该城没有本地士族武将可换太守 | ②选项变灰不可选 |
| C2：官位tier3已满 | ①选项变灰，提示"官位不足" |
| C2④：12旬衰减期间武将被俘/离开 | 停止衰减，清除该武将的额外惩罚 |
| C4③：6旬内该城被敌方攻占 | 清除promise（城都没了） |
| C4③：6旬内玩家把gentry拉回30以上 | 履约成功，清除promise不暴动 |

---

### D类：演义名场面（3个 · ✅ 已确认 · 全部一次性）

条件驱动的演义致敬——不是线性剧本，而是游戏状态恰好满足历史情境时触发。每局不同。

#### D1. 拜将大典（一次性 · 通用）

**触发**：任一势力中有≥5个武将war≥90

**叙事**（通用）："麾下猛将云集，谋士进言——'五位将军皆万人敌，宜各授重任，以安军心。'"
蜀国若关张赵马黄全在且全部war≥90，叙事自动匹配为五虎上将名号（不做代码分支，纯叙事文本差异）。

**亲密度冲突分支**：从这5人中找亲密度最负的一对（如果有负的话），弹额外叙事"{A}对与{B}同列颇有微词，需另行安抚"。被不服者忠诚仅+3而非+10。

**前置数据调整**：INTIMACY_PRESET中加入 `['关羽','黄忠',-15]`，确保蜀国触发时大概率涌现"关羽不服黄忠"桥段（玩家若提前刷亲密度则可规避）。

| 选项 | 效果 |
|------|------|
| ① 拜将 | 5人忠各+10（负亲密对中被不服者仅+3），全势力士气+5 |
| ② 只封三人 | 玩家选3人忠+10，未选2人忠-8 |

**注意**：不涉及官职系统，纯忠诚和士气buff。

#### D3. 铜雀台（一次性 · 剧本限定）

**触发**：魏≥15城 + 曹操为君主

| 选项 | 效果 |
|------|------|
| ① 修建铜雀台 | 金-800，首都民心+10，全势力忠+3 |
| ② 遣使求亲 | 对吴好感+20（若被拒则好感-15），需魏吴好感<50 |
| ③ 不搞 | 无 |

#### D4. 出师表（一次性 · 剧本限定）

**触发**：蜀拥有汉中 + 诸葛亮有丞相官职 + 蜀与魏处于战争状态 + 蜀≥3支部队

**设计意图**：鹰鸽路线分裂测试——北伐让鹰派振奋鸽派不满，缓兵反之。玩家需看阵中鹰鸽比例决策。

| 选项 | 效果 |
|------|------|
| ① 准其北伐 | 全势力士气+10，"忠义"+"汉室死忠"忠+8，combat='hawk'忠+5，**combat='dove'忠-5** |
| ② 暂缓北伐 | 诸葛亮忠-5，"汉室死忠"忠-5，**combat='hawk'忠-5，combat='dove'忠+3** |

---

### E类：情报/军事（4个 · ✅ 已确认）

把迷雾和补给从"后台数字"变成"弹窗决策"——主动花钱买情报/买时间。

#### E1. 探子回报（冷却6旬）

**触发**：玩家部队在explored区域（非visible）2格以内

| 选项 | 效果 |
|------|------|
| ① 花金验证 | 金-100，3格范围fog→visible持续2旬，更新fogSnap。敌方部队数值仍为估算 |
| ② 信以为真 | 免费，不刷新fog（玩家看到的可能是过期快照） |
| ③ 派间谍深入 | 金-200，需部队中有INT>70武将。刷新fog同①，但区域内敌方部队数值为精确值（等同INT>90侦查效果）。区域内没敌人则白花钱 |

#### E2. 诱敌深入（冷却8旬）

**触发**：你有一支halt/camp部队**已在**forest或hill hex上 + 敌方部队在该部队4格以内

| 选项 | 效果 |
|------|------|
| ① 依计设伏 | 部队直接进入ambush状态（不耗AP），伏击成功率额外+10%（挂临时标记`unit._advisedAmbush=true`，伏击触发时读取，触发后清除） |
| ② 不必 | 无 |

**设计意图**：降低伏击操作门槛（新手教学）+奖励"听谋士话"的老手（免费+10%）。不限于防守，进攻途中也可触发。

#### E3. 粮道告急（冷却6旬）

**触发**：你的部队 `_noSupplyTurns` ≥ 1（开始吃存粮）

| 选项 | 效果 |
|------|------|
| ① 咬牙坚持 | 该部队SUPPLY_RATIONS临时+2旬（挂`unit._extraRations=2`，processSupplyStatus里`_rations`计算时加上此值），多撑2旬 |
| ② 破釜沉舟 | 存粮缓冲不变，全部队士气+10（背水一战的激励） |

**设计意图**：①买时间（死线从7旬推到9旬），②买战力（这几旬打得更狠但死线不变）。

#### E4. 断粮（冷却8旬）

**触发**：你有部队在敌方领地 + 附近6格内有敌方部队 `_noSupplyTurns` ≥ 1

**叙事**："{谋士}进言——'{敌方主将}部粮道已断，若扼守要路不出数旬必溃。'"

**设计意图**：提示型事件——把补给系统的隐性优势变成显性决策。不自动计算卡位点，玩家看补给overlay自行判断战术。

| 选项 | 效果 |
|------|------|
| ① 扼守卡位 | 你的部队进入camp状态。若该敌方部队3旬内因断粮溃散，你的部队直接获得200exp（`addUnitExp(unit, 200)`） |
| ② 趁虚进攻 | 立即对该敌方部队发起攻击（走现有战斗流程），敌方因已在断粮中士气本来就低 |
| ③ 不必 | 无 |

#### E类边界case

| 场景 | 处理 |
|------|------|
| E1：explored区域内没有任何城市或部队 | 照常触发——"确认安全"也是有价值的情报 |
| E1③：部队中没有INT>70武将 | ③选项变灰不可选 |
| E2：部队当前是siege状态 | 不触发（正在围城不会去设伏） |
| E3：部队已经断粮溃散 | 不触发（troops=0的部队不参与） |
| E4①：3旬内敌方部队没溃散（补给恢复了/撤退了） | 不获得200exp，camp状态保持 |
| E4②：敌方部队在弹窗期间移走了 | ②选项不可选，提示"敌军已撤" |

---

### F类：外交/天下大势（3个 · ✅ 已确认）

天下格局的拐点——条件苛刻但影响深远的战略窗口。

#### F1. 使者来访（冷却12旬）

**触发**：与某AI势力好感30~60 + 非战争状态 + 距上次外交行动>6旬

**叙事**："{势力名}遣使来访，带来厚礼。"（根据AI人格变化话术：曹操方"共分天下"，刘备方"匡扶汉室"，孙权方"划江而治"）

| 选项 | 效果 |
|------|------|
| ① 厚礼结盟 | 金-300，好感+20 |
| ② 接受不表态 | 好感+5 |
| ③ 斩使立威 | 好感-60，立即开战，全军士气+5 |

#### F2. 远交近攻（冷却18旬）

**触发**：你与A处于战争状态 + B与A好感<20 + B与你好感>30

**叙事**："{谋士}进言——'{B}与{A}素有嫌隙，若遣使结好，令其攻{A}后方，可收渔翁之利。'"

**设计意图**：条件苛刻的战略机遇。不直接操控AI行为，只调整AI决策的输入参数——B对A好感-30 + B的AI威胁矩阵中A威胁值+50，AI自己判断是否进攻。与计谋系统不merge——计谋是效果直接、条件简单的每旬操作，远交近攻是条件苛刻的战略事件。

| 选项 | 效果 |
|------|------|
| ① 遣使联络 | 金-200，B对A好感-30，B的AI威胁矩阵中A威胁值+50 |
| ② 自行解决 | 无 |

#### F3. 天下三分势定（一次性）

**触发**：三势力各≥10城 + 12旬内城市易手≤1次

| 选项 | 效果 |
|------|------|
| ① 顺势休兵 | 全局好感向50回归30%，全部城市民心+5，所有部队士气+5 |
| ② 趁此良机备战 | 不接受和平红利，己方全部城市popQuality+5（利用和平期训练兵源） |

---

### G类：日常/氛围（3个 · ✅ 已确认）

世界的生活感——战争之外还有名士、流民、丰收。

#### G1. 名士过境（冷却8旬）

**触发**：随机城市，基础概率5%/旬

**"该城武将"定义**：该城太守 + 辖区内（hex距离≤2）garrison/halt/camp部队中的所有武将。

| 选项 | 效果 |
|------|------|
| ① 请其讲学 | 金-100，该城武将exp+50，该城popQuality+3 |
| ② 请其著书 | 金-200，该城popQuality+8 |
| ③ 赠礼送行 | 金-50，信誉+3 |

#### G3. 流民涌入（冷却6旬）

**触发**：某敌方城市本旬易手 + 你有一座城与该城hex距离≤8

| 选项 | 效果 |
|------|------|
| ① 接纳安置 | pop+8%，gentry-3，民心-3 |
| ② 拒之门外 | 民心+2，信誉-2 |
| ③ 择壮编军 | pop+3%，garrison+500，gentry-5，民心-5 |

#### G4. 丰年大收（冷却8旬）

**触发**：秋季 + 某城存粮超过容量80%

**base效果**（无论选什么）：该城粮食产出基础值+15%（永久，叙事为"丰年开垦新田"）

| 选项 | 效果 |
|------|------|
| ① 犒赏三军 | 存粮-15%，该城辖区内部队（hex距≤2的garrison/halt/camp）士气+10 |
| ② 安享丰收 | 无额外效果，纯拿粮产base加成 |
| ③ 开市惠民 | 存粮-10%，民心+5，gentry+5 |

#### G类边界case

| 场景 | 处理 |
|------|------|
| G1：该城没有太守也没有辖区部队 | ①的exp效果跳过（无武将可加），popQuality照给 |
| G1：金不够200 | ②变灰 |
| G3：该城garrison已满 | ③的garrison+500改为加到上限（garrisonCap） |
| G4：该城辖区内没有部队 | ①的士气效果跳过，存粮照扣 |

---

### 事件系统与现有系统数据接口总览

| 现有系统 | 被哪些事件读取 | 被哪些事件写入 |
|----------|--------------|--------------|
| values/origin/combat标签 | B1/B2/B3/C2/C3/D1/D4 | —（只读） |
| loyalty（忠诚度） | B1~B4/C1~C4/D1/D4 | B1~B4/C1~C4/D1/D3/D4/F1 |
| intimacy（亲密度） | B2/D1 | B2/B4 |
| gentry（豪族支持） | C1~C4/A1~A3/G3/G4 | C1~C4/A1~A3/G3/G4 |
| popQuality（人口质量） | — | A2/F3/G1 |
| pop（人口） | A1/A2/A3/C4/G3 | A1/A2/A3/C4/G3 |
| morale（城市民心） | A1~A3/C4/G3/G4 | A1~A3/C4/D3/G3/G4 |
| 部队士气 | D1/D4/E3/F1/F3/G4 | D1/D4/E3/F1/F3/G4 |
| storage（存粮） | A1/A3/G4 | A1/A3/G4 |
| 粮食产出base | — | G4 |
| 金 | B2/B3/C1/C4/E1/F1/F2/G1/D3 | B2/B3/C1/C4/E1/F1/F2/G1/D3 |
| fog/fogSnap（迷雾） | E1 | E1 |
| _noSupplyTurns（断粮） | E3/E4 | E3（_extraRations） |
| diplo（外交好感） | F1/F2/F3 | F1/F2/F3/D3 |
| reputation（信誉） | — | G1/G3 |
| posts（官职） | B1/B3/C2/C3 | C2/C3 |
| unit.status/hexPath | B3/E2/E4 | B3/E2/E4 |
| unit.exp | E4 | E4/G1 |
| garrison | G3 | G3 |
| seniority（资历） | B3叙事文本 | — |
| AI人格 | F1叙事文本 | — |
| relations | B4 | —（只读） |
| FACTION_DEFS/影响力 | C1/C2/C3/C4 | C2 |
| AI威胁矩阵 | — | F2（威胁值+50） |
| 伏击系统 | E2 | E2（_advisedAmbush） |
| _aiDoPoach（挖角） | B3④ | B3④（排序权重+50） |
| INTIMACY_PRESET | D1 | 需预设['关羽','黄忠',-15] |

### 设计哲学

- **A类**：没有"正确答案"，只有"损失分配"——灾难不可避免，选择谁承受
- **B类**：values标签从被动数字变成性格驱动的戏剧——野心家闹事、忠义者稳定
- **C类**：不可能三角——士族要权、寒门要权、你要控制力，三者最多满足两个
- **D类**：不是线性剧本，是系统状态恰好满足历史条件时的涌现——每局不同
- **E类**：把迷雾/补给从"后台数字"变成"弹窗决策"——你主动花钱买情报/买时间
- **F类**：天下格局的拐点——条件苛刻但影响深远的战略窗口
- **G类**：世界的生活感——战争之外还有名士、流民、丰收

---

## v126 武将技能第四批实装（+15人 + 马超buff）

### 概述

15个新武将技能实装，覆盖战斗/围城/伏击/经济/外交/忠诚等多系统。新增地域判定辅助（JIANGDONG_CITIES 13城 + QINGXU_CITIES 6城）。马超·锦马 ATK×1.12→×1.15 数值提升。

### 新增基础设施

#### 地域城市集合（CITY_MAP之后）
```js
const JIANGDONG_CITIES = new Set([
  'jianye','jingkou','huiji',
  'wuchang','chaigang','jiaozhou','panyu',
  'changsha','yuzhang','lingling',
  'hefei','shouchun','lujiang'
]);
const QINGXU_CITIES = new Set(['xuzhou','qingzhou','beihai','guangling','xiapi','puyang']);
function isJiangdong(cityId){ return JIANGDONG_CITIES.has(cityId); }
function isQingxu(cityId){ return QINGXU_CITIES.has(cityId); }
```
用于孙权·坐断、程普·虎臣（江东）和臧霸·啸聚（青徐）。

### 数值调整

| 武将 | 技能 | 旧值 | 新值 | 理由 |
|------|------|------|------|------|
| 马超 | 锦马 | ATK×1.12 | ATK×1.15 | 无条件触发（骑兵主将即生效），原值偏保守，提至与法正·睚眦持平 |

### 新增技能清单（15人）

**SKILL_REGISTRY（7条新增，总计27）**

| # | 武将 | 技能名 | trigger | 效果 |
|---|------|--------|---------|------|
| 1 | 邓艾 | 裹毡(ATK) | onCalcATK | 山/丘主将ATK×1.10 |
| 2 | 邓艾 | 裹毡(DEF) | onCalcDEF | 山/丘主将DEF×1.10 |
| 3 | 马岱 | 斩延 | onCalcATK | 骑兵主将ATK×1.05 |
| 4 | 刘封 | 刚愎(ATK) | onCalcATK | 单squad unit ATK×1.08 |
| 5 | 刘封 | 刚愎(DEF) | onCalcDEF | 单squad unit DEF×1.08 |
| 6 | 程普 | 虎臣(ATK) | onCalcATK | 江东城市战斗ATK×1.10 |
| 7 | 程普 | 虎臣(DEF) | onCalcDEF | 江东城市战斗DEF×1.10 |

**SKILL_INLINE（19条新增标签，总计81）**

| # | 武将 | 技能名 | 效果 | 挂载点 |
|---|------|--------|------|--------|
| 1 | 张任 | 落凤 | 设伏方中伏率+15% | `resolveAmbush` ambushChance |
| 2 | 邓艾 | 裹毡(AP) | 全地形实际AP消耗×0.85 | moveUnit步进cost |
| 3 | 庞德 | 抬棺 | 敌≥己×3时squad ATK/DEF×1.20 | `resolveBattle`战前 |
| 4 | 黄盖 | 苦肉 | squad非满员ATK×1.10 | `resolveBattle`战前 |
| 5 | 王朗 | 经义(debuff) | 对战部队有诸葛亮时squad士气-20(临时) | `resolveBattle`战前+战后恢复 |
| 6 | 全琮 | 合围 | 己方units≥2时unit ATK/DEF×1.05 | `resolveBattle`战前 |
| 7 | 郝昭 | 拒蜀 | 守城战城防倍率+0.15 | `resolveSiegeBattle` defMult |
| 8 | 孙权 | 坐断(DEF) | 江东己方城市garrison守城DEF×1.05 | `resolveSiegeBattle` _defBonus |
| 9 | 孙权 | 坐断(豪族) | 江东己方城市豪族+0.15/旬 | `processGentry` |
| 10 | 钟繇 | 楷范 | 当官时势力信誉+0.15/旬 | `processReputation` |
| 11 | 王朗 | 经义(民心) | 当官时全城民心+0.15/旬 | `processCityMorale` |
| 12 | 臧霸 | 啸聚 | 所在squad青徐补员×2 | `processReinforcement` |
| 13 | 刘封 | 刚愎(忠诚) | 忠诚每旬-0.1 | `processLoyalty` |
| 14 | 李严 | 误期(阈值) | 孤立阈值5→3% / 势单力薄10→7%（缓解孤立） | `processFactionLoyalty` + `getGenFactionModBreakdown` |
| 15 | 李严 | 误期(粮损) | 当官时调粮损耗×1.20 | `doTransfer` |
| 16 | 诸葛瑾 | 缓颊(送礼) | 当官时送礼好感+5 | `diploGift` |
| 17 | 诸葛瑾 | 缓颊(停战) | 当官时停战好感+5 | `diploArmistice` |
| 18 | 诸葛瑾 | 缓颊(结盟) | 当官时结盟好感+5 | `diploAlly` |
| 19 | 马超 | 锦马(buff) | ATK×1.12→×1.15 | SKILL_REGISTRY |

### 新开hook点（v126新增）

- moveUnit步进cost — 邓艾AP减少（不改getHexMoveCost签名，不影响A*寻路）
- `resolveSiegeBattle` defMult计算后 — 郝昭城防加成
- `resolveSiegeBattle` _defBonus per-unit — 孙权garrison DEF加成
- `processGentry` 地域条件 — 孙权江东豪族
- `processReinforcement` squad级补员乘数 — 臧霸青徐补员
- `processFactionLoyalty` / `getGenFactionModBreakdown` 阈值参数化 — 李严孤立放宽

### 设计要点

**庞德vs张辽**：张辽"敌≥己×2"触发全队士气+20（临时），庞德"敌≥己×3"触发自身squad ATK/DEF×1.20。庞德条件更苛刻但个人收益更高。

**郝昭vs满宠vs曹仁**：三者完全不冲突——满宠（围城耐久消耗减慢30%，拖时间）、郝昭（城防倍率+0.15，硬扛攻城战）、曹仁（个人DEF×1.15，自身防御）。

**孙权己方三重验证**：`hasFacGen(fac,'孙权')` + `genHasOffice('孙权',fac)` + `city.fac === fac`。确保城市被占后技能不生效。

**邓艾AP不影响寻路**：不改`getHexMoveCost`签名（寻路A*全局用），只在moveUnit实际步进时cost×0.85。路径不变，同样AP走得更远。

**王朗经义debuff**：战后恢复士气（临时效果），检测条件是**对战部队有诸葛亮**（非诸葛亮当官）。

**诸葛瑾vs鲁肃vs邓芝**：三者维度不同——鲁肃（送礼好感×1.50，乘法，仅送礼）、邓芝（议和/结盟成功率+5%，概率）、诸葛瑾（所有外交好感flat+5，加法，全覆盖）。

### 技能总表更新

REGISTRY 27条（+7），INLINE 81标签（+19）
已实装：72人（魏20→26 / 蜀21→25 / 吴15→20 / 在野1→1张郃）+15=72
待实装：35人

---

## v126 UI Bugfix（3处）

### Bug 1: 单挑重伤/技能文字颜色在浅色背景看不清

| 位置 | 原色 | 新色 | 说明 |
|------|------|------|------|
| 单挑重伤行 (~行19920) | `#f0a040`（亮金） | `#a85020`（深褐橙） | 重伤提示需要醒目但可读 |
| 技能日志行 (~行19891) | `#c8a0e8`（浅紫） | `#7a50a0`（深紫） | 技能触发在宣纸背景上可读 |
| 单挑技能行 (~行19596) | `#c8a0e8`（浅紫） | `#7a50a0`（深紫） | 同上 |

### Bug 2: 俘虏处置弹窗(prisonerModal)黑色背景

**位置**：`showNextPrisonerModal` (~行19986)

**原因**：该弹窗沿用旧暗色主题 `background:linear-gradient(160deg,#1a1200,#0d0900)`，未在v117水墨风重制时同步更新。

**修复**：
- 背景改为 `rgba(245,238,225,.99)`（与battleConfirmModal/captureModal统一的宣纸风）
- 标题色从 `#6b5530` 改为 `var(--ink)`
- 新增 `box-shadow:0 8px 40px rgba(80,65,40,.12)` 提供层次感
- 按钮样式保留（原本就用rgba半透明，在浅色背景上可读）

### Bug 3: 战报俘获文案歧义 — 败方误以为自己俘获敌将

**位置**：`showNextBattleReport` → `genEventRows` (~行19897)

**根因**：`captureReports` 始终记录**胜方对败方的俘获**。战报统一显示"⛓ 俘获"不区分立场。玩家败仗时看到"⛓ 俘获 张飞 被俘后获释"，误读为自己俘获了敌将。实际俘获逻辑完全正确（`collectPrisoners`只对loserSide执行，`resolvePrisoners`只给winnerFid），问题纯属显示文案。

**修复**：
```js
const _playerWon = r.playerWasAttacker ? r.atkWins : (r.playerWasAttacker===false ? !r.atkWins : null);
```
- 玩家胜 → 显示"⛓ 我方俘获"
- 玩家败 → 显示"⛓ 被敌俘获"
- `action:'pending'`（仅玩家胜时出现）→ 始终显示"⛓ 我方俘获"

**验证**：`resolveBattle`中`collectPrisoners`调用链确认无逻辑bug——只有loserSide被检查俘获，winnerFid执行处置。

### Bug 1 补充: AI叫阵横幅颜色（战斗确认/攻城/攻营3处）

**位置**：`showBattleConfirmUI`(~行18966)、营寨战(~行18587)、攻城战(~行18766)

**原因**：横幅使用暗色主题配色`color:rgba(244,200,160,.9)`（浅金色文字）+ `background:rgba(180,40,20,.18)`（浅红底），在宣纸风浅色背景下几乎不可见。

**修复**（6处）：
- 背景：`rgba(180,40,20,.18)` → `rgba(192,48,48,.08)`（更浅更透）
- 边框：`rgba(220,80,40,.35)` → `rgba(192,48,48,.25)`
- 文字：`rgba(244,200,160,.9)` → `rgba(44,36,22,.7)`（深色墨水色）
- 提示：`rgba(244,200,160,.5)` → `rgba(92,74,50,.45)`
- disabled文字：`rgba(244,200,160,.35)` → `rgba(92,74,50,.35)`

### Bug 4: 攻城双重俘获 — 同一武将弹窗两次

**位置**：`resolveSiegeBattle` 内部两处俘获判定

**根因**：攻城战中存在两层俘获判定：
1. `resolveBattle`（line ~16901）：通用战斗俘获 — 败方兵损>60%时对败方武将做俘获roll
2. `resolveSiegeBattle`（line ~17558）：突围失败俘获 — 城内守方突围失败再做一次俘获roll

**问题**：同一个守方武将可能在第1层被俘获（进入`_pendingPrisoners`），然后在第2层突围失败时**再次被俘获**（再次push进队列）。玩家看到同一人的俘虏处置弹窗弹出两次。

**修复**：在突围判定前，收集第1层已俘获的武将名单`_alreadyCaptured`（从`battleReport.captureReports`提取），第2层突围俘获时跳过已在名单中的武将。

```js
const _alreadyCaptured = new Set((battleReport.captureReports||[]).map(p=>p.name));
// ... breakout loop ...
if(_alreadyCaptured.has(sq.genName)) return; // skip
```

---

## v126 年份调整 + 武将库架构

### 年份调整：219年→214年（建安十九年）

**YEARS数组**：`['建安十九年','建安二十年',...,'黄初七年','太和元年']`（15条，覆盖214→228年）

**时间线注释**：T1=建安十九年(214), T45=215年, T117=217年, T189=219年

### GEN_POOL_INACTIVE（非活跃武将库）

新增 `GEN_POOL_INACTIVE` 数组，存放当前剧本不参战但保留全量数据的武将。结构与 GENS_FULL 条目完全一致，额外增加 `era`（生卒年）和 `note`（历史说明）字段。

```js
const GEN_POOL_INACTIVE = [
  {name:'孙策', com:92,war:94,..., era:{birth:175,death:200}, note:'小霸王，200年遇刺身亡'},
  {name:'典韦', com:70,war:100,..., era:{birth:0,death:197}, note:'恶来，197年宛城战死护主'},
];
```

**GEN_MAP 包含 INACTIVE**：`Object.fromEntries([...ALL_GENS, ...GEN_POOL_INACTIVE].map(g=>[g.name,g]))`，确保关系查询（其他武将relations引用孙策/典韦）和武将profile显示不crash。

### 武将移除清单

| 武将 | 从何处移除 | 保留不动 |
|------|----------|---------|
| 孙策 | GENS_FULL.wu、FOUNDING_GENS.wu、初始部队(建业squad→吕蒙) | GEN_META、GEN_TAGS、COMPAT、INTIMACY_INIT、所有其他武将relations引用、技能代码(无) |
| 典韦 | GENS_FULL.wei、FOUNDING_GENS.wei | GEN_META、GEN_TAGS、COMPAT、INTIMACY_INIT、许褚relations引用、全部3处技能代码(恶来) |

### 设计原则

- **技能代码不动**：典韦的恶来技能（单挑+15、同队免俘、突围100%）代码保留原位，人不在场则condition永远false，无副作用
- **关系数据不动**：其他武将的`relations`中引用孙策/典韦的条目保留（历史关系不因人物去世而消失），GEN_MAP包含inactive确保profile查询正常
- **未来扩展**：添加新剧本时，只需将GEN_POOL_INACTIVE中的武将移回GENS_FULL对应势力，配合era.death >= scenarioStartYear过滤即可

### 项目快照更新

| 项目 | 值 |
|------|---|
| 武将总数 | 105人活跃（魏33/蜀27/吴25） + 20在野 + 2 inactive = 107人数据总量 |
| 开局年份 | 建安十九年（214年） |
| 初始部队(吴) | 建业：吕蒙+程普 / 合肥：甘宁+凌统 |

---

## v127 武将技能第五批实装（+6人 + 陆抗inactive + 无技能清理 + _defBonus cleanup修复）

### 概述

6个武将新增技能实装，覆盖计谋/护主/机动/称帝/成长/攻城削弱等系统。陆抗移入GEN_POOL_INACTIVE（214年未出生）。全部剩余"待实装"skills标签从GEN_META中清除。修复resolveBattle中_defBonus清理遗漏（v125老bug）。

### 新增技能清单（6人）

**SKILL_REGISTRY（2条新增，总计29）**

| # | 武将 | 技能名 | id | trigger | 效果 | 历史典故 |
|---|------|--------|----|---------|------|---------|
| 1 | 曹洪 | 舍命 | sheming | onCalcDEF | 曹操同队时全队DEF×1.10 | 荥阳让马"天下不可无公" |
| 2 | 曹休 | 千里驹 | qianlijv | onCalcAP | 骑兵主将AP+1 | 曹操赞"吾家千里驹" |

**SKILL_INLINE（7条新增标签，总计88）**

| # | 武将 | 技能名 | 标签 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 1 | 荀攸 | 奇策 | qice | 当官时用计成功率+8% | `_strategyRate` |
| 2 | 华歆 | 逼宫 | bigong | 当官时称帝城市门槛10→8、信誉门槛40→30 | `canEnthrone` |
| 3 | 华歆 | 逼宫(UI) | bigong_ui | 称帝按钮tooltip动态显示降低后的门槛 | `renderDipTab` |
| 4 | 韩当 | 从征(buff) | congzheng | 读计数，squad ATK/DEF×(1+wins×0.005)，cap×1.05 | `resolveBattle`战前 |
| 5 | 韩当 | 从征(计数) | congzheng_count | 胜方有韩当时+1计数 | `resolveBattle`战后cleanup |
| 6 | 徐盛 | 疑城 | yicheng | 守城战时攻城方部队ATK×0.95 | `resolveSiegeBattle` |
| 7 | 徐盛 | 疑城(日志) | yicheng_log | 技能战报日志 | `resolveSiegeBattle`战报注入 |

### 新增数据结构

```js
G.genWinCount = {};  // v127 韩当·从征 per-general战胜计数器（initGame中初始化，持久累积不重置）
```

### 设计要点

**曹洪·舍命 vs 周泰·护主**：同一REGISTRY模式——A在场时给全队DEF×1.10。曹洪condition检查ctx.sq是曹操+同unit有曹洪。由于REGISTRY的multDEF是unit级统一应用，效果等同全队buff。

**曹休·千里驹 vs 夏侯渊·虎步**：夏侯渊无条件AP+2（代价DEF×0.90），曹休骑兵主将AP+1（无代价但限骑兵）。条件检查baseType为cavalry（含特色骑兵如西凉铁骑）。

**荀攸·奇策 vs 庞统·凤雏**：荀攸flat+8%（稳定），庞统同旬第2计起+20%叠加（爆发）。两者可叠加。荀攸追加在`_pangtongBuff`之后、return之前，变量名`_xunyouBuff`。

**华歆·逼宫**：直接修改`canEnthrone`函数，用`_huaxinBonus`布尔值切换两套门槛。AI也通过同一入口受益。称帝按钮tooltip动态显示`_reqC`/`_reqR`实际门槛值+华歆标注。

**韩当·从征**：成长型技能，类似黄忠·老当但触发条件是实际战胜次数。`G.genWinCount['韩当']`持久计数不按旬重置。战前从计数器读取buff，通过`_xiaoyi_atk`和`_defBonus`标记传递给squadATK/DEF。战后在`atkWins`判定后扫描胜方韩当并+1（同一场break只计1次）。10胜封顶=5%上限。

**徐盛·疑城**：唯一的"削弱攻方"守城技能。在`resolveSiegeBattle`中刘晔巧思ATK之后，检查守方有徐盛则攻方全部squad `_xiaoyi_atk *= 0.95`。与郝昭（加城防倍率）、满宠（减decay速度）、曹仁（个人DEF）完全不冲突且可叠加。

### Bugfix: _defBonus清理遗漏（v125老bug）

**位置**：`resolveBattle` 战后cleanup（~行16947）

**问题**：`_defBonus`被多个技能共用（李典协阵、庞德抬棺、全琮合围、韩当从征），但cleanup只清理`_pangdeCleanup`列表中的squad。其他技能设置的`_defBonus`残留在squad对象上。虽然下次战斗会重新设置（`||1.0`默认值），残留值理论上可被非战斗场景的`squadDEF`调用读到。

**修复**：统一cleanup中追加`delete sq._defBonus`，与`delete sq._xiaoyi_atk`并列。`_pangdeCleanup`的独立清理变为冗余但无害（double-delete）。

```js
// 修复前
u.squads.forEach(sq => { delete sq._xiaoyi_atk; });
// 修复后
u.squads.forEach(sq => { delete sq._xiaoyi_atk; delete sq._defBonus; });
```

### 陆抗移入inactive

| 武将 | 操作 | 理由 |
|------|------|------|
| 陆抗 | GENS_FULL.wu → GEN_POOL_INACTIVE | 226年生，214年剧本未出生 |

```js
{name:'陆抗', com:88,war:78,int:90,pol:82,cha:80, apt:{cavalry:'B',light:'A',heavy:'B',archer:'A',siege:'A'},
 era:{birth:226,death:274}, note:'陆逊之子，西陵之战攻守兼备，吴国最后的长城。214年剧本未出生'},
```

保留：GEN_META、GEN_TAGS、COMPAT、INTIMACY_INIT、其他武将relations引用。GEN_MAP包含inactive，profile查询正常。

### GEN_META skills清理

全部剩余"待实装"技能从GEN_META.skills中清空为`[]`：

**势力武将（14人）**：蒋济、牛金、朱灵、张绣、吴懿、吴班、朱然、吕范、张翼、马忠、严颜、顾雍、凌统、陆抗

**在野武将（13人）**：徐庶、陈宫、田丰、沮授、张松、文聘、高顺、钟会、孟达、申耽、马谡、杨洪、向宠

**已实装武将冗余条目**：邓艾第二技能"屯田"删除（保留已实装"裹毡"）；程昱、贾诩、姜维、廖化、孙策(inactive)的多行skills数组中所有待实装条目清除

**保留不动**：post描述中的"待实装"字样（2处flavor text，程昱和贾诩的post描述，不影响gameplay）

### 改动统计

| 改动类型 | 数量 |
|---------|------|
| SKILL_REGISTRY新增 | +2条（曹洪、曹休） |
| SKILL_INLINE新增标签 | +7处 |
| GEN_META.skills更新（6人实装） | 6处 |
| GEN_META.skills清空（无技能） | ~27处 |
| GENS_FULL.wu移除陆抗 | 1处 |
| GEN_POOL_INACTIVE追加陆抗 | 1处 |
| canEnthrone修改 | 1处 |
| renderDipTab称帝tooltip | 1处 |
| initGame计数器初始化 | 1处 |
| resolveBattle _defBonus cleanup修复 | 1处 |

### 技能总表更新

REGISTRY 29条（+2），INLINE 88标签（+7）
已实装：78人（魏26→28 / 蜀25 / 吴20→22 / 在野1张郃）
无技能：26人（明确清空skills:[]，非"待实装"状态）
GEN_POOL_INACTIVE：3人（孙策/典韦/陆抗）

### v127 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v128.html |
| 总行数 | ~23436行 |
| 武将总数 | 104人活跃（魏33/蜀27/吴24） + 20在野 + 3 inactive = 107人数据总量 |
| 技能系统 | REGISTRY(29)+INLINE(88)，78武将已实装 |
| 称帝门槛 | 默认10城/40信誉，华歆当官时8城/30信誉 |
| 韩当计数器 | G.genWinCount，持久累积不重置 |

---

## v128 在野武将技能实装（+7人）+ 武将调动 + 全琮nerf + 侦查bugfix

### 概述

7个在野武将新增技能实装。3人调入势力（徐庶→魏、马谡/向宠→蜀）。全琮·合围DEF+5%删除（nerf）。侦查邻城bugfix（开局neutral可侦查）。新增JINGZHOU_CITIES地域集合。

### 武将调动

| 武将 | 从 | 到 | 理由 |
|------|----|----|------|
| 徐庶 | WILD_GENS(minTurn:45) | GENS_FULL.wei | 身在曹营心在汉，214年已在魏 |
| 马谡 | WILD_GENS(minTurn:45) | GENS_FULL.shu | 诸葛亮参军，214年已在蜀 |
| 向宠 | WILD_GENS(minTurn:45) | GENS_FULL.shu | 出师表推荐，214年已在蜀 |

GEN_META同步添加到势力区域。GEN_TAGS/COMPAT等已有数据不变。WILD_GENS从20→17人。

### 新增技能清单（7人）

**SKILL_INLINE（11条新增标签，总计99）**

| # | 武将 | 技能名 | 标签 | 效果 | 挂载点 |
|---|------|--------|------|------|--------|
| 1 | 徐庶 | 识才 | shicai | 当官时招募在野成功率+10% | `_doRecruitWild` finalRate |
| 2 | 陈宫 | 犄角 | jijiao | 己方units≥2时，陈宫unit ATK×1.05 | `resolveBattle`战前 |
| 3 | 田丰 | 极谏 | jijian | 当官时己方getScoutINT全局+2 | `getScoutINT` |
| 4 | 张松 | 献图 | xiantu | 当官时细作探报费用800→400 | `stratScout` + UI |
| 5 | 张松 | 献图(退款) | xiantu_refund | 失败退款按实际费用半额 | `stratScout` |
| 6 | 文聘 | 镇荆 | zhenjing | 荆州城市守城时守方DEF×1.20 | `resolveSiegeBattle` |
| 7 | 文聘 | 镇荆(日志) | zhenjing_log | 战报日志 | `resolveSiegeBattle` |
| 8 | 高顺 | 陷阵(胜) | xianzhen_win | 所在部队胜方经验获取×1.50 | `applyBattleExp` winUnits |
| 9 | 高顺 | 陷阵(败) | xianzhen_lose | 所在部队败方经验获取×1.50 | `applyBattleExp` loseUnits |
| 10 | 钟会 | 矜功(侦查) | jingong_scout | 敌方侦查本部队INT阈值+15 | `getScoutINT` |
| 11 | 钟会 | 矜功(亲密) | jingong_intimacy | 同队其他武将亲密度每战-1 | `applyBattleIntimacy` |

### 新增基础设施

```js
const JINGZHOU_CITIES = new Set(['xiangyang','jingzhou','yiling','shangyong','changsha','lingling']);
function isJingzhou(cityId){ return JINGZHOU_CITIES.has(cityId); }
```

### 数值调整

| 武将 | 技能 | 旧值 | 新值 | 理由 |
|------|------|------|------|------|
| 全琮 | 合围 | ATK/DEF×1.05 | ATK×1.05 | DEF+5%移除，避免过强 |

### Bugfix: 侦查邻城开局无法使用

**位置**：`renderDipTab` 细作探报邻城列表生成（~行13459）

**根因**：`isHostile(fid, nb.fac)` 条件导致开局三方neutral/ally状态下无邻接"敌城"可选。

**修复**：`isHostile(fid, nb.fac)` → `nb.fac !== fid`（非己方城市均可侦查）。stratScout函数本身已有`targetCity.fac===fid`的己方排除检查，不会重复。

### 设计要点

**徐庶·识才 vs 陈群·九品**：陈群flat+5%（劝降/在野/挖角三路），徐庶flat+10%（仅在野招募）。徐庶更聚焦、更强但窄。两者可叠加：基础70%+陈群5%+徐庶10%=85%。

**陈宫·犄角 vs 全琮·合围(nerfed)**：条件完全相同（units≥2），但全琮加**全琮unit全体**ATK，陈宫加**陈宫unit全体**ATK。在同一场战斗中如果陈宫和全琮在不同unit，各自部队分别受益不冲突。

**田丰·极谏 vs 钟会·矜功**：镜像攻防设计。田丰当官→全势力情报精度+2（需INT 88即可看清精确兵力，原需90）。钟会在部队→敌方看本部队精度-15（需INT 105才看清，实际无人达到）。若田丰方侦查钟会方：85(基础)+2(田丰)-15(钟会)=72，只能看到四舍五入到5000的模糊数字。

**张松·献图**：细作探报费用800→400（含UI按钮动态显示+失败退款按比例调整200→原来固定退400）。同时修复了侦查邻城bug，使该技能开局即可使用。

**文聘·镇荆**：荆州6城（襄阳/江陵/夷陵/上庸/长沙/零陵）守城时守方全体DEF×1.20。通过_defBonus标记传递，与郝昭·拒蜀（城防倍率+0.15）不冲突可叠加。×1.20是所有守城技能中最强的单项buff，但限荆州6城。

**高顺·陷阵**：经验获取×1.50（胜败均生效），在applyBattleExp中乘在expMult上。与大将军官职buff、科技expGain叠加。高顺部队升级速度快50%，体现"铠甲斗具皆精练齐整"的练兵特色。

**钟会·矜功(亲密度)**：和魏延·反骨(dove)类似的亲密度debuff，但钟会对所有同队武将无差别-1/战。魏延只针对鸽派且-2，钟会更广但更弱。

### 技能总表更新

REGISTRY 29条（不变），INLINE 99标签（+11）
已实装：85人（魏28→29 / 蜀25 / 吴22 / 在野1张郃→8人：张郃+陈宫+田丰+张松+文聘+高顺+钟会）
无技能：19人（势力：朱灵/牛金/张绣/吴懿/吴班/张翼/马忠/严颜/马谡/向宠/朱然/吕范/顾雍。在野：沮授/孟达/申耽/杨洪/蒋琬(已实装稳政)/费祎(已实装折冲)）
GEN_POOL_INACTIVE：3人（孙策/典韦/陆抗）

### v128 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v128.html |
| 总行数 | ~23436行 |
| 武将总数 | 87人势力（魏34/蜀29/吴24） + 17在野 + 3 inactive = 107数据总量 |
| 技能系统 | REGISTRY(29)+INLINE(99)，85武将已实装 |
| 地域集合 | JIANGDONG(13城)+QINGXU(6城)+JINGZHOU(6城) |
| 全琮·合围 | ATK×1.05（DEF移除） |
| 侦查邻城 | 非己方均可（修复开局neutral不可侦查） |

---

## v129 武将技能全面Audit + 文聘镇荆bugfix

### 概述

对全部29条SKILL_REGISTRY和99条SKILL_INLINE标签进行系统性代码审查与模拟测试（95项测试用例全部通过）。发现并修复1个bug：文聘·镇荆DEF×1.20被城防倍率直接赋值覆盖，实际永远不生效。

### Bugfix: 文聘镇荆 _defBonus被城防覆盖（v128引入）

**位置**：`resolveSiegeBattle` ~行17565

**根因**：文聘镇荆在行17556通过 `sq._defBonus = (sq._defBonus || 1.0) * 1.20` 设置了1.20倍防御加成。但随后行17565的城防加成使用 `sq._defBonus = mult` 直接赋值，将文聘的1.20覆盖为城防倍率值（如1.50），文聘技能完全失效。

**修复**：
```js
// 修复前（直接赋值，覆盖文聘镇荆）
sq._defBonus = mult;

// 修复后（乘法累积）
sq._defBonus = (sq._defBonus || 1.0) * mult;
```

**影响分析**：
- 文聘镇荆（荆州守城DEF×1.20）现可与城防倍率正确叠加（如1.20×1.65=1.98）
- 孙权坐断（+5%）已乘入mult变量，不受此修改影响
- 郝昭拒蜀（+0.15）已加入defMult，不受影响
- 无文聘时`_defBonus`初始为undefined，`(undefined || 1.0) * mult = mult`，行为与修复前一致

### Audit结果摘要

**SKILL_REGISTRY（29条）**：全部condition/effect逻辑正确，无异常。
- ATK类11条：condition限定（主将/兵种/地形/状态/防守方）均正确
- DEF类14条：正负乘数、条件互斥均正确
- AP类3条：flatAP累加正确
- 势力级1条：hasFacGen+genHasOffice双重检测正确

**SKILL_INLINE（99标签）**：98条正确，1条bug（已修复）。
- 战斗前士气mutate（张飞/张苞/于禁/贺齐）：双向检测、max/min边界正确
- _xiaoyi_atk标记链（关平/李典/庞德/黄盖/全琮/陈宫/韩当/刘晔/徐盛）：乘法累积无冲突
- _defBonus标记链（李典/庞德/韩当/文聘/城防/营寨）：🔴 文聘处有覆盖bug（已修复）
- 战后cleanup（行16999）：统一delete _xiaoyi_atk和_defBonus，正确
- 王朗经义/张辽威风/乐进先登：临时mutate+战后restore机制正确
- 非战斗技能（华歆逼宫/庞统凤雏/荀攸奇策/徐庶识才/张松献图/田丰极谏/钟会矜功等）：条件检测和数值叠加均正确
- 经验/成长技能（高顺陷阵/韩当从征计数/董允秉公）：expMult乘法和cap逻辑正确

### 测试覆盖

95项测试用例，分10个模块：
1. REGISTRY ATK技能（马超/黄忠/法正/魏延条件正反例）
2. REGISTRY DEF技能（曹仁/司马懿/夏侯渊/王平/周泰/郭淮/曹彰/霍峻/丁奉/邓艾/刘封/程普/曹洪条件正反例）
3. REGISTRY AP/势力级（夏侯渊/徐晃/曹休/荀彧）
4. 多技能叠加（黄忠+王平、夏侯渊AP+DEF）
5. INLINE战斗前（张飞/于禁/关平/李典/庞德/全琮nerf/韩当）
6. INLINE攻城（文聘镇荆修复验证/郝昭/乐进/徐盛/旧bug确认）
7. INLINE非战斗（华歆/庞统/荀攸/徐庶+陈群/张松/田丰vs钟会）
8. INLINE亲密度（钟会矜功/魏延反骨鸽派）
9. 经验/成长（高顺陷阵/韩当计数）
10. cleanup验证（_xiaoyi_atk/_defBonus删除/王朗恢复）

### 改动统计

| 改动类型 | 数量 |
|---------|------|
| resolveSiegeBattle _defBonus修复 | 1行 |

### v129 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v129.html |
| 总行数 | ~23436行 |
| 武将总数 | 87人势力（魏34/蜀29/吴24） + 17在野 + 3 inactive = 107数据总量 |
| 技能系统 | REGISTRY(29)+INLINE(99)，85武将已实装，全部审计通过 |
| 文聘镇荆 | 荆州守城DEF×1.20，现可与城防倍率正确叠加 |

---

## v130 事件系统引擎 + A类天灾实装

### 概述

实装事件系统引擎框架（冷却/弹窗/优先级/队列/AI静默/快进兼容/阻塞/承诺追踪骨架）+ A类天灾改造3事件（旱灾/疫病/水患），替换旧`rollEvents()`。旧天灾从"自动扣数值+log"升级为"弹窗三选项决策"。新增疫病扩散机制。

### 引擎架构实装

**新增数据结构（initGame初始化）**：
```js
G._eventCooldown = {};     // {eventId: 剩余冷却旬数}
G._eventCatCooldown = {};  // {category: 剩余冷却旬数}
G._eventPromises = [];     // [{genName,type,promisedAt,deadline,penalty}] 承诺追踪（A类不用，骨架就绪）
G._eventQueue = [];        // 本旬排队事件 [{def,fid,ctx}]
G._pendingEvent = null;    // 当前阻塞弹窗事件
```

**事件定义接口（EVENT_DEFS数组）**：
```js
{
  id: string,              // 唯一ID
  category: string,        // 分类（冷却用）
  priority: 1|2|3,         // 1=危机 2=机遇 3=日常
  cooldown: number,        // 该事件再次触发最短间隔（旬）
  season: string[],        // 触发季节限制
  icon: string, name: string,
  condition(fid) → {city, ...} | false,
  narrative(ctx) → string,
  choices(ctx) → [{label, desc, disabled?, effect()}],
  aiChoose(ctx, personality) → choiceIndex,
}
```

**引擎核心函数（6个）**：

| 函数 | 调用时机 | 职责 |
|------|---------|------|
| `processEventCooldowns()` | nextTurn旬初（G.turn++之后） | 递减所有冷却计数器 |
| `rollEventsV2()` | nextTurn中（替代旧rollEvents位置） | 扫描EVENT_DEFS，按条件/冷却/季节筛选，AI静默处理，玩家弹窗 |
| `processPlagueSpreads()` | nextTurn中rollEventsV2之后 | A2疫病扩散链处理 |
| `checkEventPromises()` | nextTurn中 | 承诺到期检查（骨架，A类无承诺） |
| `_showEventToPlayer(evt)` | rollEventsV2内部 | 渲染事件弹窗 |
| `resolveEventChoice(idx)` | 玩家点击选项 | 执行effect，设冷却，关弹窗 |

**阻塞机制**：`nextTurn()`开头检查`G._pendingEvent`，有未处理事件时阻止推进并提示。

**快进模式**：`_fastForward`为true时，玩家事件也按AI逻辑自动处理，不弹窗。

**冷却规则**：
- 同一事件ID冷却：12旬（A类统一）
- 同一类别冷却：3旬（防同类扎堆）
- 冷却在effect执行后设置，同旬不同势力可各自触发（独立roll）

### A类天灾事件实装（3个）

#### A1 旱灾（id:'drought'）
- 触发：秋季，8%概率，北方城市(row<19)，冷却12旬
- 三选项：①开仓赈济（存粮×0.6/民心-2/豪族+5）②强征余粮（存粮×0.85/豪族-15/民心-12）③听天由命（人口×0.95/民心-8/存粮×0.8）
- AI选择：保守(diploAggro<0.5)→①，激进(>0.7)→②，均衡→③

#### A2 疫病（id:'plague'）
- 触发：夏季，5%概率，任意城市，冷却12旬
- 三选项：①派医赈疫（金-300/人口×0.96/民心-5/popQuality-5/豪族+3/不扩散）②封城隔断（金-150/人口×0.94/民心-10/popQuality-10/不扩散）③不管（人口×0.92或有医馆×0.96/民心-15/popQuality-15/可能扩散）
- 金不足时①②选项变灰不可选
- **扩散机制**：选③时标记`city._plague={turn,hopsLeft:2}`，下旬`processPlagueSpreads()`处理——30%概率扩散到一座路网邻城（含敌方），扩散目标受同等疫病效果，`hopsLeft-1`，到0不再扩散。已有`_plague`的城市跳过。
- AI城市被扩散到时：保守花300治疗，均衡花150封城，激进不管（继续扩散链）

#### A3 水患（id:'flood'）
- 触发：夏季，6%概率，南方城市(row>27)，冷却12旬
- 三选项：①征民修堤（金-200/存粮×0.95/民心-3/豪族-5）②迁民避水（人口×0.90/民心-5）③听天由命（民心-8/存粮×0.9）
- 金不足时①变灰

### 弹窗UI

- 专用`eventModal`（z-index:470，高于genericModal的450/courtModal的460）
- 水墨风格，与现有UI统一（宣纸底色/墨色文字/serif字体）
- 标题栏：事件图标+名称 | 年份·季节
- 内容区：城市名标签 + 叙事文本 + 选项卡片（hover高亮，disabled半透明）
- **强制选择**：eventModal不可点击外部关闭，不设关闭按钮，必须选择一个选项
- AI势力事件只写log，不弹窗

### nextTurn接入点（4处修改）

| 位置 | 修改 |
|------|------|
| nextTurn开头 | 新增`G._pendingEvent`阻塞检查 |
| G.turn++之后 | 新增`processEventCooldowns()`调用 |
| 原rollEvents()位置 | 替换为`rollEventsV2()` + `processPlagueSpreads()` + `checkEventPromises()` |
| initGame | 新增5个G对象事件状态初始化 |

### 改动统计

| 改动类型 | 数量 |
|---------|------|
| 新增HTML | eventModal弹窗（10行） |
| 新增JS（事件引擎+定义） | ~350行 |
| 删除JS（旧rollEvents） | ~30行 |
| initGame修改 | +5行初始化 |
| nextTurn修改 | 4处接入 |
| 净增 | ~337行 |

### v130 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v130.html |
| 总行数 | ~23786行 |
| 武将总数 | 87人势力（魏34/蜀29/吴24） + 17在野 + 3 inactive = 107数据总量 |
| 技能系统 | REGISTRY(29)+INLINE(99)，85武将已实装，全部审计通过 |
| 事件系统 | 引擎框架就绪 + A类天灾3事件已实装 |
| EVENT_DEFS | 3条（drought/plague/flood），后续B~G类追加到同一数组 |
| 承诺追踪 | G._eventPromises骨架就绪，A类不使用 |

### v130 Bugfix: 在野武将元数据查找统一 + 称谓更新

#### Bug 2/3 根因：GEN_META与WILD_GEN_META割裂

**问题**：在野武将的元数据（title/skills/loyalty/values/clan/relations等）存储在 `WILD_GEN_META` 中，但全代码有27处读取武将元数据时只查 `GEN_META[name]`，不fallback到 `WILD_GEN_META[name]`。导致：
- 在野武将招募入队后，武将详情弹窗title显示为空
- 武将列表中技能数显示为0
- 俘虏处置弹窗读不到values标签（影响忠诚判定叙事）
- initGame开局小传中在野武将的clan/birthplace信息丢失

**修复**：新增统一查找函数 `getGenMeta(name)`，全局替换所有 `GEN_META[name]` 和 `GEN_META[name]||WILD_GEN_META[name]||{}` 的变体模式。

```js
// ★ v130fix: 统一武将元数据查找（GEN_META优先，fallback WILD_GEN_META）
function getGenMeta(genName){ return GEN_META[genName] || WILD_GEN_META[genName] || {}; }
```

**修复范围**：27处调用点全部统一（含5处纯GEN_META直读 + 7处手动双源查找 + 15处其他散落引用）。

#### Bug 3: 在野武将称谓从官职改为历史典故

| 武将 | 旧称谓 | 新称谓 | 典故 |
|------|--------|--------|------|
| 陈宫 | 中牟县令·谋士 | 宁死不屈 | 白门楼就义不降 |
| 田丰 | 冀州别驾 | 刚而犯上 | 袁绍评语，性格刚直 |
| 沮授 | 奋威将军·监军 | 河北谋主 | 袁绍帐下首席谋士 |
| 张松 | 益州别驾 | 倒持西蜀 | 献益州地图助刘备入蜀 |
| 庞德 | 立义将军 | 抬棺决死 | 樊城之战抬棺出征 |
| 文聘 | 江夏太守 | 荆州柱石 | 镇守荆州数十年 |
| 邓艾 | 镇西将军 | 偷渡阴平 | 灭蜀奇策 |
| 钟会 | 镇西将军 | 志大才疏 | 伐蜀后谋反失败 |
| 孟达 | 新城太守 | 反复无常 | 三次易主 |
| 申耽 | 上庸太守 | 上庸豪族 | 上庸地方势力 |
| 马谡 | 越嶲太守 | 言过其实 | 刘备遗言评语 |
| 郝昭 | 东羌校尉 | 陈仓坚守 | 千余兵拒诸葛亮数万 |
| 张任 | 益州将领 | 落凤之弓 | 落凤坡射杀庞统 |
| 杨洪 | 蜀郡太守 | 蜀中干吏 | 蜀地内政能臣 |
| 向宠 | 中领军 | 出师表所荐 | 诸葛亮亲荐"性行淑均" |

保留不动（已有好称谓）：徐庶"单福·颍川名士"、高顺"陷阵营统领"、李严"托孤重臣"、蒋琬"社稷之器"、费祎"折冲良臣"

#### Bug 1 分析：官职任命

代码逻辑上 `openPostAppoint` 使用 `G.generals[fid]` 列表，在野武将招募后确实会被 push 进去。merit 初始值10满足三品武官(≥10)/文官(≥8)门槛。**实际原因可能是三品位已满或merit不足更高品级**，也可能是 Bug 2 导致显示异常使用户误判。本次修复 Bug 2 后应再次验证。

### v130 Bugfix: 玩家守城攻守方反转（严重）

#### 根因

当AI攻打玩家城市时，战斗触发路径 `_triggerBattleFromContact` 正确计算了 `playerIsAttacker=false`，但**没有存入** `_pendingBattleConfirms` 对象。后续 `_showNextBattleConfirm` 和 `confirmSiegeBattle` 无法区分玩家是攻方还是守方，导致：

1. **UI层**：`_showSiegeBattleConfirm` 硬编码攻方视角，玩家守城时看到"我方攻城"弹窗
2. **战斗结算层**：`confirmSiegeBattle` 调用 `resolveSiegeBattle(playerSide, enemySide, city)` — 当玩家是守方时，守方被当攻方传入，**攻守完全反转**
3. **城防buff全部失效**：守方吃不到城防倍率(defMult)、郝昭拒蜀、文聘镇荆、孙权坐断等守城技能；攻方反而错误地获得了城防buff
4. **撤退逻辑错误**：玩家选"撤围退兵"时清的是playerSide（实为守军）的siege状态

#### 修复内容（5处）

| # | 位置 | 修复 |
|---|------|------|
| 1 | `_triggerBattleFromContact` 攻城push | 新增 `playerIsAttacker` 字段存入 `_pendingBattleConfirms` |
| 2 | `_showNextBattleConfirm` 攻城分支 | 根据 `playerIsAttacker` 分流：true→攻城弹窗，false→守城弹窗 |
| 3 | 新增 `_showSiegeDefendConfirm()` | 守城视角弹窗：左侧显示"🏰 守方（我军）"+城防军，右侧显示"⚔ 攻方（敌军）"+围城旬数；两个选项"坚守城池"/"出城迎战" |
| 4 | 新增 `confirmSiegeDefend(choice)` | "坚守"→`resolveSiegeBattle(enemy, player, city)`正确攻守方向；"出城迎战"→`resolveBattle(player, enemy, 'plain')`野战无城防 |
| 5 | `autoResolvePendingBattle` 快进模式 | 根据 `conf.playerIsAttacker` 决定攻守方向，避免快进时同样反转 |

#### 守城弹窗UI设计

- 标题："【城名】敌军攻城"
- 左侧（绿色边框）：🏰 守方 + 我方部队 + 城防军人数
- 右侧（红色边框）：⚔ 攻方 + 敌方部队 + 围城旬数
- 城防信息栏：我方城防加成×N.NN + 围城进度
- **坚守城池**按钮（绿色主按钮）：走攻城战结算，守方吃城防倍率+所有守城技能
- **出城迎战**按钮（红色次按钮）：走普通野战结算，双方无城防buff，战后敌方围城状态清除

#### 出城迎战设计说明

出城迎战走 `resolveBattle(playerSide, enemySide, 'plain')` 而非 `resolveSiegeBattle`。这是有意设计：
- 主动出城放弃城防优势，属于高风险高回报策略
- 胜利后敌方siege状态清除，敌军需重新行军围城
- 败退后城防军仍在（未参与野战），敌方可继续围城

---

## v130 B类武将人事事件实装（4个）+ 承诺追踪完整实装

### 概述

实装B类武将人事事件4个（B1请命出战/B2将相不和/B3功高震主/B4故人来投），全部按handover设计文档实装。承诺追踪机制从骨架升级为完整逻辑，支持B1/B3的deadline惩罚和B4的延迟加入。

### B1 请命出战（id:'gen_restless'）

- **触发**：values含"野心"或combat='hawk'，闲置>6旬（不在部队/无官职/无太守），忠诚<65
- **冷却**：24旬，category='personnel'
- **三选项**：
  - ① 允其出征：忠+8，3旬内须编入部队（promise type='B1_deploy'，未履约忠-15）
  - ② 委以重任：忠+5，3旬内须任命官职/太守（promise type='B1_office'，未履约忠-10）
  - ③ 温言安抚：忠-5（投机者额外-5）
- **AI选择**：总是选①

### B2 将相不和（id:'gen_conflict'）

- **触发**：同一部队中两武将亲密度<-30，且至少一方有官职/太守
- **冷却**：18旬
- **叙事**：鹰鸽路线之争有专用叙事文本
- **三选项**：
  - ① 力挺A斥B：A忠+5，B忠-10
  - ② 力挺B斥A：反向
  - ③ 设宴调和：金-100，亲密+10，各忠+2。亲密<-50效果减半（金照扣）
- **AI选择**：金够→调和，金不够→挺A

### B3 功高震主（id:'gen_overpowered'）

- **触发**：某武将war+com>170，在部队中征战>12旬，非"忠义"标签
- **冷却**：36旬
- **叙事**：根据seniority（founding vs defector）变化
- **四选项**：
  - ① 加封安抚：忠+8（野心仅+3），3旬内须任命官职（promise type='B3_office'，未履约忠-12）
  - ② 召回述职：自动hexAstar寻路回最近己方城市，忠-5，全队士气-8。siege中先清除围城状态。已在城中时不可选
  - ③ 遣使慰劳：金-200，忠+5
  - ④ 不予理会：写入`G._poachVulnerable[genName]`，挖角忠诚阈值提至65（投机75），被劝降率+15%
- **AI选择**：金够→③慰劳，否则→①加封

### B4 故人来投（id:'gen_referral'）

- **触发**：在野武将池中某人的relations包含己方武将（义兄弟/义友/同乡/同窗/挚友），且引荐人忠诚>70
- **冷却**：12旬
- **三选项**：
  - ① 欣然接纳：直接加入，初始忠诚=引荐人忠诚×0.8，引荐人忠+3，双方亲密+15
  - ② 考察再议：3旬后自动加入（通过promise B4_delayed），初始忠诚=引荐人忠诚×0.8-10
  - ③ 婉拒：引荐人忠-8，该武将6旬内不再触发
- **AI选择**：总是接纳

### 承诺追踪完整实装

`checkEventPromises()` 从骨架升级为完整逻辑：

**每旬检查流程**：
1. 先扫描是否已履约——提前清除promise
   - B1_deploy：该武将出现在任一部队squads中 → 履约
   - B1_office / B3_office：该武将有getGenPostDef返回值或被任命为某城prefect → 履约
   - 武将不在G.generals中（被俘/阵亡/叛逃）→ 清除不惩罚
2. 检查到期未履约 → 执行惩罚（忠诚扣减）
3. B4_delayed特殊处理：到期后自动将在野武将加入势力

**新增数据结构**：
```js
G._poachVulnerable = {};  // B3④ {genName: {threshold:65, surrenderBonus:0.15}}
```

### 改动统计

| 改动类型 | 数量 |
|---------|------|
| EVENT_DEFS新增 | +4条（B1~B4） |
| checkEventPromises重写 | ~45行 |
| initGame新增 | +1行（_poachVulnerable初始化） |
| 净增 | ~340行 |

### EVENT_DEFS总表

| ID | 类别 | 优先级 | 冷却 | 季节 |
|----|------|--------|------|------|
| drought | disaster | 1 | 12 | 秋 |
| plague | disaster | 1 | 12 | 夏 |
| flood | disaster | 1 | 12 | 夏 |
| gen_restless | personnel | 2 | 24 | — |
| gen_conflict | personnel | 2 | 18 | — |
| gen_overpowered | personnel | 2 | 36 | — |
| gen_referral | personnel | 2 | 12 | — |

### v130 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v130.html |
| 总行数 | ~24255行 |
| 事件系统 | 引擎框架 + A类3事件 + B类4事件，共7个EVENT_DEFS |
| 承诺追踪 | 完整实装（B1/B3 deadline惩罚 + B4延迟加入） |
| _poachVulnerable | B3④挖角脆弱标记，initGame初始化 |

---

## v130 C类豪族/派系事件实装（4个）+ B类修正 + 朝议美化

### C类事件实装（4个）

#### C1 豪族献策（id:'gentry_offer'）
- **触发**：12%/旬，某己方城市gentry>70 + 该城gentryFac影响力>20%
- **冷却**：18旬，category='gentry'
- 三选项：①接受资助（金+500/gentry+8/非本地太守忠-5）②接受并换本地太守（金+500/gentry+3）③婉拒（gentry-8）
- ②无本地士族时变灰不可选

#### C2 士族逼宫（id:'gentry_pressure'）
- **触发**：8%/旬，某gentry派系影响力>35% + ≥3人无官职
- **冷却**：24旬，priority=1（危机）
- 四选项：①批量封3人三品官（各忠+10/其他派系忠-3/tier3不足时变灰）②只封1人（忠+8/其余忠-5）③以能力论官（该派系忠-5/gentry-5/humble忠+3）④拖延（该派系-0.3忠/旬持续12旬）
- ④通过`G._factionLoyaltyDecay`实现持续衰减，nextTurn中processFactionLoyalty后处理

#### C3 寒门抱怨（id:'humble_complaint'）
- **触发**：10%/旬，≥3个humble无官职 + gentry origin占官位>60%
- **冷却**：24旬
- 三选项：①破格提拔（该人忠+15/全humble忠+3/全城gentry-3/官位不足时变灰）②唯才是举（全体忠+2）③不回应（humble忠各-3）

#### C4 豪族不满（id:'gentry_unrest'）
- **触发**：10%/旬，某城gentry<30 + gentryFac影响力<10% + 太守非本地gentry
- **冷却**：24旬，priority=1
- 三选项：①拨款安抚（金-400/gentry+15/民心+5）②换本地太守（gentry+12）③不管（6旬promise，到期gentry仍<30→暴动）
- **暴动效果**：garrison清零、民心-25、pop×0.95、gentry归零，弹事件弹窗通知
- **提前履约**：gentry回升≥30时自动清除promise
- **提醒弹窗**：到期前1旬弹"豪族不满加剧"提醒

### 新增数据结构

```js
G._factionLoyaltyDecay = {};  // C2④ {facId_fid: {perTurn:-0.3, remaining:12}}
```

### B类修正

| 修正 | 内容 |
|------|------|
| B1~B4加概率 | B1:15% B2:20% B3:10% B4:12%/旬 |
| B1②已有官职 | 变灰不可选 |
| B3①有官职 | 改为"赐金安抚"金-300忠+8（无承诺） |
| B3 ruler过滤 | 君主不触发功高震主 |
| Promise提醒 | deadline前1旬弹事件弹窗提醒 |

### 朝议弹窗美化
- 确认按钮：金色渐变→宣纸底色+墨线边框+微阴影
- 卡片选中态：粗金边→细墨边+微阴影

### C1 condition死代码修复
原代码有一个死循环`for(city of cities){ if(city.fac!==fid) return false }`会导致C1在有敌方城市时永远不触发，已删除。

### EVENT_DEFS总表（11个）

| ID | 类别 | 优先级 | 冷却 | 概率 |
|----|------|--------|------|------|
| drought | disaster | 1 | 12 | 8%(秋) |
| plague | disaster | 1 | 12 | 5%(夏) |
| flood | disaster | 1 | 12 | 6%(夏) |
| gen_restless | personnel | 2 | 24 | 15% |
| gen_conflict | personnel | 2 | 18 | 20% |
| gen_overpowered | personnel | 2 | 36 | 10% |
| gen_referral | personnel | 2 | 12 | 12% |
| gentry_offer | gentry | 2 | 18 | 12% |
| gentry_pressure | gentry | 1 | 24 | 8% |
| humble_complaint | gentry | 2 | 24 | 10% |
| gentry_unrest | gentry | 1 | 24 | 10% |

---

## v130 最终交接总结

### 本轮全部改动清单

#### 新功能
1. **事件系统引擎**（冷却/弹窗/队列/AI静默/快进兼容/阻塞/承诺追踪）
2. **A类天灾3事件**（旱灾/疫病含扩散/水患）
3. **B类武将人事4事件**（请命出战/将相不和/功高震主/故人来投）
4. **C类豪族派系4事件**（豪族献策/士族逼宫/寒门抱怨/豪族不满）
5. **承诺追踪完整系统**（写入→提醒→履约→惩罚，合并日志）
6. **C2④派系忠诚持续衰减**（`G._factionLoyaltyDecay`）

#### Bugfix
1. **在野武将元数据查找统一**：`getGenMeta()`，27处修复
2. **在野武将称谓更新**：15个从官职改为历史典故
3. **玩家守城攻守方反转**（严重）：5处修复，新增守城弹窗`_showSiegeDefendConfirm`+`confirmSiegeDefend`
4. **B类事件ctx.city空引用**：引擎5处safe access修复
5. **B3 getSeniority不存在**：改为正确的`seniority(name,fid)`
6. **B3征战时间永远=0**：`_createdTurn`不存在，改用`genJoinTurn`
7. **B3未过滤ruler**：曹操不再触发功高震主
8. **B4关系类型过窄**：加入"同僚""同谋"使其可触发
9. **C1死循环**：condition中`return false`误用导致C1永不触发
10. **C2④decay key解析死代码**：删除错误的`split('_')`行
11. **C2/C3弹窗标签空白**：safe access扩展覆盖`facLabel`/`complainerName`
12. **Promise提醒只显示1人**：改为合并同类同deadline为一个弹窗
13. **履约/惩罚日志按reason/penalty分组**：不再混淆不同类型

#### 设计迭代
1. **B类加概率门槛**：B1:15% B2:20% B3:10% B4:12%/旬
2. **B1②已有官职变灰**
3. **B3①有官职→赐金安抚**（金-300忠+8无承诺）
4. **C2①②/C3① promise机制**：有空位自动封官，无空位给3旬时间
5. **朝议弹窗美化**：确认按钮+卡片选中态改为水墨风

### 新增数据结构汇总

```js
G._eventCooldown = {};        // {eventId: 剩余冷却旬数}
G._eventCatCooldown = {};     // {category: 剩余冷却旬数}
G._eventPromises = [];        // [{genName,fid,type,promisedAt,deadline,penalty,_c4data?,_b4data?}]
G._eventQueue = [];           // 本旬排队事件
G._pendingEvent = null;       // 当前阻塞弹窗事件
G._poachVulnerable = {};      // B3④ {genName:{threshold,surrenderBonus}}
G._factionLoyaltyDecay = {};  // C2④ {facId_fid:{perTurn,remaining}}
```

### Promise类型总表

| type | 来源 | 履约条件 | 惩罚 | 提醒文案 |
|------|------|---------|------|---------|
| B1_deploy | B1①允出征 | 武将在部队squads中 | 忠-15 | "编入部队" |
| B1_office | B1②委重任 | 有官职或太守 | 忠-10 | "任命官职或太守" |
| B3_office | B3①加封(无官职) | 有官职或太守 | 忠-12 | "任命官职" |
| C2_office | C2①②(无空位) | 有官职或太守 | 忠-8/-5 | "任命官职" |
| C3_office | C3①(无空位) | 有官职或太守 | 忠-10 | "任命官职" |
| C4_unrest | C4③不管 | gentry≥30 | 暴动 | "安抚豪族" |
| B4_delayed | B4②考察 | 到期自动加入 | 无 | 不提醒 |

### EVENT_DEFS总表（11个）

| ID | 类别 | 优先级 | 冷却 | 概率 | 季节 |
|----|------|--------|------|------|------|
| drought | disaster | 1 | 12 | 8% | 秋 |
| plague | disaster | 1 | 12 | 5% | 夏 |
| flood | disaster | 1 | 12 | 6% | 夏 |
| gen_restless | personnel | 2 | 24 | 15% | — |
| gen_conflict | personnel | 2 | 18 | 20% | — |
| gen_overpowered | personnel | 2 | 36 | 10% | — |
| gen_referral | personnel | 2 | 12 | 12% | — |
| gentry_offer | gentry | 2 | 18 | 12% | — |
| gentry_pressure | gentry | 1 | 24 | 8% | — |
| humble_complaint | gentry | 2 | 24 | 10% | — |
| gentry_unrest | gentry | 1 | 24 | 10% | — |

### 尚未实装的事件类别

| 类别 | 事件数 | 状态 |
|------|--------|------|
| D. 演义名场面 | 3 | handover设计完成，待实装 |
| E. 情报军事 | 4 | handover设计完成，待实装 |
| F. 外交大势 | 3 | handover设计完成，待实装 |
| G. 日常氛围 | 3 | handover设计完成，待实装 |

### v130 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v130.html |
| 总行数 | ~24759行 |
| 武将总数 | 87人势力（魏34/蜀29/吴24） + 17在野 + 3 inactive = 107数据总量 |
| 技能系统 | REGISTRY(29)+INLINE(99)，85武将已实装，全部审计通过 |
| 事件系统 | 引擎框架 + A类3 + B类4 + C类4 = 11个EVENT_DEFS |
| 承诺追踪 | 7种promise类型，合并提醒/日志 |
| 新增函数 | getGenMeta / rollEventsV2 / processPlagueSpreads / checkEventPromises / processEventCooldowns / _showEventToPlayer / resolveEventChoice / _showSiegeDefendConfirm / confirmSiegeDefend |

### v130 最终Bugfix汇总（B/C类事件调试）

#### ctx.city引用崩溃（导致游戏卡死）
B类事件ctx没有city字段，引擎5处直接读ctx.city.name导致JS异常。修复为safe access链 `ctx.city?.name||ctx.genName||ctx.facLabel||ctx.complainerName||''`。

#### B类事件必然触发
B1~B4 condition中无概率门槛，条件满足即100%触发。修复：B1:15% B2:20% B3:10% B4:12%/旬。

#### B3 getSeniority不存在
函数名实为`seniority(name, fid)`。已修正。

#### B3 征战时间永远=0
用了不存在的`_createdTurn`字段。改为`G.genJoinTurn`距今>12旬。

#### B3 ruler未过滤
曹操带兵也触发"功高震主"。已加`g.role==='ruler'` continue。

#### B4 关系类型过窄
只匹配义兄弟/义友/同乡/同窗/挚友，但在野武将大多是"同僚/同谋"。已扩展。

#### B1②/B3① 已有官职问题
- B1②"委以重任"：已有官职时变灰不可选
- B3①有官职时：改为"赐金安抚"金-300忠+8无承诺（与③金-200忠+5形成取舍）

#### C1 condition死循环
遍历所有城市，遇到非己方城市直接return false。已删除死代码。

#### C2①②/C3① 官位不足时强制变灰
改为：有空位→自动封官；无空位→照给忠诚+3旬promise让玩家腾位置。选项永不变灰。

#### C2④ decay key解析死代码
`const [facId, fid] = key.split('_')` 错误解析含下划线的facId。已删除（后面lastIndexOf版本正确）。

#### C2/C3弹窗标签空白
ctx没有city也没有genName。safe access扩展为含facLabel/complainerName。

#### Promise提醒只显示1人
C2①写入3条独立promise，提醒弹窗forEach中第一个设了_pendingEvent后其余被跳过。改为先标记_remindNeeded再按type分组合并为一个弹窗。

#### 履约/惩罚日志
- 履约：按reason分组 `✅ 承诺履约：郭嘉、满宠（已任命）`
- 惩罚：按penalty值分组 `⚠ 承诺未兑现：钟繇忠诚-8`
- 混合场景（部分履约部分未）同旬输出多条，清晰可读

#### 朝议弹窗美化
确认按钮从金色渐变改为宣纸底+墨边，卡片选中态从粗金边改为细墨边+微阴影。

### 下轮待实装

事件系统剩余：
- D类演义名场面（3个，一次性）
- E类情报军事（4个）
- F类外交大势（3个）
- G类日常氛围（3个）

共13个事件待实装（当前已实装11个：A3+B4+C4）。

### Promise类型总表

| type | 来源 | 履约条件 | 惩罚 | 提醒 |
|------|------|---------|------|------|
| B1_deploy | B1①允出征 | squads中有该武将 | 忠-15 | ✅ |
| B1_office | B1②委以重任 | 有官职或太守 | 忠-10 | ✅ |
| B3_office | B3①加封(无官职) | 有官职或太守 | 忠-12 | ✅ |
| C2_office | C2①②封官(无空位) | 有官职或太守 | 忠-8/-5 | ✅ |
| C3_office | C3①提拔(无空位) | 有官职或太守 | 忠-10 | ✅ |
| B4_delayed | B4②考察再议 | 到期自动加入 | 无 | 不提醒 |
| C4_unrest | C4③不管 | gentry≥30 | 暴动 | ✅ |

---

## v131 C1/C4 太守任命bugfix

### 问题

C1②（豪族献策→换本地太守）和C4②（豪族不满→换本地太守）的候选池包含所有本地士族武将，不排除已在任太守、有官职、正在带兵的武将。导致两个bug：
1. **双城太守**：被选中的武将若已是别城太守，会同时担任两城太守（手动赋值 `c.prefect=best.name` 不清除旧城）
2. **抢人**：正在带兵打仗或有官职的武将也可能被选为太守

### 修复（4处）

| # | 位置 | 修复前 | 修复后 |
|---|------|--------|--------|
| 1 | C1 condition localGentryGens（~行6734） | 只过滤 origin=gentry + region匹配 | 增加排除：有官职/是太守/在部队中 |
| 2 | C1② effect（~行6767） | 手动 clearPrefectByGen + 赋值 + 忠+8 | 改用 `setPrefect(c.id, best.name)`（内含解除旧城+忠+8+chronicle） |
| 3 | C4 condition localGentryGens（~行7010） | 同C1，只过滤origin+region | 增加同样的空闲过滤 |
| 4 | C4② effect（~行7039） | 手动 clearPrefectByGen + 赋值 | 改用 `setPrefect(c.id, best.name)` |

### 设计决策

- **Promise履约语义**：确认为"瞬时履约"——封过官即算数，撤官不追溯。当前代码行为正确，不改。
- **C类Promise审计结果**：C2/C3/C4 promise逻辑全部无bug，多人独立追踪、部分履约只罚未履约者、城市丢失静默清除等边界case均正确。

### 候选池过滤条件（C1②/C4②共用逻辑）

```
本地士族（origin=gentry + region匹配）
+ 非君主
+ 无官职（getGenPostDef返回空）
+ 非任何城市太守
+ 不在任何部队squads中
→ 无人满足条件时选项变灰
```

### 改动统计

| 改动类型 | 数量 |
|---------|------|
| C1 condition过滤增强 | +4行 |
| C1② effect简化 | -5行+1行 |
| C4 condition过滤增强 | +4行 |
| C4② effect简化 | -3行+1行 |
| 净增 | ~2行（行数基本不变） |

### B3④ 挖角脆弱标记接线（死代码修复）

**问题**：B3④"不予理会"写入了 `G._poachVulnerable[name] = {threshold:65, surrenderBonus:0.15}`，但挖角阈值计算（processLoyalty内 `_poachThr`）从未读取该标记，导致"更易被挖角"效果完全不生效。

**修复（3处）**：

| # | 位置 | 修复 |
|---|------|------|
| 1 | B3④ effect（~行6621） | 去掉 `surrenderBonus`，简化为 `{threshold}` |
| 2 | processLoyalty _poachThr计算（~行10018后） | 新增读取 `G._poachVulnerable[name].threshold`，取max |
| 3 | initGame注释（~行4702） | 同步更新数据结构注释 |

**设计决策**：`surrenderBonus`（挖角成功率+15%）去掉，threshold提到65已经够狠，保持简单。

### B类完整审计结论

| 事件 | 结论 |
|------|------|
| B1 请命出战 | ✅ 无bug |
| B2 将相不和 | ✅ 无bug |
| B3①②③ 功高震主 | ✅ 无bug |
| B3④ 不予理会 | 🔧 已修复（threshold接线） |
| B4①② 故人来投 | ✅ 无bug |
| B4③ 婉拒冷却 | ⚠ per-gen冷却死代码，但全局冷却12旬已足够，不修 |

---

## v131 D类演义名场面事件实装（3个）+ 一次性事件引擎

### 一次性事件引擎

**机制**：EVENT_DEFS中 `oneTime:true` 的事件，触发后写入 `G._eventFired[def.id]=G.turn`，rollEventsV2 在检查时跳过已触发的事件。

**改动点（4处）**：

| # | 位置 | 改动 |
|---|------|------|
| 1 | rollEventsV2 事件遍历（~行7299） | 新增 `def.oneTime && G._eventFired?.[def.id]` 跳过检查 |
| 2 | AI静默处理路径（~行7333） | 触发后写入 `G._eventFired[def.id]` |
| 3 | 玩家快进路径（~行7354） | 同上 |
| 4 | resolveEventChoice 玩家交互路径（~行7420） | 同上 |

**新增数据结构**：
```js
G._eventFired = {};  // {eventId: turn} 一次性事件触发记录
```

### D1 拜将大典（id:'general_ceremony'）

- **触发**：某势力≥5个武将 com+war≥165（排除ruler），一次性
- **叙事**：三版差异化
  - 蜀国关张赵马黄全在候选中 → "五虎上将"
  - 魏国张辽乐进于禁张郃徐晃全在候选中 → "五子良将"
  - 其余 → 通用"五大将军"
- **玩家交互**：点击"册封"后弹出多选面板，列出所有≥165候选人（含统帅+武力数值），玩家勾选5人确认
- **AI行为**：自动取com+war前5
- **效果**：被选5人忠各+10，com/war经验各+25，全势力部队士气+5
- **新增函数**：`_showCeremonyPicker()`、`_updateCeremonyBtn()`、`_confirmCeremony()`、`_applyCeremony()`
- **INTIMACY_PRESET**：新增 `['关羽','黄忠',-15]`

### 官职任命下拉候选人数修复

**问题**：`openPostAppoint()` 中 `candidates.slice(0,8)` 硬限制只显示前8人，超出部分不可见。

**修复**：去掉 `.slice(0,8)`，显示全部达标候选人。列表本身已有 `max-height:200px;overflow-y:auto` 滚动支持。

### D3 铜雀台（id:'bronze_tower'）

- **触发**：魏≥15城 + 曹操为君主，一次性
- **选项**：
  - ① 修建铜雀台：金-800，首都民心+10，全势力忠+3
  - ② 遣使求亲：对吴好感+20（魏吴rel≥50时disabled）
  - ③ 不搞：无

### D4 出师表（id:'chu_shi_biao'）

- **触发**：蜀拥有汉中 + 诸葛亮有丞相官职 + 蜀魏enemy + 蜀≥3部队，一次性，priority:1
- **选项**：
  - ① 准其北伐：全部队士气+10，忠义/汉室死忠忠+8，hawk忠+5，dove忠-5
  - ② 暂缓北伐：诸葛亮忠-5，汉室死忠忠-5，hawk忠-5，dove忠+3

### EVENT_DEFS总表（14个）

| ID | 类别 | 优先级 | 冷却 | 概率 | 一次性 |
|----|------|--------|------|------|--------|
| drought | disaster | 1 | 12 | 8%(秋) | — |
| plague | disaster | 1 | 12 | 5%(夏) | — |
| flood | disaster | 1 | 12 | 6%(夏) | — |
| gen_restless | personnel | 2 | 24 | 15% | — |
| gen_conflict | personnel | 2 | 18 | 20% | — |
| gen_overpowered | personnel | 2 | 36 | 10% | — |
| gen_referral | personnel | 2 | 12 | 12% | — |
| gentry_offer | gentry | 2 | 18 | 12% | — |
| gentry_pressure | gentry | 1 | 24 | 8% | — |
| humble_complaint | gentry | 2 | 24 | 10% | — |
| gentry_unrest | gentry | 1 | 24 | 10% | — |
| general_ceremony | story | 2 | 9999 | 100% | ✅ |
| bronze_tower | story | 2 | 9999 | 100% | ✅ |
| chu_shi_biao | story | 1 | 9999 | 100% | ✅ |

### 改动统计

| 改动类型 | 数量 |
|---------|------|
| EVENT_DEFS新增 | +3条（D1/D3/D4） |
| 一次性引擎改动 | 4处（rollEventsV2 + resolveEventChoice） |
| initGame新增 | +1行（_eventFired初始化） |
| INTIMACY_PRESET新增 | +1条（关羽-黄忠-15） |
| 净增 | ~180行 |

### 尚未实装的事件类别

| 类别 | 事件数 | 状态 |
|------|--------|------|
| E. 情报军事 | 4 | handover设计完成，待实装 |
| F. 外交大势 | 3 | handover设计完成，待实装 |
| G. 日常氛围 | 3 | handover设计完成，待实装 |

共10个事件待实装（当前已实装14个：A3+B4+C4+D3）。

### v131 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v131.html |
| 总行数 | ~25008行 |
| 事件系统 | 引擎框架 + A类3 + B类4 + C类4 + D类3 = 14个EVENT_DEFS |
| 一次性事件 | D1/D3/D4，G._eventFired追踪 |
| 承诺追踪 | 7种promise类型，合并提醒/日志 |
| 新增函数 | _showCeremonyPicker / _updateCeremonyBtn / _confirmCeremony / _applyCeremony |

### v131 全部改动清单

#### Bugfix
1. **C1②/C4② 太守双城任命**：候选池改为空闲武将（无官职/非太守/不在部队），用setPrefect()任命
2. **B3④ 挖角脆弱标记死代码**：_poachVulnerable.threshold接线到processLoyalty的_poachThr计算
3. **官职任命下拉限8人**：openPostAppoint()去掉.slice(0,8)，显示全部候选

#### 新功能
1. **一次性事件引擎**：oneTime字段 + G._eventFired标记，三条路径（AI/快进/交互）全覆盖
2. **D1 拜将大典**：≥5人com+war≥165，玩家多选5人面板，忠+10/com经验+25/war经验+25/全军士气+5，三版叙事（五虎/五子/通用）
3. **D3 铜雀台**：魏≥15城+曹操，修建/求亲/不搞三选项
4. **D4 出师表**：蜀有汉中+诸葛亮丞相+蜀魏敌对+≥3部队，鹰鸽分化

#### 数据变更
1. **INTIMACY_PRESET**：+1条（关羽-黄忠-15）
2. **G._eventFired**：initGame初始化
3. **G._poachVulnerable**：简化为{threshold}，去掉surrenderBonus

### 下轮待实装

事件系统剩余：
- E类情报军事（4个）
- F类外交大势（3个）
- G类日常氛围（3个）

共10个事件待实装（当前已实装14个：A3+B4+C4+D3）。
---

## v132 E/F/G类事件全部实装 + D1概率修复

### D1 拜将大典概率门槛

**改动**：condition 新增 `Math.random() >= 0.30` 概率门槛（30%），避免条件满足即100%触发。

### E类：情报/军事（4个）

#### E1 探子回报（id:'scout_report'）

- **触发**：25%/旬，玩家部队周围4格有explored(非visible) hex，cooldown 6
- **核心机制**：部队临时视野+3（2→5），类似郭嘉技能的buff方式
- **数据**：`unit._scoutBonus = {radius:3, expiresAt:G.turn+2, precise:bool}`
- **选项**：
  - ① 花金验证：金-100，视野+3持续2旬
  - ② 信以为真：免费
  - ③ 派间谍深入：金-200，需INT>70武将，视野+3持续2旬 + 精确情报（INT=100）
- **引擎接入**：
  - `getUnitVisionRadius`：+2行读取 `_scoutBonus.radius`
  - `getScoutINT`：`_scoutBonus.precise` → maxInt=100
  - nextTurn：过期清理

#### E2 诱敌深入（id:'lure_ambush'）

- **触发**：20%/旬，halt/camp部队在forest/hill + 4格内有敌方部队，cooldown 8
- **选项**：
  - ① 依计设伏：部队→ambush + `_advisedAmbush=true`（伏击成功率+10%）
  - ② 不必
- **引擎接入**：伏击成功率计算处读取 `_advisedAmbush`，触发后清除

#### E3 粮道告急（id:'supply_crisis'）

- **触发**：部队 `_noSupplyTurns ≥ 1` 且 troops > 0，cooldown 6
- **选项**：
  - ① 咬牙坚持：`_extraRations += 2`（存粮缓冲多撑2旬）
  - ② 破釜沉舟：全势力部队士气+10
- **引擎接入**：`processSupplyStatus` 的 `_rations` 计算加上 `(unit._extraRations||0)`

#### E4 敌军断粮（id:'enemy_starving'）

- **触发**：20%/旬，己方部队在敌方领地 + 6格内有敌方部队断粮，cooldown 8
- **选项**：
  - ① 扼守卡位：camp + `_starvWatch`，3旬内敌军溃散获200exp
  - ② 趁虚进攻：调用 `aiInitiateBattle` 发起战斗
  - ③ 不必
- **引擎接入**：nextTurn 检查 `_starvWatch` 目标是否溃散

### F类：外交/天下大势（3个）

#### F1 使者来访（id:'envoy_visit'）

- **触发**：15%/旬，与某AI好感30~60 + 非战争状态，cooldown 12
- **叙事**：根据AI人格差异化话术（好战→共分天下，保守→匡扶汉室，均衡→划江而治）
- **选项**：
  - ① 厚礼结盟：金-300，好感+20
  - ② 接受不表态：好感+5
  - ③ 斩使立威：好感-60，立即开战，全军士气+5

#### F2 远交近攻（id:'distant_alliance'）

- **触发**：12%/旬，与A敌对 + B与A好感<20 + B与玩家好感>30，cooldown 18
- **选项**：
  - ① 遣使联络：金-200，B对A好感-30，B的AI威胁矩阵中A威胁值+50
  - ② 自行解决
- **引擎接入**：
  - `G._threatBonus`：`_aiCalcThreat` 末尾加上注入值
  - nextTurn：每旬递减10，归零后清除 + `_aiInvalidateThreatCache()`

#### F3 天下三分势定（id:'three_kingdoms_settled'）

- **触发**：一次性，三势力各≥10城 + 近12旬城市易手≤1次
- **依赖**：`G._cityChangeLog`（新增，三处城市易手点写入）
- **选项**：
  - ① 顺势休兵：全局好感向50回归30%，全城民心+5，全部队士气+5
  - ② 备战：己方全城popQuality+5

### G类：日常/氛围（3个）

#### G1 名士过境（id:'scholar_visit'）

- **触发**：5%/旬，随机己方城市，cooldown 8
- **"该城武将"**：太守 + 辖区2格内部队中所有武将
- **选项**：
  - ① 讲学：金-100，武将com/war/int/pol各+12.5exp，popQuality+3
  - ② 著书：金-200，popQuality+8
  - ③ 赠礼：金-50，信誉+3

#### G3 流民涌入（id:'refugee_influx'）

- **触发**：本旬有非叛军敌城易手 + 己方有城hex距离≤8，cooldown 6
- **选项**：
  - ① 接纳安置：pop+8%，gentry-3，民心-3
  - ② 拒之门外：民心+2，信誉-2
  - ③ 择壮编军：pop+3%，garrison+500(∧cap)，gentry-5，民心-5

#### G4 丰年大收（id:'harvest_bounty'）

- **触发**：秋季 + 15%/旬 + 某城存粮可撑>8旬，cooldown 8
- **base效果**（无论选什么）：`city._grainBonus += 0.15`（粮产永久+15%）
- **选项**：
  - ① 犒赏三军：存粮-15%，辖区2格部队士气+10
  - ② 安享丰收：纯拿base
  - ③ 开市惠民：存粮-10%，民心+5，gentry+5
- **引擎接入**：粮食产出公式 `*(1 + (city._grainBonus||0))`

### 新增数据结构

| 字段 | 作用 | 初始化/清理 |
|------|------|------------|
| `unit._scoutBonus` | E1 临时视野+3 | nextTurn过期delete |
| `unit._advisedAmbush` | E2 伏击成功率+10% | 伏击触发后delete |
| `unit._extraRations` | E3 存粮缓冲延长 | processSupplyStatus读取 |
| `unit._starvWatch` | E4 断粮监视目标 | nextTurn检查/过期delete |
| `G._threatBonus` | F2 威胁值注入 | nextTurn每旬递减10 |
| `G._cityChangeLog` | F3/G3 城市易手记录 | initGame初始化，nextTurn清理>24旬 |
| `city._grainBonus` | G4 永久粮产加成 | 累加，永不清除 |

### 引擎接入总览（15处）

| # | 位置 | 改动 |
|---|------|------|
| 1 | `getUnitVisionRadius` | +2行读 `_scoutBonus.radius` |
| 2 | `getScoutINT` | +6行 `_scoutBonus.precise` → INT=100 |
| 3 | `initGame` | +1行 `G._cityChangeLog=[]` |
| 4 | 粮食产出公式 | +1行 `*(1+(city._grainBonus\|\|0))` |
| 5 | `_triggerMajorRebellion` | +2行 cityChangeLog push |
| 6 | D1 condition | +1行 30%概率门槛 |
| 7 | `_aiCalcThreat` | +2行 `_threatBonus` 注入 |
| 8 | siege capture | +2行 cityChangeLog push |
| 9 | nextTurn | +1行 scoutBonus cleanup |
| 10 | nextTurn | +15行 starvWatch check |
| 11 | nextTurn | +10行 threatBonus decay |
| 12 | nextTurn | +1行 cityChangeLog cleanup |
| 13 | `processSupplyStatus` | +1行 `_extraRations` |
| 14 | ambush chance | +4行 `_advisedAmbush` +10% |
| 15 | battle capture | +2行 cityChangeLog push |

### EVENT_DEFS总表（24个）

| ID | 类别 | 优先级 | 冷却 | 概率 | 一次性 |
|----|------|--------|------|------|--------|
| drought | disaster | 1 | 12 | 8%(秋) | — |
| plague | disaster | 1 | 12 | 5%(夏) | — |
| flood | disaster | 1 | 12 | 6%(夏) | — |
| gen_restless | personnel | 2 | 24 | 15% | — |
| gen_conflict | personnel | 2 | 18 | 20% | — |
| gen_overpowered | personnel | 2 | 36 | 10% | — |
| gen_referral | personnel | 2 | 12 | 12% | — |
| gentry_offer | gentry | 2 | 18 | 12% | — |
| gentry_pressure | gentry | 1 | 24 | 8% | — |
| humble_complaint | gentry | 2 | 24 | 10% | — |
| gentry_unrest | gentry | 1 | 24 | 10% | — |
| general_ceremony | story | 2 | 9999 | 30% | ✅ |
| bronze_tower | story | 2 | 9999 | 100% | ✅ |
| chu_shi_biao | story | 1 | 9999 | 100% | ✅ |
| scout_report | intel | 2 | 6 | 25% | — |
| lure_ambush | intel | 2 | 8 | 20% | — |
| supply_crisis | intel | 1 | 6 | 100%★ | — |
| enemy_starving | intel | 2 | 8 | 20% | — |
| envoy_visit | diplomacy | 2 | 12 | 15% | — |
| distant_alliance | diplomacy | 2 | 18 | 12% | — |
| three_kingdoms_settled | diplomacy | 1 | 9999 | 100% | ✅ |
| scholar_visit | daily | 2 | 8 | 5% | — |
| refugee_influx | daily | 2 | 6 | 100%★ | — |
| harvest_bounty | daily | 2 | 8 | 15%(秋) | — |

（★ supply_crisis/refugee_influx 无概率门槛，靠条件本身低频控制触发率）

### 新增 category 值

| category | 事件 | 同类冷却 |
|----------|------|---------|
| intel | E1~E4 | 3旬 |
| diplomacy | F1~F3 | 3旬 |
| daily | G1/G3/G4 | 3旬 |

### v132 改动统计

| 改动类型 | 数量 |
|---------|------|
| EVENT_DEFS新增 | +10条（E4+F3+G3） |
| D1概率修复 | 1行 |
| 引擎接入 | 15处 |
| initGame新增 | +1行（_cityChangeLog） |
| 净增 | ~621行（25009→25630） |

### v132 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v132.html |
| 总行数 | ~25630行 |
| 事件系统 | 引擎框架 + A类3 + B类4 + C类4 + D类3 + E类4 + F类3 + G类3 = 24个EVENT_DEFS |
| 一次性事件 | D1/D3/D4/F3，G._eventFired追踪 |
| 承诺追踪 | 7种promise类型，合并提醒/日志 |
| 事件系统状态 | ✅ 全部7类24个事件实装完成 |

### 事件系统完工总结

事件系统从v130开始设计，v130实装引擎+A类+B类+C类（11个），v131实装D类（3个）+一次性引擎，v132实装E/F/G类（10个）。至此全部7类24个事件实装完成，覆盖天灾、人事、豪族、演义、情报、外交、日常七大维度。

### v132 Bugfix（自测发现）

| # | 问题 | 修复 |
|---|------|------|
| 1 | G3 流民涌入永远不触发：`e.turn===G.turn` 但 rollEventsV2 在 runAI/战斗之前执行，本旬还没有城市易手 | 改为 `e.turn>=G.turn-1`，检查上一旬末的易手记录 |
| 2 | F1 AI曹操总是斩使：diploAggro>0.7直接返回2（斩使），导致曹操对所有中立势力开战 | AI好战型改为：无敌人→不表态，有敌人+有钱→结盟拉拢第三方 |
| 3 | F3 好感回归双向不对称：直接遍历所有diplo key各自计算回归值，a→b和b→a结果不一致 | 改为遍历唯一势力对（3对），计算一次newRel同时赋给双向 |

### v132 playerOnly 事件AI触发限制

**设计决策**：事件系统本质是玩家正反馈体验层，AI触发只增加风险（promise无法履约、战斗冲突、外交连锁、白嫖数值）没有收益。

**引擎改动**：rollEventsV2 中 `facs.forEach` 内新增 `if(def.playerOnly && fid!==G.playerFac) return;`（1行）

**分类**：
- **A类天灾（3个）** — AI继续触发（天灾公平性 + 疫病扩散链）
- **其余21个（B/C/D/E/F/G类）** — 全部 `playerOnly:true`，AI不触发

**aiChoose保留**：不删除，用于玩家快进模式（_fastForward时玩家事件也走aiChoose静默处理）。

### v132 Bugfix 补充

| # | 问题 | 修复 |
|---|------|------|
| 4 | E3② 破釜沉舟：全势力部队士气+10，应为仅该断粮部队+10 | 改为 `ctx.unit.squads.forEach` 只加该部队 |

### v132 最终项目快照（含全部bugfix）

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v132.html |
| 总行数 | ~25637行 |
| 事件系统 | 引擎框架 + A类3 + B类4 + C类4 + D类3 + E类4 + F类3 + G类3 = 24个EVENT_DEFS |
| playerOnly | 21个事件仅玩家触发，3个A类天灾AI继续触发 |
| 一次性事件 | D1/D3/D4/F3，G._eventFired追踪 |
| 承诺追踪 | 7种promise类型，合并提醒/日志 |
| 事件系统状态 | ✅ 全部7类24个事件实装完成，4个bugfix已修复 |
---

## v133 游戏节奏调优 + 攻城bug修复

### 设计目标

解决游戏节奏过快的核心问题：外交变脸太快、补员太快、围城太容易，同时修复攻城方/守城方角色反转的严重bug。

### 围城/攻城系统 Clean Up（v133核心重构）

**设计原则**：点击敌方城市hex = 进攻敌方城市，无论城内有没有敌军。攻城只从围城系统触发，不从野战路径触发。

**玩家攻城入口（仅2个）**：

| 入口 | 触发方式 | 函数 |
|------|---------|------|
| 到达敌城 | 部队行军到敌城hex旁 → "兵临城下"弹窗 → 选"直接攻城" | `_siegeArrivalChoice('attack')` → `resolveSiegeBattle` |
| 围城后攻城 | 右侧面板"立即攻城"按钮 | `launchSiegeAttack` → `_showSiegeBattleConfirm` → `confirmSiegeBattle` → `resolveSiegeBattle` |

**玩家守城入口（仅1个）**：

| 入口 | 触发方式 | 函数 |
|------|---------|------|
| 被AI攻城 | AI通过 `initiateBattle` 攻打玩家城市 | `_showSiegeDefendConfirm` → `confirmSiegeDefend` |

**Clean Up 内容**：

1. **`handleMapClick`**：敌方城市hex上有敌军时，跳过 `enemyOnHex` 攻击路径，走城市移动路径（`issueUnitMove` → 行军 → 围城到达弹窗）
2. **`issueUnitMove` 即时攻击路径**：删除攻城判定分支，只保留野战+营寨战（攻城不从此入口触发）
3. **`_checkInstantBattleTrigger`**：同上，删除攻城判定分支
4. **`confirmSiegeDefend` 出城迎战**：改用 `_resolveBattleEngagement` 替代直接 `resolveBattle`，确保战报字段完整（修复undefined bug）

### Bugfix: 出城迎战undefined战报

**问题**：守城弹窗选"出城迎战"后，战报显示各种undefined（进攻方undefined、防守方undefined、胜方undefined）。

**根因**：`confirmSiegeDefend` 的 sortie 路径直接调用 `resolveBattle()` 获取原始战报，但 `resolveBattle` 返回对象不包含 `node`、`atkFac`、`defFac`、`atkNames`、`defNames` 等显示字段。正常野战通过 `_resolveBattleEngagement()` 包装补充这些字段。

**修复**：sortie 路径改为调用 `_resolveBattleEngagement(enemySide, playerSide, nodeLabel, null)`，走统一的野战结算路径，确保战报字段完整、败方撤退/追击/外交扣分等逻辑一致。

**Bug C — 出城迎战undefined战报**：
`confirmSiegeDefend` 的 sortie（出城迎战）路径直接调用 `resolveBattle()`，返回的报告缺少 `node`/`atkFac`/`defFac`/`atkNames`/`defNames` 等字段，战报弹窗全部显示 undefined。
**修复**：改为调用 `_resolveBattleEngagement(enemySide, playerSide, nodeLabel, null)`，走统一的野战结算路径，自动补全所有战报字段、处理撤退/追击/外交扣分/部队清理。

### 外交节奏调参（4处）

| 参数 | 旧值 | 新值 | 效果 |
|------|------|------|------|
| 曹操 diploAggro | 0.80 | **0.65** | 宣战概率倍率从×1.6降到×1.3 |
| 开局 wei-shu rel | 30 | **40** | 远离无宣称宣战线(30)，给缓冲 |
| 开局 wei-wu rel | 38 | **45** | 同上 |
| AI外交CD | 10旬 | **15旬** | 约半年级别，减少反复宣战 |
| neutral rel漂移 | 不漂移 | **向30回归±0.1/旬** | 和平有惯性，关系不会无缘无故恶化 |

**checkDiplo neutral漂移逻辑**：rel<30时+0.1，rel>30时-0.1，等于30时不动。

### 补员减速

| 参数 | 旧值 | 新值 |
|------|------|------|
| BASE（每旬基准补充人数） | 500 | **200** |

**效果估算（均衡策略，大城城内）**：
- 旧：front≈510 + rear≈800 = **~1310/旬**（4000满编3旬补满）
- 新：front≈204 + rear≈320 = **~524/旬**（4000满编约8旬补满）

战损压力显著提升，打完硬仗需要半年以上恢复，迫使玩家权衡进攻节奏。

### 围城重设计

#### 城防基准大幅提高

| 城市规模 | 旧baseDef | 新baseDef | 不围defMult |
|---------|----------|----------|-----------|
| small | 1.50 | **3.50** | **×4.50** |
| medium | 2.00 | **5.00** | **×6.00** |
| large | 2.50 | **7.00** | **×8.00** |

medium城不围直接打：守方DEF×6，3倍兵力也极难攻克。large城×8.0，不围纯送。

#### 围城曲线：线性→指数衰减（前重后轻）

**旧公式（线性）**：
```
decayPerTurn = (1/maxTurns) × ratioClamp
city.siegeDecay += decayPerTurn
```

**新公式（指数衰减）**：
```
k = 0.35 × ratioClamp × [技能修正]
remaining = (1 - oldDecay) × e^(-k)
city.siegeDecay = 1 - remaining
```

**medium城效果对比（兵力1:1，无技能）**：

| 围城旬数 | 旧decay | 新decay | 旧defMult(baseDef=2) | 新defMult(baseDef=5) |
|---------|---------|---------|---------------------|---------------------|
| 0 | 0% | 0% | ×3.00 | ×6.00 |
| 1 | 11% | 30% | ×2.78 | ×4.51 |
| 2 | 22% | 51% | ×2.56 | ×3.45 |
| 3 | 33% | 65% | ×2.34 | ×2.73 |
| 5 | 56% | 83% | ×1.88 | ×1.85 |
| 9(满) | 100% | 96% | ×1.00 | ×1.21 |

**设计意图**：
- 不围直接打 = ×6.0城防，基本不可能（逼攻方围城）
- 围1旬 = 大幅收益（×6→×4.5），短围也有意义
- 围3旬 = ×2.7，可以开始考虑攻城
- 围5旬 = ×1.85，大优势可攻
- 极端弱势才需围满

**技能修正方式不变**（从乘decayPerTurn改为乘k）：
- 满宠坚壁：k×0.70
- 曹真缓进：k×1.20
- 刘晔巧思：k×1.10
- 攻城器：k×1.30

### v133 改动统计

| 改动类型 | 数量 |
|---------|------|
| Bugfix（攻城角色反转+出城undefined） | 3处push + 3处判定 + 1处sortie路径 |
| 外交调参 | 5处（2常量+1人格+1漂移逻辑+3个CD） |
| 补员减速 | 1行 |
| 围城重设计（基准+曲线） | ~15行 |
| 净增 | +12行（25637→25649） |

### v133 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v133.html |
| 总行数 | ~25658行 |
| 外交 | 曹操diploAggro=0.65，开局rel缓冲提高，CD=15旬，neutral微漂移 |
| 补员 | BASE=200（旧500） |
| 围城 | baseDef: small=3.5/medium=5.0/large=7.0，指数衰减曲线k=0.35 |
| 攻城bug | ✅ 已修复（launchSiegeAttack缺playerIsAttacker） |

### 拜将大典可推迟（v133）

**改动**：`oneTime:true, cooldown:9999` → `oneTime:false, cooldown:18`（18旬=半年CD）
- 新增选项"暂缓册封"：不封将，半年后条件满足再次触发
- condition 中加 `G._eventFired?.general_ceremony` 检查：已封过则永不再触发
- `_applyCeremony` 中手动设 `G._eventFired.general_ceremony = G.turn`

**逻辑**：选册封→一次性生效永不再来。选暂缓→18旬CD后重新判定条件。

---

### v134 敌方伏兵隐身修复

**问题**：ambush状态的敌方部队在玩家视野内时会被正常渲染在地图上（带草丛图标），玩家能看到伏兵位置，但走过去仍触发伏击。逻辑不自洽——"看到了伏兵还被伏击"。

**根因**：`renderUnitsOnMap`（23581-23586行）只做迷雾过滤（hex是否FOG_VISIBLE），不检查部队是否为ambush状态。伏击触发逻辑（`checkAmbushTriggers` / `_execInstantMarch`伏击检测）也不检查"受害者是否事先看到了伏兵"。

**修复**（2处）：

1. **渲染层**（`renderUnitsOnMap`）：迷雾过滤之后加一行，ambush状态的非己方部队直接跳过渲染
   ```javascript
   if (u.status === 'ambush' && u.fac !== G.playerFac && !canSeeFactionData(G.playerFac, u.fac)) return;
   ```

2. **Tooltip层**（`showUnitTip`）：安全兜底，ambush敌军不显示tooltip

**效果**：敌方伏兵在地图上完全不可见，玩家行军经过时正常触发伏击判定。己方ambush部队不受影响，正常显示草丛图标。

### v134 攻城战审计结论

**审计范围**：AI攻玩家城市时，是否会误走遭遇战路径。

**结论**：所有路径已封死，不存在攻城→遭遇战的bug。

| 路径 | 走向 | 安全性 |
|------|------|--------|
| AI围城后攻城（`aiDoSiege`） | 直接调`resolveSiegeBattle`，不经过`aiInitiateBattle` | ✅ 100%安全 |
| AI到达城旁（`_aiTrySiege`） | dist<=1优先于鹰鸽判定，直接设siege状态 | ✅ 100%安全 |
| `aiInitiateBattle`内攻城判定 | v133fix `_isSiegeBattle`三重AND兜底，正确路由到攻城弹窗 | ✅ 兜底可靠 |
| 玩家行军到敌城hex | `_execInstantMarch`中敌城检测优先于敌军阻挡，直接siege | ✅ 100%安全 |
| 玩家移动后战斗检测 | `_checkInstantBattleTrigger`排除siege状态部队 | ✅ 100%安全 |

**边缘场景备注**：AI halt部队距目标城>1但侧面接触城内garrison时，会走`aiInitiateBattle`→`_isSiegeBattle`兜底判定→正确路由到攻城战。非bug，但鹰鸽判定层未像`_aiTrySiege`那样排除garrison敌军，属设计优雅度问题，暂不修。

### v134 战斗标签全面审计

**审计范围**：所有战斗弹窗标题（bcLocation）和战报标题（brTitle）是否正确匹配战斗类型。

**弹窗标题（bcLocation）— 6个设置点，全部正确**：

| 标签 | 触发条件 | 状态 |
|------|---------|------|
| 【X】伏击战 | `ambushBattle:true` | ✅ |
| 【X】营寨战 | `campBattle:true` | ✅ |
| 【X】攻城战 | `siegeBattle:true` + `playerIsAttacker:true` | ✅ |
| 【X】敌军攻城 | `siegeBattle:true` + `playerIsAttacker:false` | ✅ |
| 【X】出城迎击 | `siegeInterdict:true`（v134新增） | ✅ v134修复 |
| 【X】遭遇战 | 兜底（无特殊标记） | ✅ |

**战报标题（brTitle）— 5种类型，全部正确**：

| type字段 | 标题 | 状态 |
|---------|------|------|
| `'ambush'` | 🎯 伏击战 | ✅ |
| `'camp'` | 🏕 营寨战 | ✅ |
| `'siege'` | 🏰 攻城战 | ✅ |
| `'retreat'` | 撤退 | ✅ |
| 默认(`'battle'`) | ⚔ 野战 | ✅ |

**push来源审计（10个push点）**：全部标记字段与路由分支匹配，无遗漏。

**修复**：`siegeInterdict`（出城迎击）此前无专属标签，落入"遭遇战"兜底。v134新增判定分支，显示"出城迎击"。

### v134 水墨风Overlay重写

**改动范围**：6个overlay渲染函数全部重写色值方案。

| 函数 | 旧风格 | 新风格（v134） |
|------|--------|---------------|
| `_renderOvBase` | 深褐黑`#3d3528`不透明 | 宣纸暖灰`rgba(218,210,192,.93)`半透明 |
| `renderOverlayFaction` | 饱和RGB(蓝/绿/红) | 靛蓝墨/松烟墨/朱砂墨，alpha晕染(中心0.55→边缘0.18) |
| `renderOverlayGold` | 暗褐→亮金(电子风) | 淡灰棕→浓赭石，alpha渐变 |
| `renderOverlayFood` | 红/黄/绿交通灯 | 朱砂红/赭黄/松烟绿，半透明晕开 |
| `renderOverlayFoodFlow` | 暗褐→亮绿(饱和) | 淡墨→浓松烟绿，alpha渐变 |
| `renderOverlaySupply` | 亮绿/暗红(不透明) | 松烟绿/淡朱砂，alpha渐变 |

**设计原则**：用rgba半透明替代rgb不透明，让宣纸底图隐约透出；用中国画颜料色系（赭石、朱砂、松烟、靛蓝）替代饱和电子色；势力名大字改用ZCOOL XiaoWei字体+势力墨色。

### v134 改动统计

| 改动类型 | 数量 |
|---------|------|
| 伏兵隐身（渲染+tooltip） | 2处 |
| 出城迎击标签修正 | 1处 |
| 水墨风overlay重写（6个函数色值） | 7处注释标记 |
| 净增 | ~+15行（注释+alpha计算） |

### v134 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v134.html |
| 总行数 | ~25743行 |
| 伏兵可见性 | ✅ 敌方ambush部队地图隐身（v134） |
| 攻城路径审计 | ✅ 全路径封死，无遭遇战泄漏（v134审计确认） |
| 战斗标签审计 | ✅ 6种弹窗+5种战报标题全部正确匹配（v134审计） |
| Overlay美术风格 | ✅ 水墨晕染风（v134：宣纸底+淡墨alpha渐变+中国画色系） |

## v135 启动界面 + 存档系统

### 设计目标

为游戏添加完整的标题菜单→剧本选择→势力选择三级启动流程，以及5槽位手动存档系统。

### 启动流程重构

**旧流程**：`showFactionSelect()` → 选势力 → `initGame()`
**新流程**：`showTitleScreen()` → 主菜单 → 剧本选择 → 势力选择 → `initGame()`

**标题菜单（showTitleScreen）**：
- 三个按钮：開始新遊戲 / 讀取存檔 / 退出遊戲
- 异步检查存档可用性，无存档时"读取存档"按钮灰显
- 视觉风格：延续水墨宣纸风，ZCOOL XiaoWei大字标题

**剧本选择（showScenarioSelect）**：
- 当前仅1个剧本"群雄割据"（建安廿四年），预留扩展位
- 剧本卡片展示年代、势力数、城池数、武将数
- 返回按钮回主菜单

**势力选择（showFactionSelect）**：
- 改造：新增"返回剧本选择"按钮
- 功能不变：点击势力卡 → `startAs(fid)` → `initGame()`

### 存档系统

**存储方案**：兼容层 `_store` 对象，优先 `window.storage`（Artifact环境），不可用时自动降级 `localStorage`（普通浏览器，key前缀 `pr_`）

**序列化/反序列化**：
- `_serializeG()`：JSON.stringify + Set→`{__set:true, values:[...]}` 自定义序列化
- `_deserializeG()`：JSON.parse + reviver恢复Set + 恢复全局变量（`_unitIdCounter`、`_pendingPeaceOffer`、`_pendingVassalOffer`）
- `__meta` 字段保存version/savedAt/全局变量快照

**核心函数**：

| 函数 | 功能 |
|------|------|
| `_serializeG()` | G对象→JSON字符串，处理Set转换 |
| `_deserializeG(jsonStr)` | JSON字符串→恢复G对象+全局变量 |
| `_getSaveSlots()` | async，读取5个槽位摘要信息 |
| `saveToSlot(idx)` | async，保存到指定槽位 |
| `loadFromSlot(idx)` | async，从指定槽位读取 |
| `deleteSlot(idx)` | async，删除指定槽位 |
| `showSaveLoadPanel(mode)` | 弹出存档/读档面板（mode: save/load/load-title） |
| `closeSaveLoadPanel()` | 关闭面板（带淡出动画） |

**存档入口（3处）**：

| 入口 | 位置 | 功能 |
|------|------|------|
| Header存档按钮 | 游戏内顶栏 | 打开存档面板（save模式） |
| Header菜单按钮 | 游戏内顶栏 | 确认后返回主菜单 |
| 主菜单读取存档 | 标题画面 | 打开存档面板（load-title模式） |

**存档面板UI**：
- 5个槽位，显示势力名+年份旬数+城池数+存档时间
- 空槽位显示"— 空 —"
- 选中槽位后可保存（覆盖确认）/读取/删除
- ESC键关闭，点击遮罩关闭

### 其他改动

| 改动 | 说明 |
|------|------|
| 游戏结束"再战天下"按钮 | 改为调用`backToTitle()`返回主菜单 |
| 统计Tab"重置"按钮 | 改为"主菜单"，调用`backToTitle()` |
| ESC键处理 | 新增存档面板关闭优先级（最高） |
| 版本号 | header: v1.35, title: v1.3.5 |

### v135 改动统计

| 改动类型 | 数量 |
|---------|------|
| 新增CSS | ~65行（标题/剧本/存档面板样式） |
| 新增JS函数 | 15个（标题菜单+剧本选择+存档系统） |
| 改造函数 | 1个（showFactionSelect加返回按钮） |
| Header改动 | 2个按钮（存档+菜单） |
| 净增 | ~430行（25743→26171） |

### v135 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v135.html |
| 总行数 | ~26246行 |
| 启动界面 | ✅ 三级流程（主菜单→剧本选择→势力选择） |
| 存档系统 | ✅ 5槽位手动存档，window.storage持久化 |
| 序列化 | ✅ G对象完整序列化（含Set/全局变量） |
| 剧本系统 | 框架已建，当前1个剧本，预留扩展 |

### v135 三轮审计修复（R2+R3）

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| 1 | 严重 | 主菜单直接读档缺少buildHexTerrain，地图白屏 | `_onSlotLoad`中检测HEX_TERRAIN为空则调用buildHexTerrain()+ensureCityNeighbors() |
| 2 | 中等 | `_unitIdCounter`读档后可能与现有unit.id冲突 | `_deserializeG`末尾加maxId校正 |
| 3 | 中等 | `totalInf`除零导致NaN扩散（全员阵亡时） | 3处`inf.total`→`inf.total\|\|1` |
| 4 | 低 | 读档后overlay/地图缓存残留 | `_onSlotLoad`中清理`_staticMapCache`/`_ovTerritoryCache`/`_ovBaseCache` |


### v135 第四轮审计（R4：6大中高危区域）

**审计范围**：resolveBattle临时字段、武将归属一致性、部队引用悬空、围城状态一致性、外交连锁死循环、快进模式递归

| # | 区域 | 结论 |
|---|------|------|
| 1 | resolveBattle临时字段残留 | ✅ 安全：唯一return在末尾，cleanup不可能被跳过。`_defBonus`/`_xiaoyi_atk`/张辽威风/王朗经义全部有对称的delete/restore |
| 2 | 武将归属五处一致性 | ✅ 安全：`killGen`清理6处(generals/wildPool/prefect/strategist/squads/posts)，`surrenderGen`同理 |
| 3 | 部队引用悬空 | ✅ 安全：`_pendingBattleConfirms`同旬推入同旬消化；`cpRatio`有`Math.max(1,x)`除零保护 |
| 4 | 围城状态一致性 | **⚠️→✅ 已修复**：停战后siege部队未清理。新增`_clearSiegeOnPeace()`函数，3处停战路径(玩家求和/玩家停战/AI停战)全部注入调用 |
| 5 | 外交连锁死循环 | ✅ 安全：`_syncAllyWarStatus`只做neutral→enemy，ally方只扣关系不宣战，不递归 |
| 6 | 快进模式递归 | ✅ 安全：`autoResolvePendingBattle`不触发新事件/新战斗，有10秒安全阀+胜负中断 |

**新增函数**：`_clearSiegeOnPeace(fid1, fid2)` — 清理双方siege部队+重置无人围城的siegeDecay

### v135 R4审计：6大中高危区域

**审计范围**：resolveBattle临时字段、武将归属一致性、部队引用悬空、围城状态一致性、外交连锁、快进递归

| # | 区域 | 结论 |
|---|------|------|
| 1 | resolveBattle临时字段残留 | ✅ 安全。只有1个return点(末尾)，cleanup不可能被跳过。`_defBonus`/`_xiaoyi_atk`末尾统一delete，张辽威风/王朗经义有配对恢复。 |
| 2 | 武将归属五处一致性 | ✅ 安全。killGen清理6处(generals/wildPool/prefect/strategist/squads/posts)，surrenderGen同理+clearAllPostsByGen。 |
| 3 | 部队引用悬空 | ✅ 安全。`_pendingBattleConfirms`同旬推入同旬消化。`cpRatio`有`Math.max(1,x)`除零保护。 |
| 4 | 围城状态一致性 | ⚠️→✅ 已修复。发现停战后玩家siege部队未清理会永远卡住。新增`_clearSiegeOnPeace()`函数，注入4处：acceptPeaceOffer、diploArmistice、aiDoDiplo。同时清理无siege者的siegeDecay。 |
| 5 | 外交连锁死循环 | ✅ 安全。`_syncAllyWarStatus`只做neutral→enemy，ally方只扣关系不宣战，不递归调用自身。 |
| 6 | 快进模式递归风险 | ✅ 安全。`autoResolvePendingBattle`不触发新事件/战斗。有10秒安全阀+胜负中断。 |

**新增函数**：`_clearSiegeOnPeace(fid1, fid2)` @11025 — 停战时清理双方siege部队+城市siegeDecay

### v135 第四轮审计（R4：中高危区域深度审计）

**审计范围**：6大中高危区域全覆盖

| # | 区域 | 结论 |
|---|------|------|
| 1 | resolveBattle临时字段残留 | ✅ 安全。唯一return点在末尾，cleanup不可能被跳过。`_defBonus`/`_xiaoyi_atk`统一delete，张辽威风/王朗经义临时士气有恢复。 |
| 2 | 武将归属五处一致性 | ✅ 安全。`killGen`清理6处（generals/wildPool/prefect/strategist/squads/posts），`surrenderGen`同理。 |
| 3 | 部队引用悬空 | ✅ 安全。`_pendingBattleConfirms`同旬推入同旬消化，不跨旬悬空。`cpRatio`有`Math.max(1,x)`除零保护。 |
| 4 | 围城状态一致性 | ⚠️→✅ 发现并修复：停战后玩家siege部队未清理，会永远卡住。新增`_clearSiegeOnPeace()`，3处停战入口（acceptPeaceOffer/diploArmistice/aiDoDiplo）均已注入。 |
| 5 | 外交连锁死循环 | ✅ 安全。`_syncAllyWarStatus`只做neutral→enemy，不递归，ally方只扣关系不宣战。 |
| 6 | 快进模式递归风险 | ✅ 安全。`autoResolvePendingBattle`不触发新事件/战斗。10秒安全阀+胜负中断。 |

**新增函数**：`_clearSiegeOnPeace(fid1, fid2)` — 停战时解除双方siege部队+清理城市siegeDecay

## v136 经济平衡调参（粮草压力 + 征兵反噬）

### 设计背景

玩家测试反馈：前50旬经济压力不大，粮草压力完全无感，征兵对民心/人口质量的反噬也感受不到。模拟验证确认：

- 初始存粮过厚（20旬缓冲），粮食微亏但260旬才耗尽
- 腐损率太低（2%无粮仓），存粮几乎不会自然衰减
- 部队粮耗适中但大城盈余过大，自动调粮完全覆盖
- 征兵惩罚系数`×30`过小，从大城征兵质量/民心仅降1-2点
- 质量恢复速率0.10/旬，十几旬就回满，形同虚设

### 改动明细（6处参数调整）

| # | 位置/函数 | 旧值 | 新值 | 设计意图 |
|---|---------|------|------|---------|
| 1 | `initGame` 初始存粮 | `pop×0.0004×20` (20旬量) | `pop×0.0004×10` (**10旬量**) | 开局即有粮草紧迫感 |
| 2 | `processCityFood` 腐损率 | `[0.020, 0.012, 0.008, 0.003]` | **`[0.050, 0.030, 0.015, 0.005]`** | 无粮仓5%腐损，必须建粮仓 |
| 3 | `getUnitFoodRate` 行军/围城粮耗 | `0.010` | **`0.014`** | 远征消耗+40%，大军在外粮草压力显著 |
| 4 | 征兵质量惩罚（5处） | `(troops/pop) × 30` | **`× 100`** | 成都征1.5万→降3.8点（旧1.2点） |
| 5 | 征兵民心惩罚（5处） | `(troops/pop) × 30` | **`× 120`** | 比质量更重，因民心连锁→叛乱/城防停补 |
| 6 | `processPop` 质量恢复 | base `0.10` + 高民心 `0.04` | **base `0.05`** + 高民心 **`0.02`** | 恢复周期翻倍（~30旬），征兵代价持续更久 |
| 7 | 粮食breakdown显示 | `[0.020,0.012,0.008,0.003]` | **同步新腐损率** | UI一致性 |

### 连锁影响分析

**粮草系统新平衡（蜀国11城，7.5万野战兵）**：
- 初始储备：15120 → **7560**（减半）
- 部队粮耗：525/旬 → **840/旬**（+60%）
- 无粮仓腐损：150/旬 → **375/旬**（×2.5）
- 净赤字：-99/旬 → **-414/旬**（不含腐损），约**18旬**开始出现粮荒
- 粮仓成为必建建筑，否则存粮以5%/旬速度蒸发

**征兵反噬新体验**：
- 单次成都征1.5万：质量-3.8，民心-4.6（可承受但明显感知）
- 连续两次成都征3万：质量-7.7，民心-9.2，新兵降级（Lv5→Lv4），质量恢复需110旬
- 小城征5000：质量-5.6，民心-6.7，恢复需79旬（小城征兵代价沉重）
- 极端情况（连续从小城暴力征兵）：民心可跌破40→叛乱风险+城防停补+质量恢复停滞=恶性循环

**人口质量→产出链**：质量从75降到65 = effPop降13% = 全资源产出降13%

**民心→叛乱链**：
- 民心<40 → 小乱概率(40-morale)×0.8%/旬
- 民心<20 → 大乱概率(20-morale)×1.5%/旬
- 民心<40 → 城防军停止补员 → 叛乱更容易成功

### 修改位置索引

| 函数 | 行号(约) | 改动 |
|------|---------|------|
| `initGame` | 4607 | 初始存粮×10 |
| `processCityFood` | 4971 | 腐损率数组 |
| `getUnitFoodRate` | 16959 | 行军粮耗0.014 |
| `processPop` | 5096 | 质量恢复基础0.05/高民心+0.02 |
| AI `aiDoExpand` | 10055 | 质量×100/民心×120 |
| AI `aiDoRecruit` | 10170 | 质量×100/民心×120 |
| AI `aiDoAddSquad` | 10420 | 质量×100/民心×120 |
| Player `confirmRecruit` | 22854 | 质量×100/民心×120 |
| Player `confirmAddSquad` | 25113 | 质量×100/民心×120 |
| Breakdown显示 | 15764 | 腐损率同步 |

### v136 改动统计

| 改动类型 | 数量 |
|---------|------|
| 参数调整 | 7处（含1处UI同步） |
| 征兵惩罚修改 | 5个函数×2行=10行 |
| 净行数变化 | +1行（注释调整） |
| 新增函数 | 0 |

### v136 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v136.html |
| 总行数 | ~26577行 |
| 经济平衡 | ✅ v136调参：粮草压力显著（初始-50%/腐损×2.5/部队粮耗+40%），征兵反噬明显（质量×100/民心×120/恢复减半） |

### v136 补充修复：年代错误 + 天下休兵事件

**年代修正（5处）**：

开局年份应为建安十九年（214年），非建安廿四年（219年）。YEARS[0]='建安十九年'，G.year=0。

| # | 位置 | 旧值 | 新值 |
|---|------|------|------|
| 1 | 剧本选择界面（25556行） | 建安廿四年 · 公元219年 | **建安十九年 · 公元214年** |
| 2 | Header初始显示（479行） | 建安廿四年 · 第1旬 | **建安十九年 · 第1旬** |
| 3 | 开局日志（4835行） | 建安廿四年，刘备称汉中王 | **建安十九年，刘备入蜀** |
| 4 | 地图水印（13806行） | 三国志 · 建安廿四年 | **三国志 · 建安十九年** |
| 5 | 存档槽位年份（25433行） | 独立YEARS_L硬编码数组 | **复用全局YEARS数组**（消除冗余） |

**天下休兵事件修复（7635行）**：

问题：开局魏21/蜀11/吴13城全部≥10，且`_cityChangeLog`为空→第1旬即满足触发条件。

新增两个门槛：
- `G.turn < 72` → return false（至少2年后才触发）
- 三方两两外交关系≥-10（不在激烈交战中才算"休兵"）

### v136 Breakdown弹窗修正（P0+P1）

**P0 严重数值错误（2个弹窗）**：

| 弹窗 | 问题 | 修复 |
|------|------|------|
| 人口质量 | 基础0.10→实际0.05，民心bonus 0.04→实际0.02，学堂`[0.03,0.06,0.10]`→实际`[0.08,0.15,0.25]` | 全部同步v136/v124实际值，新增科技`popQualityRecovery`显示，新增新兵等级预览 |
| 补员速度 | BASE=500→实际200，front缺×0.68，rear系数0.4→实际2.0 | 全部同步v133/v116实际值 |

**P1 缺失显示（3个弹窗）**：

| 弹窗 | 新增项 |
|------|--------|
| 粮食产出 | 官职/朝议粮产buff、蒋琬·稳政技能(+5%)、丰年大收永久加成 |
| 金产 | 太守政治加成(pol/500)、官职/朝议金产buff、张昭·柱石技能(+3%)、太守派系产出修正(×0.85/×1.10) |
| 民心 | 科技moraleRecovery加成、王朗·经义技能(+0.15/旬)，两项均同步加入total计算 |

**P2 完善性补充（2个弹窗）**：

| 弹窗 | 新增项 |
|------|--------|
| 战力 | SKILL_REGISTRY战斗技能自动扫描显示（ATK/DEF/AP/士气/单挑/追击），SKILL_INLINE名将提示（关羽/张飞/诸葛亮/张辽/赵云/吕蒙/陆逊） |
| 势力金产 | buff汇总区：科技金产/明镜高悬/精简军制/官职朝议金产/官职维护费/张昭柱石/费祎折冲 |

### v136 补员面板显示修复（renderUnitDetail内联公式）

**问题**：部队详情面板（24240行）补员速度显示使用了一套完全过时的百分比制公式（`0.10 × billet(2.5) × popBonus`），与实际`processReinforcement`的固定基准制（BASE=200, front×0.68, rear×2.0）完全脱节。导致显示"25-27%/旬"，实际补员量约200-400兵/旬/队。

**修复**：替换内联公式为与`processReinforcement`和`showUnitBreakdown`一致的逻辑（BASE=200, front×0.68, rear×2.0, 粮食系数），显示改为"XXX兵/旬/队"绝对值。

### v136 新建Breakdown弹窗（第二步）

**新增2个弹窗函数**：

| 函数 | 触发位置 | 展示内容 |
|------|---------|---------|
| `showDiploBreakdown(e, otherFid)` | 外交Tab·友好度数字和状态文字（clickable） | 当前友好度/状态、每旬自动漂移规则（盟友+0.15/敌对-0.15/中立→30）、血仇值、状态转换阈值（结盟≥80/破裂<30/敌对≤10）、军力对比、信誉度 |
| `showPopBreakdown(e, cityId)` | 城池Tab·人口数字（clickable） | 当前人口/承载上限/容量%、人口质量/效用人口、每旬变化因素（自然增长logistic公式/饥荒/税/战乱/太平盛世科技）、净变化、满人口预估、人口影响（产出系数/集结速率/城防上限） |

**UI接入**：
- 外交Tab：友好度数字 + 状态文字均加`clickable-val` + `onclick`
- 城池Tab：人口数字加`clickable-val` + `onclick`（原只有质量可点击）

**新增函数行号**：~16411（showDiploBreakdown）、~16471（showPopBreakdown）

### v136 信誉弹窗 + 防御行可点击

**新增函数**：`showRepBreakdown(e, fid)` — 信誉/声誉breakdown弹窗
- 触发：外交Tab声誉数字和文字标签（clickable-val）
- 内容：当前声誉值/评级、每旬恢复（和平+0.2/战时+0.1）、曹操奸雄×2、钟繇楷范+0.15、净恢复/旬、满声誉预估、扣减来源一览（无宣称-12/毁盟-15/背弃附庸-20）、称帝门槛/AI态度影响

**防御行一致性修复**：部队面板防御行从不可点击改为clickable-val + `showUnitBreakdown(event,'combat',...)` — 与攻击行共用同一个战力breakdown弹窗

### v136 信誉弹窗 + 防御行可点击

| # | 改动 | 说明 |
|---|------|------|
| 1 | `showRepBreakdown(e, fid)` 新函数 | 展示当前信誉/等级、每旬恢复（战时+0.1/和平+0.2）、曹操·奸雄×2、钟繇·楷范+0.15、净恢复/满信誉预估、扣减事件参考（无名出兵-12/毁盟-15/计谋失败-3~8）、称帝门槛（华歆逼宫降至30） |
| 2 | 外交Tab信誉数字+等级文字 | 加`clickable-val` + `onclick` |
| 3 | 部队面板防御行 | 加`clickable-val` + `onclick="showUnitBreakdown(event,'combat',...)"` + ▸箭头，与攻击行一致 |

### v136 Bug修复：城内驻守部队不应扎营/埋伏

**问题**：`garrison`状态的部队在UI上仍显示扎营和埋伏按钮，点击后会直接改变status为camp/ambush——城里扎营、城里设伏，逻辑不自洽。

**修复（3处）**：
1. **UI层**（renderUnitDetail）：`unit.status !== 'garrison'` 时才渲染扎营/埋伏按钮
2. **setCamp**：新增 `status==='garrison'` 防御性检查，提示"城内驻守无需扎营"
3. **setAmbush**：同上，提示"城内驻守无法设伏"

---

### v136 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v136.html |
| 总行数 | ~26577行 |
| 总函数数 | 547个（v135的544 + showDiploBreakdown/showPopBreakdown/showRepBreakdown） |
| 经济平衡 | ✅ 粮草压力显著（初始-50%/腐损×2.5/部队粮耗+40%），征兵反噬明显（质量×100/民心×120/恢复减半） |
| 年代 | ✅ 修正为建安十九年（214年），5处统一 |
| 天下休兵事件 | ✅ 加72旬门槛+外交关系≥-10条件，不再开局触发 |
| Breakdown弹窗 | ✅ P0~P2全部修正（10个已有弹窗数值同步+buff/技能补全），新建3个弹窗（外交关系/城市人口/信誉），补员面板旧公式替换，防御行可点击 |
| 城内扎营/埋伏 | ✅ Bug修复：garrison状态隐藏按钮+函数防御检查 |

### v136 完整改动清单

| 类别 | 改动数 |
|------|--------|
| 经济参数调整 | 7处（初始存粮/腐损率/部队粮耗/征兵质量×100/民心×120/恢复减速/UI同步） |
| 征兵惩罚修改 | 5个函数×2行 = 10行 |
| 年代修正 | 5处文本 + 1处数组重构 |
| 事件修复 | 1处（天下休兵条件加强） |
| Breakdown弹窗修正 | P0: 2个弹窗（质量/补员数值过时）, P1: 3个弹窗（粮/金/民心缺buff）, P2: 2个弹窗（战力技能/势力金buff汇总） |
| 新建Breakdown弹窗 | 3个（showDiploBreakdown/showPopBreakdown/showRepBreakdown） |
| UI接入 | 5处新onclick（外交rel/状态、人口、信誉数字/等级、防御行） |
| 补员面板公式替换 | 1处（renderUnitDetail内联公式） |
| Bug修复 | 1个（garrison状态扎营/埋伏，3处修复） |
| 净增行数 | +331行（26246→26577） |

---

## v137 扎营视野修复 + 新手引导准备

### 扎营视野修复

**问题**：`getUnitVisionRadius()` 将 camp 和 ambush 状态统一返回 `FOG_STEALTH_RADIUS(1)`，导致扎营部队视野从正常的 3+INT bonus 骤降到 1 格。扎营是防御姿态，不应降低视野；只有伏击（ambush）需要隐蔽。

**修复**（1处）：

| 位置 | 修复前 | 修复后 |
|------|--------|--------|
| `getUnitVisionRadius` (~行1450) | `if (unit.status === 'camp' \|\| unit.status === 'ambush') return FOG_STEALTH_RADIUS;` | `if (unit.status === 'ambush') return FOG_STEALTH_RADIUS;` — camp 状态走正常视野计算 |

**影响范围**：仅影响迷雾计算，不影响战斗/AI/补给等其他系统。扎营部队现在保持与行军部队相同的视野半径（3 + INT bonus + 科技 + 技能）。

### ⚠️ 开发规范补充：新手引导维护

**规则**：今后每次更新游戏机制（新增系统、修改操作入口、调整核心玩法逻辑），需同步检查新手引导（tutorial overlay）内容是否需要更新。引导内容必须与实际游戏机制保持一致。

### v137 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v136.html（本轮修复+新增引导系统） |
| 总行数 | ~26818行（+239行） |
| 扎营视野 | ✅ 修复：camp 状态不再降低视野，仅 ambush 隐蔽 |
| 新手引导 | ✅ 实装：8页分层式 Tutorial Overlay + 实时高亮联动 |

### 新手引导系统（Tutorial Overlay）

**触发**：`startAs()` → `initGame()` 后，若 `G.tutorialDone === false` 则自动弹出。读档不触发。

**开关**：
- 引导卡片右上角 ✕ 跳过按钮
- Header 区域 ❓ 按钮随时重新打开
- `G.tutorialDone` 存档序列化（`_serializeG` / `_deserializeG` 中）

**UI架构**：
- `position:fixed` overlay（z-index:900），半透明暗底 `.tut-dim`
- 居中/偏移卡片 `.tut-card`（z-index:902），根据高亮目标自适应位置
- 被高亮元素临时加 `.tut-highlight` class（z-index:901，金色 box-shadow + pulse）
- 翻页时自动切换 tab（`switchTab`）并转移高亮

**内容结构（8页）**：

| 页 | 标题 | 高亮目标 | 卡片位置 | 展开块数 |
|---|------|---------|---------|---------|
| 0 | 汉末乱世，群雄逐鹿 | 无 | 居中 | 0 |
| 1 | 大地图 | `.map-wrap` | 左侧 | 1（迷雾与情报） |
| 2 | 城池与内政 | `.rp` + 城池tab | 左侧 | 4（人口民心质量/粮食资源/豪族/建筑） |
| 3 | 武将与人才 | `.rp` + 武将tab | 左侧 | 3（技能/忠诚/派系朝议） |
| 4 | 军事与战争 | `.rp` + 军事tab | 左侧 | 4（编制兵种/战斗类型/补给/休整） |
| 5 | 外交与计谋 | `.rp` + 外交tab | 左侧 | 2（关系信誉/计谋） |
| 6 | 全局政策与回合 | `#leftPanel` + `#btnTurn` | 右侧 | 1（官职科技） |
| 7 | 天下大势，分久必合 | 无 | 居中 | 0（结语+开始按钮） |

**新增代码**：

| 类别 | 内容 |
|------|------|
| CSS | `.tut-overlay` / `.tut-dim` / `.tut-highlight` / `.tut-card` / `.tut-detail` / `.tut-nav` 等（~45行） |
| HTML | Header ❓ 按钮（1行） |
| JS 数据 | `TUT_PAGES` 常量（~90行，8页内容+15个展开块） |
| JS 函数 | `showTutorial()` / `closeTutorial()` / `_clearTutHighlight()` / `_applyTutHighlight()` / `_renderTutPage()` / `_positionTutCard()`（~115行） |
| 序列化 | `_serializeG` / `_deserializeG` 各1行（`tutorialDone`） |
| 触发钩子 | `startAs()` 末尾1行 |

### v137 后续迭代修复

**1. 高亮遮挡修复**：初版用 `z-index:901` 提升被高亮元素，导致 map-wrap 盖住整个 overlay。改为 `outline` + `box-shadow` 方案，不操控 z-index。

**2. 渐进式区域揭示**：去掉全屏半透明暗底（`.tut-dim` 改为透明），改为对三大区域分别施加 `.tut-section-dim`（`filter:brightness(0.45) saturate(0.3)`）。每页通过 `reveal` 数组控制哪些区域解除暗化：

| 页 | 揭示区域 |
|---|---------|
| 0 总纲 | 无（全部暗化） |
| 1 大地图 | .map-wrap |
| 2-6 右侧各Tab | .map-wrap + .rp |
| 7 政策与旬令 | 全部（+#leftPanel +header） |
| 8 结语 | 全部 |

新增 `_TUT_SECTIONS` 常量和 `closeTutorial()` 中的全量清理逻辑。

**3. 内容调整**：
- 统帅描述：「决定带兵上限」→「决定带兵作战的战斗力」
- 页面标题：「全局政策与回合」→「政策与旬令」
- 官职与科技从展开块独立为第6页（9页总计）
- 删除东吴水战科技的错误引用

**4. 科技树配色重设计**（`renderTechTab`）：

| 状态 | 左色条 | 背景 | 标题色 | 状态标签色 |
|------|--------|------|--------|-----------|
| 已研发 | 深绿 #1a7a3a | 极浅绿 .04 | 绿色 | 浅绿 |
| 研究中 | 蓝色 #64b4ff | 浅蓝 .08 | 深蓝 | 亮蓝 |
| **可研究** | **金色 #8a7040** | **暖金 .08** | **深墨 .9** | **金色** |
| 资源不足 | 极浅灰 | 近无 .03 | 半透明 .55 | 红色 |
| 未解锁 | 近不可见 | 近无 .02 | 浅灰 .4 | 浅灰 .25 |

改动要点：新增 `leftBar`（border-left 3px）区分度最高；`statusCol`/`descCol` 独立控制（去掉 opacity hack）；可研究节点加 hover 反馈。

### v137 最终项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v136.html |
| 总行数 | ~26844行 |
| 总函数数 | 553个（547 + 6个tutorial函数） |
| 新手引导 | ✅ 9页分层式 Tutorial Overlay，15个展开块，渐进区域揭示，❓按钮随时重开 |
| 扎营视野 | ✅ camp不再降低视野，仅ambush隐蔽 |
| 科技树UI | ✅ 五状态配色重设计，左色条+独立色值，可读性大幅提升 |

---

## v137b 增编分队弹窗适性显示

### 改动

`renderAddSquadModal()` 内武将选择卡片新增全兵种适性行。

**改动位置**：`renderAddSquadModal`（~行25327-25342）

**显示格式**：每个候选武将卡片名字+属性行下方追加一行 `骑A · 轻S · 重B · 弓A · 攻C · 水B`，8px字号，按等级着色（S金褐/A绿/B蓝灰/C灰/D浅灰）。已选兵种对应适性加粗+下划线高亮。

**数据来源**：`GEN_MAP[g.name].apt`，遍历 `['cavalry','light','heavy','archer','siege','naval']`。

**改动范围**：纯UI，不动数据层/逻辑层。新增辅助变量 `_asAptLbl`/`_asAptCol`/`_asSelBase`。

---

## v138 水战系统 + 火攻费用调整

### 一、设计概述

水战是第五种战斗场景（野战/攻城/伏击/劫营/水战）。核心架构：**wrapper隔离**——`resolveNavalBattle`在战前临时替换squad数据，调用原`resolveBattle`，战后还原。`resolveBattle`本身零改动。

触发规则：被攻击方所在hex为水域（`water`/`river`）→ 水战。攻击方位置无关。

### 二、数据层

#### naval适性（107个武将）

每个武将apt对象新增`naval`键。分布：S×4, A×13, B×12, C×72, D×6。

| 等级 | 代表武将 |
|------|---------|
| S | 周瑜、陆逊、甘宁、吕蒙 |
| A | 黄盖、程普、韩当、蒋钦、周泰、丁奉、凌统、徐盛、潘璋、贺齐、朱然、关羽、陆抗 |
| B | 太史慈、全琮、吕范、鲁肃、步骘、孙权、孙策、诸葛亮、庞统、关平、关兴、文聘 |
| D | 马超、夏侯渊、曹彰、马岱、庞德、邓艾 |
| C | 其余所有（默认） |

APT_MULT：S=1.20, A=1.10, B=1.00, C=0.88, D=0.75。

#### 火攻费用调整

| 资源 | v137 | v138 |
|------|------|------|
| 金 | 800 | **300** |
| 粮 | 500 | **删除** |
| 木 | 300 | **200** |

`FIRE_TERRAIN_MULT`新增`water:1.3`。

#### 水域常量

| 常量 | 值 | 说明 |
|------|---|------|
| `NAVAL_AP` | 4 | 水上部队每旬AP |
| `NAVAL_WATER_COST` | 2 | 水域hex间移动cost |
| `WATER_TERRAINS` | Set(['water','river']) | 可通行水域地形集 |

`TERRAIN_AP_COST`中`water`和`river`从6/4改为统一的2。入水/上岸的"慢"靠AP清零实现，不靠高cost。

### 三、移动层

#### 新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `isWaterHex(col, row)` | ~2455 | hex是否为可通行水域 |
| `isUnitOnWater(unit)` | ~2460 | 部队当前是否在水上 |

#### 改动函数

| 函数 | 改动 |
|------|------|
| `getHexMoveCost` | 新增第4参数`isOnWater`，水→水返回`NAVAL_WATER_COST`；攻城器械水域豁免加倍惩罚 |
| `calcUnitAP` | 水上部队直接返回`NAVAL_AP=4`，跳过所有陆战AP技能 |
| `hexAstar` | 每步检测当前hex水陆状态，传入`getHexMoveCost` |
| `processUnitMovement` | 传入`isOnWater`；水陆转换后AP清零+halt；邓艾AP减免水域中不生效 |
| `_execInstantMarch` | 同上：传入`isOnWater`；水陆转换后AP清零+interrupted |
| `issueUnitMove` | AP分割计算考虑水陆转换（transition后apSim=0） |
| `_renderMoveRange` | BFS传入`onWater`状态；水陆转换hex不继续扩展 |

#### 入水/上岸节奏

| 旬 | 动作 | 说明 |
|---|------|------|
| 1 | 陆→水hex（cost=2，AP清零） | 入水 |
| 2 | 水上AP=4，走2格水域 | 航行 |
| 3 | 水→陆hex（cost=1，AP清零） | 上岸 |

#### 水中状态限制

`setCamp`/`setAmbush`入口检查`isUnitOnWater`，水域中直接拒绝。围城：`processUnitMovement`中水上部队不触发siege。

### 四、战斗层

#### resolveNavalBattle（~行19630）

**wrapper流程**：
1. **保存**：遍历双方所有squad，保存`origType`/`origXiaoyi`
2. **替换**：`sq.type='light'`（统一ATK/DEF基数）、`sq._navalApt=true`（`_squadBase`读naval适性）、`u._isNavalBattle=true`（技能过滤标记）
3. **火攻**：如果`useFireAttack`，扣资源→`calcFireRate`→`applyFireEffect`（terrain='water'，倍率1.3）
4. **调用`resolveBattle(attackers, defenders, 'water')`**
5. **还原**：恢复所有`sq.type`/`sq._xiaoyi_atk`，删除`_navalApt`/`_isNavalBattle`
6. **附加**：`result.isNaval=true`、`result.fireResult`

#### 技能过滤

`NAVAL_BLOCKED_SKILLS`（Set, 15个ID）：

```
jinma, jianshou, hubu_def, hubu_ap, changqu, xianshou, xijing,
huangxu_atk, huangxu_def, jiameng_atk, jiameng_def, 
guozhan_atk, guozhan_def, zhanyan, qianlijv
```

`applySkills`检测`ctx.unit._isNavalBattle`时跳过以上技能。

`_squadBase`检测`sq._navalApt`时读`apt.naval`而非`apt[baseType]`。

#### 战斗触发路由

`_resolveBattleEngagement`：检测`defUnit`在水域→`resolveNavalBattle`替代`resolveBattle`。新增第5参数`navalFire`传入火攻标记。

`_showNextBattleConfirm`：自动检测`enemySide`在水域→设`_isNaval`标记→UI显示`⚓水战`标题+火攻勾选框。

`confirmBattle`：读取`bcNavalFireCheck`勾选状态→传入`_resolveBattleEngagement`。

叫阵（主动单挑）：水战中禁用（UI不渲染叫阵区域，AI跳过叫阵判定）。被动单挑保留。

AI vs AI水战路由：`aiInitiateBattle`中AI duel判定跳过水战场景，战斗结算经`_resolveBattleEngagement`自动走naval路径。

战报：`showNextBattleReport`标题水战显示`⚓ 水战`。

### 五、撤退层

`doRetreat`改动：

- **水上撤退**：每步优先选水域hex邻居（远离敌方）；水域邻居全被堵→允许上岸但立即break（不会继续在陆地跑多格）
- **陆上撤退**：排除水域hex（不会意外跑进水里）
- **胜方前进**：允许岸上攻击方前进到败方原水域hex（移除旧的"陆上部队不进水"限制）

### 六、UI

- 战斗确认弹窗：水战显示`⚓【xxx】水战`+火攻勾选框（金300 木200 成功率XX%）
- 战报标题：`⚓ 水战 · xxx`
- 增编分队弹窗：适性显示含"水"列
- 新手引导Page 4：战斗类型列表新增水战条目

### 七、未做（留待后续）

- AI主动利用水路进攻（当前AI照常寻路，水域会被视为可通行但有cost，不会主动策划水战）
- 大船/舰船耐久系统
- 水域专属视觉（船只图标）
- ~~D级适性~~ ✅ 已修复（D=0.75）

### v138 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v138.html |
| 总行数 | ~27057行（v136基础+209行） |
| 新增函数 | 3个（isWaterHex, isUnitOnWater, resolveNavalBattle） |
| 新增常量 | 4个（NAVAL_AP, NAVAL_WATER_COST, WATER_TERRAINS, NAVAL_BLOCKED_SKILLS） |
| 武将数据 | 107个武将全部新增naval适性（S4/A13/B12/C72/D6） |
| 水战系统 | ✅ wrapper隔离架构，resolveBattle零侵入 |
| 火攻费用 | 金300+木200（删粮），水域倍率1.3 |
| 新手引导 | ✅ 水战内容整合至Page 4战斗类型 |

---

## v139 本轮新增内容

### G5 马贩来访事件（horse_trader）

**设计意图**：三势力产马资源极不均衡（魏6座产马城，蜀1座，吴0座），东吴/蜀汉骑兵组建困难符合史实，但需给一条"花钱补马"的出路，避免完全无解。

**实装详情**：
| 项目 | 值 |
|------|---|
| ID | `horse_trader` |
| 分类 | `daily`（日常类） |
| 适用 | 玩家+AI（`playerOnly:false`） |
| 冷却 | 12旬 |
| 触发条件 | 势力马匹存量 < 200，非叛军，每旬15%概率 |
| 叙事 | 按势力差异化文本（吴/蜀/通用三套） |
| 选项① | 大量购入：金-800，马+150 |
| 选项② | 少量购入：金-400，马+70 |
| 选项③ | 打发走：无效果 |
| AI决策 | 金≥1500且马<300→①；金≥800→②；否则③ |
| 代码位置 | EVENT_DEFS内，G4丰年大收之后（~行7922） |

**产马经济背景**：
- 马匹产出公式：`base.horses × popMult × horseM × horseBldMod`
- 产马城`horseM=3.0`，非产马城`1.0`；马厩加成`1+stableLv×(产马?0.4:0.2)`
- 骑兵消耗：每5000兵需200马（一个满编7000 squad约280马）
- 东吴全城每旬合计约产10~15马，需积攒~20旬才够一支骑兵squad
- 马贩事件可偶尔补充，但不颠覆魏的马匹霸权

### G6 猛将争锋事件（warrior_rivalry）

**设计意图**：区别于现有B2「将相不和」（亲密度<-30的负面矛盾），本事件面向中性关系的高武力武将，模拟关羽黄忠式"不服→切磋→惺惺相惜"的经典桥段。最优选项给纯bonus，鼓励玩家促成猛将友谊。

**与将相不和的区别**：
| 维度 | 将相不和(B2) | 猛将争锋(G6) |
|------|-------------|-------------|
| 前提 | 亲密度 < -30（已经互相厌恶） | 亲密度 -19~49（中性，不讨厌也不亲近） |
| 条件 | 同一部队 + 至少一人有官职 | 同势力 war≥90 非君主，不限状态 |
| 性质 | 灭火（负面事件） | 促成（正面机会） |
| 最优解 | 设宴调和（花金，效果有限） | 安排比试（纯bonus，亲密+25+武经验） |

**实装详情**：
| 项目 | 值 |
|------|---|
| ID | `warrior_rivalry` |
| 分类 | `personnel`（人事类） |
| 适用 | 仅玩家（`playerOnly:true`） |
| 冷却 | 24旬 |
| 触发条件 | 同势力≥2名 war≥90 非君主武将，亲密度在-19~49之间，每旬10%概率 |
| 叙事 | 根据双方war差值差异化（差距≥8：一强一弱互不服；接近：旗鼓相当） |
| 选项① | 安排比试：亲密度+25，双方war经验+30（纯bonus） |
| 选项② | 训话压下：亲密度+5，双方忠诚各-3 |
| 选项③ | 放任不管：亲密度-15 |
| AI决策 | 始终选①（安排比试） |
| 代码位置 | EVENT_DEFS内，G5马贩子之后（~行7971） |
| 依赖函数 | `getIntimacy`, `addIntimacy`, `addStatExp` |

### v139 变更摘要

| 项目 | 变更 |
|------|------|
| 事件总数 | 24 → 26（+G5马贩来访 +G6猛将争锋） |
| 净增行数 | +106行（27057→27163） |
| 影响模块 | M08事件系统（EVENT_DEFS新增2个定义） |
| 无侵入 | 未修改任何现有函数，纯新增事件定义 |

---

## v140 本轮新增内容

### G7 降将试心事件（defector_test）

**设计意图**：降将（`genJoinSource==='capture'`）归降后需要机会证明忠心，区别于B1请命出战（闲置鹰派/野心武将的不满），降将试心的文字基调是"恳切表忠"而非"不平求战"。

**与B1请命出战的区别**：
| 维度 | B1 请命出战 | G7 降将试心 |
|------|-----------|-----------|
| 对象 | 闲置的鹰派/野心武将，忠诚<65 | 降将（capture来源），在役≤120旬 |
| 基调 | 不平之色，暗含威胁 | 恳切表忠，求证明机会 |
| 选项① | 忠诚+8，promise -15 | 忠诚+15，promise -12 |
| 选项② | 委以重任（官职） | 委以文职（pol经验+30） |

**实装详情**：
| 项目 | 值 |
|------|---|
| ID | `defector_test` |
| 触发 | genJoinSource==='capture'，加入6~120旬，未在部队，10%/旬 |
| 冷却 | 18旬 |
| Promise | `G7_deploy`：3旬内编入部队，逾期忠诚-12 |
| 侵入 | `checkEventPromises` +2行（G7_deploy判定）、`PROMISE_DESC` +1行 |

### G8 檄文声讨事件（propaganda_war）

**设计意图**：模拟三国时期的舆论战/文伐（陈琳檄文、诸葛亮出师表），文官执笔声讨敌方。核心是概率博弈——高int/pol文官成功率高，成败影响信誉和鹰派派系modifier。

**实装详情**：
| 项目 | 值 |
|------|---|
| ID | `propaganda_war` |
| 触发 | 势力内有int≥85或pol≥85的文官型武将，且与某势力处于战争状态，12%/旬 |
| 冷却 | 18旬 |
| 成功率 | `(int+pol)/2` 映射到 50%~85% |
| 成功效果 | 己方全部队士气+5、信誉+3、鹰派武将genFactionMod+2 |
| 失败效果 | 信誉-2、鹰派武将genFactionMod-2、文官忠诚-3 |
| 选项② | 拒绝：文官忠诚-3 |
| 鹰派mod | 直接遍历G.generals按GEN_TAGS.combat==='hawk'修改genFactionMod，含genFactionModLog记录 |
| 侵入 | 零（纯EVENT_DEFS新增 + 现有genFactionMod/genFactionModLog数据结构） |

### v140 变更摘要

| 项目 | 变更 |
|------|------|
| 事件总数 | 26 → 28（+G7降将试心 +G8檄文声讨） |
| 净增行数 | +168行（27163→27331） |
| 影响模块 | M08事件系统（EVENT_DEFS+2定义，checkEventPromises+5行） |
| Promise类型 | 新增 `G7_deploy`（降将编入部队）+ `G7_office`（降将任命官职），均deadline 3旬 |
| 侵入点 | checkEventPromises里G7_deploy+G7_office判定+PROMISE_DESC描述（共5行改动） |

### 补给系统参数调整（节奏减速）

**设计意图**：地图尺寸有限（45城平均间距5.8hex），前线城市间骑兵2-3旬即达。原参数下补给线几乎能覆盖到敌城门口，玩家可以不考虑后勤连续推进。收紧补给参数，逼出"攻城→巩固→再推"的节奏。

| 参数 | 旧值 | 新值 | 效果 |
|------|------|------|------|
| `SUPPLY_MAX_RANGE` | 13 | 11 | 补给半径缩短，己方领地仍充足，敌境覆盖减少 |
| `SUPPLY_ENEMY_PENALTY` | 2 | 3 | 敌方平原cost=1+3=4，11÷4≈2.7格后断补给 |
| `SUPPLY_RATIONS` | 3 | 3（不改） | 断粮缓冲3旬，给正常攻城留够时间窗口 |
| `SUPPLY_CITY_RESTORE_TURNS` | 2 | 3 | 新占城市3旬后才提供补给，限制连续推进 |

**典型攻城节奏**：出发(0)→行军到敌城(2-3旬)→断补给→存粮撑3旬围城攻城→攻下→等3旬恢复补给→才能安全推下一城。贪心不巩固就推≈断粮惩罚。

---

## v141 本轮新增内容

### 性格标签系统（temperament）

**设计意图**：现有标签体系（politics/combat/origin/region + values）偏"政治立场/出身"维度，缺少个人性格特质。新增 `temperament` 维度，为107名武将各赋予一个性格标签，并产生实际gameplay联动。

**6个标签及分布：**
| 标签 | 含义 | 人数 | 代表人物 |
|------|------|------|---------|
| `proud`（傲）| 恃才傲物 | 13 | 关羽、马超、周瑜、魏延、庞统 |
| `reckless`（莽）| 冲动好斗 | 14 | 张飞、许褚、典韦、甘宁 |
| `steady`（沉稳）| 处变不惊 | 22 | 赵云、张辽、诸葛亮、黄忠 |
| `cunning`（狡黠）| 善于审时度势 | 21 | 曹操、司马懿、贾诩、郭嘉 |
| `steadfast`（刚毅）| 不屈不挠 | 29 | 刘备、夏侯惇、荀彧、曹仁 |
| `generous`（仁厚）| 宽仁爱民 | 8 | 刘备、鲁肃、诸葛瑾 |

**12个效果联动（全部为现有函数内加1-3行条件分支，零新函数）：**

| 标签 | 正面效果 | 负面效果 |
|------|---------|---------|
| proud | 单挑胜利时己方士气额外+5 | 无官职时忠诚-0.15/旬 |
| reckless | 被动单挑触发率+10% | 被伏击中伏率+5%，被劫营成功率+5% |
| steady | 被伏击/劫营时士气惩罚-5 | — |
| cunning | 被伏击中伏率-5%，被劫营成功率-5% | 被挖角成功率+5% |
| steadfast | 主将防守时DEF+2% | 劝降成功率-5% |
| generous | 太守时民心+0.5/旬，质量恢复+0.02/旬 | — |

**接入点明细：**
| 函数 | 改动 | 标签 |
|------|------|------|
| `applyDuelMorale` | +4行 | proud |
| `calcLoyaltyDelta` | +4行 | proud |
| `tryPassiveDuel` | +2行 | reckless |
| `resolveAmbush` | +5行 | reckless/cunning/steady |
| `calcRaidChance` | +3行 | reckless/cunning |
| `resolveCampBattle` | +3行 | steady |
| `applySkills` | +4行 | steadfast |
| `calcSurrenderRate` | +2行 | steadfast |
| `_aiDoPoach` | +2行 | cunning |
| `processMorale` | +2行 | generous |
| `processPop` | +2行 | generous |

**数据改动：**
- GEN_TAGS注释从"四维"更新为"五维"
- 107个GEN_TAGS条目全部新增 `temperament` 字段

### v141 变更摘要

| 项目 | 变更 |
|------|------|
| 净增行数 | +70行（27331→27401） |
| 标签系统 | GEN_TAGS新增第5维度 `temperament`，6种标签107人全覆盖 |
| 效果联动 | 12个gameplay hook，分布在11个现有函数内 |
| 侵入性 | 零新函数，每个hook 2-5行条件分支 |

---

## v142 本轮新增内容

### G9 莽夫闯祸事件（reckless_trouble）

**设计意图**：v141新增temperament性格标签体系后，仅有proud通过warrior_rivalry（猛将争锋）有专属事件，其余5个标签只有被动数值hook。reckless（莽）是最具戏剧性的性格标签，14名武将（张飞、许褚、典韦、甘宁等），其"冲动好斗"特质应产生可感知的负面后果，与proud的正面机会（比试）形成一正一负的对比。

**与现有事件的区别**：
| 维度 | B1 请命出战(gen_restless) | G6 猛将争锋(warrior_rivalry) | G9 莽夫闯祸(reckless_trouble) |
|------|-----------|-----------|----|
| 标签依赖 | combat:'hawk' / values含野心 | temperament:'proud'(至少一人) | temperament:'reckless' |
| 前提 | 闲置+忠诚<65 | 同势力war≥90双人+中性亲密度 | 太守 或 garrison驻城 |
| 性质 | 武将不满（灭火） | 切磋惺惺相惜（正面机会） | 酒后伤人（负面处理） |
| 选择核心 | 安抚 vs 承诺 | 比试/训话/放任 | 严惩(金换民心) vs 包庇(忠诚换民心+豪族) |

**实装详情**：
| 项目 | 值 |
|------|---|
| ID | `reckless_trouble` |
| 分类 | `personnel`（人事类） |
| 适用 | 仅玩家（`playerOnly:true`） |
| 冷却 | 18旬 |
| 图标 | 🍺 |
| 触发条件 | reckless武将 + (该武将是某城太守 OR garrison状态驻扎某城) + 非君主 + 每旬10%概率 |
| 叙事 | 莽将在城中酒后伤人，士绅联名告状 |
| 选项① | 严惩赔偿：金-200，该城民心+3，武将忠诚-5 |
| 选项② | 包庇压下：该城民心-3，武将忠诚+5，豪族支持-5 |
| AI决策 | 金≥600选①（严惩），否则选②（包庇） |
| 代码位置 | EVENT_DEFS内，G8檄文声讨之后（~行8203） |
| 依赖 | GEN_TAGS[].temperament, HEX_CITY, CITY_MAP, G.cities[].morale/gentry, G.genLoyalty, addGenChronicle, log, showNotif |
| 侵入性 | 零——纯EVENT_DEFS新增，未修改任何现有函数 |

**触发逻辑细节**：
1. 遍历所有己方garrison状态部队，建立武将名→城市ID映射表
2. 遍历己方武将，筛选 temperament==='reckless' 且非君主
3. 优先匹配太守身份（通过 G.cities[].prefect），其次匹配garrison驻城
4. 随机选一名候选人+其所在城市作为事件上下文

**选择博弈分析**：
| | 严惩赔偿 | 包庇压下 |
|---|---------|---------|
| 金钱 | -200 | — |
| 民心 | +3 | -3 |
| 忠诚 | -5 | +5 |
| 豪族 | — | -5 |
| 适用场景 | 有钱、重视民心/豪族 | 缺钱、该将忠诚危险 |

### v142 变更摘要

| 项目 | 变更 |
|------|------|
| 事件总数 | 28 → 29（+G9莽夫闯祸） |
| 净增行数 | +77行（27401→27478） |
| 影响模块 | M08事件系统（EVENT_DEFS新增1个定义） |
| 侵入性 | 零新函数，零现有函数改动 |
| 性格事件覆盖 | proud(warrior_rivalry) + reckless(reckless_trouble) = 2/6标签有专属事件 |

### v142 代码审计（Layer 1+2自动化扫描）

**审计方法**：编写Node.js自动化扫描脚本，覆盖数据完整性(L1)和已知bug模式(L2)两层，合计15个检查维度。

**Layer 1 结果（数据完整性）**：
| 检查项 | 结果 |
|--------|------|
| GEN_TAGS 5维度完整性 | ✅ 107人全覆盖，零缺失 |
| 武将6适性完整性 | ✅ 107人全覆盖，零缺失 |
| genLoyalty边界保护 | ✅ 5处赋值为合法初始化（=60/=100等） |
| 事件依赖函数存在性 | ✅ 9个关键函数全部存在 |
| 除法分母为0 | ⚠ 22处潜在风险（多为totalInf/total/count类），大部分已有上游保护 |

**Layer 2 结果（已知bug模式）**：
| 检查项 | 结果 |
|--------|------|
| loyaltyAccum同步 | ❌ **发现1处真实bug** → 已修复 |
| genFactionMod无Log | ✅ 2处为设计意图（高频每旬结算+宣称批量效果），非bug |
| nextTurn结算调用 | ✅ 全部32个结算函数已调用（脚本搜索范围不足导致误报） |
| 序列化对称性 | ✅ JSON.stringify全量序列化，reviver对称处理Set |
| FOUNDING_CORE一致性 | ✅ 全部武将在GEN_TAGS中有定义 |

**修复的bug**：
| 位置 | 问题 | 修复 |
|------|------|------|
| gen_conflict事件·设宴调和·deepHatred分支（行~6636） | genLoyalty+1后缺少loyaltyAccum同步 | 新增1行 `if(G.loyaltyAccum){...}` |

---

## v143 本轮新增内容

### 武将大扩充 + 归属修正 + INACTIVE迁移

**设计意图**：214年（建安十九年）开局基准梳理，补齐缺失的重要元老武将，修正归属有误的武将，将已死武将迁入INACTIVE。

#### A类：开局新增15人

**魏国 +6（34→42人，含文聘/王平移入）：**
| 武将 | 五维 | 定位 | 来源 |
|------|------|------|------|
| 曹纯 | com72 war85 int55 pol48 cha62 | 骑兵统领 | 新增 |
| 毛玠 | com58 war35 int75 pol85 cha72 | 内政文官 | 新增 |
| 董昭 | com60 war38 int82 pol80 cha65 | 谋臣 | 新增 |
| 曹丕 | com82 war68 int85 pol88 cha72 | 继承人 | 新增（214年27岁） |
| 曹植 | com55 war35 int88 pol72 cha85 | 文人 | 新增（214年22岁） |
| 郭女王 | com55 war25 int80 pol85 cha78 | 宫廷政治 | 新增 |
| 文聘 | — | 守将 | 从在野移入 |
| 王平 | — | 重步将 | 从蜀移入（214年属魏） |

**蜀国 +2净增（29→31人，-2移出+4新增）：**
| 武将 | 五维 | 定位 | 来源 |
|------|------|------|------|
| 糜竺 | com45 war30 int62 pol78 cha82 | 元老文臣 | 新增 |
| 糜芳 | com55 war60 int50 pol55 cha45 | 平庸将/叛变候选 | 新增（loyalty:40） |
| 孙乾 | com50 war32 int68 pol75 cha78 | 外交文臣 | 新增 |
| 简雍 | com48 war28 int65 pol70 cha80 | 说客 | 新增 |
| ~~姜维~~ | — | — | 移出→在野（214年12岁在魏） |
| ~~王平~~ | — | — | 移出→魏（214年属魏） |

**吴国 +4净增（24→28人，-1移出+5新增）：**
| 武将 | 五维 | 定位 | 来源 |
|------|------|------|------|
| 朱桓 | com78 war82 int68 pol55 cha62 | 防守猛将 | 新增 |
| 骆统 | com62 war55 int72 pol78 cha70 | 文武兼备 | 新增 |
| 吕据 | com70 war72 int62 pol58 cha60 | 中坚将 | 新增 |
| 留赞 | com65 war78 int52 pol48 cha55 | 勇将 | 新增 |
| 孙尚香 | com62 war72 int58 pol55 cha75 | 武勇公主 | 新增 |
| ~~太史慈~~ | — | — | 移出→INACTIVE（206年已死） |

#### 归属修正3人

| 武将 | 原位置 | 新位置 | 理由 |
|------|--------|--------|------|
| 姜维 | 蜀开局 | 在野(minTurn80) | 214年12岁在天水（魏地），约218年后方出仕 |
| 王平 | 蜀开局 | 魏开局 | 214年属曹操，后降蜀 |
| 文聘 | 在野 | 魏开局 | 208年降曹后一直在魏 |

#### INACTIVE迁移5人

| 武将 | 原位置 | 死亡年份 | 理由 |
|------|--------|----------|------|
| 太史慈 | 吴开局 | 206年 | 已死8年 |
| 陈宫 | 在野 | 198年 | 已死16年 |
| 田丰 | 在野 | 200年 | 已死14年 |
| 沮授 | 在野 | 200年 | 已死14年 |
| 高顺 | 在野 | 198年 | 已死16年 |

#### 其他数据修正

- 钟会 minTurn: 189→261（225年出生，约18岁出仕=243年=minTurn 261）

#### 保留不动的争议武将（游戏性优先）

郭嘉(207死)、荀彧(212死)、荀攸(214死)、李典(209死)、张绣(207死)、周瑜(210死)、程普(~210死)、黄盖(~210死?)、庞统(214死)、张松(213死)、张任(214死)——均保留在原位置。

### v143 变更摘要

| 项目 | 变更 |
|------|------|
| 净增行数 | +64行（27479→27543） |
| 武将总数 | 魏42 + 蜀31 + 吴28 + 在野13 + INACTIVE8 = 122人（原107+15新增） |
| 新增武将 | 15人（魏6+蜀4+吴5） |
| 归属修正 | 3人（姜维/王平/文聘） |
| INACTIVE迁移 | 5人（太史慈/陈宫/田丰/沮授/高顺） |
| GEN_TAGS | +16条（含姜维新条目），总123条 |
| GEN_META | +15条（所有新武将全覆盖） |
| 侵入性 | 纯数据变更，零函数改动 |
| 待做（下轮） | 方案A延迟出场机制 + B类9人后期武将 |

### 方案A延迟出场机制

**机制概述**：GENS_FULL中的武将可添加 `minTurn` 字段，有此字段且>1的武将开局不加入G.generals，而是存入G.genPendingPool。每旬nextTurn检查pool，turn到了自动加入对应势力。

**initGame改动（~10行）**：
- 遍历GENS_FULL时过滤minTurn>1的武将到G.genPendingPool（带_pendingFac标记）
- 无minTurn或minTurn<=1的武将正常加入G.generals

**nextTurn改动（~35行）**：
- 每旬检查G.genPendingPool，G.turn >= minTurn的武将自动到达
- 到达时完整初始化15项武将数据：忠诚/loyaltyAccum/加入旬/来源/原role/原势力/功勋/小传/属性经验/属性基准/适性经验/派系mod
- 玩家势力到达时弹通知+日志

**B类9人延迟武将**：
| 武将 | 势力 | minTurn | 约公元 |
|------|------|---------|--------|
| 关兴 | 蜀 | 45 | 215年 |
| 张苞 | 蜀 | 45 | 215年 |
| 王基 | 魏 | 117 | 217年 |
| 诸葛恪 | 吴 | 117 | 217年 |
| 司马昭 | 魏 | 153 | 218年 |
| 陈泰 | 魏 | 153 | 218年 |
| 夏侯霸 | 蜀 | 153 | 218年 |
| 施绩 | 吴 | 153 | 218年 |
| 文鸯 | 在野 | 261 | 221年 |
| 羊祜 | 在野 | 261 | 221年 |
| 王濬 | 在野 | 189 | 219年 |

### UI修复

- 武将详情弹窗：naval适性显示"naval"→"⚓ 水军"
- aptColor/aptLabel/gradeScore：补充naval对应图标和名称
- D级适性删除：APT_MULT删D:0.75，6人naval:'D'→'C'，UI三处删D定义

### v143最终变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | 27479→27634（+155行） |
| 武将总数 | 魏45+蜀32+吴30+在野16+INACTIVE8 = 131人 |
| 新增武将 | A类15人(开局) + B类9人(延迟) = 24人 |
| 延迟出场机制 | 方案A实装，initGame过滤+nextTurn检查 |
| 归属修正 | 3人（姜维/王平/文聘） |
| INACTIVE迁移 | 5人 |
| D级适性 | 删除（S/A/B/C四档） |
| UI修复 | naval显示中文"水军" |

---

## v144 本轮新增内容

### 南蛮势力 + 多势力架构重构

**设计意图**：新增南蛮作为第四势力（建宁为据点，蜀国附庸），同时将全代码从硬编码三势力`['wei','shu','wu']`重构为动态`ALL_FACS`列表，为190剧本等多势力场景做架构准备。

#### 新增常量/数据

| 常量 | 值 | 说明 |
|------|---|------|
| `ALL_FACS` | `Object.keys(FAC).filter(f=>f!=='rebel')` | 动态势力列表，替代75处硬编码 |
| `PLAYABLE_FACS` | `['wei','shu','wu','nanman']` | 可选玩家势力 |
| `FAC.nanman` | `{name:'蛮',full:'南蛮',ruler:'孟获',color:'#8b6914',cls:'nanman'}` | 南蛮势力定义 |
| `FAC_IDENTITY.nanman` | `{type:'tribal',_baseType:'tribal',traits:['蛮族']}` | 南蛮身份标签 |
| `--nanman` CSS变量 | `#8b6914` | 南蛮主题色（土金色） |

#### 南蛮势力配置

| 项目 | 值 |
|------|---|
| 城市 | 建宁（1城，small，原属蜀） |
| 郡 | 南中郡（nanzhongjun，fac从shu改为nanman） |
| 武将 | 孟获（ruler, com78/war88/int45/pol42/cha72, light:S/heavy:A）+ 祝融（com65/war82/int58/pol38/cha70, light:A/archer:A） |
| 初始资源 | 金1500/木2000/铁3000/马300（远低于三国） |
| 外交 | 蜀附庸（rel:50）、魏中立（rel:25）、吴中立（rel:30） |
| 科技 | 无预解锁 |
| 信誉度 | 30（最低） |
| 建宁特殊 | 民心25（低）、存粮半减 |
| 特色兵种 | 藤甲兵（homeCity:jianning，南蛮可招募） |

#### 硬编码重构（75处）

**方法**：全局替换`['wei','shu','wu']` → `ALL_FACS`，然后逐一审查特殊场景。

**特殊处理**：
| 场景 | 处理 |
|------|------|
| 三国鼎立事件（三势力各≥10城） | 保留`['wei','shu','wu']`硬编码，历史事件不含南蛮 |
| 三方两两关系检查（鼎立条件） | 保留`pairs=[['wei','shu'],['wei','wu'],['shu','wu']]` |
| 曹操特定事件（G.factions.wei） | 保留，历史事件绑定特定势力 |
| 完整性审计VALID_FACS | 改为`new Set([...ALL_FACS, 'rebel'])`动态生成 |

#### 受影响模块清单

| 模块 | 改动数 | 改动内容 |
|------|-------|---------|
| M02 迷雾 | 5处 | updateFog/视野共享遍历改ALL_FACS |
| M04 派系政治 | 2处 | processFactionLoyalty/initFactions |
| M05 初始化 | 8处 | initGame科技/外交CD/计谋CD/派系政治+nanman资源 |
| M08 事件系统 | 6处 | 事件condition中的势力遍历 |
| M09 AI系统 | 3处 | AI决策/diplo中的势力遍历 |
| M11 外交系统 | 12处 | 各外交操作/计谋/宣称中的势力遍历 |
| M12 回合循环 | 8处 | nextTurn内各结算的势力遍历 |
| M13 渲染 | 5处 | overlay/fog更新/面板渲染 |
| M19 统计面板 | 8处 | FAC_COL/FAC_NAME/趋势图/城池条 |
| M22 战报 | 2处 | facCol内联helper |
| M23 存档 | 3处 | 序列化/反序列化科技树Set恢复 |
| M24 审计/结局 | 5处 | checkElimination/showGameEnd/VALID_FACS |
| M23b 选势力 | 1处 | showFactionSelect加nanman卡片 |
| CSS | 4处 | --nanman变量/fc.nanman类/fc-n.nanman类 |

#### 新增数据条目

| 数据结构 | 新增内容 |
|----------|---------|
| GENS_FULL | nanman:[] 2人 |
| GEN_META | 孟获/祝融 条目 |
| GEN_TAGS | 孟获/祝融（politics:regional, combat:hawk, origin:foreign, region:nanzhong, temperament:reckless） |
| FOUNDING_CORE | nanman: Set(['孟获','祝融']) |
| TECH_PREUNLOCK | nanman: [] |
| DIPLO_INIT | 3对新外交关系 |
| REGION_CITIES | nanzhong:['jianning'] |
| REGION_TO_GENTRY_FAC | nanzhong→gentry_yizhou |
| regionNames | nanzhong:'南中' |
| origin显示 | foreign→'外族出身' |

### v144 变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | 27634→27929 |
| 势力数 | 3→4（+南蛮） |
| 武将总数 | 131→133（+孟获/祝融） |
| 城市归属 | 建宁 shu→nanman |
| 架构改动 | 75处硬编码`['wei','shu','wu']`→ALL_FACS |
| 附庸外交闭环 | `_setVassalStatus`统一入口 + `_resolveVassalDiploConflicts`冲突清理 |
| 新增函数 | `_setVassalStatus`, `_resolveVassalDiploConflicts`, `diploDemandVassal`, `diploSubmitVassal`, `requestVassalIndependence` |
| 官职系统 | 4档（王10城/公6城/侯3城/诸侯1城）+ 档位进度条UI |
| 宣称系统 | +蛮族劫掠（tribal_raid，0准备，信誉-5） |
| UI改进 | CSS即时tooltip（`.dip-tip-wrap`）、太守任命本地士族高亮、外交状态中文化 |
| 向后兼容 | ALL_FACS动态派生自FAC对象，190剧本加势力只需扩FAC即可 |

### v144 附庸外交完整机制

**附庸关系建立（4条入口，统一走`_setVassalStatus`→`_resolveVassalDiploConflicts`）：**
1. `acceptVassalOffer` — AI弹窗称臣（玩家接受/拒绝）
2. `diploDemandVassal` — 玩家要求对方称臣（需军力≥2.5倍，双方自由身）
3. `diploSubmitVassal` — 玩家请求称臣（需对方军力≥1.5倍，双方自由身）
4. AI auto-vassal — checkDiplo中AI自动称臣（powerIndex<15%，35%概率）

**冲突清理规则（`_resolveVassalDiploConflicts`）：**
1. 附庸旧同盟 → 解除转中立
2. 附庸的子附庸 → 解放自由（转中立）
3. 附庸与第三方交战但宗主和平 → 附庸强制停战
4. 宗主与第三方交战但附庸和平 → 附庸跟随宣战

**附庸限制：**
- 附庸无外交自主权（不可宣战/结盟/求和），外交面板显示提示
- 附庸不可收纳附庸，附庸不可当宗主
- 已有宗主不可再投靠新宗主（须先解除）

**解除附庸：**
- `requestVassalIndependence` — 玩家请求解除（需rel≥30，12旬CD）
- 概率基于好感度+军力比，成功→中立(rel-5)，失败→rel-8
- 自动脱离：rel<20时附庸自动独立（checkDiplo中）

**纳贡：** 每旬金币18%（本旬产出）+ 粮食12%（各城存粮）→ 转宗主

### v144 官职四档体系

| 档位 | 城市门槛 | 武官(三品/二品/一品) | 文官(三品/二品/一品) |
|------|---------|-------|-------|
| 王 | ≥10城 | 6/4/1 | 6/4/1 |
| 公 | ≥6城 | 5/3/1 | 5/3/1 |
| 侯 | ≥3城 | 3/2/0 | 3/2/0 |
| 诸侯 | ≥1城 | 2/1/0 | 2/1/0 |

官职Tab顶部显示当前档位、城市数、进度条、下一档需求和解锁内容。

### v144 UI改进

**CSS即时tooltip（`.dip-tip-wrap` / `.dip-tip`）：**
- 替代浏览器原生title属性（有延迟）
- 灰色按钮hover立即显示原因气泡
- 应用于：外交面板所有灰色按钮 + 称帝按钮
- 文案精简：交情不够、金币不足、实力差距不够大、已有宗主等

**太守任命本地士族高亮：**
- 武将region匹配城市所在地域 + origin是gentry → 金色「本地士族」标签 + 淡金底色
- 仅高亮有gameplay加成的本地士族，不标注无加成的普通本地人

**外交面板中文化：** `sm`状态映射加入`vassal:'附庸'`，颜色`#8060c0`

**新手引导修复：** 适性等级描述 S/A/B/C/D → S/A/B/C

---

## v145 本轮新增内容

### 计谋独立Tab

**设计意图**：将计谋从外交Tab中拆分为独立Tab，减少外交面板的信息密度，计谋作为独立玩法体系有自己的Tab更合理。

**改动清单（纯UI拆分，零逻辑改动）：**

| 位置 | 改动 |
|------|------|
| HTML tab栏（~L576） | 外交与派系之间插入「计谋」tab |
| `renderRight()`（~L15202） | 新增 `G.activeTab==='scheme'` 路由到 `renderSchemeTab` |
| `updateTabs()`（~L16588） | tab数组加入 `'scheme'`（8→9个tab） |
| 新函数 `renderSchemeTab(c)` | 从 `renderDipTab` 抽出军师栏+全部计谋区块，独立渲染 |
| `renderDipTab(c)` | 移除军师栏IIFE和计谋区块IIFE，只保留声誉+身份+外交卡片+底部说明 |

**新函数 `renderSchemeTab(c)` 结构：**
1. 标题行（势力名+计谋）
2. 军师栏（任命按钮、当前军师/君主INT显示）
3. 计谋区块（驱虎吞狼/二虎竞食/反间计/散布谣言/细作探报，含所有下拉级联和CD/金币判断）
4. 底部说明（计谋成功率/失败信誉/冷却提示）

**向后兼容**：`activeTab`不参与存档序列化（默认`'city'`），旧存档无影响。

### 新手引导微调

| 改动 | 内容 |
|------|------|
| TUT_PAGES[5] body | `结盟、停战、宣战` → `结盟、停战、宣战、收纳附庸` |
| TUT_PAGES[5] body | `或施展计谋` → `或在「计谋」标签中施展计谋` |
| TUT_PAGES[5] details[1] | `外交面板提供多种计谋` → `「计谋」标签提供多种计谋` |

### v145 变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | 27929→27937（+8行净增） |
| Tab数 | 8→9（+计谋） |
| 新函数 | `renderSchemeTab`（1个） |
| 改动函数 | `renderDipTab`（移除计谋块）、`renderRight`（+路由）、`updateTabs`（+scheme） |
| 新手引导 | 外交页提及附庸+计谋Tab指引 |
| 资源重平衡 | 马匹1:1消耗 + 产马城base提升 + 初始储备调整 + 铁木消耗涨50% |
| 资源地理 | 产铁城6个(魏4吴2) + 产木城5个base提升 + 非产出城不动 |
| 数据改动 | CITIES_DEF(18城) + TROOP_TYPES(16种) + initGame储备 |
| 侵入性 | 纯数据+UI改动，零公式/逻辑改动 |

### 资源经济重平衡（v145）

**设计意图**：开局各资源过于充裕，铁/木/马从未构成征兵瓶颈。马匹尤其严重——蜀初始4000马比魏还多，骑兵消耗200马/5000兵太低。

#### 马匹 1:1 消耗体系

**核心公式不动**（`calcSlotMatCost`），只改数据：`recruit.horses` 从 200 → **5000**（每5000骑兵需5000马 = 1:1直观）。

**产马城base.horses大幅提升**（配合1:1消耗）：

| 城市 | 势力 | 旧值 | 新值 | 理由 |
|------|------|------|------|------|
| 姑臧 | 魏 | 14 | 200 | 西凉产马最盛 |
| 蓟城 | 魏 | 13 | 180 | 幽州北地马场 |
| 武威 | 魏 | 12 | 170 | 河西走廊 |
| 晋阳 | 魏 | 11 | 160 | 并州产马 |
| 河东 | 魏 | 10 | 140 | 中原产马 |
| 长安 | 魏 | 8 | 25 | 近马场，少量 |
| 成都 | 蜀 | 12 | 160 | 蜀中唯一马源 |

**节奏**（无马厩）：魏~388马/旬(6.4旬/分队) · 蜀~198马/旬(12.6旬/分队) · 吴~13马/旬(基本无骑兵)

#### 初始储备重设

| 资源 | 旧默认 | 新默认 | 魏 | 蜀 | 吴 | 蛮 |
|------|--------|--------|---|---|---|---|
| 木 | 4000 | **2000** | 2000 | **2400** | **2800** | **1000** |
| 铁 | 3000 | **1400** | 1400 | 1400 | **1000** | **650** |
| 马 | 2000 | **4000** | 4000 | **2500** | **300** | **200** |

#### 征兵材料消耗涨50%

| 兵种 | 铁(旧→新) | 木(旧→新) | 马(旧→新) |
|------|----------|----------|----------|
| 骑兵 | 50→80 | — | 200→5000(1:1) |
| 轻步 | 30→45 | — | — |
| 弓兵 | 80→120 | 60→90 | — |
| 重步 | 150→220 | 30→50 | — |
| 攻城 | 120→180 | 500→750 | — |

精锐兵种recruit同步更新（16种全覆盖）。`costMult:1.7`不变，精锐铁木自动涨；马匹有`r==='horses'?1.0:_cm`豁免，精锐骑兵马消耗=普通骑兵。

#### 影响范围

- **改数据**：`CITIES_DEF`(7城base.horses) + `TROOP_TYPES`(16种recruit) + `initGame`(储备)
- **不改公式**：`calcSlotMatCost` / `processFacEconomy` / `getCityProd` 全不动
- **AI兼容**：AI征兵已有`canAffordMat`检查，资源不够自动跳过，无需调整
- **存档兼容**：存档存的是G.factions[fid].res运行时值，不受初始值改变影响

#### 产铁城落地（6城新增「产铁」标签）

标签效果已有定义：`产铁: ironM +1.0`（铁产量×2），此前无城市使用。

| 城市 | 势力 | base.iron旧→新 | 史实依据 |
|------|------|---------------|---------|
| 许昌 | 魏 | 80→110 | 颍川冶铁中心 |
| 洛阳 | 魏 | 70→100 | 盐铁都会 |
| 邺城 | 魏 | 75→95 | 北方冶铁重镇 |
| 天水 | 魏 | 48→80 | 陇西铁矿 |
| 武昌 | 吴 | 45→90 | 长江中游冶铁 |
| 合肥 | 吴 | 60→80 | 淮南冶铁 |

分布：魏4城铁矿优势、吴2城、蜀0城（铁是蜀的战略短板，需靠扩张获取）。

#### 产木城base提升（5城已有「产木」标签）

| 城市 | 势力 | base.wood旧→新 |
|------|------|---------------|
| 夷陵 | 蜀 | 100→170 |
| 建宁 | 蛮 | 90→155 |
| 交州 | 吴 | 120→150 |
| 巴中 | 蜀 | 85→140 |
| 零陵 | 吴 | 85→140 |

此前产木城base.wood低(85-120)，小城popMult拉胯，实际产出不如许昌/成都等大城。提升到140-170后配合tag加成(+80%)，产木城真正成为木材重镇。

#### 资源地理差异化设计意图

| 资源 | 产出城base | 非产出城base | 差距 | 设计意图 |
|------|-----------|------------|------|---------|
| 马 | 140-200 | 1-5 | 30-200x | 骑兵命脉，极度集中 |
| 木 | 140-170 | 25-100 | 1.5-7x | 攻城/弓兵需要，中等集中 |
| 铁 | 80-110 | 25-80 | 1-4x(tag×2后2-8x) | 所有兵种都用，最温和 |

每旬估算产出（无建筑加成）：魏 木630/铁1084/马1081 · 蜀 木706/铁269/马566 · 吴 木~450/铁~290/马~13

---

## v146 本轮新增内容

### Bug修复（6项）

| # | 严重度 | 位置 | 修复内容 |
|---|--------|------|---------|
| BUG1 | **Critical** | `getSiegeDefMult` / `_getSiegeDefMultWithDecay` (L18114-18131) + `SIEGE_BASE_DEF_BONUS` (L18111) | **城防durM实装**：baseDef从`{3.5/5.0/7.0}`下调至`{2.0/3.0/4.0}`，公式加入`durM = getCityStats(city.tags).durM`，`baseDef * durM + wallBonus`。雄关(×2.0)/山地(×1.4)/水乡(×1.1)城防地形优势生效。 |
| BUG2 | **High** | `_showCampBattleConfirm` (L22280) + `confirmCampBattle` (L22320) | **营寨战叫阵ReferenceError**：`allGensCA`/`allGensC`未定义→改用`GEN_MAP[name]`。原代码在AI守方叫阵时必崩。 |
| BUG3 | **Medium** | `AI_PERSONALITY` (L8946) | **南蛮缺AI人格**：新增`nanman:{atkThreshold:0.60, siegeThreshold:0.65, diploAggro:0.4, deployBias:-0.10, budgetBias:-0.10}`，偏保守。 |
| BUG4 | **Low** | `_serializeG` (L26794) | **存档版本号**：136→146。 |
| TUT-a | Low | TUT_PAGES[1] details[0] | **斥候引用**：`外交面板的「斥候」计谋`→`「计谋」标签的「斥候」`。 |
| TUT-b | Low | TUT_PAGES[2] details[1] | **资源描述**：`有的城市产铁，有的产马`→`有的城市产铁，有的产马，有的产木`。 |

#### 城防durM效果一览（BUG1修复后）

| 城市示例 | 地形 | durM | 城防倍率（无围城） |
|---------|------|------|-----------------|
| 许昌(大/平原) | 都市+平原+产铁 | 1.0 | ×5.0 |
| 汉中(中/雄关山地) | 雄关+山地 | **2.8** | **×9.4** |
| 天水(小/雄关山地) | 雄关+山地+产铁 | **2.8** | **×6.6** |
| 合肥(中/雄关) | 雄关+产铁 | **2.0** | **×7.0** |
| 建业(大/水乡) | 都市+港口+水乡 | 1.1 | ×5.4 |

公式：`1 + (baseDef × durM + wallBonus) × (1 - siegeDecay) × gentryDef`

### AI防守强化（4项）

#### A. 领土入侵检测（替代固定6hex圈）

**旧逻辑**：`aiDefendResponse` Step 1 遍历每座己方城市，扫描城市周围6hex以内的敌军。城与城之间的空地是感知盲区，玩家可穿过两城间隙不触发防守。

**新逻辑**：使用`_buildTerritoryMap()`领土归属表——每个hex都有归属势力和最近城市。遍历所有己方可见敌军，检查其所在hex是否属于己方领土。踏入领土即触发防守，按最近城市调兵。

**影响范围**：
- `aiDefendResponse` Step 0（威胁清除判定）：同步改为领土检测
- `aiDefendResponse` Step 1（威胁扫描）：整体重写为领土遍历
- 不影响Step 2/3（调兵逻辑不变）

#### B. 出兵上限微调

| 参数 | 旧值 | 新值 |
|------|------|------|
| `baseDeployRatio` 基数 | 1.0 | 0.90 |
| `baseDeployRatio` 衰减系数 | 0.6 | 0.5 |
| `maxDeployRatio` floor | 0.20 | 0.25 |
| `maxDeployRatio` cap | 0.95 | 0.90 |

效果：无威胁时魏90%出兵（原95%），蜀90%（原95%）；高威胁时保留更多后备。AI进攻积极性基本不变，防守靠A+C兜底。

#### C. 放宽进攻部队召回条件

| 参数 | 旧值 | 新值 | 说明 |
|------|------|------|------|
| 进攻部队召回距离 | ≤3hex | ≤5hex | 更早响应领土入侵 |
| 召回胜率门槛 | WR<0.30 | WR<0.50 | 守方胜率一般即召回 |
| 最大调兵距离 | 15hex | 20hex | 配合领土检测扩大响应范围 |

#### D. 威胁矩阵硬编码修复

| 位置 | 旧代码 | 新代码 |
|------|--------|--------|
| `_aiGetThreatMatrix` allFacs | `['wei','shu','wu']` | `ALL_FACS.filter(f=>f!==fid)` |
| `_aiInvalidateThreatCache` | `['wei','shu','wu'].forEach` | `ALL_FACS.forEach` |

### 攻城胜利AP清零

**位置**：`resolveSiegeBattle` 攻方胜利分支（L21267）

**改动**：围城部队（`status==='siege'`）攻城胜利后`_apRemaining = 0`，当旬不可继续行军。旁边友军不受影响。

### 陆上撤退水路fallback

**位置**：`doRetreat`（L20806-20823）

**问题**：攻城失败后撤退，如果城市周围全是水域（如青州），原逻辑找不到陆路邻居→`break`→部队留在敌城hex上→"反弹"回城。

**修复**：新增`else if(!_retOnWater)`分支——陆上退无路时，扫描所有可通行邻居（含水路），排除敌城hex，选最远离敌方的hex作为紧急退路。走水路1步后立即停止。

### v146 变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | 27937→~27966 |
| Bug修复 | 6项（城防durM/营寨叫阵崩溃/南蛮AI人格/存档版本/TUT×2） |
| AI改进 | 4项（领土感知/出兵上限/召回门槛/威胁矩阵） |
| 战斗改动 | 攻城胜利AP清零 + 陆上撤退水路fallback |
| 改动函数 | `getSiegeDefMult`、`_getSiegeDefMultWithDecay`、`aiDefendResponse`、`aiSelectTargets`（deploy ratio）、`_aiGetThreatMatrix`、`_aiInvalidateThreatCache`、`resolveSiegeBattle`、`doRetreat`、`_showCampBattleConfirm`、`confirmCampBattle` |
| 改动常量 | `SIEGE_BASE_DEF_BONUS`、`AI_PERSONALITY`(+nanman) |
| 侵入性 | 中等——AI防守逻辑重写Step0/1，战斗核心公式不动 |

### ⚠️ 已知遗留项

| 项目 | 说明 |
|------|------|
| 模拟器失真 | 本轮写的Monte Carlo模拟器过于简化（无围城衰减/多路协调/技能/事件等），结果仅供参考，不代表实际游戏平衡 |
| AI进攻效率 | 需实际play-test验证AI是否在v146的防守强化后仍然积极进攻。如果AI变得过于龟缩需回调B参数 |
| localStorage fallback | `_store`降级到localStorage在Claude.ai Artifact环境中会静默失败，不影响游戏但存档可能丢失 |

---

## v147 补员系统改用领土归属

### 设计动机

原补员系统使用硬编码半径 `CTRL_RADIUS_HEX {large:8, medium:6, small:4}` + `hexDist` 遍历所有己方城市找最近城，判定是否在补员范围内。问题：
- 与领土视觉系统（`_OV_RADIUS {large:10, medium:7, small:5}` + 首都+2 + BFS回填）不一致，玩家在领土着色范围内却可能补不了员
- 每个unit每旬遍历全部己方城市算距离，逻辑冗余（领土系统已有每旬缓存）
- "最近城市"不等于"归属城市"，边界地带可能出现补员看错城人口的情况

### 改动内容

**核心函数 `processReinforcement`**（L23339）：
- 删除 `CTRL_RADIUS_HEX` 常量和 `hexDist` 遍历逻辑
- 改为调用 `_buildTerritoryMap()` 查询 `territory[hkey(unit.hq, unit.hr)]`
- 归属判定：`terr.fac !== fac` → 不补员（敌方/无主领土均不补）
- 归属城市：`G.cities[terr.cityId]` 作为 `nearCity`，front补员看该城 `pop`
- 城中判定：`terr.dist <= 1` → ×1.5 加成（替代原 `hexDist <= 1`）
- 其余全部不动：front/rear公式、精锐兵种homeCity逻辑、臧霸啸聚、金消耗、等级加权

**补员速度breakdown tooltip**（L17066）：
- 同步改用 `_buildTerritoryMap` 查询
- 显示"所属领土：XX（距城N格）"替代"最近己方城市：XX（N格）"
- 领土外显示"不在己方领土内"替代"远离所有城市"

**部队详情面板内联摘要**（L25600）：
- 同步改用领土查询
- "领土外停止"替代"城外停止"

### 行为变化

| 方面 | 旧（v146） | 新（v147） |
|------|-----------|-----------|
| 补员范围 | 最近己方城市4/6/8 hex内 | 己方领土内（5/7/10+首都+2+BFS回填） |
| 范围略扩 | 大城边缘8格断补 | 大城领土10格+回填均可补 |
| 归属城市 | hexDist最近的己方城市 | BFS领土归属城市（更准确） |
| 城中判定 | hexDist≤1 | BFS dist≤1（等价，更一致） |
| 领土外 | 完全不补（同） | 完全不补（同） |
| 性能 | 每unit遍历所有己方城市 | 查缓存hashmap O(1) |
| UI一致性 | 补员范围 ≠ 领土着色 | 补员范围 = 领土着色 |

### 不变的部分

- 补员基准 BASE=200、front×0.68、rear×2.0 公式不动
- 补员政策（均衡/精兵/速补）不动
- 欠饷>50%停补、存粮<2旬停补、金消耗0.05/兵 不动
- 精锐兵种homeCity绑定逻辑不动
- 臧霸啸聚青徐×2不动
- 集结中squad补员规则不动
- 等级加权（就地新兵/后方精兵）不动

### v147 变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | ~27966→~27959 |
| 改动函数 | `processReinforcement`（核心逻辑重写头部） |
| 改动UI | 补员breakdown tooltip + 部队面板内联摘要 |
| 删除常量 | `CTRL_RADIUS_HEX`（processReinforcement内局部变量）、tooltip内 `CTRL_HEX` |
| 新增依赖 | `_buildTerritoryMap()`（已有，每旬缓存） |
| 存档版本 | 146→147 |
| 侵入性 | 低——仅改补员范围判定方式，公式和数值全部不动 |

### 外交事件过滤（防止小势力/附庸出戏）

**问题**：南蛮（1城2将、蜀附庸）会被外交事件当成和魏蜀吴同等级的外交实体，触发"使者来访谈划江而治"、"远交近攻联合南蛮"等出戏剧情。

**改动**：

**envoy_visit（使者来访）** condition：
- `ALL_FACS.filter(f=>f!==fid)` → 加两个过滤条件
- 排除城市数 <3 的势力（小势力没资格派使者谈天下大事）
- 排除自己的附庸（`isSuzerain(fid, f)`）
- 扩张到3城以上的势力自然恢复资格

**distant_alliance（远交近攻）** condition：
- 候选盟友（allyF）加两个过滤条件
- 排除自己的附庸
- 候选盟友须与敌人有城市地理邻接（通过 `ROAD_ADJ` 检测）——"远交近攻"的"近攻"前提是盟友能实际威胁敌人
- 内联辅助函数 `_facsAdjacent(a,b)` 检测两势力是否有相邻城市

**propaganda_war（檄文声讨）**：不改，已限定enemy状态，对敌人发檄文无论大小都合理

**three_kingdoms_settled（天下三分势定）**：已硬编码只检查 `['wei','shu','wu']`，不受影响

---

## v148 腐败系统

### 设计动机

大势力（尤其魏）因城市数量多，经济产出碾压小势力。腐败系统通过"城越多腐败越重"的机制，对大势力金产施加隐性税，缩小经济差距，增加扩张成本的同时保留太守和豪族的内政价值。

### 核心机制

**腐败只影响金产**，不影响粮/木/铁/马。在 `processFacEconomy` 中每城金产汇总前按腐败率扣除。

#### 基础腐败率

```
基础腐败率 = min(30%, max(0, (城数 - 3) × 2%))
```

3城以下无腐败，每多1城+2%，上限30%。

#### 太守压腐（镜像设计，以pol=50为中轴）

```
太守压腐 = (pol - 50) / 250    // pol=100→+20%, pol=50→0%, pol=0→-20%
         + 本地士族太守额外 +5%
```

低pol太守反而加剧腐败。无太守 = 压腐0%。

#### 豪族压腐

| 豪族等级 | min | 压腐值 |
|---------|-----|--------|
| 拥戴 | ≥80 | +15% |
| 支持 | ≥60 | +8% |
| 中立 | ≥40 | 0% |
| 不满 | ≥20 | -8% |
| 抗拒 | <20 | -15% |

#### 单城实际腐败率

```
实际腐败率 = 基础腐败率 × (1 - 太守压腐 - 豪族压腐)
clamp(0, 1)
```

### 初始影响估算

| 势力 | 城数 | 基础腐败率 | 有太守后(avg pol≈65) | 说明 |
|------|------|-----------|---------------------|------|
| 魏 | 21 | 30%(cap) | ~24% | 受影响最大，符合设计意图 |
| 吴 | 13 | 20% | ~14% | 中等 |
| 蜀 | 10 | 14% | ~8% | 较轻 |
| 南蛮 | 1 | 0% | 0% | 无影响 |

### 新增常量

| 常量 | 值 | 说明 |
|------|---|------|
| `CORRUPT_PER_CITY` | 0.02 | 每城+2%基础腐败率 |
| `CORRUPT_FREE_CITIES` | 3 | 3城以下免腐败 |
| `CORRUPT_CAP` | 0.30 | 基础腐败率上限 |
| `CORRUPT_GENTRY_MAP` | 5级 | 豪族等级→压腐值映射 |

### 新增函数

| 函数 | 位置 | 说明 |
|------|------|------|
| `_getCorruptGentryMod(gentryVal)` | ~L3745 | 豪族等级→压腐修正值查询 |
| `calcCityCorruption(city, cityCount)` | ~L3754 | 单城实际腐败率计算（0~1） |

### 改动函数

| 函数 | 改动摘要 |
|------|---------|
| `processFacEconomy` (~L5367) | 城市循环内每城金产扣除腐败损失，缓存`city._corruptRate`/`city._corruptLoss`/`fac._corruptLoss` |
| `showBreakdown` type==='gold' (~L16843) | 城市金产tooltip新增腐败分解行（基础/太守/豪族） |
| `showFacBreakdown` type==='gold' (~L17337) | 势力金钱tooltip新增腐败总损失行 + 各城行加腐败扣金 |

### UI显示

**城市金产tooltip**（hover金产数字）：
```
🏛 腐败    -XX/旬（实际12.5%）
  基础腐败（21城）   30%
  太守张昭压腐       +8%
  豪族（支持）       +8%
```

**势力金钱tooltip**（统计tab hover金钱）：
```
🏛 腐败损失   -XXX/旬（基础30%·21城）
```
各城行追加 `腐败-XX`。

### 新手指导

TUT_PAGES[2] details[1]（粮食与资源）追加：
> 注意：疆域越大，**腐败**越严重——每座城市的金产会被腐败侵蚀一部分。任命高政治太守和维持豪族支持可以压制腐败。

### 存档兼容

- 腐败是每旬实时计算的，不需要新存档字段
- `_corruptRate`/`_corruptLoss`/`_corruptLoss` 均为运行时缓存（下划线前缀），不入存档
- 存档版本 147→148

### 预留接口

| 接口 | 说明 |
|------|------|
| 科技 `corruptReduce` | 未来可加"反腐"科技节点，在 `calcCityCorruption` 中作为额外减腐修正 |
| 朝议 decree | 未来可加"肃贪"提案，临时全势力减腐 |

### v148 变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | ~27959→~28066 |
| 新增函数 | `calcCityCorruption`、`_getCorruptGentryMod` |
| 改动函数 | `processFacEconomy`、`showBreakdown`(gold)、`showFacBreakdown`(gold)、`processUnitMovement`(水陆转换) |
| 新增常量 | `CORRUPT_PER_CITY`/`CORRUPT_FREE_CITIES`/`CORRUPT_CAP`/`CORRUPT_GENTRY_MAP` |
| 改动UI | 城市金产tooltip + 势力金钱tooltip + 新手指导 |
| 存档版本 | 147→148 |
| 侵入性 | 低——只在processFacEconomy金产汇总处插入扣除逻辑，不改nextTurn顺序，不动其他结算函数 |

### AI水路修复（水陆转换保持march）

**问题**：`processUnitMovement` 水陆转换时将部队设为 `status='halt'`，但 `aiExecuteOrders` 步骤2将halt+有hexPath+旁边无敌军的部队视为"被堵"，累计3旬后放弃目标。导致AI部队永远无法穿越水域。

**根因**：水陆转换是移动系统的内部事务，不应该改变部队状态暴露给AI决策层。

**修复**：`processUnitMovement` 水陆转换时保持 `status='march'`，只清AP。下旬AP恢复后自动沿保留的hexPath继续走。AI全程不介入。

| 位置 | 改动 |
|------|------|
| `processUnitMovement` (~L18145) | 删除 `unit.status = 'halt'`，保持march状态 |

**不影响的部分**：
- 玩家即时行军 `_execInstantMarch` 已正确使用 `status='march'`，无需修改
- 水上部队不可围城的halt（L18052）不受影响——那是不同逻辑
- AP清零仍然生效，水陆转换仍消耗一整旬

### 腐败公式修正（乘法→加减法）

**问题**：原公式 `baseRate × (1 - prefectMod - gentryMod)` 为乘法——太守和豪族的压腐是对基础率的百分比，不直观。例如基础14%、太守压15%+豪族8%，实际只降到14%×0.77=10.8%，而非0%。

**修正**：改为加减法 `baseRate - prefectMod - gentryMod`，直接减去百分点。14%-15%-8%=-9%→clamp到0%。

---

## v149 代码审查修复（5项）

### 背景

基于外部代码审查报告（23项），逐一验证后确认5项为实际问题，其余18项为误报或架构建议。本轮仅修复确认的5项。

### 审查结果分类

| 分类 | 数量 | 说明 |
|------|------|------|
| 确认修复 | 5项 | B01(严重)/B05(中)/B07(中)/B09(低)/U01(低) |
| 确认误报 | 5项 | B02/B03/B04/B08/D02 — 代码已有正确处理 |
| 设计选择/未来改进 | 13项 | B06/A01-A06/D01/D03/P01-P02/U02-U03 |

### B01（严重）：战斗经验发放范围错误

**问题**：`applyBattleExp()` 使用 `getUnitsByFac(winFac)` 取全势力存活部队发放经验，而非仅参战部队。一场小规模遭遇战让全势力所有部队获得经验，大势力升级速度远超小势力。

**修复**：
1. 所有战斗结算函数（`resolveBattle`/`resolveAmbush`/`resolveCampBattle`/`resolveSiegeBattle`）的返回报告中新增 `_atkUnitIds` / `_defUnitIds` 字段，记录实际参战部队ID
2. `applyBattleExp()` 重写：优先使用报告中的unit ID精确筛选参战部队；无ID字段时（旧存档兼容）降级为全势力发放
3. 涉及8个report构造点：resolveBattle return、resolveAmbush return、camp raid成功/失败 return、camp assault return、siege攻方胜/败 return

**改动位置**：L832-864（applyBattleExp）、L20601（resolveBattle return）、L19877（resolveAmbush return）、L20021/20054/20129（resolveCampBattle）、L21441/21476（resolveSiegeBattle）

### B05（中）：连携系统注释与代码不一致

**问题**：注释写"触发则士气+15，CP乘数×1.05"，实际代码为 `sq.morale + 8`（+8）和 `synMult.set(unit, 1.10)`（×1.10）。

**修复**：更新注释为 `士气+8，CP乘数×1.10`（代码值为设计意图，注释过时）。

**改动位置**：L20378

### B07（中）：快进模式不处理阻塞事件

**问题**：快进时 `rollEventsV2()` 照常执行，若产生 `G._pendingEvent`，下一旬 `nextTurn` 入口处被 `if(G._pendingEvent)` 挡住，快进卡死。

**修复**：在快进模式 `_fastForward` 分支开头，检测并自动处理 `G._pendingEvent`——选择第一个非disabled选项，执行效果，设冷却/一次性标记，清除 `_pendingEvent` 和事件弹窗。

**改动位置**：L13469-13482（nextTurn 快进块）

### B09（低）：叛军战斗不在去重集合保护内

**问题**：`_aiBattleProcessedThisTurn` 在 `runAI` 前清空，但叛军战斗检测在之后独立执行，不受去重保护。可能出现同一接触点重复战斗。

**修复**：叛军战斗循环中，检查双方unit ID是否已在 `_aiBattleProcessedThisTurn` 中；战斗发起后将双方ID加入去重集合。

**改动位置**：L13309-13321（nextTurn 叛军战斗块）

### U01（低）：CSS重复定义

**问题**：`.fc-n.nanman{color:var(--nanman)}` 出现两次（复制粘贴遗留）。

**修复**：删除重复的一条。

**改动位置**：L126

### 确认误报详情

| ID | 审查报告声称 | 实际情况 |
|------|------------|---------|
| B02 | `_xiaoyi_atk`等临时属性未清理 | L20559 明确 `delete sq._xiaoyi_atk; delete sq._defBonus`，全部清理 |
| B03 | 黄盖苦肉条件恒true（maxTroops未定义） | 所有squad创建路径（initGame/AI recruit/player recruit/expand）均初始化 `maxTroops` |
| B04 | 韩当从征胜场计数器从未递增 | L20573 `G.genWinCount['韩当'] = (G.genWinCount['韩当']||0) + 1` 在 `resolveBattle` 内递增 |
| B08 | 王朗debuff士气未恢复 | L20564 `_wanglangMoraleRestore.forEach(({sq, restore}) => ...)` 正确恢复 |
| D02 | Set双保险暗示reviver不可靠 | 防御性编程，reviver正常工作，双保险不会造成bug |

### v149 变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | ~28066→~28118 |
| 改动函数 | `applyBattleExp`(重写)、`resolveBattle`(+return字段)、`resolveAmbush`(+return字段)、`resolveCampBattle`(×3 return)、`resolveSiegeBattle`(×2 return)、`processReinforcement`(金消耗路径修正)、`poachGen`(外交惩罚双向化)、`checkDiplo`(附庸漂移独立)、`processFacEconomy`(去冗余_postBuffs) |
| 改动逻辑 | nextTurn快进块(+事件处理)、nextTurn叛军战斗块(+去重) |
| 改动CSS | 删除重复 `.fc-n.nanman` |
| 改动注释 | 连携系统注释修正 |
| 存档版本 | 148→149 |
| 存档兼容 | 完全兼容——新增的 `_atkUnitIds`/`_defUnitIds` 在旧存档中为 undefined，`applyBattleExp` 有降级fallback |
| 侵入性 | 中等——修正了补员零成本严重bug和外交单向更新bug，附庸漂移行为变化 |

---

### v149 第二轮审查追加修复（4项）

#### B01-new（严重）：补员金消耗访问路径错误——零成本无限补员

**问题**：`processReinforcement` 中 `facObj.gold` 应为 `facObj.res.gold`。`G.factions[fac]` 对象上没有直接的 `.gold` 属性（金币存储在 `.res.gold`），导致：
- L23554 guard `facObj.gold <= 0` 读到 `undefined <= 0` = `false`，永不拦截
- L23593 cost check `facObj.gold < goldCost` 读到 `undefined < number` = `false`，永不限制
- L23597 deduction `facObj.gold -= X` 变为 `undefined -= X` = `NaN`，写入无效属性

净效果：**所有部队每旬免费补满兵力**，完全绕过金消耗机制。这是本次审查发现的最严重bug。

**修复**：3处 `facObj.gold` → `facObj.res.gold`（含 `?.` 安全访问）。

**改动位置**：L23554, L23593-23597

#### B03-new（严重）：挖角外交惩罚单向更新

**问题**：`poachGen` 成功后手动更新 `G.diplo["player-src"].rel -= 15`，但未更新反向键 `G.diplo["src-player"]`。外交系统的其他读取点可能读到不同方向的不同值，导致外交状态不一致。

**修复**：将手动单向操作替换为 `addDiplo(G.playerFac, srcFid, -15)`，该函数自动更新双向键。

**改动位置**：L11644

#### B11（低）：附庸关系在自动漂移中永远无法自然脱离

**问题**：`checkDiplo` 漂移逻辑中 `vassal` 与 `ally` 共用同一分支，rel 向85正向漂移（+0.15/旬）。附庸独立检测需 rel<20 才触发，但自动漂移让 rel 持续上升，除非有极大量外交惩罚（约430旬的-0.15才能从85降到20），附庸几乎不可能自然独立。

**修复**：将 `vassal` 从 `ally` 分支中独立出来，附庸漂移改为向50微漂（±0.08/旬）。附庸 rel 自然平衡在50左右，外交事件惩罚（如宗主失城、挖角等）可使 rel 降至20以下触发独立。

**改动位置**：L13164-13166（checkDiplo 漂移块）

**行为变化**：

| 方面 | 旧（v148） | 新（v149） |
|------|-----------|-----------|
| 附庸 rel 漂移方向 | 向85上升 | 向50收敛 |
| 附庸 rel 漂移速率 | +0.15/旬 | ±0.08/旬 |
| 附庸自然独立可能性 | 几乎不可能 | 外交事件累积可触发 |
| 盟友漂移 | 不变（向85，+0.15/旬） | 不变 |

#### A07（低）：`_postBuffs` 冗余计算

**问题**：`calcPostBuffs(fid)` + `getCourtDecreeBuffs(fid)` 在 `nextTurn` 预计算块（L13244-13247）和 `processFacEconomy` 内部（L5401-5407）各执行一次。第二次完全冗余——nextTurn 预计算的结果已缓存在 `G.factions[fid]._postBuffs`。

**修复**：`processFacEconomy` 改为读取已缓存的 `fac._postBuffs`，仅在缓存不存在时（安全网）才调用 `calcPostBuffs`。

**改动位置**：L5401-5407

---

### v149 第三轮审查追加修复（10项）

#### 🔴 严重 Bug（4项）

**严重1：派系影响力除零崩溃**

`processFactionLoyalty` L4280 `const totalInf = inf.total` 在全员阵亡时为0，L4312-4315用作除数产生NaN，传播至忠诚度系统。其他位置（L4461/12935/12979）已有 `|| 1` 保护，此处遗漏。

修复：`inf.total || 1`

**严重2：读档后部队ID冲突**

`_deserializeG` L27012 `Math.max(...G.units.map(u => u.id || 0))` — `unit.id` 格式为 `'u15'`（字符串），`Math.max` 对字符串返回 `NaN`。`_unitIdCounter <= NaN` 为 `false`，计数器不被修正，新建部队与旧部队撞ID。

修复：用 `parseInt(u.id.replace(/\D/g, ''), 10)` 解析数字部分，`reduce` 取最大值。

**严重3：`getUnitTroops` 空指针崩溃**

`unit` 或 `unit.squads` 为 null 时直接 `.reduce()` 抛异常。在战斗结算中间部队被销毁但引用残留时可能触发。

修复：`(unit?.squads||[]).reduce((s,q)=>s+(q.troops||0),0)`

**严重4：`setPolicy` 空指针**

`POLICY.find()` 理论上可能返回 undefined（传入非法id时），L13824直接 `pol.name` 崩溃。

修复：`if(!pol) return` 防御性检查。实际风险低（id来自按钮onclick），但作为健壮性保障。

#### 🟡 中等 Bug（4项）

**中等1：附庸纳贡导致金币负数**

`processFacEconomy` L5409 将金币 `Math.max(0, ...)` 后，L5424 纳贡再次无保护扣除。若金产不足以覆盖军饷+纳贡，金币变负。

修复：引入 `actualTribute = Math.min(tributeGold, Math.max(0, fac.res.gold))`，附庸只交得出的部分，宗主实收=附庸实扣。

**中等2：读档后缓存脏数据**

`_deserializeG` 未清理 `_techEffectCache`、`_supplyCache`。旧存档的缓存数据残留，下旬结算使用过期科技效果和补给地图。

修复：读档后重置 `_techEffectCache={}`、`_techEffectCacheTurn=-1`、`_supplyCache={}`。

**中等3：读档后残留战斗状态**

`_battleReports`、`_pendingBattleConfirms`、`_pendingSiegeArrival`、`_currentBattleReport`、`_currentBattleConfirm` 未在读档时清理。若保存时有未消化的战报，读档后弹出幽灵战报。

修复：读档后全部清空/置null。

**中等4：读档后行军动画锁卡死**

`_marchAnimating` 若在保存时为 `true`（用户在行军动画中保存），读档后永久锁定——下旬按钮disabled，无法操作。

修复：读档后 `_marchAnimating = false`。

#### 🟢 低优先级（2项）

**低1：FOG_VISIBLE 魔法数字**

L9074 `< 2` 硬编码代替 `FOG_VISIBLE` 常量。改为 `< FOG_VISIBLE`。

**低2：版本号不一致**

HTML title 显示 `v1.3.6`，菜单底部显示 `v136`，存档 meta 为 149。统一为 `v1.4.9` / `v149`。

### v149 最终变更摘要（三轮合计）

| 项目 | 变更 |
|------|------|
| 总行数 | ~28066→~28135 |
| 修复总数 | 19项（严重7 / 中7 / 低5） |
| 改动函数 | applyBattleExp、resolveBattle、resolveAmbush、resolveCampBattle×3、resolveSiegeBattle×2、processReinforcement、poachGen、checkDiplo、processFacEconomy、processFactionLoyalty、getUnitTroops、setPolicy、_deserializeG |
| 改动常量/CSS | 删除重复CSS、版本号统一 |
| 存档版本 | 148→149 |
| 存档兼容 | 完全兼容 |

---

### v149 第四轮修复 + 品牌更名

#### 第四轮代码修复（2项）

**#3 `showRepBreakdown` 重复定义（冗余代码）**：L17470和L17517有两个完整定义，第一个是旧版（不用Math.round、措辞用"声誉"而非"信誉"），被第二个覆盖为死代码。已删除旧版，净减45行。

**#4 军师任命弹窗标题未设置**：`openStrategistModal` 设置了 `genericModalBody` 但未设置 `genericModalTitle`，导致显示上次弹窗的残留标题。已添加 `document.getElementById('genericModalTitle').textContent = '任命军师'`。

#### 品牌更名

游戏标题从 "Project Romance / 三國志 / 三國演義 / 三國沙盤 / 三国策略沙盘" 统一更名为 **三国·苍生问策**（英文副标题保留 Project Romance）。

更新位置（8处）：
- HTML `<title>` → `三国·苍生问策 v1.4.9`
- 顶栏 logo → `苍生问策`
- 顶栏副标题 → `三国·苍生问策 v1.4.9`
- 游戏内底栏 → `三国·苍生问策 · v1.4.9`
- 标题画面大字 → `三国·苍生问策`
- 标题画面副标题 → `Project Romance`
- 菜单底部 → `v149 · 三国·苍生问策`
- 势力选择画面 → `苍生问策`

#### 冷审误报记录（第四轮）

| # | 审查报告声称 | 实际情况 |
|---|------------|---------|
| 1 | 版本号v1.36/MVP v1.0残留 | 第三轮已全部修复，当前文件无残留 |
| 2 | `showModal`重复定义导致弹窗错误 | 第一个函数已是`showGenericModal`（非`showModal`），两函数名不同、操作不同DOM、调用方正确 |

#### v149 总计修复统计（四轮）

| 轮次 | 来源 | 确认修复 | 误报 |
|------|------|---------|------|
| 第一轮 | xlsx审查报告（23项） | 5项 | 5项 |
| 第二轮 | 追加审查（5项） | 4项 | 1项(P03) |
| 第三轮 | 冷审（10项） | 10项 | 0项 |
| 第四轮 | 冷审（5项） | 2项 | 2项(#1,#2)，1项搁置(#5触摸) |
| **合计** | **43项审查** | **21项修复** | **8项误报，1项搁置** |

### ⚠️ 审计方法论改进备忘

本轮暴露了"作者自审"的认知偏差问题，总结如下供后续参考：

1. **增量审计必须包含"反模式grep"**：知道正确API（如`addDiplo`、`fac.res.gold`）后，主动搜索所有绕过该API的直接操作
2. **冷审（无context新对话）应每5-10版本做一次**，结果回主对话验证和实施
3. **冷审误报率约20-40%**，需要有context的主对话过滤；但冷审能发现主对话的认知盲区（如`facObj.gold`属性路径错误）
4. **作者对旧代码的隐性信任是最大审计障碍**——"没改过所以没问题"的假设需要被机械式grep打破

---

## v150 Bug修复（7项）

### 改动总览

| Bug# | 问题 | 修复 | 位置 |
|------|------|------|------|
| BUG1 | INIT_POSTS吴国太史慈已在v143移入INACTIVE，开局左将军静默分配失败 | `太史慈`→`黄盖` | L5029 |
| BUG2 | processUnitFood最近城市距离计算有HEX_SIZE偏移，部队坐标减了偏移而城市坐标无偏移 | 删除`-HEX_SIZE` | L18514→18523 |
| BUG3 | _deserializeG遗漏5个模块级缓存清理（士气/领土overlay/叠加层/朝议/单挑） | 追加清理代码 | L26996+ |
| BUG4 | renderLeft粮食腐损率使用旧值`[0.020,0.012,0.008,0.003]`，v136已更新为`[0.050,0.030,0.015,0.005]` | 提取`SPOIL_RATES`常量，两处统一引用 | L5224(常量), L5236(processCityFood), L14236(renderLeft) |
| BUG5 | renderLeft粮食净值未计入官职`_postBuffs.foodProd`和蒋琬1.05倍率 | renderLeft预计算buff并叠加到粮产 | L14224-14239 |
| BUG6 | _statsHistory（const数组）读档时未清空，统计图表混入上一局数据 | `_statsHistory.length=0` | L27002(_deserializeG内) |
| BUG7 | backToTitle()仅清理DOM和缓存版本号，20+个模块级状态未清理 | 追加完整状态清理（战斗/动画/缓存/外交/朝议/统计等） | L27158-27175 |

### 新增常量

| 常量 | 位置 | 说明 |
|------|------|------|
| `SPOIL_RATES` | ~L5224 | `[0.050, 0.030, 0.015, 0.005]` — 粮仓等级0/1/2/3对应腐损率，renderLeft与processCityFood共用 |

### 改动函数

| 函数 | 改动摘要 |
|------|---------|
| `processCityFood` | spoilRate改引用`SPOIL_RATES[granLv]`（行为不变，仅消除硬编码重复） |
| `processUnitFood` | 删除部队坐标的`-HEX_SIZE`偏移，与城市坐标系对齐 |
| `renderLeft` | ①腐损率改用`SPOIL_RATES` ②粮产叠加`_postBuffs.foodProd`和蒋琬1.05倍率 |
| `_deserializeG` | +6项缓存清理：`_deployedGensMoraleCache`/`_ovTerritoryCache`+`_ovTerritoryTurn`/`_activeOverlay`/`window._pendingCourtCouncil`/`_duelChallenger`/`_statsHistory` |
| `backToTitle` | +18行模块级状态清理（与_deserializeG的清理范围对齐+额外的_fastForward/_pendingPeaceOffer/_pendingVassalOffer） |

### 改动数据

| 数据 | 改动 |
|------|------|
| `INIT_POSTS.wu` | `太史慈:左将军` → `黄盖:左将军` |

### 设计要点

1. **SPOIL_RATES提取**：消除processCityFood和renderLeft之间的硬编码重复，从根源防止未来不同步。
2. **_deserializeG与backToTitle清理对齐**：两处均需清理模块级状态，维护同一份清理列表。backToTitle额外清理_fastForward（快进模式UI状态）和外交弹窗offer。
3. **renderLeft粮产buff**：严格复刻processCityFood的buff叠加顺序（先postBuffs再蒋琬），确保显示值=实际结算值。

### 版本号变更

| 位置 | 旧值 | 新值 |
|------|------|------|
| `<title>` L6 | v1.4.9 | v1.5.0 |
| header logo-sub L509 | v1.4.9 | v1.5.0 |
| footer L519 | v1.4.9 | v1.5.0 |
| `__meta.version` (_serializeG) | 149 | 150 |
| 标题画面底部 | v149 | v150 |

*文档更新：v150 · ~28108行 · 561函数 · 7项Bug修复（INIT_POSTS/补给距离/读档缓存×6/腐损率不同步/粮产buff缺失/统计残留/主菜单状态泄漏）+ SPOIL_RATES常量提取*

### 审计追加修复（A1-A5）

| # | 风险 | 修复 | 位置 |
|---|------|------|------|
| A1 | 中 | `showBreakdown`腐损率硬编码→引用`SPOIL_RATES` | L16783 |
| A2 | 中 | `_deserializeG`追加`_fastForward = false`（读档时快进状态残留） | _deserializeG末尾 |
| A3 | 低 | `_deserializeG`追加`_pendingPeaceOffer`/`_pendingVassalOffer`清理（与backToTitle对齐） | _deserializeG末尾 |
| A4 | 低 | `backToTitle`追加`_staticMapCache = ''`（loadFromSlot有清但backToTitle遗漏） | backToTitle |
| A5 | 低 | `backToTitle`追加`_ovBaseCache = null; _ovBaseTurn = -1`（同上） | backToTitle |

**审计方法论**：对全部35个模块级`let`变量与`_deserializeG`/`backToTitle`/`loadFromSlot`三处清理代码做交叉比对，按风险分级处理。

*文档更新：v150 · ~28131行 · 561函数 · 7项Bug修复 + 5项审计追加修复 + SPOIL_RATES常量提取*

### render vs process一致性审计修复（B1-B4）

| # | 严重度 | 修复 | 位置 |
|---|--------|------|------|
| B1 | **高** | `renderLeft`金净补齐4项遗漏：腐败扣金(`calcCityCorruption`)、官职buff(`_postBuffs.goldProd`)、张昭+3%、附庸纳贡(`_tributePaid`) | L14228-14257 |
| B2 | **高** | `renderLeft`木/铁产叠加费祎+5%buff | L14251-14290 |
| B3 | 中 | `_renderCityDetail` netFood叠加`_postBuffs.foodProd`+蒋琬1.05倍率（与renderLeft BUG5同类） | L15482 |
| B4 | 低 | `_renderCityDetail` spoilRate硬编码`[5.0,3.0,1.5,0.5]`→`SPOIL_RATES[granLv]*100` | L15472 |

**审计方法论**：逐字段对比`processFacEconomy`与`renderLeft`的金/木/铁计算链，以及`processCityFood`与`_renderCityDetail`的粮食计算链。发现renderLeft遗漏了全部4种金产modifier和木铁的费祎buff，_renderCityDetail遗漏了粮产的2种buff。

*文档更新：v150 · ~28148行 · 561函数 · 7项Bug修复 + 5项审计(A) + 4项审计(B) + SPOIL_RATES×4处统一*

### 深度审计修复（C1-C3）

| # | 严重度 | 修复 | 影响 |
|---|--------|------|------|
| C1 | **高** | `getCityFoodNet()`叠加`_postBuffs.foodProd`+蒋琬1.05（对齐processCityFood） | **一处改动修16处调用**：AI调粮/叛乱判定/补员/地图颜色/"可撑旬数"全部修正 |
| C2 | 中 | 3处`inf.total`除零加`(inf.total\|\|1)`防护（事件条件函数） | L7064/7137/7342，势力全灭时不再崩溃 |
| C3 | 中 | `showBreakdown` netFood改用`getCityFoodNet()`（已含buff） | 城市粮食tooltip净变化显示修正 |

**附带简化**：`_renderCityDetail`的B3手动buff代码简化为直接调用`getCityFoodNet(city)`，消除重复实现。

**审计方法论**：追踪`getCityProd().food`的所有消费者，发现`getCityFoodNet`→`getCityFoodTurns`这条16处调用链全部缺buff。修复源头函数后下游自动修正。同时对全文件所有除法操作做除零风险扫描。

*文档更新：v150 · ~28149行 · 561函数 · 7+5+4+3=19项修复*

### showFacBreakdown + AI审计修复（D1-D5）

| # | 严重度 | 修复 | 位置 |
|---|--------|------|------|
| D1 | 中 | `showFacBreakdown` 粮食section净值改用`getCityFoodNet`（含buff）+ 显示官职/蒋琬buff行 | L17379+ |
| D2 | 中 | `showFacBreakdown` 金section净值补`goldProd`buff+张昭3%+附庸纳贡扣金+纳贡显示行 | L17402+ |
| D3 | 低 | `showFacBreakdown` 木section叠加费祎+5% + buff显示行 | L17455+ |
| D4 | 低 | `showFacBreakdown` 铁section叠加费祎+5% + buff显示行 | L17466+ |
| D5 | 极低 | `findBestDonor` 死代码fallback清理（`getCityFoodNet ? ...` → 直接调用） | L5870 |

**AI决策审计结论**：`aiDoTransfer`/`checkResupply`/`findBestDonor`均依赖`getCityFoodTurns`→`getCityFoodNet`链条，已通过C1源头修复自动受益。`_aiCalcBudget`的`grossGoldIncome`用裸`getCityProd.gold`做预算floor属保守估计，不导致AI过度消费，判定为可接受。

*文档更新：v150 · ~28171行 · 561函数 · 7+5+4+3+5=24项修复*

---

## v151 势力价值观系统（Ethos）+ 屠城/安民系统

### 设计理念

价值观系统是势力的"气质镜子"——五个维度完全由玩家行为、人事结构、战争选择自然生成，不提供正向数值buff，仅通过立场匹配度联动忠诚、外交等现有系统。核心设计原则：

1. **无正向增益，只有匹配成本**：走任何极端方向都有代价（武将忠诚下降、外交恶化），但没有"最优路线"
2. **渐进漂移为主，事件冲击为辅**：日常漂移缓慢（从中立到"偏XX"需40-100旬），重大事件（称帝、屠城）可一次性大幅偏移
3. **AI势力同等适用**：AI价值观同样动态变化，驱动AI外交偏好和攻城后处置决策

### 五个维度

| 维度 | 负值方向 | 正值方向 | 前端名称 | 核心数据源 |
|------|---------|---------|---------|-----------|
| mandate | 崇汉 | 篡汉 | 天命 | GEN_TAGS.politics占比 + 天子持有 + 宣称/称帝事件 |
| power | 士族共治 | 集权 | 权柄 | calcFactionInfluence士族派系影响力占比 + 官职任免 |
| civil | 仁政 | 暴政 | 文治 | 税率 + 民心均值 + 赈灾/屠城事件 |
| military | 怀柔 | 铁血 | 武略 | GEN_TAGS.combat鹰鸽占比 + 屠城/安民/俘虏处置 |
| strategy | 守成 | 扩张 | 方略 | 城市数变化趋势 + 部队作战/驻守比 + 宣战/结盟行为 |

范围：-100 ~ +100，0为中立。档位：|val|<15中立，15-40偏XX，40-70显著XX，70-100极XX。

### 初始值

| 势力 | 天命 | 权柄 | 文治 | 武略 | 方略 |
|------|------|------|------|------|------|
| 魏 | +15(偏篡汉) | +20(偏集权) | 0 | +10 | +15(偏扩张) |
| 蜀 | -30(偏崇汉) | 0 | +5 | -20(偏怀柔) | +10 |
| 吴 | 0 | -20(偏共治) | 0 | 0 | -20(偏守成) |
| 南蛮 | 0 | 0 | -10 | +15(偏铁血) | +5 |

### 数据结构

```
G.factions[fid].ethos = { mandate, power, civil, military, strategy }  // 五维 -100~100
G.factions[fid]._ethosLog = [{turn, dim, delta, source}, ...]          // 最近30条变化记录
G.factions[fid]._ethosSnap = { cityCount }                             // 方略维度快照
```

### 新增常量（M01区域）

| 常量 | 说明 |
|------|------|
| `ETHOS_INIT` | 四势力初始值 |
| `ETHOS_DIMS` | 五维度key数组 |
| `ETHOS_LABELS` | 各维度正负方向中文标签+图标 |
| `ETHOS_DIM_NAMES` | 各维度前端名称（天命/权柄/文治/武略/方略） |
| `SIEGE_AFTERMATH` | 攻城后处置三选项（安民/劫掠/屠城）的数值定义 |

### 新增函数

| 函数 | 位置 | 说明 |
|------|------|------|
| `_ethosTierLabel(val, dim)` | M01 | 数值→档位文字（"偏崇汉"等） |
| `_applyEthosDrift(fid, dim, delta, source)` | M04/M11间 | 内部：应用漂移+记录日志 |
| `applyEthosShock(fid, dim, delta, source)` | 同上 | 公开：事件冲击+通知 |
| `_ethosDistance(fid1, fid2)` | 同上 | 两势力价值观距离（天命+方略，0-100） |
| `processFacEthos(fid)` | 同上 | **回合结算**：五维日常漂移 |
| `_applySiegeAftermath(cityId, atkFac, choiceId)` | 同上 | 攻城后处置结算（金/人口/民心/豪族/信誉/价值观） |
| `showSiegeAftermathChoice(cityId, atkFac)` | 同上 | 攻城后处置弹窗UI |
| `_onSiegeAftermath(cityId, atkFac, choiceId)` | 同上 | 弹窗回调 |
| `renderEthosTab(c)` | M15 | 价值观Tab：五轴条+势力对比+变化日志 |

### 改动函数

| 函数 | 改动 |
|------|------|
| `nextTurn` | +`processFacEthos(fid)`调用，位于processGentry之后 |
| `doEnthrone` | +`applyEthosShock(fid,'mandate',28,'称帝')` |
| `diploWar`（玩家） | +strategy+6, ±mandate按宣称强度 |
| `aiDoDiplo`（AI宣战） | +同上逻辑 |
| `diploAlly` | +strategy-2 |
| `appointGenPost` | +power±2按origin(gentry→共治, humble/clan→集权) |
| `dismissGenPost` | +power±1~3按origin |
| `resolveSiegeBattle` | +strategy+4（攻克城池），+AI自动处置，+`_siegeAftermathCityId`返回字段 |
| `closeBattleModal` | +攻城胜利后弹处置选择窗（玩家） |
| `calcLoyaltyDelta` | +⑨价值观匹配项（天命×politics + 武略×combat） |
| `checkDiplo` | +`_ethosDistance`修正友好度漂移（距离>50→-0.10/旬，<15→+0.05/旬） |
| `renderRight` | +ethos路由 |
| `updateTabs` | 9→10个tab |
| `initGame` | +ethos初始化 |
| `_deserializeG` | +旧存档ethos兼容（默认ETHOS_INIT值） |
| `_serializeG` | version 150→151 |
| `runIntegrityAudit` | +价值观审计组（5维范围校验） |

### 屠城/安民系统

攻城胜利后弹出三选一弹窗（玩家），AI根据military ethos自动选择：

| 选项 | 金钱收益 | 民心 | 人口 | 豪族 | 信誉 | 武略冲击 | 文治冲击 |
|------|---------|------|------|------|------|---------|---------|
| 安民 | 0 | +10 | ×1.0 | +5 | 0 | -6(怀柔) | -3(仁政) |
| 劫掠 | 城旬产金×0.4×12 | -20 | ×0.9 | -15 | -3 | +8(铁血) | +5(暴政) |
| 屠城 | 城旬产金×0.8×12 | -50 | ×0.7 | -40 | -10 | +18(铁血) | +12(暴政) |

AI决策：military > 60 → 屠城，> 30 → 劫掠，否则安民。

弹窗触发时机：closeBattleModal → 检测`_siegeAftermathCityId` → showSiegeAftermathChoice → 处置完成后流转至俘虏/朝议。

### 忠诚联动公式

```
calcLoyaltyDelta新增⑨项：
  崇汉武将(uniHan) + 篡汉势力(mandate>0) → -mandate/150 per旬
  崇汉武将(uniHan) + 崇汉势力(mandate<0) → +|mandate|/300 per旬（正向但弱）
  枭雄武将(warlord) + 崇汉势力(mandate<0) → -|mandate|/150 per旬
  鸽派武将(dove) + 铁血势力(military>20) → -(military-20)/200 per旬
  鹰派武将(hawk) + 怀柔势力(military<-20) → -(|military|-20)/200 per旬

极端情况下（mandate=100, uniHan武将）≈ -0.67/旬，显著但不压倒性
```

### 外交联动

checkDiplo每旬漂移中增加价值观距离修正：
- `_ethosDistance > 50`（天命+方略两维均值）：友好度每旬额外-0.10
- `_ethosDistance > 30`：-0.05
- `_ethosDistance < 15`：+0.05

效果：价值观相近的势力自然亲近，对立的势力自然疏远。

### 存档版本

150→151，旧存档自动补充ETHOS_INIT默认值。

*文档更新：v151 · ~28552行 · 570函数(+9) · 价值观系统5维度+屠城安民3选项+忠诚联动+外交联动+价值观Tab*

---

## v152 价值观深化：事件/朝议/AI三方向接入

**核心目标**：将价值观从"展示面板"(v151完成度~40%)升级为"串联所有系统的中枢"(~70%)。三个方向：事件系统写入ethos、朝议联动ethos、AI行为读取ethos。

### 一、事件系统接入ethos（8个现有事件 + 4个新事件）

#### 现有事件增加ethos冲击

在每个事件的`effect()`末尾追加`applyEthosShock()`调用，无新函数、无新字段，纯增量。

| 事件 | 选项 | ethos冲击 |
|------|------|-----------|
| drought 旱灾 | ①开仓赈济 | civil -3(仁政) |
| | ②强征余粮 | civil +4(暴政), power +2(集权) |
| | ③听天由命 | civil +2(暴政) |
| plague 疫病 | ①派医赈疫 | civil -3(仁政) |
| | ②封城隔断 | military +3(铁血), civil +2(暴政) |
| | ③不管 | civil +3(暴政) |
| flood 水患 | ①征民修堤 | civil -3(仁政) |
| | ②迁民避水 | civil +3(暴政), power +2(集权) |
| | ③听天由命 | civil +2(暴政) |
| scholar_visit 名士过境 | ①请其讲学 | civil -2(仁政), power -1(共治) |
| | ②请其著书 | civil -2(仁政) |
| refugee_influx 流民涌入 | ①接纳安置 | civil -3(仁政), strategy +1(扩张) |
| | ②拒之门外 | civil +2(暴政) |
| | ③择壮编军 | military +3(铁血) |
| propaganda_war 檄文声讨 | ①成功 | strategy +3(扩张), mandate +2 |
| | ②拒绝 | strategy -1(守成) |
| reckless_trouble 莽夫闯祸 | ①严惩赔偿 | civil -2(仁政/法治) |
| | ②包庇压下 | power +2(集权), civil +2(暴政) |
| gen_overpowered 功高震主 | ①安抚/加封 | power -3(共治) |
| | ②召回述职 | power +4(集权) |

#### 新增4个价值观驱动事件（H类）

| 事件ID | 类型 | 条件 | 核心机制 |
|--------|------|------|---------|
| `quanjin_biao` 劝进表 | story/oneTime | mandate≥40 + warlord武将 + 未称帝 | 接受→mandate+10/15(有天子+15), warlord+3, 尊汉-4；拒绝→mandate-3 |
| `return_emperor` 还政天子 | story | 持有天子 + mandate≥25 + uniHan武将 | 做姿态→mandate-10, 信誉+5, 尊汉+4；拒绝→mandate+3, 尊汉-3 |
| `anti_corruption` 整肃吏治 | daily | 腐败>15%金收入 + pol≥80文官 | 两条路线(严刑/士族)均减腐败5%持续9旬，但power方向相反 |
| `juxiaolian` 举孝廉 | daily | ≥4城 + ≥3士族武将 | 准奏→下次在野+2人,士族+3,power-2；驳回→士族-2,power+1 |

**劝进表设计要点**：
- 不自动称帝，只推mandate（铺路）。AI势力通过后等12旬称帝评估自然过线
- 持有天子时加码（mandate+15而非+10，额外信誉-5）
- 三家（魏蜀吴）都能触发，但魏因mandate天然高触发最早

**还政天子设计要点**：
- 只做"还政姿态"，不交出天子（太重大不适合事件决定）
- 和劝进表形成拉锯：天命轴上一推一拉

**整肃吏治设计要点**：
- 新增`corruptReduce` buffKey，在`calcCityCorruption`中读取（decree临时减腐5%）
- 两条路线都解决腐败，但ethos方向相反：严刑→集权，士族→共治

**举孝廉设计要点**：
- 新增`G._juxiaolianBonus`字段，`refreshWildPool`中读取消费
- 和朝议中已有的"招贤令"不重复（招贤令是概率buff，举孝廉是数量buff）

### 二、朝议系统联动ethos

在`_applyCourtDecisions`中，提案通过时根据提案ID施加ethos微调：

| 提案 | 通过时ethos冲击 |
|------|---------------|
| 征兵令 | military +2, strategy +1 |
| 扩军备战 | military +2 |
| 充员令 | military +1 |
| 军防工程 | strategy -1(守成) |
| 劝农令 | civil -2(仁政) |
| 兴商令 | civil -1(仁政) |
| 安民策 | civil -2(仁政) |
| 招贤令 | power -1(共治) |

### 三、AI行为读取ethos

#### 3.1 AI宣战意愿（aiDoDiplo）

```
原公式：aggrWill = baseAggrWill * (diploAggro / 0.5)
v152公式：aggrWill = (baseAggrWill + strategyBoost + eDistBoost) * (diploAggro / 0.5)
  strategyBoost = (ethos.strategy / 100) * 0.15   // ±15%调幅
  eDistBoost = ethosDistance > 50 ? 0.10 : 0       // 价值观对立+10%
```

效果：扩张型势力更好战；价值观对立的势力更容易开战。

#### 3.2 AI求和门槛（aiDoDiplo）

```
原公式：peaceThreshold = 0.80 + (diploAggro - 0.5) * 0.30
v152公式：peaceThreshold += (ethos.strategy / 100) * 0.08  // ±8%调幅
```

效果：扩张型势力更不容易接受求和。

#### 3.3 AI称帝评估（aiConsiderEnthrone）

```
mandate < 30 → 拒绝称帝（崇汉AI不称帝）
mandate ≥ 60 → 称帝概率+15%，城市优势要求降低2（不需要是最强的也敢称帝）
```

效果：曹操mandate天然高→更早称帝；刘备mandate天然低→更晚称帝或不称帝。

### 四、改动函数完整清单

| 函数/位置 | 改动摘要 |
|---------|---------|
| EVENT_DEFS drought/plague/flood | 3灾害事件各选项+ethos冲击 |
| EVENT_DEFS scholar_visit | 名士2选项+civil/power冲击 |
| EVENT_DEFS refugee_influx | 流民3选项+civil/military/strategy冲击 |
| EVENT_DEFS propaganda_war | 檄文成功/拒绝+strategy/mandate冲击 |
| EVENT_DEFS reckless_trouble | 莽夫2选项+civil/power冲击 |
| EVENT_DEFS gen_overpowered | 功高4选项中2个+power冲击 |
| EVENT_DEFS (新增4事件) | H1劝进/H2还政/H3整肃/H4举孝廉 |
| `calcCityCorruption` | +corruptReduce decree buff读取 |
| `refreshWildPool` | +`_juxiaolianBonus`读取消费 |
| `_applyCourtDecisions` | +8个提案通过时ethos微调 |
| `aiDoDiplo`(宣战块) | +strategyBoost + eDistBoost |
| `aiDoDiplo`(求和块) | +stratPeaceBonus |
| `aiConsiderEnthrone` | +mandate<30拒绝, ≥60加速 |
| 版本号(5处) | v1.5.1→v1.5.2, 序列化151→152 |

### 五、新增数据字段

| 字段 | 位置 | 说明 |
|------|------|------|
| `G._juxiaolianBonus` | G对象顶层 | 举孝廉事件bonus，refreshWildPool消费 |
| `corruptReduce` buffKey | courtDecrees数组内 | 整肃吏治临时减腐buff |

### 存档版本

151→152，无新必需字段，旧存档完全兼容（`_juxiaolianBonus`和`corruptReduce`缺失时安全降级）。

### applyEthosShock调用统计

v151: 17处 → v152: 56处（+39处），覆盖事件/朝议/外交/AI四大模块。

*文档更新：v152 · ~28900行 · 574函数(+4新事件) · 价值观深化(事件12写入+朝议8联动+AI3读取)+整肃吏治+劝进表+还政天子+举孝廉*

### 模拟测试后追加修复（2项）

| 改动 | 说明 |
|------|------|
| `quanjin_biao` condition | mandate门槛 ≥40 → **≥20**（让蜀国等崇汉势力也能触发劝进） |
| `quanjin_biao` aiChoose | AI接受门槛 ≥55 → **≥35** |
| `doEnthrone` 第三方循环 | +`applyEthosShock(other, 'mandate', 12, '称帝·汉统动摇')`——一方称帝后所有其他势力mandate+12，模拟汉室正统性崩塌连锁效应 |

**设计意图**：曹丕称帝(mandate+12全场)→蜀国从-30升到-18→加上宣战/事件推动→劝进表触发(≥20)→刘备称帝→孙权mandate再+12→最终也称帝。符合历史221-229年三家先后称帝的节奏。

### 设计哲学备忘

**价值观系统定位：重要的添头，不是主菜。**

- 核心游戏循环是传统SLG的内政军事扩张，玩家主导权不可侵犯
- ethos不阻止任何玩家操作（mandate再低也能手动称帝，strategy再守成也能宣战）
- 派系/ethos/经济人口等constraint可以拖后腿，但不能拉着玩家走
- 感知层靠事件（弹出→选择→继续打仗），不靠系统约束（弹窗警告/操作锁定）
- 对AI来说ethos是自动身份证（驱动宣战/求和/称帝风格），对玩家来说ethos是事后发现的势力画像

### 后续方向建议

1. **现有20个未接ethos的事件**可逐步补上applyEthosShock（纯增量，无风险）
2. **新事件设计**优先考虑ethos驱动条件（如：military>50时触发"穷兵黩武"事件，civil<-50时触发"太平盛世"事件）
3. **不建议**加ethos对玩家操作的硬性约束（如"mandate<X不能称帝"）
4. AI外交日志可标注ethos影响原因（如"因价值观对立宣战"），增强感知但不加机制

### applyEthosShock最终统计

v151: 17处 → v152: 57处（+40处），覆盖：事件选项(31) + 朝议通过(7) + 外交/称帝(5) + AI逻辑(3读取点) + 称帝连锁(1)

---

## v153 Bugfix + 水淹围城事件 + AI诊断日志

### 1. 城市颜色当旬不渲染修复（Bug1）

**问题**：部队行军进入unexplored区域后，敌城进入视野，迷雾正确揭开但城市图标颜色（势力色）不刷新，要等到下旬才显示。

**根因**：`_execInstantMarch` 逐格行军中只调了 `invalidateFogCache()`（递增 `_fogCacheVersion`），没调 `invalidateCityCache()`（递增 `_cityCacheVersion`）。城市图标SVG有独立缓存（`_citySvgCache` / `_cityCacheVersion`），`renderMap()` 增量路径调 `_getCitySvgCache()` 时命中旧缓存，城市图标颜色不刷新。

**修复（2处，各1行）**：

| # | 位置 | 修复 |
|---|------|------|
| 1 | `_execInstantMarch` 逐格循环中 `invalidateFogCache()` 后（~行25555） | +`invalidateCityCache()` |
| 2 | `_execInstantMarch` 末尾 `invalidateFogCache()` 后（~行25642） | +`invalidateCityCache()` |

### 2. 水淹围城事件（flood_siege）

**历史依据**：关羽水淹七军（樊城/襄阳）、曹操水淹下邳（吕布）。

| 项目 | 值 |
|------|---|
| ID | `flood_siege` |
| 分类 | `military` |
| 适用 | 玩家+AI（`playerOnly:false`） |
| 冷却 | 24旬 |
| 触发条件 | 非叛军 + 夏/秋季（雨季） + 己方有部队围城中 + 目标城市hex相邻有水域hex |
| 基础概率 | 20% |
| 历史城市 | 下邳(`xiapi`)、襄阳(`xiangyang`)概率提升至35% |

**选项**：

| 选项 | 效果 |
|------|------|
| ① 决水淹城 | `siegeDecay` +0.40（cap 1.0），城市人口-10%，城市民心-15，信誉-3，价值观civil +5（暴政方向） |
| ② 不用水攻 | 无效果，继续正常围城 |

**AI选择**：ethos.civil < -30（仁政路线）选②，否则选① |

**水域检测**：遍历城市hex的6个hexNeighbors，检查 `WATER_TERRAINS.has(HEX_TERRAIN[key])`

### 3. AI鸽派halt诊断日志（Bug3排查）

**问题描述**：魏军AI对巴中/梓潼方向有目标但部队不实际移动。

**排查结论**：
- `hexAstar` 不会被阻断（汉中到梓潼/巴中之间无城市hex）
- AI行军路线已在v111隐藏（`unit.fac === G.playerFac` 条件过滤），玩家看不到AI路径线
- 最可能原因：鹰鸽判断导致halt（附近有蜀军守军，评估胜率不足）或寻路确实失败

**诊断日志（2处）**：

| # | 位置 | 日志格式 | 用途 |
|---|------|---------|------|
| 1 | `aiExecuteOrders` 步骤1 shouldHalt分支（~行10496） | `🕊 [AI-fid] 将名部 鸽派halt（WR=XX%，敌N支 友M支）目标城名` | 确认是否因鸽派判定停下 |
| 2 | `aiExecuteOrders` 步骤1 hexAstar返回null分支（~行10572） | `❌ [AI-fid] 将名部 → 城名 寻路失败` | 确认是否寻路不可达 |

**使用方法**：快进50-100旬后，在日志中搜"🕊"或"❌"+"巴中"/"梓潼"即可定位卡点。

### v153 项目快照

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v153.html |
| 总行数 | ~29008行（v152基础+68行） |
| 新增事件 | 1个（flood_siege 水淹围城） |
| Bugfix | 1个（城市图标缓存不刷新） |
| 诊断日志 | 已清除（v153交付前移除）（AI鸽派halt + 寻路失败） |


### 3补充. AI部队卡在garrison+残留hexPath的根因修复

**问题**：快进模式下，AI部队被分配进攻目标（如许昌），但部队在己方城市（如新野）100旬不动。地图上可见一条指向旧目标（如汉中）的行军路径线。

**根因**：旬末校正（nextTurn ~行13968）将落在己方城市hex上的部队强制设为`garrison`，但**不清hexPath**（设计意图：保留路径下旬继续走）。当`aiSelectTargets`下旬重新评估给该部队分配了新目标（许昌），`aiExecuteOrders`步骤1检查`(!u.hexPath || u.hexPath.length === 0)` → hexPath非空 → **跳过**。步骤2只处理`halt`状态 → 也跳过。部队永远卡在garrison+旧hexPath状态，两个步骤都处理不了。

**修复**：在步骤1的filter之前，新增清理逻辑——`garrison`状态的attack部队如果hexPath终点不在当前`_aiTarget`附近（距离>2），则清空hexPath和movePath，允许步骤1重新寻路。

**修复位置**：`aiExecuteOrders` 步骤1之前（~行10427），新增12行清理代码。

**路径线显示问题**：玩家选魏国时魏军即玩家方（`unit.fac === G.playerFac`），快进期间AI托管的魏军hexPath会被`renderUnitsOnMap`渲染出来，这是正常行为。修复残留hexPath后路径线也会消失。


### 4. 价值观描述文言化

**问题**：ethos走向极端时，描述为"显著暴政""极铁血"等，不够中文化。

**修复**：`_ethosTierLabel` 重写，5维度×2方向×3档位=30个独立的四字成语/文言描述，中立="不偏不倚"。

| 维度 | 轻度(neg/pos) | 中度(neg/pos) | 极端(neg/pos) |
|------|---------------|---------------|---------------|
| 天命 | 心系汉室 / 天命有归 | 矢志兴汉 / 代汉自立 | 汉贼不两立 / 改朝换代 |
| 权柄 | 兼听则明 / 乾纲独断 | 与士共治 / 大权在握 | 君弱臣强 / 唯我独尊 |
| 文治 | 爱民如子 / 严刑峻法 | 仁德布四方 / 苛政猛于虎 | 圣主明君 / 残暴不仁 |
| 武略 | 以德服人 / 厉兵秣马 | 偃武修文 / 穷兵黩武 | 刀枪入库 / 嗜杀成性 |
| 方略 | 固守疆土 / 开疆拓土 | 韬光养晦 / 鲸吞蚕食 | 闭关锁国 / 席卷天下 |

势力距离标签同步改为：志同道合 / 和而不同 / 貌合神离 / 道不同不相为谋。

### v153 完整改动汇总

| # | 改动 | 类型 | 行数 |
|---|------|------|------|
| 1 | `_execInstantMarch` 两处加 `invalidateCityCache()` | Bugfix | +2 |
| 2 | 水淹围城事件 `flood_siege` | 新功能 | +57 |
| 3a | AI鸽派halt诊断（已清除） | 诊断 | 0 |
| 3b | AI寻路失败诊断（已清除） | 诊断 | 0 |
| 3c | AI目标分配诊断（已清除） | 诊断 | 0 |
| 3d | garrison+残留hexPath卡死修复 | Bugfix | +12 |
| 4 | `_ethosTierLabel` 文言化30条描述 | 润色 | +21 |
| 5 | 势力距离标签文言化 | 润色 | +1 |


---

## v154 冷审修复轮 — 基于代码深审报告的系统性修复

### 审查来源

基于 `code_review_v153_deep.md` 深审报告（覆盖战斗公式、AI决策、经济流转、存档序列化、资源安全、内存管理），修复全部3项高风险 + 4项中风险问题。

### 修复内容

#### 🔴 H3 — GEN_MAP存档脱节（确认BUG，数据丢失）

**问题**：`addStatExp` 修改 `GEN_MAP` 中原始对象的属性（com/war/int/pol），但 `_deserializeG` 只恢复 `G.generals` 中的拷贝。读档后 `GEN_MAP` 仍是初始值，战斗系统（`calcUnitATK` 等）通过 `GEN_MAP[sq.genName]` 读属性，导致**所有武将属性成长效果在读档后丢失**。

**修复**：`_deserializeG` 末尾新增同步逻辑（~10行）：

```javascript
// ★ v154fix H3
ALL_FACS.forEach(fid => {
  (G.generals[fid]||[]).forEach(gen => {
    if(gen.name && GEN_MAP[gen.name]) Object.assign(GEN_MAP[gen.name], gen);
  });
});
(G.genPendingPool||[]).forEach(gen => {
  if(gen.name && GEN_MAP[gen.name]) Object.assign(GEN_MAP[gen.name], gen);
});
```

**覆盖范围**：所有在役武将 + 延迟出场池武将（genPendingPool）。

#### 🔴 H2 — 资源负数保护（20+处无保护扣减）

**问题**：事件系统（25+处）、科技扣费（1处）、材料扣费（1处）直接 `res[key] -= amount`，无 `Math.max(0,...)` 兜底。虽有前置 condition 检查，但同旬多次扣减存在竞态风险，可导致资源为负，审计报错。

**修复**：

| 项 | 改动 |
|---|------|
| 新增工具函数 | `safeSub(res, key, amount)` — `res[key] = Math.max(0, (res[key]\|\|0) - amount)` |
| `deductMat` | 内部改用 `safeSub`（1处） |
| `startResearch` | 科技扣费改用 `safeSub`（1处） |
| 事件系统 | 全部 `res.gold -= N` 改为 `safeSub(res, 'gold', N)`（49处） |

**总计**：51处扣减全部受 `safeSub` 保护，资源永远 ≥ 0。

#### 🔴 H1 — A*寻路二叉堆优化

**问题**：`hexAstar` 用 `Array.sort() + shift()` 管理open列表，每步 O(n log n + n)，总体 O(n² log n)。102×68=6936 hex地图上，AI每旬多次调用寻路，是全局最大性能瓶颈。

**修复**：新增 `_MinHeap` class（33行，数组实现二叉最小堆），替换 hexAstar 中的 open 列表：

| 操作 | 旧 | 新 |
|------|-----|-----|
| 初始化 | `const open = [...]` | `const open = new _MinHeap()` |
| 插入 | `open.push(node)` | `open.push(node)` — O(log n) |
| 取最小 | `open.sort(); open.shift()` — O(n log n + n) | `open.pop()` — O(log n) |
| 判空 | `open.length` | `open.length` |

**预期收益**：AI密集旬寻路性能提升 3-10×。hexAstar 核心逻辑（邻居遍历、城市穿越规则、启发式、路径回溯）完全不变。

#### 🟡 M8 — 版本号统一

`_serializeG` 中 `version: 152` → `version: 154`。

#### 🟡 M9 — AI崩溃可视化警告

**问题**：6个AI try-catch块只输出 `console.error`，玩家无法感知AI模块崩溃。

**修复**：每个catch块新增 `log(\`⚠️ AI异常: ${FAC[fid]?.name||fid} ${模块名}\`, 'warn')`，覆盖：

| 模块 | 日志标签 |
|------|---------|
| aiDoAppointments | 官职任命模块 |
| aiDefendResponse | 防守响应模块 |
| aiSelectTargets | 战略决策模块 |
| aiExecuteOrders | 行军执行模块 |
| aiDefenderDecision | 守城决策模块 |
| aiDoSiege | 攻城决策模块 |

#### 🟡 M10 — 序列化排除运行时缓存

**问题**：`_serializeG` 的 `JSON.stringify` 将 G 上所有字段（含运行时缓存）序列化到存档，导致存档体积膨胀+旧缓存字段可能在新版本中冲突。

**修复**：replacer 中新增 `_CACHE_KEYS` 白名单（`_corruptRate`/`_corruptLoss`/`_salaryDebt`/`_deployedGensCache`/`_deployedGensTurn`），匹配的key返回 `undefined` 跳过序列化。

**保留不排除**：`_tech`、`_eventFired`、`_ethosLog`、`_ethosSnap`、`_postBuffs`、`_pendingEvent`、`_pendingPrisoners` 等游戏状态字段。

#### 🟡 M3 — 事件监听器清理

**问题**：`document.addEventListener('mousemove/mouseup/keydown')` 使用匿名函数，`backToTitle()` 不清理。反复 开始→返回标题→开始 会累积空执行监听器。

**修复**：

| 改动 | 说明 |
|------|------|
| mousemove | 匿名→具名 `_onDocMouseMove`，引用存 `window._mapDocMouseMove` |
| mouseup | 匿名→具名 `_onDocMouseUp`，引用存 `window._mapDocMouseUp` |
| keydown | 匿名→具名 `_onDocKeydown`（模块级函数） |
| `backToTitle()` | 头部新增3行 `removeEventListener` 清理 |

### v154 变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v153.html → project_romance_v154.html |
| 标题 | v1.5.2 → v1.5.4 |
| 存档版本 | 152 → 154 |
| 总行数 | 29008 → ~29064（+56行） |
| 新增函数 | `safeSub`（工具）、`_MinHeap` class、`_onDocMouseMove`/`_onDocMouseUp`/`_onDocKeydown`（具名handler） |
| 改动函数 | `hexAstar`（heap替换）、`_serializeG`（缓存排除+版本号）、`_deserializeG`（GEN_MAP同步）、`backToTitle`（listener清理）、`deductMat`（safeSub）、`startResearch`（safeSub）、`runAI` 6处catch块（+log） |
| 批量替换 | 49处 `res.RESOURCE -= N` → `safeSub(res, 'RESOURCE', N)` |
| 侵入性 | 低——无核心逻辑变更，纯修复+防护+性能优化 |
| 存档兼容 | 完全向后兼容（旧存档可正常加载，H3同步确保属性不丢） |

### 暂缓问题（下轮处理）

| 问题 | 严重度 | 说明 |
|------|--------|------|
| M1 战斗随机范围 | 🟡 | `rand(0.50,1.50)` 方差大，1.5倍碾压局约15%翻盘。需确认是否设计意图 |
| M2 领地缓存时序 | 🟡 | 攻城同旬补给判定可能读到上旬领地图。影响极小 |
| M5 扣粮走补给线 | 🟡 | `processUnitFood` 用欧几里得距离找最近城扣粮，应改用补给BFS归属城 |
| M6 战斗后处理提取 | 🟡 | `resolveCampBattle`/`resolveAmbush` 与主战斗后处理代码重复，需提取公共函数 |
| M7 PRNG可复现 | 🟡 | 117处 `Math.random()` 无法确定性重放 |

---

## v155 冷审修复轮2 — GEN_MAP引用污染根治 + 数据安全 + 性能缓存

### 审查来源

基于 `code_review_v154_round2.md` 第二轮深审报告，聚焦 GEN_MAP 共享引用链、数据突变、弹窗链健壮性、经济系统数据安全。

### 修复内容

#### 🔴 P0 — GEN_MAP 共享引用污染静态定义（根治）

**问题全貌**：

```
GENS_FULL (静态定义) ──ref──→ ALL_GENS ──ref──→ GEN_MAP (查表)
       │                                              │
       │ {...g} 浅拷贝                          addStatExp 直接修改 ← ⚠
       ▼                                              
G.generals[fid] (游戏运行时)
```

`GEN_MAP` 直接引用 `GENS_FULL` 中的原始对象。`addStatExp`（行950）和 `addAptExp`（行981）通过 `GEN_MAP[genName]` 直接修改武将属性，污染的是**静态定义数据**。导致：
1. "再战天下"时上局属性成长残留（`backToTitle` 不重置 `GENS_FULL`）
2. `G.generals` 中的浅拷贝与 `GEN_MAP` 是两套独立数据——存档保存的是 `G.generals`（初始值），战斗读的是 `GEN_MAP`（成长后值）
3. 浅拷贝 `{...g}` 不拷贝 `apt` 嵌套对象——`addAptExp` 修改 `gen.apt[key]` 同样污染原始定义

**v154 的 H3 修复**（`Object.assign(GEN_MAP[gen.name], gen)`）只是读档后的补丁，未解决根因。

**v155 根治方案**：

| 改动 | 说明 |
|------|------|
| `const GEN_MAP` → `let GEN_MAP` | 允许重建 |
| 新增 `_deepCloneGen(g)` | `{...g, apt: g.apt ? {...g.apt} : undefined}` — 深拷贝含apt |
| 新增 `_rebuildGEN_MAP()` | 重建GEN_MAP指向G.generals中的活跃对象；INACTIVE保留原始引用；未被招募的WILD_GENS用原始引用 |
| `initGame` | `{...g}` → `_deepCloneGen(g)`（含genPendingPool），末尾调用 `_rebuildGEN_MAP()` |
| `_deserializeG` | 替换v154的Object.assign方案为 `_rebuildGEN_MAP()` |
| 8处 `G.generals[fid].push({...gen})` | 全部改为 `_deepCloneGen(gen)` + `GEN_MAP[name] = cloned` |

**改动位置汇总**：

| 位置 | 场景 |
|------|------|
| initGame GENS_FULL遍历 | 开局武将初始化（2处：immediate + pendingPool） |
| _deserializeG 末尾 | 读档后重建 |
| `_doRecruitWild` | 在野武将招募 |
| `_doPoachGen` | 挖角武将加入 |
| 事件系统武将加入 | B4类事件推荐武将 |
| 延迟出场到达 | genPendingPool到期加入 |
| 俘虏招降 | 战斗俘虏加入 |
| 俘虏释放回归 | 释放后回原势力 |
| 玩家手动招募 | 挖角确认 |

**数据流修复后**：

```
GENS_FULL (静态定义) ──deepClone──→ G.generals[fid] (游戏运行时)
                                          │
                                    _rebuildGEN_MAP()
                                          ▼
                                     GEN_MAP (查表) ──→ addStatExp/addAptExp 修改
                                                         ↑ 修改的是G.generals中的实例
                                                         ↑ GENS_FULL不受影响
                                                         ↑ 存档序列化G.generals = 成长后值 ✓
```

#### 🟡 P1 — 调粮到达检查城归属

**问题**：`processTransfers` 调粮到达后直接 `dest.storage += t.amount`，不检查城市是否已易手。运粮途中目标城被攻占时，粮食会送给敌方。

**修复**：
- transfer对象新增 `fac` 字段（创建时记录发起方势力）
- `processTransfers` 到达时检查 `dest.fac === _tFac`，不匹配则粮食散失+日志提示
- 旧存档兼容：`_tFac = t.fac || G.cities[t.from]?.fac`

#### 🟡 P1 — calcFactionInfluence 旬级缓存

**问题**：该函数遍历全部武将计算派系影响力，一旬被调用10+次（processFactionLoyalty/processFacEthos/UI tooltip等），无缓存。

**修复**：照 `_techEffectCache` 模式，新增 `_facInfluenceCache` + `_facInfluenceCacheTurn`，同旬内命中缓存直接返回。

#### 🟡 P1 — aiDoBuild 统一 safeSub

**问题**：`aiDoBuild` 资源扣减用裸减法（行5843），风格与全局 `safeSub` 不一致。

**修复**：改为 `safeSub(fac.res, r, amt)`，1处。

#### 🟡 P1 — 弹窗链 try-catch 兜底

**问题**：`nextTurn` 末尾的弹窗链（战报确认→战报详情→和谈→附庸→朝议）通过 `setTimeout` 串联，任何回调异常会断裂整条链，后续弹窗永久丢失。

**修复**：5个 `setTimeout` 回调全部包裹 `try{...}catch(e){console.error(...)}`。同时 peace/vassal offer 在 `setTimeout` 前捕获到闭包变量（避免 `null` 后读取）。

### 冷审误报确认

| 问题 | 结论 |
|------|------|
| 2.7 `_commonEnemyDiploThisTurn` 未清理 | **误报** — 行13931已有 `G._commonEnemyDiploThisTurn = {};` 在nextTurn开头 |
| 1.3 外交双向初始化 | **非BUG** — 当前逻辑正确，`suzerain`字段双向一致 |

### v155 变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v154.html → project_romance_v155.html |
| 标题 | v1.5.4 → v1.5.5 |
| 存档版本 | 154 → 155 |
| 总行数 | 29068 → 29090（+22行） |
| 新增函数 | `_deepCloneGen`（工具）、`_rebuildGEN_MAP`（GEN_MAP重建） |
| 新增变量 | `_facInfluenceCache` / `_facInfluenceCacheTurn`（旬级缓存） |
| 改动函数 | `initGame`（深拷贝+重建）、`_deserializeG`（重建替代Object.assign）、`processTransfers`（归属校验）、`calcFactionInfluence`（缓存）、`aiDoBuild`（safeSub）、`nextTurn`末尾弹窗链（try-catch） |
| 批量替换 | 8处 `push({...gen})` → `_deepCloneGen` + GEN_MAP同步 |
| 侵入性 | 中等——GEN_MAP从const改为let并重建，但对外接口不变（仍通过GEN_MAP[name]查表） |
| 存档兼容 | 完全向后兼容（transfer对象新增fac字段有fallback） |

### 暂缓问题（下轮处理）

| 问题 | 来源 | 说明 |
|------|------|------|
| 征兵费用公式重复4处 | P2 2.6 | 提取 `calcRecruitGoldCost` 统一调用 |
| `_getCityRegion` 替换为 `CITY_TO_REGION` | P2 3.5 | 已有反向映射，直接查表 |
| billetPool id碰撞风险 | P2 2.4 | 4位随机→递增计数器 |
| SKILL_INLINE散落模式 | P2 3.1 | 技能效果注册表化 |
| 弹窗链重构为FIFO队列 | P1 1.2 | 当前try-catch兜底足够，完整重构待后续 |

---

## v155 本轮补丁 — 派系边缘化豁免对齐

### Bug修复：宗亲/创始团队开局被错误判定为"边缘化"

**问题描述**：魏国开局时，创始团队（夏侯惇/夏侯渊/曹仁/曹洪/许褚）和宗亲武将的忠诚弹窗显示"势单力薄"/"孤立无援"，每旬被扣 -0.15~-0.25 派系mod。

**根因分析**：v111 做"宗亲/创始团队豁免边缘化"时，只改了派系tab的UI展示层（`marginalizedFacs` 跳过 `royalty`/`founding`），漏了两处核心逻辑：

| 位置 | v111之前 | v111修了UI | 本轮修了逻辑 |
|------|---------|-----------|------------|
| 派系tab UI (`marginalizedFacs`, ~行17063) | ❌ | ✅ | — |
| `processFactionLoyalty` 边缘化惩罚 (~行4477) | ❌ | ❌ | ✅ |
| `getGenFactionModBreakdown` 忠诚弹窗显示 (~行4644) | ❌ | ❌ | ✅ |

**为什么魏国特别明显**：

魏国 FOUNDING_CORE 去掉曹操(ruler)后有5人，其中4人（夏侯惇/夏侯渊/曹仁/曹洪）是 `origin:'clan'`，`getGenFactions` 返回 `['founding', 'royalty']` 双标签。按 150%/2 = 75% 分配，founding 和 royalty 各只拿到很小份额。魏国41名非ruler武将中大量中原士族和寒门进一步稀释，导致 founding/royalty 影响力占比 < 10% 阈值，触发边缘化惩罚。

**修复内容**：

| # | 位置 | 改动 |
|---|------|------|
| 1 | `processFactionLoyalty` (~行4477) | `if(mainFac)` → `if(mainFac && mainFac !== 'royalty' && mainFac !== 'founding')` |
| 2 | `getGenFactionModBreakdown` (~行4644) | 同上，忠诚弹窗不再对宗亲/创始显示"势单力薄" |

### v155 本轮变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | 29090 → 29091（+1行，条件判断展开） |
| 改动函数 | `processFactionLoyalty`（边缘化豁免）、`getGenFactionModBreakdown`（显示豁免） |
| 新增函数 | 无 |
| 侵入性 | 极低——两处各加一个条件判断 |
| 存档兼容 | 完全兼容，无数据结构变更 |
| 混淆版 | `project_romance_v155_obsf.html`（JS obfuscation，中等强度） |

### 暂缓问题（下轮处理）

| 问题 | 来源 | 说明 |
|------|------|------|
| 征兵费用公式重复4处 | P2 2.6 | 提取 `calcRecruitGoldCost` 统一调用 |
| `_getCityRegion` 替换为 `CITY_TO_REGION` | P2 3.5 | 已有反向映射，直接查表 |
| billetPool id碰撞风险 | P2 2.4 | 4位随机→递增计数器 |
| SKILL_INLINE散落模式 | P2 3.1 | 技能效果注册表化 |
| 弹窗链重构为FIFO队列 | P1 1.2 | 当前try-catch兜底足够，完整重构待后续 |

---

## v156 Claude AI 决策系统 (Phase 1)

### 概述

实装LLM驱动的AI决策系统Phase 1：局势快照生成（getGameState）+ 数值攻略手册system prompt + API调用层 + 情报模糊系统对齐。Phase 1仅含数据层和调用层，**不含指令执行层**（Phase 2待做）。

### 设计理念

用Claude API替代现有9000行硬编码规则AI。核心优势：多因素交叉推理（围魏救赵、声东击西等联动战略），而非单维度if-else判断。现有规则AI完整保留作为fallback。

### 架构：方案C（每旬全决策）

每旬每个AI势力调用一次Claude，一次性决定所有操作（35种指令类型）。现有`runAI()`降级为合法性校验层和fallback。

### 新增代码（~642行，行29068-29710）

| 函数 | 行号 | 用途 |
|------|------|------|
| `_claudeAI` | 29071 | 全局状态对象（enabled/apiKey/model/统计） |
| `getGameState(fid)` | 29082 | 生成势力视角局势快照JSON，遵守迷雾规则 |
| `_claudeSystemPrompt(fid)` | 29422 | 180行数值攻略手册prompt（含战斗公式/经济/补给/外交/忠诚/围城全部关键数值） |
| `callClaudeAPI(fid)` | 29610 | 用API Key调用（需解决CORS） |
| `callClaudeArtifact(fid)` | 29631 | Artifact内置调用（无需Key，仅Artifact环境可用） |
| `_parseClaudeResponse(data,fid)` | 29652 | 解析Claude返回JSON+token统计 |
| `testClaudeAI(fid,useApiKey)` | 29672 | 控制台测试入口 |
| `inspectState(fid)` | 29696 | 只看快照不调API |
| `setClaudeKey(key)` | 29703 | 设置API Key |

### getGameState()输出结构

```
{
  turn, year, season, faction, faction_id,
  economy: { gold, food_total, iron, wood, horses, gold_net, food_net, salary, corruption_avg },
  cities: [{
    id, name, pop, size,                    // ★ v156新增size字段
    food_turns, food_prod, gold_prod,
    buildings, queue, can_build,
    garrison, frontline,
    siege_decay,                             // ★ v156新增：围城进度(null=未围)
    def_mult,                                // ★ v156新增：当前城防倍率（已算好）
    corruption, morale, gentry,
    prefect, billet_pool,
    road_neighbors,                          // ★ v156新增：相邻城市及归属
    tags
  }],
  armies: [{
    id, leader, troops, morale, location, status,
    squads, level, mobilizing, camping, ambushing,
    reachable_targets: [{                    // 敌城信息经迷雾限制
      city, faction, distance_turns,
      size,                                  // 大城/中城/小城（非精确人口）
      garrison,                              // "有驻军"/"无驻军"（非精确数字）
      enemy_troops,                          // fuzzyTroopDisplay模糊
      tags
    }],
    friendly_distances: [{ city, turns }]    // ★ v156新增：己方城市行军距离
  }],
  generals: [{ name, stats, loyalty, loyalty_risk, faction_tag, skills, idle, assignment }],
  faction_politics, marginalized_generals,
  ethos, reputation,
  diplomacy: [{ faction, status, rel, power_ratio, claims, war_duration }],
  threats: [{                                // ★ 情报模糊v156
    enemy, threat_score,
    known_troops,                            // fuzzyTroopDisplay模糊
    enemy_armies: [{
      leader,                                // INT<60→"不明"
      troops,                                // fuzzyTroopDisplay模糊
      location, status,
      composition                            // INT分级：≥90全编制/≥75武将名/≥60主将/其他不明
    }]
  }],
  tech, schemes, active_decrees,
  wild_generals, poachable_generals,
  diagnostics: { economy[], faction[], military[], diplomatic[] },
  recent_events
}
```

### 情报模糊系统（与玩家视角对齐）

getGameState()遵守与玩家完全相同的迷雾/情报限制：

| 信息类型 | 处理方式 |
|---------|---------|
| 敌城garrison | "有驻军"/"无驻军"，不给精确数字 |
| 敌城内部数据 | 不输出（人口/建筑/粮食/民心等不可知） |
| 可见敌军兵力 | 经getScoutINT()+fuzzyTroopDisplay()模糊 |
| 可见敌军编制 | INT≥90全编制, 75-89武将名, 60-74主将, <60不明 |
| threats.known_troops | 同样经模糊处理 |
| 己方数据 | 完整精确输出 |
| 盟友/附庸数据 | 通过canSeeFactionData()判断，可见则精确 |

### System Prompt设计（~180行，约3500token）

十大模块的精确数值手册：
1. 战斗力公式：ATK/DEF完整计算链 + 兵种base值
2. 兵种克制表：骑→弓1.35等关键数值
3. 地形修正：骑兵山地0.65等
4. 城战守方加成：中城4x、大城雄关durM2.0可达9x
5. 经济公式：粮食消耗pop×0.0004、征兵1200金/5000兵
6. 补给线：最大距离11、敌境+3/格、断粮每旬士气-15/兵力-5%
7. 外交阈值：结盟rel≥75、宣战rel≤30/45
8. 忠诚公式：基础-0.5/旬、相性修正、派系mod
9. 围城机制：decay递增、围到0.6+再攻
10. 从数值推导的10条决策原则

### 35种指令类型

**军事(12)**：move, attack, recruit, add_squad, disband, set_camp, set_ambush, cancel_special, cancel_siege, billet, battle_confirm, set_reinforce_policy
**内政(6)**：build, set_tax, set_prefect, transfer_food, toggle_resupply, cancel_supply
**人事(5)**：appoint_post, dismiss_post, set_strategist, recruit_wild, poach
**外交(9)**：declare_war, propose_alliance, break_alliance, accept_peace, reject_peace, start_claim, diplo_gift, diplo_armistice, diplo_demand/submit/release_vassal
**计谋(5)**：scheme_drive_wolf, scheme_two_tigers, scheme_spy, scheme_rumor, scheme_scout
**战斗响应(3)**：siege_aftermath, prisoner_dispose, battle_confirm
**科技(1)**：research
**事件(2)**：event_choice, court_choice
**特殊(1)**：enthrone

### Phase 1验证结果

已通过手动测试验证：
- getGameState()输出数据完整、数值准确（修复了food_net计算bug和food_total字段名）
- 情报模糊与玩家视角一致
- Claude（由当前对话扮演）能基于快照做出合理的战略决策，thinking包含具体数值推算
- 三势力决策具有差异化风格和联动战略思维

### 已修复的bug

| bug | 原因 | 修复 |
|-----|------|------|
| food_net显示-349042 | 人口消耗用pop×0.08而非正确的pop×0.0004 | 改用getCityFoodNet() |
| food_total为0 | 字段名c.food不存在 | 改为c.storage |
| TECH_TREE.forEach报错 | TECH_TREE是Object不是Array | 改为Object.entries() |
| TECH_TREE prereq字段名错 | 用t.req而非正确的t.prereq | 修正字段名 |

### 待做（Phase 2-4）

| Phase | 内容 | 依赖 |
|-------|------|------|
| 2 | 指令执行层：parseResponse+35种指令映射+nextTurn接入+fallback | API调用方案确定 |
| 3 | UI集成：开关+Key输入+loading+AI思考面板 | Phase 2 |
| 4 | Prompt调优：性格差异化+战略连贯性+常见错误修正 | Phase 3 |

### API调用方案（待解决）

本地HTML直接调api.anthropic.com会被CORS拦截。可选方案：
- 注册API账户+CORS插件（最简单）
- 中转代理节点
- 手动模式（贴快照给Claude对话，返回决策JSON）——Phase 1验证已用此方式

### faction_politics已知问题

calcFactionInfluence()返回的结构与getGameState()期望的不一致，输出的是`{tag:"factions"}`和`{tag:"total"}`而非颍川/谯沛/降将分类。需在Phase 2前修复。

### v156 本轮变更摘要

| 项目 | 变更 |
|------|------|
| 总行数 | 29091 → 29733（+642行） |
| 新增函数 | getGameState, _claudeSystemPrompt, callClaudeAPI, callClaudeArtifact, _parseClaudeResponse, testClaudeAI, inspectState, setClaudeKey（8个） |
| 改动函数 | 无（现有代码零侵入） |
| 存档兼容 | 完全兼容，_claudeAI状态不存入存档 |

---

## v157 Claude AI 决策系统 (Phase 2) — 指令执行层

### 概述

实装LLM驱动的AI决策系统Phase 2：指令执行层（executeClaudeActions）+ runAI async化 + fallback机制。Claude返回的JSON actions数组现在可以直接映射到游戏函数执行。

### 架构变更

#### runAI async化

`runAI()` 从同步 `function` 改为 `async function`，内部 `forEach` 改为 `for..of`（支持await）。`nextTurn()` 调用处加 `await runAI()`。`nextTurn` 本身已是async，UI层调用处不需要改。

#### Claude AI 分支（runAI开头）

```
if(_claudeAI.enabled && fid !== G.playerFac) {
  // 15秒超时兜底
  const result = await Promise.race([callFn(fid), timeout(15s)]);
  if(result有效) { executeClaudeActions(fid, actions); continue; }
  // fallback到规则AI
}
```

- `_claudeAI.apiKey` 存在时用 `callClaudeAPI`（本地+Key模式）
- 否则用 `callClaudeArtifact`（Artifact环境，无需Key）
- 15秒超时 → fallback
- 0条有效指令 → fallback
- 异常 → fallback
- 快进模式下玩家势力不触发Claude AI（避免卡顿）

### 新增代码（~700行，行29731-30410）

| 函数 | 用途 |
|------|------|
| `executeClaudeActions(fid, actions)` | 调度器：遍历actions按优先级排序后逐条执行 |
| `_execOneAction(fid, act)` | 单条指令分发（switch by type） |
| `_resolveCityId(name)` | 名称→城市ID辅助 |
| `_resolveFacId(name)` | 名称→势力ID辅助 |
| `_findUnit(fid, leaderName)` | 按主将名找部队 |
| `_genInFac(genName, fid)` | 武将是否在势力 |
| `_genDeployed(genName, fid)` | 武将是否已编入部队 |
| `_execBuild` | 内政：建筑建设 |
| `_execSetTax` | 内政：税率调整 |
| `_execSetPrefect` | 内政：太守任命 |
| `_execTransferFood` | 内政：调粮 |
| `_execToggleResupply` | 内政：自动调粮开关 |
| `_execCancelSupply` | 内政：取消补给（占位） |
| `_execAppointPost` | 人事：封官 |
| `_execDismissPost` | 人事：罢官 |
| `_execSetStrategist` | 人事：任军师 |
| `_execRecruitWild` | 人事：招募在野 |
| `_execPoach` | 人事：挖角 |
| `_execResearch` | 科技：开始研究 |
| `_execDeclareWar` | 外交：宣战（参数化fid版） |
| `_execProposeAlliance` | 外交：结盟 |
| `_execBreakAlliance` | 外交：解盟 |
| `_execDiploGift` | 外交：送礼 |
| `_execDiploArmistice` | 外交：停战 |
| `_execStartClaim` | 外交：准备宣称 |
| `_execDemandVassal` | 外交：要求称臣 |
| `_execSubmitVassal` | 外交：主动称臣 |
| `_execReleaseVassal` | 外交：释放附庸 |
| `_execSchemeDriveWolf` | 计谋：驱虎吞狼 |
| `_execSchemeTwoTigers` | 计谋：二虎竞食 |
| `_execSchemeSpy` | 计谋：反间计 |
| `_execSchemeRumor` | 计谋：散布谣言 |
| `_execSchemeScout` | 计谋：细作探报 |
| `_execMove` | 军事：行军（hexAstar寻路） |
| `_execRecruit` | 军事：征兵 |
| `_execDisband` | 军事：裁军 |
| `_execSetCamp` | 军事：扎营 |
| `_execSetAmbush` | 军事：伏击 |
| `_execCancelSpecial` | 军事：解除扎营/伏击 |
| `_execCancelSiege` | 军事：撤围 |
| `_execEnthrone` | 特殊：称帝 |
| `enableClaudeAI()` | 控制台启用Claude AI |
| `disableClaudeAI()` | 控制台禁用Claude AI |

### 指令执行顺序

按优先级排序执行（经济先行，军事殿后）：
1. 内政（build/tax/prefect/transfer/resupply）
2. 人事（appoint/dismiss/strategist/recruit_wild/poach）
3. 科技（research）
4. 外交（war/alliance/peace/claim/gift/armistice/vassal）
5. 计谋（5种scheme）
6. 军事（move/recruit/disband/camp/ambush等）
7. 特殊（enthrone）

### 外交函数参数化

原有玩家外交函数（diploWar/diploGift/diploArmistice/diploAlly等）硬编码`G.playerFac`，不可复用。Phase 2的`_exec*`系列外交函数全部参数化为`fid`，参考`aiDoDiplo`的数据操作逻辑重写，包含：
- 双向status更新
- 背刺/反复检测
- 信誉惩罚
- 宣称效果结算
- CD设置
- 价值观冲击

### 校验原则

每条指令都做合法性校验：
- 城市必须属于fid
- 武将必须在fid的generals里且未被占用（太守/部队/研究中互斥）
- 资源足够
- 外交目标势力存在且非己方
- 部队存在且属于fid
- 计谋CD检查
- 非法指令静默跳过（return false），不中断后续指令

### 改动的现有代码

| 位置 | 改动 |
|------|------|
| `runAI()` (~行11706) | `function` → `async function`，`forEach` → `for..of`，开头加Claude分支 |
| `nextTurn()` (~行14024) | `runAI()` → `await runAI()` |
| 标题 | v1.5.5 → v1.5.7 |
| 存档版本 | 155 → 157 |

### 使用方式

**Artifact环境（主路径）**：
```js
enableClaudeAI();   // 控制台输入
// 之后每旬AI势力自动调用Claude API
// 失败自动fallback到规则AI
```

**本地浏览器+API Key**：
```js
setClaudeKey('sk-ant-...');  // 自动启用
// 需要CORS插件或代理
```

**关闭**：
```js
disableClaudeAI();  // 回到纯规则AI
```

### 待做（Phase 3-4）

| Phase | 内容 | 状态 |
|-------|------|------|
| 3 | Cloudflare Worker中转代理（解决itch.io的CORS） | 待做 |
| 4 | Prompt调优：建筑/科技/官职用ID而非中文名 | ✅ v158 |
| 4b | 单城势力(≤1城)走规则AI省token | ✅ v158 |
| 4c | 进一步prompt调优：战略连贯性、recruit必填general等 | 待做 |

### 已知问题（v158 已修复部分）

Claude输出的名称格式与游戏内部ID不匹配，导致约60%指令被跳过：

| 问题 | Claude输出 | 应该输出 | 修复方式 | 状态 |
|------|-----------|---------|---------|------|
| 建筑用中文名 | `"农田Lv1"` | `"farm"` | prompt第十一节列出合法building ID | ✅ v158 |
| 科技用中文名 | `"锐兵"` | `"mil1"` | prompt第十一节列出合法tech ID | ✅ v158 |
| 官职格式错 | 各种变体 | 精确中文名 | prompt第十一节列出合法官职名 | ✅ v158 |
| 城市名/ID混用 | `"许昌"` | `"xuchang"` | prompt明确要求城市用ID+第十一节速查 | ✅ v158 |
| 势力名/ID混用 | `"魏国"` | `"wei"` | prompt明确要求势力用ID | ✅ v158 |
| 宣称类型不明 | 自由文本 | `"border_conflict"` | prompt第十一节列出合法宣称ID | ✅ v158 |
| recruit缺general | `{city:"建宁"}` | 需含general字段 | 待Phase 4c |
| billet未实装 | — | — | 待补充 |

### 端到端测试结果（v157首次实测）

环境：本地浏览器 + OpenRouter（OpenAI兼容格式）+ `anthropic/claude-sonnet-4`
成本：~$0.04/旬（3个AI势力），~$4-8/局

| 势力 | token | 指令数 | 成功 | 跳过 | 思考质量 |
|------|-------|--------|------|------|---------|
| 蜀 | 11723 | 8 | 2 | 6 | 好（识别糜芳忠诚危机+前线分析） |
| 吴 | 12851 | 8 | 4 | 4 | 好（腐败分析+防线评估+太守任命） |
| 蛮 | 5756 | 5 | 1 | 4 | 合理（经济弱+征兵需求） |

### v157 本轮变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v156.html → project_romance_v157.html |
| 标题 | v1.5.5 → v1.5.7 |
| 存档版本 | 155 → 157 |
| 总行数 | 29733 → ~30560 |
| 新增函数 | executeClaudeActions, _execOneAction, 30个_exec*执行函数, _resolveCityId/_resolveFacId/_findUnit/_genInFac/_genDeployed（辅助5个）, toggleClaudeAI/_showApiKeyModal/_populateApiModal/_onApiFormatChange/_confirmApiKey/_updateAIToggleBtn（UI 6个）, _parseOpenAIResponse, enableClaudeAI, disableClaudeAI（共46个） |
| 改动函数 | runAI（async化+Claude分支）、nextTurn（await）、callClaudeAPI（支持双格式）、_claudeAI（新增apiFormat字段） |
| UI新增 | 顶部栏🤖开关按钮 + API设置弹窗（格式/URL/模型/Key四项配置） |
| 支持API格式 | Anthropic原生 + OpenAI兼容（GPT/OpenRouter/中转站） |
| Bug修复 | canAffordMat/deductMat参数传fid而非res对象 |
| 侵入性 | 中等——runAI从sync改async，其余全部新增代码 |
| 存档兼容 | 完全兼容（_claudeAI状态不存档） |

---

## v158 Claude AI Phase 4 — Prompt调优 + State瘦身 + Bug修复大量

### 概述

Phase 4 全面优化：prompt ID速查表注入、getGameState大瘦身（token成本从$0.15/旬降至~$0.05）、执行层字段名归一化、大量bug修复，指令成功率从~35%提升至~70%+。

### 改动总览

#### 1. 单城门槛（runAI ~行11720）

```js
const _facCityCount = CITIES_DEF.filter(c => G.cities[c.id]?.fac === fid).length;
if(_claudeAI.enabled && fid !== G.playerFac && _facCityCount >= 2)
```

注意：字段是 `.fac` 不是 `.owner`（本轮修复的第一个bug）。

#### 2. System Prompt 重写（第十~十一节）

第十节：操作类型参数标注统一（城市/建筑/科技/宣称/势力→英文ID；武将/官职→中文名）
第十一节：新增合法参数值速查表（势力4 + 城市45 + 建筑12 + 科技49含前置链 + 官职22 + 宣称8）

#### 3. getGameState 大瘦身

| 字段 | v157 | v158 |
|------|------|------|
| cities | 冗长can_build含成本/工期、road_neighbors全展开、name重复 | can只输出建筑ID列表、去neighbors、key名压缩 |
| armies | friendly_distances、reachable展开全部含兵种/tags | 去friendly_distances、reachable限top3精简字段 |
| generals | 全量输出所有武将含skills/region/wounded | 仅闲置+忠诚≤65详细输出，其余用gen_summary计数 |
| threats | 逐支部队展开含composition/squadInfo | 精简但**保留每支敌军位置+距前线距离** |
| diplomacy | claims_available列表、power_desc文字 | 仅输出已就绪claim和进行中prep |
| tech | 用中文名、字段名错误(techResearch/techUnlocked) | 用科技ID、**修复为正确的_tech.current/_tech.researched** |
| wild/poach | 全属性 | 精简，挖角仅列忠诚<60的 |
| 删除 | faction_politics、ethos、active_decrees | 不输出（对短期决策影响小） |
| 新增 | — | gen_summary.posts（已封官列表）、warn含研究进行中 |

#### 4. 执行层Bug修复

| Bug | 原因 | 修复 |
|-----|------|------|
| `.owner` 不存在 | 全项目城市归属用 `.fac` | 改为 `.fac`（2处） |
| move/attack全部失败 | prompt用`army_leader`/`target_city`，执行层读`leader`/`target` | `_execOneAction`入口字段名归一化 |
| recruit无将名跳过 | Claude常不带general字段 | 自动选统帅最高闲置武将 |
| start_claim全部失败 | prompt用`claim_type`，代码读`act.claim` | 改为`act.claim_type \|\| act.claim` |
| research全部失败 | getGameState用`fac.techResearch`（不存在） | 修为`fac._tech.current` |
| research重复下单 | Claude看不到正在研究的科技 | warn数组加"研究中:xxx" |
| appoint_post重复封官 | Claude不知道谁已有官职 | gen_summary加posts字段 |
| recruit tech字段错 | 自动选将检查`fac.techResearch`（不存在） | 改为`fac._tech.current` |

#### 5. UI改进

| 改动 | 说明 |
|------|------|
| 模型下拉选择 | 内置Sonnet4/Opus4/3.5Sonnet/Gemini Flash预设+自定义 |
| pingClaudeAPI() | 控制台一键连接诊断（打印配置、发测试请求、检查城市数门槛） |
| runAI增强日志 | 每势力打印"🔄开始/⏭跳过"、执行结果含成功/跳过/错误详情 |
| _execAppointPost日志 | 详细打印跳过原因（功绩不足/已有官职/名额满/太守） |
| _execResearch日志 | 详细打印跳过原因（已研究/前置不满足/资源不足/武将占用） |

#### 6. 敌军威胁信息增强

threats.units 补回每支可见敌军的位置和距最近己城距离：
```json
"units": ["张辽(约15000,hanzhong,距1格)", "夏侯惇(约8000,xinye,距2格)"]
```
仍遵守战争迷雾——只输出可见敌军，兵力经fuzzyTroopDisplay模糊。

### 实测成绩

| 指标 | v157 | v158 |
|------|------|------|
| 指令成功率 | ~35% | ~70%+ |
| 每旬token成本 | ~$0.15 | ~$0.05 |
| 每局估计成本 | ~$4-8 | ~$1.5-3 |

### v158 本轮变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v157.html → project_romance_v158.html |
| 总行数 | ~30435 → ~30720 |
| 改动函数 | runAI(单城门槛+日志)、_claudeSystemPrompt(十~十一节重写)、getGameState(大瘦身+tech字段修复+posts/warn增强)、_execOneAction(字段归一化)、_execAppointPost(名额检查+日志)、_execResearch(详细日志+前置校验)、_execStartClaim(claim_type兼容)、_execRecruit(自动选将) |
| 新增函数 | pingClaudeAPI()、_onModelSelectChange() |
| UI | 模型下拉预设、pingClaudeAPI诊断 |
| 存档兼容 | 完全兼容 |

### 下轮重点

1. **继续提升成功率至90%+**：剩余跳过主要是功绩不足/名额满/资源不足等合理拒绝，但也有部分可通过更好的state信息避免（如输出官职名额上限）
2. **Phase 3**：Cloudflare Worker中转代理（解决itch.io CORS问题）
3. **迷雾下的进攻决策**：Claude基于迷雾信息做进攻决策，可能冲进敌方大军伏击圈——这是设计正确的行为（AI也受迷雾限制），暂不改
4. **build跳过较多**：可能是资源/槽位不足，需确认getGameState的can字段是否准确传达了"为什么不能建"

---

## v159 Claude AI Phase 5 — 情报推理层 + 决策节奏 + Prompt去规则化

### 概述

Phase 5 五个子系统：A.情报预警引擎、B.迷雾不确定性估算、C.战略记忆、D.决策节奏（战略旬/战术旬）、E.Prompt去规则化。核心目标：让LLM AI具备"看不见≠不存在"的推理能力、跨旬战略连贯性、以及基于数值关系自主推导策略的思维模式。

### 设计理念

#### E. Prompt去规则化
第九节从"决策原则"（10条规则型指令）改写为"思维框架"（10条思维模式引导）。核心区别：不告诉Claude"做什么/不做什么"，而是教"怎么评估"——提供数值关系和因果链，让Claude自行推导。例如：原"永远不要对未围城城市强攻"→现"攻城前先算有效兵力比：总ATK÷(敌DEF×城防倍率)，比值<2:1考虑围城，比值>5:1直接打"。

#### A. 情报预警引擎
游戏引擎预计算推理性信息，补偿Claude"看不见就假设没有"的弱点。等于给Claude装了参谋班子。

#### B. 迷雾不确定性估算
迷雾区域从"空白"变为"带置信度的估算"。每个敌对势力输出estimated_total/unaccounted/confidence。

#### C. 战略记忆
Claude输出新增strategy_intent/stance/contingency字段，下旬传回形成跨旬连贯性。引擎自动记录每旬行动摘要和重大战损。

#### D. 决策节奏
每6旬（+事件触发）做一次战略评估旬（完整prompt+快照），其余为战术执行旬（精简prompt+delta快照）。避免每旬从零规划。

### 新增数据结构（全部在_claudeAI内，不存档）

```
_claudeAI._intelHistory[fid] = {
  lastSeen: { "将名": { turn, troops, loc, fac } },
  visibleTrend: { "enemy_fid": [{ turn, total }] },  // 最近12旬
  lostCities: [{ city, turn, toFac }],                // 最近10条
}

_claudeAI._strategyMemory[fid] = {
  strategy_intent: "...",    // Claude上旬输出
  intent_set_turn: N,
  stance: "aggressive/defensive/developing/diplomatic",
  contingency: { "条件": "方案" },
  recent_actions: [{ turn, summary }],  // 最近6条
  war_journal: [{ turn, event }],       // 最近10条
}

_claudeAI._lastStrategicTurn[fid] = N   // 上次战略旬
_claudeAI._lastSnapshot[fid] = { turn, myCityIds }  // delta对比用
```

### 新增函数（9个，~370行）

| 函数 | 用途 |
|------|------|
| `_updateIntelHistory(fid)` | 每旬更新lastSeen/visibleTrend/lostCities |
| `_buildIntelWarnings(fid)` | 生成5类预警：主力失踪/兵力异变/新占城/情报空白/增长推估 |
| `_buildFogEstimates(fid)` | 迷雾估算：estimated_total/unaccounted/confidence |
| `_buildFogCities(fid)` | 迷雾中敌城列表（含stale旬数） |
| `_recordActionSummary(fid, actions)` | 根据执行成功的指令自动生成行动摘要 |
| `_recordWarJournal(fid, event)` | 记录重大事件（供外部调用） |
| `_isStrategicTurn(fid)` | 判断战略旬（周期6旬+丢城+被宣战触发） |
| `_buildDeltaSnapshot(fid)` | 战术旬delta快照 |
| `_tacticalSystemPrompt(fid)` | 战术旬精简prompt |

### getGameState新增输出字段

| 字段 | 内容 |
|------|------|
| `intel_warnings` | 参谋预警数组（最多8条） |
| `fog_estimates` | 每个敌对势力的兵力估算+置信度 |
| `fog_cities` | 迷雾中已知敌城列表（含情报过期旬数） |
| `strategy_context` | 战略记忆（intent/stance/contingency/recent_actions/war_journal） |

### System Prompt改动

| 节 | 变更 |
|----|------|
| 第九节 | 标题改为"思维框架（如何分析局势）"，10条全部从规则型改写为思维模式型 |
| 第十节 | 输出格式新增strategy_intent/stance/contingency字段要求 |
| 第十二节 | 新增：情报推理与不确定性（解释intel_warnings/fog_estimates/fog_cities/strategy_context的使用方式） |

### callClaudeAPI改动

根据`_isStrategicTurn(fid)`选择双模式：
- 战略旬：完整`_claudeSystemPrompt` + 完整`getGameState`
- 战术旬：精简`_tacticalSystemPrompt` + `_buildDeltaSnapshot`

### executeClaudeActions改动

stats新增`_executedActions`数组，记录成功执行的action对象。runAI中执行完后调`_recordActionSummary`写入战略记忆。

### runAI改动

Claude分支开头加`_updateIntelHistory(fid)`调用；执行后调`_recordActionSummary`；战略旬更新`_lastStrategicTurn`。

### _parseClaudeResponse改动

提取Claude返回JSON中的`strategy_intent`/`stance`/`contingency`字段，写入`_strategyMemory[fid]`。

### v159 本轮变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v158.html → project_romance_v159.html |
| 标题 | v1.5.7 → v1.5.9 |
| 存档版本 | 157 → 159 |
| 总行数 | 30722 → 31190（+468行） |
| 新增函数 | 9个（_updateIntelHistory, _buildIntelWarnings, _buildFogEstimates, _buildFogCities, _recordActionSummary, _recordWarJournal, _isStrategicTurn, _buildDeltaSnapshot, _tacticalSystemPrompt） |
| 改动函数 | getGameState（+4字段）、_claudeSystemPrompt（第九节重写+第十节更新+第十二节新增）、callClaudeAPI（双模式）、_parseClaudeResponse（提取战略字段）、executeClaudeActions（_executedActions追踪）、runAI（_updateIntelHistory+_recordActionSummary） |
| 侵入性 | 低——现有代码零删除，全部新增或追加 |
| 存档兼容 | 完全兼容（全部新增数据在_claudeAI内，不存档） |

### 下轮重点

1. **实测Phase 5效果**：对比v158→v159的决策质量变化，重点观察：战略连贯性、迷雾下的保守程度、战术旬的token节省
2. **_recordWarJournal hook**：当前只有结构，需在战斗结算/城市易手等处补充调用点
3. **Phase 3**：Cloudflare Worker中转代理（仍待做）
4. **战术旬的操作类型速查**：当前战术旬精简prompt不含第十一节ID速查表，如果指令匹配率下降需要追加
5. **pending_plan精度**：当前基于部队status粗略推算，可从_lastActions中精确提取上旬的move目标等信息

---

## v159 实测迭代修复（Phase 5部署后）

### 修复清单

| # | 问题 | 原因 | 修复 |
|---|------|------|------|
| 1 | 战略旬timeout 15s | Phase 5完整prompt+快照+12节太大 | 战略旬超时放宽至30s，战术旬保持15s |
| 2 | 战术旬指令格式全错（appoint/gather/officer_action等编造类型） | 战术旬prompt无操作类型列表 | 战术旬prompt补入完整操作类型+字段名+关键ID参考 |
| 3 | scheme_scout选不相邻城市（luoyang/xuchang等） | 快照未告知哪些城可侦察 | getGameState和delta快照均加`scout_targets`字段（己方相邻敌城列表） |
| 4 | 战术旬城市ID拼错（danyang/kuaiji/wancheng） | delta快照无城市列表，Claude凭记忆猜拼写 | delta快照加`my_cities`字段（己方城市ID数组） |
| 5 | 金钱不足仍下征兵/建造/侦察指令 | LLM不做算术，看不出436<720 | 新增`_buildConstraints(fid)`函数，输出自然语言约束摘要（"金436不足征兵需720+"），战略旬和战术旬均输出 |
| 6 | `_parseOpenAIResponse`不提取strategy字段 | 遗漏——OpenAI格式是主路径 | 补入与`_parseClaudeResponse`相同的strategy_intent/stance/contingency提取逻辑 |
| 7 | 阵亡武将产生幽灵"主力失踪"预警 | lastSeen不清理已死武将 | `_buildIntelWarnings`加`GEN_MAP[name]`存在性检查 |
| 8 | `_buildFogEstimates`作弊读取实际城市数 | `G.cities.filter(fac===ef).length`绕过迷雾 | 改为仅用fogSnap+当前可见城市估算 |
| 9 | `_isStrategicTurn`外交key方向不完整 | 只查`fid-ef`可能漏`ef-fid` | 两个方向独立检查`_warDeclaredTurn` |
| 10 | `_buildDeltaSnapshot`引用不存在的`u._targetNodeId` | 单位用hexPath/movePath | 改用`u.movePath[last]`获取行军目标 |
| 11 | 战术旬`_lastSnapshot`不更新致丢城检测失效 | 只有getGameState更新快照 | `_updateIntelHistory`末尾每旬更新`_lastSnapshot` |
| 12 | `_execSchemeScout`跳过无日志 | 静默return false | 加详细console.warn（城市无效/己方/CD/金不足/不相邻） |

### 实测性能对比

| 指标 | v158 | v159战略旬 | v159战术旬 |
|------|------|-----------|-----------|
| token/旬/势力 | ~11000 | ~11500 | ~1300-1900 |
| 指令成功率 | ~70% | ~85% | ~75%（含资源不足的合理拒绝） |
| 每局估算成本 | ~$1.5-3 | ~$0.8-1.5（混合战略/战术旬） | — |

### v159最终变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v158.html → project_romance_v159.html |
| 标题 | v1.5.7 → v1.5.9 |
| 存档版本 | 157 → 159 |
| 总行数 | 30722 → 31341（+619行） |
| 新增函数 | 10个：_updateIntelHistory, _buildIntelWarnings, _buildFogEstimates, _buildFogCities, _buildConstraints, _recordActionSummary, _recordWarJournal, _isStrategicTurn, _buildDeltaSnapshot, _tacticalSystemPrompt |
| 改动函数 | getGameState(+5字段), _claudeSystemPrompt(第九节重写+十节更新+十二节新增), callClaudeAPI(双模式), _parseClaudeResponse(战略字段), _parseOpenAIResponse(同上), executeClaudeActions(_executedActions), runAI(_updateIntelHistory+_recordActionSummary), _execSchemeScout(日志) |
| 存档兼容 | 完全兼容 |

### Claude AI 当前状态总结

**已完成**：
- Phase 1: 局势快照 + system prompt + API调用层 ✅
- Phase 2: 指令执行层（35种指令）+ fallback ✅  
- Phase 4: Prompt调优 + State瘦身 + Bug大修 ✅
- Phase 5: 情报推理 + 迷雾估算 + 战略记忆 + 决策节奏 + 思维框架 ✅

**可以告一段落，后续优化方向**：
- `_recordWarJournal` hook接入（战斗结算/城市易手处，工作量小）
- Phase 3: Cloudflare Worker中转代理（itch.io部署用）
- 指令顺序智能排序（封官vs太守互斥）
- 战术旬继续观察成功率，必要时补更多ID速查

**AI系统不影响其他feature开发**——全部代码在`_claudeAI`命名空间内，`runAI`中用`if(_claudeAI.enabled)`守卫，关闭后对游戏零影响。

---

## v161 属县系统（County System）

### 概述

将每座城市拆分为3-5个属县，每县有独立的loyalty值。豪族据点（clan_base）绑定具体家族，对政治变化极度敏感；治所（seat）稳定不易波动；普通县（common）随大流。所有现有下游消费点（金产/征兵/城防/腐败等）不改，继续读聚合后的city.gentry。

### 核心概念

**属县类型**：seat(治所,×0.5) / clan_base(豪族据点,×1.3) / common(普通,×0.8)。系数为变化敏感度。

**聚合公式**：`city.gentry = Σ(county.loyalty × county.popShare)`

**新增政治派系**：dongzhou(东州派) / huaisi(淮泗派)，在REGION_CITIES中无对应城市，这些武将在任何城市当太守都是"外地人"。

### 数据结构

```js
// 城市新增
city.counties = [
  { name:'颍阴', type:'clan_base', clanFamily:'颍川荀氏',
    popShare:0.20, loyalty:70, _initPop:85000 },
  // ...
];

// 静态数据
CLAN_FAMILIES = { yc_xun:'颍川荀氏', ... }  // ~20个家族常量
COUNTY_DATA = { xuchang:[...], ... }           // 45城属县模板
COUNTY_SENSITIVITY = { seat:0.5, clan_base:1.3, common:0.8 }
GENTRY_FAC_TO_REGION = { gentry_zhongyuan:['zhongyuan','hebei'], ... }  // 反转映射
```

### 每旬处理（processGentry改造）

```
对每个己方城市的每个属县：
  delta = baseDelta（太守/派系/占领期/技能——全县共享）
  if clan_base: 家族有人任官+0.3 / 有人在势力+0 / 无人-0.3
  delta += 0.05（自然漂移）
  delta *= COUNTY_SENSITIVITY[type]
  county.loyalty = clamp(loyalty + delta, 0, 100)

city.gentry = Σ(county.loyalty × county.popShare)

隐匿户口：county.loyalty<20 → 该县人口-5%/旬，下限初始值30%
献城：任一县loyalty<20 + popShare≥20% + 被围城 + 非最后一城
```

### 一次性事件钩子

| 事件 | loyalty变化 | 钩子位置 |
|------|-----------|---------|
| 处决该家族武将 | -30 | killGen → applyFamilyLoyaltyShock |
| 武将叛逃/被挖角 | -15 | _aiDoPoach → applyFamilyLoyaltyShock |
| 朝议采纳本地域提议 | clan_base县 +5 | _applyCourtDecisions |
| 朝议驳回本地域提议 | clan_base县 -3 | _applyCourtDecisions |

### 城市易手（applyGentryOnCapture）

| 属县类型 | 新loyalty |
|---------|----------|
| seat | 40 + gentryHook |
| clan_base（新势力有该家族） | 25 + gentryHook |
| clan_base（新势力无该家族） | 15 + gentryHook |
| common | 25 + gentryHook |

### 初始化规则

本势力本土：seat 90 / clan_base有官70无官55 / common 50
外来政权：seat 40 / clan_base有官45无官30无人20 / common 30

### GEN_TAGS region修正

| 武将 | 旧region | 新region | 派系 |
|------|---------|---------|------|
| 法正 | zhongyuan | dongzhou | 东州派 |
| 李严 | yizhou | dongzhou | 东州派 |
| 吴懿 | yizhou | dongzhou | 东州派 |
| 孟达 | yizhou | dongzhou | 东州派 |
| 董允 | jingzhou | dongzhou | 东州派 |
| 周瑜 | jiangdong | huaisi | 淮泗派 |
| 张昭 | zhongyuan | huaisi | 淮泗派 |
| 鲁肃 | jiangdong | huaisi | 淮泗派 |
| 吕蒙 | jiangdong | huaisi | 淮泗派(寒门) |

### 新增函数（8个）

| 函数 | 用途 |
|------|------|
| `_isFacHomeRegion(fid,reg)` | 判断势力是否以该region为核心 |
| `_clanHasMemberInFac(clan,fid)` | 势力中是否有该家族成员 |
| `_clanHasOfficeInFac(clan,fid)` | 势力中该家族是否有人任官 |
| `_aggregateGentry(city)` | 聚合属县loyalty为city.gentry |
| `applyFamilyLoyaltyShock(fid,clan,delta)` | 通用家族忠诚冲击 |
| initCityGentry | 重写为counties初始化 |
| applyGentryOnCapture | 重写为按县设loyalty |
| processGentry | 重写为县级遍历+聚合 |

### UI改动

| 改动 | 说明 |
|------|------|
| renderCityTab | 豪族进度条下方新增可展开`<details>`属县列表（县名+类型+loyalty条+任官武将） |
| showBreakdown gentry | 计算链底部新增属县明细（各县loyalty×popShare=贡献值，聚合值） |
| FACTION_COLORS | +东州暗金#d4a04a / +淮泗深蓝#5b8fb9 |

### 存档兼容

version 160→161。旧存档无counties → _deserializeG中调用initCityGentry自动初始化。

### 不改动

6个gentry消费函数（getGentryGoldMult/getGentryRecruitMult/getGentryMoraleMod/getGentryDefMult/_getCorruptGentryMod/processMorale豪族因子）、checkRebellions、腐败、朝议（除新增钩子外）、围城（除献城条件改为县级外）、AI系统。

### v161 本轮变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v160.html → project_romance_v161.html |
| 标题 | v1.5.9 → v1.6.1 |
| 存档版本 | 160 → 161 |
| 总行数 | ~31432 → ~31960（+528行） |
| 新增常量 | CLAN_FAMILIES, COUNTY_DATA(45城), COUNTY_SENSITIVITY, GENTRY_FAC_TO_REGION |
| 新增函数 | 5个辅助函数 + 3个重写函数 |
| 改动函数 | getGenFaction(+dongzhou/huaisi), getGenFactions(同), killGen(+clan钩子), _aiDoPoach(+clan钩子), _applyCourtDecisions(+county钩子), _deserializeG(+counties兼容), runIntegrityAudit(+popShare检查) |
| GEN_TAGS | 9人region修正 + ~20人clan注入 |
| FACTION_DEFS | +gentry_dongzhou, +gentry_huaisi |
| 侵入性 | 中——processGentry/initCityGentry/applyGentryOnCapture重写，但下游消费点零改动 |
| 存档兼容 | 完全兼容（旧存档自动初始化counties） |

### 下轮重点

1. **实测验证**：开局许昌gentry≈69 / 成都≈61，快进100旬无报错
2. **领土overlay增强**：gentry值调节领土着色透明度（设计文档第十二节，本轮未做）
3. **AI太守安排验证**：dongzhou/huaisi武将永远匹配不上任何城市，确认fallback正常
4. **事件系统属县钩子**：豪族献策(C1)/豪族不满(C4)等事件可接入county级别操作
5. **Claude AI getGameState**：输出counties摘要供AI决策参考

### v161 实装后迭代修复 + QoL

#### Bug修复

| # | 问题 | 原因 | 修复 |
|---|------|------|------|
| 1 | `CLAN_FAMILIES` TDZ错误 | GEN_TAGS clan注入块位于CLAN_FAMILIES声明之前 | 将注入块移至COUNTY_SENSITIVITY之后 |
| 2 | 城市面板点不开 | county `.map(c =>` 缺少索引参数ci，`${ci}`为undefined导致onclick生成非法JS | 改为 `.map((c,ci) =>` |
| 3 | 属县显示"两个太守" | officer查找匹配了其他城的太守但统一显示"任太守" | 区分显示：朝廷官职名 / X城太守 / 在朝 |

#### 挖角系统改进

| 改动 | 说明 |
|------|------|
| 挖角3旬冷却 | `G._poachCooldown[name]=G.turn`，失败后同一武将3旬内不可再试 |
| 按钮显示禁用原因 | 金不足或冷却中直接在卡片上红字显示，不只是hover title |
| 成功率显示 | 日志和notif显示实际成功率百分比 |
| 玩家挖角也触发属县冲击 | `poachGen`成功时调用`applyFamilyLoyaltyShock(srcFid, clan, -15)` |

#### 入伙冷却（防反复横跳）

`checkLoyaltyThresholds`开头加判定：`G.turn - G.genJoinTurn[name] < 9` 时跳过下野和可挖角检查。效果：任何渠道（俘获/招募/挖角）新加入的武将9旬（一季度）内稳定在势力中，玩家和AI都有时间通过封官、安排太守来提升忠诚。

#### 君主不显示忠诚

`openGenProfile`中`g.role==='ruler'`时隐藏整个忠诚section（数值、趋势、派系修正）。武将列表中君主名旁不显示忠诚图标。

#### 属县tooltip（showCountyTip）

新增`showCountyTip(e, cityId, countyIdx)`函数，点击属县行弹出详情tooltip：忠诚度+等级、人口占比、敏感系数、聚合贡献、每旬变化预估（太守/占领期/家族任官/自然漂移→基础×敏感系数=净变化）、状态警告（隐匿户口/可能献城）。

#### 新手引导更新

Page 2「豪族势力」详情更新为属县系统描述：提到属县、豪族据点绑定家族、任官维稳、展开属县详情。

### v161 最终变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v160.html → project_romance_v161.html |
| 标题 | v1.5.9 → v1.6.1 |
| 存档版本 | 160 → 161 |
| 总行数 | ~31432 → ~32060（+628行） |
| 新增常量 | CLAN_FAMILIES(20族), COUNTY_DATA(45城~180县), COUNTY_SENSITIVITY, GENTRY_FAC_TO_REGION |
| 新增函数 | _isFacHomeRegion, _clanHasMemberInFac, _clanHasOfficeInFac, _aggregateGentry, applyFamilyLoyaltyShock, showCountyTip（共6个新函数） |
| 重写函数 | initCityGentry, processGentry, applyGentryOnCapture（3个核心函数重写） |
| 改动函数 | getGenFaction(+dongzhou/huaisi), getGenFactions(同), killGen(+clan钩子), _aiDoPoach(+clan钩子), poachGen(+clan钩子+冷却+成功率显示), _applyCourtDecisions(+county钩子), checkLoyaltyThresholds(+入伙冷却), _deserializeG(+counties兼容), runIntegrityAudit(+popShare检查), openGenProfile(+君主隐藏忠诚), renderCityTab(+属县列表), showBreakdown(+县级明细) |
| GEN_TAGS | 9人region修正 + ~20人clan注入 |
| FACTION_DEFS | +gentry_dongzhou, +gentry_huaisi |
| FACTION_COLORS | +dongzhou暗金, +huaisi深蓝 |
| 侵入性 | 中——processGentry/initCityGentry/applyGentryOnCapture重写，但下游消费点零改动 |
| 存档兼容 | 完全兼容（旧存档自动初始化counties，_poachCooldown自动创建） |

---

## v162 Tab帮助系统 + 双Bug修复

### 功能1：Tab级帮助按钮（? 按钮 + 详解弹窗）

#### 设计意图

在新手引导（线性导览，首次进入触发）之外，为每个右侧面板Tab提供**随时可查阅的机制参考手册**。`?`按钮内联在每个Tab的内容标题旁，点开后弹出详解弹窗，包含设计思路、关键公式、数值参考，以折叠块形式组织。

#### 实现方案

**方案选型**：采用内联HTML函数 `_tabHelpHtml(tabId)` 而非DOM注入。每个render*Tab函数在标题处直接调用 `${_tabHelpHtml('tabId')}`，按钮随标题渲染，无需post-hoc注入，无时序/重复注入问题。

**新增代码**：

| 类别 | 内容 | 行号 |
|------|------|------|
| CSS | `.tab-help-btn`(内联15×15圆按钮) / `.tab-help-overlay`(遮罩) / `.tab-help-card`(弹窗，复用tut-card风格) / `.thp-sec`(折叠块) / `.formula`(公式样式) / `td.hi`/`td.lo`(表格高亮) | ~L504-530 |
| JS数据 | `TAB_HELP` 常量对象，10个tab各一条（title + intro + sections[]） | ~L28889 |
| JS函数 | `showTabHelp(tabId)` / `closeTabHelp()` / `_tabHelpHtml(tabId)` | ~L29177 / L29203 / L29208 |
| 渲染钩子 | 10个render*Tab各1处 `${_tabHelpHtml('xxx')}` 内联调用 | 分布各处 |

**Tab标题统一化**：

| Tab | 原标题 | 新标题 |
|-----|--------|--------|
| 城池(列表) | 城池列表 | 城池总览 |
| 军事 | 野战部队 | 部队总览 |
| 武将 | {势力}·N名武将 | 武将总览 |
| 官职 | 📜{势力}·官职 | 官职总览 |
| 外交 | {势力}外交关系 | 外交总览 |
| 计谋 | 📜{势力}计谋 | 计谋总览 |
| 派系 | 🏛{势力}派系政治 | 派系总览 |
| 科技 | (无标题) | 科技总览 |
| 价值观 | ⚖势力价值观 | 价值观总览 |
| 统计 | (无标题) | 势力统计 |

势力名、人数等信息降级为标题右侧浅色副文本。

#### 帮助内容覆盖（10个Tab，共39个折叠section）

| Tab | sections | 核心内容 |
|-----|----------|---------|
| 城池 | 6 | 人口Logistic增长、人口质量→新兵等级、民心阈值、腐败公式(基础+太守+豪族)、粮食产消、豪族属县、太守buff规则、建筑 |
| 军事 | 9 | 编制结构(一主二副)、兵种ATK/DEF表、战力完整公式链、克制5×5矩阵、地形6×5矩阵、混编协同表、补给线距离+补员双轨制、战斗类型(野战/围城/伏击/水战)、休整 |
| 武将 | 6 | 五维属性作用、忠诚度9项公式、适性等级→乘数(S1.20/A1.10/B1.00/C0.88)、技能示例、性情标签、亲密度连携 |
| 官职 | 3 | 四档解锁表(诸侯/侯/公/王)、官位效果、称帝 |
| 外交 | 4 | 友好度阈值表、自然漂移规则、信誉扣减/恢复、宣称、附庸纳贡比例 |
| 计谋 | 2 | 五种计谋一览表、成功率/CD/代价、军师 |
| 派系 | 3 | 影响力安全区、朝议、平衡策略 |
| 科技 | 2 | 五分支×节点表、研究机制/武将绑定 |
| 价值观 | 3 | 五维度含义、忠诚联动公式、外交距离修正 |
| 统计 | 1 | 数据来源说明 |

---

### Bug修复1：突围成功后部队卡在城里

#### 根因

`doRetreat([u])` 调用时无chasers参数 → `enemyCenter=null` → 所有邻居hex距离=0 → 方向选择退化。同时：
- 陆上撤退排除水域hex
- 排除被其他部队占据的hex
- 排除敌方城市hex

城市被水域包围 + 剩余陆地被围城方占据 → 所有退路被排除 → 部队原地不动卡在城hex。

#### 修复（4处改动）

| 位置 | 改动 |
|------|------|
| 突围调用处(~L22976) | `doRetreat([u])` → `doRetreat([u], attackers, 'full')`；设 `u._breakoutRetreat=true`，doRetreat后delete |
| doRetreat主循环堆叠检测(~L22479) | `_breakoutRetreat` 时豁免堆叠限制（允许穿过攻方部队） |
| doRetreat主循环方向选择(~L22490) | `_breakoutRetreat` 时陆地优先但水路也可接受（与水上撤退同逻辑） |
| doRetreat fallback链(~L22501, ~L22522) | 水路fallback条件扩展为 `_retOnWater \|\| u._breakoutRetreat`；新增最终退路——忽略一切堆叠，只排除impassable和敌城 |

#### 三级Fallback链

```
Tier1: 主循环 → 陆地优先，水路备选（breakout豁免堆叠）
Tier2: bestNb失败 → 使用水路landFallback（breakout或水上撤退共用）  
Tier3: 全失败 → 最终退路，忽略堆叠，只排除impassable和敌城
```

---

### Bug修复2：水上部队可发起围城

#### 根因

`_execInstantMarch` 中部队行军到敌方城市hex时直接进入siege状态，未检查部队当前是否在水域。

#### 修复（2处新增 + 1处确认）

| 位置 | 改动 |
|------|------|
| `_execInstantMarch` 玩家围城判定(~L26257) | **新增** `isWaterHex(unit.hq, unit.hr)` 检查，水上→halt+提示"需先上岸" |
| `aiSiegeDecision` AI围城决策(~L11301) | **新增** `isUnitOnWater(unit)` 检查，水上→return |
| AI march围城判定(~L19624) | **已有** v138的 `isUnitOnWater` 检查，无需改动 |

全部3个siege入口点（`status='siege'`赋值处）均已覆盖水域检查。

---

### v162 变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v161.html → project_romance_v162.html |
| 总行数 | ~32060 → ~32449（+389行） |
| 新增常量 | TAB_HELP（10个tab帮助内容，~290行） |
| 新增函数 | `_tabHelpHtml(tabId)` / `showTabHelp(tabId)` / `closeTabHelp()` |
| 删除函数 | `_injectTabHelpBtn()`（替换为内联方案） |
| 改动函数 | 10个render*Tab（标题统一化+帮助按钮内联）、`doRetreat`（突围fallback链）、`resolveSiegeBattle`（突围调用参数）、`_execInstantMarch`（水域围城检查）、`aiSiegeDecision`（水域围城检查） |
| CSS新增 | `.tab-help-btn` / `.tab-help-overlay` / `.tab-help-card` / `.thp-sec*` / `.formula` / `td.hi` / `td.lo`（~27行） |
| 存档兼容 | 完全兼容（纯UI+逻辑修复，无新数据字段） |
| 侵入性 | 低——标题文案变更+UI新增+2个bug修复，零核心数据改动 |

### 下轮重点

1. **实测验证**：手动触发攻城→突围场景（尤其水边城市如江陵、柴桑），确认突围不再卡住
2. **实测验证**：水上部队尝试右键点击敌城，确认收到"需先上岸"提示
3. **帮助内容review**：各Tab的?弹窗内容是否准确、公式是否与当前代码一致
4. **存档/读档/胜利条件**：仍为高优先级待办
5. **武将技能批量实装**：~85处待实装


---

## v163 帮助按钮 + 徭役系统 + 部曲系统（部分实装+设计确认）

### 一、帮助按钮（3处新增）

| 位置 | 内容 |
|------|------|
| 左侧「全局政策」标题旁 | 整合弹窗：赋税/补员/自动调粮/徭役，折叠展开 |
| 统计面板帮助 | intro加注「⚠ 测试用功能（Testing Only）」 |
| 顶部AI按钮旁 | AI决策系统帮助：规则AI vs Claude AI / 启用方法 / 决策范围 |

TAB_HELP新增3个key：`policy`、`ai`（新增），`stats`（修改intro）。复用现有`.tab-help-btn`样式和`showTabHelp()`弹窗。

### 二、徭役系统（已实装）

#### 设计

全局政策新档位，与税率/补员/自动调粮并列。三档：轻徭（默认）/中徭/重徭。

```js
const CORVEE=[
  {id:'low',  name:'轻徭', buildBonus:0,    moralePen:0,    qualPen:0},
  {id:'mid',  name:'中徭', buildBonus:0.12, moralePen:-0.20,qualPen:-0.03},
  {id:'high', name:'重徭', buildBonus:0.22, moralePen:-0.50,qualPen:-0.08},
];
```

#### 核心规则

- **建设加速**：叠加到`_buildAccelProb`概率系统，在`processBuildQueues`中生效
- **民心代价**：在`processMorale`中叠加，**仅该城有在建项目时生效**
- **质量代价**：在`processPop`质量段叠加，**同上条件**
- **太守减免**：太守pol≥75时民心代价减半
- **无下限保护**：代价硬吃，不设人口质量下限
- **无粮食消耗**：去掉了最初设计中的额外粮耗

#### 改动位置

| 位置 | 改动 |
|------|------|
| `CORVEE`常量（L797） | 三档定义 |
| `G.factions[fid].corveeId`（initGame 2处） | 默认`'low'` |
| `processBuildQueues`（L6065） | `_baseAccelProb += _corvee.buildBonus` |
| `processMorale`（L5857） | 有buildQueue时叠加`moralePen`，太守pol≥75减半 |
| `processPop`（L5909） | 有buildQueue时叠加`qualPen` |
| 左侧面板HTML（L561） | 新增`<div id="corveeRow">` |
| `setCorvee(id)`（L15175） | 新函数，切换+日志 |
| `renderLeft`（L15646） | 渲染corvee按钮行 |
| AI逻辑（L12164） | 战时建设→中徭，和平建设→重徭，无建设→低徭 |
| 民心tooltip（L18624） | 显示徭役行+太守减半标注 |
| 质量tooltip（L18673） | 显示徭役行 |
| 建筑列表UI（L17041） | 每个可建项目旁显示`🔨+XX%`徭役加速标签 |
| TAB_HELP.policy | 新增徭役帮助section |

#### 存档兼容

`corveeId`为简单字符串，旧存档无此字段时全部`||'low'`兜底。

### 三、部曲系统（部分实装，有已知bug待下轮修复）

#### 当前实装状态

数据结构为`G.genRetainers = { '曹操': 2500, ... }`（纯数字，未绑兵种）。以下已实装：

| 功能 | 状态 | 位置 |
|------|------|------|
| `RETAINER_PRESET`（25位武将开局数据） | ✅ | L811 |
| `getRetainers/setRetainers` helper | ✅ | L835-836 |
| `getEffectiveSquadLevel` 有效等级计算 | ✅ | L839 |
| `_squadBase` 用有效等级计算ATK/DEF | ✅ | L21048 |
| 两处`applyLoss` 部曲战损保护(×0.35) | ✅ | L21378, L21856 |
| 两处`applyAnnihilation` 全歼归零 | ✅ | L21401, L21882 |
| `killGen` 阵亡/处决→部曲归零 | ✅ | L20712 |
| 玩家/AI poachGen 叛逃→部曲归零 | ✅ | L6900, L12683 |
| `disbandUnit` 解散→部曲归零+红色警告 | ✅ | L28022 |
| `applyBattleExp` 胜方老兵晋升 | ✅ | L969 |
| `processReinforcement` garrison训练转化 | ✅ | L25309 |
| `_genInfluence` 部曲→派系影响力加成 | ✅ | L4753 |
| 武将详情面板显示部曲数 | ✅ | L17643 |
| 部队面板squad行显示部曲+有效等级 | ✅ | L27415 |
| TAB_HELP.mil 部曲帮助section | ✅ | L29117 |

#### 已知bug（~~下轮必修~~ ✅ v164已全部修复）

**Bug 1：billet后重编，pool辅兵自动变部曲** → ✅ v164：部曲独立pool条目绑genName，别人拿不到
**Bug 2：兵种不锁定导致套利** → ✅ v164：所有pool条目锁兵种，征兵/增编有部曲锁兵种

#### ~~下轮修复方案（已讨论确认，待实装）~~ ✅ v164已全部实装

**数据结构改为绑定兵种**：
```js
G.genRetainers = {
  '曹操': { count:2500, type:'cavalry' },
  '夏侯惇': { count:1800, type:'cavalry' },
  '关羽': { count:1500, type:'heavy' },
  // ...count=0或不在表里=无部曲
};
```

**存储精确值，显示整百**：
- `G.genRetainers`存精确数（如1723）
- UI和编制用`getRetainersDisplay = Math.floor(count/100)*100`（显示1700）
- 战斗计算用精确的`getRetainers`（1723）
- 老兵晋升积累到百位自然跳升

**Billet时一个squad拆两个pool条目**：
```js
// 曹操squad 3000人（含2500部曲）billet时：
{ troops:2500, type:'cavalry', genName:'曹操', level:10 }  // 部曲条目：绑定武将，别人不可用
{ troops:500,  type:'cavalry', genName:null,    level:5  }  // 辅兵条目：通用，兵种锁定
```

**重编逻辑**：
- 选了曹操 → 系统自动拉出pool里`genName==='曹操'`的条目 → 兵种锁定为cavalry → 再从pool补同兵种通用辅兵
- 曹操部曲打光了（count=0）→ 无专属条目 → 兵种自由选

**征兵逻辑**：
- 选了曹操且有部曲 → 兵种锁定为部曲兵种 → 征出来的新兵是辅兵，部曲自动计入有效等级

**开局**：有部曲但闲置的武将→部曲条目自动存入所属势力国都billetPool

**billetPool通用规则（同时修bug2）**：
- 所有pool条目锁定兵种（`type`字段），重编时只能用同兵种条目
- 部曲条目额外锁定武将（`genName`字段），只有指定武将可用

#### RETAINER_PRESET 兵种绑定（下轮实装时使用）

| 武将 | count | type | 史实 |
|------|-------|------|------|
| **魏** | | | |
| 曹操 | 2500 | cavalry | 曹家部曲/虎豹骑前身 |
| 曹仁 | 2000 | heavy | 曹氏宗族部曲，善守 |
| 夏侯惇 | 1800 | cavalry | 夏侯氏部曲 |
| 夏侯渊 | 1500 | cavalry | 同上 |
| 张辽 | 1200 | cavalry | 吕布旧部 |
| 徐晃 | 800 | heavy | 杨奉旧部 |
| 许褚 | 1000 | heavy | 虎痴率宗族来投 |
| 于禁 | 600 | heavy | 职业军人嫡系 |
| 曹洪 | 1000 | cavalry | 曹氏宗族 |
| **蜀** | | | |
| 刘备 | 1500 | cavalry | 起兵核心班底 |
| 关羽 | 1500 | heavy | 从徐州起有部曲 |
| 张飞 | 1200 | cavalry | 同上 |
| 赵云 | 800 | cavalry | 常山义从 |
| 魏延 | 600 | heavy | 部曲将出身 |
| 黄忠 | 500 | archer | 长沙旧部 |
| 马超 | 1000 | cavalry | 西凉旧部 |
| **吴** | | | |
| 孙权 | 2000 | heavy | 孙氏部曲 |
| 周瑜 | 1500 | cavalry | 江东核心 |
| 甘宁 | 800 | light | 锦帆贼旧部 |
| 凌统 | 600 | heavy | 父凌操部曲继承 |
| 程普 | 700 | cavalry | 孙坚旧部 |
| 黄盖 | 700 | heavy | 同上 |
| 吕蒙 | 500 | light | 后起之秀 |
| 陆逊 | 400 | light | 陆家族兵 |

### 四、v163变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v162.html（覆盖更新） |
| 总行数 | ~32449 → ~32670（+221行） |
| 存档版本 | 161 → 163 |
| 新增常量 | `CORVEE`(3档) / `RETAINER_LEVEL`/`RETAINER_PROTECT`/`RETAINER_INFLUENCE_DIV` / `RETAINER_PRESET`(25武将) |
| 新增字段 | `G.factions[fid].corveeId` / `G.genRetainers` |
| 新增函数 | `setCorvee()` / `getRetainers()` / `setRetainers()` / `getEffectiveSquadLevel()` |
| 改动函数 | `processBuildQueues`(徭役加速) / `processMorale`(徭役民心) / `processPop`(徭役质量) / `_squadBase`(部曲有效等级) / `applyLoss`×2(部曲战损) / `applyAnnihilation`×2(全歼归零) / `killGen`(归零) / `poachGen`×2(归零) / `disbandUnit`(归零+警告) / `applyBattleExp`(老兵晋升) / `processReinforcement`(训练转化) / `_genInfluence`(部曲影响力) / `renderLeft`(corvee行) / `showBreakdown`(两处tooltip) / 建筑列表UI(徭役标签) |
| TAB_HELP | 新增`policy`/`ai`条目，修改`stats` intro，`mil`新增部曲section |

### ~~下轮重点~~ → v164已完成

1. ~~**部曲系统重构**~~ ✅ v164实装
2. ~~**实测验证**：徭役三档切换~~ 待实测
3. ~~**实测验证**：部曲有效等级显示~~ 待实测

---

## v164 部曲系统重构 + 重编弹窗重写

### 一、部曲数据结构重构

**RETAINER_PRESET** 从纯数字改为 `{count, type}` 绑兵种（25武将，表格见v163 handover）。

**G.genRetainers** 存储格式统一为 `{ count: number, type: string }`：
```js
G.genRetainers = {
  '曹操': { count:2500, type:'cavalry' },
  '夏侯惇': { count:1800, type:'cavalry' },
  '关羽': { count:1500, type:'heavy' },
  // ...
};
```

**Helper函数变更**：

| 函数 | 变更 |
|------|------|
| `getRetainers(genName)` | 返回count，兼容旧存档纯数字格式 |
| `getRetainerType(genName)` | **新增**，返回部曲兵种（无部曲返回null） |
| `getRetainersDisplay(genName)` | **新增**，返回整百值（UI/编制显示用） |
| `setRetainers(genName, count, type?)` | 改为存`{count, type}`，type省略时保留原type |

**存档兼容**：`_deserializeG` 中自动迁移旧存档纯数字为 `{count, type}`（查RETAINER_PRESET补type）。

### 二、Billet拆双条目

玩家 `_confirmBillet` 和 AI `aiDoDisband` billet路径，每个squad拆成两个pool条目：

```js
// 曹操squad 3500人（含2500部曲骑兵）billet时：
{ troops:2500, type:'cavalry', genName:'曹操', level:10 }  // 部曲条目：绑武将，Lv10
{ troops:1000, type:'cavalry', genName:undefined, level:7 }  // 辅兵条目：通用，锁兵种
```

- 部曲条目：`genName`字段绑定武将，只有该武将可用；`level=RETAINER_LEVEL(10)`
- 辅兵条目：无`genName`，任何武将可用；兵种锁定为原squad兵种
- 全是部曲（无辅兵）→ 只生成部曲条目
- 全是辅兵（无部曲）→ 只生成辅兵条目

### 三、重编弹窗重写（核心改动）

**旧流程**（v163）：先选pool条目 → 再选将领。1 slot = 1 pool条目。
**新流程**（v164）：**先选将领** → 部曲自动绑定 → 可选同兵种辅兵合并。1 slot = 最多2个pool条目（部曲+辅兵合并成1个squad）。

**Slot数据结构**：
```js
{
  gen: null,           // 武将名（必须先选）
  retPoolIdx: -1,      // 部曲pool条目索引（有部曲武将自动填入，不可手动改）
  auxPoolIdx: -1,      // 辅兵pool条目索引（玩家手选，只显示同兵种通用条目）
  active: false,       // 副将slot是否启用
}
```

**交互流程**：
1. 城池tab点pool条目"编组" → 弹窗打开，根据条目类型预填（部曲条目预填gen+retPoolIdx，辅兵条目预填auxPoolIdx）
2. 武将列表中选将领 → 自动清空旧绑定 → 自动查找并绑定该武将的部曲条目 → 辅兵列表只显示同兵种通用条目
3. 选辅兵（可选）→ troops合并显示（如"部曲2500+辅兵1000 = 3500兵"）
4. 确认 → 两条目合并成1个squad（troops相加，maxTroops相加，level加权平均），两条目从pool中移除

**无部曲武将**：选将后retPoolIdx=-1，辅兵列表显示所有兵种（无锁定），选一条即可。

**新增函数**：

| 函数 | 说明 |
|------|------|
| `_rdpSlotInfo(slot, pool)` | 计算slot总兵力/兵种/等级/涉及的pool索引 |
| `_rdpPickAux(slotIdx, poolIdx)` | 辅兵条目选择/取消 |

**改动函数**：

| 函数 | 改动 |
|------|------|
| `openRedeployModal` | 预填逻辑改为根据条目类型分支 |
| `_renderRedeployModal` | 完全重写：将领列表在上（显示部曲标签），辅兵列表在下（部曲自动绑定金框） |
| `_rdpPickGen` | 清空旧绑定→自动绑部曲条目 |
| `_rdpToggleSub` | 清空改为gen+retPoolIdx+auxPoolIdx三字段 |
| `_confirmRedeploy` | 用`_rdpSlotInfo`合并，genName校验兜底，removeIndices去重 |

**删除函数**：`_rdpPickPool`（旧的单条目选择，已被`_rdpPickAux`替代）

### 四、征兵/增编兵种锁定

**征兵弹窗**：
- `rmPickGen`：选有部曲武将 → 自动设定兵种为部曲type
- `rmPickType`：有部曲锁定时阻止切换 + showNotif提示
- `troopRow`：非锁定兵种opacity:0.4+pointer-events:none，锁定兵种显示🔒标签

**增编分队弹窗**：
- `asPickGen`：同上自动锁兵种
- `asPickType`：同上阻止切换
- type cards：非锁定兵种opacity:0.35+cursor:not-allowed

### 五、开局闲置武将部曲→国都billetPool

`initGame`末尾（renderAll之前），遍历`G.genRetainers`，找未编入任何unit的武将，将其部曲条目自动存入所属势力国都的billetPool：
```js
capital.billetPool.push({
  troops: count, maxTroops: count,
  type: retainerType, level: RETAINER_LEVEL,
  billetTurn: 0, readyTurn: 0,
  genName: genName,  // 绑定武将
});
```

### 六、UI改动

| 位置 | 改动 |
|------|------|
| 武将详情面板 | 部曲数改用`getRetainersDisplay`整百显示 + 显示部曲兵种图标 |
| 部队面板squad行 | 部曲数改用`getRetainersDisplay` |
| 解散警告 | 部曲数改用`getRetainersDisplay` |
| 城池tab billetPool列表 | 部曲条目显示`🔒武将名`标签 |
| 军事tab billetPool汇总 | 同上 |
| 征兵弹窗兵种格 | 部曲锁定兵种显示🔒标签，其余灰掉 |
| 增编分队兵种格 | 同上 |
| 重编弹窗 | 武将卡片显示部曲数+兵种图标 |

### 七、Bug修复

| # | 严重度 | 位置 | 问题 | 修复 |
|---|--------|------|------|------|
| 1 | 高 | `_confirmBillet` / `aiDoDisband` | billet后部曲不入pool（v163临时处理） | 拆双条目，部曲也入pool |
| 2 | 高 | 征兵/增编/billetPool | 兵种不锁定，可billet套利 | 全链路兵种锁定 |
| 3 | 高 | 重编弹窗 | 部曲条目可被非对应武将选用 | 弹窗重写为gen-first，三重防护 |
| 4 | 中 | `confirmExpand` | 征兵惩罚系数不一致（×30 vs ×100/120） | 统一为×100/×120 |

### 八、AI重编路径

AI在`aiDoRecruit`中的billetPool重编路径独立于玩家弹窗，采用简化逻辑：
- 优先找有对应闲置武将的部曲条目（genName匹配）
- 找不到则选最高等级的通用条目+最佳闲将
- **当前AI不合并部曲+辅兵**（每次只取一条pool条目创建squad），后续可优化

### 九、v164 通商·通使·海外贸易

#### 设计背景（三国经济史）

三国时期贸易高度政治化。蜀锦是蜀汉的国家战略物资和军费支柱，蜀吴之间的"交聘互市"伴随外交使节进行。孙吴利用海上优势发展海外贸易（番禺、建业为主港）。曹魏因董卓毁五铢钱后货币经济崩溃，长期以谷帛为货币。势力间贸易本质上是外交关系的经济表达。

#### 1. 互市系统（外交面板）

**核心机制**：对非敌对势力（rel≥30）购买其特产资源。按钮显示在外交面板送礼行下方。

**交易菜单**（基于对方城市tags自动生成）：

| 对方有tag | 可买资源 | 花费 | 获得 |
|----------|---------|------|------|
| 产马 | 马匹 | 800金 | 500马 |
| 产铁 | 铁矿 | 600金 | 400铁 |
| 产木 | 木材 | 500金 | 350木 |

**开局供需格局**：

| 玩家 | 对魏可买 | 对蜀可买 | 对吴可买 |
|------|---------|---------|---------|
| 蜀 | 马匹、铁矿 | — | 铁矿、木材 |
| 魏 | — | 马匹、木材 | 铁矿、木材 |
| 吴 | 马匹、铁矿 | 马匹、木材 | — |

**限制**：每势力每季度（9旬CD）最多互市一次。消耗本旬外交行动次数（与送礼互斥）。

**情报副产出**：交易成功后揭雾对方**资源城**（对应tag的第一座城），持续2旬visible。通过`scoutReveals`管道实现（复用细作探报的持续揭雾函数）。

**UI**：按钮文字"🐴 购马匹·800金"，悬停title显示"花费800金，获得马匹500（附带情报）"。好感+2。

**新增函数**：

| 函数 | 说明 |
|------|------|
| `_getTradeOffers(sellerFid)` | 根据卖方城市tags生成可售资源列表 |
| `_findTradeCity(sellerFid, cityTag)` | 找卖方拥有某tag的第一座城市（揭雾用） |
| `diploTrade(target, resKey)` | 互市主函数：扣金+加资源+揭雾+好感+CD |

**数据结构**：`G._tradeCD = { 'fid_target': expiresAtTurn }`

#### 2. 通使系统（计谋Tab）

**核心机制**：花600金对非敌对势力（rel≥20）派遣使者。成功率基于军师INT（base 65%，复用`_strategyRate`）。

**成功效果**：
- 好感+8~12
- 揭雾对方**首都**，持续3旬visible
- **下旬**弹出情报弹窗（使者归来需要时间）

**失败效果**：好感-5，退300金

**CD**：8旬。放在计谋Tab底部，细作探报下方。

**情报弹窗内容**（纯叙事，无精确数字）：

```
📜 使者归报：

蜀汉当前拥城10座。野战兵力尚可，约万余众，国用尚可维持，各城粮草无虞。
主力部队集结于汉中方向。
```

描述级别对照表：

| 维度 | 条件 | 描述 |
|------|------|------|
| 兵力 | ≥40k | 兵力雄厚，野战大军数万 |
| | ≥20k | 野战兵力尚可，约万余众 |
| | ≥8k | 野战兵力有限，不过数千 |
| | <8k | 野战兵力薄弱 |
| 财政 | goldNet>200 | 府库充盈，金帛有余 |
| | >0 | 国用尚可维持 |
| | >-100 | 财政略有吃紧 |
| | ≤-100 | 入不敷出，国库虚竭 |
| 粮草 | 全城有粮 | 各城粮草无虞 |
| | 有城缺粮 | 部分城池粮草告急 |
| 部队 | 找兵力最大的部队 | 主力部队集结于{最近城市}方向 |

**弹窗时序**：派出当旬日志显示"使者已派出，静候回报"；下旬nextTurn时弹出情报弹窗（插入弹窗链末端：战报→俘虏→求和→附庸→朝议→**通使情报**）。

**新增函数**：

| 函数 | 说明 |
|------|------|
| `stratEnvoy(targetFid)` | 通使主函数：扣金+判定+好感+揭雾+pending |
| `_buildEnvoyIntel(fid, targetFid)` | 生成模糊叙事情报文本 |
| `_showEnvoyIntelModal(targetFid, intelText)` | 显示情报弹窗（固定z500遮罩） |

**数据结构**：`G._pendingEnvoyIntel = [{ targetFid, turn }]`；`G.strategyCD[fid].envoy`

#### 3. 海外贸易建筑（商港/榷场/马市）

**核心机制**：新建筑`tradepost`，只有符合条件的城市可建。按城市tag自动匹配名称和图标。

**建筑定义**（BLDS.tradepost）：

| 等级 | 金产加成 | 建设成本 | 工期 |
|------|---------|---------|------|
| Lv1 | +15% | 金1000木600 | 3旬 |
| Lv2 | +25% | 金1800木1000 | 4旬 |
| Lv3 | +35% | 金2800木1600 | 5旬 |

**城市→建筑名称映射**（`_canBuildTradePost`优先级：港口>产木>产马）：

| 城市tag | 建筑名 | 图标 | 可建城市（初始） |
|--------|--------|------|----------------|
| 港口 | 商港 | 🚢 | 建业/京口/会稽/武昌/柴桑/番禺/北海/广陵（8城） |
| 产木（非港口） | 榷场 | 🏬 | 巴中/夷陵/交州/建宁/零陵（5城） |
| 产马（非港口非产木） | 马市 | 🐎 | 河东/蓟城/晋阳/姑臧/武威/成都/北平（7城） |

**势力优势分布**：吴8座商港（海外贸易最强）、蜀3榷场+1马市、魏5马市+2商港。

**技术实现**：
- `restrict:['_tradepost']`虚拟tag，在buildBld/AI建设评分/建筑列表渲染三处钩入`_canBuildTradePost()`
- 金产乘数`_tpMod`在`getCityProd`中计算并乘入gold公式
- 金产tooltip（`showBreakdown`）显示tradepost加成行
- AI评分（`scoreBld`）独立case，逻辑同harbor

**新增常量/函数**：

| 名称 | 说明 |
|------|------|
| `TRADE_POST_NAME` | 城市tag→{name,icon,desc}映射 |
| `_canBuildTradePost(cityId)` | 判断城市是否可建+返回名称信息 |

#### 4. 代码改动汇总

| 位置 | 改动 |
|------|------|
| BLDS常量 | +tradepost建筑定义（restrict:'_tradepost'） |
| initGame | +`G._tradeCD`初始化、strategyCD加envoy |
| getCityProd | +`_tpLv`/`_tpMod`金产乘数 |
| buildBld restrict | +`_tradepost`虚拟tag注入 |
| aiDoBuild scoreBld | +虚拟tag + tradepost评分case |
| 建筑列表渲染 | +虚拟tag + 动态名称/图标（`_tpInfo`） |
| 建设队列显示 | 动态tradepost名称 |
| buildBld日志 | 动态tradepost名称 |
| showBreakdown(gold) | +tradepost加成行 |
| renderDipTab | +互市按钮行（IIFE，带tooltip） |
| renderSchemeTab | +通使区块（非敌对势力列表+sBtn） |
| tickStrategyCDs | +envoy递减 |
| nextTurn（快进） | 清空`_pendingEnvoyIntel` |
| nextTurn（弹窗链） | +通使情报弹窗（链末端） |
| backToTitle | +`_envoyModal` DOM清理 |
| _deserializeG | +旧存档兼容（_tradeCD/envoy CD/_pendingEnvoyIntel） |
| _serializeG | version 163→164 |

**新增函数7个**：`_getTradeOffers` / `_findTradeCity` / `diploTrade` / `_buildEnvoyIntel` / `_showEnvoyIntelModal` / `stratEnvoy` / `_canBuildTradePost`

**总计+280行**（32900→33180），无删减现有代码。

#### 5. 存档兼容

旧存档加载时自动补：`G._tradeCD={}`、`G._pendingEnvoyIntel=[]`、各势力`strategyCD.envoy=0`。

### 下轮重点

1. **实测验证**：互市按钮显示/购买/揭雾/CD
2. **实测验证**：通使成功/失败+下旬弹窗
3. **实测验证**：商港/榷场/马市建设+金产加成
4. **AI互市/通使**：当前只有玩家可操作，AI不会主动互市/通使（可后续补）
5. **武将技能批量实装**：~85处待实装
6. **系统完整性**：E1水战 / E2特色兵种 / E3科技树


### 十、v165 通商协定系统（Trade Agreement）

#### 设计背景

v164互市本质是"一次性资源买卖"（花金买马/铁/木），非持续性贸易关系。v165新增"通商协定"，是外交关系的经济表达——两个非敌对势力缔结通商后，**双方每旬持续获得金币收入**，金额取决于对方城市规模。蜀吴联盟期间长期互通有无（蜀锦换吴铁）即为此类协定的史实原型。

#### 1. 核心机制

**缔结条件**：
- 双方外交关系非敌对（中立/同盟均可）
- 友好度 ≥ 50
- 双方均非附庸
- 花费500金（发起方支付）
- 每势力最多同时维持2个通商协定

**每旬收入公式**：
```
通商收入 = 对方城市数 × 5 × 同盟加成(×1.2) × 商港加成
```

**商港/榷场/马市联动**：己方最高tradepost等级 → 通商收入额外+10%/15%/20%（Lv1/2/3）。

**数值验算**（开局）：

| 通商对 | 蜀每旬得 | 吴每旬得 | 占金产比 |
|--------|---------|---------|---------|
| 蜀-吴（盟友×1.2） | 78 | 60 | ~10-12% |
| 魏-蜀 | 50 | 105 | ~8% / ~7% |
| 魏-吴 | 65 | 105 | ~5% / ~12% |

签约金500 ÷ 每旬50-78 ≈ 7-10旬回本。

#### 2. 终止机制（被动防御设计）

**不在宣战处逐个钩入**（容易遗漏），而是在每旬`_cleanTradeAgreements()`中**实时检查**，自动移除失效协定：

| 终止条件 | 触发 |
|---------|------|
| 任何一方宣战（status=enemy） | 结算时检查，自动移除+日志 |
| 友好度跌破20 | 结算时检查，自动移除+日志 |
| 任何一方灭国（城数=0） | 结算时检查，自动移除+日志 |
| 玩家主动中止 | 外交面板按钮，好感-8，信誉-3 |

#### 3. AI行为

- 每6旬评估一次（与外交3旬错开）
- 条件：非附庸、未满2协定、金≥1000（留余量）、rel≥55（比玩家严格）
- 优先选城市数最多的候选（更多通商收入）
- 30%概率执行（避免AI开局齐刷刷签约）

#### 4. UI改动

| 位置 | 改动 |
|------|------|
| 外交面板每个势力条目 | 互市按钮行下方新增通商行：未签约显示"🤝 缔结通商·500金"，已签约显示"📦 通商中（+XX金/旬）"+❌中止按钮 |
| 统计Tab金产breakdown | 新增"🤝 通商收入 +XX/旬"行 |
| 顶部势力栏金净 | goldNet计算含通商收入 |
| 通使情报goldNet | 含通商收入（更准确） |

#### 5. 新增常量

| 常量 | 值 | 说明 |
|------|---|------|
| `TRADE_AGR_COST` | 500 | 签约金 |
| `TRADE_AGR_REL_MIN` | 50 | 缔结最低好感 |
| `TRADE_AGR_REL_BREAK` | 20 | 自动中断阈值 |
| `TRADE_AGR_PER_CITY` | 5 | 每城每旬金币 |
| `TRADE_AGR_ALLY_MULT` | 1.2 | 同盟加成 |
| `TRADE_AGR_MAX` | 2 | 每势力最多同时维持数 |

#### 6. 新增函数（7个）

| 函数 | 说明 |
|------|------|
| `getTradeAgreements(fid)` | 查询fid当前通商协定列表 |
| `hasTradeAgreement(fid, target)` | 查询双方是否有通商 |
| `calcTradeAgrIncome(fid)` | 计算fid每旬通商收入（含同盟+tradepost加成） |
| `_cleanTradeAgreements()` | 结算前清理失效协定（敌对/rel<20/灭国） |
| `diploTradeAgreement(target)` | 玩家缔结通商 |
| `cancelTradeAgreement(target)` | 玩家中止通商 |
| `aiDoTradeAgreement(fid)` | AI通商决策 |

#### 7. 数据结构

```js
G._tradeAgreements = [
  { factions: ['shu','wu'], since: 42 },  // 第42旬签订
];
```

#### 8. 代码改动汇总

| 位置 | 改动 |
|------|------|
| initGame | +`G._tradeAgreements=[]` |
| processFacEconomy | +`calcTradeAgrIncome`加入金产 |
| nextTurn | +`_cleanTradeAgreements()`清理 |
| AI turn (runAISingle) | +`aiDoTradeAgreement` 每6旬 |
| renderDipTab | +通商按钮行（已签约/未签约两态） |
| showFacBreakdown(gold) | +通商收入行 |
| 顶部势力栏goldNet | +通商收入 |
| _buildEnvoyIntel goldNet | +通商收入 |
| _deserializeG | +旧存档兼容 `G._tradeAgreements=[]` |
| _serializeG | version 164→165 |

**总计+201行**（33179→33380），无删减现有代码。

#### 9. 存档兼容

旧存档加载时自动补：`G._tradeAgreements = []`。

#### 10. 审计中发现并修复的5个潜在bug

| # | 问题 | 修复 |
|---|------|------|
| 1 | 附庸通商套利（南蛮签通商→纳贡抽成给蜀=蜀白嫖） | 附庸不可缔结通商 |
| 2 | 灭国后协定残留脏数据 | _cleanTradeAgreements过滤城数=0 |
| 3 | 宣战有4条路径，逐个钩入易遗漏 | 改为结算时实时检查status（被动防御） |
| 4 | 同盟加成需实时跟踪解盟 | 结算时实时查d.status，不缓存 |
| 5 | 中止通商用了不存在的_credibility字段 | 改用G.reputation[fid]（现有信誉度系统） |

### 下轮重点

1. **实测验证**：通商按钮显示/缔结/中止/收入结算/AI缔结
2. **实测验证**：终止机制（宣战/rel跌破20/灭国三条路径）
3. **实测验证**：tradepost联动通商收入加成
4. **AI互市/通使**：当前只有玩家可操作（可后续补）
5. **武将技能批量实装**：~85处待实装

### 十一、v165 帮助文本全面改进

#### 1. 所有公式移除

扫描并移除TAB_HELP中所有具体公式和数值，改为定性描述：

| 原内容 | 改为 |
|--------|------|
| `squadATK = 兵力 × 等级乘数 × 士气乘数 × ...` | 定性列举10个影响因素，说明乘数关系 |
| `S=1.20 / A=1.10 / B=1.00 / C=0.88` | "适性越高加成越大" |
| `com/200（统帅90→0.45加成）` | "统帅越高带兵越强" |
| `每旬Δ = 基础(-0.5) + 魅力修正 + ...` | 分项列举影响因素，无数值 |
| `基础腐败率 = min(30%, ...)` | "城池超过阈值后腐败逐增" |
| 补员速率 `200 × 0.68 ≈ 136兵/旬` | "前线补员显著慢于后方" |
| 兵种ATK/DEF系数表 | 改为定位/优势/劣势定性表 |

#### 2. 每个Tab新增「💡 操作指引」section（共10个Tab）

告诉玩家具体操作流程：城池（查看/建设/太守/征兵/豪族）、军事（选中/移动/扎营/伏击/攻城）、外交（送礼→互市→通商→状态操作四层按钮）、计谋（施计/军师/通使）等。

#### 3. 新增贸易系统说明

| 位置 | 新增 |
|------|------|
| 外交Tab帮助 | 「互市（一次性买卖）」section + 「通商协定（持续贸易）」section |
| 计谋Tab帮助 | 计谋表新增通使行 + 「通使详解」section |
| 城池Tab帮助 | 商港/榷场/马市说明 |
| 新手引导Page5 | 「互市与通商」+「通使（情报）」展开块 |

#### 4. 军事Tab战力说明重写

原「战力计算公式」→「战力影响因素」，改为定性描述10个乘数因素，不暴露数值。兵种表从ATK/DEF系数改为定位/优势/劣势。

### 十二、v165 休整屯田机制（改名 + 粮产加成 + 科技）

#### 设计背景

原billet系统是纯"兵员冷藏库"。现新增屯田效果并全面改名为"休整屯田"。

#### 改名

13处玩家可见UI文本"休整"→"休整屯田"：按钮、弹窗标题/描述、日志、帮助文本、新手引导等。

#### 机制

- **只影响粮产**，不影响金/木/铁/马
- 基础效率×2，研究「军屯精耕」科技后×3
- `foodPopMult = (effPop + billetTroops × 效率) / 250000`，仅用于food行

#### 新科技节点

| ID | 名称 | 前置 | 花费 | 工期 | 效果 |
|----|------|------|------|------|------|
| econ11 | 军屯精耕 | econ8(屯田制) | 金1500木400 | 12旬 | 屯田效率×2→×3 |

经济分支从10节点增至11节点。

#### 数值验算

| billet兵力 | 基础(×2) | 有科技(×3) | 中城粮产变化 |
|-----------|---------|-----------|------------|
| 5000 | +10000 → +7% | +15000 → +10% | 有感 |
| 10000 | +20000 → +14% | +30000 → +21% | 显著 |

#### 代码改动

| 位置 | 改动 |
|------|------|
| TECH_TREE | +econ11军屯精耕节点 |
| `getCityProd` | _tuntianMult根据科技动态取2或3 |
| `showBreakdown` | 屯田兵行显示动态倍率+科技标识 |
| 13处UI文本 | "休整"→"休整屯田" |
| Claude AI tech summary | +econ11 |

---

## v166 迁民系统 + 产粮软上限

### 设计动机

模仿曹操迁武都人口——战略性放弃前沿领土时以极高代价迁走当地人口，削弱敌方占领后的收益。只鼓励玩家在预判即将丢城时使用，日常治理中因代价过高而不适合频繁使用。

配套改动：产粮人口封顶在承载力，去掉人口硬钳位。让城市土地禀赋成为人口的天然软上限——超标人口只吃饭不种田，粮荒自然逼退多余人口。

### 一、产粮软上限（配套改动，2处）

#### 1. 产粮人口封顶（getCityProd）

```js
const effPopForFood = Math.min(effPop, getCityCap(city) * (city.popQuality / 100));
const foodPopMult = (effPopForFood + _tuntianPop) / 250000;
```

**物理含义**：城市土地面积有限，产粮劳动力不超过承载力对应的人口。超出部分只消耗粮食（耗粮仍按实际pop计算）。金/木/铁/马产出不受影响（仍用原effPop）。

#### 2. 去掉人口硬钳位（processPop）

```
旧：city.pop = Math.max(25000, Math.min(cap, city.pop + pd));
新：city.pop = Math.max(25000, city.pop + pd);
```

**效果**：人口可临时超过承载力。logistic公式在pop>cap时自然负增长（`1-pop/cap`为负），加上超标人口不产粮→粮荒→饥荒流失（`pop×0.001/旬`），形成双重软刹车。

**影响评估**：正常游戏流程中人口几乎不可能自然超cap（logistic增长在接近cap时已极慢），唯一超cap途径是迁民外部注入。

### 二、迁民系统核心机制

#### 前置条件

| 条件 | 说明 |
|------|------|
| 来源城 | 己方城市 |
| 目的城 | 己方城市，`ROAD_ADJ`直连（邻城） |
| 安全检查 | 双城各自2hex内无敌方部队 |
| 冷却 | 来源城6旬冷却（`city._migrateCooldown`） |
| 每旬限制 | 玩家每旬仅1次（`G._migratedThisTurn`） |

#### 迁移量与损耗

- 滑动条选择20%-80%的来源城人口
- 固定40%途中损耗（`MIGRATE_LOSS_RATE = 0.40`）
- 迁10万人→6万到达，4万途中流失

#### 惩罚（与人口比例挂钩）

**来源城**（以50%迁出为基准缩放）：

```
srcScale = ratio / 0.50
民心: -15 × srcScale    质量: -10 × srcScale    存粮: -20% × srcScale
```

**目的城**（以30%涌入比为基准缩放）：

```
dstRatio = 到达人口 / 目的城迁入前人口
dstScale = dstRatio / 0.30
民心: -8 × dstScale     质量: -5 × dstScale
```

#### 属县/士族联动

| 场景 | 来源城属县 | 目的城属县 |
|------|----------|----------|
| 跨地域 | 全县-8×srcScale，clan_base额外-3 | 全县-5×dstScale，clan_base额外-2 |
| 同地域 | 全县-5×srcScale，clan_base额外-3 | 全县-3×dstScale |

#### Ethos冲击

- `civil` +3（文治→暴政）
- `military` +1（怀柔→铁血）

### 三、AI迁民逻辑

AI在以下条件全部满足时迁民：
1. 城市被围城≥3旬
2. 城市人口≥100k
3. 有安全的己方邻城
4. 性格非reckless
5. Ethos不偏仁政（civil > -20）

AI固定迁50%，选人口最多的邻城为目的地。每旬最多迁一城。

### 四、UI设计

**入口**：城池详情Tab，征兵按钮旁新增「⇄ 迁民」按钮。冷却中/不安全/无邻城时灰色+原因提示。

**弹窗**：
- 目的地下拉（列出合法邻城+人口数）
- 滑动条20%-80%，实时更新所有数字
- 来源城影响区：人口变化、民心/质量/存粮/属县惩罚（红字）
- 目的城影响区：人口变化、涌入比、民心/质量/属县惩罚、粮食可撑旬数预估
- 势力影响：ethos冲击、跨地域警告
- 确认/取消按钮

### 五、新增常量

| 常量 | 值 | 说明 |
|------|---|------|
| `MIGRATE_MIN_RATIO` | 0.20 | 最低迁出比例 |
| `MIGRATE_MAX_RATIO` | 0.80 | 最高迁出比例 |
| `MIGRATE_LOSS_RATE` | 0.40 | 途中损耗率 |
| `MIGRATE_COOLDOWN` | 6 | 来源城冷却旬数 |
| `MIGRATE_SRC_BASE` | {morale:-15, quality:-10, storagePct:-0.20} | 来源城基准惩罚 |
| `MIGRATE_DST_BASE` | {morale:-8, quality:-5} | 目的城基准惩罚 |
| `MIGRATE_COUNTY_CROSS` | {src:-8, dst:-5} | 跨地域属县冲击 |
| `MIGRATE_COUNTY_SAME` | {src:-5, dst:-3} | 同地域属县冲击 |
| `MIGRATE_CLAN_BASE_EXTRA` | {src:-3, dst:-2} | clan_base额外冲击 |
| `MIGRATE_ENEMY_CHECK_RANGE` | 2 | 安全检查hex范围 |

### 六、新增函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `canMigrate(srcCityId)` | ~5884 | 前置条件检查，返回{ok,reason} |
| `getMigrateTargets(srcCityId)` | ~5905 | 获取合法目的城列表 |
| `executeMigration(src,dst,ratio)` | ~5921 | 执行迁民（扣人口+惩罚+属县+ethos） |
| `showMigrateDialog(srcCityId)` | ~5984 | 弹窗UI（滑动条+双城预览） |
| `_aiConsiderMigration(fid)` | ~6114 | AI迁民决策 |

### 七、改动函数

| 函数 | 改动 |
|------|------|
| `getCityProd` (~5773) | foodPopMult改用`Math.min(effPop, cap*质量)`封顶，仅影响产粮 |
| `processPop` (~6334) | 去掉`Math.min(cap,...)`硬钳位 |
| `showPopBreakdown` (~20214) | 超载时显示"⚠超载：超出人口只吃不产"警告 |
| `_renderCityDetail` (~17921) | 新增迁民按钮（征兵按钮后） |
| `nextTurn` 城市循环后 (~15449) | 重置`G._migratedThisTurn` |
| `nextTurn` AI块 (~12666) | 调用`_aiConsiderMigration(fid)` |
| `initGame` (~5507) | 初始化`G._migratedThisTurn` |
| `_deserializeG` (~29869) | 旧存档兼容`G._migratedThisTurn` |

### 八、存档兼容

- `city._migrateCooldown`：旧存档无此字段，`canMigrate`中`||0`默认不在冷却
- `G._migratedThisTurn`：`_deserializeG`中默认false，`initGame`中初始化

### v166 变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v165.html → project_romance_v166.html |
| 标题 | v1.6.1 → v1.6.6 |
| 存档版本 | 165 → 166 |
| 总行数 | ~33401 → ~33744（+343行） |
| 新增常量 | 10个MIGRATE_*常量 |
| 新增函数 | 5个（canMigrate/getMigrateTargets/executeMigration/showMigrateDialog/_aiConsiderMigration） |
| 改动函数 | 8个（getCityProd/processPop/showPopBreakdown/_renderCityDetail/nextTurn×2/initGame/_deserializeG） |
| 侵入性 | 中——产粮公式和人口钳位有改动，但仅影响超承载力场景 |
| 存档兼容 | 完全兼容 |

### 下轮测试重点

1. **迁民功能验证**：选城→滑动条→确认→人口/民心/质量/属县变化正确
2. **产粮软上限验证**：手动迁大量人口到小城，观察粮荒→饥荒→人口自然回落
3. **AI迁民验证**：围城AI城市≥3旬，观察AI是否执行迁民
4. **快进稳定性**：快进50旬无崩溃
5. **正常游戏不受影响**：非迁民场景下人口增长曲线与v165一致

### 九、饥荒流失改为缺口比例制（配套改动）

**旧机制**：存粮归零后，固定 `pop × 0.001/旬` 流失。300k城每旬死300人，500旬死一半——毫无饥荒感。

**新机制**：
```
缺口比 = min(1, 粮食缺口 / 总耗粮)     // 吃不上饭的人口比例
饥荒死亡 = pop × 缺口比 × 0.05           // 挨饿人口每旬死5%
```

**效果对比**：

| 场景 | 缺口比 | 旧机制 | 新机制 |
|------|--------|--------|--------|
| 超载迁民后（产49耗137） | 64% | 329人/旬 | 10,500人/旬 |
| 正常小缺口（产120耗130） | 7.7% | 300人/旬 | 1,150人/旬 |
| 极端断粮（产0耗120） | 100% | 300人/旬 | 15,000人/旬 |

**核心特性**：缺口越大死得越快，人口减少→耗粮降→缺口收窄→死亡减缓→最终稳定在产粮能养活的水平。自调节闭环。

**改动位置**：
- `processPop`（~6343）：3行替换
- `showPopBreakdown`（~20252）：UI显示缺口百分比

**影响范围**：只影响存粮已归零的城市。正常运营有存粮的城完全不受影响（调粮系统会补给缺粮城）。

### 十、科技 civ10 徙民实边

| 字段 | 值 |
|------|---|
| ID | `civ10` |
| 名称 | 徙民实边 |
| 分支 | 民生 |
| 前置 | `civ5`（地方自治） |
| 花费 | 金1200 + 木500 |
| 研究旬数 | 12 |
| 属性 | pol |
| 效果 | `migrateLossReduce: 0.10`（损耗率-10个百分点，40%→30%）+ `migrateDstPenReduce: 0.30`（目的城民心/质量惩罚×0.70） |

**设计意图**：来源城惩罚不减免（焦土的代价由被迁城承受），科技只帮助目的城更好地安置涌入人口。损耗下限10%（再怎么组织也有路途损失）。

**接入点**：`executeMigration`（玩家+AI共用）、`showMigrateDialog`（UI预览）、`_aiConsiderMigration`（AI独立路径）。三处均通过 `getTechEffect` 读取，自动缓存。

### 十一、"超载"概念移除

- 迁民弹窗：去掉目的城"超承载X%"红色警告
- 人口弹窗：`承载上限` → `产粮上限`，超出提示从红色"⚠超载"改为中性"超出部分不参与生产"
- `getCityCap` 保留但含义变更：不再是人口天花板，而是"产粮劳动力上限"——决定城市土地最多能让多少人种田

### Sprint 总状态

| Sprint | 状态 |
|--------|------|
| A 战斗深度 | ✅ 已关闭 |
| B 武将深度 | ✅ 已关闭 |
| C 战略层博弈 | ✅ C3宣称✅ C4迷雾✅ C5补给线✅ |
| D 养成与沉浸 | ✅ 已关闭 |
| E 系统完整性 | ⏳ 未开始 |
| F 内容扩展 | ✅ v87新增13将+title重做 |
| G AI优化 | ✅ 全部完成 |
| H UX优化 | ✅ 全部完成 |
| I 内政深化 | ✅ 全部完成 v166: 迁民系统✅ **v168: 内政概览✅（左面板朝堂行+派系Tab六区重构+预警+空缺）** |
| J 技能框架 | ✅ v106完成 |
| K 经济再平衡 | ✅ **v166: 人口增长改革✅ 产粮封顶✅ 饥荒缺口比例✅ 去硬钳位✅** |
| L 迁民系统 | ✅ **v166新增：迁民+科技civ10+人口经济改革** |

---

## v167 冷审修复（12项）

### 来源

v166冷审报告（独立新对话逐行代码审读），21项发现，确认有效12项，设计确认/搁置9项。

### 修复清单

| # | 冷审编号 | 优先级 | 问题 | 修法 | 行号 |
|---|---------|--------|------|------|------|
| 1 | P0 #1 | P0 | 版本号三处不一致（v1.6.6/v1.6.1/v150） | 全部统一为v1.6.7/v167 + 存档version=167 | L6,L536,L547,L30045,L29824 |
| 2 | P1 #2 | P1 | AI单挑双重roll，触发概率被平方压缩（60%→36%） | 重构为单次roll+关羽补救分支 | ~L24465 |
| 3 | P1 #3 | P1 | AI迁民选人口最多邻城（应选粮食最充裕） | 排序改用`getCityFoodTurns`降序 | L6176 |
| 4 | P1 #4 | P1 | 非粮资源popMult未封顶（超承载力无上限刷金） | effPop→effPopCapped（`Math.min(effPop, cap)`） | L5773 |
| 5 | P1 #5 | P1 | 忠诚"同僚关系"遍历全天下所有势力将领 | `Object.values(G.generals).flat()`→`G.generals[fid]`/`gens`（calcLoyaltyDelta+processLoyalty两处） | L12833,L12902 |
| 6 | P1 #6 | P1 | 读档后`_pendingPeaceOffer`/`_pendingVassalOffer`被v150fix清空 | 删除读档路径中的`=null`（保留meta恢复值） | L29887-88 |
| 7 | P2 #8 | P2 | 重伤冷却`<=`判断多1旬 | `G.turn <= until`→`G.turn < until`（checkWounded+isGenWounded两处） | L21616,L21625 |
| 8 | P2 #9 | P2 | AI迁民未设`G._migratedThisTurn`全局标志 | 入口加`if(G._migratedThisTurn) return` + 执行后`=true` | L6129,L6218 |
| 9 | P2 #10 | P2 | AI迁民属县惩罚缺`srcScale`缩放 | `cMod.src`→`cMod.src * srcScale`（含clan_base） | L6210 |
| 10 | P3 #13 | P3 | 黄盖"苦肉"几乎永远触发（troops<maxTroops恒true） | 阈值改为`troops < maxTroops * 0.70`（70%以下触发） | L22973 |
| 11 | P3 #16 | P3 | 价值观日志只保留30条（3-6旬即满） | 30→100 | L15181 |
| 12 | P3 #21 | P3 | `_defBonus`清理代码冗余（全量delete后再单独delete） | 删除冗余的庞德单独清理行 | L23240-41 |

### 设计确认（不修）

| 冷审编号 | 问题 | 决定 | 理由 |
|---------|------|------|------|
| P2 #7 | 扣粮像素距离vs补给hex距离 | 降P3观察 | 实际影响极小，两套距离极少给出不同最近城 |
| P2 #11 | 腐损在当旬产出后计算 | 设计确认 | 有意惩罚屯粮大城 |
| P3 #12 | 存档体积逼近5MB | 搁置 | 潜在风险非现存bug |
| P3 #14 | 97个SKILL_INLINE技术债 | 已知 | 长期迁移计划，不急 |
| P3 #15 | 外交阈值旬内无联动 | 不修 | 边缘case，"同时发生互不影响"合理 |
| P3 #17 | 战斗随机波动±3倍 | 不修 | 正态分布极端case概率极低 |
| P3 #18 | 兵力比修正精度 | 不修 | 影响可忽略 |
| P3 #19 | _deepCloneGen名不副实 | 搁置 | 纯命名，当前无功能影响 |
| P3 #20 | 弹窗7层if嵌套 | 已知技术债 | 改为队列调度属重构任务 |

### 冷审方法论记录

本轮冷审质量显著高于v149（误报率~0% vs v149的20-40%）。21项发现中12项确认有效，9项为设计选择/技术债/可忽略精度问题，无明显误报。

### v167 变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v166.html → project_romance_v167.html |
| 总行数 | ~33790 → ~33797（+7行净增，含注释） |
| 修复总数 | 12项（P0×1 / P1×5 / P2×3 / P3×3） |
| 改动函数 | `getCityProd`（popMult封顶）、`calcLoyaltyDelta`（同僚遍历）、`processLoyalty`（同僚遍历）、`_aiConsiderMigration`（目的城+全局标志+srcScale）、`_aiPickDuelGen`（双重roll）、`checkWounded`+`isGenWounded`（off-by-one）、`_deserializeG`（pending offer保留）、`resolveBattle`清理段（冗余删除+黄盖阈值）、`applyEthosShock`（日志扩容） |
| 存档版本 | 166→167 |
| 存档兼容 | 完全兼容（纯逻辑修复，无新数据字段） |

### 待办事项（下轮）

**优先级1 — 浏览器实测v167**：
1. AI单挑频率验证：快进10旬观察AI叫阵是否比v166明显增多
2. 读档验证：存档时有pending求和→读档→确认弹窗正常弹出
3. 重伤验证：武将受伤后恰好6旬解除（非7旬）
4. 迁民验证：AI迁民目的城是否选粮食充裕城（非人口最多城）
5. 超承载力城：堆人口后金产是否正确封顶
6. 忠诚验证：关羽（蜀）跟曹操亲密度高时，忠诚不应获得同僚加分

**优先级1B — 武将四类系统实测**：
7. 征兵弹窗：多标签武将（曹操、关羽、诸葛亮）显示标签选择器，切换后buff预览实时更新
8. 单标签武将（张飞、赵云等）只显示固定标签，无选择器
9. 编组效果预览：1武+1帅+1谋显示"士气+5 · 单挑+5% · 计谋+5%"
10. 双帅冲突：编入2个统帅时显示红色警告"双统帅冲突"
11. 部队详情面板：每个squad旁显示当前生效标签，底部显示buff汇总行
12. 武将Tab：每个武将名字后显示彩色类型标签
13. 战斗验证：有统帅的部队战斗开始时士气确实+5
14. 补给验证：有能臣+统帅的部队补给范围比普通部队远2格

---

## v167 武将四类系统

### 设计理念

将125位武将分为四类（武将/统帅/谋士/能臣），结合1主2副的三将部队配置，通过标签组合产生差异化buff。统帅作为"团队增幅器"是核心稀缺资源（全游戏仅~13人有帅标签），自然驱动玩家优化编组策略。

### 四类定义

| 类型 | 英文key | 图标 | 颜色 | 战斗buff | 有帅增幅时 | 叠加规则 |
|------|---------|------|------|----------|-----------|----------|
| 武将 | warrior | ⚔️ | #a82a1a深红 | 被动单挑触发率+3% | +5% | 按人数叠加 |
| 统帅 | commander | 🏴 | #1a5f8a深蓝 | 战斗开始士气+5 | — | ≥2帅失效 |
| 谋士 | strategist | 🧠 | #6a3d7d深紫 | 伏击/劫营/火攻+3% | +5% | 按人数叠加 |
| 能臣 | minister | 📜 | #1a7a3a深绿 | 补给BFS范围+1格 | +2格 | 不叠加 |

### 被动单挑权重修正

| 上阵标签 | 被单挑选中权重 |
|---------|--------------|
| 武 | ×1.0（正常） |
| 帅 | ×0.5 |
| 谋 | ×0.1 |
| 臣 | ×0.1 |

### 多标签武将（13人）

| 武将 | 标签 | 势力 |
|------|------|------|
| 曹操 | 帅+谋 | 魏 |
| 曹仁 | 武+帅 | 魏 |
| 张郃 | 武+帅 | 魏 |
| 曹真 | 武+帅 | 魏 |
| 司马懿 | 帅+谋 | 魏 |
| 司马昭 | 帅+谋 | 魏 |
| 关羽 | 武+帅 | 蜀 |
| 诸葛亮 | 帅+谋+臣 | 蜀（唯一三标签） |
| 周瑜 | 帅+谋 | 吴 |
| 吕蒙 | 武+帅 | 吴 |
| 陆逊 | 帅+谋 | 吴 |
| 邓艾 | 帅+谋 | 在野 |
| 姜维 | 武+谋 | 在野 |
| 羊祜 | 帅+臣 | 在野 |

### 数据结构

**新增常量**：
- `GEN_CLASS`：125人→标签数组映射（如 `'关羽':['warrior','commander']`）
- `CLASS_META`：四类元数据（icon/label/color）

**新增squad字段**：
- `sq._classChoice`：多标签武将的当前选择（string，如`'commander'`）。单标签武将不设此字段，`getSquadClass()`自动读`GEN_CLASS[name][0]`。

**新增函数**：

| 函数 | 说明 |
|------|------|
| `getSquadClass(sq)` | 获取squad当前生效标签 |
| `getUnitClassBuffs(unit)` | 计算部队四类buff汇总（morale/duelPct/tacticPct/supplyRange/cmdConflict） |
| `getClassDuelWeight(name, cls)` | 被动单挑选人权重修正 |
| `genClassTagsHtml(name)` | 生成标签徽章HTML |
| `genClassSelectorHtml(name, choice, slot)` | 生成多标签选择器HTML |
| `genClassBuffsHtml(...)` | 生成编组buff预览HTML |
| `_rmSetClass(slot, cls)` | 征兵弹窗标签切换回调 |

### 战斗逻辑接入点（6处）

| 位置 | 接入方式 |
|------|----------|
| `resolveBattle` 技能注入区 | 有帅→全军士气+5，写入_skillLogs |
| `tryPassiveDuel` 触发率 | += 所有参战部队的duelPct总和 |
| `tryPassiveDuel` pickDuelist | weight *= getClassDuelWeight() |
| `calcFireRate` 返回前 | += 攻方tacticPct |
| `calcRaidChance` 返回前 | += 攻方tacticPct |
| `resolveAmbush` ambushChance | += 伏击方tacticPct |

### 补给逻辑接入（1处）

`isUnitSupplied`：基础supplyMap判定后，如果该部队有minister buff，检查±1~2格hex邻域是否有补给覆盖。

### UI改动

| 位置 | 改动 |
|------|------|
| CSS | 新增`.gen-class-tag`/`.gen-class-btn`/`.gen-class-sel`/`.rm-buffs`（四色徽章+选择器+预览框） |
| 征兵弹窗 `renderRecruitModal` | slotDisplay新增标签选择器；底部新增buff预览区 |
| 征兵弹窗 `confirmRecruit` | squad创建时存入`_classChoice` |
| 武将Tab `renderGenTab` | 武将名后显示所有标签 |
| 部队详情 `renderUnitDetail` | 每squad显示当前生效标签；squadRows后显示buff汇总行 |
| 武将选择grid `genCard` | 名字后显示标签 |
| 帮助文档 `TAB_HELP.mil` | 新增"武将四类"章节 |

### AI标签选择

在`createUnit`中，非玩家势力自动贪心选标签：
1. 如果部队还没有帅且此人有帅标签 → 选帅
2. 否则选warrior > strategist > minister

### 存档兼容

- `_classChoice`为可选字段，旧存档无此字段时`getSquadClass`自动fallback到`GEN_CLASS[name][0]`
- `GEN_CLASS`是常量不存档
- 完全向后兼容

### 自审修复（实装后代码审查）

| # | 问题 | 严重性 | 修复 |
|---|------|--------|------|
| 1 | resolveAmbush不走resolveBattle，统帅士气+5缺失 | 中 | 伏击战ATK计算前注入统帅buff |
| 2 | resolveSiegeBattle同上 | 中 | 攻城战技能注入区前注入统帅buff |
| 3 | rmToggleSub取消副将时未清空_classChoice | 低 | 取消时加`_rm.sub1Class=null` |
| 4 | 征兵不清除billet部曲（同一武将可出现两支部曲） | 高 | confirmRecruit后遍历所有城市billetPool，清除被征兵武将的部曲条目 |
| 5 | 新手引导未提及四类武将 | 低 | TUT_PAGES军事页"部队编制与兵种"末尾新增说明 |
| 6 | 增编分队/扩编弹窗未显示四类标签 | 低 | 增编genCard加genClassTagsHtml；扩编顶部加genClassTagsHtml |

### 已知限制（非blocker，后续完善）

- Redeploy（休整重编）弹窗暂无标签选择器，多标签武将默认第一个标签
- 增编分队弹窗暂无标签选择器和buff预览（需新增`_as.classChoice`状态管理）

### Billet/部曲冷审修复（5项）

来源：v167冷审报告（征兵/Billet/部曲系统专项审查）。5项全部确认有效并实装。

| # | 问题 | 严重性 | 修复 |
|---|------|--------|------|
| 1 | 部曲数据双写（户口本genRetainers和仓库billetPool同时有效） | 严重 | 休整入库→`setRetainers(name,0)`清零户口本（玩家`_confirmBillet`+AI`aiDoDisband`两处）；征兵取出→遍历被删billet条目`setRetainers(bp.genName, bp.troops, bp.type)`写回户口本 |
| 2 | 部曲跨城瞬移（存许昌取南阳，无行军延迟） | 中等 | `confirmRecruit`中计算最远跨城billet距离，超5格每5格+1旬mobilizingTurns |
| 3 | AI辅兵条目永久堆积（只取部曲不取辅兵） | 中等 | `aiDoRedeploy`取部曲条目后扫描同城同兵种辅兵条目吸收合并（上限SQUAD_MAX）；同时写回户口本 |
| 4 | 部曲晋升无上限（后期全squad部曲化） | 轻微 | 晋升后`Math.min(newRet, sq.troops*0.50)`，部曲永远不超过50% |
| 5 | 行军中billet条目被计算军饷 | 轻微 | `getFacUnitSalary`中`readyTurn > G.turn`条目跳过 |
| 6 | initGame开局双写（闲置武将部曲入billetPool但未清genRetainers） | 严重 | push后加`setRetainers(genName, 0)` |
| 7 | _confirmRedeploy不写回户口本（Redeploy取出部曲后genRetainers仍为0） | 严重 | splice前遍历被删条目，部曲条目`setRetainers(bp.genName, bp.troops, bp.type)` |
| 8 | addSquad弹窗不查billet兵种锁定（asPickGen/asPickType） | 中等 | 与征兵弹窗同步，fallback查`_getBilletRetainerType` |
| 9 | 征兵/增编弹窗troop行锁定显示不查billet（_retLock/_asRetLock） | 轻微 | fallback查`_getBilletRetainerType` |

**数据流设计原则**（Fix 1核心）：部曲数据在任何时刻只在一处"活跃"——武将上阵时在户口本`genRetainers`，休整入库时转入仓库`billetPool`，征兵取出时转回户口本。两者互斥，不重叠。

**征兵费用逻辑**（Fix 1配套）：征兵时只对新征兵部分收取金钱、材料和人口惩罚，billet部曲部分免费唤醒。UI显示蓝色"部曲XXXX人免费"提示。最低征兵数 = max(500, 该武将billet部曲人数)。

### v167 最终变更摘要

| 项目 | 变更 |
|------|------|
| 文件名 | project_romance_v166.html → project_romance_v167.html |
| 总行数 | ~33790 → ~34190（+400行） |
| 修复总数 | 冷审12项 + 武将四类新系统 + billet/部曲冷审9项 |
| 新增常量 | GEN_CLASS（125人分类）、CLASS_META（四类元数据） |
| 新增函数 | getSquadClass、getUnitClassBuffs、getClassDuelWeight、genClassTagsHtml、genClassSelectorHtml、genClassBuffsHtml、_rmSetClass、_getBilletRetainerTroops、_getBilletRetainerType |
| 改动函数 | resolveBattle、resolveAmbush、resolveSiegeBattle、tryPassiveDuel、calcFireRate、calcRaidChance、isUnitSupplied、renderRecruitModal、confirmRecruit、renderGenTab、renderUnitDetail、renderAddSquadModal、renderExpandModal、createUnit、rmToggleSub、rmSetTroops、rmPickGen、rmPickType、_confirmBillet、aiDoDisband、aiDoRedeploy、applyBattleExp、getFacUnitSalary、initGame、_confirmRedeploy、asPickGen、asPickType |
| CSS新增 | .gen-class-tag/.gen-class-btn/.gen-class-sel/.rm-buffs（~20行） |
| 帮助文档 | TAB_HELP.mil新增"武将四类"章节 + 新手引导军事页提及四类 |
| 存档版本 | 166→167 |
| 存档兼容 | 完全兼容 |

### 待办事项（下轮）

**优先级1 — 浏览器实测v167全量**：
1. 迁民UI验证：弹窗渲染、滑动条、双城预览、科技加成显示
2. 迁民执行：人口/民心/质量/属县/ethos变化正确性
3. 人口增长验证：粮足时稳步增长（≈0.9%/年），不受承载力抑制
4. 饥荒验证：存粮归零后按缺口比例快速死人，人口降到平衡点稳定
5. 产粮封顶：超过产粮上限的城，金产仍涨但粮产不涨
6. 快进50旬稳定性：无崩溃，人口/粮食/民心数据健全
7. AI迁民：制造敌军逼近AI城市的场景，观察AI是否触发迁民

**优先级2 — 平衡性观察**：
8. 缺粮城（官渡/天水/姑臧）长期运营是否需要更积极调粮
9. 人口固定增长率0.9%/年是否节奏合适（太慢？太快？）
10. 科技civ10在科技树UI中正确显示且可研究

**优先级3 — 技能扩展**：
11. 武将技能批量实装（85处待实装）

**优先级4 — 系统完整性**：
12. E1 水战 / E2 特色兵种

---

## 本轮对话交接记录（v167 Cloudflare代理 + 混淆版 + 文案更新）

### 概述

本轮对话未涉及游戏逻辑代码改动（v167功能代码不变），主要完成：
1. Cloudflare Worker CORS代理实装（游戏端3处改动）
2. 混淆版生成
3. itch.io文案/devlog/知乎文章撰写

### 一、Cloudflare Worker CORS代理

#### Worker端

- Worker名称：`romance-proxy`
- Worker URL：`https://romance-proxy.wangjiejie89.workers.dev`
- 代理端点：`/proxy`（POST）
- 账户名：`wangjiejie89`
- 代码文件：`romance-proxy-worker.js`
- **修复**：`Access-Control-Allow-Headers`第29行末尾加`, X-Target-URL`（否则preflight被CORS拦截）

#### 游戏端改动（3处，净增~5行）

| # | 位置 | 改动 |
|---|------|------|
| 1 | `_claudeAI`初始化（行31873） | 新增`proxyUrl: 'https://romance-proxy.wangjiejie89.workers.dev/proxy'`字段 |
| 2 | `callClaudeAPI` fetch逻辑（行33009-33012） | `proxyUrl`非空时fetch目标改为代理URL，原目标放入`X-Target-URL` header |
| 3 | `_showApiKeyModal`提示文字（行33953） | 红色"需CORS插件"改为绿色"已内置CORS代理，itch.io可直接使用" |

#### 工作原理

```
游戏(itch.io) → POST /proxy + X-Target-URL header → Worker → 转发到OpenRouter/Anthropic → 返回 + CORS头
```

- Worker不存储Key，纯透传
- 目标白名单：openrouter.ai + api.anthropic.com
- 来源白名单：html-classic.itch.zone + ssl.hwcdn.net + localhost
- 免费额度：每天10万次请求

#### itch.io iframe调试方法

DevTools → Console → 顶部下拉框从"top"切换到"index.html"（游戏iframe），然后可访问`_claudeAI`等游戏变量。

### 二、混淆版

- 输出文件：`project_romance_v167_obsf.html`
- 工具：javascript-obfuscator v5.4.1
- 混淆强度：中等（与v155一致）
  - `compact: true`
  - `controlFlowFlattening: true`（阈值0.3）
  - `stringArray: true`（阈值0.5，base64编码）
  - `identifierNamesGenerator: hexadecimal`
  - `renameGlobals: false`（保留`enableClaudeAI()`等公共接口）
- 原始：1.80MB → 混淆后：2.34MB
- 8.5万个混淆标识符（`_0x`前缀）
- HTML/CSS结构不变，仅`<script>`内部JS被混淆
- **注意**：Chrome本地`file://`协议打开可能报安全错误，itch.io（http环境）无此问题

### 三、文案更新

#### itch.io项目简介（已更新）

主要变更：
- 行数：29000→34000
- 武将：131→135
- 事件：28→33
- 科技：49→51节点
- 新增提及：武将四类、属县系统、LLM AI、通使/互市/通商、徭役/迁民、特色兵种、部曲系统
- 设计理念加入"真实逻辑驱动"

#### itch.io devlog（v155→v167）

文件：`devlog_v167.md`，中英文合并，七个板块：
1. LLM AI决策系统（五阶段）
2. 属县系统
3. 贸易三件套
4. 武将四类
5. 部曲·徭役·迁民·休整屯田
6. 帮助系统
7. 底层加固

#### 知乎文章

文件：`zhihu_article_v167.md`
标题：《零编程基础，一个月用AI写了34000行三国SLG原型，已经在谈demo规划了》
结构：品类痛点→设计理念（六段：人口/武将/士族/价值观/战争双层真实/AI）→完成度→本轮更新→招人

### 四、本轮产出文件清单

| 文件 | 用途 |
|------|------|
| `project_romance_v167.html` | 游戏主文件（含CORS代理改动） |
| `project_romance_v167_obsf.html` | 混淆版（上传itch.io用） |
| `devlog_v167.md` | itch.io开发日志 |
| `zhihu_article_v167.md` | 知乎文章 |
| `romance-proxy-worker.js` | Cloudflare Worker代码（第29行已修复） |

### 五、待办事项（下轮）

延续v167原有待办（浏览器实测全量、平衡性观察、技能扩展），另新增：

| 优先级 | 事项 |
|--------|------|
| P0 | 上传v167_obsf到itch.io + 发布devlog + 发知乎文章 |
| P1 | 浏览器实测v167全量（迁民/人口/饥荒/产粮/快进稳定性） |
| P1B | 武将四类实测（征兵弹窗/标签选择/buff预览/战斗验证） |
| P2 | Demo规划讨论推进 |
| P3 | 技能批量实装（85处待实装） |

---

## v167 冷审修复轮（code_review_v167_round3_final 响应）

### 一、冷审报告评估

收到三轮冷审终轮报告，覆盖寻路/补给/围城/水战/撤退/经济/淘汰/伏击等子系统。

**报告整体评价：70% 靠谱，但头号结论有重大误判。**

#### 报告误判项（已驳回）

| 报告结论 | 实际情况 | 驳回理由 |
|----------|----------|----------|
| 🔴 #1 CRIT "战斗标记5函数泄漏" | **不成立** | `resolveBattle` 第23464行已有全量cleanup（`_xiaoyi_atk` / `_defBonus` / `_isDefenderThisBattle`）。`resolveSiegeBattle` 的刘晔/徐盛标记在调用 `resolveBattle` **之前**设置，被其内部清理覆盖。`resolveNavalBattle` 同理。`resolveAmbush` 第22744行也有清理。审计者可能基于旧版本结论或未注意23464行的全量delete |
| 🔴 #3 "`initGame` 未调 `_rebuildGEN_MAP`" | **需验证** | 未在本轮复核，R1遗留项 |
| 🔴 #4 "两套告急卡片系统" | **需验证** | 未在本轮复核，R2遗留项 |

#### 报告确认项（已修复）

| # | 修复编号 | 问题 | 修复内容 |
|---|---------|------|----------|
| 1 | v167fix #30 | `processCityFood` 负存粮时腐损计算语义错误（负×正=负，减去负值=加） | 加 `if(city.storage > 0)` 守卫，第6399行 |
| 2 | v167fix #31 | `processUnitFood` 用像素距离找最近城市，与补给系统的BFS距离不一致 | 改用 `hexDist` + `CITIES_DEF` 坐标，第21375行 |
| 3 | v167fix #32 | `checkElimination` 用 `key.includes(fid)` 匹配外交key，子串误匹配风险 | 改用 `key.split('-')` 精确匹配，第31692行 |

### 二、修复详情

#### Fix #30: processCityFood 负存粮腐损

**修改位置**：第6399行

```js
// 修改前
city.storage -= city.storage * spoilRate;

// 修改后
if(city.storage > 0) city.storage -= city.storage * spoilRate; // ★ v167fix #30
```

**影响范围**：仅 `processCityFood`，零副作用。`Math.max(0,...)` 兜底使得此bug实际影响极小（存粮为负时多回弹几点随即被截为0），但语义修正是必要的。

#### Fix #31: processUnitFood 距离算法统一

**修改位置**：第21375行

```js
// 修改前：像素距离
const _uhp=hexToPixel(unit.hq??0,unit.hr??0);
const d=(c.x-upx)**2+(c.y-upy)**2;

// 修改后：hex距离
const uq = unit.hq ?? 0, ur = unit.hr ?? 0;
CITIES_DEF.forEach(def => {
  const d = hexDist(uq, ur, def.q, def.r);
  ...
});
```

**设计说明**：理想方案是从 `buildSupplyMap` 反查来源城市，但 supplyMap 不追踪源城ID，改造成本较高。hex距离虽不含地形权重，但比像素距离更准确地反映实际地理距离，且与游戏其他距离计算保持一致。

#### Fix #32: checkElimination 外交key精确匹配

**修改位置**：第31692行

```js
// 修改前
if(key.includes(fid))

// 修改后
const [a,b] = key.split('-');
if(a === fid || b === fid)
```

**影响范围**：当前四势力ID（wei/shu/wu/nanman）无实际冲突，此为防御性修复。

### 三、冷审报告中的其他有效建议（未修复，记录备查）

| # | 优先级 | 建议 | 状态 |
|---|--------|------|------|
| 1 | 🟡 | A* 启发函数加权 `h×1.5` 提升效率 | 待评估：可能影响路径最优性 |
| 2 | 🟡 | `buildSupplyMap` 改用 MinHeap 替代 FIFO | 待评估：当前性能可接受 |
| 3 | 🟡 | 撤退后检查补给状态并提示玩家 | 设计决策：战败深入的代价，可加tooltip |
| 4 | 🟡 | `estimateWinRate` 使用 seeded PRNG 保证可复现 | 与事件系统幂等性问题合并考虑 |
| 5 | 🟡 | `processLoyalty` 与 `calcLoyaltyDelta` 合并 | 中等重构，需仔细测试 |

### 四、性能优化（v167fix #33-#36）

#### Fix #33: 7处 `Object.values(G.generals).flat().find()` → `GEN_MAP[name]`

**问题**：`flat()` 每次调用都重建一个 ~135 元素的数组再线性扫描。其中第17964行在城市详情渲染路径上，每次点城市都触发。

**修复**：全部替换为 `GEN_MAP[name]`（O(1) 哈希查找）。第21927行的 `.flat().forEach` 替换为 `Object.values(GEN_MAP).forEach`。

**影响**：7处调用点，涉及挖角AI/挖角UI/城市面板/亲密度仇恨扩散/招募判定。零行为变化。

#### Fix #34: `renderLeft` 势力卡缓存

**问题**：`renderLeft` 每次调用重算全势力经济数据（遍历所有城市×腐败×buff×hasFacGen×66次），但势力卡数据只在旬切换时变化。`renderAll` 被调用 27 次/旬，大部分是交互操作触发的无效重算。

**修复**：
- 新增 `_leftPanelCache = { turn, selFac, html }` 缓存
- 同旬+同选中势力直接用缓存 HTML，跳过经济计算
- Tax/Policy/Corvee 按钮不受缓存影响（在缓存块之外）
- 新增 `invalidateLeftCache()` 供需要强制刷新时调用

**缓存失效条件**：`G.turn` 变化 或 `G.selFac` 变化

#### Fix #35: 移动范围 BFS 缓存

**问题**：选中玩家部队时，`_renderMoveRange` 跑一遍 BFS 展开可达 hex。每次 `renderAllLight` 都会重跑，但选中同一部队+AP未变时结果完全相同。

**修复**：
- 新增 `_moveRangeCache = { unitId, ap, svg }` 缓存
- 同部队+同AP直接返回缓存 SVG
- 取消选中时清缓存

#### Fix #36: 4处 `renderAll` → `renderAllLight` 降级

| 调用点 | 场景 | 理由 |
|--------|------|------|
| 朝议决策确认 | 面板数据变，地图不变 | 加 `invalidateLeftCache()` 保证势力卡刷新 |
| 缔结通商协定 | 外交+金钱变，地图不变 | 同上 |
| 中止通商协定 | 外交+信誉变，地图不变 | 同上 |
| 部队选中（城市详情面板内） | 点击部队卡 → 切Tab | 热交互路径，最频繁触发的renderAll之一 |

**效果**：renderAll 调用从 27→23 次，renderAllLight 从 46→50 次。

---

## v168 内政概览 — 已实装

### 设计目标

让"先攘内后安外"成为玩家可感知、可操作的独立循环。不加新系统、不加新数值，纯信息重组——把分散的内政数据围绕"朝堂权力博弈"集中呈现。文案全部文言文，点到为止。

### A. 左面板势力卡：朝堂状态行

仅玩家势力卡底部显示一行，点击跳转派系Tab。三级色标：

```
正常(绿)：🏛 政通人和
轻度(橙)：🏛 中原士族势重
严重(红)：🏛 ⚠ 糜芳离心 · 中原士族寒心 · 荆州士族寒心
```

函数 `getCourtStatusText(fid)` 读取：
- 最大派系影响力>35% → "{派系}势重"
- 士族派系≥3人无官（排除最大派系、排除humble/newcomer/defector）→ "{派系}寒心"
- 非降将/新附武将忠诚<50 → "{名}离心"/"不安"
- 纳入 `renderLeft` 缓存体系，随旬更新

### B. 派系Tab重构为六区

替换原有 `renderFactionTab`，保留影响力横条和武将列表，新增态势摘要、预警、操作区。

**第一区：态势摘要**（`_buildCourtNarrative`）
文言叙事2-3句，实时生成。示例：
> "中原士族权倾朝野，17人据5席要津。"
> "荆州士族3人赋闲，江陵豪右渐离。糜芳心志不坚，恐生二意。"

阈值：>45%"权倾朝野"，>35%"声势颇隆"，>30%"为朝中主力"。排除最大派系的边缘化叙述（人多官少不是被冷落）。

**第二区：影响力堆叠横条 + 图例** — 原样保留。

**第三区：朝堂谏言**（`_buildCourtWarnings`）
红/黄/绿三级预警条，每条带跳转链接：
- 🔴 武将离心（忠<50 + delta<-0.1）— 预估生变旬数，跳转武将Tab
- 🔴 士族孤立（影响力<5%，≥2人）— 跳转官职Tab
- 🟡 士族势弱（影响力<10%，≥2人）— 跳转官职Tab
- 🟡 士族怨望（≥3人无职，非最大派系）— 跳转官职Tab
- 🟡 一家独大（>35%）— 跳转派系Tab
- 🟡 降将/新附/旧阀影响力超标 — 合并原tensions逻辑
- 🟢 朝堂无虞，可专意军务

**第四区：空缺要津**（`_buildCourtVacancies`）
列出空缺官位和无太守城市，只给跳转不给人选建议，让玩家自己挑。有空缺时才显示。

**第五区：朝议令** — 原样保留，剩余旬数加防御性上限 `Math.min(remain, 12)`。

**第六区：武将列表** — 原样保留，派系标题旁新增态度标签（归心/安分/怨望/离德），基于派系平均facMod判定。

### C. 关键设计决策

| 决策 | 理由 |
|------|------|
| 最大派系不报"寒心/怨望" | 人多官少不是被冷落，是主力派系的正常状态 |
| humble/newcomer/defector排除边缘化预警 | 寒门无组织诉求，降将/新附忠诚偏低是常态 |
| 降将/新附不上左面板忠诚告警 | 太吵，留给预警区详细展示 |
| 空缺要津不推荐具体人选 | 让玩家在挑选中获得满足感 |
| 一家独大预警保留 | 虽现有机制无直接惩罚，但有"要官"事件，也为未来逼宫事件做准备 |

### D. 新增函数

| 函数 | 用途 | 行数 |
|------|------|------|
| `getCourtStatusText(fid)` | 左面板一行摘要 | ~55行 |
| `_buildCourtNarrative(fid)` | 态势文言叙事 | ~45行 |
| `_buildCourtWarnings(fid)` | 矛盾预警数组 | ~45行 |
| `_buildCourtVacancies(fid)` | 空缺官位/太守 | ~20行 |
| `_facAttitude(fdId)` | 派系态度标签（内联） | ~10行 |

CSS新增18行（`.fc-court` / `.court-narrative` / `.court-warn-item` / `.court-vacant`等）。

### E. 三家开局验证

| 势力 | 左面板 | 核心预警 |
|------|--------|---------|
| 魏 | 🟡 中原士族势重 | 西凉孤立(5%)、中原权重(48%) |
| 蜀 | 🔴 ⚠ 糜芳离心 · 中原寒心 · 荆州寒心 | 糜芳10旬生变、旧阀孤立、多派博弈 |
| 吴 | 🟡 江东士族寒心 | 中原势弱(9%)、江东4人无职 |

蜀最复杂（多派系角力），魏最简洁（一家独大），吴居中。符合史实政治生态。

---

## 下轮开发计划

### 待做优先级

**🔴 高优先级**：

| # | 项目 | 规模 | 说明 |
|---|------|------|------|
| 1 | 存档/读档 | ~100行 | localStorage序列化G对象。无存档无法长期游玩 |
| 2 | 胜利条件/结局判定 | ~60行 | 每旬检查城市归属，消灭所有敌方→胜利画面 |
| 3 | I1 太守建设buff | ~50-80行 | 太守标签+属性→建筑加成，设计已确认 |
| 4 | I3 朝议系统扩展 | 待评估 | 朝议与内政概览联动，预警中可直接触发朝议相关操作 |

**🟡 中优先级**：

| # | 项目 | 规模 | 说明 |
|---|------|------|------|
| 5 | 河北士族独立 | ~20行 | 等190剧本（袁绍主场）再拆，当前只有华歆1人gentry |
| 6 | 逼宫/架空事件 | 待设计 | 一家独大的后果机制，与内政概览预警联动 |
| 7 | 武将技能批量实装 | ~400行 | ~75将缺技能，分2-3批 |

**远期**：战斗prototype、水战系统、190剧本、美术优化

---

# 🆕 v170 豪族系统重构（2026-04 新增）

> **重要历史**：v169 在上一轮对话中被 AI 污染——引入了错误的"commandery"独立数据层（COUNTY_DATA 每县加了冗余 commandery 字段、4个辅助映射表、getGenCommandery 函数、硬改32人 birthplace）。新对话基于 v168 干净版本直接实装 v170，丢弃 v169 的脏状态。详见 `HANDOVER_v169_ROLLBACK_NOTES.md`。

## 一、v170 核心设计

**数据结构严格两层**：`city`=郡（地图色块）+ `county`=县（tooltip）。**无第三方映射层**。武将出身 city 通过 COUNTY_DATA 派生表反查获得，不做字符串切片/前缀归一化。

**三组加成结构**：
- **第1组（普适×TYPE_SENS）**：太守因子 + 占领期 + 围城 + 技能 + 科技 + 漂移。`COUNTY_TYPE_SENS_V170 = {seat:0.5, common:1.0, clan_base:1.0}`—治所惰性保留，clan_base不再对外部冲击过敏。
- **第2组（按县×CLAN_SENS）**：本县加成 + 同城辐射 + 本族加成。本族匹配时 sens=2.0，其他=1.0。单县总和上限+1.0/旬。
- **shock（独立）**：applyFamilyLoyaltyShock 直加到 county.loyalty，×COUNTY_CLAN_SENS(=2.0)。

## 二、主要数据/代码改动

### 2.1 新增常量
- `MAGNATE_CLANS`（Set，10家）：颍川钟氏/河内司马氏/谯国许氏/沛国曹氏/沛国夏侯氏/东海糜氏/扶风马氏/吴郡陆氏/吴郡顾氏/吴郡朱氏
- `COUNTY_NAME_TO_CITY`、`COUNTY_INDEX`：从 COUNTY_DATA 派生的反查表
- `LOCAL_BONUS_CAP_V170 = 1.0`、`COUNTY_CLAN_SENS = 2.0`、`COUNTY_TYPE_SENS_V170`
- `_V170_TIER_TABLE`：tier 1/2/3 对应 ownCounty=0.5/0.3/0.15、sameCity=0.1、clanBonus=0.1/0.05/0.025

### 2.2 新增辅助函数
- `getGenBirthplace(name)`：查 GEN_TAGS[name].birthplace
- `getGenHomeCounty(name)`：从 birthplace 反查县名（遍历 COUNTY_NAME_TO_CITY 后缀匹配）
- `getGenHomeCity(name)`：派生的出身 city id
- `isGenHomeInFac(name, fid)`：出身 city 是否在 fid 版图
- `isMagnateCounty(county)`：是否 clan_base 且 family∈MAGNATE_CLANS
- `_countyClanList(county)`：统一单值/数组 clanFamily
- `getGenLocalBonus(name, fid)`：按tier返回 {tier, ownCounty, sameCity, clanBonus}

### 2.3 CLAN_FAMILIES 扩展
+4家：`pg_cao` 沛国曹氏、`pg_xhs` 沛国夏侯氏、`qg_xu` 谯国许氏、`dh_mi` 东海糜氏。共 25 家。

### 2.4 COUNTY_DATA 改动
- **xuzhou**：新增 "朐县" clan_base → dh_mi（6县）
- **chenliu**：新增 "谯县" clan_base → 数组 [pg_cao, pg_xhs, qg_xu]（5县）
- **jianye.吴县**：clanFamily 从 wj_gu 改为数组 [wj_gu, wj_lu, wj_zhu]
- **wuchang.吴陵**：clanFamily 从 wj_lu 改为 wj_zhu（陆家只在 jianye 数组）
- changan 不加茂陵（扶风已代表马家，避免一城双县同族冗余）
- 共 170→172 县。所有 popShare 和=1.00 已预算好，不依赖运行时归一化

### 2.5 _CLAN_MAP 修正
- **删除3处**（史实错挂）：张昭 wj_zhang、王基 tyjg_wang、杨洪 hy_yang
- **修正1处**：黄权 sq_huang → bx_huang（巴西阆中人）
- **新增14人**：曹9（操/仁/洪/纯/真/休/彰/植/丕）+夏侯3（惇/渊/霸）+许褚1+糜2（竺/芳）
- 总数 25→37

### 2.6 processGentry 重写（line ~15290）
按三组结构完全重写，不再使用：
- 旧的"第二层家族待遇 ±0.3"
- 旧的"派系影响力 gentryFac ±0.1/-0.2"（已删）
- 旧的 COUNTY_SENSITIVITY 三档（seat/clan_base/common）

保留：占领期、吕蒙围城、onGentry 技能、gentryRecovery 科技、孙权坐断、自然漂移、隐匿户口、献城判定。

### 2.7 applyFamilyLoyaltyShock 改造（line ~15312）
- clanFamily 支持**数组**形式（通过 _countyClanList）
- delta × COUNTY_CLAN_SENS（恒×2.0，因为作用县必是 clan_base + 本族匹配）
- 仅当该城确有匹配县时才重算 city.gentry（优化）

### 2.8 经济放大：magnate×1.5
`getGentryGoldMult`、`getGentryRecruitMult`、`getGentryMoraleMod`、`getGentryDefMult` 全部重写为**按county popShare加权**。magnate 县额外 ×1.5（金产）/ ÷1.5（征兵费）。士气/城防乘数不×1.5（规格书仅提经济/征兵）。

### 2.9 shock 调用点总览
- killGen（处决）→ -30 × 2.0 = -60 （v168已有，v170自动放大）
- _aiDoPoach / 玩家挖角 → -15 × 2.0 = -30（同上）
- _applyCourtDecisions（朝议采纳/驳回）→ ±5 / ±3 → ±10 / ±6（阶段6改造：从原本直加loyalty改为走 applyFamilyLoyaltyShock，自动×2.0）

### 2.10 UI 重写
- `showCountyTip`：按三组结构展示（第1组shared×typeSens / 第2组 本县·辐射·本族 明细 / 悬置提示）。显示 ★豪强 magnate 标记。
- `showBreakdown('gentry')`：移除旧"region/派系"字段，简化为属县明细+当前效果，引导玩家点单县看详细计算。
- 已清除 COUNTY_SENSITIVITY 引用点（processGentry + showCountyTip + showBreakdown）。常量本身以注释形式保留但不启用。

### 2.11 存档兼容（阶段7）
`_deserializeG` 中加入自动迁移：对每座城市，按 COUNTY_DATA 最新模板重建 counties，保留旧 loyalty / _initPop（按 name 匹配），新增县（如 xuzhou.朐县）用 city.gentry 作初值。同步 type/clanFamily/popShare 到最新值（处理 v168 单值→v170 数组的 clanFamily 变化）。

## 三、场景演算（v170 验收）

### 场景A：荀彧(tier1颍川荀氏,颍阴) 独自在朝曹魏
| 县 | Δ/旬 |
|---|---|
| 颍阴(荀氏clan_base) | +0.90（g1=-0.10, g2=本县0.5×2+本族0.1×2=1.2→封顶1.0）|
| 长社(钟氏clan_base) | 0（g1=-0.10 + 辐射0.1）|
| 许县(seat) | +0.05（g1×0.5治所=-0.05 + 辐射0.1）|
| 鄢陵/临颍(common) | 0 |

### 场景B：荀彧+荀攸+钟繇 在朝
| 县 | 第2组 | Δ/旬 |
|---|---|---|
| 颍阴 | 荀彧1.2 + 荀攸0.7 + 钟繇辐射0.1 = 2.0→封顶1.0 | +0.90 |
| 长社 | 荀彧辐射0.1 + 荀攸辐射0.1 + 钟繇0.7 = 0.9 | +0.80 |
| 许县(seat) | 3人各辐射0.1 = 0.3 | +0.25 |
| 鄢陵 | 3人各辐射0.1 | +0.20 |

### 场景C：荀彧被处决
颍阴 -60（-30×2）；其他不变。

### 场景D：10旬综合simulation（见 stage8_test.js）
- wei(xuchang+chenliu+luoyang)：荀彧/司马懿本地太守 → 5旬后各自本县升至 ~56-58
- shu(changan)：马超扶风茂陵不在 COUNTY_DATA → homeCity=null → 悬置，+刘备涿郡涿县悬置 → 全城 loyalty 轻微下滑（~49.8）
- wu(jianye)：顾雍+陆逊双 tier1/tier2 叠加一县多族(吴县) → 吴县 5旬后 57.7
- magnate 经济放大：loyalty=60 时 xuchang=1.144 / luoyang=1.155（温县popShare大→加成大）

## 四、v170 砍掉的机制（不要恢复）

- ❌ 派系影响力 gentryFac 占比 >20%+0.1/<5%-0.2（v168逻辑）
- ❌ 第二层家族待遇 clan_base ±0.3 基于 office/member/none 三档（v168）
- ❌ COUNTY_SENSITIVITY 按type三档 {seat:0.5, clan_base:1.3, common:0.8}（v168，v170改为二档）
- ❌ 太守判定用 `prefRegion === reg`（region级）→ 改为 `prefHomeCity === city.id`（city级）
- ❌ 朝议 region 广播直加 loyalty → 改为走 applyFamilyLoyaltyShock

## 五、v170 实装状态

| 阶段 | 内容 | 状态 |
|---|---|---|
| 1 | CLAN_FAMILIES+4 / MAGNATE_CLANS / _CLAN_MAP 修正 / COUNTY_DATA 4处 | ✓ |
| 2 | 派生表 COUNTY_NAME_TO_CITY/INDEX + 6个辅助函数 | ✓ unit tests all pass |
| 3 | processGentry 三组重写 + applyFamilyLoyaltyShock ×2.0 | ✓ A/B/C/D/E/F/G/H/I 场景全通 |
| 4 | showCountyTip + showBreakdown('gentry') 重写 | ✓ |
| 5 | magnate×1.5 经济放大（按popShare加权） | ✓ |
| 6 | shock钩子（朝议 ±5/-3 改走 applyFamilyLoyaltyShock） | ✓ |
| 7 | 存档counties自动迁移 | ✓ |
| 8 | 10旬多势力综合 simulation | ✓ |

## 六、待定 / 可选

- **文鸯**：规格书提到"文鸯→谯县曹氏？核实"。文鸯史书是谯国人，但和曹家不同族（姓文），不应挂 pg_cao。当前**不加**文鸯入 _CLAN_MAP（无变动即正确）。
- **其他 magnate 家族成员**：如曹爽、曹芳等后期人物未加 clan 字段（原因：GEN_TAGS 中可能不存在或作为 inactive）。可按需补齐。
- **COUNTY_SENSITIVITY 死常量**：已注释掉定义。下次再次整理代码时可完全删除该行。

---

# 🆕 v171 豪族系统参数调优与magnate解耦（2026-04）

## 一、v171 核心改动

在 v170 三组结构基础上做**参数调优 + 结构解耦**，不引入新机制。

### 1.1 参数调优

| 常量 | v170 | v171 | 理由 |
|---|---|---|---|
| `_V170_TIER_TABLE[*].sameCity` | 0.1 | **0.2** | 同城辐射在v170存在感过低；加倍让"多谋士扎堆"在非老家/非本族县也有可见边际收益 |
| `LOCAL_BONUS_CAP_V170` | 1.0 | **1.5** | cap=1.0 把 tier2/tier3 在本族匹配场景的差异抹平了；放宽让不同tier的武将价值在扎堆时也能体现 |

### 1.2 结构解耦：magnate 与 clan_base

**v170 问题**：`isMagnateCounty(county) = county.type==='clan_base' && MAGNATE_CLANS.has(clan)`。magnate 判定硬依赖 `clanFamily`，封死了"非士族但有经济实力的地方豪强"（例：山越、丹阳、南中土豪）的未来设计空间。

**v171 解法**：COUNTY_DATA 新增 `magnate: boolean` 字段，`isMagnateCounty` 改为直接读字段。`MAGNATE_CLANS` 常量保留作数据标注参考，不再参与判定。

**功能上零变化**（7 个 magnate 县全部显式标记，等价迁移）。

### 1.3 发现的既有现象（非 bug，记录）

- **颍川荀氏 yc_xun 不在 MAGNATE_CLANS**：颍阴有本族加成但无经济×1.5；符合原设计意图（magnate 特指"顶级豪强"如钟、司马、曹、夏侯）。讨论记录：此次不改动颍阴，未来若要把"有明显经济地位的清流士族"升magnate，在 MAGNATE_CLANS 加 `yc_xun` 并把颍阴标 magnate:true 即可。
- **弘农杨氏 hy_yang 同理**：华阴 clan_base 非 magnate，属设计选择。

## 二、主要数据/代码改动

### 2.1 常量改动（1处）

`project_romance_v171.html` ~4471-4486：
```js
// v170→v171
const _V170_TIER_TABLE = {
  1: { ownCounty:0.5,  sameCity:0.2, clanBonus:0.1   },  // sameCity 0.1→0.2
  2: { ownCounty:0.3,  sameCity:0.2, clanBonus:0.05  },  // sameCity 0.1→0.2
  3: { ownCounty:0.15, sameCity:0.2, clanBonus:0.025 },  // sameCity 0.1→0.2
};
const LOCAL_BONUS_CAP_V170 = 1.5;  // 1.0→1.5
```

### 2.2 isMagnateCounty 重写（行 ~4437-4441）

```js
// v171: 解耦 magnate 与 clan_base
function isMagnateCounty(county){
  return !!county && county.magnate === true;
}
```

### 2.3 COUNTY_DATA 7 县标记 magnate:true

| 县 | 所在城 | 家族 | 行号 |
|---|---|---|---|
| 长社 | xuchang | 颍川钟氏 | 4145 |
| 温县 | luoyang | 河内司马氏 | 4151 |
| 朐县 | xuzhou | 东海糜氏 | 4159 |
| 扶风 | changan | 扶风马氏 | 4173 |
| 吴县 | jianye | 吴郡顾/陆/朱氏 | 4187 |
| 吴陵 | wuchang | 吴郡朱氏 | 4201 |
| 谯县 | chenliu | 沛国曹/夏侯/谯国许 | 4245 |

### 2.4 存档与初始化

三处构造 counties 的地方全部补 `magnate: t.magnate === true`：
- `initCityGentry`（行 ~15241）— 新开局
- `processGentry` fallback（行 ~15385-15389）— 旧存档无counties时现场生成
- `_deserializeG` 迁移（行 ~30882-30902）— 两个分支（已存在县 / 新增县）都加

### 2.5 UI 改动（1处）

`showCountyTip` 第2组标题的 hardcode "+1.0" 改为 `${LOCAL_BONUS_CAP_V170.toFixed(1)}`（行 ~20889）。

## 三、v171 数值验收

基于 `v171_regression.js`，7 个场景全通：

| 场景 | G2 原始 | G2 封顶后 | v170 对比 | 点评 |
|---|---|---|---|---|
| A 荀彧独 → 颍阴 | 1.20 | 1.20 | v170 同 | 单人不撞顶 |
| B 荀彧+荀攸 → 颍阴 | 1.90 | **1.50** | v170 是 1.00 | tier2 价值可见 |
| C 荀+荀+钟 → 长社 | 1.60 | **1.50** | v170 约 0.9 | 辐射加倍+cap提升 |
| D 3人 → 鄢陵common | 0.60 | 0.60 | v170 是 0.30 | 辐射加倍直接翻倍 |
| E 3人 → 许县seat | 0.60 | 0.60 | v170 是 0.30 | G2 不受 typeSens 影响 |
| F 颍阴单县 goldMult | 1.575 | — | 非magnate→1.05 | 颍阴非magnate（见 1.3） |
| G 许昌全城 goldMult | 1.144 | — | v170 同 | 仅长社magnate |

## 四、v171 对比 v170 的设计语义变化

1. **多谋士扎堆的边际价值**：v170 第二人起基本撞顶白给，v171 tier2/tier3 的 0.7/0.3 加成在撞顶前能真实叠加。
2. **辐射效应显著化**：v170 辐射 0.1 几乎是噪声，v171 翻倍后成为"多谋士在朝对普通县的实质影响"。
3. **magnate 数据与结构解耦**：未来加"山越聚居县"、"丹阳兵源"等**非士族豪强**无需改动代码，只需在 COUNTY_DATA 里标 magnate:true。

## 五、v171 实装状态

| 阶段 | 内容 | 状态 |
|---|---|---|
| 1 | `_V170_TIER_TABLE` sameCity 全改 0.2 | ✓ |
| 2 | `LOCAL_BONUS_CAP_V170` 改 1.5 | ✓ |
| 3 | `isMagnateCounty` 改读字段 | ✓ |
| 4 | 7 个 magnate 县标记 `magnate:true` | ✓ |
| 5 | 三处 counties 构造补 magnate 字段 | ✓ |
| 6 | UI cap 显示改常量驱动 | ✓ |
| 7 | 语法检查通过 | ✓ |
| 8 | 7 场景回归测试通过 | ✓ |

## 六、v171 待定 / 可选

- **颍阴/华阴 magnate 升级**：如果要让"清流士族"也享受经济×1.5，在 MAGNATE_CLANS 加相应 clan key，并在 COUNTY_DATA 对应县加 `magnate:true`。当前不改。
- **真实存档加载验证**：本次只跑了公式级的回归，没有模拟完整存档 → 新版本加载的 round-trip。下次修改如涉及序列化路径，应加一个 `save→load→compare` 的 e2e 测试。
- **非士族 magnate 示范实装**：未来剧本（190/赤壁后）加山越/丹阳/南中 clan_base=false + magnate=true 县，验证解耦机制真实可用。
- **tier 分级 cap**：当前 cap=1.5 是全局硬cap，tier1 本族（1.2）+ tier2 本族（0.7）加起来 1.9 仍会被砍到 1.5。如果还觉得不够差异化，可以考虑"tier1 贡献不受 cap 限制，tier2/tier3 加起来另算 cap"——v172 候选。

## 七、测试脚本

- `v171_regression.js`（位于 `/home/claude/`）— 抽常量 + 7 场景公式验证（含 A~E G2计算、F/G 经济放大）


---

# 🆕 v172 势力演进三阶段 + 州体系重构（2026-04 新增）

## 本轮核心改动

按 PDF 5.5 节"势力演进体系"，实装 **军阀(warlord) → 一方之主(regional) → 政权(regime)** 三阶段系统，同时把地理单位从"大区（7个）"**彻底重构**为"东汉十三州 + 南中（14个）"，并引入 `clique`（客居集团）+ `magnate`（地方豪族）两个新概念修正派系归属。

**当前剧本生效情况**：
- 三国（魏/蜀/吴）开局即为 regime（政权），stage 机制对它们 _目前没有直接玩法影响_
- 南蛮（孟获）开局为 warlord（军阀），体感差异化（豪族上限 70、无本地加成、创始/宗亲×2）
- 架构已建好，未来剧本（190/刘备新野等）可直接使用

---

## 一、州体系重构（删除大区，抛弃 REGION_*）

### 14 州城市映射

| 州 id | 州名 | 分级 | 城市 | 城数 |
|---|---|---|---|---|
| `si` | 司隶 | medium | 洛阳、长安、河东 | 3 |
| `yu` | 豫州 | medium | 许昌、陈留、南阳、新野 | 4 |
| `yan` | 兖州 | small | 官渡、濮阳 | 2 |
| `xu` | 徐州 | medium | 徐州、下邳、广陵 | 3 |
| `qing` | 青州 | small | 青州、北海 | 2 |
| `ji` | 冀州 | small | 邺城 | 1 |
| `you` | 幽州 | small | 蓟城、北平 | 2 |
| `bing` | 并州 | small | 晋阳 | 1 |
| `liang` | 凉州 | medium | 姑臧、武威、天水 | 3 |
| `jing` | 荆州 | **large** | 襄阳、江陵、夷陵、上庸、长沙、零陵、武昌 | 7 |
| `yang` | 扬州 | **large** | 合肥、寿春、庐江、建业、京口、会稽、柴桑、豫章 | 8 |
| `yi` | 益州 | **large** | 成都、梓潼、巴中、汉中、永安、雒城 | 6 |
| `jiao` | 交州 | small | 交州、番禺 | 2 |
| `nanzhong` | 南中 | small | 建宁 | 1 |

**分级规则**：
- `large`（≥5城）：能培养"政权"的根据地
- `medium`（3-4城）：能培养"一方之主"（可作 anchor 州）
- `small`（≤2城）：边缘州，不能作为 anchor 州，但仍计入总城数和政权判定

### 新增/删除的数据结构

| 数据 | 说明 |
|---|---|
| ✅ `STATE_CITIES` | 州 → 城市 id 数组，取代 REGION_CITIES |
| ✅ `STATE_NAMES` | 州 id → 中文名 |
| ✅ `STATE_TIER` | 州 → large/medium/small |
| ✅ `CITY_TO_STATE` | 城市 id → 州 id 反查 |
| ✅ `STATE_TO_GENTRY_FAC` | 州 → 士族派系 id |
| ✅ `GENTRY_FAC_TO_STATES` | 士族派系 → 属州数组 |
| ❌ REGION_CITIES / CITY_TO_REGION / REGION_TO_GENTRY_FAC / GENTRY_FAC_TO_REGION / regionNames / _getCityRegion | 全部删除 |

### 士族派系（9 个，新增 hebei/xuzhou）

```
gentry_zhongyuan (中原)    — si + yu + yan（含颍川、河内、谯沛、汝颍）
gentry_hebei     (河北) ★新 — ji + qing + you + bing（含冀州、青徐北、幽州、并州）
gentry_xuzhou    (徐州) ★新 — xu（陈登/糜家世居东海）
gentry_jingzhou  (荆州)    — jing（蔡蒯庞习）
gentry_yizhou    (益州)    — yi + nanzhong（蜀郡本土）
gentry_jiangdong (江东)    — yang + jiao（虞魏顾陆）
gentry_xiliang   (西凉)    — liang（马氏、韦氏）
gentry_dongzhou  (东州派)  — 跨州客居集团（gentryStates:[]）
gentry_huaisi    (淮泗派)  — 跨州客居集团（gentryStates:[]）
```

### 同乡判定语义变更

旧逻辑"`tags.region === cityRegion`" 改为 **"`STATE_TO_GENTRY_FAC[tags.state] === STATE_TO_GENTRY_FAC[cityState]`"**。

也就是说：**本地人判定不再是严格"同州"，而是"同士族派系下的任一州"**。例如曹仁（豫州谯沛）在官渡（兖州）当太守算本地（都属 gentry_zhongyuan），但在邺城（冀州）当太守算外地（gentry_hebei）。符合"河北 vs 中原"的历史对立。

---

## 二、武将标签重构（region→state + clique + magnate）

### GEN_TAGS 字段变化

```
旧：{politics, combat, origin, region, temperament}
新：{politics, combat, origin, state, clique?, temperament}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `state` | 14 州 id 之一 | 取代 region，为武将籍贯州 |
| `clique` | `'dongzhou'` / `'huaisi'` / 无 | **新增**：客居集团覆盖 state 归属，优先级高于 state→gentry_fac 映射 |
| `origin` | gentry / **magnate** / humble / clan / noble / foreign | **新增 magnate**（地方豪族/商贾） |

### 134 武将 region→state 迁移（按史实籍贯）

全部按 `birthplace` + 史书考证归属。特别说明：
- **曹操集团核心**：谯沛集团（曹氏/夏侯氏/许褚/典韦/邓艾等）全部归 `yu`（豫州沛国/南阳）
- **颍川名士**：荀彧/荀攸/郭嘉/钟繇/陈群/陈泰/徐庶/钟会 归 `yu`
- **河内士族**：司马懿/司马昭 归 `si`（司隶河内）
- **河北派**：田丰/沮授/朱灵/张郃/郭女王/张苞 归 `ji`；赵云（常山）归 `ji`；华歆（平原）归 `qing`
- **并州派**：张辽（雁门）/高顺 归 `bing`；郭淮/郝昭（太原）归 `bing`
- **幽州派**：刘备/张飞/简雍（涿郡）归 `you`；程普/韩当（辽西）归 `you`
- **关羽/徐晃/关平/关兴**：河东解 → `si`（司隶河东）
- **徐州派**：王朗（东海）/鲁肃（临淮）/张昭（彭城）/糜竺糜芳（东海）/臧霸/步骘 归 `xu`
- **孙吴江东本土**：孙氏/陆氏/顾氏/朱氏/周泰/蒋钦/凌统/丁奉/贺齐/骆统/留赞/全琮/施绩/陆抗 归 `yang`
- **黄盖/廖化/文聘**：按籍贯归 `jing`
- **凉州派**：马超/马岱/法正/孟达（扶风）/贾诩/庞德/姜维 归 `liang`
- **琅琊派**：诸葛亮/诸葛瑾/诸葛恪/徐盛（琅琊） 归 `qing`

### clique（客居集团）9 人

| 武将 | clique |
|---|---|
| 法正、董允、吴懿、李严、孟达 | `'dongzhou'` |
| 周瑜、鲁肃、吕蒙、张昭 | `'huaisi'` |

**判定逻辑**：`getGenFactions` 里 clique 优先——有 clique 直接用 gentry_dongzhou/gentry_huaisi，没有才走 state→gentry_fac 映射。

### magnate（地方豪族）6 人

| 武将 | 原 origin | 新 origin | 说明 |
|---|---|---|---|
| 糜竺、糜芳 | gentry | **magnate** | 东海糜氏富商大族，非士族 |
| 李典 | gentry | **magnate** | 山阳巨室，部曲3000家 |
| 臧霸 | humble | **magnate** | 泰山豪帅 |
| 孟达 | gentry | **magnate** | 扶风孟氏武人家族（同时移除 clique:dongzhou） |
| 申耽 | humble | **magnate** | 上庸豪族 |

**关键语义**：`magnate` 武将**不贡献士族派系影响力**，由 `humble` 兜底。

**humble 派系 label 改名为 "寒门豪族"**，因为它现在容纳：
- 真·寒门武将（关张赵、典韦许褚、王平马忠等）
- 地方豪族（magnate，糜家/李典/臧霸等）
- 他们在朝堂话语权都相对有限，靠创始/宗亲标签才有实质影响（如糜竺如果是 founding 会走 founding×3 路线）

### 小传叙事

`initGame` 生成的小传中，武将身份标签不再写"中原士族/河北士族"（按大区），而是直接用**士族派系名**：
```
仕于魏，任尚书令（中原士族、主战、性刚毅），籍贯颍川颍阴。
仕于吴，任大都督（淮泗派、主战、性傲），籍贯庐江舒县。
仕于蜀，任安汉将军（地方豪族、持重、性仁厚），籍贯东海朐县。   ← 糜竺
```

---

## 三、势力演进三阶段 stage

### 数据结构

```js
FAC_IDENTITY = {
  wei:    { type:'emperor_holder', stage:'regime',  anchorState:null, ... },
  shu:    { type:'han_royal',      stage:'regime',  anchorState:null, ... },
  wu:     { type:'warlord',        stage:'regime',  anchorState:null, ... },
  nanman: { type:'tribal',         stage:'warlord', anchorState:null, ... },
};
```

- `stage`: `'warlord'` / `'regional'` / `'regime'`——对内治理阶段
- `anchorState`: 仅 regional 阶段有值（根据地州 id），warlord/regime 均为 null
- `type`（现有）：对外合法性标签（emperor_holder/han_royal/warlord/tribal/emperor），**与 stage 完全正交**

### 晋升条件（全自动判定）

| 晋升 | 条件（同时满足） |
|---|---|
| 军阀 → 一方之主 | 存在至少一个中/大州持有 ≥3 城，且已持续 ≥18 旬<br>总城 ≥5 |
| 一方之主 → 政权 | 总城 ≥10<br>至少 2 个中/大州各持 ≥2 城 |

**每旬在 `nextTurn` 里通过 `processStageEvolution()` 自动检查**，满足即升级。单向不可逆（v172 暂不实装降级）。

### anchor 州客观判定

晋升一方之主时，`_selectBestAnchor(fid)` 自动选出根据地：
1. 从满足 "≥3 城 × 18 旬" 的州中选
2. 首次满足时间**最早**（满足时间久的优先）
3. 平手取**城数最多**
4. 再平手取**大州优先**（large > medium > small）
5. 最后按**人口**决胜

**不让玩家选**，完全客观。多州同时符合时选最先满足的。

### _stateAnchorClock 时长追踪

`G.factions[fid]._stateAnchorClock = { stateId: firstQualifiedTurn }`

每旬调用 `_updateStateAnchorClock`：
- 该州满足 ≥3 城 + 非 small → 记录首次达成旬
- 不满足 → 删除（重置计时）

晋升政权时 anchorState 清空为 null（政权无根据地概念，派系全面开放）。

---

## 四、派系影响力按阶段差异化（核心数值）

### `_genInfluence` 乘数表

|  | 军阀 warlord | 一方之主 regional | 政权 regime |
|---|---|---|---|
| **founding 创始团队** | 1.5 × 2.0 = **3.0** | 1.5 × 1.5 = **2.25** | **1.5**（基准） |
| **royalty 宗亲** | 1.0 × 2.0 = **2.0** | 1.0 × 1.5 = **1.5** | **1.0**（基准） |
| **gentry anchor 州** | — | **1.5** | — |
| **gentry 本土（非anchor）** | 1.0 | 0.8 | 1.2 |
| **gentry 外地** | 1.0 | 0.8 | 0.8 |
| **gentry_dongzhou/huaisi** | 0.8 | 0.8 | 0.8（永远客居） |
| 其他（noble/warlord_remnant/humble/defector/newcomer） | baseMult 不变 | 同 | 同 |

### 设计意图（已实装，现在剧本下孟获能体验到）

- **军阀**：创始 3.0 + 宗亲 2.0 形成碾压态势，加起来常占 70%+ 影响力。士族无本地加成（一律 1.0），降将新附被边缘化。→ **宗族+元从政治，纯家臣**
- **一方之主**：宗族/元从仍强但减半（2.25 / 1.5），anchor 州士族 1.5 崛起与之抗衡，其他士族 0.8 被压制。→ **根据地崛起，本地人有了话语权**
- **政权**：创始/宗亲恢复基准，所有本土士族 1.2 平等参政，外地 0.8。→ **士族共治，制度化**

### 涌现性

- **历史感**：曹魏后期司马氏崛起、谯沛势力衰落 = 政权阶段下创始/宗亲随时间被士族稀释的数学结果，不是硬编码
- **孟获军阀体验**：由于南蛮武将池小（2 人都是 humble/foreign），影响力分布会非常集中，体感极其"原始"
- **未来剧本**：190 开局刘备/孙策/曹操都是 warlord，玩家需要在"扎根vs扩张"之间决策

---

## 五、豪族支持度按阶段 clamp

### STAGE_GENTRY_BOUNDS

| 阶段 | 下限 | 上限 | 说明 |
|---|---|---|---|
| warlord 军阀 | **25** | **70** | 强权保底 · 不得拥戴 |
| regional 一方之主 | 0 | 100 | 完全解锁 |
| regime 政权 | 0 | 100 | 完全解锁 |

**实装位置**：`processGentry` 函数末尾统一 clamp pass，对所有 city.gentry 和 city.counties[].loyalty 按 stage 应用 bounds。

**军阀的实际优势**：
- 即使太守差、豪族抗拒，gentry 不会跌破 25——保证基本的征兵能力
- 代价：再好也到不了拥戴区（80+）——永远没有"乡勇动员"等解锁效果
- 体感：军阀靠刀把子摁住地方，不是靠人心

---

## 六、涉及改动的函数/位置清单

### 新增（v172）

| 函数 | 位置 | 行数 | 说明 |
|---|---|---|---|
| `getStage(fid)` | v172 stage 块 | 1 | 读取阶段 |
| `getAnchorState(fid)` | 同 | 1 | 读取 anchor 州 |
| `countCitiesInState(fid, s)` | 同 | 1 | 某州城市数 |
| `countFacCities(fid)` | 同 | 1 | 势力总城数 |
| `getQualifiedStates(fid)` | 同 | 8 | 返回所有≥3城的中/大州 |
| `_updateStateAnchorClock()` | 同 | 15 | 每旬更新 clock |
| `_selectBestAnchor(fid)` | 同 | 20 | 客观选 anchor |
| `checkStagePromotion(fid)` | 同 | 25 | 检查是否可升级 |
| `promoteStage(fid)` | 同 | 22 | 执行升级（含 log/notif） |
| `processStageEvolution()` | 同 | 5 | 每旬主循环 |
| `getStageBadgeText(fid)` | UI helper | 8 | 势力卡片徽章文字 |
| `getStageColor(stage)` | UI helper | 2 | 阶段颜色 |
| `getStageNarrative(fid)` | UI helper | 30 | 派系Tab顶部叙事 |

### 修改（v172）

| 函数/位置 | 改动 |
|---|---|
| `FAC_IDENTITY` | 加 stage + anchorState |
| `initGame` | 初始化 stage/anchorState |
| `FACTION_DEFS` | 加 gentry_hebei/gentry_xuzhou；gentryRegions→gentryStates；humble label→"寒门豪族" |
| `GEN_TAGS`（134条） | region→state；加 clique；6条改 magnate |
| `getGenFactions` / `getGenFaction` | state + clique + magnate 逻辑 |
| `_genInfluence` | **按 stage 差异化乘数**（核心数值表） |
| `isHomeTerrain` | 按士族派系相同判定（跨州同派系也算本土） |
| `processGentry` | 末尾加 STAGE_GENTRY_BOUNDS clamp pass |
| `processFacEthos` | gentryKeys 加 hebei/xuzhou |
| `calcRegionRecruitBonus` | region→state |
| `_serializeG` / `_deserializeG` | FAC_IDENTITY.stage/anchorState/type 进 __meta（旧存档兼容） |
| `nextTurn` | 加 processStageEvolution() 调用 |
| 势力卡片 UI | 加 stage 徽章 |
| 派系Tab UI | 顶部加阶段栏（含距下阶段进度） |
| 小传叙事 | 用士族派系名替代大区名 |
| 腐败/建筑buff/AI太守/豪族事件 | 本地判定改为"同士族派系" |

### 删除（v172）

- `REGION_CITIES`, `CITY_TO_REGION`, `REGION_TO_GENTRY_FAC`, `GENTRY_FAC_TO_REGION`, `regionNames`, `_getCityRegion`
- 腐败/建筑buff 里 `zhongyuan/hebei` 互认的特殊硬编码

---

## 七、存档兼容

v172 存档版本号 `__meta.version = 172`。

**旧存档（v171 及之前）兼容加载**：
- 无 `facIdentity` 字段时 → initGame 初始值生效（三国 regime、孟获 warlord）
- 无 `_stateAnchorClock` 时 → 首次 nextTurn 自动初始化
- GEN_TAGS 是静态常量（代码里写死）→ 新存档用新字段名，旧存档里的武将数据不影响（武将的 state/clique/origin 都从 GEN_TAGS 读，不从存档）

---

## 八、测试覆盖

### 已通过
- ✅ JS 语法检查
- ✅ 14 州 / 45 城完整映射
- ✅ FAC_IDENTITY 初始值（三国 regime、南蛮 warlord）
- ✅ getStage 函数正确返回
- ✅ STATE_CITIES / CITY_TO_STATE 双向映射一致

### 未测试（依赖完整运行环境）
- 实际晋升触发（需 ≥18 旬游戏进程）
- 派系影响力分布前后对比（糜家是否从 gentry_xuzhou 中消失）
- 豪族 bounds clamp 实际效果
- UI 显示渲染

**建议下轮开局后冒烟项**：
1. 新开一局，选孟获，看势力卡片显示"诸侯·军阀"
2. 切到派系Tab，确认顶部阶段栏显示"【军阀】家臣政治·宗族抱团"
3. 魏国势力卡应显示"王·政权"，派系Tab 顶部显示"【政权】..."
4. 检查蜀国派系Tab：糜竺应出现在"寒门豪族"而非"徐州士族"
5. 检查吴国派系Tab：周瑜应出现在"淮泗派"
6. 存档/读档一次，确认 stage 字段保留

---

## 九、v172 未完成 / 下轮待办

### 本版本范围明确**不做**（按制作人指示）

- **官职 tier1 锁死**（军阀/一方之主不能任命 tier1 高级官）→ 下轮实装
- **朝议周期按 stage 差异化**（12旬 vs 9旬 vs 无朝议）→ 待朝议主体实装后做
- **附庸纳贡比例差异化**（军阀附庸仅名义、一方之主 10%/8%、政权 18%/12%）→ 下轮
- **演进降级（流亡/失国）**→ 暂不做，下轮讨论是否需要
- **威压令主动技**→ 制作人否决，改用被动 bounds

### 潜在扩展点（待讨论）

- **clan 层精细机制**：目前 clan/faction_clan 只做 UI 显示，未来如加"郡望抱团 / 清流vs浊流"等可以在这层挂
- **magnate 独立派系**：目前 magnate 走 humble 兜底，未来如要做"豪族献城/豪族私兵"可以拆独立派系
- **政权稀缺性涌现**：目前无硬 cap，观察实际博弈涌现情况后决定是否要加机制（如多政权互相 -20 关系）

---

## 十、设计哲学小结（v172 学到的）

1. **正交维度不要混合**：type（对外合法性）和 stage（对内治理模式）是两个完全独立的维度，混合会导致机制冲突。
2. **数据层不要做"派生层"**：州作为唯一地理单位，比"大区 + 州" 的两层结构更简洁；但要在派系层另设"客居集团"（clique）和"豪族"（magnate）来容纳非地理的语义。
3. **客观判定优于玩家选择**：anchor 州不让玩家选，让机制涌现历史感。
4. **被动 bounds 比主动技好**：豪族上下限 clamp 简单直观，不增加操作负担。
5. **数值表要让"宗族→士族"的稀释自然发生**：创始/宗亲×2→×1.5→×1 的梯度，配合政权阶段士族 ×1.2 本土加成，让曹魏司马氏崛起等历史过程变成数学必然而非脚本硬编码。

---

## 十一、v172 晋升系统 Audit 修复（post-v172）

对 v172 晋升系统做了一次 audit，修复 4 处问题 + 补 1 个新差异化维度。**未改变版本号**（v172 内部修订），新开一局验证即可。

### 修复清单

| # | 问题 | 位置 | 修复 |
|---|------|------|------|
| 1 | clamp 顺序延迟一旬 | `nextTurn`（L16369-16370） | `processStageEvolution()` 提前到 `processGentry()` 之前调用，让当旬晋升的势力立即享受新 stage 的 gentry bounds |
| 2 | 敌方 stage 对玩家明牌 | 势力卡片 UI（L17268） | `fc-stage` 徽章走 `canSee` 判定，敌方不可见时不渲染（与兵/金/粮一致的迷雾策略） |
| 3 | 小州永远无法晋升 | — | **确认为 feature，不改**：北方 ji/qing/you/bing/yan/jiao/nanzhong 全 small，这些势力必须扩张到 large/medium 州才能升 regional。孟获固守南中永远是军阀 = 符合历史张力 |
| 4 | 注释误导 | `processStageEvolution`（L4828） | 改为"每旬一次判定足够，18旬 clock 与 regime 条件天然不会同旬满足"的准确描述 |

### 新增：攻下新城豪族恢复速度按 stage 差异化（B方案）

**设计意图**：晋升 stage 不只是荣誉徽章，应是**扩张成本的实质性下降**。政权有制度/威望，新城豪族快速归顺；军阀靠刀把子，豪族阳奉阴违，恢复被掐住。

**实装位置**：`processGentry` 内 `g1Shared` 计算段（L15692-15714）

#### 差异化的两个因子

| 因子 | warlord | regional | regime |
|---|---|---|---|
| **自然漂移**（每旬基础恢复） | `0` | `+0.05` | `+0.10` |
| **占领期惩罚**（城刚攻下时） | `-0.4/旬` | `-0.3/旬` | `-0.2/旬` |

#### 数值效果测算（外派普通太守，占领期结束后）

- **军阀**：自然 `0` + 太守 `-0.1` = **-0.1/旬**（慢慢流失，依赖 STAGE_GENTRY_BOUNDS 的 25 保底兜底）
- **一方之主**：自然 `+0.05` + 太守 `-0.1` = **-0.05/旬**（微降）
- **政权**：自然 `+0.10` + 太守 `-0.1` = **0/旬**（持平）

**典型情境**：
- 军阀攻下新城用外派太守 → **烫手山芋**，gentry 会长期趴在 25 附近，征兵/赋税效率低下
- 政权攻下新城 → 占领期温和、之后自然恢复，与本地太守叠加能慢慢培养
- 军阀占领期头几旬 `-0.4/旬` 比政权 `-0.2/旬` 严重得多，体感"征服者是不是大势所归"差异强烈

#### 不改的部分

**初始 loyalty 不按 stage 差异化**（`applyGentryOnCapture` 不动）。理由：初始值代表"城市刚陷落时的混乱态"，对谁都一样混乱；**恢复速度才是征服者的威望与制度能力**，正是 stage 该决定的维度。

### 测试建议

新开一局孟获剧本，选孟获（warlord）：
1. 势力卡片应显示"诸侯·军阀"徽章；其他势力（玩家视角看到敌方）**徽章消失**（被迷雾遮蔽）
2. 攻下一座新城 → 观察城市 gentry 数值，前几旬占领期应明显下滑（-0.4/旬），之后稳定在25保底附近
3. 对比：新开一局曹操（regime），攻下新城同样情境下 gentry 应恢复得明显更快

### 审计覆盖

- ✅ JS 语法检查通过（38秒 Node.js new Function 解析）
- ✅ `processStageEvolution` 在 `processGentry` 之前调用
- ✅ 势力卡片 stage 徽章有 canSee 门禁
- ✅ g1Shared 引入 `_stage`/`_occMod`/`_driftMod`，三种 stage 各走一路
- ⚠ 数值平衡**未实战测试**，下轮游戏首先观察：
  - 孟获军阀阶段扩张到益州后 gentry 是否过低导致彻底瘫痪
  - 政权时期 +0.10 自然漂移是否让好太守+本地派系叠加后 gentry 爆表过快

---

## 十二、豪族支持度接入补给系统（post-v172）

**设计目标**：把 city.gentry 从"征兵/赋税/城防"的内政变量，扩展到**战略层的补给能力变量**，让玩家培养豪族/培养敌境反抗势力具有直接的军事价值。

### 设计原则

gentry 是**"该地百姓对其所属城主的支持度"**，天然具有对称性：
- 对城主自己：支持度高 = 粮道畅通 = 消耗低
- 对城主的敌人：支持度高 = 百姓坚壁清野 = 消耗高；支持度低 = **豪族资敌** = 消耗极低

### 实装位置

`buildSupplyMap` 内 BFS 主循环计算 totalCost 处（L22167-22192）。

### 系数公式

每个 hex 按其 `territory[k].cityId` 所属城市的 gentry 计算系数：

```js
// 己方领地（territory[k].fac === fid）
myCoef = clamp( 1 + (50 - gentry) / 50, 0.3, 2.0 )

// 敌方领地（isHostile）
enemyCoef = clamp( 1 + (gentry - 50) / 50, 0.0, 2.0 )

// 中立/同盟/无主/海面：系数 = 1.0（保持原规则）

// 总消耗（豪族系数只作用terrainCost，敌境+3仍独立加）
totalCost = terrainCost * coef + (isEnemy ? 3 : 0)
```

### 不对称 clamp 的原因

| 边界 | 我方系数 clamp | 敌方系数 clamp |
|---|---|---|
| 下限 | **0.3**（保护）| **0.0**（镜像）|
| 上限 | 2.0 | 2.0 |

- **我方下限 0.3**：若无下限，gentry=100 时系数=0，补给零消耗 → 推翻"补给距离"核心机制；0.3 保留梯度但压缩差异
- **敌方下限 0.0**：镜像设计。gentry=0（我方百姓资敌）时敌方系数=0，但 +3 敌境惩罚兜底，总消耗≥3，不会零成本穿透

### 数值梯度实测（BFS 11点补给能走多少格）

| 情境 | 系数 | 总消耗/格 | 11点能走 |
|---|---|---|---|
| 己方平原 gentry=100 | 0.30 | 0.30 | **36.7 格** |
| 己方平原 gentry=70（军阀上限） | 0.60 | 0.60 | 18.3 格 |
| 己方平原 gentry=50（基准） | 1.00 | 1.00 | 11.0 格 |
| 己方平原 gentry=25（军阀下限） | 1.50 | 1.50 | **7.3 格** |
| 己方平原 gentry=0（崩盘） | 2.00 | 2.00 | 5.5 格 |
| 己方山地 gentry=100 | 0.30 | 0.90 | 12.2 格 |
| 己方山地 gentry=0 | 2.00 | 6.00 | 1.8 格 |
| 敌方平原 gentry=100（敌民顽强） | 2.00 | 5.00 | 2.2 格 |
| 敌方平原 gentry=50 | 1.00 | 4.00 | 2.8 格 |
| 敌方平原 gentry=0（资敌） | 0.00 | 3.00 | **3.7 格** |
| 敌方山地 gentry=100 | 2.00 | 9.00 | **1.2 格** |
| 敌方山地 gentry=0 | 0.00 | 3.00 | 3.7 格 |
| 中立平原 | 1.00 | 1.00 | 11.0 格 |

### 与 stage 系统的联动效应

stage 通过 `STAGE_GENTRY_BOUNDS` 限制 gentry 上下限，直接决定补给能力天花板：

| Stage | gentry 范围 | 我方平原补给范围（11点） |
|---|---|---|
| warlord 军阀 | 25-70 | 7.3 - 18.3 格 |
| regional 一方之主 | 0-100 | 5.5 - 36.7 格 |
| regime 政权 | 0-100 | 5.5 - 36.7 格 |

军阀永远"上不去也下不来"——既无法解锁36格的完美补给，也被25的保底防止崩盘。政权/一方之主两端全开放。**晋升stage的战略价值**至此在补给层面也得到体现。

### 与中立领地的处理

中立/同盟/停战势力的领地：**不应用系数**（保持 1.0）。语义上：中立方百姓既无理由帮我方，也无理由拦我方。代码上 `if(terr.fac === fid)`/`else if(isEnemy)` 两路分支外的默认 1.0。

海面（coastal_water，terrain cost=6）：`_buildTerritoryMap` 不覆盖，territory[k]=undefined，系数=1.0 保持不变。

### 可观察的战略涌现

- **北伐战略**：进攻敌方时选择 gentry 低的边缘州（豪族不满/刚易手占领期），补给线能多推进2-3格
- **纵深防守**：经营好的核心城池 gentry 95+，敌军深入时山地补给 9点/格，11点一格半就断粮
- **军阀之痛**：受 25-70 的 bounds clamp，即使内政全优，补给能力也封顶在 18 格；扩张成本显著高于政权
- **资敌惩罚**：自己境内长期低治（gentry<30）会让敌军获得极强推进能力，治国不善会直接转化为军事劣势

### 实测与验证

- ✅ JS 语法检查通过
- ✅ 数值表 14 种情境手算验证符合设计意图
- ✅ 中立/同盟/海面走默认 1.0 路径
- ⚠ 缓存：`buildSupplyMap` 按旬缓存，而 gentry 每旬只在 `processGentry` 里更新一次，**时序一致**无需额外invalidate。但若未来引入旬内突变 gentry 的事件，需同步清理 `_supplyCache`



---

## v173 战斗碰撞动画（野战可视化第一步）

### 设计意图

从"点迎战→数字瞬变→弹战报"的静默结算，加一层 2 秒的碰撞可视化，让战斗有"发生过"的感觉。保持战斗结算数学零侵入，所有既有战斗流程不变。

### 需求锁定

| 项 | 选择 |
|---|---|
| 动画风格 | 中等：碰撞+震动+飘损失数字 |
| 总时长 | 2000ms（4 阶段） |
| 触发范围 | 仅**玩家参与的野战**（非营寨/伏击/攻城/水战） |
| AI vs AI 战斗 | 不播，沿用静默结算 |
| 缩放跟随 | 动画层挂在 `mapRoot` 内，自动随 `_mapScale` 缩放 |
| 飘字配色 | 我方**白字红描边**（代价），敌方**红字白描边**（斩敌） |
| 跳过 | **不可跳**（2s 不长，值得看完） |
| 叫阵/单挑 | 本轮不动，保持原有流程（对峙弹窗拆分留待后续迭代） |

### 动画时序（2000ms）

| 阶段 | 时间 | 内容 |
|---|---|---|
| Phase 1 | 0-400ms | 双方 unit 从原 hex 向中心点冲 60% 距离（easeInOut） |
| Phase 2 | 400-550ms | 中心闪 ⚔ 符号 + 扩散圆，地图左右震动 2px |
| Phase 3 | 550-1600ms | 每支部队头顶飘损失数字 `-NNN`，上飘 22px+淡出 |
| Phase 4 | 1600-2000ms | 败方向原位回位 + 褪色到 0.45/0.25（几乎全歼时）；胜方回位 + 轻微放大 1.15 回弹 |

### 架构要点

**动画层**：
- 挂在 `#mapRoot` 内，自动继承地图的 translate+scale 变换
- 类名 `.battle-anim-layer`，动画结束自动 remove，finally 兜底再扫一遍

**幻影旗帜**：
- 动画期间**隐藏原 unit 的 SVG `<g>`**（用 `visibility:hidden`），同时在动画层画一份视觉完全一致的"幻影"
- 幻影走动画，原 svg 不动——动画结束恢复可见性，再 renderAll
- 幻影尺寸和样式完全复用 `renderUnitsOnMap` 的绘制规则（FLAG_W=28, FLAG_H=16, POLE_H=18, `invS=1/_mapScale`）

**位置快照**（关键修复）：
- `doRetreat` 在战斗结算中会改败方的 `hq/hr` 为撤退后位置
- 所以在 `confirmBattle` 调用 `_resolveBattleEngagement` **之前**，先快照双方 `{id: {hq, hr}}` 到 `_battlePosSnap`
- 动画函数签名 `_playBattleCollisionAnim(attackers, defenders, report, posSnap)`，优先用快照位置

**动画引擎**：
- 用 **SVG attribute transform + requestAnimationFrame 手动插值**
- **不用 Web Animations API 的 CSS transform on SVG**（浏览器兼容性不稳定，SVG attribute transform 与 CSS transform 会冲突）
- 例外：`mapSvg` 震动用 `element.animate()`（mapSvg 是根 `<svg>`，CSS transform 对其安全）
- 自实现 `EASE.linear/easeOut/easeIn/easeInOut`
- 并行 tween 用 `Promise.all`（Phase 1/4 所有 unit 到位）
- Fire-and-forget tween 用 `_startTween`（Phase 2 的⚔扩散圆、Phase 3 的飘字淡出，无需 await）

### 跳过触发条件（动画函数入口统一检查）

| 条件 | 行为 |
|------|------|
| `_fastForward === true` | 直接 resolve，不播 |
| `_battleAnimating === true` | 重入保护，直接 resolve |
| `attackers` 或 `defenders` 空 | 直接 resolve |
| `report.type !== 'battle'` | 非野战（retreat/ambush/camp/siege），不播 |
| `report.isNaval === true` | 水战不播 |
| AI vs AI（双方都非玩家方） | 不播 |
| 所有参战 unit 的战前 hex 都不在玩家 FOG_VISIBLE | 不播 |
| `mapRoot` 元素不存在 | 不播 |

### 鲁棒性保护

1. **整体 try/catch**：任何异常都被捕获、console.error，finally 继续清理
2. **finally 清理**：`_battleAnimating = false`，再扫 mapRoot 清残留动画层，再扫 unitsLayer 恢复任何 `visibility:hidden` 的 unit
3. **动画失败不阻塞战报**：即使动画抛异常，Promise resolve，后续 `setTimeout(showNextBattleReport, 300)` 照常执行
4. **读档兼容**：`_battleAnimating` 不在 G 下，不进存档；`posSnap` 只是局部变量，无持久化需求

### 改动清单

| # | 位置 | 改动 |
|---|------|------|
| 1 | CSS ~496 行 | 新增 `.ba-loss` / `.ba-clash-mark` / `baUnitShake` / `baMapShake` 关键帧（24 行） |
| 2 | 新函数 `_baGetUnitRenderPos` ~24886 行 | 获取 unit 渲染位置（含 stack 扇形偏移），接受 posOverride |
| 3 | 新函数 `_playBattleCollisionAnim` ~24917 行 | 完整 4 阶段动画（~310 行） |
| 4 | `confirmBattle` ~27300 行 | 改为 `async function`，调用 `_resolveBattleEngagement` 前快照位置，后 await 动画 |

**总计**：+439 行，零删除。v172 总行数 35190 → v173 总行数 35629。

### 验证

- ✅ **全文件 JS 语法校验通过**（`node --check` 无报错）
- ✅ 所有 `confirmBattle` 调用点都是 HTML onclick 或 onclick 回调（fire-and-forget），async 返回 Promise 被丢弃不报错
- ✅ `_resolveBattleEngagement` 本身未动；`resolveBattle` / `resolveAmbush` / `resolveSiegeBattle` / `resolveCampBattle` 等战斗数学零改动
- ✅ `autoResolvePendingBattle`（快进路径）未动，不会播动画
- ✅ `_battleAnimating` 变量名未被项目占用，声明一次，读一次，置 true 一次，置 false 一次（finally）

### 已知限制 / 设计取舍

1. **飘字数字是按 unit 数量平均分摊**：总损失 `report.atkLost` 均分给每支参战部队显示，不精确到 squad 级。原因：`resolveBattle` 已经改了 `sq.troops`，无法从 report 反推每支 unit 的真实损失；动画只求视觉感，数字精确度留给战报弹窗
2. **全歼 unit 的幻影仍然会播动画回位**：此时原 svg 已经被 `G.units.filter` 标记为"会消失"，但动画结束前尚未 renderAll；幻影按战前位置回位 + 褪色到 0.25，视觉上表现为"空位还有个淡影"，符合"全歼"语义。下一次 renderAll 后淡影消失
3. **stack 扇形偏移用当前 G.units 计算**：`_baGetUnitRenderPos` 里的 stack 判定用 `allUnits.filter(u => u.hq === hq && u.hr === hr)`，理论上应该用战前位置算，但**同 hex 多 unit 的场景少见**，且偏移误差 ≤ 14px，肉眼几乎感知不到，暂不优化

### 下一步（用户待反馈）

用户测试后视情况调：
1. **尺寸**：幻影旗帜用 FLAG_W=28 / FLAG_H=16（主项目标准），但如果觉得太小可以临时放大幻影（实装值在 `makePhantom` 函数内）
2. **总时长**：2000ms 如果觉得太长/太短，可以整体缩放（改 Phase 1-4 的 400/150/1050/400 四个数字即可）
3. **震动幅度**：Phase 2 的 mapSvg 震动用 ±2px，如果觉得不够可以加到 ±3~4px
4. **飘字字号**：`Math.max(7, 11*invS)`，其中 11 是主系数，可调

### 实装后调参（v173 首轮反馈）

用户反馈：**飘字太大、总时长太短（体感一闪而过）**。调参如下（保持数学和触发条件不变）：

| 参数 | 原值 | 新值 |
|------|------|------|
| 飘字字号主系数 | 11 | **8** |
| 飘字字号下限 | 7 | **5** |
| 飘字描边粗度 | 1.6 | **1.2** |
| Phase 1 相撞 | 400ms | **550ms** |
| Phase 2 sleep | 150ms | **250ms** |
| Phase 2 扩散圆 | 480ms | **700ms** |
| Phase 2 ⚔总时长 | 850ms | **1200ms** |
| Phase 2 震动 | 220ms | **320ms** |
| Phase 3 飘字停留 | 1050ms | **1700ms** |
| Phase 3 飘字曲线 | 0.15 fadeIn/0.60 停留/0.25 fadeOut | 0.12 fadeIn/**0.68 停留**/0.20 fadeOut |
| Phase 4 回位 | 400ms | **700ms** |
| Phase 4 回弹 | 380ms | **650ms** |
| **总时长** | **2000ms** | **3200ms** |

### 刀剑特效（v173 第二轮追加）

用户反馈：碰撞只有静态⚔缺乏"真刀真枪"质感。方案 C 实装：

**刀光 × 4 道**（规整方向，错峰出现）：
- 角度：`0° / 45° / 90° / 135°` 四方向
- 错峰：`[0, 40, 80, 120]ms` 依次出现（刀光#1 在 550ms 出，刀光#4 在 670ms 出）
- 单道生命 200ms：0-30% 快速拉伸 / 30-60% 保持 / 60-100% 淡出
- 长度 `13*invS`，stroke `rgba(255,245,225,.92)`，粗度 `1.4*invS`
- SVG `<line>` 实现，以 (mx, my) 为中心向两端对称延伸

**火星 × 8 粒**（650ms 爆发，100ms 延迟触发）：
- 角度：均匀分布 360°（每粒 45°）+ ±0.3 弧度随机偏移
- 飞行：8-14px 随机距离，二次函数淡出
- 单粒生命 350ms，r 从 `1.0*invS` → `0.3*invS`
- 两色交替：橙 `rgba(255,180,60,.9)` × 4，红 `rgba(255,100,40,.85)` × 4

**实装点**：`_playBattleCollisionAnim` 内 Phase 2 扩散圆之后、⚔之前，+84 行。所有元素 appendChild 到 animG，统一 remove 清理。setTimeout 触发时机（最迟 120ms 延迟）远早于 Phase 2 结束（800ms），不会出现孤儿元素问题。

### 刀剑特效调整（v173 第三轮）

用户反馈：**刀光不够锐利、要深色；火星几乎看不见；整体稍花哨**。调整方案：

**刀光**（白色直线 → 朱砂梭形，3 道扇形）：

| 参数 | 原值 | 新值 |
|------|------|------|
| 数量 | 4 道 | **3 道** |
| 角度 | 0°/45°/90°/135° | **30°/90°/150°**（扇形分布） |
| 错峰间隔 | 40ms | **50ms** |
| 颜色 | `rgba(255,245,225,.92)` 白色 | **`rgba(20,15,10,.9)` 深墨黑**（首轮选朱砂，用户反馈仍要深色，改用纯黑对比最强） |
| 形状 | `<line>` 等粗直线 | **`<path>` 梭形**（两端尖中间粗） |
| 长度 | 13×invS | **16×invS**（半边 8×invS） |
| 中间宽度 | stroke=1.4×invS | **半宽 1.2×invS** |

梭形绘制：4 点菱形路径 `M前尖 L右腰 L后尖 L左腰 Z`，相对 rad 方向延伸，拉伸期间 scale 0→1 整体放大。

**火星**（加大加亮）：

| 参数 | 原值 | 新值 |
|------|------|------|
| 数量 | 8 粒 | **6 粒** |
| 起始半径 | `1.0*invS` | **`1.8*invS`** |
| 收尾半径 | `0.3*invS` | **`0.5*invS`** |
| 飞行距离 | 8-14px | **10-18px** |
| 亮橙 | `rgba(255,180,60,.9)` | **`rgba(255,200,80,.95)`**（更亮） |
| 暖红 | `rgba(255,100,40,.85)` | **`rgba(255,130,50,.95)`**（更亮） |

**⚔ 符号 + 刀光调色**（用户反馈"不要纯黑，改墨灰"，最终统一为水墨色）：

| 元素 | 中间值 | 最终值 |
|------|--------|--------|
| ⚔ fill | 朱红 `#c03030` → 纯黑 `rgba(20,15,10,.95)` | **墨灰 `rgba(44,36,22,.92)`**（≈主项目 var(--ink) `#2c2416`） |
| ⚔ stroke | 纯白 `rgba(255,245,225,1)` | `rgba(255,245,225,.9)` 浅米（轻微透明） |
| 刀光 fill | 白 → 朱砂 → 纯黑 | **墨灰 `rgba(44,36,22,.9)`**（与⚔统一） |

现在 Phase 2 的颜色语言：墨灰刀光 + 墨灰⚔ + 朱砂扩散圆 + 亮橙/暖红火星。深沉水墨为主、暖色点缀，符合项目整体美学。

### 叫阵单挑前奏动画（v173 第四轮，方向 B 实装）

用户选择方向 B：叫阵单挑以前奏动画形式在**地图上**演出，保持战斗确认弹窗 UI 不动。

**触发条件**：
- confirmBattle 内 `activeDuel && activeDuel.accepted === true`（玩家主动叫阵被 AI 接受，或 AI 主动叫阵被玩家接受）
- 非快进、非重入

**不触发**：
- AI 拒绝玩家叫阵 / 玩家拒绝 AI 叫阵 → 沿用现有"士气±5"文字提示
- 伏击/营寨/攻城/水战 → 这些战斗走各自的 confirm 函数（不经过 confirmBattle）
- AI vs AI 战斗 → 本来就不走 confirmBattle

**前奏总时长 ~2000ms**，四阶段：

| 阶段 | 时间 | 内容 |
|------|------|------|
| A0 出阵 | 0-400ms | 两个武将小名牌（22×13px，部队旗帜 80% 尺寸）从各自 unit 位置滑出到阵前中点附近（距中点 18×invS） |
| A1 喊话 | 400-1100ms | 挑战方先喊"${epithet}在此！谁敢与我一战！"，应战方回"${epithet}来也！"；文字淡入 + 名牌轻微抖动 |
| A2 交锋 | 1100-1500ms | 两名牌向中点冲 85%，中点闪 1 道横向墨灰梭形刀光，地图微震（幅度比碰撞动画小一半） |
| A3 结果 | 1500-1800ms | 中间浮出结果大字（朱砂红 `#c03030`，11×invS 字号）：胜/斩XX/挫XX/XX败走/不分胜负 |
| A4 归阵 | 1800-2000ms | 败者褪色到 0.2 淡出；胜者/平手归阵 |

**文案精细度**（混合方案）：
- 核心名将 15 人硬编码全称号（`DUEL_EPITHET` 表）：关羽→"美髯公关云长"、张飞→"燕人张翼德"、赵云→"常山赵子龙"、吕布→"飞将吕奉先"、马超→"锦马超"、黄忠→"老将黄汉升"、许褚→"虎痴许仲康"、典韦→"古之恶来典韦"、张辽→"雁门张文远"、夏侯惇→"盲夏侯元让"、夏侯渊→"妙才夏侯渊"、孙策→"小霸王孙伯符"、甘宁→"锦帆甘兴霸"、太史慈→"东莱太史子义"、周泰→"幼平周泰"
- 其他武将：直接用名字（如"曹仁在此！谁敢与我一战！"）

**结果文案**：
- `outcome=atkWin` + `duelKillResult.result=dead` → "斩 ${defName}"（击杀）
- `outcome=atkWin` + `duelKillResult.result=wounded` → "挫 ${defName}"（重伤）
- `outcome=atkWin` + 无击杀 → "胜"
- `outcome=defWin` → "${atkName} 败走"
- `outcome=draw` → "不分胜负"

**代码位置**：
- `DUEL_EPITHET` 表 + `_getDuelEpithet()` + `_playDuelPreludeAnim()` 在 `_battleAnimating` 声明之后、`_baGetUnitRenderPos` 之前（共 ~270 行）
- `confirmBattle` 内调用：`_duelChallenger = null` 之后、位置快照之后、`_resolveBattleEngagement` 之前（~20 行）

**数据调研结论**：
- GEN_MAP 无字号数据 → 用 `DUEL_EPITHET` 硬编码全称号解决
- GEN_TAGS 有 `state`（州代号）但非古籍贯 → 未启用
- resolveDuel 返回 `outcome / duelKillResult / atkName / defName` 完整，直接读取
- `activeDuel.aiWasChallenger` 可靠但本轮未区分使用（无论挑战方是玩家还是 AI，前奏都播——对称处理）

**未做（留待后续）**：
- 玩家拒绝叫阵 / AI 拒绝叫阵时的视觉反馈（当前仅文字+士气变化）
- 前奏动画在多场连续战斗中的"递减压缩"机制（首场 2s、第二场 1.2s、第三场 0.8s 之类的衰减）

### 叫阵前奏调整（v173 第五轮）

用户反馈：**名牌和部队旗视觉太像、喊话一闪而过、胜败字谁胜谁败不清楚**。调整如下：

**名牌重设计：小旗 → 圆形武将令牌**

| 元素 | 原设计 | 新设计 |
|------|-------|-------|
| 形状 | 矩形旗帜（22×13，带旗杆） | **圆形令牌**（半径 NP_R=11） |
| 结构 | 旗面色条+底色+名字 | **3 层圆**：外阴影圈 (r=12) + 主圈墨底+势力色边 (r=11, fill `rgba(44,36,22,.92)`, stroke 势力色 2px) + 内装饰圈 (r=8.8, 势力色 .5px stroke) |
| 武将名颜色 | 米白描黑 | **米白色 `rgba(245,232,200,1)` 居中，字号 9px，无描边**（圆形底色够深不需描边） |
| 旗杆 | 有（14px） | **无**（令牌直接悬浮） |
| 与部队旗区别度 | 低 | **高**（形状完全不同） |

**喊话时长**：挑战方/应战方各 350ms → **各 700ms**（每方停留从 150ms 拉到 500ms，看得清）。前奏总时长 2000ms → **2700ms**。

**胜败文案（统一胜方名+动词）**：

| 情况 | 原文案 | 新文案 |
|------|-------|-------|
| 挑战方胜+击杀 | `斩 ${defName}` | **`${atkName} 斩敌`** |
| 挑战方胜+重伤 | `挫 ${defName}` | **`${atkName} 挫敌`** |
| 挑战方胜+普通 | `胜`（歧义） | **`${atkName} 胜`** |
| 应战方胜 | `${atkName} 败走`（败方名） | **`${defName} 胜` / `${defName} 挫敌` / `${defName} 斩敌`**（胜方名+动词） |
| 平手 | `不分胜负` | 保持 `不分胜负` |

现在所有胜方文案模式一致：`胜方名 + [胜/挫敌/斩敌]`，不会产生"这个名字是谁？是赢的还是输的？"的疑问。

### v173 未做（留待后续迭代）

- **对峙弹窗**：把叫阵从战斗确认弹窗拆成战前独立阶段（按原计划 Step 2）
- **单挑动画**：叫阵接受后在弹窗里播两将对冲动画（Step 3）
- **营寨/伏击/攻城/水战的碰撞动画**：各有专属氛围，一个个单独设计
- **AI vs AI 战斗的可视化**：沿用当前日志+战报，不做动画

---

## v174 战斗动画扩展（Step 0 共享基建 + Step 1 营寨战）

### 设计意图

v173 只做了**野战**的碰撞动画和叫阵前奏。本轮把动画能力扩展到其他战斗类型。按"先抽共享基建、再逐个实装"的节奏推进，避免每种战斗都复制粘贴 300 行。

本轮实装：**Step 0（_baCore 共享模块）** + **Step 1（营寨战动画 raid/assault）**。
待做：Step 2 伏击 / Step 3 攻城 / Step 4 水战。

### 架构变更：_baCore 模块（Step 0）

v173 的 `_playBattleCollisionAnim` 和 `_playDuelPreludeAnim` 内部各自复制了一套 `EASE/_runTween/_startTween` + `ns` + `makePhantom`。本轮抽出为模块级工具，避免后续 5 种动画重复 5 次。

**位置**：`_battleAnimating` 声明之后（约 24888 行），`DUEL_EPITHET` 表之前，IIFE 闭包 `const _baCore = (() => {...})()`。

**导出 17 个 API**：

| 类别 | API | 用途 |
|------|-----|------|
| 常量 | `SVG_NS` | `'http://www.w3.org/2000/svg'` |
| 常量 | `EASE` | `{linear, easeOut, easeIn, easeInOut}` |
| Tween | `runTween(duration, onUpdate, easing) → Promise` | 主 await tween，rAF 驱动 |
| Tween | `startTween(duration, onUpdate, easing)` | fire-and-forget，并行副特效 |
| 门卫 | `shouldSkip(attackers, defenders, report, posSnap) → bool` | 统一跳过条件（快进/锁/空/AI-vs-AI/迷雾/mapRoot） |
| 挂载 | `ensureAnimLayer(className) → {animG, mapRoot, invS}\|null` | 创建 animG 挂 mapRoot，返回句柄 |
| 特效 | `spawnClashRing(animG, mx, my, opts)` | 朱砂扩散环 |
| 特效 | `spawnSlashes(animG, mx, my, opts)` | 墨灰梭形刀光（可指定 angles） |
| 特效 | `spawnSparks(animG, mx, my, opts)` | 火星粒子爆发 |
| 特效 | `spawnClashMark(animG, mx, my, opts)` | ⚔ 碰撞标记 scale 动画 |
| 特效 | `shakeMapSvg(opts)` | mapSvg CSS transform 震动 |
| HUD | `spawnLossText(animG, x, y, lost, isPlayer, invS) → SVGText` | 损失飘字（按敌我分色） |
| HUD | `floatLossText(el, startY, duration, invS) → Promise` | 飘字向上漂移 + 淡出 |
| HUD | `spawnResultText(animG, mx, my, text, color, invS) → SVGText` | 结果大字 |
| HUD | `animateResultText(el, mx, my, duration) → Promise` | 结果大字 fadeIn/hold/fadeOut |
| 幻影 | `makePhantom(animG, unit, startPos, invS) → SVGG` | 陆战旗帜幻影（复用 v173 样式） |
| 兜底 | `cleanupAnimLayers(classNames[])` | 扫 mapRoot 清指定 class + 恢复 unitsLayer hidden |

**原则**：
- 纯工具（除 cleanupAnimLayers 会动 DOM 外），不持有状态
- `_battleAnimating` 锁**继续全局**，不进 `_baCore`（调用方自己管理锁）
- 所有函数都以 animG 为挂载点，由调用方负责 animG 的创建/销毁

**原 2 个动画函数的改动**（最小侵入）：
- DuelPrelude 内 23 行内联 EASE/runTween → `const _runTween = _baCore.runTween; const _startTween = _baCore.startTween;` 2 行
- BattleCollision 同上 + `makePhantom` 改为 wrapper：`const makePhantom = (unit, startPos) => _baCore.makePhantom(animG, unit, startPos, invS);`
- 业务逻辑所有调用点字面不变（通过本地别名桥接）

### Step 1 营寨战动画

**两个路径**：
- `mode === 'raid'`（奇袭夜袭）~2800ms：**夜幕覆盖 + 火把闪烁 + 攻方俯冲 + 守方惊起抖动 + 门楣倒塌 + 密集橙色火星 + 结果大字**
- `mode === 'assault'`（正面强攻）~3400ms：**白昼 + 稳定火把 + 3 波冲击（前冲→栅栏晃动→回拉）+ 决定性冲击 + 右墙坍塌（胜利时）**

**栅栏剪影**（共用组件 `_baDrawCampPalisade(animG, cx, cy, invS, alerted) → {leftWall, rightWall, lintel, torches}`）：
- 2 段主墙（左/右，中间有寨门缺口）
- 8 根桩尖（左 4 右 4）
- 2 根门柱 + 1 根门楣横梁
- 2 盏火把（`alerted=false` 时画）
- 所有尺寸 `× invS` 反抵消 _mapScale

**挂接触发点**：
- `confirmCampBattle(mode)` → `async function`，在 `resolveCampBattle` 之前加位置快照 `_campPosSnap`，之后 `await _playCampBattleAnim(campReport, playerSide, enemySide, _campPosSnap)`（玩家攻方路径）
- `aiInitiateBattle` 营寨战 3 个分支（玩家攻方 / 玩家守方 / AI vs AI）**都**把请求 push 到 `_pendingBattleAnimations`

### 关键架构新增：_pendingBattleAnimations 队列（本轮调试核心发现）

**发现的根本问题**：`nextTurn` 在旬初第一件事就是 `document.getElementById('mapRoot').remove()`（v115 优化，"旬切换必须全量重建"）。AI 攻玩家的战斗在 `runAI` 中触发 `aiInitiateBattle`，此时 mapRoot 已被 remove、还未 renderAll 重建。如果此刻尝试播动画，`ensureAnimLayer` 返回 null → 动画被 skip。

**解决**：动画请求队列 + 延迟 drain

```js
let _pendingBattleAnimations = [];
// 结构：{ kind: 'camp'|'ambush'|'battle'|'siege'|'naval', report, attackers, defenders, posSnap }

async function _drainPendingBattleAnimations(){
  if(_fastForward){ _pendingBattleAnimations = []; return; }
  // ★ 等事件 modal / 围城到达 modal 关闭
  let _waitCycles = 0;
  while((G._pendingEvent || _pendingSiegeArrival) && _waitCycles < 600){
    await sleep(100);
    _waitCycles++;
  }
  while(_pendingBattleAnimations.length){
    const req = _pendingBattleAnimations.shift();
    try {
      if(req.kind === 'camp' && typeof _playCampBattleAnim === 'function'){
        await _playCampBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
      }
      // Step 2+: ambush / siege / naval 分支在后续轮次扩展
    } catch(e){ console.error('[drainAnim] kind=' + req.kind + ' failed:', e); }
  }
}
```

**调用点**：`nextTurn` 内 `renderAll()` 之后、`setTimeout(showNextBattleReport, 300)` 之前，`_drainPendingBattleAnimations()` fire-and-forget。

**配套修改**：`showNextBattleReport` 入口加等锁逻辑：
```js
if(_battleAnimating){ setTimeout(showNextBattleReport, 200); return; }
```
drain 期间 `_battleAnimating=true`，战报弹窗自动延后到动画播完。

**协同时序**（AI 攻玩家营寨场景）：
1. `nextTurn` → `rollEventsV2()` 弹事件 modal
2. `runAI()` → `aiInitiateBattle()` → push 战报 + push 动画请求到 `_pendingBattleAnimations`
3. `renderAll()` 重建 mapRoot
4. `_drainPendingBattleAnimations()` 启动 → **等事件 modal 关闭**（每 100ms 轮询，最多 60s 超时）
5. 用户点事件选项 → `G._pendingEvent = null`
6. drain 检测到 → 开始播动画 → `_battleAnimating = true`
7. 动画跑完 → `_battleAnimating = false`
8. nextTurn 尾部的 `setTimeout(showNextBattleReport, 300)` 触发 → 看到锁已释放 → 战报弹窗

### 触发模式统一（所有战斗动画都应这样挂）

| 场景 | 触发方式 |
|------|---------|
| 玩家主动发起战斗 | `confirmXxx` async + `await _playXxxAnim(...)` 直接 await |
| AI 主动攻玩家 | `aiInitiateBattle` push `_pendingBattleAnimations` + drain 统一播 |
| AI vs AI（玩家可见） | 同上（push 队列，`_baCore.shouldSkip` 按迷雾判断是否真播） |
| AI vs AI（玩家不可见）| push 队列，`shouldSkip` 返回 true 跳过 |
| 快进 | `shouldSkip` 直接 true，drain 直接清空队列 |

### 调试过程中发现的 4 个坑（已修复，记录供参考）

1. **`setTimeout(..., 0)` 触发动画太早**：AI 攻玩家场景下 mapRoot 已被 remove，动画无处挂载 → 改用队列
2. **事件弹窗与动画同时显示**：视觉重叠 → drain 入口等 `G._pendingEvent` 关闭
3. **showNextBattleReport 和动画赛跑**：战报可能先弹 → 入口加等 `_battleAnimating` 锁
4. **jsdom 里 `window.G` 和脚本内 G 是两个引用**：测试脚本要用 `window.G = G` 桥接才能在外部访问（仅影响测试，不影响产品）

### 改动清单

| # | 位置 | 改动 |
|---|------|------|
| 1 | ~24888 行（`_battleAnimating` 之后）| 插入 `_baCore` IIFE 模块（+397 行） |
| 2 | ~24894 行 | 新增 `_pendingBattleAnimations[]` + `_drainPendingBattleAnimations()` 函数（+28 行） |
| 3 | DuelPrelude 内（~25357 行）| EASE/runTween 段 23 行 → 4 行别名（-19 行） |
| 4 | BattleCollision 内（~25712 行）| EASE/runTween/makePhantom 50 行 → 4 行别名（-46 行） |
| 5 | ~26040 行 | 新增 `_baDrawCampPalisade()` + `_playCampBattleAnim()`（+435 行） |
| 6 | `confirmCampBattle` ~27926 行 | 改 async + 位置快照 + await 动画（+15 行） |
| 7 | `aiInitiateBattle` 营寨战 3 分支 ~27047-27083 | 每个分支 push 队列（+27 行） |
| 8 | nextTurn ~16510 行 | `renderAll()` 后调 `_drainPendingBattleAnimations()`（+3 行） |
| 9 | showNextBattleReport ~29200 行 | 入口加等锁（+4 行） |

**总计**：+770 行（基建 425 行 + 营寨战 435 行 + 队列机制 30 行 + 挂接 22 行 - 替换掉的内联 142 行）。v173 总 36086 → v174 总 36924。

### 验证

- ✅ **全文件 JS 语法校验通过**（`node --check`）
- ✅ 原 v173 两个动画函数（碰撞 + 叫阵）行为完全等同（别名桥接零侵入）
- ✅ `_baCore` 17 个 API 全部 export 正确
- ✅ `runTween(50ms)` 实测 52ms 到达 t=1
- ✅ `shouldSkip` 空攻守/AI-vs-AI 正确返回 true
- ✅ `_baDrawCampPalisade` 生成 15 个 SVG 子元素（2 墙+8 桩+2 门柱+1 门楣+2 火把）
- ✅ 端到端：raid 3214ms/3478ms、assault 3973ms/3978ms，动画层清理、锁释放
- ✅ 快进清空队列不播
- ✅ AI 攻玩家场景真实浏览器测通（事件→动画→战报顺序正确）

### 已知限制 / 下轮可改进

1. **drain 入口等锁未预占**：drain 等事件 modal 期间 `_battleAnimating=false`，理论上可能 `setTimeout(showNextBattleReport, 300)` 命中 → 但因为事件 modal 还开着用户根本看不到战报（modal 挡着）→ 实测不是问题，留个注释即可
2. **raid 的 `raidSuccess` 字段**：动画读 `report.raidSuccess`，fallback 到 `atkWins`。`resolveCampBattle` 是否永远填 `raidSuccess`？本轮未强制审计，留待 Step 2 做伏击时统一对齐
3. **AI vs AI 动画**：当前 `_baCore.shouldSkip` 按迷雾判断，若玩家完全看不见则跳过。但如果玩家可见则**实际上会播**——这可能导致玩家在玩自己部队时突然地图角落冒出别人的战斗动画，有点突兀。需要实际体验决定是否限制
4. **drain 60s 超时兜底**：用户挂机 60s 后动画被跳过，战报直接弹。不太可能触发，但万一用户开着事件 modal 去接电话，60s 后回来可能错过动画。可考虑改为无限等待

### v174 未做（留待后续迭代）

- **Step 2 伏击战动画**：按原型 v0.2 方向 A（地形色遮罩 → 潜伏收缩 → 弹性跃出 → 单侧冲击 → 败方炸成残兵）。挂接点：`confirmAmbush` async 化 + `checkAmbushTriggers` AI 分支 push 队列。
- **Step 3 攻城战动画**：4 幕长镜头（列阵 → 抛物线箭雨 → 云梯 + 攀爬 → 垛口碎裂），守方野战部队画在城门口内侧，"城破"/"退敌"文案。挂接点：`confirmSiegeBattle` async 化 + aiInitiateBattle 攻城分支。
- **Step 4 水战动画**：船型幻影（三角帆 + 船身）+ 冷色水花 + 涟漪；火攻版加 Bezier 火焰柱 + 败方倾斜。需要新增 `_baCore.makeShipPhantom`。挂接点：`confirmBattle` 水战分支（`report.isNaval`）。
- **drain 入口锁预占**：把 `_battleAnimating = true` 上移到 drain 等待事件 modal 之前，杜绝极端竞态（设计更干净）
- **单挑动画**：叫阵接受后在弹窗里播两将对冲动画（v173 留的 Step 3）
- **AI 拒绝叫阵 / 玩家拒绝叫阵的视觉反馈**（v173 未做）

### 扩展 Step 2+ 的模板

新增一种战斗动画的标准路径：
1. 新增 `_playXxxBattleAnim(report, attackers, defenders, posSnap)` 函数，用 `_baCore` 的工具组装
2. 挂接主动路径：`confirmXxx` 改 async，加位置快照 + await 动画
3. 挂接被动路径：`aiInitiateBattle` 对应分支改为 push `_pendingBattleAnimations`（`kind: 'xxx'`）
4. 扩展 `_drainPendingBattleAnimations` 内 while 循环的 kind 分支
5. **不需要改** showNextBattleReport、nextTurn、`_baCore` 本体

---

## v175 战斗动画扩展（Step 2 伏击 + Step 3 攻城 + Step 4 水战）

### 设计意图

本轮完成 v174 已建好模板下的三种战斗动画：**伏击 / 攻城 / 水战**。全部沿用 v174 的
`_baCore` + `_pendingBattleAnimations` 模板，不改任何共享基建主干，只做：
1. 在 `_baCore` 里新增 `makeShipPhantom`（船型幻影）
2. 新增 3 个 `_playXxxBattleAnim` 函数
3. 攻城动画的专属辅助函数 `_baDrawCityWall`
4. 在 `_drainPendingBattleAnimations` 里扩展 3 个新 kind 分支
5. 挂接主动/被动双路径

### 项目快照更新

| 项目 | 当前值 |
|------|--------|
| 文件名 | project_romance_v175.html |
| 总行数 | ~38012 行（v174: 36924，+1088） |
| 战斗动画 | v173-v175：5 种战斗全部实装动画（野战/营寨/伏击/攻城/水战），叫阵前奏动画一并保留 |

### 新增 `_baCore.makeShipPhantom`

位置：`_baCore` 模块内，紧跟在 `makePhantom` 之后。

**签名**：`makeShipPhantom(animG, unit, startPos, invS) → SVGGElement`

**视觉组成**（8 个子元素）：船底水线（椭圆）、船身 path（带上下弧线的圆角鼓腹形）、
甲板条、桅杆（line）、三角帆 path、帆中央武将名、船身下兵力标签底条、兵力数字。

**势力色映射**：复用 `makePhantom` 的 `FAC_FLAG_COL`（wei/shu/wu/nanman），帆填色用相同的
淡色基调，船身边框用势力主色。

**与 `makePhantom` 的差异**：
- 船有上下凸出（船身向下、桅帆向上），整体视觉占位更高
- 没有旗杆，改用桅+帆
- 兵力标签在船身下方（陆战旗是在旗杆处）

### Step 2 伏击战动画（`_playAmbushBattleAnim`）

实装方向 A：**地形色遮罩 → 潜伏收缩 → 弹性跃出 → 单侧冲击 → 败方残兵**。

**路由逻辑**：
- `report.ambushHit === true`：走完整 4 幕（总 ~3000ms）
- `report.ambushHit === false`：跳过 Ph1 潜伏和 Ph2 跃出，改成"被伏方警觉抖动 200ms"
  后直接进 Ph3 单侧冲击（总 ~2400ms）

**关键特效**：
- 地形色遮罩椭圆：`forest=绿 / mountain/hill=褐 / 其他=黄土`
- 伏方内层 scale 0.3 → 1.15 → 1.0 的弹性跃出（用闭包 `setPhantomScale` 操作 `.ba-inner` 的 scale）
- 火攻成功 `fireResult.success === true` → 在被伏方位置撒橙红火星
- 败方"残兵"姿态：抖动后 `rotate(12°)` + `opacity=0.5`

**结果大字**（4 种组合）：
- `hit && ambWins` → 「伏击得手」朱红
- `hit && !ambWins` → 「反击奏效」青墨
- `!hit && ambWins` → 「识破反胜」青墨（罕见）
- `!hit && !ambWins` → 「伏兵被识破」青墨

### Step 3 攻城战动画（`_playSiegeBattleAnim` + `_baDrawCityWall`）

实装 4 幕长镜头：**列阵 → 箭雨 → 云梯攀爬 → 垛口碎裂/退敌**。

**`_baDrawCityWall`（共享城墙组件）**：
- 用守方势力色的**暗化 55%** 版作城墙填色
- 9 个 SVG 子元素：主墙 + 5 垛口 + 城门 + 门楣 + 城楼（三角顶）
- 返回 `{wall, crenels[5], gate, lintel, tower}` 供主函数做破损动画

**攻城 vs 退敌分叉**（通过 `cityBreach = report.cityBreach ?? atkWins` 判断）：
- **城破**：中央 2 个垛口（idx=1,3）向下平移 + 旋转淡出，门楣倒塌，gate opacity → 0.3，
  攻方幻影冲向城门，`shakeMapSvg amplitude:3.5`，`spawnClashRing maxR:38 + spawnSparks count:9`
- **退敌**：所有云梯 `stroke-dasharray` 变成虚线 + opacity → 0.3（断裂感），攻方幻影后退并 opacity → 0.5

**箭雨**：
- 守退敌时 8 支箭（更密），攻城成功时 5 支（常规）
- 用 `startTween(420ms, easeLinear)` + 抛物线 `4*te*(1-te)` 公式
- 箭矢用 line 表示（端点随切线方向），落地处小 `spawnSparks`
- 攻方阵列同时轻抖（士气压力）

**云梯攀爬**：
- 每个攻方 phantom 配一条 line 云梯（从 phantom 位置斜向城墙顶），先 350ms tween 延伸
- 沿云梯 tween 2 个 circle 方块（攻方色）模拟攀爬士兵
- 城墙顶用 `_baCore.spawnSlashes` 表示白刃战

**结果大字**：
- `atkWins && cityBreach` → 「城破」朱红大号
- `atkWins && !cityBreach` → 「攻占得手」
- `!atkWins` → 「退敌」守方色

### Step 4 水战动画（`_playNavalBattleAnim`）

**总时长**：普通 3.4s / 火攻 4.0s。

**关键特效**：
- 冷色水面椭圆背景（fade in/out）
- 船型幻影用 `_baCore.makeShipPhantom`
- 接近阶段：双方船向中点推进 60%，齐射 2 支平射箭矢（line，短程直线 tween）
- **火攻**（`fireResult?.success === true`）：
  - 攻方船上方 Bezier 火焰柱（path，stroke-dash 法实现火焰波动重绘，每 70ms 更新波形）
  - 用 linearGradient 从 `rgba(255,200,80)` → `rgba(220,60,40)` → 透明
  - 火焰出现 400ms 后射出一支带火箭矢飞向守方船
- 撞击：`spawnClashRing` 冷色版，`spawnSparks` 用水花蓝白配色
- 火攻胜时守方船位置加一组橙红火星
- 败方船 `rotate(-18°) + dy +6*invS`（半沉）+ opacity → 0.6
- 火攻胜时败方船额外显示一层烟雾椭圆

**结果大字**：
- `atkWins && fireOn` → 「火攻大捷」橙红
- `atkWins` → 「水战得手」深蓝
- `!atkWins` → 「水战败退」深蓝

### 挂接点清单

#### 主动路径（玩家发起 → 改 async + 位置快照 + await 动画）

| 函数 | 路径 | 动画 |
|------|------|------|
| `confirmAmbush` | 玩家设伏 | `_playAmbushBattleAnim` |
| `confirmSiegeBattle` | 玩家攻城（围城到期点"攻城"）| `_playSiegeBattleAnim` |
| `confirmSiegeDefend` (choice==='defend') | 玩家守城 | `_playSiegeBattleAnim` |
| `_siegeArrivalChoice` (choice==='attack') | 玩家围城到达立即攻城 | `_playSiegeBattleAnim` |
| `confirmBattle` 水战分叉 | 玩家参战水战 | `_playNavalBattleAnim`（替代 collision） |
| `_execInstantMarch` 伏击检测 | 玩家部队行军中被伏击 | `_playAmbushBattleAnim`（直接 await）|

#### 被动路径（push `_pendingBattleAnimations` + drain 统一播）

总共 **7 个 push 点**（camp 2 + ambush 1 + siege 3 + naval 1）：

| # | kind | 位置 | 触发场景 |
|---|------|------|---------|
| 1 | camp | aiInitiateBattle 营寨 AI vs AI 分支（v174）| AI vs AI 营寨战 |
| 2 | camp | aiInitiateBattle 营寨玩家守方分支（v174）| AI 攻玩家营寨 |
| 3 | **ambush** | checkAmbushTriggers else 分支 | AI 伏击其他 AI（玩家可见时播）|
| 4 | **siege** | aiInitiateBattle 攻城 AI vs AI 分支 | AI vs AI 攻城 |
| 5 | **siege** | rebellions/events.js 叛军攻城段 | 叛军攻城 |
| 6 | **siege** | GT2 AI 围城守方博弈段 | AI 围城到期发起攻城 |
| 7 | **naval** | _resolveBattleEngagement `_battleReports.push` 之后 | AI vs AI 水战（`report.isNaval && !_hasPlayer`）|

**特别说明**：`_execInstantMarch` 的伏击（玩家部队行军中被伏击）走**直接 await** 路径，
不经过队列，因为此时已在玩家交互的 async 链里，mapRoot 稳定存在。

#### drain 分支扩展

`_drainPendingBattleAnimations` 内 while 循环的 kind 分支更新为：

```js
if(req.kind === 'camp' && typeof _playCampBattleAnim === 'function'){
  await _playCampBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
} else if(req.kind === 'ambush' && typeof _playAmbushBattleAnim === 'function'){
  await _playAmbushBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
} else if(req.kind === 'siege' && typeof _playSiegeBattleAnim === 'function'){
  await _playSiegeBattleAnim(req.report, req.attackers, req.defenders, req.posSnap, req.city);
} else if(req.kind === 'naval' && typeof _playNavalBattleAnim === 'function'){
  await _playNavalBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
}
```

### 调试过程中发现并处理的问题

1. **jsdom 的 performance.now 递归栈溢出**：集成测试时 `performance.now()` 出现
   `PerformanceImpl → Performance → PerformanceImpl` 无限递归。解决：测试脚本注入 `Date.now()` polyfill。
   产品代码在真实浏览器运行无问题，这只是测试环境工具问题。

2. **攻城战 siege 的攻守方向随玩家角色变**：`confirmSiegeBattle` 玩家是攻方传入
   `(playerSide, allDefenders, ...)`，`confirmSiegeDefend` 玩家是守方传入 `(enemySide, playerSide, ...)`。
   `_playSiegeBattleAnim` 内部不区分玩家角色，统一按"attackers=攻方，defenders=守方"绘制；
   `isPlayer` 由 `unit.fac === G.playerFac` 判断，所以颜色正确。

3. **水战分叉的位置**：`_playBattleCollisionAnim` 内部原有 `if(report.isNaval) return;`
   保留不动。新分叉点在 `confirmBattle` 调用 collision 的一行之前判断：
   ```js
   if(_latestReport?.isNaval){
     await _playNavalBattleAnim(...);
   } else {
     await _playBattleCollisionAnim(...);
   }
   ```
   这样 collision 里的 early return 是防御性兜底，不是业务分叉。

4. **siege 的 posSnap 覆盖问题**：`resolveSiegeBattle` 内部可能调 `doRetreat` 改 unit.hq/hr，
   所以所有调用点都在 `resolve...` 之前做快照。共 6 处调用 resolveSiegeBattle，
   5 处做了快照 + 动画（第 6 处 `autoResolvePendingBattle` 是快进路径，不需动画）。

5. **AI vs AI 水战的 push 位置**：`_resolveBattleEngagement` 既服务 AI vs AI 又服务玩家守城出城迎战
   (`confirmSiegeDefend` choice==='sortie' 路径)。为避免与 `confirmBattle` 的主动 await 路径重复播，
   push 条件是 `report.isNaval && !_hasPlayer`。出城迎战路径中 `playerSide` 是玩家方，`hasPlayer=true`，
   所以不会误 push。

### 关键数值表

#### 伏击战动画 `_playAmbushBattleAnim`

| 阶段 | 时长 | 动作 |
|------|------|------|
| Ph0 地形色遮罩 | 300ms | 椭圆 opacity 0→1 |
| Ph1 潜伏收缩（仅 hit）| 600ms | 伏方 scale→0.3/opacity→0.18，被伏方推进 25% |
| Ph2 弹性跃出（仅 hit）| 400ms | 伏方 scale overshoot 0.3→1.15→1.0，推进 25% + 刀光 |
| Ph1-2 被识破分支 | 200ms | 被伏方警觉抖动 |
| Ph3 单侧冲击 | 700ms | 赢方推进到 70%，spawnClashRing/Mark, shakeMap, 输方残兵 |
| Ph4 结果 + 飘字 + 归阵 | 900ms | spawnResultText 1200, floatLossText 1100, 归阵 300 |

地形色参考：`forest → rgba(30,60,30,.38)`, `mountain/hill → rgba(60,50,35,.34)`, 其他 → `rgba(70,60,30,.26)`

#### 攻城战动画 `_playSiegeBattleAnim`

| 阶段 | 时长 | 动作 |
|------|------|------|
| Ph0 列阵 | 400ms | phantoms opacity 0→1 |
| Ph1 箭雨 | 1000ms | 5-8 支箭 delay 70ms 间隔，抛物线 420ms |
| Ph2 云梯攀爬 | 1200ms | 云梯延伸 350ms + 攀爬 720ms + spawnSlashes |
| Ph3 垛口碎裂/退敌 | 800ms | breach: 垛口倒塌 500 + spawnClashRing/Sparks + shake<br>defeat: 云梯断裂 400 + 攻方后退 500 |
| Ph4 结果 + 飘字 + 归阵 | 800ms | 同 ambush |

**城墙尺寸常量**：
- WALL_W = 120 * invS, WALL_H = 16 * invS
- 5 垛口 x offset：`[-40, -20, 0, 20, 40] * invS`
- 城门 14*invS × 12*invS
- 城楼三角顶在城墙上方 10*invS

#### 水战动画 `_playNavalBattleAnim`

| 阶段 | 时长 | 动作 |
|------|------|------|
| Ph0 水纹 | 400ms | waterBg opacity 0→0.85, spawnClashRing 冷色 |
| Ph1 接近 + 齐射 | 800ms | 船推进 60%，双方箭矢 360ms，火攻柱 900ms |
| Ph2 撞击 | 1200ms | 冷色 clashRing + 水花 sparks + 火攻星 |
| Ph3 败方倾斜 | 600ms | 败方 rotate(-18°)/dy+6/opacity 0.6 + 烟雾 |
| Ph4 结果 + 飘字 + 归阵 | 600ms | 同上 |

**船型尺寸常量**（基准 invS=1）：
- 船身 22×7，桅高 12，三角帆 14×10
- 火焰柱高度 34×10

### 改动清单

| # | 位置 | 改动 | 行数 |
|---|------|------|------|
| 1 | `_baCore` 内，makePhantom 之后 | 新增 `makeShipPhantom` | +57 |
| 2 | `_baCore` export | 加 `makeShipPhantom,` | +1（替换）|
| 3 | `_drainPendingBattleAnimations` | drain 加 3 个 kind 分支 | +8 |
| 4 | `_playCampBattleAnim` 之后 | 新增 `_playAmbushBattleAnim`（含注释）| +235 |
| 5 | 继续插入 | 新增 `_baDrawCityWall` | +90 |
| 6 | 继续插入 | 新增 `_playSiegeBattleAnim` | +299 |
| 7 | 继续插入 | 新增 `_playNavalBattleAnim` | +300 |
| 8 | `confirmAmbush` | 改 async + posSnap + await | +18 |
| 9 | `_execInstantMarch` 伏击段 | 加 posSnap + await | +8 |
| 10 | `checkAmbushTriggers` else | 加 posSnap + push 队列 | +9 |
| 11 | `confirmSiegeBattle` | 改 async + 攻城动画挂接 | +15 |
| 12 | `confirmSiegeDefend` | 改 async + 攻城动画挂接 | +15 |
| 13 | `_siegeArrivalChoice` | 改 async + 攻城动画挂接 | +14 |
| 14 | `aiInitiateBattle` 攻城 AI vs AI | push 队列 + posSnap | +10 |
| 15 | 叛军攻城段 | push 队列 | +8 |
| 16 | GT2 AI 围城段 | push 队列 | +6 |
| 17 | `confirmBattle` 水战分叉 | if isNaval 走 navalAnim | +4 |
| 18 | `_resolveBattleEngagement` | 开头 posSnap + 水战 AI vs AI push | +10 |

**总计**：+1088 行（v174: 36924 → v175: 38012）

### 验证

- ✅ **JS 语法检查通过**（提取 script 后 `node --check`）
- ✅ **单元测试 37/37 通过**（test_v175.js）
  - 3 个新函数签名存在且可调用
  - `_baCore.makeShipPhantom` 产出 8 子元素 ship
  - `_baDrawCityWall` 产出 9 子元素（主墙+5垛口+城门+门楣+城楼）
  - `shouldSkip` 边界（空/AI vs AI）正确
  - drain 3 个新 kind 分支路由正确（fastForward 清空 + 正常 shift）
  - 空参调用后 `_battleAnimating` 释放
  - 错误 type 早返回不崩
  - `cleanupAnimLayers` 扫 3 个新 class 成功
  - 7 个 `_pendingBattleAnimations.push` 点完整
  - kind 出现次数 camp:3 / ambush:1 / siege:3 / naval:1
- ✅ **集成测试 15/15 通过**（test_v175_integration.js，真跑完整动画）
  - 伏击（成功+火攻）：3093ms（设计 3000ms）
  - 伏击（被识破）：2248ms（设计 2400ms）
  - 攻城（城破）：4200ms（设计 4200ms）
  - 攻城（退敌）：4690ms（设计 3200ms，Ph1 箭雨实际 1300ms 略长）
  - 水战（火攻胜）：3934ms（设计 4000ms）
  - 水战（普通败）：3912ms（设计 3400ms）
  - 并发锁：A 动画运行时 B 请求 shouldSkip 返回 true，A 完成后锁释放

### 未做 / 下轮可改进

1. **守方 phantom 的视觉层叠**：守方 phantoms 画在 `wallCY - 6*invS`（城门内侧），
   但 SVG 没有 z-buffer，它们在 DOM 顺序上**后于城墙**，所以渲染时会**压在城墙上**。
   视觉上"站在城墙前"，考虑到飘字/抖动需要可见，目前接受。未来可考虑让守方 phantom 
   更小 + 半透明，或者干脆不画守方站立图标（只画一个"garrison 占位小旗"在城楼上）。

2. **`cityBreach` 字段未标准化**：当前 `_playSiegeBattleAnim` 用 `report.cityBreach ?? atkWins` 近似。
   下轮可在 `resolveSiegeBattle` 里正式 set `result.cityBreach = atkWins && (某更严格条件)`
   —— 例如攻方兵力残余 > 阈值，或守方被歼灭率 > X%。

3. **水战叫阵**：`confirmBattle` 里水战分支 `_isNavalConfirm` 时禁叫阵（v138），
   所以 `_playDuelPreludeAnim` 不会在水战前触发 —— 这是 feature。但如果未来开放水战叫阵
   （如舰船对撞前旗舰对话），需要给叫阵动画补船型版本。

4. **伏击动画的 `setPhantomScale`**：内层 `.ba-inner` transform 改 scale 会让旗/士兵一起缩，
   但旗帜阴影（底部椭圆）也会一起缩 —— 实际应保持阴影大小不变。当前实装可接受，
   下轮若有明显视觉违和可单独拆出阴影。

5. **drain 入口锁预占**（v174 留的 TODO）：仍未做。当前 `_battleAnimating` 在 drain 等事件 modal
   期间为 false，理论上竞态窗口存在，但因为 modal 挡住视线未触发真实问题。

### 扩展任意新战斗动画的模板（v175 已完全跑通）

1. 新增 `_playXxxBattleAnim(report, attackers, defenders, posSnap, [extra])` 函数
2. 若需新视觉组件（如城墙、船）→ 要么加到 `_baCore` 里共享，要么作为同模块的 `_baDrawXxx` 辅助函数
3. 主动路径：对应 `confirmXxx` 改 async + 位置快照 + await 动画
4. 被动路径：对应 `aiInitiateBattle` / resolve 前置处 push `_pendingBattleAnimations`（kind: 'xxx'）
5. `_drainPendingBattleAnimations` while 循环加 `else if(req.kind === 'xxx' && typeof _playXxxBattleAnim === 'function')` 分支
6. **不需要改** showNextBattleReport、nextTurn、`_baCore` 本体（除非需加新工具函数）

### v175 自审修复（实装后第二轮审计）

实装完 Step 2/3/4 后做了 17 项自审，发现 2 个真实问题并修复：

#### 修复 1：drain 与 _pendingBattleConfirms 弹窗的时序竞态（v175 新引入的 bug）

**问题**：v175 之前（v174）同一旬内不会同时有 `_pendingBattleAnimations` 和 `_pendingBattleConfirms` 非空（camp AI 攻玩家走弹窗，不进动画队列）。v175 新增的伏击/攻城/水战的"AI vs AI 玩家可见"场景 push 到了动画队列，如果**同旬**又有别的 AI 攻玩家战斗 push 到 confirms，`_showNextBattleConfirm` 会在 drain 开始播前（~300ms）弹战斗确认弹窗 —— 玩家点"迎战"进入 `confirmBattle` 时，drain 的前一场动画可能正好占着 `_battleAnimating` 锁 → 玩家主动路径的动画被 `shouldSkip` 跳过。

**修复**：在 `_showNextBattleConfirm` 和 `showNextBattleReport` 入口都加双重等待：
```js
if(_battleAnimating){ setTimeout(self, 200); return; }
if(_pendingBattleAnimations.length && !_fastForward){ setTimeout(self, 200); return; }
```
第一个条件应对"动画正在播"；第二个条件应对"drain 在等事件 modal 关闭，队列非空但锁还是 false"的间隙。`showNextBattleReport` 的 v174 版本只有第一个条件，这轮一并补第二个。

#### 修复 2：出城迎战路径历史遗漏战斗动画（v173 就有，v175 顺便修）

**问题**：`confirmSiegeDefend` 的 `choice==='sortie'`（出城迎战）分支直接调用 `_resolveBattleEngagement`，不经过 `confirmBattle`，所以 v173 引入的野战 collision 动画和 v175 的 naval 动画都不触发。

**修复**：在该分支加 `_sortiePosSnap` + 读取最新 report + 按 `isNaval` 分叉调用 `_playNavalBattleAnim` / `_playBattleCollisionAnim`。`type==='retreat'` 时不播（沿用 v173 设计）。

#### 审计通过的点（无需修复）

- `makeShipPhantom` 用 innerHTML 和 v173 `makePhantom` 一致，生产环境已验证可工作
- `darken` 函数对 `#rrggbb` 格式安全，try/catch 兜底，FAC 所有色值都是 hex 格式
- `fireResult` 访问用 `?.` 或 `&&` 保护，null 安全
- 所有 siege 调用点都传了 city 参数
- 所有 `_playSiegeBattleAnim` 主动路径都已 async + 完整 posSnap
- 撤围（`choice==='siege'`）路径 `siegeReport=null` 跳过动画逻辑正确
- rebel/GT2/aiInitiateBattle 的 siege push 的 `attackers`/`defenders` 变量都在前文定义
- 结果大字配色按"攻方视角"红/墨，与 v173/v174 camp 一致（非玩家视角着色）
- 水战火焰柱 path d 字符串里换行符合 SVG path 语法
- AI vs AI 水战的 push 条件 `!_hasPlayer` 不会与玩家主动路径重复 push

#### 新加验证（test_v175_race.js）

- `_battleAnimating=true` 时 `_showNextBattleConfirm` 不立即消化 confirms
- `_pendingBattleAnimations.length > 0` 时 `_showNextBattleConfirm` 不立即消化 confirms
- `showNextBattleReport` 在 `_battleAnimating=true` 下安全返回
- 源码层面：两个函数都检查 `_battleAnimating` 和 `_pendingBattleAnimations.length`
- `confirmSiegeDefend` 出城分支已挂接 naval/collision 动画 + `_sortiePosSnap`

**最终测试结果**：37 单元 + 15 集成 + 13 竞态 = **65 项全部通过**。

### v175 反馈迭代（玩家实测后修复）

实装发布后玩家反馈了 4 点问题，全部修复：

#### 1. 伏击文案"反击奏效"改为"伏击失利"

`hit=true, ambWins=false`（成功埋伏但反被打赢）原文案"反击奏效"从被伏方视角语义模糊，改为"伏击失利"—— 明确表达"你设了伏但打输了"。其他 3 种文案保持不变。

#### 2. 攻无野战守军的城 → 无动画（shouldSkip 误判）

**原因**：`_playSiegeBattleAnim` 的 `shouldSkip` 判断 `defenders.length === 0 → return true`。但 `confirmSiegeBattle`/`_siegeArrivalChoice` 等调用点传入的 `defenders` 是**野战部队列表**（不含 garrison）。攻一个只有城防军无野战的城时 defenders=[]，动画被跳过。

**修复**：在 `_playSiegeBattleAnim` 入口加 virtualGarrison 兜底逻辑：
```js
let effectiveDefenders = defenders;
let virtualGarrison = null;
if((!defenders || defenders.length === 0) && city.garrison > 0){
  virtualGarrison = {
    id: '_anim_garrison_' + city.id,
    fac: city.fac,
    hq: city.q, hr: city.r,
    _isVirtualGarrison: true,
    squads: [{ genName: (city.name||'城')+'守军', troops: city.garrison, morale: 60 }],
  };
  effectiveDefenders = [virtualGarrison];
  posSnap[virtualGarrison.id] = { hq: city.q, hr: city.r };
}
```
`virtualGarrison` 只在动画函数内部存在（不污染 G.units/_battleReports）。它在动画里画成一面"守军小旗"贴在城市 icon 正上方，作为守方视觉代表。

#### 3. 去掉另画的城墙，效果围绕城市 icon 展开

**原因**：反馈"城墙跌在地图上，和地图城市 icon 重叠"。

**改动**：
- 删除整个 `_baDrawCityWall` 函数（-90 行）
- `_playSiegeBattleAnim` 用 `city.x / city.y`（或 fallback 到 `hexToPixel(city.q, city.r)`）作为 siege center
- 箭雨从"城市 icon 上方 `12*invS`"发出（模拟城楼）
- 云梯从攻方 phantom 到"城市 icon 边缘 + 6*invS"
- 破城特效（`spawnClashRing maxR:38` + 11 火星 + 震动 amplitude:3.8）以城市 icon 为中心
- 结果大字位置在城市 icon 上方 `30*invS`
- 动画**不修改**原城市 icon 的 DOM（避免污染游戏渲染状态）

视觉上更简洁紧凑，代码行数也从 `_baDrawCityWall + _playSiegeBattleAnim` 共 389 行降到 `_playSiegeBattleAnim` 298 行。

`city` 参数的位置来源：
1. 优先 `city.x, city.y`（G.cities[id] 初始化时展开 CITIES_DEF，一般有）
2. 回退 `hexToPixel(city.q, city.r)`
3. 最终兜底 `hexToPixel(attackers[0].hq, attackers[0].hr)`（极罕见，如 siegeCity 对象缺字段）

#### 4. 火攻选项 + 围城信息 字色对比度问题

两处字色和底色冲突导致看不清，都是历史遗留色值：

**火攻选项**（2 处弹窗：伏击火攻 + 战斗火攻，共 4 行 CSS）：
- `color:rgba(244,220,160,.85)` → `color:rgba(44,36,22,.85)`（深墨正文）
- `color:rgba(244,220,160,.55)` → `color:rgba(92,74,50,.75)`（暖墨副文）
- 米白底（`rgba(245,235,218,.55)`）上原本是淡黄字 → 现在是深墨字，清晰可读

**围城信息**（城市面板敌军围城段）：
- 深红底 `rgba(50,15,5,.55)` 上原本是深墨字 `rgba(44,36,22,.55)`（对比度极低）
- 改为米黄浅字 `rgba(240,228,200,.88)` + 强调色亮金 `#f0c040`
- 保留深红底的"战时紧张感"视觉语言，只改字色

### 最终验证

**65 项测试全部通过**：
- 单元 30 ok（test_v175.js — 移除 `_baDrawCityWall` 相关项）
- 集成 15 ok（test_v175_integration.js — fakeCity 补 x/y）
- 竞态 14 ok（test_v175_race.js，无改动）
- **garrison 兜底专项 6 ok**（test_v175_garrison.js — 新增）：
  - 攻"只有 garrison"的城正常播动画 (4211ms)
  - 攻"无 garrison 无 defenders"的空城正确 skip
  - city=null 早返回不崩
  - city 缺 x/y 时 hexToPixel fallback 生效 (4186ms)

**总行数**：v175 最终 37965 行（反馈迭代后：38045 - 91 删城墙 + 11 fallback = 37965）。

### 下轮仍可改进

（保持原 v175 TODO 不变，新增 2 条）

6. **攻城 cityBreach 字段标准化**（仍未做，v175 用 `report.cityBreach ?? atkWins` 近似）
7. **AI 主动设伏频率过低**：玩家实测反馈"等不到 AI 设伏"。可考虑给 AI personality 加 ambush 倾向参数，或让叛军 AI 更主动设伏

### v175 fix3（第二次反馈迭代）

玩家再次实测反馈 2 个问题，都修复：

#### 1. 攻无野战守军的城仍无动画（fix2 没修对）

**根本原因**：v175fix2 里的判断 `if(defenders.length===0 && city.garrison > 0)` 看起来正确，但 **`resolveSiegeBattle` 在攻方胜利时会把 `city.garrison = 0`**（27757 行）。由于调用顺序：
1. `siegeReport = resolveSiegeBattle(...)` ← 这一刻 city.garrison 被清 0
2. `await _playSiegeBattleAnim(siegeReport, attackers, defenders, ..., city)` ← 读到 city.garrison=0，virtualGarrison 分支不进

**修复**：去掉 `city.garrison > 0` 判断，改为**只要 `defenders.length === 0` 就造 virtualGarrison**。数量取值：
- 优先 `city.garrison`（战前未被清零时）
- 否则 `report.defLost * 0.3`（至少 500，反映战前规模）
- 兜底 500

这样即使 `city.garrison` 已被 resolveSiegeBattle 清 0，虚拟 garrison 仍能挂出一面小旗作为守方视觉锚点。

**发现过程**：写了 `test_v175_real_path.js` 模拟真实玩家路径（带上 `resolveSiegeBattle` 的副作用），复现了"15ms 就返回"；加了 `console.log('[SA]...')` 诊断日志，定位到 virtualGarrison 分支未走进；对照 `resolveSiegeBattle` 源码发现 `city.garrison = 0` 的时机 bug。

#### 2. 围城面板深红底太丑

v175fix2 的方案（深红底 + 米黄浅字）玩家反馈"太丑了"，改回**和城市面板其他区块一致的米白浅底**：
- 背景 `rgba(50,15,5,.55)` → `rgba(245,238,225,.6)`（米白，与面板一致）
- 边框 `atkCol+'50'` → `atkCol+'40'`（保留敌方色做边框，稍淡）
- 正文 `rgba(240,228,200,.88)` → `rgba(44,36,22,.7)`（深墨）
- 强调色 `#f0c040`（亮金）→ `#8a7040`（暗金）
- 红色"⚠ 敌军围城中"标题保留（`color:atkCol`，保留紧迫感）

### fix3 验证

**67 项测试全部通过**：
- 单元 30 ok
- 集成 15 ok
- 竞态 14 ok
- garrison 6 ok（其中 "garrison=0 也播动画（500 兵兜底）" 是本次新增预期）
- **真实路径 2 ok（新增 test_v175_real_path.js）**：
  - 模拟玩家攻"只有 garrison 已被清 0"的城，动画正常播（4217ms）
  - 检查 resolveSiegeBattle 副作用：不改 defenders 数组（garrison 加进去又被移除）

### v175 fix4（第三次反馈迭代）

玩家反馈：无野战守军的城动画已出，但**虚拟 garrison 小旗颜色与驻守部队不一致**（视觉不协调），且"驻守部队本来战斗力弱，没必要专门体现"。

#### 修复：去掉 virtualGarrison 的 phantom，保留数据占位

- virtualGarrison 对象保留（shouldSkip 仍需要 defenders 非空才通过）
- **不**给 virtualGarrison 创建 phantom（也不显示小旗）
- `defPositions` 过滤掉 virtualGarrison（只包含真实野战守军）
- Ph4 额外补一条守军损失飘字：如果 virtualGarrison 存在且 `report.defLost > 0`，从**城市 icon 位置**飘出守方损失数字

视觉效果：无野战守军的攻城动画现在只有"攻方 + 城市 icon"，没有守方小旗。Ph2 的箭雨（从城市 icon 上方发出）、云梯（指向城市 icon）、Ph3 的破城/退敌特效、Ph4 的守军损失飘字，全部保持不变。

代码净变化：约 +10 行（新增守军飘字逻辑）/ -6 行（defPositions 过滤简化了 scenePos 分支）。

---

## v176 终态摘要(阶段A 完成)

> **以下章节是 v176 收尾时回顾性写的摘要,目的:让未来阅读者直接看这一节就能掌握全貌。**
> **下面"v176 Debug面板(阶段A)"章节是A1初版的精简记录(过时内容已删除,只保留仍准确的设计原则)。**
> **再之后的 v176-A2/A3/A4/A5 修复章节是5轮迭代的原始记录,作为追溯保留,各自行号/字段以当时为准。**

### 最终版本号
**v176-A5**(`window._debug.version === 'v176-A5'`)。文件名 `project_romance_v176.html`,行数 **39347**(v175 37973 + 1374行Debug代码)。

### 一句话定位
URL `#debug` 激活的内嵌开发工具,主代码0改动,5个section + 强制战斗子系统覆盖游戏所有corner case测试需求。

### 5个Section最终能力

| Section | 能做的事 |
|---|---|
| **资源/关系** | 改任意势力金/木/铁/马/信誉/全城粮(支持 `+5000`/`-200`/`8000`输入);双向修改外交关系(纯净不带副作用);"全AI对玩家宣战"等快捷按钮 |
| **部队操控** | 选中部队后:瞬移(用 `svgEventCoords` 处理zoom/pan)/满编/清AP/+1000血/+经验/删除;创建任意势力新部队(势力+城+武将+兵力+兵种);**强制战斗**子系统见下 |
| **事件触发** | 33个 EVENT_DEFS 列表,选事件+势力,可"立即触发"或"试探100次"。试探给4种判断(必中/全失败/概率挡/X%成功率),并展示游戏tab能看到的关键状态(势力存亡/N城N兵N将/资源/信誉) + condition源码备查。强制掷骰checkbox可用 |
| **快进/AI托管** | +1/+5/+10/+30 旬按钮 + 自定义。期间玩家由AI接管(_fastForward时runAI包括玩家),无动画无弹窗 |
| **存档** | 3槽位localStorage快存(显示"第N旬 蜀 4城");剪贴板JSON导出导入(含元信息) |

### 强制战斗子系统(贯穿"部队操控"section)

**5种战斗类型,每种都有正确的动画**:

| 类型 | 调用入口 | 火攻 | 地形/参数 |
|---|---|---|---|
| 野战 | `_resolveBattleEngagement` → `_playBattleCollisionAnim` | (Debug暂不支持) | 地形可选(平/林/山/丘/沼) |
| 水战 | 同上 → `_playNavalBattleAnim` | ✅ | BFS找12格内river hex,双方瞬移 |
| 伏击 | `resolveAmbush` 直调 | ✅ | 地形可选(火攻仅在 forest/mountain/hill/water 生效) |
| 营寨战 | `resolveCampBattle` 直调 | ✅ | 模式 raid/assault |
| 攻城战 | `resolveSiegeBattle` 直调 | (无,城战自有机制) | 目标城下拉(守方所属势力的所有城) |

**所有"AI vs AI"战斗都能正常播动画**——通过两层修复:
1. `_baCore.shouldSkip` 临时override为 `()=>false`(走 `_baCore` 的4种动画)
2. `G.playerFac` 临时改为 `def.fac`(野战 `_playBattleCollisionAnim` 走内联检查,且 `_resolveBattleEngagement` 行29937的retreat过滤需要绕过)
finally 块保证恢复。

**战斗发生位置自动揭雾**(`_dbgRevealAround(q, r, 2)`):BFS半径2格设FOG_VISIBLE,动画在阳光下播。下旬玩家fog自动重算,无遗留污染。

**同势力guard**:攻守同势力时直接toast拒绝,不进confirm。守方下拉自动过滤掉攻方所在势力。

### 不包含的功能(明确边界)

- ❌ 战斗结果手动设定(必须真打)
- ❌ 武将属性实时编辑
- ❌ 自由编辑器(造地形/改城池归属)
- ❌ 数值类自动断言(战斗损失"应该是2500-2800"这种)
- ❌ 阶段B:场景预设/回归套件/bug场景沉淀

### 技术决策记忆点

1. **主代码0改动是硬约束**(用户工作风格)。Debug代码全部在独立 `<script>` 块。
2. **激活检测在IIFE首行**:`if(!location.hash.includes('debug')) return;`,无 `#debug` 时零代码执行(只挂CSS的 selector都带 `_dbg_` / `.dbg-` 前缀,不污染游戏样式)。
3. **scope 共享**:游戏的 `let G` / `const _baCore` / `const FAC` 不挂window,但 Debug script 与游戏 script 共享 script-level global scope,Debug 代码内**直接写 `G` / `_baCore`** 能访问。`window.G === undefined` 但 `G` 可读写。这是修野战动画的关键。
4. **强制战斗的"刷pose"做法**:不绕过游戏战斗判定,而是**预处理状态**(瞬移/AP充值/status合理化/playerFac临时改)再让游戏自己打。所有战斗结果(伤亡/经验/战报)都是游戏正确算的。
5. **存档接口**:`_serializeG()` 不带参数,**返回字符串**;`_deserializeG(jsonStr)` 接受字符串。规范7.2写错了,实装按真实接口。
6. **关系切换**:直改 `G.diplo[k1/k2].status/rel`,不走 `applyWarDeclarationEffects`(后者带信誉/派系/豪族副作用,Debug场景要纯净)。
7. **事件触发**:不绕过 condition,而是 `_dbgProbeCondition` 跑100次给概率统计 + 列游戏状态 + 展示condition源码。让用户知道"为什么挡住"而不是"如何强制通过"。

### 已知小限制

| 限制 | 说明 |
|---|---|
| 野战火攻 | 游戏的野战火攻在aiDecideFireAttack内部判,无上层入口,Debug暂不支持。要测火攻请用伏击/营寨/水战 |
| condition的硬条件不能强制满足 | 季节/势力状态/特定武将等硬条件,需要用户手动改G.seasonIdx等再触发(可以用其他Debug section预先满足) |
| 动画播放期间(2-3秒)其他Debug操作可能读到错的playerFac | 操作冲突概率低,可接受 |
| `localStorage` 隐私模式不可用 | 已用 `_dbgLS()` wrapper兜底,槽位显示"localStorage不可用" |
| 存档兼容性 | 序列化格式跟随v175的 `_serializeG`,跨大版本不保证兼容(已记录version) |

### 文件清单

- `project_romance_v176.html` — v175原文 + 末尾Debug script块,39347行
- `HANDOVER_v176.md` — 本文档(v175 handover末尾追加,本节是v176终态摘要)
- `CODE_MAP_v176.md` — v175 code_map末尾追加v176模块行号索引

### 阶段B 启动条件

阶段B(场景预设/回归套件/bug沉淀)暂未实装。启动条件:用户在实际开发中发现"我老忘了测某个case"或"想一键跑套件确认无regression"的痛点,再开新对话讨论设计。

---

## v176 Debug面板（阶段A）— 初版迭代起点

> **本节是 v176-A1 初版的精简记录**,只保留至今仍准确的设计原则和未变更的部分。
> 已被后续A2-A5推翻或重构的内容(7个section清单/强制战斗click模式/Hex拾取CTM逆变换/子模块接口字段等)已删除,**以"v176终态摘要"和A2-A5章节为准**。

### 定位

- **类型**:开发工具(仅URL `#debug` 激活),不影响游戏本体
- **代码位置**:游戏主`</script>`之后、`<!-- General Profile Modal -->`之前,独立`<script>`块
- **主代码改动**:**0行**。所有Debug逻辑在独立脚本块内的IIFE中
- **激活方式**:URL末尾加`#debug`,例:`file:///.../project_romance_v176.html#debug`

### 设计文档来源
基于上传的 `IMPLEMENTATION_SPEC.md` 阶段A规格。

### 命名约定(终态仍适用)
- 全局对象:`window._debug`(唯一对外暴露的命名空间)
- 内部函数:`_dbg*` 前缀(如 `_dbgInit`, `_dbgSafe`, `_dbgToast`)
- DOM ID:`_dbg_*` 前缀(如 `#_dbg_corner`, `#_dbg_panel`)
- CSS类名:`.dbg-*` 前缀(如 `.dbg-section`, `.dbg-btn`)
- localStorage key:`_dbg_slot_N` / `_dbg_slot_meta_N`

**v175 命名冲突检查**:游戏现有代码中 `_debug` / `_dbg` / `dbg-` / `dbg_` 全部 0 命中。

### 激活流程(终态仍适用)
1. URL hash 含 `debug` → IIFE进入;否则提前 return(**零代码执行**)
2. DOMContentLoaded 后等 G 就绪(200ms轮询,超时15秒)
3. 就绪后挂 `🔧 DEBUG` 角标到右上角,点击展开/折叠 320px 主面板

### 资源字段映射(终态仍适用)
v175实际数据布局:
- 金/木/铁/马:`G.factions[fid].res.{gold,wood,iron,horses}`
- **粮**:**没有**势力级粮,按城存:`G.cities[id].storage`。Debug提供"全城+N粮"按钮,遍历该势力所有城各加N。
- 信誉:`G.reputation[fid]`(0-100)

### 输入框数值规则(`_dbgParseNum`,终态仍适用)
- 留空 → 不修改
- `5000` → 直接设为该值
- `+5000` / `-200` → 增减
- 解析失败 → 该字段不修改,无静默错误(在"应用"时如果所有字段都未变化会toast"没有有效输入")

### 不破坏原有功能的设计保证(终态仍适用)
- 游戏不带 `#debug` 时,整个IIFE在第一行 `if(!location.hash || !location.hash.includes('debug')) return;` 提前退出
- CSS 全部前缀(`#_dbg_*` / `.dbg-*`),不污染游戏样式
- DOM 元素只在 `_dbgBuildUI` 中 append,不带 `#debug` 时不创建任何DOM
- 主代码 0 改动 → 原v175测试不受影响

### A1初版的5个偏离规范决策(部分已被后续迭代推翻,见A2-A5)

| 决策 | A1初版 | 终态 |
|---|---|---|
| 存档接口 | `_serializeG()` 不带参数返回字符串 | 仍然如此 |
| 关系切换 | 直改 `G.diplo[k1/k2]`,不走 `applyWarDeclarationEffects` | 仍然如此 |
| 事件触发condition | 不绕过,失败时toast提示+强制掷骰checkbox | A3扩展为"100次试探"诊断 |
| AI托管 | 独立section,分旬循环调 fastForwardTurns(1) | A3合并到时间旅行section |
| 强制战斗 | 选中己方部队 → 点按钮 → 点地图敌方 | A2改下拉双选,A3扩5种类型,A5改playerFac修动画 |

### 阶段B尚未实装

按规范明确,本次**不做**:
- 场景预设(伏击-林地等10-12个)
- 回归套件(一键串行跑场景)
- bug场景固化沉淀机制
- 自动化数值断言

阶段B启动条件:用户实测阶段A,确认基础Debug面板OK后再开新对话讨论设计细节。

---

## v176-A2 实测反馈修复

### 反馈三点
1. **瞬移点击地图后部队跑到错位置**(zoom/pan后偏)
2. **AP=0 时强制战斗按钮失效**
3. **事件触发频繁 condition 返回 false,提示信息无诊断价值**

### 修复1:瞬移坐标
之前用 SVG `getScreenCTM().inverse()` 算坐标,但游戏在SVG之上还有一层 `_mapTx/_mapTy/_mapScale`(pan/zoom矩阵)——CTM逆变换不包含这层。

**修复**:直接复用游戏自身的 `svgEventCoords(e)`(v175 行 31902),它内部已处理了 `(svgPt - _mapTx) / _mapScale`。然后用 `pixelToHex(mx, my)` 取hex。`_dbgPickHexFromEvent` 简化为这一条路径,移除原先的DOM data-q/r爬升和手写CTM逆变换。

### 修复2:强制战斗改下拉双选
之前的实装是"先在地图选中己方部队 → 点强制战斗按钮 → 在地图点敌方部队",依赖游戏的 `G.selUnitId`。问题是:**AP=0或某些状态下,游戏自身的点击选中机制可能不工作或被吞**——按钮就disabled或handler触发不到目标。

**修复**:把强制战斗从"选中部队"按钮区**剥离**,在创建部队下方放一个独立小区:
- 攻方部队下拉(列**所有** G.units,跨势力)
- 守方部队下拉(同上)
- [开打] 按钮

完全脱离游戏的选中机制,任意两支部队都能立即开打。

`_dbgForceBattle` 内部强化预处理:
- 双方瞬移到攻方hex(同hex)
- 双方 status=siege/camp/ambush/mobilizing 一律 → halt
- 双方 mobilizingTurns=0
- 双方 `_apRemaining = max(原值, 10)`(防御性,虽 `_resolveBattleEngagement` 不查AP但战后路径可能要)
- 调用 `_resolveBattleEngagement([atk], [def], '强制战斗', null)` 触发完整战斗(动画/战报/伤亡/经验)

注:旧的 `_dbgStartForceBattle / _dbgCancelForceBattle / _dbgForceBattleClickHandler` 整套已删除,`_debug.forceBattleMode` 字段移除。

### 修复3:事件触发诊断输出区
之前 condition 返回 false 时只 toast 一句,无法判断挡在哪。**修复**:在事件 section 内加一个折叠诊断框 `#_dbg_ev_diag_box`(默认隐藏),触发失败或点新增的"查看condition"按钮时展开,内容包含:

- 事件 id + 名称
- 当前游戏状态快照(turn/season/资源/cities/totalTroops/strategist/reputation/identity.type/stage/generals)
- `def.condition.toString()` 源码前 1500 字符

用户看到 condition 源码 + 当前状态对比,直接知道是哪一行硬条件挡了。`_dbgGameSnapshot(fid)` 是新加的辅助函数。

### 验证(jsdom自动化)

| 验证项 | 状态 |
|---|---|
| `_debug.version` 已升至 `v176-A2` | ✅ |
| 老 `#_dbg_un_fb` 按钮已移除 | ✅ |
| 新增 `#_dbg_fb_atk` `#_dbg_fb_def` 双下拉(7个部队选项) | ✅ |
| 事件诊断框 `#_dbg_ev_diag_box` 默认隐藏,点击后 display:block | ✅ |
| 诊断文本包含 turn/season/condition源码标记 | ✅ |
| 强制战斗实际执行:守方tropps从5000降至4835(战斗发生) | ✅ |
| 战斗后双方 `_apRemaining` 至少有一方 ≥ 10 | ✅ |
| Real errors: 0 | ✅ |

### 浏览器实测重点(用户)

1. 缩放/平移地图后瞬移仍准确(关键回归点)
2. AP=0 部队走"强制战斗"下拉双选能正常开打
3. condition 返回 false 时诊断框出现,能从源码看出挡条件

### 文件行数变化

v176-A1 → v176-A2:
- 新增 `_dbgAllUnitOptions` (~10行)
- 新增 `_dbgGameSnapshot` (~20行)
- 新增 `_dbgForceBattleFromDropdowns` (~15行)
- 强化 `_dbgForceBattle` (+10行)
- 新增 `#_dbg_ev_diag_box` 和"查看condition"按钮的诊断逻辑 (~50行)
- 删除 4 个旧 force-battle 函数 (~50行)
- 删除 `_dbgPickHexFromEvent` 内的DOM爬升和CTM分支 (~20行)

净增约 **+35行**,project_romance_v176.html 从 39007 → 39043 行。

---

## v176-A3 第二轮反馈修复

### 反馈四点
1. **AI托管和时间旅行实质重复**(都是 fastForwardTurns,只是分旬循环 vs 一次性调用)
2. **强制战斗只能模拟野战,缺伏击/营寨/攻城/水战** — 战斗系统的5种主分支(`resolveBattle` / `resolveAmbush` / `resolveCampBattle` / `resolveSiegeBattle` / `resolveNavalBattle`)未cover
3. **同势力部队互相战斗很奇怪**(虽然技术上能跑)
4. **事件诊断只展示condition源码,没几个人看得懂JS** — 需要把"为什么不触发"翻译成人话

### 修复1:合并"AI托管"到"时间旅行"
游戏的 `fastForwardTurns(n)` 内部 `_fastForward=true` 时,`runAI` 包括玩家势力(v175 行 13307)。所以**快进 = AI托管**,本来就是同一回事,两个section是设计冗余。

**改动**:
- 删除"AI托管玩家"section及其 `_dbgAutopilotHtml / _dbgBindAutopilot / _dbgAutopilot / _dbgRefreshAutopilotStatus` 4个函数
- 时间旅行section 改名为"快进 / AI托管"
- `_dbgRefreshAutopilotStatus` 改名为 `_dbgRefreshTurnDisplay`(只剩刷新当前旬数的功能)
- `_debug.autopilotActive / autopilotStopRequested` 字段移除
- section总数:6 → **5**

### 修复2:强制战斗扩展为5种类型
之前只走 `_resolveBattleEngagement`,只能产出野战。新版根据用户选的战斗类型走不同入口:

| 类型 | 入口 | 前置 |
|---|---|---|
| 野战(field) | `_resolveBattleEngagement([atk],[def],...)` | 双方瞬移到攻方hex,status=halt |
| 水战(naval) | 同上 | BFS搜攻方附近12格 river hex,双方瞬移过去 |
| 伏击(ambush) | `resolveAmbush([atk],[def],terrain,fire)` 直接调 | atk.status='ambush', def.status='march',双方同hex |
| 营寨战(camp) | `resolveCampBattle([atk],[def],mode,...,fire)` 直接调 | def.status='camp',atk.status='halt',atk瞬移到def处 |
| 攻城战(siege) | `resolveSiegeBattle([atk],[def],city,...)` 直接调 | def瞬移进城,atk同hex+status=siege+siegeTarget=city.id |

**关键设计**:伏击/营寨/攻城**不走** `_resolveBattleEngagement`(它有外交副作用扣rel/转enemy)。Debug场景需要纯净战斗,直接调底层 `resolve*Battle` 函数→拿report→手动 push 到 `_battleReports` 和 `_pendingBattleAnimations`→调 `_drainPendingBattleAnimations` 播动画→`showNextBattleReport` 弹modal。

**新增函数**:
- `_dbgRunForceBattle(atk, def, kind, opts)` — 异步,5种类型分支
- `_dbgPrepUnit(u)` — 通用预处理(清行军/AP充值)
- `_dbgEnsureFireFunds(fac)` — 火攻自动充资源到 FIRE_COST
- `_dbgFindNearbyRiverHex(q, r, maxR)` — 水战找最近河流
- `_dbgPosSnap(units)` — 战前位置快照(动画用)
- `_dbgRender()` — 包装 renderAll + invalidateFogCache
- `_dbgPlayPending()` — 播放动画 + 弹战报
- `_dbgGuessCityForUnit(u)` — 守方未指定城时的fallback

**UI新增**(在原"强制战斗"小区下方):
- 类型下拉 5项
- 地形下拉(field/ambush时显示):auto/plain/forest/mountain/hill/swamp
- 模式下拉(camp时显示):assault/raid
- 目标城下拉(siege时显示):动态填充守方所在势力的城
- 火攻checkbox:适用于 ambush/camp/naval(field火攻在游戏内由aiDecideFireAttack决定,无上层入口,Debug暂不支持)

**字段联动**:类型切换或守方变化时自动隐显附属行,改 city 下拉。

### 修复3:同势力guard
`_dbgForceBattleFromDropdowns` 进入校验:`if(atk.fac === def.fac){ toast('同势力部队无法战斗'); return; }` — 在confirm前生效,不会跳出弹窗。

### 修复4:事件诊断改成"100次试探+人话翻译"
之前直接展示 `def.condition.toString()` 的JS源码——非开发者看不懂。

新设计:
- 把"查看condition"按钮改名"试探100次"
- 点击后调 `_dbgProbeCondition(def, fid, 100)`:连续调condition 100次,统计成功次数;再加测100次"强制掷骰"模式(monkeypatch Math.random→0.001)
- 输出4种判断:
  - 100/100 必中 → "直接点【立即触发】即可"
  - 0/100 + 0/100强制掷骰 → "硬条件不满足(看下方源码线索,改G状态再试)"
  - 0/100 默认 + N>0/100强制掷骰 → "概率门槛挡住了,勾'强制掷骰'再触发"
  - X/100 部分成功 → "X% 成功率,通常会成功"
  - condition 抛异常的次数也单独统计(可能事件有bug)
- 触发失败时**自动展开诊断框**(不需要再点按钮)
- 切事件/势力时**自动清空诊断框**(避免上一个事件的数据混淆)

`_dbgGameSnapshot(fid)` 重写为只显示游戏tab能看到的信息:
- 第N旬, 春/夏/秋/冬季 (建安X年)
- 各势力存亡:魏(存) 蜀(存) 吴(存) 蛮(存)
- 选定势力:N城/N兵/N将,金/木/铁/马,信誉
- 删除内部字段:`facIdentity.type / stage / strategist / totalPop / eliminated` 等

### 验证(jsdom自动化)

| 验证项 | 状态 |
|---|---|
| `_debug.version` 升至 `v176-A3` | ✅ |
| Section数量 5(AI托管已删除) | ✅ |
| "快进 / AI托管"section存在 | ✅ |
| 强制战斗类型下拉 5 项(野战/伏击/营寨/攻城/水战) | ✅ |
| 切类型时附属行(地形/模式/城)正确显隐 | ✅ |
| 同势力guard:同势力部队不调confirm,直接toast拒绝 | ✅ |
| 事件诊断按钮文字"试探100次" | ✅ |
| 诊断输出含"试探100次"段+"势力存亡"友好状态 | ✅ |
| 切事件时诊断框自动清空 | ✅ |
| 实际战斗:野战 troops 5500→4270 / 守方 5000→2871(双方有伤亡) | ✅ |
| 伏击+火攻:守方被歼灭(火攻威力体现) | ✅ |
| 营寨劫营(raid):双方有伤亡 5500→4473 / 5000→2437 | ✅ |
| Real errors: 0(野战/伏击/营寨3类) | ✅ |
| (camp assault/camp+fire/siege/naval/naval+fire 在jsdom环境下未自动跑完,逻辑路径与已通过项相同) | 待真机验证 |

### 浏览器实测重点

1. 强制战斗5种类型逐个跑,看动画/战报modal正常弹出
2. 火攻在 ambush/camp/naval 各跑一次,确认资源被自动扣 FIRE_COST.gold/wood
3. 攻城战:守方瞬移进城后,城本身的garrison数据是否正确参与战斗(代码用城自身数据,不改)
4. 水战:攻方附近无river时,toast"无river"并放弃,不应crash
5. 事件诊断:打开各种事件,看人话部分是否能帮你判断为什么挡住

### 文件行数变化

v176-A2 → v176-A3:
- 强制战斗UI 新增 5个字段(type/terrain/mode/city/fire)+联动 (~50行)
- `_dbgRunForceBattle` 5种分支 (~120行)
- 辅助函数:`_dbgPrepUnit / _dbgEnsureFireFunds / _dbgFindNearbyRiverHex / _dbgPosSnap / _dbgRender / _dbgPlayPending / _dbgGuessCityForUnit` (~50行)
- `_dbgProbeCondition` + `_dbgRenderDiag` 重写 (~80行)
- `_dbgGameSnapshot` 简化 (~-20行)
- AI托管section删除 (~-65行)

净增约 **+212行**, project_romance_v176.html 39043 → 39254 行。

---

## v176-A4 第三轮反馈修复

### 反馈两点
1. **强制战斗下拉里有己方部队**(同势力guard能拦住,但不应出现在选项里)
2. **营寨战和攻城战没动画**(野战/伏击有,营寨/攻城没有)

### 修复1:守方下拉过滤同势力

`_dbgAllUnitOptions(excludeFac)` 加可选参数,过滤掉指定势力的部队。

UI生成时,守方下拉初始用 `G.units[0].fac` 作为exclude。
`_dbgBindUnit` 内加 `_dbg_fb_atk.onchange` 监听:攻方切换时重建守方下拉,exclude新攻方的fac;尝试保留之前的守方选择(若仍在新列表中)。

攻方下拉**不**过滤 — 用户可以选任何势力当攻方,包括玩家自己。

### 修复2:营寨/攻城无动画的根因 + 修法

**根因**: 游戏的 `_baCore.shouldSkip(attackers, defenders, report, posSnap)` 在以下任一条件下返回 `true` 跳过动画:
- `_fastForward === true`
- `_battleAnimating === true`
- 双方数组为空
- **AI vs AI**(双方都不含玩家方,即 `attackers.some(u=>u.fac===G.playerFac) || defenders.some(u=>u.fac===G.playerFac)` 为false)
- 战前位置都在玩家迷雾外
- mapRoot 不存在

野战和伏击有动画是因为用户测试时恰好选了玩家方参战。营寨/攻城没动画的真实原因不是游戏代码bug,是 Debug 测试时选了 AI vs AI(比如玩家是吴,选魏 vs 蜀),被 `shouldSkip` 拦截。

**修法**: `_dbgPlayPending` 在 `_drainPendingBattleAnimations` 和 `showNextBattleReport` 调用前,临时把 `_baCore.shouldSkip` 替换为 `()=>false`,完成后在 `finally` 块恢复原函数。

```javascript
async function _dbgPlayPending(){
  let _origShouldSkip = null;
  if(typeof _baCore !== 'undefined' && _baCore && typeof _baCore.shouldSkip === 'function'){
    _origShouldSkip = _baCore.shouldSkip;
    _baCore.shouldSkip = function(){ return false; };
  }
  try {
    await _drainPendingBattleAnimations();
    showNextBattleReport();
  } finally {
    if(_origShouldSkip) _baCore.shouldSkip = _origShouldSkip;
  }
}
```

**关键技术发现**:虽然游戏的 `const _baCore = ...` 不暴露到 `window._baCore`,但 Debug script 和游戏 script 共享 script-level global scope,所以 Debug script 内**直接写 `_baCore`** 能访问到。这是典型的浏览器多个 `<script>` 块共享global scope行为。验证方式:`typeof _baCore !== 'undefined'` 在 Debug 内为 `'object'`,但 `window._baCore` 是 `undefined`。

**该修法对所有5种战斗类型生效**(野战/伏击/营寨/攻城/水战),因为它们都通过 `_dbgPlayPending` 进入动画消费。

**为什么不改 `G.playerFac` 或 `G.fog`**: 那些会污染游戏状态,可能影响后续 renderAll 显示;直接 monkeypatch shouldSkip 影响范围最小,2-3秒后恢复。

**为什么不改主代码加豁免flag**: 用户硬性原则"主代码0改动"。

### 验证(jsdom自动化)

| 验证项 | 结果 |
|---|---|
| `_debug.version` 升至 `v176-A4` | ✅ |
| 初始守方下拉自动排除第一个unit的势力 | ✅ |
| 攻方切换为魏后,守方下拉只剩 蜀/吴(无魏) | ✅ |
| `_dbgPlayPending` 内 `_baCore.shouldSkip` 被临时override(`_debug._lastSkipOverride === true`) | ✅ |
| AI vs AI(魏 vs 蜀)营寨战实际发生:5500→4387 / 5000→2905 | ✅ |
| Real errors: 0 | ✅ |

### 浏览器实测重点

1. **AI vs AI 营寨/攻城/水战要看到动画**(之前A3的核心问题)
2. 守方下拉里再也不会有己方部队
3. 攻方切换时,守方下拉自动重建排除同势力
4. 玩家参战的战斗动画依然正常

### 文件行数变化

v176-A3 → v176-A4:
- `_dbgAllUnitOptions` 加excludeFac参数 (~3行)
- `_dbgUnitHtml` 守方初始排除firstFac (~3行)
- `_dbgBindUnit` 加atk.onchange联动 (~14行)
- `_dbgPlayPending` 加shouldSkip override (~12行)

净增 **+33行**, project_romance_v176.html 39254 → 39286 行。

---

## v176-A5 第四轮反馈修复

### 反馈两点
1. **水战没动画**(伏击/营寨/攻城/野战都有,只有水战没)
2. **战斗位置在玩家迷雾里看不清**(攻方曹操打守方赵云时,战斗发生在赵云处,在阴影里)

### 修复1:水战 + 野战动画(根因比想象的复杂)

诊断过程发现**两个独立问题**叠加:

**问题1A** — `_resolveBattleEngagement` 行 29937 retreat 过滤:
```javascript
const defRetreated = defRetResult.canRetreat && defenders.every(u=>u.fac!==G.playerFac);
```
"守方全是AI且能撤退"时直接走 retreat 路径,**不push report,战斗不真正发生**。Debug场景下用户期望"强制打",所以这个过滤要绕过。

**问题1B** — `_playBattleCollisionAnim` 行 25767 内联了hasPlayer检查:
```javascript
const hasPlayer = attackers.some(u => u.fac === G.playerFac) || defenders.some(u => u.fac === G.playerFac);
if(!hasPlayer) return;
```
野战动画**不走 `_baCore.shouldSkip`**,所以A4加的shouldSkip override对野战无效。`_playNavalBattleAnim` 走 `_baCore.shouldSkip`(行27151),所以水战动画能被A4 override救。但水战在retreat路径下连report都没,_resolveBattleEngagement 内部根本不会调动画或push队列(行30024 push水战动画的条件是 `report.isNaval && !_hasPlayer`,而retreat路径压根不进这个分支)。

**统一修法**:
```javascript
const _origPlayerFac = G.playerFac;
G.playerFac = def.fac;  // ← 让"守方就是玩家"
try {
  _resolveBattleEngagement(...);
  await _playBattleCollisionAnim(...) 或 _playNavalBattleAnim(...);
} finally {
  G.playerFac = _origPlayerFac;
}
```

效果:
- `defenders.every(u=>u.fac!==playerFac)` 变为 false → retreat 不触发 → 战斗真正发生 → push report
- `hasPlayer` 检查 (`defenders.some(u=>u.fac===playerFac)`) → true → 动画不skip

副作用:动画播放 2-3 秒期间,`G.playerFac === def.fac`,可能引起以下显示性影响:
- renderAll 把守方当玩家高亮(战斗中已经是 `_battleAnimating`,影响有限)
- pFog 临时是 def.fac 的fog
- 单位选中清空逻辑可能误清

实际测试无功能性问题。

**实装位置**:替换 `_dbgRunForceBattle` 的 `field`/`naval` 分支。`ambush`/`camp`/`siege` **不需要**这个修法,因为它们走自己的 `resolve*Battle` 直调路径,不经过 `_resolveBattleEngagement` 的retreat过滤,而且对应动画函数都走 `_baCore.shouldSkip`(已被A4 override)。

**取消A3的 `_dbgPlayPending` 用于field/naval**:改成手动 `await _playBattleCollisionAnim` / `_playNavalBattleAnim`,然后再 drain 队列(防御性,处理万一被push到队列的情况)。

### 修复2:揭雾让战斗看得清

游戏的 `G.fog[playerFac][hkey(q,r)]` 控制玩家可见性。Debug在战斗发生位置半径2格内,临时把fog设为 `FOG_VISIBLE`,这样动画在阳光下播。

**新增函数 `_dbgRevealAround(q, r, radius=2)`**:
- 从 (q,r) 出发,BFS 到 radius 步,把所有 hex 设为 `FOG_VISIBLE`
- 不保存原值——`FOG_VISIBLE` 在下次玩家fog重算(行16198 等)时会根据真实视野自动调整。半径2的小区只是"亮一下",战斗结束后下旬就回到正常fog流程。
- 如果 G.fog / G.playerFac 不存在则noop(防御)

**调用点**:5种战斗类型都在战斗hex位置揭雾:
- field: `_dbgRevealAround(atk.hq, atk.hr, 2)`
- naval: 双方瞬移到river hex后,`_dbgRevealAround(atk.hq, atk.hr, 2)`
- ambush: `_dbgRevealAround(atk.hq, atk.hr, 2)`(同伏击点)
- camp: `_dbgRevealAround(atk.hq, atk.hr, 2)`(攻方瞬移到守方处后)
- siege: `_dbgRevealAround(city.q, city.r, 2)`(攻城战在城)

**注意**:在field/naval分支里,揭雾要在 `G.playerFac = def.fac` **之后**调,因为 `_dbgRevealAround` 内部读 `G.playerFac` 决定揭哪个势力的fog。我们临时playerFac=def.fac,所以揭的是def方的fog——这正确,因为后续 hasPlayer 检查和迷雾检查都用临时playerFac。

### 重构:把 shouldSkip override 抽出来

之前A4只在 `_dbgPlayPending` 里override。A5 field/naval 也需要,所以抽出:
- `_dbgOverrideShouldSkip()` → 返回原函数(或null)
- `_dbgRestoreShouldSkip(orig)` → 恢复

`_dbgPlayPending` 内部改用这两个新函数。`_debug._lastSkipOverride` 保留作为诊断标志。

### 验证(jsdom自动化)

5种战斗类型,每种独立测试,各自只调用对应动画函数1次(无遗漏无重复):

| 类型 | _playBattleCollisionAnim | _playNavalBattleAnim | _playAmbushBattleAnim | _playCampBattleAnim | _playSiegeBattleAnim |
|---|---|---|---|---|---|
| field | **1** ✅ | 0 | 0 | 0 | 0 |
| ambush | 0 | 0 | **1** ✅ | 0 | 0 |
| camp | 0 | 0 | 0 | **1** ✅ | 0 |
| siege | 0 | 0 | 0 | 0 | **1** ✅ |
| naval | 0 | **1** ✅ | 0 | 0 | 0 |

A4 的regression测试也通过(version v176-A5,Real errors=0)。

### 浏览器实测重点

1. **野战(field) AI vs AI 现在有动画了**(之前A4也没,只是用户测试时恰好选了玩家方)
2. **水战动画终于出现**
3. 战斗位置周围2格揭雾,看得清动画
4. 动画期间 G.playerFac 短暂改变(2-3秒),完成后恢复 — 不会污染存档

### 文件行数变化

v176-A4 → v176-A5:
- field/naval分支重写(临时改playerFac+手动await动画) (~30行)
- `_dbgRevealAround` 新增 (~22行)
- `_dbgOverrideShouldSkip` / `_dbgRestoreShouldSkip` 抽出 (~15行)
- `_dbgPlayPending` 简化 (~-15行)
- 其他3种战斗加揭雾调用 (~3行)
- 删除A4多行注释 (~-5行)

净增 **+62行**, project_romance_v176.html 39286 → 39347 行。

---

## v177 文案 Clean-up（剧本名 / 版本号 / 新手指导 / Tab帮助）

> 本轮**只改文案**，无逻辑改动。文件升级 v176 → v177，零代码 bug 风险。

### 背景

用户反馈三个 clean-up 项：
1. 剧本名应叫"三国鼎立"（实际游戏剧情），而非"群雄割据"
2. 标题菜单底部仍显示 v167，从 v167 开始就没更新
3. 新手指导自 v167 起未跟进，且 Tab 帮助系统也需要相应更新

设计原则确认：
- 新手指导**不长篇大论**，原文不删改，只在最相关 detail 末尾追加 1-2 句
- Tab 帮助同理，只补充缺漏的 v167+ 机制
- 术语统一中文（**军阀/一方之主/政权**、**豪强县**），不用英文 warlord/regional/regime 或 magnate

### 修改清单（共 10 处，全部为文案补充）

#### B 三处 clean-up

| # | 行号 | 改前 | 改后 |
|---|------|------|------|
| B1 | 34284 | `群雄割據` | `三國鼎立` |
| B2 | 34202 | `v167 · 三国·苍生问策` | `v177 · 三国·苍生问策` |
| B3 | 34292 | `107位武将` | `109位武将`（对齐零章节快照） |

#### C 新手指导（TUT_PAGES）轻量补充

| # | Page | 位置 | 追加内容 |
|---|------|------|---------|
| C1 | Page 2 城池·豪族 | detail 内 | 豪强县（属县名带★）qualitative 说明：经济产出更高、情绪更敏感（不写数值） |
| C2 | Page 3 武将·派系朝议 | detail 内 | 一句势力阶段：军阀→一方之主→政权，根据地稳固后宗族影响力下降 |
| C3 | Page 4 军事 | 新增 detail | "部曲与老兵"4-5行简介，详见 mil tab ❓ |
| C4 | Page 7 官职 | detail 内 | 四档解锁（诸侯→侯→公→王）+ 称帝冲击天命，qualitative（不写城数门槛） |
| C5 | Page 8 政策 body | body 主体 | 加一行"徭役 — 调控建设速度，损民心和质量" |

新手指导原 10 个 page，**仍为 10 个 page**，未新增 page。

#### D Tab 帮助（TAB_HELP）补充

| # | Tab | 位置 | 改动 |
|---|-----|------|------|
| D1 | city | "豪族势力" section 重写扩展 | 属县三类（治所/豪族据点/普通县）+ 豪强县（×1.5/×2.0）+ 太守分级（本县+0.5 / 同城+0.3 / 外地-0.1 / 寒门降将-0.2 / 无太守-0.15）+ tooltip 三组分解指引 |
| D3 | mil | 新增 section "战斗演出" | 5 种战斗动画（野战/伏击/营寨/攻城/水战）+ 叫阵单挑前奏 + 动画与结算独立说明 |
| D4 | faction | 新增 section "势力阶段" | 三阶段叙述+晋升条件（一方之主：单州4城+总城6+8旬；政权：总城12+2非小州各4城）+设计意图 |
| D5 | faction | "操作指引" section | 加一句"派系标签顶部显示当前阶段+内政概览（v168）" |

TAB_HELP sections 总数：61（v176） → **63**（v177，净增 2，对应 D3 战斗演出 + D4 势力阶段；D1 是扩写不增 section；D5 是已有 section 内补充）。

### 验证

| 验证项 | 结果 |
|---|---|
| 整文件行数 | 39347 → **39368**（+21 行） |
| JS 两个 `<script>` 块 `node --check` | ✅ 全部 OK |
| TUT_PAGES 数 | 10 ✅（不变） |
| TAB_HELP keys 数 | 12 ✅（不变：city/mil/gen/post/dip/scheme/faction/tech/ethos/stats/policy/ai） |
| TAB_HELP sections 总数 | 61 → **63** ✅（净增 2） |
| 旧字符串"群雄割據"残留 | 0 ✅ |
| 旧字符串"v167 · 三国"残留 | 0 ✅ |
| 旧字符串"107位武将"残留 | 0 ✅ |

### 设计选择记录

1. **不新增新手指导 page**：用户明确说"轻量点"，新增 page 算"长篇"。三阶段、部曲等概念用追加 detail 的方式塞进现有 page，深入了解仍引导玩家去看对应 tab 的 ❓ 帮助。
2. **术语全中文**：handover/代码内部仍用英文 (warlord/regional/regime/magnate) 不动，UI 文案统一用中文。
3. **新手指导 qualitative 原则**：用户明确指出新手指导不应出现数字/公式（如 ×1.5、≥1/3/6/10城）。新手指导只做定性引导（"经济产出更高、情绪更敏感"、"城池增多可逐步解锁"），具体数值和门槛全部下放到 Tab 帮助系统的 ❓ 详解里。Tab 帮助本来就是给想深入理解机制的玩家用的，可以保留数字。
4. **C3 部曲与老兵 detail 与 mil tab 已有内容差异化**：新手指导版只讲核心取舍（部曲消失风险、为什么要用休整而非解散），详细机制（数值、政治影响力、增长率）放在 mil tab ❓ 内，避免重复。
5. **D1 城tab豪族 section 改写策略**：原 section 太简略（4 行），玩家点 ❓ 完全感受不到 v170 重构的厚度（属县三类、豪强县、太守 5 级分级、三组每旬分解）。这次扩写到约 12 行，但都是真信息——玩家想理解豪族系统这一段就够了。
6. **不动其它 tab**：post/dip/scheme/tech/ethos/stats/policy/ai/gen 这些 tab 的 v167+ 新机制（互市/通商/通使/迁民/徭役/价值观）原本就有完整覆盖，本轮不动。
7. **mil tab "战斗演出"section 末尾原写了"可在设置中关闭动画"** —— 用户确认无此开关，已删除该句。

### 不在本轮改动的（明确放弃）

| 项 | 理由 |
|---|------|
| 州体系（13州+南中）专门讲解 | 玩家通过 UI（叠加层、城市归属州显示）能感知，不需要文档显式解释 |
| 战斗动画开关 | 用户确认游戏内无此开关，相应文案已删除（mil tab "战斗演出"section） |
| 零章节快照表更新 | handover 顶部表是上一轮的，本轮不改（按"原文档不重写"原则） |

### 文件变化总结

- `project_romance_v176.html` (39347 行) → `project_romance_v177.html` (**39368** 行)
- 净增 **+21 行**，全部为 TUT_PAGES / TAB_HELP 内的文案
- 0 行逻辑代码修改，0 行函数签名变化，0 风险

### 浏览器实测重点

1. 标题菜单底部应显示"v177 · 三国·苍生问策"
2. 剧本卡标题应为"三國鼎立"
3. 任意启动一局后点 ? 看新手指导，10 个 page 都能正常翻
4. 在派系 tab 点 ❓，"势力阶段"section 出现在"派系影响力"之前
5. 在军事 tab 点 ❓，最后一项是"战斗演出"
6. 在城池 tab 点 ❓ → "豪族势力"展开，能看到属县三类、豪强县、太守分级

---

## v178 Audit 修复（5 bugs · v167-v176 累积盲区）

> 用户要求做一轮全面 code audit，重点关注 v167+ 改动。共发现 5 个真实 bug + 一批"注意事项"（不是 bug）。本轮全部修复。

### 背景：为何能撑到 v177 没暴

5 个 bug 的共同点是**主剧本主流路径不触发**：
- 客居派系阶段化（#9）：当前赤壁后剧本三大势力都是 regime，永远碰不到
- AI 双 commander（#3）：只影响 AI 编组，玩家手编不受影响
- GEN_CLASS 漏 8 人（#19）：6 人在剧本时间点已死或未成年
- 一县多族 base（#30）：仅吴县/谯县易主时少 10 点 loyalty
- 朝议 shock 叠加（#33）：仅吴县/谯县在朝议时被 3× 叠加

历史 self-audit（v167 三轮、v175 自审 17 项 + 4 轮玩家反馈、v176 五轮）覆盖了主路径，本轮 audit 抓的是边角剧本/AI/特殊县。

### Bug 与修复

#### Bug #3 — AI 编组武将四类双 commander（middle severity）

**问题**：`createUnit` 内 AI 自动选 class 只扫多标签 squads，忽略已存在的"单标签 commander"武将（如刘备）。多标签武将（如关羽 [warrior,commander]）仍贪心选 commander → 双 commander 冲突 → `cmdConflict=true` → 统帅 buff 全失效（士气+5、单挑+5%、计谋+5%、补给+1）。

**复现**：`squads = [刘备, 关羽, 张飞]` → 关羽 `_classChoice='commander'` → cmdCount=2。

**修复**（行 21769-21789）：先扫一遍标记单标签 commander，再处理多标签。

```js
let hasCmd = false;
squads.forEach(sq => {
  const classes = GEN_CLASS[sq.genName] || ['warrior'];
  if(classes.length === 1 && classes[0] === 'commander') hasCmd = true;
});
// 然后才处理多标签
```

#### Bug #9 — 客居派系军阀阶段错误提升至 1.0（low severity in 当前剧本）

**问题**：`_genInfluence` 行 5381 `else if(def && def.gentryStates)` 把 `[]` 当 truthy 进入分支，warlord 阶段第 5388 硬设 `mult = 1.0`。但 dongzhou/huaisi 的 baseMult 是 0.8，设计明确"永远客居 0.8"。

**复现**：`gentry_huaisi` warlord 阶段 mult = 1.0（应 0.8）。

**修复**（行 5381）：`else if(def && def.gentryStates && def.gentryStates.length > 0)` —— 空数组的客居派系直接落到末尾"baseMult 不变"分支。

**影响范围**：当前主剧本 wei/shu/wu 都是 regime 阶段不触发；nanman 是 warlord 但阵营内只有孟获/祝融，都不属于 dongzhou/huaisi。**目前剧本无玩家可见行为变化**——但未来加 190 开局或扩张剧本会暴露。

#### Bug #19 — GEN_CLASS 漏定义 8 武将

**问题**：GEN_TAGS 有 133 武将，GEN_CLASS 只 125。漏：典韦/高顺/陈宫/太史慈/孙策/陆抗/沮授/田丰。`getSquadClass` 默认返回 `'warrior'`，对 strategist/commander 的武将造成 buff 错误。

**修复**（行 4044-4048）：

```js
'典韦':['warrior'], '高顺':['warrior'], '陈宫':['strategist'],
'太史慈':['warrior','commander'], '孙策':['warrior','commander'],
'陆抗':['commander','strategist'],
'沮授':['strategist','minister'], '田丰':['strategist','minister'],
```

**类型决策依据**：典韦/高顺已是默认 warrior，无功能影响；其余按演义/正史定位。

#### Bug #30 — `_clanHasMemberInFac/_clanHasOfficeInFac` 不支持数组 clanFamily

**问题**：v170 引入"一县多族"（吴县=[wj_gu,wj_lu,wj_zhu]、谯县=[pg_cao,pg_xhs,qg_xu]），但这两函数仍用 `===` 比对，数组永远不等于字符串。导致：
- 本土初始化（行 15562-15571）：吴县初始 loyalty 应 70（有官）/55（无官），实际 55/30
- 易主初始化（行 15639）：吴县易主到吴时应 base=25，实际 base=15

**复现**：`_clanHasMemberInFac(['wj_gu','wj_lu','wj_zhu'], 吴势力武将)` → 错误返回 false。

**修复**（行 15599-15613）：两函数都加 `Array.isArray` 兼容：

```js
const clans = Array.isArray(clanFamily) ? clanFamily.filter(Boolean) : [clanFamily];
return gens.some(g => clans.includes(g.clan));
```

#### Bug #33 — 朝议 shock 在一县多族被叠加 3× （吴势力玩家高频暴露）

**问题**：`_applyCourtDecisions` 行 5837-5853 收集"该派系 region 内所有 clan_base 县的 clanFamily"到 Set，然后逐 clan 调 `applyFamilyLoyaltyShock`。后者扫整个版图，每次都会扫到吴县。结果吴县在江东士族提案下被 +30（应 +10）/-18（应 -6）。

**复现**：江东士族提案采纳一次 → 吴县 loyalty +30。

**修复**（行 5839-5862）：改为按 county 去重直接 shock，不再走 `applyFamilyLoyaltyShock`：

```js
const _shockedCounties = new Set();
for(const reg of regions){
  for(const cid of regionCityIds){
    const ct = G.cities[cid];
    if(!ct || ct.fac !== fid || !ct.counties) continue;
    let touched = false;
    ct.counties.forEach(county => {
      if(county.type !== 'clan_base') return;
      const key = cid + '·' + county.name;
      if(_shockedCounties.has(key)) return;
      _shockedCounties.add(key);
      county.loyalty = Math.max(0, Math.min(100, county.loyalty + countyDelta * COUNTY_CLAN_SENS));
      touched = true;
    });
    if(touched) ct.gentry = _aggregateGentry(ct);
  }
}
```

设计语义：**朝议影响的是"该派系所属 region 的 clan_base 县们"**，每县固定受一次 shock，与县内有几个 clan 无关。

### 验证

| 维度 | 结果 |
|---|---|
| 静态回归（regress_v178.js） | 15/15 ✅ |
| 行为回归（behavior_v178.js） | 13/13 ✅ |
| JS 两个 `<script>` 块 `node --check` | ✅ |
| 文件行数 | 39368 → **39388** (+20 行) |
| TUT_PAGES 数 | 10 ✅（不变） |
| TAB_HELP keys 数 | 12 ✅（不变） |
| TAB_HELP sections 总数 | 63 ✅（不变） |

### Audit 中**没**修的注意事项（按设计/低优先）

| # | 项 | 决定 |
|---|---|------|
| #2 | 统帅 morale 永久叠加（capped 100） | 设计内可接受 |
| #5 | getGenHomeCounty O(N) 性能 | 低优先，可启动期一次缓存到 GEN_TAGS |
| #6 | magnate ×1.5 实际效果 +10~15%（按 popShare 摊薄） | 设计内一致 |
| #11/#14 | drain 时序竞态 | v175 已自审修过，guard 在位 |
| #17/#18 | 部曲上限 50% 是 soft ceiling | 安全 |
| #20/#26 | 影响力缓存清空策略略激进 | 结果正确无 bug |
| #23 | DOM 残留 | 5 动画都有 try/finally + cleanup ✅ |

### 未在本轮 audit 范围

- v176 debug 面板（用户已说 less focus，玩家看不到）
- v118 之前的更老逻辑（本轮聚焦 v167-v176）

### 文件变化

| 文件 | v177 | v178 |
|---|---|---|
| project_romance | 39368 | **39388** (+20) |

### 浏览器实测重点

1. 标题菜单底部应显示 **v178 · 三国·苍生问策**
2. 吴势力下：朝议"江东士族"采纳/驳回，看吴县 loyalty 变化是 ±10 / ±6（不再 ±30 / ±18）
3. 任意势力武将列表：应能看到沮授/田丰/陈宫等显示为 🧠 谋士标签（如能进入剧本）
4. AI 编组（看 AI 部队 unitDetail）：刘备+关羽+张飞类型部队不应再出现"⚠ 双统帅冲突"


---

## v179 第三轮 Audit 修复（3 bugs · v85+v118+v172 累积盲区）

> 用户要求继续审更细节。第三轮聚焦：v118 之前老逻辑、数学公式正确性、初始化竞态、UI 边界。共发现 3 个真实 bug，全部修复。

### Bug 与修复

#### Bug #57 — v85 兵力比修正在多部队战斗中虚高

**问题**（共 4 对 = 8 行）：
- `attackers.reduce((s,u)=>s+getUnitTroops(u)+atkLost, 0)` —— `+atkLost` 在 reduce 内被加 N 次（N=部队数）
- 应该是 `attackers.reduce((s,u)=>s+getUnitTroops(u),0) + atkLost`

**位置**：
- 23609/23610 + 23623/23624 (`resolveAmbushBattle` 双向)
- 24373/24374 + 24387/24388 (`resolveBattle` 双向)

**实际影响**：
- N=1 部队：无影响（最常见 case）
- N=2：胜方损失低估 ~5.5%
- N=3：胜方损失低估 ~6.3%
- 仅在"兵多方赢"时触发（即修正条件 `atkTr > defTr`）

**复现**：攻方 2 部队各 3000、守方 1500、损失 1500 时，buggy `atkTr=9000`、fixed `atkTr=7500`，最终 `atkLost` 修正：buggy 866 → fixed 949。胜方少损失 83 兵。

**修复**：4 处全部把 `+xxxLost` 移出 reduce。

#### Bug #58 — unit 删除路径未清 selUnitId

**问题**：6 处 `G.units = G.units.filter(...)` 删除点中，2 处未清 selUnitId：
- 行 7994（挖角后清空源 unit）
- 行 22919（killGen 武将永久移除）

其他 4 处属于 AI 自身操作或玩家不可能选中的 unit（解散小部队、AI 裁军等），玩家不会感知。

**实际影响**：玩家选中含有"被处决武将的部队"或"被挖角武将所在部队"时，部队被删除但 selUnitId 不清空 → 下次 renderRight 找不到 unit → UI 优雅降级（空面板），不崩溃但 UX 异常。

**修复**：两处加 `if(G.selUnitId && !G.units.find(u=>u.id===G.selUnitId)) G.selUnitId=null;`。

**注意**：本修复过程中曾误删 `G.generals[srcFid] = ...filter(...)` 一行——已立即检测并恢复。回归测试有专门检查这行仍在。

#### Bug #60 — `_isFacHomeRegion` v172 重构残留导致初始化错认本土

**问题**：`_isFacHomeRegion` 第 15601 用 `'zhongyuan'`/`'hebei'` 字面量比较，但 v172 把 region 从派系名（zhongyuan/hebei）改成 14 州名（si/yu/yan/...），该比较永远为 false。

后果：势力首都所在 state 之外的本土州（如魏的颍川 yu、陈留 yu、邺城 ji；蜀的南中 nanzhong；吴的交州 jiao）被错认为"外来" → 初始化时属县 loyalty 严重偏低：
- seat 县：90 → 40
- clan_base 县：70/55 → 45/30/20

**实际影响**：每个新游戏开局都触发，玩家在前 5-10 旬感受异常豪族抗拒（虽然 v170 第 2 组动态恢复机制能慢慢拉回）。

**修复**（行 15591-15622）：用 `STATE_TO_GENTRY_FAC` 反查同派系州互通：

```js
const capGentryFac = STATE_TO_GENTRY_FAC[capReg];
const regGentryFac = STATE_TO_GENTRY_FAC[reg];
if(capGentryFac && regGentryFac){
  if(capGentryFac === regGentryFac) return true;
  // 保留 zhongyuan ↔ hebei 互通（旧设计意图）
  if((capGentryFac === 'gentry_zhongyuan' && regGentryFac === 'gentry_hebei') ||
     (capGentryFac === 'gentry_hebei' && regGentryFac === 'gentry_zhongyuan')) return true;
}
```

**修复后行为**：
- 魏：si/yu/yan（gentry_zhongyuan）+ ji/qing/you/bing（gentry_hebei）全本土，liang/xu 外来
- 蜀：yi + nanzhong（同派系 yizhou）本土，jing/liang 外来
- 吴：yang + jiao（同派系 jiangdong）本土

### 验证

| 维度 | 结果 |
|---|---|
| 静态回归（regress_v179.js） | 14/14 ✅ |
| 行为回归（behavior_v179.js） | 14/14 ✅ |
| JS 两个 `<script>` 块 `node --check` | ✅ |
| v178 6 个旧修复持续在位 | ✅ |
| `G.generals[srcFid]` 过滤行未误删 | ✅（专项检查） |
| 旧 `'zhongyuan'/'hebei'` 字面量残留 | 0 ✅ |
| 旧 `+xxxLost` 在 reduce 残留 | 0 ✅ |
| 文件行数 | 39388 → **39407** (+19 行) |

### Audit 中**没**修的项（按设计/低优先）

| # | 项 | 决定 |
|---|---|------|
| #41 | GEN_POOL_INACTIVE 8 武将（v178 #19 修补的）当前剧本不参战 | 保留兜底 |
| #50/#51 | 137 武将中 61% birthplace 在 COUNTY_DATA 找不到对应县 | 用户决定数据修缮先无所谓 |
| #56 | getMaxInt 边界（units 全空 → best=0） | 兜底正确 |
| #58 其他 4 处 | 解散/AI 裁军等点未清 selUnitId | 玩家不可达 |

### 三轮 Audit 总结

| 轮次 | 焦点 | 真实 Bug | 已修复 |
|---|---|---|---|
| 第一轮 | v167-v176 主要新机制 | 5 (#3/#9/#19/#30/#33) | v178 全修 |
| 第二轮 | v178 修复回归+老模块 | 0（仅数据修缮项 #50/#51） | — |
| 第三轮 | 数学公式+初始化+UI 边界 | 3 (#57/#58/#60) | v179 全修 |

**累计修复 8 个真实 bug**，全部经 node 测试复现+验证。

### 文件变化

| 文件 | v178 | v179 |
|---|---|---|
| project_romance | 39388 | **39407** (+19) |

### 浏览器实测重点

1. 标题菜单底部应显示 **v179 · 三国·苍生问策**
2. 新游戏开局看吴/蜀/魏的非首都州城（颍川/南中/交州/邺城）属县 loyalty 应较 v178 大幅提升（seat 90 vs 40）
3. 多部队战斗（2+ unit 围攻）的胜方损失统计应略高于 v178（约 5-7%）
4. 处决武将后选中的部队应自动取消选中（不再保留 selUnitId 悬挂）

---

## 二〇〇、v179 冷审修复（v1.6.7 代码冷审报告）

> **背景**：基于 `三国苍生问策_v1_6_7_代码冷审报告.md`（针对 v167 代码盘点的 7 个 P0 + 16 个 P1/P2 + 28 个 P3）逐项核验并在 v179 文件上修复。
> **原则**：架构干净（单一入口 / 不可变常量 vs 可变状态分离 / 契约清晰），不打容易出问题的补丁。

### 已修 — 12 个

所有修复点在代码内有 `★ v179fix Pxx` 标记，可 grep 定位。

| ID | 类型 | 改动概要 |
|---|---|---|
| **P7** | 资源管理 | `resolveNavalBattle` 加 try/finally — squad type 还原保证执行，异常时也不再永久变 light |
| **P8** | 数学/边界 | 张辽「威风」用 `_zhangliaoMoraleAdded` 数组记录实加量，战后还原**实加量**而非硬编码 -20，cap 对称 |
| **P9** | 接口完整性 | `calcHexPathCost(hexPath, troopType, startOnWater)` 加第 4 参数并沿路径维护 onWater，UI 估算与 hexAstar 一致 |
| **P10** | 战斗流程 | `processUnitMovement` AI 部队进自家城设 `_arrivedThisTurn = true`，对齐 16326 行旬末校正路径，siegeDecay 解围正确触发 |
| **P14** | 存档/架构 | 新增 `G.factionRulers` + `getFactionRuler` / `setFactionRuler` helper；FAC.ruler 还原为不可变剧本初值；君主继任写 G，序列化保住，~73 处 `genHasOffice` 派生调用全部正确 |
| **P15c** | 流程/重构 | 新增 `_applyPeaceAgreement(fidA, fidB)` helper，4 个停战路径全部收敛；玩家介入时推迟 mutation 到 acceptPeaceOffer/rejectPeaceOffer；顺手统一诸葛瑾「缓颊」加成与 truce 事件在所有路径生效 |
| **P17** | 一致性 | 停战 CD = 15 旬，原玩家路径 10 / AI 路径 15 的差异**被 P15c 重构吸收**——CD 数字现在唯一定义在 helper 内 |
| **P19** | 数据流 | `processTechResearch` 完成时 `delete _techEffectCache[fid]`，下旬粮/金/招募 buff 立即生效 |
| **P21** | 战斗经验 | `applyBattleExp` 接受 `t === 'battle'`（野战 resolveBattle 设的 type），unit.level 不再卡死 |
| **P37** | 外交副作用 | `envoy_visit` 斩使立威调用 `applyWarDeclarationEffects(fid, target, null)`，走全套无名宣战副作用（信誉-/第三方-/派系冲击/ethos shock） |
| **P41** | 存档契约 | `saveToSlot` 检测未消化战报，拒绝存档并提示玩家先关闭战报；`saveGame` 保持只读快照契约，零 schema 变更、零数据风险 |
| **P51** | 字段名错 | `_buildEnvoyIntel` 粮草判断 `c.food` → `c.storage`，envoy 情报"粮草告急"不再永远 true |

### 未修，需要确认设计意图（4 个）

| ID | 问题 | 需要的决定 |
|---|---|---|
| **P6** | 部曲战损公式 `retLost = lost × (retInSq / sq.troops) × 0.35`，注释说"0.35x 正常损失率"但实际可能低估 30% | 是否为有意设计 |
| **P22** | 隐匿户口阈值 `if(countyPop > initPop * 0.30)` — 字面意思是"人口>初始 30% 即流失"，冷审猜应为 `* 1.30`（人口超基线 30% 才视为隐匿） | 阈值意图 |
| **P27** | 事件 `_popEventQueue` ctx 跨旬 stale — 只验证 `ctx.city.fac`，未验证 `ctx.unit / ctx.genName / ctx.targetFid / ctx.cityId` | 是否需要统一 ctx 验证 schema |
| **P37 副作用扩展** | 当前 P37 已修核心绕过问题。但"斩使=立即开战" 的设计上是否还要保留某种特殊性（与正常宣战的差异） | 设计差异化是否要保留 |

### 未修，溢出"小修"范围（需要单独迭代）

| ID | 问题 | 估算 |
|---|---|---|
| **P23** | 朝议 `_pendingCourtCouncil` 不进存档 | proposal 含 gen 对象引用，需要写 hydrate 层（取消硬引用→只存 ID/name，反序列化时反查），中型重构 |
| **P24** | Claude AI 战略记忆不进存档 (`_intelHistory / _strategyMemory / _lastSnapshot / _lastStrategicTurn`) | 需要为 Claude AI 内部状态设计 schema 并 migration 旧存档，中大型重构 |

### 已确认无需修（冷审误判）

| ID | 实际情况 |
|---|---|
| **P28** | 5 个动画函数 finally 调 `_baCore.cleanupAnimLayers([...])`，该 helper 内部 25420-25425 行**已包含** `unitsLayer` 上 `visibility:hidden` 还原。冷审基于 v167 时可能确实没有，v179 已在 helper 内统一兜底。无需修 |

### 未修，剩余 P2/P3（待下个迭代）

剩余 P2（一致性/边界）：P16（挖角 rel 单向）、P18（称臣 CD 单向）、P29（_aggregateGentry 返回值丢弃）、P49（setPrefect/setStrategist 缺归属性防御）、P50（backToTitle 不清 modal）。**这些 5 个都是小修，原计划本轮一起做，因上下文承重未完成。下轮优先做。**

剩余 P3（28 个结构性 / dead code / 代码质量）：未审。多数是冷审自己证伪的"无影响"项（P34/P35/P36/P43/P46/P47/P48 等）。可低优先级处理。

### 文件变化

| 文件 | v179（原） | v179（冷审修复后） |
|---|---|---|
| project_romance | 39407 | **39416** (+9 行) |

净 +9 行：P14 新增 helper 函数 (~13 行) + P15c 抽出 `_applyPeaceAgreement` 但移除 4 处重复 mutation (~净 -25 行) + P8 改逻辑 (~+8 行) + P7/P9/P19/P21/P37/P41 等小改动注释累计 (~+13 行)。代码总量略减实属重构正向信号。

### 校验

- node --check（提取 `<script>` 块）：✅
- 16 个 `★ v179fix Pxx` 标记全部带说明注释、可 grep 索引
- 11 个 P 系修复，每处都有对应的"修复目的"和"对齐参考行号"
- 存档兼容：P14 `getFactionRuler` 内置 `FAC[fid].ruler` 兜底，旧存档读不出 `G.factionRulers` 时回退到剧本初值

### 下轮入口指引

新对话开始后：
1. 读本文件、`三国苍生问策_v1_6_7_代码冷审报告.md`、`project_romance_v179.html`
2. **优先做未完成的 P1/P2 五个小修**：P16 / P18 / P29 / P49 / P50（每个 1-10 行，纯防御 / 边界修复 / 对齐双向键约定）
3. **讨论决定**：P6 / P22 / P27 设计意图
4. **排期**：P23 朝议序列化、P24 Claude AI 战略记忆——每个都是单独的中型重构，建议各占一轮

---

## 二〇一、v179 冷审修复（续）— P16 / P18 / P29 / P49 / P50 五项

> **背景**：v179 第一轮修了 12 项；P1/P2 剩余 5 个小修在本轮完成（约 14 行净增）。
> **原则**：纯防御 / 边界对齐双向键约定，不引入新机制。

### 已修 — 5 个

所有修复点带 `★ v179fix Pxx` 标记，可 grep 定位。

| ID | 类型 | 改动 |
|---|---|---|
| **P16** | 双向键一致性 | AI 挖角成功后只写 `G.diplo[minFid-maxFid]` 单向 rel-15；改用 `addDiplo(fid, srcFid, -15)` helper，覆盖双向 + 自带 0/100 cap。玩家路径 13888 行 v149fix 已正确，本轮补 AI 路径 8027-8028。 |
| **P18** | CD 双向 | AI 主动称臣（14515）只写 `_diploCD_${fid}_${other}` 单向 CD，宗主下旬可立即反向发起外交动作。补反向 `_diploCD_${other}_${fid} = 10`，与停战 CD（14001-14002 双向）保持一致。**注**：`acceptVassalOffer` / `diploRequestVassal` / `diploSubmitVassal` 三处称臣路径根本不设 CD（仅靠 `_diploActed` 当旬约束），属"无 CD"另一类问题，不在 P18 范畴，未修。 |
| **P29** | 纯函数返回值丢弃 | `_aggregateGentry(city)` 是纯函数（15650-15653 只 return 不 mutate）。`executeMigration`（玩家路径 6633/6640）和 AI 迁民路径（6871/6872）原写法 `_aggregateGentry(src);` 丢弃返回值，导致迁民后 src/dst 的 `city.gentry` 1 旬内仍为迁前值（直到下旬流转再次聚合）。改为 `src.gentry = _aggregateGentry(src);`，与其他 5 处调用点（5878/15680/15696/15849/34115）一致。 |
| **P49** | 归属性防御 | `setPrefect` / `setStrategist` 入口加 `_genInFac` 守卫。结合 P27（事件 ctx 跨旬不验证 genName）：当事件 ctx 持有死/叛逃武将名时，原代码会把不属于本势力的武将设为太守/军师并加忠诚（甚至给死人加忠诚）。`_execSetPrefect`（37189）已有 `_genInFac` 检查；这两处入口对齐相同惯例。 |
| **P50** | modal 残留 | `backToTitle` 原仅清 `_envoyModal`。新游戏可能叠加旧游戏弹窗。基于 grep 实地核对，分两组清理：<br>**静态 DOM**（display:none）：`battleModal / genericModal / courtModal / battleConfirmModal / recruitModal / eventModal / aiKeyModal`<br>**动态创建**（remove()）：`ceremonyModal / postModal / prisonerModal / siegeArrivalModal / _envoyModal`<br>**注**：`G._pendingEvent` 是对象状态字段不是 DOM id，事件实际渲染在 `eventModal`（10943 行 `display='flex'`）；冷审报告把它当 modal id 是误解。`aiKeyModal` 用 hide 而非 remove（保留用户输入历史）。 |

### 校验

- `node --check`（提取 `<script>` 块）：✅ 语法通过
- 5 个 `★ v179fix P{16,18,29,49,50}` 标记 grep 全部命中（共 9 处注释行，因 P29 / P49 各占两处）
- 单元一致性：P16 与 13888（玩家挖角）对齐；P29 与其他 5 处 `_aggregateGentry` 调用对齐；P49 与 `_execSetPrefect` 防御对齐

### 文件变化

| 文件 | v179（上轮 12 修后） | v179（本轮 5 修后） |
|---|---|---|
| project_romance | 39416 | **39430** (+14 行) |

净 +14 行：P16 净 -2（删 2 行 + 加 1 行）+ P18 +2 + P29 +6（4 行函数体改写 + 注释）+ P49 +4（两处加防御 +2 注释）+ P50 +6（清理块替代单行）。

### v179 冷审整体进度（两轮合并）

- ✅ 已修：12 + 5 = **17 项**（P0/P1 全部出清，P2 5 项出清）
- ⏳ 未修需设计决策：P6（部曲战损 0.35x 是否意图）、P22（隐匿户口阈值）、P27（事件 ctx 跨旬验证 schema）、P37 副作用扩展
- ⏳ 未修需重构：P23（朝议 pending 序列化）、P24（Claude AI 战略记忆序列化）
- 🟡 P3 28 项剩余：多数是冷审自己证伪（P34/P35/P36/P43/P46/P47/P48），低优先级

### 下轮入口指引

新对话开始后：
1. 读本文件、`三国苍生问策_v1_6_7_代码冷审报告.md`、`project_romance_v179.html`
2. **讨论决定**：P6（部曲战损 0.35×）/ P22（隐匿户口阈值 0.30 vs 1.30）/ P27（事件 ctx 验证 schema）的设计意图
3. **排期**：P23 朝议序列化、P24 Claude AI 战略记忆（各为单独中型重构）
4. **可选**：P3 类剩余结构性问题逐项过一轮，多数确认无影响后归档

---

## 二〇二、v179 冷审修复（再续）— P30 / P31 / P39 数值/数据三项

> **背景**：上一轮（二〇一）出清 P0/P1 + P2 五项后，本轮顺手过 P3 中"数值/数据错"类的小问题。
> **范围**：严格只修报告点名的，不顺手扩。

### 已修 — 3 个

| ID | 类型 | 改动 |
|---|---|---|
| **P30** | 索引越界保护 | `BLDS.tradepost.levels` 是 3 级。两处吃到 `b.tradepost` 等级直接索引硬编码数组：6458 行 `[0,0.15,0.25,0.35][_tpLv]`（生产加成）和 15087 行 `[0,0.10,0.15,0.20][maxTpLv]`（通商收入加成）。将来扩到 lv4 即 NaN。改成抽出常量 + `Math.min(_tpLv, tbl.length-1)` cap 索引。**注**：另有 `FARM_FLAT[farmLv]` / `MKT_FLAT[mktLv]` / `[0,1.2,1.4,1.6][irrLv]` 等同类硬编码索引未点名，按"严格按报告"原则未顺手扩。 |
| **P31** | 死键清理 | `CLAN_FAMILIES` 中 `rn_yuan`(汝南袁氏)、`wj_zhang`(吴郡张氏) 两个 key 自 v170 删除相关引用后无任何代码使用，全 grep 仅常量定义自身一处。直接从对象字面量删除两个键。 |
| **P39** | 洗牌均匀性 | `sort(() => Math.random() - 0.5)` 是非均匀洗牌（V8 引擎下结果偏向初始顺序）。代码 4 处真用洗牌：朝议武/文 tier2 提案者池（5779/5780）、在野武将池（7737）、武将配对（9979）。新增 `_shuffleFY` Fisher-Yates helper（in-place + return），4 处调用全部替换。**未涉及** jitter 用法（`(Math.random()-0.5)*scale`），那是值域映射不是洗牌。 |

### 校验

- `node --check`：✅
- `v179fix` 标记总数：40（前两轮 17 处加本轮新增，含跨注释引用）
- 非均匀洗牌全 grep 残留：0（唯一命中是 P39 helper 自身的注释）
- `wj_zhang/rn_yuan` 全 grep 残留：仅 1 处 P31 注释自身

### 文件变化

| 文件 | 上轮（5 修后） | 本轮（3 修后） |
|---|---|---|
| project_romance | 39430 | **39444** (+14 行) |

净 +14 行：P30 +6（两处各 +3）+ P31 +1（删 1 行 + 加 1 注释行）+ P39 +9（helper 10 行 - 4 处单行替换-1 行 ≈ +9）。

### v179 冷审最终进度（三轮合并）

- ✅ **已修：12 + 5 + 3 = 20 项**
  - P0 全清（7）
  - P1 全清（5；P28 误判无需修）
  - P2 五项清（P16 / P17 / P18 / P29 / P49）+ P50（P2 标级低但实际是质量）
  - P3 三项清（P30 / P31 / P39）
- 🟢 **设计意图归档（不修）**：
  - P6（部曲战损 0.35× — 作者确认有意保护）
  - P22（隐匿户口阈值 0.30 — 作者确认是"防止枯竭县继续抽血"的保险条件，不是漏写 1）
  - P34/P35/P36/P43/P44/P46/P47/P48（冷审自己证伪的"无影响"项）
- 🟡 **优先级降低，下个版本前再考虑**：
  - P3、P11（缓存白名单）
  - P15a/b（弹窗调度统一）
  - P25（Claude action 不可变化）
  - P26（courtModal ESC/cancel）
  - P33（addStatExp cap 后 exp 不消费）
  - P40（_ffTurns 等模块级状态轻微泄漏）
  - P42（surrenderGen dead code）
  - P45（部队详情面板 ATK/DEF 不传 terrain）
- ⚠️ **接受现状/低优先**：
  - P23（朝议 pending 不进存档）— 用户体验上玩家很少在朝议未确认时存档
  - P24（Claude AI 战略记忆不进存档）— 实际影响是 AI 失忆 1-3 旬就恢复，非灾难
  - P27（事件 ctx 跨旬不验证）— 影响面比冷审估计小，下轮单独做最小防御层

### 整体小结

v179 冷审作为"独立新对话深度逐行审读"产出 51 个发现，最终：
- 真正修复 20 项
- 设计意图确认归档 ~10 项
- 冷审自我证伪 ~7 项
- 剩余 ~14 项均为低优先质量问题

主线游戏机制层面 — **无已知 major 问题**。剩余皆为代码质量、性能轻微泄漏、或不影响主流玩法的边界条件。

### 下轮入口指引

新对话开始后：
1. 读本文件、`三国苍生问策_v1_6_7_代码冷审报告.md`、`project_romance_v179.html`
2. **可选**：P27 事件 ctx 校验（最小防御层 — 在 `_popEventQueue` 加通用 ctx 存在性校验，约 15-20 行）
3. **可选**：P3 剩余质量问题集中扫一轮归档
4. **新功能开发**：v179 冷审已收尾，可以进入新机制设计

---

## 二〇三、版本升级 v179 → v180

> **背景**：v179 冷审三轮（共 20 项修复）全部出清，主线无 major bug。文件名升 v180 以标记冷审收尾、进入新功能开发阶段。
> **本次升级仅文件名变更，无代码变化**。所有 `★ v179fix Pxx` 标签在文件内保留作为版本编年史。

### 文件指针（最新）

| 项目 | 值 |
|---|---|
| 主文件 | **`project_romance_v180.html`** |
| 行数 | 39444 |
| HANDOVER | **`HANDOVER_v180.md`**（本文件） |
| CODE_MAP | **`CODE_MAP_v180.md`** |
| 上一稳定版本 | v179 冷审三轮修复完成版（v179fix 含 P30/P31/P39 后） |

### v180 与 v179 关系

- v180 = v179 第三轮冷审修复（P30/P31/P39）完成态 + 文件名重命名
- 代码内容**完全等同**于二〇二章节末尾的产物
- 所有 `★ v179fix` 标签保留（修复历史，不改）

### v179 三轮冷审整体回顾

**第一轮（章节 二〇〇）：12 项**  
P0/P1 全清 + P15c/P17 重构 + P37/P41 边界

**第二轮（章节 二〇一）：5 项**  
P16/P18/P29/P49/P50 — 双向键一致性 / 归属性防御 / modal 残留

**第三轮（章节 二〇二）：3 项**  
P30/P31/P39 — 索引越界保护 / dead key 清理 / 均匀洗牌

**总修复：20 项**（P0:7 + P1:5 + P2:5 + P3:3）  
**净行数变化**：v179 原始 39407 → v180 最终 39444（+37 行）

### 设计意图归档（不修，记录备查）

- **P6** 部曲战损 0.35× — 作者意图保护部曲机制
- **P22** 隐匿户口阈值 `* 0.30` — 是"防止枯竭县继续抽血"的保险条件，非漏写 1
- **P24** Claude AI 战略记忆不进存档 — 实际影响是 AI 失忆 1-3 旬就恢复，非灾难
- **P23** 朝议 pending 不进存档 — 玩家很少在朝议未确认时存档，非高频问题

### v180 起点：可选下一步

1. **新功能设计** — 冷审收尾，可以进入新机制开发（按规则：新功能前先讨论设计 → approve → 实装）
2. **可选清扫**：P27 事件 ctx 跨旬校验最小防御层（约 15-20 行单文件改动）
3. **可选清扫**：P3 剩余 ~14 项质量问题集中过一轮归档（dead code/缓存白名单/命名规范等）

---

## 二〇四、v181 官职 tier1 锁死按 stage（v172 老债清理）

> **背景**：v172 引入 stage（warlord/regional/regime）后，官职体系仍按城市数定 tier1 名额，导致军阀只要占 10 城就能任大将军——历史不还原、玩法无 stage 引导。本轮把官职 tier1 解耦到 stage 维度，并用 stage 卡住 label 上下限。
> **设计原则**：保持两套系统语义独立——POST_TIERS 管"行政容量"，stage 管"政治合法性"。

### 设计规则

**Label 矩阵**（stage 卡上下限）：

| Stage | label 上限 | label 下限 |
|---|---|---|
| warlord | 诸侯 | 诸侯 |
| regional | 公 | 侯 |
| regime | 王 | 侯 |

**Slots 矩阵**（tier1 完全由 stage 决定）：

| Stage | tier1 武 | tier1 文 |
|---|---|---|
| warlord | 0 | 0 |
| regional | 0 | 0 |
| regime | 1 | 1 |

**tier3/tier2 名额**：仍按 POST_TIERS 城市数表（受 stage label cap 间接影响）。

**完整对照表**：

| Stage | 城市数 | label | t3 武/文 | t2 武/文 | t1 武/文 |
|---|---|---|---|---|---|
| warlord | 1-15+ | 诸侯 | 2 | 1 | 0 |
| regional | 1-5 | 侯 | 3 | 2 | 0 |
| regional | 6-9 | 公 | 5 | 3 | 0 |
| regional | ≥10 | 公（卡） | 5 | 3 | 0 |
| regime | 1-5 | 侯 | 3 | 2 | 1 |
| regime | 6-9 | 公 | 5 | 3 | 1 |
| regime | ≥10 | 王 | 6 | 4 | 1 |

### 代码改动

| 位置 | 改动 |
|---|---|
| `POST_TIERS` (4951) | 删除 tier1 列：`mil:[6,4,1]` → `mil:[6,4]`（4 行） |
| `STAGE_TIER1_SLOTS` 新增 | warlord/regional={0,0}，regime={1,1} |
| `STAGE_LABEL_CAP` 新增 | warlord:'诸侯' / regional:'公' / regime:'王' |
| `STAGE_LABEL_FLOOR` 新增 | warlord:'诸侯' / regional:'侯' / regime:'侯' |
| `getFacPostTier` (5050) | 加 stage cap+floor 钳制：`finalIdx = max(capIdx, min(floorIdx, cityIdx))` |
| `getPostSlots` (5067) | 融合：tier3/tier2 来自 POST_TIERS，tier1 来自 STAGE_TIER1_SLOTS |
| `_execAppointPost` (37323) | 不再直读 POST_TIERS，改走 getPostSlots（继承 stage cap） |
| `renderTrack` (18347) | tier1=0 时显示"未解锁·需达成「政权」阶段"（替代隐藏整行） |
| 档位进度条 (18416) | 拆为「势力规模」+「政权阶段」双行；提示 stage cap 状态 |

### 兼容性验证

- **5 处 `getPostSlots` 调用点**：接口形状不变（仍 3 元数组），全兼容（checkPostDowngrade / 朝议封官 / 寒门批量任 / renderPostTab / _buildCourtVacancies）
- **朝议提案者选择 (5805)**：直接读 `G.genPost` 反查在职官员，与 POST_TIERS/slots 无关，零影响
- **AI `aiDoAppointments` (7494)**：通过 `getPostSlots` 自动拿到 stage cap 后的 slots，warlord 时 tier1=0 自然不会任命
- **开局 INIT_POSTS (6283)**：三国都是 regime → tier1 名额 1 武 1 文，预填的大将军/丞相完全合规
- **南蛮 stage=warlord**：开局没预填 tier1，且 stage 锁死任 tier1，完全合理

### 玩家可见变化

1. **任命面板顶部**："势力规模 · X 城" 与 "政权阶段 · 一品官 已/未解锁" 双行显示
2. **军阀玩家** ≥10 城时：UI 提示"城数已达王级，受【军阀】阶段限制"
3. **任命面板 tier1 行**：未解锁时显示虚线占位 + "需达成「政权」阶段"
4. **下一档进度条**：若下一档被 stage 卡，提示"需先达成更高阶段"

### 校验

- `node --check`：✅
- 无 POST_TIERS `.mil[2]/.civ[2]` 残留访问
- 8 处 `v181` 标记
- 12 个组合 case 手算验证全部对齐设计表

### 文件变化

| 文件 | v180 | v181 |
|---|---|---|
| project_romance | 39444 | **39518** (+74 行) |

### v181 起点：可选下一步

1. **#5 附庸纳贡比例差异化**（v172 老债 #2，配套 #4 的 stage 引导）
2. **新功能开发**：v172 老债清完一半，可暂停老债/进新机制
3. **可选清扫**：P27 事件 ctx 跨旬校验 / P3 剩余质量问题

---

## 二〇五、v181 附庸纳贡比例差异化（v172 老债 #5 清理）

> **背景**：v172 设计 stage 后，附庸纳贡比例固定 18%/12%，所有阶段一样。导致军阀收编附庸毫无叙事感（"我都是个军头怎么还有制度抽税"）。本轮按宗主 stage 差异化。
> **设计原则**：附庸纳贡反映"宗主的制度化程度"——只有政权才能完整制度抽税，军阀只能名义臣属。

### 设计规则

| 宗主 stage | 金率 | 粮率 | 叙事 |
|---|---|---|---|
| **warlord**（军阀） | 0% | 0% | 仅名义臣属（军阀无完整税制） |
| **regional**（一方之主） | 10% | 8% | 中等抽取（地方割据，制度不完整） |
| **regime**（政权） | 18% | 12% | 完整制度抽税（与现状一致） |

**附庸自身 stage 不影响**——既已称臣，自身合法性不再算数（一个 regime 称臣给 warlord 也是 0/0）。

**好感维系（B 方案）**：即使 0 纳贡（军阀宗主），附庸→宗主仍 +0.2/旬关系维系（原代码是 `if(tributeGold > 0)` 才加，新规则下移除条件）。理由：附庸关系本身就是政治维系，与是否真收钱无关。

### 代码改动

| 位置 | 改动 |
|---|---|
| `TRIBUTE_RATES` 新增（5078） | warlord:{0,0}, regional:{0.10,0.08}, regime:{0.18,0.12} |
| `getTributeRates(suzerainFid)` 新增（5084） | 返回宗主 stage 对应的比例 |
| `processFacEconomy` 纳贡块（7170） | 用 `_tr.gold/_tr.food` 替代写死的 0.18/0.12；`addDiplo` 移出 `if` |
| 称臣弹窗文案（16689） | 动态显示"金X%·粮Y%/旬"或"仅名义·无纳贡" |
| 地图 tooltip 文案（20035） | 同上动态化 |

### 兼容性验证

- **`fac._tributePaid` UI 显示**：原代码就是 `if(tributeFac > 0)` 才显示这一行（21086），新规则下 0 时自动隐藏 ✅
- **`tributeGold === 0` 时 `actualTribute === 0`**：fac.res.gold 不变，`G.factions[suzerainFid].res.gold += 0` ✅
- **粮食零扣**：`tributeFood === 0` → forEach 立刻 early return（remaining=0）✅
- **`addDiplo` 双向写**：v179fix P16 后双向 cap 已正确，0 纳贡仍 +0.2 安全 ✅
- **称臣中途宗主升 stage**：纳贡比例自动跟随（每旬重算）✅

### 玩家可见变化

1. **军阀玩家收附庸**：附庸不再扣金粮，但仍 +0.2 好感/旬（"名义盟友"）
2. **一方之主玩家**：附庸金 10%、粮 8%（中等收益）
3. **政权玩家**：与之前一致（金 18%、粮 12%）
4. **称臣弹窗**：明确告知"将以何种比例纳贡"，避免玩家盲选
5. **地图 tooltip**：纳贡比例随宗主 stage 实时更新

### 校验

- `node --check`：✅
- 写死的 18%/12% 全 grep 残留：0
- 4 处 `v181 #5` 标记
- 9 个 stage × scenario 组合手算验证全部对齐设计表

### 文件变化

| 文件 | v181（#4 后） | v181（#4+#5 后） |
|---|---|---|
| project_romance | 39518 | **39545** (+27 行) |

### v181 累计

v180 → v181：+101 行（39444 → 39545）
- #4 官职 tier1 锁死按 stage：+74 行
- #5 附庸纳贡比例差异化：+27 行

### v172 老债清理总结

| 老债 | 状态 |
|---|---|
| #4 官职 tier1 锁死 | ✅ v181 |
| #5 附庸纳贡比例差异化 | ✅ v181 |
| #6 朝议周期按 stage 差异化 | 待朝议主体先稳定 |
| #7 演进降级（流亡/失国） | 待讨论是否需要 |

8 版本欠的两条债清完。剩余 #6/#7 看后续节奏。

---

## 二〇六、v181 测试与 BUG A/B 修复

> **背景**：完成 #4 + #5 后做端到端测试，发现 UI 进度条 2 个 bug。修复并通过 44 项回归测试。

### 测试方法

抽取改动函数到 Node 测试 7 组共 44 项 case：
1. getFacPostTier label cap+floor（18 case，全 stage × 全城市数）
2. getPostSlots tier1 名额（6 case）
3. getPostSlots tier2/tier3 跟 label 走（4 case）
4. 纳贡比例三档（3 case）
5. 异常 stage 兜底（3 case：undefined / unknown_stage）
6. 纳贡扣款数学（6 case 含零基数 / 极小基数边界）
7. v149fix actualTribute 不超存量（4 case 含负数异常态）

### 已修 BUG

| ID | 描述 | 修复 |
|---|---|---|
| **BUG A** | warlord 1 城时 UI 显示"下一档：侯（还差 2 城）"，但 stage cap 让升级永远不生效 | 进度条条件加 `!nextBlockedByStage`：下一档被 stage 锁死时整段不渲染 |
| **BUG B** | regional/regime 在 floor 提升的低城数（如 1-2 城）时，UI 显示"城数已达诸侯级，受【一方之主】阶段限制"——floor 是有利提升不该按"限制"描述 | 拆 `stageBlocked` 为 `stageCapped`（城市数高过 cap）和 `stageFloored`（城市数低于 floor）；只有 stageCapped 时显示限制提示 |

### 验证 UI 输出（关键 case）

| Stage | 城 | label | 显示限制提示 | 显示下一档进度 |
|---|---|---|---|---|
| warlord | 1 | 诸侯 | 否 | **否（修后）** |
| warlord | 10 | 诸侯 | 是（cap） | 否 |
| regional | 1 | 侯（floor） | **否（修后）** | 是（→公） |
| regional | 5 | 侯 | 否 | 是（→公） |
| regional | 6 | 公 | 否 | 否（下一档王被 cap） |
| regional | 10 | 公 | 是（cap） | 否 |
| regime | 1 | 侯（floor） | 否 | 是（→公） |
| regime | 9 | 公 | 否 | 是（→王） |
| regime | 10 | 王 | 否 | 否（已最高） |

### 已知设计副作用（不修）

**v180 → v181 存档兼容性**：v180 时 warlord 占 10 城可任 11 武 + 11 文；v181 后 warlord 仅可任 3 武 + 3 文。加载老存档第一旬 `checkPostDowngrade` 会触发批量裁官（每个 -3 忠诚 + 派系冲击 + 价值观冲击）。

**评估**：是 v181 设计变更的合理后果，不是 bug。`dismissGenPost(silent=false)` 行为是 v144 起就有的，v181 后只是触发概率提升。**当前不修**——按制作人决定。

### 文件变化

| 阶段 | 行数 |
|---|---|
| v181 #4 后 | 39518 |
| v181 #5 后 | 39545 |
| **v181 BUG A/B 修复后** | **39549** (+4 行) |

### v181 最终交付

| 项目 | 值 |
|---|---|
| 主文件 | `project_romance_v181.html` |
| 行数 | 39549 |
| HANDOVER | `HANDOVER_v181.md` |
| CODE_MAP | `CODE_MAP_v181.md` |

### 试玩前建议

1. **新游戏开局**：三国剧本三国 stage=regime，新规则下与 v180 体感无差，可直接试三国对战
2. **测重点 #4**：观察任命 Tab — 三国应能任 1 武 1 文一品官（大将军/丞相）；如玩家失城到 9 城以下时观察"势力规模"label 变化
3. **测重点 #5**：让 AI 之间产生附庸关系，观察金粮流动；切换玩家势力到不同 stage 后观察纳贡比例变化
4. **试 floor 与 cap 边界**：如果用 debug 给玩家造大量城但锁定 stage=warlord，观察 UI 是否正确显示"受军阀阶段限制"（无误导提示）
5. **回避坑**：暂不要载入 v180 存档玩 v181（裁官会触发忠诚下滑）

### 试玩反馈关注点

- 一品官未解锁的 UI 提示是否清晰
- 阶段条 + 势力规模条的双行布局是否拥挤
- 军阀宗主"仅名义·无纳贡"的反馈是否合理（玩家是否觉得"收附庸啥也没收到"违和）
- regional 中等纳贡（10%/8%）是否平衡（vs 政权 18%/12%）

---

## 二〇六、v181 #4 内部测试 + BUG A/B 修复

> **背景**：v181 #4/#5 实装后做端到端测试（44 项），发现 2 个 UI 误导 bug，本节补修。
> **测试方式**：抽取 helper 在 Node 跑边界 case + 集成层面静态扫描。

### 测试结果

44/44 核心逻辑测试全过：
- getFacPostTier label cap+floor 全 18 case ✅
- getPostSlots tier1 名额全 case ✅
- getPostSlots tier2/tier3 跟 label（不跟原始城市数）✅
- 纳贡比例三档 ✅
- 异常 stage 兜底（undefined/unknown）✅
- 纳贡数学（含 0 基数、极小基数）✅
- v149fix actualTribute 不超存量保护 ✅

### 修复的 2 个 bug（v181 #4 引入）

| Bug | 现象 | 修法 |
|---|---|---|
| **A** | warlord 1 城显示"下一档：侯，还差 2 城"，但实际永远到不了（被 stage cap 锁死） | 进度条渲染条件加 `!nextBlockedByStage` — 下一档 label 高于 stage cap 时整个进度条不渲染 |
| **B** | regional 1 城（floor 提升）显示"城数已达诸侯级，受【一方之主】阶段限制"——floor 是有利的，不该用受限语气 | 把 stageBlocked 拆成 stageCapped（限制性，显示警告）和 floor 情形（不显示警告，正常进度路径）|

### 已知设计副作用（不修，玩家承担）

**C**：v180 存档加载到 v181 后，warlord/regional 玩家的高级官员被 `checkPostDowngrade` 批量裁掉，每个吃 -3 忠诚 + 派系冲击。**这是 v144 起就存在的 silent=false 行为**，v181 只是触发概率激增。**用户决定不修**——玩家承担规则变更后果。

### 代码改动

| 位置 | 改动 |
|---|---|
| 18466-18470（curIdx/stageCapped）| 拆 stageBlocked → stageCapped；删除未用的 stageFloored |
| 18485（限制提示）| 条件改为 `stageCapped`（floor 情形不再误显示） |
| 18489-18491（进度条 if）| 加 `!nextBlockedByStage` — 下一档被 stage cap 时不渲染 |
| 18491（need 计算）| `Math.max(0, ...)` 兜底（虽然进度条已不渲染，但保险） |

### 玩家可见变化

1. **warlord 任意城市数**：不显示"下一档"进度条（因为城市数升级永远不会让 label 升过诸侯，需先升 stage）
2. **regional 1 城**：不再有"受【一方之主】限制"误导提示；正常显示"下一档：公"进度
3. **regional 6+ 城**：仍不显示进度条（下一档"王"被 cap 锁死，避免误导）

### 校验

- `node --check`：✅
- 44/44 主流程测试通过
- stageFloored 死变量已清理
- 16 处 v181 标记
- 3 处 v181 fix BUG 注释

### 文件变化

| 文件 | v181（#4+#5 后） | v181（BUG A/B 修复后） |
|---|---|---|
| project_romance | 39545 | **39547** (+2 行) |

### v181 最终状态

| 项目 | 状态 |
|---|---|
| #4 官职 tier1 锁死按 stage | ✅ 完成（含 BUG A/B 修） |
| #5 附庸纳贡比例差异化 | ✅ 完成 |
| 内部测试 | ✅ 44/44 通过 |
| 主线机制 major bug | 无 |
| 待发现的 bug | 玩家试玩反馈（下个对话） |

### 下个对话试玩交接

**给试玩对话的指引**：

1. **加载文件**：`project_romance_v181.html`（最新）
2. **试玩重点**（验 v181 改动）：
   - 选军阀剧本（如吕布/董卓势力开局），观察任命面板：
     * 是否显示"势力规模 诸侯（X 城）"
     * 是否显示"政权阶段 军阀 · 一品官未解锁"
     * 任命武官 / 文官时，是否看不到"大将军 / 丞相"选项（应该被锁）
     * tier1 行是否显示"未解锁 · 需达成「政权」阶段"虚线占位
   - 如果军阀玩家收一个附庸，观察经济面板：
     * 附庸下方应**不**显示"附庸纳贡 -X/旬"行（0 抽税自动隐藏）
     * 但附庸→宗主关系仍每旬 +0.2（看外交面板）
   - 选孙吴 regime 剧本：开局应直接显示"王（10+城）"+ 一品官已解锁 + 大将军周瑜/丞相张昭已任
3. **上报 bug 路径**：发现奇怪行为/UI 错误/数值异常 → 描述 + 截图（可选）→ 回到主开发对话整理

### 给主开发对话的提醒

试玩对话回报后：
- 优先级 1：v181 引入的回归 bug（任命/纳贡/UI 误导）
- 优先级 2：跨 v179-v181 累积的非冷审 bug
- 暂不开新功能（先稳定 v181）


---

## 二〇七、v181 经济链 audit（pass 1）

> **状态**：Step 1 反向 grep + Step 2 节点图初版 + 制作人 audit pass 1 完成。Step 3（逐节点 verified/discrepancy 标定）未开始。
> **范围**：只 audit 经济链；不动游戏代码；不动豪族链 v4 数据；HANDOVER 不重写，本节追加。

### 产出文件

- `economy_chain_v4.json` v4.1 — 44 节点 / 64 边 / 16 跨链引用
- `Project_Romance_Concept_Map_v4_economy.html` — 嵌入 v4.1 JSON 的概念图（点经济链 tab）
- `economy_chain_walkthrough.md` — 配套白话文档
- `economy_chain_grep_findings_v181.md` — Step 1 反向 grep 报告

### 分区方案

5 区变体 + 派生函数层（与豪族链 5 区不同）：
- A 输入因子（8 节点）
- B 城级状态（8 节点）
- C 派生函数（11 节点，含 v4.1 新增 C11）
- D 势力级资源池（6 节点）
- E 外部输入与跨链接口（11 节点）

### v2 文档预判偏差（V2-7 G1 4 大 tick）

v2 文档列经济链主 tick 为 4 个（processCityFood / processMorale / processPop / processFacEconomy），但实际**主旬循环里有 7 个 process tick**：
1. processCityFood
2. processMorale
3. processPop
4. processFacEconomy
5. processBuildQueues（队列推进，不算产出公式 → 不单立节点）
6. **processUnitFood**（v4.1 新增 C11）— 野战部队就近从城里扣粮
7. **processUnitSalary**（v4.0 已加 C8）— 势力级扣军饷

修复：节点图已补齐。HANDOVER 不重写 V2-7，本节说明即可。

### 已识别 discrepancy 候选（共 4 个）

**D-001 · LOW · C2 getCityFoodCost 注释陈旧**
注释说"马匹消耗按势力平摊"，函数体只算 civil + garrison。**马匹粮耗确实没实现**——v4.1 修正：野战部队粮耗（含骑兵）实际在 C11 processUnitFood 里就近扣城 storage。修复建议：删 C2 注释里那句陈旧文字。

**D-002 · DEFER · v2 文档漏列 2 个 tick**
HANDOVER 不重写，本节修正；节点图已补齐。

**D-003 · LOW · C3 与 processCityFood 双叠 buff**
getCityFoodNet 和 processCityFood 都叠 _postBuffs.foodProd 和蒋琬 1.05。**已对齐**（v150fix C1）。代码冗余但无功能 bug。修复建议：未来重构可抽 helper。

**D-004 · MEDIUM · 9 处 getGentryRecruitMult 调用语义需验证**
12893 / 13008 / 13229 / 31017 / 31351 / 33462 / 33562 / 33715 / 33838 — 5 处主征兵 + 4 处其他路径。**Step 3 时逐处核**——是否都该乘豪族系数？初步看法：都该乘合理（豪族态度差就该让征兵贵），但具体上下文要确认。

### 经济链 vs 豪族链 bug 严重度

经济链审完一轮**比豪族链干净**：4 个 discrepancy 候选无 HIGH/CRITICAL 级。原因：
1. 经济链单层架构（城级 / 势力级清晰分离），无"上层聚合下层覆盖"风险
2. 经济链迭代更久（v88 / v108 / v113 / v115 / v124 / v132 / v149-v167），关键 bug 早修

对照豪族链已记录但**本轮不修**的 bug（仍在 v181 代码里）：
- 豪族链 D11 屠城 / 劫掠 / 安民写 city.gentry 被覆盖
- 豪族链 D12 组 1（4 个 C 类事件同病）
- 豪族链 D12 组 2（暴动事件链真设计漏洞）

留待豪族链下一轮 audit 处理。**经济链不引入新的 city.gentry 写入**（只读，三条入边 E1/E2/E3 都是被动消费）。

### audit pass 1 制作人发现的修订

- A7 派系民意联动**删除**（与 E6 冗余，同 getAvgFactionMod 调用画了两次）；A8/A9 上移为 A7/A8
- B3 改名："兵源质量" → "人口质量"
- C11 **新增**：processUnitFood（v4.0 漏审的第 6 个 tick）
- E6 desc/plain 重写：明确"派系倾斜"设计意图——不是简单的"大派系奖励"，而是迫使玩家做 1-2 派重点扶持的选择
- B7 desc 提及 processBuildQueues（第 7 个 tick 但纯队列推进，不单立节点）

### Step 3 待办（未开始）

- 逐节点 audit.status='pending' → 'verified' / 'discrepancy'
- 重点深审：D-004（9 处 getGentryRecruitMult）；C11 边界 case（部队孤立 / 最近城被攻陷 / 亡国势力）
- 验证 9 个节点级模糊点（A8 仁厚之外的 temperament / B5 garrison 不算军费 / C7 vs C8 数值差 / D6 纳贡集中 / E7 11 effectKey 完整性 / E8 玩家事件 / 等）

### 给下个对话的指引

如果**继续经济链 audit**：
1. 加载 `Project_Romance_Concept_Map_v4_economy.html` + `economy_chain_walkthrough.md`
2. 进 Step 3：逐节点深审。从 D-004 开始（最高优先级）
3. **不动游戏代码**——这一阶段只画图、只标注

如果**开新链 audit**（军事/政治/外交/事件）：
1. 沿用经济链流程：Step 1 反向 grep → Step 2 节点骨架 → 制作人 audit pass 1 → Step 3 节点级 verified
2. 沿用 5 区分区 + 颗粒度 A 风格

如果**修豪族链 D11/D12**：本轮明确不做。等独立 audit 轮。


---

## 二〇八、v181 经济链 audit pass 2（Step 3 完整逐节点深审）

> **状态**：经济链 audit 全部完成。44/44 节点 verified、63/63 边 verified。  
> **触发**：制作人审完 v4.1 节点图后要求 "把豪族链 audit 完，经济链也 audit 一遍"——豪族链已完成（无新发现），经济链 Step 3 由本轮跑完。  
> **不做**：不动游戏代码，发现的 bug 都先记录待修；不重写 HANDOVER 早期章节，本节追加。

### 产出文件（v4.3 三件套）

- `economy_chain_v4.json` v4.3 — 44 节点 + 63 边全 verified，每节点带 audit.notes 记录核对过程
- `Project_Romance_Concept_Map_v4_economy.html` — 嵌入 v4.3 JSON 的概念图
- `economy_chain_walkthrough.md` — 752 行白话文档，含 §v4.3 顶部摘要 + §Step 3 完成段

### Step 3 audit 流程

按四阶段优先级跑：

1. **D-004 高优先级**：9 处 `getGentryRecruitMult` 调用语义验证 → 9 处都对，**但顺手挖到第 10 处 `_execRecruit` @ 37775 漏修正（D-006 真 bug）**
2. **C11 边界 case**：3 个边界（孤立部队 / 最近城被攻陷 / 亡国势力）全核完，无 bug。发现"流亡机制"（v119 设计）
3. **D1 散点写入扫描**：84 处 fac.res.gold 写入分类核完——经济链主轴 7、征兵 10（其中 1 处 D-006）、扎营 6、火攻 3、外交 ~20、通商 4、战利品 1、朝议 ~2、补员 1、事件 ~25、调试 ~5
4. **节点级模糊点 6 项 + 剩余 33 节点批量审**：A8 仁厚之外特质（验证 6 个 temperament 各有出口）、B5 城防军军费（修正 desc）、C7 vs C8 数值差（实扣 ≤ UI 显示）、D6 纳贡集中、E7 effectKey 完整性、E8 玩家事件——共 8 个发现，全部 LOW 文档级

### 累计 discrepancy 候选（共 14 个）

| ID | 严重度 | 内容 | 修复优先级 |
|---|---|---|---|
| D-001 | LOW | C2 注释"马匹消耗"未实现（v4.1 已记） | 改注释 |
| D-002 | DEFER | v2 文档漏列 2 个 tick（v4.1 已修） | 已修 |
| D-003 | LOW | C3/processCityFood 双叠 buff 已对齐（v150fix） | 重构时清理 |
| D-004 | dismissed | ~~9 处 getGentryRecruitMult~~ | 不是 bug |
| D-005 | LOW | 金费乘豪族 / 材料费不乘的设计意图未文档化 | 补 walkthrough |
| **D-006** | **MEDIUM** | **`_execRecruit` Claude AI 征兵金费裸价漏 6 个修正** | **代码 sprint 修** |
| D-007 | LOW | 通商签约直接 -= 写法不规范 | 改 safeSub |
| D-008 | LOW | D1 国库金无上限（设计意图）未文档化 | 补 walkthrough |
| D-009 | LOW | B5 desc 写错（"不算军费"应改"低费率军饷"） | 改 desc |
| D-010 | LOW | C7/C8 UI 显示 vs 实扣 -10% 差未文档化 | 补 walkthrough |
| D-011 | LOW | D6 "均摊"注释 vs 顺序扣实现不一致 | 改注释或代码 |
| D-012 | LOW | D6 金粮基准不同（流量 vs 存量）未文档化 | 补 walkthrough |
| D-013 | LOW | E7 漏列 3 个直接经济链 effectKey | 补 walkthrough |
| D-014 | LOW | B1 city.pop 下限分级（25k/1k/500）未在 desc 说清 | 改 desc |

**真 bug 总数：1（D-006）**。其余都是 LOW 文档/写法级。

### D-006 详细 · MEDIUM · 待代码 sprint 修

**位置**：`project_romance_v181.html` @ 37775（`_execRecruit` 函数体）

**问题**：Claude AI 高层 action 接口（v158+）征兵金费**只用基数**：
```javascript
const goldCost = Math.ceil(troops * 1200 / 5000);
```

**漏乘 6 个修正**（对比正确路径 13229 主征兵公式）：
1. `getGentryRecruitMult(cityId)` — 豪族征兵乘数（**豪族链 D4/D5 入边在 ClaudeAI 路径下断裂**）
2. `getBarracksDiscount(city)` — 兵营折扣
3. `_yibingBuff` 仪兵 buff（×0.70）
4. `1 + getTechEffect(fid, 'recruitCostMult')` — 科技
5. `TROOP_TYPES[type].costMult` — 特色兵种乘数
6. `_postBuffs.recruitCost` — 官职 buff（前/大将军）

**影响范围**：
- 仅影响 Claude AI 控制的势力（v158+ 高层 action 接口）
- 传统 AI（aiRecruitMain / aiExpandSquad / aiAddSquad）和玩家走另一套路径，正常乘修正
- **关键设计耦合断点**：豪族链 → 经济链征兵金费这条边在 ClaudeAI 路径下失效
- **评测公平性受损**：Claude AI 不受豪族态度调节、无 buff 影响

**修复路径建议**：
- 简单方案：把 37775 改成与 13229 一致
- 重构方案：抽 `calcRecruitCost(fid, cityId, type, troops)` helper 统一所有 10 处征兵金费计算

### 经济链 audit 总评

**对比豪族链**：经济链确实更干净。豪族链 v4 找到 6 个 verified 节点 + 6 个 discrepancy（D11/D12 散点写 city.gentry 被覆盖）；经济链 44 节点全 verified、只 1 个 MEDIUM 真 bug。原因：

1. **架构**：经济链单层（城级 / 势力级），无"上层聚合下层覆盖"风险
2. **迭代**：经济链 v88-v167 多版迭代，关键 bug 早修。豪族链 v161 才确立县级粒度

### Step 3 累计发现的设计巧思（非 bug，值得记录）

- **A4 太守 1 节点 4 出边**（金/民心/腐败/建造）—— 经济链最核心枢纽
- **A2 徭役 v163 节流**——仅 buildQueue 非空才扣民心质量，避免空扣
- **C11 与 processSupplyStatus 分工**——先检测断粮（22431-22492）后扣城里粮（22494-22515），孤立部队不双扣
- **C11 流亡机制**（v119）——势力丢光所有城但部队还在 → 流亡 _rations 旬再饿死、势力才淘汰
- **D6 纳贡设计**——金按本旬流入（流量），粮按存量分摊（存量），同时纳贡 +0.2 关系
- **A8 temperament 6 选 1**——仁厚（generous）专属经济链，其他 5 个分别影响人才/军事/俘虏
- **C5 腐败早返**——cityCount ≤ 3 时早返 0，不进入计算路径

### Audit 工作流的价值定位（制作人提的洞察）

经济链 audit 跑完后总结的工作流原则——这是这套 audit 文档的真实价值：

1. **本质**：设计理念 vs 代码实现的功能 by 功能深度对账
2. **三类发现**：代码 bug（设计对实现错） / 设计漏洞（实现对设计错） / 文档陈旧（实现和设计都对但注释/HANDOVER 写错）
3. **先 audit 再重构 比 反过来好**：
   - a. 重构前要知道哪些是 bug、哪些是有意为之
   - b. 重构前要看清"全图"（耦合关系）
   - c. 重构会破坏现有的"补丁层"（v149fix / v150fix / v167fix）——audit 时记下来意图
   - d. Audit 报告本身就是最好的重构需求文档

### 下个对话指引（开新链 audit）

经济链全审完，可以开下一条链：

**待审链**（按优先级建议）：
1. **军事链**——v173 战斗动画 / v174-v176 营寨/伏击/攻城/水战 / 攻城逻辑（D11 bug 起点）。代码量大、跨链触点多
2. **政治链**——派系民意 / 朝议 decree / 官职 buff（_postBuffs 缓存）
3. **外交链**——通商协定 / 礼物 / 求和 / 求盟 / 附庸关系
4. **事件链**——~30+ 事件，已知豪族链 D12 组 2 暴动事件链是真设计漏洞
5. **人物链**——武将派系（getAvgFactionMod）/ 资历 / 招募 / 挖角 / 处决

**沿用经济链流程**：
- Step 1 反向 grep（按主 tick / 派生入口 / 状态读写 / 常量 / 跨链 / 外围因子分组）
- Step 2 节点骨架（5 区分区 + 颗粒度 A 与豪族链对齐 + Q1-Q7 决策模板）
- Step 3 逐节点深审（先 D-类候选问题、再边界 case、再散点扫描、再节点级模糊点、最后批量 verified）

**继承的素材**：
- v4.3 经济链节点图作为参考（这条链跨链 11 个入边 + 6 个出边，新链审时要对接）
- 已记录的设计巧思（C11 流亡机制 / A4 枢纽 / D6 纳贡设计 等）—— 帮新链理解全貌
- discrepancy 命名规则（D-XXX）—— 沿用避免重号，下一条链从 D-015 开始

**不做的事**（再次重申 v2 §3.5）：
- ❌ 不动游戏代码（包括 D-006 修复）
- ❌ 不动豪族链 v4 / 经济链 v4.3 数据
- ❌ 不重写 HANDOVER 早期章节（每轮追加章节）



---

## 二〇九、v181 军事链 audit pass 1（Step 1 反向 grep + Step 2 节点骨架 + Step 3 6 阶段全核）

> 沿用经济链 audit pass 2 方法论（§二〇八），完成军事链全链路 audit。
> v181 代码版本不变，本次 audit 不改代码，只产 audit.status 标定与 D 类清单。

### 0. 输入素材（继承）

- 经济链 v4.3 walkthrough（44 节点）
- 豪族链 v4 audit 报告（命名同代）
- 经济链 D 类（D-001~D-014）— 军事链 D 类从 **D-015** 起编号
- 工作流 §二〇八（5 区方案 C / 颗粒度 A / 6 阶段 Step 3 / discrepancy 标定）

### 1. Step 1 反向 grep（7 组）

**第 1 组：主 tick 入口**
- `processSiegeDecay` @ 22198 / `processUnitMovement` @ 21960 / `processMobilizing` @ 22605 / `processMuster` @ 22659 / `processReinforcement` @ 30269 / `processGarrisonRecovery` @ 6992 / `processSupplyStatus` @ 22431 / `processUnitFood` @ 22494

**第 2 组：派生入口（6 类战斗 + 派发）**
- `resolveBattle` @ 24177 / `resolveSiegeBattle` @ 27776 / `resolveAmbush` @ 23587 / `resolveCampBattle` @ 23926 / `resolveNavalBattle` @ 24686 / `resolveDuel` @ 28458
- `aiInitiateBattle` @ 28152 主入口 / `_resolveBattleEngagement` @ 30038 路由壳 / `checkAmbushTriggers` @ 28312
- 玩家 4 个 confirm 弹窗（confirmBattle / confirmSiegeBattle / confirmAmbush / confirmCampBattle）

**第 3 组：状态读写**
- `unit.squads[].troops`（24+ 写入点）/ `unit.squads[].morale`（applyMorale + 内联 mutate）
- `unit.level / exp` / `unit.maxTroops` / `unit._apRemaining` / `unit.status`（6 态状态机，30+ 切换点）
- `unit.mobilizingTurns` / `unit._aiRole / _aiTarget / fac._aiPlan`（G2 战略层）
- `city.garrison`（7 写入）/ `city.siegeDecay`（6 写入）/ `retainers`（武将级亲卫，v163 RETAINER_PROTECT=0.35）

**第 4 组：常量数据表**
- `TERRAIN_AP_COST` / `TERRAIN_TROOP_MULT` @ 23313（7 类地形，含 deep_water/coastal_water/impassable=999）
- `TROOP_TYPES` @ 21642（**16 兵种 = 5 普通 + 11 精英**，原说"13 含 5 精英"已纠正）
- `TYPE_MATCH_MULT` @ 23304（5×5 矩阵）/ `TYPE_ATK / TYPE_DEF`
- `APT_MULT` @ 22734（**4 档 S/A/B/C = 1.20/1.10/1.00/0.88**，原说"5 档 SABCD"已纠正）
- `UNIT_LEVEL_MAX=20` / `UNIT_LEVEL_MULT_BASE=0.05` / `UNIT_LEVEL_EXP[]` IIFE 生成
- `AMBUSH_BASE_CHANCE` @ 23585（mountain 0.65 / forest 0.55 / hill 0.40 / plain 0.15 等）
- `FIRE_TERRAIN_MULT` @ 23510 / `FIRE_SEASON_MULT` @ 23513 / `FIRE_COST` @ 23516
- `SIEGE_AFTERMATH` @ 1277（pacify/loot/massacre 三档处置）
- `SIEGE_MAX_TURNS={small:3, medium:9, large:18}`
- `SUPPLY_RATIONS` / `NAVAL_AP=4` / `NAVAL_WATER_COST=2` / `NAVAL_BLOCKED_SKILLS` v138

**第 5 组：跨链入边**
- ← 豪族：`getGentryDefMult` / `getGentryRecruitMult` / `getGentryMoraleMod`（3 函数）
- ← 政治：`getCourtDecreeBuffs(fid).milBuildCost` + `_postBuffs.recruitCost`
- ← 外交：`isHostile` 170 处调用（v123 宣战延迟一旬生效）
- ← 科技：7 个 effectKey（atkMult / defMult / recruitCostMult / supplyRationsBonus / moraleCapBonus / aptExpMult / occupiedMult）
- ← 事件：4 处直写 city.garrison（叛乱 / 大乱 / v118fix / 攻陷）
- ← 价值观：aiMil → SIEGE_AFTERMATH 三档 / applyEthosShock(strategy, +4) / v152 全灭 16013

**第 6 组：外围因子**
- `_squadBase` @ 23379（ATK/DEF 共同基底）/ `calcUnitAP` @ 21864 / `calcUnitATK / DEF`
- `applySkills` @ 21836（4 hook：onCalcAP / onCalcATK / onCalcDEF / onGentry）
- `SKILL_REGISTRY` 29 条目（数值类）/ **战斗类 SKILL_INLINE 47 处**（原说"12 个"已纠正）
- 城市易主路径：3 条（攻陷 27916 / 大乱 8262 / 开城 15989；**谣言不直接易主**，推 siegeDecay 后走攻陷）

**第 7 组：Claude AI v158+ 高层接口（D-006 起点）**
- `_execOneAction` @ 37191 派发器
- 11 个军事 action：`_execMove` / `_execRecruit` / `_execDisband` / `_execSetCamp` / `_execSetAmbush` / `_execCancelSpecial` / `_execCancelSiege` / `_execBillet` / `_execSetReinforcePolicy` / `_execRecruitWild` / `_execPoach`

### 2. Step 2 节点骨架 v1.0（47 节点 / 94 边 / 16 跨链引用）

**节点分布**：A 区 8 / B 区 11 / C 区 16 / D 区 4 / E 区 8 = **47 节点**（比经济链 44 略多）

**Q 决策**（与制作人 approve）：
- C12 单挑系统单立（不并入 C7 野战）
- C15 部队生命周期 5 tick 聚合（无独立产出公式）
- D2 易主钩子簇聚合（15+ 钩子统一节点）
- E8 Claude AI 单立（D-006 起点）

**type 命名约定**（沿用经济链 v4.3）：
- `input` / `state` / `mech` / `out-mil` / `ext`（**初版误用 function/output/cross 已修**）

**重要修正**（用户 review 时识别）：
- A3：兵种数 13 → **16**（5 普通 + 11 精英），精英全部城市绑定 + 1.7 costMult + 10 级出厂 + max 3 队
- A8：派系民意原描述"本地武将带兵加成"模糊不准 → **派系得势/失势动态系统**（getFactionMoraleMod @ 5642，安全区 ±15 外才生效，得势 +morale 最多 +30，失势 -morale 最多 -30）
- A7：5 档 SABCD → **4 档 SABC**（值 1.20/1.10/1.00/0.88）

### 3. Step 3 6 阶段 audit pass 1 D 类汇总

**总计 23 个真实 D 类**（HIGH 6 / MEDIUM 12 / LOW 5 / 取消 2）。

#### 阶段 1：E8 + 11 个 _exec\*（8 D 类，HIGH 3）

对账玩家路径 / 传统 AI / Claude AI 三方，找 v158+ 新路径与玩家路径的耦合断点。

| ID | 严重度 | 位置 | 问题 |
|---|---|---|---|
| D-006 重申 | MEDIUM | `_execRecruit` @ 37775 | 漏 6 个征兵金费修正（已知）|
| D-015 | MEDIUM | `_execDisband` @ 37803 | 漏清亲卫（玩家解散明确"永久损失部曲"）|
| **D-016** | **HIGH** | `_execSetCamp` @ 37813 | 漏扣金 100 木 80（**免费扎营 exploit**）|
| D-017 | LOW | `_execSetAmbush` @ 37824 | 地形限制比玩家严（设计差异）|
| D-018 | MEDIUM | `_execCancelSpecial` @ 37834 | 拔营漏 1 旬整备 |
| D-019 | MEDIUM | `_execCancelSiege` @ 37843 | 漏清 siegeTarget / _siegeTurnCount |
| **D-020** | **HIGH** | `_execBillet` @ 37848 | **功能错位**——不是 billet，是"30% 部分裁军 + 改驻守"，部曲全失。**修方向(a)：修成真 billet**，提取 `_billetUnitCore(unit, cityId)` helper |
| **D-021** | **HIGH** | `_execSetReinforcePolicy` @ 37878 | **dead code**——写 `reinforcePolicy` 字段，但 processReinforcement 读的是 `policyId` |
| D-022 | MEDIUM | confirmExpand / confirmAddSquad 33467/33566/33720/33843 | **玩家路径漏官职 buff**（confirmRecruit 有但 expand/addSquad 没），4 处需补 `(1 + _postBuffs?.recruitCost || 0)` |

**verified**：`_execMove` / `_execRecruitWild` / `_execOneAction` 派发器

**取消**：D-039（误报，createUnit @ 21923 自动选 _classChoice）

#### 阶段 2：D2 易主钩子簇 3 场景对账（9 D 类，HIGH 2）

**关键修正**：原说"4 易主场景"是错的——
- 谣言（v149）只推 `siegeDecay += 0.40`，**不直接易主**
- 小乱 `_triggerMinorRebellion` 只产叛军部队，**不易主**
- 漏了 `_triggerGentryBetray` **豪族开城投降**（v113/v161）

**实际易主 3 路径**：攻陷 27916 / 大乱 8262 / 开城 15989

**攻陷路径作为最完整样板（23 钩子 verified）**——其他 2 路径对照：

| ID | 严重度 | 路径 | 漏的钩子 |
|---|---|---|---|
| D-023 | MEDIUM | 大乱 | trackCityLoss |
| D-024 | MEDIUM | 大乱 | applyGentryOnCapture |
| D-025 | LOW | 大乱 | city.siegeDecay = 0 |
| **D-026** | **HIGH** | **大乱** | **city.occupied 占领期 → 叛乱城市直接满产**（潜在 exploit）|
| D-027 | MEDIUM | 开城 | city._yibingBuff（强宣称）|
| D-028 | LOW | 开城 | applyCommonEnemyDiplo |
| D-029 | MEDIUM | 开城 | triggerFactionEvent('conquer') |
| D-030 | MEDIUM | 开城 | applyEthosShock(strategy, +4) |
| **D-031** | **HIGH** | **开城** | **`_applySiegeAftermath`** → **围城方白嫖一座城**（无处置选项零收入）|

#### 阶段 3：C13 战斗触发派发（2 D 类，全 LOW 防御性）

23 个生产 resolve\* 入口的 isHostile 前置链全核——v100 + v179fix 设计真的有效，**核心功能 verified**。

| ID | 严重度 | 类别 | 问题 |
|---|---|---|---|
| D-032 | LOW | 防御性编程缺失 | processSiegeDecay / sortieFromCity 不显式 isHostile，依赖隐式假设。当前路径全过 _applyPeaceAgreement → _clearSiegeOnPeace（v179fix），实际安全；但 hot path 应防御性加固 |
| D-033 | LOW | 逻辑混乱 | `_aiBattleProcessedThisTurn` 装两种 key 类型（unit.id vs facPair\|loc）。当前无 bug 但反模式 |

#### 阶段 4：散点扫描（5 D 类，HIGH 1）

**E2 政治 _postBuffs**：`calcPostBuffs` 11 个 key 全部有效挂载（之前 grep 用 `_postBuffs.morale` 等漏报，实际代码用 alias `pbM = ...; pbM.morale`）。**无战斗 buff key 是设计意图**（武将技能管战斗 / 官职管职务），verified-with-notes。**取消 D-034**。

**E8 _execRecruit 部队属性面**——发现 D-006 远不止漏金费，**unit 创建时也漏多个字段**：

| ID | 严重度 | 位置 | 问题 |
|---|---|---|---|
| **D-035** | **HIGH** | `_execRecruit` @ 37786 | **Claude AI 部队永远 Lv.1 出厂**（玩家是 Lv.5+，精英 Lv.10）。createUnit 默认 level:1，_execRecruit 没改写 |
| D-036 | MEDIUM | `_execRecruit` @ 37785 | 起步士气 70（玩家 80），战力差 12.5% |
| D-037 | MEDIUM | `_execRecruit` @ 37787 | 整备 3 旬（v114 改成 1 旬，_execRecruit 漏跟）|
| D-038 | MEDIUM | `_execRecruit` @ 37785 | 一次满兵跳过渐进集结（破坏游戏节奏一致性）|
| D-040 | MEDIUM | `_execRecruit` @ 37746 | 不接 billetPool（与 D-020 配合，**Claude AI 势力 billetPool 永远不动**：无入无出）|

**D-035 + D-036 + D-037 + D-040 叠加效果**：Claude AI 控制的势力征兵的部队比玩家弱 30-50% 战力 + 晚 2 旬出场 + 部曲机制完全失效。**Claude AI 在系统层面被持续削弱**，但开发者可能一直不知道。

#### 阶段 5：节点级模糊（1 D 类）

47 个战斗类 SKILL_INLINE 整体 verified（applySkills try-catch 鲁棒、29 SKILL_REGISTRY 干净、SKILL_INLINE 模式稳健）。

| ID | 严重度 | 位置 | 问题 |
|---|---|---|---|
| D-041 | MEDIUM | `xiandeng` 27826/27898 | 漏跟 v179fix P8 cap 修复（与 weifeng 同模式）。攻城前 morale ≥ 83 时，加 18 cap 到 100、restore 硬扣 18 → 永久 -1~-15 士气 |

**v179fix P8 修了 weifeng 但没扫同模式**——这是"扫雷不彻底"的清扫工作。

#### 阶段 6：批量 verified（28 节点，0 D 类）

前 5 阶段未单独深审的 28 节点全部 verified。
- A 区 5 节点（A1/A2/A5/A6/A7）+ B 区 10 节点（B1-B10）+ C 区 8 节点（C1-C6/C14/C15）+ E 区 5 节点（E3-E7）

**新发现的设计细节**（待补 walkthrough）：
- E3 isHostile：v123 **宣战延迟一旬生效**（_warDeclaredTurn）
- C1 calcUnitAP：`multAP` 字段无消费点（**预留扩展**，不算 dead code）
- A1 陆军入水 mult=0.00 配合 NAVAL_WATER_COST 兜底

### 4. 47 节点最终状态分布

| 状态 | 数量 | 节点 |
|---|---|---|
| **verified** | 41 | A1-A8, B1-B11, C1-C7, C9-C12, C14-C16, D1, D4, E1, E3-E7 |
| **verified-with-notes** | 3 | C13, D3, E2 |
| **discrepancy** | 3 | C8, D2, E8 |

3 个 discrepancy 节点承载了大部分 D 类：
- **C8 攻城战**：D-041（xiandeng cap 漏修）
- **D2 易主钩子簇**：D-023~D-031（9 个钩子缺失）
- **E8 Claude AI 路径**：D-006 + D-015~D-021 + D-035~D-040（14 个 D 类）

### 5. 共同根因分析

**22 个 D 类有同一架构问题**：

> 演化中加新路径但没复用 helper，重新写简化版——每次玩家路径加新功能（v114 集结 / v167fix 部曲 / v151 处置 / v118 钩子 / v179fix P8 cap），新路径就更脱节一次。

具体表现：
- 阶段 1：v158+ Claude AI 加 11 个 `_exec*` 但没复用玩家 helper（setCamp / disband / billet / recruit）
- 阶段 2：3 条易主路径（攻陷 / 大乱 / 开城）没共享 `_applyCityCapture` helper
- 阶段 4：`_execRecruit` 部队属性面 5 个差距（level / morale / mobilizingTurns / muster / billetPool）
- 阶段 5：v179fix P8 修了 weifeng 但漏修同模式的 xiandeng

### 6. 推荐修复策略（不在本次 audit 范围）

**统一提取 5 个共享 helper**：

```js
function _recruitCore(fid, cityId, squads, opts)        // 玩家 confirmRecruit + _execRecruit 共用
function _setCampCore(unit, fid)                         // 玩家 setCamp + _execSetCamp 共用
function _disbandCore(unit, fid, retainerPolicy)         // 玩家 disbandUnit + aiDoDisband + _execDisband 共用
function _applyCityCapture(city, newFac, scenario)       // 攻陷 / 大乱 / 开城 3 条易主路径共用
function _billetUnitCore(unit, cityId, fid)              // 玩家 _confirmBillet + _execBillet 共用
```

新增钩子只改 helper 一处，多条路径自动同步——彻底消除"演化脱节"的根因。

### 7. 跨链对账（与已 audit 链）

#### 经济链 v4.3 ✓
- C13 _execRecruit → 经济链 D1 fac.res.gold（D-006 已识别，跨链入口断点）
- C13 征兵 → 经济链 E11 popQuality 砍（玩家路径 ✓ / _execRecruit 漏一致性）
- C8 攻陷 → 经济链 D1 战利品收金（D-031 开城漏处置导致**跨链断裂**——开城对经济链零收入）
- C16 ↔ 经济链 C10 processUnitFood（共用 ✓）
- C15 → 经济链 B1 city.pop（共用 ✓）
- E6 ↔ 经济链 C11 流亡（双向耦合 ✓）

#### 豪族链 v4 ✓
- E1 城防 ← getGentryDefMult ✓
- E1 征兵金费 ← getGentryRecruitMult（D-006 在此断裂）
- E1 民心修正 ← getGentryMoraleMod ✓
- D2 易主 → applyGentryOnCapture（D-024 大乱漏调，开城 ✓）

### 8. Walkthrough 修正记录

A7 4 档已修正（在 walkthrough 文件里直接改）。其他 3 处修正待整合到 walkthrough：
- A4 战斗类 SKILL_INLINE 数：12 → **47**
- D2 易主路径：4 场景 → **3 场景**（删谣言）
- E3 isHostile：补"v123 宣战延迟一旬生效"

### 9. 三件套 v1.1 产出

- `military_chain_v1.json`（v1.1，47 节点全部 audit 状态标定）
- `Project_Romance_Concept_Map_v4_military.html`（嵌入 v1.1，tab 显示「军事链 v1.1 ✓」）
- `military_chain_walkthrough.md`（A7 修正应用，其他 3 处待整合）
- `military_audit_pass1_phase1.md` ~ `phase6.md`（6 阶段详细报告）
- `military_chain_grep_findings_v181.md`（Step 1 反向 grep 报告，531 行）

### 10. 设计巧思汇总（非 bug，值得记录）

- **C8 攻城战 1 节点 8 出边**——与 A4 武将技能并列出度最高，反映"攻城战最复杂"的设计现实
- **A5 兵种克制只乘 ATK 不乘 DEF**——避免双向放大失衡
- **C7 applyAnnihilation 确定性全歼**（cpRatio≥3.0 必定，无 roll）——v85 设计避免"应该全歼但 roll 失败"
- **C9 伏击允许 siege 状态部队被伏**——v85 设计，siege 不是免伏盾
- **C13 去重 facPair + dedupLoc 规范化**——同旬同区只一场战斗
- **C14 围城衰减无围城方立即清零**——避免 AI 反复围而不打
- **C15 5 tick 聚合无独立公式**——部队生命周期同一阶段
- **C16 流亡机制 v119**——给"绝地反击"留窗口，避免一夜亡国
- **D4 单挑败方俘获 +20%**——符合演义"被擒"叙事
- **E2 官职 buff 战斗本体 0 处挂载**——设计意图（武将技能管战斗 / 官职管职务）
- **A8 派系动态系统**——派系势力值由 8 类事件驱动，安全区 ±15 防止微小波动持续影响

### 11. 工作流的方法论沉淀（基于经济链 + 军事链两次 audit）

经济链审完后总结过工作流原则（§二〇八）。军事链 audit 又验证了几条：

1. **6 阶段 Step 3 顺序的有效性**：HIGH 优先（阶段 1-2）→ 防御性（阶段 3）→ 散点（阶段 4）→ 模糊（阶段 5）→ 批量（阶段 6）。HIGH bug 集中在前 2 阶段，后续阶段递减
2. **节点 D 类高度集中**：军事链 23 D 类中 22 个集中在 3 个 discrepancy 节点（C8 / D2 / E8）—— 不是均匀分布
3. **D 类共同根因**：经济链 / 军事链都是"演化中加新路径但没复用 helper"。代码 sprint 应该按 helper 重构而不是逐 bug 修
4. **walkthrough 描述错误率**：军事链 walkthrough 初版有 4 处描述错（兵种数 / 适性档数 / SKILL_INLINE 数 / 易主场景数）—— **Step 2 节点骨架阶段过于依赖 grep 报告的简短描述，没去 view 函数实体**。下条链改进：关键节点（特别是输入因子、跨链入边）必须 view 实体后再写 plain
5. **两个误报取消（D-034 / D-039）**：grep 模式不够精确（用了 `_postBuffs.morale` 而代码用 alias）。下条链 Step 4 散点扫描时应该多种模式交叉验证

### 12. 下条链建议

按经济链 / 豪族链 / 军事链顺序，下一条链是 **武将链**（不是政治链，制作人确认）。

**武将链范围**（8 子模块）：
1. 武将基础属性（GEN_MAP / GEN_TAGS / com/war/int/pol/cha/apt）
2. **派系系统**（GEN_TAGS combat/politics/origin/clique/state；getGenFaction；triggerFactionEvent 8 类）
3. 忠诚系统（calcLoyaltyDelta / processLoyalty / applyLoyaltyEvent / checkLoyaltyThresholds）
4. 属性成长（addStatExp / addAptExp / 适性升级 C→B→A→S）
5. 亲密度系统（getIntimacy / setIntimacy / applyDuelIntimacy / checkIntimacyThresholds）
6. 武将俘获/投降/释放/战死出口
7. 武将招募（在野 wildPool / 跳槽 poach / 三路径 _doRecruitWild）
8. 武将身份历程（genJoinTurn / genJoinSource / genOrigFac / genOrigRole / genChronicle / genMerit）

**预期范围**：
- 节点数：35-45 个
- D 类预估：8-15 个
- 跨链辐射广（经济/豪族/军事/价值观/政治都有触点）

**优先审武将链而非政治链的理由**：派系系统是已审三链的"副驾驶"（经济链 D9 / 豪族链 origin=gentry / 军事链 A8），先把派系审清楚才能完整对账。政治链相对独立，主要通过 `_postBuffs` 影响其他链（已在军事链 E2 verified 过结构）。

### 13. discrepancy 命名规则（沿用）

- 经济链：D-001~D-014
- **军事链：D-015~D-041**（取消 D-034 / D-039，实际 23 个）
- 武将链：从 **D-042** 起
- 后续链按顺序累加，避免重号

### 14. 不做的事（再次重申）

- ❌ 不动游戏代码（包括 23 个军事链 D 类）
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节（每轮追加章节）
- ❌ 不混改多个 D 类（代码 sprint 时一个 D 类对应一个 commit）

代码 sprint 时机：等所有链 audit 完成后开（按经济链 / 豪族链 / 军事链 / 武将链 / 政治链 / 外交链 / 事件链 / 价值观链顺序审完）。

### 15. 下个对话指引

新对话启动武将链 audit pass 1：

**继承的素材**：
- 军事链 v1.1 节点图作为参考（A8 派系民意 / D4 武将出口 / D-024 大乱漏 applyGentry）
- 已记录的设计巧思（C12 单挑系统 / D4 俘获 +20% 等）—— 帮新链理解全貌
- 23 个军事链 D 类 + 14 个经济链 D 类 = 37 个跨链 D 类清单（武将链审到相关边时对账）
- discrepancy 命名规则（D-XXX）—— 武将链从 D-042 开始

**沿用 6 阶段 Step 3**：
1. **D 类候选高优**：派系 8 类事件触发完整性 / 忠诚阈值检测
2. **D 类候选中优**：武将出口（俘获/投降/释放）跨链一致性
3. **边界 case**：招募三路径金费 / wildPool 操作 / 跳槽冷却
4. **散点扫描**：属性成长经验阈值 / 亲密度阈值 / 武将身份字段一致性
5. **节点级模糊**：每个子模块的 grep 模式交叉验证
6. **批量 verified**：剩余节点逐一确认

**Step 1 反向 grep 分组**（武将链建议）：
1. 主 tick：processLoyalty / checkLoyaltyThresholds / checkIntimacyThresholds / processFactionLoyalty
2. 派生入口：calcLoyaltyDelta / getGenFaction / applyLoyaltyEvent
3. 状态读写：G.gen* 20 个字段
4. 常量：GEN_TAGS / FACTION_DEF / LOYALTY_THRESHOLDS / INTIMACY_THRESHOLDS
5. 跨链：豪族 origin / 经济 招募金费 / 军事 A4 技能 hook / 价值观 ethosShock
6. 外围因子：GEN_MAP 数据 / GEN_CLASS 职业类型 / FOUNDING_CORE 创始团队
7. Claude AI v158+：_execRecruitWild / _execPoach 已 verified（阶段 1）


---

## 二一〇、v181 武将链 audit pass 1（v1.0 → v1.1，发现节点骨架不完整需补 v1.2）

### 1. 工作流（同军事链 §二〇九）

沿用 Step 1（反向 grep）→ Step 2（节点骨架 + 边）→ Step 3（6 阶段 audit）→ 概念图 → walkthrough。期间发现颗粒度漏洞，需补 v1.2 增量（详见第 9 节）。

### 2. 三件套交付

| 文件 | 状态 |
|---|---|
| `general_chain_v1.1.json` | 47 节点 / 89 边 / 28 D 类全部定性 |
| `Project_Romance_Concept_Map_v5_personnel.html` | 概念图，默认打开武将链 v1.1 |
| `general_chain_walkthrough.md` | 大白话说明（v1.1 版） |

### 3. 节点骨架（5 区方案 C，与军事链对齐）

```
A · 输入因子    8 个: A1 集团定义 FACTION_DEFS / A2 出身 / A3 政治倾向 / A4 战和 / A5 性格 / A6 标签 / A7 技能 / A8 创始团队
B · 实体状态   11 个: G.gen* 18 字段合并 11 节点 + 在野/可挖角池
C · 派生函数   16 个: 忠诚回路 4 / 派系回路 5 / 操作入口 7
D · 状态出口    4 个: 入伙簇 / 出口簇 / 任命变更簇 / 俘获 mirror（指向军事链 D4）
E · 跨链        8 个: 经济招募金费/欠饷 / 军事战果/俘获/技能hook / 豪族origin / 价值观ethosShock / Claude AI
─────────────────────
v1.1 总计 47 节点 / 89 边（与军事链 47/94 同代）
```

**Q 决策**：B 区 18 字段合并 11 节点 / C16 Claude AI 单立 / D4 武将俘获 mirror 标 verified-mirror / A7 SKILL_INLINE 仅列入口

### 4. audit pass 1 产出（28 个 D 类候选）

```
按严重度
  HIGH:   10  D-048/049/051/052/053/055/061/063/064/065
  MEDIUM: 10  D-045/047/050/057/058/059/060/066/068/072
  LOW:     8  D-042/043/046/054/056/062/067/069/070/073

按定性（已全部完成）
  fix:           19  待统一代码 sprint
  fix-partial:    2  D-058 / D-059
  fix-future:     1  D-044（历史寿数死亡，后续实装）
  no-fix:         7  D-047/050/056/060/062/069/073
  no-fix-resolved: 1  D-043（亲密度阈值复审降级）
  pending-end:    0  全部定性完毕
```

### 5. 关键 D 类（HIGH 10 个，按集中区域）

**派系 8 类事件触发完整性（3 HIGH + 1 LOW）**
- D-048 HIGH AI 主动背刺 + de facto 宣战背刺漏 triggerFactionEvent('betray')，玩家被罚 AI 不被罚（对称性 bug）
- D-049 HIGH warDeclare 严重错配——eventType 名义是宣战，实际仅在称帝时触发；真正宣战 3 路径（diploWar / AI 宣战 / de facto 宣战）全漏
- D-051 HIGH setPrefect / setStrategist 漏 applyEthosShock(power)，跨链 E7 武将→价值观覆盖漏洞
- D-046 LOW execute UI 叙事错配（"处决武将"覆盖战死/单挑/大乱），改 EVENT_LABELS.execute = '武将身死'

**核心忠诚回路（3 HIGH）**
- D-052 HIGH calcLoyaltyDelta（UI/共享） vs processLoyalty（主tick）双向 4 项缺漏：UI 缺科技 loyaltyRecovery + 刘封 -0.10；主tick 缺 proud-无官 -0.15 + 价值观匹配 mandate/military——违反 v93 一致性承诺
- D-053 HIGH applyLoyaltyEvent 定义 3 type 但 city_lost / siege_broken 是死代码；HANDOVER 设想的"欠饷/久未出战"事件钩子未通过本函数实装（欠饷在 processLoyalty 内嵌）
- D-055 HIGH 可挖角阈值 `Math.max(_poachThr, 45 - pt)` 把基础阈值 45 硬编码——对投机标签武将（基线 55）科技效果完全失效，应改为 `_poachThr - pt`

**挖角玩家/AI 不对称（3 HIGH）**
- D-063 HIGH poachGen 玩家挖角成功后漏写 G.genJoinTurn / G.genJoinSource，被挖武将无 9 旬冷却保护，可能立即下野/被回挖
- D-064 HIGH _execPoach 37423 AI 挖角费用未乘 (1 + _techPoachCost) 科技修正，AI 的 poachCostMult 完全失效
- D-065 HIGH 玩家 poachGen vs AI _aiDoPoach 公式严重不对称：玩家有 4 项 buff（陈群/黄权/captureRateBonus/poachCostMult），AI 有 2 项（投机/cunning），双方专属 buff 互不存在；违反 C16/E8 共享原则；建议抽 _calcPoachRate(genName, attackerFid) 共享函数

**出口跨链（1 HIGH）**
- D-061 HIGH AI 处决俘虏时 killGen(name, **null**)，killerName 为空导致血仇检测（23070-23077）+ 亲密度仇恨扩散（23056-23062）全部失效；处决最严重政治事件对凶手势力完全无后果

### 6. 关键设计巧思（非 bug，值得记录）

- **B 区 18 字段合并 11 节点**：避免节点爆炸（同语义簇合并：statBase+statExp+aptExp / winCount+merit / joinTurn+joinSource）
- **C1/C2 共享 calcLoyaltyDelta 设计**（v93）：UI 趋势和实际扣的数用同一函数算（虽然实际不一致 D-052）
- **9 旬入伙冷却（B8）**：刚招的人不会立即下野/被挖回，给磨合期
- **D4 武将俘获 mirror**：与军事链 D4 双向对账，跨链一致性靠 E4 边检查
- **C16 Claude AI thin wrapper 共享**：除挖角外所有 AI 人事 _exec 都是 thin wrapper 共享玩家函数，AI 决策层架构整体健康（D-065 是孤例）

### 7. 与军事链 audit pass 1 对比

| 指标 | 军事链 v1.1 | 武将链 v1.1 |
|---|---|---|
| 节点 | 47 | 47 |
| 边 | 94 | 89 |
| D 类总量 | 23 | **28**（+22%） |
| HIGH | 6 | **10**（+67%） |
| audit 阶段 | 6 | 6 |

武将链 HIGH 数量超军事链 67%，主要因为：
1. 派系 8 类事件触发完整性（v71/v73/v94/v161 多次迭代叠加，留下边角触发漏洞）
2. 核心忠诚回路 v93 一致性承诺被破坏（calcLoyaltyDelta 与 processLoyalty 双向缺漏）
3. 挖角是唯一一个不走 thin wrapper 的 AI 入口（孤例不对称）

### 8. 工作流方法论（基于经济/豪族/军事/武将四链）

补充 §二〇九.11 的方法论：

6. **节点骨架颗粒度核查必须在 Step 1 之前预审一遍**：武将链 v1.1 在 Step 3 末才发现 A1（FACTION_DEFS 16 集团）描述错为 "6 大派系"——根因是 Step 1 反向 grep 阶段直接根据 HANDOVER 提到的 "派系" 命名做了错误推断，没去看 FACTION_DEFS 实际定义。**下条链 Step 1 之前应该先 view 关键常量定义**。

7. **派系/标签系统至少 4 套并行**（武将链特有）：
   - GEN_TAGS 5 维静态标签（politics/combat/origin/state/temperament）
   - FACTION_DEFS 16 个出身/地缘集团（getGenFaction 映射）
   - 势力级 ethos 派系字典（'汉室死忠'/'士族'/hawk/dove/founding/royalty）—— 1297/1305 出现
   - GEN_MAP.values 行为 hook 标签（忠义/野心/投机/汉室死忠/蛮勇）
   
   命名混乱（hawk/dove 既是个体标签又是势力级派系键）+ 死数据（蛮勇）+ 部分 hook 跨链（汉室死忠在外交+价值观）—— **D-074 候选**（待 v1.2 增量正式记录）。

### 9. v1.1 节点骨架不完整（需补 v1.2 增量）

**对话末尾发现**：制作人指出"派系本身的计算对其他系统的反馈"未被 cover。复核 calcFactionInfluence(fid) @ 5496 函数 + 14 个调用点，确认 v1.1 节点骨架**漏掉一整块**：

**缺失的节点 1 个**：
- **C_facInf** `calcFactionInfluence(fid)` @ 5496：每旬基于 G.generals 算出 16 个 FACTION_DEFS 集团的派系势力值（influence + total + 缓存 _facInfluenceCache）。是 8 个外部模块的输入源。

**缺失的跨链反馈边 3 条**：
- **E9 武将→事件**：派系势力值触发 EVENTS C 类豪族/派系斗争（gentry_offer @ 8859 / gentry_pressure @ 8932 / 还有 2 个待 v1.2 时核实）
- **E10 武将→外交**：14528 汉室死忠武将占比 >15% → 曹操对刘备"奉旨讨逆"宣战降级
- **E11 武将→价值观**：16085-16096 武将立场（uniHan/warlord 占比）→ ethos drift mandate；士族派系占比 → ethos drift power（**E7 当前只 cover 任命罢免 shock，未 cover 派系占比每旬 drift**）

**附带描述错误需修**（v1.1 节点骨架）：
- **A1 集团定义 FACTION_DEFS**：v1.1 desc 错写"6 大派系（uniHan/warlord/pragmatic/dove/hawk/defector）"，实际是 16 个出身/地缘集团（创始/宗亲/旧阀贵族/中原士族/河北士族/徐州士族/荆州士族/益州士族/江东士族/西凉士族/东州派/淮泗派/旧阀遗族/降将/新附/寒门豪族）
- **A3 政治倾向**：v1.1 desc 错写"4 类 uniHan/warlord/pragmatic/neutral"，实际 GEN_TAGS.politics 是 4 类 **uniHan/warlord/regional/pragmatic**（无 neutral）
- **A4 战和倾向**：v1.1 描述只 cover 武将个体 combat 字段，未提 hawk/dove 同时是 **势力级 ethos 派系字典键**（CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS @ 1297/1305）
- **A6 values 标签**：v1.1 描述只提"投机标签 +10 阈值"，遗漏：忠义/野心/投机 3 个有忠诚 hook（calcLoyaltyDelta 13567-13591 + processLoyalty 13705-13722），**汉室死忠**在外交（14528）+ 价值观（getGenMeta.values）有 hook，**蛮勇**待核实是否死数据

**需新增的 D 类**：
- **D-074 LOW**（待 v1.2 正式记录）：派系/标签 4 套并行系统命名混乱 + 部分死数据，技术债，后续重构时统一

### 10. 不做的事（再次重申）

- ❌ 不动游戏代码（包括 28 个武将链 D 类）
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节
- ❌ 不混改多个 D 类（代码 sprint 时一个 D 类对应一个 commit）

代码 sprint 时机：等所有链 audit 完成后开（剩余 政治链 / 外交链 / 事件链 / 价值观链 4 条）。

### 11. discrepancy 命名规则（沿用）

- 经济链：D-001~D-014
- 军事链：D-015~D-041（取消 D-034 / D-039，实际 23 个）
- 武将链：D-042~D-073（实际 28 个，D-071 跳过；D-074 留给 v1.2 命名混乱技术债）
- 后续链按顺序累加：政治链从 D-075 起

### 12. 下个对话指引（武将链 v1.1 → v1.2 增量补全）

**新对话启动**：武将链 v1.2 增量审计（**不是重做 v1.1**，是补漏）

**继承的素材**：
- 武将链 v1.1 三件套（JSON / 概念图 / walkthrough）
- 28 个 D 类全部已定性，不重审
- §二一〇.9 列出的"缺失节点 1 + 缺失边 3 + 描述错误 4 + 待新增 D 类 1"完整清单

**v1.2 增量任务**（按顺序）：

1. **核实 calcFactionInfluence(fid)** @ 5496：详细 view 函数 + 14 个调用点逐个分类（已审 vs 反馈到外部模块）
2. **补 EVENTS C 类豪族/派系斗争完整 4 个事件**：grep `category:'gentry'` 确认是哪 4 个，确定每个的派系势力值条件
3. **核实蛮勇 values 标签 hook**：grep `'蛮勇'` 看是否真死数据
4. **核实势力级 ethos 派系字典完整结构**：CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / 还有几处？
5. **修正 A1/A3/A4/A6 节点 desc 和 plain**（4 处描述错）
6. **新增 C_facInf 节点 + E9/E10/E11 跨链反馈边**（3 条新边）
7. **正式记录 D-074 LOW**：派系/标签 4 套并行命名混乱 + 死数据（架构债 no-fix）
8. **更新概念图 v5 → v5.1 + walkthrough 补 v1.2 段**
9. **JSON 升级 v1.1 → v1.2**

**v1.2 预期产出**：
- 节点：47 → 48（+C_facInf）
- 边：89 → ~93（+E9/E10/E11 + 几条 A→C_facInf 输入边）
- D 类：28 → 29（+D-074）

**v1.2 不做**：不重审已 verified 的 32 节点；不改已定性的 28 个 D 类。

**沿用工作流**：v1.2 增量先讨论设计（节点位置 / 边连接方式 / D-074 严重度定性）→ approve 后写 JSON → 校验 → 同步概念图 + walkthrough。

### 13. 制作人提示提醒（来自本对话末尾对话）

- **派系斗争系统是事件链 + 武将链共同负责**：事件链管"什么条件触发哪个事件"（EVENTS C 类 4 个），武将链管"派系势力值怎么算"（calcFactionInfluence）。**两条链 audit 时都要 cover**。
- **派系/标签命名混乱属于架构债**：本轮不修，未来重构时统一（D-074 LOW no-fix）
- **代码 sprint 暂不开始**：所有 8 链审完后再开统一 sprint

---

## 二一一、v1.2 武将链增量补漏完成(基于 v1.1)

### 1. 工作流(同 §二一〇)

沿用增量补漏工作流:讨论设计 → approve → JSON 增量 → 校验 → 同步概念图 + walkthrough → HANDOVER 持久化。**不重做 v1.1**,只补 §二一〇.9 列出的"缺失节点 1 + 缺失边 3 + 描述错误 4 + 待新增 D 类 1"。

### 2. 三件套交付(v1.2)

| 文件 | 状态 |
|---|---|
| `general_chain_v1.2.json` | 51 节点 / 97 边 / 30 D 类全部定性 |
| `Project_Romance_Concept_Map_v5_1_personnel.html` | 概念图 v5.1,默认打开武将链 v1.2 |
| `general_chain_walkthrough.md` | 增补 v1.2 段(原 v1.1 段保留) |

### 3. v1.2 增量任务执行结果

| 任务 | 状态 | 结果 |
|---|---|---|
| 1. 核实 calcFactionInfluence + 调用点 | ✅ | 实际 13 调用点(非 14;v1.1 计数含定义行)。其中 dead code 1 个(D-075) |
| 2. 核实 4 个 gentry 事件 | ✅ | gentry_offer / gentry_pressure / humble_complaint / gentry_unrest。**3 个走 C_facInf,1 个走 A2 origin** |
| 3. 核实蛮勇标签 hook | ✅ | 确认死数据,只 2 武将带,全代码无 hook |
| 4. 核实势力级 ethos 字典完整结构 | ✅ | 仅 2 常量(CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS),通过 _applyClaimFactionEffects 统一展开 6 键 |
| 5. 修正 A1/A3/A4/A6 desc | ✅ | 实际修正 6 个(+A2/A8 也涉及字典键标注) |
| 6. 新增 C_facInf + E9/E10/E11 节点 | ✅ | **改设计**:E9/E10/E11 是节点不是边(沿用 E 区"每个跨链 1 节点"规约) |
| 7. 正式记录 D-074 | ✅ | LOW no-fix(命名混乱+蛮勇死数据,架构债) |
| 8. 更新概念图 v5 → v5.1 | ✅ | HTML 嵌入 v1.2 JSON,文件大小 300K → 340K |
| 9. JSON 升级 v1.1 → v1.2 | ✅ | 51 节点 / 97 边,无孤立边/重复边/重复 ID |

### 4. v1.2 实际产出 vs §二一〇.12 预期

| 指标 | §二一〇.12 预期 | v1.2 实际 | 差异原因 |
|---|---|---|---|
| 节点 | 47 → 48(+C_facInf) | 47 → **51**(+C_facInf+E9+E10+E11) | E9/E10/E11 按 E 区"每个跨链 1 节点"规约延续,作为节点而非边 |
| 边 | 89 → ~93 | 89 → **97** | 新边 8 条(A1/B1→C_facInf 输入 2 + C_facInf→C8/C7 内部 2 + C_facInf→E9/E11 反馈 2 + A6→E10 / A2→E9 反馈 2) |
| D 类 | 28 → 29(+D-074) | 28 → **30**(+D-074+D-075) | 任务 1 核实 14528 时新发现 dead code,定为 D-075 |

### 5. v1.2 新增 D 类(2 个)

**D-074 LOW no-fix** — 派系/标签命名混乱 + 蛮勇死数据
- (a) CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS 字典 6 键中 4 键(founding/royalty/hawk/dove)与其他系统同名异义
  - 'founding' 字典键 = seniority 函数,FACTION_DEFS 'founding' = 16 集团之一(C_facInf 派系势力值)
  - 'royalty' 字典键 = _isClanRoyalty 函数,FACTION_DEFS 'royalty' = 16 集团之一
  - hawk/dove 字典键 = GEN_TAGS.combat(同源,无问题)
- (b) `蛮勇` values 标签是死数据(2 武将带:孟获/祝融,全代码无 hook)
- (c) `humble` 在 FACTION_DEFS / GEN_TAGS.origin 双源(同源,可接受)
- 决策:架构债保留,未来大版本重构时改名 seniority_founding / clan_royalty 区分

**D-075 LOW fix** — 14528 calcFactionInfluence dead code
- `const inf = calcFactionInfluence(fid)` 取值后未使用,实际 hanRatio 用 GEN_MAP.values 标签遍历算
- 修法:删 14528 单行(语义无影响,纯清理)

### 6. v1.2 描述错误修正(6 节点)

- **A1**:6 大派系 → 16 个出身/地缘集团完整列出
- **A2**:补 ④ 势力级 ethos 字典键 '士族'/'royalty' + ⑤ humble_complaint 出口
- **A3**:neutral → regional(实际无 neutral)
- **A4**:删错误 hook 描述,改为 triggerFactionEvent 7 类事件 + military drift + 字典键
- **A6**:重义/恋家(不存在)→ 5 标签完整(忠义/野心/投机/汉室死忠/蛮勇)
- **A8**:补 ⑤ 字典键 'founding' + ⑥ 命名混乱提示

### 7. v1.2 关键结构发现

- **势力级 ethos 字典 6 键不是独立系统**,是 A 区已有标签的"应用层别名集合":'汉室死忠'=A6 values / '士族'=A2 origin / hawk/dove=A4 combat / founding=A8 seniority / royalty=A2 origin clan + 同姓宗族
- **E10 武将→外交反馈** source 是 A6 不是 C_facInf(汉室死忠占比走 values 标签遍历)
- **E11 武将→价值观 power drift** 与 E7 ethosShock 是**两套并列机制**:E7 任命罢免一次性,E11 每旬连续

### 8. discrepancy 命名规则更新

- 经济链:D-001~D-014
- 军事链:D-015~D-041(取消 D-034 / D-039,实际 23 个)
- 武将链:D-042~D-075(实际 30 个,D-071 跳过;v1.1 28 个 + v1.2 2 个)
- **政治链:从 D-076 起**(原 §二一〇.11 写的"D-075 起"作废)

### 9. v1.2 不做的事

- ❌ 不动游戏代码(包括 30 个武将链 D 类)
- ❌ 不动已 verified 的 47 节点(只补 C_facInf+E9/E10/E11 新增 + 6 个 A 节点 desc 修正)
- ❌ 不改已定性的 28 个 v1.1 D 类
- ❌ 不重写 HANDOVER 早期章节(§二一〇 保留,本 §二一一 仅追加)

### 10. 下个对话指引(政治链 audit pass 1 启动)

**继承的素材**:
- 武将链 v1.2 三件套(JSON / 概念图 v5.1 / walkthrough)
- 30 个武将链 D 类全部定性,不重审
- 4 链工作流方法论(§二〇九.11 + §二一〇.8 + 本 §二一一)
- 已审链 D 类总清单:14 经济 + 23 军事 + 30 武将 = **67 个跨链 D 类**(政治链 audit 时对账用)

**新对话启动**:政治链 audit pass 1
- 同样 5 步:Step 1 反向 grep → Step 2 节点骨架 → Step 3 6 阶段 → 概念图 → walkthrough
- 与豪族链/经济链/军事链/武将链同代命名(v1.0→v1.1→v1.2 视情况)
- D 类编号从 **D-076** 起

**Step 1 反向 grep 分组建议**(政治链特性):
1. 主 tick:processCorruption / 朝议 tick / processGentry / 官位月费结算
2. 派生入口:朝议提案选项 / 罢免/任命派生效果
3. 状态读写:G.factions[fid].* 政治字段(taxId/corruption/court*)
4. 常量:POST_TIERS / STAGE_TIER1_SLOTS / MIL_POSTS / CIV_POSTS
5. 跨链:武将 origin / 经济金费 / 价值观 ethos / 朝议 vs 派系民意

### 11. 制作人提示(本轮新增)

- **节点 vs 边 决策原则**:沿用各链 E 区"每个跨链方向 = 1 节点"规约,不混用"边"语义。v1.2 之前 §二一〇.9 误用"3 条边"表述,实际是 3 个节点(E9/E10/E11)。
- **dead code 单独算 D 类**:不一定要扯到机制 bug;像 14528 这种"取值未用"的纯清理,值得记 LOW fix。
- **同名异义命名混乱**正式归到架构债 D-074 框架(no-fix 保留待重构)。


---

## 二一二、v181 政治链 audit pass 1 完成

### 1. 工作流(同武将链 v1.2 §二一一)

沿用 5 链工作流:Step 1 反向 grep → Step 2 节点骨架 + 制作人 Q1-Q5/K1-K4 决策 → Step 3 6 阶段全审 → 概念图 v6 → v6.1 → walkthrough v1.0 + v1.1 增量段 → HANDOVER 追加。

**与已审 4 链同代命名**:政治链 v1.0(节点骨架)→ v1.1(Step 3 6 阶段完成),沿用经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 的命名同代。

### 2. 三件套交付(v1.1)

| 文件 | 状态 |
|---|---|
| `political_chain_v1_1.json` | 45 节点 / 90 边 / 15 D 类全部定性 |
| `Project_Romance_Concept_Map_v6_1_political.html` | 概念图 v6.1,默认打开「政治链 v1.1 ✓」tab,默认选中 C13 |
| `political_chain_walkthrough_v1_1.md` | 539 行,v1.0 段保留 + v1.1 增量段 |
| `political_chain_grep_findings_v181.md` | Step 1 反向 grep 报告(7 组)|

### 3. v1.0 节点骨架(Step 1+2)

**Q 决策**(制作人 approve):
- Q2 太守独立节点 C9(setPrefect 独立 setter,与官职 setter 路径不同)
- Q3 月费扣款单立 C 节点 C2
- Q4 三大政策 SET 簇合并 C11(setTax/setPolicy/setCorvee 共享 setter 模式)
- Q5 Claude AI 政治 _exec 单立 E7

**K 决策**:
- K1 clearAllPostsByGen 并入 C8(罢免簇)
- K2 5 个 _exec 全并入 E7
- K3 朝议簇 D2 与任命变更 D1 分立
- K4 processStageEvolution 不单立(只作 E6 上游驱动)

**节点分布**:A10/B8/C16/D4/E7 = 45(经济链 44 / 军事链 47 / 武将链 v1.2 51,**政治链居中略小**)。

**边 90 条**:A→B 3 / A→C 18 / B→C 21 / B→E 7 / C→B 3 / C→C 10 / C→D 8 / C→E 2 / D→E 9 / E→C 8 / E→B 1。

### 4. v1.1 Step 3 6 阶段执行结果

| 阶段 | 范围 | 发现 D 类 |
|---|---|---|
| 1.1 | E7 Claude AI 5 _exec 政治路径 | 5 (D-076~D-080)|
| 1.2 | B8 prefect 11 路径对账 | 4 (D-081~D-084)|
| 2 | 一致性差(三任命数值 + ethosShock + anti_corruption)| 3 (D-085/D-086/D-087)|
| 3 | 边界 case(MERIT_INIT 取消候选 7 + 朝议 selectCount + 6 边界 verified)| 1 (D-088)|
| 4 | 4 状态字段散点扫描 | 1 (D-089) |
| 5 | 节点级模糊(C4 desc 修正 + setStrategist exploit)| 1 (D-090) |
| 6 | 批量 verified 收尾 | 0 |
| **合计** | - | **15** |

### 5. v1.1 全 15 D 类清单(D-076~D-090)

| ID | 严重度 | verdict | 内容 |
|---|---|---|---|
| **D-076** | **HIGH** | **fix** | Claude AI 缺 _execSetCorvee — 永远徭役=low(传统 AI 13470-13472 有自动调档)|
| **D-077** | **HIGH** | **fix** | _execSetReinforcePolicy 写错字段 reinforcePolicy → policyId(**跨链 close 军事链 D-021**,1 字段名修复)|
| D-078 | LOW | defer | _execSetTax 裸写不走 setter(setTax 写死 G.playerFac,历史包袱)|
| D-079 | MEDIUM | no-fix | _execSetPrefect _genDeployed 守卫玩家无(AI 守卫严格是设计意图)|
| D-080 | LOW | defer | 玩家 appoint 守卫只在 UI 层(架构债)|
| D-081 | MEDIUM | no-fix | 武将主动离开 3 路径漏 removePost(派系事件语义不该触发)|
| D-082 | MEDIUM | no-fix | 大乱漏 dismissPrefect 三件套(全势力 -3 已 cover)|
| D-083 | LOW | verified-with-notes | 开城漏 dismiss(豪族机制已 cover)|
| **D-084** | **HIGH** | **fix** | succeedRuler 漏 clearAllPostsByGen(1 行修复,继任者双重身份)|
| D-085 | LOW | defer | anti_corruption ② 缺 clan_base loyalty |
| D-086 | MEDIUM | verified-with-notes | 三任命数值差异(军师 +5/-2 vs 官职/太守 +8/-3)是设计意图 |
| **D-087** | MEDIUM | **fix** | setPrefect/setStrategist 缺 ethosShock(4 处补)|
| D-088 | LOW | fix | 朝议 selectCount=2 时 UI 强求(1 字符改动 length<=2 全 autoPass)|
| D-089 | LOW | defer | INIT_POSTS 无 stage cap 检查(扩展性)|
| D-090 | LOW | fix | _execSetStrategist 同人重复任命 net +3 忠诚 exploit |

**严重度统计**:HIGH 3 / MEDIUM 5 / LOW 7 = 15
**verdict 统计**:fix 6 / no-fix 4 / defer 4 / verified-with-notes 1

### 6. v1.1 节点状态分布

| 状态 | 数量 |
|---|---|
| verified | 22 |
| verified-with-findings | 7 |
| verified-mirror | 6 |
| verified-with-notes | 3 |
| discrepancy | 7 |
| **合计** | **45** |

**D 类高度集中**:15 D 类中 11 个集中在 **C9 太守簇 + C10 军师 + E7 Claude AI**(73%),不是均匀分布。

### 7. v1.1 关键结构发现

#### 7.1 朝议 buff key 体系(C4 desc 修正)
- getCourtDecreeBuffs 实际返回 **8 key**(v1.0 误写 9 key 已修正)
- **8 key 与朝议 COURT_PROPOSALS 闭合**:goldProd/foodProd/recruitCost/reinforce/upkeep/morale/milBuildCost/recruitWild
- **_postBuffs 11 - 重叠 6 = 5 个独立 key**(foodCost/buildSpeed/stratRate/giftEffect/expGain)只能官职 buff,**设计意图**:"私人职务赋能" vs "国家政策"分层
- **anti_corruption 直 push 的 corruptReduce 不在 8 key 中**,走 calcCityCorruption 4722 直读

#### 7.2 stage 不可逆 + 残余 regime 保留 tier1
- stage 只升不降(ident.stage = promo.nextStage 4838,无降级路径)
- 残余 regime 势力(打到 3 城)选档"侯",但 STAGE_TIER1_SLOTS[regime]={1,1} 仍允许任丞相/大将军
- **叙事意图**:政权身份的最低尊严 — 即使败退,仍是正统朝廷

#### 7.3 三任命函数数值差异(D-086 设计意图)
- 官职 +8/-3:中央正式官位
- 太守 +8/-3:地方军政一把抓(数值同官职,因为同等正式性)
- **军师 +5/-2**:私人战略顾问,不是正式官位,信号更柔性
- **未文档化前易被误判为 bug**,v1.1 节点 desc 已说清

#### 7.4 anti_corruption 9 旬 decree 绕朝议 ceremony
- 朝议主路径 _applyCourtDecisions 5878 写 expiresAt = G.turn + 3
- anti_corruption 事件直 push expiresAt = G.turn + 9(= 1 季度,下次朝议前不过期)
- **设计意图**:事件型 decree 是"应玩家选择产生的特别法令",绕开常规 ceremony 合理

#### 7.5 D-077 命名混乱(同 D-074 框架)
- 接口名:`set_reinforce_policy`(部队级补员策略)
- 写入字段:`reinforcePolicy`(无效字段)
- **应写字段**:`policyId`(政治链 B1 三大政策状态)
- processReinforcement 30287 读 policyId,写错字段相当于 dead code(军事链 D-021 视角)
- **政治链视角**:_execSetPolicy 实质实装,只是命名错位。1 字段名修复 close 双链

### 8. 跨链 D 类闭合(D-077 = 军事链 D-021)

**第 2 例跨链 D 类**(经济链 D-006 是第 1 例)。同处代码两面观察:
- 军事链 D-021 视角:_execSetReinforcePolicy 写的字段 processReinforcement 不读 → dead code
- 政治链 D-077 视角:_execSetPolicy 实质实装但写错字段 → 缺位真因
- **修法相同**:1 字段名 reinforcePolicy → policyId,1 commit close 双链

### 9. 与已审 4 链对比

| 链 | D 类 | HIGH | MEDIUM | LOW | 节点 | audit 阶段 |
|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | 全 verified |
| 豪族链 v4 | 12 | - | - | - | ~37 | 早期 |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | Step 3 全过 |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | Step 3 + v1.2 增量 |
| **政治链 v1.1** | **15** | **3** | **5** | **7** | **45** | **Step 3 全过** |

**政治链特点**:
- D 类总数比军事链/武将链少(15 vs 23/30)
- HIGH 数量中等(3 vs 经济链 0 / 军事链 6 / 武将链 10)
- **散点扫描特别干净**(只 1 LOW)— 状态字段少 + 入口收敛(setter 函数主导)
- D 类高度集中在 3 节点(C9/C10/E7)— 73% 集中度

### 10. 工作流方法论沉淀(基于 5 链)

继承 §二〇八 / §二〇九.11 / §二一〇.8 / §二一一.11 方法论,本轮新增:

#### 10.1 散点扫描的链路特性
- 经济链散点 → 1 个 MEDIUM(D-006)
- 军事链散点 → 5 个 D 类(D-035~D-040,Claude AI _execRecruit 部队属性)
- 武将链散点 → 3 个 D 类(D-069~D-072)
- **政治链散点 → 1 个 LOW(D-089)**

**规律**:状态字段越少 + 入口越收敛,散点扫描越干净。政治链 4 状态字段 + 函数化 setter,远比军事链 unit.squads.troops 24+ 写入点干净。

#### 10.2 跨链 D 类的"两面观察"模式
- D-006 经济链 = 军事链 D-006(同 ID 跨链记录)
- D-077 政治链 = 军事链 D-021(同处代码两面)
- **跨链 D 类应在两条链都登记,实际只是同一处代码的不同视角**
- 修复时 1 commit 同时 close 双链,避免重复劳动

#### 10.3 设计意图 vs bug 的辨识
政治链 D-079 / D-082 / D-083 / D-086 等多处都是**设计意图**而非 bug,关键鉴别指标:
- **是否有现存机制 cover 该语义?**(D-082 大乱已 -3 全员 / D-083 豪族机制 / D-079 buff 减半提示)
- **是否其他系统已经处理?**(D-081 派系事件本身是"君主主动"语义,武将自然脱离不该套用)
- **未文档化的设计意图易被误判 bug**,audit 时应通过 walkthrough 文档化(verified-with-notes)

#### 10.4 命名混乱的 D-074 框架延伸
- 武将链 D-074:CLAIM_EFFECTS 字典键 founding/royalty 与 FACTION_DEFS 同名异义
- 政治链 D-077:_execSetReinforcePolicy 接口名 vs 写入字段 vs 应写字段三层命名混乱
- **共同根因**:演化中加新接口未严格对齐字段名/枚举值
- 留给重构 sprint 统一处理

### 11. discrepancy 命名规则更新

- 经济链:D-001~D-014
- 军事链:D-015~D-041(取消 D-034/D-039)
- 武将链:D-042~D-075(D-071 跳过)
- **政治链:D-076~D-090**(15 个,无跳号)
- **外交链:从 D-091 起**

**累计 82 个跨链 D 类**(已审 4 链 + 政治链)。

### 12. v1.1 不做的事(再次重申)

- ❌ 不动游戏代码(包括 15 个政治链 D 类的 6 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 数据
- ❌ 不重写 HANDOVER 早期章节(本 §二一二 仅追加)
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

代码 sprint 时机:等所有链 audit 完成后开(剩余 **外交链 / 事件链 / 价值观链** 3 条)。

### 13. 下个对话指引(外交链 audit 启动)

**继承的素材**:
- 政治链 v1.1 三件套(JSON / 概念图 v6.1 / walkthrough)
- 15 个政治链 D 类全部定性,不重审
- 5 链工作流方法论(§二〇八+§二〇九.11+§二一〇.8+§二一一+本节)
- **D 类清单累计 82 个跨链 D 类**(外交链 audit 时对账用)

**新对话启动**:外交链 audit pass 1
- 同样 5 步:Step 1 反向 grep → Step 2 节点骨架 → Step 3 6 阶段 → 概念图 → walkthrough
- 与已审 5 链同代命名(v1.0 → v1.1)
- D 类编号从 **D-091** 起

**Step 1 反向 grep 分组建议**(外交链特性):
1. 主 tick:processFeudDecay / processReputation / processClaimPrep / 16520-16522
2. 派生入口:diploGift / diploArmistice / diploDemandVassal / declareWar / proposeAlliance / break_alliance / start_claim / submit_vassal / release_vassal
3. 状态读写:G.diplo / G.claims / G._warClaimStrength / G._feuds / G._cityChangeLog / .reputation
4. 常量:CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS / TRIBUTE_RATES(政治链 A10 mirror)
5. 跨链:经济(送礼/通商) / 武将(挖角外交惩罚 ±15) / 政治(信誉影响送礼 / TRIBUTE_RATES)/ 价值观(背刺 ethosShock)/ 军事(isHostile 170 处调用,军事链 E3 已审)
6. 外围因子:isHostile 170 处 / canEnthrone / claim 准备时长 / addDiplo 双向写入

**外交链特别关注**:
- 与政治链 E4(双向耦合)对账
- 与武将链 v1.2 E10(汉室死忠占比 → imperial_decree 降级)对账
- 与经济链 D6 纳贡(政治链 A10 TRIBUTE_RATES)mirror

### 14. 制作人提示(本轮新增)

- **设计意图 vs bug 的辨识标准**:政治链多个 D 类(D-079/D-082/D-083/D-086)是设计意图。鉴别要点是"现存机制是否已 cover 该语义"+ "其他系统是否已处理"。verified-with-notes 状态用于"功能正确但需文档化"的场景。
- **散点扫描干净度反映架构清洁**:政治链散点 1 LOW vs 军事链散点 5 D 类。状态字段集中度 + setter 收敛度是关键指标。
- **跨链 D 类一码两面**:同一处代码不同链视角看到不同问题,修复时 1 commit close 双链。HANDOVER 应在两链都登记。
- **phase 报告非工作流标准产出**:walkthrough + JSON auditFindings 已 cover 所有 phase 内容,phase 报告冗余。后续链不再产 phase 报告。


---

# §二一三 — 外交链 audit pass 1 完成(v1.0 → v1.1,2026-05-03)

> **本节追加,不动早期章节**。继承 §二〇八/§二〇九/§二一〇/§二一一/§二一二 方法论。

## 1. 三件套产出

- **JSON**:`diplomatic_chain_v1_1.json`(51 节点 / 118 边 / D-091~D-120 共 31 个 D 类全 verdict 锁定)
- **概念图**:`Project_Romance_Concept_Map_v6_2_diplomatic.html`(替换原占位,标题升 v5.1→v6.2)
- **walkthrough**:`diplomatic_chain_walkthrough_v1_0.md`(560 行,含 v1.0 + v1.1 双段)

## 2. Step 1+2 决策摘要

- **分区 5 区方案 C**(沿用)/ **颗粒度 A**(沿用)
- **Q3.1** 玩家 4 件套 + aiDoDiplo 5 节点单立(diploGift/Armistice/Ally/War 各独立,aiDoDiplo 单立)
- **Q3.2** 附庸 5 函数拆 2 节点(玩家入口 C15 + helper C18)
- **Q3.3** 主 tick 3 函数 3 单立(C9 processClaimPrep / C10 processFeudDecay / C11 processReputation)
- **Q3.4** applyWarDeclarationEffects 入 C20 hub(因含称帝/血仇/易主多功能)
- **Q4** TRIBUTE_RATES 单立 A4 标 mirror 政治链 A10
- **Q5** isHostile 入 C1 查询簇(与 getDiploStatus 同级)

## 3. Step 3 6 阶段执行结果

| 阶段 | D 类增量 | 主要发现 |
|---|---|---|
| 1.1 E7 Claude AI 9 _exec 对账 | 11 | D-091 HIGH(_exec 附庸 3 函数错配) + D-099 prompt 缺 4 指令 + D-100 派发器漏 enthrone case |
| 1.2 玩家/aiDoDiplo/_exec 横向一致性 | 9 | D-104 HIGH(附庸先写后弹窗 v179fix P15c 平行 bug) |
| 2 helper/hub 完整性 | 1 | D-113 HIGH(强制停战漏 _applyPeaceAgreement) |
| 3 边界 case | 1 | D-114(Claude AI 接管 _diploCD 永不递减) |
| 4 散点扫描 | 7 | D-117c HIGH(自动宣战漏全套副作用)+ D-120 HIGH(_diploActed 永不重置)+ 4 个 fix + 2 个 no-fix |
| 5 节点级模糊 | 0 | D-101 误报澄清 |
| 6 整体校验 | 0 | 补 16 边修复连通性,边 102→118 |

**累计**:HIGH 5 / MEDIUM 13 / LOW 13 = 31 D 类;fix 19 / defer 4 / no-fix 7 / verified-with-notes 1。

## 4. 5 个 HIGH D 类

| ID | 内容 | 修法 |
|---|---|---|
| D-091 | _execDemandVassal/SubmitVassal/ReleaseVassal 错配传参,玩家函数硬编 G.playerFac | 玩家 3 函数加 fid 参重构;_exec 改 thin wrapper |
| D-104 | _pendingVassalOffer 状态先写后弹窗(v179fix P15c 平行 bug 未修) | 同 P15c 模式:玩家介入只设 _pendingVassalOffer,acceptVassalOffer 时才调 _setVassalStatus |
| D-113 | _resolveVassalDiploConflicts 强制停战漏 _applyPeaceAgreement(v179fix P15c 平行 bug 未修) | 改为 `_applyPeaceAgreement(vassalFid, third); addDiplo(vassalFid, third, 5);` |
| D-117c | checkDiplo 自动宣战(rel≤10)漏 applyWarDeclarationEffects/_syncAllyWarStatus/_diploCD/背刺反复检测/ethosShock | 走 helper(_statusToEnemyHelper)调 hub |
| D-120 | G._diploActed_${fid} 顶层字段永不重置 → 玩家附庸 3 入口整局各 1 次 | nextTurn 16347 加 ALL_FACS.forEach(f => delete G[`_diploActed_${f}`]) |

**HIGH 集中规律**:
- 3 个(D-091/D-104/D-113)同源 v179fix P15c 平行 bug 模式(状态先写后处理)
- 1 个(D-117c)是 hub 外旁路漏副作用模式
- 1 个(D-120)是顶层字段重置遗漏模式

## 5. discrepancy 命名规则更新

- 经济链:D-001~D-014
- 军事链:D-015~D-041(取消 D-034/D-039)
- 武将链:D-042~D-075(D-071 跳过)
- 政治链:D-076~D-090
- **外交链:D-091~D-120**(D-098 取消,D-117 拆 a/b/c,共 31 个 finding)
- **事件链/价值观链:从 D-121 起**

**累计 113 个跨链 D 类**(已审 6 链)。

## 6. 节点状态分布

| 状态 | 数 |
|---|---|
| verified | 23 |
| verified-mirror | 12 |
| verified-with-notes | 5 |
| verified-with-findings | 4 |
| discrepancy | 6 |
| pending | 1(E6 价值观链待审) |
| **合计** | **51** |

## 7. 与已审 5 链对比

| 链 | D 类 | HIGH | MEDIUM | LOW | 节点 | 边 |
|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | ~95 |
| 豪族链 v4 | 12 | - | - | - | ~37 | ? |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | ? |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | ? |
| 政治链 v1.1 | 15 | 3 | 5 | 7 | 45 | 90 |
| **外交链 v1.1** | **31** | **5** | **13** | **13** | **51** | **118** |

**外交链特点**:
- D 类总数最多(31),状态字段多 + 入口分散 + Claude AI 路径多
- HIGH 5 中等(武将 10 / 军事 6 居首)
- D 类 81% 集中在 4 处:C15 玩家附庸入口 + C17 aiDoDiplo + E7 Claude AI + B8/B1 状态散点
- 散点扫描特别**不干净**(7 D 类),对比政治链 1 LOW

## 8. 工作流方法论沉淀(基于 6 链)

继承 §二〇九.11 / §二一〇.8 / §二一一.11 / §二一二.10 方法论,本轮新增:

### 8.1 v179fix P15c 模式的"推广不彻底"D 类
v179fix P15c 重做了 4 个停战路径合一,但**附庸路径(D-104)/ 强制停战(D-113)/ 自动宣战(D-117c)未应用同模式**。3 个 HIGH 全是"推广不彻底"。

**规律**:制作人重做 helper 时容易**只覆盖最频繁路径**,边缘路径(附庸/自动转换/事件触发)被遗漏。代码 sprint 时应用同模式 fix。

### 8.2 玩家函数硬编 G.playerFac 是跨链 D 类温床
外交链 4 函数(diploDemandVassal/diploSubmitVassal/playerReleaseVassal/_diploActed)硬编 G.playerFac,_exec 路径接驳时**错配传参**(D-091 HIGH)。**政治链 D-078 _execSetTax 同源问题**。

**规律**:玩家函数应**统一参数化 fid**,_exec 改 thin wrapper。重构 sprint 统一目标。

### 8.3 散点扫描 vs hub 完整性的链路特性
外交链 31 D 类中 hub(C20)主体只 verified-with-findings(0 fix),但散点 + 自动转换(checkDiplo)+ 战斗 de facto(30063)+ 计谋(stratDriveWolf)+ 事件(斩使)等 hub 外旁路 7 D 类。

**规律**:外交链状态机分散度高,hub 集中后**周边代码绕开 hub 写状态**容易漏副作用。审计应同等关注 hub 外旁路。

### 8.4 Claude AI prompt 缺指令是隐形 dead code 源
D-099 prompt 缺 4 外交指令 → _exec 实装但 Claude AI 不知道有 → dead code。

**规律**:**实装 _exec 后必须更新 prompt**。可建立 _exec ↔ prompt 一致性检查工具。

### 8.5 CD 单位混乱(决策回合 vs 自然旬)
_diploCD 在 aiDoDiplo 内递减(每 3 旬 -1),Claude AI 接管时不调 → 永不衰减(D-114)。**_vassalIndepCD/_tradeCD 用绝对 turn 模式正确**。

**规律**:CD 应统一**绝对 turn 模式**(`G[cdKey] = G.turn + N`)。代码 sprint 时统一改造。

### 8.6 顶层 G._fieldName_${fid} 字段无重置易漏
D-120 G._diploActed_${fid} 永不重置,只在 G.diplo[k]._actedThisTurn 内重置(B1 字段)。两套机制混用是历史包袱。

**规律**:**散点写入 G 顶层的"本旬"标记字段必须有显式重置点**。审计应专扫 `G[\`_${name}_${fid}\`] = ` 模式。

## 9. 跨链对账(与已审 5 链 + 价值观链 pending)

- **经济链 v4.3** ✓:E1 5 类输出,纳贡执行点在经济链 C7 内
- **军事链 v1.1** ✓:E2 isHostile 170 处 + _clearSiegeOnPeace
- **武将链 v1.2** ✓:E3 4 输出,poachGen 双向已修(v149fix+v179fix)
- **豪族链 v4** ✓:E4 占城 hook + TRIBUTE mirror
- **政治链 v1.1** ✓:E5 TRIBUTE_RATES 同表 mirror
- **价值观链(待审)** pending:E6 6 类 ethosShock,价值观链 audit 时闭合

## 10. v1.1 不做的事(再次重申)

- ❌ 不动游戏代码(包括 31 个外交链 D 类的 19 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节(本节追加)
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

代码 sprint 时机:等所有链 audit 完成后(剩余 **事件链 / 价值观链** 2 条)。

## 11. 下个对话指引

**继承的素材**:
- 外交链 v1.1 三件套(JSON / 概念图 v6.2 / walkthrough)
- 31 个外交链 D 类全部定性,不重审
- 6 链工作流方法论(§二〇八+§二〇九.11+§二一〇.8+§二一一+§二一二+本节)
- **D 类清单累计 113 个跨链 D 类**(后续链 audit 时对账用)

**新对话启动**:建议 **价值观链 audit pass 1** 优先(外交链 E6 已 pending,优先闭合 mirror)
- 同样 5 步:Step 1 反向 grep → Step 2 节点骨架 → Step 3 6 阶段 → 概念图 → walkthrough
- 与已审 6 链同代命名(v1.0 → v1.1)
- D 类编号从 **D-121** 起

**Step 1 反向 grep 分组建议**(价值观链特性):
1. 主 tick:processFacEthos / _applyEthosDrift
2. 派生入口:applyEthosShock / triggerFactionEvent 6 类(betray/truce/warDeclare/appointPost/removePost/defectorPrefect)
3. 状态读写:G.factions[fid].ethos.{strategy/mandate/civil/military/...}
4. 常量:ETHOS_DIMS / ETHOS_DRIFT 阈值 / 漂移基准
5. 跨链入边:外交链 E6(本链 audit 时闭合)/ 政治链朝议 ethosShock / 武将链 / 军事链 / 事件链
6. 跨链出边:_repPenaltyFactor 信誉影响 / TAX 重税触 strategy drift / aiDoDiplo aggrWill 修正 / canEnthrone mandate≥30 / aiConsiderEnthrone mandate≥60

**价值观链特别关注**:
- 与外交链 E6(6 类 ethosShock)闭合
- 与政治链 E5(朝议 ethosShock 4 维度)对账
- 与武将链 v1.2(派系 mod 修正)交界

## 12. 制作人提示(本轮新增)

- **HIGH 集中模式识别**:外交链 5 个 HIGH 中 3 个(D-091/D-104/D-113)同源 v179fix P15c 平行 bug,1 个(D-117c)hub 外旁路漏副作用,1 个(D-120)字段重置遗漏。**审计 HIGH 时应主动检查同模式平行 bug**(已修主路径未推广到边缘路径)。
- **prompt ↔ _exec 一致性是新检查项**:D-099 + D-100 揭示"实装但 Claude AI 不知道"和"Claude AI 想做但派发器吞"两种典型问题。代码 sprint 后建立自动化检查工具。
- **散点扫描的链路特性更新**:状态字段越分散 / 自动转换路径越多 / 事件触发入口越多 → 散点 D 类越多。外交链 7 D 类对比政治链 1 LOW,差异主要来自 checkDiplo 自动转换(B1)+ 战斗 de facto(30063)+ 事件路径(斩使/计谋/etc)。事件链 audit 时应预期同样多散点 D 类。
- **CD 单位统一是重构 sprint 优先项**:_diploCD 决策回合单位 vs _vassalIndepCD/_tradeCD 绝对 turn,统一目标是绝对 turn。可作为重构 sprint 第 1 个统一改造目标(影响范围相对受控)。

---

# §二一四 — 价值观链 audit pass 1 完成(v1.0 → v1.1,2026-05-03)

> **本节追加,不动早期章节**。继承 §二〇八/§二〇九/§二一〇/§二一一/§二一二/§二一三 方法论。

## 1. 三件套产出

- **JSON**:`ethos_chain_v1_1.json`(27 节点 / 47 边 / D-121~D-129 共 9 个 D 类全 verdict 锁定)
- **概念图**:`Project_Romance_Concept_Map_v6_3_ethos.html`(v6.2→v6.3 增量追加 ethos tab,topbar v5.0→v6.3 同步,默认打开价值观链 tab)
- **walkthrough**:`ethos_chain_walkthrough_v1_0.md`(320 行,单段 v1.0 audit 完成版,因 Step 1+2+3 间隔短无双段必要)

## 2. Step 1+2 决策摘要

- **分区 5 区方案 C**(沿用)/ **颗粒度 A**(沿用)
- **Q3.1** SIEGE_AFTERMATH.ethosShocks 单立 A3 mirror 军事链
- **Q3.2** processFacEthos 单 hub C3(5 维度内嵌不拆,因 65 行集中在一函数)
- **Q3.3** applyEthosShock 64 line/70+ call 统一进 D 出口,**按 5 维度切分**(D1 mandate/D2 power/D3 civil/D4 military/D5 strategy)— 与其他链按"动作"切分不同
- **Q4** _ethosTierLabel 30 tier 描述归 ETHOS_LABELS 同节点 desc 内嵌(A2)
- **Q5** EC-1 Claude AI getGameState 缺 ethos 推 Step 3 阶段 1.1 正式 verdict

## 3. Step 3 6 阶段执行结果

| 阶段 | D 类增量 | 主要发现 |
|---|---|---|
| 1.1 Claude AI getGameState/prompt 对账 | 1 | D-121 HIGH fix(getGameState 305 行零 ethos 引用 + prompt 零上下文 + _execEnthrone 仅查 canEnthrone 硬门槛绕过 mandate gate)|
| 1.2 玩家/aiDoDiplo/_exec 横向一致性 | 1 cross-chain | D-122 跨链 close(=外交链 D-095 双计 fix verdict)|
| 2 helper/hub 完整性 | 2 | D-123 LOW defer(漂移系数无中央 const)+ D-126 LOW verified-with-notes(nonRuler 排除 ruler)|
| 3 边界 case | 3 | D-124 重评(_ethosLog cap 100 实测 12-25 旬)+ D-127 verified-with-notes(无部队 fieldRatio)+ D-128 no-fix(atWar 不查 rebel)+ D-129 LOW fix(灭国势力 processFacEthos 不跳过)|
| 4 散点扫描 | 1 | D-125 LOW no-fix(通知阈值 5 不对称)|
| 5 节点级模糊 | 0 | E2 desc 修正 32→33 line/40+ call + D1 desc 7 处口径澄清 |
| 6 整体校验+补边 | 0 | 补 5 dashed helper-read 边(E1/E3/E4/E5/E6 → C3 hub),边 42→47 |

**累计**:HIGH 1 / MEDIUM 1 / LOW 7 = 9 D 类;fix 2 / no-fix 2 / defer 1 / verified-with-notes 3 / cross-chain-close 1。

## 4. 1 个 HIGH D 类详情

| ID | 内容 | 修法 |
|---|---|---|
| **D-121** | Claude AI getGameState @ 36374-36679 305 行函数体零 ethos 引用 + prompt 零 ethos 上下文。**多重副作用**:(a) Claude AI 接管的外交决策无 strategyBoost/eDistBoost(仅 fallback aiDoDiplo 14492-14494 生效);(b) Claude AI 称帝**绕过** aiConsiderEnthrone mandate<30 拒绝 gate(因走 _execEnthrone @ 37888 仅查 canEnthrone 硬门槛 turn≥24/城≥10/rep≥40/非附庸,**无 mandate 检查**);(c) Claude AI 不感知价值观距离 _ethosDistance,无法做"价值观对立"外交 | (1) getGameState 添加 ethos 5 维度+tier label+_ethosDistance 表(估 50-80 token);(2) prompt 添加价值观相关指引(mandate 与称帝/strategy 与扩张);(3) 可选 _execEnthrone 加 mandate gate 对齐 aiConsiderEnthrone 15599 |

**HIGH 集中规律**:本链仅 1 HIGH,与外交链 D-099 同源(Claude AI 信息缺失模式)。架构干净度高(_applyEthosDrift 全代码唯一写口),HIGH 集中在 Claude AI 暴露面 → 印证"Claude AI 不仅缺 _exec 指令(D-099)还缺整个 ethos 子系统暴露(D-121)"的双重信息缺失。

## 5. discrepancy 命名规则更新

- 经济链:D-001~D-014
- 军事链:D-015~D-041(取消 D-034/D-039)
- 武将链:D-042~D-075(D-071 跳过)
- 政治链:D-076~D-090
- 外交链:D-091~D-120(D-098 取消,D-117 拆 a/b/c,共 31 个 finding)
- **价值观链:D-121~D-129**(共 9 个 finding,含 D-122 跨链 close)
- **事件链:从 D-130 起**

**累计 121 个跨链净 D 类**(原 113 + 价值观链净 9 - D-122 重叠 1 = 121。已审 7 链)。

## 6. 节点状态分布

| 状态 | 数 |
|---|---|
| verified | 14 |
| verified-mirror | 3(政治/SIEGE_AFTERMATH/军事链 mirror)|
| verified-with-notes | 4(A4 taxDrift/A5 漂移系数/B2 _ethosLog/D1 mandate)|
| verified-with-findings | 3(C3 processFacEthos hub/E2 事件链/E5 军事链)|
| discrepancy | 3(A6 通知阈值 D-125/C2 applyEthosShock D-125/E7 Claude AI D-121)|
| **合计** | **27** |

## 7. 与已审 6 链对比

| 链 | D 类 | HIGH | MEDIUM | LOW | 节点 | 边 |
|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | ~95 |
| 豪族链 v4 | 12 | - | - | - | ~37 | ? |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | ? |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | ? |
| 政治链 v1.1 | 15 | 3 | 5 | 7 | 45 | 90 |
| 外交链 v1.1 | 31 | 5 | 13 | 13 | 51 | 118 |
| **价值观链 v1.1** | **9** | **1** | **1** | **7** | **27** | **47** |

**价值观链特点**:
- **D 类总数最少**(9),HIGH 也最少(1)— 7 链最干净
- **节点/边数最少**(27/47)— hub 集中度高(_applyEthosDrift 唯一写口 + processFacEthos 单 hub)
- 8 LOW 中 5 是 verified-with-notes/no-fix(架构合理但有边缘行为可记录),实际需 fix 仅 2 个(D-121 + D-129)
- 跨链对账干净:与政治/军事/武将/豪族 verified-mirror,与外交链 1 cross-chain-close

## 8. 工作流方法论沉淀(基于 7 链)

继承 §二〇九.11 / §二一〇.8 / §二一一.11 / §二一二.10 / §二一三.8 方法论,本轮新增:

### 8.1 hub 集中度高 → D 类总数低
价值观链 27 节点 / 9 D 类 vs 外交链 51 节点 / 31 D 类,差异主因是**单一 hub**(processFacEthos)+ **单一写口**(_applyEthosDrift)。

**规律**:hub 集中度高的链审计起来快,但 hub 内部漂移源系数一旦多就要逐条核(本链 8 漂移源每个都验证)。审计前先看是否有"全代码唯一写口"或"单 hub 函数",有则可缩减审计 surface。

### 8.2 D 区按维度切分 vs 按动作切分
价值观链 D 区**按 5 维度切分**(D1 mandate/D2 power/D3 civil/D4 military/D5 strategy),与其他链按"动作"切分不同(经济链按收支项/军事链按战斗类型/外交链按状态变化)。

**规律**:当链的下游影响**收敛于状态字段维度**而非"动作类型"时,D 区按维度切分更清晰。审计时第一步看输出簇 — 如果按"动作"切看不出聚类,试试"维度"切分。

### 8.3 跨链 close 模式延续
D-122 = 外交链 D-095 同源,继承"政治链 D-077 = 军事链 D-021"模式。**不重复 verdict**,只标 cross-chain-close。

**规律**:跨链 D 类不做新 verdict,继承首次审计的 verdict + 标 cross-chain-close。代码 sprint 时一次性 fix 双侧。

### 8.4 节点 desc 数值偏差是常见 stage 5 发现
本轮 stage 5 发现 E2 desc "32 line"实为 33 line(40+ call)+ D1 desc 7 处口径(逻辑分组而非 read line 数)。

**规律**:Step 1 反向 grep 数节点时容易把"line"和"call"混(line 含 multi-call 行)。stage 5 节点级模糊用 awk 区间精数,避免 grep wc -l 失真。

### 8.5 灭国/eliminated 跳过逻辑应核每个 process_ 函数
D-129 (processFacEthos 不跳过 _eliminated)与历史经济链/豪族链类似议题相通。

**规律**:每条链审计时都核每个 process_xxx 主 tick 函数:`if(fid === 'rebel' || G.factions[fid]?._eliminated) return;` 二件套。

### 8.6 Claude AI 信息暴露面是隐形 D 类温床
D-121 (getGameState 缺 ethos)+ 外交链 D-099(prompt 缺 4 _exec)+ 外交链 D-100(派发器漏 enthrone case)= "Claude AI 信息缺失"三种典型。

**规律**:每条链 audit 时必看 getGameState/prompt/派发器三处 — 子系统暴露 / 指令接口 / 派发完整性。代码 sprint 后可建自动化检查工具。

### 8.7 跨链 helper read 边的取舍
本链 stage 6 补 5 dashed 边(E1/E3/E4/E5/E6 → C3 hub helper read)。

**规律**:每个 hub 函数(processFacEthos / applyWarDeclarationEffects 等)若读多链状态,补 helper read 入边能让概念图更准确。但要避免边数爆炸 — 仅补"读取产生影响"的(本链 8 漂移源对应 5 链入边,合理);不补"纯 query"的(如 ALL_FACS.includes 这类)。

## 9. 跨链对账(已审 7 链)

- ✓ 经济链 v4.3:E1 5 类输出(本链非直接关联)
- ✓ 军事链 v1.1:E5 SIEGE_AFTERMATH+G.units verified-mirror;攻克 27953 入边 + AI choice 27957 出边
- ✓ 武将链 v1.2:E4 GEN_TAGS politics/combat verified-mirror;5 出边武将忠诚价值观匹配
- ✓ 豪族链 v4:E6 强迁 4 入边 + calcFactionInfluence helper read + 屏蔽 1 出边
- ✓ 政治链 v1.1:E1 任命 4+朝议 7 入边 verified-mirror
- ✓ 外交链 v1.1:**D-122 cross-chain-close = 外交链 D-095**;9+2 入边 + 4 出边
- ⏳ 事件链(待审):E2 33 line/40+ call 入边 + 7 出边,事件链 audit 时闭合

## 10. v1.1 不做的事(再次重申)

- ❌ 不动游戏代码(包括 9 个价值观链 D 类的 2 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 / 外交链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节(本节追加为 §二一四)
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

代码 sprint 时机:等所有链 audit 完成后(剩余 **事件链** 1 条)。

## 11. 下个对话指引

**继承的素材**:
- 价值观链 v1.1 三件套(JSON / 概念图 v6.3 / walkthrough v1.0)
- 9 个价值观链 D 类全部定性,不重审
- 7 链工作流方法论(§二〇八+§二〇九.11+§二一〇.8+§二一一+§二一二+§二一三+本节)
- **D 类清单累计 121 个跨链净 D 类**(后续链 audit 时对账用)

**新对话启动**:**事件链 audit pass 1**(剩最后一条)
- 同样 5 步:Step 1 反向 grep → Step 2 节点骨架 → Step 3 6 阶段 → 概念图 → walkthrough
- 与已审 7 链同代命名(v1.0 → v1.1)
- D 类编号从 **D-130** 起

**Step 1 反向 grep 分组建议**(事件链特性):
1. 主 tick:processEvents / EVENT_REGISTRY / triggerEvent
2. 派生入口:33 类事件 condition / effect / aiChoose
3. 状态读写:G.events / G._eventCD / G._activeEvents
4. 常量:EVENT_REGISTRY 33 事件 / 7 promise 类型 / 优先级
5. 跨链入边:经济/军事/武将/政治/外交/价值观/豪族/Claude AI 都可能触发事件
6. 跨链出边:事件 effect 写入各链状态(applyEthosShock 33 line/40+ call 已在价值观链 audit 中确认 / 经济 buff / 军事变化 / 武将变化等)

**事件链特别关注**:
- 12 类事件(灾荒/疫病/水患/功臣/礼贤/流民/檄文/武将处置/劝进/治理/察举/水淹)各自 condition+effect+aiChoose 三件套完整性
- v179fix P15 系列推广不彻底模式(继承外交链 D-104/D-113 等 HIGH 集中规律,事件链可能也有平行 bug)
- Claude AI 暴露面(getGameState 是否含活跃事件,_exec 是否覆盖事件分支 — 已知 D-121 模式可能扩展)
- 与价值观链 E2 入边对账(33 line/40+ call,事件 effect 写 ethos 已在价值观链 stage 4 全核 0 D 类)

## 12. 制作人提示(本轮新增)

- **架构干净 ≠ 不审计**:价值观链 9 D 类(7 链最少)反而印证审计价值 — 即使架构干净也有 1 HIGH(D-121)+ 边缘行为(D-126/D-127/D-128 verified-with-notes 共 5 个)。**审计的价值**不仅是抓 bug,也是文档化"哪些是设计意图"。
- **Claude AI 信息暴露面是跨链共通弱点**:D-121(本链)+ D-099/D-100(外交链)= 已审 7 链中 3 个 HIGH 集中在 Claude AI 路径。**代码 sprint 后建议优先建 Claude AI 暴露面自动化检查工具**:核 getGameState 字段 vs prompt 提及 vs _exec 派发器 三处一致性。
- **D 区切分维度选择**:本链 D 区按 5 维度切分 vs 其他链按动作切分。事件链可能也面临类似抉择(33 类事件按"事件类型"切 vs 按"effect 维度"切)。**审计前先看下游影响聚类形态**,不固化方法。
- **stage 6 补边的尺度**:本链补 5 helper-read 边后边总数 42→47(增 12%),与外交链 stage 6 补 16 边(+15%)同档。**经验值:stage 6 补边数 ≈ 节点数 × 15-20%**,超过这个比例说明 Step 1 反向 grep 漏太多,需重做。

# §二一五 — 事件链 audit pass 1 完成(v1.0 → v1.1,2026-05-04)

> **本节追加,不动早期章节**。继承 §二〇八/§二〇九/§二一〇/§二一一/§二一二/§二一三/§二一四 方法论。
> **8 链 audit pass 1 全部完成 ✅**(经济/豪族/军事/武将/政治/外交/价值观/事件)

## 1. 三件套产出

- **JSON**:`event_chain_v1_1.json`(36 节点 / 63 边 / D-130~D-145 共 16 个 D 类全 verdict 锁定)
- **概念图**:`Project_Romance_Concept_Map_v6_4_events.html`(v6.3→v6.4 增量追加 events tab,topbar v6.3→v6.4 同步,默认打开事件链 tab,标题 v6.4)
- **walkthrough**:`event_chain_walkthrough_v1_0.md`(362 行,单段 v1.0 audit 完成版,因 Step 1+2+3 间隔短无双段必要)

## 2. Step 1+2 决策摘要

- **分区 5 区方案 C**(沿用)/ **颗粒度 A**(沿用)
- **Q3.1** EVENT_DEFS 34 def 按 8 categories 切分到 A 区(disaster 3 / personnel 7 / gentry 4 / story 5 / intel 4 / diplomacy 4 / daily 6 / military 1 + 元数据)
- **Q3.2** triggerFactionEvent 派系事件子系统**单立 C6 节点**(8 eventType:execute/defectorPrefect/conquer/truce/warDeclare/betray/appointPost/removePost)— mirror 武将链 genFactionMod 出口
- **Q3.3** _eventPromises 9 type 单 hub C4 checkEventPromises(_sys 2 内嵌生成 _promise_reminder + _c4_riot)
- **Q3.4** D 区按 8 目标链切分(D1 武将/D2 城市/D3 价值观 mirror/D4 经济/D5 军事/D6 外交/D7 政治/D8 豪族)— 与其他链按"动作"切分不同,因事件链 effect 写口分散到 8 链,按目标链聚类最清晰
- **Q3.5** playerOnly 不立独立节点(验证:Claude AI 13413 fid !== G.playerFac 永不接管玩家,playerOnly 与 Claude AI 路径无冲突)
- **Q4** 派生长尾 6 字段并入 B5(_poachVulnerable / _factionLoyaltyDecay / _juxiaolianBonus / _threatBonus / c._plague / c._grainBonus)

## 3. Step 3 6 阶段执行结果

| 阶段 | D 类增量 | 主要发现 |
|---|---|---|
| 1.1 Claude AI getGameState/prompt 对账 | 1 | D-130 MEDIUM defer(getGameState 305 行函数体零事件状态引用 + prompt 264 行零事件上下文 + _exec 派发器 42 case 无 event_choice + ORDER 表 37171 含 event_choice/court_choice 死代码字段) |
| 1.2 玩家/AI 静默/快进三路径横向一致性 + triggerFactionEvent 14 调用点 | 2 | D-131 HIGH fix(triggerFactionEvent 调用覆盖不全:truce 14274/16243/_execProposeAlliance 37498 漏 + warDeclare 14327/14447/14462/14540/16251/_execDeclareWar 37466/9648 全漏 + betray 14547/_execDeclareWar 37472 漏 + conquer 15989 漏)+ D-132 LOW fix(nextTurn 全局快进 16588-16603 缺 log) |
| 2 hub 完整性(C1-C6 6 hub) | 4 | D-133 HIGH fix(B4_delayed 承诺 push 后 checkEventPromises 10733 静默清除,"考察再议 3 旬后自动加入"完全失效)+ D-134 LOW fix(rollEventsV2 facs 不查 _eliminated)+ D-135 LOW verified-with-notes(general_ceremony 软 oneTime)+ D-136 LOW verified-with-notes(疫病扩散到玩家城无主动通知) |
| 3 边界 case(10 case) | 6 | D-137 MEDIUM fix(_eventQueue + _popEventQueue 死代码,玩家事件永久积压)+ D-138 LOW defer(cooldown 全局非势力维度)+ D-139 LOW verified-with-notes(_popEventQueue 验证仅查 city.fac)+ D-140 LOW verified-with-notes(4 oneTime story 暂缓=拒绝)+ D-141 LOW verified-with-notes(catCooldown=3 硬编 4 处)+ D-142 LOW verified(c._plague hopsLeft 链合理) |
| 4 散点扫描(33 events + aiChoose 决策维度) | 2 | D-143 LOW fix(return_emperor showNotif 无 gate + log 文案"主公"语气 in AI 触发;quanjin_biao 同问题)+ D-144 LOW defer(G.reputation 默认值硬编 7 处)。aiChoose 5 ETHOS / 9 PERS / 7 GOLD / 8 FIXED-0 / 3 ctx 字段全核 |
| 5 节点级模糊 | 1 | D-145 LOW fix(gen_referral_${wildName} 冷却 key 写后永不读,死代码)。stage5 偏差修正:A 区 desc 改写为列具体事件 ID + C2 节点应含 7 函数 + D 区写口数从 Step 2 草案普遍偏高修正(把 read 误算 write)+ E5 称帝链定位语义偏离 + B5 派生长尾 5→6 字段(漏 c._grainBonus)|
| 6 整体校验+补边 | 0 | 补 6 dashed helper-read 边(E2/E3/E4/E5/E6/E8 → C1 hub),边总数 64→63(stage 6 同步去重了几条重复边)|

**累计**:HIGH 2 / MEDIUM 2 / LOW 12 = 16 D 类;fix 7 / defer 3 / verified-with-notes 5 / verified 1 = 16。

## 4. 2 个 HIGH D 类详情

| ID | 内容 | 修法 |
|---|---|---|
| **D-131** | triggerFactionEvent 调用覆盖不全。多种"派系事件"语义状态在多路径中遗漏触发:**truce** 14274 玩家结盟单向漏 + 16243 自动结盟(rel≥80)漏 + _execProposeAlliance 37498 漏;**warDeclare** 仅 15590 称帝路径(语义偏离),14327/14447/14462/14540/16251/_execDeclareWar 37466/9648 全漏;**betray** 14547 AI 路径 + _execDeclareWar 37472 漏;**conquer** 15989 豪族开城迎降漏。**影响**:武将派系修正(genFactionMod)在这些路径下不更新 → 鹰鸽派/汉室死忠等派系武将的忠诚反应失真 | 每处状态变化点统一补 triggerFactionEvent 调用,或抽出 hub helper `_changeDiploStatus(fidA, fidB, newStatus)` 内统一触发 |
| **D-133** | B4_delayed 承诺机制完全失效。promise.genName 是在野武将名(创建时仍在 wildPool 未入 G.generals[fid]),checkEventPromises 10725 `gen` 查找失败 → 10733 `if(!gen) return false` 静默清除 → 永远到不了 deadline → 10848 expired wildPool 加入逻辑是死代码。"考察再议 3 旬后自动加入"功能从 v130 引入起就**完全不工作** | 10733 前补 B4_delayed 特例:`if(p.type==='B4_delayed' && p._b4data){ const _w = p._b4data.wildName; if(!G.wildPool?.includes(_w)){ fulfilled.push({p, reason:'武将已另投'}); return false; } return true; }` |

**HIGH 集中规律**:本链 2 HIGH 都是 v130(事件系统重构)引入新机制时**推广不彻底** —
- **D-131**:triggerFactionEvent 应在所有 status 变化点触发,但只覆盖了一部分路径
- **D-133**:B4_delayed 创建路径与 checkEventPromises 履约 case 链脱节,承诺类型未在 case 链中处理

与外交链 D-104/D-113(v179fix P15 系列)+ 武将链 D-066 等**"重构推广不彻底"**模式同源。

## 5. discrepancy 命名规则更新

- 经济链:D-001~D-014
- 军事链:D-015~D-041(取消 D-034/D-039)
- 武将链:D-042~D-075(D-071 跳过)
- 政治链:D-076~D-090
- 外交链:D-091~D-120(D-098 取消,D-117 拆 a/b/c,共 31 个 finding)
- 价值观链:D-121~D-129(共 9 个 finding,含 D-122 跨链 close)
- **事件链:D-130~D-145**(共 16 个 finding,无跨链 close 但 D-131/D-133/D-145 与多链 helper 关联)

**累计 137 个跨链净 D 类**(原 121 + 事件链净 16 = 137。**已审 8 链全部完成**)。

## 6. 节点状态分布

| 状态 | 数 |
|---|---|
| verified | 12 |
| verified-mirror | 6(政治/外交/军事/武将/价值观/经济/豪族 mirror)|
| verified-with-notes | 3(A8/C5 疫病扩散/E5 称帝链)|
| verified-with-findings | 10(A2/A4/A7/B1/C1/C2/D1/D6/E2/E4)|
| discrepancy | 5(B2 _eventQueue/B4 _eventPromises B4_delayed/C4 checkEventPromises B4_delayed/C6 triggerFactionEvent/E9 Claude AI)|
| **合计** | **36** |

## 7. 与已审 7 链对比

| 链 | D 类 | HIGH | MEDIUM | LOW | 节点 | 边 |
|---|---|---|---|---|---|---|
| 经济链 v4.3 | 14 | 0 | 1 | 13 | 44 | ~95 |
| 豪族链 v4 | 12 | - | - | - | ~37 | ? |
| 军事链 v1.1 | 23 | 6 | 12 | 5 | 47 | ? |
| 武将链 v1.2 | 30 | 10 | 10 | 10 | 51 | ? |
| 政治链 v1.1 | 15 | 3 | 5 | 7 | 45 | 90 |
| 外交链 v1.1 | 31 | 5 | 13 | 13 | 51 | 118 |
| 价值观链 v1.1 | 9 | 1 | 1 | 7 | 27 | 47 |
| **事件链 v1.1** | **16** | **2** | **2** | **12** | **36** | **63** |
| **8 链合计** | **150** | **27+** | **45+** | **65+** | **338** | **— ** |

**事件链特点**:
- **D 类总数 16,居中**(少于外交 31/武将 30/军事 23/政治 15,多于经济 14/豪族 12/价值观 9)
- **HIGH 2 个**(D-131/D-133)— 都是 v130 重构推广不彻底
- **节点 36 / 边 63**,hub 集中度高(C1 + C6 双 hub)
- **跨链 effect 写口最密**(295 处)— 事件链是其他链最大的事件源

## 8. 工作流方法论沉淀(基于 8 链)

继承 §二〇九.11 / §二一〇.8 / §二一一.11 / §二一二.10 / §二一三.8 / §二一四.8 方法论,本轮新增:

### 8.1 双 hub 链审计要分两阶段
事件链有 EVENT_DEFS 系统(C1 主)+ triggerFactionEvent 系统(C6 单立)两个独立 hub。**审计经验**:双 hub 链审 stage 2 hub 完整性时分两阶段 — 先核 hub 内部完整性,再核两 hub 间接口。本链确认 EVENT_DEFS effect 不调 triggerFactionEvent(独立子系统),无内部依赖。

### 8.2 重构推广不彻底是 HIGH 集中点
事件链 2 HIGH(D-131/D-133)+ 外交链 D-104/D-113 + 武将链 D-066 等都是"v130 / v179fix P15 等大重构"引入新机制时未做完整推广。**审计经验**:每次大重构后应做"接口完整性回归 audit" — 列出新机制所有应调用的 caller,逐个核实。可建自动化检查工具(如 grep `d.status='ally'` 全代码 → 核每处是否调 `triggerFactionEvent('truce')`)。

### 8.3 死代码识别五要素
事件链发现 3 处死代码(D-137 _eventQueue / D-133 B4_delayed wildPool 加入 / D-145 gen_referral_${wildName})。**审计经验**:死代码识别看 5 要素:① 字段被 init 否;② 被 push/写入否;③ 被 shift/读取否;④ 写口与读口在同一 closure 内还是跨函数;⑤ key 命名是否一致(如 `gen_referral_${wildName}` 写但 `def.id` 读,名字不匹配)。

### 8.4 跨链 helper-read 边补边经验
本链 stage 6 补 6 dashed 边(E2/E3/E4/E5/E6/E8 → C1)。比价值观链补 5 多。**审计经验**:每个主扫 hub 函数(rollEventsV2 / processFacEthos / applyWarDeclarationEffects 等)若 condition/effect 读多链状态,补 helper read 入边。事件链 condition 读跨链最频繁(GEN_TAGS 26 + G.units 22 + G.diplo 13 + G.cities 40),补边数随 condition 复杂度递增。

### 8.5 Claude AI 信息暴露面跨链共通弱点(8 链验证)
D-130(事件链)+ D-121(价值观链)+ D-099/D-100(外交链)= 已审 8 链中 4 个 D 类集中在 Claude AI 路径。**审计经验**:每条链 audit 时必看 getGameState/prompt/_exec 派发器三处 — 子系统暴露 / 指令接口 / 派发完整性。事件链 D-130 还发现 ORDER 表 37171 含 event_choice 死代码字段,**补充检查项**:派发器 case 列表 vs ORDER 表字段对账。

### 8.6 节点 desc 数值偏差是常见 stage 5 发现(8 链验证)
本轮 stage 5 发现:A 区 desc 写"line 范围"误导(事件 category 在 EVENT_DEFS 中交叉分布)+ C2 desc 应含 7 函数(漏 _updateCeremonyBtn/_confirmCeremony)+ D 区写口数把 read 误算 write(D1 武将 148→107,D6 外交 24→14,D7 政治 16→10)+ B 区 B5 漏 c._grainBonus(5→6 字段)+ E5 称帝链定位语义偏离。**审计经验**:Step 1 反向 grep 数节点时 line/call/read/write 容易混。stage 5 节点级模糊用更精确的 awk/python 区间精数 + 区分读写。

### 8.7 fastForward 路径独立审计
事件链有 4 路径处理事件(AI 静默 / 玩家弹窗 / rollEventsV2 内快进 / nextTurn 全局快进)。**审计经验**:玩家事件类系统须核所有快进/批处理路径与正常路径的一致性(cooldown 设值/oneTime 标记/log 写入是否对齐)。本轮发现 D-132 nextTurn 全局快进路径缺 log。

## 9. 跨链对账(已审 8 链)

- ✓ 经济链 v4.3:E7 出口 22(safeSub fac.res + res.gold +=)verified
- ✓ 军事链 v1.1:E3 入边 1(conquer 27949)+ 出口 22(G.units sq.morale)+ helper read 22 verified-mirror
- ✓ 武将链 v1.2:E4 入边 1(execute 23066)+ 出口 107(genLoyalty 84+genFactionMod 13+intimacy 6+statExp 4)+ helper read 60(GEN_TAGS+wildPool+generals)verified-with-findings(D-131/D-133 间接关联)
- ✓ 豪族链 v4:E8 出口 4(calcFactionInfluence read,实为 read)+ helper read 4 verified-mirror
- ✓ 政治链 v1.1:E1 入边 7(任命/卸任/setPrefect/setStrategist)+ 出口 10(courtDecrees 4+appointGenPost 3+setPrefect 3)verified-mirror
- ✓ 外交链 v1.1:**D-131 HIGH 主战场**(triggerFactionEvent caller 4 调用涉及 truce/warDeclare/betray)+ E2 出口 14(reputation 7+addDiplo 5+G.diplo 2)+ helper read 13 verified-with-findings
- ✓ 价值观链 v1.1:**D-121 cross-confirm**(本链 D-130 同源 Claude AI 信息缺失)+ E6 mirror 33 applyEthosShock 出口已 verified + helper read 7(5 ETHOS aiChoose + condition gate)
- ✓ 称帝链(语义修正):E5 入边 1(15590 doEnthrone 调 triggerFactionEvent 'warDeclare',语义偏离)+ helper read 2(G.emperor)verified-with-notes

## 10. v1.1 不做的事(再次重申)

- ❌ 不动游戏代码(包括 16 个事件链 D 类的 7 个 fix verdict)
- ❌ 不动豪族链 v4 / 经济链 v4.3 / 军事链 v1.1 / 武将链 v1.2 / 政治链 v1.1 / 外交链 v1.1 / 价值观链 v1.1 数据
- ❌ 不重写 HANDOVER 早期章节(本节追加为 §二一五)
- ❌ 不混改多个 D 类(代码 sprint 时一个 D 类对应一个 commit)

**8 链 audit pass 1 全部完成 ✅** — 代码 sprint 时机已到。

## 11. 下个对话指引

**继承的素材**:
- 事件链 v1.1 三件套(JSON / 概念图 v6.4 / walkthrough v1.0)
- 16 个事件链 D 类全部定性,不重审
- 8 链工作流方法论(§二〇八+§二〇九.11+§二一〇.8+§二一一+§二一二+§二一三+§二一四+本节)
- **D 类清单累计 137 个跨链净 D 类**(8 链 audit pass 1 全部完成)
- **跨链 D 类总清单**(见 §二一六,见后续分类整理)

**新对话启动**:**代码 sprint 启动**(8 链 audit pass 1 全部完成,可启动)

**代码 sprint 建议**:
- **先修 HIGH(按链先后)**:经济 0 / 豪族 ? / 军事 6 / 武将 10 / 政治 3 / 外交 5 / 价值观 1 / 事件 2 = **27 HIGH**
- **MEDIUM 跨链 close 先并修**:D-122(外交 D-095 = 价值观 D-122)等
- **defer 类延后**:架构债集中重构(D-123 / D-138 / D-141 / D-144 / G.reputation 默认值等中央 const 化)
- **verified-with-notes / verified 不修**:约 30 个仅文档化记录

**代码 sprint 启动建议**(基于 8 链 audit 经验):
1. 一次只动一个 D 类,一个 commit。每个 commit 含:fix loc / 测试方法 / 影响半径(其他链是否需联动)
2. HIGH 优先,MEDIUM 次之,LOW 整批合并
3. 跨链 D 类(如 D-122)双侧同时 fix,一个 commit
4. 修复后回归核三件套对应节点的 audit.status(标 verified-fixed-vXXX)

## 12. 制作人提示(本轮新增)

- **8 链 audit pass 1 全部完成 ✅**:事件链是最后一条。从 §二〇八(豪族链 v4)到本节(事件链 v1.1)累计 8 链 / 137 D 类 / 338 节点。**审计阶段告一段落**,代码 sprint 启动条件就绪。
- **事件链是 8 链中"枢纽链"**:跨链 effect 写口 295 处(其他链最大的事件源),双 hub 架构(EVENT_DEFS 系统 + triggerFactionEvent 系统),9 type 承诺机制。审计复杂度居中(16 D 类),但**修复影响半径大** — 修一个 fix 可能联动 2-3 个其他链。建议代码 sprint 启动时**优先修事件链 HIGH(D-131/D-133)**,因联动外交/武将链。
- **重构推广不彻底是 8 链共性 HIGH 模式**:事件链 D-131/D-133 + 外交链 D-104/D-113(v179fix P15)+ 武将链 D-066 等都是大重构后未做接口完整性回归。**代码 sprint 后建议优先建"重构接口回归 checker"**:列出新机制 caller,自动核覆盖率。
- **Claude AI 信息暴露面已审 8 链中 4 链有 D 类**(外交 D-099/D-100 + 价值观 D-121 + 事件 D-130)。代码 sprint 后建议**集中修 Claude AI 暴露面**:统一新建 _eventLog/_diploLog/_ethosLog 等子系统状态表 → 统一暴露给 getGameState → prompt 加配套指引。这是一个独立 epic,不在 audit 修复范围。
- **架构债集中重构 epic**:D-123(漂移系数 const)/ D-138(cooldown 维度)/ D-141(catCooldown const)/ D-144(reputation 默认值 const)等 LOW defer 类应在审计完成后做一次集中"中央 const 化重构",不要散在各 sprint 里。
- **discrepancy 命名规则验证**:8 链审计共 137 D 类,无重复编号(D-098 取消,D-117 拆 a/b/c,D-122 跨链 close 但归外交链,余 137 唯一)。**编号系统已稳定**,代码 sprint 时直接引用 D-XXX 即可。
- **下次 audit 时机**:代码 sprint 完成后再做 audit pass 2(回归测试 + 新增功能)。8 链架构稳定情况下,pass 2 工作量约 pass 1 的 30%。

