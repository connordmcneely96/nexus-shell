"use client";

import { useEffect, useRef, useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { verticals } from "@/shell/verticals";
import { missions } from "@/mock/missions";
import { useRunClock } from "@/shell/useRunClock";
import { shellLayout, useShellLayout, useIsNarrow } from "@/shell/useShellLayout";
import { loadCadMissions, loadCadRunById } from "@/shell/cadRun";
import { isProvisional } from "@/shell/cadAdapter";
import { projectBadge } from "@/shell/projectBadge";
import { isVerified, RENDERED_DESIGN_FIELDS } from "@/shell/verifiedFields";
import type { FiveState, BadgeState } from "@/shell/contract";
import StageHead from "./StageHead";
import Brain from "./Brain";
import Composer from "./Composer";
import MissionList, { type MissionCard } from "./MissionList";
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
  const [cadRunId, setCadRunId] = useState<string | null>(null);
  const base = verticals.find((v) => v.id === vid)!;
  const [modeId, setModeId] = useState(base.modes[0].id);

  // Web missions stay MOCK; CAD missions are LIVE summaries.
  const cadSummaries = loadCadMissions();
  const cadModes = verticals.find((v) => v.id === "cad")!.modes;
  const webModes = verticals.find((v) => v.id === "web")!.modes;

  const openCad = (runId: string) => {
    setVid("cad");
    setCadRunId(runId);
    setMissionId(null);
    setModeId(cadModes[0].id);
    setView("mission");
  };
  const openWeb = (id: string) => {
    const m = missions.find((x) => x.id === id && x.vertical === "web");
    if (!m) return;
    setVid("web");
    setMissionId(m.id);
    setCadRunId(null);
    setModeId(webModes[0].id);
    setView("mission");
  };

  useEffect(() => {
    const openById = (id: string) => {
      if (loadCadMissions().some((s) => s.runId === id)) openCad(id);
      else openWeb(id);
    };
    const onShow = () => setView("missions");
    const onOpen = (e: Event) => openById((e as CustomEvent<{ id?: string }>).detail?.id ?? "");
    const onSetVertical = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (id === "cad") openCad(loadCadMissions()[0]?.runId ?? "");
      else if (id === "web") openWeb(missions.find((m) => m.vertical === "web")?.id ?? "");
    };
    window.addEventListener("nexus:show-missions", onShow);
    window.addEventListener("nexus:open-mission", onOpen);
    window.addEventListener("nexus:set-vertical", onSetVertical);
    return () => {
      window.removeEventListener("nexus:show-missions", onShow);
      window.removeEventListener("nexus:open-mission", onOpen);
      window.removeEventListener("nexus:set-vertical", onSetVertical);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectCard = (card: MissionCard) => {
    if (card.vertical === "cad") openCad(card.id);
    else openWeb(card.id);
  };

  // Web: the selected MOCK mission. CAD: the LIVE record for the selected runId
  // (runId flows list → cadAdapter → stage, so list and detail agree).
  const selectedWeb = vid === "web" && missionId ? missions.find((m) => m.id === missionId) : null;
  const cadRecord =
    view === "mission" && vid === "cad"
      ? loadCadRunById(cadRunId ?? cadSummaries[0]?.runId ?? "")
      : null;
  const cadSummary = cadRecord ? cadSummaries.find((s) => s.runId === cadRecord.run.runId) : undefined;

  const headBadge: BadgeState | undefined = cadRecord
    ? projectBadge(cadRecord.run.status, cadRecord.run.designStatus)
    : selectedWeb?.status;

  const crumbLast = cadRecord ? (cadSummary?.name ?? cadRecord.run.spec) : selectedWeb?.name;
  const stopped =
    cadRecord && headBadge === "infeasible"
      ? `stopped · cycle ${cadRecord.run.cycle} of ${cadRecord.run.maxCycles}`
      : selectedWeb && selectedWeb.status === "infeasible" && selectedWeb.cycle !== undefined
        ? `stopped · cycle ${selectedWeb.cycle} of ${selectedWeb.maxCycles}`
        : undefined;
  const statusDetail = selectedWeb?.status === "running" ? base.statusDetail : stopped;

  const stage = crumbLast
    ? { ...base, crumb: [...base.crumb.slice(0, -1), crumbLast], statusDetail }
    : { ...base, statusDetail };
  const mode = stage.modes.find((m) => m.id === modeId) ?? stage.modes[0];

  // The active run: a RUNNING CAD convergence. The clock only ticks when live.
  const isLiveRun = view === "mission" && vid === "cad" && cadRecord?.run.status === "running";
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

  const isModel = vid === "cad" && mode.id === "model";

  // ── CAD live read: badge + data-driven undismissable notices ────────────
  const showProvisional = !!cadRecord && isProvisional(cadRecord.design);
  // Partial-verification summary: rendered engineering fields vs the registry.
  // Only fields Lane 1 has independently cleared count as verified.
  const design = cadRecord?.design ?? null;
  const renderedFields = design
    ? RENDERED_DESIGN_FIELDS.filter((f) => {
        const v = (design as unknown as Record<string, unknown>)[f];
        return typeof v === "number" && !Number.isNaN(v);
      })
    : [];
  const accuracySummary = {
    anyRendered: renderedFields.length > 0,
    verifiedCount: renderedFields.filter(isVerified).length,
    totalFields: renderedFields.length,
  };
  const cadHeadStage =
    vid === "cad"
      ? { ...headStage, provisionalBanner: showProvisional ? base.provisionalBanner : undefined }
      : headStage;

  // Pane props resolve from the live record (CAD) or the mock mission (web).
  const FIVE: readonly string[] = ["pending", "running", "converged", "infeasible", "failed"];
  const paneStatus: FiveState =
    cadRecord
      ? (FIVE.includes(cadRecord.run.status) ? (cadRecord.run.status as FiveState) : "failed")
      : (selectedWeb?.status ?? stage.status);
  const paneBlocking = cadRecord ? cadSummary?.blockingConstraint : selectedWeb?.blockingConstraint;
  const paneCycle = cadRecord ? cadRecord.run.cycle : selectedWeb?.cycle;
  const paneMax = cadRecord ? cadRecord.run.maxCycles : selectedWeb?.maxCycles;

  // Cards: mock web missions + live CAD summaries, one shared shape.
  const cards: MissionCard[] = [
    ...missions
      .filter((m) => m.vertical === "web")
      .map<MissionCard>((m) => ({
        id: m.id,
        vertical: "web",
        name: m.name,
        subtitle: m.client,
        status: m.status,
        opsLine:
          m.status === "infeasible" && m.cycle !== undefined
            ? `stopped · cycle ${m.cycle} of ${m.maxCycles}`
            : `$${m.cost.toFixed(2)} · ${m.elapsed}s · ${m.runCount} runs`,
        blockingConstraint: m.status === "infeasible" ? m.blockingConstraint : undefined,
      })),
    ...cadSummaries.map<MissionCard>((s) => ({
      id: s.runId,
      vertical: "cad",
      name: s.name,
      status: s.status,
      opsLine:
        s.status === "infeasible"
          ? `stopped · cycle ${s.cycle} of ${s.maxCycles}`
          : `cycle ${s.cycle} of ${s.maxCycles}`,
      blockingConstraint: s.blockingConstraint,
    })),
  ];

  return (
    <>
      <Group orientation="horizontal" className="h-full min-h-0">
        <Panel id="stage-main" minSize={360} style={{ overflow: "hidden" }}>
          <section className="flex h-full min-w-0 flex-col">
            {view === "missions" ? (
              <MissionList cards={cards} onSelect={onSelectCard} />
            ) : (
              <>
                <StageHead stage={cadHeadStage} badge={headBadge} accuracyNotice={accuracySummary} />
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
                  {vid === "cad" ? (
                    <CadPanes
                      modeId={mode.id}
                      status={paneStatus}
                      blockingConstraint={paneBlocking}
                      cycle={paneCycle}
                      maxCycles={paneMax}
                      run={run}
                      record={cadRecord}
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
