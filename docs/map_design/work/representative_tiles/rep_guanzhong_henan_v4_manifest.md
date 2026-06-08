# Representative Tile Manifest: Guanzhong-Henan v4

## Identity

- Candidate id: `rep_guanzhong_henan_v4`
- Stage: Stage 4, representative tile
- Verdict: `REFERENCE_ONLY`, current producer-accepted Stage 4 first representative reference candidate
- Date: 2026-06-08
- Author/session: Codex built-in imagegen retry session
- Runtime impact: none

## Scope

- This is a representative validation tile candidate.
- This is not final national tile art.
- This is not a runtime asset.
- This image does not enter `assets/maps/`.
- This image is not city, road, river, pass, or hex data authority.
- Later work may use it only after producer review to judge regional style/detail scaling and perspective consistency.

## Files

- Repo output path: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
- Brief lineage: v3 producer perspective approval plus v3 Luoyang-side terrain audit
- Overlay path: none yet
- Seam preview path(s): none
- Generated source path: `C:\Users\jie.wang\.codex\generated_images\019ea691-51b6-7742-88fe-7c41c32aa331\ig_0dde1d4b79f1f503016a26a75a0f74819badc682d969c25369.png`
- Actual size: 1672 x 941 PNG

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt mode: short retry prompt after three earlier v4 `ServerError` failures.
- Intended use: test whether v3's accepted lower oblique perspective can be preserved while correcting the Luoyang-side river orientation.
- Pass policy used: no pass/checkpoint was generated. This keeps the tile to the current game data density: Chang'an and Luoyang only.

## Prompt

```text
Wide oblique ink-wash map. Two cities only: Chang'an left, Luoyang right. Keep v3-like low oblique view. Yellow River horizontal in the upper north. Thin Luo River horizontal near Luoyang. No vertical river beside Luoyang. Plains, fields, southern mountains. No forts, villages, buildings, labels, text.
```

## Negative Constraints

- No pass or checkpoint.
- No random mini-cities.
- No villages.
- No temples.
- No courtyard compounds.
- No roadside buildings.
- No riverbank hamlets.
- No extra forts.
- No repeated settlement icons.
- No vertical river immediately beside Luoyang.
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

- City count: PASS in light review. Only two large readable walled city footprints are visible.
- Pass placement: PASS by omission. No pass, checkpoint, or fort is drawn.
- Perspective consistency: PASS relative to v3 in light review. The lower oblique camera, city scale, mountain scale, and field-grid density remain broadly compatible with v3.
- Luoyang-side river correction: improved versus v3. The right/eastern city no longer has a dominant vertical river hugging it. The upper/northern large river reads more horizontally, and the local Luoyang-side water is thinner and more horizontal.
- Pseudo-settlement suppression: mostly PASS in light review. No obvious extra city/fort appears, though some tree/field clusters should be reviewed so they do not read as villages at game scale.
- River hierarchy: geographically more plausible than v3 for Luoyang, but the upper/northern river is visually strong and needs producer review.
- Terrain readability: southern mountains, open plains, field grids, and road corridor are legible.
- Forest/field density: denser than ideal in parts of the plain; producer should review whether tree/field marks stay readable under future labels/units.
- Runtime readiness: not reviewed and not applicable.

## Producer Decision

- Decision: accepted as current Stage 4 first representative reference candidate.
- Required changes: none for this session; keep perspective consistency as a hard gate for later tiles.
- Reject/rework reason: none for current reference use. Remaining review cautions: upper river visual strength, dense plain field/tree marks, and pseudo-settlement risk at game scale.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
