# Stage 2 Art Kit v2 Generation Brief

## Identity

- Planned candidate id: `stage2_art_kit_v2`
- Stage: Stage 2 art kit / representative reference
- Status: generation brief only
- Runtime impact: none
- Runtime promotion: forbidden

This brief defines the next approved discussion target for Stage 2. It does not create runtime assets and does not change `src/` or `assets/maps/`.

## Inputs To Preserve

Use Stage 2 v1 producer review as the control source:

- Keep `stage2_art_kit_v1_01_capital_reference.png` as the large capital / major city style reference.
- Keep `stage2_art_kit_v1_02_city_reference.png` as the normal city style reference.
- Keep `stage2_art_kit_v1_05_farmland_reference.png` as the farmland/field reference, subject to pseudo-city screening.
- Keep `stage2_art_kit_v1_06_riverbank_reference.png` as the small-river riverbank reference, subject to pseudo-city screening.
- Use `stage2_art_kit_v1_04_pass_fort_reference.png` only as a pass/checkpoint terrain reference, not as proof that the fort asset is solved.
- Do not use `stage2_art_kit_v1_03_fort_reference.png` as a fort production reference.
- Use `stage2_art_kit_v1_07_mountain_reference.png` and `stage2_art_kit_v1_08_road_pass_reference.png` only for structure/route logic; reduce hillside forest density.

## v2 Goal

Do not regenerate the whole kit. Stage 2 v2 should fill the weak slots and correct the visible risks:

1. A real pass fort / defensive checkpoint reference that matches the visual language of v1 images 01 and 02.
2. A foothill forest reference with lighter density and no pseudo-city marks.
3. A mountain/pass reference with clear ridges, valleys, and lower forest density.
4. A road/pass corridor reference with readable route logic and lower forest density.

Optional only if needed after review:

- A second fort variant: ferry fort / river crossing fort.

## Required v2 Output Names

Recommended names if generated:

- `stage2_art_kit_v2_01_pass_fort_reference.png`
- `stage2_art_kit_v2_02_foothill_forest_reference.png`
- `stage2_art_kit_v2_03_mountain_pass_reference.png`
- `stage2_art_kit_v2_04_road_pass_reference.png`
- `stage2_art_kit_v2_manifest.md`

If a ferry-fort variant is generated:

- `stage2_art_kit_v2_05_ferry_fort_reference.png`

## Visual Requirements

### Pass Fort / Defensive Checkpoint

Must:

- Match the calmer ink-and-watercolor style of v1 images 01 and 02.
- Read as a fortified defensive node, not a courtyard, garden, village, or UI icon.
- Show compact walls, gates, defensive mass, and a relationship to a road, pass, ridge, river crossing, or chokepoint.
- Stay smaller and tighter than a city; it should be strategic infrastructure, not a full city.
- Feel painted into the terrain.

Avoid:

- Rough sketch look that mismatches 01/02.
- Tiny courtyard or estate compound.
- Floating castle icon.
- Straight UI-like frame.
- Random repeated small forts in the background.

### Foothill Forest

Must:

- Read as map terrain texture, not dense decorative woodland.
- Use varied but controlled tree clusters with visible ground/paper gaps.
- Leave enough visual breathing room for labels, units, roads, and future overlays.

Avoid:

- Dense continuous forest mats.
- Hidden temples, huts, small forts, walls, or pseudo-city shapes.
- Dark blocks that overpower map labels.

### Mountain Pass

Must:

- Show readable ridges, valleys, slopes, and a believable pass corridor.
- Keep tree density lower than v1 images 07 and 08.
- Make movement logic legible without turning the route into a UI line.

Avoid:

- Pure decorative mountains unrelated to pass logic.
- Excessive forest cover.
- Random buildings or settlement marks.

### Road / Pass Corridor

Must:

- Show route logic through terrain: road, slope, pass, riverbank, or saddle.
- Keep the route natural and geographic, not a thick game-board path.
- Reduce mountain forest density compared with v1 image 08.

Avoid:

- Over-strong engineered road.
- UI-like route marks.
- Random city/fort/temple marks along the path.

## Global Negative Constraints

Apply to every v2 image:

- No city labels.
- No UI.
- No hex grid.
- No ownership colors.
- No units.
- No random readable cities.
- No random small forts.
- No temples or courtyard compounds in terrain texture.
- No castle icons.
- No repeated pseudo-settlement marks.
- No modern roads or modern cartographic styling.
- No final-map or runtime claim.

## Review Gate

Before Stage 2 is considered ready to proceed toward Stage 3 tile planning:

- Fort/pass-defense reference must be accepted or explicitly deferred.
- Forest-density issue must be corrected or explicitly carried as a known risk.
- Terrain references must pass pseudo-city screening.
- All v2 files must remain `REFERENCE_ONLY`.
- Manifest must record producer verdict per image.

## Proposed Next Action

Producer approval needed before generation:

- If approved, generate only the v2 weak-slot set above.
- If not approved, revise this brief before any image generation.

