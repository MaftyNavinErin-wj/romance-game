// city_base.js
//
// 城市主表(cross-scenario fix,地理 immutable 字段)
// 字段:name/q/r/tags/jun/size/base(产出基数)
// 不进 CITY_BASE 的字段:fac/pop/troops/isCapital(留 SCENARIO_xxx.cities)
// 1a 阶段 45 城; 1f 扩 3 城 河北 (bohai/pingyuan/zhuojun) → 48; 1f-p2 +5 (徐州 xiaopei/donghai + 荆南 wuling + 关陇 shangdang/anding) → 53; 1f-p3 +2 (江东 suzhou + 徐州东北 langya) + bingzhou 上移 r=11→8 → 55
//
// 来源:阶段 1a.1 由 tools/extract_scenario_214.js 自动抽取自 project_romance_v181.html。
// 1a 阶段不被任何 code 引用,仅为后续阶段 1b 的 materializeScenario() 数据源。
// 字段说明见 docs/scenario_system.md §3。

const CITY_BASE = {
  "xuchang": {
    "name": "许昌",
    "q": 54,
    "r": 24,
    "tags": [
      "都市",
      "平原",
      "产铁"
    ],
    "jun": "siyujun",
    "size": "large",
    "base": {
      "food": 480,
      "gold": 131,
      "wood": 60,
      "iron": 110,
      "horses": 5
    }
  },
  "nanyang": {
    "name": "南阳",
    "q": 44,
    "r": 31,
    "tags": [
      "平原"
    ],
    "jun": "siyujun",
    "size": "medium",
    "base": {
      "food": 520,
      "gold": 92,
      "wood": 65,
      "iron": 55,
      "horses": 5
    }
  },
  "xuzhou": {
    "name": "徐州",
    "q": 66,
    "r": 26,
    "tags": [
      "都市",
      "平原"
    ],
    "jun": "siyujun",
    "size": "large",
    "base": {
      "food": 560,
      "gold": 105,
      "wood": 55,
      "iron": 60,
      "horses": 4
    }
  },
  "luoyang": {
    "name": "洛阳",
    "q": 40,
    "r": 20,
    "tags": [
      "都市",
      "平原",
      "产铁"
    ],
    "jun": "heluojun",
    "size": "large",
    "base": {
      "food": 520,
      "gold": 118,
      "wood": 50,
      "iron": 100,
      "horses": 2
    }
  },
  "guandu": {
    "name": "官渡",
    "q": 52,
    "r": 22,
    "tags": [
      "雄关"
    ],
    "jun": "heluojun",
    "size": "small",
    "base": {
      "food": 200,
      "gold": 52,
      "wood": 30,
      "iron": 35,
      "horses": 2
    }
  },
  "hedong": {
    "name": "河东",
    "q": 34,
    "r": 18,
    "tags": [
      "产马",
      "平原"
    ],
    "jun": "heluojun",
    "size": "medium",
    "base": {
      "food": 360,
      "gold": 79,
      "wood": 40,
      "iron": 45,
      "horses": 140
    }
  },
  "ye": {
    "name": "邺城",
    "q": 52,
    "r": 15,
    "tags": [
      "都市",
      "平原",
      "产铁"
    ],
    "jun": "jiqingjun",
    "size": "large",
    "base": {
      "food": 440,
      "gold": 123,
      "wood": 55,
      "iron": 95,
      "horses": 4
    }
  },
  "qingzhou": {
    "name": "青州",
    "q": 66,
    "r": 16,
    "tags": [
      "平原"
    ],
    "jun": "jiqingjun",
    "size": "medium",
    "base": {
      "food": 520,
      "gold": 92,
      "wood": 45,
      "iron": 50,
      "horses": 3
    }
  },
  "youzhou": {
    "name": "蓟城",
    "q": 56,
    "r": 6,
    "tags": [
      "产马",
      "都市"
    ],
    "jun": "jiqingjun",
    "size": "medium",
    "base": {
      "food": 320,
      "gold": 71,
      "wood": 45,
      "iron": 40,
      "horses": 180
    }
  },
  "bingzhou": {
    "name": "晋阳",
    "q": 37,
    "r": 8,
    "tags": [
      "产马"
    ],
    "jun": "xibejun",
    "size": "small",
    "base": {
      "food": 300,
      "gold": 58,
      "wood": 40,
      "iron": 50,
      "horses": 160
    }
  },
  "liangzhou": {
    "name": "姑臧",
    "q": 8,
    "r": 18,
    "tags": [
      "产马",
      "山地"
    ],
    "jun": "xibejun",
    "size": "small",
    "base": {
      "food": 240,
      "gold": 52,
      "wood": 30,
      "iron": 45,
      "horses": 200
    }
  },
  "wuwei": {
    "name": "武威",
    "q": 12,
    "r": 15,
    "tags": [
      "产马"
    ],
    "jun": "xibejun",
    "size": "small",
    "base": {
      "food": 220,
      "gold": 45,
      "wood": 25,
      "iron": 35,
      "horses": 170
    }
  },
  "tianshui": {
    "name": "天水",
    "q": 19,
    "r": 24,
    "tags": [
      "雄关",
      "山地",
      "产铁"
    ],
    "jun": "xibejun",
    "size": "small",
    "base": {
      "food": 230,
      "gold": 54,
      "wood": 35,
      "iron": 80,
      "horses": 5
    }
  },
  "changan": {
    "name": "长安",
    "q": 31,
    "r": 22,
    "tags": [
      "都市",
      "平原"
    ],
    "jun": "xibejun",
    "size": "large",
    "base": {
      "food": 480,
      "gold": 112,
      "wood": 45,
      "iron": 65,
      "horses": 25
    }
  },
  "hanzhong": {
    "name": "汉中",
    "q": 26,
    "r": 31,
    "tags": [
      "雄关",
      "山地"
    ],
    "jun": "hanzhongjun",
    "size": "medium",
    "base": {
      "food": 280,
      "gold": 65,
      "wood": 80,
      "iron": 60,
      "horses": 5
    }
  },
  "chengdu": {
    "name": "成都",
    "q": 20,
    "r": 40,
    "tags": [
      "都市",
      "平原",
      "产马"
    ],
    "jun": "yizhoujun",
    "size": "large",
    "base": {
      "food": 600,
      "gold": 123,
      "wood": 90,
      "iron": 70,
      "horses": 160
    }
  },
  "yizhou_n": {
    "name": "梓潼",
    "q": 24,
    "r": 35,
    "tags": [
      "山地"
    ],
    "jun": "yizhoujun",
    "size": "small",
    "base": {
      "food": 240,
      "gold": 52,
      "wood": 70,
      "iron": 60,
      "horses": 2
    }
  },
  "bazhong": {
    "name": "巴中",
    "q": 27,
    "r": 37,
    "tags": [
      "山地",
      "产木"
    ],
    "jun": "yizhoujun",
    "size": "small",
    "base": {
      "food": 260,
      "gold": 58,
      "wood": 140,
      "iron": 55,
      "horses": 3
    }
  },
  "xiangyang": {
    "name": "襄阳",
    "q": 45,
    "r": 33,
    "tags": [
      "水乡"
    ],
    "jun": "jingzhoujun",
    "size": "medium",
    "base": {
      "food": 320,
      "gold": 86,
      "wood": 60,
      "iron": 50,
      "horses": 5
    }
  },
  "jingzhou": {
    "name": "江陵",
    "q": 47,
    "r": 40,
    "tags": [
      "都市",
      "平原",
      "水乡"
    ],
    "jun": "jingzhoujun",
    "size": "large",
    "base": {
      "food": 560,
      "gold": 110,
      "wood": 75,
      "iron": 55,
      "horses": 2
    }
  },
  "yiling": {
    "name": "夷陵",
    "q": 38,
    "r": 38,
    "tags": [
      "山地",
      "水乡",
      "产木"
    ],
    "jun": "jingzhoujun",
    "size": "small",
    "base": {
      "food": 400,
      "gold": 79,
      "wood": 170,
      "iron": 40,
      "horses": 2
    }
  },
  "jianye": {
    "name": "建业",
    "q": 72,
    "r": 37,
    "tags": [
      "都市",
      "港口",
      "水乡"
    ],
    "jun": "yangzhoujun",
    "size": "large",
    "base": {
      "food": 400,
      "gold": 150,
      "wood": 80,
      "iron": 50,
      "horses": 2
    }
  },
  "jingkou": {
    "name": "京口",
    "q": 84,
    "r": 34,
    "tags": [
      "港口",
      "水乡"
    ],
    "jun": "yangzhoujun",
    "size": "small",
    "base": {
      "food": 280,
      "gold": 105,
      "wood": 60,
      "iron": 30,
      "horses": 2
    }
  },
  "huiji": {
    "name": "会稽",
    "q": 92,
    "r": 43,
    "tags": [
      "港口",
      "水乡"
    ],
    "jun": "yangzhoujun",
    "size": "medium",
    "base": {
      "food": 340,
      "gold": 138,
      "wood": 75,
      "iron": 35,
      "horses": 1
    }
  },
  "wuchang": {
    "name": "武昌",
    "q": 53,
    "r": 40,
    "tags": [
      "都市",
      "港口",
      "水乡",
      "产铁"
    ],
    "jun": "jiaxiajun",
    "size": "large",
    "base": {
      "food": 360,
      "gold": 118,
      "wood": 85,
      "iron": 90,
      "horses": 2
    }
  },
  "chaigang": {
    "name": "柴桑",
    "q": 59,
    "r": 37,
    "tags": [
      "港口",
      "水乡"
    ],
    "jun": "jiaxiajun",
    "size": "medium",
    "base": {
      "food": 320,
      "gold": 123,
      "wood": 70,
      "iron": 40,
      "horses": 1
    }
  },
  "jiaozhou": {
    "name": "交州",
    "q": 43,
    "r": 59,
    "tags": [
      "水乡",
      "产木"
    ],
    "jun": "jiaxiajun",
    "size": "small",
    "base": {
      "food": 360,
      "gold": 92,
      "wood": 150,
      "iron": 30,
      "horses": 1
    }
  },
  "panyu": {
    "name": "番禺",
    "q": 52,
    "r": 62,
    "tags": [
      "港口",
      "水乡"
    ],
    "jun": "jiaxiajun",
    "size": "small",
    "base": {
      "food": 300,
      "gold": 118,
      "wood": 100,
      "iron": 25,
      "horses": 1
    }
  },
  "hefei": {
    "name": "合肥",
    "q": 64,
    "r": 29,
    "tags": [
      "雄关",
      "产铁"
    ],
    "jun": "huainanjun",
    "size": "medium",
    "base": {
      "food": 280,
      "gold": 71,
      "wood": 55,
      "iron": 80,
      "horses": 2
    }
  },
  "shouchun": {
    "name": "寿春",
    "q": 63,
    "r": 28,
    "tags": [
      "都市",
      "平原"
    ],
    "jun": "huainanjun",
    "size": "medium",
    "base": {
      "food": 380,
      "gold": 79,
      "wood": 50,
      "iron": 55,
      "horses": 2
    }
  },
  "jianning": {
    "name": "建宁",
    "q": 16,
    "r": 52,
    "tags": [
      "山地",
      "产木"
    ],
    "jun": "nanzhongjun",
    "size": "small",
    "base": {
      "food": 300,
      "gold": 37,
      "wood": 155,
      "iron": 25,
      "horses": 3
    }
  },
  "yongan": {
    "name": "永安",
    "q": 29,
    "r": 45,
    "tags": [
      "山地"
    ],
    "jun": "yizhoujun",
    "size": "small",
    "base": {
      "food": 280,
      "gold": 52,
      "wood": 75,
      "iron": 40,
      "horses": 2
    }
  },
  "beihai": {
    "name": "北海",
    "q": 76,
    "r": 12,
    "tags": [
      "港口",
      "平原"
    ],
    "jun": "jiqingjun",
    "size": "small",
    "base": {
      "food": 400,
      "gold": 84,
      "wood": 40,
      "iron": 35,
      "horses": 2
    }
  },
  "beiping": {
    "name": "北平",
    "q": 68,
    "r": 7,
    "tags": [
      "产马"
    ],
    "jun": "jiqingjun",
    "size": "small",
    "base": {
      "food": 260,
      "gold": 47,
      "wood": 35,
      "iron": 40,
      "horses": 10
    }
  },
  "guangling": {
    "name": "广陵",
    "q": 82,
    "r": 30,
    "tags": [
      "港口",
      "平原"
    ],
    "jun": "siyujun",
    "size": "medium",
    "base": {
      "food": 420,
      "gold": 97,
      "wood": 50,
      "iron": 40,
      "horses": 2
    }
  },
  "changsha": {
    "name": "长沙",
    "q": 56,
    "r": 49,
    "tags": [
      "平原",
      "水乡"
    ],
    "jun": "jingxiangjun",
    "size": "medium",
    "base": {
      "food": 450,
      "gold": 90,
      "wood": 80,
      "iron": 35,
      "horses": 1
    }
  },
  "yuzhang": {
    "name": "豫章",
    "q": 66,
    "r": 50,
    "tags": [
      "平原",
      "水乡"
    ],
    "jun": "jingxiangjun",
    "size": "medium",
    "base": {
      "food": 400,
      "gold": 84,
      "wood": 70,
      "iron": 30,
      "horses": 1
    }
  },
  "lingling": {
    "name": "零陵",
    "q": 50,
    "r": 55,
    "tags": [
      "水乡",
      "产木"
    ],
    "jun": "jingxiangjun",
    "size": "small",
    "base": {
      "food": 380,
      "gold": 60,
      "wood": 140,
      "iron": 25,
      "horses": 1
    }
  },
  "chenliu": {
    "name": "陈留",
    "q": 54,
    "r": 20,
    "tags": [
      "平原"
    ],
    "jun": "heluojun",
    "size": "medium",
    "base": {
      "food": 480,
      "gold": 97,
      "wood": 45,
      "iron": 55,
      "horses": 3
    }
  },
  "xinye": {
    "name": "新野",
    "q": 44,
    "r": 28,
    "tags": [
      "平原"
    ],
    "jun": "siyujun",
    "size": "small",
    "base": {
      "food": 360,
      "gold": 65,
      "wood": 50,
      "iron": 40,
      "horses": 3
    }
  },
  "puyang": {
    "name": "濮阳",
    "q": 58,
    "r": 18,
    "tags": [
      "平原"
    ],
    "jun": "jiqingjun",
    "size": "medium",
    "base": {
      "food": 440,
      "gold": 86,
      "wood": 40,
      "iron": 50,
      "horses": 3
    }
  },
  "xiapi": {
    "name": "下邳",
    "q": 72,
    "r": 28,
    "tags": [
      "平原"
    ],
    "jun": "siyujun",
    "size": "medium",
    "base": {
      "food": 460,
      "gold": 90,
      "wood": 50,
      "iron": 55,
      "horses": 2
    }
  },
  "shangyong": {
    "name": "上庸",
    "q": 34,
    "r": 34,
    "tags": [
      "山地",
      "雄关"
    ],
    "jun": "jingzhoujun",
    "size": "small",
    "base": {
      "food": 240,
      "gold": 49,
      "wood": 70,
      "iron": 45,
      "horses": 2
    }
  },
  "luocheng": {
    "name": "雒城",
    "q": 21,
    "r": 38,
    "tags": [
      "平原"
    ],
    "jun": "yizhoujun",
    "size": "small",
    "base": {
      "food": 400,
      "gold": 71,
      "wood": 65,
      "iron": 50,
      "horses": 3
    }
  },
  "lujiang": {
    "name": "庐江",
    "q": 66,
    "r": 35,
    "tags": [
      "平原",
      "水乡"
    ],
    "jun": "huainanjun",
    "size": "medium",
    "base": {
      "food": 340,
      "gold": 79,
      "wood": 55,
      "iron": 45,
      "horses": 2
    }
  },
  "bohai": {
    "name": "南皮",
    "q": 64,
    "r": 11,
    "tags": [
      "平原",
      "水乡"
    ],
    "jun": "jiqingjun",
    "size": "medium",
    "base": {
      "food": 280,
      "gold": 80,
      "wood": 45,
      "iron": 30,
      "horses": 4
    }
  },
  "pingyuan": {
    "name": "平原",
    "q": 60,
    "r": 14,
    "tags": [
      "平原"
    ],
    "jun": "jiqingjun",
    "size": "small",
    "base": {
      "food": 280,
      "gold": 60,
      "wood": 35,
      "iron": 35,
      "horses": 3
    }
  },
  "zhuojun": {
    "name": "涿郡",
    "q": 53,
    "r": 8,
    "tags": [
      "平原",
      "产马"
    ],
    "jun": "jiqingjun",
    "size": "small",
    "base": {
      "food": 220,
      "gold": 48,
      "wood": 30,
      "iron": 35,
      "horses": 80
    }
  },
  "xiaopei": {
    "name": "小沛",
    "q": 62,
    "r": 24,
    "tags": [
      "平原"
    ],
    "jun": "siyujun",
    "size": "small",
    "base": {
      "food": 320,
      "gold": 60,
      "wood": 40,
      "iron": 35,
      "horses": 2
    }
  },
  "donghai": {
    "name": "东海",
    "q": 82,
    "r": 27,
    "tags": [
      "平原"
    ],
    "jun": "siyujun",
    "size": "small",
    "base": {
      "food": 300,
      "gold": 55,
      "wood": 35,
      "iron": 35,
      "horses": 2
    }
  },
  "wuling": {
    "name": "武陵",
    "q": 44,
    "r": 47,
    "tags": [
      "水乡",
      "山地"
    ],
    "jun": "jingzhoujun",
    "size": "small",
    "base": {
      "food": 280,
      "gold": 50,
      "wood": 80,
      "iron": 30,
      "horses": 2
    }
  },
  "shangdang": {
    "name": "上党",
    "q": 36,
    "r": 14,
    "tags": [
      "山地",
      "产铁"
    ],
    "jun": "xibejun",
    "size": "small",
    "base": {
      "food": 260,
      "gold": 55,
      "wood": 60,
      "iron": 75,
      "horses": 30
    }
  },
  "anding": {
    "name": "安定",
    "q": 23,
    "r": 20,
    "tags": [
      "山地",
      "产马"
    ],
    "jun": "xibejun",
    "size": "small",
    "base": {
      "food": 220,
      "gold": 45,
      "wood": 30,
      "iron": 35,
      "horses": 100
    }
  },
  "suzhou": {
    "name": "吴郡",
    "q": 90,
    "r": 39,
    "tags": [
      "都市",
      "港口",
      "水乡"
    ],
    "jun": "yangzhoujun",
    "size": "medium",
    "base": {
      "food": 380,
      "gold": 145,
      "wood": 70,
      "iron": 40,
      "horses": 1
    }
  },
  "langya": {
    "name": "琅琊",
    "q": 75,
    "r": 20,
    "tags": [
      "平原"
    ],
    "jun": "siyujun",
    "size": "small",
    "base": {
      "food": 300,
      "gold": 60,
      "wood": 40,
      "iron": 40,
      "horses": 2
    }
  }
};
