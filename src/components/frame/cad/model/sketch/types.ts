// The sketch document model — pure data, no behaviour. A Sketch is user- or
// kernel-authored geometry INPUT on a 2D plane: it carries no engineering claim,
// no citation, and no grounding. Solidifying it (extrude/revolve) is a separate
// gated creation act (S5+); that act does not make the sketch grounded either.
// x/y/r are real geometry input (mm), the same category as a duty value.

export type Pt = { id: string; x: number; y: number }; // mm, on the sketch plane

export type Seg =
  | { id: string; kind: "line"; a: string; b: string } // a,b = Pt ids
  | { id: string; kind: "circle"; c: string; r: number } // c = Pt id
  | { id: string; kind: "arc"; c: string; a: string; b: string };

export type Sketch = { plane: "XY" | "XZ" | "YZ"; pts: Pt[]; segs: Seg[] };
