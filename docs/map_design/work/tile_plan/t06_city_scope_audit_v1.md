# T06_CC_W City Scope Audit v1

## Identity

- Tile id: `T06_CC_W`
- Stage: Stage 6 scope audit
- Date: 2026-06-09
- Status: active correction note
- Runtime impact: none

## Question

Does the full `T06_CC_W` production tile scope contain only two cities?

## Answer

No. The two-city rule belonged to the Stage 4 Guanzhong-Henan representative reference crop, not the full Stage 6 `T06_CC_W` production tile.

`T06_CC_W` is a wider production tile with concept crop `334,251,586,439`. It is intended as the central-west production anchor and includes overlap/context toward Guanzhong, Henan, Hanzhong/Bashu approach, and Jingzhou/Yangtze transition. It should not be prompted or reviewed as a two-city-only representative slice.

## Evidence

Stage 5 plan:

- `T06_CC_W` role: Guanzhong-Henan / Luoyang-Changan production anchor.
- Direct neighbors: `T02_NC_W`, `T07_CC_E`, `T10_SC_W`, `T05_WC`.
- Diagonal context: `T01_NW`, `T03_NC_E`, `T09_SW`, `T11_SC_E`.

Current approximate data-anchor check:

- Source data: `src/data/city_base.js`.
- Hex-to-SVG transform: current `hexToPixel()` from `src/core/map.js`.
- Concept-space approximation: linear scale from current 960 x 740 SVG viewBox to `national_concept_v5.png` 1672 x 941.
- This approximation is not final data alignment, but it is sufficient to catch the scope mistake.

Approximate `CITY_BASE` anchors falling inside the `T06_CC_W` concept crop:

| id | name | q,r | approximate concept x,y |
|---|---|---:|---:|
| `changan` | 长安 | `31,22` | `510,309` |
| `luoyang` | 洛阳 | `40,20` | `651,276` |
| `chenliu` | 陈留 | `54,20` | `871,276` |
| `guandu` | 官渡 | `52,22` | `840,302` |
| `xuchang` | 许昌 | `54,24` | `871,329` |
| `nanyang` | 南阳 | `44,31` | `714,421` |
| `xinye` | 新野 | `44,28` | `714,382` |
| `hanzhong` | 汉中 | `26,31` | `432,421` |
| `shangyong` | 上庸 | `34,34` | `557,461` |
| `xiangyang` | 襄阳 | `45,33` | `730,454` |
| `yiling` | 夷陵 | `38,38` | `620,514` |
| `jingzhou` | 江陵 | `47,40` | `761,547` |
| `wuchang` | 武昌 | `53,40` | `855,547` |
| `chengdu` | 成都 | `20,40` | `338,540` |
| `yizhou_n` | 梓潼 | `24,35` | `401,474` |
| `bazhong` | 巴中 | `27,37` | `448,507` |
| `yongan` | 永安 | `29,45` | `479,613` |
| `luocheng` | 雒城 | `21,38` | `354,521` |
| `wuling` | 武陵 | `44,47` | `714,633` |
| `changsha` | 长沙 | `56,49` | `902,659` |
| `anding` | 安定 | `23,20` | `385,283` |

Near-boundary anchors within an 80 px concept-space margin include `hedong`, `ye`, `tianshui`, `chaigang`, `puyang`, `xiaopei`, and others.

## Production Implication

`T06_CC_W` should not draw every listed city as a large equal-weight walled city. It should use a controlled hierarchy:

- Primary large footprints: likely Chang'an and Luoyang/Henan anchor.
- Secondary city marks: selected corridor anchors such as Chenliu/Guandu/Xuchang/Nanyang/Hanzhong/Xiangyang depending on final overlay review.
- Overlap-edge city zones: may be subdued, clipped, or deferred to adjacent tile review, but must not be ignored during seam/geography review.

## Correction

- `tile_t06_cc_w_v2` should not be treated as a full `T06_CC_W` production PASS candidate because it was generated from a two-city prompt.
- The next T06 attempt needs a corrected brief/prompt with city hierarchy, not "two cities only".
- Representative tile constraints remain valid for perspective/style, but not for production tile city count.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
