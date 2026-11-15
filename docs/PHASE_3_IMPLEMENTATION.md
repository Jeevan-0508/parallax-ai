# Phase 3 implementation

## Delivered

- Added versioned Scenario 001 configuration. `scenario-001.v1` preserves the earlier replay path; `scenario-001.v2` is the default and models constrained recovery, a 91-point health ceiling, capacity damage after disruption, slower credits, crew attrition, fuel burn, and intervention opportunity costs.
- Added fixed-seed policy evaluation for no-action, random-action, and targeted-action strategies across four deterministic seeds. The report includes mean health, minimum health, fuel, credits, and the engine outcome classification.
- Added a decision loop with day, week, and month advancement, auto-run, a pause-on-critical toggle, resource/cooldown gating, visible action tradeoffs, and read-only historical checkpoint inspection.
- Added derived council recommendations. Each adviser profile selects an eligible action or observe state from the current sector/resource condition and reports an objective, rationale, and uncertainty score.
- Added portable `run-package.v1` export/import. Packages include seed, scenario version, actions, checkpoints, branch lineage, canonical SHA-256 integrity, and replay verification. Tampered or divergent packages are rejected before replacing the active run.
- Added UI controls for export/import, pause-on-critical, checkpoint scrubbing, run-package status, and state-derived council signals.
- Isolated the Three.js viewport behind a client-only lazy boundary so the simulation command center can hydrate independently of WebGL support.

## Design decisions

The authoritative state transition layer remains framework-independent. Scenario coefficients are explicit data rather than hidden constants, and v1 uses the original resource and phase behavior so prior runs can be re-created. v2 is deliberately a constrained mode: scarcity and opportunity cost create meaningful policy variation without pretending to model real-world economies.

Run packages use canonical key ordering before hashing. Import replays every recorded checkpoint from the origin and compares the supplied state hash, event count, and final branch metadata. SHA-256 is provided by the browser-compatible `@noble/hashes` package with a local UTF-8 fallback for restricted preview runtimes.

Historical inspection is read-only. It changes the inspected checkpoint indicator and shows the recorded state hash, but actions and advancement remain disabled until the operator returns to live state. The active command-center telemetry intentionally remains live to avoid silently replacing the current run with a historical snapshot.

## Files changed

- `packages/simulation/src/index.ts`
- `packages/simulation/tests/engine.test.ts`
- `packages/simulation/package.json`
- `apps/web/app/page.tsx`
- `apps/web/app/immersive.css`
- `README.md`

## Validation

- `pnpm typecheck` — passed for the workspace.
- `pnpm test` — passed, 8 simulation tests.
- `pnpm build` — passed with Next.js static route generation.
- Live local preview — confirmed the Phase 3 controls, scenario v2 label, checkpoint scrubber, derived signal surface, intervention tradeoffs, branch surface, and lazy viewport fallback render.

## Known limitations

- The globe remains procedural rather than licensed satellite imagery; region markers are illustrative projections only.
- The current UI displays the selected checkpoint hash and read-only state, but does not replace every live chart with a complete historical side-by-side view.
- The branch UI currently presents one child branch at a time; the engine supports lineage and comparison, while a multi-branch chart is deferred.
- No automated Playwright suite is configured yet. Engine-level replay, policy, council, and package-integrity coverage is in place; browser verification was performed against the local preview.
