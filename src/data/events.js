// src/data/events.js
//
// EVENT_DEFS — 事件定义表(34 个 def / 8 categories)
//
// 来源:从 project_romance_v181.html L8380-L10659 整体抽离(Session 1.1 / 阶段 1)
// 抽离方式:**只搬运,不改逻辑**。callbacks 内引用的 G / SEASONS / applyEthosShock / log
// 等仍在 v181.html 主 script 中,通过同 realm classic <script> 共享的 script-scope
// 与 hoisted function 全局可见。loading 顺序:本文件必须在 v181.html 主 inline script
// 之前加载(<script src="src/data/events.js"> 放主 <script> 之前)。
//
// 不依赖 / 不挂 window — const EVENT_DEFS 在 script-scope 中,所有 classic script 共享。
// 所有原引用点(rollEventsV2 forEach + 4 处 debug panel find)无需修改。

/** 事件定义：A类天灾改造（3个）
 *  condition(fid) → {city} | false
 *  narrative(ctx) → string (弹窗叙事)
 *  choices(ctx) → [{label, desc, effect(ctx)}]
 *  aiChoose(ctx, personality) → choiceIndex (AI自动选)
 */
const EVENT_DEFS = [
  // ── A1 旱灾 ──
  {
    id:'drought', category:'disaster', priority:1, cooldown:12,
    season:['秋'], icon:'🌵', name:'旱灾',
    condition(fid){
      if(SEASONS[G.seasonIdx]!=='秋' || Math.random()>=0.08) return false;
      const candidates = Object.values(G.cities).filter(c=>c.fac===fid && (CITY_MAP[c.id]?.r??0)<19);
      if(!candidates.length) return false;
      const city = candidates[Math.floor(Math.random()*candidates.length)];
      return {city};
    },
    narrative(ctx){
      return `${ctx.city.name}秋粮绝收，赤地千里。百姓扶老携幼，沿途乞食。郡中存粮告急，太守请示主公定夺。`;
    },
    choices(ctx){
      const c = ctx.city;
      return [
        { label:'① 开仓赈济', desc:`存粮×0.6（大量消耗），民心仅-2，豪族+5｜文治→仁政`,
          effect(){ c.storage=Math.max(0,Math.floor(c.storage*0.6)); c.morale=Math.max(0,c.morale-2); c.gentry=Math.min(100,(c.gentry||50)+5); applyEthosShock(ctx.fid,'civil',-3,'赈灾开仓'); }},
        { label:'② 强征余粮', desc:`存粮×0.85，豪族-15，民心-12｜文治→暴政 权柄→集权`,
          effect(){ c.storage=Math.max(0,Math.floor(c.storage*0.85)); c.gentry=Math.max(0,(c.gentry||50)-15); c.morale=Math.max(0,c.morale-12); applyEthosShock(ctx.fid,'civil',4,'强征余粮'); applyEthosShock(ctx.fid,'power',2,'强征余粮'); }},
        { label:'③ 听天由命', desc:`人口×0.95，民心-8，存粮×0.8｜文治→暴政`,
          effect(){ c.pop=Math.floor(c.pop*0.95); c.morale=Math.max(0,c.morale-8); c.storage=Math.max(0,Math.floor(c.storage*0.8)); applyEthosShock(ctx.fid,'civil',2,'坐视灾民'); }},
      ];
    },
    aiChoose(ctx, pers){
      // 保守→开仓(0)，激进→强征(1)，均衡→听天由命(2)
      if(pers.diploAggro < 0.5) return 0;
      if(pers.diploAggro > 0.7) return 1;
      return 2;
    }
  },
  // ── A2 疫病 ──
  {
    id:'plague', category:'disaster', priority:1, cooldown:12,
    season:['夏'], icon:'☠', name:'疫病',
    condition(fid){
      if(SEASONS[G.seasonIdx]!=='夏' || Math.random()>=0.05) return false;
      const candidates = Object.values(G.cities).filter(c=>c.fac===fid);
      if(!candidates.length) return false;
      const city = candidates[Math.floor(Math.random()*candidates.length)];
      const hasClinic = (city.buildings.clinic||0)>0;
      return {city, hasClinic};
    },
    narrative(ctx){
      const clinicNote = ctx.hasClinic ? '幸有医馆在，尚可控制。' : '城中无医馆，疫势汹汹。';
      return `${ctx.city.name}忽发恶疫，城中死者相枕。${clinicNote}若弃之不管，恐蔓延邻郡。`;
    },
    choices(ctx){
      const c = ctx.city;
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      return [
        { label:'① 派医赈疫', desc:`金-300，人口×0.96，民心-5，兵源质量-5，豪族+3，不扩散｜文治→仁政${gold<300?' ⚠金不足':''}`,
          disabled: gold<300,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 300);
            c.pop=Math.floor(c.pop*0.96); c.morale=Math.max(0,c.morale-5);
            c.popQuality=Math.max(0,(c.popQuality??65)-5);
            c.gentry=Math.min(100,(c.gentry||50)+3);
            applyEthosShock(fid,'civil',-3,'派医赈疫');
          }},
        { label:'② 封城隔断', desc:`金-150，人口×0.94，民心-10，兵源质量-10，不扩散｜武略→铁血${gold<150?' ⚠金不足':''}`,
          disabled: gold<150,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 150);
            c.pop=Math.floor(c.pop*0.94); c.morale=Math.max(0,c.morale-10);
            c.popQuality=Math.max(0,(c.popQuality??65)-10);
            applyEthosShock(fid,'military',3,'封城隔断'); applyEthosShock(fid,'civil',2,'封城隔断');
          }},
        { label:'③ 不管', desc:`人口×${ctx.hasClinic?'0.96':'0.92'}，民心-15，兵源质量-15，可能扩散邻城｜文治→暴政`,
          effect(){
            c.pop=Math.floor(c.pop*(ctx.hasClinic?0.96:0.92));
            c.morale=Math.max(0,c.morale-15);
            c.popQuality=Math.max(0,(c.popQuality??65)-15);
            applyEthosShock(fid,'civil',3,'放任疫病');
            // 标记扩散
            c._plague = { turn:G.turn, hopsLeft:2 };
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      // 保守→派医(0)，激进→不管(2让它扩散到敌方)，均衡→封城(1)
      if(pers.diploAggro < 0.5 && gold>=300) return 0;
      if(pers.diploAggro > 0.7) return 2;
      return gold>=150 ? 1 : 2;
    }
  },
  // ── A3 水患 ──
  {
    id:'flood', category:'disaster', priority:1, cooldown:12,
    season:['夏'], icon:'🌊', name:'水患',
    condition(fid){
      if(SEASONS[G.seasonIdx]!=='夏' || Math.random()>=0.06) return false;
      const candidates = Object.values(G.cities).filter(c=>c.fac===fid && (CITY_MAP[c.id]?.r??0)>27);
      if(!candidates.length) return false;
      const city = candidates[Math.floor(Math.random()*candidates.length)];
      return {city};
    },
    narrative(ctx){
      return `${ctx.city.name}连日暴雨，江水暴涨，漫过堤坝。田亩尽没，仓中粮谷受潮。太守急报请主公决断。`;
    },
    choices(ctx){
      const c = ctx.city;
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      return [
        { label:'① 征民修堤', desc:`金-200，存粮仅×0.95，民心-3，豪族-5｜文治→仁政${gold<200?' ⚠金不足':''}`,
          disabled: gold<200,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 200);
            c.storage=Math.max(0,Math.floor(c.storage*0.95));
            c.morale=Math.max(0,c.morale-3);
            c.gentry=Math.max(0,(c.gentry||50)-5);
            applyEthosShock(fid,'civil',-3,'拨款修堤');
          }},
        { label:'② 迁民避水', desc:`人口×0.90，民心-5｜文治→暴政 权柄→集权`,
          effect(){
            c.pop=Math.floor(c.pop*0.90);
            c.morale=Math.max(0,c.morale-5);
            applyEthosShock(fid,'civil',3,'强迁百姓'); applyEthosShock(fid,'power',2,'强迁百姓');
          }},
        { label:'③ 听天由命', desc:`民心-8，存粮×0.9｜文治→暴政`,
          effect(){
            c.morale=Math.max(0,c.morale-8);
            c.storage=Math.max(0,Math.floor(c.storage*0.9));
            applyEthosShock(fid,'civil',2,'坐视水患');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      if(pers.diploAggro < 0.5 && gold>=200) return 0;
      if(pers.diploAggro > 0.7) return 2;
      return 1;
    }
  },

  // ═══════════════════════════════════════
  // B类：武将人事（4个）
  // ═══════════════════════════════════════

  // ── B1 请命出战 ──
  {
    id:'gen_restless', category:'personnel', playerOnly:true, priority:2, cooldown:24,
    season:null, icon:'⚔', name:'请命出战',
    condition(fid){
      if(Math.random() >= 0.15) return false; // 15%/旬触发概率
      const gens = G.generals[fid]||[];
      const deployed = new Set();
      G.units.forEach(u=>u.squads.forEach(sq=>deployed.add(sq.genName)));
      const cand = gens.filter(g=>{
        if(g.role==='ruler') return false;
        if(deployed.has(g.name)) return false;
        if(getGenPostDef(g.name)) return false;
        if(Object.values(G.cities).some(c=>c.fac===fid && c.prefect===g.name)) return false;
        const idle = G.turn - (G.genJoinTurn[g.name]||0);
        if(idle < 6) return false;
        const loyalty = G.genLoyalty[g.name]??80;
        if(loyalty >= 65) return false;
        const meta = getGenMeta(g.name);
        const tags = GEN_TAGS[g.name]||{};
        const hasAmbition = (meta.values||[]).includes('野心') || tags.combat==='hawk';
        return hasAmbition;
      });
      if(!cand.length) return false;
      const gen = cand[Math.floor(Math.random()*cand.length)];
      return {gen, genName:gen.name};
    },
    narrative(ctx){
      return `${ctx.genName}求见主公，言辞恳切——"末将宝刀未老，愿领一军为主公开疆拓土。"其眉宇间隐有不平之色。`;
    },
    choices(ctx){
      const name = ctx.genName;
      const fid = ctx.fid;
      const meta = getGenMeta(name);
      const isSpeculator = (meta.values||[]).includes('投机');
      const hasOffice = !!(getGenPostDef(name) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===name));
      return [
        { label:'① 允其出征', desc:`忠诚+8，3旬内须编入部队（否则忠诚-15）`,
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+8);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            G._eventPromises.push({genName:name,fid,type:'B1_deploy',promisedAt:G.turn,deadline:G.turn+3,penalty:-15});
          }},
        { label:'② 委以重任', desc:`忠诚+5，3旬内须任命官职或太守（否则忠诚-10）${hasOffice?' ⚠已有职务':''}`,
          disabled: hasOffice,
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+5);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            G._eventPromises.push({genName:name,fid,type:'B1_office',promisedAt:G.turn,deadline:G.turn+3,penalty:-10});
          }},
        { label:'③ 温言安抚', desc:`忠诚-5${isSpeculator?'（投机者额外-5，共-10）':''}`,
          effect(){
            const loss = isSpeculator ? -10 : -5;
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]+loss);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
          }},
      ];
    },
    aiChoose(ctx, pers){
      // AI一般选①允出征（成本最低）
      return 0;
    }
  },

  // ── B2 将相不和 ──
  {
    id:'gen_conflict', category:'personnel', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'💢', name:'将相不和',
    condition(fid){
      if(Math.random() >= 0.20) return false; // 20%/旬触发概率
      for(const u of G.units){
        if(u.fac!==fid) continue;
        const names = u.squads.map(sq=>sq.genName);
        for(let i=0;i<names.length;i++){
          for(let j=i+1;j<names.length;j++){
            const intim = getIntimacy(names[i],names[j]);
            if(intim < -30){
              const aHasPost = !!(getGenPostDef(names[i]) || Object.values(G.cities).some(c=>c.fac===fid&&c.prefect===names[i]));
              const bHasPost = !!(getGenPostDef(names[j]) || Object.values(G.cities).some(c=>c.fac===fid&&c.prefect===names[j]));
              if(aHasPost || bHasPost){
                return {genA:names[i], genB:names[j], intimacy:intim};
              }
            }
          }
        }
      }
      return false;
    },
    narrative(ctx){
      const tagsA = GEN_TAGS[ctx.genA]||{};
      const tagsB = GEN_TAGS[ctx.genB]||{};
      if(tagsA.combat==='hawk' && tagsB.combat==='dove'){
        return `${ctx.genA}与${ctx.genB}在军议上因战和之策争执不下。${ctx.genA}拍案——"坐守不出，如何安天下！"${ctx.genB}冷然——"穷兵黩武，社稷之祸。"`;
      }
      return `${ctx.genA}与${ctx.genB}在军议上争执不下。${ctx.genA}拍案而去，言"此人不除，大事难成"。左右侧目，无人敢劝。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      const deepHatred = ctx.intimacy < -50;
      return [
        { label:`① 力挺${ctx.genA}，斥${ctx.genB}`, desc:`${ctx.genA}忠+5，${ctx.genB}忠-10`,
          effect(){
            if(G.genLoyalty[ctx.genA]!==undefined) G.genLoyalty[ctx.genA]=Math.min(100,G.genLoyalty[ctx.genA]+5);
            if(G.genLoyalty[ctx.genB]!==undefined) G.genLoyalty[ctx.genB]=Math.max(0,G.genLoyalty[ctx.genB]-10);
            if(G.loyaltyAccum){ G.loyaltyAccum[ctx.genA]=G.genLoyalty[ctx.genA]; G.loyaltyAccum[ctx.genB]=G.genLoyalty[ctx.genB]; }
          }},
        { label:`② 力挺${ctx.genB}，斥${ctx.genA}`, desc:`${ctx.genB}忠+5，${ctx.genA}忠-10`,
          effect(){
            if(G.genLoyalty[ctx.genB]!==undefined) G.genLoyalty[ctx.genB]=Math.min(100,G.genLoyalty[ctx.genB]+5);
            if(G.genLoyalty[ctx.genA]!==undefined) G.genLoyalty[ctx.genA]=Math.max(0,G.genLoyalty[ctx.genA]-10);
            if(G.loyaltyAccum){ G.loyaltyAccum[ctx.genB]=G.genLoyalty[ctx.genB]; G.loyaltyAccum[ctx.genA]=G.genLoyalty[ctx.genA]; }
          }},
        { label:'③ 设宴调和', desc:`金-100，亲密+10，各忠+2${deepHatred?' ⚠积怨太深效果减半':''}${gold<100?' ⚠金不足':''}`,
          disabled: gold<100,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 100);
            if(deepHatred){
              addIntimacy(ctx.genA,ctx.genB,5);
              if(G.genLoyalty[ctx.genA]!==undefined) G.genLoyalty[ctx.genA]=Math.min(100,G.genLoyalty[ctx.genA]+1);
              if(G.genLoyalty[ctx.genB]!==undefined) G.genLoyalty[ctx.genB]=Math.min(100,G.genLoyalty[ctx.genB]+1);
              if(G.loyaltyAccum){ G.loyaltyAccum[ctx.genA]=G.genLoyalty[ctx.genA]; G.loyaltyAccum[ctx.genB]=G.genLoyalty[ctx.genB]; }
            } else {
              addIntimacy(ctx.genA,ctx.genB,10);
              if(G.genLoyalty[ctx.genA]!==undefined) G.genLoyalty[ctx.genA]=Math.min(100,G.genLoyalty[ctx.genA]+2);
              if(G.genLoyalty[ctx.genB]!==undefined) G.genLoyalty[ctx.genB]=Math.min(100,G.genLoyalty[ctx.genB]+2);
            }
            if(G.loyaltyAccum){ G.loyaltyAccum[ctx.genA]=G.genLoyalty[ctx.genA]; G.loyaltyAccum[ctx.genB]=G.genLoyalty[ctx.genB]; }
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      if(gold>=100) return 2; // AI优先调和
      return 0; // 金不够则挺A
    }
  },

  // ── B3 功高震主 ──
  {
    id:'gen_overpowered', category:'personnel', playerOnly:true, priority:2, cooldown:36,
    season:null, icon:'👑', name:'功高震主',
    condition(fid){
      if(Math.random() >= 0.10) return false; // 10%/旬触发概率
      for(const u of G.units){
        if(u.fac!==fid) continue;
        const mainGen = u.squads[0];
        if(!mainGen) continue;
        const g = GEN_MAP[mainGen.genName];
        if(!g) continue;
        if(g.role==='ruler') continue; // 君主不触发功高震主
        if((g.war+g.com) <= 170) continue;
        // 征战>12旬：检查该武将加入时间距今>12旬（近似：长期在部队的老将）
        if(G.turn - (G.genJoinTurn[mainGen.genName]||0) < 12) continue;
        const meta = getGenMeta(mainGen.genName);
        if((meta.values||[]).includes('忠义')) continue;
        const loyalty = G.genLoyalty[mainGen.genName]??80;
        const sen = seniority(mainGen.genName, fid);
        return {genName:mainGen.genName, gen:g, unit:u, loyalty, seniority:sen};
      }
      return false;
    },
    narrative(ctx){
      if(ctx.seniority==='founding' || ctx.seniority==='member'){
        return `朝中有人议论${ctx.genName}拥兵自重，请主公定夺。"${ctx.genName}统兵日久，军中将士只知将令，不知主公号令。"`;
      }
      return `降将${ctx.genName}统兵日久，军中只知有${ctx.genName}不知有主公。左右进言——"此人非嫡系，兵权过重恐生变。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const name = ctx.genName;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      const meta = getGenMeta(name);
      const isAmbitious = (meta.values||[]).includes('野心');
      const unit = ctx.unit;
      const inCity = unit ? (()=>{const nid=getUnitNodeId(unit); return nid && G.cities[nid] && G.cities[nid].fac===fid;})() : false;
      const hasOffice = !!(getGenPostDef(name) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===name));
      return [
        hasOffice
        ? { label:'① 赐金安抚', desc:`金-300，忠诚+${isAmbitious?3:8}｜权柄→共治${gold<300?' ⚠金不足':''}`,
            disabled: gold<300,
            effect(){
              safeSub(G.factions[fid].res, 'gold', 300);
              const gain = isAmbitious ? 3 : 8;
              if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+gain);
              if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
              applyEthosShock(fid,'power',-3,'安抚功臣');
            }}
        : { label:'① 加封安抚', desc:`忠诚+${isAmbitious?3:8}，3旬内须任命官职（否则忠-12）｜权柄→共治`,
            effect(){
              const gain = isAmbitious ? 3 : 8;
              if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+gain);
              if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
              G._eventPromises.push({genName:name,fid,type:'B3_office',promisedAt:G.turn,deadline:G.turn+3,penalty:-12});
              applyEthosShock(fid,'power',-3,'安抚功臣');
            }},
        { label:'② 召回述职', desc:`部队自动回城，忠-5，全队士气-8｜权柄→集权${inCity?' ⚠已在城中不可选':''}`,
          disabled: inCity,
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]-5);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            if(unit){
              unit.squads.forEach(sq=>{ sq.morale=Math.max(10,sq.morale-8); });
              // 寻最近己方城市设march
              if(unit.status==='siege'){ unit.siegeTarget=null; unit._siegeTurnCount=0; }
              let bestCity=null, bestCost=Infinity, bestPath=null;
              Object.values(G.cities).filter(c=>c.fac===fid).forEach(c=>{
                const cd=CITY_MAP[c.id]; if(!cd) return;
                const r=hexAstar(unit.hq,unit.hr,cd.q,cd.r,'light',fid);
                if(r && r.cost<bestCost){bestCost=r.cost;bestCity=c;bestPath=r.path;}
              });
              if(bestCity && bestPath){ unit.hexPath=bestPath.slice(1); unit.movePath=[bestCity.id]; unit.status='march'; }
            }
            applyEthosShock(fid,'power',4,'召回述职');
          }},
        { label:'③ 遣使慰劳', desc:`金-200，忠+5${gold<200?' ⚠金不足':''}`,
          disabled: gold<200,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 200);
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+5);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
          }},
        { label:'④ 不予理会', desc:`该武将更易被敌方挖角（忠诚阈值提至65）`,
          effect(){
            if(!G._poachVulnerable) G._poachVulnerable={};
            const tags = GEN_TAGS[name]||{};
            const threshold = (meta.values||[]).includes('投机') ? 75 : 65;
            G._poachVulnerable[name] = {threshold};
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      if(gold>=200) return 2; // 遣使慰劳
      return 0; // 加封
    }
  },

  // ── B4 故人来投 ──
  {
    id:'gen_referral', category:'personnel', playerOnly:true, priority:2, cooldown:12,
    season:null, icon:'🌟', name:'故人来投',
    condition(fid){
      if(Math.random() >= 0.12) return false; // 12%/旬触发概率
      if(!G.wildPool || !G.wildPool.length) return false;
      const myGens = G.generals[fid]||[];
      for(const wildName of G.wildPool){
        const wildMeta = getGenMeta(wildName);
        if(!wildMeta.relations) continue;
        for(const rel of wildMeta.relations){
          if(!['义兄弟','义友','同乡','同窗','挚友','同僚','同谋'].includes(rel.type)) continue;
          const referrer = myGens.find(g=>g.name===rel.name);
          if(!referrer) continue;
          const loyalty = G.genLoyalty[rel.name]??80;
          if(loyalty < 70) continue;
          const wildGen = WILD_GENS.find(g=>g.name===wildName);
          if(!wildGen) continue;
          return {wildName, wildGen, referrerName:rel.name, referrerLoyalty:loyalty, relType:rel.type};
        }
      }
      return false;
    },
    narrative(ctx){
      const facName = FAC[ctx.fid]?.name||ctx.fid;
      return `${ctx.wildName}闻${ctx.referrerName}在${facName}帐下，慕名来投。${ctx.referrerName}亲自引荐——"此人与我有旧，才堪大用，请主公纳之。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const wName = ctx.wildName;
      const rName = ctx.referrerName;
      const rLoy = ctx.referrerLoyalty;
      const initLoy = Math.floor(rLoy * 0.8);
      return [
        { label:'① 欣然接纳', desc:`${wName}直接加入，初始忠诚${initLoy}，${rName}忠+3，双方亲密+15`,
          effect(){
            // 检查在野池中仍存在
            if(!G.wildPool.includes(wName)){ log(`${wName}已另投他处`,'event'); return; }
            const gen = WILD_GENS.find(g=>g.name===wName);
            if(!gen) return;
            { const _cloned = _deepCloneGen(gen); G.generals[fid].push(_cloned); GEN_MAP[_cloned.name] = _cloned; } // ★ v155fix P0
            G.genLoyalty[wName] = initLoy;
            if(G.loyaltyAccum) G.loyaltyAccum[wName] = initLoy;
            G.genChronicle[wName] = G.genChronicle[wName]||[];
            addGenChronicle(wName, `经${rName}引荐，投奔${FAC[fid]?.name||fid}。`);
            G.wildPool = G.wildPool.filter(n=>n!==wName);
            G.genJoinTurn[wName] = G.turn;
            G.genJoinSource[wName] = 'referral';
            // 引荐人忠+3
            if(G.genLoyalty[rName]!==undefined) G.genLoyalty[rName]=Math.min(100,G.genLoyalty[rName]+3);
            if(G.loyaltyAccum) G.loyaltyAccum[rName]=G.genLoyalty[rName];
            addIntimacy(rName, wName, 15);
          }},
        // D-133 fix: ② 考察再议 (B4_delayed 3 旬后自动加入) 删除 (audit verdict=closes via deletion).
        // 原机制 push 后立即被 checkEventPromises 静默清除 (在野武将不在 G.generals[fid]),
        // "3 旬后自动加入"功能从 v130 引入起就完全不工作. 简化玩家选项为"立即接纳/婉拒"二选一.
        // 若未来要实装"考察期"玩法,在此恢复 ② 选项 + hubs.js B4_delayed deadline 路径即可 (sprint 之后的 small feature 候选).
        { label:'② 婉拒', desc:`${rName}忠-8，${wName}6旬内不再来投`,
          effect(){
            if(G.genLoyalty[rName]!==undefined) G.genLoyalty[rName]=Math.max(0,G.genLoyalty[rName]-8);
            if(G.loyaltyAccum) G.loyaltyAccum[rName]=G.genLoyalty[rName];
            // 设冷却阻止该武将再触发
            G._eventCooldown['gen_referral_'+wName] = 6;
          }},
      ];
    },
    aiChoose(ctx, pers){
      return 0; // AI总是接纳
    }
  },

  // ═══════════════════════════════════════
  // C类：豪族/派系斗争（4个）
  // ═══════════════════════════════════════

  // ── C1 豪族献策 ──
  {
    id:'gentry_offer', category:'gentry', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'🏛', name:'豪族献策',
    condition(fid){
      if(Math.random() >= 0.12) return false;
      const candidates = Object.values(G.cities).filter(c=>{
        if(c.fac !== fid) return false;
        if((c.gentry||50) <= 70) return false;
        const reg = CITY_TO_STATE[c.id];
        const gentryFacId = reg ? STATE_TO_GENTRY_FAC[reg] : null;
        if(!gentryFacId) return false;
        const inf = calcFactionInfluence(fid);
        const facInf = inf.factions[gentryFacId];
        if(!facInf || (facInf.influence / (inf.total||1) * 100) <= 20) return false;
        return true;
      });
      if(!candidates.length) return false;
      const city = candidates[Math.floor(Math.random()*candidates.length)];
      const reg = CITY_TO_STATE[city.id];
      const gentryFacId = STATE_TO_GENTRY_FAC[reg];
      const facDef = FACTION_DEFS.find(f=>f.id===gentryFacId);
      const facLabel = facDef?.label || '士族';
      // 找空闲本地士族武将（v172: 按士族派系匹配——同 gentryFac 即为本地）
      const localGentryGens = (G.generals[fid]||[]).filter(g=>{
        if(g.role==='ruler') return false;
        const tags = GEN_TAGS[g.name]||{};
        if(tags.origin!=='gentry') return false;
        // 客居集团（东州/淮泗）不算本地
        if(tags.clique) return false;
        if(!tags.state || STATE_TO_GENTRY_FAC[tags.state] !== gentryFacId) return false;
        if(getGenPostDef(g.name)) return false;
        if(Object.values(G.cities).some(c=>c.fac===fid && c.prefect===g.name)) return false;
        if(G.units.some(u=>u.fac===fid && u.squads.some(sq=>sq.genName===g.name))) return false;
        return true;
      });
      return {city, facLabel, localGentryGens, reg};
    },
    narrative(ctx){
      return `${ctx.city.name}的${ctx.facLabel}大族联名上书，愿出私财资助建设，但请求主公"用人当用本地贤达"。`;
    },
    choices(ctx){
      const c = ctx.city;
      const fid = ctx.fid;
      const hasLocalGen = ctx.localGentryGens.length > 0;
      const currentPrefect = c.prefect;
      const isLocalPrefect = currentPrefect && ctx.localGentryGens.some(g=>g.name===currentPrefect);
      return [
        { label:'① 接受资助', desc:`金+500，豪族+8，非本地太守忠-5`,
          effect(){
            G.factions[fid].res.gold += 500;
            c.gentry = Math.min(100, (c.gentry||50)+8);
            // 非本地太守忠-5
            if(currentPrefect && !isLocalPrefect){
              if(G.genLoyalty[currentPrefect]!==undefined) G.genLoyalty[currentPrefect]=Math.max(0,G.genLoyalty[currentPrefect]-5);
              if(G.loyaltyAccum) G.loyaltyAccum[currentPrefect]=G.genLoyalty[currentPrefect];
            }
          }},
        { label:'② 接受并换本地太守', desc:`金+500，豪族+3${hasLocalGen?'':'  ⚠无本地士族可任'}`,
          disabled: !hasLocalGen,
          effect(){
            G.factions[fid].res.gold += 500;
            c.gentry = Math.min(100, (c.gentry||50)+3);
            // 换最高政治的空闲本地士族为太守（setPrefect内含忠+8+解除旧城）
            const best = ctx.localGentryGens.slice().sort((a,b)=>b.pol-a.pol)[0];
            if(best) setPrefect(c.id, best.name);
          }},
        { label:'③ 婉拒', desc:`豪族-8，保持控制力`,
          effect(){
            c.gentry = Math.max(0, (c.gentry||50)-8);
          }},
      ];
    },
    aiChoose(ctx, pers){
      if(ctx.localGentryGens.length) return 1; // 有本地人就换
      return pers.diploAggro > 0.6 ? 2 : 0; // 激进→拒，保守→接受
    }
  },

  // ── C2 士族逼宫 ──
  {
    id:'gentry_pressure', category:'gentry', playerOnly:true, priority:1, cooldown:24,
    season:null, icon:'📜', name:'士族逼宫',
    condition(fid){
      if(Math.random() >= 0.08) return false;
      const inf = calcFactionInfluence(fid);
      const gentryFacs = FACTION_DEFS.filter(f=>f.id.startsWith('gentry_'));
      for(const gf of gentryFacs){
        const facInf = inf.factions[gf.id];
        if(!facInf) continue;
        const pct = facInf.influence / (inf.total||1) * 100;
        if(pct <= 35) continue;
        // 该派系≥3人无官职
        const noOffice = facInf.gens.filter(name=>{
          if(getGenPostDef(name)) return false;
          if(Object.values(G.cities).some(c=>c.fac===fid && c.prefect===name)) return false;
          return true;
        });
        if(noOffice.length >= 3){
          return {facId:gf.id, facLabel:gf.label, noOfficeGens:noOffice.slice(0,3), pct:Math.round(pct)};
        }
      }
      return false;
    },
    narrative(ctx){
      const names = ctx.noOfficeGens.join('、');
      return `${ctx.facLabel}诸臣联名进言——"${names}，皆才堪大任，久居闲散，非明主之道。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gens3 = ctx.noOfficeGens;
      // 检查tier3官位是否有空缺
      const slots = getPostSlots(fid);
      const posts = getFacPosts(fid);
      const tier3Total = slots.mil[0] + slots.civ[0];
      const tier3Used = posts.filter(p=>p.postDef.tier===3).length;
      const tier3Free = tier3Total - tier3Used;
      const canBatch = tier3Free >= 3;
      return [
        { label:'① 批量封官', desc:canBatch
            ? `${gens3.join('、')}各得三品官，各忠+10，其他派系忠各-3`
            : `各忠+10，其他派系忠各-3，3旬内须补齐3个官位（否则各忠-8）`,
          effect(){
            gens3.forEach(name=>{
              if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+10);
              if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            });
            // 其他派系武将忠各-3
            (G.generals[fid]||[]).forEach(g=>{
              if(g.role==='ruler') return;
              const gFacs = getGenFactions(g.name, fid);
              if(gFacs.includes(ctx.facId)) return;
              if(G.genLoyalty[g.name]!==undefined) G.genLoyalty[g.name]=Math.max(0,G.genLoyalty[g.name]-3);
              if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
            });
            if(canBatch){
              // 有空位：自动封
              const allPosts = [...(MIL_POSTS.tier3||[]), ...(CIV_POSTS.tier3||[])];
              const usedNames = new Set(posts.map(p=>p.postDef.name));
              const avail = allPosts.filter(p=>!usedNames.has(p.name));
              gens3.forEach((name,i)=>{ if(avail[i]) appointGenPost(name, avail[i].name, fid); });
            } else {
              // 无足够空位：3旬promise
              gens3.forEach(name=>{
                G._eventPromises.push({genName:name,fid,type:'C2_office',promisedAt:G.turn,deadline:G.turn+3,penalty:-8});
              });
            }
          }},
        { label:'② 只封一人', desc:tier3Free>=1
            ? `${gens3[0]}封官忠+8，其余忠-5`
            : `${gens3[0]}忠+8，其余忠-5，3旬内须为${gens3[0]}封官（否则忠-5）`,
          effect(){
            if(G.genLoyalty[gens3[0]]!==undefined) G.genLoyalty[gens3[0]]=Math.min(100,G.genLoyalty[gens3[0]]+8);
            if(G.loyaltyAccum) G.loyaltyAccum[gens3[0]]=G.genLoyalty[gens3[0]];
            gens3.slice(1).forEach(name=>{
              if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]-5);
              if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            });
            if(tier3Free>=1){
              const allPosts = [...(MIL_POSTS.tier3||[]), ...(CIV_POSTS.tier3||[])];
              const usedNames = new Set(posts.map(p=>p.postDef.name));
              const avail = allPosts.filter(p=>!usedNames.has(p.name));
              if(avail.length) appointGenPost(gens3[0], avail[0].name, fid);
            } else {
              G._eventPromises.push({genName:gens3[0],fid,type:'C2_office',promisedAt:G.turn,deadline:G.turn+3,penalty:-5});
            }
          }},
        { label:'③ 以能力论官', desc:`该派系全体忠-5，相关城市豪族各-5，寒门忠+3`,
          effect(){
            const inf = calcFactionInfluence(fid);
            const facGens = inf.factions[ctx.facId]?.gens || [];
            facGens.forEach(name=>{
              if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]-5);
              if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            });
            // 相关城市gentry-5
            const gentryStates = FACTION_DEFS.find(f=>f.id===ctx.facId)?.gentryStates || [];
            Object.values(G.cities).filter(c=>c.fac===fid).forEach(c=>{
              const reg = CITY_TO_STATE[c.id];
              if(gentryStates.includes(reg)) c.gentry = Math.max(0, (c.gentry||50)-5);
            });
            // humble忠+3
            (G.generals[fid]||[]).forEach(g=>{
              const tags = GEN_TAGS[g.name]||{};
              if(tags.origin==='humble'){
                if(G.genLoyalty[g.name]!==undefined) G.genLoyalty[g.name]=Math.min(100,G.genLoyalty[g.name]+3);
                if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
              }
            });
          }},
        { label:'④ 拖延', desc:`该派系忠诚额外-0.3/旬，持续12旬`,
          effect(){
            // 标记持续衰减
            if(!G._factionLoyaltyDecay) G._factionLoyaltyDecay = {};
            G._factionLoyaltyDecay[ctx.facId+'_'+fid] = { perTurn:-0.3, remaining:12 };
          }},
      ];
    },
    aiChoose(ctx, pers){
      return 1; // AI只封一人（折中）
    }
  },

  // ── C3 寒门抱怨 ──
  {
    id:'humble_complaint', category:'gentry', playerOnly:true, priority:2, cooldown:24,
    season:null, icon:'😤', name:'寒门抱怨',
    condition(fid){
      if(Math.random() >= 0.10) return false;
      const gens = (G.generals[fid]||[]).filter(g=>g.role!=='ruler');
      const humbleNoOffice = gens.filter(g=>{
        const tags = GEN_TAGS[g.name]||{};
        if(tags.origin!=='humble') return false;
        if(getGenPostDef(g.name)) return false;
        if(Object.values(G.cities).some(c=>c.fac===fid && c.prefect===g.name)) return false;
        return true;
      });
      if(humbleNoOffice.length < 3) return false;
      // gentry origin武将占官位>60%
      const allWithOffice = gens.filter(g=>getGenPostDef(g.name) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===g.name));
      if(!allWithOffice.length) return false;
      const gentryWithOffice = allWithOffice.filter(g=>(GEN_TAGS[g.name]||{}).origin==='gentry');
      if(gentryWithOffice.length / allWithOffice.length <= 0.6) return false;
      const complainer = humbleNoOffice[Math.floor(Math.random()*humbleNoOffice.length)];
      return {complainerName:complainer.name, humbleNoOffice};
    },
    narrative(ctx){
      return `${ctx.complainerName}私下牢骚——"朝中尽是世家子弟，我等出生入死，反不如坐而论道之人。"军中寒门将士多有附和。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const humbles = ctx.humbleNoOffice;
      // 找一个可封官的humble
      const allPosts = [...(MIL_POSTS.tier3||[]), ...(CIV_POSTS.tier3||[])];
      const posts = getFacPosts(fid);
      const usedNames = new Set(posts.map(p=>p.postDef.name));
      const avail = allPosts.filter(p=>!usedNames.has(p.name));
      const canPromote = avail.length > 0;
      return [
        { label:'① 破格提拔', desc:canPromote
            ? `${ctx.complainerName}封官忠+15，全体寒门忠+3，相关城市豪族-3`
            : `${ctx.complainerName}忠+15，全体寒门忠+3，豪族-3，3旬内须为其封官（否则忠-10）`,
          effect(){
            if(G.genLoyalty[ctx.complainerName]!==undefined) G.genLoyalty[ctx.complainerName]=Math.min(100,G.genLoyalty[ctx.complainerName]+15);
            if(G.loyaltyAccum) G.loyaltyAccum[ctx.complainerName]=G.genLoyalty[ctx.complainerName];
            (G.generals[fid]||[]).forEach(g=>{
              const tags = GEN_TAGS[g.name]||{};
              if(tags.origin==='humble' && G.genLoyalty[g.name]!==undefined){
                G.genLoyalty[g.name]=Math.min(100,G.genLoyalty[g.name]+3);
                if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
              }
            });
            Object.values(G.cities).filter(c=>c.fac===fid).forEach(c=>{
              c.gentry = Math.max(0, (c.gentry||50)-3);
            });
            if(canPromote){
              appointGenPost(ctx.complainerName, avail[0].name, fid);
            } else {
              G._eventPromises.push({genName:ctx.complainerName,fid,type:'C3_office',promisedAt:G.turn,deadline:G.turn+3,penalty:-10});
            }
          }},
        { label:'② 唯才是举', desc:`全体武将忠+2`,
          effect(){
            (G.generals[fid]||[]).forEach(g=>{
              if(g.role==='ruler') return;
              if(G.genLoyalty[g.name]!==undefined) G.genLoyalty[g.name]=Math.min(100,G.genLoyalty[g.name]+2);
              if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
            });
          }},
        { label:'③ 不回应', desc:`全体寒门忠各-3`,
          effect(){
            humbles.forEach(g=>{
              if(G.genLoyalty[g.name]!==undefined) G.genLoyalty[g.name]=Math.max(0,G.genLoyalty[g.name]-3);
              if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
            });
          }},
      ];
    },
    aiChoose(ctx, pers){ return 1; }
  },

  // ── C4 豪族不满 ──
  {
    id:'gentry_unrest', category:'gentry', playerOnly:true, priority:1, cooldown:24,
    season:null, icon:'🔥', name:'豪族不满',
    condition(fid){
      if(Math.random() >= 0.10) return false;
      for(const city of Object.values(G.cities)){
        if(city.fac !== fid) continue;
        if((city.gentry||50) >= 30) continue;
        const reg = CITY_TO_STATE[city.id];
        const gentryFacId = reg ? STATE_TO_GENTRY_FAC[reg] : null;
        if(!gentryFacId) continue;
        const inf = calcFactionInfluence(fid);
        const facInf = inf.factions[gentryFacId];
        if(facInf && (facInf.influence / (inf.total||1) * 100) >= 10) continue;
        // 太守不是本地gentry（v172: 按士族派系匹配）
        const pref = city.prefect;
        if(pref){
          const tags = GEN_TAGS[pref]||{};
          if(tags.origin==='gentry' && !tags.clique && tags.state
             && STATE_TO_GENTRY_FAC[tags.state] === gentryFacId) continue; // 已有本地士族太守
        }
        const localGentryGens = (G.generals[fid]||[]).filter(g=>{
          if(g.role==='ruler') return false;
          const tags = GEN_TAGS[g.name]||{};
          if(tags.origin!=='gentry') return false;
          if(tags.clique) return false; // 客居集团不算本地
          if(!tags.state || STATE_TO_GENTRY_FAC[tags.state] !== gentryFacId) return false;
          if(getGenPostDef(g.name)) return false;
          if(Object.values(G.cities).some(c=>c.fac===fid && c.prefect===g.name)) return false;
          if(G.units.some(u=>u.fac===fid && u.squads.some(sq=>sq.genName===g.name))) return false;
          return true;
        });
        return {city, reg, gentryFacId, localGentryGens};
      }
      return false;
    },
    narrative(ctx){
      return `${ctx.city.name}士族怨声载道，地方豪强暗中串联。若不安抚，恐生变故。`;
    },
    choices(ctx){
      const c = ctx.city;
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      const hasLocalGen = ctx.localGentryGens.length > 0;
      return [
        { label:'① 拨款安抚', desc:`金-400，豪族+15，民心+5${gold<400?' ⚠金不足':''}`,
          disabled: gold<400,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 400);
            c.gentry = Math.min(100, (c.gentry||50)+15);
            c.morale = Math.min(100, c.morale+5);
          }},
        { label:'② 换本地士族太守', desc:`豪族+12${hasLocalGen?'':' ⚠无本地士族可任'}`,
          disabled: !hasLocalGen,
          effect(){
            c.gentry = Math.min(100, (c.gentry||50)+12);
            const best = ctx.localGentryGens.slice().sort((a,b)=>b.pol-a.pol)[0];
            if(best) setPrefect(c.id, best.name);
          }},
        { label:'③ 不管', desc:`6旬后若豪族仍<30则暴动（城防清零、民心-25、人口-5%）`,
          effect(){
            G._eventPromises.push({
              genName:'_city_'+c.id, fid, type:'C4_unrest',
              promisedAt:G.turn, deadline:G.turn+6, penalty:0,
              _c4data:{cityId:c.id}
            });
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      if(gold>=400) return 0;
      if(ctx.localGentryGens.length) return 1;
      return 0; // AI尽量安抚
    }
  },

  // ═══════════════════════════════════════
  // D类：演义名场面（3个 · 一次性）
  // ═══════════════════════════════════════

  // ── D1 拜将大典 ──
  {
    id:'general_ceremony', category:'story', playerOnly:true, priority:2, cooldown:18, oneTime:false, // ★ v133: 可推迟，cooldown=18旬（半年）
    season:null, icon:'🏅', name:'拜将大典',
    condition(fid){
      if(G._eventFired?.general_ceremony) return false; // ★ v133: 已封过则不再触发
      if(Math.random() >= 0.30) return false; // ★ v132: 30%概率门槛
      const gens = (G.generals[fid]||[]).filter(g=>{
        if(g.role==='ruler') return false;
        const m = GEN_MAP[g.name];
        return m && (m.com + m.war) >= 165;
      });
      if(gens.length < 5) return false;
      gens.sort((a,b)=>{
        const ma=GEN_MAP[a.name], mb=GEN_MAP[b.name];
        return (mb.com+mb.war) - (ma.com+ma.war);
      });
      const allCands = gens.map(g=>g.name);
      // 检查是否匹配五虎或五子
      const WUHU = ['关羽','张飞','赵云','马超','黄忠'];
      const WUZI = ['张辽','乐进','于禁','张郃','徐晃'];
      const isWuhu = fid==='shu' && WUHU.every(n=>allCands.includes(n));
      const isWuzi = fid==='wei' && WUZI.every(n=>allCands.includes(n));
      return {allCands, isWuhu, isWuzi};
    },
    narrative(ctx){
      if(ctx.isWuhu) return `麾下猛将云集，群臣进言——"关、张、赵、马、黄皆万人敌，宜册封五虎上将，以彰武德。"请主公钦点五人受封。`;
      if(ctx.isWuzi) return `麾下良将辈出，群臣进言——"张辽、乐进、于禁、张郃、徐晃征战四方，宜册封五子良将。"请主公钦点五人受封。`;
      return `麾下猛将云集，谋士进言——"诸将皆万人敌，宜各授重任，以安军心。"请主公钦点五人受封。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const title = ctx.isWuhu ? '五虎上将' : ctx.isWuzi ? '五子良将' : '五大将军';
      return [
        { label:`册封${title}`, desc:`从${ctx.allCands.length}位候选中选5人，忠各+10，统帅/武力经验各+25，全势力部队士气+5`,
          effect(){
            // 玩家势力：弹多选面板
            if(fid === G.playerFac && !_fastForward){
              _showCeremonyPicker(ctx.allCands, fid, title);
            } else {
              // AI：取前5
              const picked = ctx.allCands.slice(0,5);
              _applyCeremony(picked, fid);
            }
          }},
        { label:'暂缓册封', desc:'时机尚未成熟，半年后再议',
          effect(){
            log('🏅 主公决定暂缓册封，半年后再议','event');
          }},
      ];
    },
    aiChoose(){ return 0; }
  },

  // ── D3 铜雀台 ──
  {
    id:'bronze_tower', category:'story', playerOnly:true, priority:2, cooldown:9999, oneTime:true,
    season:null, icon:'🏯', name:'铜雀台',
    condition(fid){
      if(fid !== 'wei') return false;
      const ruler = (G.generals.wei||[]).find(g=>g.role==='ruler');
      if(!ruler || ruler.name !== '曹操') return false;
      const cityCount = Object.values(G.cities).filter(c=>c.fac==='wei').length;
      if(cityCount < 15) return false;
      return {cityCount};
    },
    narrative(){
      return `曹操一统北方，威震天下。谋臣进言——"丞相功盖寰宇，宜修铜雀台于邺城，以彰功业，宴飨群臣。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      const wuRel = G.diplo?.['wei-wu']?.rel ?? 50;
      return [
        { label:'① 修建铜雀台', desc:`金-800，首都民心+10，全势力忠+3${gold<800?' ⚠金不足':''}`,
          disabled: gold<800,
          effect(){
            safeSub(G.factions.wei.res, 'gold', 800);
            // 首都民心+10
            const cap = Object.values(G.cities).find(c=>c.fac==='wei' && c.isCapital);
            if(cap) cap.morale = Math.min(100, cap.morale+10);
            // 全势力忠+3
            (G.generals.wei||[]).forEach(g=>{
              if(g.role==='ruler') return;
              if(G.genLoyalty[g.name]!==undefined) G.genLoyalty[g.name]=Math.min(100,G.genLoyalty[g.name]+3);
              if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
            });
          }},
        { label:'② 遣使求亲', desc:`对吴好感+20${wuRel>=50?' ⚠魏吴关系已较好，无需求亲':''}`,
          disabled: wuRel>=50,
          effect(){
            addDiplo('wei','wu',20);
          }},
        { label:'③ 不搞', desc:`无`, effect(){} },
      ];
    },
    aiChoose(ctx){
      const gold = G.factions.wei?.res?.gold ?? 0;
      if(gold>=800) return 0;
      return 2;
    }
  },

  // ── D4 出师表 ──
  {
    id:'chu_shi_biao', category:'story', playerOnly:true, priority:1, cooldown:9999, oneTime:true,
    season:null, icon:'📜', name:'出师表',
    condition(fid){
      if(fid !== 'shu') return false;
      // 蜀拥有汉中
      if(!G.cities.hanzhong || G.cities.hanzhong.fac !== 'shu') return false;
      // 诸葛亮有丞相官职
      const post = getGenPostDef('诸葛亮');
      if(!post || post.name !== '丞相') return false;
      // 蜀魏处于敌对
      if(getDiploStatus('shu','wei') !== 'enemy') return false;
      // 蜀≥3支部队
      const shuUnits = G.units.filter(u=>u.fac==='shu');
      if(shuUnits.length < 3) return false;
      return {unitCount: shuUnits.length};
    },
    narrative(){
      return `诸葛亮上表——"先帝创业未半而中道崩殂……臣鞠躬尽瘁，死而后已。"满朝文武，无不动容。北伐大业，一触即发。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:'① 准其北伐', desc:`全部队士气+10，忠义/汉室死忠忠+8，hawk忠+5，dove忠-5`,
          effect(){
            // 全势力部队士气+10
            G.units.filter(u=>u.fac===fid).forEach(u=>{
              u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+10); });
            });
            (G.generals[fid]||[]).forEach(g=>{
              if(g.role==='ruler') return;
              const meta = getGenMeta(g.name);
              const tags = GEN_TAGS[g.name]||{};
              const vals = meta.values||[];
              let delta = 0;
              if(vals.includes('忠义') || vals.includes('汉室死忠')) delta += 8;
              if(tags.combat==='hawk') delta += 5;
              if(tags.combat==='dove') delta -= 5;
              if(delta && G.genLoyalty[g.name]!==undefined){
                G.genLoyalty[g.name]=Math.max(0,Math.min(100,G.genLoyalty[g.name]+delta));
                if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
              }
            });
          }},
        { label:'② 暂缓北伐', desc:`诸葛亮忠-5，汉室死忠忠-5，hawk忠-5，dove忠+3`,
          effect(){
            // 诸葛亮忠-5
            if(G.genLoyalty['诸葛亮']!==undefined) G.genLoyalty['诸葛亮']=Math.max(0,G.genLoyalty['诸葛亮']-5);
            if(G.loyaltyAccum) G.loyaltyAccum['诸葛亮']=G.genLoyalty['诸葛亮'];
            (G.generals[fid]||[]).forEach(g=>{
              if(g.role==='ruler') return;
              const meta = getGenMeta(g.name);
              const tags = GEN_TAGS[g.name]||{};
              const vals = meta.values||[];
              let delta = 0;
              if(vals.includes('汉室死忠')) delta -= 5;
              if(tags.combat==='hawk') delta -= 5;
              if(tags.combat==='dove') delta += 3;
              if(delta && G.genLoyalty[g.name]!==undefined){
                G.genLoyalty[g.name]=Math.max(0,Math.min(100,G.genLoyalty[g.name]+delta));
                if(G.loyaltyAccum) G.loyaltyAccum[g.name]=G.genLoyalty[g.name];
              }
            });
          }},
      ];
    },
    aiChoose(){ return 0; } // AI蜀总是北伐
  },

  // ── E1 探子回报 ──
  {
    id:'scout_report', category:'intel', playerOnly:true, priority:2, cooldown:6,
    season:null, icon:'🔍', name:'探子回报',
    condition(fid){
      if(Math.random() >= 0.25) return false; // 25%/旬
      const fog = G.fog?.[fid];
      if(!fog) return false;
      const myUnits = G.units.filter(u=>u.fac===fid && getUnitTroops(u)>0 && u.status!=='garrison');
      for(const u of myUnits){
        const uq=u.hq??0, ur=u.hr??0;
        // 部队周围4格内是否有explored(非visible) hex
        const nearby = fogBFS(uq, ur, 4);
        const hasExplored = nearby.some(k=> (fog[k]??0) === FOG_EXPLORED);
        if(hasExplored){
          // 找部队中最高INT武将名（叙事用）
          let advisor = null, bestInt = 0;
          (u.squads||[]).forEach(sq=>{
            const g = GEN_MAP[sq.genName];
            if(g && g.int > bestInt){ bestInt=g.int; advisor=sq.genName; }
          });
          return {unit:u, advisorName: advisor||'斥候', bestInt};
        }
      }
      return false;
    },
    narrative(ctx){
      return `${ctx.advisorName}呈报——"前方有未经核实的敌情报告，或有敌军动向不明。是否遣人深入查探？"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      const hasSpyGen = (ctx.bestInt||0) > 70;
      return [
        { label:'① 花金验证', desc:`金-100，该部队视野+3格持续2旬${gold<100?' ⚠金不足':''}`,
          disabled: gold<100,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 100);
            ctx.unit._scoutBonus = {radius:3, expiresAt:G.turn+2, precise:false};
            // 立即刷新迷雾让效果生效
            updateFog(fid);
          }},
        { label:'② 信以为真', desc:`免费，不验证情报（可能是过期快照）`,
          effect(){} },
        { label:'③ 派间谍深入', desc:`金-200，视野+3格持续2旬，敌方部队显示精确兵力${!hasSpyGen?' ⚠需部队中有智力>70武将':''}${gold<200?' ⚠金不足':''}`,
          disabled: !hasSpyGen || gold<200,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 200);
            ctx.unit._scoutBonus = {radius:3, expiresAt:G.turn+2, precise:true};
            updateFog(fid);
          }},
      ];
    },
    aiChoose(ctx, pers){
      // 保守型花钱验证，激进型信以为真
      if(pers.diploAggro < 0.5) return 0;
      return 1;
    }
  },

  // ── E2 诱敌深入 ──
  {
    id:'lure_ambush', category:'intel', playerOnly:true, priority:2, cooldown:8,
    season:null, icon:'🪤', name:'诱敌深入',
    condition(fid){
      if(Math.random() >= 0.20) return false; // 20%/旬
      const fog = G.fog?.[fid];
      const myUnits = G.units.filter(u=>u.fac===fid && getUnitTroops(u)>0
        && (u.status==='halt'||u.status==='camp')
        && u.status!=='siege');
      for(const u of myUnits){
        const uq=u.hq??0, ur=u.hr??0;
        const ter = HEX_TERRAIN[hkey(uq,ur)];
        if(ter!=='forest' && ter!=='hill') continue;
        // 4格内有可见敌方部队
        const nearEnemy = G.units.find(eu=>{
          if(eu.fac===fid || getUnitTroops(eu)<=0) return false;
          if(getDiploStatus(fid, eu.fac)!=='enemy') return false;
          if(fog && (fog[hkey(eu.hq??0, eu.hr??0)]??0) < FOG_VISIBLE) return false;
          return hexDist(uq, ur, eu.hq??0, eu.hr??0) <= 4;
        });
        if(nearEnemy){
          let advisor = null, bestInt = 0;
          (u.squads||[]).forEach(sq=>{
            const g = GEN_MAP[sq.genName];
            if(g && g.int > bestInt){ bestInt=g.int; advisor=sq.genName; }
          });
          return {unit:u, enemyUnit:nearEnemy, advisorName:advisor||'斥候', terrain:ter};
        }
      }
      return false;
    },
    narrative(ctx){
      const terrLabel = ctx.terrain==='forest'?'林间':'山地';
      const enemyGen = ctx.enemyUnit.squads?.[0]?.genName||'敌军';
      return `${ctx.advisorName}进言——"${enemyGen}部正向此处推进，我军据${terrLabel}有利地形，若设伏以待，可一战而破之。"`;
    },
    choices(ctx){
      return [
        { label:'① 依计设伏', desc:`部队立即进入伏击状态（免AP），伏击成功率额外+10%`,
          effect(){
            ctx.unit.status = 'ambush';
            ctx.unit._advisedAmbush = true;
          }},
        { label:'② 不必', desc:`保持现状`, effect(){} },
      ];
    },
    aiChoose(ctx, pers){
      // AI总是设伏（有利地形+有敌人接近，没理由不设）
      return 0;
    }
  },

  // ── E3 粮道告急 ──
  {
    id:'supply_crisis', category:'intel', playerOnly:true, priority:1, cooldown:6,
    season:null, icon:'🍚', name:'粮道告急',
    condition(fid){
      const u = G.units.find(u=>u.fac===fid && getUnitTroops(u)>0 && (u._noSupplyTurns||0)>=1);
      if(!u) return false;
      let advisor = null, bestInt = 0;
      (u.squads||[]).forEach(sq=>{
        const g = GEN_MAP[sq.genName];
        if(g && g.int > bestInt){ bestInt=g.int; advisor=sq.genName; }
      });
      return {unit:u, advisorName: advisor||u.squads?.[0]?.genName||'将领'};
    },
    narrative(ctx){
      const mainGen = ctx.unit.squads?.[0]?.genName||'前军';
      return `${ctx.advisorName}急报——"${mainGen}部粮道已断，存粮告急。若不早做打算，恐军心溃散！"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:'① 咬牙坚持', desc:`该部队存粮缓冲+2旬（多撑2旬再断粮惩罚）`,
          effect(){
            ctx.unit._extraRations = (ctx.unit._extraRations||0) + 2;
          }},
        { label:'② 破釜沉舟', desc:`存粮不变，该部队士气+10（背水一战）`,
          effect(){
            ctx.unit.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+10); });
          }},
      ];
    },
    aiChoose(ctx, pers){
      // 保守→咬牙坚持(0)，激进→破釜沉舟(1)
      return pers.diploAggro > 0.6 ? 1 : 0;
    }
  },

  // ── E4 断粮 ──
  {
    id:'enemy_starving', category:'intel', playerOnly:true, priority:2, cooldown:8,
    season:null, icon:'💀', name:'敌军断粮',
    condition(fid){
      if(Math.random() >= 0.20) return false; // 20%/旬
      const fog = G.fog?.[fid];
      // 找己方在敌方领地的部队
      const territory = _buildTerritoryMap();
      const myUnits = G.units.filter(u=>u.fac===fid && getUnitTroops(u)>0);
      for(const u of myUnits){
        const uk = hkey(u.hq??0, u.hr??0);
        const terr = territory[uk];
        if(!terr || terr.fac===fid || !isHostile(fid, terr.fac)) continue;
        // 6格内有断粮敌方部队
        const starvingEnemy = G.units.find(eu=>{
          if(eu.fac===fid || getUnitTroops(eu)<=0) return false;
          if(!isHostile(fid, eu.fac)) return false;
          if((eu._noSupplyTurns||0) < 1) return false;
          if(fog && (fog[hkey(eu.hq??0, eu.hr??0)]??0) < FOG_VISIBLE) return false;
          return hexDist(u.hq??0, u.hr??0, eu.hq??0, eu.hr??0) <= 6;
        });
        if(starvingEnemy){
          let advisor = null, bestInt = 0;
          (u.squads||[]).forEach(sq=>{
            const g = GEN_MAP[sq.genName];
            if(g && g.int > bestInt){ bestInt=g.int; advisor=sq.genName; }
          });
          const enemyGen = starvingEnemy.squads?.[0]?.genName||'敌军';
          return {unit:u, enemyUnit:starvingEnemy, advisorName:advisor||'斥候', enemyGen};
        }
      }
      return false;
    },
    narrative(ctx){
      return `${ctx.advisorName}进言——"${ctx.enemyGen}部粮道已断，若扼守要路，不出数旬必溃。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      // 检查敌方部队是否还在（弹窗期间可能移走）
      const enemyAlive = ctx.enemyUnit && getUnitTroops(ctx.enemyUnit)>0;
      return [
        { label:'① 扼守卡位', desc:`部队转入扎营状态。若该敌军3旬内因断粮溃散，获200经验`,
          effect(){
            ctx.unit.status = 'camp';
            ctx.unit._starvWatch = {targetId:ctx.enemyUnit.id, startTurn:G.turn, expireTurn:G.turn+3};
          }},
        { label:'② 趁虚进攻', desc:`立即对该敌军发起攻击${!enemyAlive?' ⚠敌军已撤':''}`,
          disabled: !enemyAlive,
          effect(){
            // 发起战斗（走现有流程：collectBattleSides→玩家确认弹窗）
            aiInitiateBattle(ctx.unit);
          }},
        { label:'③ 不必', desc:`按兵不动`, effect(){} },
      ];
    },
    aiChoose(ctx, pers){
      // 激进→进攻(1)，保守→卡位(0)
      return pers.diploAggro > 0.6 ? 1 : 0;
    }
  },

  // ── F1 使者来访 ──
  {
    id:'envoy_visit', category:'diplomacy', playerOnly:true, priority:2, cooldown:12,
    season:null, icon:'📨', name:'使者来访',
    condition(fid){
      if(Math.random() >= 0.15) return false; // 15%/旬
      const others = ALL_FACS.filter(f=>{
        if(f===fid) return false;
        // ★ v147: 排除小势力（<3城）和自己的附庸
        const cityCount = Object.values(G.cities).filter(c=>c.fac===f).length;
        if(cityCount < 3) return false;
        if(isSuzerain(fid, f)) return false;
        return true;
      });
      for(const of_ of others){
        const k = `${fid}-${of_}`;
        const d = G.diplo?.[k];
        if(!d) continue;
        if(d.status === 'enemy') continue; // 战争中不来使者
        if(d.rel < 30 || d.rel > 60) continue; // 好感30~60
        const facName = FAC[of_]?.name||of_;
        // 根据AI人格差异化话术
        const pers = AI_PERSONALITY[of_] || AI_PERSONALITY.wei;
        let pitch;
        if(pers.diploAggro > 0.6) pitch = '共分天下';
        else if(pers.diploAggro < 0.4) pitch = '匡扶汉室';
        else pitch = '划江而治';
        return {targetFid:of_, targetName:facName, pitch};
      }
      return false;
    },
    narrative(ctx){
      return `${ctx.targetName}遣使来访，带来厚礼，言及"${ctx.pitch}"之意。使者恭候主公示下。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      return [
        { label:'① 厚礼结盟', desc:`金-300，对${ctx.targetName}好感+20${gold<300?' ⚠金不足':''}`,
          disabled: gold<300,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 300);
            addDiplo(fid, ctx.targetFid, 20);
          }},
        { label:'② 接受不表态', desc:`对${ctx.targetName}好感+5`,
          effect(){
            addDiplo(fid, ctx.targetFid, 5);
          }},
        { label:'③ 斩使立威', desc:`对${ctx.targetName}好感-60，立即开战，全军士气+5`,
          effect(){
            addDiplo(fid, ctx.targetFid, -60);
            // 立即进入战争状态
            const k1=`${fid}-${ctx.targetFid}`, k2=`${ctx.targetFid}-${fid}`;
            if(G.diplo[k1]) { G.diplo[k1].status='enemy'; G.diplo[k1]._warDeclaredTurn=G.turn; }
            if(G.diplo[k2]) { G.diplo[k2].status='enemy'; G.diplo[k2]._warDeclaredTurn=G.turn; }
            // ★ v179fix P37: 走全套无名宣战副作用（信誉-/第三方-/派系冲击/ethos shock）
            // 斩使=无理由开战，按 'none' 宣称强度惩罚；与 14282/14490/37343 路径一致
            applyWarDeclarationEffects(fid, ctx.targetFid, null);
            // D-049/D-131 fix: 斩使立威是 de facto 宣战，触发 warDeclare 派系事件（接口完整性不变量）
            if(ALL_FACS.includes(fid)) triggerFactionEvent('warDeclare', fid, {});
            _aiInvalidateThreatCache();
            // 全军士气+5
            G.units.filter(u=>u.fac===fid).forEach(u=>{
              u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); });
            });
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      // 好战AI：只在已有其他敌人时才考虑斩使（双线作战除外）
      const hasEnemy = ALL_FACS.some(f=>f!==ctx.fid && f!==ctx.targetFid && getDiploStatus(ctx.fid,f)==='enemy');
      if(pers.diploAggro > 0.7 && !hasEnemy) return 1; // 好战但无敌人→不表态（保留外交空间）
      if(pers.diploAggro > 0.7 && hasEnemy && gold>=300) return 0; // 好战+已有敌人+有钱→结盟（拉拢第三方）
      if(gold>=300 && pers.diploAggro < 0.5) return 0; // 保守有钱→结盟
      return 1; // 默认不表态
    }
  },

  // ── F2 远交近攻 ──
  {
    id:'distant_alliance', category:'diplomacy', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'🕊️', name:'远交近攻',
    condition(fid){
      if(Math.random() >= 0.12) return false; // 12%/旬
      const others = ALL_FACS.filter(f=>f!==fid);
      // ★ v147: 辅助——判断两势力是否有城市地理邻接
      const _facsAdjacent = (a,b) => {
        const aCities = Object.values(G.cities).filter(c=>c.fac===a);
        return aCities.some(c => (ROAD_ADJ[c.id]||[]).some(nbId => G.cities[nbId]?.fac===b));
      };
      // 找：玩家与A敌对 + B与A好感<20 + B与玩家好感>30
      for(const enemyF of others){
        if(getDiploStatus(fid, enemyF) !== 'enemy') continue;
        for(const allyF of others){
          if(allyF === enemyF) continue;
          // ★ v147: 候选盟友不能是自己的附庸，且须与敌人地理邻接
          if(isSuzerain(fid, allyF)) continue;
          if(!_facsAdjacent(allyF, enemyF)) continue;
          const allyEnemyRel = G.diplo?.[`${allyF}-${enemyF}`]?.rel ?? 50;
          const allyMeRel = G.diplo?.[`${allyF}-${fid}`]?.rel ?? 50;
          if(allyEnemyRel < 20 && allyMeRel > 30){
            const enemyName = FAC[enemyF]?.name||enemyF;
            const allyName = FAC[allyF]?.name||allyF;
            // 找军师叙事
            let advisor = null;
            const fac = G.factions[fid];
            if(fac?.strategist) advisor = fac.strategist;
            return {enemyFid:enemyF, allyFid:allyF, enemyName, allyName, advisorName:advisor||'谋士'};
          }
        }
      }
      return false;
    },
    narrative(ctx){
      return `${ctx.advisorName}进言——"${ctx.allyName}与${ctx.enemyName}素有嫌隙，若遣使结好，令其攻${ctx.enemyName}后方，可收渔翁之利。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      return [
        { label:'① 遣使联络', desc:`金-200，${ctx.allyName}对${ctx.enemyName}好感-30，${ctx.allyName}视${ctx.enemyName}威胁大增${gold<200?' ⚠金不足':''}`,
          disabled: gold<200,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 200);
            addDiplo(ctx.allyFid, ctx.enemyFid, -30);
            // 威胁矩阵注入：allyFid视enemyFid威胁+50，逐旬递减10
            if(!G._threatBonus) G._threatBonus={};
            if(!G._threatBonus[ctx.allyFid]) G._threatBonus[ctx.allyFid]={};
            G._threatBonus[ctx.allyFid][ctx.enemyFid] = (G._threatBonus[ctx.allyFid][ctx.enemyFid]||0) + 50;
            _aiInvalidateThreatCache();
          }},
        { label:'② 自行解决', desc:`无`, effect(){} },
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      if(gold>=200) return 0;
      return 1;
    }
  },

  // ── F3 天下三分势定 ──
  {
    id:'three_kingdoms_settled', category:'diplomacy', playerOnly:true, priority:1, cooldown:9999, oneTime:true,
    season:null, icon:'⚖️', name:'天下三分势定',
    condition(fid){
      // 仅对玩家势力触发一次（避免三家各触发一次）
      if(fid !== G.playerFac) return false;
      // ★ v136: 最低72旬（2年）门槛，防止开局即触发
      if(G.turn < 72) return false;
      const mainFacs = ['wei','shu','wu']; // ★ v144: 鼎立事件只检查三大势力
      // 三势力各≥10城
      for(const f of mainFacs){
        const cnt = Object.values(G.cities).filter(c=>c.fac===f).length;
        if(cnt < 10) return false;
      }
      // 近12旬城市易手≤1次
      const recentChanges = (G._cityChangeLog||[]).filter(e=>e.turn > G.turn-12 && e.from!=='rebel' && e.to!=='rebel');
      if(recentChanges.length > 1) return false;
      // ★ v136: 三方两两关系≥-10（不在激烈交战中）
      const pairs=[['wei','shu'],['wei','wu'],['shu','wu']];
      for(const [a,b] of pairs){
        const rel = G.diplo[`${a}-${b}`]?.rel ?? 0;
        if(rel < -10) return false;
      }
      return {};
    },
    narrative(){
      return `天下三分，魏蜀吴各据一方，兵戈稍息。谋臣进言——"三分之势已定，此时或休兵养民、或厉兵秣马，皆在主公一念之间。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:'① 顺势休兵', desc:`全局好感向50回归30%，全城民心+5，全部队士气+5`,
          effect(){
            // 好感向50回归30%（只遍历唯一势力对，确保双向对称）
            const pairs=[['wei','shu'],['wei','wu'],['shu','wu']];
            pairs.forEach(([a,b])=>{
              const k1=`${a}-${b}`, k2=`${b}-${a}`;
              const d1=G.diplo[k1], d2=G.diplo[k2];
              if(d1 && d1.rel!==undefined){
                const newRel = d1.rel + (50 - d1.rel) * 0.30;
                d1.rel = newRel;
                if(d2) d2.rel = newRel; // 保持双向一致
              }
            });
            // 全城民心+5
            Object.values(G.cities).forEach(c=>{
              if(ALL_FACS.includes(c.fac)){
                c.morale = Math.min(100, c.morale+5);
              }
            });
            // 全部队士气+5
            G.units.forEach(u=>{
              if(ALL_FACS.includes(u.fac)){
                u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); });
              }
            });
          }},
        { label:'② 趁此良机备战', desc:`己方全城人口质量+5（利用和平期训练兵源）`,
          effect(){
            Object.values(G.cities).filter(c=>c.fac===fid).forEach(c=>{
              c.popQuality = Math.min(100, (c.popQuality||80)+5);
            });
          }},
      ];
    },
    aiChoose(){ return 0; } // AI选休兵
  },

  // ── G1 名士过境 ──
  {
    id:'scholar_visit', category:'daily', playerOnly:true, priority:2, cooldown:8,
    season:null, icon:'📚', name:'名士过境',
    condition(fid){
      if(Math.random() >= 0.05) return false; // 5%/旬（基础低频）
      const myCities = Object.values(G.cities).filter(c=>c.fac===fid);
      if(!myCities.length) return false;
      const city = myCities[Math.floor(Math.random()*myCities.length)];
      // "该城武将"：太守 + 辖区2格内部队武将
      const cdef = CITY_MAP[city.id];
      if(!cdef) return false;
      const nearbyGens = [];
      if(city.prefect) nearbyGens.push(city.prefect);
      G.units.filter(u=>u.fac===fid && getUnitTroops(u)>0).forEach(u=>{
        if(hexDist(u.hq??0, u.hr??0, cdef.q, cdef.r) <= 2){
          u.squads.forEach(sq=>{ if(sq.genName && !nearbyGens.includes(sq.genName)) nearbyGens.push(sq.genName); });
        }
      });
      return {city, nearbyGens};
    },
    narrative(ctx){
      return `有名士途经${ctx.city.name}，博学多才，闻名遐迩。城中士民争相拜访，太守请示主公如何礼遇。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      return [
        { label:'① 请其讲学', desc:`金-100，该城武将各属性经验+12.5，人口质量+3｜文治→仁政 权柄→共治${gold<100?' ⚠金不足':''}`,
          disabled: gold<100,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 100);
            ctx.nearbyGens.forEach(gn=>{
              ['com','war','int','pol'].forEach(s=>addStatExp(gn, s, 12.5));
            });
            ctx.city.popQuality = Math.min(100, (ctx.city.popQuality||80)+3);
            applyEthosShock(fid,'civil',-2,'礼贤名士'); applyEthosShock(fid,'power',-1,'礼贤名士');
          }},
        { label:'② 请其著书', desc:`金-200，人口质量+8｜文治→仁政${gold<200?' ⚠金不足':''}`,
          disabled: gold<200,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 200);
            ctx.city.popQuality = Math.min(100, (ctx.city.popQuality||80)+8);
            applyEthosShock(fid,'civil',-2,'礼贤名士');
          }},
        { label:'③ 赠礼送行', desc:`金-50，信誉+3${gold<50?' ⚠金不足':''}`,
          disabled: gold<50,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 50);
            if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
            G.reputation[fid] = Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT)+3);
          }},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      if(gold>=200 && ctx.nearbyGens.length===0) return 1; // 无武将→著书
      if(gold>=100 && ctx.nearbyGens.length>0) return 0; // 有武将→讲学
      return 2; // 兜底赠礼
    }
  },

  // ── G3 流民涌入 ──
  {
    id:'refugee_influx', category:'daily', playerOnly:true, priority:2, cooldown:6,
    season:null, icon:'🏚️', name:'流民涌入',
    condition(fid){
      if(!G._cityChangeLog || !G._cityChangeLog.length) return false;
      // 本旬有非叛军城市易手
      const thisTurnChanges = G._cityChangeLog.filter(e=>e.turn>=G.turn-1 && e.from!=='rebel' && e.to!=='rebel' && e.from!==fid);
      if(!thisTurnChanges.length) return false;
      const change = thisTurnChanges[0];
      const changedDef = CITY_MAP[change.cityId];
      if(!changedDef) return false;
      // 找己方有城hex距离≤8
      const myCities = Object.values(G.cities).filter(c=>c.fac===fid);
      const nearCity = myCities.find(c=>{
        const cd = CITY_MAP[c.id];
        return cd && hexDist(cd.q, cd.r, changedDef.q, changedDef.r) <= 8;
      });
      if(!nearCity) return false;
      return {city:nearCity, changedCityName:changedDef.name||change.cityId};
    },
    narrative(ctx){
      return `${ctx.changedCityName}战火纷飞，大批流民逃至${ctx.city.name}城外。百姓扶老携幼，衣衫褴褛，恳请收容。`;
    },
    choices(ctx){
      const c = ctx.city;
      const cap = garrisonCap(c);
      return [
        { label:'① 接纳安置', desc:`人口+8%，豪族-3，民心-3｜文治→仁政 方略→扩张`,
          effect(){
            c.pop = Math.floor(c.pop * 1.08);
            c.gentry = Math.max(0, (c.gentry||50) - 3);
            c.morale = Math.max(0, c.morale - 3);
            applyEthosShock(ctx.fid,'civil',-3,'收容流民'); applyEthosShock(ctx.fid,'strategy',1,'收容流民');
          }},
        { label:'② 拒之门外', desc:`民心+2，信誉-2｜文治→暴政`,
          effect(){
            c.morale = Math.min(100, c.morale + 2);
            const fid = ctx.fid;
            if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
            G.reputation[fid] = Math.max(0, (G.reputation[fid]||REPUTATION_DEFAULT) - 2);
            applyEthosShock(fid,'civil',2,'拒绝流民');
          }},
        { label:'③ 择壮编军', desc:`人口+3%，城防+${Math.min(500,cap-(c.garrison||0))}，豪族-5，民心-5｜武略→铁血`,
          effect(){
            c.pop = Math.floor(c.pop * 1.03);
            c.garrison = Math.min(cap, (c.garrison||0) + 500);
            c.gentry = Math.max(0, (c.gentry||50) - 5);
            c.morale = Math.max(0, c.morale - 5);
            applyEthosShock(ctx.fid,'military',3,'编流民为军');
          }},
      ];
    },
    aiChoose(ctx, pers){
      return pers.diploAggro > 0.6 ? 2 : 0; // 激进→编军，保守→接纳
    }
  },

  // ── G4 丰年大收 ──
  {
    id:'harvest_bounty', category:'daily', playerOnly:true, priority:2, cooldown:8,
    season:['秋'], icon:'🌾', name:'丰年大收',
    condition(fid){
      if(SEASONS[G.seasonIdx]!=='秋') return false;
      if(Math.random() >= 0.15) return false; // 15%/旬
      // 找存粮充裕的城（粮食可撑>8旬或净值为正）
      const candidates = Object.values(G.cities).filter(c=>{
        if(c.fac!==fid) return false;
        const turns = getCityFoodTurns(c);
        return turns > 8 || turns === Infinity;
      });
      if(!candidates.length) return false;
      const city = candidates[Math.floor(Math.random()*candidates.length)];
      return {city};
    },
    narrative(ctx){
      return `${ctx.city.name}秋收大丰，仓廪充实，百姓欢欣。太守请示主公——丰年盈余当如何处置？`;
    },
    choices(ctx){
      const c = ctx.city;
      const fid = ctx.fid;
      const cdef = CITY_MAP[c.id];
      // base效果：粮产永久+15%（无论选什么都给）
      const applyBase = ()=>{ c._grainBonus = (c._grainBonus||0) + 0.15; };
      // 辖区2格内部队
      const nearUnits = cdef ? G.units.filter(u=>u.fac===fid && getUnitTroops(u)>0 && hexDist(u.hq??0, u.hr??0, cdef.q, cdef.r)<=2) : [];
      return [
        { label:'① 犒赏三军', desc:`存粮-15%，辖区部队士气+10，粮产永久+15%${!nearUnits.length?' （辖区内无部队，士气效果跳过）':''}`,
          effect(){
            applyBase();
            c.storage = Math.max(0, Math.floor(c.storage * 0.85));
            nearUnits.forEach(u=>{
              u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+10); });
            });
          }},
        { label:'② 安享丰收', desc:`纯拿粮产永久+15%`,
          effect(){
            applyBase();
          }},
        { label:'③ 开市惠民', desc:`存粮-10%，民心+5，豪族+5，粮产永久+15%`,
          effect(){
            applyBase();
            c.storage = Math.max(0, Math.floor(c.storage * 0.90));
            c.morale = Math.min(100, c.morale + 5);
            c.gentry = Math.min(100, (c.gentry||50) + 5);
          }},
      ];
    },
    aiChoose(ctx, pers){
      return pers.diploAggro > 0.6 ? 0 : 2; // 激进→犒军，保守→惠民
    }
  },

  // ── G5 马贩子 ──
  {
    id:'horse_trader', category:'daily', playerOnly:false, priority:2, cooldown:12,
    season:null, icon:'🐴', name:'马贩来访',
    condition(fid){
      if(fid === 'rebel') return false;
      if(Math.random() >= 0.15) return false; // 15%/旬
      const fac = G.factions[fid];
      if(!fac || (fac.res.horses||0) >= 200) return false; // 马匹存量≥200不触发
      return {horses: fac.res.horses};
    },
    narrative(ctx){
      const fac = G.factions[ctx.fid];
      const ruler = fac?.ruler || '主公';
      const isWu = ctx.fid === 'wu';
      const isShu = ctx.fid === 'shu';
      if(isWu) return `一队从北方商路辗转南下的马贩求见${ruler}，驱赶数十匹良驹入境。为首者拱手道："江东虽水乡富庶，战马难寻。我等愿以良驹易金银，助贵军充实骑阵。"`;
      if(isShu) return `西域马贩经陇西入蜀，驱赶一批骏马至成都。为首者称："蜀道虽险，良驹能翻山越岭。愿以此马换些盘缠。"`;
      return `草原马贩驱赶良驹入境，求见${ruler}。为首者道："久闻将军威名，愿以骏马相赠，只求金银盘资。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const gold = G.factions[fid]?.res?.gold ?? 0;
      return [
        { label:'① 大量购入', desc:`金-800，马匹+150${gold<800?' ⚠金不足':''}`,
          disabled: gold<800,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 800);
            G.factions[fid].res.horses = Math.min(99999, (G.factions[fid].res.horses||0) + 150);
          }},
        { label:'② 少量购入', desc:`金-400，马匹+70${gold<400?' ⚠金不足':''}`,
          disabled: gold<400,
          effect(){
            safeSub(G.factions[fid].res, 'gold', 400);
            G.factions[fid].res.horses = Math.min(99999, (G.factions[fid].res.horses||0) + 70);
          }},
        { label:'③ 打发走', desc:'无变化',
          effect(){}},
      ];
    },
    aiChoose(ctx, pers){
      const gold = G.factions[ctx.fid]?.res?.gold ?? 0;
      const horses = G.factions[ctx.fid]?.res?.horses ?? 0;
      if(gold >= 1500 && horses < 300) return 0; // 大量购入
      if(gold >= 800) return 1; // 少量购入
      return 2; // 打发走
    }
  },

  // ── G6 猛将争锋 ──
  {
    id:'warrior_rivalry', category:'personnel', playerOnly:true, priority:2, cooldown:24,
    season:null, icon:'⚔', name:'猛将争锋',
    condition(fid){
      if(Math.random() >= 0.10) return false; // 10%/旬
      const gens = G.generals[fid] || [];
      const warriors = gens.filter(g => g.war >= 90 && g.role !== 'ruler');
      if(warriors.length < 2) return false;
      // 随机打乱后寻找符合条件的配对（至少一人性情为proud）
      const shuffled = _shuffleFY(warriors.slice()); // ★ v179fix P39
      for(let i = 0; i < shuffled.length; i++){
        for(let j = i + 1; j < shuffled.length; j++){
          const a = shuffled[i].name, b = shuffled[j].name;
          const tA = (GEN_TAGS[a]||{}).temperament, tB = (GEN_TAGS[b]||{}).temperament;
          if(tA !== 'proud' && tB !== 'proud') continue; // 至少一人为傲
          const intim = getIntimacy(a, b);
          if(intim >= -19 && intim <= 49){ // 陌生或同僚范围
            return {genA: a, genB: b, warA: shuffled[i].war, warB: shuffled[j].war};
          }
        }
      }
      return false;
    },
    narrative(ctx){
      const diff = Math.abs(ctx.warA - ctx.warB);
      const stronger = ctx.warA >= ctx.warB ? ctx.genA : ctx.genB;
      const weaker = ctx.warA >= ctx.warB ? ctx.genB : ctx.genA;
      if(diff >= 8){
        return `${stronger}近来连战皆捷，军中威望日隆。${weaker}闻之不忿，拍案道："匹夫之勇何足挂齿！若敢与我一较高下，定叫他知晓厉害！"左右皆知二人武艺不凡，纷纷侧目。`;
      }
      return `${ctx.genA}与${ctx.genB}校场偶遇，互不相让。${ctx.genA}道："久闻阁下武艺，今日何不切磋一番？"${ctx.genB}冷笑："正有此意。"二人各执兵器，众将围观，一时难分高下。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:`① 安排比试`, desc:`${ctx.genA}与${ctx.genB}亲密度+25，双方勇武经验+`,
          effect(){
            addIntimacy(ctx.genA, ctx.genB, 25);
            addStatExp(ctx.genA, 'war', 30);
            addStatExp(ctx.genB, 'war', 30);
          }},
        { label:'② 训话压下', desc:'亲密度+5，双方忠诚各-3',
          effect(){
            addIntimacy(ctx.genA, ctx.genB, 5);
            if(G.genLoyalty[ctx.genA] !== undefined) G.genLoyalty[ctx.genA] = Math.max(0, G.genLoyalty[ctx.genA] - 3);
            if(G.genLoyalty[ctx.genB] !== undefined) G.genLoyalty[ctx.genB] = Math.max(0, G.genLoyalty[ctx.genB] - 3);
            if(G.loyaltyAccum){ G.loyaltyAccum[ctx.genA] = G.genLoyalty[ctx.genA]; G.loyaltyAccum[ctx.genB] = G.genLoyalty[ctx.genB]; }
          }},
        { label:'③ 放任不管', desc:'亲密度-15',
          effect(){
            addIntimacy(ctx.genA, ctx.genB, -15);
          }},
      ];
    },
    aiChoose(ctx, pers){
      return 0; // AI优先安排比试
    }
  },

  // ── G7 降将试心 ──
  {
    id:'defector_test', category:'personnel', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'🛡', name:'降将试心',
    condition(fid){
      if(Math.random() >= 0.10) return false; // 10%/旬
      const gens = G.generals[fid] || [];
      const deployed = new Set();
      G.units.forEach(u=>u.squads.forEach(sq=>deployed.add(sq.genName)));
      const cand = gens.filter(g=>{
        if(g.role==='ruler') return false;
        if(deployed.has(g.name)) return false; // 已在部队不触发
        const src = G.genJoinSource[g.name];
        if(src !== 'capture') return false; // 必须是降将
        const tenure = G.turn - (G.genJoinTurn[g.name]||0);
        if(tenure > 120) return false; // 加入超过120旬（~3年）不再触发
        if(tenure < 6) return false; // 刚加入太短也不触发
        return true;
      });
      if(!cand.length) return false;
      const gen = cand[Math.floor(Math.random()*cand.length)];
      const meta = getGenMeta(gen.name);
      return {genName: gen.name, war: gen.war, pol: gen.pol, title: meta.title||''};
    },
    narrative(ctx){
      const isWarrior = ctx.war >= 80;
      if(isWarrior){
        return `降将${ctx.genName}求见主公，伏地叩首："末将归降以来，未立寸功，军中多有猜忌之言。恳请主公予末将一个机会，愿为前驱，纵马革裹尸亦无怨！"言罢泣不成声。`;
      }
      return `降将${ctx.genName}求见主公，言辞恳切："臣自归附，日夜不安，恐主公疑臣二心。愿效犬马之劳，肝脑涂地以报知遇之恩！"`;
    },
    choices(ctx){
      const name = ctx.genName;
      const fid = ctx.fid;
      const hasOffice = !!(getGenPostDef(name) || Object.values(G.cities).some(c=>c.fac===fid && c.prefect===name));
      return [
        { label:'① 准许上阵', desc:'忠诚+15，3旬内须编入部队（否则忠诚-12）',
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+15);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            G._eventPromises.push({genName:name,fid,type:'G7_deploy',promisedAt:G.turn,deadline:G.turn+3,penalty:-12});
            addGenChronicle(name, `请命出战以证忠心，主公允之。`);
          }},
        { label:'② 委以文职', desc:`忠诚+5，政治经验+，3旬内须任命官职或太守（否则忠诚-10）${hasOffice?' ⚠已有职务':''}`,
          disabled: hasOffice,
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.min(100,G.genLoyalty[name]+5);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            addStatExp(name, 'pol', 30);
            G._eventPromises.push({genName:name,fid,type:'G7_office',promisedAt:G.turn,deadline:G.turn+3,penalty:-10});
            addGenChronicle(name, `降将表忠，主公委以文职安抚之。`);
          }},
        { label:'③ 冷处理', desc:'忠诚-8',
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]-8);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
          }},
      ];
    },
    aiChoose(ctx, pers){
      return 0; // AI优先准许上阵
    }
  },

  // ── G8 檄文声讨 ──
  {
    id:'propaganda_war', category:'diplomacy', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'📜', name:'檄文声讨',
    condition(fid){
      if(Math.random() >= 0.12) return false; // 12%/旬
      // 需要与某势力处于战争状态
      const enemies = Object.keys(G.factions).filter(f=>{
        if(f===fid || f==='rebel') return false;
        const k1 = fid+'-'+f, k2 = f+'-'+fid;
        const d = G.diplo && (G.diplo[k1] || G.diplo[k2]);
        return d && d.status === 'enemy';
      });
      if(!enemies.length) return false;
      // 需要有int≥85或pol≥85的文官型武将
      const gens = G.generals[fid] || [];
      const scholars = gens.filter(g=>{
        if(g.role==='ruler') return false;
        const isScholar = g.pol >= 80 || (g.int >= 85 && g.war < g.com);
        return isScholar && (g.int >= 85 || g.pol >= 85);
      });
      if(!scholars.length) return false;
      const scholar = scholars.sort((a,b)=>(b.int+b.pol)-(a.int+a.pol))[0]; // 取最强文官
      const enemy = enemies[Math.floor(Math.random()*enemies.length)];
      return {genName: scholar.name, int: scholar.int, pol: scholar.pol, enemyFid: enemy};
    },
    narrative(ctx){
      const enemyName = FAC[ctx.enemyFid]?.full || FAC[ctx.enemyFid]?.name || ctx.enemyFid;
      return `${ctx.genName}进言："${enemyName}倒行逆施，天下共知。臣愿执笔撰写檄文，昭告其罪于四海，以正视听、振我军威！"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const name = ctx.genName;
      // 成功率：(int+pol)/2 映射到 50%~85%
      const avg = (ctx.int + ctx.pol) / 2;
      const successRate = Math.min(0.85, Math.max(0.50, 0.50 + (avg - 75) / 50 * 0.35));
      const pct = Math.round(successRate * 100);
      return [
        { label:'① 同意发布', desc:`成功率${pct}%｜成功：士气+5/信誉+3/鹰派派系+2｜失败：信誉-2/鹰派派系-2/${name}忠-3`,
          effect(){
            const roll = Math.random();
            if(roll < successRate){
              // ── 成功 ──
              G.units.forEach(u=>{ if(u.fac===fid) u.squads.forEach(sq=>{ sq.morale=Math.min(100,sq.morale+5); }); });
              if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
              G.reputation[fid] = Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT) + 3);
              // 鹰派genFactionMod+2
              if(!G.genFactionMod) G.genFactionMod={};
              if(!G.genFactionModLog) G.genFactionModLog={};
              (G.generals[fid]||[]).forEach(g=>{
                const tags = GEN_TAGS[g.name]||{};
                if(tags.combat==='hawk'){
                  G.genFactionMod[g.name] = Math.max(-20, Math.min(20, (G.genFactionMod[g.name]||0) + 2));
                  if(!G.genFactionModLog[g.name]) G.genFactionModLog[g.name]=[];
                  G.genFactionModLog[g.name].push({turn:G.turn, event:'檄文成功', delta:2, after:G.genFactionMod[g.name]});
                  if(G.genFactionModLog[g.name].length > 8) G.genFactionModLog[g.name].shift();
                }
              });
              addGenChronicle(name, `撰檄文声讨${FAC[ctx.enemyFid]?.name||ctx.enemyFid}，文采斐然，天下传诵。`);
              log(`📜 ${name}檄文声讨${FAC[ctx.enemyFid]?.name||ctx.enemyFid}大获成功！全军士气振奋。`,'event');
              showNotif(`${name}檄文大获成功！士气+5 信誉+3`,'good');
              applyEthosShock(fid,'strategy',3,'檄文成功'); applyEthosShock(fid,'mandate',2,'檄文正名');
            } else {
              // ── 失败 ──
              if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
              G.reputation[fid] = Math.max(0, (G.reputation[fid]||REPUTATION_DEFAULT) - 2);
              // 鹰派genFactionMod-2
              if(!G.genFactionMod) G.genFactionMod={};
              if(!G.genFactionModLog) G.genFactionModLog={};
              (G.generals[fid]||[]).forEach(g=>{
                const tags = GEN_TAGS[g.name]||{};
                if(tags.combat==='hawk'){
                  G.genFactionMod[g.name] = Math.max(-20, Math.min(20, (G.genFactionMod[g.name]||0) - 2));
                  if(!G.genFactionModLog[g.name]) G.genFactionModLog[g.name]=[];
                  G.genFactionModLog[g.name].push({turn:G.turn, event:'檄文失败', delta:-2, after:G.genFactionMod[g.name]});
                  if(G.genFactionModLog[g.name].length > 8) G.genFactionModLog[g.name].shift();
                }
              });
              if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]-3);
              if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
              addGenChronicle(name, `撰檄文声讨${FAC[ctx.enemyFid]?.name||ctx.enemyFid}，文辞不佳，反遭嘲讽。`);
              log(`📜 ${name}檄文声讨失败，文辞拙劣，反遭${FAC[ctx.enemyFid]?.name||ctx.enemyFid}嘲讽。`,'event');
              showNotif(`${name}檄文失败…信誉-2`,'warn');
            }
          }},
        { label:'② 拒绝', desc:`${name}忠诚-3｜方略→守成`,
          effect(){
            if(G.genLoyalty[name]!==undefined) G.genLoyalty[name]=Math.max(0,G.genLoyalty[name]-3);
            if(G.loyaltyAccum) G.loyaltyAccum[name]=G.genLoyalty[name];
            applyEthosShock(fid,'strategy',-1,'拒发檄文');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const avg = (ctx.int + ctx.pol) / 2;
      return avg >= 85 ? 0 : 1; // AI高文官才敢发檄文
    }
  },

  // ── G9 莽夫闯祸 ──
  {
    id:'reckless_trouble', category:'personnel', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'🍺', name:'莽夫闯祸',
    condition(fid){
      if(Math.random() >= 0.10) return false; // 10%/旬
      const gens = G.generals[fid] || [];
      // 收集garrison状态部队中的武将→城市映射
      const garrisonGenCity = {};
      G.units.forEach(u=>{
        if(u.fac !== fid || u.status !== 'garrison') return;
        const cid = HEX_CITY[hkey(u.hq??0, u.hr??0)];
        if(!cid) return;
        u.squads.forEach(sq=>{ if(sq.genName) garrisonGenCity[sq.genName] = cid; });
      });
      // 候选：reckless + (太守 or garrison驻城) + 非君主
      const candidates = [];
      for(const g of gens){
        if(g.role === 'ruler') continue;
        const tags = GEN_TAGS[g.name] || {};
        if(tags.temperament !== 'reckless') continue;
        // 检查太守
        const prefectCity = Object.values(G.cities).find(c => c.fac === fid && c.prefect === g.name);
        if(prefectCity){
          candidates.push({genName: g.name, cityId: prefectCity.id, war: g.war});
          continue;
        }
        // 检查garrison驻城
        if(garrisonGenCity[g.name]){
          candidates.push({genName: g.name, cityId: garrisonGenCity[g.name], war: g.war});
        }
      }
      if(!candidates.length) return false;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const cityName = CITY_MAP[pick.cityId]?.name || pick.cityId;
      return {genName: pick.genName, cityId: pick.cityId, cityName, war: pick.war};
    },
    narrative(ctx){
      return `${ctx.genName}在${ctx.cityName}城中饮酒，酒后与商贾争执，竟拔刀伤人，闹得满城皆知。士绅联名告状，城中人心惶惶。左右禀报，请主公定夺。`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const name = ctx.genName;
      const cid = ctx.cityId;
      return [
        { label:'① 严惩赔偿', desc:`金-200，${ctx.cityName}民心+3，${name}忠诚-5`,
          effect(){
            const fac = G.factions[fid];
            if(fac) fac.res.gold = Math.max(0, (fac.res.gold||0) - 200);
            const city = G.cities[cid];
            if(city) city.morale = Math.min(100, (city.morale||50) + 3);
            if(G.genLoyalty[name] !== undefined) G.genLoyalty[name] = Math.max(0, G.genLoyalty[name] - 5);
            if(G.loyaltyAccum) G.loyaltyAccum[name] = G.genLoyalty[name];
            addGenChronicle(name, `在${ctx.cityName}酒后伤人，被主公严惩赔偿，忿忿不平。`);
            log(`🍺 ${name}在${ctx.cityName}闯祸，主公严惩赔偿，民心安定。`,'event');
            showNotif(`${name}被严惩赔偿 金-200 民心+3`,'warn');
            applyEthosShock(fid,'civil',-2,'依法严惩');
          }},
        { label:'② 包庇压下', desc:`${ctx.cityName}民心-3，${name}忠诚+5，豪族支持-5`,
          effect(){
            const city = G.cities[cid];
            if(city){
              city.morale = Math.max(0, (city.morale||50) - 3);
              city.gentry = Math.max(0, (city.gentry||50) - 5);
            }
            if(G.genLoyalty[name] !== undefined) G.genLoyalty[name] = Math.min(100, G.genLoyalty[name] + 5);
            if(G.loyaltyAccum) G.loyaltyAccum[name] = G.genLoyalty[name];
            addGenChronicle(name, `在${ctx.cityName}酒后伤人，主公包庇压下，士绅不满。`);
            log(`🍺 ${name}在${ctx.cityName}闯祸，主公包庇压下，士绅不满。`,'event');
            showNotif(`包庇${name} 忠诚+5 但民心-3 豪族-5`,'warn');
            applyEthosShock(fid,'power',2,'包庇武将'); applyEthosShock(fid,'civil',2,'包庇武将');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const fac = G.factions[ctx.fid];
      return (fac && (fac.res.gold||0) >= 600) ? 0 : 1; // 有钱严惩，没钱包庇
    }
  },

  // ═══════════════════════════════════════
  // H类：价值观驱动事件（4个）★ v152
  // ═══════════════════════════════════════

  // ── H1 劝进表 ──
  {
    id:'quanjin_biao', category:'story', playerOnly:false, priority:1, cooldown:24, oneTime:true,
    season:null, icon:'📜', name:'劝进表',
    condition(fid){
      if(FAC_IDENTITY[fid]?.type === 'emperor') return false; // 已称帝
      const eth = G.factions[fid]?.ethos;
      if(!eth || eth.mandate < 20) return false;
      // 需要warlord标签武将在朝
      const gens = G.generals[fid] || [];
      const warlords = gens.filter(g => g.role !== 'ruler' && (GEN_TAGS[g.name]||{}).politics === 'warlord');
      if(!warlords.length) return false;
      const proposer = warlords.sort((a,b) => (b.pol+b.int) - (a.pol+a.int))[0];
      const hasEmperor = G.emperor?.holder === fid;
      return {genName: proposer.name, hasEmperor};
    },
    narrative(ctx){
      if(ctx.hasEmperor){
        return `${ctx.genName}率群臣联名上表，援引尧舜禅让故事，劝主公受禅即大位：「天命所归，汉祚已移，陛下当顺天应人，即皇帝位！」`;
      }
      return `${ctx.genName}率群臣联名上表，劝主公即大位以安天下：「今四海纷争，天下无主，主公德高望重，当即帝位以正纲常！」`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const mandatePush = ctx.hasEmperor ? 15 : 10;
      const repCost = ctx.hasEmperor ? -5 : 0;
      const repLabel = ctx.hasEmperor ? '，信誉-5' : '';
      return [
        { label:'① 从善如流', desc:`天命+${mandatePush}，warlord派系+3，尊汉派系-4${repLabel}｜大幅推向篡汉`,
          effect(){
            applyEthosShock(fid, 'mandate', mandatePush, '劝进表');
            if(ctx.hasEmperor){
              if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
              G.reputation[fid] = Math.max(0, (G.reputation[fid]||REPUTATION_DEFAULT) - 5);
            }
            // warlord派系+3
            (G.generals[fid]||[]).forEach(g => {
              if(g.role==='ruler') return;
              const tags = GEN_TAGS[g.name]||{};
              if(tags.politics==='warlord'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)+3));
              }
              if(tags.politics==='uniHan'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)-4));
              }
            });
            // 如果已满足称帝条件，提示
            if(fid===G.playerFac && canEnthrone(fid)){
              showNotif('群臣劝进，称帝条件已备！可前往外交面板行大礼','good');
            }
            log(`📜 ${ctx.genName}上劝进表，主公从善如流，天下侧目`,'event');
          }},
        { label:'② 三辞不受', desc:`天命-3，尊汉派系+2，warlord派系-2`,
          effect(){
            applyEthosShock(fid, 'mandate', -3, '辞让劝进');
            (G.generals[fid]||[]).forEach(g => {
              if(g.role==='ruler') return;
              const tags = GEN_TAGS[g.name]||{};
              if(tags.politics==='uniHan'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)+2));
              }
              if(tags.politics==='warlord'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)-2));
              }
            });
            log(`📜 ${ctx.genName}上劝进表，主公三辞不受`,'event');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const eth = G.factions[ctx.fid]?.ethos;
      // mandate越高越可能接受
      return (eth && eth.mandate >= 35) ? 0 : 1;
    }
  },

  // ── H2 还政天子 ──
  {
    id:'return_emperor', category:'story', playerOnly:false, priority:1, cooldown:18,
    season:null, icon:'👑', name:'还政天子',
    condition(fid){
      if(!G.emperor || G.emperor.holder !== fid) return false; // 必须持有天子
      const eth = G.factions[fid]?.ethos;
      if(!eth || eth.mandate < 25) return false;
      const gens = G.generals[fid] || [];
      const uniHans = gens.filter(g => g.role !== 'ruler' && (GEN_TAGS[g.name]||{}).politics === 'uniHan');
      if(!uniHans.length) return false;
      const proposer = uniHans.sort((a,b) => (b.pol+b.int) - (a.pol+a.int))[0];
      return {genName: proposer.name};
    },
    narrative(ctx){
      return `${ctx.genName}上书主公：「天子蒙尘日久，海内忠臣翘首以盼。主公若行还政之举，天下士人必归心。虽为姿态，亦可正视听、安人心。」`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:'① 做还政姿态', desc:`天命-10，信誉+5，尊汉派系+4，warlord派系-3｜大幅回拉崇汉`,
          effect(){
            applyEthosShock(fid, 'mandate', -10, '还政姿态');
            if(!G.reputation) G.reputation={wei:45,shu:80,wu:60,nanman:30};
            G.reputation[fid] = Math.min(100, (G.reputation[fid]||REPUTATION_DEFAULT) + 5);
            (G.generals[fid]||[]).forEach(g => {
              if(g.role==='ruler') return;
              const tags = GEN_TAGS[g.name]||{};
              if(tags.politics==='uniHan'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)+4));
              }
              if(tags.politics==='warlord'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)-3));
              }
            });
            log(`👑 ${ctx.genName}谏言还政天子，主公作还政姿态，天下士人归心`,'event');
            showNotif('还政姿态！天命-10 信誉+5','good');
          }},
        { label:'② 斥退不听', desc:`天命+3，尊汉派系-3｜进一步篡汉`,
          effect(){
            applyEthosShock(fid, 'mandate', 3, '拒绝还政');
            (G.generals[fid]||[]).forEach(g => {
              if(g.role==='ruler') return;
              const tags = GEN_TAGS[g.name]||{};
              if(tags.politics==='uniHan'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)-3));
              }
            });
            log(`👑 ${ctx.genName}谏言还政天子，主公斥退不听`,'event');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const eth = G.factions[ctx.fid]?.ethos;
      // mandate低（还接近崇汉）→ 做姿态；mandate高→ 斥退
      return (eth && eth.mandate < 40) ? 0 : 1;
    }
  },

  // ── H3 整肃吏治 ──
  {
    id:'anti_corruption', category:'daily', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'⚖', name:'整肃吏治',
    condition(fid){
      if(Math.random() >= 0.10) return false;
      const myCities = Object.values(G.cities).filter(c => c.fac === fid);
      if(myCities.length < 4) return false;
      // 检查腐败是否严重：总腐败损失 > 金收入15%
      const cityCount = myCities.length;
      let totalCorrupt = 0, totalGold = 0;
      myCities.forEach(c => {
        const rate = calcCityCorruption(c, cityCount);
        const prod = getCityProd(c);
        totalCorrupt += (prod?.gold || 0) * rate;
        totalGold += (prod?.gold || 0);
      });
      if(totalGold <= 0 || totalCorrupt / totalGold < 0.15) return false;
      // 需要pol≥80的文官
      const gens = G.generals[fid] || [];
      const scholars = gens.filter(g => g.role !== 'ruler' && g.pol >= 80);
      if(!scholars.length) return false;
      const proposer = scholars.sort((a,b) => b.pol - a.pol)[0];
      const pct = Math.round(totalCorrupt / totalGold * 100);
      return {genName: proposer.name, corruptPct: pct};
    },
    narrative(ctx){
      return `${ctx.genName}上书：「近年疆域日广，郡县贪墨之风渐盛（腐败${ctx.corruptPct}%），官吏中饱私囊，百姓苦不堪言。臣请主公整肃吏治，严明法度。」`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:'① 严刑峻法', desc:`全势力腐败率临时-5%（1季），权柄→集权，文治→仁政（严法为民）`,
          effect(){
            if(!G.courtDecrees) G.courtDecrees = [];
            G.courtDecrees.push({fid, buffKey:'corruptReduce', effectVal:-0.05, name:'严刑峻法', proposer:ctx.genName, expiresAt:G.turn+9});
            applyEthosShock(fid, 'power', 3, '严刑峻法');
            applyEthosShock(fid, 'civil', -2, '严刑峻法');
            log(`⚖ ${ctx.genName}主持整肃吏治：严刑峻法，贪者斩首`,'event');
            showNotif('严刑峻法！腐败-5% 权柄→集权','info');
          }},
        { label:'② 重用本地士族', desc:`全势力腐败率临时-5%（1季），权柄→共治`,
          effect(){
            if(!G.courtDecrees) G.courtDecrees = [];
            G.courtDecrees.push({fid, buffKey:'corruptReduce', effectVal:-0.05, name:'重用士族治腐', proposer:ctx.genName, expiresAt:G.turn+9});
            applyEthosShock(fid, 'power', -3, '重用士族');
            applyEthosShock(fid, 'civil', -1, '士族治理');
            log(`⚖ ${ctx.genName}主持整肃吏治：重用本地士族，以乡治乡`,'event');
            showNotif('重用士族治腐！腐败-5% 权柄→共治','info');
          }},
        { label:'③ 搁置不理', desc:`腐败持续，文治→暴政`,
          effect(){
            applyEthosShock(fid, 'civil', 2, '放任腐败');
            log(`⚖ ${ctx.genName}上书整肃吏治，主公搁置不理`,'event');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const eth = G.factions[ctx.fid]?.ethos;
      // 集权倾向→严刑(0)，共治倾向→士族(1)
      return (eth && eth.power > 0) ? 0 : 1;
    }
  },

  // ── H4 举孝廉 ──
  {
    id:'juxiaolian', category:'daily', playerOnly:true, priority:2, cooldown:18,
    season:null, icon:'🎓', name:'举孝廉',
    condition(fid){
      if(Math.random() >= 0.08) return false;
      const myCities = Object.values(G.cities).filter(c => c.fac === fid);
      if(myCities.length < 4) return false;
      // 需要gentry标签武将≥3人
      const gens = G.generals[fid] || [];
      const gentryGens = gens.filter(g => g.role !== 'ruler' && (GEN_TAGS[g.name]||{}).origin === 'gentry');
      if(gentryGens.length < 3) return false;
      const proposer = gentryGens.sort((a,b) => b.pol - a.pol)[0];
      return {genName: proposer.name, gentryCount: gentryGens.length};
    },
    narrative(ctx){
      return `${ctx.genName}联合${ctx.gentryCount - 1}位士族同僚上书：「汉制举孝廉，选贤任能，天下归心。今当恢复察举之制，广纳贤才，以充朝堂。」`;
    },
    choices(ctx){
      const fid = ctx.fid;
      return [
        { label:'① 准奏恢复', desc:`下次在野刷新+2人，士族派系+3，权柄→共治`,
          effect(){
            if(!G._juxiaolianBonus) G._juxiaolianBonus = {};
            G._juxiaolianBonus[fid] = (G._juxiaolianBonus[fid]||0) + 2;
            // 士族派系+3
            (G.generals[fid]||[]).forEach(g => {
              if(g.role==='ruler') return;
              const tags = GEN_TAGS[g.name]||{};
              if(tags.origin === 'gentry'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)+3));
              }
            });
            applyEthosShock(fid, 'power', -2, '举孝廉');
            log(`🎓 ${ctx.genName}主持恢复察举制，广纳贤才`,'event');
            showNotif('恢复察举！下次在野+2 权柄→共治','good');
          }},
        { label:'② 驳回', desc:`士族派系-2，权柄→集权`,
          effect(){
            (G.generals[fid]||[]).forEach(g => {
              if(g.role==='ruler') return;
              const tags = GEN_TAGS[g.name]||{};
              if(tags.origin === 'gentry'){
                if(!G.genFactionMod) G.genFactionMod={};
                G.genFactionMod[g.name] = Math.max(-20,Math.min(20,(G.genFactionMod[g.name]||0)-2));
              }
            });
            applyEthosShock(fid, 'power', 1, '驳回察举');
            log(`🎓 ${ctx.genName}请恢复察举制，主公驳回`,'event');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const eth = G.factions[ctx.fid]?.ethos;
      // 共治倾向→准奏(0)，集权倾向→驳回(1)
      return (eth && eth.power < 0) ? 0 : 1;
    }
  },

  // ── v153: 水淹围城 ──
  {
    id:'flood_siege', category:'military', playerOnly:false, priority:1, cooldown:24,
    season:null, icon:'🌊', name:'水淹围城',
    condition(fid){
      if(fid === 'rebel') return false;
      const s = SEASONS[G.seasonIdx];
      if(s !== '夏' && s !== '秋') return false; // 雨季
      const siegeUnits = G.units.filter(u => u.fac === fid && u.status === 'siege' && u.siegeTarget);
      for(const u of siegeUnits){
        const cdef = CITY_MAP[u.siegeTarget];
        if(!cdef) continue;
        const nbs = hexNeighbors(cdef.q, cdef.r);
        const hasWater = nbs.some(nb => WATER_TERRAINS.has(HEX_TERRAIN[hkey(nb.col, nb.row)] || ''));
        if(!hasWater) continue;
        // 历史城市（下邳/襄阳）加成概率
        const hist = (u.siegeTarget === 'xiapi' || u.siegeTarget === 'xiangyang');
        const prob = hist ? 0.35 : 0.20;
        if(Math.random() < prob) return {cityId: u.siegeTarget, unitId: u.id, hist};
      }
      return false;
    },
    narrative(ctx){
      const cname = G.cities[ctx.cityId]?.name || '此城';
      const u = G.units.find(u => u.id === ctx.unitId);
      const gen = u?.squads[0]?.genName || '将军';
      if(ctx.hist) return `${gen}围困${cname}日久，谋士进言——"此城临水而建，昔日水淹之法正合此地。若掘堤引水灌城，敌军必溃，可免数月攻坚之苦。然水火无情，百姓难免遭殃。"`;
      return `${gen}围困${cname}日久，谋士察地势进言——"此城近水，若引水灌之，城防可不攻自破。然百姓必受其害，主公三思。"`;
    },
    choices(ctx){
      const fid = ctx.fid;
      const city = G.cities[ctx.cityId];
      return [
        { label:'① 决水淹城', desc:`城防衰减+40%（大幅缩短围城），人口-10%，城市民心-15，信誉-3｜文治→暴政`,
          effect(){
            if(!city) return;
            city.siegeDecay = Math.min(1.0, (city.siegeDecay||0) + 0.40);
            const popLoss = Math.floor(city.pop * 0.10);
            city.pop = Math.max(1000, city.pop - popLoss);
            city.morale = Math.max(0, city.morale - 15);
            if(!G.reputation) G.reputation={};
            G.reputation[fid] = Math.max(0, (G.reputation[fid]||REPUTATION_DEFAULT) - 3);
            applyEthosShock(fid, 'civil', 5, '水淹围城');
            log(`🌊 ${city.name}被水淹！城防衰减+40%，人口损失${popLoss}人`, 'event');
          }},
        { label:'② 不用水攻', desc:'继续正常围城',
          effect(){
            const cname = G.cities[ctx.cityId]?.name || '此城';
            log(`🌊 ${cname}围城中，拒绝水攻`, 'event');
          }},
      ];
    },
    aiChoose(ctx, pers){
      const eth = G.factions[ctx.fid]?.ethos;
      if(eth && eth.civil < -30) return 1; // 仁政路线不水淹
      return 0; // 默认水淹
    }
  },
];
