export default function StatusBar({ missionCount, agentCount, children }: { missionCount: number; agentCount: number; children?: React.ReactNode }) {
  return (
    <footer className="flex shrink-0 items-center gap-4 border-t border-border-subtle bg-surface-raised px-4 py-1 font-mono text-xs text-text-muted">
      <span>{missionCount} missions</span>
      <span>{agentCount} agents</span>
      {children}
      <span className="ml-auto">source: mock adapter (not live)</span>
    </footer>
  );
}
