import type { MissionDetail as Detail } from "../lib/contract";
import Field from "./Field";

const when = (iso: string) => iso.replace("T", " ").slice(0, 16) + " UTC";
const H = "nx-up mb-2 text-xs text-text-muted";

// An advisory mission with zero artifacts is a complete mission, not an empty build.
export default function MissionDetail({ detail }: { detail: Detail }) {
  const { mission: m, artifacts, design_events, runs } = detail;
  const advisory = m.mode === "advisory";
  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg text-text-primary">{m.title}</h1>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <Field label="Mode" value={m.mode} source="mission record" />
          <Field label="Status" value={m.status} source="mission record" />
          <Field label="Updated" value={when(m.updated_at)} source="mission record" />
        </div>
      </header>
      <section>
        <h2 className={H}>Artifacts</h2>
        {artifacts.length === 0 ? (
          <p className="text-sm text-text-muted">
            {advisory ? "Advisory mission — the outcome is the conversation; no deliverable is expected."
              : "No artifacts produced yet."}
          </p>
        ) : (
          <ul>{artifacts.map((a) => (
            <li key={a.id} className="text-sm text-text-primary">{a.title}
              <span className="ml-2 text-xs text-text-muted">source: {a.source}</span></li>
          ))}</ul>
        )}
      </section>
      <section>
        <h2 className={H}>Design events</h2>
        {design_events.length === 0 ? <p className="text-sm text-text-muted">None recorded yet.</p> : (
          <ul>{design_events.map((e) => (
            <li key={e.id} className="text-sm text-text-primary">{e.summary}
              <span className="ml-2 text-xs text-text-muted">{when(e.at)} · source: {e.source}</span></li>
          ))}</ul>
        )}
      </section>
      <section>
        <h2 className={H}>Agent runs</h2>
        {runs.length === 0 ? <p className="text-sm text-text-muted">No agent runs.</p> : (
          <ul>{runs.map((r) => (
            <li key={r.id} className="text-sm text-text-primary">{r.agent_id}: {r.state}
              <span className="ml-2 text-xs text-text-muted">{when(r.started_at)} · source: agent run</span></li>
          ))}</ul>
        )}
      </section>
    </article>
  );
}
