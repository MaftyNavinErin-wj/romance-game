# T06 v2 Deterministic City-Layer Preview Manifest

## Identity

- Preview id: `terrain_t06_cc_w_no_city_v2_city_layer_preview`
- Base candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Stage: Stage 6 controlled production pipeline
- Verdict: `PRODUCER_APPROVED_WITH_GUANDU_WATER_CAVEAT`
- Date: 2026-06-10
- Runtime impact: none

## Files

- Preview HTML: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview.html`
- Preview PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview.png`
- Base image: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Approved nudge proposal: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md`

## Purpose

Show the first deterministic city-layer placement preview on the approved T06 v2 terrain base.

This is not final city art. The city placeholders are deterministic review marks for density, collision, river/mountain fit, and ownership/delegation. This preview does not change `CITY_BASE`, runtime city coordinates, `src/`, or `assets/maps/`.

## Deterministic Placement

- Base frame: `2344 x 1756`.
- Control crop: `334,251,586,439`.
- City anchors: projected from `src/data/city_base.js` using the existing control-overlay formula.
- Nudges: copied from the producer-approved city nudge proposal.
- Placeholder art: deterministic SVG rectangles/lines only; no image generation and no city-stamp art source.

## Render Verification

- Render tool: local headless Chrome through `playwright-core`.
- PNG output size: `1500 x 1341`.
- SVG viewBox: `0 0 2344 1756`.
- Rendered city/context groups: `31`.
- Rendered nudge arrows: `8`.
- Browser console/page errors: none.
- Visual QA: PASS. Top/edge labels are clamped inside the preview frame; no obvious UI text clipping in the generated PNG.

## City Classes

| Class | Cities | Preview treatment | Ownership note |
|---|---|---|---|
| Global primary | 长安, 洛阳 | Large placeholder, radius 152 output px | Global city layer / overlap primary. |
| T06 standard | 南阳, 襄阳, 上庸, 夷陵 | Standard placeholder, radius 96 output px | Main T06 density check. |
| Subdued | 新野, 汉中 | Small/subdued placeholder, radius 72 output px | Context only; do not promote to strong stamps. |
| Delegated east/south context | 陈留, 官渡, 许昌, 江陵, 武昌 | Small/context placeholder, radius 72 output px | Neighbor/global-owned; not T06 standard stamps. |
| Ghost context | Other in-margin anchors | Low-opacity placeholder, radius 72 output px | Seam/context awareness only. |

## Approved Nudges Applied

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

## Author Review

Result: `PASS_WITH_NOTES`.

Positive:

- The approved nudge set makes the 南阳 / 襄阳 pair visually feasible for standard placeholders.
- 洛阳 is no longer placed directly on the upper river line, though it remains river-adjacent.
- 陈留 / 官渡 / 许昌 read as east-context / delegated marks rather than T06-owned standard stamps.
- The T06 standard set remains readable without collapsing into sesame-dot scale.

Cautions:

- 洛阳 still needs later city-stamp blending that clearly implies Luo/Yiluo context rather than Yellow River bank placement.
- 襄阳 needs later stamp/blend work to preserve the Han River / Jingxiang corridor read.
- Field/path texture density in the terrain base remains a later road-layer composition caution.
- This preview does not test final city art style, gates, shadows, roads, or local blend masks.

## Producer Decision 2026-06-10

Producer approved the deterministic city-layer preview with one carry-forward caveat:

- 官渡 needs special placement care in the next city-stamp / blend pass; it must not sit on water.

All other preview placement is acceptable.

Implementation implication:

- keep 官渡 as delegated T07/global east-context, not T06-owned standard;
- in the next stamp/blend test, place 官渡 on a south/southwest bank, terrace, or ferry-context landing area rather than inside the river shape;
- if the current terrain water shape makes that impossible without a large move, stop and treat it as a terrain/placement issue instead of forcing the city stamp onto water.

## Next Proposed Step

Limited city-stamp art / blend test using these same positions and classes, with the 官渡 water caveat above as a hard review note.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
