// general_base.js
//
// 武将主表(cross-scenario fix,immutable 字段)
// 字段:com/war/int/pol/cha/apt(战力)+ birthplace/clan/gentry/classTag/skills/values/faction_clan(史实不变)
// 不进 GEN_BASE 的字段(scenario-specific,留 SCENARIO_xxx.generals):title/post/loyalty/relations/role/merit/retainer
// birthYear/deathYear/debutYear:1a 阶段未填(仅 GEN_POOL_INACTIVE 武将含 era 数据),留阶段 6 年龄 hook 补全
//
// 来源:阶段 1a.1 由 tools/extract_scenario_214.js 自动抽取自 project_romance_v181.html。
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3。

const GEN_BASE = {
  "曹操": {
    "com": 97,
    "war": 80,
    "int": 91,
    "pol": 96,
    "cha": 87,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 155,
    "deathYear": 220,
    "debutYear": 174,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": "yu",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [
      {
        "name": "奸雄",
        "type": "被动",
        "icon": "⚙",
        "desc": "当官/君主时，信誉惩罚减半，信誉自然恢复速度×2。（已实装）"
      }
    ],
    "values": []
  },
  "张辽": {
    "com": 92,
    "war": 95,
    "int": 72,
    "pol": 60,
    "cha": 78,
    "apt": {
      "cavalry": "S",
      "light": "A",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 169,
    "deathYear": 222,
    "debutYear": 189,
    "birthplace": "雁门马邑",
    "clan": "雁门马邑",
    "faction_clan": "并州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "威风",
        "type": "被动",
        "icon": "⚡",
        "desc": "敌方兵力≥己方2倍时，张辽所在部队全体士气+20。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "郭嘉": {
    "com": 85,
    "war": 48,
    "int": 99,
    "pol": 78,
    "cha": 72,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "C",
      "archer": "A",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 170,
    "deathYear": 207,
    "debutYear": 191,
    "birthplace": "颍川阳翟",
    "clan": "颍川郭氏",
    "faction_clan": "颍川",
    "gentry": "yu",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "鬼谋",
        "type": "被动",
        "icon": "🧠",
        "desc": "郭嘉所在部队视野+1格。（已实装）"
      }
    ],
    "values": []
  },
  "夏侯惇": {
    "com": 88,
    "war": 91,
    "int": 62,
    "pol": 55,
    "cha": 70,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 220,
    "debutYear": 190,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "独眼",
        "type": "被动",
        "icon": "👁",
        "desc": "重伤状态下武力不衰减（免疫war×0.8惩罚）。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "荀彧": {
    "com": 80,
    "war": 42,
    "int": 96,
    "pol": 94,
    "cha": 80,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 163,
    "deathYear": 212,
    "debutYear": 189,
    "birthplace": "颍川颍阴",
    "clan": "颍川荀氏",
    "faction_clan": "颍川",
    "gentry": "yu",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "王佐",
        "type": "被动",
        "icon": "📜",
        "desc": "荀彧在任官职时，全城豪族支持回复+0.3/旬。（已实装）"
      }
    ],
    "values": [
      "汉室死忠"
    ]
  },
  "曹仁": {
    "com": 90,
    "war": 88,
    "int": 76,
    "pol": 65,
    "cha": 72,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "S",
      "archer": "C",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 168,
    "deathYear": 223,
    "debutYear": 190,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [
      {
        "name": "坚守",
        "type": "被动",
        "icon": "🛡",
        "desc": "曹仁为主将时，守城(garrison)或营寨(camp)战中DEF+15%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "乐进": {
    "com": 80,
    "war": 88,
    "int": 65,
    "pol": 52,
    "cha": 60,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 218,
    "debutYear": 190,
    "birthplace": "阳平卫国",
    "clan": null,
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "先登",
        "type": "被动",
        "icon": "⚔",
        "desc": "攻城战时，所有攻方士气+18。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "于禁": {
    "com": 84,
    "war": 82,
    "int": 70,
    "pol": 68,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 221,
    "debutYear": 184,
    "birthplace": "泰山钜平",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "治军",
        "type": "被动",
        "icon": "🏳",
        "desc": "于禁在场时，己方全体战前士气+5。（已实装）"
      }
    ],
    "values": []
  },
  "徐晃": {
    "com": 88,
    "war": 89,
    "int": 74,
    "pol": 62,
    "cha": 70,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": 169,
    "deathYear": 227,
    "debutYear": 192,
    "birthplace": "河东杨县",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "长驱",
        "type": "被动",
        "icon": "🐎",
        "desc": "徐晃为主将且行军路径>3格时AP+1。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "张郃": {
    "com": 86,
    "war": 90,
    "int": 80,
    "pol": 65,
    "cha": 72,
    "apt": {
      "cavalry": "S",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 231,
    "debutYear": 184,
    "birthplace": "河间鄚县",
    "clan": null,
    "faction_clan": "冀州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [
      {
        "name": "巧变",
        "type": "被动",
        "icon": "🧠",
        "desc": "张郃所在部队不利地形惩罚减半（如cavalry在forest惩罚0.7→0.85）。（已实装）"
      }
    ],
    "values": []
  },
  "司马懿": {
    "com": 94,
    "war": 55,
    "int": 98,
    "pol": 92,
    "cha": 82,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": 179,
    "deathYear": 251,
    "debutYear": 208,
    "birthplace": "河内温县",
    "clan": "河内司马氏",
    "faction_clan": "河内",
    "gentry": "si",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [
      {
        "name": "冢虎",
        "type": "被动",
        "icon": "🦅",
        "desc": "司马懿为主将时，作为防守方DEF+15%。（已实装）"
      }
    ],
    "values": [
      "野心"
    ]
  },
  "夏侯渊": {
    "com": 84,
    "war": 90,
    "int": 62,
    "pol": 55,
    "cha": 65,
    "apt": {
      "cavalry": "S",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 219,
    "debutYear": 190,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "虎步",
        "type": "被动",
        "icon": "🐎",
        "desc": "夏侯渊为主将时AP+2，但DEF-10%（重攻轻守）。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "许褚": {
    "com": 72,
    "war": 99,
    "int": 42,
    "pol": 38,
    "cha": 55,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 197,
    "birthplace": "谯国谯县",
    "clan": "谯国许氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "虎痴",
        "type": "被动",
        "icon": "💪",
        "desc": "许褚参与单挑时score+20，大幅提高胜率。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "荀攸": {
    "com": 78,
    "war": 45,
    "int": 95,
    "pol": 88,
    "cha": 75,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 157,
    "deathYear": 214,
    "debutYear": 184,
    "birthplace": "颍川颍阴",
    "clan": "颍川荀氏",
    "faction_clan": "颍川",
    "gentry": "yu",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "奇策",
        "type": "被动",
        "icon": "🧠",
        "desc": "当官时用计成功率+8%。（已实装）"
      }
    ],
    "values": []
  },
  "程昱": {
    "com": 76,
    "war": 50,
    "int": 90,
    "pol": 82,
    "cha": 68,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": 141,
    "deathYear": 220,
    "debutYear": 192,
    "birthplace": "东郡东阿",
    "clan": "东郡程氏",
    "faction_clan": "兖州",
    "gentry": "yan",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [],
    "values": []
  },
  "贾诩": {
    "com": 80,
    "war": 45,
    "int": 100,
    "pol": 85,
    "cha": 74,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 147,
    "deathYear": 223,
    "debutYear": 184,
    "birthplace": "武威姑臧",
    "clan": "武威贾氏",
    "faction_clan": "凉州",
    "gentry": "liang",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "离间",
        "type": "被动",
        "icon": "🎭",
        "desc": "当官/君主时，反间计成功率+20%。（已实装）"
      }
    ],
    "values": []
  },
  "满宠": {
    "com": 65,
    "war": 62,
    "int": 72,
    "pol": 78,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 242,
    "debutYear": 196,
    "birthplace": "山阳昌邑",
    "clan": "兖州满氏",
    "faction_clan": "兖州",
    "gentry": "yan",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "坚壁",
        "type": "被动",
        "icon": "🏯",
        "desc": "守城时被围城耐久消耗速度减慢30%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "钟繇": {
    "com": 42,
    "war": 38,
    "int": 80,
    "pol": 88,
    "cha": 75,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 151,
    "deathYear": 230,
    "debutYear": 184,
    "birthplace": "颍川长社",
    "clan": "颍川钟氏",
    "faction_clan": "颍川",
    "gentry": "yu",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "楷范",
        "type": "被动",
        "icon": "📜",
        "desc": "当官时势力信誉+0.15/旬。（已实装）"
      }
    ],
    "values": []
  },
  "王朗": {
    "com": 38,
    "war": 30,
    "int": 75,
    "pol": 82,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 228,
    "debutYear": 188,
    "birthplace": "东海郯县",
    "clan": "东海王氏",
    "faction_clan": "中原",
    "gentry": "xu",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "经义",
        "type": "被动",
        "icon": "📜",
        "desc": "当官时全城民心+0.15/旬；对战部队有诸葛亮时自squad士气-20。（已实装）"
      }
    ],
    "values": []
  },
  "曹洪": {
    "com": 65,
    "war": 70,
    "int": 52,
    "pol": 58,
    "cha": 55,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 232,
    "debutYear": 190,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "舍命",
        "type": "被动",
        "icon": "🛡",
        "desc": "曹操同部队时全队DEF+10%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "郭淮": {
    "com": 72,
    "war": 68,
    "int": 75,
    "pol": 70,
    "cha": 62,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 255,
    "debutYear": 215,
    "birthplace": "太原阳曲",
    "clan": "太原郭氏",
    "faction_clan": "中原",
    "gentry": "bing",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "西境",
        "type": "被动",
        "icon": "🏔",
        "desc": "主将时山地/丘陵DEF×1.12。（已实装）"
      }
    ],
    "values": []
  },
  "李典": {
    "com": 74,
    "war": 78,
    "int": 72,
    "pol": 68,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 209,
    "debutYear": 190,
    "birthplace": "山阳钜野",
    "clan": "山阳李氏",
    "faction_clan": "兖州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "协阵",
        "type": "被动",
        "icon": "📚",
        "desc": "同部队有张辽/乐进时，每人李典squad ATK/DEF+5%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "臧霸": {
    "com": 70,
    "war": 75,
    "int": 55,
    "pol": 62,
    "cha": 60,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 184,
    "birthplace": "泰山华县",
    "clan": "泰山臧氏",
    "faction_clan": "青徐",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "啸聚",
        "type": "被动",
        "icon": "🏴",
        "desc": "所在squad最近己方城市∈青徐时补员×2。（已实装）"
      }
    ],
    "values": []
  },
  "蒋济": {
    "com": 62,
    "war": 45,
    "int": 82,
    "pol": 80,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 249,
    "debutYear": 208,
    "birthplace": "楚国平阿",
    "clan": "楚国蒋氏",
    "faction_clan": "中原",
    "gentry": "yang",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [],
    "values": []
  },
  "刘晔": {
    "com": 65,
    "war": 50,
    "int": 85,
    "pol": 78,
    "cha": 68,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 234,
    "debutYear": 198,
    "birthplace": "淮南成德",
    "clan": "淮南刘氏",
    "faction_clan": "中原",
    "gentry": "yang",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "巧思",
        "type": "被动",
        "icon": "⚙",
        "desc": "当官时己方围城消耗+10%，攻城ATK+5%。（已实装）"
      }
    ],
    "values": []
  },
  "牛金": {
    "com": 58,
    "war": 72,
    "int": 45,
    "pol": 40,
    "cha": 48,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 209,
    "birthplace": "未详",
    "clan": null,
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "朱灵": {
    "com": 65,
    "war": 70,
    "int": 55,
    "pol": 52,
    "cha": 55,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 192,
    "birthplace": "清河鄃县",
    "clan": "清河朱氏",
    "faction_clan": "冀州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "陈群": {
    "com": 55,
    "war": 35,
    "int": 80,
    "pol": 92,
    "cha": 78,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 237,
    "debutYear": 198,
    "birthplace": "颍川许昌",
    "clan": "颍川陈氏",
    "faction_clan": "颍川",
    "gentry": "yu",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "九品",
        "type": "被动",
        "icon": "📋",
        "desc": "当官时，全体招募（劝降/在野/挖角）成功率+5%。（已实装）"
      }
    ],
    "values": []
  },
  "曹真": {
    "com": 85,
    "war": 80,
    "int": 75,
    "pol": 68,
    "cha": 72,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 231,
    "debutYear": 200,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [
      {
        "name": "缓进",
        "type": "被动",
        "icon": "🛡",
        "desc": "在围城部队中时，城防衰减速度+20%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "曹彰": {
    "com": 72,
    "war": 92,
    "int": 48,
    "pol": 35,
    "cha": 65,
    "apt": {
      "cavalry": "S",
      "light": "A",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 223,
    "debutYear": 218,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "黄须",
        "type": "被动",
        "icon": "⚔",
        "desc": "主将骑兵非攻城时ATK/DEF×1.05。（已实装）"
      }
    ],
    "values": []
  },
  "华歆": {
    "com": 45,
    "war": 30,
    "int": 72,
    "pol": 88,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 157,
    "deathYear": 232,
    "debutYear": 184,
    "birthplace": "平原高唐",
    "clan": "高唐华氏",
    "faction_clan": "冀州",
    "gentry": "qing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "逼宫",
        "type": "被动",
        "icon": "👁",
        "desc": "当官时称帝门槛降低（城市8/信誉30）。（已实装）"
      }
    ],
    "values": []
  },
  "张绣": {
    "com": 78,
    "war": 85,
    "int": 62,
    "pol": 48,
    "cha": 55,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 207,
    "debutYear": 189,
    "birthplace": "武威祖厉",
    "clan": "武威张氏",
    "faction_clan": "凉州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "投机"
    ]
  },
  "曹休": {
    "com": 80,
    "war": 78,
    "int": 70,
    "pol": 62,
    "cha": 68,
    "apt": {
      "cavalry": "A",
      "light": "B",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 228,
    "debutYear": 200,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "千里驹",
        "type": "被动",
        "icon": "🏇",
        "desc": "骑兵主将时AP+1。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "徐庶": {
    "com": 85,
    "war": 62,
    "int": 95,
    "pol": 80,
    "cha": 82,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 201,
    "birthplace": "颍川",
    "clan": "颍川徐氏",
    "faction_clan": "颍川",
    "gentry": null,
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "识才",
        "type": "被动",
        "icon": "🧠",
        "desc": "当官时招募在野武将成功率+10%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "曹纯": {
    "com": 72,
    "war": 85,
    "int": 55,
    "pol": 48,
    "cha": 62,
    "apt": {
      "cavalry": "S",
      "light": "B",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 170,
    "deathYear": 210,
    "debutYear": 190,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "毛玠": {
    "com": 58,
    "war": 35,
    "int": 75,
    "pol": 85,
    "cha": 72,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 216,
    "debutYear": 192,
    "birthplace": "陈留平丘",
    "clan": "陈留毛氏",
    "faction_clan": null,
    "gentry": "yan",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "董昭": {
    "com": 60,
    "war": 38,
    "int": 82,
    "pol": 80,
    "cha": 65,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 156,
    "deathYear": 236,
    "debutYear": 184,
    "birthplace": "济阴定陶",
    "clan": "济阴董氏",
    "faction_clan": null,
    "gentry": "yan",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [],
    "values": []
  },
  "曹丕": {
    "com": 82,
    "war": 68,
    "int": 85,
    "pol": 88,
    "cha": 72,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 187,
    "deathYear": 226,
    "debutYear": 204,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "commander",
    "classTagsAll": [
      "commander"
    ],
    "skills": [],
    "values": [
      "野心"
    ]
  },
  "曹植": {
    "com": 55,
    "war": 35,
    "int": 88,
    "pol": 72,
    "cha": 85,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 192,
    "deathYear": 232,
    "debutYear": 210,
    "birthplace": "沛国谯县",
    "clan": "谯县曹氏",
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": []
  },
  "郭女王": {
    "com": 55,
    "war": 25,
    "int": 80,
    "pol": 85,
    "cha": 78,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 184,
    "deathYear": 235,
    "debutYear": 213,
    "birthplace": "安平广宗",
    "clan": "安平郭氏",
    "faction_clan": null,
    "gentry": "ji",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": []
  },
  "文聘": {
    "com": 80,
    "war": 85,
    "int": 65,
    "pol": 60,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 208,
    "birthplace": "南阳",
    "clan": "南阳文氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "镇荆",
        "type": "被动",
        "icon": "🏰",
        "desc": "荆州城市守城时DEF×1.20。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "王平": {
    "com": 80,
    "war": 82,
    "int": 70,
    "pol": 62,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "S",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 248,
    "debutYear": 215,
    "birthplace": "巴西宕渠",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "险守",
        "type": "被动",
        "icon": "🏔",
        "desc": "山地/丘陵守方有王平时DEF×1.10。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "司马昭": {
    "com": 85,
    "war": 58,
    "int": 90,
    "pol": 88,
    "cha": 75,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 211,
    "deathYear": 265,
    "debutYear": 235,
    "birthplace": "河内温县",
    "clan": "河内司马氏",
    "faction_clan": null,
    "gentry": "si",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [],
    "values": [
      "野心"
    ]
  },
  "陈泰": {
    "com": 78,
    "war": 72,
    "int": 80,
    "pol": 75,
    "cha": 70,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 260,
    "debutYear": 232,
    "birthplace": "颍川许昌",
    "clan": "颍川陈氏",
    "faction_clan": null,
    "gentry": "yu",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "王基": {
    "com": 75,
    "war": 65,
    "int": 82,
    "pol": 78,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 190,
    "deathYear": 261,
    "debutYear": 222,
    "birthplace": "东莱曲城",
    "clan": null,
    "faction_clan": null,
    "gentry": "qing",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "刘备": {
    "com": 82,
    "war": 72,
    "int": 78,
    "pol": 92,
    "cha": 96,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 161,
    "deathYear": 223,
    "debutYear": 184,
    "birthplace": "涿郡涿县",
    "clan": "涿郡刘氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "commander",
    "classTagsAll": [
      "commander"
    ],
    "skills": [
      {
        "name": "仁德",
        "type": "被动",
        "icon": "💛",
        "desc": "刘备所在部队撤退判定更宽松（胜率阈值放宽），部队中武将被俘率-15%。（已实装）"
      }
    ],
    "values": [
      "汉室死忠"
    ]
  },
  "关羽": {
    "com": 96,
    "war": 98,
    "int": 74,
    "pol": 62,
    "cha": 88,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 219,
    "debutYear": 184,
    "birthplace": "河东解县",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [
      {
        "name": "武圣",
        "type": "被动",
        "icon": "⚔",
        "desc": "单挑score+15；被动单挑触发率+15%；AI叫阵概率+15%；单挑胜利后敌方额外-10士气。（已实装）"
      }
    ],
    "values": [
      "忠义",
      "汉室死忠"
    ]
  },
  "张飞": {
    "com": 85,
    "war": 97,
    "int": 52,
    "pol": 48,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 221,
    "debutYear": 184,
    "birthplace": "涿郡涿县",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "喝阵",
        "type": "被动",
        "icon": "📯",
        "desc": "张飞在场时，接战前敌方所有squad士气-15。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "诸葛亮": {
    "com": 97,
    "war": 58,
    "int": 100,
    "pol": 96,
    "cha": 94,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "S",
      "siege": "S",
      "naval": "B"
    },
    "birthYear": 181,
    "deathYear": 234,
    "debutYear": 207,
    "birthplace": "琅琊阳都",
    "clan": "琅琊诸葛氏",
    "faction_clan": null,
    "gentry": "qing",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist",
      "minister"
    ],
    "skills": [
      {
        "name": "神算",
        "type": "被动",
        "icon": "🧠",
        "desc": "当官/君主时：①伏击中伏率±10% ②劫营成功率±10% ③火攻成功率+10% ④调粮损耗减半+速度-1旬。（已实装）"
      }
    ],
    "values": [
      "汉室死忠"
    ]
  },
  "赵云": {
    "com": 90,
    "war": 96,
    "int": 76,
    "pol": 68,
    "cha": 82,
    "apt": {
      "cavalry": "S",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 229,
    "debutYear": 191,
    "birthplace": "常山真定",
    "clan": null,
    "faction_clan": "常山",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "取将",
        "type": "被动",
        "icon": "⚔",
        "desc": "被动单挑触发率+15%、单挑score+15、同队武将被俘率-20%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "马超": {
    "com": 88,
    "war": 95,
    "int": 65,
    "pol": 52,
    "cha": 78,
    "apt": {
      "cavalry": "S",
      "light": "B",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 176,
    "deathYear": 222,
    "debutYear": 195,
    "birthplace": "扶风茂陵",
    "clan": "扶风马氏",
    "faction_clan": "凉州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "锦马",
        "type": "被动",
        "icon": "🐎",
        "desc": "马超为主将且主兵种为骑兵时，部队ATK+12%。（已实装）"
      }
    ],
    "values": []
  },
  "黄忠": {
    "com": 82,
    "war": 94,
    "int": 62,
    "pol": 55,
    "cha": 68,
    "apt": {
      "cavalry": "C",
      "light": "A",
      "heavy": "B",
      "archer": "S",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 220,
    "debutYear": 200,
    "birthplace": "南阳宛县",
    "clan": null,
    "faction_clan": "荆州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "老当",
        "type": "被动",
        "icon": "🏹",
        "desc": "黄忠为主将时，每过1年ATK/DEF+1%（上限+10%），老当益壮。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "魏延": {
    "com": 86,
    "war": 92,
    "int": 70,
    "pol": 58,
    "cha": 60,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 234,
    "debutYear": 211,
    "birthplace": "义阳郡",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "反骨",
        "type": "被动",
        "icon": "⚡",
        "desc": "发起进攻时（野战/攻城/攻营）ATK+10%；与鸽派武将亲密度加速下降。（已实装）"
      }
    ],
    "values": [
      "野心"
    ]
  },
  "庞统": {
    "com": 82,
    "war": 52,
    "int": 96,
    "pol": 88,
    "cha": 80,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "B"
    },
    "birthYear": 179,
    "deathYear": 214,
    "debutYear": 209,
    "birthplace": "襄阳",
    "clan": null,
    "faction_clan": null,
    "gentry": "jing",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "凤雏",
        "type": "被动",
        "icon": "🦅",
        "desc": "当官时，同旬连续用计，第2计起成功率+20%，后续依次叠加。（已实装）"
      }
    ],
    "values": []
  },
  "法正": {
    "com": 80,
    "war": 55,
    "int": 95,
    "pol": 86,
    "cha": 76,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 176,
    "deathYear": 220,
    "debutYear": 200,
    "birthplace": "扶风郿县",
    "clan": null,
    "faction_clan": "益州",
    "gentry": "liang",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "睚眦",
        "type": "被动",
        "icon": "🧠",
        "desc": "被攻击时（防守方），所在部队ATK+15%。（已实装）"
      }
    ],
    "values": []
  },
  "廖化": {
    "com": 72,
    "war": 78,
    "int": 60,
    "pol": 55,
    "cha": 58,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 264,
    "debutYear": 211,
    "birthplace": "襄阳中卢",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "马岱": {
    "com": 75,
    "war": 82,
    "int": 65,
    "pol": 55,
    "cha": 62,
    "apt": {
      "cavalry": "S",
      "light": "B",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 211,
    "birthplace": "扶风茂陵",
    "clan": "扶风马氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "斩延",
        "type": "被动",
        "icon": "⚔",
        "desc": "骑兵主将ATK×1.05。（已实装）"
      }
    ],
    "values": []
  },
  "董允": {
    "com": 42,
    "war": 38,
    "int": 78,
    "pol": 85,
    "cha": 75,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 246,
    "debutYear": 221,
    "birthplace": "南郡枝江",
    "clan": "荆州董氏",
    "faction_clan": "荆州",
    "gentry": "jing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "秉公",
        "type": "被动",
        "icon": "⚖",
        "desc": "当官/君主时，武将属性经验成长×1.20。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "张翼": {
    "com": 62,
    "war": 65,
    "int": 68,
    "pol": 70,
    "cha": 58,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 264,
    "debutYear": 211,
    "birthplace": "犍为武阳",
    "clan": "益州张氏",
    "faction_clan": "东州",
    "gentry": "yi",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "吴懿": {
    "com": 68,
    "war": 72,
    "int": 60,
    "pol": 65,
    "cha": 62,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 237,
    "debutYear": 200,
    "birthplace": "陈留",
    "clan": "荆州吴氏",
    "faction_clan": "东州",
    "gentry": "yan",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "马忠": {
    "com": 65,
    "war": 68,
    "int": 72,
    "pol": 68,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 249,
    "debutYear": 222,
    "birthplace": "巴西阆中",
    "clan": "益州马氏",
    "faction_clan": "益州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "霍峻": {
    "com": 60,
    "war": 65,
    "int": 65,
    "pol": 68,
    "cha": 60,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "A",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": 178,
    "deathYear": 217,
    "debutYear": 211,
    "birthplace": "南郡枝江",
    "clan": "荆州霍氏",
    "faction_clan": "荆州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "葭萌",
        "type": "被动",
        "icon": "🏯",
        "desc": "garrison状态时ATK/DEF×1.05。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "黄权": {
    "com": 70,
    "war": 60,
    "int": 80,
    "pol": 75,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 240,
    "debutYear": 200,
    "birthplace": "巴西阆中",
    "clan": "巴西黄氏",
    "faction_clan": "益州",
    "gentry": "yi",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "持节",
        "type": "被动",
        "icon": "📜",
        "desc": "被俘后劝降概率-20%，被挖角概率-20%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "邓芝": {
    "com": 62,
    "war": 58,
    "int": 72,
    "pol": 76,
    "cha": 72,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 178,
    "deathYear": 251,
    "debutYear": 214,
    "birthplace": "义阳新野",
    "clan": "南阳邓氏",
    "faction_clan": "荆州",
    "gentry": "jing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "使吴",
        "type": "被动",
        "icon": "🤝",
        "desc": "当官时，议和/结盟成功率+5%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "严颜": {
    "com": 68,
    "war": 82,
    "int": 58,
    "pol": 55,
    "cha": 65,
    "apt": {
      "cavalry": "C",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 211,
    "birthplace": "巴郡临江",
    "clan": "巴郡严氏",
    "faction_clan": "益州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "关平": {
    "com": 72,
    "war": 82,
    "int": 60,
    "pol": 50,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": 219,
    "debutYear": 200,
    "birthplace": "河东解良",
    "clan": "河东关氏",
    "faction_clan": "荆州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "孝义",
        "type": "被动",
        "icon": "🤝",
        "desc": "与关羽同部队时，关平squad士气+5、ATK+5%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "关兴": {
    "com": 75,
    "war": 85,
    "int": 58,
    "pol": 48,
    "cha": 68,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": 234,
    "debutYear": 215,
    "birthplace": "河东解良",
    "clan": "河东关氏",
    "faction_clan": "荆州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "过关",
        "type": "被动",
        "icon": "⚔",
        "desc": "单挑触发率+5%、score+5（小关羽）。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "张苞": {
    "com": 70,
    "war": 88,
    "int": 45,
    "pol": 38,
    "cha": 60,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 215,
    "birthplace": "涿郡涿县",
    "clan": "涿郡张氏",
    "faction_clan": "元从",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "喝阵",
        "type": "被动",
        "icon": "📣",
        "desc": "开战时敌方全体士气-5（小张飞）。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "刘封": {
    "com": 72,
    "war": 80,
    "int": 55,
    "pol": 42,
    "cha": 52,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "C",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 220,
    "debutYear": 200,
    "birthplace": "长沙罗侯",
    "clan": null,
    "faction_clan": "元从",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "刚愎",
        "type": "被动",
        "icon": "⚡",
        "desc": "单squad unit时ATK/DEF×1.08，忠诚每旬-0.1。（已实装）"
      }
    ],
    "values": [
      "野心"
    ]
  },
  "吴班": {
    "com": 65,
    "war": 72,
    "int": 58,
    "pol": 55,
    "cha": 58,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 215,
    "birthplace": "陈留圉县",
    "clan": "陈留吴氏",
    "faction_clan": "外戚",
    "gentry": "yan",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "马谡": {
    "com": 75,
    "war": 55,
    "int": 86,
    "pol": 68,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 190,
    "deathYear": 228,
    "debutYear": 211,
    "birthplace": "荆州宜城",
    "clan": "荆州马氏",
    "faction_clan": "荆州",
    "gentry": "jing",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [],
    "values": []
  },
  "向宠": {
    "com": 75,
    "war": 78,
    "int": 68,
    "pol": 62,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 240,
    "debutYear": 221,
    "birthplace": "荆州宜城",
    "clan": "荆州向氏",
    "faction_clan": "荆州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "糜竺": {
    "com": 45,
    "war": 30,
    "int": 62,
    "pol": 78,
    "cha": 82,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 221,
    "debutYear": 194,
    "birthplace": "东海朐县",
    "clan": "东海糜氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "糜芳": {
    "com": 55,
    "war": 60,
    "int": 50,
    "pol": 55,
    "cha": 45,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 194,
    "birthplace": "东海朐县",
    "clan": "东海糜氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "投机"
    ]
  },
  "孙乾": {
    "com": 50,
    "war": 32,
    "int": 68,
    "pol": 75,
    "cha": 78,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 215,
    "debutYear": 194,
    "birthplace": "北海",
    "clan": null,
    "faction_clan": null,
    "gentry": "qing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "简雍": {
    "com": 48,
    "war": 28,
    "int": 65,
    "pol": 70,
    "cha": 80,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 184,
    "birthplace": "涿郡涿县",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "夏侯霸": {
    "com": 75,
    "war": 80,
    "int": 62,
    "pol": 55,
    "cha": 60,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 219,
    "birthplace": "沛国谯县",
    "clan": "谯县夏侯氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "孙权": {
    "com": 88,
    "war": 70,
    "int": 84,
    "pol": 90,
    "cha": 88,
    "apt": {
      "cavalry": "C",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": 182,
    "deathYear": 252,
    "debutYear": 200,
    "birthplace": "吴郡富春",
    "clan": "吴郡孙氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "commander",
    "classTagsAll": [
      "commander"
    ],
    "skills": [
      {
        "name": "坐断",
        "type": "被动",
        "icon": "👑",
        "desc": "当官时江东己方城市garrison守城DEF×1.05，江东己方城市豪族+0.15/旬。（已实装）"
      }
    ],
    "values": []
  },
  "周瑜": {
    "com": 95,
    "war": 82,
    "int": 96,
    "pol": 78,
    "cha": 86,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "S"
    },
    "birthYear": 175,
    "deathYear": 210,
    "debutYear": 195,
    "birthplace": "庐江舒县",
    "clan": "庐江周氏",
    "faction_clan": null,
    "gentry": "yang",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [
      {
        "name": "火神",
        "type": "被动",
        "icon": "🔥",
        "desc": "周瑜在场时火攻成功率+20%，火攻伤害×1.3。（已实装）"
      }
    ],
    "values": []
  },
  "甘宁": {
    "com": 82,
    "war": 93,
    "int": 64,
    "pol": 52,
    "cha": 72,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "S"
    },
    "birthYear": null,
    "deathYear": 219,
    "debutYear": 200,
    "birthplace": "巴郡临江",
    "clan": null,
    "faction_clan": "荆州降将",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "锦帆",
        "type": "被动",
        "icon": "⚓",
        "desc": "甘宁所在部队劫营成功率+20%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "鲁肃": {
    "com": 78,
    "war": 56,
    "int": 90,
    "pol": 88,
    "cha": 82,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": 172,
    "deathYear": 217,
    "debutYear": 200,
    "birthplace": null,
    "clan": null,
    "faction_clan": null,
    "gentry": "xu",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "榻策",
        "type": "被动",
        "icon": "📜",
        "desc": "当官时，送礼好感度加成+50%。（已实装）"
      }
    ],
    "values": []
  },
  "吕蒙": {
    "com": 90,
    "war": 88,
    "int": 88,
    "pol": 75,
    "cha": 78,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "A",
      "archer": "B",
      "siege": "A",
      "naval": "S"
    },
    "birthYear": 178,
    "deathYear": 219,
    "debutYear": 195,
    "birthplace": "汝南富陂",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [
      {
        "name": "攻心",
        "type": "被动",
        "icon": "🎭",
        "desc": "吕蒙围城时，该城豪族支持每旬额外-3，加速促成献城。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "陆逊": {
    "com": 94,
    "war": 60,
    "int": 97,
    "pol": 88,
    "cha": 85,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "S"
    },
    "birthYear": 183,
    "deathYear": 245,
    "debutYear": 204,
    "birthplace": "吴郡吴县",
    "clan": "吴郡陆氏",
    "faction_clan": null,
    "gentry": "yang",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [
      {
        "name": "火营",
        "type": "被动",
        "icon": "🔥",
        "desc": "陆逊在攻方时，攻营战守方DEF加成削弱（1.10→1.00），守方士气-5。（已实装）"
      }
    ],
    "values": []
  },
  "黄盖": {
    "com": 78,
    "war": 88,
    "int": 72,
    "pol": 65,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 215,
    "debutYear": 184,
    "birthplace": "零陵泉陵",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "苦肉",
        "type": "被动",
        "icon": "🎭",
        "desc": "squad兵力低于70%时ATK×1.10。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "凌统": {
    "com": 80,
    "war": 90,
    "int": 65,
    "pol": 58,
    "cha": 72,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": 189,
    "deathYear": 217,
    "debutYear": 204,
    "birthplace": "吴郡余杭",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "丁奉": {
    "com": 82,
    "war": 88,
    "int": 72,
    "pol": 60,
    "cha": 68,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 271,
    "debutYear": 225,
    "birthplace": "庐江安丰",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "短兵",
        "type": "被动",
        "icon": "❄",
        "desc": "冬季ATK/DEF×1.10。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "程普": {
    "com": 78,
    "war": 85,
    "int": 68,
    "pol": 62,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 215,
    "debutYear": 184,
    "birthplace": null,
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "虎臣",
        "type": "被动",
        "icon": "🐯",
        "desc": "江东城市作战ATK/DEF×1.10。（已实装）"
      }
    ],
    "values": []
  },
  "朱然": {
    "com": 80,
    "war": 78,
    "int": 75,
    "pol": 68,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "A",
      "naval": "A"
    },
    "birthYear": 182,
    "deathYear": 249,
    "debutYear": 200,
    "birthplace": "丹阳故鄣",
    "clan": "丹阳朱氏",
    "faction_clan": null,
    "gentry": "yang",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "张昭": {
    "com": 40,
    "war": 32,
    "int": 82,
    "pol": 90,
    "cha": 80,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 156,
    "deathYear": 236,
    "debutYear": 194,
    "birthplace": "彭城",
    "clan": "彭城张氏",
    "faction_clan": "流寓",
    "gentry": "xu",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "柱石",
        "type": "被动",
        "icon": "📜",
        "desc": "当官/君主时，势力金产+3%。（已实装）"
      }
    ],
    "values": []
  },
  "诸葛瑾": {
    "com": 55,
    "war": 48,
    "int": 75,
    "pol": 82,
    "cha": 78,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": 174,
    "deathYear": 241,
    "debutYear": 200,
    "birthplace": "琅邪阳都",
    "clan": "琅琊诸葛氏",
    "faction_clan": "流寓",
    "gentry": "qing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "缓颊",
        "type": "被动",
        "icon": "☮",
        "desc": "当官时所有外交行为好感flat+5。（已实装）"
      }
    ],
    "values": []
  },
  "韩当": {
    "com": 62,
    "war": 68,
    "int": 55,
    "pol": 58,
    "cha": 55,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 226,
    "debutYear": 184,
    "birthplace": "辽西令支",
    "clan": "辽西韩氏",
    "faction_clan": "淮泗",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "从征",
        "type": "被动",
        "icon": "⚔",
        "desc": "每胜一仗ATK/DEF+0.5%（上限5%）。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "徐盛": {
    "com": 68,
    "war": 70,
    "int": 65,
    "pol": 62,
    "cha": 60,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 210,
    "birthplace": "琅邪莒县",
    "clan": "琅邪徐氏",
    "faction_clan": "淮泗",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "疑城",
        "type": "被动",
        "icon": "🏯",
        "desc": "守城战时攻城方ATK-5%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "潘璋": {
    "com": 65,
    "war": 72,
    "int": 55,
    "pol": 52,
    "cha": 50,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 234,
    "debutYear": 200,
    "birthplace": "东郡发干",
    "clan": "兖州潘氏",
    "faction_clan": "淮泗",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "擒将",
        "type": "被动",
        "icon": "⚡",
        "desc": "所在部队击败敌军后俘获概率+20%。（已实装）"
      }
    ],
    "values": []
  },
  "贺齐": {
    "com": 72,
    "war": 75,
    "int": 65,
    "pol": 62,
    "cha": 60,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 227,
    "debutYear": 199,
    "birthplace": "会稽山阴",
    "clan": "会稽贺氏",
    "faction_clan": "江东",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "平越",
        "type": "被动",
        "icon": "⚡",
        "desc": "山地/森林战斗时敌方士气-5。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "顾雍": {
    "com": 40,
    "war": 30,
    "int": 78,
    "pol": 88,
    "cha": 82,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": 168,
    "deathYear": 243,
    "debutYear": 200,
    "birthplace": "吴郡吴县",
    "clan": "吴郡顾氏",
    "faction_clan": "江东",
    "gentry": "yang",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": []
  },
  "步骘": {
    "com": 55,
    "war": 48,
    "int": 72,
    "pol": 80,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": 247,
    "debutYear": 200,
    "birthplace": "临淮淮阴",
    "clan": "临淮步氏",
    "faction_clan": "流寓",
    "gentry": "xu",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "安南",
        "type": "被动",
        "icon": "🌏",
        "desc": "当官时南方城市(row≥50)叛乱阈值下调5点。（已实装）"
      }
    ],
    "values": []
  },
  "周泰": {
    "com": 75,
    "war": 90,
    "int": 52,
    "pol": 42,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 193,
    "birthplace": "九江下蔡",
    "clan": "下蔡周氏",
    "faction_clan": "淮泗",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "护主",
        "type": "被动",
        "icon": "🛡",
        "desc": "孙权同部队时全队DEF×1.10，孙权免疫被俘。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "蒋钦": {
    "com": 72,
    "war": 78,
    "int": 62,
    "pol": 60,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 219,
    "debutYear": 193,
    "birthplace": "九江寿春",
    "clan": "寿春蒋氏",
    "faction_clan": "淮泗",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "严整",
        "type": "被动",
        "icon": "⚖",
        "desc": "被伏击时士气惩罚减半。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "全琮": {
    "com": 78,
    "war": 75,
    "int": 72,
    "pol": 70,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": 198,
    "deathYear": 247,
    "debutYear": 219,
    "birthplace": "吴郡钱唐",
    "clan": "钱唐全氏",
    "faction_clan": "江东",
    "gentry": "yang",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "合围",
        "type": "被动",
        "icon": "⚔",
        "desc": "己方参战units≥2时，全琮unit ATK×1.05。（已实装）"
      }
    ],
    "values": []
  },
  "吕范": {
    "com": 70,
    "war": 68,
    "int": 72,
    "pol": 78,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": 228,
    "debutYear": 195,
    "birthplace": "汝南细阳",
    "clan": "细阳吕氏",
    "faction_clan": "淮泗",
    "gentry": null,
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "朱桓": {
    "com": 78,
    "war": 82,
    "int": 68,
    "pol": 55,
    "cha": 62,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "A",
      "archer": "B",
      "siege": "B",
      "naval": "A"
    },
    "birthYear": 176,
    "deathYear": 238,
    "debutYear": 200,
    "birthplace": "吴郡吴县",
    "clan": "吴郡朱氏",
    "faction_clan": null,
    "gentry": "yang",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "骆统": {
    "com": 62,
    "war": 55,
    "int": 72,
    "pol": 78,
    "cha": 70,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "B"
    },
    "birthYear": 193,
    "deathYear": 228,
    "debutYear": 212,
    "birthplace": "会稽乌伤",
    "clan": "会稽骆氏",
    "faction_clan": null,
    "gentry": "yang",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "吕据": {
    "com": 70,
    "war": 72,
    "int": 62,
    "pol": 58,
    "cha": 60,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": 256,
    "debutYear": 232,
    "birthplace": "汝南细阳",
    "clan": "细阳吕氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "留赞": {
    "com": 65,
    "war": 78,
    "int": 52,
    "pol": 48,
    "cha": 55,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 255,
    "debutYear": 220,
    "birthplace": "会稽长山",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "孙尚香": {
    "com": 62,
    "war": 72,
    "int": 58,
    "pol": 55,
    "cha": 75,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "C",
      "archer": "B",
      "siege": "C",
      "naval": "B"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": 209,
    "birthplace": "吴郡富春",
    "clan": "富春孙氏",
    "faction_clan": "孙氏",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "诸葛恪": {
    "com": 78,
    "war": 62,
    "int": 88,
    "pol": 72,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": 203,
    "deathYear": 253,
    "debutYear": 222,
    "birthplace": "琅琊阳都",
    "clan": "琅琊诸葛氏",
    "faction_clan": null,
    "gentry": "qing",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [],
    "values": [
      "野心"
    ]
  },
  "施绩": {
    "com": 72,
    "war": 68,
    "int": 65,
    "pol": 60,
    "cha": 58,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "A"
    },
    "birthYear": null,
    "deathYear": 270,
    "debutYear": 240,
    "birthplace": "丹阳故鄣",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "孟获": {
    "com": 78,
    "war": 88,
    "int": 45,
    "pol": 42,
    "cha": 72,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "建宁",
    "clan": "南蛮孟氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "蛮勇"
    ]
  },
  "祝融": {
    "com": 65,
    "war": 82,
    "int": 58,
    "pol": 38,
    "cha": 70,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "建宁",
    "clan": "南蛮祝氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "蛮勇"
    ]
  },
  "张松": {
    "com": 65,
    "war": 38,
    "int": 90,
    "pol": 82,
    "cha": 55,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "C",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "益州",
    "clan": "益州张氏",
    "faction_clan": null,
    "gentry": "yi",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "献图",
        "type": "被动",
        "icon": "🗺",
        "desc": "当官时细作探报花费减半（800→400金）。（已实装）"
      }
    ],
    "values": [
      "投机"
    ]
  },
  "庞德": {
    "com": 84,
    "war": 94,
    "int": 60,
    "pol": 48,
    "cha": 65,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "南安",
    "clan": "南安庞氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "抬棺",
        "type": "被动",
        "icon": "⚰",
        "desc": "敌总兵力≥己方×3时，庞德squad ATK/DEF×1.20。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "李严": {
    "com": 76,
    "war": 78,
    "int": 72,
    "pol": 70,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "南阳",
    "clan": "荆州李氏",
    "faction_clan": null,
    "gentry": "jing",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "误期",
        "type": "被动",
        "icon": "⚠",
        "desc": "当官时缓解派系孤立(阈值5→3%/10→7%)，调粮损耗×1.20。（已实装）"
      }
    ],
    "values": []
  },
  "邓艾": {
    "com": 88,
    "war": 82,
    "int": 90,
    "pol": 72,
    "cha": 70,
    "apt": {
      "cavalry": "A",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "S",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "义阳棘阳",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [
      {
        "name": "裹毡",
        "type": "被动",
        "icon": "🏔",
        "desc": "山地/丘陵ATK/DEF×1.10，全地形AP消耗×0.85。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "钟会": {
    "com": 85,
    "war": 60,
    "int": 92,
    "pol": 78,
    "cha": 75,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "颍川长社",
    "clan": "颍川钟氏",
    "faction_clan": null,
    "gentry": "yu",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "矜功",
        "type": "被动",
        "icon": "👑",
        "desc": "敌方侦查本部队INT阈值+15；同队亲密度每战-1。（已实装）"
      }
    ],
    "values": [
      "野心"
    ]
  },
  "孟达": {
    "com": 72,
    "war": 75,
    "int": 70,
    "pol": 65,
    "cha": 60,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "扶风",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": [
      "投机"
    ]
  },
  "申耽": {
    "com": 65,
    "war": 72,
    "int": 58,
    "pol": 55,
    "cha": 52,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "B",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "上庸",
    "clan": "上庸申氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "郝昭": {
    "com": 78,
    "war": 82,
    "int": 72,
    "pol": 60,
    "cha": 62,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "S",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "太原",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "拒蜀",
        "type": "被动",
        "icon": "🏯",
        "desc": "守城战守方有郝昭时，城防倍率+0.15。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "张任": {
    "com": 80,
    "war": 85,
    "int": 68,
    "pol": 60,
    "cha": 65,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "益州",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "落凤",
        "type": "被动",
        "icon": "🏹",
        "desc": "设伏方有张任时，中伏率+15%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "杨洪": {
    "com": 68,
    "war": 45,
    "int": 78,
    "pol": 82,
    "cha": 65,
    "apt": {
      "cavalry": "C",
      "light": "C",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "犍为武阳",
    "clan": "蜀地杨氏",
    "faction_clan": null,
    "gentry": "yi",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [],
    "values": []
  },
  "蒋琬": {
    "com": 72,
    "war": 48,
    "int": 80,
    "pol": 85,
    "cha": 72,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "零陵湘乡",
    "clan": "荆州蒋氏",
    "faction_clan": null,
    "gentry": "jing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "稳政",
        "type": "被动",
        "icon": "⚖",
        "desc": "当官/君主时粮产+5%。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "费祎": {
    "com": 70,
    "war": 50,
    "int": 82,
    "pol": 86,
    "cha": 76,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "江夏鄳县",
    "clan": "荆州费氏",
    "faction_clan": null,
    "gentry": "jing",
    "classTag": "minister",
    "classTagsAll": [
      "minister"
    ],
    "skills": [
      {
        "name": "折冲",
        "type": "被动",
        "icon": "🍶",
        "desc": "当官/君主时铁/木产出+5%。（已实装）"
      }
    ],
    "values": []
  },
  "姜维": {
    "com": 92,
    "war": 88,
    "int": 86,
    "pol": 72,
    "cha": 78,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "天水冀县",
    "clan": null,
    "faction_clan": null,
    "gentry": "liang",
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "strategist"
    ],
    "skills": [],
    "values": [
      "汉室死忠"
    ]
  },
  "文鸯": {
    "com": 75,
    "war": 95,
    "int": 55,
    "pol": 42,
    "cha": 60,
    "apt": {
      "cavalry": "S",
      "light": "A",
      "heavy": "B",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "谯郡",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "羊祜": {
    "com": 82,
    "war": 55,
    "int": 88,
    "pol": 90,
    "cha": 85,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "泰山南城",
    "clan": "泰山羊氏",
    "faction_clan": null,
    "gentry": "yan",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "王濬": {
    "com": 80,
    "war": 70,
    "int": 78,
    "pol": 72,
    "cha": 68,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "S"
    },
    "birthYear": null,
    "deathYear": null,
    "debutYear": null,
    "birthplace": "弘农湖县",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [],
    "values": []
  },
  "孙策": {
    "com": 92,
    "war": 94,
    "int": 80,
    "pol": 72,
    "cha": 90,
    "apt": {
      "cavalry": "A",
      "light": "S",
      "heavy": "B",
      "archer": "B",
      "siege": "B",
      "naval": "B"
    },
    "birthYear": 175,
    "deathYear": 200,
    "debutYear": null,
    "birthplace": "吴郡富春",
    "clan": "吴郡孙氏",
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "典韦": {
    "com": 70,
    "war": 100,
    "int": 38,
    "pol": 35,
    "cha": 52,
    "apt": {
      "cavalry": "C",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "C",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 197,
    "debutYear": null,
    "birthplace": "陈留己吾",
    "clan": null,
    "faction_clan": "谯沛",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "恶来",
        "type": "被动",
        "icon": "💪",
        "desc": "单挑score+15；同队武将不会被俘；突围必成功。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "陆抗": {
    "com": 88,
    "war": 78,
    "int": 90,
    "pol": 82,
    "cha": 80,
    "apt": {
      "cavalry": "B",
      "light": "A",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "A"
    },
    "birthYear": 226,
    "deathYear": 274,
    "debutYear": null,
    "birthplace": "吴郡吴县",
    "clan": "吴郡陆氏",
    "faction_clan": "江东",
    "gentry": "yang",
    "classTag": "commander",
    "classTagsAll": [
      "commander",
      "strategist"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "太史慈": {
    "com": 88,
    "war": 95,
    "int": 66,
    "pol": 58,
    "cha": 74,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "B",
      "archer": "A",
      "siege": "C",
      "naval": "B"
    },
    "birthYear": 166,
    "deathYear": 206,
    "debutYear": null,
    "birthplace": "东莱黄县",
    "clan": null,
    "faction_clan": "青州",
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior",
      "commander"
    ],
    "skills": [
      {
        "name": "信义",
        "type": "被动",
        "icon": "🏹",
        "desc": "单挑score+10，胜利后敌方士气-10。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "陈宫": {
    "com": 82,
    "war": 58,
    "int": 92,
    "pol": 78,
    "cha": 76,
    "apt": {
      "cavalry": "B",
      "light": "B",
      "heavy": "B",
      "archer": "A",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 198,
    "debutYear": null,
    "birthplace": "东郡",
    "clan": "东郡陈氏",
    "faction_clan": null,
    "gentry": "yan",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist"
    ],
    "skills": [
      {
        "name": "犄角",
        "type": "被动",
        "icon": "🏴",
        "desc": "己方units≥2时，陈宫unit ATK×1.05。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  },
  "田丰": {
    "com": 80,
    "war": 55,
    "int": 94,
    "pol": 88,
    "cha": 74,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 200,
    "debutYear": null,
    "birthplace": "巨鹿",
    "clan": "冀州田氏",
    "faction_clan": null,
    "gentry": "ji",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist",
      "minister"
    ],
    "skills": [
      {
        "name": "极谏",
        "type": "被动",
        "icon": "📢",
        "desc": "当官时己方情报精度+2（INT阈值降低）。（已实装）"
      }
    ],
    "values": []
  },
  "沮授": {
    "com": 78,
    "war": 50,
    "int": 92,
    "pol": 85,
    "cha": 72,
    "apt": {
      "cavalry": "C",
      "light": "B",
      "heavy": "B",
      "archer": "B",
      "siege": "A",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 200,
    "debutYear": null,
    "birthplace": "广平",
    "clan": "冀州沮氏",
    "faction_clan": null,
    "gentry": "ji",
    "classTag": "strategist",
    "classTagsAll": [
      "strategist",
      "minister"
    ],
    "skills": [],
    "values": [
      "忠义"
    ]
  },
  "高顺": {
    "com": 82,
    "war": 88,
    "int": 68,
    "pol": 55,
    "cha": 62,
    "apt": {
      "cavalry": "B",
      "light": "S",
      "heavy": "A",
      "archer": "C",
      "siege": "B",
      "naval": "C"
    },
    "birthYear": null,
    "deathYear": 198,
    "debutYear": null,
    "birthplace": "未详",
    "clan": null,
    "faction_clan": null,
    "gentry": null,
    "classTag": "warrior",
    "classTagsAll": [
      "warrior"
    ],
    "skills": [
      {
        "name": "陷阵",
        "type": "被动",
        "icon": "💥",
        "desc": "所在部队经验获取×1.50。（已实装）"
      }
    ],
    "values": [
      "忠义"
    ]
  }
  // ═════════════════════════════════════════════════════════════════
  // ★ phase 4-a — 80 个 190 期武将补充 (董卓集团/讨董诸侯心腹/etc)
  //   战力按 KOEI 三国志数值经验 + 史实推理; skills=[] stub (留后续设计)
  //   birthYear/deathYear/debutYear 一律 null (同 GEN_BASE 1a convention)
  // ═════════════════════════════════════════════════════════════════
  ,
  // ── dongzhuo 集团 (10) ──
  "董卓":   { "com":78, "war":88, "int":72, "pol":40, "cha":30, "apt":{"cavalry":"S","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"陇西临洮", "clan":"陇西董氏", "faction_clan":"凉州", "gentry":null, "classTag":"commander", "classTagsAll":["commander","warrior"], "skills":[], "values":["野心","暴主"] },
  "吕布":   { "com":75, "war":100,"int":30, "pol":25, "cha":60, "apt":{"cavalry":"S","light":"S","heavy":"A","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"五原九原", "clan":"五原吕氏", "faction_clan":"并州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机","反复"] },
  "华雄":   { "com":60, "war":85, "int":30, "pol":20, "cha":35, "apt":{"cavalry":"A","light":"A","heavy":"S","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"凉州", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "李傕":   { "com":70, "war":80, "int":60, "pol":40, "cha":30, "apt":{"cavalry":"S","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"北地泥阳", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["野心","暴主"] },
  "郭汜":   { "com":68, "war":78, "int":55, "pol":35, "cha":28, "apt":{"cavalry":"S","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"张掖", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机"] },
  "张济":   { "com":65, "war":75, "int":55, "pol":40, "cha":40, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"武威祖厉", "clan":"武威张氏", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "樊稠":   { "com":62, "war":76, "int":50, "pol":35, "cha":35, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"凉州", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "牛辅":   { "com":55, "war":65, "int":40, "pol":30, "cha":30, "apt":{"cavalry":"A","light":"B","heavy":"B","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"凉州", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "胡轸":   { "com":55, "war":60, "int":45, "pol":30, "cha":28, "apt":{"cavalry":"A","light":"B","heavy":"B","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"凉州", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "徐荣":   { "com":75, "war":75, "int":70, "pol":50, "cha":50, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"辽东玄菟", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"commander", "classTagsAll":["commander","warrior"], "skills":[], "values":["忠义"] },

  // ── yuanshao 集团 (9, 沮授/田丰 已 in) ──
  "袁绍":   { "com":78, "war":60, "int":75, "pol":70, "cha":88, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"汝南汝阳", "clan":"汝南袁氏", "faction_clan":"河北", "gentry":"yu", "classTag":"commander", "classTagsAll":["commander","ruler"], "skills":[], "values":["名门","盟主"] },
  "颜良":   { "com":70, "war":92, "int":35, "pol":30, "cha":60, "apt":{"cavalry":"S","light":"A","heavy":"S","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "文丑":   { "com":68, "war":90, "int":30, "pol":25, "cha":55, "apt":{"cavalry":"S","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "审配":   { "com":70, "war":50, "int":85, "pol":80, "cha":60, "apt":{"cavalry":"B","light":"B","heavy":"A","archer":"A","siege":"S","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"魏郡阴安", "clan":"魏郡审氏", "faction_clan":"河北", "gentry":"ji", "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["忠义"] },
  "逢纪":   { "com":50, "war":45, "int":82, "pol":70, "cha":55, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"南阳", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":[] },
  "许攸":   { "com":50, "war":40, "int":88, "pol":60, "cha":45, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"南阳", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["投机"] },
  "麴义":   { "com":75, "war":85, "int":60, "pol":40, "cha":50, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"S","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"凉州西平", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior","commander"], "skills":[], "values":[] },
  "高览":   { "com":70, "war":82, "int":50, "pol":40, "cha":50, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "淳于琼": { "com":60, "war":70, "int":50, "pol":50, "cha":50, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"颍川", "clan":"", "faction_clan":"河北", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },

  // ── yuanshu 集团 (5) ──
  "袁术":   { "com":60, "war":55, "int":60, "pol":50, "cha":75, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"汝南汝阳", "clan":"汝南袁氏", "faction_clan":"淮南", "gentry":"yu", "classTag":"commander", "classTagsAll":["commander","ruler"], "skills":[], "values":["野心","名门"] },
  "张勋":   { "com":65, "war":75, "int":55, "pol":40, "cha":50, "apt":{"cavalry":"B","light":"A","heavy":"A","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"扬州", "clan":"", "faction_clan":"淮南", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "纪灵":   { "com":68, "war":82, "int":55, "pol":35, "cha":55, "apt":{"cavalry":"A","light":"A","heavy":"S","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"山东", "clan":"", "faction_clan":"淮南", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "桥蕤":   { "com":60, "war":72, "int":50, "pol":40, "cha":50, "apt":{"cavalry":"B","light":"A","heavy":"A","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"扬州", "clan":"", "faction_clan":"淮南", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "雷薄":   { "com":55, "war":68, "int":45, "pol":35, "cha":45, "apt":{"cavalry":"B","light":"A","heavy":"B","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"扬州", "clan":"", "faction_clan":"淮南", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机"] },

  // ── caocao 集团补 (3) ──
  "卫兹":   { "com":60, "war":60, "int":65, "pol":70, "cha":70, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"陈留襄邑", "clan":"陈留卫氏", "faction_clan":"中原", "gentry":"yu", "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["忠义"] },
  "鲍信":   { "com":70, "war":70, "int":65, "pol":65, "cha":75, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"泰山平阳", "clan":"泰山鲍氏", "faction_clan":"中原", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior","commander"], "skills":[], "values":["忠义"] },
  "戏志才": { "com":55, "war":40, "int":90, "pol":75, "cha":65, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"颍川", "clan":"", "faction_clan":"颍川", "gentry":"yu", "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["忠义"] },

  // ── sunjian 集团 (2) ──
  "孙坚":   { "com":88, "war":92, "int":75, "pol":60, "cha":80, "apt":{"cavalry":"A","light":"S","heavy":"A","archer":"A","siege":"B","naval":"A"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"吴郡富春", "clan":"富春孙氏", "faction_clan":"江东", "gentry":null, "classTag":"commander", "classTagsAll":["commander","warrior","ruler"], "skills":[], "values":["猛虎"] },
  "祖茂":   { "com":65, "war":80, "int":50, "pol":45, "cha":60, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"A"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"吴郡", "clan":"", "faction_clan":"江东", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },

  // ── liubiao 集团 (9) ──
  "刘表":   { "com":65, "war":50, "int":75, "pol":80, "cha":82, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"山阳高平", "clan":"汉室宗亲", "faction_clan":"荆州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","ruler"], "skills":[], "values":["宗室","文治"] },
  "蒯越":   { "com":55, "war":40, "int":90, "pol":88, "cha":75, "apt":{"cavalry":"C","light":"C","heavy":"B","archer":"B","siege":"A","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"南郡中卢", "clan":"南郡蒯氏", "faction_clan":"荆州", "gentry":"jing", "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["忠义"] },
  "蒯良":   { "com":50, "war":35, "int":85, "pol":82, "cha":70, "apt":{"cavalry":"C","light":"C","heavy":"B","archer":"B","siege":"A","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"南郡中卢", "clan":"南郡蒯氏", "faction_clan":"荆州", "gentry":"jing", "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["忠义"] },
  "蔡瑁":   { "com":65, "war":60, "int":60, "pol":55, "cha":55, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"S"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"襄阳", "clan":"襄阳蔡氏", "faction_clan":"荆州", "gentry":"jing", "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机"] },
  "张允":   { "com":55, "war":55, "int":50, "pol":45, "cha":45, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"A"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"襄阳", "clan":"", "faction_clan":"荆州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机"] },
  "王威":   { "com":60, "war":70, "int":55, "pol":45, "cha":50, "apt":{"cavalry":"B","light":"A","heavy":"B","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"荆州", "clan":"", "faction_clan":"荆州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "刘磐":   { "com":70, "war":80, "int":55, "pol":50, "cha":55, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"山阳高平", "clan":"汉室宗亲", "faction_clan":"荆州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "刘琦":   { "com":50, "war":40, "int":55, "pol":60, "cha":65, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"C","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"山阳高平", "clan":"汉室宗亲", "faction_clan":"荆州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":[] },
  "刘琮":   { "com":45, "war":35, "int":50, "pol":55, "cha":60, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"C","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"山阳高平", "clan":"汉室宗亲", "faction_clan":"荆州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["投机"] },

  // ── liuyan 集团 (5) ──
  "刘焉":   { "com":65, "war":50, "int":78, "pol":80, "cha":80, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"江夏竟陵", "clan":"汉室宗亲", "faction_clan":"益州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","ruler"], "skills":[], "values":["宗室"] },
  "刘璋":   { "com":50, "war":40, "int":60, "pol":65, "cha":70, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"江夏竟陵", "clan":"汉室宗亲", "faction_clan":"益州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["仁主"] },
  "王累":   { "com":45, "war":35, "int":75, "pol":70, "cha":65, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"益州", "clan":"", "faction_clan":"益州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["忠义"] },
  "吴兰":   { "com":65, "war":75, "int":50, "pol":40, "cha":50, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"益州", "clan":"", "faction_clan":"益州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "雷铜":   { "com":60, "war":70, "int":45, "pol":40, "cha":45, "apt":{"cavalry":"A","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"益州", "clan":"", "faction_clan":"益州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },

  // ── liuyu 集团 (6) ──
  "刘虞":   { "com":60, "war":40, "int":75, "pol":88, "cha":90, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"东海郯县", "clan":"汉室宗亲", "faction_clan":"幽州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","ruler"], "skills":[], "values":["仁主","宗室"] },
  "鲜于辅": { "com":70, "war":75, "int":65, "pol":60, "cha":65, "apt":{"cavalry":"S","light":"A","heavy":"B","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"渔阳", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "鲜于银": { "com":65, "war":72, "int":55, "pol":50, "cha":55, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"渔阳", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "阎柔":   { "com":75, "war":78, "int":70, "pol":60, "cha":70, "apt":{"cavalry":"S","light":"A","heavy":"B","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"广阳", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior","commander"], "skills":[], "values":[] },
  "齐周":   { "com":55, "war":45, "int":75, "pol":70, "cha":60, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"幽州", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["忠义"] },
  "田畴":   { "com":70, "war":60, "int":85, "pol":80, "cha":80, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"右北平无终", "clan":"无终田氏", "faction_clan":"幽州", "gentry":null, "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["忠义"] },

  // ── gongsunzan 集团 (6) ──
  "公孙瓒": { "com":80, "war":85, "int":60, "pol":50, "cha":70, "apt":{"cavalry":"S","light":"A","heavy":"A","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"辽西令支", "clan":"辽西公孙氏", "faction_clan":"幽州", "gentry":null, "classTag":"commander", "classTagsAll":["commander","warrior","ruler"], "skills":[], "values":["边将"] },
  "严纲":   { "com":65, "war":75, "int":50, "pol":40, "cha":50, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"幽州", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "田楷":   { "com":70, "war":70, "int":65, "pol":60, "cha":65, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"幽州", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"commander", "classTagsAll":["commander","warrior"], "skills":[], "values":["忠义"] },
  "关靖":   { "com":55, "war":50, "int":70, "pol":55, "cha":55, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"幽州", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"strategist", "classTagsAll":["strategist","civilian"], "skills":[], "values":["忠义"] },
  "邹丹":   { "com":60, "war":65, "int":50, "pol":45, "cha":50, "apt":{"cavalry":"A","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"幽州", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "单经":   { "com":55, "war":60, "int":50, "pol":50, "cha":55, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"幽州", "clan":"", "faction_clan":"幽州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },

  // ── taoqian 集团 (5, 糜竺/糜芳/孙乾 已 in) ──
  "陶谦":   { "com":68, "war":60, "int":65, "pol":75, "cha":75, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"丹阳", "clan":"", "faction_clan":"徐州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","ruler"], "skills":[], "values":["老臣"] },
  "曹豹":   { "com":60, "war":70, "int":50, "pol":50, "cha":50, "apt":{"cavalry":"B","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"徐州", "clan":"", "faction_clan":"徐州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "笮融":   { "com":55, "war":60, "int":60, "pol":55, "cha":65, "apt":{"cavalry":"C","light":"B","heavy":"B","archer":"B","siege":"B","naval":"B"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"丹阳", "clan":"", "faction_clan":"徐州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机"] },
  "张闿":   { "com":50, "war":65, "int":45, "pol":35, "cha":40, "apt":{"cavalry":"B","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"徐州", "clan":"", "faction_clan":"徐州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["投机"] },
  "陈登":   { "com":75, "war":65, "int":88, "pol":85, "cha":80, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"A","naval":"A"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"下邳淮浦", "clan":"下邳陈氏", "faction_clan":"徐州", "gentry":"xu", "classTag":"strategist", "classTagsAll":["strategist","commander","civilian"], "skills":[], "values":["忠义"] },

  // ── hanfu 集团 (5) ──
  "韩馥":   { "com":50, "war":40, "int":60, "pol":65, "cha":60, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"颍川", "clan":"", "faction_clan":"冀州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","ruler"], "skills":[], "values":["弱主"] },
  "耿武":   { "com":55, "war":60, "int":65, "pol":60, "cha":60, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"冀州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["忠义"] },
  "闵纯":   { "com":50, "war":55, "int":65, "pol":60, "cha":55, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"冀州", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":["忠义"] },
  "赵浮":   { "com":65, "war":70, "int":55, "pol":50, "cha":55, "apt":{"cavalry":"B","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"冀州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "程奂":   { "com":60, "war":65, "int":50, "pol":45, "cha":50, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"冀州", "clan":"", "faction_clan":"冀州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },

  // ── matenghan 集团 (6, 庞德/马超/马岱 已 in) ──
  "马腾":   { "com":80, "war":88, "int":65, "pol":60, "cha":78, "apt":{"cavalry":"S","light":"A","heavy":"A","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"扶风茂陵", "clan":"扶风马氏", "faction_clan":"凉州", "gentry":null, "classTag":"commander", "classTagsAll":["commander","warrior","ruler"], "skills":[], "values":["忠义"] },
  "韩遂":   { "com":78, "war":70, "int":80, "pol":70, "cha":75, "apt":{"cavalry":"S","light":"A","heavy":"B","archer":"A","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"金城", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"commander", "classTagsAll":["commander","strategist","ruler"], "skills":[], "values":["野心"] },
  "阎行":   { "com":70, "war":88, "int":60, "pol":50, "cha":65, "apt":{"cavalry":"S","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"金城", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "成宜":   { "com":60, "war":75, "int":50, "pol":40, "cha":50, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"凉州", "clan":"", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":[] },
  "马铁":   { "com":55, "war":70, "int":45, "pol":40, "cha":60, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"扶风茂陵", "clan":"扶风马氏", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "马休":   { "com":55, "war":65, "int":45, "pol":40, "cha":55, "apt":{"cavalry":"A","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"扶风茂陵", "clan":"扶风马氏", "faction_clan":"凉州", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },

  // ── kongrong 集团 (3, 太史慈 已 in) ──
  "孔融":   { "com":50, "war":30, "int":78, "pol":75, "cha":88, "apt":{"cavalry":"C","light":"C","heavy":"C","archer":"C","siege":"C","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"鲁国曲阜", "clan":"鲁国孔氏", "faction_clan":"中原", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","ruler"], "skills":[], "values":["名士"] },
  "武安国": { "com":60, "war":80, "int":35, "pol":30, "cha":50, "apt":{"cavalry":"B","light":"A","heavy":"S","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"北海", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },
  "宗宝":   { "com":55, "war":65, "int":40, "pol":35, "cha":45, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"北海", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] },

  // ── 独立诸侯 / 讨董盟军 (6, 陈宫 已 in) ──
  "张邈":   { "com":65, "war":55, "int":70, "pol":70, "cha":75, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"东平寿张", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian","commander"], "skills":[], "values":["投机"] },
  "张超":   { "com":55, "war":50, "int":60, "pol":60, "cha":60, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"东平寿张", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":[] },
  "王匡":   { "com":60, "war":65, "int":55, "pol":55, "cha":60, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"泰山", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior","commander"], "skills":[], "values":[] },
  "桥瑁":   { "com":55, "war":60, "int":60, "pol":55, "cha":55, "apt":{"cavalry":"B","light":"B","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"梁国", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"civilian", "classTagsAll":["civilian"], "skills":[], "values":[] },
  "韩浩":   { "com":70, "war":70, "int":70, "pol":65, "cha":65, "apt":{"cavalry":"B","light":"A","heavy":"A","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"河内", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior","commander"], "skills":[], "values":["忠义"] },
  "史涣":   { "com":65, "war":65, "int":60, "pol":55, "cha":55, "apt":{"cavalry":"B","light":"A","heavy":"B","archer":"B","siege":"B","naval":"C"}, "birthYear":null, "deathYear":null, "debutYear":null, "birthplace":"河内", "clan":"", "faction_clan":"中原", "gentry":null, "classTag":"warrior", "classTagsAll":["warrior"], "skills":[], "values":["忠义"] }
};
