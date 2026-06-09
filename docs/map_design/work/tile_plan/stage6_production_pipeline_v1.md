# Stage 6 Production Pipeline v1

## Identity

- Stage: Stage 6 production workflow correction
- Status: proposed workflow update, pending producer approval
- Date: 2026-06-09
- Runtime impact: none

## Why This Exists

`T06_CC_W v5` proved that the visual style is close, but it also exposed a production problem: a single image-generation prompt cannot reliably place all city anchors, road links, terrain constraints, and overlap seams at final zoom-in quality.

The approved Stage 1-5 decisions remain valid:

- national-first workflow,
- approved `national_concept_v5` style direction,
- accepted Stage 4 representative references,
- 4 x 3 tile grid,
- 20% overlap,
- 4x production scale,
- Stage 6 production order starting with `T06_CC_W`.

This document changes only the Stage 6 execution model. Stage 6 production tiles should no longer be treated as final all-in-one AI images. They should be produced through a controlled map pipeline.

## Core Rule

AI generation may produce terrain material and local blending, but it must not own gameplay-significant cartography.

Deterministic data/control layers must own:

- city count,
- city position,
- city size hierarchy,
- primary road graph,
- tile overlap ownership checks,
- missing/duplicate city QA.

## Layer Model

### 1. Global Control Layer

One national control layer is the source of truth for production review. It should include:

- all 55 `CITY_BASE` city anchors,
- tile boundaries,
- overlap bands,
- city visual size class,
- city ownership/priority class,
- main road graph,
- major river and mountain control zones.

The control layer can be HTML/SVG/canvas and does not need to be runtime code.

Required first artifact:

- `docs/map_design/work/tile_plan/control_master_v1.html`
- Optional PNG export: `docs/map_design/work/tile_plan/control_master_v1.png`

`control_master_v1` must be created before, or in the same change set as, `T06_control_overlay_v1`. The T06 overlay must derive from this global artifact rather than restating city and road rules by hand.

`control_master_v1` must have a manifest/worklog trail like other Stage 6 candidates. At minimum, record its data sources, generated outputs, review verdict, and producer decision before using it as an approved source for terrain prompts.

### 2. Terrain Tile Layer

Each Stage 6 tile produces a terrain base, not a finished city map.

Terrain prompts should require:

- no cities,
- no villages,
- no forts,
- no random settlement icons,
- no clear AI-invented road network,
- controlled major terrain masses and major rivers.

Road-like traces may exist only as weak field texture unless they are later overpainted by the deterministic road layer.

### 3. City And Road Layer

Cities and primary roads are rendered deterministically from data/control rules after terrain is available.

Rules:

- city positions come from projected `CITY_BASE` anchors unless a producer-approved data-alignment note changes them;
- primary roads connect data-controlled city links, not AI-invented landmarks;
- the initial road graph must be derived from existing game adjacency/road data plus previously approved geography notes; any missing link, reroute, pass, ferry, or strategic crossing must be marked `PENDING_PRODUCER_APPROVAL` instead of silently accepted;
- roads should connect to city gates and avoid major river/mountain control zones unless the link is a pass/ferry/crossing;
- pass/ferry/crossing links must come from existing game adjacency, prior approved geography notes, or explicit producer approval; automation must not invent named passes or strategic crossings;
- roads should be reviewed nationally, then clipped or previewed per tile.

### 4. City Stamp Art Layer

City visuals should use a small accepted stamp set rather than free AI placement.

Required initial stamp classes:

- large/capital city,
- standard walled city,
- small/pass city,
- optional subdued edge/overlap variant.

Stamp rules:

- stamps must share paper tone, line weight, perspective, and ink density with the accepted references;
- stamps should be composited with non-rectangular masks and paper/ink blending;
- stamp scale must be controlled numerically, not left to prompt interpretation.

### 5. Blend / Paint-Over Layer

After deterministic city and road placement, localized blending may use AI editing or manual compositing.

Blend pass goals:

- city gates connect to roads,
- roads merge into fields and passes,
- city edges absorb paper texture,
- no pasted-on rectangular artifacts,
- no new uncontrolled cities, forts, labels, or villages.

Blend pass may improve visual integration but must not move city anchors or invent new strategic routes.

## City Scale Rules

Initial review scale should follow the producer size direction:

- primary capitals / major anchors: large, roughly the "9 inch pizza" reference size;
- normal cities: standard, roughly the "5 inch pizza" reference size;
- small/pass cities: not smaller than readable standard-mini scale, never sesame-dot marks;
- overlap/edge cities: may be subdued or clipped by final composition, but must not be shrunk into random texture.

The exact pixel sizes should be set by the first `T06_control_overlay_v1` and reused for later tiles unless producer review changes the scale.

The pizza wording is only a producer-facing scale metaphor. `T06_control_overlay_v1` must convert it into pixel dimensions and percentage-of-tile measurements before any production art step.

## Tile Scope Versus Final Ownership

Tile scope and final city ownership are different.

For any tile:

- `scope city`: a city anchor inside the tile crop or overlap review margin; it must appear in the tile control overlay for terrain/seam review.
- `primary-owned city`: a city whose final visible footprint should be rendered mainly in this tile or in the global city layer region corresponding to this tile center.
- `overlap/edge city`: a city included for seam and geography review; it may be rendered by a neighboring tile or the global layer, but must not be ignored.

`T06_CC_W` therefore can contain 20+ scope cities while still having only a smaller set of primary-owned/full-emphasis cities.

The final national composite should avoid duplicate city footprints by rendering the city/road layer globally or by using explicit ownership rules before per-tile clipping.

## T06 Pilot Steps

Do not continue from `tile_t06_cc_w_v5` directly into another all-in-one imagegen candidate.

The next T06 work item should be:

1. `control_master_v1`
2. `T06_control_overlay_v1`

`control_master_v1` must show all 55 city anchors, tile grid, overlap bands, city classes, proposed road graph, and major river/mountain control zones.

`T06_control_overlay_v1` must derive from `control_master_v1` and show:

- all T06 scope cities from `t06_city_scope_audit_v1.md`,
- city class: primary, standard, overlap/edge,
- proposed pixel size circles/boxes for each class,
- initial road graph through the tile,
- major river control zones,
- southern Qinling/Funiu foothill control zones,
- tile boundary and overlap bands.

Producer review should answer:

- Are the city classes acceptable?
- Is the city density visually feasible?
- Are overlap/edge cities handled correctly?
- Is the road skeleton acceptable before terrain generation?
- Does T06 remain a good pilot for automating the rest of Stage 6?

Only after this overlay is approved should T06 proceed to:

1. no-city terrain base generation,
2. deterministic city/road render preview,
3. city stamp art test,
4. blend pass test,
5. seam/QA review.

## Automation After T06

If T06 passes as a pilot, the same pipeline should be scripted for the next production batch: `T01_NW`, `T02_NC_W`, `T03_NC_E`, `T04_NE`, and `T05_WC`.

This is only the next automation batch, not the full remaining map. After the T01-T05 batch, the same automation should continue across the full approved 4 x 3 tile plan in `tile_index_v2_final_candidate.md`, including `T07_CC_E`, `T08_EC`, `T09_SW`, `T10_SC_W`, `T11_SC_E`, and `T12_SE`.

For each tile, automation should generate:

- city scope table,
- projected tile pixel coordinates,
- city class proposal,
- overlap/edge classification,
- road graph clipped to tile context,
- control overlay HTML/PNG,
- terrain-generation brief draft,
- manifest skeleton,
- QA report for missing cities, duplicate risks, road dead ends, and overlap conflicts.

Producer review remains required for terrain composition, city density, edge ownership decisions, visual pass/fail, and final promotion.

Automation stop gates before any tile image generation:

- `control_master_v1` exists and is the source for every tile overlay;
- the tile's city scope table is generated from `CITY_BASE`;
- overlap/edge ownership is classified;
- road graph is clipped from the approved control graph;
- the generated control overlay is reviewed before terrain prompting.

## QA Gates

A Stage 6 production candidate cannot pass unless these checks are satisfied:

- all 55 city anchors are accounted for nationally;
- each tile's scope cities appear in its control overlay;
- no final city footprint is duplicated across overlap seams;
- no city is reduced to random texture scale;
- primary roads connect to city footprints;
- roads do not visibly ignore major terrain barriers;
- terrain bases contain no uncontrolled city/village/fort marks;
- city stamps share the accepted map perspective and ink/paper style;
- blend passes do not move data-controlled anchors;
- if Stage 8 later approves city, road, river, or terrain data alignment changes, deterministic city/road layers must be regenerated from the approved data rather than manually patched;
- runtime impact remains none until explicit promotion approval.

## Runtime Impact

- Runtime impact: none.
- No file is promoted to `assets/maps/`.
- No `src/` file is modified by this workflow update.
