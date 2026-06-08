# Representative Tile Manifest: Guanzhong-Henan v2

## Identity

- Candidate id: `rep_guanzhong_henan_v2`
- Stage: Stage 4, representative tile
- Verdict: `REWORK`
- Date: 2026-06-08
- Author/session: Codex built-in imagegen retry session
- Runtime impact: none

## Scope

- This is a representative validation tile candidate.
- This is not final national tile art.
- This is not a runtime asset.
- This image does not enter `assets/maps/`.
- This image is not city, road, river, pass, or hex data authority.
- Later work may use it only after producer review to judge regional style/detail scaling.

## Files

- Repo output path: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v2.png`
- Brief path: `docs/map_design/work/representative_tiles/stage4_rep_guanzhong_henan_v2_generation_brief.md`
- Overlay path: none yet
- Seam preview path(s): none
- Generated source path: `C:\Users\jie.wang\.codex\generated_images\019ea691-51b6-7742-88fe-7c41c32aa331\ig_0dde1d4b79f1f503016a268d87a7e4819baf1fbb3b1da8ed20.png`
- Actual size: 1254 x 1254 PNG

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt mode: short built-in retry prompt after one new `ServerError` failure in this session and three earlier failures recorded in the v2 brief.
- Intended use: validate the approved national ink-map style at regional representative-tile scale while enforcing the producer's pass-placement rule.
- Pass policy used: no pass/checkpoint was generated. This follows the v2 fallback rule: if Hangu Pass cannot be placed accurately, omit the pass rather than creating decorative or misplaced fort art.

## Prompt

```text
Parchment ink-wash map tile of ancient China, Chang'an west and Luoyang east. Only two walled cities. Thin rivers, subtle road, Qinling foothills, open plains, moderate forest. No other buildings or settlements. No labels, no text, no UI, no watermark.
```

## Negative Constraints

- No random mini-cities.
- No villages.
- No temples.
- No courtyard compounds.
- No roadside buildings.
- No riverbank hamlets.
- No extra forts.
- No repeated settlement icons.
- No labels, no text, no UI, no watermark.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Workspace copy: copied generated PNG from Codex generated image cache into `docs/map_design/work/representative_tiles/`.

## Geography/Data Review

- City anchor overlay: none yet.
- River/road overlay: none yet.
- Tile/crop boundary: independent representative crop; not a stitched production tile.
- Coordinate drift notes: not reviewed against runtime anchors; current map-art workflow treats this candidate as visual/reference material only.
- Movement budget exceeded: not assessed.

## Author Light Review

- City count: PASS for producer's v2 density rule. Only two readable walled city footprints are visible.
- Pass placement: PASS by omission. No Hangu Pass/checkpoint is drawn, so there is no misplaced decorative pass.
- Pseudo-settlement suppression: PASS in light review. No obvious random mini-city, roadside village, temple, hamlet, or extra fort appears.
- River hierarchy: improved versus v1's dominant broad river issue, but the right-side main river still reads visually strong and should receive producer review.
- Terrain readability: southern/western mountain barrier and open plain relationship are readable.
- Forest density: more controlled than v1; forest clusters remain visible but do not dominate the whole tile.
- Style consistency: broadly compatible with the approved parchment ink-map direction, pending producer judgment.
- Format caution: output is square `1254 x 1254`, while v1 was `1672 x 941`; use for visual review, not crop-dimension approval.
- Runtime readiness: not reviewed and not applicable.

## Producer Decision

- Decision: `REWORK`.
- Required changes: do not advance v2; generate v3 with v1-like wide regional quality while keeping the two-city-only/no-pass rule.
- Reject/rework reason: producer judged v2 much worse than v1. It is technically compliant but loses v1's stronger regional composition and art quality.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
