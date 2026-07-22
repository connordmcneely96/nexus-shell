import type { FiveState } from "@/shell/contract";
import type { Mission } from "@/mock/missions";

// Mission cards. Part of Stage's client tree (imported by a client
// component), so no 'use client' directive of its own. Tokens only, no hex.

const STATUS_CLASS: Record<FiveState, string> = {
  pending: "border-solid border-pending text-pending",
  running: "border-solid border-accent text-accent",
  converged: "border-solid border-success text-success",
  infeasible: "border-dashed border-verdict text-verdict", // dashed: hue-independent
  failed: "border-solid border-danger text-danger",
};

const VERTICAL_BADGE: Record<Mission["vertical"], { letter: string; cls: string }> = {
  web: { letter: "W", cls: "border-accent text-accent" },
  cad: { letter: "C", cls: "border-success text-success" },
};

export default function MissionList({
  missions,
  onSelect,
}: {
  missions: Mission[];
  onSelect: (m: Mission) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-4 text-lg text-text-primary">Missions</h1>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {missions.map((m) => {
          const badge = VERTICAL_BADGE[m.vertical];
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full rounded-md border border-border-subtle bg-surface-raised p-4 text-left hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text-primary">{m.name}</span>
                    <span className="block text-xs text-text-muted">{m.client}</span>
                  </span>
                  <span className={`shrink-0 rounded-sm border px-2 text-xs ${badge.cls}`}>{badge.letter}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-2 py-1 text-xs ${STATUS_CLASS[m.status]}`}>{m.status}</span>
                  <span className="font-mono text-xs text-text-muted">
                    {`$${m.cost.toFixed(2)} · ${m.elapsed}s · ${m.runCount} runs`}
                  </span>
                </div>
                {m.status === "infeasible" && m.blockingConstraint && (
                  <div className="mt-2 text-xs text-verdict">{m.blockingConstraint}</div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
