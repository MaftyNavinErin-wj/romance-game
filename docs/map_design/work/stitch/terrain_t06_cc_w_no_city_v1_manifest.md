# Terrain T06 CC_W No-City v1 Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v1`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `REWORK_AS_RAW_SOURCE`
- Date: 2026-06-10
- Runtime impact: none

## Files

- Candidate image path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1.png`
- Overlay audit path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_overlay.html`
- Overlay preview path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_overlay_preview.png`
- Normalized derivative path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized.png`
- Manifest path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_manifest.md`
- Generation source path: `C:\Users\jie.wang\.codex\generated_images\019eaf3d-b581-7921-891c-10f4af741a86\ig_00de062171cc4277016a28cf1d33248196be3a343abec48b50.png`
- Brief: `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md`

## Generation

- Tool/path: built-in image generation tool.
- Prompt source: `stage6_t06_no_city_terrain_brief_v1.md`, normalized into a no-city terrain-base prompt.
- Intended output size: `2344 x 1756`
- Actual output size: `1448 x 1086`
- Post-processing: copied generated PNG into workspace; no resize/crop applied.

## Gate Review

| Gate | Result | Notes |
|---|---|---|
| Runtime isolation | `PASS` | No `src/` files and no `assets/maps/` files modified. |
| Output frame | `FAIL` | Actual image is `1448 x 1086`, not exact `2344 x 1756`; per brief, wrong size/aspect is `REWORK`. |
| No-city / no-label | `PASS_WITH_NOTES` | No obvious large city stamps, labels, UI, hexes, or faction markers. |
| No random road network | `REWORK` | The image contains many thin path-like lines and small clustered marks that could read as uncontrolled roads or micro-settlements. |
| Terrain/geography | `REWORK_WITH_NOTES` | Broad mountain/plain/water structure is usable as a style signal, but water/route density risks pulling the tile toward uncontrolled network detail. |
| Jiangdong/wetland avoidance | `PASS_WITH_NOTES` | It is not a pure Jiangdong delta tile, but the lower-right water edge and dense channels need caution. |

## Overlay Audit

Created `terrain_t06_cc_w_no_city_v1_overlay.html` and `terrain_t06_cc_w_no_city_v1_overlay_preview.png` to audit city-reserve and terrain distribution before deciding whether to normalize size.

Audit result: geography/city-reserve distribution is workable enough to preserve as a normalized review candidate.

Key checks:

- 长安 / 洛阳: sit in the upper overlap/global-primary band with enough plain/river corridor space. 洛阳 is close to the upper river system, but acceptable as a global overlap anchor rather than a T06-owned stamp.
- 南阳 / 襄阳 / 上庸 / 夷陵: center and south-corridor anchors are not buried under hard city-like artifacts. 上庸 and 夷陵 read as mountain/river corridor anchors, which fits the T06 role.
- 新野 / 汉中: both should remain subdued/context. 汉中 reads as a west-corridor mountain/valley context rather than a central full stamp.
- 陈留 / 官渡 / 许昌: east-overlap anchors fall in open/plain context and can remain T07/global ownership.
- Qinling/Funiu: the major mountain belt is strong and somewhat north-heavy, but it supports the required structural divide rather than invalidating the candidate.
- Yangtze/Jianghan edge: lower-right water is visually strong, but remains edge/context rather than turning the whole tile into Jiangdong water-network grammar.

Remaining visual caution:

- Ground texture includes many path-like field and route strokes. Producer review judged this as not clearly pseudo-village/pseudo-settlement, but the next pass should still watch for uncontrolled road-network read.

## Author Review

The raw candidate is useful as a style/material signal for terrain richness, foothills, riverbanks, and field texture, but it cannot advance in raw form because the frame gate fails.

Main reject reasons:

1. Frame gate fails: the output is not the required `2344 x 1756`.
2. The road/path texture is denser than ideal for a no-road terrain base, though overlay review did not confirm a hard pseudo-settlement failure.

## Next Action

Use `terrain_t06_cc_w_no_city_v1_normalized.png` as the exact-frame derived review candidate. It was produced by deterministic resize only; no AI repaint, crop, or content edit was applied.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
