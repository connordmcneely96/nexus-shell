import type { ReactNode } from "react";

// Reusable CAD-stage gadgets. Pure presentational, tokens only, zero raw hex.
// MachinedBlank is the hatched "pending" slot — it stands in for any value the
// pipeline has not produced. Its text is supplied by children (e.g. '<<dim>>').

export function MachinedBlank({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-sm border border-dashed border-pending px-2 py-1 font-mono text-xs text-text-muted"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, color-mix(in srgb, var(--nx-pending) 14%, transparent) 0, color-mix(in srgb, var(--nx-pending) 14%, transparent) 6px, transparent 6px, transparent 12px)",
      }}
    >
      {children}
    </span>
  );
}

// A quoted standard/pack reference — a string, never a computed value.
export function CiteTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border-subtle px-2 py-1 font-mono text-xs text-text-muted">
      {children}
    </span>
  );
}

export function PackTag({ kind }: { kind: "signed" | "provisional" }) {
  const cls = kind === "signed" ? "border-success text-success" : "border-warn text-warn";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${cls}`}>
      {kind === "signed" ? "SIGNED" : "PROVISIONAL"}
    </span>
  );
}

export interface DagNodeData {
  label: string;
  cost: string;
  note: string;
}

export function DagNode({ label, cost, note }: DagNodeData) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2">
      <div className="font-mono text-xs text-text-primary">{label}</div>
      <div className="mt-1 font-mono text-xs text-text-muted">{cost}</div>
      <div className="text-xs text-text-faint">{note}</div>
    </div>
  );
}

export function DagFlow({ nodes }: { nodes: DagNodeData[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-text-faint">→</span>}
          <DagNode {...n} />
        </div>
      ))}
    </div>
  );
}

export function AssumptionCard({ label, conservative }: { label: string; conservative: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-raised px-3 py-2">
      <span className="text-xs text-text-primary">{label}</span>
      {conservative ? (
        <span className="rounded-full border border-border-subtle px-2 py-1 text-xs text-text-muted">conservative</span>
      ) : (
        <span className="rounded-full bg-warn px-2 py-1 text-xs text-surface-base">non-conservative</span>
      )}
    </div>
  );
}
