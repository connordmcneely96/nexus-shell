"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Sketch, Pt, Seg, Constraint } from "./sketch/types";
import { closedLoops } from "./sketch/topology";

// SketchCanvas — a 2D SVG drafting surface. No Three.js, no camera trick; a clean
// 2D layer. The viewBox maps mm to SVG units with the origin centred; a group
// flips y so positive y renders upward (SVG y points down by default). Colours
// come from token classes via currentColor — no raw hex here (the WebGL hex
// exemption is Viewport.tsx only). Pan/zoom is not in this slice: a fixed extent.
//
// Snapping is rounding to a grid — nothing more. There is no solver in this file;
// the solver is pure and lives in sketch/solver.ts, driven by ModelPane.

// A transient selection used for constraint authoring: points and/or segments.
export type Selection = { pts: string[]; segs: string[] };

const EXTENT = 200; // mm half-extent; the canvas spans -EXTENT..EXTENT on both axes
const GRID = 20; // mm grid spacing (visual)
const SNAP = 5; // mm placement grid
const CLOSE_TOL = 5; // mm; a click within this of the chain's first point closes it

const LINES: number[] = [];
for (let v = -EXTENT; v <= EXTENT; v += GRID) LINES.push(v);

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function ptById(sketch: Sketch, id: string): Pt | undefined {
  return sketch.pts.find((p) => p.id === id);
}

function segRefsPt(seg: Seg, id: string): boolean {
  if (seg.kind === "line") return seg.a === id || seg.b === id;
  if (seg.kind === "circle") return seg.c === id;
  return seg.c === id || seg.a === id || seg.b === id; // arc
}

// Does a constraint reference any removed point or segment? Used to prune dangling
// constraints when their geometry is deleted.
function conRefsRemoved(c: Constraint, rmPts: Set<string>, rmSegs: Set<string>): boolean {
  switch (c.kind) {
    case "horizontal":
    case "vertical":
      return rmSegs.has(c.seg);
    case "coincident":
      return rmPts.has(c.a) || rmPts.has(c.b);
    case "equal":
      return rmSegs.has(c.seg1) || rmSegs.has(c.seg2);
    case "distance":
      return rmPts.has(c.a) || rmPts.has(c.b);
    case "fixed":
      return rmPts.has(c.pt);
  }
}

// Toggle a member in a string list (used for building pairs via shift-click).
const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export default function SketchCanvas({
  sketch,
  onSketchChange,
  selection,
  onSelection,
  overConstrained,
}: {
  sketch: Sketch;
  // A `pinId` marks a transiently-dragged point so ModelPane's solve holds it
  // fixed and lets the rest of the sketch follow the user's lead.
  onSketchChange: (s: Sketch, pinId?: string | null) => void;
  selection: Selection;
  onSelection: (s: Selection) => void;
  overConstrained?: boolean;
}) {
  const gRef = useRef<SVGGElement>(null);
  const [chain, setChain] = useState<string[]>([]); // pt ids of the active polyline
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null); // snapped, sketch coords

  // Refs so the single keydown listener reads live state without re-registering.
  const sketchRef = useRef(sketch);
  sketchRef.current = sketch;
  const selRef = useRef(selection);
  selRef.current = selection;
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

  // Escape ends the current chain; Delete/Backspace removes the selected points,
  // their segments, and any constraints referencing them. Reads refs so it
  // registers once.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChain([]);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selRef.current.pts.length && !draggingRef.current) {
        e.preventDefault();
        const s = sketchRef.current;
        const rmPts = new Set(selRef.current.pts);
        const rmSegs = new Set(
          s.segs.filter((seg) => [...rmPts].some((id) => segRefsPt(seg, id))).map((seg) => seg.id),
        );
        onSketchChange({
          ...s,
          pts: s.pts.filter((p) => !rmPts.has(p.id)),
          segs: s.segs.filter((seg) => !rmSegs.has(seg.id)),
          cons: s.cons.filter((c) => !conRefsRemoved(c, rmPts, rmSegs)),
        });
        onSelection({ pts: [], segs: [] });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSketchChange, onSelection]);

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
    if (draggingRef.current) {
      const raw = toRaw(e.clientX, e.clientY);
      if (!raw) return;
      const id = draggingRef.current;
      const s = sketchRef.current;
      // Pin the dragged point so the solver follows it rather than fighting it.
      onSketchChange({ ...s, pts: s.pts.map((p) => (p.id === id ? { ...p, x: raw.x, y: raw.y } : p)) }, id);
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
    // any selection — we are drawing, not editing.
    onSelection({ pts: [], segs: [] });
    const pt: Pt = { id: gid("p"), x: p.x, y: p.y };
    const segs: Seg[] = chain.length
      ? [...sketch.segs, { id: gid("s"), kind: "line", a: chain[chain.length - 1], b: pt.id }]
      : sketch.segs;
    onSketchChange({ ...sketch, pts: [...sketch.pts, pt], segs });
    setChain([...chain, pt.id]);
  };

  // Select + (plain click) begin dragging a point; shift-click builds a pair. Only
  // when NOT mid-chain — while drawing, geometry stays transparent to the svg so a
  // click near the first point can close the loop.
  const onPtDown = (e: ReactPointerEvent, id: string) => {
    if (chain.length) return;
    e.stopPropagation();
    if (e.shiftKey) {
      onSelection({ pts: toggle(selRef.current.pts, id), segs: [] });
      return;
    }
    onSelection({ pts: [id], segs: [] });
    draggingRef.current = id;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onSegDown = (e: ReactPointerEvent, id: string) => {
    if (chain.length) return;
    e.stopPropagation();
    onSelection(
      e.shiftKey ? { pts: [], segs: toggle(selRef.current.segs, id) } : { pts: [], segs: [id] },
    );
  };
  // Swallow the click that follows a geometry interaction so the svg does not draw.
  const onGeomClick = (e: ReactMouseEvent) => {
    if (chain.length) return;
    e.stopPropagation();
  };

  // Upright glyph near a constraint's geometry. Rendered in an un-flipped overlay
  // (text at y = -sketchY), so it reads right-way-up. Glyphs carry shape, not just
  // colour — the same greyscale-safe discipline the tree uses.
  const segMid = (segId: string): { x: number; y: number } | null => {
    const seg = sketch.segs.find((s) => s.id === segId);
    if (!seg || seg.kind !== "line") return null;
    const a = ptById(sketch, seg.a);
    const b = ptById(sketch, seg.b);
    if (!a || !b) return null;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  const glyph = (key: string, at: { x: number; y: number } | null | undefined, text: string, cls: string) =>
    at ? (
      <text
        key={key}
        x={at.x}
        y={-at.y}
        fontSize={12}
        textAnchor="middle"
        dominantBaseline="central"
        className={cls}
        fill="currentColor"
      >
        {text}
      </text>
    ) : null;

  const clearSketch = () => {
    onSketchChange({ ...sketch, pts: [], segs: [], cons: [] });
    setChain([]);
    onSelection({ pts: [], segs: [] });
  };

  const selPtSet = new Set(selection.pts);
  const selSegSet = new Set(selection.segs);

  // Profile status from REAL topology (a graph walk), not a segs>=pts count. This
  // is what S5's extrude gate will read: only a single simple closed loop is
  // extrudable. When there is structure that is not a clean single loop (extra
  // loops or a junction/stub), say so — honest about WHY it is not extrudable.
  const topo = closedLoops(sketch);
  const status = chain.length
    ? "drawing…"
    : sketch.segs.length === 0
      ? "empty"
      : topo.isClosedProfile
        ? "closed profile"
        : topo.loopCount >= 1
          ? "open · not a single loop"
          : "open";

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

            {/* origin crosshair */}
            <g className="text-text-muted" stroke="currentColor">
              <line x1={-EXTENT} y1={0} x2={EXTENT} y2={0} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <line x1={0} y1={-EXTENT} x2={0} y2={EXTENT} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            </g>

            {/* line segments + wide invisible hit lines for selection */}
            {sketch.segs.map((s) => {
              if (s.kind !== "line") return null;
              const a = ptById(sketch, s.a);
              const b = ptById(sketch, s.b);
              if (!a || !b) return null;
              const sel = selSegSet.has(s.id);
              return (
                <g key={s.id} className="text-accent">
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth={sel ? 2.75 : 1.5} vectorEffect="non-scaling-stroke" />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth={10}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: chain.length ? "crosshair" : "pointer", pointerEvents: "stroke" }}
                    onPointerDown={(e) => onSegDown(e, s.id)}
                    onClick={onGeomClick}
                  />
                </g>
              );
            })}

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

            {/* selection rings */}
            {sketch.pts
              .filter((p) => selPtSet.has(p.id))
              .map((p) => (
                <circle key={`sel${p.id}`} className="text-accent" cx={p.x} cy={p.y} r={5} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              ))}

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
                  onClick={onGeomClick}
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

          {/* constraint glyphs — upright overlay (text at y = -sketchY) */}
          <g>
            {sketch.cons.map((c) => {
              switch (c.kind) {
                case "horizontal":
                  return glyph(c.id, segMid(c.seg), "═", "text-text-muted");
                case "vertical":
                  return glyph(c.id, segMid(c.seg), "‖", "text-text-muted");
                case "equal":
                  return (
                    <g key={c.id}>
                      {glyph(`${c.id}a`, segMid(c.seg1), "=", "text-text-muted")}
                      {glyph(`${c.id}b`, segMid(c.seg2), "=", "text-text-muted")}
                    </g>
                  );
                case "distance": {
                  const a = ptById(sketch, c.a);
                  const b = ptById(sketch, c.b);
                  const at = a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null;
                  // The typed dimension is USER input — text-accent, never grounded.
                  return glyph(c.id, at, `◆${c.d}`, "text-accent");
                }
                case "coincident":
                  return glyph(c.id, ptById(sketch, c.a), "⊙", "text-text-muted");
                case "fixed":
                  return glyph(c.id, ptById(sketch, c.pt), "⊠", "text-text-muted");
              }
            })}
          </g>
        </svg>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border-subtle px-5 py-3 text-sm text-text-faint">
        {/* A hand-drawn sketch is user-authored geometry — the tree's `user`
            provenance (◆, text-accent). The surface must not imply it is checked
            or grounded, so it says so plainly. */}
        <span className="flex items-center gap-2">
          <span className="text-accent">◆</span>
          Sketch plane {sketch.plane} — user-drawn · ungrounded · 2D draft.
        </span>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs">
            {sketch.pts.length} pts · {sketch.segs.length} segs · {sketch.cons.length} cons · {status}
          </span>
          {/* Over-constrained is a determinate answer — the constraints conflict —
              NOT a crash: the sketch analogue of an infeasible duty. Distinct by
              SHAPE (◇ diamond) as well as colour, per the greyscale-safe rule. */}
          {sketch.cons.length > 0 &&
            (overConstrained ? (
              <span className="flex items-center gap-1 font-mono text-xs text-verdict">
                <span>◇</span> over-constrained — constraints conflict
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-xs text-success">
                <span>●</span> solved
              </span>
            ))}
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
