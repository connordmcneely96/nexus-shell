import type { PendingValue } from "./types";

// Parametric-document fixture for the Model stage. A node is one feature in the
// document tree. Its `value` is the engineering RESULT the solver will produce
// (still pending — a PendingValue literal, never a number). Its sketchX/sketchY
// are geometry INPUT: user- or kernel-authored sketch coordinates, real numbers
// in the same category as a duty value — NOT a solver-produced result. The two
// stay strictly separate: the value is pending, the geometry is real.
//
// CITATION RULE (the shape S3–S7 will copy): a citation is a PE-signed source,
// so it may ONLY accompany a value that source actually authored. An `llm` value
// is never PE-signed and an `overridden` value's original citation is stale by
// definition — both carry citation: null. Only calc/user/assumption values that
// genuinely trace to a standard may name one.

export interface WorkbenchNode {
  nodeId: string;
  label: string;
  group: string;
  provenance: "calc" | "user" | "assumption" | "overridden" | "llm";
  citation: string | null;
  value: PendingValue; // engineering result — stays pending
  // Sketch-canvas coordinates (used by the 2D sketch surface in S4+). Real,
  // geometric — retained, not removed.
  sketchX: number;
  sketchY: number;
  // Solid-of-revolution profile: each node is one axial section of the shaft.
  // Sections are adjacent end-to-end (axialStart === previous axialEnd), so the
  // whole document reads as ONE continuous stepped shaft. All mm, all real
  // geometry input — never solver-produced.
  axialStart: number; // near-face position along the axis
  axialEnd: number; // far-face position along the axis
  radius: number; // section radius
}

export interface Workbench {
  docId: string;
  nodes: WorkbenchNode[];
}

export const workbench: Workbench = {
  docId: "booster-pump-shaft",
  // Sections are listed in axial order and adjacent end-to-end. The radius rises
  // to a central maximum (the bearing-span body) and steps down toward both the
  // coupling end and the drive end — the real stepped-shaft profile.
  nodes: [
    // ── Shaft body ──
    { nodeId: "sb-datum", label: "Datum axis", group: "Shaft body", provenance: "user", citation: null, value: "<<dim>>", sketchX: 0, sketchY: 0, axialStart: 0, axialEnd: 40, radius: 15 },
    { nodeId: "sb-diam", label: "Shaft diameter", group: "Shaft body", provenance: "calc", citation: "API 610 §6.9.1.3", value: "<<dim>>", sketchX: 0, sketchY: 24, axialStart: 40, axialEnd: 80, radius: 22 },
    { nodeId: "sb-len", label: "Bearing span", group: "Shaft body", provenance: "calc", citation: "API 610 §3.1.8", value: "<<dim>>", sketchX: 220, sketchY: 0, axialStart: 80, axialEnd: 120, radius: 30 },
    { nodeId: "sb-fillet", label: "Shoulder fillet", group: "Shaft body", provenance: "assumption", citation: null, value: "<<tol - pending>>", sketchX: 48, sketchY: 24, axialStart: 120, axialEnd: 160, radius: 38 },
    // ── Bearing seats ──
    { nodeId: "bs-de", label: "Drive-end seat", group: "Bearing seats", provenance: "calc", citation: "API 610 §6.10.1.11", value: "<<check - pending>>", sketchX: 32, sketchY: 30, axialStart: 160, axialEnd: 200, radius: 45 },
    { nodeId: "bs-nde", label: "Non-drive seat", group: "Bearing seats", provenance: "overridden", citation: null, value: "<<check - pending>>", sketchX: 196, sketchY: 30, axialStart: 200, axialEnd: 240, radius: 38 },
    { nodeId: "bs-fit", label: "Seat fit class", group: "Bearing seats", provenance: "user", citation: null, value: "<<tol - pending>>", sketchX: 196, sketchY: 12, axialStart: 240, axialEnd: 280, radius: 30 },
    // ── Coupling end ──
    { nodeId: "ce-key", label: "Keyway", group: "Coupling end", provenance: "llm", citation: null, value: "<<dim>>", sketchX: 256, sketchY: 18, axialStart: 280, axialEnd: 320, radius: 22 },
    { nodeId: "ce-thread", label: "Retaining thread", group: "Coupling end", provenance: "assumption", citation: null, value: "<<tol - pending>>", sketchX: 268, sketchY: 8, axialStart: 320, axialEnd: 360, radius: 15 },
  ],
};
