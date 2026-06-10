# Stage 6 T06 City Stamp / Blend Brief v1

## Identity

- Planned candidate family: `terrain_t06_cc_w_no_city_v2_city_stamp_blend_*`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Status: `READY_FOR_PRODUCER_REVIEW_BEFORE_GENERATION_OR_COMPOSITING`
- Date: 2026-06-10
- Runtime impact: none

## Purpose

Define the next controlled step after the approved T06 v2 no-city terrain base, approved city-layer nudges, approved deterministic city-layer preview, and accepted limited stamp/blend test.

This brief does not generate art by itself. It sets the rules for either:

- a controlled city-stamp art source test; or
- a manual deterministic compositing/blend test using existing/approved stamp source material.

Do not promote anything to `assets/maps/` and do not modify `src/`.

## Required Inputs

- Terrain base: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Approved nudge proposal: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md`
- Approved city-layer preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview_manifest.md`
- Accepted stamp/blend placeholder test: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test_manifest.md`
- City data source: `src/data/city_base.js`
- Stage 6 pipeline: `docs/map_design/work/tile_plan/stage6_production_pipeline_v1.md`

## Hard Scope

Allowed:

- city-stamp art source testing;
- deterministic stamp placement using approved art-layer positions;
- local paper/ink blend around city stamps;
- local gate-to-ground tie-in hints;
- documentation of any stamp-local fit offset.

Not allowed:

- runtime city-coordinate changes;
- new gameplay data;
- final road graph decisions;
- uncontrolled settlements, villages, forts, temples, labels, faction colors, units, or UI marks;
- random road networks;
- promotion to runtime assets;
- moving a city to rescue wrong terrain.

## City Classes And Ownership

| Class | Cities | Treatment |
|---|---|---|
| Global primary | 长安, 洛阳 | Large primary city stamp source; global/overlap ownership. |
| T06 standard | 南阳, 襄阳, 上庸, 夷陵 | Standard readable city stamp source; main T06 density test. |
| Subdued/context | 新野, 汉中 | Small/subdued mark only; do not promote to strong stamps. |
| Delegated east/south context | 陈留, 官渡, 许昌, 江陵, 武昌 | Neighbor/global context; not T06-owned standard stamps. |
| Ghost context | Other in-margin anchors | Seam/context awareness only; can be omitted from first real stamp art test if clutter rises. |

## Required Art-Layer Positions

Start from the approved city-layer nudge proposal:

| City | Required art-layer delta |
|---|---:|
| 洛阳 | `+36,+64` |
| 襄阳 | `+46,+78` |
| 陈留 | `0,+54` |
| 官渡 | `-8,+54` |
| 许昌 | `0,+46` |
| 夷陵 | `-20,+20` |
| 武昌 | `-16,+18` |
| 江陵 | `0,+22` |

## Guandu Hard Caveat

Producer caveat: 官渡 must not sit on water.

Carry forward from the accepted stamp/blend test:

- 官渡 remains delegated T07/global east-context.
- 官渡 visible stamp may use a stamp-local bank/terrace fit offset from the approved city-layer point.
- Current tested fit offset: `-26,+34`.
- The visible city stamp should read as on a south/southwest bank, terrace, or ferry-context landing area.
- If the terrain makes this impossible without a large displacement, stop and flag a terrain/placement issue.

## Luoyang And Xiangyang Caveats

洛阳:

- must read as Luo/Yiluo context, not Yellow River bank placement;
- local blend should separate the city read from the upper main river band;
- do not enlarge the city stamp until it appears to sit on the northern river.

襄阳:

- must read as Han River / Jingxiang corridor;
- local blend should avoid a mountain-crest placement;
- city footprint should feel like it belongs to a corridor/riverbank pocket, not to the mountain wall.

## Stamp Source Requirements

Any city-stamp art source must satisfy:

- same low-oblique perspective as approved Stage 4 references;
- paper tone compatible with `terrain_t06_cc_w_no_city_v2_normalized.png`;
- city walls and inner blocks readable at T06 scale;
- no labels, banners, faction colors, units, people, smoke plumes, UI icons, or dramatic landmark towers;
- no rectangular patch edges;
- no random extra nearby settlements;
- no road network baked into the stamp source.

Recommended initial stamp source set:

- one primary city source for 长安 / 洛阳;
- one standard city source for 南阳 / 襄阳 / 上庸 / 夷陵;
- one subdued/context source for 新野 / 汉中 / delegated context.

## Blend Pass Requirements

Any blend/compositing pass must:

- keep deterministic stamp centers and documented stamp-local fit offsets;
- use non-rectangular masks;
- blend paper/ink around walls, shadows, and gate edges;
- only add short local ground tie-ins;
- avoid drawing full roads before road graph approval;
- avoid hiding terrain errors with oversized city pads;
- preserve later dynamic overlay readability.

## Review Gates

A candidate produced from this brief must record:

- exact input sources;
- stamp source provenance;
- every city rendered and omitted;
- every art-layer nudge and stamp-local fit;
- whether 官渡 is off water;
- whether 洛阳 reads as Luo/Yiluo rather than Yellow River bank;
- whether 襄阳 reads as Han River / Jingxiang corridor;
- whether any new pseudo-settlement appears;
- whether local tie-ins accidentally imply a road graph;
- runtime isolation result.

## Producer Decision Needed

Before generating or compositing new art, producer should choose the next path:

- `Option A`: create controlled city-stamp art source images first;
- `Option B`: do a manual deterministic compositing test using existing accepted/reference city visuals;
- `Option C`: revise the placeholder stamp/blend geometry before any art-source work.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
