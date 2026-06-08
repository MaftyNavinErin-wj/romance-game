# Stage 3 Provisional National Tile Plan v1

## Identity

- Candidate id: `tile_plan_v1`
- Stage: Stage 3, provisional national tile plan
- Date: 2026-06-08
- Status: `PASS` producer-approved provisional tile plan
- Runtime impact: none

## Inputs

- National reference: `docs/map_design/work/national_concept/national_concept_v5.png`
- National reference size: 1672 x 941 px
- Stage 1 verdict: producer-approved style/reference direction with caveat
- Stage 1 caveat: road/river details contain some small settlement or mini-city-like marks. Later tile generation, repainting, and compositing must remove or suppress those marks. True cities, forts, and settlements remain data-controlled.
- Stage 2 approved references:
  - `stage2_art_kit_v1_01_capital_reference.png`
  - `stage2_art_kit_v1_02_city_reference.png`
  - `stage2_art_kit_v1_05_farmland_reference.png`
  - `stage2_art_kit_v1_06_riverbank_reference.png`
  - `stage2_art_kit_v2_01_pass_fort_reference.png`
  - `stage2_art_kit_v2_02_foothill_forest_reference.png`
  - `stage2_art_kit_v2_03_mountain_pass_reference.png`
  - `stage2_art_kit_v2_04_road_pass_reference.png`

## Provisional Canvas

- Planning coordinate space: v5 concept pixel coordinates, `1672 x 941`.
- Final production resolution: not locked in Stage 3.
- Working assumption for Stage 4 representative tiles: generate/repaint each crop at high enough resolution to evaluate city/terrain/road/river detail under future labels and units.
- Current city and hex data remain review anchors, not final bitmap constraints.

## Provisional Grid

- Grid model: 4 columns x 3 rows.
- Nominal cell size on v5 concept: about 418 x 314 px.
- Overlap target: 20% of nominal tile size.
- Concept-space overlap used in this draft: about 84 px horizontally and 63 px vertically.
- Purpose: review seam risk and representative coverage before locking final tile count.

| Tile id | Role | Concept crop x,y,w,h | Notes |
|---|---|---:|---|
| `T01_NW` | northwest / frontier-west | `0,0,502,377` | Western/northern highlands and edge texture. |
| `T02_NC_W` | north-central west | `334,0,586,377` | Guanzhong/northern corridor edge; overlap with central plains. |
| `T03_NC_E` | north-central east | `752,0,586,377` | North China Plain / Taihang relationship. |
| `T04_NE` | northeast / coast-north | `1170,0,502,377` | Eastern plain/coast and northern belt edge. |
| `T05_WC` | west-central | `0,251,502,439` | Bashu/Hanzhong approach and western corridors. |
| `T06_CC_W` | central west | `334,251,586,439` | Guanzhong-Henan/Luoyang-Changan representative area candidate. |
| `T07_CC_E` | central east | `752,251,586,439` | Henan/Huai-Si transition and central river routes. |
| `T08_EC` | east-central | `1170,251,502,439` | Huai-Si/Jiangdong approach and eastern water network. |
| `T09_SW` | southwest/southwest frontier | `0,564,502,377` | Bashu south / southern terrain transition. |
| `T10_SC_W` | south-central west | `334,564,586,377` | Jingzhou/Yangtze corridor transition. |
| `T11_SC_E` | south-central east | `752,564,586,377` | Jianghan/Jiangdong water and hill transition. |
| `T12_SE` | southeast / Lingnan-coast | `1170,564,502,377` | Jiangdong/coastal hills/Lingnan texture. |

## Stage 4 Representative Crop Candidates

These are not final production tiles. They are focused validation crops to test whether the approved style and art kit scale into high-detail work.

| Candidate id | Concept crop x,y,w,h | Purpose | Review risk |
|---|---:|---|---|
| `rep_guanzhong_henan_v1` | `445,250,540,280` | Capitals, plains, Yellow River/Wei-Han logic, Luoyang-Changan road/pass relationship. | City scale, pass/road logic, pseudo-settlement suppression near roads/rivers. |
| `rep_bashu_hanzhong_v1` | `160,540,460,310` | Mountain basins, Hanzhong corridor, Bashu approaches, enclosed terrain grammar. | Basin readability, mountain density, route not becoming a UI line. |
| `rep_huaisi_jiangdong_v1` | `1030,530,520,310` | Huai-Si corridor, Jiangdong/lower Yangtze water network, ferries, dense but controlled settlement texture. | River hierarchy, random mini-city marks, label/overlay breathing room. |

## Boundary Review Notes

- This draft intentionally avoids locking final tile geometry.
- The 4 x 3 grid is a review model because it is simple enough to inspect and still separates west, central plains, Jiangdong, and southern terrain zones.
- Some major review areas cross nominal tile boundaries. That is acceptable at Stage 3 because representative crops can be independent of final tile rectangles.
- Later final tile planning should avoid placing major capitals, important river confluences, and strategic chokepoints exactly on hard tile boundaries where practical.
- The 12 national production tiles intentionally overlap neighboring tiles for seam control.
- The three Stage 4 representative crops are independent validation slices, not a stitch set. They do not need mutual overlap. If seam testing is needed, define separate neighbor-context strips later.

## Gate Questions

- 4 x 3 national grid model: approved.
- 20% production-tile overlap: approved for provisional planning.
- Three Stage 4 representative crops: approved as independent validation slices, not a stitched set.
- Representative crop mutual overlap: not required and intentionally avoided.
- First representative tile order: pending next production decision.

## Producer Decision

- Decision: producer approved `tile_plan_v1` on 2026-06-08.
- Approved scope: 4 x 3 national tile grid, 20% production-tile overlap, and the three independent Stage 4 representative crop candidates.
- Clarification: production tiles overlap for seam control; representative crops do not need mutual overlap because they are independent style/detail validation slices.
- Required changes: none before Stage 4 planning.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified by this plan.
