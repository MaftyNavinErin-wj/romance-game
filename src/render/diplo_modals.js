// src/render/diplo_modals.js
//
// 渲染层(R)— 政治 + 外交相关 modal (朝议 / 求和 / 屠城安民 / 附庸)。
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.6)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离范围(4 段)──
//   R4.6.a 朝议 modal cluster           v181 L998-L1118 (3 funcs)
//                                        showCourtCouncil / _checkPendingCourtAfterPopup /
//                                        triggerCourtCouncil
//                                        (phase 2 原则 "modal/UI 队列入口保留 v181" 在 phase 4 解禁)
//   R4.6.b AI 求和弹窗                  v181 L1216-L1240 (1 func + 段头)
//                                        showDiploSueForPeace
//   R4.6.c 屠城/安民弹窗                v181 L1279-L1300 (1 func)
//                                        showSiegeAftermathChoice
//   R4.6.d 附庸弹窗                     v181 L1307-L1338 (1 func)
//                                        showDiploVassal
//
// 函数总数: 3 + 1 + 1 + 1 = **6 函数**
//
// ── 写口归属声明 ──
// **本文件主要写口**:
//   - DOM #genericModal innerHTML / style.display (通用 modal 容器)
//   - DOM #genericModalTitle / #genericModalBody (modal 内容)
//   - window._pendingCourtCouncil (UI 队列, triggerCourtCouncil 写)
//
// **跨链读取/调用**:
//   - _generateCourtProposals / _applyCourtDecisions / _expireCourtDecrees /
//     _aiCourtSelect (政治链 P5 朝议 helpers, 已抽 src/chains/politics.js)
//   - acceptPeaceOffer / rejectPeaceOffer (外交链, 已抽 src/chains/diplomacy.js)
//   - _applySiegeAftermath / _onSiegeAftermath (豪族链, 已抽 src/chains/gentry.js)
//   - acceptVassalOffer / rejectVassalOffer (外交链, 已抽 src/chains/diplomacy.js)
//   - showNextBattleReport / showNextPrisomerModal 等弹窗链 (留 v181, phase 4.9 候选)
//   - FAC / G.factions / G.playerFac / G.cities (read)

// ════════════════════════════════════════════════════════════════════
// ── R4.6.a 朝议 modal cluster (v181 L998-L1118) ──
// ════════════════════════════════════════════════════════════════════

function showCourtCouncil(proposals){
  if(!proposals || !proposals.length) return;
  const selectCount = proposals.length >= 2 ? 2 : 1;
  const autoPass = proposals.length === 1;

  // ★ I3 fix: 仅1个提案时自动通过，不弹弹窗（仅日志通知）
  if(autoPass){
    _applyCourtDecisions(G.playerFac, proposals, [0]);
    renderAllLight();
    return;
  }

  let selected = [];

  function fmtEffect(p){
    if(p.proposal.buffKey === 'morale') return `+${p.effectVal.toFixed(1)}/旬`;
    return (p.effectVal > 0 ? '+' : '') + (p.effectVal*100).toFixed(1) + '%';
  }

  const modal = document.getElementById('courtModal');
  const body = document.getElementById('courtModalBody');
  const seasonLabel = document.getElementById('courtSeasonLabel');
  seasonLabel.textContent = (YEARS[G.year]||'') + ' · ' + (SEASONS[G.seasonIdx]||'');

  function render(){
    let html = `<div style="font-size:11px;color:rgba(44,36,22,.55);margin-bottom:14px;text-align:center">
      ${proposals.length}位重臣各呈一策，请择二而行。
    </div><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:18px">`;
    proposals.forEach((p, i) => {
      const sel = selected.includes(i);
      const facDef = FACTION_DEFS.find(f=>f.id===p.factionId);
      const facLabel = facDef?.label || '无派系';
      const statName = p.proposal.statScale === 'com' ? '统' : '政';
      const statVal = p.proposer[p.proposal.statScale] || 70;
      const pctStr = fmtEffect(p);
      const tierLabel = p.postDef.tier === 1 ? '一品' : '二品';
      html += `<div class="court-card" data-cidx="${i}" style="
        width:145px;padding:14px;border-radius:3px;cursor:pointer;user-select:none;
        border:1px solid ${sel?'rgba(92,74,50,.55)':'rgba(80,65,40,.14)'};
        background:${sel?'rgba(80,65,40,.06)':'rgba(255,252,245,.50)'};
        box-shadow:${sel?'0 2px 12px rgba(80,65,40,.10)':'none'};
        transition:all .15s;position:relative;
      ">
        ${sel?'<div style="position:absolute;top:5px;right:7px;color:var(--ink-l);font-size:13px;font-weight:bold">✓</div>':''}
        <div style="font-size:14px;color:#6b5530;font-weight:bold;margin-bottom:5px">${p.proposal.name}</div>
        <div style="font-size:10px;color:rgba(44,36,22,.40);margin-bottom:8px">${tierLabel}·${p.postDef.name}</div>
        <div style="font-size:11px;color:rgba(44,36,22,.80);margin-bottom:3px">
          提案人：<span style="color:#6b5530">${p.proposer.name}</span>
        </div>
        <div style="font-size:9px;color:rgba(92,74,50,.45);margin-bottom:8px">${facLabel}</div>
        <div style="font-size:11px;color:rgba(44,36,22,.60);line-height:1.7">
          ${p.proposal.desc}<br>
          <span style="color:#1a7a3a;font-weight:bold">效果：${pctStr}</span>
          <span style="font-size:9px;color:rgba(44,36,22,.30)">（${statName}${statVal}）</span>
        </div>
      </div>`;
    });
    html += `</div>`;
    const canConfirm = selected.length === selectCount;
    html += `<div style="text-align:center;padding-bottom:4px">
      <button id="_courtBtnOk" style="
        padding:9px 32px;border:1px solid ${canConfirm?'rgba(92,74,50,.45)':'rgba(80,70,50,.18)'};border-radius:2px;font-size:13px;
        font-family:'Noto Serif SC',serif;letter-spacing:2px;
        background:${canConfirm?'rgba(245,238,225,.95)':'rgba(245,238,225,.5)'};
        color:${canConfirm?'var(--ink)':'rgba(44,36,22,.25)'};
        cursor:${canConfirm?'pointer':'not-allowed'};
        opacity:${canConfirm?'1':'0.5'};box-shadow:${canConfirm?'0 1px 6px rgba(80,65,40,.12)':'none'};
        transition:all .2s;
      ">批准（${selected.length}/${selectCount}）</button>
    </div>`;
    body.innerHTML = html;

    // Bind card clicks
    body.querySelectorAll('.court-card').forEach(card => {
      card.addEventListener('click', function(){
        const idx = parseInt(this.dataset.cidx);
        const si = selected.indexOf(idx);
        if(si >= 0) selected.splice(si, 1);
        else if(selected.length < selectCount) selected.push(idx);
        render();
      });
    });
    // Bind confirm button
    const btn = document.getElementById('_courtBtnOk');
    if(btn) btn.addEventListener('click', function(){
      if(selected.length !== selectCount) return;
      _applyCourtDecisions(G.playerFac, proposals, selected);
      modal.style.display = 'none';
      invalidateLeftCache(); renderAllLight(); // ★ v167fix #36: 朝议不改地图，轻量渲染即可
    });
  }

  render();
  modal.style.display = 'flex';
}

/** ★ I3: 弹窗链尾端检查——前序弹窗（战报/俘虏/求和/附庸）关闭后，若有待处理朝议则弹出 */
function _checkPendingCourtAfterPopup(){
  if(window._pendingCourtCouncil){
    const p = window._pendingCourtCouncil;
    window._pendingCourtCouncil = null;
    setTimeout(()=>showCourtCouncil(p), 400);
  }
}

/** 朝议主入口（每季度首旬调用） */
function triggerCourtCouncil(){
  _expireCourtDecrees();
  ALL_FACS.forEach(fid => {
    const proposals = _generateCourtProposals(fid);
    if(!proposals.length) return;
    if(fid === G.playerFac){
      // Player: show modal (deferred to after renderAll in nextTurn)
      window._pendingCourtCouncil = proposals;
    } else {
      // AI: auto-select
      const chosen = _aiCourtSelect(fid, proposals);
      _applyCourtDecisions(fid, proposals, chosen);
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// ── R4.6.b AI 求和弹窗 (v181 L1216-L1240) ──
// ════════════════════════════════════════════════════════════════════

// ── 通用轻量弹窗 ──────────────────────────────────────

// ── AI求和弹窗 ──────────────────────────────────────
function showDiploSueForPeace(offer){
  if(!offer) return;
  const {from, to} = offer;
  if(to !== G.playerFac) return; // 安全检查
  const facName = FAC[from]?.name || from;
  const modal = document.getElementById('genericModal');
  const body  = document.getElementById('genericModalBody');
  if(!modal||!body) return;
  body.innerHTML = `
    <div style="font-family:'Noto Serif SC',serif;font-size:14px;color:#6b5530;margin-bottom:12px">
      🕊 ${facName}遣使求和
    </div>
    <div style="font-size:11px;color:rgba(44,36,22,.75);line-height:1.9;margin-bottom:16px">
      ${facName}深感连年征战，国力损耗，愿与我方暂罢兵戈，化干戈为玉帛。<br>
      如接受停战，双方关系将转为中立（友好度重置为35）。
    </div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button onclick="acceptPeaceOffer('${from}')" style="padding:6px 18px;background:rgba(26,122,58,.12);color:#1a7a3a;border:1px solid rgba(26,122,58,.3);border-radius:3px;cursor:pointer;font-size:11px">接受停战</button>
      <button onclick="rejectPeaceOffer('${from}')" style="padding:6px 18px;background:rgba(192,48,48,.1);color:#c03030;border:1px solid rgba(192,48,48,.25);border-radius:3px;cursor:pointer;font-size:11px">拒绝，继续征战</button>
    </div>`;
  modal.style.display = 'flex';
}

// ════════════════════════════════════════════════════════════════════
// ── R4.6.c 屠城/安民弹窗 (v181 L1279-L1300) ──
// ════════════════════════════════════════════════════════════════════

/** ★ v151: 屠城/安民弹窗（玩家用） */
function showSiegeAftermathChoice(cityId, atkFac){
  const city = G.cities[cityId];
  if(!city) return;
  let html = `<div style="padding:12px 4px;text-align:center">
    <div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:14px">如何处置此城？</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">`;
  Object.entries(SIEGE_AFTERMATH).forEach(([id, opt]) => {
    const col = id==='pacify'?'#1a7a3a':id==='loot'?'#8a6a10':'#c03030';
    const bgCol = id==='pacify'?'rgba(26,122,58,.08)':id==='loot'?'rgba(138,106,16,.08)':'rgba(192,48,48,.08)';
    const borderCol = id==='pacify'?'rgba(26,122,58,.25)':id==='loot'?'rgba(138,106,16,.25)':'rgba(192,48,48,.25)';
    html += `<button onclick="_onSiegeAftermath('${cityId}','${atkFac}','${id}')"
      style="padding:8px 14px;background:${bgCol};color:${col};border:1px solid ${borderCol};border-radius:3px;cursor:pointer;font-size:11px;min-width:70px;text-align:center">
      <div style="font-weight:600">${opt.label}</div>
      <div style="font-size:8px;margin-top:3px;color:rgba(92,74,50,.5)">${opt.desc}</div>
    </button>`;
  });
  html += `</div></div>`;
  document.getElementById('genericModalTitle').textContent = '⚔ 攻克' + city.name;
  document.getElementById('genericModalBody').innerHTML = html;
  document.getElementById('genericModal').style.display = 'flex';
}

// ════════════════════════════════════════════════════════════════════
// ── R4.6.d 附庸弹窗 (v181 L1307-L1338) ──
// ════════════════════════════════════════════════════════════════════

function showDiploVassal(offer){
  const { vassal, suzerain, type } = offer;
  const isPlayerSuzerain = suzerain === G.playerFac;
  const facColor = FAC[isPlayerSuzerain ? vassal : suzerain]?.color || '#6b5530';
  const title    = isPlayerSuzerain
    ? `${FAC[vassal]?.name}请求称臣`
    : `${FAC[suzerain]?.name}要求${FAC[vassal]?.name}称臣`;
  // ★ v181 #5: 纳贡比例按宗主 stage 动态显示
  const _tr = getTributeRates(suzerain);
  const _trText = (_tr.gold === 0 && _tr.food === 0)
    ? '仅名义臣属·无纳贡'
    : `金${Math.round(_tr.gold*100)}%·粮${Math.round(_tr.food*100)}%/旬`;
  const body = isPlayerSuzerain
    ? `<p style="font-size:11px;color:rgba(44,36,22,.65);line-height:1.8">${FAC[vassal]?.full}国力衰微，愿奉${FAC[suzerain]?.full}为宗主（${_trText}），换取庇护。</p>`
    : `<p style="font-size:11px;color:rgba(44,36,22,.65);line-height:1.8">${FAC[suzerain]?.full}势力强横，迫使${FAC[vassal]?.full}称臣纳贡（${_trText}）。</p>`;
  const modal = document.getElementById('modal');
  document.getElementById('modalBody').innerHTML =
    `<div style="padding:12px 4px;text-align:center">
      <div style="font-size:13px;font-family:'Noto Serif SC',serif;color:${facColor};margin-bottom:10px">🏳 ${title}</div>
      ${body}
      ${isPlayerSuzerain
        ? `<div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
            <button onclick="acceptVassalOffer('${vassal}','${suzerain}');closeModal()" style="padding:6px 18px;background:rgba(26,122,58,.1);color:#1a7a3a;border:1px solid rgba(26,122,58,.25);border-radius:3px;cursor:pointer;font-size:11px">纳为附庸</button>
            <button onclick="rejectVassalOffer('${vassal}','${suzerain}');closeModal()" style="padding:6px 18px;background:rgba(192,48,48,.08);color:#c03030;border:1px solid rgba(192,48,48,.2);border-radius:3px;cursor:pointer;font-size:11px">拒绝</button>
           </div>`
        : `<div style="margin-top:12px">
            <button onclick="closeModal();_checkPendingCourtAfterPopup()" style="padding:6px 18px;background:rgba(80,65,40,.14);color:rgba(92,74,50,.7);border:1px solid rgba(80,65,40,.18);border-radius:3px;cursor:pointer;font-size:11px">知晓</button>
           </div>`
      }
    </div>`;
  modal.style.display = 'flex';
}
