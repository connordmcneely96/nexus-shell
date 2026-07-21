// Topbar. Server component — wordmark left, Cmd+K hint right.
export default function Topbar() {
  return (
    <header
      className="flex items-center justify-between border-b border-border-subtle bg-surface-base px-4"
      style={{ height: "48px" }}
    >
      <span className="font-mono tracking-wide text-text-primary">NEXUS</span>
      {/* text-faint is correct here: the chip is decorative ornament */}
      <span className="rounded-sm border border-border-subtle px-2 py-1 font-mono text-xs text-text-faint">
        ⌘K / Ctrl+K
      </span>
    </header>
  );
}
