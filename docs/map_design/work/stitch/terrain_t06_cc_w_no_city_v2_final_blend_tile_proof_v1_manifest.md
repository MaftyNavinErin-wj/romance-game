# T06 Final Blend Tile Proof v1 Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1`
- Locked reference: `terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `PROOF_READY_FOR_PRODUCER_REVIEW`
- Date: 2026-06-15
- Runtime impact: none

## Files

- Final blend script: `docs/map_design/work/stitch/create_t06_final_blend_tile_proof_v1.py`
- Proof PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1.png`
- Review preview PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1_preview.png`
- Verification report JSON: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1_report.json`
- Brief: `docs/map_design/work/tile_plan/stage6_t06_final_blend_tile_proof_brief_v1.md`

## Locked Inputs

- No-city terrain base: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Accepted city-stamp composite reference: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3.png`
- Accepted placement JSON: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_placements.json`

## Deterministic Operations

The script starts from the accepted v3 composite and uses the v3 placement JSON only as locked review metadata.

Applied operations:

- diff-mask city/pad detection from v3 composite versus no-city terrain;
- local contact shadows under existing v3 stamp bboxes;
- localized edge blend toward terrain around the detected city-layer mask;
- localized paper-tone harmonization inside the detected city-layer mask;
- subtle whole-tile paper wash.

Not applied:

- no city movement;
- no stamp resize;
- no city count change;
- no new road graph;
- no runtime asset promotion.

## Locked Invariants

From `terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1_report.json`:

- Output size: `2344 x 1756`.
- Preview size: `2344 x 1756`.
- Placement count: `11`.
- City count unchanged: `true`.
- Placement JSON unmodified: `true`.
- Scale unmodified: `true`.
- Runtime files touched: `false`.

Rendered city ids remain:

`changan`, `luoyang`, `nanyang`, `xiangyang`, `shangyong`, `yiling`, `xinye`, `hanzhong`, `chenliu`, `guandu`, `xuchang`.

## Author Review

Result: `PROOF_READY_FOR_PRODUCER_REVIEW`.

Positive:

- The proof stays visually close to accepted v3 while reducing the pasted-object read of the stamp layer.
- The whole-tile paper tone is slightly more unified.
- City edges and local contact shadows read more integrated with terrain at review scale.
- 洛阳 and 官渡 keep the accepted off-water corrections.
- No new road graph is introduced.

Cautions:

- This is still a proof blend, not a runtime asset.
- Gate/ramp marks in the original stamp source remain non-road artifacts.
- Producer should review whether the blend is strong enough or whether v2 should use a slightly heavier local edge treatment.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
