"use client";

import { useState } from "react";
import { workbench } from "@/mock/workbench";
import type { WorkbenchNode } from "@/mock/workbench";
import ModelToolbar from "./ModelToolbar";
import Viewport from "./Viewport";
import type { CamCommand, ViewKind } from "./Viewport";

// Model — the parametric-document stage. Three regions: a stage-local tree
// rail (left), a toolbar strip and a viewport area (center). The rail lives
// INSIDE this pane; the shell Rail is untouched. S1 renders the document tree
// and its provenance; the viewport arrives in a later sprint.

// Provenance glyphs carry BOTH colour and shape, so a reviewer distinguishes
// them in greyscale — the same rule StatusChip follows for the five states.
type Provenance = WorkbenchNode["provenance"];
const GLYPH: Record<Provenance, { mark: string; color: string; label: string }> = {
  calc: { mark: "●", color: "text-success", label: "calc" },
  user: { mark: "◆", color: "text-accent", label: "user" },
  assumption: { mark: "▲", color: "text-warn", label: "assumption" },
  llm: { mark: "◇", color: "text-verdict", label: "llm" },
  overridden: { mark: "✕", color: "text-danger", label: "overridden" },
};

export default function ModelPane() {
  const [selected, setSelected] = useState<string | null>(null);
  // Camera commands live here (lifted out of Viewport). Bumping seq gives each
  // click a fresh identity so re-clicking the same view re-fires.
  const [camCommand, setCamCommand] = useState<CamCommand | null>(null);
  const runView = (kind: ViewKind) =>
    setCamCommand((c) => ({ kind, seq: (c?.seq ?? 0) + 1 }));

  // Distinct groups, in first-seen order. Derived inside the component (not at
  // module scope) so it recomputes once the document becomes dynamic in S3.
  const groups = workbench.nodes.reduce<string[]>((acc, n) => {
    if (!acc.includes(n.group)) acc.push(n.group);
    return acc;
  }, []);

  return (
    <div className="flex h-full">
      {/* left — stage-local tree rail */}
      <aside
        className="flex shrink-0 flex-col border-r border-border-subtle"
        style={{ width: 264 }}
      >
        <header className="border-b border-border-subtle px-5 py-3">
          <h2 className="font-mono text-xs uppercase text-text-muted">Model tree</h2>
        </header>

        <div className="flex-1 overflow-y-auto py-3">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              <div className="px-5 pb-1 font-mono text-xs uppercase text-text-faint">{group}</div>
              {workbench.nodes
                .filter((n) => n.group === group)
                .map((n) => {
                  const g = GLYPH[n.provenance];
                  const active = selected === n.nodeId;
                  return (
                    <button
                      key={n.nodeId}
                      type="button"
                      title={n.citation ?? undefined}
                      aria-pressed={active}
                      onClick={() => setSelected(n.nodeId)}
                      className={`flex w-full items-center gap-4 border-l-2 px-5 py-3 text-left ${
                        active ? "border-accent bg-surface-overlay" : "border-transparent"
                      }`}
                    >
                      <span className={`${g.color} text-xs`}>{g.mark}</span>
                      <span className="flex-1 truncate text-sm text-text-primary">{n.label}</span>
                      <span className="font-mono text-xs text-text-faint">{n.value}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* legend — all five provenance states */}
        <footer className="border-t border-border-subtle px-5 py-3">
          <div className="flex flex-wrap gap-4">
            {Object.values(GLYPH).map((g) => (
              <span key={g.label} className="flex items-center gap-1 text-xs text-text-muted">
                <span className={g.color}>{g.mark}</span>
                {g.label}
              </span>
            ))}
          </div>
        </footer>
      </aside>

      {/* center — toolbar strip over viewport */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-border-subtle px-5 py-3">
          <ModelToolbar onView={runView} />
        </div>
        <div className="min-h-0 flex-1">
          <Viewport command={camCommand} selected={selected} onSelect={setSelected} />
        </div>
      </div>
    </div>
  );
}
