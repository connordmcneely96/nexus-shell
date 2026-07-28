import { describe, it, expect } from "vitest";
import { solve } from "./solver";
import type { Sketch } from "./types";

const mk = (partial: Partial<Sketch>): Sketch => ({
  plane: "XY",
  pts: [],
  segs: [],
  cons: [],
  ...partial,
});

const len = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const allFinite = (s: Sketch) =>
  s.pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

describe("sketch solver — iterative relaxation", () => {
  it("horizontal: endpoints converge to equal y", () => {
    const r = solve(
      mk({
        pts: [
          { id: "p0", x: 0, y: 0 },
          { id: "p1", x: 100, y: 40 },
        ],
        segs: [{ id: "s0", kind: "line", a: "p0", b: "p1" }],
        cons: [{ id: "c0", kind: "horizontal", seg: "s0" }],
      }),
    );
    const [a, b] = r.sketch.pts;
    expect(r.converged).toBe(true);
    expect(Math.abs(a.y - b.y)).toBeLessThan(1e-4);
  });

  it("vertical: endpoints converge to equal x", () => {
    const r = solve(
      mk({
        pts: [
          { id: "p0", x: 0, y: 0 },
          { id: "p1", x: 40, y: 100 },
        ],
        segs: [{ id: "s0", kind: "line", a: "p0", b: "p1" }],
        cons: [{ id: "c0", kind: "vertical", seg: "s0" }],
      }),
    );
    const [a, b] = r.sketch.pts;
    expect(r.converged).toBe(true);
    expect(Math.abs(a.x - b.x)).toBeLessThan(1e-4);
  });

  it("coincident: two points converge to the same location", () => {
    const r = solve(
      mk({
        pts: [
          { id: "p0", x: 0, y: 0 },
          { id: "p1", x: 30, y: 40 },
        ],
        cons: [{ id: "c0", kind: "coincident", a: "p0", b: "p1" }],
      }),
    );
    const [a, b] = r.sketch.pts;
    expect(r.converged).toBe(true);
    expect(len(a, b)).toBeLessThan(1e-4);
  });

  it("distance: |b-a| == d within eps", () => {
    const r = solve(
      mk({
        pts: [
          { id: "p0", x: 0, y: 0 },
          { id: "p1", x: 100, y: 0 },
        ],
        cons: [{ id: "c0", kind: "distance", a: "p0", b: "p1", d: 30 }],
      }),
    );
    const [a, b] = r.sketch.pts;
    expect(r.converged).toBe(true);
    expect(Math.abs(len(a, b) - 30)).toBeLessThan(1e-4);
  });

  it("equal: two segments end equal length", () => {
    const r = solve(
      mk({
        pts: [
          { id: "p0", x: 0, y: 0 },
          { id: "p1", x: 100, y: 0 },
          { id: "p2", x: 0, y: 50 },
          { id: "p3", x: 40, y: 50 },
        ],
        segs: [
          { id: "s0", kind: "line", a: "p0", b: "p1" },
          { id: "s1", kind: "line", a: "p2", b: "p3" },
        ],
        cons: [{ id: "c0", kind: "equal", seg1: "s0", seg2: "s1" }],
      }),
    );
    const [p0, p1, p2, p3] = r.sketch.pts;
    expect(r.converged).toBe(true);
    expect(Math.abs(len(p0, p1) - len(p2, p3))).toBeLessThan(1e-4);
  });

  it("fixed: a pinned point does not move while the other satisfies the constraint", () => {
    const r = solve(
      mk({
        pts: [
          { id: "p0", x: 0, y: 0 },
          { id: "p1", x: 30, y: 40 },
        ],
        cons: [
          { id: "f0", kind: "fixed", pt: "p0" },
          { id: "c0", kind: "coincident", a: "p0", b: "p1" },
        ],
      }),
    );
    const [a, b] = r.sketch.pts;
    expect(a.x).toBe(0);
    expect(a.y).toBe(0); // pinned — unmoved
    expect(len(a, b)).toBeLessThan(1e-4); // the free point met it
  });

  it("over-constrained: a contradictory set fails soft — finite, converged=false, no throw", () => {
    const run = () =>
      solve(
        mk({
          pts: [
            { id: "p0", x: 0, y: 0 },
            { id: "p1", x: 10, y: 0 },
          ],
          // distance 10 apart AND coincident (0 apart) — cannot both hold.
          cons: [
            { id: "c0", kind: "distance", a: "p0", b: "p1", d: 10 },
            { id: "c1", kind: "coincident", a: "p0", b: "p1" },
          ],
        }),
      );
    expect(run).not.toThrow();
    const r = run();
    expect(r.converged).toBe(false);
    expect(Number.isFinite(r.residual)).toBe(true);
    expect(allFinite(r.sketch)).toBe(true);
  });

  it("deterministic: solving twice yields identical output", () => {
    const s = mk({
      pts: [
        { id: "p0", x: 3, y: 7 },
        { id: "p1", x: 91, y: 22 },
        { id: "p2", x: 5, y: 60 },
        { id: "p3", x: 44, y: 51 },
      ],
      segs: [
        { id: "s0", kind: "line", a: "p0", b: "p1" },
        { id: "s1", kind: "line", a: "p2", b: "p3" },
      ],
      cons: [
        { id: "c0", kind: "horizontal", seg: "s0" },
        { id: "c1", kind: "equal", seg1: "s0", seg2: "s1" },
        { id: "c2", kind: "distance", a: "p0", b: "p1", d: 80 },
      ],
    });
    expect(solve(s)).toEqual(solve(s));
  });
});
