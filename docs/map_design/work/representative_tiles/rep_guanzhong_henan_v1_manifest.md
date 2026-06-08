# Representative Tile Manifest: Guanzhong-Henan v1

## Identity

- Candidate id: `rep_guanzhong_henan_v1`
- Stage: Stage 4, representative tile
- Verdict: `REWORK`
- Date: 2026-06-08
- Runtime impact: none

## Scope

- This is a representative validation tile candidate.
- This is not final national tile art.
- This is not a runtime asset.
- This image does not enter `assets/maps/`.
- This image is not city, road, river, or hex data authority.
- Later work may use it only after producer review to judge regional style/detail scaling.

## Files

- Repo output path: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v1.png`
- Brief path: `docs/map_design/work/representative_tiles/stage4_rep_guanzhong_henan_v1_generation_brief.md`
- Overlay path: none yet
- Seam preview path(s): none
- Generated source path: `C:\Users\jie.wang\.codex\generated_images\019ea605-b92c-7c70-9bf1-8d31f3563513\ig_01d87cd3614d11e8016a267cad8fe48196950f5114a7167026.png`
- Actual size: 1672 x 941 PNG

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt mode: shortened retry prompt after two built-in `ServerError` failures.
- Intended use: validate the approved national ink-map style at regional representative-tile scale.
- Key visual constraints:
  - Two controlled walled capital footprints only.
  - One compact pass fort/checkpoint only.
  - No random road/river mini-settlements.
  - Roads remain natural hairline geography, not UI lines.
  - Rivers, mountains, farmland, and terrain remain more important than any single city.

## Prompt Summary

The successful prompt requested a Guanzhong-Henan / Luoyang-Changan regional historical map tile in light Chinese ink wash and watercolor, including:

- Chang'an/Guanzhong plain.
- Luoyang/Henan plain.
- Wei River / Yellow River corridor.
- Qinling foothills and mountain barrier.
- Hangu/Tong pass chokepoint.
- Two controlled walled capital footprints and one compact defensive pass fort.
- Explicit suppression of random mini-cities, village clusters, temples, courtyard compounds, roadside buildings, riverbank hamlets, and repeated settlement icons.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Workspace copy: copied generated PNG from Codex generated image cache into `docs/map_design/work/representative_tiles/`.

## Author Light Review

- City scale: usable for representative review. Two city footprints are readable but not oversized full city-scene illustrations.
- Pass fort: usable as a single controlled checkpoint; it reads as smaller than the city footprints.
- Pseudo-settlement suppression: improved over v5. No obvious random mini-city chain along roads or rivers in light review.
- River hierarchy: readable, but the main river may be visually wide for a future game background and should be reviewed.
- Terrain readability: Qinling/foothill barrier and pass corridor are legible.
- Forest density: southern mountain/foothill forests may be dense and should be reviewed for future label/unit readability.
- Style consistency: broadly compatible with the approved ink-map direction, pending producer judgment.
- Runtime readiness: not reviewed and not applicable.

## Producer Review

- Decision: `REWORK`.
- Producer note: the tile should have only the two current game cities unless a pass is historically grounded. A pass/fort may be added only when it corresponds to a plausible named historical pass in the correct location, such as Hulao, Hangu, or Tongguan. This keeps the art useful for a future pass system.
- Current issue: the v1 pass fort is not clearly anchored to a historically correct named pass location. If a future version cannot place the pass accurately, the pass should be removed rather than used as decorative terrain.
- Rule for v2: pass landmarks are allowed only as named, historically placed strategic nodes; otherwise generate the region with two cities and terrain/road corridor only.

## Review Questions

- Are two city footprints plus one pass fort the right density for this representative region?
- Is the main river too visually dominant?
- Is the southern mountain/forest density acceptable for future labels and unit overlays?
- Does this successfully remove the road/river mini-settlement problem from v5?
- Should this tile become a Stage 4 style reference, or should v2 be regenerated with thinner rivers / lower forest density?
- If a pass is retained in v2, which named pass should be targeted: Hulao east of Luoyang, Hangu west of Luoyang / Sanmenxia-Lingbao corridor, or Tongguan at the Guanzhong-Central Plains transition?

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.

## Producer Decision

- Decision: `REWORK`.
- Required changes: regenerate v2 with either a historically placed named pass or no pass landmark.
- Reject/rework reason: current pass fort is not clearly historically located, reducing future system value.
