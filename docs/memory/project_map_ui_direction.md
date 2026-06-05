---
name: Map UI direction and terrain-base research
description: 2026-06-03 map UI exploration notes: bitmap/hex/icon tension, 3D prototype result, 2D comparison tool, and external map-data candidates
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
