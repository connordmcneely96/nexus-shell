// THE SEAM. All /nexus data access goes through `contract` below. Lane δ's real
// endpoint replaces `mockAdapter` here and nothing else changes.
import type { BadgeState } from "@/shell/contract";

export type MissionMode = "guided" | "collaborative" | "advisory";
export type MissionTier = "concept" | "deterministic" | "grounded" | "sealed";
export type Autonomy = "manual" | "hybrid" | "auto";
export type MissionStatus = "active" | "waiting" | "closed"; // lifecycle, not run state

export interface Mission {
  id: string;
  tenant_id: string;
  title: string;
  mode: MissionMode;
  status: MissionStatus;
  tier: MissionTier;
  autonomy: Autonomy; // sourced from the pending autonomy_mode column (δ ships it)
  updated_at: string; // ISO 8601
}
export interface Artifact { id: string; title: string; source: string }
export interface DesignEvent { id: string; at: string; summary: string; source: string }
export interface AgentRun { id: string; agent_id: string; state: BadgeState; started_at: string }
export interface AgentRailState { agent_id: string; name: string; role: string; state: BadgeState | "idle" }
// An advisory mission is valid with artifacts: [] — deliverable is optional.
export interface MissionDetail {
  mission: Mission;
  artifacts: Artifact[];
  design_events: DesignEvent[];
  runs: AgentRun[];
}
export interface Workspace { id: string; name: string }
export interface NexusContract {
  listWorkspaces(): Promise<Workspace[]>;
  listMissions(): Promise<Mission[]>;
  getMission(id: string): Promise<MissionDetail | null>;
  listAgents(): Promise<AgentRailState[]>;
}

const m = (id: string, title: string, mode: MissionMode, tier: MissionTier, autonomy: Autonomy,
  status: MissionStatus = "active"): Mission =>
  ({ id, tenant_id: "tenant-mock", title, mode, status, tier, autonomy, updated_at: "2026-10-04T09:00:00Z" });

const MISSIONS: Mission[] = [
  m("m-1", "Draft supplier intake flow", "guided", "concept", "auto"),
  m("m-2", "Review pump shaft assumptions", "collaborative", "grounded", "hybrid", "waiting"),
  m("m-3", "Should we adopt a metric-only library?", "advisory", "concept", "manual"),
];
const DETAIL: Record<string, Omit<MissionDetail, "mission">> = {
  "m-1": { artifacts: [{ id: "a-1", title: "Intake outline", source: "planner run r-1" }],
    design_events: [{ id: "e-1", at: "2026-10-04T08:50:00Z", summary: "Plan drafted", source: "planner" }],
    runs: [{ id: "r-1", agent_id: "planner", state: "running", started_at: "2026-10-04T08:45:00Z" }] },
  "m-2": { artifacts: [], design_events: [], runs: [] },
  "m-3": { artifacts: [], design_events: [{ id: "e-2", at: "2026-10-04T08:30:00Z", summary: "Trade-offs discussed", source: "advisor" }], runs: [] },
};
const AGENTS: AgentRailState[] = [
  { agent_id: "planner", name: "Planner", role: "Guided missions", state: "running" },
  { agent_id: "advisor", name: "Advisor", role: "Discussion", state: "idle" },
  { agent_id: "builder", name: "Builder", role: "Collaborative work", state: "pending" },
];

const mockAdapter: NexusContract = {
  listWorkspaces: async () => [{ id: "tenant-mock", name: "Inner Animal Media" }, { id: "tenant-2", name: "Sandbox" }],
  listMissions: async () => MISSIONS,
  getMission: async (id) => {
    const mission = MISSIONS.find((x) => x.id === id);
    return mission ? { mission, ...DETAIL[id] } : null;
  },
  listAgents: async () => AGENTS,
};
export const contract: NexusContract = mockAdapter;
