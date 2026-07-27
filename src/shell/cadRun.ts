import { buildRecord, type RunRecord } from "./cadAdapter";
import { RUN1DC14AD0_ROW, RUN1DC14AD0_ARTIFACTS } from "./__fixtures__/run1dc14ad0";

// The current CAD run record. In local dev / preview (no DB binding) this is
// the captured REAL 1dc14ad0 payload run through the SAME buildRecord the live
// cadAdapter uses — so the render pipeline (parse → project → banners → panes)
// is exercised on real bytes. When deployed with env.DB, cadAdapter(runId,
// env.DB) returns the identical shape. Pure (no hooks) — pulled into whatever
// tree imports it.
export function loadCadRun(): RunRecord {
  return buildRecord(RUN1DC14AD0_ROW, RUN1DC14AD0_ARTIFACTS);
}
