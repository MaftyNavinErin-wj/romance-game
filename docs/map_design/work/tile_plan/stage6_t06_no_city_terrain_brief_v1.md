# Stage 6 T06 No-City Terrain Brief v1

## Identity

- Planned candidate id: `terrain_t06_cc_w_no_city_v1`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Status: `APPROVED_FOR_TERRAIN_BASE_GENERATION`
- Date: 2026-06-10
- Runtime impact: none

## Purpose

Generate only the terrain base for `T06_CC_W`.

This is not a finished production tile. It must not contain city stamps, villages, forts, labels, unit marks, UI, or a readable AI-invented road network.

The terrain base exists so later deterministic layers can place:

- city stamps from data-controlled anchors and ownership rules;
- primary roads from the approved road hierarchy;
- pass/ferry/crossing markers only after existing data, approved geography notes, or producer approval define them;
- local blend/paint-over around city gates and route joins.

## Approved Pipeline Rule

Producer approved continuing the controlled Stage 6 approach:

- image generation may own terrain material and broad local blending;
- image generation must not decide city count, city position, city hierarchy, primary roads, pass/ferry placement, or duplicate/missing-city QA;
- city and road layers will be rendered later from deterministic control data.

## Required Inputs

Use these files as control references:

- `docs/map_design/work/tile_plan/control_master_v1.html`
- `docs/map_design/work/tile_plan/T06_control_overlay_v1.html`
- `docs/map_design/work/tile_plan/T06_terrain_geography_collision_audit_v1.md`
- `docs/map_design/work/tile_plan/stage6_production_pipeline_v1.md`
- `docs/map_design/work/tile_plan/stage6_tile_quality_gate_v1.md`
- `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
- `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
- `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`

The representative images define perspective, paper tone, ink density, and material language. They do not override the T06 geography controls below.

Reference role limits:

- `rep_guanzhong_henan_v4.png` is the primary perspective/material reference for this T06 terrain base.
- `rep_bashu_hanzhong_v1.png` is only a material/context reference for mountain-basin and Han River corridor treatment.
- `rep_huaisi_jiangdong_v1.png` is only a material-consistency reference for paper and water rendering. It must not be used as the geography or composition lead for T06, because T06 must not read as Jiangdong wetland/delta terrain.

## Tile Frame

- Concept crop: `334,251,586,439`
- Output target at 4x: `2344 x 1756`
- Neighbor context:
  - North: `T02_NC_W`
  - East: `T07_CC_E`
  - South: `T10_SC_W`
  - West: `T05_WC`
- Diagonal context:
  - `T01_NW`
  - `T03_NC_E`
  - `T09_SW`
  - `T11_SC_E`

Edges must remain overlap-friendly. Do not place a heavy terrain landmark exactly on a hard tile edge unless the control audit requires it.

## Output Frame Gate

The generated candidate must match the tile frame before any city/road/pass composition work:

- exact output size: `2344 x 1756`;
- exact aspect ratio derived from concept crop `586 x 439`;
- no square output, padded output, uncontrolled crop, or shifted composition;
- if the generation tool returns a different size or aspect, mark the candidate `REWORK` before review;
- any resize/crop operation must be documented in the candidate manifest and must preserve the full T06 crop frame.

This gate exists because later city, road, pass/ferry, and blend layers will be placed deterministically over the terrain base. A wrong frame invalidates that alignment.

## Coordinate Caveat

Current control anchors are production-control references, not final aligned map data.

`control_master_v1` and `T06_control_overlay_v1` project the existing runtime map space into the `1672 x 941` planning space. Final Stage 8 data alignment is not performed here. Use the anchors to reserve space and prevent city/road mistakes, but do not treat this terrain base as final coordinate truth.

## City Ownership Context

No city artwork should be generated in this terrain base.

These notes exist only so the terrain composition leaves believable space for later deterministic city stamps:

| Group | Later ownership / weight | Terrain-base implication |
|---|---|---|
| 长安 / 洛阳 | Global city-layer primary stamps appearing in T06 overlap. | Leave readable upper-band terrain space; do not draw city art or city-like marks. |
| 南阳 / 襄阳 | Main T06 center standard anchors. | Keep the central corridor legible and not overfilled with dense marks. |
| 上庸 / 夷陵 | T06 standard corridor anchors. | Preserve mountain/valley transition space. |
| 新野 | Small/subdued or delegated. | Do not create a third strong settlement mark between 南阳 and 襄阳. |
| 汉中 | West-corridor context, not full T06-owned stamp. | Treat as corridor/basin context south of Qinling, not as a large focal city. |
| 陈留 / 官渡 / 许昌 | T07/global ownership or T06 east-overlap context. | Keep east-overlap plain space open for later clipping; no dense city texture. |
| 成都 / 雒城 / 梓潼 / 巴中 / 永安 | West/southwest context. | Keep as terrain continuation only. |
| 江陵 / 武昌 / 长沙 / 武陵 | South/east context. | Do not pull T06 into a Yangtze/Jiangdong water-network read. |

## Later City Stamp Scale Rule

City scale is controlled numerically later, not by this terrain generation.

Producer scale metaphor:

- large / primary city: about "9 inch pizza" visual weight;
- standard / small city: about "5 inch pizza" visual weight;
- edge/context city: may be subdued or clipped, but must not become sesame-dot texture.

For T06 review, current control overlay footprints are only anchor footprints:

- primary control radius: 28 concept px / 112 output px;
- standard control radius: 16 concept px / 64 output px;
- edge/context control radius: 14 concept px / 56 output px.

Final stamps may require larger blended area for walls, gates, shadows, road tie-ins, and paper/ink integration. Use these conservative final-stamp planning radii when judging breathing room:

- primary final-stamp planning radius: 38 concept px / 152 output px;
- standard final-stamp planning radius: 24 concept px / 96 output px;
- edge/context final-stamp planning radius: 18 concept px / 72 output px.

Therefore this no-city terrain base must leave breathing room around the later center anchors and must not pre-fill those areas with pseudo-settlements. High-risk collision groups from the audit remain active review constraints:

- 南阳 / 襄阳;
- 南阳 / 新野;
- 陈留 / 官渡 / 许昌;
- 成都 / 雒城.

## Terrain Geography Controls

T06 should read as a central-west strategic hinge, not as one local basin and not as Jiangdong water-network terrain.

### River Systems

| System | Required read |
|---|---|
| Yellow River / Wei River | Upper/northern control. The Yellow River should read as the main northern water system; Wei supports the Guanzhong approach but should not dominate the whole tile. |
| Luo / Yi / Yiluo | Luoyang-area local water should read broadly west-east or east-northeast toward the Yellow River system. Avoid a dominant north-south river hugging Luoyang. |
| Han River | South-of-Qinling valley/corridor context around Hanzhong-Shangyong. It must not read as a northern Yellow River branch. |
| Yangtze / Jianghan edge | Bottom/southeast context only. It must not turn T06 into a Jiangdong-style wetland or delta tile. |

### Mountain And Plain Systems

| Zone | Required read |
|---|---|
| Qinling | Structural east-west north/south divide. It separates Wei/Yellow River north from Han River south. |
| Funiu | Henan-side Qinling/Funiu edge around the Luoyang-Nanyang corridor. Use as terrain barrier/edge, not as a full Bashu basin wall. |
| Daba / Bashu approach | South/southwest context tied to Han River and west tiles. Keep present but delegated. |
| Guanzhong-Henan bounded plain | Open enough for the corridor, but bounded by river and mountain logic. Avoid one huge flat middle. |
| North China Plain / Henan east overlap | Useful east/northeast context, but not the whole identity of T06. |

## Road Policy For Terrain Base

Do not render the full clipped `ROADS` graph.

The terrain may contain weak field grain, path-like texture, or corridor hints, but no clear AI-owned road network.

Later deterministic road art should follow this hierarchy:

| Corridor | Later road status |
|---|---|
| 长安 - 洛阳 | `KEEP_PRIMARY` |
| 长安 - 汉中 | `KEEP_PRIMARY_OR_SECONDARY` with Qinling/pass-corridor logic |
| 洛阳 - 南阳 | `KEEP_PRIMARY_OR_SECONDARY` with Funiu/Henan south corridor logic |
| 南阳 - 襄阳 | `KEEP_PRIMARY_OR_SECONDARY` |
| 汉中 - 上庸 - 襄阳 | `KEEP_SECONDARY` mountain/valley route |
| 上庸 - 夷陵 / 巴中 - 夷陵 | `CONTEXT_OR_PENDING` |
| 陈留 / 官渡 / 许昌 cluster links | `DELEGATE_T07_OR_CONTEXT` |
| 成都 / 雒城 / 梓潼 / 巴中 local links | `DELEGATE_WEST/SW` |
| 江陵 / 武昌 / 长沙 / 武陵 links | `DELEGATE_SOUTH/EAST` |

## Hard Negative Constraints

The generated terrain base must have:

- no cities;
- no villages;
- no forts;
- no passes or gatehouses;
- no temples;
- no roadside compounds;
- no riverbank hamlets;
- no settlement clusters;
- no labels;
- no text;
- no UI;
- no unit markers;
- no faction colors;
- no hex grid;
- no random road network;
- no decorative landmarks that could be mistaken for future game objects.

## Prompt Draft

```text
Wide low-oblique Chinese ink-and-watercolor terrain map tile, same camera height, paper tone, ink density, river width discipline, field texture, and material language as the approved Project Romance representative map references. T06 central-west terrain base only, crop 334,251,586,439, output 2344x1756. Central-west strategic hinge geography: upper/northern Yellow River and Wei River control, Guanzhong-Henan bounded plain, Luoyang-area Luo/Yi/Yiluo local water reading mostly west-east or east-northeast, central Luoyang-Nanyang-Xiangyang corridor, structural Qinling east-west north/south divide, Funiu foothill edge, south-of-Qinling Han River valley/corridor toward Hanzhong-Shangyong, Daba/Bashu approach as southwest context, Yangtze/Jianghan only as bottom/southeast edge context. Keep terrain rich but not crowded: bounded plains, subdued field texture, sparse tree clusters, foothill bands, riverbanks, paper grain, overlap-friendly edges.

Terrain base only. No cities, no villages, no forts, no passes, no gatehouses, no temples, no roadside compounds, no riverbank hamlets, no settlement clusters, no labels, no text, no UI, no unit markers, no faction colors, no hex grid, no random road network. Do not draw Chang'an, Luoyang, Nanyang, Xiangyang, Xinye, Hanzhong, Chenliu, Guandu, Xuchang, or any other city. Do not create city-like dots or decorative buildings. Do not make a Jiangdong-style wetland/delta tile. Avoid a dominant north-south river hugging Luoyang. Roads and city stamps will be deterministic layers later.
```

## Review Checklist

- Output frame is exactly `2344 x 1756`; wrong size/aspect is `REWORK`.
- Manifest records any resize/crop operation, or explicitly says none was needed.
- Terrain contains zero visible city/village/fort/settlement marks.
- No city-like dot clusters appear where later stamps should go.
- Later city-anchor breathing room respects final-stamp planning radii, not only control circles.
- Yellow River / Wei read as upper/northern control, not central delta.
- Luo/Yi/Yiluo water near Luoyang is subordinate and not a dominant vertical river.
- Qinling is a visible east-west structural divide.
- Funiu reads as Henan-side foothill/barrier logic.
- Han River corridor reads south of Qinling.
- Yangtze/Jianghan remains bottom/southeast context only.
- Edges are overlap-friendly for `T02_NC_W`, `T05_WC`, `T07_CC_E`, and `T10_SC_W`.
- Diagonal context remains plausible for `T01_NW`, `T03_NC_E`, `T09_SW`, and `T11_SC_E`.
- Perspective and material language remain compatible with accepted Stage 4 references.
- Jiangdong reference material does not pull the tile into wetland/delta composition.
- Runtime impact remains none.

## Next Action

Generate `terrain_t06_cc_w_no_city_v1` as a docs-only candidate from this brief and record it in a manifest. Do not promote anything to `assets/maps/` or modify `src/`.
