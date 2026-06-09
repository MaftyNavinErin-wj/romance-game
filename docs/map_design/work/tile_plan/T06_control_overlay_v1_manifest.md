# T06 Control Overlay Manifest: v1

## Identity

- Candidate id: `T06_control_overlay_v1`
- Stage: Stage 6, T06 production control overlay
- Verdict: `PENDING_PRODUCER_REVIEW`
- Date: 2026-06-09
- Author/session: Codex Stage 6 pipeline session

## Files

- Repo output path: `docs/map_design/work/tile_plan/T06_control_overlay_v1.html`
- Review overlay path: `docs/map_design/work/tile_plan/T06_control_overlay_v1.html`
- Seam preview path(s): not applicable; no terrain tile generated
- Generated source path(s): deterministic HTML from repo data and `control_master_v1`
- Reference image path(s):
  - `docs/map_design/work/tile_plan/control_master_v1.html`
  - `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`
  - `docs/map_design/work/national_concept/national_concept_v5.png`
  - `src/data/city_base.js`
  - `src/data/cities.js`

## Generation

- Tool/path: manual deterministic HTML/SVG control overlay.
- Prompt: not applicable.
- Negative constraints: no further T06 image generation before producer review; no random secondary cities; no AI-invented road graph.
- Intended size: T06 crop `334,251,586,439`, output target `2344 x 1756` @4x.
- Actual size: HTML/SVG responsive review page.
- Reference roles: `control_master_v1` is the source control artifact; `t06_city_scope_audit_v1.md` defines the full T06 city-scope correction.

## Post-Processing

- Resize/crop: SVG viewBox crops the 1672 x 941 planning space to T06.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: none beyond static HTML rendering.

## Geography/Data Review

- City anchor overlay: all T06 in-crop city anchors plus 80 px near-boundary context anchors are rendered from `CITY_BASE`.
- River/road overlay: T06-visible roads are clipped from existing `ROADS`; source river paths are shown from `RIVERS`.
- Tile/crop boundary: `T06_CC_W`, concept crop `334,251,586,439`.
- Coordinate drift notes: current overlay uses the existing 960 x 740 runtime map to 1672 x 941 concept-space approximation; final data alignment is not performed here.
- Movement budget exceeded: no.

## Art Review

- City/fort clarity: not applicable; size circles are control footprints, not final city art.
- Field/farmland detail: not applicable.
- Forest/foothill detail: Qinling/Funiu control zone shown for review.
- Riverbank/water detail: source river paths shown for review.
- Mountain/pass readability: broad foothill control zone only.
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
