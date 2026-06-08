# Representative Tile Manifest: Huai-Si / Jiangdong v1

## Identity

- Candidate id: `rep_huaisi_jiangdong_v1`
- Stage: Stage 4, representative tile
- Verdict: `REFERENCE_ONLY`, producer accepted as Jiangdong/lower-Yangtze water-network representative direction
- Date: 2026-06-08
- Author/session: Codex built-in imagegen retry session
- Runtime impact: none

## Scope

- This is a representative validation tile candidate.
- This is not final national tile art.
- This is not a runtime asset.
- This image does not enter `assets/maps/`.
- This image is not city, road, river, ferry, pass, or hex data authority.
- Later work may use it only after producer review to judge regional style/detail scaling, lowland water-network grammar, and perspective consistency.

## Files

- Repo output path: `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`
- Brief path: `docs/map_design/work/representative_tiles/stage4_rep_huaisi_jiangdong_v1_generation_brief.md`
- Overlay path: none yet
- Seam preview path(s): none
- Generated source path: `C:\Users\ALIENWARE\.codex\generated_images\019ea7b0-d8d1-7f31-8082-0e4cc4e10c0e\ig_0d587a7bfaa02468016a26d69fec208196a36d372dc946f3bd.png`
- Actual size: 1672 x 941 PNG

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt mode: short retry prompt after six earlier built-in `ServerError` failures.
- Intended use: test whether the accepted `rep_guanzhong_henan_v4` and `rep_bashu_hanzhong_v1` perspective/material language can carry into Huai-Si / Jiangdong lowland water-network geography.

## Prompt

```text
Wide 16:9 oblique Chinese ink-wash regional map tile, same low camera, city scale, paper texture, and terrain material as the accepted Guanzhong-Henan and Bashu-Hanzhong representative tiles. Huai-Si and Jiangdong lowland water network: broad subdued blue-gray main river corridor, branching streams, wet field grids, marsh edges, levee roads, small ferry crossings, distant low hills only. Very few controlled walled city footprints for scale. Lowland plains, no mountain basin. No villages, no temples, no roadside buildings, no riverbank hamlets, no extra forts, no repeated settlement icons, no labels, no text, no UI, no watermark.
```

## Negative Constraints

- No mountain-basin framing.
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

- Perspective consistency: PASS in light review. The low oblique camera, wide horizontal crop, paper texture, field-grid scale, and city scale remain broadly compatible with `rep_guanzhong_henan_v4` and `rep_bashu_hanzhong_v1`.
- Lowland water-network readability: PASS in light review. The candidate clearly reads as branching lowland waterways and wet fields rather than another mountain basin.
- Water hierarchy: review needed. The broad main corridor and many branching channels are legible, but water occupies a large portion of the tile and may be visually strong for later overlay use.
- Ferry/crossing logic: mostly PASS. Several small ferry/crossing marks and levee-like paths read as geography, though some road/crossing strokes may be too clean and should receive producer review.
- City footprint density: PASS in light review. Two controlled walled city footprints are visible; no obvious extra fort or repeated city icon is present.
- Pseudo-settlement suppression: mostly PASS in light review. No obvious random towns, temples, or roadside compounds appear, though dense tree/field clusters should be checked at game scale.
- Hill treatment: review needed. The tile avoids dominant mountain walls, but the foreground and distant ridge marks still need producer judgment against the "low hills only" target.
- Runtime readiness: not reviewed and not applicable.

## Producer Decision

- Decision: accepted.
- Producer note: water-town / lower-Yangtze water-network character is strong and acceptable.
- Geography note: author follow-up check judged the candidate valid for Jiangdong / lower Yangtze lowland water-network grammar. It is stronger as a Jiangdong water-network direction than as a precise Huai-Si northern corridor reference; later production tiles should still control the Huai River / Shouchun-Hefei-Xuzhou-Guangling corridor separately.
- Required changes: none for this session.
- Reject/rework reason: none.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
