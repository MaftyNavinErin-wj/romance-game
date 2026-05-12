---
name: v170 籍贯系统 latent broken (1f-p4-p3 修)
description: src/chains/general.js getGenBirthplace 读错表 (GEN_TAGS 而非 GEN_META), v170 整个籍贯系统从 v170 抽离起一直 silent 失效. user 1f-p4 实测 getGenHomeCity 返 null 时 catch.
type: reference
---

## 现象

console 跑 `getGenHomeCity('曹操')` / `getGenHomeCity('糜竺')` 等 全部返 `null`,
即使 1f-p4 移 谯县/朐县/吴县 到正确新城后仍 null.

## 根因

`src/chains/general.js:362-363` (1f-p4-p3 前):
```js
function getGenBirthplace(genName){
  return GEN_TAGS[genName]?.birthplace || null;
}
```

但 **GEN_TAGS schema 无 birthplace 字段** (`src/data/generals.js:109`):
```js
'曹操': {politics, combat, origin, state, temperament, [clan]}
```

birthplace 实际在 **GEN_META** (`src/data/generals.js:408`):
```js
'曹操': { title, post, skills, loyalty, values, birthplace:'沛国谯县', clan, ... }
```

`src/core/main.js:298-304` 同 use case 用 `getGenMeta(name).birthplace` 正确读. helper 读错表.

## 受影响 (v170 抽离起 → 1f-p4-p3 一直 silent 失效)

- `getGenHomeCounty` 永远 null
- `getGenHomeCity` 永远 null
- `isGenHomeInFac` 永远 false
- 县属 loyalty 中本族放大 (×2.0) 从未 trigger
- magnate shock 敏感 (×2.0) 从未 trigger
- gentry G1 籍贯地加成全失效
- `src/chains/general.js` getGenLocalBonus 本县/同城辐射/本族 tier 加成全 dead

## Fix (commit f28b0eb)

```js
function getGenBirthplace(genName){
  return getGenMeta(genName)?.birthplace || null;
}
```

## How to apply

**Why**: 这是 audit pass 1 漏掉的 latent bug (8 链 walkthrough 没 cover gentry G1 county/clan path).
未来类似 v17x 系统 抽离 (eg phase 4 武将归属) 必须 grep helper 函数 实际读什么字段
vs 数据字段实际存哪 (`GEN_TAGS` vs `GEN_META` 两表分流 是历史包袱).

**Audit pass 2 followup**: gentry chain G1 路径需要 重 audit (现在系统 终于 active, 之前 audit
基于"系统在工作"假设可能漏点).
