---
name: Layer-3 sprint_verify 模板
description: tests/sprint_verify.js — sprint batch fix 自动 verify 模板, 替代 user F12 console paste, 后续 sprint 复用
type: reference
---

**用法**:
```
node tests/sprint_verify.js          # 跑全部
node tests/sprint_verify.js B-D093   # filter 单 ID
node tests/sprint_verify.js B-diplo  # filter 链 prefix
```

**添加新 verify 步骤**(每个 sprint batch 标准动作):
1. fix implement + smoke vs main 后, 在 `tests/sprint_verify.js` VERIFIES 数组末尾加 entry:
   ```js
   {
     id: 'B-DXXX',  // commit prefix 一致
     name: '中文描述',
     fn(G, win){
       const fid = G.playerFac;
       const tgt = win.ALL_FACS.find(f => f !== fid && f !== 'rebel');
       resetDiplo(G, fid, tgt);  // 或自定义 reset
       win.fixPath(...);  // 调 fix 路径
       // assert deltas
       return delta === expected
         ? { passed: true }
         : { passed: false, detail: 'expected X, got Y' };
     },
   }
   ```
2. `node tests/sprint_verify.js B-DXXX` 跑单项 verify
3. PASS 后 commit (跟 fix commit 同 batch 或单独 docs commit)

**适用 fix 类型** (减负显著):
- 数值统一 (rel / 金钱 / loyalty 等)
- 跨链 close / 算法回路
- 写口补全 / 路径覆盖
- latch / 苛刻条件 (脚本可 force 触发)
- Helper 抽离 / 重构

**不适用** (仍需游戏内手动测):
- UI / modal 渲染
- log 文案 (玩家可见叙事)
- 玩家弹窗节奏 / 动画 / setTimeout 链

**关键 pitfall** (写模板时踩坑):
1. 顶层 const/let (ALL_FACS/EVENT_DEFS/FAC/REPUTATION_DEFAULT) 不会自动挂 window — expose script 要显式 `window.X = X`
2. `_actedThisTurn` marker 在 `G.diplo[k]._actedThisTurn`, 不在 `G[_diploActed_<fid>]`. reset 必须 deep (用 resetDiplo helper)
3. 静态 grep 模式适合 jsdom 难直接调的路径 (如 D-118 中立战斗 in resolveBattle 要全套部队 setup)
4. mock Math.random 测失败分支 (如 D-096 _execProposeAlliance acceptRate 失败) 要 origRand 还原
5. 测 jsdom 不渲染的路径 (closeModal 等) 用 try/catch 不阻断 verify

**跟 smoke.js (Layer-1+2) 互补**:
- smoke.js: 跑 50 旬 + diff baseline.json, catch byte-level 行为漂移 (回归)
- sprint_verify.js: 控制初始 state, 调 fix 路径, assert 状态 deltas, catch fix 错配

**写法教训**:
- D-093 PASS / D-092 D-095 FAIL 是因为 D-093 跑完 _actedThisTurn 残留 → 后续 verify 被 diploWar early return → resetDiplo helper 修
- D-093 console paste 测 false fail (rel=12.25 clamp at 0) — Layer-3 用 rel=50 起避免
- 这些 false fail 在 console paste 测时反复出现, Layer-3 模板的核心价值就是消除

**复用扩展**: audit pass 2 / 战斗机制 sprint / small feature batch 都可复用同一 VERIFIES 数组 (按 ID prefix 区分 sprint).
