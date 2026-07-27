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
      return <ArtifactsPane />;
    case "provenance":
      return <ProvenancePane />;
    case "model":
      return <ModelPane />;
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-faint">
          {`${modeId} pane — S4b`}
        </div>
      );
  }
}
