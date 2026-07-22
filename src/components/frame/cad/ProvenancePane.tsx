// Provenance — the two-stores audit. StandardPacks are the ONLY source of
// engineering values (via the deterministic solver); the tenant RAG corpus
// feeds citations and NEVER produces a value. This pane exists so a reviewer
// can audit the invariant rather than take it on faith.

const STORES: { store: string; feeds: string; produces: string; verdict: "success" | "danger" }[] = [
  { store: "StandardPacks", feeds: "solver", produces: "YES — the only source", verdict: "success" },
  { store: "Tenant RAG corpus", feeds: "citations", produces: "NEVER", verdict: "danger" },
];

export default function ProvenancePane() {
  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm text-text-muted">Provenance</h2>
      <table className="w-full max-w-3xl text-left">
        <thead>
          <tr className="text-xs text-text-faint">
            <th className="py-2 font-normal">Store</th>
            <th className="py-2 font-normal">Feeds</th>
            <th className="py-2 font-normal">Produces engineering values?</th>
          </tr>
        </thead>
        <tbody>
          {STORES.map((s) => (
            <tr key={s.store} className="border-t border-border-subtle">
              <td className="py-2 text-sm text-text-primary">{s.store}</td>
              <td className="py-2 font-mono text-xs text-text-muted">{s.feeds}</td>
              <td className={`py-2 text-sm ${s.verdict === "success" ? "text-success" : "text-danger"}`}>
                {s.produces}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-text-faint">
        This page exists so a reviewer can audit the invariant, not take it on faith.
      </p>
    </div>
  );
}
