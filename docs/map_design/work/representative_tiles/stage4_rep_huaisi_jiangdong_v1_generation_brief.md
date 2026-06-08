# Stage 4 Representative Tile Brief: Huai-Si / Jiangdong v1

## Identity

- Planned candidate id: `rep_huaisi_jiangdong_v1`
- Stage: Stage 4, representative tile
- Status: candidate produced; producer accepted
- Date: 2026-06-08
- Runtime impact: none

## Purpose

Generate the third Stage 4 representative tile after the approved Guanzhong-Henan and Bashu-Hanzhong representative directions.

This tile tests whether the same perspective, city treatment, and terrain-material language can represent lowland water-network geography instead of open northern plains or enclosed mountain basins.

## Approved Inputs

- Stage 1 national reference: `docs/map_design/work/national_concept/national_concept_v5.png`
- Stage 2 art kit: approved as `REFERENCE_ONLY`
- Stage 3 tile plan: `docs/map_design/work/tile_plan/tile_index_v1.md`
- Perspective/style reference 1: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
- Perspective/style reference 2: `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`

## Crop Target

From `tile_index_v1.md`:

- Candidate id: `rep_huaisi_jiangdong_v1`
- Concept crop: `1030,530,520,310`
- Purpose: Huai-Si corridor, Jiangdong/lower Yangtze water network, ferries, dense but controlled settlement texture
- Review risk: river hierarchy, random mini-city marks, label/overlay breathing room

## Geography Control Facts

- This region should read as a lowland river-and-waterway network, not as a mountain basin.
- Huai-Si / Jiangdong should emphasize low plains, branching streams, marshy/wet field edges, ferry/crossing logic, and distant low hills rather than dominant mountain walls.
- The main river/water corridor should be legible, but water should not become saturated or visually louder than cities and terrain structure.
- Roads should follow levees, ferries, and dry corridor logic; they must not become bright UI lines.

## Producer Constraints Carried Forward

- Keep perspective consistent with `rep_guanzhong_henan_v4` and `rep_bashu_hanzhong_v1`.
- Keep city treatment and terrain-material language consistent with the first two accepted representative directions.
- Differentiate geography by composition, not by switching art style.
- Suppress pseudo-settlement marks inherited from Stage 1 caveat.
- Do not invent dense random towns, temples, roadside compounds, riverbank hamlets, or extra forts.
- Do not promote any output to runtime.

## v1 Target

- Wide horizontal Chinese ink-wash regional map tile.
- Same lower oblique map perspective as the first two representative candidates.
- Lowland water-network geography: Huai-Si corridor and Jiangdong/lower-Yangtze approach.
- Branching waterways, controlled ferries/crossing logic, wet fields, levee-like paths, and distant low hills.
- Very few controlled walled city footprints only if needed for scale.
- No mountain-basin framing; hills should remain lower and more distant than Bashu-Hanzhong.

## Prompt Constraints

- Keep v4/Bashu-like perspective and map scale.
- Show lowland water network, not a mountain basin.
- Use branching rivers and wet fields.
- Keep waterways subdued blue-gray and hierarchically controlled.
- Roads must be natural levee/valley hairlines, not UI lines.
- No random mini-cities.
- No villages.
- No temples.
- No courtyard compounds.
- No roadside buildings.
- No riverbank hamlets.
- No extra forts.
- No repeated settlement icons.
- No labels, text, UI, or watermark.

## Candidate Prompt Draft

```text
Wide oblique Chinese ink-wash map, same low camera and style as previous tiles. Huai-Si and Jiangdong lowland water network: branching rivers, wet fields, levee roads, ferries, distant low hills. Very few controlled walled city footprints only. No villages, forts, temples, roadside buildings, riverbank hamlets, labels or text.
```

## Review Checklist

- Perspective matches `rep_guanzhong_henan_v4` and `rep_bashu_hanzhong_v1`.
- Region reads as lowland water network, not another mountain basin.
- Water hierarchy is legible but not overpowering.
- Ferries/crossings and roads read as geography, not UI lines.
- Wet fields and tree clusters do not become pseudo-settlements.
- City/fort density remains controlled.
- Runtime impact remains none.

## Generation Attempts

- 2026-06-08: built-in imagegen attempt 1 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen attempt 2 with shorter prompt failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen attempt 3 with minimal prompt failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen retry attempt 4 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen retry attempt 5 with shorter prompt failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen retry attempt 6 with minimal prompt failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen retry attempt 7 succeeded with a short controlled prompt.
- Added `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`.
- Added `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1_manifest.md`.

## Next Action

- Proceed to the next approved map-design step after producer direction.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
