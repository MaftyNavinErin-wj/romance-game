# Stage 2 Art Kit v2 Manifest

## Identity

- Candidate id: `stage2_art_kit_v2`
- Stage: Stage 2 art kit / weak-slot reference pass
- Verdict: `REFERENCE_ONLY`
- Date: 2026-06-08
- Author/session: Codex generation pass after producer approval of `stage2_art_kit_v2_generation_brief.md`

## Scope

- Runtime impact: none
- These images are not runtime assets.
- These images do not enter `assets/maps/`.
- This pass does not modify `src/`.
- These images are not final base-map art.
- These images are not city, hex, road, or river data authority.
- Later stages may use them only as style, texture, pass/fort, and terrain-reference material after producer review.

## Files

- Repo output directory: `docs/map_design/work/art_kit/`
- Review overlay path: none
- Seam preview path(s): none
- Generated source path(s): `C:\Users\jie.wang\.codex\generated_images\019ea55f-240d-70a0-9f76-04978ac233d7\`
- Brief path: `docs/map_design/work/art_kit/stage2_art_kit_v2_generation_brief.md`
- Reference image path(s): v1 images 01/02 for city/capital style; v1 images 07/08 as negative references for over-dense forest.

| Repo file | Source file | Actual size | Class | Author pre-review |
|---|---|---:|---|---|
| `stage2_art_kit_v2_01_pass_fort_reference.png` | `ig_0462764ebbcf0d11016a264a1e61d0819a88ae43dff99b621e.png` | 1672 x 941 | reference-only | Stronger defensive checkpoint than v1 image 03: clear gate, wall mass, and road/pass control. Keep pending producer review. |
| `stage2_art_kit_v2_02_foothill_forest_reference.png` | `ig_0462764ebbcf0d11016a264b2b618c819a9e53f2524b965319.png` | 1672 x 941 | reference-only | Lighter and more open than v1 forest/mountain examples; still needs producer check for whether tree density is low enough. |
| `stage2_art_kit_v2_03_mountain_pass_reference.png` | `ig_0462764ebbcf0d11016a26507e2de8819ab78588352804ea7b.png` | 1535 x 1024 | reference-only | Clear terrain-only mountain pass with exposed ridges and a readable valley route. No obvious pseudo-city marks in light review. |
| `stage2_art_kit_v2_04_road_pass_reference.png` | `ig_0462764ebbcf0d11016a264e8d31ac819aa7d37f3dbb22e59f.png` | 1672 x 941 | reference-only | Road/pass route logic is readable and forest density is lower than v1 image 08. No obvious pseudo-city marks in light review. |

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt source: `stage2_art_kit_v2_generation_brief.md`.
- Negative constraints: no labels, UI, hex grid, ownership colors, units, random readable cities, random small forts, temples, courtyard compounds, huts, settlement icons, castle icons, repeated pseudo-settlement marks, modern roads, or modern cartography.
- Intended size: tool default.
- Actual size: listed above.
- Reference roles: reference-only style and terrain grammar material.

## Prompt Notes

The four generated prompts targeted:

- A pass fort / defensive checkpoint matching v1 images 01/02 more closely than v1 image 03.
- A lighter foothill forest terrain patch.
- A terrain-only mountain pass with lower-density trees.
- A road/pass corridor with lower-density trees and non-UI route logic.

The mountain-pass prompt initially failed twice through the generator stream. A shorter fallback prompt succeeded and is saved as `stage2_art_kit_v2_03_mountain_pass_reference.png`.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: copied generated PNGs from the Codex generated image cache into `docs/map_design/work/art_kit/` with stable names.

## Geography/Data Review

- City anchor overlay: none.
- River/road overlay: none.
- Tile/crop boundary: none.
- Coordinate drift notes: not applicable; this is not geography-authoritative material.
- Movement budget exceeded: no data movement proposed.

## Art Review

- City/fort clarity: v2_01 has a clearer defensive checkpoint profile than v1_03 and is the current best pass-fort reference candidate.
- Field/farmland detail: not targeted in v2.
- Forest/foothill detail: v2_02 is more open than prior dense examples but remains pending producer judgment.
- Riverbank/water detail: not targeted in v2.
- Mountain/pass readability: v2_03 and v2_04 have readable mountain/pass and route logic with lower forest density than v1_07/v1_08.
- Style consistency: broadly compatible with the parchment ink-map direction, pending producer review.
- Patch/seam risk: not reviewed; these are not composited or runtime assets.

## Pseudo-City Risk Control

- No obvious random readable cities, small forts, temples, or settlement icons were found in a light author review.
- Producer review is still required before any reference is treated as safe guidance.
- Terrain/background references must continue to ban pseudo-city marks in future production.
- True city and fort assets remain data-controlled for count, identity, and placement.

## Runtime Impact

- Runtime impact: none.
- If promoted, target runtime asset path: not applicable.
- Rollback asset path: not applicable.

## Producer Decision

- Decision: pending producer image review.
- Required changes: producer should decide whether v2_01 replaces v1_03 as the fort/pass-defense reference and whether v2_02/v2_03/v2_04 sufficiently reduce forest density.
- Reject/rework reason: pending.

