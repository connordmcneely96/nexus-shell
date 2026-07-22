"use client";

import { useState } from "react";
import type { VerticalStage } from "@/shell/contract";

// System Brain — Context / Agents / Activity, rendered entirely from
// stage.brain. The invariant card is pinned at the bottom, always visible.

const TABS = ["Context", "Agents", "Activity"] as const;

const AGENT_STATE_CLASS: Record<string, string> = {
  pending: "text-pending", running: "text-accent", converged: "text-success",
  infeasible: "text-verdict", failed: "text-danger",
  done: "text-success", waiting: "text-pending",
};

export default function Brain({ stage }: { stage: VerticalStage }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Context");
  const b = stage.brain;

  return (
    <aside
      className="flex shrink-0 flex-col overflow-y-auto border-l border-border-subtle bg-surface-raised"
      style={{ width: "320px" }}
    >
      <div className="border-b border-border-subtle p-4">
        <div className="text-sm text-text-primary">{b.title}</div>
        <div className="mt-1 text-xs text-text-muted">{b.desc}</div>
      </div>
      <div className="flex gap-1 border-b border-border-subtle p-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-sm ${
              tab === t ? "border border-accent text-text-primary" : "text-text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 p-3">
        {tab === "Context" && (
          <div>
            <dl className="mb-3">
              {b.kv.map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 text-xs">
                  <dt className="text-text-muted">{k}</dt>
                  <dd className="text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
            {b.context.map((c) => (
              <div key={c.name} className="flex items-center gap-2 rounded-md px-2 py-2">
                <span className="text-text-faint">{c.icon}</span>
                <span className="font-mono text-xs text-text-primary">{c.name}</span>
                <span className="ml-auto text-xs text-text-muted">{c.sub}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "Agents" &&
          b.agents.map((a) =>
            a.code === "CAD-REVIEWER" ? (
              // The reviewer row opens the Gate A dimensional-comparison drawer.
              <button
                key={a.code}
                type="button"
                onClick={() => window.dispatchEvent(new Event("nexus:open-gate"))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-surface-overlay"
              >
                <span className="font-mono text-xs text-text-primary">{a.code}</span>
                <span className="text-xs text-text-muted">{a.role}</span>
                <span className={`ml-auto text-xs ${AGENT_STATE_CLASS[a.state]}`}>{a.state}</span>
              </button>
            ) : (
              <div key={a.code} className="flex items-center gap-2 rounded-md px-2 py-2">
                <span className="font-mono text-xs text-text-primary">{a.code}</span>
                <span className="text-xs text-text-muted">{a.role}</span>
                <span className={`ml-auto text-xs ${AGENT_STATE_CLASS[a.state]}`}>{a.state}</span>
              </div>
            ),
          )}
        {tab === "Activity" &&
          b.activity.map((a) => (
            <div key={`${a.t}-${a.text}`} className="flex gap-2 px-2 py-2">
              <span className="shrink-0 font-mono text-xs text-text-faint">{a.t}</span>
              <span className="text-xs text-text-muted">{a.text}</span>
            </div>
          ))}
      </div>
      <div className="border-t border-border-subtle p-3">
        <div className="rounded-md border border-border-strong bg-surface-overlay p-3 text-xs text-text-muted">
          A surface never renders a value the pipeline did not produce.
        </div>
      </div>
    </aside>
  );
}
