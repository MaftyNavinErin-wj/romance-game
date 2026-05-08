// src/render/tabs.js
//
// 渲染层(R)— 8 tab 渲染 + renderRight 容器 + tab 系统 UTILS.
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.8)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// 8 tab 渲染 + renderRight 主容器是 v181 桶 3 渲染层最大单 cluster.
// 主 block 7 tabs + renderRight 在 L1432-L2862 连续 1431 行无杂质;
// renderMilTab 因历史原因散在 L8326(战斗 modals/anim 之后),独立 70 行;
// 邻接 UTILS section(selCity/selFac/switchTab/updateTabs)是 tab 系统切换入口,逻辑同组,一并抽.
//
// ── 抽离范围(3 段)──
//   R4.8.a 主 tab block (7 tabs + renderRight + 6 内部 helper)  v181 L1432-L2862  (1431 行)
//                                                8 主渲染:
//                                                  renderTechTab / renderStatsTab /
//                                                  renderPostTab / renderRight /
//                                                  renderFactionTab / renderDipTab /
//                                                  renderSchemeTab / renderEthosTab
//                                                6 内部 helper(贴 tab 函数,verbatim 一并抽):
//                                                  openTechResearchPicker / confirmTechResearch
//                                                    (Tech tab 选研究 modal)
//                                                  getCourtStatusText / _buildCourtNarrative /
//                                                  _buildCourtWarnings / _buildCourtVacancies
//                                                    (Post tab 朝堂状态文本生成)
//   R4.8.b UTILS section                                        v181 L2864-L2872  (9 行)
//                                                selCity / selFac / switchTab / updateTabs
//   R4.8.c renderMilTab                                         v181 L8326-L8395  (70 行,孤悬位置)
//
// 函数总数: 14 + 4 + 1 = **19 函数**(scout grep 漏列 6 helper, codex review trial 1 catch, P2 metadata 已修)
//
// ── 加载顺序约束 ──
// 必须在以下文件之后加载(直读 G + 调用其中函数):
//   src/core/state.js        (G state)
//   src/data/*               (constants / generals / cities / factions)
//   src/core/helpers.js      (fmt / 各类 calc helper)
//   src/core/map.js          (renderMap helper)
//   src/chains/*             (各 chain helper, e.g. military.js getUnitTroops/calcUnitAP)
//   src/render/tooltips.js   (_tabHelpHtml 等 tooltip helper)
//   src/render/map_render.js (renderUnitDetail / renderMap)
//   src/render/overlay.js    (renderOverlay 等)
//
// 必须在以下加载之前 / 平级:
//   v181 inline (renderLeft / renderAll 等仍在 v181)
//

// ═══════════════════════════════════════════════════════
// R4.8.a 主 tab block (7 tabs + renderRight) — v181 L1432-L2862
// ═══════════════════════════════════════════════════════

function renderTechTab(c) {
  const fid = G.playerFac;
  const tech = G.factions[fid]?._tech;
  if (!tech) { c.innerHTML = '<div style="padding:12px;color:rgba(92,74,50,.55)">科技系统未初始化</div>'; return; }

  const cur = tech.current;
  const available = getAvailableTechs(fid);
  const branches = ['经济','军事','练兵','政治','民生'];
  const branchIcons = {'经济':'💰','军事':'⚔','练兵':'🏋','政治':'📋','民生':'🏘'};
  const branchStats = {'经济':'INT','军事':'COM','练兵':'WAR','政治':'CHA','民生':'POL'};

  // 获取闲置武将列表（用于选择研究武将）
  const deployed = new Set();
  G.units.filter(u => u.fac === fid).forEach(u => u.squads.forEach(sq => deployed.add(sq.genName)));
  const prefects = new Set(Object.values(G.cities).filter(c2 => c2.fac === fid && c2.prefect).map(c2 => c2.prefect));
  const researchingGen = cur ? cur.genName : null;
  const idleGens = (G.generals[fid] || []).filter(g =>
    g.role !== 'ruler' && !deployed.has(g.name) && !prefects.has(g.name) && g.name !== researchingGen
  );

  let html = `<div class="sec">科技总览 ${_tabHelpHtml('tech')}</div>`;

  // ── 当前研究进度 ──
  if (cur) {
    const def = TECH_TREE[cur.techId];
    const pct = Math.round(((cur.turnsTotal - cur.turnsLeft) / cur.turnsTotal) * 100);
    const gen = GEN_MAP[cur.genName];
    html += `<div class="sec">当前研究</div>
      <div style="padding:8px 10px;background:rgba(100,180,255,.06);border:1px solid rgba(100,180,255,.2);border-radius:4px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;color:rgba(44,36,22,.85)">${def?.icon||'🔬'} ${def?.name||'?'}</span>
          <span style="font-size:9px;color:rgba(100,180,255,.7)">${def?.branch||''}</span>
        </div>
        <div style="font-size:9px;color:rgba(92,74,50,.55);margin:3px 0">${def?.desc||''}</div>
        <div style="background:rgba(80,65,40,.10);height:8px;border-radius:4px;overflow:hidden;margin:4px 0">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,rgba(100,180,255,.5),rgba(100,180,255,.8));border-radius:4px;transition:width .3s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(92,74,50,.40)">
          <span>主持：${cur.genName}${gen?' ('+branchStats[def?.branch]+gen[def?.stat]||''+')':''}</span>
          <span>剩余 ${cur.turnsLeft} 旬（${pct}%）</span>
        </div>
      </div>`;
  } else {
    html += `<div class="sec">当前研究</div>
      <div style="padding:8px 10px;font-size:10px;color:rgba(92,74,50,.35);text-align:center">
        — 无进行中的研究 —
      </div>`;
  }

  // ── 五大分支 ──
  branches.forEach(branch => {
    const branchTechs = Object.entries(TECH_TREE).filter(([, d]) => d.branch === branch);
    const researchedCount = branchTechs.filter(([tid]) => tech.researched.has(tid)).length;
    html += `<div class="sec" style="margin-top:6px">${branchIcons[branch]} ${branch}（${researchedCount}/${branchTechs.length}）<span style="float:right;font-size:8px;color:rgba(92,74,50,.35)">${branchStats[branch]}</span></div>`;

    branchTechs.forEach(([tid, def]) => {
      const isResearched = tech.researched.has(tid);
      const isAvailable = available.includes(tid);
      const isCurrent = cur && cur.techId === tid;
      const canAfford = isAvailable && canAffordTech(fid, tid);
      const prereqMet = def.prereq.every(p => tech.researched.has(p));
      const locked = !isResearched && !prereqMet;

      // 颜色和状态
      let bg, border, nameCol, statusText, statusCol, descCol, leftBar;
      if (isResearched) {
        bg = 'rgba(26,122,58,.04)'; border = 'rgba(26,122,58,.18)'; nameCol = '#1a7a3a'; statusText = '✅ 已研发';
        statusCol = 'rgba(26,122,58,.5)'; descCol = 'rgba(92,74,50,.45)'; leftBar = '#1a7a3a';
      } else if (isCurrent) {
        bg = 'rgba(100,180,255,.08)'; border = 'rgba(100,180,255,.35)'; nameCol = '#2a6fa8'; statusText = `🔬 研究中（${cur.turnsLeft}旬）`;
        statusCol = '#64b4ff'; descCol = 'rgba(44,36,22,.55)'; leftBar = '#64b4ff';
      } else if (isAvailable && canAfford && !cur) {
        bg = 'rgba(138,112,64,.08)'; border = 'rgba(138,112,64,.35)'; nameCol = 'rgba(44,36,22,.9)'; statusText = '◆ 可研究';
        statusCol = '#8a7040'; descCol = 'rgba(44,36,22,.6)'; leftBar = '#8a7040';
      } else if (isAvailable && !canAfford) {
        bg = 'rgba(80,65,40,.03)'; border = 'rgba(80,65,40,.12)'; nameCol = 'rgba(60,50,35,.55)'; statusText = '资源不足';
        statusCol = '#b04040'; descCol = 'rgba(92,74,50,.4)'; leftBar = 'rgba(80,65,40,.15)';
      } else {
        bg = 'rgba(80,65,40,.02)'; border = 'rgba(80,65,40,.08)'; nameCol = 'rgba(80,65,40,.4)'; statusText = '🔒 未解锁';
        statusCol = 'rgba(80,65,40,.25)'; descCol = 'rgba(92,74,50,.35)'; leftBar = 'rgba(80,65,40,.08)';
      }

      // 费用文本
      const costText = Object.entries(def.cost).map(([r, v]) => {
        const icons = {gold:'💰',wood:'🪵',iron:'⚒',horses:'🐴'};
        const has = (G.factions[fid]?.res?.[r] || 0) >= v;
        return `<span style="color:${has?'rgba(92,74,50,.5)':'#b04040'}">${icons[r]||r}${v}</span>`;
      }).join(' ');

      // 点击研究
      const canClick = isAvailable && canAfford && !cur && !isResearched && idleGens.length > 0;

      html += `<div style="padding:5px 8px 5px 11px;margin:2px 0;background:${bg};border:1px solid ${border};border-left:3px solid ${leftBar};border-radius:3px;${canClick?'cursor:pointer':''};transition:background .15s"
        ${canClick ? `onclick="openTechResearchPicker('${tid}')" onmouseover="this.style.background='rgba(138,112,64,.12)'" onmouseout="this.style.background='${bg}'"` : ''}>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:${nameCol};font-size:10px;font-weight:600">${def.icon} ${def.name}</span>
          <span style="font-size:8px;color:${statusCol}">${statusText}</span>
        </div>
        <div style="font-size:8px;color:${descCol};margin-top:1px">${def.desc} · ${def.turns}旬 · ${costText}</div>
        ${locked ? `<div style="font-size:8px;margin-top:2px">前置：${def.prereq.map(p => {
          const pd = TECH_TREE[p];
          const done = tech.researched.has(p);
          return '<span style="color:'+(done?'#50d070':'#b04040')+'">'+(pd?.icon||'')+' '+(pd?.name||p)+(done?' ✓':' ✗')+'</span>';
        }).join(' + ')}</div>` : ''}
      </div>`;
    });
  });

  // ── 闲置武将提示 ──
  if (!cur && idleGens.length === 0) {
    html += `<div style="padding:8px;font-size:9px;color:#8a6a10;text-align:center;margin-top:6px">
      ⚠ 无闲置武将可主持研究（需非出征、非太守的武将）
    </div>`;
  }

  c.innerHTML = html;
}

// 科技研究武将选择弹窗
function openTechResearchPicker(techId) {
  const fid = G.playerFac;
  const def = TECH_TREE[techId];
  if (!def) return;
  if (!canAffordTech(fid, techId)) { showNotif('资源不足', 'warn'); return; }
  if (G.factions[fid]?._tech?.current) { showNotif('已有研究进行中', 'warn'); return; }

  const deployed = new Set();
  G.units.filter(u => u.fac === fid).forEach(u => u.squads.forEach(sq => deployed.add(sq.genName)));
  const prefects = new Set(Object.values(G.cities).filter(c => c.fac === fid && c.prefect).map(c => c.prefect));

  const candidates = (G.generals[fid] || []).filter(g =>
    g.role !== 'ruler' && !deployed.has(g.name) && !prefects.has(g.name)
  ).sort((a, b) => (b[def.stat] || 0) - (a[def.stat] || 0));

  if (!candidates.length) { showNotif('无闲置武将可主持研究', 'warn'); return; }

  const statLabel = {com:'统率',war:'武力',int:'智力',pol:'政治',cha:'魅力'}[def.stat] || def.stat;
  const costText = Object.entries(def.cost).map(([r, v]) => {
    const names = {gold:'金',wood:'木',iron:'铁',horses:'马'};
    return `${names[r]||r}${v}`;
  }).join('·');

  const body = candidates.map(g => {
    const statVal = g[def.stat] || 0;
    return `<div onclick="confirmTechResearch('${techId}','${g.name}')" style="cursor:pointer;padding:6px 10px;border-bottom:1px solid rgba(80,65,40,.06);display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background='rgba(80,65,40,.05)'" onmouseout="this.style.background='none'">
      <div>
        <span style="color:rgba(44,36,22,.8);font-weight:600">${g.name}</span>
        <span style="font-size:9px;color:rgba(92,74,50,.40);margin-left:4px">${statLabel}${statVal}</span>
      </div>
      <span style="font-size:9px;color:rgba(92,74,50,.35)">经验+${def.expReward}</span>
    </div>`;
  }).join('');

  const el = document.getElementById('genericModal');
  document.getElementById('genericModalTitle').textContent = `${def.icon} 研究${def.name}`;
  document.getElementById('genericModalBody').innerHTML = `
    <div style="padding:6px 12px;font-size:9px;color:rgba(92,74,50,.45)">
      ${def.desc} · ${def.turns}旬 · ${costText}<br>
      选择主持武将（研究期间不可出征/任太守，完成后${statLabel}+${def.expReward}经验）
    </div>
    ${body}`;
  el.style.display = 'flex';
}

function confirmTechResearch(techId, genName) {
  closeModal();
  const ok = startTechResearch(G.playerFac, techId, genName);
  if (ok) {
    const def = TECH_TREE[techId];
    showNotif(`开始研究${def?.name||techId}（${genName}主持，${def?.turns}旬）`, 'info');
    renderAllLight();
  } else {
    showNotif('研究启动失败', 'warn');
  }
}

function renderStatsTab(c){
  const FAC_COL={wei:'#1a5f8a',shu:'#1a7a3a',wu:'#a82a1a',nanman:'#8b6914'};
  const FAC_NAME={wei:'魏',shu:'蜀',wu:'吴',nanman:'蛮'};
  const h=_statsHistory;

  // ── 当前快照 ──
  const now=ALL_FACS.map(fid=>{
    const fc=Object.values(G.cities).filter(x=>x.fac===fid);
    const ut=G.units.filter(u=>u.fac===fid);
    const pop=fc.reduce((s,x)=>s+x.pop,0);
    const troops=fc.reduce((s,x)=>s+x.garrison,0)+ut.reduce((s,u)=>s+getUnitTroops(u),0);
    const gold=Math.round(G.factions[fid]?.res.gold||0);
    const cities=fc.length;
    const food=fc.reduce((s,x)=>s+x.storage,0);
    const morale=fc.length?Math.round(fc.reduce((s,x)=>s+x.morale,0)/fc.length):0;
    return {fid,pop,troops,gold,cities,food,morale};
  });

  // ── SVG 折线图生成器 ──
  function sparkline(key, maxOverride){
    if(h.length<2) return '<div style="color:var(--ink-ll);font-size:9px;text-align:center;padding:8px">暂无数据</div>';
    const W=240,H=56,pad=6;
    const iw=W-pad*2, ih=H-pad*2;
    const allVals=h.flatMap(s=>ALL_FACS.map(f=>s[f]?.[key]||0));
    const maxV=maxOverride||Math.max(...allVals,1);
    const lines=ALL_FACS.map(fid=>{
      const pts=h.map((s,i)=>{
        const v=s[fid]?.[key]||0;
        const x=pad+i/(h.length-1)*iw;
        const y=pad+ih-(v/maxV)*ih;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      const last=h[h.length-1];
      const lv=last[fid]?.[key]||0;
      const lx=(pad+iw).toFixed(1);
      const ly=(pad+ih-(lv/maxV)*ih).toFixed(1);
      return `<polyline points="${pts}" fill="none" stroke="${FAC_COL[fid]}" stroke-width="1.5" stroke-opacity="0.8"/>
        <circle cx="${lx}" cy="${ly}" r="2.5" fill="${FAC_COL[fid]}"/>`;
    }).join('');
    return `<svg width="${W}" height="${H}" style="display:block">
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${pad+ih}" stroke="rgba(80,65,40,.12)" stroke-width="0.5"/>
      <line x1="${pad}" y1="${pad+ih}" x2="${pad+iw}" y2="${pad+ih}" stroke="rgba(80,65,40,.12)" stroke-width="0.5"/>
      ${lines}</svg>`;
  }

  // ── 城池归属比例条 ──
  const totalCities=CITIES_DEF.length;
  const barHtml=ALL_FACS.map(fid=>{
    const cnt=Object.values(G.cities).filter(x=>x.fac===fid).length;
    const pct=(cnt/totalCities*100).toFixed(1);
    return `<div style="flex:${cnt};background:${FAC_COL[fid]};height:8px;transition:flex .5s" title="${FAC_NAME[fid]} ${cnt}城"></div>`;
  }).join('');

  // ── 势力总览卡 ──
  const cardsHtml=now.map(({fid,pop,troops,gold,cities,food,morale})=>{
    const col=FAC_COL[fid];
    const fmtN=n=>n>=10000?(n/10000).toFixed(1)+'万':n.toLocaleString();
    const delta=h.length>=2?(h[h.length-1][fid]?.cities||0)-(h[0][fid]?.cities||0):0;
    const deltaStr=delta>0?`<span style="color:#1a7a3a">+${delta}</span>`:delta<0?`<span style="color:#c03030">${delta}</span>`:'';
    return `<div style="background:rgba(255,252,245,.5);border:1px solid ${col}30;border-radius:6px;padding:10px 12px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,${col},transparent)"></div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <div style="width:7px;height:7px;border-radius:50%;background:${col}"></div>
        <span style="color:${col};font-weight:700;font-size:13px;letter-spacing:2px">${FAC_NAME[fid]}</span>
        <span style="color:var(--ink-ll);font-size:10px;margin-left:auto">${cities}城 ${deltaStr}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:10px">
        <div style="background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.08);border-radius:3px;padding:5px 7px">
          <div style="color:var(--ink-ll);font-size:8px;margin-bottom:2px">人口</div>
          <div style="color:var(--ink);font-weight:700">${fmtN(pop)}</div>
        </div>
        <div style="background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.08);border-radius:3px;padding:5px 7px">
          <div style="color:var(--ink-ll);font-size:8px;margin-bottom:2px">兵力</div>
          <div style="color:${col};font-weight:700">${fmtN(troops)}</div>
        </div>
        <div style="background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.08);border-radius:3px;padding:5px 7px">
          <div style="color:var(--ink-ll);font-size:8px;margin-bottom:2px">金钱</div>
          <div style="color:#8a6a10;font-weight:700">${fmtN(gold)}</div>
        </div>
        <div style="background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.08);border-radius:3px;padding:5px 7px">
          <div style="color:var(--ink-ll);font-size:8px;margin-bottom:2px">民心均值</div>
          <div style="color:${morale>60?'#1a7a3a':morale>40?'#8a6a10':'#c03030'};font-weight:700">${morale}%</div>
        </div>
      </div>
    </div>`;
  }).join('');

  // ── 折线图面板 ──
  const chartSec=(label,key,unit='')=>`
    <div style="background:rgba(255,252,245,.4);border:1px solid rgba(80,65,40,.08);border-radius:6px;padding:10px 12px;margin-bottom:8px">
      <div style="font-size:9px;color:var(--ink-ll);margin-bottom:6px;display:flex;align-items:center;gap:8px">
        ${label}
        <span style="margin-left:auto;display:flex;gap:10px">
          ${ALL_FACS.map(f=>`<span style="color:${FAC_COL[f]}">${FAC_NAME[f]}</span>`).join('')}
        </span>
      </div>
      ${sparkline(key)}
    </div>`;

  const yearStr=YEARS[G.year]||`第${G.year+1}年`;
  const season=SEASONS[G.seasonIdx];

  c.innerHTML=`
    <div class="sec" style="margin-bottom:6px">势力统计 ${_tabHelpHtml('stats')}</div>
    <div style="display:flex;align-items:center;margin-bottom:6px;gap:6px;flex-wrap:wrap">
      <div style="font-size:10px;color:var(--ink-ll);letter-spacing:2px;flex:1;min-width:120px">${yearStr} · ${season}季 · 第${G.turn}旬</div>
      <select id="ffSelect" onchange="_ffTurns=+this.value"
        style="padding:3px 5px;font-size:10px;background:rgba(245,238,225,.95);
          border:1px solid rgba(80,65,40,0.2);color:var(--ink);
          border-radius:4px;font-family:inherit">
        <option value="5" ${_ffTurns===5?'selected':''}>5旬</option>
        <option value="10" ${_ffTurns===10?'selected':''}>10旬</option>
        <option value="20" ${_ffTurns===20?'selected':''}>20旬</option>
        <option value="40" ${_ffTurns===40?'selected':''}>40旬</option>
        <option value="100" ${_ffTurns===100?'selected':''}>100旬</option>
        <option value="360" ${_ffTurns===360?'selected':''}>360旬</option>
      </select>
      <button id="btnFastForward"
        onclick="fastForwardTurns(_ffTurns)"
        style="padding:3px 10px;font-size:10px;background:rgba(80,65,40,0.08);
          border:1px solid rgba(80,65,40,0.2);color:var(--ink);
          border-radius:4px;cursor:pointer;font-family:inherit">⏩ 快进</button>
      <button onclick="if(confirm('返回主菜单？未保存的进度将丢失。'))backToTitle()"
        style="padding:3px 8px;font-size:10px;background:rgba(192,48,48,.08);
          border:1px solid rgba(192,48,48,.25);color:rgba(192,48,48,.6);
          border-radius:4px;cursor:pointer;font-family:inherit">↻ 主菜单</button>
      <button onclick="fastForwardTurns(360).then(()=>runIntegrityAudit())"
        style="padding:3px 8px;font-size:10px;background:rgba(26,90,138,.08);
          border:1px solid rgba(26,90,138,.25);color:rgba(26,90,138,.6);
          border-radius:4px;cursor:pointer;font-family:inherit">🔍 压测360旬</button>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding:5px 8px;background:rgba(255,252,245,.4);border-radius:4px;border:1px solid rgba(80,65,40,.08)">
      <span style="font-size:9px;color:var(--ink-ll);flex:1">⚔ 叫阵默认</span>
      <button onclick="G.autoDuelMode='none';renderRight()"
        style="padding:2px 8px;font-size:9px;border-radius:3px;cursor:pointer;font-family:inherit;
          background:${G.autoDuelMode==='none'?'rgba(80,65,40,.18)':'rgba(80,65,40,.04)'};
          border:1px solid ${G.autoDuelMode==='none'?'rgba(80,65,40,.35)':'rgba(80,65,40,.10)'};
          color:${G.autoDuelMode==='none'?'rgba(44,36,22,.85)':'rgba(44,36,22,.35)'}">
        不叫阵
      </button>
      <button onclick="G.autoDuelMode='best';renderRight()"
        style="padding:2px 8px;font-size:9px;border-radius:3px;cursor:pointer;font-family:inherit;
          background:${G.autoDuelMode==='best'?'rgba(80,65,40,.18)':'rgba(80,65,40,.04)'};
          border:1px solid ${G.autoDuelMode==='best'?'rgba(80,65,40,.35)':'rgba(80,65,40,.10)'};
          color:${G.autoDuelMode==='best'?'rgba(44,36,22,.85)':'rgba(44,36,22,.35)'}">
        最高勇武自动叫阵
      </button>
    </div>

    <div style="display:flex;border-radius:4px;overflow:hidden;margin-bottom:10px;height:8px">${barHtml}</div>
    <div style="display:flex;gap:12px;font-size:9px;color:rgba(44,36,22,.35);margin-bottom:12px">
      ${ALL_FACS.map(fid=>{
        const cnt=Object.values(G.cities).filter(x=>x.fac===fid).length;
        return `<span style="color:${FAC_COL[fid]}">${FAC_NAME[fid]} ${cnt}城 (${(cnt/totalCities*100).toFixed(0)}%)</span>`;
      }).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      ${cardsHtml}
    </div>

    ${h.length>=2?`
    <div style="font-size:9px;color:var(--ink-ll);margin-bottom:8px">近 ${h.length} 旬走势</div>
    ${chartSec('人口走势','pop')}
    ${chartSec('兵力走势','troops')}
    ${chartSec('金钱走势','gold')}
    ${chartSec('城池数走势','cities')}
    `:'<div style="color:var(--ink-ll);font-size:10px;text-align:center;padding:20px">推进旬数后显示走势图</div>'}
  `;
}

// ═══════════════════════════════════════
// D1 官职Tab
// ═══════════════════════════════════════
function renderPostTab(c){
  const fid = G.playerFac;
  const fd = FAC[fid];
  const slots = getPostSlots(fid);
  const posts = getFacPosts(fid);
  const buffs = calcPostBuffs(fid);
  // ★ I3: 合并朝议decree buff，让汇总显示完整效果
  const _decBuf = getCourtDecreeBuffs(fid);
  Object.keys(_decBuf).forEach(k => { if(buffs.hasOwnProperty(k)) buffs[k] += _decBuf[k]; });
  const salary = calcPostSalary(fid);

  function renderTrack(track, label, icon, tierDefs, slotArr){
    let html = `<div style="font-size:11px;color:rgba(92,74,50,.65);margin:10px 0 6px;font-weight:600;font-family:'Noto Serif SC',serif;border-bottom:1px solid rgba(80,65,40,.12);padding-bottom:4px">${icon} ${label}</div>`;
    [1,2,3].forEach(tier=>{
      const maxSlots = slotArr[3-tier];
      const tierLabel = tier===1 ? '一品' : tier===2 ? '二品' : '三品';
      // ★ v181: tier1 名额为 0 时仍渲染"未解锁"提示，而非整行消失（让玩家明确知道为什么没法任命）
      if(maxSlots <= 0){
        if(tier === 1){
          html += `<div style="font-size:8px;color:rgba(92,74,50,.35);margin:6px 0 3px;letter-spacing:1px">${tierLabel}</div>`;
          html += `<div style="padding:6px 8px;margin-bottom:4px;background:rgba(245,240,228,.3);border:1px dashed rgba(80,65,40,.10);border-radius:3px;font-size:9px;color:rgba(92,74,50,.40);text-align:center">未解锁 · 需达成「政权」阶段</div>`;
        }
        return;
      }
      html += `<div style="font-size:8px;color:rgba(92,74,50,.35);margin:6px 0 3px;letter-spacing:1px">${tierLabel}</div>`;
      const defs = tierDefs['tier'+tier] || [];
      const filled = posts.filter(({postDef:p})=>p.track===track && p.tier===tier);
      const filledNames = new Set(filled.map(f=>f.postDef.name));
      filled.forEach(({genName, postDef})=>{
        const gen = (G.generals[fid]||[]).find(g=>g.name===genName);
        const statVal = postDef.buffStat==='com' ? (gen?.com||60) : (gen?.pol||60);
        const merit = Math.floor(G.genMerit[genName]||0);
        const buffLine = postDef.buffDesc
          ? `<div style="font-size:8px;color:#6b5530;margin-top:2px">${postDef.buffDesc} <span style="color:rgba(92,74,50,.40)">(×${(statVal/100).toFixed(2)})</span></div>`
          : '';
        html += `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;margin-bottom:4px;background:rgba(255,252,245,.5);border:1px solid rgba(92,74,50,.28);border-radius:3px;cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(80,65,40,.06)'" onmouseout="this.style.background='rgba(255,252,245,.5)'" onclick="openPostAction('${genName}','${fid}')">
          <div style="min-width:50px">
            <div style="font-size:11px;color:var(--ink-l);font-family:'Noto Serif SC',serif">${postDef.name}</div>
            <div style="font-size:7px;color:rgba(92,74,50,.35);margin-top:1px">忠+${postDef.loyalty}/旬</div>
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:11px;color:${fd.color};font-family:'Noto Serif SC',serif">${genName}</span>
              <span style="font-size:8px;color:rgba(92,74,50,.35)">功${merit} | ${postDef.buffStat==='com'?'统':'政'}${statVal}</span>
            </div>
            ${buffLine}
          </div>
          <div style="font-size:8px;color:rgba(80,65,40,.15);white-space:nowrap">${postDef.salary}金/旬</div>
        </div>`;
      });
      const emptyCount = maxSlots - filled.length;
      for(let i=0; i<emptyCount; i++){
        const availDef = defs.find(d=>!filledNames.has(d.name));
        const postName = availDef ? availDef.name : defs[i%defs.length]?.name || '?';
        const meritReq = availDef ? availDef.merit : 0;
        const buffDesc = availDef?.buffDesc || '';
        html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;background:rgba(245,240,228,.5);border:1px dashed rgba(80,65,40,.12);border-radius:3px;cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(80,65,40,.05)'" onmouseout="this.style.background='rgba(245,240,228,.5)'" onclick="openPostAppoint('${postName}','${fid}')">
          <div style="min-width:50px">
            <div style="font-size:11px;color:rgba(92,74,50,.35);font-family:'Noto Serif SC',serif">${postName}</div>
          </div>
          <div style="flex:1">
            <span style="font-size:9px;color:rgba(80,65,40,.12)">空缺 · 功绩≥${meritReq}</span>
            ${buffDesc ? `<div style="font-size:7px;color:rgba(80,65,40,.10);margin-top:1px">${buffDesc}</div>` : ''}
          </div>
          <div style="font-size:9px;color:rgba(80,65,40,.10)">点击任命</div>
        </div>`;
        filledNames.add(postName);
      }
    });
    return html;
  }

  // buff汇总
  const buffEntries = [];
  if(buffs.goldProd) buffEntries.push(`金+${(buffs.goldProd*100).toFixed(1)}%`);
  if(buffs.foodProd) buffEntries.push(`粮+${(buffs.foodProd*100).toFixed(1)}%`);
  if(buffs.recruitCost) buffEntries.push(`征兵${(buffs.recruitCost*100).toFixed(0)}%`);
  if(buffs.reinforce) buffEntries.push(`补员+${(buffs.reinforce*100).toFixed(0)}%`);
  if(buffs.upkeep) buffEntries.push(`维护${(buffs.upkeep*100).toFixed(0)}%`);
  if(buffs.foodCost) buffEntries.push(`粮耗${(buffs.foodCost*100).toFixed(0)}%`);
  if(buffs.morale) buffEntries.push(`民心+${buffs.morale.toFixed(2)}/旬`);
  if(buffs.buildSpeed) buffEntries.push(`建设+${(buffs.buildSpeed*100).toFixed(0)}%`);
  if(buffs.stratRate) buffEntries.push(`计谋+${(buffs.stratRate*100).toFixed(0)}%`);
  if(buffs.giftEffect) buffEntries.push(`送礼+${(buffs.giftEffect*100).toFixed(0)}%`);
  if(buffs.expGain) buffEntries.push(`经验+${(buffs.expGain*100).toFixed(0)}%`);
  const buffStr = buffEntries.length ? buffEntries.join('  ') : '无';

  const totalSlots = slots.mil[0]+slots.mil[1]+slots.mil[2]+slots.civ[0]+slots.civ[1]+slots.civ[2];

  // ★ v181: 档位进度条 — 拆为「势力规模」+「政权阶段」两条独立显示
  const cityCount = Object.values(G.cities).filter(cc=>cc.fac===fid).length;
  const curTier = getFacPostTier(fid);
  const stage = getStage(fid);
  const stageLabel = STAGE_NAMES[stage] || stage;
  const stageColor = getStageColor(stage);
  const capLabel = STAGE_LABEL_CAP[stage] || '王';
  // 城市数指向的"原始档"（不受 stage 卡）
  const rawCityTier = POST_TIERS.find(t=>cityCount>=t.minCities) || POST_TIERS[POST_TIERS.length-1];
  // ★ v181 fix: 区分 cap（城市数高过 stage 上限，限制性提示）和 floor（城市数低于 stage 下限，有利提示）
  const rawCityIdx = POST_TIERS.indexOf(rawCityTier);
  const curIdx     = POST_TIERS.indexOf(curTier);
  const stageCapped = curIdx > rawCityIdx; // cur label 比 rawCity 低（idx 大）→ 被 cap 卡下来；floor 情况不需要变量，直接看 !stageCapped 即可
  const nextTier = curIdx > 0 ? POST_TIERS[curIdx - 1] : null;
  const tierColors = {'王':'#c08040','公':'#6b5530','侯':'#2a7a9a','诸侯':'#888'};
  const t1Slots = STAGE_TIER1_SLOTS[stage] || STAGE_TIER1_SLOTS.warlord;
  const tier1Unlocked = (t1Slots.mil + t1Slots.civ) > 0;
  // 下一档是否被 stage cap 永远锁死
  const capIdx = POST_TIERS.findIndex(t => t.label === capLabel);
  const nextBlockedByStage = nextTier ? POST_TIERS.indexOf(nextTier) < capIdx : false;
  const tierProgressHtml = (() => {
    // ── 第一条：势力规模（label + 城市数 + 下一档需求） ──
    let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span style="font-size:10px;color:rgba(92,74,50,.55)">势力规模</span>
      <span style="font-family:'Noto Serif SC',serif;font-size:12px;color:${tierColors[curTier.label]||'#6b5530'};font-weight:700">${curTier.label}</span>
      <span style="font-size:9px;color:rgba(92,74,50,.35)">（${cityCount}城）</span>
      ${stageCapped ? `<span style="font-size:8px;color:rgba(192,128,64,.7);margin-left:auto">城数已达${rawCityTier.label}级，受【${stageLabel}】阶段限制</span>` : ''}
    </div>`;
    // ★ v181 fix BUG A: 下一档被 stage cap 永远锁死时不显示进度（避免"还差 X 城"误导）
    // ★ v181 fix BUG B: stageCapped 时不显示进度；floor 情况（curIdx<rawCityIdx）正常显示城市数升级路径
    if(nextTier && !stageCapped && !nextBlockedByStage){
      // 正常城市数升级路径
      const need = Math.max(0, nextTier.minCities - cityCount);
      const pct = Math.min(100, Math.round(cityCount / nextTier.minCities * 100));
      const newMil = nextTier.mil[0]+nextTier.mil[1];
      const newCiv = nextTier.civ[0]+nextTier.civ[1];
      const curMil = curTier.mil[0]+curTier.mil[1];
      const curCiv = curTier.civ[0]+curTier.civ[1];
      html += `<div style="margin-bottom:2px">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
          <span style="font-size:9px;color:rgba(92,74,50,.45)">▸ 下一档</span>
          <span style="font-size:10px;color:${tierColors[nextTier.label]||'#6b5530'};font-family:'Noto Serif SC',serif;font-weight:600">${nextTier.label}</span>
          <span style="font-size:8px;color:rgba(92,74,50,.35)">（需${nextTier.minCities}城，还差${need}城）</span>
        </div>
        <div style="height:4px;background:rgba(80,65,40,.08);border-radius:2px;overflow:hidden;margin-bottom:3px">
          <div style="width:${pct}%;height:100%;background:${tierColors[nextTier.label]||'#6b5530'};transition:width .3s;border-radius:2px"></div>
        </div>
        <div style="font-size:8px;color:rgba(92,74,50,.35);line-height:1.5">
          升级后：武官${curMil}→${newMil}  文官${curCiv}→${newCiv}
        </div>
      </div>`;
    } else if(!nextTier){
      html += `<div style="font-size:8px;color:rgba(192,128,64,.6)">已达最高档位</div>`;
    }
    // stageCapped 或 nextBlockedByStage 时，城市数升级路径无意义，由下方"政权阶段"行接力引导

    // ── 第二条：政权阶段（决定一品官是否解锁） ──
    html += `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding-top:5px;border-top:1px dashed rgba(92,74,50,.15)">
      <span style="font-size:10px;color:rgba(92,74,50,.55)">政权阶段</span>
      <span style="font-family:'Noto Serif SC',serif;font-size:12px;color:${stageColor};font-weight:700">${stageLabel}</span>
      <span style="font-size:9px;color:rgba(92,74,50,.45)">·</span>
      <span style="font-size:9px;color:${tier1Unlocked?'#c08040':'rgba(92,74,50,.40)'}">${tier1Unlocked?'★ 一品官已解锁':'一品官未解锁（需达成「政权」）'}</span>
    </div>`;
    return html;
  })();

  c.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-family:'Noto Serif SC',serif;font-size:13px;color:var(--ink-l);letter-spacing:1px">官职总览 ${_tabHelpHtml('post')}</div>
      <div style="font-size:9px;color:rgba(92,74,50,.40)">${fd.full} · ${slots.label}级 · ${posts.length}/${totalSlots}人</div>
    </div>
    <div style="background:rgba(255,252,245,.45);border:1px solid rgba(92,74,50,.18);border-radius:3px;padding:6px 8px;margin-bottom:10px">
      ${tierProgressHtml}
    </div>
    <div style="background:rgba(255,252,245,.45);border:1px solid rgba(92,74,50,.18);border-radius:3px;padding:6px 8px;margin-bottom:10px">
      <div style="font-size:9px;color:rgba(92,74,50,.55);margin-bottom:3px">势力加成汇总</div>
      <div style="font-size:10px;color:var(--ink-l);line-height:1.6">${buffStr}</div>
      <div style="font-size:8px;color:rgba(92,74,50,.35);margin-top:3px">官俸支出: ${salary}金/旬</div>
    </div>
    ${renderTrack('mil','武官','⚔',MIL_POSTS,slots.mil)}
    ${renderTrack('civ','文官','📜',CIV_POSTS,slots.civ)}
  `;
}

function renderRight(){
  const c=document.getElementById('rightContent');
  if(G.activeTab==='city') renderCityTab(c);
  else if(G.activeTab==='mil') renderMilTab(c);
  else if(G.activeTab==='gen') renderGenTab(c);
  else if(G.activeTab==='post') renderPostTab(c);
  else if(G.activeTab==='stats') renderStatsTab(c);
  else if(G.activeTab==='faction') renderFactionTab(c);
  else if(G.activeTab==='tech') renderTechTab(c);
  else if(G.activeTab==='scheme') renderSchemeTab(c);
  else if(G.activeTab==='ethos') renderEthosTab(c);
  else renderDipTab(c);
}



// 渲染层 R4.4 (官职 + 武将 profile 4 funcs, L2163-L2468) 已抽离到 src/render/gen_profile.js (Phase 4 / sub-session 4.4)

// ════════════════════════════════════════════════════════
// B1 派系政治 Tab UI — ★ v168: 内政概览重构（五区）
// ════════════════════════════════════════════════════════

// ★ v168: 朝堂状态一行摘要（左面板势力卡用）
function getCourtStatusText(fid){
  const inf = calcFactionInfluence(fid);
  const fi = inf.factions, total = inf.total;
  const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');
  if(!gens.length) return {text:'初立未定', cls:'court-warn'};

  const alerts = []; // {text, severity} severity: 2=red 1=yellow
  // ① 最大派系影响力>35%
  let maxFacLabel='', maxFacPct=0;
  FACTION_DEFS.forEach(fd=>{
    const pct = (fi[fd.id]?.influence||0)/total;
    if(pct>maxFacPct){maxFacPct=pct; maxFacLabel=fd.label;}
  });
  if(maxFacPct>0.35) alerts.push({text:`${maxFacLabel}势重`, severity:1});

  // ② 派系≥3人无官 → 边缘化（仅士族/旧阀等有组织派系，排除最大派系）
  let _maxStatusId='',_maxStatusPct=0;
  FACTION_DEFS.forEach(fd=>{const pct=(fi[fd.id]?.influence||0)/total;if(pct>_maxStatusPct){_maxStatusPct=pct;_maxStatusId=fd.id;}});
  FACTION_DEFS.forEach(fd=>{
    if(fd.id==='royalty'||fd.id==='founding'||fd.id==='humble'||fd.id==='newcomer'||fd.id==='defector') return;
    if(fd.id===_maxStatusId) return; // 最大派系不报寒心
    const members = (fi[fd.id]?.gens||[]);
    if(members.length<3) return;
    const noPost = members.filter(n=>!hasAnyPost(n,fid)).length;
    if(noPost>=3) alerts.push({text:`${fd.label}寒心`, severity:1});
  });

  // ③ 忠诚<50（降将/新附忠诚偏低是常态，仅创始/元老/member上报）
  gens.forEach(g=>{
    const loy = G.genLoyalty[g.name]??80;
    const sen = seniority(g.name, fid);
    if(sen==='defector'||sen==='newcomer') return; // 降将/新附不上摘要
    if(loy<40) alerts.push({text:`${g.name}离心`, severity:2});
    else if(loy<50){
      const delta = calcLoyaltyDelta(g.name, fid).total;
      if(delta<-0.2) alerts.push({text:`${g.name}离心`, severity:2});
      else alerts.push({text:`${g.name}不安`, severity:1});
    }
  });

  // ④ 已移除——"渐疏"级别的轻微趋势下降留给派系Tab预警区展示，不上左面板摘要

  if(!alerts.length) return {text:'政通人和', cls:'court-ok'};
  // 去重
  const seen = new Set(); const unique = [];
  alerts.forEach(a=>{if(!seen.has(a.text)){seen.add(a.text);unique.push(a);}});
  // 按severity降序
  unique.sort((a,b)=>b.severity-a.severity);
  const maxSev = unique[0].severity;
  const display = unique.slice(0,3).map(a=>a.text).join(' · ');
  const prefix = maxSev>=2 ? '⚠ ' : '';
  return {text:prefix+display, cls:maxSev>=2?'court-danger':'court-warn'};
}

// ★ v168: 态势摘要——文言叙事（派系Tab第一区）
function _buildCourtNarrative(fid){
  const inf = calcFactionInfluence(fid);
  const fi = inf.factions, total = inf.total;
  const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');
  if(!gens.length) return '草创之初，尚无朝臣可用。';

  const lines = [];
  // 找影响力最大派系
  let maxId='',maxPct=0;
  FACTION_DEFS.forEach(fd=>{
    const pct=(fi[fd.id]?.influence||0)/total;
    if(pct>maxPct){maxPct=pct;maxId=fd.id;}
  });
  if(maxPct>0.30){
    const fd = FACTION_DEFS.find(f=>f.id===maxId);
    const count = (fi[maxId]?.gens||[]).length;
    const postCount = (fi[maxId]?.gens||[]).filter(n=>hasAnyPost(n,fid)).length;
    if(maxPct>0.45) lines.push(`${fd.label}权倾朝野，${count}人据${postCount}席要津。`);
    else if(maxPct>0.35) lines.push(`${fd.label}声势颇隆，${count}人占${postCount}席。`);
    else lines.push(`${fd.label}为朝中主力，${count}人在列。`);
  }

  // 找边缘化派系（排除最大派系——人多官少不是被冷落）
  FACTION_DEFS.forEach(fd=>{
    if(fd.id==='royalty'||fd.id==='founding'||fd.id==='humble'||fd.id==='newcomer'||fd.id==='defector') return;
    if(fd.id===maxId) return;
    const members = fi[fd.id]?.gens||[];
    if(members.length<2) return;
    const noPost = members.filter(n=>!hasAnyPost(n,fid)).length;
    if(noPost>=3){
      // 查对应地区豪族
      const regionId = Object.entries(STATE_TO_GENTRY_FAC||{}).find(([,v])=>v===fd.id)?.[0];
      const regionCities = regionId ? (STATE_CITIES[regionId]||[]) : [];
      const lowGentry = regionCities.filter(cid=>{const c=G.cities[cid];return c&&c.fac===fid&&(c.gentry??50)<40;});
      let line = `${fd.label}${noPost}人赋闲，心渐怨望。`;
      if(lowGentry.length) line = `${fd.label}${noPost}人赋闲，${G.cities[lowGentry[0]]?.name||''}豪右渐离。`;
      lines.push(line);
    }
  });

  // 最不安的武将
  let worstGen='',worstLoy=100,worstDelta=0;
  gens.forEach(g=>{
    const loy=G.genLoyalty[g.name]??80;
    const delta=calcLoyaltyDelta(g.name,fid).total;
    if(loy<worstLoy||(loy===worstLoy&&delta<worstDelta)){
      worstLoy=loy;worstDelta=delta;worstGen=g.name;
    }
  });
  if(worstLoy<55&&worstDelta<-0.1){
    lines.push(`${worstGen}心志不坚，恐生二意。`);
  }

  // 朝议令
  const decrees = (G.courtDecrees||[]).filter(d=>d.fid===fid&&d.expiresAt>G.turn);
  if(decrees.length) lines.push(`朝议令行${decrees.length}道。`);

  if(!lines.length) lines.push('朝堂安宁，内外无虞。');
  return lines.join('');
}

// ★ v168: 矛盾预警（派系Tab第三区）
function _buildCourtWarnings(fid){
  const inf = calcFactionInfluence(fid);
  const fi = inf.factions, total = inf.total;
  const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');
  const warnings = []; // {icon,text,action,cls}

  // 武将离心（红）
  gens.forEach(g=>{
    const loy = G.genLoyalty[g.name]??80;
    const delta = calcLoyaltyDelta(g.name,fid).total;
    if(loy<50 && delta<-0.1){
      const gap = loy - 30; // 距叛逃线(30)还有多少
      const turnsToDefect = (gap>0 && delta<-0.01) ? Math.max(1, Math.ceil(gap/Math.abs(delta))) : (gap<=0 ? 0 : 99);
      const urgency = turnsToDefect<=0 ? '危在旦夕' : turnsToDefect<20 ? `约${turnsToDefect}旬生变` : '渐行渐远';
      warnings.push({icon:'🔴', text:`${g.name}离心 — 忠${loy}，${urgency}`, action:{label:'察看', tab:'gen'}, cls:'cw-red'});
    }
  });

  // 派系边缘化（黄）——仅士族/旧阀等有组织诉求的派系
  // 影响力最大的派系不报"怨望"——他们不是被冷落，是人多官少
  let _maxWarnId='',_maxWarnPct=0;
  FACTION_DEFS.forEach(fd=>{const pct=(fi[fd.id]?.influence||0)/total;if(pct>_maxWarnPct){_maxWarnPct=pct;_maxWarnId=fd.id;}});
  FACTION_DEFS.forEach(fd=>{
    if(fd.id==='royalty'||fd.id==='founding'||fd.id==='humble'||fd.id==='newcomer'||fd.id==='defector') return;
    const members = fi[fd.id]?.gens||[];
    if(members.length<2) return;
    const noPost = members.filter(n=>!hasAnyPost(n,fid)).length;
    const facRatio = (fi[fd.id]?.influence||0)/total;
    // 影响力极低（<10%）且有人——被排挤
    if(facRatio>0 && facRatio<0.05 && members.length>=2){
      warnings.push({icon:'🔴', text:`${fd.label}孤立 — 影响力仅${Math.round(facRatio*100)}%，恐生怨叛`, action:{label:'授官', tab:'post'}, cls:'cw-red'});
    } else if(facRatio>0 && facRatio<0.10 && members.length>=2){
      warnings.push({icon:'🟡', text:`${fd.label}势弱 — 影响力${Math.round(facRatio*100)}%，渐被边缘`, action:{label:'授官', tab:'post'}, cls:'cw-yellow'});
    } else if(noPost>=3 && fd.id !== _maxWarnId){
      // 非最大派系才报"怨望"
      warnings.push({icon:'🟡', text:`${fd.label}怨望 — ${noPost}人无职`, action:{label:'授官', tab:'post'}, cls:'cw-yellow'});
    }
  });

  // 影响力过重（黄）——合并原tensions逻辑
  const defectorRatio = (fi['defector']?.influence||0)/total;
  const newcomerRatio = (fi['newcomer']?.influence||0)/total;
  const warlordRatio  = (fi['warlord_remnant']?.influence||0)/total;
  let maxId='',maxPct=0;
  FACTION_DEFS.forEach(fd=>{const pct=(fi[fd.id]?.influence||0)/total;if(pct>maxPct){maxPct=pct;maxId=fd.id;}});
  if(maxPct>0.35){
    const fd=FACTION_DEFS.find(f=>f.id===maxId);
    warnings.push({icon:'🟡', text:`${fd.label}权重 — 逾${Math.round(maxPct*100)}%，一家独大`, action:{label:'察看', tab:'faction'}, cls:'cw-yellow'});
  }
  if(defectorRatio>0.10) warnings.push({icon:'🟡', text:`降将势涨 — 影响力${Math.round(defectorRatio*100)}%，旧臣不安`, action:{label:'察看', tab:'faction'}, cls:'cw-yellow'});
  if(newcomerRatio>0.15) warnings.push({icon:'🟡', text:`新附过众 — 影响力${Math.round(newcomerRatio*100)}%，元老侧目`, action:{label:'察看', tab:'faction'}, cls:'cw-yellow'});
  if(warlordRatio>0.15) warnings.push({icon:'🟡', text:`旧阀遗族 — 影响力${Math.round(warlordRatio*100)}%，创始受压`, action:{label:'察看', tab:'faction'}, cls:'cw-yellow'});

  return warnings;
}

// ★ v168: 空缺官位 + 无太守城市（派系Tab操作区）
function _buildCourtVacancies(fid){
  const vacancies = [];
  // 官位空缺: slots.mil=[tier3,tier2,tier1] index, used.mil={3:n,2:n,1:n}
  const slots = getPostSlots(fid);
  const used = countPostsByTier(fid);
  const tierMap = [{tier:3,idx:0,label:'三品'},{tier:2,idx:1,label:'二品'},{tier:1,idx:2,label:'一品'}];
  tierMap.forEach(({tier,idx,label})=>{
    const milFree = (slots.mil[idx]||0) - (used.mil[tier]||0);
    const civFree = (slots.civ[idx]||0) - (used.civ[tier]||0);
    if(milFree>0) vacancies.push({text:`${label}武官尚缺${milFree}席`, tab:'post'});
    if(civFree>0) vacancies.push({text:`${label}文官尚缺${civFree}席`, tab:'post'});
  });
  // 无太守城市
  Object.values(G.cities).filter(c=>c.fac===fid&&!c.prefect).forEach(c=>{
    vacancies.push({text:`${c.name}无太守`, tab:'city', cityId:c.id});
  });
  return vacancies;
}
function renderFactionTab(c){
  const fid = G.playerFac;
  const facName = FAC[fid]?.name || fid;
  const inf = calcFactionInfluence(fid);
  const fi = inf.factions;
  const total = inf.total;

  const FACTION_COLORS = {
    founding:          '#e8b84b',
    royalty:           '#c084fc',
    warlord_remnant:   '#f97316',
    noble:             '#d97706',
    gentry_zhongyuan:  '#38bdf8',
    gentry_hebei:      '#2563eb',
    gentry_xuzhou:     '#0ea5e9',
    gentry_jingzhou:   '#4ade80',
    gentry_yizhou:     '#a78bfa',
    gentry_jiangdong:  '#fb7185',
    gentry_xiliang:    '#fbbf24',
    gentry_dongzhou:   '#d4a04a',
    gentry_huaisi:     '#5b8fb9',
    defector:          '#f87171',
    newcomer:          '#fb923c',
    humble:            '#94a3b8',
  };

  // ─── v172: 势力阶段栏（军阀/一方之主/政权 + anchor 州 + 距下一阶段差距） ───
  const _stage = getStage(fid);
  const _stgColor = getStageColor(_stage);
  const _stageNarrative = getStageNarrative(fid);
  const stageHtml = `<div class="court-stage" style="border-left:3px solid ${_stgColor};padding:8px 10px;margin-bottom:10px;background:rgba(218,165,32,.05);font-size:11px;line-height:1.5;color:rgba(60,48,28,.85);letter-spacing:.5px">${_stageNarrative}</div>`;

  // ─── 第一区：态势摘要（文言叙事）───
  const narrative = _buildCourtNarrative(fid);
  const narrativeHtml = `<div class="court-narrative">${narrative}</div>`;

  // ─── 第二区：影响力堆叠横条 + 图例（保留原有）───
  const activeFactions = FACTION_DEFS.filter(fd => (fi[fd.id]?.influence||0) > 0);
  const stackSegs = activeFactions.map(fd => {
    const pct = fi[fd.id].influence / total * 100;
    return `<div title="${fd.label} ${Math.round(pct)}%" style="width:${pct}%;height:100%;background:${FACTION_COLORS[fd.id]}"></div>`;
  }).join("");
  const stackBar = `<div style="display:flex;height:16px;border-radius:4px;overflow:hidden;margin-bottom:8px">${stackSegs}</div>`;

  const gens = (G.generals[fid]||[]).filter(g => g.role !== "ruler");
  const avgLoyalty = gens.length > 0
    ? Math.round(gens.reduce((s,g)=>(s+(G.genLoyalty[g.name]??80)),0)/gens.length) : 80;

  const legend = activeFactions.map(fd => {
    const pct = Math.round(fi[fd.id].influence / total * 100);
    const count = fi[fd.id].gens.length;
    return `<div style="display:flex;align-items:center;gap:4px">
      <div style="width:8px;height:8px;border-radius:50%;background:${FACTION_COLORS[fd.id]};flex-shrink:0"></div>
      <span style="font-size:11px;color:rgba(44,36,22,.7)">${fd.label}</span>
      <span style="font-size:11px;color:rgba(92,74,50,.45)">${pct}%·${count}人</span>
    </div>`;
  }).join("");
  const legendHtml = `<div style="display:flex;flex-wrap:wrap;gap:5px 10px;margin-bottom:10px">${legend}</div>`;

  // ─── 第三区：矛盾预警（替代原有tensions）───
  const warnings = _buildCourtWarnings(fid);
  let warningsHtml;
  if(warnings.length === 0){
    warningsHtml = `<div class="court-warn-item cw-green"><span class="cw-text">朝堂无虞，可专意军务。</span></div>`;
  } else {
    warningsHtml = warnings.map(w => `<div class="court-warn-item ${w.cls}">
      <span style="flex-shrink:0">${w.icon}</span>
      <span class="cw-text">${w.text}</span>
      ${w.action ? `<span class="cw-action" onclick="switchTab('${w.action.tab}')">${w.action.label} →</span>` : ''}
    </div>`).join('');
  }

  const loyaltyWarn = avgLoyalty < 40
    ? `<div style="background:rgba(192,48,48,.08);border:1px solid rgba(192,48,48,.3);border-radius:3px;padding:6px 8px;margin-bottom:8px;color:#c03030;font-size:11px">🔴 众心离散，平均忠诚仅${avgLoyalty}，恐有叛变之虞</div>` : "";

  // ─── 第四区：朝议令（保留原有）───
  const activeDecrees = (G.courtDecrees||[]).filter(d => d.fid === fid && d.expiresAt > G.turn);
  const decreeHtml = activeDecrees.length
    ? activeDecrees.map(d => {
        const remain = Math.min(d.expiresAt - G.turn, 12); // 防御性上限
        return `<div style="display:flex;justify-content:space-between;padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(80,65,40,.06)">
          <span style="color:#1a7a3a">📜 ${d.name}</span>
          <span style="color:rgba(92,74,50,.45);font-size:10px">${d.proposer}提案 · 剩余${remain}旬</span>
        </div>`;
      }).join('')
    : '<div style="color:rgba(92,74,50,.40);font-size:11px;padding:3px 8px">本季无朝议令生效</div>';

  // ─── 第五区：各派系武将列表（保留原有全部逻辑）───
  const byFaction = {};
  FACTION_DEFS.forEach(fd => { byFaction[fd.id] = []; });
  gens.forEach(gen => {
    const facs = getGenFactions(gen.name, fid);
    facs.forEach(facId => {
      if(byFaction[facId] && !byFaction[facId].some(g => g.name === gen.name)) {
        byFaction[facId].push(gen);
      }
    });
  });

  const marginalizedFacs = new Set();
  FACTION_DEFS.forEach(fd => {
    if(fd.id === 'royalty' || fd.id === 'founding') return;
    const ratio = (fi[fd.id]?.influence||0)/total;
    if(ratio > 0 && ratio < 0.10) marginalizedFacs.add(fd.id);
  });

  // ★ v168: 派系态度标签（文言）
  const _facAttitude = (fdId) => {
    const members = byFaction[fdId];
    if(!members.length) return '';
    let sumMod = 0;
    members.forEach(g => { sumMod += (G.genFactionMod && G.genFactionMod[g.name]) || 0; });
    const avg = sumMod / members.length;
    if(avg >= 5)   return `<span style="color:#5a8a5a;font-size:9px;margin-left:4px">归心</span>`;
    if(avg >= -3)  return `<span style="color:rgba(92,74,50,.45);font-size:9px;margin-left:4px">安分</span>`;
    if(avg >= -10) return `<span style="color:#b8860b;font-size:9px;margin-left:4px">怨望</span>`;
    return `<span style="color:#c03030;font-size:9px;margin-left:4px">离德</span>`;
  };

  const listHtml = FACTION_DEFS.map(fd => {
    const members = byFaction[fd.id];
    if(!members.length) return "";
    const color = FACTION_COLORS[fd.id];

    const facRatio = (fi[fd.id]?.influence||0)/total;
    const isMarginal = marginalizedFacs.has(fd.id);
    const marginalNote = isMarginal
      ? `<span style="color:#fb923c;font-size:9px;margin-left:5px">${facRatio<0.05?'⚠ 孤立无援':'⚠ 势单力薄'}</span>` : '';

    const rows = members.map(gen => {
      const sen = seniority(gen.name, fid);
      const tags = GEN_TAGS[gen.name] || {};
      const mod = (G.genFactionMod && G.genFactionMod[gen.name]) || 0;
      const modCol = mod >= 0.5 ? '#4ade80' : mod <= -0.5 ? '#f87171' : 'rgba(92,74,50,.45)';
      const modSign = mod >= 0 ? '+' : '';
      const modStr = `<span style="color:${modCol};font-size:10px;cursor:pointer;opacity:${Math.abs(mod)<0.5?'0.5':'1'}" onclick="event.stopPropagation();showFacModBreakdown(event,'${gen.name}','${fid}')">${modSign}${mod.toFixed(0)}</span>`;

      const breakdown = getGenFactionModBreakdown(gen.name, fid);
      const isMarginalGen = breakdown.items.some(i=>i.label.includes('孤立')||i.label.includes('势单'));
      const marginalGenIcon = isMarginalGen ? `<span class="tag-mini" style="font-size:12px;padding:1px 3px;color:#fb923c;border-color:rgba(251,147,38,.25)">⚠<span class="tag-mini-tip">边缘化·忠诚下降中</span></span>` : '';

      const senLabel = {founding:'创始',elder:'元老',defector:'降将',newcomer:'新附',member:''}[sen]||'';
      const combatIcon = tags.combat === 'hawk'
        ? `<span class="tag-mini" style="font-size:12px;padding:1px 3px">🦅<span class="tag-mini-tip">鹰派·主战</span></span>`
        : tags.combat === 'dove'
        ? `<span class="tag-mini" style="font-size:12px;padding:1px 3px">🕊️<span class="tag-mini-tip">鸽派·主和</span></span>`
        : '';
      const homeIcon = isHomeTerrain(gen.name, fid)
        ? `<span class="tag-mini" style="font-size:12px;padding:1px 3px">🏠<span class="tag-mini-tip">本土出身</span></span>`
        : '';
      const loyalty = G.genLoyalty[gen.name] ?? 80;
      const loyColor = loyalty < 40 ? "#f87171" : loyalty < 45 ? "#fb923c" : "rgba(92,74,50,.55)";

      const facDelta = breakdown.facDelta;
      const facDeltaStr = Math.abs(facDelta) >= 0.05
        ? `<span style="color:${facDelta>0?'#4ade80':'#f87171'};font-size:9px">${facDelta>0?'↑':'↓'}</span>` : '';

      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;border-bottom:1px solid rgba(80,65,40,.06);font-size:11px">
        <span style="color:var(--ink-l);min-width:42px">${gen.name}</span>
        <span style="color:rgba(92,74,50,.45);flex:1;padding:0 4px;font-size:10px;display:flex;align-items:center;gap:3px">${senLabel}${combatIcon}${homeIcon}${marginalGenIcon}</span>
        <span style="color:${loyColor};min-width:26px;text-align:right">忠${loyalty}</span>
        <span style="color:rgba(92,74,50,.45);min-width:30px;text-align:right;margin-left:4px">政${gen.pol}${modStr}${facDeltaStr}</span>
      </div>`;
    }).join("");
    return `<div style="margin-bottom:8px">
      <div style="color:${color};font-size:11px;padding:3px 8px;background:rgba(255,252,245,.4);border-left:2px solid ${color};display:flex;align-items:center">${fd.label}（${members.length}人）${_facAttitude(fd.id)}${marginalNote}</div>
      ${rows}
    </div>`;
  }).join("");

  // ─── 操作区：空缺提示 ───
  const vacancies = _buildCourtVacancies(fid);
  const vacancyHtml = vacancies.length
    ? vacancies.map(v => `<div class="court-vacant">
        <span class="cv-label">${v.text}</span>
        <span class="cv-link" onclick="${v.cityId ? `selCity('${v.cityId}')` : `switchTab('${v.tab}')`}">前往 →</span>
      </div>`).join('')
    : '';

  // ─── 组装 ───
  c.innerHTML = `<div style="padding:12px">
    <div style="color:var(--ink);font-size:14px;font-weight:bold;margin-bottom:10px">派系总览 ${_tabHelpHtml('faction')} <span style="font-size:10px;font-weight:400;color:rgba(92,74,50,.40)">${facName}</span></div>
    ${stageHtml}
    ${loyaltyWarn}
    ${narrativeHtml}
    <div style="color:rgba(92,74,50,.55);font-size:10px;margin-bottom:4px">影响力分布 · ${gens.length}人 · 平均忠诚${avgLoyalty}</div>
    ${stackBar}
    ${legendHtml}
    <div style="border-top:1px solid rgba(80,65,40,.08);padding-top:8px;margin-bottom:8px">
      <div style="color:rgba(92,74,50,.45);font-size:10px;margin-bottom:5px">朝堂谏言</div>
      ${warningsHtml}
    </div>
    ${vacancyHtml ? `<div style="border-top:1px solid rgba(80,65,40,.08);padding-top:8px;margin-bottom:8px">
      <div style="color:rgba(92,74,50,.45);font-size:10px;margin-bottom:5px">空缺要津</div>
      ${vacancyHtml}
    </div>` : ''}
    <div style="border-top:1px solid rgba(80,65,40,.08);padding-top:8px;margin-bottom:8px">
      <div style="color:rgba(92,74,50,.45);font-size:10px;margin-bottom:5px">朝议令</div>
      ${decreeHtml}
    </div>
    <div style="border-top:1px solid rgba(80,65,40,.08);padding-top:8px">
      <div style="color:rgba(92,74,50,.45);font-size:10px;margin-bottom:5px">武将列表 · 🦅鹰派 🕊️鸽派 🏠本土 · 忠⬆︎/影响力±mod↑↓ · ⚠边缘化</div>
      ${listHtml || '<div style="color:rgba(92,74,50,.40);font-size:11px">暂无武将</div>'}
    </div>
  </div>`;
}
function renderDipTab(c){
  // 外交面板始终显示玩家自己势力，不跟随 selFac
  const fid = G.playerFac;
  const others = Object.keys(FAC).filter(f=>f!==fid);
  const sm  = {ally:'同盟', neutral:'中立', enemy:'敌对', vassal:'附庸'};
  const sc  = {ally:'#1a7a3a', neutral:'#6b5530', enemy:'#c03030', vassal:'#8060c0'};
  const rc  = r => r>=70?'#1a7a3a':r>=40?'#6b5530':'#c03030';

  // 生成单个按钮：始终渲染，条件不满足时 disabled + 原因 tooltip
  function dipBtn(label, cls, onclick, enabled, disabledReason){
    if(enabled){
      return `<button onclick="${onclick}" class="dip-btn ${cls}">${label}</button>`;
    } else {
      return `<span class="dip-tip-wrap"><button disabled class="dip-btn ${cls}" style="opacity:.35;cursor:not-allowed">${label}</button>${disabledReason ? `<span class="dip-tip">${disabledReason}</span>` : ''}</span>`;
    }
  }

  const cards = others.map(other=>{
    const k = `${fid}-${other}`, d = G.diplo[k]||{status:'neutral',rel:50};
    const rel      = Math.round(d.rel);
    const acted    = d._actedThisTurn;
    const statusCol= sc[d.status]||'#6b5530';
    const fac      = G.factions[fid];
    const gold     = fac?.res?.gold||0;

    const myPow    = powerIndex(fid), theirPow = powerIndex(other);
    const powRatio = myPow/(myPow+theirPow);
    const powLabel = powRatio>=0.65?'我方大占优势':powRatio>=0.55?'我方略占优势':powRatio>=0.45?'势均力敌':powRatio>=0.35?'我方略处劣势':'我方明显劣势';
    const powCol   = powRatio>=0.55?'#1a7a3a':powRatio>=0.45?'#6b5530':'#c03030';

    const armRate  = d.status==='enemy' ? peaceWillingness(other,fid) : 0;
    const allyRate = (d.status==='neutral'&&rel>=75) ? peaceWillingness(other,fid)*0.6 : 0;

    // 文言文描述议和/结盟意愿
    const willLabel = r => r>=0.7?'颇有诚意':r>=0.5?'尚可一谈':r>=0.3?'态度冷淡':'拒而不纳';

    let btns = '';
    if(acted){
      btns = `<div style="font-size:9px;color:rgba(92,74,50,.35);margin-top:6px;text-align:center">本旬已行动</div>`;
    } else {
      // ── 送礼（三档，始终显示，金不足则灰） ──
      const gift1 = dipBtn('遣使·小礼','',`diploGift('${other}',1)`, gold>=500,  `金币不足（需500，现有${Math.round(gold)}）`);
      const gift2 = dipBtn('遣使·厚礼','',`diploGift('${other}',2)`, gold>=1000, `金币不足（需1000，现有${Math.round(gold)}）`);
      const gift3 = dipBtn('遣使·重礼','',`diploGift('${other}',3)`, gold>=2000, `金币不足（需2000，现有${Math.round(gold)}）`);

      // ── 状态相关按钮 ──
      let actionBtns = '';

      // ★ v144: 附庸外交限制 — 附庸无外交自主权（不能宣战/结盟/求和）
      const playerIsVassal = getSuzerain(fid);
      const viewingTarget = other; // 当前查看的对方势力

      if(d.status === 'enemy'){
        if(playerIsVassal){
          actionBtns = `<div style="font-size:9px;color:rgba(92,74,50,.35);margin-top:4px">附庸无外交自主权，不可擅自求和</div>`;
        } else {
          const armOk = gold>=1000;
          const armLabel = `求和·${willLabel(armRate)}`;
          const armReason = !armOk ? '金币不足' : '';
          actionBtns = dipBtn(armLabel, 'dip-btn-warn', `diploArmistice('${other}')`, armOk, armReason);
        }
      } else if(d.status === 'neutral'){
        if(playerIsVassal){
          actionBtns = `<div style="font-size:9px;color:rgba(92,74,50,.35);margin-top:4px">附庸无外交自主权</div>`;
        } else {
        const allyRelOk = rel>=75, allyGoldOk = gold>=500;
        const allyOk = allyRelOk && allyGoldOk;
        const allyLabel = `缔盟·${willLabel(allyRate)}`;
        const allyReason = !allyRelOk ? '交情不够' : '金币不足';
        actionBtns =
          dipBtn(allyLabel, 'dip-btn-ok', `diploAlly('${other}')`, allyOk, allyReason);
        // ★ C3: 宣称系统UI
        const readyCl = getReadyClaim(fid, other);
        const prepCl = G.claims?.[`${fid}-${other}`];
        const availClaims = getAvailableClaims(fid, other);
        const myType = FAC_IDENTITY[fid]?.type;
        if(readyCl){
          actionBtns += dipBtn(`⚔ 以【${readyCl.label}】宣战`, 'dip-btn-bad', `diploWar('${other}','${readyCl.type}')`, true, '');
        } else if(prepCl && !prepCl.ready){
          const ct = CLAIM_TYPES[prepCl.type];
          actionBtns += `<div style="font-size:9px;color:#6b5530;margin-top:3px">📜 ${ct?.label||'?'} 准备中（${prepCl.prepTurns}/${ct?.prepTime||'?'}旬）</div>`;
          actionBtns += dipBtn('⚔ 无名出兵（信誉-12）', 'dip-btn-bad', `diploWar('${other}')`, true, '');
        } else if(myType==='emperor'){
          // 称帝后默认强宣称，但仍需1旬准备吊民伐罪
          const bestCl = availClaims.find(c=>c.prepTime===0) || availClaims[0];
          if(bestCl && bestCl.prepTime===0){
            actionBtns += dipBtn(`⚔ 以【${bestCl.label}】宣战`, 'dip-btn-bad', `diploWar('${other}','${bestCl.id}')`, true, '');
          } else if(bestCl){
            actionBtns += dipBtn(`📜 准备【${bestCl.label}】`, '', `startClaimPrepUI('${other}','${bestCl.id}')`, true, '');
            actionBtns += dipBtn('⚔ 无名出兵（信誉-12）', 'dip-btn-bad', `diploWar('${other}')`, true, '');
          }
        } else {
          // 非称帝：显示可用宣称准备按钮 + 无宣称宣战
          if(availClaims.length){
            const best = availClaims[0]; // 已按强度排序
            if(best.prepTime === 0){
              actionBtns += dipBtn(`⚔ 以【${best.label}】宣战`, 'dip-btn-bad', `diploWar('${other}','${best.id}')`, true, '');
            } else {
              actionBtns += dipBtn(`📜 准备【${best.label}】（${best.prepTime}旬）`, '', `startClaimPrepUI('${other}','${best.id}')`, true, '');
            }
          }
          actionBtns += dipBtn('⚔ 无名出兵（信誉-12）', 'dip-btn-bad', `diploWar('${other}')`, true, '');
        }
        // ★ v144: 附庸相关按钮（中立关系下）
        const _myPow = powerIndex(fid);
        const _otherPow = powerIndex(other);
        const _powRatio = _myPow / Math.max(1, _otherPow);
        const _otherIsVassal = !!getSuzerain(other);
        const _iAmVassal = !!getSuzerain(fid);
        // 要求称臣：我方实力≥对方2.5倍，双方都非附庸
        const _canDemand = _powRatio >= 2.5 && !_otherIsVassal && !_iAmVassal;
        const _demandReason = _iAmVassal ? '我方是附庸' : _otherIsVassal ? '对方已有宗主' : '实力差距不够大';
        actionBtns += dipBtn('👑 要求称臣', '', `diploDemandVassal('${fid}', '${other}')`, _canDemand, _canDemand?'':_demandReason);
        // 请求称臣：对方实力≥我方1.5倍，我方无宗主，对方非附庸
        const _canSubmit = _powRatio <= 0.67 && !_iAmVassal && !_otherIsVassal;
        const _submitReason = _iAmVassal ? '已有宗主' : _otherIsVassal ? '对方是附庸' : '实力差距不够大';
        actionBtns += dipBtn('🏳 请求称臣', '', `diploSubmitVassal('${fid}', '${other}')`, _canSubmit, _canSubmit?'':_submitReason);
        } // end !playerIsVassal
      } else if(d.status === 'ally'){
        actionBtns = dipBtn('解盟', 'dip-btn-warn', `diploBreakAlliance('${other}')`, true, '');
      } else if(d.status === 'vassal'){
        // 玩家是宗主：可释放附庸
        if(d.suzerain === fid){
          actionBtns = dipBtn('释放附庸', 'dip-btn-warn', `playerReleaseVassal('${fid}', '${other}')`, true, '');
        } else {
          // ★ v144: 玩家是附庸——可申请解除附庸（需宗主同意，12旬CD）
          const relToSuz = G.diplo[`${fid}-${other}`]?.rel ?? 50;
          const cdKey = `_vassalIndepCD_${fid}`;
          const cdLeft = (G[cdKey] && G[cdKey] > G.turn) ? G[cdKey] - G.turn : 0;
          const canRequest = relToSuz >= 30 && cdLeft === 0;
          const reason = cdLeft > 0 ? `冷却中（${cdLeft}旬）` : '交情不够';
          actionBtns = dipBtn(`📜 请求解除附庸${cdLeft>0?' ('+cdLeft+'旬)':''}`, 'dip-btn-warn', `requestVassalIndependence('${other}')`, canRequest, canRequest?'':reason);
        }
      }

      // ★ v181 #5: tooltip 纳贡比例按宗主 stage（即玩家自己）动态显示
      const _trMy = getTributeRates(fid);
      const _trMyText = (_trMy.gold === 0 && _trMy.food === 0)
        ? '仅名义·无纳贡'
        : `金${Math.round(_trMy.gold*100)}%·粮${Math.round(_trMy.food*100)}%`;
      btns = `<div style="margin-top:6px">
        <div style="font-size:9px;color:${powCol};margin-bottom:5px">军力：${powLabel}${d.status==='vassal'?('<span style="color:#8060c0;margin-left:6px">'+(d.suzerain===fid?('（纳贡中·'+_trMyText+'）'):('（宗主：'+(FAC[d.suzerain]?.name||'?')+'）'))+'</span>'):''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">
          ${gift1}${gift2}${gift3}
        </div>
        ${(()=>{
          // ★ v164: 互市按钮行
          if(d.status==='enemy') return '';
          const offers = _getTradeOffers(other);
          if(!offers.length) return '';
          const tradeOk = d.rel>=30 && !(G._tradeCD && (G._tradeCD[fid+'_'+other]||0)>G.turn);
          const tradeReason = d.rel<30 ? '友好度不足30' : (G._tradeCD&&(G._tradeCD[fid+'_'+other]||0)>G.turn) ? '本季已互市' : '';
          const tradeBtns = offers.map(o=>{
            const ok2 = tradeOk && gold>=o.cost;
            const reason2 = !tradeOk ? tradeReason : '金币不足（需'+o.cost+'）';
            if(ok2){
              return '<button onclick="diploTrade(\''+other+'\',\''+o.res+'\')" class="dip-btn" title="花费'+o.cost+'金，获得'+o.label+o.qty+'（附带情报）">'+o.icon+' 购'+o.label+'·'+o.cost+'金</button>';
            }
            return dipBtn(o.icon+' 购'+o.label+'·'+o.cost+'金', '', "diploTrade('"+other+"','"+o.res+"')", false, reason2);
          }).join('');
          return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">'+tradeBtns+'</div>';
        })()}
        ${(()=>{
          // ★ v165: 通商协定按钮行
          if(d.status==='enemy') return '';
          const _hasAgr = hasTradeAgreement(fid, other);
          if(_hasAgr){
            // 已有通商——显示收入+中止按钮
            const _otherCities = Object.values(G.cities).filter(c=>c.fac===other).length;
            const _dk2 = fid<other?fid+'-'+other:other+'-'+fid;
            const _d2 = G.diplo[_dk2];
            const _allyM = _d2&&_d2.status==='ally'?1.2:1.0;
            const _inc = Math.floor(_otherCities * 5 * _allyM);
            return '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:4px">' +
              '<span style="font-size:9px;color:#1a7a3a">📦 通商中（+'+_inc+'金/旬'+ (_allyM>1?' 盟友+20%':'') +'）</span>' +
              '<button onclick="cancelTradeAgreement(\''+other+'\')" class="dip-btn dip-btn-warn" style="font-size:8px;padding:1px 5px" title="中止通商：好感-8，信誉-3">❌ 中止</button>' +
              '</div>';
          }
          // 未签约——显示缔结按钮
          const _isVassal = !!getSuzerain(fid) || !!getSuzerain(other);
          const _relOk = d.rel >= 50;
          const _maxOk = getTradeAgreements(fid).length < 2;
          const _tgtMaxOk = getTradeAgreements(other).length < 2;
          const _goldOk = gold >= 500;
          const _canSign = _relOk && _maxOk && _tgtMaxOk && _goldOk && !_isVassal && d.status!=='enemy';
          const _reason = _isVassal ? '附庸不可通商' : !_relOk ? '友好度不足50' : !_maxOk ? '我方通商已达上限(2)' : !_tgtMaxOk ? '对方通商已达上限' : !_goldOk ? '金币不足（需500）' : '';
          if(_canSign){
            return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px"><button onclick="diploTradeAgreement(\''+other+'\')" class="dip-btn" title="花费500金，双方每旬按对方城市数获得金币收入">🤝 缔结通商·500金</button></div>';
          }
          return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">' + dipBtn('🤝 缔结通商·500金', '', "diploTradeAgreement('"+other+"')", false, _reason) + '</div>';
        })()}
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${actionBtns}
        </div>
      </div>`;
    }

    return `<div class="dip-item" style="flex-direction:column;align-items:stretch;padding:8px 10px;margin-bottom:8px;border:1px solid rgba(80,65,40,.10);background:rgba(80,65,40,.03)">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-family:'Noto Serif SC',serif;font-size:12px;color:${FAC[other]?.color};min-width:28px">${FAC[other]?.name}</span>
        <div class="rel-bar" style="flex:1"><div class="rel-fill" style="width:${rel}%;background:${rc(rel)}"></div></div>
        <span class="clickable-val" style="font-size:9px;color:rgba(92,74,50,.45);min-width:20px;text-align:right" onclick="event.stopPropagation();showDiploBreakdown(event,'${other}')">${rel}</span>
        <span class="clickable-val" style="font-size:9px;color:${statusCol};min-width:28px;text-align:right;font-family:'Noto Serif SC',serif" onclick="event.stopPropagation();showDiploBreakdown(event,'${other}')">${sm[d.status]||d.status}</span>
      </div>
      ${btns}
    </div>`;
  }).join('');

  c.innerHTML =
    `<div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:8px">外交总览 ${_tabHelpHtml('dip')} <span style="font-size:9px;color:rgba(92,74,50,.25)">${FAC[fid]?.full}</span></div>` +
    (() => {
      const rep = Math.round(G.reputation?.[fid] ?? REPUTATION_DEFAULT);
      const repCol = rep>=70?'#1a7a3a':rep>=40?'#6b5530':'#c03030';
      const repLabel = rep>=80?'名震四海':rep>=60?'信义之名':rep>=40?'毁誉参半':rep>=20?'言而无信':'臭名昭著';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 8px;background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.10);border-radius:3px">
        <span style="font-size:10px;color:rgba(92,74,50,.55);white-space:nowrap">声誉</span>
        <div class="rel-bar" style="flex:1"><div class="rel-fill" style="width:${rep}%;background:${repCol}"></div></div>
        <span class="clickable-val" style="font-size:10px;color:${repCol};min-width:20px;text-align:right" onclick="event.stopPropagation();showRepBreakdown(event,'${fid}')">${rep}</span>
        <span class="clickable-val" style="font-size:9px;color:${repCol};min-width:44px;text-align:right;font-family:'Noto Serif SC',serif" onclick="event.stopPropagation();showRepBreakdown(event,'${fid}')">${repLabel}</span>
      </div>`;
    })() +
    (() => {
      // ★ C3: 势力身份 + 天子 + 称帝按钮
      const ident = FAC_IDENTITY[fid];
      const typeLabels = {emperor_holder:'挟天子',han_royal:'汉室宗亲',warlord:'诸侯',emperor:'皇帝'};
      const typeColors = {emperor_holder:'#6b5530',han_royal:'#1a7a3a',warlord:'#888',emperor:'#c084fc'};
      const tLabel = typeLabels[ident?.type] || '诸侯';
      const tCol = typeColors[ident?.type] || '#888';
      let empStr = '';
      if(G.emperor){
        const empCity = CITY_MAP[G.emperor.cityId]?.name || G.emperor.cityId;
        const empHolder = FAC[G.emperor.holder]?.name || '?';
        empStr = `<span style="font-size:9px;color:rgba(92,74,50,.55);margin-left:8px">天子在${empCity}（${empHolder}控制）</span>`;
      } else {
        empStr = `<span style="font-size:9px;color:rgba(92,74,50,.35);margin-left:8px">天子已废</span>`;
      }
      const canE = canEnthrone(fid);
      const _hxOff = hasFacGen(fid,'华歆') && genHasOffice('华歆',fid);
      const _reqC = _hxOff ? 8 : 10, _reqR = _hxOff ? 30 : 40;
      const eBtn = ident?.type !== 'emperor'
        ? (canE
          ? `<button onclick="playerEnthrone()" style="padding:2px 8px;font-size:9px;background:rgba(192,132,252,.2);color:#c084fc;border:1px solid rgba(192,132,252,.3);border-radius:2px;cursor:pointer">👑 称帝</button>`
          : `<span class="dip-tip-wrap"><button disabled style="padding:2px 8px;font-size:9px;background:rgba(80,65,40,.07);color:rgba(92,74,50,.35);border:1px solid rgba(80,65,40,.10);border-radius:2px;cursor:not-allowed">👑 称帝</button><span class="dip-tip">需${_reqC}城·信誉${_reqR}·非附庸</span></span>`)
        : `<span style="font-size:9px;color:#c084fc;font-family:'Noto Serif SC',serif">👑 已称帝</span>`;
      return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding:6px 8px;background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.10);border-radius:3px;flex-wrap:wrap">
        <span style="font-size:10px;color:rgba(92,74,50,.55)">身份</span>
        <span style="font-size:10px;color:${tCol};font-family:'Noto Serif SC',serif">${tLabel}</span>
        ${empStr}
        <span style="flex:1"></span>
        ${eBtn}
      </div>`;
    })() +
    cards +
    `<div style="margin-top:4px;font-size:9px;color:rgba(92,74,50,.35);line-height:2">
      友好度≥80自动结盟 · 同盟&lt;30盟约破裂 · 中立≤10转敌对<br>
      送礼/停战/结盟每旬限一次 · 按钮灰色表示条件不足（悬停查看原因）<br>
      声誉&lt;60时送礼效果降低、停战/结盟接受率下降；声誉每旬缓慢回复
    </div>`;
}

// ── ★ v145: 计谋独立Tab ──
function renderSchemeTab(c){
  const fid = G.playerFac;
  const others = Object.keys(FAC).filter(f=>f!==fid);

  // ── 军师栏 ──
  const sName = G.factions[fid]?.strategist;
  const sGen  = sName ? (G.generals[fid]||[]).find(g=>g.name===sName) : null;
  const ruler = (G.generals[fid]||[]).find(g=>g.role==='ruler');
  const intSrc = sGen ? `军师 ${sName}（int:${sGen.int}）` : `君主 ${ruler?.name||''}（int:${ruler?.int??'?'}）`;
  const strategistBar = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 8px;background:rgba(80,65,40,.04);border:1px solid rgba(80,65,40,.10);border-radius:3px">
    <span style="font-size:10px;color:rgba(92,74,50,.55);white-space:nowrap">军师</span>
    <span style="flex:1;font-size:10px;color:rgba(92,74,50,.7);font-family:'Noto Serif SC',serif">${sName||'未任命'}</span>
    <span style="font-size:9px;color:rgba(92,74,50,.40)">${intSrc}</span>
    <button onclick="openStrategistModal()" style="padding:2px 8px;font-size:9px;background:rgba(80,65,40,.10);color:rgba(92,74,50,.7);border:1px solid rgba(80,65,40,.14);border-radius:2px;cursor:pointer">任命</button>
  </div>`;

  // ── 计谋区块 ──
  const cd   = G.strategyCD?.[fid] || {};
  const gold = G.factions[fid]?.res?.gold || 0;
  const willLabel = r => r>=0.70?'胜算颇大':r>=0.50?'尚有把握':r>=0.30?'胜负难料':'凶多吉少';

  function sBtn(label, cost, cdKey, baseRate, onclick){
    const onCD    = (cd[cdKey]||0) > 0;
    const hasGold = gold >= cost;
    const ok      = !onCD && hasGold;
    const rate    = _strategyRate(fid, baseRate);
    const tip     = onCD ? `冷却中（剩${cd[cdKey]}旬）` : !hasGold ? `金币不足（需${cost}）` : willLabel(rate);
    const cdBadge = onCD ? ` [${cd[cdKey]}旬]` : '';
    return ok
      ? `<button onclick="${onclick}" class="dip-btn" title="${tip}">${label}·${cost}金·${willLabel(rate)}</button>`
      : `<button disabled class="dip-btn" title="${tip}" style="opacity:.35;cursor:not-allowed">${label}·${cost}金${cdBadge}</button>`;
  }

  const pairOpts  = others.map(f=>`<option value="${f}">${FAC[f]?.name}</option>`).join('');
  const pairOptsB = others.map((f,i)=>`<option value="${f}"${i===1?' selected':''}>${FAC[f]?.name}</option>`).join('');
  const selStyle  = `font-size:9px;background:rgba(245,238,225,.95);color:var(--ink);border:1px solid rgba(80,65,40,.2);padding:2px 3px;border-radius:2px`;

  // 反间：势力 → 武将 级联
  const spyFacRows = others.map(f => {
    const gens = (G.generals[f]||[]).filter(g=>g.role!=='ruler');
    const genOpts = gens.map(g=>`<option value="${g.name}">${g.name}（忠${Math.round(G.genLoyalty[g.name]??60)}）</option>`).join('');
    const selId = `spy-gen-${f}`;
    return `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
      <span style="font-size:9px;color:${FAC[f]?.color};min-width:16px">${FAC[f]?.name}</span>
      <select id="${selId}" style="${selStyle}">${genOpts||'<option>（无）</option>'}</select>
      ${sBtn('反间计',1200,'spy',0.40,`stratSpy('${f}',document.getElementById('${selId}').value)`)}
    </div>`;
  }).join('');

  // 谣言：势力 → 城市 级联
  const rumorFacRows = others.map(f => {
    const cities = Object.values(G.cities).filter(c2=>c2.fac===f).sort((a,b)=>b.pop-a.pop);
    const cityOpts = cities.map(c2=>`<option value="${c2.id}">${c2.name}（心${Math.round(c2.morale??50)}）</option>`).join('');
    const selId = `rum-city-${f}`;
    return `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
      <span style="font-size:9px;color:${FAC[f]?.color};min-width:16px">${FAC[f]?.name}</span>
      <select id="${selId}" style="${selStyle}">${cityOpts||'<option>（无城）</option>'}</select>
      ${sBtn('散布谣言',600,'rumor',0.45,`stratRumor('${f}',document.getElementById('${selId}').value)`)}
    </div>`;
  }).join('');

  // 细作探报：邻接敌城 → 侦察3旬
  const adjEnemyCities = [];
  const myCityIds = Object.values(G.cities).filter(c2=>c2.fac===fid).map(c2=>c2.id);
  myCityIds.forEach(cid=>{
    (ROAD_ADJ[cid]||[]).forEach(nbId=>{
      const nb=G.cities[nbId];
      if(nb && nb.fac!==fid && !adjEnemyCities.some(x=>x.id===nbId)){
        const scouting = (G.scoutReveals||[]).some(sr=>sr.fid===fid&&sr.cityId===nbId&&sr.expiresAt>G.turn);
        adjEnemyCities.push({id:nbId, name:nb.name, fac:nb.fac, scouting});
      }
    });
  });
  const scoutOpts = adjEnemyCities.map(c2=>`<option value="${c2.id}">${c2.name}${c2.scouting?' (侦察中)':''}</option>`).join('');
  const _zsDiscount = hasFacGen(fid,'张松') && genHasOffice('张松',fid);
  const _scCost = _zsDiscount ? 400 : 800;
  const scoutRow = adjEnemyCities.length > 0
    ? `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
        <select id="scout-city" style="${selStyle}">${scoutOpts}</select>
        ${sBtn('细作探报',_scCost,'scout',0.75,`stratScout(document.getElementById('scout-city').value)`)}${_zsDiscount?'<span style="font-size:8px;color:rgba(120,80,40,.5)">张松·献图</span>':''}
      </div>`
    : `<div style="font-size:9px;color:rgba(92,74,50,.35)">无邻接敌城可侦察</div>`;

  c.innerHTML =
    `<div style="font-size:10px;color:rgba(92,74,50,.40);margin-bottom:8px">计谋总览 ${_tabHelpHtml('scheme')} <span style="font-size:9px;color:rgba(92,74,50,.25)">${FAC[fid]?.full}</span></div>` +
    strategistBar +
    `<div style="padding:8px;margin-bottom:10px;background:rgba(120,60,20,.06);border:1px solid rgba(80,65,40,.10);border-radius:3px">
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          <select id="strat-a" style="${selStyle}">${pairOpts}</select>
          <span style="font-size:9px;color:rgba(92,74,50,.40)">向</span>
          <select id="strat-b" style="${selStyle}">${pairOptsB}</select>
          ${sBtn('驱虎吞狼',1500,'driveWolf',0.20,"stratDriveWolf(document.getElementById('strat-a').value,document.getElementById('strat-b').value)")}
        </div>
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          <select id="strat-c" style="${selStyle}">${pairOpts}</select>
          <span style="font-size:9px;color:rgba(92,74,50,.40)">挑拨</span>
          <select id="strat-d" style="${selStyle}">${pairOptsB}</select>
          ${sBtn('二虎竞食',800,'twoTigers',0.50,"stratTwoTigers(document.getElementById('strat-c').value,document.getElementById('strat-d').value)")}
        </div>
        <div style="border-top:1px solid rgba(80,65,40,.07);padding-top:6px;display:flex;flex-direction:column;gap:5px">
          ${spyFacRows}
        </div>
        <div style="border-top:1px solid rgba(80,65,40,.07);padding-top:6px;display:flex;flex-direction:column;gap:5px">
          ${rumorFacRows}
        </div>
        <div style="border-top:1px solid rgba(80,65,40,.07);padding-top:6px;display:flex;flex-direction:column;gap:5px">
          ${scoutRow}
        </div>
        <div style="border-top:1px solid rgba(80,65,40,.07);padding-top:6px;display:flex;flex-direction:column;gap:5px">
          <div style="font-size:9px;color:rgba(92,74,50,.55);margin-bottom:2px">🏛 通使（非敌对·好感≥20 → 情报+好感）</div>
          ${others.filter(f=>{const dd=G.diplo[fid+'-'+f]; return dd&&dd.status!=='enemy';}).map(f=>{
            const dd=G.diplo[fid+'-'+f]||{rel:50};
            const relOk = dd.rel>=20;
            return `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
              <span style="font-size:9px;color:${FAC[f]?.color};min-width:16px">${FAC[f]?.name}</span>
              <span style="font-size:8px;color:rgba(92,74,50,.35)">好感${Math.round(dd.rel)}</span>
              ${sBtn('通使',600,'envoy',0.65,`stratEnvoy('${f}')`)}
            </div>`;
          }).join('')||'<div style="font-size:9px;color:rgba(92,74,50,.35)">无可通使势力</div>'}
        </div>
      </div>
    </div>` +
    `<div style="margin-top:4px;font-size:9px;color:rgba(92,74,50,.35);line-height:2">
      计谋成功率受军师/君主智谋影响 · 失败损失信誉 · 各计谋有独立冷却
    </div>`;
}

// ═══════════════════════════════════════
// ★ v151: 价值观Tab
// ═══════════════════════════════════════
function renderEthosTab(c){
  const fid = G.playerFac;
  const eth = G.factions[fid]?.ethos;
  if(!eth){ c.innerHTML = '<div style="padding:20px;color:rgba(92,74,50,.5)">价值观数据未初始化</div>'; return; }

  // ── 五维横条渲染 ──
  let barsHtml = '';
  ETHOS_DIMS.forEach(dim => {
    const val = eth[dim];
    const lab = ETHOS_LABELS[dim];
    const name = ETHOS_DIM_NAMES[dim];
    const tierLabel = _ethosTierLabel(val, dim);
    // 指针位置：-100→0%, 0→50%, +100→100%
    const pct = Math.max(2, Math.min(98, 50 + val * 0.5));
    // 颜色：负值蓝调，正值红调，中立灰
    const barLeftCol = 'rgba(40,90,140,.35)';
    const barRightCol = 'rgba(160,60,40,.35)';
    const pointerCol = Math.abs(val) < 15 ? 'rgba(92,74,50,.6)' : (val > 0 ? '#b04030' : '#2a6a9a');
    const tierCol = Math.abs(val) < 15 ? 'rgba(92,74,50,.45)' : (val > 0 ? '#b04030' : '#2a6a9a');

    barsHtml += `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <span style="font-size:11px;font-family:'Noto Serif SC',serif;color:var(--ink-l)">${lab.icon} ${name}</span>
          <span style="font-size:10px;color:${tierCol};font-weight:600">${tierLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:8px;color:rgba(40,90,140,.7);min-width:42px;text-align:right">${lab.neg}</span>
          <div style="flex:1;position:relative;height:10px;background:linear-gradient(to right,${barLeftCol},rgba(92,74,50,.08) 50%,${barRightCol});border-radius:5px;overflow:visible">
            <div style="position:absolute;top:-2px;left:calc(${pct.toFixed(1)}% - 5px);width:10px;height:14px;background:${pointerCol};border-radius:2px;transition:left .3s"></div>
            <div style="position:absolute;top:0;left:50%;width:1px;height:10px;background:rgba(92,74,50,.2)"></div>
          </div>
          <span style="font-size:8px;color:rgba(160,60,40,.7);min-width:42px">${lab.pos}</span>
        </div>
      </div>`;
  });

  // ── 其他势力价值观一览 ──
  let othersHtml = '';
  ALL_FACS.filter(f => f !== fid).forEach(of => {
    const oe = G.factions[of]?.ethos;
    if(!oe) return;
    const facN = FAC[of]?.name || of;
    const facC = FAC[of]?.color || '#6b5530';
    const dist = Math.round(_ethosDistance(fid, of));
    const distLabel = dist > 50 ? '道不同不相为谋' : dist > 30 ? '貌合神离' : dist > 15 ? '和而不同' : '志同道合';
    const distCol = dist > 50 ? '#c03030' : dist > 30 ? '#8a6a10' : dist > 15 ? 'rgba(92,74,50,.5)' : '#1a7a3a';
    let dimsStr = ETHOS_DIMS.map(dim => {
      const v = oe[dim];
      const tl = _ethosTierLabel(v, dim);
      return tl === '中立' ? '' : `<span style="font-size:8px;color:rgba(92,74,50,.45)">${ETHOS_DIM_NAMES[dim]}:${tl}</span>`;
    }).filter(Boolean).join(' · ');
    if(!dimsStr) dimsStr = '<span style="font-size:8px;color:rgba(92,74,50,.35)">各维度中立</span>';
    othersHtml += `
      <div style="padding:6px 8px;margin-bottom:4px;background:rgba(255,252,245,.5);border:1px solid rgba(92,74,50,.12);border-radius:3px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:10px;color:${facC};font-family:'Noto Serif SC',serif">${facN}</span>
          <span style="font-size:9px;color:${distCol}">${distLabel}</span>
        </div>
        <div style="line-height:1.6">${dimsStr}</div>
      </div>`;
  });

  // ── 最近变化日志 ──
  const elog = G.factions[fid]._ethosLog || [];
  const recentLogs = elog.slice(-8).reverse();
  let logHtml = '';
  if(recentLogs.length){
    logHtml = recentLogs.map(e => {
      const dName = ETHOS_DIM_NAMES[e.dim] || e.dim;
      const sign = e.delta > 0 ? '+' : '';
      const col = Math.abs(e.delta) >= 5 ? (e.delta > 0 ? '#b04030' : '#2a6a9a') : 'rgba(92,74,50,.45)';
      return `<div style="font-size:8px;color:${col};line-height:1.8">第${e.turn}旬 ${dName} ${sign}${e.delta} <span style="color:rgba(92,74,50,.3)">（${e.source}）</span></div>`;
    }).join('');
  } else {
    logHtml = '<div style="font-size:9px;color:rgba(92,74,50,.3)">暂无变化记录</div>';
  }

  c.innerHTML = `
    <div style="padding:8px 4px">
      <div style="font-size:12px;font-family:'Noto Serif SC',serif;color:var(--ink-l);margin-bottom:12px;border-bottom:1px solid rgba(80,65,40,.12);padding-bottom:6px">
        价值观总览 ${_tabHelpHtml('ethos')}
        <span style="font-size:8px;color:rgba(92,74,50,.35);margin-left:8px">基于行为与人事自然形成的势力倾向</span>
      </div>
      ${barsHtml}
      <div style="font-size:10px;font-family:'Noto Serif SC',serif;color:rgba(92,74,50,.6);margin:16px 0 8px;border-bottom:1px solid rgba(80,65,40,.08);padding-bottom:4px">
        🗺 各势力倾向
      </div>
      ${othersHtml}
      <div style="font-size:10px;font-family:'Noto Serif SC',serif;color:rgba(92,74,50,.6);margin:16px 0 8px;border-bottom:1px solid rgba(80,65,40,.08);padding-bottom:4px">
        📜 近期变化
      </div>
      ${logHtml}
    </div>`;
}

// ═══════════════════════════════════════════════════════
// R4.8.b UTILS section — v181 L2864-L2872
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
function selCity(id){G.selCity=id;G.activeTab='city';updateTabs();renderRight();renderMap();}
function selFac(fid){G.selFac=fid;renderLeft();renderRight();}
function switchTab(t){G.activeTab=t;updateTabs();renderRight();}
function updateTabs(){
  document.querySelectorAll('.tab').forEach((el,i)=>el.classList.toggle('active',['city','mil','gen','post','dip','scheme','faction','tech','ethos','stats'][i]===G.activeTab));
}

// ═══════════════════════════════════════════════════════
// R4.8.c renderMilTab — v181 L8326-L8395
// ═══════════════════════════════════════════════════════

function renderMilTab(c){
  // 部队详情（有选中部队时）
  if(G.selUnitId){
    renderUnitDetail(c);
    return;
  }
  // 全局野战部队总览
  const weiUnits=G.units.filter(u=>u.fac===G.playerFac);
  if(!weiUnits.length){
    c.innerHTML=`
      <div class="sec">部队总览 ${_tabHelpHtml('mil')}</div>
      <div style="color:rgba(92,74,50,.35);font-size:11px;text-align:center;
        padding:38px 0;font-family:'Noto Serif SC',serif;letter-spacing:2px">
        尚无野战部队<br>
        <span style="font-size:9px;opacity:.6">在城池面板征募编组</span>
      </div>`;
    return;
  }
  const rows=weiUnits.map(u=>{
    const total=getUnitTroops(u);
    const ap=calcUnitAP(u);
    const atCityId3 = getUnitNodeId(u);
    const atCity = atCityId3 ? G.cities[atCityId3] : null;
    const statusCol=u.mobilizingTurns>0?'#8a6a10':u.status==='garrison'?'#1a7a3a':'#8a6a10';
    const statusLabel=u.mobilizingTurns>0?`⚙ ${u.mobilizingTurns}旬`:u.status==='garrison'?'🛡 待':'⚔ 行';
    const squadIcons=u.squads.map(sq=>TROOP_TYPES[sq.type]?.icon||'').join('');
    return `<div class="mil-unit-row" onclick="onUnitLeftClick('${u.id}',event)"
        oncontextmenu="onUnitRightClick('${u.id}',event)">
      <div class="mur-left">
        <div class="mur-name">${u.squads[0]?.genName}部</div>
        <div class="mur-sub">${squadIcons} ${fmt(total)}兵 · AP${ap}</div>
      </div>
      <div class="mur-right">
        <div class="mur-loc">${atCity?atCity.name:'野外'}</div>
        <div class="mur-status" style="color:${statusCol}">${statusLabel}</div>
      </div>
    </div>`;
  }).join('');
  c.innerHTML=`
    <div class="sec">部队总览 ${_tabHelpHtml('mil')}
      <span style="float:right;font-size:9px;color:rgba(92,74,50,.35)">${weiUnits.length}支 · 左键详情 右键移动</span>
    </div>
    <div class="mil-unit-list">${rows}</div>
    ${(()=>{
      // ★ v113: 休整兵员汇总
      const allBP=[];
      Object.values(G.cities).filter(c2=>c2.fac===G.playerFac).forEach(c2=>{
        (c2.billetPool||[]).forEach((bp,i)=>allBP.push({...bp,cityId:c2.id,cityName:c2.name,idx:i}));
      });
      if(!allBP.length) return '';
      const bpRows=allBP.map(bp=>{
        const tIcon=TROOP_TYPES[bp.type]?.icon||'';
        const restT=G.turn-bp.billetTurn;
        return `<div class="mil-unit-row" onclick="G.selCity='${bp.cityId}';G.activeTab='city';updateTabs();renderRight();" style="cursor:pointer">
          <div class="mur-left">
            <div class="mur-name">${tIcon} Lv${bp.level} · ${fmt(bp.troops)}兵${bp.genName?` <span style="color:#8a7040;font-size:8px">🔒${bp.genName}</span>`:''}</div>
            <div class="mur-sub">休整${restT}旬 · 满编${fmt(bp.maxTroops)}</div>
          </div>
          <div class="mur-right">
            <div class="mur-loc">${bp.cityName}</div>
            <div class="mur-status" style="color:#1a5f8a">🏠 休</div>
          </div>
        </div>`;
      }).join('');
      const totalBPTroops=allBP.reduce((s,bp)=>s+bp.troops,0);
      return `<div class="sec" style="margin-top:8px">休整屯田
        <span style="float:right;font-size:9px;color:rgba(92,74,50,.35)">${allBP.length}支 · ${fmt(totalBPTroops)}兵 · 点击前往城池编组</span>
      </div><div class="mil-unit-list">${bpRows}</div>`;
    })()}`;
}
