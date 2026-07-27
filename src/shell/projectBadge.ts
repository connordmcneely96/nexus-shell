import type { BadgeState } from "./contract";

// The frozen-contract §3 projection — the SHARED authority for turning a
// (run, design) pair into the badge the UI shows. Lane 2 (ll-cockpit
// CadRunClient) and Lane 6 (CAD adapter) mirror this exact table; keeping it in
// one pure function is what prevents the three lanes from drifting apart.
//
// Monotone in trust: the badge is NEVER greener than the design truth. A run
// that reports 'converged' but whose design is ungrounded (or absent) projects
// to 'pending', not 'converged' — you cannot show a green answer the design
// layer has not actually grounded.

export type RunStatus =
  | "pending"
  | "running"
  | "converged"
  | "exhausted"
  | "failed"
  | "infeasible";

export type DesignStatus = "converged" | "infeasible" | "solver_error" | "ungrounded" | null;

export function projectBadge(run: RunStatus, design: DesignStatus): BadgeState {
  if (run === "converged" && design === "converged") return "converged";
  if (run === "converged" && (design === "ungrounded" || design === null)) return "pending"; // never green
  if (run === "infeasible") return "infeasible";
  if (run === "exhausted") return "exhausted";
  if (run === "running") return "running";
  if (run === "failed" || design === "solver_error") return "failed";
  return "pending";
}
