import { contract } from "./lib/contract";
import WorkspaceSwitcher from "./components/WorkspaceSwitcher";
import BrainRail from "./components/BrainRail";
import StatusBar from "./components/StatusBar";

// /nexus chassis. Rail, Topbar and CommandK are inherited from the root layout.
export default async function NexusPage() {
  const [workspaces, missions, agents] = await Promise.all([
    contract.listWorkspaces(), contract.listMissions(), contract.listAgents(),
  ]);
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-border-subtle px-4 py-2">
        <WorkspaceSwitcher workspaces={workspaces} />
      </div>
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto p-6 text-sm text-text-muted">Missions load here.</main>
        <BrainRail agents={agents} />
      </div>
      <StatusBar missionCount={missions.length} agentCount={agents.length} />
    </div>
  );
}
