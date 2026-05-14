#!/usr/bin/env node
// tools/patch_214_roster_add.js
//
// Task C of SCENARIO_214 reverse-audit:
// 把 13 个 "该活在 214 但漏列名册" 的武将加进 SCENARIO_214.generals.
//
// 归属 (制作人 approve, "不好归类→wild" 规则):
//   wei active 7: 史涣/韩浩/蒯越/蔡瑁/鲜于辅/阎柔/刘琮
//   shu active 2: 吴兰/雷铜
//   wild 4: 韩遂/阎行/刘璋/田畴 (凉州独立无 faction / 丢益州无实权 / 拒仕 recluse)
//   skip: 陆抗 (214 还没出生, debut246)
//
// 安全: round-trip check + relation 目标存在性校验.
// 用法: node tools/patch_214_roster_add.js

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'src/data/scenarios/214.js');

// ── 13 个新 entry ──
const NEW_ENTRIES = {
  "史涣": {
    "status": "active", "fac": "wei", "city": "xuchang", "role": null,
    "post": { "name": "中领军", "rank": "将", "desc": "统领禁军中军，本势力部队补员速度+5%。" },
    "title": null, "loyalty": 90, "merit": 60,
    "retainer": { "count": 600, "type": "cavalry" },
    "initialUnit": false,
    "relations": [
      { "target": "曹操", "type": "主公", "intimacy": 70 },
      { "target": "韩浩", "type": "同僚", "intimacy": 70 }
    ],
    "skillsOverride": null
  },
  "韩浩": {
    "status": "active", "fac": "wei", "city": "xuchang", "role": null,
    "post": { "name": "中护军", "rank": "将", "desc": "统领禁军，督护诸将。" },
    "title": null, "loyalty": 90, "merit": 65,
    "retainer": { "count": 700, "type": "heavy" },
    "initialUnit": false,
    "relations": [
      { "target": "曹操", "type": "主公", "intimacy": 72 },
      { "target": "史涣", "type": "同僚", "intimacy": 70 }
    ],
    "skillsOverride": null
  },
  "蒯越": {
    "status": "active", "fac": "wei", "city": "xuchang", "role": null,
    "post": { "name": "光禄勋", "rank": "文官", "desc": "掌宫廷宿卫，参赞机要。" },
    "title": null, "loyalty": 75, "merit": 80,
    "retainer": { "count": 0, "type": null },
    "initialUnit": false,
    "relations": [{ "target": "曹操", "type": "主公", "intimacy": 60 }],
    "skillsOverride": null
  },
  "蔡瑁": {
    "status": "active", "fac": "wei", "city": "xuchang", "role": null,
    "post": { "name": "长水校尉", "rank": "将", "desc": "统领禁军骑兵。" },
    "title": null, "loyalty": 70, "merit": 50,
    "retainer": { "count": 0, "type": null },
    "initialUnit": false,
    "relations": [{ "target": "曹操", "type": "主公", "intimacy": 55 }],
    "skillsOverride": null
  },
  "鲜于辅": {
    "status": "active", "fac": "wei", "city": "youzhou", "role": null,
    "post": { "name": "度辽将军", "rank": "将", "desc": "镇守北疆，抵御乌桓鲜卑。" },
    "title": null, "loyalty": 80, "merit": 60,
    "retainer": { "count": 800, "type": "cavalry" },
    "initialUnit": false,
    "relations": [
      { "target": "曹操", "type": "主公", "intimacy": 60 },
      { "target": "阎柔", "type": "同僚", "intimacy": 65 }
    ],
    "skillsOverride": null
  },
  "阎柔": {
    "status": "active", "fac": "wei", "city": "youzhou", "role": null,
    "post": { "name": "护乌桓校尉", "rank": "将", "desc": "统辖乌桓部众，镇抚北疆。" },
    "title": null, "loyalty": 78, "merit": 55,
    "retainer": { "count": 700, "type": "cavalry" },
    "initialUnit": false,
    "relations": [
      { "target": "曹操", "type": "主公", "intimacy": 58 },
      { "target": "鲜于辅", "type": "同僚", "intimacy": 65 }
    ],
    "skillsOverride": null
  },
  "刘琮": {
    "status": "active", "fac": "wei", "city": "qingzhou", "role": null,
    "post": { "name": "青州刺史", "rank": "文官", "desc": "监察一州，提升治下城池治安。" },
    "title": null, "loyalty": 60, "merit": 30,
    "retainer": { "count": 0, "type": null },
    "initialUnit": false,
    "relations": [{ "target": "曹操", "type": "主公", "intimacy": 40 }],
    "skillsOverride": null
  },
  "吴兰": {
    "status": "active", "fac": "shu", "city": "chengdu", "role": null,
    "post": { "name": "牙门将", "rank": "将", "desc": "冲锋陷阵的先锋将领。" },
    "title": null, "loyalty": 85, "merit": 40,
    "retainer": { "count": 500, "type": "light" },
    "initialUnit": false,
    "relations": [
      { "target": "刘备", "type": "主公", "intimacy": 60 },
      { "target": "雷铜", "type": "同僚", "intimacy": 70 }
    ],
    "skillsOverride": null
  },
  "雷铜": {
    "status": "active", "fac": "shu", "city": "chengdu", "role": null,
    "post": { "name": "牙门将", "rank": "将", "desc": "冲锋陷阵的先锋将领。" },
    "title": null, "loyalty": 85, "merit": 40,
    "retainer": { "count": 500, "type": "light" },
    "initialUnit": false,
    "relations": [
      { "target": "刘备", "type": "主公", "intimacy": 60 },
      { "target": "吴兰", "type": "同僚", "intimacy": 70 }
    ],
    "skillsOverride": null
  },
  "韩遂": {
    "status": "wild", "fac": "wild",
    "wildData": {
      "loyalty": 50, "merit": 50,
      "retainer": { "count": 0, "type": null },
      "relations": [{ "target": "阎行", "type": "旧部", "intimacy": 45 }],
      "skillsOverride": null
    }
  },
  "阎行": {
    "status": "wild", "fac": "wild",
    "wildData": {
      "loyalty": 50, "merit": 40,
      "retainer": { "count": 0, "type": null },
      "relations": [{ "target": "韩遂", "type": "旧主", "intimacy": 45 }],
      "skillsOverride": null
    }
  },
  "刘璋": {
    "status": "wild", "fac": "wild",
    "wildData": {
      "loyalty": 50, "merit": 30,
      "retainer": { "count": 0, "type": null },
      "relations": [],
      "skillsOverride": null
    }
  },
  "田畴": {
    "status": "wild", "fac": "wild",
    "wildData": {
      "loyalty": 60, "merit": 40,
      "retainer": { "count": 0, "type": null },
      "relations": [],
      "skillsOverride": null
    }
  }
};

const srcText = fs.readFileSync(TARGET, 'utf8');
const marker = 'const SCENARIO_214 = ';
const markerIdx = srcText.indexOf(marker);
if (markerIdx === -1) { console.error('!! marker not found'); process.exit(1); }
const header = srcText.slice(0, markerIdx + marker.length);
let rest = srcText.slice(markerIdx + marker.length);
const semiIdx = rest.lastIndexOf('}');
const bodyText = rest.slice(0, semiIdx + 1);
const trailer = rest.slice(semiIdx + 1);

const data = JSON.parse(bodyText);

// ── round-trip safety check ──
if (JSON.stringify(data, null, 2) !== bodyText) {
  console.error('!! round-trip mismatch — abort.');
  process.exit(1);
}
console.log('round-trip check: PASS');

// ── add 13 entries ──
let added = [];
for (const [name, entry] of Object.entries(NEW_ENTRIES)) {
  if (data.generals[name]) { console.warn('!! 已存在: ' + name); continue; }
  data.generals[name] = entry;
  added.push(name);
}
console.log('added ' + added.length + ': ' + added.join(', '));

// ── relation 目标存在性校验 ──
const allNames = new Set(Object.keys(data.generals));
let dangling = [];
for (const [name, entry] of Object.entries(data.generals)) {
  const rels = (entry.relations) || (entry.wildData && entry.wildData.relations) || [];
  for (const r of rels) {
    if (!allNames.has(r.target)) dangling.push(name + ' → ' + r.target);
  }
}
if (dangling.length) {
  console.error('!! dangling relation refs:');
  dangling.forEach(d => console.error('   ' + d));
  process.exit(1);
}
console.log('relation 目标存在性校验: PASS (无 dangling ref)');

// ── counts ──
let active = 0, wild = 0, pending = 0;
for (const v of Object.values(data.generals)) {
  if (v.status === 'active') active++;
  else if (v.status === 'wild') wild++;
  else if (v.status === 'pending') pending++;
}
console.log('\n新 count: active ' + active + ' / wild ' + wild + ' / pending ' + pending + ' = ' + (active + wild + pending));

// ── write back ──
fs.writeFileSync(TARGET, header + JSON.stringify(data, null, 2) + trailer);
console.log('Wrote ' + TARGET);
