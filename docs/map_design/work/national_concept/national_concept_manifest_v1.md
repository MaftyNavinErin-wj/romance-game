# National Concept Manifest v1

## Identity

- Candidate id: `national_concept_v1`
- Stage: Stage 1, national low-resolution concept
- Verdict: `REWORK` author pre-review; pending producer decision
- Date: 2026-06-07
- Author/session: Codex imagegen built-in mode

## Files

- Repo output path: `docs/map_design/work/national_concept/national_concept_v1.png`
- Review overlay path: `docs/map_design/work/national_concept/national_concept_v1_overlay.html`
- Seam preview path(s): none; seam review starts after tile planning
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea24b-c313-7510-bd26-c685ca3bc7c2\ig_0231bbe904216b53016a2575d7858c81939cc42464e276cebc.png`
- Reference image path(s): none used directly

## Generation

- Tool/path: built-in `image_gen`
- Prompt:

```text
Use case: stylized-concept
Asset type: Project Romance Stage 1 national low-resolution map-art concept
Primary request: Create a wide national historical geography map concept for a Three Kingdoms era strategy game, showing ancient China as an ink-and-watercolor painted terrain base.
Scene/backdrop: full national map composition from northern frontier and Liaodong through Guanzhong/Henan, Bashu/Hanzhong, Jingzhou, Jiangdong, Huai-Si, and southern frontier; no modern borders.
Subject: coherent national terrain master with major river systems, mountain belts, basins, plains, farmland clusters, road/pass corridors, ferries, walled city footprints, frontier towns, forests, marsh/water networks.
Style/medium: light aged paper, Chinese ink wash and watercolor, historical atlas painting, readable strategic geography, game-map background art, not a UI board.
Composition/framing: landscape 16:9, top-down oblique map-painting feeling, nationwide composition, balanced empty paper margins, major geography readable at small size.
Lighting/mood: calm scholarly historical map, restrained contrast, clean enough for future labels and units.
Color palette: light beige paper, gray-brown ink mountains, muted blue-gray rivers, restrained olive/green-brown forests and farmland, no saturated colors.
Materials/textures: subtle rice-paper fiber, brushwork ridges, hand-painted riverbanks, small orthographic walled cities with gates and inner blocks integrated into terrain.
Constraints: no text, no labels, no legends, no hex grid, no UI icons, no flags, no modern roads, no satellite style, no rectangular patch seams, no floating castle icons, no hard selection boxes, no ownership colors, no units, no watermark.
Avoid: fantasy map symbols, European medieval castles, modern cartographic styling, high-saturation blue rivers, dark dirty paper, clutter that would block future gameplay overlays.
```

- Negative constraints: no text, labels, legends, hex grid, UI icons, flags, modern roads, satellite style, rectangular patch seams, floating castle icons, hard selection boxes, ownership colors, units, watermark
- Intended size: low-resolution wide national concept, roughly 16:9
- Actual size: 1672x941 PNG
- Reference roles: none

## Post-Processing

- Resize/crop: none
- Color/paper adjustment: none
- Compositing steps: none
- Scripts or commands: copied generated PNG into the repo as `national_concept_v1.png`

## Geography/Data Review

- City anchor overlay: approximate key city anchor zones in `national_concept_v1_overlay.html`
- River/road overlay: approximate Yellow River, Yangtze, road/pass corridors in `national_concept_v1_overlay.html`
- Tile/crop boundary: none; tile planning starts in Stage 3
- Coordinate drift notes: v1 is useful as an art grammar draft but should not be treated as Tier A geography pass. The national outline, coastline, river hierarchy, and city placement are too freeform for final approval.
- Movement budget exceeded: yes, likely, if interpreted as geography-authoritative. Accept only as Stage 1 visual grammar candidate unless producer explicitly approves its geography direction.

## Art Review

- City/fort clarity: good for low-resolution concept; walled settlements read as architecture rather than UI markers
- Field/farmland detail: good density and variety across central plains and river basins
- Forest/foothill detail: good visual integration with mountains and river corridors
- Riverbank/water detail: visually coherent, but hierarchy and real-world paths need tighter control
- Mountain/pass readability: strong visual readability; needs future geography anchoring
- Style consistency: good overall paper tone and brush language
- Patch/seam risk: low inside this single image; tile seam risk not evaluated

## Runtime Impact

- Runtime impact: none
- If promoted, target runtime asset path: not approved
- Rollback asset path: current runtime map assets unchanged

## Producer Decision

- Decision: pending
- Required changes: pending producer review
- Reject/rework reason: author pre-review recommends rework before Stage 1 PASS because geography is not controlled enough
