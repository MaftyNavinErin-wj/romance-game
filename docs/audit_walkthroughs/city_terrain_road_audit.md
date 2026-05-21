# City / Terrain / Road Audit

Scope: CITY_BASE, ROADS/ROAD_ADJ, final hex terrain, STATE_CITIES/CITY_TO_STATE, COUNTY_DATA, SCENARIO_190, SCENARIO_214.

Cities: 55
Road edges: 111
Road components: 55

Verdict rules: reference/coverage/connectivity/blockage sections are hard checks; terrain tag heuristics and water-touching roads are audit prompts, not automatic defects.

## Road Reference Integrity
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

## Roads Touching River/Water Hexes
- wuchang-changsha: waterLike=9, hex=11, terrain={"plain":2,"river":9}
- bazhong-yiling: waterLike=7, hex=12, terrain={"plain":2,"river":7,"mountain":3}
- jingzhou-yiling: waterLike=7, hex=10, terrain={"plain":3,"river":7}
- xiapi-shouchun: waterLike=6, hex=11, terrain={"plain":5,"river":6}
- lingling-changsha: waterLike=5, hex=10, terrain={"plain":2,"river":5,"mountain":3}
- pingyuan-ye: waterLike=5, hex=9, terrain={"plain":3,"river":5,"hill":1}
- qingzhou-beihai: waterLike=4, hex=11, terrain={"plain":7,"river":4}
- bazhong-chengdu: waterLike=4, hex=9, terrain={"plain":5,"river":4}
- pingyuan-qingzhou: waterLike=4, hex=7, terrain={"plain":3,"river":4}
- jingzhou-wuchang: waterLike=4, hex=7, terrain={"plain":3,"river":4}
- changsha-jiaozhou: waterLike=3, hex=18, terrain={"plain":5,"river":3,"mountain":5,"forest":5}
- ye-bingzhou: waterLike=3, hex=16, terrain={"plain":3,"river":3,"mountain":10}
- xuzhou-guangling: waterLike=3, hex=17, terrain={"plain":12,"hill":2,"river":3}
- bohai-ye: waterLike=3, hex=13, terrain={"plain":7,"forest":3,"river":3}
- shangyong-nanyang: waterLike=3, hex=10, terrain={"plain":5,"river":3,"hill":2}
- beihai-guangling: waterLike=2, hex=22, terrain={"plain":20,"river":2}
- hedong-tianshui: waterLike=2, hex=16, terrain={"plain":12,"hill":2,"river":2}
- chaigang-changsha: waterLike=2, hex=14, terrain={"plain":12,"river":2}
- jianye-jingkou: waterLike=2, hex=13, terrain={"plain":11,"river":2}
- shangyong-xiangyang: waterLike=2, hex=11, terrain={"plain":7,"hill":2,"river":2}
- shangyong-hanzhong: waterLike=2, hex=10, terrain={"plain":8,"river":2}
- changan-luoyang: waterLike=2, hex=10, terrain={"plain":8,"river":2}
- xiangyang-jingzhou: waterLike=2, hex=9, terrain={"plain":6,"hill":1,"river":2}
- anding-changan: waterLike=2, hex=9, terrain={"plain":7,"river":2}
- xiapi-xuzhou: waterLike=2, hex=8, terrain={"plain":4,"river":2,"hill":2}
- bohai-qingzhou: waterLike=2, hex=7, terrain={"plain":4,"forest":1,"river":2}
- jingkou-guangling: waterLike=2, hex=6, terrain={"plain":4,"river":2}
- jingkou-shouchun: waterLike=1, hex=22, terrain={"plain":20,"river":1,"hill":1}
- wuchang-jianye: waterLike=1, hex=20, terrain={"plain":19,"river":1}
- shangdang-ye: waterLike=1, hex=17, terrain={"plain":7,"mountain":6,"forest":2,"hill":1,"river":1}

## Longest Roads
- jianning-jiaozhou: dist=255, hex=28, terrain={"plain":8,"mountain":16,"forest":4}
- hedong-liangzhou: dist=234, hex=27, terrain={"plain":20,"mountain":7}
- jingkou-shouchun: dist=197, hex=22, terrain={"plain":20,"river":1,"hill":1}
- beihai-guangling: dist=195, hex=22, terrain={"plain":20,"river":2}
- xiangyang-hefei: dist=177, hex=20, terrain={"plain":11,"hill":4,"mountain":5}
- wuchang-jianye: dist=175, hex=20, terrain={"plain":19,"river":1}
- bingzhou-youzhou: dist=173, hex=20, terrain={"plain":6,"mountain":14}
- nanyang-hanzhong: dist=162, hex=19, terrain={"plain":19}
- changsha-jiaozhou: dist=160, hex=18, terrain={"plain":5,"river":3,"mountain":5,"forest":5}
- ye-bingzhou: dist=151, hex=16, terrain={"plain":3,"river":3,"mountain":10}

## Distribution Hard Checks
- PASS

## Widest City Spacing
- jianning: nearest=chengdu, dist=123px, hex=13
- yongan: nearest=bazhong, dist=95px, hex=10
- beihai: nearest=langya, dist=89px, hex=9
- langya: nearest=xiapi, dist=85px, hex=9
- jiaozhou: nearest=lingling, dist=78px, hex=8
- lingling: nearest=panyu, dist=75px, hex=8
- panyu: nearest=lingling, dist=75px, hex=8
- changsha: nearest=yuzhang, dist=73px, hex=8
- wuling: nearest=jingzhou, dist=73px, hex=8
- yuzhang: nearest=changsha, dist=73px, hex=8
- xiapi: nearest=xuzhou, dist=68px, hex=7
- chaigang: nearest=wuchang, dist=62px, hex=6

## Sparse Passable Hex Prompts
- q79,r49: nearest=yuzhang, dist=135px, terrain=mountain
- q68,r60: nearest=yuzhang, dist=110px, terrain=forest
- q31,r56: nearest=yongan, dist=105px, terrain=mountain
- q86,r17: nearest=beihai, dist=104px, terrain=plain
- q75,r46: nearest=jianye, dist=102px, terrain=plain
- q75,r52: nearest=yuzhang, dist=102px, terrain=mountain
- q81,r45: nearest=huiji, dist=102px, terrain=mountain
- q87,r10: nearest=beihai, dist=100px, terrain=plain
- q63,r59: nearest=yuzhang, dist=99px, terrain=plain
- q93,r24: nearest=donghai, dist=95px, terrain=plain
- q36,r53: nearest=jiaozhou, dist=92px, terrain=plain
- q83,r5: nearest=beihai, dist=92px, terrain=plain

## Road Network Detour Prompts
- PASS

## Naturally Blocked City Centers Before City Override
- PASS

## Terrain Tag Heuristics
- PASS

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
