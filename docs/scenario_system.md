# Project Romance — Scenario System Design v3.5

> 多剧本支持架构设计文档(v3.5,基于 codex trial 1+2+3+4+5 feedback 迭代)。
> 启动 190 剧本(讨董前夕)落地,长期支持 N scenarios。
> 设计原则:**玩法机制 vs 数据正交,scenario 切的是初始状态,不是 rule**。
> 状态:design phase v3.3,等 codex trial 6 LGTM + 制作人 approve 后启动阶段 1a。

---

## 1. v 历史

| 版本 | 状态 | 关键变化 |
|---|---|---|
| v1.0 | codex trial 1 NEEDS-WORK | 主架构方向定:主表 + scenario 切片(Option B) |
| v2.0 | codex trial 2 NEEDS-WORK(P1 缩小) | 加 materializeScenario 单一 rebuild / status enum / 出山年 / validators / hardcoded cleanup phase |
| v3.0 | codex trial 3 NEEDS-WORK narrow | schema 字段补全(merit/intimacy/wildData)/ 1b 拆 4 步渐进 / pending wildData 完整 / 10+ validator corner case / nanman_190 vs nanman 拆 / Q1/Q2 close |
| v3.1 | codex trial 4 NEEDS-WORK | nanman 改 alias 延迟到 1d / wildData 加 accessor contract / 1b-1 sync mechanic 具体化 (mutable container) / validator 补 8 项 / FAC_IDENTITY runtime state 分离 |
| v3.2 | codex trial 5 NEEDS-WORK | stale nanman_214/190 残留全清 / F.4 vs K.1 冲突 resolve / pending visibility filter 具体化 §5.5 / 1b-1→1c FAC_IDENTITY split-brain 防御规则 / validator 加 L (wild lookup safety) + M (stale ID grep gate) |
| v3.3 | (制作人 approve 待) | §8.3 FAC_IDENTITY/G.facIdentity 两套迁移指令统一为单一 accessor backing switch 路径 / 代码任何阶段严禁直接读写 G.facIdentity[...] |
| v3.4 | (制作人 approve 待) | §5.6 武将死亡机制:GEN_BASE 加 deathCause(natural/violent/null)/ 机制 1 剧本成员过滤(史实 deathYear)/ 机制 2 游戏内自然死亡(natural 用 deathYear,violent/null 用算出来的自然寿命 birthYear+60+roll)|
| v3.5 | (本) | §8.4 Runtime data wire 切片(W1-W6):§7.2 完整 materialized contract 实装补全 + initGame 改读 materialized output。codex design review 通过(计划可行 + 3 处核心调整已吸收)|

---

## 2. 背景 & 动机

(同 v2 §2,不重复)

---

## 3. Schema(v3.0 字段完整)

### 3.1 GEN_BASE — 武将主表

```js
const GEN_BASE = {
  关羽: {
    // ── 战力(cross-scenario fix)──
    com:96, war:98, int:74, pol:62, cha:88,
    apt:{cavalry:'A',light:'S',heavy:'A',archer:'B',siege:'B',naval:'A'},

    // ── 时间线史实参考 ──
    birthYear: 160, deathYear: 220,
    debutYear: 184,            // 史实首次仕官年默认,scenario 可 override
    deathCause: 'violent',     // 'natural'(病死/老死) | 'violent'(战死/处决/遇刺) | null(史载不详),详 §5.6

    // ── 史实不变 ──
    birthplace: '河东解县',
    clan: '河东关氏',
    gentry: null,
    faction_clan: null,        // 内政派系归属(谯沛 / 颍川 etc),null = 不属任何派系
    classTag: 'warrior',       // 武将主分类
    classTagsAll: ['warrior','commander'],  // 全分类(GEN_CLASS,多类武将完整列出)
    values: ['忠义','汉室死忠'],  // 武将固有性格 tag(忠义 / 投机 / 野心 / 汉室死忠 等)

    // ── timeless skills(满级能力,关羽巅峰技能)──
    skills: [
      { id:'shenwei', name:'神威', type:'被动', icon:'⚔', desc:'...' },
    ],
  },
  // ... ~220 武将
};
```

**Q1 (v2 Open) 关闭决议**:GEN_BASE.skills = **武将史实最高级能力**(满级),scenario.generals[name].skillsOverride 可减(年轻关羽没"神威"全套),阶段 6 年龄 hook 实装 timeline 解锁(初版不做)。

### 3.2 CITY_BASE — 城市主表

(同 v2 §3.2)

### 3.3 FACTION_BASE — 势力主表

```js
const FACTION_BASE = {
  // ── 214 势力 ──
  wei: { name:'魏', full:'曹魏', color:'#1a5f8a', cls:'wei' },
  shu: { name:'蜀', full:'蜀汉', color:'#1a7a3a', cls:'shu' },
  wu:  { name:'吴', full:'孙吴', color:'#a82a1a', cls:'wu' },
  // nanman: 214 + 190 共享 entry,实际 ruler/edges 由 scenario.factions[nanman].ruler 等给出。
  // (codex trial 3 P1.1 catch: nanman_214/nanman_190 拆分跟 1a byte-identical 冲突,
  //  现有代码 G.reputation.nanman / FAC_IDENTITY.nanman / DIPLO_INIT keys / CSS class 全用 'nanman'。
  //  v3.1 改:同 entry,scenario 字段决定 runtime 差异;若未来 190 nanman 跟 214 nanman 政治结构差异过大,
  //  再分 entry 由 alias layer 处理。)
  nanman: { name:'蛮', full:'南蛮', color:'#8b6914', cls:'nanman' },

  // ── 190 势力 ──
  dongzhuo:   { name:'董',full:'董卓',color:'#5a2a3a',cls:'dongzhuo' },
  yuanshao:   { name:'袁',full:'袁绍',color:'#3a5a8a',cls:'yuanshao' },
  caocao:     { name:'曹',full:'曹操',color:'#1a4a7a',cls:'caocao' },
  sunjian:    { name:'孙',full:'孙坚',color:'#8a1a1a',cls:'sunjian' },
  gongsunzan: { name:'公孙',full:'公孙瓒',color:'#cccccc',cls:'gongsunzan' },
  liubei:     { name:'刘',full:'刘备',color:'#1a6a3a',cls:'liubei' },
  yuanshu:    { name:'袁术',full:'袁术',color:'#5a4a3a',cls:'yuanshu' },
  matenghan:  { name:'凉',full:'马腾韩遂',color:'#7a4a1a',cls:'matenghan' },
  liubiao:    { name:'刘表',full:'刘表',color:'#3a7a4a',cls:'liubiao' },
  liuyan:     { name:'刘焉',full:'刘焉',color:'#5a3a5a',cls:'liuyan' },
  liuyu:      { name:'刘虞',full:'刘虞',color:'#3a3a8a',cls:'liuyu' },
  taoqian:    { name:'陶',full:'陶谦',color:'#5a5a3a',cls:'taoqian' },
  hanfu:      { name:'韩',full:'韩馥',color:'#3a4a4a',cls:'hanfu' },
  kongrong:   { name:'孔',full:'孔融',color:'#4a3a3a',cls:'kongrong' },
  // 190 nanman: 共享同 entry,见上方 nanman 注释
};
```

**P2.4 codex 应对(v3.1 修订)**:trial 3 catch — nanman_214/nanman_190 拆 id 跟 1a byte-identical 冲突(现有代码 `G.reputation.nanman` / `FAC_IDENTITY.nanman` / `DIPLO_INIT` keys / CSS class 全用 `'nanman'`)。v3.1 改 **同 entry 复用**,差异通过 `scenario.factions[nanman].ruler / .stage / .traits` 表达;CSS / 渲染层 0 修改。如未来 190 nanman 政治结构跟 214 差距过大,通过 §11 alias layer 处理(延迟到 1d 后)。

### 3.4 SCENARIO_xxx — 剧本切片(v3 完整 schema)

```js
const SCENARIO_214 = {
  // ── 元 ──
  id: '214',
  version: '1.0',                          // P3.2 codex 应对,数据 patch 版本
  name: '三足鼎立',
  startYear: 214,
  description: '东汉建安十九年...',
  provenance: '...',                      // 数据来源(三国志/演义/某 mod 等)

  // ── 开局叙事 log(initGame 末尾 verbatim;§8.4 W1 加)──
  initLog: [                              // [[msg, type], ...]
    ['⚔ 建安十九年...', 'event'],
    ['📜 关羽镇守荆州...', 'event'],
  ],

  // ── 该剧本存在的势力 ──
  factions: {
    wei: {
      ruler: '曹操',
      playable: true,
      // 身份 + 演进
      type: 'emperor_holder', _baseType: 'warlord', traits: ['枭雄'],
      stage: 'regime', anchorState: null,
      // 价值观
      ethos: { mandate:15, power:20, civil:0, military:10, strategy:15 },
      // 起手资源 (runtime: 仅 4 字段, food 在 city.storage 不在 faction.res)
      res: { gold:10000, wood:2000, iron:1400, horses:4000 },
      // 起手声望
      reputation: 75,
      // 挟天子
      emperor: true,
      // 起手已研究科技
      techPreunlock: ['mil1','econ4','pol1'],   // 1a 阶段真值; tech id 须 ∈ TECH_TREE (validator G.6)
      // AI 性格(参数化,§10 cleanup 解放 hardcoded)
      aiPersonality: { atkThreshold:0.50, siegeThreshold:0.50, diploAggro:0.65, deployBias:+0.15, budgetBias:+0.10 },
      // 创业班底(显示 + 内部 boost)
      foundingCore: ['曹操','夏侯惇','夏侯渊','曹仁','曹洪','荀彧','郭嘉'],
    },
    // ... shu/wu/nanman
  },

  // ── 初始外交 ──
  diplo: [
    // [fac1, fac2, value, status]
    ['wei','shu',-30,'enemy'],
    // ...
  ],

  // ── 城市(必列全 CITY_BASE; 1a 阶段 45 城, 1f/1f-p2/1f-p3 累计扩 10 → 55 城)──
  cities: {
    xuchang: { fac:'wei', pop:425000, troops:4000, isCapital:true },
    // ... 全 45 城 (1a) / 55 城 (1f-p3 之后, 含 河北 bohai/pingyuan/zhuojun + 徐州 xiaopei/donghai/langya + 江东 suzhou + 荆南 wuling + 关陇 shangdang/anding)
  },

  // ── 武将(只列出场,unavailable 不列;validator 用 GEN_BASE.birthYear/deathYear filter)──
  generals: {
    曹操: {
      status: 'active',
      fac: 'wei', city: 'xuchang',
      role: 'ruler',                       // ruler|strategist|prefect|null
      post: { name:'魏王', rank:'王', desc:'...' },
      title: '治世能臣',                    // override GEN_META.title
      loyalty: 95,
      merit: 950,                          // 起手军功(从 MERIT_INIT)
      retainer: { count:2000, type:'cavalry' },
      initialUnit: true,                   // 起手 G.units 上(独立部队)
      // 起手关系(双向)
      relations: [
        { target:'夏侯惇', type:'义兄弟', intimacy:90 },
        { target:'荀彧',   type:'谋主',  intimacy:85 },
      ],
      // 起手 skills override(可选)
      skillsOverride: null,                // null = 用 GEN_BASE.skills 全部
    },
    关羽: {
      status:'active', fac:'shu', city:'jingzhou', role:null,
      post:{name:'前将军',rank:'将'}, loyalty:95, merit:850,
      retainer:{count:1500, type:'light'}, initialUnit:true,
      relations:[
        {target:'刘备', type:'兄长', intimacy:100},
        {target:'张飞', type:'结义弟', intimacy:95},
      ],
    },
    诸葛亮: {
      status:'active', fac:'shu', city:'chengdu', role:'strategist',
      post:{name:'丞相',rank:'文官'}, loyalty:100, merit:920,
      retainer:{count:600, type:'siege'}, initialUnit:true,
      relations:[...],
    },
    // 在野武将(WILD_GEN_META 替代)
    徐庶: {
      status:'wild', fac:'wild',
      // wildData = 该武将在 wildPool 时的元数据(替代旧 WILD_GEN_META 字段)
      wildData: {
        title:'单福·颍川名士',
        post:{name:'军师',rank:'文官',desc:'...'},
        loyalty:70, merit:500,
        regionHint:'颍川',                 // 招募 region bonus 用
        clanHint:'颍川徐氏',
        retainer:{count:0, type:'light'},  // 在野无部曲
        relations:[
          {target:'诸葛亮', type:'挚友', intimacy:85},
          {target:'庞统',   type:'同窗', intimacy:75},
        ],
        skillsOverride: null,
      },
    },
    // pending 武将(未到出山年,等 G.year >= availableYear 进 wildPool)
    邓艾: {
      status:'pending',
      availableYear: 240,
      // 出山后入 wildPool 用的完整数据(替代旧 minTurn 简单字段)
      wildData: {
        title:'偷渡阴平',
        post:{name:'合围',rank:'将',desc:'...'},
        loyalty:78, merit:0,
        regionHint:'义阳棘阳',
        retainer:{count:0, type:'light'},
        relations:[
          {target:'钟会', type:'宿敌', intimacy:30},
        ],
        skillsOverride: null,
      },
    },
    // unavailable 武将(未出生 / 已死):不列
    // 司马昭(211 生): 214 时 3 岁,可 status:'pending' availableYear:230(史实)
    // 1a.3 扩展: GENS_FULL 内 minTurn>1 武将(v181 _pendingFac 语义),用 pendingFac 字段
    //   - status='pending' + pendingFac='wei' → 出山时直接 ACTIVE in wei.generals
    //   - 区别于 标准 pending (无 pendingFac, 出山时入 wildPool)
    司马昭: {
      status:'pending',
      pendingFac:'wei',   // 1a.3 扩展: GENS_FULL.wei minTurn>1 → 出山直接进 wei
      availableYear:218,  // minTurn 153 → 214 + floor(152/36) = 218 (从史实 230 改自动派生)
      wildData: { title:'路人皆知', post:{name:'大将军',rank:'文官'}, loyalty:88, merit:10, retainer:{count:0,type:null}, relations:[], skillsOverride:null },
    },
    // 张角(184 已死): 不列,validator 会 catch 列了的错
  },

  // ── 起手亲密度对(P1.1 codex INTIMACY_PRESET)──
  // 设计意图 (§6.3): INTIMACY_PRESET 全收编 to relations.intimacy
  // 1a.3 实现 (codex trial 1 P1.1):
  //   每个 INTIMACY_PRESET pair (a,b,v) 双方 ∈ scenario.generals → 双向 mirror:
  //     - a.relations 含 {target:b, type:<GEN_META 或 null>, intimacy:v}
  //     - b.relations 含 {target:a, type:<GEN_META 或 null>, intimacy:v}
  //   GEN_META 提供 type → 一向 typed entry; INTIMACY_PRESET orphan → type=null entry
  // 显式 intimacyPairs 数组: 不存在 (设计意图: 无双书写)

  // ── 在野池显式列表(P1.3 codex pendingGenPool wildData 全)──
  // 隐式:由 generals.{status='wild' or 'pending'} 派生,不重复
};

// 1a.3 扩展 (codex trial 1 P1.2): 起手野战 squad 完整 spec
// retainer (亲卫部曲) ≠ initialUnit (起手 squad), 两套独立数据.
// 1b materializeScenario 读 scenario.initialUnits 重建 G.units byte-identical.
const SCENARIO_214_initialUnits_example = [
  { fac:'wei', city:'xuchang', squads:[
    { genName:'曹操', type:'cavalry', troops:3000, maxTroops:3000, morale:88 },
    { genName:'许褚', type:'heavy',   troops:2500, maxTroops:2500, morale:85 },
  ]},
  // ... 7 units / 14 squads 全列
];
```

**字段说明**(v3.0 完整覆盖 codex P1.1):

| scenario.generals[name] 字段 | 适用 status | 替代旧 |
|---|---|---|
| `status` | 全 | 新 |
| `fac` | active(wild = 'wild' literal,pending = 'wild' literal) | 旧 GENS_FULL[fac] 顶层归属 |
| `city` | active | 旧 day-1 G.units 分配 |
| `role` | active | 旧 G.generals[fac][i].role |
| `post` | active(wild/pending 用 wildData.post) | 旧 GEN_META.post + 玩家任命 |
| `title` | active | 旧 GEN_META.title |
| `loyalty` | active(wild/pending 用 wildData.loyalty) | 旧 GEN_META.loyalty |
| `merit` | active | 旧 `MERIT_INIT` |
| `retainer` | active(wild/pending 用 wildData.retainer) | 旧 `RETAINER_PRESET` |
| `initialUnit` | active | 旧 initGame.initUnits |
| `relations` | active(wild/pending 用 wildData.relations) | 旧 GEN_META.relations + INTIMACY_PRESET |
| `skillsOverride` | active(wild/pending 用 wildData.skillsOverride) | 新(GEN_BASE.skills override) |
| `availableYear` | pending | 旧 WILD_GENS.minTurn |
| `wildData` | wild/pending | 旧 WILD_GEN_META |
| `pendingFac` | pending (optional, 1a.3 扩展) | 旧 GENS_FULL minTurn>1 + _pendingFac 语义 |

### 3.5 status enum 详

(同 v2 §3.5,无变化)

### 3.6 文件组织

```
src/data/
├── general_base.js     (新)
├── city_base.js        (新)
├── faction_base.js     (新)
├── scenarios/
│   ├── index.js        (新, SCENARIOS register)
│   ├── 214.js          (新, 1a 阶段)
│   └── 190.js          (新, 2-4 阶段)
├── ...(其余同 v2)
```

---

## 4. 190 配置清单

(同 v2 §4。v3.1 修订:190 nanman 沿用 `nanman` 同 entry,差异通过 scenario.factions[nanman].ruler / stage / traits 表达,见 §3.3 / §11)

---

## 5. 武将出场规则(v3 简化版)

```
scenario.generals[name] 未列                          → 不出现
scenario.generals[name].status === 'active'            → 起手在 G.generals[fac] + G.units
scenario.generals[name].status === 'wild'              → 起手在 G.wildPool(wildData 装配)
scenario.generals[name].status === 'pending'           → G.pendingGenPool,G.year >= availableYear 时转 wildPool(wildData 装配)
```

**运行时 transition**:
```js
// nextTurn 内 (现 refreshWildPool 改造):
for (const [name, data] of Object.entries(G.pendingGenPool)) {
  if (G.year >= data.availableYear) {
    G.wildPool.push(name);
    G.wildPoolMeta[name] = data.wildData;
    delete G.pendingGenPool[name];
  }
}
```

`G.pendingGenPool[name]` 完整存:`{availableYear, wildData: {...}}`,wildData 跟 wild 状态武将的 wildData 同 schema。

### 5.4 runtime wild general lookup contract(codex trial 3 P1.2 应对)

**问题**:现有代码用 `WILD_GENS.find(g => g.name === name)` 大量查在野武将定义(`general.js:967/1067/1103/1480/1483/1485`),如果 materializeScenario 只把当前 wild 装进 WILD_GENS,pending 出场后入 wildPool 但 WILD_GENS 找不到 → recruit UI 渲染 + recruit 逻辑断。

**v3.1 决议**:
1. `materialized.WILD_GENS` **预包含**全 wild + pending entries(战力 / apt 来自 GEN_BASE,元数据来自 wildData)。pending 通过 `G.pendingGenPool[name]` 控制可见性,WILD_GENS 内 entry 在 pending 期间不进 wildPool。
2. 加 `src/core/scenario_accessors.js` 中 `getWildGenDef(name)` 单一入口:
   ```js
   function getWildGenDef(name) {
     return G._wildGenDefs?.[name] || null;  // 内部 cache, 1b-1 同步 materialized.WILD_GENS 进 G._wildGenDefs
   }
   function getWildGenMeta(name) {
     return G.wildPoolMeta?.[name] || G._wildGenMetaInit?.[name] || null;
   }
   ```
3. 阶段 1c module-by-module 把 `WILD_GENS.find(...)` 改 `getWildGenDef(...)`,同期 grep verify。

**G state 字段**:
- `G._wildGenDefs[name] = {name, com, war, ...apt, classTag, ...}` — 战力定义(从 GEN_BASE 派生)
- `G.wildPoolMeta[name] = {title, post, loyalty, merit, retainer, relations, ...}` — 元数据(从 wildData)
- `G._wildGenMetaInit[name]` = scenario.generals[name].wildData 镜像(initGame 时刻 snapshot),用于 fallback 查询

### 5.5 refreshWildPool + UI 可见性 filter(codex trial 4 P1.2 应对)

**pending 武将可见性约束**:

| 场景 | 可见 | 数据源 |
|---|---|---|
| `refreshWildPool()` 把 wild 推 `G.wildPool` | **仅 status='wild'**(初始 G.wildPool 起手填充 + 后续招募失败 retry 等)| materialized.WILD_GENS ∩ scenario.generals[name].status=='wild' |
| `G.pendingGenPool[name]` 转 `G.wildPool` | `G.year >= availableYear` 时(详 §5.3 runtime transition)| G.pendingGenPool |
| recruit UI(在野列表 modal)显示 | 只显示 `G.wildPool[]` 中实际 entries,**不显示 pending**(pending 武将不该被招募)| G.wildPool |
| "尚未入世"提示 UI(志在四方 / 武将索引)显示 | 显示 G.pendingGenPool 含 name + availableYear 但**禁用招募按钮** | G.pendingGenPool |

**实装规则**(阶段 1c 改造时):
- `refreshWildPool()` 现读 `WILD_GENS[].minTurn` → 改读 `G.scenarioWildList`(initGame 时 materialized.WILD_GENS 中 status='wild' filter,initialize 入 `G._wildGenDefs` 还是把 status field 留 entry 内供 filter — 后者更简洁)
- recruit UI 现 grep `WILD_GENS.find(...)` 改用 `getWildGenDef(name)` accessor
- "尚未入世"UI 当前未实装 → 阶段 5 启动 UI 时加(展示 G.pendingGenPool)

### 5.6 武将死亡机制(v3.4 新增)

#### 设计背景

`GEN_BASE.deathYear` 是史实死亡年,但混了两种语义:

- **病死/老死**(郭嘉 207 病逝、曹操 220 老死):跟历史情境无关,玩家改变不了 → 该作硬触发
- **战死/横死**(颜良 200 战死、吕布 198 处决、孙坚 192 战死):特定历史情境下被杀,玩家可能已改变该情境(没让颜良去白马) → 不该作硬触发,否则壮年猛将"突然老死",伤害体验

#### `deathCause` 字段

GEN_BASE 加 `deathCause: 'natural' | 'violent' | null`,**史实不变字段**。分类依据硬史实(史料死因明确)。

- `natural` / `violent` —— 有 deathYear 且史料死因明确的(176 entries)
- `null` —— `deathYear` 也是 null 的(36 entries,史载不详)。跟 `deathYear: null` 语义一致,runtime 当 `violent` 同样处理(算自然寿命),但不贴假 label。

#### 机制 1 — 剧本成员过滤(load-time / audit-time)

- 规则:`史实 deathYear >= scenario.startYear` → 武将可进该剧本名册;反之不进。`deathYear = null` 视为永远可进。
- **全员适用,不分 deathCause**。
- 例:颜良(史实 d.200)→ 190 剧本(startYear 190)在场;214 剧本(startYear 214)不在场。
- 用途:剧本名册 audit / 新建剧本时筛选可出场武将。

#### 机制 2 — 游戏内自然死亡(runtime,阶段 6 wire)

| deathCause | 游戏内自然死亡年 |
|---|---|
| `natural` | 死于 `deathYear`(± 小随机)。郭嘉游戏内 ~207 病死,逆天改命无效 |
| `violent` | **不用 `deathYear`**,改用算出来的自然寿命 `birthYear + 60 + roll(0..20)`(寿 60~80)。颜良 b169 → 自然死 ~229–249 |
| `null` | 同 `violent`:用算出来的自然寿命(`deathYear` 本身也是 null,无可用值)|

- runtime 规则简化为:`deathCause === 'natural' && deathYear != null → 用 deathYear;否则 → 算自然寿命`。
- `violent` / `null` 武将**提前死**只能靠 `killGen`(战斗 / 单挑 / 处决 / 事件),与年份无关 —— 同现有 v181 机制。

#### 自然寿命的归属

算出来的自然寿命是 **runtime 值**,阶段 6 wire 时在 `materializeScenario` / load 时算入 G state(per-playthrough),**不进 GEN_BASE**(GEN_BASE 只存史实不变字段)。

#### 为什么保留史实 deathYear 不覆盖

机制 1 需要史实 deathYear,且对**每个未来剧本**都要用(多剧本架构)。若把 `violent` 的 deathYear 覆盖成算出来的寿命,史实丢失,机制 1 只能用一次后失效。`deathCause`(1 字段)成本远低于覆盖的代价。同时 GEN_BASE header 契约即"史实不变",覆盖违反契约。

#### year 用途总表

| 要算什么 | 调哪个 year |
|---|---|
| 武将进不进某剧本 | 史实 `deathYear`(全员,不分死因)|
| `natural` 武将游戏内何时死 | 史实 `deathYear` |
| `violent` / `null` 武将游戏内何时死 | `birthYear + 60 + roll(0..20)`(史实 deathYear 不用)|
| `violent` / `null` 武将提前死 | `killGen`(战斗/事件),不靠年份 |

#### 跟出场端(debutYear)的对称

死亡端(本节)管"武将退场";出场端管"武将入场" —— `debutYear > scenario.startYear` → status `pending`(详 §5.3 / §3.5)。两端共同界定武将在某剧本的"生命窗口"。

---

## 6. 关系图模型(v3,简化合并 intimacy)

### 6.1 schema(同 v2 §6.1)

`relations[i] = {target, type, intimacy}` — intimacy 0-100。

### 6.2 INTIMACY_PRESET 收编

旧 `INTIMACY_PRESET = [['关羽','张飞',95], ...]` 80+ 关系数据 **全收编**进各武将 `relations[].intimacy`。validator 检查双向 intimacy 一致(差 > 5 即报)。

### 6.3 双向 + validator

(同 v2 §6.3,validator 加 self-reference + duplicate edge check)

---

## 7. initGame 改造 + materializeScenario(v3 pure transform)

### 7.1 单一 controlled rebuild 入口

`materializeScenario(scenarioId)` 在 v3.0 **强约束 pure transform**:
- 不读写 `G`
- 不读写任何 global(`FAC` / `ALL_FACS` / `G.*`)
- 不调用 `Math.random()` / RNG
- 不写 console / log / DOM / cache
- 仅 read GEN_BASE / CITY_BASE / FACTION_BASE / SCENARIOS,return 结构

(codex P2.2 应对)

### 7.2 函数签名

```js
function materializeScenario(scenarioId) {
  // 验证 + 解算 + return
  return {
    scenarioId,
    startYear,
    FAC, ALL_FACS, PLAYABLE_FACS, FAC_IDENTITY, ETHOS_INIT, DIPLO_INIT,
    CITIES_DEF, GENS_FULL, WILD_GENS, wildMeta, pendingGenPool,
    initialUnits, initialPosts, initialMerit, initialIntimacyPairs,
    foundingCores, aiPersonalities, techPreunlocks, reputations,
    emperorHolder, initialRes, initLog, relationsGraph,
  };
}
```

(详细派生逻辑同 v2 §7.1 + 新增 initialMerit / initialIntimacyPairs / wildMeta 派生)

**§8.4 W1-W2 实装状态**(v3.5):contract 形状已补全(`src/core/scenario_loader.js`)。
真值已派生:`startYear` / `initialRes` / `reputations` / `emperorHolder` / `techPreunlocks`
/ `foundingCores` / `initLog`(W1)/ `CITIES_DEF`(W2)(+ 1b 已有的 6 项)。
其余 10 项 W3-W6 渐进填充,现返回空集合占形状。
`initLog`(`[[msg,type],...]` 开局叙事)是 codex design review 漏的 contract 槽位,
W1 补入 §7.2 + §3.4(制作人 approve)。
`CITIES_DEF`(W2)= `sc.cities` + `CITY_BASE` merge,byte-identical legacy `CITIES_DEF`,
不含 x/y 像素坐标(pure transform 不调 `hexToPixel`;`initGame` 消费时 stamp)。

### 7.3 initGame 调用

```js
function initGame(scenarioId = DEFAULT_SCENARIO_ID) {
  const m = materializeScenario(scenarioId);
  // G 由 m 装配,严禁直接读顶层 const FAC / ALL_FACS
}
```

---

## 8. 阶段划分(v3 拆细)

### 8.1 阶段总表

| 阶段 | 内容 | 性质 | Sessions |
|---|---|---|---|
| 1a | 主表 + SCENARIO_214 verbatim | refactor 守底 | 2-3 |
| **1b-1** | materializeScenario 派生,**保持** const FAC/ALL_FACS 同步 sync(兼容性优先) | refactor 守底 | 2-3 |
| **1b-2** | 加 accessor functions(`getFactionDef(fid)` / `getScenarioFactions()` / etc.) | refactor 守底 | 1-2 |
| 1c | hardcoded 214 字面 id cleanup(grep + 替换,module by module) | refactor 守底 | 3-4 |
| 1d | 删 top-level const FAC/ALL_FACS/FAC_IDENTITY/AI_PERSONALITY(全模块迁移完成后)| refactor 守底 | 1-2 |
| 1e | Validators 实装 + tests/scenario_validate.js | refactor 守底 | 1-2 |
| 1f | +3 河北 (bohai/pingyuan/zhuojun) → 48; 1f-p2 +5 (徐州 xiaopei/donghai + 荆南 wuling + 关陇 shangdang/anding) → 53; 1f-p3 +2 (江东 suzhou + 徐州东北 langya) + bingzhou r=11→8 → 55 cities | feature 改 baseline | 1-2 |
| 2 | 190 势力 + 外交 | feature | 1-2 |
| 3 | 190 城市归属 | feature | 1-2 |
| 4 | 190 武将归属 + 关系(数据量大头) | feature | 3-4 |
| 5 | 启动 UI + Claude AI scenario-aware prompt | feature | 1-2 |
| 6 | 年龄 hook | feature | 1 |
| 7 | 实玩平衡 | balance | 3-5 |
| **合计** | | | **23-34 session** |

**阶段 1 总和 = 1a + 1b-1 + 1b-2 + 1c + 1d + 1e + 1f = 11-18 session**(架构改造本身的工作量,远大于 v1 估的 2-3 session)

### 8.2 1b 拆细解读(codex P1.2 应对)

| 子阶段 | 改 | 不改 |
|---|---|---|
| 1b-1 | materializeScenario 派生 + 用 **mutable container** sync top-level `FAC` / `ALL_FACS` / `FAC_IDENTITY` 等(详 §8.3)| 现有模块仍读 `FAC[fid]`,行为不变 |
| 1b-2 | 加 `src/core/scenario_accessors.js`:`getFactionDef(fid) / getScenarioFactions() / getPlayableFactions() / getFactionIdentity(fid) / getEthos(fid) / getWildGenDef(name)` 等 | 现有模块仍读 const(未迁移) |
| 1c | 各 module 把 const 读迁移到 accessor:`FAC[fid]` → `getFactionDef(fid)`,grep 全 src 改 | accessor 内部仍读 top-level mutable container,sync 不破 |
| 1d | 模块全迁移完成 + grep verify 0 直接 const 读 → 把 top-level mutable container 变 lazy/internal → 删暴露面 | accessor 直接 returns from materialized cache |

**好处**:每个子阶段 smoke vs main byte-identical,**任何子阶段失败可独立回滚**,不会卡在 "1b 半途坏 N 个模块" 状态。

### 8.3 1b-1 sync mechanic 具体化(codex trial 3 P1.3 应对)

**问题**:现 `const FAC = {...}` 不能 reassign。`FAC_IDENTITY` 在 initGame 内 mutate(`main.js:136`),不只是 init data。

**v3.1 决议**:
1. **Mutable container 模式**(不改 const 性质,改写内部 key/value):
   ```js
   // src/data/faction_base.js — top-level 仍是 const 容器
   const FAC = {};                // empty container
   const ALL_FACS = [];            // empty array
   const FAC_IDENTITY = {};        // empty container
   const FACTION_PLAYABLE = {};    // (新)
   
   // src/core/scenario_loader.js — sync helper
   function syncObject(target, src) {
     for (const k of Object.keys(target)) delete target[k];
     Object.assign(target, src);
   }
   function syncArray(target, src) {
     target.length = 0;
     target.push(...src);
   }
   
   // initGame(scenarioId) 内:
   const m = materializeScenario(scenarioId);
   syncObject(FAC, m.FAC);
   syncArray(ALL_FACS, m.ALL_FACS);
   syncObject(FAC_IDENTITY, m.FAC_IDENTITY);
   syncObject(FACTION_PLAYABLE, fromArray(m.PLAYABLE_FACS));
   // ... ETHOS_INIT, DIPLO_INIT etc.
   ```

2. **scenario init identity vs runtime identity 长期分离规划**:
   - **长期目标**(1d 完成后):
     - `FAC_IDENTITY[fid]` 退化为 scenario 起手 identity snapshot(immutable after init)
     - `G.facIdentity[fid]` 是 runtime identity(initGame 装配后,所有 mutation 落地此)
     - 例:称帝 / 天子易主时,改 `G.facIdentity[fid].type`,不动 `FAC_IDENTITY[fid]`
   - **过渡期**(1b-1 → 1c):见下方 split-brain 防御规则
   - 代码不许直接读写 `G.facIdentity` 或 `FAC_IDENTITY[fid]`,**全部走 accessor**(`getFactionIdentity(fid)` / `setFactionIdentity(fid, key, value)`),accessor 内部 backing 由阶段控制

**好处**:
- top-level 仍是 const(JS 语义不破)
- `materializeScenario()` 仍 pure transform(只 build,不 mutate global)
- runtime mutate 集中在 G 上,save/load 自动覆盖

**split-brain 防御**(codex trial 4+5 P1.3 应对):

1b-1 → 1b-2 → 1c → 1d **唯一迁移路径** = accessor backing 切换,代码绝不直接读写 `G.facIdentity`:

| 阶段 | 写站点(mutation) | 读站点 | accessor backing |
|---|---|---|---|
| 1b-1 | 仍直接写 `FAC_IDENTITY[fid].xxx`(行为 byte-identical)| 直接读 `FAC_IDENTITY[fid]` | 无 accessor |
| 1b-2 | 仍直接写 `FAC_IDENTITY[fid].xxx`(模块未迁移)| 直接读 `FAC_IDENTITY[fid]`(未迁移)+ 新代码可走 `getFactionIdentity()` | accessor 内部 read/write **top-level FAC_IDENTITY**(byte-identical) |
| 1c | **全 mutation + read 站点统一迁移到 accessor**(grep `FAC_IDENTITY\[` 全 src/ 改 `getFactionIdentity / setFactionIdentity`),同 sub-session 一次完成 | accessor 一致 | accessor 内部仍 read/write **top-level FAC_IDENTITY**(byte-identical 守底不破) |
| 1d | accessor 一致 | accessor 一致 | **切到 `G.facIdentity` backing**(accessor 内部改)+ FAC_IDENTITY 退化为 scenario init snapshot |

**关键约束**:
- 代码任何时刻**严禁直接读写 `G.facIdentity[...]`**(只能通过 accessor)
- `G.facIdentity` 内部装配只在 accessor 内,initGame 配合
- grep `G\.facIdentity\[` 在全 src/ **必须 0 hit**(整个迁移期间 + 之后,所有读写走 accessor)
- 1c 完成 verify:grep `FAC_IDENTITY\[` 在 src/ 0 hit(全部已用 accessor 替代)
- 1d 完成 verify:accessor 内部已切到 G.facIdentity backing,smoke vs 1c byte-identical 守底

**好处**(vs v3.1 旧表述):
- 单一迁移路径(accessor),消除 split-brain 风险
- 任何阶段失败可回滚(每阶段 byte-identical)
- 代码层不暴露 G.facIdentity 字段,future scenario 切换时只需 accessor backing 重新装配

---

### 8.4 Runtime data wire 切片(W1-W6,v3.5 新增)

**背景**:§8.1 阶段 2-4 建好了 SCENARIO_190/214 的 cities/generals/units 数据,但 `materializeScenario`(`src/core/scenario_loader.js`)实测**只产出势力层 6 项**(FAC/ALL_FACS/PLAYABLE_FACS/FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT)。`initGame` 仍从 legacy const 读 cities/generals/units —— **§7.2 的完整 materialized contract 从未实装,GEN_BASE runtime 从未被消费,SCENARIO_190 无法游玩**。

本节定义"把 §7.2 contract 补齐 + initGame 改读 materialized output"的切片计划。**codex design review 通过**(计划可行,无致命问题;3 处核心调整已吸收)。

#### 前置:先定完整 materialized contract

W1 开始前,先把 `materializeScenario` 输出补成 §7.2 的完整形状(定义字段 + 类型,暂可返回 stub/空值)。**不允许"边接边在 initGame 里零散读 scenario"** —— 否则 W4 会变成边 wire 边猜字段(codex 调整 ①)。

#### initGame 还在 legacy 读什么(catalog)

| 组 | legacy 来源 | 目标来源 |
|---|---|---|
| 入口/叙事 | `startAs()` 不传 scenarioId;`initGame` 默认 `'214'`;`G.year=0`;结尾 2 条 `log()` 是 214 叙事硬编码 | scenarioId 传参;消费 `startYear`;叙事改 scenario 字段 |
| 势力杂项 | 硬编码 res/reputation/emperor;`G.factionRulers` ← `getFactionDef().ruler`;`TECH_PREUNLOCK`;`FOUNDING_CORE` | `SCENARIO.factions[fid]` + `.emperor` |
| 城市 | `CITIES_DEF` | `SCENARIO.cities` + `CITY_BASE` |
| 部队 | 硬编码 `initUnits` 数组 | `SCENARIO.initialUnits` |
| 武将 | `GENS_FULL` / `ALL_GENS` / `getAllWildGenDefs` / `getGenMeta` / `GEN_TAGS` / `INIT_POSTS` / `MERIT_INIT` / `RETAINER_PRESET` / `INTIMACY_PRESET` | `SCENARIO.generals` + `GEN_BASE` |

#### 切片表

| 块 | 内容 | 风险 | 安全网 | 估 session |
|---|---|---|---|---|
| **W1** | 势力杂项 + 入口/叙事(res/reputation/emperor/tech/founding/factionRulers + scenarioId 传参 + startYear/log 全收口)| 低 | byte-identical 保持 | 1 |
| **W2** | 城市 `CITIES_DEF` → `SCENARIO.cities` | 中 | byte-identical 保持(codex 实测 214 cities 跟 CITIES_DEF 一致)| 1 |
| **W3** | 部队 硬编码 `initUnits` → `SCENARIO.initialUnits` | 中 | byte-identical 保持(codex 实测 214 initialUnits 跟硬编码一致)| 1 |
| **W4a** | 武将名册 + 五维 + apt + role/status/city | 高(心脏)| 失效 → adapter 两步走 | 1-2 |
| **W4b** | 官职 + 功绩 + 部曲 + founding/member source | 高 | 失效 | 1-2 |
| **W4c** | 关系 + 亲密度 + meta + 小传 + 忠诚 | 高 | 失效 | 2 |
| **W5** | 在野/待出场池(pending/wild 从 `SCENARIO.generals` status 来)| 中高 | 失效 + **必带回归测试** | 1-2 |
| **W6** | 退役 legacy(删 `GENS_FULL`/`CITIES_DEF`/硬编码数组)| 低 | **重拍 baseline 后**做 | 1 |
| — | snapshot/validator 补强 + 修回归 | — | — | 1-2 |

**估算合计:10-13 session**(codex 修正;CC 原估 7-10 偏乐观。最大变数:W4 schema 合并)。

**顺序**:W1→W2→W3→W4a→W4b→W4c→W5→W6。**W5 设计 + validator 必须在 W4a 之前定死**(pending/wild schema 跟 W4a 强绑定),实装放后。

#### 隐含依赖(codex)

- W3 依赖 W2(部队 spawn 需城市已初始化)
- W3 `squad.genName` 需 validator 保证在 active generals 中(但不依赖 W4 实装,旧 GENS_FULL 期也能验)
- W4b retainer/billetPool 依赖 W3(已出战武将不进国都 billetPool)
- W4c intimacy/chronicle 依赖 W4a 武将全集稳定
- W5 依赖 W4a(pending/wild 定义来自 `SCENARIO.generals` status)
- **`materializeScenario` pure transform 约束全程保留**:只读 GEN_BASE/CITY_BASE/FACTION_BASE/SCENARIOS,不写 G / 不跑 RNG / 不调 `createUnit`/`garrisonCap`/`getInitLevel` 等 runtime helper。副作用留 `initGame` consuming materialized output。

#### 安全网

| 阶段 | 安全网 |
|---|---|
| W1-W3 | byte-identical vs 当前 v181-derived legacy runtime baseline(codex 实测确认 214 cities/initialUnits 仍 verbatim)|
| W4+ | byte-identical **必死**(GEN_BASE 故意 audit 改好 + 214 名册经 membership/reverse audit 改过 —— 这是目的,不是 bug)。换新网:跑满 50 回合不崩 + 数值合理 + 人工/codex 审差异 |
| W4 接线 | **adapter 两步走**(codex 调整 ②):先做临时 adapter(输入旧 `GENS_FULL/WILD_GENS/GEN_META/INIT_POSTS/MERIT_INIT/RETAINER_PRESET/INTIMACY_PRESET`,输出 = 未来 materialized shape)→ snapshot 证明 `adapter + new init path == 旧 runtime` → 再把 adapter 输入切到 `GEN_BASE + SCENARIO.generals`。差异可清楚归因:adapter/init-path 问题 vs 新数据问题 |
| W6 后 | 重拍 baseline(修正版游戏),之后改动跟新 baseline 比 |

#### 高风险点(codex flag)

- **武将 schema 合并是最大风险**:`GEN_BASE`(史实不变字段)+ `SCENARIO.generals`(剧本状态字段)+ `GENS_FULL`(旧 runtime shape)三本数据,必须有明确 adapter,不然 W4 边 wire 边猜字段
- `getGenMeta(name)` 是大量链路依赖点,W4c 前要决定:继续兼容旧 meta shape,还是改读 materialized wild/base meta
- `refreshWildPool()` / recruit UI / pending 出场链 / `WILD_GENS` 关系易断,W5 必带回归测试(详 §5.4 / §5.5)
- 入口层(`startAs` / 标题 UI)不传 scenarioId → 即使数据 wire 好 190 仍进不去,**W1 必须解决**

#### 跟 §8.1 / phase 6 的关系

§8.1 阶段总表的"阶段 6 = 年龄 hook"指的是 §5.6 的死亡机制 runtime 实装(机制 1/2)。本节 W1-W6 是其**前置** —— 年龄 hook 需要 GEN_BASE 先被 runtime 消费。W1-W6 完成 + 重拍 baseline 后,才能做阶段 6 年龄 hook。

---

## 9. Validators 全表(codex P2.1 应对)

```js
function validateScenario(scenario) {
  const errors = [];

  // ── A. ID 合法性 ──
  // A.1 unknown faction
  // A.2 unknown city
  // A.3 unknown general
  // A.4 reserved id 占用 (wild/rebel/gentry ids)
  // A.5 faction id reuse 跨 scenario (warning, not error)

  // ── B. 数据完整性 ──
  // B.1 cities 必须列全 CITY_BASE
  // B.2 city.fac 必须在 scenario.factions
  // B.3 capital 计数: 每 faction 恰好 1 个,or explicit 0(蛮族 / 行营势力)
  // B.4 ruler 必须是 scenario.generals 内 status='active' + fac=本势力
  // B.5 emperor: 全 scenario 至多 1 个 faction.emperor=true

  // ── C. 武将状态机 ──
  // C.1 active 必须 fac/city/loyalty/post/role/retainer 全填
  // C.2 active.city 所在 scenario.cities[city].fac 必须 = active.fac
  //     (例外: 客将 explicit clientFlag, 但 v3 简化不做)
  // C.3 wild 必须 fac:'wild' 且 wildData 完整
  // C.4 pending 必须 availableYear > startYear 且 wildData 完整
  // C.5 retainer.count > 0 当 initialUnit=true

  // ── D. 年龄一致性 ──
  // D.1 GEN_BASE.deathYear <= startYear → 不应列(列了 error)
  // D.2 GEN_BASE.birthYear > startYear → 不应列
  // D.3 active 时 startYear >= max(availableYear, debutYear, birthYear+18)

  // ── E. 关系图 ──
  // E.1 relations target 必须 in scenario.generals
  // E.2 relations target.status != 'unavailable'
  // E.3 双向: A→B 有 B→A 必须有
  // E.4 intimacy: -100..100 range (allow 负值 表达 仇怨/宿敌, 例 关羽-黄忠=-15, 凌统-甘宁=-60)
  // E.5 target != self (no self-relation)
  // E.6 no duplicate edge (A->B 列 2 次)
  // E.7 type 对称 (A→B 父亲 → B→A 必须子嗣,table-driven)

  // ── F. 外交图 ──
  // F.1 diplo 双向 (一对一 entry,materialize 时复制为 bidirectional)
  // F.2 no self-pair (A-A)
  // F.3 no duplicate (A-B 出现 2 次)
  // F.4 (合并到 K.1,见下) — status legal enum 跟游戏代码 enum 对齐
  // F.5 value 范围: -100..100

  // ── G. 命名空间 ──
  // G.1 faction.color 不冲突 (Levenshtein > some threshold)
  // G.2 faction.cls 唯一 per scenario
  // G.3 faction.name 不重复 per scenario
  // G.4 status enum legal ('active'|'wild'|'pending'),其他报错
  // G.5 role enum legal ('ruler'|'strategist'|'prefect'|null),其他报错
  // G.6 scenario.factions[fid].aiPersonality 必填(非 null),5 维全列:
  //     atkThreshold / siegeThreshold / diploAggro: 0..1 范围
  //     deployBias / budgetBias: -1..+1 范围(允许负值, 例 wu.deployBias=-0.10)
  // G.7 scenario.version 格式 (semver-like, e.g. '1.0' / '1.0.1')
  // G.8 至少一个 faction.playable=true

  // ── H. 资源 / 经济 sanity ──
  // H.1 res.gold/wood/iron/horses 不 negative (4 字段, 无 faction-level food — food 在 city.storage)
  // H.2 city.pop >= 0
  // H.3 city.troops <= city.pop * X (合理性 sanity, X=0.5)

  // ── I. 武将 active 状态字段完整 ──
  // I.1 active 必须 fac in scenario.factions 且非 'wild'
  // I.2 active.city in scenario.cities 且 scenario.cities[city].fac === active.fac
  // I.3 active 必须有 loyalty (0-100)
  // I.4 active 必须有 post (object 含 name + rank) 或 explicit null
  // I.5 active.role 'ruler' per fac 恰好 1 个
  // I.6 active.initialUnit=true 时 retainer.count>0 且 retainer.type 合法 ('cavalry'|'light'|'heavy'|'archer'|'siege'|'naval')

  // ── J. 武将 wild/pending wildData 完整 ──
  // J.1 wild 必须 fac:'wild'
  // J.2 pending 必须 availableYear (number,> startYear,<= 300)
  // J.3 wild/pending 必须 wildData 含 {title, post, loyalty, merit, retainer, relations}
  // J.4 wildData.regionHint / clanHint 可选(警告 missing 但不 error)
  // J.5 wildData.skillsOverride: null or array of valid skill ids

  // ── K. 外交 status 跟游戏 enum 对齐 ──
  // K.1 diplo[].status legal: 'enemy'|'ally'|'neutral'|'vassal' (NOT 'tributary'—跟游戏代码 enum 对齐)

  // ── L. Wild lookup 可见性安全(codex trial 4 catch)──
  // L.1 每 wild/pending general 必须有 visibility gate (status 字段判定)
  // L.2 pending general 必须 availableYear > scenario.startYear (否则应当 'wild' 直接起手)
  // L.3 materialized.WILD_GENS 含 wild + pending entries,但 refreshWildPool 实装时
  //     必须 filter status='wild' 才推 G.wildPool;pending 通过 G.pendingGenPool 控制可见性

  // ── M. Stale ID grep gate(codex trial 4 catch)──
  // M.1 scenario 数据中 `nanman_214`/`nanman_190` literal id 必须 0 hit
  //     (除非显式标记为 future alias note;v3 不实装 alias layer)
  // M.2 scenario.factions key 不许出现 reserved id (wild/rebel/gentry_*)

  if (errors.length) throw new Error(`Scenario ${scenario.id} validation failed:\n${errors.join('\n')}`);
}
```

(实装时各 check 独立函数,errors 集中 throw)

**注**(codex trial 3 catch):diplo status 用 `'vassal'`(跟游戏代码 enum 对齐),v2 doc 写的 `'tributary'` 是错。F.4 已合并到 K.1(trial 4 catch)。

---

## 10. Hardcoded 214 cleanup 详细(v2 §10 不变)

加一项:**自动化 grep 脚本**(`tools/find_hardcoded_facids.sh`)定期 audit:
```bash
rg "'wei'|'shu'|'wu'|'nanman'" src/ --type js -n
rg "Object\.keys\(FAC\)" src/ --type js -n
rg "FAC_IDENTITY\[" src/ --type js -n
```

---

## 11. Faction ID Namespace(v3.1 修订)

**核心规则**:
- 历史延续性 ≠ 同 id:**政治实体不同(ruler / playable / 边界 / 内政结构)** 原则上可用不同 id
- **例外**(byte-identical 守底 + 现有代码 hardcoded):214 / 190 的 nanman 跨 scenario **共用同 id `nanman`**,差异通过 `scenario.factions[nanman].ruler / stage / traits` 表达;不在 v3 拆分 entry。
- 同显示(name/color/cls 相同)通过 `FACTION_BASE` 不同 entry 实现(允许 `name` 跨 entry 重复,仅 within scenario 不重复)
- AI / 内政逻辑通过 `cls` 而非 `id` 共享(若需要)

**Alias layer**(未来需要时):
- 如 263 / 184 等剧本中 nanman 政治结构跟 214 差距巨大,可加 `FACTION_ALIAS = { nanman_184: 'nanman' }` 映射,initGame 时把 scenario 内 `nanman_184` 自动转 runtime `nanman`,保持 G state schema 不变。
- 现在 v3 不实装 alias layer,留 future expansion(§15)。

---

## 12. Claude AI scenario-aware(v2 §12 不变)

加 P3.1 应对:**`scenario.factions[fid].aiPersonality` 字段必填**(不再 optional),validator G.6 check。

---

## 13. 守底策略(v3 加 targeted smoke)

| 阶段 | 守底方式 |
|---|---|
| 1a-1e | smoke vs main byte-identical(SHA256 51 snapshots identical) |
| 1f | lock 新 baseline(55 cities, 含 1f/1f-p2/1f-p3 累计 + bingzhou 上移) |
| 2-7 | scenario init snapshot + targeted smoke |

**targeted smoke 加列**(codex P2.3):
1. `tests/scenario_init_snapshot.js`:initGame(scenarioId) 不跑 turn,直接 snapshot G.{factions,cities,generals,diplo,year,turn,res,reputation,emperor}
2. `tests/scenario_recruit.js`:initGame → 招募一个 wild general → snapshot G.generals
3. `tests/scenario_advance.js`:initGame → 跑到 pendingGenPool 某 general 出场旬 → snapshot G.wildPool
4. `tests/scenario_ai_turn.js`:initGame → 跑 1 AI turn → snapshot G state
5. `tests/scenario_diplo_screen.js`:initGame → 渲染 diplo screen → snapshot DOM(基于 jsdom)
6. 190 ready 后:全套上述对 190 跑

每个 targeted smoke 用 `byte-identical(scenario, post-action snapshot)` 守底,scenario 内不能漂移。

---

## 14. 风险 + 缓解(v2 §14 + 新增)

加 14.8:**accessor migration 不彻底**
- **风险**:阶段 1c module-by-module 迁移,grep 漏改 → 阶段 1d 删 const 后 crash
- **缓解**:1d 前先跑 `tools/find_hardcoded_facids.sh` 必须 0 hit;sprint_verify 加 entry 跑 214 + 190 双 scenario init 全模块 verify

加 14.9:**deterministic materializeScenario 破例风险**
- **风险**:materializeScenario 暗藏 RNG 或 G 读 → snapshot 不 deterministic
- **缓解**:实装时 lint rule(grep `Math.random|G\.|console` in scenario_loader.js 必须 0)+ unit test pure transform

---

## 15. 未来 expansion(v2 §15 不变)

---

## 16. Open Questions(v3 缩减)

### Q3: G.relations 模型(运行时 vs scenario 起手)
- 现有 G 内是否已有 relations runtime store?
- **答**:检查后,游戏内关系靠 G.intimacy[`${a}-${b}`] number 跟踪,跟 scenario.generals[].relations 不同结构
- **应对**:materializeScenario 派生 G.intimacy from relations,scenario.generals[].relations 仅初始化用,运行时只用 G.intimacy
- close,无需更多 design

### Q4: 渲染层多势力 UI overflow
- 15 势力 UI 现有渲染可能 overflow(15 个 ethos 旗 / 15 个 diplo 行)
- **应对**:阶段 5 启动 UI 时一并 verify,必要加分页 / 折叠
- close,留实装时处理

### Q5: 1a-1f 各 sub-session 失败回滚机制
- (同 v2 §16 Q5,close: smoke FAIL → reset --hard HEAD~1 + 重 plan)

### Q6: tests/baseline 多 scenario 组织
- **答**:`tests/baseline/scenarios/{scenarioId}/{init.json, after_50_turns.json, post_recruit.json, ...}`
- close

(v1 Open Q1/Q2 已 close 至 §3.1 内决议)

---

## 17. 阶段 1a mini scout 预备(同 v2 §17)

---

(v3.0 — 2026-05-11 codex trial 2 NEEDS-WORK 重写 + Q1/Q2 close + 阶段 1b 拆 4 + validator 全表 + materializeScenario pure transform + targeted smoke / 等 trial 3 LGTM 后启动阶段 1a)
