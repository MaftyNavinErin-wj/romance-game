# Actual Terrain Audit v1

## Purpose

This audit checks whether `national_concept_v4` roughly matches real China terrain structure. It is stricter than `terrain_plausibility_audit_v1.md`.

Verdict: `REWORK`.

v4 is better than v3 as a game-art terrain concept, but it should not be described as matching actual China terrain conditions. It has the right kind of ingredients, but several are still in the wrong proportion or spatial relationship.

## Reference Baseline

Stable physical geography facts used for this check:

- Qinling runs broadly west-east and is a major north/south divide, separating the Wei River side from the Han River/Yangtze side.
- Taihang runs roughly north-south along the edge between the Shanxi/Loess Plateau side and the North China Plain.
- North China Plain is a large open lowland, bounded by Taihang to the west, northern mountains to the north, Dabie/Huai transition to the south, and Bohai/Yellow Sea to the east.
- Sichuan/Chengdu Basin should read as a distinct basin enclosed by western/southwestern highlands and the Qinling/Hanzhong/Wushan corridor systems.
- Wushan/Three Gorges/Yiling should read as a river-and-mountain choke between Bashu and Jingzhou.
- Nanling/Wuling southern belts should separate the Yangtze-side south-central regions from Lingnan/Pearl River areas.
- Southeast coast, especially Zhejiang/Fujian, should retain coastal hill structure instead of becoming smooth empty coast.

Reference URLs checked:

- Britannica, Qin Mountains: `https://www.britannica.com/place/Qin-Mountains`
- Britannica, Taihang Mountains: `https://www.britannica.com/place/Taihang-Mountains`
- China.org.cn, Mountains: `https://www.china.org.cn/english/travel/40493.htm`
- Hong Kong Education Bureau relief sheet, major relief regions: `https://www.edb.gov.hk/attachment/en/curriculum-development/kla/pshe/national-geography/national-geography-resource-portal/Info_Sheet_02-relief-eng.pdf`

## v4 Audit

### What v4 Gets Right

- Western and southwestern mountains are visible again, unlike v3.
- The map no longer reads as one giant central flatland.
- City scale is much closer to national-map scale than v1/v2.
- Southern hills, lower Yangtze water texture, and southeast coastal hills are present.
- The image has a usable v1-like organic style and avoids the local-crop scale failure of v2.

### Main Geography Problems

1. Qinling is not controlled enough.

v4 shows strong diagonal and broken mountain masses, but the Qinling role should be clearer as an east-west barrier between Guanzhong/Chang'an and Hanzhong/Bashu. It currently reads more like a general western mountain web than a decisive north/south divide.

2. North China Plain is too fragmented.

The actual North China Plain should remain a major open lowland. v4 restores hills, but the northern/eastern central area has too many interrupting ridges and hill textures. It risks under-reading the plain's strategic openness.

3. Taihang / Shanxi edge is present but spatially vague.

v4 includes a strong north/south mountain belt, but it needs to more clearly function as the west edge of the North China Plain and the boundary toward Shanxi/Bingzhou/Shangdang, not just a decorative central ridge.

4. Sichuan Basin / Hanzhong corridor need stronger basin logic.

The southwest is mountainous and visually rich, but Chengdu Basin and Hanzhong Basin should be more legible as enclosed lowland/corridor pockets. v4 suggests them, but not clearly enough.

5. Yangtze / Three Gorges / Yiling choke is not explicit enough.

v4 has a good river-mountain mix, but the Bashu-to-Jingzhou transition should read as a strategic river gorge/choke. The current image has mountains and rivers, but the corridor logic is still soft.

6. Coastline and eastern water geography are still concept-like.

The lower Yangtze/Jiangdong water network is useful, but the Bohai/Shandong/Liaodong and southeast coast shapes are not reliable enough to call geographically faithful. They are acceptable as Stage 1 visual texture only.

## Decision

Do not mark v4 as Stage 1 geography pass if the gate requires rough real-China terrain fidelity.

Recommended status:

- Art style: `PASS`
- National-scale detail sizing: `PASS`
- Game-level terrain skeleton: `PARTIAL PASS`
- Actual-China terrain fidelity: `REWORK`

## v5 Update

`national_concept_v5` was generated from this audit.

Author pre-review result: `PASS` for rough Stage 1 actual-terrain control; pending producer decision.

Why v5 is stronger than v4:

- North China Plain reads more open and less cluttered.
- A Taihang-like western edge for the North China Plain is clearer.
- Western/southwestern highlands remain strong without flattening the whole center.
- Sichuan/Hanzhong basin-and-corridor logic is more visible.
- Southern hill belts and southeast coastal hills remain present.
- City and terrain detail still stay closer to national-map scale than v1/v2.

Remaining cautions:

- Qinling is still approximate and reads as a broad barrier system rather than a clean cartographic east-west divide.
- Wushan/Three Gorges/Yiling is improved, but still conceptual.
- v5 is not a data-alignment artifact. It must not be used to move `CITY_BASE`, `HEX_TERRAIN`, `ROADS`, or `RIVERS` without a later explicit Stage 8 proposal.

## v5 Direction

If v5 needs another rework, preserve its style/scale while tightening:

- Make Qinling a clearer west-east divide between Guanzhong and Hanzhong/Bashu.
- Keep the North China Plain open and broad, bounded rather than filled with ridges.
- Place Taihang as a clear north-south western edge of the North China Plain.
- Make Chengdu Basin and Hanzhong Basin visibly enclosed lowland pockets.
- Emphasize Wushan/Three Gorges/Yiling as a river-mountain choke.
- Keep Nanling/Wuling and southeast coastal hills, but avoid making all of south China uniformly mountainous.
- Keep rivers thin and hierarchical, but make Yellow River / Wei / Han / Yangtze / Huai relationships easier to read.
