const fs = require('fs');
const vm = require('vm');

const citySrc = fs.readFileSync('src/data/city_base.js', 'utf8');
const citiesSrc = fs.readFileSync('src/data/cities.js', 'utf8');
const mapSrc = fs.readFileSync('src/core/map.js', 'utf8');

const box = {};
vm.createContext(box);
vm.runInContext(citySrc + '\nthis.CITY_BASE = CITY_BASE;', box);
vm.runInContext(citiesSrc + '\nthis.ROADS = ROADS; this.ROAD_WAYPOINTS = ROAD_WAYPOINTS;', box);

const terrainMatch = mapSrc.match(/const TERRAIN_POLYS = \[([\s\S]*?)\];/);
if (!terrainMatch) throw new Error('TERRAIN_POLYS not found');
vm.runInContext('this.TERRAIN_POLYS = [' + terrainMatch[1] + '];', box);

const HEX_SIZE = 6;
const HEX_H = Math.sqrt(3) * HEX_SIZE;
const HEX_COLS = 102;
const HEX_ROWS = 68;

function hexToPixel(col, row) {
  return {
    x: col * HEX_SIZE * 1.5 + HEX_SIZE + 8,
    y: row * HEX_H + (col % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + 4,
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

const TERRAIN_PRIO = {
  water: 6,
  impassable: 5,
  mountain: 4,
  forest: 3,
  hill: 2,
  plain: 1,
  swamp: 2,
  deep_water: 7,
  coastal_water: 7,
};

function dataTerrainAt(x, y) {
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

function loadBitmap(path) {
  if (process.platform !== 'win32') {
    throw new Error('This audit uses PowerShell/System.Drawing on Windows.');
  }
  const { execFileSync } = require('child_process');
  const ps = `
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Bitmap]::FromFile('${path.replace(/\\/g, '\\\\')}')
Write-Output "$($img.Width),$($img.Height)"
$img.Dispose()
`;
  const [w, h] = execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' }).trim().split(',').map(Number);
  return { width: w, height: h };
}

const bitmapPath = 'assets/maps/china-ink-base-v1-hd.png';
const bitmap = loadBitmap(bitmapPath);

const imageBox = { x: 0, y: -12, w: 1360, h: 765 };
const scale = Math.max(imageBox.w / bitmap.width, imageBox.h / bitmap.height);
const renderedW = bitmap.width * scale;
const renderedH = bitmap.height * scale;
const renderedX = imageBox.x + (imageBox.w - renderedW) / 2;
const renderedY = imageBox.y + (imageBox.h - renderedH) / 2;

function svgToBitmap(x, y) {
  return {
    x: Math.round((x - renderedX) / scale),
    y: Math.round((y - renderedY) / scale),
  };
}

function roadKey(aid, bid) {
  return [aid, bid].sort().join('-');
}

function roadSvgPoints(aid, bid) {
  const a = box.CITY_BASE[aid];
  const b = box.CITY_BASE[bid];
  if (!a || !b) return [];
  const waypoints = (box.ROAD_WAYPOINTS && box.ROAD_WAYPOINTS[roadKey(aid, bid)] || [])
    .map(([q, r]) => ({ q, r }));
  return [{ q: a.q, r: a.r }, ...waypoints, { q: b.q, r: b.r }]
    .map(p => hexToPixel(p.q, p.r));
}

function readSamples(points) {
  const samplePath = 'tmp/bitmap_alignment_samples.json';
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync(samplePath, JSON.stringify(points));
  const outPath = 'tmp/bitmap_alignment_samples.out.json';
  const ps = `
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Bitmap]::FromFile('${bitmapPath.replace(/\\/g, '\\\\')}')
$points=Get-Content '${samplePath.replace(/\\/g, '\\\\')}' -Raw | ConvertFrom-Json
$rows=@()
foreach($p in $points){
  $sumR=0; $sumG=0; $sumB=0; $n=0
  for($dy=-3; $dy -le 3; $dy++){
    for($dx=-3; $dx -le 3; $dx++){
      $x=[Math]::Max(0,[Math]::Min($img.Width-1,[int]$p.bx+$dx))
      $y=[Math]::Max(0,[Math]::Min($img.Height-1,[int]$p.by+$dy))
      $c=$img.GetPixel($x,$y)
      $sumR += $c.R; $sumG += $c.G; $sumB += $c.B; $n++
    }
  }
  $rows += [pscustomobject]@{ id=$p.id; r=[Math]::Round($sumR/$n,1); g=[Math]::Round($sumG/$n,1); b=[Math]::Round($sumB/$n,1) }
}
$img.Dispose()
$rows | ConvertTo-Json -Depth 3 | Set-Content '${outPath.replace(/\\/g, '\\\\')}' -Encoding UTF8
`;
  require('child_process').execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  return JSON.parse(fs.readFileSync(outPath, 'utf8').replace(/^\uFEFF/, ''));
}

function classifyColor(c) {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  const brightness = (c.r + c.g + c.b) / 3;
  if (c.b > c.r + 10 && c.b > c.g + 4) return 'water';
  if (c.g > c.r + 8 && c.g > c.b + 2) return 'forest';
  if (brightness < 145 && max - min < 45) return 'mountain';
  if (brightness < 190) return 'hill';
  return 'plain';
}

function compat(dataTerrain, bitmapTerrain) {
  if (dataTerrain === bitmapTerrain) return true;
  if (dataTerrain === 'coastal_water' || dataTerrain === 'deep_water') return bitmapTerrain === 'water';
  if (dataTerrain === 'impassable') return bitmapTerrain === 'mountain' || bitmapTerrain === 'hill';
  if (dataTerrain === 'mountain') return bitmapTerrain === 'hill' || bitmapTerrain === 'mountain';
  if (dataTerrain === 'hill') return bitmapTerrain === 'mountain' || bitmapTerrain === 'plain';
  if (dataTerrain === 'forest') return bitmapTerrain === 'plain' || bitmapTerrain === 'forest';
  return false;
}

const points = [];
const cityPointRows = [];
const cityCandidateRows = [];
const roadPointRows = [];
for (const [id, c] of Object.entries(box.CITY_BASE)) {
  const p = hexToPixel(c.q, c.r);
  const b = svgToBitmap(p.x, p.y);
  points.push({ id: `city:${id}`, bx: b.x, by: b.y, svgX: p.x, svgY: p.y });
  cityPointRows.push({ id, name: c.name, x: p.x, y: p.y, bx: b.x, by: b.y });
  for (let dq = -4; dq <= 4; dq++) {
    for (let dr = -4; dr <= 4; dr++) {
      const q = c.q + dq;
      const r = c.r + dr;
      if (q < 0 || q >= HEX_COLS || r < 0 || r >= HEX_ROWS) continue;
      const cp = hexToPixel(q, r);
      if (Math.hypot(cp.x - p.x, cp.y - p.y) > 42) continue;
      const cb = svgToBitmap(cp.x, cp.y);
      const pointId = `candidate:${id}:${q},${r}`;
      points.push({ id: pointId, bx: cb.x, by: cb.y, svgX: cp.x, svgY: cp.y });
      cityCandidateRows.push({ id, q, r, x: cp.x, y: cp.y, pointId, movePx: Math.hypot(cp.x - p.x, cp.y - p.y) });
    }
  }
}

for (const [aId, bId] of box.ROADS) {
  const route = roadSvgPoints(aId, bId);
  for (let segIdx = 0; segIdx < route.length - 1; segIdx++) {
    const pa = route[segIdx];
    const pb = route[segIdx + 1];
    const dist = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    const steps = Math.max(2, Math.ceil(dist / 8));
    for (let i = 0; i <= steps; i++) {
      if (segIdx > 0 && i === 0) continue;
      const t = i / steps;
      const x = pa.x + (pb.x - pa.x) * t;
      const y = pa.y + (pb.y - pa.y) * t;
      const bitmapPoint = svgToBitmap(x, y);
      const id = `road:${aId}-${bId}:${segIdx}:${i}`;
      points.push({ id, bx: bitmapPoint.x, by: bitmapPoint.y, svgX: x, svgY: y });
      roadPointRows.push({ road: `${aId}-${bId}`, id, x, y, idx: i, steps });
    }
  }
}

for (let col = 0; col < HEX_COLS; col += 2) {
  for (let row = 0; row < HEX_ROWS; row += 2) {
    const p = hexToPixel(col, row);
    if (p.x < 40 || p.x > 890 || p.y < 45 || p.y > 700) continue;
    const dataTerrain = dataTerrainAt(p.x, p.y);
    if (dataTerrain === 'plain') continue;
    const b = svgToBitmap(p.x, p.y);
    points.push({ id: `hex:${col},${row}:${dataTerrain}`, bx: b.x, by: b.y, svgX: p.x, svgY: p.y });
  }
}

const samples = Object.fromEntries(readSamples(points).map(s => [s.id, s]));
const cityRows = [];
const terrainRows = [];
const roadBuckets = {};
for (const p of points) {
  const s = samples[p.id];
  const bitmapTerrain = classifyColor(s);
  if (p.id.startsWith('city:')) {
    const id = p.id.slice(5);
    const c = box.CITY_BASE[id];
    const dataTerrain = dataTerrainAt(p.svgX, p.svgY);
    cityRows.push({ id, name: c.name, q: c.q, r: c.r, dataTerrain, bitmapTerrain, rgb: `${s.r},${s.g},${s.b}` });
  } else if (p.id.startsWith('hex:')) {
    const [, coord, dataTerrain] = p.id.split(':');
    if (dataTerrain === 'impassable') continue;
    if (!compat(dataTerrain, bitmapTerrain)) {
      terrainRows.push({ coord, dataTerrain, bitmapTerrain, rgb: `${s.r},${s.g},${s.b}` });
    }
  }
}

for (const row of roadPointRows) {
  const s = samples[row.id];
  const bitmapTerrain = classifyColor(s);
  if (!roadBuckets[row.road]) {
    roadBuckets[row.road] = { road: row.road, samples: 0, water: 0, mountain: 0, hill: 0, forest: 0, plain: 0 };
  }
  const bucket = roadBuckets[row.road];
  bucket.samples++;
  bucket[bitmapTerrain] = (bucket[bitmapTerrain] || 0) + 1;
}

terrainRows.sort((a, b) => a.dataTerrain.localeCompare(b.dataTerrain) || a.coord.localeCompare(b.coord));

const cityPrompts = cityRows.filter(r => {
  const rough = r.bitmapTerrain === 'mountain' || r.bitmapTerrain === 'hill';
  const water = r.bitmapTerrain === 'water';
  const tags = new Set(box.CITY_BASE[r.id].tags || []);
  if (water) return true;
  if (rough && tags.has('平原')) return true;
  if (r.bitmapTerrain === 'plain' && tags.has('山地')) return true;
  return false;
});

function cityCandidateScore(cityId, bitmapTerrain, movePx) {
  const tags = new Set(box.CITY_BASE[cityId].tags || []);
  let score = movePx / 8;
  if (tags.has('骞冲師')) {
    if (bitmapTerrain === 'plain') score -= 8;
    if (bitmapTerrain === 'hill') score -= 2;
    if (bitmapTerrain === 'mountain') score += 8;
  }
  if (tags.has('灞卞湴')) {
    if (bitmapTerrain === 'mountain' || bitmapTerrain === 'hill') score -= 6;
    if (bitmapTerrain === 'plain') score += 4;
  }
  if (tags.has('姘翠埂') || tags.has('娓彛')) {
    if (bitmapTerrain === 'water') score -= 4;
  }
  return score;
}

const candidateSuggestions = [];
for (const prompt of cityPrompts) {
  const candidates = cityCandidateRows
    .filter(r => r.id === prompt.id)
    .map(r => {
      const s = samples[r.pointId];
      const bitmapTerrain = classifyColor(s);
      return {
        ...r,
        bitmapTerrain,
        score: cityCandidateScore(prompt.id, bitmapTerrain, r.movePx),
      };
    })
    .sort((a, b) => a.score - b.score || a.movePx - b.movePx)
    .slice(0, 4);
  candidateSuggestions.push({ id: prompt.id, current: `q${prompt.q},r${prompt.r}`, candidates });
}

const roadRows = Object.values(roadBuckets).map(r => {
  const rough = r.mountain + r.hill;
  return {
    ...r,
    waterRatio: r.water / r.samples,
    roughRatio: rough / r.samples,
    mountainRatio: r.mountain / r.samples,
  };
}).sort((a, b) => b.waterRatio - a.waterRatio || b.roughRatio - a.roughRatio || b.samples - a.samples);
const roadPrompts = roadRows.filter(r => r.waterRatio >= 0.18 || r.mountainRatio >= 0.45).slice(0, 40);
const roadPromptSheetRows = roadPrompts.slice(0, 20).map(r => {
  const [aId, bId] = r.road.split('-');
  const route = roadSvgPoints(aId, bId);
  const pa = route[0];
  const pb = route[route.length - 1];
  const ba = svgToBitmap(pa.x, pa.y);
  const bb = svgToBitmap(pb.x, pb.y);
  const bitmapRoute = route.map(p => svgToBitmap(p.x, p.y));
  return { ...r, aId, bId, ax: ba.x, ay: ba.y, bx: bb.x, by: bb.y, route: bitmapRoute };
});

const lines = [];
lines.push('# Bitmap Alignment Audit');
lines.push('');
lines.push(`Bitmap: ${bitmapPath} (${bitmap.width}x${bitmap.height})`);
lines.push(`SVG image transform: rendered=${renderedW.toFixed(1)}x${renderedH.toFixed(1)}, offset=${renderedX.toFixed(1)},${renderedY.toFixed(1)}, scale=${scale.toFixed(5)}`);
lines.push('');
lines.push('Color classifier is heuristic. Use this as a visual-alignment prompt, not a hard correctness test.');
lines.push('');
lines.push('## City Bitmap Prompts');
if (!cityPrompts.length) lines.push('- PASS');
else cityPrompts.forEach(r => lines.push(`- ${r.id}: q${r.q},r${r.r}, data=${r.dataTerrain}, bitmap=${r.bitmapTerrain}, rgb=${r.rgb}`));
lines.push('');
lines.push('## City Candidate Suggestions');
if (!candidateSuggestions.length) lines.push('- PASS');
else candidateSuggestions.forEach(row => {
  const rendered = row.candidates.map(c => `q${c.q},r${c.r}:${c.bitmapTerrain},move=${c.movePx.toFixed(0)}`).join('; ');
  lines.push(`- ${row.id}: current=${row.current}; ${rendered}`);
});
lines.push('');
lines.push('## Non-Plain Terrain Mismatch Prompts');
lines.push('');
lines.push('Impassable masks are excluded here because border/gameplay blocking is audited separately by the hard checks.');
if (!terrainRows.length) lines.push('- PASS');
else terrainRows.slice(0, 120).forEach(r => lines.push(`- q${r.coord}: data=${r.dataTerrain}, bitmap=${r.bitmapTerrain}, rgb=${r.rgb}`));
lines.push('');
lines.push('## Road Bitmap Prompts');
if (!roadPrompts.length) lines.push('- PASS');
else roadPrompts.forEach(r => {
  lines.push(`- ${r.road}: samples=${r.samples}, water=${r.water}, mountain=${r.mountain}, hill=${r.hill}, forest=${r.forest}, plain=${r.plain}, waterRatio=${r.waterRatio.toFixed(2)}, roughRatio=${r.roughRatio.toFixed(2)}`);
});
lines.push('');

fs.mkdirSync('docs/audit_walkthroughs', { recursive: true });
fs.writeFileSync(
  'docs/audit_walkthroughs/city_bitmap_points.tsv',
  cityPointRows.map(r => `${r.id}\t${r.name}\t${r.x.toFixed(1)}\t${r.y.toFixed(1)}\t${r.bx}\t${r.by}`).join('\n') + '\n',
);
fs.writeFileSync(
  'docs/audit_walkthroughs/road_bitmap_prompts.tsv',
  roadPromptSheetRows.map(r => `${r.road}\t${r.samples}\t${r.water}\t${r.mountain}\t${r.hill}\t${r.forest}\t${r.plain}\t${r.waterRatio.toFixed(2)}\t${r.roughRatio.toFixed(2)}`).join('\n') + '\n',
);
fs.writeFileSync('docs/audit_walkthroughs/bitmap_alignment_audit.md', lines.join('\n'));
console.log(lines.join('\n'));

{
  const sheetInput = 'tmp/bitmap_city_sheet_points.json';
  fs.writeFileSync(sheetInput, JSON.stringify(cityPointRows));
  const ps = `
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Bitmap]::FromFile('${bitmapPath.replace(/\\/g, '\\\\')}')
$points=Get-Content '${sheetInput.replace(/\\/g, '\\\\')}' -Raw | ConvertFrom-Json
$tileW=180; $tileH=150; $cols=5
$rows=[Math]::Ceiling($points.Count / $cols)
$sheet=New-Object System.Drawing.Bitmap ($tileW*$cols),($tileH*$rows)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$font=New-Object System.Drawing.Font 'Arial',8
$brush=[System.Drawing.Brushes]::Black
$redPen=New-Object System.Drawing.Pen ([System.Drawing.Color]::Red),2
for($i=0; $i -lt $points.Count; $i++){
  $p=$points[$i]
  $tx=($i % $cols)*$tileW; $ty=[Math]::Floor($i/$cols)*$tileH
  $srcX=[Math]::Max(0,[Math]::Min($img.Width-$tileW,[int]$p.bx-90))
  $srcY=[Math]::Max(0,[Math]::Min($img.Height-$tileH,[int]$p.by-75))
  $dest=New-Object System.Drawing.Rectangle $tx,$ty,$tileW,$tileH
  $src=New-Object System.Drawing.Rectangle $srcX,$srcY,$tileW,$tileH
  $g.DrawImage($img,$dest,$src,[System.Drawing.GraphicsUnit]::Pixel)
  $cx=$tx + ([int]$p.bx - $srcX); $cy=$ty + ([int]$p.by - $srcY)
  $g.DrawLine($redPen,$cx-8,$cy,$cx+8,$cy)
  $g.DrawLine($redPen,$cx,$cy-8,$cx,$cy+8)
  $g.FillRectangle([System.Drawing.Brushes]::White,$tx,$ty,95,15)
  $g.DrawString([string]$p.id,$font,$brush,$tx+3,$ty+1)
}

$sheet.Save('docs/audit_walkthroughs/city_bitmap_contact_sheet.png',[System.Drawing.Imaging.ImageFormat]::Png)
$redPen.Dispose(); $font.Dispose(); $g.Dispose(); $sheet.Dispose(); $img.Dispose()
`;
  require('child_process').execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
}

{
  const focusIds = ['xuchang','xiapi','donghai','chengdu','yuzhang','jianning','yiling','lujiang','jingzhou','changsha','chenliu','nanyang'];
  const focusRows = [];
  for (const id of focusIds) {
    const c = box.CITY_BASE[id];
    if (!c) continue;
    for (let dq = -8; dq <= 8; dq += 2) {
      for (let dr = -8; dr <= 8; dr += 2) {
        const q = c.q + dq;
        const r = c.r + dr;
        if (q < 0 || q >= HEX_COLS || r < 0 || r >= HEX_ROWS) continue;
        const p = hexToPixel(q, r);
        const b = svgToBitmap(p.x, p.y);
        focusRows.push({ id, q, r, bx: b.x, by: b.y, current: dq === 0 && dr === 0 });
      }
    }
  }
  const sheetInput = 'tmp/bitmap_city_focus_candidates.json';
  fs.writeFileSync(sheetInput, JSON.stringify(focusRows));
  const ps = `
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Bitmap]::FromFile('${bitmapPath.replace(/\\/g, '\\\\')}')
$points=Get-Content '${sheetInput.replace(/\\/g, '\\\\')}' -Raw | ConvertFrom-Json
$ids=$points | Select-Object -ExpandProperty id -Unique
$tileW=240; $tileH=220; $cols=3
$rows=[Math]::Max(1,[Math]::Ceiling($ids.Count / $cols))
$sheet=New-Object System.Drawing.Bitmap ($tileW*$cols),($tileH*$rows)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$font=New-Object System.Drawing.Font 'Arial',7
$titleFont=New-Object System.Drawing.Font 'Arial',9
$redPen=New-Object System.Drawing.Pen ([System.Drawing.Color]::Red),2
$bluePen=New-Object System.Drawing.Pen ([System.Drawing.Color]::DodgerBlue),1
$brush=[System.Drawing.Brushes]::Black
for($i=0; $i -lt $ids.Count; $i++){
  $id=$ids[$i]
  $list=@($points | Where-Object { $_.id -eq $id })
  $tx=($i % $cols)*$tileW; $ty=[Math]::Floor($i/$cols)*$tileH
  $cx=($list | Where-Object { $_.current -eq $true } | Select-Object -First 1)
  if($null -eq $cx){ $cx=$list[0] }
  $srcX=[Math]::Max(0,[Math]::Min($img.Width-$tileW,[int]$cx.bx-120))
  $srcY=[Math]::Max(0,[Math]::Min($img.Height-$tileH,[int]$cx.by-110))
  $dest=New-Object System.Drawing.Rectangle $tx,$ty,$tileW,$tileH
  $src=New-Object System.Drawing.Rectangle $srcX,$srcY,$tileW,$tileH
  $g.DrawImage($img,$dest,$src,[System.Drawing.GraphicsUnit]::Pixel)
  foreach($p in $list){
    $px=$tx+([int]$p.bx-$srcX); $py=$ty+([int]$p.by-$srcY)
    if($px -lt $tx -or $px -gt ($tx+$tileW) -or $py -lt $ty -or $py -gt ($ty+$tileH)){ continue }
    if($p.current){
      $g.DrawLine($redPen,$px-8,$py,$px+8,$py)
      $g.DrawLine($redPen,$px,$py-8,$px,$py+8)
    } else {
      $g.DrawEllipse($bluePen,$px-3,$py-3,6,6)
    }
    $g.DrawString(('q'+$p.q+',r'+$p.r),$font,$brush,$px+4,$py-5)
  }
  $g.FillRectangle([System.Drawing.Brushes]::White,$tx,$ty,100,16)
  $g.DrawString($id,$titleFont,$brush,$tx+3,$ty+1)
}
$sheet.Save('docs/audit_walkthroughs/city_focus_candidate_sheet.png',[System.Drawing.Imaging.ImageFormat]::Png)
$redPen.Dispose(); $bluePen.Dispose(); $font.Dispose(); $titleFont.Dispose(); $g.Dispose(); $sheet.Dispose(); $img.Dispose()
`;
  require('child_process').execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
}

{
  const sheetInput = 'tmp/bitmap_road_sheet_points.json';
  fs.writeFileSync(sheetInput, JSON.stringify(roadPromptSheetRows));
  const ps = `
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Bitmap]::FromFile('${bitmapPath.replace(/\\/g, '\\\\')}')
$roads=Get-Content '${sheetInput.replace(/\\/g, '\\\\')}' -Raw | ConvertFrom-Json
$tileW=300; $tileH=180; $cols=2
$rows=[Math]::Max(1,[Math]::Ceiling($roads.Count / $cols))
$sheet=New-Object System.Drawing.Bitmap ($tileW*$cols),($tileH*$rows)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$font=New-Object System.Drawing.Font 'Arial',8
$brush=[System.Drawing.Brushes]::Black
$linePen=New-Object System.Drawing.Pen ([System.Drawing.Color]::Red),2
$dotBrush=[System.Drawing.Brushes]::Yellow
for($i=0; $i -lt $roads.Count; $i++){
  $r=$roads[$i]
  $tx=($i % $cols)*$tileW; $ty=[Math]::Floor($i/$cols)*$tileH
  $xs=@(); $ys=@()
  foreach($rp in $r.route){ $xs += [int]$rp.x; $ys += [int]$rp.y }
  $minX=($xs | Measure-Object -Minimum).Minimum; $maxX=($xs | Measure-Object -Maximum).Maximum
  $minY=($ys | Measure-Object -Minimum).Minimum; $maxY=($ys | Measure-Object -Maximum).Maximum
  $pad=55
  $srcW=[Math]::Max(120,($maxX-$minX)+$pad*2); $srcH=[Math]::Max(90,($maxY-$minY)+$pad*2)
  $srcX=[Math]::Max(0,[Math]::Min($img.Width-$srcW,$minX-$pad))
  $srcY=[Math]::Max(0,[Math]::Min($img.Height-$srcH,$minY-$pad))
  $dest=New-Object System.Drawing.Rectangle $tx,$ty,$tileW,$tileH
  $src=New-Object System.Drawing.Rectangle $srcX,$srcY,$srcW,$srcH
  $g.DrawImage($img,$dest,$src,[System.Drawing.GraphicsUnit]::Pixel)
  $sx=$tileW/$srcW; $sy=$tileH/$srcH
  for($j=0; $j -lt $r.route.Count-1; $j++){
    $p0=$r.route[$j]; $p1=$r.route[$j+1]
    $ax=$tx+(([int]$p0.x-$srcX)*$sx); $ay=$ty+(([int]$p0.y-$srcY)*$sy)
    $bx=$tx+(([int]$p1.x-$srcX)*$sx); $by=$ty+(([int]$p1.y-$srcY)*$sy)
    $g.DrawLine($linePen,$ax,$ay,$bx,$by)
  }
  foreach($rp in $r.route){
    $dx=$tx+(([int]$rp.x-$srcX)*$sx); $dy=$ty+(([int]$rp.y-$srcY)*$sy)
    $g.FillEllipse($dotBrush,$dx-3,$dy-3,6,6)
  }
  $g.FillRectangle([System.Drawing.Brushes]::White,$tx,$ty,220,28)
  $g.DrawString(([string]$r.road),$font,$brush,$tx+3,$ty+1)
  $g.DrawString(("rough="+[string]$r.roughRatio.ToString("0.00")+" water="+[string]$r.waterRatio.ToString("0.00")),$font,$brush,$tx+3,$ty+14)
}
$sheet.Save('docs/audit_walkthroughs/road_bitmap_contact_sheet.png',[System.Drawing.Imaging.ImageFormat]::Png)
$linePen.Dispose(); $font.Dispose(); $g.Dispose(); $sheet.Dispose(); $img.Dispose()
`;
  require('child_process').execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
}
