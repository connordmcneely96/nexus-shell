import type { FiveState } from "@/shell/contract";
import type { RunClock } from "@/shell/useRunClock";
import type { RunRecord } from "@/shell/cadAdapter";
import OverviewPane from "./OverviewPane";
import DutyPane from "./DutyPane";
import ChecksPane from "./ChecksPane";
import ArtifactsPane from "./ArtifactsPane";
import ProvenancePane from "./ProvenancePane";
import ModelPane from "./model/ModelPane";

// CAD center-stage pane switcher — all five load-bearing modes are wired.

export default function CadPanes({
  modeId,
  status,
  blockingConstraint,
  cycle,
  maxCycles,
  run,
  record,
}: {
  modeId: string;
  status: FiveState;
  blockingConstraint?: string;
  cycle?: number;
  maxCycles?: number;
  run: RunClock;
  record: RunRecord | null;
}) {
  switch (modeId) {
    case "overview":
      return (
        <OverviewPane
          status={status}
          blockingConstraint={blockingConstraint}
          cycle={cycle}
          maxCycles={maxCycles}
          run={run}
        />
      );
    case "duty":
      return <DutyPane />;
    case "checks":
      return <ChecksPane design={record?.design ?? null} />;
    case "artifacts":
      return <ArtifactsPane artifacts={record?.artifacts ?? []} />;
    case "provenance":
      return <ProvenancePane />;
    case "model": {
      // Empty-state contract (Lane 5) — Lane 6 owns the viewport. When no glb
      // artifact exists, surface an honest notice, never a blank void.
      const hasGlb = record?.artifacts.some((a) => a.format === "glb") ?? false;
      if (hasGlb) return <ModelPane />;
      return (
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-border-strong bg-surface-overlay px-5 py-3 text-sm text-text-muted">
            No 3D model yet — the geometry step (Lane 4) has not produced a GLB for this run.
          </div>
          <div className="min-h-0 flex-1">
            <ModelPane />
          </div>
        </div>
      );
    }
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-faint">
          {`${modeId} pane — S4b`}
        </div>
      );
  }
}
