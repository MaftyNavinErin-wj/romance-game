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

function _cityRow(fid, cityId) {
  const def = CITY_MAP[cityId];
  const level = G.fog[fid][hkey(def.q, def.r)] ?? FOG_UNEXPLORED;
  return {
    id: cityId,
    level,
    knownFac: getKnownCityFac(fid, cityId),
    snap: G.fogSnap?.[fid]?.[cityId]?.fac || null,
  };
}

function _auditWeiCascade() {
  G.playerFac = 'wei';
  initGame('214');
  const fogAfterInit = { ...G.fog.wei };
  const afterInit = ['yizhou_n', 'bazhong', 'yiling', 'lujiang', 'chengdu', 'luocheng', 'wuchang', 'changsha']
    .map(id => _cityRow('wei', id));
  updateFog('wei');
  const fogAfterFirstUpdate = { ...G.fog.wei };
  updateFog('wei');
  const afterUpdates = ['yizhou_n', 'bazhong', 'yiling', 'lujiang', 'chengdu', 'luocheng', 'wuchang', 'changsha']
    .map(id => _cityRow('wei', id));
  const newExploredAfterFirstUpdate = Object.keys(fogAfterFirstUpdate)
    .filter(k => (fogAfterInit[k] ?? FOG_UNEXPLORED) === FOG_UNEXPLORED && fogAfterFirstUpdate[k] === FOG_EXPLORED);
  return { afterInit, afterUpdates, newExploredAfterFirstUpdate };
}

this.__fogCityAudit = {
  holes: Object.fromEntries(getPlayableFactions().map(fid => [fid, _auditFaction(fid)])),
  weiCascade: _auditWeiCascade(),
};
`, ctx);

const holeFailures = Object.entries(ctx.__fogCityAudit.holes).filter(([, rows]) => rows.length);
const requiredKnown = {
  yizhou_n: 'shu',
  bazhong: 'shu',
  yiling: 'shu',
  lujiang: 'wu',
};
const mustStayUnknown = ['chengdu', 'luocheng', 'wuchang', 'changsha'];
const afterInitById = Object.fromEntries(ctx.__fogCityAudit.weiCascade.afterInit.map(row => [row.id, row]));
const afterUpdatesById = Object.fromEntries(ctx.__fogCityAudit.weiCascade.afterUpdates.map(row => [row.id, row]));
const cascadeFailures = [];
if (ctx.__fogCityAudit.weiCascade.newExploredAfterFirstUpdate.length) {
  cascadeFailures.push(`updateFog should not add explored hexes without new vision; got ${ctx.__fogCityAudit.weiCascade.newExploredAfterFirstUpdate.length}`);
}
Object.entries(requiredKnown).forEach(([cityId, fac]) => {
  const row = afterInitById[cityId];
  if (!row || row.level !== 1 || row.knownFac !== fac || row.snap !== fac) cascadeFailures.push(`${cityId} should start explored as ${fac}`);
});
mustStayUnknown.forEach(cityId => {
  const initRow = afterInitById[cityId];
  const updateRow = afterUpdatesById[cityId];
  if (!initRow || initRow.level !== 0 || initRow.knownFac !== 'none' || initRow.snap !== null) {
    cascadeFailures.push(`${cityId} should start unexplored`);
  }
  if (!updateRow || updateRow.level !== 0 || updateRow.knownFac !== 'none' || updateRow.snap !== null) {
    cascadeFailures.push(`${cityId} should stay unexplored after repeated updateFog`);
  }
});

console.log('# Fog City Runtime Audit');
console.log('');
if (!holeFailures.length && !cascadeFailures.length) {
  console.log('PASS: no city-center fog holes inside explored city areas.');
  console.log('PASS: repeated Wei fog updates do not cascade-discover southern Shu/Wu cities.');
  process.exit(0);
}

if (holeFailures.length) {
  console.log('FAIL: city-center fog holes found.');
  holeFailures.forEach(([fid, rows]) => {
    console.log(`\n${fid}:`);
    rows.forEach(row => {
      console.log(`- ${row.id}: level=${row.level}, exploredNeighbors=${row.exploredNeighbors}, knownFac=${row.knownFac}, fac=${row.fac}`);
    });
  });
}
if (cascadeFailures.length) {
  console.log('FAIL: fog city-intel cascade regression found.');
  cascadeFailures.forEach(msg => console.log(`- ${msg}`));
}
process.exit(1);
