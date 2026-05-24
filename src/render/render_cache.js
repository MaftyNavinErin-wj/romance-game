function renderAll(){
  hideTip(); // ★ v108: 重渲染时清除残留tooltip
  renderLeft();renderMap();renderRight();renderTurnInfo();
  renderOverlay();
}

/**
 * v86: 轻量渲染——只更新部队图标层+右侧面板，跳过地形/城市/迷雾的全量重建
 * 适用于：选中部队、移动预览、取消选中等交互操作
 */
function renderAllLight(){
  hideTip(); // ★ v108: 轻量渲染也清除tooltip
  renderUnitsOnly();renderRight();renderTurnInfo();
}

// 渲染层 R4.1 (overlay 子系统 9 funcs + 2 const + 5 lets, L1593-L1934) 已抽离到 src/render/overlay.js (Phase 4 / sub-session 4.1)






// ─── 静态地图SVG缓存（地形+道路+州名，buildHexTerrain后不变） ───
// ★ v122: 水墨风地图 + hex网格叠加开关
let _staticMapCache = '';
let _mapShowGrid = false;
const MAP_INK_BASE_ASSET = 'assets/maps/china-ink-base-v1-hd.png';
const MAP_INK_BASE_VIEW = { x: 0, y: -12, w: 1360, h: 765 };
function toggleMapStyle() {
  _mapShowGrid = !_mapShowGrid;
  const btn = document.getElementById('ov-btn-mapstyle');
  if(btn) {
    btn.textContent = _mapShowGrid ? '⬡ 网格' : '🖌 水墨';
    btn.style.background = _mapShowGrid ? 'rgba(235,225,205,.92)' : 'rgba(60,50,35,.85)';
    btn.style.color = _mapShowGrid ? 'rgba(92,74,50,.65)' : 'rgba(230,220,195,.9)';
  }
  _staticMapCache = '';
  invalidateFogCache();
  const existingRoot = document.getElementById('mapRoot');
  if(existingRoot) existingRoot.remove();
  renderMap();
}

function _buildStaticMapCache() {
  const S = HEX_SIZE;
  let h = '';
  const _sr = (col,row,i) => ((col*137+row*281+i*73)%997)/997;
  const inkMode = !_mapShowGrid;
  h += `<image href="${MAP_INK_BASE_ASSET}" x="${MAP_INK_BASE_VIEW.x}" y="${MAP_INK_BASE_VIEW.y}" width="${MAP_INK_BASE_VIEW.w}" height="${MAP_INK_BASE_VIEW.h}"
    preserveAspectRatio="xMidYMid slice" opacity="${inkMode ? '0.84' : '0.74'}" pointer-events="none"/>`;
  h += `<rect x="0" y="0" width="960" height="740" fill="${inkMode ? 'rgba(246,249,240,.22)' : 'rgba(245,238,225,.26)'}" pointer-events="none"/>`;
  if(inkMode) h += `<rect x="0" y="0" width="960" height="740" fill="rgba(218,235,230,.08)" pointer-events="none"/>`;

  // 底色：plain透明，其他极淡
  const INK_FILL = inkMode ? {
    plain:'rgba(0,0,0,0)', hill:'rgba(0,0,0,0)',
    mountain:'rgba(0,0,0,0)', forest:'rgba(0,0,0,0)',
    water:'rgba(0,0,0,0)', river:'rgba(0,0,0,0)',
    swamp:'rgba(0,0,0,0)', impassable:'rgba(0,0,0,0)',
    coastal_water:'rgba(0,0,0,0)', deep_water:'rgba(0,0,0,0)',
  } : {
    plain:'rgba(0,0,0,0)', hill:'rgba(0,0,0,0)',
    mountain:'rgba(55,40,25,.04)', forest:'rgba(30,55,25,.03)',
    water:'rgba(40,80,130,.10)', river:'rgba(40,80,130,.06)',
    swamp:'rgba(50,75,55,.04)', impassable:'rgba(30,22,12,.35)',
    coastal_water:'rgba(35,70,115,.14)', deep_water:'rgba(28,55,100,.20)',
  };

  for(let col=0; col<HEX_COLS; col++){
    for(let row=0; row<HEX_ROWS; row++){
      const k = hkey(col,row);
      const terrain = HEX_TERRAIN[k] || 'plain';
      const p = hexToPixel(col,row);
      const px = p.x.toFixed(1), py = p.y.toFixed(1);
      const fill = INK_FILL[terrain];

      if(fill && fill !== 'rgba(0,0,0,0)') {
        h += `<path d="${HEX_PATH}" transform="translate(${px},${py})" fill="${fill}" stroke="none"/>`;
      }

      const r0 = _sr(col,row,0), r1 = _sr(col,row,1), r2 = _sr(col,row,2);
      const r3 = _sr(col,row,3), r4 = _sr(col,row,4);

      if(inkMode){
        if(terrain === 'mountain'){
          const x0 = -S*(.34+r0*.06), x1 = -S*(.08-r1*.04), x2 = S*(.18+r2*.09), y0 = S*(.16+r3*.06);
          h += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} Q${(-S*.16).toFixed(1)},${(-S*.08-r0*S*.08).toFixed(1)} ${x1.toFixed(1)},${(S*.04).toFixed(1)} Q${(S*.04).toFixed(1)},${(-S*.15-r2*S*.08).toFixed(1)} ${x2.toFixed(1)},${(S*.10+r4*S*.04).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="rgba(62,56,46,.20)" stroke-width="${(.58+r1*.22).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
          if(r3>.38) h += `<path d="M${(-S*.18).toFixed(1)},${(S*.18).toFixed(1)} Q0,${(-S*.02-r4*S*.06).toFixed(1)} ${(S*.30).toFixed(1)},${(S*.15).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="rgba(62,56,46,.10)" stroke-width=".42" stroke-linecap="round" pointer-events="none"/>`;
        } else if(terrain === 'impassable'){
          h += `<path d="M${(-S*.42).toFixed(1)},${(S*.19).toFixed(1)} L${(-S*.20+r1*S*.05).toFixed(1)},${(-S*.20-r0*S*.10).toFixed(1)} L${(S*.02+r2*S*.06).toFixed(1)},${(S*.10).toFixed(1)} L${(S*.22).toFixed(1)},${(-S*.25-r3*S*.08).toFixed(1)} L${(S*.45).toFixed(1)},${(S*.16).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="rgba(54,48,38,.30)" stroke-width="${(.76+r4*.28).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
        } else if(terrain === 'forest'){
          h += `<circle cx="${(p.x-S*.12+r0*S*.05).toFixed(1)}" cy="${(p.y-S*.05-r1*S*.04).toFixed(1)}" r="${(S*(.10+r2*.025)).toFixed(1)}" fill="none" stroke="rgba(44,70,48,.16)" stroke-width=".45" pointer-events="none"/>`;
          h += `<circle cx="${(p.x+S*.06+r3*S*.05).toFixed(1)}" cy="${(p.y-S*.08+r4*S*.04).toFixed(1)}" r="${(S*(.12+r1*.025)).toFixed(1)}" fill="none" stroke="rgba(44,70,48,.18)" stroke-width=".45" pointer-events="none"/>`;
          if(r2>.28) h += `<circle cx="${(p.x+S*.18-r4*S*.05).toFixed(1)}" cy="${(p.y+S*.05).toFixed(1)}" r="${(S*.085).toFixed(1)}" fill="none" stroke="rgba(44,70,48,.10)" stroke-width=".38" pointer-events="none"/>`;
        } else if(terrain === 'hill'){
          h += `<path d="M${(-S*.30).toFixed(1)},${(S*.11).toFixed(1)} Q${(-S*.08+r0*S*.05).toFixed(1)},${(-S*.12-r1*S*.04).toFixed(1)} ${(S*.18+r2*S*.04).toFixed(1)},${(S*.08).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="rgba(82,70,46,.16)" stroke-width="${(.50+r3*.18).toFixed(2)}" stroke-linecap="round" pointer-events="none"/>`;
          if(r4>.35) h += `<path d="M${(-S*.18).toFixed(1)},${(S*.20).toFixed(1)} Q${(S*.02).toFixed(1)},${(S*.03-r2*S*.04).toFixed(1)} ${(S*.28).toFixed(1)},${(S*.18).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="rgba(82,70,46,.09)" stroke-width=".36" stroke-linecap="round" pointer-events="none"/>`;
        } else if(terrain === 'swamp'){
          h += `<path d="M${(-S*.23).toFixed(1)},${(S*.10).toFixed(1)} Q${(-S*.06).toFixed(1)},${(S*.03-r0*S*.04).toFixed(1)} ${(S*.16).toFixed(1)},${(S*.10).toFixed(1)} M${(-S*.15).toFixed(1)},${(S*.20).toFixed(1)} Q${(S*.02).toFixed(1)},${(S*.13-r2*S*.04).toFixed(1)} ${(S*.28).toFixed(1)},${(S*.18).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="rgba(42,75,64,.16)" stroke-width=".42" stroke-linecap="round" pointer-events="none"/>`;
        } else if(terrain === 'water' || terrain === 'river' || terrain === 'coastal_water' || terrain === 'deep_water'){
          const colr = terrain === 'river' ? 'rgba(34,93,130,.32)' : (terrain === 'deep_water' ? 'rgba(42,82,112,.26)' : 'rgba(42,96,128,.25)');
          const ww = terrain === 'river' ? '.64' : '.50';
          h += `<path d="M${(-S*.34).toFixed(1)},${((r0-.5)*S*.07).toFixed(1)} Q${(-S*.10).toFixed(1)},${(-S*.12-r1*S*.04).toFixed(1)} ${(S*.14).toFixed(1)},${((r2-.5)*S*.05).toFixed(1)} Q${(S*.34).toFixed(1)},${(S*.12+r3*S*.04).toFixed(1)} ${(S*.50).toFixed(1)},${((r4-.5)*S*.07).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="${colr}" stroke-width="${ww}" stroke-linecap="round" pointer-events="none"/>`;
          if(terrain === 'river' || r2 > .55) {
            h += `<path d="M${(-S*.22).toFixed(1)},${(S*.18+((r3-.5)*S*.04)).toFixed(1)} Q${(S*.02).toFixed(1)},${(S*.06-r0*S*.04).toFixed(1)} ${(S*.32).toFixed(1)},${(S*.16+((r1-.5)*S*.04)).toFixed(1)}" transform="translate(${px},${py})" fill="none" stroke="${colr}" stroke-width="${terrain === 'river' ? '.42' : '.34'}" stroke-linecap="round" pointer-events="none"/>`;
          }
        }
        continue;
      }

      if(terrain === 'mountain'){
        const mh = S*(.28+r0*.14), mw = S*(.32+r1*.12), ox = (r2-.5)*S*.12;
        h += `<path d="M${-mw},${S*.2} L${ox},${-mh} L${mw},${S*.2} Z" transform="translate(${px},${py})" fill="rgba(38,28,15,.55)" stroke="rgba(25,18,8,.7)" stroke-width="${(.6+r1*.3).toFixed(2)}" stroke-linejoin="round"/>`;
        if(r3>0.25){
          const w2=S*(.18+r3*.08), h2=S*(.15+r4*.1), ox2=S*(.14+r2*.08);
          h += `<path d="M${ox2-w2},${S*.2} L${ox2},${-h2} L${ox2+w2},${S*.2} Z" transform="translate(${px},${py})" fill="rgba(38,28,15,.30)" stroke="rgba(25,18,8,.40)" stroke-width="${(.4+r4*.2).toFixed(2)}" stroke-linejoin="round"/>`;
        }
        if(r0>0.4) h += `<circle cx="${p.x+ox}" cy="${p.y-mh+S*.08}" r="${S*.07}" fill="rgba(235,228,215,.6)" stroke="none"/>`;
      } else if(terrain === 'forest'){
        const ty = -S*.12-r0*S*.06;
        h += `<ellipse cx="${p.x+(r1-.5)*S*.08}" cy="${p.y+ty}" rx="${S*(.25+r2*.08)}" ry="${S*(.20+r3*.06)}" fill="rgba(22,48,18,.45)" stroke="none"/>`;
        h += `<ellipse cx="${p.x+S*(.10+r3*.06)}" cy="${p.y+ty+S*.06}" rx="${S*(.16+r1*.05)}" ry="${S*(.13+r2*.04)}" fill="rgba(28,55,22,.35)" stroke="none"/>`;
        if(r2>0.4) h += `<ellipse cx="${p.x-S*(.08+r0*.05)}" cy="${p.y+ty+S*.03}" rx="${S*(.12+r4*.04)}" ry="${S*(.10+r1*.03)}" fill="rgba(18,42,15,.28)" stroke="none"/>`;
      } else if(terrain === 'hill'){
        const ay = S*(.04+r0*.06);
        h += `<path d="M${-S*.28},${ay} Q${-S*.08+r1*S*.05},${-S*.12-r2*S*.08} ${S*.10},${ay}" transform="translate(${px},${py})" fill="none" stroke="rgba(60,45,25,.45)" stroke-width="${(.5+r3*.4).toFixed(2)}" stroke-linecap="round"/>`;
        if(r4>0.3) h += `<path d="M${-S*.18},${ay+S*.07} Q${r2*S*.1},${-S*.03-r1*S*.05} ${S*.22},${ay+S*.07}" transform="translate(${px},${py})" fill="none" stroke="rgba(60,45,25,.30)" stroke-width="${(.4+r1*.25).toFixed(2)}" stroke-linecap="round"/>`;
      } else if(terrain === 'water'){
        const wy = (r0-.5)*S*.12;
        h += `<path d="M${-S*.34},${wy} Q${-S*.12},${wy-S*.15} ${S*.12},${wy} Q${S*.34},${wy+S*.15} ${S*.50},${wy}" transform="translate(${(p.x-S*.08).toFixed(1)},${py})" fill="none" stroke="rgba(24,60,110,.55)" stroke-width="${(.75+r2*.30).toFixed(2)}" stroke-linecap="round"/>`;
      } else if(terrain === 'coastal_water'){
        const wy = (r0-.5)*S*.1;
        h += `<path d="M${-S*.32},${wy} Q${-S*.10},${wy-S*.13} ${S*.10},${wy} Q${S*.32},${wy+S*.13} ${S*.46},${wy}" transform="translate(${(p.x-S*.06).toFixed(1)},${py})" fill="none" stroke="rgba(24,56,100,.46)" stroke-width="${(.68+r2*.24).toFixed(2)}" stroke-linecap="round"/>`;
      } else if(terrain === 'deep_water'){
        const wy = (r0-.5)*S*.10;
        h += `<path d="M${-S*.36},${wy} Q${-S*.12},${wy-S*.17} ${S*.10},${wy} Q${S*.34},${wy+S*.17} ${S*.52},${wy}" transform="translate(${(p.x-S*.08).toFixed(1)},${py})" fill="none" stroke="rgba(18,46,90,.55)" stroke-width="${(.78+r1*.32).toFixed(2)}" stroke-linecap="round"/>`;
        h += `<path d="M${-S*.24},${wy+S*.13} Q${-S*.05},${wy+S*.03} ${S*.22},${wy+S*.13}" transform="translate(${(p.x+r3*S*.08).toFixed(1)},${py})" fill="none" stroke="rgba(18,46,90,.36)" stroke-width="${(.50+r4*.18).toFixed(2)}" stroke-linecap="round"/>`;
      } else if(terrain === 'river'){
        const wy = (r0-.5)*S*.10;
        h += `<path d="M${-S*.36},${wy} Q${-S*.10},${wy-S*.18} ${S*.14},${wy} Q${S*.36},${wy+S*.18} ${S*.54},${wy}" transform="translate(${(p.x-S*.1).toFixed(1)},${py})" fill="none" stroke="rgba(18,58,110,.62)" stroke-width="${(.85+r2*.35).toFixed(2)}" stroke-linecap="round"/>`;
        h += `<path d="M${-S*.22},${wy+S*.17} Q${S*.02},${wy+S*.03} ${S*.34},${wy+S*.16}" transform="translate(${(p.x-S*.05).toFixed(1)},${py})" fill="none" stroke="rgba(18,58,110,.42)" stroke-width="${(.55+r4*.22).toFixed(2)}" stroke-linecap="round"/>`;
      } else if(terrain === 'swamp'){
        h += `<path d="M${-S*.15},${S*.18} L${-S*.15+r1*S*.03},${-S*.05-r0*S*.08}" transform="translate(${px},${py})" fill="none" stroke="rgba(35,58,35,.40)" stroke-width="0.5" stroke-linecap="round"/>`;
        h += `<path d="M${S*.02},${S*.20} L${S*.02+r2*S*.02},${-S*.02-r3*S*.07}" transform="translate(${px},${py})" fill="none" stroke="rgba(35,58,35,.32)" stroke-width="0.45" stroke-linecap="round"/>`;
        if(r4>0.35) h += `<path d="M${S*.18},${S*.16} L${S*.18+r0*S*.02},${-S*.03-r4*S*.06}" transform="translate(${px},${py})" fill="none" stroke="rgba(35,58,35,.25)" stroke-width="0.4" stroke-linecap="round"/>`;
      } else if(terrain === 'impassable'){
        h += `<path d="M${-S*.42},${S*.2} L${-S*.1+r1*S*.06},${-S*.28-r0*S*.12} L${S*.15+r2*S*.1},${S*.05} L${S*.42},${-S*.32-r3*S*.1} L${S*.56},${S*.2}" transform="translate(${px},${py})" fill="none" stroke="rgba(25,18,8,.6)" stroke-width="${(.9+r4*.5).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
  }

  // hex网格叠加（开关控制）
  if(_mapShowGrid) {
    for(let col=0; col<HEX_COLS; col++){
      for(let row=0; row<HEX_ROWS; row++){
        const p = hexToPixel(col,row);
        h += `<path d="${HEX_PATH}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})" fill="none" stroke="rgba(80,65,40,.18)" stroke-width="0.35"/>`;
      }
    }
  }

  // 道路
  for (const k of Object.keys(HEX_ROAD)) {
    const {col, row} = hparse(k);
    const p = hexToPixel(col, row);
    h += `<path d="${HEX_PATH_INNER}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})" fill="${inkMode ? 'rgba(204,176,100,.045)' : 'rgba(140,120,80,.10)'}" stroke="none" pointer-events="none"/>`;
  }
  const roadLineDrawn = new Set();
  ROADS.forEach(([aid, bid]) => {
    const k = [aid,bid].sort().join('-');
    if(roadLineDrawn.has(k)) return; roadLineDrawn.add(k);
    const ca = CITY_MAP[aid], cb = CITY_MAP[bid];
    if(!ca||!cb) return;
    const roadHexes = roadHexPath(aid, bid);
    if(roadHexes.length < 2) return;
    let pts = '';
    roadHexes.forEach(rh => { const pp = hexToPixel(rh.col, rh.row); pts += `${pp.x.toFixed(1)},${pp.y.toFixed(1)} `; });
    if(inkMode){
      h += `<polyline points="${pts}" fill="none" stroke="rgba(255,250,224,.44)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
      h += `<polyline points="${pts}" fill="none" stroke="rgba(118,86,38,.32)" stroke-width=".72" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
    } else {
      h += `<polyline points="${pts}" fill="none" stroke="rgba(100,82,50,.18)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
      h += `<polyline points="${pts}" fill="none" stroke="rgba(80,65,38,.35)" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3,2.5" pointer-events="none"/>`;
    }
  });
  // 州名水印
  [['冀州',455,110],['司州',300,196],['兖州',526,196],['益州',127,370],
   ['荆州',335,350],['扬州',634,360],['凉州',85,210],['并州',300,130],['徐州',622,214],
   ['南中',162,520],['交州',431,590],['豫州',452,260]
  ].forEach(([n,x,y]) => {
    h += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Noto Serif SC,serif" font-size="${inkMode ? 18 : 16}" font-weight="700" fill="${inkMode ? 'rgba(62,50,32,.13)' : 'rgba(45,32,15,.16)'}" stroke="rgba(250,247,235,.30)" stroke-width="${inkMode ? 1.6 : 0}" paint-order="stroke" letter-spacing="6px" font-style="italic" pointer-events="none">${n}</text>`;
  });
  _staticMapCache = h;
}
function _getStaticMapCache() {
  if (!_staticMapCache) _buildStaticMapCache();
  return _staticMapCache;
}

// ─── C4 迷雾SVG缓存（避免每次renderMap重建6000+个path） ───
let _fogSvgCache = '';
let _fogCacheTurn = -1;
let _fogCacheVersion = 0; // ★ v117fix: 递增版本号替代G.turn，支持同旬多次刷新

function invalidateFogCache() {
  _fogCacheVersion++;
  if (typeof invalidateCityCache === 'function') invalidateCityCache();
}
function _isFogClearTerrain(terrain) {
  if (terrain === 'deep_water') return true;
  if (terrain === 'coastal_water') return true;
  if (!_mapShowGrid && terrain === 'water') return true;
  return false;
}

function _getFogSvgCache() {
  if (_fogCacheTurn === _fogCacheVersion && _fogSvgCache) return _fogSvgCache;
  const pFog = G.fog?.[G.playerFac];
  if (!pFog) { _fogSvgCache = ''; _fogCacheTurn = _fogCacheVersion; return ''; }
  let fogExplored = '', fogUnexplored = '';
  const inkFog = !_mapShowGrid;
  for (let col = 0; col < HEX_COLS; col++) {
    for (let row = 0; row < HEX_ROWS; row++) {
      const k = hkey(col, row);
      const level = pFog[k] ?? FOG_UNEXPLORED;
      if (level === FOG_VISIBLE) continue;
      const terrain = HEX_TERRAIN[k] || 'plain';
      if (_isFogClearTerrain(terrain)) continue; // 海域/湖泊保留底图水墨，不暴露陆地阻挡信息
      const p = hexToPixel(col, row);
      const tx = p.x.toFixed(1), ty = p.y.toFixed(1);
      const shape = inkFog
        ? `<path d="${HEX_PATH}" transform="translate(${tx},${ty})"/>`
        : `<path d="${HEX_PATH}" transform="translate(${tx},${ty})"/>`;
      if (level === FOG_UNEXPLORED) {
        fogUnexplored += shape;
      } else {
        fogExplored += shape;
      }
    }
  }
  let result = '';
  if (inkFog) {
    if (fogUnexplored) result += `<g fill="rgba(78,82,76,.50)" stroke="none" pointer-events="none">${fogUnexplored}</g>`;
    if (fogExplored) result += `<g fill="rgba(132,136,128,.36)" stroke="none" pointer-events="none">${fogExplored}</g>`;
  } else {
    if (fogUnexplored) result += `<g fill="rgba(110,100,80,.93)" stroke="rgba(95,85,68,.95)" stroke-width="0.5" pointer-events="none">${fogUnexplored}</g>`;
    if (fogExplored) result += `<g fill="rgba(170,160,138,.48)" stroke="rgba(155,145,125,.50)" stroke-width="0.5" pointer-events="none">${fogExplored}</g>`;
  }
  _fogSvgCache = result;
  _fogCacheTurn = _fogCacheVersion;
  return result;
}


// ★ v115优化: 城市图标SVG按旬缓存
let _citySvgCache = {};
let _cityCacheVersion = 0; // ★ v117fix: 递增版本号
let _cityCacheMeta = {};
function invalidateCityCache() { _cityCacheVersion++; _citySvgCache = {}; _cityCacheMeta = {}; }

const CITY_FAC_FILL = {wei:'rgb(220,235,248)',shu:'rgb(220,242,228)',wu:'rgb(248,225,222)',nanman:'rgb(248,240,215)'};
const CITY_FAC_STROKE = {wei:'rgba(26,95,138,1)',shu:'rgba(26,122,58,1)',wu:'rgba(168,42,26,1)',nanman:'rgba(139,105,20,1)'};
const CITY_FAC_GLOW = {wei:'rgba(26,95,138,.15)',shu:'rgba(26,122,58,.15)',wu:'rgba(168,42,26,.15)',nanman:'rgba(139,105,20,.15)'};
const CITY_FOG_STYLE = {
  visible:    { opacity: 1,    outlineOpacity: 1,    tintOpacity: .18, neutralFill: false, showCapital: true },
  explored:   { opacity: .78,  outlineOpacity: 1,    tintOpacity: .18, neutralFill: false, showCapital: true },
  unexplored: { opacity: .48,  outlineOpacity: .85,  tintOpacity: .10, neutralFill: true,  showCapital: true }
};

function _cityFogKind(fogLv) {
  if (fogLv === FOG_VISIBLE) return 'visible';
  if (fogLv === FOG_EXPLORED) return 'explored';
  return 'unexplored';
}

function _cityDisplayFac(def, city, fogKind) {
  if (!fogKind) return 'none';
  if (fogKind === 'visible') return city.fac;
  if (fogKind === 'explored') return getKnownCityFac(G.playerFac, def.id);
  return 'none';
}

function _cityRenderStyle(def, city, fogLv) {
  const fogKind = _cityFogKind(fogLv);
  if (!fogKind) return null;
  const displayFac = _cityDisplayFac(def, city, fogKind);
  const facDef = getFactionDef(displayFac) || null;
  const color = facDef ? facDef.color : '#666';
  const state = CITY_FOG_STYLE[fogKind];
  return {
    fogKind,
    displayFac,
    color,
    fill: state.neutralFill ? 'rgb(234,232,222)' : (CITY_FAC_FILL[displayFac] || 'rgb(240,235,220)'),
    stroke: CITY_FAC_STROKE[displayFac] || color || '#888',
    nameColor: color || '#444',
    glow: fogKind === 'visible' ? (CITY_FAC_GLOW[displayFac] || 'rgba(80,65,40,.15)') : 'rgba(0,0,0,0)',
    opacity: state.opacity,
    outlineOpacity: state.outlineOpacity,
    tintOpacity: state.tintOpacity,
    showCapital: state.showCapital && def.isCapital
  };
}

function _getCitySvgCache(layer = 'known') {
  const meta = _cityCacheMeta[layer];
  const fogVersion = (typeof _fogCacheVersion !== 'undefined') ? _fogCacheVersion : 0;
  if (
    meta &&
    meta.version === _cityCacheVersion &&
    meta.fogVersion === fogVersion &&
    meta.selCity === G.selCity &&
    _citySvgCache[layer]
  ) return _citySvgCache[layer];
  let ch = '';
  CITIES_DEF.forEach(def => {
    const city = G.cities[def.id]; if (!city) return;
    const fogLv = G.fog?.[G.playerFac] ? (G.fog[G.playerFac][hkey(def.q, def.r)] ?? FOG_UNEXPLORED) : FOG_VISIBLE;
    const style = _cityRenderStyle(def, city, fogLv);
    const isSel = G.selCity === def.id;
    const isCap = style.showCapital;
    const r = def.size === 'large' ? 9 : def.size === 'medium' ? 7 : 5.5;
    const nameSize = def.size === 'large' ? 9 : def.size === 'medium' ? 8 : 7;
    const nameWeight = isCap ? 800 : 750;
    // ★ v122: 水墨城楼图标
    const s = r * 0.65;
    const sw = isSel ? 1.2 : 0.7;
    const clickAttr = style.fogKind === 'unexplored'
      ? ' pointer-events="none" style="cursor:default"'
      : ' onclick="handleCityClick(\'' + def.id + '\')" style="cursor:pointer"';
    ch += '<g class="city-g' + (isSel?' sel':'') + '" transform="translate(' + city.x + ',' + city.y + ')"' +
      ' opacity="' + style.opacity + '"' + clickAttr + '>' +
      '<circle r="' + (r*1.6) + '" fill="' + style.glow + '" opacity="' + (isSel?.8:.4) + '"/>' +
      '<rect x="' + (-s*1.3) + '" y="' + (-s*1.7) + '" width="' + (s*2.6) + '" height="' + (s*2.8) + '" fill="rgba(0,0,0,0)" stroke="none"/>' +
      '<rect x="' + (-s*1.1) + '" y="' + (s*.1) + '" width="' + (s*2.2) + '" height="' + (s*.7) + '" rx="0.5"' +
        ' fill="' + style.fill + '" stroke="' + style.stroke + '" stroke-width="' + sw + '"/>' +
      '<path d="M' + (-s*.3) + ',' + (s*.8) + ' L' + (-s*.3) + ',' + (s*.25) +
        ' Q' + (-s*.3) + ',' + (-s*.05) + ' 0,' + (-s*.05) +
        ' Q' + (s*.3) + ',' + (-s*.05) + ' ' + (s*.3) + ',' + (s*.25) +
        ' L' + (s*.3) + ',' + (s*.8) + '"' +
        ' fill="' + (style.color || 'rgba(80,70,55,.35)') + '" opacity="' + style.tintOpacity + '" stroke="' + style.stroke + '" stroke-width="' + (sw*.6) + '"/>' +
      '<rect x="' + (-s*.7) + '" y="' + (-s*.6) + '" width="' + (s*1.4) + '" height="' + (s*.7) + '" rx="0.5"' +
        ' fill="' + style.fill + '" stroke="' + style.stroke + '" stroke-width="' + sw + '"/>' +
      '<path d="M' + (-s*1.0) + ',' + (-s*.6) + ' L0,' + (-s*1.15) + ' L' + (s*1.0) + ',' + (-s*.6) + '"' +
        ' fill="' + style.fill + '" stroke="' + style.stroke + '" stroke-width="' + (sw*1.1) + '" stroke-linejoin="round"/>' +
      (isCap ? '<path d="M0,' + (-s*1.15) + ' L0,' + (-s*1.45) + '" stroke="' + style.stroke + '" stroke-width="' + (sw*.8) + '" stroke-linecap="round"/>' +
        '<circle cy="' + (-s*1.5) + '" r="' + (s*.12) + '" fill="' + style.stroke + '"/>' : '') +
      '<path d="M' + (-s*1.1) + ',' + (s*.1) + ' L' + (-s*1.1) + ',' + (-s*.08) +
        ' M' + (-s*.7) + ',' + (s*.1) + ' L' + (-s*.7) + ',' + (-s*.08) +
        ' M' + (-s*.3) + ',' + (s*.1) + ' L' + (-s*.3) + ',' + (-s*.08) +
        ' M' + (s*.3) + ',' + (s*.1) + ' L' + (s*.3) + ',' + (-s*.08) +
        ' M' + (s*.7) + ',' + (s*.1) + ' L' + (s*.7) + ',' + (-s*.08) +
        ' M' + (s*1.1) + ',' + (s*.1) + ' L' + (s*1.1) + ',' + (-s*.08) +
        '" fill="none" stroke="' + style.stroke + '" stroke-width="' + (sw*.5) + '" stroke-linecap="round"/>' +
      '<text y="' + (r+13) + '" text-anchor="middle"' +
        ' font-family="Noto Serif SC,serif" font-size="' + nameSize + '" font-weight="' + nameWeight + '"' +
        ' fill="none" stroke="rgb(245,240,230)" stroke-width="2.4" stroke-linejoin="round"' +
        ' opacity="' + style.outlineOpacity + '" pointer-events="none">' + city.name + '</text>' +
      '<text y="' + (r+13) + '" text-anchor="middle"' +
        ' font-family="Noto Serif SC,serif" font-size="' + nameSize + '" font-weight="' + nameWeight + '"' +
        ' fill="' + style.nameColor + '" stroke="none"' +
        ' pointer-events="none">' + city.name + '</text>' +
      (isCap ? '<text y="' + (r+23) + '" text-anchor="middle" font-size="7.5"' +
        ' font-family="Noto Serif SC,serif" font-weight="800" fill="none" stroke="rgb(245,240,230)" stroke-width="2" stroke-linejoin="round"' +
        ' pointer-events="none">都</text>' +
        '<text y="' + (r+23) + '" text-anchor="middle" font-size="7.5"' +
        ' font-family="Noto Serif SC,serif" font-weight="800" fill="' + style.stroke + '" stroke="none"' +
        ' pointer-events="none">都</text>' : '') +
    '</g>';
  });
  _citySvgCache[layer] = ch;
  _cityCacheMeta[layer] = { version: _cityCacheVersion, fogVersion, selCity: G.selCity };
  return _citySvgCache[layer];
}
