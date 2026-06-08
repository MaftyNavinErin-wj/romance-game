# Stage 6 Tile Quality Gate v1

## Identity

- Stage: Stage 6, tile production quality gate
- Date: 2026-06-08
- Status: active for Stage 6 production
- Runtime impact: none

## Purpose

This gate exists to keep the national tile batch from drifting. A tile that looks good in isolation is not enough. Each tile must preserve the accepted representative perspective/style, connect with neighboring tiles, and pass terrain/geography review before producer approval.

## Reference Set

Primary style and perspective references:

- `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
- `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
- `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`

Planning and geography controls:

- `docs/map_design/work/tile_plan/tile_index_v2_final_candidate.md`
- `docs/map_design/work/national_concept/terrain_plausibility_audit_v1.md`
- `docs/map_design/work/national_concept/actual_terrain_audit_v1.md`
- `docs/map_design/work/tile_plan/tile_grid_v2_final_candidate.html`

## Gate A: Perspective And Style Consistency

A tile fails if it noticeably drifts from the accepted representative direction.

Check:

- Low oblique camera angle remains consistent.
- Horizon treatment remains compatible.
- City footprint scale and detail level remain compatible.
- Mountain and hill scale remain compatible with regional terrain type.
- River width and blue-gray saturation remain controlled.
- Field-grid density and tree/forest marks remain compatible.
- Paper tone, ink density, wash texture, and line weight do not jump.

## Gate B: Seam And Overlap Continuity

A tile fails if its edges cannot plausibly connect to neighboring tiles.

Check:

- Rivers continue through overlap zones without broken or contradictory paths.
- Roads, passes, ferry approaches, and corridors line up across neighbors.
- Mountain chains, basins, plains, and water networks continue naturally.
- Field grids and forest texture do not abruptly change density at the boundary.
- Paper color, vignette, and wash texture do not form hard tile rectangles.
- Existing neighbor tiles have seam strip previews; missing neighbors are listed as future seam checks.

## Gate C: Terrain / Geography Review

A tile fails if terrain reads as geographically wrong for its role or contains a major out-of-place feature.

Check:

- Tile role in the Stage 5 plan is visually fulfilled.
- Major rivers and water systems match the intended regional hierarchy.
- Mountain belts, basins, plains, hills, and corridors match the control docs at zone level.
- City zones sit in plausible terrain and corridor relationships.
- Road/pass/ferry logic follows geography rather than decorative layout.
- No major region turns into the wrong terrain type, such as a mountain basin where lowland water network is required.
- No visually dominant feature contradicts the intended geography unless recorded for producer approval.

## Gate D: Pseudo-Settlement Suppression

A tile fails if uncontrolled decorative marks read as extra cities or gameplay nodes.

Reject/rework triggers:

- Random mini-cities.
- Extra forts.
- Temples.
- Roadside compounds.
- Riverbank hamlets.
- Repeated settlement icons.
- Dense decorative clusters that compete with true data-controlled city/fort marks.

## Gate E: Runtime Isolation

Stage 6 remains docs-only unless the producer explicitly approves runtime promotion.

Check:

- Tile output stays under `docs/map_design/work/`.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
- Manifest records runtime impact as `none`.

## Required Review Result

Every Stage 6 tile manifest must include:

- Perspective/style gate: `PASS` / `REWORK`.
- Seam/overlap gate: `PASS` / `PENDING_NEIGHBOR` / `REWORK`.
- Terrain/geography gate: `PASS` / `REWORK`.
- Pseudo-settlement gate: `PASS` / `REWORK`.
- Runtime isolation gate: `PASS` / `FAIL`.

Only tiles with no unresolved `REWORK` / `FAIL` may be presented as producer-approval candidates.
