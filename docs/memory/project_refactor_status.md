---
name: Refactor phase status — 跨剧本梳理 sprint + 4-e audit 闭环 ✅
description: 阶段 1 scenario 1a-1f + 阶段 2-4 SCENARIO_190 + 跨剧本梳理 + GEN_BASE audit (debut/death/stats/birthYear/debutYear gap/deathCause) + 死亡机制设计 v3.4 + SCENARIO_214 membership cleanup + roster completeness 反向 audit + **phase 6 wire 计划 v3.5 (W1-W6, codex review 通过)** 全完成. GEN_BASE 212 entries 字段口径定 (含 deathCause). SCENARIO_190 102/14/96=212; SCENARIO_214 130 (104/8/18). **phase 6 wire W1+W2+W3 ✅ push'd (`63b5490`/`ad94d21`/`21514db`) + W4a step-1 ✅ local (`86843a3`, GENS_FULL adapter step-1)**. **下次: W4a step-2 (adapter 输入切 GEN_BASE+SCENARIO.generals — byte-identical 故意破, 换网: 跑满 50 回合不崩+数值合理+审差异)** — 计划见 scenario_system.md §8.4.
type: project
originSessionId: 512dcd0b-fb4e-439d-a8fe-64996a4fc5c8
---

## 2026-05-14 (phase 6 wire W4a step-1 ✅ — 武将名册 GENS_FULL adapter)

W4a step-1 done, commit `86843a3` (local, 未 push). smoke + compare PASS + 全 G dump 0 diffs.

- adapter 两步走 (codex 调整②): step-1 = adapter 输入旧 GENS_FULL const → 输出 materialized
  shape, byte-identical 守得住; step-2 = 输入切 GEN_BASE + SCENARIO.generals, byte-identical
  故意破 (GEN_BASE/214 名册 audit 改过), 换网跑满 50 回合不崩+数值合理+审差异.
- materializeScenario GENS_FULL stub → 真值: 旧 GENS_FULL const deep-copy. 旧 shape 已 ≈
  名册 loop 想要的, step-1 adapter 几乎 pass-through.
- initGame 名册 loop Object.keys(GENS_FULL)/GENS_FULL[fid] → m.GENS_FULL, loop 逻辑 verbatim.
- scout 关键发现: **GENS_FULL 实测 0 个 minTurn entry** (24 个 minTurn 全在 WILD_GENS) —
  initGame 名册 loop 的 `if(g.minTurn>1)` 分支对 GENS_FULL 是 dead branch, G.genPendingPool
  从这个 loop 出来是空的. pending 武将走 WILD_GENS minTurn → refreshWildPool, 不走这里.
  → W4a step-2 / W5 设计时注意: SCENARIO_214 的 18 pending 在旧模型里对应 WILD_GENS,
  不是 GENS_FULL.
- 武将三本数据 shape 已 scout (见 git 历史 / scenario_system.md §3.4 §5):
  GEN_BASE (史实不变 212) / SCENARIO_214.generals (130 = 104a/8w/18p) / 旧 7 本 runtime const.
- getGenMeta = GEN_META[name] || getWildGenMeta(name) || {} — 大量链路依赖, §8.4 留 W4c 决定.
- W4a step-2 是「心脏」最硬: GEN_BASE + SCENARIO.generals 合并成 GENS_FULL shape,
  byte-identical 必破, 需 adapter 清楚归因 (adapter/init-path bug vs 新数据差异).

## 2026-05-14 (phase 6 wire W3 ✅ — 起手部队 initUnits)

W3 done, commit `21514db` (local, 未 push). smoke + compare PASS + 全 G dump 0 diffs.

- materializeScenario initialUnits stub → 真值: sc.initialUnits deep-copy
  ({fac,city,squads:[{...sq}]}). pure transform.
- initGame 删硬编码 const initUnits=[...] (7 unit / 42 行), initUnits.forEach → m.initialUnits.forEach.
- scout 实测 sc.initialUnits vs 硬编码 initUnits — 7 unit 全 byte-identical 0 drift (clean, 无 W1 周瑜坑).
- initialUnits 无其他消费者, 只改 initGame. W3 依赖 W2 (部队 spawn 需城市初始化) — 满足.
- W1-W3 都是低-中风险「搬数据」块, 顺. W4a 起是高风险「武将 schema 合并」(GEN_BASE +
  SCENARIO.generals + GENS_FULL 三本), 且 W4 byte-identical 故意会破 (GEN_BASE audit 改过) —
  换安全网: 跑满 50 回合不崩 + 数值合理 + adapter 两步走. W4a 前 W5 设计+validator 须先定死.

## 2026-05-14 (phase 6 wire W2 ✅ — 城市 CITIES_DEF)

W2 done, commit `ad94d21` (local, 未 push). smoke + compare PASS + 全 G dump 0 diffs.

- materializeScenario CITIES_DEF stub → 真值: sc.cities + CITY_BASE merge, byte-identical
  legacy CITIES_DEF const (55 城 array order + key order + 值 实测 0 drift — 这次没踩 W1 周瑜坑).
- isCapital 坑: legacy CITIES_DEF 只 capital 城带 isCapital:true 非 capital 省 key;
  sc.cities 里非 capital 是 isCapital:false. merge 时 `if(scity.isCapital)` falsy 不写, 保 key 集一致.
- x/y 像素坐标坑: legacy `map.js:599 CITIES_DEF.forEach(c => c.x=hexToPixel(...))` 在 module load
  augment CITIES_DEF const. m.CITIES_DEF 是 pure geo 无 x/y (pure transform 不能调 hexToPixel,
  且 load 顺序 scenario_loader 早于 map.js). G.cities[cid].x/y **被 render_cache.js:233 读** —
  必须保留. 解法: initGame 消费 m.CITIES_DEF 时 `hexToPixel(c.q,c.r)` stamp x/y (key order
  正好接在 base 后, 跟 legacy `{...c}` 一致).
- legacy CITIES_DEF const + CITY_MAP 不动 — 其他 chain/render 消费者 W2 不迁移 (留 W6).

## 2026-05-14 (phase 6 wire W1 ✅ — 势力杂项 + 入口/叙事)

W1 done, commit `63b5490` (local, 未 push). smoke + compare PASS (51 snapshots identical).

### 做了什么
- 前置: materializeScenario 输出补成 §7.2 完整 contract — W1 真值 6 项
  (initialRes/reputations/emperorHolder/techPreunlocks/foundingCores/initLog) 派生真值,
  其余 11 项 W2-W6 stub (空集合占形状). pure transform 约束不变.
- initGame 改读 m.* — 删 v181 17 行硬编码 res override + 不再直读 TECH_PREUNLOCK/FOUNDING_CORE const.
- G.startYear 新字段 (阶段 6 年龄 hook 用, persist 随 G 自动 save/load).
- 入口层 scenarioId 全程透传: 剧本卡片 → onScenarioSelect → showFactionSelect → startAs → initGame.
- initLog: codex design review 漏的 §7.2 contract 槽位 — 制作人 approve 加 SCENARIO 叙事字段
  ([[msg,type],...]), 同步更新 docs §7.2 + §3.4.

### 关键 lesson — W-wire 必须实测 slice vs legacy verbatim
SCENARIO_214.factions.wu.foundingCore **漏列 周瑜** (phase 1a 抽取 gap;
legacy FOUNDING_CORE.wu 含 周瑜). 周瑜 minTurn>1 → turn 8 入场 → smoke turn 8 divergence.
smoke 第一层**没抓** genJoinSource/genChronicle/_tech 这些 hidden state — 定位靠**全 G dump**
脚本 (initGame 后 dump 完整 G, clean main vs branch 对比) 才抓到. W2/W3 同理: codex 说
"实测 214 cities/initialUnits verbatim" 也要自己 dump 验, 别信文档字面. 详见 [[feedback_phase3_scout_first]].

### 小 gap (非阻塞)
- §7.2 contract 的 `aiPersonalities` 字段无任何 W 切片 wire — 现 stub {}, 仍走顶层 const
  AI_PERSONALITY. 后续补 W 切片或并入某块时处理.

## 2026-05-14 (skills design lock — by design, no sprint needed)

实测 GEN_BASE 212 entries skills 字段状态:
- 含「已实装」标记 (runtime 真实装): **83**
- `skills: []` (空): **129**
- 含「未实装」placeholder stub: **0**

旧 memory "skills (80+ stub) 待 sprint" 不准 — 实际无 stub, 只有"已实装 vs 空"两态. User 设计意图:**已实装的保留, 剩余/新加的留空, 不补 stub**.

### 决策
- skills 字段 source of truth 在 `src/data/generals.js` (legacy runtime, 已 wire)
- `src/data/general_base.js` 不维护未实装 stub — 避免 dual source-of-truth
- header comment 加 lock note (commit), 防御未来 session 误开 sprint

### 不做
- 格式归一化 (`"skills":[]` 紧凑 79 + `"skills": [],` 带空格 50 → 都是 empty `[]`, JSON 输出一致, 纯 cosmetic, 不动)

### 下次 next-up (skills 移出列表)
- birthYear 大量 null 补 sprint
- phase 6 wire — src/data/ 真正接到 runtime (skills 关系: 届时考虑 generals.js skills 字段 vs general_base.js 怎么去重)
- 平衡 sprint (等 phase 6 后)

---

## 2026-05-14 (Group A null-deathYear 收尾 — GEN_BASE 死亡数据全闭环)

SCENARIO_214 反向 audit 的 Group A followup. GEN_BASE 最后 18 个 deathYear=null + deathCause=null 武将 (都在 214 名册, 活过 214) 补估算值.

- codex 史实 sweep 18 entries → estDeathYear + deathCause: natural 17 / violent 1 (牛金 — 晋书载司马懿鸩杀, "牛继马后")
- 全部 estDeathYear >= 214 (跟"在 214 名册"一致)
- `tools/patch_gen_base_groupa_death.js` 应用
- 改完 **GEN_BASE 0 个 deathYear=null / 0 个 deathCause=null** — 死亡数据彻底闭环
- Codex review LGTM (20K tokens)

smoke + compare PASS (51 snapshots identical).

---

## 2026-05-14 (phase 6 wire 计划 — scenario_system.md v3.5 §8.4)

制作人提"聊 phase 6 wire". scout 现状 + 出切片计划 + codex design review.

### 现状澄清 (重要)
"phase 6 wire" 实际是两块:
- **Piece A 数据 wire**: materializeScenario 现只产势力层 6 项, initGame 仍从 legacy (GENS_FULL/CITIES_DEF/硬编码 initUnits) 读 cities/generals/units. GEN_BASE runtime 完全没消费. **SCENARIO_190 根本玩不了**. — 这是前置
- **Piece B 年龄 hook**: §5.6 死亡机制 runtime 实装 (机制 1/2). 依赖 A. — 设计文档 §8.1 的"阶段 6"指的是这个

### 安全网决策 (制作人 approve)
- "byte-identical vs v181" 网接线后**对武将块必死** — 因为 GEN_BASE 故意 audit 改好了数据 + 214 名册改过. 这是目的不是 bug.
- W1-W3 (势力/城市/部队, 数据 verbatim) → byte-identical 网保持. codex 实测确认 214 cities/initialUnits 仍 verbatim.
- W4+ 新网: 跑满 50 回合不崩 + 数值合理 + 人工/codex 审差异
- **稳妥技巧 / adapter 两步走**: W4 接线先做临时 adapter (旧数据 → materialized shape) 验证接线代码 byte-identical, 再换真 GEN_BASE — 差异可归因 (代码 vs 数据)
- 全做完重拍 baseline

### W1-W6 切片 (写进 §8.4)
W1 势力杂项+入口 / W2 城市 / W3 部队 / W4a-c 武将 (心脏) / W5 在野待出场池 / W6 退役 legacy. 顺序 W1→...→W6. **估 10-13 session** (codex 修正, CC 原估 7-10 偏乐观).

### codex design review (制作人无编程背景, 委托 codex 审计划)
**Overall: 计划可行**, 3 处核心调整已吸收进 §8.4:
1. 先定完整 materializeScenario contract (§7.2 形状) 再 wire, 不"边接边猜字段"
2. W4 用 adapter 两步走, 不直接 GENS_FULL → GEN_BASE
3. W2/W3 守 byte-identical, W4 后换 snapshot+validator+50回合 smoke

codex 抓到 CC catalog 漏的: **入口层硬编码 214** (startAs 不传 scenarioId / initGame 默认 214 / G.year=0 / 结尾 2 条 log 是 214 叙事) — 不补 190 进不去, W1 必须解决.

codex flag 最大风险: **武将 schema 合并** (GEN_BASE 史实字段 + SCENARIO.generals 剧本状态 + GENS_FULL 旧 runtime shape 三本数据, 必须明确 adapter).

### 下次
phase 6 wire **W1 启动** — 势力杂项 + 入口/叙事收口, 低风险热身块, byte-identical 网还在.

---

## 2026-05-14 (SCENARIO_214 roster completeness 反向 audit — Task A/B/C)

membership cleanup (删死人) 的反向: "该活在 214 但漏列名册" 的武将补上.

### 关键发现: deathYear=null 在做双重身份
反向 audit 第一版用 "deathYear>=214 或 null = 活着", 但 **null 不等于活着** —— 王匡(~192死)/曹豹(~196)/田楷(~199) 这些 190s 就死了的, 因 deathYear=null 被误算成 "214 还活着". 根因: 设计 §5.6 "null → 永远可进" 规则太宽.

### Task A — 18 个 null-deathYear 武将补 deathYear+deathCause (commit `165bd0a`)
codex 史实估算 18 个不在 214 名册的 null-deathYear 武将:
- 13 个 estDeathYear < 214 → membership filter 修正
- 5 个 estDeathYear >= 214 (刘琮/鲜于辅/阎柔/阎行/韩浩, 降曹活到曹魏) → "该加" 候选

### Task B — 重跑反向 audit
干净清单 14 个 (13 active/wild + 陆抗 skip — b218 214还没出生).

### Task C — 13 个加进 SCENARIO_214.generals
归属 (制作人 approve, "不好归类→wild" 规则):
- wei active 7: 史涣/韩浩/蒯越/蔡瑁/鲜于辅/阎柔/刘琮
- shu active 2: 吴兰/雷铜
- wild 4: 韩遂(凉州独立无faction)/阎行/刘璋(丢益州)/田畴(拒仕recluse)
- count: 117 → **130** (active 104 / wild 8 / pending 18)
- `tools/patch_214_roster_add.js` round-trip check + relation 目标存在性校验
- Codex review LGTM (68K tokens); 修了 codex 指出的 史涣↔韩浩 单向 relation → 对称

### Followup
- ~~**Group A 18 个 null-deathYear (在 214 名册的)**~~ ✅ **已做** (2026-05-14, commit 见下方 Group A 章): codex 史实估算补全, GEN_BASE 现 **0 个 deathYear=null / 0 个 deathCause=null** — 死亡数据全闭环.
- 设计 §5.6 "null → 永远可进" 规则: GEN_BASE 已无 null deathYear, 规则现在是纯防御性 fallback (实际不会触发). 未来若确定永不引入 null deathYear, 可去掉规则.

smoke + compare PASS (51 snapshots identical).

---

## 2026-05-14 (GEN_BASE 加 deathCause 字段 — 212 entries)

机制 2 的前置数据 sprint. GEN_BASE 全 212 entries 加 `deathCause` 字段 (插在 debutYear 后).

### 三态 (不是二态)
- `natural` **101** — 病死/老死/忧愤而终 (codex 史实分类)
- `violent` **75** — 战死/处决/遇刺/被杀 (codex 史实分类)
- `null` **36** — deathYear 也是 null 的 (史载不详)

### 决策: null deathYear 用 `null` 不用 `violent`
原设计文档写"null → violent". 实装时改成 `deathCause: null`:
- 36 个 null-deathYear 里有许褚/徐庶/简雍/周泰/徐盛 这种**病死**的, 贴 `violent` 是假 label
- 对这 36 个 deathCause 行为上 moot (deathYear=null → runtime 无论如何只能算自然寿命), 既然纯 label 就选诚实的
- `null` 跟 `deathYear: null` 语义一致 (都是史载不详)
- runtime 规则: `deathCause==='natural' && deathYear!=null → 用 deathYear; 否则算自然寿命` — violent/null 同行为
- scenario_system.md §5.6 + §3.1 已同步改三态

### 流程
codex sweep 176 个有 deathYear 的 → natural/violent 分类 → CC spot-check (关羽/吕布/孙坚 violent, 曹操/郭嘉/周瑜/荀彧 natural, 边界 荀彧/陆逊 忧愤→natural / 于禁 惭恚→natural 都合理) → 36 个 null-deathYear 强制 deathCause=null → patch 脚本插入.

### 验证
- parse OK, 212 全有 deathCause
- invariant: `deathCause===null ⟺ deathYear===null` PASS
- compact (79) + multi-line (133) 两种格式插入都正确
- Codex review LGTM (139K tokens, Q1 schema / Q2 null 配对 / Q3 分类抽查 / Q4 doc 一致 / Q5 runtime 全 PASS; codex 沙箱跑不了 node, CC 自己 close parse caveat)

### tools/
`tools/patch_gen_base_deathcause.js` 可 reproduce (读 codex result + null 规则 + 双格式 regex 插入).

smoke + compare PASS (51 snapshots identical).

---

## 2026-05-14 (武将死亡机制设计 v3.4 + SCENARIO_214 membership cleanup)

制作人提出设计问题: deathYear 混了"病死老死"(玩家避不掉)和"战死横死"(玩家本可避免). 若一律硬触发, 壮年猛将"突然老死"伤体验.

### 设计讨论 → 定案 (写进 docs/scenario_system.md v3.4 §5.6)
- GEN_BASE 加 `deathCause: 'natural' | 'violent'` 字段 (史实不变)
- **机制 1 剧本成员过滤**: 史实 deathYear >= scenario.startYear → 可进名册 (全员, 不分死因)
- **机制 2 游戏内自然死亡** (phase 6 wire): natural 用 deathYear (逆天改命无效); violent 用算出来的自然寿命 `birthYear + 60 + roll(0..20)` (60~80), 史实 deathYear 不用; violent 提前死只靠 killGen
- 自然寿命是 runtime 值, load 时算入 G state, **不进 GEN_BASE**
- **保留史实 deathYear 不覆盖**: 机制 1 对每个未来剧本都要用 (多剧本架构), 覆盖只能用一次; 且 GEN_BASE header 契约即"史实不变"
- deathYear=null 武将当 violent 处理

### 决策: deathCause 要不要存为字段
制作人一度提议"CC 直接算好年份, 不需要 deathCause 字段". CC 反对并定案保留 —— 覆盖 deathYear 会永久毁史实, 机制 1 失效; deathCause (1 字段) 成本远低于覆盖代价. 制作人 approve.

### SCENARIO_214 membership cleanup (机制 1 应用)
audit SCENARIO_190 + 214 名册 vs 史实 deathYear:
- **SCENARIO_190**: 0 脏数据 (全 212 entries deathYear >= 190)
- **SCENARIO_214**: 8 脏数据 (史实 d < 214 却在名册): 郭嘉207/荀彧212/李典209/张绣207/曹纯210/周瑜210/张松212/张任213
  - 这 8 个 deathYear 都史实正确, 是名册脏不是 GEN_BASE 错
  - `tools/patch_214_membership_cleanup.js` (round-trip safety check): 删 8 entry + wu foundingCore 删周瑜 + 清 16 个 relations 反引
  - count: 125 → **117** (active 101→95 / wild 6→4 / pending 18)
  - wei -5 (郭嘉/荀彧/李典/张绣/曹纯), wu -1 (周瑜) — 史实准确性, 不是 bug
- Codex review LGTM (62K tokens, Q1 史实 / Q2 下游清理 / Q3 schema / Q4 runtime 全 PASS)

### Followup
- **GEN_BASE 加 deathCause 字段**: 212 entries 分类 natural/violent, 独立 data sprint (codex 一轮扫, 死因硬史实)
- **SCENARIO_214 roster completeness 反向 audit**: "该活着但没列进 214 名册"的武将 —— 本次只做了"删死人", 没做"补活人". 单独任务.
- 机制 1/2 实装是 phase 6 wire 的事

smoke + compare PASS (51 snapshots identical).

---

## 2026-05-14 (debutYear schema gap fix — 董卓/陶谦/马铁/马休)

birthYear sprint 的 CC second-pass sanity 发现的 followup. debutYear 字段口径 = 首次仕官年, 但
prior extraction 阶段部分老资格军阀抄了"出场年"而非"首次仕官年".

### 4 entries debutYear 修
- 董卓 189 → **169** (KOEI 标定 任羽林郎 ~37 岁; 189 是入主洛阳年, 非首次仕官)
- 陶谦 190 → **155** (b132 + 23 岁举茂才; 190 是任徐州牧年)
- 马铁 190 → **200** (KOEI 经典, 比兄马超 debut 195 略晚)
- 马休 190 → **200** (同上)

### SCENARIO_190 status 调整 (跟 audit B.2 pattern)
马铁/马休 active in matenghan liangzhou → **pending** (availableYear 200). active relations
(父马腾/兄马超) 移到 wildData.relations 保留. foundingCore 不含他俩, 不破坏 founding 语义.

inline count: 104/14/94 → **102 active / 14 wild / 96 pending = 212/212**.

### Codex review LGTM (155K tokens)
Q1 史实 / Q2 status pattern / Q3 schema (反引检查 0) / Q4 runtime — 全 PASS.

### 残留 (不修)
- 程昱 debutAge 51: 史载明确"年五十始仕", 不出戏, keep.
- 其他老资格军阀 (刘焉/刘虞/孔融/袁绍/袁术 等) debutYear 若也有 schema gap — codex audit v2 当时说"≤190 active 合理"已 review 过, 暂不开新 sprint. 若未来 birthYear 补后 CC sanity 再 catch debutAge>50, 再补.

---

## 2026-05-14 (birthYear 补全 sprint — 156 entries, codex 史实优先 + heuristic 兜底)

User correction: 我第一版直接 156 全 heuristic 错, 应该"先查史实, 找不到的才估". 重做.

### 流程
1. codex sweep 156 null 武将 (debutYear/deathYear/classTag context) → 给 H/M/L 标定:
   - H (史载明确) **10**, M (KOEI 标定) **63**, L (史不详) **83**
2. CC 应用: H+M 共 73 直接用 codex 值; L 83 用 heuristic; 蒋琬 codex H 错 (b168 应 b184 史载"年六十二"), CC override 184
3. Sanity rule 拦截 6 个 codex M 跟 audit'd debutYear/deathYear 冲突 (debutAge<15 or lifespan>85):
   - 陈群/曹休/文聘/廖化/刘封/施绩 → heuristic (e.g., 文聘 codex b178 给 10 岁出仕 conflict our audit'd debut 188; 廖化 codex b170 给 寿 94)
4. **Codex final review** (trial 1) → NEEDS-WORK, catch 8 出戏:
   - Type 3 family 代差: 夏侯霸/陆抗/马休/马铁/钟会/刘琮
   - Type 4 KOEI 偏差: 廖化 (codex b170 vs heuristic b191, 折中)
   - Type 2: 董卓 debutAge 57
5. CC 6 个 manual override + 2 个 keep:
   - 夏侯霸 202→195 / 陆抗 226→218 (pre-existing 也 override) / 马休/马铁 170→178 / 刘琮 183→177 / 廖化 191→180
   - keep: 钟会 b225 (钟繇高龄得子史载) / 董卓 b132 (KOEI 经典, 57岁出仕是 debutYear schema 局限不是 birthYear 错)
6. **Codex trial 2** verify → LGTM (31K tokens)

### Heuristic 规则
- `warrior/commander` → `debutYear - 20`
- `strategist/civilian/other` → `debutYear - 25`
- sanity: `deathYear - by < 30` → `by = deathYear - 35`
- 应用 sanity 拒 codex 阈值: `debutAge < 15` or `lifespan > 85` → 回退 heuristic

### Final state
- 0 null remain (212/212 全 filled)
- 67 codex + 89 heuristic + 6 manual override (+ 蒋琬 H override inside codex map)

### Followup
- **董卓 debutYear**: 现 189 (audit "首次仕官年" = 入主洛阳年) 跟 birthYear b132 给 57 岁出仕, 矛盾来自 audit schema 没含"早期凉州羽林郎"(160 年代). 留 debutYear schema sprint 修.
- **陶谦 debutYear**: 同 董卓 — 现 190 (任徐州刺史年) 但陶谦 184 黄巾时期已活跃, debutYear schema gap. 留同 sprint.
- **马铁/马休 debutYear**: 现 190 (跟父马腾/兄马超同 debutYear), 但 KOEI 经典 200+ (他俩比马超晚出仕). CC 自审捕获 — codex final review 建议 b178 (代差 35) 但跟 debut=190 给 12岁出仕更出戏, 选 b170 (代差 14 ≥ debutAge 12). 留 debutYear sprint 同步修.
- **陆抗 pre-existing b226 → 改 218**: 是 56 个 pre-existing filled 之一, 本批次本不该动. 但 codex final review catch 代差 43 出戏, scope 内修 (1 line). 注: 未来若严格 audit pre-existing, 可能还有类似 case.

### CC second-pass sanity sweep (user 问 "都 check 过了?" 触发)
跑 CC 独立 sanity (debutAge < 13 or > 50, lifespan < 25 or > 85) 在全 212 entries:
- 5 flag → 3 keep (程昱 史载, 董卓+陶谦 debutYear schema gap) + 2 revert (马铁/马休 b178→b170)
- 马铁/马休 issue: 我之前依 codex 建议 override 178 解决父代差 14, 但弄出 debutAge 12 (190-178=12), 比代差 14 更出戏. 回退 heuristic b170. 给 followup 标注 debutYear=190 schema gap.

经验沉淀:
- codex final review focus 父代差 (Type 3), miss 了 debutAge (Type 2)的 trade-off. CC 应该 second-pass sanity 验证 override 是否引入新 issue.
- "all checked" 意味着 codex sweep + codex final + CC heuristic + **CC second-pass sanity**.

### tools/
- `tools/patch_gen_base_birthyear.js` 完整 reproduce 整个流程 (CODEX_VALUES dict + heuristic + sanity + MANUAL_OVERRIDE dict)

smoke + compare PASS (51 snapshots identical, src/data/ 未 wire 到 runtime).

---

## 2026-05-14 (刘磐 followup — audit v2 漏的史实修)

audit v2 (commit `374ac8a`) 把黄忠从 pending → active in liubiao xiangyang, 但**刘磐**(刘表从子, 史实「与黄忠共守长沙攸县」)当时不在 codex audit list, 留作 followup. 本次补.

### 4 处改动
1. `src/data/general_base.js:4605` — 刘磐 debutYear 200 → 190 (跟黄忠 audit v2 同步)
2. `src/data/scenarios/190.js:682` — 黄忠 relations `[]` → `[{target:刘磐, 同僚, 75}]`
3. `src/data/scenarios/190.js:683` — 刘磐 active entry (新增, fac:liubiao, city:xiangyang, post:裨将, loyalty:85, merit:180, retainer:700 cavalry, relations: 黄忠 同僚 75)
4. `src/data/scenarios/190.js:754` — pending 池 刘磐 entry 删除

### Bonus: stale count 修复 (codex review catch)
- `provenance` 字段 "83 active" 是 phase 4-d 旧数, 实际累计到 103 (我改完 104)
- 第 482 行 inline "─── 83 active 武将 (14 ruler + 69 心腹) ───" 同 stale, 修成 104 / 14 + 90 心腹
- 这是 audit v2 / phase 4-c/4-e 都没更新的累积漂移, 本次顺手修

### 字段选择 (codex LGTM)
- city: xiangyang (长沙=sunjian, 不能放; 襄阳是州治, 跟黄忠捆)
- post: 裨将 (中郎将下一级, 史载无具体官职给保守一档)
- retainer: 700 cavalry (GEN_BASE 刘磐 cav/light/heavy 都 A; 比黄忠 900 略少)
- loyalty: 85 (刘表从子 > 黄忠 80)
- relations: 黄忠 同僚 75 mirror

### Codex review (commit ?)
Q1 史实 PASS / Q2 schema PASS / Q3 runtime 未 wire 验证 PASS / Overall LGTM (74K tokens)

smoke + compare PASS (51 snapshots identical, src/data/scenarios/190.js 未被默认 runtime 加载 — scenario_loader.js 默认 applyScenario('214'), main.js initGame 入口未传 190, initGame 仍读 legacy GENS_FULL).

SCENARIO_190 累计: **104 active / 14 wild / 94 pending = 212/212**.

---

## 2026-05-13 (stats audit — com/war/int/pol/cha/apt + classTag, 8 entries 修)

**main HEAD: `3d4a36f`**. User spot-check 吕布 com=75 偏低 → 改 88 → 跑 codex stats audit (212 entries 全量, KOEI 经验 + schema 阈值标准) → catch 9 finding → 修 7 (P1 schema 3 + P2 微差 4, P3 边界跳过).

### 修值 (8 个 含吕布)
- **吕布 com 75→88** (user spot-check, KOEI 经典 com 88 / war 100)
- **袁术 classTag commander → civilian, classTagsAll [commander,ruler] → [civilian,ruler]** (com=60 < 70 commander 阈值; KOEI 袁术本就文官诸侯)
- **张允 war 55→60** (warrior 阈值)
- **刘琮 pol 55→60** (civilian 阈值; weak ruler 边界值不改 classTag)
- **蔡瑁 naval S→A** (五维 65/60/60/55/55 不支撑 S, 跟周瑜/甘宁 S 级别混淆)
- **祖茂 naval A→B** (孙坚亲卫勇将, naval A 略高)
- **陈登 naval A→B** (双 A apt 功能性过强, 保留 siege A)
- **袁绍 com 78→85** (河北统帅/讨董盟主, 78 跟 commander primary 略低)

### Audit limitation 沉淀
- **catch 量 9 vs debutYear 29** — codex 对数值精度低 (没有 historical anchor 像"刘表中郎将"那种), ±5-10 都算合理
- audit confidence 中高 (KOEI 经验非联网 spot-check)
- **GEN_BASE 数值整体 KOEI 风格 OK** — phase 4-a 80+ "小将"批次也没找到大错
- **P3 跳过** — codex 说"没错但偏模板化" (田楷 com:70/war:70/int:65 + 关靖 int:70 边界阈值)

### Codex 提议 follow-up (不做)
- 二轮 apt 专审 (naval S/A + cavalry S 分布) — 按"不出戏"标准跳过, 微差不出戏

### 数据层 audit 闭环
- ✅ debutYear / deathYear (v1+v2 audit)
- ✅ com/war/int/pol/cha/apt (stats audit)
- ✅ classTag schema 一致性
- ✅ skills (by design: 已实装 83 保留 + 其余 129 留 [], 不补 stub — 见 2026-05-14 design note)
- ❌ birthYear (大量 null) 待 sprint
- ❌ wildMeta 合理性 (codex 不擅长, user spot-check)

---

## 2026-05-13 (audit v2 — user spot-check 黄忠 trigger 4 entries 补)

**main HEAD local: `374ac8a`**. User 抽查黄忠 debutYear=200 catch 与刘表中郎将史实不符 → 跑 codex v2 sweep (focus debutYear + 反例精确) → 21 新 finding → 按 user **"不出戏"** 标准筛选 4 必修.

### "不出戏" 标准 (user 原话)
> 我觉得我们也不是要特别精准，就不要出戏，比如这人比演义/历史提早出现很多，或者已经活跃了但还没出现。具体年份可以靠估，没必要100% accurate

→ 精度宽松, 但**两种 case 必修**: (a) debutYear 太晚导致 active/pending 时实际已活跃; (b) debutYear 太早导致比演义提前太多.

### v2 必修 4 (commit `374ac8a`)
1. **黄忠**: GEN_BASE.debutYear 200→190 + SCENARIO_190 pending→active in liubiao xiangyang (中郎将, 史实刘表麾下与刘磐共守长沙攸县)
2. **鲜于银**: GEN_BASE.debutYear 208→188 + SCENARIO_190 pending→active in liuyu youzhou (军候, 史实跟族兄鲜于辅 188 入刘虞幕)
3. **宗宝**: GEN_BASE.debutYear 200→190 (SCENARIO_190 已 active in kongrong, schema 一致)
4. **徐盛**: GEN_BASE.debutYear 210→200 + SCENARIO_190 availableYear 210→200

### v2 不修 17 (按"不出戏"标准)
- 军阀诸侯 8 (董卓/刘焉/陶谦/刘虞/孔融/马腾/袁绍/袁术) debutYear 188-190 vs codex 推 184: 都 ≤190 active 合理
- 阎柔 178 / 笮融 180 / 田楷 184: 偏早 7-15 年, 190 期 active 都合理
- 甘宁 200 / 丁奉 225 / 刘晔 198 (vs 199): marginal
- 益州张松/王累/吴兰 190 vs codex 194+: codex 可能错 (刘焉 188 入益州, 他们 190 在刘焉麾下合理)

### Audit limitation 沉淀 (memory)
- **codex 反例都给了还漏黄忠** — training data 细节不够, 不能 100% 信
- **codex v2 报告 GEN_BASE 数值自己报错** (说周瑜 GEN_BASE=200, 实 195)
- **结论**: codex audit catch ~70-80%, 剩 ~20-30% 靠制作人 spot-check
- **流程**: codex sweep → 制作人 spot-check 1-2 个熟知武将 → 如果 catch 漏 → 二次 sweep + 精确化 prompt

### Follow-up todo
- **刘磐** SCENARIO_190 pending availableYear=200, 史实刘表从子"与黄忠共守长沙攸县", 应 active in liubiao. 不在 audit list, 留下次 sprint.
- 黄忠 active relations 暂留空 (蔡瑁同 pattern), 未来加 "刘磐 同僚 75".
- **军阀诸侯 debutYear** (董卓 189 / 刘焉 189 / 孔融 190 etc.) 偏晚但不出戏, 留低优.

smoke + compare PASS (1 次间歇 puppeteer race fail 后 re-run PASS).

---

## 2026-05-13 (GEN_BASE 全量 audit sprint — 35 entries + B.2 fix)

**main HEAD local: `82b4e5c`** (origin/main 仍 `b5c68d4`, 3 commit 待 push).

### Commit 序列 (3 commit)
- `4d2a844` docs(memory): tier A done + B.1/B.2 决策修正 + audit sprint todo
- `016479c` fix(gen-base-audit): codex full audit P1 + P2 + B.1 batch fix (35 entries)
- `82b4e5c` fix(scenario-190-b2): 孙策/马超 active → pending (codex audit B.2)

### Codex audit 结果 (0 P0 / 21 P1 / 8 P2 / 0 blocker)
**报告**: `tmp/audit_gen_base_result.md` (gitignored). prompt: `tmp/audit_gen_base_prompt.md`.

**主战场**: line 4550-4582 (W1.1-c 期"wild+inactive+nanman+new 106"批次) 批量 cross-pollution, 18 个 deathYear 全错. 关键例:
- 华雄 deathYear 274 / debutYear 246 → 串到后三国人物 (W1.1 期复制粘贴拿错 row)
- 董卓 200→192 / 李傕 206→198 / 袁绍 191→202 / 文丑 197→200 etc.
- 刘表 191→208 (荆州病死) / 蒯越 191→214 (208 投曹后多年)

**新发现 (上次 final review 没 catch)**:
- 田楷 debutYear=170 / 赵浮 172 (1a 期填错? 太早, 改 184/190)
- 张邈 deathYear null → 195 (兖州兵败死)
- 文聘 deathYear null → 226 (codex P2 catch); debutYear 208→188 (B.1 已决)

### 字段口径决策 (制作人 approve)
`debutYear = 首次仕官年` (不是"成名年" / 不是"投靠某主年" / 不是"首次见于史载"年).
- 例: 文聘 188 (原刘表大将), 不是 208 (投曹年)
- 例: 司马懿 208 (曹操辟为文学掾, 首次仕官)
- 加 header comment to `src/data/general_base.js` line 7-12.

### B.2 决策 (孙策不豁免)
制作人指明"晚 1 年简单, 别引入豁免规则". 孙策/马超统一改 pending, availableYear == GEN_BASE.debutYear (191/195, future-proof for phase 6 derive).
- foundingCore 数组保留 (含孙策/马超, 语义"集团核心", 出场后再算)
- 反引 relations 保留 (孙坚/马腾/马铁/马休 → 孙策/马超, 亲属跟 status 无关)

### Value 来源分层 (audit 责任审计)
- ~27 codex 给具体值 (P1 cross-pollution 18 + P2 8 + 张邈/文聘 deathYear)
- 6 CC 推 + codex flag (华雄 189 / 田楷 184 / 赵浮 190 / 庞德 189 / 鲜于辅 188 / 文聘 debutYear 188), anchor 在史实事件
- 5 之前 B.1 已决 (卫兹 189 / 纪灵 190 / 田畴 192 / 韩遂 184 / 阎行 189)

### smoke + compare
两次都 PASS (51 snapshots identical, src/data/ 未 wire 到 runtime).

### 后续 (下次 sprint)
- **availableYear vs debutYear 冗余**: 现 pending 武将的 availableYear 基本 == GEN_BASE.debutYear. phase 6 wire 时考虑 availableYear 完全 derived 删 SCENARIO 字段.
- **birthYear 大量 null** 补全 (单独 sprint).
- **GEN_BASE +80 skills=[] stub** (单独 sprint).
- **平衡 / phase 5 UI / phase 6 wire**: audit sprint 完, 可以启动这些 work.

---

## 2026-05-13 (codex tier A fix + B.1/B.2 决策修正 + audit sprint todo)

**main HEAD: `b5c68d4` (origin/main 已同步)** — `fix(scenario-190-tier-a): codex final review tier A 5 finding`.

### Tier A 5 finding 已 fix (1 commit)
- **A.1 改方案**: 不补 dead entry — **删 GEN_BASE.桥瑁** (deathYear=190, 最早剧本 190, 永不登场, dead shape 设计需求消失). GEN_BASE 213 → 212; SCENARIO_190 212/212 全覆盖.
- A.2 刘虞 debutYear 200 → 188 ✓
- A.3 公孙瓒 debutYear 200 → 184 ✓
- A.4 严纲 debutYear 200 → 190 ✓
- A.5 曹丕 availableYear 204 → 205 ✓ (+ wildData.post.desc "204 才出仕" → "205 才出仕")
- smoke + compare PASS (51 snapshots identical, src/data/ 未 wire 到 runtime).

### B.1 决策修正 (mixed → 8 改库)
制作人反问"文聘 208 也可以早点出道(刘表手下), 是不是数据库有误?" — **答:是**. 重审 9 武将 debutYear:
- 文聘 208 实是"投曹"时间, 刘表大将早就在了 → 改库 ~188
- 鲜于辅 204 / 田畴 200 同类错误 (前者刘虞 188 上任就在, 后者 192 给刘虞当使者史载明确)
- 全部 9 个都是数据库错, **8 个改库 + 1 个 (马超) 归 B.2** (而非 mixed)

### B.2 决策修正 (孙策不豁免)
制作人提议**孙策晚 1 年 (191 出场) 简单, 别引入豁免规则**. 同意.
- 孙策 改 pending availableYear=191 (而非 active 史实豁免)
- 马超 改 pending availableYear=194
- 18 岁标准不动 (改 16 不解决问题, 改 14 影响面太大)
- 跨剧本 apply ✓ (debutYear 在 GEN_BASE)

### 下次 sprint: GEN_BASE 212 entries debutYear + deathYear 全量 audit
**Rationale**: codex final review 仅 catch "190 active 但 debutYear > 190" 的 query, GEN_BASE 其他 200 entries 同类错风险未审. CC spot-check 庞德 189 / 公孙瓒 184 / 卫兹 189 等数也是 history estimate, 精度不一定够.
**做法**:
1. codex 跑全量 audit query ("212 entries 的 debutYear / deathYear 跟 history 比对, catch 明显错")
2. codex 不 reliable 部分 (细年份) 制作人 spot-check
3. audit 完后 batch fix: B.1 8 改库 + B.2 孙策/马超 改 pending 一起进
**预估**: 几小时 codex + 整理 + 拍板.

### Schema 备忘: availableYear vs debutYear 冗余
大部分 pending 武将 availableYear == debutYear (诸葛亮 207=207, 司马懿 208=208 etc.), 唯一例外是剧情驱动延后 (可能不存在). phase 6 wire 时考虑 availableYear 完全 derived from GEN_BASE.debutYear, 删 SCENARIO 内字段. 现在不动.

---

## 2026-05-14 (post-push final review) — codex sprint final review NEEDS-WORK + todo

**main HEAD: `17dab5b` (origin/main 已同步)** — sprint W1-W3 + 4-e 9 commit 已 push 后做 single final-state codex review (2c55abe..17dab5b, src/data/ only, ~156K diff). codex 报 NEEDS-WORK, 0 P0 / 4 P1 / 1 P2 / 0 P3 finding. 全 verified valid.

**Codex review 报告原文**: `tmp/codex_sprint_final_review.md` (gitignored, local only). prompt: `tmp/sprint_final_review_prompt.md`. diff: `tmp/sprint_final_review_diff.txt`.

### Tier A — 纯数据错 (CC 可独立 fix, 待制作人 approve 启动)

5 finding 同质, 建议 1 commit `fix(scenario-190-final-review): tier A 5 finding`:
1. **A.1 桥瑁 dead entry 缺** — `src/data/scenarios/190.js:491` SCENARIO_190.generals 内无桥瑁; GEN_BASE.桥瑁 deathYear=190 存在. memory 旧描述 "dead 1 = 213/213" 与实际 "dead 0 = 212/213" 不符. fix: 加 `"桥瑁": { "status":"dead", ... }` (按 W2.2 dead shape).
2. **A.2 刘虞 debutYear 200 > deathYear 193 硬错** — `src/data/general_base.js:4607`. fix: debutYear 200 → 188 (188 任幽州牧).
3. **A.3 公孙瓒 debutYear 200 > deathYear 199 硬错** — `general_base.js:4615`. fix: 200 → 184 (184 黄巾起兵).
4. **A.4 严纲 debutYear 200 > deathYear 192 硬错** — `general_base.js:4616`. fix: 200 → 190 (公孙瓒部下).
5. **A.5 曹丕 availableYear:204 / birthYear:187 = 17 岁 off-by-1** — `scenarios/190.js:701` (W2.2). 成年 ≥18 标准下应 18 岁. fix: availableYear 204 → 205.

### Tier B — 设计层 (需制作人决, 不擅自 fix)

#### B.1 — 9 武将 debutYear > 190 但 SCENARIO_190 active

| 武将 | debutYear | fac | 史实判断 | CC 建议 (选项 3 mixed) |
|------|-----------|-----|---------|---------------------|
| 纪灵 | 191 | yuanshu | 袁术部将 190 已仕 | debutYear → 190 |
| 卫兹 | 191 (deathYear 199 也错史载 190 死) | caocao | 189 助曹起兵 | debutYear → 189 (deathYear 留下次) |
| 文聘 | 208 | liubiao | 208 才仕曹, 190 时刘表年轻部下 | debutYear → 190 |
| 鲜于辅 | 204 | liuyu | 原刘虞从事 | debutYear → 190 |
| 田畴 | 200 (birthYear 169) | liuyu | 169 生 200 出仕 (31 岁), 190 才 21 岁士隐未仕 | **移 pending availableYear=200** |
| 韩遂 | 194 | hanfu(?matenghan) | 184 凉州起兵已成名 | debutYear → 184 |
| 庞德 | 194 | matenghan | 190s 仕马腾 | debutYear → 189 |
| 阎行 | 196 | matenghan | 190 已仕韩遂 | debutYear → 189 |
| 马超 | 195 (birthYear 176) | matenghan | 14 岁, 落 B.2 | 见 B.2 |

**选项**: (1) 全调 debutYear ≤190 一刀切 (田畴 history-correct 被牺牲) / (2) 全移 pending (4-d active list 被推翻) / **(3) mixed** (上表, CC 推荐) / (4) 跳 B.1 留 future.

#### B.2 — 孙策 (15 岁) / 马超 (14 岁) active < 18

- **孙策** birthYear 175, fac=sunjian (heir). memory 4-d **明确 ack** "informational warning 孙策 16 岁<18" 保留 active. 历史宗子继承例外.
- **马超** birthYear 176, fac=matenghan (heir). memory 4-e 加时**无 ack**, 可能漏检.

**选项**: (1) **只马超改 pending availableYear=194** (CC 推荐 — 孙策 4-d 已 ack, 马超漏检纠) / (2) 都保留 active 走"宗子继承"例外 / (3) 都改 pending (孙策 4-d 决策被推翻).

### Review workflow 验证 (memory 沉淀)

- **single final-state codex review 性价比 verified** — 9 commit (~156K diff) 1 次 review, codex catch 5 类技术 finding 全 valid, 史实精度类 (12 武将 debutYear 具体年份对错) 仅作 flag 不强判, 与 `feedback_codex_single_final_review.md` 预期符合
- **流程**: 探针 1465 tokens 通 → 正式 review → 报告读 → tier 分类 (A 纯技术 / B 设计) → user decision pending
- Push 后 review 的 caveat: fix 必须新 commit (无法 amend), 但 audit trail 反而清晰

---

## 2026-05-14 (streamline 续) — 4-e SCENARIO_190 23 漏列闭环 (1 commit)

**main HEAD local: `25d1c51` scenario-190-4e** (origin/main 仍 `2c55abe`, 16 commit 未 push)

- `25d1c51` 4-e: 23 应 active/pending 漏列武将补 + W2.2 dedup fix (文聘/鲜于辅 误重复)
  - active 20 entries 按 fac 补: caocao 4 / dongzhuo 4 / yuanshao 2 / liubiao 2 / liuyan 3 /
    taoqian 1 / matenghan 2 / hanfu 1 / kongrong 1
  - pending 3 entries (liubiao 漏): 刘磐/刘琦/刘琮

**SCENARIO_190 最终**: active 103 / wild 14 / pending 95 / dead 1 (桥瑁) = 213/213 ✓
GEN_BASE 全 213 entries 在 SCENARIO_190 内有归属.

---

## 2026-05-14 (streamline push) — 跨剧本武将信息梳理 sprint W1-W3 (8 commit)

**main HEAD local: `b6c335e` scenario-214-w3** (origin/main 仍在 `0b3e043`, 15 commit 未 push: 7 SCENARIO_190 + 8 跨剧本梳理)

**design 决策** (session 开头确认):
- A 类 cross-scenario invariant → GEN_BASE: birthYear/deathYear/debutYear + wildMeta {title,post}
- B 类 scenario-specific → scenario.generals.wildData: loyalty/merit/retainer/relations + pendingFac/availableYear
- "未出生" (birthYear > startYear) 也进 scenario as pending (按 GEN_BASE.debutYear)
- 不加 GEN_BASE.historicalFaction (scenario 显式填 pendingFac)
- 成年标准 ≥18 (确实成年才算 active/wild, 否则 pending)

**8 commit (streamline mode, sprint W1.1 a/b/c/d + W1.2 + W2.1 + W2.2 + W3)**:
- `9931b30` W1.1-a: GEN_BASE wei 45 武将 三年字段 (155 曹操 → 235 司马昭)
- `66dfad6` W1.1-b: GEN_BASE shu 32 武将 三年字段
- `862789d` W1.1-c: GEN_BASE wu 30 武将 三年字段
- `aa86438` W1.1-d: GEN_BASE wild 16 + inactive 8 + nanman 2 + 80 新加 = 106 武将 三年字段
- `166fbe3` W1.2: GEN_BASE 加 24 wildMeta {title,post} (源 WILD_GEN_META) + GEN_POOL_INACTIVE 8 三年字段补 + **cross-pollution bug fix** (典韦/陈宫/田丰 birthYear 误填邻 entry 值 phase 1a 历史 bug)
- `2d4b820` W2.1: SCENARIO_190 wild 池 14 武将 (audit 派生)
- `dc2a4d5` W2.2: SCENARIO_190 pending 池 94 武将 (audit 派生, pendingFac 14 fac 映射)
- `b6c335e` W3: SCENARIO_214 跨剧本对齐 — wildMeta +8 (32 total) + SCENARIO_214 24 entries 删 title/post

**SCENARIO_190 最终状态** (193/213 entries covered):
- active 83 (phase 4-d) / wild 14 (W2.1) / pending 94 (W2.2) / dead 1 桥瑁
- 23 应 active 漏 (留下次 sprint):
  - caocao 漏 4: 乐进/李典/曹纯/史涣
  - dongzhuo 漏 4: 胡轸/樊稠/张济/高顺
  - yuanshao 漏 2: 高览/淳于琼
  - liubiao 漏 5: 张允/王威/刘磐/刘琦/刘琮
  - liuyan 漏 3: 刘璋/王累/吴兰
  - taoqian 漏 1: 张闿
  - matenghan 漏 2: 马铁/马休
  - hanfu 漏 1: 张郃
  - 无 fac 1: 宗宝 (小说人物)

**GEN_BASE 最终状态**:
- 213 entries × {com/war/int/pol/cha/apt/birthplace/clan/gentry/classTag/skills/values} ✓
- × {**birthYear/deathYear/debutYear**} ✓ (本 sprint W1.1)
- × {**wildMeta** {title,post}} 32 entries ✓ (本 sprint W1.2 + W3)
- 仍未填: birthYear 大量 null (生年史载缺), deathYear 部分 null
- 0 runtime consumer (wire 留 phase 6)

**SCENARIO_214 最终状态**:
- 101 active / 6 wild / 18 pending = 125 武将
- wild/pending 24 内 wildData.title/post 全删 (从 GEN_BASE.wildMeta 派生)
- wildData 内只留 loyalty/merit/retainer/relations + pendingFac/availableYear/skillsOverride

**Codex review 跳过** (sprint streamline 数据填充类 batch — 同 phase 4-b/4-c/4-d 模式).

**剩余 future work**:
- 23 应 active 漏 fix (4-e 类型 sprint)
- 平衡 phase: res/troops/pop 数值实玩调
- phase 5: 启动 UI scenario 选择 (214 / 190 切换)
- phase 6: runtime wire — scenario.generals 字段消费 + tick deathYear 自然死亡 + debutYear 出场触发 + wildMeta fallback

**Session 不变 (smoke 守底)**:
- 默认 applyScenario('214') 完全不变, 8 commit 全 smoke 51 snapshots byte-identical PASS

---

## 2026-05-13 (streamline push) — 阶段 2-a/2-b/3/4-a/4-b/4-c/4-d SCENARIO_190 7 commit

**main HEAD local: `976cb1e` scenario-4d** (origin/main 仍在 `0b3e043`, 7 commit 未 push)

7 commit (streamline mode, user-driven 自决进度):
- `9261720` 2-a: 基础设施 — 14 faction_base entry (190 诸侯) + scenarios/index.js + scenarios/190.js stub + scenario_loader.js 通用化 (SCENARIOS register lookup, 删 hardcoded 214 throw). codex LGTM 16K zero findings.
- `528fc70` 2-b: SCENARIO_190 factions 14 势力 + diplo 91 pair (F.1 invariant). codex trial 1 NEEDS-WORK (catch F.1 missing 48 pair) → trial 2 NEEDS-WORK (catch 真 P1 again) → trial 3 LGTM (37K).
- `597c981` 3:   SCENARIO_190 cities 55 城 fac/pop/troops/isCapital + emperor luoyang/dongzhuo. codex LGTM 49K (1 P3 nit emperor null 顺手补).
- `e04b7f5` 4-a: GEN_BASE +80 个 190 期武将 entries (133→213). 14 fac × 5-10 武将, 含 KOEI 数值经验推理. codex LGTM 57K zero findings.
- `dcb259b` 4-b: SCENARIO_190.generals 60 active 武将 (14 ruler + 46 心腹). 不调 codex, scenario_validate.js 190 PASS 0 errors 自验.
- `56e6d49` 4-c: relations 双向 + initialUnits[] 24 squads + foundingCore. 不调 codex, validator PASS.
- `976cb1e` 4-d: **user feedback driven** — 60 active 太少 (田丰/沮授/张辽 应在 fac 不应"消失"). 重 audit GEN_BASE 内 history-correct 190 任职武将 → +23 active (60→83). validator PASS 0 errors 1 informational warning (孙策 16 岁<18).

**SCENARIO_190 最终状态** (minimum viable playable):
- 14 fac × ruler + 心腹 active (caocao 12 / yuanshao 9 / dongzhuo 8 / gongsunzan 7 / sunjian/matenghan 6 / liubiao/liuyan/taoqian/yuanshu 5 / hanfu/liubei/liuyu 4 / kongrong 3)
- 91 diplo pair (43 史实 + 48 default neutral)
- 55 cities 全分配
- 24 squads × 14 fac initial 部队
- 38 relations 关系条目 (刘关张/曹氏宗族/卢植同门/袁兄弟反目/孙坚孙策父子/马腾马超父子/糜氏兄弟 等)
- foundingCore 83 members (14 fac × 3-12)

**Codex review 经验沉淀** (CC streamline 决策):
- architectural / invariant 复杂 batch → codex 调 (2-a/2-b/3/4-a)
- data 填充 batch → 跳过 codex, scenario_validate.js 自验 (4-b/4-c/4-d)
- 2-b trial 1 false alarm (GB2312 乱码) + 真 P1 (F.1 91 pair) — codex 真实价值
- 节省 ~120K tokens + ~20 分钟

**剩余 future work** (留下次 session):
- wild 池: GEN_BASE 内 130 武将不在 190 active. 其中部分 should be wild (e.g. 陈宫 190 未仕 但 190 已成年; 徐庶 同). 需 mini-sprint 决定 wild 范围 + wildData (title/post/loyalty/merit/retainer)
- pending 池: 200+ 出山武将 (诸葛亮/陆逊/邓艾/钟会/姜维 等) availableYear 字段
- skills 设计: GEN_BASE +80 现 skills=[] stub (单独 sprint 给 80 武将设计技能)
- 平衡 phase: res/troops/pop 数值实玩调
- phase 5: 启动 UI scenario 选择
- phase 6: 年龄 hook (birthYear/deathYear 数据补全 GEN_BASE)

**Session 不变 (smoke 守底)**:
- 默认 applyScenario('214') 行为 完全不变
- 7 commit 全 smoke 214 51 snapshots byte-identical PASS

---

## 2026-05-12 (audit follow-up) — 1f-p4-p4 / 1f-p4-p5 全图 orphan sweep

**main HEAD pushed: `46bf5a8` refactor(scenario-1f-p4-p5)**

2 commit (audit-driven, session 末 user ask 触发):
- `92e636f` 1f-p4-p4: COUNTY_DATA langya +莒县 / suzhou +钱唐 — 徐盛/全琮 fix (codex LGTM 62K)
- `46bf5a8` 1f-p4-p5: **audit sweep full** — 12 city 补 15 县 + 13 birthplace 字符串改 (codex LGTM 46K zero findings)

**audit sweep 流程**:
1. CC 写 audit script (载 GEN_META + WILD_GEN_META 合 131 武将, 跑 birthplace → COUNTY_NAME_TO_CITY 后缀匹配)
2. 初版 audit script 漏 WILD_GEN_META, 用户 全修 决定后才扩 audit, catch 5 个 wild 武将 (李严/申耽/蒋琬/费祎/郝昭)
3. 分级: 类 A (县名缺) → state_county 加 county; 类 B (同义县名) → 改 generals.js birthplace 字符串; 类 C (郡级 birthplace) → generals.js 加县级后缀

**audit 战绩**:
- 修前 (1f session 末): 31 orphan (徐盛/全琮 + 1a 遗留 23 + WILD_GEN_META 漏覆盖 5)
- 修后: 98 matched / 33 真 OFFMAP (地图未覆盖) / 0 should-fix
- popShare sum 33 city all-clear sum=[0.99, 1.01]
- cascade diff (vs phase1f_p4_p4): factions.{wei,wu,nanman}.res.gold 微变 + event RNG drift (合理 cascade)

**baseline 演进** (1f-p4-p3 之后):
- phase1f_p4_p4_complete (莒县/钱唐)
- phase1f_p4_p5_complete (全图 audit sweep, **当前默认**)

---

## 2026-05-12 (晚) session — scenario 1e/1f 全完成

**main HEAD (待 push): `f28b0eb` fix(v181-latent): getGenBirthplace 读 GEN_META 不是 GEN_TAGS**

12 commits (local 累积, 一次性 push):
- `f73fb39` scenario-1e validator (设计 doc §9 A-M 全 13 节, scenario_validate.js)
- `432694c` scenario-1e-p2 (codex P1.1 F.1 missing pair + P1.2 squads guard)
- `4bbf5e4` scenario-1f (河北 3 新城 bohai/pingyuan/zhuojun → 48 cities)
- `199d028` scenario-1f-p2 (+5 城 徐州 xiaopei/donghai + 荆南 wuling + 关陇 shangdang/anding → 53)
- `75cee4e` scenario-1f-p2-p2 (region set QINGXU/JINGZHOU + history split)
- `186a54e` scenario-1f-p3 (江东 suzhou + 徐州东北 langya + bingzhou r=11→8 上移 → 55)
- `3d0f0da` scenario-1f-p3-p2 (STATE_CITIES 10 新城分州 + npm compare default)
- `45a6ded` scenario-1f-p3-p3 (STATE_TIER 4 升级 yu/xu→large, qing/you→medium)
- `3ab4005` scenario-1f-p4 (COUNTY_DATA 10 + 3 magnate move 谯县/朐县/吴县 history-correct)
- `8d6534e` scenario-1f-p4-p2 (suzhou 吴县 type='clan_base' + 娄县 seat — gentry trigger)
- `68fe3d7` doc nit (compare.js header baseline doc 同步)
- `f28b0eb` **v181 latent fix** (getGenBirthplace 读 GEN_META 不是 GEN_TAGS — v170 籍贯系统终于 work)

**最终状态**: 55 cities (wei 29 / shu 11 / wu 14 / nanman 1), 完整 COUNTY_DATA (10 新城 + 3 magnate move),
22 武将 home city 史实正确化 (曹氏×9/夏侯氏×3/许褚 → xiaopei; 糜竺/糜芳 → donghai; 顾雍/陆逊/陆抗/朱然/朱桓 → suzhou).

**baseline 演进**: data_completion_complete → phase1f (48) → phase1f_p2 (53) → phase1f_p3 → p3_p2 → phase1f_p4 → p4_p2 → **phase1f_p4_p3 (当前)**.
旧 baseline 全保留作回归.

**codex sweep 8 latent bug catch**:
1. F.1 missing pair (1e validator scope)
2. squads.forEach crash (1e validator scope)
3. region set QINGXU/JINGZHOU 缺新城 (1f-p2)
4. STATE_CITIES 10 新城分州 (1f-p3)
5. STATE_TIER 4 州升级 (1f-p3)
6. suzhou 吴县 type='seat' clan logic 不 trigger (1f-p4)
7. v181 latent getGenBirthplace 读错表 (v170 籍贯系统 silent broken from抽离起)
8. baseline doc 同步 (×2 nit)

**Scenario system 整体进度** (24-36 session 路线):
- ✅ Design doc v3.3
- ✅ 1a.1 主表 + 1a.2 SCENARIO_214 + 1a.3 generals 切片
- ✅ 1b materializeScenario + 10 accessor
- ✅ 1c module migration (413 sites)
- ✅ 1d const 删 + backing 切 G runtime
- ✅ 1e validators 全表 (设计 doc §9 A-M)
- ✅ **1f 11 新城 +1 hex 修订 + COUNTY_DATA + magnate history-correct + v181 latent fix**
- 🔄 下次 session: **阶段 2** (190 势力 + 外交, feature, 1-2 session)
- ⏳ 阶段 3 (190 城市归属) / 4 (190 武将归属) / 5-7

---

## 2026-05-12 (早) session 末状态(本 session 1d 累计 5 commits)

**main HEAD: `6893cc0` refactor(1d-c-p2): codex trial 1 P2 — battle_anim 4 site typeof FAC 守卫删除**

本 session 1d 全 5 sub-session:
- **14e6a4c 1d-α**: _serializeG / _deserializeG verbatim 抽 v181 L1489-L1662 → src/core/persist.js (174 行, byte-identical)
  - C 路线决议: 1d 原 plan "删 const + 切 backing" 受阻 — v181 内 8 site 1c 没扫到, 三选 A (装作没见) / B (v181 in-place 违反 CLAUDE.md) / C (抽离 + migrate). 选 C 最 robust.
- **aee32df 1d-a**: WILD_GENS 集合操作 (forEach/filter/some/push) 7 site → getAllWildGenDefs / addWildGenDef (1c-d 留下的非 .find 操作)
  - chains/general.js (×3) + core/main.js + dev/audit.js (×2) + render/ui_panels.js
  - 故意留 data/generals.js:1030 ALL_GENS spread (data 层自引用 + 加载顺序约束)
- **afb5dea 1d-b**: persist.js 8 site + data/generals.js getGenMeta 1 site (FAC_IDENTITY / ALL_FACS / ETHOS_INIT / WILD_GEN_META) → accessor
  - 新增 getAllFactionIdentities accessor (_serializeG 整 map 迭代用例)
- **be267b1 1d-c**: 设计层 backing 切换 + 删 6 顶层 const
  - 静态 (immutable scenario init): FAC / ALL_FACS / PLAYABLE_FACS / ETHOS_INIT / DIPLO_INIT → scenario_loader.js `let _scenarioMaterialized` 模块级 cache
  - 运行时 mutable: FAC_IDENTITY → G.facIdentity (随 G save/load); WILD_GENS pool → G._wildGenDefs (shared-ref 初始 from WILD_GENS const, byte-identical)
  - 数据源 const 保留: WILD_GENS / WILD_GEN_META (materialize 输入 + ALL_GENS spread)
  - data/factions.js: 删 6 const, 留历史 doc + 'use strict' (phase 4 移除)
  - persist.js: 删 _serializeG `meta.facIdentity` 字段 (G.facIdentity 现 runtime on G, 自动入 snap); _deserializeG 加 fallback `if(!G.facIdentity||!G._wildGenDefs) applyScenario('214')` (旧存档兼容)
  - 设计 doc §8.3 invariant 守住: src/ + v181 grep G.facIdentity[ / G._wildGenDefs[ 仅 accessor/loader 内部, 0 外部 leak
- **6893cc0 1d-c-p2**: codex trial 1 P2 catch — battle_anim.js 4 site `typeof FAC !== 'undefined' && getFactionDef(...).color` 守卫删除
  - 1c-c 漏改 latent: pre-1d-c FAC empty obj (typeof='object') 守卫永真; 1d-c 删 const 后永远 falsy → 颜色永远 fallback ('#888'/'#c96'/'#806040')
  - fix: 删 typeof FAC 守卫, getFactionDef 已内置 null safety (4 site, byte-identical)

**5 commit 累加 smoke vs HEAD baseline byte-identical (除 timestamp)**. captureState 不抓 G.facIdentity / G._wildGenDefs, backing 切换不影响 smoke 输出. codex trial 2 LGTM 0 finding.

**实机测**: 后续做 (push 已授权, 测后如有问题单独 commit fix).

**1d 整体成果**:
- v181: 1805 → 1631 (-174 行, 累计 -95.9%)
- src/core/persist.js 新建 (222 行 = 48 header + 174 verbatim)
- 16 accessor migration site (1d-a 7 + 1d-b 9) + 3 new accessor (getAllWildGenDefs / addWildGenDef / getAllFactionIdentities)
- 6 顶层 const 删 (data/factions.js)
- 设计 doc §8.3 1d row 完成: accessor backing 切 G.facIdentity + _scenarioMaterialized, FAC_IDENTITY 退化为 init snapshot (实际改 G.facIdentity)

**Scenario system 整体进度** (24-36 session 路线):
- ✅ Design doc v3.3
- ✅ 1a.1 主表 + 1a.2 SCENARIO_214 主体 + 1a.3 generals 切片
- ✅ 1b-1 materializeScenario + sync + 1b-2 10 accessor additive
- ✅ 1c-a/b/c/d module migration (413 sites)
- ✅ **1d-α/a/b/c/c-p2 const 删 + backing 切 G runtime + save 格式简化**
- 🔄 下次 session: **1e validators** 实装 + tests/scenario_validate.js
- ⏳ 1f 4 新城 / 2-7 (路线见 docs/scenario_system.md §8)

---

**1d 教训沉淀 (留 followup)**:
- `typeof X !== 'undefined' && X[...]` 守卫模式: 删 const 时容易漏改 (1c-c 漏改 battle_anim 4 site; 1d-c 暴露). 未来类似 const 删除 sub-session 必须 grep `typeof X` 一并清.
- save 格式 meta.facIdentity 字段简化: G runtime state 自动随 snap 序列化, 不需在 meta 单独保存. 同模式可参考: 任何"模块级常量 + 运行时 mutate 字段单独 meta 序列化"的 v172-style hack 都可在切 G 后简化.
- 1d 5 sub-session 拆分模式 (verbatim 抽离 → migration → backing 切换): scenario 4 新城 / 后续 phase 4 可复用.

---

## 2026-05-11 session 末状态(scenario 1a + 1b + 1c 完成历史快照)

**main HEAD: `4308212` refactor(scenario-1b1-p2)**

本 session 1b-1 + 1b-2 工作 (continued from 1a.3):
- **826f4c5 refactor(scenario-1b1)**: materializeScenario + sync 6 顶层 const (mutable container)
- **4308212 codex P2 fix**: sprint_verify byte-identical 严格化 (key order + JSON deep-equal)
- **codex 1b-1 trial 2 LGTM 0/0/0**
- **151cc6b refactor(scenario-1b2)**: 10 accessor (additive API)
  - 新建 src/core/scenario_accessors.js (~75 行)
  - getFactionDef / getScenarioFactions / getPlayableFactions / isPlayableFaction
  - getFactionIdentity / setFactionIdentity (1d 后 backing 切 G.facIdentity)
  - getEthos / getDiploInit
  - getWildGenDef / getWildGenMeta (设计 doc §5.4; 1d 后 backing 切 G._wildGenDefs)
- **codex 1b-2 trial 1 LGTM** with P2 (regression guard 弱 — codex 建议 1c replace) + P3 (getScenarioId 后续)

**71/71 sprint_verify PASS** (post 1b-2), smoke byte-identical 守底 ✅, verify_scenario_214 0 errors
**1c migration scope** (实测): ~430 matches. 大头集中 diplomacy.js / general.js / politics.js / tick.js / main.js

## 1c-a 后状态 (本 session 末尾)

- **05fe27e refactor(scenario-1c-a)**: FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT migration 28 sites + main.js:139-144 删除 (1b-1 P3 close)
- **b5cce69 codex trial 1 P2+P3 fix**: scenario_loader.js 末尾自动 applyScenario('214') 修复 loadFromSlot bypass (1b-1 latent bug). regression guard 自动 walkSrc 全 src/ 43 files.
- **5fe127c codex trial 2 P3 tighten**: auto-apply guard 严格 module-level proof.
- **codex trial 2 LGTM** ✅

74/74 sprint_verify PASS post 1c-a. smoke byte-identical除 timestamp.

下一 sub-session 选项:
- **1c-b ALL_FACS** (134 hits): 大头. 但单 accessor (getScenarioFactions), forEach/filter/includes 形态多.
- **1c-c FAC[** (241 hits): 最大. 单 accessor (getFactionDef).
- **1c-d WILD_GENS** (22 hits): 复杂 find/filter/forEach/push, 设计 doc §5.4 wild lookup contract.

本 session 1a.3 工作 (continued from 1a.2):
- **7e71c32 refactor(scenario-1a.3)**: SCENARIO_214.generals 125 武将切片 + verify_scenario_214.js validator 工具
  - active 101 / wild 6 / pending 18 (含 pendingFac 8 来自 GENS_FULL minTurn>1)
  - 字段完整 active(12) + wild/pending(wildData 7 字段)
  - 设计 doc §9 子集 validator: B.4/C.1-5/E.1/4/5/6/G.4/5/I.5/6/J.1-3/L.2
- **479a209 codex trial 1 NEEDS-WORK fix** (2 P1 + 3 P2 + 1 P3):
  - P1.1 relations 全收编 (INTIMACY_PRESET orphan pair 双向 mirror, 曹操 5→10 / 关羽 4→7)
  - P1.2 scenario.initialUnits[] 字段 (7 units / 14 squads, 设计 扩展, 1b byte-identical 必需)
  - P2 validator 严格化 (E.1 升 error + initialUnits schema check + INTIMACY_PRESET 覆盖 sprint_verify)
  - P3 city fallback 标 synthetic comment
- **codex trial 2 LGTM 0/0/0** (无 regression, 1a.3 closed)

**sprint_verify**: 61/61 PASS (44 base + 17 scenario: 8 1a.1 + 7 1a.2 + **12 1a.3**)
**verify_scenario_214.js**: 0 errors / 4 warnings (4 RETAINER_PRESET 漏 — v181 数据 issue 非 1a.3 bug)

本 session 完成 (1a.2 sprint, 3 commits):
1. **2eebbfb refactor(scenario-1a.2)**: SCENARIO_214 主体切片
   - 新建 src/data/scenarios/214.js (521 行 / 10 KB): id/version/name/startYear/emperor/factions/diplo/cities/generals
   - factions (4): ruler/playable/type/_baseType/traits/stage/anchorState/ethos/res/reputation/emperor/techPreunlock/aiPersonality/foundingCore
   - diplo (6 edges): 4-tuple [a,b,rel,status] (+ 5th suzerain 当 vassal, shu-nanman)
   - cities (45): {fac, pop, troops, isCapital} 投影, 显式 bool
   - emperor (top-level): {cityId:'ye', holder:'wei'} 1:1 mirror G.emperor (设计 doc §7.2 只有 emperorHolder, 加 cityId 保 init 字面)
   - generals: {} 占位 (1a.3 sprint 补全)
   - extract tool 扩展: 加 seedrandom + 调 initGame() 后读 G.factions[fid].res / G.reputation / G.emperor (运行时单一权威源)
2. **9ebd478 codex P2 (trial 1 LGTM with 5 P2)**: doc drift fix (§3.4 ethos keys / aiPersonality / res 例) + 5 sprint_verify (ethos schema / aiPersonality schema / techPreunlock TECH_TREE ref / diplo.rel range / version semver)
3. **42382f8 codex P2 (trial 2 NEEDS-WORK with 2 P2 + 1 升 P2)**: 残余 drift (techPreunlock fake id / cities "49 城" → "1a 45 / 1f 49") + aiPersonality 严格化 (拒 unknown key)
4. **codex trial 3 LGTM 0/0/0** (无 regression, 设计 doc 现跟 runtime 完全一致)

**sprint_verify**: 49/49 PASS (27 现有 + 8 scenario-1a.1 + **14 scenario-1a.2**)

**Scenario system 整体进度** (24-36 session 路线):
- ✅ Design doc (6 trials LGTM, v3.3 + 1a.3 加 pendingFac/initialUnits 扩展)
- ✅ 阶段 1a.1 主表 (GEN_BASE 133 / CITY_BASE 45 / FACTION_BASE 4)
- ✅ 阶段 1a.2 SCENARIO_214 主体 (factions 4 + diplo 6 + cities 45 + emperor)
- ✅ 阶段 1a.3 SCENARIO_214.generals (125 武将: active 101 / wild 6 / pending 18 含 pendingFac 8 + initialUnits 7-14 squads + verify_scenario_214.js validator)
- ✅ 阶段 1b-1 materializeScenario + sync (6 顶层 const sync byte-identical; scenario_loader.js 模块新建)
- ✅ 阶段 1b-2 scenario accessors (10 accessor additive API)
- ✅ 阶段 1c-a FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT migration (28 sites + 1b-1 P3 close + loadFromSlot bypass fix)
- ✅ 阶段 1c-b ALL_FACS migration (134 sites)
- ✅ 阶段 1c-c FAC[ + Object.<*>(FAC) migration (242 sites + getAllFactions accessor)
- ✅ **阶段 1c-d WILD_GENS.find migration** (9 sites; collection forEach/filter/some/push 留 direct, 1d 处理)
- ✅ **1c 阶段全完成** ✅ 总 413 sites migrated, 全 byte-identical 守底
- 🔄 **下次 session: 阶段 1d** top-level const 删 + accessor backing 切 G runtime state (G.facIdentity / G._wildGenDefs)
- ⏳ 阶段 1e validators / 1f 4 新城 / 2-7 (路线见 docs/scenario_system.md §8)

**11 阶段 + 工作量** (vs 历史 codex 估):
| 阶段 | Sessions | 性质 |
|---|---|---|
| 1a 主表 + SCENARIO_214 | 2-3 (1a.1 ✅ + 1a.2 / 1a.3) | refactor 守底 |
| 1b-1/1b-2 materializeScenario + accessor | 3-4 | refactor 守底 |
| 1c hardcoded 214 cleanup | 3-4 | refactor 守底 |
| 1d 删 top-level const | 1-2 | refactor 守底 |
| 1e validators | 1-2 | refactor 守底 |
| 1f 4 新城 (bohai/pingyuan/zhuojun/luyang) | 1-2 | feature 改 baseline |
| 2 190 势力 + 外交 | 1-2 | feature |
| 3 190 城市归属 | 1-2 | feature |
| 4 190 武将 + 关系 | 3-4 | feature |
| 5 启动 UI + Claude AI | 1-2 | feature |
| 6 年龄 hook | 1 | feature |
| 7 实玩平衡 | 3-5 | balance |
| **合计** | **23-34** | |

**关键设计决策已 close** (design doc §3-§13):
- 主表 + scenario 切片 (Option B)
- 武将状态机 active/wild/pending + 出山年
- materializeScenario 单一 rebuild (pure transform)
- 主表 const 用 mutable container 模式 (不 reassign)
- FAC_IDENTITY split-brain 防御 (1c atomic 迁移)
- 15 势力 (8 可玩) + 4 新城 + nanman 跨剧本共享 entry
- Validators 13 类 corner case
- 老存档不做迁移 (user 决策: 无现存档)
- 武将年龄: flavor 字段, 不影响数值 (留阶段 6 hook)
- 关系: 起手 snapshot + game event 累加

---

**截至 2026-05-10 的状态(每次 session 启动前请用 git log 校验,不抄)**:**重构 + 数据补完整体收官 + D 类 HIGH sprint 收官 + _exec 架构债 sprint 收官 + phase 4 + 桶 2/6 + F/G/J/H/I/K/M 全收尾 + B sprint 批 1 (D-006) + 批 2 (7 D 类 streamline) 完成**。

**B sprint 进度** (启动 2026-05-10, 7 链全 sweep 完: 经济+武将+政治+价值观+事件+外交+军事):

- **批 8 军事链 streamline 4 fix** (commits 02d7066/93516ed/01259e4 已 push origin/main):
  - D-015 LOW _execDisband 清亲卫 (玩家/AI 对称, AI 裁军不留 ghost retainers, 跟玩家 disbandUnit L7448 对齐)
  - D-018 MED _execCancelSpecial: camp → 1 旬 campMobilizeTurns 整备 (玩家不能即扎即发, AI 同等约束) + ambush 在城内变 garrison
  - D-018 follow-up (codex trial 3 catch): _execMove + _execSetCamp + _execSetAmbush 全加 campMobilizeTurns + camp/ambush status guard
  - D-019 MED _execCancelSiege: 清 siegeTarget + _siegeTurnCount (跟玩家 cancelSiege L7273 对齐)
  - D-041 LOW 乐进 xiandeng 攻城士气 cap 对称 (v179fix P8 模式: 记 actual added, restore 减实际值, 不再硬编码 -18)
  - **codex review 4 trials**: trial 1 P2 (D-023 trackCityLoss 设计就忽略 rebel 撤回) → trial 2 P1 (sprint_verify conflict marker amend) → trial 3 P2 (_execMove campMobilizeTurns 漏 amend) → **trial 4 LGTM ✅**
  - **D-023~D-030 group default close** (audit pass 2 重新核 ID-to-钩子精确映射):
    - D-023~D-025 大乱: trackCityLoss 设计就忽略 rebel (D-119 verified-with-notes 同模式), 大乱钩子套件其他 14 项已含
    - D-027~D-030 开城: batch-3/17/19 多次完整修, 对比攻城胜利样板 15+ 钩子无明显漏
  - **D-022 已被批 1 D-006 附带 close** (calcRecruitCost helper 含 _postBuffs, 玩家 modal 6 处 + AI 4 处)
  - **D-032/D-033 verified-with-notes** (防御性问题非功能 bug)
  - **D-017/D-036/D-037/D-038/D-040 escalate audit pass 2** (concept_map 无 fix 方向线索)
  - **军事链 sprint scope 全收尾 ✅**: 6 HIGH (HIGH sprint close) + 4 fix (D-015/018/019/041) + 7 group default close + 2 verified-with-notes + 5 defer audit pass 2 + 2 dismissed (D-034/039) = 23

- **Layer-3 sprint_verify.js 模板上线** (commit 0f93c1b, push origin/main):
  - 24 verifies 全 PASS (15 外交链 + 1 军事链 D-019 + 3 D-018 + 1 D-015 + 1 D-041 + 价值观/事件/政治/武将累计)
  - tests/sprint_verify.js: 启 jsdom + initGame + 控制初始 state + assert deltas, 取代 user F12 console paste
  - 跟 smoke.js (Layer-1+2 byte-identical 守底) 互补; 后续每 batch 加 entry, node tests/sprint_verify.js B-DXXX 自动测
  - 模板教训: expose 顶层 const/let / _actedThisTurn marker reset / 静态 grep 模式 / mock Math.random 测失败分支
  - reference_layer3_verify.md 入 memory (后续 sprint 复用)

- **批 6 事件链 streamline 4 LOW** (commits f25939a/e29a55b/7668bfe/069da78 已 push origin/main):
  - D-132 LOW tick.js 全局 _fastForward _pendingEvent 路径补 log (跟 rollEventsV2 内 fastForward / AI 静默 / 玩家弹窗三路径一致)
  - D-134 LOW rollEventsV2 facs 过滤 _eliminated (跟 D-129 同模式, 跟 tick.js:184/693/703 _eliminated guard 一致)
  - D-143 LOW events.js quanjin_biao + return_emperor 4 处 log '主公' → FAC[fid]?.name 势力名 + return_emperor ① showNotif 加 fid===G.playerFac gate (event playerOnly:false, AI 触发不弹给玩家)
  - D-145 LOW events.js gen_referral 婉拒 G._eventCooldown['gen_referral_'+wName]=6 死冷却 key 删 (key 跟 def.id 不匹配, 写后永不读, grep 全 src/ 0 read site) + desc '6旬不再来投' 假承诺 desc 改为只描述真实效果
  - codex 集中 trial 1 LGTM (零 finding 零 concern)
  - 实机测真实情况: D-129/D-132/D-134 _eliminated/快进 latch 触发苛刻 smoke 50 旬 5 势力没死 byte-identical 是空 verification, D-143 触发条件苛刻 (oneTime + mandate gate), D-145 gen_referral 普通玩游戏可遇但 desc 改字看一眼即 verify, **不实机测 push**, 后续玩游戏自然遇到时 latent verify
  - **诚实教训**: 之前对"smoke vs main byte-identical = 守底"过度自信, 实际 byte-identical 仅排除回归不证 fix 生效。latch 类 fix (_eliminated guard) smoke 不触发情况下 byte-identical 是空 verification, code review + pattern 一致性是主要 verify 手段
  - **D-137 MEDIUM 设计决策升级**: _popEventQueue 0 caller 死代码, 修法时机 3 选 (A 弹窗即 pop / B 下旬开头 pop / C popup chain), 原代码 line 471-472 注释 '不立即弹出，让玩家喘口气，下旬处理' 暗示 B/C, 但 fix 方向是设计决策超出 '自动化往前推' scope, **escalate user approve, 留下次 batch 实装**
  - **事件链 sprint scope 余下**: D-130/D-138/D-144 defer 架构债 / D-135/D-136/D-139/D-140/D-141 verified-with-notes / D-142 verified — 加 D-137 待 approve 决策

- **批 5 价值观链 streamline 1 LOW** (commit 2a24c79 已 push origin/main):
  - D-129 LOW processFacEthos 灭国势力跳过守卫 (ethos.js:107 加 || G.factions[fid]?._eliminated, 跟 tick.js:184 _eliminated guard 同模式)
  - codex trial 1 LGTM (零 finding 零 concern, 'matching existing elimination semantics ... without breaking active faction processing')
  - 不实机测 (单点机制守卫, 跟 batch-14 D-051 / batch-23 D-065 / 批 3 D-090 同模式)
  - **价值观链 sprint scope 全收尾 ✅**: 1 HIGH (D-121 batch-25 close) + 1 MED 跨链 (D-122 留外交链 sprint) + 1 LOW (D-129 本批 close) + 余 D-123 defer / D-124/126/127 verified-with-notes / D-125/128 no-fix

- **批 3+4 政治链 streamline 2 LOW** (commits 9a0e0d2 + 2557b62 已 push origin/main):
  - D-090 LOW setStrategist 同人重复任命守卫 (general.js:1745, 加 prev===genName guard 避免 -2/+5 net +3 忠诚 exploit)
  - D-088 LOW 朝议 selectCount UX 修正 (diplo_modals.js L43/L67 玩家路径 + politics.js _aiCourtSelect AI 路径对称化):
    - N=2 提案改 selectCount=1 (玩家选 1 of 2 + AI top-1, 不再强求 2/2 无意义点选)
    - N=3+ 不变 (玩家选 2 + AI top-2)
    - N=1 autoPass 不变
    - codex trial 1 P2 catch _aiCourtSelect 漏改 → trial 2 LGTM (玩家/AI 对称化)
  - 实机测: D-088 用 F12 console showCourtCouncil 注入 mock 提案 (开局所有势力满官 N=4, N=2 路径自然不触发, console 是唯一可行测法), Test A/B/C 全 PASS
  - D-090 不实机测 (玩家 UI 按钮 toggle 自然防, smoke vs main byte-identical 守底, 跟 batch-14 D-051 / batch-23 D-065 同模式)
  - **D-087 stale 教训重演**: walkthrough 标 D-087 MEDIUM fix, scout 时按字面看, 但 batch-14 commit message 显式标 "同源 D-051 close D-087", D-087 已收尾。mini scout 阶段查 git log 找 D-051 发现 batch-14 b289739 close D-087, 避免重复 commit (跟 D-045 stale 同模式)
  - **政治链 sprint scope 全收尾 ✅** (3 HIGH + D-087 MED + D-088/D-090 LOW 全 close, 余 D-079/D-081/D-082/D-086 no-fix + D-078/D-080/D-085/D-089 defer 架构债 + D-083 verified-with-notes)

**B sprint 启动期 progress (经济 + 武将 sprint scope 基本扫完, 历史)**:
- **批 1 D-006 MED 经济链** (commit f0e1218, sprint/B-D006-recruit-helper):
  - calcRecruitCost helper 抽到 military.js MIL1.c, 含 6 修正 (豪族/兵营/仪兵/科技/特色兵种/官职 _postBuffs)
  - 10 处 call site 全统一 (recruit_modals.js 6 处 玩家征兵+整备+扩编+增编 + military.js 4 处 AI 主征兵+加分队+扩编+Claude AI _execRecruit)
  - mode 8 多入口一致性 fix, 跟 batch-23 _calcPoachRate / batch-24 calcLoyaltyDelta 同模式
  - 行为变化: AI 任命 大将军/前将军 _postBuffs.recruitCost (-8%/-6%) 此前漏应用本 fix 激活, 玩家整备/扩编/增编 4 modal 也补 _postBuffs (内部不一致清理)
  - smoke vs main: 50+ cascading (3 AI 势力 res.gold 偏高 + 武将 loyalty 下游传播 + 13 eventCooldown pre-existing batch-18 staleness)
  - codex trial 1 LGTM (零 finding 3 非阻塞 concern)
  - 经济链 sprint scope 全收尾 (14 D 类只 D-006 是 fix verdict, 其他 dismissed/defer/verified 不动)
- **批 2 streamline 7 D 类 (commits 871de09 → eb66c02, sprint/B-D070-statexp-while → sprint/B-D072-orig-fields)**:
  - D-070 LOW addStatExp if→while + cap 守卫 (general.js, 1 函数 5 行)
  - D-046 LOW EVENT_LABELS.execute '处决武将'→'武将身死' (general.js, 1 行 label, killGen 4 路径中性叙事)
  - D-066 MED _aiDoPoach genJoinSource 'capture'→'poach' 对齐玩家 poachGen (general.js:1164, 区别 surrenderGen 真投降 'capture')
  - D-067 LOW 下野 wildPool push cap 5 硬编码 → WILD_POOL_SIZE const (general.js:1482)
  - D-054 LOW 下野时池满 shift() 顶替最旧, 消除 5 旬窗口期 (general.js:1482-1486, walkthrough 主张方案 a)
  - D-057+058+059.1 MED+部分 3 路径补 genFactionMod/Log cleanup 二件套 (下野/killGen/surrenderGen)
  - D-072 MED 4 路径补 genOrigFac/genOrigRole latch (野招/AI挖角/玩家挖角/推荐, general.js + events.js)
  - codex trial 1 NEEDS-WORK catch D-045 dup → drop D-045 commit → 余 7 batch LGTM
- **D-045 stale 教训** (codex catch):
  - d-list 标 D-045 待修, 但 batch-19 (commit f6f3b9e, 2026-05-07) 同步 close (gentry.js:637 已有 triggerFactionEvent('conquer', siegingFac) 注释 'D-045/D-131 fix')
  - CC 按 d-list 字面 scout 漏看 batch-19 close 事实 → 加 line 626 dup 触发, 鹰派双计 +6
  - codex catch P1 → CC drop commit + 删误命名分支
  - **新原则候选**: sprint batch 启动 mini scout 时, d-list verdict 须跟 memory `project_refactor_status.md` 交叉核 batch 已 close 列表 (尤其 batch-19/20 architectural / 跨链 close), 不能字面照 scout

**武将链 sprint scope 状态** (除 1 design 待 user, 其他全收尾 ✅):
- 已修 LOW: D-046 / D-054 / D-067 / D-070 ✅
- 已修 MED: D-066 / D-072 ✅
- 已修 partial: D-058 / D-059 ✅
- 已修 fix verdict: D-057 ✅
- D-045: batch-19 已 close ✅ (stale d-list 教训)
- D-068 MED wildPool 3 cap 不一致: **设计问题** (5/8/无限统一?待 user approve)
- 不修: D-047 / D-050 / D-060 / D-062 / D-069 / D-073

**HIGH 进度** (修 27 / 总 27 ✅ 全收尾):
- 政治链 3 HIGH: **全收尾 ✅** (D-076 / D-077 / D-084)
- 外交链 5 HIGH: **全收尾 ✅** (D-091/D-104/D-113/D-117c/D-120)
- 武将链 10 HIGH: **全收尾 ✅** (+batch-24 D-052 calcLoyaltyDelta 4 项缺漏统一)
- 军事链 6 HIGH: **全收尾 ✅** (D-016/D-020/D-021/D-026/D-031/D-035, batch-22 D-020 deletion 收尾)
- 价值观链 1 HIGH: **全收尾 ✅** (batch-25 D-121 Claude AI ethos 三层暴露)
- 事件链 2 HIGH: **全收尾 ✅** (batch-19 D-131 + batch-20 D-133 删除)

**batch-19 架构 robust 选项 D 重大落地 (2026-05-07)**:
- 19.1 verbatim 抽 _execDeclareWar + _execProposeAlliance 从 v181 到 src/chains/diplomacy.js (前置抽离消除 v181 可读不可写约束)
- 19.2 11 caller 补 triggerFactionEvent (warDeclare 5 / truce 3 双向 / betray 1 / conquer 1)
- 19.3 tests/checkers/faction_event_invariant.js — audit §20451 自动化 checker 落地, curated whitelist + bidirectional 支持
- 同步 close D-049 + D-131 + D-045 (跨链)
- codex review LGTM (7 关注点 verify, 提 3 非阻塞增强建议留 followup)

**batch-20 closes via deletion 模式 (2026-05-07, 跟 D-099 cancel_supply 同模式)**:
- D-053 删 applyLoyaltyEvent city_lost/siege_broken 分支 (设计意图: 丢城忠诚通过 processLoyalty 势力衰退维度间接体现)
- D-133 删 gen_referral ② 考察再议 + hubs.js B4_delayed 处理 (B4_delayed 从 v130 起完全失效, 死代码多年)
- 玩家弹窗简化: gen_referral 3 项 → 2 项 (① 立即接纳 / ② 婉拒, 原 ② 考察再议删除原 ③ 婉拒 renumber 为 ②)
- codex trial 1 NEEDS-WORK (③→② renumber UX bug) → trial 2 LGTM (renumber fixed + dead-code token in comments DEFER 接受)
- B4_delayed 实装值得做但放 sprint 之后的 small feature 阶段, 不在 sprint 加 feature

**batch-21 freeze+3 旬路线 (2026-05-07, 设计反转 case)**:
- claude.ai 原方向 = 12 旬 (弱合法性宣称档对齐) → 制作人 insight: 大乱前 morale<20 + 触发已 9 项 reboot 代价, 应 freeze 不叠惩罚 → claude.ai approve freeze + 3 旬
- 10 处改动 (4 文件): rebel 期间 freeze 8 字段 (民心/人口/产出/建筑/豪族/调粮/疫病) + 攻陷 oldFac==='rebel' 特例 occupied=3 + 科技 occupiedMult 仍生效
- exploit 实测不存在: _warStr fallback 'none' = 27 旬已堵, audit pass 1 漏看 → batch-21 改"暂停状态"哲学 + 3 旬轻消化
- codex 4 trials catch latent bugs: trial 1 (1 误报+1 真 plague) / trial 2 (occupied decay + checkResupply guard) / trial 3 (processTransfers 老存档 fallback) / trial 4 LGTM
- **lifecycle simulate 模式首次落地**: tests/batch21_simulate.js 跑 80 旬 (force 大乱 → 9 字段 freeze verify → 真实 AI 攻陷 occupied=3 verify → 44 城无 regression). 比 smoke layer-2 更彻底, 复杂 lifecycle batch 模板, 后续 batch-22-25 可复用
- **设计反转 protocol case**: 制作人 insight 优先级 > claude.ai 决策, scope 可能戏剧扩大 (1 行数值 → 10 处 mini-mechanism)

**batch-22 closes via deletion 模式 (2026-05-07, 跟 batch-20 同模式)**:
- D-020 HIGH _execBillet 功能错位 (玩家路径真 billet, Claude AI 路径 30% 裁军+garrison 语义错位). 修方向 (a) "修成真 billet" 是 sprint 之外功能改造 → 走 deletion (Claude AI 不再尝试)
- D-099 LOW cancel_supply 部分 _execCancelSupply dead 占位 (console.warn+return false). batch-2 已删 prompt, 本 batch 删 dispatcher → checker 1 case_no_prompt HIGH 1→0
- 7 处 deletion (净 -34 行死/错代码): v181.html 2 函数 + claude_ai.js 5 处 (prompt+ORDER×2+dispatch×2)
- codex trial 1 LGTM (无残留 except docs/history)
- smoke fix vs main byte-identical (除时间戳)
- **新发现 audit pass 2 candidate**: day-1 武将部曲 type vs 初始 squad type 不一致 (关羽 squad='light' vs 部曲 constants='heavy'). 留 sprint_followup §3.2.1, audit pass 2 时对所有 day-1 有部曲武将做 check
- **军事链 6 HIGH 全收尾** ✅ (D-016/D-020/D-021/D-026/D-031/D-035 全 close)

**batch-23 trial helper 模式 (2026-05-07, helper 抽离首次落地)**:
- D-065 HIGH 武将链: 玩家 poachGen vs AI _aiDoPoach 公式 5 项 buff 严重不对称 (玩家 3 buff 独有: _techPoach/陈群/黄权-0.20; AI 2 buff 独有: 投机+0.20/cunning+0.05)
- 抽 _calcPoachRate(genName, byFid) 共享 helper, 含全 5 项 buff. 3 路径覆盖: 玩家 poachGen / 传统 AI _aiDoPoach 直接调; Claude AI _execPoach 自动透传 (内部调 _aiDoPoach)
- 制作人决策 clamp 选 (c) 统一 [0.20, 0.85] (投机/cunning 突破 85% 的特权取消, 简洁规则不区分 buff 来源)
- buff 双向对称化效果: 黄权 -0.20 / 陈群 +0.05 / _techPoach AI 也享受; 投机 +0.20 / cunning +0.05 玩家也享受
- 改动 1 文件 +33/-28: general.js 加 helper + 2 路径改用 helper. codex trial 1 LGTM. smoke byte-identical (50 旬 AI 未触发挖角, 公式变化未影响 baseline)
- 实机测 PASS (console 4 项 verify: 基础 0.85 / 黄权 0.59 / 吕布 clamp 顶满 / 全部 ≤ 0.85)
- **trial helper 模式确立**: 单文件 / (target, by) 双参数 / 返回值. batch-24 D-052 _calcLoyaltyDelta 可复用此模式
- 观察 (audit pass 2 candidate, 未记 followup): 普通武将基础 rate 已接近 85% 上限 (基础 0.45 + ruler cha + loyalty fallback + region/clan/gentry 凑齐) → 挖角整体偏易, 设计平衡问题留 sprint MEDIUM 阶段

**batch-24 trial helper 模式复用 (2026-05-07, 武将链最后 1 HIGH close)**:
- D-052 HIGH 武将链: UI calcLoyaltyDelta vs 主 tick processLoyalty 公式 v93 "完全一致"承诺被打破, 双向 4 项缺漏:
  - UI 有/主 tick 缺: ⑥b proud 无官 -0.15 + ⑨ 价值观 ethDelta (politics/combat 6 case)
  - UI 缺/主 tick 有: _techLoyalty (loyaltyRecovery 科技) + _liufengDrain (刘封刚愎 -0.10)
- 影响: ① ② → 玩家以为 buff 生效实际主 tick 没用 (UI 误导); ③ ④ → 玩家看 tooltip 看不到但忠诚实际在变化 (UI 骗了玩家)
- 修法: A) calcLoyaltyDelta 加 _techLoyalty + _liufengDrain (UI 缺补); B) processLoyalty 改用 calcLoyaltyDelta (删 80 行 inline 公式, 主 tick 自动获得 proud 无官 + ethDelta)
- calcLoyaltyDelta 名字保留向后兼容 (v181.html 5 处 + tooltips.js:578), 11 项 → 13 项
- 改动 1 文件 +15/-89 net -74. codex trial 1 LGTM
- smoke 4847 cascading (510 pre-existing stale + 4337 batch-24 引入: 1340 loyalty / 283 factionMod / 468 units / 293 cities / 156 factions / 1797 other). 跟 batch-19 ~13K 同量级, 算法回路类 acceptable
- 实机测 PASS: 6 武将 console verify + 4 真实投机武将 (孟达/张绣/糜芳/张松, 投机-0.30 + 投机且无官-0.20 全正确) + UI tooltip breakdown 弹窗 verify
- 发现 phantom case: 吕布不在游戏数据 (GEN_META/WILD_GEN_META 都没他, 198 年已死游戏没建模) → meta={} → 投机 buff 不触发. 数据补完候选 (audit pass 2 / data-completion 2)
- **trial helper 模式 2 次复用确立**: 单文件 / (target, by) 双参数 / 返回 {items, total} 或 rate. batch-25 D-121 不走此模式 (信息暴露面)
- **武将链 10 HIGH 全收尾 ✅** (D-048/D-049/D-051/D-052/D-053/D-055/D-061/D-063/D-064/D-065 全 close)

**phase 4 sub-session 4.6 单 codex review (2026-05-08, 中风险首发)**:
- 4.6 diplo_modals: 朝议 (3 funcs) + 求和 + 屠城安民 + 附庸 modal 抽到 src/render/diplo_modals.js
- v181: 11927 → 11732 (-195)
- codex review LGTM (零 finding, "straightforward relocation... no load-order issues")
- streamline 模式切换: 4.1-4.5 集中 review → 4.6+ 单 sub-session review (中风险尾段)

**phase 4 sub-session 4.7 单 codex review (2026-05-08, 中风险)**:
- 4.7 recruit_modals: 征兵 + 整备 + 扩编 + 增编分队 4 modal cluster 抽到 src/render/recruit_modals.js
- 4 lets (_rm/_rdp/_ex/_as) + 37 funcs 一起搬
- v181: 11732 → 10507 (-1225, 单 sub-session 减肥最大头, 仅次于 4.5 boot_screens 1461)
- codex review LGTM (零 finding)

**桶 2 残余抽离 (2026-05-09, phase 4 收官后清理)**:
- 7 symbol 抽到 src/chains/general.js GEN17 section: 1 let GEN_MAP + 6 funcs (getSquadClass / getUnitClassBuffs / getClassDuelWeight / genClassTagsHtml / genClassSelectorHtml / genClassBuffsHtml)
- 2 非连续 block: v181 L904-L906 (3 行) + L915-L989 (75 行), 中间 L907-L914 已抽离 markers 留 v181 不动
- 归属决策 (制作人 2026-05-09 approve): 全 7 symbol → general.js 单 destination
  - GEN_MAP 是 let (initGame 重建), 不适合 data 层 "纯 const" 约定
  - 6 funcs 是 squad/class 武将机制 + HTML helper 混合, chain 层一并装最简
- v181: 4499 → 4423 (-76, 累计 -88.8%)
- src/chains/general.js: 2323 → 2428 (+105: 78 verbatim + 27 GEN17 section header)
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- Block A (3 行) + Block B (75 行) **byte-identical** verify (diff main vs general.js GEN17 section)
- codex trial 1 LGTM (零 finding, 36494 tokens, "Verified ... GEN_MAP as let, followed by all six expected helper functions ... load order ... no whitespace errors")
- 不实机测 (verbatim + smoke + byte-identical 三重 verify 充分; 制作人 push)
- **桶 2 彻底清空 ✅** (memory `project_refactor_status` "留底架构债 #3" close, 无残余)

**桶 6 _debug panel 抽离 (2026-05-09, dev cluster 首次抽到 src/dev/)**:
- v181 第二段 `<script>` L3104-L4399 (1296 行 IIFE, 52 内部 funcs) → src/dev/debug.js (1294 行 verbatim)
- v181 `<style id="_dbg_style">` L3032-L3102 (71 行 _dbg-* 选择器) → src/dev/debug.css (69 行 verbatim)
- v181 替换为 3 行 marker + `<link>` + `<script src>` 引用 (原位置不变, body 内 link 浏览器接受)
- IIFE 完全自包含: L3109 `if(!location.hash || !location.hash.includes('debug')) return;` 不带 #debug 即提前 return, 主代码零反向引用
- scout 三件验证 = 0 hits: 主 script L840-L3024 grep `_debug|_dbg` / src/ 全文 grep / tests/ 全文 grep
- 外部接口仅 `window._debug` 命名空间 (toast/safe/setRelation 等)
- v181: 4423 → 3052 (-1371, -31.0%, 累计 -92.3%) ⭐ 突破 -92% 大关
- src/ 新建目录 src/dev/ (memory 桶 6 §六预留位置首次落地)
- byte-identical verify: src/dev/debug.{css,js} 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (4 finding 全 LGTM, 1 non-blocking concern: HANDOVER_v181 + CODE_MAP_v181 历史文档仍提 _debug, followup 非阻塞)
- 实机测 PASS (制作人 2026-05-09): #debug URL 激活 panel + 不带 #debug 零角标
- **桶 6 第二段 _debug script 收尾 ✅** (memory "v181 剩余 6 桶分类" 桶 6 第二段 1296 行已清空, 桶 6 残余仅顶层杂项 + 第一段 _debug-related 已属主 script)

**桶 6 combat tables 抽离 (E sub-session, 2026-05-09, 顶层 const 抽离延续 dc.S1/S3)**:
- 主 inline script L1439-L1513 (75 行武将相性 cluster) → src/data/generals.js range C
  - APT_MULT (适性乘数) + COMPAT (65 武将相性表) + COMPAT_GROWTH_MULT (相性差距 → 亲密度增长) + INTIMACY_PRESET (史实初始亲密度 80+ 关系)
- 主 inline script L1523-L1575 (53 行兵种克制 + 地形修正 cluster) → src/data/constants.js range B
  - TYPE_ATK / TYPE_DEF (兵种攻防乘数, 含 11 特色兵种) + TROOP_BASE_MULT (兼容) + TYPE_MATCH_MULT (5×5 克制矩阵) + TERRAIN_TROOP_MULT (6 地形 × 5 兵种)
- 中间 L1514-L1522 (9 行 dead docstring + GEN13/GEN14 markers) 留 v181 (audit pass 2 candidate, phase 3 抽 funcs 时遗漏的 dead 残余, 不在本 sub-session 范围)
- v181 替换为 2 行 marker (净 -126)
- v181: 3052 → 2926 (-126, -4.1%, 累计 -92.6%)
- src/data/generals.js: 1123 → 1200 (+77), constants.js: 553 → 609 (+56)
- byte-identical verify: Block 1 / Block 2 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (零 finding 零 concern, 6 关注点全 PASS, 跨链消费者 chains/general/military + core/main + render/battle_modals 全 lexical lookup 无动态依赖)
- 不实机测 (跟 bucket-2 GEN_MAP 同模式: verbatim const + smoke + byte-identical 三重 verify 充分, 制作人 push)
- **E sub-session 收尾 ✅** (顶层杂项主菜 const block 已抽, 桶 6 残余仅 module-private state ~75 行 跟 funcs 紧耦合, 留 F/G sub-session 处理)

**render-cache 抽离 (F sub-session, 2026-05-09, phase 4 标准 verbatim 整段抽)**:
- v181 L1080-L1350 (271 行 verbatim) → src/render/render_cache.js (新建)
- 9 funcs: renderAll / renderAllLight (orchestrator) + toggleMapStyle + 6 cache funcs (_buildStaticMapCache / _getStaticMapCache / invalidateFogCache / _getFogSvgCache / invalidateCityCache / _getCitySvgCache)
- 9 lets: _staticMapCache / _mapShowGrid (静态地图) + _fogSvgCache / _fogCacheTurn / _fogCacheVersion (迷雾 v117fix 递增版本号) + _citySvgCache / _cityCacheTurn / _cityCacheSelCity / _cityCacheVersion (城市)
- 中间 L1095 R4.1 overlay marker + L1096-L1101 6 行 dead 空行 verbatim 抽 (phase 4 标准模式不切片)
- v181 替换为 1 行 marker + 加 <script src> 引用 (L840, 在 battle_anim.js 之后)
- v181: 2926 → 2657 (-269, -9.2%, 累计 -93.3%) ⭐ 突破 -93%
- src/render/render_cache.js: 0 → 271 (verbatim from v181 L1080-L1350)
- byte-identical verify: render_cache.js 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (1 LGTM finding 6 关注点 5 PASS + 1 minor concern: R4.1 marker 带走语义略误导但不影响行为)
- 实机测 PASS (制作人 2026-05-09): 4 视觉路径 (toggleMapStyle 网格开关 / 读档回标题清 cache / 选城 _cityCacheSelCity rebuild / 战后 fog invalidate) 全 OK
- F sub-session = 桶 6 主菜后续 phase 5 风格抽离, 主题独立 (SVG cache 层 + render orchestrator) 跟 map_render.js layer 不同所以新建文件
- **F sub-session 收尾 ✅** (renderAll + 3 SVG cache 层全归位 src/render/render_cache.js)

**map-interaction 抽离 (G sub-session, 2026-05-09, phase 4 标准 verbatim 整段抽)**:
- v181 L1469-L1794 (326 行 verbatim) → src/render/map_interaction.js (新建)
- 10 funcs:
  - Fog 可见性: _collectPlayerVisibleKeys / _animateFogReveal
  - 战斗触发: _checkInstantBattleTrigger
  - 移动预览: clearMovePreview
  - Unit 鼠标事件: onUnitLeftClick / onUnitRightClick / onMapRightClick
  - Map 事件: svgEventCoords / handleMapClick
  - City 选择: handleCityClick
- 中间 L1547 R4.3.d stack picker marker verbatim 抽 (phase 4 标准模式不切片)
- v181 替换为 1 行 marker + 加 <script src> 引用 (L841, 在 render_cache.js 之后)
- v181: 2657 → 2333 (-324, -12.2%, 累计 -94.1%) ⭐ 突破 -94%
- src/render/map_interaction.js: 0 → 326 (verbatim from v181 L1469-L1794)
- byte-identical verify: map_interaction.js 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (1 LGTM finding + 1 concern smoke 玩家交互盲区, 关注点 6 关注点 4 PASS, 跨链消费者 verified: CITY_MAP/fog/_pendingBattleConfirms/renderAll/updateTabs)
- 实机测 PASS (制作人 2026-05-09): 6 路径 全 OK (左键 unit 选中 / 右键 unit 阻止浏览器菜单 / 移动预览 / 右键空 hex 取消选中 / 左键城市 / 派兵攻城)
  - 注意: onUnitRightClick 实际无功能, 仅 preventDefault(); "取消选中"是 onMapRightClick 做的 (右键空地图)
- 新建文件, 主题独立 (map/unit 交互 controller 层), 跟 map_render.js (view 实现) 同主题但 layer 不同
- **G sub-session 收尾 ✅** (玩家鼠标交互 controller 全归位 src/render/map_interaction.js)

**map-zoom 抽离 (J sub-session, 2026-05-09, 双 block 加进 map_interaction.js)**:
- v181 L931-L935 (5 行 module-private state) → map_interaction.js range C: _mapScale/_mapTx/_mapTy/_MAP_SCALE_MIN/_MAP_SCALE_MAX/_mapDrag
- v181 L1595-L1710 (116 行 funcs cluster) → map_interaction.js range D:
  - 5 funcs: _clampMapTransform / resetMapView / _applyMapTransformOnly / _debouncedMapRender / zoomMap
  - DOMContentLoaded handler (滚轮缩放 + 左键拖拽 + 中键阻止默认 + 嵌套 _onDocMouseMove/_onDocMouseUp + window._mapDocMouseMove/Up 暴露给 backToTitle 清理)
  - 1 let _suppressNextClick (拖拽后抑制 click)
  - 1 let _zoomRenderTimer (debounce 渲染)
  - _onDocKeydown function (Esc/+/-/0 键盘事件)
  - document.addEventListener('keydown', _onDocKeydown) listener install
- v181 L932 (原 L936) `let _unitMenu = null;` 留 v181 — codex catch: **不是 dead code**, src/render/notifications.js:321 closeUnitMenu() 仍在消费. 留 v181 是正确做法 (我之前 commit message 误标 "audit pass 2 candidate" 为误判, 此处纠正)
- v181 替换为 2 行 marker (净 -119)
- v181: 2333 → 2214 (-119, -5.1%, 累计 -94.4%)
- src/render/map_interaction.js: 326 → 451 (+125: 121 verbatim + 4 header/blank)
- byte-identical verify: Block A / Block B 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (1 LGTM finding + 2 concern: _unitMenu 不是 dead code 纠正 / smoke 玩家交互盲区)
- 实机测 PASS (制作人 2026-05-09): 滚轮缩放 / 左键拖拽 / 中键 / 键盘 +/-/0 / backToTitle cleanup 全 OK
  - 制作人观察 Esc 取消选中似乎不触发 — 但他没用过这功能, smoke vs main PASS 证明跟 v181 行为一致, 即使原本不工作也是 pre-existing 不是本次抽离造成
- **J sub-session 收尾 ✅** (地图缩放/平移完整 cluster 含 lets+funcs+listeners 加进 map_interaction.js)
- **重要 lesson**: dead code 判定必须全 src/ grep 不能只搜 v181 (codex catch _unitMenu 在 notifications.js consumer)

**H utilities 抽离 (H sub-session, 2026-05-09, 加进 notifications.js)**:
- v181 L1092-L1128 (37 行 verbatim) → src/render/notifications.js append
- 3 funcs:
  - log(msg, type) — 写 G.logs + 渲染 #elog DOM 消息日志
  - updateFacStats() — 更新右侧势力统计面板
  - handleKeyDown(e) — 全局键盘 dispatcher (实际只处理 Enter/Space/Escape 关闭 modal, 不是 F2)
- v181 替换为 1 行 marker (净 -36)
- v181: 2214 → 2178 (-36, -1.6%, 累计 -94.5%)
- src/render/notifications.js: 399 → 438 (+39: 37 verbatim + 2 header/blank)
- byte-identical verify: 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (零 finding 零 concern, 跨链消费者全 verified, body onkeydown attribute 仍能 lookup handleKeyDown)
- 实机测 PASS (制作人 2026-05-09)
- 加进 notifications.js (主题 = 全局 UI helpers, log 主题完全契合)
- **H sub-session 收尾 ✅** (全局 UI utilities 全归位 src/render/notifications.js)

**streamline batch I+K 抽离 (2026-05-09, streamline 模式 4 次复用)**:
- I billet (commit 080f057): v181 L1443-L1521 (79 行 verbatim) → src/chains/military.js MIL10
  - billetUnit(uid) — 玩家驻扎入口, 弹城市选择 modal
  - _confirmBillet(uid, cityId) — 确认驻扎, 拆双条目 (部曲/辅兵 type), 武将归队
  - MIL10 section header (跟 MIL8.x 玩家入口 owner = military chain)
  - v181: 2178 → 2100 (-78)
- K audit (commit 18e9fbc): v181 L1843-L2145 (303 行 verbatim, I 抽前行号; I 抽后变 L1765-L2067) → src/dev/audit.js (新建)
  - runIntegrityAudit() — 压力测试后批量断言 (8 类: 资源/兵力/忠诚同步/城市fac/死将残留/部队结构/结构完整性/价值观)
  - checkElimination() — 势力淘汰 + 胜利/失败判定 (★ v119)
  - 加 <script src="src/dev/audit.js"> 引用 (L842, 在 map_interaction.js 之后)
  - src/dev/ 第二个文件 (跟 debug.js 同 dev cluster)
  - v181: 2100 → 1799 (-301)
- v181 累计 streamline batch: 2178 → 1799 (-379, -17.4%, 累计 -95.5%) ⭐ 突破 -95.5%
- byte-identical verify: I + K 内容 vs v181 原段 diff = 0
- smoke vs main: PASS — 51 snapshots identical (Option B.2, 含 I+K 两个 commit)
- codex 集中 review trial 1 LGTM (零 finding 7 关注点全 PASS, 跨链消费者全 verified: checkElimination ← tick.js / runIntegrityAudit ← tabs.js / billetUnit ← map_render.js / _confirmBillet ← billet modal inline onclick)
- 实机测 PASS (制作人 2026-05-09): 玩家 billet (选部队+进城+driving modal) + 多旬游戏 (checkElimination + runIntegrityAudit) 全 OK
- 1 minor 设计建议 (非阻塞): checkElimination 偏游戏机制更适合归 src/core/tick.js, 但归 src/dev/audit.js (跟 v119 audit/check block 邻接) 不阻塞 — future organization decision 留 audit pass 2
- streamline batch 第 4 次复用 (前 3 次: phase 4 4.1-4.5 / sprint batch-7-10 / batch-11-14 / batch-15-17 / _exec sprint batch-26-30)
- M 顶层散件 (SPOIL_RATES / WILD_POOL_* / _fastForward 等) 跳过本 batch, 留下次处理 (跨 chain 复杂)
- **I+K 收尾 ✅** (玩家 billet 入口 + audit/check 全归位)

**M-misc 顶层 const 抽离 (M sub-session, 2026-05-09, 双 block 加进 constants.js)**:
- v181 L964-L965 (Block A, 2 行) + L970-L975 (Block B, 6 行) → constants.js range D
- 4 const:
  - SPOIL_RATES (腐损率, 经济链 + renderLeft 共用)
  - WILD_POOL_SIZE / WILD_POOL_INTERVAL (在野武将池规模 + 5 旬刷新)
  - AI_RECRUIT_INTERVAL (AI 3 旬尝试招募)
- 中间 L966-L969 (经济链 E4 + R4.3.b markers + 空行) 留 v181
- v181 替换为 2 行 marker (净 -6)
- v181: 1799 → 1793 (-6, 累计 -95.5%)
- src/data/constants.js: 609 → 620 (+11)
- byte-identical + smoke vs main: PASS — 51 snapshots identical
- codex trial 1 LGTM (零 finding 5 关注点全 PASS, 跨链消费者全 verified: economy.js / tick.js / general.js / ui_panels.js)
- 不实机测 (verbatim const, 同 bucket-2 / bucket-6 combat / dc.S3 模式)
- 跳过: _fastForward/_ffTurns (跨 chain 复杂) / _unitMenu (notifications.js consumer) / SAVE_*/_store (跟 _serializeG 必留)
- **M sub-session 收尾 ✅** (顶层杂项 const 抽离 batch 主菜)

**phase 4 sub-session 4.10 单 codex review (2026-05-09, 最高风险, phase 4 收官)**:
- 4.10 battle_anim: 战斗动画 cluster 抽到 src/render/battle_anim.js (新建)
- 1 段连续 block: v181 L1665-L4233 (2569 行), 1 let + 1 const + 11 顶层 funcs + 1 _baCore IIFE (含 14 内部 helper) = 25 funcs + 1 IIFE 入口
- 1 let: _battleAnimating (anim 专属 lock)
- 1 const: DUEL_EPITHET (16 名将称号表)
- 11 顶层: _drainPendingBattleAnimations / _getDuelEpithet / _playDuelPreludeAnim / _baGetUnitRenderPos / _playBattleCollisionAnim / _baDrawCampPalisade / _playCampBattleAnim / _playAmbushBattleAnim / _playSiegeBattleAnim / _playNavalBattleAnim / _siegeArrivalChoice
- 1 IIFE _baCore (14 内部 helper): SVG_NS / EASE / runTween / startTween / shouldSkip / ensureAnimLayer / spawnClashRing / spawnSlashes / spawnSparks / spawnClashMark / shakeMapSvg / spawnLossText / floatLossText / makePhantom / makeShipPhantom / spawnResultText / animateResultText / cleanupAnimLayers
- scope 决策 (制作人 2026-05-09 approve):
  1. _battleAnimating let 跟 anim cluster 一起抽 (反 MIL7.a 时期 "留 v181" 决策, anim 抽离后 lock semantically 应跟 anim 走)
  2. _execInstantMarch (v181 L4252) 留 v181 (plan §11 边界, 玩家行军核心 + 下游 _collectPlayerVisibleKeys/_animateFogReveal/_checkInstantBattleTrigger 同质 map 交互 cluster 一并留)
- v181: 7066 → 4499 (-2567, -36.3%, 累计 -88.6%) ⭐ 突破 -88% 大关
- src/render/battle_anim.js: 0 → 2638 行
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- **smoke 必要不充分**: _fastForward=true 路径跳过 anim, 必须靠完整战斗实机测 verify
- codex trial 1 LGTM (零 finding, 46585 tokens, "Verified diff shape ... script order ... boundaries: _execInstantMarch remains in v181 ... No blocking extraction, boundary, or load-order issues")
- 实机测 PASS (制作人 2026-05-09): 野战 / 伏击 / 单挑 / 攻城 (玩家攻 AI) / 围城到达 / 战报 / 俘虏处置 全 OK
- 实机测发现 1 个 pre-existing v181 bug (非 4.10 regression, code-level diff verify byte-identical):
  - **AI 攻玩家城无攻城动画** — 直接弹战报. 怀疑路径: tick.js:626 fire-and-forget 不 await + battle_anim.js:165 shouldSkip _battleAnimating 检查 / fog 检查. 已记 sprint_followup §5.1, 留战斗机制 systematic bug fix sprint
- **phase 4 全收官 ✅** (10/10 sub-session 完成)
- **重构主体收官 ✅** (39 src/ 文件 / v181 -88.6% / phase 1+2+3+dc + HIGH/_exec sprint + phase 4 全部完成)

**phase 4 sub-session 4.9 单 codex review (2026-05-09, 高风险首发)**:
- 4.9 battle_modals: 战斗 confirm + dispose modal cluster 抽到 src/render/battle_modals.js (新建)
- 1 段连续 block: v181 L4237-L6173 (1937 行), 17 顶层函数 + 3 内部 helper = 20 funcs
- 17 顶层: _battleSideHtml (modal HTML helper, plan 漏列 11 caller 全在 4.9 一并抽) + 16 plan funcs (4 confirm/abort 系列: ambush/camp/siege battle/siege defend + selectDuelChallenger + confirmBattle + showNextBattleReport + closeBattleModal + showNextPrisonerModal + playerDisposePrisoner)
- 3 内部 helper (showNextBattleReport scope): duelBlockHtml / genEventRows / appendDuelKillRow
- scope 决策: _battleSideHtml plan 漏列但 caller 全在 4.9 一并抽 (跟 4.8 selCity/selFac 同模式邻接 helper 决策)
- 边界: _siegeArrivalChoice (上, L4232) + _execInstantMarch (下, L6187) 留 4.10 处理
- _pendingBattleConfirms / _currentBattleConfirm / _duelChallenger 3 lets 已在 military.js MIL7.a/b 抽离, 本 session verbatim 直读 global scope
- v181: 9001 → 7066 (-1935, -21.5%, 累计 -82.1%) ⭐ 突破 -82% 大关
- src/render/battle_modals.js: 0 → 1987 行
- smoke vs main: PASS — 51 snapshots identical (Option B.2)
- codex trial 1 LGTM (零 finding, 44745 tokens, "Verified changed surface is only ... contains expected 17 + 3")
- 实机测 PASS (制作人 2026-05-09): 7/8 场景 (野战 confirm / 攻城 / 守城 / 伏击 / 单挑 / 战报 / 俘虏处置 全 OK), ② 营寨战 因 AI 不扎营跳过 (v181 历史 AI 行为局限, 不是 4.9 抽离 issue)

**制作人 insight (2026-05-09): 战斗机制 systematic bug fix sprint 候选**:
- 4.9 实机测后用户留 "整个战斗机制是重要环节, 估计还有很多 bug 和需要细化, 重构角度看 OK, bug 后面系统性修"
- 含义: 4.9 重构 verbatim 抽离 ≠ 战斗机制设计正确性. 后续 bug fix sprint 应把战斗机制作为重要环节
- AI 不扎营 (4.9 ② 营寨场景跳过) = 已知 AI 行为缺失候选
- 详细见 project_combat_mechanism_bugfix.md

**phase 4 sub-session 4.8 单 codex review (2026-05-09, 中-高风险)**:
- 4.8 tabs: 8 tab 渲染 + renderRight 容器 + tab 系统 UTILS 抽到 src/render/tabs.js (新建)
- 3 不连续 block: R4.8.a (L1432-L2862, 主 block 8 tabs + renderRight + 6 内部 helper) + R4.8.b (L2864-L2872, UTILS 4 funcs) + R4.8.c (L8326-L8395, renderMilTab 孤悬位置)
- 19 函数总数 (8 主渲染 + 6 helper + 4 utils + 1 milTab):
  - 主渲染: renderTechTab/renderStatsTab/renderPostTab/renderRight/renderFactionTab/renderDipTab/renderSchemeTab/renderEthosTab + renderMilTab
  - 6 helper: openTechResearchPicker + confirmTechResearch (Tech tab 选研究 modal) + getCourtStatusText + _buildCourtNarrative + _buildCourtWarnings + _buildCourtVacancies (Post tab 朝堂文本)
  - 4 utils: selCity/selFac/switchTab/updateTabs (tab 系统切换入口)
- scope 决策: 单 session 抽 (plan 备选 4.8.a/b/c 不必要). plan v0.3 估 ~3200 行高估 2 倍, scout 实测 ~1500 行
- 邻接决策: selCity/selFac 跟 switchTab/updateTabs 同 UTILS section 模式同质, 一并抽避免 section 裂开
- v181: 10507 → 9001 (-1506, -14.3%)
- src/render/tabs.js: 0 → 1567
- **codex trial 1 NEEDS-WORK P2 metadata** (函数清单 13→19, scout grep 漏列 6 内部 helper). 用 `^\s*function\s+(name1|name2|...)` 只 grep 已知名字, 没用 `^function\s+\w+` 通配, 漏看夹在 tab 间的 helper. → amend metadata fix (tabs.js header + v181 marker + commit message) → trial 2 LGTM
- 实机测 PASS (制作人 2026-05-09, F12 console 零 error, 9 tabs 切换 + Tech 选研究 modal + city/fac 选择 全 OK)
- **新教训**: scout grep pattern 应该用通配符 (`^function\s+\w+`) 而不是已知函数名列表, 避免漏看夹在中间的 helper. 后续 sub-session 启动 scout 时遵循

**phase 4 渲染层第二轮 streamline batch 1 (sub-session 4.1-4.5, 2026-05-08)**:
- phase 4 plan 文档化: docs/phase4_plan.md v0.1 → v0.3 (CC ↔ codex 协作 2 round, P2 smoke baseline + P3 编号 + Option B uncommitted/untracked 安全)
- 决策 1: 接口风格 A — verbatim 直读 G (跟 chain/_exec sprint 一致)
- 决策 2: 拆分 B+C — 按文件类型 + 按抽离难度排序 (低→高)
- 决策 3: plan 文档化 + CC ↔ codex 协作迭代
- sub-session 4.1 overlay (337 行 → src/render/overlay.js)
- sub-session 4.2 map_render (709 行 → src/render/map_render.js, 4 不连续 block)
- sub-session 4.3 notifications-extend (310 行 append → src/render/notifications.js)
  - **trial 1 踩坑**: Block 4 起点 L9163 错误地包含 clearMovePreview 的 closing }, 导致 SyntaxError. trial 2 修正 L9166 PASS. 经验: Node 多块切片必须实测每个 block first/last 是 function 完整起止
- sub-session 4.4 gen_profile (305 行 → src/render/gen_profile.js)
- sub-session 4.5 boot_screens (1461 行 → src/render/boot_screens.js, 含 Claude AI UI cluster 加进来)
- v181 phase 4 累计: 15049 → 11927 (-3122, -20.7%)
- 5 sub-session 集中 codex review 一次过 LGTM (零 finding, "straight extraction... no discrete regression")
- 实机测 PASS (制作人 2026-05-08)
- streamline 模式 trial 2 验证 (跟 _exec sprint trial 1 同性质, render 层 verbatim 抽离同质度高)

**batch-26~30 _exec 归位架构债 sprint 5 batch streamline (2026-05-08, _exec sprint 全收官)**:
- 35 个 dispatcher targets (_execXxx) 从 v181 段 M 按 (a) 原则归位到对应 chain
- batch-26: 武将 2 (RecruitWild/Poach) → general.js GEN16
- batch-27: 武将续 2 (SetPrefect/SetStrategist) + 政治 2 (AppointPost/DismissPost) → general.js GEN16 + politics.js P7
- batch-28: 经济 5 (Build/SetTax/SetCorvee/TransferFood/ToggleResupply) + 科技 1 (Research) → economy.js E9 + politics.js P8
- batch-29: 外交主 7 (BreakAlliance/DiploGift/DiploArmistice/StartClaim/Demand/Submit/ReleaseVassal) + 计谋 5 (DriveWolf/TwoTigers/Spy/Rumor/Scout) → diplomacy.js D7
- batch-30: 军事 8 (Move/Recruit/Disband/SetCamp/SetAmbush/CancelSpecial/CancelSiege/SetReinforcePolicy) → military.js MIL9
- **最终分布**: diplomacy 14 + military 8 + economy 5 + politics 4 + general 4 + claude_ai dispatcher 1 + v181 _execInstantMarch 1 (战斗动画 helper, 不在 dispatcher)
- **streamline 模式**: 5 batch local commit 留 working branch 不 push, 集中 codex review 一次过 (LGTM 零 finding), 一次性 push (Claude AI 实机测后置 followup)
- **(a) 原则严格分类**: 按 helper 所在 chain 而非命名直觉 (batch-27 _execAppointPost 跟 appointGenPost 归 politics, 不跟"武将相关"命名归 general)
- v181 sprint 起点 → 终点: 15591 → 15049 (-542 行, -3.5%)
- **新原则沉淀**: feedback_exec_sprint_streamline.md (高度同质 sprint 集中 codex review)
- codex review trial 1 LGTM (零 finding, 仅指出"relocate without changing dispatcher or introducing obvious runtime breakage")

**Claude AI 实机测后置 followup**: _exec sprint 是 verbatim relocation + smoke vs main byte-identical + codex LGTM, 但 smoke 不跑 Claude AI 路径. Claude AI 实机测建议 (开 _claudeAI.enabled 跑 10-20 旬 verify 35 dispatch 路径无 ReferenceError) 留 followup, 下次需要 Claude AI 路径相关动作时一并测.

**batch-25 信息暴露面三层补全 (2026-05-08, HIGH sprint 收官 batch)**:
- D-121 HIGH 价值观链 (sprint 唯一剩余 HIGH): Claude AI getGameState 305 行函数体零 ethos + prompt 零 ethos + _execEnthrone 绕过 mandate gate
- 三层修法 (claude.ai 决策方向 + 制作人 token-conscious 调整):
  1. _execEnthrone v181 L13936-13940 verbatim 抽到 src/chains/politics.js (P6, batch-19 模式) + 加 mandate<30 gate 与 aiConsiderEnthrone 对齐
  2. getGameState 战略旬 + _buildDeltaSnapshot 战术旬都加 ethos 紧凑 string ('天命15·天命有归|...') + diplo[].e_dist
  3. _claudeSystemPrompt 加 §四.价值观距离 3 行子节 + enthrone 操作行 mandate 提示
- token 节省: 用紧凑 string 而非对象 (~30 token/旬 vs ~80 token), prompt 走 cache 一次性 ~200 token
- codex trial 1 NEEDS-WORK 2 issue: (a) prompt 误导 propose_alliance 不直接读 _ethosDistance (改为准确措辞: 通过 ethos→rel 漂移间接 + 影响规则 AI 宣战意愿) (b) _buildDeltaSnapshot 战术旬遗漏 ethos (战术旬支持 declare_war/propose_alliance) → trial 2 LGTM
- smoke vs main: byte-identical 除时间戳 (Claude AI 路径不在 smoke 范围, 无回归风险)
- **价值观链 1 HIGH 全收尾 ✅** (D-121 close)
- **sprint 27 HIGH 全收尾 ✅** = HIGH sprint 整体收官

**v179fix P15c 平行 bug 三连收尾**(D-104 + D-113 + D-117c,batch-6 / 5 / 18)。
**Streamline 模式 trial 1+2+3 完成**(batch-7-10 / 11-14 / 15-17),batch-18 / 19 走单独 push (大批 architectural 不混 streamline)。
**batch-17 首次触发算法回路类 smoke FAIL acceptable**(sprint_followup §一 预期场景)。
**batch-18 baseline staleness pre-existing**(eventCooldown 结构,非本 batch 引入)。
**batch-19 cascading smoke ~13K 行 acceptable**(triggerFactionEvent → genFactionMod → 武将忠诚下游传播,sprint_followup §一 算法回路类典型)。

**跳过 / 留 followup 类型**:
- (无, sprint HIGH 全收尾)

## 整体成绩(phase 1+2+3+dc + HIGH sprint + _exec sprint + phase 4 10/10 + 桶 2 + 桶 6 + F+G+J+H+I+K+M 收尾 ✅)
- **v181.html: 39547 → 1793 (-37754, -95.5%)** ⭐ 突破 -95.5% (phase 4 -10550 + 桶 2 -76 + 桶 6 -1497 + F render-cache -269 + G map-interaction -324 + J map-zoom -119 + H utilities -36 + I billet -78 + K audit -301 + M misc -6)
- src/: 0 → **43 js 文件 + 1 css ~41610 行**(data 7 / render 17 / core 7 / chains 8 / dev 2+1css + 2 memory feedback)
- 抽出累计:417 函数 (phase 3) + 65 顶层 const + 5 IIFE + 1 嵌套 IIFE-helper (dc) + ...
- 5 个 baseline 共存 (phase1_post / phase2_complete / phase3_complete / data_completion_complete)
- 4 个 git tags: v181-pre-refactor / phase1-baseline-archive / phase3-complete-archive / data-completion-archive
- 全程 byte-identical 行为零漂移 (snapshots SHA256 = 96ac537219195d5621fe9c96b337cc47338a581b9d5a0cdea38c9714d1abf190)

## refactor/data-completion 数据(2026-05-05/06 完成)
- v181: 17391 → 15656 (-1735, -10.0%)
- src/data/: 6 → 7 文件 (新建 state_county.js)
- 抽出: 1742 行 verbatim / 65 顶层 const + 5 IIFE 派生 + 1 嵌套 IIFE-helper (_CLAN_MAP)
- 5 sub-session: dc.0 scout / dc.S1 generals 扩 / dc.S3 constants 扩 / dc.S2 state_county 新建 / dc.collect 收尾
- 实装 1 bug (S2 行号偏移) + 修复 + 沉淀新原则 #11
- 0 D 类主动 fix (CLAUDE.md 硬规则严守)

## 工作流原则集中索引(2026-05-06)
**`docs/refactor_workflow_principles.md`** — phase 3 + dc + sprint 累积 **9 条原则 + sprint gate 语义节**:
- #5 scout-before-extract (p3.3)
- #6 chain 阶段 chains/*.js 6 项 header 必含 (p3.5, chain 专用)
- #7 awk 边界用 wc -l 验证 (p3.6)
- #8 Node 双脚本 (build + replace 共享 ranges) 代替手打 (p3.7)
- #9 scout 四件验证 + #9 补充 docstring 不跨切 (p3.8 / p3.12)
- #10 ranges 无嵌套 inclusion (p3.11)
- #11 新建文件时 replace 在前 script tag 在后 (dc.S2)
- **#12 D 类 fix 必须显式声明覆盖的入口路径** (sprint 启动期 codex review)
- **#13 状态字段语义变更必须核 5 个生命周期点闭环** (sprint 启动期 codex review)
- **#14 sprint scout 必读 walkthrough** (batch-2 D-091 漏看沉淀)
- **§十一 sprint gate 证据语义** (batch-2 codex review,语义节非编号原则)

phase 4 / sprint 启动 session 必读. 后续新原则触发时追加 #15+.

## 终态(main 已 push, memory update 待 commit + push)
- **main HEAD: `7644cdb refactor(M-misc): 顶层杂项 4 consts (SPOIL_RATES + WILD_POOL_*) 抽到 src/data/constants.js range D` (synced to origin)**
- **重构主体彻底收官 + 桶 2 + 桶 6 + F + G + J + H + I + K + M 收尾** ✅
- M-misc (M sub-session, 2026-05-09 commit):
  - `7644cdb` refactor(M-misc): 4 consts 双 block (SPOIL_RATES + WILD_POOL_SIZE + WILD_POOL_INTERVAL + AI_RECRUIT_INTERVAL, 8 行 verbatim → constants.js range D, -6) [refactor/M-misc-const 已 push]
- streamline batch I+K (2026-05-09 commits):
  - `136c340` docs(memory): I+K 收尾 status update
  - `18e9fbc` refactor(K-audit): 2 funcs (runIntegrityAudit + checkElimination, 303 行 verbatim → src/dev/audit.js 新建, -301, 累计 -95.5%) [refactor/streamline-IK 已 push]
  - `080f057` refactor(I-billet): 2 funcs (billetUnit + _confirmBillet, 79 行 verbatim → military.js MIL10, -78)
- h-utilities (H sub-session, 2026-05-09 commit):
  - `b182b19` docs(memory): H sub-session 收尾 status update
  - `34c1828` refactor(h-utilities): 3 funcs (log + updateFacStats + handleKeyDown, 37 行 verbatim → notifications.js, -36, 累计 -94.5%) [refactor/h-utilities 已 push]
- map-zoom (J sub-session, 2026-05-09 commit):
  - `e1f640b` docs(memory): J sub-session 收尾 status update + _unitMenu 纠正
  - `fa60fac` refactor(map-zoom): 双 block (5 lets/consts + 5 funcs + DOMContentLoaded + _onDocKeydown + listeners, 121 行 verbatim → map_interaction.js range C/D, -119, 累计 -94.4%) [refactor/map-zoom 已 push]
- map-interaction (G sub-session, 2026-05-09 commit):
  - `c7ccff8` docs(memory): G sub-session 收尾 status update
  - `f91dd33` refactor(map-interaction): map/unit 交互 10 funcs (326 行 verbatim → src/render/map_interaction.js, -324, 累计 -94.1%) [refactor/map-interaction 已 push]
- render-cache (F sub-session, 2026-05-09 commit):
  - `0edfaef` docs(memory): F sub-session 收尾 status update
  - `95261b4` refactor(render-cache): renderAll + 3 SVG cache (9 funcs + 9 lets, 271 行 verbatim → src/render/render_cache.js, -269, 累计 -93.3%) [refactor/render-cache 已 push]
- 桶 6 combat tables (E sub-session, 2026-05-09 commit):
  - `43012cc` docs(memory): E sub-session 收尾 status update
  - `8c8fac2` refactor(bucket-6): 战斗 + 相性 9 consts → generals.js range C + constants.js range B (-126, 累计 -92.6%) [refactor/bucket6-combat-tables 已 push]
- 桶 6 _debug 抽离 (2026-05-09 commit):
  - `e5928e0` docs(memory): 桶 6 _debug 收尾 status update
  - `9774c38` refactor(bucket-6): _debug panel (-1371, 累计 -92.3%) [refactor/bucket6-debug 已 push]
- 桶 2 残余 (2026-05-09 commit):
  - `b0406ab` docs(memory): 桶 2 残余收尾 status update
  - `f8c3c18` refactor(bucket-2): GEN_MAP + 6 squad/class funcs (-76, 累计 -88.8%) [refactor/bucket2-squad-class 已 push]
  - `3868e6d` docs: phase 4 sub-session 4.10 收官 + 战斗机制 bug §5.1 §5.2 沉淀
- phase 4 历史 (main 上):
  - `93ae4d1` phase4(4.10): battle_anim (1 let + 1 const + 11 顶层 funcs + _baCore IIFE 14 helper, -2567, -88.6% 累计) [4.10-battle-anim 已 push]
  - `e5a955a` docs(memory): phase 4 sub-session 4.9 完成 + 战斗机制 bug fix sprint 候选 沉淀
  - `758e9bf` phase4(4.9): battle_modals (17 顶层 + 3 内部 helper, -1935) [4.9-battle-modals 已 push]
  - `0bcb2ec` phase4(4.8): tabs.js (8 tabs + renderRight + 6 helper + 4 utils + renderMilTab, -1506) [4.8-tabs 已 push]
  - `66f0fa8` phase4(4.7): recruit_modals (征兵 + 整备 + 扩编 + 增编分队 4 cluster, -1225)
  - `3508405` phase4(4.6): diplo_modals (朝议 + 求和 + 屠城 + 附庸, -195)
  - `04a6c9c` docs(memory): phase 4 batch 1 (4.1-4.5) status update
  - `e020daf` phase4(4.5): boot_screens (启动 / 教程 / 帮助 / 存读档 / 结局 / Claude AI UI, -1461)
  - `aebdf05` phase4(4.4): gen_profile (武将 + 官职弹窗, -305)
  - `78d19c2` phase4(4.3): notifications.js 扩展 (迁民 + 告急卡片 + closeUnitMenu + stack picker, -310)
  - `216c2fc` phase4(4.2): map_render (主地图 + 部队 SVG + 部队详情, -709)
  - `f506c13` phase4(4.1): overlay 子系统 (-337)
  - `757eb17` docs(phase4): plan v0.3 (Option B uncommitted/untracked 安全)
  - `dd32d26` docs(phase4): plan v0.2 (smoke baseline + 编号修正)
  - `05de7a9` docs(phase4): plan v0.1 起草
- sprint 历史 (main 上):
  - `9f7d48d` sprint(batch-30): _exec sprint 收官 — 军事 8 → military.js MIL9
  - `5e2fa8c` sprint(batch-29): _exec — 外交 12 (主 7 + 计谋 5) → diplomacy.js D7
  - `dc2c58b` sprint(batch-28): _exec — 经济 5 + 政治 1 (Research) → economy.js E9 + politics.js P8
  - `b9abb09` sprint(batch-27): _exec — 武将续 2 + 政治 2 → general.js GEN16 + politics.js P7
  - `96b4742` sprint(batch-26): _exec sprint 启动 — 武将 2 → general.js GEN16
  - `bab0be0` docs(memory): batch-25 D-121 sprint 收官 status update + cross-machine sync feedback
  - `d3f7a25` sprint(batch-25): D-121 HIGH Claude AI ethos 三层 (战略+战术 snapshot / _execEnthrone mandate gate, **价值观链 1/1 ✅, HIGH sprint 27/27 ✅ 全收尾**)
  - `c7b2139` sprint(batch-24): D-052 HIGH calcLoyaltyDelta 4 项缺漏 (武将链 10/10 全收尾 ✅, helper 模式 2 次复用)
  - `5d3233d` sprint(batch-23): D-065 HIGH _calcPoachRate helper 抽离 (玩家/AI 5 buff 对称, clamp 统一 [0.20, 0.85])
  - `5dc8fc5` docs(sprint_followup): batch-22 §3.2.1 day-1 部曲 type vs squad type 不一致 audit pass 2 candidate
  - `b4c71fe` sprint(batch-22): D-020+D-099 closes via deletion (净 -34 行死/错代码, 军事链 6/6 全收尾 ✅)
  - `c331d32` test(sprint): batch-21 lifecycle simulate 模板落地 (80 旬 D-026 完整 verify)
  - `9fd73ba` sprint(batch-21): D-026 HIGH 大乱 freeze+3 旬路线 (10 处 freeze + occupied=3 特例 + codex 4 trials)
  - `64f6d89` sprint(batch-20): D-053+D-133 closes via deletion (净 -27 行死代码)
  - `f6f3b9e` sprint(batch-19): D-049+D-131+D-045 architectural robust 3 sub-batch squash (抽 _exec + 11 caller + invariant checker)
  - `6f03407` sprint(batch-18): D-117c HIGH checkDiplo 自动宣战 5 项副作用补全
  - `56304dd` sprint(batch-15-17): 3 HIGH streamline (D-031+D-035+D-048)
  - `80cc4fc` sprint(batch-11-14): 4 HIGH streamline (D-016+D-051+D-055+D-076)
  - `ea55af5` sprint(batch-7-10): 4 HIGH streamline (D-061+D-063+D-064+D-084)
  - `8734e20` sprint(batch-6): D-104 HIGH _pendingVassalOffer P15c 平行
  - `1371287` sprint(batch-5): D-113 HIGH 强制停战漏 _applyPeaceAgreement
  - `110ecfd` sprint(batch-4): D-120 HIGH G._diploActed nextTurn reset
  - `58ebed8` sprint(batch-3): D-091 HIGH 附庸 3 helper 签名错配
  - `26659f9` sprint(batch-2): D-099 prompt 缺指令 + 原则 #14 + sprint gate 语义
  - `ba4821c` sprint(batch-1a): D-021/D-077 cross-chain close
- refactor/data-completion HEAD: `5b61620` (保留)
- refactor/phase-3 HEAD: `afc2b3a` (保留)
- sprint 工作分支保留(部分 push): batch-1a / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 17 / 21 / 22 / 23 / 24 / 25 / 26 / 27 / 28 / 29 / 30 / checker-framework
- phase 4 工作分支保留: phase4/plan / 4.1-overlay / 4.2-map-render / 4.3-notifications-extend / 4.4-gen-profile / 4.5-boot-screens / 4.6-diplo-modals / 4.7-recruit-modals / 4.8-tabs / 4.9-battle-modals / 4.10-battle-anim (全 push)
- tags 全 push: phase1-baseline-archive / phase3-complete-archive / data-completion-archive

## v181 剩余 15656 行 6 桶实测分类(dc 后 grep+wc 实测, 见 docs/data_completion_summary.md §九)
- 桶 1 HTML shell L1-L830: **830** (5.3%) — 必留 v181
- 桶 2 残余 const+squad class L831-L1186: **356** (2.3%) — 数据 sprint 已基本清空, 残余 squad class 75 + GEN_MAP let 5 + markers ~30 + 注释 ~240
- 桶 3 渲染层尾巴 L1187-L11856 散在: **~10670** (68.2%) — phase 4 主目标 (8 right tabs + 战斗动画 + modals)
- 桶 4 _exec 派发 L13381-L14000: **620** (4.0%) — 架构债 sprint 5 batch
- 桶 5 reset+serialize+boot L11857-L13380: **~1524** (9.7%) — 必留 v181
- 桶 6 顶层杂项 + 第二段 _debug script: **~1656** (10.6%) — ~~第二段 1296 行 (_debug 调试块) 可单独抽到 src/dev/~~ ✅ **已抽** (commit 9774c38), 残余仅顶层杂项 ~360 行

注:phase3_summary §10.0 桶 6 ~7378 是 catch-all 估算, 散在 mechanism helpers 实际归桶 3, 总和一致.

## 留底架构债(明确标注, 后续 sprint 处理)
1. ~~**_exec 归位架构债**~~ ✅ **已收官** (sprint batch-26~30 完成, 35 dispatcher targets 全归位)
2. **30 D 类位置文档化** (武将链, phase3_summary §九 + p3.12_notes §五): 武将链 5 batch sprint 建议
3. ~~**squad class 6 函数 + GEN_MAP let region**~~ ✅ **已收官** (2026-05-09 桶 2 残余抽到 general.js GEN17, commit f8c3c18)
4. ~~**桶 6 第二段 _debug script (1296 行) + style (71 行)**~~ ✅ **已收官** (2026-05-09 抽到 src/dev/debug.{js,css}, commit 9774c38)

## How to apply

**新对话启动时**:
1. `git log --oneline -10` 校验 main HEAD (M-misc 后 = `7644cdb`, 后续 memory commit 在它之上)
2. **重构主体彻底收官 + 桶 2 + 桶 6 + F + G + J + H + I + K + M 收尾 ✅** (phase 1+2+3+dc + HIGH sprint + _exec sprint + phase 4 10/10 + 桶 2 + 桶 6 + F + G + J + H + I + K + M 全部完成, v181 -95.5%)
3. **sprint 累计**: 30 sprint batches + 10 phase 4 sub-sessions (全部完成)
4. **phase 4 实测 vs plan**: 累计 -10550 行 (实测远低于 plan 估"突破 -80% 大关 v181 ~3000 行"). 4.10 实测 -2567 vs plan 估 ~2500 (这次比较接近)
5. **下阶段候选** (制作人决):
   - **战斗机制 systematic bug fix sprint** (memory project_combat_mechanism_bugfix.md, sprint_followup §五 §5.1+§5.2)
     - §5.1 AI 攻玩家城无攻城动画 (P1, 4.10 实机测 catch 但 pre-existing v181 bug, 非 4.10 regression)
     - §5.2 AI 不扎营 (P2, 4.9+4.10 实机测都跳过 ②营寨)
   - MEDIUM/LOW D 类 sprint (sprint HIGH 27/27 已收, MEDIUM 44 / LOW fix 67 待启动)
   - audit pass 2 / data-completion 2
   - 桶 2 squad class 6 函数 + GEN_MAP let region 残余 (~85 行)
5. **Claude AI 实机测后置 followup** (_exec sprint 未跑 Claude AI 路径, smoke 不覆盖 _claudeAI.enabled 路径)
6. **下阶段候选** (制作人决, phase 4 完成后): MEDIUM/LOW sprint / audit pass 2 / data-completion 2
6. **verification harness** (claude.ai 决策): 不要 jsdom 全游戏跑, 用函数级 spy + invariant checker. D-052/D-065 都用这套
7. **lifecycle simulate 模式 (batch-21 verified)**: 复杂 freeze/lifecycle batch 用 jsdom + force 触发 + 多旬 invariant assert (tests/batch21_simulate.js 模板). 比 smoke layer-2 更彻底, batch-22-25 可复用
8. 也可改向: phase 4 (渲染层第二轮, 桶 3 ~10670 行) / _exec 归位架构债 sprint (batch-19.1+batch-22 已消化外交 3/14)
9. **invariant checker 维护**: 新增 status='enemy'/'ally'/城市易主写口时, 更新 tests/checkers/faction_event_invariant.js EXPECTED_CALLERS 表
10. **任何 sprint batch 启动必读** `docs/refactor_workflow_principles.md` (9 原则 + sprint gate 语义节, 尤其 #12 #13 #14 + §十一)
11. **codex review workflow** (batch-3-21 verified): 见 feedback_codex_review_workflow.md. batch-21 trial 1-3 NEEDS-WORK (catch 4 latent bugs) → trial 4 LGTM, 复杂 freeze 类多轮 review 是常态
12. **streamline 模式** (batch-7-10 trial 1 verified): 连续简单 batch 累积 commit 留 local, 集中 codex review, user 集中验收 + 一次性 push. 见 feedback_sprint_streamline_batches.md
13. **设计反转 case** (batch-21): 制作人 insight 优先级 > claude.ai 决策方向. 反转后 user 回 Claude.ai 同步 → CC 等同步完再实装. scope 可能从"1 行数值"扩到"10 处 mini-mechanism", 重新 mini scout
14. push 决策权属制作人 (feedback_push_authorization.md), 等明确判定再 push
