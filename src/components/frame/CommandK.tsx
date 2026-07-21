"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { groups } from "@/nav/config";

// Command palette. Groups and Tokens navigate; tools are findable but NOT
// reachable — selecting one flashes its Phase 2 chip and goes nowhere.

type Entry =
  | { kind: "route"; key: string; label: string; hint: string; href: string }
  | { kind: "tool"; key: string; label: string; hint: string };

const ENTRIES: Entry[] = [
  ...groups.map((g) => ({
    kind: "route" as const, key: `g-${g.id}`, label: g.label, hint: `/g/${g.id}`, href: `/g/${g.id}`,
  })),
  ...groups.flatMap((g) =>
    g.tools.map((t) => ({ kind: "tool" as const, key: `t-${t.slug}`, label: t.label, hint: t.slug })),
  ),
  { kind: "route", key: "tokens", label: "Tokens", hint: "/tokens", href: "/tokens" },
];

const OPEN_EVENT = "nx-commandk-open";

// The topbar omnibar — opens the palette via the existing event.
export function Omnibar() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-raised px-3 py-1 text-sm text-text-muted"
      style={{ maxWidth: "560px" }}
    >
      <span className="truncate">Ask, search, create, run, deploy…</span>
      {/* text-faint: decorative shortcut ornament */}
      <span className="rounded-sm border border-border-subtle px-2 font-mono text-xs text-text-faint">⌘K</span>
    </button>
  );
}

export default function CommandK() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = () => { setOpen(true); setQuery(""); setSel(0); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, []);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const list = ENTRIES.filter(
    (e) => e.label.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q),
  );
  const selIdx = Math.min(sel, Math.max(list.length - 1, 0));

  const activate = (entry: Entry) => {
    if (entry.kind === "route") {
      setOpen(false);
      router.push(entry.href);
    } else {
      setFlashKey(entry.key);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashKey(null), 450);
    }
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (list.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((selIdx + 1) % list.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((selIdx - 1 + list.length) % list.length); }
    else if (e.key === "Enter") activate(list[selIdx]);
  };

  return (
    <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-surface-base opacity-70" />
      <div
        className="relative mx-auto mt-24 w-full rounded-lg border border-border-strong bg-surface-overlay p-2"
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSel(0); }}
          onKeyDown={onInputKey}
          placeholder="Search groups and tools…"
          className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-faint"
        />
        <ul className="mt-2 max-h-80 overflow-y-auto">
          {list.map((entry, i) => (
            <li key={entry.key}>
              <button
                type="button"
                onClick={() => activate(entry)}
                className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm ${
                  i === selIdx ? "border-accent" : "border-transparent"
                }`}
              >
                <span className="text-text-primary">{entry.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-faint">{entry.hint}</span>
                  {entry.kind === "tool" && (
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        flashKey === entry.key
                          ? "border-accent text-accent"
                          : "border-border-subtle text-text-muted"
                      }`}
                    >
                      Phase 2
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-2 text-sm text-text-muted">No matches</li>}
        </ul>
      </div>
    </div>
  );
}
