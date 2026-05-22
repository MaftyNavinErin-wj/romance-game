# City / Terrain / Road Audit

Scope: CITY_BASE, ROADS/ROAD_ADJ, final hex terrain, STATE_CITIES/CITY_TO_STATE, COUNTY_DATA, SCENARIO_190, SCENARIO_214.

Cities: 55
Road edges: 111
Road components: 55

Verdict rules: reference/coverage/connectivity/blockage/hard-water road sections are hard checks; terrain tag heuristics and river-touching roads are audit prompts, not automatic defects.

## Road Reference Integrity
- PASS

## Road Waypoint Integrity
- PASS

## Road Graph Connectivity
- PASS

## Low Degree Cities
- huiji: degree=1

## High Degree Cities
- hanzhong: degree=6
- hedong: degree=7
- luoyang: degree=7
- nanyang: degree=6
- qingzhou: degree=8
- xuchang: degree=6
- xuzhou: degree=7
- ye: degree=9

## Blocked / Broken Final Road Hexes
- PASS

## Roads Crossing Hard Water Hexes
- PASS

## Roads Touching River Hexes
- tianshui-changan: river=10, hex=13, terrain={"plain":2,"river":10,"mountain":1}
- wuchang-changsha: river=9, hex=11, terrain={"plain":2,"river":9}
- bazhong-yiling: river=7, hex=12, terrain={"plain":2,"river":7,"mountain":3}
- jingzhou-yiling: river=7, hex=10, terrain={"plain":3,"river":7}
- xiapi-shouchun: river=6, hex=11, terrain={"plain":5,"river":6}
- chaigang-yuzhang: river=5, hex=17, terrain={"plain":12,"river":5}
- lingling-changsha: river=5, hex=10, terrain={"plain":2,"river":5,"mountain":3}
- changsha-jiaozhou: river=4, hex=18, terrain={"plain":5,"river":4,"mountain":5,"forest":4}
- xuzhou-guangling: river=4, hex=17, terrain={"plain":11,"hill":2,"river":4}
- donghai-xiapi: river=4, hex=11, terrain={"plain":7,"river":4}
- bazhong-chengdu: river=4, hex=8, terrain={"plain":4,"river":4}
- jingzhou-wuchang: river=4, hex=7, terrain={"plain":3,"river":4}
- beihai-guangling: river=3, hex=22, terrain={"plain":19,"river":3}
- luoyang-xuchang: river=3, hex=15, terrain={"plain":6,"hill":6,"river":3}
- shangyong-nanyang: river=3, hex=10, terrain={"plain":5,"river":3,"hill":2}
- changan-luoyang: river=3, hex=10, terrain={"plain":7,"river":3}
- puyang-qingzhou: river=3, hex=9, terrain={"plain":6,"river":3}
- jianning-jiaozhou: river=2, hex=28, terrain={"plain":8,"mountain":14,"forest":4,"river":2}
- nanyang-hanzhong: river=2, hex=19, terrain={"plain":17,"river":2}
- ye-qingzhou: river=2, hex=15, terrain={"plain":11,"hill":2,"river":2}
- chaigang-changsha: river=2, hex=14, terrain={"plain":12,"river":2}
- luoyang-nanyang: river=2, hex=14, terrain={"plain":10,"mountain":2,"river":2}
- jianye-jingkou: river=2, hex=13, terrain={"plain":11,"river":2}
- shangyong-xiangyang: river=2, hex=11, terrain={"plain":7,"hill":2,"river":2}
- shangyong-hanzhong: river=2, hex=10, terrain={"plain":8,"river":2}
- xiangyang-jingzhou: river=2, hex=9, terrain={"plain":6,"hill":1,"river":2}
- lingling-panyu: river=2, hex=9, terrain={"plain":6,"river":2,"forest":1}
- xiapi-xuzhou: river=2, hex=8, terrain={"plain":4,"river":2,"hill":2}
- hanzhong-yizhou_n: river=2, hex=6, terrain={"plain":2,"river":2,"mountain":2}
- jingkou-guangling: river=2, hex=6, terrain={"plain":4,"river":2}

## Longest Roads
- jianning-jiaozhou: dist=255, hex=28, terrain={"plain":8,"mountain":14,"forest":4,"river":2}
- hedong-liangzhou: dist=234, hex=27, terrain={"plain":20,"mountain":7}
- jingkou-shouchun: dist=197, hex=22, terrain={"plain":20,"river":1,"hill":1}
- beihai-guangling: dist=195, hex=22, terrain={"plain":19,"river":3}
- xiangyang-hefei: dist=177, hex=20, terrain={"plain":11,"hill":4,"mountain":5}
- wuchang-jianye: dist=175, hex=20, terrain={"plain":20}
- bingzhou-youzhou: dist=173, hex=20, terrain={"plain":6,"mountain":14}
- nanyang-hanzhong: dist=162, hex=19, terrain={"plain":17,"river":2}
- changsha-jiaozhou: dist=160, hex=18, terrain={"plain":5,"river":4,"mountain":5,"forest":4}
- ye-bingzhou: dist=151, hex=16, terrain={"plain":3,"hill":2,"mountain":11}

## Distribution Hard Checks
- PASS

## Widest City Spacing
- jianning: nearest=chengdu, dist=130px, hex=14
- yongan: nearest=bazhong, dist=95px, hex=10
- yuzhang: nearest=changsha, dist=91px, hex=10
- beihai: nearest=langya, dist=89px, hex=9
- langya: nearest=xiapi, dist=85px, hex=9
- changsha: nearest=lingling, dist=82px, hex=9
- jiaozhou: nearest=lingling, dist=78px, hex=8
- lingling: nearest=panyu, dist=75px, hex=8
- panyu: nearest=lingling, dist=75px, hex=8
- wuling: nearest=jingzhou, dist=73px, hex=8
- xiapi: nearest=xuzhou, dist=68px, hex=7
- chaigang: nearest=wuchang, dist=62px, hex=6

## Sparse Passable Hex Prompts
- q80,r49: nearest=huiji, dist=125px, terrain=mountain
- q31,r56: nearest=yongan, dist=105px, terrain=mountain
- q64,r60: nearest=yuzhang, dist=105px, terrain=plain
- q86,r17: nearest=beihai, dist=104px, terrain=plain
- q69,r59: nearest=yuzhang, dist=102px, terrain=forest
- q87,r10: nearest=beihai, dist=100px, terrain=plain
- q81,r44: nearest=suzhou, dist=99px, terrain=mountain
- q93,r24: nearest=donghai, dist=95px, terrain=plain
- q36,r53: nearest=jiaozhou, dist=92px, terrain=plain
- q83,r5: nearest=beihai, dist=92px, terrain=plain
- q26,r55: nearest=yongan, dist=92px, terrain=plain
- q76,r52: nearest=yuzhang, dist=92px, terrain=mountain

## Road Network Detour Prompts
- PASS

## Naturally Blocked City Centers Before City Override
- PASS

## Terrain Tag Heuristics
- PASS

## Full City Placement Audit
| city | q,r | natural->final | nearby rough/water | degree | nearest | status |
|---|---:|---|---:|---:|---|---|
| anding / 安定 | 23,20 | plain->plain | 6/49 rough, 4/49 water | 3 | tianshui 55px | OK: center is passable and spacing/road checks are within thresholds. |
| bazhong / 巴中 | 27,37 | plain->plain | 10/49 rough, 7/49 water | 3 | yizhou_n 37px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| beihai / 北海 | 76,12 | plain->plain | 0/49 rough, 9/49 water | 4 | langya 89px | OK: center is passable and spacing/road checks are within thresholds. |
| beiping / 北平 | 68,7 | mountain->plain | 22/49 rough, 0/49 water | 4 | bohai 55px | OK: center is passable and spacing/road checks are within thresholds. |
| bingzhou / 晋阳 | 37,8 | plain->plain | 18/49 rough, 0/49 water | 4 | shangdang 58px | OK: center is passable and spacing/road checks are within thresholds. |
| bohai / 南皮 | 64,11 | forest->plain | 8/49 rough, 1/49 water | 4 | pingyuan 48px | OK: center is passable and spacing/road checks are within thresholds. |
| chaigang / 柴桑 | 59,37 | plain->plain | 0/49 rough, 0/49 water | 5 | wuchang 62px | OK: center is passable and spacing/road checks are within thresholds. |
| changan / 长安 | 31,22 | plain->plain | 20/49 rough, 6/49 water | 5 | hedong 54px | OK: center is passable and spacing/road checks are within thresholds. |
| changsha / 长沙 | 56,49 | hill->plain | 15/49 rough, 7/49 water | 5 | lingling 82px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| chengdu / 成都 | 20,40 | plain->plain | 8/49 rough, 4/49 water | 4 | luocheng 18px | CHANGED: moved one hex east; stays on the Chengdu Basin edge instead of the western mountain texture. |
| chenliu / 陈留 | 54,20 | plain->plain | 5/49 rough, 7/49 water | 5 | guandu 27px | CHANGED: moved east into the Chenliu/Kaifeng plain corridor north of Xuchang. |
| donghai / 东海 | 83,27 | plain->plain | 0/49 rough, 13/49 water | 3 | guangling 27px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| guandu / 官渡 | 52,22 | plain->plain | 14/49 rough, 8/49 water | 4 | chenliu 27px | OK: center is passable and spacing/road checks are within thresholds. |
| guangling / 广陵 | 82,30 | plain->plain | 0/49 rough, 14/49 water | 5 | donghai 27px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| hanzhong / 汉中 | 26,31 | plain->plain | 16/49 rough, 9/49 water | 6 | yizhou_n 45px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| hedong / 河东 | 34,18 | plain->plain | 0/49 rough, 6/49 water | 7 | shangdang 45px | OK: center is passable and spacing/road checks are within thresholds. |
| hefei / 合肥 | 64,29 | hill->plain | 25/49 rough, 6/49 water | 5 | shouchun 10px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| huiji / 会稽 | 92,43 | forest->plain | 0/49 rough, 30/49 water | 1 | suzhou 45px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| jianning / 建宁 | 16,52 | mountain->plain | 28/49 rough, 0/49 water | 3 | chengdu 130px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| jianye / 建业 | 72,37 | plain->plain | 13/49 rough, 10/49 water | 4 | lujiang 58px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| jiaozhou / 交州 | 43,59 | forest->plain | 6/49 rough, 8/49 water | 4 | lingling 78px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| jingkou / 京口 | 84,34 | plain->plain | 0/49 rough, 4/49 water | 4 | guangling 45px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| jingzhou / 江陵 | 47,40 | plain->plain | 2/49 rough, 18/49 water | 4 | wuchang 54px | OK: center is passable and spacing/road checks are within thresholds. |
| langya / 琅琊 | 75,20 | plain->plain | 0/49 rough, 9/49 water | 3 | xiapi 85px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| liangzhou / 姑臧 | 8,18 | mountain->plain | 47/49 rough, 0/49 water | 2 | wuwei 48px | OK: center is passable and spacing/road checks are within thresholds. |
| lingling / 零陵 | 50,55 | plain->plain | 18/49 rough, 3/49 water | 4 | panyu 75px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| lujiang / 庐江 | 66,35 | plain->plain | 2/49 rough, 0/49 water | 3 | jianye 58px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| luocheng / 雒城 | 21,38 | plain->plain | 6/49 rough, 5/49 water | 3 | chengdu 18px | OK: center is passable and spacing/road checks are within thresholds. |
| luoyang / 洛阳 | 40,20 | plain->plain | 6/49 rough, 5/49 water | 7 | hedong 58px | OK: center is passable and spacing/road checks are within thresholds. |
| nanyang / 南阳 | 44,31 | plain->plain | 19/49 rough, 7/49 water | 6 | xiangyang 27px | OK: center is passable and spacing/road checks are within thresholds. |
| panyu / 番禺 | 52,62 | forest->plain | 22/49 rough, 7/49 water | 2 | lingling 75px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| pingyuan / 平原 | 60,14 | plain->plain | 0/49 rough, 3/49 water | 3 | puyang 45px | OK: center is passable and spacing/road checks are within thresholds. |
| puyang / 濮阳 | 58,18 | plain->plain | 0/49 rough, 6/49 water | 3 | chenliu 42px | OK: center is passable and spacing/road checks are within thresholds. |
| qingzhou / 青州 | 66,16 | plain->plain | 0/49 rough, 8/49 water | 8 | bohai 55px | OK: center is passable and spacing/road checks are within thresholds. |
| shangdang / 上党 | 36,14 | plain->plain | 8/49 rough, 0/49 water | 3 | hedong 45px | OK: center is passable and spacing/road checks are within thresholds. |
| shangyong / 上庸 | 35,34 | plain->plain | 12/49 rough, 7/49 water | 3 | yiling 45px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| shouchun / 寿春 | 63,28 | hill->plain | 24/49 rough, 6/49 water | 5 | hefei 10px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| suzhou / 吴郡 | 90,39 | plain->plain | 0/49 rough, 29/49 water | 2 | huiji 45px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| tianshui / 天水 | 19,24 | mountain->plain | 16/49 rough, 4/49 water | 5 | anding 55px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| wuchang / 武昌 | 53,40 | plain->plain | 0/49 rough, 20/49 water | 4 | jingzhou 54px | OK: center is passable and spacing/road checks are within thresholds. |
| wuling / 武陵 | 44,47 | hill->plain | 38/49 rough, 0/49 water | 3 | jingzhou 73px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| wuwei / 武威 | 12,15 | mountain->plain | 29/49 rough, 0/49 water | 2 | liangzhou 48px | OK: center is passable and spacing/road checks are within thresholds. |
| xiangyang / 襄阳 | 45,33 | hill->plain | 17/49 rough, 9/49 water | 5 | nanyang 27px | OK: center is passable and spacing/road checks are within thresholds. |
| xiaopei / 小沛 | 62,24 | plain->plain | 11/49 rough, 0/49 water | 3 | xuzhou 42px | OK: center is passable and spacing/road checks are within thresholds. |
| xiapi / 下邳 | 73,28 | plain->plain | 0/49 rough, 12/49 water | 4 | xuzhou 68px | OK: east/river lowland placement; bitmap darkness is ink/shore texture, not a data mountain enclosure. |
| xinye / 新野 | 44,28 | plain->plain | 16/49 rough, 8/49 water | 2 | nanyang 31px | OK: center is passable and spacing/road checks are within thresholds. |
| xuchang / 许昌 | 54,24 | plain->plain | 7/49 rough, 9/49 water | 6 | guandu 27px | OK: plain center; rough terrain remains southwest, not surrounding the city. |
| xuzhou / 徐州 | 66,26 | hill->plain | 15/49 rough, 6/49 water | 7 | hefei 36px | OK: center is passable and spacing/road checks are within thresholds. |
| ye / 邺城 | 52,15 | hill->plain | 22/49 rough, 0/49 water | 9 | chenliu 55px | OK: center is passable and spacing/road checks are within thresholds. |
| yiling / 夷陵 | 38,38 | mountain->plain | 12/49 rough, 7/49 water | 4 | shangyong 45px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| yizhou_n / 梓潼 | 24,35 | mountain->plain | 21/49 rough, 12/49 water | 3 | bazhong 37px | OK: center is passable and spacing/road checks are within thresholds. |
| yongan / 永安 | 29,46 | plain->plain | 17/49 rough, 0/49 water | 3 | bazhong 95px | ACCEPTED: rough or river-adjacent region matches the real western/southern terrain band. |
| youzhou / 蓟城 | 56,6 | mountain->plain | 21/49 rough, 0/49 water | 4 | zhuojun 37px | OK: center is passable and spacing/road checks are within thresholds. |
| yuzhang / 豫章 | 66,50 | plain->plain | 3/49 rough, 8/49 water | 2 | changsha 91px | CHANGED: moved east toward the Poyang/Nanchang corridor; keeps Changsha spacing within limits. |
| zhuojun / 涿郡 | 53,8 | plain->plain | 16/49 rough, 0/49 water | 3 | youzhou 37px | OK: center is passable and spacing/road checks are within thresholds. |

## State Coverage
- PASS

## County Coverage
- PASS

## Scenario 190 City Coverage
- PASS

## Scenario 190 Capital Notes
- PASS

## Scenario 214 City Coverage
- PASS

## Scenario 214 Capital Notes
- nanman: owned=1, capitals=none allowed by tribal/nomad rule
