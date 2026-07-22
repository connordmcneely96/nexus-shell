"use client";

import { useEffect, useRef, useState } from "react";
import { MachinedBlank } from "@/components/gadgets";

// Gate A inspection drawer. This slide-over IS closable (Escape + backdrop) —
// it is inspection, not a warning. Every value is a machined blank until the
// run completes; the comparison arithmetic is never summarized away. Focus
// returns to the trigger on close.

const OPEN_EVENT = "nexus:open-gate";

const ROWS: [string, string][] = [
  ["solved Ø", "<<dim>>"],
  ["measured Ø (GLB)", "<<dim>>"],
  ["|Δ| vs tolerance", "<<tol — pending>>"],
];

export default function GateDrawer() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = () => {
      triggerRef.current = (document.activeElement as HTMLElement) ?? null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" onClick={close}>
      <div className="absolute inset-0 bg-surface-base opacity-70" />
      <aside
        role="dialog"
        aria-label="Gate A — dimensional comparison"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full overflow-y-auto border-l border-border-strong bg-surface-overlay p-5"
        style={{ width: "420px" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-text-primary">Gate A — dimensional comparison</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-border-subtle px-2 py-1 text-xs text-text-muted"
          >
            Close
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {ROWS.map(([label, ph]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">{label}</span>
              <MachinedBlank>{ph}</MachinedBlank>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
            <span className="text-xs text-text-muted">verdict</span>
            <span className="rounded-full border border-pending px-2 py-1 text-xs text-pending">pending</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-text-faint">
          When the run completes, the pass/fail arithmetic renders here in mm — visible, auditable,
          never summarized away.
        </p>
      </aside>
    </div>
  );
}
