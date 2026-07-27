import { describe, it, expect } from "vitest";
import { projectBadge } from "./projectBadge";

// One assertion per §3 table row, plus the two safety rows called out
// explicitly — they are the whole point of the projection: a run that claims
// to have converged is NOT shown green unless the design layer grounded it.

describe("projectBadge — the §3 projection table", () => {
  it("converged run + converged design → converged", () => {
    expect(projectBadge("converged", "converged")).toBe("converged");
  });

  it("infeasible run → infeasible", () => {
    expect(projectBadge("infeasible", "infeasible")).toBe("infeasible");
  });

  it("exhausted run → exhausted", () => {
    expect(projectBadge("exhausted", null)).toBe("exhausted");
  });

  it("running run → running", () => {
    expect(projectBadge("running", null)).toBe("running");
  });

  it("failed run → failed", () => {
    expect(projectBadge("failed", null)).toBe("failed");
  });

  it("solver_error design → failed", () => {
    expect(projectBadge("pending", "solver_error")).toBe("failed");
  });

  it("pending run (default) → pending", () => {
    expect(projectBadge("pending", null)).toBe("pending");
  });

  // ── the two safety rows — never greener than design truth ──
  it("converged run + UNGROUNDED design → pending (NOT converged)", () => {
    expect(projectBadge("converged", "ungrounded")).toBe("pending");
  });

  it("converged run + NULL design → pending (NOT converged)", () => {
    expect(projectBadge("converged", null)).toBe("pending");
  });
});
