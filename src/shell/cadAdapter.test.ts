import { describe, it, expect } from "vitest";
import { parseDesignJson, buildRecord } from "./cadAdapter";
import { DESIGN_JSON_RAW, RUN1DC14AD0_ROW, RUN1DC14AD0_ARTIFACTS } from "./__fixtures__/run1dc14ad0";

// Prove the parse against the REAL captured 1dc14ad0 bytes (not mock).

describe("cadAdapter — parse of the real 1dc14ad0 payload", () => {
  it("parses the real design_json shape and values", () => {
    const d = parseDesignJson(DESIGN_JSON_RAW);
    expect(d).not.toBeNull();
    expect(d!.diameter).toBe(2.375);
    expect(d!.material).toBe("AISI 4140");
    expect(d!.torque).toBeCloseTo(3275.1235955056177);
    expect(d!.checks).toHaveLength(6);
    expect(d!.checks[0].criterion).toBe("shaft deflection at primary seal faces");
    expect(d!.checks[0].pass).toBe(true);
    expect(d!.checks[0].citation).toContain("API 610");
  });

  it("returns null for null / malformed design_json (stays MachinedBlank)", () => {
    expect(parseDesignJson(null)).toBeNull();
    expect(parseDesignJson("not json")).toBeNull();
    expect(parseDesignJson("{}")).toBeNull();
  });

  it("assumption impact classifies off the real string, NON-CONSERVATIVE first", () => {
    const d = parseDesignJson(DESIGN_JSON_RAW)!;
    const nonCons = d.assumptions.filter((a) => a.impact.startsWith("NON-CONSERVATIVE"));
    const cons = d.assumptions.filter((a) => a.impact.startsWith("CONSERVATIVE"));
    // impellerWeight + criticalSpeedModel + the two stress-concentration ones.
    expect(nonCons.map((a) => a.parameter)).toContain("impellerWeight");
    expect(nonCons.map((a) => a.parameter)).toContain("stressConcentrationBending");
    expect(cons.map((a) => a.parameter)).toContain("deflectionStation");
    // A sort by that field puts a NON-CONSERVATIVE row first.
    const sorted = [...d.assumptions].sort(
      (a, b) => Number(b.impact.startsWith("NON-CONSERVATIVE")) - Number(a.impact.startsWith("NON-CONSERVATIVE")),
    );
    expect(sorted[0].impact.startsWith("NON-CONSERVATIVE")).toBe(true);
  });

  it("buildRecord maps row + artifacts; md artifact present, no glb", () => {
    const rec = buildRecord(RUN1DC14AD0_ROW, RUN1DC14AD0_ARTIFACTS);
    expect(rec.run.status).toBe("converged");
    expect(rec.run.designStatus).toBe("converged");
    expect(rec.design).not.toBeNull();
    expect(rec.artifacts).toHaveLength(1);
    expect(rec.artifacts[0].format).toBe("md");
    expect(rec.artifacts.find((a) => a.format === "glb")).toBeUndefined();
  });
});
