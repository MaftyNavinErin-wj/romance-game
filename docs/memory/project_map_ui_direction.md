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
