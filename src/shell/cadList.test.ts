import { describe, it, expect } from "vitest";
import { mapMissionSummary, type RawRunListRow } from "./cadAdapter";
import { CAD_RUN_LIST_ROWS } from "./__fixtures__/cadRunList";

// Prove the LIST projection against the REAL captured run rows, and — crucially —
// that a converged run over an ungrounded/null design projects to PENDING at
// list level too (never greener than the detail).

describe("cadMissionList projection", () => {
  it("badges the real rows through the shipped projection", () => {
    const summaries = CAD_RUN_LIST_ROWS.map(mapMissionSummary);
    const byId = Object.fromEntries(summaries.map((s) => [s.runId, s]));

    // converged+converged → converged
    expect(byId["1dc14ad0-24a8-488c-9f1a-91fa1c608491"].status).toBe("converged");
    // infeasible → infeasible, carrying a concise blocking constraint
    const inf = byId["131f6c46-a45e-479a-8919-8d937716fbdb"];
    expect(inf.status).toBe("infeasible");
    expect(inf.blockingConstraint).toContain("No feasible candidate");
    // name derived from spec, operational fields only (no engineering values)
    expect(byId["570ac2c5-3283-4cf7-8c21-5f6840c4a314"].name).toContain("BB2");
  });

  it("the summary carries status/cycle/counts ONLY — never an engineering value", () => {
    const allowed = new Set([
      "runId", "name", "status", "rawStatus", "designStatus",
      "blockingConstraint", "cycle", "maxCycles", "createdAt",
    ]);
    const forbidden = ["diameter", "torque", "radialLoad", "bendingMoment", "checks", "assumptions", "length"];
    for (const s of CAD_RUN_LIST_ROWS.map(mapMissionSummary)) {
      for (const k of Object.keys(s)) expect(allowed.has(k)).toBe(true);
      for (const k of forbidden) expect(k in s).toBe(false);
    }
  });

  it("a converged run over an UNGROUNDED design projects to pending (never green)", () => {
    const ungrounded: RawRunListRow = {
      run_id: "synthetic-ungrounded",
      status: "converged",
      design_status: "ungrounded",
      design_diagnosis: null,
      cycle: 2,
      max_cycles: 3,
      created_at: 0,
      spec: "API 610 OH2 pump shaft, ungrounded design",
    };
    expect(mapMissionSummary(ungrounded).status).toBe("pending");

    const nullDesign: RawRunListRow = { ...ungrounded, run_id: "synthetic-null", design_status: null };
    expect(mapMissionSummary(nullDesign).status).toBe("pending");
  });
});
