# Stage 6 Controlled Tile Lessons v1

## Identity

- Stage: Stage 6 controlled production pipeline
- Scope: reusable lessons from the T06 no-city terrain and city-nudge loop
- Date: 2026-06-10
- Runtime impact: none

## Why This Exists

T06 proved that a production tile cannot be treated as a single finished imagegen output. The map can look good while still being wrong in ways that later city placement cannot repair: a misplaced major river, wrong city ownership, uncontrolled road texture, or over-compressed city scale.

This document records the practical lessons that should be reused for the remaining Stage 6 tiles.

## Core Production Rule

Use imagegen for terrain material, atmosphere, and local texture only.

Do not let imagegen decide:

- city count,
- city identity,
- city position,
- city size hierarchy,
- city ownership across overlaps,
- primary roads,
- passes, ferries, forts, or named crossings,
- final seam logic.

Those belong to deterministic control layers and producer-approved manifests.

## Required Loop For Every Tile

Every production tile should pass through this sequence:

1. Build or derive the tile control overlay from `control_master_v1`.
2. Classify scope cities, primary-owned cities, overlap/context cities, and delegated cities.
3. Write a no-city terrain brief with explicit river, mountain, basin, and edge-context controls.
4. Generate terrain only.
5. Apply the frame gate: exact output target or deterministic normalization with manifest.
6. Render a city-anchor overlay on top of the normalized terrain.
7. Audit terrain and city fit before any stamp work.
8. Decide `PASS`, `REWORK`, or `PASS_WITH_NUDGE_PROPOSAL`.
9. If using nudges, document each art-layer delta in a manifest.
10. Only after producer approval, proceed to deterministic city/road/stamp/blend tests.

Skipping the overlay audit is not allowed. Good style is not enough.

## Geography First Rule

Major geography is higher priority than local city fitting.

If a terrain element is wrong enough that cities need to be moved a lot to make the image plausible, rework the terrain instead of forcing the cities to adapt.

T06 v1 is the reference failure:

- the style was usable;
- the large river between Chang'an and Luoyang was geographically and visually wrong;
- moving Luoyang or Chang'an would not fix the underlying read;
- verdict was `REWORK`, not `NUDGE`.

Use this rule before spending effort on city stamps.

## River And Mountain Audit

Before approving a no-city terrain base, ask these questions:

- Which major river should be visible in this tile?
- Which major river must not cut through the tile center?
- Is a visible water feature primary geography or only local/subordinate water?
- Does the river support the intended city corridor instead of blocking it?
- Are mountain belts separated into real geographic roles rather than painted as one generic lower band?
- Does any mountain or water shape force a city into an implausible position?

For T06 specifically, the durable control logic is:

- Yellow River / Wei River: upper or northern control, not a central divider between Chang'an and Luoyang.
- Luo / Yi / Yiluo: local and subordinate around Luoyang.
- Han River: south of Qinling, relevant to Nanyang/Xiangyang/Hanzhong logic.
- Yangtze / Jianghan: bottom or southeast context only.
- Qinling, Funiu, and Daba: separate terrain roles, not one continuous generic wall.

Each later tile needs its own equivalent list before generation.

## City Ownership Lesson

Tile scope is not the same as final city ownership.

For every tile, classify each visible or near-visible anchor as one of:

- `primary-owned`: should receive full local emphasis in this tile or its assigned global layer.
- `global-overlap`: important city visible in overlap, but not owned by the tile terrain decision.
- `context`: helps terrain and seam reading, but should be subdued.
- `delegate`: should be owned by a neighboring tile or global layer.
- `omit-from-stamp-pass`: may appear in control overlay but should not receive a visible stamp in this pass.

T06 lesson:

- Chang'an and Luoyang are global primary overlap anchors, not T06-owned terrain features.
- Nanyang, Xiangyang, Shangyong, and Yiling are stronger T06 center anchors.
- Xinye and Hanzhong should be downgraded or treated as context.
- Chenliu, Guandu, and Xuchang should be delegated to T07 or the global city layer.
- Bashu, Jingzhou, and Yangtze groups should guide context only.

This classification must be written before city-stamp work.

## City Scale Lesson

Use the producer's simple scale metaphor as a review aid:

- major city: roughly "9 inch pizza" visual weight;
- normal or small city: roughly "5 inch pizza" visual weight;
- edge/context city: can be clipped or subdued, but must not become sesame-dot texture.

Then convert the metaphor into actual pixel/stamp sizes in the manifest. Do not rely on prompt wording to preserve scale.

City size should be adjusted only after checking:

- final ownership class,
- city-to-city collision,
- local terrain fit,
- label and hitbox needs,
- overlap seam duplication risk.

## City Nudge Policy

City nudges are allowed only as art-layer proposals.

They must not change runtime city data or silently rewrite `CITY_BASE`.

Allowed:

- small local shifts to keep a city off a river stroke, cliff edge, or dense texture patch;
- blend pads around stamps;
- local terrain cleanup around deterministic city placement.

Not allowed:

- moving cities far enough to change regional logic;
- moving one city to compensate for an incorrect major river or mountain;
- using imagegen's invented city positions as authority;
- hiding missing or duplicated cities inside texture.

Every nudge needs:

- original anchor,
- proposed rendered position,
- pixel delta,
- reason,
- ownership class,
- producer verdict.

T06 v2 Option A is the reference accepted pattern: keep terrain v2, then review documented art-layer nudges.

## Road And Texture Lesson

No-city terrain can still fail because of road-like clutter.

Prompt bans such as "no random road network" are not enough. Generated field lines, paths, terraces, and riverbank strokes must be audited after the image is produced.

Acceptable:

- weak field texture;
- ambiguous local brush texture;
- subdued ground grain that does not imply a strategic road.

Risky:

- many thin connected lines that look like a road network;
- lines that imply uncontrolled city-to-city routes;
- clustered marks that read as villages, forts, or settlements;
- strong road-like strokes crossing future city stamps.

Primary roads should be rendered later from the approved control graph.

## Frame Gate Lesson

Imagegen may return the wrong size. Treat size as a production gate, not a cosmetic detail.

For each tile, record:

- required output size,
- raw generated size,
- whether crop occurred,
- whether resize occurred,
- whether any AI repaint/edit occurred,
- exact normalized output size.

T06 lesson:

- raw v1 and v2 did not match the required `2344 x 1756`;
- normalized derivatives were allowed only because they were deterministic resize-only outputs;
- the manifest had to state that no crop and no AI repaint/edit occurred.

## Rework Versus Nudge Decision

Use this decision rule:

- `REWORK`: major terrain is wrong, city logic would become implausible, or the image invents too much strategic content.
- `PASS_WITH_NUDGE_PROPOSAL`: terrain is broadly correct, but local city stamps need small art-layer movement or blend pads.
- `PASS`: terrain, frame, geography, city reserves, and texture density are all acceptable for deterministic city/road layering.

Do not use `PASS_WITH_NUDGE_PROPOSAL` as a compromise for a fundamentally wrong river, mountain, or city ownership problem.

## Prompt Anti-Patterns

Avoid relying on vague prompt constraints:

- "historical map" may produce labels, roads, villages, or generic fantasy geography.
- "no cities" may still produce village-like clusters.
- "no roads" may still produce connected field/path networks.
- a good Jiangdong or lower-Yangtze reference can contaminate T06 with water-network grammar.
- style reference alone does not enforce scale or geography.

For future briefs, explicitly state both:

- what must appear;
- what must not appear in this tile.

Also state which reference is style/material only and which reference is geography/composition authority.

## Reusable File Set Per Tile

For each future tile, prefer this file set:

- `TXX_control_overlay_v1.html`
- `TXX_control_overlay_v1_manifest.md`
- `stage6_tXX_no_city_terrain_brief_v1.md`
- `terrain_tXX_no_city_vN.png`
- `terrain_tXX_no_city_vN_normalized.png`
- `terrain_tXX_no_city_vN_normalized_manifest.md`
- `terrain_tXX_no_city_vN_city_overlay.html`
- `terrain_tXX_no_city_vN_city_overlay.png`
- `terrain_tXX_no_city_vN_geography_city_audit.md`
- `terrain_tXX_no_city_vN_city_nudge_proposal.html`
- `terrain_tXX_no_city_vN_city_nudge_proposal.png`
- `terrain_tXX_no_city_vN_city_nudge_proposal_manifest.md`

Only create nudge proposal files when the audit supports `PASS_WITH_NUDGE_PROPOSAL`.

## Minimum Manifest Fields

Each terrain candidate manifest should include:

- tile id,
- source brief,
- generation method,
- raw image path and dimensions,
- normalized image path and dimensions,
- crop/resize/edit facts,
- geography verdict,
- pseudo-settlement verdict,
- road-texture verdict,
- city-reserve verdict,
- seam/edge-context notes,
- final verdict,
- producer decision.

Each nudge manifest should include:

- city name,
- ownership class,
- original normalized-frame position,
- proposed normalized-frame position,
- delta,
- reason,
- collision/geography risk addressed,
- producer decision.

## Practical Review Questions

Use these questions in producer review:

- Does the tile still read like the intended region after crop and normalization?
- Are the right rivers present, and are the wrong rivers absent?
- Are mountains helping regional structure or just blocking city placement?
- Which cities are owned here, which are context, and which are delegated?
- Can city stamps fit with 9-inch/5-inch scale logic?
- Are any cities forced into water, cliff, or dense texture?
- Would a small nudge fix the issue, or is the terrain itself wrong?
- Is road/path texture too dense for a no-city terrain base?
- Are neighboring seams still plausible?

## Current T06 Reference State

Current reference as of 2026-06-10:

- `terrain_t06_cc_w_no_city_v1_normalized.png`: `REWORK`; blocking wrong river between Chang'an and Luoyang.
- `terrain_t06_cc_w_no_city_v2_normalized.png`: current Option A terrain candidate.
- `terrain_t06_cc_w_no_city_v2_geography_city_audit.md`: audit record for v2.
- `terrain_t06_cc_w_no_city_v2_city_nudge_proposal.png`: current art-layer nudge proposal.
- `terrain_t06_cc_w_no_city_v2_city_nudge_proposal_manifest.md`: nudge manifest and current review target.

Next approved work should review the v2 nudge proposal before city stamp or blend generation.
