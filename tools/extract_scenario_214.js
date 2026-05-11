// tools/extract_scenario_214.js
//
// 阶段 1a.1 数据抽取工具
//
// 流程:
//   1. 用 jsdom 加载 project_romance_v181.html(跟 smoke.js 同 setup)
//   2. 等 v181 inline script 解析完
//   3. expose 现有数据 const 到 window.__data__
//   4. 输出:
//      - src/data/general_base.js  (GEN_BASE 主表)
//      - src/data/city_base.js     (CITY_BASE 主表)
//      - src/data/faction_base.js  (FACTION_BASE 主表)
//
// 1a.1 阶段不动现有代码,只新增 3 个未引用的文件。
// smoke vs main byte-identical 自然守底(code 未改)。

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');
const OUT_DIR   = path.resolve(__dirname, '..', 'src', 'data');

function waitFor(predicate, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try {
        if (predicate()) return resolve();
      } catch (_) { /* ignore */ }
      if (Date.now() - start > timeout) return reject(new Error('waitFor timeout'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

async function main() {
  console.log(`[extract] loading ${HTML_PATH}`);
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
  });
  const window = dom.window;

  console.log('[extract] waiting for initGame...');
  await waitFor(() => typeof window.initGame === 'function', 15000);

  // expose 现有数据 const 到 window.__data__
  const exposeScript = window.document.createElement('script');
  exposeScript.textContent = `
    window.__data__ = {
      GENS_FULL: typeof GENS_FULL !== 'undefined' ? GENS_FULL : null,
      GEN_META: typeof GEN_META !== 'undefined' ? GEN_META : null,
      WILD_GENS: typeof WILD_GENS !== 'undefined' ? WILD_GENS : null,
      WILD_GEN_META: typeof WILD_GEN_META !== 'undefined' ? WILD_GEN_META : null,
      GEN_POOL_INACTIVE: typeof GEN_POOL_INACTIVE !== 'undefined' ? GEN_POOL_INACTIVE : null,
      GEN_CLASS: typeof GEN_CLASS !== 'undefined' ? GEN_CLASS : null,
      GEN_TAGS: typeof GEN_TAGS !== 'undefined' ? GEN_TAGS : null,
      CITIES_DEF: typeof CITIES_DEF !== 'undefined' ? CITIES_DEF : null,
      FAC: typeof FAC !== 'undefined' ? FAC : null,
    };
  `;
  window.document.head.appendChild(exposeScript);

  const data = window.__data__;
  if (!data) throw new Error('expose failed: window.__data__ not set');

  const required = ['GENS_FULL','GEN_META','WILD_GENS','WILD_GEN_META','GEN_POOL_INACTIVE','GEN_CLASS','GEN_TAGS','CITIES_DEF','FAC'];
  for (const k of required) {
    if (!data[k]) throw new Error(`missing global: ${k}`);
  }

  console.log(`[extract] GENS_FULL: ${Object.keys(data.GENS_FULL).length} factions, total ${Object.values(data.GENS_FULL).reduce((s,a)=>s+a.length,0)} generals`);
  console.log(`[extract] WILD_GENS: ${data.WILD_GENS.length}`);
  console.log(`[extract] GEN_POOL_INACTIVE: ${data.GEN_POOL_INACTIVE.length}`);
  console.log(`[extract] CITIES_DEF: ${data.CITIES_DEF.length}`);
  console.log(`[extract] FAC: ${Object.keys(data.FAC).length}`);

  // ── 构建 GEN_BASE ──
  // immutable 字段: com/war/int/pol/cha/apt/birthplace/clan/gentry/classTag/skills/values/faction_clan
  // 不进 GEN_BASE 的: title/post/loyalty/relations/role(scenario-specific)
  const GEN_BASE = {};
  const seenNames = new Set();

  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a == null || b == null) return a === b;
    if (typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false;
      if (!deepEqual(a[ka[i]], b[kb[i]])) return false;
    }
    return true;
  }

  function addGen(g, source) {
    if (!g || !g.name) return;
    const meta = data.GEN_META[g.name] || data.WILD_GEN_META[g.name] || {};
    const tags = data.GEN_TAGS[g.name] || {};
    const classTags = data.GEN_CLASS[g.name] || [];

    // 时间线 stable emit(P2 codex 应对):所有 entry 都含 birthYear/deathYear/debutYear,unknown = null
    // GEN_POOL_INACTIVE entries 含 era.birth/death 可用
    const entry = {
      // 战力(immutable)
      com: g.com, war: g.war, int: g.int, pol: g.pol, cha: g.cha,
      apt: { ...g.apt },
      // 时间线 stable nullable
      birthYear: (g.era && g.era.birth) ? g.era.birth : null,
      deathYear: (g.era && g.era.death) ? g.era.death : null,
      debutYear: null,   // 1a 阶段未填,留后续 sprint 补全(出山年)
      // 史实不变(stable nullable)
      birthplace: meta.birthplace || null,
      clan: meta.clan || tags.clan || null,
      faction_clan: meta.faction_clan || null,
      gentry: tags.origin === 'gentry' ? (tags.state || null) : null,
      // 武将分类
      classTag: classTags[0] || null,
      classTagsAll: classTags.length > 0 ? [...classTags] : [],  // empty array vs null,stable type
      // timeless skills
      skills: meta.skills ? JSON.parse(JSON.stringify(meta.skills)) : [],
      values: meta.values ? [...meta.values] : [],
    };

    if (seenNames.has(g.name)) {
      // P3 codex 应对:exact dup OK,字段差异 hard-fail
      const existing = GEN_BASE[g.name];
      if (!deepEqual(existing, entry)) {
        throw new Error(`[extract] DUP CONFLICT: ${g.name} (from ${source}) differs from earlier entry`);
      }
      console.warn(`[extract] duplicate general (exact match): ${g.name} (${source})`);
      return;
    }
    seenNames.add(g.name);
    GEN_BASE[g.name] = entry;
  }

  // GENS_FULL: 4 factions
  for (const [fid, gens] of Object.entries(data.GENS_FULL)) {
    for (const g of gens) addGen(g, `GENS_FULL.${fid}`);
  }
  // WILD_GENS
  for (const g of data.WILD_GENS) addGen(g, 'WILD_GENS');
  // GEN_POOL_INACTIVE
  for (const g of data.GEN_POOL_INACTIVE) {
    // era 字段含 birth/death,可用于填 birthYear/deathYear
    addGen(g, 'GEN_POOL_INACTIVE');
    if (GEN_BASE[g.name] && g.era) {
      if (g.era.birth) GEN_BASE[g.name].birthYear = g.era.birth;
      if (g.era.death) GEN_BASE[g.name].deathYear = g.era.death;
    }
  }

  console.log(`[extract] GEN_BASE built: ${Object.keys(GEN_BASE).length} entries`);

  // ── 构建 CITY_BASE ──
  // immutable: q/r/name/tags/jun/size/base
  // 不进 CITY_BASE: fac/pop/troops/isCapital(scenario-specific)
  const CITY_BASE = {};
  for (const c of data.CITIES_DEF) {
    CITY_BASE[c.id] = {
      name: c.name,
      q: c.q, r: c.r,
      tags: [...(c.tags || [])],
      jun: c.jun,
      size: c.size,
      base: { ...c.base },
    };
  }
  console.log(`[extract] CITY_BASE built: ${Object.keys(CITY_BASE).length} entries`);

  // ── 构建 FACTION_BASE ──
  // immutable: name/full/color/cls
  // 不进 FACTION_BASE: ruler(scenario-specific)
  const FACTION_BASE = {};
  for (const [fid, f] of Object.entries(data.FAC)) {
    FACTION_BASE[fid] = {
      name: f.name,
      full: f.full,
      color: f.color,
      cls: f.cls,
    };
  }
  console.log(`[extract] FACTION_BASE built: ${Object.keys(FACTION_BASE).length} entries`);

  // ── 写文件 ──
  const writeData = (filePath, varName, headerComment, obj) => {
    const json = JSON.stringify(obj, null, 2);
    const content =
`// ${path.basename(filePath)}
//
${headerComment}
//
// 来源:阶段 1a.1 由 tools/extract_scenario_214.js 自动抽取自 project_romance_v181.html。
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3。

const ${varName} = ${json};
`;
    fs.writeFileSync(filePath, content);
    console.log(`[extract] wrote ${filePath} (${(content.length/1024).toFixed(1)} KB)`);
  };

  writeData(
    path.join(OUT_DIR, 'general_base.js'),
    'GEN_BASE',
    '// 武将主表(cross-scenario fix,immutable 字段)\n' +
    '// 字段:com/war/int/pol/cha/apt(战力)+ birthplace/clan/gentry/classTag/skills/values/faction_clan(史实不变)\n' +
    '// 不进 GEN_BASE 的字段(scenario-specific,留 SCENARIO_xxx.generals):title/post/loyalty/relations/role/merit/retainer\n' +
    '// birthYear/deathYear/debutYear:1a 阶段未填(仅 GEN_POOL_INACTIVE 武将含 era 数据),留阶段 6 年龄 hook 补全',
    GEN_BASE
  );

  writeData(
    path.join(OUT_DIR, 'city_base.js'),
    'CITY_BASE',
    '// 城市主表(cross-scenario fix,地理 immutable 字段)\n' +
    '// 字段:name/q/r/tags/jun/size/base(产出基数)\n' +
    '// 不进 CITY_BASE 的字段:fac/pop/troops/isCapital(留 SCENARIO_xxx.cities)\n' +
    '// 1a 阶段 45 城,阶段 1f 扩 4 城(bohai/pingyuan/zhuojun/luyang)→ 49 城',
    CITY_BASE
  );

  writeData(
    path.join(OUT_DIR, 'faction_base.js'),
    'FACTION_BASE',
    '// 势力主表(cross-scenario fix,显示 immutable 字段)\n' +
    '// 字段:name/full/color/cls\n' +
    '// 不进 FACTION_BASE 的字段:ruler/type/stage/ethos/res/...(留 SCENARIO_xxx.factions[fid])\n' +
    '// 跨 scenario 共享 entry(214 / 190 都用同样 wei/shu/wu/nanman/...);ruler 等 scenario-specific',
    FACTION_BASE
  );

  // 简要统计
  console.log('\n[extract] Summary:');
  console.log(`  GEN_BASE entries: ${Object.keys(GEN_BASE).length}`);
  console.log(`  CITY_BASE entries: ${Object.keys(CITY_BASE).length}`);
  console.log(`  FACTION_BASE entries: ${Object.keys(FACTION_BASE).length}`);

  dom.window.close();
}

main().catch(err => {
  console.error('[extract] FAIL:', err);
  process.exit(1);
});
