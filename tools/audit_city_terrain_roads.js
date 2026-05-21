const fs = require('fs');
const vm = require('vm');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function run(src, suffix = '') {
  vm.runInContext(src + suffix, box, { timeout: 1000 });
}

const box = { console: { warn() {}, log() {}, error() {} } };
vm.createContext(box);

run(read('src/data/city_base.js'), '\nthis.CITY_BASE = CITY_BASE;');
run(read('src/data/cities.js'), '\nthis.ROADS = ROADS; this.ROAD_ADJ = ROAD_ADJ; this.RIVERS = RIVERS;');
box.GEN_TAGS = {};
run(read('src/data/state_county.js'), '\nthis.STATE_CITIES = STATE_CITIES; this.CITY_TO_STATE = CITY_TO_STATE; this.COUNTY_DATA = COUNTY_DATA;');
run(read('src/data/scenarios/190.js'), '\nthis.SCENARIO_190 = SCENARIO_190;');
run(read('src/data/scenarios/214.js'), '\nthis.SCENARIO_214 = SCENARIO_214;');

const mapSrc = read('src/core/map.js');
const terrainMatch = mapSrc.match(/const TERRAIN_POLYS = \[([\s\S]*?)\];/);
if (!terrainMatch) throw new Error('TERRAIN_POLYS not found');
run('this.TERRAIN_POLYS = [' + terrainMatch[1] + '];');

const HEX_SIZE = 6;
const HEX_H = Math.sqrt(3) * HEX_SIZE;
const HEX_COLS = 102;
const HEX_ROWS = 68;
const TERRAIN_PRIO = { water: 6, impassable: 5, mountain: 4, forest: 3, hill: 2, plain: 1, swamp: 2, deep_water: 7, coastal_water: 7 };
const BLOCKED_T = new Set(['impassable', 'coastal_water', 'deep_water']);
const WATER_T = new Set(['water', 'river']);

function hexToPixel(col, row) {
  return {
    x: col * HEX_SIZE * 1.5 + HEX_SIZE + 8,
    y: row * HEX_H + (col % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + 4,
  };
}

function hkey(col, row) {
  return `${col},${row}`;
}

function hparse(k) {
  const [col, row] = k.split(',').map(Number);
  return { col, row };
}

function hexNeighbors(col, row) {
  const parity = col & 1;
  const dirs = parity
    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]]
    : [[-1, -1], [1, -1], [0, -1], [0, 1], [-1, 0], [1, 0]];
  return dirs
    .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
    .filter(h => h.col >= 0 && h.col < HEX_COLS && h.row >= 0 && h.row < HEX_ROWS);
}

function toCube(col, row) {
  const x = col;
  const z = row - (col - (col & 1)) / 2;
  return [x, -x - z, z];
}

function hexDist(c1, r1, c2, r2) {
  const [x1, y1, z1] = toCube(c1, r1);
  const [x2, y2, z2] = toCube(c2, r2);
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
}

function pixelToHex(px, py) {
  const approxCol = Math.round((px - 8 - HEX_SIZE) / (HEX_SIZE * 1.5));
  const approxRow = Math.round((py - 4 - HEX_H / 2) / HEX_H);
  let bestC = 0, bestR = 0, bestD = Infinity;
  for (let dc = -3; dc <= 3; dc++) {
    for (let dr = -3; dr <= 3; dr++) {
      const cc = approxCol + dc, rr = approxRow + dr;
      if (cc < 0 || cc >= HEX_COLS || rr < 0 || rr >= HEX_ROWS) continue;
      const p = hexToPixel(cc, rr);
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < bestD) { bestD = d; bestC = cc; bestR = rr; }
    }
  }
  return { col: bestC, row: bestR };
}

function pointInPoly(px, py, pts) {
  const coords = pts.split(' ').map(p => p.split(',').map(Number));
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i], [xj, yj] = coords[j];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function hexLineDraw(c1, r1, c2, r2) {
  const n = hexDist(c1, r1, c2, r2);
  if (n === 0) return [{ col: c1, row: r1 }];
  function fromCube(x, y, z) {
    const col = Math.round(x);
    const row = Math.round(z + (col - (col & 1)) / 2);
    return { col, row };
  }
  function cubeRound(x, y, z) {
    let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    return [rx, ry, rz];
  }
  const a = toCube(c1, r1), b = toCube(c2, r2);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [rx, ry, rz] = cubeRound(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    );
    out.push(fromCube(rx, ry, rz));
  }
  return out;
}

function terrainAtPixel(x, y) {
  let terrain = 'plain';
  let bestPrio = 0;
  for (const poly of box.TERRAIN_POLYS) {
    const prio = TERRAIN_PRIO[poly.type] || 0;
    if (prio > bestPrio && pointInPoly(x, y, poly.pts)) {
      terrain = poly.type;
      bestPrio = prio;
    }
  }
  return terrain;
}

function pathPoints(pathStr) {
  const pts = [];
  const re = /([MQLC])\s*([\d.,\s]+)/gi;
  let match;
  while ((match = re.exec(pathStr)) !== null) {
    const nums = match[2].trim().split(/[\s,]+/).map(Number);
    for (let i = 0; i < nums.length - 1; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  }
  return pts;
}

function polyPoints(pts) {
  return pts.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });
}

function distToSegment(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2)) : 0;
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  return Math.hypot(px - x, py - y);
}

function distToPolyline(px, py, pts) {
  if (pts.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, distToSegment(px, py, pts[i], pts[i + 1]));
  return best;
}

function distToPoly(px, py, ptsString) {
  if (pointInPoly(px, py, ptsString)) return 0;
  const pts = polyPoints(ptsString);
  let best = Infinity;
  for (let i = 0; i < pts.length; i++) best = Math.min(best, distToSegment(px, py, pts[i], pts[(i + 1) % pts.length]));
  return best;
}

const riverPointSets = box.RIVERS.map(pathPoints);
const waterPolys = box.TERRAIN_POLYS.filter(poly => ['water', 'coastal_water', 'deep_water'].includes(poly.type));
function nearestWaterDist(px, py) {
  let best = Infinity;
  for (const pts of riverPointSets) best = Math.min(best, distToPolyline(px, py, pts));
  for (const poly of waterPolys) best = Math.min(best, distToPoly(px, py, poly.pts));
  return best;
}

function buildTerrain() {
  const terrain = {};
  const road = {};
  const city = {};
  for (let col = 0; col < HEX_COLS; col++) {
    for (let row = 0; row < HEX_ROWS; row++) {
      const p = hexToPixel(col, row);
      terrain[hkey(col, row)] = terrainAtPixel(p.x, p.y);
    }
  }
  for (const pathStr of box.RIVERS) {
    const pts = [];
    const re = /([MQLC])\s*([\d.,\s]+)/gi;
    let match;
    while ((match = re.exec(pathStr)) !== null) {
      const nums = match[2].trim().split(/[\s,]+/).map(Number);
      for (let i = 0; i < nums.length - 1; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3);
      for (let s = 0; s <= steps; s++) {
        const t = s / Math.max(steps, 1);
        const h = pixelToHex(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        const k = hkey(h.col, h.row);
        const cur = terrain[k];
        if (!['water', 'deep_water', 'coastal_water', 'impassable'].includes(cur)) terrain[k] = 'river';
      }
    }
  }
  for (const c of Object.entries(box.CITY_BASE).map(([id, c]) => ({ id, ...c }))) {
    city[hkey(c.q, c.r)] = c.id;
    terrain[hkey(c.q, c.r)] = 'plain';
    for (const nb of hexNeighbors(c.q, c.r)) {
      const nk = hkey(nb.col, nb.row);
      if (terrain[nk] === 'impassable') terrain[nk] = 'mountain';
      if (!['water', 'deep_water', 'coastal_water'].includes(terrain[nk])) road[nk] = true;
    }
  }
  for (const [aid, bid] of box.ROADS) {
    const a = box.CITY_BASE[aid], b = box.CITY_BASE[bid];
    if (!a || !b) continue;
    for (const { col, row } of hexLineDraw(a.q, a.r, b.q, b.r)) {
      const k = hkey(col, row);
      if (terrain[k] === 'impassable') terrain[k] = 'mountain';
      if (!['water', 'deep_water', 'coastal_water'].includes(terrain[k])) road[k] = true;
    }
  }
  return { terrain, road, city };
}

function listDiff(left, right) {
  const r = new Set(right);
  return left.filter(x => !r.has(x));
}

function uniqueIssues(items) {
  return [...new Set(items)].sort();
}

const cityIds = Object.keys(box.CITY_BASE).sort();
const citySet = new Set(cityIds);
const terrainBuilt = buildTerrain();

const roadUnknown = [];
const roadSelf = [];
const roadDupes = [];
const edgeSeen = new Set();
for (const [a, b] of box.ROADS) {
  if (!citySet.has(a)) roadUnknown.push(`${a}-${b}: missing ${a}`);
  if (!citySet.has(b)) roadUnknown.push(`${a}-${b}: missing ${b}`);
  if (a === b) roadSelf.push(`${a}-${b}`);
  const key = [a, b].sort().join('|');
  if (edgeSeen.has(key)) roadDupes.push(`${a}-${b}`);
  edgeSeen.add(key);
}

const roadAdjIssues = [];
for (const [a, b] of box.ROADS) {
  if (!(box.ROAD_ADJ[a] || []).includes(b)) roadAdjIssues.push(`${a} missing ${b}`);
  if (!(box.ROAD_ADJ[b] || []).includes(a)) roadAdjIssues.push(`${b} missing ${a}`);
}
for (const [a, ns] of Object.entries(box.ROAD_ADJ)) {
  if (!citySet.has(a)) roadAdjIssues.push(`unknown ROAD_ADJ key ${a}`);
  for (const b of ns) {
    if (!citySet.has(b)) roadAdjIssues.push(`${a} -> unknown ${b}`);
    if (!(box.ROAD_ADJ[b] || []).includes(a)) roadAdjIssues.push(`${a} -> ${b} is not mirrored`);
  }
}

const roadGraphSeen = new Set();
const roadComponents = [];
for (const start of cityIds) {
  if (roadGraphSeen.has(start)) continue;
  const comp = [];
  const q = [start];
  roadGraphSeen.add(start);
  for (let i = 0; i < q.length; i++) {
    const cur = q[i];
    comp.push(cur);
    for (const nb of box.ROAD_ADJ[cur] || []) {
      if (!roadGraphSeen.has(nb)) {
        roadGraphSeen.add(nb);
        q.push(nb);
      }
    }
  }
  roadComponents.push(comp.sort());
}
roadComponents.sort((a, b) => b.length - a.length);

const degreeRows = cityIds.map(id => ({ id, deg: (box.ROAD_ADJ[id] || []).length }));
const lowDegree = degreeRows.filter(r => r.deg <= 1);
const highDegree = degreeRows.filter(r => r.deg >= 6);

const roadTerrainRows = [];
for (const [aId, bId] of box.ROADS) {
  const a = box.CITY_BASE[aId], b = box.CITY_BASE[bId];
  if (!a || !b) continue;
  const counts = {};
  let blockedAfter = 0;
  let missingRoad = 0;
  const line = hexLineDraw(a.q, a.r, b.q, b.r);
  for (const h of line) {
    const k = hkey(h.col, h.row);
    const t = terrainBuilt.terrain[k] || 'plain';
    counts[t] = (counts[t] || 0) + 1;
    if (BLOCKED_T.has(t)) blockedAfter++;
    if (!terrainBuilt.road[k]) missingRoad++;
  }
  const pa = hexToPixel(a.q, a.r), pb = hexToPixel(b.q, b.r);
  roadTerrainRows.push({
    road: `${aId}-${bId}`,
    hex: line.length,
    dist: Math.hypot(pb.x - pa.x, pb.y - pa.y),
    blockedAfter,
    missingRoad,
    waterLike: (counts.water || 0) + (counts.river || 0) + (counts.coastal_water || 0) + (counts.deep_water || 0),
    counts,
  });
}
const blockedRoads = roadTerrainRows.filter(r => r.blockedAfter || r.missingRoad);
const riverRoads = roadTerrainRows.filter(r => r.waterLike > 0).sort((a, b) => b.waterLike - a.waterLike || b.dist - a.dist);
const longestRoads = [...roadTerrainRows].sort((a, b) => b.dist - a.dist).slice(0, 10);

function cityPixel(id) {
  const c = box.CITY_BASE[id];
  return hexToPixel(c.q, c.r);
}

function cityPixelDist(aId, bId) {
  const a = cityPixel(aId);
  const b = cityPixel(bId);
  return Math.hypot(b.x - a.x, b.y - a.y);
}

const citySpacingRows = cityIds.map(id => {
  const c = box.CITY_BASE[id];
  let best = null;
  for (const other of cityIds) {
    if (other === id) continue;
    const o = box.CITY_BASE[other];
    const px = cityPixelDist(id, other);
    const hd = hexDist(c.q, c.r, o.q, o.r);
    if (!best || px < best.px) best = { id: other, px, hex: hd };
  }
  return { id, nearest: best.id, px: best.px, hex: best.hex };
}).sort((a, b) => b.px - a.px);

function nearestCityToPixel(px, py) {
  let best = null;
  for (const id of cityIds) {
    const p = cityPixel(id);
    const dist = Math.hypot(p.x - px, p.y - py);
    if (!best || dist < best.dist) best = { id, dist };
  }
  return best;
}

const sparseCandidates = [];
for (let col = 0; col < HEX_COLS; col++) {
  for (let row = 0; row < HEX_ROWS; row++) {
    const k = hkey(col, row);
    const terrain = terrainBuilt.terrain[k] || 'plain';
    if (BLOCKED_T.has(terrain) || WATER_T.has(terrain)) continue;
    const p = hexToPixel(col, row);
    if (p.x < 70 || p.x > 890 || p.y < 60 || p.y > 680) continue;
    const near = nearestCityToPixel(p.x, p.y);
    sparseCandidates.push({ col, row, x: p.x, y: p.y, terrain, nearest: near.id, dist: near.dist });
  }
}
sparseCandidates.sort((a, b) => b.dist - a.dist);
const sparsePassableHexes = [];
for (const candidate of sparseCandidates) {
  if (sparsePassableHexes.every(prev => Math.hypot(prev.x - candidate.x, prev.y - candidate.y) >= 45)) {
    sparsePassableHexes.push(candidate);
    if (sparsePassableHexes.length >= 12) break;
  }
}

const roadWeightedAdj = {};
for (const id of cityIds) roadWeightedAdj[id] = [];
for (const [a, b] of box.ROADS) {
  if (!citySet.has(a) || !citySet.has(b)) continue;
  const w = cityPixelDist(a, b);
  roadWeightedAdj[a].push({ id: b, w });
  roadWeightedAdj[b].push({ id: a, w });
}

function shortestRoadDistance(start) {
  const dist = Object.fromEntries(cityIds.map(id => [id, Infinity]));
  const used = new Set();
  dist[start] = 0;
  for (let step = 0; step < cityIds.length; step++) {
    let cur = null;
    for (const id of cityIds) {
      if (!used.has(id) && (cur === null || dist[id] < dist[cur])) cur = id;
    }
    if (cur === null || dist[cur] === Infinity) break;
    used.add(cur);
    for (const edge of roadWeightedAdj[cur] || []) {
      const next = dist[cur] + edge.w;
      if (next < dist[edge.id]) dist[edge.id] = next;
    }
  }
  return dist;
}

const roadDetourRows = [];
for (const a of cityIds) {
  const dist = shortestRoadDistance(a);
  for (const b of cityIds) {
    if (a >= b || !Number.isFinite(dist[b])) continue;
    const straight = cityPixelDist(a, b);
    if (straight < 90) continue;
    roadDetourRows.push({ pair: `${a}-${b}`, straight, road: dist[b], ratio: dist[b] / straight });
  }
}
roadDetourRows.sort((a, b) => b.ratio - a.ratio || b.road - a.road);
const roadDetourPrompts = roadDetourRows.filter(r => r.ratio >= 2.4).slice(0, 12);
const distributionIssues = [];
if (citySpacingRows[0]?.px > 150) distributionIssues.push(`widest nearest-city spacing ${citySpacingRows[0].id}=${citySpacingRows[0].px.toFixed(0)}px`);
if (sparsePassableHexes[0]?.dist > 160) distributionIssues.push(`largest passable sparse hex q${sparsePassableHexes[0].col},r${sparsePassableHexes[0].row}=${sparsePassableHexes[0].dist.toFixed(0)}px from ${sparsePassableHexes[0].nearest}`);
if (roadDetourPrompts.length) distributionIssues.push(`road detour prompts ${roadDetourPrompts.length}`);

const cityTerrainRows = cityIds.map(id => {
  const c = box.CITY_BASE[id];
  const p = hexToPixel(c.q, c.r);
  const natural = terrainAtPixel(p.x, p.y);
  const final = terrainBuilt.terrain[hkey(c.q, c.r)];
  const waterDist = nearestWaterDist(p.x, p.y);
  const around = {};
  for (let dq = -3; dq <= 3; dq++) {
    for (let dr = -3; dr <= 3; dr++) {
      const t = terrainBuilt.terrain[hkey(c.q + dq, c.r + dr)] || 'plain';
      around[t] = (around[t] || 0) + 1;
    }
  }
  return { id, name: c.name, q: c.q, r: c.r, tags: c.tags || [], natural, final, waterDist, around };
});
const naturallyBlockedCities = cityTerrainRows.filter(c => ['water', 'impassable', 'coastal_water', 'deep_water'].includes(c.natural));

const tagIssues = [];
for (const c of cityTerrainRows) {
  const tags = new Set(c.tags);
  const rough = (c.around.mountain || 0) + (c.around.hill || 0) + (c.around.impassable || 0);
  const water = (c.around.water || 0) + (c.around.river || 0);
  if (tags.has('山地') && rough < 4) tagIssues.push(`${c.id}: 山地 tag but rough neighborhood ${rough}/49`);
  if ((tags.has('水乡') || tags.has('港口')) && water < 2 && c.waterDist > 90) {
    tagIssues.push(`${c.id}: water/port tag but nearest water/river is ${c.waterDist.toFixed(0)}px away`);
  }
  if (tags.has('平原') && rough > 32) tagIssues.push(`${c.id}: 平原 tag but rough neighborhood ${rough}/49`);
}

const stateCities = Object.values(box.STATE_CITIES).flat();
const stateDupes = stateCities.filter((id, idx) => stateCities.indexOf(id) !== idx);
const stateUnknown = listDiff(stateCities, cityIds);
const stateMissing = listDiff(cityIds, stateCities);
const cityToStateIssues = [];
for (const id of cityIds) {
  if (!box.CITY_TO_STATE[id]) cityToStateIssues.push(`${id}: missing CITY_TO_STATE`);
}
for (const [id, st] of Object.entries(box.CITY_TO_STATE)) {
  if (!citySet.has(id)) cityToStateIssues.push(`${id}: CITY_TO_STATE unknown city`);
  if (!(box.STATE_CITIES[st] || []).includes(id)) cityToStateIssues.push(`${id}: CITY_TO_STATE=${st} not mirrored in STATE_CITIES`);
}

const countyIds = Object.keys(box.COUNTY_DATA).sort();
const countyUnknown = listDiff(countyIds, cityIds);
const countyMissing = listDiff(cityIds, countyIds);

function scenarioAudit(sc, label) {
  const scCityIds = Object.keys(sc.cities || {}).sort();
  const unknown = listDiff(scCityIds, cityIds);
  const missing = listDiff(cityIds, scCityIds);
  const facs = new Set(Object.keys(sc.factions || {}));
  const badFac = scCityIds.filter(id => !facs.has(sc.cities[id].fac) && sc.cities[id].fac !== 'none')
    .map(id => `${id}:${sc.cities[id].fac}`);
  const capitals = {};
  for (const [id, c] of Object.entries(sc.cities || {})) {
    if (c.isCapital) {
      if (!capitals[c.fac]) capitals[c.fac] = [];
      capitals[c.fac].push(id);
    }
  }
  const capitalIssues = [];
  const capitalNotes = [];
  for (const fid of facs) {
    const owned = scCityIds.filter(id => sc.cities[id].fac === fid);
    const caps = capitals[fid] || [];
    const f = sc.factions[fid] || {};
    const allowZero = f.stage === 'nomad' || f.stage === 'shadow'
      || f._baseType === 'nomad' || f._baseType === 'tribal' || f.type === 'tribal';
    if (owned.length && caps.length > 1) capitalIssues.push(`${fid}: owned=${owned.length}, capitals=${caps.join(',')}`);
    else if (owned.length && caps.length === 0 && !allowZero) capitalIssues.push(`${fid}: owned=${owned.length}, capitals=none`);
    else if (owned.length && caps.length === 0 && allowZero) capitalNotes.push(`${fid}: owned=${owned.length}, capitals=none allowed by tribal/nomad rule`);
  }
  const initialUnitIssues = [];
  for (const u of sc.initialUnits || []) {
    if (!citySet.has(u.city)) initialUnitIssues.push(`${u.fac}: initial unit unknown city ${u.city}`);
    else if (!facs.has(u.fac)) initialUnitIssues.push(`${u.fac}: initial unit unknown fac at ${u.city}`);
    else if (sc.cities[u.city]?.fac !== u.fac) initialUnitIssues.push(`${u.fac}: initial unit at ${u.city}, city fac=${sc.cities[u.city]?.fac}`);
  }
  return { label, unknown, missing, badFac, capitalIssues, capitalNotes, initialUnitIssues };
}

const scenarios = [
  scenarioAudit(box.SCENARIO_190, '190'),
  scenarioAudit(box.SCENARIO_214, '214'),
];

function section(lines, title, rows, render = x => `- ${x}`) {
  lines.push(`## ${title}`);
  if (!rows.length) lines.push('- PASS');
  else rows.forEach(r => lines.push(render(r)));
  lines.push('');
}

const lines = [];
lines.push('# City / Terrain / Road Audit');
lines.push('');
lines.push('Scope: CITY_BASE, ROADS/ROAD_ADJ, final hex terrain, STATE_CITIES/CITY_TO_STATE, COUNTY_DATA, SCENARIO_190, SCENARIO_214.');
lines.push('');
lines.push(`Cities: ${cityIds.length}`);
lines.push(`Road edges: ${box.ROADS.length}`);
lines.push(`Road components: ${roadComponents.map(c => c.length).join(' + ')}`);
lines.push('');
lines.push('Verdict rules: reference/coverage/connectivity/blockage sections are hard checks; terrain tag heuristics and water-touching roads are audit prompts, not automatic defects.');
lines.push('');
section(lines, 'Road Reference Integrity', [
  ...uniqueIssues(roadUnknown),
  ...uniqueIssues(roadSelf).map(x => `self-loop ${x}`),
  ...uniqueIssues(roadDupes).map(x => `duplicate ${x}`),
  ...uniqueIssues(roadAdjIssues).map(x => `ROAD_ADJ ${x}`),
]);
section(lines, 'Road Graph Connectivity', roadComponents.length === 1 ? [] : roadComponents, c => `- component(${c.length}): ${c.join(', ')}`);
section(lines, 'Low Degree Cities', lowDegree, r => `- ${r.id}: degree=${r.deg}`);
section(lines, 'High Degree Cities', highDegree, r => `- ${r.id}: degree=${r.deg}`);
section(lines, 'Blocked / Broken Final Road Hexes', blockedRoads, r => `- ${r.road}: blockedAfter=${r.blockedAfter}, missingRoad=${r.missingRoad}, terrain=${JSON.stringify(r.counts)}`);
section(lines, 'Roads Touching River/Water Hexes', riverRoads.slice(0, 30), r => `- ${r.road}: waterLike=${r.waterLike}, hex=${r.hex}, terrain=${JSON.stringify(r.counts)}`);
section(lines, 'Longest Roads', longestRoads, r => `- ${r.road}: dist=${r.dist.toFixed(0)}, hex=${r.hex}, terrain=${JSON.stringify(r.counts)}`);
section(lines, 'Distribution Hard Checks', distributionIssues);
section(lines, 'Widest City Spacing', citySpacingRows.slice(0, 12), r => `- ${r.id}: nearest=${r.nearest}, dist=${r.px.toFixed(0)}px, hex=${r.hex}`);
section(lines, 'Sparse Passable Hex Prompts', sparsePassableHexes, r => `- q${r.col},r${r.row}: nearest=${r.nearest}, dist=${r.dist.toFixed(0)}px, terrain=${r.terrain}`);
section(lines, 'Road Network Detour Prompts', roadDetourPrompts, r => `- ${r.pair}: road=${r.road.toFixed(0)}px, straight=${r.straight.toFixed(0)}px, ratio=${r.ratio.toFixed(2)}`);
section(lines, 'Naturally Blocked City Centers Before City Override', naturallyBlockedCities, c => `- ${c.id}: natural=${c.natural}, final=${c.final}, q${c.q},r${c.r}`);
section(lines, 'Terrain Tag Heuristics', tagIssues);
section(lines, 'State Coverage', [
  ...uniqueIssues(stateUnknown).map(x => `STATE_CITIES unknown ${x}`),
  ...uniqueIssues(stateMissing).map(x => `STATE_CITIES missing ${x}`),
  ...uniqueIssues(stateDupes).map(x => `STATE_CITIES duplicate ${x}`),
  ...uniqueIssues(cityToStateIssues).map(x => `CITY_TO_STATE ${x}`),
]);
section(lines, 'County Coverage', [
  ...uniqueIssues(countyUnknown).map(x => `COUNTY_DATA unknown ${x}`),
  ...uniqueIssues(countyMissing).map(x => `COUNTY_DATA missing ${x}`),
]);
for (const sc of scenarios) {
  section(lines, `Scenario ${sc.label} City Coverage`, [
    ...sc.unknown.map(x => `unknown city ${x}`),
    ...sc.missing.map(x => `missing city ${x}`),
    ...sc.badFac.map(x => `bad fac ${x}`),
    ...sc.capitalIssues.map(x => `capital issue ${x}`),
    ...sc.initialUnitIssues.map(x => `initial unit issue ${x}`),
  ]);
  section(lines, `Scenario ${sc.label} Capital Notes`, sc.capitalNotes || []);
}

fs.mkdirSync('docs/audit_walkthroughs', { recursive: true });
fs.writeFileSync('docs/audit_walkthroughs/city_terrain_road_audit.md', lines.join('\n'));
console.log(lines.join('\n'));
