"use client";

import { useState } from "react";
import type { VerticalStage } from "@/shell/contract";
import type { RunClock } from "@/shell/useRunClock";

// Composer shell. Local-only: sends append to an in-memory queue rendered
// above the input AND a CONNOR entry to the live run feed. NO network, NO
// storage — agent wire-up is Phase 2.

const CREW_BG: Record<VerticalStage["crew"][number]["color"], string> = {
  accent: "bg-accent",
  success: "bg-success",
  warn: "bg-warn",
  verdict: "bg-verdict",
  pending: "bg-pending",
};

export default function Composer({ stage, run }: { stage: VerticalStage; run: RunClock }) {
  const [text, setText] = useState("");
  const [queued, setQueued] = useState<string[]>([]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setQueued((q) => [...q, t]);
    run.addActivity(`CONNOR → ${stage.composerTarget}: ${t}`);
    setText("");
  };

  return (
    <div className="shrink-0 border-t border-border-subtle p-3">
      {queued.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1">
          {queued.map((m, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-md bg-surface-raised px-3 py-2 text-sm"
            >
              <span className="truncate text-text-primary">{m}</span>
              <span className="shrink-0 text-xs text-text-muted">queued — agent wire-up is Phase 2</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <span className="flex -space-x-2">
          {stage.crew.map((c) => (
            <span
              key={c.initial}
              className={`flex h-7 w-7 items-center justify-center rounded-full border border-border-strong text-xs ${CREW_BG[c.color]}`}
            >
              {c.initial}
            </span>
          ))}
        </span>
        <span className="rounded-full border border-accent px-2 py-1 font-mono text-xs text-accent">
          {stage.composerTarget}
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Message the team or describe a change…"
          className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-faint"
        />
        <button type="button" className="rounded-md border border-border-subtle px-3 py-1 text-sm text-text-muted">+</button>
        <button type="button" className="rounded-md border border-border-subtle px-3 py-1 text-sm text-text-muted">◎</button>
        <button type="button" onClick={send} className="rounded-md bg-accent px-3 py-1 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}
