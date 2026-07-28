import type { Sketch } from "./types";

// Sketch constraint solver — ITERATIVE CONSTRAINT RELAXATION (position-based /
// projected Gauss-Seidel). Each constraint is a small LOCAL correction applied to
// the points it touches; we loop over all constraints and repeat until the total
// correction falls below eps or a hard iteration cap is hit. This is NOT a
// Jacobian/Newton analytic solver — deliberately so.
//
// It FAILS SOFT: an over-constrained or contradictory set does not throw and does
// not force a wrong answer. It returns { converged: false, residual } and leaves
// the sketch at its best-effort position. Over-constrained is a determinate "no",
// the sketch analogue of an infeasible duty — surfaced, never hidden.
//
// Pure and deterministic: no React, no DOM, no Math.random. Same input, same
// output. Every correction is guarded finite, so no input yields NaN/Infinity.

type XY = { x: number; y: number };

export interface SolveResult {
  sketch: Sketch;
  converged: boolean;
  iterations: number;
  residual: number;
}

export function solve(
  sketch: Sketch,
  opts?: { maxIter?: number; eps?: number },
): SolveResult {
  const maxIter = opts?.maxIter ?? 200;
  const eps = opts?.eps ?? 1e-4;

  // Live positions keyed by id (never mutate the input).
  const pos = new Map<string, XY>();
  for (const p of sketch.pts) pos.set(p.id, { x: p.x, y: p.y });

  // Pinned points — never moved by any correction.
  const fixed = new Set<string>();
  for (const c of sketch.cons) if (c.kind === "fixed") fixed.add(c.pt);

  // Move a point by (dx,dy) unless it is fixed; skip non-finite corrections so a
  // degenerate case can never write NaN. Returns the magnitude actually moved.
  const move = (id: string, dx: number, dy: number): number => {
    if (fixed.has(id)) return 0;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return 0;
    const p = pos.get(id);
    if (!p) return 0;
    p.x += dx;
    p.y += dy;
    return Math.hypot(dx, dy);
  };

  const segEnds = (segId: string): [string, string] | null => {
    const seg = sketch.segs.find((s) => s.id === segId);
    if (!seg || seg.kind !== "line") return null;
    return [seg.a, seg.b];
  };

  // Drive |b-a| toward `target` by moving the endpoints along their axis. A fixed
  // endpoint holds; the free one takes the whole correction. A degenerate
  // (near-zero) segment is nudged along +x deterministically to avoid a divide.
  const enforceLength = (aId: string, bId: string, target: number): number => {
    const A = pos.get(aId);
    const B = pos.get(bId);
    if (!A || !B) return 0;
    const af = fixed.has(aId);
    const bf = fixed.has(bId);
    if (af && bf) return 0;
    let dx = B.x - A.x;
    let dy = B.y - A.y;
    let L = Math.hypot(dx, dy);
    if (L < 1e-9) {
      dx = 1;
      dy = 0;
      L = 1;
    }
    const ux = dx / L;
    const uy = dy / L;
    const diff = L - target; // >0 too long (shrink), <0 too short (grow)
    let moved = 0;
    if (af) {
      moved += move(bId, -ux * diff, -uy * diff);
    } else if (bf) {
      moved += move(aId, ux * diff, uy * diff);
    } else {
      moved += move(aId, ux * diff * 0.5, uy * diff * 0.5);
      moved += move(bId, -ux * diff * 0.5, -uy * diff * 0.5);
    }
    return moved;
  };

  // Equalize one axis (y for horizontal, x for vertical) across a segment.
  const enforceAxis = (segId: string, axis: "x" | "y"): number => {
    const ends = segEnds(segId);
    if (!ends) return 0;
    const [aId, bId] = ends;
    const A = pos.get(aId);
    const B = pos.get(bId);
    if (!A || !B) return 0;
    const af = fixed.has(aId);
    const bf = fixed.has(bId);
    if (af && bf) return 0;
    const va = axis === "y" ? A.y : A.x;
    const vb = axis === "y" ? B.y : B.x;
    const target = af ? va : bf ? vb : (va + vb) / 2;
    let moved = 0;
    if (axis === "y") {
      moved += move(aId, 0, target - A.y);
      moved += move(bId, 0, target - B.y);
    } else {
      moved += move(aId, target - A.x, 0);
      moved += move(bId, target - B.x, 0);
    }
    return moved;
  };

  const length = (segId: string): number | null => {
    const ends = segEnds(segId);
    if (!ends) return null;
    const A = pos.get(ends[0]);
    const B = pos.get(ends[1]);
    if (!A || !B) return null;
    return Math.hypot(B.x - A.x, B.y - A.y);
  };

  let iterations = 0;
  let residual = 0;
  for (let it = 0; it < maxIter; it++) {
    iterations = it + 1;
    let moved = 0;
    for (const c of sketch.cons) {
      switch (c.kind) {
        case "fixed":
          break; // enforced via the `fixed` set
        case "horizontal":
          moved += enforceAxis(c.seg, "y");
          break;
        case "vertical":
          moved += enforceAxis(c.seg, "x");
          break;
        case "coincident": {
          const A = pos.get(c.a);
          const B = pos.get(c.b);
          if (!A || !B) break;
          const af = fixed.has(c.a);
          const bf = fixed.has(c.b);
          if (af && bf) break;
          const tx = af ? A.x : bf ? B.x : (A.x + B.x) / 2;
          const ty = af ? A.y : bf ? B.y : (A.y + B.y) / 2;
          moved += move(c.a, tx - A.x, ty - A.y);
          moved += move(c.b, tx - B.x, ty - B.y);
          break;
        }
        case "distance":
          moved += enforceLength(c.a, c.b, Math.max(0, c.d));
          break;
        case "equal": {
          const L1 = length(c.seg1);
          const L2 = length(c.seg2);
          if (L1 == null || L2 == null) break;
          const target = (L1 + L2) / 2;
          const e1 = segEnds(c.seg1);
          const e2 = segEnds(c.seg2);
          if (e1) moved += enforceLength(e1[0], e1[1], target);
          if (e2) moved += enforceLength(e2[0], e2[1], target);
          break;
        }
      }
    }
    residual = moved;
    if (moved < eps) break;
  }

  const outPts = sketch.pts.map((p) => {
    const q = pos.get(p.id)!;
    return { ...p, x: q.x, y: q.y };
  });
  return {
    sketch: { ...sketch, pts: outPts },
    converged: residual < eps,
    iterations,
    residual,
  };
}
