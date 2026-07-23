import { MachinedBlank } from "@/components/gadgets";
import StatusChip from "@/components/gadgets/StatusChip";

// Artifacts — the deliverables and their build state. Revisions are pending
// until a PE seal is applied, so every Rev cell is a machined blank.

const ARTIFACTS: { name: string; fmt: string; state: "running" | "pending" }[] = [
  { name: "Parametric model", fmt: "GLB · STEP", state: "running" },
  { name: "Drawing sheet A3", fmt: "PDF · SVG", state: "pending" },
  { name: "Calc report", fmt: "PDF", state: "pending" },
  { name: "BOM", fmt: "CSV", state: "pending" },
];

export default function ArtifactsPane() {
  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm text-text-muted">Artifacts</h2>
      <table className="w-full max-w-3xl text-left">
        <thead>
          <tr className="text-xs text-text-faint">
            <th className="py-2 font-normal">Artifact</th>
            <th className="py-2 font-normal">Format</th>
            <th className="py-2 font-normal">State</th>
            <th className="py-2 font-normal">Rev</th>
          </tr>
        </thead>
        <tbody>
          {ARTIFACTS.map((a) => (
            <tr key={a.name} className="border-t border-border-subtle">
              <td className="py-2 text-sm text-text-primary">{a.name}</td>
              <td className="py-2 font-mono text-xs text-text-muted">{a.fmt}</td>
              <td className="py-2"><StatusChip state={a.state} pulse={a.state === "running"} /></td>
              <td className="py-2"><MachinedBlank>{"<<rev>>"}</MachinedBlank></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-text-faint">
        No revision is stamped until a PE seal is applied — until then the pack ships blank.
      </p>
    </div>
  );
}
