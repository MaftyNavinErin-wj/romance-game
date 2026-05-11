// src/render/boot_screens.js
//
// 渲染层(R)— 启动 / 标题 / 教程 / 帮助 / 存读档 / 结局 / Claude AI 配置 modal。
//
// 来源:从 project_romance_v181.html 抽离(Phase 4 / Sub-session 4.5)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation),phase4_plan.md 决策 1 = A 风格 verbatim 直读 G。
//
// ── 抽离决策 ──
// boot/title/tutorial/save panel/gameEnd/AI config 都是"游戏主循环外"的 UI/modal,
// isolated 于主 game loop. 4.5 把这些散布在 v181 后段的 modal cluster 全归到本文件.
//
// ── 抽离范围(3 段)──
//   R4.5.a 标题 + 剧本选择              v181 L10217-L10353 (~137 行, 6 funcs)
//                                        showTitleScreen / _checkSavesForTitle / _exitGame /
//                                        backToTitle / showScenarioSelect / onScenarioSelect
//   R4.5.b 帮助 + 教程 + 势力 + 存读档    v181 L10354-L11250 (~897 行, 2 const + 多 lets + 多 funcs)
//                                        TAB_HELP (data const) + showTabHelp / closeTabHelp /
//                                        _tabHelpHtml + TUT_PAGES (data const) + tutorial 6 funcs +
//                                        showFactionSelect + saveLoad 8 funcs
//   R4.5.c 结局 + Claude AI UI         v181 L11555-L11985 (~431 行, 1 + 9 funcs)
//                                        showGameEndOverlay + Claude AI cluster
//                                        (toggleClaudeAI / _showApiKeyModal / _populateApiModal /
//                                         _onModelSelectChange / _onApiFormatChange / _confirmApiKey /
//                                         _updateAIToggleBtn / enableClaudeAI / disableClaudeAI /
//                                         pingClaudeAPI)
//
// 函数总数: 6 + ~14 + 10 = **~30 函数 + 2 大 data const + ~3 lets**
//
// ── 留 v181 ──
//   showTitleScreen() 顶层 boot call (L11987 v181 当前) — boot orchestration 入口, 留 v181 页面加载点
//   runIntegrityAudit / checkElimination (L11252+) — 完整性审计 + 胜负检查, 不属 boot UI, 留 v181
//
// ── 写口归属声明 ──
// **本文件主要写口**:
//   - DOM (#titleScreen / #scenarioScreen / #factionSelectOverlay / #tutOverlay /
//          #saveOverlay / #gameEndOverlay / #apiKeyModal 等 overlay/modal HTML innerHTML)
//   - DOM body.appendChild / classList.toggle
//   - tutorial state lets (_tutPage / _tutHighlighted)
//   - save panel state lets (_saveLoadMode / _saveLoadSelSlot)
//   - _claudeAI (Claude AI config state, 跨多 chain 共享)
//
// **跨链读取/调用**:
//   - _store / SAVE_KEY_PREFIX (存档 IDB)
//   - G.playerFac / G.factions / G.cities / G.turn / G.units / FAC (read)
//   - calcFactionInfluence / aiDoBuild / various game systems (read for game end stats)
//   - clearAllPostsByGen 等 (chain helper, called from save/load reset paths)

// ── 标题主菜单 ──────────────────────────────────────
function showTitleScreen(){
  // 移除可能存在的旧overlay
  document.getElementById('titleScreen')?.remove();
  document.getElementById('factionSelectOverlay')?.remove();
  document.getElementById('scenarioScreen')?.remove();

  const el = document.createElement('div');
  el.id = 'titleScreen';
  el.className = 'title-screen';

  // 检查是否有存档（异步，先渲染按钮为disabled，加载完后启用）
  el.innerHTML = `
    <div class="ts-title">三国·苍生问策</div>
    <div class="ts-sub">Project Romance</div>
    <div class="ts-menu">
      <button class="ts-btn primary" onclick="showScenarioSelect()">開始新遊戲</button>
      <button class="ts-btn" id="tsLoadBtn" onclick="showSaveLoadPanel('load-title')" disabled>讀取存檔</button>
      <button class="ts-btn" onclick="_exitGame()" style="font-size:12px;letter-spacing:3px;color:var(--ink-ll)">退出遊戲</button>
    </div>
    <div style="position:absolute;bottom:24px;color:rgba(92,74,50,.25);font-size:9px;letter-spacing:2px">v179 · 三国·苍生问策</div>
  `;
  document.body.appendChild(el);

  // 异步检查存档
  _checkSavesForTitle();
}

async function _checkSavesForTitle(){
  try {
    const slots = await _getSaveSlots();
    const hasAny = slots.some(s => s.exists);
    const btn = document.getElementById('tsLoadBtn');
    if(btn){
      btn.disabled = !hasAny;
      if(!hasAny) btn.title = '暂无存档';
    }
  } catch(e){
    // storage不可用，按钮保持disabled
  }
}

function _exitGame(){
  if(confirm('确定退出游戏？')){
    window.close();
    // 如果window.close无效（非脚本打开的窗口），给提示
    setTimeout(() => {
      alert('请手动关闭此标签页。');
    }, 300);
  }
}

function backToTitle(){
  // ★ v154fix M3: 清理document级事件监听器，防止累积
  if(window._mapDocMouseMove) { document.removeEventListener('mousemove', window._mapDocMouseMove); window._mapDocMouseMove = null; }
  if(window._mapDocMouseUp) { document.removeEventListener('mouseup', window._mapDocMouseUp); window._mapDocMouseUp = null; }
  document.removeEventListener('keydown', _onDocKeydown);
  // 清理游戏地图
  const mr = document.getElementById('mapRoot');
  if(mr) mr.remove();
  invalidateCityCache();
  invalidateFogCache();
  // ★ v150fix BUG7: 清理模块级残留状态，防止污染新游戏
  _battleReports = [];
  _pendingBattleConfirms = [];
  _pendingSiegeArrival = null;
  _currentBattleReport = null;
  _currentBattleConfirm = null;
  _marchAnimating = false;
  _fastForward = false;
  _supplyCache = {};
  _techEffectCache = {}; _techEffectCacheTurn = -1;
  _deployedGensMoraleCache = null;
  _ovTerritoryCache = null; _ovTerritoryTurn = -1;
  _activeOverlay = null;
  window._pendingCourtCouncil = null;
  _duelChallenger = null;
  _pendingPeaceOffer = null;
  _pendingVassalOffer = null;
  _statsHistory.length = 0;
  // ★ v179fix P50: 统一清理所有活跃 modal，防止旧游戏弹窗叠加到新游戏
  // 静态 DOM modal — display:none（HTML 内 grep 确认存在）
  ['battleModal', 'genericModal', 'courtModal', 'battleConfirmModal', 'recruitModal', 'eventModal', 'aiKeyModal'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  // 动态创建 modal — remove（每次开都新建）
  ['ceremonyModal', 'postModal', 'prisonerModal', 'siegeArrivalModal', '_envoyModal'].forEach(id => {
    document.getElementById(id)?.remove();
  });
  // ★ v150fix A4+A5: 地图/overlay SVG缓存（loadFromSlot有清但backToTitle遗漏）
  _staticMapCache = '';
  _ovBaseCache = null; _ovBaseTurn = -1;
  showTitleScreen();
}

// ── 剧本选择 ──────────────────────────────────────
function showScenarioSelect(){
  document.getElementById('titleScreen')?.remove();
  document.getElementById('scenarioScreen')?.remove();

  const el = document.createElement('div');
  el.id = 'scenarioScreen';
  el.className = 'scenario-screen';

  el.innerHTML = `
    <div style="font-family:'ZCOOL XiaoWei','Noto Serif SC',serif;font-size:20px;color:var(--ink);letter-spacing:6px;margin-bottom:6px">選擇劇本</div>
    <div style="font-size:10px;color:var(--ink-ll);letter-spacing:2px;margin-bottom:36px">请选择战役剧本开始游戏</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;margin-bottom:36px">
      <div class="scenario-card" onclick="onScenarioSelect('default')">
        <div class="sc-badge">默认剧本</div>
        <div style="font-family:'ZCOOL XiaoWei','Noto Serif SC',serif;font-size:22px;color:var(--ink);letter-spacing:4px;margin-bottom:8px">三國鼎立</div>
        <div style="font-size:11px;color:var(--gold);letter-spacing:1px;margin-bottom:12px">建安十九年 · 公元214年</div>
        <div style="font-size:9px;color:rgba(44,36,22,.55);line-height:1.9;margin-bottom:14px">
          刘备称汉中王，关羽镇守荆州，三国鼎立之势已成。<br>
          曹魏雄踞中原，兵多将广；蜀汉以义聚人，奇谋制胜；<br>
          东吴坐拥江东，水师天下无双。天下归属，在此一搏。
        </div>
        <div style="border-top:1px solid rgba(80,65,40,.12);padding-top:10px;display:flex;gap:16px;font-size:9px;color:var(--ink-ll)">
          <span>三大势力</span><span>45城</span><span>109位武将</span>
        </div>
      </div>
      <div style="width:320px;border:1px dashed rgba(80,65,40,.15);padding:28px 26px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px">
        <div style="font-size:28px;color:rgba(80,65,40,.15)">＋</div>
        <div style="font-size:10px;color:rgba(92,74,50,.25);letter-spacing:1px">更多剧本 · 敬请期待</div>
      </div>
    </div>
    <button class="ts-btn" onclick="showTitleScreen()" style="font-size:11px;width:140px;padding:9px 0">◂ 返回主菜单</button>
  `;
  document.body.appendChild(el);
}

function onScenarioSelect(scenarioId){
  document.getElementById('scenarioScreen')?.remove();
  showFactionSelect();
}


// ════════════════════════════════════════════════════════════════════
// ── R4.5.b 帮助 + 教程 + 势力选择 + 存读档 panel (v181 L10354-L11250) ──
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ★ v162: Tab 帮助系统（❓ 按钮 → 机制详解弹窗）
// ═══════════════════════════════════════════════════════

const TAB_HELP = {
  city: {
    title:'📖 城池与内政',
    intro:'城池是你的经济根基——人口、民心、建筑、太守共同决定一座城市的产出与战略价值。',
    sections:[
      {label:'💡 操作指引', content:`<b>查看城池</b>：在左侧郡县列表中点击任意城市名称，或在地图上点击城市图标，即可打开城池详情。<br><br>
<b>建造建筑</b>：在城池详情中点击「建筑」栏的空位，选择想建造的建筑类型。每城同时只能有一个在建项目。<br><br>
<b>任命太守</b>：点击城池详情中「太守」栏位的更换按钮，从闲置武将列表中选择合适人选。太守的政治能力越高，城市产出越好。<br><br>
<b>征兵</b>：点击城池详情中的「征兵」按钮，选择武将和兵种组建新部队。征兵会消耗城市人口，需谨慎取舍。<br><br>
<b>迁民</b>：点击城池详情中的「⇄ 迁民」按钮，将人口强制迁往邻城。代价极大（40%途中损耗+双城惩罚），仅适用于预判丢城时的焦土策略。<br><br>
<b>查看豪族</b>：点击城池详情的「豪族」展开属县详情，了解各县豪族态度。`},
      {label:'人口与增长', content:`<b>人口</b>是一切产出的基础。人口自然增长速率与人口质量挂钩（质量越高增长越快，约0.6~1.2%/年），唯一的制约是粮食——城市产粮能力由土地禀赋决定，超出产粮能力的人口只消耗粮食而不产出。<br><br>
<b>征兵会直接减少人口</b>——频繁征兵的城市人口恢复极慢，需谨慎取舍。战乱、饥荒、瘟疫也会导致人口锐减。<br><br>
<b>迁民</b>：可将城市人口强制迁往邻城，但途中损耗极大（40%），且双城民心、人口质量、豪族忠诚均受重创。研究「徙民实边」科技可降低损耗和目的城惩罚。`},
      {label:'人口质量', content:`人口质量与人口数量共同决定城市的<b>有效人口</b>（实际产出基数）。<br><br>
更关键的是：人口质量决定<b>新征兵的初始等级</b>——质量越高，新兵起步越强。<br><br>
征兵和战乱会损耗人口质量，恢复非常缓慢。建造<b>学堂</b>可加速恢复。过度征兵的代价不只是人口减少，更是兵源质量的持续下降。`},
      {label:'民心', content:`民心影响人口增减和社会稳定：<br>
· 民心高（>70）：人口缓慢增长<br>
· 民心低（<40）：人口外流<br>
· 民心崩溃：可能爆发叛乱<br><br>
影响因素：税率（高税损民心）、粮食充足度（缺粮暴跌）、战乱、太守政治能力、科技加成等。<br><br>
<b>腐败</b>：疆域越大腐败越重——城池数量超过一定阈值后，每多一城都会增加基础腐败率，最高可达三成。任命高政治太守和维持豪族支持可有效压制腐败。`},
      {label:'粮食与资源', content:`每城每旬产粮和耗粮。城市的<b>产粮能力有上限</b>，由土地禀赋和农田建设决定——建造农田可直接提高产粮上限。<br><br>
<b>⚠ 饥荒极其致命</b>：存粮耗尽后，饿死人的速度与粮食缺口成正比——缺口越大，死得越快。一座严重缺粮的城市可能在10旬内损失三成人口。建造农田、开启自动调粮、适时迁出多余人口都是应对手段。<br><br>
金、木、铁、马按势力总产出结算，用于征兵、建筑、科技。不同城市有不同资源禀赋——布局时注意资源分布。`},
      {label:'豪族势力', content:`每城下辖数个<b>属县</b>，各有豪族态度。属县分三类：<br>
· <b>治所</b>：城市核心县，态度相对稳定（敏感度×0.5）<br>
· <b>豪族据点</b>：绑定具体家族（如颍川荀氏、吴郡陆氏），对该家族武将任免极度敏感<br>
· <b>普通县</b>：无特定家族绑定<br><br>
其中部分豪族据点是<b>豪强县</b>（属县名后带 ★），经济产出更高（×1.5），但情绪波动也更大（×2.0）——任免本族武将的影响会被显著放大。<br><br>
<b>太守对豪族的影响</b>分级：本县出身（+0.5）> 同城出身（+0.3）> 外地士族（-0.1）> 寒门/降将（-0.2）> 无太守（-0.15）。<br><br>
各县态度汇总为城市豪族支持度：<br>
· 支持度高 → 税收加成、防御加成、压制腐败<br>
· 支持度低 → 隐匿户口、开城投敌风险<br><br>
<b>查看详情</b>：点击城池面板的「豪族」展开属县列表，再点击单个属县名可弹出 tooltip，显示该县的完整每旬变化分解（普适·本族放大·外部冲击）。`},
      {label:'太守与建筑', content:`<b>太守加成</b>：太守的出身背景和能力决定其对城市的加成方向——士族太守利于商业产出和建设效率，寒门武将利于军事建设和城防修复，高政治力太守加速民生建筑，高统帅太守加速军事建筑。降将初期有轻微效率惩罚。<br><br>
<b>建筑</b>每城同时只能建1个项目。前线侧重城防，后方侧重经济——学堂加速质量恢复，市集提升税收，谷仓增加存粮上限。<br><br>
<b>商港/榷场/马市</b>：港口城市可建商港，产木内陆城可建榷场，产马城可建马市。三级升级，提升城市金产百分比，同时放大通商协定的收入。`}
    ]
  },

  mil: {
    title:'📖 部队与作战',
    intro:'兵者，国之大事。编制、兵种、地形、补给——每个维度都影响战局走向。',
    sections:[
      {label:'💡 操作指引', content:`<b>查看部队</b>：在右侧「军事」标签中查看所有野外部队列表，点击可展开详情。也可在地图上直接点击部队图标选中。<br><br>
<b>移动部队</b>：先选中部队（左键点击），再<b>右键点击地图目标位置</b>下达移动指令。部队会沿最佳路线行军。<br><br>
<b>扎营</b>：选中部队后点击部队详情中的「扎营」按钮，部队进入防御姿态，获得防御加成，但无法移动。<br><br>
<b>伏击</b>：选中部队后点击「伏击」按钮，在当前位置设伏等待敌军。需要隐蔽地形（森林/山地等）。<br><br>
<b>攻城</b>：移动部队至敌方城市相邻格即可开始围城。围城面板中可选择发起总攻或继续围困。<br><br>
<b>增编/休整/解散</b>：在部队详情中操作。休整会保留兵员等级存入大城，解散则永久失去。`},
      {label:'编制结构', content:`每支部队由1-3个<b>分队（squad）</b>组成，「一主二副」结构。每个分队独立拥有：武将、兵种、兵力、士气。<br><br>
主将决定部队核心攻防，副将补充属性和兵种搭配。分队武将的<b>适性</b>直接影响该分队战力。`},
      {label:'兵种定位', content:`<table>
<tr><th>兵种</th><th>定位</th><th>优势</th><th>劣势</th></tr>
<tr><td>骑兵</td><td>突击/机动</td><td>攻防均衡，机动性强</td><td>山地森林大幅削弱</td></tr>
<tr><td>轻步</td><td>全能/基准</td><td>全地形适应，不受惩罚</td><td>无突出优势</td></tr>
<tr><td>重步</td><td>正面坦克</td><td>防御突出，正面硬克骑兵</td><td>机动差，怕弓兵</td></tr>
<tr><td>弓兵</td><td>远程输出</td><td>丘陵山地占优</td><td>怕骑兵近身</td></tr>
<tr><td>攻城</td><td>攻城专用</td><td>攻城不可或缺</td><td>野战极弱</td></tr>
</table>
特色兵种（虎豹骑、丹阳兵等）在基础兵种之上有显著加成，仅限特定城市招募。`},
      {label:'战力影响因素', content:`部队的<b>攻击力和防御力</b>受以下因素综合影响，每一项都是乘数关系——任何一项短板都会显著拖累整体战力：<br><br>
· <b>兵力</b>：人多力量大，最基础的战力来源<br>
· <b>等级</b>：老兵比新兵显著更强，通过实战积累经验升级<br>
· <b>士气</b>：士气越高战力越强，士气崩溃则部队瘫痪<br>
· <b>武将统帅</b>：统帅越高的武将带兵越强<br>
· <b>兵种适性</b>：武将对所带兵种的适性（S/A/B/C），适性越高加成越大<br>
· <b>兵种本身</b>：不同兵种攻防基础值不同（骑兵攻高，重步防高等）<br>
· <b>兵种克制</b>：核心克制链为骑兵克弓兵、弓兵克重步、重步克骑兵<br>
· <b>地形</b>：骑兵在山地森林大幅削弱，弓兵在丘陵山地占优，轻步不受地形影响<br>
· <b>混编协同</b>：合理的兵种搭配获得战力加成，搭配不当则被削弱<br>
· <b>科技加成</b>：军事科技可提升攻防基础值<br><br>
总之：选对将领、配对兵种、占好地形、保持士气——缺一不可。`},
      {label:'兵种克制', content:`核心克制链：<b>骑兵→弓兵→重步→轻步→骑兵</b><br><br>
· 骑兵对弓兵有大幅优势，但遇到重步会被克制<br>
· 弓兵远程输出强，对重步有一定优势，但怕骑兵突脸<br>
· 重步正面防御最强，是骑兵的天敌，但被弓兵消耗<br>
· 轻步全面但平庸，不怕任何地形<br>
· 攻城器野战极弱，需要保护<br><br>
根据敌方兵种构成调整己方编制，是战术层的核心。`},
      {label:'地形影响', content:`不同兵种在不同地形下表现差异显著：<br><br>
· <b>平原</b>：骑兵发挥正常，各兵种无显著加减<br>
· <b>丘陵</b>：骑兵受限，弓兵占优<br>
· <b>山地</b>：骑兵严重削弱，弓兵/重步发挥更好<br>
· <b>森林</b>：骑兵和重步都受限，轻步独占优势<br>
· <b>水域</b>：所有兵种统一按轻步数值，由武将<b>水战适性</b>决定战力<br><br>
轻步兵全地形不受影响，是最稳定的兵种。选择交战地点和兵种配置一样重要。`},
      {label:'混编协同', content:`同一部队的分队兵种搭配会产生协同或冲突效果：<br><br>
<b>良好搭配</b>：步弓协同（骑+轻、弓+重等）能提升整支部队的战力<br>
<b>冲突搭配</b>：骑兵+攻城器等搭配会拖累整体<br><br>
搭配原则：步弓协同最稳，骑兵适合单独成队或配轻步。攻城器尽量配重步保护。具体加减幅度在5~10%之间——看似不大，多场仗下来差距明显。`},
      {label:'补给与补员', content:`<b>补给线</b>基于部队到最近己方城市的距离：补给有最大覆盖范围（科技可扩展），在敌方领地内每格额外消耗更高。超出补给范围后，部队每旬士气和兵力持续流失。断粮数旬后开始溃散。<br><br>
<b>补员</b>分前线和后方两种速率——前线补员显著慢于后方，设计意图是鼓励后方整备再出征，而非前线无限添兵。实际速率受当地人口、政策和科技影响。`},
      {label:'战斗类型', content:`<b>野战</b>：遭遇即战，可触发单挑（勇武对决）和连携（亲密度达标武将双加成）。<br><br>
<b>围城与攻城</b>：城防加成极高——守方依托城墙优势巨大。建议先围城断补给、逐步削弱士气和城防后再总攻。缺少攻城器硬攻代价惨重。<br><br>
<b>伏击/劫营</b>：先手优势巨大，成功率由双方智谋对比决定。失败有士气和信誉代价。<br><br>
<b>水战</b>：入水/上岸各耗一旬，水上每旬航行2格。水域中所有兵种统一为轻步数值，按<b>水战适性</b>决定战力，不可扎营、设伏。东吴武将水战适性占优。<br><br>
<b>攻城后处置</b>：安民（恢复民心）/ 劫掠（获金，损民心人口）/ 屠城（大笔金钱，民心崩溃、信誉重创）。影响价值观和武将忠诚。`},
      {label:'休整屯田', content:`不需要的部队可<b>休整屯田</b>——遣散回大城，武将释放回闲置池，兵员保留在该城，粮饷大幅降低。<br><br>
关键：<b>部队等级得以保留</b>，需要时可随时以老兵身份复员重编。这是管理军费和保存精锐的重要手段。`},
      {label:'部曲（私人精锐）', content:`部分武将拥有<b>部曲</b>——跟随将领多年的私人精锐，战力远高于普通新兵。<br><br>
部曲比例越高，分队的有效等级越高。部曲在战斗中有一定的损失保护，但惨败全歼时同样归零。<br><br>
<b>部曲增长</b>：战胜后少量老兵可晋升为部曲；和平驻扎时缓慢训练转化。增长速度都很慢——部曲是需要长期积累的精锐。<br><br>
<b>部曲消失</b>：部队<b>解散</b>→部曲永久消失（建议改用休整）；武将<b>阵亡/被俘/处决/叛逃/被挖角</b>→部曲归零。休整则部曲保留，跟武将走。<br><br>
<b>政治影响力</b>：部曲数量影响武将在派系中的话语权——有兵的将领在朝议中分量更重。<br><br>
<b>核心取舍</b>：部曲是不可再生资源（短期内），征兵只能补辅兵。保存部曲还是全力一搏，是每场战役的关键抉择。`},
      {label:'武将四类', content:`每位武将属于以下一种或多种类型：<br><br>
<b>⚔️ 武将</b>：战场猛将，提升被动单挑触发率（+3%/人）<br>
<b>🏴 统帅</b>：治军名将，战斗开始时全军士气+5，且增幅武将/谋士/能臣的效果（+3%→+5%，+1格→+2格）。一支部队只能有一位统帅，两位以上则增幅失效<br>
<b>🧠 谋士</b>：智计之士，提升伏击/劫营/火攻成功率（+3%/人）<br>
<b>📜 能臣</b>：后勤干才，补给范围+1格<br><br>
少数全才武将拥有多个标签（如关羽⚔️🏴、诸葛亮🏴🧠📜），编组时需选择一个标签生效。<br><br>
<b>推荐编组</b>：1统帅+1武将+1谋士 → 士气+5、单挑+5%、计谋+5%（三项均获增幅）`},
      {label:'战斗演出', content:`五种战斗类型均有专属可视化动画：<br><br>
· <b>野战</b>：双方部队在战场上碰撞，刀光剑影交错<br>
· <b>伏击</b>：伏兵从隐蔽处杀出，被伏方阵型瞬间散乱<br>
· <b>营寨</b>：劫营战火光冲天，扎营方仓促应战<br>
· <b>攻城</b>：攻城器械推进城下，守军居高临下迎击<br>
· <b>水战</b>：战船在水面交锋，火攻可焚烧敌船<br><br>
<b>叫阵单挑前奏</b>：开战前若双方都有高勇武武将，会触发单挑前奏动画——猛将出列叫阵，胜负大幅影响双方士气。<br><br>
所有动画期间不影响战报内容——结算逻辑独立运行，动画只是把数字变化演出来给你看。`}
    ]
  },

  gen: {
    title:'📖 武将系统',
    intro:'以人为本——武将是你最重要的资源。知人善任，人尽其才。',
    sections:[
      {label:'💡 操作指引', content:`<b>查看武将</b>：在右侧「武将」标签中浏览所有武将列表，点击武将名称可打开详细资料。<br><br>
<b>任命官职</b>：在「官职」标签中给武将封官，提升忠诚和属性加成。<br><br>
<b>征兵选将</b>：在城池详情中征兵时选择武将作为部队统领。注意匹配武将的兵种适性。<br><br>
<b>研究科技</b>：在「科技」标签中指派闲置武将进行科技研究。高属性武将研究更快。`},
      {label:'五维属性', content:`<table>
<tr><th>属性</th><th>作用</th></tr>
<tr><td><b>统帅 COM</b></td><td>部队攻防核心加成，统帅越高带兵越强</td></tr>
<tr><td><b>勇武 WAR</b></td><td>单挑胜负关键，影响部队士气上限</td></tr>
<tr><td><b>智谋 INT</b></td><td>情报精度、伏击/劫营/火攻成功率、计谋效果</td></tr>
<tr><td><b>政治 POL</b></td><td>太守/文官官职适配，提升城市产出和压制腐败</td></tr>
<tr><td><b>魅力 CHA</b></td><td>招募/劝降效果，绑定武将忠诚度基础值</td></tr>
</table>`},
      {label:'忠诚度', content:`忠诚度受多项因素综合影响，每旬自然漂移：<br><br>
· <b>主公魅力</b>：魅力越高，武将忠诚回升越快<br>
· <b>官职</b>：有官职的武将忠诚更稳定<br>
· <b>派系安全感</b>：所属派系被边缘化时忠诚额外下降<br>
· <b>价值观匹配</b>：崇汉武将在篡汉势力中忠诚下降<br>
· <b>俸禄满足</b>：欠饷影响忠诚<br>
· <b>亲密度</b>：与主公亲密度高的武将更忠心<br><br>
忠诚较低时可被敌方挖角，极低时可能叛逃。点击武将可查看完整的忠诚度分解。`},
      {label:'适性与成长', content:`每位武将对各兵种有适性等级 S/A/B/C，直接影响带兵战力——适性越高，该兵种在其手中越强。<br><br>
适性可通过实战经验提升（C→B→A→S），但升级缓慢。选择武将时优先匹配兵种适性。<br><br>
除陆战兵种外，每位武将还有<b>水战适性</b>，决定水域战斗时的战力。东吴武将水战适性普遍占优。`},
      {label:'武将技能', content:`名将拥有独特的<b>被动技能</b>，满足条件时自动生效：<br>
· 马超·西凉铁骑 — 统领骑兵ATK大幅提升<br>
· 曹仁·坚城 — 守城/扎营时DEF显著增强<br>
· 张辽·威震逍遥 — 面对数倍敌军全队士气大涨<br>
· 诸葛亮·卧龙 — 伏击/火攻成功率提升，调粮效率优化<br>
· 关羽·武圣 — 单挑触发率和胜率大增，统领步兵士气加成<br><br>
用对人、放对位置，才能最大化武将价值。`},
      {label:'武将性情', content:`每位武将有独特<b>性情标签</b>：<br>
· <b>傲</b>：单挑胜利士气更高，不受重用则不满<br>
· <b>莽</b>：更易卷入单挑，也更易中计<br>
· <b>沉稳</b>：断粮/中伏时稳住军心<br>
· <b>狡黠</b>：不易中伏，但可能被敌方挖角<br>
· <b>刚毅</b>：防守更坚，不易劝降<br>
· <b>仁厚</b>：任太守时利于民生恢复`},
      {label:'亲密度', content:`武将之间通过共事积累<b>亲密度</b>，达到阈值后解锁<b>连携</b>效果——同一部队的连携武将在战斗中获得攻防双加成。<br><br>
经典组合如关张、马超+庞德等，亲密度初始较高。把关系好的武将编在一起，能获得额外战力。`}
    ]
  },

  post: {
    title:'📖 官职体系',
    intro:'封官拜将，笼络人心——官职是你管理势力的核心杠杆。',
    sections:[
      {label:'💡 操作指引', content:`<b>任命官职</b>：在「官职」标签中，点击空缺的官职槽位，从武将列表中选择人选任命。<br><br>
<b>撤换官职</b>：点击已任命的官职条目，可撤换或免职。频繁更换会影响武将忠诚。<br><br>
<b>查看效果</b>：每个官职旁显示其提供的具体加成效果和俸禄消耗。`},
      {label:'四档解锁', content:`势力官职体系随城市数量解锁更高档位：<br><br>
· <b>诸侯</b>（≥1城）：基本官职框架<br>
· <b>侯</b>（≥3城）：更多官职名额<br>
· <b>公</b>（≥6城）：开放二品以上高级官职<br>
· <b>王</b>（≥10城）：完整官职体系，一品大员可用<br><br>
城池越多可用的官位越多，但也意味着更多的俸禄开支和派系平衡压力。`},
      {label:'官职效果', content:`官职带来属性加成（攻防/内政/外交等），具体加成值随品级提升。<br><br>
· 有官职的武将忠诚更稳定<br>
· 任命某派系武将会提升该派系凝聚力<br>
· 高级官职消耗更多军饷<br><br>
合理分配官位——既要保持战力，也要平衡派系。`},
      {label:'称帝', content:`满足条件后可在外交面板<b>称帝</b>——需要足够的城池数量和信誉。称帝会大幅冲击势力价值观（天命维度），部分武将可能因价值观不合忠诚下降。<br><br>
华歆·逼宫技能可降低称帝门槛。`}
    ]
  },

  dip: {
    title:'📖 外交机制',
    intro:'合纵连横——能用外交解决的，不必刀兵相见。',
    sections:[
      {label:'💡 操作指引', content:`<b>外交面板</b>：在右侧「外交」标签中查看所有势力。每个势力条目从上到下依次展示：<br><br>
<b>① 送礼</b>（小礼/厚礼/重礼）：花金提升好感度，每旬限一次外交行动<br>
<b>② 互市</b>（购买资源）：花金向对方购买马匹/铁矿/木材，附带情报。需好感≥30，每季度一次<br>
<b>③ 通商</b>（持续贸易）：花500金缔结通商协定，双方每旬持续获得金币收入。需好感≥50<br>
<b>④ 状态操作</b>（结盟/宣战/求和/称臣等）：根据当前外交状态显示可用操作<br><br>
<b>关键限制</b>：<br>
· 每旬只能对一个势力执行一次外交行动（送礼/互市二选一）<br>
· 附庸无外交自主权<br>
· 宣战前可以准备宣称避免信誉损失`},
      {label:'友好度与状态', content:`势力间友好度（rel）决定外交状态转换：<br><br>
· <b>同盟</b>：好感足够高时可缔盟，互不侵犯，共享部分视野。好感过低自动解盟<br>
· <b>中立</b>：默认状态，可互动但无特殊关系<br>
· <b>敌对</b>：好感极低时自动进入敌对，或可主动宣战<br><br>
友好度会自然漂移——盟友关系缓慢加固，敌对关系缓慢恶化，中立关系趋于平衡。价值观差异大的势力友好度自然下降更快。`},
      {label:'互市（一次性买卖）', content:`在外交面板点击「购马匹/铁矿/木材」按钮，花金向非敌对势力（好感≥30）购买其特产资源。<br><br>
<b>可购资源</b>取决于对方城市的资源禀赋——对方有产马城就能买马，有产铁城就能买铁。<br><br>
<b>附带情报</b>：交易成功后会短暂揭开对方资源城的迷雾，相当于免费侦查。<br><br>
<b>限制</b>：每个势力每季度（9旬）只能互市一次。`},
      {label:'通商协定（持续贸易）', content:`在外交面板点击「🤝 缔结通商」按钮，花500金与非敌对势力（好感≥50）签订通商协定。<br><br>
<b>效果</b>：协定存续期间，双方每旬各自获得一笔金币收入，金额取决于对方的城市数量——对方城越多，你赚得越多。<br><br>
<b>额外加成</b>：<br>
· 同盟关系下通商收入额外提升<br>
· 己方商港/榷场/马市等级越高，通商收入越多（贸易建筑联动）<br><br>
<b>自动中断</b>：任何一方宣战、好感跌破20、任何一方灭国，通商自动终止。<br>
<b>主动中止</b>：可随时点击「❌ 中止」按钮解除协定，但会损害好感和信誉。<br><br>
<b>限制</b>：每势力最多同时维持2个通商协定。附庸不可缔结通商。`},
      {label:'信誉系统', content:`信誉影响外交可信度和AI态度：<br><br>
<b>主要扣减行为</b>：无宣称开战、毁盟、背弃附庸、计谋失败、中止通商协定等<br>
<b>恢复</b>：和平时期缓慢恢复<br><br>
信誉过低时其他势力不愿结盟，甚至主动敌视。维护信誉是长期外交战略的基石。`},
      {label:'宣称系统', content:`宣战前准备<b>宣称</b>作为出兵正当理由。有宣称开战不扣信誉，无宣称开战信誉大减。<br><br>
宣称获取途径：边境摩擦、历史领土、事件触发等。宣称有时效性，过期需重新获取。`},
      {label:'附庸体系', content:`军力足够强大时可要求对方<b>称臣</b>。附庸每旬向宗主纳贡金币和粮食。附庸无外交自主权（不可宣战/结盟/求和），也不可独立缔结通商协定。宗主交战时附庸自动跟随宣战。<br><br>
好感度过低时附庸自动独立。附庸也可主动请求独立。`}
    ]
  },

  scheme: {
    title:'📖 计谋系统',
    intro:'上兵伐谋——计谋是智将的战场。',
    sections:[
      {label:'💡 操作指引', content:`<b>施展计谋</b>：在右侧「计谋」标签中选择计谋类型和目标势力/城市，点击按钮执行。<br><br>
<b>任命军师</b>：在计谋标签顶部可任命一名武将为军师，其智谋替代君主智谋计算成功率。好的谋士能大幅提升计谋效果。<br><br>
<b>通使</b>：在计谋标签底部可向非敌对势力派遣使者（需好感≥20），成功后获取对方势力的模糊情报并提升好感。`},
      {label:'计谋一览', content:`<table>
<tr><th>计谋</th><th>效果</th><th>成功率关键</th></tr>
<tr><td>斥候</td><td>侦查目标区域，获取精确军事情报</td><td>己方INT</td></tr>
<tr><td>反间计</td><td>降低敌方武将忠诚度</td><td>INT对比</td></tr>
<tr><td>散布谣言</td><td>损害敌城民心</td><td>INT对比</td></tr>
<tr><td>驱虎吞狼</td><td>挑拨两个势力交战</td><td>INT + 目标关系</td></tr>
<tr><td>二虎竞食</td><td>让两个敌方势力互相消耗</td><td>INT + 目标关系</td></tr>
<tr><td><b>通使</b></td><td>派遣使者：提升好感，获取对方势力模糊情报</td><td>己方INT</td></tr>
</table>`},
      {label:'通使详解', content:`<b>通使</b>是一种兼具外交和情报功能的行动：花费600金向非敌对势力（好感≥20）派遣使者。<br><br>
<b>成功</b>：好感提升、揭开对方首都迷雾数旬、<b>下旬</b>使者归来后弹出情报报告（描述对方兵力、财政、粮草和主力部队方向，均为模糊叙事而非精确数字）。<br><br>
<b>失败</b>：好感下降，退还部分金币。<br><br>
<b>限制</b>：有独立冷却时间，不可频繁派遣。`},
      {label:'成功率与代价', content:`计谋成功率主要由己方军师/君主的<b>智谋</b>与目标方智谋对比决定。智谋差距越大，成功率越高。<br><br>
每种计谋有独立冷却和金币消耗。失败会损失信誉，避免无脑施计。<br><br>
<b>军师</b>的作用：在计谋Tab任命军师后，所有计谋成功率以军师INT为准，比使用君主INT更灵活。`}
    ]
  },

  faction: {
    title:'📖 派系政治',
    intro:'势力内部的政治生态——平衡派系是长治久安的关键。',
    sections:[
      {label:'💡 操作指引', content:`<b>查看派系</b>：在右侧「派系」标签中查看各派系的影响力和安全区。点击派系条目可展开详情，查看所属武将列表和情绪状态。<br><br>
<b>派系标签顶部</b>会显示当前势力阶段（军阀/一方之主/政权）和距下一阶段的进度，以及内政概览（人口、民心、豪族、腐败等关键指标摘要）。<br><br>
<b>朝议</b>：定期弹出朝议提案，选择支持或否决。每次选择都影响对应派系的情绪和影响力。`},
      {label:'势力阶段', content:`势力随城池增长会经历三个阶段，单向不可逆：<br><br>
<b>① 军阀</b>（起始）：家臣政治·宗族抱团。创始团队、宗族、元从派系强势，本地士族话语权较低。<br><br>
<b>② 一方之主</b>：根据地稳固——某州持有 4+ 城且总城数 ≥ 6，持续 8 旬后晋升。本地士族崛起，宗族影响力减半，根据地州的派系开始主导朝政。<br><br>
<b>③ 政权</b>：制度化治理——总城数 ≥ 12 且 2 个非小州各持 4+ 城。派系系统全面运转，所有士族平等角力，宗族/元从优势进一步淡化。<br><br>
<b>设计意图</b>：势力扩张不只是地图变红，每个阶段都对应不同的内部政治结构。军阀打天下靠宗族死忠，一方之主要靠地方士族治理，政权则需要制度化平衡所有派系。`},
      {label:'派系影响力', content:`武将依出身归属不同派系。每个派系有<b>影响力</b>值，由该派系武将的官职等级、数量和功绩决定。<br><br>
每个派系有一个<b>安全区</b>——影响力在安全区内的武将忠诚不受派系影响；被<b>边缘化</b>（影响力远低于安全区下限）的派系武将忠诚每旬额外下降。`},
      {label:'朝议', content:`定期触发的<b>朝议</b>会产生影响势力走向的提案。提案由不同派系发起，通过或否决会影响对应派系的情绪和影响力。<br><br>
朝议是真实的派系取舍——没有"最优解"，每次选择都是在派系之间做政治交易。`},
      {label:'派系平衡策略', content:`· 不让任何一个派系被彻底边缘化（忠诚暴跌风险）<br>
· 任命官职时注意派系平衡分配<br>
· 朝议选择偶尔照顾弱势派系<br>
· 降将初期派系影响力低，需要时间和官职扶持<br><br>
满足武将收集欲的同时，要意识到每招一个降将都在稀释现有派系的影响力。`}
    ]
  },

  tech: {
    title:'📖 科技树',
    intro:'科技是势力长线发展的加速器——选对路线，事半功倍。',
    sections:[
      {label:'💡 操作指引', content:`<b>研究科技</b>：在右侧「科技」标签中点击科技树节点，选择一名闲置武将进行研究。<br><br>
<b>选择研究员</b>：不同科技绑定不同属性（军事→统帅，经济→智谋等），高属性武将研究更快。<br><br>
<b>注意</b>：每势力同时只能研究一项科技，研究期间该武将不可出征或任官。`},
      {label:'五大分支', content:`<table>
<tr><th>分支</th><th>绑定属性</th><th>核心效果方向</th></tr>
<tr><td>经济</td><td>智谋</td><td>粮/金/铁产提升，调粮优化，征兵费降低</td></tr>
<tr><td>军事</td><td>统帅</td><td>攻防提升，编制上限扩大，扎营加速</td></tr>
<tr><td>练兵</td><td>勇武</td><td>新兵出厂等级提升，经验增长加快</td></tr>
<tr><td>政治</td><td>魅力</td><td>降将忠诚提升，挖角强化，投降率增加</td></tr>
<tr><td>民生</td><td>政治</td><td>民心恢复加快，人口质量提升，补给范围扩大</td></tr>
</table>
各分支适配不同战略路线——选择优先发展方向是长线规划的核心。`},
      {label:'研究机制', content:`每势力同时只能研究<b>1项</b>科技，需绑定一名<b>闲置武将</b>作为研究员。<br><br>
· 研究时间由节点难度决定<br>
· 研究完成后该武将获得对应属性经验<br>
· 研究员在研究期间占用武将槽，不可出征或任官<br><br>
选择高属性武将研究可以缩短时间。`}
    ]
  },

  ethos: {
    title:'📖 价值观',
    intro:'价值观是势力的"气质镜子"——不是你选择的，而是你的行为塑造的。',
    sections:[
      {label:'五个维度', content:`<table>
<tr><th>维度</th><th>负极</th><th>正极</th><th>影响来源</th></tr>
<tr><td>天命</td><td>尊汉</td><td>篡汉</td><td>称帝、宣战理由、朝议</td></tr>
<tr><td>权柄</td><td>共治</td><td>集权</td><td>官职任免、朝议决策</td></tr>
<tr><td>文治</td><td>仁政</td><td>暴政</td><td>灾害应对、攻城处置、事件选择</td></tr>
<tr><td>武略</td><td>怀柔</td><td>铁血</td><td>战争决策、攻城处置</td></tr>
<tr><td>方略</td><td>守成</td><td>扩张</td><td>宣战、征服、外交</td></tr>
</table>
各维度随你的行为自然变化，不做极端行为则自然趋于中庸。`},
      {label:'忠诚联动', content:`武将性情与势力价值观不匹配时忠诚下降：<br><br>
· 崇汉武将在篡汉势力中忠诚额外下降<br>
· 鸽派武将在铁血势力中忠诚下降<br>
· 鹰派武将在怀柔势力中忠诚下降<br><br>
走任何极端都有代价——这不是优化题，而是取舍。`},
      {label:'外交联动', content:`价值观距离影响外交友好度自然漂移：<br><br>
· 价值观差异大的势力自然疏远<br>
· 价值观相近的势力自然亲近<br><br>
效果：价值观相近的势力更容易结盟和通商，对立的势力更难维持和平。`}
    ]
  },

  stats: {
    title:'📖 统计面板',
    intro:'<b style="color:rgba(180,120,40,.85)">⚠ 测试用功能（Testing Only）</b>——数据追踪模块，每旬自动记录各项关键指标，帮你把握大势。本面板仍在调试中，数据仅供参考。',
    sections:[
      {label:'💡 操作指引', content:`<b>查看趋势</b>：点击不同指标标签切换查看军力、城池数、人口、金产、粮食等历史趋势曲线。<br><br>
<b>查看明细</b>：点击势力栏的金产/粮产等数字，可展开详细分解面板（各城贡献、通商收入、军饷支出等）。`},
      {label:'数据说明', content:`统计面板展示各势力的历史趋势曲线，包括：军力、城池数、人口、金产、粮食等。<br><br>
数据每旬自动快照，可用于判断势力消长和调整战略方向。横轴为旬数，纵轴为对应指标。三家势力用不同颜色区分。`}
    ]
  },

  policy: {
    title:'📖 全局政策',
    intro:'全局政策影响你的经济命脉与军事后勤——税率、补员、调粮三大杠杆需要根据战局灵活调整。',
    sections:[
      {label:'💡 操作指引', content:`<b>调整政策</b>：在左侧面板的「全局政策」区域，直接点击税率、补员、调粮等选项进行切换。<br><br>
<b>推进时间</b>：政策设定好后，点击<b>「推进一旬」</b>按钮结束回合，系统自动结算经济、人口、部队移动、AI行动等。`},
      {label:'赋税', content:`税率决定每旬金币收入与民心消长的平衡：<br><br>
<b>税率档位</b>：免税 / 低税 / 中税 / 高税 / 苛税<br>
· 税率越高，金币收入越多，但民心下降越快<br>
· 税率越低，民心恢复越好，但金库增长缓慢<br><br>
前线城市建议低税稳民心，后方经济城可适当提高税率。`},
      {label:'补员', content:`补员政策控制各城驻军的自动兵力补充。前线补员速率显著低于后方——设计意图是鼓励后方整备再出征，而非前线无限添兵。<br><br>
补员消耗当地<b>人口</b>——频繁补员会拖累城市人口增长。实际速率受人口质量、科技和政策加成影响。`},
      {label:'自动调粮', content:`开启后，系统自动在城市间调配余粮，缓解前线缺粮。调粮有<b>运输损耗</b>和<b>旬数延迟</b>（距离越远越慢），敌方领地内运输损耗更高。<br><br>
<b>武将技能影响</b>：诸葛亮·木牛流马可降低调粮损耗和加速。经济科技树也有调粮优化节点。`},
      {label:'徭役', content:`徭役是征发百姓劳动的制度——三档可调：轻徭（默认无代价）、中徭（加速建设，轻微损民心）、重徭（大幅加速，但民心和人口质量都会下降）。<br><br>
<b>仅在有在建项目的城市生效</b>——没有工程时不征发徭役。太守政治能力高时民心代价减半。<br><br>
<b>核心取舍</b>：重徭加速建设，但人口质量下降→新兵等级降低。适合后方安全城市短期冲刺，前线城市慎用。`}
    ]
  },

  ai: {
    title:'📖 AI 决策系统',
    intro:'AI 控制非玩家势力的战略与战术决策。你可以在规则AI和Claude AI之间切换。',
    sections:[
      {label:'规则AI vs Claude AI', content:`<b>规则AI</b>（默认）：基于预设规则和优先级树做出决策，速度快、无需联网，行为稳定可预测。<br><br>
<b>Claude AI</b>：调用大语言模型（LLM）进行决策，能做出更灵活、更具战略深度的判断——包括外交博弈、多线协调、长期规划等。需要API Key。<br><br>
Claude AI失败时自动回退到规则AI，不会中断游戏。`},
      {label:'如何启用 Claude AI', content:`点击顶部 <b>🤖 规则AI</b> 按钮 → 弹出设置面板：<br><br>
· 选择 <b>API 格式</b>（Anthropic / OpenAI兼容）<br>
· 填写 <b>API 地址</b>（默认为Anthropic官方）<br>
· 选择 <b>模型</b>（推荐 Claude Sonnet 4）<br>
· 输入 <b>API Key</b><br><br>
<b>安全说明</b>：Key 仅存在浏览器内存中，刷新页面后需重新输入，不会上传或持久化存储。<br><br>
本地打开HTML文件时可能遇到CORS限制，需安装浏览器CORS插件或部署到服务器。`},
      {label:'AI 决策范围', content:`Claude AI 控制<b>非玩家势力</b>的以下决策：<br><br>
· 战略层：进攻/防守方向、外交策略、科技路线<br>
· 战术层：部队调动、征兵、建设<br>
· 每数旬执行一次战略评估，每旬执行战术决策<br><br>
城池数量很少的势力自动使用规则AI。`}
    ]
  }
};

/** v162: 显示Tab帮助弹窗 */
function showTabHelp(tabId){
  const data = TAB_HELP[tabId];
  if(!data) return;
  // 移除已有弹窗
  document.getElementById('tabHelpOverlay')?.remove();
  const ov = document.createElement('div');
  ov.id = 'tabHelpOverlay';
  ov.className = 'tab-help-overlay';
  ov.onclick = function(e){ if(e.target===ov) closeTabHelp(); };

  const secs = (data.sections||[]).map((sec,i) =>
    `<div class="thp-sec">
      <div class="thp-sec-btn" onclick="this.classList.toggle('open')"><span class="arr">▸</span> ${sec.label}</div>
      <div class="thp-sec-body">${sec.content}</div>
    </div>`
  ).join('');

  ov.innerHTML = `<div class="tab-help-card">
    <div class="tab-help-close" onclick="closeTabHelp()">✕ 关闭</div>
    <div class="tab-help-title">${data.title}</div>
    <div class="tab-help-intro">${data.intro}</div>
    ${secs}
  </div>`;
  document.body.appendChild(ov);
}

function closeTabHelp(){
  document.getElementById('tabHelpOverlay')?.remove();
}

/** v162: 返回帮助按钮HTML片段，供各tab标题内联使用 */
function _tabHelpHtml(tabId){
  if(!TAB_HELP[tabId]) return '';
  return `<button class="tab-help-btn" title="查看本页机制详解" onclick="event.stopPropagation();showTabHelp('${tabId}')">?</button>`;
}

// ═══════════════════════════════════════════════════════
// ★ v137: 新手引导系统（Tutorial Overlay）
// ═══════════════════════════════════════════════════════

const TUT_PAGES = [
  // Page 0: 总纲
  { title:'汉末乱世，群雄逐鹿', highlight:null, pos:'center', reveal:[],
    body:`<p>你将以一方诸侯之身，治理城池、招揽贤才、合纵连横，最终一统天下。</p>
<p>这不是一场比谁兵多的游戏——粮草、民心、人才、外交，每一个维度都可能决定成败。以下数页将帮你快速了解大局。</p>` },

  // Page 1: 大地图
  { title:'大地图', highlight:'.map-wrap', pos:'left', reveal:['.map-wrap'],
    body:`<p>大地图是你的战场与棋盘：</p>
<p>· <b>左键点城市</b> → 城池详情，建设、征兵<br>
· <b>左键点部队</b> → 选中部队，查看状态<br>
· <b>右键地图</b> → 对选中部队下达移动指令</p>
<p>右上角叠加层按钮可切换地图视图（势力分布、粮草、补给线等），帮你纵览全局态势。</p>`,
    details:[
      {label:'战争迷雾与情报', content:`地图被战争迷雾笼罩，你只能看到己方部队和城池周边的区域。迷雾中的敌军信息是模糊的——兵力只能看到估值，武将可能无法识别。<br><br>情报精度取决于附近己方部队中<b>武将的智谋（INT）</b>：INT越高，看到的敌军兵力和武将信息越精确。高智谋武将不仅是谋士，更是你在前线的"眼睛"。也可通过「计谋」标签的「斥候」侦查指定目标获取精确情报。`}
    ] },

  // Page 2: 城池与内政
  { title:'城池与内政', highlight:'.rp', highlightTab:'city', pos:'left', reveal:['.map-wrap','.rp'],
    body:`<p>城池是你的经济根基。在右侧「城池」标签中查看城市状态、兴建建筑、任命太守。城市产出取决于<b>人口</b>、<b>人口质量</b>、建筑和太守政治能力。</p>`,
    details:[
      {label:'人口、民心与人口质量', content:`<b>人口</b>是一切产出的基础——税收、粮产、征兵潜力都与人口挂钩。人口自然增长速率与人口质量挂钩（质量越高增长越快，约0.6~1.2%/年），唯一的制约是粮食。<br><br><b>民心</b>影响社会稳定。民心低则人口外流；民心崩溃可能爆发叛乱。影响民心的因素：税率、粮食充足度、战乱、太守政治能力等。<br><br><b>人口质量</b>是容易被忽视的关键指标。它与人口数量共同决定城市的"有效人口"，直接影响所有资源产出。更重要的是，人口质量决定<b>新征兵的初始等级</b>——质量越高，新兵起步越强。征兵和战乱会损耗人口质量，恢复非常缓慢（建造学堂可加速）。`},
      {label:'粮食与饥荒', content:`每座城市的<b>产粮能力由土地禀赋决定</b>——城市能养活多少人取决于它的自然条件和农田建设，不是人口越多产粮越多。当人口超过城市的产粮能力时，多出来的人只吃饭不种田，粮食缺口会迅速扩大。<br><br><b>⚠ 饥荒极其致命</b>：存粮耗尽后，饿死人的速度与粮食缺口成正比。如果60%的人吃不上饭，每旬就会饿死总人口的3%——一座30万人的城，每旬饿死近万人。缺口越大死得越快，直到人口降到粮食能养活的水平才会稳定。<br><br>建造<b>农田</b>和<b>水利</b>能直接提高产粮能力，开启<b>自动调粮</b>可从余粮城调配救济。前线城市尤其注意粮食储备——被围城切断补给后果极其严重。`},
      {label:'迁民', content:`可将城市人口<b>强制迁往邻城</b>。这是一种代价极大的焦土策略，仅适用于预判即将丢城时提前转移人口——与其让敌人白拿一座人口大城，不如付出沉重代价把人迁走。<br><br><b>途中损耗40%</b>（研究「徙民实边」科技可降至30%），迁出城和迁入城的民心、人口质量、豪族忠诚均受重创，跨地域迁移代价更大。迁入城若因涌入大量人口导致粮食不足，还会叠加饥荒。<br><br>操作：点击城池详情中的「⇄ 迁民」按钮，选择目的地和迁移比例。附近有敌军（2格内）时无法迁移。`},
      {label:'豪族势力', content:`每座城市下辖数个<b>属县</b>，各有自己的豪族态度。豪族据点绑定具体家族（如颍川荀氏、吴郡陆氏），对该家族武将的任免极度敏感；治所相对稳定。其中部分县是<b>豪强县</b>（属县名后带 ★）——经济产出更高，但情绪也更敏感，任免本族武将的影响会被显著放大。各县态度汇总为城市的豪族支持度——支持度高则税收、防御加成；过低则隐匿户口甚至开城投敌。任命当地士族为太守、给豪族家族封官是维稳关键。点击城池面板的「豪族」可展开属县详情。`},
      {label:'建筑', content:`建筑提供产出加成和功能解锁，每城同时只能建造一个项目。建筑需消耗资源和数旬时间。前线城市侧重城防工事，后方城市侧重经济产出——学堂加速人口质量恢复，市集提升税收，<b>农田直接提高城市能养活的人口上限</b>，是粮食不足城市的首选建筑。`}
    ] },

  // Page 3: 武将与人才
  { title:'武将与人才', highlight:'.rp', highlightTab:'gen', pos:'left', reveal:['.map-wrap','.rp'],
    body:`<p><b>以人为本——武将是你最重要的资源。</b></p>
<p>武将拥有五维属性，各有所用：</p>
<p><span class="tut-attr">统帅</span> 部队攻防核心，决定带兵作战的战斗力<br>
<span class="tut-attr">勇武</span> 主导单挑胜负，猛将的核心标志<br>
<span class="tut-attr">智谋</span> 情报精度、伏击/劫营/火攻成功率、计谋效果<br>
<span class="tut-attr">政治</span> 适配太守和文官官职，提升城市产出<br>
<span class="tut-attr">魅力</span> 招募、劝降效果，绑定武将忠诚度</p>`,
    details:[
      {label:'武将技能', content:`名将拥有独特的<b>被动技能</b>，满足条件时自动生效，与武将人设深度绑定。例如：马超统领骑兵时攻击力大幅提升；曹仁守城或扎营时防御力显著增强；张辽面对数倍敌军时全队士气大涨；诸葛亮提升伏击/火攻成功率，并大幅优化调粮效率。<br><br>用对人、放对位置，才能最大化每位武将的价值。在武将详情中可查看具体技能效果。`},
      {label:'忠诚度', content:`每位武将都有忠诚度，受官职待遇、派系关系、主公魅力等因素影响。忠诚过低的武将可能被敌方挖角甚至叛逃。点击武将可查看忠诚度的详细分解。`},
      {label:'武将性情', content:`每位武将都有独特的<b>性情</b>标签，影响战场和内政表现。<b>傲</b>将单挑胜利士气更高但不受重用会不满；<b>莽</b>将更容易卷入单挑但也更容易中计；<b>沉稳</b>者在断粮或中伏时能稳住军心；<b>狡黠</b>者不易中伏但可能被敌方挖角；<b>刚毅</b>者防守更坚不易劝降；<b>仁厚</b>的太守利于民生恢复。善用武将性情，知人善任。`},
      {label:'派系与朝议', content:`势力内部存在政治派系，武将依出身和关系归属不同派系。派系影响力失衡时，弱势派系武将的忠诚会下降。<br><br>势力随城池增长会经历<b>军阀 → 一方之主 → 政权</b>三个阶段——根据地稳固后，宗族与元从的影响力下降，本地士族的话语权上升，派系格局会随之重塑。<br><br>你的外交和军事决策也会影响派系情绪——宣战让鹰派满意但鸽派不满，停战结盟则相反；任免官职会影响对应派系的凝聚力。定期触发的<b>朝议</b>会产生影响势力走向的提案，也是派系博弈的舞台。`}
    ] },

  // Page 4: 军事与战争
  { title:'军事与战争', highlight:'.rp', highlightTab:'mil', pos:'left', reveal:['.map-wrap','.rp'],
    body:`<p><b>兵者，国之大事。</b></p>
<p>在城池中征兵组建部队，指派武将统领。部队在地图上行军、作战、围城。在「军事」标签中管理所有野外部队。</p>`,
    details:[
      {label:'部队编制与兵种', content:`每支部队由1-3个分队组成，各分队有独立的武将、兵种和兵力。基础兵种有骑兵（机动强）、轻步兵（均衡）、弓兵（远程）、重步兵（防御）、攻城器（攻城必备）。<br><br>兵种搭配存在协同和冲突——合理搭配能获得战力加成，搭配不当则整支部队被削弱。特定城市还可招募<b>特色精锐兵种</b>（如虎豹骑、丹阳兵），战力远超普通兵。<br><br>武将对不同兵种有<b>适性</b>等级（S/A/B/C），适性越高带兵越强。除五种陆战兵种外，每位武将还有<b>水战适性</b>，决定水域战斗时的战力。增编分队时可查看候选武将的全部适性。<br><br><b>★ 武将四类</b>：每位武将分为⚔️武将、🏴统帅、🧠谋士、📜能臣四类。武将增加被动单挑率，统帅给全军士气+5且增幅队友效果，谋士增加伏击/劫营/火攻成功率，能臣扩展补给范围。编组时注意搭配——推荐1统帅+1武将+1谋士。`},
      {label:'战斗类型', content:`· <b>野战</b> — 部队在地图上遭遇时触发，正面对决。战场上可能自动触发<b>单挑</b>（由勇武决定胜负），单挑结果大幅影响双方士气<br>
· <b>围城与攻城</b> — 城市有城防值，守方依托城墙优势极大。建议先围城断补给、逐步削弱士气和城防，等时机成熟再总攻。缺少攻城器硬攻代价惨重<br>
· <b>伏击</b> — 选中部队可下达「伏击」指令，在隐蔽地形设伏等待敌军。被伏击方阵型散乱、士气骤降，先手优势巨大。成功率由双方武将<b>智谋对比</b>决定，失败有代价<br>
· <b>劫营</b> — 对扎营中的敌军发动突袭，效果类似伏击，同样受智谋影响。选中部队可下达「扎营」指令进入防御姿态，获得防御加成<br>
· <b>火攻</b> — 伏击、劫营和水战中可选择发动火攻，额外打击敌军兵力和士气，成功率受智谋影响<br>
· <b>水战</b> — 攻击水域中的敌军时触发。入水和上岸各耗一旬，水上每旬可航行2格。水中所有兵种统一为轻步数值，按武将<b>水战适性</b>决定战力，不可扎营、设伏、叫阵。东吴武将水战适性占优，可配合火攻焚船`},
      {label:'补给线', content:`部队远离己方城市时会<b>断粮</b>，战斗力和士气大幅下降。地图叠加层的「补给」视图可查看补给覆盖范围。围城时尤其注意保持补给线畅通——孤军深入是大忌。`},
      {label:'部曲与老兵', content:`部分武将拥有<b>部曲</b>——跟随将领多年的私人精锐，战力远高于普通新兵。部曲比例越高，分队的有效等级越高。<br><br>战胜后少量老兵可晋升为部曲，和平驻扎时也会缓慢转化——但增长都很慢，部曲是需要长期积累的精锐。<br><br><b>关键风险</b>：部队<b>解散</b>会让部曲永久消失（建议改用休整屯田保留），武将<b>阵亡/被俘/叛逃</b>则部曲归零。详细机制见「军事」面板顶部的 ❓ 帮助。`},
      {label:'休整屯田', content:`不需要的部队可以选择<b>休整屯田</b>——遣散回大城，武将释放回闲置池，兵员保留在该城，粮饷降至五分之一。关键是<b>部队等级得以保留</b>，需要时可随时以老兵身份复员重编，省去重新练级的时间成本。这是管理军费和保存精锐的重要手段。`},
      {label:'攻城后处置', content:`攻克敌城后可选择<b>安民</b>（恢复民心）、<b>劫掠</b>（获取金钱，损伤民心和人口）或<b>屠城</b>（大笔金钱，但民心崩溃、人口锐减、信誉重创）。你的选择会影响势力价值观和武将忠诚。`}
    ] },

  // Page 5: 外交与计谋
  { title:'外交与计谋', highlight:'.rp', highlightTab:'dip', pos:'left', reveal:['.map-wrap','.rp'],
    body:`<p><b>合纵连横，上兵伐谋。</b></p>
<p>在「外交」标签中与其他势力互动：送礼、互市、通商、结盟、宣战、收纳附庸。在「计谋」标签中施展计谋或派遣使者。能用外交解决的，不必刀兵相见。</p>`,
    details:[
      {label:'外交关系与信誉', content:`势力之间有<b>友好度</b>，受赠礼、战争、毁盟等行为影响自然漂移。宣战前可以准备<b>宣称</b>作为出兵的正当理由——没有宣称也能开战，但会严重损害你的<b>信誉</b>。信誉过低时，其他势力会提高警惕，不愿结盟甚至主动敌视你。频繁交战还会积累<b>血仇</b>，让和解越来越难。`},
      {label:'互市与通商', content:`<b>互市</b>：花金向友好势力购买马匹、铁矿、木材等特产资源，一次性交易，附带揭雾情报。<br><br>
<b>通商协定</b>：花500金与友好势力缔结通商，双方每旬持续获得金币收入。收入取决于对方城市数量，同盟关系和商港建筑可进一步放大。是稳定的长期收入来源。<br><br>
两者可以同时存在——互市买资源，通商赚金钱。`},
      {label:'通使（情报）', content:`在「计谋」标签中可派遣使者前往非敌对势力，成功后提升好感，并获取对方势力的模糊情报（兵力、财政、主力方向等）。是了解对手的重要渠道。`},
      {label:'计谋', content:`「计谋」标签提供多种计谋：<br>
· <b>斥候</b> — 侦查目标区域，获取精确军事情报<br>
· <b>间谍</b> — 降低敌方武将忠诚度，为挖角铺路<br>
· <b>流言</b> — 损害敌城民心，动摇后方稳定<br>
· <b>驱虎吞狼</b> — 挑拨两个势力交战<br>
· <b>二虎竞食</b> — 让两个敌方势力互相消耗<br><br>
计谋成功率受己方武将智谋影响，失败会损失信誉。好的谋士不只在战场上有用。`}
    ] },

  // Page 6: 价值观 ★ v151新增
  { title:'势力价值观', highlight:'.rp', highlightTab:'ethos', pos:'left', reveal:['.map-wrap','.rp'],
    body:`<p><b>你的势力是什么样的势力？</b></p>
<p>价值观是势力的"气质镜子"——天命、权柄、文治、武略、方略五个维度，完全由你的行为自然形成，不可直接操控。在「价值观」标签中查看倾向。</p>
<p>价值观不给正面buff，但立场不合的武将忠诚会下降，价值观相近的势力外交更亲近。走任何极端都有代价——这不是优化题，而是取舍。</p>` },

  // Page 7: 官职与科技（原Page 6）
  { title:'官职与科技', highlight:'.rp', highlightTab:'tech', pos:'left', reveal:['.map-wrap','.rp'],
    body:`<p>官职和科技是你强化势力的两大长线杠杆。</p>`,
    details:[
      {label:'官职', content:`在「官职」标签中任命武将担任官职。官职带来属性加成（如攻防、内政、外交），但消耗军饷。势力城池越多，可开设的官职等级越高，高级官职加成更强。<br><br>城池增多可逐步解锁<b>诸侯 → 侯 → 公 → 王</b>四档官位，档位越高可用官职越多、加成越强；势力实力达到一定程度后还可<b>称帝</b>，但会大幅冲击天命价值观，部分武将可能因价值观不合而忠诚下降。<br><br>官职也影响武将忠诚和派系政治——有官职的武将更不容易叛逃，任命某派系的武将也会提升该派系凝聚力。`},
      {label:'科技', content:`在「科技」标签中研究科技，覆盖军事、经济、兵种等多维度加成。科技研究需要时间和资源，不同分支适配不同战略路线——先强化骑兵突击，还是优先经济基础？<br><br>科技路径一旦选择就需要持续投入，规划好优先级至关重要。`}
    ] },

  // Page 8: 政策与旬令（原Page 7）
  { title:'政策与旬令', highlight:'#leftPanel', highlightExtra:'#btnTurn', pos:'right', reveal:['#leftPanel','.map-wrap','.rp','header'],
    body:`<p>左侧面板控制全势力级别的政策：</p>
<p>· <b>赋税</b> — 税率越高收入越多，但民心下降<br>
· <b>补员</b> — 调整野外部队的自动补员策略<br>
· <b>徭役</b> — 调控建设速度，中徭/重徭加速在建工程，但损民心和人口质量<br>
· <b>自动调粮</b> — 开启后系统自动在城市间调配粮草</p>
<p>准备就绪后，点击<b>「推进一旬」</b>结束回合。每旬（10天）结算经济、人口、部队移动、AI行动等。一年分春夏秋冬四季，季节影响粮食产出和行军条件。</p>` },

  // Page 9: 结语（原Page 8）
  { title:'天下大势，分久必合', highlight:null, pos:'center', reveal:['#leftPanel','.map-wrap','.rp','header'],
    body:`<p>游戏进程中会触发各类<b>事件</b>——五虎上将受封、出师北伐、名士游历、天灾疫病……每个事件都提供不同选项，你的抉择将影响势力走向。</p>
<p>没有标准答案。去探索吧。</p>`,
    isFinal:true }
];

let _tutPage = 0;
let _tutHighlighted = [];
const _TUT_SECTIONS = ['#leftPanel', '.map-wrap', '.rp', 'header'];

function showTutorial(){
  _tutPage = 0;
  document.getElementById('tutOverlay')?.remove();
  const ov = document.createElement('div');
  ov.id = 'tutOverlay';
  ov.className = 'tut-overlay';
  ov.innerHTML = '<div class="tut-dim" onclick="closeTutorial()"></div><div class="tut-card" id="tutCard"></div>';
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));
  _renderTutPage();
}

function closeTutorial(){
  G.tutorialDone = true;
  _clearTutHighlight();
  // 清除所有section dim
  _TUT_SECTIONS.forEach(sel => {
    const el = document.querySelector(sel);
    if(el) el.classList.remove('tut-section-dim');
  });
  const ov = document.getElementById('tutOverlay');
  if(ov){ ov.classList.remove('show'); setTimeout(()=>ov.remove(), 400); }
}

function _clearTutHighlight(){
  _tutHighlighted.forEach(el => el.classList.remove('tut-highlight'));
  _tutHighlighted = [];
}

function _applyTutHighlight(page){
  _clearTutHighlight();
  // 切换tab如果需要
  if(page.highlightTab) switchTab(page.highlightTab);

  // 计算哪些section应该被dim（不在reveal列表中的）
  const revealed = page.reveal || [];
  _TUT_SECTIONS.forEach(sel => {
    const el = document.querySelector(sel);
    if(!el) return;
    if(revealed.includes(sel)){
      el.classList.remove('tut-section-dim');
    } else {
      el.classList.add('tut-section-dim');
    }
  });

  // 高亮主目标
  if(page.highlight){
    const el = document.querySelector(page.highlight);
    if(el){ el.classList.add('tut-highlight'); _tutHighlighted.push(el); }
  }
  // 高亮额外目标
  if(page.highlightExtra){
    const el2 = document.querySelector(page.highlightExtra);
    if(el2){ el2.classList.add('tut-highlight'); _tutHighlighted.push(el2); }
  }
}

function _renderTutPage(){
  const card = document.getElementById('tutCard');
  if(!card) return;
  const page = TUT_PAGES[_tutPage];
  if(!page) return;

  // 定位卡片
  _positionTutCard(page);
  // 高亮
  _applyTutHighlight(page);

  // 构建详情展开块
  let detailsHtml = '';
  if(page.details){
    page.details.forEach((d,i) => {
      detailsHtml += `<div class="tut-detail">
        <div class="tut-detail-btn" onclick="this.classList.toggle('open')">
          <span class="arrow">▸</span> ${d.label}
        </div>
        <div class="tut-detail-content">${d.content}</div>
      </div>`;
    });
  }

  // 导航
  const dots = TUT_PAGES.map((_,i) =>
    `<div class="tut-dot${i===_tutPage?' active':''}" onclick="_tutPage=${i};_renderTutPage()"></div>`
  ).join('');

  const prevBtn = _tutPage > 0
    ? `<div class="tut-nav-btn" onclick="_tutPage--;_renderTutPage()">◂ 上一页</div>`
    : `<div style="width:80px"></div>`;

  const nextBtn = page.isFinal
    ? `<div class="tut-nav-btn primary" onclick="closeTutorial()">开始征程 ▸</div>`
    : `<div class="tut-nav-btn" onclick="_tutPage++;_renderTutPage()">下一页 ▸</div>`;

  card.innerHTML = `
    <div class="tut-skip" onclick="closeTutorial()">✕ 跳过</div>
    <div class="tut-card-title">${page.title}</div>
    <div class="tut-card-body">
      ${page.body}
      ${detailsHtml}
    </div>
    <div class="tut-nav">
      ${prevBtn}
      <div class="tut-dots">${dots}</div>
      ${nextBtn}
    </div>`;
}

function _positionTutCard(page){
  const card = document.getElementById('tutCard');
  if(!card) return;
  // 重置定位
  card.style.top = ''; card.style.bottom = ''; card.style.left = ''; card.style.right = '';
  card.style.transform = '';

  if(page.pos === 'center' || !page.highlight){
    card.style.top = '50%'; card.style.left = '50%';
    card.style.transform = 'translate(-50%,-50%)';
  } else if(page.pos === 'left'){
    // 高亮右侧 → 卡片放左边
    card.style.top = '70px'; card.style.left = '16px';
  } else if(page.pos === 'right'){
    // 高亮左侧 → 卡片放右边
    card.style.top = '70px'; card.style.right = '16px';
  }
}

// ── 开局势力选择（改造：加返回按钮）──────────────────
function showFactionSelect(){
  document.getElementById('factionSelectOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'factionSelectOverlay';
  overlay.style.cssText = `position:fixed;inset:0;background:#ede4d0;z-index:500;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:'Noto Serif SC',serif;`;
  const facData = [
    {id:'wei', name:'魏', fullName:'曹魏', color:'#1a5f8a',
     desc:'中原大国，兵多粮足，人口最盛。国力雄厚，适合稳扎稳打，最终统一之路最为宽广。',
     leader:'曹操', capital:'许昌'},
    {id:'shu', name:'蜀', fullName:'蜀汉', color:'#1a7a3a',
     desc:'汉室正统，以义立国。益州险固，粮道艰难。需以奇谋弥补国力之差，北伐是唯一出路。',
     leader:'刘备', capital:'成都'},
    {id:'wu', name:'吴', fullName:'东吴', color:'#a82a1a',
     desc:'坐拥江东，港口通商，金钱充裕。水师天下无双，长江天险为屏障，富庶之国徐图天下。',
     leader:'孙权', capital:'建业'},
    {id:'nanman', name:'蛮', fullName:'南蛮', color:'#8b6914',
     desc:'南中蛮族，僻处建宁一隅。兵少将寡，初为蜀之附庸。需在三国夹缝中求存，地狱难度。',
     leader:'孟获', capital:'建宁'},
  ];
  overlay.innerHTML = `
    <div style="color:var(--ink);font-size:24px;letter-spacing:8px;margin-bottom:6px;font-family:'ZCOOL XiaoWei','Noto Serif SC',serif">苍生问策</div>
    <div style="color:var(--ink-ll);font-size:11px;letter-spacing:3px;margin-bottom:36px">选择你的势力</div>
    <div style="display:flex;gap:20px;margin-bottom:36px">
      ${facData.map(f=>`
        <div onclick="startAs('${f.id}')" style="cursor:pointer;border:1px solid ${f.color}40;
          background:rgba(255,252,245,.6);padding:22px 20px;width:190px;transition:all .25s;border-radius:3px;
          box-shadow:0 2px 12px rgba(0,0,0,.06)"
          onmouseover="this.style.borderColor='${f.color}';this.style.background='rgba(255,252,245,.95)';this.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'"
          onmouseout="this.style.borderColor='${f.color}40';this.style.background='rgba(255,252,245,.6)';this.style.boxShadow='0 2px 12px rgba(0,0,0,.06)'">
          <div style="color:${f.color};font-size:36px;text-align:center;margin-bottom:8px;font-family:'ZCOOL XiaoWei','Noto Serif SC',serif">${f.name}</div>
          <div style="color:${f.color};font-size:13px;text-align:center;letter-spacing:2px;margin-bottom:14px">${f.fullName}</div>
          <div style="color:rgba(44,36,22,.55);font-size:9px;line-height:1.8;margin-bottom:14px">${f.desc}</div>
          <div style="border-top:1px solid ${f.color}25;padding-top:8px;font-size:9px;color:var(--ink-ll)">
            <div>主公：${f.leader}</div>
            <div>都城：${f.capital}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="ts-btn" onclick="document.getElementById('factionSelectOverlay')?.remove();showScenarioSelect()" style="font-size:11px;width:140px;padding:9px 0">◂ 返回剧本选择</button>`;
  document.body.appendChild(overlay);
}

// M2 startAs() 已抽离到 src/core/main.js (Session 3.4)

// ── 存档/读档面板 ──────────────────────────────────
// mode: 'save' | 'load' | 'load-title' (从主菜单读档)
let _saveLoadMode = 'save';
let _saveLoadSelSlot = -1;

function showSaveLoadPanel(mode){
  _saveLoadMode = mode || 'save';
  _saveLoadSelSlot = -1;
  document.getElementById('saveOverlay')?.remove();

  const ov = document.createElement('div');
  ov.id = 'saveOverlay';
  ov.className = 'save-overlay';
  ov.onclick = e => { if(e.target === ov) closeSaveLoadPanel(); };

  const isSave = _saveLoadMode === 'save';
  const title = isSave ? '存 档' : '讀 取 存 檔';

  ov.innerHTML = `
    <div class="save-panel">
      <div class="sp-title">${title}</div>
      <div id="saveSlotList" style="min-height:200px;display:flex;align-items:center;justify-content:center">
        <div style="color:var(--ink-ll);font-size:10px">加载存档信息...</div>
      </div>
      <div class="sp-actions">
        ${isSave ? `
          <button id="spBtnDelete" onclick="_onSlotDelete()" class="danger" disabled>删除存档</button>
          <button id="spBtnAction" onclick="_onSlotSave()" disabled>保存至此槽位</button>
        ` : `
          <button id="spBtnDelete" onclick="_onSlotDelete()" class="danger" disabled>删除存档</button>
          <button id="spBtnAction" onclick="_onSlotLoad()" disabled>读取存档</button>
        `}
        <button onclick="closeSaveLoadPanel()">关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));

  _refreshSlotList();
}

async function _refreshSlotList(){
  const list = document.getElementById('saveSlotList');
  if(!list) return;

  let slots;
  try {
    slots = await _getSaveSlots();
  } catch(e){
    list.innerHTML = '<div style="color:#c03030;font-size:10px">存储系统不可用</div>';
    return;
  }

  const facColors = {wei:'#1a5f8a',shu:'#1a7a3a',wu:'#a82a1a',nanman:'#8b6914'};
  list.innerHTML = slots.map(s => {
    if(s.exists){
      const col = facColors[s.fac] || 'var(--ink)';
      return `<div class="save-slot" data-slot="${s.idx}" onclick="_selectSlot(${s.idx})">
        <div class="slot-num">${s.idx}</div>
        <div class="slot-info">
          <div class="slot-fac" style="color:${col}">${s.facName}</div>
          <div class="slot-detail">${s.yearStr} · ${s.seasonStr} · 第${s.turn}旬 · ${s.cityCount}城</div>
        </div>
        <div class="slot-time">${s.savedAt}</div>
      </div>`;
    } else {
      return `<div class="save-slot" data-slot="${s.idx}" onclick="_selectSlot(${s.idx})">
        <div class="slot-num">${s.idx}</div>
        <div class="slot-info"><div class="slot-empty">— 空 —</div></div>
      </div>`;
    }
  }).join('');
  _saveLoadSelSlot = -1;
  _updateSlotButtons();
}

function _selectSlot(idx){
  _saveLoadSelSlot = idx;
  document.querySelectorAll('.save-slot').forEach(el => {
    el.classList.toggle('sel', parseInt(el.dataset.slot) === idx);
  });
  _updateSlotButtons();
}

function _updateSlotButtons(){
  const actionBtn = document.getElementById('spBtnAction');
  const deleteBtn = document.getElementById('spBtnDelete');
  if(!actionBtn) return;

  const isSave = _saveLoadMode === 'save';
  const hasSlot = _saveLoadSelSlot > 0;

  if(isSave){
    actionBtn.disabled = !hasSlot;
  } else {
    // load模式：只有有存档的槽位才能读取
    const slotEl = document.querySelector(`.save-slot[data-slot="${_saveLoadSelSlot}"] .slot-fac`);
    actionBtn.disabled = !hasSlot || !slotEl;
  }
  // 删除按钮：只有有存档的槽位才能删除
  const slotHasData = document.querySelector(`.save-slot[data-slot="${_saveLoadSelSlot}"] .slot-fac`);
  if(deleteBtn) deleteBtn.disabled = !hasSlot || !slotHasData;
}

async function _onSlotSave(){
  if(_saveLoadSelSlot < 1) return;
  // 检查是否有存档，有则确认覆盖
  const slotHasData = document.querySelector(`.save-slot[data-slot="${_saveLoadSelSlot}"] .slot-fac`);
  if(slotHasData && !confirm(`槽位 ${_saveLoadSelSlot} 已有存档，确定覆盖？`)) return;

  const ok = await saveToSlot(_saveLoadSelSlot);
  if(ok){
    showNotif('存档成功', 'success');
    await _refreshSlotList();
    // 重新高亮
    _selectSlot(_saveLoadSelSlot);
  } else {
    showNotif('存档失败', 'error');
  }
}

async function _onSlotLoad(){
  if(_saveLoadSelSlot < 1) return;
  const slotHasData = document.querySelector(`.save-slot[data-slot="${_saveLoadSelSlot}"] .slot-fac`);
  if(!slotHasData){ showNotif('该槽位无存档', 'error'); return; }

  if(!confirm(`确定读取槽位 ${_saveLoadSelSlot} 的存档？当前未保存的进度将丢失。`)) return;

  const ok = await loadFromSlot(_saveLoadSelSlot);
  if(ok){
    closeSaveLoadPanel();
    // 从主菜单读档时需要移除标题画面
    document.getElementById('titleScreen')?.remove();
    document.getElementById('scenarioScreen')?.remove();
    document.getElementById('factionSelectOverlay')?.remove();
    // ★ v135fix: 确保地形数据已构建（从主菜单直接读档时未经initGame）
    if(!HEX_TERRAIN || Object.keys(HEX_TERRAIN).length === 0) buildHexTerrain();
    if(!HEX_CITY || Object.keys(HEX_CITY).length === 0) buildHexTerrain();
    ensureCityNeighbors();
    // 重建游戏界面
    const mr = document.getElementById('mapRoot');
    if(mr) mr.remove();
    _staticMapCache = ''; // 强制重建地图底层缓存
    invalidateCityCache();
    invalidateFogCache();
    _ovTerritoryCache = null; // 清理overlay缓存
    _ovBaseCache = null;
    renderAll();
    showNotif('读档成功', 'success');
  } else {
    showNotif('读档失败', 'error');
  }
}

async function _onSlotDelete(){
  if(_saveLoadSelSlot < 1) return;
  if(!confirm(`确定删除槽位 ${_saveLoadSelSlot} 的存档？此操作不可恢复。`)) return;
  const ok = await deleteSlot(_saveLoadSelSlot);
  if(ok){
    showNotif('已删除', 'success');
    await _refreshSlotList();
  }
}

function closeSaveLoadPanel(){
  const ov = document.getElementById('saveOverlay');
  if(ov){
    ov.classList.remove('show');
    setTimeout(() => ov.remove(), 200);
  }
}

// ════════════════════════════════════════════════════════════════════
// ── R4.5.c 结局 + Claude AI UI (v181 L11555-L11985) ──
// ════════════════════════════════════════════════════════════════════


/** 胜利/失败全屏遮罩 */
function showGameEndOverlay(isVictory, winnerFid){
  const fid = isVictory ? G.playerFac : (winnerFid || G.playerFac);
  const facColor = getFactionDef(fid)?.color || '#2c2416';
  const facName = getFactionDef(fid)?.full || '?';
  const playerFacName = getFactionDef(G.playerFac)?.full || '?';

  // 统计数据
  const turnCount = G.turn;
  const yearStr = YEARS[G.year] || `第${G.year+1}年`;
  const seasonStr = SEASONS[G.seasonIdx] || '';
  const playerCities = Object.values(G.cities).filter(c => c.fac === G.playerFac).length;
  const playerTroops = G.factions[G.playerFac]?.totalTroops || 0;
  const playerPop = G.factions[G.playerFac]?.totalPop || 0;
  const playerGens = (G.generals[G.playerFac] || []).length;

  // 淘汰记录
  const elimRecords = getScenarioFactions()
    .filter(f => f !== (isVictory ? G.playerFac : winnerFid) && G.factions[f]?._eliminatedTurn)
    .map(f => `${getFactionDef(f)?.name||f} 覆灭于第${G.factions[f]._eliminatedTurn}旬`)
    .join('　·　');

  const overlay = document.createElement('div');
  overlay.id = 'gameEndOverlay';
  overlay.style.cssText = `position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0);transition:background 1.5s ease;
    font-family:'Noto Serif SC',serif;`;

  const mainTitle = isVictory ? '天下一统' : '大势已去';
  const subTitle = isVictory
    ? `${playerFacName}扫平四海，一统山河`
    : (winnerFid ? `${facName}横扫天下，${playerFacName}已成旧梦` : `${playerFacName}城池尽失，兵马殆尽`);

  const sealChar = isVictory ? '统' : '亡';
  const sealColor = isVictory ? facColor : '#8b2020';

  overlay.innerHTML = `
    <div id="geCard" style="opacity:0;transform:scale(0.92) translateY(20px);transition:all 1.2s cubic-bezier(0.23,1,0.32,1);
      background:linear-gradient(165deg, #f5eee1 0%, #ede4d0 40%, #e8dfc8 100%);
      border:1px solid rgba(80,65,40,.25);border-radius:4px;padding:0;width:420px;max-width:90vw;
      box-shadow:0 20px 80px rgba(0,0,0,.25), 0 0 0 1px rgba(255,252,245,.3) inset;position:relative;overflow:hidden">

      <!-- 纹理底纹 -->
      <div style="position:absolute;inset:0;opacity:.04;
        background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22><rect width=%224%22 height=%224%22 fill=%22%23000%22 fill-opacity=%22.03%22/><rect x=%221%22 y=%221%22 width=%222%22 height=%222%22 fill=%22%23000%22 fill-opacity=%22.02%22/></svg>');
        pointer-events:none"></div>

      <!-- 顶部色带 -->
      <div style="height:4px;background:linear-gradient(90deg, ${facColor}00, ${facColor}, ${facColor}00)"></div>

      <!-- 印章 -->
      <div style="position:absolute;top:28px;right:28px;width:64px;height:64px;
        border:3px solid ${sealColor}40;border-radius:8px;display:flex;align-items:center;justify-content:center;
        font-family:'ZCOOL XiaoWei','Noto Serif SC',serif;font-size:32px;color:${sealColor}50;
        transform:rotate(-12deg);letter-spacing:0">${sealChar}</div>

      <!-- 主体内容 -->
      <div style="padding:40px 36px 32px">

        <!-- 标题 -->
        <div style="font-family:'ZCOOL XiaoWei','Noto Serif SC',serif;font-size:28px;color:var(--ink);
          letter-spacing:10px;margin-bottom:6px">${mainTitle}</div>
        <div style="font-size:11px;color:${facColor};letter-spacing:2px;margin-bottom:28px;line-height:1.6">${subTitle}</div>

        <!-- 分隔线 -->
        <div style="height:1px;background:linear-gradient(90deg, rgba(80,65,40,0), rgba(80,65,40,.2), rgba(80,65,40,0));margin-bottom:22px"></div>

        <!-- 统计信息 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin-bottom:22px">
          <div style="font-size:9px;color:var(--ink-ll);letter-spacing:1px">
            <span style="display:block;font-size:8px;margin-bottom:2px;opacity:.6">时间</span>
            ${yearStr} · ${seasonStr} · 第${turnCount}旬
          </div>
          <div style="font-size:9px;color:var(--ink-ll);letter-spacing:1px">
            <span style="display:block;font-size:8px;margin-bottom:2px;opacity:.6">疆域</span>
            ${playerCities} 城
          </div>
          <div style="font-size:9px;color:var(--ink-ll);letter-spacing:1px">
            <span style="display:block;font-size:8px;margin-bottom:2px;opacity:.6">兵力</span>
            ${fmt(playerTroops)}
          </div>
          <div style="font-size:9px;color:var(--ink-ll);letter-spacing:1px">
            <span style="display:block;font-size:8px;margin-bottom:2px;opacity:.6">人口</span>
            ${fmt(playerPop)}
          </div>
          <div style="font-size:9px;color:var(--ink-ll);letter-spacing:1px">
            <span style="display:block;font-size:8px;margin-bottom:2px;opacity:.6">麾下武将</span>
            ${playerGens} 人
          </div>
          <div style="font-size:9px;color:var(--ink-ll);letter-spacing:1px">
            <span style="display:block;font-size:8px;margin-bottom:2px;opacity:.6">历程</span>
            ${elimRecords || '—'}
          </div>
        </div>

        <!-- 分隔线 -->
        <div style="height:1px;background:linear-gradient(90deg, rgba(80,65,40,0), rgba(80,65,40,.15), rgba(80,65,40,0));margin-bottom:22px"></div>

        <!-- 按钮 -->
        <div style="display:flex;gap:12px;justify-content:center">
          <button onclick="document.getElementById('gameEndOverlay')?.remove()"
            style="padding:8px 24px;background:transparent;border:1px solid rgba(80,65,40,.25);
              color:var(--ink-l);font-family:'Noto Serif SC',serif;font-size:11px;letter-spacing:2px;
              cursor:pointer;transition:all .2s;border-radius:2px"
            onmouseover="this.style.borderColor='rgba(80,65,40,.5)';this.style.color='var(--ink)'"
            onmouseout="this.style.borderColor='rgba(80,65,40,.25)';this.style.color='var(--ink-l)'">
            继续观战
          </button>
          <button onclick="document.getElementById('gameEndOverlay')?.remove();backToTitle()"
            style="padding:8px 24px;background:linear-gradient(135deg,${facColor}dd,${facColor});border:none;
              color:#f5eee1;font-family:'Noto Serif SC',serif;font-size:11px;letter-spacing:2px;font-weight:700;
              cursor:pointer;transition:all .2s;border-radius:2px;
              box-shadow:0 2px 8px ${facColor}40"
            onmouseover="this.style.opacity='0.85'"
            onmouseout="this.style.opacity='1'">
            再战天下
          </button>
        </div>
      </div>

      <!-- 底部色带 -->
      <div style="height:2px;background:linear-gradient(90deg, ${facColor}00, ${facColor}40, ${facColor}00)"></div>
    </div>`;

  document.body.appendChild(overlay);

  // 入场动画
  requestAnimationFrame(() => {
    overlay.style.background = 'rgba(20,16,10,0.55)';
    const card = document.getElementById('geCard');
    if(card){
      card.style.opacity = '1';
      card.style.transform = 'scale(1) translateY(0)';
    }
  });
}


// Claude AI 决策与派发层 (C+D+E+F+G+H+I+J+K) 已抽离到 src/core/claude_ai.js (Session 3.3 / 选项 A)

// ── 辅助：名称→城市ID / 名称→势力ID ──
function _resolveCityId(name) {
  if (G.cities[name]) return name;
  const entry = Object.values(G.cities).find(c => c.name === name);
  return entry ? entry.id : null;
}
function _resolveFacId(name) {
  if (G.factions[name]) return name;
  const entry = Object.entries(getAllFactions()).find(([k, v]) => v.name === name || v.full === name);
  return entry ? entry[0] : null;
}
function _findUnit(fid, leaderName) {
  return G.units.find(u => u.fac === fid && u.squads.some(sq => sq.genName === leaderName));
}
function _genInFac(genName, fid) {
  return (G.generals[fid] || []).some(g => g.name === genName);
}
function _genDeployed(genName, fid) {
  return G.units.filter(u => u.fac === fid).some(u => u.squads.some(sq => sq.genName === genName));
}

// ════════════════════════════
// AI _exec 入口已按 (a) 原则归位到对应 chain (sprint batch-25 ~ 28)
// ════════════════════════════
// 经济链 E9 (_execBuild + _execSetTax + _execSetCorvee + _execTransferFood + _execToggleResupply
//           L13383-L13455) 已抽离到 src/chains/economy.js (sprint batch-28)
// 武将链 GEN16 (_execSetPrefect L13433-L13442 + _execSetStrategist L13505-L13513 +
//              RecruitWild/Poach L13516-L13542) 已抽离到 src/chains/general.js (sprint batch-26+27)
// 政治链 P7 (_execAppointPost + _execDismissPost L13470-L13503) 已抽离到 src/chains/politics.js (sprint batch-27)
// 政治链 P8 (_execResearch L13464-L13481) 已抽离到 src/chains/politics.js (sprint batch-28)

// 外交链 D7 (AI _exec 外交主 7 + 计谋 5, L13395-L13605) 已抽离到 src/chains/diplomacy.js (sprint batch-29)

// 军事链 MIL9 (AI _exec 8 funcs, L13395-L13536) 已抽离到 src/chains/military.js (sprint batch-30)
// 政治链 P6 (_execEnthrone) 已抽离到 src/chains/politics.js (sprint batch-25 D-121)
// _exec 归位架构债 sprint 收官: 35 个 dispatcher targets 全数归位到 chain (batch-19/25/26~30)

// ═══════════════════════════════════════
// ★ v157: runAI async化 + Claude分支
// ═══════════════════════════════════════

/** ── Claude AI开关（UI + 控制台） ── */
function toggleClaudeAI() {
  if (!_claudeAI.enabled) {
    // 开启：检查是否有Key
    if (!_claudeAI.apiKey) {
      _showApiKeyModal();
      return;
    }
    _claudeAI.enabled = true;
  } else {
    _claudeAI.enabled = false;
  }
  _updateAIToggleBtn();
  const msg = _claudeAI.enabled ? '🤖 Claude AI 已启用 — AI势力将由Claude决策' : '🤖 已切回规则AI';
  log(msg, 'event');
  showNotif(msg, _claudeAI.enabled ? 'ok' : 'warn');
}
function _showApiKeyModal() {
  let m = document.getElementById('aiKeyModal');
  if (m) { m.style.display = 'flex'; _populateApiModal(); return; }
  m = document.createElement('div');
  m.id = 'aiKeyModal';
  m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
  m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
  m.innerHTML = `<div style="background:rgba(245,238,225,.98);border:1px solid rgba(92,74,50,.4);border-radius:6px;padding:20px 24px;min-width:360px;max-width:440px;box-shadow:0 8px 32px rgba(0,0,0,.6)">
    <div style="font-family:'Noto Serif SC',serif;font-size:14px;color:var(--ink-l);margin-bottom:12px;border-bottom:1px solid rgba(80,65,40,.14);padding-bottom:8px">🤖 AI 决策设置</div>
    <div style="font-size:10px;color:rgba(92,74,50,.6);margin-bottom:12px;line-height:1.5">
      支持 Anthropic / OpenAI / 中转站等各类 API。<br>
      Key 仅存在浏览器内存中，刷新后需重新输入。<br>
      <span style="color:rgba(60,130,60,.7)">已内置 CORS 代理，itch.io 可直接使用。</span>
    </div>
    <div style="margin-bottom:8px">
      <div style="font-size:9px;color:rgba(92,74,50,.5);margin-bottom:3px;font-weight:600">API 格式</div>
      <select id="aiFormatSelect" onchange="_onApiFormatChange()" style="width:100%;padding:6px 8px;font-size:10px;border:1px solid rgba(80,65,40,.25);border-radius:3px;background:rgba(255,255,255,.6);font-family:'Noto Serif SC',serif">
        <option value="anthropic">Anthropic（Claude 官方 / 兼容中转）</option>
        <option value="openai">OpenAI 兼容（GPT / OpenRouter / one-api）</option>
      </select>
    </div>
    <div style="margin-bottom:8px">
      <div style="font-size:9px;color:rgba(92,74,50,.5);margin-bottom:3px;font-weight:600">API 地址</div>
      <input id="aiEndpointInput" type="text" style="width:100%;padding:6px 8px;font-size:10px;font-family:monospace;border:1px solid rgba(80,65,40,.25);border-radius:3px;background:rgba(255,255,255,.6);box-sizing:border-box;color:var(--ink)" />
    </div>
    <div style="margin-bottom:8px">
      <div style="font-size:9px;color:rgba(92,74,50,.5);margin-bottom:3px;font-weight:600">模型</div>
      <select id="aiModelSelect" onchange="_onModelSelectChange()" style="width:100%;padding:6px 8px;font-size:10px;border:1px solid rgba(80,65,40,.25);border-radius:3px;background:rgba(255,255,255,.6);font-family:'Noto Serif SC',serif">
        <option value="anthropic/claude-sonnet-4">Claude Sonnet 4（推荐，性价比高）</option>
        <option value="anthropic/claude-sonnet-4-20250514">Claude Sonnet 4 (20250514)</option>
        <option value="anthropic/claude-opus-4">Claude Opus 4（最强，贵5-10倍）</option>
        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet（便宜）</option>
        <option value="google/gemini-2.5-flash-preview">Gemini 2.5 Flash（极便宜）</option>
        <option value="_custom">自定义...</option>
      </select>
      <input id="aiModelInput" type="text" placeholder="自定义模型名" style="width:100%;padding:6px 8px;font-size:10px;font-family:monospace;border:1px solid rgba(80,65,40,.25);border-radius:3px;background:rgba(255,255,255,.6);box-sizing:border-box;color:var(--ink);margin-top:4px;display:none" />
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:9px;color:rgba(92,74,50,.5);margin-bottom:3px;font-weight:600">API Key</div>
      <input id="aiKeyInput" type="password" placeholder="sk-ant-... / sk-..." style="width:100%;padding:6px 8px;font-size:10px;font-family:monospace;border:1px solid rgba(80,65,40,.25);border-radius:3px;background:rgba(255,255,255,.6);box-sizing:border-box;color:var(--ink)" />
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button onclick="document.getElementById('aiKeyModal').style.display='none'" style="padding:6px 16px;background:none;border:1px solid rgba(80,65,40,.2);color:var(--ink-l);font-family:'Noto Serif SC',serif;font-size:10px;cursor:pointer;border-radius:3px">取消</button>
      <button onclick="_confirmApiKey()" style="padding:6px 16px;background:rgba(46,120,180,.15);border:1px solid rgba(46,120,180,.4);color:#1a6fa0;font-family:'Noto Serif SC',serif;font-size:10px;cursor:pointer;border-radius:3px;font-weight:600">启用 AI</button>
    </div>
  </div>`;
  document.body.appendChild(m);
  _populateApiModal();
}
function _populateApiModal() {
  const fmt = document.getElementById('aiFormatSelect');
  const ep = document.getElementById('aiEndpointInput');
  const sel = document.getElementById('aiModelSelect');
  const inp = document.getElementById('aiModelInput');
  const key = document.getElementById('aiKeyInput');
  if (fmt) fmt.value = _claudeAI.apiFormat || 'anthropic';
  if (ep) ep.value = _claudeAI.endpoint || 'https://api.anthropic.com/v1/messages';
  if (sel) {
    // Check if current model matches a preset
    const opts = [...sel.options].map(o => o.value);
    if (opts.includes(_claudeAI.model)) {
      sel.value = _claudeAI.model;
      if (inp) inp.style.display = 'none';
    } else {
      sel.value = '_custom';
      if (inp) { inp.style.display = ''; inp.value = _claudeAI.model || ''; }
    }
  }
  if (key) key.value = _claudeAI.apiKey || '';
}
function _onModelSelectChange() {
  const sel = document.getElementById('aiModelSelect');
  const inp = document.getElementById('aiModelInput');
  if (!sel || !inp) return;
  if (sel.value === '_custom') { inp.style.display = ''; inp.focus(); }
  else { inp.style.display = 'none'; }
}
function _onApiFormatChange() {
  const fmt = document.getElementById('aiFormatSelect')?.value;
  const ep = document.getElementById('aiEndpointInput');
  const sel = document.getElementById('aiModelSelect');
  const inp = document.getElementById('aiModelInput');
  if (fmt === 'openai') {
    if (ep && (!ep.value || ep.value.includes('anthropic.com'))) ep.value = 'https://openrouter.ai/api/v1/chat/completions';
    if (sel) { sel.value = 'anthropic/claude-sonnet-4'; if (inp) inp.style.display = 'none'; }
  } else {
    if (ep && (!ep.value || ep.value.includes('openrouter') || ep.value.includes('chat/completions'))) ep.value = 'https://api.anthropic.com/v1/messages';
    if (sel) { sel.value = '_custom'; if (inp) { inp.style.display = ''; inp.value = 'claude-sonnet-4-20250514'; } }
  }
}
function _confirmApiKey() {
  const key = (document.getElementById('aiKeyInput')?.value || '').trim();
  const endpoint = (document.getElementById('aiEndpointInput')?.value || '').trim();
  const sel = document.getElementById('aiModelSelect');
  const inp = document.getElementById('aiModelInput');
  const model = (sel?.value === '_custom' ? (inp?.value || '').trim() : sel?.value) || '';
  const fmt = document.getElementById('aiFormatSelect')?.value || 'anthropic';
  if (!key) { showNotif('请输入 API Key', 'warn'); return; }
  if (!endpoint) { showNotif('请输入 API 地址', 'warn'); return; }
  if (!model) { showNotif('请选择或输入模型', 'warn'); return; }
  _claudeAI.apiKey = key;
  _claudeAI.endpoint = endpoint;
  _claudeAI.apiFormat = fmt;
  _claudeAI.model = model;
  _claudeAI.enabled = true;
  document.getElementById('aiKeyModal').style.display = 'none';
  _updateAIToggleBtn();
  const fmtLabel = fmt === 'openai' ? 'OpenAI兼容' : 'Anthropic';
  log(`🤖 AI 已启用（${fmtLabel}）— ${endpoint.replace(/https?:\/\//, '').split('/')[0]}`, 'event');
  showNotif('🤖 AI 已启用！下一旬生效', 'ok');
}
function _updateAIToggleBtn() {
  const btn = document.getElementById('btnClaudeAI');
  if (!btn) return;
  if (_claudeAI.enabled) {
    btn.textContent = '🤖 Claude AI';
    btn.classList.add('ai-on');
  } else {
    btn.textContent = '🤖 规则AI';
    btn.classList.remove('ai-on');
  }
}
function enableClaudeAI() {
  _claudeAI.enabled = true;
  _updateAIToggleBtn();
  console.log('[ClaudeAI] ✅ Claude AI已启用（Artifact模式）');
}
function disableClaudeAI() {
  _claudeAI.enabled = false;
  _updateAIToggleBtn();
  console.log('[ClaudeAI] ❌ Claude AI已禁用，回退到规则AI');
}

/** ── v158: API连接测试（控制台输入 pingClaudeAPI()） ── */
async function pingClaudeAPI() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('[ClaudeAI PING] API连接诊断');
  console.log(`${'='.repeat(60)}`);
  console.log('配置:', {
    enabled: _claudeAI.enabled,
    format: _claudeAI.apiFormat,
    endpoint: _claudeAI.endpoint,
    model: _claudeAI.model,
    hasKey: !!_claudeAI.apiKey,
    keyPrefix: _claudeAI.apiKey ? _claudeAI.apiKey.slice(0, 12) + '...' : '(空)',
  });

  if (!_claudeAI.apiKey) {
    console.error('❌ 未设置 API Key。请先通过 🤖 按钮设置，或控制台输入 setClaudeKey("sk-...")');
    return;
  }
  if (!_claudeAI.endpoint) {
    console.error('❌ 未设置 API 地址');
    return;
  }

  const fmt = _claudeAI.apiFormat || 'anthropic';
  let body, headers = { 'Content-Type': 'application/json' };

  if (fmt === 'openai') {
    headers['Authorization'] = 'Bearer ' + _claudeAI.apiKey;
    body = JSON.stringify({
      model: _claudeAI.model,
      max_tokens: 20,
      messages: [{ role: 'user', content: '回复OK' }],
    });
  } else {
    headers['x-api-key'] = _claudeAI.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    body = JSON.stringify({
      model: _claudeAI.model,
      max_tokens: 20,
      messages: [{ role: 'user', content: '回复OK' }],
    });
  }

  console.log(`[PING] 发送请求到 ${_claudeAI.endpoint} (${fmt}格式, model=${_claudeAI.model})...`);
  const t0 = performance.now();

  try {
    const r = await fetch(_claudeAI.endpoint, { method: 'POST', headers, body });
    const elapsed = Math.round(performance.now() - t0);
    console.log(`[PING] HTTP ${r.status} ${r.statusText}  (${elapsed}ms)`);

    const text = await r.text();
    if (!r.ok) {
      console.error(`❌ API返回错误 ${r.status}:\n${text.slice(0, 500)}`);
      if (r.status === 401) console.error('→ Key无效或过期，请检查');
      if (r.status === 403) console.error('→ 权限不足，可能是CORS或Key权限问题');
      if (r.status === 404) console.error('→ 地址错误，请检查endpoint');
      if (r.status === 429) console.error('→ 限流，请稍后再试');
      return;
    }

    let data;
    try { data = JSON.parse(text); } catch { console.error('❌ 返回非JSON:', text.slice(0, 300)); return; }

    // 提取回复文本
    let reply = '';
    if (fmt === 'openai') {
      reply = data.choices?.[0]?.message?.content || '(空)';
    } else {
      reply = (data.content || []).map(c => c.text || '').join('') || '(空)';
    }

    console.log(`✅ API连接成功！`);
    console.log(`   回复: "${reply.trim()}"`);
    console.log(`   耗时: ${elapsed}ms`);
    if (data.usage) console.log(`   token: ${JSON.stringify(data.usage)}`);
    console.log(`\n💡 现在可以开游戏点下一旬测试了。如果开启了AI但没反应，检查控制台是否有 [ClaudeAI] 日志。`);

    // 检查游戏状态
    if (typeof G === 'undefined' || !G.factions) {
      console.warn('⚠️ 游戏尚未开始（G.factions不存在），请先开始游戏再测试AI决策');
    } else {
      const aiFacs = getScenarioFactions().filter(f => f !== G.playerFac && !G.factions[f]?._eliminated);
      const eligible = aiFacs.filter(f => CITIES_DEF.filter(c => G.cities[c.id]?.fac === f).length >= 2);
      console.log(`   当前AI势力: ${aiFacs.map(f=>getFactionDef(f)?.name).join(', ')}`);
      console.log(`   满足2城门槛: ${eligible.map(f=>getFactionDef(f)?.name).join(', ') || '(无——全部单城，不会调API)'}`);
      if (eligible.length === 0) console.warn('⚠️ 所有AI势力都是单城，Claude AI不会被调用。这是v158单城门槛的预期行为。');
    }

  } catch (e) {
    const elapsed = Math.round(performance.now() - t0);
    console.error(`❌ 网络错误 (${elapsed}ms):`, e.message);
    if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
      console.error('→ 可能原因: CORS被拦截 / 网络不通 / endpoint地址错误');
      console.error('→ 本地浏览器需安装CORS插件（如 "Allow CORS"），或使用支持CORS的中转');
    }
  }
}
