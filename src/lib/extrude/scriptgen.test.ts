import { describe, it, expect } from "vitest";
import { buildExtrudeScript } from "./scriptgen";
import type { Sketch, Pt, Seg } from "@/components/frame/cad/model/sketch/types";

const P = (id: string, x: number, y: number): Pt => ({ id, x, y });
const L = (id: string, a: string, b: string): Seg => ({ id, kind: "line", a, b });

// A closed unit square.
const square = (): Sketch => ({
  plane: "XY",
  cons: [],
  pts: [P("p0", 0, 0), P("p1", 1, 0), P("p2", 1, 1), P("p3", 0, 1)],
  segs: [L("s0", "p0", "p1"), L("s1", "p1", "p2"), L("s2", "p2", "p3"), L("s3", "p3", "p0")],
});

describe("buildExtrudeScript", () => {
  it("emits a valid, bounded script for a square with the depth and all vertices", () => {
    const s = buildExtrudeScript(square(), 10);
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThan(200000);
    expect(s).toContain("DEPTH = 10.0000");
    // all four ordered vertices present
    expect(s).toContain("(0.0000, 0.0000)");
    expect(s).toContain("(1.0000, 0.0000)");
    expect(s).toContain("(1.0000, 1.0000)");
    expect(s).toContain("(0.0000, 1.0000)");
    // writes to the exact path the route reads
    expect(s).toContain("/work/out/model.glb");
  });

  it("closes the loop (the face is a closed profile)", () => {
    const s = buildExtrudeScript(square(), 10);
    expect(s).toContain("Polyline(*PTS, close=True)");
    expect(s).toContain("make_face()");
  });

  it("is deterministic — same sketch + depth yields identical script", () => {
    expect(buildExtrudeScript(square(), 10)).toBe(buildExtrudeScript(square(), 10));
  });

  it("fails loud in-sandbox on a degenerate (non-orderable) profile", () => {
    // Two disjoint segments — not one clean ring; the generator emits an empty
    // point list and the script raises + exits non-zero.
    const bad: Sketch = {
      plane: "XY",
      cons: [],
      pts: [P("p0", 0, 0), P("p1", 1, 0), P("p2", 5, 5), P("p3", 6, 6)],
      segs: [L("s0", "p0", "p1"), L("s1", "p2", "p3")],
    };
    const s = buildExtrudeScript(bad, 10);
    expect(s).toContain("PTS = []");
    expect(s).toContain("sys.exit(1)");
  });
});
