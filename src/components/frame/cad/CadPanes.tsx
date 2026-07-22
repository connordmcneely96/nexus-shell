import OverviewPane from "./OverviewPane";
import DutyPane from "./DutyPane";
import ChecksPane from "./ChecksPane";

// CAD center-stage pane switcher. Overview/Duty/Checks land in commit 3;
// Artifacts/Provenance arrive in commit 4 (stub until then).

export default function CadPanes({ modeId }: { modeId: string }) {
  switch (modeId) {
    case "overview":
      return <OverviewPane />;
    case "duty":
      return <DutyPane />;
    case "checks":
      return <ChecksPane />;
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-faint">
          {`${modeId} pane — S4b`}
        </div>
      );
  }
}
