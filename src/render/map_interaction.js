// ★ v99: 收集玩家当前可见hex集合
function _collectPlayerVisibleKeys(){
  const pFog = G.fog?.[G.playerFac];
  if(!pFog) return new Set();
  const keys = new Set();
  for(const k in pFog){ if(pFog[k] === FOG_VISIBLE) keys.add(k); }
  return keys;
}

// ★ v99: 迷雾揭开动画——在已渲染的迷雾层上叠加临时遮罩，然后渐隐消失
function _animateFogReveal(revealedKeys, oldFogLevels){
  const svg = document.getElementById('mapSvg');
  if(!svg) return;
  // ★ v118fix: 清理上一步残留的揭雾动画层（快速逐格行军时可能堆积）
  const mapRoot = document.getElementById('mapRoot') || svg;
  mapRoot.querySelectorAll('.fog-reveal-anim').forEach(el => el.remove());
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('class', 'fog-reveal-anim');
  g.setAttribute('pointer-events', 'none');
  g.style.transition = 'opacity 0.35s ease-out';
  g.style.opacity = '1';

  revealedKeys.forEach(k => {
    const {col, row} = hparse(k);
    const ter = HEX_TERRAIN[k] || 'plain';
    if(ter === 'impassable' || ter === 'deep_water' || ter === 'coastal_water') return;
    const p = hexToPixel(col, row);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', HEX_PATH);
    path.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
    // ★ v118fix: 遮罩颜色匹配宣纸风迷雾色（浅底深遮挡→浅底浅遮挡渐隐）
    const oldLv = oldFogLevels?.[k] ?? FOG_UNEXPLORED;
    const wasExplored = oldLv >= FOG_EXPLORED;
    path.setAttribute('fill', wasExplored ? 'rgba(170,160,138,.48)' : 'rgba(110,100,80,.93)');
    path.setAttribute('stroke', wasExplored ? 'rgba(155,145,125,.50)' : 'rgba(95,85,68,.95)');
    path.setAttribute('stroke-width', wasExplored ? '0.5' : '0.5');
    g.appendChild(path);
  });

  mapRoot.appendChild(g);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { g.style.opacity = '0'; });
  });
  setTimeout(() => { if(g.parentNode) g.parentNode.removeChild(g); }, 450);
}

// ★ v99/v100: 即时战斗检测（玩家部队移动后，检查是否与敌军接触）
function _checkInstantBattleTrigger(playerUnit){
  if(!playerUnit || getUnitTroops(playerUnit) <= 0) return;

  const sides = collectBattleSides(playerUnit);
  if(!sides) return;
  const { attackers: sideA, defenders: sideB } = sides;
  const nodeLabel = G.cities[getUnitNodeId(playerUnit)]?.name || '野外';

  // 营寨战检测
  const hasCampDef = sideB.some(u => u.status === 'camp');
  if(hasCampDef){
    _pendingBattleConfirms.push({
      playerSide: sideA, enemySide: sideB.filter(u => u.status === 'camp'),
      nodeLabel, campBattle: true, campRole: 'attacker',
    });
  } else {
    // ★ v133cleanup: 野战（攻城统一走围城系统，此处不处理）
    _pendingBattleConfirms.push({
      playerSide: sideA, enemySide: sideB,
      nodeLabel,
      playerIsAttacker: true,
    });
  }
  if(_pendingBattleConfirms.length) setTimeout(_showNextBattleConfirm, 300);
}

function clearMovePreview(){
  G._movePreview = null;
}

// 渲染层 R4.3.d (stack picker _stackPickerOpen + 3 funcs, L9166-L9238) 已抽离到 src/render/notifications.js (Phase 4 / sub-session 4.3)

function onUnitLeftClick(unitId,e){
  if(e)e.stopPropagation();
  closeStackPicker();

  // 若当前选中了己方部队，点击敌方部队 → 直接向其位置进军
  if(G.selUnitId && G.selUnitId!==unitId){
    const attacker=G.units.find(u=>u.id===G.selUnitId);
    const target=G.units.find(u=>u.id===unitId);
    if(attacker && attacker.fac===G.playerFac && target && target.fac!==attacker.fac){
      if(target.hq !== undefined){
        // ★ v133fix: 敌方城市hex上的敌军 → 走城市移动路径（围城），不走野战攻击
        const _tgtHexKey = hkey(target.hq, target.hr);
        const _tgtCityId = HEX_CITY[_tgtHexKey];
        const _tgtCity = _tgtCityId ? G.cities[_tgtCityId] : null;
        const _isOnHostileCity = _tgtCity && _tgtCity.fac !== attacker.fac
          && _tgtCity.fac !== 'none' && isHostile(attacker.fac, _tgtCity.fac);
        if(_isOnHostileCity){
          // 走城市移动（无attackIntent）→ 行军到城旁 → 围城到达弹窗
          issueUnitMove(attacker, target.hq, target.hr, _tgtCityId);
        } else {
          // 野外敌军 → 攻击意图
          issueUnitMove(attacker, target.hq, target.hr, null, true);
        }
      } else {
        showNotif('无法定位目标部队','warn');
      }
      return;
    }
  }

  // ── 检测该格是否有多支部队，有则弹 Stack Picker ──
  const clickedUnit=G.units.find(u=>u.id===unitId);
  if(clickedUnit){
    const pos=getUnitDisplayPos(clickedUnit);
    const stackKey=hkey(clickedUnit.hq??0, clickedUnit.hr??0);
    const stackUnits=G.units.filter(u=>{
      const p=getUnitDisplayPos(u);
      return hkey(u.hq??0, u.hr??0)===stackKey;
    });
    if(stackUnits.length>1){
      showStackPicker(e, stackUnits);
      return;
    }
  }

  if(G.selUnitId===unitId){
    G.selUnitId=null;
    clearMovePreview();
  } else {
    G.selUnitId=unitId;
    clearMovePreview();
    G.activeTab='mil';
    updateTabs();
  }
  renderAllLight();
}

// 部队右键：无特殊操作（取消了旧的moveMode）
function onUnitRightClick(unitId,e){
  e.preventDefault();e.stopPropagation();
}

// 地图右键：取消选中 + 取消预览
function onMapRightClick(e){
  e.preventDefault();
  closeStackPicker();
  if(G._movePreview){
    clearMovePreview();
    renderAllLight();
    return;
  }
  if(G.selUnitId){
    G.selUnitId = null;
    clearMovePreview();
    renderAllLight();
  }
}

// 地图左键点击
function svgEventCoords(e){
  const svg=document.getElementById('mapSvg');
  // 使用 SVG 原生坐标转换（精确处理 preserveAspectRatio 带来的 letterbox 偏移）
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if(!ctm){ // fallback
    const rect=svg.getBoundingClientRect();
    const svgX=(e.clientX-rect.left)*(960/rect.width);
    const svgY=(e.clientY-rect.top)*(740/rect.height);
    return {mx:(svgX-_mapTx)/_mapScale, my:(svgY-_mapTy)/_mapScale};
  }
  const svgPt = pt.matrixTransform(ctm.inverse());
  const mx=(svgPt.x-_mapTx)/_mapScale;
  const my=(svgPt.y-_mapTy)/_mapScale;
  return {mx, my};
}

function handleMapClick(e){
  if(_suppressNextClick){ _suppressNextClick=false; return; }
  if(_marchAnimating) return; // ★ v99: 行军动画中禁用点击
  closeUnitMenu();
  closeStackPicker();

  const {mx,my} = svgEventCoords(e);
  const hex = pixelToHex(mx, my);
  const hexK = hkey(hex.col, hex.row);
  const cityId = HEX_CITY[hexK];

  if(G.selUnitId){
    const unit = G.units.find(u=>u.id===G.selUnitId);
    if(!unit||unit.fac!==G.playerFac){ G.selUnitId=null; clearMovePreview(); renderAllLight(); return; }

    // ── 点击自身位置 → 取消选中 ──
    if(hex.col === unit.hq && hex.row === unit.hr){
      G.selUnitId = null;
      clearMovePreview();
      renderAllLight();
      return;
    }

    // ── 检查hex上是否有可见敌方部队 → 自动转为进军 ──
    // ★ v133fix: 敌方城市hex上的敌军 → 视为进攻城市（走城市移动路径），不走野战攻击
    const pFog = G.fog?.[G.playerFac];
    const isHostileCity = cityId && G.cities[cityId] && G.cities[cityId].fac !== unit.fac
      && G.cities[cityId].fac !== 'none' && isHostile(unit.fac, G.cities[cityId].fac);
    const enemyOnHex = !isHostileCity && G.units.find(eu =>
      eu.fac !== unit.fac &&
      isHostile(unit.fac, eu.fac) &&
      (eu.hq??0) === hex.col && (eu.hr??0) === hex.row &&
      getUnitTroops(eu) > 0 &&
      (!pFog || pFog[hexK] === FOG_VISIBLE)
    );
    if(enemyOnHex){
      // ★ v99: 向敌军进军（攻击意图）
      issueUnitMove(unit, enemyOnHex.hq, enemyOnHex.hr, null, true);
      if(!_marchAnimating) showNotif(`向${enemyOnHex.squads[0]?.genName||'?'}部进军`, 'info');
      return;
    }

    // ── 点击城市 → handleCityClick ──
    if(cityId){
      if(_marchAnimating) return; // ★ v99
      // 城市点击也走预览逻辑
      const destCity = CITY_MAP[cityId];
      if(destCity){
        if(unit.hq === destCity.q && unit.hr === destCity.r){ showNotif('已在该城市','warn'); return; }
        // ★ v99: 短距离城市（1-2格）直接移动
        const cityDist = hexDist(unit.hq??0, unit.hr??0, destCity.q, destCity.r);
        if(cityDist <= 2){
          issueUnitMove(unit, destCity.q, destCity.r, cityId);
          return;
        }
        const prev = G._movePreview;
        if(prev && prev.destCol === destCity.q && prev.destRow === destCity.r){
          // 二次点击确认 → 执行移动
          issueUnitMove(unit, destCity.q, destCity.r, cityId);
          return;
        }
        // 首次点击 → 显示预览
        const result = hexAstar(unit.hq, unit.hr, destCity.q, destCity.r, getMainTroopType(unit), unit.fac);
        if(!result){ showNotif('无法到达该城市','warn'); clearMovePreview(); renderAllLight(); return; }
        const turns = Math.max(1, Math.ceil(result.cost / calcUnitAP(unit)));
        G._movePreview = { destCol: destCity.q, destRow: destCity.r, hexPath: result.path.slice(1), cost: result.cost, turns, label: G.cities[cityId]?.name || cityId };
        renderAllLight();
        return;
      }
      // fallback: 不认识的城市
      handleCityClick(cityId);
      return;
    }

    // ── 普通hex移动：短距直接走，远距预览+确认 ──
    // ★ v99: 动画锁检查
    if(_marchAnimating){ return; }
    const dist = hexDist(unit.hq??0, unit.hr??0, hex.col, hex.row);
    // 短距离（1-2格）：直接移动，不需预览确认
    if(dist <= 2){
      issueUnitMove(unit, hex.col, hex.row);
      return;
    }
    // 远距离：保持预览+二次确认
    const prev = G._movePreview;
    if(prev && prev.destCol === hex.col && prev.destRow === hex.row){
      // 二次点击同一目标 → 确认移动
      issueUnitMove(unit, hex.col, hex.row);
      return;
    }
    // 首次点击 → 计算路径预览
    const result = hexAstar(unit.hq, unit.hr, hex.col, hex.row, getMainTroopType(unit), unit.fac);
    if(!result){
      showNotif('无法到达该位置','warn');
      clearMovePreview();
      renderAllLight();
      return;
    }
    const turns = Math.max(1, Math.ceil(result.cost / calcUnitAP(unit)));
    G._movePreview = { destCol: hex.col, destRow: hex.row, hexPath: result.path.slice(1), cost: result.cost, turns, label: null };
    renderAllLight();
  } else {
    // 无选中部队
    clearMovePreview();
    if(cityId){
      handleCityClick(cityId);
      return;
    }
    G.selCity = null;
    renderAllLight();
  }
}


// 城市点击：选中城市，或（有选中部队时）设为移动目标（带预览确认）
function handleCityClick(cityId){
  if(_marchAnimating) return; // ★ v99
  if(G.selUnitId){
    const unit = G.units.find(u=>u.id===G.selUnitId);
    if(!unit||unit.fac!==G.playerFac) return;
    const destCity = CITY_MAP[cityId];
    if(!destCity){showNotif('找不到目标城市','warn');return;}
    if(unit.hq === destCity.q && unit.hr === destCity.r){showNotif('已在该城市','warn');return;}
    // ★ v99: 短距离直接走
    const cityDist = hexDist(unit.hq??0, unit.hr??0, destCity.q, destCity.r);
    if(cityDist <= 2){
      issueUnitMove(unit, destCity.q, destCity.r, cityId);
      return;
    }
    // v86: 预览+确认
    const prev = G._movePreview;
    if(prev && prev.destCol === destCity.q && prev.destRow === destCity.r){
      issueUnitMove(unit, destCity.q, destCity.r, cityId);
      return;
    }
    const result = hexAstar(unit.hq, unit.hr, destCity.q, destCity.r, getMainTroopType(unit), unit.fac);
    if(!result){ showNotif('无法到达该城市','warn'); clearMovePreview(); renderAllLight(); return; }
    const turns = Math.max(1, Math.ceil(result.cost / calcUnitAP(unit)));
    G._movePreview = { destCol: destCity.q, destRow: destCity.r, hexPath: result.path.slice(1), cost: result.cost, turns, label: G.cities[cityId]?.name || cityId };
    renderAllLight();
  } else {
    G.selCity = cityId;
    G.selUnitId = null;
    clearMovePreview();
    G.activeTab = 'city';
    updateTabs(); renderAll();
  }
}

// ── range C: 地图缩放/平移 module-private state (5 lets/consts, 原 v181 L931-L935) ──
// ── 地图缩放平移状态 ──────────────────────────────────
let _mapScale = 1.0;
let _mapTx = 0, _mapTy = 0;
const _MAP_SCALE_MIN = 0.5, _MAP_SCALE_MAX = 4.0;
let _mapDrag = null;

// ── range D: 地图缩放/平移 funcs + DOMContentLoaded handler + _onDocKeydown + addEventListener (5 funcs + 1 listener install + 1 let _suppressNextClick + 1 let _zoomRenderTimer, 原 v181 L1595-L1710) ──
// ── 地图缩放/平移辅助 ──────────────────────────────────
function _clampMapTransform(){
  const visW=960, visH=740;
  const mapW=960*_mapScale, mapH=740*_mapScale;
  const pad=80;
  _mapTx=Math.min(pad, Math.max(visW-mapW-pad, _mapTx));
  _mapTy=Math.min(pad, Math.max(visH-mapH-pad, _mapTy));
}
function resetMapView(){
  _mapScale=1.2; _mapTx=-100; _mapTy=-50;
  renderMap(); renderOverlay();
}
// ★ v102: 缩放/拖拽性能优化——只更新transform属性，debounce全量渲染
let _zoomRenderTimer = null;
function _applyMapTransformOnly(){
  const root = document.getElementById('mapRoot');
  if(root) root.setAttribute('transform',`translate(${_mapTx.toFixed(1)},${_mapTy.toFixed(1)}) scale(${_mapScale.toFixed(4)})`);
}
function _debouncedMapRender(){
  if(_zoomRenderTimer) clearTimeout(_zoomRenderTimer);
  _zoomRenderTimer = setTimeout(()=>{ _zoomRenderTimer=null; renderMap(); renderOverlay(); }, 180);
}
function zoomMap(delta, cx, cy){
  const oldScale=_mapScale;
  _mapScale=Math.max(_MAP_SCALE_MIN, Math.min(_MAP_SCALE_MAX, _mapScale*(1+delta)));
  _mapTx=cx-(_mapScale/oldScale)*(cx-_mapTx);
  _mapTy=cy-(_mapScale/oldScale)*(cy-_mapTy);
  _clampMapTransform();
  _applyMapTransformOnly();
  _debouncedMapRender();
}

document.addEventListener('DOMContentLoaded',()=>{
  const mapWrap=document.querySelector('.map-wrap');
  if(!mapWrap) return;

  // 滚轮缩放
  mapWrap.addEventListener('wheel',e=>{
    e.preventDefault();
    const svg=document.getElementById('mapSvg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if(!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    zoomMap(e.deltaY<0?0.12:-0.12, svgPt.x, svgPt.y);
  },{passive:false});

  // 左键拖拽地图（mousedown后记录起始，mousemove判断是否触发拖拽）
  let _dragStarted=false, _dragMoved=false;
  mapWrap.addEventListener('mousedown',e=>{
    if(e.button!==0&&e.button!==1) return;
    const svg=document.getElementById('mapSvg');
    const ctm = svg.getScreenCTM();
    if(!ctm) return;
    // 拖拽只需相对位移，记录 client→SVG 的缩放因子
    // getScreenCTM 的 a/d 分量 = SVG单位/屏幕像素 的缩放
    _mapDrag={
      startX:e.clientX, startY:e.clientY,
      startTx:_mapTx, startTy:_mapTy,
      scaleX:1/ctm.a, scaleY:1/ctm.d,
      moved:false
    };
    _dragStarted=true; _dragMoved=false;
    if(e.button===1) e.preventDefault();
  });
  // ★ v154fix M3: 具名函数引用，支持backToTitle中removeEventListener
  function _onDocMouseMove(e){
    if(!_mapDrag) return;
    const dx=(e.clientX-_mapDrag.startX)*_mapDrag.scaleX;
    const dy=(e.clientY-_mapDrag.startY)*_mapDrag.scaleY;
    // 移动超过5px才判断为拖拽（避免误触点击）
    if(!_mapDrag.moved && Math.hypot(dx,dy)<5) return;
    _mapDrag.moved=true; _dragMoved=true;
    _mapTx=_mapDrag.startTx+dx;
    _mapTy=_mapDrag.startTy+dy;
    _clampMapTransform();
    mapWrap.style.cursor='grabbing';
    _applyMapTransformOnly();
    _debouncedMapRender();
  }
  function _onDocMouseUp(e){
    if(_mapDrag){
      const wasDrag=_mapDrag.moved;
      _mapDrag=null; _dragStarted=false;
      mapWrap.style.cursor='';
      // ★ v102: 拖拽结束立即做一次全量渲染（确保反缩放文字正确）
      if(wasDrag){ _suppressNextClick=true; if(_zoomRenderTimer){clearTimeout(_zoomRenderTimer);_zoomRenderTimer=null;} renderMap(); renderOverlay(); }
    }
  }
  document.addEventListener('mousemove', _onDocMouseMove);
  document.addEventListener('mouseup', _onDocMouseUp);
  // 存储引用供backToTitle清理
  window._mapDocMouseMove = _onDocMouseMove;
  window._mapDocMouseUp = _onDocMouseUp;
  // 中键拖拽阻止默认滚动
  mapWrap.addEventListener('mousedown',e=>{ if(e.button===1) e.preventDefault(); });
});

let _suppressNextClick=false;

// ★ v154fix M3: 具名keydown函数，支持backToTitle清理
function _onDocKeydown(e){
  if(e.key==='Escape'){
    if(document.getElementById('saveOverlay')){closeSaveLoadPanel();return;}
    if(document.getElementById('genProfileModal')?.style.display==='flex'){closeGenProfile();return;}
    if(_stackPickerOpen){ closeStackPicker(); return; }
    if(G.selUnitId){G.selUnitId=null;clearMovePreview();renderAllLight();}
    else if(G.selCity){G.selCity=null;renderAllLight();}
  }
  if(e.target!==document.body) return;
  if(e.key==='='||e.key==='+') zoomMap(0.15, 390, 310);
  if(e.key==='-') zoomMap(-0.15, 390, 310);
  if(e.key==='0') resetMapView();
}
document.addEventListener('keydown', _onDocKeydown);
