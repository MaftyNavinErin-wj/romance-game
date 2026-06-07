# Map Design Worklog

## Current State

- Current approved runtime map asset: unchanged from the existing game state.
- Current map-art workflow status: `MAP_MASTER_WORKFLOW_v1.md` approved for Stage 1 exploration.
- Active stage: Stage 1, national low-resolution concept.
- Active candidate: `national_concept_v5`, author pre-review `PASS` for rough actual-terrain control, pending producer decision.
- Next proposed action: producer review of v5 concept image, overlay, manifest, and actual-terrain audit.

## Decisions

### 2026-06-07

- Pivoted away from continuing Luoyang-Changan crop `v10`.
- Adopted a national-first map-art workflow.
- Current city/hex coordinates are review anchors, not immutable final bitmap constraints.
- New map-art exploration remains inside `docs/map_design/` until producer approval.
- Runtime promotion to `assets/maps/` requires a separate explicit approval.
- Producer approved `MAP_MASTER_WORKFLOW_v1.md` as the Stage 0 gate: national-first workflow, elastic coordinate policy, docs-only workspace, and manifest/overlay review discipline are accepted.
- Created `national_concept_v1` as the first Stage 1 national low-resolution concept candidate. Author pre-review: visually useful art grammar, but not geography PASS; national outline, coastline, river hierarchy, and city placement need tighter control before Stage 1 can pass.
- Created `national_concept_v2` as the preferred Stage 1 national low-resolution concept candidate. Author pre-review: v2 has a stronger national composition, clearer Yellow River/Yangtze hierarchy, more plausible corridor logic, and is ready for producer review.
- Producer feedback on v2: style is acceptable, but national-scope scale grammar is wrong. Cities and terrain details are too large; one city should not approach the visual size of Taiwan or another major regional feature. Producer prefers v1 over v2 as the style direction.
- Created `national_concept_v3` to preserve the calmer v1-like direction while correcting national scale. Cities, forests, fields, roads, and rivers now read as smaller map texture/detail marks.
- Producer feedback on v3: scale is improved, but mountains and broad terrain structure largely disappear. The middle reads as one large flat plain. Stage 1 needs a rough terrain plausibility audit before more generation.
- Added `terrain_plausibility_audit_v1.md` to define the broad terrain skeleton required for v4: western highlands, Qinling, Taihang/northern belt, Funiu-Dabie, Wushan/Three Gorges, Jiangnan/Wuling/Nanling, southeast coastal hills, bounded plains/basins, and major river hierarchy.
- Created `national_concept_v4` using the terrain audit. Author pre-review: v4 is the preferred Stage 1 candidate so far because it combines v1-like organic style, v3-like national-scale detail sizing, and a more visible mountain/basin/river skeleton.
- Actual-terrain audit on v4: v4 remains `REWORK` if judged against real China terrain. It is conceptually stronger but still weak on Qinling as an east-west divide, North China Plain/Taihang relationship, Sichuan/Hanzhong basin logic, and Wushan/Three Gorges/Yiling choke.
- Created `national_concept_v5` using the actual-terrain audit. Author pre-review: v5 is the preferred Stage 1 candidate so far because it keeps v4's style/scale while making the North China Plain more open, the Taihang-like edge clearer, and the basin/corridor relationships more legible.

## Latest Files

- Added `MAP_MASTER_WORKFLOW_v1.md`.
- Added `README.md`.
- Added `CANDIDATE_MANIFEST_TEMPLATE.md`.
- Archived previous Luoyang crop exploration files under `archive/2026-06-04_to_07_luoyang_crop_exploration/`.
- Created empty active work folders under `work/`.
- Added `work/national_concept/national_concept_v1.png`.
- Added `work/national_concept/national_concept_v1_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v1.md`.
- Added `work/national_concept/national_concept_v2.png`.
- Added `work/national_concept/national_concept_v2_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v2.md`.
- Added `work/national_concept/national_concept_v3.png`.
- Added `work/national_concept/national_concept_v3_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v3.md`.
- Added `work/national_concept/terrain_plausibility_audit_v1.md`.
- Added `work/national_concept/national_concept_v4.png`.
- Added `work/national_concept/national_concept_v4_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v4.md`.
- Added `work/national_concept/actual_terrain_audit_v1.md`.
- Added `work/national_concept/national_concept_v5.png`.
- Added `work/national_concept/national_concept_v5_overlay.html`.
- Added `work/national_concept/national_concept_manifest_v5.md`.
