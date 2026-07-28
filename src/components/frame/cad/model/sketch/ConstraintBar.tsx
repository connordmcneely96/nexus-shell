"use client";

import { useState } from "react";
import type { Sketch, Constraint } from "./types";
import type { Selection } from "../SketchCanvas";

// ConstraintBar — the sketch-mode authoring toolbar. It reads the current
// selection (points and/or segments) and offers the constraints that selection
// enables, plus a list of active constraints with per-constraint removal.
//
// A distance is a USER-TYPED dimension: its input is marked with the tree's `user`
// glyph (◆, text-accent) — honest as user input, never presented as grounded or
// solver-produced. Geometric constraints carry no number.

function Btn({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs disabled:opacity-40 ${
        active ? "border-accent text-accent" : "border-border-subtle text-text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function conLabel(c: Constraint): { glyph: string; text: string; accent?: boolean } {
  switch (c.kind) {
    case "horizontal":
      return { glyph: "═", text: "horizontal" };
    case "vertical":
      return { glyph: "‖", text: "vertical" };
    case "coincident":
      return { glyph: "⊙", text: "coincident" };
    case "equal":
      return { glyph: "=", text: "equal" };
    case "distance":
      return { glyph: "◆", text: `${c.d}mm`, accent: true };
    case "fixed":
      return { glyph: "⊠", text: "pin" };
  }
}

export default function ConstraintBar({
  sketch,
  selection,
  onAddConstraint,
  onRemoveConstraint,
}: {
  sketch: Sketch;
  selection: Selection;
  onAddConstraint: (make: (id: string) => Constraint) => void;
  onRemoveConstraint: (id: string) => void;
}) {
  const [dVal, setDVal] = useState("");

  const oneSeg = selection.segs.length === 1;
  const twoSegs = selection.segs.length === 2;
  const twoPts = selection.pts.length === 2;
  const onePt = selection.pts.length === 1;
  const pinId = onePt ? selection.pts[0] : null;
  const pinCon = pinId ? sketch.cons.find((c) => c.kind === "fixed" && c.pt === pinId) : undefined;

  const applyDistance = () => {
    const d = parseFloat(dVal);
    if (!Number.isFinite(d) || d < 0 || !twoPts) return;
    const [a, b] = selection.pts;
    onAddConstraint((id) => ({ id, kind: "distance", a, b, d }));
    setDVal("");
  };

  const togglePin = () => {
    if (!pinId) return;
    if (pinCon) onRemoveConstraint(pinCon.id);
    else onAddConstraint((id) => ({ id, kind: "fixed", pt: pinId }));
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      <span className="font-mono uppercase text-text-faint">Constrain</span>

      <div className="flex items-center gap-1">
        <Btn
          label="═ Horizontal"
          disabled={!oneSeg}
          onClick={() => onAddConstraint((id) => ({ id, kind: "horizontal", seg: selection.segs[0] }))}
        />
        <Btn
          label="‖ Vertical"
          disabled={!oneSeg}
          onClick={() => onAddConstraint((id) => ({ id, kind: "vertical", seg: selection.segs[0] }))}
        />
        <Btn
          label="⊙ Coincident"
          disabled={!twoPts}
          onClick={() =>
            onAddConstraint((id) => ({ id, kind: "coincident", a: selection.pts[0], b: selection.pts[1] }))
          }
        />
        <Btn
          label="= Equal"
          disabled={!twoSegs}
          onClick={() =>
            onAddConstraint((id) => ({ id, kind: "equal", seg1: selection.segs[0], seg2: selection.segs[1] }))
          }
        />
        <Btn label="⊠ Pin" disabled={!onePt} active={!!pinCon} onClick={togglePin} />
      </div>

      {/* Distance — a typed dimension is USER input, marked ◆ / text-accent. */}
      <div className="flex items-center gap-1" title="Typed dimension — user input, not grounded">
        <span className="text-accent">◆</span>
        <input
          type="number"
          value={dVal}
          onChange={(e) => setDVal(e.target.value)}
          placeholder="mm"
          className="w-16 rounded border border-border-subtle bg-surface-raised px-2 py-1 text-xs text-text-primary"
        />
        <Btn
          label="Distance"
          disabled={!twoPts || !Number.isFinite(parseFloat(dVal))}
          onClick={applyDistance}
        />
      </div>

      {/* Active constraints with per-constraint removal. */}
      {sketch.cons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {sketch.cons.map((c) => {
            const l = conLabel(c);
            return (
              <span
                key={c.id}
                className="flex items-center gap-1 rounded-full border border-border-subtle px-2 py-1 text-text-muted"
              >
                <span className={l.accent ? "text-accent" : "text-text-muted"}>{l.glyph}</span>
                {l.text}
                <button
                  type="button"
                  aria-label="remove constraint"
                  onClick={() => onRemoveConstraint(c.id)}
                  className="ml-1 text-text-faint"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
