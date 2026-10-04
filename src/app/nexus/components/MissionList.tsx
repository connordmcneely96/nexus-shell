import Link from "next/link";
import type { Mission } from "../lib/contract";

const MODE_NOTE: Record<Mission["mode"], string> = {
  guided: "Planner end-to-end",
  collaborative: "You and the agent together",
  advisory: "Discussion — a deliverable is optional",
};

// Every mission is a first-class row, whatever its mode or artifact count.
export default function MissionList({ missions, selectedId }: { missions: Mission[]; selectedId?: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {missions.map((m) => (
        <li key={m.id}>
          <Link href={`/nexus?m=${m.id}`} aria-current={m.id === selectedId}
            className={`block rounded-md border bg-surface-raised p-3 hover:border-border-strong ${
              m.id === selectedId ? "border-border-strong" : "border-border-subtle"}`}>
            <div className="text-sm text-text-primary">{m.title}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
              <span className="nx-up">{m.mode}</span>
              <span>· {MODE_NOTE[m.mode]}</span>
              <span className="ml-auto">{m.status}</span>
            </div>
            <div className="mt-1 text-xs text-text-muted">source: mission record</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
