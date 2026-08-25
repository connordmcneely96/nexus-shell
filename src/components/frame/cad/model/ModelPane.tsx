"use client";

import { useRef, useState } from "react";
import { workbench } from "@/mock/workbench";
import type { WorkbenchNode } from "@/mock/workbench";
import dynamic from "next/dynamic";
import ModelToolbar from "./ModelToolbar";
import SketchCanvas from "./SketchCanvas";
import type { Selection } from "./SketchCanvas";
import ConstraintBar from "./sketch/ConstraintBar";
import { solve } from "./sketch/solver";
import { closedLoops } from "./sketch/topology";
import type { Sketch, Constraint } from "./sketch/types";
import type { CamCommand, ViewKind } from "./Viewport";

// Decode base64 (from the extrude route) into an ArrayBuffer for GLTFLoader.
function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

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

// Human-readable reasons for a determinate extrude failure (never a silent nothing).
const EXTRUDE_REASON: Record<string, string> = {
  "profile-not-closed": "Close the sketch into a single loop before extruding.",
  "bad-depth": "Depth must be a number between 0.1 and 1000 mm.",
  "bad-sketch": "The sketch is empty or malformed.",
  "exec-not-configured": "The extrude service isn't configured.",
  "exec-unreachable": "Couldn't reach the extrude service.",
  "no-glb": "The build ran but produced no solid.",
  "extrude-failed": "The build failed in the sandbox.",
  network: "Network error contacting the extrude service.",
};

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
  // Sketch selection — points and/or segments — drives constraint authoring. A
  // single selected point also drives drag/delete. One useState, no store.
  const [selection, setSelection] = useState<Selection>({ pts: [], segs: [] });
  // Over-constrained is the sketch's infeasible: solve() returned converged=false.
  // We keep the best-effort geometry and surface the state, never hide it.
  const [overConstrained, setOverConstrained] = useState(false);
  // Extrude: user-supplied depth, the building state, the returned concept solid
  // (a GLB ArrayBuffer), and a determinate failure reason (never a silent swallow).
  const [depth, setDepth] = useState(10);
  const [extruding, setExtruding] = useState(false);
  const [glb, setGlb] = useState<ArrayBuffer | null>(null);
  const [extrudeError, setExtrudeError] = useState<{ error: string; stderr?: string } | null>(null);

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

  // Constraint ids are minted here (ModelPane persists across mode toggles).
  const conIdRef = useRef(0);
  const addConstraint = (make: (id: string) => Constraint) => {
    const c = make(`k${conIdRef.current++}`);
    applySketch({ ...sketch, cons: [...sketch.cons, c] });
  };
  const removeConstraint = (id: string) => {
    applySketch({ ...sketch, cons: sketch.cons.filter((c) => c.id !== id) });
  };

  const runView = (kind: ViewKind) =>
    setCamCommand((c) => ({ kind, seq: (c?.seq ?? 0) + 1 }));

  // Extrude is enabled ONLY on a real single closed loop (the S4c topology check,
  // reused). The server re-checks — the client gate is a courtesy, not the trust
  // boundary.
  const canExtrude = closedLoops(sketch).isClosedProfile;
  const runExtrude = async () => {
    if (!canExtrude || extruding) return;
    setExtruding(true);
    setExtrudeError(null);
    try {
      const res = await fetch("/api/sketch/extrude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sketch, depth }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.glbBase64) {
        setGlb(base64ToArrayBuffer(data.glbBase64));
        setMode("model"); // show the returned solid
      } else {
        setExtrudeError({ error: data.error ?? "extrude-failed", stderr: data.stderr });
      }
    } catch {
      setExtrudeError({ error: "network" });
    } finally {
      setExtruding(false);
    }
  };

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
        {mode === "sketch" && (
          <div className="border-b border-border-subtle px-5 py-2">
            <ConstraintBar
              sketch={sketch}
              selection={selection}
              onAddConstraint={addConstraint}
              onRemoveConstraint={removeConstraint}
            />
            {/* Extrude: enabled only on a real closed loop. Depth is USER input
                (◆ / text-accent), never grounded. */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono uppercase text-text-faint">Solid</span>
              <span className="text-accent" title="depth is user input, not grounded">◆</span>
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-16 rounded border border-border-subtle bg-surface-raised px-2 py-1 text-xs text-text-primary"
              />
              <span className="text-text-faint">mm depth</span>
              <button
                type="button"
                disabled={!canExtrude || extruding || !(depth >= 0.1 && depth <= 1000)}
                onClick={runExtrude}
                className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted disabled:opacity-40"
              >
                {extruding ? "building…" : "Extrude"}
              </button>
              {!canExtrude && <span className="text-text-faint">— close the profile to extrude</span>}
            </div>
          </div>
        )}
        {/* A failed extrude is a determinate "no" with a reason — the same
            discipline as infeasible / over-constrained — not a crash and not a
            silent nothing. Distinct by SHAPE (◇) and colour (verdict), dashed. */}
        {mode === "sketch" && extrudeError && (
          <div className="border-b border-dashed border-verdict bg-surface-raised px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-verdict">
              <span>◇</span> Extrude failed — {EXTRUDE_REASON[extrudeError.error] ?? extrudeError.error}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              A failed extrude is a determinate answer with a reason, not a crash.
            </p>
            {extrudeError.stderr && (
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-surface-overlay p-2 font-mono text-xs text-text-faint">
                {extrudeError.stderr}
              </pre>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1">
          {mode === "sketch" ? (
            <SketchCanvas
              sketch={sketch}
              onSketchChange={applySketch}
              selection={selection}
              onSelection={setSelection}
              overConstrained={overConstrained}
            />
          ) : (
            <Viewport
              command={camCommand}
              selected={selected}
              onSelect={setSelected}
              glbArrayBuffer={glb}
            />
          )}
        </div>
      </div>
    </div>
  );
}
