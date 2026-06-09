# Project Romance Map Art Master Workflow v1

> Status: draft v1 with independent-review revisions applied.
> Scope: `docs/map_design/` only until producer approves runtime integration.

## 1. Core Shift

The previous Luoyang-Changan crop work proved the zoom-level detail idea, but it also exposed a production problem: repeatedly generating a final local bitmap is inefficient and unstable.

New direction:

- Stop treating the old bitmap and current city anchors as absolute truth.
- Build a national visual master first, then align game hex/city data toward that master within controlled tolerances.
- Use AI generation for high-quality art material and local repainting, but use deterministic composition/data review for structure, consistency, and game alignment.
- Keep all new map-art candidates under `docs/map_design/` until approved. Runtime assets under `assets/maps/` should only receive promoted, approved outputs.

The target is not a perfect copy of the current map. The target is a coherent national ink-map base whose geography, cities, terrain, roads, and hex data can be reconciled together.

## 2. Lessons From v5-v9

Observed failures:

- Whole-image generation spreads detail too thin. Cities become vague textures instead of readable walled settlements.
- Full redraws often improve one area while degrading global style, color, river placement, or terrain density.
- Local compositing can create patch seams if paper tone, ink density, perspective, and edge treatment are not unified.
- Coordinate-authoritative city anchors are useful for review, but too rigid if the final bitmap is going to be nationally redrawn.
- Raw base-map review and in-game review answer different questions. Raw review catches art defects; in-game review catches label/unit/readability conflicts.

Current practical conclusion:

- Do not keep pushing `v10` as another final Luoyang crop.
- Move to national workflow, then return to local tiles only as representative validation cases.

## 3. Production Risks

### 3.1 Style Drift

Risk: ten independently generated map tiles will not share paper color, mountain brushwork, river treatment, field density, city scale, or line weight.

Controls:

- Establish a national style master before high-resolution tiles.
- Maintain a small art kit for repeated map elements.
- Use shared prompts, shared color references, and a final whole-map color/paper unification pass.
- Store prompts, references, and verdicts in candidate manifests.

### 3.2 Tile Seams

Risk: adjacent tiles will not match at borders, especially rivers, roads, mountain chains, and paper texture.

Controls:

- Define tile boundaries, overlap zones, output size, and national-canvas coordinates before representative high-resolution tiles.
- Produce tiles with overlap zones, not hard boundaries. Default overlap target: 15%-25% of tile width/height unless a later tile plan overrides it.
- Review seams with adjacent tiles visible.
- Avoid important cities, river confluences, and mountain passes directly on tile edges where possible.
- Run seam audits with strip previews: north, south, east, west, and neighbor-overlap composite.

### 3.3 Coordinate Drift

Risk: beautiful bitmap geography may conflict with city anchors, roads, rivers, or `HEX_TERRAIN`.

Controls:

- Treat current coordinates as elastic anchors, not absolute pixels.
- Use the Geography Control Layer in section 4 for movement budgets.
- From Stage 1 onward, every concept/tile review must include a data/anchor overlay. Stage 8 is final migration planning, not first discovery.

### 3.4 Compositing Artifacts

Risk: manually composited cities, fields, forests, or riverbanks can look pasted on.

Controls:

- Never paste hard rectangular patches.
- Use alpha/ink masks, irregular edges, and local paper-tone matching.
- After local composition, apply a global wash/unification layer.
- Review raw base, overlay preview, and seam preview separately.
- Art-kit assets must declare whether they are reference-only, texture patches, or compositable elements.

### 3.5 Gameplay Readability

Risk: a richer bitmap can fight labels, units, fog, roads, city icons, and hex mode.

Controls:

- Keep ownership, labels, selection, units, war/development state, and fog dynamic.
- Test representative in-game zoom levels before promoting an asset.
- If bitmap cities become strong enough, dynamic city icons may need a later approved design pass.

### 3.6 Performance And Asset Size

Risk: national high-resolution tiles can increase load time, memory, and zoom stutter.

Controls:

- Keep map art in documentation until visual direction is approved.
- Define tile resolution and LOD strategy before runtime integration.
- Promote only compressed, cropped, and tested runtime assets.
- Keep the previous runtime asset available for rollback.

### 3.7 Reproducibility Loss

Risk: cross-session work becomes unauditable if image prompts, generated source paths, post-processing, and reject reasons are not recorded.

Controls:

- Every generated candidate must have a manifest entry.
- Every stage transition must update `WORKLOG.md`.
- Rejected candidates stay in archive or a rejected subfolder with a short reason.

## 4. Geography Control Layer

The national bitmap and game data should converge, but not by unrestricted drift. Current data is a review scaffold; approved visual geography may later drive data changes.

### 4.1 Control Tiers

Tier A: hard geography

- Major rivers and confluences.
- Major mountain belts and basin boundaries.
- Major capitals and historically/geographically defining cities.
- Strategic chokepoints that define movement corridors.

Tier B: controlled geography

- Secondary cities.
- Ferries, passes, road corridors, regional boundaries.
- Broad terrain zones such as plains, hills, mountain foothills, forests, marshes, and water networks.

Tier C: flexible detail

- Villages, field grids, small woods, local road wiggles, small riverbank marks, decorative settlement clusters.

### 4.2 Movement Budget

Default budget until replaced by a specific data-alignment plan:

- Major capitals and strategic cities: move at most 1 local hex neighborhood from current intent.
- Secondary towns and passes: move at most 2 local hex neighborhoods if geographic readability improves.
- Rivers and roads: visual path may be redrawn, but crossings, confluences, and strategic links must be explained in overlay review.
- Terrain boundaries: zone-level agreement matters more than exact old cell identity.
- Decorative C-tier detail: no fixed coordinate obligation.

Any movement beyond this budget is a design decision and must return to producer approval.

### 4.3 Required Overlays

Every national concept, tile, and stitch candidate must have at least one review overlay showing:

- Key city anchor zones.
- Major rivers.
- Mountain/pass corridors.
- Existing or proposed road links.
- Tile/crop boundary if relevant.

The overlay does not have to be runtime code. It can be an annotated PNG or HTML review page, but it must be stored next to the candidate.

## 5. Candidate Manifest And Worklog

Every candidate needs an audit trail. Use `CANDIDATE_MANIFEST_TEMPLATE.md` for each stage or batch.

Required manifest fields:

- Candidate id and stage.
- Repo output path.
- Generated source path, if created by imagegen.
- Prompt and negative constraints.
- Reference images and their roles.
- Intended size and actual size.
- Post-processing or compositing steps.
- Data/anchor overlay path.
- Review verdict: `PASS`, `REWORK`, `REJECT`, or `REFERENCE_ONLY`.
- Reject/rework reason, if applicable.
- Runtime impact: usually `none`.

`WORKLOG.md` must record:

- Current approved stage.
- Active candidate.
- Last producer decision.
- Next action.
- Files added or archived in the latest session.

## 6. Visual Grammar

The map should read as a painted historical geography map, not as a UI board.

### 6.1 Cities And Forts

Desired:

- Walled cities with readable wall thickness, gates, corner towers, inner wards, roads, courtyards, and city-to-road relationships.
- Large capitals can be roughly orthogonal because historical walled cities often are, but they must read as architecture, not selection boxes.
- Pass forts and ferry nodes should be compact, strategic, and visually tied to terrain chokepoints.

Avoid:

- Transparent straight frames.
- Floating icon-like castles.
- City patches with mismatched paper color.
- Free AI placement that ignores Tier A/B geography.

### 6.2 Plains And Farmland

Desired:

- Field grids, irrigation traces, and low terrain texture.
- In Stage 6 terrain-base prompts, villages, settlement clusters, forts, and clear roads are banned unless they are later added through approved deterministic layers.
- Density should vary: capital plains can be dense; frontier plains should be lighter.

Avoid:

- Uniform noise texture.
- Modern cartographic fields.
- Overly green farmland that breaks the ink-map palette.

### 6.3 Rivers And Water

Desired:

- River width hierarchy, banks, shoals, ferries, confluences, and nearby roads.
- Water should remain low-saturation blue-gray and compatible with ink terrain.

Avoid:

- Overly saturated blue.
- River paths that contradict approved strategic geography unless the data will be adjusted.

### 6.4 Mountains, Forests, And Passes

Desired:

- Mountain ridges and valleys that explain movement corridors.
- Forest clusters and foothills integrated with mountain bases.
- Passes should be visible but not UI symbols.

Avoid:

- Decorative mountains unrelated to pass/road logic.
- Dense detail under critical labels or unit areas.

## 7. Workflow

### Stage 0: Design Frame

Output:

- This master workflow.
- A map-workspace README.
- Archive of old local experiments.
- `WORKLOG.md`.
- Candidate manifest template.

Gate:

- `PASS`: producer confirms national-first workflow, elastic coordinate policy, docs-only workspace, and review discipline.
- `REWORK`: workflow direction accepted but controls are insufficient.
- `STOP`: producer redirects back to local/runtime work.

### Stage 1: National Low-Resolution Concept

Goal:

- Establish nationwide composition, terrain language, paper tone, and strategic geography without committing to final resolution.

Output:

- One national concept image under `docs/map_design/work/national_concept/`.
- A review overlay showing Tier A/B geography: major rivers, mountain belts, regions, key city zones, and candidate road/pass corridors.
- Candidate manifest entry.

Gate:

- `PASS`: national image has the desired detail grammar and the overlay shows no unacceptable Tier A contradiction.
- `REWORK`: art direction is promising but terrain/city/detail grammar is weak or overlay drift exceeds budget.
- `STOP`: national direction is rejected.
- Runtime integration remains forbidden.

### Stage 2: Art Kit

Goal:

- Create reusable high-detail references for repeated terrain/city elements.

Asset classes:

- `reference-only`: used to guide prompts or visual judgment; not pasted into final art.
- `texture-patch`: can be blended into terrain but must use irregular masks and global unification.
- `compositable-element`: can be inserted as a visible object, but must be reviewed for pasted-on artifacts and followed by unification.

Minimum kit:

- Large walled capital.
- Medium walled city.
- Small town / frontier city.
- Pass fort / ferry fort.
- Plain farmland / village / road patch.
- Riverbank / ferry / shoal patch.
- Foothill forest patch.
- Mountain pass corridor patch.

Gate:

- `PASS`: producer approves the kit as matching the national concept's detail target, and each asset has a declared class.
- `REWORK`: some asset classes fail style/detail/compositing-readiness.
- `STOP`: art-kit approach is rejected.

### Stage 3: Provisional National Tile Plan

Goal:

- Define enough tile geometry before representative high-resolution work starts.

Output:

- `work/tile_plan/tile_index_v1.md`.
- `work/tile_plan/tile_grid_v1.png` or HTML preview.
- National canvas aspect, target scale, provisional tile count, overlap percentage, representative tile crop boxes, and output size.

Gate:

- `PASS`: tile boundaries avoid major cities/confluences where practical, overlap is defined, and representative tiles have exact crop specs.
- `REWORK`: tile geometry is unclear or likely to create seam/data problems.
- `STOP`: tile-based production is rejected.

### Stage 4: Representative Tiles

Goal:

- Validate that the style scales to different terrain types before producing the whole country.

Recommended slices:

- Luoyang-Changan / Guanzhong-Henan: capitals, plains, Yellow River, passes.
- Bashu / Hanzhong: mountain basins, corridors, river valleys.
- Jiangdong / Huai-Si: water network, plains, ferries, dense settlements.

Output:

- Three high-resolution tile candidates with overlap margins.
- Raw base previews.
- Data/anchor review overlays.
- Seam strip previews for each relevant edge.
- Candidate manifests.

Gate:

- `PASS`: style scales across the three terrain types, key overlays stay within movement budget, and seam strips are not visibly broken.
- `REWORK`: one or more terrain types fails detail/readability/seam review.
- `STOP`: national style is not scalable.

### Stage 5: Final National Tile Plan

Goal:

- Lock tile boundaries, overlap zones, target resolution, and naming before batch production.

Rules:

- Tile boundaries should avoid major cities and key confluences where possible.
- Every tile must include overlap with neighbors.
- Each tile should know its national canvas coordinates and intended crop rectangle.

Output:

- Final `tile_index_v1.md`.
- Final `tile_grid_v1.png` or HTML preview.
- Neighbor relationship table.

Gate:

- `PASS`: all tiles have coordinates, overlap, neighbor list, and output resolution.
- `REWORK`: missing tile metadata or seam risk remains too high.

### Stage 6: Tile Production

Goal:

- Produce the national map through controlled terrain tiles plus deterministic cartographic layers.

Method:

- Follow `work/tile_plan/stage6_production_pipeline_v1.md`.
- Use image generation for no-city terrain bases and localized blend/paint-over, not for final city count, city positions, city size hierarchy, or primary road layout.
- Build control overlays before further production candidates. The first pilot artifacts are `control_master_v1` and `T06_control_overlay_v1`.
- Render city and primary road layers from data/control rules, then blend them into the terrain art.
- Store source candidates, control overlays, selected outputs, and QA notes separately.

Gate:

- `PASS`: the tile/pipeline candidate passes control overlay review, raw terrain review, deterministic city/road review, manifest completeness, QA checks, and neighbor seam review.
- `REWORK`: tile requires localized repaint or regeneration.
- `REJECT`: tile is archived with reason and replaced.

### Stage 7: Stitch And Unify

Goal:

- Make the national map read as one painting.

Tasks:

- Stitch selected tiles.
- Resolve seams.
- Harmonize paper color, ink density, river color, and texture.
- Run a final global wash/noise pass.

Output:

- National stitched candidate.
- Seam audit preview.
- Data/anchor overlay.
- Candidate manifest.

Gate:

- `PASS`: stitched map reads as one painting and major geography remains within approved movement budget.
- `REWORK`: seams, wash, or geography overlays need targeted correction.

### Stage 8: Game Data Alignment

Goal:

- Convert previously observed overlay differences into an explicit implementation proposal.

This is not the first alignment check. Alignment has been reviewed since Stage 1. Stage 8 is for final migration planning.

Tasks:

- Compare approved bitmap geography to `CITY_BASE`, `HEX_TERRAIN`, `ROADS`, and `RIVERS`.
- Propose city/terrain/river adjustments as explicit data changes.
- Keep a migration note for every gameplay-significant shift.

Gate:

- `PASS`: producer approves the data-alignment proposal.
- `REWORK`: proposal has unclear gameplay impact or excessive migration.
- `STOP`: visual master is accepted only as art reference, not runtime target.

### Stage 9: Runtime Integration

Goal:

- Promote approved assets from `docs/map_design/` to `assets/maps/`.

Requirements:

- Producer explicitly approves promotion.
- Promotion copies approved assets; it does not move active docs sources.
- Runtime edit scope is declared before changes, normally limited to map asset constants/render cache unless separately approved.
- Previous runtime map asset remains available for rollback.
- LOD and performance plan is written before implementation.
- Asset size check and browser visual checks pass at far/mid/near zoom.
- Grid mode and ink mode are both checked.
- Dynamic labels, icons, fog, unit marks, and selection remain readable.

Gate:

- `PASS`: promoted asset works in-game and rollback path exists.
- `REWORK`: visual or performance issues need targeted runtime/art correction.
- `ROLLBACK`: restore previous runtime asset and document failure.

## 8. Folder Structure

Use this structure going forward:

```text
docs/map_design/
  README.md
  WORKLOG.md
  CANDIDATE_MANIFEST_TEMPLATE.md
  MAP_MASTER_WORKFLOW_v1.md
  work/
    national_concept/
    art_kit/
    representative_tiles/
    tile_plan/
    stitch/
    data_alignment/
  archive/
    2026-06-04_to_07_luoyang_crop_exploration/
      README.md
      ARCHIVE_INDEX.md
```

Policy:

- `work/` is for active candidates.
- `archive/` is for old experiments and rejected candidates.
- Runtime-promoted assets must be copied to `assets/maps/` only after approval.
- Do not delete old experiments unless producer explicitly asks.

## 9. Naming Rules

Recommended names:

- `national_concept_v1.png`
- `national_concept_v1_overlay.png`
- `national_concept_manifest_v1.md`
- `artkit_city_large_v1.png`
- `artkit_farmland_plain_v1.png`
- `tile_guanzhong_henan_v1.png`
- `tile_guanzhong_henan_v1_overlay.png`
- `tile_guanzhong_henan_v1_seam_east.png`
- `national_stitch_v1.png`
- `data_alignment_notes_v1.md`

Rejected files should stay in archive or a rejected subfolder with a short note explaining why.

## 10. Review Questions

Do not proceed to the next stage unless the current gate is answered.

Key questions:

- Does the national image have the desired detail grammar?
- Do fields, forests, riverbanks, mountains, roads, and city footprints all read clearly?
- Does the style remain usable under game overlays?
- Are tile seams controlled?
- Are coordinate mismatches acceptable under the elastic policy?
- Is the required data migration small and explainable?
- Is the candidate manifest complete enough for another session to reproduce or understand the result?

## 11. Immediate Next Step

If this workflow is approved:

1. Keep current runtime v6 unchanged.
2. Start Stage 1 with a national low-resolution concept under `docs/map_design/work/national_concept/`.
3. Use the producer's concept reference as the detail target, not v8/v9.
4. Create a manifest entry and data/anchor overlay for the first national concept.
5. Review national concept before making any new runtime asset or local tile.
