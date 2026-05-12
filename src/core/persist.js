// src/core/persist.js
//
// 核心层(C)— 存档序列化 / 反序列化(_serializeG / _deserializeG)。
//
// 来源:从 project_romance_v181.html 抽离(阶段 1d-α)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),与 phase 4 boot_screens / recruit_modals 同模式。
//
// ── 抽离决策 ──
// 1d 阶段 plan: top-level const 删 + accessor backing 切 G runtime state。
// 但 _serializeG / _deserializeG 直接读写 FAC_IDENTITY / ALL_FACS / ETHOS_INIT,1c 没扫到。
// 走 1d-α(C 路线): 先抽离 → 1d-b accessor migrate → 1d-c 切 backing,避免在 v181 内 in-place 改动违反"v181 必须抽离 + 引用"约束。
//
// ── 抽离范围 ──
//   v181 L1489-L1662 (~174 行, 2 funcs + 1 section header)
//     - _serializeG()              v172: G + __meta + FAC_IDENTITY 三项序列化
//     - _deserializeG(jsonStr)     反序列化 + 旧存档多版本兼容(v149/v150/v151/v155/v161/v164-v172)
//
// ── 留 v181 ──
//   SAVE_SLOT_COUNT / SAVE_KEY_PREFIX (L1486-1487) — save UI 常量,不在 serialize 范围
//   saveToSlot / loadFromSlot (L1730+) — save UI orchestration,留下一 sub-session 处理
//
// ── 写口归属声明 ──
// **本文件主要写口**(_deserializeG 重置/恢复):
//   - G (整体 reset + Object.assign(G, snap))
//   - FAC_IDENTITY[fid].{type,stage,anchorState} (运行时字段恢复)
//   - 各 chain 模块级 let: _unitIdCounter (military) / _pendingPeaceOffer (diplomacy) /
//     _pendingVassalOffer (diplomacy) / _techEffectCache (politics) /
//     _supplyCache / _battleReports / _pendingBattleConfirms / _pendingSiegeArrival /
//     _currentBattleReport / _currentBattleConfirm / _duelChallenger / _marchAnimating (military) /
//     _deployedGensMoraleCache (economy) / _activeOverlay / _ovTerritoryCache / _ovTerritoryTurn (overlay)
//   - v181 inline let: _fastForward (L1157, classic <script> 共享 script-scope)
//   - module globals: _techEffectCacheTurn / _statsHistory.length
//   - window._pendingCourtCouncil
//
// **跨链读取/调用**:
//   - 数据: FAC_IDENTITY / ALL_FACS / ETHOS_INIT / COUNTY_DATA / RETAINER_PRESET
//   - helper: _rebuildGEN_MAP (chains/general) / initCityGentry / _aggregateGentry (chains/gentry)
//
// ── 加载顺序 ──
// 在 src/chains/* + src/render/overlay.js + src/core/tick.js 之后(let 声明已到位),
// 在 v181 inline script body 之前(_serializeG/_deserializeG 函数声明 hoist 到 global script scope,
// v181 内 saveToSlot/loadFromSlot 及 src/dev/debug.js 调用时函数可见)。
//
// ── 1d 后续 sub-session ──
//   1d-a: WILD_GENS 集合操作 8 site migrate
//   1d-b: 本文件内 FAC_IDENTITY / ALL_FACS / ETHOS_INIT → accessor migrate (~8 site)
//   1d-c: 切 backing G.facIdentity / G._wildGenDefs + 删 top-level const

// ── 存档序列化/反序列化 ──────────────────────────────
function _serializeG(){
  // 深拷贝G，处理Set→Array ★ v154fix M10: 排除已知运行时缓存字段减小存档体积
  const _CACHE_KEYS = new Set(['_corruptRate','_corruptLoss','_salaryDebt','_deployedGensCache','_deployedGensTurn']);
  const snap = JSON.parse(JSON.stringify(G, (key, val) => {
    if(val instanceof Set) return {__set:true, values:[...val]};
    if(_CACHE_KEYS.has(key)) return undefined;
    return val;
  }));
  // 保存额外全局状态
  snap.__meta = {
    version: 172,  // v172: 加入 stage/anchorState 序列化
    savedAt: new Date().toISOString(),
    _unitIdCounter: _unitIdCounter,
    _pendingPeaceOffer: _pendingPeaceOffer,
    _pendingVassalOffer: _pendingVassalOffer,
    tutorialDone: G.tutorialDone || false,
    // v172: FAC_IDENTITY 是模块级常量，其运行时字段（type/stage/anchorState）需单独存档
    facIdentity: Object.fromEntries(Object.entries(FAC_IDENTITY).map(([f, id]) => [f, {
      type: id.type,
      stage: id.stage,
      anchorState: id.anchorState,
    }])),
  };
  return JSON.stringify(snap);
}

function _deserializeG(jsonStr){
  const snap = JSON.parse(jsonStr, (key, val) => {
    if(val && typeof val === 'object' && val.__set) return new Set(val.values);
    return val;
  });
  const meta = snap.__meta || {};
  delete snap.__meta;
  // 恢复G的所有字段
  Object.keys(G).forEach(k => delete G[k]);
  Object.assign(G, snap);
  // 恢复全局变量
  if(meta._unitIdCounter) _unitIdCounter = meta._unitIdCounter;
  _pendingPeaceOffer = meta._pendingPeaceOffer || null;
  _pendingVassalOffer = meta._pendingVassalOffer || null;
  G.tutorialDone = meta.tutorialDone || false;
  // v172: 恢复 FAC_IDENTITY 运行时字段（type/stage/anchorState）
  // 旧存档（无 facIdentity 字段）兼容：保持 initGame 初始值
  if(meta.facIdentity){
    Object.entries(meta.facIdentity).forEach(([f, s]) => {
      if(FAC_IDENTITY[f]){
        if(s.type != null)        FAC_IDENTITY[f].type = s.type;
        if(s.stage != null)       FAC_IDENTITY[f].stage = s.stage;
        if(s.anchorState !== undefined) FAC_IDENTITY[f].anchorState = s.anchorState;
      }
    });
  }
  // v172: 兜底——确保所有势力都有 stage 字段（旧存档加载时 initGame 已设过，双保险）
  ALL_FACS.forEach(fid => {
    if(FAC_IDENTITY[fid] && !FAC_IDENTITY[fid].stage){
      FAC_IDENTITY[fid].stage = (fid === 'nanman') ? 'warlord' : 'regime';
      FAC_IDENTITY[fid].anchorState = null;
    }
  });
  // 恢复科技树Set（JSON.parse的reviver已处理，但双保险）
  ALL_FACS.forEach(fid => {
    const tech = G.factions[fid]?._tech;
    if(tech && tech.researched && !(tech.researched instanceof Set)){
      tech.researched = new Set(tech.researched);
    }
  });
  // 恢复_eventFired如果是对象
  if(G._eventFired && typeof G._eventFired !== 'object') G._eventFired = {};
  // ★ v135fix+v149fix: 确保_unitIdCounter大于所有现有unit.id，避免id冲突
  // unit.id格式为'uN'字符串，需解析数字部分
  if(G.units && G.units.length > 0){
    const maxId = G.units.reduce((mx, u) => {
      const n = typeof u.id === 'string' ? parseInt(u.id.replace(/\D/g, ''), 10) : (u.id || 0);
      return Number.isFinite(n) && n > mx ? n : mx;
    }, 0);
    if(_unitIdCounter <= maxId) _unitIdCounter = maxId + 1;
  }
  // ★ v149fix 中等2: 清理旬级缓存（科技/补给/出征武将），防止旧存档脏数据
  _techEffectCache = {}; _techEffectCacheTurn = -1;
  _supplyCache = {};
  // ★ v149fix 中等3: 清理残留战斗状态，防止幽灵战报
  _battleReports = [];
  _pendingBattleConfirms = [];
  _pendingSiegeArrival = null;
  _currentBattleReport = null;
  _currentBattleConfirm = null;
  // ★ v149fix 中等4: 重置行军动画锁，防止读档后卡死
  _marchAnimating = false;
  // ★ v150fix: 清理遗漏的模块级缓存（士气/领土overlay/叠加层/朝议/单挑/统计）
  _deployedGensMoraleCache = null;
  _ovTerritoryCache = null; _ovTerritoryTurn = -1;
  _activeOverlay = null;
  window._pendingCourtCouncil = null;
  _duelChallenger = null;
  _statsHistory.length = 0; // BUG 6: 清空统计图表数据
  // ★ v150fix A2+A3: 快进状态（offer已在meta恢复，不再重置）
  _fastForward = false;
  // ★ v167fix #6: 删除 _pendingPeaceOffer/_pendingVassalOffer = null（L29848已从meta恢复，此处重置会丢失读档时的求和/附庸请求）
  // ★ v151: 价值观系统旧存档兼容
  ALL_FACS.forEach(fid => {
    if(G.factions[fid] && !G.factions[fid].ethos){
      G.factions[fid].ethos = {...(ETHOS_INIT[fid] || {mandate:0,power:0,civil:0,military:0,strategy:0})};
      G.factions[fid]._ethosLog = [];
      G.factions[fid]._ethosSnap = {};
    }
  });
  // ★ v155fix P0: 重建GEN_MAP指向G.generals中的活跃对象（替代v154的Object.assign方案）
  _rebuildGEN_MAP();
  // ★ v161: 旧存档无counties → 调用initCityGentry初始化
  const _hasCounties = Object.values(G.cities).some(c => c.counties && c.counties.length > 0);
  if(!_hasCounties) initCityGentry();
  // ★ v170: 存档counties迁移（同步到最新COUNTY_DATA，保留已有loyalty/_initPop，补全新增县，同步clanFamily字段）
  Object.entries(G.cities).forEach(([cityId, city]) => {
    const template = COUNTY_DATA[cityId];
    if(!template || !city.counties) return;
    // 建立旧county按name索引
    const oldByName = {};
    city.counties.forEach(c => { oldByName[c.name] = c; });
    // 按模板重建，保留旧loyalty
    const newCounties = template.map(t => {
      const old = oldByName[t.name];
      if(old){
        // 存在：更新 type/clanFamily/popShare/magnate 为模板值（可能变化），保留 loyalty/_initPop
        return {
          name: t.name,
          type: t.type,
          clanFamily: t.clanFamily, // 支持从单值迁移到数组
          popShare: t.popShare,
          magnate: t.magnate === true, // ★ v171: 同步magnate字段（未标记则false）
          loyalty: old.loyalty ?? 50,
          _initPop: old._initPop || Math.floor(city.pop * t.popShare),
        };
      } else {
        // 新县（v170新增）：用城均loyalty初始化
        return {
          name: t.name,
          type: t.type,
          clanFamily: t.clanFamily,
          popShare: t.popShare,
          magnate: t.magnate === true, // ★ v171
          loyalty: city.gentry ?? 50,
          _initPop: Math.floor(city.pop * t.popShare),
        };
      }
    });
    // 归一化popShare（防模板和存档总和不一致）
    const tot = newCounties.reduce((s,c) => s + c.popShare, 0);
    if(Math.abs(tot-1) > 0.001) newCounties.forEach(c => c.popShare /= tot);
    city.counties = newCounties;
    city.gentry = _aggregateGentry(city);
  });
  // ★ v164: genRetainers旧存档兼容（纯数字→{count,type}）
  if(G.genRetainers){
    Object.keys(G.genRetainers).forEach(name => {
      const v = G.genRetainers[name];
      if(typeof v === 'number'){
        G.genRetainers[name] = { count: v, type: RETAINER_PRESET[name]?.type || null };
      }
    });
  }
  // ★ v164: 通商/通使旧存档兼容
  if(!G._tradeCD) G._tradeCD = {};
  if(!G._pendingEnvoyIntel) G._pendingEnvoyIntel = [];
  // ★ v165: 通商协定旧存档兼容
  if(!G._tradeAgreements) G._tradeAgreements = [];
  // ★ v166: 迁民系统旧存档兼容
  if(G._migratedThisTurn === undefined) G._migratedThisTurn = false;
  ALL_FACS.forEach(fid => {
    if(G.strategyCD && G.strategyCD[fid] && G.strategyCD[fid].envoy === undefined){
      G.strategyCD[fid].envoy = 0;
    }
  });
}
