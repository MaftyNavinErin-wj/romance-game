# Production Tile Manifest: T06_CC_W v5

## Identity

- Candidate id: `tile_t06_cc_w_v5`
- Tile id: `T06_CC_W`
- Stage: Stage 6, tile production
- Verdict: `PENDING_PRODUCER_REVIEW`
- Date: 2026-06-09
- Author/session: Codex built-in imagegen rework session

## Files

- Repo output path: `docs/map_design/work/stitch/tile_t06_cc_w_v5.png`
- Review overlay path: `docs/map_design/work/stitch/tile_t06_cc_w_v5_overlay.html`
- Seam preview path(s): none; direct neighbors not produced yet
- Generated source path(s): `C:\Users\jie.wang\.codex\generated_images\019eab0d-73ac-7153-9417-b6610295c253\ig_0a3cd5be5b53636c016a27b94132f8819aa3cb211fe0e565f1.png`
- Reference image path(s):
  - `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
  - `docs/map_design/work/stitch/tile_t06_cc_w_v2.png`
  - `docs/map_design/work/stitch/tile_t06_cc_w_v3.png` as negative city-scale reference
  - `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt:

```text
Use case: stylized-concept
Asset type: Project Romance Stage 6 production map tile candidate, T06_CC_W v5.

Generate a 4:3 low-oblique Chinese ink-wash regional strategy map tile for Guanzhong-Henan / Chang'an-Luoyang corridor.

Use the accepted Guanzhong-Henan reference and T06 v2 for style and scale: warm aged paper, restrained ink, dry farmland grid, low oblique camera, compact regional city symbols. Do not follow T06 v3's oversized Chang'an. Do not follow v4's busy river/road network.

Composition: dry bounded plains, Yellow River only as a mostly horizontal river in the upper north, southern Qinling-Funiu foothills along the lower edge, sparse trees, subdued roads through passes and plains.

Cities: two primary compact walled cities, Chang'an west-left and Luoyang east-right, nearly equal size. Chang'an may be slightly larger but must not exceed Luoyang by more than about 10 percent. Both primary cities should be much smaller than T06 v3 and close to T06 v2 city footprint scale. Add only 4 to 6 tiny subdued secondary data-controlled city marks across the corridor; they must be low contrast and clearly much smaller than the primary cities.

Hard constraints: no single city dominates the tile. Chang'an must not fill the left third. Keep cities away from hard edges and seam overlap. Water must be sparse: no dense river network, no braided river, no islands, no sandbars, no lake, no wetland, no delta. Avoid a dominant vertical river beside Luoyang. Avoid random villages, temples, extra forts, labels, text, UI, watermark.
```

- Negative constraints: no oversized Chang'an, no city filling the left third, no dense river network, no braided river, no islands, no sandbars, no lake, no wetland, no delta, no dominant vertical river beside Luoyang, no random villages, no temples, no extra forts, no labels, no text, no UI, no watermark.
- Intended size: `2344 x 1756` at 4x production scale.
- Actual size: `1448 x 1086` PNG.
- Reference roles: `rep_guanzhong_henan_v4` and v2 control style/city scale; v3 is the negative oversized-Chang'an reference.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: copied generated PNG into `docs/map_design/work/stitch/`.

## Geography/Data Review

- City anchor overlay: approximate city scope audit in `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`.
- River/road overlay: visual-only; no exact runtime river/road overlay yet.
- Tile/crop boundary: `T06_CC_W`, concept crop `334,251,586,439`.
- Coordinate drift notes: not assessed against runtime anchors.
- Movement budget exceeded: not assessed.

## Art Review

- City/fort clarity: PASS. Chang'an and Luoyang now read as compact same-tier primary city symbols instead of a giant landmark.
- Field/farmland detail: PASS. Dry field grid density is compatible with accepted references.
- Forest/foothill detail: PASS. Southern Qinling/Funiu foothill edge remains visible and supports corridor logic.
- Riverbank/water detail: MIXED. The upper Yellow River is readable, but sandbar-like shapes remain despite the prompt constraint; right/eastern local river still needs producer geography review.
- Mountain/pass readability: PASS. Southern mountain edge and roads read as corridor geography.
- Style consistency: PASS. Low oblique camera, paper tone, line weight, and city scale are closer to v2/reference than v3.
- Patch/seam risk: PENDING_NEIGHBOR. No direct neighbor tile exists yet; city footprints are less risky than v3 near the west overlap.

## Stage 6 Tile Quality Gate

- Perspective/style gate: `PASS`
- Seam/overlap gate: `PENDING_NEIGHBOR`
- Terrain/geography gate: `PENDING_PRODUCER_REVIEW`
- Pseudo-settlement gate: `PASS`
- Runtime isolation gate: `PASS`

## Review Notes

- This v5 addresses the producer concern that v3 made Chang'an enormously oversized.
- Main remaining risk: upper-river sandbar/braided shapes and a still-visible right/eastern local river. If strict hydrology is required, regenerate again with even stronger water suppression.
- Actual output is `1448 x 1086`, not the final `2344 x 1756` 4x production target. If approved visually, it still needs production-size normalization or a higher-resolution generation path before final stitch use.

## Runtime Impact

- Runtime impact: none.
- If promoted, target runtime asset path: not applicable.
- Rollback asset path: not applicable.

## Producer Decision

- Decision: pending producer review.
- Required changes: pending producer review.
- Reject/rework reason: none yet.
