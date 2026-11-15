# PARALLAX//AI — The Reality Fork Engine

PARALLAX//AI is a fictional, exploratory browser simulation for Scenario 001: *The Day Intelligence Vanished*. On simulated Day 0, AI-dependent services cease operating. You act as Continuity Director across energy, healthcare, logistics, finance, communications, and public trust.

## Current vertical slice

- Deterministic TypeScript simulation engine with seeded day-by-day transitions, bounded health scores, resource economics, dependencies, effects, cooldowns, 12 interventions, and 21 event definitions.
- Next.js App Router command center with a responsive three-region mission-control layout: World Intelligence, Planetary Theater, and Strategic Command, plus a persistent reality timeline.
- Three.js / React Three Fiber planetary viewport with NASA Blue Marble day imagery, NASA Black Marble night-side city lights, orbit controls, animated cloud points, atmospheric rim glow, deterministic event-to-region projection, sector filters, quality tiers, reduced-motion support, and a WebGL fallback.
- 365-day advancement in day/week/month modes, reset, offline scripted counsel, branch checkpoint affordance, and chain hashes for a trace log.
- Immutable `RunBranch` checkpoint foundation with parent lineage, isolated child advancement, divergence comparison, and unit coverage for deterministic replay, bounds, action traceability, day advancement, and branch isolation.
- Versioned Scenario 001 configuration: `scenario-001.v1` remains replayable while the default `scenario-001.v2` adds a lower recovery ceiling, capacity damage, fuel/crew scarcity, and stronger intervention opportunity costs.
- Fixed-seed policy comparison for no-action, random-action, and targeted-action strategies, plus state-derived council recommendations with explicit uncertainty.
- Portable `run-package.v1` JSON export/import with canonical serialization, SHA-256 integrity verification, checkpoint replay validation, tamper rejection, and a read-only checkpoint scrubber in the command center.

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validate

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Architecture

`packages/simulation` is framework-independent and contains the authoritative state transition functions. `apps/web` is a client-rendered Next.js interface that consumes the engine. A future `packages/shared` can own Zod contracts and a persistence adapter can implement local JSON plus PostgreSQL without moving simulation logic into the UI.

## Scientific boundary

This is not a forecast. Scores are normalized design indicators, coefficients are configurable game assumptions, and event causes are explanations inside this model only. The default boundary removes model-serving APIs, autonomous dispatch, adaptive recommendation systems, and automated decision layers; conventional software, non-AI automation, human operators, and local procedures remain available. Embedded model behavior is treated as unavailable unless manually replaced.

## Phase 3 scope and boundary

The Phase 3 engine is still intentionally fictional and offline-first. Policy comparison is deterministic and bounded; it is not an empirical forecast. The timeline scrubber inspects recorded checkpoints without mutating the live run. The branch panel compares the active parent and one isolated child; a full multi-branch chart and automated Playwright suite remain future work. The council signal bar is derived from state, while the longer adviser cards remain editorial presentation copy. See [docs/PHASE_3_IMPLEMENTATION.md](docs/PHASE_3_IMPLEMENTATION.md) for the delivered scope and validation evidence.

## Phase 4 experience

Phase 4 makes the globe the primary object: NASA imagery is bundled locally, the day/night shader blends surface and city-light textures, and the command center now surfaces real event severity, interventions, council evidence, branch comparison, and timeline markers in one workspace. See [docs/PHASE_4_EXPERIENCE_REVOLUTION.md](docs/PHASE_4_EXPERIENCE_REVOLUTION.md) for asset provenance, browser evidence, and known limits.

## Prior art

The project deliberately borrows broad ideas from strategy games, agent simulations, and world-simulation dashboards without claiming unprecedented originality. It is distinct in intent as an offline-first, deterministic, inspectable scenario runner rather than a chatbot or a claim about actual AI-disruption outcomes.
