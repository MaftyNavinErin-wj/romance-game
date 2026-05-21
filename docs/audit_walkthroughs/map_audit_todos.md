# Map Audit Todos

Date: 2026-05-22

Context: continuing the China bitmap / hex map alignment work across all scenarios.

## Next Session Priorities

1. Decouple visual rivers from gameplay water terrain.
   - Current issue: `river` is part of `WATER_TERRAINS`, so bitmap-aligned river hexes affect movement and water/land transition rules.
   - Concrete risk: normal overland roads can become AP-stopping water transitions.
   - Examples from the current audit:
     - `tianshui-changan`: 10/13 road hexes are `river`.
     - `wuchang-changsha`: 9/11 road hexes are `river`.
     - `bazhong-yiling`: 7/12 road hexes are `river`.
     - `jingzhou-yiling`: 7/10 road hexes are `river`.
   - Target direction: keep bitmap-visible rivers, but avoid turning every visible river trace into gameplay water unless that is intentional.

2. Make water-touching road audit stricter.
   - Current issue: `tools/audit_city_terrain_roads.js` lists "Roads Touching River/Water Hexes" as prompts, not failures.
   - Because water terrain changes movement behavior, high river overlap on normal roads should fail or require an explicit whitelist.
   - Candidate rule: ordinary land roads fail when `waterLike > 2`, unless the edge is tagged as bridge/ferry/water route.

3. Re-review bitmap terrain mismatch prompts.
   - Current issue: `docs/audit_walkthroughs/bitmap_alignment_audit.md` still lists city and terrain mismatches.
   - Important city prompts include `nanyang`, `xiapi`, `donghai`, `chengdu`, `jingzhou`, `yuzhang`, and others.
   - Some are probably classifier false positives caused by ink/shore texture, but they need human review before calling the map fully aligned.

4. Add validation around `ROAD_WAYPOINTS`.
   - Current issue: waypoint paths are useful, but malformed waypoint coordinates would fail unclearly.
   - Add bounds/type checks in the audit tool at minimum; optionally guard `roadHexPath`.

5. Confirm final visual style after the gameplay-water fix.
   - Current direction: cleaner bitmap, lighter terrain marks, no dashed river overlay, slightly darker explored fog.
   - After water decoupling, verify that visible water remains clear enough without making the whole map dirty again.

## Commands To Re-run

```powershell
npm.cmd run smoke
node tools/audit_city_terrain_roads.js
node tools/audit_map_consistency.js
node tools/audit_bitmap_alignment.js
node tools/build_map_alignment_audit.js
```
