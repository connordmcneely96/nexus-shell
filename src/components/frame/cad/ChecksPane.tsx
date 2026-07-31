import { MachinedBlank, CiteTag } from "@/components/gadgets";
import type { ParsedDesign } from "@/shell/cadAdapter";
import { isCheckVerified } from "@/shell/verifiedFields";

// Checks & Assumptions from LIVE design_json. THE ACCURACY RULE: computed/limit
// numbers render (they are the product's output) with their citation and under
// the stage's accuracy notice — a pass:true renders as "pipeline pass", NEVER a
// validated checkmark. If design is null, every result stays a MachinedBlank.

// Classify off the real impact string (starts with CONSERVATIVE / NON-
// CONSERVATIVE / neither). Sort NON-CONSERVATIVE first off THIS field.
type Kind = "non" | "cons" | "neutral";
const kindOf = (impact: string): Kind =>
  impact.startsWith("NON-CONSERVATIVE") ? "non" : impact.startsWith("CONSERVATIVE") ? "cons" : "neutral";

const PENDING_CHECKS = [
  "Shaft deflection",
  "Critical speed margin",
  "Combined stress von Mises",
  "Fatigue DE-Goodman",
  "Bearing system L10",
];

export default function ChecksPane({ design }: { design: ParsedDesign | null }) {
  if (!design) {
    // Ungrounded / infeasible — no pipeline values exist yet.
    return (
      <div className="p-6">
        <h2 className="mb-3 text-sm text-text-muted">Checks</h2>
        <table className="w-full max-w-3xl text-left">
          <tbody>
            {PENDING_CHECKS.map((name) => (
              <tr key={name} className="border-t border-border-subtle">
                <td className="py-2 text-sm text-text-primary">{name}</td>
                <td className="py-2"><MachinedBlank>{"<<check — pending>>"}</MachinedBlank></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const assumptions = [...design.assumptions].sort(
    (a, b) => Number(kindOf(b.impact) === "non") - Number(kindOf(a.impact) === "non"),
  );

  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm text-text-muted">Checks</h2>
      <table className="w-full max-w-4xl text-left">
        <thead>
          <tr className="text-xs text-text-faint">
            <th className="py-2 font-normal">Check</th>
            <th className="py-2 font-normal">Citation</th>
            <th className="py-2 font-normal">Computed</th>
            <th className="py-2 font-normal">Limit</th>
            <th className="py-2 font-normal">Result</th>
          </tr>
        </thead>
        <tbody>
          {design.checks.map((c) => (
            <tr key={c.criterion} className="border-t border-border-subtle align-top">
              <td className="py-2 text-sm text-text-primary">
                {c.criterion}
                {c.note && <div className="mt-1 text-xs text-text-faint">{c.note}</div>}
              </td>
              <td className="py-2"><CiteTag>{c.citation}</CiteTag></td>
              <td className="py-2 font-mono text-xs text-text-primary">{`${c.computed} ${c.units}`}</td>
              <td className="py-2 font-mono text-xs text-text-muted">{`${c.limit} ${c.units}`}</td>
              {/* A check reads "verified" ONLY when every input is in the
                  registry — never today (CHECK_DEPENDENCIES is empty). Otherwise
                  it stays "pipeline pass" under the caveat, never a validated ✓. */}
              <td className="py-2 text-xs">
                {isCheckVerified(c.criterion) ? (
                  <span className="text-success">✓ verified</span>
                ) : (
                  <span className="text-text-muted">{c.pass ? "pipeline pass" : "pipeline fail"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 max-w-4xl text-xs text-text-faint">
        verified = cleared by independent PE-authority check; pipeline pass =
        computed, not yet verified.
      </p>

      <h3 className="mb-2 mt-6 text-sm text-text-muted">Assumptions</h3>
      <div className="flex max-w-3xl flex-col gap-2">
        {assumptions.map((a) => {
          const k = kindOf(a.impact);
          return (
            <div key={a.parameter} className="rounded-md border border-border-subtle bg-surface-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-text-primary">{a.parameter}</span>
                {k === "non" ? (
                  <span className="rounded-full bg-warn px-2 py-1 text-xs text-surface-base">NON-CONSERVATIVE</span>
                ) : k === "cons" ? (
                  <span className="rounded-full border border-border-subtle px-2 py-1 text-xs text-text-muted">CONSERVATIVE</span>
                ) : (
                  <span className="rounded-full border border-border-subtle px-2 py-1 text-xs text-text-faint">neutral</span>
                )}
              </div>
              <p className="mt-2 text-xs text-text-muted">{a.impact}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
