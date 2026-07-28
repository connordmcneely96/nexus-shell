import type { BadgeState } from "@/shell/contract";
import StatusChip from "@/components/gadgets/StatusChip";

// Mission cards. A shared view-model renders both the LIVE CAD summaries and the
// MOCK web missions through one shape — web is NOT forced through the live path.
// Part of Stage's client tree, so no 'use client' directive of its own.

export interface MissionCard {
  id: string; // runId (cad) or mission id (web)
  vertical: "web" | "cad";
  name: string;
  subtitle?: string;
  status: BadgeState;
  opsLine: string;
  blockingConstraint?: string;
}

const VERTICAL_BADGE: Record<MissionCard["vertical"], { letter: string; cls: string }> = {
  web: { letter: "W", cls: "border-accent text-accent" },
  cad: { letter: "C", cls: "border-success text-success" },
};

export default function MissionList({
  cards,
  onSelect,
}: {
  cards: MissionCard[];
  onSelect: (card: MissionCard) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-4 text-lg text-text-primary">Missions</h1>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {cards.map((c) => {
          const badge = VERTICAL_BADGE[c.vertical];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="w-full rounded-md border border-border-subtle bg-surface-raised p-4 text-left hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text-primary">{c.name}</span>
                    {c.subtitle && <span className="block truncate text-xs text-text-muted">{c.subtitle}</span>}
                  </span>
                  <span className={`shrink-0 rounded-sm border px-2 text-xs ${badge.cls}`}>{badge.letter}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusChip state={c.status} pulse={c.status === "running"} />
                  <span className="font-mono text-xs text-text-muted">{c.opsLine}</span>
                </div>
                {c.blockingConstraint && (
                  <div className="mt-2 line-clamp-2 text-xs text-verdict">{c.blockingConstraint}</div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
