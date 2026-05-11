// 214.js
//
// SCENARIO_214 — 三足鼎立(214 年建安十九年)初始 state 切片
//
// 字段:
//   id/version/name/startYear/description/provenance — 元信息
//   emperor                  — {cityId, holder} 天子位置(initGame 字面)
//   factions[fid]            — ruler/playable/type/_baseType/traits/stage/anchorState/
//                              ethos/res/reputation/emperor/techPreunlock/aiPersonality/foundingCore
//   diplo[]                  — 4-tuple [a, b, rel, status] (+ 5th suzerain 当 status='vassal')
//   cities[cid]              — {fac, pop, troops, isCapital} (CITY_BASE 之外的 scenario fields)
//   generals                 — {} 占位(1a.3 sprint 补全)
//
// 来源:阶段 1a.2 由 tools/extract_scenario_214.js 自动抽取
//   - factions: FAC[fid].ruler + PLAYABLE_FACS + FAC_IDENTITY + ETHOS_INIT
//               + G.factions[fid].res + G.reputation + G.emperor + TECH_PREUNLOCK
//               + AI_PERSONALITY + FOUNDING_CORE
//   - diplo:    DIPLO_INIT(一向,materialize 时双向 mirror)
//   - cities:   CITIES_DEF.{fac, pop, troops, isCapital}
//   - emperor:  G.emperor (initGame: { cityId:'ye', holder:'wei' })
//
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3.4。

const SCENARIO_214 = {
  "id": "214",
  "version": "1.0",
  "name": "三足鼎立",
  "startYear": 214,
  "description": "东汉建安十九年,曹操称魏公,刘备入蜀,孙权割据江东,三国鼎足之势已成。",
  "provenance": "project_romance_v181.html 初始 state(initGame + factions.js + military.js AI_PERSONALITY + generals.js FOUNDING_CORE 等 verbatim 抽离)",
  "emperor": {
    "cityId": "ye",
    "holder": "wei"
  },
  "factions": {
    "wei": {
      "ruler": "曹操",
      "playable": true,
      "type": "emperor_holder",
      "_baseType": "warlord",
      "traits": [
        "枭雄"
      ],
      "stage": "regime",
      "anchorState": null,
      "ethos": {
        "mandate": 15,
        "power": 20,
        "civil": 0,
        "military": 10,
        "strategy": 15
      },
      "res": {
        "gold": 10000,
        "wood": 2000,
        "iron": 1400,
        "horses": 4000
      },
      "reputation": 45,
      "emperor": true,
      "techPreunlock": [
        "mil1",
        "econ4",
        "pol1"
      ],
      "aiPersonality": {
        "atkThreshold": 0.5,
        "siegeThreshold": 0.5,
        "diploAggro": 0.65,
        "deployBias": 0.15,
        "budgetBias": 0.1
      },
      "foundingCore": [
        "曹操",
        "夏侯惇",
        "夏侯渊",
        "曹仁",
        "曹洪",
        "许褚"
      ]
    },
    "shu": {
      "ruler": "刘备",
      "playable": true,
      "type": "han_royal",
      "_baseType": "han_royal",
      "traits": [
        "仁主",
        "汉室"
      ],
      "stage": "regime",
      "anchorState": null,
      "ethos": {
        "mandate": -30,
        "power": 0,
        "civil": 5,
        "military": -20,
        "strategy": 10
      },
      "res": {
        "gold": 8000,
        "wood": 2400,
        "iron": 1400,
        "horses": 2500
      },
      "reputation": 80,
      "emperor": false,
      "techPreunlock": [
        "train1",
        "civ1",
        "pol1"
      ],
      "aiPersonality": {
        "atkThreshold": 0.55,
        "siegeThreshold": 0.6,
        "diploAggro": 0.3,
        "deployBias": 0,
        "budgetBias": -0.05
      },
      "foundingCore": [
        "刘备",
        "关羽",
        "张飞",
        "赵云"
      ]
    },
    "wu": {
      "ruler": "孙权",
      "playable": true,
      "type": "warlord",
      "_baseType": "warlord",
      "traits": [],
      "stage": "regime",
      "anchorState": null,
      "ethos": {
        "mandate": 0,
        "power": -20,
        "civil": 0,
        "military": 0,
        "strategy": -20
      },
      "res": {
        "gold": 8000,
        "wood": 2800,
        "iron": 1000,
        "horses": 300
      },
      "reputation": 60,
      "emperor": false,
      "techPreunlock": [
        "econ1",
        "civ1",
        "mil4"
      ],
      "aiPersonality": {
        "atkThreshold": 0.5,
        "siegeThreshold": 0.55,
        "diploAggro": 0.5,
        "deployBias": -0.1,
        "budgetBias": 0
      },
      "foundingCore": [
        "孙权",
        "周瑜",
        "程普",
        "黄盖"
      ]
    },
    "nanman": {
      "ruler": "孟获",
      "playable": true,
      "type": "tribal",
      "_baseType": "tribal",
      "traits": [
        "蛮族"
      ],
      "stage": "warlord",
      "anchorState": null,
      "ethos": {
        "mandate": 0,
        "power": 0,
        "civil": -10,
        "military": 15,
        "strategy": 5
      },
      "res": {
        "gold": 1500,
        "wood": 1000,
        "iron": 650,
        "horses": 200
      },
      "reputation": 30,
      "emperor": false,
      "techPreunlock": [],
      "aiPersonality": {
        "atkThreshold": 0.6,
        "siegeThreshold": 0.65,
        "diploAggro": 0.4,
        "deployBias": -0.1,
        "budgetBias": -0.1
      },
      "foundingCore": [
        "孟获",
        "祝融"
      ]
    }
  },
  "diplo": [
    [
      "wei",
      "shu",
      40,
      "neutral"
    ],
    [
      "wei",
      "wu",
      45,
      "neutral"
    ],
    [
      "shu",
      "wu",
      78,
      "ally"
    ],
    [
      "wei",
      "nanman",
      25,
      "neutral"
    ],
    [
      "shu",
      "nanman",
      50,
      "vassal",
      "shu"
    ],
    [
      "wu",
      "nanman",
      30,
      "neutral"
    ]
  ],
  "cities": {
    "xuchang": {
      "fac": "wei",
      "pop": 425000,
      "troops": 4000,
      "isCapital": true
    },
    "nanyang": {
      "fac": "wei",
      "pop": 300000,
      "troops": 2200,
      "isCapital": false
    },
    "xuzhou": {
      "fac": "wei",
      "pop": 310000,
      "troops": 3000,
      "isCapital": false
    },
    "luoyang": {
      "fac": "wei",
      "pop": 325000,
      "troops": 3000,
      "isCapital": false
    },
    "guandu": {
      "fac": "wei",
      "pop": 125000,
      "troops": 1500,
      "isCapital": false
    },
    "hedong": {
      "fac": "wei",
      "pop": 200000,
      "troops": 1200,
      "isCapital": false
    },
    "ye": {
      "fac": "wei",
      "pop": 400000,
      "troops": 2500,
      "isCapital": false
    },
    "qingzhou": {
      "fac": "wei",
      "pop": 275000,
      "troops": 1500,
      "isCapital": false
    },
    "youzhou": {
      "fac": "wei",
      "pop": 150000,
      "troops": 1000,
      "isCapital": false
    },
    "bingzhou": {
      "fac": "wei",
      "pop": 140000,
      "troops": 1000,
      "isCapital": false
    },
    "liangzhou": {
      "fac": "wei",
      "pop": 110000,
      "troops": 800,
      "isCapital": false
    },
    "wuwei": {
      "fac": "wei",
      "pop": 90000,
      "troops": 500,
      "isCapital": false
    },
    "tianshui": {
      "fac": "wei",
      "pop": 100000,
      "troops": 1000,
      "isCapital": false
    },
    "changan": {
      "fac": "wei",
      "pop": 275000,
      "troops": 2500,
      "isCapital": false
    },
    "hanzhong": {
      "fac": "shu",
      "pop": 175000,
      "troops": 2000,
      "isCapital": false
    },
    "chengdu": {
      "fac": "shu",
      "pop": 390000,
      "troops": 3500,
      "isCapital": true
    },
    "yizhou_n": {
      "fac": "shu",
      "pop": 90000,
      "troops": 500,
      "isCapital": false
    },
    "bazhong": {
      "fac": "shu",
      "pop": 140000,
      "troops": 800,
      "isCapital": false
    },
    "xiangyang": {
      "fac": "shu",
      "pop": 210000,
      "troops": 2000,
      "isCapital": false
    },
    "jingzhou": {
      "fac": "shu",
      "pop": 325000,
      "troops": 2500,
      "isCapital": false
    },
    "yiling": {
      "fac": "shu",
      "pop": 150000,
      "troops": 1000,
      "isCapital": false
    },
    "jianye": {
      "fac": "wu",
      "pop": 350000,
      "troops": 3500,
      "isCapital": true
    },
    "jingkou": {
      "fac": "wu",
      "pop": 175000,
      "troops": 1000,
      "isCapital": false
    },
    "huiji": {
      "fac": "wu",
      "pop": 210000,
      "troops": 1500,
      "isCapital": false
    },
    "wuchang": {
      "fac": "wu",
      "pop": 260000,
      "troops": 2000,
      "isCapital": false
    },
    "chaigang": {
      "fac": "wu",
      "pop": 190000,
      "troops": 1500,
      "isCapital": false
    },
    "jiaozhou": {
      "fac": "wu",
      "pop": 75000,
      "troops": 500,
      "isCapital": false
    },
    "panyu": {
      "fac": "wu",
      "pop": 125000,
      "troops": 800,
      "isCapital": false
    },
    "hefei": {
      "fac": "wu",
      "pop": 190000,
      "troops": 1500,
      "isCapital": false
    },
    "shouchun": {
      "fac": "wu",
      "pop": 210000,
      "troops": 1000,
      "isCapital": false
    },
    "jianning": {
      "fac": "nanman",
      "pop": 60000,
      "troops": 400,
      "isCapital": false
    },
    "yongan": {
      "fac": "shu",
      "pop": 110000,
      "troops": 800,
      "isCapital": false
    },
    "beihai": {
      "fac": "wei",
      "pop": 160000,
      "troops": 800,
      "isCapital": false
    },
    "beiping": {
      "fac": "wei",
      "pop": 100000,
      "troops": 600,
      "isCapital": false
    },
    "guangling": {
      "fac": "wei",
      "pop": 175000,
      "troops": 1000,
      "isCapital": false
    },
    "changsha": {
      "fac": "wu",
      "pop": 200000,
      "troops": 1200,
      "isCapital": false
    },
    "yuzhang": {
      "fac": "wu",
      "pop": 175000,
      "troops": 1000,
      "isCapital": false
    },
    "lingling": {
      "fac": "wu",
      "pop": 110000,
      "troops": 600,
      "isCapital": false
    },
    "chenliu": {
      "fac": "wei",
      "pop": 240000,
      "troops": 1800,
      "isCapital": false
    },
    "xinye": {
      "fac": "wei",
      "pop": 125000,
      "troops": 1000,
      "isCapital": false
    },
    "puyang": {
      "fac": "wei",
      "pop": 190000,
      "troops": 1200,
      "isCapital": false
    },
    "xiapi": {
      "fac": "wei",
      "pop": 200000,
      "troops": 1500,
      "isCapital": false
    },
    "shangyong": {
      "fac": "shu",
      "pop": 90000,
      "troops": 800,
      "isCapital": false
    },
    "luocheng": {
      "fac": "shu",
      "pop": 150000,
      "troops": 1000,
      "isCapital": false
    },
    "lujiang": {
      "fac": "wu",
      "pop": 160000,
      "troops": 1000,
      "isCapital": false
    }
  },
  "generals": {}
};
