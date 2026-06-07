# National Concept Manifest v2

## Identity

- Candidate id: `national_concept_v2`
- Stage: Stage 1, national low-resolution concept
- Verdict: `REWORK` after producer scale feedback
- Date: 2026-06-07
- Author/session: Codex imagegen built-in mode

## Files

- Repo output path: `docs/map_design/work/national_concept/national_concept_v2.png`
- Review overlay path: `docs/map_design/work/national_concept/national_concept_v2_overlay.html`
- Seam preview path(s): none; seam review starts after tile planning
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea24b-c313-7510-bd26-c685ca3bc7c2\ig_0231bbe904216b53016a25795948a081939075156002b1cb19.png`
- Reference image path(s): none used directly

## Generation

- Tool/path: built-in `image_gen`
- Prompt:

```text
Use case: stylized-concept
Asset type: Project Romance Stage 1 national low-resolution map-art concept, version 2 with stricter geography control
Primary request: Create a wide national historical geography map concept for a Three Kingdoms era strategy game, showing an ancient China terrain master as an ink-and-watercolor map base. Prioritize recognizable strategic geography over fantasy composition.
Scene/backdrop: top-down historical map of ancient China, with a recognizable north China plain, Guanzhong basin, Henan/Luoyang central plain, Bashu/Sichuan basin, Hanzhong corridor, Jingzhou middle Yangtze, Jiangdong/lower Yangtze water network, Huai-Si corridor, Liaodong/northern frontier, and southern frontier. Coastline should be subdued and plausible, not dominated by fantasy islands or large invented seas.
Subject: coherent national terrain master with two clear river hierarchies: Yellow River in the north with bends across Guanzhong-Henan-North China plain, and Yangtze River across Bashu-Jingzhou-Jiangdong. Include mountain belts that explain passes and corridors: Qinling, Taihang, Dabie, Wushan/Three Gorges, western highlands. Add sparse walled city footprints at strategic nodes, farmland plains, forests, marshes, ferries, roads and pass corridors.
Style/medium: light Chinese ink wash and watercolor on aged paper, historical strategy map background art, readable at game-map scale, not a UI board, not a fantasy map.
Composition/framing: wide landscape 16:9, mostly top-down atlas view, national composition with controlled blank margins, no dramatic perspective, no decorative frame.
Lighting/mood: calm scholarly historical geography, restrained contrast, clean enough for future labels, units, fog, roads, and selection overlays.
Color palette: light beige paper, gray-brown ink mountains, muted blue-gray rivers, restrained olive and straw farmland, low saturation, no deep yellow dirt.
Materials/textures: subtle rice-paper fiber, brushwork ridges, small orthographic walled cities integrated into terrain, hand-painted riverbanks and field grids.
Constraints: no text, no labels, no legend, no compass, no hex grid, no UI icons, no flags, no modern roads, no modern borders, no satellite style, no rectangular patch seams, no floating castle icons, no hard selection boxes, no ownership colors, no units, no watermark.
Avoid: fantasy continents, invented island chains, huge decorative seas, European medieval castles, saturated blue water, dark dirty paper, dense clutter under future gameplay overlays.
```

- Negative constraints: no text, labels, legend, compass, hex grid, UI icons, flags, modern roads, modern borders, satellite style, rectangular patch seams, floating castle icons, hard selection boxes, ownership colors, units, watermark
- Intended size: low-resolution wide national concept, 16:9
- Actual size: 1672x941 PNG
- Reference roles: none

## Post-Processing

- Resize/crop: none
- Color/paper adjustment: none
- Compositing steps: none
- Scripts or commands: copied generated PNG into the repo as `national_concept_v2.png`

## Geography/Data Review

- City anchor overlay: approximate key city anchor zones in `national_concept_v2_overlay.html`
- River/road overlay: approximate Yellow River, Yangtze, road/pass corridors in `national_concept_v2_overlay.html`
- Tile/crop boundary: none; tile planning starts in Stage 3
- Coordinate drift notes: v2 is still not data-authoritative. Producer feedback found its national-scale grammar incorrect: city and terrain details read too large for a full-country scope.
- Movement budget exceeded: no for Stage 1 visual concept review; unknown for future data alignment. Exact movement must be audited later against `CITY_BASE`, `HEX_TERRAIN`, `ROADS`, and `RIVERS`.

## Art Review

- City/fort clarity: readable, but too large for national scope.
- Field/farmland detail: useful, but some terrain marks read at local-crop scale rather than national-map scale.
- Forest/foothill detail: acceptable, but scale should be finer.
- Riverbank/water detail: visually coherent, but river/terrain detail needs finer national-scale treatment.
- Mountain/pass readability: good, but should be more ridge-system and less object-scale.
- Style consistency: good, but producer prefers v1's calmer organic style over v2.
- Patch/seam risk: low inside this single image; tile seam risk not evaluated.

## Runtime Impact

- Runtime impact: none
- If promoted, target runtime asset path: not approved
- Rollback asset path: current runtime map assets unchanged

## Producer Decision

- Decision: `REWORK`
- Required changes: use v1 as the preferred style direction, but correct national-map scale so cities, mountain marks, forests, fields, and rivers are much smaller and more delicate
- Reject/rework reason: producer found city and terrain scale too large for national scope; one city should not visually approach the size of Taiwan or another major regional feature
