// 190.js
//
// SCENARIO_190 — 诸侯讨董(190 年初平元年)初始 state 切片
//
// 状态: phase 4-b — generals 60 active 武将 (14 ruler + 46 心腹):
//   - phase 2-a (done): 元字段 + scenarios register 基础设施
//   - phase 2-b (done): factions 14 势力 + diplo 91 pair (F.1 invariant)
//   - phase 3   (done): cities 55 城 fac/pop/troops/isCapital
//   - phase 4-a (done): GEN_BASE +80 → 213 entries
//   - phase 4-b (本):   generals 60 active (fac/city/role/post/loyalty/merit/retainer/initialUnit)
//   - phase 4-c:        relations 双向 + wild/pending 池 + initialUnits[] + foundingCore
//
// 字段 schema 同 SCENARIO_214 (见 214.js header + docs/scenario_system.md §3.4).
// 14 势力史实参考 docs/scenario_system.md §4.
//
// 注意:
// - nanman 190 期不参与中原讨董, 不列入 factions
// - foundingCore=[] stub (phase 4-c 才填)
// - validator (tests/scenario_validate.js) 跑 190 仍有部分 errors (wild/pending 未填) — expected
// - 默认 applyScenario('214') 不会真 init 190, smoke 不受影响

const SCENARIO_190 = {
  "id": "190",
  "version": "0.6",
  "name": "诸侯讨董",
  "startYear": 190,
  "description": "东汉初平元年,董卓废少帝立献帝,关东诸侯起兵讨董,群雄并起。",
  "provenance": "phase 4-d: +23 active 武将 (史实重 allocate) — 83 active; wild/pending 留 future",
  // startYear=190 (初平元年) 时天子献帝仍在洛阳, 董卓持. 191 年才西迁长安.
  "emperor": {
    "cityId": "luoyang",
    "holder": "dongzhuo"
  },
  "factions": {
    // ── 强势 (regime / regional, 持献帝或盟主) ──
    "dongzhuo": {
      "ruler": "董卓",
      "playable": true,
      "type": "emperor_holder",
      "_baseType": "warlord",
      "traits": ["暴主", "凉州军"],
      "stage": "regime",
      "anchorState": null,
      "ethos": { "mandate": -25, "power": 20, "civil": -15, "military": 20, "strategy": 5 },
      "res": { "gold": 12000, "wood": 1500, "iron": 1800, "horses": 5000 },
      "reputation": 10,
      "emperor": true,
      "techPreunlock": ["mil1"],
      "aiPersonality": { "atkThreshold": 0.45, "siegeThreshold": 0.5, "diploAggro": 0.75, "deployBias": 0.2, "budgetBias": 0.15 },
      "foundingCore": ["董卓","吕布","李傕","郭汜","华雄","张辽","牛辅","徐荣"]
    },
    "yuanshao": {
      "ruler": "袁绍",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["四世三公", "盟主"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": 5, "power": 10, "civil": 10, "military": 5, "strategy": 5 },
      "res": { "gold": 9000, "wood": 2200, "iron": 1500, "horses": 2500 },
      "reputation": 85,
      "emperor": false,
      "techPreunlock": ["econ1"],
      "aiPersonality": { "atkThreshold": 0.55, "siegeThreshold": 0.55, "diploAggro": 0.6, "deployBias": 0.1, "budgetBias": 0.05 },
      "foundingCore": ["袁绍","颜良","文丑","审配","麴义","田丰","沮授","逢纪","许攸"]
    },
    "yuanshu": {
      "ruler": "袁术",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["名门", "野心"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": -10, "power": 15, "civil": -5, "military": 5, "strategy": -10 },
      "res": { "gold": 8500, "wood": 2500, "iron": 1200, "horses": 1500 },
      "reputation": 60,
      "emperor": false,
      "techPreunlock": ["econ1"],
      "aiPersonality": { "atkThreshold": 0.5, "siegeThreshold": 0.55, "diploAggro": 0.65, "deployBias": 0.15, "budgetBias": 0.2 },
      "foundingCore": ["袁术","纪灵","张勋","桥蕤","雷薄"]
    },
    // ── 中等 (warlord / regional, 一州之主) ──
    "caocao": {
      "ruler": "曹操",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["枭雄"],
      "stage": "warlord",
      "anchorState": null,
      "ethos": { "mandate": 0, "power": 5, "civil": 0, "military": 10, "strategy": 10 },
      "res": { "gold": 4500, "wood": 1200, "iron": 900, "horses": 1200 },
      "reputation": 45,
      "emperor": false,
      "techPreunlock": [],
      "aiPersonality": { "atkThreshold": 0.45, "siegeThreshold": 0.5, "diploAggro": 0.55, "deployBias": 0.15, "budgetBias": 0.05 },
      "foundingCore": ["曹操","夏侯惇","夏侯渊","曹仁","曹洪","典韦","卫兹","荀彧","荀攸","程昱","戏志才","鲍信"]
    },
    "sunjian": {
      "ruler": "孙坚",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["江东猛虎"],
      "stage": "warlord",
      "anchorState": null,
      "ethos": { "mandate": 0, "power": 0, "civil": -10, "military": 15, "strategy": 0 },
      "res": { "gold": 4000, "wood": 1500, "iron": 800, "horses": 600 },
      "reputation": 55,
      "emperor": false,
      "techPreunlock": ["train1"],
      "aiPersonality": { "atkThreshold": 0.4, "siegeThreshold": 0.5, "diploAggro": 0.5, "deployBias": 0.2, "budgetBias": 0 },
      "foundingCore": ["孙坚","程普","黄盖","韩当","祖茂","孙策"]
    },
    "liubiao": {
      "ruler": "刘表",
      "playable": true,
      "type": "han_royal",
      "_baseType": "han_royal",
      "traits": ["宗室", "文治"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": 10, "power": -5, "civil": 15, "military": -5, "strategy": 0 },
      "res": { "gold": 8000, "wood": 3000, "iron": 1000, "horses": 800 },
      "reputation": 70,
      "emperor": false,
      "techPreunlock": ["civ1"],
      "aiPersonality": { "atkThreshold": 0.65, "siegeThreshold": 0.65, "diploAggro": 0.35, "deployBias": -0.1, "budgetBias": -0.05 },
      "foundingCore": ["刘表","蒯越","蒯良","蔡瑁","文聘"]
    },
    "liuyan": {
      "ruler": "刘焉",
      "playable": true,
      "type": "han_royal",
      "_baseType": "han_royal",
      "traits": ["宗室"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": 5, "power": 10, "civil": 5, "military": 0, "strategy": -5 },
      "res": { "gold": 7000, "wood": 2500, "iron": 1100, "horses": 700 },
      "reputation": 65,
      "emperor": false,
      "techPreunlock": ["civ1"],
      "aiPersonality": { "atkThreshold": 0.7, "siegeThreshold": 0.7, "diploAggro": 0.3, "deployBias": -0.15, "budgetBias": -0.1 },
      "foundingCore": ["刘焉","张任","严颜","吴懿","张松"]
    },
    "liuyu": {
      "ruler": "刘虞",
      "playable": true,
      "type": "han_royal",
      "_baseType": "han_royal",
      "traits": ["宗室", "仁主"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": 15, "power": -10, "civil": 10, "military": -10, "strategy": 5 },
      "res": { "gold": 5500, "wood": 1800, "iron": 800, "horses": 2000 },
      "reputation": 85,
      "emperor": false,
      "techPreunlock": ["pol1"],
      "aiPersonality": { "atkThreshold": 0.75, "siegeThreshold": 0.75, "diploAggro": 0.2, "deployBias": -0.2, "budgetBias": -0.15 },
      "foundingCore": ["刘虞","鲜于辅","阎柔","田畴"]
    },
    "gongsunzan": {
      "ruler": "公孙瓒",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["边将", "白马义从"],
      "stage": "warlord",
      "anchorState": null,
      "ethos": { "mandate": -5, "power": 5, "civil": -15, "military": 15, "strategy": -5 },
      "res": { "gold": 4500, "wood": 1500, "iron": 900, "horses": 3000 },
      "reputation": 45,
      "emperor": false,
      // mil4=坚盾 (tier1 守备型, prereq=[], 跟 mil1 锐兵 平级; 公孙瓒边军善守)
      "techPreunlock": ["mil4"],
      "aiPersonality": { "atkThreshold": 0.4, "siegeThreshold": 0.55, "diploAggro": 0.6, "deployBias": 0.2, "budgetBias": 0.1 },
      "foundingCore": ["公孙瓒","严纲","田楷","关靖","赵云","邹丹","单经"]
    },
    "taoqian": {
      "ruler": "陶谦",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["老臣"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": 5, "power": 0, "civil": 5, "military": -5, "strategy": -10 },
      "res": { "gold": 6000, "wood": 1800, "iron": 900, "horses": 600 },
      "reputation": 60,
      "emperor": false,
      "techPreunlock": [],
      "aiPersonality": { "atkThreshold": 0.7, "siegeThreshold": 0.65, "diploAggro": 0.3, "deployBias": -0.1, "budgetBias": -0.05 },
      "foundingCore": ["陶谦","陈登","曹豹","糜竺","糜芳"]
    },
    "hanfu": {
      "ruler": "韩馥",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["弱主", "暗弱"],
      "stage": "regional",
      "anchorState": null,
      "ethos": { "mandate": 0, "power": -5, "civil": 5, "military": -15, "strategy": -15 },
      "res": { "gold": 7500, "wood": 2000, "iron": 1100, "horses": 1500 },
      "reputation": 40,
      "emperor": false,
      "techPreunlock": [],
      "aiPersonality": { "atkThreshold": 0.8, "siegeThreshold": 0.75, "diploAggro": 0.2, "deployBias": -0.2, "budgetBias": -0.1 },
      "foundingCore": ["韩馥","耿武","赵浮","闵纯"]
    },
    "matenghan": {
      "ruler": "马腾",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["西凉", "边军"],
      "stage": "warlord",
      "anchorState": null,
      "ethos": { "mandate": -5, "power": 0, "civil": -20, "military": 15, "strategy": -5 },
      "res": { "gold": 3500, "wood": 1000, "iron": 800, "horses": 4000 },
      "reputation": 35,
      "emperor": false,
      "techPreunlock": ["mil1"],
      "aiPersonality": { "atkThreshold": 0.45, "siegeThreshold": 0.6, "diploAggro": 0.55, "deployBias": 0.15, "budgetBias": 0.05 },
      "foundingCore": ["马腾","韩遂","庞德","阎行","马超","成宜"]
    },
    // ── 弱势 / 边缘 ──
    "liubei": {
      "ruler": "刘备",
      "playable": true,
      "type": "han_royal",
      "_baseType": "han_royal",
      "traits": ["仁主", "汉室", "寒门"],
      "stage": "warlord",
      "anchorState": null,
      "ethos": { "mandate": 0, "power": -10, "civil": 0, "military": -5, "strategy": 10 },
      "res": { "gold": 1500, "wood": 600, "iron": 400, "horses": 300 },
      "reputation": 70,
      "emperor": false,
      "techPreunlock": [],
      "aiPersonality": { "atkThreshold": 0.55, "siegeThreshold": 0.6, "diploAggro": 0.4, "deployBias": 0, "budgetBias": -0.1 },
      "foundingCore": ["刘备","关羽","张飞","简雍"]
    },
    "kongrong": {
      "ruler": "孔融",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": ["名士", "文人"],
      "stage": "warlord",
      "anchorState": null,
      "ethos": { "mandate": 10, "power": -15, "civil": 15, "military": -20, "strategy": -10 },
      "res": { "gold": 3000, "wood": 1000, "iron": 500, "horses": 400 },
      "reputation": 75,
      "emperor": false,
      "techPreunlock": ["pol1"],
      "aiPersonality": { "atkThreshold": 0.8, "siegeThreshold": 0.75, "diploAggro": 0.25, "deployBias": -0.2, "budgetBias": -0.15 },
      "foundingCore": ["孔融","太史慈","武安国"]
    }
  },
  // ─── 初始外交 ───────────────────────────────────────────────────────
  // diplo 4-tuple: [a, b, rel(-100~100), status('enemy'|'neutral'|'ally'|'vassal')]
  // 关键关系参考 (190 年初平元年, 关东讨董联盟刚成):
  //   - dongzhuo vs 关东诸侯 (yuanshao 盟主 / yuanshu / caocao / sunjian / 等 10 路) = enemy
  //   - dongzhuo vs matenghan (凉州反董) = enemy
  //   - 关东诸侯之间: 联盟期 ally / neutral (后期反目尚未发生)
  //   - 袁绍 vs 袁术: 兄弟反目要晚一些, 190 期表面合作 neutral
  //   - liubei + gongsunzan: 同学情谊 ally
  //   - sunjian 名义投袁术 (后期被任命破虏将军): ally
  //   - 宗室之间 (liubiao/liuyan/liuyu/liubei): 通常 neutral, 同宗
  "diplo": [
    // dongzhuo vs 关东诸侯讨董联盟 (10 路 + matenghan, 全 enemy)
    ["dongzhuo", "yuanshao",   -80, "enemy"],
    ["dongzhuo", "yuanshu",    -75, "enemy"],
    ["dongzhuo", "caocao",     -70, "enemy"],
    ["dongzhuo", "sunjian",    -78, "enemy"],
    ["dongzhuo", "gongsunzan", -50, "enemy"],
    ["dongzhuo", "liubei",     -65, "enemy"],
    ["dongzhuo", "liubiao",    -45, "enemy"],
    ["dongzhuo", "taoqian",    -40, "enemy"],
    ["dongzhuo", "hanfu",      -55, "enemy"],
    ["dongzhuo", "kongrong",   -50, "enemy"],
    ["dongzhuo", "matenghan",  -85, "enemy"],
    ["dongzhuo", "liuyan",     -30, "neutral"],
    ["dongzhuo", "liuyu",      -35, "neutral"],

    // 联盟内部 (盟主袁绍 + 关东诸侯)
    ["yuanshao", "caocao",      75, "ally"],
    ["yuanshao", "yuanshu",     40, "neutral"],
    ["yuanshao", "hanfu",       50, "neutral"],
    ["yuanshao", "sunjian",     30, "neutral"],
    ["yuanshao", "kongrong",    35, "neutral"],
    ["yuanshao", "taoqian",     25, "neutral"],
    ["yuanshao", "liubei",      20, "neutral"],
    ["yuanshao", "gongsunzan",  -20, "neutral"],
    ["yuanshao", "liubiao",     30, "neutral"],

    // yuanshu 拉拢 sunjian (任破虏将军)
    ["yuanshu", "sunjian",      65, "ally"],
    ["yuanshu", "caocao",       20, "neutral"],
    ["yuanshu", "liubiao",     -40, "neutral"],
    ["yuanshu", "taoqian",      15, "neutral"],
    ["yuanshu", "kongrong",     10, "neutral"],
    ["yuanshu", "gongsunzan",   30, "neutral"],

    // 公孙瓒 + 刘备 同学
    ["gongsunzan", "liubei",    70, "ally"],
    ["gongsunzan", "liuyu",    -55, "enemy"],

    // 宗室
    ["liubei",  "liubiao",     35, "neutral"],
    ["liubei",  "liuyu",       40, "neutral"],
    ["liubei",  "liuyan",      30, "neutral"],
    ["liubiao", "liuyu",       30, "neutral"],
    ["liubiao", "liuyan",      25, "neutral"],
    ["liuyu",   "liuyan",      20, "neutral"],

    // 其他重要
    ["caocao",  "sunjian",      30, "neutral"],
    ["caocao",  "liubei",       45, "neutral"],
    ["caocao",  "taoqian",     -15, "neutral"],
    ["caocao",  "kongrong",     30, "neutral"],
    ["taoqian", "kongrong",     45, "neutral"],
    ["sunjian", "liubiao",     -55, "enemy"],
    ["matenghan", "caocao",     20, "neutral"],

    // F.1 invariant 补齐: 14 factions 须 91 pair 全列 (codex trial 2 catch). 以下 48 对 = 无强史实关系
    // 默认 neutral 0 — 远距离 / 无直接冲突 / 未触发的中性. 后续 phase 可按 narrative 调整.
    ["caocao", "gongsunzan",     0, "neutral"],
    ["caocao", "hanfu",          0, "neutral"],
    ["caocao", "liubiao",        0, "neutral"],
    ["caocao", "liuyan",         0, "neutral"],
    ["caocao", "liuyu",          0, "neutral"],
    ["gongsunzan", "hanfu",      0, "neutral"],
    ["gongsunzan", "kongrong",   0, "neutral"],
    ["gongsunzan", "liubiao",    0, "neutral"],
    ["gongsunzan", "liuyan",     0, "neutral"],
    ["gongsunzan", "matenghan",  0, "neutral"],
    ["gongsunzan", "sunjian",    0, "neutral"],
    ["gongsunzan", "taoqian",    0, "neutral"],
    ["hanfu", "kongrong",        0, "neutral"],
    ["hanfu", "liubei",          0, "neutral"],
    ["hanfu", "liubiao",         0, "neutral"],
    ["hanfu", "liuyan",          0, "neutral"],
    ["hanfu", "liuyu",           0, "neutral"],
    ["hanfu", "matenghan",       0, "neutral"],
    ["hanfu", "sunjian",         0, "neutral"],
    ["hanfu", "taoqian",         0, "neutral"],
    ["hanfu", "yuanshu",         0, "neutral"],
    ["kongrong", "liubei",       0, "neutral"],
    ["kongrong", "liubiao",      0, "neutral"],
    ["kongrong", "liuyan",       0, "neutral"],
    ["kongrong", "liuyu",        0, "neutral"],
    ["kongrong", "matenghan",    0, "neutral"],
    ["kongrong", "sunjian",      0, "neutral"],
    ["liubei", "matenghan",      0, "neutral"],
    ["liubei", "sunjian",        0, "neutral"],
    ["liubei", "taoqian",        0, "neutral"],
    ["liubei", "yuanshu",        0, "neutral"],
    ["liubiao", "matenghan",     0, "neutral"],
    ["liubiao", "taoqian",       0, "neutral"],
    ["liuyan", "matenghan",      0, "neutral"],
    ["liuyan", "sunjian",        0, "neutral"],
    ["liuyan", "taoqian",        0, "neutral"],
    ["liuyan", "yuanshao",       0, "neutral"],
    ["liuyan", "yuanshu",        0, "neutral"],
    ["liuyu", "matenghan",       0, "neutral"],
    ["liuyu", "sunjian",         0, "neutral"],
    ["liuyu", "taoqian",         0, "neutral"],
    ["liuyu", "yuanshao",        0, "neutral"],
    ["liuyu", "yuanshu",         0, "neutral"],
    ["matenghan", "sunjian",     0, "neutral"],
    ["matenghan", "taoqian",     0, "neutral"],
    ["matenghan", "yuanshao",    0, "neutral"],
    ["matenghan", "yuanshu",     0, "neutral"],
    ["sunjian", "taoqian",       0, "neutral"]
  ],
  // ─── 55 城归属 ─────────────────────────────────────────────────────
  // fac 分配按 190 期史实 + 简化处理 (整年合并 + 主要诸侯版图):
  //   dongzhuo (司隶+并州+关中): luoyang/changan/hedong/bingzhou/shangdang
  //   yuanshao (渤海起家): bohai
  //   yuanshu (南阳+淮南): nanyang/xinye/lujiang/shouchun/hefei
  //   caocao (兖州陈留): chenliu/guandu/puyang/xuchang
  //   sunjian (长沙+江东): changsha/jianye/jingkou/huiji/chaigang/yuzhang/suzhou/lingling/wuling
  //   liubiao (荆州主体): xiangyang/jingzhou/yiling/shangyong/jiaozhou/panyu/wuchang
  //   liuyan (益州): chengdu/yizhou_n/hanzhong/bazhong/luocheng/yongan/jianning
  //   liuyu (幽州): youzhou/zhuojun
  //   gongsunzan (北平): beiping
  //   taoqian (徐州): xuzhou/xiapi/guangling/donghai/langya/xiaopei
  //   hanfu (冀州): ye
  //   matenghan (凉州): liangzhou/wuwei/tianshui/anding
  //   kongrong (青州): beihai/qingzhou
  //   liubei (平原相): pingyuan
  // pop 沿用 214 数据 (24 年人口变化不大, 实玩后再调); troops 同 (后续 balance 调).
  "cities": {
    // ── dongzhuo (5): 司隶 + 并州 + 关中 ──
    "luoyang":   { "fac": "dongzhuo",  "pop": 325000, "troops": 3000, "isCapital": true  }, // 司隶治, 持献帝
    "changan":   { "fac": "dongzhuo",  "pop": 275000, "troops": 2500, "isCapital": false },
    "hedong":    { "fac": "dongzhuo",  "pop": 200000, "troops": 1200, "isCapital": false },
    "bingzhou":  { "fac": "dongzhuo",  "pop": 140000, "troops": 1000, "isCapital": false }, // 并州治晋阳 (丁原死后中央控)
    "shangdang": { "fac": "dongzhuo",  "pop": 120000, "troops":  900, "isCapital": false }, // 并州上党 (1f 新城)

    // ── yuanshao (1): 渤海起家 ──
    "bohai":     { "fac": "yuanshao",  "pop": 180000, "troops": 1200, "isCapital": true  }, // 渤海郡治南皮 (1f 新城)

    // ── yuanshu (5): 南阳 + 淮南 ──
    "nanyang":   { "fac": "yuanshu",   "pop": 300000, "troops": 2200, "isCapital": true  },
    "xinye":     { "fac": "yuanshu",   "pop": 125000, "troops": 1000, "isCapital": false },
    "lujiang":   { "fac": "yuanshu",   "pop": 160000, "troops": 1000, "isCapital": false }, // 庐江 (袁术后期淮南势力)
    "shouchun":  { "fac": "yuanshu",   "pop": 210000, "troops": 1000, "isCapital": false }, // 九江郡治
    "hefei":     { "fac": "yuanshu",   "pop": 190000, "troops": 1500, "isCapital": false }, // 扬州治

    // ── caocao (4): 兖州陈留 ──
    "chenliu":   { "fac": "caocao",    "pop": 240000, "troops": 1800, "isCapital": true  }, // 起兵地
    "guandu":    { "fac": "caocao",    "pop": 125000, "troops": 1500, "isCapital": false }, // 兖州西门
    "puyang":    { "fac": "caocao",    "pop": 190000, "troops": 1200, "isCapital": false }, // 兖州东郡治
    "xuchang":   { "fac": "caocao",    "pop": 425000, "troops": 4000, "isCapital": false }, // 颍川许县 (荀彧/颍川士族归附)

    // ── sunjian (9): 长沙 + 江东主体 + 荆南 ──
    "changsha":  { "fac": "sunjian",   "pop": 200000, "troops": 1200, "isCapital": true  }, // 长沙太守起家
    "jianye":    { "fac": "sunjian",   "pop": 350000, "troops": 3500, "isCapital": false }, // 丹阳郡治 (190 时尚称秣陵)
    "jingkou":   { "fac": "sunjian",   "pop": 175000, "troops": 1000, "isCapital": false },
    "huiji":     { "fac": "sunjian",   "pop": 210000, "troops": 1500, "isCapital": false },
    "chaigang":  { "fac": "sunjian",   "pop": 190000, "troops": 1500, "isCapital": false },
    "yuzhang":   { "fac": "sunjian",   "pop": 175000, "troops": 1000, "isCapital": false },
    "suzhou":    { "fac": "sunjian",   "pop": 210000, "troops": 1500, "isCapital": false }, // 吴郡 (1f 新城)
    "lingling":  { "fac": "sunjian",   "pop": 110000, "troops":  600, "isCapital": false }, // 荆南零陵
    "wuling":    { "fac": "sunjian",   "pop": 100000, "troops":  700, "isCapital": false }, // 荆南武陵 (1f 新城)

    // ── liubiao (7): 荆州主体 + 交州名义 ──
    "xiangyang": { "fac": "liubiao",   "pop": 210000, "troops": 2000, "isCapital": true  }, // 刘表治襄阳
    "jingzhou":  { "fac": "liubiao",   "pop": 325000, "troops": 2500, "isCapital": false }, // 南郡江陵
    "yiling":    { "fac": "liubiao",   "pop": 150000, "troops": 1000, "isCapital": false },
    "shangyong": { "fac": "liubiao",   "pop":  90000, "troops":  800, "isCapital": false },
    "wuchang":   { "fac": "liubiao",   "pop": 260000, "troops": 2000, "isCapital": false }, // 江夏郡治
    "jiaozhou":  { "fac": "liubiao",   "pop":  75000, "troops":  500, "isCapital": false }, // 交州 (荆州刺史远控)
    "panyu":     { "fac": "liubiao",   "pop": 125000, "troops":  800, "isCapital": false },

    // ── liuyan (7): 益州 + 南中 ──
    "chengdu":   { "fac": "liuyan",    "pop": 390000, "troops": 3500, "isCapital": true  },
    "yizhou_n":  { "fac": "liuyan",    "pop":  90000, "troops":  500, "isCapital": false },
    "hanzhong":  { "fac": "liuyan",    "pop": 175000, "troops": 2000, "isCapital": false }, // 实际 191 张鲁占
    "bazhong":   { "fac": "liuyan",    "pop": 140000, "troops":  800, "isCapital": false },
    "luocheng":  { "fac": "liuyan",    "pop": 150000, "troops": 1000, "isCapital": false },
    "yongan":    { "fac": "liuyan",    "pop": 110000, "troops":  800, "isCapital": false },
    "jianning":  { "fac": "liuyan",    "pop":  60000, "troops":  400, "isCapital": false }, // 南中 (益州牧管辖)

    // ── liuyu (2): 幽州 ──
    "youzhou":   { "fac": "liuyu",     "pop": 150000, "troops": 1000, "isCapital": true  }, // 幽州治蓟城
    "zhuojun":   { "fac": "liuyu",     "pop": 110000, "troops":  800, "isCapital": false }, // 涿郡 (1f 新城)

    // ── gongsunzan (1): 北平 ──
    "beiping":   { "fac": "gongsunzan", "pop": 100000, "troops":  600, "isCapital": true  }, // 右北平太守

    // ── taoqian (6): 徐州 ──
    "xuzhou":    { "fac": "taoqian",   "pop": 310000, "troops": 3000, "isCapital": true  }, // 徐州治彭城
    "xiapi":     { "fac": "taoqian",   "pop": 200000, "troops": 1500, "isCapital": false },
    "guangling": { "fac": "taoqian",   "pop": 175000, "troops": 1000, "isCapital": false },
    "donghai":   { "fac": "taoqian",   "pop": 110000, "troops":  900, "isCapital": false }, // 东海郡 (1f 新城)
    "langya":    { "fac": "taoqian",   "pop": 120000, "troops":  800, "isCapital": false }, // 琅琊国 (1f 新城)
    "xiaopei":   { "fac": "taoqian",   "pop": 120000, "troops": 1000, "isCapital": false }, // 沛国 (1f 新城; 名义属豫州但徐州西门 taoqian 控)

    // ── hanfu (1): 冀州治 ──
    "ye":        { "fac": "hanfu",     "pop": 400000, "troops": 2500, "isCapital": true  }, // 邺城 (191 让给 yuanshao)

    // ── matenghan (4): 凉州 ──
    "liangzhou": { "fac": "matenghan", "pop": 110000, "troops":  800, "isCapital": true  }, // 凉州治姑臧
    "wuwei":     { "fac": "matenghan", "pop":  90000, "troops":  500, "isCapital": false },
    "tianshui":  { "fac": "matenghan", "pop": 100000, "troops": 1000, "isCapital": false },
    "anding":    { "fac": "matenghan", "pop":  90000, "troops":  600, "isCapital": false }, // 安定郡 (1f 新城)

    // ── kongrong (2): 青州 ──
    "beihai":    { "fac": "kongrong",  "pop": 160000, "troops":  800, "isCapital": true  }, // 北海相
    "qingzhou":  { "fac": "kongrong",  "pop": 275000, "troops": 1500, "isCapital": false }, // 青州治 (孔融名义控)

    // ── liubei (1): 平原相 ──
    "pingyuan":  { "fac": "liubei",    "pop": 130000, "troops":  900, "isCapital": true  }  // 平原郡 (1f 新城)
  },
  // ─── 83 active 武将 (14 ruler + 69 心腹/史实任职) ────────────────────
  // 14 ruler 必 active (validator B.4); 各 fac 起手 2-4 心腹武将.
  // 字段: status/fac/city/role/post/title/loyalty/merit/retainer/initialUnit/relations
  // - role: 'ruler' (14) / 'strategist' (谋主, ~8) / 'prefect' (太守, 0 此阶段) / null
  // - retainer.type: cavalry/light/heavy/archer/siege/naval 按武将 apt 顶级
  // - initialUnit: 全 false (validator I.5 要求 initialUnit=true 必 in initialUnits[].squads;
  //                phase 4-c 同时填 initialUnit=true + initialUnits[] 起手部队)
  // - relations: [] (留 phase 4-c)
  // wild/pending 武将 不列在 generals (= 不出现于 190 scenario); 后续 phase 4-c 补 wild 池.
  "generals": {
    // ── dongzhuo 集团 (5) ──
    "董卓":   { "status":"active", "fac":"dongzhuo",   "city":"luoyang",   "role":"ruler", "post":{"name":"相国","rank":"王"},      "title":null, "loyalty":100,"merit":800,"retainer":{"count":2000,"type":"cavalry"},"initialUnit":true , "relations":[] },
    "吕布":   { "status":"active", "fac":"dongzhuo",   "city":"luoyang",   "role":null,    "post":{"name":"骑都尉","rank":"将"},     "title":null, "loyalty":70, "merit":400,"retainer":{"count":1500,"type":"cavalry"},"initialUnit":true , "relations":[] },
    "李傕":   { "status":"active", "fac":"dongzhuo",   "city":"changan",   "role":null,    "post":{"name":"中郎将","rank":"将"},     "title":null, "loyalty":85, "merit":300,"retainer":{"count":1200,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"郭汜","type":"同僚","intimacy":65}] },
    "郭汜":   { "status":"active", "fac":"dongzhuo",   "city":"changan",   "role":null,    "post":{"name":"中郎将","rank":"将"},     "title":null, "loyalty":85, "merit":280,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"李傕","type":"同僚","intimacy":65}] },
    "华雄":   { "status":"active", "fac":"dongzhuo",   "city":"hedong",    "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":80, "merit":150,"retainer":{"count":800, "type":"heavy"},  "initialUnit":false, "relations":[] },

    
    "张辽":   { "status":"active", "fac":"dongzhuo", "city":"luoyang", "role":null, "post":{"name":"骑都尉","rank":"将"}, "title":null, "loyalty":75,"merit":180,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "牛辅":   { "status":"active", "fac":"dongzhuo", "city":"changan", "role":null, "post":{"name":"女婿/中郎将","rank":"将"}, "title":null, "loyalty":95,"merit":120,"retainer":{"count":800,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "徐荣":   { "status":"active", "fac":"dongzhuo", "city":"luoyang", "role":null, "post":{"name":"中郎将","rank":"将"}, "title":null, "loyalty":85,"merit":250,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":false, "relations":[] },

    // ── yuanshao 集团 (5) ──
    "袁绍":   { "status":"active", "fac":"yuanshao",   "city":"bohai",     "role":"ruler", "post":{"name":"渤海太守","rank":"将"},   "title":null, "loyalty":100,"merit":700,"retainer":{"count":1500,"type":"cavalry"},"initialUnit":true , "relations":[{"target":"袁术","type":"兄长","intimacy":25},{"target":"曹操","type":"旧友","intimacy":60}] },
    "颜良":   { "status":"active", "fac":"yuanshao",   "city":"bohai",     "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":90, "merit":250,"retainer":{"count":1200,"type":"heavy"},  "initialUnit":true , "relations":[{"target":"文丑","type":"同僚","intimacy":70}] },
    "文丑":   { "status":"active", "fac":"yuanshao",   "city":"bohai",     "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":90, "merit":230,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"颜良","type":"同僚","intimacy":70}] },
    "审配":   { "status":"active", "fac":"yuanshao",   "city":"bohai",     "role":"strategist","post":{"name":"治中","rank":"文官"},"title":null, "loyalty":90, "merit":350,"retainer":{"count":300, "type":"archer"}, "initialUnit":false, "relations":[] },
    "麴义":   { "status":"active", "fac":"yuanshao",   "city":"bohai",     "role":null,    "post":{"name":"先登","rank":"将"},       "title":null, "loyalty":75, "merit":220,"retainer":{"count":1000,"type":"archer"}, "initialUnit":false, "relations":[] },

    
    "田丰":   { "status":"active", "fac":"yuanshao", "city":"bohai", "role":"strategist", "post":{"name":"谋主","rank":"文官"}, "title":null, "loyalty":90,"merit":400,"retainer":{"count":300,"type":"archer"},"initialUnit":false, "relations":[] },
    "沮授":   { "status":"active", "fac":"yuanshao", "city":"bohai", "role":"strategist", "post":{"name":"监军","rank":"文官"}, "title":null, "loyalty":95,"merit":420,"retainer":{"count":350,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "逢纪":   { "status":"active", "fac":"yuanshao", "city":"bohai", "role":null, "post":{"name":"谋士","rank":"文官"}, "title":null, "loyalty":85,"merit":280,"retainer":{"count":250,"type":"archer"},"initialUnit":false, "relations":[] },
    "许攸":   { "status":"active", "fac":"yuanshao", "city":"bohai", "role":null, "post":{"name":"谋士","rank":"文官"}, "title":null, "loyalty":60,"merit":300,"retainer":{"count":250,"type":"light"},"initialUnit":false, "relations":[] },

    // ── yuanshu 集团 (3) ──
    "袁术":   { "status":"active", "fac":"yuanshu",    "city":"nanyang",   "role":"ruler", "post":{"name":"南阳太守","rank":"将"},   "title":null, "loyalty":100,"merit":600,"retainer":{"count":1200,"type":"heavy"},  "initialUnit":true , "relations":[{"target":"袁绍","type":"弟","intimacy":25}] },
    "纪灵":   { "status":"active", "fac":"yuanshu",    "city":"nanyang",   "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":90, "merit":220,"retainer":{"count":1100,"type":"heavy"},  "initialUnit":true , "relations":[] },
    "张勋":   { "status":"active", "fac":"yuanshu",    "city":"shouchun",  "role":null,    "post":{"name":"大将","rank":"将"},       "title":null, "loyalty":85, "merit":180,"retainer":{"count":900, "type":"heavy"},  "initialUnit":false, "relations":[] },

    
    "桥蕤":   { "status":"active", "fac":"yuanshu", "city":"nanyang", "role":null, "post":{"name":"大将","rank":"将"}, "title":null, "loyalty":85,"merit":180,"retainer":{"count":900,"type":"heavy"},"initialUnit":false, "relations":[] },
    "雷薄":   { "status":"active", "fac":"yuanshu", "city":"shouchun", "role":null, "post":{"name":"将","rank":"将"}, "title":null, "loyalty":75,"merit":150,"retainer":{"count":800,"type":"heavy"},"initialUnit":false, "relations":[] },

    // ── caocao 集团 (9) ──
    "曹操":   { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":"ruler", "post":{"name":"奋武将军","rank":"将"},   "title":null, "loyalty":100,"merit":500,"retainer":{"count":1500,"type":"light"},  "initialUnit":true , "relations":[{"target":"夏侯惇","type":"宗族","intimacy":88},{"target":"夏侯渊","type":"宗族","intimacy":85},{"target":"曹仁","type":"宗族","intimacy":88},{"target":"曹洪","type":"宗族","intimacy":85},{"target":"袁绍","type":"旧友","intimacy":60}] },
    "夏侯惇": { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":100,"merit":300,"retainer":{"count":1200,"type":"heavy"},  "initialUnit":true , "relations":[{"target":"曹操","type":"宗族","intimacy":88},{"target":"夏侯渊","type":"兄长","intimacy":85}] },
    "夏侯渊": { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":null,    "post":{"name":"骑督","rank":"将"},       "title":null, "loyalty":100,"merit":280,"retainer":{"count":1200,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"曹操","type":"宗族","intimacy":85},{"target":"夏侯惇","type":"弟","intimacy":85}] },
    "曹仁":   { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":null,    "post":{"name":"别部司马","rank":"将"},   "title":null, "loyalty":100,"merit":250,"retainer":{"count":1100,"type":"heavy"},  "initialUnit":false, "relations":[{"target":"曹操","type":"宗族","intimacy":88}] },
    "曹洪":   { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":null,    "post":{"name":"别部司马","rank":"将"},   "title":null, "loyalty":100,"merit":200,"retainer":{"count":900, "type":"cavalry"},"initialUnit":false, "relations":[{"target":"曹操","type":"宗族","intimacy":85}] },
    "典韦":   { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":null,    "post":{"name":"校尉","rank":"将"},       "title":null, "loyalty":95, "merit":180,"retainer":{"count":800, "type":"heavy"},  "initialUnit":false, "relations":[] },
    "卫兹":   { "status":"active", "fac":"caocao",     "city":"chenliu",   "role":null,    "post":{"name":"长史","rank":"文官"},     "title":null, "loyalty":95, "merit":200,"retainer":{"count":400, "type":"light"},  "initialUnit":false, "relations":[] },
    "荀彧":   { "status":"active", "fac":"caocao",     "city":"xuchang",   "role":"strategist","post":{"name":"司马","rank":"文官"},"title":null, "loyalty":95, "merit":350,"retainer":{"count":300, "type":"archer"}, "initialUnit":false, "relations":[{"target":"荀攸","type":"宗族","intimacy":88}] },
    "荀攸":   { "status":"active", "fac":"caocao",     "city":"xuchang",   "role":null,    "post":{"name":"参军","rank":"文官"},     "title":null, "loyalty":90, "merit":250,"retainer":{"count":250, "type":"archer"}, "initialUnit":false, "relations":[{"target":"荀彧","type":"宗族","intimacy":88}] },

    
    "程昱":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":"strategist", "post":{"name":"谋士","rank":"文官"}, "title":null, "loyalty":90,"merit":300,"retainer":{"count":300,"type":"archer"},"initialUnit":false, "relations":[] },
    "戏志才":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":"strategist", "post":{"name":"谋士","rank":"文官"}, "title":null, "loyalty":92,"merit":280,"retainer":{"count":250,"type":"archer"},"initialUnit":false, "relations":[] },
    "鲍信":   { "status":"active", "fac":"caocao", "city":"chenliu", "role":null, "post":{"name":"济北相","rank":"将"}, "title":null, "loyalty":95,"merit":300,"retainer":{"count":1100,"type":"heavy"},"initialUnit":false, "relations":[] },

    // ── sunjian 集团 (5) ──
    "孙坚":   { "status":"active", "fac":"sunjian",    "city":"changsha",  "role":"ruler", "post":{"name":"长沙太守","rank":"将"},   "title":null, "loyalty":100,"merit":650,"retainer":{"count":1500,"type":"light"},  "initialUnit":true , "relations":[{"target":"孙策","type":"父亲","intimacy":95}] },
    "程普":   { "status":"active", "fac":"sunjian",    "city":"changsha",  "role":null,    "post":{"name":"司马","rank":"将"},       "title":null, "loyalty":100,"merit":300,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":true , "relations":[{"target":"黄盖","type":"同僚","intimacy":75},{"target":"韩当","type":"同僚","intimacy":72}] },
    "黄盖":   { "status":"active", "fac":"sunjian",    "city":"changsha",  "role":null,    "post":{"name":"司马","rank":"将"},       "title":null, "loyalty":100,"merit":280,"retainer":{"count":1000,"type":"naval"},  "initialUnit":false, "relations":[{"target":"程普","type":"同僚","intimacy":75},{"target":"韩当","type":"同僚","intimacy":72}] },
    "韩当":   { "status":"active", "fac":"sunjian",    "city":"changsha",  "role":null,    "post":{"name":"司马","rank":"将"},       "title":null, "loyalty":95, "merit":250,"retainer":{"count":1000,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"程普","type":"同僚","intimacy":72},{"target":"黄盖","type":"同僚","intimacy":72}] },
    "祖茂":   { "status":"active", "fac":"sunjian",    "city":"changsha",  "role":null,    "post":{"name":"校尉","rank":"将"},       "title":null, "loyalty":100,"merit":180,"retainer":{"count":700, "type":"light"},  "initialUnit":false, "relations":[] },

    
    "孙策":   { "status":"active", "fac":"sunjian", "city":"changsha", "role":null, "post":{"name":"少将","rank":"将"}, "title":null, "loyalty":100,"merit":150,"retainer":{"count":800,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"孙坚","type":"子嗣","intimacy":95}] },

    // ── liubiao 集团 (4) ──
    "刘表":   { "status":"active", "fac":"liubiao",    "city":"xiangyang", "role":"ruler", "post":{"name":"荆州牧","rank":"文官"},   "title":null, "loyalty":100,"merit":700,"retainer":{"count":800, "type":"light"},  "initialUnit":true , "relations":[] },
    "蒯越":   { "status":"active", "fac":"liubiao",    "city":"xiangyang", "role":"strategist","post":{"name":"别驾","rank":"文官"},"title":null, "loyalty":90, "merit":350,"retainer":{"count":300, "type":"archer"}, "initialUnit":false, "relations":[{"target":"蒯良","type":"兄长","intimacy":88}] },
    "蒯良":   { "status":"active", "fac":"liubiao",    "city":"xiangyang", "role":null,    "post":{"name":"主簿","rank":"文官"},     "title":null, "loyalty":90, "merit":280,"retainer":{"count":250, "type":"archer"}, "initialUnit":false, "relations":[{"target":"蒯越","type":"弟","intimacy":88}] },
    "蔡瑁":   { "status":"active", "fac":"liubiao",    "city":"xiangyang", "role":null,    "post":{"name":"水军都督","rank":"将"},   "title":null, "loyalty":75, "merit":220,"retainer":{"count":900, "type":"naval"},  "initialUnit":false, "relations":[] },

    
    "文聘":   { "status":"active", "fac":"liubiao", "city":"xiangyang", "role":null, "post":{"name":"大将","rank":"将"}, "title":null, "loyalty":90,"merit":250,"retainer":{"count":1000,"type":"archer"},"initialUnit":false, "relations":[] },

    // ── liuyan 集团 (4) ──
    "刘焉":   { "status":"active", "fac":"liuyan",     "city":"chengdu",   "role":"ruler", "post":{"name":"益州牧","rank":"文官"},   "title":null, "loyalty":100,"merit":650,"retainer":{"count":700, "type":"light"},  "initialUnit":true , "relations":[] },
    "张任":   { "status":"active", "fac":"liuyan",     "city":"chengdu",   "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":95, "merit":250,"retainer":{"count":1000,"type":"archer"}, "initialUnit":true , "relations":[] },
    "严颜":   { "status":"active", "fac":"liuyan",     "city":"bazhong",   "role":null,    "post":{"name":"巴郡太守","rank":"将"},   "title":null, "loyalty":95, "merit":280,"retainer":{"count":900, "type":"heavy"},  "initialUnit":false, "relations":[] },
    "吴懿":   { "status":"active", "fac":"liuyan",     "city":"chengdu",   "role":null,    "post":{"name":"中郎将","rank":"将"},     "title":null, "loyalty":85, "merit":200,"retainer":{"count":700, "type":"heavy"},  "initialUnit":false, "relations":[] },

    
    "张松":   { "status":"active", "fac":"liuyan", "city":"chengdu", "role":"strategist", "post":{"name":"别驾","rank":"文官"}, "title":null, "loyalty":70,"merit":280,"retainer":{"count":200,"type":"light"},"initialUnit":false, "relations":[] },

    // ── liuyu 集团 (4) ──
    "刘虞":   { "status":"active", "fac":"liuyu",      "city":"youzhou",   "role":"ruler", "post":{"name":"幽州牧","rank":"文官"},   "title":null, "loyalty":100,"merit":600,"retainer":{"count":600, "type":"light"},  "initialUnit":true , "relations":[] },
    "鲜于辅": { "status":"active", "fac":"liuyu",      "city":"youzhou",   "role":null,    "post":{"name":"长史","rank":"将"},       "title":null, "loyalty":90, "merit":230,"retainer":{"count":1000,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "阎柔":   { "status":"active", "fac":"liuyu",      "city":"youzhou",   "role":null,    "post":{"name":"乌桓司马","rank":"将"},   "title":null, "loyalty":85, "merit":280,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "田畴":   { "status":"active", "fac":"liuyu",      "city":"youzhou",   "role":"strategist","post":{"name":"主簿","rank":"文官"},"title":null, "loyalty":95, "merit":300,"retainer":{"count":200, "type":"cavalry"},"initialUnit":false, "relations":[] },

    // ── gongsunzan 集团 (5) ──
    "公孙瓒": { "status":"active", "fac":"gongsunzan", "city":"beiping",   "role":"ruler", "post":{"name":"奋武将军","rank":"将"},   "title":null, "loyalty":100,"merit":650,"retainer":{"count":1500,"type":"cavalry"},"initialUnit":true , "relations":[{"target":"刘备","type":"同门","intimacy":80}] },
    "严纲":   { "status":"active", "fac":"gongsunzan", "city":"beiping",   "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":95, "merit":220,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":true , "relations":[] },
    "田楷":   { "status":"active", "fac":"gongsunzan", "city":"beiping",   "role":null,    "post":{"name":"青州刺史","rank":"将"},   "title":null, "loyalty":90, "merit":250,"retainer":{"count":900, "type":"cavalry"},"initialUnit":false, "relations":[] },
    "关靖":   { "status":"active", "fac":"gongsunzan", "city":"beiping",   "role":"strategist","post":{"name":"主簿","rank":"文官"},"title":null, "loyalty":95, "merit":230,"retainer":{"count":200, "type":"light"},  "initialUnit":false, "relations":[] },
    "赵云":   { "status":"active", "fac":"gongsunzan", "city":"beiping",   "role":null,    "post":{"name":"校尉","rank":"将"},       "title":null, "loyalty":80, "merit":150,"retainer":{"count":800, "type":"cavalry"},"initialUnit":false, "relations":[] },

    
    "邹丹":   { "status":"active", "fac":"gongsunzan", "city":"beiping", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":90,"merit":180,"retainer":{"count":900,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "单经":   { "status":"active", "fac":"gongsunzan", "city":"beiping", "role":null, "post":{"name":"校尉","rank":"将"}, "title":null, "loyalty":85,"merit":160,"retainer":{"count":800,"type":"light"},"initialUnit":false, "relations":[] },

    // ── taoqian 集团 (3) ──
    "陶谦":   { "status":"active", "fac":"taoqian",    "city":"xuzhou",    "role":"ruler", "post":{"name":"徐州牧","rank":"文官"},   "title":null, "loyalty":100,"merit":700,"retainer":{"count":900, "type":"light"},  "initialUnit":true , "relations":[] },
    "陈登":   { "status":"active", "fac":"taoqian",    "city":"xuzhou",    "role":"strategist","post":{"name":"典农校尉","rank":"文官"},"title":null, "loyalty":85, "merit":300,"retainer":{"count":400, "type":"archer"}, "initialUnit":false, "relations":[] },
    "曹豹":   { "status":"active", "fac":"taoqian",    "city":"xiapi",     "role":null,    "post":{"name":"丹阳兵都尉","rank":"将"}, "title":null, "loyalty":80, "merit":200,"retainer":{"count":1000,"type":"light"},  "initialUnit":false, "relations":[] },

    
    "糜竺":   { "status":"active", "fac":"taoqian", "city":"xuzhou", "role":null, "post":{"name":"别驾","rank":"文官"}, "title":null, "loyalty":95,"merit":300,"retainer":{"count":400,"type":"light"},"initialUnit":false, "relations":[{"target":"糜芳","type":"兄长","intimacy":85}] },
    "糜芳":   { "status":"active", "fac":"taoqian", "city":"xuzhou", "role":null, "post":{"name":"主簿","rank":"文官"}, "title":null, "loyalty":85,"merit":200,"retainer":{"count":500,"type":"light"},"initialUnit":false, "relations":[{"target":"糜竺","type":"弟","intimacy":85}] },

    // ── hanfu 集团 (3) ──
    "韩馥":   { "status":"active", "fac":"hanfu",      "city":"ye",        "role":"ruler", "post":{"name":"冀州牧","rank":"文官"},   "title":null, "loyalty":100,"merit":500,"retainer":{"count":700, "type":"light"},  "initialUnit":true , "relations":[] },
    "耿武":   { "status":"active", "fac":"hanfu",      "city":"ye",        "role":"strategist","post":{"name":"治中","rank":"文官"},"title":null, "loyalty":95, "merit":230,"retainer":{"count":250, "type":"archer"}, "initialUnit":false, "relations":[] },
    "赵浮":   { "status":"active", "fac":"hanfu",      "city":"ye",        "role":null,    "post":{"name":"都督","rank":"将"},       "title":null, "loyalty":90, "merit":200,"retainer":{"count":900, "type":"cavalry"},"initialUnit":false, "relations":[] },

    
    "闵纯":   { "status":"active", "fac":"hanfu", "city":"ye", "role":null, "post":{"name":"治中","rank":"文官"}, "title":null, "loyalty":95,"merit":200,"retainer":{"count":250,"type":"archer"},"initialUnit":false, "relations":[] },

    // ── matenghan 集团 (4) ──
    "马腾":   { "status":"active", "fac":"matenghan",  "city":"liangzhou", "role":"ruler", "post":{"name":"征西将军","rank":"将"},   "title":null, "loyalty":100,"merit":600,"retainer":{"count":1400,"type":"cavalry"},"initialUnit":true , "relations":[{"target":"韩遂","type":"义兄弟","intimacy":75},{"target":"马超","type":"父亲","intimacy":92}] },
    "韩遂":   { "status":"active", "fac":"matenghan",  "city":"liangzhou", "role":"strategist","post":{"name":"金城太守","rank":"将"},"title":null,"loyalty":75, "merit":450,"retainer":{"count":1200,"type":"cavalry"},"initialUnit":true , "relations":[{"target":"马腾","type":"义兄弟","intimacy":75}] },
    "庞德":   { "status":"active", "fac":"matenghan",  "city":"liangzhou", "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":95, "merit":250,"retainer":{"count":1100,"type":"cavalry"},"initialUnit":false, "relations":[] },
    "阎行":   { "status":"active", "fac":"matenghan",  "city":"liangzhou", "role":null,    "post":{"name":"校尉","rank":"将"},       "title":null, "loyalty":85, "merit":200,"retainer":{"count":1000,"type":"cavalry"},"initialUnit":false, "relations":[] },

    
    "马超":   { "status":"active", "fac":"matenghan", "city":"liangzhou", "role":null, "post":{"name":"少将","rank":"将"}, "title":null, "loyalty":100,"merit":200,"retainer":{"count":1000,"type":"cavalry"},"initialUnit":false, "relations":[{"target":"马腾","type":"子嗣","intimacy":92}] },
    "成宜":   { "status":"active", "fac":"matenghan", "city":"liangzhou", "role":null, "post":{"name":"将","rank":"将"}, "title":null, "loyalty":85,"merit":150,"retainer":{"count":900,"type":"cavalry"},"initialUnit":false, "relations":[] },

    // ── kongrong 集团 (3) ──
    "孔融":   { "status":"active", "fac":"kongrong",   "city":"beihai",    "role":"ruler", "post":{"name":"北海相","rank":"文官"},   "title":null, "loyalty":100,"merit":500,"retainer":{"count":500, "type":"light"},  "initialUnit":true , "relations":[] },
    "太史慈": { "status":"active", "fac":"kongrong",   "city":"beihai",    "role":null,    "post":{"name":"奉义校尉","rank":"将"},   "title":null, "loyalty":85, "merit":200,"retainer":{"count":900, "type":"archer"}, "initialUnit":true , "relations":[] },
    "武安国": { "status":"active", "fac":"kongrong",   "city":"beihai",    "role":null,    "post":{"name":"先锋","rank":"将"},       "title":null, "loyalty":90, "merit":150,"retainer":{"count":800, "type":"heavy"},  "initialUnit":false, "relations":[] },

    // ── liubei 集团 (3) ──
    "刘备":   { "status":"active", "fac":"liubei",     "city":"pingyuan",  "role":"ruler", "post":{"name":"平原相","rank":"文官"},   "title":null, "loyalty":100,"merit":300,"retainer":{"count":500, "type":"light"},  "initialUnit":true , "relations":[{"target":"关羽","type":"义兄弟","intimacy":95},{"target":"张飞","type":"义兄弟","intimacy":95},{"target":"公孙瓒","type":"同门","intimacy":80}] },
    "关羽":   { "status":"active", "fac":"liubei",     "city":"pingyuan",  "role":null,    "post":{"name":"别部司马","rank":"将"},   "title":null, "loyalty":100,"merit":200,"retainer":{"count":900, "type":"light"},  "initialUnit":true , "relations":[{"target":"刘备","type":"义兄弟","intimacy":95},{"target":"张飞","type":"义兄弟","intimacy":92}] },
    "张飞":   { "status":"active", "fac":"liubei",     "city":"pingyuan",  "role":null,    "post":{"name":"别部司马","rank":"将"},   "title":null, "loyalty":100,"merit":180,"retainer":{"count":900, "type":"cavalry"},"initialUnit":false, "relations":[{"target":"刘备","type":"义兄弟","intimacy":95},{"target":"关羽","type":"义兄弟","intimacy":92}] },
    "简雍":   { "status":"active", "fac":"liubei", "city":"pingyuan", "role":null, "post":{"name":"从事","rank":"文官"}, "title":null, "loyalty":95,"merit":150,"retainer":{"count":200,"type":"light"},"initialUnit":false, "relations":[] },

    // ── wild 池 (14) — 190 时已成年(≥18) 未仕 14 fac 之任何一方 ──
    "陈宫":   { "status":"wild", "fac":"wild", "wildData":{ "title":"东郡名士",   "post":{"name":"郡吏","rank":"文官","desc":"东郡名士,智谋深远。"},          "loyalty":60, "merit":100, "retainer":{"count":300, "type":"light"},   "relations":[] }},
    "王朗":   { "status":"wild", "fac":"wild", "wildData":{ "title":"会稽太守",   "post":{"name":"会稽太守","rank":"文官","desc":"经学名士,地方良吏,孤悬东南。"}, "loyalty":55, "merit":150, "retainer":{"count":600, "type":"light"},   "relations":[] }},
    "张邈":   { "status":"wild", "fac":"wild", "wildData":{ "title":"陈留太守",   "post":{"name":"陈留太守","rank":"文官","desc":"反董盟主之一,与曹操早年友善。"},"loyalty":50, "merit":250, "retainer":{"count":1200,"type":"light"},   "relations":[{"target":"曹操","type":"故友","intimacy":70},{"target":"张超","type":"弟","intimacy":90}] }},
    "张超":   { "status":"wild", "fac":"wild", "wildData":{ "title":"广陵太守",   "post":{"name":"广陵太守","rank":"文官","desc":"张邈之弟,与兄共反董。"},      "loyalty":55, "merit":150, "retainer":{"count":800, "type":"light"},   "relations":[{"target":"张邈","type":"兄长","intimacy":90}] }},
    "王匡":   { "status":"wild", "fac":"wild", "wildData":{ "title":"河内太守",   "post":{"name":"河内太守","rank":"将","desc":"反董盟军先锋,与董卓战于河阳。"}, "loyalty":50, "merit":200, "retainer":{"count":1500,"type":"heavy"},   "relations":[{"target":"韩浩","type":"部曲","intimacy":75}] }},
    "韩浩":   { "status":"wild", "fac":"wild", "wildData":{ "title":"王匡部将",   "post":{"name":"都督","rank":"将","desc":"王匡心腹,治军严整。"},            "loyalty":80, "merit":120, "retainer":{"count":600, "type":"heavy"},   "relations":[{"target":"王匡","type":"主君","intimacy":80}] }},
    "笮融":   { "status":"wild", "fac":"wild", "wildData":{ "title":"下邳相",     "post":{"name":"下邳相","rank":"将","desc":"陶谦部边缘武装,奉佛大造浮图。"},  "loyalty":40, "merit":180, "retainer":{"count":800, "type":"light"},   "relations":[] }},
    "钟繇":   { "status":"wild", "fac":"wild", "wildData":{ "title":"廷尉正",     "post":{"name":"廷尉正","rank":"文官","desc":"汉廷名臣,长安朝官。"},        "loyalty":55, "merit":200, "retainer":{"count":100, "type":"light"},   "relations":[] }},
    "华歆":   { "status":"wild", "fac":"wild", "wildData":{ "title":"颍川名士",   "post":{"name":"尚书郎","rank":"文官","desc":"颍川名士,与荀彧同举孝廉。"},   "loyalty":50, "merit":150, "retainer":{"count":50,  "type":"light"},   "relations":[] }},
    "董昭":   { "status":"wild", "fac":"wild", "wildData":{ "title":"廮陶长",     "post":{"name":"廮陶长","rank":"文官","desc":"河北人,未定主属。"},          "loyalty":50, "merit":120, "retainer":{"count":80,  "type":"light"},   "relations":[] }},
    "贾诩":   { "status":"wild", "fac":"wild", "wildData":{ "title":"凉州参谋",   "post":{"name":"讨虏校尉","rank":"文官","desc":"凉州军参谋,谋深莫测。"},     "loyalty":40, "merit":200, "retainer":{"count":150, "type":"light"},   "relations":[] }},
    "张绣":   { "status":"wild", "fac":"wild", "wildData":{ "title":"凉州后起",   "post":{"name":"军侯","rank":"将","desc":"张济之侄,凉州勇将。"},            "loyalty":60, "merit":80,  "retainer":{"count":500, "type":"cavalry"}, "relations":[{"target":"张济","type":"叔","intimacy":85}] }},
    "于禁":   { "status":"wild", "fac":"wild", "wildData":{ "title":"鲍信部曲",   "post":{"name":"都伯","rank":"将","desc":"鲍信麾下,治军严整。"},             "loyalty":75, "merit":80,  "retainer":{"count":500, "type":"heavy"},   "relations":[{"target":"鲍信","type":"主君","intimacy":80}] }},
    "臧霸":   { "status":"wild", "fac":"wild", "wildData":{ "title":"泰山豪强",   "post":{"name":"骑都尉","rank":"将","desc":"泰山地方豪强,黄巾募起家。"},     "loyalty":50, "merit":150, "retainer":{"count":800, "type":"cavalry"}, "relations":[] }},

  },
  "initialUnits": [
    {
      "fac": "dongzhuo",
      "city": "luoyang",
      "squads": [
        {
          "genName": "董卓",
          "type": "cavalry",
          "troops": 2000,
          "maxTroops": 2000,
          "morale": 85
        },
        {
          "genName": "吕布",
          "type": "cavalry",
          "troops": 1500,
          "maxTroops": 1500,
          "morale": 90
        }
      ]
    },
    {
      "fac": "yuanshao",
      "city": "bohai",
      "squads": [
        {
          "genName": "袁绍",
          "type": "cavalry",
          "troops": 1500,
          "maxTroops": 1500,
          "morale": 80
        },
        {
          "genName": "颜良",
          "type": "heavy",
          "troops": 1200,
          "maxTroops": 1200,
          "morale": 85
        }
      ]
    },
    {
      "fac": "yuanshu",
      "city": "nanyang",
      "squads": [
        {
          "genName": "袁术",
          "type": "heavy",
          "troops": 1200,
          "maxTroops": 1200,
          "morale": 75
        },
        {
          "genName": "纪灵",
          "type": "heavy",
          "troops": 1100,
          "maxTroops": 1100,
          "morale": 80
        }
      ]
    },
    {
      "fac": "caocao",
      "city": "chenliu",
      "squads": [
        {
          "genName": "曹操",
          "type": "light",
          "troops": 1500,
          "maxTroops": 1500,
          "morale": 85
        },
        {
          "genName": "夏侯惇",
          "type": "heavy",
          "troops": 1200,
          "maxTroops": 1200,
          "morale": 85
        }
      ]
    },
    {
      "fac": "sunjian",
      "city": "changsha",
      "squads": [
        {
          "genName": "孙坚",
          "type": "light",
          "troops": 1500,
          "maxTroops": 1500,
          "morale": 88
        },
        {
          "genName": "程普",
          "type": "cavalry",
          "troops": 1100,
          "maxTroops": 1100,
          "morale": 85
        }
      ]
    },
    {
      "fac": "liubiao",
      "city": "xiangyang",
      "squads": [
        {
          "genName": "刘表",
          "type": "light",
          "troops": 800,
          "maxTroops": 800,
          "morale": 75
        }
      ]
    },
    {
      "fac": "liuyan",
      "city": "chengdu",
      "squads": [
        {
          "genName": "刘焉",
          "type": "light",
          "troops": 700,
          "maxTroops": 700,
          "morale": 75
        },
        {
          "genName": "张任",
          "type": "archer",
          "troops": 1000,
          "maxTroops": 1000,
          "morale": 85
        }
      ]
    },
    {
      "fac": "liuyu",
      "city": "youzhou",
      "squads": [
        {
          "genName": "刘虞",
          "type": "light",
          "troops": 600,
          "maxTroops": 600,
          "morale": 80
        }
      ]
    },
    {
      "fac": "gongsunzan",
      "city": "beiping",
      "squads": [
        {
          "genName": "公孙瓒",
          "type": "cavalry",
          "troops": 1500,
          "maxTroops": 1500,
          "morale": 88
        },
        {
          "genName": "严纲",
          "type": "cavalry",
          "troops": 1100,
          "maxTroops": 1100,
          "morale": 85
        }
      ]
    },
    {
      "fac": "taoqian",
      "city": "xuzhou",
      "squads": [
        {
          "genName": "陶谦",
          "type": "light",
          "troops": 900,
          "maxTroops": 900,
          "morale": 75
        }
      ]
    },
    {
      "fac": "hanfu",
      "city": "ye",
      "squads": [
        {
          "genName": "韩馥",
          "type": "light",
          "troops": 700,
          "maxTroops": 700,
          "morale": 70
        }
      ]
    },
    {
      "fac": "matenghan",
      "city": "liangzhou",
      "squads": [
        {
          "genName": "马腾",
          "type": "cavalry",
          "troops": 1400,
          "maxTroops": 1400,
          "morale": 85
        },
        {
          "genName": "韩遂",
          "type": "cavalry",
          "troops": 1200,
          "maxTroops": 1200,
          "morale": 82
        }
      ]
    },
    {
      "fac": "kongrong",
      "city": "beihai",
      "squads": [
        {
          "genName": "孔融",
          "type": "light",
          "troops": 500,
          "maxTroops": 500,
          "morale": 75
        },
        {
          "genName": "太史慈",
          "type": "archer",
          "troops": 900,
          "maxTroops": 900,
          "morale": 85
        }
      ]
    },
    {
      "fac": "liubei",
      "city": "pingyuan",
      "squads": [
        {
          "genName": "刘备",
          "type": "light",
          "troops": 500,
          "maxTroops": 500,
          "morale": 80
        },
        {
          "genName": "关羽",
          "type": "light",
          "troops": 900,
          "maxTroops": 900,
          "morale": 92
        }
      ]
    }
  ]
};
