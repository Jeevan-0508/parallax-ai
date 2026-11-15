# Phase 2 implementation

## Delivered

- Replaced the CSS-only planetary stage with a genuine Three.js / React Three Fiber Earth: spherical geometry, procedural city-light points, atmosphere, wireframe latitude/longitude overlay, orbit controls, deterministic incident markers, and a low-cost star field.
- Added an explicit 2D fallback inside the WebGL viewport. The simulation remains usable when WebGL is unavailable.
- Added a cinematic scenario introduction with skip, replay, local preference persistence, no audio, and a reduced-motion toggle.
- Added deterministic simulation-to-region projection. Event IDs map to fixed presentation regions; the mapping is labeled as a projection and never changes authoritative simulation outcomes.
- Added immutable branch foundations in `packages/simulation`: `RunBranch`, checkpoint snapshots, parent IDs, independent advancement, and branch comparison with divergence day, sector delta, resource delta, and event delta.
- Added a child-branch action in the UI that advances with Public communications while keeping the parent branch unchanged.
- Added branch isolation and replay tests.

## Design decisions

The 3D layer is presentation-only. The authoritative engine remains framework-independent and deterministic. No geography was smuggled into the model: event IDs are projected to fixed illustrative regions for inspection. The globe uses original procedural graphics rather than a downloaded texture, avoiding a large asset and licensing dependency while preserving a real spherical interactive surface.

The branch layer snapshots complete `SimulationState` objects with `structuredClone`. A child retains parent history through the selected checkpoint and receives a new branch ID. `compareBranches` identifies the first recorded divergence, including the first day where only one branch has advanced.

## Files changed

- `apps/web/app/components/PlanetaryViewport.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/immersive.css`
- `apps/web/app/layout.tsx`
- `packages/simulation/src/index.ts`
- `packages/simulation/tests/engine.test.ts`
- `apps/web/package.json`

## Validation

Baseline before Phase 2: typecheck passed, 3 simulation tests passed, production build passed.

After Phase 2:

- `pnpm typecheck` — passed.
- `pnpm test` — 4 tests passed, including branch isolation.
- `pnpm build` — passed. The route grew to 268 kB / 370 kB first load because Three.js is now loaded for the 3D viewport.
- Browser verification — passed: opening sequence, Enter simulation, interactive globe render, parent fork, independent child advancement, and offline command center.
- Browser console — one non-blocking Three.js deprecation warning (`THREE.Clock`); no application errors or hydration warnings observed.

## Known limitations

- Globe textures are procedural, not satellite imagery. This is intentional for legal simplicity and performance; a licensed day/night texture can be added later.
- Historical timeline clicking and full side-by-side branch charts remain deferred. The current branch surface is a genuine checkpoint/child foundation and visibly labels its recorded divergence.
- Event-chain hashes are deterministic FNV-1a display hashes in the current engine, not SHA-256 signatures. Portable import/export and cryptographic integrity verification remain next-phase work.
- No automated Playwright suite exists yet; browser checks were performed against the live local preview.
- Three.js adds bundle weight. The next performance pass should split the globe into a lazy route boundary and add measured desktop/mobile frame-time telemetry.
