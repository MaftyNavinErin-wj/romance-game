// src/render/notifications.js
//
// showNotif — 右上角浮动通知(3 秒后自动消失)
//
// 来源:从 project_romance_v181.html L17661-L17666 整体抽离(Session 2.1 / 阶段 2)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
// 接口风格:全局函数(同 v181 + events.js 100+ 调用点保持兼容,hoisted function
// 跨同 realm classic <script> 全局可见)。
//
// 依赖:
//   - DOM:document.createElement / appendChild / setTimeout(原生 API)
//   - CSS:.notif 类(在 v181 内联 <style> 中,phase 2 不抽 CSS)
//   - CSS 变量:var(--ink-l)(在 v181 内联 <style> 中)
// 无外部 JS 函数依赖、无状态变量、无队列、完全自包含。

function showNotif(msg,type='info'){
  const cols={info:'var(--ink-l)',warn:'#8a6a10',battle:'#c03030'};
  const el=document.createElement('div');
  el.className='notif';el.style.borderLeftColor=cols[type]||cols.info;el.textContent=msg;
  document.body.appendChild(el);setTimeout(()=>el.remove(),3000);
}


// ════════════════════════════════════════════════════════════════════
// ── R4.3 phase 4 sub-session 4.3 扩展 (notifications.js 新增) ──
//
// 4.3 抽离决策 (2026-05-08):
//   - showNotif (phase 2 起源, 已存在文件) — 简单浮动通知, 自包含
//   - 4.3 新增: 迁民弹窗 / 告急卡片系统 / closeUnitMenu / stack picker
//   - 跟 modals.js 区分: notifications.js 侧重轻量通知/卡片/picker, 不含 confirm/cancel 按钮的复杂 modal HTML
//
// ── 4.3 抽离范围 (4 段) ──
//   R4.3.a 迁民弹窗 modal              v181 L1146-L1275 (showMigrateDialog, 1 func)
//   R4.3.b 告急卡片 + 食物警报系统       v181 L1287-L1393 (2 const + 8 funcs)
//                                       _pendingCards / _shownCities (const)
//                                       renderAlertStack / confirmCard / dismissCard
//                                       renderFoodAlerts / _doFATransfer /
//                                       confirmFALong / confirmFAOnce / dismissFA
//   R4.3.c closeUnitMenu               v181 L8818-L8823 (1 func, segment header 同搬)
//                                       注: _unitMenu let (L1123 v181) 留 v181 (跟其他地图 lets 一组)
//   R4.3.d stack picker                v181 L9166-L9238 (1 let + 3 funcs)
//                                       _stackPickerOpen (let) + closeStackPicker /
//                                       showStackPicker / onStackPickerSelect
//
// 函数总数: 1 + 8 + 1 + 3 = **13 函数 + 2 const + 1 let**
// (合计 notifications.js: 1 + 13 = 14 函数 + 2 const + 1 let)
//
// ── 写口归属声明 ──
// **本文件主要写口**:
//   - DOM (#alertStack / #foodAlerts / #stackPicker / 各 modal HTML innerHTML)
//   - _pendingCards / _shownCities (告急卡片队列)
//   - _stackPickerOpen (picker open state)
//   - G.foodAlertCards (粮食警报数据, 通过 dismiss/confirm 移除条目)
//   - G.supplyLines (长期补给线, confirmFALong 创建)
//   - G.selUnitId / G.activeTab (stack picker 选中部队改主选)
//
// **跨链读取/调用**:
//   - cityDist / doTransfer / getCityFoodCost (经济链)
//   - issueUnitMove / canMigrate / getMigrateTargets / executeMigration (军事/经济链)
//   - clearMovePreview / renderAllLight / updateTabs / log (核心)
//   - hexNeighbors / hkey / HEX_CITY (map.js)
//   - isHostile (外交链)
//   - FAC / G.cities / G.units / G.playerFac

// ════════════════════════════════════════════════════════════════════
// ── R4.3.a 迁民弹窗 modal (v181 L1146-L1275) ──
// ════════════════════════════════════════════════════════════════════

function showMigrateDialog(srcCityId){
  const check = canMigrate(srcCityId);
  if(!check.ok){ showNotif(check.reason, 'warn'); return; }
  const src = G.cities[srcCityId];
  const targets = getMigrateTargets(srcCityId);
  const srcReg = CITY_TO_STATE[srcCityId];

  // 构建弹窗
  let dstId = targets[0];
  let ratio = 0.50;

  function buildContent(){
    const dst = G.cities[dstId];
    // ★ v166: 科技减免
    const _uiLossReduce = getTechEffect(src.fac, 'migrateLossReduce');
    const _uiDstReduce = 1 - getTechEffect(src.fac, 'migrateDstPenReduce');
    const _uiLossRate = Math.max(0.10, MIGRATE_LOSS_RATE - _uiLossReduce);
    const hasMigTech = _uiLossReduce > 0;

    const movedPop = Math.floor(src.pop * ratio);
    const arrivedPop = Math.floor(movedPop * (1 - _uiLossRate));
    const lostPop = movedPop - arrivedPop;
    const srcScale = ratio / 0.50;
    const dstPopBefore = dst.pop;
    const dstRatio = arrivedPop / Math.max(1, dstPopBefore);
    const dstScale = dstRatio / 0.30;
    const dstReg = CITY_TO_STATE[dstId];
    const isSameReg = srcReg && dstReg && srcReg === dstReg;
    const countyMod = isSameReg ? MIGRATE_COUNTY_SAME : MIGRATE_COUNTY_CROSS;

    // 目的城粮食预估
    const dstFoodNow = getCityFoodTurns(dst);
    // 粗估迁入后可撑旬数
    const dstNetNow = getCityFoodNet(dst);
    const extraCost = arrivedPop * 0.0004;
    const dstNetAfter = dstNetNow - extraCost;
    const dstFoodAfter = dstNetAfter >= 0 ? Infinity : (dst.storage > 0 ? dst.storage / (-dstNetAfter) : 0);

    const dstOptions = targets.map(tid => {
      const tc = G.cities[tid];
      return `<option value="${tid}" ${tid===dstId?'selected':''}>${tc.name}（${fmt(tc.pop)}人）</option>`;
    }).join('');

    const warnColor = dstRatio > 0.50 ? '#c03030' : dstRatio > 0.25 ? '#8a6a10' : 'rgba(44,36,22,.6)';
    const foodWarnAfter = dstFoodAfter < 5 ? '#c03030' : dstFoodAfter < 10 ? '#8a6a10' : '#1a7a3a';

    return `<div style="font-family:'Noto Serif SC',serif;padding:18px 22px;max-width:380px">
      <div style="font-size:15px;color:#6b5530;font-weight:700;margin-bottom:12px">⇄ 迁移人口 — ${src.name}</div>
      <div style="font-size:10px;color:rgba(44,36,22,.4);margin-bottom:14px">强制迁移城市人口至邻城。代价极大，仅适用于预判丢城时的焦土策略。</div>

      <div style="margin-bottom:10px">
        <span style="font-size:10px;color:rgba(44,36,22,.55)">目的地：</span>
        <select id="_migDst" style="font-size:11px;padding:3px 6px;border:1px solid rgba(80,65,40,.2);border-radius:2px;background:rgba(255,252,245,.8);font-family:inherit">${dstOptions}</select>
        <span style="font-size:9px;color:rgba(92,74,50,.35);margin-left:4px">${isSameReg?'同地域':'跨地域 ⚠'}</span>
      </div>

      <div style="margin-bottom:6px;font-size:10px;color:rgba(44,36,22,.55)">迁移比例：<b style="color:#6b5530">${Math.round(ratio*100)}%</b></div>
      <input type="range" id="_migSlider" min="${MIGRATE_MIN_RATIO*100}" max="${MIGRATE_MAX_RATIO*100}" value="${Math.round(ratio*100)}" step="5" style="width:100%;margin-bottom:4px;accent-color:#8a7040">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(92,74,50,.4);margin-bottom:14px">
        <span>迁出 ${fmt(movedPop)}人</span>
        <span style="color:#c03030">损耗 ${fmt(lostPop)}人（${Math.round(_uiLossRate*100)}%${hasMigTech?' <span style="color:#5a8a3a;font-size:8px">徙民实边-10%</span>':''}）</span>
        <span style="color:#1a7a3a">到达 ${fmt(arrivedPop)}人</span>
      </div>

      <div style="border-top:1px solid rgba(80,65,40,.1);padding-top:10px;margin-bottom:8px">
        <div style="font-size:10px;color:#6b5530;font-weight:700;margin-bottom:6px">来源城（${src.name}）</div>
        <div style="font-size:10px;color:rgba(44,36,22,.6);line-height:2">
          人口　${fmt(src.pop)} → <b>${fmt(src.pop - movedPop)}</b><br>
          <span style="color:#c03030">民心 ${(MIGRATE_SRC_BASE.morale*srcScale).toFixed(1)}</span>　
          <span style="color:#c03030">质量 ${(MIGRATE_SRC_BASE.quality*srcScale).toFixed(1)}</span>　
          <span style="color:#c03030">存粮 ${Math.round(MIGRATE_SRC_BASE.storagePct*srcScale*100)}%</span><br>
          <span style="color:#c03030">属县忠诚 全县${countyMod.src>0?'+':''}${Math.round(countyMod.src*srcScale)}</span>
        </div>
      </div>

      <div style="border-top:1px solid rgba(80,65,40,.1);padding-top:10px;margin-bottom:8px">
        <div style="font-size:10px;color:#6b5530;font-weight:700;margin-bottom:6px">目的城（${dst.name}）</div>
        <div style="font-size:10px;color:rgba(44,36,22,.6);line-height:2">
          人口　${fmt(dstPopBefore)} → <b>${fmt(dstPopBefore + arrivedPop)}</b><br>
          涌入比　<span style="color:${warnColor};font-weight:700">${Math.round(dstRatio*100)}%</span><br>
          <span style="color:#c03030">民心 ${(MIGRATE_DST_BASE.morale*dstScale*_uiDstReduce).toFixed(1)}</span>　
          <span style="color:#c03030">质量 ${(MIGRATE_DST_BASE.quality*dstScale*_uiDstReduce).toFixed(1)}</span>${hasMigTech?'<span style="color:#5a8a3a;font-size:8px"> 徙民实边-30%</span>':''}<br>
          <span style="color:#c03030">属县忠诚 全县${countyMod.dst>0?'+':''}${Math.round(countyMod.dst*dstScale)}</span><br>
          粮食可撑　<span style="color:${foodWarnAfter}">${dstFoodAfter===Infinity?'∞':dstFoodAfter.toFixed(1)}旬</span>
          <span style="font-size:9px;color:rgba(92,74,50,.35)">（现${dstFoodNow===Infinity?'∞':dstFoodNow.toFixed(1)}旬）</span>
        </div>
      </div>

      <div style="border-top:1px solid rgba(80,65,40,.1);padding-top:10px;margin-bottom:14px">
        <div style="font-size:10px;color:#6b5530;font-weight:700;margin-bottom:4px">势力影响</div>
        <div style="font-size:10px;color:rgba(44,36,22,.6);line-height:1.8">
          价值观冲击：<span style="color:#c03030">文治→暴政 +3　武略→铁血 +1</span>
          ${!isSameReg?'<br><span style="color:#8a6a10">⚠ 跨地域迁移，士族冲击更大</span>':''}
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:center">
        <button id="_migOk" class="act-btn" style="padding:8px 24px;color:#c03030;border-color:rgba(192,48,48,.3)">确认迁移</button>
        <button id="_migCancel" class="act-btn" style="padding:8px 24px">取消</button>
      </div>
    </div>`;
  }

  // 创建modal
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);z-index:800;display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--parch,#f5eee1);border:1px solid rgba(80,65,40,.25);border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function render(){
    box.innerHTML = buildContent();
    // Bind events
    const slider = document.getElementById('_migSlider');
    const sel = document.getElementById('_migDst');
    if(slider) slider.addEventListener('input', e => { ratio = parseInt(e.target.value)/100; render(); });
    if(sel) sel.addEventListener('change', e => { dstId = e.target.value; render(); });
    const okBtn = document.getElementById('_migOk');
    if(okBtn) okBtn.addEventListener('click', () => {
      executeMigration(srcCityId, dstId, ratio);
      document.body.removeChild(overlay);
      renderAll();
    });
    const cancelBtn = document.getElementById('_migCancel');
    if(cancelBtn) cancelBtn.addEventListener('click', () => document.body.removeChild(overlay));
  }
  render();
  overlay.addEventListener('click', e => { if(e.target === overlay) document.body.removeChild(overlay); });
}

// ════════════════════════════════════════════════════════════════════
// ── R4.3.b 告急卡片 + 食物警报系统 (v181 L1287-L1393) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════
// 🏗 AI 基建决策
// ═══════════════════════════════════════
// 经济链 E5 (AI 经济决策 + 调粮 aiDoBuild / aiDoTransfer / aiDoAppointments / processTransfers / checkResupply / findBestDonor / cityDist / doTransfer,L5622-L5996) 已抽离到 src/chains/economy.js

// ═══════════════════════════════════════
// 右下角告急卡片系统（★新增，替换全屏弹窗）
// ═══════════════════════════════════════
const _pendingCards=[];
const _shownCities=new Set(); // 本旬已弹过卡片的城市，避免重复

function renderAlertStack(){
  const stack=document.getElementById('alertStack');
  // 最多显示3张
  const visible=_pendingCards.slice(0,3);
  stack.innerHTML=visible.map((card,idx)=>`
    <div class="alert-card ${card.type}" id="acard-${idx}">
      <div class="alert-card-close" onclick="dismissCard(${idx})">✕</div>
      <div class="alert-card-title">${card.title}</div>
      <div class="alert-card-body">${card.body.replace(/\n/g,'<br>')}</div>
      <div class="alert-card-btns">
        <button class="ac-btn ok" onclick="confirmCard(${idx})">确认调粮</button>
        <button class="ac-btn no" onclick="dismissCard(${idx})">忽略</button>
      </div>
    </div>`).join('');
}

function confirmCard(idx){
  const card=_pendingCards[idx];
  if(card&&card.cb) card.cb();
  _pendingCards.splice(idx,1);
  renderAlertStack();
}
function dismissCard(idx){
  _pendingCards.splice(idx,1);
  renderAlertStack();
}

// ═══════════════════════════════════════
// REBELLIONS & EVENTS
// ═══════════════════════════════════════
// v0.5: 右下角告急卡片渲染（三按钮）
function renderFoodAlerts(){
  let el=document.getElementById('foodAlerts');
  if(!el){
    el=document.createElement('div');
    el.id='foodAlerts';
    el.style.cssText='position:fixed;bottom:52px;right:14px;z-index:250;display:flex;flex-direction:column;gap:5px;pointer-events:none';
    document.body.appendChild(el);
  }
  const cards=(G.foodAlertCards||[]);
  el.innerHTML=cards.map(a=>{
    const turns=a.turns===Infinity?'∞':a.turns.toFixed(1);
    const col=a.turns<5?'#c03030':'#8a6a10';
    const cls=a.turns<5?'border:1px solid rgba(200,60,60,.6);border-left:3px solid #c03030':'border:1px solid rgba(138,106,16,.35);border-left:3px solid #8a6a10';
    if(!a.donor){
      return`<div style="background:rgba(245,238,225,.98);${cls};padding:7px 10px;font-family:'Noto Serif SC',serif;font-size:10px;pointer-events:all;max-width:240px">
        <div style="color:${col};margin-bottom:3px;display:flex;justify-content:space-between">⚠ ${a.cityName} 粮食告急 <span style="cursor:pointer;color:rgba(80,65,40,.25)" onclick="dismissFA('${a.cityId}')">✕</span></div>
        <div style="color:rgba(44,36,22,.55);font-size:9px">可撑<span style="color:${col};font-weight:bold"> ${turns}旬</span>，势力内无富余城</div>
      </div>`;
    }
    const dist=cityDist(a.cityId,a.donor.id);
    const lossRate=dist<=1?.05:dist<=2?.12:.20;
    const amount=Math.floor(getCityFoodCost(G.cities[a.cityId]).total*8);
    const net=Math.floor(amount*(1-lossRate));
    return`<div style="background:rgba(245,238,225,.98);${cls};padding:7px 10px;font-family:'Noto Serif SC',serif;font-size:10px;pointer-events:all;max-width:250px">
      <div style="color:${col};margin-bottom:3px;display:flex;justify-content:space-between">⚠ ${a.cityName} 粮食告急 <span style="cursor:pointer;color:rgba(80,65,40,.25)" onclick="dismissFA('${a.cityId}')">✕</span></div>
      <div style="color:rgba(44,36,22,.55);font-size:9px;line-height:1.7">
        可撑<span style="color:${col};font-weight:bold"> ${turns}旬</span> · 来源：<span style="color:var(--ink-l)">${a.donor.name}</span>（距${dist}格，途损${(lossRate*100).toFixed(0)}%）<br>
        调${fmt(amount)}石→实收${fmt(net)}石，${Math.ceil(dist*1.5)}旬抵达
      </div>
      <div style="display:flex;gap:4px;margin-top:5px">
        <span onclick="confirmFALong('${a.cityId}')" style="cursor:pointer;color:#60d0a0;border:1px solid rgba(40,174,96,.4);padding:2px 7px;font-size:9px">长期补给</span>
        <span onclick="confirmFAOnce('${a.cityId}')" style="cursor:pointer;color:#2a7a9a;border:1px solid rgba(41,128,185,.4);padding:2px 7px;font-size:9px">仅此一次</span>
        <span onclick="dismissFA('${a.cityId}')" style="cursor:pointer;color:rgba(92,74,50,.45);border:1px solid var(--border);padding:2px 7px;font-size:9px">忽略</span>
      </div>
    </div>`;
  }).join('');
}
function _doFATransfer(cityId){
  const a=(G.foodAlertCards||[]).find(x=>x.cityId===cityId);
  if(!a||!a.donor) return;
  const donor=G.cities[a.donor.id]; if(!donor) return;
  const amount=Math.floor(getCityFoodCost(G.cities[cityId]).total*8);
  if(amount<=0) return;
  const dist=cityDist(cityId,donor.id);
  doTransfer(donor.id,cityId,amount,Math.ceil(dist*1.5),dist<=1?.05:dist<=2?.12:.20);
}
function confirmFALong(cityId){
  const a=(G.foodAlertCards||[]).find(x=>x.cityId===cityId);
  if(!a||!a.donor) return;
  if(!G.supplyLines) G.supplyLines={};
  G.supplyLines[cityId]={fromId:a.donor.id,fromName:a.donor.name};
  log(`📦 长期补给线：${a.donor.name}→${a.cityName}`,'transfer');
  _doFATransfer(cityId);
  G.foodAlertCards=G.foodAlertCards.filter(x=>x.cityId!==cityId);
  renderFoodAlerts(); renderAllLight();
}
function confirmFAOnce(cityId){
  _doFATransfer(cityId);
  G.foodAlertCards=G.foodAlertCards.filter(x=>x.cityId!==cityId);
  renderFoodAlerts(); renderAllLight();
}
function dismissFA(cityId){
  G.foodAlertCards=G.foodAlertCards.filter(x=>x.cityId!==cityId);
  renderFoodAlerts();
}

// ════════════════════════════════════════════════════════════════════
// ── R4.3.c closeUnitMenu (v181 L8818-L8823) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 地图交互：左键选中部队 → 再左键点地图任意位置移动
// 右键：取消选中 / 取消移动预览
// ═══════════════════════════════════════════════════════

function closeUnitMenu(){if(_unitMenu){_unitMenu.remove();_unitMenu=null;}}

// ════════════════════════════════════════════════════════════════════
// ── R4.3.d stack picker (v181 L9166-L9238) ──
// ════════════════════════════════════════════════════════════════════

// ── Stack Picker ──────────────────────────────────────
let _stackPickerOpen=false;

function closeStackPicker(){
  const el=document.getElementById('stackPicker');
  if(el) el.style.display='none';
  _stackPickerOpen=false;
}

function showStackPicker(e, stackUnits){
  const el=document.getElementById('stackPicker');
  const list=document.getElementById('stackPickerList');
  if(!el||!list) return;

  const facCol=f=>getFactionDef(f)?.color||'#888';
  const facName=f=>({wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'}[f]||f);
  const statusLabel=u=>u.mobilizingTurns>0?`⚙${u.mobilizingTurns}旬`:u.status==='camp'?'🏕营':u.status==='ambush'?'🌿伏':u.status==='garrison'?'🛡待':'⚔行';

  list.innerHTML=stackUnits.map(u=>{
    const total=getUnitTroops(u);
    const troopStr=total>=10000?(total/10000).toFixed(1)+'万':fmt(total);
    const isSel=G.selUnitId===u.id;
    const col=facCol(u.fac);
    const icons=u.squads.map(sq=>TROOP_TYPES[sq.type]?.icon||'').join('');
    return `<div class="sp-row${isSel?' sel':''}" onclick="onStackPickerSelect('${u.id}',event)">
      <div class="sp-flag" style="background:${col}"></div>
      <div>
        <div class="sp-name" style="color:${col}">${u.squads[0]?.genName}部</div>
        <div style="font-size:9px;color:rgba(92,74,50,.55)">${facName(u.fac)} ${icons} ${troopStr}</div>
      </div>
      <div class="sp-status" style="color:${col};border-color:${col}44">${statusLabel(u)}</div>
    </div>`;
  }).join('');

  // 位置：在鼠标正下方
  el.style.display='block';
  const menuW=el.offsetWidth||200;
  const menuH=el.offsetHeight||100;
  let left=e.clientX-menuW/2;
  let top=e.clientY+8;
  left=Math.max(8,Math.min(window.innerWidth-menuW-8,left));
  if(top+menuH>window.innerHeight-8) top=e.clientY-menuH-8;
  el.style.left=left+'px';
  el.style.top=top+'px';
  _stackPickerOpen=true;
}

function onStackPickerSelect(unitId, e){
  if(e) e.stopPropagation();
  closeStackPicker();
  const unit=G.units.find(u=>u.id===unitId);
  if(!unit) return;

  // 若当前选中了己方部队，点击敌方部队 → 直接向其节点进军
  if(G.selUnitId && G.selUnitId!==unitId){
    const attacker=G.units.find(u=>u.id===G.selUnitId);
    if(attacker && attacker.fac===G.playerFac && unit.fac!==attacker.fac){
      if(unit.hq !== undefined){
        // ★ v99: 走即时移动（攻击意图）
        issueUnitMove(attacker, unit.hq, unit.hr, null, true);
      }
      return;
    }
  }

  if(G.selUnitId===unitId){
    G.selUnitId=null; clearMovePreview();
  } else {
    G.selUnitId=unitId; clearMovePreview();
    G.activeTab='mil'; updateTabs();
  }
  renderAllLight();
}

// ── H sub-session: 全局 UI utilities (log + updateFacStats + handleKeyDown, 原 v181 L1092-L1128, 37 行 verbatim) ──
function log(msg,type=''){
  G.logs.unshift({msg,type});
  if(G.logs.length>8) G.logs.pop();
  const el=document.getElementById('elog');
  el.innerHTML=G.logs.slice(0,5).map((e,i)=>`<span class="ev ${e.type}" style="opacity:${1-i*.18}">${e.msg}</span>`).join('<span style="color:rgba(80,65,40,.12);margin:0 6px">·</span>');
}

function updateFacStats(){
  Object.keys(G.factions).forEach(fid=>{
    const cities=Object.values(G.cities).filter(c=>c.fac===fid);
    G.factions[fid].cityCount=cities.length;
    const garrisonTotal=cities.reduce((s,c)=>s+c.garrison,0);
    const fieldTotal=G.units.filter(u=>u.fac===fid).reduce((s,u)=>s+getUnitTroops(u),0);
    G.factions[fid].totalTroops=garrisonTotal+fieldTotal;
    G.factions[fid].totalPop=cities.reduce((s,c)=>s+c.pop,0);
  });
}

/** v85: 全局键盘事件处理（body onkeydown） */
function handleKeyDown(e){
  // Enter/Space → 关闭当前战报弹窗
  if(e.key === 'Enter' || e.key === ' '){
    const bm = document.getElementById('battleModal');
    if(bm && bm.style.display === 'flex'){ e.preventDefault(); closeBattleModal(); return; }
  }
  // Escape → 关闭各种弹窗
  if(e.key === 'Escape'){
    const bm = document.getElementById('battleModal');
    if(bm && bm.style.display === 'flex'){ closeBattleModal(); return; }
    const bcm = document.getElementById('battleConfirmModal');
    if(bcm && bcm.style.display === 'flex') return; // 战前确认不允许Escape跳过
    const gm = document.getElementById('genericModal');
    if(gm && gm.style.display !== 'none'){ closeModal(); return; }
    const rm = document.getElementById('recruitModal');
    if(rm && rm.style.display === 'flex'){ closeRecruitModal(); return; }
  }
}
