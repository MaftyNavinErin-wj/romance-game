---
name: Map UI direction and terrain-base research
description: 2026-06-03/10 map UI and map-art production notes: terrain-base direction, national-first workflow, Stage 6 controlled pipeline, and T06 no-city terrain brief
type: project
originSessionId: 2026-06-03-map-ui
---

# Map UI Direction and Terrain-Base Research

## Context

Project Romance currently has three map-layer requirements that are individually reasonable but visually conflict when shown together:

- The bottom bitmap is ink/watercolor style and has artistic value, so it should be preserved if possible.
- The hex map remains the gameplay logic layer and cannot be removed.
- The bitmap contains terrain information, but it is not direct enough for play, so additional terrain icons/marks are still needed.

The core problem is not only visual noise. It is also calibration: bitmap terrain, hex terrain, city placement, and any new strategic layer must align. Adding another independent map layer increases this risk.

## Dutongjian Inspiration

`dutongjian.com` is useful as a reference for strategic-geography presentation, not as a UI logic model to copy directly.

Observed useful ideas:

- Strategic regions can be shown as large readable zones rather than per-cell symbols.
- Passes, ferries, river mouths, corridors, waterways, and mountain ranges can become sparse map annotations.
- The map feels cleaner because it separates geographic reading from operational gameplay.

Important difference:

- Dutongjian is a historical reading/research site.
- Project Romance is a hex-based strategy game, so the strategic layer must be derived from or snapped to game hexes instead of becoming another free coordinate system.

## 3D Prototype Result

Prototype:

- `prototypes/hex_3d_map_prototype.html`

Result:

- Technically feasible: Three.js can render the current bitmap as a 2.5D/3D map surface with hex-based overlays.
- Design result was only average. It did not solve the main dirtiness problem; it mainly made the layer stack more complex.
- Current judgment: do not pursue full 3D as the main map direction unless there is a separate approved visual target. If 3D returns later, keep it as a controlled 2.5D fixed-camera map, still hex-based.

## 2D Comparison Tool

Prototype:

- `prototypes/map_layer_compare.html`

The comparison currently tests four map treatments:

- A: current-problem simulation, normal bitmap plus dense terrain icons.
- B: sparse strategic/geographic annotation on the current bitmap.
- C: same annotation as B, but with the bitmap visually softened.
- D: default operational map, keeping only key gameplay marks such as cities and units.

B and C use the same information layer. Their difference is only the bitmap treatment:

- B keeps the current bitmap contrast.
- C reduces contrast/saturation and raises brightness/opacity balance so overlays read more clearly.

Terrain/geography representation in B/C:

- Brown thick bands: mountain/geographic or strategic corridor regions, not exact per-hex terrain.
- Blue-gray thick bands: main waterways or river corridors.
- Tan diamonds: passes, ferries, river mouths, or similar strategic nodes.
- Pale large labels: regional geography names.
- Exact terrain remains in hex logic, hover/selection, movement, and specific map modes.

Current strongest 2D direction:

- Keep the ink bitmap as the art base.
- Stop showing dense per-hex terrain icons by default.
- Promote terrain information into sparse, named geographic annotations.
- Use hover/selected hex/terrain mode to reveal exact hex terrain.
- Derive strategic annotations from the hex grid so alignment stays tractable.

## External Map Data Search

GitHub search did not find a ready-to-use open-source ancient-China terrain bitmap suitable for direct replacement.

Useful sources are mostly GIS/data references:

- `cga-harvard/chgis`: CHGIS historical geography data mirror/reference. Useful for historical places, administrative units, and calibration; not a terrain bitmap.
- `fusiwei339/chgis-1911-topojson`: MIT example of CHGIS V5 processing into topojson, but late-Qing/1911 administrative boundary oriented.
- `Adl3rAi/The-Great-Wall-of-China-geodata`: MIT Great Wall / pass-related GeoJSON. Useful for northern strategic references, not whole-map terrain.
- `aourednik/historical-basemaps` and `idris-maps/world-historical-gis-data`: global historical boundary references, too coarse for the main game map.
- `stark1tty/awesome-historical-maps`: index of historical map resources, useful for further searching scanned old maps, but licensing and projection must be checked case by case.

Practical conclusion:

- GitHub can help provide data skeletons, not the final visual bottom map.
- A better replacement bitmap likely needs to be synthesized from open terrain/relief data, then stylized into a light ink/watercolor base.
- Natural Earth, shaded relief, DEM-derived terrain, and historical GIS overlays are better input materials than GitHub repos alone.

## Open Design Questions

Before implementation into the real game, the producer needs to approve:

- Whether the default map should follow D-style operational minimalism or B/C-style geographic annotation.
- Whether terrain icons become mode-specific/hover-specific instead of always visible.
- Whether to generate a new lighter relief bitmap or keep modifying the current bitmap through filters.
- Which terrain facts must be always visible for gameplay, versus hidden until hover/mode.

## 2026-06-04 Vertical Slice Direction

Producer approved pushing the high-resolution terrain-base direction into a small vertical slice before full-map rollout.

New working direction:

- The existing low-resolution bitmap is acceptable at far zoom but too blurry at close zoom, so future map-base work should target a higher-resolution terrain bitmap instead of only filtering the current asset.
- Static city/geography footprints may be painted into the map base: large walled cities, smaller county towns, mountain-pass fortresses, ports/ferries, etc.
- Dynamic city state must not be baked into the bitmap. Ownership, selected state, labels, war/development/status, units, and click handling stay in overlay layers.
- City footprints should be snapped to real game city/hex positions during production. AI-generated placement is only acceptable for visual exploration.
- Practical layer model: high-resolution terrain base + static city/pass footprint + transparent/low-profile hit target + dynamic overlay.

Prototype artifacts:

- `docs/map_design/luoyang_changan_vertical_slice_v1.png`
- `docs/map_design/luoyang_changan_vertical_slice.html`
- `docs/map_design/luoyang_changan_vertical_slice_preview.png`

Current sample judgment:

- The approach is visually promising: a painted city footprint can read as a natural map feature while a transparent hitbox keeps interaction aligned.
- The sample still needs production discipline: cities should be more orthographic, slightly less detailed, and generated/painted from fixed coordinates rather than freehand AI placement.
- Suggested next validation: choose a real 1-2 city game crop, derive exact city and hex overlay coordinates, then test whether default terrain/city icons can be hidden without losing gameplay readability.

## 2026-06-05 Real Coordinate Crop Workbench

Continued the approved high-resolution terrain-base vertical slice into a real-coordinate overlay workbench:

- `docs/map_design/real_coord_crop_overlay.html` now defaults to `assets/maps/china-ink-base-v1-hd.png` while keeping the 1x bitmap as an A/B reference.
- The page keeps all alignment anchors in game coordinates: crop `x180 y135 w360 h155`, city centers from `CITY_BASE` via the existing `hexToPixel` formula, and the first two `RIVERS` paths.
- Added base-treatment modes for normal, softened overlay readability, and high-contrast alignment audit without changing formal game rendering.
- Added a coordinate readout with city pixel centers, footprint size hints, river source, and road skeleton so a generated/repainted bitmap can be checked against fixed anchors.
- Generated `docs/map_design/real_coord_crop_base_candidate_v1.png` as the first clean crop-base candidate: no labels, no UI, no hex, static city footprints painted into terrain.
- The workbench treats the generated candidate as a crop asset inside `x180 y135 w360 h155`; the old/HD bitmaps remain full-map coordinate images.
- Regenerated `docs/map_design/real_coord_crop_overlay_preview.png` and `docs/map_design/real_coord_crop_base_candidate_v1_overlay_preview.png` from the updated page.
- Headless browser verification on 2026-06-05: default HD state uses `../../assets/maps/china-ink-base-v1-hd.png` at image frame `x0 y-12 w1360 h765`, candidate state uses `real_coord_crop_base_candidate_v1.png` at crop frame `x180 y135 w360 h155`, both with 680 hexes, 8 road links, 7 city hitboxes, and 7 footprint guides.

Current judgment:

- This is now a useful production-check page, not just a screenshot.
- `real_coord_crop_base_candidate_v1.png` is visually promising but not coordinate-authoritative; some baked city footprints are still offset from the real anchors, so use it as a style/crop candidate and verify or repaint against the overlay before production.
- The next actual art step should produce or repaint a crop that has static city/pass footprints baked into the terrain base, then drop it behind this same overlay to test snap accuracy.
- Do not bake dynamic city names, ownership, selected state, units, war state, or development/status into the bitmap.

## 2026-06-05 Anchor Candidate v2

Continued the real-coordinate crop workbench with a deterministic coordinate-anchored candidate:

- Added `docs/map_design/real_coord_crop_base_anchor_v2.png`, generated from the current HD bitmap crop and painted only with static city footprints, road skeleton, and small pass/ford hints snapped to the existing `hexToPixel` city anchors.
- Updated `docs/map_design/real_coord_crop_overlay.html` with a new `锚点候选 v2 · crop` base option and URL parameters such as `?base=anchor` / `?base=candidate` for repeatable preview capture.
- Regenerated `docs/map_design/real_coord_crop_base_anchor_v2_overlay_preview.png` and restored `docs/map_design/real_coord_crop_base_candidate_v1_overlay_preview.png`.
- Verification: jsdom check confirmed `?base=anchor` selects `real_coord_crop_base_anchor_v2.png` with 680 hexes, 8 road links, 7 city hitboxes, and 7 footprint guides.

Current judgment:

- v2 is coordinate-authoritative and useful as a production/alignment bottom plate, but visually more tool-like and less rich than v1.
- v1 remains the stronger art-style target, but it is still not coordinate-authoritative.
- Best next step is to use v2 as the anchor/layout guide and repaint or regenerate toward v1's richness while preserving exact city centers, river paths, crop frame, and non-baked dynamic-state constraints.

## 2026-06-05 Aligned Candidate v3

Produced a coordinate-aligned finished crop candidate after producer sign-off on the richer art direction:

- Added `docs/map_design/real_coord_crop_base_aligned_v3.png`.
- v3 uses the coordinate crop frame and game city anchors as hard constraints, with static city/pass footprints baked at the existing `hexToPixel` anchor positions.
- Updated `docs/map_design/real_coord_crop_overlay.html` so `成品候选 v3 · 坐标对齐` is the default base, while keeping HD, v2 anchor, and v1 style candidates available for comparison.
- Generated `docs/map_design/real_coord_crop_base_aligned_v3_overlay_preview.png`.
- Verification: jsdom check confirmed default/`?base=aligned` selects `real_coord_crop_base_aligned_v3.png` with 680 hexes, 8 road links, 7 city hitboxes, and 7 footprint guides.

Current judgment:

- v3 is the first usable coordinate-aligned art candidate for this crop: bottom bitmap city footprints and overlay city centers now match.
- v1 should no longer be used for coordinate review; it remains only a style reference.
- Next improvement, if desired, is purely art polish on v3 richness/texture, not coordinate correction.

## 2026-06-06 Clean Coordinate Candidate v4

Reworked v4 after rejecting the first failed attempt that looked like a line-art / UI-icon / engineered-road mockup.

- Removed the failed uncommitted v4 PNGs and restored the overlay/memory files back to the committed v3 state before starting over.
- Added `docs/map_design/real_coord_crop_base_clean_v4.png`.
- Added `docs/map_design/real_coord_crop_base_clean_v4_overlay_preview.png`.
- Updated `docs/map_design/real_coord_crop_overlay.html` so `clean` / `?base=clean` is the default base, while v3/v2/v1 and the old bitmap sources remain available for comparison.
- The terrain base is a new clean ink-and-watercolor background rather than a filtered copy of the old dirty bitmap.
- City and pass artwork is painted after generation by deterministic composition from the workbench anchors, not placed by AI:
  - crop frame remains `x180 y135 w360 h155`;
  - visible city centers use the existing `hexToPixel` formula and are transformed by `(gameCoord - cropOrigin) * 5`;
  - roads derive from the existing workbench road skeleton;
  - the first two `RIVERS` paths are redrawn as subdued fixed-coordinate water marks.
- Dynamic labels, ownership, selected state, units, war/development state, hitboxes, and hex grid remain overlay-only.

Current judgment:

- v4 is cleaner than v3 because it does not inherit the dirty bitmap texture.
- v4 preserves the real-coordinate discipline of v3: overlay preview confirms the city centers land inside the baked city artwork.
- The city artwork is deliberately subdued so it reads as part of the map base instead of as clickable UI. Further polish, if any, should continue to keep city/pass placement deterministic and should not let AI freely position settlements.

## 2026-06-07 City Detail Candidate v5

Responded to producer comments on v4:

- v4's city artwork read too much like faint footprint markers rather than real fortified settlements painted into the map.
- v4's terrain style was acceptable, but the detail density was weaker than the earliest concept images in `docs/map_design`.

Added:

- `docs/map_design/real_coord_crop_base_city_detail_v5.png`
- `docs/map_design/real_coord_crop_base_city_detail_v5_overlay_preview.png`

Updated:

- `docs/map_design/real_coord_crop_overlay.html` now defaults to v5 via `cityDetail` / `?base=cityDetail`, while retaining v4/v3/v2/v1 comparison options.

Production method:

- Generated a high-detail terrain-only base with no cities, labels, hexes, UI, ownership, units, or dynamic state.
- Generated a separate high-detail city concept source, but did not use its free city placement as authoritative.
- Composited city artwork onto the terrain-only base using the existing workbench anchors derived from `hexToPixel` and crop frame `x180 y135 w360 h155`.
- This preserves the coordinate discipline of v3/v4 while restoring stronger fortified-city detail and richer field/road/riverbank texture.

Current judgment:

- v5 is a better response to the two producer comments than v4: city walls and inner blocks are visibly present, and the terrain has more concept-like microdetail.
- There is still a visible compositing/patch-edge risk around some city inserts, especially when inspecting the raw base without overlay. If v5 is approved as a direction, the next polish pass should focus on edge blending and making inserted settlements feel more naturally painted into the local ground.
- Do not regress to AI-free city placement. Any future city-detail pass should keep city centers deterministic and use generated art only as source material or style reference.

## 2026-06-07 Lighter Candidate v6

Responded to producer comments after v5 was merged into the game:

- v5 was visually close but felt too yellow/deep/dirty in-game.
- v5 had local defects: Luoyang looked partially cut off, and Guandu did not read as a clear static node.
- Producer also observed possible map zoom/rendering stutter.

Added:

- `docs/map_design/real_coord_crop_base_city_detail_v6.png`
- `docs/map_design/real_coord_crop_base_city_detail_v6_overlay_preview.png`
- `assets/maps/luoyang-changan-detail-v6.png`

Updated:

- `src/render/render_cache.js` now points the Luoyang-Changan detail LOD layer to v6.
- The runtime SVG blur/mask was removed from the LOD layer because v6 pre-bakes crop-edge alpha feathering into the PNG.
- `docs/map_design/real_coord_crop_overlay.html` now defaults to v6 while keeping v5/v4/v3/v2/v1 for comparison.

Production method:

- Used v4 as the cleaner coordinate-locked terrain base to avoid inheriting v5's visible patch-edge artifacts.
- Regraded the base toward lighter beige / lower saturation / lower dirt contrast.
- Added deterministic low-opacity settlement street/block detail at fixed workbench anchors.
- Kept dynamic city labels, ownership, selected state, units, war/development state, hitboxes, and hex grid overlay-only.

Current judgment:

- v6 is cleaner and lighter than v5 and is safer for in-game use.
- It sacrifices some of v5's high-detail richness, but avoids the unacceptable source-patch artifacts around Luoyang and Guandu.
- Next visual step, if needed, should improve settlement richness without importing rectangular source patches; any richer city artwork must still be placed by deterministic anchors.
- Larger consistency audit remains later: full bitmap terrain, local bottom map, and hex city/terrain data should be compared before broad rollout.

## 2026-06-07 In-Game LOD Vertical Slice

Implemented the first in-game vertical slice for the approved zoom-level detail-layer direction:

- Copied v5 into the runtime asset path as `assets/maps/luoyang-changan-detail-v5.png`.
- Added a `mapDetailLodLayer` image inside the existing static map cache, using the same crop frame `x180 y135 w360 h155`.
- The layer only appears in ink-map mode. Grid mode remains unchanged and does not load the v5 crop.
- Opacity is driven by current map zoom:
  - scale `< 1.35`: opacity 0
  - scale `1.35 -> 2.05`: crossfade 0 -> 1
  - scale `> 2.05`: opacity 1
- Zoom transform-only updates now also sync LOD opacity, so wheel zoom changes the crossfade immediately instead of waiting for the debounced full render.
- Added an SVG feather mask to the crop image so the detail layer blends into the old global bitmap instead of reading as a hard rectangle.

Focused verification:

- `node -c src/render/render_cache.js`, `src/render/map_render.js`, and `src/render/map_interaction.js` PASS.
- Visual harness `map_lod_v5_feather` on 190 Dong Zhuo start confirmed:
  - far opacity `0.000`
  - mid opacity `0.500`
  - near opacity `1.000`
  - grid mode has no v5 layer
  - no browser console/page errors

Current judgment:

- This is a proper vertical slice, not a full integration. It validates the experience model: old full-map bitmap at macro zoom, v5 detail crop emerging as the player zooms into the Luoyang-Changan corridor.
- The v5 art remains behind fog, roads, city icons, labels, units, and selection state. This preserves dynamic gameplay readability but means city-footprint art is naturally subdued in real play.
- Next design review should be based on in-game screenshots, not raw base-map inspection. Main questions: whether the zoom thresholds feel right, whether city icons should become subtler at high zoom, and whether terrain microdetail interferes with labels/units.

## 2026-06-07 City Detail v8/v9 Candidates

Responded to producer rejection of the first v7 attempt:

- Rejected v7 because the main city outer walls read as straight engineered/UI frames rather than city walls painted into the base map.
- Kept v6 as the reliable style base: light beige, clean, no obvious patch edges, runtime PNG feathering already baked.
- Generated `docs/map_design/real_coord_crop_base_city_detail_v8.png` as a full-image city-detail candidate from v6 direction. It improved city wall/detail quality, with broken ink-wall curves, gates, inner blocks, and clearer Guandu/Chenliu area, but the whole terrain became heavier and more fully redrawn than v6.
- Built `docs/map_design/real_coord_crop_base_city_detail_v9.png` as the current safer candidate: v6 terrain base plus v8 city-detail patches composited only around fixed workbench anchors with feathered local masks.
- Added overlay previews:
  - `docs/map_design/real_coord_crop_base_city_detail_v8_overlay_preview.png`
  - `docs/map_design/real_coord_crop_base_city_detail_v9_overlay_preview.png`
- Updated `docs/map_design/real_coord_crop_overlay.html` so v9 is the default workbench candidate, while v8/v6/v5/v4/v3/v2/v1 remain selectable.

Current judgment:

- v9 better matches the producer-approved v6 direction than v8: it preserves the clean light terrain and improves city readability without using straight city-frame outlines.
- v8 remains useful as a high-detail source/reference, not as the safest runtime candidate.
- v9 still has a mild local-composite risk around city patches. If approved for runtime, the next polish should focus on weakening patch boundaries and matching local paper/ink density, not on letting the model freely repaint the whole crop.
- Runtime remains on `assets/maps/luoyang-changan-detail-v6.png` until producer approval.

## 2026-06-07 National Map Workflow Pivot

Producer questioned whether continuing to polish the Luoyang crop was the right path, given that v8/v9 still lacked the detail grammar of the original concept image: fields, forests, riverbanks, terrain, city walls, roads, and settlement density all need to improve together.

New working conclusion:

- Stop treating the Luoyang-Changan crop as the next final art target.
- Move to a national-first map-art workflow.
- Current city/hex coordinates are review anchors, not immutable pixel truth. If the final bitmap is redrawn nationally, `CITY_BASE`, `HEX_TERRAIN`, roads, and river data can later be aligned toward the approved visual master within explicit tolerances.
- Keep new map-art exploration isolated under `docs/map_design/` until producer approval; do not promote to runtime `assets/maps/` during exploration.

Added:

- `docs/map_design/MAP_MASTER_WORKFLOW_v1.md` as the master workflow and risk/control document.
- `docs/map_design/README.md` as the map workspace index.
- `docs/map_design/work/` subfolders for national concept, art kit, representative tiles, tile plan, stitch, and data alignment.
- `docs/map_design/archive/2026-06-04_to_07_luoyang_crop_exploration/` containing the old terrain-base, vertical-slice, real-coordinate crop, and v1-v9 experiment files.

Next approved-flow candidate:

- Stage 1 should generate a national low-resolution concept under `docs/map_design/work/national_concept/`, using the producer's concept reference as the detail target.
- Do not continue by generating another `v10` Luoyang crop unless producer explicitly redirects.

## 2026-06-07 Master Workflow Review

Reviewed `MAP_MASTER_WORKFLOW_v1.md` with a two-layer process: author self-review plus an independent sub-agent review.

Review result:

- Direction approved in principle, but the first draft was not executable enough.
- Main gaps: representative tiles came before tile planning, elastic coordinates lacked hard boundaries, data alignment was too late, AI generation was not reproducible, review gates were too subjective, art kit roles were ambiguous, seam audit lacked outputs, and README lacked active-state tracking.

Revisions applied:

- Rewrote `MAP_MASTER_WORKFLOW_v1.md` with independent-review fixes.
- Added `Geography Control Layer` with Tier A/B/C control levels and movement budgets.
- Moved tile planning before representative high-resolution tiles.
- Required data/anchor overlays from Stage 1 onward; final data alignment is now a migration proposal, not first discovery.
- Added explicit `PASS` / `REWORK` / `STOP` or equivalent gates per stage.
- Clarified art-kit classes: `reference-only`, `texture-patch`, and `compositable-element`.
- Added reproducibility controls via `CANDIDATE_MANIFEST_TEMPLATE.md`.
- Added `WORKLOG.md` for cross-session active-state tracking.
- Added archive `ARCHIVE_INDEX.md`.

Current status:

- Map workflow is now ready for producer review as a controlled Stage 0 document.
- Next action remains Stage 1 national low-resolution concept only after producer approves this revised workflow.

## 2026-06-07 Stage 1 National Concept Scale Lesson

Producer approved the Stage 0 national-first workflow, then reviewed the first Stage 1 national concepts.

Key feedback:

- v1 has the preferred calmer organic style direction over v2.
- v2's style is acceptable, but its national-scope scale grammar is wrong.
- In a national map, city footprints and terrain marks must be much smaller and more delicate. A single city must not visually approach the size of Taiwan, a major island, a basin, or another large regional geography feature.
- The same scale rule applies to mountains, rivers, forests, fields, roads, and city detail: at national scope these should read as fine map texture/detail systems, not local-crop objects.
- If the concept remains nationwide, either the canvas/detail density must support much finer information, or the art must avoid over-rendering local objects.

Practical rule for future prompts/reviews:

- Preserve v1-like organic ink/watercolor style when possible.
- Explicitly constrain cities to tiny national-map marks, with capitals only slightly larger.
- Treat mountains as ridge systems, rivers as thin hierarchical brush lines, forests/fields as micro-patterns, and roads/pass corridors as hairline geography.
- Do not approve a national concept only because the style is good; reject/rework if scale grammar is local instead of national.

Follow-up terrain lesson:

- v3 fixed scale better than v1/v2, but overcorrected into a weak terrain skeleton: the middle became too much like one large flat plain and mountains lost structure.
- Stage 1 national concept review must pass three separate checks: style, national-scale detail size, and rough terrain plausibility.
- Before generating another candidate, use `docs/map_design/work/national_concept/terrain_plausibility_audit_v1.md` as the control layer for mountain belts, bounded plains/basins, river hierarchy, and pass/corridor logic.

Actual-terrain correction:

- v4 improved the game-level terrain skeleton, but an actual-China terrain audit still marked it `REWORK`.
- Do not confuse "terrain-rich and game-plausible" with "roughly faithful to real China terrain." They are separate gates.
- Future national concepts should explicitly control: Qinling as an east-west north/south divide; Taihang as the west edge of the North China Plain; a broad open North China Plain; enclosed Chengdu and Hanzhong basins; Wushan/Three Gorges/Yiling as a river-mountain choke; and non-uniform southern/southeastern hill systems.
- v5 is the first author-preferred candidate for rough actual-terrain control: North China Plain reads more open, Taihang-like edge is clearer, and basin/corridor relationships are more legible. Remaining caution: v5 is still concept art, not Stage 8 data alignment.

## 2026-06-08 Stage 2 Art Kit Recovery

- Stage 2 art kit v1 was recovered after a CLI stream interruption.
- Recovered images are reference-only and must not be treated as runtime assets, final map art, or precise data authority.
- Pseudo-city marks must not propagate into production terrain, riverbank, farmland, forest, mountain, road, or pass tiles.
- True city and fort assets remain data-controlled for count, identity, and placement.

## 2026-06-08 Stage 2 Art Kit v1 Producer Review

- Producer liked art kit v1 images 01 and 02 as capital/city references.
- Image 03 should not guide fort production: it feels rough, mismatched with 01/02, courtyard-like, too small, and weak as a defensive node.
- Image 04 is better classified as pass/fort-terrain, image 05 as farmland/fields, and image 06 as small-river riverbank.
- Images 07 and 08 have usable mountain/route structure, but future prompts and production should reduce dense hillside forest.

## 2026-06-08 Stage 2 Art Kit v2 Direction

- Next art-kit generation should not redo the full kit; focus only on weak slots.
- Required weak-slot targets: a real pass fort / defensive checkpoint matching the 01/02 city style, lighter foothill forest, lower-density mountain pass, and lower-density road/pass corridor.
- v2 generation must keep all outputs reference-only and continue banning pseudo-city marks in terrain/background images.

## 2026-06-08 Stage 2 Art Kit v2 Generated

- Stage 2 v2 generated four weak-slot references: pass fort, foothill forest, mountain pass, and road/pass corridor.
- Author light review: v2 pass fort is stronger than v1 image 03 as a defensive checkpoint; v2 terrain references reduce forest density compared with v1 images 07/08.
- All v2 images remain reference-only and still need producer image review before they guide later tile production.

## 2026-06-08 Stage 4 Representative Tile Perspective Constraint

- Producer accepted `rep_guanzhong_henan_v3`'s lower oblique perspective as usable, despite it being lower and more 3D-feeling than v1.
- Hard constraint for later full-map bottom tiles: perspective must remain consistent across tiles.
- Review gate should compare camera height, horizon treatment, city scale, mountain scale, river width, and field-grid density. Any tile that drifts into a noticeably different view angle should be reworked instead of accepted just because the local art looks good.
- Additional v3 terrain audit: the large near-vertical river beside the right/eastern city is suspect if that city is Luoyang. Future Guanzhong-Henan attempts should keep v3 perspective but correct Luoyang water grammar: Yellow River farther north/upper side, Luo/Yiluo water near Luoyang reading more west-east/horizontal, and no dominant vertical river hugging the city.
- `rep_guanzhong_henan_v4` was generated as the first correction attempt: perspective broadly matches v3, the dominant vertical river beside Luoyang is removed, and the main river reads more horizontally in the upper/northern band. Remaining review risk: dense tree/field clusters and strong upper river may still need producer judgment.
- Producer accepted `rep_guanzhong_henan_v4` as the current first Stage 4 representative reference candidate. Next representative brief is `stage4_rep_bashu_hanzhong_v1_generation_brief.md`; it must preserve v4 perspective while testing Hanzhong/Bashu basin and mountain-corridor grammar.
- `rep_bashu_hanzhong_v1` was generated. Light review: perspective is broadly consistent with v4, enclosed basin and west-east Han River read well. Review risks: two large city footprints may be too dense, roads may read too clean, and tree/field clusters need pseudo-settlement review at game scale.
- Producer accepted `rep_bashu_hanzhong_v1`; perspective, city treatment, and terrain material are consistent with the Luoyang-Changan / Guanzhong-Henan representative direction. This is a positive signal for Stage 4 cross-tile visual consistency.
- Third representative brief `stage4_rep_huaisi_jiangdong_v1_generation_brief.md` targets Huai-Si/Jiangdong lowland water-network differentiation while preserving the v4/Bashu perspective and material language. Built-in imagegen attempts 1-6 failed with `ServerError`; no image candidate yet.
- Producer accepted `rep_huaisi_jiangdong_v1`. It is approved as the Jiangdong/lower-Yangtze water-network representative direction: strong water-town feeling, consistent perspective/city scale/material with `rep_guanzhong_henan_v4` and `rep_bashu_hanzhong_v1`, and not a mountain-basin read. Caveat for later production: it is stronger as Jiangdong water-network grammar than as a precise Huai-Si northern corridor reference, so Huai River / Shouchun-Hefei-Xuzhou-Guangling corridor control remains a later production-tile concern.
- Producer approved Stage 5 final tile plan: `tile_index_v2_final_candidate.md` plus `tile_grid_v2_final_candidate.html`. Locked for Stage 6: 4 x 3 / 20% overlap, 4x output scale (full stitched target 6688 x 3764; tile outputs 2008/2344 wide by 1508/1756 high), N/E/S/W neighbor lists, diagonal context, and production order starting from `T06_CC_W`. Producer hard conditions for every production tile: consistent perspective/style, clean seam/overlap connection, and terrain/geography review with no major problem or out-of-place feature. Added active gate `docs/map_design/work/tile_plan/stage6_tile_quality_gate_v1.md`; Stage 6 manifests must record perspective/style, seam/overlap, terrain/geography, pseudo-settlement, and runtime-isolation gates.
- First Stage 6 production brief added: `docs/map_design/work/tile_plan/stage6_t06_cc_w_generation_brief.md`. Target `T06_CC_W` central-west Guanzhong-Henan / Luoyang-Changan corridor. Must keep rep v4 perspective/style, bounded plains, Yellow River / Wei-Luo-Yiluo logic, southern Qinling-Funiu foothill edge, overlap-friendly edges, no dominant vertical river beside Luoyang, and no pseudo-settlements. Next action: generate `tile_t06_cc_w_v1`.
- `T06_CC_W` v1 generated and author-marked `REWORK`: visually strong but too water-network/delta/island-heavy, reading closer to Jianghuai/Jiangdong than Guanzhong-Henan. v2 generated after shorter retry and is pending producer review: perspective/style PASS, dry bounded plains and upper/northern main river much closer to target, seam PENDING_NEIGHBOR, terrain PASS with review note. Main caution: right/eastern city still has a noticeable north-south local river; producer should decide whether acceptable or rework. Files: `docs/map_design/work/stitch/tile_t06_cc_w_v2.png`, manifest, overlay HTML.
- 2026-06-09 T06 scope correction: producer caught the key issue that full `T06_CC_W` is not a two-city-only scope. Added `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`. Approximate CITY_BASE anchor check shows many city zones in/near the crop; the two-city rule belonged to Stage 4 representative Guanzhong-Henan, not Stage 6 production. `tile_t06_cc_w_v2` changed from pending review to `REWORK` for full production scope. Next T06 generation must use city hierarchy: primary Chang'an/Luoyang, secondary/subdued controlled corridor anchors, seam-aware edge city zones, and no random non-data settlements.
- Corrected full-scope T06 built-in imagegen attempts 5-7 failed with `ServerError`; no new corrected image candidate produced. Do not resurrect v2 as PASS; retry later or use explicit CLI/API fallback only if producer asks for that path.
- Corrected full-scope T06 attempt 8 succeeded: `docs/map_design/work/stitch/tile_t06_cc_w_v3.png`. v3 fixes the v2 city-scope error with two major cities plus several smaller subdued controlled city marks. Author gate: perspective/style PASS, seam PENDING_NEIGHBOR, terrain PASS, pseudo-settlement PASS, runtime PASS. Main review risk remains the right/eastern north-south local river; producer should judge whether it fits as local Luo/Yiluo-style water/corridor or needs rework.

## 2026-06-09 Stage 6 Production Pipeline Correction

Producer review of `tile_t06_cc_w_v5` exposed that Stage 6 production cannot rely on all-in-one imagegen outputs. The style is aligned, but city placement, city size, roads, terrain, and overlap seams are too precise for free AI generation.

Settled working rule:

- Stage 1-5 remain valid: national-first, 4 x 3 grid, 20% overlap, 4x scale, representative style references, and T06-first production order.
- Stage 6 execution changes to a controlled pipeline.
- Build `control_master_v1` first as the national control artifact: all 55 CITY_BASE anchors, tile grid, overlap bands, city classes, road graph, and major river/mountain zones.
- Build `T06_control_overlay_v1` from `control_master_v1` before any further T06 image generation.
- Imagegen may generate no-city terrain bases and local blend/paint-over, but it must not decide city count, city position, city hierarchy, primary roads, pass/ferry placement, or duplicate/missing-city QA.
- City and primary road layers must be deterministic; city stamps can be generated as art sources but placed by rules.
- Road graph provenance matters: derive initial links from existing game adjacency/road data plus approved geography notes, and mark missing/rerouted strategic links `PENDING_PRODUCER_APPROVAL`.
- If T06 proves the pipeline, automate the next batch `T01_NW` through `T05_WC` for control overlays, city scope tables, road graph clipping, manifest skeletons, and QA, while keeping producer review for terrain composition and visual pass/fail. This is a next batch only; the full approved 4 x 3 plan still includes T07-T12.

Docs updated:

- `docs/map_design/work/tile_plan/stage6_production_pipeline_v1.md`
- `docs/map_design/MAP_MASTER_WORKFLOW_v1.md`
- `docs/map_design/WORKLOG.md`

First control artifacts:

- `docs/map_design/work/tile_plan/control_master_v1.html`
- `docs/map_design/work/tile_plan/T06_control_overlay_v1.html`
- `docs/map_design/work/tile_plan/control_master_v1_manifest.md`
- `docs/map_design/work/tile_plan/T06_control_overlay_v1_manifest.md`

Verification: static data check reports 55 cities, 111 roads, 11 river paths; T06 has 21 in-crop city anchors and 31 anchors with 80 px context margin. Edge headless screenshots rendered nonblank previews; do not proceed to T06 terrain generation until producer reviews the control overlays.

## 2026-06-09 T06 Collision And Geography Gate

Producer review of the control overlay raised two necessary Stage 6 gates before no-city terrain generation:

- City circles in `T06_control_overlay_v1` are only control footprints, not final city-stamp bounds. Final stamps need walls, gates, shadows, road tie-ins, and paper/ink blending, so close city clusters can collide even when control circles barely fit.
- `ROADS` and especially `RIVERS` are source review layers, not final geography truth. T06 terrain prompts must be checked against actual geography: Yellow River/Wei River in the north/Guanzhong-Henan control, Luo/Yi/Yiluo around Luoyang, Han River south of Qinling, Yangtze/Jianghan only as bottom/southeast context, and separate Qinling/Funiu/Daba controls.

Added `docs/map_design/work/tile_plan/T06_terrain_geography_collision_audit_v1.md`. Main decisions pending producer review: whether 长安/洛阳 are T06-owned or global primary stamps; whether 新野 is downgraded to avoid 南阳/襄阳 crowding; whether 陈留/官渡/许昌 belong to T07/global ownership; and whether 汉中 is full T06 stamp or west-corridor context.

## 2026-06-10 T06 No-City Terrain Brief Approval

Producer approved continuing the Stage 6 controlled pipeline for T06. Next art step is a no-city terrain base only, not an all-in-one city-bearing tile. City count, city position, city hierarchy, primary roads, pass/ferry placement, and duplicate/missing-city QA remain deterministic later.

T06 ownership/weight decisions:

- 长安 / 洛阳 are global city-layer primary stamps that appear in T06 overlap, not T06-owned final stamps.
- 新野 should be downgraded to small/subdued or delegated to avoid crowding 南阳 / 襄阳.
- 陈留 / 官渡 / 许昌 should be controlled by `T07_CC_E` or the global city layer, with T06 keeping them only as east-overlap context.
- 汉中 is west-corridor context, not a full T06-owned stamp.

City scale metaphor:

- large/primary city: roughly "9 inch pizza" visual weight;
- standard/small city: roughly "5 inch pizza" visual weight;
- edge/context cities may be subdued or clipped, but must not become unreadable sesame-dot texture.

Added `docs/map_design/work/tile_plan/stage6_t06_no_city_terrain_brief_v1.md`. It explicitly requires no cities, no villages, no forts, no passes/gatehouses, no labels, no UI, no hex grid, and no random road network; terrain controls are Yellow River/Wei, Luo/Yi/Yiluo, Han River, Qinling, Funiu, Daba/Bashu context, and Yangtze/Jianghan edge context.

## 2026-06-10 T06 No-City Terrain v1 Rework

Generated `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1.png` from the approved no-city terrain brief. Verdict: `REWORK`.

Reject reasons:

- output frame gate failed: built-in imagegen returned `1448 x 1086`, not required `2344 x 1756`;
- the image still has too many thin path-like lines and small clustered marks, creating random road-network / pseudo-settlement risk.

Overlay audit found the terrain/city-reserve distribution only partly workable if later deterministic city placement may use local nudges/blend pads. Created `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v1_normalized.png` by deterministic resize only, exact `2344 x 1756`, no crop and no AI repaint/edit. Producer then rejected the candidate because the large river between 洛阳 and 长安 is too visually dominant and geographically wrong; this is not fixable by city-position nudging. v2 must avoid a main river between 长安 and 洛阳, keep Yellow River/Wei farther north/upper, keep Luoyang Luo/Yi/Yiluo water smaller/subordinate, and make 长安-洛阳 read as Guanzhong-Henan corridor / pass route / bounded plain transition.

## 2026-06-10 T06 No-City Terrain v2

Generated `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2.png` and deterministic normalized derivative `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png` (exact `2344 x 1756`). Added city overlay `terrain_t06_cc_w_no_city_v2_normalized_city_overlay.png` and manifest. Author review: v2 fixes the blocking v1 river problem; the main river no longer divides 长安 and 洛阳 and now reads as upper/northern control. Current verdict is `PENDING_PRODUCER_REVIEW`. Remaining review questions: whether 洛阳 is still too river-adjacent, whether 襄阳 is acceptable with local city-layer blend/nudge, and whether field/path texture is too dense.

Added `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_geography_city_audit.md`. Recommendation: v2 is viable only if small deterministic city-layer nudges/blend pads are allowed. Priority nudges: 洛阳 slightly south/south-southeast if needed to avoid direct upper-river contact; 襄阳 south/southeast toward a Han River / corridor pocket; 官渡/陈留/许昌 remain T07/global context and visually south of the northern main river if shown.

Producer selected Option A. Added concrete nudge proposal `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.png` and manifest. Proposed normalized-frame nudges: 洛阳 `+36,+64`, 襄阳 `+46,+78`, 陈留 `0,+54`, 官渡 `-8,+54`, 许昌 `0,+46`, 夷陵 `-20,+20`, 武昌 `-16,+18`, 江陵 `0,+22`. This remains an art-layer proposal only; runtime city data is unchanged.

## 2026-06-10 Stage 6 Controlled Tile Lessons

Added reusable lesson doc:

- `docs/map_design/work/tile_plan/stage6_controlled_tile_lessons_v1.md`

Durable lessons for later tiles:

- A good-looking tile can still fail if major geography is wrong. Do not move cities to rescue a bad river or mountain layout; rework terrain.
- Every tile needs the same audit loop: control overlay, no-city terrain brief, frame gate, normalized terrain, city overlay, geography/city audit, then producer verdict.
- City nudges are allowed only as documented art-layer proposals. They do not change runtime city data or `CITY_BASE`.
- Tile scope is not final ownership. Classify city anchors as primary-owned, global-overlap, context, delegate, or omit-from-stamp-pass before stamp work.
- Imagegen prompt bans are not sufficient. Roads, village-like clusters, pseudo-forts, and wrong water grammar still need post-generation audit.
- Future tiles should reuse the T06 file pattern: terrain manifest, city overlay, geography/city audit, and optional nudge proposal manifest.
