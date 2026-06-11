# T06 City Stamp Source Cutout Masked Manifest v1

## Identity

- Source family: `t06_city_stamp_source_v1_cutout_masked`
- Stage: Stage 6 controlled production pipeline
- Date: 2026-06-11
- Scope: source-only masked city-stamp cutouts
- Runtime impact: none
- Status: `OBJECT_CUTOUT_PROOF_SET_CREATED`

## Purpose

Convert the three `t06_city_stamp_source_v1` art-source images into masked source cutouts for later deterministic compositing tests.

These cutouts are source assets only. They do not decide city count, city position, city scale, road graph, local blend outcome, runtime city coordinates, or map promotion.

## Input Sources

| Source class | Input file | Prior source verdict |
|---|---|---|
| `primary_large` | `t06_city_stamp_source_v1_primary_large.png` | `REFERENCE_CAUTION` |
| `standard_city` | `t06_city_stamp_source_v1_standard_city.png` | `REFERENCE_CAUTION` |
| `subdued_context` | `t06_city_stamp_source_v1_subdued_context.png` | `PASS_WITH_NOTES` |

Controlling docs:

- `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_manifest_v1.md`
- `docs/map_design/work/tile_plan/stage6_t06_city_stamp_cutout_compositing_brief_v1.md`
- `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_blend_test_manifest.md`

## Output Files

### Current Review Set

| Source class | Current file | Size | Verdict |
|---|---|---:|---|
| `primary_large` | `t06_city_stamp_source_v1_primary_large_cutout_rembg_u2netp_v9.png` | `1302 x 746` | `PROOF_PASS_WITH_NOTES` |
| `primary_large` preview | `t06_city_stamp_source_v1_primary_large_cutout_rembg_u2netp_v9_preview.png` | `1200 x 760` | `PROOF_PASS_WITH_NOTES` |
| `standard_city` | `t06_city_stamp_source_v1_standard_city_cutout_rembg_u2netp_v9.png` | `1036 x 617` | `PROOF_PASS_WITH_NOTES` |
| `standard_city` preview | `t06_city_stamp_source_v1_standard_city_cutout_rembg_u2netp_v9_preview.png` | `1200 x 760` | `PROOF_PASS_WITH_NOTES` |
| `subdued_context` | `t06_city_stamp_source_v1_subdued_context_cutout_rembg_u2netp_v9.png` | `870 x 493` | `PROOF_PASS_WITH_NOTES` |
| `subdued_context` preview | `t06_city_stamp_source_v1_subdued_context_cutout_rembg_u2netp_v9_preview.png` | `1200 x 760` | `PROOF_PASS_WITH_NOTES` |

### Rejected Intermediates

Archived location:

- `docs/map_design/work/stitch/city_stamp_sources/archive/failed_cutouts_v1_to_v8/`

| Attempt | Files | Verdict | Reason |
|---|---|---|---|
| `v1` | archived `*_cutout_masked_v1.png`, `t06_city_stamp_source_v1_cutout_masked_v1_preview.png` | `REWORK` | Alpha exclusion removed bridge/ramp marks but left obvious transparent rectangular holes in source preview. |
| `v2` | archived `*_cutout_masked_v2.png`, `t06_city_stamp_source_v1_cutout_masked_v2_preview.png` | `REWORK` | Deterministic overpaint removed transparent holes but left visible patched blocks. |
| `v3` | archived `*_cutout_masked_v3.png`, `t06_city_stamp_source_v1_cutout_masked_v3_preview.png` | `REFERENCE_ONLY` | Polygon wall-footprint masks remove the worst gate/ramp extensions, but the irregular polygon shape is too strong and cuts away too much of the useful generated city context. |
| `v4` | archived `*_cutout_papercut_v4.png`, `t06_city_stamp_source_v1_cutout_papercut_v4_preview.png` | `REWORK` | Preserves the generated city better than v3, but the mask still reads as an oval/soft screenshot rather than a true object cutout. |
| `v5` | archived `*_cutout_flood_v5.png`, `t06_city_stamp_source_v1_cutout_flood_v5_preview.png` | `REWORK` | Edge flood-fill improves background removal slightly but still leaves a large wash blob around the city. |
| `v6` | archived `*_cutout_structure_v6.png`, `t06_city_stamp_source_v1_cutout_structure_v6_preview.png` | `REWORK` | Structure mask still collapses into an oval wash and is not a minimal complete city cutout. |
| `v7` | archived `t06_city_stamp_source_v1_primary_large_cutout_object_v7.png`, preview | `REWORK` | Hand-guided mask still retained too much upper paper wash and clipped awkwardly. |
| `v8` | archived `t06_city_stamp_source_v1_primary_large_cutout_object_v8.png`, preview | `REWORK` | Tighter hand-guided mask still retained a geometric paper block and was not object-level enough. |
| `v9` | `*_cutout_rembg_u2netp_v9.png`, per-source previews | `PROOF_PASS_WITH_NOTES` | `rembg` / `u2netp` gives the first usable object-level cutout proof set for primary, standard, and subdued sources. |

## Deterministic Method

- Rejected v1-v8 tooling: local PowerShell / .NET `System.Drawing` and local Python/Pillow hand-guided masks.
- Current v9 tooling: local Python `rembg[cpu]` with the `u2netp` model.
- AI generation/editing: none.
- Runtime files touched: none.
- Current conclusion: v9 is the first usable object-level source proof set. It is still not final stamp art and must be reviewed at T06 scale before deterministic compositing.
- Rationale: the original source images are good; earlier local masks either cut the city too crudely or kept too much soft oval background, while v9 removes the broad background more cleanly.

## Cutout Review

### Current Review

Verdict: `OBJECT_CUTOUT_PROOF_SET_CREATED`.

The source city images remain useful. Local manual/threshold attempts v1-v8 should not be used in a deterministic T06 compositing prototype. The `v9` proof set is the first acceptable direction for object-level city cutout.

Problems:

- `v3` is too polygonal and visibly arbitrary;
- `v4` is essentially an oval/soft screenshot, not a tight city cutout;
- `v5` and `v6` still retain too much wash/ellipse around the city;
- none of the attempts achieves the desired standard: as small as practical while preserving the whole city silhouette.

`v9` result:

- generated with `rembg` using the small `u2netp` model and alpha matting;
- removes the broad oval/rectangular paper background much better than v1-v8;
- preserves the city walls, gates, towers, and interior blocks across primary, standard, and subdued sources;
- keeps some local shadow/ground texture, which may help blending but still needs review at T06 scale;
- leaves visible gate/ramp extensions, so those must remain local visual material only and cannot imply road graph approval.

Required next method:

- use the `rembg` / `u2netp` object cutout direction as the current source proof set;
- preserve the full city walls, towers, gates, and interior blocks;
- remove the full parchment rectangle and broad oval wash;
- keep only minimal local shadow / paper edge needed for blending;
- handle gate/ramp extensions as local mask decisions rather than cutting large arbitrary shapes.

### Prior `primary_large_cutout_papercut_v4`

Verdict: `REWORK`.

Positive:

- preserves the strong city wall, inner blocks, and primary-city density;
- keeps more of the generated city and local paper wash than v3;
- removes the full rectangular source background;
- no transparent rectangular holes or visible overpaint blocks.

Cautions:

- inner palace/courtyard mass remains visually strong and should still be toned down or scaled carefully for 洛阳 / 长安;
- some door/gate extensions remain because v4 prioritizes complete city extraction over aggressive road-like cleanup;
- later deterministic compositing must decide whether to mask those extensions locally or reinterpret them only as approved short gate tie-ins;
- not final stamp art.

### Prior `standard_city_cutout_papercut_v4`

Verdict: `REWORK`.

Positive:

- preserves medium walled-city read for 南阳 / 襄阳 / 上庸 / 夷陵;
- keeps more of the generated city and local paper wash than v3;
- removes the full rectangular source background;
- cleaner than v1/v2 attempts.

Cautions:

- gate extensions remain visible and must not be treated as an approved road graph;
- square engineered silhouette remains a style caution at final scale;
- not final stamp art.

### Prior `subdued_context_cutout_papercut_v4`

Verdict: `REWORK`.

Positive:

- remains the cleanest source for context/delegated city marks;
- lower density and reduced visual weight fit 新野 / 汉中 / 陈留 / 官渡 / 许昌 context usage;
- preserves the source better than v3 while removing the full rectangular background;
- no road network is introduced.

Cautions:

- the front gate must not imply an unapproved road;
- 官渡 still requires the accepted bank/terrace fit discipline and cannot be solved by this source alone;
- not final stamp art.

## Required Next Use Constraints

Before any deterministic T06 compositing prototype:

- do not use `v1` through `v8` as accepted source cutouts;
- do not treat the `v9` proof set as final stamp art; it still needs deterministic T06 scale/placement review;
- place stamps only at approved art-layer positions from the city-layer preview;
- carry forward 官渡 visible-stamp fit offset `-26,+34` from the accepted placeholder test;
- keep 官渡 visibly off water;
- use a separate soft local paper blend pad if the paper-cut edge reads too tight at final scale;
- review primary/standard gate extensions as local visual material only; do not treat them as road graph decisions;
- do not infer road graph from any gate or source-local mark;
- record every rendered and omitted city.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
