// src/render/gen_profile.js
//
// 渲染层(R)— 武将 profile + 官职任命/罢免弹窗。
//
// 来源:从 project_romance_v181.html L2163-L2468 抽离(Phase 4 / Sub-session 4.4)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离范围(1 段, 4 funcs)──
//   R4.4 官职 + 武将 profile          v181 L2163-L2468 (segment header + 4 funcs)
//                                      openPostAppoint / openPostAction /
//                                      openGenProfile / closeGenProfile
//
// 函数总数: **4 函数**
//
// ── 写口归属声明 ──
// **本文件主要写口**:
//   - DOM #genProfileModal innerHTML / style.display (武将 profile 弹窗)
//   - DOM #appointModal / #postActionModal innerHTML (官职弹窗)
//
// **跨链读取/调用**:
//   - G.generals / G.factions / G.cities / G.genPost / G.genMerit / G.genLoyalty (read)
//   - ALL_POSTS / GEN_TAGS / FAC (data read)
//   - calcFactionInfluence / appointGenPost / dismissGenPost / getPostSlots (政治链)
//   - setStrategist / setPrefect / killGen (武将链)
//   - addGenChronicle / GEN_MAP (武将链)

// ═══════════════════════════════════════
// D1 官职任命/罢免弹窗
// ═══════════════════════════════════════
function openPostAppoint(postName, fid){
  const postDef = ALL_POSTS.find(p=>p.name===postName);
  if(!postDef) return;
  const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');
  // 候选人：功绩够 + 无官职 + 无太守
  const candidates = gens.filter(g=>{
    if(G.genPost && G.genPost[g.name]) return false;
    if(Object.values(G.cities).some(c=>c.fac===fid && c.prefect===g.name)) return false;
    return (G.genMerit[g.name]||0) >= postDef.merit;
  }).sort((a,b)=>(G.genMerit[b.name]||0)-(G.genMerit[a.name]||0));

  if(!candidates.length){ showNotif(`无合适人选任${postName}（需功绩≥${postDef.merit}且无其他职务）`,'warn'); return; }

  const buffInfo = postDef.buffDesc ? `<div style="font-size:9px;color:#6b5530;margin:6px 0">效果: ${postDef.buffDesc} (按${postDef.buffStat==='com'?'统帅':'政治'}缩放)</div>` : '';
  const list = candidates.map(g=>{
    const merit = Math.floor(G.genMerit[g.name]||0);
    const stat = postDef.buffStat==='com' ? g.com : g.pol;
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-bottom:1px solid rgba(80,65,40,.07);transition:background .15s" onmouseover="this.style.background='rgba(80,65,40,.07)'" onmouseout="this.style.background=''" onclick="appointGenPost('${g.name}','${postName}','${fid}');closeModal();renderAllLight()">
      <span style="font-size:11px;color:var(--ink-l);font-family:'Noto Serif SC',serif">${g.name}</span>
      <span style="font-size:8px;color:rgba(92,74,50,.40)">功${merit} ${postDef.buffStat==='com'?'统':'政'}${stat}</span>
    </div>`;
  }).join('');

  showModal(`任命 ${postName}`, `
    <div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:4px">忠诚+${postDef.loyalty}/旬 | 俸禄${postDef.salary}金/旬 | 需功绩≥${postDef.merit}</div>
    ${buffInfo}
    <div style="font-size:9px;color:rgba(92,74,50,.55);margin-bottom:6px">选择任命人选:</div>
    <div style="max-height:200px;overflow-y:auto">${list}</div>
  `);
}

function openPostAction(genName, fid){
  const postDef = getGenPostDef(genName);
  if(!postDef) return;
  const gen = (G.generals[fid]||[]).find(g=>g.name===genName);
  if(!gen) return;
  const merit = Math.floor(G.genMerit[genName]||0);
  const stat = postDef.buffStat==='com' ? gen.com : gen.pol;
  const buffInfo = postDef.buffDesc ? `<div style="font-size:9px;color:#6b5530;margin:6px 0">效果: ${postDef.buffDesc} (×${(stat/100).toFixed(2)})</div>` : '';

  showModal(`${postDef.name} · ${genName}`, `
    <div style="font-size:10px;color:rgba(92,74,50,.55)">忠诚+${postDef.loyalty}/旬 | 俸禄${postDef.salary}金/旬 | 功绩${merit}</div>
    ${buffInfo}
    <div style="margin-top:12px;text-align:center">
      <button onclick="dismissGenPost('${genName}','${fid}');closeModal();renderAllLight()" style="padding:5px 16px;background:rgba(192,48,48,.15);border:1px solid rgba(192,48,48,.3);color:#c03030;font-family:'Noto Serif SC',serif;font-size:10px;cursor:pointer;border-radius:2px">罢免</button>
    </div>
  `);
}

// 通用弹窗（复用现有modal框架或简单创建）

// ═══════════════════════════════════════
// 武将详情弹窗
// ═══════════════════════════════════════
function openGenProfile(genName, fid){
  const fid2=fid||Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(g=>g.name===genName))
    || getScenarioFactions().find(f=>(G.generals[f]||[]).some(g=>g.name===genName));
  const g=GEN_MAP[genName] || (G.generals[fid2||'wei']||[]).find(x=>x.name===genName);
  if(!g) return;
  const meta=getGenMeta(genName);
  const fd=getFactionDef(fid2||'wei');
  const col=fd?.color||'#6b5530';
  const ac=v=>v>=90?'#8a7040':v>=75?'#1a7a3a':v>=60?'#1a5f8a':'#888';
  const aptColor={'S':'#8a7040','A':'#1a7a3a','B':'#1a5f8a','C':'rgba(80,65,40,.25)'};
  const aptLabel={'S':'S','A':'A','B':'B','C':'C'};
  const troopName={'cavalry':'骑兵','light':'轻步兵','heavy':'重步兵','archer':'弓兵','siege':'攻城器','naval':'水军'};
  const troopIcon={'cavalry':'🐴','light':'⚔','heavy':'🛡','archer':'🏹','siege':'⚙','naval':'⚓'};
  const ri={ruler:'帝主',general:'武将',advisor:'谋士',minister:'文臣'};
  const loyalty=G.genLoyalty?.[genName]??80;
  const loy=loyaltyDisplay(loyalty);
  const chronicle=G.genChronicle?.[genName]||[];
  const unit=G.units.find(u=>u.squads.some(sq=>sq.genName===genName));

  // Header
  document.getElementById('gpmAvatar').style.cssText=`width:52px;height:52px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-size:24px;font-weight:900;flex-shrink:0;background:${col}22;border:1px solid ${col}55;color:${col}`;
  document.getElementById('gpmAvatar').textContent=genName[0];
  document.getElementById('gpmName').style.color=col;
  document.getElementById('gpmName').textContent=genName;
  document.getElementById('gpmSubtitle').textContent=`${fd?.full||''} · ${ri[g.role]||g.role||'武将'} · ${meta.title||''}`;

  // Body
  const statsHtml=`<div class="gpm-stats">
    ${Object.entries({统:['com',g.com],武:['war',g.war],智:['int',g.int],政:['pol',g.pol],魅:['cha',g.cha]}).map(([label,[key,val]])=>`
    <div>
      <div class="gpm-stat-row">
        <div class="gpm-stat-label">${label}</div>
        <div class="gpm-stat-bar-wrap"><div class="gpm-stat-bar" style="width:${val}%;background:${ac(val)}"></div></div>
        <div class="gpm-stat-val" style="color:${ac(val)}">${val}</div>
      </div>
    </div>`).join('')}
  </div>`;

  const aptHtml=`<div class="gpm-apt-row">
    ${Object.entries(g.apt||{}).map(([type,grade])=>`
    <div class="gpm-apt" style="color:${aptColor[grade]};border-color:${aptColor[grade]}44">
      ${troopIcon[type]||''} ${troopName[type]||type}
      <b style="margin-left:2px">${grade}</b>
    </div>`).join('')}
  </div>`;

  const skillsHtml=(meta.skills||[]).map(sk=>`
  <div class="gpm-skill">
    <div class="gpm-skill-name">${sk.icon||'✦'} ${sk.name} <span class="gpm-skill-type">${sk.type}</span></div>
    <div class="gpm-skill-desc">${sk.desc}</div>
  </div>`).join('')||'<div style="font-size:10px;color:rgba(92,74,50,.35)">暂无专属技能</div>';

  const _dynPost = getGenPostDef(genName);
  const _postRank = _dynPost ? (_dynPost.track==='mil' ? '将' : '文官') : '';
  const _postRankCol = _dynPost ? (_dynPost.track==='mil' ? '#e07840' : '#2a7a9a') : '#888';
  const postHtml=_dynPost?`
  <div class="gpm-post">
    <div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span class="gpm-post-name">${_dynPost.name}</span>
        <span style="font-size:8px;padding:1px 5px;border-radius:1px;background:${_postRankCol}22;border:1px solid ${_postRankCol}55;color:${_postRankCol}">${_postRank}·${_dynPost.tier===1?'一品':_dynPost.tier===2?'二品':'三品'}</span>
        ${unit?`<span style="font-size:8px;color:#c03030;border:1px solid rgba(232,60,60,.3);padding:1px 5px">出征中</span>`:''}
      </div>
      ${_dynPost.buffDesc?`<div class="gpm-post-desc">${_dynPost.buffDesc}</div>`:''}
    </div>
  </div>`:'<div style="font-size:10px;color:rgba(92,74,50,.35)">尚未授官</div>';

  // 计算忠诚趋势（粗略估算delta方向）
  const loyAccum = G.loyaltyAccum?.[genName] ?? loyalty;
  const loyDelta = loyAccum - loyalty; // 上旬变化（实际上是累积器与整数的差）
  // ★ v93: 用共享函数计算忠诚趋势（与breakdown弹窗、processLoyalty完全一致）
  const _fid2 = Object.keys(G.generals).find(f => G.generals[f].some(x => x.name === genName)) || fid2;
  const _loyResult = calcLoyaltyDelta(genName, _fid2);
  let _approxDelta = _loyResult.total;

  // ★ v74 派系修正明细
  const _fac2Breakdown = getGenFactionModBreakdown(genName, _fid2);
  // facDelta 已包含在 calcLoyaltyDelta 中，不需要再加

  const trendIcon = _approxDelta > 0.1 ? '↑' : _approxDelta < -0.1 ? '↓' : '→';
  const trendCol = _approxDelta > 0.1 ? '#1a7a3a' : _approxDelta < -0.1 ? '#c03030' : '#888';
  const isPoachable = !!G.recruitableGens?.[genName];

  // ★ v74 派系修正明细HTML（折叠式，仅当有实质影响时显示）
  const _facMod = _fac2Breakdown.currentMod;
  const _facDelta = _fac2Breakdown.facDelta;
  const _facItems = _fac2Breakdown.items;
  let factionBreakdownHtml = '';
  if(_facItems.length > 0 || Math.abs(_facMod) >= 1){
    const modBarW = Math.min(100, Math.abs(_facMod)/20*100);
    const modBarCol = _facMod >= 0 ? '#4ade80' : '#f87171';
    const modSign = _facMod >= 0 ? '+' : '';
    const deltaSign = _facDelta >= 0 ? '+' : '';
    const itemsHtml = _facItems.map(item => {
      const col = item.type==='good' ? '#4ade80' : '#f87171';
      const sign = item.delta >= 0 ? '+' : '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;border-bottom:1px solid rgba(80,65,40,.06)">
        <span style="color:${col};font-size:10px;flex:1">${item.delta>0?'▲':'▼'} ${item.label}</span>
        <span style="color:${col};font-size:10px;font-weight:700;margin-left:8px;flex-shrink:0">${sign}${item.delta.toFixed(2)}/旬</span>
      </div>`;
    }).join('');
    const noItemNote = _facItems.length===0
      ? `<div style="color:rgba(92,74,50,.35);font-size:10px">当前无活跃派系压力</div>` : '';
    factionBreakdownHtml = `
    <details style="margin-top:6px">
      <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;padding:5px 8px;
        background:rgba(255,252,245,.4);border-radius:3px;border:1px solid rgba(80,65,40,.08)">
        <span style="font-size:10px;color:rgba(92,74,50,.55)">🏛 派系修正</span>
        <span style="font-size:10px;color:${modBarCol};font-weight:700">${modSign}${_facMod.toFixed(1)}</span>
        <div style="flex:1;height:3px;background:rgba(80,65,40,.08);border-radius:2px;overflow:hidden">
          <div style="width:${modBarW}%;height:100%;background:${modBarCol};border-radius:2px"></div>
        </div>
        <span style="font-size:10px;color:${modBarCol}">${deltaSign}${_facDelta.toFixed(2)}/旬</span>
        <span style="font-size:9px;color:rgba(92,74,50,.35)">▶</span>
      </summary>
      <div style="padding:6px 8px;background:rgba(80,65,40,.04);border-radius:0 0 3px 3px;border:1px solid rgba(80,65,40,.06);border-top:none">
        <div style="font-size:9px;color:rgba(92,74,50,.40);margin-bottom:5px">每旬 mod 变化 → 累积 mod（±20上限）→ 派系 delta = mod × 0.05</div>
        ${itemsHtml}${noItemNote}
        ${Math.abs(_facMod)>=1 ? `<div style="margin-top:5px;font-size:9px;color:rgba(92,74,50,.35)">
          累积修正 ${modSign}${_facMod.toFixed(1)} → 当前每旬忠诚 ${deltaSign}${_facDelta.toFixed(2)}
          ${Math.abs(_facMod)>=15 ? `（<span style="color:${modBarCol}">已接近饱和</span>）` : ''}
        </div>` : ''}
      </div>
    </details>`;
  }

  const loyaltyHtml=`<div class="gpm-loyalty">
    <div class="gpm-loyalty-icon">${loy.icon}</div>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="gpm-loyalty-label" style="color:${loy.col}">${loy.label}</span>
        <span style="font-size:10px;font-weight:700;color:${trendCol}">${trendIcon}</span>
        <span style="font-size:9px;color:${trendCol}">${_approxDelta>0?'+':''}${_approxDelta.toFixed(1)}/旬</span>
        ${isPoachable?`<span style="font-size:8px;color:#c03030;border:1px solid rgba(192,48,48,.3);padding:1px 5px">⚠可被挖角</span>`:''}
      </div>
      <div class="gpm-loyalty-hint">${loy.hint}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:700;color:${loy.col};font-family:'Noto Serif SC',serif;cursor:pointer" onclick="showLoyaltyBreakdown(event,'${genName}','${_fid2}')">${loyalty}</div>
      <div style="width:52px;height:4px;background:rgba(80,65,40,.10);border-radius:2px;margin-top:3px">
        <div style="width:${loyalty}%;height:100%;background:${loy.col};border-radius:2px;transition:width .3s"></div>
      </div>
    </div>
  </div>`;

  // 士族/乡党
  const badgesHtml=[
    meta.gentry?`<div class="gpm-badge" style="color:#6b5530;border-color:rgba(92,74,50,.35)">🏛 ${meta.gentry}</div>`:'',
    meta.clan?`<div class="gpm-badge" style="color:rgba(44,36,22,.55);border-color:rgba(80,65,40,.15)">🏠 ${meta.clan}</div>`:'',
    meta.faction_clan?`<div class="gpm-badge" style="color:#2a7a9a;border-color:rgba(96,176,224,.3)">🗺 ${meta.faction_clan}派</div>`:'',
  ].filter(Boolean).join('');

  // 小传
  const bioHtml=chronicle.length?
    chronicle.map(e=>`<div class="gpm-bio-entry"><span class="bio-year">${e.yearStr}${e.seasonStr}</span>${e.text}</div>`).join('')
    :'<div style="color:rgba(80,65,40,.15)">尚无事迹记载。</div>';

  // ── 亲密度面板 ──
  const intimacyEntries = [];
  if(G.intimacy){
    const prefix1 = genName + '|';
    const prefix2 = '|' + genName;
    Object.entries(G.intimacy).forEach(([key,val])=>{
      if(!val) return;
      let other = null;
      if(key.startsWith(prefix1)) other = key.slice(prefix1.length);
      else if(key.endsWith(prefix2)) other = key.slice(0, key.length - prefix2.length);
      if(other) intimacyEntries.push({name:other, val});
    });
    intimacyEntries.sort((a,b)=>b.val - a.val);
  }
  // 正向top5（义友及以上，≥20）+ 负向bottom3（不和及以下，≤-20）
  // 过滤掉-19~+19的陌生区间，无信息量
  const intimacyPos = intimacyEntries.filter(e=>e.val>=20).slice(0,5);
  const intimacyNeg = [...intimacyEntries].filter(e=>e.val<=-20).sort((a,b)=>a.val-b.val).slice(0,3);
  const intimacyShow = [...intimacyPos, ...intimacyNeg];

  function renderIntimacyRow({name, val}){
    const rl = getRelationLabel(val);
    const barW = Math.abs(val);
    const barCol = val>=0
      ? (val>=50?'#1a7a3a':val>=20?'rgba(92,74,50,.65)':'rgba(92,74,50,.35)')
      : (val<=-50?'#c03030':val<=-20?'#e07040':'rgba(200,80,40,.4)');
    const sign = val>0?'+':'';
    const otherFid = Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(x=>x.name===name)) || 'wild';
    const otherCol = getFactionDef(otherFid)?.color || '#6b5530';
    return `<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
      <div style="width:26px;height:26px;border-radius:50%;background:${otherCol}18;border:1px solid ${otherCol}44;
        display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-size:11px;
        color:${otherCol};flex-shrink:0">${name[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-family:'Noto Serif SC',serif;font-size:11px;color:${otherCol}">${name}</span>
          <span style="font-size:9px;color:${rl.col}">${rl.icon} ${rl.label}</span>
        </div>
        <div style="height:4px;background:rgba(80,65,40,.06);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${barW}%;background:${barCol};border-radius:2px;transition:width .3s"></div>
        </div>
      </div>
      <span style="font-size:10px;color:${rl.col};min-width:28px;text-align:right;font-weight:700">${sign}${val}</span>
    </div>`;
  }

  const intimacyHtml = intimacyShow.length
    ? (() => {
        let html = '';
        if(intimacyPos.length){
          html += `<div style="font-size:9px;color:rgba(92,74,50,.40);letter-spacing:1px;margin-bottom:5px">── 友好 ──</div>`;
          html += intimacyPos.map(renderIntimacyRow).join('');
        }
        if(intimacyNeg.length){
          html += `<div style="font-size:9px;color:rgba(192,48,48,.3);letter-spacing:1px;margin:8px 0 5px">── 敌对 ──</div>`;
          html += intimacyNeg.map(renderIntimacyRow).join('');
        }
        return html;
      })()
    : '<div style="font-size:10px;color:rgba(80,65,40,.15)">尚无记载在册的深厚情谊或宿仇。</div>';

  document.getElementById('gpmBody').innerHTML=`
    <div class="gpm-sec">五维属性</div>
    ${statsHtml}
    <div style="margin-top:8px">
      <div class="gpm-sec">兵种适性</div>
      ${aptHtml}
    </div>
    ${getRetainers(genName)>0?`<div class="gpm-sec">部曲</div>
    <div style="padding:4px 0;font-size:11px;color:var(--ink-l)">⚔ 私人精锐 <b style="color:#8a7040">${getRetainersDisplay(genName).toLocaleString()}人</b>${getRetainerType(genName)?` · ${TROOP_TYPES[getRetainerType(genName)]?.icon||''} ${TROOP_TYPES[getRetainerType(genName)]?.name||getRetainerType(genName)}`:''} （按Lv10计算战力，影响派系影响力+${Math.floor(getRetainers(genName)/RETAINER_INFLUENCE_DIV)}）</div>`:''}
    <div class="gpm-sec">武将技能</div>
    ${skillsHtml}
    <div class="gpm-sec">官职</div>
    ${postHtml}
    ${g.role === 'ruler' ? '' : `<div class="gpm-sec">忠诚</div>
    ${loyaltyHtml}`}
    ${meta.gentry||meta.clan||meta.faction_clan?`
    <div class="gpm-sec">出身</div>
    <div class="gpm-badge-row">${badgesHtml||'<span style="font-size:10px;color:rgba(92,74,50,.35)">寒门出身，无士族记录</span>'}</div>
    `:''}
    <div class="gpm-sec">亲密度</div>
    <div style="padding:2px 0">${intimacyHtml}</div>
    <div class="gpm-sec">武将小传</div>
    <div class="gpm-bio">${bioHtml}</div>
  `;

  document.getElementById('genProfileModal').style.display='flex';
}

function closeGenProfile(){
  document.getElementById('genProfileModal').style.display='none';
}
