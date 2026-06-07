# National Concept Manifest v3

## Identity

- Candidate id: `national_concept_v3`
- Stage: Stage 1, national low-resolution concept
- Verdict: `REWORK` after producer terrain feedback
- Date: 2026-06-07
- Author/session: Codex imagegen built-in mode

## Files

- Repo output path: `docs/map_design/work/national_concept/national_concept_v3.png`
- Review overlay path: `docs/map_design/work/national_concept/national_concept_v3_overlay.html`
- Seam preview path(s): none; seam review starts after tile planning
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea24b-c313-7510-bd26-c685ca3bc7c2\ig_0231bbe904216b53016a257bf743d88193bc7a9022f97c43cd.png`
- Reference image path(s): `national_concept_v1.png` used as preferred style direction by producer feedback, not as direct image input

## Generation

- Tool/path: built-in `image_gen`
- Prompt:

```text
Use case: stylized-concept
Asset type: Project Romance Stage 1 national low-resolution map-art concept, version 3 scale-corrected national master
Primary request: Create a wide national historical geography map concept for a Three Kingdoms era strategy game. Use the calmer, more organic v1-style ink-and-watercolor feeling, but correct the national-map scale: cities and terrain symbols must be much smaller and more delicate, suitable for an entire-country scope.
Scene/backdrop: ancient China national map composition from northern frontier and Liaodong through Guanzhong/Henan, Bashu/Hanzhong, Jingzhou, Jiangdong, Huai-Si, and southern frontier. The map should feel like a vast national terrain master, not a local regional crop.
Subject: coherent national terrain base with very fine-grained mountain belts, rivers, forests, farmland, roads, ferries, passes, and many tiny city footprints. Cities should be small walled marks integrated into the terrain: no single city should visually approach the size of Taiwan, an island, a basin, or a major regional terrain feature. Terrain information should appear as dense small brushwork and texture, not oversized objects.
Scale rules: national scope; walled cities are tiny but readable at close inspection, roughly pin-sized architectural footprints; major capitals only slightly larger than other cities; mountains are ridge systems, not isolated giant peaks; rivers are thin hierarchical brush lines; forests and fields are micro-patterns; roads are hairline corridors.
Style/medium: light Chinese ink wash and watercolor on aged paper, historical strategy map background art, organic and painterly like a refined historical atlas, not a UI board and not fantasy.
Composition/framing: wide landscape 16:9, mostly top-down atlas view, controlled blank margins, plausible national geography, no dramatic perspective, no decorative frame.
Lighting/mood: calm scholarly historical geography, restrained contrast, clean enough for future labels, units, fog, roads, and selection overlays.
Color palette: light beige paper, gray-brown ink mountains, muted blue-gray rivers, restrained olive and straw farmland, low saturation, no deep yellow dirt.
Materials/textures: subtle rice-paper fiber, dense small brushwork, delicate mountain ridges, tiny riverbanks, tiny field grids, small orthographic walled settlements with gates and inner blocks visible only on close inspection.
Constraints: no text, no labels, no legend, no compass, no hex grid, no UI icons, no flags, no modern roads, no modern borders, no satellite style, no rectangular patch seams, no floating castle icons, no hard selection boxes, no ownership colors, no units, no watermark.
Avoid: oversized cities, oversized terrain icons, local-crop scale detail, fantasy continents, invented island chains, huge decorative seas, European medieval castles, saturated blue water, dark dirty paper, dense clutter that blocks future gameplay overlays.
```

- Negative constraints: no text, labels, legend, compass, hex grid, UI icons, flags, modern roads, modern borders, satellite style, rectangular patch seams, floating castle icons, hard selection boxes, ownership colors, units, watermark, oversized cities, oversized terrain icons
- Intended size: low-resolution wide national concept, 16:9
- Actual size: 1672x941 PNG
- Reference roles: v1 was the producer-preferred style reference; v3 attempts to preserve v1's organic feeling while correcting national scale

## Post-Processing

- Resize/crop: none
- Color/paper adjustment: none
- Compositing steps: none
- Scripts or commands: copied generated PNG into the repo as `national_concept_v3.png`

## Geography/Data Review

- City anchor overlay: approximate key city anchor zones in `national_concept_v3_overlay.html`
- River/road overlay: approximate Yellow River, Yangtze, road/pass corridors in `national_concept_v3_overlay.html`
- Tile/crop boundary: none; tile planning starts in Stage 3
- Coordinate drift notes: v3 is not data-authoritative. It establishes better national-scale city/terrain sizing, but producer feedback found the broad terrain skeleton too weak.
- Movement budget exceeded: no for Stage 1 visual concept review; unknown for future data alignment

## Art Review

- City/fort clarity: improved scale. Cities are now tiny national-map marks rather than local-crop city objects.
- Field/farmland detail: improved scale. Fields read as micro-patterns instead of oversized blocks.
- Forest/foothill detail: acceptable. Forests are smaller and more textural than v1/v2.
- Riverbank/water detail: acceptable. River hierarchy is readable without dominating the map.
- Mountain/pass readability: `REWORK`. Some mountain regions are too light, and the middle reads as one large flat plain instead of bounded basins/corridors.
- Style consistency: good. The image keeps a light ink/watercolor style and is less UI-like than v2.
- Patch/seam risk: low inside this single image; tile seam risk not evaluated.

## Runtime Impact

- Runtime impact: none
- If promoted, target runtime asset path: not approved
- Rollback asset path: current runtime map assets unchanged

## Producer Decision

- Decision: `REWORK`
- Required changes: preserve v3's national-scale sizing and v1's calmer organic style, but restore visible terrain skeleton: Qinling, Taihang/northern belt, Funiu-Dabie, Wushan/Three Gorges, Jiangnan/Wuling/Nanling, western highlands, and southeast coastal hills.
- Reject/rework reason: producer found that the mountains and terrain structure largely disappear, leaving the center as an overly broad flat plain.
