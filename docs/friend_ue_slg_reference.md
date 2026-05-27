# 三国 SLG Demo 机制参考说明

这份说明是给 UE 三国 SLG Demo 团队的参考材料。你们的设计文档已经有比较清楚的方向：有主线目标的开放式战役、州郡县治理、角色政治关系、道路粮道、编制化军队、自动和手动战斗共用底层逻辑。

我这边之前做过一个网页三国策略原型，表现和 UI 都比较简单，但很多底层机制已经先跑过一轮。它的价值不是让你们照搬技术栈，而是可以把其中一些系统拆出来，作为你们 UE Demo 的设计参考、简化版本，甚至部分数据结构可以直接照着改。

下面按你们文档里的几个核心方向来整理：每一部分先说“你们要做的是什么”，再说“这边已有机制能提供什么参考”，最后列出 repo 里对应位置。

## 1. 有主线目标的开放式战役

你们的方向不是单纯战斗关卡，而是一个开放式战役 Demo：玩家在一个局部战区里治理、任命、调兵、修路、筹粮、作战，同时被主线目标牵引。

这类 Demo 最容易失控的地方，是系统太多但没有主轴。可以参考这边的处理方式：主线、随机危机、民变、外交变化、战后后果都尽量用“事件系统”承载，而不是散落在不同蓝图或关卡逻辑里。

一个可照搬的事件结构是：

```text
CampaignEvent
  - Trigger: 时间 / 占城 / 缺粮 / 民心 / 某角色状态 / 某场战斗结果
  - Condition: 当前局势是否满足
  - Choices: 玩家可选方案
  - Effects: 改资源、改忠诚、改外交、刷敌军、改地方势力
  - Cooldown / OnceFlag
```

这样主线不是强制线性关卡，而是在开放模拟里不断给玩家目标和压力。比如：

- 攻下关键县城后，敌方援军或地方豪族反应触发。
- 前线断粮后，触发“强征民粮 / 等待转运 / 放弃进攻”的选择。
- 新占地区民心低，触发“安抚 / 镇压 / 任命本地官员”的选择。
- 某武将忠诚低且战败，触发投敌或索要封赏事件。

参考位置：

- `src/data/events.js`：事件定义
- `src/chains/event.js`：事件触发、选择、队列、民变
- `src/core/tick.js`：事件如何进入每个结算周期

## 2. 州郡县治理和资源循环

你们文档里提到州、郡、县、人口、粮食、税赋、徭役、粮食红线、地方豪族。这部分很适合直接借鉴这边的资源闭环思路。

建议第一版不要把每个县都做成完整城市。可以用“城市/郡治作为主节点，县和地方势力作为子结构”的方式，既保留治理深度，又控制工作量。

可以参考或简化照搬的数据形状：

```text
Commandery / City
  - Population
  - FoodStock
  - FoodIncome
  - GoldIncome
  - Stability
  - PopQuality
  - TaxPolicy
  - CorveePolicy
  - Garrison
  - Buildings[]
  - Counties[]

County
  - name
  - type: 县治 / 宗族堡 / 普通县 / 资源点
  - clanFamily
  - localPower
  - loyalty
  - popShare
  - foodModifier
  - recruitModifier
  - defenseModifier
  - rebellionRisk
```

资源关系可以先做成下面这个闭环：

```text
人口 + 土地/建筑 -> 产粮、税收
税率提高 -> 金钱增加 -> 民心下降、人口增长变慢
徭役提高 -> 建设加快 -> 民心下降、人口质量下降
粮食不足 -> 民心下降、人口流失、驻军恢复变慢
民心下降 -> 叛乱风险上升、产出变差
地方势力不满 -> 税收/征兵/防御/叛乱都变差
```

这对你们文档里的“粮食红线”也很适配。可以先简化为：

```text
FoodTurns = FoodStock / MonthlyFoodCost

FoodTurns >= 6: 稳定
FoodTurns 3-5: 轻微压力
FoodTurns 1-2: 民心下降、驻军恢复下降
FoodTurns <= 0: 饥荒、逃亡、叛乱风险
```

可直接参考的变量：

- 人口：影响粮食、税收、兵源。
- 粮食库存：决定能撑多久，影响民心、驻军恢复、断粮。
- 税率：短期增加财政，长期影响民心和人口。
- 徭役：加快建设，但损伤民心和人口质量。
- 建筑：提供产粮、仓储、市场、道路、兵营、防御等修正。
- 地方势力忠诚：影响征税、征兵、防御和叛乱。

参考位置：

- `src/chains/economy.js`：产出、粮食、民心、人口、财政、驻军
- `src/data/state_county.js`：州郡县和地方家族结构
- `src/chains/gentry.js`：地方势力忠诚、修正、占领后变化
- `src/data/constants.js`：税率、徭役、建筑等配置

## 3. 角色、标签、派系和任命治理

你们设计里强调角色不是纯战斗单位，而有地域、阶层、派系、忠诚、利益关系。这部分和这边已有机制非常接近，可以参考角色如何进入治理、外交、战斗和事件。

一个可参考的数据拆法是：

```text
CharacterBase
  - name
  - command / war / int / politics / charisma
  - troopAptitude
  - birthplace
  - clan
  - classTag
  - factionTag
  - values
  - growthCap

CharacterRuntime
  - currentFaction
  - loyalty
  - post
  - merit
  - retainers
  - relations
  - wounded / prisoner state
```

各属性可以这样接入系统：

- 统率：影响部队组织、整体战斗发挥、军队稳定。
- 武力：影响单挑、冲锋、个人战斗事件。
- 智力：影响计谋、伏击、战场判断、外交谋略。
- 政治：影响太守治理、民心恢复、生产效率、建设。
- 魅力：影响招募、忠诚、外交、安抚、俘虏归降。
- 兵种适性：影响将领带某类兵时的发挥。
- 忠诚：影响挖角、投降、执行风险、事件选择。
- 地域/阶层/宗族：影响地方势力态度和任命效果。

任命系统可以先简化成几类：

```text
太守 -> 影响城市治理、民心、地方势力
军职 -> 影响部队战斗、士气、编制
谋士 -> 影响计谋、事件选项、战前判断
朝臣 -> 提出政策方案，影响派系和资源
```

一个很适合 Demo 的简化版本是：

- 每个城市可以任命 1 个太守。
- 太守政治影响产出和民心恢复。
- 太守出身/地域影响地方豪族态度。
- 忠诚低的官员治理效果打折，或触发额外风险。
- 每月由 1-2 个官员提出政策选项，玩家选择后影响资源、忠诚或地方势力。

这能很好地服务你们“君主通过任命和授权治理”的核心设计。

参考位置：

- `src/chains/general.js`：武将成长、忠诚、关系、招募、俘虏、部曲
- `src/chains/politics.js`：官职、任命、朝议、政策提案
- `src/chains/ethos.js`：势力价值倾向变化
- `src/data/general_base.js`：武将基础数据

## 4. 地方士族和权力节点

你们文档里“权力节点”的想法很重要：权力不只来自君主命令，也来自资源控制、地方关系和暴力能力。

这边已有的地方势力系统可以给你们一个简化参考：

```text
LocalPower
  - region
  - clanFamily
  - loyaltyToRuler
  - influence
  - economicModifier
  - recruitModifier
  - defenseModifier
  - rebellionRisk
```

它可以影响：

- 税收效率
- 征兵效率
- 城市防御
- 民心恢复
- 新占地区稳定
- 叛乱概率
- 某些官员任命的接受度

如果要进一步贴近你们设计，可以把“权力来源”拆成三类：

```text
ResourceControl: 控制粮仓、铁、马、商路
ViolenceControl: 私兵、坞堡、守军关系
LegitimacyControl: 士族名望、本地宗族、旧官僚网络
```

第一版不必全部做数值，可以先做成 2-3 个修正：

- `TaxSupport`
- `RecruitSupport`
- `RebellionRisk`

参考位置：

- `src/data/state_county.js`
- `src/chains/gentry.js`
- `src/chains/politics.js`

## 5. 道路、粮道和后勤

你们文档里提到道路等级、粮仓、节点、威胁、粮道生成。这部分非常适合参考这边的补给图思路。

核心不是画一条补给线，而是把补给做成地图图搜索结果：

```text
己方城市 / 粮仓 / 补给节点
  -> 沿道路和地形扩散
  -> 敌军、敌占区、差地形、远距离提高成本
  -> 给每个节点一个补给分数
  -> 部队根据位置判断补给状态
```

可参考的后勤参数：

- 距离：越远越难供。
- 道路等级：官道优于普通路，普通路优于无路。
- 地形：山地、河流、关隘提高成本。
- 控制权：己方区域更容易，敌占区更难。
- 敌军威胁：敌军切入会阻断或提高风险。
- 地方支持：地方势力友好时补给更顺。
- 粮仓库存：有路但没粮也没用。

部队补给状态可以先简化成三档：

```text
Supplied: 正常补给
LowSupply: 士气恢复下降，战斗轻微惩罚
CutOff: 士气下降，逃兵/损耗增加，战斗明显惩罚
```

这样你们很早就能做出“为什么修路、守粮仓、截断道路有意义”。

参考位置：

- `src/chains/military.js`：`buildSupplyMap`、`isUnitSupplied`、`processSupplyStatus`
- `src/core/map.js`：地图节点和寻路

## 6. 部队编制和战斗参数

你们文档里有“部队卡”“编制”“兵种”“装备”“士气”“自动和手动战斗共用底层逻辑”。这边已有战斗核心可以作为规则层参考。

一支部队可以拆成：

```text
Army
  - faction
  - location
  - status: 行军 / 驻扎 / 围城 / 伏击 / 撤退
  - supplyState
  - squads[]

Squad
  - general
  - troopType
  - troops
  - maxTroops
  - morale
  - attack
  - defense
  - aptitude
  - equipment
```

战斗参数及影响方向：

- 兵力：影响输出规模和承伤能力。
- 士气：影响实际发挥、崩溃、撤退、追击。
- 攻击：影响造成损失的能力。
- 防御：影响减少损失的能力。
- 兵种：决定基础攻防、速度、地形适应、克制关系。
- 克制关系：枪/戟克骑，骑对轻步或弓有优势，弓怕近身等。
- 地形：山地、森林、河流、城墙会改变不同兵种表现。
- 将领统率：影响部队整体组织和稳定。
- 将领武力：影响冲锋、单挑、个人战斗事件。
- 将领智力：影响伏击、计谋、识破和战前判断。
- 兵种适性：决定将领带对应兵种的发挥上限。
- 补给：断粮降低士气和战斗力。
- 阵型：影响攻击、防御、速度、被克制风险。
- 疲劳：长距离行军或连续作战后降低发挥。
- 关系协同：亲密或配合好的将领可以有小幅加成。
- 命令：前进、停止、冲锋、撤退改变风险和收益。

一个可照搬的规则层结构是：

```text
BattleContext
  - attackers
  - defenders
  - terrain
  - supplyState
  - moraleState
  - commandModifiers

BattleCore
  - 计算双方攻击/防御
  - 套用兵种克制
  - 套用地形
  - 套用士气、补给、将领、阵型
  - 计算损失、胜负、俘虏、伤亡、经验

BattleReport
  - winner
  - losses
  - moraleChanges
  - captured / wounded / killed
  - reasonLogs
```

对你们 UE 版本来说，重点是：3D 战场可以表现冲锋、阵线、溃退，但胜负和损失最好仍由统一规则层决定。这样自动战斗、手动战斗、AI 预估、战前胜率和战后报告可以共用逻辑。

手动战斗可以这样接：

```text
玩家命令
  -> CommandModifier
  -> BattleCore Step
  -> BattleEventStream
  -> UE 3D 表现
  -> BattleReport 写回战略层
```

参考位置：

- `src/chains/military.js`：`resolveBattle`、`estimateWinRate`、`resolveCampBattle`、`resolveNavalBattle`
- `src/data/constants.js`：兵种、克制、地形、部队上限等配置

## 7. 围城、攻城器械和战后回写

你们文档里提到重点城市才做攻城地图，普通围城可以战略结算。这是很合理的取舍。

这边的经验是：围城不只是战斗表现，而是战略层状态。

围城可以涉及：

- 围城方补给是否持续。
- 守城方粮食还能撑多久。
- 城防和守军规模。
- 是否有攻城器械。
- 城内民心和地方势力态度。
- 援军是否能打通道路。

攻城器械可以先作为临时战斗卡或修正：

```text
Ladder: 降低登城惩罚
Ram: 降低城门/城防加成
SiegeTower: 提高强攻效率
FireAttack: 高风险高收益，影响民心和战后损毁
```

战后需要写回战略层：

- 城市归属
- 守军损失
- 俘虏、伤亡、逃散
- 粮食和装备回收
- 城防损坏
- 民心变化
- 地方势力忠诚变化
- 外交和声望影响
- 主线事件推进

参考位置：

- `src/chains/military.js`：围城、撤退、追击、战斗结果
- `src/chains/gentry.js`：占领后地方势力变化
- `src/chains/diplomacy.js`：占城、声望、外交后果

## 8. 自动战斗和手动战斗共用底层

你们文档里明确提到自动战斗和手动战斗应使用同一套核心逻辑。这个点非常关键。

可以参考的拆法是：

```text
AutoBattle:
  BattleContext -> BattleCore -> BattleReport

ManualBattle:
  BattleContext -> CommandLayer -> BattleCoreStep -> BattleEventStream -> Presentation -> BattleReport
```

区别只在输入和表现：

- 自动战斗：直接用当前部队、地形、士气、补给结算。
- 手动战斗：玩家命令改变若干参数，例如阵型、冲锋时机、撤退风险、接敌距离。
- 最终结果：仍写成统一 `BattleReport`。

这样后续做 AI、战前预估、战后记录、主线触发都会简单很多。

参考位置：

- `src/chains/military.js`
- `src/render/battle_anim.js`
- `src/render/battle_modals.js`

## 9. 数据结构上可以直接借鉴的对象

如果你们要先搭 UE 数据表，可以考虑从这些对象开始：

```text
CharacterBase
CharacterRuntime
FactionRuntime
Commandery
CountyNode
LocalPower
ResourceStock
PolicyState
BuildingInstance
RoadEdge
SupplyNode
ArmyInstance
SquadInstance
TroopType
FormationTemplate
BattleContext
BattleReport
CampaignEvent
```

字段不需要一次写满，但对象边界最好早定。这样 UE 里的 DataTable、Subsystem、SaveGame、战斗层会比较容易对齐。

参考位置：

- `src/data/*`
- `src/data/scenarios/*`
- `src/core/scenario_loader.js`
- `src/core/state.js`

## 10. 推荐的最小 Demo 闭环

结合你们文档和这边已有原型，我觉得第一版可以压成这个范围：

- 一个州或一个局部战区
- 3-5 个主要城市
- 8-12 个县域/资源/道路节点
- 5-8 名核心角色
- 2-3 支部队
- 每月或每旬结算人口、粮食、民心、税赋、建设
- 可以任命太守或军职
- 地方势力影响治理和叛乱
- 粮道影响前线部队
- 一套自动战斗
- 一个简化围城
- 一条主线战役目标

这样能比较快证明核心玩法成立。之后再扩展 3D 手动战斗、更多兵种、更多县域、更多剧情事件。

## 11. 看 repo 的顺序

如果你们有时间看 repo，不用从头读。按机制看会更省时间：

1. 数据和剧本  
   `src/data/*`、`src/data/scenarios/*`、`src/core/scenario_loader.js`、`src/core/main.js`

2. 战略时间推进  
   `src/core/tick.js`

3. 内政和地方势力  
   `src/chains/economy.js`、`src/chains/gentry.js`、`src/data/state_county.js`

4. 角色、任命、政治  
   `src/chains/general.js`、`src/chains/politics.js`、`src/chains/ethos.js`

5. 后勤和战斗  
   `src/chains/military.js`、`src/core/map.js`

6. 事件和主线  
   `src/data/events.js`、`src/chains/event.js`

不需要重点看 UI、DOM、CSS、网页地图渲染。那些和 UE 关系不大。

## 12. 哪些可以照搬，哪些只适合参考

比较适合直接照搬或改写：

- 数据分层思路：基础数据 / 剧本数据 / 运行时数据
- 事件结构：Trigger / Condition / Choices / Effects
- 内政变量关系：人口、粮食、税率、徭役、民心、叛乱
- 地方势力作为治理修正层
- 补给图搜索思路
- BattleContext / BattleCore / BattleReport 结构

适合参考但不建议照搬：

- 具体数值公式
- 网页 UI 和地图表现
- JS 全局状态写法
- 现有自动战斗的所有细节
- 当前项目里的历史兼容代码

最重要的参考点是：你们已经有了很好的设计方向，这个 repo 可以帮你们少走一些机制试错。不是要改变你们的设计，而是给你们提供一些已经跑通过的拆法，让 UE Demo 更快形成稳定闭环。
