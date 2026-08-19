import type { ReactNode } from "react";

// Telemetry stat tile — PURE PRESENTATION. It renders whatever label/value/sub
// it is given and NEVER computes. Accent-wash surface + a soft corner glow.
// Feed it OPERATIONAL values only (cost EST, cycle counts, run counts); never
// an engineering value — those stay in their honest blank/check form.
export default function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="nx-accent-wash relative overflow-hidden rounded-md border border-border-subtle p-3">
      <div className="nx-up text-xs text-text-faint">{label}</div>
      <div className="mt-1 text-lg text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(var(--nx-accent-rgb), 0.18), transparent 70%)" }}
      />
    </div>
  );
}
