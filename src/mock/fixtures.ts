import type { Job, DesignRun } from "./types";

// Engineering block shared by every run — every value is a PendingValue.
// S1 has no pipeline, so these are placeholders and are never rendered as data.
const ENG: Pick<
  DesignRun,
  "dimension" | "tolerance" | "stress" | "margin" | "checks" | "assumptions"
> = {
  dimension: "<<dim>>",
  tolerance: "<<tol - pending>>",
  stress: "<<dim>>",
  margin: "<<check - pending>>",
  checks: [{ label: "stress within allowable", result: "<<check - pending>>" }],
  assumptions: [{ label: "material modulus E", value: "<<dim>>" }],
};

type Ops = Pick<
  DesignRun,
  "cost" | "elapsed" | "runCount" | "cycle" | "maxCycles" | "subtasks" | "percentComplete"
>;

const run = (
  id: string,
  label: string,
  status: DesignRun["status"],
  ops: Ops,
  blockingConstraint: string | null = null,
): DesignRun => ({
  id,
  label,
  status,
  createdAt: 1_752_000_000_000,
  updatedAt: 1_752_000_100_000,
  blockingConstraint,
  ...ops,
  ...ENG,
});

export const jobs: Job[] = [
  {
    id: "job-1",
    name: "Gearbox output shaft",
    runs: [
      run("r-1a", "baseline", "converged", { cost: 42.18, elapsed: 313, runCount: 3, cycle: 12, maxCycles: 12, subtasks: 5, percentComplete: 100 }),
      run("r-1b", "duty sweep", "infeasible", { cost: 18.05, elapsed: 121, runCount: 1, cycle: 40, maxCycles: 40, subtasks: 5, percentComplete: 100 }, "shaft deflection limit governs"),
    ],
  },
  {
    id: "job-2",
    name: "Bearing housing",
    runs: [
      run("r-2a", "active solve", "running", { cost: 9.4, elapsed: 58, runCount: 1, cycle: 6, maxCycles: 20, subtasks: 4, percentComplete: 30 }),
    ],
  },
  {
    id: "job-3",
    name: "Coupling flange",
    runs: [
      run("r-3a", "queued", "pending", { cost: 0, elapsed: 0, runCount: 0, cycle: 0, maxCycles: 16, subtasks: 3, percentComplete: 0 }),
      run("r-3b", "solver crash", "failed", { cost: 3.2, elapsed: 14, runCount: 1, cycle: 2, maxCycles: 16, subtasks: 3, percentComplete: 12 }),
    ],
  },
];
