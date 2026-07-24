// Model toolbar — VIEW and INSPECT are live affordances (wired in a later
// sprint); CREATE is deliberately inert. In this tier the deterministic solver
// owns geometry, so the creation ops render disabled with an explicit label.
// This is STATIC in S1: there is no tier switch and no tier state — the switch
// and its enforcement contract tests are S7. Shipping the affordance without
// the enforcement is exactly the failure mode we are avoiding, so no button
// does anything and there are no onClick handlers here.
//
// The CREATE ops carry the native `disabled` attribute, NOT pointer-events-none
// alone: a safety-relevant affordance must be out of the tab order and inert to
// the keyboard, not merely deaf to the mouse. S7 wires tier enforcement to this
// same container, so the gate has to be real from the start.

import type { ViewKind } from "./Viewport";

const VIEW: { label: string; kind: ViewKind }[] = [
  { label: "Front", kind: "front" },
  { label: "Top", kind: "top" },
  { label: "Right", kind: "right" },
  { label: "Iso", kind: "iso" },
];
const INSPECT = ["Section", "Isolate", "Measure", "Compare rev"];
const CREATE = ["Box", "Cylinder", "Sketch", "Boolean", "Fillet"];

// A toolbar op button. `onClick` is only supplied for live ops; inert groups
// (INSPECT this slice) pass none, disabled groups (CREATE) pass `disabled`.
function Op({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted"
    >
      {label}
    </button>
  );
}

function Group({ label, ops, disabled }: { label: string; ops: string[]; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs uppercase text-text-faint">{label}</span>
      {ops.map((op) => (
        <Op key={op} label={op} disabled={disabled} />
      ))}
    </div>
  );
}

export default function ModelToolbar({ onView }: { onView?: (kind: ViewKind) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs uppercase text-text-faint">View</span>
        {VIEW.map((v) => (
          <Op key={v.kind} label={v.label} onClick={() => onView?.(v.kind)} />
        ))}
        <Op label="Fit" onClick={() => onView?.("fit")} />
      </div>
      <Group label="Inspect" ops={INSPECT} />
      <div className="flex items-center gap-4 opacity-40">
        <Group label="Create" ops={CREATE} disabled />
        <span className="font-mono text-xs uppercase text-text-faint">
          Solver owns geometry in this tier
        </span>
      </div>
    </div>
  );
}
