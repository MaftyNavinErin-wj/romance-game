// src/render/ui_panels.js
//
// 主 UI 面板渲染 — 顶部信息栏 / 势力面板(左) / 城市面板 / 武将列表
//
// 来源:从 project_romance_v181.html 整体抽离(Session 2.3 / 阶段 2)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),全局函数风格保持。
// 接口风格:全局函数(同 phase 2.1 决定),所有调用点不需改。
//
// 抽离的 4 个 PANEL 单元:
//   1. renderTurnInfo()(原 L14482-L14489):顶部信息栏(turnDisp + seasonTag)
//   2. renderLeft + invalidateLeftCache + _leftPanelCache(原 L14491-L14619):
//      左侧势力卡列表(#factionList),含 turn 级缓存
//   3. renderCityTab + _renderCityList + _renderCityDetail(原 L15679-L16100):
//      右侧"城市"tab,两级:列表模式(按郡分组)+ 详情模式(选中城市)
//   4. renderGenTab(原 L16102-L16294):右侧"武将"tab(武将列表 + 派系卡)
//
// 留 v181 的(本 session 不动):
//   - renderRight(L15665):tab dispatcher(8 个 tab 路由),含 renderMilTab/PostTab/
//     StatsTab/TechTab/SchemeTab/EthosTab/DipTab/FactionTab 等未抽离的 tab,留 v181
//     避免跨文件导入。renderRight 在 v181 inline 中可直接调用本文件的 renderCityTab/
//     renderGenTab(同 realm 共享 script-scope)
//   - renderAll / renderAllLight(L14124 / L14134):top-level 编排器,留 v181
//   - renderMap / renderUnitsOnly / renderUnitsOnMap:地图/部队 SVG 渲染,phase 2 hex
//     系统范围,留 v181
//   - renderFactionTab(L16800):右侧"势力"tab,在 PLAN 4 项之外,留 v181
//   - 各种 tab-specific renders(MilTab/PostTab/StatsTab/TechTab/SchemeTab/EthosTab/DipTab):留 v181
//   - openPostAppoint / openPostAction / openGenProfile / closeGenProfile / getCourtStatusText /
//     _buildCourt*(夹在 renderGenTab 与 renderFactionTab 之间):留 v181
//
// 依赖(同 realm 共享,无需修改):
//   - DOM 元素:#turnDisp / #seasonTag / #factionList / #rightContent
//   - 全局数据:G / FAC / TAX / POLICY / CORVEE / GEN_TAGS / CITY_TO_STATE 等
//   - 全局函数(hoisted):getCityProd / calcCityCorruption / getStrategistInt / 各种 fmt 工具

// ── 顶部信息栏 ──
function renderTurnInfo(){
  document.getElementById('turnDisp').textContent=`${YEARS[G.year]} · 第${G.turn}旬`;
  const s=SEASONS[G.seasonIdx];
  const el=document.getElementById('seasonTag');
  el.textContent=s;
  const sc={春:'#1a7a3a',夏:'#c03030',秋:'#6b5530',冬:'#1a5f8a'};
  el.style.color=sc[s];el.style.borderColor=sc[s];
}

// ── 左侧势力面板(含 turn 级缓存) ──
let _leftPanelCache = { turn: -1, html: '' }; // ★ v167fix #34: renderLeft缓存
function invalidateLeftCache() { _leftPanelCache.turn = -1; }
function renderLeft(){
  // ★ v167fix #34: 势力卡数据只在旬切换时变化，交互操作直接用缓存
  const el = document.getElementById('factionList');
  if(_leftPanelCache.turn === G.turn && _leftPanelCache.selFac === G.selFac){
    el.innerHTML = _leftPanelCache.html;
  } else {
  // ★ 势力卡（增加金钱净产出/旬 和 粮食净变化/旬）
  const _html = Object.keys(FAC).map(fid=>{
    const f=G.factions[fid],fd=FAC[fid];
    const tax=TAX.find(t=>t.id===(f?.taxId||'norm'));
    // 一次遍历城市，计算所有需要的净收入/存粮
    let totalFood=0,grossGold=0,woodNet=0,ironNet=0,totalGar=0,foodNetRaw=0;
    // ★ v150fix BUG5: 预计算粮食buff（官职/朝议/蒋琬），与processCityFood保持一致
    const _pb = f?._postBuffs;
    const _foodProdBuff = (_pb && _pb.foodProd) ? (1 + _pb.foodProd) : 1;
    const _jiangwanBuff = (hasFacGen(fid, '蒋琬') && genHasOffice('蒋琬', fid)) ? 1.05 : 1;
    const _facCities = Object.values(G.cities).filter(c=>c.fac===fid);
    const _cityCount = _facCities.length;
    _facCities.forEach(city=>{
      const p=getCityProd(city);
      totalFood  += city.storage;
      // ★ v150fix B1: 金产扣腐败后累加（对齐processFacEconomy）
      const cRate = calcCityCorruption(city, _cityCount);
      grossGold  += (p.gold - Math.floor(p.gold * cRate))*(tax?.goldM||1);
      woodNet    += p.wood;
      ironNet    += p.iron;
      totalGar   += city.garrison;
      const granLv=city.buildings.granary||0;
      // ★ v150fix BUG4: 使用SPOIL_RATES常量（旧值[0.020,0.012,0.008,0.003]已过期）
      // ★ v150fix BUG5: 粮产叠加官职/朝议/蒋琬buff
      const buffedFood = Math.floor(Math.floor(p.food * _foodProdBuff) * _jiangwanBuff);
      foodNetRaw += buffedFood - getCityFoodCost(city).total - city.storage*SPOIL_RATES[granLv];
    });
    // ★ v150fix B1: 金产叠加官职buff + 张昭+3%（对齐processFacEconomy）
    const _goldProdBuff = (_pb && _pb.goldProd) ? _pb.goldProd : 0;
    const _zhangzhaoBuff = (hasFacGen(fid,'张昭') && genHasOffice('张昭',fid)) ? 0.03 : 0;
    const buffedGold = Math.floor(grossGold * (1 + _goldProdBuff + _zhangzhaoBuff));
    // ★ v150fix B2: 木铁叠加费祎+5%（对齐processFacEconomy）
    const _feiyiBuff = (hasFacGen(fid,'费祎') && genHasOffice('费祎',fid)) ? 1.05 : 1;
    const buffedWood = Math.floor(woodNet * _feiyiBuff);
    const buffedIron = Math.floor(ironNet * _feiyiBuff);
    const garSalDisplay=Math.floor(totalGar*GAR_SALARY_RATE);
    const unitSalDisplay=getFacUnitSalary(fid);
    const postSalDisplay=calcPostSalary(fid); // ★ v92: 补上官职俸禄
    const tributeDisplay=f._tributePaid||0; // ★ v150fix B1: 附庸纳贡扣金
    const _tradeAgrDisplay=calcTradeAgrIncome(fid); // ★ v165: 通商收入
    const goldNet=buffedGold+_tradeAgrDisplay-garSalDisplay-unitSalDisplay-postSalDisplay-tributeDisplay;
    const foodNet=foodNetRaw;

    const foodNetStr=fmtSigned(foodNet);
    const foodNetCls=foodNet>=0?'pos':'danger';
    const goldNetStr=fmtSigned(goldNet);
    const goldNetCls=goldNet>=0?'pos':'neg';
    const foodWarn=totalFood<5000?'danger':totalFood<12000?'warn':'';

    // C4: 判断是否可以看到该势力数据
    const canSee = canSeeFactionData(G.playerFac, fid);
    const knownCities = canSee ? f.cityCount : getKnownCityCount(G.playerFac, fid);
    const h_v = (v) => canSee ? v : '<span style="color:rgba(120,100,70,.4)">***</span>';
    const cityDisplay = canSee ? `${f.cityCount}` : `<span style="color:rgba(120,100,70,.5)">≥${knownCities}</span>`;

    return`<div class="fc ${fid}${G.selFac===fid?' active':''}" onclick="selFac('${fid}')">
      <div class="fc-h"><span class="fc-n ${fid}">${fd.full}</span><span class="fc-r">${getFactionRuler(fid)}</span></div>
      ${canSee ? `<div class="fc-stage" style="font-size:9px;color:${getStageColor(getStage(fid))};padding:0 8px 4px;letter-spacing:1px">⚑ ${getStageBadgeText(fid)}</div>` : ''}
      <div class="fc-s">
        <div class="sr">🌾总存粮<span class="sr-v ${canSee?foodWarn:''} ${canSee?'clickable-val':''}" ${canSee?`onclick="showFacBreakdown(event,'storage','${fid}')"`:''} >${h_v(fmt(totalFood))}</span></div>
        <div class="sr">💰金钱<span class="sr-v ${canSee?'clickable-val':''}" ${canSee?`onclick="showFacBreakdown(event,'gold','${fid}')"`:''} >${h_v(fmt(f.res.gold))}</span></div>
        <div class="sr">🪵木材<span class="sr-v ${canSee?'clickable-val':''}" ${canSee?`onclick="showFacBreakdown(event,'wood','${fid}')"`:''} >${h_v(fmt(f.res.wood))}</span></div>
        <div class="sr">⚙铁矿<span class="sr-v ${canSee?'clickable-val':''}" ${canSee?`onclick="showFacBreakdown(event,'iron','${fid}')"`:''} >${h_v(fmt(f.res.iron))}</span></div>
        <div class="sr">🐴马匹<span class="sr-v ${canSee?'clickable-val':''}" ${canSee?`onclick="showFacBreakdown(event,'horses','${fid}')"`:''} >${h_v(fmt(f.res.horses))}</span></div>
        <div class="sr">⚔兵力<span class="sr-v">${h_v(fmt(f.totalTroops))}</span></div>
        <div class="sr">🏰城池<span class="sr-v">${cityDisplay}</span></div>
        <div class="sr">👥人口<span class="sr-v">${h_v(fmt(f.totalPop))}</span></div>
      </div>
      ${canSee ? `<div class="fc-netrow">
        <div class="fc-netitem"><span class="fc-netlabel">粮净</span><span class="${foodNetCls} clickable-val" style="font-size:9px" onclick="showFacBreakdown(event,'food','${fid}')">${foodNetStr}/旬</span></div>
        <div class="fc-netitem"><span class="fc-netlabel">金净</span><span class="${goldNetCls} clickable-val" style="font-size:9px" onclick="showFacBreakdown(event,'gold','${fid}')">${goldNetStr}/旬</span></div>
      </div>
      <div class="fc-netrow" style="margin-top:2px">
        <div class="fc-netitem"><span class="fc-netlabel">木产</span><span class="pos clickable-val" style="font-size:9px" onclick="showFacBreakdown(event,'wood','${fid}')">+${fmt(buffedWood)}/旬</span></div>
        <div class="fc-netitem"><span class="fc-netlabel">铁产</span><span class="pos clickable-val" style="font-size:9px" onclick="showFacBreakdown(event,'iron','${fid}')">+${fmt(buffedIron)}/旬</span></div>
      </div>` : `<div class="fc-netrow"><div class="fc-netitem" style="color:rgba(120,100,70,.35);font-size:8px">情报不足</div></div>`}
      ${fid===G.playerFac ? (()=>{const _cs=getCourtStatusText(fid);return `<div class="fc-court ${_cs.cls}" onclick="switchTab('faction')">🏛 ${_cs.text}</div>`;})() : ''}
    </div>`;
  }).join('');
  el.innerHTML = _html;
  _leftPanelCache = { turn: G.turn, selFac: G.selFac, html: _html };
  } // end else (cache miss)

  // Tax
  document.getElementById('taxRow').innerHTML=TAX.map(t=>`<button class="tx-b${G.factions[G.playerFac].taxId===t.id?' active':''}" onclick="setTax('${t.id}')">${t.name}</button>`).join('');
  // Policy
  document.getElementById('polRow').innerHTML=POLICY.map(p=>`<button class="pl-b${G.factions[G.playerFac].policyId===p.id?' active':''}" onclick="setPolicy('${p.id}')">${p.name}</button>`).join('');
  // Corvee ★ v163
  document.getElementById('corveeRow').innerHTML=CORVEE.map(c=>`<button class="pl-b${(G.factions[G.playerFac].corveeId||'low')===c.id?' active':''}" onclick="setCorvee('${c.id}')">${c.name}</button>`).join('');
  // Toggle
  document.getElementById('resTog').classList.toggle('on',G.resupplyOn);
  // Transfer queue
  const tq=document.getElementById('tQueue');
  tq.innerHTML=G.transfers.length?`<div class="sec">运粮途中</div>`+G.transfers.map(t=>`
    <div class="tq">
      <span style="font-size:9px;color:rgba(92,74,50,.55)">${t.fromName}→${t.toName}</span>
      <div class="tq-bar"><div class="tq-fill" style="width:${((t.totalTurns-t.turnsLeft)/t.totalTurns*100).toFixed(0)}%"></div></div>
      <span style="font-size:9px;color:#2a7a9a">${t.turnsLeft}旬</span>
    </div>`).join(''):'';

  // v0.5: 长期补给线列表
  const slPanel=document.getElementById('supplyLinePanel');
  if(slPanel){
    const lines=Object.entries(G.supplyLines||{});
    slPanel.innerHTML=lines.length?`<div class="sec" style="margin-top:8px">长期补给线</div>`+
      lines.map(([toId,sl])=>{
        const toCity=G.cities[toId];
        return`<div style="display:flex;align-items:center;gap:5px;padding:3px 6px;font-size:9px;border-bottom:1px solid rgba(80,65,40,.06)">
          <span style="color:#60d0a0">📦</span>
          <span style="color:rgba(44,36,22,.60)">${sl.fromName}→${toCity?.name||toId}</span>
          <span onclick="cancelSupplyLine('${toId}')" style="margin-left:auto;cursor:pointer;color:rgba(92,74,50,.3);font-size:9px">取消</span>
        </div>`;
      }).join('')
    :'';
  }
}

// ── 城市面板(列表 + 详情) ──
function renderCityTab(c){
  // v112: 两级结构 — 列表模式 / 详情模式
  if(G.selCity) {
    _renderCityDetail(c);
  } else {
    _renderCityList(c);
  }
}

/** v112: 城池列表（从左面板迁移，按郡分组） */
function _renderCityList(c) {
  const listHtml = Object.entries(JUNS).map(([jid,jun])=>{
    const cities=CITIES_DEF.filter(cd=>cd.jun===jid);
    const fc=FAC[jun.fac];
    return`<div class="jun-item">
      <div class="jun-hd" style="border-left-color:${fc.color}60">
        <span style="color:${fc.color}aa">${jun.name}</span>
        <span style="font-size:9px;color:rgba(92,74,50,.35)">${cities.length}城</span>
      </div>
      ${cities.map(cd=>{
        const city=G.cities[cd.id];
        const fogLv = getCityFogLevel(G.playerFac, cd.id);
        // ★ v116: unexplored城市不在列表中显示
        if(fogLv === FOG_UNEXPLORED) return '';
        let displayFac = fogLv === FOG_VISIBLE ? city.fac
          : fogLv === FOG_EXPLORED ? (G.fogSnap?.[G.playerFac]?.[cd.id]?.fac || 'none')
          : 'none';
        const dfc = FAC[displayFac];
        const cityCol = fogLv === FOG_VISIBLE ? (dfc ? dfc.color : 'rgba(120,100,70,.4)')
                      : fogLv === FOG_EXPLORED ? (dfc ? dfc.color + '88' : 'rgba(160,140,100,.55)')
                      : 'rgba(100,85,60,.35)';
        const dot = fogLv === FOG_VISIBLE ? getCityFoodColor(city) : 'rgba(80,60,30,.3)';
        return`<div class="jun-city" onclick="selCity('${cd.id}')" style="cursor:pointer">
          <span style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0"></span>
          <span style="color:${cityCol}">${cd.name}</span>
          ${(fogLv===FOG_VISIBLE && cd.isCapital)?'<span style="font-size:8px;color:var(--ink-l);margin-left:1px">★</span>':''}
          <div class="city-tags-mini">
            ${(()=>{
              let tagHtml = (cd.tags||[]).map(t=>{
                const td=TAGS[t];
                return td ? `<span class="tag-mini">${td.icon}<span class="tag-mini-tip">${t}：${td.desc}</span></span>` : '';
              }).join('');
              const elite = Object.values(TROOP_TYPES).find(td=>td.elite && td.homeCity===cd.id);
              if(elite) tagHtml += `<span class="tag-elite">${elite.icon}<span class="tag-mini-tip">特色兵种：${elite.name}（${elite.desc}）</span></span>`;
              return tagHtml;
            })()}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  c.innerHTML = `<div class="sec">城池总览 ${_tabHelpHtml('city')}<span style="float:right;font-size:9px;color:rgba(92,74,50,.35)">点击查看详情</span></div>
    <div>${listHtml}</div>`;
}

/** v112: 城池详情（原renderCityTab逻辑） */
function _renderCityDetail(c){
  const city=G.cities[G.selCity];
  if(!city) return;

  // C4: 迷雾下城市信息受限
  const fogLv = getCityFogLevel(G.playerFac, G.selCity);
  // ★ v116: 敌方城市即使VISIBLE也只显示有限信息
  const isOwnOrAlly = city.fac === G.playerFac || getDiploStatus(G.playerFac, city.fac) === 'ally';
  if (fogLv !== FOG_VISIBLE || !isOwnOrAlly) {
    const tagBadgesLimited = (city.tags||[]).map(t=>{
      const td=TAGS[t]; if(!td) return '';
      return `<span class="tag-badge" style="color:${td.color};border-color:${td.color}40">${td.icon} ${t}<span class="tag-tip">${td.desc}</span></span>`;
    }).join('');
    const eliteLimited = Object.values(TROOP_TYPES).find(td=>td.elite && td.homeCity===G.selCity);
    const eliteBadgeLimited = eliteLimited ? `<span class="tag-badge" style="color:#a82a1a;border-color:rgba(168,42,26,.3);background:rgba(168,42,26,.04)">${eliteLimited.icon} ${eliteLimited.name}<span class="tag-tip">特色兵种：${eliteLimited.desc}（谁占城谁可征募）</span></span>` : '';
    const tagsHtmlLimited = `<div class="tag-row">${tagBadgesLimited}${eliteBadgeLimited}</div>`;
    let dispFacName, dispCol, dispInfo;
    if (fogLv === FOG_VISIBLE && !isOwnOrAlly) {
      // 可见但敌方——显示势力+大致信息
      const fc2 = FAC[city.fac] || {color:'#888',name:'?'};
      dispFacName = fc2.name; dispCol = fc2.color;
      const popTier = city.pop>=300000?'大城（繁华）':city.pop>=150000?'中城（一般）':'小城（偏僻）';
      const hasGarrison = (city.garrison||0)>500 || G.units.some(u=>u.fac===city.fac&&getUnitNodeId(u)===city.id);
      dispInfo = `${tagsHtmlLimited}
      <div style="color:rgba(92,74,50,.55);font-size:10px;line-height:2;margin-top:6px">
        归属：<span style="color:${dispCol}">${dispFacName}</span><br>
        规模：${popTier}<br>
        驻军：${hasGarrison?'<span style="color:#8a6a10">有驻军</span>':'<span style="color:rgba(120,100,70,.4)">未见驻军</span>'}<br>
        <span style="color:rgba(120,100,70,.35)">建筑/民心/存粮等内部情报不可知</span>
      </div>
      <div style="margin-top:16px;font-size:9px;color:rgba(120,100,70,.3)">敌方城池无法查看详细内政信息</div>`;
    } else if (fogLv === FOG_EXPLORED) {
      const snap = G.fogSnap?.[G.playerFac]?.[G.selCity];
      dispFacName = snap ? (FAC[snap.fac]?.name || '未知') : '未知';
      dispCol = snap ? (FAC[snap.fac]?.color || '#888') : '#888';
      dispInfo = `${tagsHtmlLimited}
        <div style="font-size:10px;color:${dispCol}99;margin-bottom:4px">归属：${dispFacName}（旧情报，第${snap?.turn??'?'}旬）</div>
        <div style="color:rgba(120,100,70,.5);font-size:10px;line-height:2;margin-top:12px">
          人口：<span style="color:rgba(120,100,70,.35)">???</span><br>
          驻军：<span style="color:rgba(120,100,70,.35)">???</span><br>
          存粮：<span style="color:rgba(120,100,70,.35)">???</span><br>
          民心：<span style="color:rgba(120,100,70,.35)">???</span><br>
          建筑：<span style="color:rgba(120,100,70,.35)">???</span>
        </div>
        <div style="margin-top:16px;font-size:9px;color:rgba(120,100,70,.3)">需派部队抵达城市视野范围以获取详细情报</div>`;
    } else {
      dispFacName = '未知'; dispCol = '#888';
      dispInfo = `${tagsHtmlLimited}<div style="color:rgba(120,100,70,.5);font-size:10px;margin-top:6px">尚未探索此区域</div>`;
    }
    c.innerHTML = `<div style="padding:12px">
      <div onclick="G.selCity=null;renderRight();renderMap();" style="cursor:pointer;font-size:10px;color:rgba(92,74,50,.55);margin-bottom:8px;display:flex;align-items:center;gap:4px">
        <span style="font-size:12px">←</span> 返回城池列表
      </div>
      <div style="font-family:'Noto Serif SC',serif;font-size:15px;color:${dispCol + (fogLv===FOG_EXPLORED?'bb':'')};margin-bottom:6px">${city.name}</div>
      ${dispInfo}
    </div>`;
    return;
  }

  const fc=FAC[city.fac] || {color:'#c04040', full:'叛乱势力', name:'叛军'};
  const ts=getCityStats(city.tags||[]);
  const prod=getCityProd(city);
  const costs=getCityFoodCost(city);
  const turns=getCityFoodTurns(city);
  const tax=TAX.find(t=>t.id===(G.factions[city.fac]?.taxId||'norm'));
  const isPlayer=city.fac===G.playerFac;
  const qCap=city.pop>=500000?4:city.pop>=250000?3:city.pop>=100000?2:1;
  const usedSlots=Object.keys(city.buildings).length;
  const granLv=city.buildings.granary||0;
  const spoilRate=SPOIL_RATES[granLv]*100; // ★ v150fix B4: 引用常量×100得百分比

  // ★ 粮食状态文字（可撑旬数）
  const fsClass=turns===Infinity?'fs-ok':turns>=9?'fs-warn':'fs-crit';
  let fsText;
  if(turns===Infinity) fsText='自给有余 ∞旬';
  else if(turns>=18)   fsText=`储备充足 可撑${turns.toFixed(0)}旬`;
  else if(turns>=9)    fsText=`存粮紧张 可撑${turns.toFixed(1)}旬`;
  else                 fsText=`⚠ 粮食告急 可撑${turns.toFixed(1)}旬`;

  // ★ v150fix C1: getCityFoodNet已含官职/蒋琬buff，直接引用
  const netFood=getCityFoodNet(city);
  const storageMaxEst=costs.total*24; // 大约24旬消耗量为显示上限
  const storagePct=Math.min(100,(city.storage/Math.max(storageMaxEst,city.storage))*100);

  const tagBadges=(city.tags||[]).map(t=>{
    const td=TAGS[t];
    if(!td) return '';
    return`<span class="tag-badge" style="color:${td.color};border-color:${td.color}40">
      ${td.icon} ${t}
      <span class="tag-tip">${td.desc}</span>
    </span>`;
  }).join('');
  const eliteTroop = Object.values(TROOP_TYPES).find(td=>td.elite && td.homeCity===G.selCity);
  const eliteBadge = eliteTroop ? `<span class="tag-badge" style="color:#a82a1a;border-color:rgba(168,42,26,.3);background:rgba(168,42,26,.04)">
    ${eliteTroop.icon} ${eliteTroop.name}
    <span class="tag-tip">特色兵种：${eliteTroop.desc}（谁占城谁可征募）</span>
  </span>` : '';

  const jun = JUNS[city.jun];
  c.innerHTML=`
  <div onclick="G.selCity=null;renderRight();renderMap();" style="cursor:pointer;font-size:10px;color:rgba(92,74,50,.55);margin-bottom:8px;display:flex;align-items:center;gap:4px">
    <span style="font-size:12px">←</span> 返回城池列表
  </div>
  <div class="cd-name" style="color:${fc.color}">${city.name}${city.isCapital?` <span style="font-size:11px;color:var(--ink-l)">★国都</span>`:''} ${_tabHelpHtml('city')}</div>
  <div class="cd-jun">${jun?.name||''} · ${fc.full}</div>
  <div class="tag-row">${tagBadges}${eliteBadge}</div>
  <div class="sec">粮食状态 <span style="font-size:8px;color:rgba(92,74,50,.35);font-family:'Noto Serif SC',serif">（点击数值查看计算链）</span></div>
  <div class="${fsClass}" style="cursor:pointer" onclick="showBreakdown(event,'storage','${city.id}')">${fsText}</div>
  <div class="storage-bar-wrap">
    <div class="storage-bar-label">
      <span class="clickable-val" onclick="showBreakdown(event,'storage','${city.id}')">存粮 ${fmt(city.storage)}石</span>
      <span class="clickable-val ${netFood>=0?'pos':'neg'}" onclick="showBreakdown(event,'cost','${city.id}')" style="color:${netFood>=0?'#1a7a3a':'#c03030'}">${fmtSigned(netFood)}/旬 (腐损${spoilRate}%)</span>
    </div>
    <div class="storage-bar">
      <div class="storage-bar-fill" style="width:${storagePct.toFixed(1)}%;background:${turns===Infinity?'#1a7a3a':turns>=9?'#8a6a10':'#c03030'}"></div>
    </div>
  </div>
  <div class="sec">城池状态</div>
  ${(()=>{
    const prefectGen = city.prefect ? GEN_MAP[city.prefect] : null; // ★ v167fix #33
    const prefectDeployed = prefectGen ? G.units.some(u=>u.squads.some(sq=>sq.genName===city.prefect)) : false;
    const polBonus = prefectGen ? prefectGen.pol : 0;
    const goldPct = prefectGen ? Math.round(polBonus/500*100) : 0;
    const moralePt = prefectGen ? (polBonus/200).toFixed(2) : 0;
    if(prefectGen){
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:7px;background:rgba(80,65,40,.05);border:1px solid rgba(92,74,50,.2);border-radius:1px">
        <div style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-weight:900;font-size:12px;background:${fc.color}22;border:1px solid ${fc.color}44;color:${fc.color};flex-shrink:0">${city.prefect[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:1px">
            <span style="font-family:'Noto Serif SC',serif;font-size:11px;color:${fc.color}">${city.prefect}</span>
            <span style="font-size:8px;color:rgba(92,74,50,.40)">太守</span>
            <span style="font-size:8px;color:rgba(92,74,50,.40)">政${polBonus}</span>
            ${prefectDeployed ? `<span style="font-size:8px;color:#c03030;border:1px solid rgba(232,60,60,.3);padding:0 3px">出征中</span>` : ''}
          </div>
          <div style="font-size:9px;color:rgba(92,74,50,.45)">${prefectDeployed
            ? `<span style="color:#c03030">出征减半：</span>💰+${Math.round(goldPct/2)}% · 🌿+${(moralePt/2).toFixed(2)}/旬 · 叛乱-${Math.round(polBonus/300*100/2)}%`
            : `💰+${goldPct}% · 🌿+${moralePt}/旬 · 叛乱-${Math.round(polBonus/300*100)}%`
          }</div>
        </div>
        ${isPlayer ? `<button onclick="openPrefectModal('${city.id}')" style="padding:3px 8px;background:transparent;border:1px solid rgba(92,74,50,.3);color:rgba(92,74,50,.55);font-size:9px;cursor:pointer;font-family:'Noto Serif SC',serif">改任</button>` : ''}
      </div>`;
    } else {
      return isPlayer ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;margin-bottom:7px;background:rgba(80,65,40,.03);border:1px dashed rgba(80,65,40,.14);border-radius:1px">
        <span style="font-size:10px;color:rgba(92,74,50,.35);font-family:'Noto Serif SC',serif">尚未任命太守</span>
        <button onclick="openPrefectModal('${city.id}')" style="padding:3px 10px;background:linear-gradient(135deg,rgba(80,65,40,.10),rgba(80,65,40,.04));border:1px solid rgba(92,74,50,.3);color:rgba(92,74,50,.65);font-size:9px;cursor:pointer;font-family:'Noto Serif SC',serif;clip-path:polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)">任命太守</button>
      </div>` : `<div style="font-size:10px;color:rgba(80,65,40,.15);padding:4px 0 7px">无太守</div>`;
    }
  })()}
  <div class="bar-wrap">
    <div class="bar-label"><span class="clickable-val" onclick="showPopBreakdown(event,'${city.id}')">人口 ${fmt(city.pop)}</span><span class="clickable-val" onclick="showBreakdown(event,'quality','${city.id}')">质量 ${city.popQuality.toFixed(0)}%</span></div>
    <div class="bar"><div class="bar-fill" style="width:${Math.min(100,city.pop/1200)}%;background:linear-gradient(90deg,var(--ink-l),var(--ink))"></div></div>
  </div>
  <div class="bar-wrap">
    <div class="bar-label"><span class="clickable-val" onclick="showBreakdown(event,'morale','${city.id}')">民心 ${city.morale.toFixed(0)}</span><span>城防 ${fmt(city.garrison)}/${fmt(garrisonCap(city))}</span></div>
    <div class="bar"><div class="bar-fill" style="width:${city.morale}%;background:linear-gradient(90deg,${city.morale<40?'#c03030':city.morale<60?'#8a6a10':'#1a7a3a'},${city.morale<40?'#ff6060':city.morale<60?'#8a7040':'#60e080'})"></div></div>
  </div>
  ${(()=>{
    const gv = city.gentry ?? 50;
    const gl = getGentryLevel(gv);
    const gPct = Math.min(100, gv);
    const gentryEffects = [];
    if(gl.goldMult !== 1) gentryEffects.push(`税收${gl.goldMult>1?'+':''}${Math.round((gl.goldMult-1)*100)}%`);
    if(gl.recruitMult !== 1) gentryEffects.push(`征兵${gl.recruitMult>1?'+':''}${Math.round((gl.recruitMult-1)*100)}%`);
    if(gl.moraleMod !== 0) gentryEffects.push(`守军士气${gl.moraleMod>0?'+':''}${gl.moraleMod}`);
    const effStr = gentryEffects.length ? `<span style="font-size:8px;color:${gl.color}88;margin-left:4px">${gentryEffects.join(' ')}</span>` : '';
    // ★ v161: 属县列表（可展开）
    let countyHtml = '';
    if(city.counties && city.counties.length > 1){
      const countyRows = city.counties.map((c,ci) => {
        const cl = getGentryLevel(c.loyalty);
        const pct = Math.min(100, c.loyalty);
        const typeLabel = c.type==='seat'?'治所':c.type==='clan_base'?c.clanFamily||'豪族':'';
        const typeTag = typeLabel ? `<span style="font-size:7px;color:${cl.color}88;margin-left:2px">${typeLabel}</span>` : '';
        // 查找该家族在势力中任官的武将
        let officerHtml = '';
        if(c.type==='clan_base' && c.clanFamily && city.fac){
          const officer = (G.generals[city.fac]||[]).find(g => (GEN_TAGS[g.name]||{}).clan === c.clanFamily && (getGenPostDef(g.name) || Object.values(G.cities).some(ct=>ct.fac===city.fac&&ct.prefect===g.name)));
          if(officer){
            const post = getGenPostDef(officer.name);
            const prefCity = Object.values(G.cities).find(ct=>ct.fac===city.fac&&ct.prefect===officer.name);
            let roleStr;
            if(post) roleStr = post.name;
            else if(prefCity) roleStr = (CITY_MAP[prefCity.id]?.name||'')+'太守';
            else roleStr = '在朝';
            officerHtml = `<span style="font-size:7px;color:#5a8a3a;margin-left:2px">👤${officer.name}·${roleStr}</span>`;
          }
        }
        return `<div style="display:flex;align-items:center;gap:4px;padding:5px 4px;font-size:10px;cursor:pointer;border-radius:3px;position:relative;z-index:1" onclick="showCountyTip(event,'${city.id}',${ci})" onmouseenter="this.style.background='rgba(80,65,40,.08)'" onmouseleave="this.style.background=''">
          <span style="width:36px;flex-shrink:0;color:rgba(92,74,50,.7)">${c.name}</span>${typeTag}${officerHtml}
          <div style="flex:1;height:4px;background:rgba(80,65,40,.08);border-radius:2px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${cl.color};border-radius:2px"></div>
          </div>
          <span style="width:22px;text-align:right;color:${cl.color};font-size:8px">${Math.floor(c.loyalty)}</span>
          <span style="font-size:7px;color:rgba(92,74,50,.3)">▶</span>
        </div>`;
      }).join('');
      countyHtml = `<details style="margin-top:2px;margin-bottom:6px;position:relative;z-index:2"><summary style="cursor:pointer;font-size:9px;color:rgba(92,74,50,.55);padding:3px 0">▶ 属县详情（实控率 ${Math.floor(gv)}%）</summary>
        <div style="padding:2px 0 4px 4px">${countyRows}</div></details>`;
    }
    return `<div class="bar-wrap">
      <div class="bar-label"><span class="clickable-val" style="color:${gl.color}" onclick="showBreakdown(event,'gentry','${city.id}')">豪族 ${Math.floor(gv)} <span style="font-size:8px">${gl.label}</span></span>${effStr}</div>
      <div class="bar"><div class="bar-fill" style="width:${gPct}%;background:linear-gradient(90deg,${gl.color}88,${gl.color})"></div></div>
    </div>${countyHtml}`;
  })()}
  <div class="sec">本旬产出</div>
  <div class="res-grid">
    <div class="ri" style="cursor:pointer" onclick="showBreakdown(event,'food','${city.id}')">
      <div class="ri-n">🌾 粮食 <span style="font-size:8px;color:rgba(92,74,50,.35)">▶</span></div>
      <div class="ri-v">${fmt(prod.food)}</div>
      <div class="ri-d neg">消耗 -${fmt(Math.floor(costs.civil+costs.garrison))}</div>
    </div>
    <div class="ri" style="cursor:pointer" onclick="showBreakdown(event,'gold','${city.id}')">
      <div class="ri-n">💰 金钱 <span style="font-size:8px;color:rgba(92,74,50,.35)">▶</span></div>
      <div class="ri-v">${fmt(prod.gold)}</div>
      <div class="ri-d neuc">税×${tax?.goldM.toFixed(2)}</div>
    </div>
    <div class="ri" style="cursor:pointer" onclick="showBreakdown(event,'wood','${city.id}')">
      <div class="ri-n">🪵 木材 <span style="font-size:8px;color:rgba(92,74,50,.35)">▶</span></div>
      <div class="ri-v">${fmt(prod.wood)}</div>
      <div class="ri-d pos">+${fmt(prod.wood)}/旬</div>
    </div>
    <div class="ri" style="cursor:pointer" onclick="showBreakdown(event,'iron','${city.id}')">
      <div class="ri-n">⚙ 铁矿 <span style="font-size:8px;color:rgba(92,74,50,.35)">▶</span></div>
      <div class="ri-v">${fmt(prod.iron)}</div>
      <div class="ri-d ${(city.tags||[]).includes('产铁')?'pos':'neuc'}">${(city.tags||[]).includes('产铁')?'产铁城':'普通产出'}</div>
    </div>
  </div>
  <div class="sec">基建 <span style="float:right;font-size:9px">${usedSlots}/${ts.slots}槽 · 队列${city.buildQueue.length}/${qCap}</span></div>
  <div class="bld-grid">
  ${Object.keys(BLDS).map(bid=>{
    const bld=BLDS[bid];
    const lv=city.buildings[bid]||0;
    const inQ=city.buildQueue.find(q=>q.id===bid);
    const _rtags=[...(city.tags||[])]; if(_canBuildTradePost(city.id))_rtags.push('_tradepost'); // ★ v164
    const restricted=bld.restrict.length&&!bld.restrict.some(req=>_rtags.includes(req));
    const maxed=lv>=3;
    const cls=maxed?'maxed':inQ?'building':restricted?'locked':'';
    const prog=inQ?((inQ.totalTurns-inQ.turnsLeft)/inQ.totalTurns*100).toFixed(0):0;
    const stars='●'.repeat(lv)+'○'.repeat(3-lv);
    const _i1=isPlayer&&!maxed&&!restricted&&lv<3?getPrefectBuildBuff(G.selCity,bid):{bonus:0,label:''};
    const _i1html=_i1.bonus>0?`<span style="color:#5a5;font-size:8px" title="太守加速：${_i1.label}"> ⬆${(_i1.bonus*100).toFixed(0)}%</span>`:_i1.bonus<0?`<span style="color:#a55;font-size:8px" title="太守减速：${_i1.label}"> ⬇${Math.abs(_i1.bonus*100).toFixed(0)}%</span>`:'';
    const _corvBld=CORVEE.find(c=>c.id===(G.factions[city.fac]?.corveeId||'low'))||CORVEE[0];
    const _corvBldHtml=_corvBld.buildBonus>0&&!maxed&&lv<3?`<span style="color:#b8860b;font-size:8px" title="徭役加速（${_corvBld.name}）"> 🔨+${Math.round(_corvBld.buildBonus*100)}%</span>`:'';
    const _milDisc=(bld.cat==='mil'&&!maxed&&lv<3)?(getCourtDecreeBuffs(city.fac).milBuildCost||0):0;
    const _milDiscHtml=_milDisc?`<span style="color:#5ca;font-size:8px" title="朝议·军防工程"> 💰${(_milDisc*100).toFixed(0)}%</span>`:'';
    const _tpInfo = (bid==='tradepost') ? _canBuildTradePost(city.id) : null; // ★ v164: 动态名称
    const _dispName = _tpInfo ? _tpInfo.name : bld.name;
    const _dispIcon = _tpInfo ? _tpInfo.icon : bld.icon;
    return`<div class="bld ${cls}" onclick="${isPlayer&&!restricted&&!maxed&&!inQ?`buildBld('${G.selCity}','${bid}')`:''}"
      title="${_dispName} Lv${lv} - ${restricted?'城池类型不符':maxed?'已满级':lv<3?bld.levels[lv]?.eff:''}">
      <div class="bld-n">${_dispIcon} ${_dispName}${_i1html}${_corvBldHtml}${_milDiscHtml}</div>
      <div class="bld-lv">${stars} ${inQ?`建设中(${inQ.turnsLeft}旬)`:maxed?'满级':restricted?'不适用':lv===0?'未建':bld.levels[lv]?.eff}</div>
      ${inQ?`<div class="bld-prog" style="width:${prog}%"></div>`:''}
    </div>`;
  }).join('')}
  </div>
  ${city.buildQueue.length?`<div class="sec">建设队列</div>`+city.buildQueue.map(q=>`
    <div style="display:flex;align-items:center;gap:7px;padding:3px 0;font-size:10px;border-bottom:1px solid var(--border)">
      <span>${(q.id==='tradepost'&&_canBuildTradePost(city.id))?(_canBuildTradePost(city.id).icon+' '+_canBuildTradePost(city.id).name):(BLDS[q.id].icon+' '+BLDS[q.id].name)} Lv${q.targetLevel}</span>
      <div style="flex:1;height:2px;background:rgba(80,65,40,.08)"><div style="height:100%;background:var(--ink-l);width:${((q.totalTurns-q.turnsLeft)/q.totalTurns*100).toFixed(0)}%"></div></div>
      <span style="color:rgba(92,74,50,.55)">${q.turnsLeft}旬</span>
    </div>`).join(''):''}
  ${isPlayer?`<div class="sec">驻防与野战</div>
  <div class="ud-stats" style="margin-bottom:8px">
    <div class="ud-stat-row"><span>城防军</span><b>${fmt(city.garrison)}<span style="color:rgba(92,74,50,.35);font-weight:400">/${fmt(garrisonCap(city))}</span></b></div>
    <div class="ud-stat-row"><span>存粮</span><b>${fmt(Math.floor(city.storage))}石</b></div>
  </div>
  ${(()=>{
    const nearby=G.units.filter(u=>{
      const _uhp2=hexToPixel(u.hq??0,u.hr??0); const atPx=_uhp2.x,atPy=_uhp2.y;
      return Math.abs(city.x-atPx)<15&&Math.abs(city.y-atPy)<15;
    });
    if(!nearby.length) return '<div style="font-size:10px;color:rgba(80,65,40,.15);padding:4px 0 8px">无野战部队驻扎于此</div>';
    return nearby.map(u=>{
      const total=getUnitTroops(u);
      const isSel=G.selUnitId===u.id;
      return '<div class="uo-card'+(isSel?' sel':'')+'" style="margin-bottom:4px"'+
        ' onclick="G.selUnitId=\''+u.id+'\';G.activeTab=\'mil\';updateTabs();renderAllLight()">'+
        '<div class="uo-card-top">'+
        '<span class="uo-name" style="color:'+FAC[u.fac]?.color+'">'+u.squads[0]?.genName+'部</span>'+
        '<span class="uo-status '+u.status+'">'+(u.status==='garrison'?'🛡驻':'⚔行')+'</span>'+
        '</div>'+
        '<div class="uo-bottom">'+u.squads.map(s=>TROOP_TYPES[s.type]?.icon||'').join('')+' '+fmt(total)+'兵</div>'+
        '</div>';
    }).join('');
  })()}
  ${G.cities[G.selCity]?.recruitedThisTurn
    ? `<button class="act-btn" style="opacity:.45;cursor:not-allowed" onclick="showNotif('本旬已征兵，请下旬再来','warn')">⚔ 征募新部队 <span style="font-size:9px">（本旬已征）</span></button>`
    : `<button class="act-btn" onclick="openRecruitModal('${G.selCity}')">⚔ 征募新部队</button>`
  }
  ${(()=>{
    // ★ v166: 迁民按钮
    const _migCity = G.cities[G.selCity];
    if(!_migCity || _migCity.fac !== G.playerFac) return '';
    const _migCheck = canMigrate(G.selCity);
    if(_migCheck.ok){
      return `<button class="act-btn" onclick="showMigrateDialog('${G.selCity}')" style="color:#8a6a10;border-color:rgba(138,106,16,.25)">⇄ 迁民</button>`;
    } else {
      return `<button class="act-btn" style="opacity:.4;cursor:not-allowed" title="${_migCheck.reason}">⇄ 迁民 <span style="font-size:8px;color:rgba(92,74,50,.4)">（${_migCheck.reason}）</span></button>`;
    }
  })()}
  ${(()=>{
    // ★ v113: billetPool — 休整兵员列表
    const _bpCity = G.cities[G.selCity];
    const _bpPool = _bpCity?.billetPool || [];
    if(!_bpPool.length || _bpCity.fac !== G.playerFac) return '';
    const rows = _bpPool.map((bp,i) => {
      const tIcon = TROOP_TYPES[bp.type]?.icon || '';
      const tName = TROOP_TYPES[bp.type]?.name || bp.type;
      const restT = G.turn - bp.billetTurn;
      const inTransit = bp.readyTurn && bp.readyTurn > G.turn;
      const transitLeft = inTransit ? (bp.readyTurn - G.turn) : 0;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-bottom:1px solid rgba(80,65,40,.06)">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:14px">${tIcon}</span>
          <div>
            <div style="font-size:10px;color:rgba(44,36,22,.7)">${tName} · ${fmt(bp.troops)}兵 · Lv${bp.level}${bp.genName?` <span style="color:#8a7040;font-size:8px">🔒${bp.genName}</span>`:''}</div>
            <div style="font-size:8px;color:rgba(92,74,50,.35)">${inTransit?`🚶 行军中·${transitLeft}旬后抵达`:`休整${restT}旬 · 满编${fmt(bp.maxTroops)}`}</div>
          </div>
        </div>
        ${inTransit
          ?`<span style="font-size:9px;color:rgba(92,74,50,.35);padding:3px 8px">行军中</span>`
          :`<button class="act-btn" onclick="openRedeployModal('${G.selCity}',${i})" style="font-size:9px;padding:3px 8px;margin:0">⚔ 编组</button>`}
      </div>`;
    }).join('');
    return `<div class="sec" style="margin-top:8px">休整屯田 <span style="float:right;font-size:9px;color:rgba(92,74,50,.35)">${_bpPool.length}支 · 粮饷1/5</span></div>
      <div style="border:1px solid rgba(92,74,50,.1);border-radius:4px;overflow:hidden">${rows}</div>`;
  })()}
  ${(()=>{
    // 围城警告面板（当有敌军围城时）
    const c2 = G.cities[G.selCity];
    const enemySiegeUnits = G.units.filter(u => u.status === 'siege' && u.siegeTarget === G.selCity && u.fac !== c2?.fac);
    if(!enemySiegeUnits.length) return '';
    const atkFac = enemySiegeUnits[0].fac;
    const atkNames = enemySiegeUnits.map(u => u.squads[0]?.genName || '?').join('、');
    const atkCol = FAC[atkFac]?.color || '#c03030';
    const defMult = getSiegeDefMult(c2).toFixed(2);
    const decayPct = Math.round((c2.siegeDecay||0)*100);
    const siegeTurns = enemySiegeUnits[0]._siegeTurnCount || 0;
    // 守方野战部队
    const myUnitsHere = G.units.filter(u => {
      if(u.fac !== c2.fac) return false;
      return getUnitNodeId(u) === G.selCity;
    });
    const breakoutBtn = myUnitsHere.length > 0 ?
      '<button class="act-btn" style="color:#8a7040;border-color:rgba(240,192,64,.35)" onclick="sortieFromCity(\'' + G.selCity + '\')">🗡 出城迎击</button>' :
      '<div style="font-size:9px;color:rgba(92,74,50,.35);padding:3px 0">（无野战部队，无法出城）</div>';
    return '<div style="margin-top:8px;padding:8px 10px;background:rgba(245,238,225,.6);border:1px solid ' + atkCol + '40;border-radius:4px">' +
      '<div style="font-size:10px;color:' + atkCol + ';font-weight:700;margin-bottom:6px">⚠ 敌军围城中</div>' +
      '<div style="font-size:9px;color:rgba(44,36,22,.7);line-height:1.9">' +
      '<span style="color:' + atkCol + '">' + atkNames + '部</span> 已围城 <b>' + siegeTurns + '旬</b><br>' +
      '城防加成 <b style="color:#8a7040">×' + defMult + '</b>（衰减' + decayPct + '%）' +
      (()=>{
        const gd = getGentryDefMult(G.selCity);
        if(gd >= 1.20) return '<br><span style="color:#4caf50">豪族协防 ×' + gd.toFixed(2) + '</span>';
        if(gd <= 0.55) return '<br><span style="color:#c0392b">豪族抗拒 ×' + gd.toFixed(2) + '</span>';
        if(gd <= 0.75) return '<br><span style="color:#e67e22">豪族不满 ×' + gd.toFixed(2) + '</span>';
        if(gd <= 0.92) return '<br><span style="color:#8a6a10">豪族松懈 ×' + gd.toFixed(2) + '</span>';
        return '';
      })() + '</div>' +
      '<div style="margin-top:6px">' + breakoutBtn + '</div></div>';
  })()}
  `:''}
  `;
}

// ── 武将列表面板 ──
function renderGenTab(c){
  const fid=G.selFac;
  const gens=G.generals[fid]||[];
  const fd=FAC[fid];
  const ac=v=>v>=90?'#8a7040':v>=75?'#1a7a3a':v>=60?'#1a5f8a':'#888';
  const ri={ruler:'👑',general:'⚔',advisor:'📜',minister:'🏛'};
  const aptColor={'S':'#8a7040','A':'#1a7a3a','B':'#1a5f8a','C':'#888888'};
  const gradeScore={'S':4,'A':3,'B':2,'C':1};
  const troopIcon={'cavalry':'🐴','light':'⚔','heavy':'🛡','archer':'🏹','siege':'⚙','naval':'⚓'};
  const isPlayer = fid === G.playerFac;

  // 已上场将领
  const deployed=new Set();
  G.units.forEach(u=>u.squads.forEach(sq=>deployed.add(sq.genName)));

  // ── 在野武将池区块（仅玩家势力 tab 显示）──
  const wildSection = isPlayer ? (()=>{
    if(!G.wildPool.length) return `<div style="font-size:10px;color:rgba(80,65,40,.15);padding:6px 0 10px">暂无在野武将</div>`;

    const nextRefresh = WILD_POOL_INTERVAL - ((G.turn - G.wildPoolTurn) % WILD_POOL_INTERVAL);
    const cards = G.wildPool.map(name=>{
      const g = WILD_GENS.find(x=>x.name===name);
      if(!g) return '';
      const meta = getGenMeta(name);
      const topStat = Math.max(g.com,g.war,g.int,g.pol,g.cha);
      const cdData = G.wildRecruitCD[name];
      const onCD = cdData && cdData.until > G.turn;
      const cdLeft = onCD ? cdData.until - G.turn : 0;
      const failCount = cdData?.failCount || 0;
      const cost = 1500 + failCount * 500;             // ★ B5: 统一
      const regionData = calcRegionRecruitBonus(name, fid);
      const clanData = calcClanRecruitBonus(name, fid);
      const gentryData = calcGentryRecruitBonus(name, fid);
      const ruler = (G.generals[fid]||[]).find(g2=>g2.role==='ruler');
      const chaB = ruler ? Math.min(0.15, (ruler.cha - 50) / 300) : 0;
      const rate = Math.min(92, Math.round((0.70 + Math.min(failCount*0.05,0.15) + chaB + regionData.bonus + clanData.bonus + gentryData.bonus)*100));
      const bonusLabels = [];
      if(regionData.count > 0) bonusLabels.push(`同乡+${Math.round(regionData.bonus*100)}%`);
      if(clanData.count > 0) bonusLabels.push(`同族+${Math.round(clanData.bonus*100)}%`);
      if(gentryData.count > 0) bonusLabels.push(`同门+${Math.round(gentryData.bonus*100)}%`);
      const bonusStr = bonusLabels.join(' ');
      const bestApt = Object.entries(g.apt||{}).sort((a,b)=>gradeScore[b[1]]-gradeScore[a[1]])[0];
      const canAfford = !onCD && (G.factions[fid]?.res?.gold||0) >= cost;
      const dimmed = onCD ? 'opacity:.45;filter:grayscale(.6);' : '';
      const btnLabel = onCD ? `⏳ ${cdLeft}旬后可请` : `招募 <span style="font-size:9px;opacity:.8">💰${cost}</span>${failCount>0?` <span style="font-size:8px;opacity:.6">第${failCount+1}请</span>`:''}`;
      const btnEnabled = !onCD && canAfford;
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;margin-bottom:5px;
        background:rgba(255,252,245,.55);border:1px solid rgba(92,74,50,.22);border-radius:3px;${dimmed}">
        <div style="width:32px;height:32px;border-radius:50%;background:rgba(120,90,20,.25);
          border:1px solid rgba(92,74,50,.4);display:flex;align-items:center;justify-content:center;
          font-family:'Noto Serif SC',serif;font-size:13px;color:var(--ink-l);flex-shrink:0">${g.name[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
            <span style="font-family:'Noto Serif SC',serif;font-size:11px;color:var(--ink-l)">${ri[g.role]||''} ${g.name}</span>
            <span style="font-size:8px;color:rgba(92,74,50,.45)">${meta.title||''}</span>
          </div>
          <div class="attrs" style="margin-bottom:3px">
            ${[['统',g.com],['武',g.war],['智',g.int],['政',g.pol],['魅',g.cha]].map(([l,v])=>
              `<span class="attr" style="color:${ac(v)};border-color:${ac(v)}35">${l}${v}</span>`
            ).join('')}
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${bestApt?`<span style="font-size:8px;color:${aptColor[bestApt[1]]};border:1px solid ${aptColor[bestApt[1]]}33;padding:1px 4px">${troopIcon[bestApt[0]]||''}${bestApt[1]}</span>`:''}
            ${meta.gentry?`<span style="font-size:8px;color:#6b5530;border:1px solid rgba(92,74,50,.3);padding:1px 4px">🏛${meta.gentry}</span>`:''}
            ${(meta.skills||[]).length?`<span style="font-size:8px;color:rgba(92,74,50,.40);border:1px solid rgba(80,65,40,.14);padding:1px 4px">✦${meta.skills.length}技</span>`:''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
          <div style="font-size:8px;color:rgba(92,74,50,.55);text-align:right">成功率 <b style="color:var(--ink-l)">${rate}%</b>${bonusStr?` <span style="color:#1a7a3a;font-size:7px">${bonusStr}</span>`:''}</div>
          <button onclick="recruitWild('${name}')" style="
            padding:3px 9px;font-size:10px;font-family:'Noto Serif SC',serif;cursor:${btnEnabled?'pointer':'not-allowed'};
            background:${btnEnabled?'rgba(120,90,10,.5)':'rgba(40,30,10,.4)'};
            border:1px solid ${btnEnabled?'rgba(92,74,50,.55)':'rgba(120,100,40,.25)'};
            color:${btnEnabled?'var(--ink-l)':'rgba(92,74,50,.3)'};
            border-radius:2px;transition:all .15s;letter-spacing:.5px;white-space:nowrap"
            ${btnEnabled?'':'disabled'}
            onmouseover="if(${btnEnabled})this.style.background='rgba(160,120,15,.6)'"
            onmouseout="if(${btnEnabled})this.style.background='rgba(120,90,10,.5)'"
          >${btnLabel}</button>
        </div>
      </div>`;
    }).join('');

    return `<div style="font-size:10px;color:#6b5530;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center">
      <span>🌿 在野人才</span>
      <span style="font-size:8px;color:rgba(92,74,50,.35)">${(()=>{const rec=getAllRecruitedNames();const ny=WILD_GENS.filter(g=>!rec.has(g.name)&&G.turn<(g.minTurn||1)).length;return ny>0?`另有${ny}人尚未入世 · `:'';})()}共${G.wildPool.length}人 · ${nextRefresh}旬后刷新</span>
    </div>
    ${cards}
    <div style="border-top:1px solid rgba(80,65,40,.08);margin:10px 0 9px"></div>`;
  })() : '';

  // ── 可挖角武将区块（仅玩家势力 tab 显示）──
  const poachSection = isPlayer ? (()=>{
    const poachables = Object.entries(G.recruitableGens||{})
      .filter(([name,rec]) => rec.fid !== G.playerFac);
    if(!poachables.length) return '';

    const cards = poachables.map(([name, rec]) => {
      const gen = GEN_MAP[name]; // ★ v167fix #33
      if(!gen) return '';
      const srcFac = FAC[rec.fid] || {};
      const loy = G.genLoyalty[name] ?? 30;
      const topStat = Math.max(gen.com, gen.war, gen.int, gen.pol, gen.cha);
      const _techPoachCost = getTechEffect(G.playerFac, 'poachCostMult');
      const cost = Math.floor((topStat >= 90 ? 3000 : 1500) * (1 + _techPoachCost));
      const myGold = G.factions[G.playerFac]?.res?.gold || 0;
      const canAfford = myGold >= cost;
      // ★ v161: 挖角冷却检查（同一武将3旬内不能重复尝试）
      const lastAttempt = G._poachCooldown?.[name] || 0;
      const cdLeft = Math.max(0, lastAttempt + 3 - G.turn);
      const onCooldown = cdLeft > 0;
      const canPoach = canAfford && !onCooldown;
      const loyColor = loy < 20 ? '#c03030' : '#f0a040';
      let disableReason = '';
      if(!canAfford) disableReason = `金不足（需${cost}，有${Math.floor(myGold)}）`;
      else if(onCooldown) disableReason = `冷却中（${cdLeft}旬后）`;
      const btnTitle = canPoach ? '点击花费'+cost+'金挖角' : disableReason;
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;margin-bottom:5px;background:rgba(192,48,48,.04);border:1px solid rgba(192,48,48,.12);border-radius:1px">
        <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-weight:900;font-size:13px;background:${srcFac.color||'#888'}22;border:1px solid ${srcFac.color||'#888'}44;color:${srcFac.color||'#888'};flex-shrink:0">${name[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
            <span style="font-family:'Noto Serif SC',serif;font-size:11px;color:${srcFac.color||'#888'}">${name}</span>
            <span style="font-size:8px;color:rgba(92,74,50,.40)">${srcFac.name||rec.fid}军</span>
            <span style="font-size:8px;color:${loyColor};border:1px solid ${loyColor}44;padding:0 3px">忠${loy}</span>
          </div>
          <div style="font-size:9px;color:rgba(92,74,50,.40)">${[['统',gen.com],['武',gen.war],['智',gen.int],['政',gen.pol],['魅',gen.cha]].map(([l,v])=>`${l}${v}`).join(' ')}</div>
          ${disableReason ? `<div style="font-size:8px;color:#c03030;margin-top:1px">${disableReason}</div>` : ''}
        </div>
        <button onclick="poachGen('${name}')" ${canPoach?'':'disabled'} title="${btnTitle}" style="padding:4px 9px;background:${canPoach?'rgba(80,65,40,.12)':'rgba(80,65,40,.10)'};border:none;color:${canPoach?'#1a1000':'rgba(80,65,40,.2)'};font-family:'Noto Serif SC',serif;font-size:10px;cursor:${canPoach?'pointer':'not-allowed'};clip-path:polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%);white-space:nowrap">挖角 ${cost}💰</button>
      </div>`;
    }).join('');

    return `<div style="font-size:10px;color:#c04040;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center">
      <span>⚠ 可挖角武将</span>
      <span style="font-size:8px;color:rgba(192,48,48,.3)">${poachables.length}人忠诚动摇</span>
    </div>
    ${cards}
    <div style="border-top:1px solid rgba(192,48,48,.08);margin:10px 0 9px"></div>`;
  })() : '';

  c.innerHTML = wildSection + poachSection +
  `<div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:9px;display:flex;justify-content:space-between;align-items:center">
    <span>武将总览 ${_tabHelpHtml('gen')} <span style="font-size:9px;color:rgba(92,74,50,.30)">${fd.full} · ${gens.length}人</span></span>
    <span style="font-size:8px">点击武将查看详情</span>
  </div>`+
  gens.map(g=>{
    const meta=getGenMeta(g.name);
    const loyalty=G.genLoyalty?.[g.name]??80;
    const loy=loyaltyDisplay(loyalty);
    const isDeployed=deployed.has(g.name);
    const bestApt=Object.entries(g.apt||{}).sort((a,b)=>gradeScore[b[1]]-gradeScore[a[1]])[0];
    const skills=meta.skills||[];

    // ★ D1: 官职标签
    const _gPost = getGenPostDef(g.name);
    const _postBadge = _gPost ? `<span style="font-size:7px;color:#8a7040;border:1px solid rgba(240,192,64,.35);padding:0 3px;border-radius:1px">${_gPost.name}</span>` : '';

    return `<div class="gen-item" onclick="openGenProfile('${g.name}','${fid}')">
      <div class="gen-av" style="background:${fd.color}22;border:1px solid ${fd.color}55;color:${fd.color};position:relative">
        ${g.name[0]}
        ${isDeployed?`<div style="position:absolute;bottom:-2px;right:-2px;width:8px;height:8px;background:#c03030;border-radius:50%;border:1px solid rgba(0,0,0,.5)"></div>`:''}
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;flex-wrap:wrap">
          <span class="gen-name" style="color:${fd.color}">${ri[g.role]||''} ${g.name}</span>
          ${genClassTagsHtml(g.name)}
          ${_postBadge}
          <span style="font-size:8px;color:rgba(92,74,50,.40);letter-spacing:.5px">${meta.title||''}</span>
          ${isGenWounded(g.name)?`<span style="font-size:8px;color:#c03030;border:1px solid rgba(192,48,48,.3);padding:0 3px;border-radius:1px">🩸重伤</span>`:''}
        </div>
        <div class="attrs">
          ${[['统',g.com,'com'],['武',g.war,'war'],['智',g.int,'int'],['政',g.pol,'pol'],['魅',g.cha,'cha']].map(([l,v,s])=>{
            const wounded = isGenWounded(g.name) && (s==='war'||s==='int');
            const dispV = wounded ? Math.floor(v*0.8) : v;
            const col = wounded ? '#c03030' : ac(v);
            const baseV = G.genStatBase?.[g.name]?.[s];
            const grown = (baseV!==undefined && v > baseV) ? v - baseV : 0;
            const growMark = grown > 0 ? `<span style="color:#1a7a3a;font-size:7px">+${grown}</span>` : '';
            return `<span class="attr" style="color:${col};border-color:${col}35">${l}${dispV}${wounded?'↓':''}${growMark}</span>`;
          }).join('')}
          <span style="font-size:9px;margin-left:3px">${g.role==='ruler'?'':loy.icon}</span>
        </div>
        <div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">
          ${bestApt?`<span style="font-size:8px;color:${aptColor[bestApt[1]]||'#888'};border:1px solid ${aptColor[bestApt[1]]||'#888'}33;padding:1px 4px">
            ${troopIcon[bestApt[0]]||''}${aptColor[bestApt[1]]?bestApt[1]:''}</span>`:''}
          ${isDeployed?`<span style="font-size:8px;color:#c03030;border:1px solid rgba(232,60,60,.3);padding:1px 4px">出征中</span>`:''}
          ${meta.gentry?`<span style="font-size:8px;color:#6b5530;border:1px solid rgba(92,74,50,.3);padding:1px 4px">🏛${meta.gentry}</span>`:''}
          ${skills.length?`<span style="font-size:8px;color:rgba(92,74,50,.40);border:1px solid rgba(80,65,40,.14);padding:1px 4px">✦${skills.length}技</span>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}
