const fs = require('fs');
const vm = require('vm');

const citySrc = fs.readFileSync('src/data/city_base.js', 'utf8');
const citiesSrc = fs.readFileSync('src/data/cities.js', 'utf8');
const mapSrc = fs.readFileSync('src/core/map.js', 'utf8');

const box = {};
vm.createContext(box);
vm.runInContext(citySrc + '\nthis.CITY_BASE = CITY_BASE;', box);
vm.runInContext(citiesSrc + '\nthis.ROADS = ROADS; this.RIVERS = RIVERS; this.ROAD_WAYPOINTS = ROAD_WAYPOINTS;', box);

const terrainMatch = mapSrc.match(/const TERRAIN_POLYS = \[([\s\S]*?)\];/);
if (!terrainMatch) throw new Error('TERRAIN_POLYS not found');
vm.runInContext('this.TERRAIN_POLYS = [' + terrainMatch[1] + '];', box);

const HEX_SIZE = 6;
const HEX_H = Math.sqrt(3) * HEX_SIZE;
function hexToPixel(col, row) {
  return {
    x: col * HEX_SIZE * 1.5 + HEX_SIZE + 8,
    y: row * HEX_H + (col % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + 4,
  };
}

const cityEntries = Object.entries(box.CITY_BASE).map(([id, c]) => {
  const p = hexToPixel(c.q, c.r);
  return {...c, id, x: p.x, y: p.y};
});
const cityById = Object.fromEntries(cityEntries.map(c => [c.id, c]));
const mapInkBaseView = {x: 0, y: -12, w: 1360, h: 765};

function roadKey(aid, bid) {
  return [aid, bid].sort().join('-');
}

function roadPoints(aid, bid) {
  const ca = cityById[aid], cb = cityById[bid];
  if (!ca || !cb) return [];
  const waypoints = (box.ROAD_WAYPOINTS && box.ROAD_WAYPOINTS[roadKey(aid, bid)] || [])
    .map(([q, r]) => ({...hexToPixel(q, r)}));
  return [ca, ...waypoints, cb];
}

const terrainColors = {
  water: 'rgba(30,100,180,.32)',
  coastal_water: 'rgba(20,80,160,.22)',
  deep_water: 'rgba(10,55,120,.26)',
  river: 'rgba(20,95,180,.45)',
  impassable: 'rgba(20,20,20,.42)',
  mountain: 'rgba(85,50,25,.34)',
  hill: 'rgba(135,100,45,.28)',
  forest: 'rgba(35,110,45,.28)',
  swamp: 'rgba(35,110,90,.30)',
  plain: 'rgba(210,170,70,.12)',
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

let terrainSvg = '';
for (const poly of box.TERRAIN_POLYS) {
  const fill = terrainColors[poly.type] || 'rgba(255,0,255,.25)';
  terrainSvg += `<polygon points="${poly.pts}" fill="${fill}" stroke="${fill}" stroke-width="1" data-terrain="${poly.type}"/>`;
}

let riverSvg = '';
for (const path of box.RIVERS) {
  riverSvg += `<path d="${path}" fill="none" stroke="rgba(0,90,190,.78)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

let roadSvg = '';
for (const [a, b] of box.ROADS) {
  const pts = roadPoints(a, b);
  if (pts.length < 2) continue;
  roadSvg += `<polyline points="${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="rgba(90,60,20,.42)" stroke-width="1.1"/>`;
}

let citySvg = '';
for (const c of cityEntries) {
  citySvg += `<g class="city" transform="translate(${c.x.toFixed(1)},${c.y.toFixed(1)})">
    <circle r="4.2" fill="#fff8df" stroke="#0f5f9a" stroke-width="1.4"/>
    <text x="6" y="3">${esc(c.name)} ${esc(c.id)}</text>
  </g>`;
}

let gridSvg = '';
for (let col = 0; col < 102; col++) {
  for (let row = 0; row < 68; row++) {
    const p = hexToPixel(col, row);
    gridSvg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r=".55"/>`;
  }
}

const html = `<!doctype html>
<meta charset="utf-8">
<title>Map Alignment Audit</title>
<style>
body{margin:0;background:#ddd;font-family:system-ui,"Noto Serif SC",serif}
.bar{position:fixed;left:0;right:0;top:0;z-index:5;background:rgba(20,18,14,.88);color:#f5ead2;padding:8px 12px;display:flex;gap:12px;align-items:center;font-size:13px}
label{display:flex;gap:5px;align-items:center}
.wrap{padding-top:42px}
svg{display:block;width:100vw;height:calc(100vh - 42px);background:#e8dfc8}
.city text{font-size:8px;paint-order:stroke;stroke:#fff8df;stroke-width:2px;fill:#14344d}
#grid circle{fill:rgba(0,0,0,.16)}
.off{display:none}
</style>
<div class="bar">
  <strong>Map Alignment Audit</strong>
  <label><input type="checkbox" data-layer="terrain" checked>terrain polys</label>
  <label><input type="checkbox" data-layer="rivers" checked>rivers</label>
  <label><input type="checkbox" data-layer="roads" checked>roads</label>
  <label><input type="checkbox" data-layer="cities" checked>cities</label>
  <label><input type="checkbox" data-layer="grid">hex centers</label>
</div>
<div class="wrap">
<svg viewBox="0 0 960 740">
  <image href="../../assets/maps/china-ink-base-v1-hd.png" x="${mapInkBaseView.x}" y="${mapInkBaseView.y}" width="${mapInkBaseView.w}" height="${mapInkBaseView.h}" preserveAspectRatio="xMidYMid slice"/>
  <g id="terrain">${terrainSvg}</g>
  <g id="rivers">${riverSvg}</g>
  <g id="roads">${roadSvg}</g>
  <g id="cities">${citySvg}</g>
  <g id="grid" class="off">${gridSvg}</g>
</svg>
</div>
<script>
document.querySelectorAll('input[data-layer]').forEach(cb=>{
  cb.addEventListener('change',()=>{
    document.getElementById(cb.dataset.layer).classList.toggle('off', !cb.checked);
  });
});
</script>`;

fs.mkdirSync('docs/audit_walkthroughs', {recursive: true});
fs.writeFileSync('docs/audit_walkthroughs/map_alignment_audit.html', html);
console.log('wrote docs/audit_walkthroughs/map_alignment_audit.html');
