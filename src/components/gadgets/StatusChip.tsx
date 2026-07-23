import type { FiveState } from "@/shell/contract";

// The ONE source of truth for the five run-states. No other file may render an
// ad-hoc status chip. infeasible is separated from failed by THREE
// hue-independent signals: border (dashed vs solid), marker shape (diamond vs
// square), and label text — a deuteranopic reviewer distinguishes them in
// greyscale. Marker colour is currentColor (the state token); no raw hex.

type Marker = "round" | "diamond" | "square";

const SPEC: Record<FiveState, { border: string; color: string; marker: Marker }> = {
  pending: { border: "border-dotted border-pending", color: "text-pending", marker: "round" },
  running: { border: "border-solid border-accent", color: "text-accent", marker: "round" },
  converged: { border: "border-solid border-success", color: "text-success", marker: "round" },
  infeasible: { border: "border-dashed border-verdict", color: "text-verdict", marker: "diamond" },
  failed: { border: "border-solid border-danger", color: "text-danger", marker: "square" },
};

const MARKER_SHAPE: Record<Marker, string> = {
  round: "rounded-full",
  diamond: "rotate-45", // a rotated square reads as a diamond
  square: "",
};

export default function StatusChip({
  state,
  detail,
  pulse,
}: {
  state: FiveState;
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
        style={{ backgroundColor: "currentColor" }}
      />
      <span className="font-mono uppercase">{state}</span>
      {detail && <span className="font-mono">{detail}</span>}
    </span>
  );
}
