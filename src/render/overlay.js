// src/render/overlay.js
//
// 渲染层(R)— 地图叠加层系统(v42 新增 / v78 不透明底层 / v134 水墨风)。
//
// 来源:从 project_romance_v181.html L1593-L1934 抽离(Phase 4 / Sub-session 4.1,渲染层第二轮启动)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// overlay 子系统是单关注点(地图叠加层),完整搬过来包括:
//   - 玩家入口 toggleOverlay(切换 _activeOverlay state)
//   - 主入口 renderOverlay(根据 _activeOverlay 派发到 5 specific)
//   - 5 specific overlay(faction / gold / food / supply / foodflow)
//   - 底层 + BFS 领地缓存(_buildTerritoryMap / _renderOvBase)
//   - 全部 lets + consts(不分散保持单文件原子性)
//
// ── 抽离范围(2 段,完整 overlay 子系统)──
//   R4.1.a overlay state + 入口         v181 L1596-L1654 (2 lets + 2 funcs)
//                                        _activeOverlay (let)
//                                        / toggleOverlay / renderOverlay
//   R4.1.b BFS 领地 + 底层 + 5 specific  v181 L1659-L1933 (2 const + 4 lets +
//                                                          1 BFS helper +
//                                                          1 底层 helper +
//                                                          5 specific overlay)
//                                        _OV_RADIUS / _OV_FAC_RGB (const)
//                                        _ovTerritoryCache / _ovTerritoryTurn /
//                                        _ovBaseCache / _ovBaseTurn (lets)
//                                        _buildTerritoryMap / _renderOvBase
//                                        renderOverlayFaction / renderOverlayGold /
//                                        renderOverlayFood / renderOverlaySupply /
//                                        renderOverlayFoodFlow
//
// 函数总数: 2 + 1 + 1 + 5 = **9 函数 + 2 const + 5 lets**
//
// ── 留 v181 ──
//   `renderAll` (L1578) 是主渲染入口,跨 chain 调度,不归 overlay
//   UI button 元素 (`#ov-btn-faction` 等) 在 HTML shell,不动
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `_activeOverlay` (overlay 显示 mode)
//   - `_ovTerritoryCache / _ovTerritoryTurn` (BFS 领地缓存)
//   - `_ovBaseCache / _ovBaseTurn` (底层缓存)
//   - DOM `#ovRoot` SVG <g> innerHTML (overlay 渲染输出)
//   - DOM `#ov-btn-*` button style (按钮高亮)
//
// **跨链读取**(read-only,不写他链):
//   - G.cities / G.turn / G.units / G.playerFac (read)
//   - getCityProd / getCityFoodCost (经济链 read)
//   - buildSupplyMap (军事链 read)
//   - HEX_TERRAIN / HEX_COLS / HEX_ROWS / HEX_PATH / hexToPixel / hexNeighbors / hkey / hparse (map 数据 read)
//   - CITIES_DEF (城市数据 read)
//   - _mapTx / _mapTy / _mapScale (v181 顶层 lets,留 v181)
//
// ── 接口风格 ──
// 全局函数 + lets + const(同 v181 + 已抽 src/data/ + src/core/ + src/chains/ + src/render/ phase 2
// 模块共享 hoisted function 全局可见,无 import/export)。
//
// `_OV_RADIUS / _OV_FAC_RGB` 是 top-level **const**(已 phase 3.4 验证 const 跨 classic <script> 共享)。
// `_activeOverlay / _ovTerritoryCache / _ovTerritoryTurn / _ovBaseCache / _ovBaseTurn` 是 top-level **let**
// (跨 classic <script> 跨文件可读写, phase 2 验证)。

// ════════════════════════════════════════════════════════════════════
// ── R4.1.a overlay state + 入口 (v181 L1596-L1654) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 叠加层系统（v42新增）
// ═══════════════════════════════════════════════════════
let _activeOverlay=null; // null | 'terrain'|'faction'|'gold'|'food'|'foodflow'|'supply'

function toggleOverlay(name){
  if(_activeOverlay===name){
    _activeOverlay=null;
  } else {
    _activeOverlay=name;
  }
  // 更新按钮高亮
  ['faction','gold','food','foodflow','supply'].forEach(k=>{
    const btn=document.getElementById('ov-btn-'+k);
    if(!btn) return;
    if(k===_activeOverlay){
      btn.style.borderColor='rgba(44,36,22,.7)';
      btn.style.color='rgba(44,36,22,.9)';
      btn.style.background='rgba(220,210,190,.95)';
    } else {
      btn.style.borderColor='rgba(80,65,40,.2)';
      btn.style.color='rgba(92,74,50,.55)';
      btn.style.background='rgba(245,238,225,.85)';
    }
  });
  renderOverlay();
}

function renderOverlay(){
  // 叠加层渲染到 SVG 内的独立 <g id="ovRoot">
  const svg=document.getElementById('mapSvg');
  if(!svg) return;
  let ovEl=document.getElementById('ovRoot');
  if(!ovEl){
    ovEl=document.createElementNS('http://www.w3.org/2000/svg','g');
    ovEl.id='ovRoot';
    ovEl.style.pointerEvents='none';
    svg.appendChild(ovEl);
  }
  if(!_activeOverlay){ ovEl.innerHTML=''; return; }

  // 叠加层内容生成（在 mapRoot 坐标系内，含 translate+scale）
  const tx=_mapTx.toFixed(1), ty=_mapTy.toFixed(1), sc=_mapScale.toFixed(4);

  // ★ v78: 不透明底层覆盖所有hex，隐藏地形颜色
  let base = _renderOvBase();
  let inner='';

  if(_activeOverlay==='faction'){
    inner=renderOverlayFaction();
  } else if(_activeOverlay==='gold'){
    inner=renderOverlayGold();
  } else if(_activeOverlay==='food'){
    inner=renderOverlayFood();
  } else if(_activeOverlay==='foodflow'){
    inner=renderOverlayFoodFlow();
  } else if(_activeOverlay==='supply'){
    inner=renderOverlaySupply();
  }

  ovEl.innerHTML=`<g transform="translate(${tx},${ty}) scale(${sc})">${base}${inner}</g>`;
}

// ════════════════════════════════════════════════════════════════════
// ── R4.1.b BFS 领地 + 底层 + 5 specific overlay (v181 L1659-L1933) ──
// ════════════════════════════════════════════════════════════════════

// ─── 势力染色叠加层系统（v78：不透明单层纯色，完全覆盖底图） ───

// BFS领地缓存
const _OV_RADIUS = {large:10, medium:7, small:5};
let _ovTerritoryCache = null;
let _ovTerritoryTurn = -1;

function _buildTerritoryMap(){
  if(_ovTerritoryCache && _ovTerritoryTurn === G.turn) return _ovTerritoryCache;
  const territory = {};
  CITIES_DEF.forEach(def => {
    const city = G.cities[def.id]; if(!city) return;
    const fac = city.fac; if(!fac || fac==='rebel') return;
    const radius = (_OV_RADIUS[def.size]||5) + (def.isCapital ? 2 : 0);
    const queue = [{col:def.q, row:def.r, dist:0}];
    const visited = new Set();
    visited.add(hkey(def.q, def.r));
    while(queue.length){
      const {col, row, dist} = queue.shift();
      const k = hkey(col, row);
      const terrain = HEX_TERRAIN[k] || 'plain';
      if(dist > 0 && (terrain === 'impassable' || terrain === 'coastal_water' || terrain === 'deep_water')) continue;
      if(!territory[k] || territory[k].dist > dist){
        territory[k] = {fac, cityId:def.id, dist, cityDef:def};
      }
      if(dist < radius){
        hexNeighbors(col, row).forEach(nb => {
          const nk = hkey(nb.col, nb.row);
          if(!visited.has(nk) && nb.col>=0 && nb.col<HEX_COLS && nb.row>=0 && nb.row<HEX_ROWS){
            visited.add(nk);
            queue.push({col:nb.col, row:nb.row, dist:dist+1});
          }
        });
      }
    }
  });

  // 第二轮：无限BFS回填——所有可通行但无主的hex，归入最近已有归属的hex的城市
  // 确保全地图可通行区域100%被覆盖（解决偏远地区盲区）
  {
    const floodQ = [];
    for(const k in territory){
      const {col, row} = hparse(k);
      hexNeighbors(col, row).forEach(nb => {
        const nk = hkey(nb.col, nb.row);
        if(!territory[nk]){
          const t = HEX_TERRAIN[nk] || 'plain';
          if(t !== 'impassable' && t !== 'coastal_water' && t !== 'deep_water'){
            floodQ.push({col:nb.col, row:nb.row, src:territory[k]});
          }
        }
      });
    }
    let qi = 0;
    while(qi < floodQ.length){
      const {col, row, src} = floodQ[qi++];
      const k = hkey(col, row);
      if(territory[k]) continue; // 已被覆盖（可能被更近的城先到）
      const t = HEX_TERRAIN[k] || 'plain';
      if(t === 'impassable' || t === 'coastal_water' || t === 'deep_water') continue;
      territory[k] = {fac:src.fac, cityId:src.cityId, dist:src.dist+1, cityDef:src.cityDef};
      hexNeighbors(col, row).forEach(nb => {
        const nk = hkey(nb.col, nb.row);
        if(!territory[nk]){
          const nt = HEX_TERRAIN[nk] || 'plain';
          if(nt !== 'impassable' && nt !== 'coastal_water' && nt !== 'deep_water'){
            floodQ.push({col:nb.col, row:nb.row, src:territory[k]});
          }
        }
      });
    }
  }

  _ovTerritoryCache = territory;
  _ovTerritoryTurn = G.turn;
  return territory;
}

// 不透明底层：暗底覆盖全图，每旬缓存
function _playerFogLevelAtKey(k) {
  return G.fog?.[G.playerFac] ? (G.fog[G.playerFac][k] ?? FOG_UNEXPLORED) : FOG_VISIBLE;
}

function _playerCityFogLevel(cityId) {
  const def = CITY_MAP?.[cityId];
  if (!def) return FOG_UNEXPLORED;
  return _playerFogLevelAtKey(hkey(def.q, def.r));
}

function _overlayKnownFac(cityId, currentFac) {
  const fogLv = _playerCityFogLevel(cityId);
  if (fogLv === FOG_VISIBLE) return currentFac;
  if (fogLv === FOG_EXPLORED) return G.fogSnap?.[G.playerFac]?.[cityId]?.fac || null;
  return null;
}

function _canShowLiveCityOverlay(cityId) {
  const city = G.cities[cityId];
  if (!city) return false;
  return _playerCityFogLevel(cityId) === FOG_VISIBLE && canSeeFactionData(G.playerFac, city.fac);
}

let _ovBaseCache = null;
let _ovBaseTurn = -1;
let _ovBaseFogVersion = -1;
function _renderOvBase(){
  const fogVersion = (typeof _fogCacheVersion !== 'undefined') ? _fogCacheVersion : 0;
  if(_ovBaseCache && _ovBaseTurn === G.turn && _ovBaseFogVersion === fogVersion) return _ovBaseCache;
  const parts = [];
  for(let c=0; c<HEX_COLS; c++){
    for(let r=0; r<HEX_ROWS; r++){
      const k = hkey(c,r);
      const t = HEX_TERRAIN[k] || 'plain';
      const px = hexToPixel(c,r);
      const fogLv = _playerFogLevelAtKey(k);
      let fill;
      // ★ v134: 水墨风overlay底色——宣纸暖灰
      if(t === 'water')                               fill = 'rgba(180,175,160,.88)';
      if(fogLv === FOG_UNEXPLORED)                    fill = 'rgba(78,82,76,.52)';
      else if(t === 'water')                          fill = 'rgba(180,175,160,.88)';
      else if(t === 'coastal_water' || t === 'deep_water') fill = 'rgba(155,168,178,.90)';
      else if(t === 'impassable')                     fill = 'rgba(80,72,58,.92)';
      else                                            fill = 'rgba(218,210,192,.93)';
      parts.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="${fill}"/>`);
    }
  }
  _ovBaseCache = parts.join('');
  _ovBaseTurn = G.turn;
  _ovBaseFogVersion = fogVersion;
  return _ovBaseCache;
}

// ─── 势力范围：水墨晕染风，中心浓边缘淡 ───
const _OV_FAC_RGB = {
  wei:{r:55,g:85,b:125}, shu:{r:45,g:95,b:60}, wu:{r:150,g:55,b:40}, nanman:{r:139,g:105,b:20}
};
function renderOverlayFaction(){
  const terr = _buildTerritoryMap();
  const hexes = [];
  for(let c=0; c<HEX_COLS; c++){
    for(let r=0; r<HEX_ROWS; r++){
      const k = hkey(c,r);
      const t = HEX_TERRAIN[k] || 'plain';
      if(t === 'coastal_water' || t === 'deep_water' || t === 'impassable') continue;
      if(_playerFogLevelAtKey(k) === FOG_UNEXPLORED) continue;
      if(terr[k]) continue;
      const px = hexToPixel(c,r);
      // ★ v134: 无主地用淡墨灰
      hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(165,155,138,.30)"/>`);
    }
  }
  Object.entries(terr).forEach(([k, {fac, cityId, dist, cityDef}]) => {
    const fogLv = _playerFogLevelAtKey(k);
    if(fogLv === FOG_UNEXPLORED) return;
    const displayFac = _overlayKnownFac(cityId, fac);
    const fc = _OV_FAC_RGB[displayFac]; if(!fc) return;
    const {col, row} = hparse(k);
    const px = hexToPixel(col, row);
    const maxR = (_OV_RADIUS[cityDef.size]||5) + (cityDef.isCapital?2:0);
    // ★ v134: 水墨晕染——中心浓(alpha~0.55)边缘淡(alpha~0.18)
    const alpha = (0.55 - (dist/maxR) * 0.37) * (fogLv === FOG_VISIBLE ? 1 : 0.58);
    hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(${fc.r},${fc.g},${fc.b},${alpha.toFixed(2)})" stroke="rgba(${fc.r},${fc.g},${fc.b},.06)" stroke-width=".3"/>`);
  });
  const FAC_NAME={wei:'曹魏',shu:'蜀汉',wu:'孫吳',nanman:'南蛮'};
  const centers = {};
  CITIES_DEF.forEach(def => {
    const city = G.cities[def.id]; if(!city || !city.fac || city.fac==='rebel') return;
    const displayFac = _overlayKnownFac(def.id, city.fac);
    if(!displayFac) return;
    if(!centers[displayFac]) centers[displayFac] = {sx:0,sy:0,n:0};
    const px = hexToPixel(def.q, def.r);
    centers[displayFac].sx += px.x; centers[displayFac].sy += px.y; centers[displayFac].n++;
  });
  Object.entries(FAC_NAME).forEach(([fac,name]) => {
    const c = centers[fac]; if(!c || !c.n) return;
    const fc = _OV_FAC_RGB[fac]||{r:80,g:65,b:40};
    hexes.push(`<text x="${(c.sx/c.n).toFixed(0)}" y="${(c.sy/c.n).toFixed(0)}" text-anchor="middle" font-family="ZCOOL XiaoWei,Noto Serif SC,serif" font-size="30" font-weight="900" fill="rgba(${fc.r},${fc.g},${fc.b},.18)" pointer-events="none" letter-spacing="10px">${name}</text>`);
  });
  return hexes.join('');
}

// ─── 金钱产出：水墨赭石色系，淡墨→浓赭 ───
function renderOverlayGold(){
  const terr = _buildTerritoryMap();
  const cityGold = {};
  let maxGold = 1;
  CITIES_DEF.forEach(def => {
    if(!_canShowLiveCityOverlay(def.id)) return;
    const city = G.cities[def.id]; if(!city) return;
    const g = getCityProd(city).gold || 0;
    cityGold[def.id] = g;
    if(g > maxGold) maxGold = g;
  });
  const hexes = [];
  Object.entries(terr).forEach(([k, {fac, cityId, dist, cityDef}]) => {
    if(!_canShowLiveCityOverlay(cityId)) return;
    const {col, row} = hparse(k);
    const px = hexToPixel(col, row);
    const val = cityGold[cityId] || 0;
    const intensity = val / maxGold;
    const maxR = (_OV_RADIUS[cityDef.size]||5) + (cityDef.isCapital?2:0);
    const distFade = 1.0 - (dist/maxR) * 0.4;
    const t = intensity * distFade;
    // ★ v134: 赭石墨色——淡灰棕→浓赭石
    const alpha = 0.20 + t * 0.50;
    const cr = Math.round(140 + t * 55);  // 140→195 赭
    const cg = Math.round(115 + t * 25);  // 115→140 石
    const cb = Math.round(75 - t * 20);   // 75→55 暖
    hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(${cr},${cg},${cb},${alpha.toFixed(2)})"/>`);
  });
  hexes.push(`<g transform="translate(8,530)"><rect width="155" height="28" rx="3" fill="rgba(245,238,225,.94)" stroke="rgba(80,65,40,.25)" stroke-width=".8"/><text x="8" y="12" font-family="Noto Serif SC,serif" font-size="8" fill="rgba(44,36,22,.75)">💰 金钱产出</text><rect x="8" y="17" width="55" height="6" rx="2" fill="url(#ovGoldGrad)"/><text x="67" y="23" font-size="6.5" font-family="Noto Serif SC,serif" fill="rgba(44,36,22,.55)">低 → 高</text></g>`);
  hexes.push(`<defs><linearGradient id="ovGoldGrad"><stop offset="0%" stop-color="rgba(140,115,75,.25)"/><stop offset="100%" stop-color="rgba(195,140,55,.70)"/></linearGradient></defs>`);
  return hexes.join('');
}

// ─── 存粮：水墨风——朱砂红/赭黄/松烟绿，半透明晕染 ───
function renderOverlayFood(){
  const terr = _buildTerritoryMap();
  const cityData = {};
  CITIES_DEF.forEach(def => {
    if(!_canShowLiveCityOverlay(def.id)) return;
    const city = G.cities[def.id]; if(!city) return;
    const food = Math.max(0, city.storage||0);
    const foodCost = getCityFoodCost(city);
    cityData[def.id] = {food, turns: foodCost.total > 0 ? food / foodCost.total : 9999};
  });
  const hexes = [];
  Object.entries(terr).forEach(([k, {fac, cityId, dist, cityDef}]) => {
    if(!_canShowLiveCityOverlay(cityId)) return;
    const {col, row} = hparse(k);
    const px = hexToPixel(col, row);
    const d = cityData[cityId]; if(!d) return;
    const maxR = (_OV_RADIUS[cityDef.size]||5) + (cityDef.isCapital?2:0);
    const distAlpha = 0.55 - (dist/maxR) * 0.30;
    // ★ v134: 水墨三色——朱砂/赭黄/松烟
    let cr,cg,cb;
    if(d.turns < 20){      cr=175; cg=50;  cb=40;  } // 朱砂红
    else if(d.turns < 60){ cr=165; cg=130; cb=55;  } // 赭黄
    else {                 cr=60;  cg=120; cb=70;  } // 松烟绿
    hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(${cr},${cg},${cb},${distAlpha.toFixed(2)})"/>`);
  });
  hexes.push(`<g transform="translate(8,520)"><rect width="178" height="28" rx="3" fill="rgba(245,238,225,.94)" stroke="rgba(80,65,40,.25)" stroke-width=".8"/><text x="8" y="12" font-family="Noto Serif SC,serif" font-size="8" fill="rgba(44,36,22,.75)">🌾 存粮（可供旬数）</text><rect x="8" y="17" width="16" height="6" rx="2" fill="rgba(175,50,40,.55)"/><text x="27" y="23" font-size="6.5" font-family="Noto Serif SC,serif" fill="rgba(44,36,22,.55)">&lt;20旬</text><rect x="62" y="17" width="16" height="6" rx="2" fill="rgba(165,130,55,.55)"/><text x="81" y="23" font-size="6.5" font-family="Noto Serif SC,serif" fill="rgba(44,36,22,.55)">20~60旬</text><rect x="124" y="17" width="16" height="6" rx="2" fill="rgba(60,120,70,.55)"/><text x="143" y="23" font-size="6.5" font-family="Noto Serif SC,serif" fill="rgba(44,36,22,.55)">充足</text></g>`);
  return hexes.join('');
}

// ─── 产粮：暗褐→亮绿渐变，一层纯色 ───
// ─── v88: 补给线覆盖层——绿色=补给充足，红色=断补 ───
function renderOverlaySupply(){
  const supplyMap = buildSupplyMap(G.playerFac);
  const hexes = [];
  for(let c=0; c<HEX_COLS; c++){
    for(let r=0; r<HEX_ROWS; r++){
      const k = hkey(c,r);
      if(_playerFogLevelAtKey(k) !== FOG_VISIBLE) continue;
      const t = HEX_TERRAIN[k] || 'plain';
      if(t === 'coastal_water' || t === 'deep_water' || t === 'impassable') continue;
      if(t === 'water') continue;
      const px = hexToPixel(c,r);
      const remaining = supplyMap[k];
      if(remaining !== undefined){
        // ★ v134: 水墨松烟绿——越近越浓
        const intensity = Math.max(0.25, remaining / SUPPLY_MAX_RANGE);
        const alpha = 0.15 + intensity * 0.45;
        hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(55,110,65,${alpha.toFixed(2)})"/>`);
      } else {
        // ★ v134: 断补用淡朱砂
        hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(155,45,35,.30)"/>`);
      }
    }
  }
  // 标注断粮部队
  G.units.filter(u => u.fac === G.playerFac && (u._noSupplyTurns||0) > 0).forEach(u => {
    const px = hexToPixel(u.hq??0, u.hr??0);
    const turns = u._noSupplyTurns;
    const label = turns <= SUPPLY_RATIONS ? `存粮${SUPPLY_RATIONS-turns}旬` : `断粮${turns-SUPPLY_RATIONS}旬`;
    hexes.push(`<circle cx="${px.x}" cy="${px.y}" r="8" fill="none" stroke="rgba(175,50,40,.80)" stroke-width="1.5" stroke-dasharray="3,2">
      <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite"/></circle>`);
    hexes.push(`<text x="${px.x}" y="${px.y-12}" text-anchor="middle" font-family="Noto Serif SC,serif" font-size="7" fill="rgba(175,50,40,.85)" font-weight="700">${label}</text>`);
  });
  // 图例
  hexes.push(`<g transform="translate(8,530)"><rect width="160" height="28" rx="3" fill="rgba(245,238,225,.94)" stroke="rgba(80,65,40,.25)" stroke-width=".8"/>
    <text x="8" y="12" font-family="Noto Serif SC,serif" font-size="8" fill="rgba(44,36,22,.75)">🚚 补给覆盖</text>
    <rect x="8" y="17" width="20" height="6" rx="2" fill="rgba(55,110,65,.55)"/><text x="32" y="23" font-size="6" fill="rgba(44,36,22,.55)">充足</text>
    <rect x="55" y="17" width="20" height="6" rx="2" fill="rgba(155,45,35,.40)"/><text x="79" y="23" font-size="6" fill="rgba(44,36,22,.55)">断补</text>
  </g>`);
  return hexes.join('');
}

function renderOverlayFoodFlow(){
  const terr = _buildTerritoryMap();
  const cityFood = {};
  let maxFood = 1;
  CITIES_DEF.forEach(def => {
    if(!_canShowLiveCityOverlay(def.id)) return;
    const city = G.cities[def.id]; if(!city) return;
    const f = Math.max(0, getCityProd(city).food || 0);
    cityFood[def.id] = f;
    if(f > maxFood) maxFood = f;
  });
  const hexes = [];
  Object.entries(terr).forEach(([k, {fac, cityId, dist, cityDef}]) => {
    if(!_canShowLiveCityOverlay(cityId)) return;
    const {col, row} = hparse(k);
    const px = hexToPixel(col, row);
    const val = cityFood[cityId] || 0;
    const intensity = val / maxFood;
    const maxR = (_OV_RADIUS[cityDef.size]||5) + (cityDef.isCapital?2:0);
    const distFade = 1.0 - (dist/maxR) * 0.4;
    const t = intensity * distFade;
    // ★ v134: 松烟墨绿——淡灰→浓松烟
    const alpha = 0.18 + t * 0.48;
    const cr = Math.round(70 - t * 25);   // 70→45
    const cg = Math.round(85 + t * 55);   // 85→140
    const cb = Math.round(60 + t * 15);   // 60→75
    hexes.push(`<path d="${HEX_PATH}" transform="translate(${px.x.toFixed(1)},${px.y.toFixed(1)})" fill="rgba(${cr},${cg},${cb},${alpha.toFixed(2)})"/>`);
  });
  hexes.push(`<g transform="translate(8,530)"><rect width="155" height="28" rx="3" fill="rgba(245,238,225,.94)" stroke="rgba(80,65,40,.25)" stroke-width=".8"/><text x="8" y="12" font-family="Noto Serif SC,serif" font-size="8" fill="rgba(44,36,22,.75)">📊 粮食产量</text><rect x="8" y="17" width="55" height="6" rx="2" fill="url(#ovFoodGrad)"/><text x="67" y="23" font-size="6.5" font-family="Noto Serif SC,serif" fill="rgba(44,36,22,.55)">低 → 高</text></g>`);
  hexes.push(`<defs><linearGradient id="ovFoodGrad"><stop offset="0%" stop-color="rgba(70,85,60,.22)"/><stop offset="100%" stop-color="rgba(45,140,75,.65)"/></linearGradient></defs>`);
  return hexes.join('');
}
