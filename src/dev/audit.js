// ═══════════════════════════════════════════════════════
// ★ v119: 完整性审计 — 压力测试后批量断言检查
// ═══════════════════════════════════════════════════════

function runIntegrityAudit(){
  const errors = [];
  const warn = (group, msg) => errors.push({group, msg});
  const VALID_FACS = new Set([...getScenarioFactions(), 'rebel']);
  const VALID_STATUS = new Set(['garrison','march','halt','camp','ambush','siege']);

  // ── 1. 资源合法性 ──
  getScenarioFactions().forEach(fid => {
    const res = G.factions[fid]?.res;
    if(!res){ warn('资源','`G.factions['+fid+'].res` 不存在'); return; }
    ['gold','wood','iron','horses'].forEach(k => {
      const v = res[k];
      if(v === undefined || v === null) warn('资源', `${fid}.res.${k} = undefined/null`);
      else if(Number.isNaN(v)) warn('资源', `${fid}.res.${k} = NaN`);
      else if(v < 0) warn('资源', `${fid}.res.${k} = ${v} (负数)`);
    });
  });
  Object.entries(G.cities).forEach(([cid, city]) => {
    ['pop','garrison','morale'].forEach(k => {
      const v = city[k];
      if(v === undefined || v === null) warn('资源', `city[${cid}].${k} = undefined/null`);
      else if(Number.isNaN(v)) warn('资源', `city[${cid}].${k} = NaN`);
      else if(v < 0) warn('资源', `city[${cid}].${k} = ${v} (负数)`);
    });
    if(city.pop !== undefined && city.pop > 0 && city.popQuality !== undefined){
      if(Number.isNaN(city.popQuality)) warn('资源', `city[${cid}].popQuality = NaN`);
    }
  });

  // ── 2. 兵力 NaN/负数 ──
  G.units.forEach(u => {
    const total = getUnitTroops(u);
    if(Number.isNaN(total)) warn('兵力', `unit[${u.id}] getUnitTroops=NaN`);
    else if(total < 50) warn('兵力', `unit[${u.id}] getUnitTroops=${total} (应已被清除, <50)`);
    (u.squads||[]).forEach((sq, i) => {
      if(Number.isNaN(sq.troops)) warn('兵力', `unit[${u.id}] squad[${i}] troops=NaN (gen=${sq.genName})`);
      else if(sq.troops < 0) warn('兵力', `unit[${u.id}] squad[${i}] troops=${sq.troops} (负数, gen=${sq.genName})`);
    });
  });
  Object.entries(G.cities).forEach(([cid, city]) => {
    if(Number.isNaN(city.garrison)) warn('兵力', `city[${cid}].garrison = NaN`);
    else if(city.garrison < 0) warn('兵力', `city[${cid}].garrison = ${city.garrison} (负数)`);
  });

  // ── 3. loyaltyAccum 同步 ──
  if(G.genLoyalty && G.loyaltyAccum){
    // 只检查当前在某势力中的武将（在野/下野武将不需要loyaltyAccum）
    const activeFacGens = new Set();
    getScenarioFactions().forEach(fid => {
      (G.generals[fid]||[]).forEach(g => activeFacGens.add(g.name));
    });
    Object.keys(G.genLoyalty).forEach(name => {
      if(!activeFacGens.has(name)) return; // 在野/下野武将跳过
      const loy = G.genLoyalty[name];
      const acc = G.loyaltyAccum[name];
      if(loy === undefined || Number.isNaN(loy)) warn('忠诚同步', `genLoyalty[${name}] = ${loy}`);
      if(acc === undefined) warn('忠诚同步', `loyaltyAccum[${name}] 不存在 (genLoyalty=${loy})`);
      else if(Number.isNaN(acc)) warn('忠诚同步', `loyaltyAccum[${name}] = NaN`);
      else if(Math.abs(loy - acc) > 1.5) warn('忠诚同步', `${name}: genLoyalty=${loy}, loyaltyAccum=${acc.toFixed(2)}, 差=${Math.abs(loy-acc).toFixed(2)}`);
    });
  }

  // ── 4. 城市 fac 合法性 + prefect 一致性 ──
  Object.entries(G.cities).forEach(([cid, city]) => {
    if(!VALID_FACS.has(city.fac)) warn('城市fac', `city[${cid}].fac = '${city.fac}' (非法)`);
    if(city.prefect){
      if(city.fac === 'rebel') return; // 叛军无武将系统
      const gens = G.generals[city.fac] || [];
      if(!gens.some(g => g.name === city.prefect)){
        warn('城市fac', `city[${cid}] prefect='${city.prefect}' 不在 G.generals[${city.fac}] 中`);
      }
    }
  });

  // ── 5. 死武将残留 ──
  const allAliveGens = new Set();
  getScenarioFactions().forEach(fid => {
    (G.generals[fid]||[]).forEach(g => allAliveGens.add(g.name));
  });
  // 5a: 部队squads中的武将
  G.units.forEach(u => {
    if(u.fac === 'rebel') return; // 叛军genName可能不在标准池
    (u.squads||[]).forEach((sq, i) => {
      if(sq.genName && !allAliveGens.has(sq.genName)){
        warn('死将残留', `unit[${u.id}] squad[${i}] genName='${sq.genName}' 不在任何势力武将列表中`);
      }
    });
  });
  // 5b: 城市prefect
  Object.entries(G.cities).forEach(([cid, city]) => {
    if(city.prefect && city.fac !== 'rebel' && !allAliveGens.has(city.prefect)){
      warn('死将残留', `city[${cid}] prefect='${city.prefect}' 不在活武将池`);
    }
  });
  // 5c: 军师
  getScenarioFactions().forEach(fid => {
    const strat = G.factions[fid]?.strategist;
    if(strat && !allAliveGens.has(strat)){
      warn('死将残留', `${fid} strategist='${strat}' 不在活武将池`);
    }
  });
  // 5d: 官职表
  if(G.genPost){
    Object.keys(G.genPost).forEach(name => {
      if(G.genPost[name] && !allAliveGens.has(name)){
        warn('死将残留', `genPost['${name}']='${G.genPost[name]}' 但武将不在活武将池`);
      }
    });
  }

  // ── 6. 部队结构 ──
  G.units.forEach(u => {
    if(!u.squads || u.squads.length === 0) warn('部队结构', `unit[${u.id}] squads为空`);
    if(!VALID_FACS.has(u.fac)) warn('部队结构', `unit[${u.id}].fac='${u.fac}' (非法)`);
    if(!VALID_STATUS.has(u.status)) warn('部队结构', `unit[${u.id}].status='${u.status}' (非法)`);
    if(u.hq === undefined || u.hr === undefined) warn('部队结构', `unit[${u.id}] hq/hr 未定义`);
    else if(Number.isNaN(u.hq) || Number.isNaN(u.hr)) warn('部队结构', `unit[${u.id}] hq=${u.hq} hr=${u.hr} NaN`);
  });

  // ── 6b. 属县完整性 (v161) ──
  Object.entries(G.cities).forEach(([cid, city]) => {
    if(!city.counties || !city.counties.length) return;
    const psSum = city.counties.reduce((s,c) => s + c.popShare, 0);
    if(psSum < 0.99 || psSum > 1.01) warn('属县', `city[${cid}] popShare之和=${psSum.toFixed(4)} (应≈1.0)`);
    city.counties.forEach((c,i) => {
      if(c.loyalty === undefined || Number.isNaN(c.loyalty)) warn('属县', `city[${cid}] county[${i}].loyalty=${c.loyalty}`);
      if(c.type === 'clan_base' && !c.clanFamily) warn('属县', `city[${cid}] county[${i}] clan_base无clanFamily`);
    });
  });

  // ── 7. 结构完整性 ──
  // 7a: 重复unit.id
  const uidSet = new Set();
  G.units.forEach(u => {
    if(uidSet.has(u.id)) warn('结构', `重复 unit.id='${u.id}'`);
    uidSet.add(u.id);
  });
  // 7b: 同一武将分身（出现在多支部队squads中）
  const genInUnit = new Map(); // genName -> unitId
  G.units.forEach(u => {
    (u.squads||[]).forEach(sq => {
      if(!sq.genName) return;
      if(genInUnit.has(sq.genName)){
        warn('结构', `武将'${sq.genName}' 同时出现在 unit[${genInUnit.get(sq.genName)}] 和 unit[${u.id}]`);
      } else {
        genInUnit.set(sq.genName, u.id);
      }
    });
  });
  // 7c: genLoyalty中的幽灵武将（不存在于任何势力）
  if(G.genLoyalty){
    Object.keys(G.genLoyalty).forEach(name => {
      if(!allAliveGens.has(name)){
        // 检查是否在在野系统中（不算错误）
        const inWildPool = (G.wildPool||[]).includes(name);
        const inWildGens = typeof WILD_GENS !== 'undefined' && WILD_GENS.some(w => w.name === name);
        if(!inWildPool && !inWildGens) warn('结构', `genLoyalty['${name}'] 存在但武将不在任何势力/在野池/WILD_GENS`);
      }
    });
  }
  // 7d: 城市总数
  const cityCount = Object.keys(G.cities).length;
  if(cityCount !== 45) warn('结构', `城市数=${cityCount} (预期45)`);
  // 7e: 武将同时是太守+部署在外（允许，但检查太守城fac匹配）
  Object.entries(G.cities).forEach(([cid, city]) => {
    if(city.prefect && city.fac !== 'rebel'){
      // 太守势力应与城市势力一致
      const inFac = (G.generals[city.fac]||[]).some(g => g.name === city.prefect);
      if(!inFac){
        // 可能武将已转投他方
        let foundFac = null;
        getScenarioFactions().forEach(f => {
          if((G.generals[f]||[]).some(g => g.name === city.prefect)) foundFac = f;
        });
        if(foundFac) warn('结构', `city[${cid}] fac=${city.fac} prefect='${city.prefect}' 实际属于${foundFac}`);
      }
    }
  });

  // ★ v151: 价值观系统审计
  getScenarioFactions().forEach(fid => {
    const eth = G.factions[fid]?.ethos;
    if(!eth) { warn('价值观', `${fid} missing ethos object`); return; }
    ETHOS_DIMS.forEach(d => {
      if(typeof eth[d] !== 'number' || eth[d] < -100 || eth[d] > 100)
        warn('价值观', `${fid}.ethos.${d} = ${eth[d]} (expect -100~100)`);
    });
  });

  // ── 汇总输出 ──
  const groups = {};
  errors.forEach(e => {
    if(!groups[e.group]) groups[e.group] = [];
    groups[e.group].push(e.msg);
  });
  const allGroups = ['资源','兵力','忠诚同步','城市fac','死将残留','部队结构','结构','价值观'];
  let report = `\n${'═'.repeat(50)}\n  完整性审计 (第${G.turn}旬)\n${'═'.repeat(50)}\n`;
  let passCount = 0;
  allGroups.forEach(g => {
    const errs = groups[g];
    if(!errs || errs.length === 0){
      report += `  ✅ ${g}: 通过\n`;
      passCount++;
    } else {
      report += `  ❌ ${g}: ${errs.length}个异常\n`;
      errs.forEach(m => { report += `     · ${m}\n`; });
    }
  });
  report += `${'─'.repeat(50)}\n  总计: ${passCount}/${allGroups.length} 通过`;
  if(errors.length > 0) report += `, ${errors.length}个异常`;
  report += `\n${'═'.repeat(50)}`;

  console.log(report);

  // 弹窗摘要
  const summary = errors.length === 0
    ? `✅ 完整性审计通过（第${G.turn}旬）\n8/8 检查组全部通过`
    : `⚠️ 完整性审计（第${G.turn}旬）\n${passCount}/${allGroups.length} 通过，${errors.length}个异常\n\n` +
      allGroups.filter(g => groups[g]?.length).map(g => `❌ ${g}: ${groups[g].length}个`).join('\n') +
      '\n\n详情请查看浏览器控制台 (F12)';
  alert(summary);

  // 同时写入游戏日志
  if(errors.length === 0){
    log(`🔍 审计通过 (第${G.turn}旬): 8/8组全部合格`, 'economy');
  } else {
    log(`⚠️ 审计发现${errors.length}个异常 (第${G.turn}旬): ${allGroups.filter(g=>groups[g]?.length).join('/')}`, 'battle');
  }

  return {pass: errors.length === 0, errors, report};
}

// ═══════════════════════════════════════════════════════
// ★ v119: 势力淘汰 + 胜利/失败判定
// ═══════════════════════════════════════════════════════

function checkElimination(){
  getScenarioFactions().forEach(fid => {
    if(G.factions[fid]?._eliminated) return; // 已淘汰
    const cities = Object.values(G.cities).filter(c => c.fac === fid);
    const units = G.units.filter(u => u.fac === fid && getUnitTroops(u) > 0);
    if(cities.length === 0 && units.length === 0){
      // ── 淘汰该势力 ──
      G.factions[fid]._eliminated = true;
      G.factions[fid]._eliminatedTurn = G.turn;

      // 武将全部流入在野池
      const gens = G.generals[fid] || [];
      gens.forEach(g => {
        if(g.role === 'ruler') return; // 君主不入在野池
        clearPrefectByGen(g.name);
        clearAllPostsByGen(g.name);
        if(!WILD_GENS.find(x => x.name === g.name)){
          WILD_GENS.push({...g, defectedFrom: fid, defectedTurn: G.turn, minTurn: G.turn});
        }
        if(!G.wildPool.includes(g.name) && G.wildPool.length < 8) G.wildPool.push(g.name);
      });
      G.generals[fid] = gens.filter(g => g.role === 'ruler'); // 只保留君主（历史记录用）

      // 清除军师
      if(G.factions[fid]) G.factions[fid].strategist = null;

      // 清除外交关系中的该势力（停战/结盟失效）
      // ★ v167fix #32: 用split精确匹配，避免fid为子串时误匹配（如'wu'匹配'wuxing'）
      Object.keys(G.diplo).forEach(key => {
        const [a,b] = key.split('-');
        if(a === fid || b === fid){
          G.diplo[key].status = 'neutral';
        }
      });

      const facName = getFactionDef(fid)?.full || fid;
      log(`💀 ${facName}已覆灭！城池尽失，兵马殆尽。`, 'event');

      if(fid === G.playerFac){
        // 玩家被淘汰
        if(!_fastForward) setTimeout(() => showGameEndOverlay(false), 800);
      } else {
        if(!_fastForward) showNotif(`${facName}已覆灭！`, 'success');
      }
    }
  });

  // ── 胜利判定：只剩一家未淘汰 ──
  const alive = getScenarioFactions().filter(f => !G.factions[f]?._eliminated);
  if(alive.length === 1){
    const winner = alive[0];
    if(!G._victoryShown){
      G._victoryShown = true;
      if(winner === G.playerFac){
        if(!_fastForward) setTimeout(() => showGameEndOverlay(true), 1200);
        else log(`🏆 天下一统！${getFactionDef(winner)?.full}称霸四海！`, 'event');
      } else {
        if(!_fastForward) setTimeout(() => showGameEndOverlay(false, winner), 1200);
        else log(`💀 ${getFactionDef(winner)?.full}统一天下，你的势力已成历史尘埃。`, 'event');
      }
    }
  }
}
