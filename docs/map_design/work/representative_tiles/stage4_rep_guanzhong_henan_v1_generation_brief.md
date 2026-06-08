# Stage 4 Representative Tile Brief: Guanzhong-Henan v1

## Identity

- Planned candidate id: `rep_guanzhong_henan_v1`
- Stage: Stage 4, representative tile
- Status: generation brief; candidate produced as `rep_guanzhong_henan_v1.png`
- Date: 2026-06-08
- Runtime impact: none

## Purpose

Validate whether the approved national style and Stage 2 art kit scale into a regional high-detail tile around Guanzhong-Henan / Luoyang-Changan.

This tile should test:

- Capital/city scale at regional strategy-map zoom.
- Yellow River / Wei River / Guanzhong plain relationship.
- Qinling foothill barrier and pass logic.
- Chang'an-Luoyang road/pass corridor.
- Defensive pass-fort grammar.
- Removal of v5's road/river mini-settlement problem.
- Historical pass placement discipline: pass/fort landmarks are allowed only if they correspond to a plausible named historical pass in the correct region; otherwise remove the pass landmark.

## Inputs

- National reference: `docs/map_design/work/national_concept/national_concept_v5.png`
- Stage 1 caveat: v5 style is approved, but road/river mini-settlement marks must not be inherited.
- Tile plan: `docs/map_design/work/tile_plan/tile_index_v1.md`
- Approved art kit references:
  - `docs/map_design/work/art_kit/stage2_art_kit_v1_01_capital_reference.png`
  - `docs/map_design/work/art_kit/stage2_art_kit_v1_02_city_reference.png`
  - `docs/map_design/work/art_kit/stage2_art_kit_v2_01_pass_fort_reference.png`
  - `docs/map_design/work/art_kit/stage2_art_kit_v1_05_farmland_reference.png`
  - `docs/map_design/work/art_kit/stage2_art_kit_v1_06_riverbank_reference.png`

## Planned Output

- Image path: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v1.png`
- Manifest path: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v1_manifest.md`
- Overlay path: optional after image candidate exists
- Status after generation: `REFERENCE_ONLY` / `REWORK` / `PASS` pending producer review

## Prompt Spec

Use the approved Project Romance national ink-map style:

- Light Chinese ink wash and watercolor on aged rice paper.
- Low saturation, restrained contrast, fine atlas brushwork.
- Clean enough for future labels, units, fog, roads, and selection overlays.

Regional content:

- West Guanzhong / Chang'an plain.
- Wei River farmland.
- Qinling foothills and ridge barrier to the south.
- Yellow River / Hangu-Tong pass corridor.
- Luoyang / Henan plain to the east.
- Natural road/pass connection between Chang'an and Luoyang.

Controlled readable landmarks:

- One larger walled capital footprint near Chang'an / Guanzhong.
- One larger walled capital footprint near Luoyang / Henan.
- Optional: one compact defensive pass fort/checkpoint only if historically placed as a named pass such as Hulao, Hangu, or Tongguan.

Scale rules:

- The two city footprints must be map landmarks, not large city-scene illustrations.
- The pass fort, if included, must be smaller than the city footprints and historically anchored.
- Terrain, rivers, and mountain belts must remain visually more important than any single city.

Pseudo-settlement suppression:

- No random mini-cities.
- No village clusters.
- No temples.
- No courtyard compounds.
- No roadside buildings.
- No riverbank hamlets.
- No random small forts.
- No repeated settlement icons.
- Only the two controlled city footprints and one controlled pass fort may read as architecture.
- If the pass cannot be clearly placed at a historically plausible named pass location, omit it.

Global negatives:

- No text.
- No labels.
- No legend.
- No compass.
- No hex grid.
- No UI icons.
- No flags.
- No ownership colors.
- No units.
- No modern roads.
- No modern borders.
- No satellite style.
- No rectangular patch seams.
- No floating castle icons.
- No watermark.
- No saturated blue water.
- No dark dirty paper.
- No European castles.
- No fantasy geography.
- No game-board roads.

## Generation Attempts

- 2026-06-08: built-in imagegen attempt 1 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen attempt 2 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen retry with a shorter prompt succeeded; image copied to `rep_guanzhong_henan_v1.png`.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified by this brief.
