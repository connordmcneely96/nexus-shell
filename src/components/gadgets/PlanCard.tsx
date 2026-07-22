import { DagFlow, type DagNodeData } from "@/components/gadgets";

// The confirm gate. NO agent spends before the Confirm click — that is the
// entire point of this card. The plan is authored EST; the button gates on the
// scripted cycle's progress and, once clicked, authorizes the next cycle.

const PLAN: DagNodeData[] = [
  { label: "INTAKE", cost: "$0.04", note: "done" },
  { label: "SOLVER", cost: "$0.00", note: "deterministic" },
  { label: "MODELER", cost: "$0.31", note: "EST" },
  { label: "CAD-REVIEWER", cost: "$0.12", note: "EST" },
  { label: "SENTINEL", cost: "$0.09", note: "EST" },
];

export default function PlanCard({
  cycle,
  ready,
  authorized,
  onConfirm,
}: {
  cycle: number; // current scripted cycle n
  ready: boolean; // current cycle's modeller work complete → gate open
  authorized: boolean; // confirm already fired for the next cycle
  onConfirm: () => void;
}) {
  return (
    <div className="max-w-2xl rounded-md border border-border-strong bg-surface-raised p-4">
      <div className="mb-3 text-sm text-text-muted">Next cycle plan</div>
      <DagFlow nodes={PLAN} />
      <div className="mt-3 font-mono text-xs text-text-muted">
        Total $0.56 EST · 5 subtasks · ~90s EST
      </div>
      {authorized ? (
        <div className="mt-3 text-xs text-text-muted">✓ Queued — polling 15s + on focus</div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-border-subtle px-3 py-1 text-sm text-text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={ready ? onConfirm : undefined}
            disabled={!ready}
            className={`rounded-md px-3 py-1 text-sm ${
              ready
                ? "bg-accent text-text-primary"
                : "cursor-not-allowed border border-border-strong text-text-muted"
            }`}
          >
            {ready ? `Confirm & run cycle ${cycle + 1}` : `Cycle ${cycle} in progress`}
          </button>
        </div>
      )}
    </div>
  );
}
