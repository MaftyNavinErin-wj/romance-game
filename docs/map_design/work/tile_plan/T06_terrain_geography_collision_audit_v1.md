# T06 Terrain / Geography / Collision Audit v1

## Identity

- Tile id: `T06_CC_W`
- Stage: Stage 6 control-overlay review support
- Date: 2026-06-09
- Status: `PENDING_PRODUCER_REVIEW`
- Runtime impact: none

## Purpose

This audit answers two producer review concerns before any new T06 terrain-base generation:

- city footprint circles in `T06_control_overlay_v1.html` may understate final city-stamp collision risk;
- roads and especially rivers must be checked against actual regional geography, not only against runtime `ROADS` / `RIVERS`.

This is a docs-only control note. It does not approve a terrain image and does not modify runtime data.

## Inputs

- `docs/map_design/work/tile_plan/control_master_v1.html`
- `docs/map_design/work/tile_plan/T06_control_overlay_v1.html`
- `docs/map_design/work/tile_plan/t06_city_scope_audit_v1.md`
- `docs/map_design/work/tile_plan/stage6_production_pipeline_v1.md`
- `docs/map_design/work/tile_plan/stage6_tile_quality_gate_v1.md`
- `src/data/city_base.js`
- `src/data/cities.js`

External geography references checked:

- Qinling as the major north/south China divide: https://www.britannica.com/place/Qin-Mountains
- Yellow River and Wei River relationship: https://www.britannica.com/place/Yellow-River
- Wei River course and Guanzhong relationship: https://www.britannica.com/place/Wei-River
- Han River course and Qinling/Daba relationship: https://www.britannica.com/place/Han-River
- Luo/Yi/Yiluo river relationship around Luoyang: https://en.wikipedia.org/wiki/Luo_River_(Henan)
- Funiu as an eastward Qinling-related mountain system in Henan: https://en.wikipedia.org/wiki/Funiu_Mountains

## City Footprint Collision Audit

Current overlay scale:

- primary city circle radius: 28 concept px / 112 output px;
- standard city circle radius: 16 concept px / 64 output px;
- edge/context city circle radius: 14 concept px / 56 output px.

These are control footprints, not final city-stamp extents. A final city stamp needs walls, gates, shadow, road tie-in, and local paper/ink blending, so this audit also uses a conservative estimated final-stamp radius:

- primary: 38 concept px;
- standard: 24 concept px;
- edge/context: 18 concept px.

Closest high-risk pairs inside the T06 crop:

| Pair | Current roles | Distance | Control gap | Estimated final-stamp gap | Risk |
|---|---|---:|---:|---:|---|
| 成都 / 雒城 | edge / edge | 25.3 | -2.7 | -10.7 | `REWORK`: should not both be strong T06 stamps. |
| 南阳 / 襄阳 | standard / standard | 36.6 | 4.6 | -11.4 | `REWORK`: both cannot use full standard stamps without spacing/priority change. |
| 南阳 / 新野 | standard / standard | 39.6 | 7.6 | -8.4 | `REWORK`: 新野 should be subdued, smaller, or delegated. |
| 许昌 / 官渡 | standard / standard | 41.0 | 9.0 | -7.0 | `REWORK`: overlap cluster should move to T07/global ownership. |
| 官渡 / 陈留 | standard / standard | 41.0 | 9.0 | -7.0 | `REWORK`: overlap cluster should move to T07/global ownership. |
| 许昌 / 陈留 | standard / standard | 52.9 | 20.9 | 4.9 | tight but manageable only if one or more are subdued. |
| 梓潼 / 巴中 | edge / edge | 57.5 | 29.5 | 21.5 | acceptable as context-only. |
| 汉中 / 梓潼 | standard / edge | 61.5 | 31.5 | 19.5 | acceptable if 梓潼 remains context-only. |
| 襄阳 / 新野 | standard / standard | 74.4 | 42.4 | 26.4 | acceptable if 新野 is subdued. |
| 夷陵 / 上庸 | standard / standard | 82.0 | 50.0 | 34.0 | acceptable. |

### City Weight Recommendation

Do not treat all 21 in-crop anchors as equal final stamps.

| City group | Recommendation | Reason |
|---|---|---|
| 长安 / 洛阳 | Keep as primary scale references, but mark as overlap/global-owned primary. | Both are important, but both sit in the T06 top overlap band. |
| 南阳 / 襄阳 | Keep as the main T06 center standard pair, but do not let both expand beyond standard footprint. | They anchor the center corridor and are close. |
| 新野 | Downgrade to subdued/small context mark or delegate to a later global city layer. | It collides with 南阳 and crowds 襄阳. |
| 上庸 / 夷陵 | Keep as standard corridor anchors. | They are central enough and spacing is acceptable. |
| 汉中 | Keep as west-corridor anchor, but not a full T06-owned stamp. | It is in the overlap band toward T05/T02/T10 context. |
| 陈留 / 官渡 / 许昌 | Downgrade to T06 east-overlap context or hand visual ownership to `T07_CC_E`. | The three-city cluster collides under final stamp assumptions. |
| 成都 / 雒城 / 梓潼 / 巴中 / 永安 | Context only; hand strong visual ownership to west/southwest tiles or global layer. | 成都/雒城 already collide in T06 crop and are not the T06 production focus. |
| 江陵 / 武昌 / 长沙 / 武陵 | Context/edge only; likely T10/T11/T07 ownership. | They sit in southern/eastern overlap bands. |
| 安定 | Context only; likely T02/T05/T01 edge ownership. | Top-left overlap anchor, not T06 center. |

## Terrain And River Geography Audit

### Required T06 Geography Read

T06 should read as a central-west strategic hinge, not as a single local basin:

- north/top: Yellow River / Guanzhong-Henan northern water control;
- west/top-left: Wei River / Guanzhong approach;
- center: Luoyang-Nanyang-Xiangyang / Funiu edge corridor;
- south/center-left: Qinling south / Han River approach toward Hanzhong-Shangyong;
- south/east: Jingzhou-Yangtze transition should be present only as edge/context, not dominant.

### River Controls

| River/system | Actual geography control | T06 production implication |
|---|---|---|
| Yellow River | The Yellow River receives the Wei near the Guanzhong/Tongguan region, then turns east across northern Henan control space. | It should be an upper/northern control river, not a broad Jiangdong-style water network. |
| Wei River | Wei River is the Guanzhong plain river feeding east into the Yellow River. | It can support the Chang'an-to-Luoyang corridor, but should not become a second large parallel river dominating the whole tile. |
| Luo / Yi / Yiluo | Luoyang sits in the Luo/Yi-Yiluo relationship; water should read broadly west-east / east-northeast toward the Yellow River system. | Avoid a dominant north-south river hugging Luoyang. Small local tributaries are fine if subordinate. |
| Han River | Han River runs east from the Hanzhong area along the south side of Qinling and north of Daba-related mountains. | Hanzhong-Shangyong corridor should read as a south-of-Qinling valley/corridor, not as a northern Yellow River branch. |
| Yangtze / Jianghan edge | Jingzhou/Wuchang/Yiling belong to the Yangtze/Jianghan transition. | In T06, this should remain bottom/southeast edge context. It must not pull the whole tile into Jiangdong water-network grammar. |

### Mountain / Zone Controls

| Zone | Control rule | T06 production implication |
|---|---|---|
| Qinling | East-west north/south divide, separating Wei/Yellow River north from Han River south. | The southern/central mountain edge should be structurally important. Do not flatten the whole tile into open plain. |
| Funiu | Henan mountain system tied to the eastern Qinling/Funiu edge. | Use as the Luoyang-Nanyang terrain barrier/edge, not as a full Bashu mountain-basin wall. |
| Daba / Bashu approach | South of Han River corridor; relevant to Hanzhong/Bazhong/Yong'an context. | Keep as southwest/south context, mostly delegated to T05/T09/T10. |
| North China Plain / Henan open plain | Open plain east/northeast of Luoyang-Nanyang control. | Useful for Luoyang/Chenliu/Xuchang edge context, but T06 should not make this the entire tile. |

## Road / Corridor Audit

`T06_control_overlay_v1.html` currently clips many `ROADS` links into the T06 margin. This is correct as a source-data visibility check, but it is too dense for final visible road art.

Recommended road hierarchy before terrain generation:

| Corridor | Status | Production rule |
|---|---|---|
| 长安 - 洛阳 | `KEEP_PRIMARY` | Main Guanzhong-Henan route; should remain readable. |
| 长安 - 汉中 | `KEEP_PRIMARY_OR_SECONDARY` | Needs Qinling/pass-corridor logic; should not be a straight decorative line. |
| 洛阳 - 南阳 | `KEEP_PRIMARY_OR_SECONDARY` | Funiu/Henan south corridor; must respect mountain edge. |
| 南阳 - 襄阳 | `KEEP_PRIMARY_OR_SECONDARY` | Jingxiang transition corridor; likely central/south continuation. |
| 汉中 - 上庸 - 襄阳 | `KEEP_SECONDARY` | Important corridor, but should read as difficult mountain/valley route. |
| 上庸 - 夷陵 / 巴中 - 夷陵 | `CONTEXT_OR_PENDING` | Needs terrain review; do not overdraw before producer approval. |
| 陈留 / 官渡 / 许昌 cluster links | `DELEGATE_T07_OR_CONTEXT` | East-overlap network is dense and belongs more naturally to T07/global road layer. |
| 成都 / 雒城 / 梓潼 / 巴中 local links | `DELEGATE_WEST/SW` | Keep only as terrain/context hints in T06. |
| 江陵 / 武昌 / 长沙 / 武陵 links | `DELEGATE_SOUTH/EAST` | Bottom/east context only; avoid turning T06 into Yangtze water-network tile. |

Hard rule: final visible roads should be derived from this hierarchy and later producer-approved route notes, not directly from all clipped `ROADS` edges.

## Required Changes Before No-City Terrain Prompt

`T06_control_overlay_v1` is usable as a control overlay, but the next terrain brief should carry these corrections:

1. Treat current circles as control footprints, not final stamp areas.
2. Add city ownership/weight notes:
   - primary overlap/global: 长安, 洛阳;
   - T06 center standard: 南阳, 襄阳, 上庸, 夷陵;
   - subdued or delegated: 新野, 汉中;
   - T07/context: 陈留, 官渡, 许昌;
   - west/south/east context only: 成都 group, 江陵/武昌/长沙/武陵 group, 安定.
3. Split river controls into:
   - northern Yellow River / Wei River system;
   - local Luo/Yi/Yiluo around Luoyang;
   - southern Han River valley;
   - bottom Yangtze/Jianghan edge context.
4. Split mountain controls into Qinling, Funiu, and Daba/Bashu context rather than one broad southern zone.
5. Use a road hierarchy, not all clipped `ROADS`.

## Producer Review Questions

Before no-city T06 terrain generation, producer should decide:

1. Should 长安 and 洛阳 be T06-owned primary stamps, or global city-layer primary stamps that happen to appear in T06 overlap?
2. Should 新野 be visible as a small/subdued city mark, or omitted/delegated to avoid crowding 南阳/襄阳?
3. Should the 陈留/官渡/许昌 cluster be controlled by `T07_CC_E` rather than T06?
4. Should 汉中 be a full visible stamp in T06, or only a west-corridor context anchor?
5. Are the proposed primary corridors sufficient for the no-city terrain base, with full road art deferred until city/road layer composition?

## Verdict

`T06_control_overlay_v1` remains useful and directionally correct, but it should not be treated as final scale approval.

Recommended status:

- `control_master_v1`: keep as national control source, pending producer review.
- `T06_control_overlay_v1`: keep as T06 source overlay, but mark city ownership / collision / geography corrections before terrain prompting.
- Next step: update the T06 terrain-generation brief to request a no-city terrain base that follows this audit, not a city-bearing production tile.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
