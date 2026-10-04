import type { MissionTier } from "../lib/contract";

// TIER — how far the mission's output is trusted. Status chrome reflecting
// Mission.tier; never a control. Accent ramp only (rising intensity); the
// state palette (success/warn/verdict/danger) is reserved for run state.
const TIERS: { id: MissionTier; cls: string }[] = [
  { id: "concept", cls: "border-border-strong text-text-muted bg-surface-raised" },
  { id: "deterministic", cls: "border-text-primary text-text-primary" },
  { id: "grounded", cls: "border-accent-dim text-accent-dim" },
  { id: "sealed", cls: "border-accent text-accent" },
];

export default function TierStrip({ value }: { value: MissionTier }) {
  return (
    <div role="group" aria-label="Tier" className="flex items-center gap-2 text-xs">
      <span className="nx-up text-text-muted">Tier</span>
      {TIERS.map((t) => (
        <span key={t.id} aria-current={t.id === value}
          className={`rounded-full border px-2 py-0.5 ${t.id === value ? t.cls : "border-transparent text-text-muted"}`}>
          {t.id}
        </span>
      ))}
    </div>
  );
}
