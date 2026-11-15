export const SECTORS = ["energy", "healthcare", "logistics", "finance", "communications", "trust"] as const;
export type Sector = (typeof SECTORS)[number];
export type ScenarioVersion = "scenario-001.v1" | "scenario-001.v2";
export const SCENARIO_VERSIONS: ScenarioVersion[] = ["scenario-001.v1", "scenario-001.v2"];

export type Factor = { label: string; delta: number; kind: "dependency" | "event" | "action" | "baseline" };
export type SectorState = { health: number; capacity: number; trend: number; factors: Factor[] };
export type Resources = { credits: number; crews: number; fuel: number; influence: number };
export type Intervention = {
  id: string; name: string; brief: string; cost: Partial<Resources>; cooldown: number;
  eligibility: (state: SimulationState) => boolean; tradeoff: string; sector: Sector;
};
export type Event = { id: string; title: string; body: string; sector: Sector; severity: number; dayMin: number; condition?: (state: SimulationState) => boolean };
export type EventLog = { day: number; eventId: string; title: string; severity: number; hash: string; causes: string[] };
export type SimulationState = {
  day: number; seed: number; scenarioVersion: ScenarioVersion; sectors: Record<Sector, SectorState>; resources: Resources;
  activeEffects: { id: string; remaining: number; sector: Sector; delta: number; label: string }[];
  cooldowns: Record<string, number>; eventLog: EventLog[]; chainHash: string; lastAction?: string;
};

export type ScenarioConfig = {
  version: ScenarioVersion;
  recoveryBias: number;
  disruptionBias: number;
  healthCap: number;
  capacityRetention: number;
  fuelBurn: number;
  creditIncome: number;
};

export const SCENARIOS: Record<ScenarioVersion, ScenarioConfig> = {
  "scenario-001.v1": { version: "scenario-001.v1", recoveryBias: 0.08, disruptionBias: -0.12, healthCap: 100, capacityRetention: 0.65, fuelBurn: 0.35, creditIncome: 1 },
  "scenario-001.v2": { version: "scenario-001.v2", recoveryBias: 0.035, disruptionBias: -0.2, healthCap: 91, capacityRetention: 0.52, fuelBurn: 0.52, creditIncome: 0.55 }
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const utf8Bytes = (value: string) => {
  const encoded = encodeURIComponent(value); const bytes: number[] = [];
  for (let index = 0; index < encoded.length; index++) { if (encoded[index] === "%") { bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16)); index += 2; } else bytes.push(encoded.charCodeAt(index)); }
  return Uint8Array.from(bytes);
};
const hash = (input: string) => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `fnv1a-${(h >>> 0).toString(16).padStart(8, "0")}`;
};

class SeededRandom {
  private value: number;
  constructor(seed: number) { this.value = seed >>> 0; }
  next() { this.value = (Math.imul(1664525, this.value) + 1013904223) >>> 0; return this.value / 4294967296; }
  range(min: number, max: number) { return min + (max - min) * this.next(); }
}

export const INTERVENTIONS: Intervention[] = [
  { id: "dispatch", name: "Manual dispatch", brief: "Replace autonomous routing with trained human dispatch cells.", cost: { crews: 8, influence: 3 }, cooldown: 7, sector: "logistics", tradeoff: "Immediate throughput, slower long-haul coordination.", eligibility: s => s.resources.crews >= 8 },
  { id: "freight", name: "Essential freight corridors", brief: "Reserve fuel and crews for medicine, food, and water lanes.", cost: { fuel: 12, crews: 4 }, cooldown: 5, sector: "logistics", tradeoff: "Protects essentials while commercial freight waits.", eligibility: s => s.resources.fuel >= 12 },
  { id: "staffing", name: "Hospital staffing surge", brief: "Move certified staff and volunteers into critical wards.", cost: { crews: 10, influence: 4 }, cooldown: 9, sector: "healthcare", tradeoff: "Stabilizes care, pulls people from other services.", eligibility: s => s.resources.crews >= 10 },
  { id: "comms", name: "Emergency communications", brief: "Stand up radio relays and local mesh networks.", cost: { credits: 9, fuel: 5 }, cooldown: 6, sector: "communications", tradeoff: "Raises coordination, requires sustained power.", eligibility: s => s.resources.credits >= 9 },
  { id: "cash", name: "Cash-payment fallback", brief: "Activate trusted local settlement and paper voucher rails.", cost: { credits: 14, influence: 5 }, cooldown: 10, sector: "finance", tradeoff: "Keeps essentials moving, increases reconciliation load.", eligibility: s => s.resources.credits >= 14 },
  { id: "triage", name: "Infrastructure triage", brief: "Prioritize a small set of substations and pumping nodes.", cost: { crews: 7, fuel: 8 }, cooldown: 8, sector: "energy", tradeoff: "Protects the grid core, leaves peripheral regions exposed.", eligibility: s => s.resources.crews >= 7 },
  { id: "fuel", name: "Fuel prioritization", brief: "Ring-fence reserves for hospitals, generators, and cold chains.", cost: { influence: 5 }, cooldown: 8, sector: "energy", tradeoff: "Improves resilience, visible limits on discretionary use.", eligibility: s => s.resources.influence >= 5 },
  { id: "training", name: "Human operator training", brief: "Compress years of operational knowledge into shift playbooks.", cost: { credits: 8, crews: 5 }, cooldown: 12, sector: "communications", tradeoff: "Slow investment with compounding coordination returns.", eligibility: s => s.resources.credits >= 8 && s.resources.crews >= 5 },
  { id: "research", name: "Restoration research", brief: "Map safe replacement pathways for high-dependency systems.", cost: { credits: 18, influence: 6 }, cooldown: 20, sector: "trust", tradeoff: "Consumes attention now, improves recovery later.", eligibility: s => s.resources.credits >= 18 },
  { id: "public", name: "Public communications", brief: "Publish plain-language situation reports and honest uncertainty.", cost: { influence: 4 }, cooldown: 6, sector: "trust", tradeoff: "Builds cooperation when consistent; credibility is fragile.", eligibility: s => s.resources.influence >= 4 },
  { id: "microgrid", name: "Community microgrids", brief: "Island critical facilities from unstable regional supply.", cost: { credits: 16, fuel: 10 }, cooldown: 14, sector: "energy", tradeoff: "Buys local resilience at the cost of central efficiency.", eligibility: s => s.resources.credits >= 16 && s.resources.fuel >= 10 },
  { id: "mutual", name: "Mutual-aid compact", brief: "Coordinate city networks around shared inventory and skills.", cost: { influence: 7, crews: 4 }, cooldown: 14, sector: "trust", tradeoff: "Unlocks cooperation, but needs visible reciprocity.", eligibility: s => s.resources.influence >= 7 }
];

export const EVENTS: Event[] = [
  { id: "grid-oscillation", title: "Grid frequency oscillation", body: "A control-room handoff leaves three balancing zones out of sync.", sector: "energy", severity: 2, dayMin: 2, condition: s => s.sectors.energy.health < 72 },
  { id: "cold-chain", title: "Cold-chain breach", body: "A regional refrigeration network loses automated monitoring.", sector: "healthcare", severity: 2, dayMin: 4, condition: s => s.sectors.logistics.health < 68 },
  { id: "dispatch-bottleneck", title: "Dispatch bottleneck", body: "Manual routing queues spill across two major ports.", sector: "logistics", severity: 1, dayMin: 3, condition: s => s.sectors.communications.health < 70 },
  { id: "settlement-lag", title: "Settlement lag", body: "Merchants pause deliveries while counterparties reconcile paper ledgers.", sector: "finance", severity: 1, dayMin: 5, condition: s => s.sectors.finance.health < 66 },
  { id: "rumor-cycle", title: "Rumor cycle", body: "Conflicting local notices create a fast-moving trust deficit.", sector: "trust", severity: 2, dayMin: 6, condition: s => s.sectors.trust.health < 71 },
  { id: "hospital-surge", title: "Hospital surge", body: "Staffing gaps and delayed supplies push two hospitals into diversion.", sector: "healthcare", severity: 3, dayMin: 10, condition: s => s.sectors.healthcare.health < 62 },
  { id: "fuel-theft", title: "Fuel diversion", body: "Untracked depot transfers reduce reserve confidence.", sector: "energy", severity: 2, dayMin: 12, condition: s => s.resources.fuel < 42 },
  { id: "radio-relay", title: "Radio relay failure", body: "A mountain relay drops during a weather window.", sector: "communications", severity: 2, dayMin: 14, condition: s => s.sectors.communications.health < 65 },
  { id: "food-price", title: "Food price shock", body: "Last-mile shortages reach public markets.", sector: "finance", severity: 2, dayMin: 18, condition: s => s.sectors.logistics.health < 60 },
  { id: "volunteer-wave", title: "Volunteer wave", body: "Neighborhood networks offer skilled hands if coordination holds.", sector: "trust", severity: -1, dayMin: 20, condition: s => s.sectors.trust.health > 64 },
  { id: "substation-fire", title: "Substation fire", body: "A protective shutdown leaves an industrial corridor dark.", sector: "energy", severity: 3, dayMin: 28, condition: s => s.sectors.energy.health < 64 },
  { id: "clinical-protocol", title: "Clinical protocol drift", body: "Teams diverge on substitute procedures and documentation.", sector: "healthcare", severity: 2, dayMin: 32, condition: s => s.sectors.communications.health < 62 },
  { id: "port-congestion", title: "Port congestion", body: "Containers queue without trusted prioritization signals.", sector: "logistics", severity: 2, dayMin: 38, condition: s => s.sectors.logistics.health < 64 },
  { id: "bank-holiday", title: "Emergency bank holiday", body: "Settlement institutions pause to reconcile regional balances.", sector: "finance", severity: 2, dayMin: 45, condition: s => s.sectors.finance.health < 60 },
  { id: "civic-assembly", title: "Civic assembly", body: "Local leaders ask for a transparent weekly operating picture.", sector: "trust", severity: -1, dayMin: 55, condition: s => s.sectors.trust.health > 58 },
  { id: "maintenance-debt", title: "Maintenance debt", body: "Deferred inspections begin to surface in aging infrastructure.", sector: "energy", severity: 2, dayMin: 72, condition: s => s.sectors.energy.health < 70 },
  { id: "supply-substitute", title: "Supply substitution", body: "Domestic manufacturers begin producing simple medical consumables.", sector: "healthcare", severity: -1, dayMin: 90, condition: s => s.sectors.logistics.health > 58 },
  { id: "ledger-network", title: "Ledger network", body: "Cooperative registries restore a measure of payment confidence.", sector: "finance", severity: -1, dayMin: 110, condition: s => s.sectors.trust.health > 60 },
  { id: "operator-cohort", title: "Operator cohort", body: "A second wave of human operators completes accelerated training.", sector: "communications", severity: -1, dayMin: 140, condition: s => s.sectors.communications.health > 58 },
  { id: "regional-compact", title: "Regional compact", body: "Neighboring regions publish a shared inventory protocol.", sector: "logistics", severity: -1, dayMin: 180, condition: s => s.sectors.trust.health > 62 },
  { id: "adaptation-window", title: "Adaptation window", body: "The system starts rewarding deliberate, lower-throughput routines.", sector: "trust", severity: -1, dayMin: 240, condition: s => s.sectors.trust.health > 55 }
];

const defaultScores: Record<Sector, number> = { energy: 74, healthcare: 69, logistics: 66, finance: 72, communications: 61, trust: 58 };

export function initialState(seed = 104729, scenarioVersion: ScenarioVersion = "scenario-001.v2"): SimulationState {
  const sectors = Object.fromEntries(SECTORS.map(sector => [sector, { health: defaultScores[sector], capacity: defaultScores[sector] + 12, trend: 0, factors: [{ label: "Baseline readiness", delta: 0, kind: "baseline" as const }] }])) as Record<Sector, SectorState>;
  return { day: 0, seed, scenarioVersion, sectors, resources: { credits: 100, crews: 64, fuel: 88, influence: 52 }, activeEffects: [], cooldowns: {}, eventLog: [], chainHash: hash(`${scenarioVersion}|${seed}|day-0`), lastAction: undefined };
}

export function getAvailableInterventions(state: SimulationState) {
  return INTERVENTIONS.filter(i => (state.cooldowns[i.id] ?? 0) === 0 && i.eligibility(state));
}

export function applyIntervention(state: SimulationState, interventionId: string): SimulationState {
  const intervention = INTERVENTIONS.find(i => i.id === interventionId);
  if (!intervention || (state.cooldowns[interventionId] ?? 0) > 0 || !intervention.eligibility(state)) return state;
  const resources = { ...state.resources };
  for (const [key, value] of Object.entries(intervention.cost) as [keyof Resources, number][]) resources[key] -= value;
  const activeEffects = [...state.activeEffects, { id: `${intervention.id}-${state.day}`, remaining: 10, sector: intervention.sector, delta: state.scenarioVersion === "scenario-001.v2" ? 1.8 : 2.2, label: intervention.name }];
  if (state.scenarioVersion === "scenario-001.v2") {
    const opportunityCosts: Record<string, { sector: Sector; delta: number; label: string }> = {
      dispatch: { sector: "communications", delta: -0.7, label: "Dispatch attention diverted" },
      freight: { sector: "finance", delta: -0.5, label: "Commercial freight deferred" },
      staffing: { sector: "logistics", delta: -0.6, label: "Staff rotation pulled from supply" },
      comms: { sector: "energy", delta: -0.4, label: "Relay power draw" },
      cash: { sector: "trust", delta: -0.35, label: "Reconciliation burden" },
      triage: { sector: "logistics", delta: -0.55, label: "Peripheral infrastructure deferred" },
      fuel: { sector: "finance", delta: -0.4, label: "Discretionary use constrained" },
      training: { sector: "logistics", delta: -0.25, label: "Operators leave active shifts" },
      research: { sector: "communications", delta: -0.25, label: "Research bandwidth diverted" },
      public: { sector: "finance", delta: -0.25, label: "Public information overhead" },
      microgrid: { sector: "finance", delta: -0.45, label: "Local redundancy cost" },
      mutual: { sector: "energy", delta: -0.3, label: "Compact coordination overhead" }
    };
    const cost = opportunityCosts[intervention.id];
    if (cost) activeEffects.push({ id: `${intervention.id}-tradeoff-${state.day}`, remaining: 6, sector: cost.sector, delta: cost.delta, label: cost.label });
  }
  return { ...state, resources, activeEffects, cooldowns: { ...state.cooldowns, [intervention.id]: intervention.cooldown }, lastAction: intervention.id };
}

export function step(state: SimulationState): SimulationState {
  const nextDay = state.day + 1;
  const config = SCENARIOS[state.scenarioVersion];
  const rng = new SeededRandom(state.seed + nextDay * 7919);
  const prior = state.sectors;
  const event = EVENTS.find(candidate => candidate.dayMin <= nextDay && !state.eventLog.some(log => log.eventId === candidate.id) && (!candidate.condition || candidate.condition(state)) && rng.next() > 0.48);
  const effects = state.activeEffects.map(effect => ({ ...effect, remaining: effect.remaining - 1 })).filter(effect => effect.remaining > 0);
  const nextSectors = {} as Record<Sector, SectorState>;
  const dependencies: Record<Sector, Partial<Record<Sector, number>>> = {
    energy: {}, healthcare: { energy: 0.05, logistics: 0.04 }, logistics: { energy: 0.05, communications: 0.04, finance: 0.03 }, finance: { communications: 0.05, logistics: 0.03 }, communications: { energy: 0.08, finance: 0.02 }, trust: { healthcare: 0.02, communications: 0.05, finance: 0.03 }
  };
  for (const sector of SECTORS) {
    const factors: Factor[] = [];
    let delta = config.recoveryBias;
    const phase = state.scenarioVersion === "scenario-001.v1" ? (nextDay < 45 ? -0.12 : nextDay < 150 ? 0.03 : 0.12) : (nextDay < 45 ? config.disruptionBias : nextDay < 150 ? 0.01 : 0.045);
    delta += phase;
    factors.push({ label: nextDay < 45 ? "Disruption phase" : nextDay < 150 ? "Stabilization phase" : "Adaptation phase", delta: round(phase), kind: "baseline" });
    for (const [dependency, weight] of Object.entries(dependencies[sector])) {
      const dependencyDelta = ((prior[dependency as Sector].health - 62) * (weight ?? 0)) / 4;
      delta += dependencyDelta;
      factors.push({ label: `${dependency} dependency`, delta: round(dependencyDelta), kind: "dependency" });
    }
    for (const effect of effects.filter(effect => effect.sector === sector)) { delta += effect.delta / 10; factors.push({ label: effect.label, delta: round(effect.delta / 10), kind: "action" }); }
    if (event?.sector === sector) { delta -= event.severity * 1.4; factors.push({ label: event.title, delta: round(-event.severity * 1.4), kind: "event" }); }
    const noise = rng.range(-0.24, 0.24);
    delta += noise;
    factors.push({ label: "Uncertainty band", delta: round(noise), kind: "baseline" });
    const capacityDamage = state.scenarioVersion === "scenario-001.v2" && delta < 0 ? 0.12 : 0;
    const capacity = clamp(prior[sector].capacity + delta * config.capacityRetention - capacityDamage);
    const recoveryCeiling = state.scenarioVersion === "scenario-001.v2" ? Math.min(config.healthCap, capacity + 5) : config.healthCap;
    const health = clamp(Math.min(recoveryCeiling, prior[sector].health + delta));
    nextSectors[sector] = { health: round(health), capacity: round(capacity), trend: round(health - prior[sector].health), factors: factors.filter(f => Math.abs(f.delta) >= 0.01) };
  }
  const resources = { credits: Math.max(0, state.scenarioVersion === "scenario-001.v1" ? state.resources.credits + (nextDay % 7 === 0 ? 4 : 1) : state.resources.credits + config.creditIncome), crews: Math.max(0, state.resources.crews + (nextDay % 10 === 0 ? 1 : 0) - (state.scenarioVersion === "scenario-001.v2" ? 0.08 : 0)), fuel: Math.max(0, state.resources.fuel - config.fuelBurn + (nextDay % 14 === 0 ? (state.scenarioVersion === "scenario-001.v2" ? 3 : 5) : 0)), influence: clamp(state.resources.influence + (state.scenarioVersion === "scenario-001.v1" ? (nextSectors.trust.health > 65 ? 0.25 : -0.1) : (nextSectors.trust.health > 65 ? 0.2 : -0.15)), 0, 100) };
  const eventLog = event ? [...state.eventLog, { day: nextDay, eventId: event.id, title: event.title, severity: event.severity, causes: event.sector === "trust" ? ["coordination lag", "public uncertainty"] : ["dependency pressure", "manual substitution"], hash: hash(`${state.chainHash}|${nextDay}|${event.id}`) }] : state.eventLog;
  const cooldowns = Object.fromEntries(Object.entries(state.cooldowns).map(([key, value]) => [key, Math.max(0, value - 1)]));
  return { ...state, day: nextDay, sectors: nextSectors, resources, activeEffects: effects, cooldowns, eventLog, chainHash: hash(`${state.chainHash}|${nextDay}|${event?.id ?? "quiet"}|${JSON.stringify(resources)}`) };
}

export function runToDay(state: SimulationState, targetDay: number) { let current = state; while (current.day < targetDay) current = step(current); return current; }

export function outcome(state: SimulationState) {
  const average = SECTORS.reduce((sum, sector) => sum + state.sectors[sector].health, 0) / SECTORS.length;
  const minimum = Math.min(...SECTORS.map(sector => state.sectors[sector].health));
  const stability = average >= 72 && minimum >= 52 && state.resources.fuel >= 18 ? "ADAPTIVE CONTINUITY" : average >= 54 && minimum >= 34 ? "FRAGILE CONTINUITY" : "SYSTEMIC STRAIN";
  return { average: round(average), minimum: round(minimum), stability, events: state.eventLog.length, chainHash: state.chainHash };
}

export type TransitionRecord = {
  day: number;
  stateHash: string;
  actionId?: string;
  eventIds: string[];
  state: SimulationState;
};

export type RunBranch = {
  id: string;
  parentId?: string;
  forkDay: number;
  state: SimulationState;
  history: TransitionRecord[];
  actions: string[];
};

const snapshot = (state: SimulationState, actionId?: string): TransitionRecord => ({
  day: state.day,
  stateHash: state.chainHash,
  actionId,
  eventIds: state.eventLog.map(event => event.eventId),
  state: clone(state)
});

export function createRunBranch(seed = 104729, id = "origin"): RunBranch {
  const state = initialState(seed);
  return { id, forkDay: 0, state, history: [snapshot(state)], actions: [] };
}

export function advanceBranch(branch: RunBranch, actionId?: string): RunBranch {
  const actionState = actionId ? applyIntervention(branch.state, actionId) : branch.state;
  const next = step(actionState);
  return { ...branch, state: next, history: [...branch.history, snapshot(next, actionId)], actions: actionId ? [...branch.actions, actionId] : branch.actions };
}

export function recordBranchState(branch: RunBranch, state: SimulationState, actionId?: string): RunBranch {
  return { ...branch, state, history: [...branch.history, snapshot(state, actionId)], actions: actionId ? [...branch.actions, actionId] : branch.actions };
}

export type SimulationCommand =
  | { type: "intervention"; interventionId: string }
  | { type: "advance"; actionId?: string };

export function executeSimulationCommand(branch: RunBranch, command: SimulationCommand): RunBranch {
  if (command.type === "advance") return advanceBranch(branch, command.actionId);
  const next = applyIntervention(branch.state, command.interventionId);
  return next === branch.state ? branch : recordBranchState(branch, next, command.interventionId);
}

export function forkBranch(parent: RunBranch, forkDay = parent.state.day, id = `${parent.id}.fork-${forkDay}`): RunBranch {
  const checkpoint = parent.history.find(record => record.day === forkDay) ?? parent.history[parent.history.length - 1];
  return { id, parentId: parent.id, forkDay: checkpoint.day, state: clone(checkpoint.state), history: parent.history.filter(record => record.day <= checkpoint.day).map(record => clone(record)), actions: parent.actions.slice(0, checkpoint.day) };
}

export function compareBranches(left: RunBranch, right: RunBranch) {
  const sharedLength = Math.min(left.history.length, right.history.length);
  const sharedDifference = Array.from({ length: sharedLength }, (_, index) => index).find(index => left.history[index].stateHash !== right.history[index].stateHash);
  const firstDifferent = sharedDifference ?? (left.history.length === right.history.length ? -1 : sharedLength);
  const sectors = Object.fromEntries(SECTORS.map(sector => [sector, round(right.state.sectors[sector].health - left.state.sectors[sector].health)])) as Record<Sector, number>;
  const resources = Object.fromEntries(Object.keys(left.state.resources).map(key => [key, round((right.state.resources as Record<string, number>)[key] - (left.state.resources as Record<string, number>)[key])])) as Record<keyof Resources, number>;
  const changedSectors = SECTORS.filter(sector => Math.abs(sectors[sector]) >= 0.1);
  const resourceKeys = Object.keys(resources) as (keyof Resources)[];
  const changedResources = resourceKeys.filter(resource => Math.abs(resources[resource]) >= 0.1);
  const actionDelta = right.actions.slice(left.actions.length);
  return {
    divergenceDay: firstDifferent < 0 ? undefined : (left.history[firstDifferent]?.day ?? right.history[firstDifferent]?.day),
    impactDay: changedSectors.length || changedResources.length || actionDelta.length ? (firstDifferent < 0 ? undefined : (left.history[firstDifferent]?.day ?? right.history[firstDifferent]?.day)) : undefined,
    sectors,
    resources,
    changedSectors,
    changedResources,
    actionDelta,
    eventDelta: right.state.eventLog.length - left.state.eventLog.length,
    causes: actionDelta.map(actionId => INTERVENTIONS.find(intervention => intervention.id === actionId)?.name ?? actionId)
  };
}

export type DecisionReview = {
  actionId: string;
  name: string;
  day: number;
  sector: Sector;
  targetSectorDelta: number;
};

export type RunSummary = {
  final: ReturnType<typeof outcome>;
  resources: Resources;
  sectors: { sector: Sector; health: number; capacity: number; trend: number }[];
  interventions: { id: string; name: string; sector: Sector; count: number }[];
  crises: EventLog[];
  milestones: { day: number; stateHash: string; label: string }[];
  decisions: DecisionReview[];
  strongestDecision?: DecisionReview;
  weakestDecision?: DecisionReview;
};

export function summarizeRun(branch: RunBranch): RunSummary {
  const decisions: DecisionReview[] = [];
  for (let index = 1; index < branch.history.length; index++) {
    const record = branch.history[index];
    if (!record.actionId) continue;
    const intervention = INTERVENTIONS.find(candidate => candidate.id === record.actionId);
    const before = branch.history[index - 1]?.state;
    if (!intervention || !before) continue;
    decisions.push({
      actionId: intervention.id,
      name: intervention.name,
      day: record.day,
      sector: intervention.sector,
      targetSectorDelta: round(record.state.sectors[intervention.sector].health - before.sectors[intervention.sector].health)
    });
  }
  const actionCounts = new Map<string, number>();
  for (const actionId of branch.actions) actionCounts.set(actionId, (actionCounts.get(actionId) ?? 0) + 1);
  const interventions = [...actionCounts.entries()].map(([id, count]) => {
    const intervention = INTERVENTIONS.find(candidate => candidate.id === id)!;
    return { id, name: intervention.name, sector: intervention.sector, count };
  });
  const milestoneDays = [0, 30, 60, 90, 180, 365];
  const milestones = milestoneDays.map(day => {
    const record = [...branch.history].reverse().find(candidate => candidate.day <= day) ?? branch.history[0];
    return { day: record.day, stateHash: record.stateHash, label: day === 0 ? "ORIGIN" : day === 365 ? "YEAR COMPLETE" : `DAY ${day}` };
  });
  return {
    final: outcome(branch.state),
    resources: { ...branch.state.resources },
    sectors: SECTORS.map(sector => ({ sector, health: branch.state.sectors[sector].health, capacity: branch.state.sectors[sector].capacity, trend: branch.state.sectors[sector].trend })),
    interventions,
    crises: branch.state.eventLog.filter(event => event.severity >= 2).sort((a, b) => b.severity - a.severity || a.day - b.day).slice(0, 8),
    milestones,
    decisions,
    strongestDecision: decisions.length ? [...decisions].sort((a, b) => b.targetSectorDelta - a.targetSectorDelta)[0] : undefined,
    weakestDecision: decisions.length ? [...decisions].sort((a, b) => a.targetSectorDelta - b.targetSectorDelta)[0] : undefined
  };
}

export type PolicyName = "no-action" | "random-action" | "targeted-action";
export const FIXED_SEED_SUITE = [104729, 271828, 314159, 161803] as const;

export function simulatePolicy(seed: number, policy: PolicyName, scenarioVersion: ScenarioVersion = "scenario-001.v2") {
  let state = initialState(seed, scenarioVersion);
  const rng = new SeededRandom(seed ^ 0x9e3779b9);
  for (let day = 0; day < 365; day++) {
    const available = getAvailableInterventions(state);
    let chosen: Intervention | undefined;
    if (policy === "random-action" && available.length) chosen = available[Math.floor(rng.next() * available.length)];
    if (policy === "targeted-action" && available.length) {
      const lowest = [...SECTORS].sort((a, b) => state.sectors[a].health - state.sectors[b].health)[0];
      chosen = available.find(intervention => intervention.sector === lowest) ?? available[0];
    }
    if (chosen) state = applyIntervention(state, chosen.id);
    state = step(state);
  }
  return state;
}

export function evaluateSeedSuite(scenarioVersion: ScenarioVersion = "scenario-001.v2") {
  return FIXED_SEED_SUITE.flatMap(seed => (["no-action", "random-action", "targeted-action"] as PolicyName[]).map(policy => {
    const state = simulatePolicy(seed, policy, scenarioVersion);
    return { seed, policy, outcome: outcome(state), state };
  }));
}

export type CouncilRecommendation = { adviserId: string; role: string; objective: string; interventionId?: string; rationale: string; uncertainty: number };
const councilProfiles = [
  { adviserId: "mara", role: "Infrastructure strategist", objective: "maximize energy and logistics continuity", sectors: ["energy", "logistics"] as Sector[] },
  { adviserId: "ilya", role: "Medical continuity specialist", objective: "protect care capacity and cold-chain access", sectors: ["healthcare", "logistics"] as Sector[] },
  { adviserId: "tomas", role: "Economic systems analyst", objective: "preserve settlement and procurement", sectors: ["finance", "communications"] as Sector[] },
  { adviserId: "nadiya", role: "Social resilience researcher", objective: "maintain cooperation under uncertainty", sectors: ["trust", "communications"] as Sector[] },
  { adviserId: "auditor", role: "Skeptical systems auditor", objective: "surface the weakest modeled dependency", sectors: [...SECTORS] as Sector[] }
];

export function getCouncilRecommendations(state: SimulationState): CouncilRecommendation[] {
  const available = getAvailableInterventions(state);
  return councilProfiles.map(profile => {
    const focusSector = [...profile.sectors].sort((a, b) => state.sectors[a].health - state.sectors[b].health)[0];
    const intervention = available.find(candidate => candidate.sector === focusSector);
    const uncertainty = round(Math.min(0.95, 0.34 + Math.abs(state.sectors[focusSector].trend) * 0.12 + (state.day < 20 ? 0.12 : 0)));
    return { adviserId: profile.adviserId, role: profile.role, objective: profile.objective, interventionId: intervention?.id, rationale: intervention ? `Recorded state shows ${focusSector} as the weakest focus in this adviser objective; ${intervention.name} is eligible with modeled trade-offs.` : `No eligible lever is available for ${focusSector}; preserve optionality and inspect the dependency chain.`, uncertainty };
  });
}

export type PortableRunPackage = {
  schemaVersion: "run-package.v1";
  branchId: string;
  parentId?: string;
  forkDay: number;
  seed: number;
  scenarioVersion: ScenarioVersion;
  actions: string[];
  checkpoints: TransitionRecord[];
  integrity: { algorithm: "SHA-256"; hash: string };
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

export function canonicalSerialize(value: unknown) { return JSON.stringify(canonicalize(value)); }

export async function sha256Hex(value: string) {
  const { sha256 } = await import("@noble/hashes/sha2.js");
  const bytes = sha256(utf8Bytes(value));
  return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function exportRunPackage(branch: RunBranch) {
  const payload = { schemaVersion: "run-package.v1" as const, branchId: branch.id, ...(branch.parentId ? { parentId: branch.parentId } : {}), forkDay: branch.forkDay, seed: branch.state.seed, scenarioVersion: branch.state.scenarioVersion, actions: branch.actions, checkpoints: branch.history };
  const integrity = await sha256Hex(canonicalSerialize(payload));
  return JSON.stringify({ ...payload, integrity: { algorithm: "SHA-256" as const, hash: integrity } });
}

export async function importRunPackage(serialized: string): Promise<RunBranch> {
  if (serialized.length > 2_000_000) throw new Error("Run package exceeds the 2 MB safety limit");
  let parsed: Partial<PortableRunPackage>;
  try { parsed = JSON.parse(serialized) as Partial<PortableRunPackage>; } catch { throw new Error("Run package is not valid JSON"); }
  if (parsed.schemaVersion !== "run-package.v1" || !parsed.integrity || parsed.integrity.algorithm !== "SHA-256" || !parsed.checkpoints?.length || typeof parsed.seed !== "number" || !SCENARIO_VERSIONS.includes(parsed.scenarioVersion as ScenarioVersion)) throw new Error("Run package schema is invalid");
  const { integrity, ...payload } = parsed;
  if (await sha256Hex(canonicalSerialize(payload)) !== integrity.hash) throw new Error("Run package integrity check failed");
  const checkpoints = parsed.checkpoints;
  if (checkpoints[0].day !== 0 || checkpoints.some(record => record.state.seed !== parsed.seed || record.state.scenarioVersion !== parsed.scenarioVersion)) throw new Error("Run package checkpoint lineage is invalid");
  let replay = initialState(parsed.seed, parsed.scenarioVersion as ScenarioVersion);
  for (let index = 1; index < checkpoints.length; index++) {
    const previous = checkpoints[index - 1]; const current = checkpoints[index];
    if (current.day === previous.day) replay = current.actionId ? applyIntervention(replay, current.actionId) : replay;
    else { if (current.actionId) replay = applyIntervention(replay, current.actionId); replay = step(replay); }
    if (replay.chainHash !== current.stateHash) throw new Error(`Replay divergence at day ${current.day}`);
  }
  return { id: parsed.branchId!, parentId: parsed.parentId, forkDay: parsed.forkDay!, state: clone(checkpoints[checkpoints.length - 1].state), history: clone(checkpoints), actions: [...(parsed.actions ?? [])] };
}
