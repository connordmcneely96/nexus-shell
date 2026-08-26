import type { Sketch, Pt } from "@/components/frame/cad/model/sketch/types";

// buildExtrudeScript — a PURE function (no fetch, no DOM) that turns a closed
// sketch profile into a build123d Python script the nexus-exec sandbox runs.
//
// PRECONDITION: the caller guarantees closedLoops(sketch).isClosedProfile. This
// generator does NOT re-run topology; it orders the loop by walking the line
// segments (the same graph idea as topology.ts, inlined small — not duplicated).
// If ordering fails (degenerate input reached here anyway) it emits an empty
// point list so the script fails LOUDLY in-sandbox (make_face throws → exit 1 →
// /run returns status:'error' with a real stderr), never a silent bad solid.
//
// Coordinates are formatted at fixed precision, so the same sketch + depth yields
// byte-identical output (testable, cacheable).

const FIXED = 4; // decimal places — deterministic formatting

// Walk the line-segment graph into a single ordered ring of points. Returns the
// ordered points (start not repeated) or null if the segments do not form one
// clean degree-2 cycle. Deterministic: starts at the lexicographically-smallest
// point id and steps to its smaller-id neighbour first.
function orderedLoop(sketch: Sketch): Pt[] | null {
  const adj = new Map<string, string[]>();
  const push = (a: string, b: string) => {
    const list = adj.get(a);
    if (list) list.push(b);
    else adj.set(a, [b]);
  };
  for (const s of sketch.segs) {
    if (s.kind !== "line" || s.a === s.b) continue;
    push(s.a, s.b);
    push(s.b, s.a);
  }
  const ids = [...adj.keys()].sort();
  if (!ids.length) return null;
  for (const id of ids) if ((adj.get(id) ?? []).length !== 2) return null; // not all degree 2

  const start = ids[0];
  const order: string[] = [start];
  let prev = "";
  let cur = start;
  let next = [...(adj.get(start) ?? [])].sort()[0]; // deterministic first step
  while (next !== start) {
    order.push(next);
    prev = cur;
    cur = next;
    const cand = (adj.get(cur) ?? []).filter((n) => n !== prev);
    if (cand.length !== 1) return null; // not a clean chain
    next = cand[0];
    if (order.length > ids.length) return null; // safety: no clean closure
  }
  if (order.length !== ids.length) return null; // walked back early → not one ring

  const byId = new Map(sketch.pts.map((p) => [p.id, p]));
  const pts: Pt[] = [];
  for (const id of order) {
    const p = byId.get(id);
    if (!p) return null;
    pts.push(p);
  }
  return pts;
}

export function buildExtrudeScript(sketch: Sketch, depthMm: number): string {
  const loop = orderedLoop(sketch);
  const depth = (Number.isFinite(depthMm) ? depthMm : 0).toFixed(FIXED);
  const tuples = (loop ?? [])
    .map((p) => `(${p.x.toFixed(FIXED)}, ${p.y.toFixed(FIXED)})`)
    .join(", ");

  // build123d / OCP GLB export path (2026-07-10 toolchain). A closed Polyline →
  // face → extrude → export_gltf(binary=True) to the exact path the route reads.
  return [
    "import os, sys, traceback",
    "from build123d import *",
    "",
    `PTS = [${tuples}]`,
    `DEPTH = ${depth}`,
    "",
    "try:",
    "    if len(PTS) < 3:",
    "        raise ValueError('degenerate profile: need >= 3 ordered points')",
    "    os.makedirs('/work/out', exist_ok=True)",
    "    with BuildPart() as part:",
    "        with BuildSketch() as sk:",
    "            with BuildLine() as ln:",
    "                Polyline(*PTS, close=True)",
    "            make_face()",
    "        extrude(amount=DEPTH)",
    "    export_gltf(part.part, '/work/out/model.glb', binary=True)",
    "    print('EXTRUDE_OK', flush=True)",
    "except Exception:",
    "    traceback.print_exc()",
    "    sys.exit(1)",
    "",
  ].join("\n");
}
