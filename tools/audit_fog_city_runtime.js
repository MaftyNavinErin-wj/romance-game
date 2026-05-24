const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('project_romance_v181.html', 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]);

const ctx = {
  console,
  setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
  performance: { now: () => 0 },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      style: {},
      appendChild() {},
      remove() {},
      setAttribute() {},
      classList: { add() {}, remove() {} },
    }),
    body: { appendChild() {}, classList: { add() {}, remove() {} } },
    addEventListener() {},
  },
  window: null,
};
ctx.window = ctx;
vm.createContext(ctx);

for (const script of scripts) {
  if (script.startsWith('src/dev/')) continue;
  vm.runInContext(fs.readFileSync(script, 'utf8'), ctx, { filename: script });
}

vm.runInContext(`
renderAll = function(){};
showTutorial = function(){};
log = function(){};

function _auditNeighborLevel(fid, nb) {
  const q = Array.isArray(nb) ? nb[0] : (nb.q ?? nb.col);
  const r = Array.isArray(nb) ? nb[1] : (nb.r ?? nb.row);
  return G.fog[fid][hkey(q, r)] ?? FOG_UNEXPLORED;
}

function _auditFaction(fid) {
  G.playerFac = fid;
  initGame('214');
  return CITIES_DEF.map(def => {
    const city = G.cities[def.id];
    const centerKey = hkey(def.q, def.r);
    const level = G.fog[fid][centerKey] ?? FOG_UNEXPLORED;
    const neighborLevels = hexNeighbors(def.q, def.r).map(nb => _auditNeighborLevel(fid, nb));
    const exploredNeighbors = neighborLevels.filter(v => v >= FOG_EXPLORED).length;
    return {
      id: def.id,
      fac: city?.fac || 'none',
      level,
      exploredNeighbors,
      knownFac: getKnownCityFac(fid, def.id),
    };
  }).filter(row => row.level === FOG_UNEXPLORED && row.exploredNeighbors >= 3);
}

this.__fogCityAudit = Object.fromEntries(getPlayableFactions().map(fid => [fid, _auditFaction(fid)]));
`, ctx);

const failures = Object.entries(ctx.__fogCityAudit).filter(([, rows]) => rows.length);

console.log('# Fog City Runtime Audit');
console.log('');
if (!failures.length) {
  console.log('PASS: no city-center fog holes inside explored city areas.');
  process.exit(0);
}

console.log('FAIL: city-center fog holes found.');
failures.forEach(([fid, rows]) => {
  console.log(`\n${fid}:`);
  rows.forEach(row => {
    console.log(`- ${row.id}: level=${row.level}, exploredNeighbors=${row.exploredNeighbors}, knownFac=${row.knownFac}, fac=${row.fac}`);
  });
});
process.exit(1);
