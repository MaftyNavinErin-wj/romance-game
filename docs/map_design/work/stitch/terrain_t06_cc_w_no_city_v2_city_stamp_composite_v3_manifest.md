# T06 v2 City Stamp Cutout Composite v3 Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3`
- Base candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `PRODUCER_ACCEPTED_FOR_NEXT_CONTROLLED_STEP`
- Date: 2026-06-15
- Runtime impact: none

## Files

- Composite script: `docs/map_design/work/stitch/create_t06_city_stamp_composite_v3.py`
- Composite PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3.png`
- Review preview PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_preview.png`
- Placement JSON: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_placements.json`
- Prior v2 manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2_manifest.md`

## Producer Feedback Addressed

Producer review of v2 accepted the overall direction and noted:

- large/primary cities can be one step smaller;
- medium/standard cities can also be one step smaller;
- other placement and scale choices look acceptable.

This v3 changes only primary and standard city stamp size. It keeps the v2 terrain base, city set, approved art-layer offsets, Luoyang water fix, Guandu off-water handling, context stamp sizes, opacity settings, and runtime isolation.

## Deterministic Changes From v2

Stamp widths in the normalized `2344 x 1756` frame:

| Class | v2 | v3 |
|---|---:|---:|
| `global-primary` | 170 | 158 |
| `t06-standard` | 136 | 126 |
| `subdued` | 98 | 98 |
| `east-context` | 94 | 94 |

Preserved from v2:

- 洛阳 visible-fit offset remains `-24,+84`.
- 官渡 visible-fit offset remains `-42,+62`.
- 官渡 source-approach softening remains enabled.
- No runtime city coordinate changes.

## Render Verification

- Script run result: exit code `0`.
- Composite output size: `2344 x 1756`.
- Preview output size: `2344 x 1756`.
- Placement JSON: valid JSON, 11 entries.
- Primary bbox size: `158 x 91`.
- Standard bbox size: `126 x 75`.
- Runtime files touched: none.

## Author Review

Result: `PROOF_READY_FOR_PRODUCER_REVIEW`.

Positive:

- Primary stamps are more restrained than v2 while still readable as the major city class.
- Standard stamps are lower weight than v2 but still larger than the too-small v1 standard size.
- Subdued/context stamps retain the v2 scale that producer accepted.
- 洛阳 remains off the water band after the v2 visible-fit correction.

Cautions:

- This remains a proof composite, not a final blended tile.
- No gate/ramp/source-local mark should be treated as road graph approval.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.

## Producer Review

Producer accepted v3 on 2026-06-15: large/primary and medium/standard city scale now look acceptable. This accepts the v3 proof as the current controlled city-stamp composite reference for the next map-production step, not as a runtime asset promotion.
