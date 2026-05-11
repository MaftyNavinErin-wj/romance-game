// src/render/battle_anim.js
//
// 渲染层(R)— 战斗动画 cluster (4.10 最高风险, phase 4 收官 sub-session).
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.10)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// 4.10 是渲染层第二轮的 🔴 最高风险 sub-session(战斗动画 setTimeout 链 + 时序耦合)。
// 战斗动画 cluster 是 v181 桶 3 渲染层最复杂 block:
//   L1665-L4233 (2569 行) 单连续 block, 含 1 let + 1 const + 11 顶层函数 + 1 IIFE (14 内部 helper)
// _battleAnimating let (L1668) 是 anim 专属 lock, 跟 cluster 一起搬 (设计决策 approve, 制作人 2026-05-09)。
// _execInstantMarch (v181 L4252) 留 v181 — plan §11 边界 (玩家行军核心, 同 cluster 下游 _collectPlayerVisibleKeys/_animateFogReveal/_checkInstantBattleTrigger 同质留 v181)。
//
// ── 抽离范围(1 段连续 block)──
//   R4.10 战斗动画 cluster                                    v181 L1665-L4233  (2569 行)
//                                                1 let:    _battleAnimating
//                                                1 const:  DUEL_EPITHET (16 名将称号表)
//                                                11 顶层函数:
//                                                  _drainPendingBattleAnimations (动画队列消费器)
//                                                  _getDuelEpithet (DUEL_EPITHET 取值 helper)
//                                                  _playDuelPreludeAnim (单挑前奏)
//                                                  _baGetUnitRenderPos (部队渲染位置)
//                                                  _playBattleCollisionAnim (野战碰撞)
//                                                  _baDrawCampPalisade (营寨栅栏画)
//                                                  _playCampBattleAnim (营寨战, 含夜袭模式)
//                                                  _playAmbushBattleAnim (伏击战)
//                                                  _playSiegeBattleAnim (攻城战)
//                                                  _playNavalBattleAnim (水战)
//                                                  _siegeArrivalChoice (围城到达 confirm)
//                                                1 IIFE:   _baCore (14 内部 helper)
//                                                  SVG_NS / EASE 常量
//                                                  runTween / startTween (tween 引擎)
//                                                  shouldSkip (动画跳过判断)
//                                                  ensureAnimLayer (SVG layer 创建)
//                                                  spawnClashRing / spawnSlashes / spawnSparks /
//                                                    spawnClashMark / shakeMapSvg
//                                                  spawnLossText / floatLossText
//                                                  makePhantom / makeShipPhantom (部队 / 战船幻影)
//                                                  spawnResultText / animateResultText
//                                                  cleanupAnimLayers
//
// 函数总数: **11 顶层 + 14 内部 helper = 25 函数 + 1 IIFE 入口 + 1 let + 1 const**
//
// ── 加载顺序约束 ──
// 必须在以下文件之后加载(直读 G + 调用其中函数 / let):
//   src/core/state.js        (G state)
//   src/data/*               (FAC / GENS_FULL / HEX_TERRAIN 等)
//   src/core/helpers.js      (hexToPixel / hkey / fmt 等)
//   src/core/map.js          (_mapScale 等)
//   src/chains/military.js   (_pendingBattleAnimations / _pendingBattleConfirms /
//                             _currentBattleConfirm / _battleReports / _marchAnimating lets,
//                             getUnitTroops / resolveSiegeBattle 等)
//   src/render/notifications.js (log)
//   src/render/battle_modals.js (_showNextBattleConfirm / showNextBattleReport 等 callback)
//   src/render/tabs.js       (renderAll, 注:仍在 v181 inline)
//
// 必须在以下加载之前 / 平级:
//   v181 inline (renderAll / _execInstantMarch / _collectPlayerVisibleKeys /
//                _animateFogReveal / _checkInstantBattleTrigger 等仍在 v181)
//
// ── 时序敏感 ──
// **本 cluster 是 phase 4 唯一时序敏感 cluster** (其他 sub-session 均为静态 render)。
// _battleAnimating lock + _drainPendingBattleAnimations 队列 + _fastForward 快进路径
// 之间的时序约束在 v181 起步时就 latent, 任何 byte-identical smoke PASS 不能完整 verify。
// **smoke vs main byte-identical 是必要不充分**, 完整战斗实机测 (ambush/camp/siege/duel/naval)
// 是 phase 4 plan §五强制要求。
//

// ─── v173 战斗碰撞动画 ─────────────────────────────────────
// 纯视觉，不改变任何战斗数学；在 confirmBattle 内、resolve 之后、弹战报之前 await
// 触发前提由调用方判断（快进/非野战/AI vs AI 等都不进入本函数)
let _battleAnimating = false;

// ★ v175: 被动战斗（AI 主动攻玩家）的动画请求队列。
// 问题：aiInitiateBattle 在 runAI 链中被调用，此时 nextTurn 已经把 mapRoot remove 掉（v115 优化），
//       动画无法挂载。解决：把请求 push 进此队列，由 runAI 结束后 renderAll 完成再逐个播。
// 结构：{ kind: 'camp'|'ambush'|'battle'|'siege'|'naval', report, attackers, defenders, posSnap }
// 军事链 M_LET _pendingBattleAnimations (L13467) 已抽离到 src/chains/military.js

/**
 * 逐个播放 _pendingBattleAnimations 里的动画，等全部完成后 resolve。
 * 调用方：nextTurn 在 renderAll 之后、战报弹窗之前 await 一次。
 * @returns {Promise<void>}
 */
async function _drainPendingBattleAnimations(){
  if(_fastForward){ _pendingBattleAnimations = []; return; }
  // ★ v175: 等待阻塞性弹窗（事件 modal、围城到达等）关闭再播动画
  // 否则事件 modal 还在，动画在背后跑，视觉上互相干扰
  let _waitCycles = 0;
  while((G._pendingEvent || _pendingSiegeArrival) && _waitCycles < 600){  // 最多等 60s
    await sleep(100);
    _waitCycles++;
  }
  while(_pendingBattleAnimations.length){
    const req = _pendingBattleAnimations.shift();
    try {
      if(req.kind === 'camp' && typeof _playCampBattleAnim === 'function'){
        await _playCampBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
      } else if(req.kind === 'ambush' && typeof _playAmbushBattleAnim === 'function'){
        await _playAmbushBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
      } else if(req.kind === 'siege' && typeof _playSiegeBattleAnim === 'function'){
        await _playSiegeBattleAnim(req.report, req.attackers, req.defenders, req.posSnap, req.city);
      } else if(req.kind === 'naval' && typeof _playNavalBattleAnim === 'function'){
        await _playNavalBattleAnim(req.report, req.attackers, req.defenders, req.posSnap);
      }
      // 其他 kind：保留扩展位
    } catch(e){
      console.error('[drainAnim] kind=' + req.kind + ' failed:', e);
    }
  }
}

// ═════════════════════════════════════════════════════════════
// v174: _baCore — 战斗动画共享基础设施
// ─────────────────────────────────────────────────────────────
// 目的：抽出 v173 两个动画函数内部重复的 EASE / runTween / 特效生成器，
//       为后续 v175-v178 的营寨/伏击/攻城/水战动画提供统一工具。
// 原则：纯工具（除 cleanupAnimLayers 会动 DOM 外，不持有状态）；
//       _battleAnimating 锁继续全局，不进 _baCore；
//       所有函数都以 animG 为挂载点，由调用方负责 animG 的创建/销毁。
// ═════════════════════════════════════════════════════════════
const _baCore = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const EASE = {
    linear:    t => t,
    easeOut:   t => 1 - Math.pow(1 - t, 2),
    easeIn:    t => t * t,
    easeInOut: t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2,
  };

  /**
   * 插值动画，rAF 驱动。支持 abort（保留 v173 BattleCollision 的健壮实现）。
   * @returns {Promise<void>}
   */
  function runTween(duration, onUpdate, easing){
    return new Promise(resolve => {
      const ease = EASE[easing] || EASE.easeOut;
      const start = performance.now();
      let raf = 0, aborted = false;
      const tick = () => {
        if(aborted) return;
        const now = performance.now();
        const t = Math.min(1, (now - start) / duration);
        try { onUpdate(ease(t), t); } catch(e){ console.error('[_baCore.runTween] onUpdate failed:', e); }
        if(t >= 1){ resolve(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
  }

  /** 启动式 tween：不 await，用于并行副特效。 */
  function startTween(duration, onUpdate, easing){
    runTween(duration, onUpdate, easing);
  }

  /**
   * 统一跳过条件判定。
   * @returns {boolean} true = 应该跳过（不播动画，直接 return）
   */
  function shouldSkip(attackers, defenders, report, posSnap){
    if(_fastForward) return true;
    if(_battleAnimating) return true;
    if(!attackers || !defenders || attackers.length === 0 || defenders.length === 0) return true;
    // AI vs AI：双方都非玩家方 → 不播
    const hasPlayer = attackers.some(u => u.fac === G.playerFac) || defenders.some(u => u.fac === G.playerFac);
    if(!hasPlayer) return true;
    // 迷雾：至少一个参战 unit 战前位置在玩家 VISIBLE hex
    const pFog = G.fog?.[G.playerFac];
    if(pFog){
      const _all = [...attackers, ...defenders];
      const anyVisible = _all.some(u => {
        const snap = posSnap?.[u.id];
        const hq = snap ? snap.hq : (u.hq??0);
        const hr = snap ? snap.hr : (u.hr??0);
        return pFog[hkey(hq, hr)] === FOG_VISIBLE;
      });
      if(!anyVisible) return true;
    }
    if(!document.getElementById('mapRoot')) return true;
    return false;
  }

  /**
   * 创建动画挂载层。
   * @param {string} className 清理标识（e.g. 'battle-anim-layer'）
   * @returns {{animG, mapRoot, invS} | null}
   */
  function ensureAnimLayer(className){
    const mapRoot = document.getElementById('mapRoot');
    if(!mapRoot) return null;
    // 先清残留（防御性）
    mapRoot.querySelectorAll('.' + className).forEach(el => el.remove());
    const animG = document.createElementNS(SVG_NS, 'g');
    animG.setAttribute('class', className);
    animG.setAttribute('pointer-events', 'none');
    mapRoot.appendChild(animG);
    const invS = 1 / (_mapScale || 1);
    return { animG, mapRoot, invS };
  }

  // ── 特效：朱砂扩散环 ──
  function spawnClashRing(animG, mx, my, opts){
    opts = opts || {};
    const color = opts.color || 'rgba(200,80,50,.75)';
    const maxR = opts.maxR ?? 22;  // 默认按 invS=1 的基准 22
    const duration = opts.duration ?? 700;
    const invS = opts.invS ?? 1;
    const strokeWidth = opts.strokeWidth ?? 1.2;

    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', mx.toFixed(2));
    ring.setAttribute('cy', my.toFixed(2));
    ring.setAttribute('r', (2 * invS).toFixed(2));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', (strokeWidth * invS).toFixed(2));
    ring.setAttribute('opacity', '.85');
    animG.appendChild(ring);
    startTween(duration, (te) => {
      ring.setAttribute('r', ((2 + (maxR-2)*te) * invS).toFixed(2));
      ring.setAttribute('opacity', (.85 * (1-te)).toFixed(3));
    }, 'easeOut');
  }

  // ── 特效：墨灰梭形刀光（扇形分布） ──
  function spawnSlashes(animG, mx, my, opts){
    opts = opts || {};
    const angles = opts.angles || [30, 90, 150];
    const color = opts.color || 'rgba(44,36,22,.9)';
    const invS = opts.invS ?? 1;
    const stagger = opts.stagger ?? 50;
    const halfLen = opts.halfLen ?? 8;     // 单边长度 * invS
    const halfW = opts.halfW ?? 1.2;       // 中间半宽 * invS
    const lifeMs = opts.lifeMs ?? 200;

    angles.forEach((deg, idx) => {
      const rad = deg * Math.PI / 180;
      const slash = document.createElementNS(SVG_NS, 'path');
      slash.setAttribute('fill', color);
      slash.setAttribute('opacity', '0');
      animG.appendChild(slash);
      setTimeout(() => {
        if(!slash.parentNode) return;  // 已被清理
        startTween(lifeMs, (te) => {
          let scale, opacity;
          if(te < 0.3){ scale = te/0.3; opacity = .9; }
          else if(te < 0.6){ scale = 1; opacity = .9; }
          else { scale = 1; opacity = .9 * (1 - (te-0.6)/0.4); }
          const L = halfLen * invS * scale;
          const W = halfW * invS * scale;
          const dx = Math.cos(rad), dy = Math.sin(rad);
          const px = -dy, py = dx;
          const p1x = mx + dx*L, p1y = my + dy*L;
          const p2x = mx + px*W, p2y = my + py*W;
          const p3x = mx - dx*L, p3y = my - dy*L;
          const p4x = mx - px*W, p4y = my - py*W;
          slash.setAttribute('d', `M${p1x.toFixed(2)},${p1y.toFixed(2)} L${p2x.toFixed(2)},${p2y.toFixed(2)} L${p3x.toFixed(2)},${p3y.toFixed(2)} L${p4x.toFixed(2)},${p4y.toFixed(2)} Z`);
          slash.setAttribute('opacity', opacity.toFixed(3));
        }, 'linear');
      }, idx * stagger);
    });
  }

  // ── 特效：火星/水花（粒子爆发） ──
  function spawnSparks(animG, mx, my, opts){
    opts = opts || {};
    const count = opts.count ?? 6;
    const colors = opts.colors || ['rgba(255,200,80,.95)', 'rgba(255,130,50,.95)'];
    const invS = opts.invS ?? 1;
    const distRange = opts.distRange || [10, 18];  // base px，会乘 invS
    const startR = (opts.startR ?? 1.8) * invS;
    const endR = (opts.endR ?? 0.5) * invS;
    const lifeMs = opts.lifeMs ?? 350;

    for(let i = 0; i < count; i++){
      const baseAngle = (i / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.6;
      const ang = baseAngle + jitter;
      const dist = (distRange[0] + Math.random() * (distRange[1]-distRange[0])) * invS;
      const fx = Math.cos(ang), fy = Math.sin(ang);

      const spark = document.createElementNS(SVG_NS, 'circle');
      spark.setAttribute('cx', mx.toFixed(2));
      spark.setAttribute('cy', my.toFixed(2));
      spark.setAttribute('r', startR.toFixed(2));
      spark.setAttribute('fill', colors[i % colors.length]);
      spark.setAttribute('opacity', '1');
      animG.appendChild(spark);

      startTween(lifeMs, (te) => {
        const d = dist * te;
        const r = startR + (endR - startR) * te;
        const op = 1 - te*te;
        spark.setAttribute('cx', (mx + fx*d).toFixed(2));
        spark.setAttribute('cy', (my + fy*d).toFixed(2));
        spark.setAttribute('r', r.toFixed(2));
        spark.setAttribute('opacity', op.toFixed(3));
      }, 'easeOut');
    }
  }

  // ── 特效：⚔ 碰撞标记（围绕 mx,my 缩放） ──
  function spawnClashMark(animG, mx, my, opts){
    opts = opts || {};
    const duration = opts.duration ?? 1200;

    const mark = document.createElementNS(SVG_NS, 'text');
    mark.setAttribute('x', mx.toFixed(2));
    mark.setAttribute('y', (my+1).toFixed(2));
    mark.setAttribute('text-anchor', 'middle');
    mark.setAttribute('dominant-baseline', 'middle');
    mark.setAttribute('class', 'ba-clash-mark');
    mark.setAttribute('opacity', '0');
    mark.textContent = '⚔';
    animG.appendChild(mark);
    startTween(duration, (te) => {
      let scale, opacity;
      if(te < 0.35){ const t1=te/0.35; scale = 0.3 + (1.4-0.3)*t1; opacity = t1; }
      else if(te < 0.7){ const t2=(te-0.35)/0.35; scale = 1.4 + (1-1.4)*t2; opacity = 1; }
      else { const t3=(te-0.7)/0.3; scale = 1 + 0.1*t3; opacity = 1 - t3; }
      const tx = mx * (1 - scale);
      const ty = (my+1) * (1 - scale);
      mark.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(3)})`);
      mark.setAttribute('opacity', opacity.toFixed(3));
    }, 'linear');
  }

  // ── 地图震动：mapSvg CSS transform（根 SVG 对 CSS transform 安全） ──
  function shakeMapSvg(opts){
    opts = opts || {};
    const amp = opts.amplitude ?? 2;
    const duration = opts.duration ?? 320;
    const mapSvg = document.getElementById('mapSvg');
    if(!mapSvg || typeof mapSvg.animate !== 'function') return;
    try {
      mapSvg.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(${(-amp).toFixed(2)}px)` },
        { transform: `translateX(${(amp*0.75).toFixed(2)}px)` },
        { transform: `translateX(${(-amp*0.3).toFixed(2)}px)` },
        { transform: 'translateX(0)' },
      ], { duration, easing: 'ease-out' });
    } catch(_){}
  }

  // ── HUD: 损失飘字（配色按玩家/敌方分色）──
  function spawnLossText(animG, x, y, lost, isPlayer, invS){
    invS = invS ?? 1;
    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', x.toFixed(2));
    txt.setAttribute('y', y.toFixed(2));
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', 'Noto Serif SC,serif');
    txt.setAttribute('font-size', Math.max(5, 8*invS).toFixed(2));
    txt.setAttribute('font-weight', '900');
    txt.setAttribute('opacity', '0');
    if(isPlayer){
      txt.setAttribute('fill', 'rgba(255,245,225,1)');
      txt.setAttribute('stroke', '#c03030');
      txt.setAttribute('stroke-width', (1.2*invS).toFixed(2));
    } else {
      txt.setAttribute('fill', '#c03030');
      txt.setAttribute('stroke', 'rgba(255,245,225,1)');
      txt.setAttribute('stroke-width', (1.2*invS).toFixed(2));
    }
    txt.setAttribute('paint-order', 'stroke');
    txt.textContent = '-' + lost;
    animG.appendChild(txt);
    return txt;
  }

  /** 飘字：向上漂移 + 渐显渐隐（默认 1700ms 长曲线，来自 v173 反馈）*/
  function floatLossText(el, startY, duration, invS){
    invS = invS ?? 1;
    duration = duration ?? 1700;
    return runTween(duration, (te) => {
      let y = startY, op = 0;
      if(te < 0.12){
        const t1 = te/0.12;
        y = startY - 3*invS*t1;
        op = t1;
      } else if(te < 0.80){
        const t2 = (te-0.12)/0.68;
        y = startY - 3*invS - 10*invS*t2;
        op = 1;
      } else {
        const t3 = (te-0.80)/0.20;
        y = startY - 13*invS - 9*invS*t3;
        op = 1 - t3;
      }
      el.setAttribute('y', y.toFixed(2));
      el.setAttribute('opacity', op.toFixed(3));
    }, 'linear');
  }

  /**
   * 创建"幻影旗帜"（陆战通用），视觉与主项目地图上的 unit 旗帜一致。
   * @param {SVGGElement} animG 挂载层
   * @param {Object} unit 部队对象（需要 fac, squads[0].genName, 可用 getUnitTroops）
   * @param {{x,y}} startPos 起始位置
   * @param {number} invS 反抵消 _mapScale 的缩放因子（1/_mapScale）
   * @param {number} [presetTroops] §5.10 fix: 战前 troops snapshot (来自 posSnap[unit.id].troops); 不传则 fallback live squad.troops (向后兼容 + 防御 snap 缺漏)
   * @returns {SVGGElement} 幻影 g 元素；内部 .ba-inner 负责 scale
   */
  function makePhantom(animG, unit, startPos, invS, presetTroops){
    invS = invS ?? 1;
    const FLAG_W = 28, FLAG_H = 16, POLE_H = 18;
    const FAC_FLAG_COL = {
      wei:  'rgba(220,235,248,.95)',
      shu:  'rgba(220,242,228,.95)',
      wu:   'rgba(248,225,222,.95)',
      nanman:'rgba(248,240,210,.95)',
    };
    const col = (typeof FAC !== 'undefined' && FAC[unit.fac]?.color) || '#888';
    const darkFill = FAC_FLAG_COL[unit.fac] || 'rgba(240,235,220,.95)';
    const gname = unit.squads?.[0]?.genName || '?';
    const dispName = gname.length > 2 ? gname.slice(0,2) : gname;
    // §5.10 fix (sprint_followup): presetTroops 战前 snapshot 优先, 防 phantom 创建时 squad.troops 已被 resolveBattle mutate 战后值
    // 跟 §5.1 fix 同模式 (defensive at site, 用 snap 字段而非 live state)
    const total = (presetTroops != null) ? presetTroops
      : ((typeof getUnitTroops === 'function') ? getUnitTroops(unit) : (unit.squads?.reduce((s,sq)=>s+(sq.troops||0),0) || 0));
    const troopStr = total >= 10000 ? (total/10000).toFixed(1)+'万' : String(total);

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${startPos.x.toFixed(2)} ${startPos.y.toFixed(2)})`);
    g.innerHTML = `<g class="ba-inner" transform="scale(${invS.toFixed(4)})">
      <ellipse rx="4" ry="1.5" fill="rgba(80,65,40,.15)"/>
      <line x1="0" y1="0" x2="0" y2="${-(POLE_H+2)}" stroke="rgba(80,65,40,.3)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="0" y2="${-(POLE_H+2)}" stroke="rgba(80,65,40,.6)" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="${-FLAG_W/2}" y="${-(POLE_H+FLAG_H)}" width="${FLAG_W}" height="${FLAG_H}" rx="2"
        fill="${darkFill}" stroke="${col}" stroke-width="1.8"/>
      <rect x="${-FLAG_W/2}" y="${-(POLE_H+FLAG_H)}" width="${FLAG_W}" height="3" rx="1" fill="${col}" opacity=".35"/>
      <text x="0" y="${-(POLE_H+FLAG_H/2)+1}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Noto Serif SC,serif" font-size="9.5" fill="rgba(240,228,195,1)" font-weight="700"
        stroke="rgba(0,0,0,.65)" stroke-width="1.8" paint-order="stroke">${dispName}</text>
      <rect x="${-FLAG_W/2+1}" y="${-POLE_H-1}" width="${FLAG_W-2}" height="8" rx="1.5" fill="rgba(0,0,0,.65)"/>
      <text x="0" y="${-POLE_H+5}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Noto Serif SC,serif" font-size="6.5" font-weight="600"
        fill="rgba(255,240,200,.92)">${troopStr}</text>
    </g>`;
    animG.appendChild(g);
    return g;
  }

  /**
   * 创建"船型幻影"（水战专用）。船身 + 桅 + 三角帆 + 名字 + 兵力条。
   * 视觉定位同 makePhantom：主 g 的 translate 为锚点，内部 .ba-inner scale(invS) 反抵消地图缩放。
   * @param {SVGGElement} animG 挂载层
   * @param {Object} unit 部队对象（需 fac, squads[0].genName）
   * @param {{x,y}} startPos 起始位置
   * @param {number} invS 1/_mapScale
   * @returns {SVGGElement}
   */
  function makeShipPhantom(animG, unit, startPos, invS, presetTroops){
    invS = invS ?? 1;
    const HULL_W = 22, HULL_H = 7;
    const MAST_H = 12;
    const SAIL_W = 14, SAIL_H = 10;
    const FAC_SAIL_COL = {
      wei:  'rgba(220,235,248,.95)',
      shu:  'rgba(220,242,228,.95)',
      wu:   'rgba(248,225,222,.95)',
      nanman:'rgba(248,240,210,.95)',
    };
    const col = (typeof FAC !== 'undefined' && FAC[unit.fac]?.color) || '#888';
    const sailFill = FAC_SAIL_COL[unit.fac] || 'rgba(240,235,220,.95)';
    const gname = unit.squads?.[0]?.genName || '?';
    const dispName = gname.length > 2 ? gname.slice(0,2) : gname;
    // §5.10 fix: 战前 troops snapshot 优先 (跟 makePhantom 同模式)
    const total = (presetTroops != null) ? presetTroops
      : ((typeof getUnitTroops === 'function') ? getUnitTroops(unit) : (unit.squads?.reduce((s,sq)=>s+(sq.troops||0),0) || 0));
    const troopStr = total >= 10000 ? (total/10000).toFixed(1)+'万' : String(total);

    // 船身 y=0 作为水面线，船身向下凸，桅+帆向上
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${startPos.x.toFixed(2)} ${startPos.y.toFixed(2)})`);
    // 三角帆顶点 (0, -MAST_H-SAIL_H)，底边两端 (-SAIL_W/2, -MAST_H+1) 和 (SAIL_W/2, -MAST_H+1)
    const sailTopY = -(MAST_H + SAIL_H);
    const sailBotY = -MAST_H + 1;
    g.innerHTML = `<g class="ba-inner" transform="scale(${invS.toFixed(4)})">
      <ellipse rx="13" ry="1.2" cy="${HULL_H/2+1}" fill="rgba(180,200,220,.55)"/>
      <path d="M${-HULL_W/2} 0 Q${-HULL_W/2+1} ${HULL_H} 0 ${HULL_H} Q${HULL_W/2-1} ${HULL_H} ${HULL_W/2} 0 Z"
        fill="${sailFill}" stroke="${col}" stroke-width="1.4" opacity=".92"/>
      <rect x="${-HULL_W/2+1}" y="-0.5" width="${HULL_W-2}" height="1.5" fill="${col}" opacity=".55"/>
      <line x1="0" y1="0" x2="0" y2="${-MAST_H}" stroke="rgba(60,42,22,.85)" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M0 ${sailTopY} L${SAIL_W/2} ${sailBotY} L${-SAIL_W/2} ${sailBotY} Z"
        fill="${sailFill}" stroke="${col}" stroke-width="1.6" opacity=".95"/>
      <text x="0" y="${(sailTopY + sailBotY)/2 + 1}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Noto Serif SC,serif" font-size="6.5" fill="rgba(30,22,10,.92)" font-weight="700">${dispName}</text>
      <rect x="${-HULL_W/2+2}" y="${HULL_H+2.5}" width="${HULL_W-4}" height="6" rx="1.2" fill="rgba(0,0,0,.65)"/>
      <text x="0" y="${HULL_H+6.5}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Noto Serif SC,serif" font-size="5.2" font-weight="600"
        fill="rgba(255,240,200,.92)">${troopStr}</text>
    </g>`;
    animG.appendChild(g);
    return g;
  }

  /** 结果大字（用于营寨"奇袭得手"、伏击"伏击得手"、攻城"城破/退敌"等）*/
  function spawnResultText(animG, mx, my, text, color, invS){
    invS = invS ?? 1;
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', mx.toFixed(2));
    t.setAttribute('y', my.toFixed(2));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', 'Noto Serif SC,serif');
    t.setAttribute('font-size', (16*invS).toFixed(2));  // 原型 24px @ 无缩放；主项目 invS 缩放
    t.setAttribute('font-weight', '900');
    t.setAttribute('fill', color);
    t.setAttribute('stroke', 'rgba(245,232,200,1)');
    t.setAttribute('stroke-width', (1.4*invS).toFixed(2));
    t.setAttribute('paint-order', 'stroke');
    t.setAttribute('opacity', '0');
    t.textContent = text;
    animG.appendChild(t);
    return t;
  }

  /** 结果大字标准动画（fadeIn → hold → fadeOut，scale 0.6→1.05）*/
  function animateResultText(el, mx, my, duration){
    duration = duration ?? 1200;
    return runTween(duration, (te) => {
      const op = te<0.15 ? te/0.15 : te<0.8 ? 1 : 1-(te-0.8)/0.2;
      const scale = te<0.3 ? 0.6+0.45*(te/0.3) : 1.05;
      el.setAttribute('transform', `translate(${(mx*(1-scale)).toFixed(2)} ${(my*(1-scale)).toFixed(2)}) scale(${scale.toFixed(3)})`);
      el.setAttribute('opacity', op.toFixed(3));
    }, 'linear');
  }

  /**
   * 兜底清理：扫 mapRoot 清所有指定 class 的动画层，同时恢复 unitsLayer 里
   * visibility:hidden 的 unit（动画异常时避免部队消失）。
   * @param {string[]} classNames
   */
  function cleanupAnimLayers(classNames){
    try {
      const mapRoot = document.getElementById('mapRoot');
      if(mapRoot){
        (classNames || []).forEach(cls => {
          mapRoot.querySelectorAll('.' + cls).forEach(el => el.remove());
        });
      }
      const unitsLayer = document.getElementById('unitsLayer');
      if(unitsLayer){
        unitsLayer.querySelectorAll('g[style*="visibility: hidden"]').forEach(g => {
          g.style.visibility = '';
        });
      }
    } catch(_){}
  }

  return {
    SVG_NS, EASE,
    runTween, startTween,
    shouldSkip, ensureAnimLayer,
    spawnClashRing, spawnSlashes, spawnSparks, spawnClashMark, shakeMapSvg,
    spawnLossText, floatLossText, spawnResultText, animateResultText,
    makePhantom, makeShipPhantom,
    cleanupAnimLayers,
  };
})();

// ─── v173 叫阵前奏：核心名将称号表（演义常用全称）───
// 不在此表中的武将使用简化文案 "${name}在此"
const DUEL_EPITHET = {
  '关羽':'美髯公关云长',
  '张飞':'燕人张翼德',
  '赵云':'常山赵子龙',
  '吕布':'飞将吕奉先',
  '马超':'锦马超',
  '黄忠':'老将黄汉升',
  '许褚':'虎痴许仲康',
  '典韦':'古之恶来典韦',
  '张辽':'雁门张文远',
  '夏侯惇':'盲夏侯元让',
  '夏侯渊':'妙才夏侯渊',
  '孙策':'小霸王孙伯符',
  '甘宁':'锦帆甘兴霸',
  '太史慈':'东莱太史子义',
  '周泰':'幼平周泰',
};

/** 获取武将喊话的自称文本（核心名将用全称号，其他用名字）*/
function _getDuelEpithet(name){
  return DUEL_EPITHET[name] || name;
}

/**
 * 播放叫阵单挑前奏动画（2000ms）
 * @param {Object} duel activeDuel 对象（含 atkName, defName, outcome, duelKillResult）
 * @param {Object} atkPos {x, y} 挑战方所在 unit 的渲染位置
 * @param {Object} defPos {x, y} 应战方所在 unit 的渲染位置
 * @returns {Promise<void>}
 * 异常/不满足条件直接 resolve，不阻塞后续战斗结算
 */
async function _playDuelPreludeAnim(duel, atkPos, defPos){
  try {
    if(_fastForward) return;
    if(_battleAnimating) return;
    if(!duel || !duel.atkName || !duel.defName || !duel.outcome) return;

    const mapRoot = document.getElementById('mapRoot');
    if(!mapRoot) return;

    _battleAnimating = true;

    // 清残留
    mapRoot.querySelectorAll('.duel-prelude-layer').forEach(el => el.remove());

    const ns = 'http://www.w3.org/2000/svg';
    const animG = document.createElementNS(ns, 'g');
    animG.setAttribute('class', 'duel-prelude-layer');
    animG.setAttribute('pointer-events', 'none');
    mapRoot.appendChild(animG);

    const invS = 1 / (_mapScale || 1);

    // 中点
    const mx = (atkPos.x + defPos.x) / 2;
    const my = (atkPos.y + defPos.y) / 2;

    // 挑战方/应战方的最终站位：中点向各自方向偏 18px
    const dx_a = atkPos.x - mx, dy_a = atkPos.y - my;
    const len_a = Math.hypot(dx_a, dy_a) || 1;
    const off = 18 * invS;
    const atkStandX = mx + (dx_a/len_a) * off;
    const atkStandY = my + (dy_a/len_a) * off;
    const defStandX = mx - (dx_a/len_a) * off;
    const defStandY = my - (dy_a/len_a) * off;

    // v173: 圆形纹章令牌尺寸（势力色外圈+深色内圈+武将名）
    const NP_R = 11;        // 令牌半径
    const NP_OFFSET_Y = 0;  // 令牌相对 unit 位置的 Y 偏移（0=与 unit 对齐）

    // v174: tween 辅助通过 _baCore 复用（替代内联）
    // 保留 _runTween / _startTween 两个本地别名，避免修改函数体内所有调用点
    const _runTween = _baCore.runTween;
    const _startTween = _baCore.startTween;

    // 创建武将令牌（圆形纹章：势力色外圈 + 墨色内圈 + 武将名）
    const makeNameplate = (name, fac, startPos) => {
      const col = FAC[fac]?.color || '#888';
      const disp = name.length > 2 ? name.slice(0,2) : name;
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', `translate(${startPos.x.toFixed(2)} ${startPos.y.toFixed(2)})`);
      // 双圈结构：外圈势力色粗边，内圈墨底，武将名米白色
      g.innerHTML = `<g class="np-inner" transform="scale(${invS.toFixed(4)})">
        <circle cx="0" cy="0" r="${NP_R+1}" fill="rgba(0,0,0,.18)"/>
        <circle cx="0" cy="0" r="${NP_R}" fill="rgba(44,36,22,.92)" stroke="${col}" stroke-width="2"/>
        <circle cx="0" cy="0" r="${NP_R-2.2}" fill="none" stroke="${col}" stroke-width=".5" opacity=".6"/>
        <text x="0" y="1"
          text-anchor="middle" dominant-baseline="middle"
          font-family="Noto Serif SC,serif" font-size="9" fill="rgba(245,232,200,1)" font-weight="900"
          letter-spacing="-1">${disp}</text>
      </g>`;
      animG.appendChild(g);
      return g;
    };

    // 获取挑战/应战方的势力（从 unit 推断——但 duel 里只有 name，需要查 GEN_MAP）
    // 简化：直接从 G.units 里找该武将所属部队的势力
    const findFacByName = (genName) => {
      for(const u of G.units){
        for(const sq of u.squads){
          if(sq.genName === genName) return u.fac;
        }
      }
      return G.playerFac; // fallback
    };
    const atkFac = findFacByName(duel.atkName);
    const defFac = findFacByName(duel.defName);

    // 起始位置（从各自阵列位置出来）
    const atkNp = makeNameplate(duel.atkName, atkFac, atkPos);
    const defNp = makeNameplate(duel.defName, defFac, defPos);

    // ── Phase A0 (0-400ms)：两将出阵 ──
    await Promise.all([
      _runTween(400, (te) => {
        const cx = atkPos.x + (atkStandX - atkPos.x) * te;
        const cy = atkPos.y + (atkStandY - atkPos.y) * te;
        atkNp.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeOut'),
      _runTween(400, (te) => {
        const cx = defPos.x + (defStandX - defPos.x) * te;
        const cy = defPos.y + (defStandY - defPos.y) * te;
        defNp.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeOut'),
    ]);

    // ── Phase A1 (400-1100ms)：隔空喊话 ──
    // 挑战方喊话文本
    const atkEpithet = _getDuelEpithet(duel.atkName);
    const defEpithet = _getDuelEpithet(duel.defName);
    const atkShout = `${atkEpithet}在此！谁敢与我一战！`;
    const defShout = `${defEpithet}来也！`;

    const makeShoutText = (text, anchorX, anchorY, isLeft) => {
      const t = document.createElementNS(ns, 'text');
      // 挑战方文字在其名牌下方；应战方同样
      t.setAttribute('x', anchorX.toFixed(2));
      t.setAttribute('y', (anchorY + 6 * invS).toFixed(2));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', 'Noto Serif SC,serif');
      t.setAttribute('font-size', (6.5 * invS).toFixed(2));
      t.setAttribute('font-weight', '700');
      t.setAttribute('fill', 'rgba(44,36,22,.95)');
      t.setAttribute('stroke', 'rgba(255,245,225,.9)');
      t.setAttribute('stroke-width', (1.0*invS).toFixed(2));
      t.setAttribute('paint-order', 'stroke');
      t.setAttribute('opacity', '0');
      t.textContent = text;
      animG.appendChild(t);
      return t;
    };
    const atkShoutEl = makeShoutText(atkShout, atkStandX, atkStandY, true);
    const defShoutEl = makeShoutText(defShout, defStandX, defStandY, false);

    // 喊话淡入 + 名牌轻微抖动（用 setAttribute 直接动画）
    _startTween(200, (te) => {
      atkShoutEl.setAttribute('opacity', te.toFixed(3));
    }, 'easeOut');
    // 挑战方先说：v173 第五轮 700ms 停留（原 350ms 太一闪而过）
    _startTween(300, (te) => {
      const jitter = Math.sin(te * Math.PI * 6) * 0.8;
      atkNp.setAttribute('transform', `translate(${(atkStandX+jitter).toFixed(2)} ${atkStandY.toFixed(2)})`);
    }, 'linear');
    await sleep(700);

    // 应战方回话
    _startTween(200, (te) => {
      defShoutEl.setAttribute('opacity', te.toFixed(3));
    }, 'easeOut');
    _startTween(300, (te) => {
      const jitter = Math.sin(te * Math.PI * 6) * 0.8;
      defNp.setAttribute('transform', `translate(${(defStandX+jitter).toFixed(2)} ${defStandY.toFixed(2)})`);
    }, 'linear');
    await sleep(700);

    // ── Phase A2 (1100-1500ms)：交锋 ──
    // 两名牌同时冲向中点 + 喊话淡出
    _startTween(200, (te) => {
      const op = 1 - te;
      atkShoutEl.setAttribute('opacity', op.toFixed(3));
      defShoutEl.setAttribute('opacity', op.toFixed(3));
    }, 'linear');

    await Promise.all([
      _runTween(280, (te) => {
        const cx = atkStandX + (mx - atkStandX) * te * 0.85;
        const cy = atkStandY + (my - atkStandY) * te * 0.85;
        atkNp.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeIn'),
      _runTween(280, (te) => {
        const cx = defStandX + (mx - defStandX) * te * 0.85;
        const cy = defStandY + (my - defStandY) * te * 0.85;
        defNp.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeIn'),
    ]);

    // 闪 1 道刀光（墨灰，横向短剑影）
    const slashLen = 9 * invS;
    const slashHalfW = 0.9 * invS;
    const slash = document.createElementNS(ns, 'path');
    slash.setAttribute('fill', 'rgba(44,36,22,.9)');
    slash.setAttribute('opacity', '0');
    animG.appendChild(slash);
    _startTween(180, (te) => {
      let scale, opacity;
      if(te < 0.35){
        scale = te / 0.35;
        opacity = .9;
      } else if(te < 0.6){
        scale = 1;
        opacity = .9;
      } else {
        scale = 1;
        opacity = .9 * (1 - (te-0.6)/0.4);
      }
      const len = slashLen * scale;
      const w = slashHalfW * scale;
      // 横向梭形
      const p1x = mx + len, p1y = my;
      const p2x = mx, p2y = my - w;
      const p3x = mx - len, p3y = my;
      const p4x = mx, p4y = my + w;
      slash.setAttribute('d', `M${p1x.toFixed(2)},${p1y.toFixed(2)} L${p2x.toFixed(2)},${p2y.toFixed(2)} L${p3x.toFixed(2)},${p3y.toFixed(2)} L${p4x.toFixed(2)},${p4y.toFixed(2)} Z`);
      slash.setAttribute('opacity', opacity.toFixed(3));
    }, 'linear');

    // 地图微震（幅度比碰撞小）
    const mapSvg = document.getElementById('mapSvg');
    if(mapSvg && typeof mapSvg.animate === 'function'){
      try {
        mapSvg.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-1px)' },
          { transform: 'translateX(.8px)' },
          { transform: 'translateX(0)' },
        ], { duration: 180, easing: 'ease-out' });
      } catch(_){}
    }

    await sleep(120);

    // ── Phase A3 (1500-1800ms)：结果宣告 ──
    // v173 第五轮：始终显示胜方名（避免"胜"字歧义）
    let resultText;
    if(duel.outcome === 'atkWin'){
      const killed = duel.duelKillResult && duel.duelKillResult.result === 'dead';
      const wounded = duel.duelKillResult && duel.duelKillResult.result === 'wounded';
      if(killed) resultText = `${duel.atkName} 斩敌`;
      else if(wounded) resultText = `${duel.atkName} 挫敌`;
      else resultText = `${duel.atkName} 胜`;
    } else if(duel.outcome === 'defWin'){
      const killed = duel.duelKillResult && duel.duelKillResult.result === 'dead';
      const wounded = duel.duelKillResult && duel.duelKillResult.result === 'wounded';
      if(killed) resultText = `${duel.defName} 斩敌`;
      else if(wounded) resultText = `${duel.defName} 挫敌`;
      else resultText = `${duel.defName} 胜`;
    } else {
      resultText = `不分胜负`;
    }

    const resultEl = document.createElementNS(ns, 'text');
    resultEl.setAttribute('x', mx.toFixed(2));
    resultEl.setAttribute('y', (my - 2*invS).toFixed(2));
    resultEl.setAttribute('text-anchor', 'middle');
    resultEl.setAttribute('dominant-baseline', 'middle');
    resultEl.setAttribute('font-family', 'Noto Serif SC,serif');
    resultEl.setAttribute('font-size', (11 * invS).toFixed(2));
    resultEl.setAttribute('font-weight', '900');
    resultEl.setAttribute('fill', '#c03030');  // 朱砂
    resultEl.setAttribute('stroke', 'rgba(255,245,225,.95)');
    resultEl.setAttribute('stroke-width', (1.5*invS).toFixed(2));
    resultEl.setAttribute('paint-order', 'stroke');
    resultEl.setAttribute('opacity', '0');
    resultEl.textContent = resultText;
    animG.appendChild(resultEl);

    // 结果大字 0-30% 放大淡入；70-100% 保持
    await _runTween(300, (te) => {
      let scale, opacity;
      if(te < 0.3){
        const t1 = te/0.3;
        scale = 0.5 + 0.7*t1;
        opacity = t1;
      } else {
        scale = 1.2 - 0.2*((te-0.3)/0.7);
        opacity = 1;
      }
      const tx = mx * (1-scale);
      const ty = (my - 2*invS) * (1-scale);
      resultEl.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(3)})`);
      resultEl.setAttribute('opacity', opacity.toFixed(3));
    }, 'easeOut');

    // ── Phase A4 (1800-2000ms)：归阵 ──
    const atkWin = duel.outcome === 'atkWin';
    const defWin = duel.outcome === 'defWin';
    // 结果字淡出
    _startTween(200, (te) => {
      resultEl.setAttribute('opacity', (1-te).toFixed(3));
    }, 'linear');

    await Promise.all([
      // 挑战方：胜→归阵、败→褪色淡出、平→归阵
      _runTween(200, (te) => {
        const cx = mx + (atkPos.x - mx) * te * (defWin ? 1.2 : 1);  // 败走多推一点
        const cy = my + (atkPos.y - my) * te * (defWin ? 1.2 : 1);
        atkNp.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        if(defWin) atkNp.setAttribute('opacity', (1-te*.8).toFixed(3));
      }, 'easeInOut'),
      _runTween(200, (te) => {
        const cx = mx + (defPos.x - mx) * te * (atkWin ? 1.2 : 1);
        const cy = my + (defPos.y - my) * te * (atkWin ? 1.2 : 1);
        defNp.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        if(atkWin) defNp.setAttribute('opacity', (1-te*.8).toFixed(3));
      }, 'easeInOut'),
    ]);

    // 动画结束清理
    animG.remove();
  } catch(err){
    console.error('[DuelPrelude] exception:', err);
  } finally {
    _battleAnimating = false;
    try {
      const mr = document.getElementById('mapRoot');
      if(mr) mr.querySelectorAll('.duel-prelude-layer').forEach(el => el.remove());
    } catch(_){}
  }
}

/** 获取 unit 在地图上的当前渲染位置（含 stack 扇形偏移，和 renderUnitsOnMap 一致）
 *  @param {Object} posOverride 可选 {hq, hr}，覆盖 unit.hq/hr（用于位置快照）
 */
function _baGetUnitRenderPos(unit, allUnits, posOverride){
  const hq = posOverride ? posOverride.hq : (unit.hq??0);
  const hr = posOverride ? posOverride.hr : (unit.hr??0);
  const pos = hexToPixel(hq, hr);
  // 计算同 hex 其它部队形成的 stack
  const stackKey = hkey(hq, hr);
  const stack = allUnits.filter(u => hkey(u.hq??0, u.hr??0) === stackKey);
  const idx = stack.indexOf(unit);
  const fanSpacing = 14;
  const invS = 1 / (_mapScale || 1);
  // 若 unit 不在当前 stack（已被移除），idx = -1，视为单独部队
  const effectiveIdx = idx >= 0 ? idx : 0;
  const effectiveCount = idx >= 0 ? stack.length : 1;
  const offsetX = (effectiveIdx - (effectiveCount-1)/2) * fanSpacing * invS;
  return { x: pos.x + offsetX, y: pos.y };
}

/**
 * 播放战斗碰撞动画
 * @param {Array} attackers 攻方 unit 数组
 * @param {Array} defenders 守方 unit 数组
 * @param {Object} report resolveBattle 返回的战报（已 push 入 _battleReports）
 * @param {Object} posSnap 战前位置快照 {unitId: {hq, hr}}，动画用此位置而非 unit.hq/hr（防 doRetreat 改动）
 * @returns {Promise<void>}
 * 异常/不满足条件 → 直接 resolve，不阻塞战报弹窗
 */
async function _playBattleCollisionAnim(attackers, defenders, report, posSnap){
  try {
    // ── 跳过条件 ──
    if(_fastForward) return;
    if(_battleAnimating) return;
    if(!attackers || !defenders || attackers.length === 0 || defenders.length === 0) return;
    if(!report || report.type !== 'battle') return;
    if(report.isNaval) return;
    // AI vs AI：双方都非玩家方 → 不播
    const hasPlayer = attackers.some(u => u.fac === G.playerFac) || defenders.some(u => u.fac === G.playerFac);
    if(!hasPlayer) return;
    // 迷雾检查：至少一个参战 unit 在 VISIBLE hex 内（用战前位置）
    const pFog = G.fog?.[G.playerFac];
    if(pFog){
      const _allParticipants = [...attackers, ...defenders];
      const anyVisible = _allParticipants.some(u => {
        const snap = posSnap?.[u.id];
        const hq = snap ? snap.hq : (u.hq??0);
        const hr = snap ? snap.hr : (u.hr??0);
        return pFog[hkey(hq, hr)] === FOG_VISIBLE;
      });
      if(!anyVisible) return;
    }

    const mapRoot = document.getElementById('mapRoot');
    if(!mapRoot) return;

    _battleAnimating = true;

    // 先清理残留（防御性）
    mapRoot.querySelectorAll('.battle-anim-layer').forEach(el => el.remove());

    // 快照参战方位置（动画期间 unit 坐标可能被其它代码改，先锁定）
    // v173: 优先使用 posSnap（战前快照），避免 doRetreat 已经把败方 hq/hr 改成撤退后位置
    const allUnits = [...G.units];
    const atkPositions = attackers.map(u => ({
      unit: u,
      pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id])
    }));
    const defPositions = defenders.map(u => ({
      unit: u,
      pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id])
    }));

    // 中点：攻方第一支 & 守方第一支 的中点
    const atkAnchor = atkPositions[0].pos;
    const defAnchor = defPositions[0].pos;
    const mx = (atkAnchor.x + defAnchor.x) / 2;
    const my = (atkAnchor.y + defAnchor.y) / 2;

    // ── 创建动画层（挂在 mapRoot 内，自动随 _mapScale 缩放）──
    const ns = 'http://www.w3.org/2000/svg';
    const animG = document.createElementNS(ns, 'g');
    animG.setAttribute('class', 'battle-anim-layer');
    animG.setAttribute('pointer-events', 'none');
    mapRoot.appendChild(animG);

    // ── Phase 1 (0-400ms)：双方向中心冲 60% ──
    // 找到实际的 unit svg 元素（在 unitsLayer 内）用 element.animate 移动
    const unitsLayer = document.getElementById('unitsLayer');
    const _animatedUnitEls = []; // 记录动画过的元素，finally 里清理 transform
    const _registerUnitAnim = (unit, fromPos, toX, toY, duration, easing) => {
      if(!unitsLayer) return;
      // unit 的 g 是通过 unitsLayer.children 里查找
      // renderUnitsOnMap 用的是 translate(x,y) 直接写在 g 上，没有 id 标记
      // 这里我们不修改 unit svg；改用 animG 里画一个"幻影旗帜"来动画
      // 但这样太复杂 —— 改用方案：给 unitsLayer 下的每个 g 匹配坐标
      // 实际上更简单的方式：在 animG 里复制一个旗帜影像来动画，原 unit 不动
    };

    // ─── 更简单的方案：在 animG 里画"幻影旗帜" + 动画 + 原 unit svg 临时隐藏 ───
    // 旗帜视觉尺寸参考 renderUnitsOnMap：flagW=28, flagH=16, poleH=18
    const FLAG_W = 28, FLAG_H = 16, POLE_H = 18;
    const invS = 1 / (_mapScale || 1);

    const FAC_FLAG_COL = {
      wei:'rgba(220,235,248,.95)',shu:'rgba(220,242,228,.95)',
      wu:'rgba(248,225,222,.95)',nanman:'rgba(248,240,210,.95)',
    };
    const facCol = f => FAC[f]?.color || '#888';

    // v174: makePhantom 已抽到 _baCore，保留本地 wrapper 闭包 animG/invS 保持调用点不变
    // §5.10 fix: wrapper 加 presetTroops 透传, caller 从 posSnap 取战前 troops
    const makePhantom = (unit, startPos, presetTroops) => _baCore.makePhantom(animG, unit, startPos, invS, presetTroops);

    // ── v174: tween 辅助通过 _baCore 复用（替代内联）──
    // 保留 _runTween / _startTween 两个本地别名，避免修改函数体内所有调用点
    const _runTween = _baCore.runTween;
    const _startTween = _baCore.startTween;

    // 创建幻影 + 原 unit 图标隐藏
    const phantoms = []; // {unit, el, origPos, isAtk, targetPos}
    const hiddenUnitEls = []; // 原 unitsLayer 下的 g 元素引用
    atkPositions.forEach(({unit, pos}) => {
      const ph = makePhantom(unit, pos, posSnap?.[unit.id]?.troops); // §5.10 fix: 战前 troops snap
      phantoms.push({unit, el: ph, origPos: pos, isAtk: true});
    });
    defPositions.forEach(({unit, pos}) => {
      const ph = makePhantom(unit, pos, posSnap?.[unit.id]?.troops); // §5.10 fix: 战前 troops snap
      phantoms.push({unit, el: ph, origPos: pos, isAtk: false});
    });

    // 原 unit 旗帜在动画期间隐藏（通过 unit id 匹配 onclick 属性文本查找）
    if(unitsLayer){
      const allOrigUnitGs = Array.from(unitsLayer.querySelectorAll('g[onclick]'));
      const participantIds = new Set([...attackers, ...defenders].map(u => u.id));
      allOrigUnitGs.forEach(g => {
        const onclick = g.getAttribute('onclick') || '';
        const m = onclick.match(/onUnitLeftClick\('([^']+)'/);
        if(m && participantIds.has(m[1])){
          g.style.visibility = 'hidden';
          hiddenUnitEls.push(g);
        }
      });
    }

    // ── Phase 1 (0-400ms)：向中心冲 60% ──
    phantoms.forEach(p => {
      const tx = p.origPos.x + (mx - p.origPos.x) * 0.6;
      const ty = p.origPos.y + (my - p.origPos.y) * 0.6;
      p.targetPos = { x: tx, y: ty };
    });
    await Promise.all(phantoms.map(p => _runTween(550, (te) => {
      const cx = p.origPos.x + (p.targetPos.x - p.origPos.x) * te;
      const cy = p.origPos.y + (p.targetPos.y - p.origPos.y) * te;
      p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    }, 'easeInOut')));

    // ── Phase 2 (550-800ms)：碰撞闪⚔+地图震动 ──
    const clashRing = document.createElementNS(ns, 'circle');
    clashRing.setAttribute('cx', mx.toFixed(2));
    clashRing.setAttribute('cy', my.toFixed(2));
    clashRing.setAttribute('r', '2');
    clashRing.setAttribute('fill', 'none');
    clashRing.setAttribute('stroke', 'rgba(200,80,50,.75)');
    clashRing.setAttribute('stroke-width', '1.2');
    clashRing.setAttribute('opacity', '.85');
    animG.appendChild(clashRing);
    _startTween(700, (te) => {
      clashRing.setAttribute('r', (2 + 20*te).toFixed(2));
      clashRing.setAttribute('opacity', (.85 * (1-te)).toFixed(3));
    }, 'easeOut');

    // ── v173: 刀光 × 3 道（30°/90°/150°，扇形分布，错峰 50ms 依次出，单道 200ms）──
    // 梭形剑影：用 <path> 画菱形（两端尖、中间粗），朱砂色，锐利感强
    const SLASH_ANGLES = [30, 90, 150];
    const slashHalfLen = 8 * invS;   // 单边长度（总长 16×invS）
    const slashHalfW = 1.2 * invS;   // 中间最粗处的半宽
    SLASH_ANGLES.forEach((deg, idx) => {
      const rad = deg * Math.PI / 180;
      // 梭形以 (mx,my) 为中心，沿 rad 方向延伸；用 <path> 画四点菱形
      const slash = document.createElementNS(ns, 'path');
      slash.setAttribute('fill', 'rgba(44,36,22,.9)');  // 墨灰（主项目 var(--ink)）
      slash.setAttribute('opacity', '0');
      animG.appendChild(slash);
      // 错峰：每道延迟 idx*50ms 出现
      setTimeout(() => {
        _startTween(200, (te) => {
          let scale, opacity;
          if(te < 0.3){
            // 0-30%：快速拉伸
            const t1 = te/0.3;
            scale = t1;
            opacity = .9;
          } else if(te < 0.6){
            // 30-60%：保持
            scale = 1;
            opacity = .9;
          } else {
            // 60-100%：淡出
            const t3 = (te-0.6)/0.4;
            scale = 1;
            opacity = .9 * (1 - t3);
          }
          const len = slashHalfLen * scale;
          const w = slashHalfW * scale;
          // 梭形四点：前尖/右腰/后尖/左腰
          const dx = Math.cos(rad), dy = Math.sin(rad);
          const px = -dy, py = dx;  // 垂直于 (dx,dy) 的方向
          const p1x = mx + dx*len,     p1y = my + dy*len;     // 前尖
          const p2x = mx + px*w,       p2y = my + py*w;       // 右腰（中心+垂直偏移）
          const p3x = mx - dx*len,     p3y = my - dy*len;     // 后尖
          const p4x = mx - px*w,       p4y = my - py*w;       // 左腰
          const d = `M${p1x.toFixed(2)},${p1y.toFixed(2)} L${p2x.toFixed(2)},${p2y.toFixed(2)} L${p3x.toFixed(2)},${p3y.toFixed(2)} L${p4x.toFixed(2)},${p4y.toFixed(2)} Z`;
          slash.setAttribute('d', d);
          slash.setAttribute('opacity', opacity.toFixed(3));
        }, 'linear');
      }, idx * 50);
    });

    // ── v173: 火星 × 6 粒（100ms 后爆发，350ms 生命周期）──
    setTimeout(() => {
      const SPARK_COUNT = 6;
      const sparkColors = ['rgba(255,200,80,.95)', 'rgba(255,130,50,.95)'];  // 亮橙 + 暖红
      for(let i = 0; i < SPARK_COUNT; i++){
        // 均匀分布 + 随机偏移
        const baseAngle = (i / SPARK_COUNT) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.6; // ±0.3 弧度
        const ang = baseAngle + jitter;
        const dist = (10 + Math.random() * 8) * invS; // 10-18px 飞行距离
        const fx = Math.cos(ang), fy = Math.sin(ang);
        const startR = 1.8 * invS;
        const endR = 0.5 * invS;

        const spark = document.createElementNS(ns, 'circle');
        spark.setAttribute('cx', mx.toFixed(2));
        spark.setAttribute('cy', my.toFixed(2));
        spark.setAttribute('r', startR.toFixed(2));
        spark.setAttribute('fill', sparkColors[i % 2]);
        spark.setAttribute('opacity', '1');
        animG.appendChild(spark);

        _startTween(350, (te) => {
          const d = dist * te;
          const r = startR + (endR - startR) * te;
          const opacity = 1 - te*te;  // 二次淡出，末端更快消失
          spark.setAttribute('cx', (mx + fx*d).toFixed(2));
          spark.setAttribute('cy', (my + fy*d).toFixed(2));
          spark.setAttribute('r', r.toFixed(2));
          spark.setAttribute('opacity', opacity.toFixed(3));
        }, 'easeOut');
      }
    }, 100);

    const clashMark = document.createElementNS(ns, 'text');
    clashMark.setAttribute('x', mx.toFixed(2));
    clashMark.setAttribute('y', (my+1).toFixed(2));
    clashMark.setAttribute('text-anchor', 'middle');
    clashMark.setAttribute('dominant-baseline', 'middle');
    clashMark.setAttribute('class', 'ba-clash-mark');
    clashMark.setAttribute('opacity', '0');
    clashMark.textContent = '⚔';
    animG.appendChild(clashMark);
    // ⚔用 SVG transform 做缩放（围绕 mx,my）
    _startTween(1200, (te) => {
      let scale, opacity;
      if(te < 0.35){
        const t1 = te/0.35;
        scale = 0.3 + (1.4-0.3)*t1;
        opacity = t1;
      } else if(te < 0.7){
        const t2 = (te-0.35)/0.35;
        scale = 1.4 + (1-1.4)*t2;
        opacity = 1;
      } else {
        const t3 = (te-0.7)/0.3;
        scale = 1 + 0.1*t3;
        opacity = 1 - t3;
      }
      // 围绕 (mx, my) 做 scale
      const tx = mx * (1 - scale);
      const ty = (my+1) * (1 - scale);
      clashMark.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(3)})`);
      clashMark.setAttribute('opacity', opacity.toFixed(3));
    }, 'linear');

    // 地图震动（mapSvg translateX，用 element.animate 走 CSS transform——mapSvg 是根 <svg>，CSS transform 对其安全）
    const mapSvg = document.getElementById('mapSvg');
    if(mapSvg && typeof mapSvg.animate === 'function'){
      try {
        mapSvg.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-2px)' },
          { transform: 'translateX(1.5px)' },
          { transform: 'translateX(-.6px)' },
          { transform: 'translateX(0)' },
        ], { duration: 320, easing: 'ease-out' });
      } catch(_){}
    }

    await sleep(250);

    // ── Phase 3 (800-2500ms)：飘损失数字 ──
    const totalAtkLost = report.atkLost || 0;
    const totalDefLost = report.defLost || 0;
    // 每侧平均分：把总损失按 unit 数量均分（显示近似，不求精确）
    const atkPerUnit = attackers.length > 0 ? Math.round(totalAtkLost / attackers.length) : 0;
    const defPerUnit = defenders.length > 0 ? Math.round(totalDefLost / defenders.length) : 0;

    const playerFac = G.playerFac;
    const _lossInstances = []; // { el, startY }
    phantoms.forEach(p => {
      const myLost = p.isAtk ? atkPerUnit : defPerUnit;
      if(myLost <= 0) return;

      const tx = p.targetPos.x;
      const ty = p.targetPos.y;
      const startY = ty - 18*invS;
      const txt = document.createElementNS(ns, 'text');
      txt.setAttribute('x', tx.toFixed(2));
      txt.setAttribute('y', startY.toFixed(2));
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-family', 'Noto Serif SC,serif');
      // v173 调参：飘字缩小，避免在 hex=6px 地图上显得突兀
      const sizeVal = Math.max(5, 8*invS).toFixed(2);
      txt.setAttribute('font-size', sizeVal);
      txt.setAttribute('font-weight', '900');
      txt.setAttribute('opacity', '0');

      const isPlayerUnit = p.unit.fac === playerFac;
      if(isPlayerUnit){
        // 我方损失：白字红描边
        txt.setAttribute('fill', 'rgba(255,245,225,1)');
        txt.setAttribute('stroke', '#c03030');
        txt.setAttribute('stroke-width', (1.2*invS).toFixed(2));
      } else {
        // 敌方损失：红字白描边
        txt.setAttribute('fill', '#c03030');
        txt.setAttribute('stroke', 'rgba(255,245,225,1)');
        txt.setAttribute('stroke-width', (1.2*invS).toFixed(2));
      }
      txt.setAttribute('paint-order', 'stroke');
      txt.textContent = '-' + myLost;
      animG.appendChild(txt);

      // 飘字：y 从 startY 向上移 22*invS，opacity 先 fadeIn 再 fadeOut
      _startTween(1700, (te) => {
        let y = startY;
        let opacity = 0;
        if(te < 0.12){
          const t1 = te/0.12;
          y = startY - 3*invS*t1;
          opacity = t1;
        } else if(te < 0.80){
          const t2 = (te-0.12)/0.68;
          y = startY - 3*invS - 10*invS*t2;
          opacity = 1;
        } else {
          const t3 = (te-0.80)/0.20;
          y = startY - 13*invS - 9*invS*t3;
          opacity = 1 - t3;
        }
        txt.setAttribute('y', y.toFixed(2));
        txt.setAttribute('opacity', opacity.toFixed(3));
      }, 'linear');
    });

    await sleep(1700);

    // ── Phase 4 (2500-3200ms)：回位 + 胜负表现 ──
    const atkWins = !!report.atkWins;
    const phase4Tweens = phantoms.map(p => {
      const unitWins = atkWins ? p.isAtk : !p.isAtk;
      const tx0 = p.targetPos.x, ty0 = p.targetPos.y;
      const tx1 = p.origPos.x, ty1 = p.origPos.y;
      const unitTroops = getUnitTroops(p.unit);
      const almostWiped = unitTroops <= 100;
      const endOpacity = unitWins ? 1 : (almostWiped ? 0.25 : 0.45);

      // 位置回位
      const posTween = _runTween(700, (te) => {
        const cx = tx0 + (tx1-tx0)*te;
        const cy = ty0 + (ty1-ty0)*te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        const op = 1 + (endOpacity - 1)*te;
        p.el.setAttribute('opacity', op.toFixed(3));
      }, 'easeInOut');

      // 胜方放大回弹（内部 scale group）
      if(unitWins){
        const innerG = p.el.querySelector('.ba-inner');
        if(innerG){
          _startTween(650, (te) => {
            let s;
            if(te < 0.5) s = invS * (1 + 0.15*(te/0.5));
            else s = invS * (1 + 0.15 - 0.15*((te-0.5)/0.5));
            innerG.setAttribute('transform', `scale(${s.toFixed(4)})`);
          }, 'easeInOut');
        }
      }
      return posTween;
    });
    await Promise.all(phase4Tweens);

    // ── 动画结束：清理临时 DOM，恢复原 unit 可见性 ──
    animG.remove();
    hiddenUnitEls.forEach(g => { g.style.visibility = ''; });
  } catch(err){
    console.error('[BattleAnim] exception:', err);
  } finally {
    _battleAnimating = false;
    // 兜底清理：再扫一遍 mapRoot
    try {
      const mr = document.getElementById('mapRoot');
      if(mr) mr.querySelectorAll('.battle-anim-layer').forEach(el => el.remove());
      // 恢复任何可能被隐藏的 unit（防御性兜底）
      const ul = document.getElementById('unitsLayer');
      if(ul) ul.querySelectorAll('g[style*="visibility: hidden"]').forEach(g => {
        g.style.visibility = '';
      });
    } catch(_){}
  }
}

// ═════════════════════════════════════════════════════════════
// v175: 营寨战动画（_playCampBattleAnim）
// ─────────────────────────────────────────────────────────────
// 两个路径：
//   report.mode === 'raid'     奇袭破营（夜幕 + 火把闪烁 + 攻方俯冲）
//   report.mode === 'assault'  正面强攻（白昼 + 火把稳定 + 3 波冲击 + 栅栏坍塌）
// 共同：守方位置作为营寨中心，画栅栏剪影
// 跳过条件走 _baCore.shouldSkip
// 触发点：confirmCampBattle 内 resolveCampBattle 之后 await
// ═════════════════════════════════════════════════════════════

/**
 * 画营寨栅栏剪影（挂在 animG，后续可能需要取门楣/右墙做局部动画）
 * @param {SVGGElement} animG
 * @param {number} cx 营寨中心 x
 * @param {number} cy 营寨中心 y
 * @param {number} invS 反缩放因子
 * @param {boolean} alerted true=不画火把（警戒状态），false=画两盏火把
 * @returns {{leftWall, rightWall, lintel, torches}} 关键元素引用
 */
function _baDrawCampPalisade(animG, cx, cy, invS, alerted){
  const ns = _baCore.SVG_NS;
  // 基准尺寸按 invS 缩放
  const wallW = 50 * invS;     // 单段栅栏宽
  const wallH = 12 * invS;     // 栅栏高
  const wallY = cy + 2 * invS;
  const gap = 10 * invS;       // 寨门缺口半宽
  const wallOp = 0.7;

  // 左段墙
  const leftWall = document.createElementNS(ns, 'rect');
  leftWall.setAttribute('x', (cx - gap - wallW).toFixed(2));
  leftWall.setAttribute('y', (wallY - wallH/2).toFixed(2));
  leftWall.setAttribute('width', wallW.toFixed(2));
  leftWall.setAttribute('height', wallH.toFixed(2));
  leftWall.setAttribute('fill', 'rgba(80,58,34,.72)');
  leftWall.setAttribute('stroke', 'rgba(30,22,12,.85)');
  leftWall.setAttribute('stroke-width', (1.2*invS).toFixed(2));
  leftWall.setAttribute('opacity', wallOp);
  animG.appendChild(leftWall);

  // 右段墙
  const rightWall = document.createElementNS(ns, 'rect');
  rightWall.setAttribute('x', (cx + gap).toFixed(2));
  rightWall.setAttribute('y', (wallY - wallH/2).toFixed(2));
  rightWall.setAttribute('width', wallW.toFixed(2));
  rightWall.setAttribute('height', wallH.toFixed(2));
  rightWall.setAttribute('fill', 'rgba(80,58,34,.72)');
  rightWall.setAttribute('stroke', 'rgba(30,22,12,.85)');
  rightWall.setAttribute('stroke-width', (1.2*invS).toFixed(2));
  rightWall.setAttribute('opacity', wallOp);
  animG.appendChild(rightWall);

  // 栅栏桩尖顶（三角形）— 左 4 个 + 右 4 个
  const spikeDx = [-55,-42,-28,-18, 18,28,42,55].map(v => v*invS);
  spikeDx.forEach(dx => {
    const spike = document.createElementNS(ns, 'path');
    const sx = cx + dx;
    const sy = wallY - wallH/2;
    const w = 3*invS, h = 5*invS;
    spike.setAttribute('d', `M${sx.toFixed(2)} ${sy.toFixed(2)} L${(sx+w/2).toFixed(2)} ${(sy-h).toFixed(2)} L${(sx+w).toFixed(2)} ${sy.toFixed(2)} Z`);
    spike.setAttribute('fill', 'rgba(60,45,28,.85)');
    spike.setAttribute('stroke', 'rgba(30,22,12,.85)');
    spike.setAttribute('stroke-width', (0.7*invS).toFixed(2));
    spike.setAttribute('opacity', wallOp);
    animG.appendChild(spike);
  });

  // 寨门柱（门楣两侧）
  [-gap, gap].forEach(dx => {
    const post = document.createElementNS(ns, 'rect');
    const px = cx + dx - 1.5*invS;
    const py = wallY - wallH;
    post.setAttribute('x', px.toFixed(2));
    post.setAttribute('y', py.toFixed(2));
    post.setAttribute('width', (3*invS).toFixed(2));
    post.setAttribute('height', (wallH*1.5).toFixed(2));
    post.setAttribute('fill', 'rgba(60,40,20,.85)');
    post.setAttribute('opacity', wallOp);
    animG.appendChild(post);
  });

  // 门楣横梁
  const lintel = document.createElementNS(ns, 'rect');
  lintel.setAttribute('x', (cx - gap - 2*invS).toFixed(2));
  lintel.setAttribute('y', (wallY - wallH - 2*invS).toFixed(2));
  lintel.setAttribute('width', ((gap+2*invS)*2).toFixed(2));
  lintel.setAttribute('height', (3*invS).toFixed(2));
  lintel.setAttribute('fill', 'rgba(60,40,20,.85)');
  lintel.setAttribute('opacity', wallOp);
  animG.appendChild(lintel);

  // 火把（根据 alerted 决定是否画）
  const torches = [];
  if(!alerted){
    [-(gap+wallW+5*invS), gap+wallW+5*invS].forEach(dx => {
      const t = document.createElementNS(ns, 'circle');
      t.setAttribute('cx', (cx+dx).toFixed(2));
      t.setAttribute('cy', (wallY - wallH).toFixed(2));
      t.setAttribute('r', (2*invS).toFixed(2));
      t.setAttribute('fill', 'rgba(255,170,60,.85)');
      t.setAttribute('class', 'camp-torch');
      animG.appendChild(t);
      torches.push(t);
    });
  }

  return { leftWall, rightWall, lintel, torches };
}

/**
 * 营寨战碰撞动画（v175）
 * @param {Object} report 结算报告 {type:'camp', mode:'raid'|'assault', atkWins, atkLost, defLost, raidSuccess?, fireResult?}
 * @param {Array} attackers 攻方部队数组
 * @param {Array} defenders 守方部队数组
 * @param {Object} posSnap 战前位置快照 { id: {hq, hr} }
 * @returns {Promise<void>}
 */
async function _playCampBattleAnim(report, attackers, defenders, posSnap){
  try {
    if(!report || report.type !== 'camp') return;
    if(_baCore.shouldSkip(attackers, defenders, report, posSnap)) return;

    const layer = _baCore.ensureAnimLayer('camp-anim-layer');
    if(!layer) return;
    const { animG, invS } = layer;

    _battleAnimating = true;

    const mode = report.mode || 'assault';
    const isRaid = mode === 'raid';

    // 位置计算
    const allUnits = [...G.units];
    const atkPositions = attackers.map(u => ({
      unit: u,
      pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id])
    }));
    const defPositions = defenders.map(u => ({
      unit: u,
      pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id])
    }));

    // 营寨中心 = 守方第一支 unit 位置
    const campCX = defPositions[0].pos.x;
    const campCY = defPositions[0].pos.y;

    // 夜幕（仅 raid 模式），在营寨中心周围覆盖椭圆
    let nightOverlay = null;
    if(isRaid){
      nightOverlay = document.createElementNS(_baCore.SVG_NS, 'ellipse');
      nightOverlay.setAttribute('cx', campCX.toFixed(2));
      nightOverlay.setAttribute('cy', campCY.toFixed(2));
      nightOverlay.setAttribute('rx', (90*invS).toFixed(2));
      nightOverlay.setAttribute('ry', (65*invS).toFixed(2));
      nightOverlay.setAttribute('fill', 'rgba(10,8,30,.28)');
      nightOverlay.setAttribute('opacity', '0');
      animG.appendChild(nightOverlay);
      await _baCore.runTween(300, (te)=>nightOverlay.setAttribute('opacity', (te*.85).toFixed(3)), 'easeOut');
    }

    // 栅栏剪影（raid 的"一盏火把闪烁"通过 alerted=false+JS 闪烁；assault 的"两盏稳定"alerted=false 但不闪）
    const camp = _baDrawCampPalisade(animG, campCX, campCY, invS, false);

    // raid：火把闪烁（松懈暗示），只取第一盏闪烁
    let flickerIntervalId = null;
    if(isRaid && camp.torches[0]){
      const tch = camp.torches[0];
      const flicker = () => {
        _baCore.startTween(260, (te) => {
          tch.setAttribute('opacity', (0.4 + 0.5*Math.abs(Math.sin(te*Math.PI*2))).toFixed(3));
        }, 'linear');
      };
      flicker();
      flickerIntervalId = setInterval(flicker, 280);
    }

    // 创建幻影 + 隐藏原 unit
    const phantoms = [];
    const hiddenUnitEls = [];
    atkPositions.forEach(({unit, pos}) => {
      phantoms.push({ unit, el: _baCore.makePhantom(animG, unit, pos, invS, posSnap?.[unit.id]?.troops), origPos: pos, isAtk: true, targetPos: pos }); // §5.10 fix: 战前 troops snap
    });
    defPositions.forEach(({unit, pos}) => {
      phantoms.push({ unit, el: _baCore.makePhantom(animG, unit, pos, invS, posSnap?.[unit.id]?.troops), origPos: pos, isAtk: false, targetPos: pos }); // §5.10 fix: 战前 troops snap
    });
    const unitsLayer = document.getElementById('unitsLayer');
    if(unitsLayer){
      const allOrigUnitGs = Array.from(unitsLayer.querySelectorAll('g[onclick]'));
      const participantIds = new Set([...attackers, ...defenders].map(u => u.id));
      allOrigUnitGs.forEach(g => {
        const oc = g.getAttribute('onclick') || '';
        const m = oc.match(/onUnitLeftClick\('([^']+)'/);
        if(m && participantIds.has(m[1])){
          g.style.visibility = 'hidden';
          hiddenUnitEls.push(g);
        }
      });
    }

    await sleep(150);

    if(isRaid){
      // ─── 奇袭破营路径（总时长 ~2800ms）───

      // Ph1 (0-600ms) 俯冲：攻方从 origPos 外侧（更远）快速冲向寨门外
      // 为了"远方俯冲"感，先把攻方视觉起点往外推（tween 从 outerPos → atkFoot）
      // 但幻影已经创建在 origPos，所以用 tween 到 "寨门外 35px"
      phantoms.filter(p => p.isAtk).forEach(p => {
        // 攻方出发方向相对于寨心的单位向量
        const dx = p.origPos.x - campCX, dy = p.origPos.y - campCY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx/len, uy = dy/len;
        p.targetPos = { x: campCX + ux*35*invS, y: campCY + uy*35*invS };
      });
      await Promise.all(phantoms.filter(p=>p.isAtk).map(p => _baCore.runTween(600, (te) => {
        const cx = p.origPos.x + (p.targetPos.x - p.origPos.x) * te;
        const cy = p.origPos.y + (p.targetPos.y - p.origPos.y) * te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeIn')));

      // Ph2 (600-900ms) 守方惊起（原地抖动 300ms）
      phantoms.filter(p=>!p.isAtk).forEach(p => {
        _baCore.startTween(300, (te) => {
          const sh = Math.sin(te*Math.PI*6) * 3*invS * (1-te);
          p.el.setAttribute('transform', `translate(${(p.origPos.x+sh).toFixed(2)} ${p.origPos.y.toFixed(2)})`);
        }, 'linear');
      });
      await sleep(300);

      // Ph3 (900-1700ms) 破门 + 碰撞
      // 门楣倒塌
      if(camp.lintel){
        _baCore.startTween(500, (te) => {
          const ang = te * 80;
          const dy = te * 12 * invS;
          camp.lintel.setAttribute('transform', `translate(0 ${dy.toFixed(2)}) rotate(${ang.toFixed(1)} ${campCX} ${(campCY - 8*invS).toFixed(2)})`);
          camp.lintel.setAttribute('opacity', (0.7*(1-te*0.6)).toFixed(3));
        }, 'easeIn');
      }
      // 攻方进一步冲入（寨门位置）
      phantoms.filter(p=>p.isAtk).forEach(p => {
        const dx = p.origPos.x - campCX, dy = p.origPos.y - campCY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx/len, uy = dy/len;
        p._prevTarget = p.targetPos;
        p.targetPos = { x: campCX + ux*10*invS, y: campCY + uy*10*invS };
      });
      Promise.all(phantoms.filter(p=>p.isAtk).map(p => _baCore.runTween(350, (te) => {
        const cx = p._prevTarget.x + (p.targetPos.x - p._prevTarget.x) * te;
        const cy = p._prevTarget.y + (p.targetPos.y - p._prevTarget.y) * te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeOut')));

      _baCore.spawnClashRing(animG, campCX, campCY, { color:'rgba(255,130,50,.85)', maxR:40, duration:700, invS });
      _baCore.spawnSlashes(animG, campCX, campCY, { angles:[30,90,150], invS });
      setTimeout(() => {
        // 奇袭火星加密：count 10 + 加入金黄色
        _baCore.spawnSparks(animG, campCX, campCY, {
          count: 10, invS, distRange:[14,22],
          colors:['rgba(255,200,80,.95)','rgba(255,130,50,.95)','rgba(255,220,120,.95)'],
        });
      }, 100);
      _baCore.spawnClashMark(animG, campCX, campCY, { duration: 900 });
      _baCore.shakeMapSvg({ amplitude: 3, duration: 350 });
      // 夜幕被火光冲淡
      if(nightOverlay){
        _baCore.startTween(350, (te) => nightOverlay.setAttribute('opacity', (.28 - .15*te).toFixed(3)), 'easeOut');
      }
      await sleep(700);

      // Ph4 (1700-2300ms) 飘字 + 结果大字
      const atkPerUnit = Math.round((report.atkLost||0) / Math.max(1, attackers.length));
      const defPerUnit = Math.round((report.defLost||0) / Math.max(1, defenders.length));
      phantoms.forEach(p => {
        const myLost = p.isAtk ? atkPerUnit : defPerUnit;
        if(myLost <= 0) return;
        const startY = p.targetPos.y - 18*invS;
        const isPlayer = p.unit.fac === G.playerFac;
        const txt = _baCore.spawnLossText(animG, p.targetPos.x, startY, myLost, isPlayer, invS);
        _baCore.floatLossText(txt, startY, 1400, invS);
      });
      // 结果大字（raid 的判定用 raidSuccess；如果 resolve 没提供，退回 atkWins）
      const raidOK = (report.raidSuccess !== undefined) ? report.raidSuccess : report.atkWins;
      const resultTxt = _baCore.spawnResultText(animG, campCX, campCY - 45*invS,
        raidOK ? '奇袭得手' : '伏兵被识破',
        raidOK ? '#c03030' : 'rgba(44,36,22,.92)',
        invS);
      _baCore.animateResultText(resultTxt, campCX, campCY - 45*invS, 1200);
      await sleep(600);

      // Ph5 (2300-2800ms) 归阵
      await Promise.all(phantoms.map(p => {
        const isWinner = report.atkWins ? p.isAtk : !p.isAtk;
        const endOp = isWinner ? 1 : 0.35;
        return _baCore.runTween(500, (te) => {
          const cx = p.targetPos.x + (p.origPos.x - p.targetPos.x) * te;
          const cy = p.targetPos.y + (p.origPos.y - p.targetPos.y) * te;
          p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
          p.el.setAttribute('opacity', (1 + (endOp - 1)*te).toFixed(3));
        }, 'easeInOut');
      }));

    } else {
      // ─── 正面强攻路径（总时长 ~3400ms）───

      // Ph1 (0-700ms) 稳步推进
      phantoms.filter(p=>p.isAtk).forEach(p => {
        const dx = p.origPos.x - campCX, dy = p.origPos.y - campCY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx/len, uy = dy/len;
        p.targetPos = { x: campCX + ux*45*invS, y: campCY + uy*45*invS };
      });
      await Promise.all(phantoms.filter(p=>p.isAtk).map(p => _baCore.runTween(700, (te) => {
        const cx = p.origPos.x + (p.targetPos.x - p.origPos.x) * te;
        const cy = p.origPos.y + (p.targetPos.y - p.origPos.y) * te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeInOut')));

      // Ph2 (700-1900ms) 3 波冲击
      for(let wave = 0; wave < 3; wave++){
        // 向前冲一小段
        phantoms.filter(p=>p.isAtk).forEach(p => {
          const dx = p.origPos.x - campCX, dy = p.origPos.y - campCY;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx/len, uy = dy/len;
          p._waveStart = { x: parseFloat(p.el.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)/)[1]),
                           y: parseFloat(p.el.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)/)[2]) };
          p.targetPos = { x: campCX + ux*30*invS, y: campCY + uy*30*invS };
        });
        await Promise.all(phantoms.filter(p=>p.isAtk).map(p => _baCore.runTween(230, (te) => {
          const cx = p._waveStart.x + (p.targetPos.x - p._waveStart.x) * te;
          const cy = p._waveStart.y + (p.targetPos.y - p._waveStart.y) * te;
          p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        }, 'easeIn')));

        // 栅栏晃动
        _baCore.startTween(180, (te) => {
          const shake = Math.sin(te*Math.PI*3) * 2.5*invS * (1-te*0.3);
          // 注意：camp.leftWall/rightWall/lintel 都各自有 transform（门楣倒塌用），整个 scenery 统一挪
          // 方案：给所有栅栏元素套一个 transform，最简单是对 leftWall/rightWall 加偏移
          [camp.leftWall, camp.rightWall].forEach(w => {
            if(w) w.setAttribute('transform', `translate(${shake.toFixed(2)} 0)`);
          });
        }, 'linear');
        _baCore.spawnClashRing(animG, campCX - 20*invS, campCY, { color:'rgba(200,80,50,.7)', maxR:30, duration:450, invS });
        _baCore.spawnSlashes(animG, campCX - 20*invS, campCY, { angles:[90], invS });
        _baCore.shakeMapSvg({ amplitude: 1.8, duration: 200 });
        await sleep(230);

        // 回拉
        phantoms.filter(p=>p.isAtk).forEach(p => {
          const dx = p.origPos.x - campCX, dy = p.origPos.y - campCY;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx/len, uy = dy/len;
          p._waveStart = p.targetPos;
          p.targetPos = { x: campCX + ux*40*invS, y: campCY + uy*40*invS };
        });
        await Promise.all(phantoms.filter(p=>p.isAtk).map(p => _baCore.runTween(140, (te) => {
          const cx = p._waveStart.x + (p.targetPos.x - p._waveStart.x) * te;
          const cy = p._waveStart.y + (p.targetPos.y - p._waveStart.y) * te;
          p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        }, 'easeOut')));
        // 栅栏回位
        [camp.leftWall, camp.rightWall].forEach(w => { if(w) w.setAttribute('transform', 'translate(0 0)'); });
      }

      // Ph3 (1900-2700ms) 决定性冲击 + 右墙坍塌（胜利）
      phantoms.filter(p=>p.isAtk).forEach(p => {
        const dx = p.origPos.x - campCX, dy = p.origPos.y - campCY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx/len, uy = dy/len;
        p._waveStart = p.targetPos;
        p.targetPos = { x: campCX + ux*15*invS, y: campCY + uy*15*invS };
      });
      Promise.all(phantoms.filter(p=>p.isAtk).map(p => _baCore.runTween(400, (te) => {
        const cx = p._waveStart.x + (p.targetPos.x - p._waveStart.x) * te;
        const cy = p._waveStart.y + (p.targetPos.y - p._waveStart.y) * te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeIn')));

      if(report.atkWins && camp.rightWall){
        _baCore.startTween(500, (te) => {
          const ang = te * 35;
          const dx = te * 14*invS;
          camp.rightWall.setAttribute('transform', `translate(${dx.toFixed(2)} 0) rotate(${ang.toFixed(1)} ${(campCX + 20*invS).toFixed(2)} ${(campCY + 2*invS).toFixed(2)})`);
          camp.rightWall.setAttribute('opacity', (0.7*(1-te*0.5)).toFixed(3));
        }, 'easeIn');
      }
      _baCore.spawnClashRing(animG, campCX - 10*invS, campCY, { color:'rgba(200,80,50,.85)', maxR:35, duration:700, invS });
      _baCore.spawnSlashes(animG, campCX - 10*invS, campCY, { angles:[30,90,150], invS });
      setTimeout(() => _baCore.spawnSparks(animG, campCX - 10*invS, campCY, { count:7, invS, distRange:[14,24] }), 100);
      _baCore.spawnClashMark(animG, campCX - 10*invS, campCY, { duration: 950 });
      _baCore.shakeMapSvg({ amplitude: 2.5, duration: 320 });
      await sleep(700);

      // Ph4 (2700-3400ms) 飘字 + 归阵
      const atkPerUnit = Math.round((report.atkLost||0) / Math.max(1, attackers.length));
      const defPerUnit = Math.round((report.defLost||0) / Math.max(1, defenders.length));
      phantoms.forEach(p => {
        const myLost = p.isAtk ? atkPerUnit : defPerUnit;
        if(myLost <= 0) return;
        const posX = p.targetPos.x, posY = p.targetPos.y;
        const startY = posY - 18*invS;
        const isPlayer = p.unit.fac === G.playerFac;
        const txt = _baCore.spawnLossText(animG, posX, startY, myLost, isPlayer, invS);
        _baCore.floatLossText(txt, startY, 1100, invS);
      });
      await sleep(300);
      await Promise.all(phantoms.map(p => {
        const isWinner = report.atkWins ? p.isAtk : !p.isAtk;
        const endOp = isWinner ? 1 : 0.4;
        return _baCore.runTween(300, (te) => {
          const cx = p.targetPos.x + (p.origPos.x - p.targetPos.x)*te;
          const cy = p.targetPos.y + (p.origPos.y - p.targetPos.y)*te;
          p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
          p.el.setAttribute('opacity', (1 + (endOp-1)*te).toFixed(3));
        }, 'easeInOut');
      }));
    }

    // 清理
    if(flickerIntervalId) clearInterval(flickerIntervalId);
    animG.remove();
    hiddenUnitEls.forEach(g => { g.style.visibility = ''; });
  } catch(err){
    console.error('[CampAnim] exception:', err);
  } finally {
    _battleAnimating = false;
    _baCore.cleanupAnimLayers(['camp-anim-layer']);
  }
}

// ─────────────────────────────────────────────────────────────
// v175 Step 2: 伏击战动画（_playAmbushBattleAnim）
// 原型 v0.2 方向 A：地形色遮罩 → 潜伏收缩 → 弹性跃出 → 单侧冲击 → 败方炸成残兵
// 路由：按 report.ambushHit 决定是否做"潜伏/跃出"前奏
// 跳过条件走 _baCore.shouldSkip
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} report resolveAmbush 的返回对象
 *   需要字段：type='ambush', ambushHit, ambushWins, terrainType, fireResult?, ambushLost, victimLost
 * @param {Array} attackers 伏击方（ambushUnits）
 * @param {Array} defenders 被伏方（victimUnits）
 * @param {Object} posSnap {id: {hq, hr}}
 * @returns {Promise<void>}
 */
async function _playAmbushBattleAnim(report, attackers, defenders, posSnap){
  try {
    if(!report || report.type !== 'ambush') return;
    if(_baCore.shouldSkip(attackers, defenders, report, posSnap)) return;

    const layer = _baCore.ensureAnimLayer('ambush-anim-layer');
    if(!layer) return;
    const { animG, invS } = layer;
    _battleAnimating = true;

    const hit = !!report.ambushHit;
    const ambWins = !!report.ambushWins;
    const fireOn = !!(report.fireResult && report.fireResult.success);

    // ── 位置计算 ──
    const allUnits = [...G.units];
    const atkPositions = attackers.map(u => ({ unit: u, pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id]) }));
    const defPositions = defenders.map(u => ({ unit: u, pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id]) }));
    const ambAnchor = atkPositions[0].pos;
    const vicAnchor = defPositions[0].pos;
    const mx = (ambAnchor.x + vicAnchor.x) / 2;
    const my = (ambAnchor.y + vicAnchor.y) / 2;

    // ── 地形色遮罩 ──
    const ter = report.terrainType || 'plain';
    const terrainCol = (ter === 'forest')
      ? 'rgba(30,60,30,.38)'
      : (ter === 'mountain' || ter === 'hill')
        ? 'rgba(60,50,35,.34)'
        : 'rgba(70,60,30,.26)';
    const terrainOverlay = document.createElementNS(_baCore.SVG_NS, 'ellipse');
    terrainOverlay.setAttribute('cx', mx.toFixed(2));
    terrainOverlay.setAttribute('cy', my.toFixed(2));
    terrainOverlay.setAttribute('rx', (70*invS).toFixed(2));
    terrainOverlay.setAttribute('ry', (50*invS).toFixed(2));
    terrainOverlay.setAttribute('fill', terrainCol);
    terrainOverlay.setAttribute('opacity', '0');
    animG.appendChild(terrainOverlay);

    // ── 创建幻影 + 隐藏原 unit ──
    const phantoms = [];
    const hiddenUnitEls = [];
    atkPositions.forEach(({unit, pos}) => {
      phantoms.push({ unit, el: _baCore.makePhantom(animG, unit, pos, invS, posSnap?.[unit.id]?.troops), origPos: pos, isAtk: true, targetPos: pos }); // §5.10 fix: 战前 troops snap
    });
    defPositions.forEach(({unit, pos}) => {
      phantoms.push({ unit, el: _baCore.makePhantom(animG, unit, pos, invS, posSnap?.[unit.id]?.troops), origPos: pos, isAtk: false, targetPos: pos }); // §5.10 fix: 战前 troops snap
    });
    const unitsLayer = document.getElementById('unitsLayer');
    if(unitsLayer){
      const allOrigUnitGs = Array.from(unitsLayer.querySelectorAll('g[onclick]'));
      const participantIds = new Set([...attackers, ...defenders].map(u => u.id));
      allOrigUnitGs.forEach(g => {
        const oc = g.getAttribute('onclick') || '';
        const m = oc.match(/onUnitLeftClick\('([^']+)'/);
        if(m && participantIds.has(m[1])){
          g.style.visibility = 'hidden';
          hiddenUnitEls.push(g);
        }
      });
    }

    // ── Ph0 (0-300ms) 地形色遮罩淡入 ──
    await _baCore.runTween(300, te => terrainOverlay.setAttribute('opacity', te.toFixed(3)), 'easeOut');

    // ── Ph1 (300-900ms) 潜伏收缩（仅 hit=true）──
    // 伏方幻影内层 .ba-inner 的 transform 加 scale0.3 + opacity 0.15（半隐藏在地形里）
    // 同时被伏方向中点推进一小段（表示毫无察觉地走入）
    const ambPhantoms = phantoms.filter(p => p.isAtk);
    const vicPhantoms = phantoms.filter(p => !p.isAtk);

    const setPhantomScale = (phantom, scale, opacity) => {
      const inner = phantom.el.querySelector('.ba-inner');
      if(inner){
        // 内层 scale = invS * scale（外层 transform 仍是 translate，内层负责缩放）
        inner.setAttribute('transform', `scale(${(invS*scale).toFixed(4)})`);
      }
      phantom.el.setAttribute('opacity', opacity.toFixed(3));
    };

    if(hit){
      // 伏方收缩
      ambPhantoms.forEach(p => {
        _baCore.startTween(450, te => {
          const s = 1 + (0.3 - 1)*te;
          const op = 1 + (0.18 - 1)*te;
          setPhantomScale(p, s, op);
        }, 'easeIn');
      });
      // 被伏方向中点推进 ~25%
      vicPhantoms.forEach(p => {
        const dx = mx - p.origPos.x, dy = my - p.origPos.y;
        p.targetPos = { x: p.origPos.x + dx*0.25, y: p.origPos.y + dy*0.25 };
        _baCore.startTween(600, te => {
          const cx = p.origPos.x + (p.targetPos.x - p.origPos.x)*te;
          const cy = p.origPos.y + (p.targetPos.y - p.origPos.y)*te;
          p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        }, 'linear');
      });
      await sleep(600);

      // ── Ph2 (900-1300ms) 弹性跃出 ──
      // 伏方 scale overshoot 0.3 → 1.15 → 1.0；opacity 0.18 → 1
      // 位置：从 origPos tween 到被伏方位置 ~25%
      ambPhantoms.forEach(p => {
        const dx = vicAnchor.x - p.origPos.x, dy = vicAnchor.y - p.origPos.y;
        p.targetPos = { x: p.origPos.x + dx*0.25, y: p.origPos.y + dy*0.25 };
      });
      await Promise.all(ambPhantoms.map(p => _baCore.runTween(400, te => {
        const cx = p.origPos.x + (p.targetPos.x - p.origPos.x)*te;
        const cy = p.origPos.y + (p.targetPos.y - p.origPos.y)*te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        // overshoot scale 曲线
        let scale;
        if(te < 0.6){ scale = 0.3 + (1.15 - 0.3)*(te/0.6); }
        else { scale = 1.15 + (1.0 - 1.15)*((te-0.6)/0.4); }
        const op = 0.18 + (1 - 0.18)*Math.min(1, te*2);
        setPhantomScale(p, scale, op);
      }, 'easeOut')));

      // 刀光 @ 伏方中点
      _baCore.spawnSlashes(animG, ambAnchor.x + (vicAnchor.x-ambAnchor.x)*0.3, ambAnchor.y + (vicAnchor.y-ambAnchor.y)*0.3, { angles:[40,140], invS });

      // 火攻起火
      if(fireOn){
        _baCore.spawnSparks(animG, vicAnchor.x, vicAnchor.y, {
          count: 10, invS,
          colors: ['rgba(255,140,50,.95)', 'rgba(255,80,40,.95)'],
          distRange: [12, 20],
        });
      }
    } else {
      // hit=false：被伏方警觉抖动 200ms，然后直接进 Ph3 单侧冲击
      await Promise.all(vicPhantoms.map(p => _baCore.runTween(200, te => {
        const sh = Math.sin(te*Math.PI*5) * 2.5*invS * (1-te);
        p.el.setAttribute('transform', `translate(${(p.origPos.x+sh).toFixed(2)} ${p.origPos.y.toFixed(2)})`);
      }, 'linear')));
    }

    // ── Ph3 (1300-2100ms) 单侧冲击 ──
    // 赢方向输方推进到碰撞点（两方中点偏输方 30%）
    const winnerPhantoms = ambWins ? ambPhantoms : vicPhantoms;
    const loserPhantoms  = ambWins ? vicPhantoms : ambPhantoms;
    const loserAnchor    = ambWins ? vicAnchor : ambAnchor;
    const winnerAnchor   = ambWins ? ambAnchor : vicAnchor;
    const clashX = winnerAnchor.x + (loserAnchor.x - winnerAnchor.x)*0.7;
    const clashY = winnerAnchor.y + (loserAnchor.y - winnerAnchor.y)*0.7;

    winnerPhantoms.forEach(p => {
      // 从当前 targetPos tween 到碰撞点附近
      p._preTarget = { x: p.targetPos?.x ?? p.origPos.x, y: p.targetPos?.y ?? p.origPos.y };
      const dx = loserAnchor.x - p._preTarget.x, dy = loserAnchor.y - p._preTarget.y;
      const len = Math.hypot(dx, dy) || 1;
      p.targetPos = { x: p._preTarget.x + dx*0.55, y: p._preTarget.y + dy*0.55 };
    });
    await Promise.all(winnerPhantoms.map(p => _baCore.runTween(400, te => {
      const cx = p._preTarget.x + (p.targetPos.x - p._preTarget.x)*te;
      const cy = p._preTarget.y + (p.targetPos.y - p._preTarget.y)*te;
      p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    }, 'easeIn')));

    _baCore.spawnClashRing(animG, clashX, clashY, { maxR: 26, duration: 700, invS });
    _baCore.spawnClashMark(animG, clashX, clashY, { duration: 950 });
    _baCore.shakeMapSvg({ amplitude: hit?3:2, duration: 320 });

    // 输方"残兵"抖动 + 倾斜
    await Promise.all(loserPhantoms.map(p => _baCore.runTween(300, te => {
      const amp = (ambWins ? 4 : 2) * invS;
      const sh = Math.sin(te*Math.PI*7) * amp * (1-te);
      p.el.setAttribute('transform', `translate(${(p.origPos.x+sh).toFixed(2)} ${p.origPos.y.toFixed(2)})`);
    }, 'linear')));
    // 最终残兵姿态
    loserPhantoms.forEach(p => {
      p.el.setAttribute('transform', `translate(${p.origPos.x.toFixed(2)} ${p.origPos.y.toFixed(2)}) rotate(12)`);
      p.el.setAttribute('opacity', '0.5');
    });

    // ── Ph4 (2100-3000ms) 结果大字 + 飘字 + 归阵 ──
    let resultText, resultColor;
    if(hit && ambWins){ resultText = '伏击得手'; resultColor = '#c03030'; }
    else if(hit && !ambWins){ resultText = '伏击失利'; resultColor = '#2a506e'; }
    else if(!hit && ambWins){ resultText = '识破反胜'; resultColor = '#2a506e'; }
    else { resultText = '伏兵被识破'; resultColor = '#2a506e'; }
    const rt = _baCore.spawnResultText(animG, mx, my - 26*invS, resultText, resultColor, invS);
    _baCore.animateResultText(rt, mx, my - 26*invS, 1200);

    // 飘字
    const ambPerUnit = Math.round((report.ambushLost||0) / Math.max(1, attackers.length));
    const vicPerUnit = Math.round((report.victimLost||0) / Math.max(1, defenders.length));
    phantoms.forEach(p => {
      const myLost = p.isAtk ? ambPerUnit : vicPerUnit;
      if(myLost <= 0) return;
      const posX = (p.targetPos?.x ?? p.origPos.x);
      const posY = (p.targetPos?.y ?? p.origPos.y);
      const startY = posY - 18*invS;
      const isPlayer = p.unit.fac === G.playerFac;
      const txt = _baCore.spawnLossText(animG, posX, startY, myLost, isPlayer, invS);
      _baCore.floatLossText(txt, startY, 1100, invS);
    });
    await sleep(400);

    // 赢方归阵（输方保持倾斜淡出）
    await Promise.all(winnerPhantoms.map(p => _baCore.runTween(300, te => {
      const from = p.targetPos, to = p.origPos;
      const cx = from.x + (to.x - from.x)*te;
      const cy = from.y + (to.y - from.y)*te;
      p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    }, 'easeInOut')));
    await _baCore.runTween(300, te => {
      terrainOverlay.setAttribute('opacity', (1 - te).toFixed(3));
    }, 'easeOut');

    animG.remove();
    hiddenUnitEls.forEach(g => { g.style.visibility = ''; });
  } catch(err){
    console.error('[AmbushAnim] exception:', err);
  } finally {
    _battleAnimating = false;
    _baCore.cleanupAnimLayers(['ambush-anim-layer']);
  }
}

// ─────────────────────────────────────────────────────────────
// v175 Step 3: 攻城战动画（_playSiegeBattleAnim）
// 4 幕：列阵 → 箭雨 → 云梯攀爬 → 破城 / 退敌
// 不另画城墙，效果围绕地图上的城市 icon 展开
// ─────────────────────────────────────────────────────────────
/**
 * 攻城战动画
 * @param {Object} report siegeReport（type='battle' atkWins, atkLost, defLost, cityBreach?）
 * @param {Array} attackers 攻方
 * @param {Array} defenders 守方野战部队（可能为空，仅城防军时会在内部造虚拟 garrison phantom）
 * @param {Object} posSnap {id: {hq, hr}}
 * @param {Object} city 攻城目标城市（G.cities[id]，需含 id/q/r）
 * @returns {Promise<void>}
 */
async function _playSiegeBattleAnim(report, attackers, defenders, posSnap, city){
  try {
    if(!report) return;
    if(!city) return;
    // ★ v175fix2/fix3: 若 defenders 空（城内只有 garrison 或已空城），构造虚拟 garrison 占位 unit
    // 让 shouldSkip 能通过；动画内部也用它画一面小旗贴在城市 icon 上
    // 注意：不再判断 city.garrison > 0 —— resolveSiegeBattle 胜后会把 city.garrison 清零，
    // 但 report.defLost 仍反映了战前守军损失。只要攻城战发生了，就应该有一方守城可视化。
    let effectiveDefenders = defenders;
    let virtualGarrison = null;
    if(!defenders || defenders.length === 0){
      const garrisonTroops = (city.garrison > 0) ? city.garrison
        : (report.defLost > 0 ? Math.max(500, Math.round(report.defLost * 0.3)) : 500);
      // D-anim-2 fix (sprint_followup §5.1 P1 真 root cause): 用 report.defFac (战前守方 fac, resolveBattle L6852 已记录) 而非 city.fac
      // city.fac 在攻城胜利后已被 resolveSiegeBattle (military.js:5967) 改成 atkFac, virtualGarrison 跟着变 AI 方
      // 导致 _baCore.shouldSkip hasPlayer 检查 (line 186) defenders.some(u.fac===G.playerFac) 返回 false → 误判 'AI vs AI no player' → 跳过 anim
      // user 实测复现: AI 攻玩家南阳/徐州城, defenders 空 (玩家城无野战驻军), 构造 virtualGarrison 用 city.fac (已变 AI) → anim 跳过
      virtualGarrison = {
        id: '_anim_garrison_' + city.id,
        fac: report.defFac || city.fac, // D-anim-2 fix
        hq: city.q, hr: city.r,
        _isVirtualGarrison: true,
        squads: [{ genName: (city.name||'城')+'守军', troops: garrisonTroops, morale: 60 }],
      };
      effectiveDefenders = [virtualGarrison];
      // 把它临时塞入 posSnap（不影响原 posSnap，因为 virtualGarrison.id 独一无二）
      posSnap = posSnap || {};
      posSnap[virtualGarrison.id] = { hq: city.q, hr: city.r };
    }
    if(_baCore.shouldSkip(attackers, effectiveDefenders, report, posSnap)) return;

    const layer = _baCore.ensureAnimLayer('siege-anim-layer');
    if(!layer) return;
    const { animG, invS } = layer;
    _battleAnimating = true;

    const atkWins = !!report.atkWins;
    const cityBreach = (report.cityBreach !== undefined) ? !!report.cityBreach : atkWins;

    // ── 城市 icon 的屏幕位置作为 siege center（防御性：若 city 未展开 x/y 则用 hexToPixel 计算） ──
    let cityCX, cityCY;
    if(typeof city.x === 'number' && typeof city.y === 'number'){
      cityCX = city.x; cityCY = city.y;
    } else if(typeof city.q === 'number' && typeof city.r === 'number' && typeof hexToPixel === 'function'){
      const p = hexToPixel(city.q, city.r);
      cityCX = p.x; cityCY = p.y;
    } else {
      // 最终 fallback：以攻方第一支部队的相邻位置作中心（极罕见路径）
      const a0 = attackers[0];
      if(a0 && typeof a0.hq === 'number' && typeof a0.hr === 'number' && typeof hexToPixel === 'function'){
        const p = hexToPixel(a0.hq, a0.hr);
        cityCX = p.x; cityCY = p.y;
      } else {
        cityCX = 0; cityCY = 0;
      }
    }

    // ── 位置 / 幻影 ──
    const allUnits = [...G.units];
    const atkPositions = attackers.map(u => ({ unit: u, pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id]) }));
    // ★ v175fix4: virtualGarrison 不做 phantom（不显示小旗），只保留占位用于 shouldSkip 和损失飘字
    // 守方野战部队正常做 phantom；虚拟 garrison 只参与 Ph4 的飘字/结果大字定位
    const defPositions = effectiveDefenders
      .filter(u => !u._isVirtualGarrison)
      .map(u => ({ unit: u, pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id]) }));

    const phantoms = [];
    const hiddenUnitEls = [];
    // 攻方 scene 位置：集中在城市 icon 南侧 40*invS
    atkPositions.forEach(({unit, pos}) => {
      const dx = pos.x - cityCX;
      const len = Math.abs(dx) || 1;
      const sideY = cityCY + 42*invS;
      const ox = cityCX + (dx/len) * 22*invS * (atkPositions.length > 1 ? 1 : 0);
      const scenePos = { x: ox, y: sideY };
      phantoms.push({ unit, el: _baCore.makePhantom(animG, unit, scenePos, invS, posSnap?.[unit.id]?.troops), // §5.10 fix: 战前 troops snap
        origPos: pos, isAtk: true, scenePos, targetPos: scenePos });
    });
    // 守方野战部队 phantom（虚拟 garrison 跳过，不创建）
    defPositions.forEach(({unit, pos}, idx) => {
      const dx = (idx % 2 === 0) ? -10*invS : 10*invS;
      const scenePos = { x: cityCX + dx, y: cityCY - 4*invS };
      phantoms.push({ unit, el: _baCore.makePhantom(animG, unit, scenePos, invS, posSnap?.[unit.id]?.troops), // §5.10 fix: 战前 troops snap
        origPos: pos, isAtk: false, scenePos, targetPos: scenePos });
    });

    // 隐藏原 unit icons（虚拟 garrison 不对应任何 DOM，所以不用隐藏）
    const unitsLayer = document.getElementById('unitsLayer');
    if(unitsLayer){
      const allOrigUnitGs = Array.from(unitsLayer.querySelectorAll('g[onclick]'));
      const participantIds = new Set([...attackers, ...effectiveDefenders].filter(u => !u._isVirtualGarrison).map(u => u.id));
      allOrigUnitGs.forEach(g => {
        const oc = g.getAttribute('onclick') || '';
        const m = oc.match(/onUnitLeftClick\('([^']+)'/);
        if(m && participantIds.has(m[1])){
          g.style.visibility = 'hidden';
          hiddenUnitEls.push(g);
        }
      });
    }

    // ── Ph0 (0-400ms) 列阵 ──
    phantoms.forEach(p => p.el.setAttribute('opacity', '0'));
    await _baCore.runTween(400, te => {
      phantoms.forEach(p => p.el.setAttribute('opacity', te.toFixed(3)));
    }, 'easeOut');

    // ── Ph1 (400-1400ms) 箭雨（从城市 icon 上方发出） ──
    const atkPhantoms = phantoms.filter(p => p.isAtk);
    const defPhantoms = phantoms.filter(p => !p.isAtk);
    const arrowCount = atkWins ? 5 : 8;
    const arrowSrcX = cityCX, arrowSrcY = cityCY - 12*invS;
    for(let i = 0; i < arrowCount; i++){
      const tgtPhantom = atkPhantoms[i % atkPhantoms.length];
      const tgt = tgtPhantom.scenePos;
      const arrow = document.createElementNS(_baCore.SVG_NS, 'line');
      arrow.setAttribute('stroke', 'rgba(40,30,20,.85)');
      arrow.setAttribute('stroke-width', (1.1*invS).toFixed(2));
      arrow.setAttribute('stroke-linecap', 'round');
      arrow.setAttribute('opacity', '0.9');
      animG.appendChild(arrow);
      const delay = i * 70;
      setTimeout(() => {
        const startX = arrowSrcX + (Math.random()-0.5)*8*invS;
        const startY = arrowSrcY;
        const endX = tgt.x + (Math.random()-0.5)*10*invS;
        const endY = tgt.y;
        _baCore.startTween(420, te => {
          const cx = startX + (endX - startX)*te;
          const arcH = -16*invS;
          const cy = startY + (endY - startY)*te + arcH * 4*te*(1-te);
          const te2 = Math.min(1, te+0.05);
          const nx = startX + (endX - startX)*te2;
          const ny = startY + (endY - startY)*te2 + arcH * 4*te2*(1-te2);
          const len = 5*invS;
          const dx = nx - cx, dy = ny - cy;
          const L = Math.hypot(dx, dy) || 1;
          arrow.setAttribute('x1', cx.toFixed(2));
          arrow.setAttribute('y1', cy.toFixed(2));
          arrow.setAttribute('x2', (cx + (dx/L)*len).toFixed(2));
          arrow.setAttribute('y2', (cy + (dy/L)*len).toFixed(2));
          arrow.setAttribute('opacity', (0.9 * (1 - te*0.3)).toFixed(3));
          if(te >= 0.98){
            _baCore.spawnSparks(animG, endX, endY, { count: 2, invS, colors:['rgba(220,220,220,.8)'], distRange:[3,6], lifeMs: 220 });
            arrow.setAttribute('opacity', '0');
          }
        }, 'linear');
      }, delay);
      setTimeout(() => { if(arrow.parentNode) arrow.remove(); }, delay + 700);
    }
    // 攻方阵列轻抖
    atkPhantoms.forEach(p => {
      _baCore.startTween(1000, te => {
        const sh = Math.sin(te*Math.PI*8) * 1.5*invS * (1-te*0.5);
        p.el.setAttribute('transform', `translate(${(p.scenePos.x+sh).toFixed(2)} ${p.scenePos.y.toFixed(2)})`);
      }, 'linear');
    });
    await sleep(1000);

    // ── Ph2 (1400-2600ms) 云梯 + 攀爬 ──
    const ladders = [];
    atkPhantoms.forEach(p => {
      const ladderX1 = p.scenePos.x, ladderY1 = p.scenePos.y;
      // 云梯顶端落在城市 icon 边缘（比 icon 中心略偏攻方一侧）
      const ladderX2 = cityCX + (ladderX1 - cityCX)*0.20;
      const ladderY2 = cityCY + 6*invS;
      const ladder = document.createElementNS(_baCore.SVG_NS, 'line');
      ladder.setAttribute('x1', ladderX1.toFixed(2));
      ladder.setAttribute('y1', ladderY1.toFixed(2));
      ladder.setAttribute('x2', ladderX1.toFixed(2));
      ladder.setAttribute('y2', ladderY1.toFixed(2));
      ladder.setAttribute('stroke', 'rgba(80,55,30,.85)');
      ladder.setAttribute('stroke-width', (1.6*invS).toFixed(2));
      ladder.setAttribute('stroke-linecap', 'round');
      animG.appendChild(ladder);
      ladders.push({ ladder, x1: ladderX1, y1: ladderY1, x2: ladderX2, y2: ladderY2 });
    });
    await Promise.all(ladders.map(L => _baCore.runTween(350, te => {
      L.ladder.setAttribute('x2', (L.x1 + (L.x2 - L.x1)*te).toFixed(2));
      L.ladder.setAttribute('y2', (L.y1 + (L.y2 - L.y1)*te).toFixed(2));
    }, 'easeOut')));

    // 攀爬小圆点
    ladders.forEach((L, idx) => {
      const atkFac = atkPhantoms[idx]?.unit?.fac;
      const climberCol = (typeof FAC !== 'undefined' && FAC[atkFac]?.color) || '#c96';
      for(let k = 0; k < 2; k++){
        const climber = document.createElementNS(_baCore.SVG_NS, 'circle');
        climber.setAttribute('r', (1.5*invS).toFixed(2));
        climber.setAttribute('fill', climberCol);
        climber.setAttribute('stroke', 'rgba(0,0,0,.5)');
        climber.setAttribute('stroke-width', (0.5*invS).toFixed(2));
        animG.appendChild(climber);
        const delay = k * 180;
        setTimeout(() => {
          _baCore.startTween(720, te => {
            climber.setAttribute('cx', (L.x1 + (L.x2-L.x1)*te).toFixed(2));
            climber.setAttribute('cy', (L.y1 + (L.y2-L.y1)*te).toFixed(2));
            climber.setAttribute('opacity', (1 - te*0.3).toFixed(3));
            if(te >= 0.98){ climber.remove(); }
          }, 'easeOut');
        }, delay);
        setTimeout(() => { if(climber.parentNode) climber.remove(); }, delay + 820);
      }
    });
    // 城市 icon 附近白刃相搏
    _baCore.spawnSlashes(animG, cityCX, cityCY - 2*invS, { angles:[30,90,150], invS, stagger: 80 });
    // 守方轻抖
    defPhantoms.forEach(p => {
      _baCore.startTween(800, te => {
        const sh = Math.sin(te*Math.PI*6) * 1.2*invS * (1-te*0.5);
        p.el.setAttribute('transform', `translate(${(p.scenePos.x+sh).toFixed(2)} ${p.scenePos.y.toFixed(2)})`);
      }, 'linear');
    });
    await sleep(1200);

    // ── Ph3 (2600-3400ms) 破城 / 退敌 ──
    if(cityBreach){
      // 破城：城市 icon 位置大号 clashRing + 火星 + 强震动 + 攻方冲向 icon
      _baCore.spawnClashRing(animG, cityCX, cityCY, { maxR: 38, duration: 700, invS });
      _baCore.spawnSparks(animG, cityCX, cityCY, { count: 11, invS, distRange: [14, 26] });
      _baCore.shakeMapSvg({ amplitude: 3.8, duration: 540 });
      atkPhantoms.forEach(p => {
        p._preScene = p.scenePos;
        p.targetPos = { x: cityCX + (p.scenePos.x - cityCX)*0.25, y: cityCY + 8*invS };
      });
      Promise.all(atkPhantoms.map(p => _baCore.runTween(450, te => {
        const cx = p._preScene.x + (p.targetPos.x - p._preScene.x)*te;
        const cy = p._preScene.y + (p.targetPos.y - p._preScene.y)*te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      }, 'easeIn')));
    } else {
      // 退敌：云梯断裂虚线化 + 攻方后退半透明
      ladders.forEach(L => {
        L.ladder.setAttribute('stroke-dasharray', `${(2*invS).toFixed(2)} ${(3*invS).toFixed(2)}`);
        _baCore.startTween(400, te => {
          L.ladder.setAttribute('opacity', (0.85 * (1 - te*0.65)).toFixed(3));
        }, 'easeIn');
      });
      atkPhantoms.forEach(p => {
        p._preScene = p.scenePos;
        p.targetPos = { x: p.scenePos.x + (p.scenePos.x - cityCX)*0.3, y: p.scenePos.y + 12*invS };
      });
      await Promise.all(atkPhantoms.map(p => _baCore.runTween(500, te => {
        const cx = p._preScene.x + (p.targetPos.x - p._preScene.x)*te;
        const cy = p._preScene.y + (p.targetPos.y - p._preScene.y)*te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        p.el.setAttribute('opacity', (1 - te*0.5).toFixed(3));
      }, 'easeOut')));
    }
    await sleep(500);

    // ── Ph4 (3400-4200ms) 结果大字 + 飘字 + 归阵 ──
    const defFac = city.fac || effectiveDefenders[0]?.fac || 'wei';
    const defColor = (typeof FAC !== 'undefined' && FAC[defFac]?.color) || '#806040';
    let resultText, resultColor;
    if(atkWins && cityBreach){ resultText = '城破'; resultColor = '#c03030'; }
    else if(atkWins){ resultText = '攻占得手'; resultColor = '#c03030'; }
    else { resultText = '退敌'; resultColor = defColor; }
    const rt = _baCore.spawnResultText(animG, cityCX, cityCY - 30*invS, resultText, resultColor, invS);
    _baCore.animateResultText(rt, cityCX, cityCY - 30*invS, 1200);

    const atkPerUnit = Math.round((report.atkLost||0) / Math.max(1, attackers.length));
    const defPerUnit = Math.round((report.defLost||0) / Math.max(1, effectiveDefenders.length));
    phantoms.forEach(p => {
      const myLost = p.isAtk ? atkPerUnit : defPerUnit;
      if(myLost <= 0) return;
      const posX = (p.targetPos?.x ?? p.scenePos.x);
      const posY = (p.targetPos?.y ?? p.scenePos.y);
      const startY = posY - 18*invS;
      const isPlayer = p.unit.fac === G.playerFac;
      const txt = _baCore.spawnLossText(animG, posX, startY, myLost, isPlayer, invS);
      _baCore.floatLossText(txt, startY, 1100, invS);
    });
    // ★ v175fix4: virtualGarrison 没做 phantom，补一条守军损失飘字从城市 icon 位置发出
    if(virtualGarrison && (report.defLost||0) > 0){
      // D-anim-3 fix (sprint_followup §5.3, 跟 §5.1 同模式): 用 report.defFac (战前守方) 而非 city.fac
      // city.fac 在攻城胜利后已被 resolveSiegeBattle 改成 atkFac, 玩家被攻陷时 isPlayer 误判 false → 飘字色错 (敌方红 而非玩家绿)
      const isPlayer = (report.defFac === G.playerFac);
      const startY = cityCY - 18*invS;
      const txt = _baCore.spawnLossText(animG, cityCX, startY, report.defLost, isPlayer, invS);
      _baCore.floatLossText(txt, startY, 1100, invS);
    }
    await sleep(400);

    // 归阵：虚拟 garrison 不归（没有 origPos 意义上的游戏位置 — 它 orig 就是 city 位置，与 scene 几乎重合）
    await Promise.all(phantoms.map(p => {
      const isWinner = atkWins ? p.isAtk : !p.isAtk;
      const endOp = isWinner ? 1 : 0.4;
      const from = { x: (p.targetPos?.x ?? p.scenePos.x), y: (p.targetPos?.y ?? p.scenePos.y) };
      return _baCore.runTween(300, te => {
        const cx = from.x + (p.origPos.x - from.x)*te;
        const cy = from.y + (p.origPos.y - from.y)*te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
        p.el.setAttribute('opacity', (1 + (endOp-1)*te).toFixed(3));
      }, 'easeInOut');
    }));

    animG.remove();
    hiddenUnitEls.forEach(g => { g.style.visibility = ''; });
  } catch(err){
    console.error('[SiegeAnim] exception:', err);
  } finally {
    _battleAnimating = false;
    _baCore.cleanupAnimLayers(['siege-anim-layer']);
  }
}


// ─────────────────────────────────────────────────────────────
// v175 Step 4: 水战动画（_playNavalBattleAnim）
// 船型幻影 + 冷色水花 + 涟漪；火攻版加火焰柱 + 败方倾斜
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} report resolveNavalBattle 返回 { isNaval:true, atkWins, atkLost, defLost, fireResult? }
 * @param {Array} attackers
 * @param {Array} defenders
 * @param {Object} posSnap
 * @returns {Promise<void>}
 */
async function _playNavalBattleAnim(report, attackers, defenders, posSnap){
  try {
    if(!report || !report.isNaval) return;
    if(_baCore.shouldSkip(attackers, defenders, report, posSnap)) return;

    const layer = _baCore.ensureAnimLayer('naval-anim-layer');
    if(!layer) return;
    const { animG, invS } = layer;
    _battleAnimating = true;

    const atkWins = !!report.atkWins;
    const fireOn = !!(report.fireResult && report.fireResult.success);

    const allUnits = [...G.units];
    const atkPositions = attackers.map(u => ({ unit: u, pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id]) }));
    const defPositions = defenders.map(u => ({ unit: u, pos: _baGetUnitRenderPos(u, allUnits, posSnap?.[u.id]) }));
    const atkAnchor = atkPositions[0].pos;
    const defAnchor = defPositions[0].pos;
    const mx = (atkAnchor.x + defAnchor.x) / 2;
    const my = (atkAnchor.y + defAnchor.y) / 2;

    // 冷色背景椭圆
    const waterBg = document.createElementNS(_baCore.SVG_NS, 'ellipse');
    waterBg.setAttribute('cx', mx.toFixed(2));
    waterBg.setAttribute('cy', my.toFixed(2));
    waterBg.setAttribute('rx', (60*invS).toFixed(2));
    waterBg.setAttribute('ry', (40*invS).toFixed(2));
    waterBg.setAttribute('fill', 'rgba(80,120,180,.20)');
    waterBg.setAttribute('opacity', '0');
    animG.appendChild(waterBg);

    // 船型幻影
    const phantoms = [];
    const hiddenUnitEls = [];
    atkPositions.forEach(({unit, pos}) => {
      phantoms.push({ unit, el: _baCore.makeShipPhantom(animG, unit, pos, invS, posSnap?.[unit.id]?.troops), origPos: pos, isAtk: true, targetPos: pos }); // §5.10 fix: 战前 troops snap
    });
    defPositions.forEach(({unit, pos}) => {
      phantoms.push({ unit, el: _baCore.makeShipPhantom(animG, unit, pos, invS, posSnap?.[unit.id]?.troops), origPos: pos, isAtk: false, targetPos: pos }); // §5.10 fix: 战前 troops snap
    });

    const unitsLayer = document.getElementById('unitsLayer');
    if(unitsLayer){
      const allOrigUnitGs = Array.from(unitsLayer.querySelectorAll('g[onclick]'));
      const participantIds = new Set([...attackers, ...defenders].map(u => u.id));
      allOrigUnitGs.forEach(g => {
        const oc = g.getAttribute('onclick') || '';
        const m = oc.match(/onUnitLeftClick\('([^']+)'/);
        if(m && participantIds.has(m[1])){
          g.style.visibility = 'hidden';
          hiddenUnitEls.push(g);
        }
      });
    }

    // ── Ph0 (0-400ms) 布阵 + 水纹 ──
    await _baCore.runTween(400, te => waterBg.setAttribute('opacity', (te*0.85).toFixed(3)), 'easeOut');
    // 每艘船底部散射 1 条涟漪
    phantoms.forEach(p => {
      _baCore.spawnClashRing(animG, p.origPos.x, p.origPos.y + 4*invS, {
        color: 'rgba(120,180,210,.6)', maxR: 14, duration: 800, invS, strokeWidth: 0.9,
      });
    });

    // ── Ph1 (400-1200ms) 接近 / 齐射 ──
    const atkPhantoms = phantoms.filter(p => p.isAtk);
    const defPhantoms = phantoms.filter(p => !p.isAtk);
    // 双方向中点推进 60%
    phantoms.forEach(p => {
      p.targetPos = { x: p.origPos.x + (mx - p.origPos.x)*0.6, y: p.origPos.y + (my - p.origPos.y)*0.6 };
    });
    _baCore.startTween(800, te => {
      phantoms.forEach(p => {
        const cx = p.origPos.x + (p.targetPos.x - p.origPos.x)*te;
        const cy = p.origPos.y + (p.targetPos.y - p.origPos.y)*te;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      });
    }, 'easeOut');

    // 齐射：双方各 2 支平射箭矢（从 target 位置互相发出）
    setTimeout(() => {
      const spawnArrow = (fromPhantom, toPhantom) => {
        const sx = fromPhantom.origPos.x + (fromPhantom.targetPos.x - fromPhantom.origPos.x)*0.55;
        const sy = fromPhantom.origPos.y + (fromPhantom.targetPos.y - fromPhantom.origPos.y)*0.55;
        const tx = toPhantom.origPos.x + (toPhantom.targetPos.x - toPhantom.origPos.x)*0.55;
        const ty = toPhantom.origPos.y + (toPhantom.targetPos.y - toPhantom.origPos.y)*0.55;
        const arrow = document.createElementNS(_baCore.SVG_NS, 'line');
        arrow.setAttribute('stroke', 'rgba(40,30,20,.85)');
        arrow.setAttribute('stroke-width', (1.1*invS).toFixed(2));
        arrow.setAttribute('stroke-linecap', 'round');
        animG.appendChild(arrow);
        _baCore.startTween(360, te => {
          const cx = sx + (tx - sx)*te;
          const cy = sy + (ty - sy)*te;
          const te2 = Math.min(1, te+0.06);
          const nx = sx + (tx - sx)*te2;
          const ny = sy + (ty - sy)*te2;
          const len = 4*invS;
          const dx = nx - cx, dy = ny - cy;
          const L = Math.hypot(dx, dy) || 1;
          arrow.setAttribute('x1', cx.toFixed(2));
          arrow.setAttribute('y1', cy.toFixed(2));
          arrow.setAttribute('x2', (cx + (dx/L)*len).toFixed(2));
          arrow.setAttribute('y2', (cy + (dy/L)*len).toFixed(2));
          arrow.setAttribute('opacity', (1 - te*0.2).toFixed(3));
          if(te >= 0.98) arrow.remove();
        }, 'linear');
        setTimeout(() => { if(arrow.parentNode) arrow.remove(); }, 500);
      };
      spawnArrow(atkPhantoms[0], defPhantoms[0]);
      spawnArrow(defPhantoms[0], atkPhantoms[0]);
    }, 500);

    // 火攻：火焰柱（从攻方船位置向上延伸）
    if(fireOn){
      const atkShip = atkPhantoms[0];
      const fireX = atkShip.origPos.x + (atkShip.targetPos.x - atkShip.origPos.x)*0.55;
      const fireYBase = atkShip.origPos.y + (atkShip.targetPos.y - atkShip.origPos.y)*0.55;
      // 设置 linearGradient（一次性）
      const defs = document.createElementNS(_baCore.SVG_NS, 'defs');
      animG.appendChild(defs);
      const gradId = 'naval-fire-grad-' + Date.now();
      const grad = document.createElementNS(_baCore.SVG_NS, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0'); grad.setAttribute('y1', '1');
      grad.setAttribute('x2', '0'); grad.setAttribute('y2', '0');
      grad.innerHTML = `
        <stop offset="0%" stop-color="rgba(255,200,80,.95)"/>
        <stop offset="55%" stop-color="rgba(220,60,40,.85)"/>
        <stop offset="100%" stop-color="rgba(220,60,40,0)"/>
      `;
      defs.appendChild(grad);

      const flame = document.createElementNS(_baCore.SVG_NS, 'path');
      flame.setAttribute('fill', `url(#${gradId})`);
      flame.setAttribute('opacity', '0');
      animG.appendChild(flame);
      const flameH = 34 * invS;
      const flameW = 10 * invS;
      // 每 70ms 重绘一次波形
      const drawFlame = (seed) => {
        const topY = fireYBase - flameH;
        // 用 3 段 Bezier 模拟火焰边缘
        const jL1 = (Math.sin(seed*1.3) * 1.5 + 0.5) * invS;
        const jR1 = (Math.cos(seed*1.7) * 1.5 + 0.5) * invS;
        const mL = fireX - flameW/2, mR = fireX + flameW/2;
        flame.setAttribute('d', `M${mL.toFixed(2)} ${fireYBase.toFixed(2)}
          C${(mL + jL1).toFixed(2)} ${(fireYBase - flameH*0.4).toFixed(2)}, ${(mL + 2*invS).toFixed(2)} ${(fireYBase - flameH*0.75).toFixed(2)}, ${fireX.toFixed(2)} ${topY.toFixed(2)}
          C${(mR - 2*invS).toFixed(2)} ${(fireYBase - flameH*0.75).toFixed(2)}, ${(mR - jR1).toFixed(2)} ${(fireYBase - flameH*0.4).toFixed(2)}, ${mR.toFixed(2)} ${fireYBase.toFixed(2)} Z`);
      };
      drawFlame(0);
      _baCore.startTween(900, te => {
        drawFlame(te * 10);
        flame.setAttribute('opacity', (te < 0.2 ? te*5 : te < 0.75 ? 1 : (1 - (te-0.75)/0.25)).toFixed(3));
        if(te >= 0.99) flame.remove();
      }, 'linear');
      // 火箭
      setTimeout(() => {
        const tgt = defPhantoms[0];
        const tx = tgt.origPos.x + (tgt.targetPos.x - tgt.origPos.x)*0.55;
        const ty = tgt.origPos.y + (tgt.targetPos.y - tgt.origPos.y)*0.55;
        const fireArrow = document.createElementNS(_baCore.SVG_NS, 'line');
        fireArrow.setAttribute('stroke', 'rgba(255,140,50,.95)');
        fireArrow.setAttribute('stroke-width', (1.6*invS).toFixed(2));
        fireArrow.setAttribute('stroke-linecap', 'round');
        animG.appendChild(fireArrow);
        _baCore.startTween(400, te => {
          const cx = fireX + (tx - fireX)*te;
          const cy = (fireYBase - flameH*0.6) + (ty - (fireYBase - flameH*0.6))*te;
          const len = 6*invS;
          const dx = tx - fireX, dy = ty - (fireYBase - flameH*0.6);
          const L = Math.hypot(dx, dy) || 1;
          fireArrow.setAttribute('x1', cx.toFixed(2));
          fireArrow.setAttribute('y1', cy.toFixed(2));
          fireArrow.setAttribute('x2', (cx + (dx/L)*len).toFixed(2));
          fireArrow.setAttribute('y2', (cy + (dy/L)*len).toFixed(2));
          fireArrow.setAttribute('opacity', (1 - te*0.2).toFixed(3));
          if(te >= 0.98) fireArrow.remove();
        }, 'linear');
        setTimeout(() => { if(fireArrow.parentNode) fireArrow.remove(); }, 500);
      }, 400);
    }

    await sleep(800);

    // ── Ph2 (1200-2400ms) 撞击 / 纵火 ──
    _baCore.spawnClashRing(animG, mx, my, { color: 'rgba(120,180,210,.75)', maxR: 24, duration: 700, invS });
    _baCore.spawnSparks(animG, mx, my, {
      count: 7, invS,
      colors: ['rgba(200,230,250,.9)', 'rgba(140,180,220,.9)'],
      distRange: [10, 16],
    });
    _baCore.shakeMapSvg({ amplitude: 2, duration: 320 });
    if(fireOn && atkWins){
      // 守方船位置火星
      const defShip = defPhantoms[0];
      const dx = defShip.origPos.x + (defShip.targetPos.x - defShip.origPos.x)*0.55;
      const dy = defShip.origPos.y + (defShip.targetPos.y - defShip.origPos.y)*0.55;
      setTimeout(() => {
        _baCore.spawnSparks(animG, dx, dy, {
          count: 9, invS,
          colors: ['rgba(255,160,60,.95)', 'rgba(255,80,40,.95)'],
          distRange: [14, 22],
        });
      }, 200);
    }

    await sleep(1200);

    // ── Ph3 (2400-3000ms) 败方倾斜 ──
    const loserPhantoms = atkWins ? defPhantoms : atkPhantoms;
    loserPhantoms.forEach(p => {
      _baCore.startTween(500, te => {
        const ang = te * -18;
        const dyOff = te * 6*invS;
        const cx = p.targetPos.x, cy = p.targetPos.y + dyOff;
        p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${ang.toFixed(1)})`);
        p.el.setAttribute('opacity', (1 - te*0.5).toFixed(3));
      }, 'easeIn');
    });
    // 火攻胜加烟雾
    if(fireOn && atkWins){
      loserPhantoms.forEach(p => {
        const smoke = document.createElementNS(_baCore.SVG_NS, 'ellipse');
        smoke.setAttribute('cx', p.targetPos.x.toFixed(2));
        smoke.setAttribute('cy', (p.targetPos.y - 4*invS).toFixed(2));
        smoke.setAttribute('rx', (10*invS).toFixed(2));
        smoke.setAttribute('ry', (6*invS).toFixed(2));
        smoke.setAttribute('fill', 'rgba(90,85,80,.55)');
        smoke.setAttribute('opacity', '0');
        animG.appendChild(smoke);
        _baCore.startTween(600, te => {
          const op = te < 0.5 ? te*2*0.55 : 0.55*(1 - (te-0.5)*2);
          smoke.setAttribute('opacity', op.toFixed(3));
          if(te >= 0.99) smoke.remove();
        }, 'linear');
      });
    }
    await sleep(600);

    // ── Ph4 (3000-3400ms) 结果大字 + 飘字 + 归阵 ──
    let resultText, resultColor;
    if(atkWins && fireOn){ resultText = '火攻大捷'; resultColor = '#d4601f'; }
    else if(atkWins){ resultText = '水战得手'; resultColor = '#2a506e'; }
    else { resultText = '水战败退'; resultColor = '#2a506e'; }
    const rt = _baCore.spawnResultText(animG, mx, my - 26*invS, resultText, resultColor, invS);
    _baCore.animateResultText(rt, mx, my - 26*invS, 1200);

    const atkPerUnit = Math.round((report.atkLost||0) / Math.max(1, attackers.length));
    const defPerUnit = Math.round((report.defLost||0) / Math.max(1, defenders.length));
    phantoms.forEach(p => {
      const myLost = p.isAtk ? atkPerUnit : defPerUnit;
      if(myLost <= 0) return;
      const posX = p.targetPos.x, posY = p.targetPos.y;
      const startY = posY - 18*invS;
      const isPlayer = p.unit.fac === G.playerFac;
      const txt = _baCore.spawnLossText(animG, posX, startY, myLost, isPlayer, invS);
      _baCore.floatLossText(txt, startY, 1100, invS);
    });
    await sleep(300);

    // 胜方归阵，败方保持倾斜 opacity 降到 0.3
    const winnerPhantoms = atkWins ? atkPhantoms : defPhantoms;
    await Promise.all(winnerPhantoms.map(p => _baCore.runTween(300, te => {
      const cx = p.targetPos.x + (p.origPos.x - p.targetPos.x)*te;
      const cy = p.targetPos.y + (p.origPos.y - p.targetPos.y)*te;
      p.el.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    }, 'easeInOut')));
    await _baCore.runTween(300, te => {
      waterBg.setAttribute('opacity', (0.85*(1-te)).toFixed(3));
      loserPhantoms.forEach(p => p.el.setAttribute('opacity', (0.5 + (0.3-0.5)*te).toFixed(3)));
    }, 'easeOut');

    animG.remove();
    hiddenUnitEls.forEach(g => { g.style.visibility = ''; });
  } catch(err){
    console.error('[NavalAnim] exception:', err);
  } finally {
    _battleAnimating = false;
    _baCore.cleanupAnimLayers(['naval-anim-layer']);
  }
}

/**
 * 静默结算一条 _pendingBattleConfirms 记录
 * 规则：玩家方永远"迎战"，不叫阵，结果写入 _battleReports
 */
// 军事链 MIL7.a (autoResolvePendingBattle + 3 lets + _checkSiegeArrival,L15991-L16107) 已抽离到 src/chains/military.js

async function _siegeArrivalChoice(choice){
  const modal = document.getElementById('siegeArrivalModal');
  if(!modal) return;
  const { unitId, cityId, attackers, defenders } = modal._ctx || {};
  modal.remove();

  const unit = G.units.find(u => u.id === unitId);
  const city = G.cities[cityId];
  if(!unit || !city) return;

  if(choice === 'attack'){
    // ★ v102: 直接结算攻城（一层弹窗，不再走launchSiegeAttack二次确认）
    // ★ v175: 战前位置快照
    const _siegePosSnap = {};
    [...attackers, ...defenders].forEach(u => { _siegePosSnap[u.id] = { hq: u.hq, hr: u.hr, troops: getUnitTroops(u) }; });
    const siegeReport = resolveSiegeBattle(attackers, defenders, city, city.name);
    if(siegeReport){
      siegeReport.playerWasAttacker = true;
      _battleReports.push(siegeReport);
      // ★ v175: 播放攻城战动画
      try {
        await _playSiegeBattleAnim(siegeReport, attackers, defenders, _siegePosSnap, city);
      } catch(e){ console.error('[SiegeAnim] arrival trigger failed:', e); }
    }
    renderAll();
    if(_pendingBattleConfirms.length) setTimeout(_showNextBattleConfirm, 300);
    else if(_battleReports.length) setTimeout(showNextBattleReport, 300);
    return;
  }
  // 'siege' → 保持围城状态
  renderAll();
  if(_pendingBattleConfirms.length) setTimeout(_showNextBattleConfirm, 300);
  else if(_battleReports.length) setTimeout(showNextBattleReport, 300);
}
