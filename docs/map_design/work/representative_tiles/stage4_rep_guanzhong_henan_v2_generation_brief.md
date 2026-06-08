# Stage 4 Representative Tile Brief: Guanzhong-Henan v2

## Identity

- Planned candidate id: `rep_guanzhong_henan_v2`
- Stage: Stage 4, representative tile
- Status: generation brief; image generation attempted but no candidate produced yet
- Date: 2026-06-08
- Runtime impact: none

## Purpose

Regenerate `rep_guanzhong_henan_v1` after producer review.

v1 succeeded at suppressing random road/river mini-settlements, but its pass fort was not clearly anchored to a historically correct named pass. v2 must correct pass placement discipline.

## Producer Rule

- The tile should have only the two current game cities unless a pass/fort is historically grounded.
- Pass landmarks are allowed only when they are plausible named historical passes in correct locations.
- If a pass cannot be placed correctly, remove it rather than using it as decorative terrain.

## v2 Target

Use the historically grounded pass option:

- City 1: Chang'an, west / Guanzhong side.
- City 2: Luoyang, east / Henan side.
- Optional pass: Hangu Pass, west of Luoyang on the Chang'an-Luoyang road corridor at a mountain/river chokepoint.

No other architecture should appear.

## Prompt Constraints

- Exactly two readable walled city footprints: Chang'an and Luoyang.
- Exactly one much smaller Hangu Pass checkpoint, only if it can be placed west of Luoyang on the corridor.
- Hangu Pass must be smaller than both cities and visually tied to the mountain/river road chokepoint.
- No random mini-cities.
- No villages.
- No temples.
- No courtyard compounds.
- No roadside buildings.
- No riverbank hamlets.
- No extra forts.
- No repeated settlement icons.
- Roads must be natural hairline geography, not UI lines.
- Rivers should be thinner and less dominant than v1.

## Generation Attempts

- 2026-06-08: built-in imagegen attempt 1 failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen attempt 2 with shorter prompt failed with `ServerError`; no image produced.
- 2026-06-08: built-in imagegen attempt 3 with simplified prompt failed with `ServerError`; no image produced.

## Next Action

- Retry built-in imagegen later using this brief, or use an explicitly approved fallback generation path.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified by this brief.
