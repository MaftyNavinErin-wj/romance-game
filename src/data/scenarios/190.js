// 190.js
//
// SCENARIO_190 — 诸侯讨董(190 年初平元年)初始 state 切片
//
// 状态: phase 2-b — factions (14 势力) + diplo (双向外交) 实数据填. cities/generals 仍空:
//   - phase 2-a (done): 元字段 + scenarios register 基础设施
//   - phase 2-b (本):   factions 14 势力 + diplo 关系 (本 commit)
//   - phase 3:          cities (190 ~55 城归属)
//   - phase 4:          generals (190 武将归属 + 关系图)
//
// 字段 schema 同 SCENARIO_214 (见 214.js header + docs/scenario_system.md §3.4).
// 14 势力史实参考 docs/scenario_system.md §4.
//
// 注意:
// - nanman 190 期不参与中原讨董, 不列入 factions
// - foundingCore=[] stub (phase 4 才填, 当前 GEN_BASE 不含 dongzhuo/sunjian 等 190 武将)
// - validator (tests/scenario_validate.js) 跑 190 会有 B.1/B.4 errors — expected for stub state
// - 默认 applyScenario('214') 不会真 init 190, smoke 不受影响

const SCENARIO_190 = {
  "id": "190",
  "version": "0.2",
  "name": "诸侯讨董",
  "startYear": 190,
  "description": "东汉初平元年,董卓废少帝立献帝,关东诸侯起兵讨董,群雄并起。",
  "provenance": "phase 2-b: factions+diplo 实数据; cities/generals 留 phase 3/4",
  // startYear=190 (初平元年) 时天子献帝仍在洛阳, 董卓持. 191 年才西迁长安.
  // emperor.cityId 留 phase 3 装 (luoyang), emperor.holder='dongzhuo'.
  "emperor": null,
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
      "foundingCore": []
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
  "cities": {},
  "generals": {},
  "initialUnits": []
};
