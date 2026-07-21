import { notFound } from "next/navigation";
import { groups } from "@/nav/config";

// Group landing pages. Tools render as disabled cards — labels and slugs
// only, never an engineering value. Cards are findable, not reachable.

// Runtime-rendered by design: incrementalCache is "dummy" (zero bindings),
// so prerendered output is unreachable at serve time. dynamicParams=false
// here means every /g/* request 404s in production (S3-F1). Unknown ids
// are handled by the explicit notFound() below.
export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = groups.find((g) => g.id === groupId);
  if (!group) notFound();

  return (
    <div>
      <h1 className="text-2xl">{group.label}</h1>

      {group.stub ? (
        <p className="mt-6 max-w-prose text-base text-text-muted">
          Jobs is the organizing surface — arriving in S4.
        </p>
      ) : (
        <div className="mt-6 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-3">
          {group.tools.map((tool) => (
            <div
              key={tool.slug}
              aria-disabled="true"
              className="rounded-md border border-border-subtle bg-surface-raised p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-base text-text-primary">{tool.label}</span>
                <span className="shrink-0 rounded-full border border-border-subtle px-2 py-1 text-xs text-text-muted">
                  Phase 2
                </span>
              </div>
              <div className="mt-2 font-mono text-xs text-text-faint">{tool.slug}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
