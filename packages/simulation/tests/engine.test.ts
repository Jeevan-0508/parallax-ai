import { describe, expect, it } from "vitest";
import { advanceBranch, applyIntervention, compareBranches, createRunBranch, evaluateSeedSuite, exportRunPackage, forkBranch, getCouncilRecommendations, importRunPackage, initialState, outcome, runToDay, step, summarizeRun } from "../src";

describe("parallax deterministic engine", () => {
  it("replays the same seed identically", () => {
    expect(runToDay(initialState(7), 365)).toEqual(runToDay(initialState(7), 365));
  });
  it("keeps scores and resources bounded", () => {
    const final = runToDay(initialState(12), 365);
    for (const sector of Object.values(final.sectors)) expect(sector.health).toBeGreaterThanOrEqual(0);
    expect(final.resources.fuel).toBeGreaterThanOrEqual(0);
  });
  it("records a traceable intervention and advances", () => {
    const afterAction = applyIntervention(initialState(), "dispatch");
    expect(afterAction.lastAction).toBe("dispatch");
    expect(step(afterAction).day).toBe(1);
  });
  it("forks immutable checkpoints and isolates child actions", () => {
    let parent = createRunBranch(42);
    parent = advanceBranch(parent);
    parent = advanceBranch(parent, "dispatch");
    const child = advanceBranch(forkBranch(parent, 1, "child"), "fuel");
    expect(parent.id).toBe("origin");
    expect(parent.state.day).toBe(2);
    expect(child.parentId).toBe("origin");
    expect(child.state.day).toBe(2);
    expect(child.actions).toEqual(["dispatch", "fuel"]);
    expect(child.state.resources.influence).toBeLessThan(parent.state.resources.influence);
    expect(compareBranches(parent, child).divergenceDay).toBe(2);
  });
  it("preserves the v1 replay path while v2 constrains recovery", () => {
    const v1 = runToDay(initialState(104729, "scenario-001.v1"), 365);
    const v2 = runToDay(initialState(104729, "scenario-001.v2"), 365);
    expect(v1.scenarioVersion).toBe("scenario-001.v1");
    expect(v2.scenarioVersion).toBe("scenario-001.v2");
    expect(Math.max(...Object.values(v2.sectors).map(sector => sector.health))).toBeLessThanOrEqual(91);
    expect(outcome(v2).average).not.toBe(100);
  });
  it("produces policy variation across the fixed seed suite", () => {
    const results = evaluateSeedSuite("scenario-001.v2");
    const noAction = results.filter(result => result.policy === "no-action").map(result => result.outcome.average);
    const targeted = results.filter(result => result.policy === "targeted-action").map(result => result.outcome.average);
    expect(new Set(noAction).size).toBeGreaterThan(1);
    expect(new Set(targeted).size).toBeGreaterThan(1);
    expect(results).toHaveLength(12);
  });
  it("exports, verifies, and replays a portable branch package", async () => {
    let branch = createRunBranch(77, "qa-origin");
    branch = advanceBranch(branch);
    branch = { ...branch, state: applyIntervention(branch.state, "fuel") };
    branch = { ...branch, history: [...branch.history, { day: branch.state.day, stateHash: branch.state.chainHash, actionId: "fuel", eventIds: branch.state.eventLog.map(event => event.eventId), state: structuredClone(branch.state) }], actions: [...branch.actions, "fuel"] };
    branch = advanceBranch(branch);
    const serialized = await exportRunPackage(branch);
    const restored = await importRunPackage(serialized);
    expect(restored.state.chainHash).toBe(branch.state.chainHash);
    await expect(importRunPackage(serialized.replace("fuel", "cash"))).rejects.toThrow(/integrity/i);
  });
  it("keeps offline council recommendations state-derived", () => {
    const recommendations = getCouncilRecommendations(initialState(3, "scenario-001.v2"));
    expect(recommendations).toHaveLength(5);
    expect(recommendations.every(recommendation => recommendation.objective && recommendation.rationale)).toBe(true);
  });
  it("keeps council recommendations advisory and produces a reproducible branch difference", () => {
    const origin = createRunBranch(104729);
    const checkpoint = advanceBranch(advanceBranch(origin), "dispatch");
    const councilStateBefore = structuredClone(checkpoint.state);
    const child = advanceBranch(forkBranch(checkpoint, checkpoint.state.day, "child"), "fuel");
    expect(checkpoint.state).toEqual(councilStateBefore);
    const comparison = compareBranches(checkpoint, child);
    expect(comparison.divergenceDay).toBe(3);
    expect(comparison.impactDay).toBe(3);
    expect(comparison.changedResources).toContain("influence");
    expect(comparison.causes).toContain("Fuel prioritization");
  });
  it("summarizes the complete run without inventing causal certainty", () => {
    let branch = createRunBranch(104729);
    for (let day = 0; day < 365; day++) branch = advanceBranch(branch, day === 0 ? "fuel" : undefined);
    const summary = summarizeRun(branch);
    expect(summary.sectors).toHaveLength(6);
    expect(summary.milestones.map(milestone => milestone.label)).toEqual(["ORIGIN", "DAY 30", "DAY 60", "DAY 90", "DAY 180", "YEAR COMPLETE"]);
    expect(summary.strongestDecision?.actionId).toBe("fuel");
  });
});
