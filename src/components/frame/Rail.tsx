"use client";

import { useState } from "react";
import { RAIL_ITEMS, PRODUCTS, ACTIVE_SYSTEMS, type ProductStatus } from "@/nav/config";

// Rail v2 (client island — Products dropdown + vertical switching). All
// non-Products nav items are inert this sprint; rows only fire
// 'nexus:set-vertical' so the Stage can swap configs. Tokens only, no hex.

const setVertical = (id: string) =>
  window.dispatchEvent(new CustomEvent("nexus:set-vertical", { detail: { id } }));

const STATUS_CLASS: Record<ProductStatus, string> = {
  SHIPPED: "border-success text-success",
  BUILDING: "border-accent text-accent",
  DEV: "border-warn text-warn",
  PLANNED: "border-border-strong text-text-muted",
};

export default function Rail() {
  const [productsOpen, setProductsOpen] = useState(true);

  return (
    <nav
      className="flex shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-surface-raised p-3"
      style={{ width: "252px" }}
    >
      <ul className="flex flex-col gap-1">
        {RAIL_ITEMS.map((item) =>
          item.expandable ? (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setProductsOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-overlay hover:text-text-primary"
              >
                {item.label}
                <span className="font-mono text-xs text-text-faint">{productsOpen ? "▾" : "▸"}</span>
              </button>
              {productsOpen && (
                <ul className="mt-1 flex flex-col gap-1 pl-3">
                  {PRODUCTS.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setVertical(p.id)}
                        className="w-full rounded-md px-3 py-2 text-left hover:bg-surface-overlay"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm text-text-primary">{p.name}</span>
                          <span className={`shrink-0 rounded-full border px-2 text-xs ${STATUS_CLASS[p.status]}`}>
                            {p.status}
                          </span>
                        </span>
                        {p.sub && <span className="mt-1 block text-xs text-text-muted">{p.sub}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ) : item.id === "missions" ? (
            // The Missions item is live; every other non-Products item is inert.
            <li key={item.id}>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("nexus:show-missions"))}
                className="flex w-full items-center justify-between rounded-md border border-accent px-3 py-2 text-sm text-accent"
              >
                {item.label}
                {item.badge !== undefined && (
                  <span className="rounded-full bg-surface-overlay px-2 text-xs text-text-muted">{item.badge}</span>
                )}
              </button>
            </li>
          ) : (
            <li key={item.id}>
              <div
                aria-disabled="true"
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  item.active
                    ? "border border-accent text-accent"
                    : "text-text-muted"
                }`}
              >
                {item.label}
                {item.badge !== undefined && (
                  <span className="rounded-full bg-surface-overlay px-2 text-xs text-text-muted">{item.badge}</span>
                )}
              </div>
            </li>
          ),
        )}
      </ul>

      <div className="mt-6">
        <div className="px-3 text-xs tracking-wide text-text-muted">ACTIVE SYSTEMS</div>
        <ul className="mt-2 flex flex-col gap-1">
          {ACTIVE_SYSTEMS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setVertical(s.id)}
                className="w-full rounded-md px-3 py-2 text-left hover:bg-surface-overlay"
              >
                <span className="block truncate text-sm text-text-primary">{s.name}</span>
                <span className="block text-xs text-text-muted">{`${s.env} · ${s.agentCount} agents`}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
