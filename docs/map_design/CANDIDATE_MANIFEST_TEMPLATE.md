# Candidate Manifest Template

Copy this template next to each generated or composited map candidate.

## Identity

- Candidate id:
- Stage:
- Verdict: `PASS` / `REWORK` / `REJECT` / `REFERENCE_ONLY`
- Date:
- Author/session:

## Files

- Repo output path:
- Review overlay path:
- Seam preview path(s):
- Generated source path(s):
- Reference image path(s):

## Generation

- Tool/path:
- Prompt:
- Negative constraints:
- Intended size:
- Actual size:
- Reference roles:

## Post-Processing

- Resize/crop:
- Color/paper adjustment:
- Compositing steps:
- Scripts or commands:

## Geography/Data Review

- City anchor overlay:
- River/road overlay:
- Tile/crop boundary:
- Coordinate drift notes:
- Movement budget exceeded: yes/no

## Art Review

- City/fort clarity:
- Field/farmland detail:
- Forest/foothill detail:
- Riverbank/water detail:
- Mountain/pass readability:
- Style consistency:
- Patch/seam risk:

## Stage 6 Tile Quality Gate

- Perspective/style gate: `PASS` / `REWORK` / not applicable
- Seam/overlap gate: `PASS` / `PENDING_NEIGHBOR` / `REWORK` / not applicable
- Terrain/geography gate: `PASS` / `REWORK` / not applicable
- Pseudo-settlement gate: `PASS` / `REWORK` / not applicable
- Runtime isolation gate: `PASS` / `FAIL` / not applicable

## Runtime Impact

- Runtime impact: usually `none`
- If promoted, target runtime asset path:
- Rollback asset path:

## Producer Decision

- Decision:
- Required changes:
- Reject/rework reason:
