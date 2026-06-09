# Control Master Manifest: v1

## Identity

- Candidate id: `control_master_v1`
- Stage: Stage 6, production control layer
- Verdict: `PENDING_PRODUCER_REVIEW`
- Date: 2026-06-09
- Author/session: Codex Stage 6 pipeline session

## Files

- Repo output path: `docs/map_design/work/tile_plan/control_master_v1.html`
- Review overlay path: `docs/map_design/work/tile_plan/control_master_v1.html`
- Seam preview path(s): not applicable
- Generated source path(s): deterministic HTML from repo data
- Reference image path(s):
  - `docs/map_design/work/national_concept/national_concept_v5.png`
  - `docs/map_design/work/tile_plan/tile_index_v2_final_candidate.md`
  - `src/data/city_base.js`
  - `src/data/cities.js`

## Generation

- Tool/path: manual deterministic HTML/SVG control overlay.
- Prompt: not applicable.
- Negative constraints: no runtime promotion, no copied city/road truth table, no imagegen-owned cartography.
- Intended size: browser-scaled 1672 x 941 planning-space overlay.
- Actual size: HTML/SVG responsive review page.
- Reference roles: `national_concept_v5.png` is the visual planning background; `CITY_BASE` and `ROADS` are loaded directly as city and road control sources.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: none beyond static HTML rendering.

## Geography/Data Review

- City anchor overlay: all 55 `CITY_BASE` anchors are rendered through the same `hexToPixel` formula used by the runtime map, scaled to concept space.
- River/road overlay: `ROADS` and `ROAD_WAYPOINTS` are loaded from `src/data/cities.js`; source river paths are also shown from `RIVERS`.
- Tile/crop boundary: all 12 Stage 5 tile crops are shown.
- Coordinate drift notes: current overlay uses the existing 960 x 740 runtime map to 1672 x 941 concept-space approximation; final data alignment is not performed here.
- Movement budget exceeded: no.

## Art Review

- City/fort clarity: not applicable; this is a control layer, not final art.
- Field/farmland detail: not applicable.
- Forest/foothill detail: broad terrain control zones only.
- Riverbank/water detail: source river paths only.
- Mountain/pass readability: broad terrain control zones only.
- Style consistency: not applicable.
- Patch/seam risk: not applicable.

## Stage 6 Tile Quality Gate

- Perspective/style gate: not applicable
- Seam/overlap gate: not applicable
- Terrain/geography gate: `PENDING_PRODUCER_REVIEW`
- Pseudo-settlement gate: not applicable
- Runtime isolation gate: `PASS`

## Runtime Impact

- Runtime impact: none
- If promoted, target runtime asset path: not applicable
- Rollback asset path: not applicable

## Producer Decision

- Decision: pending producer review.
- Required changes: pending producer review.
- Reject/rework reason: none yet.
