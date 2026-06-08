# Production Tile Manifest: T06_CC_W v2

## Identity

- Candidate id: `tile_t06_cc_w_v2`
- Tile id: `T06_CC_W`
- Stage: Stage 6, tile production
- Verdict: `REWORK`
- Date: 2026-06-08
- Author/session: Codex built-in imagegen retry session

## Files

- Repo output path: `docs/map_design/work/stitch/tile_t06_cc_w_v2.png`
- Review overlay path: `docs/map_design/work/stitch/tile_t06_cc_w_v2_overlay.html`
- Seam preview path(s): none; direct neighbors not produced yet
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea7b0-d8d1-7f31-8082-0e4cc4e10c0e\ig_0d587a7bfaa02468016a26e15424088196ac2b7e414d2c6bdf.png`
- Reference image path(s):
  - `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
  - `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
  - `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt:

```text
4:3 low oblique ink-wash regional map. Guanzhong-Henan dry plains, two walled cities only, Yellow River horizontal along upper north, thin Luo river near right city, southern foothills. Same style as previous accepted tile. No deltas, no lakes, no islands, no wetland network, no villages, no forts, no labels, no text.
```

- Negative constraints: no deltas, no lakes, no islands, no wetland network, no villages, no forts, no labels, no text.
- Intended size: `2344 x 1756` at 4x production scale.
- Actual size: `1448 x 1086` PNG.
- Reference roles: `rep_guanzhong_henan_v4` is primary perspective/style reference; Bashu and Jiangdong references are secondary consistency checks.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: copied generated PNG into `docs/map_design/work/stitch/`.

## Geography/Data Review

- City anchor overlay: none.
- River/road overlay: none.
- Tile/crop boundary: `T06_CC_W`, concept crop `334,251,586,439`.
- Coordinate drift notes: not assessed against runtime anchors.
- Movement budget exceeded: not assessed.

## Art Review

- City/fort clarity: PASS. Two controlled walled city footprints are visible and not crowded by extra forts.
- Field/farmland detail: PASS. Dry field grid density is compatible with accepted representative references.
- Forest/foothill detail: PASS. Southern mountain/foothill edge is visible without turning the tile into a Bashu-style basin.
- Riverbank/water detail: mostly PASS. Upper/northern main river reads as a horizontal strategic river; water is much more controlled than v1.
- Mountain/pass readability: PASS. Southern foothills support corridor logic and leave plausible continuation into western/southern neighbors.
- Style consistency: PASS. Low oblique camera, paper tone, city scale, field density, and line weight broadly match `rep_guanzhong_henan_v4`.
- Patch/seam risk: PENDING_NEIGHBOR. No direct neighbor tile exists yet, but the edge texture is not obviously broken in isolation.

## Stage 6 Tile Quality Gate

- Perspective/style gate: `PASS`
- Seam/overlap gate: `PENDING_NEIGHBOR`
- Terrain/geography gate: `PASS`
- Pseudo-settlement gate: `PASS`
- Runtime isolation gate: `PASS`

## Review Notes

- Primary caution: the right/eastern city still has a noticeable north-south local river beside it. It is no longer the dominant Luoyang-side river problem seen in earlier representative attempts, but producer should review whether it is acceptable as a local Luo/Yiluo-style water mark or needs another rework.
- Secondary caution: actual output is `1448 x 1086`, not the final `2344 x 1756` 4x production target. If approved visually, it still needs production-size normalization or a higher-resolution generation path before final stitch use.
- Scope correction: full `T06_CC_W` production scope is not a two-city-only crop. This candidate was generated from a two-city prompt and under-represents the full production tile city hierarchy. See `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`.

## Runtime Impact

- Runtime impact: none.
- If promoted, target runtime asset path: not applicable.
- Rollback asset path: not applicable.

## Producer Decision

- Decision: author-marked `REWORK` after city-scope audit.
- Required changes: regenerate with corrected full-tile city hierarchy and seam-aware secondary city treatment.
- Reject/rework reason: candidate undercounts the full `T06_CC_W` production scope by carrying over the two-city representative-crop rule.
