---
name: typeof X !== 'undefined' 守卫 — 删 const sweep checklist
description: 删 top-level const 前必须 grep `typeof X !== 'undefined'` 守卫 pattern, 否则 const 删后守卫永远 falsy 静默失效 (1c-c 漏改 + 1d-c 暴露教训)
type: feedback
---

**规则**: 删除任何 top-level const(`const X = ...`)前,**必须** grep 整 src/ + v181 找 `typeof X !== 'undefined'` 守卫 pattern,一并清理(改成直接调或纯 ?. 链)。

**Why**: 1c-c migration 把 `FAC[fid].color` → `getFactionDef(fid)?.color`,但 `(typeof FAC !== 'undefined' && getFactionDef(fid)?.color) || fallback` 这种"guard + accessor 共用"pattern 漏改:
- pre-const-删: `typeof FAC = 'object'` (empty obj 也是 truthy),guard 永远通过, getFactionDef 正常返回。
- post-const-删: `typeof FAC = 'undefined'` (const 不存在),guard 永远 falsy,**short-circuit 永远 fallback**。
- smoke 不一定 catch (captureState 不抓渲染输出),实机测才能发现颜色全变默认色。

1d-c 暴露 battle_anim.js 4 site (unit/ship/climber/result color),codex trial 1 P2 catch。

**How to apply**:

### 删 const 前 sweep checklist

```bash
# 对每个待删 const SYMBOL, 跑这两个 grep:
grep -rn "typeof SYMBOL !==" src/ project_romance_v181.html --include="*.js" --include="*.html"
grep -rn "typeof SYMBOL ==" src/ project_romance_v181.html --include="*.js" --include="*.html"

# 期望: 仅 accessor 内部 + loader 防御性 check (这些是 intentional null safety)
# 任何 consumer 模块出现 → 必须改成不依赖 typeof 的写法
```

### 改法

```js
// 删之前 (1c-c 漏改):
const col = (typeof FAC !== 'undefined' && getFactionDef(fid)?.color) || '#888';

// 删之后 (1d-c-p2 fix):
const col = getFactionDef(fid)?.color || '#888';
// accessor 已内置 null safety, 不需 typeof guard
```

### batch 框架嵌入

const 删 sub-session(如 1d-c)开始前的 mini scout 加一步:
1. 列出待删 const 名单
2. 每个跑 typeof grep
3. 把发现的 site 列入 1d-c scope(避免成为 1d-c-p2 follow-up)

### 已知坑

- `typeof` 守卫在 accessor 内部是合理的(`getWildGenMeta` 内的 `typeof WILD_GEN_META !== 'undefined'` 因为 WILD_GEN_META 仍是 top-level const 数据源,不删)。grep 时需区分 accessor/loader 内部 vs consumer 模块。
- scenario_loader.js 内有 `typeof WILD_GENS !== 'undefined'` 防御 — WILD_GENS 数据源 const 不删,守卫保留 future-proof。
- empty `const X = {}` 容器(1b-1 mutable container 模式): typeof 永真,无论是否 sync。删除时也需 sweep。

### Lesson 沉淀

const 删除是低频但 high-risk 操作。每次都跑这个 sweep + 一次实机测(渲染 +战斗)能避免类似 latent bug。1c-c 单独 review 时没要求 codex 跑 `typeof` grep(只 grep `FAC[`),所以漏。今后 codex prompt 模板可加。
