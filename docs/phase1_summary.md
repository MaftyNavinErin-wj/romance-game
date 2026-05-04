# Phase 1 Summary — 数据层抽离

> 阶段:Phase 1(REFACTOR_PLAN_v1.md §三 阶段 1)
> 完成日期:2026-05-04
> 起始 commit:`5507a3f` (phase-0 merged to main)
> 结束 commit:见本 doc 末尾"phase-1 → main 合并"段

---

## 一、目标 vs 实际

PLAN §三阶段 1 目标:把 v181.html 中的"常量定义 / 静态数据"抽到 `src/data/*.js`,**只搬运,不改逻辑**。

阶段 1 完成 7 个 sub-session,原 PLAN 估计 ~2000 行新文件,实际产出 **2913 行**(略超估计,主要因 EVENT_DEFS 单文件 2293 行)。

---

## 二、文件清单(阶段 1 终态)

| 文件 | 行数 | 来源 v181 行号(实装时) | 内容 |
|---|---|---|---|
| `src/data/constants.js` | 31 | (新建) | EVENT_CAT_COOLDOWN + REPUTATION_DEFAULT |
| `src/data/tags.js` | 102 | L814-L816 + L818-L843 + L1193-L1194 + L1215-L1252 | SEASONS+SEASON_MOD+YEARS / TAGS+getCityStats / STAGE_NAMES+STAGE_ORDER / ETHOS schema+_ethosTierLabel |
| `src/data/events.js` | 2293 | L8380-L10659 | EVENT_DEFS 34 def / 8 categories(含 D-141/D-144 替换 7 处) |
| `src/data/generals.js` | 242 | L3674-L3701 + L3703-L3731 + L3736-L3737 + L3839-L4000 | GEN_TAGS + WILD_GENS + WILD_GEN_META + getGenMeta |
| `src/data/cities.js` | 180 | L2088-L2152 + L2160 + L2162-L2169 + L2171-L2215 + L2217-L2224 + L2305-L2324 | CITIES_DEF + CITY_MAP + 3 region Sets/helpers + ROADS + ROAD_ADJ + RIVERS |
| `src/data/factions.js` | 65 | L1184-L1193 + L1199-L1209 + L1234-L1239 + L1638-L1646 | FAC + ALL_FACS + PLAYABLE_FACS + FAC_IDENTITY + ETHOS_INIT + DIPLO_INIT |
| **合计** | **2913** | | |

v181.html 行数变化:**39547 → 36799 行**(-2748,~7% 减重)。差距:抽出 2913 行 + 注释头 ≈ 抽出量 vs 删除量,加上 6 个 `<script src=...>` tag 增加 6 行,数学一致。

---

## 三、Sub-session 进度

| Session | 提交 | 净行数变化 |
|---|---|---|
| 1.1 EVENT_DEFS → events.js | `d8c52c5` | v181 -2280 / events.js +2293 |
| 1.2 GEN_TAGS + 在野池 → generals.js | `f9bae4e` | v181 -220 / generals.js +242 |
| 1.3 城市 + 地理 → cities.js | `439b162` | v181 -147 / cities.js +180 |
| 1.4 势力 + 君主 + ethos 初始 → factions.js | `cdb97bb` | v181 -35 / factions.js +65 |
| 1.5 magic number 集中化(D-141 + D-144) → constants.js | `4e514fe` | v181 +1(只加 script tag,inline 替换 15 处) / events.js 0(inline 替换 7 处) / constants.js +31 |
| 1.6 共用枚举 → tags.js | `1993a65` | v181 -68 / tags.js +102 |
| 1.7 收尾 + summary | (本 commit) | docs/phase1_summary.md + tests/baseline/phase1_complete.json |

---

## 四、D 类自然 close 记录

### close(2 个,均通过 1.5 抽离副产物)
- **D-141**:`G._eventCatCooldown[X] = 3` 硬编 4 处 → `EVENT_CAT_COOLDOWN`(constants.js)
  - commit message:`closes D-141 via centralization`
- **D-144**:`G.reputation[X] || 50` / `?? 50` 硬编 22 处(15 in v181 + 7 in events.js)→ `REPUTATION_DEFAULT`(constants.js)
  - commit message:`closes D-144 via centralization`

### deferred(留 sprint,严格判定不通过 CLAUDE.md L83 "修复 = 抽离副产物")
- **D-123**:ethos 漂移系数。所有系数都在 `processFacEthos` 函数内部单点使用,抽到 const 只是 literal→named const,不形成跨文件中心化。属于 phase 3 chains/ethos.js 机制层重构范围。
- **D-145**:`gen_referral` 死代码 key。1.2 抽 GEN_TAGS 时未识别清晰的"抽离副产物"死 key(gen_referral 不直接读 GEN_TAGS 字段)。verbatim 搬运全表。
- **D-007 / D-080 / D-085 / D-089 / D-138**:都是 bug fix / 设计变更类,不是 magic number 抽离,严格不在阶段 1 范围。

阶段 1 自然 close 总计:**2 个 LOW defer**(原 PLAN 估计 5-9 个,差距来源于严格判定标准,不主动 fix bug)。

---

## 五、关键技术发现

### 5.1 `let` 顶层声明不挂 window
v181 用 `let G = {...}` 在脚本顶层声明。`let`/`const` 顶层不挂 window(只有 `var` 和 function 声明会)。但**同 realm classic `<script>` 共享 script-scope lexical environment** — 多个 classic script 之间可以互相访问彼此的 `let`/`const` 顶层声明。所有 `src/data/*.js` 抽离都依赖这个特性。

smoke.js 也利用了同样机制:在 jsdom 内注入新 `<script>` 拿 `let G`(`window.__G__ = G`)+ 设 `_fastForward`(`window.__setFF__`)。

### 5.2 `_fastForward` 是 v181 自带 headless 推进开关
v181 L25073(原行号)`let _fastForward = false`,在 nextTurn (L16588-L16626 ff 分支) 自动消化 `_pendingEvent` + 战斗 + 不 renderAll。smoke.js 整个 50 turn 都开 ff=true。默认路径(ff=false)在 jsdom 下会卡住,因为 G._pendingEvent 一旦设了下次 nextTurn 直接 return。

### 5.3 REFACTOR_PLAN §四 字段命名与 v181 真实结构大幅偏离
PLAN 写的字段名与 v181 实际 G 结构有 ~10 处不一致(如 ethos 4 维 vs 5 维,资源在 res 不在 faction 顶层,reputation 在 G 顶层等)。校准映射记在 `tests/README.md §三`,**不改 PLAN**(硬规则 #1)。

### 5.4 第一层 smoke 的局限
seed `project_romance_test_seed_001` 下 50 turn **没有任何事件触发**(G.logs.length 始终为 8)。意味着第一层 smoke 测不到 EVENT_DEFS callbacks 的 condition/choices/effect/aiChoose 路径,只能证明 `EVENT_DEFS.forEach` 在 `rollEventsV2` 中正常迭代 + 其他系统不受影响。**抽离 callbacks 内部 bug 无法被第一层 smoke 检测到**。

为缓解此局限,制作人在每个 sub-session 完成后手动实玩 5-10 分钟做 UI/事件触发验证(已写入 memory)。

阶段 2.0(PLAN §三阶段 2.0)将引入第二层 smoke(决策路径采样:cityChangeLog / diploChangeLog / loyaltyCrossLog / eventTriggerLog),覆盖事件触发顺序。

---

## 六、遇到的边缘 case

### 6.1 CITIES_DEF.forEach hexToPixel side-effect 留 v181
1.3 抽 CITIES_DEF 时,L2155-L2158 有一段 `CITIES_DEF.forEach(c => {c.x = hexToPixel(c.q,c.r).x; ...})`。这段依赖 `hexToPixel` 函数(在 v181 主 script 中)。如果把 forEach 也搬到 cities.js 顶层,加载时 hexToPixel 尚未声明会抛错。**留在 v181 inline 让两个 script 都加载完后再执行**,行为不变(forEach 修改的 city 对象引用相同,CITY_MAP 也持有同引用)。

### 6.2 1.5 是首个修改 v181 内联代码的 session
1.1-1.4 + 1.6 都是纯搬运(verbatim 块移动)。1.5 是 magic number 替换,**修改了 v181 内联代码**(把 hardcoded `3` 改为 `EVENT_CAT_COOLDOWN`,把 `||50` 改为 `||REPUTATION_DEFAULT`)。用 Node 脚本批量正则替换跨 v181 + events.js 两个文件 26 处。`tests/scratch_apply_p1_5.mjs` 临时脚本执行完即删,不进 git。smoke baseline byte-identical 证明值等价。

### 6.3 文件加载顺序最终
```html
<script src="src/data/constants.js"></script>  <!-- 1.5 -->
<script src="src/data/tags.js"></script>       <!-- 1.6 -->
<script src="src/data/events.js"></script>     <!-- 1.1 -->
<script src="src/data/generals.js"></script>   <!-- 1.2 -->
<script src="src/data/cities.js"></script>     <!-- 1.3 -->
<script src="src/data/factions.js"></script>   <!-- 1.4 -->
<script>...v181 inline...</script>             <!-- 主代码 -->
```

constants/tags 放最前(基础数据),events.js 之后是其余 data,最后是 v181 主 script。同 realm 共享 script-scope 让任何脚本可以访问任何脚本的 `let`/`const` 顶层声明(lazy resolve 在 callbacks 调用时)。

### 6.4 phase1_complete.json vs v181_pre_refactor.json byte 不严格一致
PLAN 说"phase1_complete.json == v181_pre_refactor.json(必须完全一致)"。
- snapshots 部分:**byte-identical**(stringified JSON 长度完全相等,compare.js PASS)
- meta 部分:不一致(`generated_at` 时间戳每次都不同;v181_pre_refactor 是 2026-05-04T07:37,phase1_complete 是 2026-05-04T10:18)
- compare.js 设计上**只 diff `snapshots`**,所以 PASS = "行为完全一致"

实际仓库存储:git 在 commit 时 LF 标准化,working tree 上 v181_pre_refactor.json 因为之前 checkout 转成 CRLF,phase1_complete.json 是 Node 刚写的 LF。size 差 142KB 全部来自 CRLF/LF 差,与数据无关。

---

## 七、阶段 2 启动准备

阶段 2(PLAN §三阶段 2)目标:把 DOM 操作 / 弹窗 / 通知 / UI 渲染从 v181.html 抽到 `src/render/*.js`。

阶段 2 启动前必做:
- **Session 2.0**:smoke test 第二层升级(在游戏代码插入 5-8 个关键状态变化 hook,累计记录到 cityChangeLog/diploChangeLog/loyaltyCrossLog/eventTriggerLog/factionModLog,扩展 phase1_complete.json 增加第二层数据)
- 这是阶段 2 的前置必做项,因为渲染抽离可能改变弹窗时序间接影响事件触发

阶段 2 共 7 个 session(2.0 升级 + 2.1 notifications + 2.2 modals + 2.3 ui_panels + 2.4 ceremonies + 2.5 tooltips + 2.6 收尾)。

---

## 八、phase-1 → main 合并

合并方式:`git merge --no-ff refactor/phase-1`(保留 phase-1 分支历史,便于追溯每个 sub-session)。

合并 commit hash 见 main 分支 git log。phase-1 远程分支可保留(参考)或删除(已合并完成)。
