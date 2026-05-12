// src/core/main.js
//
// 启动层 — 游戏初始化 + 剧本入口。
//
// 来源:从 project_romance_v181.html 抽离(Session 3.4 / 阶段 3,选项 C)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
//
// ── 抽离范围(选项 C,经制作人 approve)──
//   M1 `initGame()`     v181 L5622-L5969    游戏状态初始化(整个 G 重写,348 行)
//   M2 `startAs(fid)`   v181 L30045-L30052  选剧本入口,调 initGame()
//
// ── 留 v181(选项 C 不抽,后续 sub-session 处理)──
//   M3 `showTitleScreen()`  L29186-L29211  标题菜单 UI
//   M4 `backToTitle()`      L29237-L29279  返回标题,reset 20+ top-level lets
//                                          (**carry-over**:各 chain 阶段 3.5-3.12 抽
//                                          自家 mechanism let 时,需要同步处理这里
//                                          对应的 reset 行)
//   M5 顶层 boot call `showTitleScreen()`(L31571,主 inline script 末尾 1 行)
//                                          — 留 v181 避免跨 script 解析期 race
//   M6 `_exitGame()` / `_checkSavesForTitle()`  L29213-L29236  UI helper
//   顶层 lets 全部留 v181(`_unitIdCounter / 各 cache lets / 各 render lets`)
//
// ── 接口风格 ──
// 全局函数(同 v181 + 已抽 src/data/ + src/core/state.js / helpers.js / hubs.js
// / claude_ai.js / tick.js + src/render/ 模块共享 hoisted function 全局可见,
// 无 import/export)。
//
// ── 反向调用(已 approve 设计原则 (c) 副作用通道)──
// initGame 调用大量 v181 留下的 chain 初始化:
//   - 数据 / 常量(部分已抽 src/data/):FAC / GENS_FULL / CITIES_DEF / DIPLO_INIT
//     / TECH_PREUNLOCK / FAC_IDENTITY / FOUNDING_CORE / RETAINER_PRESET
//     / RETAINER_LEVEL / INTIMACY_PRESET / ETHOS_INIT / MERIT_INIT / GEN_TAGS
//     / GENS_FULL / ALL_GENS / getScenarioFactions() / ALL_POSTS / WILD_GENS / CITY_MAP
//     / STATE_TO_GENTRY_FAC
//   - chain primitive: garrisonCap / _deepCloneGen / createUnit / getInitLevel
//     / getGenMeta / addGenChronicle / setIntimacy / refreshWildPool
//     / initCityGentry / initFog / _rebuildGEN_MAP / calcUnitAP / setRetainers
//     / updateFacStats / buildHexTerrain / renderAll / log
//   - 顶层 lets(留 v181): G(状态根)/ _unitIdCounter / _pendingPeaceOffer
//     / _pendingVassalOffer
// 同 phase 2/3.2/3.3/tick.js 反向调用模式,(c) 已 approve。
//
// ── plan §二偏离记录(同前)── 同 docs/phase3_4_notes §二。

function initGame(scenarioId){
  // 1b-1: scenario materialize + sync top-level FAC/getScenarioFactions()/PLAYABLE_FACS/FAC_IDENTITY/ETHOS_INIT/DIPLO_INIT
  // (src/core/scenario_loader.js); 守底 invariant: sync 后值 ≡ 原 src/data/factions.js literal
  applyScenario(scenarioId || '214');
  G.turn=1; G.year=0; G.seasonIdx=0; // 重置回合计数
  getScenarioFactions().forEach(fid=>{
    G.factions[fid]={res:{gold:0,wood:2000,iron:1400,horses:4000},cityCount:0,totalTroops:0,totalPop:0, // ★ v145: 木铁砍~55%，马匹1:1消耗体系
      taxId:'norm',    // ★ 每势力独立赋税
      policyId:'bal',  // ★ 每势力独立补员政策
      corveeId:'low',  // ★ v163: 徭役档位
      strategist:null, // ★ 军师职位（武将名|null），影响计谋成功率
    };
  });
  // ★ C1 叛乱势力：永久存在，无限资源（叛军不受粮饷约束）
  G.factions['rebel']={res:{gold:99999999,wood:99999999,iron:99999999,horses:99999999},
    cityCount:0,totalTroops:0,totalPop:0,taxId:'norm',policyId:'bal',corveeId:'low',_salaryDebt:0,_salaryDebtTurns:0};
  // ★ v179fix P14: 君主名进 G（FAC.ruler 是剧本初值常量；继任后写 G.factionRulers，序列化才能保住）
  G.factionRulers = {};
  getScenarioFactions().forEach(fid => { G.factionRulers[fid] = getFactionDef(fid).ruler; });
  // 初始金钱 — v111: 砍半，避免开局瞎征兵后期维持不了；蜀国+2000补偿官职负担
  G.factions.wei.res.gold=10000;
  G.factions.shu.res.gold=8000;
  G.factions.wu.res.gold=8000;
  G.factions.nanman.res.gold=1500; // ★ v144: 南蛮贫困
  // ★ v145: 木材/铁矿初始储备差异化
  G.factions.shu.res.wood=2400;    // 蜀产木优势
  G.factions.wu.res.wood=2800;     // 吴多港口产木
  G.factions.wu.res.iron=1000;     // 吴铁矿匮乏
  G.factions.nanman.res.wood=1000; // ★ v144→v145: 南中产木但贫困
  G.factions.nanman.res.iron=650;  // ★ v145: 南蛮铁匮乏
  // ★ v115: 科技树初始化
  getScenarioFactions().forEach(fid => {
    const preunlock = TECH_PREUNLOCK[fid] || [];
    G.factions[fid]._tech = {
      researched: new Set(preunlock),
      current: null,
    };
  });
  // ★ v145: 马匹初始储备（1:1消耗体系）— 默认4000(魏), 蜀/吴/蛮差异化
  G.factions.shu.res.horses=2500;
  G.factions.wu.res.horses=300;
  G.factions.nanman.res.horses=200;

  CITIES_DEF.forEach(c=>{
    // ★ 核心变更：每城初始化独立存粮 storage
    // ★ v136: 初始存粮从20旬→10旬，开局即有粮草紧迫感
    const initStorage = c.pop * 0.0004 * 10 + c.troops * 0.0012 * 10; // v107: pop×5, 费率÷5
    G.cities[c.id]={...c,
      storage: Math.floor(initStorage),   // ★ 城市级存粮
      popQuality:65+Math.floor(Math.random()*20),
      morale:70+Math.floor(Math.random()*18),
      buildings:{},buildQueue:[],transferCD:0,occupied:0,siegeDecay:0,prefect:null,gentry:50,
      garrison:0, // 先置0，下面用garrisonCap()设满
    };
  });
  // 开局城防军满编
  Object.values(G.cities).forEach(city=>{ city.garrison=garrisonCap(city); });
  // ★ v144: 建宁(南中)：南蛮据点，低民心+半存粮，体现边陲蛮荒
  if(G.cities.jianning){ G.cities.jianning.morale=25; G.cities.jianning.storage=Math.floor(G.cities.jianning.storage*0.5); }
  // ★ v143: 延迟出场机制 — 有minTurn的武将暂不加入，放入待出场池
  G.genPendingPool = [];
  Object.keys(GENS_FULL).forEach(fid=>{
    const immediate = [];
    GENS_FULL[fid].forEach(g => {
      if(g.minTurn && g.minTurn > 1){
        G.genPendingPool.push({..._deepCloneGen(g), _pendingFac: fid}); // ★ v155fix P0: 深拷贝含apt
      } else {
        immediate.push(_deepCloneGen(g)); // ★ v155fix P0: 深拷贝含apt
      }
    });
    G.generals[fid] = immediate;
  });
  Object.entries(getDiploInit()).forEach(([k,v])=>{
    G.diplo[k]={...v};
    const [a,b]=k.split('-');
    G.diplo[`${b}-${a}`]={...v};
  });
  G.supplyLines={};
  G.foodAlertCards=[];
  G.units=[];
  // 外交冷却期（格式：_diploCD_facA_facB，值为剩余旬数）
  // 动态挂在G对象上，initGame时清除所有旧CD
  getScenarioFactions().forEach(a=>getScenarioFactions().forEach(b=>{
    if(a!==b) G[`_diploCD_${a}_${b}`]=0;
  }));
  _pendingPeaceOffer  = null;
  _pendingVassalOffer = null;
  G.reputation = { wei:45, shu:80, wu:60, nanman:30 }; // C3 信誉度重置（v144: +nanman）
  // ★ C3 宣称系统初始化
  G.emperor = { cityId:'ye', holder:'wei' }; // 天子在邺城
  G.claims = {};     // 宣称准备记录 'fid-target': {type, prepTurns, ready, usedTurn}
  G.cityHistory = {}; // 城市易手追踪 cityId: {takenBy, fromFac, turn}
  G.feuds = {};       // 血仇记录 'fid-target': {reason, turn}
  // 1c-a: 1b-1 P3 close — 旧 v172 hardcoded reset 已 redundant (applyScenario 顶部 sync 同样值).
  // 旧代码 12 行 (FAC_IDENTITY.wei.type='emperor_holder' / .stage='regime' / .anchorState=null etc.) 全删,
  // SCENARIO_214.factions[fid] 是唯一 authority. 后续 scenarios 自然支持 (不再 wei/shu/wu/nanman 硬编码).
  // ★ 计谋系统CD初始化
  G.strategyCD = {};
  G.scoutReveals = []; // ★ v116: 细作探报持续效果 [{fid, cityId, expiresAt}]
  G._tradeCD = {}; // ★ v164: 互市冷却 {fid_target: expiresAtTurn}
  G._tradeAgreements = []; // ★ v165: 通商协定 [{factions:['a','b'], since:turn}]
  G._migratedThisTurn = false; // ★ v166: 迁民每旬限制
  getScenarioFactions().forEach(fid => {
    G.strategyCD[fid] = { driveWolf:0, twoTigers:0, spy:0, rumor:0, scout:0, envoy:0 };
  });
  // ★ B1 派系政治系统初始化
  G.genJoinTurn = {};
  G.genJoinSource = {};
  G.genOrigRole = {};   // ★ v71
  G.genOrigFac = {};    // ★ v71
  G.genFactionMod = {};
  G.genFactionModLog = {}; // ★ v94: 派系事件日志
  G._warClaimStrength = {}; // ★ v113: 宣称强度追踪
  // ★ v151: 价值观系统初始化
  getScenarioFactions().forEach(fid => {
    G.factions[fid].ethos = {...(getEthos(fid) || {mandate:0,power:0,civil:0,military:0,strategy:0})};
    G.factions[fid]._ethosLog = [];
    G.factions[fid]._ethosSnap = {};
  });
  G.genStatExp = {};    // ★ D3: 属性经验 {genName: {com,war,int,pol}}
  G.genStatBase = {};   // ★ D3: 属性初始值快照 {genName: {com,war,int,pol}}
  G.genAptExp = {};     // ★ D3: 适性经验 {genName: {cavalry,light,...}}
  // 开局将领：核心创始人标记 'founding'，其余为 'member'（老臣/同僚）
  getScenarioFactions().forEach(fid => {
    const coreSet = FOUNDING_CORE[fid] || new Set();
    (G.generals[fid]||[]).forEach(gen => {
      G.genJoinTurn[gen.name] = 0;
      G.genJoinSource[gen.name] = coreSet.has(gen.name) ? 'founding' : 'member';
      G.genOrigRole[gen.name] = gen.role;   // ★ v71 记录开局原role
      G.genOrigFac[gen.name]  = fid;        // ★ v71 记录开局原势力
    });
  });
  G.selUnitId=null;
  _unitIdCounter=1;
  updateFacStats();
  buildHexTerrain();

  // ── 初始野战部队 ──────────────────────────────────────
  // ★ v120: 缩编初始部队——逼迫发展期，需征兵才能扩军
  // 魏3支(~30k) / 蜀2支(~16.5k) / 吴2支(~16k)，大部分武将为闲将
  const initUnits=[
    // ═══ 魏国 3支 ═══ (总野战兵力~17,000)
    // 中枢亲卫 — 许昌
    {fac:'wei', city:'xuchang',  squads:[
      {genName:'曹操',  type:'cavalry', troops:3000, maxTroops:3000, morale:88},
      {genName:'许褚',  type:'heavy',   troops:2500, maxTroops:2500, morale:85},
    ]},
    // 南线守备 — 南阳
    {fac:'wei', city:'nanyang',  squads:[
      {genName:'曹仁',  type:'heavy',   troops:3500, maxTroops:3500, morale:85},
      {genName:'满宠',  type:'archer',  troops:2000, maxTroops:2000, morale:80},
    ]},
    // 东线守备 — 下邳
    {fac:'wei', city:'xiapi',    squads:[
      {genName:'张辽',  type:'cavalry', troops:3500, maxTroops:3500, morale:88},
      {genName:'乐进',  type:'light',   troops:2500, maxTroops:2500, morale:82},
    ]},

    // ═══ 蜀国 2支 ═══ (总野战兵力~10,500)
    // 后方亲卫 — 成都
    {fac:'shu', city:'chengdu',  squads:[
      {genName:'赵云',  type:'cavalry', troops:3000, maxTroops:3000, morale:88},
      {genName:'张翼',  type:'light',   troops:2000, maxTroops:2000, morale:78},
    ]},
    // 荆州守备 — 襄阳
    {fac:'shu', city:'xiangyang',squads:[
      {genName:'关羽',  type:'light',   troops:3500, maxTroops:3500, morale:90},
      {genName:'廖化',  type:'cavalry', troops:2000, maxTroops:2000, morale:80},
    ]},

    // ═══ 吴国 2支 ═══ (总野战兵力~12,000)
    // 首都守备 — 建业
    {fac:'wu',  city:'jianye',   squads:[
      {genName:'吕蒙',  type:'light',   troops:3500, maxTroops:3500, morale:88},
      {genName:'程普',  type:'heavy',   troops:2500, maxTroops:2500, morale:80},
    ]},
    // 北线守备 — 合肥
    {fac:'wu',  city:'hefei',    squads:[
      {genName:'甘宁',  type:'cavalry', troops:3500, maxTroops:3500, morale:85},
      {genName:'凌统',  type:'light',   troops:2500, maxTroops:2500, morale:82},
    ]},
  ];
  initUnits.forEach(({fac,city,squads})=>{
    const u=createUnit({fac,spawnCityId:city,squads});
    if(u){
      const spawnCity = G.cities[city];
      u.level = getInitLevel(spawnCity);
      u.exp=0; u.mobilizingTurns=0; G.units.push(u);
    }
  });
  // ──────────────────────────────────────────────────────

  // ── 初始化武将小传和忠诚度 ──
  G.genChronicle={};
  G.genLoyalty={};
  G.loyaltyAccum={};
  G.recruitableGens={};
  G.wildPool=[];
  G.wildPoolTurn=0;
  G.wildRecruitCD={};
  // ── 亲密度系统初始化 ──
  G.intimacy={};
  G.intimacyNotified={};
  G.genWounded={};        // { [name]: untilTurn }，重伤CD（WOUNDED_CD旬），war/int×0.8
  G._pendingPrisoners=[]; // 待处置俘虏队列
  G.genWinCount={};       // v127 韩当·从征：per-general战胜计数器
  // ★ v164: 部曲系统初始化（{count, type}结构）
  G.genRetainers={};
  Object.entries(RETAINER_PRESET).forEach(([name, preset]) => {
    G.genRetainers[name] = { count: preset.count, type: preset.type };
  });
  // ★ v130: 事件系统初始化
  G._eventCooldown={};     // {eventId: 剩余冷却旬数}
  G._eventCatCooldown={};  // {category: 剩余冷却旬数}
  G._eventPromises=[];     // [{genName,type,promisedAt,deadline,penalty}]
  G._eventFired={};        // ★ v131: 一次性事件触发记录 {eventId: turn}
  G._eventQueue=[];        // 本旬排队事件 [{def,fid,ctx}]
  G._cityChangeLog=[];     // ★ v132: 城市易手记录 [{turn,cityId,from,to}]
  G._pendingEvent=null;    // 当前阻塞弹窗事件
  G._poachVulnerable={};   // B3④挖角脆弱标记 {genName:{threshold}}
  G._factionLoyaltyDecay={}; // C2④派系忠诚持续衰减 {facId_fid:{perTurn,remaining}}
  // ★ D1 官职系统初始化
  G.genMerit = {};        // { [name]: number }，功绩值
  G.genPost  = {};        // { [name]: postName }，当前官职名
  // ★ v95: 开局预填 tier 1 & 2 官职（直接写 G.genPost，不触发忠诚+8和派系事件）
  const INIT_POSTS = {
    wei: {
      '夏侯惇':'大将军', '张辽':'前将军', '曹仁':'后将军', '于禁':'左将军', '徐晃':'右将军',
      '荀彧':'丞相', '荀攸':'尚书令', '司马懿':'侍中', '陈群':'太常', '程昱':'光禄勋',
    },
    shu: {
      '关羽':'大将军', '张飞':'前将军', '赵云':'后将军', '马超':'左将军', '黄忠':'右将军',
      '诸葛亮':'丞相', '法正':'尚书令', '蒋琬':'侍中', '费祎':'太常', '董允':'光禄勋',
    },
    wu: {
      '周瑜':'大将军', '吕蒙':'前将军', '甘宁':'后将军', '黄盖':'左将军', '陆逊':'右将军',
      '张昭':'丞相', '鲁肃':'尚书令', '顾雍':'侍中', '诸葛瑾':'太常', '步骘':'光禄勋',
    },
  };
  Object.entries(INIT_POSTS).forEach(([fid, mapping]) => {
    Object.entries(mapping).forEach(([genName, postName]) => {
      if((G.generals[fid]||[]).some(g=>g.name===genName) && ALL_POSTS.find(p=>p.name===postName)){
        G.genPost[genName] = postName;
      }
    });
  });
  // 初始功绩赋值
  ALL_GENS.forEach(g=>{ G.genMerit[g.name] = MERIT_INIT[g.name] || 20; });
  getAllWildGenDefs().forEach(g=>{ G.genMerit[g.name] = MERIT_INIT[g.name] || 10; });
  INTIMACY_PRESET.forEach(([a,b,v])=>setIntimacy(a,b,v));
  refreshWildPool(); // 游戏开始时生成初始在野武将池
  ALL_GENS.forEach(g=>{
    G.genChronicle[g.name]=[];
    const meta=getGenMeta(g.name);
    G.genLoyalty[g.name]=meta?.loyalty??80;
    G.loyaltyAccum[g.name]=G.genLoyalty[g.name]; // ★ v119fix: 初始化时同步loyaltyAccum
    // ★ v94: 开局小传——补齐身份标签（创始/宗亲/士族/寒门等）
    const fid=Object.keys(GENS_FULL).find(f=>GENS_FULL[f].some(x=>x.name===g.name));
    const facName={wei:'魏',shu:'蜀',wu:'吴',nanman:'南蛮'}[fid]||fid;
    const birthplace=meta?.birthplace||'';
    const values=meta?.values||[];
    const tags=GEN_TAGS[g.name]||{};
    // 身份标签
    const identParts=[];
    const coreSet=FOUNDING_CORE[fid]||new Set();
    if(coreSet.has(g.name)) identParts.push('创始元勋');
    if(meta?.clan){
      const ruler=(GENS_FULL[fid]||[]).find(x=>x.role==='ruler');
      const rulerMeta=ruler?getGenMeta(ruler.name):{};
      if(rulerMeta?.clan && meta.clan===rulerMeta.clan) identParts.push('宗亲');
    }
    if(tags.origin==='gentry'){
      // v172: 按士族派系标签显示（含东州/淮泗等客居集团）
      const GFAC_NAMES={
        gentry_zhongyuan:'中原士族', gentry_hebei:'河北士族', gentry_xuzhou:'徐州士族',
        gentry_jingzhou:'荆州士族', gentry_yizhou:'益州士族', gentry_jiangdong:'江东士族',
        gentry_xiliang:'西凉士族', gentry_dongzhou:'东州派', gentry_huaisi:'淮泗派',
      };
      let _gfac;
      if(tags.clique === 'dongzhou') _gfac = 'gentry_dongzhou';
      else if(tags.clique === 'huaisi') _gfac = 'gentry_huaisi';
      else _gfac = STATE_TO_GENTRY_FAC[tags.state] || 'gentry_zhongyuan';
      if(GFAC_NAMES[_gfac]) identParts.push(GFAC_NAMES[_gfac]);
    } else if(tags.origin==='humble') identParts.push('寒门出身');
    else if(tags.origin==='magnate') identParts.push('地方豪族');
    else if(tags.origin==='noble') identParts.push('旧阀贵族');
    else if(tags.origin==='foreign') identParts.push('外族出身');
    const combatDesc={hawk:'主战',dove:'持重',neutral:''}[tags.combat]||'';
    if(combatDesc) identParts.push(combatDesc);
    const _temperDesc={proud:'性傲',reckless:'性莽',steady:'性沉稳',cunning:'性狡黠',steadfast:'性刚毅',generous:'性仁厚'}[tags.temperament]||'';
    if(_temperDesc) identParts.push(_temperDesc);
    const identStr=identParts.length?`，${identParts.join('、')}`:'';
    // 性格描述 ★ v124: 只保留有gameplay效果的标签
    const VALUE_DESC={
      '汉室死忠':'心系汉祚，誓扶炎刘',
      '忠义':'忠义之士，逆境不屈',
      '野心':'深藏不露，志在四方',
      '投机':'善审时势，进退灵便',
    };
    const valDesc=values.filter(v=>VALUE_DESC[v]).map(v=>VALUE_DESC[v]).join('，');
    const birthStr=birthplace?`，籍贯${birthplace}`:'';
    const valStr=valDesc?`。${valDesc}`:'';
    addGenChronicle(g.name,`仕于${facName}${identStr}${birthStr}${valStr}。`);
  });

  updateFacStats();
  initCityGentry(); // ★ I2 豪族支持系统初始化
  initFog(); // ★ C4 迷雾系统初始化
  // ★ v155fix P0: 重建GEN_MAP指向G.generals中的活跃对象（必须在generals完全初始化后）
  _rebuildGEN_MAP();
  // ★ v99: 初始化全部队AP
  G.units.forEach(u => {
    u._apRemaining = calcUnitAP(u);
  });
  // ★ v164: 闲置武将的部曲→国都billetPool（开局时有部曲但未编入unit的武将）
  {
    const deployedGens = new Set();
    G.units.forEach(u => u.squads.forEach(sq => { if(sq.genName) deployedGens.add(sq.genName); }));
    Object.entries(G.genRetainers).forEach(([genName, retData]) => {
      if(deployedGens.has(genName)) return; // 已出战，不处理
      const count = typeof retData === 'object' ? retData.count : retData;
      const type = typeof retData === 'object' ? retData.type : (RETAINER_PRESET[genName]?.type || null);
      if(!count || count <= 0 || !type) return;
      // 找该武将所属势力的国都
      let ownerFac = null;
      for(const [fid, gens] of Object.entries(G.generals)){
        if(gens.some(g => g.name === genName)){ ownerFac = fid; break; }
      }
      if(!ownerFac) return;
      const capital = Object.values(G.cities).find(c => c.fac === ownerFac && CITY_MAP[c.id]?.isCapital);
      if(!capital) return;
      capital.billetPool = capital.billetPool || [];
      capital.billetPool.push({
        id: 'bp_0_' + Math.random().toString(36).slice(2,6),
        troops: count, maxTroops: count,
        type: type, level: RETAINER_LEVEL, billetTurn: 0,
        readyTurn: 0,
        genName: genName, // 绑定武将
      });
      // ★ v167fix: 数据转入仓库后清零户口本（防止双写）
      setRetainers(genName, 0);
    });
  }
  renderAll();
  log('⚔ 建安十九年，刘备入蜀，三分天下之势渐成','event');
  log('📜 关羽镇守荆州，北伐之志蓄势待发','event');
}

function startAs(fid){
  G.playerFac = fid;
  G.selFac = fid;
  const overlay = document.getElementById('factionSelectOverlay');
  if(overlay) overlay.remove();
  initGame();
  if(!G.tutorialDone) showTutorial();
}
