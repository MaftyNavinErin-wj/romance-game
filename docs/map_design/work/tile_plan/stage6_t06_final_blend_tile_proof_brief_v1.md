# Stage 6 T06 Final Blend / Tile Proof Brief v1

## Identity

- Planned candidate family: `terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_*`
- Tile id: `T06_CC_W`
- Stage: Stage 6 controlled production pipeline
- Status: `READY_FOR_FINAL_BLEND_PROOF`
- Date: 2026-06-15
- Runtime impact: none

## Purpose

Define the next controlled step after producer acceptance of `terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3`.

The city-stamp size and placement pass is closed. `v3` is now the controlled city-stamp composite reference. The next proof should test whether the tile can read as one coherent painted terrain-city image.

This brief is for final blend / tile proof work only. It does not authorize new city count, city coordinates, stamp scale, runtime promotion, or road-graph decisions.

## Locked Reference

Use `v3` as the locked reference:

- Composite reference: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3.png`
- Review preview: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_preview.png`
- Placement JSON: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_placements.json`
- Manifest: `docs/map_design/work/stitch/terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_manifest.md`

The final blend proof may use the v3 composite as direct input or recreate it from the same source stack, but the visible city plan must remain equivalent to v3.

## Locked Items

Do not change:

- city count;
- city selection;
- city ownership/context class;
- city anchor positions;
- art-layer nudges;
- stamp-local fit offsets;
- city stamp scale;
- 洛阳 off-water correction;
- 官渡 off-water correction and source-approach softening;
- runtime data;
- `src/`;
- `assets/maps/`.

Specifically, do not reopen primary/standard/subdued/context stamp-size tuning. Scale is accepted for this stage.

## Allowed Work

Allowed for the final blend proof:

- whole-tile paper tone unification;
- terrain-city edge blending;
- non-rectangular mask-edge cleanup;
- local wall/shadow grounding;
- local color-temperature and ink-density matching;
- paper grain / wash consistency pass;
- reduction of obvious pasted-object boundaries;
- soft cleanup of source-local gate/ramp marks where they imply unapproved roads;
- limited local contact shadows that make cities sit on terrain;
- proof-only export and manifest documentation.

The blend pass should make the city layer feel integrated with the terrain. It should not solve placement by moving or resizing cities.

## Forbidden Work

Not allowed:

- changing city coordinates or placement JSON semantics;
- changing city stamp dimensions;
- adding or removing cities;
- converting context cities into stronger T06-owned stamps;
- introducing new villages, forts, labels, banners, faction colors, units, or UI marks;
- drawing final primary roads;
- using city gate marks as road-graph approval;
- promoting a proof into runtime assets;
- modifying game source files;
- hiding terrain/geography errors with oversized pads, haze, or repaint.

## Road-Graph Guard

City-stamp gate/ramp marks are source-art artifacts unless separately approved. The final blend proof may soften, mask, or visually de-emphasize them, but must not let them define road direction, ferry location, pass location, or primary adjacency.

Any short local ground tie-in must remain local contact treatment only. If a tie-in reads as a road, mark it for rework.

## Required Final Blend Inputs

Minimum required inputs:

- accepted `v3` composite reference;
- accepted `v3` placement JSON;
- T06 v2 normalized no-city terrain base;
- current rembg city-stamp cutout sources, if the proof is recreated from source layers;
- this brief.

Optional inputs:

- v2/v3 composite scripts for reproducibility;
- prior city-layer preview and city-stamp/blend test manifests for caveats;
- T06 geography/city audit for 洛阳, 襄阳, and 官渡 context.

## Review Gates

A final blend proof must record:

- exact input image(s) and scripts;
- whether v3 city count, position, and scale are unchanged;
- whether 洛阳 still reads off water;
- whether 官渡 still reads off water and does not imply a new road/crossing;
- whether 襄阳 reads as Han River / Jingxiang corridor context;
- whether pasted-object edges remain visible;
- whether paper tone and shadow treatment are coherent across city classes;
- whether any gate/ramp mark reads as road graph;
- whether any pseudo-settlement or extra fort appears;
- output dimensions;
- runtime isolation result.

## Acceptance Criteria

The proof can be marked `PROOF_READY_FOR_PRODUCER_REVIEW` only if:

- city layer is visually integrated enough to judge the tile as a whole;
- all locked v3 placement/scale decisions remain intact;
- city stamps no longer read as obvious pasted cutouts at normal review scale;
- road-graph ambiguity is reduced, not increased;
- runtime files remain untouched.

The proof must be marked `REWORK` if:

- any city moves or changes scale;
- a city appears to sit back on water;
- a gate/ramp mark reads like an approved road;
- blending creates new pseudo-settlements or fort-like marks;
- the image becomes too hazy to evaluate geography.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified.
