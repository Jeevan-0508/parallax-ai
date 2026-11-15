# PARALLAX//AI — Phase 4.5 Product Quality Audit

Audit date: 2026-10-25  
Scope: existing Phase 4 application only. No simulation mechanics, application source, or styling was changed during this audit.  
Preview: `http://localhost:3000/?phase=4`

## Executive assessment

PARALLAX//AI is a strong visual prototype with a distinctive identity, a credible deterministic simulation spine, a recognizable Earth theater, and a complete end-to-end journey on the happy path. The command center, crisis alert, intervention costs, 365-day progression, historical inspection, branch split, and council presentation are all real browser surfaces rather than static mockups.

It is not yet ready for a premium public launch. The most important blockers are semantic rather than cosmetic: the Crisis Council claims to be read-only while its buttons mutate the run; historical inspection exposes deployable-looking actions; and the reality fork records a divergence that produces no visible trust or event delta after the first child step. On mobile, the navigation and fixed replay controls compete with the theater. The 3D layer also needs a first-class accessible alternative, loading/error states, and a device-aware performance policy.

Recommended release posture: continue as a controlled preview or portfolio prototype, but hold public launch until the P0 interaction-contract and accessibility issues are fixed and covered by automated browser tests.

## Repository and implementation review

The repository was inventoried with `rg --files` and direct source inspection. The current product surface is concentrated in:

- `apps/web/app/page.tsx` — application state, journey controls, command center, council, assumptions, import/export, history, and branching UI.
- `apps/web/app/components/PlanetaryViewport.tsx` — React Three Fiber Earth, day/night textures, cloud points, city lights, incident markers, orbit controls, quality tiers, and camera focus.
- `apps/web/app/globals.css`, `apps/web/app/immersive.css`, and `apps/web/app/phase4.css` — base, immersive, and Phase 4 layout/style layers.
- `packages/simulation/src/index.ts` — deterministic state transitions, interventions, events, outcomes, branches, council recommendations, and SHA-256 run packages.
- `packages/simulation/tests/engine.test.ts` — eight simulation tests covering replay, bounds, interventions, branching, scenario versions, policy variation, export/import integrity, and council derivation.
- `apps/web/public/textures/earth-day.jpg` and `earth-night.jpg` — local Earth textures.

There is no configured automated browser/Playwright suite, no lint script in the root package, and no performance budget or telemetry harness.

## Validation results

### Repository checks

| Check | Result | Evidence |
|---|---|---|
| `pnpm typecheck` | PASS | Both workspace TypeScript projects completed without errors. |
| `pnpm test` | PASS | Vitest: 1 file, 8 tests passed. |
| `pnpm build` | PASS | Next.js production build completed; `/` prerendered successfully. |
| Lint | NOT CONFIGURED | No lint script is defined in the root or web package. |

### Browser checks

| Surface | Result | Notes |
|---|---|---|
| Desktop 1440px | PASS WITH FINDINGS | Full command center, intro, crisis state, intervention, 365-day run, history, fork, council, and assumptions were exercised. |
| Tablet 768px | PASS WITH FINDINGS | Theater remains recognizable and stacked layout is usable; fixed replay controls overlap the lower theater edge. |
| Mobile 390px | PASS WITH FINDINGS | Layout stacks and Earth remains visible; primary navigation is clipped and fixed controls cover the bottom of the theater. |
| Runtime errors | PASS | No application errors or hydration failures observed. |
| Runtime warnings | FINDING | Repeated `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` warning from the Three.js runtime. |
| Export | PASS | UI reached `RUN PACKAGE EXPORTED · SHA-256 VERIFIED`. |
| Import | NOT INDEPENDENTLY VERIFIED IN IAB | The hidden file input did not expose a file chooser/download artifact in the in-app browser. The code-level export/import integrity test passed. |

## Player-journey audit

1. Scenario introduction — passed. The opening sequence exposes the fictional-model framing, 365-day horizon, Earth visual, Enter, and Skip controls. Screenshot: [phase4.5-introduction-desktop.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-introduction-desktop.png).
2. Day 0 — passed. The command center shows six sectors, four reserves, the planetary theater, intervention console, derived council preview, causal inspector, fork panel, and timeline. Screenshot: [phase4.5-day0-command-center.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-day0-command-center.png).
3. Crisis discovery — passed. Advancing at 30× produced five early signals by Day 30 and a severity-3 Hospital surge at Day 60. Screenshot: [phase4.5-critical-event.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-critical-event.png).
4. Interventions and resources — passed mechanically. Fuel prioritization reduced public influence from 43 to 38, reduced ready interventions from 12 to 11, showed cooldown `CD 8D`, and displayed a deployment notice. Screenshot: [phase4.5-intervention-feedback.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-intervention-feedback.png).
5. 365-day simulation — passed. At 30×, the run progressed through Days 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, and 365. The button changed to `YEAR COMPLETE`; no dedicated debrief appeared. Screenshot: [phase4.5-year-complete.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-year-complete.png).
6. Crisis Council — presentation passed; interaction contract failed. The five cards rendered with state-derived recommendations and uncertainty. Clicking Mara's supposedly read-only action mutated the live recommendation state from Manual dispatch to Essential freight corridors. Screenshot: [phase4.5-crisis-council.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-crisis-council.png).
7. Historical checkpoints — passed with an affordance defect. Day 365 was scrubbed to Day 60, the historical banner and hash appeared, and the live state stayed separate. Deploy buttons still looked enabled; clicking one produced a rejection notice only after the click.
8. Reality forking — passed mechanically. Forking Day 60 created `origin.fork-1` with parent/child Earth views. Screenshot: [phase4.5-reality-split.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-reality-split.png).
9. Butterfly-effect inspection — incomplete as a product experience. The child advanced to Day 61 and the parent remained unchanged, but the displayed comparison was `Trust delta 0.0 · Event delta 0`; the branch had diverged structurally without a meaningful visible consequence. Screenshot: [phase4.5-butterfly-effect.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-butterfly-effect.png).
10. Reset — passed. Reset returned the run to Day 0, restored baseline reserves, cleared the child branch, and displayed the reset notice.
11. Model and assumptions — passed as documentation. The screen clearly states that the model is fictional, bounded, deterministic, and not a forecast. Screenshot: [phase4.5-model-assumptions.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-model-assumptions.png).

## Ten highest-priority product problems

Severity uses `Critical` for a release-blocking trust or state-contract failure, `High` for a major usability, accessibility, or engagement blocker, and `Medium` for an important polish or operational gap.

### 1. The read-only Crisis Council mutates the simulation

**Severity:** Critical  
**Reproducible evidence:** Open Crisis Council at Day 0. It states `ADVISORY LAYER // READ-ONLY` and `Recommendations are deterministic, bounded, and never mutate the simulation.` Click Mara Venn's `Manual dispatch`. The command state changes and the council recommendation changes to `Essential freight corridors`; the command center later reports `MANUAL DISPATCH DEPLOYED`.  
**Affected files:** `apps/web/app/page.tsx`, especially `CouncilPreview`, the council card action, and `dispatch`.  
**Likely root cause:** Council buttons call the same live `dispatch` callback used by Strategic Command, with no `tab` or read-only policy gate.  
**Recommended fix:** Make the council genuinely advisory: replace direct deployment with `Inspect in Command Center` or an explicit `Stage recommendation` action. If direct deployment is desired, remove the read-only language and show a clear confirmation plus the exact resource deltas before mutation. Add an E2E assertion that opening/clicking council recommendations does not mutate state unless explicitly confirmed.

### 2. Historical inspection exposes deployable-looking controls

**Severity:** High  
**Reproducible evidence:** Run to Day 365, scrub to Day 60. The banner says `Actions remain locked`. Intervention and council buttons remain enabled in the accessibility tree and visually resemble live controls. Clicking one is accepted by the UI and only then produces `HISTORICAL INSPECTION IS READ-ONLY · EXIT TO DEPLOY`.  
**Affected files:** `apps/web/app/page.tsx`, `InterventionConsole`, `CouncilPreview`; `apps/web/app/immersive.css` for the visual state.  
**Likely root cause:** `dispatch` contains a runtime guard, but the button `disabled` state is based only on resource eligibility/cooldown and does not receive `inspectionDay`.  
**Recommended fix:** Pass an explicit `readOnly` prop through the command and council surfaces. Disable or replace all mutation controls, add `aria-disabled`, and make the lock state visible in the control label. Keep the handler guard as defense in depth.

### 3. Reality forking does not yet produce a convincing butterfly effect

**Severity:** High  
**Reproducible evidence:** Fork at Day 60 and use `ADVANCE CHILD · PUBLIC COMMS`. The UI correctly reports `First divergence: day 61` and `PARENT UNCHANGED`, but the comparison remains `Trust delta 0.0 · Event delta 0`. The two globes look synchronized and the UI exposes no resource-by-resource or sector-by-sector explanation.  
**Affected files:** `apps/web/app/page.tsx` (`advanceChild`, branch diff UI), `packages/simulation/src/index.ts` (`compareBranches`, `forkBranch`).  
**Likely root cause:** The demo path advances only one child day with a fixed action and renders only one sector delta plus event count. A structural history divergence is being presented as a substantive outcome divergence.  
**Recommended fix:** Let users choose an actual child action path, advance parent and child to a comparable horizon, and render a full diff: health, capacity, resources, actions, event chain, and causal factors. Keep `divergenceDay` separate from `impactDay` so the UI does not imply that a first divergent hash is already a meaningful consequence.

### 4. The mobile navigation and fixed replay controls compete with the experience

**Severity:** High  
**Reproducible evidence:** At 390px, the primary navigation visibly clips `MODEL & ASSUMPTIONS`; the fixed replay bar covers the lower edge of the Earth theater. At 768px, the replay bar still sits over the theater/timeline transition. See [phase4.5-mobile-390.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-mobile-390.png) and [phase4.5-tablet-768.png](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-tablet-768.png).  
**Affected files:** `apps/web/app/globals.css`, `apps/web/app/immersive.css`, `apps/web/app/phase4.css`.  
**Likely root cause:** The nav uses horizontal overflow as its mobile strategy, while `.floating-tools` remains fixed and is only compressed, not relocated into the timeline or a dismissible control drawer.  
**Recommended fix:** Use a compact navigation menu or clearly scrollable tab rail with visible affordance. Move replay actions into the timeline on small screens, reserve safe-area space, and keep the theater unobstructed. Add screenshot assertions for 390px and 768px.

### 5. Mobile defaults to Cinematic quality instead of a device-aware budget

**Severity:** High  
**Reproducible evidence:** The 390px screenshot shows `QUALITY CINEMATIC`. The main viewport initializes with cinematic quality even on small screens; only compact split views default to balanced.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, especially the `quality` state initializer and Canvas configuration.  
**Likely root cause:** `useState<Quality>(compact ? "balanced" : "cinematic")` has no media-query, device-pixel-ratio, or reduced-capability branch.  
**Recommended fix:** Default small screens and low-memory/mobile contexts to `mobile`, persist the user's override, and show the active tier in a non-technical way. Measure texture memory, frame time, and split-view cost before enabling Cinematic by default.

### 6. The 3D theater has no equivalent accessible interaction model

**Severity:** High  
**Reproducible evidence:** Incident markers are Three.js meshes with pointer click/hover handlers, not keyboard-focusable controls. The viewport is exposed primarily as `role="img"`; marker titles and camera focus are not represented as a navigable event list. At 390px, the visual quality/filter controls are visible in the screenshot but are not consistently represented in the accessibility snapshot.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, `apps/web/app/page.tsx`.  
**Likely root cause:** R3F scene objects are treated as the interaction surface, while the DOM wrapper exposes a single image-like region.  
**Recommended fix:** Add a synchronized accessible event list with buttons for each marker, label severity/day/sector/cause, and make those buttons invoke camera focus. Add explicit labels and keyboard support for filters and quality controls, then test with keyboard-only navigation and a screen reader tree.

### 7. Texture loading and WebGL failure states are not product-grade

**Severity:** High  
**Reproducible evidence:** On cold reload, the viewport can present a black/empty theater while the local textures initialize; there is no visible progress, retry, or texture-specific error. The current fallback only covers WebGL unavailability, not failed or slow texture loading.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, `apps/web/app/page.tsx`, `apps/web/public/textures/*.jpg`.  
**Likely root cause:** `useLoader(TextureLoader, ...)` is used without a visible loading boundary, progress telemetry, error boundary, compressed texture path, or retry affordance.  
**Recommended fix:** Add a branded loading state with progress and a 2D static fallback, catch texture failures separately from WebGL failures, preload/crossfade day/night assets, and add a retry path. Convert the large JPEGs to an appropriate GPU-compressed or responsive asset strategy after measuring quality.

### 8. Day 365 ends without a meaningful debrief or reward loop

**Severity:** High  
**Reproducible evidence:** At Day 365, the timeline button changes to `YEAR COMPLETE`, but the user remains on the ordinary command center. There is no end-of-run summary of decisions, event chain, resource trajectory, council accuracy, branch outcomes, or recommended next action.  
**Affected files:** `apps/web/app/page.tsx`, `apps/web/app/phase4.css`.  
**Likely root cause:** The implementation changes only the button label when `state.day >= 365`; the existing `outcome` result remains a small header statistic.  
**Recommended fix:** Add a dedicated completion state that summarizes the run, names the decisive events/actions, shows outcome confidence and reserve trajectory, offers export/share/replay, and links directly to a fork or council review. Preserve the command center as a secondary view.

### 9. Feedback is visually present but not reliably announced or causally legible

**Severity:** High  
**Reproducible evidence:** Critical pause and intervention results are written into a small `.notice` line in the Strategic Command panel. On mobile and lower scroll positions, the notice can be off-screen; it has no `aria-live`/status semantics and no focus movement. The event inspector provides factor labels but not a clear before/after explanation for the chosen action.  
**Affected files:** `apps/web/app/page.tsx`, `apps/web/app/immersive.css`, `apps/web/app/phase4.css`.  
**Likely root cause:** Notice state is a plain visual `<div>` and the action result is not promoted into a global event/decision feedback channel.  
**Recommended fix:** Use a persistent `role="status"` live region, a concise result toast with severity, and a causal delta panel that names changed sectors/resources and the tradeoff. Move critical feedback near the timeline and focus it when the run pauses.

### 10. The visual/runtime budget is not yet controlled for a public product

**Severity:** Medium-High  
**Reproducible evidence:** The main viewport loads day and night textures of approximately 2.6 MB and 8.1 MB, uses dense cloud/city point layers and a 96×64 sphere, and split view mounts two Canvas instances. Browser logs repeatedly emit the Three.js `THREE.Clock` deprecation warning. Typography frequently falls to 7–9px mono text, which is difficult to read in the 390px and council screenshots.  
**Affected files:** `apps/web/app/components/PlanetaryViewport.tsx`, `apps/web/app/phase4.css`, `apps/web/app/immersive.css`, `apps/web/package.json`.  
**Likely root cause:** Visual density and GPU cost were optimized by feel, without frame-time, memory, texture decode, or contrast budgets; the dependency stack still surfaces a deprecated clock warning.  
**Recommended fix:** Establish budgets for first meaningful Earth, frame time, texture memory, and mobile split cost; use shared renderer/resources for split view; reduce or compress assets by tier; raise minimum readable text sizes/contrast; and remove or isolate the clock warning through a dependency-compatible upgrade.

## Accessibility assessment

Strengths:

- Primary navigation, reset, advance, speed, checkpoint, import/export, and intervention controls are exposed to the accessibility tree.
- Sector cards expose pressed state.
- The checkpoint slider has a label and exposes read-only status text.
- The model boundary screen clearly communicates that the product is fictional and not predictive.

Gaps:

- The intro overlay is a plain `section`, not a modal dialog. Opening it left focus on the underlying `OPENING SEQUENCE` button in the browser tree; there is no focus trap, Escape close, `aria-modal`, or return-focus behavior.
- The Council's read-only claim conflicts with its actionable buttons.
- Historical controls are visually and semantically too close to live controls.
- Three.js incident markers have no keyboard equivalent.
- Mutation notices lack live-region semantics.
- Small text and low-contrast mono labels are difficult to consume at mobile sizes.

## Visual and engagement assessment

What is working:

- The Earth texture is immediately recognizable and dramatically improves the theater over the previous wireframe direction.
- The three-region hierarchy reads clearly on desktop: sector state, planetary theater, and command decisions are visually distinct.
- Critical red treatment, intervention cooldowns, resource counters, and timeline markers create a coherent simulation language.
- The council has a strong presentation surface and distinct adviser identities.

What keeps it from feeling premium:

- The experience is information-rich but not yet decision-rich: there is no clear player objective, success strategy, or end-of-run interpretation beyond the outcome label.
- Dense 7–9px labels and many simultaneous panels make the interface feel like a control-room concept rather than a legible public product.
- The branch view visually duplicates two globes but does not yet explain what changed in a way a player can act on.
- The most important feedback is often below the fold or inside a small right-column notice.

## Prioritized remediation roadmap

### P0 — trust, state contracts, and accessible completion

1. Make Crisis Council read-only or explicitly transactional; add regression coverage.
2. Make historical inspection controls actually disabled and visibly locked.
3. Add accessible event/marker alternatives and proper intro modal focus management.
4. Add end-of-run debrief and clear critical-event/resume feedback.
5. Complete browser-level export/import verification with a real file chooser and a fixture package.

### P1 — make the simulation meaningfully replayable

1. Replace the single fixed child action with real branch action sequencing.
2. Add a full branch diff and causal event comparison over a selectable horizon.
3. Add decision objectives, clearer tradeoff previews, and an explicit next-best-action loop.
4. Make mobile navigation and replay controls responsive without covering the theater.

### P2 — public-facing performance and polish

1. Introduce device-aware quality defaults, loading progress, texture fallback, and telemetry.
2. Set readability/contrast budgets and remove low-value microcopy or promote it into details-on-demand.
3. Reduce split-view GPU duplication and resolve the Three.js warning.
4. Add automated responsive/browser regression coverage for 1440px, 768px, and 390px, including the complete journey.

## Audit evidence index

- [Introduction](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-introduction-desktop.png)
- [Day 0 command center](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-day0-command-center.png)
- [Day 30 crisis discovery](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-day30-crisis-discovery.png)
- [Critical event](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-critical-event.png)
- [Intervention feedback](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-intervention-feedback.png)
- [365-day completion](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-year-complete.png)
- [Historical checkpoint](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-historical-checkpoint.png)
- [Reality split](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-reality-split.png)
- [Butterfly-effect inspection](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-butterfly-effect.png)
- [Crisis Council](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-crisis-council.png)
- [Model and assumptions](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-model-assumptions.png)
- [Tablet 768px](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-tablet-768.png)
- [Mobile 390px](C:/Users/HP/Documents/ChatGPT/Parallax-AI/docs/screenshots/phase4.5-mobile-390.png)

No remediation was implemented. No commit, push, or deployment was performed.
