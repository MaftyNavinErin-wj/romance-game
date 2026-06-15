# Terrain T06 CC_W No-City v2 Normalized Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v2_normalized`
- Source candidate id: `terrain_t06_cc_w_no_city_v2`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `OPTION_A_APPROVED_FOR_CITY_NUDGE_PROPOSAL`
- Date: 2026-06-10
- Runtime impact: none

## Files

- Raw image path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2.png`
- Normalized image path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- City overlay path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_city_overlay.html`
- City overlay preview path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_city_overlay.png`
- Geography/city audit path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_geography_city_audit.md`
- City nudge proposal path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.html`
- City nudge proposal preview path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.png`
- City nudge proposal manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md`
- Deterministic city-layer preview path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview.html`
- Deterministic city-layer preview PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview.png`
- Deterministic city-layer preview manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_layer_preview_manifest.md`
- City stamp / blend test path: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test.html`
- City stamp / blend test PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test.png`
- City stamp / blend test manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test_manifest.md`
- City stamp cutout composite PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1.png`
- City stamp cutout composite preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1_preview.png`
- City stamp cutout composite manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1_manifest.md`
- City stamp cutout composite v2 PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2.png`
- City stamp cutout composite v2 preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2_preview.png`
- City stamp cutout composite v2 manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2_manifest.md`
- Brief: `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md`

## Generation

- Tool/path: built-in image generation tool.
- Prompt source: v2 rework prompt based on `stage6_t06_no_city_terrain_brief_v1.md` and producer rejection of v1.
- Key correction requested: no dominant main river between 长安 and 洛阳; Yellow River / Wei farther north/upper; Luoyang Luo/Yi/Yiluo smaller and subordinate.
- Generated source path: `C:\Users\jie.wang\.codex\generated_images\019eaf3d-b581-7921-891c-10f4af741a86\ig_00de062171cc4277016a28dc7796308196b8d05bcb67191e65.png`

## Normalization

- Operation: deterministic resize only.
- Source size: `1449 x 1085`
- Target size: `2344 x 1756`
- Actual output size: `2344 x 1756`
- Crop: none.
- AI repaint/edit: none after generation.
- Content movement: uniform scaling to the exact T06 review frame.

## Gate Review

| Gate | Result | Notes |
|---|---|---|
| Runtime isolation | `PASS` | No `src/` files and no `assets/maps/` files modified. |
| Output frame | `PASS_AFTER_NORMALIZE` | Raw output was `1449 x 1085`; normalized derivative is exact `2344 x 1756`. |
| No-city / no-label | `PASS_WITH_NOTES` | No obvious city stamps, labels, UI, hexes, or faction markers. |
| Chang'an-Luoyang river hierarchy | `PASS_WITH_NOTES` | The large river now reads as upper/northern control instead of a central divider between 长安 and 洛阳. |
| City reserve / distribution | `PASS_WITH_NOTES` | Major anchors are broadly workable. Some city-layer nudge/blend padding is still expected. |
| Terrain/geography | `PASS_WITH_NOTES` | Qinling/Funiu and southern corridor remain strong but no longer invalidate the main T06 corridor. |
| No random road network | `PENDING_PRODUCER_REVIEW_WITH_CAUTION` | Field/path strokes remain visible but are less damaging than v1's geography error. |
| Jiangdong/wetland avoidance | `PASS_WITH_NOTES` | Lower-right water remains edge context. |

## City Placement Audit

| City/group | Audit | Decision implication |
|---|---|---|
| 长安 | Acceptable. It sits in the Guanzhong-Henan corridor below the upper river band, not cut off by a central main river. | Keep global primary overlap. |
| 洛阳 | Acceptable with caution. The anchor is close to the upper river band, but reads as river-adjacent rather than in-water. | Keep global primary overlap; use local blend pad if needed. |
| 南阳 | Acceptable. It has central plain/corridor space. | Keep T06 standard. |
| 襄阳 | Still caution. It remains close to the strong mountain belt, but it is less invalid than v1 and can likely be handled by local blend/nudge. | Keep T06 standard with producer review. |
| 上庸 | Acceptable. Mountain/valley corridor read fits. | Keep T06 standard. |
| 夷陵 | Acceptable with caution. It is a river/mountain corridor anchor; stamp should not read as floating in water. | Keep T06 standard with local blend. |
| 新野 / 汉中 | Acceptable as subdued/context. | Do not promote to strong full stamps. |
| 陈留 / 官渡 / 许昌 | Acceptable as T07/global context in the eastern plain. | Delegate as planned. |
| 江陵 / 武昌 / 长沙 / 武陵 | Edge/context only; water proximity is acceptable if not treated as T06-owned. | Delegate south/east. |

## Author Review

v2 fixes the blocking v1 geography issue. It is worth producer review.

Positive signals:

- The 长安-洛阳 corridor no longer has a dominant main river between the two anchors.
- The upper river band can plausibly serve as northern Yellow River / Wei control.
- Center plain/corridor space is more readable.
- No obvious city stamps or labels are baked into the terrain base.
- The overall style remains close to the desired terrain-rich map direction.

Cautions:

- The upper river still sits visually close to 洛阳; this should remain a global overlap/corridor read, not a precise final river alignment claim.
- Field/path strokes remain dense and may compete with later deterministic road art.
- The Qinling/Funiu belt may still crowd 襄阳 unless city-layer blend/nudge is allowed.
- Lower-right water remains strong and should stay edge/context only.

## Producer Review Questions

Producer selected Option A on 2026-06-10: continue with v2 and allow local deterministic city-layer nudges/blend pads.

Follow-up review questions:

1. Are the proposed nudge directions and distances acceptable?
2. Is 洛阳's adjusted placement acceptable as global overlap, or still too close to the upper river?
3. Is 襄阳 acceptable after south/southeast nudge toward corridor terrain?
4. Is the field/path texture acceptable, or should a later terrain polish still suppress it further?

See `terrain_t06_cc_w_no_city_v2_geography_city_audit.md` for the detailed city adjustment recommendation.

See `terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md` for the first concrete city-layer nudge proposal.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
