# Stage 4 Representative Tile Brief: Bashu-Hanzhong v1

## Identity

- Planned candidate id: `rep_bashu_hanzhong_v1`
- Stage: Stage 4, representative tile
- Status: image candidate generated; see `rep_bashu_hanzhong_v1_manifest.md`
- Date: 2026-06-08
- Runtime impact: none

## Purpose

Generate the second Stage 4 representative tile after the Guanzhong-Henan first-tile pass.

This tile tests whether the approved map-art style can scale from open capital plains into enclosed mountain basins and corridor terrain while preserving the same perspective grammar as `rep_guanzhong_henan_v4`.

## Approved Inputs

- Stage 1 national reference: `docs/map_design/work/national_concept/national_concept_v5.png`
- Stage 2 art kit: approved as `REFERENCE_ONLY`
- Stage 3 tile plan: `docs/map_design/work/tile_plan/tile_index_v1.md`
- First representative perspective/style reference: `docs/map_design/work/representative_tiles/rep_guanzhong_henan_v4.png`

## Crop Target

From `tile_index_v1.md`:

- Candidate id: `rep_bashu_hanzhong_v1`
- Concept crop: `160,540,460,310`
- Purpose: mountain basins, Hanzhong corridor, Bashu approaches, enclosed terrain grammar
- Review risk: basin readability, mountain density, route not becoming a UI line

## Geography Control Facts

- Hanzhong should read as a long, narrow, fertile basin along the Han River.
- The Hanzhong basin is between the Qinling/Qin Mountains to the north and the Micang/Daba mountain systems to the south.
- The Han River / upper Hanjiang corridor should read broadly west-east through the basin.
- Bashu/Sichuan approach should feel enclosed by mountains and corridors, not like open North China plains.
- Corridor roads should follow valleys and passes naturally; they must not become bright UI routes.

Reference facts checked:

- Britannica: Hanzhong is in a long, narrow, fertile basin along the Han River between the Qin/Tsinling and Micang mountain ranges.
- Qinshu Roads introduction: Hanzhong lies south of high Qinling and north of Daba/Micang mountains, between the Guanzhong/Wei valley and Sichuan basin approaches.

## Producer Constraints Carried Forward

- Keep perspective consistent with `rep_guanzhong_henan_v4`.
- No independent camera drift: camera height, horizon treatment, mountain scale, city scale, river width, and field-grid density must remain compatible with v4.
- Suppress pseudo-settlement marks inherited from Stage 1 caveat.
- Do not invent city/fort/pass density beyond the prompt.
- Do not promote any output to runtime.

## v1 Target

- Wide horizontal Chinese ink-wash regional map tile.
- Same lower oblique map perspective as `rep_guanzhong_henan_v4`.
- Enclosed Hanzhong basin and Bashu approach.
- Mountain ridges on both sides of the basin.
- Han River / upper Hanjiang as a thin west-east river through the basin.
- Valley road/corridor as a subtle terrain line.
- Limited walled city footprints only if needed for scale; do not crowd the basin.
- Dense mountains are allowed, but label/unit breathing room must remain possible.

## Prompt Constraints

- Keep v4-like perspective and map scale.
- Show an enclosed mountain basin, not a generic fantasy valley.
- Han River should run horizontally through the basin.
- Qinling-like northern mountains and Daba/Micang-like southern mountains should frame the corridor.
- Roads must be natural valley hairlines, not UI lines.
- Rivers should be subdued and thinner than city footprints.
- No random mini-cities.
- No villages.
- No temples.
- No courtyard compounds.
- No roadside buildings.
- No riverbank hamlets.
- No extra forts.
- No repeated settlement icons.
- No labels, text, UI, or watermark.

## Candidate Prompt Draft

```text
Wide oblique Chinese ink-wash map, same perspective as rep_guanzhong_henan_v4. Hanzhong-Bashu mountain basin: Qinling mountains north, Daba/Micang mountains south, narrow fertile basin, thin Han River flowing west-east, subtle valley road. Very few controlled walled city footprints only. No villages, forts, temples, roadside buildings, labels, text.
```

## Review Checklist

- Perspective matches `rep_guanzhong_henan_v4`.
- Basin reads as enclosed between northern and southern mountains.
- Han River reads as a west-east basin river.
- Bashu/Hanzhong corridor is legible without becoming a UI road.
- Mountain density supports geography but does not bury future labels/units.
- No pseudo-settlements, extra forts, temples, villages, or roadside buildings.
- Runtime impact remains none.

## Generation Attempts

- 2026-06-08: built-in imagegen attempt 1 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen attempt 2 with shorter prompt succeeded and produced `rep_bashu_hanzhong_v1.png`.

## Next Action

- Producer review of `rep_bashu_hanzhong_v1.png`.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
