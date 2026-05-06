# Checker 2:triggerFactionEvent caller 覆盖表

> 生成时间:2026-05-06T07:07:30.537Z
> 数据源:`project_romance_v181.html` + `src/**/*.js`
> 服务 D 类:D-048 / D-049 / D-131(v130 重构推广不彻底模式)

## 总览

| eventType | caller 数 | 状态 |
|---|---|---|
| `execute` | 1 | ✓ |
| `defectorPrefect` | 1 | ✓ |
| `conquer` | 1 | ✓ |
| `truce` | 3 | ✓ |
| `warDeclare` | 1 | ⚠️ 已知缺漏 |
| `betray` | 1 | ⚠️ 已知缺漏 |
| `appointPost` | 3 | ✓ |
| `removePost` | 3 | ✓ |

总 caller 数:14 | findings:2

## eventType × caller 详细

### `execute` (1 caller)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| general | `src\chains\general.js:2090` | `killGen` | `triggerFactionEvent('execute', killedFid, {killedFaction: killedMainFac});` |

### `defectorPrefect` (1 caller)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| general | `src\chains\general.js:1727` | `setPrefect` | `triggerFactionEvent('defectorPrefect', cityFac, {});` |

### `conquer` (1 caller)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| military | `src\chains\military.js:5942` | `resolveSiegeBattle` | `if(atkFac && ALL_FACS.includes(atkFac)) triggerFactionEvent('conquer', atkFac, {});` |

### `truce` (3 caller)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| diplomacy | `src\chains\diplomacy.js:273` | `_applyPeaceAgreement` | `if(ALL_FACS.includes(fidA)) triggerFactionEvent('truce', fidA, {});` |
| diplomacy | `src\chains\diplomacy.js:274` | `_applyPeaceAgreement` | `if(ALL_FACS.includes(fidB)) triggerFactionEvent('truce', fidB, {});` |
| diplomacy | `src\chains\diplomacy.js:366` | `diploAlly` | `if(ALL_FACS.includes(G.playerFac)) triggerFactionEvent('truce', G.playerFac, {});` |

### `warDeclare` (1 caller)

> **已知缺漏(D-049 / D-131)**:v181 仅 doEnthrone (politics.js:1028) 调,真正宣战 3 路径全漏
> 期望 caller:玩家 diploWar / aiDoDiplo neutral 分支宣战 / _execDeclareWar

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| politics | `src\chains\politics.js:1028` | `doEnthrone` | `if(f !== fid) triggerFactionEvent('warDeclare', f, {}); // 他国鹰派被激活` |

### `betray` (1 caller)

> **已知缺漏(D-048)**:玩家被罚 AI 不被罚,对称性 bug
> 期望 caller:玩家 diploWar betray / AI 主动背刺 / de facto 宣战背刺(中立战斗)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| diplomacy | `src\chains\diplomacy.js:431` | `diploWar` | `if(ALL_FACS.includes(G.playerFac)) triggerFactionEvent('betray', G.playerFac, {});` |

### `appointPost` (3 caller)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| general | `src\chains\general.js:1731` | `setPrefect` | `if(apFac) triggerFactionEvent('appointPost', cityFac, {appointedFaction: apFac});` |
| general | `src\chains\general.js:1801` | `setStrategist` | `if(apFac) triggerFactionEvent('appointPost', fid, {appointedFaction: apFac});` |
| politics | `src\chains\politics.js:655` | `appointGenPost` | `if(apFac) triggerFactionEvent('appointPost', fid, {appointedFaction:apFac});` |

### `removePost` (3 caller)

| chain | 文件:行 | 所在函数 | snippet |
|---|---|---|---|
| general | `src\chains\general.js:1743` | `setPrefect` | `if(rmFac) triggerFactionEvent('removePost', cityFac, {removedFaction: rmFac});` |
| general | `src\chains\general.js:1810` | `setStrategist` | `if(rmFac) triggerFactionEvent('removePost', fid, {removedFaction: rmFac});` |
| politics | `src\chains\politics.js:672` | `dismissGenPost` | `if(rmFac) triggerFactionEvent('removePost', fid, {removedFaction:rmFac});` |

## findings

共 2 个 finding:

| # | severity | kind | 描述 | 候选 D 类 |
|---|---|---|---|---|
| 1 | HIGH | known_gap | eventType 'warDeclare' 已知缺漏:v181 仅 doEnthrone (politics.js:1028) 调,真正宣战 3 路径全漏;期望 caller:玩家 diploWar / aiDoDiplo neutral 分支宣战 / _execDeclareWar;当前 caller=1 | D-049 / D-131 |
| 2 | HIGH | known_gap | eventType 'betray' 已知缺漏:玩家被罚 AI 不被罚,对称性 bug;期望 caller:玩家 diploWar betray / AI 主动背刺 / de facto 宣战背刺(中立战斗);当前 caller=1 | D-048 |
