# Representative Tile Manifest: Bashu-Hanzhong v1

## Identity

- Candidate id: `rep_bashu_hanzhong_v1`
- Stage: Stage 4, representative tile
- Verdict: `REFERENCE_ONLY`, producer accepted as consistent representative direction
- Date: 2026-06-08
- Author/session: Codex built-in imagegen retry session
- Runtime impact: none

## Scope

- This is a representative validation tile candidate.
- This is not final national tile art.
- This is not a runtime asset.
- This image does not enter `assets/maps/`.
- This image is not city, road, river, pass, or hex data authority.
- Later work may use it only after producer review to judge regional style/detail scaling, mountain-basin grammar, and perspective consistency.

## Files

- Repo output path: `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
- Brief path: `docs/map_design/work/representative_tiles/stage4_rep_bashu_hanzhong_v1_generation_brief.md`
- Overlay path: none yet
- Seam preview path(s): none
- Generated source path: `C:\Users\jie.wang\.codex\generated_images\019ea691-51b6-7742-88fe-7c41c32aa331\ig_0dde1d4b79f1f503016a26ad0f4bc0819bbc0bfad18882e75d.png`
- Actual size: 1672 x 941 PNG

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt mode: short retry prompt after one built-in `ServerError` failure.
- Intended use: test whether the `rep_guanzhong_henan_v4` perspective and detail grammar can carry into an enclosed Hanzhong/Bashu mountain-basin representative tile.

## Prompt

```text
Wide oblique ink-wash map. Same low camera as previous v4 tile. Hanzhong basin between north and south mountains. Thin Han River runs west-east through the basin. Subtle valley road, fields, misty ridges. No villages, forts, temples, extra buildings, labels or text.
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

- Perspective consistency: PASS relative to `rep_guanzhong_henan_v4` in light review. The low oblique camera, horizon treatment, field scale, and mountain scale remain broadly compatible.
- Basin readability: PASS in light review. The tile clearly reads as an enclosed basin framed by northern and southern mountains.
- River grammar: PASS in light review. The Han River reads as a subdued west-east basin river.
- Corridor readability: mostly PASS. Valley road/corridor logic is visible, though some road segments may be too clean or straight and should receive producer review.
- City footprint density: review needed. Two large walled city footprints are visible; they are controlled, not random clusters, but producer should decide whether this is too much built density for the Bashu-Hanzhong representative crop.
- Pseudo-settlement suppression: mostly PASS in light review. No obvious extra city/fort appears, though tree/field clusters should be checked at game scale.
- Mountain density: strong but readable; future labels/units may need breathing-room review.
- Forest/field density: dense in parts of the basin and should receive producer review.
- Runtime readiness: not reviewed and not applicable.

## Producer Decision

- Decision: accepted as consistent representative direction.
- Producer note: perspective, city treatment, and terrain material are consistent with the prior Luoyang-Changan / Guanzhong-Henan representative tile direction.
- Required changes: none for this session.
- Reject/rework reason: none.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
