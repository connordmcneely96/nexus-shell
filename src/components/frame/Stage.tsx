"use client";

import { useEffect, useState } from "react";
import { verticals } from "@/shell/verticals";
import StageHead from "./StageHead";
import Brain from "./Brain";

// Polymorphic center stage. Owns the current vertical, listens for
// 'nexus:set-vertical', renders head + mode tabs + placeholder panes + Brain.
// Panes are S4b — stubs labelled with the mode name only.

export default function Stage() {
  const [vid, setVid] = useState<"web" | "cad">("web");
  const stage = verticals.find((v) => v.id === vid)!;
  const [modeId, setModeId] = useState(stage.modes[0].id);

  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      const match = verticals.find((v) => v.id === id);
      if (match) {
        setVid(match.id);
        setModeId(match.modes[0].id);
      }
    };
    window.addEventListener("nexus:set-vertical", on);
    return () => window.removeEventListener("nexus:set-vertical", on);
  }, []);

  const mode = stage.modes.find((m) => m.id === modeId) ?? stage.modes[0];

  return (
    <div className="flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <StageHead stage={stage} />
        <div className="flex gap-1 border-b border-border-subtle px-4 py-2">
          {stage.modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModeId(m.id)}
              className={`rounded-md px-3 py-1 text-sm ${
                m.id === mode.id ? "border border-accent text-text-primary" : "text-text-muted"
              }`}
            >
              <span className="mr-2 text-text-faint">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
        <section className="flex flex-1 items-center justify-center text-sm text-text-faint">
          {`${mode.label} pane — S4b`}
        </section>
      </section>
      <Brain stage={stage} />
    </div>
  );
}
