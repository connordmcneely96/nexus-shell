import { DagFlow, type DagNodeData } from "@/components/gadgets";

// Overview — the plan DAG (LLM writes the question, deterministic code writes
// the answer) plus the infeasible sibling-run card. No confirm button (S5).

const PLAN: DagNodeData[] = [
  { label: "INTAKE", cost: "$0.04", note: "done" },
  { label: "SOLVER", cost: "$0.00", note: "deterministic" },
  { label: "MODELER", cost: "$0.31", note: "EST" },
  { label: "CAD-REVIEWER", cost: "$0.12", note: "EST" },
  { label: "SENTINEL", cost: "$0.09", note: "EST" },
];

export default function OverviewPane() {
  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm text-text-muted">Plan</h2>
      <DagFlow nodes={PLAN} />
      <p className="mt-3 text-xs text-text-faint">
        The LLM writes the question; deterministic code writes the answer.
      </p>

      <div className="mt-6 max-w-xl rounded-md border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-text-primary">Sibling run · duty sweep</span>
          <span className="rounded-full border border-dashed border-verdict px-3 py-1 text-xs text-verdict">
            infeasible
          </span>
        </div>
        <div className="mt-2 text-xs text-verdict">shaft deflection limit governs</div>
        <p className="mt-2 text-xs text-text-muted">
          Infeasible is a determinate engineering answer — a design that says no — not a fault. The
          pipeline finished; no geometry satisfies this duty within the governing limit.
        </p>
      </div>
    </div>
  );
}
