// Fields independently verified by an external PE-authority check (Lane 1),
// NOT self-certified by the shell. Adding a field here requires a real
// verification upstream — do not add speculatively. "Verified" means an
// external check cleared this field, never "the pipeline computed it".
export const VERIFIED_FIELDS: Record<string, { verifiedBy: string; date: string; note: string }> = {
  torque: {
    verifiedBy: "Lane 1 / engineering-calcs regression guard (PR #26)",
    date: "2026-07-27",
    note: "T=63024·P/N confirmed against 3 live duties + monotonic property test",
  },
};

export function isVerified(field: string): boolean {
  return field in VERIFIED_FIELDS;
}

// Maps a check.criterion string to the design_json field(s) it depends on, so a
// check is only "verified" when ALL of its inputs are verified.
//
// DELIBERATELY EMPTY: no check is fully verified yet. torque feeds combined
// stress and fatigue, but those checks ALSO depend on unverified inputs
// (deflection, da_min, endurance limit, …), so NO check inherits verified
// status from torque. Torque alone is verified as a FIELD. This emptiness is
// correct and conservative — a check appears here only once EVERY dependency is
// in VERIFIED_FIELDS.
export const CHECK_DEPENDENCIES: Record<string, string[]> = {};

export function isCheckVerified(criterion: string): boolean {
  const deps = CHECK_DEPENDENCIES[criterion];
  return !!deps && deps.length > 0 && deps.every(isVerified);
}
