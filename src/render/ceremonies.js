// src/render/ceremonies.js
//
// 典礼渲染 — 拜将大典(任命典礼)
//
// 来源:从 project_romance_v181.html L8269-L8336 整体抽离(Session 2.4 / 阶段 2)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// 抽离的 4 个函数(紧耦合,作为一个典礼子系统抽出):
//   - _applyCeremony(picked, fid):应用典礼效果(忠诚+10 / 统武经验+25 / 全军士气+5)
//     注:此函数 mutates G state(genLoyalty/loyaltyAccum/units.squads.morale),严格
//     算 mechanism。但它仅由本文件的 _confirmCeremony 调用,与 ceremony 渲染流程
//     紧耦合,phase 2.4 一同抽出
//   - _showCeremonyPicker(allCands, fid, title):构造 + 显示多选 picker modal(#ceremonyModal)
//   - _updateCeremonyBtn():checkbox 选择状态联动(已选 N/5 + 确认按钮 enable/disable)
//   - _confirmCeremony(fid):confirm 按钮 onclick handler,调 _applyCeremony + 关闭 modal +
//     renderAllLight
//
// PLAN §三 2.4 说"称帝典礼 / 任命典礼 / 退位典礼 等特殊渲染"。实测 v181 只有"拜将大典"
//(任命典礼)有自定义 render。称帝和退位用 native confirm() dialog,无 ceremony render
// 代码,不抽。
//
// 依赖(同 realm 共享):
//   - 全局数据:G / GEN_MAP
//   - 全局函数(hoisted):addStatExp / log / renderAllLight
//   - DOM 元素:#ceremonyModal(lazy 创建) / #crm-count / #crm-confirm
//   - CSS 类 / 内联 style:在 v181 内联 <style> 中

// ★ v131: D1拜将大典——多选面板
// TODO(phase-3): _applyCeremony is 100% mechanism (verified phase 2 review),
// will be moved to chains/ during phase 3 mechanism extraction.
function _applyCeremony(picked, fid){
  // ★ v133: 标记已封，不再触发
  if(!G._eventFired) G._eventFired={};
  G._eventFired.general_ceremony = G.turn;
  picked.forEach(name=>{
    if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+10);
    if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
    addStatExp(name, 'com', 25);
    addStatExp(name, 'war', 25);
  });
  G.units.filter(u=>u.fac===fid).forEach(u=>{
    u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); });
  });
  log(`🏅 拜将大典：${picked.join('、')}受封，全军振奋`,'event');
}
function _showCeremonyPicker(allCands, fid, title){
  let m = document.getElementById('ceremonyModal');
  if(!m){
    m = document.createElement('div');
    m.id='ceremonyModal';
    m.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
    document.body.appendChild(m);
  }
  const listHtml = allCands.map(name=>{
    const gm = GEN_MAP[name];
    const total = gm ? gm.com+gm.war : 0;
    return `<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-bottom:1px solid rgba(80,65,40,.07);transition:background .15s" onmouseover="this.style.background='rgba(80,65,40,.06)'" onmouseout="this.style.background=''">
      <input type="checkbox" class="crm-cb" value="${name}" onchange="_updateCeremonyBtn()" style="accent-color:#8b6914">
      <span style="font-size:12px;font-family:'Noto Serif SC',serif;color:var(--ink-l)">${name}</span>
      <span style="font-size:9px;color:rgba(92,74,50,.45)">统${gm?.com||0}+武${gm?.war||0}=${total}</span>
    </label>`;
  }).join('');
  m.innerHTML=`<div style="background:rgba(245,238,225,.98);border:1px solid rgba(92,74,50,.4);border-radius:4px;padding:16px 20px;min-width:280px;max-width:380px;box-shadow:0 8px 32px rgba(0,0,0,.6)">
    <div style="font-family:'Noto Serif SC',serif;font-size:14px;color:var(--ink-l);margin-bottom:4px">册封${title}</div>
    <div style="font-size:10px;color:rgba(92,74,50,.55);margin-bottom:8px">从${allCands.length}位候选中选择5人受封（忠各+10，统帅/武力经验各+25，全军士气+5）</div>
    <div id="crm-count" style="font-size:10px;color:#8b6914;margin-bottom:6px">已选 0/5</div>
    <div style="max-height:240px;overflow-y:auto;border:1px solid rgba(80,65,40,.12);border-radius:3px;margin-bottom:10px">${listHtml}</div>
    <div style="text-align:center">
      <button id="crm-confirm" disabled onclick="_confirmCeremony('${fid}')" style="padding:6px 24px;background:rgba(139,105,20,.12);border:1px solid rgba(139,105,20,.4);color:#8b6914;font-family:'Noto Serif SC',serif;font-size:11px;cursor:pointer;border-radius:2px;opacity:.4;transition:opacity .2s">确认册封</button>
    </div>
  </div>`;
  m.style.display='flex';
}
function _updateCeremonyBtn(){
  const cbs = document.querySelectorAll('.crm-cb');
  const checked = [...cbs].filter(cb=>cb.checked);
  const countEl = document.getElementById('crm-count');
  const btn = document.getElementById('crm-confirm');
  if(countEl) countEl.textContent = `已选 ${checked.length}/5`;
  if(btn){
    btn.disabled = checked.length !== 5;
    btn.style.opacity = checked.length === 5 ? '1' : '.4';
  }
  // 选满5个后禁止继续勾选
  cbs.forEach(cb=>{
    if(!cb.checked) cb.disabled = checked.length >= 5;
  });
}
function _confirmCeremony(fid){
  const cbs = document.querySelectorAll('.crm-cb:checked');
  const picked = [...cbs].map(cb=>cb.value);
  if(picked.length !== 5) return;
  _applyCeremony(picked, fid);
  const m = document.getElementById('ceremonyModal');
  if(m) m.style.display='none';
  renderAllLight();
}
