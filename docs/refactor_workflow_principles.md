# 重构 / 数据抽离工作流原则集

> 本文档收录 Project Romance 重构期间沉淀的**普适工作流原则**(适用任何 verbatim 搬运 / 文件抽离 / 数据补完工作),phase 4 / sprint / 后续抽离都应遵循。
>
> 来源:phase 3 期间 13 sub-session(p3.1-p3.13)沉淀 5 条原则 + refactor/data-completion S2 沉淀 1 条新原则,共 **6 条普适原则 + 1 条 phase 3 chain 阶段专用规范**。
>
> 触发场景:任何工作满足"verbatim 搬运 + smoke byte-identical 守底"模式的 sub-session 启动前必读。

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
| **#11** | **新建文件时,replace v181 在前,script tag 在后**(本次新增)| **dc.S2** | **script tag 偏移行号导致 ranges 错位 → SyntaxError** | **§七** |

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

## 原则之间的执行顺序

每个 sub-session 启动按以下顺序套用:

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

---

## 适用范围与例外

**全适用** verbatim 搬运 / 文件抽离 / 数据补完 sub-session(本文档主目标)。

**例外 / 弱化**:
- **D 类 fix sprint**(修代码 sprint):工作流不同(改逻辑而非搬运),smoke byte-identical 不再守底,需要新验证机制(等制作人定 sprint 启动方案)
- **接口风格段 fixup**(微调 header 注释):极小动作,不需要原则 #5-#11 全套(参考 main commit `ddf50c0`)

---

(原则集 v1.0 — phase 3 + data-completion 沉淀,后续 sub-session 实装 bug 触发新原则时追加 #12+)
