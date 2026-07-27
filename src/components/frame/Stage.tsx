"use client";

import { useEffect, useRef, useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { verticals } from "@/shell/verticals";
import { missions, type Mission } from "@/mock/missions";
import { useRunClock } from "@/shell/useRunClock";
import { shellLayout, useShellLayout, useIsNarrow } from "@/shell/useShellLayout";
import StageHead from "./StageHead";
import Brain from "./Brain";
import Composer from "./Composer";
import MissionList from "./MissionList";
import CadPanes from "./cad/CadPanes";
import GateDrawer from "./GateDrawer";

const BRAIN = { default: 320, min: 260, max: 460, collapsed: 0 };

// Polymorphic center stage. Owns view + vertical + selected mission. Default
// view is the Missions list. Selecting a mission drives the StageHead chip
// (status/blockingConstraint), so the infeasible mission shows the infeasible
// chip — not the vertical's default running state. Panes are S4b stubs still.

export default function Stage() {
  const [view, setView] = useState<"missions" | "mission">("missions");
  const [vid, setVid] = useState<"web" | "cad">("web");
  const [missionId, setMissionId] = useState<string | null>(null);
  const base = verticals.find((v) => v.id === vid)!;
  const [modeId, setModeId] = useState(base.modes[0].id);

  useEffect(() => {
    const openMission = (id: string) => {
      const m = missions.find((x) => x.id === id);
      if (!m) return;
      const v = verticals.find((x) => x.id === m.vertical)!;
      setVid(v.id);
      setMissionId(m.id);
      setModeId(v.modes[0].id);
      setView("mission");
    };
    const onShow = () => setView("missions");
    const onOpen = (e: Event) => openMission((e as CustomEvent<{ id?: string }>).detail?.id ?? "");
    const onSetVertical = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      const v = verticals.find((x) => x.id === id);
      if (!v) return;
      setVid(v.id);
      setMissionId(null);
      setModeId(v.modes[0].id);
      setView("mission");
    };
    window.addEventListener("nexus:show-missions", onShow);
    window.addEventListener("nexus:open-mission", onOpen);
    window.addEventListener("nexus:set-vertical", onSetVertical);
    return () => {
      window.removeEventListener("nexus:show-missions", onShow);
      window.removeEventListener("nexus:open-mission", onOpen);
      window.removeEventListener("nexus:set-vertical", onSetVertical);
    };
  }, []);

  const selectMission = (m: Mission) => {
    const v = verticals.find((x) => x.id === m.vertical)!;
    setVid(v.id);
    setMissionId(m.id);
    setModeId(v.modes[0].id);
    setView("mission");
  };

  const selected = missionId ? missions.find((m) => m.id === missionId) : null;
  const stage = selected
    ? {
        ...base,
        crumb: [...base.crumb.slice(0, -1), selected.name],
        status: selected.status,
        statusDetail:
          selected.status === "running"
            ? base.statusDetail
            : selected.status === "infeasible" && selected.cycle !== undefined
              ? `stopped · cycle ${selected.cycle} of ${selected.maxCycles}`
              : undefined,
      }
    : base;
  const mode = stage.modes.find((m) => m.id === modeId) ?? stage.modes[0];

  // The active run: the running CAD mission. The clock only ticks when live.
  const isLiveRun = view === "mission" && stage.id === "cad" && stage.status === "running";
  const run = useRunClock(isLiveRun);
  // StageHead statusDetail reads the live cycle for the running CAD mission.
  const headStage = isLiveRun ? { ...stage, statusDetail: `CYCLE ${run.cycle}/20` } : stage;

  // Per-vertical default: CAD opens Brain-collapsed (the viewport needs room),
  // web opens it open. Below the breakpoint Brain also defaults collapsed. Both
  // are DEFAULTS — a manual toggle this session overrides them.
  const { brainCollapsed } = useShellLayout();
  const isNarrow = useIsNarrow();
  useEffect(() => {
    shellLayout.applyBrainDefault(isNarrow || stage.id === "cad");
  }, [stage.id, isNarrow]);

  // store <-> Brain panel sync (mirrors the Rail wiring in ShellFrame).
  const brainRef = usePanelRef();
  const lastBrainCollapsed = useRef(brainCollapsed);
  useEffect(() => {
    const p = brainRef.current;
    if (!p) return;
    if (brainCollapsed && !p.isCollapsed()) p.collapse();
    else if (!brainCollapsed && p.isCollapsed()) p.expand();
  }, [brainCollapsed, brainRef]);

  const isModel = stage.id === "cad" && mode.id === "model";

  return (
    <>
      <Group orientation="horizontal" className="h-full min-h-0">
        <Panel id="stage-main" minSize={360} style={{ overflow: "hidden" }}>
          <section className="flex h-full min-w-0 flex-col">
            {view === "missions" ? (
              <MissionList missions={missions} onSelect={selectMission} />
            ) : (
              <>
                <StageHead stage={headStage} />
                <div className="flex items-center gap-1 border-b border-border-subtle px-4 py-2">
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
                  <button
                    type="button"
                    onClick={shellLayout.toggleBrain}
                    title={brainCollapsed ? "Open System Brain" : "Collapse System Brain"}
                    className="ml-auto rounded-md px-2 py-1 font-mono text-xs text-text-faint hover:bg-surface-overlay hover:text-text-primary"
                  >
                    {brainCollapsed ? "◧" : "◨"}
                  </button>
                </div>
                {/* The Model pane must NOT sit in a scroll parent — give it height
                    directly; the scrollable panes keep their own overflow. */}
                <section className={`min-h-0 flex-1 ${isModel ? "overflow-hidden" : "overflow-y-auto"}`}>
                  {stage.id === "cad" ? (
                    <CadPanes
                      modeId={mode.id}
                      status={stage.status}
                      blockingConstraint={selected?.blockingConstraint}
                      cycle={selected?.cycle}
                      maxCycles={selected?.maxCycles}
                      run={run}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-text-faint">
                      {`${mode.label} pane — S4b`}
                    </div>
                  )}
                </section>
                <Composer stage={stage} run={run} />
              </>
            )}
          </section>
        </Panel>
        {/* Handle hides below the breakpoint (mobile-drawer seam); toggles still work. */}
        {!isNarrow && <Separator className="w-1 bg-border-subtle hover:bg-border-strong" />}
        <Panel
          panelRef={brainRef}
          id="brain"
          collapsible
          collapsedSize={BRAIN.collapsed}
          defaultSize={BRAIN.default}
          minSize={BRAIN.min}
          maxSize={BRAIN.max}
          style={{ overflow: "hidden" }}
          onResize={(size) => {
            const collapsed = size.inPixels <= BRAIN.collapsed + 1;
            if (collapsed !== lastBrainCollapsed.current) {
              lastBrainCollapsed.current = collapsed;
              shellLayout.setBrainCollapsed(collapsed);
            }
          }}
        >
          <Brain stage={stage} run={run} />
        </Panel>
      </Group>
      <GateDrawer />
    </>
  );
}
