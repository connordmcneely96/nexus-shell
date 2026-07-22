import type { FiveState } from "@/shell/contract";
import { jobs } from "./fixtures";

// Mission layer — built ON TOP of the existing Job fixtures (imported, not
// duplicated). A Mission is a job-level rollup for the Missions surface.
// clientRef/workspaceRef are typed hierarchy stubs for Phase 2 tenancy.
export interface Mission {
  id: string;
  vertical: "web" | "cad";
  name: string;
  client: string;
  status: FiveState;
  blockingConstraint?: string;
  cost: number; // USD — sum across the job's runs
  elapsed: number; // seconds — sum
  runCount: number; // sum
  clientRef: string; // e.g. 'client:acme-water' — Phase 2 tenancy stub
  workspaceRef: string; // e.g. 'workspace:job-1' — Phase 2 tenancy stub
}

// Each CAD mission maps 1:1 onto a Job. The job's most recent run drives the
// mission status (so job-1's infeasible sweep surfaces its named constraint
// verbatim); cost/elapsed/runCount roll up across all of the job's runs.
const cadMissionFromJob = (job: (typeof jobs)[number]): Mission => {
  const last = job.runs[job.runs.length - 1];
  const sum = (pick: (r: (typeof job.runs)[number]) => number) =>
    job.runs.reduce((acc, r) => acc + pick(r), 0);
  return {
    id: `m-${job.id}`,
    vertical: "cad",
    name: job.name,
    client: "Acme Water District",
    status: last.status,
    ...(last.blockingConstraint ? { blockingConstraint: last.blockingConstraint } : {}),
    cost: sum((r) => r.cost),
    elapsed: sum((r) => r.elapsed),
    runCount: sum((r) => r.runCount),
    clientRef: "client:acme-water",
    workspaceRef: `workspace:${job.id}`,
  };
};

const cadMissions: Mission[] = jobs.map(cadMissionFromJob);

const webMissions: Mission[] = [
  {
    id: "m-web-portal",
    vertical: "web",
    name: "Build Acme client portal",
    client: "Acme",
    status: "running",
    cost: 0.61,
    elapsed: 44,
    runCount: 4,
    clientRef: "client:acme",
    workspaceRef: "workspace:acme-portal",
  },
  {
    id: "m-web-marketing",
    vertical: "web",
    name: "Marketing site v7",
    client: "Inner Animal Media",
    status: "converged",
    cost: 12.4,
    elapsed: 512,
    runCount: 128,
    clientRef: "client:iam",
    workspaceRef: "workspace:marketing-v7",
  },
];

// Display order: the live web portal first, then the CAD roster (infeasible,
// running, failed), then the shipped marketing site.
export const missions: Mission[] = [
  webMissions[0],
  ...cadMissions,
  webMissions[1],
];
