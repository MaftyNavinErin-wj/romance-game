// src/chains/event.js
//
// 事件链(EV)— 叛乱 / 疫病 / 事件冷却 / 事件扫描+派发 / 事件队列 / 玩家选择。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.10 / 阶段 3,chain 模板第六应用,Wave 3 第一个)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation,Node 脚本 line-by-line 复制 v181)。
//
// ── 抽离范围(1 段连续 verbatim,master scout 推荐顺序的核心理由 — 各前置链已抽完)──
//   EV1 事件链整段                            v181 L5420-L5747  (8 函数 + 上方 docstring)
//        checkRebellions(L5426)/ _triggerMinorRebellion / _triggerMajorRebellion
//        / processEventCooldowns / processPlagueSpreads
//        / rollEventsV2(扫描 + 派发核心)
//        / _popEventQueue / resolveEventChoice
//
// ── 留 v181 ──
//   `_showEventToPlayer`(已抽 src/render/modals.js,phase 2 时已抽)
//   事件 modal HTML 构造(已在 src/render/modals.js)
//   事件 effects 跨链 hub 函数(已抽各 chain):
//     `applyEthosShock`(已抽 chains/ethos.js)
//     `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud`(已抽 chains/diplomacy.js)
//     `_aggregateGentry / applyFamilyLoyaltyShock`(已抽 chains/gentry.js)
//     `addMerit / appointGenPost / setFactionRuler / startTechResearch`(已抽 chains/politics.js)
//     `triggerFactionEvent`(武将链派系事件 hub,留 v181 等 3.12)
//     `applyLoyaltyEvent`(武将链忠诚事件,留 3.12)
//   `EVENT_DEFS / AI_PERSONALITY / EVENT_CAT_COOLDOWN`(已抽 src/data/events.js,phase 1)
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G._eventQueue`(事件队列)
//   - `G._eventCooldown / G._eventCatCooldown / G._eventFired`(事件冷却 + 一次性事件标记)
//   - `G._pendingEvent`(当前展示给玩家的事件)
//   - `G.cities[id].rebellionCooldown`(叛乱冷却)
//   - `G.cities[id].plague / .plagueTurns`(疫病 state)
//   - `G.cities[id].fac / .morale / .pop / .garrison / .occupied`(叛乱触发时易手 / 屠杀)
//   - `G.units`(叛乱触发时 spawn rebel 野战部队)
//
// **跨链副作用写口**(按 (a) 原则,事件链是 effects 容器,跨链 effects 通过已抽
//  hub 函数调用,本 chain 函数体内不重复跨链 G subtree;唯一例外是 rebellions
//  spawn rebel units 写 G.units,这是叛乱机制的副作用,主写口在事件链):
//   - `_triggerMinorRebellion`:写 `G.units`(spawn rebel 野战部队 — 军事 state,
//      但叛乱触发是事件机制核心,整函数归事件链。3.11 抽军事**不反取**)
//   - `_triggerMajorRebellion`:写 `G.cities[id].fac = 'rebel'`(经济城市归属变更,
//      但城市易手是叛乱机制核心,3.9 经济**不反取**)+ 调 `clearAllPostsByGen`(政治)
//   - `rollEventsV2 / resolveEventChoice`:调 `effect()` 闭包,效果落各链已抽 hub
//      —— effect 闭包不在本 chain 函数体内,效果归属由各链 hub 决定
//   - `processPlagueSpreads`:写 `city.plague / .plagueTurns / .morale`(疫病传播
//      是事件机制,边界 morale 是经济 state 但疫病的主写口在事件)
//
// 这是 master scout §5 推荐顺序的核心理由:**事件链放 Wave 3 开头**,此时各前置链
// 已抽完,事件 effects 写口归属全部明确(经济 / 政治 / 外交 / 武将 / ethos / gentry
// 全部已抽到对应 chain,本 chain 只调 hub,不直接写跨链 G subtree)。
//
// 跨链 carry-over 验证(本 session 启动前):
//   §3.5 carry-over:events.js ~20 处 `applyEthosShock` 是反向调用,已抽 ethos ✓
//   §3.7-§3.9:事件 effects 多处调 `addDiplo / startClaimPrep / applyReputationPenalty /
//              checkBloodFeud / addMerit / appointGenPost / setFactionRuler /
//              startTechResearch` 全部已抽对应链,反向调用 OK ✓
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/ + src/render/ +
// chains/ethos.js + chains/gentry.js + chains/politics.js + chains/diplomacy.js +
// chains/economy.js,模块共享 hoisted function 全局可见,无 import/export)。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(callers):
//   - core(已抽):
//       `src/core/tick.js`:每旬调用 `processEventCooldowns / processPlagueSpreads /
//        rollEventsV2 / checkRebellions / _popEventQueue`
//   - render(已抽 src/render/modals.js):
//       事件 modal 按钮 onclick 调 `resolveEventChoice`
//   - 经济链(已抽 chains/economy.js):
//       `_triggerMinorRebellion / _triggerMajorRebellion` 被 `processCityFood /
//        processMorale / processPop / aiDoBuild` 等触发(实际是 checkRebellions
//        触发,不是经济直接调 — 反向调用 OK)
//   - inline EVENT_DEFS effect 闭包(已抽 src/data/events.js):
//       多处事件 effect 通过 closure 调本 chain helper(实际不调,EVENT_DEFS 只调
//       已抽各 hub chain;本 chain 是事件 orchestrator,被 tick 调,不被 events.js 反向调)
//
// 本 chain 调外部链(callees):
//   - `EVENT_DEFS / AI_PERSONALITY / EVENT_CAT_COOLDOWN / SEASONS`(已抽 src/data/events.js
//     + src/data/seasons.js)
//   - `_showEventToPlayer`(已抽 src/render/modals.js)
//   - `triggerFactionEvent / applyLoyaltyEvent`(武将链 hub,留 v181 等 3.12)
//   - `clearAllPostsByGen / setFactionRuler`(已抽 chains/politics.js)
//     — `_triggerMajorRebellion` 调
//   - `applyEthosShock`(已抽 chains/ethos.js)— effect 闭包通过 EVENT_DEFS 调
//     (本 chain 函数体内不直接调)
//   - `addDiplo / startClaimPrep / applyReputationPenalty / checkBloodFeud`
//     (已抽 chains/diplomacy.js)— effect 闭包通过 EVENT_DEFS 调
//   - `addMerit / appointGenPost / startTechResearch`(已抽 chains/politics.js)
//     — effect 闭包通过 EVENT_DEFS 调
//   - `_aggregateGentry / applyFamilyLoyaltyShock`(已抽 chains/gentry.js)
//     — effect 闭包通过 EVENT_DEFS 调
//   - `getUnitTroops / createUnit / hkey`(军事链,留 v181 等 3.11)
//     — `_triggerMinorRebellion` 调(spawn rebel 野战部队)
//   - `clearPrefectByGen`(武将链,留 v181 等 3.12)— `_triggerMajorRebellion` 调
//   - `log / fmt / showNotif`(已抽 src/render/notifications.js)
//   - `safeSub`(已抽 src/core/helpers.js)
//   - 数据 / 常量:`FAC / ALL_FACS / FAC_IDENTITY / CITY_MAP / CITIES_DEF /
//      EVENT_DEFS / AI_PERSONALITY / EVENT_CAT_COOLDOWN / SEASONS / PLAGUE_SPREAD_PROB`
//     (已抽 src/data/)
//   - `G(状态根)`(已抽 src/core/state.js)
//
// 同 phase 2/3.2/3.3/3.4/3.5/3.6/3.7/3.8/3.9 反向调用模式,设计原则 (c) 已 approve。
//
// ── plan §二偏离记录 ──
// PLAN §三阶段 3.10(原)字面:`chains/event.js(事件链 v4 / ~7 函数)`
//   字面映射:~7 函数(master scout)
// scout 实测 + 实装:**8 函数 verbatim ~328 行 + 230 header → event.js ~558 行**
//   (master scout 估 ~7 / 实测 8:`_popEventQueue` 是事件队列出列 helper,
//    与 rollEventsV2 + resolveEventChoice 配对,master scout 漏数 1)
// PLAN-vs-reality 偏差小,Wave 3 第一个最小 chain。
//
// scout-before-extract 第 10 次应用,scout 四件验证(p3.8 沉淀,p3.9 验证 0 bug)
// 全部 PASS:
//   (a) ✓ awk L5400-L5800 列范围内所有 function — 8 个事件链函数全部范围内,
//       L5764 起是军事链 aiGetAvailableGens(留 3.11),正确分离
//   (b) ✓ grep -n "^}" 验证 resolveEventChoice closing 在 L5747
//   (c) ✓ build 脚本 banner 终止标记 idempotent
//   (d) ✓ 主写口判定 — _triggerMinorRebellion 写 G.units / _triggerMajorRebellion
//       写 city.fac 都是叛乱机制核心,整函数归事件
//
// ── script 加载顺序(phase 3.5 拍板规范)──
// `data/* → core/* → chains/* → render/* → inline`
// 本文件加在 chains/economy.js 之后,render/notifications.js 之前。chains/ 内顺序无关。
//
// ── chain 抽离模板第六次应用(Wave 3 第一个,最小 chain)──
// phase 3.5-3.9 模板五次应用稳定,本 session 是 Wave 3 起点。事件链是 master scout
// §5 推荐顺序的核心:**Wave 3 开头**,各前置链已抽完,事件 effects 写口归属全部
// 明确,本 chain 只是 effects orchestrator,不直接写跨链 G subtree(rebellions 的
// G.units / city.fac 写口除外,叛乱机制核心整函数归事件)。
//   - 6 项 header 必含 ✓(含写口归属声明 + Wave 3 起点说明)
//   - 加载顺序规范 ✓
//   - phase 2 原则(_showEventToPlayer modal 已在 render/modals.js)✓
//   - 跨链反向调用 (c) 容许,callers/callees 按归属链整理 ✓
//   - 跨链 carry-over §3.5 + §3.7-§3.9 全部验证 PASS ✓
//   - Node 脚本 line-by-line verbatim 复制(预防 awk 边界 + 字符替换 bug)✓
//   - scout 四件验证全部 PASS ✓

// ════════════════════════════════════════════════════════════════════
// ── EV1 事件链整段 (v181 L5420-L5747) ──
// ════════════════════════════════════════════════════════════════════

/**
 * 叛乱系统（C1）
 * 小乱：morale<40 且 garrison/pop<3% → 刷出rebel野战部队，原城归属不变
 * 大乱：morale<20 且 garrison/pop<1% → 城市变rebel势力，野战部队被驱逐
 * 冷却：大乱后城市有 rebellionCooldown 字段，N旬内不再判断
 */
function checkRebellions(){
  const deployed = new Set();
  G.units.forEach(u=>u.squads.forEach(sq=>deployed.add(sq.genName)));

  Object.values(G.cities).forEach(city=>{
    // 中立/rebel城市不再触发
    if(!G.factions[city.fac] || city.fac==='rebel') return;

    // 大乱和小乱各自独立冷却（Bug6修复：互不影响）
    if((city.minorRebellionCooldown||0) > 0) city.minorRebellionCooldown--;
    if((city.majorRebellionCooldown||0) > 0) city.majorRebellionCooldown--;

    const garRatio = city.garrison / Math.max(city.pop, 1);

    // 太守政治修正：每100pol减10%概率
    let prefectMod = 1.0;
    if(city.prefect){
      const pol = GEN_MAP[city.prefect]?.pol ?? 0;
      const half = deployed.has(city.prefect) ? 0.5 : 1.0;
      prefectMod = Math.max(0, 1 - (pol/300)*half);
    }

    // ── 大乱判断（优先，有独立冷却）──
    // SKILL_INLINE: annan — 步骘安南：当官时南方城市(row≥50)叛乱阈值下调5点
    const _cityDef = CITY_MAP[city.id];
    const _buzhiActive = hasFacGen(city.fac, '步骘') && genHasOffice('步骘', city.fac) && _cityDef && _cityDef.r >= 50;
    const _majorThresh = _buzhiActive ? 15 : 20;
    const _minorThresh = _buzhiActive ? 35 : 40;
    if((city.majorRebellionCooldown||0) <= 0 && city.morale < _majorThresh && garRatio < 0.002){ // v107: pop×5, 阈值÷5
      const prob = (_majorThresh - city.morale) * 0.015 * prefectMod;
      if(Math.random() < prob){
        _triggerMajorRebellion(city);
        return;
      }
    }

    // ── 小乱判断（有独立冷却）──
    if((city.minorRebellionCooldown||0) <= 0 && city.morale < _minorThresh && garRatio < 0.006){ // v107: pop×5, 阈值÷5
      const prob = (_minorThresh - city.morale) * 0.008 * prefectMod;
      if(Math.random() < prob){
        _triggerMinorRebellion(city);
      }
    }
  });
}

function _triggerMinorRebellion(city){
  // Hex: spawn rebel on adjacent hex
  const cityDef = CITY_MAP[city.id];
  const spawnNbs = cityDef ? hexNeighbors(cityDef.q, cityDef.r).filter(n=>{
    if(getHexMoveCost(n.col,n.row,'light')>=999) return false;
    // ★ v103: 堆叠检查——已有部队的hex不能出生叛军
    if(G.units.some(u => u.hq === n.col && u.hr === n.row)) return false;
    return true;
  }) : [];
  if(!spawnNbs.length) return; // 所有邻格被占据，叛乱被镇压
  const spawnHex = spawnNbs[Math.floor(Math.random()*spawnNbs.length)];

  const troops = Math.floor(city.pop * (0.004 + Math.random()*0.004)); // v107: pop×5, 比例÷5
  const rebelUnit = {
    id: 'rebel_' + city.id + '_' + G.turn,
    fac: 'rebel',
    rebelOrigin: city.id,
    rebelBorn: G.turn,
    level: 1, exp: 0,
    status: 'halt',
    hq: spawnHex.col??0,
    hr: spawnHex.row??0,
    squads: [{
      genName: '叛军',
      type: 'light',
      troops,
      maxTroops: troops,
      morale: 60,
      _rebelCom: 50,
    }],
    movePath: [],  // hex grid
    hexPath: [],
    _battleCooldown: 0,
    mobilizingTurns: 0,
  };
  G.units.push(rebelUnit);
  city.morale = Math.min(city.morale + 2, 45);
  city.minorRebellionCooldown = 3;
  log(`🔥 ${city.name}爆发小乱！叛军${fmt(troops)}人出现在城外`, 'event');
}

function _triggerMajorRebellion(city){
  const prevFac = city.fac;
  const cityDef = CITY_MAP[city.id]; // v109 fix: 原代码缺失此变量导致ReferenceError
  city.fac = 'rebel';
  // ★ v132 F3/G3: 城市易手记录
  if(!G._cityChangeLog) G._cityChangeLog=[];
  G._cityChangeLog.push({turn:G.turn, cityId:city.id, from:prevFac, to:'rebel'});
  invalidateCityCache(); // ★ v117fix
  city.billetPool = []; // ★ v113: 叛乱→屯田兵员溃散
  city.morale = 30;
  city.garrison = 0; // ★ v118fix: 叛乱城防清零
  city.majorRebellionCooldown = 10;
  // C4: 叛乱易主更新快照
  updateFogCitySnapshot(city.id, 'rebel');
  // ★ v118fix: 天子易主检测（天子所在城叛乱→天子归属需处理）
  checkEmperorCapture(city.id, prevFac, 'rebel');
  // 清除太守（叛城太守职位作废，将领仍留在势力内）
  city.prefect = null;
  city._supplyRestoreTurns = SUPPLY_CITY_RESTORE_TURNS; // ★ v118fix: 叛乱城补给线断开
  _aiInvalidateThreatCache(); // ★ v118fix: 刷新AI威胁缓存
  // 大乱：原势力所有将领忠诚-3（治理失败，人心丧失）
  const prevGens = G.generals[prevFac] || [];
  prevGens.forEach(g => {
    if(g.role === 'ruler') return;
    const name = g.name;
    if(G.loyaltyAccum[name] === undefined) G.loyaltyAccum[name] = G.genLoyalty[name] ?? 80;
    G.loyaltyAccum[name] = Math.max(0, Math.min(100, G.loyaltyAccum[name] - 3));
  });
  // Bug3修复：只驱逐真正驻守此城的野战部队（getUnitNodeId===city.id）
  // 行军中路过的部队不受影响
  G.units.filter(u=>u.fac===prevFac).forEach(u=>{
    if(getUnitNodeId(u) !== city.id) return;
    // 找最近其他己方城市
    const nearest = Object.values(G.cities)
      .filter(c=>c.fac===prevFac && c.id!==city.id)
      .map(c => { const cd = CITY_MAP[c.id]; return cd ? {...c, _hd: hexDist(cityDef?.q||0, cityDef?.r||0, cd.q, cd.r)} : null; })
      .filter(Boolean)
      .sort((a,b)=>a._hd - b._hd)[0];
    if(nearest){
      const fromDef = CITY_MAP[city.id];
      const toDef = CITY_MAP[nearest.id];
      if(fromDef && toDef){
        const hexR = hexAstar(fromDef.q, fromDef.r, toDef.q, toDef.r, 'light');
        if(hexR){ u.hexPath = hexR.path.slice(1); u.movePath=[nearest.id]; u.status='march'; }
      }
    }
  });
  log(`🔥🔥 ${city.name}爆发大乱！城池易主为叛乱势力，原驻军被驱逐！`, 'event');
}

// T3 runRebelAI() 已抽离到 src/core/tick.js (Session 3.4)

// ═══════════════════════════════════════
// ★ v130 事件系统引擎 + A类天灾事件
// ═══════════════════════════════════════


// ── 事件引擎核心 ──

/** 每旬递减冷却（nextTurn开头调用） */
function processEventCooldowns(){
  if(!G._eventCooldown) G._eventCooldown={};
  if(!G._eventCatCooldown) G._eventCatCooldown={};
  Object.keys(G._eventCooldown).forEach(k=>{
    G._eventCooldown[k]--;
    if(G._eventCooldown[k]<=0) delete G._eventCooldown[k];
  });
  Object.keys(G._eventCatCooldown).forEach(k=>{
    G._eventCatCooldown[k]--;
    if(G._eventCatCooldown[k]<=0) delete G._eventCatCooldown[k];
  });
}

/** A2疫病扩散处理（nextTurn中rollEventsV2之后调用） */
function processPlagueSpreads(){
  ensureCityNeighbors();
  const plagued = Object.values(G.cities).filter(c=>c._plague && c._plague.hopsLeft>0);
  plagued.forEach(city=>{
    if(city.fac === 'rebel') return; // ★ batch-21 D-026: rebel 城状态冻结(疫病暂停传播,_plague 标记保留至解冻)
    if(Math.random()<0.30){
      const neighbors = G._cityNeighbors[city.id] || [];
      const targets = neighbors.filter(nid=>{
        const nc = G.cities[nid];
        return nc && nc.fac !== 'rebel' && !nc._plague; // ★ batch-21 D-026: rebel 城不接收疫病
      });
      if(targets.length){
        const tid = targets[Math.floor(Math.random()*targets.length)];
        const tc = G.cities[tid];
        const hasClinic = (tc.buildings.clinic||0)>0;
        tc.pop = Math.floor(tc.pop*(hasClinic?0.96:0.92));
        tc.morale = Math.max(0, tc.morale-15);
        tc.popQuality = Math.max(0, (tc.popQuality??65)-15);
        tc._plague = { turn:G.turn, hopsLeft: city._plague.hopsLeft-1 };
        log(`☠ 疫病从${city.name}蔓延至${tc.name}！${hasClinic?'医馆减轻损失':'人口大量损耗'}`,'event');
        // AI城市自动处理：根据人格选择
        if(tc.fac !== G.playerFac && tc.fac !== 'rebel'){
          const pers = AI_PERSONALITY[tc.fac] || AI_PERSONALITY.wei;
          const gold = G.factions[tc.fac]?.res?.gold ?? 0;
          if(pers.diploAggro < 0.5 && gold>=300){
            safeSub(G.factions[tc.fac].res, 'gold', 300);
            // 派医效果已在上面扣过pop/morale，这里补回差值（派医是×0.96而非×0.92）
            // 不再二次扣除，扩散本身已是"不管"的后果
            tc.gentry = Math.min(100,(tc.gentry||50)+3);
          } else if(gold>=150){
            safeSub(G.factions[tc.fac].res, 'gold', 150);
          }
          // 否则AI也不管，继续扩散链
        }
      }
    }
    // 清除已处理的疫源标记
    delete city._plague;
  });
}

// checkEventPromises 已抽离到 src/core/hubs.js (Session 3.2)

/** 主扫描函数：替代旧rollEvents */
function rollEventsV2(){
  if(!G._eventCooldown) G._eventCooldown={};
  if(!G._eventCatCooldown) G._eventCatCooldown={};
  if(!G._eventQueue) G._eventQueue=[];

  // D-134 fix: 灭国势力跳过事件 roll, 跟 D-129 processFacEthos / tick.js:184/693/703 _eliminated guard 同模式
  const facs = ALL_FACS.filter(f => !G.factions[f]?._eliminated);
  const triggered = []; // [{def, fid, ctx, forPlayer}]

  EVENT_DEFS.forEach(def=>{
    // 全局事件ID冷却
    if(G._eventCooldown[def.id]) return;
    // ★ v131: 一次性事件已触发则跳过
    if(def.oneTime && G._eventFired?.[def.id]) return;
    // 同类冷却
    if(G._eventCatCooldown[def.category]) return;
    // 季节限制
    if(def.season && !def.season.includes(SEASONS[G.seasonIdx])) return;

    facs.forEach(fid=>{
      // ★ v132: playerOnly事件跳过AI势力
      if(def.playerOnly && fid!==G.playerFac) return;
      const ctx = def.condition(fid);
      if(!ctx) return;
      ctx.fid = fid;
      triggered.push({ def, fid, ctx, forPlayer: fid===G.playerFac });
    });
  });

  if(!triggered.length) return;

  // 按优先级排序（1=危机最高）
  triggered.sort((a,b)=>a.def.priority - b.def.priority);

  // AI势力：静默处理所有事件
  triggered.filter(t=>!t.forPlayer).forEach(t=>{
    const pers = AI_PERSONALITY[t.fid] || AI_PERSONALITY.wei;
    const choices = t.def.choices(t.ctx);
    let idx = t.def.aiChoose(t.ctx, pers);
    // 安全校验：disabled选项跳过
    if(choices[idx]?.disabled){
      idx = choices.findIndex(c=>!c.disabled);
      if(idx<0) return; // 全部不可选，跳过
    }
    choices[idx].effect();
    // 设冷却
    G._eventCooldown[t.def.id] = t.def.cooldown;
    G._eventCatCooldown[t.def.category] = EVENT_CAT_COOLDOWN;
    // ★ v131: 一次性事件标记
    if(t.def.oneTime){ if(!G._eventFired) G._eventFired={}; G._eventFired[t.def.id]=G.turn; }
    log(`${t.def.icon} ${t.ctx.city?.name||t.ctx.genName||t.ctx.facLabel||t.ctx.complainerName||''}${t.def.name}（${FAC[t.fid]?.name||t.fid}）`,'event');
  });

  // 玩家势力：每旬最多1个弹窗，其余排队到下旬
  const playerEvents = triggered.filter(t=>t.forPlayer);
  if(playerEvents.length){
    const first = playerEvents[0];
    // 排队其余
    for(let i=1;i<playerEvents.length;i++){
      G._eventQueue.push(playerEvents[i]);
    }
    // ★ 快进模式下玩家事件也静默处理
    if(_fastForward){
      const pers = AI_PERSONALITY[first.fid] || AI_PERSONALITY.wei;
      const choices = first.def.choices(first.ctx);
      let idx = first.def.aiChoose(first.ctx, pers);
      if(choices[idx]?.disabled) idx = choices.findIndex(c=>!c.disabled);
      if(idx>=0) choices[idx].effect();
      G._eventCooldown[first.def.id] = first.def.cooldown;
      G._eventCatCooldown[first.def.category] = EVENT_CAT_COOLDOWN;
      // ★ v131: 一次性事件标记
      if(first.def.oneTime){ if(!G._eventFired) G._eventFired={}; G._eventFired[first.def.id]=G.turn; }
      log(`${first.def.icon} ${first.ctx.city?.name||first.ctx.genName||first.ctx.facLabel||first.ctx.complainerName||''}${first.def.name}`,'event');
    } else {
      _showEventToPlayer(first);
    }
  }
}

/** 从队列中弹出下一个玩家事件（如有） */
function _popEventQueue(){
  if(!G._eventQueue || !G._eventQueue.length) return;
  const next = G._eventQueue.shift();
  // 重新验证condition（城市可能已变化）
  if(next.ctx.city && next.ctx.city.fac !== G.playerFac) return; // 城市已丢失（A类天灾）
  _showEventToPlayer(next);
}

/** 展示事件弹窗给玩家 */

/** 玩家选择事件选项 */
function resolveEventChoice(idx){
  const evt = G._pendingEvent;
  if(!evt) return;
  const {def, ctx} = evt;
  const choices = def.choices(ctx);
  if(idx<0 || idx>=choices.length || choices[idx].disabled) return;

  // 执行效果
  choices[idx].effect();

  // 设冷却
  if(!G._eventCooldown) G._eventCooldown={};
  if(!G._eventCatCooldown) G._eventCatCooldown={};
  G._eventCooldown[def.id] = def.cooldown;
  G._eventCatCooldown[def.category] = EVENT_CAT_COOLDOWN;
  // ★ v131: 一次性事件标记
  if(def.oneTime){ if(!G._eventFired) G._eventFired={}; G._eventFired[def.id]=G.turn; }

  // 日志
  log(`${def.icon} ${ctx.city?.name||ctx.genName||ctx.facLabel||ctx.complainerName||''}${def.name}——${choices[idx].label}`,'event');

  // 关闭弹窗
  G._pendingEvent = null;
  document.getElementById('eventModal').style.display = 'none';

  // 检查队列中是否还有事件
  // 不立即弹出，让玩家喘口气，下旬处理
}
