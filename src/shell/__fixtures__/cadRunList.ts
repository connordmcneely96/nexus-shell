import type { RawRunListRow } from "../cadAdapter";

// REAL captured list rows from cad_convergence_runs (duty_json IS NOT NULL),
// grounded live from ll-cockpit-db on 2026-07-24. Genuine pipeline output, not
// mock; the list carries status + operational fields ONLY (no design_json, no
// engineering values) and never enters an invariant-walked root. Used to render
// the CAD list and prove the projection where a runtime D1 binding is absent.
export const CAD_RUN_LIST_ROWS: RawRunListRow[] = [
  {
    run_id: "615c7a62-48bd-433b-8349-ec68f4fc03e6",
    status: "converged",
    design_status: "converged",
    design_diagnosis: null,
    cycle: 1,
    max_cycles: 3,
    created_at: 1785126987,
    spec: "API 610 OH2 pump shaft, 200 HP, 1780 rpm, 8 in bearing span, AISI 4140 steel, 300 ft head, 1000 gpm, single volute",
  },
  {
    run_id: "1dc14ad0-24a8-488c-9f1a-91fa1c608491",
    status: "converged",
    design_status: "converged",
    design_diagnosis: null,
    cycle: 1,
    max_cycles: 3,
    created_at: 1785038855,
    spec: "API 610 OH2 pump shaft, 185 HP, 3560 rpm, 8 in bearing span, AISI 4140 steel, 300 ft head, 1000 gpm, single volute",
  },
  {
    run_id: "570ac2c5-3283-4cf7-8c21-5f6840c4a314",
    status: "converged",
    design_status: "converged",
    design_diagnosis: null,
    cycle: 1,
    max_cycles: 3,
    created_at: 1784684518,
    spec: "API 610 BB2 pump shaft, Cascade duty",
  },
  {
    run_id: "b3dff63d-a0ce-4288-991b-ef81a43a8db5",
    status: "infeasible",
    design_status: "infeasible",
    design_diagnosis: "profile_invariant_violated",
    cycle: 1,
    max_cycles: 3,
    created_at: 1785038761,
    spec: "API 610 OH2 pump shaft, 200 HP, 3560 rpm, 30 in bearing span, AISI 4140 steel, 800 ft head, 400 gpm, double volute",
  },
  {
    run_id: "8fd95226-e469-4188-a7ec-f5076459d622",
    status: "infeasible",
    design_status: "infeasible",
    design_diagnosis:
      'Material "4140" not found. Available: AISI 1018, AISI 1045, AISI 4140, AISI 4340, 304 SS, 316 SS, 17-4 PH, D2, 6061-T6, 7075-T6, Ti-6Al-4V',
    cycle: 1,
    max_cycles: 3,
    created_at: 1785038614,
    spec: "API 610 OH2 pump shaft, 200 HP, 3560 rpm, 30 in bearing span, 4140 steel, 800 ft head, 400 gpm, single volute",
  },
  {
    run_id: "131f6c46-a45e-479a-8919-8d937716fbdb",
    status: "infeasible",
    design_status: "infeasible",
    design_diagnosis:
      "shaft design infeasible: No feasible candidate. Blocking constraints (failed in every candidate): shaft deflection at primary seal faces, bearing system rating life L10h (§6.10.1.11). 26 of 45 candidates were rejected by derive().",
    cycle: 1,
    max_cycles: 3,
    created_at: 1784686138,
    spec: "API 610 pump shaft, aggressive high-head single-volute duty",
  },
];
