// src/data/tags.js
//
// 8 链共用的 tags / categories / status enum(Session 1.6 / 阶段 1)
//
// 来源:从 project_romance_v181.html 整体抽离。本文件只搬运,不改逻辑。
//   - SEASONS / SEASON_MOD / YEARS(原 L814-L816):时间/季节枚举,经济/事件/军事链共用
//   - TAGS(原 L820-L830):城市标签表(都市/平原/水乡/港口/山地/雄关/产马/产铁/产木),
//     8 链共用,影响经济(粮金木铁产出)+ 军事(攻城耐久)+ 槽位
//   - getCityStats(原 L832-L843):TAGS 派生 helper,把多 tags 累加成 modifier
//   - STAGE_NAMES / STAGE_ORDER(原 L1193-L1194):势力演进阶段枚举(warlord/regional/regime),
//     政治/豪族/经济链共用
//   - ETHOS_DIMS / ETHOS_LABELS / ETHOS_DIM_NAMES(原 L1215-L1223):价值观 5 维 schema,
//     8 链共用(每条链都有 ethos 联动钩子)
//   - _ethosTierLabel(原 L1224-L1252):ethos 数值→四字描述,UI/事件链共用
//
// 留 v181 的:
//   - STAGE_GENTRY_BOUNDS / STAGE_PROMO(stage 派生规则,phase 3 政治/豪族链)
//   - STAGE_TIER1_SLOTS / STAGE_LABEL_CAP / STAGE_LABEL_FLOOR(官职派生,phase 3)
//   - TRIBUTE_RATES(纳贡比例,phase 3 经济链)
//   - CLAIM_TYPES / CLAIM_EFFECTS / ENTHRONE_FACTION_EFFECTS(C3 称帝系统,phase 3)
//   - SIEGE_AFTERMATH(攻城后处置,phase 3 军事链)
//   - TAX / POLICY / CORVEE(制度数据,phase 3 经济链)
//   - MIGRATE_*(迁民数值,phase 3)
//
// loading 顺序:本文件在 events.js 之前加载(events.js callbacks 引用 SEASONS,
// 虽 lazy resolve 但顺序保险更清晰)。

// ── TIME ──
const SEASONS=['春','夏','秋','冬'];
const SEASON_MOD={春:1.1,夏:0.9,秋:1.2,冬:0.75};
const YEARS=['建安十九年','建安二十年','建安二十一年','建安二十二年','建安二十三年','建安二十四年','建安二十五年','黄初元年','黄初二年','黄初三年','黄初四年','黄初五年','黄初六年','黄初七年','太和元年'];

// ── MULTI-TAG SYSTEM ──
// ★ 已调整：山地 foodM -0.30→-0.15，雄关 foodM -0.40→-0.20
const TAGS={
  都市:{icon:'🏙',color:'#6b5530',foodM:0,   goldM:.20,woodM:0,  slots:2, durM:1.0, desc:'人口中心 金钱+20% 槽位+2'},
  平原:{icon:'🌾',color:'#7aaa30',foodM:.40, goldM:0,  woodM:0,  slots:0, durM:1.0, desc:'农业沃土 粮食+40%'},
  水乡:{icon:'🌊',color:'#3090c0',foodM:.10, goldM:0,  woodM:.40,slots:0, durM:1.1, desc:'水网密布 粮食+10% 木材+40% 耐久+10%'},
  港口:{icon:'⚓',color:'#2060a0',foodM:0,   goldM:.40,woodM:0,  slots:0, durM:1.0, desc:'商贸要道 金钱+40% 可建港口升级'},
  山地:{icon:'⛰',color:'#806050',foodM:-.15,goldM:0,  woodM:.20,slots:-1,durM:1.4, desc:'险峻地形 粮食-15% 木材+20% 耐久+40%'},
  雄关:{icon:'🏯',color:'#909090',foodM:-.20,goldM:0,  woodM:0,  slots:-1,durM:2.0, desc:'天下要隘 围城耐久×2 粮食-20%'},       // ★ -0.40→-0.20
  产马:{icon:'🐴',color:'#c08040',foodM:0,   goldM:0,  woodM:0,  slots:0, durM:1.0, desc:'产马之地 马匹产出×3'},
  产铁:{icon:'⚙', color:'#8090a0',foodM:0,   goldM:0,  woodM:0,  slots:0, durM:1.0, desc:'铁矿丰富 铁矿+100%',ironM:1.0},
  产木:{icon:'🪵',color:'#507040',foodM:0,   goldM:0,  woodM:.80,slots:0, durM:1.0, desc:'林木茂盛 木材+80%'},
};

function getCityStats(tags){
  let foodM=1,goldM=1,woodM=1,ironM=1,slots=3,durM=1;
  (tags||[]).forEach(t=>{
    const td=TAGS[t]; if(!td) return;
    foodM+=td.foodM||0; goldM+=td.goldM||0;
    woodM+=td.woodM||0; ironM+=(td.ironM||0);
    slots+=td.slots||0; durM*=(td.durM||1);
  });
  const hasHorse=(tags||[]).includes('产马');
  return{foodM:Math.max(.1,foodM),goldM:Math.max(.1,goldM),woodM:Math.max(.1,woodM),
         ironM:Math.max(1,ironM),horseM:hasHorse?3.0:1.0,slots:Math.max(1,slots),durM};
}

// ── 势力演进阶段枚举 ──
const STAGE_NAMES = { warlord:'军阀', regional:'一方之主', regime:'政权' };
const STAGE_ORDER = { warlord:0, regional:1, regime:2 };

// ── 价值观 5 维 schema ──
const ETHOS_DIMS = ['mandate','power','civil','military','strategy'];
const ETHOS_LABELS = {
  mandate:  { neg:'崇汉', pos:'篡汉',   icon:'👑' },
  power:    { neg:'士族共治', pos:'集权', icon:'⚖' },
  civil:    { neg:'仁政', pos:'暴政',    icon:'🏛' },
  military: { neg:'怀柔', pos:'铁血',    icon:'⚔' },
  strategy: { neg:'守成', pos:'扩张',    icon:'🗺' },
};
const ETHOS_DIM_NAMES = { mandate:'天命', power:'权柄', civil:'文治', military:'武略', strategy:'方略' };
function _ethosTierLabel(val, dim){
  const abs = Math.abs(val);
  if(abs < 15) return '不偏不倚';
  // 每个维度×每个方向×3个等级 = 独立的四字描述
  const labels = {
    mandate: {
      neg: abs < 40 ? '心系汉室' : abs < 70 ? '矢志兴汉' : '汉贼不两立',
      pos: abs < 40 ? '天命有归' : abs < 70 ? '代汉自立' : '改朝换代',
    },
    power: {
      neg: abs < 40 ? '兼听则明' : abs < 70 ? '与士共治' : '君弱臣强',
      pos: abs < 40 ? '乾纲独断' : abs < 70 ? '大权在握' : '唯我独尊',
    },
    civil: {
      neg: abs < 40 ? '爱民如子' : abs < 70 ? '仁德布四方' : '圣主明君',
      pos: abs < 40 ? '严刑峻法' : abs < 70 ? '苛政猛于虎' : '残暴不仁',
    },
    military: {
      neg: abs < 40 ? '以德服人' : abs < 70 ? '偃武修文' : '刀枪入库',
      pos: abs < 40 ? '厉兵秣马' : abs < 70 ? '穷兵黩武' : '嗜杀成性',
    },
    strategy: {
      neg: abs < 40 ? '固守疆土' : abs < 70 ? '韬光养晦' : '闭关锁国',
      pos: abs < 40 ? '开疆拓土' : abs < 70 ? '鲸吞蚕食' : '席卷天下',
    },
  };
  const side = val >= 0 ? 'pos' : 'neg';
  return labels[dim]?.[side] || (val >= 0 ? ETHOS_LABELS[dim].pos : ETHOS_LABELS[dim].neg);
}
