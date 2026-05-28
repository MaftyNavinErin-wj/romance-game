# Game Iteration Review Workflow

- During normal game-design / gameplay iteration, do not treat `npm run smoke` as the default hard gate.
- Historical context: the smoke/baseline workflow was mainly for refactor-phase behavior-preservation checks. It remains useful for high-risk changes such as broad refactors, init/tick/save-load/AI/cross-chain logic, or staged regression sweeps.
- For ordinary game changes, prefer focused verification:
  - `node --check <changed-js-file>` for syntax.
  - Scenario validators when changing scenario/data tables.
  - Targeted local mechanism checks for the subsystem touched.
  - Manual or browser/UI verification when the change is primarily presentation.
- For small or medium gameplay/UI changes, the producer prefers asking Codex to spawn/use an independent review agent to review the diff instead of forcing the old smoke workflow.
- If smoke fails during a low-risk game iteration, report it as residual environment/regression signal, but do not block the change unless the failure plausibly relates to the edited area.
