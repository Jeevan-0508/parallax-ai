# PARALLAX//AI — Phase 5 Remediation Report

Audit/implementation date: 2026-10-26  
Scope: gameplay integrity rescue and public-facing quality remediation following `docs/PHASE_4_5_PRODUCT_AUDIT.md`.  
Release posture: materially safer and more playable than Phase 4.5, but not yet a finished public product.

## Executive result

Phase 5 addressed the highest-risk trust failures in the Phase 4.5 audit without changing the underlying scenario mechanics:

- Crisis Council recommendations are now advisory/stage-only. They cannot mutate the active run.
- Every intervention requires an explicit confirmation dialog with cost, tradeoff, and model-boundary language.
- Historical inspection disables deployment controls and exposes the read-only state in both text and semantics.
- Reality forks are isolated and now accept a selectable child action. The comparison reports recorded divergence separately from meaningful impact, with sector/resource/event deltas and recorded causes.
- Day 365 now ends in a debrief with final sectors, resources, milestone hashes, major crises, modeled decision review, copyable result summary, replay, and final-reality fork actions.
- The planetary theater has visible loading/error/WebGL fallback states, a persisted quality policy, reduced-motion handling, and a textual incident navigation equivalent.
- Export/import is now verified through the browser file chooser, and an in-app restore-last-export path makes the browser workflow recoverable without a second file selection.
- State-changing intervention and advance commands are routed through `executeSimulationCommand`; structural fork/reset actions remain explicit lifecycle operations.

The product is now suitable for a controlled preview. A public-ready release still needs browser automation, a WebGL-capable performance pass, stronger objective/reward design, and the remaining accessibility polish described below.

## Validation results

| Check | Result | Evidence |
|---|---|---|
| `pnpm typecheck` | PASS | Both workspace TypeScript projects completed with exit code 0 on 2026-10-26. |
| `pnpm test` | PASS | Vitest: 1 file, 10 tests passed. New tests cover advisory council safety, reproducible branch divergence, and run summaries. |
| `pnpm build` | PASS | Next.js production build compiled, type-checked, prerendered `/`, and reported the final route bundle. |
| Lint | NOT CONFIGURED | No lint script exists in the root or web package. |
| Desktop browser | PASS WITH FINDINGS | Command center, intervention confirmation, council, history, fork, debrief, export/import, and reset paths were exercised in the in-app browser. |
| Tablet 768px | PASS WITH FINDINGS | Responsive layout remains usable; visual density and the small-screen navigation strategy still need a dedicated polish pass. |
| Mobile 390px | PASS WITH FINDINGS | Stacking, mobile quality policy, and accessible controls were checked; the experience remains dense and needs readability refinement. |
| Browser console | PASS WITH DEV-TOOL FINDING | After the WebGL2 capability gate and a clean dev-server restart, the app loaded and no new `THREE.Clock` warning appeared. A transient Next HMR/server cache failure (`a[d] is not a function`, HTTP 500) occurred during hot recompilation and remains in the tab's retained diagnostic history; restarting the dev server restored the app. |

## Browser journey evidence

The following screenshots are genuine browser captures stored in `docs/screenshots/`:

- [Council read-only and stage-only controls](screenshots/phase5-council-read-only.png)
- [Reality split with a recorded child divergence](screenshots/phase5-reality-divergence.png)
- [Historical inspection with disabled deployment controls](screenshots/phase5-historical-inspection.png)
- [390px mobile layout](screenshots/phase5-mobile-390.png)
- [Day 365 debrief](screenshots/phase5-day365-debrief.png)
- [Export completion state](screenshots/phase5-export-result.png)
- [Verified import result](screenshots/phase5-import-result.png)
- [Tampered-package rejection](screenshots/phase5-import-integrity-rejection.png)

The Phase 4.5 screenshot set remains the baseline for introduction, Day 0, crisis discovery, historical checkpoints, the original split view, council presentation, and the 1440/768 responsive reference states.

### Independently reproduced paths

1. Day 0 command center loaded with six sector signals, four reserves, intervention console, council preview, theater fallback, timeline, and fork controls.
2. Selecting an intervention opened `Confirm Fuel prioritization?`; the dialog exposed tradeoff, cost, and model note before deployment.
3. Clicking a council `STAGE FOR REVIEW` action returned to command center, selected the recommended sector, and changed only the notice. Resources and simulation state remained unchanged.
4. Scrubbing to a recorded checkpoint exposed `INSPECTING DAY 30 · READ-ONLY`; intervention buttons appeared disabled with `Historical inspection · deployment unavailable`.
5. Forking and advancing the child with `Public communications` preserved the parent and reported `First divergence: day 61; impact day 61`, sector/resource/event deltas, and `Recorded causes: Public communications`.
6. Day 365 displayed the debrief, final world condition, resources remaining, milestone hashes, major crises, modeled decision review, share summary, replay, and final-reality fork.
7. Export downloaded `C:\Users\HP\Downloads\origin-run-package.json` and displayed `RUN PACKAGE EXPORTED · SHA-256 VERIFIED · RESTORE AVAILABLE`.
8. Importing that browser download through the native file chooser displayed `RUN PACKAGE IMPORTED · ORIGIN · SHA-256 AND REPLAY VERIFIED`.
9. A deliberately modified copy (`origin-run-package-modified.json`) was rejected through the same file chooser with `IMPORT REJECTED · RUN PACKAGE INTEGRITY CHECK FAILED`.
10. Reset returned the live run to Day 0 and cleared the child branch during the earlier complete journey pass.

## Remediation ledger

### 1. Crisis Council mutation contract — FIXED, P0

**Severity:** Critical  
**Original evidence:** Phase 4.5 labeled the council `READ-ONLY` while clicking a recommendation mutated the live command state.  
**Affected files:** `apps/web/app/page.tsx`.  
**Root cause:** Council cards reused the live dispatch callback.  
**Implemented fix:** `CouncilPreview` now exposes `STAGE FOR REVIEW`; staging selects the target sector, switches to command context, and produces a status notice. It does not apply an intervention. The copy now states that advisers can recommend/stage but never execute.  
**Regression coverage:** `packages/simulation/tests/engine.test.ts` verifies the advisory path leaves the parent unchanged and produces a reproducible child comparison. Browser evidence: [phase5-council-read-only.png](screenshots/phase5-council-read-only.png).

### 2. Historical deployment affordances — FIXED, P0

**Severity:** High  
**Original evidence:** Historical controls looked deployable and only rejected after activation.  
**Affected files:** `apps/web/app/page.tsx`, `apps/web/app/immersive.css`.  
**Root cause:** The handler had a guard, but controls were not given the inspection state.  
**Implemented fix:** `readOnly` flows through the intervention console and disables controls, adds `aria-disabled`, shows a lock treatment, and labels the surface `Historical inspection · deployment unavailable`. The runtime guard remains in place.  
**Regression coverage:** Browser accessibility snapshot showed disabled intervention buttons and the read-only banner at a recorded checkpoint.

### 3. Reality fork consequence model — FIXED FOR THE PRODUCT CONTRACT, P1 FOLLOW-UP REMAINS

**Severity:** High  
**Original evidence:** The fork diverged structurally but presented no meaningful explanation beyond a zero trust/event delta.  
**Affected files:** `packages/simulation/src/index.ts`, `packages/simulation/tests/engine.test.ts`, `apps/web/app/page.tsx`, `apps/web/app/immersive.css`.  
**Root cause:** The child path was fixed and the comparison surfaced too little state.  
**Implemented fix:** Child action selection now supports no intervention or an available intervention. `compareBranches` reports `divergenceDay`, `impactDay`, all six sector deltas, changed resources, event delta, action delta, and recorded intervention causes. The UI explicitly distinguishes recorded divergence from material impact.  
**Regression coverage:** A deterministic seed test asserts parent immutability, divergence day 3, impact day 3, changed influence, and the recorded fuel-prioritization cause. Browser evidence: [phase5-reality-divergence.png](screenshots/phase5-reality-divergence.png).  
**Remaining work:** Add a selectable comparison horizon and a richer event-chain explanation so users can compare two longer strategies, not only the next child step.

### 4. Mobile replay/navigation collision — IMPROVED, P1 FOLLOW-UP REMAINS

**Severity:** High  
**Original evidence:** 390px navigation clipped and fixed replay controls covered the theater; 768px still had lower-edge overlap.  
**Affected files:** `apps/web/app/immersive.css`.  
**Root cause:** Fixed replay tooling and a single-line nav were competing with the theater.  
**Implemented fix:** Replay tools move into normal flow below the primary content and become a two-column mobile grid; small-screen debrief and branch grids stack; nav receives safe right padding and preserves usable tab targets. Browser evidence: [phase5-mobile-390.png](screenshots/phase5-mobile-390.png).  
**Remaining work:** Replace the still-dense nav rail with a compact menu or a more obviously scrollable tab treatment, and complete a visual 768px pass after the next typography iteration.

### 5. Device-aware quality defaults — FIXED

**Severity:** High  
**Original evidence:** Mobile initialized to Cinematic quality.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`.  
**Root cause:** Quality initialization used only the compact flag.  
**Implemented fix:** The viewport reads persisted preference, otherwise selects Mobile under 760px or reduced motion, Balanced for compact split views, and Cinematic for a capable full viewport. The selected tier is persisted and remains user-adjustable.  
**Regression coverage:** 390px browser capture and accessibility tree exposed the quality control; the current in-app browser showed the 2D fallback rather than attempting unsupported WebGL.

### 6. Accessible equivalent for the 3D theater — FIXED FOR CORE NAVIGATION

**Severity:** High  
**Original evidence:** Three.js markers were not keyboard-addressable and the theater was effectively an image-like region.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, `apps/web/app/page.tsx`, `apps/web/app/immersive.css`.  
**Root cause:** Interaction lived in R3F scene objects without a synchronized DOM representation.  
**Implemented fix:** An `ACCESSIBLE INCIDENT NAVIGATION` disclosure lists each incident with title, day, region, and sector and calls the same focus logic as the 3D marker. Sector filters now expose pressed state; quality and reduced-motion controls are labeled. A textual incident trace is also visible in the main theater.  
**Remaining work:** Add automated keyboard traversal and screen-reader acceptance tests, and give the opening sequence modal proper focus management.

### 7. Texture/WebGL loading and failure states — IMPROVED

**Severity:** High  
**Original evidence:** Cold loading could look empty and failures had no retry path.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, `apps/web/app/immersive.css`.  
**Root cause:** Texture loading was not surfaced through a branded loading boundary or error boundary.  
**Implemented fix:** Added progress/status messaging, texture error retry, a WebGL fallback that explicitly states the simulation remains playable, and reduced-motion-aware scene settings. The IAB browser verified `2D FIELD FALLBACK WebGL unavailable · simulation remains playable`.  
**Remaining work:** Measure and optimize the JPEG texture payloads, add a real progress bar if loading telemetry is available, and validate the WebGL error path on a GPU-capable browser.

### 8. Day 365 completion loop — FIXED

**Severity:** High  
**Original evidence:** `YEAR COMPLETE` left the player on the ordinary command center with no interpretation or replay reward.  
**Affected files:** `packages/simulation/src/index.ts`, `packages/simulation/tests/engine.test.ts`, `apps/web/app/page.tsx`, `apps/web/app/immersive.css`.  
**Root cause:** Completion only changed a button label.  
**Implemented fix:** `summarizeRun` creates bounded model-derived final state, sector health/capacity/trend, remaining resources, milestone hashes, major crises, and a decision review. `RunDebrief` presents these with copy, replay, and final-reality fork actions.  
**Regression coverage:** Summary test verifies all six sectors, six milestones, and strongest modeled decision. Browser evidence: [phase5-day365-debrief.png](screenshots/phase5-day365-debrief.png).

### 9. Feedback announcement and causal clarity — IMPROVED

**Severity:** High  
**Original evidence:** Small notices were not live-region announcements and did not make the tradeoff legible.  
**Affected files:** `apps/web/app/page.tsx`, `apps/web/app/immersive.css`.  
**Root cause:** Feedback was a passive visual div and intervention changes were not consistently paired with a confirmation explanation.  
**Implemented fix:** Notices use `role=status` and `aria-live=polite`; interventions have a confirmation dialog with cost/tradeoff/model notes; debrief and branch surfaces expose sector/resource/event deltas.  
**Remaining work:** Promote critical events into a globally positioned, focus-managed announcement so feedback is not dependent on scroll position.

### 10. Runtime/readability budget — PARTIALLY FIXED, P2 FOLLOW-UP REMAINS

**Severity:** Medium-High  
**Original evidence:** Heavy textures, duplicate Canvas instances, tiny mono text, and a Three.js `THREE.Clock` deprecation warning were identified.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, `apps/web/app/immersive.css`, `apps/web/app/phase4.css`, `apps/web/package.json`.  
**Root cause:** The visual layer had no explicit device/frame/memory budgets and the warning originated below the application component boundary.  
**Implemented fix:** Added device-aware quality tiers, mobile/reduced-motion defaults, persisted user preference, a WebGL2 capability gate, and a playable WebGL fallback. On the current unsupported browser, the gate prevents R3F `<Canvas>` from mounting; the clean post-restart tab loaded without a new `THREE.Clock` warning.  
**Remaining work:** The WebGL2-capable path was not available in this environment, so the installed Three.js/R3F renderer must still be checked on a GPU-capable browser. The dev server also experienced a transient HMR cache failure during hot recompilation; it recovered after restart, but that development-tool issue should be triaged separately. Establish measurable first-Earth, frame-time, texture-memory, and split-view budgets; raise the minimum readable type size.

## Remaining release blockers

1. No automated browser suite exists. The complete journey is manually verified, but regressions in council safety, historical disabling, responsive layout, and import/export are not yet enforced in CI.
2. The opening sequence still needs dialog semantics: focus trap, Escape handling, `aria-modal`, and return focus.
3. WebGL-capable performance remains unverified in this environment. The WebGL2 gate removes the warning for unsupported devices, but the Three.js/R3F path needs a GPU-capable verification pass. A transient Next dev HMR cache error also needs triage for local developer reliability.
4. The fork now explains one-step divergence, but a premium product needs longer-horizon strategy comparison and a stronger player objective/reward loop.
5. Typography and information density remain closer to a control-room prototype than a universally legible public product.
6. Linting is not configured, so static quality coverage is incomplete.

## Prioritized next roadmap

### P0 — trust and accessibility completion

1. Add Playwright/browser tests for council non-mutation, confirmation-required intervention, historical disabled state, export/import replay verification, reset, and the 365-day debrief.
2. Finish opening-sequence dialog semantics and keyboard-only acceptance.
3. Run the theater on a WebGL-capable browser and close the Three.js warning or document an intentional dependency exception.

### P1 — make replay strategically meaningful

1. Add a selectable branch horizon and full event/resource history comparison.
2. Introduce explicit scenario objectives, success criteria, and post-run unlocks or learning prompts.
3. Improve mobile navigation and move remaining high-density detail into details-on-demand surfaces.

### P2 — public-facing performance and polish

1. Add frame-time, texture-memory, and first-meaningful-theater budgets by device tier.
2. Compress/serve responsive texture assets and reduce split-view GPU duplication.
3. Establish a minimum type/contrast budget and add lint plus accessibility checks to the standard validation command.

No commit, push, or deployment was performed.
