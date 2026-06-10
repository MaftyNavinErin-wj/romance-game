# T06 v2 City Stamp / Blend Test Manifest

## Identity

- Test id: `terrain_t06_cc_w_no_city_v2_city_stamp_blend_test`
- Base candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Stage: Stage 6 controlled production pipeline
- Verdict: `AUTHOR_REVIEW_READY_FOR_PRODUCER`
- Date: 2026-06-10
- Runtime impact: none

## Files

- Test HTML: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test.html`
- Test PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test.png`
- Base image: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Approved city-layer preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview_manifest.md`

## Purpose

Test whether the approved deterministic city-layer preview can support a limited city-stamp / local blend pass before any final art generation.

This is still not final city art. It uses deterministic SVG pads, wall placeholders, gate hints, and short local tie-ins only. It does not use AI image generation, does not modify runtime data, and does not promote any asset.

## Deterministic Method

- City anchors come from `src/data/city_base.js`.
- Approved art-layer nudges from `terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md` are applied.
- City classes from the approved preview are preserved.
- Local paper/ink blend pads are deterministic SVG ellipses.
- City-stamp placeholders are deterministic SVG polygons/lines.
- Short local gate tie-ins are illustrative only and do not define the road graph.

## Render Verification

- Render tool: local headless Chrome through `playwright-core`.
- PNG output size: `1500 x 1360`.
- SVG viewBox: `0 0 2344 1756`.
- Rendered city/context groups: `31`.
- Stamp-fit callouts: `1` (`官渡岸上`).
- Browser console/page errors: none.
- Visual QA: PASS_WITH_NOTES. 官渡 is explicitly shown with a bank/terrace fit marker and no longer uses the approved city-layer point as the visible stamp center.

## Guandu Water Caveat

Producer caveat: 官渡 must not sit on water.

This test applies a stamp-local bank/terrace fit offset for 官渡:

- approved city-layer position remains based on `-8,+54`;
- stamp-local fit offset: `-26,+34`;
- purpose: move the visible city stamp south/southwest onto a bank/terrace read while preserving 官渡 as delegated T07/global east-context;
- visual marker: the PNG labels this adjustment as `官渡岸上`.

This is an art-layer fit only. It does not change runtime data or the underlying approved city-layer nudge record.

## Author Review

Result: `PASS_WITH_NOTES`.

Positive:

- 官渡 now reads as a bank/terrace placement rather than sitting on the visible water shape.
- The primary and standard stamp sizes remain legible without collapsing into texture.
- 陈留 / 官渡 / 许昌 continue to read as delegated east-context rather than T06-owned standard anchors.
- The test preserves the approved T06 city hierarchy and does not add uncontrolled settlements.

Cautions:

- This still uses placeholder stamp art; final stamp references need separate producer approval before any real blend/art pass.
- Short tie-ins are local visual hints only and must not become a road-graph decision.
- 洛阳 still needs final blend discipline so it reads as Luo/Yiluo context rather than Yellow River bank placement.
- 襄阳 still needs final blend discipline around the Han River / Jingxiang corridor read.

## Next Proposed Step

Producer review of this limited city-stamp / blend test.

If accepted, the next step should be a controlled city-stamp art source test or manual deterministic compositing test using the same city classes, nudge records, and 官渡 water caveat.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
