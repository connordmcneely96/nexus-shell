// Token swatch reference. Renders TOKENS ONLY — no engineering value appears
// here, not even as illustration; filler text is the token name. Reached by
// direct URL only; deliberately unlinked (no nav exists yet).

const COLOR_CHIPS: [string, string][] = [
  ["--nx-surface-base", "#0B0D10"],
  ["--nx-surface-raised", "#12151A"],
  ["--nx-surface-overlay", "#1A1F26"],
  ["--nx-border-subtle", "#232932"],
  ["--nx-border-strong", "#333B47"],
  ["--nx-text-primary", "#E6EAF0"],
  ["--nx-text-muted", "#94A0B0"],
  ["--nx-text-faint", "#5D6874"],
];

const SPACES = ["1", "2", "3", "4", "5", "6", "8", "10", "12", "16"];
const RADII = ["xs", "sm", "md", "lg", "xl", "full"];
const TYPE_SIZES = ["xs", "sm", "base", "lg", "xl", "2xl"];

// infeasible vs failed: two hue-independent signals — border style (dashed vs
// solid) and label text. Both survive greyscale.
const STATUS = [
  { label: "pending", token: "--nx-pending", borderStyle: "solid" },
  { label: "running", token: "--nx-accent", borderStyle: "solid" },
  { label: "converged", token: "--nx-success", borderStyle: "solid" },
  { label: "infeasible", token: "--nx-verdict", borderStyle: "dashed" },
  { label: "failed", token: "--nx-danger", borderStyle: "solid" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg text-text-muted mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="p-8 font-sans" style={{ maxWidth: "960px" }}>
      <h1 className="text-2xl">NEXUS tokens</h1>

      <Section title="Surfaces, borders, text">
        <div className="flex flex-wrap gap-3">
          {COLOR_CHIPS.map(([name, hex]) => (
            <div key={name} className="rounded-md border border-border-subtle bg-surface-raised p-3">
              <div
                className="h-10 w-44 rounded-sm border border-border-strong"
                style={{ background: `var(${name})` }}
              />
              <div className="mt-2 font-mono text-sm">{name}</div>
              <div className="font-mono text-xs text-text-faint">{hex}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing — 4px base">
        {SPACES.map((n) => (
          <div key={n} className="mb-2 flex items-center gap-3">
            <span className="w-32 font-mono text-xs text-text-muted">{`--nx-space-${n}`}</span>
            <span className="h-2 bg-accent" style={{ width: `var(--nx-space-${n})` }} />
          </div>
        ))}
      </Section>

      <Section title="Radius ladder">
        <div className="flex flex-wrap items-end gap-4">
          {RADII.map((r) => (
            <div key={r} className="text-center">
              <div
                className="h-12 w-12 border border-border-strong bg-surface-overlay"
                style={{ borderRadius: `var(--nx-radius-${r})` }}
              />
              <div className="mt-1 font-mono text-xs text-text-muted">{`--nx-radius-${r}`}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        {TYPE_SIZES.map((s) => (
          <p key={s} className="mb-1 font-mono" style={{ fontSize: `var(--nx-text-${s})` }}>
            {`--nx-text-${s}`}
          </p>
        ))}
      </Section>

      <Section title="Status">
        <div className="flex flex-wrap items-center gap-3">
          {STATUS.map((s) => (
            <span
              key={s.label}
              className="rounded-full px-4 py-2 text-sm"
              style={{ color: `var(${s.token})`, border: `1px ${s.borderStyle} var(${s.token})` }}
            >
              {s.label}
            </span>
          ))}
        </div>
        <p className="mt-3 max-w-prose text-sm text-text-muted">
          infeasible is a valid engineering result, not a fault: the pipeline finished its work
          and answered that no design satisfies the duty. It is rendered with its own token
          (--nx-verdict), a dashed border, and its own label — never with the failed treatment.
        </p>
      </Section>
    </main>
  );
}
