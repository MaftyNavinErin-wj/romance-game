# National Concept Manifest v5

## Identity

- Candidate id: `national_concept_v5`
- Stage: Stage 1, national low-resolution concept
- Verdict: `PASS` author pre-review for rough actual-terrain control; pending producer decision
- Date: 2026-06-08
- Author/session: Codex imagegen built-in mode

## Files

- Repo output path: `docs/map_design/work/national_concept/national_concept_v5.png`
- Review overlay path: `docs/map_design/work/national_concept/national_concept_v5_overlay.html`
- Terrain audit path: `docs/map_design/work/national_concept/terrain_plausibility_audit_v1.md`
- Actual terrain audit path: `docs/map_design/work/national_concept/actual_terrain_audit_v1.md`
- Seam preview path(s): none; seam review starts after tile planning
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea24b-c313-7510-bd26-c685ca3bc7c2\ig_0231bbe904216b53016a2597b15cc481938010719d6cd43567.png`
- Reference image path(s): `national_concept_v1.png` as preferred style direction, `national_concept_v4.png` as style/scale baseline, and `actual_terrain_audit_v1.md` as real-terrain control layer
- SHA256: `671D621D13FB6CEF70AC10F0FC65A9D89E6FB9FB658DFB3EF0248BA4BAD4385F`

## Generation

- Tool/path: built-in `image_gen`
- Prompt:

```text
Use case: stylized-concept
Asset type: Project Romance Stage 1 national low-resolution map-art concept, version 5 actual-terrain controlled national master
Primary request: Create a wide national historical geography map concept for a Three Kingdoms era strategy game. Preserve the organic ink-and-watercolor style and national-scale tiny detail sizing from v4, but correct the real China terrain structure. This is a whole-country terrain master, not a local crop and not a fantasy map.

Scene/backdrop: ancient China national map composition from the northern frontier and Liaodong through Guanzhong, Henan/Luoyang, North China Plain, Bashu/Sichuan, Hanzhong, Jingzhou, Huai-Si, Jiangdong/lower Yangtze, Lingnan, and southern frontier. The coastline should be plausible but subdued; no decorative island chains.

Real terrain structure requirements:
- Qinling must read as a clear west-east mountain divide south of Guanzhong/Chang'an and north of Hanzhong/Bashu. It separates the Wei River / Guanzhong side from the Han River / Yangtze side.
- Taihang must read as a north-south mountain wall forming the western edge of the broad North China Plain, tied to Shanxi/Bingzhou/Shangdang highlands.
- North China Plain must remain broad, open, and visibly flatter: Ye, Xuchang, Chenliu, Guandu, Xuzhou, Qingzhou zones should not be filled with decorative ridges. It should be bounded by Taihang/northern mountains, Yellow River, Huai/Dabie transition, and eastern coast.
- Sichuan/Chengdu Basin must be a distinct enclosed lowland pocket, surrounded by western/southwestern highlands and connected outward through Hanzhong and the Three Gorges/Yiling corridor.
- Hanzhong Basin must be a narrow corridor/basin between Qinling and the Bashu mountain systems.
- Wushan / Three Gorges / Yiling must read as a river-and-mountain choke between Bashu and Jingzhou, not just random hills.
- Funiu-Dabie low mountains and hills should form a transition around Nanyang, Xiangyang approaches, Hefei/Shouchun, and the Huai-Si corridor.
- Wuling/Nanling southern belts should separate the Yangtze-side south-central regions from Lingnan/Pearl River areas, but south China should not be uniformly mountainous.
- Zhejiang/Fujian southeast coast should retain hill/forest texture, while Jiangdong/lower Yangtze remains a water-network plain.

River hierarchy requirements:
- Yellow River with northern/central plain role, plus Wei River flowing through Guanzhong toward the Yellow River.
- Han River from Hanzhong through Xiangyang toward Wuchang/Yangtze.
- Yangtze from Yiling/Three Gorges through Jingzhou, Wuchang, Chaisang/Poyang, Jianye/Jingkou to the sea.
- Huai River corridor across Shouchun/Hefei/Xuzhou/Guangling direction.
- Gan/Poyang and lower Jiangnan waterways near Jiangdong.
- Subtle Lingnan/Pearl River texture in the south.
Rivers are thin hierarchical blue-gray brush lines, not oversized decorative bands.

Scale rules: national scope; cities are tiny map marks, not large illustrated city scenes. Large capitals only slightly larger than other cities. No city should visually approach the size of Taiwan, an island, a basin, or a major regional feature. Mountain ranges are coherent ridge systems; forests and fields are micro-patterns; roads/pass corridors are hairline geography.

Style/medium: light Chinese ink wash and watercolor on aged paper, organic and painterly historical atlas, restrained, elegant, readable as game background art, not a UI board.
Composition/framing: wide landscape 16:9, mostly top-down atlas view, controlled blank margins, plausible national geography, no dramatic perspective, no decorative frame.
Lighting/mood: calm scholarly historical geography, restrained contrast, clean enough for future labels, units, fog, roads, and selection overlays.
Color palette: light beige paper, gray-brown ink mountains, muted blue-gray rivers, restrained olive and straw farmland, low saturation, no deep yellow dirt.
Materials/textures: subtle rice-paper fiber, dense small brushwork, delicate ridge systems, tiny riverbanks, tiny field grids, tiny orthographic walled settlements visible only on close inspection.
Constraints: no text, no labels, no legend, no compass, no hex grid, no UI icons, no flags, no modern roads, no modern borders, no satellite style, no rectangular patch seams, no floating castle icons, no hard selection boxes, no ownership colors, no units, no watermark.
Avoid: fantasy geography, oversized cities, oversized terrain icons, local-crop scale detail, random ridges across the North China Plain, missing Qinling, missing Taihang edge, missing Sichuan Basin, missing Hanzhong corridor, missing Three Gorges/Yiling choke, huge decorative seas, European castles, saturated blue water, dark dirty paper, dense clutter under future gameplay overlays.
```

- Negative constraints: no text, labels, legend, compass, hex grid, UI icons, flags, modern roads, modern borders, satellite style, rectangular patch seams, floating castle icons, ownership colors, units, watermark, fantasy geography, oversized city/terrain symbols, random ridges across North China Plain, missing Qinling/Taihang/Sichuan/Hanzhong/Three Gorges structures
- Intended size: low-resolution wide national concept, 16:9
- Actual size: 1672x941 PNG
- Reference roles: v1 style direction, v4 style/scale baseline, actual terrain audit control

## Post-Processing

- Resize/crop: none
- Color/paper adjustment: none
- Compositing steps: none
- Scripts or commands: copied generated PNG into the repo as `national_concept_v5.png`

## Geography/Data Review

- City anchor overlay: approximate key city anchor zones in `national_concept_v5_overlay.html`
- River/road overlay: approximate Yellow River, Yangtze, road/pass corridors in `national_concept_v5_overlay.html`
- Tile/crop boundary: none; tile planning starts in Stage 3
- Coordinate drift notes: v5 is not data-authoritative. It is a rough actual-terrain visual concept before exact alignment against `CITY_BASE`, `HEX_TERRAIN`, `ROADS`, and `RIVERS`.
- Movement budget exceeded: no for Stage 1 visual concept review; unknown for future data alignment

## Art Review

- City/fort clarity: good for national scope. Cities remain tiny marks.
- Field/farmland detail: good. North China Plain and eastern plains read more open than v4 while retaining texture.
- Forest/foothill detail: good. Southern and southeast hills/forests remain present without making all south China uniformly mountainous.
- Riverbank/water detail: good. River hierarchy is restrained and readable.
- Mountain/pass readability: improved over v4. Taihang-like north-south edge, western highlands, southern belts, and basin/corridor relationships are clearer.
- Style consistency: good. Keeps v4's organic light ink/watercolor direction.
- Patch/seam risk: low inside this single image; tile seam risk not evaluated.

## Actual Terrain Pre-Review

- Qinling: improved, but still approximate. It reads more like a broad central-west barrier system than a clean cartographic line.
- Taihang / North China Plain: improved. The large open eastern/northern plain is clearer, with a stronger western mountain edge.
- Sichuan / Hanzhong: improved. The west/southwest terrain suggests basin/corridor logic better than v4, but will need explicit data overlay later.
- Wushan / Three Gorges / Yiling: improved but still conceptual. It has a better river-mountain choke impression, not exact geography.
- Southeast / Jiangdong: acceptable for Stage 1; water-network and coastal-hill contrast is clearer than v4.

## Runtime Impact

- Runtime impact: none
- If promoted, target runtime asset path: not approved
- Rollback asset path: current runtime map assets unchanged

## Producer Decision

- Decision: pending
- Required changes: pending producer review
- Reject/rework reason: none from author pre-review. Remaining risk: v5 is only a rough actual-terrain concept, not a precise geography or data-alignment pass.
