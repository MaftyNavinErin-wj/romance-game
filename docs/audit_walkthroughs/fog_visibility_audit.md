# Fog Visibility Audit

Scope: fog rendering policy, city visibility policy, terrain tooltip policy, and impassable terrain distribution.

## Policy Checks
- PASS: fog clear helper exists
- PASS: impassable is not fog-clear by default
- PASS: unexplored city geography is still rendered on map
- PASS: unexplored city style is neutral and does not reveal ownership
- PASS: explored city ownership falls back to opening owner
- PASS: explored fog writes synchronize city-center intel
- PASS: city intel is separate from control-area memory
- PASS: fog reveal animation uses shared fog-clear terrain rule
- PASS: unexplored city hex clicks can select known geography
- PASS: unexplored terrain tooltip is hidden
- PASS: city visible no longer uses full territory flood-fill
- PASS: road-adjacent explored city area is radius-limited
- PASS: known control areas remain explored when not visible
- PASS: fog does not reuse overlay territory flood-fill
- PASS: road-adjacent explored cities use bounded fog helper
- PASS: city ownership changes invalidate territory cache
- PASS: overlay base masks unexplored instead of overriding fog
- PASS: live resource overlays require visible authorized city data
- PASS: live resource overlays require visible hexes
- PASS: supply overlay only paints visible hexes
- PASS: scout reveal is city-radius limited and not territory flood-fill
- PASS: scout reveal invalidates fog cache

## Terrain Hex Counts
- forest: 204
- hill: 276
- impassable: 1932
- mountain: 584
- plain: 2832
- water: 1108

## Impassable Distribution
- top: 388
- bottom: 404
- left: 319
- right: 0
- interior: 821

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
- City geography is static knowledge: unexplored city icons/names stay visible in a neutral style.
- Sea and ink-mode open water remain fog-clear to preserve the parchment/ink base-map treatment.
- City visible range is radius-based; overlay territory flood-fill is no longer used as a visibility source.
- Known control areas remain explored even when they are outside current visible radius.
- Own, allied, and previously known city control-radius areas remain explored even when they are outside current visible radius.
- Resource overlays are now gated by fog visibility and faction-data permission.
- Scout reveal now uses city-radius visibility plus control-radius explored memory instead of overlay territory flood-fill.
