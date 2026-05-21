const fs = require('fs');
const vm = require('vm');

const citySrc = fs.readFileSync('src/data/city_base.js', 'utf8');
const citiesSrc = fs.readFileSync('src/data/cities.js', 'utf8');
const mapSrc = fs.readFileSync('src/core/map.js', 'utf8');

const box = {};
vm.createContext(box);
vm.runInContext(citySrc + '\nthis.CITY_BASE = CITY_BASE;', box);
vm.runInContext(citiesSrc + '\nthis.ROADS = ROADS; this.RIVERS = RIVERS; this.ROAD_WAYPOINTS = ROAD_WAYPOINTS;', box);
const start = mapSrc.indexOf('const TERRAIN_POLYS = [') + 'const TERRAIN_POLYS = ['.length;
const end = mapSrc.indexOf('];', start);
vm.runInContext('this.TERRAIN_POLYS = [' + mapSrc.slice(start, end) + '];', box);

const HEX_SIZE = 6;
const HEX_H = Math.sqrt(3) * HEX_SIZE;
const TERRAIN_PRIO = { water:6, impassable:5, mountain:4, forest:3, hill:2, plain:1, swamp:2 };
const BLOCKED = new Set(['water', 'impassable']);

function hexToPixel(q, r) {
  return {
    x: q * HEX_SIZE * 1.5 + HEX_SIZE + 8,
    y: r * HEX_H + (q % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + 4,
  };
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

function terrainAt(x, y) {
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

const cities = Object.entries(box.CITY_BASE).map(([id, c]) => {
  const p = hexToPixel(c.q, c.r);
  return { id, name: c.name, q: c.q, r: c.r, x: p.x, y: p.y, terrain: terrainAt(p.x, p.y) };
});
const cityById = Object.fromEntries(cities.map(c => [c.id, c]));

function roadKey(aid, bid) {
  return [aid, bid].sort().join('-');
}

function roadPixelPoints(aId, bId) {
  const a = cityById[aId], b = cityById[bId];
  if (!a || !b) return [];
  const waypoints = (box.ROAD_WAYPOINTS && box.ROAD_WAYPOINTS[roadKey(aId, bId)] || [])
    .map(([q, r]) => {
      const p = hexToPixel(q, r);
      return { x: p.x, y: p.y };
    });
  return [{ x: a.x, y: a.y }, ...waypoints, { x: b.x, y: b.y }];
}

const blockedCities = cities.filter(c => BLOCKED.has(c.terrain));
const hardRoadIssues = [];
const mountainPassRoads = [];
const longRoads = [];
for (const [aId, bId] of box.ROADS) {
  const a = cityById[aId], b = cityById[bId];
  if (!a || !b) continue;
  const pts = roadPixelPoints(aId, bId);
  const dist = pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
  const counts = {};
  for (let j = 0; j < pts.length - 1; j++) {
    const pa = pts[j], pb = pts[j + 1];
    const segDist = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    const samples = Math.max(1, Math.ceil(segDist / 6));
    for (let i = 1; i < samples; i++) {
      const t = i / samples;
      const terrain = terrainAt(pa.x + (pb.x - pa.x) * t, pa.y + (pb.y - pa.y) * t);
      counts[terrain] = (counts[terrain] || 0) + 1;
    }
  }
  const water = counts.water || 0;
  const impassable = counts.impassable || 0;
  const issue = { road: `${aId}-${bId}`, dist, water, impassable, counts };
  if (water > 0) hardRoadIssues.push(issue);
  if (water === 0 && impassable > 0) mountainPassRoads.push(issue);
  if (dist > 230) longRoads.push(issue);
}
hardRoadIssues.sort((a, b) => b.water - a.water || b.dist - a.dist);
mountainPassRoads.sort((a, b) => b.impassable - a.impassable || b.dist - a.dist);
longRoads.sort((a, b) => b.dist - a.dist);

const regionExtents = {
  north: cities.filter(c => c.y < 230),
  central: cities.filter(c => c.y >= 230 && c.y < 410),
  south: cities.filter(c => c.y >= 410),
  east: cities.filter(c => c.x > 690),
  west: cities.filter(c => c.x < 280),
};

const cityNeighborhood = cities.map(c => {
  const counts = {};
  for (let dq = -3; dq <= 3; dq++) {
    for (let dr = -3; dr <= 3; dr++) {
      const p = hexToPixel(c.q + dq, c.r + dr);
      const t = terrainAt(p.x, p.y);
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  const nonPlain = 49 - (counts.plain || 0);
  return { id: c.id, name: c.name, q: c.q, r: c.r, nonPlain, counts };
}).sort((a, b) => a.nonPlain - b.nonPlain || a.id.localeCompare(b.id));

function extent(list) {
  if (!list.length) return null;
  const xs = list.map(c => c.x), ys = list.map(c => c.y);
  return {
    count: list.length,
    x: [Math.min(...xs).toFixed(0), Math.max(...xs).toFixed(0)],
    y: [Math.min(...ys).toFixed(0), Math.max(...ys).toFixed(0)],
  };
}

const lines = [];
lines.push('# Map Consistency Audit');
lines.push('');
lines.push(`Cities: ${cities.length}`);
lines.push(`Blocked city centers: ${blockedCities.length}`);
for (const c of blockedCities) lines.push(`- ${c.id} ${c.name}: ${c.terrain} at q${c.q},r${c.r} (${c.x.toFixed(0)},${c.y.toFixed(0)})`);
lines.push('');
lines.push(`Hard road issues (cross water/lake): ${hardRoadIssues.length}`);
for (const r of hardRoadIssues.slice(0, 80)) {
  lines.push(`- ${r.road}: dist=${r.dist.toFixed(0)}, water=${r.water}, terrain=${JSON.stringify(r.counts)}`);
}
lines.push('');
lines.push(`Mountain pass roads (road converts impassable to mountain in buildHexTerrain): ${mountainPassRoads.length}`);
for (const r of mountainPassRoads.slice(0, 80)) {
  lines.push(`- ${r.road}: dist=${r.dist.toFixed(0)}, pass=${r.impassable}, terrain=${JSON.stringify(r.counts)}`);
}
lines.push('');
lines.push(`Very long roads: ${longRoads.length}`);
for (const r of longRoads.slice(0, 80)) {
  lines.push(`- ${r.road}: dist=${r.dist.toFixed(0)}, terrain=${JSON.stringify(r.counts)}`);
}
lines.push('');
lines.push('## Extents');
for (const [name, list] of Object.entries(regionExtents)) {
  lines.push(`- ${name}: ${JSON.stringify(extent(list))}`);
}
lines.push('');
lines.push('## Plainest City Neighborhoods');
for (const c of cityNeighborhood.slice(0, 20)) {
  lines.push(`- ${c.id} ${c.name}: nonPlain=${c.nonPlain}/49, terrain=${JSON.stringify(c.counts)}`);
}
lines.push('');
lines.push('## Cities');
for (const c of cities.sort((a, b) => a.y - b.y || a.x - b.x)) {
  lines.push(`- ${c.id} ${c.name}: q${c.q},r${c.r}, px=${c.x.toFixed(0)},${c.y.toFixed(0)}, terrain=${c.terrain}`);
}

fs.mkdirSync('docs/audit_walkthroughs', { recursive: true });
fs.writeFileSync('docs/audit_walkthroughs/map_consistency_audit.md', lines.join('\n'));
console.log(lines.slice(0, 20).join('\n'));
console.log(`\nwrote docs/audit_walkthroughs/map_consistency_audit.md`);
