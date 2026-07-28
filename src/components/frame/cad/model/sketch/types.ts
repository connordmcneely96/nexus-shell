// The sketch document model — pure data, no behaviour. A Sketch is user- or
// kernel-authored geometry INPUT on a 2D plane: it carries no engineering claim,
// no citation, and no grounding. Solidifying it (extrude/revolve) is a separate
// gated creation act (S5+); that act does not make the sketch grounded either.
// x/y/r are real geometry input (mm), the same category as a duty value.
//
// This is the S4a analogue of the tree's provenance rule: a sketch is the `user`
// provenance made drawable, so the drawing surface must never imply its output is
// checked or grounded.

export type Pt = { id: string; x: number; y: number }; // mm, on the sketch plane

export type Seg =
  | { id: string; kind: "line"; a: string; b: string } // a,b = Pt ids
  | { id: string; kind: "circle"; c: string; r: number } // c = Pt id
  | { id: string; kind: "arc"; c: string; a: string; b: string };

// A Constraint is a relationship the iterative solver enforces by local
// correction. A `distance` constraint's `d` is a USER-TYPED number — `user`
// provenance, real input in the same category as a duty value, NEVER a
// solver-produced engineering value; it must not be presented as grounded or
// checked. Geometric constraints carry no number.
export type Constraint =
  | { id: string; kind: "horizontal"; seg: string } // a line seg id
  | { id: string; kind: "vertical"; seg: string }
  | { id: string; kind: "coincident"; a: string; b: string } // two pt ids
  | { id: string; kind: "equal"; seg1: string; seg2: string } // equal length
  | { id: string; kind: "distance"; a: string; b: string; d: number } // mm, user-typed
  | { id: string; kind: "fixed"; pt: string }; // pinned point

export type Sketch = { plane: "XY" | "XZ" | "YZ"; pts: Pt[]; segs: Seg[]; cons: Constraint[] };
