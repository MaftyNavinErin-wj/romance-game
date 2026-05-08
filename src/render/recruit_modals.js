// src/render/recruit_modals.js
//
// 渲染层(R)— 征兵 / 整备 / 扩编 / 增编分队 4 大 modal cluster.
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.7)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// 4 个 modal cluster 都是"部队/编制"相关的复杂 modal, 各有自己的 state let,
// 内部 helper 紧密耦合, 整体抽到本文件.
//
// ── 抽离范围(4 段)──
//   R4.7.a 征兵 modal cluster          v181 L7611-L8083 (1 let + 13 funcs)
//                                       _rm (let, 主征兵状态)
//                                       openRecruitModal / closeRecruitModal /
//                                       getDeployedGens / renderRecruitModal +
//                                       9 helpers (rmEditSlot/rmToggleSub/rmPickGen/
//                                                  rmPickType/_rmSetClass/
//                                                  _getBilletRetainerTroops/
//                                                  _getBilletRetainerType/
//                                                  rmSetTroops/rmAdjTroops) +
//                                       confirmRecruit
//   R4.7.b 整备 redeploy cluster       v181 L8783-L9058 (1 let + 8 funcs)
//                                       _rdp (let, 整备状态)
//                                       openRedeployModal / _rdpGetReadyPool /
//                                       _rdpSlotInfo / _renderRedeployModal /
//                                       _rdpEditSlot / _rdpToggleSub /
//                                       _rdpPickAux / _rdpPickGen / _confirmRedeploy
//   R4.7.c 扩编 expand cluster         v181 L9067-L9276 (1 let + 7 funcs)
//                                       _ex (let, 扩编状态)
//                                       openExpandModal / closeExpandModal /
//                                       renderExpandModal / exAdj / exSet / confirmExpand
//   R4.7.d 增编分队 addSquad cluster    v181 L9278-L9548 (1 let + 8 funcs)
//                                       _as (let, addSquad 状态)
//                                       _getIdleGens / openAddSquadModal /
//                                       closeAddSquadModal / renderAddSquadModal /
//                                       asPickGen / asPickType / asAdjTroops /
//                                       asSetTroops / confirmAddSquad
//
// 函数总数: 13 + 9 + 6 + 9 = **37 函数 + 4 lets**
//
// ── 写口归属声明 ──
// **本文件主要写口**:
//   - DOM #recruitModal / #redeployModal / #expandModal / #addSquadModal innerHTML / display
//   - _rm / _rdp / _ex / _as (各 modal 内部状态)
//   - G.units (征兵/编制后写入 unit + squads)
//   - G.cities[].billetPool / .recruitedThisTurn (征兵 + 整备扣兵员)
//   - G.factions[fid].res (扣资源)
//   - G.genJoinTurn / G.genLoyalty / G.genFactionMod (新武将上岗副作用)
//
// **跨链读取/调用**:
//   - calcSlotMatCost / canAffordMat / deductMat (经济链 E8)
//   - createUnit / TROOP_TYPES / getInitLevel / getEffectiveSquadLevel (军事链 MIL4)
//   - getRetainers / getRetainersDisplay / setRetainers (武将链 GEN1 部曲)
//   - addGenChronicle (武将链 GEN6)
//   - calcUnitAP / hkey / hexToPixel (map.js)
//   - showNotif / log (核心)
//   - GEN_TAGS / GEN_MAP / FAC (data + state)

// ════════════════════════════════════════════════════════════════════
// ── R4.7.a 征兵 modal cluster (v181 L7611-L8083) ──
// ════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════
let _rm = {
  open:false, cityId:null,
  mainGen:null,mainType:null,mainTroops:2000,
  sub1Gen:null,sub1Type:null,sub1Troops:0,sub1Active:false,
  sub2Gen:null,sub2Type:null,sub2Troops:0,sub2Active:false,
  editSlot:'main',
};

function openRecruitModal(cityId) {
  const city=G.cities[cityId];
  if(!city||city.fac!==G.playerFac){showNotif('只能在魏国城池征兵','warn');return;}
  if(city.recruitedThisTurn){showNotif(`${city.name}本旬已征兵，请下旬再来`,'warn');return;}
  _rm={open:true,cityId,mainGen:null,mainType:null,mainTroops:2000,
    sub1Gen:null,sub1Type:null,sub1Troops:0,sub1Active:false,
    sub2Gen:null,sub2Type:null,sub2Troops:0,sub2Active:false,editSlot:'main',
    mainClass:null,sub1Class:null,sub2Class:null}; // ★ v167: 武将四类选择
  document.getElementById('recruitModal').style.display='flex';
  renderRecruitModal();
}
function closeRecruitModal(){
  _rm.open=false;
  document.getElementById('recruitModal').style.display='none';
}

function getDeployedGens(fac){
  const names=new Set();
  G.units.filter(u=>u.fac===fac).forEach(u=>u.squads.forEach(s=>s&&names.add(s.genName)));
  // ★ v115: 研究中的武将也视为"已部署"，不可征兵/任太守/封官
  const tech = G.factions[fac]?._tech;
  if(tech?.current?.genName) names.add(tech.current.genName);
  return names;
}

function renderRecruitModal(){
  const city=G.cities[_rm.cityId], fac=G.factions[G.playerFac];
  const allGens=G.generals[G.playerFac]||[], deployed=getDeployedGens(G.playerFac);
  const totalTroops=_rm.mainTroops+(_rm.sub1Active?_rm.sub1Troops:0)+(_rm.sub2Active?_rm.sub2Troops:0);
  // ★ v167fix: 征兵费用只算新征兵人数，billet部曲免费唤醒
  const _rmBilletMain = _rm.mainGen ? Math.min(_rm.mainTroops, _getBilletRetainerTroops(_rm.mainGen)) : 0;
  const _rmBilletSub1 = (_rm.sub1Active && _rm.sub1Gen) ? Math.min(_rm.sub1Troops, _getBilletRetainerTroops(_rm.sub1Gen)) : 0;
  const _rmBilletSub2 = (_rm.sub2Active && _rm.sub2Gen) ? Math.min(_rm.sub2Troops, _getBilletRetainerTroops(_rm.sub2Gen)) : 0;
  const _rmBilletTotal = _rmBilletMain + _rmBilletSub1 + _rmBilletSub2;
  const _rmNewTroops = Math.max(0, totalTroops - _rmBilletTotal);
  const _rmRcBuff = G.factions[G.playerFac]?._postBuffs?.recruitCost || 0;
  const _rmGentryMult = getGentryRecruitMult(_rm.cityId); // ★ I2
  const _rmBarrDisc = getBarracksDiscount(city); // v111
  const _rmYibing = city._yibingBuff && city._yibingBuff.expiresAt > G.turn ? 0.70 : 1.0; // ★ v113
  const _rmTechRC = 1 + getTechEffect(G.playerFac, 'recruitCostMult'); // ★ v115
  // ★ v116: 特色兵种gold加成——取已选兵种中最高的costMult
  const _rmEliteMult = Math.max(
    TROOP_TYPES[_rm.mainType]?.costMult || 1.0,
    _rm.sub1Active ? (TROOP_TYPES[_rm.sub1Type]?.costMult || 1.0) : 1.0,
    _rm.sub2Active ? (TROOP_TYPES[_rm.sub2Type]?.costMult || 1.0) : 1.0
  );
  const costGold=Math.floor(1200*_rmNewTroops/5000 * (1 + _rmRcBuff) * _rmGentryMult * _rmBarrDisc * _rmYibing * _rmTechRC * _rmEliteMult);
  const _billetSavedStr = _rmBilletTotal > 0 ? ` <span style="color:#1a5f8a;font-size:9px">部曲${fmt(_rmBilletTotal)}人免费</span>` : '';
  const _barrPctStr = _rmBarrDisc < 1 ? ` <span style="color:#4caf50;font-size:9px">兵营${Math.round((_rmBarrDisc-1)*100)}%</span>` : '';
  const _gentryPctStr = _rmGentryMult !== 1 ? ` <span style="color:${_rmGentryMult<1?'#4caf50':'#c03030'};font-size:9px">豪族${_rmGentryMult<1?'':'+'}${Math.round((_rmGentryMult-1)*100)}%</span>` : '';
  const _yibingStr = _rmYibing < 1 ? ` <span style="color:#4caf50;font-size:9px">义兵-30%（${city._yibingBuff.expiresAt-G.turn}旬）</span>` : '';
  const _techRCStr = _rmTechRC < 1 ? ` <span style="color:#4caf50;font-size:9px">🔬科技${Math.round((_rmTechRC-1)*100)}%</span>` : '';
  const _eliteGoldStr = _rmEliteMult > 1 ? ` <span style="color:#8a6a10;font-size:9px">★王牌×${_rmEliteMult}</span>` : '';

  // 按兵种计算额外材料消耗（iron/wood/horses）
  function calcSlotMatCost(type, troops){
    if(!type||!troops) return {};
    const td=TROOP_TYPES[type];
    const rc=td?.recruit||{};
    const _cm = td?.costMult || 1.0;
    const out={};
    for(const [res,base] of Object.entries(rc)){
      const mult = res === 'horses' ? 1.0 : _cm; // ★ v116: 马不涨
      out[res]=Math.floor(base * mult * troops/5000);
    }
    return out;
  }
  function mergeMatCosts(...costs){
    const out={};
    for(const c of costs) for(const [k,v] of Object.entries(c)) out[k]=(out[k]||0)+v;
    return out;
  }
  const matCost=mergeMatCosts(
    calcSlotMatCost(_rm.mainType, Math.max(0, _rm.mainTroops - _rmBilletMain)),
    _rm.sub1Active?calcSlotMatCost(_rm.sub1Type, Math.max(0, _rm.sub1Troops - _rmBilletSub1)):{},
    _rm.sub2Active?calcSlotMatCost(_rm.sub2Type, Math.max(0, _rm.sub2Troops - _rmBilletSub2)):{}
  );
  const resLabel={iron:'⚙铁',wood:'🪵木',horses:'🐴马'};
  const matOk=Object.entries(matCost).every(([r,v])=>(fac.res[r]||0)>=v);
  // 兵种混编乘数（实时预览）
  const _activeTypes=[_rm.mainType,_rm.sub1Active?_rm.sub1Type:null,_rm.sub2Active?_rm.sub2Type:null].filter(Boolean);
  const _comboInfo = _activeTypes.length>1 ? getMixedComboLabel(_activeTypes) : null;
  const canConfirm=_rm.mainGen&&_rm.mainType&&fac.res.gold>=costGold&&matOk;
  const aptColor=a=>a==='S'?'#8a7040':a==='A'?'#1a7a3a':a==='B'?'#1a5f8a':'#666';
  const editSlot=_rm.editSlot;

  const genCard=g=>{
    const inUse=deployed.has(g.name);
    const isSel=(editSlot==='main'&&_rm.mainGen===g.name)||(editSlot==='sub1'&&_rm.sub1Gen===g.name)||(editSlot==='sub2'&&_rm.sub2Gen===g.name);
    const usedByOther=(_rm.mainGen===g.name&&editSlot!=='main')||(_rm.sub1Gen===g.name&&editSlot!=='sub1')||(_rm.sub2Gen===g.name&&editSlot!=='sub2');
    const disabled=inUse||usedByOther;
    const selType=editSlot==='main'?_rm.mainType:editSlot==='sub1'?_rm.sub1Type:_rm.sub2Type;
    const apt=selType&&g.apt?g.apt[TROOP_TYPES[selType]?.baseType||selType]:null;
    return `<div class="rm-gen-card${isSel?' sel':''}${disabled?' disabled':''}" onclick="${disabled?'':  `rmPickGen('${editSlot}','${g.name}')`}">
      <div class="rm-gen-name">${g.name} ${genClassTagsHtml(g.name)}</div>
      <div class="rm-gen-attr">统<b>${g.com}</b> 武<b>${g.war}</b> 智<b>${g.int}</b></div>
      ${apt?`<div class="rm-apt" style="color:${aptColor(apt)}">适性 ${apt}</div>`:''}
      ${inUse?'<div class="rm-tag inuse">出征中</div>':usedByOther?'<div class="rm-tag inuse">已选</div>':''}
    </div>`;
  };
  const troopRow=slot=>{
    const selType=slot==='main'?_rm.mainType:slot==='sub1'?_rm.sub1Type:_rm.sub2Type;
    const selGen=slot==='main'?_rm.mainGen:slot==='sub1'?_rm.sub1Gen:_rm.sub2Gen;
    const gData=selGen?GEN_MAP[selGen]:null;
    // ★ v164: 部曲兵种锁定（★ v167fix: 含billet池）
    const _retLock = selGen && getRetainers(selGen) > 0 ? getRetainerType(selGen) : (selGen ? _getBilletRetainerType(selGen) : null);
    return Object.entries(TROOP_TYPES).filter(([tid,td])=>{
      // ★ v116: 特色兵种只在绑定城市显示
      if(td.elite && td.homeCity !== _rm.cityId) return false;
      return true;
    }).map(([tid,td])=>{
      // ★ v116: 特色兵种适性读baseType
      const _aptKey = td.baseType || tid;
      const apt=gData?.apt?.[_aptKey]||null;
      const rc=td.recruit||{};
      const _cm = td.costMult || 1.0;
      const rcHint=Object.entries(rc).map(([r,b])=>{
        const lbl={iron:'铁',wood:'木',horses:'马'}[r]||r;
        const effectiveB = r === 'horses' ? b : Math.floor(b * _cm);
        return `${lbl}×${effectiveB}`;
      }).join(' ');
      // ★ v116: 上限检查
      let _limitHint = '';
      let _disabled = false;
      if(td.elite && td.maxSquads){
        const cur = G.units.filter(u=>u.fac===G.playerFac).flatMap(u=>u.squads).filter(sq=>sq.type===tid).length;
        _limitHint = `<div style="font-size:7px;color:${cur>=td.maxSquads?'#c03030':'rgba(92,74,50,.5)'}">⚔${cur}/${td.maxSquads}</div>`;
        if(cur >= td.maxSquads) _disabled = true;
      }
      // ★ v164: 部曲锁定——非锁定兵种灰掉
      const _retLocked = _retLock && tid !== _retLock;
      if(_retLocked) _disabled = true;
      const _lockTag = (_retLock && tid === _retLock) ? `<div style="font-size:7px;color:#8a7040">🔒部曲</div>` : '';
      const _eliteTag = td.elite ? `<div style="font-size:7px;color:#8a7040;font-weight:bold">★王牌 Lv${td.eliteLevel}</div>` : '';
      const _goldHint = _cm > 1 ? `<div style="font-size:7px;color:#8a6a10">金×${_cm}</div>` : '';
      return `<div class="rm-troop-card${selType===tid?' sel':''}${_disabled?' disabled':''}" ${_disabled?'':'onclick="rmPickType(\''+slot+'\',\''+tid+'\')"'} style="${_disabled?'opacity:0.4;pointer-events:none':''}">
        <div style="font-size:18px">${td.icon}</div>
        <div class="rm-troop-name">${td.name}</div>
        <div class="rm-troop-mv">AP ${td.ap}/旬</div>
        ${apt?`<div class="rm-troop-apt" style="color:${aptColor(apt)}">适性${apt}</div>`:''}
        ${_eliteTag}${_goldHint}${_limitHint}${_lockTag}
        ${rcHint?`<div style="font-size:8px;color:rgba(92,74,50,.45);margin-top:2px">+${rcHint}/5k</div>`:''}
      </div>`;
    }).join('');
  };
  const troopInput=(slot,val)=>{
    const isMain=slot==='main';
    const step=500;
    // ★ v167fix: 有billet部曲的武将显示最低兵力提示
    const _tiGen = slot==='main'?_rm.mainGen:slot==='sub1'?_rm.sub1Gen:_rm.sub2Gen;
    const _tiBilletMin = _tiGen ? _getBilletRetainerTroops(_tiGen) : 0;
    const minT=Math.max(isMain?500:500, _tiBilletMin);
    const maxT=isMain?10000:5000;
    const _billetHint = _tiBilletMin > 0 ? `<span style="font-size:8px;color:#1a5f8a;margin-left:6px">部曲${_tiBilletMin}人（最低）</span>` : '';
    return `<div class="rm-troop-input-row">
      <span class="rm-troop-label">兵力${_billetHint}</span>
      <button class="rm-num-btn" onclick="rmAdjTroops('${slot}',-${step})">−</button>
      <input class="rm-num-input" type="number" value="${val}" min="${minT}" max="${maxT}" step="${step}"
        oninput="rmSetTroops('${slot}',this.value)">
      <button class="rm-num-btn" onclick="rmAdjTroops('${slot}',${step})">＋</button>
    </div>`;
  };
  const slotDisplay=(label,genN,typeK,troops,active,slot,canToggle=false)=>{
    const td=TROOP_TYPES[typeK];
    const isEditing=editSlot===slot;
    // ★ v167: 武将四类标签选择器
    const _slotClass = slot==='main'?_rm.mainClass:slot==='sub1'?_rm.sub1Class:_rm.sub2Class;
    const _classHtml = genN ? genClassSelectorHtml(genN, _slotClass, slot) : '';
    return `<div class="rm-slot${isEditing?' editing':''}${!active&&slot!=='main'?' inactive':''}" onclick="rmEditSlot('${slot}')">
      <div class="rm-slot-header">
        <span class="rm-slot-label">${label}</span>
        ${canToggle?`<label class="rm-toggle" onclick="event.stopPropagation()">
          <input type="checkbox" ${active?'checked':''} onchange="rmToggleSub('${slot}',this.checked)"> 启用
        </label>`:''}
        <span class="rm-slot-edit${isEditing?' active':''}">${isEditing?'▼':'▶'}</span>
      </div>
      ${active||slot==='main'?`<div class="rm-slot-body">
        <div class="rm-slot-gen">${genN?`<span class="rm-gen-badge">${genN}</span> ${_classHtml}`:'<span class="rm-empty">未选</span>'}</div>
        <div class="rm-slot-troop">${td?`${td.icon} ${td.name}`:'<span class="rm-empty">未选兵种</span>'}${genN&&typeK?` · ${fmt(troops)}兵`:''}</div>
      </div>`:'<div class="rm-slot-inactive-hint">点击启用</div>'}
    </div>`;
  };
  // ★ v167: 编组效果预览
  const _classBufHtml = genClassBuffsHtml(_rm.mainGen, _rm.mainClass, _rm.sub1Gen, _rm.sub1Class, _rm.sub1Active, _rm.sub2Gen, _rm.sub2Class, _rm.sub2Active);
  const slotActive=editSlot==='main'||(_rm.sub1Active&&editSlot==='sub1')||(_rm.sub2Active&&editSlot==='sub2');
  const editArea=slotActive?`<div class="rm-edit-section">
    <div class="rm-sec">选择将领</div>
    <div class="rm-gen-grid">${allGens.map(genCard).join('')}</div>
    <div class="rm-sec">选择兵种</div>
    <div class="rm-troop-grid">${troopRow(editSlot)}</div>
    ${((editSlot==='main'&&_rm.mainGen&&_rm.mainType)||(editSlot==='sub1'&&_rm.sub1Gen&&_rm.sub1Type)||(editSlot==='sub2'&&_rm.sub2Gen&&_rm.sub2Type))?
      troopInput(editSlot,editSlot==='main'?_rm.mainTroops:editSlot==='sub1'?_rm.sub1Troops:_rm.sub2Troops):''}
  </div>`:'';
  const goldOk=fac.res.gold>=costGold;
  // ★ v136: 征兵惩罚预估（质量×100，民心×120）
  const _rcPenQual = totalTroops > 0 ? (totalTroops / city.pop) * 100 : 0;
  const _rcPenMor  = totalTroops > 0 ? (totalTroops / city.pop) * 120 : 0;
  const _penCol = _rcPenMor < 2 ? '#4caf50' : _rcPenMor < 5 ? '#8a6a10' : '#c03030';
  const totalOk=totalTroops<=15000;
  const matRows=Object.entries(matCost).map(([r,v])=>{
    const ok=(fac.res[r]||0)>=v;
    return `${resLabel[r]} <span class="${ok?'rm-cost-ok':'rm-cost-bad'}">${v}</span>/<span style="color:rgba(44,36,22,.45)">${fac.res[r]||0}</span>`;
  }).join(' &nbsp;|&nbsp; ');
  document.getElementById('rmContent').innerHTML=`
    <div class="rm-title">⚔ 征兵编组 · ${city.name}</div>
    <div class="rm-slots">
      ${slotDisplay('主将 ★',_rm.mainGen,_rm.mainType,_rm.mainTroops,true,'main')}
      ${slotDisplay('副将一',_rm.sub1Gen,_rm.sub1Type,_rm.sub1Troops,_rm.sub1Active,'sub1',true)}
      ${slotDisplay('副将二',_rm.sub2Gen,_rm.sub2Type,_rm.sub2Troops,_rm.sub2Active,'sub2',true)}
    </div>
    ${_classBufHtml}
    ${editArea}
    <div class="rm-cost-bar">
      <div class="rm-cost-row">
        <span>总兵力 <b style="${totalOk?'':'color:#c03030'}">${fmt(totalTroops)}/15000</b></span>
        <span>💰 <span class="${goldOk?'rm-cost-ok':'rm-cost-bad'}">${fmt(costGold)}</span>/<span style="color:rgba(44,36,22,.45)">${fmt(fac.res.gold)}</span>${_gentryPctStr}${_barrPctStr}${_yibingStr}${_techRCStr}${_eliteGoldStr}${_billetSavedStr}</span>
      </div>
      ${matRows?`<div class="rm-cost-row">${matRows}</div>`:''}
      ${totalTroops>0?`<div class="rm-cost-row" style="justify-content:center">
        <span style="color:${_penCol};font-size:10px">📉 民力影响：质量${_rcPenQual>=0.01?'-':''}${_rcPenQual.toFixed(1)} · 民心${_rcPenMor>=0.01?'-':''}${_rcPenMor.toFixed(1)}${_rcPenMor>=5?' ⚠过重':''}${_rcPenMor<2?' ✓轻微':''}</span>
      </div>`:''}
      ${totalTroops>0?`<div class="rm-cost-row" style="justify-content:center">
        <span style="color:rgba(100,180,255,.7);font-size:10px">🏰 集结速率 ${fmt(getMusterRate(_rm.cityId))}/旬/队 · 整备${(()=>{
          let _prevBilletDelay = 0;
          const _prevCityDef = CITY_MAP[_rm.cityId];
          if(_prevCityDef){
            [_rm.mainGen,_rm.sub1Active?_rm.sub1Gen:null,_rm.sub2Active?_rm.sub2Gen:null].filter(Boolean).forEach(gn=>{
              Object.entries(G.cities).forEach(([cid,c])=>{
                if(cid===_rm.cityId||!c.billetPool) return;
                if(c.billetPool.some(bp=>bp.genName===gn)){
                  const cd=CITY_MAP[cid];
                  if(cd) _prevBilletDelay=Math.max(_prevBilletDelay, hexDist(_prevCityDef.q,_prevCityDef.r,cd.q,cd.r));
                }
              });
            });
          }
          const _mobT = 1 + (_prevBilletDelay>5 ? Math.ceil((_prevBilletDelay-5)/5) : 0);
          return _mobT + '旬' + (_prevBilletDelay>5 ? ' <span style="color:#1a5f8a">(含跨城召集+' + (_mobT-1) + '旬)</span>' : '');
        })()}+集结约${Math.ceil(Math.max(_rm.mainTroops,_rm.sub1Active?_rm.sub1Troops:0,_rm.sub2Active?_rm.sub2Troops:0)/getMusterRate(_rm.cityId))}旬</span>
      </div>`:''}
    </div>
    ${_comboInfo?`<div style="color:${_comboInfo.color};font-size:10px;text-align:center;padding:4px 0;letter-spacing:1px">⚔ 混编效果：${_comboInfo.label}</div>`:''}
    <div class="rm-btn-row">
      <button class="rm-btn cancel" onclick="closeRecruitModal()">取消</button>
      <button class="rm-btn confirm${canConfirm?'':' disabled'}"
        onclick="${canConfirm?'confirmRecruit()':'showNotif(\'请选主将、兵种并确认资源\',\'warn\')'}">⚔ 出兵</button>
    </div>`;
}
function rmEditSlot(slot){if(slot==='sub1'&&!_rm.sub1Active)return;if(slot==='sub2'&&!_rm.sub2Active)return;_rm.editSlot=slot;renderRecruitModal();}
function rmToggleSub(slot,checked){
  if(slot==='sub1'){_rm.sub1Active=checked;if(!checked){_rm.sub1Gen=null;_rm.sub1Type=null;_rm.sub1Troops=0;_rm.sub1Class=null;}else _rm.sub1Troops=500;}
  if(slot==='sub2'){_rm.sub2Active=checked;if(!checked){_rm.sub2Gen=null;_rm.sub2Type=null;_rm.sub2Troops=0;_rm.sub2Class=null;}else _rm.sub2Troops=500;}
  _rm._warnedFood=false;
  if(checked)_rm.editSlot=slot;renderRecruitModal();
}
function rmPickGen(slot,name){
  if(slot==='main') _rm.mainGen=name; else if(slot==='sub1') _rm.sub1Gen=name; else _rm.sub2Gen=name;
  // ★ v167: 自动设置默认标签（多标签默认选第一个）
  const _cls = (GEN_CLASS[name]||['warrior'])[0];
  if(slot==='main') _rm.mainClass=_cls; else if(slot==='sub1') _rm.sub1Class=_cls; else _rm.sub2Class=_cls;
  // ★ v164: 有部曲的武将→兵种锁定为部曲兵种
  const _rType = getRetainerType(name);
  if(_rType && getRetainers(name) > 0){
    if(slot==='main') _rm.mainType=_rType;
    else if(slot==='sub1') _rm.sub1Type=_rType;
    else _rm.sub2Type=_rType;
  } else {
    // ★ v167fix: 部曲在billet池中（户口本已清零）时，也要锁兵种
    const _bType = _getBilletRetainerType(name);
    if(_bType){
      if(slot==='main') _rm.mainType=_bType;
      else if(slot==='sub1') _rm.sub1Type=_bType;
      else _rm.sub2Type=_bType;
    }
  }
  // ★ v167fix: 选中有billet部曲的武将时，自动把兵力拉到部曲最低值
  const _billetMin = _getBilletRetainerTroops(name);
  if(_billetMin > 0){
    const curT = slot==='main'?_rm.mainTroops:slot==='sub1'?_rm.sub1Troops:_rm.sub2Troops;
    if(curT < _billetMin){
      if(slot==='main') _rm.mainTroops=_billetMin;
      else if(slot==='sub1') _rm.sub1Troops=_billetMin;
      else _rm.sub2Troops=_billetMin;
    }
  }
  renderRecruitModal();
}
function rmPickType(slot,tid){
  // ★ v164: 有部曲的武将兵种锁定，不可切换
  const _slotGen = slot==='main'?_rm.mainGen:slot==='sub1'?_rm.sub1Gen:_rm.sub2Gen;
  if(_slotGen && getRetainers(_slotGen)>0 && getRetainerType(_slotGen)){
    showNotif(`${_slotGen}有部曲，兵种锁定为${TROOP_TYPES[getRetainerType(_slotGen)]?.name||getRetainerType(_slotGen)}`,'warn');
    return;
  }
  // ★ v167fix: 部曲在billet池中时也锁兵种
  if(_slotGen){
    const _bType = _getBilletRetainerType(_slotGen);
    if(_bType && tid !== _bType){
      showNotif(`${_slotGen}有休整部曲，兵种锁定为${TROOP_TYPES[_bType]?.name||_bType}`,'warn');
      return;
    }
  }
  if(slot==='main')_rm.mainType=tid;else if(slot==='sub1')_rm.sub1Type=tid;else _rm.sub2Type=tid;
  renderRecruitModal();
}
// ★ v167: 武将四类标签切换
function _rmSetClass(slot, cls){
  if(slot==='main') _rm.mainClass=cls; else if(slot==='sub1') _rm.sub1Class=cls; else _rm.sub2Class=cls;
  renderRecruitModal();
}
// ★ v167fix: 获取某武将在所有城市billet池中的部曲总兵力
function _getBilletRetainerTroops(genName){
  let total = 0;
  Object.values(G.cities).forEach(c => {
    (c.billetPool||[]).forEach(bp => { if(bp.genName === genName) total += (bp.troops||0); });
  });
  return total;
}
/** ★ v167fix: 获取某武将billet池中的部曲兵种（户口本清零后仓库仍有记录） */
function _getBilletRetainerType(genName){
  for(const c of Object.values(G.cities)){
    const bp = (c.billetPool||[]).find(b => b.genName === genName && b.troops > 0);
    if(bp) return bp.type;
  }
  return null;
}
function rmSetTroops(slot,v){
  const isMain=slot==='main';
  // ★ v167fix: 有billet部曲的武将，最低征兵数=部曲人数（确保部曲全部带出）
  const _slotGen = slot==='main'?_rm.mainGen:slot==='sub1'?_rm.sub1Gen:_rm.sub2Gen;
  const _billetRetMin = _slotGen ? _getBilletRetainerTroops(_slotGen) : 0;
  const minT=Math.max(500, _billetRetMin), maxT=getSquadMax(G.playerFac);
  const n=Math.max(minT,Math.min(maxT,parseInt(v)||minT));
  if(slot==='main')_rm.mainTroops=n;else if(slot==='sub1')_rm.sub1Troops=n;else _rm.sub2Troops=n;
  // 总兵力上限校验
  const total=_rm.mainTroops+(_rm.sub1Active?_rm.sub1Troops:0)+(_rm.sub2Active?_rm.sub2Troops:0);
  if(total>getUnitMax(G.playerFac)){
    const over=total-getUnitMax(G.playerFac);
    if(slot==='main')_rm.mainTroops=Math.max(500,_rm.mainTroops-over);
    else if(slot==='sub1')_rm.sub1Troops=Math.max(100,_rm.sub1Troops-over);
    else _rm.sub2Troops=Math.max(100,_rm.sub2Troops-over);
    showNotif(`一支部队总兵力上限${fmt(getUnitMax(G.playerFac))}`,'warn');
  }
  _rm._warnedFood=false; // 调整兵力后重置粮食警告
  renderRecruitModal();
}
function rmAdjTroops(slot,delta){const cur=slot==='main'?_rm.mainTroops:slot==='sub1'?_rm.sub1Troops:_rm.sub2Troops;rmSetTroops(slot,cur+delta);}

function confirmRecruit(){
  // ★ v114fix: 部队上限检查
  if(G.units.filter(u=>u.fac===G.playerFac).length >= MAX_FIELD_UNITS_ABS){
    showNotif(`部队数已达上限(${MAX_FIELD_UNITS_ABS})，无法再征`,'warn');return;
  }
  const city=G.cities[_rm.cityId],fac=G.factions[G.playerFac];
  const totalTroops=_rm.mainTroops+(_rm.sub1Active?_rm.sub1Troops:0)+(_rm.sub2Active?_rm.sub2Troops:0);
  if(!_rm.mainGen||!_rm.mainType){showNotif('请选主将和兵种','warn');return;}

  // ★ v116: 特色兵种上限检查
  const _allTypes = [_rm.mainType, _rm.sub1Active?_rm.sub1Type:null, _rm.sub2Active?_rm.sub2Type:null].filter(Boolean);
  for(const t of _allTypes){
    const td = TROOP_TYPES[t];
    if(td?.elite && td.maxSquads){
      const cur = G.units.filter(u=>u.fac===G.playerFac).flatMap(u=>u.squads).filter(sq=>sq.type===t).length;
      const adding = _allTypes.filter(x=>x===t).length;
      if(cur + adding > td.maxSquads){showNotif(`${td.name}已达上限(${td.maxSquads}队)`,'warn');return;}
    }
  }

  // ★ D1: 征兵费buff（前将军/大将军）
  const _rcBuff = G.factions[G.playerFac]?._postBuffs?.recruitCost || 0;
  const _gentryRcMult = getGentryRecruitMult(_rm.cityId); // ★ I2: 豪族征兵修正
  // ★ v116: 特色兵种gold costMult
  const _eliteCM = Math.max(..._allTypes.map(t => TROOP_TYPES[t]?.costMult || 1.0));
  // ★ v167fix: billet部曲免费，只对新征兵收费
  const _cfBilletMain = _rm.mainGen ? Math.min(_rm.mainTroops, _getBilletRetainerTroops(_rm.mainGen)) : 0;
  const _cfBilletSub1 = (_rm.sub1Active && _rm.sub1Gen) ? Math.min(_rm.sub1Troops, _getBilletRetainerTroops(_rm.sub1Gen)) : 0;
  const _cfBilletSub2 = (_rm.sub2Active && _rm.sub2Gen) ? Math.min(_rm.sub2Troops, _getBilletRetainerTroops(_rm.sub2Gen)) : 0;
  const _cfNewTroops = Math.max(0, totalTroops - _cfBilletMain - _cfBilletSub1 - _cfBilletSub2);
  const costGold=Math.floor(1200*_cfNewTroops/5000 * (1 + _rcBuff) * _gentryRcMult * getBarracksDiscount(city) * (city._yibingBuff && city._yibingBuff.expiresAt > G.turn ? 0.70 : 1.0) * (1 + getTechEffect(G.playerFac, 'recruitCostMult')) * _eliteCM);
  // 计算各分队材料费用（只算新征部分）
  const matCost=mergeMatCosts(
    calcSlotMatCost(_rm.mainType, Math.max(0, _rm.mainTroops - _cfBilletMain)),
    _rm.sub1Active?calcSlotMatCost(_rm.sub1Type, Math.max(0, _rm.sub1Troops - _cfBilletSub1)):{},
    _rm.sub2Active?calcSlotMatCost(_rm.sub2Type, Math.max(0, _rm.sub2Troops - _cfBilletSub2)):{}
  );
  if(fac.res.gold<costGold){showNotif(`金钱不足（需${fmt(costGold)}）`,'warn');return;}
  for(const[r,v] of Object.entries(matCost)){
    const resName={iron:'铁矿',wood:'木材',horses:'马匹'}[r]||r;
    if((fac.res[r]||0)<v){showNotif(`${resName}不足（需${v}）`,'warn');return;}
  }
  safeSub(fac.res, 'gold', costGold);
  deductMat(G.playerFac, matCost);
  city.recruitedThisTurn=true; // 冷却标记，下旬 nextTurn 清除
  // ★ v136: 征兵惩罚大幅加重——质量×100，民心×120（★ v167fix: 只算新征兵，billet不扣人口）
  const _rcRatio = _cfNewTroops / city.pop;
  city.popQuality = Math.max(20, (city.popQuality||80) - _rcRatio * 100);
  city.morale     = Math.max(0,  (city.morale||50)     - _rcRatio * 120);
  // ★ v108: 记录本旬征兵惩罚值，供弹窗显示（v136: 取较大值显示）
  city._lastRecruitPenalty = _rcRatio * 120;
  city._lastRecruitTurn = G.turn;
  // ★ v114: 集结系统——当旬立即集结第一批兵 + mobilizingTurns=1不能动
  const mRate = getMusterRate(_rm.cityId);
  const squads=[{genName:_rm.mainGen,type:_rm.mainType,troops:Math.min(mRate,_rm.mainTroops),maxTroops:_rm.mainTroops,morale:80,
    _musterTarget:_rm.mainTroops,_mustered:Math.min(mRate,_rm.mainTroops),
    _classChoice:(GEN_CLASS[_rm.mainGen]||[]).length>1?_rm.mainClass:undefined}]; // ★ v167: 标签选择
  if(_rm.sub1Active&&_rm.sub1Gen&&_rm.sub1Type){
    const t1=Math.min(mRate,_rm.sub1Troops);
    squads.push({genName:_rm.sub1Gen,type:_rm.sub1Type,troops:t1,maxTroops:_rm.sub1Troops,morale:80,_musterTarget:_rm.sub1Troops,_mustered:t1,
      _classChoice:(GEN_CLASS[_rm.sub1Gen]||[]).length>1?_rm.sub1Class:undefined});
  }
  if(_rm.sub2Active&&_rm.sub2Gen&&_rm.sub2Type){
    const t2=Math.min(mRate,_rm.sub2Troops);
    squads.push({genName:_rm.sub2Gen,type:_rm.sub2Type,troops:t2,maxTroops:_rm.sub2Troops,morale:80,_musterTarget:_rm.sub2Troops,_mustered:t2,
      _classChoice:(GEN_CLASS[_rm.sub2Gen]||[]).length>1?_rm.sub2Class:undefined});
  }
  // 已满编的squad清理集结标记
  squads.forEach(sq=>{ if(sq._mustered>=sq._musterTarget){ sq._musterTarget=null; sq._mustered=null; } });
  const unit=createUnit({fac:G.playerFac,spawnCityId:_rm.cityId,squads});
  if(unit){
    // ★ v116: 特色兵种出厂10级
    const _maxEliteLv = Math.max(..._allTypes.map(t => TROOP_TYPES[t]?.eliteLevel || 0));
    unit.level = _maxEliteLv > 0 ? Math.max(_maxEliteLv, getInitLevel(city)) : getInitLevel(city);
    unit.exp = 0;
    unit.mobilizingTurns = 1; // 当旬有兵但不能动，下旬可动
    // ★ v167fix: 跨城取billet部曲加额外集结时间（对应billet入库时的行军延迟）
    let _maxBilletDist = 0;
    const _rmCityDef = CITY_MAP[_rm.cityId];
    if(_rmCityDef){
      const _recruitedGens2 = new Set(squads.map(sq=>sq.genName));
      Object.entries(G.cities).forEach(([cid, c]) => {
        if(cid === _rm.cityId || !c.billetPool) return;
        const hasBillet = c.billetPool.some(bp => bp.genName && _recruitedGens2.has(bp.genName));
        if(hasBillet){
          const cDef = CITY_MAP[cid];
          if(cDef) _maxBilletDist = Math.max(_maxBilletDist, hexDist(_rmCityDef.q, _rmCityDef.r, cDef.q, cDef.r));
        }
      });
    }
    if(_maxBilletDist > 5) unit.mobilizingTurns += Math.ceil((_maxBilletDist - 5) / 5);
    unit._apRemaining = 0;
    G.units.push(unit);
    // ★ v167fix: 征兵时清除billet部曲条目，并将部曲数据写回户口本
    const _recruitedGens = new Set(squads.map(sq=>sq.genName));
    Object.values(G.cities).forEach(c => {
      if(!c.billetPool) return;
      c.billetPool = c.billetPool.filter(bp => {
        if(bp.genName && _recruitedGens.has(bp.genName)){
          // 部曲条目被取出→写回户口本
          setRetainers(bp.genName, bp.troops, bp.type);
          return false; // 从池中移除
        }
        return true;
      });
    });
    const maxSqTroops = Math.max(_rm.mainTroops, _rm.sub1Active?_rm.sub1Troops:0, _rm.sub2Active?_rm.sub2Troops:0);
    const estTurns = maxSqTroops <= mRate ? 0 : Math.ceil((maxSqTroops - mRate) / mRate);
    const firstBatch = squads.reduce((s,sq)=>s+sq.troops,0);
    G.selUnitId=null;G.selCity=null;G.activeTab='mil';updateTabs();
    log(`⚔ ${_rm.mainGen}部 于${city.name}编组，首批${fmt(firstBatch)}/${fmt(totalTroops)}兵（Lv.${unit.level}）${unit.mobilizingTurns>1?'，整备'+unit.mobilizingTurns+'旬（含跨城召集）':estTurns>0?'，集结约'+estTurns+'旬':''}`,'economy');
    updateFacStats();
    closeRecruitModal();renderAllLight();
  }
}

// ════════════════════════════════════════════════════════════════════
// ── R4.7.b 整备 redeploy cluster (v181 L8783-L9058) ──
// ════════════════════════════════════════════════════════════════════

// ★ v164: Redeploy重构——先选将，部曲自动绑定，可选同兵种辅兵合并
let _rdp = { cityId:null, slots:[
  {gen:null, retPoolIdx:-1, auxPoolIdx:-1}, // main (required)
  {gen:null, retPoolIdx:-1, auxPoolIdx:-1, active:false}, // sub1
  {gen:null, retPoolIdx:-1, auxPoolIdx:-1, active:false}, // sub2
], editSlot:0 };

function openRedeployModal(cityId, firstPoolIdx){
  const city=G.cities[cityId];
  if(!city||city.fac!==G.playerFac) return;
  const pool=city.billetPool||[];
  const entry=pool[firstPoolIdx];
  if(!entry){ showNotif('兵员不存在','warn'); return; }
  if(entry.readyTurn && entry.readyTurn > G.turn){
    showNotif(`兵员行军中，还需${entry.readyTurn - G.turn}旬抵达`,'warn'); return;
  }
  // 根据点击的条目类型预填
  const s0 = {gen:null, retPoolIdx:-1, auxPoolIdx:-1};
  if(entry.genName){
    s0.gen = entry.genName; s0.retPoolIdx = firstPoolIdx;
  } else {
    s0.auxPoolIdx = firstPoolIdx;
  }
  _rdp={cityId, slots:[
    s0,
    {gen:null, retPoolIdx:-1, auxPoolIdx:-1, active:false},
    {gen:null, retPoolIdx:-1, auxPoolIdx:-1, active:false},
  ], editSlot:0};
  document.getElementById('genericModal').style.display='flex';
  document.getElementById('genericModalTitle').textContent='重新编组 — 配置将领';
  _renderRedeployModal();
}

function _rdpGetReadyPool(){
  const city=G.cities[_rdp.cityId];
  const pool=city?.billetPool||[];
  return pool.map((e,i)=>({e,i})).filter(({e})=>!e.readyTurn || e.readyTurn <= G.turn);
}

/** 获取slot的总兵力和合并信息 */
function _rdpSlotInfo(slot, pool){
  let troops=0, maxTroops=0, type=null, level=0, levelW=0;
  const indices=[];
  if(slot.retPoolIdx>=0 && pool[slot.retPoolIdx]){
    const e=pool[slot.retPoolIdx];
    troops+=e.troops; maxTroops+=e.maxTroops; levelW+=e.level*e.troops;
    type=e.type; indices.push(slot.retPoolIdx);
  }
  if(slot.auxPoolIdx>=0 && pool[slot.auxPoolIdx]){
    const e=pool[slot.auxPoolIdx];
    troops+=e.troops; maxTroops+=e.maxTroops; levelW+=e.level*e.troops;
    if(!type) type=e.type;
    indices.push(slot.auxPoolIdx);
  }
  level = troops>0 ? Math.round(levelW/troops) : 1;
  return {troops, maxTroops, type, level, indices};
}

function _renderRedeployModal(){
  const city=G.cities[_rdp.cityId];
  if(!city) return;
  const pool=city.billetPool||[];
  const deployed=getDeployedGens(G.playerFac);
  const allGens=(G.generals[G.playerFac]||[]).filter(g=>!deployed.has(g.name));
  const readyPool=_rdpGetReadyPool();

  // collect used pool indices and gen names across all active slots
  const usedPoolIdx=new Set();
  const usedGens=new Set();
  _rdp.slots.forEach((s,i)=>{
    if(i>0&&!s.active) return;
    if(s.retPoolIdx>=0) usedPoolIdx.add(s.retPoolIdx);
    if(s.auxPoolIdx>=0) usedPoolIdx.add(s.auxPoolIdx);
    if(s.gen) usedGens.add(s.gen);
  });
  const es=_rdp.editSlot;
  const slot=_rdp.slots[es];

  // total troops across all slots
  const totalTroops=_rdp.slots.filter((s,i)=>i===0||s.active).reduce((sum,s)=>{
    return sum+_rdpSlotInfo(s,pool).troops;
  },0);

  // slot summary cards
  const slotCard=(idx)=>{
    const s=_rdp.slots[idx];
    const isMain=idx===0;
    const active=isMain||s.active;
    const info=_rdpSlotInfo(s,pool);
    const isEdit=es===idx;
    const tIcon=info.type?TROOP_TYPES[info.type]?.icon||'':'';
    const label=isMain?'主将 ★':idx===1?'副将一':'副将二';
    const retE=s.retPoolIdx>=0?pool[s.retPoolIdx]:null;
    const auxE=s.auxPoolIdx>=0?pool[s.auxPoolIdx]:null;
    const detailParts=[];
    if(retE) detailParts.push(`<span style="color:#8a7040">部曲${fmt(retE.troops)}</span>`);
    if(auxE) detailParts.push(`辅兵${fmt(auxE.troops)}`);
    return `<div style="padding:6px 8px;border:1px solid ${isEdit?'rgba(92,74,50,.5)':'rgba(80,65,40,.08)'};background:${isEdit?'rgba(80,65,40,.05)':'none'};cursor:pointer;margin-bottom:3px;opacity:${active?1:.4}" onclick="${!isMain&&!active?`_rdpToggleSub(${idx},true)`:`_rdpEditSlot(${idx})`}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:10px;color:rgba(92,74,50,.55)">${label}</span>
        ${!isMain?`<label style="font-size:9px;color:rgba(92,74,50,.40)" onclick="event.stopPropagation()"><input type="checkbox" ${active?'checked':''} onchange="_rdpToggleSub(${idx},this.checked)"> 启用</label>`:''}
      </div>
      ${active?`<div style="margin-top:3px;font-size:10px">
        <span style="color:rgba(92,74,50,.7)">${s.gen||'<span style=color:rgba(200,80,60,.6)>未选将领</span>'}</span>
        ${info.troops>0?` · ${tIcon} ${fmt(info.troops)}兵 Lv${info.level} <span style="font-size:8px;color:rgba(92,74,50,.4)">(${detailParts.join('+')})</span>`
          :'<span style="color:rgba(200,80,60,.6)"> · 未选兵员</span>'}
      </div>`:`<div style="font-size:9px;color:rgba(80,65,40,.15);margin-top:2px">点击启用副将</div>`}
    </div>`;
  };

  // edit area for current slot
  let editArea='';
  if(_rdp.slots[es] && (es===0 || _rdp.slots[es].active)){
    // ── 武将选择（先选将）──
    const genCards=allGens.map(g=>{
      const isSel=slot.gen===g.name;
      const usedOther=usedGens.has(g.name)&&!isSel;
      const hasRet=getRetainers(g.name)>0;
      const retType=getRetainerType(g.name);
      const retTag=hasRet?` <span style="color:#8a7040;font-size:8px">部曲${getRetainersDisplay(g.name)}${retType?' '+(TROOP_TYPES[retType]?.icon||''):''}</span>`:'';
      return `<div onclick="${usedOther?'':`_rdpPickGen(${es},'${g.name}')`}" style="cursor:${usedOther?'not-allowed':'pointer'};padding:5px 8px;border:1px solid ${isSel?'rgba(92,74,50,.55)':'rgba(80,65,40,.07)'};background:${isSel?'rgba(80,65,40,.07)':'none'};margin:2px 0;opacity:${usedOther?.35:1};display:flex;justify-content:space-between;align-items:center">
        <div><span style="color:rgba(44,36,22,.8);font-size:10px">${g.name}</span>
          <span style="font-size:9px;color:rgba(92,74,50,.40);margin-left:4px">统${g.com} 武${g.war} 智${g.int}</span>${retTag}</div>
      </div>`;
    }).join('');

    // ── 辅兵选择（选了将领后才显示）──
    let auxSection='';
    if(slot.gen){
      const retE=slot.retPoolIdx>=0?pool[slot.retPoolIdx]:null;
      const lockedType=retE?.type || (getRetainers(slot.gen)>0 ? getRetainerType(slot.gen) : null);
      let retInfo='';
      if(retE){
        retInfo=`<div style="padding:4px 8px;margin:2px 0;border:1px solid rgba(138,112,64,.25);background:rgba(138,112,64,.06);font-size:10px;color:#8a7040">
          🔒 ${TROOP_TYPES[retE.type]?.icon||''} ${slot.gen}部曲 · ${fmt(retE.troops)}兵 · Lv${retE.level}（自动绑定）
        </div>`;
      }
      const auxCandidates=readyPool.filter(({e,i})=>{
        if(e.genName) return false;
        if(usedPoolIdx.has(i) && i!==slot.auxPoolIdx) return false;
        if(lockedType && e.type !== lockedType) return false;
        return true;
      });
      const auxCards=auxCandidates.map(({e,i})=>{
        const sel=slot.auxPoolIdx===i;
        const tI=TROOP_TYPES[e.type]?.icon||'';
        const tN=TROOP_TYPES[e.type]?.name||e.type;
        return `<div onclick="_rdpPickAux(${es},${i})" style="cursor:pointer;padding:5px 8px;border:1px solid ${sel?'rgba(92,74,50,.55)':'rgba(80,65,40,.07)'};background:${sel?'rgba(80,65,40,.07)':'none'};margin:2px 0;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:10px;color:rgba(92,74,50,.7)">${tI} ${tN} · ${fmt(e.troops)}兵 · Lv${e.level}</span>
          <span style="font-size:8px;color:rgba(92,74,50,.35)">满编${fmt(e.maxTroops)}</span>
        </div>`;
      }).join('');
      const auxLabel=lockedType?`补充辅兵（${TROOP_TYPES[lockedType]?.name||lockedType}·可选）`:'选择兵员';
      auxSection=`${retInfo}
        <div style="font-size:10px;color:rgba(92,74,50,.55);margin:6px 0 4px">${auxLabel}</div>
        <div style="max-height:100px;overflow-y:auto">${auxCards||`<div style="font-size:9px;color:rgba(92,74,50,.35);padding:4px">${lockedType?'无同兵种辅兵可用':'无可用兵员'}</div>`}</div>`;
    }

    editArea=`<div style="margin-top:8px;border-top:1px solid rgba(80,65,40,.08);padding-top:8px">
      <div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:4px">选择将领</div>
      <div style="max-height:120px;overflow-y:auto">${genCards||'<div style="font-size:9px;color:rgba(92,74,50,.35);padding:4px">无闲置武将</div>'}</div>
      ${auxSection}
    </div>`;
  }

  const mainInfo=_rdpSlotInfo(_rdp.slots[0],pool);
  const mainOk=_rdp.slots[0].gen && mainInfo.troops>0;
  const canConfirm=mainOk;

  document.getElementById('genericModalBody').innerHTML=`
    <div style="padding:12px 14px">
      <div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:8px">
        ${city.name} · 先选将领，部曲自动绑定 · 总兵力${fmt(totalTroops)}
      </div>
      ${slotCard(0)}${slotCard(1)}${slotCard(2)}
      ${editArea}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="rm-btn cancel" onclick="closeModal()" style="flex:1">取消</button>
        <button class="rm-btn confirm${canConfirm?'':' disabled'}" onclick="${canConfirm?`_confirmRedeploy()`:`showNotif('请为主将选将领','warn')`}" style="flex:1">
          ⚔ 编组出征（2旬整备）
        </button>
      </div>
    </div>`;
}

function _rdpEditSlot(idx){
  if(idx>0&&!_rdp.slots[idx].active) return;
  _rdp.editSlot=idx;
  _renderRedeployModal();
}
function _rdpToggleSub(idx,on){
  _rdp.slots[idx].active=on;
  if(!on){_rdp.slots[idx].gen=null;_rdp.slots[idx].retPoolIdx=-1;_rdp.slots[idx].auxPoolIdx=-1;}
  if(on) _rdp.editSlot=idx;
  _renderRedeployModal();
}
function _rdpPickAux(slotIdx,poolIdx){
  _rdp.slots[slotIdx].auxPoolIdx=(_rdp.slots[slotIdx].auxPoolIdx===poolIdx?-1:poolIdx);
  _renderRedeployModal();
}
function _rdpPickGen(slotIdx,name){
  const toggling = _rdp.slots[slotIdx].gen===name;
  _rdp.slots[slotIdx].gen = toggling ? null : name;
  _rdp.slots[slotIdx].retPoolIdx=-1;
  _rdp.slots[slotIdx].auxPoolIdx=-1;
  if(!toggling && name){
    const city=G.cities[_rdp.cityId];
    const pool=city?.billetPool||[];
    const usedIdx=new Set();
    _rdp.slots.forEach((s,i)=>{
      if(i===slotIdx) return;
      if(i>0&&!s.active) return;
      if(s.retPoolIdx>=0) usedIdx.add(s.retPoolIdx);
      if(s.auxPoolIdx>=0) usedIdx.add(s.auxPoolIdx);
    });
    const retIdx=pool.findIndex((e,i)=>e.genName===name && !usedIdx.has(i) && (!e.readyTurn||e.readyTurn<=G.turn));
    if(retIdx>=0) _rdp.slots[slotIdx].retPoolIdx=retIdx;
  }
  _renderRedeployModal();
}

function _confirmRedeploy(){
  const city=G.cities[_rdp.cityId];
  if(!city) return;
  const pool=city.billetPool||[];
  const mainInfo=_rdpSlotInfo(_rdp.slots[0],pool);
  if(!_rdp.slots[0].gen || mainInfo.troops<=0){ showNotif('请为主将选将领','warn'); return; }

  if(G.units.filter(u=>u.fac===G.playerFac).length >= MAX_FIELD_UNITS_ABS){
    showNotif(`部队数已达上限(${MAX_FIELD_UNITS_ABS})，无法重编`,'warn'); return;
  }

  const squads=[];
  const removeIndices=[];
  for(let i=0;i<3;i++){
    const s=_rdp.slots[i];
    if(i>0&&!s.active) continue;
    if(!s.gen) continue;
    const info=_rdpSlotInfo(s,pool);
    if(info.troops<=0) continue;
    if(s.retPoolIdx>=0 && pool[s.retPoolIdx]?.genName && pool[s.retPoolIdx].genName !== s.gen){
      showNotif(`${pool[s.retPoolIdx].genName}的部曲不可交给${s.gen}指挥`,'warn'); return;
    }
    squads.push({genName:s.gen, type:info.type, troops:info.troops, maxTroops:info.maxTroops, morale:75});
    info.indices.forEach(idx=>removeIndices.push(idx));
  }
  if(!squads.length) return;

  const totalT=squads.reduce((s,sq)=>s+sq.troops,0);
  let wLv=0,wT=0;
  removeIndices.forEach(pi=>{
    const e=pool[pi]; if(!e)return;
    wLv+=e.level*e.troops; wT+=e.troops;
  });
  const unitLevel=wT>0?Math.round(wLv/wT):1;

  const unit=createUnit({fac:G.playerFac, spawnCityId:_rdp.cityId, squads});
  if(!unit) return;
  unit.level=unitLevel; unit.exp=0;
  unit.mobilizingTurns=2; unit._apRemaining=0;
  G.units.push(unit);

  const uniqueRemove=[...new Set(removeIndices)].sort((a,b)=>b-a);
  // ★ v167fix: 部曲条目取出→写回户口本
  uniqueRemove.forEach(pi=>{
    const bp = pool[pi];
    if(bp && bp.genName && bp.troops > 0) setRetainers(bp.genName, bp.troops, bp.type);
  });
  uniqueRemove.forEach(pi=>pool.splice(pi,1));

  const genNames=squads.map(sq=>sq.genName).join('、');
  log(`⚔ ${genNames} 于${city.name}重编${fmt(totalT)}老兵（Lv${unitLevel}），2旬整备`,'economy');
  closeModal();
  G.selCity=_rdp.cityId; G.activeTab='city'; updateTabs();
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── R4.7.c 扩编 expand cluster (v181 L9067-L9276) ──
// ════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════
// ★ v113: 扩编系统（提高maxTroops + 即时征入新兵）
// ═══════════════════════════════════════════════════════
let _ex={unitId:null, squadIdx:0, amount:1000};

function openExpandModal(unitId, squadIdx){
  const unit=G.units.find(u=>u.id===unitId);
  if(!unit)return;
  const sq=unit.squads[squadIdx];
  if(!sq)return;
  // ★ v114: 集结中不能再扩编
  if(sq._musterTarget){showNotif('该队正在集结中，请等集结完成后再扩编','warn');return;}
  if(unit.status!=='garrison'){
    showNotif('扩编需驻扎于己方城市','warn');return;
  }
  const atCity=getUnitAtCity(unit);
  if(!atCity||atCity.fac!==G.playerFac){
    showNotif('扩编需驻扎于己方城市','warn');return;
  }
  const maxExpand=getSquadMax(G.playerFac)-(sq.maxTroops||sq.troops);
  if(maxExpand<=0){
    showNotif(`已达满编上限${fmt(getSquadMax(G.playerFac))}`,'warn');return;
  }
  // 部队总兵力上限检查
  const totalTroopsCurrent=unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0);
  const unitMaxExpand=getUnitMax(G.playerFac)-totalTroopsCurrent;
  if(unitMaxExpand<=0){
    showNotif(`部队总编制已达上限${fmt(getUnitMax(G.playerFac))}`,'warn');return;
  }
  const cap=Math.min(maxExpand, unitMaxExpand);
  _ex={unitId, squadIdx, amount:Math.min(1000, cap)};
  document.getElementById('exTitle').textContent=`扩编 · ${sq.genName}队`;
  document.getElementById('expandModal').style.display='flex';
  renderExpandModal();
}

function closeExpandModal(){
  document.getElementById('expandModal').style.display='none';
}

function renderExpandModal(){
  const unit=G.units.find(u=>u.id===_ex.unitId);
  if(!unit)return;
  const sq=unit.squads[_ex.squadIdx];
  const atCity=getUnitAtCity(unit);
  const fac=G.factions[G.playerFac];
  const currentMax=sq.maxTroops||sq.troops;
  const squadCap=getSquadMax(G.playerFac)-currentMax;
  const totalTroopsCurrent=unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0);
  const unitCap=getUnitMax(G.playerFac)-totalTroopsCurrent;
  const maxExpand=Math.min(squadCap, unitCap);
  const amt=Math.min(_ex.amount, maxExpand);

  // 费用：与征兵同价
  const _gentryMult=getGentryRecruitMult(atCity?.id);
  const _barrDisc=getBarracksDiscount(atCity);
  const _yibing=atCity?._yibingBuff&&atCity._yibingBuff.expiresAt>G.turn?0.70:1.0;
  const _techRC=1+getTechEffect(G.playerFac,'recruitCostMult'); // ★ v115
  const _exDispCM = TROOP_TYPES[sq.type]?.costMult || 1.0; // ★ v116
  const costGold=Math.floor(1200*amt/5000*_gentryMult*_barrDisc*_yibing*_techRC*_exDispCM);
  const goldOk=fac.res.gold>=costGold;

  // 等级预览
  // ★ v116: 特色兵种扩编eliteLevel
  const _exDispEliteLv = TROOP_TYPES[sq.type]?.eliteLevel || 0;
  const cityLevel = _exDispEliteLv > 0 ? Math.max(_exDispEliteLv, getInitLevel(atCity)) : getInitLevel(atCity);
  const currentLevel=unit.level||1;
  const newLevel=((sq.troops*currentLevel)+(amt*cityLevel))/(sq.troops+amt);

  const _exDispMatCost = calcSlotMatCost(sq.type, amt);
  const matOk = canAffordMat(G.playerFac, _exDispMatCost);

  const canConfirm=amt>0&&goldOk&&matOk;

  document.getElementById('exContent').innerHTML=`
    <div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:10px">
      ${TROOP_TYPES[sq.type]?.icon||''} ${sq.genName} ${genClassTagsHtml(sq.genName)}
      · ${TROOP_TYPES[sq.type]?.name||sq.type}
      · 现有${fmt(sq.troops)}/${fmt(currentMax)}兵 · 上限${fmt(getSquadMax(G.playerFac))}
    </div>
    <div class="rm-troop-input-row">
      <span class="rm-troop-label">扩编兵力</span>
      <button class="rm-num-btn" onclick="exAdj(-500)">−</button>
      <input class="rm-num-input" type="number" value="${amt}" min="500" max="${maxExpand}" step="500"
        oninput="exSet(this.value)">
      <button class="rm-num-btn" onclick="exAdj(500)">＋</button>
    </div>
    <div class="rm-cost-bar">
      <div class="rm-cost-row">
        💰 <span class="${goldOk?'rm-cost-ok':'rm-cost-bad'}">${fmt(costGold)}</span><span style="color:rgba(44,36,22,.30)">/${fmt(fac.res.gold)}</span>
        ${Object.entries(_exDispMatCost).map(([r,v])=>{
          const icons={iron:'⚙',wood:'🪵',horses:'🐴'};
          const names={iron:'铁',wood:'木',horses:'马'};
          const has=(fac.res[r]||0)>=v;
          return `<span style="margin-left:10px">${icons[r]||r} <span class="${has?'rm-cost-ok':'rm-cost-bad'}">${v}</span><span style="color:rgba(44,36,22,.30)">/${fmt(fac.res[r]||0)}</span></span>`;
        }).join('')}
      </div>
    </div>
    <div style="font-size:9px;color:rgba(92,74,50,.40);margin:8px 0;line-height:1.6">
      扩编后：${fmt(sq.troops+amt)}/${fmt(currentMax+amt)}兵<br>
      新兵等级Lv${cityLevel} → 部队等级Lv${currentLevel}→Lv${Math.round(newLevel)}<br>
      <span style="color:#8a6a10">整备1旬${amt<=getMusterRate(getUnitAtCity(unit)?.id)?'（当旬即满编）':'＋集结约'+Math.ceil((amt-getMusterRate(getUnitAtCity(unit)?.id))/getMusterRate(getUnitAtCity(unit)?.id))+'旬'}</span><br>
      <span style="color:rgba(100,180,255,.6)">🏰 集结速率 ${fmt(getMusterRate(getUnitAtCity(unit)?.id))}/旬</span>
    </div>
    <div class="rm-btn-row">
      <button class="rm-btn cancel" onclick="closeExpandModal()">取消</button>
      <button class="rm-btn confirm${canConfirm?'':' disabled'}"
        onclick="${canConfirm?'confirmExpand()':'showNotif(\'资源不足\',\'warn\')'}">
        ⬆ 扩编${fmt(amt)}人
      </button>
    </div>`;
}

function exAdj(delta){
  const unit=G.units.find(u=>u.id===_ex.unitId);
  const sq=unit?.squads[_ex.squadIdx];
  if(!sq)return;
  const currentMax=sq.maxTroops||sq.troops;
  const squadCap=getSquadMax(G.playerFac)-currentMax;
  const totalTroopsCurrent=unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0);
  const unitCap=getUnitMax(G.playerFac)-totalTroopsCurrent;
  const maxExpand=Math.min(squadCap, unitCap);
  _ex.amount=Math.max(500,Math.min(_ex.amount+delta,maxExpand));
  renderExpandModal();
}
function exSet(v){
  const unit=G.units.find(u=>u.id===_ex.unitId);
  const sq=unit?.squads[_ex.squadIdx];
  if(!sq)return;
  const currentMax=sq.maxTroops||sq.troops;
  const squadCap=getSquadMax(G.playerFac)-currentMax;
  const totalTroopsCurrent=unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0);
  const unitCap=getUnitMax(G.playerFac)-totalTroopsCurrent;
  const maxExpand=Math.min(squadCap, unitCap);
  _ex.amount=Math.max(500,Math.min(parseInt(v)||500,maxExpand));
  renderExpandModal();
}

function confirmExpand(){
  const unit=G.units.find(u=>u.id===_ex.unitId);
  if(!unit)return;
  const sq=unit.squads[_ex.squadIdx];
  if(!sq)return;
  const atCity=getUnitAtCity(unit);
  const fac=G.factions[G.playerFac];
  const currentMax=sq.maxTroops||sq.troops;
  const squadCap=getSquadMax(G.playerFac)-currentMax;
  const totalTroopsCurrent=unit.squads.reduce((s,q)=>s+(q.maxTroops||q.troops),0);
  const unitCap=getUnitMax(G.playerFac)-totalTroopsCurrent;
  const maxExpand=Math.min(squadCap, unitCap);
  const amt=Math.min(_ex.amount, maxExpand);
  if(amt<=0)return;

  // 费用
  const _gentryMult=getGentryRecruitMult(atCity?.id);
  const _barrDisc=getBarracksDiscount(atCity);
  const _yibing=atCity?._yibingBuff&&atCity._yibingBuff.expiresAt>G.turn?0.70:1.0;
  const _exEliteCM = TROOP_TYPES[sq.type]?.costMult || 1.0; // ★ v116
  const costGold=Math.floor(1200*amt/5000*_gentryMult*_barrDisc*_yibing*(1+getTechEffect(G.playerFac,'recruitCostMult'))*_exEliteCM); // ★ v115+v116
  if(fac.res.gold<costGold){showNotif('金钱不足','warn');return;}
  // ★ v118fix: 扩编也扣材料
  const _exMatCost = calcSlotMatCost(sq.type, amt);
  for(const[r,v] of Object.entries(_exMatCost)){
    const resName={iron:'铁矿',wood:'木材',horses:'马匹'}[r]||r;
    if((fac.res[r]||0)<v){showNotif(`${resName}不足（需${v}）`,'warn');return;}
  }

  // 扣资源
  safeSub(fac.res, 'gold', costGold);
  deductMat(G.playerFac, _exMatCost);

  // 征兵惩罚（与征兵一致）
  if(atCity){
    // ★ v164fix: 惩罚系数与征兵/AI扩编统一（旧：×30/×30，修正：×100/×120）
    const rcRatio=amt/atCity.pop;
    atCity.popQuality=Math.max(20,(atCity.popQuality||80)-rcRatio*100);
    atCity.morale=Math.max(0,(atCity.morale||50)-rcRatio*120);
  }

  // 等级加权平均（★ v121fix: 基于部队总兵力而非单分队）
  // ★ v116: 特色兵种扩编出厂eliteLevel
  const _exEliteLv = TROOP_TYPES[sq.type]?.eliteLevel || 0;
  const cityLevel = _exEliteLv > 0 ? Math.max(_exEliteLv, getInitLevel(atCity)) : getInitLevel(atCity);
  const oldLevel=unit.level||1;
  const oldTotal=getUnitTroops(unit);
  const newLevelRaw=(oldTotal*oldLevel+amt*cityLevel)/(oldTotal+amt);
  unit.level=Math.max(1,Math.min(UNIT_LEVEL_MAX,Math.round(newLevelRaw)));

  // ★ v114: 扩编走集结——maxTroops立即提升，当旬立即集结第一批
  const mRate = getMusterRate(atCity?.id);
  const firstBatch = Math.min(mRate, amt);
  sq.maxTroops=currentMax+amt;
  sq.troops += firstBatch; // 当旬立即加入第一批
  if(firstBatch < amt) {
    // 还有剩余需要集结
    sq._musterTarget = sq.troops + (amt - firstBatch);
    sq._mustered = sq.troops;
  }
  // else: 当旬就满了，不需要集结标记

  // 扩编恢复整备1旬：当旬有兵但不能动，下旬可动
  unit.mobilizingTurns=1;
  unit._apRemaining=0;

  const estTurns = amt <= mRate ? 0 : Math.ceil((amt - mRate) / mRate);
  log(`⬆ ${sq.genName}队 扩编${fmt(amt)}人（首批${fmt(firstBatch)}），编制${fmt(currentMax)}→${fmt(sq.maxTroops)}${estTurns>0?'，集结约'+estTurns+'旬':''}，等级Lv${oldLevel}→Lv${unit.level}`,'economy');
  closeExpandModal();
  renderAllLight();
}

// ════════════════════════════════════════════════════════════════════
// ── R4.7.d 增编分队 addSquad cluster (v181 L9278-L9548) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ★ v120: 增编分队系统（2分队部队→3分队）
// ═══════════════════════════════════════════════════════
let _as = { unitId:null, gen:null, type:null, troops:2000 };

function _getIdleGens(fid) {
  // 闲将 = 在势力武将池中，但不在任何部队squads中，不是太守，不是军师
  const gens = G.generals[fid] || [];
  const busyNames = new Set();
  G.units.filter(u => u.fac === fid).forEach(u => u.squads.forEach(sq => { if(sq.genName) busyNames.add(sq.genName); }));
  Object.values(G.cities).forEach(city => { if(city.fac === fid && city.prefect) busyNames.add(city.prefect); });
  const fac = G.factions[fid];
  if(fac?.strategist) busyNames.add(fac.strategist);
  return gens.filter(g => !busyNames.has(g.name));
}

function openAddSquadModal(unitId) {
  const unit = G.units.find(u => u.id === unitId);
  if(!unit) return;
  if(unit.fac !== G.playerFac) return; // ★ v121fix: 安全校验
  if(unit.squads.length >= 3) { showNotif('已有3个分队，无法增编','warn'); return; }
  if(unit.status !== 'garrison') { showNotif('增编需驻扎于己方城市','warn'); return; }
  if(unit.mobilizingTurns > 0) { showNotif('部队整备中，请稍后增编','warn'); return; } // ★ v121fix
  if(isUnitMustering(unit)) { showNotif('部队集结中，请稍后增编','warn'); return; } // ★ v121fix
  const atCity = getUnitAtCity(unit);
  if(!atCity || atCity.fac !== G.playerFac) { showNotif('增编需驻扎于己方城市','warn'); return; }
  const idles = _getIdleGens(G.playerFac);
  if(!idles.length) { showNotif('无闲置武将可编入','warn'); return; }
  _as = { unitId, gen:null, type:null, troops:2000 };
  document.getElementById('asTitle').textContent = `增编分队 · ${unit.squads[0]?.genName || ''}部`;
  document.getElementById('addSquadModal').style.display = 'flex';
  renderAddSquadModal();
}

function closeAddSquadModal() {
  document.getElementById('addSquadModal').style.display = 'none';
}

function renderAddSquadModal() {
  const unit = G.units.find(u => u.id === _as.unitId);
  if(!unit) return;
  const atCity = getUnitAtCity(unit);
  const fac = G.factions[G.playerFac];
  const idles = _getIdleGens(G.playerFac);
  const totalTroopsCurrent = unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
  const unitCap = getUnitMax(G.playerFac) - totalTroopsCurrent;
  const squadMax = getSquadMax(G.playerFac);
  const maxT = Math.min(squadMax, unitCap);
  const amt = Math.min(_as.troops, maxT);

  // 武将卡片
  const _asAptLbl={cavalry:'骑',light:'轻',heavy:'重',archer:'弓',siege:'攻',naval:'水'};
  const _asAptCol=v=>v==='S'?'#8a7040':v==='A'?'#1a7a3a':v==='B'?'#1a5f8a':v==='C'?'#888':'#aaa';
  const _asSelBase=_as.type?TROOP_TYPES[_as.type]?.baseType||_as.type:null;
  const genCards = idles.map(g => {
    const gd = GEN_MAP[g.name] || {};
    const sel = _as.gen === g.name;
    const aptRow=gd.apt?['cavalry','light','heavy','archer','siege','naval'].map(k=>{
      const v=gd.apt[k]||'C';
      const hl=_asSelBase===k;
      return `<span style="font-size:8px;color:${_asAptCol(v)};${hl?'font-weight:700;text-decoration:underline;':''}">${_asAptLbl[k]}${v}</span>`;
    }).join('<span style="color:rgba(80,65,40,.15);font-size:7px"> · </span>'):'';
    return `<div class="rm-gen-card${sel?' selected':''}" onclick="asPickGen('${g.name}')" style="cursor:pointer;padding:4px 8px;margin:2px;border:1px solid ${sel?'var(--wei)':'rgba(92,74,50,.2)'};border-radius:4px;display:inline-block;font-size:10px;background:${sel?'rgba(42,122,154,.08)':'transparent'}">
      <b>${g.name}</b> ${genClassTagsHtml(g.name)} <span style="color:rgba(92,74,50,.45)">武${gd.war||'?'} 统${gd.com||'?'} 智${gd.int||'?'}</span>
      ${aptRow?`<div style="margin-top:1px">${aptRow}</div>`:''}
    </div>`;
  }).join('');

  // 兵种选择
  // ★ v164: 部曲兵种锁定视觉
  const _asRetLock = _as.gen && getRetainers(_as.gen) > 0 ? getRetainerType(_as.gen) : (_as.gen ? _getBilletRetainerType(_as.gen) : null);
  const typeIds = ['cavalry','light','archer','heavy','siege'];
  const typeCards = typeIds.map(tid => {
    const td = TROOP_TYPES[tid];
    if(!td) return '';
    const sel = _as.type === tid;
    const locked = _asRetLock && tid !== _asRetLock;
    const lockTag = (_asRetLock && tid === _asRetLock) ? ' 🔒' : '';
    return `<div class="rm-gen-card${sel?' selected':''}" onclick="asPickType('${tid}')" style="cursor:${locked?'not-allowed':'pointer'};padding:4px 8px;margin:2px;border:1px solid ${sel?'var(--wei)':'rgba(92,74,50,.2)'};border-radius:4px;display:inline-block;font-size:10px;background:${sel?'rgba(42,122,154,.08)':'transparent'};opacity:${locked?0.35:1}">
      ${td.icon} ${td.name}${lockTag}
    </div>`;
  }).join('');

  // 特色兵种（如果城市有）
  let eliteCards = '';
  if(atCity) {
    Object.entries(TROOP_TYPES).forEach(([tid, td]) => {
      if(!td.elite || td.homeCity !== atCity.id) return; // ★ v120fix: homeCity not city
      if(atCity.fac !== G.playerFac) return; // 城市必须是己方的
      const cur = G.units.filter(u=>u.fac===G.playerFac).flatMap(u=>u.squads).filter(sq=>sq.type===tid).length;
      if(cur >= (td.maxSquads||3)) return;
      const sel = _as.type === tid;
      eliteCards += '<div class="rm-gen-card' + (sel?' selected':'') + '" onclick="asPickType(\'' + tid + '\')" style="cursor:pointer;padding:4px 8px;margin:2px;border:1px solid ' + (sel?'#c09030':'rgba(92,74,50,.2)') + ';border-radius:4px;display:inline-block;font-size:10px;background:' + (sel?'rgba(192,144,48,.1)':'transparent') + '">' + td.icon + ' ' + td.name + ' ★</div>';
    });
  }

  // 费用计算
  const _gentryMult = getGentryRecruitMult(atCity?.id);
  const _barrDisc = getBarracksDiscount(atCity);
  const _yibing = atCity?._yibingBuff && atCity._yibingBuff.expiresAt > G.turn ? 0.70 : 1.0;
  const _techRC = 1 + getTechEffect(G.playerFac, 'recruitCostMult');
  const _eliteCM = _as.type ? (TROOP_TYPES[_as.type]?.costMult || 1.0) : 1.0;
  const costGold = Math.floor(1200 * amt / 5000 * _gentryMult * _barrDisc * _yibing * _techRC * _eliteCM);
  const goldOk = fac.res.gold >= costGold;
  const matCost = _as.type ? calcSlotMatCost(_as.type, amt) : {};
  const matOk = canAffordMat(G.playerFac, matCost);
  const canConfirm = _as.gen && _as.type && amt >= 500 && goldOk && matOk;
  const mRate = getMusterRate(atCity?.id);

  // Pre-compute complex HTML to avoid nested template literals
  const _asMatHtml = Object.entries(matCost).map(function(pair) {
    const r = pair[0], v = pair[1];
    const icons = {iron:'⚙', wood:'🪵', horses:'🐴'};
    const has = (fac.res[r]||0) >= v;
    return '<span style="margin-left:10px">' + (icons[r]||r) + ' <span class="' + (has?'rm-cost-ok':'rm-cost-bad') + '">' + v + '</span><span style="color:rgba(44,36,22,.30)">/' + fmt(fac.res[r]||0) + '</span></span>';
  }).join('');
  const _asMusterInfo = amt <= mRate ? '（当旬即满编）' : '＋集结约' + Math.ceil((amt - mRate) / mRate) + '旬';
  const _asEliteHtml = eliteCards ? '<div style="margin-bottom:6px">' + eliteCards + '</div>' : '';
  const _asConfirmAttr = canConfirm ? 'confirmAddSquad()' : "showNotif('请选武将、兵种并确认资源','warn')";

  document.getElementById('asContent').innerHTML = `
    <div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:8px">
      当前${unit.squads.length}个分队 → 增编至${unit.squads.length+1}个分队
      · 部队总兵力 ${fmt(totalTroopsCurrent)}/${fmt(getUnitMax(G.playerFac))}
    </div>
    <div style="font-size:10px;font-weight:600;margin:6px 0 4px;color:var(--ink)">选择武将</div>
    <div style="max-height:100px;overflow-y:auto;margin-bottom:6px">${genCards || '<span style="color:rgba(92,74,50,.35)">无闲置武将</span>'}</div>
    <div style="font-size:10px;font-weight:600;margin:6px 0 4px;color:var(--ink)">选择兵种</div>
    <div style="margin-bottom:4px">${typeCards}</div>
    ${_asEliteHtml}
    <div style="font-size:10px;font-weight:600;margin:6px 0 4px;color:var(--ink)">兵力</div>
    <div class="rm-troop-input-row">
      <button class="rm-num-btn" onclick="asAdjTroops(-500)">−</button>
      <input class="rm-num-input" type="number" value="${amt}" min="500" max="${maxT}" step="500"
        oninput="asSetTroops(this.value)">
      <button class="rm-num-btn" onclick="asAdjTroops(500)">＋</button>
      <span style="font-size:9px;color:rgba(92,74,50,.4);margin-left:6px">上限${fmt(maxT)}</span>
    </div>
    <div class="rm-cost-bar" style="margin-top:8px">
      <div class="rm-cost-row">
        💰 <span class="${goldOk?'rm-cost-ok':'rm-cost-bad'}">${fmt(costGold)}</span><span style="color:rgba(44,36,22,.30)">/${fmt(fac.res.gold)}</span>
        ${_asMatHtml}
      </div>
    </div>
    <div style="font-size:9px;color:rgba(92,74,50,.40);margin:6px 0;line-height:1.5">
      <span style="color:rgba(100,180,255,.6)">🏰 集结速率 ${fmt(mRate)}/旬 · 整备1旬${_asMusterInfo}</span>
    </div>
    <div class="rm-btn-row">
      <button class="rm-btn cancel" onclick="closeAddSquadModal()">取消</button>
      <button class="rm-btn confirm${canConfirm?'':' disabled'}"
        onclick="${_asConfirmAttr}"
      >＋ 增编分队</button>
    </div>`;
}

function asPickGen(name) {
  _as.gen = name;
  // ★ v164: 有部曲的武将→兵种锁定
  const _rType = getRetainerType(name);
  if(_rType && getRetainers(name) > 0) _as.type = _rType;
  // ★ v167fix: 部曲在billet池中时也锁兵种
  else { const _bType = _getBilletRetainerType(name); if(_bType) _as.type = _bType; }
  renderAddSquadModal();
}
function asPickType(tid) {
  // ★ v164: 有部曲的武将兵种锁定
  if(_as.gen && getRetainers(_as.gen) > 0 && getRetainerType(_as.gen)){
    showNotif(`${_as.gen}有部曲，兵种锁定为${TROOP_TYPES[getRetainerType(_as.gen)]?.name||''}`,'warn');
    return;
  }
  // ★ v167fix: billet池中部曲也锁兵种
  if(_as.gen){
    const _bType = _getBilletRetainerType(_as.gen);
    if(_bType && tid !== _bType){ showNotif(`${_as.gen}有休整部曲，兵种锁定为${TROOP_TYPES[_bType]?.name||_bType}`,'warn'); return; }
  }
  _as.type = tid; renderAddSquadModal();
}
function asAdjTroops(delta) {
  const unit = G.units.find(u => u.id === _as.unitId);
  if(!unit) return;
  const totalTroopsCurrent = unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
  const maxT = Math.min(getSquadMax(G.playerFac), getUnitMax(G.playerFac) - totalTroopsCurrent);
  _as.troops = Math.max(500, Math.min(_as.troops + delta, maxT));
  renderAddSquadModal();
}
function asSetTroops(v) {
  const unit = G.units.find(u => u.id === _as.unitId);
  if(!unit) return;
  const totalTroopsCurrent = unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
  const maxT = Math.min(getSquadMax(G.playerFac), getUnitMax(G.playerFac) - totalTroopsCurrent);
  _as.troops = Math.max(500, Math.min(parseInt(v)||500, maxT));
  renderAddSquadModal();
}

function confirmAddSquad() {
  const unit = G.units.find(u => u.id === _as.unitId);
  if(!unit) return;
  if(unit.squads.length >= 3) { showNotif('已有3个分队','warn'); return; }
  const atCity = getUnitAtCity(unit);
  if(!atCity || atCity.fac !== G.playerFac) { showNotif('需驻扎于己方城市','warn'); return; }
  const fac = G.factions[G.playerFac];
  if(!_as.gen || !_as.type) { showNotif('请选武将和兵种','warn'); return; }

  // 校验武将确实是闲将
  const idles = _getIdleGens(G.playerFac);
  if(!idles.find(g => g.name === _as.gen)) { showNotif('该武将已有任务','warn'); return; }

  // 特色兵种上限
  const td = TROOP_TYPES[_as.type];
  if(td?.elite && td.maxSquads) {
    const cur = G.units.filter(u => u.fac === G.playerFac).flatMap(u => u.squads).filter(sq => sq.type === _as.type).length;
    if(cur >= td.maxSquads) { showNotif(`${td.name}已达上限(${td.maxSquads}队)`,'warn'); return; }
  }

  const totalTroopsCurrent = unit.squads.reduce((s,q) => s + (q.maxTroops||q.troops), 0);
  const maxT = Math.min(getSquadMax(G.playerFac), getUnitMax(G.playerFac) - totalTroopsCurrent);
  const amt = Math.min(_as.troops, maxT);
  if(amt < 500) { showNotif('兵力不足500','warn'); return; }

  // 费用
  const _gentryMult = getGentryRecruitMult(atCity?.id);
  const _barrDisc = getBarracksDiscount(atCity);
  const _yibing = atCity?._yibingBuff && atCity._yibingBuff.expiresAt > G.turn ? 0.70 : 1.0;
  const _techRC = 1 + getTechEffect(G.playerFac, 'recruitCostMult');
  const _eliteCM = td?.costMult || 1.0;
  const costGold = Math.floor(1200 * amt / 5000 * _gentryMult * _barrDisc * _yibing * _techRC * _eliteCM);
  if(fac.res.gold < costGold) { showNotif('金钱不足','warn'); return; }
  const matCost = calcSlotMatCost(_as.type, amt);
  for(const [r,v] of Object.entries(matCost)) {
    if((fac.res[r]||0) < v) { showNotif(`${({iron:'铁矿',wood:'木材',horses:'马匹'})[r]||r}不足`,'warn'); return; }
  }

  // 扣资源
  safeSub(fac.res, 'gold', costGold);
  deductMat(G.playerFac, matCost);

  // ★ v136: 征兵惩罚大幅加重——质量×100，民心×120
  const rcRatio = amt / atCity.pop;
  atCity.popQuality = Math.max(20, (atCity.popQuality||80) - rcRatio * 100);
  atCity.morale = Math.max(0, (atCity.morale||50) - rcRatio * 120);

  // 等级加权
  const _eliteLv = td?.eliteLevel || 0;
  const cityLevel = _eliteLv > 0 ? Math.max(_eliteLv, getInitLevel(atCity)) : getInitLevel(atCity);
  const oldLevel = unit.level || 1;
  const oldTotal = getUnitTroops(unit);
  const newLevelRaw = (oldTotal * oldLevel + amt * cityLevel) / (oldTotal + amt);
  unit.level = Math.max(1, Math.min(UNIT_LEVEL_MAX, Math.round(newLevelRaw)));

  // 集结
  const mRate = getMusterRate(atCity?.id);
  const firstBatch = Math.min(mRate, amt);
  const newSq = {
    genName: _as.gen, type: _as.type,
    troops: firstBatch, maxTroops: amt, morale: 80,
  };
  if(firstBatch < amt) {
    newSq._musterTarget = amt;
    newSq._mustered = firstBatch;
  }
  unit.squads.push(newSq);

  // 整备1旬
  unit.mobilizingTurns = 1;
  unit._apRemaining = 0;

  const estTurns = amt <= mRate ? 0 : Math.ceil((amt - mRate) / mRate);
  log(`＋ ${unit.squads[0]?.genName}部 增编分队：${_as.gen}·${td?.name||_as.type}·${fmt(amt)}兵（${unit.squads.length}分队）${estTurns>0?'，集结约'+estTurns+'旬':''}`,'economy');
  closeAddSquadModal();
  renderAllLight();
}
