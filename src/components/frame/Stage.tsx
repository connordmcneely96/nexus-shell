"use client";

import { useEffect, useState } from "react";
import { verticals } from "@/shell/verticals";
import { missions, type Mission } from "@/mock/missions";
import { useRunClock } from "@/shell/useRunClock";
import StageHead from "./StageHead";
import Brain from "./Brain";
import Composer from "./Composer";
import MissionList from "./MissionList";
import CadPanes from "./cad/CadPanes";
import GateDrawer from "./GateDrawer";

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
        statusDetail: selected.status === "running" ? base.statusDetail : undefined,
      }
    : base;
  const mode = stage.modes.find((m) => m.id === modeId) ?? stage.modes[0];

  // The active run: the running CAD mission. The clock only ticks when live.
  const isLiveRun = view === "mission" && stage.id === "cad" && stage.status === "running";
  const run = useRunClock(isLiveRun);

  return (
    <div className="flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        {view === "missions" ? (
          <MissionList missions={missions} onSelect={selectMission} />
        ) : (
          <>
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
            <section className="min-h-0 flex-1 overflow-y-auto">
              {stage.id === "cad" ? (
                <CadPanes
                  modeId={mode.id}
                  status={stage.status}
                  blockingConstraint={selected?.blockingConstraint}
                  run={run}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-faint">
                  {`${mode.label} pane — S4b`}
                </div>
              )}
            </section>
            <Composer stage={stage} />
          </>
        )}
      </section>
      <Brain stage={stage} />
      <GateDrawer />
    </div>
  );
}
