import type { Sketch } from "./types";

// Sketch topology — a PURE graph analysis (no React, no DOM). It answers the
// question S5's extrude gate will ask: "is this an actual closed loop I can turn
// into a solid?" That is a topology fact, walked from the graph — NOT inferred
// from segment/point COUNTS, which a count heuristic (segs >= pts) gets wrong the
// moment a stray stub or a junction appears.
//
// Only LINE segments contribute edges. Circles and arcs are inherently closed and
// are handled directly when S5 needs them; they are ignored here.

export interface Topology {
  isClosedProfile: boolean; // exactly one simple closed loop; nothing dangling, no junctions
  loopCount: number; // independent closed loops (cyclomatic number E - V + C)
  hasDangling: boolean; // any participating point with degree != 2 (open end or junction)
}

export function closedLoops(sketch: Sketch): Topology {
  // Undirected simple graph of points joined by line segments.
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (a === b) return; // ignore a degenerate self-referential segment
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  for (const s of sketch.segs) {
    if (s.kind === "line") link(s.a, s.b);
  }

  const V = adj.size;
  if (V === 0) {
    return { isClosedProfile: false, loopCount: 0, hasDangling: false };
  }

  // Degrees: a clean profile has every participating point at degree exactly 2.
  let degSum = 0;
  let hasDangling = false; // degree 1 (open end)
  let hasJunction = false; // degree >= 3 (branch)
  for (const nbrs of adj.values()) {
    const d = nbrs.size;
    degSum += d;
    if (d < 2) hasDangling = true;
    else if (d > 2) hasJunction = true;
  }
  const E = degSum / 2; // each undirected edge counted twice

  // Connected components (iterative DFS).
  const visited = new Set<string>();
  let C = 0;
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    C++;
    const stack = [start];
    visited.add(start);
    while (stack.length) {
      const cur = stack.pop()!;
      for (const nb of adj.get(cur)!) {
        if (!visited.has(nb)) {
          visited.add(nb);
          stack.push(nb);
        }
      }
    }
  }

  // Cyclomatic number (first Betti number): independent loops in the graph.
  const loopCount = E - V + C;

  // A single simple closed loop: exactly one cycle, every vertex degree 2 (so no
  // open ends and no branch junctions). This is what extrusion requires.
  const isClosedProfile = loopCount === 1 && !hasDangling && !hasJunction;

  return { isClosedProfile, loopCount, hasDangling: hasDangling || hasJunction };
}
