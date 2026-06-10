# Map Design Worklog

## Current State

- Current approved runtime map asset: unchanged from the existing game state.
- Current map-art workflow status: Stage 1-5 approved; Stage 6 controlled production pipeline pilot in progress.
- Active stage: Stage 6, controlled T06 no-city terrain base.
- Active candidate: `terrain_t06_cc_w_no_city_v2_city_nudge_proposal.png`, pending producer review.
- Next proposed action: producer review of the deterministic city-layer nudge proposal before any city-stamp art/blend test.

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

## 2026-06-08 Stage 4 Huai-Si / Jiangdong v1 Generation

- Retried built-in image generation for `rep_huaisi_jiangdong_v1`; attempt 7 succeeded with a short controlled prompt.
- Added `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`.
- Added `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1_manifest.md`.
- Author light review: v1 keeps the accepted low oblique perspective, paper texture, wide crop, and city scale broadly consistent with `rep_guanzhong_henan_v4` and `rep_bashu_hanzhong_v1`. It reads clearly as lowland branching waterways and wet fields rather than a mountain basin. Producer-review risks: water occupies a large part of the tile, some ferry/road strokes may be too clean, and foreground/distant hills should be checked against the lowland target.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 4 Huai-Si / Jiangdong v1 Producer Review

- Producer accepted `rep_huaisi_jiangdong_v1`.
- Accepted aspect: strong water-town / Jiangdong lower-Yangtze water-network feeling.
- Geography note: author follow-up check judged the candidate valid for Jiangdong / lower Yangtze lowland water-network grammar. It is stronger as a Jiangdong water-network direction than as a precise Huai-Si northern corridor reference; later production tiles should still control the Huai River / Shouchun-Hefei-Xuzhou-Guangling corridor separately.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 5 Final Tile Plan Candidate

- Advanced from Stage 4 representative references to Stage 5 final national tile plan candidate.
- Added `docs/map_design/work/tile_plan/tile_index_v2_final_candidate.md`.
- Added `docs/map_design/work/tile_plan/tile_grid_v2_final_candidate.html`.
- Candidate keeps the producer-approved Stage 3 structure: 4 x 3 national grid and 20% overlap.
- Candidate adds Stage 5 missing lock fields: per-tile concept coordinates, output pixel sizes at proposed 4x scale, direct neighbor list, diagonal context list, Stage 6 production order, and required per-tile review outputs.
- Status: pending producer review; 4x output scale and production order are not locked until producer approval.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 5 Final Tile Plan Producer Review

- Producer approved `tile_index_v2_final_candidate.md`.
- Approved scope: 4 x 3 grid, 20% overlap, 4x output scale, neighbor list, and Stage 6 production order.
- Producer condition: every production tile must keep consistent perspective/style, must be able to connect cleanly with neighboring tiles, and must pass terrain/geography review without major problems or out-of-place features.
- Added `docs/map_design/work/tile_plan/stage6_tile_quality_gate_v1.md` to make those conditions explicit before Stage 6 generation.
- Updated `docs/map_design/CANDIDATE_MANIFEST_TEMPLATE.md` so Stage 6 manifests record perspective/style, seam/overlap, terrain/geography, pseudo-settlement, and runtime-isolation gates.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 6 T06_CC_W Brief

- Added `docs/map_design/work/tile_plan/stage6_t06_cc_w_generation_brief.md`.
- This brief defines the first Stage 6 production tile target: `T06_CC_W`, central-west Guanzhong-Henan / Luoyang-Changan corridor.
- Hard controls: preserve the accepted low oblique perspective/style, keep bounded-plains and Yellow River / Wei-Luo-Yiluo logic, avoid dominant vertical Luoyang-side water, keep all edges overlap-friendly, and apply the Stage 6 tile quality gate before any producer PASS.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-08 Stage 6 T06_CC_W v1/v2 Generation

- Generated `docs/map_design/work/stitch/tile_t06_cc_w_v1.png`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v1_manifest.md`.
- Author gate result for v1: `REWORK`. Perspective/style and city scale were acceptable, but terrain/geography failed because the broad branching water, islands, and delta-like structure read too close to Jianghuai/Jiangdong water-network grammar for `T06_CC_W`.
- Two stricter v2 built-in imagegen attempts failed with `ServerError`; a shorter retry prompt succeeded.
- Generated `docs/map_design/work/stitch/tile_t06_cc_w_v2.png`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v2_manifest.md`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v2_overlay.html`.
- Author gate result for v2: perspective/style PASS, seam/overlap PENDING_NEIGHBOR, terrain/geography PASS, pseudo-settlement PASS, runtime isolation PASS. Main producer-review note: the right/eastern city still has a noticeable north-south local river; review whether it is acceptable or requires another rework.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-09 Stage 6 T06_CC_W Scope Correction

- Producer asked whether the full T06 scope contains only two cities.
- Audit result: no. The two-city rule belonged to the Stage 4 Guanzhong-Henan representative crop, not full production tile `T06_CC_W`.
- Added `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`.
- Approximate data-anchor check against `CITY_BASE` shows many city zones in or near the full `T06_CC_W` concept crop, including Chang'an, Luoyang, Chenliu, Guandu, Xuchang, Nanyang, Xinye, Hanzhong, Shangyong, Xiangyang, Yiling, Jingzhou, Wuchang, and nearby/overlap zones.
- Updated `docs/map_design/work/tile_plan/stage6_t06_cc_w_generation_brief.md` to mark the two-city prompt as superseded.
- Updated `docs/map_design/work/stitch/tile_t06_cc_w_v2_manifest.md` from pending producer review to `REWORK` for full production scope. It remains useful as a style/geography reference, but not as a complete T06 production candidate.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-09 Stage 6 T06_CC_W Corrected Generation Attempts

- Retried built-in image generation for corrected full-scope `T06_CC_W`.
- Attempt 5 used a full corrected prompt with city hierarchy and failed with `ServerError`; no image produced.
- Attempt 6 used a shorter corrected prompt and failed with `ServerError`; no image produced.
- Attempt 7 used a minimal corrected prompt and failed with `ServerError`; no image produced.
- Attempt 8 used a short city-hierarchy prompt and succeeded.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v3.png`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v3_manifest.md`.
- Added `docs/map_design/work/stitch/tile_t06_cc_w_v3_overlay.html`.
- Author gate result for v3: perspective/style PASS, seam/overlap PENDING_NEIGHBOR, terrain/geography PASS, pseudo-settlement PASS, runtime isolation PASS. Main producer-review note: the right/eastern north-south local river remains prominent and should be judged for geography fit.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-09 Stage 6 Production Pipeline Correction

- Producer flagged that `tile_t06_cc_w_v5` still behaves like a pretty reference image rather than a final zoom-in production tile: secondary cities are too small and random, and city/road/terrain alignment cannot be trusted if imagegen owns all layers.
- Workflow conclusion: Stage 1-5 decisions remain valid, but Stage 6 execution must change from all-in-one image-generated production tiles to a controlled pipeline.
- Added `docs/map_design/work/tile_plan/stage6_production_pipeline_v1.md`.
- Updated `docs/map_design/MAP_MASTER_WORKFLOW_v1.md` Stage 6 to reference the new pipeline.
- New Stage 6 rule: imagegen may produce no-city terrain bases and local blend passes, but city count, city positions, city size hierarchy, primary road graph, and duplicate/missing-city QA must be deterministic data/control layers.
- Claude Code Opus 4.8 read-only validation found two material doc issues, now patched: T01-T05 is explicitly the next automation batch rather than the full remaining map, and the road graph must derive from existing game adjacency/road data plus approved geography notes with gaps marked `PENDING_PRODUCER_APPROVAL`.
- Next action: build `control_master_v1` and `T06_control_overlay_v1` before any further T06 image generation.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-09 Stage 6 Control Master And T06 Overlay v1

- Added `docs/map_design/work/tile_plan/control_master_v1.html`.
- Added `docs/map_design/work/tile_plan/control_master_v1_manifest.md`.
- Added `docs/map_design/work/tile_plan/T06_control_overlay_v1.html`.
- Added `docs/map_design/work/tile_plan/T06_control_overlay_v1_manifest.md`.
- `control_master_v1` loads all 55 `CITY_BASE` city anchors and the existing `ROADS` / `ROAD_WAYPOINTS` graph directly from repo data, then projects them into the 1672 x 941 concept planning space with the current `hexToPixel` formula.
- `T06_control_overlay_v1` derives from the same control model and shows T06 crop city classes, proposed pixel-size footprints, source roads/rivers, overlap bands, and rough terrain control zones before any further image generation.
- Static verification: repo data resolves to 55 cities, 111 roads, 11 river paths; T06 crop contains 21 city anchors and 31 anchors with the 80 px context margin.
- Edge headless screenshot sanity check generated preview PNGs under `%TEMP%\romance-map-overlay-check\`; screenshots were not added to the repo.
- Producer review remains required before generating a new T06 terrain base.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-09 Stage 6 T06 Geography And Collision Audit

- Added `docs/map_design/work/tile_plan/T06_terrain_geography_collision_audit_v1.md`.
- Audit result: `T06_control_overlay_v1` remains useful as a source overlay, but its city circles are control footprints, not final city-stamp bounds.
- City collision check found final-stamp collision risk for 成都/雒城, 南阳/襄阳, 南阳/新野, and the 陈留/官渡/许昌 overlap cluster.
- Recommended ownership/weight direction before no-city terrain generation: keep 长安/洛阳 as primary overlap/global anchors; keep 南阳/襄阳/上庸/夷陵 as T06 center anchors; downgrade or delegate 新野/汉中; delegate 陈留/官渡/许昌 to T07 or global city layer; keep Bashu/Jingzhou/Yangtze groups as context.
- Geography audit requires the next T06 brief to separate Yellow River/Wei, Luo/Yi/Yiluo, Han River, and Yangtze/Jianghan edge controls, and to split Qinling/Funiu/Daba zones instead of using one broad southern terrain band.
- Road audit recommends a sparse route hierarchy rather than directly rendering all clipped `ROADS` edges.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 Stage 6 T06 No-City Terrain Brief Approval

- Producer approved continuing the controlled Stage 6 pipeline for T06 rather than returning to all-in-one image-generated production tiles.
- Producer confirmed the next T06 art step should be a no-city terrain base only.
- City scale control remains deterministic later, using the producer-facing "9 inch pizza" / "5 inch pizza" metaphor:
  - large/primary city: roughly 9-inch-pizza visual weight;
  - standard/small city: roughly 5-inch-pizza visual weight;
  - edge/context cities can be subdued or clipped, but must not become sesame-dot texture.
- City ownership direction for the terrain brief:
  - 长安/洛阳 are global city-layer primary stamps appearing in T06 overlap;
  - 新野 is downgraded or delegated to avoid crowding 南阳/襄阳;
  - 陈留/官渡/许昌 are delegated to `T07_CC_E` or global city layer;
  - 汉中 is west-corridor context, not a full T06-owned stamp.
- Added `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md`.
- Updated `stage6_t06_cc_w_generation_brief.md` to point away from all-in-one city-bearing generation and toward the no-city terrain brief.
- Updated `T06_terrain_geography_collision_audit_v1.md` with producer decisions.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 Opus Review Fixes For T06 Brief

- Ran a read-only Opus review of the T06 no-city terrain brief and related status docs.
- Factored in the material findings before generation:
  - added an exact output-frame gate: `2344 x 1756`, correct aspect, wrong size/aspect is `REWORK`;
  - carried forward the control-anchor caveat: current anchors are production-control references, not final Stage 8 aligned map truth;
  - limited `rep_huaisi_jiangdong_v1` to material/paper/water reference only, not T06 geography/composition lead;
  - added conservative final-stamp planning radii: primary 38 concept px, standard 24, edge/context 18;
  - clarified pass/ferry/crossing markers are also deferred to deterministic layers;
  - restored diagonal context checks for `T01_NW`, `T03_NC_E`, `T09_SW`, and `T11_SC_E`;
  - renamed manifest decision headings to `Producer-Confirmed Decision 2026-06-10` for traceability.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 T06 No-City Terrain v1 Generation

- Generated `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1.png` from the approved no-city terrain brief.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_manifest.md`.
- Verdict: `REWORK`.
- Reject reasons:
  - output frame gate failed: generated image is `1448 x 1086`, not required `2344 x 1756`;
  - the image contains too many thin path-like lines and small clustered marks, creating random road-network / pseudo-settlement risk for a no-city terrain base.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 T06 No-City Terrain v1 Overlay Audit And Normalize

- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_overlay.html`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_overlay_preview.png`.
- Overlay audit result: the terrain/city-reserve distribution is workable enough to preserve for producer review.
- Created deterministic normalized derivative: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized.png`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized_manifest.md`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized_city_overlay.html`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized_city_overlay.png`.
- City overlay renders 31 T06/context anchors on the normalized terrain frame for producer review.
- Normalized size: exact `2344 x 1756`.
- Crop: none.
- AI repaint/edit: none.
- Current verdict: `PENDING_PRODUCER_REVIEW`.
- Producer review focus:
  - whether local city-layer nudging/blend padding is acceptable, especially because 襄阳 lands awkwardly against the strong mountain belt;
  - whether path/field-line density is acceptable terrain texture;
  - whether the Qinling/Funiu belt is too strong or too far north;
  - whether lower-right water remains acceptable Yangtze/Jianghan edge context.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 T06 No-City Terrain v1 Producer Geography Rejection

- Producer rejected `terrain_t06_cc_w_no_city_v1_normalized.png`.
- Main reason: the large river between 洛阳 and 长安 is too visually dominant and in the wrong relationship to the corridor.
- This is not fixable by city-position nudging; the terrain base itself needs rework.
- v2 correction requirements:
  - do not draw a main river running between 长安 and 洛阳;
  - Yellow River / Wei River control should sit farther north/upper;
  - Wei River may support the Guanzhong approach but must not become a central divider;
  - Luoyang Luo/Yi/Yiluo water should be smaller, local, and subordinate;
  - 长安-洛阳 should read as a Guanzhong-Henan corridor / pass route / bounded plain transition.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 T06 No-City Terrain v2 Rework

- Generated `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2.png`.
- Created deterministic normalized derivative `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`.
- Added city overlay `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_city_overlay.html`.
- Added city overlay preview `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_city_overlay.png`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized_manifest.md`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_geography_city_audit.md`.
- Raw output size: `1449 x 1085`.
- Normalized size: exact `2344 x 1756`.
- Verdict: `PENDING_PRODUCER_REVIEW`.
- Author review:
  - v2 fixes the blocking v1 issue: no dominant main river between 长安 and 洛阳;
  - upper river now reads as northern Yellow River / Wei control;
  - 洛阳 is still river-adjacent and should remain global overlap/corridor, not exact river truth;
  - 襄阳 remains close to the mountain belt but may be manageable with local city-layer blend/nudge;
  - field/path strokes remain dense and need producer review.
- City adjustment recommendation:
  - allow small deterministic city-layer nudges/blend pads if accepting v2;
  - 洛阳 may need slight south/south-southeast blend/nudge so it does not read as directly on the upper main river;
  - 襄阳 likely needs a south/southeast blend/nudge toward a Han River / corridor pocket;
  - 官渡/陈留/许昌 should stay T07/global and visually south of the northern main river if included.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 T06 v2 City Nudge Proposal

- Producer selected Option A: continue with v2 and allow local deterministic city-layer nudges/blend pads.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.html`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.png`.
- Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md`.
- Proposal moves 8 context/anchor positions in the normalized review frame:
  - 洛阳: `+36,+64`;
  - 襄阳: `+46,+78`;
  - 陈留: `0,+54`;
  - 官渡: `-8,+54`;
  - 许昌: `0,+46`;
  - 夷陵: `-20,+20`;
  - 武昌: `-16,+18`;
  - 江陵: `0,+22`.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.

## 2026-06-10 Stage 6 Controlled Tile Lessons

- Added `docs/map_design/work/tile_plan/stage6_controlled_tile_lessons_v1.md`.
- Purpose: preserve the reusable production lessons from the T06 no-city terrain / overlay-audit / city-nudge loop before continuing to later tiles.
- Key rules captured:
  - imagegen may own terrain material and texture, but not city count, city positions, primary roads, ownership, or seam logic;
  - every tile needs the fixed loop: control overlay -> no-city brief -> terrain generation -> frame gate -> city overlay -> geography/city audit -> producer verdict;
  - major geography errors must be reworked rather than hidden by city nudges;
  - city nudges are art-layer proposals only and must be recorded with explicit pixel deltas;
  - tile scope is not final ownership, so primary/global/context/delegate classes must be decided before stamp work;
  - road-like texture and pseudo-settlement marks require post-generation audit even when the prompt says no roads/no villages;
  - future tiles should reuse the manifest/audit/nudge file set from T06.
- Runtime unchanged: no files in `src/` or `assets/maps/` were modified.
