import type { FiveState, VerticalStage } from "@/shell/contract";

// Stage head — crumb, five-state chip, Share ghost, primary action. The
// provisional banner renders ABOVE the head with no close affordance.

const STATUS_CLASS: Record<FiveState, string> = {
  pending: "border-solid border-pending text-pending",
  running: "border-solid border-accent text-accent",
  converged: "border-solid border-success text-success",
  infeasible: "border-dashed border-verdict text-verdict", // dashed: hue-independent signal
  failed: "border-solid border-danger text-danger",
};

export default function StageHead({ stage }: { stage: VerticalStage }) {
  const { primaryAction } = stage;
  return (
    <div className="shrink-0">
      {stage.provisionalBanner && (
        <div className="w-full border-b border-warn bg-surface-raised px-4 py-2 text-sm text-warn">
          {stage.provisionalBanner}
        </div>
      )}
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
        <nav className="min-w-0 flex-1 truncate text-sm text-text-muted">
          {stage.crumb.map((c, i) => (
            <span key={c}>
              {i > 0 && <span className="text-text-faint"> › </span>}
              <span className={i === stage.crumb.length - 1 ? "text-text-primary" : undefined}>{c}</span>
            </span>
          ))}
        </nav>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs ${STATUS_CLASS[stage.status]}`}>
          {stage.status}
          {stage.statusDetail && <span className="ml-2 font-mono">{stage.statusDetail}</span>}
        </span>
        <button
          type="button"
          className="shrink-0 rounded-md border border-border-subtle px-3 py-1 text-sm text-text-muted"
        >
          Share
        </button>
        <button
          type="button"
          disabled={!primaryAction.enabled}
          className={`shrink-0 rounded-md px-3 py-1 text-sm ${
            primaryAction.enabled
              ? "bg-accent text-text-primary"
              : "cursor-not-allowed border border-border-strong text-text-muted"
          }`}
        >
          {primaryAction.label}
        </button>
      </div>
    </div>
  );
}
