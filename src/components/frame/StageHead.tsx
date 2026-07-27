import type { BadgeState, VerticalStage } from "@/shell/contract";
import StatusChip from "@/components/gadgets/StatusChip";

// Stage head — crumb, badge chip (via StatusChip), Share ghost, primary action.
// Two persistent, undismissable notices render ABOVE the head: the amber
// provisional-pack banner, and (distinct) the neutral accuracy notice shown
// whenever a persisted engineering value is rendered — the shell never asserts
// a pipeline value is correct.

const ACCURACY_NOTICE =
  "Values shown as computed by the pipeline — NOT independently verified. Accuracy review pending.";

export default function StageHead({
  stage,
  badge,
  accuracyNotice,
}: {
  stage: VerticalStage;
  badge?: BadgeState;
  accuracyNotice?: boolean;
}) {
  const { primaryAction } = stage;
  return (
    <div className="shrink-0">
      {stage.provisionalBanner && (
        <div className="w-full border-b border-warn bg-surface-raised px-4 py-2 text-sm text-warn">
          {stage.provisionalBanner}
        </div>
      )}
      {accuracyNotice && (
        <div className="w-full border-b border-border-strong bg-surface-overlay px-4 py-2 text-sm text-text-muted">
          {ACCURACY_NOTICE}
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
        <span className="shrink-0">
          <StatusChip
            state={badge ?? stage.status}
            detail={stage.statusDetail}
            pulse={(badge ?? stage.status) === "running"}
          />
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
