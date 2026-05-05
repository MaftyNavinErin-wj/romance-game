// src/core/map.js
//
// 地图基础设施 — 六边形网格 + 战争迷雾 + 寻路 + 地形。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.11 / Commit 1,作为军事链抽离的前置子动作)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation,Node 脚本 line-by-line 复制 v181)。
//
// ── 抽离决策(2026-05-05 制作人 approve)──
// 选 A:hex/fog/pathfinding/terrain 单独抽到 src/core/map.js,**不归军事链**。
// 理由:
//   1. 地图基础设施(空间计算)不是军事 mechanism,**多个 chain 调它**:
//      diplomacy 调 hexDist / hkey / canSeeFactionData / FOG_VISIBLE / getKnownCityCount /
//                   getUnitNodeId
//      economy   调 hexDist / ensureCityNeighbors
//      event     调 hexNeighbors / getHexMoveCost / getUnitNodeId / hexDist / hexAstar /
//                   ensureCityNeighbors
//      gentry    调 hexDist
//      core/main.js 调 buildHexTerrain / initFog
//      core/tick.js 调 hexAstar / hexNeighbors / getHexMoveCost
//      core/claude_ai.js 调 ensureCityNeighbors / hexDist
//   2. 归军事链会造成依赖错位(其他 chain 反向调军事 → 不符合 chain 架构)
//   3. 留 v181 违背 phase 3 减重目标
// 加载顺序:作为 core 最后一个文件(core/main.js 之后,chains/* 之前)。
//   边界标准:**任何 chain 都可能调的纯空间工具 → map.js**;只有军事 AI 调用的 →
//   chains/military.js(如 aiFrontierEnemyCities)。
//
// ── 抽离范围(11 段不连续 ranges,跳过 JUNS 留 v181)──
//   M0  地图系统 section header                v181 L1404-L1408
//   M1  HEX 常量 + 工具                        v181 L1426-L1503
//        HEX_SIZE / HEX_H / HEX_COLS / HEX_ROWS const +
//        hexToPixel / pixelToHex / hkey / hparse / hexNeighbors / toCube / hexDist /
//        hexPathStr 8 funcs +
//        HEX_PATH / HEX_PATH_INNER const
//   M2  FOG 常量 + 视野 helpers                v181 L1509-L1564
//        FOG_UNEXPLORED / FOG_EXPLORED / FOG_VISIBLE / FOG_UNIT_RADIUS_BASE /
//        FOG_STEALTH_RADIUS const +
//        getUnitVisionRadius / getScoutINT 2 funcs
//   M3  fog 子系统 display formatting helpers   v181 L1567-L1613
//        fuzzyTroopDisplay / fuzzyGenDisplay 2 funcs
//        ★ 制作人 approve:不是空间计算,但输入是 fog state(模糊精度由 INT 决定),
//          是 fog 副产物,跟 fog 同 map.js 自然内聚
//   M4  fog 系统主体                           v181 L1614-L1855
//        getFogAllyFacs / canSeeFactionData / fogBFS / initFog / updateFog /
//        updateFogCitySnapshot / getFogLevel / getCityFogLevel / getKnownCityCount 9 funcs
//   M5  城市邻接(纯空间数据 init)              v181 L1857-L1868
//        ensureCityNeighbors 1 func
//        ★ 制作人 approve:`aiFrontierEnemyCities`(L1878-L1933)改归 chains/military.js
//          MIL3,本 chain 不抽(理由:函数名带 ai 前缀,只有军事 AI 调用,不符合
//          map.js"任何 chain 都可能调的纯空间工具"边界)
//   M6  地形多边形 + 几何                       v181 L1937-L2103
//        TERRAIN_POLYS const(166 行)+ pointInPoly 1 func
//   M7  buildHexTerrain                        v181 L2105-L2290
//        buildHexTerrain 1 func(186 行,大块 init)
//   M8  hexLineDraw                            v181 L2292-L2323
//        hexLineDraw 1 func
//   M9  移动 cost 常量 + 水陆 helpers           v181 L2325-L2390
//        TERRAIN_AP_COST / NAVAL_WATER_COST / NAVAL_AP / WATER_TERRAINS const +
//        isWaterHex / isUnitOnWater / getHexMoveCost / getTerrainAt / getUnitNodeId /
//        unitsContact / cityToGrid 7 funcs
//   M10 寻路                                    v181 L2405-L2521
//        calcHexPathCost / findNearestOwnCityPath / hexAstar 3 funcs +
//        _MinHeap class(在 hexAstar 内部)
//
// 函数总数:8 + 2 + 2 + 9 + 1 + 1 + 1 + 1 + 7 + 3 = **36 函数 + 17 const + 1 class**
//
// ── 留 v181 ──
//   `JUNS` const(L1410-L1424)— 12 个郡数据,phase 1 笔记标记留 v181(郡是行政划分
//      数据,不是地图基础设施;后续 sprint 等归 src/data/cities.js 一类)
//   `aiFrontierEnemyCities`(L1878-L1933)— 改归 chains/military.js MIL3(Commit 2 抽)
//      理由:函数名带 ai 前缀,只有军事 AI 调用
//
// ── 写口归属声明((a) 原则核心)──
// **本 chain 主要写口**:
//   - `G._cityNeighbors`(城市邻接 cache,ensureCityNeighbors 写)
//   - `G.fog[fid][hkey] = FOG_*`(战争迷雾 state,initFog / updateFog 写)
//   - `HEX_TERRAIN / HEX_ROAD / HEX_CITY`(地图静态数据,buildHexTerrain 内部生成,
//     v181 顶层全局)
//
// **read-only helpers**(无写口):
//   - 几何 / 寻路:hexToPixel / pixelToHex / hexDist / hexNeighbors / hexAstar /
//     getHexMoveCost / getTerrainAt / cityToGrid / pointInPoly / hexLineDraw / hexPathStr
//   - fog query:getFogLevel / getCityFogLevel / canSeeFactionData / getKnownCityCount /
//     getFogAllyFacs / fogBFS
//   - fog display:fuzzyTroopDisplay / fuzzyGenDisplay
//   - unit 节点 / 接触:getUnitNodeId / unitsContact / isWaterHex / isUnitOnWater /
//     getUnitVisionRadius / getScoutINT
//
// ── 接口风格 ──
// 全局函数 + 顶层 const(同 v181 + 已抽 src/data/ + src/core/state.js / helpers.js /
// hubs.js / claude_ai.js / tick.js / main.js + chains/* 模块共享 hoisted function 全局
// 可见,无 import/export)。
//
// `_MinHeap` 是顶层 class(在 hexAstar 内部 new),跨 classic <script> 共享
// (同 phase 3.4 验证 const 跨 script 共享原则,class 同样适用)。
//
// ── 反向调用清单 ──
//
// 本 module 被外部调用(callers):
//   - core(已抽):
//       `src/core/main.js` L181 buildHexTerrain / L353 initFog(initGame 调)
//       `src/core/tick.js` 多处调 hexAstar / hexNeighbors / getHexMoveCost(每旬)
//       `src/core/claude_ai.js` 调 ensureCityNeighbors / hexDist(_exec / ai 决策)
//   - chains(已抽):
//       diplomacy 调 hexDist / hkey / canSeeFactionData / FOG_VISIBLE / FOG_UNEXPLORED /
//                    getKnownCityCount / getUnitNodeId
//       economy   调 hexDist / ensureCityNeighbors
//       event     调 hexNeighbors / getHexMoveCost / getUnitNodeId / hexDist / hexAstar /
//                    ensureCityNeighbors
//       gentry    调 hexDist
//       military(本 session Commit 2 抽)调 大量 map.js 函数(aiFrontierEnemyCities
//                                                    自身归 military 但调 ensureCityNeighbors
//                                                    + ROAD_ADJ 等)
//   - render(留 v181 / 已抽):
//       多 render 路径调 hexToPixel / pixelToHex / hexPathStr / TERRAIN_POLYS /
//                       getFogLevel 等(SVG 渲染 + tooltip)
//   - inline backToTitle / startGame / saveGame / loadFromSlot:
//       `G.fog / G._cityNeighbors` 是 G subtree 子字段,跟随 G 自动 reset / serialize
//       `HEX_TERRAIN / HEX_ROAD / HEX_CITY` 顶层全局,backToTitle 不 reset(buildHexTerrain
//       重新生成时会覆盖)
//
// 本 module 调外部(callees):
//   - `ROAD_ADJ / ROADS / CITY_MAP / CITIES_DEF / STATE_CITIES`(已抽 src/data/cities.js)
//   - `CITY_TO_HEX_TERRAIN`(若已抽 / 留 v181)
//   - `G(状态根)`(已抽 src/core/state.js)
//   - 武将链 helpers(留 v181 等 3.12):`hasFacGen / genHasOffice`(getScoutINT 调)
//   - `getUnitTroops`(归军事链 MIL4,Commit 2 抽,但 hoisted function 跨 script 调用 OK)
//   - 数据 / 常量:`FAC / ALL_FACS`
//
// ── plan §二偏离记录 ──
// PLAN §三阶段 3.11(原)字面:hex/fog/pathfinding 是军事链子组(~34 函数)。
// scout 实测 + 制作人 approve 修订(2026-05-05):**单独抽到 src/core/map.js**,
// 不归军事链。理由见上方 §抽离决策。
// 实测函数数:**36 函数 + 17 const + 1 class**(master scout 估 ~34,实测多 2:
//   fuzzyTroopDisplay / fuzzyGenDisplay master scout 漏数;少 1:aiFrontierEnemyCities
//   归军事 MIL3 不进本 chain;再加 getUnitVisionRadius / getScoutINT 2 funcs 实际归
//   map.js)。
//
// scout-before-extract 第 11 次应用,scout 四件验证(p3.8 沉淀)PASS。
//
// ── script 加载顺序(制作人 2026-05-05 approve)──
// `data/* → core/state → helpers → hubs → claude_ai → tick → main → map →
//  chains/* → render/* → inline`
// **本文件作为 core 最后一个文件**(core/main.js 之后,chains/* 之前)。
// 已抽 chains/* 大量调本 module 的 hoisted function,运行时 OK(classic <script>
// 加载完后才执行 initGame,所有 hoisted function 全局可见)。
//
// ── 模板说明(map.js 不是 chain,而是 core 基础设施)──
// 区别于 chains/*.js:
//   - map.js 是**横切基础设施**,被多 chain 调用,无写 G subtree 的 chain-specific
//     state(G.fog / G._cityNeighbors 是横切 state,跟 G.cities 同级)
//   - 不需要 chain 模板 6 项 header 中的"写口归属落在 G 的哪条 chain subtree";
//     本 module 的"写口归属"是横切 cache + render 数据,不归任何 chain
//   - 反向调用清单同样列出,因 hoisted function 跨 chain/core 调用复杂度类似

// ════════════════════════════════════════════════════════════════════
// ── M0 地图系统 section header (v181 L1404-L1408) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 地图系统 v4.0 — 六边形网格（Hex Grid）
// SVG viewBox: 0 0 960 740
// 平顶六边形（flat-top），axial坐标系 (q, r)
// ═══════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// ── M1 HEX 常量 + 工具 (v181 L1426-L1503) ──
// ════════════════════════════════════════════════════════════════════

// ─── Hex 常量 ───
const HEX_SIZE = 6;                          // hex半径(px) — 中心到顶点
const HEX_H = Math.sqrt(3) * HEX_SIZE;      // hex高 ≈ 19.05
const HEX_COLS = 102, HEX_ROWS = 68;        // 网格尺寸 — 约6936个hex
// ─── Hex 坐标工具 ───
// 平顶 flat-top hex: axial (q, r)
// 偶数列 offset (col, row) ↔ axial 转换
// 我们使用 offset 坐标存储: (col, row)，偶数列不偏移，奇数列向下偏半行

/** offset → pixel 中心 */
function hexToPixel(col, row) {
  const x = col * HEX_SIZE * 1.5 + HEX_SIZE + 8;  // +8 左边距
  const y = row * HEX_H + (col % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + 4; // +4 上边距
  return { x, y };
}

/** pixel → 最近hex (col, row) — 暴力搜最近hex中心 */
function pixelToHex(px, py) {
  // 粗算大致col/row范围，然后在±3范围内暴力搜最近
  const approxCol = Math.round((px - 8 - HEX_SIZE) / (HEX_SIZE * 1.5));
  const approxRow = Math.round((py - 4 - HEX_H / 2) / HEX_H);
  let bestC = 0, bestR = 0, bestD = Infinity;
  for (let dc = -3; dc <= 3; dc++) {
    for (let dr = -3; dr <= 3; dr++) {
      const cc = approxCol + dc, rr = approxRow + dr;
      if (cc < 0 || cc >= HEX_COLS || rr < 0 || rr >= HEX_ROWS) continue;
      const p = hexToPixel(cc, rr);
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < bestD) { bestD = d; bestC = cc; bestR = rr; }
    }
  }
  return { col: bestC, row: bestR };
}

/** hex key string */
function hkey(col, row) { return col + ',' + row; }
function hparse(k) { const p = k.split(','); return { col: +p[0], row: +p[1] }; }

/** 六邻居 (flat-top offset coordinates) */
function hexNeighbors(col, row) {
  const parity = col & 1; // 0=even, 1=odd
  const dirs = parity
    ? [[-1,0],[1,0],[0,-1],[0,1],[-1,1],[1,1]]    // odd col
    : [[-1,-1],[1,-1],[0,-1],[0,1],[-1,0],[1,0]];  // even col
  const result = [];
  for (const [dc, dr] of dirs) {
    const nc = col + dc, nr = row + dr;
    if (nc >= 0 && nc < HEX_COLS && nr >= 0 && nr < HEX_ROWS)
      result.push({ col: nc, row: nr });
  }
  return result;
}

/** offset坐标 → cube坐标（hex网格通用转换） */
function toCube(col, row) {
  const x = col;
  const z = row - (col - (col & 1)) / 2;
  return [x, -x - z, z];
}

/** hex 距离 (offset → cube → Manhattan/2) */
function hexDist(c1, r1, c2, r2) {
  const [x1, y1, z1] = toCube(c1, r1);
  const [x2, y2, z2] = toCube(c2, r2);
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
}

/** hex SVG 路径 (flat-top, centered at origin) */
function hexPathStr(size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i);
    pts.push(`${(size * Math.cos(angle)).toFixed(2)},${(size * Math.sin(angle)).toFixed(2)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}
const HEX_PATH = hexPathStr(HEX_SIZE);
const HEX_PATH_INNER = hexPathStr(HEX_SIZE * 0.92);

// ════════════════════════════════════════════════════════════════════
// ── M2 FOG 常量 + 视野 helpers (v181 L1509-L1565) ──
// ════════════════════════════════════════════════════════════════════

const FOG_UNEXPLORED = 0, FOG_EXPLORED = 1, FOG_VISIBLE = 2;
const FOG_UNIT_RADIUS_BASE = 3, FOG_STEALTH_RADIUS = 1;
// 城市无固定视野半径——己方领地范围（由_buildTerritoryMap计算）即为城市视野

/** ★ v95: 部队视野范围 = 基础3 + INT加成（部队中最高INT武将）
 *  INT >= 90 → +2（视野5）
 *  INT >= 75 → +1（视野4）
 *  INT <  75 → +0（视野3）
 *  ambush 状态固定为 FOG_STEALTH_RADIUS(1)
 *  camp 状态使用正常视野计算（v137: 扎营不再降低视野）
 */
function getUnitVisionRadius(unit) {
  if (unit.status === 'ambush') return FOG_STEALTH_RADIUS;
  let maxInt = 0;
  (unit.squads || []).forEach(sq => {
    const g = GEN_MAP[sq.genName];
    if (g && g.int > maxInt) maxInt = g.int;
  });
  let bonus = 0;
  if (maxInt >= 90) bonus = 2;
  else if (maxInt >= 75) bonus = 1;
  // SKILL_INLINE: guimou — 郭嘉鬼谋：部队视野+1
  const _guojiaVision = unit.squads.some(sq => sq.genName === '郭嘉') ? 1 : 0;
  // ★ v132 E1: 探子回报临时视野加成
  const _scoutVisionBonus = (unit._scoutBonus && unit._scoutBonus.expiresAt > G.turn) ? unit._scoutBonus.radius : 0;
  return FOG_UNIT_RADIUS_BASE + bonus + getTechEffect(unit.fac, 'visionBonus') + _guojiaVision + _scoutVisionBonus; // ★ v115: 斥候网
}

/**
 * v97: 情报精度——目标敌方部队被哪些己方部队视野覆盖，取覆盖者中最高INT
 * 城市视野不提供情报精度（只提供存在感知，INT=0）
 */
function getScoutINT(targetUnit) {
  const tq = targetUnit.hq ?? 0, tr = targetUnit.hr ?? 0;
  let maxInt = 0;
  // ★ v132 E1: precise scout bonus → INT=100（精确情报）
  let hasPrecise = false;
  G.units.forEach(u => {
    if (u.fac !== G.playerFac) return;
    if (getUnitTroops(u) <= 0) return;
    const radius = getUnitVisionRadius(u);
    if (hexDist(u.hq ?? 0, u.hr ?? 0, tq, tr) <= radius) {
      // 检查precise scout bonus
      if (u._scoutBonus && u._scoutBonus.precise && u._scoutBonus.expiresAt > G.turn) hasPrecise = true;
      (u.squads || []).forEach(sq => {
        const g = GEN_MAP[sq.genName];
        if (g && g.int > maxInt) maxInt = g.int;
      });
    }
  });
  if (hasPrecise) maxInt = Math.max(maxInt, 100); // 精确情报等同INT100
  // SKILL_INLINE: jijian — 田丰·极谏：当官时己方情报精度+2
  if(hasFacGen(G.playerFac, '田丰') && genHasOffice('田丰', G.playerFac)) maxInt += 2;
  // SKILL_INLINE: jingong_scout — 钟会·矜功：目标部队有钟会时，侦查INT阈值+15（等效降低精度）
  if(targetUnit.squads && targetUnit.squads.some(sq => sq.genName === '钟会')) maxInt -= 15;
  return Math.max(0, maxInt);
}

// ════════════════════════════════════════════════════════════════════
// ── M3 fog 子系统 display formatting helpers (v181 L1567-L1611) ──
// ════════════════════════════════════════════════════════════════════

/**
 * v97: 兵力模糊显示（纯显示层，不改底层数据）
 * @param {number} real 真实兵力
 * @param {number} intVal 观察方INT
 * @returns {string} 模糊后的显示文字
 */
function fuzzyTroopDisplay(real, intVal) {
  if (intVal >= 90) return fmt(real);
  if (intVal >= 75) {
    // 四舍五入到千
    const r = Math.round(real / 1000) * 1000;
    return '约' + (r >= 10000 ? (r / 10000).toFixed(1) + '万' : fmt(r));
  }
  if (intVal >= 60) {
    // 四舍五入到5000
    const r = Math.round(real / 5000) * 5000;
    if (r === 0) return '约数千';
    return '约' + (r >= 10000 ? (r / 10000).toFixed(1) + '万' : fmt(r));
  }
  // <60: 四舍五入到万
  const r = Math.round(real / 10000) * 10000;
  if (r === 0) return '约数千';
  return '约' + (r / 10000).toFixed(0) + '万余';
}

/**
 * v97: 武将识别模糊
 * @param {Object} unit 敌方部队
 * @param {number} intVal 观察方INT
 * @returns {string} 模糊后的武将名显示
 */
function fuzzyGenDisplay(unit, intVal) {
  const squads = unit.squads || [];
  if (!squads.length) return '不明将领';
  const main = squads[0]?.genName || '?';
  if (intVal >= 75) {
    // 主将+副将
    return squads.map(sq => sq.genName || '?').join('/');
  }
  if (intVal >= 60) {
    // 仅主将
    return main + '部';
  }
  return '不明将领';
}

// ════════════════════════════════════════════════════════════════════
// ── M4 fog 系统主体 (v181 L1613-L1851) ──
// ════════════════════════════════════════════════════════════════════

/** 获取fid的视野共享来源列表（含盟友+附庸） */
function getFogAllyFacs(fid) {
  const result = [fid];
  ALL_FACS.forEach(other => {
    if (other === fid) return;
    const d = G.diplo?.[`${fid}-${other}`];
    if (!d) return;
    // 盟友：双向共享
    if (d.status === 'ally') { result.push(other); return; }
    // 宗主看附庸视野（fid是宗主，other是附庸）
    if (d.status === 'vassal' && d.suzerain === fid) { result.push(other); }
  });
  return result;
}

/** 判断fid是否能看到otherfid的数据（己方/盟友/自己的附庸） */
function canSeeFactionData(fid, otherFid) {
  if (fid === otherFid) return true;
  const d = G.diplo?.[`${fid}-${otherFid}`];
  if (!d) return false;
  if (d.status === 'ally') return true;
  // 宗主可看附庸数据
  if (d.status === 'vassal' && d.suzerain === fid) return true;
  return false;
}

/** 从一个中心hex做BFS扩散半径r，收集所有覆盖的hex keys */
function fogBFS(col, row, radius) {
  const result = [hkey(col, row)];
  if (radius <= 0) return result;
  const visited = new Set(result);
  let frontier = [{col, row}];
  for (let d = 0; d < radius; d++) {
    const next = [];
    for (const f of frontier) {
      for (const nb of hexNeighbors(f.col, f.row)) {
        const k = hkey(nb.col, nb.row);
        if (!visited.has(k)) {
          visited.add(k);
          result.push(k);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return result;
}

/** 初始化迷雾数据（新游戏 or 旧存档兼容） */
function initFog() {
  G.fog = {};
  G.fogSnap = {};
  ALL_FACS.forEach(fid => {
    G.fog[fid] = {};
    G.fogSnap[fid] = {};
    // 只有己方城市位置开局标记explored（远方城市保持unexplored）
    CITIES_DEF.forEach(def => {
      const city = G.cities[def.id];
      if (city && city.fac === fid) {
        G.fog[fid][hkey(def.q, def.r)] = FOG_EXPLORED;
      }
    });
  });
  // 计算各势力初始视野（己方领地→visible）
  ALL_FACS.forEach(fid => updateFog(fid));

  // 开局补充：把与己方visible区域相邻的敌方城市，其整个辖区设为explored
  // 逻辑：你知道京口在边境旁，你也知道它大致控制多大范围——但不知道谁控制
  ALL_FACS.forEach(fid => {
    const fog = G.fog[fid];
    const territory = _buildTerritoryMap();
    // 找出所有与己方visible区域相邻格属于的非己方城市
    const neighborCities = new Set();
    for (const k in fog) {
      if (fog[k] !== FOG_VISIBLE) continue;
      const {col, row} = hparse(k);
      hexNeighbors(col, row).forEach(nb => {
        const nk = hkey(nb.col, nb.row);
        if (territory[nk] && territory[nk].fac !== fid) {
          neighborCities.add(territory[nk].cityId);
        }
      });
    }
    // 把这些城市的整个辖区设为explored
    for (const k in territory) {
      if (neighborCities.has(territory[k].cityId)) {
        if ((fog[k] ?? FOG_UNEXPLORED) === FOG_UNEXPLORED) fog[k] = FOG_EXPLORED;
      }
    }
    // 快照：visible和explored城市都建立归属快照
    for (const k in fog) {
      if (fog[k] >= FOG_EXPLORED && HEX_CITY[k]) {
        const cityId = HEX_CITY[k];
        const city = G.cities[cityId];
        if (city) G.fogSnap[fid][cityId] = { fac: city.fac, turn: 0 };
      }
    }
  });
}

/** 每旬调用：更新fid的迷雾状态 */
function updateFog(fid) {
  const fog = G.fog[fid];
  if (!fog) return;
  // Step 1: 所有 visible(2) → explored(1)
  for (const k in fog) {
    if (fog[k] === FOG_VISIBLE) fog[k] = FOG_EXPLORED;
  }
  // Step 2: 收集所有视野源（己方+盟友+附庸）
  const allyFacs = getFogAllyFacs(fid);
  const visibleKeys = new Set();

  // Step 2a: 领地视野 — 己方（含盟友/附庸）城市的领地范围全部可见
  const territory = _buildTerritoryMap();
  for (const k in territory) {
    const t = territory[k];
    if (allyFacs.includes(t.fac)) {
      visibleKeys.add(k);
    }
  }

  // Step 2b: 部队视野
  for (const srcFid of allyFacs) {
    G.units.forEach(unit => {
      if (unit.fac !== srcFid) return;
      const radius = getUnitVisionRadius(unit);
      fogBFS(unit.hq ?? 0, unit.hr ?? 0, radius).forEach(k => visibleKeys.add(k));
    });
  }

  // Step 3: 设置可见，更新快照
  for (const k of visibleKeys) {
    fog[k] = FOG_VISIBLE;
    // 如果该hex有城市，更新快照
    if (HEX_CITY[k]) {
      const cityId = HEX_CITY[k];
      const city = G.cities[cityId];
      if (city) {
        if (!G.fogSnap[fid]) G.fogSnap[fid] = {};
        G.fogSnap[fid][cityId] = { fac: city.fac, turn: G.turn };
      }
    }
  }

  // Step 3.5 ★ v116: 细作探报持续揭雾
  if (G.scoutReveals) {
    G.scoutReveals.filter(sr => sr.fid === fid && sr.expiresAt > G.turn).forEach(sr => {
      _applyScoutReveal(fid, sr.cityId);
    });
  }

  // Step 4 (v111): 己方城市的ROADS邻接敌城 → explored（城市hex+领地范围）
  // 解决"攻下新城后看不到下一个敌城→AI不进攻"的根因
  // 用ROADS邻接而非territory hex边界，避免无限BFS回填导致半张地图都变explored
  const myFacCities = CITIES_DEF.filter(def => G.cities[def.id]?.fac === fid || allyFacs.includes(G.cities[def.id]?.fac));
  const neighborEnemyCities = new Set();
  myFacCities.forEach(def => {
    (ROAD_ADJ[def.id] || []).forEach(nbId => {
      const nbCity = G.cities[nbId];
      if (nbCity && nbCity.fac !== fid && !allyFacs.includes(nbCity.fac)) {
        neighborEnemyCities.add(nbId);
      }
    });
  });
  if (neighborEnemyCities.size > 0) {
    // 只把这些城市的领地范围（territory里cityId匹配的hex）设为explored
    for (const k in territory) {
      if (neighborEnemyCities.has(territory[k].cityId)) {
        if ((fog[k] ?? FOG_UNEXPLORED) === FOG_UNEXPLORED) {
          fog[k] = FOG_EXPLORED;
          if (HEX_CITY[k]) {
            const cityId = HEX_CITY[k];
            const city = G.cities[cityId];
            if (city) {
              if (!G.fogSnap[fid]) G.fogSnap[fid] = {};
              if (!G.fogSnap[fid][cityId]) {
                G.fogSnap[fid][cityId] = { fac: city.fac, turn: G.turn };
              }
            }
          }
        }
      }
    }
  }
}

/** C4: 城市易主时更新所有能看到该城的势力快照 */
function updateFogCitySnapshot(cityId, newFac) {
  const cdef = CITY_MAP?.[cityId];
  if (!cdef) return;
  const k = hkey(cdef.q, cdef.r);
  ALL_FACS.forEach(fid => {
    if (!G.fog?.[fid]) return;
    // 只有当前visible的势力才能感知城市易主，explored不应该更新（情报过时）
    const fogLv = G.fog[fid][k] ?? FOG_UNEXPLORED;
    if (fogLv === FOG_VISIBLE) {
      if (!G.fogSnap[fid]) G.fogSnap[fid] = {};
      G.fogSnap[fid][cityId] = { fac: newFac, turn: G.turn };
    }
  });
  invalidateFogCache(); // 颜色可能变化，清除渲染缓存
}

/** 查询某hex对fid的可见度 */
function getFogLevel(fid, col, row) {
  return G.fog?.[fid]?.[hkey(col, row)] ?? FOG_UNEXPLORED;
}

/** 查询某城市对fid的可见度（基于城市hex位置） */
function getCityFogLevel(fid, cityId) {
  const cdef = CITY_MAP?.[cityId];
  if (!cdef) return FOG_UNEXPLORED;
  return getFogLevel(fid, cdef.q, cdef.r);
}

/** 获取fid对某城市的快照归属（explored时显示旧数据） */
/** 计算fid已知的某势力城市数量（可见+快照） */
function getKnownCityCount(viewerFid, targetFid) {
  let count = 0;
  CITIES_DEF.forEach(def => {
    const level = getCityFogLevel(viewerFid, def.id);
    if (level === FOG_VISIBLE) {
      if (G.cities[def.id]?.fac === targetFid) count++;
    } else {
      const snap = G.fogSnap?.[viewerFid]?.[def.id];
      if (snap && snap.fac === targetFid) count++;
    }
  });
  return count;
}


// Mutates CITIES_DEF (from src/data/cities.js): adds x/y pixel coords to each city
// 兼容旧代码: city.x / city.y 从 hex 坐标计算
CITIES_DEF.forEach(c => {
  const p = hexToPixel(c.q, c.r);
  c.x = p.x; c.y = p.y;
});

// ════════════════════════════════════════════════════════════════════
// ── M5 城市邻接 ensureCityNeighbors (v181 L1857-L1868) ──
// ════════════════════════════════════════════════════════════════════

function ensureCityNeighbors() {
  if(G._cityNeighbors) return;
  G._cityNeighbors = {};
  const allCityIds = new Set(Object.keys(G.cities));
  allCityIds.forEach(cityId=>{ G._cityNeighbors[cityId] = []; });
  ROADS.forEach(([a,b])=>{
    if(allCityIds.has(a) && allCityIds.has(b)){
      if(!G._cityNeighbors[a].includes(b)) G._cityNeighbors[a].push(b);
      if(!G._cityNeighbors[b].includes(a)) G._cityNeighbors[b].push(a);
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// ── M6 地形多边形 + pointInPoly (v181 L1937-L2103) ──
// ════════════════════════════════════════════════════════════════════

const TERRAIN_POLYS = [
  // ══════ 不可通行绝壁 (impassable) ══════
  // 秦岭主脊（汉中以北，天水-洛阳之间的屏障）
  {type:'impassable', pts:'192,280 216,275 246,278 276,282 306,288 335,294 365,300 383,295 371,310 341,308 312,302 276,296 240,292 210,290 186,290'},
  // 太行山脊（晋阳-邺城之间）
  {type:'impassable', pts:'383,110 393,105 402,100 412,106 421,118 425,132 419,148 413,160 405,155 399,140 393,125 386,118'},
  // 武夷山脉（会稽→番禺方向的东南大山脉，南北走向）
  {type:'impassable', pts:'694,462 717,455 739,465 744,488 732,510 715,525 699,540 688,555 682,545 684,520 691,500 688,482 691,470'},
  // 武夷山南段（连接南岭东端）
  {type:'mountain', pts:'670,548 694,540 711,550 715,572 703,592 684,600 667,590 660,572 664,558'},
  // 闽越山地（武夷山以东，海岸线以西的崎岖山区）
  {type:'mountain', pts:'703,465 727,458 747,470 751,495 739,518 723,535 705,545 694,530 696,510 699,490 696,475'},
  // 岭南丘陵（番禺-豫章之间的广东丘陵）
  {type:'hill', pts:'596,570 628,562 658,568 670,588 660,608 634,615 608,608 592,590'},
  // 南岭山脉（交州/番禺北屏障，东西走向，东端连接武夷山南段）
  {type:'impassable', pts:'347,540 383,535 419,530 455,528 491,530 526,535 562,540 598,545 622,552 646,558 664,560 670,575 646,580 610,572 574,565 538,558 503,550 467,548 431,548 395,550 365,555 347,555'},
  // 大巴山（巴中-汉中之间的一段绝壁）
  {type:'impassable', pts:'216,355 234,348 252,350 261,360 254,372 238,375 222,370 214,362'},
  // 岷山（成都西北方向的高山屏障）
  {type:'impassable', pts:'133,380 147,372 162,376 168,390 162,405 147,410 133,404 127,392'},

  // ══════ 可通行山地 (mountain) ══════
  // 秦岭南麓（汉中北侧山区，有道路穿过）
  {type:'mountain', pts:'168,265 228,255 300,265 353,278 383,290 407,305 383,320 335,318 288,310 240,300 204,295 168,285'},
  // 秦岭北麓
  {type:'mountain', pts:'204,250 252,240 312,246 359,258 401,268 419,276 401,288 359,282 312,270 264,262 222,260'},
  // 太行山东麓（丘陵过渡）
  {type:'mountain', pts:'431,100 449,105 461,120 464,142 457,162 449,175 437,180 429,195 421,205 413,195 419,175 425,160 429,148 425,128 426,112'},
  // 太行山西麓
  {type:'mountain', pts:'359,108 374,102 386,108 381,126 374,145 365,158 357,168 347,162 350,145 352,128 352,118'},
  // 太行山南段（洛阳北方，连接中原丘陵）
  {type:'mountain', pts:'405,182 419,178 431,185 433,200 425,215 413,218 401,210 398,198'},
  // 蜀道山区（成都-梓潼-汉中之间）
  {type:'mountain', pts:'180,340 210,328 240,335 270,345 276,365 258,380 228,385 202,378 183,365 178,352'},
  // 巫山（夷陵西侧山区）
  {type:'mountain', pts:'300,390 324,380 350,386 365,400 359,418 338,428 314,422 297,410 294,398'},
  // 大别山（合肥西南，武昌-合肥之间）
  {type:'mountain', pts:'526,320 556,312 584,318 598,335 588,352 562,358 536,350 524,338'},
  // 西凉山地（姑臧周围）
  {type:'mountain', pts:'49,170 85,158 127,155 150,165 159,185 144,205 115,215 82,212 59,200 47,185'},
  // 陇山（西凉山地到天水之间，填补空白）
  {type:'mountain', pts:'67,215 97,210 130,218 156,230 168,250 162,268 142,275 115,270 85,260 67,245 63,228'},
  // 祁连山余脉（天水以西到左边界）
  {type:'impassable', pts:'37,240 59,232 70,248 67,268 55,282 37,288 23,278 19,260'},
  // 燕山（蓟城北方屏障，东西横亘，覆盖r=7~10区域）
  {type:'mountain', pts:'324,80 371,72 419,68 467,65 514,68 550,72 586,78 610,85 622,98 598,105 562,100 526,95 491,92 455,90 419,88 383,90 347,95 329,92'},
  // 燕山东段（蓟城-北平之间）
  {type:'mountain', pts:'586,72 622,68 652,78 664,92 652,105 628,108 598,100'},
  // 五岭余脉（番禺-交州间）
  {type:'mountain', pts:'359,560 401,558 443,555 485,558 520,562 538,575 514,585 479,580 443,575 407,575 374,572'},
  // 南中山地（建宁周围，成都-建宁-交州路线上的崎岖山区）
  {type:'mountain', pts:'115,490 144,480 180,485 210,500 216,525 204,548 174,560 142,555 118,535 109,510'},
  // 南中东部山区（建宁-交州之间）
  {type:'mountain', pts:'228,550 264,540 300,545 324,560 318,582 288,592 258,585 234,570'},
  // 成都-永安间山地（巫山南麓延伸）
  {type:'mountain', pts:'198,440 234,435 270,442 288,460 282,482 258,495 228,498 204,488 192,468'},
  // 长沙丘陵（长沙周围的江南丘陵地带）
  {type:'hill', pts:'473,510 509,502 544,508 562,525 550,545 520,552 488,545 469,528'},

  // ══════ 丘陵 (hill) ══════
  // 中原丘陵（许昌-洛阳之间的缓丘）
  {type:'hill', pts:'395,200 431,195 467,200 485,218 473,238 440,245 407,240 393,225 389,212'},
  // 荆北丘陵（襄阳周围）
  {type:'hill', pts:'383,340 413,332 443,338 461,355 449,370 419,378 393,372 377,358'},
  // 淮南丘陵（合肥-寿春一带）
  {type:'hill', pts:'574,275 604,270 631,278 641,295 628,310 598,315 574,308 566,292'},
  // 江南丘陵（建业南方）
  {type:'hill', pts:'628,410 664,402 694,410 705,430 691,450 660,456 634,445 622,428'},
  // 陇西丘陵（天水东侧）
  {type:'hill', pts:'207,240 238,232 264,238 273,255 258,268 230,270 210,260'},
  // 冀南丘陵
  {type:'hill', pts:'437,155 467,148 497,155 505,172 491,188 461,192 440,182 433,168'},

  // ══════ 平原 (plain) ══════
  // 关中平原（洛阳-河东）
  {type:'plain', pts:'300,190 341,182 381,188 413,195 429,215 417,240 383,252 345,248 309,238 294,220 294,205'},
  // 华北平原（邺城-许昌-青州大平原）
  {type:'plain', pts:'449,140 514,135 580,142 634,158 646,180 634,210 610,240 574,260 532,270 491,265 461,250 443,230 437,200 440,170 445,150'},
  // 江汉平原（荆州一带）
  {type:'plain', pts:'407,390 443,385 485,392 514,410 512,435 488,450 449,452 417,445 398,428 393,408'},
  // 成都平原
  {type:'plain', pts:'150,408 180,398 216,405 238,420 242,445 226,462 195,468 166,460 144,442 142,422'},

  // ══════ 水域 (water) — 大湖泊 ══════
  // 洞庭湖（江陵/武昌之间，手动校准不被stretch放大）
  {type:'water', pts:'448,410 462,402 478,410 482,425 475,440 460,445 448,438 442,425'},
  // 鄱阳湖（柴桑附近）
  {type:'water', pts:'604,420 628,415 646,425 643,445 624,455 604,448 592,435'},
  // 太湖（建业-京口之间，手动校准）
  {type:'water', pts:'668,382 685,375 698,383 696,396 684,404 668,400 662,392'},

  // ══════ 海洋 (water) — 统一海岸线polygon，基于真实中国海岸弧度 ══════
  // 渤海湾凹入→山东半岛突出→黄海→长江口微凸→杭州湾凹入→
  // 浙闽海岸→福建大幅内收→广东最深凹入→珠江口回弹→南海
  {type:'water', pts:'784,13 784,23 784,33 773,49 763,54 752,70 741,75 752,91 752,101 763,106 773,122 784,127 795,143 795,153 784,158 773,174 773,184 784,189 784,200 773,215 773,226 773,236 773,247 784,252 784,262 795,278 795,288 795,298 784,304 784,314 784,324 773,340 773,350 763,356 763,366 773,382 773,392 784,397 784,408 784,418 784,428 784,439 784,449 763,460 741,470 720,480 698,491 677,501 666,517 655,522 645,538 634,548 623,563 616,578 612,595 608,615 600,635 588,655 570,672 550,683 510,695 1075,750 1075,0'},
  // 南海补充（交州/番禺正南方海域，与主海岸线polygon底部衔接）
  // 南海补充（斜切海岸线底部→番禺以南→交州以南，与主海岸线衔接）
  {type:'water', pts:'550,692 580,692 615,692 645,692 666,692 698,692 720,700 741,715 1075,740 705,738 550,740 407,738 312,728 276,710 288,695 371,692 455,692 520,692'},
  // 东南近海（豫章以南～番禺以东，斜切至南海，无直角）
  // 西界从会稽(y≈470)沿武夷山东麓内收，到珠江口斜切向西南至番禺东方
  {type:'water', pts:'717,470 741,478 751,500 744,530 732,548 717,568 705,590 690,615 670,640 645,658 615,672 580,680 550,683 550,675 580,665 610,650 635,632 655,610 670,585 682,560 692,535 700,510 706,490 698,478'},

  // ══════ 边界不可通行 (impassable) ══════
  // 北方塞外（上边界，延伸覆盖到燕山脚下，x>700留给渤海水域）
  {type:'impassable', pts:'-70,0 765,0 765,42 670,48 622,52 550,48 479,40 407,42 335,50 264,62 192,72 121,82 49,92 -11,105 -70,120'},
  // 左上西域（姑臧以西以北，大面积封死）
  {type:'impassable', pts:'-70,120 25,100 61,120 70,155 67,190 59,220 49,250 37,280 31,310 37,340 49,370 61,400 -70,400'},
  // 青藏高原东缘（天水-成都以西的大面积高山）
  // 覆盖范围稍大于城市，确保无plain缝隙
  {type:'impassable', pts:'52,188 80,175 112,180 140,192 162,215 182,248 192,285 195,320 195,355 192,390 185,425 178,460 168,485 148,490 125,478 105,460 82,435 62,405 52,370 45,335 42,298 45,262 48,228'},
  // 左中（成都以西，岷山延伸）— 右边缘到x≈165~180，无缝连接岷山impassable
  {type:'impassable', pts:'-70,400 61,400 97,408 127,425 142,455 147,485 144,510 139,535 127,558 106,578 79,588 31,595 -70,600'},
  // 左下（建宁以西以南到底部）— 封死整个左下角
  {type:'impassable', pts:'-70,600 25,590 73,585 103,575 127,590 144,618 150,648 142,672 109,685 49,695 -70,710'},
  // 南方蛮荒带（交州/番禺以南到地图底部）— 左端起y=680确保与左下polygon无缝
  {type:'impassable', pts:'-70,678 -70,745 720,745 720,700 705,670 596,662 467,662 371,664 288,666 192,670 109,674 49,676 -23,676'},
  // 西南填充（建宁南方到交州南方之间，无缝衔接）
  {type:'impassable', pts:'142,648 180,632 240,628 300,635 347,645 377,655 377,674 288,678 192,688 115,696 97,688 121,672'},
  // 长沙-交州之间南部（五岭以南空白）
  {type:'impassable', pts:'377,618 431,615 479,618 526,625 568,635 596,648 596,674 467,672 371,674 371,655 377,635'},
  // 建宁西南补丁（封堵残余plain缝隙，x=130~200, y=580~670）
  {type:'impassable', pts:'82,582 121,575 150,588 162,618 162,648 150,668 127,675 97,672 79,652 70,625 70,600'},
  // 南中-五岭间大面积补丁（x=195~375, y=588~650，封堵所有残余plain）
  {type:'impassable', pts:'162,588 204,582 252,585 300,590 347,598 377,610 381,648 347,650 300,645 252,640 204,638 168,640 162,625'},

  // ══════ 林地 (forest) ══════
  // 荆南林区（夷陵南侧）
  {type:'forest', pts:'324,430 359,422 393,430 401,455 383,475 353,480 326,472 314,452'},
  // 交州密林
  {type:'forest', pts:'365,590 401,582 437,588 455,610 437,632 405,638 377,628 359,610'},
  // 番禺密林
  {type:'forest', pts:'455,620 491,615 524,622 536,645 520,665 488,670 461,660 449,640'},
  // 江东林区（会稽周围）
  {type:'forest', pts:'699,442 723,435 741,445 739,468 723,480 703,478 694,460'},
  // 闽北密林（武夷山东麓，福建沿海山林）
  {type:'forest', pts:'703,498 727,492 744,502 739,525 723,535 705,530 696,515 699,505'},
  // 闽南密林（武夷山南段东侧）
  {type:'forest', pts:'688,558 711,550 727,562 723,585 708,598 688,592 676,575'},
  // 岭东密林（番禺东北，广东丘陵林区）
  {type:'forest', pts:'592,608 622,600 646,610 643,632 628,645 600,640 586,625'},
  // 太行山林（晋阳以东）
  {type:'forest', pts:'365,120 395,115 417,125 421,145 407,158 381,160 362,150 357,135'},
  // 河北林区
  {type:'forest', pts:'538,95 574,88 604,96 610,118 596,135 568,138 541,128 532,110'},
  // 南中密林（建宁周围热带丛林）
  {type:'forest', pts:'127,530 156,522 190,528 202,548 190,568 162,575 135,568 121,548'},
  // 南中-交州间密林
  {type:'forest', pts:'276,580 312,572 345,578 353,600 335,618 306,622 278,612 270,595'},
];

// ─── Hex 地形数据（在 initGame 中构建）───
let HEX_TERRAIN = {};    // key: "col,row" → terrain type
let HEX_ROAD = {};       // key: "col,row" → true (有官道)
let HEX_CITY = {};       // key: "col,row" → cityId

// 多边形内测试（射线法）
function pointInPoly(px, py, pts) {
  const coords = pts.split(' ').map(p => p.split(',').map(Number));
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i], [xj, yj] = coords[j];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}


// ════════════════════════════════════════════════════════════════════
// ── M7 buildHexTerrain (v181 L2105-L2290) ──
// ════════════════════════════════════════════════════════════════════

function buildHexTerrain() {
  HEX_TERRAIN = {};
  HEX_ROAD = {};
  HEX_CITY = {};
  _staticMapCache = ''; // 重建时清除缓存

  // 地形优先级（高优先覆盖低优先）
  const TERRAIN_PRIO = {water:6, impassable:5, mountain:4, forest:3, hill:2, plain:1, swamp:2, deep_water:7, coastal_water:7};

  // 1. 填充基础地形（从TERRAIN_POLYS）
  for (let col = 0; col < HEX_COLS; col++) {
    for (let row = 0; row < HEX_ROWS; row++) {
      const p = hexToPixel(col, row);
      let terrain = 'plain';
      let bestPrio = 0;
      for (const poly of TERRAIN_POLYS) {
        const prio = TERRAIN_PRIO[poly.type] || 0;
        if (prio > bestPrio && pointInPoly(p.x, p.y, poly.pts)) {
          terrain = poly.type;
          bestPrio = prio;
        }
      }
      HEX_TERRAIN[hkey(col, row)] = terrain;
    }
  }

  // 2. 河流hex化 — 沿RIVERS SVG路径采样，把经过的hex标为river
  RIVERS.forEach(pathStr => {
    // 从SVG path字符串中提取关键坐标点，然后密集采样
    const pts = [];
    const re = /([MQLC])\s*([\d.,\s]+)/gi;
    let match;
    while ((match = re.exec(pathStr)) !== null) {
      const nums = match[2].trim().split(/[\s,]+/).map(Number);
      for (let i = 0; i < nums.length - 1; i += 2) {
        pts.push({x: nums[i], y: nums[i+1]});
      }
    }
    // 在相邻控制点之间密集插值采样
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i+1];
      const steps = Math.ceil(Math.hypot(b.x-a.x, b.y-a.y) / 3); // 每3px采样一次
      for (let s = 0; s <= steps; s++) {
        const t = s / Math.max(steps, 1);
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        const h = pixelToHex(px, py);
        const k = hkey(h.col, h.row);
        const cur = HEX_TERRAIN[k];
        // river不覆盖water/deep_water/coastal_water（湖泊保留），不覆盖impassable
        if (cur !== 'water' && cur !== 'deep_water' && cur !== 'coastal_water' && cur !== 'impassable') {
          HEX_TERRAIN[k] = 'river';
        }
      }
    }
  });

  // 3. 标记城市hex（强制plain，确保可通行）
  CITIES_DEF.forEach(c => {
    HEX_CITY[hkey(c.q, c.r)] = c.id;
    HEX_TERRAIN[hkey(c.q, c.r)] = 'plain';
    // 城市周围1格：impassable→mountain，且自动铺road（确保任何方向可接近城市）
    hexNeighbors(c.q, c.r).forEach(nb => {
      const nk = hkey(nb.col, nb.row);
      if (HEX_TERRAIN[nk] === 'impassable') HEX_TERRAIN[nk] = 'mountain';
      if (HEX_TERRAIN[nk] !== 'water' && HEX_TERRAIN[nk] !== 'deep_water' && HEX_TERRAIN[nk] !== 'coastal_water') {
        HEX_ROAD[nk] = true; // 城郊道路：mountain 3→1.5, hill/forest 2→1
      }
    });
  });

  // 4. 生成道路hex（沿城市间直线路径铺设道路标记）
  ROADS.forEach(([aid, bid]) => {
    const ca = CITY_MAP[aid];
    const cb = CITY_MAP[bid];
    if (!ca || !cb) return;
    const path = hexLineDraw(ca.q, ca.r, cb.q, cb.r);
    path.forEach(({col, row}) => {
      const k = hkey(col, row);
      const t = HEX_TERRAIN[k];
      // 道路穿越任何地形（除water/coastal_water/deep_water外），impassable降级为mountain
      if (t === 'impassable') HEX_TERRAIN[k] = 'mountain';
      if (t !== 'water' && t !== 'deep_water' && t !== 'coastal_water') {
        HEX_ROAD[k] = true;
      }
    });
  });

  // 5. 海域分层：BFS从陆地边界出发，按距离分3层
  //    dist 1~4  → water        (近岸浅海，cost=6，可通行，蓝色)
  //    dist 5~9  → coastal_water(近海，cost=999，不可通行，中蓝)
  //    dist 10+  → deep_water   (深海，cost=999，不可通行，深蓝)
  {
    const waterHexes = new Set();
    for (let col = 0; col < HEX_COLS; col++) {
      for (let row = 0; row < HEX_ROWS; row++) {
        if (HEX_TERRAIN[hkey(col, row)] === 'water') waterHexes.add(hkey(col, row));
      }
    }
    // BFS：从所有紧邻非water hex的water hex开始
    const bfsDist = {};
    const bfsQueue = [];
    waterHexes.forEach(k => {
      const {col, row} = hparse(k);
      const nbs = hexNeighbors(col, row);
      for (const nb of nbs) {
        const nk = hkey(nb.col, nb.row);
        if (!waterHexes.has(nk)) { // 邻居是陆地
          bfsDist[k] = 1;
          bfsQueue.push({col, row, d: 1});
          break;
        }
      }
    });
    let qi = 0;
    while (qi < bfsQueue.length) {
      const {col, row, d} = bfsQueue[qi++];
      const nbs = hexNeighbors(col, row);
      for (const nb of nbs) {
        const nk = hkey(nb.col, nb.row);
        if (waterHexes.has(nk) && bfsDist[nk] === undefined) {
          bfsDist[nk] = d + 1;
          bfsQueue.push({col: nb.col, row: nb.row, d: d + 1});
        }
      }
    }
    // 按距离分层
    waterHexes.forEach(k => {
      const d = bfsDist[k] ?? 1;
      if (d <= 4)       { /* water - 保持原样 */ }
      else if (d <= 9)  { HEX_TERRAIN[k] = 'coastal_water'; }
      else              { HEX_TERRAIN[k] = 'deep_water'; }
    });
  }

  // 5.5 地理硬规则：番禺(col52,row62)以南(row≥64)的西段(col<63)不应有水域
  //   big_east/east_coast poly西南角延伸至此，强制改为impassable（岭南山脉延伸）
  for (let col = 0; col < 63; col++) {
    for (let row = 64; row < HEX_ROWS; row++) {
      const k = hkey(col, row);
      const t = HEX_TERRAIN[k];
      if (t === 'water' || t === 'coastal_water' || t === 'deep_water') {
        HEX_TERRAIN[k] = 'impassable';
      }
    }
  }

  // 6. 孤岛检测：找最大连通分量，其余可通行hex标为impassable（消除地图边缘孤岛）
  {
    const BLOCKED_T = new Set(['impassable','coastal_water','deep_water']);
    const visited = new Set();
    const components = [];
    for (let col = 0; col < HEX_COLS; col++) {
      for (let row = 0; row < HEX_ROWS; row++) {
        const k = hkey(col, row);
        if (visited.has(k) || BLOCKED_T.has(HEX_TERRAIN[k] || 'plain')) continue;
        // BFS 找连通分量
        const comp = [];
        const q = [{col, row}];
        visited.add(k);
        let qi = 0;
        while (qi < q.length) {
          const {col: c, row: r} = q[qi++];
          comp.push(hkey(c, r));
          hexNeighbors(c, r).forEach(nb => {
            const nk = hkey(nb.col, nb.row);
            if (!visited.has(nk) && !BLOCKED_T.has(HEX_TERRAIN[nk] || 'plain')) {
              visited.add(nk);
              q.push(nb);
            }
          });
        }
        components.push(comp);
      }
    }
    // 最大分量保留，其余标为impassable
    if (components.length > 1) {
      components.sort((a, b) => b.length - a.length);
      const mainSet = new Set(components[0]);
      for (let i = 1; i < components.length; i++) {
        components[i].forEach(k => { HEX_TERRAIN[k] = 'impassable'; });
      }
    }
  }
}


// ════════════════════════════════════════════════════════════════════
// ── M8 hexLineDraw (v181 L2292-L2323) ──
// ════════════════════════════════════════════════════════════════════

function hexLineDraw(c1, r1, c2, r2) {
  const N = hexDist(c1, r1, c2, r2);
  if (N === 0) return [{col: c1, row: r1}];

  // cube lerp (toCube is now top-level)
  function fromCube(x, y, z) {
    const col = Math.round(x);
    const row = Math.round(z + (col - (col & 1)) / 2);
    return { col, row };
  }
  function cubeLerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function cubeRound(x, y, z) {
    let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    return [rx, ry, rz];
  }

  const a = toCube(c1, r1), b = toCube(c2, r2);
  const results = [];
  for (let i = 0; i <= N; i++) {
    const [lx, ly, lz] = cubeLerp(a, b, i / N);
    const [rx, ry, rz] = cubeRound(lx, ly, lz);
    results.push(fromCube(rx, ry, rz));
  }
  return results;
}


// ════════════════════════════════════════════════════════════════════
// ── M9 移动 cost 常量 + 水陆 helpers (v181 L2325-L2396) ──
// ════════════════════════════════════════════════════════════════════

const TERRAIN_AP_COST = {
  plain:      1,
  road:       1,    // 道路叠加时用0.5
  hill:       2,
  forest:     2,
  mountain:   3,
  water:      2,    // ★ v138: 统一cost=2，入水/上岸的"慢"靠AP清零实现
  swamp:      3,
  impassable: 999,  // 绝壁/高山不可通行
  river:      2,    // ★ v138: 同water，可渡
  coastal_water: 999, // 近海（距陆地5~9格），不可通行
  deep_water: 999,  // 深海（距陆地10+格），不可通行
};

// ── 水战常量 ──
const NAVAL_WATER_COST = 2;  // 水上部队在水域hex间移动cost
const NAVAL_AP = 4;          // 水上部队每旬AP
const WATER_TERRAINS = new Set(['water','river']);

/** 判断hex是否为可通行水域 */
function isWaterHex(col, row) {
  const t = HEX_TERRAIN[hkey(col, row)] || 'plain';
  return WATER_TERRAINS.has(t);
}

/** 判断部队当前是否在水域 */
function isUnitOnWater(unit) {
  if(!unit) return false;
  return isWaterHex(unit.hq ?? 0, unit.hr ?? 0);
}

/** 获取hex移动消耗。isOnWater=true时水域间移动用NAVAL_WATER_COST */
function getHexMoveCost(col, row, troopType, isOnWater) {
  const k = hkey(col, row);
  const terrain = HEX_TERRAIN[k] || 'plain';
  if (terrain === 'impassable' || terrain === 'deep_water' || terrain === 'coastal_water') return 999;
  // 水上部队在水域间移动cost=2
  if (isOnWater && WATER_TERRAINS.has(terrain)) return NAVAL_WATER_COST;
  let cost = TERRAIN_AP_COST[terrain] || 1;
  // 道路减半（向下取整最小0.5）
  if (HEX_ROAD[k]) cost = Math.max(0.5, cost * 0.5);
  // 攻城器械非平原额外慢（水域除外——入水后都是船）
  if (troopType === 'siege' && terrain !== 'plain' && !HEX_ROAD[k] && !WATER_TERRAINS.has(terrain)) cost = Math.min(cost * 2, 8);
  return cost;
}

/** 获取hex地形类型（兼容旧 getTerrainAt 接口）*/
function getTerrainAt(col, row) {
  return HEX_TERRAIN[hkey(col, row)] || 'plain';
}
// ═══════════════════════════════════════════════════════
// Hex 移动系统工具函数
// ═══════════════════════════════════════════════════════

/** 获取部队当前所在节点ID（城市ID或null）*/
function getUnitNodeId(unit) {
  const k = hkey(unit.hq ?? 0, unit.hr ?? 0);
  return HEX_CITY[k] || null;
}

/** 两部队是否接触（同hex或相邻hex）*/
function unitsContact(a, b) {
  const d = hexDist(a.hq ?? 0, a.hr ?? 0, b.hq ?? 0, b.hr ?? 0);
  return d <= 1; // 同格或相邻
}

/** 城市ID → hex坐标 */
function cityToGrid(cityId) {
  const c = CITY_MAP[cityId];
  if (!c) return { hq: 0, hr: 0 };
  return { hq: c.q, hr: c.r };
}

// ════════════════════════════════════════════════════════════════════
// ── M10 寻路 (v181 L2405-L2521) ──
// ════════════════════════════════════════════════════════════════════

function calcHexPathCost(hexPath, troopType, startOnWater) {
  if (!hexPath || hexPath.length === 0) return 0;
  let total = 0;
  let onWater = !!startOnWater;
  for (const h of hexPath) {
    total += getHexMoveCost(h.col, h.row, troopType, onWater);
    // 走完该格后的水域状态——下一格 cost 时使用
    onWater = WATER_TERRAINS.has(HEX_TERRAIN[hkey(h.col, h.row)] || 'plain');
  }
  return total;
}

/** 寻找最近己方城市路径 */
function findNearestOwnCityPath(fromId, fac) {
  const fromCity = CITY_MAP[fromId];
  if (!fromCity) return null;
  let best = null, bestCost = Infinity;
  Object.values(G.cities).filter(c => c.fac === fac).forEach(c => {
    const cdef = CITY_MAP[c.id];
    if (!cdef) return;
    const result = hexAstar(fromCity.q, fromCity.r, cdef.q, cdef.r, 'light', fac);
    if (result && result.cost < bestCost) {
      bestCost = result.cost;
      best = { path: [fromId, c.id], city: c, cost: result.cost, hexPath: result.path };
    }
  });
  return best;
}

/** 寻路包装：返回hex路径 */

// ★ v154fix H1: 二叉最小堆——替代Array.sort()+shift()，A*性能O(n log n)→O(n log n)总计
class _MinHeap {
  constructor(){ this._d = []; }
  get length(){ return this._d.length; }
  push(node){
    this._d.push(node);
    let i = this._d.length - 1;
    while(i > 0){
      const p = (i - 1) >> 1;
      if(this._d[p].f <= this._d[i].f) break;
      [this._d[p], this._d[i]] = [this._d[i], this._d[p]];
      i = p;
    }
  }
  pop(){
    const top = this._d[0];
    const last = this._d.pop();
    if(this._d.length > 0){
      this._d[0] = last;
      let i = 0;
      while(true){
        let s = i, l = 2*i+1, r = 2*i+2;
        if(l < this._d.length && this._d[l].f < this._d[s].f) s = l;
        if(r < this._d.length && this._d[r].f < this._d[s].f) s = r;
        if(s === i) break;
        [this._d[s], this._d[i]] = [this._d[i], this._d[s]];
        i = s;
      }
    }
    return top;
  }
}

// ─── Hex A* 寻路（★ v154fix: 用MinHeap替代sort+shift） ───
function hexAstar(startCol, startRow, endCol, endRow, troopType, unitFac) {
  const sk = hkey(startCol, startRow), ek = hkey(endCol, endRow);
  if (sk === ek) return { path: [{ col: startCol, row: startRow }], cost: 0 };

  const open = new _MinHeap();
  open.push({ col: startCol, row: startRow, f: 0, g: 0 });
  const gScore = { [sk]: 0 };
  const cameFrom = {};
  const closed = new Set();

  while (open.length) {
    const cur = open.pop();
    const ck = hkey(cur.col, cur.row);
    if (ck === ek) {
      // 回溯路径
      const path = [{ col: endCol, row: endRow }];
      let k = ek;
      while (cameFrom[k]) {
        const prev = hparse(cameFrom[k]);
        path.unshift(prev);
        k = cameFrom[k];
      }
      return { path, cost: gScore[ek] };
    }
    if (closed.has(ck)) continue;
    closed.add(ck);

    for (const nb of hexNeighbors(cur.col, cur.row)) {
      const nk = hkey(nb.col, nb.row);
      if (closed.has(nk)) continue;
      const _curIsWater = WATER_TERRAINS.has(HEX_TERRAIN[ck] || 'plain'); // ★ v138
      const moveCost = getHexMoveCost(nb.col, nb.row, troopType, _curIsWater);
      if (moveCost >= 999) continue; // 不可通行
      // ★ v102: 非己方城市hex不可穿越（除非是终点——围城目的地）
      if (unitFac && nk !== ek) {
        const cid = HEX_CITY[nk];
        if (cid) {
          const cc = G.cities[cid];
          if (cc && cc.fac !== unitFac && cc.fac !== 'none') continue;
        }
      }
      const tentG = gScore[ck] + moveCost;
      if (tentG < (gScore[nk] ?? Infinity)) {
        gScore[nk] = tentG;
        cameFrom[nk] = ck;
        const h = hexDist(nb.col, nb.row, endCol, endRow); // 启发式
        open.push({ col: nb.col, row: nb.row, f: tentG + h, g: tentG });
      }
    }
  }
  return null; // 不可达
}
