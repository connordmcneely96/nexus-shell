"use client";

import { useState } from "react";
import { workbench } from "@/mock/workbench";
import type { WorkbenchNode } from "@/mock/workbench";
import dynamic from "next/dynamic";
import ModelToolbar from "./ModelToolbar";
import SketchCanvas from "./SketchCanvas";
import { solve } from "./sketch/solver";
import type { Sketch, Constraint } from "./sketch/types";
import type { CamCommand, ViewKind } from "./Viewport";

// Load the viewport lazily and client-only so Three.js is not pulled into the
// route's shared bundle — it splits into its own chunk fetched when the Model
// tab actually mounts. (The type-only import above is erased and pulls nothing.)
const Viewport = dynamic(() => import("./Viewport"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-text-faint">
      loading viewport…
    </div>
  ),
});

// Sketch is a MODE, not a CREATE op; the canvas is controlled from here.
const EMPTY_SKETCH: Sketch = { plane: "XY", pts: [], segs: [], cons: [] };

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
  // Sketch is a MODE that swaps the 3D viewport for the 2D SVG canvas in the same
  // region; the tree rail stays. Drawing is a view state, allowed in any tier.
  const [mode, setMode] = useState<"model" | "sketch">("model");
  const [sketch, setSketch] = useState<Sketch>(EMPTY_SKETCH);
  const [selectedPt, setSelectedPt] = useState<string | null>(null);
  // Over-constrained is the sketch's infeasible: solve() returned converged=false.
  // We keep the best-effort geometry and surface the state, never hide it.
  const [overConstrained, setOverConstrained] = useState(false);

  // Every sketch mutation runs the constraint solver when constraints exist.
  // `pinId` (a transiently dragged point) is added as a temporary fixed so the
  // user leads and the rest follows; it is stripped from the stored sketch.
  const applySketch = (next: Sketch, pinId?: string | null) => {
    if (next.cons.length === 0) {
      setSketch(next);
      setOverConstrained(false);
      return;
    }
    const cons: Constraint[] = pinId
      ? [...next.cons, { id: "__drag_pin__", kind: "fixed", pt: pinId }]
      : next.cons;
    const r = solve({ ...next, cons });
    setSketch({ ...r.sketch, cons: next.cons }); // keep user constraints, drop the transient pin
    setOverConstrained(!r.converged);
  };

  const runView = (kind: ViewKind) =>
    setCamCommand((c) => ({ kind, seq: (c?.seq ?? 0) + 1 }));

  // Distinct groups, in first-seen order. Derived inside the component (not at
  // module scope) so it recomputes once the document becomes dynamic in S3.
  const groups = workbench.nodes.reduce<string[]>((acc, n) => {
    if (!acc.includes(n.group)) acc.push(n.group);
    return acc;
  }, []);

  return (
    // The pane owns its own height and clips its own overflow, so a WebGL canvas
    // inside it keeps a real height even when the host (Stage.tsx) wraps every
    // pane in an overflow-y-auto scroll container. min-h-0 lets it shrink inside
    // that flex parent; overflow-hidden stops content from stretching the column.
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* left — stage-local tree rail */}
      <aside
        className="flex min-h-0 shrink-0 flex-col border-r border-border-subtle"
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
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border-subtle px-5 py-3">
          <ModelToolbar
            onView={runView}
            sketching={mode === "sketch"}
            onToggleSketch={() => setMode((m) => (m === "sketch" ? "model" : "sketch"))}
          />
        </div>
        <div className="min-h-0 flex-1">
          {mode === "sketch" ? (
            <SketchCanvas
              sketch={sketch}
              onSketchChange={applySketch}
              selectedPt={selectedPt}
              onSelectPt={setSelectedPt}
              overConstrained={overConstrained}
            />
          ) : (
            <Viewport command={camCommand} selected={selected} onSelect={setSelected} />
          )}
        </div>
      </div>
    </div>
  );
}
