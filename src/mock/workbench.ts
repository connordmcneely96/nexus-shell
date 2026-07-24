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
  sketchX: number; // geometry input — real
  sketchY: number; // geometry input — real
}

export interface Workbench {
  docId: string;
  nodes: WorkbenchNode[];
}

export const workbench: Workbench = {
  docId: "booster-pump-shaft",
  nodes: [
    // ── Shaft body ──
    { nodeId: "sb-datum", label: "Datum axis", group: "Shaft body", provenance: "user", citation: null, value: "<<dim>>", sketchX: 0, sketchY: 0 },
    { nodeId: "sb-diam", label: "Shaft diameter", group: "Shaft body", provenance: "calc", citation: "API 610 §6.9.1.3", value: "<<dim>>", sketchX: 0, sketchY: 24 },
    { nodeId: "sb-len", label: "Bearing span", group: "Shaft body", provenance: "calc", citation: "API 610 §3.1.8", value: "<<dim>>", sketchX: 220, sketchY: 0 },
    { nodeId: "sb-fillet", label: "Shoulder fillet", group: "Shaft body", provenance: "assumption", citation: null, value: "<<tol - pending>>", sketchX: 48, sketchY: 24 },
    // ── Bearing seats ──
    { nodeId: "bs-de", label: "Drive-end seat", group: "Bearing seats", provenance: "calc", citation: "API 610 §6.10.1.11", value: "<<check - pending>>", sketchX: 32, sketchY: 30 },
    { nodeId: "bs-nde", label: "Non-drive seat", group: "Bearing seats", provenance: "overridden", citation: null, value: "<<check - pending>>", sketchX: 196, sketchY: 30 },
    { nodeId: "bs-fit", label: "Seat fit class", group: "Bearing seats", provenance: "user", citation: null, value: "<<tol - pending>>", sketchX: 196, sketchY: 12 },
    // ── Coupling end ──
    { nodeId: "ce-key", label: "Keyway", group: "Coupling end", provenance: "llm", citation: null, value: "<<dim>>", sketchX: 256, sketchY: 18 },
    { nodeId: "ce-thread", label: "Retaining thread", group: "Coupling end", provenance: "assumption", citation: null, value: "<<tol - pending>>", sketchX: 268, sketchY: 8 },
  ],
};
