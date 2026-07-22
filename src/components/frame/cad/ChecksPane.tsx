import { MachinedBlank, CiteTag, PackTag, AssumptionCard } from "@/components/gadgets";

// Checks — every result is a pending machined blank; citations and pack refs
// are strings. The limit column is intentionally omitted in S4b (it returns
// with real pack data). No numeric engineering value appears here.

const CHECKS: { name: string; cite: string; pack: "signed" | "provisional" }[] = [
  { name: "Shaft deflection", cite: "API 610 §6.9.1.3", pack: "signed" },
  { name: "Critical speed margin", cite: "API 610 §3.1.8", pack: "signed" },
  { name: "Combined stress von Mises", cite: "Pack §CS-1", pack: "signed" },
  { name: "Fatigue DE-Goodman", cite: "Pack §F-2", pack: "provisional" },
  { name: "Bearing system L10", cite: "API 610 §6.10.1.11", pack: "provisional" },
];

// Non-conservative assumptions must surface FIRST. Ordering is enforced here
// (sort by the conservative flag), not by authoring order.
const ASSUMPTIONS: { label: string; conservative: boolean }[] = [
  { label: "Uniform temperature across the shaft", conservative: true },
  { label: "Single-volute radial load model", conservative: false },
  { label: "Worst-case material lot properties", conservative: true },
];

export default function ChecksPane() {
  const ordered = [...ASSUMPTIONS].sort((a, b) => Number(a.conservative) - Number(b.conservative));
  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm text-text-muted">Checks</h2>
      <table className="w-full max-w-3xl text-left">
        <thead>
          <tr className="text-xs text-text-faint">
            <th className="py-2 font-normal">Check</th>
            <th className="py-2 font-normal">Citation</th>
            <th className="py-2 font-normal">Result</th>
            <th className="py-2 font-normal">Pack</th>
          </tr>
        </thead>
        <tbody>
          {CHECKS.map((c) => (
            <tr key={c.name} className="border-t border-border-subtle">
              <td className="py-2 text-sm text-text-primary">{c.name}</td>
              <td className="py-2"><CiteTag>{c.cite}</CiteTag></td>
              <td className="py-2"><MachinedBlank>{"<<check — pending>>"}</MachinedBlank></td>
              <td className="py-2"><PackTag kind={c.pack} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mb-2 mt-6 text-sm text-text-muted">Assumptions</h3>
      <div className="flex max-w-2xl flex-col gap-2">
        {ordered.map((a) => (
          <AssumptionCard key={a.label} label={a.label} conservative={a.conservative} />
        ))}
      </div>
    </div>
  );
}
