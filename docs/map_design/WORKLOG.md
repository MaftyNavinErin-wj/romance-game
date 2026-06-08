# Map Design Worklog

## Current State

- Current approved runtime map asset: unchanged from the existing game state.
- Current map-art workflow status: Stage 1 national concept, Stage 2 art-kit references, and Stage 3 provisional tile plan approved.
- Active stage: Stage 4, representative tiles.
- Active candidate: `stage4_rep_huaisi_jiangdong_v1_generation_brief.md`, image candidate pending generation.
- Next proposed action: retry built-in image generation for `rep_huaisi_jiangdong_v1`.

## Decisions

### 2026-06-07

- Pivoted away from continuing Luoyang-Changan crop `v10`.
- Adopted a national-first map-art workflow.
- Current city/hex coordinates are review anchors, not immutable final bitmap constraints.
- New map-art exploration remains inside `docs/map_design/` until producer approval.
- Runtime promotion to `assets/maps/` requires a separate explicit approval.
- Producer approved `MAP_MASTER_WORKFLOW_v1.md` as the Stage 0 gate: national-first workflow, elastic coordinate policy, docs-only workspace, and manifest/overlay review discipline are accepted.
- Created `national_concept_v1` as the first Stage 1 national low-resolution concept candidate. Author pre-review: visually useful art grammar, but not geography PASS; national outline, coastline, river hierarchy, and city placement need tighter control before Stage 1 can pass.
- Created `national_concept_v2` as the preferred Stage 1 national low-resolution concept candidate. Author pre-review: v2 has a stronger national composition, clearer Yellow River/Yangtze hierarchy, more plausible corridor logic, and is ready for producer review.
- Producer feedback on v2: style is acceptable, but national-scope scale grammar is wrong. Cities and terrain details are too large; one city should not approach the visual size of Taiwan or another major regional feature. Producer prefers v1 over v2 as the style direction.
- Created `national_concept_v3` to preserve the calmer v1-like direction while correcting national scale. Cities, forests, fields, roads, and rivers now read as smaller map texture/detail marks.
- Producer feedback on v3: scale is improved, but mountains and broad terrain structure largely disappear. The middle reads as one large flat plain. Stage 1 needs a rough terrain plausibility audit before more generation.
- Added `terrain_plausibility_audit_v1.md` to define the broad terrain skeleton required for v4: western highlands, Qinling, Taihang/northern belt, Funiu-Dabie, Wushan/Three Gorges, Jiangnan/Wuling/Nanling, southeast coastal hills, bounded plains/basins, and major river hierarchy.
- Created `national_concept_v4` using the terrain audit. Author pre-review: v4 is the preferred Stage 1 candidate so far because it combines v1-like organic style, v3-like national-scale detail sizing, and a more visible mountain/basin/river skeleton.
- Actual-terrain audit on v4: v4 remains `REWORK` if judged against real China terrain. It is conceptually stronger but still weak on Qinling as an east-west divide, North China Plain/Taihang relationship, Sichuan/Hanzhong basin logic, and Wushan/Three Gorges/Yiling choke.
- Created `national_concept_v5` using the actual-terrain audit. Author pre-review: v5 is the preferred Stage 1 candidate so far because it keeps v4's style/scale while making the North China Plain more open, the Taihang-like edge clearer, and the basin/corridor relationships more legible.
- Producer approved `national_concept_v5` as the Stage 1 national reference direction, with one caveat: some road/river details read as small settlement or mini-city marks, and later stages must remove/suppress these rather than inherit them into production terrain.

## Latest Files

- Added `MAP_MASTER_WORKFLOW_v1.md`.
- Added `README.md`.
- Added `CANDIDATE_MANIFEST_TEMPLATE.md`.
- Archived previous Luoyang crop exploration files under `archive/2026-06-04_to_07_luoyang_crop_exploration/`.
- Created empty active work folders under `work/`.
- Added `work/national_concept/national_concept_v1.png`.
- Added `work/national_concept/national_concept_v1_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v1.md`.
- Added `work/national_concept/national_concept_v2.png`.
- Added `work/national_concept/national_concept_v2_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v2.md`.
- Added `work/national_concept/national_concept_v3.png`.
- Added `work/national_concept/national_concept_v3_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v3.md`.
- Added `work/national_concept/terrain_plausibility_audit_v1.md`.
- Added `work/national_concept/national_concept_v4.png`.
- Added `work/national_concept/national_concept_v4_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v4.md`.
- Added `work/national_concept/actual_terrain_audit_v1.md`.
- Added `work/national_concept/national_concept_v5.png`.
- Added `work/national_concept/national_concept_v5_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v5.md`.
- Added `work/representative_tiles/rep_guanzhong_henan_v2.png`.
- Added `work/representative_tiles/rep_guanzhong_henan_v2_manifest.md`.
- Added `work/representative_tiles/rep_guanzhong_henan_v3.png`.
- Added `work/representative_tiles/rep_guanzhong_henan_v3_manifest.md`.
- Added `work/representative_tiles/rep_guanzhong_henan_v4.png`.
- Added `work/representative_tiles/rep_guanzhong_henan_v4_manifest.md`.
- Added `work/representative_tiles/stage4_rep_bashu_hanzhong_v1_generation_brief.md`.
- Added `work/representative_tiles/rep_bashu_hanzhong_v1.png`.
- Added `work/representative_tiles/rep_bashu_hanzhong_v1_manifest.md`.
- Added `work/representative_tiles/stage4_rep_huaisi_jiangdong_v1_generation_brief.md`.

## 2026-06-08 Stage 2 Art Kit v1 Recovery

- Recovered Stage 2 art kit v1 images from `C:\Users\jie.wang\.codex\generated_images\019ea517-5195-7910-b06b-96aa156a16a3\` after the previous CLI stream interruption.
- Copied the recovered PNGs into `docs/map_design/work/art_kit/` with stable `stage2_art_kit_v1_*_reference.png` names.
- Created `docs/map_design/work/art_kit/stage2_art_kit_v1_manifest.md`.
- Created `docs/map_design/work/art_kit/README.md`.
- All recovered images are marked `REFERENCE_ONLY`.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified by this recovery pass.

## 2026-06-08 Stage 2 Art Kit v1 Producer Review

- Recorded producer review notes in `docs/map_design/work/art_kit/stage2_art_kit_v1_manifest.md`.
- Producer accepted 01 and 02 as useful capital/city references.
- Producer rejected 03 as a fort reference because it mismatches 01/02, feels too rough and courtyard-like, and lacks defensive fort presence.
- Corrected visible-content categories: 04 is pass/fort-terrain reference, 05 is farmland/field reference, and 06 is small-river riverbank reference.
- Producer marked 07 mountain structure and 08 route/pass logic as usable with a forest-density caution.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified by this review pass.

## 2026-06-08 Stage 2 Art Kit v2 Brief

- Added `docs/map_design/work/art_kit/stage2_art_kit_v2_generation_brief.md`.
- The brief narrows the next Stage 2 generation pass to weak slots only: pass fort / defensive checkpoint, lighter foothill forest, lower-density mountain pass, and lower-density road/pass corridor.
- The brief preserves v1 images 01, 02, 05, and 06 as useful references and explicitly rejects v1 image 03 as fort guidance.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 2 Art Kit v2 Generation

- Generated the approved weak-slot Stage 2 v2 reference set with the built-in image generation tool.
- Added `stage2_art_kit_v2_01_pass_fort_reference.png`.
- Added `stage2_art_kit_v2_02_foothill_forest_reference.png`.
- Added `stage2_art_kit_v2_03_mountain_pass_reference.png`.
- Added `stage2_art_kit_v2_04_road_pass_reference.png`.
- Added `docs/map_design/work/art_kit/stage2_art_kit_v2_manifest.md`.
- Author light review: v2_01 is a stronger defensive checkpoint than v1_03; v2_02/v2_03/v2_04 reduce the prior forest-density issue; no obvious pseudo-city marks found in light review.
- All v2 images remain `REFERENCE_ONLY`, pending producer image review.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 2 Art Kit v2 Producer Review

- Producer accepted all four Stage 2 v2 images as usable references.
- `stage2_art_kit_v2_01_pass_fort_reference.png` is now the preferred pass-fort / defensive-checkpoint reference over rejected v1 image 03.
- `stage2_art_kit_v2_02_foothill_forest_reference.png`, `stage2_art_kit_v2_03_mountain_pass_reference.png`, and `stage2_art_kit_v2_04_road_pass_reference.png` are accepted as lighter forest / mountain-pass / road-pass references.
- All v2 images remain `REFERENCE_ONLY`; they are not runtime assets and were not promoted to `assets/maps/`.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified by this review pass.

## 2026-06-08 Stage 3 Tile Plan Draft v1

- Created provisional Stage 3 tile plan draft based on approved `national_concept_v5`.
- Added `docs/map_design/work/tile_plan/tile_index_v1.md`.
- Added `docs/map_design/work/tile_plan/tile_grid_v1.html`.
- Draft uses a 4 x 3 national tile grid with 20% overlap as the first review model.
- Draft proposes three Stage 4 representative crop candidates: Guanzhong-Henan / Luoyang-Changan, Bashu-Hanzhong, and Huai-Si / Jiangdong.
- Caveat carried forward: road/river pseudo-settlement marks from v5 are explicitly banned from later tile production prompts and review.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 3 Tile Plan Producer Review

- Producer approved the Stage 3 provisional tile plan.
- Approved: 4 x 3 national production tile grid.
- Approved: 20% production-tile overlap for seam control.
- Approved: three independent Stage 4 representative crop candidates.
- Clarified: representative crops are not a stitched set and do not need mutual overlap.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile Brief

- Added `docs/map_design/work/representative_tiles/stage4_rep_guanzhong_henan_v1_generation_brief.md`.
- The brief defines the first Stage 4 representative tile target: Guanzhong-Henan / Luoyang-Changan.
- The brief carries forward the Stage 1 caveat: road/river pseudo-settlement marks must be suppressed.
- Built-in image generation was attempted twice and failed with `ServerError`; no image candidate was produced.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v1 Generation

- Retried built-in image generation with a shorter prompt.
- Generated `rep_guanzhong_henan_v1.png`.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v1_manifest.md`.
- Author light review: pseudo-settlement suppression is improved over v5; two cities and one pass fort are controlled. Main river width and southern forest density need producer review.
- Candidate remains `REFERENCE_ONLY`, pending producer image review.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v1 Producer Review

- Producer marked `rep_guanzhong_henan_v1` as `REWORK`.
- Producer clarified pass policy: the tile should have only the two current game cities unless a pass/fort is historically grounded.
- Pass landmarks are allowed only when they are plausible named historical passes in correct locations, such as Hulao, Hangu, or Tongguan, so they can support a future pass system.
- If a pass cannot be placed correctly, it should be removed rather than used as decorative terrain.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v2 Attempt

- Added `docs/map_design/work/representative_tiles/stage4_rep_guanzhong_henan_v2_generation_brief.md`.
- v2 target: two cities only (Chang'an and Luoyang) plus an optional historically anchored Hangu Pass west of Luoyang.
- Built-in image generation was attempted three times and failed with `ServerError`; no v2 image candidate was produced.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v2 Generation

- Retried built-in image generation for `rep_guanzhong_henan_v2`.
- One new built-in attempt failed with `ServerError`; a second shorter prompt succeeded.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v2.png`.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v2_manifest.md`.
- v2 uses the producer-approved fallback path: no pass/checkpoint is drawn, because a misplaced Hangu Pass would be worse than omitting the pass.
- Author light review: only two city footprints are visible; no random mini-cities, villages, temples, roadside buildings, riverbank hamlets, or extra forts found in light review. Rivers are more restrained than v1 overall, though the right-side main river remains visually strong. Forest and mountain density are more controlled than v1.
- Format caution: generated output is `1254 x 1254`, not the same aspect ratio as v1; review as a visual candidate, not a final crop-size candidate.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v2 Producer Feedback

- Producer judged v2 much worse than v1 despite its rule compliance.
- Main issue: v2 loses the stronger v1 regional-map quality and should not be advanced.
- Approved next direction: generate v3 with a v1-like wide regional composition, keep only Chang'an and Luoyang, and omit passes/forts entirely rather than risking incorrect Hangu Pass placement.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v3 Generation

- Retried built-in image generation for `rep_guanzhong_henan_v3`.
- Two built-in attempts failed with `ServerError`; a third minimal prompt succeeded.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v3.png`.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v3_manifest.md`.
- v3 follows the approved direction: v1-like wide regional corridor quality, two cities only, and no pass/checkpoint/fort.
- Author light review: v3 is much stronger than v2 and closer to v1's successful regional composition. Only Chang'an and Luoyang are visible as city footprints; no random mini-cities, villages, temples, roadside buildings, riverbank hamlets, or extra forts found in light review. Eastern/right-side river remains visually significant and should receive producer review.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v3 Perspective Feedback

- Producer accepted v3's lower oblique perspective as usable.
- New hard review constraint: later full-map bottom tiles must keep perspective consistent instead of letting each tile drift independently.
- Practical gate for later tiles: camera height, horizon treatment, city scale, mountain scale, river width, and field-grid density must remain visibly compatible with the approved perspective reference.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v3 Terrain Audit

- Producer questioned the right/eastern city's river geometry: if the city is Luoyang, the large near-vertical river beside it may be wrong.
- Audit conclusion: the concern is valid. Luoyang should read in a Luo River / Yiluo corridor context, with the Yellow River farther north/upper side. A dominant vertical river hugging Luoyang should not become the geography reference.
- Required next candidate correction: keep v3's accepted perspective, but make Luoyang-side water more east-west/horizontal and avoid a large vertical river immediately beside the city.
- Built-in image generation was attempted three times for a corrected v4 perspective/river test and failed with `ServerError`; no v4 image candidate was produced.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan Representative Tile v4 Generation

- Retried built-in image generation for `rep_guanzhong_henan_v4`; the next short prompt succeeded.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`.
- Added `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4_manifest.md`.
- v4 target: preserve v3's accepted lower oblique perspective while correcting the Luoyang-side water structure.
- Author light review: v4 keeps a perspective broadly consistent with v3, restores `1672 x 941` wide tile dimensions, shows only two main city footprints, removes the dominant vertical river beside Luoyang, and places the main river more horizontally on the upper/northern side. Remaining producer-review risks: upper river visual strength, dense plain field/tree marks, and whether small clusters read as pseudo-settlements at game scale.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Guanzhong-Henan v4 Reference Decision

- Producer accepted `rep_guanzhong_henan_v4` as the current Stage 4 first representative reference candidate.
- Carry-forward constraint: perspective consistency remains a hard gate for later representative and production tiles.
- Remaining caution for later review: upper river visual strength, dense plain field/tree marks, and pseudo-settlement risk at game scale.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Bashu-Hanzhong v1 Brief

- Added `docs/map_design/work/representative_tiles/stage4_rep_bashu_hanzhong_v1_generation_brief.md`.
- The brief defines the second representative tile target: Hanzhong-Bashu mountain basin/corridor.
- Geography controls: Hanzhong should read as a long, narrow Han River basin between northern Qinling and southern Daba/Micang mountain systems; the Han River should read broadly west-east through the basin.
- Producer constraints carried forward: preserve `rep_guanzhong_henan_v4` perspective, suppress pseudo-settlements, avoid UI-like roads, and do not promote anything to runtime.
- Image generation not started; waiting for producer approval of the brief.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Bashu-Hanzhong v1 Generation

- Generated `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png` with the built-in image generation tool.
- Added `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1_manifest.md`.
- Attempt log: one built-in `ServerError` failure, then one shorter prompt succeeded.
- Author light review: v1 keeps perspective broadly consistent with `rep_guanzhong_henan_v4`, reads as an enclosed north/south mountain basin, and gives the Han River a subdued west-east course. Producer-review risks: two large city footprints may be too much built density, some roads may be too clean/straight, and field/tree density may create pseudo-settlement risk at game scale.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Bashu-Hanzhong v1 Producer Review

- Producer accepted `rep_bashu_hanzhong_v1` as consistent with the previous Luoyang-Changan / Guanzhong-Henan representative direction.
- Accepted aspects: perspective, city treatment, and terrain material.
- This supports the current Stage 4 consistency goal across representative terrain types.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Huai-Si / Jiangdong v1 Brief And Generation Attempt

- Added `docs/map_design/work/representative_tiles/stage4_rep_huaisi_jiangdong_v1_generation_brief.md`.
- The brief defines the third representative tile target: Huai-Si / Jiangdong lowland water-network geography.
- Geography controls: preserve the same low oblique perspective and terrain material language as the first two accepted representative directions, but differentiate by using branching waterways, wet fields, levee/ferry road logic, and distant low hills rather than mountain-basin framing.
- Built-in image generation was attempted three times and failed with `ServerError`; no image candidate was produced.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Huai-Si / Jiangdong v1 Retry

- Retried built-in image generation three more times for `rep_huaisi_jiangdong_v1`.
- Attempts 4-6 all failed with `ServerError`; no image candidate was produced.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.
