import Link from "next/link";
import { groups } from "@/nav/config";

// Left rail. Server component — renders straight from nav config.
export default function Rail() {
  return (
    <nav
      className="shrink-0 border-r border-border-subtle bg-surface-raised p-4"
      style={{ width: "240px" }}
    >
      <ul className="flex flex-col gap-1">
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              href={`/g/${g.id}`}
              className={
                g.id === "jobs"
                  ? "block rounded-md border border-accent px-3 py-2 text-sm text-accent"
                  : "block rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-overlay hover:text-text-primary"
              }
            >
              {g.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
