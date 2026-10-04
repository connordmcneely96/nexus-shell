import type { Autonomy } from "../lib/contract";

// AUTONOMY — who drives. Separate axis from TIER. Read-only against mock state.
const LEVELS: Autonomy[] = ["manual", "hybrid", "auto"];

export default function AutonomyStrip({ value }: { value: Autonomy }) {
  return (
    <div role="group" aria-label="Autonomy" className="flex items-center gap-2 text-xs text-text-muted">
      <span className="nx-up">Autonomy</span>
      <span className="flex overflow-hidden rounded-md border border-border-subtle">
        {LEVELS.map((l) => (
          <span key={l} aria-current={l === value}
            className={`px-3 py-1 ${l === value ? "bg-surface-overlay text-text-primary" : "text-text-muted"}`}>
            {l}
          </span>
        ))}
      </span>
    </div>
  );
}
