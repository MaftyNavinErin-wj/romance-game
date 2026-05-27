// src/render/tooltips.js
//
// hover 提示 + 数值 Breakdown 浮窗 + 部队 tooltip
//
// 来源:从 project_romance_v181.html 整体抽离(Session 2.5 / 阶段 2)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
// 接口风格:全局函数(同 phase 2.1 决定),所有调用点不需改。
//
// 抽离的 3 段(共 ~1253 行):
//   1. hideTip()(原 L16691):隐藏 #_tip 元素
//   2. 主 Breakdown 浮窗系统(原 L16720-L17875,1156 行):
//      - fmtSigned (utility)
//      - _positionTip (定位 helper)
//      - showBreakdown (城市数值 — 粮/金/木/铁/马/民心/豪族/科技等)
//      - showUnitBreakdown (部队战力)
//      - showLoyaltyBreakdown (忠诚度分解)
//      - showFacModBreakdown (派系修正分解)
//      - showFacBreakdown (势力数值)
//      - showRepBreakdown (信誉度分解)
//      - hideBreakdown (隐藏 #bdTip)
//      - showDiploBreakdown (外交数值)
//      - showCountyTip (属县详情)
//      - showPopBreakdown (人口分解)
//   3. showUnitTip(e,unitId)(原 L28737-L28832,96 行):部队 tooltip(地图 hover)
//
// 留 v181 的:
//   - log / updateFacStats / fmt / sleep:通用 utility,跨多模块共用
//   - handleKeyDown:键盘事件 handler,非 tooltip
//   - renderUnitDetail:右侧部队详情面板,phase 3 或留 v181
//
// 依赖(同 realm 共享):
//   - DOM:#_tip / #bdTip / #ceremonyModal 等
//   - 全局函数(hoisted):fmt / getCityProd / calcCityCorruption / getCityStats /

// ── hideTip:隐藏 #_tip ──
function hideTip(){const t=document.getElementById('_tip');if(t)t.style.display='none';}

const TERRAIN_TIP_LABELS = {
  plain:'平原',
  hill:'丘陵',
  forest:'林地',
  mountain:'山地',
  water:'水域',
  river:'河道',
  swamp:'沼泽',
  impassable:'绝壁',
  coastal_water:'近海',
  deep_water:'深海'
};

function showHexTerrainTip(e, col, row){
  const k = hkey(col, row);
  const fogLv = G.fog?.[G.playerFac] ? (G.fog[G.playerFac][k] ?? FOG_UNEXPLORED) : FOG_VISIBLE;
  if(fogLv === FOG_UNEXPLORED){
    hideTip();
    return;
  }
  const terrain = HEX_TERRAIN[k] || 'plain';
  const label = TERRAIN_TIP_LABELS[terrain] || terrain;
  const isBlocked = terrain === 'impassable' || terrain === 'coastal_water' || terrain === 'deep_water';
  const hasRoad = !!HEX_ROAD[k];
  const landCost = getHexMoveCost(col, row, 'light', false);
  const waterCost = WATER_TERRAINS.has(terrain) ? getHexMoveCost(col, row, 'light', true) : null;
  const apText = isBlocked ? '不可通行'
    : WATER_TERRAINS.has(terrain) ? `陆入水 ${landCost} / 水路 ${waterCost}`
    : `${landCost}`;
  let tip = document.getElementById('_tip');
  if(!tip){
    tip = document.createElement('div');
    tip.id = '_tip';
    tip.style.cssText = 'position:fixed;background:rgba(246,240,226,.96);border:1px solid rgba(92,74,50,.22);padding:5px 8px;font-size:10px;z-index:600;pointer-events:none;max-width:170px;display:none;line-height:1.45;font-family:Noto Serif SC,serif;box-shadow:0 2px 8px rgba(42,32,20,.10);border-radius:3px';
    document.body.appendChild(tip);
  }
  tip.innerHTML = `<div style="font-family:'Noto Serif SC',serif;color:#5f4b2a;font-size:10.5px;font-weight:700">${label}</div>
    <div style="font-size:8.5px;color:rgba(44,36,22,.58)">(${col},${row}) · AP ${apText}</div>
    ${hasRoad?'<div style="font-size:8.5px;color:#8a6a10">官道减半</div>':''}`;
  _positionTip(tip, e);
}

// ── 数值 Breakdown 浮窗系统 ──
// ═══════════════════════════════════════
// ★ 数值Breakdown浮窗（P0新增）
// ═══════════════════════════════════════
/** tooltip 定位：显示 tip 在鼠标旁，自动避边 */
/** 带符号格式化数字（+1234 / -1234） */
function fmtSigned(v){ return v>=0?'+'+fmt(Math.floor(v)):'-'+fmt(Math.floor(Math.abs(v))); }
function _positionTip(tip, e){
  tip.style.display='block';
  const margin=10;
  let left=e.clientX+14, top=e.clientY-8;
  tip.style.left=left+'px'; tip.style.top=top+'px';
  const rect=tip.getBoundingClientRect();
  if(rect.right>window.innerWidth-margin) left=e.clientX-rect.width-10;
  if(rect.bottom>window.innerHeight-margin) top=e.clientY-rect.height-10;
  tip.style.left=Math.max(margin,left)+'px';
  tip.style.top=Math.max(margin,top)+'px';
}
function showBreakdown(e, type, cityId){
  e.stopPropagation();
  const city = G.cities[cityId];
  if(!city) return;
  const tip = document.getElementById('bdTip');

  const ts = getCityStats(city.tags||[]);
  const sMod = SEASON_MOD[SEASONS[G.seasonIdx]];
  const season = SEASONS[G.seasonIdx];
  const b = city.buildings||{};
  const farmLv = b.farm||0, irrLv = b.irr||0, mktLv = b.market||0;
  const granLv = b.granary||0;
  const spoilRate = SPOIL_RATES[granLv];
  const effPop = city.pop*(city.popQuality/100);
  const popMult = effPop/250000; // v107: pop×5
  const irrBonus = irrLv>0&&farmLv>0?[0,1.2,1.4,1.6][irrLv]:1.0;
  // ★ v124: 农田base加值模型
  const FARM_FLAT_UI=[0,100,190,270];
  const farmFlatVal = FARM_FLAT_UI[farmLv]||0;
  const garRate = 0.004;  // v45：城防粮耗固定
  const prod = getCityProd(city);
  const costs = getCityFoodCost(city);
  const turns = getCityFoodTurns(city);
  const netFood = getCityFoodNet(city); // ★ v150fix C3: 含官职/蒋琬buff

  let html = '';

  if(type==='food'){
    html = `<div class="bd-title">🌾 粮食产出 · 计算链</div>`;
    html += `<div class="bd-row"><span class="bd-label">基础产量</span><span class="bd-val">${city.base.food}${farmFlatVal>0?' + '+farmFlatVal+'（农田Lv'+farmLv+'）':''}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">效用人口</span><span class="bd-val">${fmt(Math.floor(effPop))}（${city.popQuality.toFixed(0)}%质量）</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">人口系数</span><span class="bd-val">×${popMult.toFixed(3)}（÷5万基准）</span></div>`;
    // ★ v165: 屯田（修整兵员粮产贡献）
    const _bdBilletTroops = (city.billetPool||[]).reduce((s,bp) => s + (bp.troops||0), 0);
    if(_bdBilletTroops > 0){
      const _bdTuntianMult = hasTechEffect(city.fac, 'tuntianBoost') ? 3 : 2;
      const _bdTuntianPop = _bdBilletTroops * _bdTuntianMult;
      html += `<div class="bd-row"><span class="bd-label">🏘 屯田兵</span><span class="bd-val pos">+${fmt(_bdTuntianPop)}效用人口（${fmt(_bdBilletTroops)}兵×${_bdTuntianMult}倍效率${_bdTuntianMult===3?' 🔬军屯精耕':''}）</span></div>`;
    }
    const foodTagM = ts.foodM;
    html += `<div class="bd-row"><span class="bd-label">地形修正</span><span class="bd-val ${foodTagM>=1?'pos':foodTagM<1?'neuc':''}">×${foodTagM.toFixed(2)}（${(city.tags||[]).join('+')||'无特殊'}）</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">季节修正</span><span class="bd-val ${sMod>=1?'pos':'neuc'}">×${sMod.toFixed(2)}（${season}季）</span></div>`;
    if(irrBonus>1) html += `<div class="bd-row"><span class="bd-label">水利加成</span><span class="bd-val pos">×${irrBonus.toFixed(2)}（水利Lv${irrLv}）</span></div>`;
    const _techFood = getTechEffect(city.fac, 'foodProdMult');
    const _techBigCity = hasTechEffect(city.fac,'bigCityFoodBonus') && city.pop > 150000 ? getTechEffect(city.fac,'bigCityFoodBonus') : 0;
    if(_techFood>0) html += `<div class="bd-row"><span class="bd-label">🔬 科技加成</span><span class="bd-val pos">×${(1+_techFood).toFixed(2)}（粮产科技）</span></div>`;
    if(_techBigCity>0) html += `<div class="bd-row"><span class="bd-label">🔬 屯田制</span><span class="bd-val pos">×${(1+_techBigCity).toFixed(2)}（人口>${'15万'}）</span></div>`;
    // ★ v136: 官职/朝议粮产buff
    const _pbFood = G.factions[city.fac]?._postBuffs?.foodProd || 0;
    if(_pbFood > 0) html += `<div class="bd-row"><span class="bd-label">📜 官职/朝议</span><span class="bd-val pos">×${(1+_pbFood).toFixed(2)}（粮产buff）</span></div>`;
    // ★ v136: 蒋琬稳政技能
    if(hasFacGen(city.fac, '蒋琬') && genHasOffice('蒋琬', city.fac)) html += `<div class="bd-row"><span class="bd-label">🏷 蒋琬·稳政</span><span class="bd-val pos">×1.05（当官时粮产+5%）</span></div>`;
    // ★ v136: 丰年大收永久加成
    if(city._grainBonus > 0) html += `<div class="bd-row"><span class="bd-label">🌾 丰年大收</span><span class="bd-val pos">×${(1+city._grainBonus).toFixed(2)}（永久加成）</span></div>`;
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">本旬产粮</span><span class="bd-total pos">= ${fmt(prod.food)} 石</span></div>`;
  }
  else if(type==='cost'){
    html = `<div class="bd-title">🔥 粮食消耗 · 计算链</div>`;
    html += `<div class="bd-row"><span class="bd-label">民用消耗</span><span class="bd-val neg">人口${fmt(city.pop)} × 0.0004 = ${fmt(Math.floor(costs.civil))}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">驻军消耗</span><span class="bd-val neg">兵力${fmt(city.garrison)} × 0.004 = ${fmt(Math.floor(costs.garrison))}/旬</span></div>`;
    const spoilAmt = Math.floor(city.storage * spoilRate);
    html += `<div class="bd-row"><span class="bd-label">腐损</span><span class="bd-val neuc">存粮 × ${(spoilRate*100).toFixed(1)}%（粮仓Lv${granLv}）≈ ${fmt(spoilAmt)}/旬</span></div>`;
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">总消耗（不含腐损）</span><span class="bd-total neg">= ${fmt(Math.floor(costs.total))}/旬</span></div>`;
  }
  else if(type==='storage'){
    const turnsStr = turns===Infinity?'∞ 自给有余':turns.toFixed(1)+'旬';
    const netStr = netFood>=0?`+${fmt(Math.floor(netFood))}`:fmt(Math.floor(netFood));
    html = `<div class="bd-title">🏚 存粮状态 · 计算链</div>`;
    html += `<div class="bd-row"><span class="bd-label">当前存粮</span><span class="bd-val">${fmt(Math.floor(city.storage))} 石</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">产粮</span><span class="bd-val pos">+${fmt(prod.food)}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">消耗（民+军）</span><span class="bd-val neg">-${fmt(Math.floor(costs.total))}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">腐损（粮仓Lv${granLv}）</span><span class="bd-val neuc">-${(spoilRate*100).toFixed(1)}%/旬 ≈ ${fmt(Math.floor(city.storage*spoilRate))}</span></div>`;
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">净变化/旬</span><span class="bd-total ${netFood>=0?'pos':'neg'}">${netStr}</span></div>`;
    html += `<div class="bd-row"><span class="bd-total">可撑旬数</span><span class="bd-total ${turns===Infinity?'pos':turns>=9?'neuc':'neg'}">${turnsStr}</span></div>`;
    // Morale impact
    const moraleD = turns===Infinity?'+0.3':turns>=9?'-0.5':'-1.5';
    const mClass = turns===Infinity?'pos':turns>=9?'neuc':'neg';
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-label">→ 民心影响</span><span class="bd-val ${mClass}">${moraleD}/旬（粮食链传导）</span></div>`;
  }
  else if(type==='gold'){
    const tax = TAX.find(t=>t.id===(G.factions[city.fac]?.taxId||'norm'));
    const taxM = tax?.goldM||1;
    html = `<div class="bd-title">💰 本城金产 · 计算链</div>`;
    const MKT_FLAT_UI=[0,40,75,105];
    const mktFlatVal = MKT_FLAT_UI[mktLv]||0;
    html += `<div class="bd-row"><span class="bd-label">基础金产</span><span class="bd-val">${city.base.gold}${mktFlatVal>0?' + '+mktFlatVal+'（市集Lv'+mktLv+'）':''}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">人口系数</span><span class="bd-val">×${popMult.toFixed(3)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">地形（商业）</span><span class="bd-val">×${ts.goldM.toFixed(2)}</span></div>`;
    const goldHarbMod = 1+((city.tags||[]).includes('港口')?(b.harbor||0)*.30:0);
    if(goldHarbMod>1) html += `<div class="bd-row"><span class="bd-label">港口加成</span><span class="bd-val pos">×${goldHarbMod.toFixed(2)}（港口Lv${b.harbor||0}）</span></div>`;
    const _bdTpLv = b.tradepost||0; const _bdTpInfo = _canBuildTradePost(city.id);
    if(_bdTpLv>0 && _bdTpInfo) html += `<div class="bd-row"><span class="bd-label">${_bdTpInfo.icon} ${_bdTpInfo.name}加成</span><span class="bd-val pos">×${(1+[0,0.15,0.25,0.35][_bdTpLv]).toFixed(2)}（${_bdTpInfo.name}Lv${_bdTpLv}）</span></div>`;
    if(taxM!==1) html += `<div class="bd-row"><span class="bd-label">赋税系数</span><span class="bd-val ${taxM>=1.2?'pos':taxM<=0.8?'neg':'neuc'}">×${taxM.toFixed(2)}（${tax?.name||'正常'}）</span></div>`;
    const _techGold = getTechEffect(city.fac, 'goldProdMult');
    const _techPrefect = getTechEffect(city.fac, 'prefectProdBonus');
    if(_techGold>0) html += `<div class="bd-row"><span class="bd-label">🔬 科技加成</span><span class="bd-val pos">×${(1+_techGold).toFixed(2)}（金产科技）</span></div>`;
    if(_techPrefect>0) html += `<div class="bd-row"><span class="bd-label">🔬 明镜高悬</span><span class="bd-val pos">×${(1+_techPrefect).toFixed(2)}（太守科技）</span></div>`;
    // ★ v136: 太守政治加成
    if(city.prefect){
      const _bdPrefPol = GEN_MAP[city.prefect]?.pol ?? 0;
      const _bdPrefDeployed = isPrefectInFieldUnit(city);
      const _bdPrefMult = 1 + (_bdPrefPol / 500) * (_bdPrefDeployed ? 0.5 : 1.0);
      if(_bdPrefMult > 1.001) html += `<div class="bd-row"><span class="bd-label">太守政治（${city.prefect}·政${_bdPrefPol}${_bdPrefDeployed?'·在外减半':''}）</span><span class="bd-val pos">×${_bdPrefMult.toFixed(3)}</span></div>`;
    }
    // ★ v136: 官职/朝议金产buff
    const _pbGold = G.factions[city.fac]?._postBuffs?.goldProd || 0;
    if(_pbGold > 0) html += `<div class="bd-row"><span class="bd-label">📜 官职/朝议</span><span class="bd-val pos">×${(1+_pbGold).toFixed(2)}（金产buff）</span></div>`;
    // ★ v136: 张昭柱石技能
    if(hasFacGen(city.fac, '张昭') && genHasOffice('张昭', city.fac)) html += `<div class="bd-row"><span class="bd-label">🏷 张昭·柱石</span><span class="bd-val pos">×1.03（当官时金产+3%）</span></div>`;
    // ★ v136: 太守派系产出修正
    if(city.prefect && city.fac){
      const _bdPfFacId = getGenFaction(city.prefect, city.fac);
      if(_bdPfFacId){
        const _bdPfAvg = getAvgFactionMod(city.fac, _bdPfFacId);
        if(_bdPfAvg <= -15) html += `<div class="bd-row"><span class="bd-label" style="color:#c03030">太守消极（派系离心）</span><span class="bd-val neg">×0.85</span></div>`;
        else if(_bdPfAvg >= 15) html += `<div class="bd-row"><span class="bd-label" style="color:#4caf50">太守尽心（派系效死）</span><span class="bd-val pos">×1.10</span></div>`;
      }
    }
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">本城金产</span><span class="bd-total pos">= ${fmt(prod.gold)}/旬</span></div>`;
    // ★ v148: 腐败扣金（实时计算，不依赖缓存）
    const _fCities = Object.values(G.cities).filter(c=>c.fac===city.fac).length;
    const _cRate = calcCityCorruption(city, _fCities);
    const _cLoss = Math.floor(prod.gold * _cRate);
    if(_cRate > 0){
      const _cBase = Math.min(CORRUPT_CAP, Math.max(0, (_fCities - CORRUPT_FREE_CITIES) * CORRUPT_PER_CITY));
      let _cPrefMod = 0;
      if(city.prefect){
        const _cPol = GEN_MAP[city.prefect]?.pol ?? 50;
        _cPrefMod = (_cPol - 50) / 250;
        const _cTags = GEN_TAGS[city.prefect];
        const _cSt = CITY_TO_STATE[city.id];
        if(_cTags && _cSt){
          const _cLocal = _cTags.origin === 'gentry' && !_cTags.clique && _cTags.state
            && STATE_TO_GENTRY_FAC[_cTags.state] === STATE_TO_GENTRY_FAC[_cSt];
          if(_cLocal) _cPrefMod += 0.05;
        }
        if(isPrefectInFieldUnit(city)) _cPrefMod *= 0.5;
      }
      const _cGentryMod = _getCorruptGentryMod(city.gentry);
      html += `<div class="bd-sep"></div>`;
      html += `<div class="bd-row"><span class="bd-label">🏛 腐败</span><span class="bd-val neg">-${fmt(_cLoss)}/旬（实际${(_cRate*100).toFixed(1)}%）</span></div>`;
      html += `<div class="bd-row"><span class="bd-label" style="padding-left:12px">基础腐败（${_fCities}城）</span><span class="bd-val neg">${(_cBase*100).toFixed(0)}%</span></div>`;
      if(city.prefect){
        const _cDispPref = _cPrefMod;
        html += `<div class="bd-row"><span class="bd-label" style="padding-left:12px">太守${city.prefect}压腐</span><span class="bd-val ${_cDispPref>=0?'pos':'neg'}">${_cDispPref>=0?'+':''}${(_cDispPref*100).toFixed(0)}%</span></div>`;
      } else {
        html += `<div class="bd-row"><span class="bd-label" style="padding-left:12px">无太守</span><span class="bd-val" style="color:rgba(92,74,50,.4)">±0%</span></div>`;
      }
      html += `<div class="bd-row"><span class="bd-label" style="padding-left:12px">豪族（${getGentryLevel(city.gentry).label}）</span><span class="bd-val ${_cGentryMod>=0?'pos':'neg'}">${_cGentryMod>=0?'+':''}${(_cGentryMod*100).toFixed(0)}%</span></div>`;
    }
    // 本城城防军饷（仅本城garrison）
    const localGarSal = Math.floor(city.garrison * GAR_SALARY_RATE);
    if(localGarSal > 0) html += `<div class="bd-row"><span class="bd-label">本城城防军饷</span><span class="bd-val neg">-${fmt(localGarSal)}/旬（城防${fmt(city.garrison)}兵）</span></div>`;
    // ★ I2: 豪族对本城金产的修正
    const gm = getGentryGoldMult(city);
    if(gm!==1) html += `<div class="bd-sep"></div><div class="bd-row"><span class="bd-label">豪族修正（${getGentryLevel(city.gentry).label}）</span><span class="bd-val ${gm>1?'pos':'neg'}">×${gm.toFixed(2)}（已含在金产中）</span></div>`;
    html += `<div class="bd-sep"></div><div class="bd-row"><span class="bd-label" style="color:rgba(92,74,50,.35)">军饷/俸禄等势力级支出见统计Tab</span></div>`;
  }
  else if(type==='gentry'){
    const gv = city.gentry ?? 50;
    const gl = getGentryLevel(gv);
    const fid = city.fac;
    html = `<div class="bd-title">🏛 豪族支持 · ${CITY_MAP[city.id]?.name||city.id}</div>`;
    html += `<div class="bd-row"><span class="bd-label">当前支持度</span><span class="bd-val" style="color:${gl.color}">${Math.floor(gv)} — ${gl.label}</span></div>`;

    // 太守简述
    const pref = city.prefect;
    if(pref){
      const prefHomeCity = getGenHomeCity(pref);
      const prefOrigin = GEN_TAGS[pref]?.origin;
      const prefIsDefect = G.genJoinSource?.[pref] === 'defect';
      let prefDescStr = '';
      if(prefHomeCity === city.id) prefDescStr = '本地太守';
      else if(prefOrigin === 'gentry') prefDescStr = '外地士族';
      else if(prefOrigin === 'humble' || prefIsDefect) prefDescStr = '寒门/降将';
      else prefDescStr = '非本地';
      html += `<div class="bd-row"><span class="bd-label">太守</span><span class="bd-val">${pref}（${prefDescStr}）</span></div>`;
    } else {
      html += `<div class="bd-row"><span class="bd-label">太守</span><span class="bd-val neg">空缺</span></div>`;
    }

    html += `<div class="bd-sep"></div>`;

    // ── 属县明细（v170：直接显示各县loyalty + type标签） ──
    if(city.counties && city.counties.length){
      html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>属县明细</span><span style="font-size:8px">loyalty × popShare = 贡献</span></div>`;
      city.counties.forEach(c => {
        const cl = getGentryLevel(c.loyalty);
        const contrib = (c.loyalty * c.popShare).toFixed(1);
        const cClans = _countyClanList(c);
        let typeTag = '';
        if(c.type==='seat') typeTag = '治所';
        else if(c.type==='clan_base'){
          const mag = isMagnateCounty(c) ? '★' : '';
          typeTag = `${mag}${cClans.join('·')||'豪族'}`;
        } else typeTag = '普通';
        html += `<div class="bd-row"><span class="bd-label">${c.name} <span style="font-size:7px;color:rgba(92,74,50,.4)">${typeTag} ${Math.round(c.popShare*100)}%</span></span><span class="bd-val" style="color:${cl.color}">${Math.floor(c.loyalty)} → ${contrib}</span></div>`;
      });
      html += `<div class="bd-row"><span class="bd-total">聚合值</span><span class="bd-total" style="color:${gl.color}">${Math.floor(gv)}</span></div>`;
      html += `<div class="bd-row"><span class="bd-label" style="font-size:8px;color:rgba(92,74,50,.4)">点击单县查看详细计算</span><span class="bd-val"></span></div>`;
    }

    // 占领期提醒
    if(city.occupied > 0){
      html += `<div class="bd-sep"></div>`;
      html += `<div class="bd-row"><span class="bd-label">占领惩罚（${city.occupied}旬）</span><span class="bd-val neg">所有县 -0.3/旬</span></div>`;
    }

    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>当前效果</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">金币产出</span><span class="bd-val ${gl.goldMult>=1?'pos':'neg'}">×${gl.goldMult.toFixed(2)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">征兵费用</span><span class="bd-val ${gl.recruitMult<=1?'pos':'neg'}">×${gl.recruitMult.toFixed(2)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">城防军士气</span><span class="bd-val ${gl.moraleMod>=0?'pos':'neg'}">${gl.moraleMod>=0?'+':''}${gl.moraleMod}</span></div>`;
    if(gv < 20) html += `<div class="bd-row"><span class="bd-label">隐匿户口</span><span class="bd-val neg">loyalty<20县 人口-5%/旬</span></div>`;
  }
  else if(type==='morale'){
    const tax = TAX.find(t=>t.id===(G.factions[city.fac]?.taxId||'norm'));
    let total=0.1; // base
    const moraleD = turns===Infinity?0.3:turns>=9?-0.5:-1.5;
    total += moraleD;
    total += tax?tax.moraleMod:0;
    // ★ v108: 修正为实际processMorale逻辑（太守prefect，非全局bestPol）
    let prefectD = 0, prefectLabel = '无太守';
    if(city.prefect){
      const _polM = GEN_MAP[city.prefect]?.pol ?? 0;
      const _deployed = isPrefectInFieldUnit(city);
      const _half = _deployed ? 0.5 : 1.0;
      prefectD = (_polM / 400) * _half;
      prefectLabel = `${city.prefect}（政${_polM}${_deployed?'·在外减半':''}）`;
    } else {
      const gens = G.generals[city.fac]||[];
      const bestPol = gens.length?Math.max(...gens.map(g=>g.pol)):0;
      if(bestPol>=80){ prefectD=0.15; prefectLabel=`无太守（势力最高政${bestPol}）`; }
      else if(bestPol>=60){ prefectD=0.05; prefectLabel=`无太守（势力最高政${bestPol}）`; }
    }
    total += prefectD;
    // 豪族→民心
    const _gv = city.gentry ?? 50;
    const gentryD = _gv>=80?0.3:_gv>=60?0.1:_gv>=40?0:_gv>=20?-0.3:-0.6;
    const gentryLabel = _gv>=80?'拥戴':_gv>=60?'支持':_gv>=40?'中立':_gv>=20?'不满':'抗拒';
    total += gentryD;
    if(city.occupied>0) total-=1.5;
    // 朝议buff
    const pbM = G.factions[city.fac]?._postBuffs;
    const decreeD = pbM?.morale || 0;
    total += decreeD;
    html = `<div class="bd-title">❤ 民心变化 · 计算链</div>`;
    const turnsStr = turns===Infinity?'∞（自给）':turns.toFixed(1)+'旬';
    html += `<div class="bd-row"><span class="bd-label">基础增长</span><span class="bd-val pos">+0.10/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">粮食状态（${turnsStr}）</span><span class="bd-val ${moraleD>=0?'pos':moraleD>=-0.5?'neuc':'neg'}">${moraleD>=0?'+':''}${moraleD.toFixed(1)}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">赋税（${tax?.name||'正常'}）</span><span class="bd-val ${(tax?.moraleMod||0)>=0?'pos':'neg'}">${(tax?.moraleMod||0)>=0?'+':''}${(tax?.moraleMod||0).toFixed(1)}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">太守（${prefectLabel}）</span><span class="bd-val ${prefectD>0?'pos':'neuc'}">+${prefectD.toFixed(2)}/旬</span></div>`;
    // ★ v113: 太守派系产出修正
    if(city.prefect && city.fac){
      const _pfId2 = getGenFaction(city.prefect, city.fac);
      if(_pfId2){
        const _pfAvg2 = getAvgFactionMod(city.fac, _pfId2);
        if(_pfAvg2 <= -15) html += `<div class="bd-row"><span class="bd-label" style="color:#c03030">太守消极（派系离心）</span><span class="bd-val neg">金产出×0.85</span></div>`;
        else if(_pfAvg2 >= 15) html += `<div class="bd-row"><span class="bd-label" style="color:#4caf50">太守尽心（派系效死）</span><span class="bd-val pos">金产出×1.10</span></div>`;
      }
    }
    html += `<div class="bd-row"><span class="bd-label">豪族（${gentryLabel}·${Math.round(_gv)}）</span><span class="bd-val ${gentryD>0?'pos':gentryD<0?'neg':'neuc'}">${gentryD>=0?'+':''}${gentryD.toFixed(1)}/旬</span></div>`;
    if(decreeD) html += `<div class="bd-row"><span class="bd-label">朝议/官职buff</span><span class="bd-val pos">+${decreeD.toFixed(2)}/旬</span></div>`;
    // ★ v136: 科技民心恢复加成
    const _techMoraleR = getTechEffect(city.fac, 'moraleRecovery');
    if(_techMoraleR > 0){
      total += _techMoraleR;
      html += `<div class="bd-row"><span class="bd-label">🔬 科技加成</span><span class="bd-val pos">+${_techMoraleR.toFixed(2)}/旬</span></div>`;
    }
    // ★ v136: 王朗经义技能
    if(hasFacGen(city.fac,'王朗') && genHasOffice('王朗',city.fac)){
      total += 0.15;
      html += `<div class="bd-row"><span class="bd-label">🏷 王朗·经义</span><span class="bd-val pos">+0.15/旬（当官时全城民心）</span></div>`;
    }
    // TEMPERAMENT: generous太守民心+0.5
    if(city.prefect && (GEN_TAGS[city.prefect]||{}).temperament === 'generous'){
      total += 0.5;
      html += `<div class="bd-row"><span class="bd-label">🧠 ${city.prefect}·仁厚</span><span class="bd-val pos">+0.50/旬（性情加成）</span></div>`;
    }
    if(city.occupied>0) html += `<div class="bd-row"><span class="bd-label">占领惩罚</span><span class="bd-val neg">-1.5/旬（${city.occupied}旬）</span></div>`;
    // ★ v163: 徭役民心代价
    if(city.buildQueue && city.buildQueue.length > 0){
      const _bdCorv = CORVEE.find(c=>c.id===(G.factions[city.fac]?.corveeId||'low')) || CORVEE[0];
      if(_bdCorv.moralePen < 0){
        const _bdCorvPolMit = (city.prefect && (GEN_MAP[city.prefect]?.pol??0) >= 75) ? 0.5 : 1.0;
        const _bdCorvD = _bdCorv.moralePen * _bdCorvPolMit;
        total += _bdCorvD;
        html += `<div class="bd-row"><span class="bd-label">徭役（${_bdCorv.name}${_bdCorvPolMit<1?'·太守减半':''}）</span><span class="bd-val neg">${_bdCorvD.toFixed(2)}/旬（有在建项目）</span></div>`;
      }
    }
    // ★ v108: 征兵惩罚显示
    if(city._lastRecruitTurn === G.turn && city._lastRecruitPenalty > 0){
      html += `<div class="bd-row"><span class="bd-label">⚠ 本旬征兵</span><span class="bd-val neg">即时-${city._lastRecruitPenalty.toFixed(2)}</span></div>`;
    }
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">净变化/旬</span><span class="bd-total ${total>=0?'pos':'neg'}">${total>=0?'+':''}${total.toFixed(2)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-total">当前民心</span><span class="bd-total">${city.morale.toFixed(1)} / 100</span></div>`;
  }

  else if(type==='quality'){
    // ★ v136: 同步processPop实际参数
    let qd = 0.05; // v136: 0.10→0.05
    const _moraleOk = city.morale >= 60;
    const _moraleBad = city.morale < 40;
    if(_moraleOk) qd += 0.02; // v136: 0.04→0.02
    else if(_moraleBad) qd = 0;
    const schoolLv = city.buildings?.school || 0;
    const schoolD = schoolLv > 0 ? [0,0.08,0.15,0.25][schoolLv] : 0; // v124: 同步新值
    qd += schoolD;
    const _techQR = getTechEffect(city.fac, 'popQualityRecovery'); // ★ v115: 兴学育才
    qd += _techQR;
    const cityDef0 = CITY_MAP[city.id];
    const hasHostile = cityDef0 && G.units.some(u=>
      u.fac !== city.fac && getUnitTroops(u)>0 &&
      hexDist(u.hq??0, u.hr??0, cityDef0.q, cityDef0.r) <= 3
    );
    if(city.occupied > 0 || hasHostile) qd = 0;
    html = `<div class="bd-title">📊 人口质量 · 计算链</div>`;
    html += `<div class="bd-row"><span class="bd-label">基础恢复</span><span class="bd-val pos">+0.05/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">民心门槛（${city.morale.toFixed(0)}）</span><span class="bd-val ${_moraleOk?'pos':_moraleBad?'neg':'neuc'}">${_moraleOk?'+0.02（≥60加速）':_moraleBad?'→归零（<40停滞）':'±0（40~60正常）'}</span></div>`;
    if(schoolLv > 0) html += `<div class="bd-row"><span class="bd-label">学堂Lv${schoolLv}</span><span class="bd-val pos">+${schoolD.toFixed(2)}/旬</span></div>`;
    if(_techQR > 0) html += `<div class="bd-row"><span class="bd-label">🔬 兴学育才</span><span class="bd-val pos">+${_techQR.toFixed(2)}/旬</span></div>`;
    if(city.occupied > 0) html += `<div class="bd-row"><span class="bd-label">占领中</span><span class="bd-val neg">→归零（质量停止恢复）</span></div>`;
    if(hasHostile) html += `<div class="bd-row"><span class="bd-label">附近敌军</span><span class="bd-val neg">→归零（战乱停止恢复）</span></div>`;
    // TEMPERAMENT: generous太守质量恢复+0.02
    if(city.prefect && (GEN_TAGS[city.prefect]||{}).temperament === 'generous' && qd > 0){
      qd += 0.02;
      html += `<div class="bd-row"><span class="bd-label">🧠 ${city.prefect}·仁厚</span><span class="bd-val pos">+0.02/旬（性情加成）</span></div>`;
    }
    // ★ v163: 徭役质量代价
    if(city.buildQueue && city.buildQueue.length > 0){
      const _bdCorvQ = CORVEE.find(c=>c.id===(G.factions[city.fac]?.corveeId||'low')) || CORVEE[0];
      if(_bdCorvQ.qualPen < 0){
        qd += _bdCorvQ.qualPen;
        html += `<div class="bd-row"><span class="bd-label">徭役（${_bdCorvQ.name}）</span><span class="bd-val neg">${_bdCorvQ.qualPen.toFixed(2)}/旬（有在建项目）</span></div>`;
      }
    }
    // 征兵惩罚
    if(city._lastRecruitTurn === G.turn && city._lastRecruitPenalty > 0){
      html += `<div class="bd-row"><span class="bd-label">⚠ 本旬征兵</span><span class="bd-val neg">即时-${city._lastRecruitPenalty.toFixed(2)}</span></div>`;
    }
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">净恢复/旬</span><span class="bd-total ${qd>0?'pos':'neg'}">+${qd.toFixed(2)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-total">当前质量</span><span class="bd-total">${city.popQuality.toFixed(1)}%</span></div>`;
    const fullTurns = qd > 0 ? ((100 - city.popQuality) / qd).toFixed(0) : '∞';
    // 新兵等级预览
    const _penalty = Math.max(0, Math.floor((80 - city.popQuality) / 10));
    const _initLv = Math.max(1, 5 - _penalty + getTechEffect(city.fac, 'initLevelBonus'));
    html += `<div class="bd-row" style="font-size:9px;color:rgba(92,74,50,.35)"><span>满质量预估${fullTurns}旬 · 当前新兵等级Lv${_initLv} · 质量影响全资源产出</span></div>`;
  }

  else if(type==='wood'){
    const woodTagM = ts.woodM;
    html = `<div class="bd-title">🪵 木材产出 · 计算链</div>`;
    html += `<div class="bd-row"><span class="bd-label">基础木产</span><span class="bd-val">${city.base.wood}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">人口系数</span><span class="bd-val">×${popMult.toFixed(3)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">地形修正</span><span class="bd-val ${woodTagM>=1.2?'pos':woodTagM<1?'neg':'neuc'}">×${woodTagM.toFixed(2)}（${(city.tags||[]).filter(t=>TAGS[t]?.woodM).join('+')||'无特殊'}）</span></div>`;
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">本旬木产</span><span class="bd-total pos">= ${fmt(prod.wood)}/旬</span></div>`;
    html += `<div class="bd-row" style="font-size:9px;color:rgba(92,74,50,.35)"><span>水乡+40% · 山地+20% · 产木+80%</span></div>`;
  }
  else if(type==='iron'){
    const ironTagM = ts.ironM;
    html = `<div class="bd-title">⚙ 铁矿产出 · 计算链</div>`;
    html += `<div class="bd-row"><span class="bd-label">基础铁产</span><span class="bd-val">${city.base.iron}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">人口系数</span><span class="bd-val">×${popMult.toFixed(3)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">地形修正</span><span class="bd-val ${ironTagM>1?'pos':'neuc'}">×${ironTagM.toFixed(2)}（${(city.tags||[]).includes('产铁')?'产铁城':'基础'} ×0.9基础折扣）</span></div>`;
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-total">本旬铁产</span><span class="bd-total pos">= ${fmt(prod.iron)}/旬</span></div>`;
    html += `<div class="bd-row" style="font-size:9px;color:rgba(92,74,50,.35)"><span>产铁标签 铁矿+100%</span></div>`;
  }

  tip.innerHTML = html;
  _positionTip(tip, e);
}

function showUnitBreakdown(e, type, unitId){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const unit = G.units.find(u=>u.id===unitId);
  if(!unit) return;
  const pol = POLICY.find(p=>p.id===(G.factions[unit.fac]?.policyId||'bal'))||POLICY[1];
  let html='';

  if(type==='combat'){
    html = `<div class="bd-title">⚔ 战斗力计算</div>`;
    html += `<div class="bd-row"><span class="bd-label">部队等级</span><span class="bd-val">Lv${unit.level||1}（每级+${(UNIT_LEVEL_MULT_BASE*100).toFixed(0)}%）</span></div>`;
    const lvMult = getLvMult(unit.level||1);
    html += `<div class="bd-row"><span class="bd-label">等级系数</span><span class="bd-val pos">×${lvMult.toFixed(2)}</span></div>`;
    html += `<div class="bd-sep"></div>`;
    unit.squads.forEach((sq,i)=>{
      const gd = GEN_MAP[sq.genName]||{com:60};
      const cb = comBonus(gd.com);
      const mMult = Math.max(0.3, sq.morale/100);
      const sqAtk = Math.round(squadATK(sq, unit.level||1, gd.com, undefined, 1, unit.fac));
      const sqDef = Math.round(squadDEF(sq, unit.level||1, gd.com, undefined, 1, unit.fac));
      html += `<div class="bd-row"><span class="bd-label">${i===0?'主将':'副将'}·${sq.genName}</span><span class="bd-val" style="color:#8a6a10">攻${fmt(sqAtk)} 防${fmt(sqDef)}</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">　兵力×等级×士气×统帅</span><span class="bd-val">${fmt(sq.troops)}×${lvMult.toFixed(2)}×${mMult.toFixed(2)}×${cb.toFixed(2)}</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">　统帅${gd.com} → 系数</span><span class="bd-val">${cb.toFixed(3)}（0.75~1.25）</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">　士气${sq.morale} → 系数</span><span class="bd-val">${mMult.toFixed(2)}</span></div>`;
      if(i<unit.squads.length-1) html += `<div class="bd-sep"></div>`;
    });
    html += `<div class="bd-sep"></div>`;
    const _tAtk = getTechEffect(unit.fac, 'atkMult');
    const _tDef = getTechEffect(unit.fac, 'defMult');
    const _tMoraleCap = getTechEffect(unit.fac, 'moraleCapBonus');
    if(_tAtk>0) html += `<div class="bd-row"><span class="bd-label">🔬 科技攻击</span><span class="bd-val pos">×${(1+_tAtk).toFixed(2)}</span></div>`;
    if(_tDef>0) html += `<div class="bd-row"><span class="bd-label">🔬 科技防御</span><span class="bd-val pos">×${(1+_tDef).toFixed(2)}</span></div>`;
    if(_tMoraleCap>0) html += `<div class="bd-row"><span class="bd-label">🔬 士气上限</span><span class="bd-val pos">${100+_tMoraleCap}（+${_tMoraleCap}）</span></div>`;
    // ★ v136 P2: 武将被动技能提示
    const _combatTriggers = new Set(['onCalcATK','onCalcDEF','onCalcAP','onMorale','onDuel','onPursuit']);
    const _unitGens = new Set(unit.squads.map(sq=>sq.genName));
    const _matchedSkills = SKILL_REGISTRY.filter(sk => _unitGens.has(sk.gen) && _combatTriggers.has(sk.trigger));
    if(_matchedSkills.length > 0){
      html += `<div class="bd-sep"></div>`;
      html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>🏷 武将被动技能（战斗时生效）</span></div>`;
      _matchedSkills.forEach(sk=>{
        const trigLabel = {onCalcATK:'攻击',onCalcDEF:'防御',onCalcAP:'行动力',onMorale:'士气',onDuel:'单挑',onPursuit:'追击'}[sk.trigger]||sk.trigger;
        html += `<div class="bd-row"><span class="bd-label">${sk.gen}·${sk.name}</span><span class="bd-val" style="color:#8a6a10">${trigLabel}</span></div>`;
      });
    }
    // SKILL_INLINE提示：检查部队中是否有已知inline技能的武将
    const _inlineHints = [];
    if(_unitGens.has('关羽')) _inlineHints.push('关羽·武圣：单挑触发+胜率↑，军团士气+5');
    if(_unitGens.has('张飞')) _inlineHints.push('张飞·万人敌：削弱周围敌军士气');
    if(_unitGens.has('诸葛亮')) _inlineHints.push('诸葛亮·卧龙：伏击概率↑，势力资源+5%');
    if(_unitGens.has('张辽')) _inlineHints.push('张辽·威风：以少敌多时士气大幅↑');
    if(_unitGens.has('赵云')) _inlineHints.push('赵云·龙胆：撤退损失减半');
    if(_unitGens.has('吕蒙')) _inlineHints.push('吕蒙·白衣：伏击+劫营成功率↑');
    if(_unitGens.has('陆逊')) _inlineHints.push('陆逊·火攻：火攻成功率↑');
    if(_inlineHints.length > 0){
      if(_matchedSkills.length === 0) html += `<div class="bd-sep"></div>`;
      _inlineHints.forEach(h => {
        html += `<div class="bd-row"><span class="bd-label" style="color:rgba(92,74,50,.45);font-size:9px">🏷 ${h}</span></div>`;
      });
    }
    // TEMPERAMENT hints in combat breakdown
    const _mainTemperCB = (GEN_TAGS[unit.squads[0]?.genName]||{}).temperament;
    const _temperHints = [];
    if(_mainTemperCB === 'steadfast') _temperHints.push('刚毅：防守时DEF+2%');
    if(_mainTemperCB === 'steady') _temperHints.push('沉稳：中伏/劫营士气惩罚-5');
    if(_mainTemperCB === 'reckless') _temperHints.push('莽：单挑触发+10%，中伏/劫营概率+5%');
    if(_mainTemperCB === 'cunning') _temperHints.push('狡黠：中伏/劫营概率-5%');
    if(_mainTemperCB === 'proud') _temperHints.push('傲：单挑胜利士气额外+5');
    if(_temperHints.length){
      _temperHints.forEach(h => {
        html += `<div class="bd-row"><span class="bd-label" style="color:rgba(92,74,50,.45);font-size:9px">🧠 性情·${h}</span></div>`;
      });
    }
    const totalAtk = Math.round(calcUnitATK(unit));
    const totalDef = Math.round(calcUnitDEF(unit));
    html += `<div class="bd-row"><span class="bd-total">合计攻击</span><span class="bd-total" style="color:#8a6a10">${fmt(totalAtk)}</span></div>`;
    html += `<div class="bd-row"><span class="bd-total">合计防御</span><span class="bd-total" style="color:#5ad0a0">${fmt(totalDef)}</span></div>`;
  }

  else if(type==='reinforce'){
    // ★ v147: 改用领土归属判定
    const territory = _buildTerritoryMap();
    const tk = hkey(unit.hq??0, unit.hr??0);
    const terr = territory[tk];
    const nearCity = (terr && terr.fac === unit.fac) ? G.cities[terr.cityId] : null;
    html = `<div class="bd-title">🔄 补员速度计算</div>`;
    if(!nearCity){
      html += `<div class="bd-row"><span class="bd-label">位置</span><span class="bd-val" style="color:#c03030">不在己方领土内</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">结论</span><span class="bd-val" style="color:#c03030">本旬不补员</span></div>`;
    } else {
      const inCity  = terr.dist <= 1;
      // ★ v136: 同步processReinforcement实际参数
      const BASE_R = 200; // v133: 500→200
      const inCityM = inCity ? 1.5 : 1.0;
      const frontPopM = Math.min(3.0, Math.max(0.5, nearCity.pop / 150000));
      const _facTotPop = Object.values(G.cities).filter(c=>c.fac===unit.fac).reduce((s,c)=>s+c.pop,0);
      const rearPopM = Math.min(2.0, Math.max(0.5, _facTotPop / 2500000));
      const _rBuff = G.factions[unit.fac]?._postBuffs?.reinforce || 0;
      const frontCalc = Math.floor(BASE_R * frontPopM * inCityM * pol.front * 0.68 * (1 + _rBuff)); // v116: ×0.68
      const rearCalc  = Math.floor(BASE_R * rearPopM * 2.0 * pol.rear * (1 + _rBuff)); // v116: ×2.0
      const unitRecoverCalc = Math.max(BASE_R, frontCalc + rearCalc);
      const turns = getCityFoodTurns(nearCity);
      const foodMult = turns < 2 ? 0 : turns < 5 ? 0.5 : 1.0;
      const effRecover = Math.floor(unitRecoverCalc * foodMult);

      html += `<div class="bd-row"><span class="bd-label">所属领土</span><span class="bd-val">${nearCity?.name||'?'}（距城${terr.dist}格）</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">位置类型</span><span class="bd-val">${inCity?'🏠 城中休整（×1.5）':'🏕 己方领土内'}</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">城市人口</span><span class="bd-val">${fmt(nearCity.pop)}（人口系数×${frontPopM.toFixed(2)}）</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">存粮状态</span><span class="bd-val" style="color:${turns<2?'#c03030':turns<5?'#e8a840':'#80c040'}">${turns===Infinity?'充裕':turns<2?'危机（停止补员）':turns<5?'偏紧（减半）':turns+'旬余粮'}</span></div>`;
      html += `<div class="bd-sep"></div>`;
      html += `<div class="bd-row"><span class="bd-label">基准</span><span class="bd-val">${BASE_R}兵/旬</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">就地补员</span><span class="bd-val">${fmt(frontCalc)}兵/旬（${pol.name} ${pol.front*100}%）</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">后方补员</span><span class="bd-val">${fmt(rearCalc)}兵/旬（${pol.name} ${pol.rear*100}%）</span></div>`;
      if(_rBuff > 0) html += `<div class="bd-row"><span class="bd-label">官职加成</span><span class="bd-val pos">+${(_rBuff*100).toFixed(0)}%</span></div>`;
      html += `<div class="bd-row"><span class="bd-total">每队补员上限</span><span class="bd-total pos">${fmt(effRecover)}兵/旬</span></div>`;
      html += `<div class="bd-row"><span class="bd-label">补员金消耗</span><span class="bd-val">0.05金/兵</span></div>`;
      html += `<div class="bd-sep"></div>`;
      unit.squads.forEach((sq,i)=>{
        const cap=sq.maxTroops||sq.troops;
        const missing=cap-sq.troops;
        if(missing<=0){
          html+=`<div class="bd-row"><span class="bd-label">${i===0?'主将':'副将'}·${sq.genName}</span><span class="bd-val pos">满员 ${fmt(cap)}</span></div>`;
          return;
        }
        const recover=Math.min(missing, effRecover);
        const goldCost = (recover * 0.05).toFixed(0);
        html+=`<div class="bd-row"><span class="bd-label">${i===0?'主将':'副将'}·${sq.genName}</span><span class="bd-val">${fmt(sq.troops)}/${fmt(cap)}（缺${fmt(missing)}）</span></div>`;
        html+=`<div class="bd-row"><span class="bd-label">　本旬补员</span><span class="bd-val pos">+${fmt(recover)}兵（耗金${goldCost}）</span></div>`;
        if(i<unit.squads.length-1) html+=`<div class="bd-sep"></div>`;
      });
    }
  }

  tip.innerHTML = html;
  _positionTip(tip, e);
}

// ★ v92: 忠诚 breakdown 弹窗
function showLoyaltyBreakdown(e, genName, fid){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const loyalty = G.genLoyalty[genName]??80;
  const result = calcLoyaltyDelta(genName, fid);

  let html = `<div class="bd-title">❤ ${genName} · 忠诚计算链</div>`;
  html += `<div class="bd-row"><span class="bd-label">当前忠诚</span><span class="bd-val" style="font-weight:700">${loyalty}</span></div>`;
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>每旬变化因素</span></div>`;
  result.items.forEach(item => {
    const cls = item.val > 0 ? 'pos' : item.val < 0 ? 'neg' : 'neuc';
    html += `<div class="bd-row"><span class="bd-label">${item.label}</span><span class="bd-val ${cls}">${item.val>=0?'+':''}${item.val.toFixed(2)}/旬</span></div>`;
  });
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row"><span class="bd-total">净变化/旬</span><span class="bd-total ${result.total>=0?'pos':'neg'}">${result.total>=0?'+':''}${result.total.toFixed(2)}</span></div>`;

  tip.innerHTML = html;
  _positionTip(tip, e);
}

// ★ v93: 派系修正(mod)详细弹窗
function showFacModBreakdown(e, genName, fid){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const bd = getGenFactionModBreakdown(genName, fid);
  const mod = bd.currentMod;
  const facDelta = bd.facDelta;
  const mainFac = getGenFaction(genName, fid);
  const allFacs = getGenFactions(genName, fid);
  const facLabels = allFacs.map(f => FACTION_DEFS.find(fd=>fd.id===f)?.label || f);
  const tags = GEN_TAGS[genName] || {};

  let html = `<div class="bd-title">🏛 ${genName} · 派系修正</div>`;
  html += `<div class="bd-row"><span class="bd-label">派系标签</span><span class="bd-val">${facLabels.join(' + ') || '无'}</span></div>`;
  if(allFacs.length > 1) html += `<div class="bd-row"><span class="bd-label">影响力分配</span><span class="bd-val">每标签 ${Math.round(150/allFacs.length)}%（${allFacs.length}标签）</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">政治倾向</span><span class="bd-val">${tags.politics||'?'} · ${tags.combat||'?'} · ${tags.origin||'?'}</span></div>`;
  html += `<div class="bd-sep"></div>`;

  // 累积mod值
  const modCol = mod >= 0.5 ? '#4ade80' : mod <= -0.5 ? '#f87171' : '#888';
  html += `<div class="bd-row"><span class="bd-label">事件累积修正</span><span class="bd-val" style="font-weight:700;color:${modCol}">${mod>=0?'+':''}${mod.toFixed(1)} / ±20上限</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">→ 忠诚影响</span><span class="bd-val ${facDelta>=0?'pos':'neg'}">mod × 0.05 = ${facDelta>=0?'+':''}${facDelta.toFixed(2)}/旬</span></div>`;

  // ★ v94: 事件日志
  const logs = G.genFactionModLog?.[genName] || [];
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>事件记录（近8条）</span></div>`;
  if(logs.length === 0){
    html += `<div class="bd-row"><span class="bd-label" style="color:rgba(92,74,50,.35)">尚无事件触发</span></div>`;
  } else {
    logs.slice().reverse().forEach(lg => {
      const col = lg.delta > 0 ? '#4ade80' : '#f87171';
      html += `<div class="bd-row"><span class="bd-label" style="color:${col}">第${lg.turn}旬 ${lg.event}</span><span class="bd-val" style="color:${col}">${lg.delta>0?'+':''}${lg.delta} → ${lg.after>=0?'+':''}${lg.after.toFixed(1)}</span></div>`;
    });
  }

  // 结构性压力
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>当前结构性压力（每旬持续影响mod）</span></div>`;
  if(bd.items.length === 0){
    html += `<div class="bd-row"><span class="bd-label" style="color:rgba(92,74,50,.35)">暂无——派系平衡良好</span></div>`;
  } else {
    bd.items.forEach(item => {
      const col = item.type==='good' ? '#4ade80' : '#f87171';
      html += `<div class="bd-row"><span class="bd-label" style="color:${col}">${item.delta>0?'▲':'▼'} ${item.label}</span><span class="bd-val" style="color:${col}">${item.delta>0?'+':''}${item.delta.toFixed(2)}/旬</span></div>`;
    });
  }

  tip.innerHTML = html;
  _positionTip(tip, e);
}

function showFacBreakdown(e, type, fid){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const cities = Object.values(G.cities).filter(c=>c.fac===fid).sort((a,b)=>{
    if(type==='food') return getCityProd(b).food - getCityProd(a).food;
    if(type==='gold') return getCityProd(b).gold - getCityProd(a).gold;
    if(type==='wood') return getCityProd(b).wood - getCityProd(a).wood;
    if(type==='iron') return getCityProd(b).iron - getCityProd(a).iron;
    if(type==='horses') return getCityProd(b).horses - getCityProd(a).horses;
    if(type==='storage') return b.storage - a.storage;
    return 0;
  });
  const tax = TAX.find(t=>t.id===(G.factions[fid]?.taxId||'norm'));
  // v45：城防+野战军饷分开计算
  const totalGarrisonFac = cities.reduce((s,c)=>s+c.garrison,0);
  const garSalaryFac = Math.floor(totalGarrisonFac*GAR_SALARY_RATE);
  const unitSalaryFac = getFacUnitSalary(fid);
  const salary = garSalaryFac + unitSalaryFac;  // 总军饷（兼容下方net计算）
  let html = '';

  if(type==='food'){
    // ★ v150fix D1: 使用getCityFoodNet（含官职/蒋琬buff），对齐processCityFood
    const totalNet = cities.reduce((s,c)=>s+getCityFoodNet(c),0);
    const totalProd = cities.reduce((s,c)=>s+getCityProd(c).food,0);
    const totalCost = cities.reduce((s,c)=>s+getCityFoodCost(c).total,0);
    html = `<div class="bd-title">🌾 势力粮食 · 各城贡献</div>`;
    html += `<div class="bd-row"><span class="bd-label">全势力产粮</span><span class="bd-val pos">+${fmt(Math.floor(totalProd))}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">全势力消耗</span><span class="bd-val neg">-${fmt(Math.floor(totalCost))}/旬</span></div>`;
    // buff行
    const _fPb = G.factions[fid]?._postBuffs;
    const _fFoodBuff = (_fPb && _fPb.foodProd) ? _fPb.foodProd : 0;
    const _fJwActive = hasFacGen(fid,'蒋琬') && genHasOffice('蒋琬',fid);
    if(_fFoodBuff>0) html += `<div class="bd-row"><span class="bd-label">📜 官职/朝议</span><span class="bd-val pos">粮产+${(_fFoodBuff*100).toFixed(0)}%</span></div>`;
    if(_fJwActive) html += `<div class="bd-row"><span class="bd-label">🏷 蒋琬·稳政</span><span class="bd-val pos">粮产+5%</span></div>`;
    html += `<div class="bd-row"><span class="bd-total">净变化</span><span class="bd-total ${totalNet>=0?'pos':'neg'}">${fmtSigned(totalNet)}/旬</span></div>`;
    html += `<div class="bd-sep"></div>`;
    cities.forEach(c=>{
      const net=getCityFoodNet(c), cost=getCityFoodCost(c).total, turns=getCityFoodTurns(c);
      const col=turns===Infinity?'#1a7a3a':turns>=9?'#8a6a10':'#c03030';
      const turnsStr=turns===Infinity?'∞':turns.toFixed(0)+'旬';
      html+=`<div class="bd-row"><span class="bd-label">${c.name}</span><span class="bd-val" style="color:${col}">净${fmtSigned(net)} 耗${fmt(Math.floor(cost))} · ${turnsStr}</span></div>`;
    });
  }
  else if(type==='gold'){
    const grossGold = cities.reduce((s,c)=>s+getCityProd(c).gold*(tax?.goldM||1),0);
    const postSalaryFac = calcPostSalary(fid); // ★ v92: 官职俸禄
    const corruptLossFac = cities.reduce((s,c) => s + Math.floor(getCityProd(c).gold * calcCityCorruption(c, cities.length)), 0); // ★ v148: 腐败损失（实时计算）
    // ★ v150fix D2: 叠加官职buff+张昭+纳贡（对齐processFacEconomy）
    const _gPb = G.factions[fid]?._postBuffs;
    const _gGoldBuff = (_gPb && _gPb.goldProd) ? _gPb.goldProd : 0;
    const _gZzBuff = (hasFacGen(fid,'张昭') && genHasOffice('张昭',fid)) ? 0.03 : 0;
    const buffedGrossGold = Math.floor((grossGold - corruptLossFac) * (1 + _gGoldBuff + _gZzBuff));
    const tributeFac = G.factions[fid]?._tributePaid || 0;
    const _tradeAgrIncomeFac = calcTradeAgrIncome(fid); // ★ v165
    const net = buffedGrossGold + _tradeAgrIncomeFac - salary - postSalaryFac - tributeFac;
    html = `<div class="bd-title">💰 势力金钱 · 各城贡献</div>`;
    html += `<div class="bd-row"><span class="bd-label">全势力金产</span><span class="bd-val pos">+${fmt(Math.floor(grossGold))}/旬</span></div>`;
    if(corruptLossFac > 0){
      const _fCnt = cities.length;
      const _fBaseCorrupt = Math.min(CORRUPT_CAP, Math.max(0, (_fCnt - CORRUPT_FREE_CITIES) * CORRUPT_PER_CITY));
      html += `<div class="bd-row"><span class="bd-label">🏛 腐败损失</span><span class="bd-val neg">-${fmt(corruptLossFac)}/旬（基础${(_fBaseCorrupt*100).toFixed(0)}%·${_fCnt}城）</span></div>`;
    }
    html += `<div class="bd-row"><span class="bd-label">城防军饷</span><span class="bd-val neg">-${fmt(garSalaryFac)}/旬（城防${fmt(totalGarrisonFac)}兵×0.001）</span></div>`;
    html += `<div class="bd-row"><span class="bd-label">野战军饷</span><span class="bd-val neg">-${fmt(unitSalaryFac)}/旬（统一×0.008，驻民×0.0016）</span></div>`;
    if(postSalaryFac>0){
      html += `<div class="bd-row"><span class="bd-label">官职俸禄</span><span class="bd-val neg">-${fmt(postSalaryFac)}/旬</span></div>`;
      const posts = getFacPosts(fid);
      posts.forEach(({genName:gn, postDef:pd})=>{
        if(pd.salary>0) html += `<div class="bd-row" style="padding-left:12px"><span class="bd-label" style="color:rgba(92,74,50,.40)">${gn}（${pd.name}）</span><span class="bd-val" style="color:rgba(92,74,50,.40)">-${pd.salary}/旬</span></div>`;
      });
    }
    if(tributeFac>0) html += `<div class="bd-row"><span class="bd-label">📦 附庸纳贡</span><span class="bd-val neg">-${fmt(tributeFac)}/旬</span></div>`;
    if(_tradeAgrIncomeFac>0) html += `<div class="bd-row"><span class="bd-label">🤝 通商收入</span><span class="bd-val pos">+${fmt(_tradeAgrIncomeFac)}/旬</span></div>`;
    html += `<div class="bd-row"><span class="bd-total">净金产</span><span class="bd-total ${net>=0?'pos':'neg'}">${fmtSigned(net)}/旬</span></div>`;
    // ★ v136 P2: 势力级buff汇总
    const _facPb = G.factions[fid]?._postBuffs || {};
    const _facTechGold = getTechEffect(fid, 'goldProdMult');
    const _facTechSalary = getTechEffect(fid, 'salaryMult');
    const _facTechPrefect = getTechEffect(fid, 'prefectProdBonus');
    const _zhangzhaoActive = hasFacGen(fid, '张昭') && genHasOffice('张昭', fid);
    const _feiyiActive = hasFacGen(fid, '费祎') && genHasOffice('费祎', fid);
    const _hasAnyBuff = _facTechGold > 0 || _facTechSalary !== 0 || _facTechPrefect > 0 || (_facPb.goldProd||0) > 0 || (_facPb.upkeep||0) !== 0 || _zhangzhaoActive || _feiyiActive;
    if(_hasAnyBuff){
      html += `<div class="bd-sep"></div>`;
      html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>当前生效buff</span></div>`;
      if(_facTechGold > 0) html += `<div class="bd-row"><span class="bd-label">🔬 科技金产</span><span class="bd-val pos">+${(_facTechGold*100).toFixed(0)}%</span></div>`;
      if(_facTechPrefect > 0) html += `<div class="bd-row"><span class="bd-label">🔬 明镜高悬</span><span class="bd-val pos">+${(_facTechPrefect*100).toFixed(0)}%（太守城）</span></div>`;
      if(_facTechSalary !== 0) html += `<div class="bd-row"><span class="bd-label">🔬 精简军制</span><span class="bd-val pos">军饷${(_facTechSalary*100).toFixed(0)}%</span></div>`;
      if((_facPb.goldProd||0) > 0) html += `<div class="bd-row"><span class="bd-label">📜 官职/朝议</span><span class="bd-val pos">金产+${((_facPb.goldProd||0)*100).toFixed(0)}%</span></div>`;
      if((_facPb.upkeep||0) !== 0) html += `<div class="bd-row"><span class="bd-label">📜 官职维护费</span><span class="bd-val pos">军饷${((_facPb.upkeep||0)*100).toFixed(0)}%</span></div>`;
      if(_zhangzhaoActive) html += `<div class="bd-row"><span class="bd-label">🏷 张昭·柱石</span><span class="bd-val pos">金产+3%</span></div>`;
      if(_feiyiActive) html += `<div class="bd-row"><span class="bd-label">🏷 费祎·折冲</span><span class="bd-val pos">铁木+5%</span></div>`;
    }
    html += `<div class="bd-sep"></div>`;
    cities.forEach(c=>{
      const g=Math.floor(getCityProd(c).gold*(tax?.goldM||1));
      const sal=Math.floor(c.garrison*GAR_SALARY_RATE);
      const gl=getGentryLevel(c.gentry);
      const gentryTag=gl.goldMult!==1?` <span style="color:${gl.color};font-size:8px">豪${gl.goldMult>1?'+':''}${Math.round((gl.goldMult-1)*100)}%</span>`:'';
      const cLoss = Math.floor(getCityProd(c).gold * calcCityCorruption(c, cities.length));
      const corruptTag = cLoss > 0 ? ` 腐败-${fmt(cLoss)}` : '';
      html+=`<div class="bd-row"><span class="bd-label">${c.name}${gentryTag}</span><span class="bd-val">金产+${fmt(g)}${corruptTag} 饷-${fmt(sal)}</span></div>`;
    });
  }
  else if(type==='wood'){
    const rawTotal = cities.reduce((s,c)=>s+getCityProd(c).wood,0);
    // ★ v150fix D3: 费祎buff（对齐processFacEconomy）
    const _wFeiyiBuff = (hasFacGen(fid,'费祎') && genHasOffice('费祎',fid)) ? 1.05 : 1;
    const total = Math.floor(rawTotal * _wFeiyiBuff);
    html = `<div class="bd-title">🪵 木材 · 各城贡献</div>`;
    html += `<div class="bd-row"><span class="bd-total">全势力木产</span><span class="bd-total pos">+${fmt(total)}/旬</span></div>`;
    if(_wFeiyiBuff>1) html += `<div class="bd-row"><span class="bd-label">🏷 费祎·折冲</span><span class="bd-val pos">+5%</span></div>`;
    html += `<div class="bd-sep"></div>`;
    cities.forEach(c=>{
      const w=getCityProd(c).wood;
      const tags=(c.tags||[]).filter(t=>TAGS[t]?.woodM>0).join(' ');
      html+=`<div class="bd-row"><span class="bd-label">${c.name} ${tags}</span><span class="bd-val pos">+${fmt(w)}/旬</span></div>`;
    });
  }
  else if(type==='iron'){
    const rawTotal = cities.reduce((s,c)=>s+getCityProd(c).iron,0);
    // ★ v150fix D4: 费祎buff（对齐processFacEconomy）
    const _iFeiyiBuff = (hasFacGen(fid,'费祎') && genHasOffice('费祎',fid)) ? 1.05 : 1;
    const total = Math.floor(rawTotal * _iFeiyiBuff);
    html = `<div class="bd-title">⚙ 铁矿 · 各城贡献</div>`;
    html += `<div class="bd-row"><span class="bd-total">全势力铁产</span><span class="bd-total pos">+${fmt(total)}/旬</span></div>`;
    if(_iFeiyiBuff>1) html += `<div class="bd-row"><span class="bd-label">🏷 费祎·折冲</span><span class="bd-val pos">+5%</span></div>`;
    html += `<div class="bd-sep"></div>`;
    cities.forEach(c=>{
      const ir=getCityProd(c).iron;
      const isIron=(c.tags||[]).includes('产铁');
      html+=`<div class="bd-row"><span class="bd-label">${c.name}${isIron?' ⚙':''}</span><span class="bd-val ${isIron?'pos':'neuc'}">+${fmt(ir)}/旬</span></div>`;
    });
  }
  else if(type==='horses'){
    const total = cities.reduce((s,c)=>s+getCityProd(c).horses,0);
    html = `<div class="bd-title">🐴 马匹 · 各城贡献</div>`;
    html += `<div class="bd-row"><span class="bd-total">全势力马产</span><span class="bd-total pos">+${fmt(Math.floor(total))}/旬</span></div>`;
    html += `<div class="bd-sep"></div>`;
    cities.forEach(c=>{
      const h=getCityProd(c).horses;
      const isHorse=(c.tags||[]).includes('产马');
      html+=`<div class="bd-row"><span class="bd-label">${c.name}${isHorse?' 🐴':''}</span><span class="bd-val ${isHorse?'pos':'neuc'}">+${fmt(h)}/旬</span></div>`;
    });
  }
  else if(type==='storage'){
    const total = cities.reduce((s,c)=>s+c.storage,0);
    html = `<div class="bd-title">🌾 总存粮 · 各城分布</div>`;
    html += `<div class="bd-row"><span class="bd-total">全势力存粮</span><span class="bd-total">${fmt(Math.floor(total))} 石</span></div>`;
    html += `<div class="bd-sep"></div>`;
    cities.forEach(c=>{
      const turns=getCityFoodTurns(c);
      const col=turns===Infinity?'#1a7a3a':turns>=9?'#8a6a10':'#c03030';
      const turnsStr=turns===Infinity?'∞':turns.toFixed(0)+'旬';
      html+=`<div class="bd-row"><span class="bd-label">${c.name}</span><span class="bd-val" style="color:${col}">${fmt(Math.floor(c.storage))}石 · ${turnsStr}</span></div>`;
    });
  }

  tip.innerHTML = html;
  _positionTip(tip, e);
}

// ★ v136: 信誉breakdown弹窗
// ★ v136: 信誉breakdown弹窗
function showRepBreakdown(e, fid){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const rep = Math.round(G.reputation?.[fid] ?? REPUTATION_DEFAULT);
  const repCol = rep>=70?'#1a7a3a':rep>=40?'#6b5530':'#c03030';
  const repLabel = rep>=80?'名震四海':rep>=60?'信义之名':rep>=40?'毁誉参半':rep>=20?'言而无信':'臭名昭著';

  const atWar = Object.keys(G.diplo).some(k => {
    const [a,b] = k.split('-');
    return (a===fid||b===fid) && G.diplo[k]?.status === 'enemy';
  });
  const baseRate = atWar ? 0.1 : 0.2;
  const _caocaoActive = hasFacGen(fid, '曹操') && genHasOffice('曹操', fid);
  const _caocaoMult = _caocaoActive ? 2 : 1;
  const _zhongyaoActive = hasFacGen(fid, '钟繇') && genHasOffice('钟繇', fid);
  const _zhongyaoVal = _zhongyaoActive ? 0.15 : 0;
  const totalRate = baseRate * _caocaoMult + _zhongyaoVal;

  let html = `<div class="bd-title">📜 信誉 · 计算链</div>`;
  html += `<div class="bd-row"><span class="bd-label">当前信誉</span><span class="bd-val" style="font-weight:700;color:${repCol}">${rep} — ${repLabel}</span></div>`;
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>每旬恢复</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">基础恢复（${atWar?'交战中':'和平期'}）</span><span class="bd-val pos">+${baseRate.toFixed(1)}/旬${atWar?'（战时减半）':''}</span></div>`;
  if(_caocaoActive) html += `<div class="bd-row"><span class="bd-label">🏷 曹操·奸雄</span><span class="bd-val pos">恢复速度×2</span></div>`;
  if(_zhongyaoActive) html += `<div class="bd-row"><span class="bd-label">🏷 钟繇·楷范</span><span class="bd-val pos">+0.15/旬（当官时）</span></div>`;
  html += `<div class="bd-row"><span class="bd-total">净恢复/旬</span><span class="bd-total pos">+${totalRate.toFixed(2)}</span></div>`;
  if(rep < 100){
    const turnsToFull = Math.ceil((100 - rep) / totalRate);
    html += `<div class="bd-row" style="font-size:9px;color:rgba(92,74,50,.35)"><span>满信誉(100)预估 ${turnsToFull} 旬</span></div>`;
  }

  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>信誉扣减事件</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">无名出兵</span><span class="bd-val neg">-12</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">毁盟</span><span class="bd-val neg">-15</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">计谋失败</span><span class="bd-val neg">-3~8</span></div>`;
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>信誉影响</span></div>`;
  const _hxOff = hasFacGen(fid,'华歆') && genHasOffice('华歆',fid);
  html += `<div class="bd-row"><span class="bd-label">称帝门槛</span><span class="bd-val">≥${_hxOff?'30（华歆·逼宫）':'40'}</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">AI外交态度</span><span class="bd-val">低信誉→AI更警惕、结盟更难</span></div>`;

  tip.innerHTML = html;
  _positionTip(tip, e);
}

function hideBreakdown(){
  const tip = document.getElementById('bdTip');
  if(tip) tip.style.display='none';
}

// ★ v136: 外交关系breakdown弹窗
function showDiploBreakdown(e, otherFid){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const fid = G.playerFac;
  const k = `${fid}-${otherFid}`;
  const d = G.diplo[k] || {status:'neutral', rel:50};
  const rel = d.rel;
  const sm = {ally:'同盟', neutral:'中立', enemy:'敌对', vassal:'附庸'};
  const sc = {ally:'#1a7a3a', neutral:'#6b5530', enemy:'#c03030', vassal:'#8060c0'};

  let html = `<div class="bd-title">📜 对${getFactionDef(otherFid)?.name} · 外交关系</div>`;
  html += `<div class="bd-row"><span class="bd-label">当前友好度</span><span class="bd-val" style="font-weight:700;color:${rel>=70?'#1a7a3a':rel>=40?'#6b5530':'#c03030'}">${Math.round(rel)}</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">当前状态</span><span class="bd-val" style="color:${sc[d.status]||'#6b5530'}">${sm[d.status]||d.status}</span></div>`;

  // 每旬自动漂移
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>每旬自动漂移</span></div>`;
  if(d.status==='ally' || d.status==='vassal'){
    html += `<div class="bd-row"><span class="bd-label">盟友/附庸漂移</span><span class="bd-val pos">${rel<85?'+0.15/旬（→85上限）':'已达上限'}</span></div>`;
  } else if(d.status==='enemy'){
    html += `<div class="bd-row"><span class="bd-label">敌对恶化</span><span class="bd-val neg">-0.15/旬</span></div>`;
  } else {
    if(rel < 30) html += `<div class="bd-row"><span class="bd-label">和平惯性</span><span class="bd-val pos">+0.10/旬（→30）</span></div>`;
    else if(rel > 30) html += `<div class="bd-row"><span class="bd-label">和平惯性</span><span class="bd-val neg">-0.10/旬（→30）</span></div>`;
    else html += `<div class="bd-row"><span class="bd-label">和平惯性</span><span class="bd-val neuc">±0（已在均衡点30）</span></div>`;
  }

  // 血仇
  const feud = G.diplo[k]?._feud || 0;
  if(feud > 0) html += `<div class="bd-row"><span class="bd-label">血仇值</span><span class="bd-val neg">${feud.toFixed(1)}（每旬-0.3自然衰减）</span></div>`;

  // 状态转换阈值
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>状态转换阈值</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">结盟</span><span class="bd-val">中立 + 友好度≥80 → 自动结盟</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">盟约破裂</span><span class="bd-val">同盟 + 友好度<30 → 回中立</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">关系破裂</span><span class="bd-val">中立 + 友好度≤10 → 自动敌对</span></div>`;

  // 战力对比
  const myPow = powerIndex(fid), theirPow = powerIndex(otherFid);
  const ratio = myPow / (myPow + theirPow);
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row"><span class="bd-label">军力对比</span><span class="bd-val" style="color:${ratio>=0.55?'#1a7a3a':ratio>=0.45?'#6b5530':'#c03030'}">我方${Math.round(ratio*100)}% : 对方${Math.round((1-ratio)*100)}%</span></div>`;

  // 信誉度
  const myRep = Math.round(G.reputation?.[fid] ?? REPUTATION_DEFAULT);
  html += `<div class="bd-row"><span class="bd-label">我方信誉</span><span class="bd-val">${myRep}（影响AI外交态度）</span></div>`;

  tip.innerHTML = html;
  _positionTip(tip, e);
}

// ★ v161: 属县loyalty详情tooltip
function showCountyTip(e, cityId, countyIdx){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const city = G.cities[cityId];
  if(!city || !city.counties || !city.counties[countyIdx]) return;
  const c = city.counties[countyIdx];
  const cl = getGentryLevel(c.loyalty);
  const fid = city.fac;

  // ── 县标签 ──
  const countyClans = _countyClanList(c);
  const clansDisplay = countyClans.join('·');
  const isMagnate = isMagnateCounty(c);
  let typeLabel = '';
  if(c.type === 'seat') typeLabel = `<span style="font-size:9px;color:rgba(92,74,50,.5);margin-left:4px">治所</span>`;
  else if(c.type === 'clan_base'){
    typeLabel = `<span style="font-size:9px;color:${cl.color}aa;margin-left:4px">${clansDisplay||'豪族据点'}${isMagnate?' <span style="color:#b08040">★豪强</span>':''}</span>`;
  } else {
    typeLabel = `<span style="font-size:9px;color:rgba(92,74,50,.4);margin-left:4px">普通县</span>`;
  }

  let html = `<div class="bd-title">${c.name}${typeLabel}</div>`;
  html += `<div class="bd-row"><span class="bd-label">忠诚度</span><span class="bd-val" style="color:${cl.color}">${Math.floor(c.loyalty)} — ${cl.label}</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">人口占比</span><span class="bd-val">${Math.round(c.popShare*100)}%（约${fmt(Math.floor(city.pop*c.popShare))}人）</span></div>`;
  const typeSens = COUNTY_TYPE_SENS_V170[c.type] ?? 1.0;
  html += `<div class="bd-row"><span class="bd-label">type敏感度</span><span class="bd-val">×${typeSens}${c.type==='seat'?'（治所惰性）':''}</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">聚合贡献</span><span class="bd-val">${(c.loyalty*c.popShare).toFixed(1)} / ${Math.floor(city.gentry??50)}</span></div>`;

  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>每旬变化预估（v170）</span></div>`;

  // ═══ 第1组 ═══
  html += `<div class="bd-row" style="color:rgba(92,74,50,.45);font-size:9px;margin-top:4px"><span>▸ 第1组（普适 × ${typeSens}）</span></div>`;

  const pref = city.prefect;
  let g1Shared = 0;
  let prefectMod = 0;
  // 太守
  if(pref){
    const prefOrigin = GEN_TAGS[pref]?.origin;
    const prefHomeCity = getGenHomeCity(pref);
    const prefHomeCounty = getGenHomeCounty(pref);
    const prefIsDefect = G.genJoinSource?.[pref] === 'defect';
    const prefIsLocal = prefHomeCity === city.id;
    if(prefIsLocal){
      if(prefHomeCounty === c.name){
        prefectMod = 0.5;
        html += `<div class="bd-row"><span class="bd-label">太守 ${pref}（本县）</span><span class="bd-val pos">+0.5</span></div>`;
      } else {
        prefectMod = 0.3;
        html += `<div class="bd-row"><span class="bd-label">太守 ${pref}（本地同城）</span><span class="bd-val pos">+0.3</span></div>`;
      }
    } else if(prefOrigin === 'gentry'){
      prefectMod = -0.1;
      html += `<div class="bd-row"><span class="bd-label">太守 ${pref}（外地士族）</span><span class="bd-val neg">-0.1</span></div>`;
    } else if(prefOrigin === 'humble' || prefIsDefect){
      prefectMod = -0.2;
      html += `<div class="bd-row"><span class="bd-label">太守 ${pref}（${prefIsDefect?'降将':'寒门'}）</span><span class="bd-val neg">-0.2</span></div>`;
    } else {
      prefectMod = -0.1;
      html += `<div class="bd-row"><span class="bd-label">太守 ${pref}（非本地）</span><span class="bd-val neg">-0.1</span></div>`;
    }
  } else {
    prefectMod = -0.15;
    html += `<div class="bd-row"><span class="bd-label">无太守</span><span class="bd-val neg">-0.15</span></div>`;
  }
  // 占领期
  if(city.occupied > 0){
    g1Shared -= 0.3;
    html += `<div class="bd-row"><span class="bd-label">占领期（${city.occupied}旬）</span><span class="bd-val neg">-0.3</span></div>`;
  }
  // 吕蒙围城
  const _lvmengSiege = G.units.some(u =>
    u.status === 'siege' && u.siegeTarget === city.id &&
    u.fac !== fid && isHostile(u.fac, fid) &&
    u.squads.some(sq => sq.genName === '吕蒙')
  );
  if(_lvmengSiege){
    g1Shared -= 3.0;
    html += `<div class="bd-row"><span class="bd-label">吕蒙攻心</span><span class="bd-val neg">-3.0</span></div>`;
  }
  // 武将技能 / 科技
  const gfx = fid ? applySkills('onGentry', {fac: fid}) : {flatGentry:0};
  if(gfx.flatGentry){
    g1Shared += gfx.flatGentry;
    html += `<div class="bd-row"><span class="bd-label">武将技能</span><span class="bd-val ${gfx.flatGentry>=0?'pos':'neg'}">${gfx.flatGentry>=0?'+':''}${gfx.flatGentry.toFixed(2)}</span></div>`;
  }
  const techR = fid ? getTechEffect(fid, 'gentryRecovery') : 0;
  if(techR){
    g1Shared += techR;
    html += `<div class="bd-row"><span class="bd-label">🔬 科技</span><span class="bd-val pos">+${techR.toFixed(2)}</span></div>`;
  }
  // 孙权坐断
  if(hasFacGen(fid,'孙权') && genHasOffice('孙权',fid) && isJiangdong(city.id)){
    g1Shared += 0.15;
    html += `<div class="bd-row"><span class="bd-label">孙权·坐断</span><span class="bd-val pos">+0.15</span></div>`;
  }
  // 自然漂移
  g1Shared += 0.05;
  html += `<div class="bd-row"><span class="bd-label">自然漂移</span><span class="bd-val neuc">+0.05</span></div>`;
  const g1 = (g1Shared + prefectMod) * typeSens;
  html += `<div class="bd-row"><span class="bd-label">第1组小计 × ${typeSens}</span><span class="bd-val ${g1>=0?'pos':'neg'}">${g1>=0?'+':''}${g1.toFixed(2)}</span></div>`;

  // ═══ 第2组 ═══
  html += `<div class="bd-row" style="color:rgba(92,74,50,.45);font-size:9px;margin-top:4px"><span>▸ 第2组（地方加成，封顶+${LOCAL_BONUS_CAP_V170.toFixed(1)}）</span></div>`;

  // 预计算本fac的在朝武将加成清单
  const facGens = (G.generals[fid]||[]);
  const bonusEntries = [];
  const seenNames = new Set();
  let suspendedCount = 0;
  facGens.forEach(g => {
    const b = getGenLocalBonus(g.name, fid);
    if(!b.tier) return;
    seenNames.add(g.name);
    const inFac = isGenHomeInFac(g.name, fid);
    const homeCounty = getGenHomeCounty(g.name);
    const homeCity = getGenHomeCity(g.name);
    const clan = GEN_TAGS[g.name]?.clan || null;
    bonusEntries.push({name:g.name, inFac, homeCounty, homeCity, clan, ...b});
  });
  // 补君主
  const ruler = getFactionRuler(fid);
  if(ruler && !seenNames.has(ruler) && facGens.some(g => g.name === ruler)){
    const t1 = _V170_TIER_TABLE[1];
    const inFac = isGenHomeInFac(ruler, fid);
    bonusEntries.push({
      name:ruler, inFac,
      homeCounty:getGenHomeCounty(ruler), homeCity:getGenHomeCity(ruler),
      clan:GEN_TAGS[ruler]?.clan||null,
      tier:1, ownCounty:t1.ownCounty, sameCity:t1.sameCity, clanBonus:t1.clanBonus,
    });
  }

  const isClanBase = c.type === 'clan_base';
  let g2 = 0;
  const contributors = [];
  bonusEntries.forEach(b => {
    if(!b.inFac){ suspendedCount++; return; }
    const isBothClan = b.clan && isClanBase && countyClans.includes(b.clan);
    const clanSens = isBothClan ? COUNTY_CLAN_SENS : 1.0;
    let added = 0;
    if(b.homeCounty === c.name){
      const v = b.ownCounty * clanSens;
      contributors.push({name:b.name, tier:b.tier, kind:'本县', val:v, sens:clanSens});
      added += v;
    } else if(b.homeCity === city.id){
      contributors.push({name:b.name, tier:b.tier, kind:'辐射', val:b.sameCity, sens:1.0});
      added += b.sameCity;
    }
    if(isBothClan){
      const v = b.clanBonus * clanSens;
      contributors.push({name:b.name, tier:b.tier, kind:'本族', val:v, sens:clanSens});
      added += v;
    }
    g2 += added;
  });
  const g2Raw = g2;
  const capped = g2 > LOCAL_BONUS_CAP_V170;
  if(capped) g2 = LOCAL_BONUS_CAP_V170;

  if(contributors.length === 0){
    html += `<div class="bd-row"><span class="bd-label" style="color:rgba(92,74,50,.4)">（无在朝武将贡献）</span><span class="bd-val neuc">0</span></div>`;
  } else {
    contributors.forEach(x => {
      const sensStr = x.sens > 1 ? ` <span style="color:#b08040">×${x.sens}</span>` : '';
      html += `<div class="bd-row"><span class="bd-label">${x.name}<span style="font-size:8px;color:rgba(92,74,50,.4)">·T${x.tier}·${x.kind}</span></span><span class="bd-val pos">+${x.val.toFixed(2)}${sensStr}</span></div>`;
    });
  }
  if(capped){
    html += `<div class="bd-row"><span class="bd-label" style="color:#8a6a10">第2组合计（封顶）</span><span class="bd-val pos">+${g2.toFixed(2)} <span style="font-size:8px">原${g2Raw.toFixed(2)}</span></span></div>`;
  } else if(contributors.length > 0){
    html += `<div class="bd-row"><span class="bd-label">第2组合计</span><span class="bd-val pos">+${g2.toFixed(2)}</span></div>`;
  }
  if(suspendedCount > 0){
    html += `<div class="bd-row"><span class="bd-label" style="font-size:8px;color:rgba(92,74,50,.4)">${suspendedCount}位武将老家不在版图（悬置）</span><span class="bd-val"></span></div>`;
  }

  // ── 净变化 ──
  const finalDelta = g1 + g2;
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row"><span class="bd-total">净变化/旬</span><span class="bd-total ${finalDelta>=0?'pos':'neg'}">${finalDelta>=0?'+':''}${finalDelta.toFixed(2)}</span></div>`;

  // ── 状态警告 ──
  if(c.loyalty < 20){
    html += `<div class="bd-sep"></div>`;
    html += `<div class="bd-row"><span class="bd-label" style="color:#a82a1a">⚠ 隐匿户口</span><span class="bd-val neg">人口-5%/旬</span></div>`;
    if(c.popShare >= 0.20) html += `<div class="bd-row"><span class="bd-label" style="color:#a82a1a">⚠ 可能献城</span><span class="bd-val neg">被围城时触发</span></div>`;
  }

  tip.innerHTML = html;
  _positionTip(tip, e);
}

// ★ v136: 城市人口breakdown弹窗
function showPopBreakdown(e, cityId){
  e.stopPropagation();
  const tip = document.getElementById('bdTip');
  const city = G.cities[cityId];
  if(!city) return;

  const net = getCityFoodNet(city);
  const tax = TAX.find(t=>t.id===(G.factions[city.fac]?.taxId||'norm'));
  const cap = getCityCap(city);
  const capPct = (city.pop / cap * 100).toFixed(0);

  // Reconstruct pop delta (same logic as processPop)
  const _bdGrowRate = 0.00017 + 0.00017 * (city.popQuality / 100);
  let pd = 0;
  pd += Math.floor(city.pop * _bdGrowRate);
  if(net < 0 && city.storage <= 0){
    const _bfCost2 = getCityFoodCost(city).total || 1;
    const _bfDef2 = Math.min(1, (-net) / _bfCost2);
    pd -= Math.floor(city.pop * _bfDef2 * 0.05);
  }
  if(tax) pd += Math.floor(city.pop * tax.popMod);
  const cityDef0 = CITY_MAP[city.id];
  const hasHostile = cityDef0 && G.units.some(u =>
    u.fac !== city.fac && getUnitTroops(u) > 0 &&
    hexDist(u.hq ?? 0, u.hr ?? 0, cityDef0.q, cityDef0.r) <= 3
  );
  if(hasHostile) pd -= Math.floor(city.pop * 0.002);
  const _techPopGrow = getTechEffect(city.fac, 'popGrowthMult');
  const hasTechBoost = pd > 0 && city.morale > 70 && _techPopGrow > 0;
  if(hasTechBoost) pd = Math.floor(pd * (1 + _techPopGrow));

  let html = `<div class="bd-title">👥 ${city.name} · 人口变化</div>`;
  html += `<div class="bd-row"><span class="bd-label">当前人口</span><span class="bd-val" style="font-weight:700">${fmt(city.pop)}</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">产粮上限</span><span class="bd-val">${fmt(cap)}（当前${capPct}%，${(city.tags||[]).join('+')||'基础'}）${city.pop > cap ? '<span style=\"color:#8a6a10;font-size:9px\"> 超出部分不参与生产</span>':''}</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">人口质量</span><span class="bd-val">${city.popQuality.toFixed(0)}%</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">效用人口</span><span class="bd-val">${fmt(Math.floor(city.pop * city.popQuality / 100))}（决定资源产出）</span></div>`;

  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>每旬人口变化因素</span></div>`;

  const natGrow = Math.floor(city.pop * _bdGrowRate);
  const _annualPct = (_bdGrowRate * 36 * 100).toFixed(1);
  html += `<div class="bd-row"><span class="bd-label">自然增长</span><span class="bd-val pos">+${fmt(natGrow)}/旬（≈${_annualPct}%/年·质量${city.popQuality.toFixed(0)}%）</span></div>`;
  if(net < 0 && city.storage <= 0){
    const _bfCost = getCityFoodCost(city).total || 1;
    const _bfDefRatio = Math.min(1, (-net) / _bfCost);
    const famineLoss = Math.floor(city.pop * _bfDefRatio * 0.05);
    html += `<div class="bd-row"><span class="bd-label">饥荒损耗</span><span class="bd-val neg">-${fmt(famineLoss)}/旬（${Math.round(_bfDefRatio*100)}%人口挨饿）</span></div>`;
  } else if(net < 0){
    html += `<div class="bd-row"><span class="bd-label">粮食不足</span><span class="bd-val neuc">消耗存粮中（可撑${getCityFoodTurns(city).toFixed(1)}旬）</span></div>`;
  }

  if(tax && tax.popMod !== 0){
    const taxD = Math.floor(city.pop * tax.popMod);
    html += `<div class="bd-row"><span class="bd-label">赋税（${tax.name}）</span><span class="bd-val ${taxD>=0?'pos':'neg'}">${taxD>=0?'+':''}${fmt(taxD)}/旬</span></div>`;
  }

  if(hasHostile){
    const warLoss = Math.floor(city.pop * 0.002);
    html += `<div class="bd-row"><span class="bd-label">战乱流失</span><span class="bd-val neg">-${fmt(warLoss)}/旬（3格内有敌军）</span></div>`;
  }

  if(hasTechBoost){
    html += `<div class="bd-row"><span class="bd-label">🔬 太平盛世</span><span class="bd-val pos">增长×${(1+_techPopGrow).toFixed(2)}（民心>70）</span></div>`;
  }

  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row"><span class="bd-total">净变化/旬</span><span class="bd-total ${pd>=0?'pos':'neg'}">${pd>=0?'+':''}${fmt(pd)}</span></div>`;
  if(pd > 0){
    const turnsToFull = Math.ceil((cap - city.pop) / pd);
    html += `<div class="bd-row" style="font-size:9px;color:rgba(92,74,50,.35)"><span>满人口预估 ${turnsToFull > 999 ? '999+' : turnsToFull} 旬</span></div>`;
  }

  // 影响提示
  html += `<div class="bd-sep"></div>`;
  html += `<div class="bd-row" style="color:rgba(92,74,50,.55)"><span>人口影响</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">资源产出</span><span class="bd-val">效用人口÷25万 = 产出系数</span></div>`;
  html += `<div class="bd-row"><span class="bd-label">征兵上限</span><span class="bd-val">集结速率 ${fmt(getMusterRate(cityId))}/旬/队</span></div>`;
  const _garCap = garrisonCap(city);
  html += `<div class="bd-row"><span class="bd-label">城防上限</span><span class="bd-val">${fmt(_garCap)}（当前${fmt(city.garrison)}）</span></div>`;

  tip.innerHTML = html;
  _positionTip(tip, e);
}

// ── 部队 tooltip ──
function showUnitTip(e,unitId){
  const unit=G.units.find(u=>u.id===unitId);if(!unit)return;
  // ★ v134: 敌方伏兵不显示tooltip（理论上不会触发，因为SVG不渲染，但作为安全兜底）
  if (unit.status === 'ambush' && unit.fac !== G.playerFac && !canSeeFactionData(G.playerFac, unit.fac)) return;
  const total=getUnitTroops(unit);
  const ap=calcUnitAP(unit);
  const troopType=getMainTroopType(unit);
  const pos=getUnitDisplayPos(unit);
  const atCityId = HEX_CITY[hkey(unit.hq??0, unit.hr??0)];
  const atCity = atCityId ? G.cities[atCityId] : null;
  const turnsLeft = (unit.hexPath && unit.hexPath.length > 0) ? Math.max(1, Math.ceil(calcHexPathCost(unit.hexPath, troopType, isUnitOnWater(unit)) / ap)) : 0; // ★ v179fix P9

  // v97: 情报模糊
  const isEnemy = unit.fac !== G.playerFac && !canSeeFactionData(G.playerFac, unit.fac);
  const _si = isEnemy ? getScoutINT(unit) : 99;

  let squadLines;
  if (!isEnemy) {
    squadLines=unit.squads.map(sq=>{const td=TROOP_TYPES[sq.type]||{icon:'?',name:sq.type};return`<div>${td.icon} ${sq.genName}·${td.name}·${fmt(sq.troops)}兵</div>`;}).join('');
  } else if (_si >= 90) {
    // 全部武将+兵种+大致兵力
    squadLines=unit.squads.map(sq=>{const td=TROOP_TYPES[sq.type]||{icon:'?',name:sq.type};return`<div>${td.icon} ${sq.genName}·${td.name}·${fmt(sq.troops)}兵</div>`;}).join('');
  } else if (_si >= 75) {
    // 武将+兵种，兵力模糊到千
    squadLines=unit.squads.map(sq=>{const td=TROOP_TYPES[sq.type]||{icon:'?',name:sq.type};return`<div>${td.icon} ${sq.genName}·${td.name}</div>`;}).join('');
  } else if (_si >= 60) {
    // 仅主将
    squadLines=`<div>${unit.squads[0]?.genName||'?'}部</div>`;
  } else {
    squadLines=`<div style="color:rgba(92,74,50,.40)">不明将领</div>`;
  }

  const troopLine = isEnemy
    ? `<div style="font-size:9px;color:rgba(44,36,22,.45);margin-top:3px">兵力 ${fuzzyTroopDisplay(total, _si)}</div>`
    : `<div style="font-size:9px;color:rgba(44,36,22,.45);margin-top:3px">总兵力 ${fmt(total)}</div>`;

  // 同格其他部队
  const stackKey=hkey(unit.hq??0, unit.hr??0);
  const stackMates=G.units.filter(u=>{
    return u.id!==unitId && hkey(u.hq??0, u.hr??0)===stackKey;
  });

  let tip=document.getElementById('_tip');
  if(!tip){tip=document.createElement('div');tip.id='_tip';
    tip.style.cssText='position:fixed;background:rgba(245,238,225,.98);border:1px solid var(--ink-l);padding:8px 12px;font-size:11px;z-index:600;pointer-events:none;max-width:240px;display:none;line-height:1.8;font-family:Noto Serif SC,serif';
    document.body.appendChild(tip);}
  // 位置描述
  let locStr;
  if(atCity){
    locStr=atCity.name;
  } else if(unit.status==='march' && unit.hexPath && unit.hexPath.length > 0){
    const curCityId = HEX_CITY[hkey(unit.hq??0, unit.hr??0)];
    const destHex = unit.hexPath[unit.hexPath.length-1];
    const destCityId = HEX_CITY[hkey(destHex.col, destHex.row)];
    const fromName = curCityId ? (G.cities[curCityId]?.name||'?') : '野外';
    const toName = destCityId ? (G.cities[destCityId]?.name||'?') : '前方';
    locStr=`${fromName}→${toName} (${unit.hexPath.length}格)`;
  } else {
    locStr='野外';
  }

  // v97: 敌方tooltip简化（隐藏AP、补给等内部信息）
  const titleName = isEnemy ? fuzzyGenDisplay(unit, _si) : (unit.squads[0]?.genName||'?') + '部';
  const statusLine = isEnemy
    ? `<div style="font-size:9px;color:rgba(92,74,50,.55);margin-bottom:3px">${unit.status==='garrison'?'🛡驻扎':'⚔行军'} · ${locStr}</div>`
    : `<div style="font-size:9px;color:rgba(92,74,50,.55);margin-bottom:3px">${unit.status==='garrison'?'🛡驻扎':unit.status==='camp'?'🏕扎营':unit.status==='ambush'?'🌿埋伏':'⚔行军'} · ${locStr} · AP${ap}/旬</div>`;
  const supplyLine = isEnemy ? ''
    : ((unit._noSupplyTurns||0)>0?`<div style="font-size:9px;color:#ff4030;font-weight:700">${unit._noSupplyTurns<=SUPPLY_RATIONS?'⚠ 补给断绝（存粮'+(SUPPLY_RATIONS-unit._noSupplyTurns)+'旬）':'🍚 断粮第'+(unit._noSupplyTurns-SUPPLY_RATIONS)+'旬！'}</div>`:'<div style="font-size:9px;color:#1a7a3a">✅ 补给通畅</div>');

  // v97: 情报精度提示
  const intelHint = isEnemy ? `<div style="font-size:8px;color:rgba(80,65,40,.15);margin-top:2px">${
    _si >= 90 ? '🔍 情报精确' : _si >= 75 ? '🔍 情报较清晰' : _si >= 60 ? '🔍 情报模糊' : '🔍 情报极模糊'
  }</div>` : '';

  const stackHtml=stackMates.length?`
    <div style="border-top:1px solid rgba(80,65,40,.10);margin-top:5px;padding-top:4px;font-size:9px;color:rgba(92,74,50,.55)">
      同位置另有 ${stackMates.length} 支部队：<br>
      ${stackMates.map(u=>{
        const sEnemy = u.fac !== G.playerFac && !canSeeFactionData(G.playerFac, u.fac);
        const sInt = sEnemy ? getScoutINT(u) : 99;
        const sName = sEnemy ? fuzzyGenDisplay(u, sInt) : u.squads[0]?.genName+'部';
        return `<span style="color:${getFactionDef(u.fac)?.color}">${sName}</span>`;
      }).join('、')}
    </div>
    <div style="font-size:8px;color:rgba(92,74,50,.35);margin-top:2px">点击旗帜可展开选择菜单</div>`:'';

  tip.innerHTML=`<div style="font-family:'Noto Serif SC',serif;color:${getFactionDef(unit.fac)?.color};margin-bottom:4px;font-size:12px">${titleName}</div>
    ${statusLine}
    ${supplyLine}
    ${squadLines}${troopLine}
    ${turnsLeft && !isEnemy?`<div style="font-size:9px;color:#8a6a10">→ 约${turnsLeft}旬到达</div>`:''}
    ${intelHint}
    ${stackHtml}
    <div style="font-size:8px;color:rgba(92,74,50,.35);margin-top:2px">左键选中</div>`;
  tip.style.display='block';tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY-8)+'px';
}
