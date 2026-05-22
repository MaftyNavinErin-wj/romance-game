# Fog Visibility Audit

Scope: fog rendering policy, city visibility policy, terrain tooltip policy, and impassable terrain distribution.

## Policy Checks
- PASS: fog clear helper exists
- PASS: impassable is not fog-clear by default
- PASS: unexplored cities are skipped in map city layer
- PASS: fog reveal animation uses shared fog-clear terrain rule
- PASS: unexplored city hex clicks do not select hidden cities
- PASS: unexplored terrain tooltip is hidden
- PASS: city visible no longer uses full territory flood-fill
- PASS: road-adjacent explored city area is radius-limited
- PASS: known control areas remain explored when not visible
- PASS: overlay base masks unexplored instead of overriding fog
- PASS: live resource overlays require visible authorized city data
- PASS: supply overlay only paints visible hexes

## Terrain Hex Counts
- forest: 208
- hill: 275
- impassable: 1783
- mountain: 577
- plain: 2728
- water: 1365

## Impassable Distribution
- top: 388
- bottom: 286
- left: 319
- right: 0
- interior: 790

## Impassable Samples
- q0,r0
- q0,r1
- q0,r2
- q0,r3
- q0,r4
- q0,r5
- q0,r6
- q0,r7
- q0,r8
- q0,r9
- q0,r10
- q0,r11
- q0,r12
- q0,r13
- q0,r14
- q0,r15
- q0,r16
- q0,r17
- q0,r18
- q0,r19
- q0,r20
- q0,r21
- q0,r22
- q0,r23
- q0,r24
- q0,r25
- q0,r26
- q0,r27
- q0,r28
- q0,r29

## Current Interpretation
- Unexplored land blockers are now covered by fog instead of being visually treated as always known.
- Unexplored city icons/names are now suppressed on the map layer.
- Sea and ink-mode open water remain fog-clear to preserve the parchment/ink base-map treatment.
- City visible range is radius-based; overlay territory flood-fill is no longer used as a visibility source.
- Known control areas remain explored even when they are outside current visible radius.
- Resource overlays are now gated by fog visibility and faction-data permission.
