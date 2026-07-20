// ── PendingValue ─ the engineering-data placeholder ─────────────────────────
// THE RULE: A SURFACE NEVER RENDERS A VALUE THE PIPELINE DID NOT PRODUCE.
// Engineering values do not exist yet — the TolerancePack is unwritten. Every
// field carrying a dimension, tolerance, stress, deflection, load, margin, or
// check result is typed `PendingValue` and NOTHING ELSE — not `| number`, not
// `string`. A numeric literal in such a field is a compile error by design.
export type PendingValue = '<<dim>>' | '<<tol - pending>>' | '<<check - pending>>'

// ── THE BOUNDARY ────────────────────────────────────────────────────────────
// Operational values are REAL, are NOT engineering values, and MUST be plain
// numbers because S5 exists to render them: cost (USD), elapsed seconds, run
// count, cycle N of M, subtask count, timestamps (epoch ms), percent-complete
// (estimated). Typing any of these as PendingValue would break S5. The two
// categories stay strictly separate: numbers below this line, PendingValue above.

export interface Check {
  label: string; // operational metadata — the name of the check (real)
  result: PendingValue; // engineering outcome — pending
}

export interface Assumption {
  label: string; // operational metadata — what is assumed (real)
  value: PendingValue; // engineering value — pending
}

// OPEN — Phase 2 reconciliation. ll-cockpit CadRunClient.tsx today ships four
// states: converged | running | exhausted | failed. 'exhausted' is a RESOURCE
// outcome (solver ran out of cycles). 'infeasible' is an ENGINEERING ANSWER
// (no design satisfies this duty; a named constraint binds). They are not
// synonyms. 'pending' does not exist upstream at all. Do not collapse these.
export type RunStatus =
  | 'pending'
  | 'running'
  | 'converged'
  | 'infeasible'
  | 'failed';

export interface DesignRun {
  id: string;
  label: string;
  status: RunStatus;
  // ── operational (real numbers) ──
  cost: number; // USD
  elapsed: number; // seconds
  runCount: number;
  cycle: number; // current cycle N …
  maxCycles: number; // … of M
  subtasks: number;
  percentComplete: number; // estimated, 0..100
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  // Named blocking constraint when status === 'infeasible': human prose naming
  // the governing limit. A plain string label, NOT a pipeline-produced value.
  blockingConstraint: string | null;
  // ── engineering (PendingValue only) ──
  dimension: PendingValue;
  tolerance: PendingValue;
  stress: PendingValue;
  margin: PendingValue;
  checks: Check[];
  assumptions: Assumption[];
}

export interface Job {
  id: string;
  name: string;
  runs: DesignRun[];
}
