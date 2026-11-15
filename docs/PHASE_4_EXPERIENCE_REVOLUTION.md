# Phase 4 experience revolution

## Implementation summary

- Replaced the procedural dark globe surface with a locally bundled, UV-mapped Earth using NASA Blue Marble Next Generation daytime imagery and NASA Black Marble night-time illumination.
- Added a custom Three.js shader for a readable day/night terminator, emissive city lights, and a restrained atmospheric rim. Added a semi-transparent deterministic cloud layer, smooth rotation, orbit zoom, marker hover labels, marker selection, incident colors, and a WebGL fallback.
- Added viewport quality tiers (`CINEMATIC`, `BALANCED`, `MOBILE`), sector overlay filters, and a reduced-motion control. The 3D viewport remains lazy client-only so the command center hydrates independently of WebGL.
- Reworked the command center into three regions: World Intelligence, Planetary Theater, and Strategic Command. The bottom reality audit combines branch actions with a persistent timeline and event markers.
- Added contextual critical-event feedback. Severity-3 events create a visible alert, pause auto-advance when the existing pause setting is enabled, and produce corresponding red event markers.
- Upgraded reality forking to a genuine side-by-side parent/child theater. Both worlds use actual branch state and the existing branch comparison engine; the UI shows divergence day, resource/event deltas, and independent child advancement.
- Upgraded the council into state-derived holographic cards. Adviser identity and copy remain local and fictional; recommendations, objectives, uncertainty, and action buttons come from `getCouncilRecommendations`.
- Refined the opening sequence with a locally sourced Earth visual, stronger mandate copy, skippability, and reduced-motion compatibility.
- Added responsive behavior for desktop, tablet, and mobile: the center theater moves first on narrow screens, panels stack without horizontal overflow, controls remain keyboard/screen-reader addressable, and mobile quality is selectable.

## UI architecture

`apps/web/app/page.tsx` owns simulation orchestration and renders the three-region workspace. `apps/web/app/components/PlanetaryViewport.tsx` owns presentation-only Three.js state: texture loading, shader uniforms, orbit controls, marker overlays, filters, quality, and motion preference. `apps/web/app/phase4.css` adds the Phase 4 layout and visual treatment without modifying the authoritative simulation engine.

The command center reads `viewState`, which is either the live state or the selected recorded checkpoint. Historical inspection remains read-only: the selected checkpoint is displayed in the intelligence, theater, and inspector panels while dispatch and advancement stay disabled.

## Asset sources and licenses

The image assets are downloaded into `apps/web/public/textures/` so production does not depend on external hotlinks:

- `earth-day.jpg`: [NASA Blue Marble Next Generation, December 2004, 5400×2700](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg). NASA Earth Observatory / Visible Earth composite. NASA imagery is public domain; the project preserves NASA attribution and makes no endorsement claim.
- `earth-night.jpg`: [NASA Black Marble 2016, 3 km global city-light product](https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg). NASA Earth Observatory / Visible Earth product. NASA imagery is public domain; the project uses it as an illustrative visualization layer, not as a live measurement.

The daytime image is a geographic equirectangular map suitable for a sphere UV. The cloud layer is procedural and presentation-only; no cloud observations are asserted. Event locations remain deterministic illustrative projections from the existing engine mapping.

## Performance and accessibility

- The Three.js dependency is lazy-loaded with `next/dynamic` and `ssr: false`.
- Texture URLs are local and loaded only by the viewport. Quality tiers reduce star count, cloud density, point count, device pixel ratio, and antialiasing for smaller devices.
- The viewport uses a limited marker window, bounded cloud points, one shared shader pass, and a low-cost fallback. The two-world split defaults both views to `BALANCED` quality.
- `prefers-reduced-motion` disables decorative animation; the in-viewport `MOTION REDUCED` control also stops globe/cloud rotation and star motion.
- Primary actions are ordinary buttons/selects with visible labels, ARIA names, pressed states, and keyboard-accessible controls outside the canvas.

## Screenshot evidence

Captured from the local browser preview at the indicated viewport sizes:

- `docs/screenshots/phase4-introduction.png`
- `docs/screenshots/phase4-command-center-desktop.png` — 1440px desktop workspace.
- `docs/screenshots/phase4-command-center-tablet.png` — 768px tablet layout.
- `docs/screenshots/phase4-command-center-mobile.png` — 390px mobile layout.
- `docs/screenshots/phase4-night-side-earth.png` — interactive night-side city illumination.
- `docs/screenshots/phase4-critical-event.png` — severity-linked event markers, event history, and timeline.
- `docs/screenshots/phase4-intervention-result.png` — real intervention resource/cooldown feedback.
- `docs/screenshots/phase4-council.png` — holographic council presentation.
- `docs/screenshots/phase4-reality-split-top.png` — parent and child planetary views.
- `docs/screenshots/phase4-butterfly-effect.png` — recorded divergence day 61 comparison surface.

## Validation

- `pnpm typecheck` — passed.
- `pnpm test` — passed, 8 simulation tests.
- `pnpm build` — passed; the production route prerenders successfully with no CSS warnings.
- Browser QA — verified 1440px, 768px, and 390px layouts; day advancement; severity-3 pause feedback; intervention consequence/cooldown; council recommendations; branch creation; independent child advancement; night-side lights; quality selection; reduced motion; and the NASA-textured WebGL viewport.
- Browser console — only the pre-existing non-blocking Three.js `THREE.Clock` deprecation warning was observed; no application errors or hydration failures.

## Known limitations and Phase 5 priorities

- The NASA textures are authentic public-domain visualization products, not a live satellite feed. Cloud coverage is procedural and intentionally not presented as real-time weather.
- The cloud layer is point-based rather than a second licensed cloud texture. A future pass can add a compressed cloud map or a more physically based atmosphere after measuring its cost.
- Split views use two Canvas instances and default to balanced quality; a shared renderer/resource pool could reduce duplicate GPU work further.
- No automated Playwright suite is configured yet. Browser acceptance evidence is captured manually through the local browser preview.
- Recommended Phase 5 priorities: add a dedicated branch comparison chart, persist user quality/motion preferences, add texture loading telemetry, remove or upgrade the remaining Three.js clock warning through dependency-compatible instrumentation, and add automated responsive/browser regression coverage.
