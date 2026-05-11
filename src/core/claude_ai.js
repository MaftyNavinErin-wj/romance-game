// src/core/claude_ai.js
//
// Claude AI 决策与派发层 — LLM 驱动的非玩家势力决策模块。
//
// 来源:从 project_romance_v181.html L30669-L32067 抽离(Session 3.3 / 阶段 3,选项 A)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// ── 抽离范围(选项 A,经制作人 approve)──
//   段 C: `_claudeAI` 状态根(top-level let)            v181 L30669-L30689
//   段 D: 情报+战略+决策节奏 helper(v159 Phase 5)      v181 L30691-L31130
//          _updateIntelHistory / _buildIntelWarnings / _buildFogEstimates
//          _buildFogCities / _buildConstraints / _recordActionSummary
//          _recordWarJournal / _isStrategicTurn / _buildDeltaSnapshot
//   段 E: 战术 prompt `_tacticalSystemPrompt`            v181 L31131-L31193
//   段 F: 快照核心 `getGameState`                        v181 L31194-L31500
//   段 G: 战略 prompt `_claudeSystemPrompt`              v181 L31501-L31764
//   段 H: API 调用层(callClaudeAPI / callClaudeArtifact / 2 parser)  v181 L31765-L31933
//   段 I: 测试/调试工具(testClaudeAI / inspectState / setClaudeKey)   v181 L31935-L31977
//   段 J: 行动执行入口 `executeClaudeActions`            v181 L31978-L32010
//   段 K: 派发器 switch `_execOneAction`                 v181 L32011-L32067
//
// ── 留 v181(本 session 不抽,后续 sub-session 处理)──
//   段 A:HTML 按钮 + tab help(L601 / L29694-L29706)— UI shell,不抽
//   段 B:nextTurn 主循环内的调度耦合块(L10371-L10402)— 留 3.4 tick.js
//   段 L:名称解析器 _resolveCityId / _resolveFacId / _findUnit / _genInFac
//        / _genDeployed(L32069-L32088)— 通用 helper,留 3.5-3.12 共用判断
//   段 M:39 个 _execXxx 函数(L32094-L32717)— 各自写口落单一链,
//        按 (a) 原则归各 chain(3.5-3.12)
//   段 N:UI 模态 + API key + ping(L32720-L32966)— phase 2 已 approve
//        "modals 留 v181"原则,维持
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/state.js / helpers.js / hubs.js
// + src/render/ 模块共享 hoisted function 全局可见,无 import/export)。
//
// `_claudeAI` 是 top-level let,**兄弟于 G,不属 G 子树**。同 phase 3.1 抽 G 的
// 验证锚点(state.js header §"重要验证锚点"),跨 classic <script> 顶层 let
// 共享已经 phase 3.1 / 3.2 smoke 反复验证可靠。
//
// ── 反向调用(已 approve 设计原则 (c) 副作用通道)──
// 本文件抽出后仍会反向调用 v181 留下的:
//   - `_execBuild / _execSetTax / ... / _execEnthrone`(段 M 39 个)— K switch 派发
//   - `_resolveCityId / _resolveFacId / _findUnit / _genInFac / _genDeployed`
//     (段 L 5 个)— D / F / J / K / 段 M 共用查询 helper
//   - 大量 v181 留下的链原语:`getCityProd / getCityFoodNet / getCityFoodTurns
//     / calcCityCorruption / getCityStats / getSiegeDefMult / aiFrontierEnemyCities
//     / hexDist / calcUnitAP / getUnitTroops / getUnitNodeId / getStrategistInt
//     / fuzzyTroopDisplay / effectivePowerAgainst / getReadyClaim
//     / getAvailableClaims / _aiGetThreatMatrix / hkey / getScoutINT
//     / getFacUnitSalary / canAffordTech / canAffordMat / ensureCityNeighbors
//     / FOG_VISIBLE / ROAD_ADJ / CITY_MAP / GEN_MAP / GEN_TAGS / TECH_TREE
//     / BLDS / FAC / getScenarioFactions() / TAX / CLAIM_TYPES / REPUTATION_DEFAULT
//     / MAX_FIELD_UNITS_ABS / G(状态根)`
//   - 通知通道(已抽):`log / showNotif / _showEventToPlayer`
// 这些跨段引用同 phase 2 render → mechanism 反向调用模式,(c) 已 approve。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_1_notes §二 / phase3_2_notes §二)──
// PLAN 字面:"claude_ai.js — getGameState / prompt 构建 / _exec 派发器 / Claude API 调用"
//   字面映射:F + (E+G) + K + H = ~860 行
// scout 实测后选项 A 实抽:C + D + E + F + G + H + I + J + K = ~1399 行
//   多出:C(状态根 21)/ D(情报+战略 helper 440 行,v159 Phase 5 加,plan v1.0 不知)
//        / I(测试工具 43)/ J(executeClaudeActions 33)
//   原因:plan v1.0 写于 v159 之前,实际 v181 已经长出很多 plan 不知道的代码。
//        段 D 440 行就是例子。
// **新工作流原则**(本 session 起正式纳入,记 phase3_3_notes §五):
//   3.3 之后每个 sub-session 都要先 scout 实测,**不能照 plan 字面抽**。
//
// ── 选项 A vs D(scout 报告档案)── 制作人选 A 而非 D 的理由:
//   1. J + K 与 D 段 / H 段是流水线(Claude → H parse → J execute → K dispatch → M),
//      D 选项把 J + K 留 v181 拦腰切流水线,plan 没安排后续收口 session
//   2. (a) 原则要求 39 个 _execXxx(段 M)按 chain 归位 — A 和 D 都满足(都不抽 M)
//   3. D-100"_exec 派发器漏 enthrone case"的 bug 在 K 里 — A 抽 K 才能配合 audit
//      后续根治
//   4. 抽完后 claude_ai.js 是一个完整的"AI 决策与派发层",跨过这层进入各 chain
//      "AI 写 G"地盘,边界清晰
//
// ── D-099/D-100/D-121/D-130 信息暴露面 ──
// 4 个 HIGH 是 Claude AI 信息暴露面(读路径)。本文件抽完后:
//   - F getGameState(307 行)+ G _claudeSystemPrompt(264 行)+ E _tacticalSystemPrompt
//     (63 行)+ D 各 builder(440 行)= 信息暴露面 100% 收口在本模块内
//   - 后续 audit sprint 改信息暴露面只动 claude_ai.js 一个文件

// ═══════════════════════════════════════
// ★ v156: Claude AI 决策系统 (Phase 1)
// ═══════════════════════════════════════

let _claudeAI = {
  enabled: false,
  apiKey: '',
  endpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  apiFormat: 'anthropic',  // 'anthropic' | 'openai'
  proxyUrl: 'https://romance-proxy.wangjiejie89.workers.dev/proxy',  // ★ v167: Cloudflare Worker CORS代理
  _lastThinking: {},
  _lastActions: {},
  _callCount: 0,
  _totalTokens: 0,
  // ★ v159 Phase 5: 情报历史 + 战略记忆 + 决策节奏
  _intelHistory: {},      // per-faction intel tracking
  _strategyMemory: {},    // per-faction strategy continuity
  _lastStrategicTurn: {}, // per-faction last strategic evaluation turn
  _lastSnapshot: {},      // per-faction last full snapshot (for delta)
};

// ═══════════════════════════════════════
// ★ v159: Phase 5 — AI情报推理层 + 决策节奏
// ═══════════════════════════════════════

/** ── A: 情报历史更新（每旬runAI前调用） ── */
function _updateIntelHistory(fid) {
  if (!_claudeAI._intelHistory[fid]) {
    _claudeAI._intelHistory[fid] = { lastSeen: {}, visibleTrend: {}, lostCities: [] };
  }
  const ih = _claudeAI._intelHistory[fid];
  const fog = G.fog?.[fid];
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const myCityIds = myCities.map(c => c.id);

  // 1. 更新lastSeen：记录当前可见的每支敌军
  G.units.forEach(u => {
    if (u.fac === fid) return;
    if (!fog) return;
    const k = hkey(u.hq ?? 0, u.hr ?? 0);
    if ((fog[k] ?? 0) < FOG_VISIBLE) return;
    const leader = u.squads?.[0]?.genName;
    if (!leader) return;
    ih.lastSeen[leader] = {
      turn: G.turn, troops: getUnitTroops(u),
      loc: getUnitNodeId(u) || `${u.hq},${u.hr}`, fac: u.fac,
    };
  });

  // 2. 更新visibleTrend：每势力可见总兵力趋势
  const enemies = getScenarioFactions().filter(f => f !== fid && !G.factions[f]?._eliminated);
  enemies.forEach(ef => {
    if (!ih.visibleTrend[ef]) ih.visibleTrend[ef] = [];
    const visTotal = G.units.filter(u => u.fac === ef && fog &&
      (fog[hkey(u.hq ?? 0, u.hr ?? 0)] ?? 0) >= FOG_VISIBLE)
      .reduce((s, u) => s + getUnitTroops(u), 0);
    ih.visibleTrend[ef].push({ turn: G.turn, total: visTotal });
    if (ih.visibleTrend[ef].length > 12) ih.visibleTrend[ef].shift();
  });

  // 3. 记录丢城（对比上旬快照）
  const lastSnap = _claudeAI._lastSnapshot[fid];
  if (lastSnap?.myCityIds) {
    lastSnap.myCityIds.forEach(cid => {
      const city = G.cities[cid];
      if (city && city.fac !== fid) {
        ih.lostCities.push({ city: cid, turn: G.turn, toFac: city.fac });
        if (ih.lostCities.length > 10) ih.lostCities.shift();
        _recordWarJournal(fid, `失守${city.name || cid}(被${FAC[city.fac]?.name || city.fac}夺取)`); // ★ v159fix
      }
    });
  }

  // 4. 更新快照（每旬都更新，确保战术旬也能检测丢城）
  _claudeAI._lastSnapshot[fid] = { turn: G.turn, myCityIds };
}

/** ── A: 情报预警生成 ── */
function _buildIntelWarnings(fid) {
  const ih = _claudeAI._intelHistory[fid];
  if (!ih) return [];
  const warnings = [];
  const fogSnap = G.fogSnap?.[fid] || {};

  // 主力失踪预警
  Object.entries(ih.lastSeen).forEach(([name, info]) => {
    if (info.fac === fid) return;
    // 跳过已不存在的武将（阵亡/被俘后从游戏中移除）
    if (!GEN_MAP[name]) return;
    const gone = G.turn - info.turn;
    if (gone >= 4 && info.troops >= 5000) {
      const fuzzy = fuzzyTroopDisplay(info.troops, 50);
      warnings.push(`${name}部(上次:${info.loc},${fuzzy}人)已${gone}旬未见，去向不明`);
    }
  });

  // 兵力异常变化预警
  Object.entries(ih.visibleTrend).forEach(([ef, trend]) => {
    if (trend.length < 3) return;
    const recent = trend[trend.length - 1].total;
    const prev = trend[trend.length - 3].total;
    if (prev > 5000 && recent < prev * 0.65) {
      const facName = FAC[ef]?.name || ef;
      warnings.push(`${facName}方向可见兵力从约${prev}降至约${recent}，可能在调兵或另辟战场`);
    } else if (prev > 0 && recent > prev * 1.5 && recent - prev > 5000) {
      const facName = FAC[ef]?.name || ef;
      warnings.push(`${facName}方向可见兵力从约${prev}增至约${recent}，可能在集结进攻`);
    }
  });

  // 新占城威胁（扩大窗口至12旬，输出完整丢城序列帮助推断进攻轴线）
  const recentLost = (ih.lostCities || []).filter(lc => G.turn - lc.turn <= 12);
  recentLost.forEach(lc => {
    if (G.turn - lc.turn <= 5) {
      const cname = G.cities[lc.city]?.name || lc.city;
      const facName = FAC[lc.toFac]?.name || lc.toFac;
      warnings.push(`${facName}第${lc.turn}旬夺取${cname}，可能以此为跳板继续推进`);
    }
  });
  // 丢城序列摘要（帮助Claude推断进攻轴线）
  if (recentLost.length >= 2) {
    const seq = recentLost.map(lc => G.cities[lc.city]?.name || lc.city).join('→');
    warnings.push(`⚠进攻轴线：近${recentLost.length}城连续失守(${seq})，敌方在沿此路线推进`);
  }

  // 长期情报空白
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const myIds = new Set(myCities.map(c => c.id));
  myCities.forEach(mc => {
    (ROAD_ADJ[mc.id] || []).forEach(nbId => {
      if (myIds.has(nbId)) return;
      const snap = fogSnap[nbId];
      if (!snap) return;
      const stale = G.turn - (snap.turn || 0);
      if (stale >= 10) {
        const cname = G.cities[nbId]?.name || nbId;
        warnings.push(`${cname}已${stale}旬无情报，敌情完全未知`);
      }
    });
  });

  return warnings.slice(0, 8); // 限制条数避免token爆炸
}

/** ── B: 迷雾不确定性估算 ── */
function _buildFogEstimates(fid) {
  const fog = G.fog?.[fid];
  const fogSnap = G.fogSnap?.[fid] || {};
  const estimates = [];
  const enemies = getScenarioFactions().filter(f => f !== fid && !G.factions[f]?._eliminated);

  // 每城平均兵力系数（随游戏阶段调整）
  const avgPerCity = G.turn < 20 ? 2500 : G.turn < 50 ? 4000 : 5500;

  enemies.forEach(ef => {
    // 统计已知城市数（仅从fogSnap推断，保持迷雾一致性）
    let knownCities = 0;
    Object.entries(fogSnap).forEach(([cid, snap]) => {
      if (snap.fac === ef) knownCities++;
    });
    // 当前可见的城市也计入（fogSnap可能还没更新到最新）
    Object.values(G.cities).forEach(c => {
      if (c.fac !== ef) return;
      const cdef = CITY_MAP[c.id];
      if (!cdef) return;
      if (fog && (fog[hkey(cdef.q, cdef.r)] ?? 0) >= FOG_VISIBLE) {
        // 可见城市：如果fogSnap中没有记录为ef的，额外计数
        if (!fogSnap[c.id] || fogSnap[c.id].fac !== ef) knownCities++;
      }
    });
    const estCities = Math.max(knownCities, 1);

    // 可见兵力
    const visUnits = G.units.filter(u => u.fac === ef && fog &&
      (fog[hkey(u.hq ?? 0, u.hr ?? 0)] ?? 0) >= FOG_VISIBLE);
    const visTotal = visUnits.reduce((s, u) => s + getUnitTroops(u), 0);

    // 估算总兵力
    const estTotal = estCities * avgPerCity;
    const unaccounted = Math.max(0, estTotal - visTotal);

    // 置信度
    const ih = _claudeAI._intelHistory[fid];
    const trend = ih?.visibleTrend?.[ef] || [];
    // 找最近一次可见兵力>估算总兵力60%的旬（视为"较完整情报"）
    let lastFullIntel = 0;
    for (let i = trend.length - 1; i >= 0; i--) {
      if (trend[i].total > estTotal * 0.5) { lastFullIntel = trend[i].turn; break; }
    }
    const sinceFull = lastFullIntel > 0 ? G.turn - lastFullIntel : 99;
    const confidence = sinceFull <= 3 ? 'high' : sinceFull <= 8 ? 'medium' : 'low';

    estimates.push({
      fid: ef,
      known_cities: estCities,
      est_total: `${Math.round(estTotal * 0.8)}-${Math.round(estTotal * 1.3)}`,
      visible: visTotal,
      unaccounted: unaccounted > 1000 ? `约${Math.round(unaccounted / 1000) * 1000}` : '较少',
      confidence,
    });
  });
  return estimates;
}

/** ── B: 迷雾城市估算 ── */
function _buildFogCities(fid) {
  const fogSnap = G.fogSnap?.[fid] || {};
  const fog = G.fog?.[fid] || {};
  const result = [];
  Object.entries(fogSnap).forEach(([cid, snap]) => {
    if (snap.fac === fid) return; // 自己的城不需要
    if (snap.fac === 'none') return;
    const cdef = CITY_MAP[cid];
    if (!cdef) return;
    const k = hkey(cdef.q, cdef.r);
    if ((fog[k] ?? 0) >= FOG_VISIBLE) return; // 当前可见的不需要估算
    const stale = G.turn - (snap.turn || 0);
    if (stale <= 0) return;
    result.push({ id: cid, last_fac: snap.fac, stale });
  });
  result.sort((a, b) => a.stale - b.stale);
  return result.slice(0, 10);
}

/** ── B: 资源约束摘要（告诉Claude什么做得了什么做不了） ── */
function _buildConstraints(fid) {
  const fac = G.factions[fid];
  if (!fac) return [];
  const c = [];
  const gold = Math.round(fac.res?.gold || 0);
  const iron = Math.round(fac.res?.iron || 0);
  const wood = Math.round(fac.res?.wood || 0);
  const horse = Math.round(fac.res?.horses || 0);
  const myCities = Object.values(G.cities).filter(ci => ci.fac === fid);

  // 征兵：基础成本720金/3000兵（不算折扣）
  const recruitBase = 720;
  const idleGens = (G.generals[fid] || []).filter(g => {
    if (g.role === 'ruler') return false;
    if (_genDeployed(g.name, fid)) return false;
    if (myCities.some(ci => ci.prefect === g.name)) return false;
    if (fac.strategist === g.name) return false;
    if (fac._tech?.current?.genName === g.name) return false;
    return true;
  });
  if (gold < recruitBase) c.push(`金${gold}不足征兵(需${recruitBase}+)`);
  else if (idleGens.length === 0) c.push('无闲置武将可征兵');
  else c.push(`金${gold}可征兵约${Math.floor(gold / recruitBase)}次`);

  // 建筑：检查每城建造队列和资源
  let canBuildCities = 0;
  const fullQueueCities = [];
  const noSlotCities = [];
  myCities.forEach(ci => {
    const ts = getCityStats(ci.tags || []);
    const usedSlots = Object.keys(ci.buildings || {}).length;
    const qCap = ci.pop >= 500000 ? 4 : ci.pop >= 250000 ? 3 : ci.pop >= 100000 ? 2 : 1;
    if ((ci.buildQueue || []).length >= qCap) { fullQueueCities.push(ci.id); return; }
    // 检查是否有至少一个建筑可以建造
    let anyAffordable = false;
    Object.entries(BLDS).forEach(([bid, bld]) => {
      const curLv = (ci.buildings || {})[bid] || 0;
      if (curLv >= 3) return;
      if ((ci.buildQueue || []).find(q => q.id === bid)) return;
      if (bld.restrict?.length && !bld.restrict.some(req => (ci.tags || []).includes(req))) return;
      if (!ci.buildings?.[bid] && usedSlots >= ts.slots) return;
      const lvDef = bld.levels?.[curLv];
      if (!lvDef) return;
      if (Object.entries(lvDef.c).every(([r, amt]) => (fac.res[r] || 0) >= amt)) anyAffordable = true;
    });
    if (anyAffordable) canBuildCities++;
    else if (usedSlots >= ts.slots) noSlotCities.push(ci.id);
  });
  if (fullQueueCities.length) c.push(`建造队列满:${fullQueueCities.join(',')}`);
  if (canBuildCities > 0) c.push(`${canBuildCities}城可建造`);
  else c.push('当前无城可建造(资源不足或队列/槽位满)');

  // 侦察
  const scoutCd = G.strategyCD?.[fid]?.scout || 0;
  if (scoutCd > 0) c.push(`侦察CD剩${scoutCd}旬`);
  else if (gold < 800) c.push(`金${gold}不足侦察(需800)`);

  // 送礼
  if (gold < 500) c.push('金不足送礼(需500+)');

  // 科技
  if (fac._tech?.current) c.push(`研究中:${fac._tech.current.techId}(剩${fac._tech.current.turnsLeft}旬)`);

  // 关键资源短缺
  if (iron < 200) c.push(`铁${iron}偏低`);
  if (wood < 200) c.push(`木${wood}偏低`);

  return c;
}

/** ── C: 战略记忆 — 记录本旬行动摘要 ── */
function _recordActionSummary(fid, executedActions) {
  if (!_claudeAI._strategyMemory[fid]) {
    _claudeAI._strategyMemory[fid] = {
      strategy_intent: '', intent_set_turn: 0, stance: '',
      contingency: {}, recent_actions: [], war_journal: [],
    };
  }
  const mem = _claudeAI._strategyMemory[fid];
  // 根据成功执行的指令生成摘要
  const parts = [];
  executedActions.forEach(a => {
    switch (a.type) {
      case 'move': case 'attack':
        parts.push(`${a.army_leader || a.leader}部→${a.target_city || a.target}`); break;
      case 'recruit':
        parts.push(`${a.city}征兵`); break;
      case 'build':
        parts.push(`${a.city}建${a.building}`); break;
      case 'declare_war':
        parts.push(`对${a.target}宣战`); break;
      case 'propose_alliance':
        parts.push(`与${a.target}结盟`); break;
      case 'research':
        parts.push(`研究${a.tech}`); break;
      case 'set_prefect':
        parts.push(`${a.general}任${a.city}太守`); break;
      case 'appoint_post':
        parts.push(`${a.general}封${a.post}`); break;
      default:
        if (a.type?.startsWith('scheme_')) parts.push(`计谋:${a.type}`);
    }
  });
  if (parts.length) {
    mem.recent_actions.push({ turn: G.turn, summary: parts.join('，') });
    if (mem.recent_actions.length > 6) mem.recent_actions.shift();
  }
}

/** ── C: 战略记忆 — 记录重大事件 ── */
function _recordWarJournal(fid, event) {
  if (!_claudeAI._strategyMemory[fid]) {
    _claudeAI._strategyMemory[fid] = {
      strategy_intent: '', intent_set_turn: 0, stance: '',
      contingency: {}, recent_actions: [], war_journal: [],
    };
  }
  const mem = _claudeAI._strategyMemory[fid];
  mem.war_journal.push({ turn: G.turn, event });
  if (mem.war_journal.length > 10) mem.war_journal.shift();
}

/** ── D: 决策节奏 — 判断是否战略旬 ── */
function _isStrategicTurn(fid) {
  const mem = _claudeAI._strategyMemory[fid];
  // 无记忆 → 首次，必须做战略评估
  if (!mem || !mem.strategy_intent) return true;
  // 周期性（每6旬，势力错峰）
  const offset = { wei: 0, shu: 2, wu: 4, nanman: 3 }[fid] || 0;
  if (((G.turn - 1) + offset) % 6 === 0) return true;
  // 事件触发
  const ih = _claudeAI._intelHistory[fid];
  if (ih?.lostCities?.some(lc => lc.turn === G.turn)) return true; // 本旬丢城
  // 检查是否刚被宣战（本旬diplo变为enemy）
  const enemies = getScenarioFactions().filter(f => f !== fid);
  for (const ef of enemies) {
    const d1 = G.diplo[`${fid}-${ef}`] || {};
    const d2 = G.diplo[`${ef}-${fid}`] || {};
    // _warDeclaredTurn可能只存在于一个方向的key上
    if ((d1.status === 'enemy' || d2.status === 'enemy') &&
        (d1._warDeclaredTurn === G.turn || d2._warDeclaredTurn === G.turn)) return true;
  }
  return false;
}

/** ── D: 决策节奏 — 战术旬delta快照 ── */
function _buildDeltaSnapshot(fid) {
  const mem = _claudeAI._strategyMemory[fid] || {};
  const ih = _claudeAI._intelHistory[fid] || {};
  const lastSnap = _claudeAI._lastSnapshot[fid] || {};
  const fac = G.factions[fid];
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const myUnits = G.units.filter(u => u.fac === fid);

  // 部队位置变化
  const unitsMoved = myUnits.map(u => {
    const leader = u.squads?.[0]?.genName || '?';
    const loc = getUnitNodeId(u) || `${u.hq},${u.hr}`;
    const troops = getUnitTroops(u);
    const st = u.status || 'idle';
    const mob = (u.mobilizingTurns || 0) > 0 ? `,集结剩${u.mobilizingTurns}旬` : '';
    return `${leader}(${troops}兵,${loc},${st}${mob})`;
  });

  // 资源变化
  let totalFoodNet = 0, totalGoldNet = 0;
  myCities.forEach(c => { totalFoodNet += getCityFoodNet(c); totalGoldNet += (getCityProd(c).gold || 0); });
  totalGoldNet -= getFacUnitSalary(fid);

  // 预警
  const intelWarnings = _buildIntelWarnings(fid);

  // pending_plan: 从当前部队状态推算
  const pending = [];
  myUnits.forEach(u => {
    const leader = u.squads?.[0]?.genName || '?';
    if (u.status === 'march' && (u.hexPath?.length || u.movePath?.length)) {
      const dest = u.movePath?.[u.movePath.length - 1] || '未知';
      pending.push(`${leader}部: 行军→${dest}`);
    } else if ((u.mobilizingTurns || 0) > 0) {
      pending.push(`${leader}部: 集结中(剩${u.mobilizingTurns}旬)`);
    }
  });
  // 建造队列
  myCities.forEach(c => {
    (c.buildQueue || []).forEach(q => {
      pending.push(`${c.id}建${q.id}(剩${q.turnsLeft}旬)`);
    });
  });
  // 研究中
  if (fac?._tech?.current) {
    pending.push(`研究${fac._tech.current.techId}(剩${fac._tech.current.turnsLeft}旬)`);
  }

  // D-121 batch-25: 战术旬也支持 declare_war/propose_alliance, 需暴露 ethos
  const _ethosFac = fac?.ethos;
  const ethosStr = _ethosFac ? ETHOS_DIMS.map(dim => {
    const v = Math.round(_ethosFac[dim] || 0);
    return `${ETHOS_DIM_NAMES[dim]}${v}·${_ethosTierLabel(v, dim)}`;
  }).join('|') : undefined;

  return {
    mode: 'tactical',
    turn: G.turn, fid,
    my_cities: myCities.map(c => c.id),  // ★ v159: 己方城市ID列表（避免Claude猜错ID）
    ethos: ethosStr,
    strategy: mem.strategy_intent || '(无)',
    stance: mem.stance || '',
    contingency: mem.contingency || {},
    since_last_turn: {
      units: unitsMoved,
      resources: {
        gold: Math.round(fac?.res?.gold || 0),
        food: Math.round(myCities.reduce((s, c) => s + (c.storage || 0), 0)),
        gnet: Math.round(totalGoldNet), fnet: Math.round(totalFoodNet),
      },
      cities_lost: (ih.lostCities || []).filter(lc => lc.turn === G.turn).map(lc => lc.city),
      recent_events: (mem.war_journal || []).filter(j => G.turn - j.turn <= 2).map(j => j.event),
      intel_warnings: intelWarnings,
    },
    pending,
    recent_actions: (mem.recent_actions || []).slice(-3),
    // 迷雾估算仍然提供
    fog_estimates: _buildFogEstimates(fid),
    // ★ v159: 可侦察城市（己方相邻敌城，CD就绪时才输出）
    scout_targets: (() => {
      const cd = G.strategyCD?.[fid] || {};
      if ((cd.scout || 0) > 0) return undefined;
      const targets = [];
      const scouted = new Set((G.scoutReveals || []).filter(sr => sr.fid === fid && sr.expiresAt > G.turn).map(sr => sr.cityId));
      myCities.forEach(mc => {
        (ROAD_ADJ[mc.id] || []).forEach(nbId => {
          const nb = G.cities[nbId];
          if (nb && nb.fac !== fid && nb.fac !== 'none' && !scouted.has(nbId) && !targets.includes(nbId)) targets.push(nbId);
        });
      });
      return targets.length ? targets : undefined;
    })(),
    // ★ v159: 资源约束摘要
    constraints: _buildConstraints(fid),
  };
}

/** ── D: 战术旬精简prompt ── */
function _tacticalSystemPrompt(fid) {
  const personality = {
    wei: '曹操：务实激进，善用计谋。',
    shu: '刘备：仁义稳健，重民心忠诚。',
    wu: '孙权：平衡守成，善外交周旋。',
    nanman: '孟获：蛮族勇武，短期突袭为主。',
  };
  return `你是三国策略游戏中【${FAC[fid]?.full || fid}】的决策者。${personality[fid] || ''}

当前是**战术执行旬**——你已有既定战略，本旬的任务是沿着计划推进下一步。

## 决策要点
- 查看strategy和pending，判断计划是否正常推进
- 如果since_last_turn中没有重大意外，继续执行计划
- 如果触发了contingency中的某个预案条件，按预案调整
- 如果出现预案未覆盖的重大变故，在thinking中说明原因，做必要的微调
- **丢城是最强信号**：检查cities_lost和recent_events。如果连续丢城，从丢城序列推断敌方主攻方向（如A→B→C说明敌人在沿这条路线推进），立即将兵力调往敌方推进轴线上的下一个城市，而非固守远离战场的城市
- intel_warnings值得关注——"主力失踪"和"兵力集结"预警可能影响你的进攻计划
- fog_estimates中unaccounted兵力大时，进攻前考虑先侦察
- **如果敌军可见位置与你当前防御重心不在同一方向，说明你的战略可能已过时——在thinking中重新评估**

## 操作类型（严格使用以下格式，不可自行编造类型名或字段名）
- {"type":"build","city":"城市ID","building":"建筑ID"}
- {"type":"recruit","city":"城市ID"}
- {"type":"move","army_leader":"将名(中文)","target_city":"城市ID"}
- {"type":"attack","army_leader":"将名(中文)","target_city":"城市ID"}
- {"type":"set_camp","army_leader":"将名(中文)"}
- {"type":"set_ambush","army_leader":"将名(中文)"}
- {"type":"cancel_siege","army_leader":"将名(中文)"} — 取消围城转 halt
- {"type":"set_tax","level":"none/low/norm/heavy/harsh"}
- {"type":"set_corvee","level":"low/mid/high"} — 徭役档位(low不征/mid加速建设但-民心/high加速更多但代价更大)
- {"type":"toggle_resupply"} — 切换/flip 势力 resupply 开关(全军适用,非显式 set)
- {"type":"set_prefect","city":"城市ID","general":"将名(中文)"}
- {"type":"transfer_food","from":"城市ID","to":"城市ID"}
- {"type":"appoint_post","general":"将名(中文)","post":"官职名(中文)"}
- {"type":"dismiss_post","general":"将名(中文)"}
- {"type":"set_strategist","general":"将名(中文)"}
- {"type":"recruit_wild","general":"将名(中文)"}
- {"type":"poach","general":"将名(中文)"}
- {"type":"declare_war","target":"势力ID","claim":"宣称ID或null"}
- {"type":"propose_alliance","target":"势力ID"}
- {"type":"start_claim","target":"势力ID","claim_type":"宣称ID"}
- {"type":"diplo_gift","target":"势力ID","level":1}
- {"type":"diplo_armistice","target":"势力ID"} — 主动停战(花 1000 金,失败退 700 + rel+3)
- {"type":"research","tech":"科技ID","general":"将名(中文)"}
- {"type":"scheme_spy","target":"势力ID","general":"敌将名(中文)"}
- {"type":"scheme_scout","city":"城市ID"}
- {"type":"disband","army_leader":"将名(中文)"}

建筑ID: farm/irr/granary/market/road/harbor/barracks/workshop/stable/wall/school/clinic
势力ID: wei/shu/wu/nanman
城市ID: 用英文（如chengdu/jianye/xuchang等），不要用中文城市名

## 操作前置条件速查
- move/attack：只能操作armies中已有的部队（按leader名匹配），闲置武将需先recruit编入部队
- recruit：需城市+闲置武将+金720+，新兵需3旬集结(mobilizing)，集结期不可移动
- set_camp/set_ambush：仅野外部队可用，garrison(城内驻守)状态不可用——需先move出城
- set_ambush：额外要求地形为forest/hill/mountain/swamp
- build：受建筑槽位限制(小城1/中城2-3/大城3-4)，部分建筑有城市类型限制(irr需平原/水乡, harbor需港口城)
- 同一旬多条花钱指令按顺序扣费——前面的指令花完金后面的会失败，请在thinking中估算总花费

## 输出格式
返回严格JSON：{"thinking":"1-3句，说明本旬执行了什么以及有无意外","actions":[...]}
通常战术旬不改战略方向。但如果发生丢城、敌方主力出现在意料之外的位置等重大变故，可以输出strategy_intent来紧急修正战略。
局势稳定时，3-5条操作即可——少动比乱动好。`;
}

/** ── 核心：生成势力视角的局势快照 ── */
function getGameState(fid) {
  const fac = G.factions[fid];
  if (!fac) return null;
  const fog = G.fog?.[fid];
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  const myUnits = G.units.filter(u => u.fac === fid);
  const myGens = G.generals[fid] || [];
  const cityCount = myCities.length;
  ensureCityNeighbors();

  function isFrontline(cityId) {
    return (ROAD_ADJ[cityId] || []).some(nb => G.cities[nb] && G.cities[nb].fac !== fid && G.cities[nb].fac !== 'none');
  }
  function visibleEnemy(u) {
    if (!fog) return true;
    return (fog[hkey(u.hq ?? 0, u.hr ?? 0)] ?? 0) >= FOG_VISIBLE;
  }

  // ── 经济 ──
  let totalFoodNet = 0, totalGoldNet = 0;
  myCities.forEach(c => {
    totalFoodNet += getCityFoodNet(c);
    totalGoldNet += getCityProd(c).gold || 0;
  });
  const salary = getFacUnitSalary(fid);
  totalGoldNet -= salary;
  const avgCorruption = cityCount > 0 ? myCities.reduce((s, c) => s + calcCityCorruption(c, cityCount), 0) / cityCount : 0;

  // ── 城市 ──
  const cities = myCities.map(c => {
    const prod = getCityProd(c);
    const ft = getCityFoodTurns(c);
    const fl = isFrontline(c.id);
    const corruption = calcCityCorruption(c, cityCount);
    const bldList = Object.entries(c.buildings || {}).map(([id, lv]) => `${id}:${lv}`);
    const queueList = (c.buildQueue || []).map(q => `${q.id}(${q.turnsLeft}旬)`);
    const ts = getCityStats(c.tags || []);
    const usedSlots = Object.keys(c.buildings || {}).length;
    const qCap = c.pop >= 500000 ? 4 : c.pop >= 250000 ? 3 : c.pop >= 100000 ? 2 : 1;
    const canBuild = [];
    if ((c.buildQueue || []).length < qCap) {
      Object.entries(BLDS).forEach(([bid, bld]) => {
        const curLv = (c.buildings || {})[bid] || 0;
        if (curLv >= 3) return;
        if ((c.buildQueue || []).find(q => q.id === bid)) return;
        if (bld.restrict?.length && !bld.restrict.some(req => (c.tags || []).includes(req))) return;
        if (!c.buildings?.[bid] && usedSlots >= ts.slots) return;
        const lvDef = bld.levels?.[curLv];
        if (!lvDef) return;
        if (!Object.entries(lvDef.c).every(([r, amt]) => (fac.res[r] || 0) >= amt)) return;
        canBuild.push(bid);
      });
    }
    const cdef = CITY_MAP[c.id];
    const r = {
      id: c.id, name: c.name, pop: c.pop, size: cdef?.size || 'medium',
      tags: (c.tags || []).join(','),
      food_t: ft === Infinity ? 99 : Math.round(ft * 10) / 10,
      fprod: Math.round(prod.food), gprod: Math.round(prod.gold),
      bld: bldList.join(',') || '-', q: queueList.join(',') || '-',
      can: canBuild.length ? canBuild.join(',') : '-',
      gar: c.garrison || 0, front: fl ? 1 : 0,
      def: Math.round(getSiegeDefMult(c) * 100) / 100,
      corr: Math.round(corruption * 100),
      mor: Math.round((c.morale ?? 50) * 10) / 10,
      gen: Math.round((c.gentry ?? 50) * 10) / 10,
      pref: c.prefect || '-',
    };
    if (c.siegeDecay) r.siege = Math.round(c.siegeDecay * 100) + '%';
    return r;
  });

  // ── 部队 ──
  const armies = myUnits.map(u => {
    const loc = getUnitNodeId(u);
    const locName = loc || `${u.hq},${u.hr}`;
    const squads = (u.squads || []).map(sq => `${sq.genName}(${sq.type},${sq.troops})`);
    const reachable = [];
    if (u.status === 'garrison' || u.status === 'halt') {
      const frontier = aiFrontierEnemyCities(fid);
      frontier.forEach(cid => {
        const cdef = CITY_MAP[cid];
        if (!cdef) return;
        const dist = hexDist(u.hq ?? 0, u.hr ?? 0, cdef.q, cdef.r);
        const ap = calcUnitAP(u);
        const turns = ap > 0 ? Math.ceil(dist / ap) : 99;
        if (turns <= 6) {
          const ec = G.cities[cid];
          const hasGar = (ec?.garrison || 0) > 500 || G.units.some(eu => eu.fac === ec?.fac && getUnitNodeId(eu) === cid && getUnitTroops(eu) > 0);
          reachable.push({ id: cid, t: turns, gar: hasGar ? 1 : 0 });
        }
      });
      reachable.sort((a, b) => a.t - b.t);
      reachable.splice(3); // top 3 only
    }
    const avgMor = u.squads?.length ? Math.round(u.squads.reduce((s, sq) => s + (sq.morale ?? 50), 0) / u.squads.length) : 50;
    const r = {
      leader: (u.squads?.[0]?.genName) || '?',
      troops: getUnitTroops(u), mor: avgMor,
      loc: locName, st: u.status || 'idle',
      sq: squads.join('+'), lv: u.level || 1,
    };
    if ((u.mobilizingTurns || 0) > 0) r.mob = u.mobilizingTurns;
    if (reachable.length) r.targets = reachable;
    return r;
  });

  // ── 武将（精简：仅闲置/危险者详细输出） ──
  const generals = [];
  const genSummary = { total: myGens.length, in_army: 0, prefect: 0, strategist: 0, idle: 0 };
  // 当前官职持有者（让Claude知道谁已封官，避免重复任命）
  const postHolders = [];
  myGens.forEach(g => {
    const inUnit = myUnits.some(u => u.squads.some(sq => sq.genName === g.name));
    const isPrefect = myCities.some(c => c.prefect === g.name);
    const isStrat = fac.strategist === g.name;
    const loyalty = G.genLoyalty[g.name] ?? 70;
    const post = G.genPost?.[g.name];
    if (inUnit) genSummary.in_army++;
    else if (isPrefect) genSummary.prefect++;
    else if (isStrat) genSummary.strategist++;
    else genSummary.idle++;
    if (post) postHolders.push(`${g.name}:${post}`);
    // 只详细输出闲置的 或 忠诚≤65的
    if ((!inUnit && !isPrefect && !isStrat) || loyalty <= 65) {
      const info = {
        name: g.name, com: g.com, war: g.war, int: g.int, pol: g.pol, cha: g.cha,
        loy: loyalty, tag: (GEN_TAGS[g.name] || {}).origin || '?',
        assign: inUnit ? '军' : isPrefect ? '守' : isStrat ? '师' : '闲',
      };
      if (post) info.post = post;
      generals.push(info);
    }
  });
  if (postHolders.length) genSummary.posts = postHolders.join(',');

  // ── 派系（精简：仅输出边缘化武将） ──
  const marginalizedGens = myGens.filter(g => (G.genLoyalty[g.name] ?? 70) < 55).map(g => ({
    name: g.name, loyalty: G.genLoyalty[g.name] ?? 70, tag: (GEN_TAGS[g.name] || {}).origin || '?',
  }));

  // ── 外交 (含 ethos 距离 — D-121 batch-25) ──
  const diplomacy = getScenarioFactions().filter(f => f !== fid).map(other => {
    if (G.factions[other]?._eliminated) return null;
    const k = `${fid}-${other}`;
    const d = G.diplo[k] || {};
    const readyClaim = getReadyClaim(fid, other);
    const claims = getAvailableClaims(fid, other);
    const { selfPow, targetPow } = effectivePowerAgainst(fid, other);
    const ratio = targetPow > 0 ? Math.round(selfPow / targetPow * 100) / 100 : 99;
    const r = { fid: other, st: d.status || 'neutral', rel: d.rel ?? 50, pow: ratio };
    const eDist = _ethosDistance(fid, other);
    if (eDist > 0) r.e_dist = Math.round(eDist);
    if (readyClaim) r.claim = readyClaim.type;
    if (claims.length) r.claims = claims.map(c => c.type || c.id).join(',');
    if (d._claimPrep) r.prep = `${d._claimPrep.type}(${d._claimPrep.turnsLeft})`;
    if (d.status === 'enemy' && d._warDeclaredTurn) r.war_t = G.turn - d._warDeclaredTurn;
    return r;
  }).filter(Boolean);

  // ── 威胁矩阵（含敌军位置） ──
  let threats = [];
  try {
    const tm = _aiGetThreatMatrix(fid);
    threats = Object.entries(tm.threats || {}).map(([enemy, score]) => {
      const vis = G.units.filter(eu => eu.fac === enemy && getUnitTroops(eu) > 0 && visibleEnemy(eu));
      const totalReal = vis.reduce((s, eu) => s + getUnitTroops(eu), 0);
      const worstInt = vis.length > 0 ? Math.min(...vis.map(eu => getScoutINT(eu))) : 0;
      // 每支可见敌军：位置+兵力+距最近己城距离
      const units = vis.map(eu => {
        const eLoc = getUnitNodeId(eu);
        const scoutInt = getScoutINT(eu);
        const leader = scoutInt >= 60 ? (eu.squads[0]?.genName || '?') : '?';
        const troops = fuzzyTroopDisplay(getUnitTroops(eu), scoutInt);
        // 距最近己方城市
        let minDist = 99;
        myCities.forEach(mc => {
          const mcd = CITY_MAP[mc.id];
          if (mcd) { const d = hexDist(eu.hq ?? 0, eu.hr ?? 0, mcd.q, mcd.r); if (d < minDist) minDist = d; }
        });
        return `${leader}(${troops},${eLoc || '野外'},距${minDist}格)`;
      });
      return {
        fid: enemy, score: Math.round(score * 10) / 10,
        troops: fuzzyTroopDisplay(totalReal, worstInt), n: vis.length,
        units: units.length ? units : undefined,
      };
    }).filter(t => t.score > 0);
  } catch (e) { }

  // ── 科技 ──
  const _tech = fac._tech;
  const techState = {};
  if (_tech?.current) {
    techState.cur = _tech.current.techId;
    techState.left = _tech.current.turnsLeft ?? '?';
    techState.gen = _tech.current.genName || '-';
  }
  techState.done = _tech?.researched ? [..._tech.researched].join(',') : '-';
  const avail = [];
  Object.entries(TECH_TREE).forEach(([tid, t]) => {
    if (_tech?.researched?.has(tid)) return;
    if (_tech?.current?.techId === tid) return;
    if (t.prereq && t.prereq.length && !t.prereq.every(r => _tech?.researched?.has(r))) return;
    avail.push(tid);
  });
  if (avail.length) techState.avail = avail.join(',');

  // ── 计谋 ──
  const cd = G.strategyCD?.[fid] || {};
  const sInt = getStrategistInt(fid);
  const schemes = {
    strategist: fac.strategist || '无(用君主INT)',
    int: sInt,
    available: [
      { name: '驱虎吞狼', cd: cd.driveWolf || 0, desc: '强制两势力开战' },
      { name: '二虎竞食', cd: cd.twoTigers || 0, desc: '两势力关系-20' },
      { name: '反间计', cd: cd.spy || 0, desc: '敌将忠诚-15' },
      { name: '散布谣言', cd: cd.rumor || 0, desc: '敌城民心-20' },
      { name: '细作探报', cd: cd.scout || 0, desc: '侦察敌城3旬' },
    ].filter(s => s.cd <= 0),
  };
  // ★ v159: 可侦察城市列表（己方城市的相邻敌城）
  if ((cd.scout || 0) <= 0) {
    const scoutTargets = [];
    const alreadyScouted = new Set((G.scoutReveals || []).filter(sr => sr.fid === fid && sr.expiresAt > G.turn).map(sr => sr.cityId));
    myCities.forEach(mc => {
      (ROAD_ADJ[mc.id] || []).forEach(nbId => {
        const nb = G.cities[nbId];
        if (nb && nb.fac !== fid && nb.fac !== 'none' && !alreadyScouted.has(nbId) && !scoutTargets.includes(nbId)) {
          scoutTargets.push(nbId);
        }
      });
    });
    if (scoutTargets.length) schemes.scout_targets = scoutTargets;
  }

  // ── 在野+挖角（精简） ──
  const wildAvail = (G.wildPool || []).map(name => {
    const g = GEN_MAP[name]; if (!g) return null;
    return `${name}(${g.com}/${g.war}/${g.int}/${g.pol}/${g.cha})`;
  }).filter(Boolean);
  const poachAvail = Object.entries(G.recruitableGens || {}).filter(([, rec]) => rec.fid !== fid).map(([name]) => {
    const loy = G.genLoyalty[name];
    return loy != null && loy < 60 ? name : null;
  }).filter(Boolean);

  // ── 诊断预警（精简） ──
  const warn = [];
  if (_tech?.current) warn.push(`研究中:${_tech.current.techId}(${_tech.current.genName},剩${_tech.current.turnsLeft}旬)`);
  if (totalFoodNet < 0) warn.push(`粮亏${Math.round(totalFoodNet)}/旬`);
  if (totalGoldNet < 0) warn.push(`金亏${Math.round(totalGoldNet)}/旬`);
  myCities.forEach(c => { const ft2 = getCityFoodTurns(c); if (ft2 < 5 && ft2 !== Infinity) warn.push(`${c.id}粮${Math.round(ft2)}旬`); });
  if (avgCorruption > 0.15) warn.push(`腐败${Math.round(avgCorruption * 100)}%`);
  const totalTroops = myUnits.reduce((s, u) => s + getUnitTroops(u), 0);
  const totalPop = myCities.reduce((s, c) => s + (c.pop || 0), 0);
  if (totalPop > 0 && totalTroops > totalPop * 0.15) warn.push(`兵民比${Math.round(totalTroops / totalPop * 100)}%`);
  marginalizedGens.forEach(g => warn.push(`${g.name}忠${g.loyalty}`));

  const recentLog = (G._log || []).slice(-5).map(l => l.text || l).filter(t => typeof t === 'string');

  // ★ v159 Phase 5: 情报预警 + 迷雾估算 + 战略记忆
  const intelWarnings = _buildIntelWarnings(fid);
  const fogEstimates = _buildFogEstimates(fid);
  const fogCities = _buildFogCities(fid);
  const stratMem = _claudeAI._strategyMemory[fid];
  const strategyContext = stratMem?.strategy_intent ? {
    intent: stratMem.strategy_intent,
    intent_turn: stratMem.intent_set_turn,
    stance: stratMem.stance || '',
    contingency: stratMem.contingency || {},
    recent_actions: (stratMem.recent_actions || []).slice(-4),
    war_journal: (stratMem.war_journal || []).filter(j => G.turn - j.turn <= 10),
  } : undefined;

  // 保存快照供下旬delta对比
  _claudeAI._lastSnapshot[fid] = {
    turn: G.turn,
    myCityIds: myCities.map(c => c.id),
  };

  // ── 价值观 5 维 + tier label (D-121 batch-25) ──
  // 紧凑 string 格式: '天命15·天命有归|权柄20·兼听则明|...' 节省 token
  const _ethosFac = fac.ethos;
  const ethosStr = _ethosFac ? ETHOS_DIMS.map(dim => {
    const v = Math.round(_ethosFac[dim] || 0);
    return `${ETHOS_DIM_NAMES[dim]}${v}·${_ethosTierLabel(v, dim)}`;
  }).join('|') : undefined;

  return {
    turn: G.turn, fid,
    econ: {
      gold: Math.round(fac.res?.gold || 0),
      food: Math.round(myCities.reduce((s, c) => s + (c.storage || 0), 0)),
      iron: Math.round(fac.res?.iron || 0), wood: Math.round(fac.res?.wood || 0),
      horse: Math.round(fac.res?.horses || 0),
      gnet: Math.round(totalGoldNet), fnet: Math.round(totalFoodNet),
      salary: Math.round(salary),
    },
    ethos: ethosStr,
    cities, armies, gen_summary: genSummary, generals,
    rep: G.reputation?.[fid] ?? REPUTATION_DEFAULT,
    diplo: diplomacy, threats, tech: techState, schemes,
    wild: wildAvail.length ? wildAvail : undefined,
    poach: poachAvail.length ? poachAvail : undefined,
    warn: warn.length ? warn : undefined,
    log: recentLog.length ? recentLog : undefined,
    // ★ v159 Phase 5
    intel_warnings: intelWarnings.length ? intelWarnings : undefined,
    fog_estimates: fogEstimates.length ? fogEstimates : undefined,
    fog_cities: fogCities.length ? fogCities : undefined,
    strategy_context: strategyContext,
    // ★ v159: 资源约束摘要
    constraints: _buildConstraints(fid),
  };
}

/** ── System Prompt ── */
function _claudeSystemPrompt(fid) {
  const personality = {
    wei: '曹操：唯才是举，务实激进。倾向军事扩张，敢于冒险，屠城劫掠无太大心理负担。优先军事科技。善用计谋削弱敌方。信誉起始较低(45)，可走霸道路线。',
    shu: '刘备：仁义为先，稳健发展。重视民心和武将忠诚，倾向安民而非劫掠。优先民生科技。外交上倾向结盟对抗强敌。信誉起始高(80)，维护仁义形象。',
    wu: '孙权：平衡守成，善于外交。依托长江地利防守，经济优先。擅长在两强之间周旋，不轻易开战但把握时机果断。优先经济科技。水乡地形天然优势。',
    nanman: '孟获：蛮族勇武，资源有限。倾向劫掠获资，短期突袭为主，不擅长长期围城。信誉低(30)，无外交顾虑。',
  };

  return `你是三国策略游戏中【${FAC[fid]?.full || fid}】的最高决策者。你精通本游戏的全部数值系统，能进行精确的战力推算和经济规划。

## 一、战斗力计算（核心公式）

### 单squad战力
squadATK = troops × lvMult × moraleMult × comBonus × aptMult × TYPE_ATK × 克制 × 地形 × 混编 × 科技
squadDEF = troops × lvMult × moraleMult × comBonus × aptMult × TYPE_DEF × 地形 × defBonus × 科技

其中：
- lvMult = 1 + (level-1)×0.05（Lv1=1.00, Lv5=1.20, Lv10=1.45, Lv20=1.95）
- moraleMult = max(0.3, min(1.0, morale/100 + warMoraleBonus))，士气50=0.5倍战力，士气100=1.0
- comBonus(com) = 0.75 + com/100×0.5（统帅60=1.05, 80=1.15, 97=1.235）
- aptMult: S=1.20, A=1.10, B=1.00, C=0.88

### 兵种ATK/DEF基础值
骑兵ATK1.12/DEF1.10 | 轻步1.00/1.00 | 重步0.88/1.12 | 弓兵1.06/0.94 | 攻城0.48/0.48

### 兵种克制（进攻方→防御方乘数）
骑→弓1.35 | 骑→轻1.16 | 骑→攻城1.15 | 重步→骑1.08 | 重步→轻1.08 | 弓→重步1.02 | 弓→骑0.75

### 地形对兵种修正
平原：全1.0 | 山地：骑0.65, 重步1.10, 弓1.15 | 森林：骑0.80, 重步0.90 | 水域：骑0, 重步0

### 混编加成
骑+轻1.08 | 弓+重1.08 | 重+轻1.04 | 弓+轻1.04 | 骑+重0.94

### 胜率估算
rollA = 己方总ATK/敌方总DEF, rollB = 敌方总ATK/己方总DEF。双方各乘random(0.5~1.5)比大小。rollA/rollB比值越高胜率越高。比值2:1约80%胜率，1:1约50%。

### 城战守方加成（极关键！）
城防倍率 = 1 + (baseDef × durM + wallBonus) × (1-decay) × gentryDef
- baseDef: 小城2.0, 中城3.0, 大城4.0
- durM(地形): 雄关2.0, 山地1.4, 水乡1.1, 其他1.0
- wallBonus: 城墙每级+0.05(上限0.15)
- decay: 围城递增(0→1)，每旬+0.05~0.15，围满后城防归零
- 这意味着：未被围城的中等城市守方DEF×4.0！大城雄关DEF可达×9.0！不围城直接强攻几乎必败。

城防军：以重步兵形态参战，Lv3，士气=城市民心×0.8。
攻城战地形固定为plain。骑兵攻城没有地形惩罚但也没加成，应以步兵/攻城器为主。

## 二、经济系统

### 粮食
- 城市粮产 = base.food × popMult × 季节修正 × 建筑加成(农田+水利) × 腐败折损
- 消耗 = 民用(pop×0.0004) + 驻军(garrison×0.004)
- 存粮<0时人口流失0.1%/旬
- 部队军饷 = 每兵约0.015金/旬

### 征兵成本
- 金钱：1200金/5000兵 × 豪族修正 × 兵营折扣(Lv1=-10%,Lv2=-20%,Lv3=-30%) × 科技修正
- 人口：每征1兵=直接减1人口。9万人口城征5000兵=5.5%人口减少，极伤经济
- 新兵等级取决于popQuality：≥80→Lv5，每降10→-1级。过度征兵导致popQuality下降→新兵更弱
- 征兵后部队需2旬集结(mobilizing)，集结期间不可移动

### 补员（自动恢复）
- 领土内城市附近的部队自动补员，速率约200兵/旬/队（受前后方、人口、政策影响）
- 前线城补员快但消耗人口，后方城反之
- 补员政策：激进(前线70%/后方30%) | 均衡(各50%) | 精兵(前线30%/后方70%)

### 腐败
- 基础率 = (城数-3)×2%，上限30%。3城以下无腐败
- 太守pol高可减腐(pol100→-20%), 本地士族太守额外-5%
- 豪族支持高可减腐(80+→-15%), 低则加剧(20-→+15%)
- 腐败直接折损城市所有经济产出

### 人口
- 增长：0.017~0.034%/旬（≈0.6~1.2%/年，与人口质量挂钩），受粮食制约。都市cap60万,平原×1.3,山地×0.6
- 征兵直接减人口且降popQuality。popQuality恢复极慢(+0.05/旬)
- 战乱(3格内有敌军)：人口流失+质量停止恢复

## 三、补给线

- 从己方城市BFS扩散，每格消耗terrainCost(平原1/山3/水5)
- 敌方领地额外+3/格
- 最大补给距离11（+科技）。超出=断粮
- 断粮效果：每旬士气-15，兵力-5%。3旬存粮缓冲后开始
- 新占城市需3旬才能恢复补给功能
- 深入敌境4-5格就可能断粮！进攻前必须计算补给线长度

## 四、外交系统

### 关系(rel)与行动阈值
- 宣战：rel≤30(无宣称) 或 ≤45(有宣称)
- 结盟：需rel≥75 + 500金，成功率=对方议和意愿×0.6-信誉惩罚
- 送礼：小礼500金(rel+8)，厚礼1000金(rel+15)，重礼2000金(rel+25)

### 价值观距离 (e_dist)
- diplo[].e_dist = 双方天命+方略两维差均值(0-100)。>50 时背景规则 AI 宣战意愿+10%, 并长期通过 rel 漂移侵蚀结盟可行性(结盟硬门槛 rel≥75)
- 你的快照顶层 ethos 字段是自身 5 维倾向 (天命/权柄/文治/武略/方略), 极端值会触发事件惩罚和武将忠诚波动
- 你的政策(税率/任命/军事行动/称帝)会持续漂移 ethos, 长期方向需自洽于性格设定

### 宣称系统
- 无宣称宣战：信誉-12（很重！）
- 有宣称宣战：信誉0~-5（取决于宣称强度）
- 信誉<30：结盟极难、挖角困难、武将忠诚debuff
- 准备宣称需1-3旬，建议提前准备

### 求和
- 双方议和意愿>0.8才可能达成
- 议和意愿 = f(实力对比, 战争持续, rel)

## 五、忠诚系统（每旬结算）

基础变化/旬：-0.5(基础衰减) + (rulerCha-60)/10×0.05(君主魅力) + 相性修正 + 标签修正 + 官职+0.1 + 派系mod

- 相性差≤10: +0.30 | ≤25: +0.10 | ≤40: 0 | ≤60: -0.20 | >60: -0.45
- 忠义标签: +0.20 | 野心: -0.40
- 忠诚<45极危(随时叛逃), <55危险, <65注意
- 派系不平衡(某派系影响力高但官职少)会产生不满→忠诚惩罚
- 欠饷也会严重影响忠诚

## 六、围城机制

- 围城=部队停留在敌城hex上，每旬siegeDecay+0.05~0.15
- decay越高→城防倍率越低→攻城越容易
- 围城期间城市粮食消耗不变但补给可能被切断
- 守方可以选择出城野战(不受城防加成)或据守(享受城防但围越久越弱)
- 最优策略通常是：先围城削弱城防到decay>0.6再强攻，而非第一旬就硬打

## 七、计谋

- 成功率 = baseRate + (军师INT-60)/100×0.5 + 官职buff
- 军师INT90→+15%, INT100→+20%
- 驱虎吞狼(CD12旬): 强制两势力开战，极强的战略工具
- 二虎竞食(CD8旬): 两势力rel-20
- 反间计(CD?): 目标武将忠诚-15，优先选忠诚已低或有野心标签的
- 散布谣言(CD?): 目标城市民心-20
- 细作探报(CD?): 侦察敌城3旬

## 八、性格
${personality[fid] || personality.wei}

## 九、思维框架（如何分析局势）

以下不是规则清单——是帮你思考的工具。每条给出数值关系和因果链，你自行推算后决定怎么做。

1. **攻城前算有效兵力比。** 你的总ATK ÷ (敌方总DEF × 城防倍率)。城防倍率见第六节：未围城中城约4x，大城雄关可达9x，围城decay越高倍率越低。当比值<2:1时胜率不到六成，围城让decay削弱城防可能更划算；当比值>5:1时城防已无关紧要，直接打更省时间。关键变量是城防倍率——先查siegeDecay再决定。

2. **征兵前做一笔账。** 金钱成本(第二节公式) + 人口流失(1兵=1人口) + popQuality下降(影响未来新兵等级) + 2旬集结期(期间不可用) + 后续经济产出下降(人口减少)。把这些隐性成本和"不征兵可能输掉战争"的风险放在一起权衡。有时候用现有兵力打巧仗，比征兵拖垮经济更好。

3. **进攻前算补给线长度。** 第三节公式：从最近己方城市BFS，每格terrainCost(平原1/山3/水5)，敌方领地额外+3。总消耗>11就断粮，断粮后每旬士气-15、兵力-5%。推进路线的选择可能比兵力多少更重要——沿平原推进能走很远，穿越山地两格就吃掉6点补给距离。新占城市需3旬才恢复补给功能，规划时算上这个间隔。

4. **正面不利时评估迂回选项。** 看敌方后方有没有防守薄弱的城市。判断标准：那座城对敌方的经济/战略价值有多大？绕过去需要几旬？绕行期间正面能否守住？补给线会不会因为深入而断裂？如果这些都算得过来，迂回可能比硬碰硬高效得多。

5. **士气直接乘到战力上。** moraleMult公式(第一节)：士气50=ATK/DEF各打五折。1万新征部队(士气50)的实际战力≈5千满士气老兵。算兵力比时必须折算士气因素，否则会严重高估自己的战力。

6. **宣战前算信誉账。** 无宣称宣战扣12点信誉。信誉<30后：结盟成功率大幅下降、挖角变难、武将忠诚受debuff。这些后果是长期的、全局的。但如果你已处于碾压局（兵力3倍+且不需要盟友），信誉惩罚的实际影响可能很小。根据你当前的实际外交需求判断。

7. **封官时注意派系影响力和官职的匹配度。** 颍川/谯沛/降将三大派系，当某派系影响力高但官职分配少时，该派系武将忠诚会下降。这不是说必须严格按比例——战争急需时给某武将封将军哪怕他那派系已经官多了也合理。但要意识到后果，事后再找机会平衡。

8. **经济产出是乘法关系，早期投资有复利。** 公式：人口 × 基础系数 × 建筑加成 × 科技加成 × (1-腐败)。第5旬建的农田到第30旬已额外产了25旬的粮；第30旬建的到第50旬才产20旬。和平期每一旬不建设都是在放弃复利——这个成本是隐形的但很大。

9. **建筑投资回报与城市人口成正比。** popMult × 建筑加成是乘法关系：20万人口城市建农田的产出增量是5万人口城市的4倍。资源有限时，投资人口最多的城市回报最高。

10. **每座城的建筑选择取决于它的角色定位。** 面临进攻风险的城：城墙/兵营直接影响存亡。远离前线的城：经济建筑长期收益更高。但如果你计划主动进攻，前线城的兵营(征兵折扣)也是经济投资——分类不是绝对的，看你的战略意图。

## 十、输出格式
返回严格JSON，无任何多余文字或markdown标记：
{"thinking":"精确的局势分析，包含关键数值推算(3-5句)","actions":[{"type":"操作类型",...参数}],"strategy_intent":"当前整体战略方向(1-2句)","stance":"aggressive/defensive/developing/diplomatic","contingency":{"触发条件":"应对方案"}}

strategy_intent用于保持跨旬连贯性——下旬你会看到自己上旬写的战略意图。写清楚你在做什么、为什么、预计几旬完成。
contingency列出2-3个"如果...则..."的预案，覆盖最可能的意外情况。

⚠️ 所有参数值必须严格使用第十一节的合法ID/名称，否则指令无效。城市、建筑、科技、宣称、势力用英文ID；武将、官职用中文名。

## 操作类型
- {"type":"build","city":"城市ID","building":"建筑ID"}
- {"type":"recruit","city":"城市ID"}
- {"type":"move","army_leader":"将名(中文)","target_city":"城市ID"}
- {"type":"attack","army_leader":"将名(中文)","target_city":"城市ID"}
- {"type":"set_camp","army_leader":"将名(中文)"} — 扎营
- {"type":"set_ambush","army_leader":"将名(中文)"} — 设伏
- {"type":"cancel_special","army_leader":"将名(中文)"}
- {"type":"cancel_siege","army_leader":"将名(中文)"} — 取消围城转 halt
- {"type":"disband","army_leader":"将名(中文)"}
- {"type":"set_tax","level":"none/low/norm/heavy/harsh"}
- {"type":"set_corvee","level":"low/mid/high"} — 徭役档位(low不征/mid加速建设但-民心/high加速更多但代价更大)
- {"type":"set_reinforce_policy","policy":"aggr/bal/elit"}
- {"type":"toggle_resupply"} — 切换/flip 势力 resupply 开关(全军适用,非显式 set)
- {"type":"set_prefect","city":"城市ID","general":"将名(中文)"}
- {"type":"transfer_food","from":"城市ID","to":"城市ID"}
- {"type":"appoint_post","general":"将名(中文)","post":"官职名(中文)"}
- {"type":"dismiss_post","general":"将名(中文)"}
- {"type":"set_strategist","general":"将名(中文)"}
- {"type":"recruit_wild","general":"将名(中文)"}
- {"type":"poach","general":"将名(中文)"}
- {"type":"declare_war","target":"势力ID","claim":"宣称ID或null"}
- {"type":"propose_alliance","target":"势力ID"}
- {"type":"break_alliance","target":"势力ID"}
- {"type":"start_claim","target":"势力ID","claim_type":"宣称ID"}
- {"type":"diplo_gift","target":"势力ID","level":1} — level:1(500金)/2(1000金)/3(2000金)
- {"type":"diplo_armistice","target":"势力ID"} — 主动停战(花 1000 金,失败退 700 + rel+3)
- {"type":"research","tech":"科技ID","general":"将名(中文)"}
- {"type":"scheme_drive_wolf","targetA":"势力ID","targetB":"势力ID"}
- {"type":"scheme_two_tigers","targetA":"势力ID","targetB":"势力ID"}
- {"type":"scheme_spy","target":"势力ID","general":"敌将名(中文)"}
- {"type":"scheme_rumor","target":"势力ID","city":"城市ID"}
- {"type":"scheme_scout","city":"城市ID"}
- {"type":"enthrone"} — 称帝。硬门槛 turn≥24/城≥10/rep≥40/非附庸; 价值观门槛 mandate≥30 (崇汉倾向 mandate<30 会被拒绝)

每旬输出3-8条操作。局势稳定时少操作比乱动好。thinking中应体现具体数值推算。

## 操作前置条件速查
- move/attack：只能操作armies中已有的部队（按leader名匹配），闲置武将需先recruit编入部队
- recruit：需城市+闲置武将+金720+，新兵需3旬集结(mobilizing)，集结期不可移动
- set_camp/set_ambush：仅野外部队可用，garrison(城内驻守)状态不可用——需先move出城
- set_ambush：额外要求地形为forest/hill/mountain/swamp
- build：受建筑槽位限制(小城1/中城2-3/大城3-4)，部分建筑有城市类型限制(irr需平原/水乡, harbor需港口城)
- appoint_post：武将需有足够功绩且当前无官职，不能是太守
- research：需闲置武将（非太守/非部队/非研究中），同时只能研究一项
- 同一旬多条花钱指令按顺序扣费——前面的指令花完金后面的会失败，请在thinking中估算总花费

## 十一、合法参数值速查（指令参数只能从以下值选取，否则无效）

### 势力ID
wei(魏) shu(蜀) wu(吴) nanman(南蛮)

### 城市ID
魏: xuchang(许昌) nanyang(南阳) xuzhou(徐州) luoyang(洛阳) guandu(官渡) hedong(河东) ye(邺城) qingzhou(青州) youzhou(蓟城) bingzhou(晋阳) liangzhou(姑臧) wuwei(武威) tianshui(天水) changan(长安) beihai(北海) beiping(北平) guangling(广陵) chenliu(陈留) xinye(新野) puyang(濮阳) xiapi(下邳)
蜀: hanzhong(汉中) chengdu(成都) yizhou_n(梓潼) bazhong(巴中) xiangyang(襄阳) jingzhou(江陵) yiling(夷陵) yongan(永安) shangyong(上庸) luocheng(雒城)
吴: jianye(建业) jingkou(京口) huiji(会稽) wuchang(武昌) chaigang(柴桑) jiaozhou(交州) panyu(番禺) hefei(合肥) shouchun(寿春) changsha(长沙) yuzhang(豫章) lingling(零陵) lujiang(庐江)
南蛮: jianning(建宁)

### 建筑ID（build.building）
farm(农田) irr(水利,需平原/水乡) granary(粮仓) market(市集) road(驿道) harbor(港口,需港口城) barracks(兵营) workshop(作坊) stable(马厩) wall(城墙) school(学堂) clinic(医馆)

### 科技ID（research.tech）
经济: econ1(农桑初兴) econ2(精耕细作,需econ1) econ3(沃野千里,需econ2) econ4(通商惠工) econ5(互市兴利,需econ4) econ6(富国强兵,需econ5) econ7(漕运改良,需econ2) econ8(屯田制,需econ3) econ9(盐铁官营,需econ5) econ10(轻赋薄徭,需econ6) econ11(军屯精耕,需econ8)
军事: mil1(锐兵) mil2(精锐之师,需mil1) mil3(攻无不克,需mil2) mil4(坚盾) mil5(铁壁,需mil4) mil6(固若金汤,需mil5) mil7(扩军令,需mil2) mil8(大军编制,需mil7) mil9(百万雄师,需mil8) mil10(营垒精通,需mil5) mil11(火攻秘术,需mil10) mil12(斥候网,需mil2+mil5) mil13(精简军制,需mil6)
练兵: train1(乡勇操练) train2(严格练兵,需train1) train3(百战精兵,需train2) train4(武学,需train1) train5(兵法传承,需train4) train6(适性操演,需train4) train7(百炼成钢,需train6) train8(士气如虹,需train2) train9(军魂不灭,需train8+train5)
政治: pol1(怀柔远人) pol2(推心置腹,需pol1) pol3(恩威并施,需pol1) pol4(明镜高悬,需pol3) pol5(九品中正,需pol3+pol2) pol6(天下为公,需pol5) pol7(唯才是举,需pol5) pol8(天下归心,需pol6+pol7)
民生: civ1(安民告示) civ2(教化兴邦,需civ1) civ3(兴学育才,需civ1) civ4(百工兴盛,需civ3) civ5(地方自治,需civ2) civ6(士族联姻,需civ5) civ7(军屯补给,需civ3) civ8(千里粮道,需civ7) civ9(太平盛世,需civ6+civ4)

### 官职名（appoint_post.post，中文）
武官: 大将军 前将军 后将军 左将军 右将军 校尉 偏将军 裨将军 都尉 牙门将 奋威将
文官: 丞相 尚书令 侍中 太常 光禄勋 主簿 从事 长史 功曹 参军 典农

### 宣称ID（start_claim.claim_type / declare_war.claim）
imperial_decree(奉旨讨逆,需持天子) restore_han(讨贼兴汉,需汉室宗亲) punish_tyrant(吊民伐罪,需已称帝) overthrow_pretender(讨伐伪帝,需已称帝) tribal_raid(蛮族劫掠,南蛮专属) recover_lost(收复故土,需有失城) blood_feud(兴兵复仇,需有血仇) border_conflict(边境清寇,需领土相邻)

## 十二、情报推理与不确定性

你的快照中可能包含以下新增信息：

### intel_warnings（参谋预警）
你的参谋班子根据历史情报推导的战场预判。"主力失踪"意味着该部队可能在看不到的地方集结——进攻时预留后备兵力应对意外。"兵力异常减少"可能是调兵也可能是裁军，综合当前外交关系判断。"兵力集结"预警意味着1-3旬内你可能面临进攻。

### fog_estimates（迷雾估算）
confidence为low的数据可能偏差50%以上。unaccounted兵力=你看不到的敌方兵力，制定进攻计划时要假设这些兵力可能出现在任何你看不到的位置。侦察（scheme_scout）是降低不确定性成本最低的手段。

### fog_cities（迷雾城市）
stale越高的城市情报越过期。对stale>8的邻接敌城，不要基于过期情报做大规模进攻决策——先侦察。

### strategy_context（战略延续）
这是你之前设定的战略意图和最近的行动记录。战略连贯性很重要——围攻一座城可能需要5-8旬，频繁改变方向浪费行军时间。

但**战略必须跟着威胁走**：
- 从lostCities/intel_warnings/threats.units读取敌方行动轨迹。连续丢城（如A→B→C）清晰表明敌方主攻轴线——你的防御重心必须在这条轴线的下一个城市，而非远离战场的地方。
- 如果你的既定战略是"防X"，但敌方主力和丢城都在Y方向，你的战略已经失效——必须立即调整strategy_intent。
- "沉没成本"思维（"我已经在汉中集结了很多兵所以继续守汉中"）是常见错误。兵力可以调走，丢掉的城收不回来。
- 问自己：敌方主力在哪？他们在往哪个方向推进？我的兵力在不在他们的推进路线上？如果不在，就需要调整。`;
}

/** ── API调用（支持 Anthropic / OpenAI 两种格式）★v159: 战略/战术双模式 ── */
async function callClaudeAPI(fid) {
  // ★ v159: 决策节奏——判断战略旬 vs 战术旬
  const isStrategic = _isStrategicTurn(fid);
  let sysPrompt, userMsg;

  if (isStrategic) {
    // 战略旬：完整快照 + 完整prompt
    const state = getGameState(fid);
    if (!state) return null;
    sysPrompt = _claudeSystemPrompt(fid);
    userMsg = `当前局势：\n${JSON.stringify(state, null, 0)}\n\n这是战略评估旬，请进行全局分析并输出决策（严格JSON，含strategy_intent和contingency）。`;
    console.log(`[ClaudeAI] ${FAC[fid]?.name} ★战略旬★ 完整快照`);
  } else {
    // 战术旬：delta快照 + 精简prompt
    const delta = _buildDeltaSnapshot(fid);
    sysPrompt = _tacticalSystemPrompt(fid);
    userMsg = `本旬状态：\n${JSON.stringify(delta, null, 0)}\n\n请输出本旬执行指令（严格JSON）。`;
    console.log(`[ClaudeAI] ${FAC[fid]?.name} 战术旬 delta快照`);
  }

  const endpoint = _claudeAI.endpoint || 'https://api.anthropic.com/v1/messages';
  const fmt = _claudeAI.apiFormat || 'anthropic';

  let body, headers = { 'Content-Type': 'application/json' };

  if (fmt === 'openai') {
    // OpenAI兼容格式（GPT / 中转站 / openrouter / one-api）
    headers['Authorization'] = 'Bearer ' + (_claudeAI.apiKey || '');
    body = JSON.stringify({
      model: _claudeAI.model,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userMsg }
      ],
    });
  } else {
    // Anthropic原生格式
    if (_claudeAI.apiKey) headers['x-api-key'] = _claudeAI.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    body = JSON.stringify({
      model: _claudeAI.model,
      max_tokens: 1500,
      system: sysPrompt,
      messages: [{ role: 'user', content: userMsg }],
    });
  }

  // ★ v167: 如果有代理URL，走Cloudflare Worker代理
  const fetchUrl = _claudeAI.proxyUrl || endpoint;
  if (_claudeAI.proxyUrl) {
    headers['X-Target-URL'] = endpoint;
    console.log(`[ClaudeAI] 走代理: ${_claudeAI.proxyUrl}`);
  }

  try {
    const r = await fetch(fetchUrl, { method: 'POST', headers, body });
    if (!r.ok) { console.error('[ClaudeAI] API error:', r.status, await r.text()); return null; }
    const data = await r.json();
    return fmt === 'openai' ? _parseOpenAIResponse(data, fid) : _parseClaudeResponse(data, fid);
  } catch (e) { console.error('[ClaudeAI] callClaudeAPI failed:', e); return null; }
}

/** ── 解析OpenAI格式返回 ── */
function _parseOpenAIResponse(data, fid) {
  _claudeAI._callCount++;
  _claudeAI._totalTokens += (data.usage?.total_tokens || 0);
  const text = data.choices?.[0]?.message?.content || '';
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    _claudeAI._lastThinking[fid] = parsed.thinking || '';
    _claudeAI._lastActions[fid] = parsed.actions || [];
    // ★ v159 Phase 5: 提取战略记忆字段（同_parseClaudeResponse）
    if (parsed.strategy_intent || parsed.stance || parsed.contingency) {
      if (!_claudeAI._strategyMemory[fid]) {
        _claudeAI._strategyMemory[fid] = {
          strategy_intent: '', intent_set_turn: 0, stance: '',
          contingency: {}, recent_actions: [], war_journal: [],
        };
      }
      const mem = _claudeAI._strategyMemory[fid];
      if (parsed.strategy_intent) { mem.strategy_intent = parsed.strategy_intent; mem.intent_set_turn = G.turn; }
      if (parsed.stance) mem.stance = parsed.stance;
      if (parsed.contingency && typeof parsed.contingency === 'object') mem.contingency = parsed.contingency;
      console.log(`[ClaudeAI] ${FAC[fid]?.name} 战略意图: ${mem.strategy_intent}`);
    }
    console.log(`[ClaudeAI] ${FAC[fid]?.name} 思考:`, parsed.thinking);
    console.log(`[ClaudeAI] ${FAC[fid]?.name} 指令(${(parsed.actions||[]).length}条):`, parsed.actions);
    console.log(`[ClaudeAI] token: ${data.usage?.total_tokens || '?'}, 累计=${_claudeAI._totalTokens}`);
    return parsed;
  } catch (e) {
    console.error('[ClaudeAI] JSON解析失败:', e, '\n原文:', clean.slice(0, 500));
    return null;
  }
}

/** ── Artifact内置调用（无需Key） ── */
async function callClaudeArtifact(fid) {
  // ★ v159fix: 与callClaudeAPI统一，区分战略/战术旬
  const isStrategic = _isStrategicTurn(fid);
  let sysPrompt, userMsg;
  if (isStrategic) {
    const state = getGameState(fid);
    if (!state) return null;
    sysPrompt = _claudeSystemPrompt(fid);
    userMsg = `当前局势：\n${JSON.stringify(state, null, 0)}\n\n这是战略评估旬，请进行全局分析并输出决策（严格JSON，含strategy_intent和contingency）。`;
  } else {
    const delta = _buildDeltaSnapshot(fid);
    sysPrompt = _tacticalSystemPrompt(fid);
    userMsg = `本旬状态：\n${JSON.stringify(delta, null, 0)}\n\n请输出本旬执行指令（严格JSON）。`;
  }
  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514', max_tokens: 1500,
    system: sysPrompt,
    messages: [{ role: 'user', content: userMsg }],
  });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!r.ok) { console.error('[ClaudeAI-Artifact] API error:', r.status, await r.text()); return null; }
    const data = await r.json();
    return _parseClaudeResponse(data, fid);
  } catch (e) { console.error('[ClaudeAI-Artifact] failed:', e); return null; }
}

/** ── 解析Claude返回 ── */
function _parseClaudeResponse(data, fid) {
  _claudeAI._callCount++;
  _claudeAI._totalTokens += (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  const text = (data.content || []).map(c => c.text || '').join('');
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    _claudeAI._lastThinking[fid] = parsed.thinking || '';
    _claudeAI._lastActions[fid] = parsed.actions || [];
    // ★ v159 Phase 5: 提取战略记忆字段
    if (parsed.strategy_intent || parsed.stance || parsed.contingency) {
      if (!_claudeAI._strategyMemory[fid]) {
        _claudeAI._strategyMemory[fid] = {
          strategy_intent: '', intent_set_turn: 0, stance: '',
          contingency: {}, recent_actions: [], war_journal: [],
        };
      }
      const mem = _claudeAI._strategyMemory[fid];
      if (parsed.strategy_intent) {
        mem.strategy_intent = parsed.strategy_intent;
        mem.intent_set_turn = G.turn;
      }
      if (parsed.stance) mem.stance = parsed.stance;
      if (parsed.contingency && typeof parsed.contingency === 'object') {
        mem.contingency = parsed.contingency;
      }
      console.log(`[ClaudeAI] ${FAC[fid]?.name} 战略意图: ${mem.strategy_intent}`);
    }
    console.log(`[ClaudeAI] ${FAC[fid]?.name} 思考:`, parsed.thinking);
    console.log(`[ClaudeAI] ${FAC[fid]?.name} 指令(${(parsed.actions||[]).length}条):`, parsed.actions);
    console.log(`[ClaudeAI] token: in=${data.usage?.input_tokens}, out=${data.usage?.output_tokens}, 累计=${_claudeAI._totalTokens}`);
    return parsed;
  } catch (e) {
    console.error('[ClaudeAI] JSON解析失败:', e, '\n原文:', clean.slice(0, 500));
    return null;
  }
}

/** ── 控制台测试入口 ── */
async function testClaudeAI(fid, useApiKey) {
  fid = fid || 'wei';
  console.log(`\n${'='.repeat(60)}\n[ClaudeAI TEST] ${FAC[fid]?.full || fid}\n${'='.repeat(60)}`);
  const state = getGameState(fid);
  console.log('[ClaudeAI] 快照:', JSON.stringify(state, null, 2));
  console.log(`[ClaudeAI] ~${Math.round(JSON.stringify(state).length / 4)} tokens`);
  let result;
  if (useApiKey && _claudeAI.apiKey) {
    result = await callClaudeAPI(fid);
  } else {
    result = await callClaudeArtifact(fid);
  }
  if (!result) {
    console.error('[ClaudeAI] ❌ 调用失败');
    return null;
  }
  console.log(`\n${'─'.repeat(40)}\n[ClaudeAI] ✅ ${FAC[fid]?.name}决策:`);
  console.log(`思考: ${result.thinking}`);
  (result.actions || []).forEach((a, i) => console.log(`  ${i + 1}. ${JSON.stringify(a)}`));
  console.log(`累计: ${_claudeAI._callCount}次, ${_claudeAI._totalTokens}tokens`);
  return result;
}

/** ── 只看快照不调API ── */
function inspectState(fid) {
  const state = getGameState(fid || G.playerFac);
  console.log(JSON.stringify(state, null, 2));
  return state;
}

/** ── 设置API Key ── */
function setClaudeKey(key) {
  _claudeAI.apiKey = key;
  _claudeAI.enabled = true;
  console.log('[ClaudeAI] API Key已设置，Claude AI已启用');
}

// ═══════════════════════════════════════
// ★ v157: Claude AI 决策系统 (Phase 2)
//   指令执行层 + runAI async接入
// ═══════════════════════════════════════

/** ── 指令调度器：遍历actions逐条执行 ── */
function executeClaudeActions(fid, actions) {
  const stats = { executed: 0, skipped: 0, errors: [], _executedActions: [] }; // ★ v159: track executed
  if (!actions || !Array.isArray(actions)) return stats;

  // 按类型分组排序：内政→人事→科技→外交→计谋→军事（经济先行，军事殿后）
  const ORDER = {
    build:1, set_tax:1, set_corvee:1, set_prefect:1, transfer_food:1, toggle_resupply:1,
    appoint_post:2, dismiss_post:2, set_strategist:2, recruit_wild:2, poach:2,
    research:3,
    declare_war:4, propose_alliance:4, break_alliance:4, accept_peace:4, reject_peace:4,
    start_claim:4, diplo_gift:4, diplo_armistice:4, diplo_demand_vassal:4, diplo_submit_vassal:4, diplo_release_vassal:4,
    scheme_drive_wolf:5, scheme_two_tigers:5, scheme_spy:5, scheme_rumor:5, scheme_scout:5,
    move:6, attack:6, recruit:6, add_squad:6, disband:6, set_camp:6, set_ambush:6,
    cancel_special:6, cancel_siege:6, set_reinforce_policy:6,
    enthrone:7, event_choice:8, court_choice:8
  };
  const sorted = [...actions].sort((a, b) => (ORDER[a.type] || 99) - (ORDER[b.type] || 99));

  for (const act of sorted) {
    try {
      const ok = _execOneAction(fid, act);
      if (ok) { stats.executed++; stats._executedActions.push(act); }
      else { stats.skipped++; stats.errors.push(`SKIP: ${act.type} ${JSON.stringify(act)}`); }
    } catch (e) {
      stats.skipped++;
      stats.errors.push(`ERR: ${act.type} — ${e.message}`);
      console.warn(`[ClaudeAI] 指令异常:`, act, e);
    }
  }
  console.log(`[ClaudeAI] ${FAC[fid]?.name} 执行结果: ${stats.executed}成功, ${stats.skipped}跳过`, stats.errors.length ? stats.errors : '');
  return stats;
}

/** ── 单条指令分发 ── */
function _execOneAction(fid, act) {
  const fac = G.factions[fid];
  if (!fac) return false;
  // ★ v158: 字段名归一化 — prompt用army_leader/target_city，执行层用leader/target
  if (act.army_leader && !act.leader) act.leader = act.army_leader;
  if (act.target_city && !act.target) act.target = act.target_city;
  switch (act.type) {
    // ════ 内政 ════
    case 'build': return _execBuild(fid, act);
    case 'set_tax': return _execSetTax(fid, act);
    case 'set_corvee': return _execSetCorvee(fid, act);  // D-076 fix
    case 'set_prefect': return _execSetPrefect(fid, act);
    case 'transfer_food': return _execTransferFood(fid, act);
    case 'toggle_resupply': return _execToggleResupply(fid, act);
    // ════ 人事 ════
    case 'appoint_post': return _execAppointPost(fid, act);
    case 'dismiss_post': return _execDismissPost(fid, act);
    case 'set_strategist': return _execSetStrategist(fid, act);
    case 'recruit_wild': return _execRecruitWild(fid, act);
    case 'poach': return _execPoach(fid, act);
    // ════ 科技 ════
    case 'research': return _execResearch(fid, act);
    // ════ 外交 ════
    case 'declare_war': return _execDeclareWar(fid, act);
    case 'propose_alliance': return _execProposeAlliance(fid, act);
    case 'break_alliance': return _execBreakAlliance(fid, act);
    case 'diplo_gift': return _execDiploGift(fid, act);
    case 'diplo_armistice': return _execDiploArmistice(fid, act);
    case 'start_claim': return _execStartClaim(fid, act);
    case 'diplo_demand_vassal': return _execDemandVassal(fid, act);
    case 'diplo_submit_vassal': return _execSubmitVassal(fid, act);
    case 'diplo_release_vassal': return _execReleaseVassal(fid, act);
    // ════ 计谋 ════
    case 'scheme_drive_wolf': return _execSchemeDriveWolf(fid, act);
    case 'scheme_two_tigers': return _execSchemeTwoTigers(fid, act);
    case 'scheme_spy': return _execSchemeSpy(fid, act);
    case 'scheme_rumor': return _execSchemeRumor(fid, act);
    case 'scheme_scout': return _execSchemeScout(fid, act);
    // ════ 军事 ════
    case 'attack': // ★ v159fix: attack与move共用_execMove，_aiRole由act.type决定
    case 'move': return _execMove(fid, act);
    case 'recruit': return _execRecruit(fid, act);
    case 'disband': return _execDisband(fid, act);
    case 'set_camp': return _execSetCamp(fid, act);
    case 'set_ambush': return _execSetAmbush(fid, act);
    case 'cancel_special': return _execCancelSpecial(fid, act);
    case 'cancel_siege': return _execCancelSiege(fid, act);
    case 'set_reinforce_policy': return _execSetReinforcePolicy(fid, act); // ★ v159fix
    // ════ 特殊 ════
    case 'enthrone': return _execEnthrone(fid, act);
    default:
      console.warn(`[ClaudeAI] 未知指令类型: ${act.type}`);
      return false;
  }
}
