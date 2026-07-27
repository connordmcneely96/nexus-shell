"use client";

import type { Sketch, Pt } from "./sketch/types";

// SketchCanvas — a 2D SVG drafting surface. No Three.js, no camera trick; a clean
// 2D layer. The viewBox maps mm to SVG units with the origin centred; a group
// flips y so positive y renders upward (SVG y points down by default). Colours
// come from token classes via currentColor — no raw hex here (the WebGL hex
// exemption is Viewport.tsx only). Pan/zoom is not in this slice: a fixed extent.
//
// It fills its container (h-full root, svg 100%) exactly as the Viewport does, so
// it inherits a real height from the same min-h-0 flex-1 center region.

const EXTENT = 200; // mm half-extent; the canvas spans -EXTENT..EXTENT on both axes
const GRID = 20; // mm grid spacing

// Grid line positions across the extent.
const LINES: number[] = [];
for (let v = -EXTENT; v <= EXTENT; v += GRID) LINES.push(v);

function ptById(sketch: Sketch, id: string): Pt | undefined {
  return sketch.pts.find((p) => p.id === id);
}

export default function SketchCanvas({ sketch }: { sketch: Sketch }) {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <svg
          className="h-full w-full"
          viewBox={`${-EXTENT} ${-EXTENT} ${EXTENT * 2} ${EXTENT * 2}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* y-up: flip SVG's downward y so positive y renders upward */}
          <g transform="scale(1,-1)">
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

            {/* points */}
            <g className="text-accent" fill="currentColor">
              {sketch.pts.map((p) => (
                <circle key={p.id} cx={p.x} cy={p.y} r={2.5} />
              ))}
            </g>
          </g>
        </svg>
      </div>
      <div className="border-t border-border-subtle px-5 py-3 text-sm text-text-faint">
        Sketch plane {sketch.plane} — 2D draft, not constrained.
      </div>
    </div>
  );
}
