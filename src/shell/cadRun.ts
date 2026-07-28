import {
  buildRecord,
  mapMissionSummary,
  type RunRecord,
  type CadMissionSummary,
  type RawRunRow,
} from "./cadAdapter";
import { RUN1DC14AD0_ROW, RUN1DC14AD0_ARTIFACTS } from "./__fixtures__/run1dc14ad0";
import { CAD_RUN_LIST_ROWS } from "./__fixtures__/cadRunList";

// In local dev / preview (no DB binding) these run the captured REAL payloads
// through the SAME buildRecord / mapMissionSummary the live cadAdapter uses — so
// the render pipeline is exercised on real bytes. When deployed with env.DB,
// cadMissionList/cadAdapter return the identical shapes. Pure (no hooks).

// The live CAD mission list, badged through the shipped projection.
export function loadCadMissions(): CadMissionSummary[] {
  return CAD_RUN_LIST_ROWS.map(mapMissionSummary);
}

// The detail record for a runId — the seam that keeps list and detail in
// agreement. Only 1dc14ad0's full design_json is captured for dev; every other
// listed run resolves to a record with design=null (MachinedBlanks) built from
// the SAME list row, so its badge/status still matches the list. Deploy resolves
// all of them fully via cadAdapter(runId, env.DB).
export function loadCadRunById(runId: string): RunRecord {
  if (runId === RUN1DC14AD0_ROW.run_id) {
    return buildRecord(RUN1DC14AD0_ROW, RUN1DC14AD0_ARTIFACTS);
  }
  const row = CAD_RUN_LIST_ROWS.find((r) => r.run_id === runId);
  const runRow: RawRunRow = row
    ? {
        run_id: row.run_id,
        spec: row.spec,
        max_cycles: row.max_cycles,
        cycle: row.cycle,
        status: row.status,
        design_status: row.design_status,
        design_diagnosis: row.design_diagnosis,
        design_json: null,
      }
    : { ...RUN1DC14AD0_ROW, design_json: null };
  return buildRecord(runRow, []);
}
