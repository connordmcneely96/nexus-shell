import type { D1Database } from "@cloudflare/workers-types";
import type { BadgeState } from "./contract";
import { projectBadge, type RunStatus, type DesignStatus } from "./projectBadge";

// The live-read adapter: cad_convergence_runs + artifact_registry, behind the
// frozen VerticalStage contract. READ-ONLY. design_json is LIVE pipeline output
// (not mock) — it never enters an invariant-walked root. Every rendered value
// is the pipeline's, shown under the accuracy notice: the shell never asserts a
// persisted engineering value is correct.

export interface DesignFeature {
  type: string;
  position: number;
  diameter: number;
  length?: number;
  radius?: number;
  notes?: string;
}

export interface DesignCheck {
  criterion: string;
  computed: number;
  limit: number;
  units: string;
  pass: boolean;
  citation: string;
  note?: string;
}

export interface DesignAssumption {
  parameter: string;
  value: string | number;
  basis: string;
  impact: string;
  citation?: string;
}

export interface ParsedDesign {
  diameter: number;
  length: number;
  features: DesignFeature[];
  material: string;
  torque: number;
  radialLoad: number;
  bendingMoment: number;
  checks: DesignCheck[];
  assumptions: DesignAssumption[];
  solverDiagnostics?: unknown;
}

export interface Artifact {
  executionId: string;
  format: string;
  storageRef: string;
  storageType: string;
  sentinelPass: boolean | null;
}

export interface CadRun {
  runId: string;
  spec: string;
  maxCycles: number;
  cycle: number;
  status: RunStatus;
  designStatus: DesignStatus;
  designDiagnosis: string | null;
}

export interface RunRecord {
  run: CadRun;
  design: ParsedDesign | null;
  artifacts: Artifact[];
}

// Raw D1 row shapes (snake_case, as stored).
export interface RawRunRow {
  run_id: string;
  spec: string;
  max_cycles: number;
  cycle: number;
  status: string;
  design_status: string | null;
  design_diagnosis: string | null;
  design_json: string | null;
}
export interface RawArtifactRow {
  execution_id: string;
  format: string;
  storage_ref: string;
  storage_type: string;
  sentinel_pass: number | boolean | null;
}

// Defensive parse: design_json may be null (ungrounded/infeasible) or malformed.
// On anything unexpected, return null so every engineering slot stays a
// MachinedBlank rather than rendering a fabricated value.
export function parseDesignJson(raw: string | null | undefined): ParsedDesign | null {
  if (!raw) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const d = obj as Record<string, unknown>;
  if (typeof d.diameter !== "number" || !Array.isArray(d.checks) || !Array.isArray(d.assumptions)) {
    return null;
  }
  return {
    diameter: d.diameter as number,
    length: typeof d.length === "number" ? d.length : NaN,
    features: Array.isArray(d.features) ? (d.features as DesignFeature[]) : [],
    material: typeof d.material === "string" ? d.material : "",
    torque: typeof d.torque === "number" ? d.torque : NaN,
    radialLoad: typeof d.radialLoad === "number" ? d.radialLoad : NaN,
    bendingMoment: typeof d.bendingMoment === "number" ? d.bendingMoment : NaN,
    checks: d.checks as DesignCheck[],
    assumptions: d.assumptions as DesignAssumption[],
    solverDiagnostics: d.solverDiagnostics,
  };
}

const normStatus = (s: string): RunStatus =>
  (["pending", "running", "converged", "exhausted", "failed", "infeasible"].includes(s)
    ? s
    : "pending") as RunStatus;

const normDesignStatus = (s: string | null): DesignStatus =>
  s === "converged" || s === "infeasible" || s === "solver_error" || s === "ungrounded" ? s : null;

// Pure builder shared by the live D1 read and the captured-fixture render path,
// so local dev and deploy differ only in where the row bytes come from.
export function buildRecord(row: RawRunRow, artifactRows: RawArtifactRow[]): RunRecord {
  return {
    run: {
      runId: row.run_id,
      spec: row.spec,
      maxCycles: row.max_cycles,
      cycle: row.cycle,
      status: normStatus(row.status),
      designStatus: normDesignStatus(row.design_status),
      designDiagnosis: row.design_diagnosis,
    },
    design: parseDesignJson(row.design_json),
    artifacts: artifactRows.map((a) => ({
      executionId: a.execution_id,
      format: a.format,
      storageRef: a.storage_ref,
      storageType: a.storage_type,
      sentinelPass: a.sentinel_pass == null ? null : Boolean(a.sentinel_pass),
    })),
  };
}

// Provisional when any assumption's impact/basis mentions a provisional pack
// section (fatiguePackStatus/bearingPackStatus carry 'provisional'). Drives the
// existing provisional-pack banner off live data instead of a static flag.
export function isProvisional(design: ParsedDesign | null): boolean {
  if (!design) return false;
  return design.assumptions.some(
    (a) => /provisional/i.test(a.impact) || /provisional/i.test(a.basis),
  );
}

// ── LIST read ───────────────────────────────────────────────────────────────
// The Missions list needs status + operational fields ONLY — never engineering
// values, so design_json is NOT read here. Each card is badged through the
// SHIPPED projectBadge, so a list card is never greener than its detail
// (monotone trust): converged+ungrounded/null projects to pending at list level
// too.

export interface CadMissionSummary {
  runId: string;
  name: string; // derived from spec (stable label)
  status: BadgeState; // projectBadge(rawStatus, designStatus)
  rawStatus: RunStatus;
  designStatus: DesignStatus;
  blockingConstraint?: string; // concise design_diagnosis when infeasible
  cycle: number;
  maxCycles: number;
  createdAt: number;
}

export interface RawRunListRow {
  run_id: string;
  status: string;
  design_status: string | null;
  design_diagnosis: string | null;
  cycle: number;
  max_cycles: number;
  created_at: number;
  spec: string;
}

const deriveName = (spec: string): string =>
  spec
    .split(",")
    .slice(0, 2)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ") || "CAD run";

const conciseDiagnosis = (d: string): string => {
  const first = d.split(". ")[0].trim();
  return first.length > 140 ? `${first.slice(0, 140)}…` : first;
};

// Pure mapper shared by the live read and the captured-fixture render path.
export function mapMissionSummary(row: RawRunListRow): CadMissionSummary {
  const rawStatus = normStatus(row.status);
  const designStatus = normDesignStatus(row.design_status);
  const badge = projectBadge(rawStatus, designStatus);
  return {
    runId: row.run_id,
    name: deriveName(row.spec),
    status: badge,
    rawStatus,
    designStatus,
    ...(badge === "infeasible" && row.design_diagnosis
      ? { blockingConstraint: conciseDiagnosis(row.design_diagnosis) }
      : {}),
    cycle: row.cycle,
    maxCycles: row.max_cycles,
    createdAt: row.created_at,
  };
}

export async function cadMissionList(db: D1Database): Promise<CadMissionSummary[]> {
  const rows = await db
    .prepare(
      "SELECT run_id, status, design_status, design_diagnosis, cycle, max_cycles, created_at, spec FROM cad_convergence_runs WHERE duty_json IS NOT NULL ORDER BY created_at DESC",
    )
    .all<RawRunListRow>();
  return (rows.results ?? []).map(mapMissionSummary);
}

// The live read. Gated by construction: the caller passes env.DB, which only
// exists at runtime with the binding. Selecting design_status is deliberate —
// the live CadRunClient bug is that it omits it.
export async function cadAdapter(runId: string, db: D1Database): Promise<RunRecord | null> {
  const row = await db
    .prepare(
      "SELECT run_id, spec, max_cycles, cycle, status, design_status, design_diagnosis, design_json FROM cad_convergence_runs WHERE run_id = ?",
    )
    .bind(runId)
    .first<RawRunRow>();
  if (!row) return null;
  const artifacts = await db
    .prepare(
      "SELECT execution_id, format, storage_ref, storage_type, sentinel_pass FROM artifact_registry WHERE execution_id = ?",
    )
    .bind(runId)
    .all<RawArtifactRow>();
  return buildRecord(row, artifacts.results ?? []);
}
