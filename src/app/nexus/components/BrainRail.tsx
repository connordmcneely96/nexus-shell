import type { AgentRailState } from "../lib/contract";

// Persistent Brain rail. Agent state colors are the shared status roles.
const STATE_CLASS: Record<AgentRailState["state"], string> = {
  idle: "text-pending", pending: "text-pending", running: "text-accent", converged: "text-success",
  infeasible: "text-verdict", failed: "text-danger", exhausted: "text-warn",
};

export default function BrainRail({ agents }: { agents: AgentRailState[] }) {
  return (
    <aside aria-label="Brain" className="flex w-64 shrink-0 flex-col border-l border-border-subtle bg-surface-raised">
      <div className="border-b border-border-subtle p-4 nx-up text-xs text-text-muted">Brain</div>
      <ul className="flex-1 overflow-y-auto p-3">
        {agents.map((a) => (
          <li key={a.agent_id} className="mb-2 rounded-md border border-border-subtle p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-text-primary">{a.name}</span>
              <span className={`font-mono text-xs ${STATE_CLASS[a.state]}`}>{a.state}</span>
            </div>
            <div className="mt-1 text-xs text-text-muted">{a.role}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
