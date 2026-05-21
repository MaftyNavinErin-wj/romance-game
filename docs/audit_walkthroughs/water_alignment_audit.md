# Water / Bitmap Alignment Audit

Scope: visible rivers and water bodies on `assets/maps/china-ink-base-v1-hd.png` compared with the game-rule hex layer built from `RIVERS` and `TERRAIN_POLYS`.

## Verdict
- City centers in blocked water: PASS (`0`)
- Roads crossing hard water/lake/sea: PASS (`0`)
- Major visible bitmap waterways with hex-rule coverage: PASS after this audit batch
- Fine decorative water texture: accepted as bitmap-only unless it is a readable trunk river or gameplay-relevant lake/sea edge

## Rule
The player-facing contract is:

- If the bitmap shows a major readable river or lake/sea body, the hex map should expose `river` / `water` / `coastal_water` / `deep_water`.
- If the bitmap only has tiny wash texture or decorative drainage marks, it can stay visual-only.
- River overlay strokes should not be drawn as a separate dashed visual layer; the bitmap plus hex water glyphs carry the visual signal.

## Coverage
| bitmap feature | hex layer status | action |
|---|---|---|
| Yellow River / Huang He | covered by `RIVERS` | replaced old too-northern path with a lower Guanzhong -> North China -> Bohai path |
| Wei River | covered by `RIVERS` | adjusted to Tianshui -> Changan -> Huang He corridor |
| Han River | covered by `RIVERS` | retained |
| Yangtze / Chang Jiang | covered by `RIVERS` | retained |
| Xiang River / Dongting connection | covered by `RIVERS` | fixed: old line was accidentally swallowed by a comment, so it was not active |
| Huai River | covered by `RIVERS` | retained |
| Jialing / Sichuan basin waterway | covered by `RIVERS` | retained |
| Gan River / Poyang basin | covered by `RIVERS` | added |
| Qiantang / lower Jiangnan waterway | covered by `RIVERS` | added |
| Pearl / Xi River trunk | covered by `RIVERS` | added |
| Southwest visible waterway, southern Yunnan | covered by `RIVERS` | added |
| Coast / offshore sea | covered by `TERRAIN_POLYS` water polygons | retained |
| Large lake/near-water bodies in middle/lower Yangtze area | covered by `TERRAIN_POLYS` and nearby `RIVERS` | retained |

## Validation
- `node --check src/data/cities.js`: PASS
- `node tools/audit_city_terrain_roads.js`: PASS
- `node tools/audit_map_consistency.js`: PASS
- `node tools/audit_bitmap_alignment.js`: regenerated bitmap prompt sheets
- `node tools/build_map_alignment_audit.js`: regenerated visual overlay audit

## Notes
- `Roads Touching River/Water Hexes` increased after this pass. That is expected and desirable: those roads now acknowledge visible bitmap rivers rather than silently treating the same ground as plain.
- Hard water remains separate: roads still do not cross `water`, `coastal_water`, or `deep_water` illegally.
- The dashed river overlay was removed from the render layer. Rivers remain in rules/tooltip/movement and as subtle per-hex water glyphs, while the bitmap provides the continuous visual river line.
