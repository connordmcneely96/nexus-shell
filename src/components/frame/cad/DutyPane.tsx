import { MachinedBlank } from "@/components/gadgets";

// Duty — agents populate these fields from the client requirement; they are
// never computed here. Every value is a pending machined blank.

const FIELDS: { field: string; source: string }[] = [
  { field: "Rated power", source: "client duty sheet" },
  { field: "Speed", source: "client duty sheet" },
  { field: "Head · flow", source: "client duty sheet" },
  { field: "Shaft material", source: "material selection" },
];

export default function DutyPane() {
  return (
    <div className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm text-text-muted">Duty</h2>
        <span className="rounded-full border border-border-subtle px-2 py-1 text-xs text-text-muted">
          AGENTS POPULATE · NEVER COMPUTE
        </span>
      </div>
      <table className="w-full max-w-2xl text-left">
        <thead>
          <tr className="text-xs text-text-faint">
            <th className="py-2 font-normal">Field</th>
            <th className="py-2 font-normal">Value</th>
            <th className="py-2 font-normal">Source</th>
          </tr>
        </thead>
        <tbody>
          {FIELDS.map((f) => (
            <tr key={f.field} className="border-t border-border-subtle">
              <td className="py-2 text-sm text-text-primary">{f.field}</td>
              <td className="py-2">
                <MachinedBlank>{"<<intake — pending>>"}</MachinedBlank>
              </td>
              <td className="py-2 text-xs text-text-muted">{f.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-text-faint">
        Duty is transcribed from the client requirement, not derived — the pipeline never invents a
        duty value.
      </p>
    </div>
  );
}
