# T06 No-City Terrain v2 Geography / City Placement Audit

## Identity

- Candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Stage: Stage 6 controlled production pipeline
- Date: 2026-06-10
- Status: `OPTION_A_APPROVED_FOR_CITY_NUDGE_PROPOSAL`
- Runtime impact: none

## Inputs

- `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_city_overlay.png`
- `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_manifest.md`
- `docs/map_design/work/tile_plan/T06_terrain_geography_collision_audit_v1.md`
- `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md`

Geography references used for this audit:

- Luoyang sits by the Luo River / Yellow River confluence area; old Luoyang is on the north bank of the Luo, not on the Yellow River itself.
- Guandu is near present Zhongmu and near Yellow River ferry/frontline geography, but should not read as a city north of the Yellow River.
- Xiangyang sits on the Han River; old Xiangyang is south of the Han River, with Fancheng north of it.
- Nanyang Basin is part of the Han River / Tangbai River transition zone, flanked by Funiu to the north and opening south/southeast toward Xiangyang/Jianghan.

## Overall Verdict

v2 fixes the v1 blocker: there is no longer a dominant main river splitting 长安 and 洛阳.

However, v2 should not be treated as final anchor-perfect. It is workable if the deterministic city layer may use small local nudges and blend pads. The most important adjustment principle is:

> Keep geography believable first. City anchors may move slightly if a strict projected point lands on a river, mountain crest, or visually wrong side of a major terrain feature.

## Terrain Audit

### Northern Yellow River / Wei Control

Result: `PASS_WITH_NOTES`

- The large river now sits in the upper/northern band, which is a major improvement over v1.
- It can read as Yellow River / Wei control for review purposes.
- It is still visually close to 洛阳 and the northeast cluster; later city placement must keep 洛阳, 官渡, 陈留, and 许昌 visually on the correct side/context of the water.

### Chang'an-Luoyang Corridor

Result: `PASS`

- The center between 长安 and 洛阳 reads as land corridor / bounded plain rather than a river-split geography.
- This makes v2 viable for continued review.

### Luo / Yi / Yiluo Around Luoyang

Result: `PENDING_CITY_LAYER_ADJUSTMENT`

- v2 does not clearly distinguish smaller Luo/Yi/Yiluo water from the upper main river band.
- This is acceptable for a terrain base only if the later city/road layer treats 洛阳 as global overlap and uses local blend to imply a smaller Luoyang-area river context.
- Do not let the city stamp imply 洛阳 is directly on the Yellow River bank.

### Nanyang-Xiangyang / Jingzhou Transition

Result: `PASS_WITH_NUDGE_NOTES`

- 南阳 and 新野 have usable plain/corridor space.
- 襄阳 sits close to the strong mountain belt and lacks an obvious Han River-side city setting at the current projected point.
- Since 襄阳 should read as a Han River / Jingxiang corridor city, the final city layer should nudge or blend it toward a lower/southern river-corridor pocket rather than stamping it on a mountain edge.

### Qinling / Funiu / Daba

Result: `PASS_WITH_NOTES`

- The mountain belt is visually strong and helps create the required north/south divide.
- It may still be slightly too strong or too far north near 襄阳.
- This can be handled by city-layer blend/nudge if producer accepts local city adjustment; otherwise v3 should soften the belt near 襄阳.

### Yangtze / Jianghan Edge

Result: `PASS_WITH_NOTES`

- Lower-right water remains strong, but it stays in the edge/context role.
- 江陵 / 武昌 / 长沙 / 武陵 should remain neighbor/global context and should not drive T06 identity.

## City Placement Recommendations

Directions below refer to the normalized visual frame, not final runtime data.

| City/group | Current read on v2 | Recommendation |
|---|---|---|
| 长安 | Good. It sits below the upper river band in a plausible Guanzhong/corridor space. | Keep projected anchor or allow only tiny visual fit adjustment. |
| 洛阳 | Mostly good, but too close to the upper main river band. It risks reading as Yellow-River-bank city instead of Luo/Yiluo context. | Keep as global primary overlap, but nudge/blend slightly south or south-southeast if the stamp touches the upper river. Add smaller local river/corridor treatment rather than treating the upper river as the city river. |
| 陈留 | East/northeast context; may read too high/north if treated literally. | Delegate to T07/global. If visible here, keep south of the northern main river and subdued. |
| 官渡 | Should be near Yellow River ferry/frontline geography but not read as a north-bank city. | Delegate to T07/global. If shown, place just south/southwest of the northern main river/ferry context, subdued. |
| 许昌 | Should read as south/east plain context, not on the Yellow River. | Delegate to T07/global. If shown, keep clearly south of the main river band. |
| 南阳 | Good enough. It sits in usable plain/corridor space. | Keep T06 standard with local blend. |
| 新野 | Close to 南阳; acceptable only as small/subdued. | Keep small/subdued or omit/delegate if crowding remains. |
| 襄阳 | Main concern. Current projected point is too mountain-edge / mountain-belt adjacent for a Han River city. | Nudge/blend south or southeast toward a river-corridor pocket. If nudge is not allowed, v3 should soften/move the local mountain belt and add clearer Han River corridor space. |
| 上庸 | Good. Mountain/valley corridor read fits the city role. | Keep T06 standard with local blend. |
| 夷陵 | Acceptable with water/gorge caution. | Keep T06 standard, but ensure stamp sits on bank/terrace rather than water. |
| 汉中 | Mountain/valley context only. | Keep subdued/west-corridor context; do not promote. |
| 成都 / 雒城 / 梓潼 / 巴中 / 永安 | West/southwest context only. | Delegate west/southwest. Do not let T06 city layer solve these. |
| 江陵 / 武昌 / 长沙 / 武陵 | South/east context only. | Delegate T10/T11/T07/global; if visible, keep low emphasis. |

## City-Layer Adjustment Policy Proposed

For v2, local city adjustment should be allowed within a small visual correction budget:

- allow small city-stamp nudges when an anchor lands on water, mountain crest, or visibly wrong side of a major terrain feature;
- preserve relative ordering and ownership;
- do not move cities enough to imply different regional ownership;
- record every nudge in the future city-layer manifest;
- prioritize terrain believability over strict projected pixel lock for this art-production layer.

Suggested priority adjustments:

1. 洛阳: slight south/south-southeast blend/nudge if needed to avoid direct upper-river contact.
2. 襄阳: south/southeast blend/nudge toward Han River / corridor read.
3. 官渡 / 陈留 / 许昌: keep south of the northern main river if included in this tile, but preferably delegate to T07/global.
4. 夷陵 / 武昌 / 江陵: use bank/terrace placement, not water placement, if visible as context.

## Decision Options

### Option A: Continue With v2

Use v2 as the no-city terrain base candidate and allow local deterministic city-layer nudges/blend pads.

Best if producer accepts that final art coordinates may move slightly to accommodate terrain.

Producer selected Option A on 2026-06-10.

### Option B: Generate v3

Generate v3 if producer wants a terrain base that needs less city-layer nudge.

v3 target changes:

- keep v2's corrected northern river hierarchy;
- make 洛阳's local Luo/Yiluo setting clearer and less tied to the upper main river;
- create a more obvious Han River / Xiangyang corridor pocket;
- soften or move the mountain belt away from 襄阳;
- reduce field/path line density further.

## Recommendation

Author recommendation: v2 is a reasonable candidate for producer review, but only under Option A. If the producer does not want city-layer nudging, proceed to v3.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
