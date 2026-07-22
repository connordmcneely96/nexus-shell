// Scripted run timeline for the running CAD mission (Bearing housing). EVERY
// frame is authored — zero Math.random, zero Date-derived variation. Progress
// (cycles, agent states) may be shown; a dimension, tolerance, or check result
// is NEVER scripted, estimated, simulated, or shown as "likely" here.

export interface TimelineStep {
  atSec: number; // offset from run start
  cycle?: number; // advances CYCLE n/20
  agentStates?: Record<string, "done" | "running" | "waiting">;
  activity?: { t: string; text: string };
}

export const BASE_CYCLE = 3;

// ~8 authored steps, cycles 3→6. MODELER finishes, CAD-REVIEWER enters
// running, then the next cycle begins. The final step parks the run still
// 'running' — S5 does not invent a convergence.
export const RUN_TIMELINE: TimelineStep[] = [
  { atSec: 15, cycle: 3, agentStates: { MODELER: "done", "CAD-REVIEWER": "running" }, activity: { t: "+15s", text: "MODELER completed geometry for cycle 3" } },
  { atSec: 30, cycle: 3, agentStates: { "CAD-REVIEWER": "done" }, activity: { t: "+30s", text: "CAD-REVIEWER cleared cycle 3 geometry" } },
  { atSec: 45, cycle: 4, agentStates: { MODELER: "running", "CAD-REVIEWER": "waiting" }, activity: { t: "+45s", text: "MODELER started cycle 4" } },
  { atSec: 60, cycle: 4, agentStates: { MODELER: "done", "CAD-REVIEWER": "running" }, activity: { t: "+60s", text: "CAD-REVIEWER reviewing cycle 4" } },
  { atSec: 75, cycle: 5, agentStates: { MODELER: "running", "CAD-REVIEWER": "waiting" }, activity: { t: "+75s", text: "MODELER started cycle 5" } },
  { atSec: 90, cycle: 5, agentStates: { MODELER: "done", "CAD-REVIEWER": "running" }, activity: { t: "+90s", text: "CAD-REVIEWER reviewing cycle 5" } },
  { atSec: 105, cycle: 6, agentStates: { MODELER: "running", "CAD-REVIEWER": "waiting" }, activity: { t: "+105s", text: "MODELER started cycle 6" } },
  { atSec: 120, cycle: 6, agentStates: { SENTINEL: "running" }, activity: { t: "+120s", text: "SENTINEL began compliance pass" } },
];

export interface ScriptedState {
  cycle: number;
  agentStates: Record<string, "done" | "running" | "waiting">;
  firedActivity: { t: string; text: string }[];
}

// Pure function of elapsed — the determinism guarantee. Accumulates every step
// whose atSec has passed. RUN_TIMELINE is authored in ascending atSec order.
export function stateAt(elapsed: number): ScriptedState {
  let cycle = BASE_CYCLE;
  const agentStates: Record<string, "done" | "running" | "waiting"> = {};
  const firedActivity: { t: string; text: string }[] = [];
  for (const step of RUN_TIMELINE) {
    if (step.atSec > elapsed) break;
    if (step.cycle !== undefined) cycle = step.cycle;
    if (step.agentStates) Object.assign(agentStates, step.agentStates);
    if (step.activity) firedActivity.push(step.activity);
  }
  return { cycle, agentStates, firedActivity };
}
