import type { BadgeState } from "@/shell/contract";

// The ONE source of truth for the badge vocabulary. No other file may render an
// ad-hoc status chip. FOUR marker shapes now separate the outcome states with
// hue-independent signals: infeasible = diamond, failed = square, exhausted =
// gold triangle — each greyscale-distinct from the others (marker shape +
// border style + label). Marker colour is currentColor (the state token); no
// raw hex. The triangle uses clip-path geometry, not a rotation.

type Marker = "round" | "diamond" | "square" | "triangle";

const SPEC: Record<BadgeState, { border: string; color: string; marker: Marker }> = {
  pending: { border: "border-dotted border-pending", color: "text-pending", marker: "round" },
  running: { border: "border-solid border-accent", color: "text-accent", marker: "round" },
  converged: { border: "border-solid border-success", color: "text-success", marker: "round" },
  infeasible: { border: "border-dashed border-verdict", color: "text-verdict", marker: "diamond" },
  failed: { border: "border-solid border-danger", color: "text-danger", marker: "square" },
  exhausted: { border: "border-solid border-warn", color: "text-warn", marker: "triangle" }, // warn = gold; not danger, not verdict
};

const MARKER_SHAPE: Record<Marker, string> = {
  round: "rounded-full",
  diamond: "rotate-45", // a rotated square reads as a diamond
  square: "",
  triangle: "", // shape comes from clip-path (below), not a class
};

export default function StatusChip({
  state,
  detail,
  pulse,
}: {
  state: BadgeState;
  detail?: string;
  pulse?: boolean;
}) {
  const s = SPEC[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${s.border} ${s.color}`}
    >
      <span
        className={`inline-block h-2 w-2 ${MARKER_SHAPE[s.marker]} ${pulse ? "animate-pulse" : ""}`}
        style={{
          backgroundColor: "currentColor",
          ...(s.marker === "triangle"
            ? { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }
            : {}),
        }}
      />
      <span className="font-mono uppercase">{state}</span>
      {detail && <span className="font-mono">{detail}</span>}
    </span>
  );
}
