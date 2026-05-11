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
//   generals[name]           — status: 'active'|'wild'|'pending';字段按 status 分支
//                              active:  fac/city/role/post/title/loyalty/merit/retainer/initialUnit/relations/skillsOverride
//                              wild:    fac:'wild', wildData{title/post/loyalty/merit/retainer/relations/skillsOverride}
//                              pending: availableYear + wildData + 可选 pendingFac (GENS_FULL minTurn>1)
//   initialUnits[]           — 起手野战 squad spec: {fac, city, squads:[{genName,type,troops,maxTroops,morale}]}
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
  "generals": {
    "曹操": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": "ruler",
      "post": {
        "name": "魏王",
        "rank": "王",
        "desc": "统御天下，号令三军。政令加成+25%，外交行动无需消耗。"
      },
      "title": "治世能臣",
      "loyalty": 95,
      "merit": 150,
      "retainer": {
        "count": 2500,
        "type": "cavalry"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "夏侯惇",
          "type": "义兄弟",
          "intimacy": 85
        },
        {
          "target": "夏侯渊",
          "type": "宗族",
          "intimacy": 80
        },
        {
          "target": "曹仁",
          "type": "宗族",
          "intimacy": 80
        },
        {
          "target": "荀彧",
          "type": "重臣",
          "intimacy": 70
        },
        {
          "target": "郭嘉",
          "type": "谋主",
          "intimacy": 85
        },
        {
          "target": "许褚",
          "type": null,
          "intimacy": 80
        },
        {
          "target": "贾诩",
          "type": null,
          "intimacy": 45
        },
        {
          "target": "张辽",
          "type": null,
          "intimacy": 65
        },
        {
          "target": "司马懿",
          "type": null,
          "intimacy": 40
        },
        {
          "target": "曹洪",
          "type": null,
          "intimacy": 80
        }
      ],
      "skillsOverride": null
    },
    "张辽": {
      "status": "active",
      "fac": "wei",
      "city": "xiapi",
      "role": null,
      "post": {
        "name": "征东将军",
        "rank": "将",
        "desc": "镇守东线，兵马优先补员。统辖合肥一带守备。"
      },
      "title": "威震四方",
      "loyalty": 85,
      "merit": 95,
      "retainer": {
        "count": 1200,
        "type": "cavalry"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "关羽",
          "type": "义友",
          "intimacy": 55
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 65
        },
        {
          "target": "李典",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "乐进",
          "type": "同僚",
          "intimacy": 55
        },
        {
          "target": "于禁",
          "type": null,
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "郭嘉": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "军师祭酒",
        "rank": "文官",
        "desc": "参赞军机，每旬可为一支部队提供情报加成。"
      },
      "title": "鬼才",
      "loyalty": 92,
      "merit": 85,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "荀彧",
          "type": "同乡",
          "intimacy": 50
        },
        {
          "target": "荀攸",
          "type": "同乡",
          "intimacy": 55
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 85
        }
      ],
      "skillsOverride": null
    },
    "夏侯惇": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "大将军",
        "rank": "将",
        "desc": "武将之首，统辖全军，本势力所有部队补员速度+5%。"
      },
      "title": "独目苍狼",
      "loyalty": 98,
      "merit": 90,
      "retainer": {
        "count": 1800,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "义兄弟",
          "intimacy": 85
        },
        {
          "target": "夏侯渊",
          "type": "族兄弟",
          "intimacy": 75
        },
        {
          "target": "曹仁",
          "type": "宗族",
          "intimacy": 65
        },
        {
          "target": "曹洪",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "荀彧": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "尚书令",
        "rank": "文官",
        "desc": "主持内政，所在势力每旬金产+8%，建筑建设速度+1旬。"
      },
      "title": "王佐之才",
      "loyalty": 78,
      "merit": 100,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "郭嘉",
          "type": "同乡",
          "intimacy": 50
        },
        {
          "target": "荀攸",
          "type": "族侄",
          "intimacy": 70
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 70
        },
        {
          "target": "钟繇",
          "type": null,
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "曹仁": {
      "status": "active",
      "fac": "wei",
      "city": "nanyang",
      "role": null,
      "post": {
        "name": "大司马",
        "rank": "将",
        "desc": "南线防守主将，驻守城池守备+15%。"
      },
      "title": "曹氏屏障",
      "loyalty": 97,
      "merit": 85,
      "retainer": {
        "count": 2000,
        "type": "heavy"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "曹操",
          "type": "宗族",
          "intimacy": 80
        },
        {
          "target": "夏侯惇",
          "type": "宗族",
          "intimacy": 65
        },
        {
          "target": "牛金",
          "type": "部将",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "乐进": {
      "status": "active",
      "fac": "wei",
      "city": "xiapi",
      "role": null,
      "post": {
        "name": "右将军",
        "rank": "将",
        "desc": "右翼机动部队统领，轻步兵部队行动力+1。"
      },
      "title": "先登虎胆",
      "loyalty": 88,
      "merit": 65,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "于禁",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "张辽",
          "type": "同僚",
          "intimacy": 55
        },
        {
          "target": "李典",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "于禁": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "左将军",
        "rank": "将",
        "desc": "执法严明，部队纪律加成，行军时粮耗减少5%。"
      },
      "title": "厉行法纪",
      "loyalty": 72,
      "merit": 70,
      "retainer": {
        "count": 600,
        "type": "heavy"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "乐进",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "张辽",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "徐晃": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "右将军",
        "rank": "将",
        "desc": "擅长迂回奔袭，行军时可绕道突袭敌后方。"
      },
      "title": "长驱良将",
      "loyalty": 87,
      "merit": 80,
      "retainer": {
        "count": 800,
        "type": "heavy"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "关羽",
          "type": "义友",
          "intimacy": 55
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "张郃": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "征西车骑将军",
        "rank": "将",
        "desc": "西线骑兵主帅，骑兵部队在山地的行动力惩罚减半。"
      },
      "title": "巧变良将",
      "loyalty": 80,
      "merit": 75,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "司马懿",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "郭淮",
          "type": null,
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "司马懿": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "太尉",
        "rank": "文官",
        "desc": "执掌军政，所在势力AI战略决策效率+20%。（待实装）"
      },
      "title": "冢虎",
      "loyalty": 60,
      "merit": 120,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 40
        },
        {
          "target": "张郃",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "夏侯渊": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "征西将军",
        "rank": "将",
        "desc": "西线奔袭专家，骑兵部队每旬可额外移动1个节点。"
      },
      "title": "虎步关右",
      "loyalty": 92,
      "merit": 80,
      "retainer": {
        "count": 1500,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "夏侯惇",
          "type": "族兄弟",
          "intimacy": 75
        },
        {
          "target": "曹操",
          "type": "宗族",
          "intimacy": 80
        }
      ],
      "skillsOverride": null
    },
    "许褚": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "武卫将军",
        "rank": "将",
        "desc": "曹操亲卫统领，与曹操同在时战斗力+20%。"
      },
      "title": "虎痴",
      "loyalty": 99,
      "merit": 70,
      "retainer": {
        "count": 1000,
        "type": "heavy"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "曹操",
          "type": "主公护卫",
          "intimacy": 80
        }
      ],
      "skillsOverride": null
    },
    "荀攸": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "尚书",
        "rank": "文官",
        "desc": "参谋主官，战前分析使己方首轮战斗力+5%。"
      },
      "title": "谋主",
      "loyalty": 88,
      "merit": 80,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "荀彧",
          "type": "族叔",
          "intimacy": 70
        },
        {
          "target": "郭嘉",
          "type": "同乡",
          "intimacy": 55
        },
        {
          "target": "钟繇",
          "type": null,
          "intimacy": 55
        }
      ],
      "skillsOverride": null
    },
    "程昱": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "振威将军",
        "rank": "文官",
        "desc": "善守险关，驻守城市时粮草消耗-10%。"
      },
      "title": "胆烈之士",
      "loyalty": 85,
      "merit": 70,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "郭嘉",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "荀彧",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "贾诩": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "太尉",
        "rank": "文官",
        "desc": "毒士之谋，每旬有概率使敌方两势力外交关系-5。（待实装）"
      },
      "title": "毒士",
      "loyalty": 70,
      "merit": 85,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "张绣",
          "type": "旧主",
          "intimacy": 50
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 45
        }
      ],
      "skillsOverride": null
    },
    "满宠": {
      "status": "active",
      "fac": "wei",
      "city": "nanyang",
      "role": null,
      "post": {
        "name": "扬州刺史",
        "rank": "将",
        "desc": "镇守东线，驻守城池防御+12%。"
      },
      "title": "坚壁老将",
      "loyalty": 82,
      "merit": 55,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "钟繇": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "太傅",
        "rank": "文官",
        "desc": "顶级文官，所在城市金产+20%，民心回复+0.5/旬。"
      },
      "title": "楷书鼻祖",
      "loyalty": 88,
      "merit": 65,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "荀彧",
          "type": "同乡",
          "intimacy": 60
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "荀攸",
          "type": null,
          "intimacy": 55
        },
        {
          "target": "王朗",
          "type": null,
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "王朗": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "司徒",
        "rank": "文官",
        "desc": "主掌民政，城市叛乱概率-25%。"
      },
      "title": "经学大儒",
      "loyalty": 80,
      "merit": 45,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "钟繇",
          "type": null,
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "曹洪": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "骠骑将军",
        "rank": "将",
        "desc": "宗亲武将，招募骑兵费用-10%。"
      },
      "title": "曹氏骏驹",
      "loyalty": 95,
      "merit": 60,
      "retainer": {
        "count": 1000,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "宗族",
          "intimacy": 80
        },
        {
          "target": "夏侯惇",
          "type": "同族",
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "郭淮": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "征西将军",
        "rank": "将",
        "desc": "西线守将，山地地形战力+10%。"
      },
      "title": "西境守望",
      "loyalty": 85,
      "merit": 50,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "张郃",
          "type": "同僚",
          "intimacy": 60
        },
        {
          "target": "夏侯渊",
          "type": "主将",
          "intimacy": 50
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "李典": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "破虏将军",
        "rank": "将",
        "desc": "儒将型将领，所辖部队行军不扰民，途经城市民心不降。"
      },
      "title": "儒侠将军",
      "loyalty": 82,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "张辽",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "乐进",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "臧霸": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "执金吾",
        "rank": "将",
        "desc": "青徐守将，驻守徐州系城市时防御+10%。"
      },
      "title": "青徐豪雄",
      "loyalty": 72,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "蒋济": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "太尉",
        "rank": "文官",
        "desc": "善析敌情，战前情报准确率+15%。"
      },
      "title": "庙堂谋臣",
      "loyalty": 84,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "司马懿",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "刘晔": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "太中大夫",
        "rank": "文官",
        "desc": "善造攻城器械，攻城部队攻城效率+12%。"
      },
      "title": "佐世之才",
      "loyalty": 80,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "牛金": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "后将军",
        "rank": "将",
        "desc": "冲锋型将领，野战首轮战力+8%。"
      },
      "title": "南郡虎将",
      "loyalty": 88,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹仁",
          "type": "主将",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "朱灵": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "后将军",
        "rank": "将",
        "desc": "中坚战将，所部重步兵防御+8%。"
      },
      "title": "铁壁先锋",
      "loyalty": 75,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "陈群": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "司空",
        "rank": "文官",
        "desc": "内政大才，所在势力每旬金产+10%，武将征辟效率+20%。"
      },
      "title": "九品宗师",
      "loyalty": 86,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "荀彧",
          "type": "同乡",
          "intimacy": 50
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "司马懿",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "曹真": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "大将军",
        "rank": "将",
        "desc": "宗室统帅，守备战略要地。"
      },
      "title": "伐蜀主帅",
      "loyalty": 92,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "养父",
          "intimacy": 50
        },
        {
          "target": "曹休",
          "type": "宗族",
          "intimacy": 50
        },
        {
          "target": "司马懿",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "曹彰": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "征北将军",
        "rank": "将",
        "desc": "武勇无双的曹氏猛将。"
      },
      "title": "黄须儿",
      "loyalty": 90,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "父",
          "intimacy": 50
        },
        {
          "target": "曹仁",
          "type": "宗族",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "华歆": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "司徒",
        "rank": "文官",
        "desc": "政务干练，城市金产+8%。"
      },
      "title": "逼宫司徒",
      "loyalty": 80,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "王朗",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "张绣": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "破虏将军",
        "rank": "将",
        "desc": "宛城降将，骑兵突击型。"
      },
      "title": "北地枪王",
      "loyalty": 55,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "贾诩",
          "type": "谋主",
          "intimacy": 50
        },
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "曹休": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "征东大将军",
        "rank": "将",
        "desc": "宗室统帅，擅长指挥大军团作战。"
      },
      "title": "千里驹",
      "loyalty": 90,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "族父",
          "intimacy": 50
        },
        {
          "target": "曹真",
          "type": "宗族",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "徐庶": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "右中郎将",
        "rank": "文官",
        "desc": "身在曹营心在汉，识人极准。"
      },
      "title": "颍川名士",
      "loyalty": 55,
      "merit": 30,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "挚友",
          "intimacy": 75
        },
        {
          "target": "庞统",
          "type": "同窗",
          "intimacy": 50
        },
        {
          "target": "刘备",
          "type": null,
          "intimacy": 70
        }
      ],
      "skillsOverride": null
    },
    "曹纯": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "虎豹骑督",
        "rank": "将",
        "desc": "统率曹操精锐虎豹骑，骑兵战力冠绝天下。"
      },
      "title": "虎豹骑督",
      "loyalty": 92,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "族弟",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "毛玠": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "东曹掾",
        "rank": "文官",
        "desc": "主管选拔人才，为曹操推行唯才是举。"
      },
      "title": "清廉选才",
      "loyalty": 80,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "董昭": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "将作大匠",
        "rank": "文官",
        "desc": "策划迁都许昌，善谋大略。"
      },
      "title": "迁都谋臣",
      "loyalty": 75,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "曹丕": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "五官中郎将",
        "rank": "文官",
        "desc": "曹操继承人，文武兼备，善诗赋。"
      },
      "title": "魏文帝",
      "loyalty": 95,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "父",
          "intimacy": 50
        },
        {
          "target": "曹植",
          "type": "兄弟",
          "intimacy": 50
        },
        {
          "target": "司马懿",
          "type": "近臣",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "曹植": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "临淄侯",
        "rank": "文官",
        "desc": "才高八斗，以文采名动天下。"
      },
      "title": "七步成诗",
      "loyalty": 82,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹操",
          "type": "父",
          "intimacy": 50
        },
        {
          "target": "曹丕",
          "type": "兄弟",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "郭女王": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "贵嫔",
        "rank": "文官",
        "desc": "善察人心，宫廷政治手腕高超。"
      },
      "title": "曹丕贤内",
      "loyalty": 88,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "曹丕",
          "type": "夫君",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "文聘": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "守将",
        "rank": "将",
        "desc": "长于守备，驻守城市防御加成+15%。"
      },
      "title": "荆州柱石",
      "loyalty": 75,
      "merit": 40,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [],
      "skillsOverride": null
    },
    "王平": {
      "status": "active",
      "fac": "wei",
      "city": "xuchang",
      "role": null,
      "post": {
        "name": "镇北大将军",
        "rank": "将",
        "desc": "出身寒门，治军严谨，善用无当飞军。"
      },
      "title": "无当飞军",
      "loyalty": 78,
      "merit": 45,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "恩主",
          "intimacy": 50
        },
        {
          "target": "马谡",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "司马昭": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "wei",
      "availableYear": 218,
      "wildData": {
        "title": "路人皆知",
        "post": {
          "name": "大将军",
          "rank": "文官",
          "desc": "司马懿之子，权倾朝野。"
        },
        "loyalty": 88,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "司马懿",
            "type": "父",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "陈泰": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "wei",
      "availableYear": 218,
      "wildData": {
        "title": "抗蜀名将",
        "post": {
          "name": "征西将军",
          "rank": "将",
          "desc": "陈群之子，善于防守反击。"
        },
        "loyalty": 82,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "陈群",
            "type": "父",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "王基": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "wei",
      "availableYear": 217,
      "wildData": {
        "title": "笃行之士",
        "post": {
          "name": "征南将军",
          "rank": "将",
          "desc": "文武兼备，治军严明。"
        },
        "loyalty": 85,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "刘备": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": "ruler",
      "post": {
        "name": "蜀汉昭烈帝",
        "rank": "王",
        "desc": "仁德感召，治下城市民心+5，叛乱概率减半。"
      },
      "title": "仁德之主",
      "loyalty": 98,
      "merit": 150,
      "retainer": {
        "count": 1500,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "关羽",
          "type": "义兄弟",
          "intimacy": 90
        },
        {
          "target": "张飞",
          "type": "义兄弟",
          "intimacy": 90
        },
        {
          "target": "诸葛亮",
          "type": "谋主",
          "intimacy": 85
        },
        {
          "target": "赵云",
          "type": "义臣",
          "intimacy": 80
        },
        {
          "target": "庞统",
          "type": null,
          "intimacy": 60
        },
        {
          "target": "法正",
          "type": null,
          "intimacy": 65
        },
        {
          "target": "黄忠",
          "type": null,
          "intimacy": 55
        },
        {
          "target": "马超",
          "type": null,
          "intimacy": 45
        },
        {
          "target": "徐庶",
          "type": null,
          "intimacy": 70
        },
        {
          "target": "吴懿",
          "type": null,
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "关羽": {
      "status": "active",
      "fac": "shu",
      "city": "xiangyang",
      "role": null,
      "post": {
        "name": "前将军",
        "rank": "将",
        "desc": "军中威望最高，同城守军士气+10。"
      },
      "title": "武圣",
      "loyalty": 95,
      "merit": 100,
      "retainer": {
        "count": 1500,
        "type": "heavy"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "刘备",
          "type": "义兄弟",
          "intimacy": 90
        },
        {
          "target": "张飞",
          "type": "义兄弟",
          "intimacy": 85
        },
        {
          "target": "张辽",
          "type": "义友",
          "intimacy": 55
        },
        {
          "target": "徐晃",
          "type": "义友",
          "intimacy": 55
        },
        {
          "target": "诸葛亮",
          "type": null,
          "intimacy": 55
        },
        {
          "target": "黄忠",
          "type": null,
          "intimacy": -15
        },
        {
          "target": "庞德",
          "type": null,
          "intimacy": -55
        }
      ],
      "skillsOverride": null
    },
    "张飞": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "车骑将军",
        "rank": "将",
        "desc": "攻城猛将，攻城战力+15%，但守备管理较差，驻守时民心-2/旬。"
      },
      "title": "万人敌",
      "loyalty": 93,
      "merit": 95,
      "retainer": {
        "count": 1200,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "义兄弟",
          "intimacy": 90
        },
        {
          "target": "关羽",
          "type": "义兄弟",
          "intimacy": 85
        },
        {
          "target": "诸葛亮",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "诸葛亮": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "蜀汉丞相",
        "rank": "文官",
        "desc": "内政全能，所有城市产粮+8%，建筑建设速度+2旬，外交行动效果+20%。"
      },
      "title": "卧龙",
      "loyalty": 99,
      "merit": 140,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 85
        },
        {
          "target": "庞统",
          "type": "同僚",
          "intimacy": 60
        },
        {
          "target": "法正",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "姜维",
          "type": "弟子",
          "intimacy": 75
        },
        {
          "target": "关羽",
          "type": null,
          "intimacy": 55
        },
        {
          "target": "张飞",
          "type": null,
          "intimacy": 50
        },
        {
          "target": "马谡",
          "type": null,
          "intimacy": 65
        },
        {
          "target": "蒋琬",
          "type": null,
          "intimacy": 70
        },
        {
          "target": "费祎",
          "type": null,
          "intimacy": 65
        },
        {
          "target": "魏延",
          "type": null,
          "intimacy": -30
        },
        {
          "target": "徐庶",
          "type": null,
          "intimacy": 75
        },
        {
          "target": "周瑜",
          "type": null,
          "intimacy": -40
        },
        {
          "target": "董允",
          "type": null,
          "intimacy": 70
        },
        {
          "target": "马忠",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "赵云": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "镇军将军",
        "rank": "将",
        "desc": "护卫主公，与刘备同城时刘备部队战斗力+10%。"
      },
      "title": "常山之龙",
      "loyalty": 99,
      "merit": 90,
      "retainer": {
        "count": 800,
        "type": "cavalry"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 80
        },
        {
          "target": "关羽",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "张飞",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "马超": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "骠骑将军",
        "rank": "将",
        "desc": "西凉骑兵统帅，骑兵部队行动力+2，征募马匹成本减半。"
      },
      "title": "锦马超",
      "loyalty": 72,
      "merit": 70,
      "retainer": {
        "count": 1000,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 45
        },
        {
          "target": "庞德",
          "type": "旧将",
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "黄忠": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "后将军",
        "rank": "将",
        "desc": "弓兵大师，弓兵部队战斗力+15%。"
      },
      "title": "老当益壮",
      "loyalty": 85,
      "merit": 75,
      "retainer": {
        "count": 500,
        "type": "archer"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 55
        },
        {
          "target": "关羽",
          "type": "同僚",
          "intimacy": -15
        }
      ],
      "skillsOverride": null
    },
    "魏延": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "汉中太守",
        "rank": "将",
        "desc": "北线主将，守卫汉中时驻防战斗力+20%。"
      },
      "title": "子午奇谋",
      "loyalty": 78,
      "merit": 60,
      "retainer": {
        "count": 600,
        "type": "heavy"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "诸葛亮",
          "type": "上司",
          "intimacy": -30
        }
      ],
      "skillsOverride": null
    },
    "庞统": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "军师中郎将",
        "rank": "文官",
        "desc": "战略规划，每旬可为一支己方部队指定目标，战斗力+8%。"
      },
      "title": "凤雏",
      "loyalty": 90,
      "merit": 75,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "同僚",
          "intimacy": 60
        },
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "法正": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "尚书令",
        "rank": "文官",
        "desc": "战时参谋，每场战斗前有20%概率发现敌方弱点，使其战斗力-10%。"
      },
      "title": "翼侧奇才",
      "loyalty": 88,
      "merit": 70,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 65
        },
        {
          "target": "诸葛亮",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "张松",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "廖化": {
      "status": "active",
      "fac": "shu",
      "city": "xiangyang",
      "role": null,
      "post": {
        "name": "右车骑将军",
        "rank": "将",
        "desc": "老兵统领，所辖部队自动补员速度+5%。"
      },
      "title": "蜀汉长青",
      "loyalty": 88,
      "merit": 35,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "上司",
          "intimacy": 50
        },
        {
          "target": "姜维",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "马岱": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "平北将军",
        "rank": "将",
        "desc": "骑兵奔袭，突袭战（敌军驻扎时）战斗力+10%。"
      },
      "title": "伏波后裔",
      "loyalty": 89,
      "merit": 45,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "马超",
          "type": "族弟",
          "intimacy": 50
        },
        {
          "target": "诸葛亮",
          "type": "上司",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "董允": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "侍中",
        "rank": "文官",
        "desc": "清廉持正，所在城市叛乱概率-30%，民心+0.4/旬。"
      },
      "title": "秉公侍中",
      "loyalty": 92,
      "merit": 35,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "恩主",
          "intimacy": 70
        },
        {
          "target": "费祎",
          "type": "同僚",
          "intimacy": 65
        },
        {
          "target": "蒋琬",
          "type": null,
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "张翼": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "左车骑将军",
        "rank": "将",
        "desc": "守城型良将，驻守城市防御加成+10%。"
      },
      "title": "犍为铁壁",
      "loyalty": 80,
      "merit": 30,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "部属",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "吴懿": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "车骑将军",
        "rank": "将",
        "desc": "皇亲武将，招募部队金钱消耗-8%。"
      },
      "title": "东州皇亲",
      "loyalty": 85,
      "merit": 40,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "国舅",
          "intimacy": 60
        }
      ],
      "skillsOverride": null
    },
    "马忠": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "镇南大将军",
        "rank": "将",
        "desc": "南中平叛专家，平叛行动效率+20%。"
      },
      "title": "南中柱石",
      "loyalty": 88,
      "merit": 35,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "部属",
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "霍峻": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "梓潼太守",
        "rank": "将",
        "desc": "守城专家，驻守时兵力损耗减少15%。"
      },
      "title": "孤城不屈",
      "loyalty": 90,
      "merit": 40,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "黄权": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "车骑将军",
        "rank": "文官",
        "desc": "善析大势，战前敌方部署信息可见范围+1格。"
      },
      "title": "持节巴臣",
      "loyalty": 82,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "诸葛亮",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "邓芝": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "车骑将军",
        "rank": "文官",
        "desc": "外交使臣，出使任务友好度加成+12%。"
      },
      "title": "使吴良臣",
      "loyalty": 86,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "上司",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "严颜": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "前将军",
        "rank": "将",
        "desc": "老将不屈，守城时士气不低于45。"
      },
      "title": "断头将军",
      "loyalty": 78,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "张飞",
          "type": "义友",
          "intimacy": 50
        },
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "关平": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "校尉",
        "rank": "将",
        "desc": "关羽之子，随父征战。"
      },
      "title": "忠孝随父",
      "loyalty": 95,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "关羽",
          "type": "父",
          "intimacy": 50
        },
        {
          "target": "关兴",
          "type": "兄弟",
          "intimacy": 50
        },
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "关兴": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "shu",
      "availableYear": 215,
      "wildData": {
        "title": "小关张",
        "post": {
          "name": "侍中",
          "rank": "将",
          "desc": "继承父志的二代骁将。"
        },
        "loyalty": 92,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "关羽",
            "type": "父",
            "intimacy": 50
          },
          {
            "target": "关平",
            "type": "兄弟",
            "intimacy": 50
          },
          {
            "target": "张苞",
            "type": "义兄弟",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "张苞": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "shu",
      "availableYear": 215,
      "wildData": {
        "title": "猛虎之子",
        "post": {
          "name": "校尉",
          "rank": "将",
          "desc": "张飞之子，武勇过人。"
        },
        "loyalty": 90,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "张飞",
            "type": "父",
            "intimacy": 50
          },
          {
            "target": "关兴",
            "type": "义兄弟",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "刘封": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "安东将军",
        "rank": "将",
        "desc": "刘备养子，武艺出众但性情刚烈。"
      },
      "title": "刚猛养子",
      "loyalty": 60,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "养父",
          "intimacy": 50
        },
        {
          "target": "孟达",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "吴班": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "骠骑将军",
        "rank": "将",
        "desc": "吴懿族弟，可靠的中坚力量。"
      },
      "title": "外戚柱石",
      "loyalty": 85,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "吴懿",
          "type": "族兄",
          "intimacy": 50
        },
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "马谡": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "参军",
        "rank": "文官",
        "desc": "熟读兵书，言过其实。"
      },
      "title": "越嶲太守",
      "loyalty": 75,
      "merit": 10,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "诸葛亮",
          "type": "恩主",
          "intimacy": 65
        },
        {
          "target": "王平",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "向宠": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "中领军",
        "rank": "将",
        "desc": "出师表点名推荐，公允持平。"
      },
      "title": "中领军",
      "loyalty": 85,
      "merit": 15,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [],
      "skillsOverride": null
    },
    "糜竺": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "安汉将军",
        "rank": "文官",
        "desc": "倾家资助刘备起兵，忠心不二。"
      },
      "title": "安汉将军",
      "loyalty": 95,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "糜芳",
          "type": "兄弟",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "糜芳": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "南郡太守",
        "rank": "将",
        "desc": "糜竺之弟，守荆州不力，性情摇摆。"
      },
      "title": "南郡太守",
      "loyalty": 40,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "糜竺",
          "type": "兄弟",
          "intimacy": 50
        },
        {
          "target": "关羽",
          "type": "上司",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "孙乾": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "从事中郎",
        "rank": "文官",
        "desc": "刘备元老，善外交斡旋。"
      },
      "title": "从事中郎",
      "loyalty": 88,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "简雍": {
      "status": "active",
      "fac": "shu",
      "city": "chengdu",
      "role": null,
      "post": {
        "name": "昭德将军",
        "rank": "文官",
        "desc": "最早追随刘备，以辩才著称，说降刘璋。"
      },
      "title": "说降辩士",
      "loyalty": 85,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "刘备",
          "type": "主公/挚友",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "夏侯霸": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "shu",
      "availableYear": 218,
      "wildData": {
        "title": "降蜀宗亲",
        "post": {
          "name": "车骑将军",
          "rank": "将",
          "desc": "夏侯渊之子，因司马氏篡权而降蜀。"
        },
        "loyalty": 72,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "夏侯渊",
            "type": "父",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "孙权": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": "ruler",
      "post": {
        "name": "吴大帝",
        "rank": "王",
        "desc": "坐拥江东，水路贸易加成+20%，港口城市金产+10%。"
      },
      "title": "碧眼紫髯",
      "loyalty": 98,
      "merit": 140,
      "retainer": {
        "count": 2000,
        "type": "heavy"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "周瑜",
          "type": "重臣",
          "intimacy": 85
        },
        {
          "target": "陆逊",
          "type": "重臣",
          "intimacy": 80
        },
        {
          "target": "鲁肃",
          "type": null,
          "intimacy": 80
        },
        {
          "target": "吕蒙",
          "type": null,
          "intimacy": 75
        },
        {
          "target": "黄盖",
          "type": null,
          "intimacy": 70
        },
        {
          "target": "程普",
          "type": null,
          "intimacy": 65
        },
        {
          "target": "甘宁",
          "type": null,
          "intimacy": 60
        },
        {
          "target": "张昭",
          "type": null,
          "intimacy": 65
        },
        {
          "target": "诸葛瑾",
          "type": null,
          "intimacy": 80
        }
      ],
      "skillsOverride": null
    },
    "周瑜": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "大都督",
        "rank": "将",
        "desc": "水军统帅，水路行军不消耗额外行动力，水战战斗力+20%。"
      },
      "title": "美周郎",
      "loyalty": 96,
      "merit": 130,
      "retainer": {
        "count": 1500,
        "type": "cavalry"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 85
        },
        {
          "target": "鲁肃",
          "type": "挚友",
          "intimacy": 85
        },
        {
          "target": "诸葛亮",
          "type": "宿敌",
          "intimacy": -40
        }
      ],
      "skillsOverride": null
    },
    "甘宁": {
      "status": "active",
      "fac": "wu",
      "city": "hefei",
      "role": null,
      "post": {
        "name": "折冲将军",
        "rank": "将",
        "desc": "水上劫掠，每旬有概率从敌方水路城市获得额外金钱。"
      },
      "title": "锦帆贼",
      "loyalty": 82,
      "merit": 70,
      "retainer": {
        "count": 800,
        "type": "light"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 60
        },
        {
          "target": "凌统",
          "type": "仇敌",
          "intimacy": -60
        }
      ],
      "skillsOverride": null
    },
    "鲁肃": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "大都督",
        "rank": "文官",
        "desc": "外交主轴，每旬外交行动效果+15%，联盟持续时间+2旬。"
      },
      "title": "榻上策",
      "loyalty": 94,
      "merit": 85,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 80
        },
        {
          "target": "周瑜",
          "type": "挚友",
          "intimacy": 85
        },
        {
          "target": "诸葛亮",
          "type": "盟友",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "吕蒙": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "大都督",
        "rank": "将",
        "desc": "荆州战略规划者，攻取荆州系城市战斗力+15%。"
      },
      "title": "白衣渡江",
      "loyalty": 92,
      "merit": 80,
      "retainer": {
        "count": 500,
        "type": "light"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 75
        },
        {
          "target": "陆逊",
          "type": "同僚",
          "intimacy": 65
        },
        {
          "target": "周瑜",
          "type": "前任",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "陆逊": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "吴国丞相",
        "rank": "文官",
        "desc": "内政与军事兼顾，城市建设速度+1旬，防守战战斗力+15%。"
      },
      "title": "书生大将",
      "loyalty": 90,
      "merit": 80,
      "retainer": {
        "count": 400,
        "type": "light"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 80
        },
        {
          "target": "吕蒙",
          "type": "前任",
          "intimacy": 65
        },
        {
          "target": "周瑜",
          "type": "前辈",
          "intimacy": 50
        },
        {
          "target": "诸葛瑾",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "黄盖": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "武锋中郎将",
        "rank": "将",
        "desc": "三朝老将，所在城市守军自然补员+5%/旬。"
      },
      "title": "苦肉忠臣",
      "loyalty": 93,
      "merit": 60,
      "retainer": {
        "count": 700,
        "type": "heavy"
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 70
        },
        {
          "target": "周瑜",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "韩当",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "凌统": {
      "status": "active",
      "fac": "wu",
      "city": "hefei",
      "role": null,
      "post": {
        "name": "荡寇中郎将",
        "rank": "将",
        "desc": "步兵突击手，进攻时轻步兵战斗力+10%。"
      },
      "title": "护主悍将",
      "loyalty": 85,
      "merit": 55,
      "retainer": {
        "count": 600,
        "type": "heavy"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "甘宁",
          "type": "仇敌",
          "intimacy": -60
        },
        {
          "target": "潘璋",
          "type": null,
          "intimacy": -40
        }
      ],
      "skillsOverride": null
    },
    "丁奉": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "吴国大将军",
        "rank": "将",
        "desc": "后期支柱，所辖骑兵部队行动力+1。"
      },
      "title": "雪中短兵",
      "loyalty": 90,
      "merit": 50,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "陆逊",
          "type": "上司",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "程普": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "荡寇将军",
        "rank": "将",
        "desc": "三朝元老，带兵稳健，行军时不会因粮草不足而溃散。"
      },
      "title": "三朝虎臣",
      "loyalty": 90,
      "merit": 65,
      "retainer": {
        "count": 700,
        "type": "cavalry"
      },
      "initialUnit": true,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 65
        },
        {
          "target": "周瑜",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "韩当",
          "type": null,
          "intimacy": 70
        }
      ],
      "skillsOverride": null
    },
    "朱然": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "左大司马",
        "rank": "将",
        "desc": "水陆两用，水战和陆战均无地形惩罚。"
      },
      "title": "坚城名将",
      "loyalty": 91,
      "merit": 55,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "陆逊",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "张昭": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "辅吴将军",
        "rank": "文官",
        "desc": "江东第一文官，所在城市金产+22%，民心+0.5/旬。"
      },
      "title": "江东柱石",
      "loyalty": 85,
      "merit": 75,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "元老",
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "诸葛瑾": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "大将军",
        "rank": "文官",
        "desc": "文武兼备，外交行动好感加成+10%。"
      },
      "title": "联盟使者",
      "loyalty": 88,
      "merit": 60,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 80
        },
        {
          "target": "诸葛亮",
          "type": "兄弟",
          "intimacy": 50
        },
        {
          "target": "陆逊",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "韩当": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "昭武将军",
        "rank": "将",
        "desc": "孙坚旧部，麾下部队士气上限+5。"
      },
      "title": "三朝宿将",
      "loyalty": 92,
      "merit": 55,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "程普",
          "type": "旧友",
          "intimacy": 70
        },
        {
          "target": "黄盖",
          "type": null,
          "intimacy": 65
        }
      ],
      "skillsOverride": null
    },
    "徐盛": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "安东将军",
        "rank": "将",
        "desc": "守城能将，攻城战守方战力+10%。"
      },
      "title": "疑城退敌",
      "loyalty": 85,
      "merit": 50,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "潘璋": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "振威将军",
        "rank": "将",
        "desc": "进攻型勇将，野战首回合战力+8%。"
      },
      "title": "夺刀悍将",
      "loyalty": 80,
      "merit": 40,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "凌统",
          "type": "仇人",
          "intimacy": -40
        }
      ],
      "skillsOverride": null
    },
    "贺齐": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "后将军",
        "rank": "将",
        "desc": "山越克星，丘陵/山地战力+12%。"
      },
      "title": "山越克星",
      "loyalty": 84,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "顾雍": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "吴国丞相",
        "rank": "文官",
        "desc": "治国之才，所在势力城市民心+0.5/旬，金产+8%。"
      },
      "title": "寡言丞相",
      "loyalty": 90,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "张昭",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "步骘": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "骠骑将军",
        "rank": "文官",
        "desc": "南疆治理者，交州城市产出+15%。"
      },
      "title": "南疆安石",
      "loyalty": 86,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "诸葛瑾",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "周泰": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "奋威将军",
        "rank": "将",
        "desc": "孙权贴身护卫，忠勇无双。"
      },
      "title": "以命护主",
      "loyalty": 95,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "蒋钦",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "蒋钦": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "荡寇将军",
        "rank": "将",
        "desc": "早期宿将，治军严整。"
      },
      "title": "公正宿将",
      "loyalty": 88,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        },
        {
          "target": "周泰",
          "type": "同僚",
          "intimacy": 50
        },
        {
          "target": "徐盛",
          "type": "旧怨→推荐",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "全琮": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "右大司马",
        "rank": "将",
        "desc": "孙权女婿，善于指挥大规模作战。"
      },
      "title": "石亭功臣",
      "loyalty": 82,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "女婿",
          "intimacy": 50
        },
        {
          "target": "陆逊",
          "type": "同僚",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "吕范": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "大司马",
        "rank": "文官",
        "desc": "文武全才的创业元老，善理财务。"
      },
      "title": "元从干才",
      "loyalty": 90,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "朱桓": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "前将军",
        "rank": "将",
        "desc": "性烈如火，濡须之战大破曹仁。"
      },
      "title": "濡须虎将",
      "loyalty": 82,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "骆统": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "偏将军",
        "rank": "文官",
        "desc": "文武兼备，善内政，直言进谏。"
      },
      "title": "忠谏重臣",
      "loyalty": 85,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "吕据": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "骠骑将军",
        "rank": "将",
        "desc": "吕范之子，承父业征战。"
      },
      "title": "吕范之嗣",
      "loyalty": 78,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "吕范",
          "type": "父",
          "intimacy": 50
        },
        {
          "target": "孙权",
          "type": "主公",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "留赞": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "左将军",
        "rank": "将",
        "desc": "勇猛善战，晚年仍奋勇杀敌。"
      },
      "title": "后期勇将",
      "loyalty": 80,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [],
      "skillsOverride": null
    },
    "孙尚香": {
      "status": "active",
      "fac": "wu",
      "city": "jianye",
      "role": null,
      "post": {
        "name": "公主",
        "rank": "将",
        "desc": "孙权之妹，嫁刘备后回吴，武艺不凡。"
      },
      "title": "弓腰姬",
      "loyalty": 85,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孙权",
          "type": "兄长",
          "intimacy": 50
        },
        {
          "target": "刘备",
          "type": "前夫",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "诸葛恪": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "wu",
      "availableYear": 217,
      "wildData": {
        "title": "东兴大捷",
        "post": {
          "name": "大将军",
          "rank": "将",
          "desc": "诸葛瑾之子，少年成名，东兴之战大破魏军。"
        },
        "loyalty": 78,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "诸葛瑾",
            "type": "父",
            "intimacy": 50
          },
          {
            "target": "孙权",
            "type": "主公",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "施绩": {
      "status": "pending",
      "fac": "wild",
      "pendingFac": "wu",
      "availableYear": 218,
      "wildData": {
        "title": "朱然之嗣",
        "post": {
          "name": "上大将军",
          "rank": "将",
          "desc": "朱然之子，改姓施，继父业镇守边疆。"
        },
        "loyalty": 80,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "朱然",
            "type": "父",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "孟获": {
      "status": "active",
      "fac": "nanman",
      "city": "jianning",
      "role": "ruler",
      "post": {
        "name": "蛮王",
        "rank": "王",
        "desc": "南中蛮族首领，勇猛善战，统领南中诸蛮部族。"
      },
      "title": "南蛮王",
      "loyalty": 95,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "祝融",
          "type": "妻",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "祝融": {
      "status": "active",
      "fac": "nanman",
      "city": "jianning",
      "role": null,
      "post": {
        "name": "蛮将",
        "rank": "将",
        "desc": "孟获之妻，善使飞刀，擅长火攻，勇悍不让须眉。"
      },
      "title": "烈焰夫人",
      "loyalty": 95,
      "merit": 20,
      "retainer": {
        "count": 0,
        "type": null
      },
      "initialUnit": false,
      "relations": [
        {
          "target": "孟获",
          "type": "夫",
          "intimacy": 50
        }
      ],
      "skillsOverride": null
    },
    "张松": {
      "status": "wild",
      "fac": "wild",
      "wildData": {
        "title": "倒持西蜀",
        "post": {
          "name": "别驾",
          "rank": "文官",
          "desc": "熟知益州山川地理，己方在蜀地行军AP消耗-20%。"
        },
        "loyalty": 55,
        "merit": 20,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "法正",
            "type": "同谋",
            "intimacy": 65
          }
        ],
        "skillsOverride": null
      }
    },
    "庞德": {
      "status": "wild",
      "fac": "wild",
      "wildData": {
        "title": "抬棺决死",
        "post": {
          "name": "先锋",
          "rank": "将",
          "desc": "万人敌之勇，正面冲阵时部队战力+12%。"
        },
        "loyalty": 80,
        "merit": 50,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "马超",
            "type": "旧主",
            "intimacy": 60
          },
          {
            "target": "关羽",
            "type": "宿敌",
            "intimacy": -55
          }
        ],
        "skillsOverride": null
      }
    },
    "李严": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 215,
      "wildData": {
        "title": "托孤重臣",
        "post": {
          "name": "尚书令",
          "rank": "文官",
          "desc": "蜀汉重臣，主持内政可加速建设速度-1旬。"
        },
        "loyalty": 65,
        "merit": 30,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "诸葛亮",
            "type": "政敌",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "邓艾": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 219,
      "wildData": {
        "title": "偷渡阴平",
        "post": {
          "name": "合围",
          "rank": "将",
          "desc": "善用险道奇兵，山地行军AP消耗减半，奇袭成功率+20%。"
        },
        "loyalty": 78,
        "merit": 15,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "钟会",
            "type": "宿敌",
            "intimacy": -30
          }
        ],
        "skillsOverride": null
      }
    },
    "钟会": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 221,
      "wildData": {
        "title": "志大才疏",
        "post": {
          "name": "谋帅",
          "rank": "文官",
          "desc": "文武兼备，统率与智谋均衡，伏击识破率+25%。"
        },
        "loyalty": 55,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "邓艾",
            "type": "宿敌",
            "intimacy": -30
          },
          {
            "target": "司马懿",
            "type": "旧主后人",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "孟达": {
      "status": "wild",
      "fac": "wild",
      "wildData": {
        "title": "反复无常",
        "post": {
          "name": "守将",
          "rank": "将",
          "desc": "善守关隘，驻守山城防御加成+10%。"
        },
        "loyalty": 40,
        "merit": 20,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "刘封",
            "type": "同僚",
            "intimacy": 50
          },
          {
            "target": "司马懿",
            "type": "宿敌",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "申耽": {
      "status": "wild",
      "fac": "wild",
      "wildData": {
        "title": "上庸豪族",
        "post": {
          "name": "郡守",
          "rank": "将",
          "desc": "上庸地方豪族，驻守上庸城城防+8%。"
        },
        "loyalty": 50,
        "merit": 15,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "郝昭": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 215,
      "wildData": {
        "title": "陈仓坚守",
        "post": {
          "name": "守将",
          "rank": "将",
          "desc": "守城专家，攻城方攻城兵器效果对己方城市减半。"
        },
        "loyalty": 82,
        "merit": 30,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "张任": {
      "status": "wild",
      "fac": "wild",
      "wildData": {
        "title": "落凤之弓",
        "post": {
          "name": "先锋",
          "rank": "将",
          "desc": "蜀道险关守将，山地伏击成功率+20%。"
        },
        "loyalty": 88,
        "merit": 35,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "杨洪": {
      "status": "wild",
      "fac": "wild",
      "wildData": {
        "title": "蜀中干吏",
        "post": {
          "name": "郡守",
          "rank": "文官",
          "desc": "精于内政，辖区人口增长+8%，民心稳定。"
        },
        "loyalty": 80,
        "merit": 15,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "蒋琬": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 217,
      "wildData": {
        "title": "社稷之器",
        "post": {
          "name": "丞相继任",
          "rank": "文官",
          "desc": "诸葛亮身后蜀汉柱石，内政全面加成+8%。"
        },
        "loyalty": 88,
        "merit": 15,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "诸葛亮",
            "type": "继承者",
            "intimacy": 70
          },
          {
            "target": "费祎",
            "type": "同僚",
            "intimacy": 70
          },
          {
            "target": "董允",
            "type": null,
            "intimacy": 60
          }
        ],
        "skillsOverride": null
      }
    },
    "费祎": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 217,
      "wildData": {
        "title": "折冲良臣",
        "post": {
          "name": "大将军",
          "rank": "文官",
          "desc": "调和文武，外交行动成功率+15%。"
        },
        "loyalty": 85,
        "merit": 15,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "蒋琬",
            "type": "同僚",
            "intimacy": 70
          },
          {
            "target": "诸葛亮",
            "type": "恩主",
            "intimacy": 65
          },
          {
            "target": "董允",
            "type": null,
            "intimacy": 65
          }
        ],
        "skillsOverride": null
      }
    },
    "姜维": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 216,
      "wildData": {
        "title": "天水麒麟儿",
        "post": {
          "name": "镇军将军",
          "rank": "将",
          "desc": "文武双全，诸葛亮衣钵传人，蜀汉后期柱石。"
        },
        "loyalty": 90,
        "merit": 40,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [
          {
            "target": "诸葛亮",
            "type": "师父",
            "intimacy": 75
          },
          {
            "target": "刘备",
            "type": "主公",
            "intimacy": 50
          }
        ],
        "skillsOverride": null
      }
    },
    "文鸯": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 221,
      "wildData": {
        "title": "单骑退雄兵",
        "post": {
          "name": "前将军",
          "rank": "将",
          "desc": "勇冠三军，单骑冲阵退敌。"
        },
        "loyalty": 70,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "羊祜": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 221,
      "wildData": {
        "title": "襄阳儒帅",
        "post": {
          "name": "征南大将军",
          "rank": "文官",
          "desc": "以德服人，镇守襄阳，为灭吴奠基。"
        },
        "loyalty": 85,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    },
    "王濬": {
      "status": "pending",
      "fac": "wild",
      "availableYear": 219,
      "wildData": {
        "title": "楼船灭吴",
        "post": {
          "name": "龙骧将军",
          "rank": "将",
          "desc": "建造楼船，顺江而下灭吴，水军统帅。"
        },
        "loyalty": 80,
        "merit": 10,
        "retainer": {
          "count": 0,
          "type": null
        },
        "relations": [],
        "skillsOverride": null
      }
    }
  },
  "initialUnits": [
    {
      "fac": "wei",
      "city": "xuchang",
      "squads": [
        {
          "genName": "曹操",
          "type": "cavalry",
          "troops": 3000,
          "maxTroops": 3000,
          "morale": 88
        },
        {
          "genName": "许褚",
          "type": "heavy",
          "troops": 2500,
          "maxTroops": 2500,
          "morale": 85
        }
      ]
    },
    {
      "fac": "wei",
      "city": "nanyang",
      "squads": [
        {
          "genName": "曹仁",
          "type": "heavy",
          "troops": 3500,
          "maxTroops": 3500,
          "morale": 85
        },
        {
          "genName": "满宠",
          "type": "archer",
          "troops": 2000,
          "maxTroops": 2000,
          "morale": 80
        }
      ]
    },
    {
      "fac": "wei",
      "city": "xiapi",
      "squads": [
        {
          "genName": "张辽",
          "type": "cavalry",
          "troops": 3500,
          "maxTroops": 3500,
          "morale": 88
        },
        {
          "genName": "乐进",
          "type": "light",
          "troops": 2500,
          "maxTroops": 2500,
          "morale": 82
        }
      ]
    },
    {
      "fac": "shu",
      "city": "chengdu",
      "squads": [
        {
          "genName": "赵云",
          "type": "cavalry",
          "troops": 3000,
          "maxTroops": 3000,
          "morale": 88
        },
        {
          "genName": "张翼",
          "type": "light",
          "troops": 2000,
          "maxTroops": 2000,
          "morale": 78
        }
      ]
    },
    {
      "fac": "shu",
      "city": "xiangyang",
      "squads": [
        {
          "genName": "关羽",
          "type": "light",
          "troops": 3500,
          "maxTroops": 3500,
          "morale": 90
        },
        {
          "genName": "廖化",
          "type": "cavalry",
          "troops": 2000,
          "maxTroops": 2000,
          "morale": 80
        }
      ]
    },
    {
      "fac": "wu",
      "city": "jianye",
      "squads": [
        {
          "genName": "吕蒙",
          "type": "light",
          "troops": 3500,
          "maxTroops": 3500,
          "morale": 88
        },
        {
          "genName": "程普",
          "type": "heavy",
          "troops": 2500,
          "maxTroops": 2500,
          "morale": 80
        }
      ]
    },
    {
      "fac": "wu",
      "city": "hefei",
      "squads": [
        {
          "genName": "甘宁",
          "type": "cavalry",
          "troops": 3500,
          "maxTroops": 3500,
          "morale": 85
        },
        {
          "genName": "凌统",
          "type": "light",
          "troops": 2500,
          "maxTroops": 2500,
          "morale": 82
        }
      ]
    }
  ]
};
