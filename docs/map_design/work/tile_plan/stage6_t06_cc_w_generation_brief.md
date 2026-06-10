# Stage 6 Production Tile Brief: T06_CC_W v1

## Identity

- Planned candidate id: `tile_t06_cc_w_v1`
- Tile id: `T06_CC_W`
- Stage: Stage 6, tile production
- Status: superseded by controlled no-city terrain pipeline
- Date: 2026-06-08
- Runtime impact: none

## Tile Scope

From `tile_index_v2_final_candidate.md`:

- Role: central west
- Concept crop: `334,251,586,439`
- Output target at 4x: `2344 x 1756`
- Direct neighbors:
  - North: `T02_NC_W`
  - East: `T07_CC_E`
  - South: `T10_SC_W`
  - West: `T05_WC`
- Diagonal context:
  - `T01_NW`
  - `T03_NC_E`
  - `T09_SW`
  - `T11_SC_E`

## Purpose

Produce the first Stage 6 production tile candidate from the strongest validated visual anchor: Guanzhong-Henan / Luoyang-Changan / central-west corridor.

This tile should prove that the accepted representative direction can become a production tile while preserving:

- consistent low oblique perspective,
- compatible paper/ink/material language,
- controlled city scale,
- terrain plausibility,
- overlap-ready edges.

## Scope Correction

The full `T06_CC_W` production scope is not a two-city-only crop.

The earlier "two cities only" rule belonged to the Stage 4 Guanzhong-Henan representative reference crop. Carrying that rule into the full Stage 6 production tile was a scope error.

See `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`.

## Required References

Primary perspective/style reference:

- `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`

Secondary consistency references:

- `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
- `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`

Planning/geography controls:

- `docs/map_design/work/tile_plan/tile_index_v2_final_candidate.md`
- `docs/map_design/work/tile_plan/stage6_tile_quality_gate_v1.md`
- `docs/map_design/work/national_concept/terrain_plausibility_audit_v1.md`
- `docs/map_design/work/national_concept/actual_terrain_audit_v1.md`

## Geography Controls

This tile covers the central-west anchor zone. It should read as:

- Guanzhong-Henan / Luoyang-Changan strategic corridor.
- Bounded plains, not a universal flatland.
- Yellow River / Wei-Luo-Yiluo logic at regional scale.
- Southern mountain / Qinling-Funiu edge influence.
- Road/pass/corridor logic tied to terrain, not bright UI lines.

Avoid:

- A dominant vertical river immediately beside Luoyang.
- A mountain-basin framing like Bashu/Hanzhong.
- A fully flat, structureless plain.
- Random mini-settlements inherited from national concept caveats.

## Seam And Edge Requirements

Because this is the first production tile, direct seam previews are initially `PENDING_NEIGHBOR`. The generated tile still needs edge discipline:

- West edge must leave plausible continuation into `T05_WC` Bashu/Hanzhong approach.
- East edge must leave plausible continuation into `T07_CC_E` Henan/Huai-Si transition.
- North edge must leave plausible continuation into `T02_NC_W` northern corridor / Guanzhong edge.
- South edge must leave plausible continuation into `T10_SC_W` Jingzhou/Yangtze transition.
- No key city, river confluence, pass, or heavy landmark should sit exactly on the hard edge.
- River, road, field, hill, and paper texture should continue naturally into overlap bands.

## Hard Gates

This tile cannot be marked `PASS` unless it satisfies `stage6_tile_quality_gate_v1.md`:

- Perspective/style gate.
- Seam/overlap gate.
- Terrain/geography gate.
- Pseudo-settlement gate.
- Runtime isolation gate.

## Superseded Prompt Draft

```text
Oblique Chinese ink-wash production map tile, 4:3 regional crop, same low camera, paper color, city scale, river width, field density, and line weight as the accepted Guanzhong-Henan representative tile. Central-west Guanzhong-Henan / Luoyang-Changan corridor: bounded plains, two or three controlled walled city footprints only, Yellow River / Wei-Luo-Yiluo water logic with mostly horizontal river hierarchy, southern Qinling-Funiu foothill edge, subtle road and pass corridors following terrain, fields and sparse tree clusters. Edges must remain overlap-friendly for neighboring tiles. No dominant vertical river beside Luoyang, no mountain-basin framing, no random mini-cities, no villages, no temples, no roadside compounds, no riverbank hamlets, no extra forts, no labels, no text, no UI, no watermark.
```

This prompt is superseded because "two or three controlled walled city footprints only" undercounts the full production tile scope.

## Corrected Prompt Direction

This direction is superseded by `stage6_t06_no_city_terrain_brief_v1.md`.

Do not generate another all-in-one T06 tile with city hierarchy in the terrain image.

The next image-generation prompt must request a no-city terrain base only. City stamps and roads will be deterministic later.

The later deterministic city layer should preserve this ownership / weight direction:

- Global primary overlap footprints: Chang'an and Luoyang/Henan anchor.
- T06 center standard anchors: Nanyang, Xiangyang, Shangyong, and Yiling.
- Small/subdued or delegated anchors: Xinye and Hanzhong.
- T07/global context anchors: Chenliu, Guandu, and Xuchang.
- Edge/overlap city zones should remain seam-aware and not become hard-edge landmarks.
- No random non-data settlements.

## Review Checklist

- Perspective/style matches `rep_guanzhong_henan_v4`.
- City scale/detail matches accepted representative direction.
- Plains are bounded by terrain and river logic, not empty flatland.
- Yellow River / Wei-Luo-Yiluo logic is plausible and not visually overpowering.
- Southern foothill edge supports corridor logic without turning the tile into a basin.
- Roads/pass corridors read as geography, not UI lines.
- Tile edges remain plausible for later overlap with north/east/south/west neighbors.
- No random mini-city, village, temple, roadside compound, riverbank hamlet, or extra fort.
- Runtime impact remains none.

## Next Action

- Use `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md` for the next docs-only terrain-base candidate.
- Do not generate cities, villages, forts, pass buildings, or a random road network in the terrain base.
- Do not promote anything to `assets/maps/` or modify `src/`.

## Generation Attempts

- 2026-06-08: built-in imagegen attempt 1 produced `tile_t06_cc_w_v1`; author marked `REWORK` because the terrain/geography read too close to Jianghuai/Jiangdong water-network grammar for `T06_CC_W`.
- 2026-06-08: two built-in imagegen attempts for a stricter v2 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen retry attempt 4 succeeded with a shorter prompt.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v2.png`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v2_manifest.md`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v2_overlay.html`.
- 2026-06-09: scope audit found that full `T06_CC_W` production scope is not a two-city-only crop. `tile_t06_cc_w_v2` remains useful as a style/geography reference, but should be treated as `REWORK` for full production scope.
- 2026-06-09: corrected full-scope built-in imagegen attempt 5 failed with `ServerError`; no image produced.
- 2026-06-09: corrected full-scope built-in imagegen attempt 6 with shorter prompt failed with `ServerError`; no image produced.
- 2026-06-09: corrected full-scope built-in imagegen attempt 7 with minimal prompt failed with `ServerError`; no image produced.
- 2026-06-09: corrected full-scope built-in imagegen attempt 8 succeeded with a short city-hierarchy prompt.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v3.png`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v3_manifest.md`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v3_overlay.html`.
- 2026-06-09: producer review flagged `tile_t06_cc_w_v3` Chang'an as enormously oversized. Author marked v3 `REWORK`.
- 2026-06-09: rework attempt 9 (`v4`) fixed Chang'an scale but produced a busier river/road network; discarded as an intermediate generated image, not saved to workspace.
- 2026-06-09: rework attempt 10 succeeded with stricter city-scale and sparse-water prompt.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v5.png`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v5_manifest.md`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v5_overlay.html`.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
