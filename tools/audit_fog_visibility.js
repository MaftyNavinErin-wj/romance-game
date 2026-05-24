const fs = require('fs');
const vm = require('vm');

const mapSrc = fs.readFileSync('src/core/map.js', 'utf8');
const renderCacheSrc = fs.readFileSync('src/render/render_cache.js', 'utf8');
const mapInteractionSrc = fs.readFileSync('src/render/map_interaction.js', 'utf8');
const uiPanelsSrc = fs.readFileSync('src/render/ui_panels.js', 'utf8');
const tooltipSrc = fs.readFileSync('src/render/tooltips.js', 'utf8');
const overlaySrc = fs.readFileSync('src/render/overlay.js', 'utf8');
const diplomacySrc = fs.readFileSync('src/chains/diplomacy.js', 'utf8');

const terrainMatch = mapSrc.match(/const TERRAIN_POLYS = \[([\s\S]*?)\];/);
if (!terrainMatch) throw new Error('TERRAIN_POLYS not found');

const box = {};
vm.createContext(box);
vm.runInContext('this.TERRAIN_POLYS = [' + terrainMatch[1] + '];', box);

const HEX_SIZE = 6;
const HEX_H = Math.sqrt(3) * HEX_SIZE;
const HEX_COLS = 102;
const HEX_ROWS = 68;
const TERRAIN_PRIO = {
  plain: 1,
  hill: 2,
  swamp: 2,
  forest: 3,
  mountain: 4,
  impassable: 5,
  water: 6,
  coastal_water: 7,
  deep_water: 7,
};

function hexToPixel(col, row) {
  return {
    x: col * HEX_SIZE * 1.5 + HEX_SIZE + 8,
    y: row * HEX_H + (col % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + 4,
  };
}

function pointInPoly(x, y, pts) {
  const arr = pts.trim().split(/\s+/).map(p => p.split(',').map(Number));
  let inside = false;
  for (let i = 0, j = arr.length - 1; i < arr.length; j = i++) {
    const xi = arr[i][0], yi = arr[i][1];
    const xj = arr[j][0], yj = arr[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function terrainAt(x, y) {
  let terrain = 'plain';
  let best = 0;
  for (const poly of box.TERRAIN_POLYS) {
    const prio = TERRAIN_PRIO[poly.type] || 0;
    if (prio >= best && pointInPoly(x, y, poly.pts)) {
      terrain = poly.type;
      best = prio;
    }
  }
  return terrain;
}

const counts = {};
const impassableEdge = { top: 0, bottom: 0, left: 0, right: 0, interior: 0 };
const samples = [];
for (let col = 0; col < HEX_COLS; col++) {
  for (let row = 0; row < HEX_ROWS; row++) {
    const p = hexToPixel(col, row);
    const terrain = terrainAt(p.x, p.y);
    counts[terrain] = (counts[terrain] || 0) + 1;
    if (terrain === 'impassable') {
      if (row <= 5) impassableEdge.top++;
      else if (row >= HEX_ROWS - 6) impassableEdge.bottom++;
      else if (col <= 5) impassableEdge.left++;
      else if (col >= HEX_COLS - 6) impassableEdge.right++;
      else impassableEdge.interior++;
      if (samples.length < 30) samples.push(`q${col},r${row}`);
    }
  }
}

const helperMatch = renderCacheSrc.match(/function _isFogClearTerrain\(terrain\) \{([\s\S]*?)\n\}/);
const helperBody = helperMatch ? helperMatch[1] : '';
const checks = [
  {
    name: 'fog clear helper exists',
    pass: !!helperMatch,
  },
  {
    name: 'impassable is not fog-clear by default',
    pass: helperMatch && !helperBody.includes("'impassable'") && !helperBody.includes('"impassable"'),
  },
  {
    name: 'unexplored city geography is still rendered on map',
    pass: renderCacheSrc.includes("unexplored:") &&
      renderCacheSrc.includes("return 'unexplored';") &&
      !renderCacheSrc.includes('if (!style) return;'),
  },
  {
    name: 'unexplored city style is neutral and does not reveal ownership',
    pass: renderCacheSrc.includes("unexplored:") &&
      renderCacheSrc.includes("neutralFill: true") &&
      renderCacheSrc.includes("if (!fogKind) return 'none';") &&
      renderCacheSrc.includes("if (fogKind === 'visible') return city.fac;") &&
      renderCacheSrc.includes("return 'none';"),
  },
  {
    name: 'explored city ownership falls back to opening owner',
    pass: mapSrc.includes('function getInitialCityFac(cityId)') &&
      mapSrc.includes('function getKnownCityFac(viewerFid, cityId)') &&
      mapSrc.includes('G.fogSnap?.[viewerFid]?.[cityId]?.fac || getInitialCityFac(cityId)') &&
      renderCacheSrc.includes("if (fogKind === 'explored') return getKnownCityFac(G.playerFac, def.id);") &&
      uiPanelsSrc.includes("fogLv === FOG_EXPLORED ? getKnownCityFac(G.playerFac, cd.id)") &&
      overlaySrc.includes('if (fogLv === FOG_EXPLORED) return getKnownCityFac(G.playerFac, cityId);'),
  },
  {
    name: 'explored fog writes synchronize city-center intel',
    pass: mapSrc.includes('function markFogKeyExplored(fid, fog, k, turn)') &&
      mapSrc.includes('setCityFogSnapshot(fid, cityId, turn, false)') &&
      mapSrc.includes('markFogKeyExplored(fid, fog, k, turn)') &&
      !mapSrc.includes('preserveUnknownCityCenters'),
  },
  {
    name: 'fog reveal animation uses shared fog-clear terrain rule',
    pass: mapInteractionSrc.includes('_isFogClearTerrain(ter)'),
  },
  {
    name: 'unexplored city hex clicks can select known geography',
    pass: !mapInteractionSrc.includes('cityKnown') &&
      !mapInteractionSrc.includes('fogLv === FOG_UNEXPLORED) return;'),
  },
  {
    name: 'unexplored terrain tooltip is hidden',
    pass: tooltipSrc.includes('fogLv === FOG_UNEXPLORED') && tooltipSrc.includes('hideTip();'),
  },
  {
    name: 'city visible no longer uses full territory flood-fill',
    pass: mapSrc.includes('collectFactionCityVisionKeys(allyFacs)') &&
      !mapSrc.includes('if (allyFacs.includes(t.fac)) {\n      visibleKeys.add(k);'),
  },
  {
    name: 'road-adjacent explored city area is radius-limited',
    pass: mapSrc.includes('markCityAreaExplored(fid, fog, cityId') &&
      !mapSrc.includes('neighborEnemyCities.has(territory[k].cityId)'),
  },
  {
    name: 'known control areas remain explored when not visible',
    pass: mapSrc.includes('FOG_CONTROL_RADIUS') &&
      mapSrc.includes('markKnownControlAreasExplored(fid, fog, allyFacs)'),
  },
  {
    name: 'fog does not reuse overlay territory flood-fill',
    pass: !mapSrc.includes('markKnownFactionTerritoryExplored') &&
      !/function initFog[\s\S]*?_buildTerritoryMap\(\)[\s\S]*?function updateFog/.test(mapSrc) &&
      !/function updateFog[\s\S]*?_buildTerritoryMap\(\)[\s\S]*?function updateFogCitySnapshot/.test(mapSrc),
  },
  {
    name: 'road-adjacent explored cities use bounded fog helper',
    pass: mapSrc.includes('function markRoadAdjacentEnemyCitiesExplored') &&
      mapSrc.includes('getCityControlRadius(def)') &&
      (mapSrc.match(/markRoadAdjacentEnemyCitiesExplored\(fid, fog/g) || []).length >= 2,
  },
  {
    name: 'city ownership changes invalidate territory cache',
    pass: mapSrc.includes('function invalidateTerritoryCache()') &&
      /function updateFogCitySnapshot[\s\S]*?invalidateTerritoryCache\(\);[\s\S]*?\n\}/.test(mapSrc),
  },
  {
    name: 'overlay base masks unexplored instead of overriding fog',
    pass: overlaySrc.includes('fogLv === FOG_UNEXPLORED') &&
      overlaySrc.includes('_ovBaseFogVersion'),
  },
  {
    name: 'live resource overlays require visible authorized city data',
    pass: overlaySrc.includes('_canShowLiveCityOverlay(cityId)') &&
      overlaySrc.includes('_canShowLiveResourceHex(cityId, k)'),
  },
  {
    name: 'live resource overlays require visible hexes',
    pass: overlaySrc.includes('function _canShowLiveResourceHex(cityId, k)') &&
      overlaySrc.includes('_playerFogLevelAtKey(k) === FOG_VISIBLE') &&
      overlaySrc.match(/if\(!_canShowLiveResourceHex\(cityId, k\)\) return;/g)?.length >= 3,
  },
  {
    name: 'supply overlay only paints visible hexes',
    pass: overlaySrc.includes('_playerFogLevelAtKey(k) !== FOG_VISIBLE'),
  },
  {
    name: 'scout reveal is city-radius limited and not territory flood-fill',
    pass: diplomacySrc.includes('getCityVisionRadius(def)') &&
      diplomacySrc.includes('getCityControlRadius(def)') &&
      !/function _applyScoutReveal[\s\S]*?_buildTerritoryMap\(\)[\s\S]*?\n\}/.test(diplomacySrc),
  },
  {
    name: 'scout reveal invalidates fog cache',
    pass: /function _applyScoutReveal[\s\S]*?invalidateFogCache\(\);[\s\S]*?\n\}/.test(diplomacySrc),
  },
];

const lines = [];
lines.push('# Fog Visibility Audit');
lines.push('');
lines.push('Scope: fog rendering policy, city visibility policy, terrain tooltip policy, and impassable terrain distribution.');
lines.push('');
lines.push('## Policy Checks');
checks.forEach(c => lines.push(`- ${c.pass ? 'PASS' : 'FAIL'}: ${c.name}`));
lines.push('');
lines.push('## Terrain Hex Counts');
Object.keys(counts).sort().forEach(k => lines.push(`- ${k}: ${counts[k]}`));
lines.push('');
lines.push('## Impassable Distribution');
Object.entries(impassableEdge).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
lines.push('');
lines.push('## Impassable Samples');
samples.forEach(s => lines.push(`- ${s}`));
lines.push('');
lines.push('## Current Interpretation');
lines.push('- Unexplored land blockers are now covered by fog instead of being visually treated as always known.');
lines.push('- City geography is static knowledge: unexplored city icons/names stay visible in a neutral style.');
lines.push('- Sea and ink-mode open water remain fog-clear to preserve the parchment/ink base-map treatment.');
lines.push('- City visible range is radius-based; overlay territory flood-fill is no longer used as a visibility source.');
lines.push('- Known control areas remain explored even when they are outside current visible radius.');
lines.push('- Own, allied, and previously known city control-radius areas remain explored even when they are outside current visible radius.');
lines.push('- Resource overlays are now gated by fog visibility and faction-data permission.');
lines.push('- Scout reveal now uses city-radius visibility plus control-radius explored memory instead of overlay territory flood-fill.');

fs.writeFileSync('docs/audit_walkthroughs/fog_visibility_audit.md', lines.join('\n') + '\n');
console.log(lines.join('\n'));
