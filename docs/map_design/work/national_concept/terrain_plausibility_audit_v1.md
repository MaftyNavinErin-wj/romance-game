# Stage 1 Terrain Plausibility Audit v1

## Purpose

This is a rough geography audit for Stage 1 national concept art. It is not a GIS pass and does not approve runtime data migration.

The goal is to prevent image candidates from passing on style alone while losing the broad terrain logic that makes a Three Kingdoms strategy map readable.

## Sources Checked

- `src/data/city_base.js`: 55 city anchor positions, city sizes, and tags.
- `src/data/cities.js`: `ROADS`, `RIVERS`, regional city sets.
- `src/core/map.js`: `TERRAIN_POLYS`, `buildHexTerrain`, terrain types, water/impassable treatment.
- Producer feedback on `national_concept_v1` through `national_concept_v3`.

## Producer Feedback To Preserve

- Style direction: prefer `national_concept_v1` over v2.
- Scale rule: at national scope, cities and terrain details must be much smaller than local crop objects.
- v2 failure: city and terrain objects are too large; one city visually approaches the scale of Taiwan or other major regional features.
- v3 failure: scale is improved, but the middle becomes too flat; important mountain and terrain structure is lost.

## Stage 1 Terrain Control Requirements

### National Scale

- Cities are tiny map marks. Large capitals can be slightly larger, but no city can read as a regional landmass.
- Terrain is a fine information system: ridge texture, field texture, forest clusters, river hierarchy, and hairline roads.
- Local city-wall detail should exist only on close inspection.

### Mountain / Barrier Structure

The national concept must not collapse into a giant central plain. These rough structures need visible presence:

- Western highlands / Tibetan edge: strong western and southwestern barrier mass.
- Qinling / Guanzhong-Hanzhong divide: clear east-west mountain barrier separating Chang'an/Guanzhong from Hanzhong/Bashu approaches.
- Taihang / northern mountain belt: visible barrier around Bingzhou, Shangdang, Youzhou, and the north China plain edge.
- Funiu-Dabie / Henan-Huai transition: broken hills and passes around Nanyang, Xiangyang approaches, Hefei/Shouchun corridor.
- Wushan / Three Gorges / Yiling corridor: mountain-river choke between Bashu and Jingzhou.
- Jiangnan / Wuling / Nanling / southern frontier: southern hills and forested belts should not become empty flat land.
- Fujian-Zhejiang coastal hills: southeast coast should retain hill/forest texture instead of smooth shoreline plain.

### Plains And Basins

Flat land should be regional, not universal:

- North China plain: large but bounded by Taihang/northern hills, Yellow River, and eastern/coastal systems.
- Guanzhong plain: visible basin around Chang'an, bounded by western/northern mountains and Qinling.
- Henan/Luoyang-Xuchang corridor: central plain and river corridor, but with surrounding hills.
- Chengdu plain: distinct basin, not merged into a broad western flatland.
- Hanzhong basin: narrow corridor/basin between Qinling and Bashu mountains.
- Jianghan plain: around Jingzhou/Wuchang, tied to Yangtze/Han River.
- Huai-Si corridor: flatter but structured by Huai River and low hills.
- Jiangdong/lower Yangtze water network: plains, lakes, marshes, and waterways, not one blank coastal flat.

### River / Water Hierarchy

The concept must keep a readable hierarchy:

- Yellow River: north system with a visible Guanzhong/Hedong/Henan/North China plain role.
- Wei River: supports Tianshui-Chang'an-Luoyang direction.
- Han River: Hanzhong-Xiangyang-Wuchang direction.
- Yangtze: Yiling-Jingzhou-Wuchang-Chaisang-Jianye-Jingkou direction.
- Huai River: Shouchun/Hefei/Xuzhou/Guangling corridor.
- Gan/Poyang and lower Jiangnan water: Jiangdong/Chaisang/Yuzhang/Jianye support.
- Pearl / Lingnan water: southern frontier texture.

Water should use thin hierarchical brush lines. Major rivers can be clearer, but should not become oversized decorative bands.

### City / Road Relationship

Cities must appear in plausible terrain contexts:

- Chang'an, Hedong, Tianshui, Hanzhong need a visible pass/basin relationship.
- Luoyang, Xuchang, Guandu, Chenliu, Ye sit in the central/north plains with surrounding hills and Yellow River logic.
- Xiangyang, Shangyong, Yiling, Yong'an need visible mountain/pass/corridor logic.
- Chengdu, Zitong, Bazhong, Luocheng need a basin-and-mountain relationship.
- Jianye, Jingkou, Huiji, Suzhou, Chaisang, Yuzhang need water network / lower Yangtze logic.
- Hefei, Shouchun, Guangling, Xuzhou need the Huai-Si corridor to read clearly.

Roads should be hairline corridors that follow passes, river valleys, or plain corridors. They should not look like modern roads or heavy UI paths.

## Candidate Audit

### national_concept_v1

- Status: style reference, not geography pass.
- Strength: best organic ink/watercolor feeling so far.
- Weakness: geography is too freeform; national outline, river hierarchy, and city placement need tighter control.

### national_concept_v2

- Status: `REWORK`.
- Strength: clearer national composition than v1.
- Weakness: scale grammar is wrong. Cities and terrain features are too large for national scope.

### national_concept_v3

- Status: `REWORK`.
- Strength: scale is much better; cities and terrain marks read as national-map detail.
- Weakness: terrain audit fails in the middle. Mountain belts and regional terrain structure are too weak, making the map read as one large central plain.

### national_concept_v4

- Status: `PASS` author pre-review; pending producer decision.
- Strength: combines v1-like organic style, v3-like national-scale city/detail sizing, and a stronger terrain skeleton. Western highlands, Qinling-like barrier, northern belt, central hill transitions, southern hill/forest belts, bounded plains, and river hierarchy are all more visible than v3.
- Weakness: still a Stage 1 concept, not a data-authoritative geography map. Exact city/river/terrain alignment remains future work.

## Required Direction For v4

v4 target direction:

- v1's calmer organic style.
- v3's corrected national-scale city and terrain size.
- Stronger visible terrain skeleton: Qinling, Taihang/northern belt, Funiu-Dabie, Wushan/Three Gorges, Jiangnan/Wuling/Nanling, western highlands, and southeast coastal hills.
- Clearer river hierarchy without oversized water bands.
- Plains that are bounded basins/corridors, not one continuous middle flatland.

Author pre-review result: `national_concept_v4` meets this target well enough for producer review.
