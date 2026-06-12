# T06 v2 City Stamp Cutout Composite v1 Manifest

## Identity

- Candidate id: `terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1`
- Base candidate: `terrain_t06_cc_w_no_city_v2_normalized`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Verdict: `PROOF_PASS_WITH_REVIEW_NOTES`
- Date: 2026-06-12
- Runtime impact: none

## Files

- Composite script: `docs/map_design/work/stitch/create_t06_city_stamp_composite_v1.py`
- Composite PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1.png`
- Review preview PNG: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1_preview.png`
- Placement JSON: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v1_placements.json`
- Source cutout manifest: `docs/map_design/work/stitch/city_stamp_sources/t06_city_stamp_source_cutout_masked_manifest_v1.md`
- Controlling brief: `docs/map_design/work/tile_plan/stage6_t06_city_stamp_cutout_compositing_brief_v1.md`

## Purpose

Test the first deterministic T06 compositing proof that uses the `rembg` / `u2netp` object-level city cutouts at the approved art-layer city positions.

This proof does not define final city art, final road graph, runtime city coordinates, or runtime asset promotion.

## Deterministic Method

- Terrain base: `terrain_t06_cc_w_no_city_v2_normalized.png`.
- City anchors: read from `src/data/city_base.js` for art-layer placement only.
- Rendered set: 11 cities/context stamps.
- Stamp source selection:
  - `primary_large` cutout for 长安 / 洛阳;
  - `standard_city` cutout for 南阳 / 襄阳 / 上庸 / 夷陵;
  - `subdued_context` cutout for 新野 / 汉中 / 陈留 / 官渡 / 许昌.
- Approved nudges are preserved:
  - 洛阳 `+36,+64`;
  - 襄阳 `+46,+78`;
  - 陈留 `0,+54`;
  - 官渡 `-8,+54`;
  - 许昌 `0,+46`;
  - 夷陵 `-20,+20`.
- 官渡 also preserves the accepted stamp-local visible-fit offset `-26,+34`.
- Runtime files touched: none.

## Render Verification

- Script run result from prior session: exit code `0`, wall time about `3.4s`.
- Composite output size: `2344 x 1756`.
- Preview output size: `2344 x 1756`.
- Placement JSON: valid JSON, 11 entries.
- Preview PNG: opens and is nonblank.

## Placement Review

| City/group | Review |
|---|---|
| 长安 | Readable primary stamp. It is visible without overwhelming the Guanzhong corridor. Slight icon-like wall silhouette remains acceptable for a proof. |
| 洛阳 | Readable primary stamp. After the approved nudge, it reads near Luo/Yiluo local water rather than directly as a northern main-river bank city. |
| 南阳 | Standard stamp reads clearly and has enough plain/corridor space. |
| 襄阳 | Standard stamp is acceptable after the approved south/southeast nudge. It reads as Jingxiang/Han corridor rather than mountain crest, though final blend still matters. |
| 上庸 | Standard stamp fits the mountain/valley corridor. |
| 夷陵 | Standard stamp is acceptable as a river/mountain corridor anchor. It should stay locally blended so it does not read as floating in water. |
| 新野 / 汉中 | Subdued/context weight is appropriate. Do not promote them to stronger T06-owned stamps. |
| 陈留 / 许昌 | East-context stamps are visually light and can remain delegated context. |
| 官渡 | Technically off water after the current fit, but still too tight to the riverbank. The source-local gate/approach mark risks implying an unapproved crossing or road decision. |

## Visual Verdict

Result: `PROOF_PASS_WITH_REVIEW_NOTES`.

Positive:

- The `v9` object cutouts are usable at T06 scale; they no longer read as oval or rectangular source screenshots.
- The composite respects the approved hierarchy: primary/global, T06 standard, subdued/context, and east-context.
- The stamps are not too strong at full-tile scale and do not dominate the terrain.
- 洛阳, 南阳, 襄阳, 上庸, 夷陵, 新野, 汉中, 陈留, and 许昌 are broadly acceptable for a first proof.

Cautions:

- Overall stamp weight is slightly weak at full-tile scale, especially for context marks.
- Primary and standard stamps still read as discrete placed assets in zoom crops; final blend treatment needs more terrain-colored integration.
- 官渡 is the main blocker for approval as-is: it is on land, but still visually river-tight and carries a small source-local approach mark that can read as a crossing.
- No gate/ramp/source-local mark should be treated as road graph approval.

## Pending Producer Proposal For v2

Do not generate `v2` until producer approval.

Proposed v2 scope:

- Keep the same terrain base, rendered city set, source cutouts, city classes, and approved art-layer city nudges.
- Keep runtime unchanged and do not promote anything to `assets/maps/`.
- Increase only visual integration:
  - add a slightly warmer local blend pad under standard/context stamps;
  - raise context stamp opacity modestly so 陈留 / 官渡 / 许昌 do not disappear at full-tile scale;
  - keep primary stamp size stable to avoid making 长安 / 洛阳 too icon-like.
- For 官渡 only, test a stronger visible-stamp fit away from the water:
  - current fit: `-26,+34`;
  - proposed review target: move the visible stamp a little farther south/southwest, roughly another `-8,+18` to `-16,+28` in normalized-frame pixels;
  - mask or soften the source-local gate/approach mark so it reads as local bank texture, not as a road/crossing graph.

Approval question: should `v2` implement this conservative visual-fit pass, or should 官渡 receive a different producer-directed treatment first?

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
