# T06 v2 City Stamp Cutout Composite v2 Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2`
- Base candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `PROOF_READY_FOR_PRODUCER_REVIEW`
- Date: 2026-06-15
- Runtime impact: none

## Files

- Composite script: `docs/map_design/work/stitch/create_t06_city_stamp_composite_v2.py`
- Composite PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2.png`
- Review preview PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2_preview.png`
- Placement JSON: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v2_placements.json`
- Prior v1 manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1_manifest.md`

## Producer Feedback Addressed

Producer review of v1 found:

- primary city stamps were still slightly too large;
- smaller city/context stamps were too small;
- 洛阳 had a clear placement problem and visually sat in water.

This v2 is a conservative deterministic parameter pass only. It does not repaint the terrain base, alter runtime city coordinates, promote a runtime map asset, or define the final road graph.

## Deterministic Changes From v1

Stamp widths in the normalized `2344 x 1756` frame:

| Class | v1 | v2 |
|---|---:|---:|
| `global-primary` | 188 | 170 |
| `t06-standard` | 122 | 136 |
| `subdued` | 86 | 98 |
| `east-context` | 78 | 94 |

Opacity:

| Class | v1 | v2 |
|---|---:|---:|
| `global-primary` | 0.92 | 0.90 |
| `t06-standard` | 0.86 | 0.88 |
| `subdued` | 0.72 | 0.78 |
| `east-context` | 0.68 | 0.76 |

Visible-fit offsets:

| City | v1 fit | v2 fit | Purpose |
|---|---:|---:|---|
| 洛阳 | `0,+0` | `-24,+84` | Move the visible primary stamp off the northern water band and onto the southern plain/corridor side. |
| 官渡 | `-26,+34` | `-42,+62` | Move the visible context stamp farther off the riverbank. |

Additional handling:

- 官渡 gets a local deterministic source-approach softener over the lower/right approach mark so it reads more like terrain blending and less like an approved crossing or road decision.

## Render Verification

- Script run result: exit code `0`.
- Composite output size: `2344 x 1756`.
- Preview output size: `2344 x 1756`.
- Placement JSON: valid JSON, 11 entries.
- Runtime files touched: none.

## Author Review

Result: `PROOF_READY_FOR_PRODUCER_REVIEW`.

Positive:

- Primary stamps are less dominant than v1.
- Standard and context stamps read more clearly at full-tile scale.
- 洛阳 no longer visually sits in the water band in the v2 composite proof.
- 官渡 is moved farther away from the riverbank than v1 and has its source-local approach mark softened.

Cautions:

- 洛阳 is now an art-layer visible-fit solution, not a final geography correction. Runtime city data is unchanged.
- 官渡 should still be reviewed carefully because the surrounding river/crossing grammar is sensitive.
- The city stamps remain proof cutouts. Final tile production still needs a broader blend/art polish pass before any runtime promotion.
- No gate/ramp/source-local mark should be treated as road graph approval.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
