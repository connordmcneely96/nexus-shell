import { Omnibar } from "@/components/frame/CommandK";

// Topbar v2. Server component — logo, workspace chip, omnibar, avatar.
export default function Topbar() {
  return (
    <header
      className="flex shrink-0 items-center gap-4 border-b border-border-subtle bg-surface-base px-4"
      style={{ height: "52px" }}
    >
      <span className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent font-mono text-xs">N</span>
        <span className="font-mono tracking-wide text-text-primary">NEXUS</span>
      </span>
      {/* workspace switcher — non-functional chip */}
      <span className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted">
        <span className="h-2 w-2 rounded-full bg-success" />
        Inner Animal Media
      </span>
      <div className="flex min-w-0 flex-1 justify-center">
        <Omnibar />
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-xs text-text-primary">
        CM
      </span>
    </header>
  );
}
