import type { Artifact } from "@/shell/cadAdapter";

// Artifacts — LIVE artifact_registry rows grouped by format. For the current
// converged runs that is a single format='md' geometry review in R2. R2 objects
// are reached through the ll-cockpit R2 proxy (no R2 binding on nexus-shell).

// Proxy origin for R2 objects (storage_ref is already the object key). The exact
// proxy route is ll-cockpit's; this is the documented seam.
const R2_PROXY_BASE = "https://ll-cockpit.connorpattern.workers.dev/r2";
const artifactUrl = (storageRef: string) => `${R2_PROXY_BASE}/${storageRef}`;
const basename = (ref: string) => ref.split("/").pop() ?? ref;

function sentinelLabel(pass: boolean | null): { text: string; cls: string } {
  if (pass === null) return { text: "not reviewed", cls: "text-text-faint" };
  return pass ? { text: "sentinel pass", cls: "text-text-muted" } : { text: "sentinel fail", cls: "text-danger" };
}

export default function ArtifactsPane({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) {
    return (
      <div className="p-6">
        <h2 className="mb-3 text-sm text-text-muted">Artifacts</h2>
        <p className="text-sm text-text-muted">No artifacts registered for this run yet.</p>
      </div>
    );
  }

  // Group by format, first-seen order.
  const formats = artifacts.reduce<string[]>((acc, a) => {
    if (!acc.includes(a.format)) acc.push(a.format);
    return acc;
  }, []);

  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm text-text-muted">Artifacts</h2>
      {formats.map((fmt) => (
        <div key={fmt} className="mb-5">
          <div className="mb-1 font-mono text-xs uppercase text-text-faint">{fmt}</div>
          <table className="w-full max-w-3xl text-left">
            <tbody>
              {artifacts
                .filter((a) => a.format === fmt)
                .map((a) => {
                  const s = sentinelLabel(a.sentinelPass);
                  return (
                    <tr key={a.storageRef} className="border-t border-border-subtle">
                      <td className="py-2 text-sm text-text-primary">{basename(a.storageRef)}</td>
                      <td className="py-2 font-mono text-xs text-text-muted">{fmt}</td>
                      <td className={`py-2 text-xs ${s.cls}`}>{s.text}</td>
                      <td className="py-2">
                        <a
                          href={artifactUrl(a.storageRef)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-accent underline"
                        >
                          {a.storageRef}
                        </a>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ))}
      <p className="mt-3 text-xs text-text-faint">
        No glb/step/svg/pdf exist yet — Lane 4 has not produced them for these runs.
      </p>
    </div>
  );
}
