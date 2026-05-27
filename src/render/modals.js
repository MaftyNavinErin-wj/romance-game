// src/render/modals.js
//
// 弹窗渲染函数 — 事件选择 / 通用 modal infra / 任命 / 外交
//
// 来源:从 project_romance_v181.html 整体抽离(Session 2.2 / 阶段 2)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),全局函数风格保持。
// 接口风格:全局函数(同 phase 2.1 决定),所有调用点不需改。
//
// 抽离的 6 个函数:
//   - showGenericModal(title, bodyHtml)(原 L11217):通用 modal 显示 → #genericModal
//   - closeModal()(原 L11222):关闭 #genericModal + #postModal
//   - _showEventToPlayer(evt)(原 L8233):事件选择弹窗,渲染 #eventModal
//     注:此函数会设 G._pendingEvent 标记当前 modal 占用,strict 算 mechanism 状态修改
//     但函数主体是纯 render(构造 HTML + 写 DOM),verbatim 搬不改任何逻辑
//   - openPrefectModal(cityId)(原 L11332):任命太守弹窗,调用 showGenericModal
//   - openStrategistModal()(原 L11954):任命军师弹窗,直接操作 #genericModal
//   - _showEnvoyIntelModal(targetFid, intelText)(原 L12288):外交通使情报弹窗,
//     完全自包含(动态创建 + 注入 #_envoyModal)
//   - showModal(title, content)(原 L16479):lazy 创建 #postModal
//   - closePostModal()(原 L16494):关闭 #postModal
//
// 留 v181 的:
//   - 战斗确认弹窗 _showCampBattleConfirm / _showSiegeBattleConfirm /
//     _showSiegeDefendConfirm / _showNextBattleConfirm(深耦合 _pendingBattleConfirms
//     queue + animation lock + retry,phase 3 机制层处理)
//   - showCourtCouncil(L5519,深耦合朝议提案选择 mechanism)
//   - showDiploSueForPeace(L11229,深耦合 _pendingPeaceOffer queue)
//   - 各种 specialized modals(openRecruitModal/openExpandModal/openAddSquadModal/
//     openRedeployModal/showMigrateDialog 等):专门子系统,phase 2.3 ui_panels 或留 v181
//
// 依赖(v181 全局可见,无需改动):
//   - DOM 元素 #genericModal / #genericModalTitle / #genericModalBody / #postModal /
//     #eventModal / #eventModalTitle / #eventModalSeason / #eventModalBody(在 v181 HTML 中)
//   - 全局函数(hoisted):resolveEventChoice / setPrefect / setStrategist /
//     clearAllPostsByGen / closeModal(本文件内)
//   - 数据:G / FAC / GEN_TAGS / CITY_TO_STATE / STATE_TO_GENTRY_FAC(同 realm 共享)
//   - 渲染同位:CSS 类 / 内联 style(在 v181 内联 <style> 中)

// ── 通用 modal infra ──
function showGenericModal(title, bodyHtml){
  document.getElementById('genericModalTitle').textContent = title;
  document.getElementById('genericModalBody').innerHTML = bodyHtml;
  document.getElementById('genericModal').style.display = 'flex';
}
function closeModal(){
  document.getElementById('genericModal').style.display = 'none';
  const pm = document.getElementById('postModal');
  if(pm) pm.style.display = 'none';
}

function showModal(title, content){
  let m = document.getElementById('postModal');
  if(!m){
    m = document.createElement('div');
    m.id='postModal';
    m.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
    m.onclick=e=>{ if(e.target===m) closePostModal(); };
    document.body.appendChild(m);
  }
  m.innerHTML=`<div style="background:rgba(245,238,225,.98);border:1px solid rgba(92,74,50,.4);border-radius:4px;padding:14px 18px;min-width:240px;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,.6)">
    <div style="font-family:'Noto Serif SC',serif;font-size:13px;color:var(--ink-l);margin-bottom:8px;border-bottom:1px solid rgba(80,65,40,.14);padding-bottom:6px">${title}</div>
    ${content}
  </div>`;
  m.style.display='flex';
}
function closePostModal(){
  const m=document.getElementById('postModal');
  if(m) m.style.display='none';
}

// ── 事件选择弹窗 ──
function _showEventToPlayer(evt){
  G._pendingEvent = evt;
  const {def, ctx} = evt;
  const choices = def.choices(ctx);
  const narrativeText = def.narrative(ctx);

  let choicesHtml = choices.map((ch,i)=>{
    const dis = ch.disabled ? 'opacity:.4;pointer-events:none;cursor:not-allowed' : 'cursor:pointer';
    return `<div onclick="resolveEventChoice(${i})" style="padding:10px 14px;margin-bottom:8px;border:1px solid rgba(92,74,50,.25);background:rgba(80,65,40,.04);${dis};transition:all .15s;font-size:11.5px;line-height:1.7" onmouseover="if(!this.style.pointerEvents || this.style.pointerEvents!=='none')this.style.background='rgba(80,65,40,.10)'" onmouseout="this.style.background='rgba(80,65,40,.04)'">
      <div style="font-weight:700;color:var(--ink);margin-bottom:3px">${ch.label}</div>
      <div style="font-size:10px;color:rgba(92,74,50,.6)">${ch.desc}</div>
    </div>`;
  }).join('');

  const bodyHtml = `
    <div style="font-size:11.5px;line-height:2;color:var(--ink);padding:0 0 14px;border-bottom:1px solid rgba(80,65,40,.08);margin-bottom:14px">
      <span style="font-size:10px;color:rgba(92,74,50,.45);letter-spacing:1px">${ctx.city?.name||ctx.genName||ctx.facLabel||ctx.complainerName||''}</span>
      <div style="margin-top:8px">${narrativeText}</div>
    </div>
    <div style="margin-bottom:6px;font-size:10px;color:rgba(92,74,50,.5);letter-spacing:1px">如何应对？</div>
    ${choicesHtml}
  `;

  document.getElementById('eventModalTitle').textContent = `${def.icon} ${def.name}`;
  document.getElementById('eventModalSeason').textContent = `${YEARS[G.year]} · ${SEASONS[G.seasonIdx]}`;
  document.getElementById('eventModalBody').innerHTML = bodyHtml;
  document.getElementById('eventModal').style.display = 'flex';
}

// ── 任命弹窗 ──
function openPrefectModal(cityId){
  const city = G.cities[cityId];
  if(!city) return;
  const fid = G.playerFac;
  const fc = getFactionDef(fid);
  const gens = (G.generals[fid]||[]).filter(g => g.role !== 'ruler');
  const rows = gens.slice().sort((a,b) => b.pol - a.pol).map(g => {
    const isCurrent = city.prefect === g.name;
    const cityDef = CITY_MAP[cityId];
    const unit = G.units.find(u => Array.isArray(u.squads) && u.squads.some(sq => sq.genName === g.name));
    const isOut = !!(unit && cityDef && (unit.hq !== cityDef.q || unit.hr !== cityDef.r));
    const hasPost = !!(G.genPost && G.genPost[g.name]);
    const dutyReduced = isOut || hasPost;
    const otherCity = Object.values(G.cities).find(c => c.id !== cityId && c.prefect === g.name);
    const dutyHint = dutyReduced ? `（${[isOut?'在外':null, hasPost?'兼官':null].filter(Boolean).join('/')}减半）` : '';
    const hint = isCurrent ? `（当前太守）${dutyHint}` : otherCity ? `（已任${otherCity.name}太守）` : dutyHint;
    const hintCol = isCurrent ? '#8a7040' : otherCity ? '#8a6a10' : 'rgba(92,74,50,.45)';
    const goldPct = Math.round(g.pol/500*100);
    const goldDisplay = dutyReduced ? Math.round(goldPct/2) : goldPct;
    const moralePt = ((g.pol/400) * (dutyReduced ? 0.5 : 1)).toFixed(2);
    // ★ v144→v172: "本地士族"按士族派系判定（含跨州同派系）
    const _tags = GEN_TAGS[g.name] || {};
    const _cityState = CITY_TO_STATE[cityId] || '';
    const _cityGFac = _cityState ? STATE_TO_GENTRY_FAC[_cityState] : null;
    const _isLocalGentry = _cityGFac && _tags.origin === 'gentry' && !_tags.clique
      && _tags.state && STATE_TO_GENTRY_FAC[_tags.state] === _cityGFac;
    const _localBadge = _isLocalGentry ? '<span style="font-size:7px;color:#daa520;background:rgba(218,165,32,.1);border:1px solid rgba(218,165,32,.25);padding:0 3px;border-radius:2px;margin-left:3px">本地士族</span>' : '';
    return `<div onclick="setPrefect('${cityId}','${g.name}')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;border-bottom:1px solid rgba(80,65,40,.08);transition:background .15s${_isLocalGentry&&!isCurrent?';background:rgba(218,165,32,.03)':''}"
      onmouseover="this.style.background='rgba(80,65,40,.05)'" onmouseout="this.style.background='${_isLocalGentry&&!isCurrent?'rgba(218,165,32,.03)':''}'"  >
      <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-weight:900;font-size:13px;background:${fc.color}22;border:1px solid ${fc.color}${isCurrent?'88':'33'};color:${isCurrent?fc.color:'rgba(92,74,50,.55)'};">${g.name[0]}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-family:'Noto Serif SC',serif;font-size:11px;color:${isCurrent?fc.color:'rgba(44,36,22,.75)'}">${g.name}</span>${_localBadge}
          <span style="font-size:8px;color:${hintCol}">${hint}</span>
        </div>
        <div style="font-size:9px;color:rgba(92,74,50,.45)">政${g.pol} · 💰+${goldDisplay}% · 🌿+${moralePt}/旬${isCurrent?'':' · <span style="color:#60c060">任命+8忠诚</span>'}</div>
      </div>
      ${isCurrent ? `<span style="font-size:9px;color:#8a7040">✓任职</span>` : `<span style="font-size:9px;color:rgba(92,74,50,.35)">任命→</span>`}
    </div>`;
  }).join('');

  const html = `<div style="font-size:11px;color:rgba(92,74,50,.55);padding:10px 12px 8px;border-bottom:1px solid rgba(80,65,40,.10)">
    <b style="color:${fc.color};font-family:'Noto Serif SC',serif">${city.name}</b> · 任命太守
    <span style="font-size:9px;margin-left:6px">（太守提供政治加成；在外或兼官时buff减半；任命可+8忠诚）</span>
  </div>
  ${city.prefect ? `<div onclick="setPrefect('${cityId}',null)" style="display:flex;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;border-bottom:1px solid rgba(80,65,40,.08);color:rgba(92,74,50,.40);font-size:10px" onmouseover="this.style.background='rgba(192,48,48,.04)'" onmouseout="this.style.background=''">
    <span style="font-size:12px">✕</span> 撤销太守任命
  </div>` : ''}
  <div style="max-height:280px;overflow-y:auto">${rows || '<div style="padding:12px;font-size:10px;color:rgba(92,74,50,.35)">暂无可用武将</div>'}</div>`;

  showGenericModal('任命太守', html);
}

function openStrategistModal(){
  const fid = G.playerFac;
  const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');
  const cur = G.factions[fid]?.strategist;
  const facColor = getFactionDef(fid)?.color || '#6b5530';
  const rows = gens.map(g=>{
    const isCur = g.name===cur;
    const intLabel = `int:${g.int}`;
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(80,65,40,.08)">
      <span style="flex:1;font-family:'Noto Serif SC',serif;font-size:11px;color:${isCur?facColor:'rgba(44,36,22,.85)'}">${g.name}${isCur?' ★':''}</span>
      <span style="font-size:9px;color:rgba(92,74,50,.55)">${intLabel}</span>
      ${isCur
        ? `<button onclick="setStrategist('${fid}',null);closeModal()" style="padding:2px 8px;font-size:9px;background:rgba(128,64,32,.1);color:#804020;border:1px solid rgba(128,64,32,.25);border-radius:2px;cursor:pointer">撤销</button>`
        : `<button onclick="setStrategist('${fid}','${g.name}');closeModal()" style="padding:2px 8px;font-size:9px;background:rgba(26,122,58,.1);color:#1a7a3a;border:1px solid rgba(26,122,58,.25);border-radius:2px;cursor:pointer">任命</button>`
      }
    </div>`;
  }).join('');
  const curGen = gens.find(g=>g.name===cur);
  const curLine = cur
    ? `<div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:8px">当前军师：<span style="color:${facColor}">${cur}</span>（int:${curGen?.int??'?'}）→ 计谋成功率+${Math.round(Math.max(-15,Math.min(15,(curGen?.int??60)-60)/100*50*100))}%加成</div>`
    : `<div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:8px">当前军师：未任命（使用君主int）</div>`;
  const modal = document.getElementById('genericModal');
  document.getElementById('genericModalTitle').textContent = '任命军师'; // ★ v149fix: 设置弹窗标题
  document.getElementById('genericModalBody').innerHTML =
    `<div style="padding:12px 4px">
      <div style="font-size:13px;font-family:'Noto Serif SC',serif;color:${facColor};margin-bottom:10px">任命军师</div>
      ${curLine}
      <div style="max-height:260px;overflow-y:auto">${rows||'<div style="color:rgba(92,74,50,.40);font-size:10px">无可用武将</div>'}</div>
    </div>`;
  modal.style.display='flex';
}

// ── 外交弹窗 ──
function _showEnvoyIntelModal(targetFid, intelText){
  const col = getFactionDef(targetFid)?.color || '#6b5530';
  const html = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(20,16,10,.55);z-index:500;display:flex;align-items:center;justify-content:center" id="_envoyModal" onclick="if(event.target===this)this.remove()">
    <div style="background:rgba(245,238,225,.97);border:2px solid ${col};border-radius:5px;padding:20px 24px;max-width:420px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.25)">
      <div style="font-family:'Noto Serif SC',serif;font-size:13px;color:${col};font-weight:600;margin-bottom:12px;border-bottom:1px solid rgba(80,65,40,.15);padding-bottom:8px">🏛 通使·${getFactionDef(targetFid)?.full}情报</div>
      <div style="font-size:11px;color:rgba(92,74,50,.80);line-height:1.9;white-space:pre-line">${intelText}</div>
      <div style="text-align:center;margin-top:16px">
        <button onclick="document.getElementById('_envoyModal').remove()" style="padding:5px 24px;font-size:11px;background:rgba(80,65,40,.12);color:rgba(92,74,50,.8);border:1px solid rgba(80,65,40,.2);border-radius:3px;cursor:pointer">知悉</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
