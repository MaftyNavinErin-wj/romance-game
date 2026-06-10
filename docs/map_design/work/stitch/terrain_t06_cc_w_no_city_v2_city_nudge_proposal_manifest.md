# T06 v2 City Nudge Proposal Manifest

## Identity

- Proposal id: `terrain_t06_cc_w_no_city_v2_city_nudge_proposal`
- Base candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Stage: Stage 6 controlled production pipeline
- Verdict: `PRODUCER_APPROVED_FOR_CITY_LAYER_PREVIEW`
- Date: 2026-06-10
- Runtime impact: none

## Files

- Proposal overlay HTML: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.html`
- Proposal overlay PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_nudge_proposal.png`
- Base image: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_normalized.png`
- Geography/city audit: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_geography_city_audit.md`

## Purpose

Show how Option A would work: keep the v2 no-city terrain base and allow small deterministic city-layer nudges/blend pads where strict projected anchors conflict with terrain readability.

This proposal does not change runtime data and does not move any gameplay logic anchors. It is an art-layer placement proposal only.

## Nudge Rules

- Preserve relative geography and ownership.
- Do not move a city enough to imply different regional ownership.
- Use nudges only to avoid water contact, mountain-crest placement, or clearly wrong side of a major terrain feature.
- Record every nudge in the future city-layer manifest if accepted.

## Proposed Nudges

All deltas are in normalized output pixels on the `2344 x 1756` review frame.

| City | Proposed delta | Reason |
|---|---:|---|
| 洛阳 | `+36, +64` | Move slightly south/southeast so the stamp reads as Luoyang/Luo-Yiluo context rather than directly on the upper main river. |
| 襄阳 | `+46, +78` | Move south/southeast toward a Han River / Jingxiang corridor pocket instead of a mountain-belt edge. |
| 陈留 | `0, +54` | Keep east-context mark south of the northern main river band. |
| 官渡 | `-8, +54` | Keep ferry/frontline context south/southwest of the main river band, still delegated to T07/global. |
| 许昌 | `0, +46` | Keep clearly south of the northern main river band. |
| 夷陵 | `-20, +20` | Slight bank/terrace fit only; avoid water read. |
| 武昌 | `-16, +18` | Edge context bank/terrace fit only. |
| 江陵 | `0, +22` | Southern context bank fit only. |

## Author Review

The proposal is visually reasonable as a first city-layer adjustment pass:

- 洛阳 no longer reads as directly touching the upper river, though it remains river-adjacent.
- 襄阳 sits less aggressively on the mountain edge and reads more like a corridor city.
- 陈留 / 官渡 / 许昌 remain east-context marks and should not become T06-owned.
- The proposal does not solve field/path texture density; that remains a terrain-base review question.

## Producer Decision 2026-06-10

Producer approved this city-layer nudge proposal.

Approved scope:

- keep `terrain_t06_cc_w_no_city_v2_normalized.png` as the current T06 no-city terrain base;
- use the documented nudge directions and approximate distances for the next deterministic city-layer preview;
- keep all nudges as art-layer placement only, with no runtime city-coordinate change;
- keep 陈留 / 官渡 / 许昌 as T07/global delegated east-context marks, not T06-owned standard stamps.

Carry-forward cautions:

- later 洛阳 city-stamp/blend work must imply Luo/Yiluo context, not Yellow River bank placement;
- later 襄阳 city-stamp/blend work should preserve the Han River / Jingxiang corridor read;
- field/path texture density remains a terrain-base caution for later road-layer composition.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
