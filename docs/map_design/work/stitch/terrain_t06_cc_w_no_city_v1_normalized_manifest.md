# Terrain T06 CC_W No-City v1 Normalized Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v1_normalized`
- Source candidate id: `terrain_t06_cc_w_no_city_v1`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `REWORK`
- Date: 2026-06-10
- Runtime impact: none

## Files

- Normalized image path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized.png`
- Source image path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1.png`
- Source overlay audit path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_overlay.html`
- Source overlay preview path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_overlay_preview.png`
- City overlay path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized_city_overlay.html`
- City overlay preview path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized_city_overlay.png`
- Brief: `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md`

## Normalization

- Operation: deterministic resize only.
- Source size: `1448 x 1086`
- Target size: `2344 x 1756`
- Actual output size: `2344 x 1756`
- Crop: none.
- AI repaint/edit: none.
- Content movement: uniform scaling to the exact T06 review frame.

Because the source and target aspect ratios are nearly identical, normalization does not materially change terrain/city distribution. It only makes the candidate usable for exact-frame overlay review.

## Gate Review

| Gate | Result | Notes |
|---|---|---|
| Runtime isolation | `PASS` | No `src/` files and no `assets/maps/` files modified. |
| Output frame | `PASS` | Exact `2344 x 1756`. |
| No-city / no-label | `PASS_WITH_NOTES` | No obvious large city stamps, labels, UI, hexes, or faction markers. |
| City reserve / distribution | `REWORK` | City nudging cannot fix the main geography issue because the large river between 长安 and 洛阳 forces the anchor logic into the wrong terrain read. |
| Terrain/geography | `REWORK` | 长安-洛阳 water geometry is wrong: a large main river reads between the two anchors, but the Wei/Yellow River control should be farther north/upper, while Luoyang local Luo/Yi/Yiluo water should be smaller and subordinate. |
| No random road network | `PENDING_PRODUCER_REVIEW_WITH_CAUTION` | Path-like field/route strokes remain visible. Producer noted they do not currently read as villages/settlements, but road-network risk should be reviewed. |
| Jiangdong/wetland avoidance | `PASS_WITH_NOTES` | Lower-right water is strong but remains edge/context. |

## Audit Summary

This candidate is rejected after producer geography review.

City overlay:

- `terrain_t06_cc_w_no_city_v1_normalized_city_overlay.html` projects `CITY_BASE` anchors into the exact `2344 x 1756` normalized frame.
- `terrain_t06_cc_w_no_city_v1_normalized_city_overlay.png` renders the review overlay with 31 T06/context anchors.
- Circle colors follow current ownership/weight classes: global primary, T06 standard, subdued, T07/global context, and other neighbor-owned/context anchors.

Positive signals retained only as style reference:

- The overall art style and terrain richness are close to the desired direction.
- The upper Yellow River / Wei region reads as a northern water control band.
- The center retains usable plain/corridor space for later deterministic city stamps.
- The Qinling/Funiu mountain divide is visually clear.
- Hanzhong/Shangyong/Yiling context reads as mountain/river corridor rather than open plain.

Reject reasons:

- The large river between 长安 and 洛阳 is geographically/strategically wrong for T06.
- City-position adjustment cannot fix this, because the incorrect river hierarchy changes the whole corridor read.
- Ground strokes and field boundaries are denser than ideal and may compete with later deterministic roads.
- Qinling/Funiu may be visually too strong/north-heavy, especially near the Nanyang/Xiangyang corridor.
- Lower-right water should stay edge/context and not become the tile's main identity.

## Producer Geography Rejection 2026-06-10

Producer rejected this candidate because the river between 洛阳 and 长安 is too visually dominant and located in the wrong relationship to the corridor.

Required correction for v2:

- Do not draw a main river running between 长安 and 洛阳.
- Yellow River / Wei River control should sit farther north/upper in the tile.
- Wei River may support the Guanzhong approach, but must not become a large central divider between 长安 and 洛阳.
- Luoyang-area Luo / Yi / Yiluo water should be smaller, local, and subordinate, reading broadly west-east or east-northeast.
- 长安-洛阳 should read primarily as a Guanzhong-Henan corridor / pass route / bounded plain transition, not a route split by a large central river.
- This is a terrain-base rework, not a city-position nudge problem.

## City Placement Audit

This audit judges the normalized terrain against the current projected city anchors. It assumes final city art is still deterministic and may later use approved local nudges or blend pads. If city positions must remain exact hard locks, this candidate is weaker.

### Main T06 / Global Anchors

| City/group | Audit | Decision implication |
|---|---|---|
| 长安 | Acceptable. It sits in an upper-left/central plain-water corridor with enough room for a global-primary overlap stamp. | Keep as global primary overlap. |
| 洛阳 | Acceptable with caution. It is close to the upper river band and top overlap, but that fits a global-primary overlap role better than T06 ownership. | Keep global-primary; allow local blend if stamp feels too close to water. |
| 南阳 | Acceptable. It is in a plain/corridor area and has enough room, though the surrounding terrain texture is busy. | Keep T06 standard. |
| 襄阳 | Awkward. The current anchor lands on or immediately against the strong Qinling/Funiu mountain belt. Historically/visually it should read more like a river/corridor city than a mountain-crest city. | Requires city-layer nudge/blend pad, likely slightly south/southeast into lower corridor space, or v2 should soften/move the mountain belt. |
| 上庸 | Acceptable. Mountain/valley placement is plausible for a difficult corridor anchor. | Keep T06 standard. |
| 夷陵 | Acceptable with caution. It sits by a river/corridor and near strong water, which fits its edge/gorge role, but the city stamp must not read as floating in water. | Keep T06 standard with local shoreline/terrain blend. |

### Downgraded / Context Anchors

| City/group | Audit | Decision implication |
|---|---|---|
| 新野 | Acceptable as subdued. It sits above 南阳 in open terrain but is close enough to remain visually crowded if drawn strongly. | Keep small/subdued or delegate. |
| 汉中 | Acceptable only as west-corridor context. The anchor is in rugged mountain/valley terrain and would feel wrong as a full large T06 stamp. | Keep context/subdued; do not promote to full T06 stamp. |
| 陈留 / 官渡 / 许昌 | Acceptable as T07/global context. They sit in open northeast/east plain context, but their cluster is dense and belongs outside T06 final ownership. | Delegate to T07/global layer. |
| 江陵 / 武昌 / 长沙 / 武陵 | Edge/context only. Several sit close to strong lower-right water systems; this is acceptable for southern/eastern context but should not drive T06 identity. | Delegate to T10/T11/T07/global as planned. |
| 成都 / 雒城 / 梓潼 / 巴中 / 永安 | West/southwest context only. Some anchors sit in rugged or edge terrain; that is acceptable because they are not T06-owned. | Delegate west/southwest. |

### Audit Decision

Do not treat this candidate as "anchor-perfect." Do not advance it as a terrain base. Use it only as a style/material reference for a v2 rework.

## Producer Review Questions

1. v2 must fix the 长安-洛阳 river hierarchy before city placement can be meaningfully reviewed.
2. v2 should suppress path/field-line density further.
3. v2 should soften or move the Qinling/Funiu belt slightly south if it still crowds 襄阳.
4. v2 should keep lower-right Yangtze/Jianghan water as edge context only.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
