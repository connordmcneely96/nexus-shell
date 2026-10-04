"use client";

import { useState } from "react";
import type { Workspace } from "../lib/contract";

export default function WorkspaceSwitcher({ workspaces }: { workspaces: Workspace[] }) {
  const [current, setCurrent] = useState(workspaces[0]?.id);
  return (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      <span className="nx-up">Workspace</span>
      <select
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="rounded-md border border-border-subtle bg-surface-raised px-2 py-1 text-sm text-text-primary"
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
    </label>
  );
}
