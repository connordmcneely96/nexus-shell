import type { FiveState } from "@/shell/contract";
import type { RunClock } from "@/shell/useRunClock";
import PlanCard from "@/components/gadgets/PlanCard";

// Overview — the confirm gate for a running run, or the terminal answer for a
// run that has already resolved. The UI never offers to re-run a proven "no".

export default function OverviewPane({
  status,
  blockingConstraint,
  run,
}: {
  status: FiveState;
  blockingConstraint?: string;
  run: RunClock;
}) {
  const ready = run.agentStates["MODELER"] === "done";
  const authorized = run.confirmedCycle > run.cycle;

  const confirm = () => {
    run.addActivity(`cycle ${run.cycle + 1} confirmed — $0.56 EST authorized`);
    run.advanceCycle(run.cycle + 1);
  };

  return (
    <div className="p-6">
      <p className="mb-4 text-xs text-text-faint">
        The LLM writes the question; deterministic code writes the answer.
      </p>

      {status === "running" && (
        <PlanCard cycle={run.cycle} ready={ready} authorized={authorized} onConfirm={confirm} />
      )}

      {status === "infeasible" && (
        <div className="max-w-xl rounded-md border border-dashed border-verdict bg-surface-raised p-4">
          <div className="text-sm text-verdict">
            No further cycles: {blockingConstraint ?? "a named constraint governs"}. Revise the duty
            to continue.
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Infeasible is a determinate engineering answer — a design that says no — not a fault.
          </p>
        </div>
      )}

      {status === "converged" && (
        <div className="max-w-xl rounded-md border border-success bg-surface-raised p-4 text-sm text-success">
          Run converged — deliverables in Artifacts.
        </div>
      )}

      {status !== "running" && status !== "infeasible" && status !== "converged" && (
        <div className="max-w-xl rounded-md border border-border-subtle bg-surface-raised p-4 text-sm text-text-muted">
          Run {status} — no active cycle.
        </div>
      )}

      {status === "running" && (
        <div className="mt-6 max-w-xl rounded-md border border-border-subtle bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-text-primary">Sibling run · duty sweep</span>
            <span className="rounded-full border border-dashed border-verdict px-3 py-1 text-xs text-verdict">
              infeasible
            </span>
          </div>
          <div className="mt-2 text-xs text-verdict">shaft deflection limit governs</div>
          <p className="mt-2 text-xs text-text-muted">
            A sibling run came back infeasible — that is a determinate answer, not a fault. The
            pipeline finished; no geometry satisfied that duty within the governing limit.
          </p>
        </div>
      )}
    </div>
  );
}
