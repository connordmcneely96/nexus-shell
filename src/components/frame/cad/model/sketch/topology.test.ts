import { describe, it, expect } from "vitest";
import { closedLoops } from "./topology";
import type { Sketch, Pt, Seg } from "./types";

const P = (id: string, x: number, y: number): Pt => ({ id, x, y });
const L = (id: string, a: string, b: string): Seg => ({ id, kind: "line", a, b });
const mk = (pts: Pt[], segs: Seg[]): Sketch => ({ plane: "XY", pts, segs, cons: [] });

describe("sketch topology — closedLoops (graph walk, not counts)", () => {
  it("a 4-point square is a single closed profile", () => {
    const s = mk(
      [P("p0", 0, 0), P("p1", 10, 0), P("p2", 10, 10), P("p3", 0, 10)],
      [L("s0", "p0", "p1"), L("s1", "p1", "p2"), L("s2", "p2", "p3"), L("s3", "p3", "p0")],
    );
    const r = closedLoops(s);
    expect(r.isClosedProfile).toBe(true);
    expect(r.loopCount).toBe(1);
    expect(r.hasDangling).toBe(false);
  });

  it("an open polyline is not a closed profile and has dangling ends", () => {
    const s = mk(
      [P("p0", 0, 0), P("p1", 10, 0), P("p2", 20, 0)],
      [L("s0", "p0", "p1"), L("s1", "p1", "p2")],
    );
    const r = closedLoops(s);
    expect(r.isClosedProfile).toBe(false);
    expect(r.hasDangling).toBe(true);
  });

  it("a closed square PLUS a stray stub is rejected (the case counts got wrong)", () => {
    // 5 segs, 5 pts — segs >= pts, so the old count heuristic called this closed.
    // The stub makes p0 a degree-3 junction and p4 a degree-1 dangling end.
    const s = mk(
      [P("p0", 0, 0), P("p1", 10, 0), P("p2", 10, 10), P("p3", 0, 10), P("p4", -8, 0)],
      [
        L("s0", "p0", "p1"),
        L("s1", "p1", "p2"),
        L("s2", "p2", "p3"),
        L("s3", "p3", "p0"),
        L("s4", "p0", "p4"), // stub
      ],
    );
    const r = closedLoops(s);
    expect(r.isClosedProfile).toBe(false);
    expect(r.hasDangling).toBe(true);
  });

  it("a figure-8 (two loops sharing a degree-4 junction) is not a single profile", () => {
    // Triangle A: c-a-b-c; Triangle B: c-d-e-c; shared vertex c has degree 4.
    const s = mk(
      [P("c", 0, 0), P("a", -10, 5), P("b", -10, -5), P("d", 10, 5), P("e", 10, -5)],
      [
        L("s0", "c", "a"),
        L("s1", "a", "b"),
        L("s2", "b", "c"),
        L("s3", "c", "d"),
        L("s4", "d", "e"),
        L("s5", "e", "c"),
      ],
    );
    const r = closedLoops(s);
    expect(r.isClosedProfile).toBe(false);
    expect(r.loopCount).toBe(2);
  });

  it("an empty sketch is not a closed profile", () => {
    const r = closedLoops(mk([], []));
    expect(r.isClosedProfile).toBe(false);
    expect(r.loopCount).toBe(0);
  });

  it("is deterministic on repeat", () => {
    const s = mk(
      [P("p0", 0, 0), P("p1", 10, 0), P("p2", 10, 10), P("p3", 0, 10)],
      [L("s0", "p0", "p1"), L("s1", "p1", "p2"), L("s2", "p2", "p3"), L("s3", "p3", "p0")],
    );
    expect(closedLoops(s)).toEqual(closedLoops(s));
  });
});
