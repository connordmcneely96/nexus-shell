import { CommandKHint } from "@/components/frame/CommandK";

// Topbar. Server component — wordmark left, Cmd+K hint right.
export default function Topbar() {
  return (
    <header
      className="flex items-center justify-between border-b border-border-subtle bg-surface-base px-4"
      style={{ height: "48px" }}
    >
      <span className="font-mono tracking-wide text-text-primary">NEXUS</span>
      {/* text-faint is correct here: the chip is decorative ornament */}
      <CommandKHint />
    </header>
  );
}
