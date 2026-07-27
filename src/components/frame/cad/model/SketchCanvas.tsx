"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Sketch, Pt, Seg } from "./sketch/types";

// SketchCanvas — a 2D SVG drafting surface. No Three.js, no camera trick; a clean
// 2D layer. The viewBox maps mm to SVG units with the origin centred; a group
// flips y so positive y renders upward (SVG y points down by default). Colours
// come from token classes via currentColor — no raw hex here (the WebGL hex
// exemption is Viewport.tsx only). Pan/zoom is not in this slice: a fixed extent.
//
// Snapping is rounding to a grid — nothing more. There is no solver here; the
// constraint solver is S4b and out of scope.

const EXTENT = 200; // mm half-extent; the canvas spans -EXTENT..EXTENT on both axes
const GRID = 20; // mm grid spacing (visual)
const SNAP = 5; // mm placement grid
const CLOSE_TOL = 5; // mm; a click within this of the chain's first point closes it

// Grid line positions across the extent.
const LINES: number[] = [];
for (let v = -EXTENT; v <= EXTENT; v += GRID) LINES.push(v);

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function ptById(sketch: Sketch, id: string): Pt | undefined {
  return sketch.pts.find((p) => p.id === id);
}

// Does a segment reference this point id? (Covers every seg kind.)
function segRefsPt(seg: Seg, id: string): boolean {
  if (seg.kind === "line") return seg.a === id || seg.b === id;
  if (seg.kind === "circle") return seg.c === id;
  return seg.c === id || seg.a === id || seg.b === id; // arc
}

export default function SketchCanvas({
  sketch,
  onSketchChange,
  selectedPt,
  onSelectPt,
}: {
  sketch: Sketch;
  onSketchChange: (s: Sketch) => void;
  selectedPt: string | null;
  onSelectPt: (id: string | null) => void;
}) {
  const gRef = useRef<SVGGElement>(null);
  const [chain, setChain] = useState<string[]>([]); // pt ids of the active polyline
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null); // snapped, sketch coords

  // Refs so the single keydown listener reads live state without re-registering.
  const sketchRef = useRef(sketch);
  sketchRef.current = sketch;
  const selRef = useRef(selectedPt);
  selRef.current = selectedPt;
  const draggingRef = useRef<string | null>(null);

  // Stable id counter, seeded from the existing sketch so a remount does not
  // collide with persisted ids.
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) {
    const nums = [...sketch.pts, ...sketch.segs]
      .map((o) => parseInt(o.id.slice(1), 10))
      .filter((n) => !Number.isNaN(n));
    idRef.current = nums.length ? Math.max(...nums) + 1 : 0;
  }
  const gid = (prefix: string) => `${prefix}${idRef.current!++}`;

  // Escape ends the current chain; Delete/Backspace removes the selected point
  // and every segment referencing it. Reads refs so it registers once.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChain([]);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selRef.current && !draggingRef.current) {
        e.preventDefault();
        const id = selRef.current;
        const s = sketchRef.current;
        onSketchChange({
          ...s,
          pts: s.pts.filter((p) => p.id !== id),
          segs: s.segs.filter((seg) => !segRefsPt(seg, id)),
        });
        onSelectPt(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSketchChange, onSelectPt]);

  // Screen -> sketch coords via the flipped group's CTM (the y-flip is included).
  const toRaw = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const ctm = gRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  const toSnapped = (clientX: number, clientY: number) => {
    const p = toRaw(clientX, clientY);
    return p ? { x: snap(p.x), y: snap(p.y) } : null;
  };

  const firstChainPt = chain.length ? ptById(sketch, chain[0]) : undefined;
  const lastChainPt = chain.length ? ptById(sketch, chain[chain.length - 1]) : undefined;
  const canClose =
    chain.length >= 2 && !!cursor && !!firstChainPt && dist(cursor, firstChainPt) <= CLOSE_TOL;

  const handleMove = (e: ReactPointerEvent) => {
    // Dragging a point: move it freely (snap happens on release).
    if (draggingRef.current) {
      const raw = toRaw(e.clientX, e.clientY);
      if (!raw) return;
      const id = draggingRef.current;
      const s = sketchRef.current;
      onSketchChange({ ...s, pts: s.pts.map((p) => (p.id === id ? { ...p, x: raw.x, y: raw.y } : p)) });
      return;
    }
    const p = toSnapped(e.clientX, e.clientY);
    if (p) setCursor(p);
  };

  const handleUp = () => {
    const id = draggingRef.current;
    if (!id) return;
    draggingRef.current = null;
    const s = sketchRef.current;
    onSketchChange({
      ...s,
      pts: s.pts.map((p) => (p.id === id ? { ...p, x: snap(p.x), y: snap(p.y) } : p)),
    });
  };

  const handleClick = (e: ReactMouseEvent) => {
    // The second click of a double-click (detail === 2) ends the chain.
    if (e.detail >= 2) {
      setChain([]);
      return;
    }
    const p = toSnapped(e.clientX, e.clientY);
    if (!p) return;

    // Close the loop when clicking near the first point of the current chain.
    if (canClose && firstChainPt) {
      const seg: Seg = { id: gid("s"), kind: "line", a: chain[chain.length - 1], b: firstChainPt.id };
      onSketchChange({ ...sketch, segs: [...sketch.segs, seg] });
      setChain([]);
      return;
    }

    // Otherwise place a new point (starting or extending a chain). Placing clears
    // any point selection — we are drawing, not editing.
    onSelectPt(null);
    const pt: Pt = { id: gid("p"), x: p.x, y: p.y };
    const segs: Seg[] = chain.length
      ? [...sketch.segs, { id: gid("s"), kind: "line", a: chain[chain.length - 1], b: pt.id }]
      : sketch.segs;
    onSketchChange({ ...sketch, pts: [...sketch.pts, pt], segs });
    setChain([...chain, pt.id]);
  };

  // Select + begin dragging a point. Only when NOT mid-chain — while drawing,
  // points must stay transparent to the svg handler (so a click near the first
  // point can close the loop).
  const onPtDown = (e: ReactPointerEvent, id: string) => {
    if (chain.length) return;
    e.stopPropagation();
    onSelectPt(id);
    draggingRef.current = id;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  // Swallow the click that follows a point interaction so the svg does not also
  // place a new point on top of it.
  const onPtClick = (e: ReactMouseEvent) => {
    if (chain.length) return;
    e.stopPropagation();
  };

  const clearSketch = () => {
    onSketchChange({ ...sketch, pts: [], segs: [] });
    setChain([]);
    onSelectPt(null);
  };

  const selPt = selectedPt ? ptById(sketch, selectedPt) : undefined;
  const closed = sketch.pts.length >= 3 && sketch.segs.length >= sketch.pts.length;
  const status = chain.length ? "drawing…" : closed ? "closed profile" : "open";

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <svg
          className="h-full w-full cursor-crosshair"
          viewBox={`${-EXTENT} ${-EXTENT} ${EXTENT * 2} ${EXTENT * 2}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={() => setCursor(null)}
          onClick={handleClick}
        >
          <g ref={gRef} transform="scale(1,-1)">
            {/* grid */}
            <g className="text-border-subtle" stroke="currentColor" strokeOpacity={0.5}>
              {LINES.map((v) => (
                <line key={`v${v}`} x1={v} y1={-EXTENT} x2={v} y2={EXTENT} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
              ))}
              {LINES.map((v) => (
                <line key={`h${v}`} x1={-EXTENT} y1={v} x2={EXTENT} y2={v} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
              ))}
            </g>

            {/* origin crosshair — a subtle axis tint */}
            <g className="text-text-muted" stroke="currentColor">
              <line x1={-EXTENT} y1={0} x2={EXTENT} y2={0} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <line x1={0} y1={-EXTENT} x2={0} y2={EXTENT} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            </g>

            {/* committed line segments */}
            <g className="text-accent" stroke="currentColor">
              {sketch.segs.map((s) => {
                if (s.kind !== "line") return null;
                const a = ptById(sketch, s.a);
                const b = ptById(sketch, s.b);
                if (!a || !b) return null;
                return (
                  <line key={s.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                );
              })}
            </g>

            {/* rubber-band from the last placed point to the cursor */}
            {lastChainPt && cursor && (
              <line
                className="text-accent"
                stroke="currentColor"
                strokeOpacity={0.6}
                strokeDasharray="4 3"
                x1={lastChainPt.x}
                y1={lastChainPt.y}
                x2={cursor.x}
                y2={cursor.y}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* selection ring */}
            {selPt && (
              <circle
                className="text-accent"
                cx={selPt.x}
                cy={selPt.y}
                r={5}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* points — interactive for select/drag when not mid-chain */}
            <g className="text-accent" fill="currentColor">
              {sketch.pts.map((p) => (
                <circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  style={{ cursor: chain.length ? "crosshair" : "pointer" }}
                  onPointerDown={(e) => onPtDown(e, p.id)}
                  onClick={onPtClick}
                />
              ))}
            </g>

            {/* snap marker / close highlight */}
            {cursor && !draggingRef.current && (
              <circle
                className={canClose ? "text-success" : "text-text-muted"}
                cx={canClose && firstChainPt ? firstChainPt.x : cursor.x}
                cy={canClose && firstChainPt ? firstChainPt.y : cursor.y}
                r={canClose ? 5 : 3}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        </svg>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border-subtle px-5 py-3 text-sm text-text-faint">
        <span>Sketch plane {sketch.plane} — 2D draft, not constrained.</span>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs">
            {sketch.pts.length} pts · {sketch.segs.length} segs · {status}
          </span>
          <button
            type="button"
            onClick={clearSketch}
            className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted"
          >
            Clear sketch
          </button>
        </div>
      </div>
    </div>
  );
}
