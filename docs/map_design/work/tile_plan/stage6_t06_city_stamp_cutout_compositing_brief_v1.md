# Stage 6 T06 City Stamp Cutout / Compositing Brief v1

## Identity

- Planned candidate family: `terrain_t06_cc_w_no_city_v2_city_stamp_cutout_composite_*`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Status: `CONTINUED_TO_SOURCE_CUTOUT_PROTOTYPE`
- Date: 2026-06-11
- Runtime impact: none

## Purpose

Define the next controlled Option A step after `t06_city_stamp_source_v1`: convert the three generated city-stamp source images into masked source cutouts or a small deterministic compositing prototype.

This brief does not authorize a full T06 finished image. It also does not authorize runtime promotion, road graph work, AI whole-tile blending, or runtime city-coordinate changes.

## Required Inputs

- Terrain base: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Approved city-layer preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview_manifest.md`
- Accepted placeholder stamp/blend test: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test_manifest.md`
- Stamp source manifest: `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_manifest_v1.md`
- Source images:
  - `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_primary_large.png`
  - `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_standard_city.png`
  - `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_subdued_context.png`
- Controlling brief: `docs/map_design/work/tile_plan/stage6_t06_city_stamp_blend_brief_v1.md`

## Hard Scope

Allowed:

- extract non-rectangular city cutouts from the three approved source images;
- create alpha masks or source-only masked PNGs for later deterministic placement;
- build a small deterministic compositing prototype using approved city-layer positions;
- document every source crop, mask, scale, opacity, and local fit offset.

Not allowed:

- paste any full rectangular source image into T06;
- generate a full finished T06 tile;
- use AI to decide city count, city position, city class, road graph, or blend outcome;
- start road graph production;
- promote any file to `assets/maps/`;
- change `CITY_BASE` or runtime city coordinates;
- modify `src/`.

## Source Use Decision

| Source | Later use | Status | Required handling |
|---|---|---|---|
| `primary_large` | 长安 / 洛阳 source only | `REFERENCE_CAUTION` | Mask to wall footprint plus soft ground wash. Remove or hide the short gate bridge/ramp marks. Tone down inner palace/tower emphasis if it reads like a unique landmark rather than a generic primary city. |
| `standard_city` | 南阳 / 襄阳 / 上庸 / 夷陵 source only | `REFERENCE_CAUTION` | Mask to wall footprint plus soft ground wash. Remove or hide all gate bridge/ramp extensions unless a later deterministic local tie-in explicitly re-adds one. Soften square engineered silhouette during compositing. |
| `subdued_context` | 新野 / 汉中 / 陈留 / 官渡 / 许昌 context source | `PASS_WITH_NOTES` | Use as the cleanest context source after non-rectangular cutout. Preserve low visual weight. Front gate must not imply an unapproved road. |

## Mandatory Mask Rules

- Use non-rectangular masks only.
- Preserve walls, gates, inner blocks, and enough local paper wash for blending.
- Remove or overpaint source-local exterior bridges, ramps, straight approaches, and road-like marks from `primary_large` and `standard_city`.
- Do not carry any source background as a rectangular patch.
- Keep cutout edges feathered enough to avoid visible pasted borders, but not so wide that the city becomes a terrain-covering blob.
- Do not let exterior texture create extra villages, docks, forts, temples, or road nodes.

## Deterministic Placement Rules

Start from the approved art-layer positions in `terrain_t06_cc_w_no_city_v2_city_layer_preview_manifest.md`.

Required deltas:

| City | Delta |
|---|---:|
| 洛阳 | `+36,+64` |
| 襄阳 | `+46,+78` |
| 陈留 | `0,+54` |
| 官渡 | `-8,+54` |
| 许昌 | `0,+46` |
| 夷陵 | `-20,+20` |
| 武昌 | `-16,+18` |
| 江陵 | `0,+22` |

Stamp-local fit:

- 官渡 must use the bank/terrace fit discipline from the accepted placeholder test.
- Current tested visible-stamp fit offset: `-26,+34` from the approved city-layer point.
- 官渡 must read as `官渡岸上`, not as a city sitting in the river.
- This remains art-layer fit only and must not change runtime data.

## Prototype Size Limit

The first compositing prototype should stay small.

Recommended maximum rendered set:

- primary: 长安, 洛阳;
- standard: 南阳, 襄阳, 上庸, 夷陵;
- context: 新野, 汉中, 陈留, 官渡, 许昌.

江陵 / 武昌 / other ghost anchors may remain placeholder-only or omitted if clutter rises. They should not be promoted into stronger T06-owned stamps.

## Review Gates

Any output from this brief must record:

- exact source image used for each city;
- crop rectangle or mask source area;
- output cutout size;
- final scale and opacity;
- every city rendered and omitted;
- every approved nudge and stamp-local fit offset;
- whether all primary/standard gate bridge/ramp extensions were removed;
- whether 官渡 is visibly off water;
- whether 洛阳 reads as Luo/Yiluo context rather than Yellow River bank;
- whether 襄阳 reads as Han River / Jingxiang corridor rather than mountain crest;
- whether any local tie-in implies an unapproved road graph;
- whether any pseudo-settlement or rectangular pasted patch appears;
- runtime isolation result.

## Stop Conditions

Stop and return for producer review if:

- 官渡 cannot be kept off water without a large visual displacement;
- 洛阳 looks like a northern main-river bank city after using the primary source;
- 襄阳 cannot be separated from the mountain wall with local blending;
- source cutouts still read as pasted icons after masking;
- removing gate ramps destroys the source read and requires a new source image.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
