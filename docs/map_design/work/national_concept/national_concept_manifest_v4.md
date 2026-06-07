# National Concept Manifest v4

## Identity

- Candidate id: `national_concept_v4`
- Stage: Stage 1, national low-resolution concept
- Verdict: `REWORK` after actual-terrain audit
- Date: 2026-06-07
- Author/session: Codex imagegen built-in mode

## Files

- Repo output path: `docs/map_design/work/national_concept/national_concept_v4.png`
- Review overlay path: `docs/map_design/work/national_concept/national_concept_v4_overlay.html`
- Terrain audit path: `docs/map_design/work/national_concept/terrain_plausibility_audit_v1.md`
- Actual terrain audit path: `docs/map_design/work/national_concept/actual_terrain_audit_v1.md`
- Seam preview path(s): none; seam review starts after tile planning
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea24b-c313-7510-bd26-c685ca3bc7c2\ig_0231bbe904216b53016a2586a188048193841fdf04e1d79d43.png`
- Reference image path(s): `national_concept_v1.png` as preferred style direction, `national_concept_v3.png` as corrected scale reference, and `terrain_plausibility_audit_v1.md` as terrain control layer
- SHA256: `70D8CBF7AF08B86AF390311ED82B56B09EBE54E8E18A6BF9DFB30653FC9B6845`

## Generation

- Tool/path: built-in `image_gen`
- Prompt:

```text
Use case: stylized-concept
Asset type: Project Romance Stage 1 national low-resolution map-art concept, version 4 terrain-audited national master
Primary request: Create a wide national historical geography map concept for a Three Kingdoms era strategy game. Combine the calmer organic ink-and-watercolor feeling of v1, the corrected national-scale detail size of v3, and a clearly visible broad terrain skeleton. This is a whole-country terrain master, not a local crop.

Scene/backdrop: ancient China national map composition from northern frontier and Liaodong through Guanzhong/Henan, Bashu/Hanzhong, Jingzhou, Jiangdong, Huai-Si, and southern frontier. Keep the coastline plausible and subdued. The map must feel vast, structured, and geographically readable.

Core terrain skeleton that must be visible:
- Western highlands / Tibetan edge as a strong western and southwestern barrier mass.
- Qinling as an east-west mountain barrier separating Guanzhong-Chang'an from Hanzhong/Bashu.
- Taihang and northern mountain belt around Bingzhou, Shangdang, Youzhou, and the edge of the North China Plain.
- Funiu-Dabie low mountain and hill transition between Henan, Nanyang, Huai-Si, Hefei/Shouchun, and Xiangyang approaches.
- Wushan / Three Gorges / Yiling mountain-river choke between Bashu and Jingzhou.
- Jiangnan / Wuling / Nanling southern hill and forest belts below Jingzhou, Changsha, Lingling, and toward Lingnan.
- Fujian-Zhejiang southeast coastal hills, so the southeast coast is not a smooth empty plain.

Plains and basins must be bounded, not one giant central flatland: North China Plain, Guanzhong basin, Henan/Luoyang-Xuchang corridor, Chengdu basin, Hanzhong basin, Jianghan plain, Huai-Si corridor, Jiangdong/lower Yangtze water network.

River hierarchy: Yellow River and Wei River in the north/west; Han River from Hanzhong toward Xiangyang/Wuchang; Yangtze from Yiling/Jingzhou/Wuchang/Chaisang/Jianye/Jingkou; Huai River corridor; Gan/Poyang and lower Jiangnan waterways; subtle Lingnan/Pearl River texture. Rivers are thin hierarchical brush lines, not oversized decorative bands.

Scale rules: national scope; cities are tiny map marks, not large illustrated city scenes. Large capitals may be only slightly larger than other cities. No city should visually approach the size of Taiwan, an island, a basin, or a major regional terrain feature. Mountain ranges are ridge systems; forests and fields are micro-patterns; roads/pass corridors are hairline geography.

Style/medium: light Chinese ink wash and watercolor on aged paper, organic and painterly historical atlas, restrained and elegant, not a UI board and not fantasy.
Composition/framing: wide landscape 16:9, mostly top-down atlas view, controlled blank margins, plausible national geography, no dramatic perspective, no decorative frame.
Lighting/mood: calm scholarly historical geography, restrained contrast, clean enough for future labels, units, fog, roads, and selection overlays.
Color palette: light beige paper, gray-brown ink mountains, muted blue-gray rivers, restrained olive and straw farmland, low saturation, no deep yellow dirt.
Materials/textures: subtle rice-paper fiber, dense small brushwork, delicate ridge systems, tiny riverbanks, tiny field grids, small orthographic walled settlements visible only on close inspection.
Constraints: no text, no labels, no legend, no compass, no hex grid, no UI icons, no flags, no modern roads, no modern borders, no satellite style, no rectangular patch seams, no floating castle icons, no hard selection boxes, no ownership colors, no units, no watermark.
Avoid: oversized cities, oversized terrain icons, local-crop scale detail, a giant unbounded central plain, missing mountain belts, fantasy continents, invented island chains, huge decorative seas, European medieval castles, saturated blue water, dark dirty paper, dense clutter that blocks future gameplay overlays.
```

- Negative constraints: no text, labels, legend, compass, hex grid, UI icons, flags, modern roads, modern borders, satellite style, rectangular patch seams, floating castle icons, hard selection boxes, ownership colors, units, watermark, oversized cities, oversized terrain icons, unbounded central plain, missing mountain belts
- Intended size: low-resolution wide national concept, 16:9
- Actual size: 1672x941 PNG
- Reference roles: v1 style direction, v3 scale correction, terrain audit geography control

## Post-Processing

- Resize/crop: none
- Color/paper adjustment: none
- Compositing steps: none
- Scripts or commands: copied generated PNG into the repo as `national_concept_v4.png`

## Geography/Data Review

- City anchor overlay: approximate key city anchor zones in `national_concept_v4_overlay.html`
- River/road overlay: approximate Yellow River, Yangtze, road/pass corridors in `national_concept_v4_overlay.html`
- Tile/crop boundary: none; tile planning starts in Stage 3
- Coordinate drift notes: v4 is not data-authoritative. It is an art/geography concept candidate before exact alignment against `CITY_BASE`, `HEX_TERRAIN`, `ROADS`, and `RIVERS`. `actual_terrain_audit_v1.md` found that it should not be treated as matching real China terrain structure.
- Movement budget exceeded: no for Stage 1 visual concept review; unknown for future data alignment

## Art Review

- City/fort clarity: good for national scope. Cities remain small map marks rather than local-crop objects.
- Field/farmland detail: good. Plains and basins have micro-patterns without becoming one blank flatland.
- Forest/foothill detail: good. Southern and eastern forest/hill textures are more present than v3.
- Riverbank/water detail: good. River hierarchy is readable and restrained.
- Mountain/pass readability: partial. Western highlands, northern belt, central hill transitions, and southern belts are visible, but the Qinling, Taihang/North China Plain edge, Sichuan/Hanzhong basins, and Three Gorges/Yiling choke need tighter real-terrain control.
- Style consistency: good. More terrain-rich than v3 while staying closer to v1's organic ink/watercolor direction than v2.
- Patch/seam risk: low inside this single image; tile seam risk not evaluated.

## Runtime Impact

- Runtime impact: none
- If promoted, target runtime asset path: not approved
- Rollback asset path: current runtime map assets unchanged

## Producer Decision

- Decision: `REWORK`
- Required changes: preserve v4's style and national-scale detail sizing, but tighten real terrain structure using `actual_terrain_audit_v1.md`.
- Reject/rework reason: actual-terrain audit found v4 is only conceptually plausible. It does not yet align well enough with real China terrain structure, especially Qinling, North China Plain/Taihang relationship, Sichuan/Hanzhong basin logic, and Wushan/Three Gorges/Yiling choke.
