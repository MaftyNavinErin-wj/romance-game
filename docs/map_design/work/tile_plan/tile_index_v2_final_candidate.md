# Stage 5 Final National Tile Plan Candidate v1

## Identity

- Candidate id: `tile_plan_v2_final_candidate`
- Stage: Stage 5, final national tile plan candidate
- Date: 2026-06-08
- Status: `PASS` producer-approved Stage 5 final tile plan
- Runtime impact: none

## Inputs

- Stage 1 national reference: `docs/map_design/work/national_concept/national_concept_v5.png`
- Stage 3 provisional plan: `docs/map_design/work/tile_plan/tile_index_v1.md`
- Stage 4 accepted representative references:
  - `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`
  - `docs/map_design/work/representative_tiles/rep_bashu_hanzhong_v1.png`
  - `docs/map_design/work/representative_tiles/rep_huaisi_jiangdong_v1.png`

## Stage 4 Gate Summary

- Result: `PASS`; producer approved Stage 5 final tile plan on 2026-06-08.
- Style scale check: PASS. The accepted references cover open central plains, enclosed mountain basin/corridor, and lowland water-network geography while preserving a compatible low oblique perspective and map-material language.
- Known carry-forward cautions:
  - `rep_guanzhong_henan_v4`: upper/northern river strength and dense field/tree marks need future overlay review.
  - `rep_bashu_hanzhong_v1`: two large city footprints, clean road strokes, and dense basin detail need future overlay review.
  - `rep_huaisi_jiangdong_v1`: approved as Jiangdong/lower-Yangtze water-network grammar; precise Huai-Si northern corridor still needs production-tile control.
- Runtime impact remains none.

## Locked Planning Space

- Planning coordinate space: `national_concept_v5.png`, 1672 x 941 px.
- Tile grid: 4 columns x 3 rows.
- Production overlap: 20% nominal overlap, expressed in concept space as:
  - horizontal overlap between adjacent columns: 168 px total shared band.
  - vertical overlap between adjacent rows: 126 px total shared band.
- Seam policy: production tiles must include the full overlap band in generated/repainted output. Seam review compares both full neighbor composites and the overlap strips.

## Candidate Output Resolution

This candidate proposes a 4x production scale from concept coordinates:

- Full national master target if stitched: 6688 x 3764 px.
- Scale: 1 concept px = 4 production px.
- Horizontal overlap band at output scale: 672 px.
- Vertical overlap band at output scale: 504 px.
- Rationale: 4x keeps each individual tile below the 3840 px edge ceiling, gives enough room for city/field/river detail, and avoids a single huge generation target.

Producer decision:

- 4x is accepted as the Stage 6 production scale for the current plan.

## Final Tile Index Candidate

| Tile id | Role | Concept crop x,y,w,h | Output px @4x | N | E | S | W | Notes |
|---|---|---:|---:|---|---|---|---|---|
| `T01_NW` | northwest / frontier-west | `0,0,502,377` | `2008 x 1508` | - | `T02_NC_W` | `T05_WC` | - | Western/northern highlands and edge texture. |
| `T02_NC_W` | north-central west | `334,0,586,377` | `2344 x 1508` | - | `T03_NC_E` | `T06_CC_W` | `T01_NW` | Guanzhong/northern corridor edge; overlaps central plains. |
| `T03_NC_E` | north-central east | `752,0,586,377` | `2344 x 1508` | - | `T04_NE` | `T07_CC_E` | `T02_NC_W` | North China Plain / Taihang relationship. |
| `T04_NE` | northeast / coast-north | `1170,0,502,377` | `2008 x 1508` | - | - | `T08_EC` | `T03_NC_E` | Eastern plain/coast and northern belt edge. |
| `T05_WC` | west-central | `0,251,502,439` | `2008 x 1756` | `T01_NW` | `T06_CC_W` | `T09_SW` | - | Bashu/Hanzhong approach and western corridors. |
| `T06_CC_W` | central west | `334,251,586,439` | `2344 x 1756` | `T02_NC_W` | `T07_CC_E` | `T10_SC_W` | `T05_WC` | Guanzhong-Henan / Luoyang-Changan production anchor. |
| `T07_CC_E` | central east | `752,251,586,439` | `2344 x 1756` | `T03_NC_E` | `T08_EC` | `T11_SC_E` | `T06_CC_W` | Henan/Huai-Si transition and central river routes. |
| `T08_EC` | east-central | `1170,251,502,439` | `2008 x 1756` | `T04_NE` | - | `T12_SE` | `T07_CC_E` | Huai-Si/Jiangdong approach and eastern water network. |
| `T09_SW` | southwest / southwest frontier | `0,564,502,377` | `2008 x 1508` | `T05_WC` | `T10_SC_W` | - | - | Bashu south / southern terrain transition. |
| `T10_SC_W` | south-central west | `334,564,586,377` | `2344 x 1508` | `T06_CC_W` | `T11_SC_E` | - | `T09_SW` | Jingzhou/Yangtze corridor transition. |
| `T11_SC_E` | south-central east | `752,564,586,377` | `2344 x 1508` | `T07_CC_E` | `T12_SE` | - | `T10_SC_W` | Jianghan/Jiangdong water and hill transition. |
| `T12_SE` | southeast / Lingnan-coast | `1170,564,502,377` | `2008 x 1508` | `T08_EC` | - | - | `T11_SC_E` | Jiangdong/coastal hills/Lingnan texture. |

## Diagonal Context List

Diagonal neighbors are not direct seam joins, but Stage 6 prompts and reviews should include them for corner continuity where practical.

| Tile id | Diagonal context |
|---|---|
| `T01_NW` | `T06_CC_W` |
| `T02_NC_W` | `T05_WC`, `T07_CC_E` |
| `T03_NC_E` | `T06_CC_W`, `T08_EC` |
| `T04_NE` | `T07_CC_E` |
| `T05_WC` | `T02_NC_W`, `T10_SC_W` |
| `T06_CC_W` | `T01_NW`, `T03_NC_E`, `T09_SW`, `T11_SC_E` |
| `T07_CC_E` | `T02_NC_W`, `T04_NE`, `T10_SC_W`, `T12_SE` |
| `T08_EC` | `T03_NC_E`, `T11_SC_E` |
| `T09_SW` | `T06_CC_W` |
| `T10_SC_W` | `T05_WC`, `T07_CC_E` |
| `T11_SC_E` | `T06_CC_W`, `T08_EC` |
| `T12_SE` | `T07_CC_E` |

## Stage 6 Production Order Candidate

Recommended order:

1. `T06_CC_W`: central-west anchor; extends the accepted Guanzhong-Henan representative direction into a production tile.
2. `T07_CC_E`: central-east bridge; validates Huai-Si transition before eastern water-network tiles.
3. `T08_EC`: east-central water network; connects Jiangdong/lower-Yangtze direction to the Huai-Si bridge.
4. `T05_WC`: western central basin/corridor; connects Bashu/Hanzhong style to central-west.
5. `T10_SC_W`: Jingzhou/Yangtze transition.
6. `T11_SC_E`: Jianghan/Jiangdong water and hill transition.
7. `T02_NC_W`, `T03_NC_E`: northern central continuity.
8. `T01_NW`, `T04_NE`, `T09_SW`, `T12_SE`: edge tiles after core geography is stable.

Reasoning:

- Start with the most validated visual anchor and its direct neighbors.
- Resolve the central river/city logic before edge terrain.
- Delay outer edges until paper/ink density and seam behavior are known.

## Stage 6 Per-Tile Required Outputs

Each production tile should produce:

- Raw tile PNG.
- Manifest using `docs/map_design/CANDIDATE_MANIFEST_TEMPLATE.md`.
- Overlay review image or HTML with:
  - tile boundary,
  - overlap bands,
  - key city zones,
  - major rivers,
  - road/pass/ferry corridors,
  - direct neighbor ids.
- Seam strip previews for every direct neighbor that already exists.
- Author light review against `stage6_tile_quality_gate_v1.md`.
- Producer decision.

## Stage 6 Hard Quality Gates

Every production tile must pass these gates before it can be marked `PASS`:

- Perspective/style consistency: camera height, low oblique angle, horizon treatment, paper color, ink density, city scale, mountain scale, river width, field-grid density, and line weight must stay compatible with the three accepted representative references.
- Seam/overlap continuity: overlap bands must allow neighboring tiles to connect without broken rivers, roads, mountain chains, field grids, paper texture, or abrupt color/ink shifts. Existing neighbors require seam strip previews.
- Terrain/geography review: tile terrain must match its role and the national terrain control docs without large contradictions or out-of-place features. Major rivers, city zones, road/pass/ferry logic, plains, hills, basins, mountains, and water networks must be reviewed before producer decision.
- Pseudo-settlement suppression: random mini-cities, temples, roadside compounds, riverbank hamlets, extra forts, and repeated settlement icons remain reject/rework triggers unless explicitly data-controlled for that tile.
- Runtime isolation: no Stage 6 tile is promoted to `assets/maps/` and no `src/` file changes during docs-only production.

## Stage 5 Gate Questions

- Is the 4 x 3 tile grid now locked for Stage 6 production?
- Is 20% overlap locked at 168 px horizontal / 126 px vertical in concept space?
- Is 4x output scale accepted for Stage 6 production?
- Is the proposed Stage 6 production order accepted?
- Are any tile boundaries or roles still too risky before batch generation?

## Producer Decision

- Decision: approved.
- Approved scope: 4 x 3 final tile grid, 20% overlap, 4x output scale, neighbor list, and Stage 6 production order.
- Producer condition: each tile must maintain consistent perspective/style, must be able to connect cleanly with neighbors, and must pass terrain/geography review without major problems or out-of-place features.
- Required changes: none before Stage 6 tile production.
- Reject/rework reason: none.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified by this plan.
