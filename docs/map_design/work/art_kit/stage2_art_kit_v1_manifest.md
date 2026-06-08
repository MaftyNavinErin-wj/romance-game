# Stage 2 Art Kit v1 Manifest

## Identity

- Candidate id: `stage2_art_kit_v1`
- Stage: Stage 2 art kit / representative reference
- Verdict: `REFERENCE_ONLY`
- Date: 2026-06-08
- Author/session: Codex recovery pass after CLI stream interruption

## Scope

- Runtime impact: none
- These images are not runtime assets.
- These images do not enter `assets/maps/`.
- This recovery does not modify `src/`.
- These images are not final base-map art.
- These images are not city, hex, road, or river data authority.
- Later stages may use them only as style, texture, city/fort, and terrain-element reference material.

## Files

- Repo output directory: `docs/map_design/work/art_kit/`
- Review overlay path: none
- Seam preview path(s): none
- Generated source path(s): `C:\Users\jie.wang\.codex\generated_images\019ea517-5195-7910-b06b-96aa156a16a3\`
- Reference image path(s): Stage 1 `national_concept_v5` remains the approved national-level visual direction / rough terrain skeleton / style reference, but not a runtime asset or precise data source.

| Repo file | Source file | Actual size | Class | Notes |
|---|---|---:|---|---|
| `stage2_art_kit_v1_01_capital_reference.png` | `ig_0da67748ac412fbd016a262f225c1c819ba3665ba42f1d0a29.png` | 1536 x 1024 | reference-only | Large city/capital reference. Walled-city detail is allowed here as reference, but future real capital placement/count must be data-controlled. |
| `stage2_art_kit_v1_02_city_reference.png` | `ig_0da67748ac412fbd016a262fd88b54819ba7a46ba80f223187.png` | 1536 x 1024 | reference-only | Medium city reference. Future city placement/count must be data-controlled. |
| `stage2_art_kit_v1_03_fort_reference.png` | `ig_0da67748ac412fbd016a263091750c819bb1b2f3394fcf96c1.png` | 1536 x 1024 | reference-only | Initial fort attempt, but producer review says it does not work as a fort reference: style mismatches 01/02, feels rough, reads like a small courtyard, and lacks defensive fort presence. |
| `stage2_art_kit_v1_04_pass_fort_reference.png` | `ig_0da67748ac412fbd016a26318ec5cc819bb91219c6e324a62e.png` | 1536 x 1024 | reference-only | Producer review corrected the category: this reads as a strategic pass / dangerous-terrain checkpoint, not farmland. Future pass/fort placement must be data-controlled. |
| `stage2_art_kit_v1_05_farmland_reference.png` | `ig_0da67748ac412fbd016a2635a8a264819b807d83432b2c3c4d.png` | 1672 x 941 | reference-only | Producer review corrected the category: this reads more like fields/farmland than riverbank. Must not propagate pseudo-city, wall, fort, temple, or random settlement-icon marks into production terrain. |
| `stage2_art_kit_v1_06_riverbank_reference.png` | `ig_0da67748ac412fbd016a26365b32f0819ba70145a7006c9dbb.png` | 1672 x 941 | reference-only | Producer review corrected the category: this reads like a typical small-river riverbank. Must not propagate pseudo-city or random settlement-icon marks into production terrain. |
| `stage2_art_kit_v1_07_mountain_reference.png` | `ig_0da67748ac412fbd016a2636e0a8e0819bb381b31ddfee81bd.png` | 1672 x 941 | reference-only | Mountain/pass-terrain reference only. Must not propagate pseudo-city, wall, fort, temple, or random settlement-icon marks into production terrain. |
| `stage2_art_kit_v1_08_road_pass_reference.png` | `ig_0da67748ac412fbd016a263773e400819bbee29f5ccde21484.png` | 1672 x 941 | reference-only | Road/pass corridor reference only. Any future readable pass fort/node must be data-controlled, not random background decoration. |

Initial file classification was conservative and followed generation order because exact prompt metadata was not recovered in this session. Producer review later corrected files 04, 05, and 06 by visible content.

## Generation

- Tool/path: previously generated imagegen outputs recovered from local generated image cache.
- Prompt: not recovered in this session.
- Negative constraints: not recovered in this session.
- Intended size: not recovered in this session.
- Actual size: listed above.
- Reference roles: style and detail references only.
- New image generation in this recovery pass: none.

## Post-Processing

- Resize/crop: none.
- Color/paper adjustment: none.
- Compositing steps: none.
- Scripts or commands: copied existing PNGs into the repo art kit workspace with stable names.

## Geography/Data Review

- City anchor overlay: none.
- River/road overlay: none.
- Tile/crop boundary: none.
- Coordinate drift notes: not applicable; this is not geography-authoritative material.
- Movement budget exceeded: no data movement proposed.

## Art Review

- City/fort clarity: 01 and 02 look good as capital/city references. 03 should not guide fort production because it feels too rough, small, courtyard-like, and weak as a defensive node. 04 is a better strategic pass/fort-terrain reference than its initial farmland label.
- Field/farmland detail: 05 reads more like farmland/fields than riverbank. Do not inherit pseudo-city marks from farmland texture.
- Forest/foothill detail: 07 and 08 both have useful mountain/route structure, but the hillside forest density is too high and should be reduced in future production.
- Riverbank/water detail: 06 reads like a typical small-river riverbank.
- Mountain/pass readability: 07 mountain terrain is acceptable, with the forest-density caution above. 08 route/pass logic is acceptable, with the same forest-density caution.
- Style consistency: 03 mismatches 01/02 and is not a good fort-style reference.
- Patch/seam risk: not reviewed; these are not composited or runtime assets.

## Producer Image Review

2026-06-08 review notes:

| File | Producer status | Producer note | Follow-up use |
|---|---|---|---|
| `stage2_art_kit_v1_01_capital_reference.png` | `KEEP_REFERENCE` | Looks good. | Keep as large capital / major city style reference. |
| `stage2_art_kit_v1_02_city_reference.png` | `KEEP_REFERENCE` | Looks good. | Keep as normal city style reference. |
| `stage2_art_kit_v1_03_fort_reference.png` | `REJECT_AS_FORT_REFERENCE` | Style does not match 01/02, feels too rough, reads like a small courtyard, and does not show enough defensive fort presence. | Do not use as fort production reference. |
| `stage2_art_kit_v1_04_pass_fort_reference.png` | `REFERENCE_WITH_RISK` | Not farmland; reads as a pass / checkpoint in dangerous terrain. | Use only as a pass/fort-terrain reference; future fort position/count must be data-controlled. |
| `stage2_art_kit_v1_05_farmland_reference.png` | `KEEP_REFERENCE` | Feels more like fields than riverbank. | Keep as farmland/field reference, with pseudo-city screening. |
| `stage2_art_kit_v1_06_riverbank_reference.png` | `KEEP_REFERENCE` | Reads like a typical small-river riverbank. | Keep as small-river riverbank reference, with pseudo-city screening. |
| `stage2_art_kit_v1_07_mountain_reference.png` | `REFERENCE_WITH_RISK` | Mountain terrain is OK, but trees are too dense. | Keep mountain structure reference; reduce forest density in future prompts/production. |
| `stage2_art_kit_v1_08_road_pass_reference.png` | `REFERENCE_WITH_RISK` | Route is OK, but mountain forest is too dense. | Keep route/pass logic reference; reduce forest density in future prompts/production. |

## Pseudo-City Risk Control

- Farmland, riverbank, forest, mountain, and road/pass materials must not contain readable cities, city walls, small forts, temples, or random settlement icons when used as production terrain.
- True city and fort assets may contain walls, gates, and settlement structure, but their number, identity, and placement must be controlled by the data layer.
- Any pseudo-city-like background mark found during later review must be rejected or removed before production use.
- This manifest does not mark any terrain/background image as `PASS`.

## Runtime Impact

- Runtime impact: none.
- If promoted, target runtime asset path: not applicable.
- Rollback asset path: not applicable.

## Producer Decision

- Decision: producer image review recorded; all images remain `REFERENCE_ONLY`.
- Required changes: if Stage 2 continues with a v2 generation pass, replace or improve the fort reference, keep 01/02 as city style references, use 04 as pass/fort-terrain reference, use 05 as farmland reference, use 06 as riverbank reference, and reduce forest density for mountain/road-pass references.
- Reject/rework reason: 03 rejected as fort reference; 07/08 carry forest-density risk; all images remain non-runtime references.
