# Production Tile Manifest: T06_CC_W v1

## Identity

- Candidate id: `tile_t06_cc_w_v1`
- Tile id: `T06_CC_W`
- Stage: Stage 6, tile production
- Verdict: `REWORK`
- Date: 2026-06-08
- Author/session: Codex built-in imagegen session

## Files

- Repo output path: `docs/map_design/work/stitch/tile_t06_cc_w_v1.png`
- Review overlay path: none
- Seam preview path(s): none
- Generated source path(s): `C:\Users\ALIENWARE\.codex\generated_images\019ea7b0-d8d1-7f31-8082-0e4cc4e10c0e\ig_0d587a7bfaa02468016a26de7257508196a12f6b5eb2be2f22.png`
- Reference image path(s):
  - `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
  - `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
  - `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`

## Generation

- Tool/path: built-in `image_gen` tool.
- Prompt: see `docs/map_design/work/tile_plan/stage6_t06_cc_w_generation_brief.md`.
- Negative constraints: no dominant vertical Luoyang-side river, no mountain-basin framing, no random mini-cities, no villages, no temples, no roadside compounds, no riverbank hamlets, no extra forts, no labels, no text, no UI, no watermark.
- Intended size: `2344 x 1756` at 4x production scale.
- Actual size: `1448 x 1086` PNG.
- Reference roles: `rep_guanzhong_henan_v4` is primary perspective/style reference; Bashu and Jiangdong references are secondary consistency checks.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: copied generated PNG into `docs/map_design/work/stitch/`.

## Geography/Data Review

- City anchor overlay: none.
- River/road overlay: none.
- Tile/crop boundary: `T06_CC_W`, concept crop `334,251,586,439`.
- Coordinate drift notes: not assessed against runtime anchors.
- Movement budget exceeded: not assessed.

## Art Review

- City/fort clarity: PASS. Two major walled city footprints are controlled and readable.
- Field/farmland detail: PASS. Field density and scale are compatible with accepted references.
- Forest/foothill detail: PASS visually, but terrain placement contributes to the geography issue below.
- Riverbank/water detail: REWORK. Water is too broad and branching for the Guanzhong-Henan production anchor.
- Mountain/pass readability: mixed. Southern mountain edge is visually strong, but the water network makes the tile read less like the intended central-west corridor.
- Style consistency: PASS relative to accepted representative direction.
- Patch/seam risk: PENDING_NEIGHBOR.

## Stage 6 Tile Quality Gate

- Perspective/style gate: `PASS`
- Seam/overlap gate: `PENDING_NEIGHBOR`
- Terrain/geography gate: `REWORK`
- Pseudo-settlement gate: `PASS`
- Runtime isolation gate: `PASS`

## Runtime Impact

- Runtime impact: none.
- If promoted, target runtime asset path: not applicable.
- Rollback asset path: not applicable.

## Producer Decision

- Decision: author-marked `REWORK`; not presented as producer PASS candidate.
- Required changes: reduce water-network / delta / island character; restore dry bounded Guanzhong-Henan plain grammar with one upper/northern main river and limited local Luo/Yiluo water.
- Reject/rework reason: terrain/geography reads too close to Jianghuai/Jiangdong water-network grammar for `T06_CC_W`.
