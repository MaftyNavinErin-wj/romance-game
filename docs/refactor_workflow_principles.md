# 重构 / 数据抽离工作流原则集

> 本文档收录 Project Romance 重构期间沉淀的**普适工作流原则**(适用任何 verbatim 搬运 / 文件抽离 / 数据补完工作),phase 4 / sprint / 后续抽离都应遵循。
>
> 来源:phase 3 期间 13 sub-session(p3.1-p3.13)沉淀 5 条原则 + refactor/data-completion S2 沉淀 1 条新原则 + D 类 sprint 启动期 codex review 沉淀 2 条新原则 + batch-2 D-091 漏看沉淀 1 条新原则 + 1 条 sprint gate 语义,共 **9 条普适原则 + 1 条 sprint gate 语义节 + 1 条 phase 3 chain 阶段专用规范**。
>
> 触发场景:任何工作满足"verbatim 搬运 + smoke byte-identical 守底"模式的 sub-session 启动前必读。**D 类 sprint 期 batch 启动前**额外读 §八-§十一(原则 #12 #13 #14 + sprint gate 语义)。

---

## 总览

| # | 原则 | 起 sub-session | 触发教训 | 文档段 |
|---|---|---|---|---|
| #5 | scout-before-extract | p3.3 | plan v159 之前 vs v181 实测偏差 | §一 |
| #6 | chain 阶段 chains/*.js 6 项 header 必含 | p3.5 | chain 模板首次设计 | §二(chain 阶段专用)|
| #7 | awk 边界用 wc -l 验证 | p3.6 | awk 漏 1 行 closing → SyntaxError | §三 |
| #8 | Node 双脚本(共享 ranges)代替手打 | p3.7 | 中文标点字符替换 → verbatim 失败 | §四 |
| #9 | scout 四件验证 + docstring 不跨切 | p3.8 / p3.12 | 4 个实装 bug 同源 + dangling docstring | §五 |
| #10 | ranges 无嵌套 inclusion | p3.11 | 嵌套 range 卡死 iter | §六 |
| **#11** | **新建文件时,replace v181 在前,script tag 在后** | **dc.S2** | **script tag 偏移行号导致 ranges 错位 → SyntaxError** | **§七** |
| **#12** | **D 类 fix 必须显式声明覆盖的入口路径**(sprint 期专用)| **codex review** | **D-048 / D-049 / D-064 等 fix 玩家路径漏 AI/事件路径** | **§八** |
| **#13** | **状态字段语义变更必须核 5 个生命周期点闭环**(sprint 期专用)| **codex review** | **D-120 顶层字段永不重置等状态生命周期不闭合** | **§九** |
| **#14** | **sprint scout 必读 walkthrough**(sprint 期专用)| **batch-2 D-091 漏看** | **scout 凭"上层调用看起来对"判定,漏看 helper 签名 + audit pass 1 已标 D 类** | **§十** |

---

## §一、原则 #5(p3.3 起):scout-before-extract

**plan 写于 v159 之前,实际 v181 已经长出很多 plan 不知道的代码**。每个 sub-session 都要先 scout 实测,**不能照 plan 字面抽**。

**操作规范**:
1. 每个 sub-session 启动后,先做 boundary scout(read-only,不动手)
2. scout 报告必含:代码块位置清单 + G 读写性质 + 跨 chain 引用情况 + plan §二实测偏离 + 抽离方案选项(若 >1 种)
3. 制作人 approve 后才开 working branch 实装

**必须正式化的依据**(phase 3 命中 3 次同模式):
- p3.1:safeAdd / 数组工具不存在
- p3.2:plan 4 候选 + 1 概念,实际只有 1 真跨链 hub
- p3.3:plan ~860 行,scout 实测 1399 行,多出 v159 Phase 5 整层 440 行

**适用范围**:phase 3 / data-completion / 后续 phase 4 / sprint 全部 sub-session。

---

## §二、原则 #6(p3.5 起,chain 阶段专用):chains/*.js 6 项 header 必含

**chain 阶段所有 chains/*.js 必含 6 项 header**(决策点 5,p3.5 制作人 approve):

1. **来源**(v181 行号 + 抽离方式 verbatim 声明)
2. **抽离范围 + 留 v181 部分**
3. **写口归属声明**((a) 原则核心,审计一眼可验)— **制作人新增项**
4. **反向调用清单**(callers + callees,按归属链整理)
5. **plan §二 偏离记录**(commit + header + sub-session notes 三处留档)
6. **script 加载位置 + 模板说明**

**适用范围**:**chain 阶段专用**(`src/chains/*.js`)。data-completion(`src/data/*.js` 静态数据)不必含 6 项 header,但建议含来源 / 抽离方式 / 接口风格 / 留 v181 / 加载顺序 5 项。

---

## §三、原则 #7(p3.6 起):awk 边界用 wc -l 验证

**bug 教训(p3.6)**:awk 范围结束行未用 `wc -l` 校验,manual 数 line 偏差导致 `_triggerGentryBetray` 函数 closing 行漏 1,SyntaxError + smoke FAIL。

**操作规范**:
- 提取后跑 `wc -l <抽出文件>`
- 算 verbatim 行数 = 文件总行 - header 行
- 与预期 awk delete 范围行数对比

**适用范围**:任何用 awk / range-based 提取的工作。**与原则 #8 一起执行**(双脚本 + wc 验证)。

---

## §四、原则 #8(p3.7 起):Node 双脚本(共享 ranges)代替手打

**bug 教训(p3.7)**:第一次写 politics.js 时手打中文标点把 `（）` `！` `:` 等替换成了 ASCII 半角,verbatim 原则要求字符级一致。

**操作规范**:
- **双脚本(build + replace)共享 ranges 数组**,逻辑等价,少一步 off-by-one 风险
- 先 build_X.js(从 v181 verbatim 提取段落)→ syntax check
- 再 replace_v181.js(同样的 ranges 数组用 placeholder 替换)→ smoke check
- grep 验证中文标点 `,!?:()` 保留(全角)

**适用范围**:任何 verbatim 搬运工作。**禁止手打**(原则 #8 严格执行)。

---

## §五、原则 #9(p3.8 起):scout 四件验证 + 原则 #9 补充(p3.12):docstring 不跨切

### 原则 #9 主体(p3.8)

**bug 教训**:p3.8 实装阶段踩 4 个 bug,均因 scout 不充分:
- 文件累积 doubled / scout 范围 end 不到函数体结束 / scout 漏检中间夹的他链函数 / scout 边界判定错误(aiDoTradeAgreement 误归外交)

**四件验证**:
- **(a)** `awk 'NR>=A && NR<=B && /^function /'` 列范围内**所有** function(检测他链夹击)
- **(b)** `grep -n "^}"` 验证每段最后函数真实 closing brace(避免漏函数体)
- **(c)** build 脚本 header 提取用 banner 终止标记(idempotent 重跑无 doubled)
- **(d)** 函数名带 chain 前缀**不等于**归该 chain,严格按主写口判定 / 业务语义优先

**沉淀效果**:p3.8 4 bug → p3.9 0 bug → p3.10 0 bug,沉淀有效。

### 原则 #9 补充(p3.12 起):docstring 不能跨 range 切片

**bug 教训(p3.12 bug 7.2)**:GEN13 to=7755 + GEN14 from=7757 跨 docstring 切片,v181 留下 dangling `*/` → SyntaxError → inline script 不执行 → smoke FAIL。

**操作规范**:**ranges 边界跨 docstring 时,docstring 必须整段在某一 range 内,不能跨 range 切片**。否则 dangling `/**` 或 `*/` 会破坏 v181 inline script syntax。验证手段:`grep -n "^}"` + 上下文 awk 看前后 5-10 行。

**适用范围**:任何 ranges 边界判定。**实装前 read 边界前后 5-10 行强制要求**。

---

## §六、原则 #10(p3.11 起):ranges 无嵌套 inclusion

**关键 bug 教训(p3.11 bug 7.5)**:`_supplyCache` from=10701 嵌套在 `MIL5` from=10343 to=11090 内,replace 算法 sort by from + line-by-line iter,嵌套 range 卡死 iter,后续 ranges 全部不触发,导致部分函数没被替换 → chain 文件 + v181 重复声明 → SyntaxError → smoke FAIL。

**操作规范**:
- 在添加新 range 前,先检查它是否被现有 range 包含 / 包含现有 range
- 嵌套 range 必须**合并**(自然包含,不需单独 range)或**拆分**外层 range(让中间空出)
- build 脚本 banner marker 用 sort 后的第一段(不是声明顺序的第一段)
- replace 脚本启动时 `for (let i = 1; i < RANGES.length; i++) { if (RANGES[i].from <= RANGES[i-1].to) throw }` 显式验证

**适用范围**:任何多 ranges 抽离工作。

---

## §七、原则 #11(refactor/data-completion S2 起,**新增**):新建文件时,replace v181 在前,script tag 在后

### bug 教训(dc.S2,2026-05-05)

**症状**:dc.S2 实装初次 attempt 顺序如下:
1. build state_county.js(从 v181 §E+§F L981-L1399 提取 verbatim,scout ranges = `[981, 1399]`)
2. **加 `<script src="src/data/state_county.js">` 标签到 v181.html**(在 generals.js 之后)— 此时 v181.html **+1 行**,script tag 之后所有行号 **+1 偏移**
3. Run replace 脚本(用 scout ranges `[981, 1399]`)— 但实际 §E+§F 在偏移后已经在 `[982, 1400]`
4. Replace 处理 L981(应为 §E section header,实际是 §E section header **的前 1 行**)→ marker 替换 419 行,但漏抽 L1400 的 _CLAN_MAP block IIFE closing `}`
5. v181 留下 stray `}` → inline script SyntaxError → smoke FAIL

### 修复 + 沉淀(本次新增原则)

**修复**:回滚 + 调换顺序:
1. 先 run replace 脚本(v181 行号未偏移,与 scout ranges 一致)
2. 再加 script tag(此时 §E+§F 已抽走,后续行号偏移不影响已完成的 replace)

**普适原则(原则 #11)**:**任何**新建数据文件 / 新建 chain 文件等**需要在 v181 加 script tag 的工作**,**replace 必须在 script tag 之前完成**。

### 操作规范

**新建文件 sub-session 工作流**:
```
1. scout 范围 + 决策(原则 #5)
2. build 脚本提取 verbatim → 新文件(原则 #8)
3. 验证标点保留 / closing brace 精确 / wc -l 对比(原则 #7 + #9)
4. ⭐ Run replace 脚本 → v181 缩短(此步行号必须与 scout 一致)
5. ⭐ 加 script tag 到 v181.html(此步在 replace 之后,行号偏移无害)
6. Smoke 验证 byte-identical
7. 删 scratch + commit
```

**扩展现有文件 sub-session 工作流**(无新增 script tag,如 dc.S1 / dc.S3 扩展 generals.js / constants.js):
```
1-4. 同上(无 script tag 偏移问题,顺序不限)
5. 直接 append extract 内容到现有文件
6. Smoke 验证
7. commit
```

### 适用范围

- **新建数据文件**(如 dc.S2 state_county.js)
- **新建 chain 文件**(若有未来 phase 4 抽 squad class 之类)
- **新建 core / render 文件**
- **任何需要在 v181 inline `<script src=...>` 加新 tag 的工作**

**不适用**:
- 扩展现有文件(append 模式,无新 script tag)
- 替换 v181 inline 代码(无 script tag 变更)

---

## §八、原则 #12(D 类 sprint 启动起,**新增**):D 类 fix 必须显式声明覆盖的入口路径

### 来源

**codex review**(2026-05-06,sprint 启动期独立第二套眼睛 review):许多 D 类 bug 的根本原因是"某入口路径漏触发某 hook",fix 时若不显式声明覆盖的入口路径,会重蹈"修玩家路径,漏 Claude AI 路径 / 事件路径 / 快进路径"。

**触发示例**:
- D-048:玩家被罚 AI 不被罚(玩家路径 + AI 路径不对称)
- D-049:warDeclare 触发漏 3 路径(玩家 / 传统 AI / Claude AI 路径不一致)
- D-064:`_execPoach` 费用未乘 `(1 + _techPoachCost)`(Claude AI 路径漏修正,玩家/传统 AI 已修)
- D-095:`aiDoDiplo + _execDeclareWar` 重复调 ethosShock(传统 AI / Claude AI 与玩家 hub 路径不对称)

### 操作规范

**5 路径维度清单**(每个 D 类 fix 必查):

| # | 入口路径 | 典型函数前缀 | 备注 |
|---|---|---|---|
| 1 | **玩家路径** | UI handler / `diplo*` / `poach*` / 玩家 4 件套 | 玩家 click/decision 路径 |
| 2 | **传统 AI 路径**(rule-based AI) | `aiDo*` / `aiSelect*` / `aiExecute*` / `aiConsider*` | 启发式规则决策 |
| 3 | **Claude AI 路径**(_exec 派发) | `_exec*`(36 个)+ `src/core/claude_ai.js` 派发器 case | LLM 决策路径 |
| 4 | **事件路径** | `src/data/events.js` callbacks(condition / effect / aiChoose)| 事件触发 |
| 5 | **快进路径** | `_fastForward` 模式下与正常 turn 路径的差异 | smoke 抓的就是这条 |

**fix commit message / fix note 必含**:

```
覆盖路径(原则 #12):
- 玩家路径: <已修 / 不适用 / 留 followup,理由 ...>
- 传统 AI 路径: <已修 / 不适用 / 留 followup,理由 ...>
- Claude AI 路径: <已修 / 不适用 / 留 followup,理由 ...>
- 事件路径: <已修 / 不适用 / 留 followup,理由 ...>
- 快进路径: <已修 / 不适用,理由 ...>
```

每条至少声明"已覆盖 / 不适用 / 留 followup"三档之一,并给出**理由**(不能空白省略)。

### 适用范围

- **所有 D 类 sprint 期 fix**(HIGH / MEDIUM / LOW fix verdict)
- **不适用**:重构期 verbatim 搬运 / D 类自然 close(无主动 fix 行为)
- **特殊情况**:某入口路径在原 audit 已 verified-with-notes / no-fix,fix note 标"该路径 verdict 已锁,不动",仍需声明

---

## §九、原则 #13(D 类 sprint 启动起,**新增**):状态字段语义变更必须核 5 个生命周期点闭环

### 来源

**codex review**(2026-05-06):D-120(`G._diploActed_${fid}` 顶层字段永不重置 → 玩家附庸 3 入口整局各 1 次)等 bug 暴露状态字段生命周期不闭合 — 写入存在但 reset / expire / save / load 缺一环。

**触发示例**:
- D-120:`G._diploActed_${fid}` 顶层字段写入存在,**永不重置**(只在 `G.diplo[k]._actedThisTurn` B1 字段内重置,两套机制混用)
- 类似潜在风险:`G._warClaimStrength` / `G._claimGentryHook` / `G._diploCD_${a}_${b}` 等顶层动态字段的 save/load 闭环

### 操作规范

**5 个生命周期点清单**(任何**新增状态字段**或 fix 涉及的**字段语义变更**必查):

| # | 生命周期点 | 检查 |
|---|---|---|
| 1 | **写入 (write)** | 哪些函数写该字段?所有 caller 是否一致 |
| 2 | **重置 (reset, backToTitle)** | `backToTitle` / 切回主菜单 / `initGame` 重启时该字段是否清空 |
| 3 | **过期 (expire)** | 如 cooldown / turn-based 过期,是否有 `processXxx` 在主 tick 减/清?永不过期是否设计意图 |
| 4 | **存档 (save)** | `saveGame` / 序列化时该字段是否写入(`_serializeG`)|
| 5 | **加载 (load + default)** | `loadFromSlot` / `_deserializeG` 是否读回 + 提供 default 值(避免老存档加载后 undefined)|

**fix commit message / fix note 必含**:

```
状态生命周期(原则 #13):字段名 `<G.xxx>`
- write: <写口位置 / "无新增,仅修值">
- reset: <已闭环 / 留 followup,理由 ...>
- expire: <已闭环 / 设计意图永不过期,理由 ... / 留 followup>
- save: <已闭环 / 不需要(派生字段),理由 ...>
- load + default: <已闭环 / 不需要,理由 ...>
```

### 适用范围

- **新增状态字段**(任何 `G.xxx` / `G.factions[fid].xxx` / `G.cities[cid].xxx` 等)
- **fix 涉及字段语义变更**(如 D-021 字段名改,但读端已对齐 → save/load 不动,但要在 fix note 声明"语义不变,生命周期闭环已存在")
- **不适用**:纯逻辑 fix 不涉及字段(如算法系数调整)

### 与原则 #12 关系

原则 #12 看"**横向**入口路径覆盖",原则 #13 看"**纵向**字段时间轴闭环"。两者正交,sprint 期 fix 应同时套用。

---

## §十、原则 #14(D 类 sprint 启动起,**新增**):sprint scout 必读 walkthrough

### 来源

**batch-2 D-091 漏看**(2026-05-06):scout v0.1/v0.2 把 7 个 D-099 缺漏指令全部判"已实装可暴露",其中 4 个判错。最严重的是附庸 3 个 `_exec` 指令:

```js
// _exec 包装器(v181.html)看起来双参传入正确:
function _execDemandVassal(fid, act) {
  if (typeof diploDemandVassal === 'function') {
    diploDemandVassal(fid, target);  // 双参!scout 看到这里就以为 OK
    return true;
  }
}

// 但 helper 实际签名是单参 + 硬编玩家:
function diploDemandVassal(other) {  // 单参!
  const fid = G.playerFac;           // 硬编玩家!
  ...
}
```

JS 静默忽略第二参,Claude AI 调用后 helper 用 `G.playerFac` 当 fid → **写错主体**(声称 "fid → target",实际 "玩家 → fid")。

**这正是 cross_chain_d_list:88 标的 D-091 HIGH**(diplomatic_chain_walkthrough §阶段 1.1 audit pass 1 早就发现)。Scout v0.1/v0.2 没读 walkthrough,凭"上层调用看起来对"下判定,差点把 D-091 从"未修但休眠"激活成"未修且活跃"。

### 操作规范

**每个 sprint batch scout 时,必须执行**:

1. **grep cross_chain_d_list_v1_0.md** 看本 batch 涉及的 `_exec` / 函数 / 字段是否有已标 D 类编号
   ```sh
   grep -E "diplomDemandVassal|_execDemandVassal|附庸" docs/cross_chain_d_list_v1_0.md
   ```
2. **如有命中**,读对应链的 walkthrough(`docs/audit_walkthroughs/<chain>_chain_walkthrough.md`)的相应 D 类描述段落
3. **不能凭"上层调用看起来对"判定"已实装"** — 必须追到 helper 签名 / 实际写口 / 多入口对照
4. Scout 报告必含 "已 grep cross_chain_d_list,命中/未命中 D 类清单" 字段(类似 §零 失误自报段)

### 适用范围

- **所有 sprint batch scout**(原则 #5 mini scout 的子流程)
- **不适用**:重构期 verbatim 搬运(没有 D 类 fix 行为)

### 与原则 #5 关系

原则 #5 是 scout 的**整体**要求(代码块位置、跨链引用等);原则 #14 是 scout 的**审计资产校验**要求(确保不绕过 audit pass 1 已发现的 finding)。两者层叠,sprint 期同时套用。

### 与原则 #12 / #13 关系

原则 #12 / #13 是 **fix 阶段**(scout 之后)的入口路径 / 生命周期校验;原则 #14 是 **scout 阶段**(更早)的 D 类背景校验。**早一步发现 unsafe scope,避免 fix 阶段才暴露问题**。

---

## §十一、Sprint gate 证据语义(D 类 sprint 启动起,**新增**)

### 来源

**batch-2 codex review**(2026-05-06):scout v0.2 写"checker 1 HIGH 7 → 0,exit 0 = batch 通过"。codex 指出这是过度承诺 — 只要 cancel_supply / 附庸 3 不在本 batch 安全范围内,checker 1 不会 exit 0。

### 修正语义

**Sprint gate 通过证据 ≠ checker exit 0**。**Sprint gate 通过证据 = "checker finding 按 batch 范围正确降级 + 剩余 finding 显式标注 followup batch"**。

### 适用范围

- **所有 D 类 sprint batch**(每个 batch commit message + fix note 都按此语义写)
- **不适用**:重构期 sub-session(smoke byte-identical 守底,语义独立)

### 实操检查清单

每个 sprint batch 末:

1. 跑 `npm run checkers`,记录 finding 数(分类:HIGH / WARN / INFO)
2. 对照本 batch 范围,标注每个剩余 HIGH 是否 intentional out-of-scope
3. 在 `docs/sprint_followup.md` 显式记录每个 followup item(对应到下一 batch / 独立 epic)
4. commit message 引用 checker 报告 commit hash + 标注本 batch HIGH 降级数字
5. **不要**写"checker 1 exit 0 = batch 通过";**要**写"checker 1 HIGH 从 N 降到 M,剩余 M-K 个标 followup,K 个 intentional 保留(理由 ...)"

### 与原则 #12 / #14 关系

- 原则 #14:scout 阶段挖出 unsafe scope(避免错误暴露)
- 原则 #12:fix 阶段声明覆盖路径(避免错误漏修)
- §十一 sprint gate 证据语义(本节):batch 末验收时正确语义化(避免错误判定 batch 通过)

三层防线串起来,sprint 工作流闭环。

注:§十一 是**语义节**,不是编号原则(原则 #11 已是"replace v181 在前,script tag 在后",见 §七)。

---

## 原则之间的执行顺序

### 重构期 / 数据搬运 sub-session 启动顺序

```
1. 原则 #5 scout (read-only) — 先 scout 报告
2. (chain 阶段) 原则 #6 6 项 header 模板设计
3. 原则 #8 双脚本设计 (build + replace 共享 ranges)
4. 原则 #10 验证 ranges 无嵌套 (在 build/replace 启动 throw)
5. 原则 #9 四件验证 (a/b/c/d) — 实装前 dry-run
6. 原则 #9 补充 — read 边界前后 5-10 行 (docstring 不跨切)
7. Build 脚本 → 新 / 扩展文件
8. 原则 #7 wc -l 验证 verbatim 行数
9. (新建文件) 原则 #11 — replace 先, script tag 后
   (扩展文件) — 直接 append + replace, 顺序不限
10. Smoke layer-1+layer-2 PASS
11. 删 scratch + commit
```

### D 类 sprint fix 启动顺序

```
1. 原则 #5 mini scout — 定位 D 类在 src/ 的实际位置
2. 原则 #14 scout 必读 walkthrough — grep cross_chain_d_list,命中则读对应 walkthrough
   追 helper 签名 + 实际写口,不能凭"上层调用看起来对"判定
3. 原则 #12 入口路径声明 — 5 路径维度 dry-run,标"已覆盖 / 不适用 / 留 followup"
4. 原则 #13 状态生命周期 — 若涉及字段语义变更,5 点闭环 dry-run
5. 实装(改 src/ 或 v181.html)
6. Smoke + grep + 字段对齐三重验证(字段名错配类)/ 白名单 diff 验证(算法回路类)
7. fix commit message 含原则 #12 + #13 声明 block + #14 walkthrough 命中情况
8. 跑 npm run checkers,按原则 #11(sprint gate 语义)标注 finding 降级 + followup
9. push 工作分支(等制作人 review approve 才合 main)
```

---

## 适用范围与例外

**全适用** verbatim 搬运 / 文件抽离 / 数据补完 sub-session(本文档主目标)+ D 类 sprint fix(原则 #12 #13 专用)。

**例外 / 弱化**:
- **接口风格段 fixup**(微调 header 注释):极小动作,不需要原则 #5-#11 全套(参考 main commit `ddf50c0`)
- **架构债 / 注释清理 fixup**(类似 `chore: clean phase-3/dc execution drift`):不修代码逻辑、不动 smoke baseline,豁免原则 #12 #13(无 fix 行为)

---

(原则集 v1.2 — phase 3 + data-completion + D 类 sprint codex review 沉淀(批次 1 #12/#13)+ batch-2 D-091 漏看(批次 2 #14 + sprint gate 语义)。后续 sub-session 实装 bug 触发新原则时追加 #15+)
