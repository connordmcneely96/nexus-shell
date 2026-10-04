// Provenance rule: every displayed value carries a source caption, or says it is not measured yet.
export default function Field({ label, value, source }: { label: string; value?: string; source?: string }) {
  return (
    <div>
      <div className="nx-up text-xs text-text-muted">{label}</div>
      <div className="text-sm text-text-primary">{value ?? "not measured yet"}</div>
      <div className="text-xs text-text-muted">{value && source ? `source: ${source}` : "source: none"}</div>
    </div>
  );
}
