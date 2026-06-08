# Representative Tile Manifest: Guanzhong-Henan v3

## Identity

- Candidate id: `rep_guanzhong_henan_v3`
- Stage: Stage 4, representative tile
- Verdict: `REFERENCE_ONLY`, producer accepted perspective as usable direction
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

- Repo output path: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v3.png`
- Brief lineage: `docs/map_design/work/representative_tiles/stage4_rep_guanzhong_henan_v2_generation_brief.md`, then producer-approved v3 direction in session discussion
- Overlay path: none yet
- Seam preview path(s): none
- Generated source path: `C:\Users\jie.wang\.codex\generated_images\019ea691-51b6-7742-88fe-7c41c32aa331\ig_0dde1d4b79f1f503016a2691fd6ee4819bba72996bd7ff25bf.png`
- Actual size: 1670 x 941 PNG

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt mode: minimal retry prompt after two built-in `ServerError` failures in this v3 attempt.
- Intended use: recover the stronger v1-like wide regional composition while removing the v1 producer-rejected decorative pass/fort.
- Pass policy used: no pass/checkpoint was generated. This avoids incorrect Hangu Pass placement and keeps the tile to the current game data density: Chang'an and Luoyang only.

## Prompt

```text
Wide horizontal Chinese ink-wash regional map. Two walled cities only: Chang'an left, Luoyang right. Plains, fields, thin rivers, southern mountains, subtle road. No other buildings, no forts, no labels, no text.
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

- City count: PASS for producer's density rule. Only two readable walled city footprints are visible.
- Pass placement: PASS by omission. No pass, checkpoint, or fort is drawn.
- Pseudo-settlement suppression: PASS in light review. No obvious random mini-city, roadside village, temple, hamlet, or extra fort appears.
- Composition: much stronger than v2. The image returns to a v1-like wide regional corridor with readable Chang'an-Luoyang spacing, plains, rivers, fields, and southern mountain structure.
- River hierarchy: better than v1's broad dominant top river, though the eastern/right-side river remains visually significant and needs producer review.
- Terrain readability: southern mountains, open plains, field grids, and river-road corridor are legible.
- Forest density: controlled; clusters exist but do not overwhelm the corridor.
- Style consistency: closer to v1's successful regional-map quality than v2, pending producer judgment.
- Format caution: output is `1670 x 941`, nearly matching v1's `1672 x 941` aspect but not exactly identical.
- Runtime readiness: not reviewed and not applicable.

## Producer Perspective Note

- Producer note: v3 perspective is acceptable.
- Required constraint: future full-map base tiles must keep this perspective consistent.
- Implementation implication: v3-style oblique perspective can be used as a reference, but later representative/production tiles must be rejected or reworked if they drift into a noticeably different camera height, horizon treatment, city scale, mountain scale, river width, or field-grid density.

## Terrain Audit Note

- Luoyang-side river issue: the large near-vertical river beside the right/eastern city is geographically questionable.
- Control facts: Luoyang is north of the Luo River; Luoyang sits in the Luo/Yi river context, while the Yellow River is the broader northern river system.
- Review implication: if the right city is Luoyang, the local river grammar should read as a west-east Luo River / Yiluo corridor near or south of the city, with the Yellow River farther north/upper side. A large vertical river directly beside Luoyang should not be treated as a final geography reference.
- Required correction for the next Guanzhong-Henan attempt: preserve v3 perspective, but correct Luoyang water structure so no dominant vertical river hugs the city.

## Producer Decision

- Decision: perspective accepted as usable direction; full candidate still pending broader producer review.
- Required changes: maintain consistent perspective across later full-map bottom tiles; correct Luoyang-side water orientation in any follow-up candidate.
- Reject/rework reason: none for perspective; Luoyang-side river grammar needs correction before this can become a geography reference.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
