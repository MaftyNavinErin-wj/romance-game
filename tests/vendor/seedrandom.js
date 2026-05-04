// seedrandom.js — Mulberry32 + xmur3 (vendored, MIT-style minimal PRNG)
//
// 用途:Project Romance smoke test 注入确定性 random
// 来源:Mulberry32 (Tommy Ettinger, public domain) + xmur3 hash (bryc, public domain)
// 选这两个的理由:
//   - 算法都是 public domain,无 license attribution 包袱
//   - 实现 < 30 行,易审计
//   - 周期 2^32(Mulberry32)对 50 turn 模拟绰绰有余
//   - 输出与 Math.random 同接口([0,1) double)
//
// 用法:
//   const seedrandom = require('./seedrandom.js');
//   Math.random = seedrandom('project_romance_test_seed_001');
//
// !!! 不是密码学安全 PRNG !!! 仅用于行为不变性测试。

'use strict';

// xmur3: 字符串 → 32bit hash 函数(用于 seed → state 派生)
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// Mulberry32: 32bit state PRNG → [0,1) double
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedrandom(seedStr) {
  if (typeof seedStr !== 'string' || !seedStr) {
    throw new Error('seedrandom: seed must be a non-empty string');
  }
  const seedFn = xmur3(seedStr);
  return mulberry32(seedFn());
}

module.exports = seedrandom;
module.exports.default = seedrandom;
