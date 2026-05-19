'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadConst(filePath, varName) {
  const src = fs.readFileSync(filePath, 'utf8');
  return (new Function(src + `\n; return ${varName};`))();
}

function unique(values) {
  return Array.from(new Set(values));
}

function loadEffectiveScenario(scenarioId) {
  const files = [
    'src/data/factions.js',
    'src/data/generals.js',
    'src/data/city_base.js',
    'src/data/cities.js',
    'src/data/faction_base.js',
    'src/data/general_base.js',
    'src/data/scenarios/214.js',
    'src/data/scenarios/190.js',
    'src/data/scenarios/index.js',
    'src/core/state.js',
    'src/core/scenario_loader.js',
  ];
  const source = files.map(file => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
  return (new Function(source + `
    applyScenario('${scenarioId}');
    const scenario = SCENARIOS['${scenarioId}'];
    const effectiveMeta = {};
    for (const name of Object.keys(scenario.generals)) effectiveMeta[name] = getGenMeta(name);
    return { scenario, scenario214: SCENARIO_214, GEN_TAGS, effectiveMeta, GEN_CLASS };
  `))();
}

function summarizeMissing(names, table) {
  return names.filter(name => !table[name] || Object.keys(table[name]).length === 0);
}

function statusCounts(scenario) {
  const counts = {};
  for (const g of Object.values(scenario.generals)) counts[g.status] = (counts[g.status] || 0) + 1;
  return counts;
}

function formatList(names, limit) {
  if (names.length === 0) return '(none)';
  const head = names.slice(0, limit).join(' / ');
  return names.length > limit ? `${head} / ... (+${names.length - limit} more)` : head;
}

function auditScenario(scenarioId, listLimit) {
  const { scenario, scenario214, GEN_TAGS, effectiveMeta, GEN_CLASS } = loadEffectiveScenario(scenarioId);
  const names = Object.keys(scenario.generals);
  const active = names.filter(name => scenario.generals[name].status === 'active');
  const rulers = Object.values(scenario.factions).map(f => f.ruler);
  const foundingCore = unique(Object.values(scenario.factions).flatMap(f => f.foundingCore || []));
  const priority = unique([...rulers, ...foundingCore]);

  const checks = [
    { key: 'GEN_TAGS', table: GEN_TAGS },
    { key: 'effectiveMeta', table: effectiveMeta },
    { key: 'GEN_CLASS', table: GEN_CLASS },
  ].map(check => {
    const missing = summarizeMissing(names, check.table);
    return {
      key: check.key,
      missing,
      activeMissing: active.filter(name => missing.includes(name)),
      rulerMissing: rulers.filter(name => missing.includes(name)),
      priorityMissing: priority.filter(name => missing.includes(name)),
    };
  });

  console.log(`[scenario-meta:${scenarioId}] roster=` + names.length + ' status=' + JSON.stringify(statusCounts(scenario)));
  console.log(`[scenario-meta:${scenarioId}] priority=` + priority.length + ' (rulers + foundingCore)');
  for (const c of checks) {
    console.log(
      `[scenario-meta:${scenarioId}] ${c.key}: missing=${c.missing.length}` +
      ` active=${c.activeMissing.length}` +
      ` rulers=${c.rulerMissing.length}` +
      ` priority=${c.priorityMissing.length}`
    );
    console.log(`  ${c.key} missing: ${formatList(c.missing, listLimit)}`);
  }

  const titleMismatches = names.filter(name => {
    const sc214Gen = scenario214.generals[name];
    const sharedTitle = sc214Gen && (sc214Gen.title || (sc214Gen.wildData && sc214Gen.wildData.title));
    return sharedTitle && effectiveMeta[name] && effectiveMeta[name].title !== sharedTitle;
  });
  console.log(`[scenario-meta:${scenarioId}] shared titles: mismatches=${titleMismatches.length}`);
  console.log(`  title mismatches: ${formatList(titleMismatches, listLimit)}`);

  const totalMissing = checks.reduce((n, c) => n + c.missing.length, 0);
  return { totalMissing, titleMismatches: titleMismatches.length };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const strict = args.has('--fail-on-missing');
  const listLimitArg = process.argv.find(a => a.startsWith('--limit='));
  const listLimit = listLimitArg ? Number(listLimitArg.slice('--limit='.length)) : 30;

  const scenarioIds = ['190', '214'];
  const results = scenarioIds.map(id => auditScenario(id, listLimit));
  const totalMissing = results.reduce((n, r) => n + r.totalMissing, 0);
  const totalTitleMismatches = results.reduce((n, r) => n + r.titleMismatches, 0);
  if (strict && (totalMissing > 0 || totalTitleMismatches > 0)) {
    console.error(`[scenario-meta] FAIL: ${totalMissing} metadata gaps remain, ${totalTitleMismatches} shared title mismatches`);
    process.exit(1);
  }
  console.log(strict ? '[scenario-meta] PASS: no missing metadata' : '[scenario-meta] PASS: audit complete');
}

if (require.main === module) main();
