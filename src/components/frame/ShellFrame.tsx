"use client";

import { useEffect, useRef } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import Rail from "./Rail";
import { shellLayout, useShellLayout, useIsNarrow } from "@/shell/useShellLayout";

// Outer resizable frame: Rail | stage region. layout.tsx stays a server
// component; this client island owns the PanelGroup. Sizes are pixels (this
// version supports numeric = px). Collapse state is mirrored to the in-memory
// store (never localStorage — forbidden here; no autoSaveId).

const RAIL = { default: 252, min: 200, max: 360, collapsed: 56 };

export default function ShellFrame({ children }: { children: React.ReactNode }) {
  const { railCollapsed } = useShellLayout();
  const isNarrow = useIsNarrow();
  const railRef = usePanelRef();
  const lastCollapsed = useRef(railCollapsed);

  // store -> panel: a toggle button flips railCollapsed; drive the panel.
  useEffect(() => {
    const p = railRef.current;
    if (!p) return;
    if (railCollapsed && !p.isCollapsed()) p.collapse();
    else if (!railCollapsed && p.isCollapsed()) p.expand();
  }, [railCollapsed, railRef]);

  // Below the breakpoint the Rail defaults collapsed; the user can still
  // toggle it open afterward (the store toggles keep working).
  useEffect(() => {
    if (isNarrow) shellLayout.setRailCollapsed(true);
  }, [isNarrow]);

  return (
    <Group orientation="horizontal" className="min-h-0 flex-1">
      <Panel
        panelRef={railRef}
        id="rail"
        collapsible
        collapsedSize={RAIL.collapsed}
        defaultSize={RAIL.default}
        minSize={RAIL.min}
        maxSize={RAIL.max}
        style={{ overflow: "hidden" }} // Rail owns its own internal scroll
        onResize={(size) => {
          // panel -> store: dragging past min collapses to the icon strip.
          const collapsed = size.inPixels <= RAIL.collapsed + 1;
          if (collapsed !== lastCollapsed.current) {
            lastCollapsed.current = collapsed;
            shellLayout.setRailCollapsed(collapsed);
          }
        }}
      >
        <Rail />
      </Panel>
      {/* Handle hides below the breakpoint (mobile-drawer seam); toggles still work. */}
      {!isNarrow && <Separator className="w-1 bg-border-subtle hover:bg-border-strong" />}
      {/* Stage region: full height, NO blanket scroll — panes own their scroll. */}
      <Panel id="stage" minSize={320} style={{ overflow: "hidden" }}>
        {children}
      </Panel>
    </Group>
  );
}
