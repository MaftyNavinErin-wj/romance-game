// src/chains/ethos.js
//
// 价值观链(E7)— 势力倾向 5 维度漂移与冲击系统。
//
// 来源:从 project_romance_v181.html L12379-L12476 抽离(Session 3.5 / 阶段 3,选项单一)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// ── 抽离范围(经制作人 approve)──
//   E1 section header                      v181 L12379-L12381
//   E2 `_applyEthosDrift(fid, dim, delta, source)`     v181 L12382-L12392
//   E3 `applyEthosShock(fid, dim, delta, source)`      v181 L12394-L12400
//   E4 `_ethosDistance(fid1, fid2)`                    v181 L12402-L12407
//   E5 `processFacEthos(fid)`                          v181 L12409-L12476
//
// ── 留 v181 ──
//   `renderEthosTab(c)`(L15422)— phase 2 原则,modals/tabs render 留 v181
//
// ── 写口归属声明((a) 原则核心,本 header 起 chain 阶段所有 chains/*.js 必含)──
// **本 chain 主要写口**:
//   - `G.factions[fid].ethos[dim]`(5 维:mandate / power / civil / military / strategy)
//   - `G.factions[fid]._ethosLog`(漂移日志,push + 100 上限 shift)
//   - `G.factions[fid]._ethosSnap`(每旬城数快照)
// 写口由 E2 `_applyEthosDrift` 单点写入(E3 委托 E2,E5 委托 E2);E5 额外写
// `G.factions[fid]._ethosSnap`。**100% 落 ethos G subtree,(a) 严格满足**。
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/ + src/render/ 模块共享 hoisted
// function 全局可见,无 import/export)。
//
// ── 反向调用清单 ──
//
// 本 chain 被外部链调用(谁写 ethos,~30 处 callers):
//   - 武将链(留 v181 等 3.12):L4690-L4708 appointGenPost / dismissGenPost
//   - 政治链(留 v181 等 3.7):L5401-L5407 _applyCourtDecisions / L11918 / L11925 doEnthrone
//   - 经济链(留 v181 等 3.9):L5867-L5868 / L6098-L6099 强迁人口
//   - 外交链(留 v181 等 3.8):L10654 diploAlly / L10949-L10953 aiDoDiplo
//                          / L11804-L11807 applyWarDeclarationEffects
//   - 军事链(留 v181 等 3.11):L12505 _applySiegeAftermath / L21906 resolveBattle
//   - 事件链(events 数据已抽 src/data/events.js):~20 处 effect 内调用
//   - claude_ai.js(已抽 src/core/claude_ai.js):L29931 _execDeclareWar / L29954 _execProposeAlliance
//
// 本 chain 调外部链(callees):
//   - `calcFactionInfluence(fid)`(政治链,留 v181 等 3.7) — E5 内调用
//   - `showNotif`(已抽 src/render/notifications.js)— E3 内调用
//   - `ETHOS_LABELS / ETHOS_DIM_NAMES`(已抽 src/data/tags.js)— E3 / 留 v181 的 renderEthosTab 共用
//   - `GEN_TAGS`(已抽 src/data/tags.js)— E5 内调用
//   - `getScenarioFactions() / G(状态根)`(已抽 src/data/factions.js / src/core/state.js)
//
// 同 phase 2/3.2/3.3/3.4 反向调用模式,设计原则 (c) 已 approve。
//
// **特别说明(制作人 3.5 决策点 3 记录)**:`_ethosDistance`(E4)由外交链
// (L10876 aiDoDiplo / L12615 checkDiplo)和 render(L15466 renderEthosTab)跨文件调。
// 这是设计上**认可**的"消费 ethos 数据"反向,**不是 bug**。3.8 抽外交时再次确认。
//
// ── plan §二偏离记录(同 phase1_summary §5.3 / phase3_1_notes §二 ... 及 phase3_5_notes)──
// PLAN §三阶段 3.11 字面:`chains/ethos.js(价值观链 v1.1 / 节点 27 / 9 D 类)`,~95 行。
// scout 实测后实装:E1+E2+E3+E4+E5 verbatim = 98 行。**plan 字面与实测高度一致**,
// 这是 phase 3.3 起 scout-before-extract 第 5 次应用、**第 1 次实测与 plan 高度一致**,
// 适合作为"chain 抽离模板"。
//
// ── script 加载顺序 ──
// 制作人 3.5 决策点 4 定:加载顺序反映依赖方向 = data/* → core/* → chains/* → render/* → inline。
// 本文件加在 core/main.js 之后、render/notifications.js 之前。后续 7 chain
// 同位置(chains/ 内顺序无关,各 chain self-cohesive)。
//
// ── chain 抽离模板说明(本 session 起,后续 7 chain 沿用)──
// 本 header 内 6 项必含:
//   1. 来源(v181 行号 + 抽离方式 verbatim 声明)
//   2. 抽离范围 + 留 v181 部分
//   3. **写口归属声明**((a) 原则核心,审计一眼可验)
//   4. 反向调用清单(callers + callees,按归属链整理)
//   5. plan §二 偏离记录(commit + header + sub-session notes 三处留档)
//   6. script 加载位置 + 模板说明

// ═══════════════════════════════════════
// ★ v151: 势力价值观系统 — 回合结算 + 冲击
// ═══════════════════════════════════════
function _applyEthosDrift(fid, dim, delta, source){
  if(Math.abs(delta) < 0.01) return;
  const eth = G.factions[fid]?.ethos;
  if(!eth) return;
  eth[dim] = Math.max(-100, Math.min(100, eth[dim] + delta));
  const elog = G.factions[fid]._ethosLog;
  if(elog){
    elog.push({turn:G.turn, dim, delta:+delta.toFixed(2), source});
    if(elog.length > 100) elog.shift(); // ★ v167fix #16: 30→100（30条只够3-6旬回查）
  }
}

function applyEthosShock(fid, dim, delta, source){
  _applyEthosDrift(fid, dim, delta, source);
  if(Math.abs(delta) >= 5 && fid === G.playerFac){
    const dir = delta > 0 ? ETHOS_LABELS[dim].pos : ETHOS_LABELS[dim].neg;
    showNotif(`势力倾向偏移：${ETHOS_DIM_NAMES[dim]}→${dir}（${source}）`, 'info');
  }
}

/** ★ v151: 价值观外交距离（天命+方略两维度均值，0-100） */
function _ethosDistance(fid1, fid2){
  const e1 = G.factions[fid1]?.ethos, e2 = G.factions[fid2]?.ethos;
  if(!e1 || !e2) return 0;
  return (Math.abs(e1.mandate - e2.mandate) + Math.abs(e1.strategy - e2.strategy)) / 2;
}

/** ★ v151: 每旬价值观漂移（在nextTurn中调用） */
function processFacEthos(fid){
  // D-129 fix: 灭国势力跳过, 避免每旬冗余 strategy -0.15 漂移 + _ethosLog push 浪费
  if(fid === 'rebel' || G.factions[fid]?._eliminated) return;
  const eth = G.factions[fid]?.ethos;
  if(!eth) return;
  const gens = G.generals[fid] || [];
  const nonRuler = gens.filter(g => g.role !== 'ruler');
  const gc = nonRuler.length || 1;

  // ── 天命：politics标签占比 + 天子漂移 ──
  let uniHan = 0, warlord = 0;
  nonRuler.forEach(g => {
    const p = (GEN_TAGS[g.name]||{}).politics;
    if(p === 'uniHan') uniHan++;
    else if(p === 'warlord') warlord++;
  });
  _applyEthosDrift(fid, 'mandate', ((warlord - uniHan) / gc) * 0.5, '武将立场');
  if(G.emperor?.holder === fid) _applyEthosDrift(fid, 'mandate', 0.3, '挟天子');

  // ── 权柄：士族派系影响力占比 ──
  const inf = calcFactionInfluence(fid);
  const fi = inf.factions;
  const gentryKeys = ['gentry_zhongyuan','gentry_hebei','gentry_xuzhou','gentry_jingzhou','gentry_yizhou','gentry_jiangdong','gentry_xiliang'];
  const gentryInf = gentryKeys.reduce((s,k) => s + (fi[k]?.influence||0), 0);
  const gentryRatio = gentryInf / (inf.total || 1);
  _applyEthosDrift(fid, 'power', (0.3 - gentryRatio) * 1.2, '士族影响力');

  // ── 文治：税率 + 民心辅助 ──
  const taxId = G.factions[fid]?.taxId || 'norm';
  const taxDrift = {none:-0.5, low:-0.3, norm:0, heavy:0.4, harsh:0.6}[taxId] || 0;
  if(Math.abs(taxDrift) > 0) _applyEthosDrift(fid, 'civil', taxDrift, '税率');
  const myCities = Object.values(G.cities).filter(c => c.fac === fid);
  if(myCities.length){
    const avgM = myCities.reduce((s,c) => s + c.morale, 0) / myCities.length;
    _applyEthosDrift(fid, 'civil', (50 - avgM) / 200, '民心');
  }

  // ── 武略：鹰鸽占比 ──
  let hawk = 0, dove = 0;
  nonRuler.forEach(g => {
    const c = (GEN_TAGS[g.name]||{}).combat;
    if(c === 'hawk') hawk++;
    else if(c === 'dove') dove++;
  });
  _applyEthosDrift(fid, 'military', ((hawk - dove) / gc) * 0.5, '鹰鸽占比');

  // ── 方略：城市数趋势 + 部队状态 ──
  const snap = G.factions[fid]._ethosSnap || {};
  const prevCities = snap.cityCount ?? myCities.length;
  const curCities = myCities.length;
  const cityDelta = curCities - prevCities;
  if(cityDelta > 0) _applyEthosDrift(fid, 'strategy', 0.4 * cityDelta, '开疆拓土');
  else if(cityDelta < 0) _applyEthosDrift(fid, 'strategy', 0.3 * cityDelta, '失地收缩');
  const myUnits = G.units.filter(u => u.fac === fid);
  const field = myUnits.filter(u => u.status==='march'||u.status==='siege'||u.status==='camp'||u.status==='ambush').length;
  const garr = myUnits.filter(u => u.status==='garrison'||u.status==='billet').length;
  const fieldRatio = field / ((field + garr) || 1);
  _applyEthosDrift(fid, 'strategy', (fieldRatio - 0.35) * 0.6, '军事态势');
  // 长期无战事 → 守成（检查是否与任何势力敌对）
  const atWar = getScenarioFactions().some(of => {
    if(of === fid) return false;
    const dk = G.diplo[`${fid}-${of}`] || G.diplo[`${of}-${fid}`];
    return dk && dk.status === 'enemy';
  });
  if(!atWar) _applyEthosDrift(fid, 'strategy', -0.15, '和平期');

  G.factions[fid]._ethosSnap = { cityCount: curCities };
}
