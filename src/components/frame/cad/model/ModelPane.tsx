// Model — the parametric-document stage. Three regions: a stage-local tree
// rail (left), a toolbar strip and a viewport area (center). The rail lives
// INSIDE this pane; the shell Rail is untouched. S1 ships the skeleton; the
// tree, toolbar ops, and viewport arrive in later sprints.

export default function ModelPane() {
  return (
    <div className="flex h-full">
      {/* left — stage-local tree rail */}
      <aside
        className="flex shrink-0 flex-col border-r border-border-subtle"
        style={{ width: 264 }}
      >
        <header className="border-b border-border-subtle px-5 py-3">
          <h2 className="font-mono text-xs uppercase text-text-muted">Model tree</h2>
        </header>
        <div className="flex-1 p-5" />
      </aside>

      {/* center — toolbar strip over viewport */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-border-subtle px-5 py-3" />
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-text-faint">viewport — S2</span>
        </div>
      </div>
    </div>
  );
}
