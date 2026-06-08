# Production Tile Manifest: T06_CC_W v3

## Identity

- Candidate id: `tile_t06_cc_w_v3`
- Tile id: `T06_CC_W`
- Stage: Stage 6, tile production
- Verdict: `PENDING_PRODUCER_REVIEW`
- Date: 2026-06-09
- Author/session: Codex built-in imagegen retry session

## Files

- Repo output path: `docs/map_design/work/stitch/tile_t06_cc_w_v3.png`
- Review overlay path: `docs/map_design/work/stitch/tile_t06_cc_w_v3_overlay.html`
- Seam preview path(s): none; direct neighbors not produced yet
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea7b0-d8d1-7f31-8082-0e4cc4e10c0e\ig_0d587a7bfaa02468016a26f10be77c81968c103297fe7f7118.png`
- Reference image path(s):
  - `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
  - `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
  - `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`
  - `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt:

```text
4:3 low oblique Chinese ink-wash production map tile. T06 central-west Guanzhong-Henan corridor, dry bounded plains. Large Chang'an and Luoyang/Henan walled cities, several smaller subdued data-controlled corridor city marks, not random towns. Yellow River horizontal in upper north, thin local Luo/Wei rivers, southern Qinling-Funiu foothills, roads follow passes and plains. Same paper, camera, city scale, field density as accepted Guanzhong-Henan reference. Seam-friendly edges. No wetland network, no deltas, no islands, no villages, no temples, no extra forts, no labels, no text, no UI, no watermark.
```

- Negative constraints: no wetland network, no deltas, no islands, no villages, no temples, no extra forts, no labels, no text, no UI, no watermark.
- Intended size: `2344 x 1756` at 4x production scale.
- Actual size: `1448 x 1086` PNG.
- Reference roles: `rep_guanzhong_henan_v4` is primary perspective/style reference; T06 city scope audit corrects production-scope city hierarchy.

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

- City/fort clarity: PASS. Two major city footprints plus several smaller subdued controlled city marks better match full production scope than v2.
- Field/farmland detail: PASS. Dry field grid density is compatible with accepted references.
- Forest/foothill detail: PASS. Southern Qinling/Funiu foothill edge is visible and supports corridor logic.
- Riverbank/water detail: mixed. Upper/northern main river is acceptable; the right/eastern north-south local river is visually strong and needs producer geography review.
- Mountain/pass readability: PASS. Southern mountain edge and roads read as corridor geography rather than a basin.
- Style consistency: PASS. Low oblique camera, paper tone, city scale, field density, and line weight broadly match `rep_guanzhong_henan_v4`.
- Patch/seam risk: PENDING_NEIGHBOR. No direct neighbor tile exists yet; edge texture appears usable in isolation.

## Stage 6 Tile Quality Gate

- Perspective/style gate: `PASS`
- Seam/overlap gate: `PENDING_NEIGHBOR`
- Terrain/geography gate: `PASS`
- Pseudo-settlement gate: `PASS`
- Runtime isolation gate: `PASS`

## Review Notes

- This v3 fixes the v2 scope error by using a city hierarchy instead of a two-city-only composition.
- Main producer-review risk: the right/eastern north-south river remains visually prominent. It may be acceptable as a local Luo/Yiluo-style water/corridor mark, but if producer judges it geographically distracting, the tile should be reworked again.
- Actual output is `1448 x 1086`, not the final `2344 x 1756` 4x production target. If approved visually, it still needs production-size normalization or a higher-resolution generation path before final stitch use.

## Runtime Impact

- Runtime impact: none.
- If promoted, target runtime asset path: not applicable.
- Rollback asset path: not applicable.

## Producer Decision

- Decision: pending producer review.
- Required changes: pending producer review.
- Reject/rework reason: none yet.
