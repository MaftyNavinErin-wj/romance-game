// src/core/helpers.js
//
// 通用 utility helpers — 纯函数,不读不写 G,无 DOM 依赖。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.1 / 阶段 3)
//   - fmt        L16711-L16716  数字格式化(万 / toLocaleString)
//   - sleep      L16718         Promise 延时
//   - safeSub    L17035         安全扣减工具(参数 res 由调用方注入,非 G 直读)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
// 接口风格:全局函数(同 v181 + 已抽 src/data/ + src/render/ 模块共享 hoisted
// function 全局可见,无 import/export)。
//
// PLAN §二偏离记录(同 phase1_summary §5.3 处理方式 — 记录但不改 plan):
//   - PLAN 列的 `safeAdd` 在 v181 中**不存在**(grep 0 命中),v181 直接用 `+=` 累加
//   - PLAN 列的"数组工具"(clamp/sum/avg/sumBy/range/deepCopy 等)在 v181 中
//     **未发现独立顶层 utility**(grep 0 命中),散见各处内联表达式
//   - 实际抽离 3 函数(fmt / sleep / safeSub)< PLAN 估计
//
// 不抽的候选(留 v181):
//   - log         读写 G.logs + DOM(.elog innerHTML)
//   - updateFacStats  读写 G.factions / G.cities / G.units
//   规则:任何 G 引用一律留 v181,等 phase 3 后续 sub-session 归到对应 chain。

function fmt(n){
  if(n===undefined||n===null) return'0';
  n=Math.floor(n);
  if(Math.abs(n)>=10000) return(n/10000).toFixed(1)+'万';
  return n.toLocaleString();
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

/** ★ v154fix H2: 安全扣减工具——保证资源不为负 */
function safeSub(res, key, amount){ res[key] = Math.max(0, (res[key]||0) - amount); }
