// src/render/map_render.js
//
// 渲染层(R)— 地图主渲染 + 部队渲染层 + 部队详情面板。
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.2,渲染层第二轮 — 地图渲染)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// 地图渲染相关全部聚到本文件,跟 src/render/overlay.js (4.1) / src/core/map.js (hex 数据计算) 区分:
//   - src/core/map.js: hex/pathfinding/terrain 纯空间数据计算 (phase 3.11 抽离)
//   - src/render/overlay.js: 地图叠加层 (4.1 抽离)
//   - src/render/map_render.js: 地图主渲染 + 部队 SVG 渲染 + 部队详情面板 (本文件)
//
// ── 抽离范围(4 段)──
//   R4.2.a 围城指示 + 移动范围        v181 L1850-L1940 (2 funcs + 1 let)
//                                      _renderSiegeIndicators / _renderMoveRange
//                                      + _moveRangeCache (let)
//   R4.2.b 主地图 + 部队层增量          v181 L1942-L2054 (2 funcs)
//                                      renderMap / renderUnitsOnly
//   R4.2.c 部队 SVG 渲染               v181 L9689-L9898 (2 funcs)
//                                      getUnitDisplayPos / renderUnitsOnMap
//   R4.2.d 部队详情面板                 v181 L9899-L10195 (1 func)
//                                      renderUnitDetail
//
// 函数总数: 2 + 2 + 2 + 1 = **7 函数 + 1 let**
//
// ── 留 v181 ──
//   `renderAll` (L1579) 主渲染入口跨 chain 调度,不归 map_render
//   `renderTechTab` 等 8 right tabs (留 4.8 sub-session)
//   `renderRight` (L2585 +/- 偏移) 留 4.8 sub-session
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `_moveRangeCache` (移动范围 BFS 缓存)
//   - DOM `#mapSvg` innerHTML / `#mapRoot` transform / `#fogLayer` / `#citiesLayer` /
//     `#siegeLayer` / `#unitsLayer` / `#moveLayer` (主地图 SVG 渲染输出)
//   - `svg.style.cursor` / `svg.oncontextmenu` / `svg.onclick` (DOM 事件 binding)
//
// **跨链读取**(read-only,不写他链):
//   - G.cities / G.fog / G.units / G.selUnitId / G.selCity / G.activeTab /
//     G.factions / G.generals / G.playerFac (read)
//   - getUnitFoodRate / canSeeFactionData / fuzzyGenDisplay / getScoutINT (military 链 read)
//   - getUnitTroops / calcUnitAP / getMainTroopType / getMainCom / getMaxInt /
//     calcUnitATK / calcUnitDEF / calcCombatPower / getSiegeDefMult / isUnitOnWater
//     (military 链 read)
//   - getCityFoodTurns / POLICY (经济链 read)
//   - hexToPixel / hexNeighbors / hkey / hparse / WATER_TERRAINS / HEX_PATH_INNER /
//     HEX_TERRAIN / HEX_PATH / HEX_CITY / FOG_VISIBLE / FOG_UNEXPLORED /
//     getHexMoveCost / getTerrainAt / calcHexPathCost (map.js read)
//   - CITIES_DEF / FAC / GEN_TAGS (data read)
//   - _mapTx / _mapTy / _mapScale (v181 顶层 lets,留 v181)
//   - _getStaticMapCache / _getFogSvgCache / _getCitySvgCache (其他 render helper,留 v181)
//
// ── 接口风格 ──
// 全局函数 + let(同 phase 3 chain + render phase 2 风格)。
//
// `_moveRangeCache` 是 top-level **let**(跨 classic <script> 跨文件可读写)。

// ════════════════════════════════════════════════════════════════════
// ── R4.2.a 围城指示 + 移动范围 (v181 L1850-L1940) ──
// ════════════════════════════════════════════════════════════════════


// ★ v115优化: 围城指示独立渲染函数（供增量更新调用）
function _renderSiegeIndicators() {
  let sh = '';
  CITIES_DEF.forEach(def => {
    const city = G.cities[def.id]; if (!city) return;
    const fogLv = G.fog?.[G.playerFac] ? (G.fog[G.playerFac][hkey(def.q, def.r)] ?? FOG_UNEXPLORED) : FOG_VISIBLE;
    if (fogLv !== FOG_VISIBLE) return;
    const siegeUnits = G.units.filter(u => u.status === 'siege' && u.siegeTarget === def.id);
    if (!siegeUnits.length) return;
    const atkFac = siegeUnits[0].fac;
    const atkCol = getFactionDef(atkFac)?.color || '#c03030';
    const defMult = getSiegeDefMult(city);
    const invS = 'scale(' + (1/_mapScale).toFixed(4) + ')';
    const siegeTurns = siegeUnits[0]._siegeTurnCount || 0;
    const mainLabel = '围' + siegeTurns + '旬·' + city.name;
    const defLabel = ' 防' + Math.round((defMult-1)*100) + '%';
    const boxW = mainLabel.length * 5.8 + defLabel.length * 5.2 + 6;
    const ax = 12, ay = -8;
    sh += '<g transform="translate(' + def.x + ',' + def.y + ')" pointer-events="none">' +
      '<g transform="' + invS + '">' +
      '<rect x="' + ax + '" y="' + (ay-8) + '" width="' + boxW.toFixed(0) + '" height="15" rx="3"' +
        ' fill="rgba(245,238,225,.92)" stroke="' + atkCol + '" stroke-width=".9"/>' +
      '<text x="' + (ax+3) + '" y="' + (ay+3) + '" font-size="6.5" font-family="Noto Serif SC,serif"' +
        ' fill="' + atkCol + '" font-weight="700">' + mainLabel + '</text>' +
      '<text x="' + (ax+3+mainLabel.length*5.8) + '" y="' + (ay+3) + '" font-size="6"' +
        ' font-family="Noto Serif SC,serif" fill="rgba(44,36,22,.65)">' + defLabel + '</text>' +
      '</g></g>';
  });
  return sh;
}

// ★ v115优化: 移动范围+选中提示独立渲染函数
let _moveRangeCache = { unitId: null, ap: -1, svg: '' }; // ★ v167fix #35
function _renderMoveRange() {
  let mh = '';
  if (!G.selUnitId) { _moveRangeCache.unitId = null; return mh; }
  mh += `<rect x="0" y="0" width="960" height="28" fill="rgba(55,30,6,.80)"/>
    <text x="480" y="19" text-anchor="middle" font-family="Noto Serif SC,serif"
      font-size="11" fill="rgba(228,202,148,.88)" letter-spacing="1">点击目标城市或地图hex出发 · 右键取消选中</text>`;
  const selUnit = G.units.find(u => u.id === G.selUnitId);
  const _canShowRange = selUnit && selUnit.fac === G.playerFac
    && !(selUnit.mobilizingTurns > 0)
    && selUnit.status !== 'camp' && selUnit.status !== 'ambush' && selUnit.status !== 'siege';
  if (_canShowRange) {
    const ap = selUnit._apRemaining ?? calcUnitAP(selUnit);
    // ★ v167fix #35: 缓存BFS结果，同一部队+同AP不重算
    if (_moveRangeCache.unitId === G.selUnitId && _moveRangeCache.ap === ap) {
      return mh + _moveRangeCache.svg;
    }
    let _rangeSvg = ''; // ★ v167fix #35
    const troopType = getMainTroopType(selUnit);
    const visited = {};
    const _selOnWater = isUnitOnWater(selUnit); // ★ v138
    const queue = [{col: selUnit.hq, row: selUnit.hr, cost: 0, onWater: _selOnWater}];
    visited[hkey(selUnit.hq, selUnit.hr)] = 0;
    while (queue.length) {
      const cur = queue.shift();
      for (const nb of hexNeighbors(cur.col, cur.row)) {
        const nk = hkey(nb.col, nb.row);
        const nbIsWater = WATER_TERRAINS.has(HEX_TERRAIN[nk] || 'plain'); // ★ v138
        const mc = getHexMoveCost(nb.col, nb.row, troopType, cur.onWater);
        if (mc >= 999) continue;
        const cid = HEX_CITY[nk];
        if (cid) { const cc = G.cities[cid]; if (cc && cc.fac !== selUnit.fac && cc.fac !== 'none') continue; }
        if (G.units.some(ou => ou.id !== selUnit.id && ou.hq === nb.col && ou.hr === nb.row)) {
          const isOwnCityHex = cid && G.cities[cid] && G.cities[cid].fac === selUnit.fac;
          if (!isOwnCityHex) continue;
        }
        // ★ v138: 水陆转换消耗全部剩余AP（到达后AP清零，不能继续走）
        const _transition = cur.onWater !== nbIsWater;
        const nc = _transition ? ap : cur.cost + mc; // transition = 用光AP
        if (nc <= ap && (visited[nk] === undefined || nc < visited[nk])) {
          visited[nk] = nc;
          // transition后不继续扩展（AP已清零），只有非transition才入队
          if (!_transition) queue.push({col: nb.col, row: nb.row, cost: nc, onWater: nbIsWater});
        }
      }
    }
    for (const [k, cost] of Object.entries(visited)) {
      if (k === hkey(selUnit.hq, selUnit.hr)) continue;
      const {col: hc, row: hr} = hparse(k);
      const p = hexToPixel(hc, hr);
      _rangeSvg += `<path d="${HEX_PATH_INNER}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})"
        fill="rgba(120,95,45,.12)" stroke="rgba(120,95,45,.35)" stroke-width="0.8" pointer-events="none"/>`;
    }
    _moveRangeCache = { unitId: G.selUnitId, ap, svg: _rangeSvg };
    mh += _rangeSvg;
  }
  return mh;
}

function renderMap(){
  const svg = document.getElementById('mapSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 960 740');
  svg.oncontextmenu = onMapRightClick;
  svg.onclick = handleMapClick;
  svg.style.cursor = G.selUnitId ? 'crosshair' : 'default';

  // ★ perf: 如果SVG骨架已建好，直接更新动态层，避免先拼完整地图SVG字符串。
  const existingRoot = document.getElementById('mapRoot');
  if (existingRoot) {
    const ucl = document.getElementById('unexploredCityLayer');
    const fl = document.getElementById('fogLayer');
    if (ucl) ucl.remove();
    if (fl) {
      const fogHtml = _getFogSvgCache();
      const fogKey = (typeof _getFogRenderKey === 'function') ? _getFogRenderKey() : String(typeof _fogCacheVersion !== 'undefined' ? _fogCacheVersion : 0);
      if (fl.getAttribute('data-render-key') !== fogKey) {
        fl.innerHTML = fogHtml;
        fl.setAttribute('data-render-key', fogKey);
      }
    }
    const ml = document.getElementById('moveLayer');
    const cl = document.getElementById('citiesLayer');
    if (ml && cl && ml.nextSibling !== cl) existingRoot.insertBefore(ml, cl);
    let pl = document.getElementById('unitPathsLayer');
    if (!pl && cl) {
      pl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pl.setAttribute('id', 'unitPathsLayer');
      existingRoot.insertBefore(pl, cl);
    }
    if (pl && cl && pl.nextSibling !== cl) existingRoot.insertBefore(pl, cl);
    if (pl) pl.innerHTML = renderUnitsOnMap('paths');
    if (cl) {
      const cityHtml = _getCitySvgCache('known');
      const cityKey = (typeof _getCityRenderKey === 'function') ? _getCityRenderKey('known') : String(typeof _cityCacheVersion !== 'undefined' ? _cityCacheVersion : 0);
      if (cl.getAttribute('data-render-key') !== cityKey) {
        cl.innerHTML = cityHtml;
        cl.setAttribute('data-render-key', cityKey);
      }
    }
    const sl = document.getElementById('siegeLayer');
    if (sl) sl.innerHTML = _renderSiegeIndicators();
    const ul = document.getElementById('unitsLayer');
    if (ul) ul.innerHTML = renderUnitsOnMap('icons');
    if (ml) ml.innerHTML = _renderMoveRange();
    existingRoot.setAttribute('transform', `translate(${_mapTx.toFixed(1)},${_mapTy.toFixed(1)}) scale(${_mapScale.toFixed(4)})`);
    svg.style.cursor = G.selUnitId ? 'crosshair' : 'default';
    return;
  }

  let h = `<defs>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
      <polygon points="0 0, 7 2.5, 0 5" fill="rgba(120,80,20,.8)"/>
    </marker>
    <radialGradient id="parchment-grad" cx="42%" cy="38%" r="68%">
      <stop offset="0%" stop-color="#f0ebe0"/>
      <stop offset="50%" stop-color="#ebe5d8"/>
      <stop offset="100%" stop-color="#e2dac8"/>
    </radialGradient>
    <radialGradient id="fg-wei" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(26,95,138,.18)"/><stop offset="100%" stop-color="rgba(26,95,138,0)"/></radialGradient>
    <radialGradient id="fg-shu" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(26,122,58,.18)"/><stop offset="100%" stop-color="rgba(26,122,58,0)"/></radialGradient>
    <radialGradient id="fg-wu" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(168,42,26,.18)"/><stop offset="100%" stop-color="rgba(168,42,26,0)"/></radialGradient>
    <radialGradient id="fg-nanman" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(139,105,20,.18)"/><stop offset="100%" stop-color="rgba(139,105,20,0)"/></radialGradient>
  </defs>`;

  // 羊皮纸底色
  h += `<rect width="960" height="740" fill="url(#parchment-grad)"/>`;

  // ─── 静态地图层缓存（地形+道路+州名，只建一次） ───
  h += _getStaticMapCache();

  // ─── 粮草输送点（不做地图视觉体现） ───

  // ─── C4 战争迷雾渲染（缓存优化：仅fog变更时重建） ───
  h += `<g id="fogLayer">${_getFogSvgCache()}</g>`;

  // ─── 选中提示条+移动范围 ───
  h += `<g id="moveLayer">${_renderMoveRange()}</g>`;

  // ─── 部队路线/移动预览：放在城市下方，避免压灰城市文字和图标 ───
  h += `<g id="unitPathsLayer">${renderUnitsOnMap('paths')}</g>`;

  // ─── 城市图标（盾形简化，高对比度）── C4 迷雾感知 ───
  // ★ v115优化: 按旬缓存城市图标层（只有城池易手/迷雾变更时才变）
  h += `<g id="citiesLayer">${_getCitySvgCache('known')}</g>`;

  // ─── 围城指示条（C4: 只显示可见区域的围城） ───
  h += `<g id="siegeLayer">${_renderSiegeIndicators()}</g>`;

  h += `<g id="unitsLayer">${renderUnitsOnMap('icons')}</g>`;

  // 图例
  h += `<g style="pointer-events:none">
    <rect x="756" y="4" width="200" height="72" rx="3" fill="rgba(245,238,225,.92)" stroke="rgba(80,65,40,.25)" stroke-width="0.8"/>
    <text x="856" y="14" text-anchor="middle" font-family="Noto Serif SC,serif" font-size="7.5" fill="rgba(44,36,22,.7)" letter-spacing="2">地 形 图 例</text>
    <rect x="762" y="21" width="7" height="7" rx="1" fill="rgba(180,195,140,.55)"/><text x="772" y="27" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">平原</text>
    <rect x="800" y="21" width="7" height="7" rx="1" fill="rgba(160,140,90,.55)"/><text x="810" y="27" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">丘陵</text>
    <rect x="838" y="21" width="7" height="7" rx="1" fill="rgba(130,100,65,.65)"/><text x="848" y="27" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">山地</text>
    <rect x="876" y="21" width="7" height="7" rx="1" fill="rgba(80,130,70,.55)"/><text x="886" y="27" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">林地</text>
    <rect x="914" y="21" width="7" height="7" rx="1" fill="rgba(90,135,100,.45)"/><text x="924" y="27" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">沼泽</text>
    <rect x="762" y="34" width="7" height="7" rx="1" fill="rgba(80,130,180,.55)"/><text x="772" y="40" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">水域</text>
    <rect x="800" y="34" width="7" height="7" rx="1" fill="rgba(70,120,175,.55)"/><text x="810" y="40" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">河流</text>
    <rect x="838" y="34" width="7" height="7" rx="1" fill="rgba(90,65,40,.65)"/><text x="848" y="40" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">绝壁</text>
    <line x1="878" y1="37.5" x2="898" y2="37.5" stroke="rgba(120,95,45,.55)" stroke-width="1.8" stroke-linecap="round"/>
    <text x="902" y="40" font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(44,36,22,.7)">官道</text>
    <line x1="762" y1="52" x2="950" y2="52" stroke="rgba(80,65,40,.08)" stroke-width="0.5"/>
    <text x="762" y="60" font-family="Noto Serif SC,serif" font-size="5.5" fill="rgba(44,36,22,.4)">平原1 · 丘陵2 · 山地3 · 林地2 · 河流4 · 水域6 · 官道½ · 绝壁✕</text>
    <text x="762" y="69" font-family="Noto Serif SC,serif" font-size="5.5" fill="rgba(44,36,22,.4)">数字为行动力消耗(AP)</text>
  </g>`;

  const defsMatch = h.match(/^(<defs>[\s\S]*?<\/defs>)/);
  const defsStr = defsMatch ? defsMatch[1] : '';
  const bodyStr = h.replace(/^(<defs>[\s\S]*?<\/defs>)/, '');

  // 首次全量建SVG——包含命名层骨架
  svg.innerHTML = defsStr +
    `<g id="mapRoot" transform="translate(${_mapTx.toFixed(1)},${_mapTy.toFixed(1)}) scale(${_mapScale.toFixed(4)})">${bodyStr}</g>` +
    `<text x="955" y="736" text-anchor="end" font-size="9" font-family="Noto Serif SC,sans-serif"
      fill="rgba(80,65,40,.25)" pointer-events="none">三国志 · 建安十九年</text>`;
  const fogLayer = document.getElementById('fogLayer');
  if (fogLayer && typeof _getFogRenderKey === 'function') fogLayer.setAttribute('data-render-key', _getFogRenderKey());
  const citiesLayer = document.getElementById('citiesLayer');
  if (citiesLayer && typeof _getCityRenderKey === 'function') citiesLayer.setAttribute('data-render-key', _getCityRenderKey('known'));
}

/**
 * v86: 轻量级渲染——只更新部队层（units+paths+preview），不重建整个SVG
 * 用于交互操作（选中、预览、取消等），避免全量renderMap的DOM重建开销
 */
function renderUnitsOnly(){
  const svg = document.getElementById('mapSvg');
  if(!svg) return;
  svg.style.cursor = G.selUnitId ? 'crosshair' : 'default';
  const root = document.getElementById('mapRoot');
  const moveLayer = document.getElementById('moveLayer');
  let unitPathsLayer = document.getElementById('unitPathsLayer');
  const citiesLayer = document.getElementById('citiesLayer');
  if(root && moveLayer && citiesLayer && moveLayer.nextSibling !== citiesLayer) root.insertBefore(moveLayer, citiesLayer);
  if(root && !unitPathsLayer && citiesLayer) {
    unitPathsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    unitPathsLayer.setAttribute('id', 'unitPathsLayer');
    root.insertBefore(unitPathsLayer, citiesLayer);
  }
  if(root && unitPathsLayer && citiesLayer && unitPathsLayer.nextSibling !== citiesLayer) root.insertBefore(unitPathsLayer, citiesLayer);
  const unitsLayer = document.getElementById('unitsLayer');
  if(!unitsLayer){ renderMap(); return; }  // fallback: 首次或层丢失时走全量
  unitsLayer.innerHTML = renderUnitsOnMap('icons');
  // ★ v115: 同步更新移动范围层（选中/取消选中时需刷新）
  if(moveLayer) moveLayer.innerHTML = _renderMoveRange();
  if(unitPathsLayer) unitPathsLayer.innerHTML = renderUnitsOnMap('paths');
}

// ════════════════════════════════════════════════════════════════════
// ── R4.2.c 部队 SVG 渲染 (v181 L9689-L9898) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 地图渲染（部队Icon）
// ═══════════════════════════════════════════════════════
function getUnitDisplayPos(unit){
  return hexToPixel(unit.hq ?? 0, unit.hr ?? 0);
}

function renderUnitsOnMap(mode = 'all'){
  const renderPaths = mode === 'all' || mode === 'paths';
  const renderIcons = mode === 'all' || mode === 'icons';
  let h='';
  const pFog = G.fog?.[G.playerFac];
  const byPos = {};
  G.units.forEach(u => {
    // C4: 隐藏迷雾中的非己方部队
    if (pFog && u.fac !== G.playerFac && !canSeeFactionData(G.playerFac, u.fac)) {
      const fogLv = pFog[hkey(u.hq??0, u.hr??0)] ?? FOG_UNEXPLORED;
      if (fogLv !== FOG_VISIBLE) return; // 不渲染
    }
    // ★ v134: 敌方伏兵隐身——ambush状态的非己方部队不渲染
    if (u.status === 'ambush' && u.fac !== G.playerFac && !canSeeFactionData(G.playerFac, u.fac)) return;
    const k = hkey(u.hq??0, u.hr??0);
    if(!byPos[k]) byPos[k]=[];
    byPos[k].push(u);
  });

  // C4: 也需要用过滤后的单位列表渲染
  const visibleUnits = Object.values(byPos).flat();
  visibleUnits.forEach(unit => {
    const col = getFactionDef(unit.fac)?.color||'#888';
    const isSel = G.selUnitId === unit.id;
    const isGarr = unit.status === 'garrison';
    const pos = hexToPixel(unit.hq??0, unit.hr??0);
    const stackKey = hkey(unit.hq??0, unit.hr??0);
    const stackUnits = byPos[stackKey] || [unit];
    const stackCount = stackUnits.length;
    const stackIdx = stackUnits.indexOf(unit);

    const fanSpacing = 14;
    const invS = 1/_mapScale;
    const offsetX = (stackIdx-(stackCount-1)/2)*fanSpacing*invS;
    let px = pos.x + offsetX;
    let py = pos.y;

    // 行进路径线 — v111: 只显示玩家部队的路线，AI部队路线隐藏
    if(renderPaths && (stackIdx===0||isSel) && unit.hexPath && unit.hexPath.length > 0 && unit.fac === G.playerFac){
      let pts = `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
      unit.hexPath.forEach(hp => {
        const pp = hexToPixel(hp.col, hp.row);
        pts += ` ${pp.x.toFixed(1)},${pp.y.toFixed(1)}`;
      });
      const lineCol = isSel ? col : 'rgba(92,74,50,.3)';
      h += `<polyline points="${pts}" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="3" stroke-linecap="round"/>`;
      h += `<polyline points="${pts}" fill="none" stroke="${lineCol}" stroke-width="${isSel?2:1.2}"
        stroke-dasharray="6,3" opacity="${isSel?.9:.5}" marker-end="${isSel?'url(#arrowhead)':''}"/>`;
      if(isSel && unit.hexPath.length > 0){
        const last = unit.hexPath[unit.hexPath.length-1];
        const lp = hexToPixel(last.col, last.row);
        h += `<circle cx="${lp.x}" cy="${lp.y}" r="10" fill="${col}" fill-opacity=".1" stroke="${col}" stroke-width="1.5" stroke-dasharray="3,2" opacity=".8"/>`;
      }
    }

    if(!renderIcons) return;

    const gname = unit.squads[0]?.genName||'?';
    const total = getUnitTroops(unit);
    // v97: 敌方部队情报模糊
    const isEnemy = unit.fac !== G.playerFac && !canSeeFactionData(G.playerFac, unit.fac);
    const _scoutInt = isEnemy ? getScoutINT(unit) : 99;
    const dispName = isEnemy && _scoutInt < 60 ? '？？' : (gname.length>2?gname.slice(0,2):gname);
    const troopStr = isEnemy ? fuzzyTroopDisplay(total, _scoutInt) : (total>=10000?(total/10000).toFixed(1)+'万':fmt(total));
    // ── 矩形旗帜（全战风格）──
    const flagW=28, flagH=16, poleH=18;
    const isCamp = unit.status==='camp';
    const isAmbush = unit.status==='ambush';
    const FAC_DARK_FLAG = {wei:'rgba(220,235,248,.95)',shu:'rgba(220,242,228,.95)',wu:'rgba(248,225,222,.95)',nanman:'rgba(248,240,210,.95)'};
    const darkFill = FAC_DARK_FLAG[unit.fac]||'rgba(240,235,220,.95)';
    const baseOpacity = (stackCount>1&&!isSel)?'0.82':'1';
    const bw = flagW, bh = flagH;

    h += `<g class="unit-g" transform="translate(${px.toFixed(2)},${py.toFixed(1)})" opacity="${baseOpacity}"
      onclick="onUnitLeftClick('${unit.id}',event)"
      oncontextmenu="onUnitRightClick('${unit.id}',event)"
      onmouseenter="showUnitTip(event,'${unit.id}')" onmouseleave="hideTip()">
      <g transform="scale(${invS.toFixed(4)})">
        ${isSel?`<ellipse rx="18" ry="5" fill="none" stroke="#8a7040" stroke-width="1.8" opacity=".8">
          <animate attributeName="rx" values="16;21;16" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values=".8;.3;.8" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>`:''}
        <ellipse rx="4" ry="1.5" fill="rgba(80,65,40,.15)"/>
        <line x1="0" y1="0" x2="0" y2="${-(poleH+2)}" stroke="rgba(80,65,40,.3)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="0" y2="${-(poleH+2)}" stroke="rgba(80,65,40,.6)" stroke-width="1.2" stroke-linecap="round"/>
        ${isCamp?`<g pointer-events="none" transform="translate(0,5)">
          <rect x="-8" y="-7" width="16" height="9" rx="1" fill="rgba(60,38,12,.55)" stroke="rgba(96,184,224,.8)" stroke-width="1"/>
          <polygon points="0,-12 -5,-7 5,-7" fill="rgba(96,184,224,.5)" stroke="rgba(96,184,224,.8)" stroke-width=".7"/>
        </g>`:isAmbush?`<g pointer-events="none" transform="translate(0,5)">
          <ellipse cx="-4" cy="-2" rx="4" ry="3" fill="rgba(40,100,30,.6)"/>
          <ellipse cx="3" cy="-2" rx="4" ry="3" fill="rgba(40,100,30,.6)"/>
          <ellipse cx="0" cy="-5" rx="5" ry="3.5" fill="rgba(50,130,35,.65)"/>
        </g>`:''}
        <rect x="${-bw/2}" y="${-(poleH+bh)}" width="${bw}" height="${bh}" rx="2"
          fill="${darkFill}" stroke="${isSel?'#8a7040':col}" stroke-width="${isSel?2.5:1.8}"
          ${isSel?'filter="url(#glow)"':''}/>
        ${isGarr?'':`<rect x="${-bw/2}" y="${-(poleH+bh)}" width="${bw}" height="3" rx="1"
          fill="${col}" opacity=".35"/>`}
        <text x="0" y="${-(poleH+bh/2)+1}"
          text-anchor="middle" dominant-baseline="middle"
          font-family="Noto Serif SC,serif" font-size="9.5" fill="rgba(240,228,195,1)" font-weight="700"
          stroke="rgba(0,0,0,.65)" stroke-width="1.8" paint-order="stroke"
          pointer-events="none">${dispName}</text>
        <rect x="${-bw/2+1}" y="${-(poleH)-1}" width="${bw-2}" height="8" rx="1.5"
          fill="rgba(0,0,0,.65)"/>
        <text x="0" y="${-(poleH)+5}"
          text-anchor="middle" dominant-baseline="middle"
          font-family="Noto Serif SC,serif" font-size="6.5" font-weight="600"
          fill="${isSel?'#8a7040':'rgba(255,240,200,.92)'}"
          pointer-events="none">${troopStr}</text>
        ${isSel && unit.fac === G.playerFac ? `<g transform="translate(${bw/2+2},${-(poleH+bh/2)})">
          <rect x="-1" y="-5.5" width="16" height="11" rx="2.5"
            fill="rgba(245,238,225,.92)" stroke="${unit.mobilizingTurns>0?'rgba(138,106,16,.6)':'rgba(138,106,16,.6)'}" stroke-width=".8"/>
          <text x="7" y="1" text-anchor="middle" dominant-baseline="middle"
            font-family="Noto Serif SC,serif" font-size="6" font-weight="700"
            fill="${unit.mobilizingTurns>0?'rgba(138,106,16,.85)':'rgba(138,106,16,.85)'}" pointer-events="none">${unit.mobilizingTurns>0?'⚙':unit._apRemaining !== undefined ? unit._apRemaining : calcUnitAP(unit)}</text>
          <text x="7" y="7" text-anchor="middle" dominant-baseline="middle"
            font-family="Noto Serif SC,serif" font-size="4" font-weight="400"
            fill="${unit.mobilizingTurns>0?'rgba(138,106,16,.35)':'rgba(138,106,16,.45)'}" pointer-events="none">${unit.mobilizingTurns>0?'整备':'AP'}</text>
        </g>` : ''}
      </g>
    </g>`;
  });

  // ── v86/v99: 移动预览路径渲染（双色区分本旬可达/跨旬） ──
  const preview = G._movePreview;
  if(renderPaths && preview && preview.hexPath && preview.hexPath.length > 0 && G.selUnitId){
    const selUnit = G.units.find(u => u.id === G.selUnitId);
    if(selUnit){
      const startPos = hexToPixel(selUnit.hq??0, selUnit.hr??0);
      const ap = selUnit._apRemaining !== undefined ? selUnit._apRemaining : calcUnitAP(selUnit);
      const troopType = getMainTroopType(selUnit);

      // 计算本旬AP可走到哪一格
      let apSim = ap;
      let splitIdx = 0;
      for(let i = 0; i < preview.hexPath.length; i++){
        const cost = getHexMoveCost(preview.hexPath[i].col, preview.hexPath[i].row, troopType);
        if(cost >= 999 || apSim < cost) break;
        apSim -= cost;
        splitIdx = i + 1;
      }

      // 本旬可达段（亮色实线）
      if(splitIdx > 0){
        let pts = `${startPos.x.toFixed(1)},${startPos.y.toFixed(1)}`;
        for(let i = 0; i < splitIdx; i++){
          const pp = hexToPixel(preview.hexPath[i].col, preview.hexPath[i].row);
          pts += ` ${pp.x.toFixed(1)},${pp.y.toFixed(1)}`;
        }
        h += `<polyline points="${pts}" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="3.5" stroke-linecap="round" pointer-events="none"/>`;
        h += `<polyline points="${pts}" fill="none" stroke="rgba(26,122,58,.7)" stroke-width="2.2"
          stroke-linecap="round" pointer-events="none"/>`;
      }

      // 跨旬段（暗色虚线）
      if(splitIdx < preview.hexPath.length){
        const bridgeHp = splitIdx > 0 ? preview.hexPath[splitIdx-1] : {col: selUnit.hq, row: selUnit.hr};
        let pts2 = '';
        const bp = hexToPixel(bridgeHp.col, bridgeHp.row);
        pts2 += `${bp.x.toFixed(1)},${bp.y.toFixed(1)}`;
        for(let i = splitIdx; i < preview.hexPath.length; i++){
          const pp = hexToPixel(preview.hexPath[i].col, preview.hexPath[i].row);
          pts2 += ` ${pp.x.toFixed(1)},${pp.y.toFixed(1)}`;
        }
        h += `<polyline points="${pts2}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3" stroke-linecap="round" pointer-events="none"/>`;
        h += `<polyline points="${pts2}" fill="none" stroke="rgba(138,106,16,.45)" stroke-width="1.5"
          stroke-dasharray="5,3" pointer-events="none"/>`;
      }

      // 终点标记：闪烁圆圈 + 旬数
      const lastHp = preview.hexPath[preview.hexPath.length - 1];
      const lastPos = hexToPixel(lastHp.col, lastHp.row);
      const invS = 1 / _mapScale;
      h += `<circle cx="${lastPos.x}" cy="${lastPos.y}" r="${12*invS}" fill="rgba(138,106,16,.10)" stroke="rgba(138,106,16,.65)" stroke-width="${1.5*invS}" stroke-dasharray="4,2" pointer-events="none">
        <animate attributeName="r" values="${10*invS};${14*invS};${10*invS}" dur="1.2s" repeatCount="indefinite"/>
      </circle>`;
      // 旬数标签（v99: 本旬可达显示绿色"本旬抵达"）
      const canReachThisTurn = splitIdx >= preview.hexPath.length;
      const labelText = canReachThisTurn
        ? (preview.label ? preview.label + ' ' : '') + '本旬抵达'
        : (preview.label ? preview.label + ' ' : '') + '约' + preview.turns + '旬';
      const labelCol = canReachThisTurn ? 'rgba(26,122,58,.8)' : 'rgba(138,106,16,.85)';
      const labelBorder = canReachThisTurn ? 'rgba(26,122,58,.5)' : 'rgba(138,106,16,.5)';
      h += `<g transform="translate(${lastPos.x},${(lastPos.y - 14*invS).toFixed(1)})" pointer-events="none">
        <rect x="${-30*invS}" y="${-7*invS}" width="${60*invS}" height="${14*invS}" rx="${3*invS}"
          fill="rgba(245,238,225,.94)" stroke="${labelBorder}" stroke-width="${0.8*invS}"/>
        <text x="0" y="${1*invS}" text-anchor="middle" dominant-baseline="middle"
          font-family="Noto Serif SC,serif" font-size="${8*invS}" fill="${labelCol}"
          font-weight="700">${labelText}</text>
      </g>`;
      // 提示文字："再次点击确认"（仅远距离需确认时显示）
      if(!canReachThisTurn || preview.hexPath.length > 2){
        h += `<g transform="translate(${lastPos.x},${(lastPos.y + 10*invS).toFixed(1)})" pointer-events="none">
          <text x="0" y="0" text-anchor="middle" dominant-baseline="middle"
            font-family="Noto Serif SC,serif" font-size="${6.5*invS}" fill="rgba(138,106,16,.5)"
            font-weight="400">再次点击确认</text>
        </g>`;
      }
    }
  }

  return h;
}




// ════════════════════════════════════════════════════════════════════
// ── R4.2.d 部队详情面板 (v181 L9899-L10195) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 右侧面板：部队详情
// ═══════════════════════════════════════════════════════
function renderUnitDetail(c){
  const unit=G.units.find(u=>u.id===G.selUnitId);
  if(!unit){renderMilTab(c);return;}
  const col=getFactionDef(unit.fac)?.color||'#888';
  const isPlayer=unit.fac===G.playerFac;
  const ap=calcUnitAP(unit);
  const total=getUnitTroops(unit);
  const troopType=getMainTroopType(unit);
  const _uhp3=hexToPixel(unit.hq??0,unit.hr??0); const atPx=_uhp3.x,atPy=_uhp3.y;
  const _dpos=getUnitDisplayPos(unit);
  const atCityId2 = getUnitNodeId(unit);
  const atCity = atCityId2 ? G.cities[atCityId2] : null;
  const atPlayerCity=atCity&&atCity.fac===G.playerFac&&unit.status==='garrison';
  const terrain=getTerrainAt(unit.hq,unit.hr);
  const allGens=G.generals[unit.fac]||[];
  const turnsLeft = (unit.hexPath && unit.hexPath.length > 0) ? Math.max(1, Math.ceil(calcHexPathCost(unit.hexPath, getMainTroopType(unit), isUnitOnWater(unit)) / calcUnitAP(unit))) : 0; // ★ v179fix P9
  const foodCost=Math.floor(total*getUnitFoodRate(unit));

  // v97: 敌方部队 → 模糊情报面板
  const isEnemy = !isPlayer && !canSeeFactionData(G.playerFac, unit.fac);
  if (isEnemy) {
    const _si = getScoutINT(unit);
    const backBtn=`<div style="margin-bottom:8px">
      <button class="act-btn" style="font-size:9px;padding:2px 8px;opacity:.6"
        onclick="G.selUnitId=null;renderAllLight()">← 返回部队列表</button>
    </div>`;
    const titleName = fuzzyGenDisplay(unit, _si);
    // 编制信息（按INT分层）
    let squadHtml = '';
    if (_si >= 90) {
      squadHtml = unit.squads.map((sq,i) => {
        const td = TROOP_TYPES[sq.type]||{icon:'?',name:sq.type};
        const gd = GEN_MAP[sq.genName]||{com:70,war:70,int:70};
        return `<div class="ud-squad">
          <div class="ud-squad-header">
            <span class="ud-squad-label">${i===0?'主将':'副将'}</span>
            <span class="ud-squad-gen">${sq.genName}</span>
            <span class="ud-squad-type">${td.icon} ${td.name}</span>
          </div>
          <div class="ud-attrs">
            ${[['统',gd.com],['武',gd.war],['智',gd.int]].map(([l,v])=>{
              const c2=v>=90?'#8a7040':v>=75?'#1a7a3a':v>=60?'#1a5f8a':'#666';
              return`<span class="ud-attr" style="color:${c2};border-color:${c2}30">${l}${v}</span>`;
            }).join('')}
          </div>
        </div>`;
      }).join('');
    } else if (_si >= 75) {
      squadHtml = unit.squads.map((sq,i) => {
        const td = TROOP_TYPES[sq.type]||{icon:'?',name:sq.type};
        return `<div class="ud-squad">
          <div class="ud-squad-header">
            <span class="ud-squad-label">${i===0?'主将':'副将'}</span>
            <span class="ud-squad-gen">${sq.genName}</span>
            <span class="ud-squad-type">${td.icon} ${td.name}</span>
          </div>
        </div>`;
      }).join('');
    } else if (_si >= 60) {
      squadHtml = `<div class="ud-squad"><div class="ud-squad-header">
        <span class="ud-squad-label">主将</span>
        <span class="ud-squad-gen">${unit.squads[0]?.genName||'?'}</span>
      </div></div>`;
    } else {
      squadHtml = `<div style="font-size:10px;color:rgba(92,74,50,.35);padding:8px 0">将领身份不明</div>`;
    }
    const intelLabel = _si >= 90 ? '情报精确' : _si >= 75 ? '情报较清晰' : _si >= 60 ? '情报模糊' : '情报极模糊';
    const intelCol = _si >= 90 ? '#1a7a3a' : _si >= 75 ? '#2a7a9a' : _si >= 60 ? '#8a6a10' : '#b04040';
    c.innerHTML = `
      ${backBtn}
      <div class="cd-name" style="color:${col}">${titleName}</div>
      <div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:10px">
        ${getFactionDef(unit.fac)?.full} · ${atCity?atCity.name:'野外'} ·
        ${unit.status==='garrison'?'🛡驻扎':'⚔行军'}
      </div>
      <div style="font-size:9px;color:${intelCol};margin-bottom:10px;padding:4px 8px;border:1px solid ${intelCol}30;border-radius:3px">
        🔍 ${intelLabel}
      </div>
      <div class="sec">侦知编制</div>
      <div class="ud-squads">${squadHtml}</div>
      <div class="sec">侦知兵力</div>
      <div class="ud-stats">
        <div class="ud-stat-row"><span>兵力</span><b>${fuzzyTroopDisplay(total, _si)}</b></div>
      </div>
    `;
    return;
  }

  const squadRows=unit.squads.map((sq,i)=>{
    const td=TROOP_TYPES[sq.type]||{icon:'?',name:sq.type};
    const gd=GEN_MAP[sq.genName]||{com:70,war:70,int:70};
    const mCol=sq.morale>=70?'#1a7a3a':sq.morale>=40?'#8a6a10':'#c03030';
    const _sqMustering = !!sq._musterTarget; // ★ v114
    const canExpand=atPlayerCity&&unit.status==='garrison'&&(sq.maxTroops||sq.troops)<getSquadMax(unit.fac)
      &&unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0)<getUnitMax(unit.fac)&&!_sqMustering;
    const expandBtn=canExpand?
      `<button class="act-btn" style="margin-top:3px;font-size:9px;padding:3px 8px;border-color:rgba(100,180,255,.4);color:rgba(100,180,255,.8)"
        onclick="openExpandModal('${unit.id}',${i})">
        ⬆ 扩编（上限${fmt(getSquadMax(unit.fac))}）
      </button>`:'';
    // ★ v167: 显示当前生效标签
    const _sqCls = getSquadClass(sq);
    const _sqClsMeta = CLASS_META[_sqCls]||CLASS_META.warrior;
    const _sqClsTag = `<span class="gen-class-tag ${_sqCls}">${_sqClsMeta.icon}${_sqClsMeta.label}</span>`;
    return `<div class="ud-squad">
      <div class="ud-squad-header">
        <span class="ud-squad-label">${i===0?'主将':'副将'}</span>
        <span class="ud-squad-gen">${sq.genName}</span>
        ${_sqClsTag}
        <span class="ud-squad-type">${td.icon} ${td.name}</span>
        <span class="ud-squad-troops">${fmt(sq.troops)}/${fmt(sq.maxTroops||sq.troops)}兵${getRetainers(sq.genName)>0?` <span style="color:#8a7040;font-size:8px">（部曲${fmt(getRetainersDisplay(sq.genName))}）</span>`:''}</span>
      </div>
      ${getRetainers(sq.genName)>0?`<div style="font-size:8px;color:rgba(138,112,64,.6);margin:-2px 0 2px 0">有效等级 Lv${getEffectiveSquadLevel(sq, unit.level||1)}${getEffectiveSquadLevel(sq, unit.level||1)!==(unit.level||1)?' <span style="color:#1a7a3a">▲'+(getEffectiveSquadLevel(sq, unit.level||1)-(unit.level||1))+'</span>':''}</div>`:''}
      ${sq._musterTarget ? (()=>{
        const pct = Math.min(100, Math.round(((sq._mustered||0) / sq._musterTarget) * 100));
        const mRate = atPlayerCity ? getMusterRate(atPlayerCity.id) : 2000;
        const remain = sq._musterTarget - (sq._mustered||0);
        const estT = remain > 0 ? Math.ceil(remain / mRate) : 0;
        return `<div style="margin:3px 0 2px;font-size:8px;color:rgba(92,74,50,.55)">
          🏰 集结中 ${fmt(sq._mustered||0)}/${fmt(sq._musterTarget)} (${pct}%)${estT>0?' · 约'+estT+'旬':''}
        </div>
        <div style="height:3px;background:rgba(80,65,40,.10);border-radius:2px;margin-bottom:3px">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6b5530,#e8c84a);border-radius:2px;transition:width .3s"></div>
        </div>`;
      })() : ''}
      <div class="ud-attrs">
        ${[['统',gd.com],['武',gd.war],['智',gd.int]].map(([l,v])=>{
          const c2=v>=90?'#8a7040':v>=75?'#1a7a3a':v>=60?'#1a5f8a':'#666';
          return`<span class="ud-attr" style="color:${c2};border-color:${c2}30">${l}${v}</span>`;
        }).join('')}
        ${sq.type&&gd.apt?`<span class="ud-attr" style="color:#6b5530;border-color:#6b553030">适${gd.apt[TROOP_TYPES[sq.type]?.baseType||sq.type]||'?'}</span>`:''}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(92,74,50,.45);margin-bottom:2px">
        <span>士气</span><span style="color:${mCol}">${sq.morale}${(()=>{
          const _fm=getFactionMoraleMod(sq.genName, unit.fac);
          if(_fm<=-5) return ' <span style="color:#c03030;font-size:8px">派系'+_fm+'</span>';
          if(_fm>=5)  return ' <span style="color:#4caf50;font-size:8px">派系+'+_fm+'</span>';
          return '';
        })()}</span>
      </div>
      <div class="ud-morale-bar"><div class="ud-morale-bar-fill" style="width:${sq.morale}%;background:${mCol}"></div></div>
      ${expandBtn}
    </div>`;
  }).join('');

  // ★ v120: 增编分队按钮 (v121fix: +整备/集结检查)
  const _canAddSq = atPlayerCity && unit.status==='garrison' && unit.squads.length < 3
    && unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0) < getUnitMax(unit.fac)
    && _getIdleGens(G.playerFac).length > 0 && unit.fac === G.playerFac
    && (unit.mobilizingTurns||0) <= 0 && !isUnitMustering(unit);
  const _addSquadBtn = _canAddSq
    ? '<button class="act-btn" style="margin:4px 0 8px;font-size:10px;padding:4px 12px;border-color:rgba(42,122,154,.5);color:rgba(42,122,154,.85);width:100%;text-align:center" onclick="openAddSquadModal(\'' + unit.id + '\')">\uFF0B 增编分队（当前' + unit.squads.length + '/3）</button>'
    : '';

  const backBtn=`<div style="margin-bottom:8px">
    <button class="act-btn" style="font-size:9px;padding:2px 8px;opacity:.6"
      onclick="G.selUnitId=null;renderAllLight()">← 返回部队列表</button>
  </div>`;

  c.innerHTML=`
    ${backBtn}
    <div class="cd-name" style="color:${col}">${unit.squads[0]?.genName} 部</div>
    <div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:10px">
      ${getFactionDef(unit.fac)?.full} · ${atCity?atCity.name:'野外('+terrain+')'} ·
      ${unit.mobilizingTurns>0?`⚙整备中(${unit.mobilizingTurns}旬)`:isUnitMustering(unit)?'🏰集结中':unit.status==='garrison'?'🛡待命':unit.status==='camp'?'🏕扎营中':unit.status==='ambush'?'🌿埋伏中':'⚔行军'}
    </div>
    <div class="sec">编制</div>
    <div class="ud-squads">${squadRows}</div>
    ${(()=>{
      const _ub = getUnitClassBuffs(unit);
      const _lines = [];
      if(_ub.cmdConflict) _lines.push('<span style="color:#c03030">⚠ 双统帅冲突</span>');
      if(_ub.morale>0) _lines.push(`🏴 士气+${_ub.morale}`);
      if(_ub.duelPct>0) _lines.push(`⚔️ 单挑+${Math.round(_ub.duelPct*100)}%`);
      if(_ub.tacticPct>0) _lines.push(`🧠 计谋+${Math.round(_ub.tacticPct*100)}%`);
      if(_ub.supplyRange>0) _lines.push(`📜 补给+${_ub.supplyRange}格`);
      return _lines.length ? `<div style="font-size:9px;color:var(--ink-l);padding:3px 6px;margin:-2px 0 4px;background:rgba(80,65,40,.03);border-radius:3px">${_lines.join(' · ')}</div>` : '';
    })()}
    ${_addSquadBtn}
    ${atPlayerCity?'':`<div style="font-size:9px;color:rgba(92,74,50,.35);margin-bottom:8px">
      扩编需驻扎于己方城市</div>`}
    <div class="sec">状态</div>
    <div class="ud-stats">
      <div class="ud-stat-row"><span>总兵力</span><b>${fmt(total)}</b></div>
      <div class="ud-stat-row"><span>部队等级</span><b>Lv ${Math.round(unit.level||1)} <span style="color:rgba(92,74,50,.40);font-size:9px">经验 ${unit.exp||0}/${(unit.level||1)<UNIT_LEVEL_MAX?(UNIT_LEVEL_EXP[(Math.round(unit.level||1))-1]||'MAX'):'MAX'}</span></b></div>
      <div class="ud-stat-row clickable-val" onclick="showUnitBreakdown(event,'combat','${unit.id}')">
        <span>攻击 <span style="font-size:9px;opacity:.5">▸</span></span>
        <b style="color:#8a6a10">${fmt(Math.round(calcUnitATK(unit)))}</b>
      </div>
      <div class="ud-stat-row clickable-val" onclick="showUnitBreakdown(event,'combat','${unit.id}')">
        <span>防御 <span style="font-size:9px;opacity:.5">▸</span></span>
        <b style="color:#5ad0a0">${fmt(Math.round(calcUnitDEF(unit)))}</b>
      </div>
      <div class="ud-stat-row clickable-val" onclick="showUnitBreakdown(event,'reinforce','${unit.id}')">
        <span>补员速度 <span style="font-size:9px;opacity:.5">▸</span></span>
        <b>${(()=>{ const _terr=_buildTerritoryMap(); const _tk=hkey(unit.hq??0,unit.hr??0); const _t=_terr[_tk]; if(!_t||_t.fac!==unit.fac) return '<span style="color:rgba(92,74,50,.35)">领土外停止</span>'; const nearCity=G.cities[_t.cityId]; if(!nearCity) return '<span style="color:rgba(92,74,50,.35)">领土外停止</span>'; const inCity=_t.dist<=1; const BASE=200; const inCityM=inCity?1.5:1.0; const frontPopM=Math.min(3.0,Math.max(0.5,nearCity.pop/150000)); const _fTP=Object.values(G.cities).filter(c=>c.fac===unit.fac).reduce((s,c)=>s+c.pop,0); const rearPopM=Math.min(2.0,Math.max(0.5,_fTP/2500000)); const _pol=POLICY.find(p=>p.id===(G.factions[unit.fac]?.policyId||'bal'))||POLICY[1]; const _rb=G.factions[unit.fac]?._postBuffs?.reinforce||0; const fr=Math.floor(BASE*frontPopM*inCityM*_pol.front*0.68*(1+_rb)); const rr=Math.floor(BASE*rearPopM*2.0*_pol.rear*(1+_rb)); const t=getCityFoodTurns(nearCity); const fm=t<2?0:t<5?0.5:1.0; const eff=Math.floor(Math.max(BASE,fr+rr)*fm); return fmt(eff)+'兵/旬/队'+(inCity?' 🏠':''); })()}</b>
      </div>
      <div class="ud-stat-row"><span>行动力</span><b>AP ${ap}/旬</b></div>
      <div class="ud-stat-row"><span>粮耗</span><b class="neg">${fmt(foodCost)}/旬${
        unit.status==='camp'?`<span style="color:#2a7a9a;font-size:9px">（扎营-35%）</span>`:
        unit.status==='ambush'?`<span style="color:#8040a0;font-size:9px">（埋伏-20%）</span>`:
        unit.status==='siege'?`<span style="color:#8a7030;font-size:9px">（围城×1.5）</span>`:
        ''}</b></div>
      ${turnsLeft?`<div class="ud-stat-row" style="color:#8a6a10">
        <span>行进中</span><b>约${turnsLeft}旬到达</b></div>`:''}
    </div>
    ${isPlayer?`<div class="sec">行动</div>
    <div style="display:flex;flex-direction:column;gap:5px">
      ${(()=>{
        const btns=[];
        if(unit.mobilizingTurns>0){
          // 整备中：不可移动
          btns.push(`<div style="font-size:9px;color:#8a6a10;padding:4px 0;border:1px solid rgba(138,106,16,.15);text-align:center">⚙ 整备中・还需 ${unit.mobilizingTurns} 旬</div>`);
        } else {
          // 扎营/埋伏中：只允许解除
          if(unit.status==='camp'){
            if(unit.campMobilizeTurns>0){
              btns.push(`<div style="font-size:9px;color:#8a6a10;padding:4px 0;border:1px solid rgba(138,106,16,.15);text-align:center">🏕 拔营中・还需 ${unit.campMobilizeTurns} 旬</div>`);
            } else {
              btns.push(`<div style="font-size:9px;color:#2a7a9a;padding:4px 0;border:1px solid rgba(96,184,224,.2);text-align:center">🏕 扎营中・粮耗-35%・军饷照付</div>`);
              btns.push(`<button class="act-btn" onclick="cancelSpecialStatus('${unit.id}')">↩ 拔营（需${CAMP_MOBILIZE_TURNS}旬整备）</button>`);
            }
          } else if(unit.status==='ambush'){
            btns.push(`<div style="font-size:9px;color:#8040a0;padding:4px 0;border:1px solid rgba(192,96,224,.2);text-align:center">🌿 埋伏中・静候敌军</div>`);
            btns.push(`<button class="act-btn" onclick="cancelSpecialStatus('${unit.id}')">↩ 解除埋伏</button>`);
          } else if(unit.status==='siege'){
            const sCity = unit.siegeTarget ? G.cities[unit.siegeTarget] : null;
            const decayPct = sCity ? Math.round((sCity.siegeDecay||0)*100) : 0;
            const defMult = sCity ? getSiegeDefMult(sCity) : 1.0;
            const defMultStr = defMult.toFixed(2);
            const siegeTurns = unit._siegeTurnCount || 0;
            const sizeLabel = {small:'小城',medium:'中城',large:'大城'}[sCity?.size||'medium']||'';
            const maxTurns = SIEGE_MAX_TURNS[sCity?.size||'medium']||9;
            const turnsLeft = Math.max(0, Math.ceil((1-(sCity?.siegeDecay||0))*maxTurns));
            const barCol = decayPct>70?'#1a8a45':decayPct>35?'#8a7030':'#e07040';
            // 围城信息面板
            btns.push('<div style="padding:8px 10px;border:1px solid rgba(232,192,64,.3);background:rgba(245,240,228,.6);border-radius:5px;line-height:1.6">' +
              '<div style="font-size:11px;color:#f0e080;font-weight:700;margin-bottom:6px">🏰 围攻 ' + (sCity?.name||'?') + '（' + sizeLabel + '）</div>' +
              // 进度条
              '<div style="font-size:9px;color:rgba(44,36,22,.50);margin-bottom:3px">围城进度</div>' +
              '<div style="height:8px;background:rgba(80,65,40,.12);border-radius:4px;overflow:hidden;margin-bottom:4px">' +
              '<div style="width:' + decayPct + '%;height:100%;background:' + barCol + ';border-radius:4px;transition:width .3s"></div></div>' +
              '<div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(44,36,22,.40);margin-bottom:8px">' +
              '<span>已围 <b style="color:rgba(44,36,22,.65)">' + siegeTurns + '</b> 旬</span>' +
              '<span>' + (decayPct>=100?'城防已瓦解':'约 <b style="color:rgba(44,36,22,.65)">' + turnsLeft + '</b> 旬围满') + '</span></div>' +
              // 城防信息
              '<div style="font-size:10px;color:rgba(44,36,22,.55);line-height:1.8">' +
              '守方城防加成：<b style="color:' + (defMult<=1.05?'#1a8a45':defMult<=1.15?'#8a7030':'#e07040') + '">×' + defMultStr + '</b>' +
              (decayPct<100?' → 围满后降至 <b style="color:#1a8a45">×1.00</b>':'') +
              (()=>{ const _gd=getGentryDefMult(unit.siegeTarget); return _gd>=1.20?'<br><span style="color:#4caf50">豪族协防 ×'+_gd.toFixed(2)+'</span>':_gd<=0.55?'<br><span style="color:#c0392b">豪族抗拒 ×'+_gd.toFixed(2)+'</span>':_gd<=0.75?'<br><span style="color:#e67e22">豪族不满 ×'+_gd.toFixed(2)+'</span>':_gd<=0.92?'<br><span style="color:#8a6a10">豪族松懈 ×'+_gd.toFixed(2)+'</span>':''; })() + '</div>' +
              '<div style="font-size:9px;color:rgba(92,74,50,.35);margin-top:4px">💡 可随时攻城，围久城防越弱、攻城越有利</div>' +
              '</div>');
            // ★ 攻城按钮（大号醒目）
            btns.push('<button onclick="launchSiegeAttack(\'' + unit.id + '\')" style="' +
              'display:block;width:100%;padding:10px 0;margin-top:6px;' +
              'font-size:13px;font-weight:700;color:#c03030;' +
              'background:rgba(192,48,48,.12);' +
              'border:2px solid rgba(192,48,48,.35);border-radius:6px;cursor:pointer;' +
              'letter-spacing:1px' +
              '">⚔ 立即攻城（城防×' + defMultStr + '）</button>');
            // 撤围按钮
            btns.push('<button onclick="cancelSiege(\'' + unit.id + '\')" style="' +
              'display:block;width:100%;padding:7px 0;margin-top:4px;' +
              'font-size:11px;color:rgba(92,74,50,.65);' +
              'background:rgba(80,65,40,.08);' +
              'border:1px solid rgba(92,74,50,.25);border-radius:5px;cursor:pointer' +
              '">🚶 撤围退兵</button>');
          } else {
          // 正常状态：可移动、可驻扎
          btns.push(`<button class="act-btn" onclick="startMoveFromPanel('${unit.id}')">🗺 点击目标出发 / 点击敌军出击</button>`);
          if(unit.hexPath&&unit.hexPath.length>0){
            btns.push(`<button class="act-btn" onclick="cancelUnitMove('${unit.id}')">✕ 取消移动指令</button>`);
          }
          // 扎营按钮（野外任意地形均可，消耗金+木）— ★ v136: garrison状态不显示
          if(unit.status !== 'garrison'){
          btns.push(`<button class="act-btn" onclick="setCamp('${unit.id}')" style="color:#2a7a9a;border-color:rgba(96,184,224,.3)">🏕 扎营（金${CAMP_COST.gold}·木${CAMP_COST.wood}·粮耗-35%）</button>`);
          // 埋伏按钮（任意地形可用，显示当前地形成功率）
          const _terrain=getTerrainAt(unit.hq,unit.hr);
          const _ambushPctMap={mountain:'65%',forest:'55%',hill:'40%',plain:'15%',road:'15%',water:'5%'};
          const _ambushPct=_ambushPctMap[_terrain]||'15%';
          const _ambushWarnStr=(_terrain==='plain'||_terrain==='road')?' ⚠平原':(_terrain==='water')?' ⚠水路':'';
          btns.push('<button class="act-btn" onclick="setAmbush(\'' + unit.id + '\')" style="color:#8040a0;border-color:rgba(128,64,160,.2)">🌿 埋伏 <span style="font-size:9px;color:rgba(192,96,224,.55)">中伏率' + _ambushPct + _ambushWarnStr + '</span></button>');
          }
          // ★ v113: 遣散休整按钮（选大城弹窗，不要求当前在城内）
          btns.push(`<button class="act-btn" onclick="billetUnit('${unit.id}')" style="color:#1a5f8a;border-color:rgba(64,144,224,.3)">
            🏠 休整屯田（保留老兵，释放武将）
          </button>`);
          } // end else (normal state)
        } // end outer else (not billeted/mobilizing)
        btns.push(`<button class="act-btn" style="color:#c03030;border-color:rgba(200,60,60,.3)" onclick="disbandUnit('${unit.id}')">⚠ 解散部队</button>`);
        return btns.join('');
      })()}
    </div>`:''}`;
}
