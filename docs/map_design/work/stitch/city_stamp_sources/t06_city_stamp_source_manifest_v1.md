# T06 City Stamp Source Manifest v1

## Identity

- Source family: `t06_city_stamp_source_v1`
- Stage: Stage 6 controlled production pipeline
- Date: 2026-06-10
- Scope: Option A controlled city-stamp art source images only
- Runtime impact: none
- Status: `GENERATED_AUTHOR_REVIEW`

## Purpose

Generate a small controlled set of city-stamp source images for later deterministic compositing tests on `terrain_t06_cc_w_no_city_v2_normalized.png`.

These images are art sources only. They do not decide city count, city position, city class, road graph, final blend, runtime city coordinates, or map promotion.

## Input References

- Terrain base: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Approved nudge proposal: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md`
- Approved city-layer preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview_manifest.md`
- Accepted city stamp / blend test: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test_manifest.md`
- Controlling brief: `docs/map_design/work/tile_plan/stage6_t06_city_stamp_blend_brief_v1.md`

## Required Source Set

| Source class | Intended later use | Required treatment |
|---|---|---|
| `primary_large` | 长安 / 洛阳 | Largest readable walled city source, denser inner blocks, still map-painted rather than UI-icon-like. |
| `standard_city` | 南阳 / 襄阳 / 上庸 / 夷陵 | Medium readable walled city source, simpler than primary, compatible with T06 standard stamp scale. |
| `subdued_context` | 新野 / 汉中 / 陈留 / 官渡 / 许昌 / context | Smaller or lower-contrast source, still readable, suitable for delegated/context marks. |

## Negative Constraints

Any generated output should be marked `REWORK` or `REFERENCE_CAUTION` if it contains:

- labels, text, UI marks, faction colors, banners, flags, soldiers, people, smoke, fire, or dramatic landmark towers;
- random roads or road networks;
- extra villages, temples, forts, passes, docks, hamlets, or city-like exterior settlements;
- rectangular background patches, framed cards, hard shadows, or polluted edges that would make deterministic compositing difficult;
- a perspective, paper tone, line weight, or ink density that is visibly incompatible with the T06 v2 terrain and approved Stage 4 references.

## Guandu Carry-Forward Constraint

官渡 must remain off water in the later deterministic placement/blend pass. This source set must not solve that by changing runtime coordinates or by implying a new city location. 官渡 placement remains a later stamp-local fit / blend constraint using the documented bank/terrace logic.

## Generation Log

Mode: built-in image generation tool.

Default generated-image directory:

- `C:\Users\jie.wang\.codex\generated_images\019eb209-5933-7782-8158-e019cbc57c5a\`

Workspace copies:

| Source class | Workspace file | Size | Author verdict |
|---|---|---:|---|
| `primary_large` | `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_primary_large.png` | `1536 x 1024` | `REFERENCE_CAUTION` |
| `standard_city` | `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_standard_city.png` | `1536 x 1024` | `REFERENCE_CAUTION` |
| `subdued_context` | `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_subdued_context.png` | `1536 x 1024` | `PASS_WITH_NOTES` |

Prompt constraints used for all three:

- single isolated walled city source only;
- low-oblique / low bird's-eye historical strategy-map perspective;
- muted ink-and-watercolor paper style compatible with T06 v2 terrain;
- no labels, flags, faction colors, units, people, smoke, fire, UI, or watermark;
- no random roads, villages, temples, forts, passes, docks, or exterior settlements;
- flat/minimal parchment background with soft irregular paper wash, intended for later masking/cutout.

## Source Reviews

### `primary_large`

File:

- `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_primary_large.png`

Intended later use:

- large primary source for 长安 / 洛阳.

Author verdict: `REFERENCE_CAUTION`.

Positive:

- strong readable outer wall, gates, and dense inner blocks;
- perspective and paper/ink tone are broadly compatible with the T06 v2 terrain direction;
- no labels, banners, faction colors, units, people, smoke, fire, random exterior settlements, or UI marks.

Cautions:

- the inner palace/courtyard mass and corner/gate towers are visually prominent; later use should avoid reading as a special landmark city rather than a generic primary stamp;
- short gate bridge/ramp marks extend outside the wall and must be masked, cropped, or overpainted before deterministic compositing;
- background is parchment, not alpha; later blend must use a non-rectangular mask.

### `standard_city`

File:

- `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_standard_city.png`

Intended later use:

- standard source for 南阳 / 襄阳 / 上庸 / 夷陵.

Author verdict: `REFERENCE_CAUTION`.

Positive:

- clear medium city wall and internal block structure;
- less grand than `primary_large`;
- no labels, banners, faction colors, units, people, smoke, fire, random exterior settlements, or UI marks.

Cautions:

- several gate bridge/ramp marks extend outside the wall and could read as unapproved local roads if pasted directly;
- still has a relatively square engineered wall silhouette, so later compositing should soften the outer mask and avoid UI-icon read;
- background is parchment, not alpha.

### `subdued_context`

File:

- `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_v1_subdued_context.png`

Intended later use:

- subdued/context source for 新野 / 汉中 / 陈留 / 官渡 / 许昌 and other delegated context marks.

Author verdict: `PASS_WITH_NOTES`.

Positive:

- cleanest of the three outputs for the current constraints;
- no obvious exterior roads, road networks, labels, banners, faction colors, units, people, smoke, fire, random villages, temples, forts, docks, or UI marks;
- lower density and smaller visual weight fit delegated/context use.

Cautions:

- still needs mask/cutout because the background is parchment rather than alpha;
- the front gate is visible and should not be allowed to imply a road unless the later deterministic local tie-in approves it;
- for 官渡, this source does not solve off-water placement by itself; the documented bank/terrace fit remains required.

## Next Use Constraints

Before any source is used in a T06 compositing/blend test:

- create non-rectangular masks or cutouts; do not paste full rectangular PNGs;
- remove or hide primary/standard gate bridge/ramp marks unless a later deterministic local tie-in explicitly wants them;
- keep all stamp centers, class sizes, and 官渡 off-water fit controlled by the approved city-layer and blend manifests;
- do not infer any road graph from these source images.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
