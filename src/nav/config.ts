// Single source of truth for the information architecture. This is DATA —
// components render from it and no route knowledge lives outside this file.
// Tools are Phase 2: findable in nav and palette, not reachable.

export interface ToolEntry {
  slug: string;
  label: string;
}

export interface NavGroup {
  id: string;
  label: string;
  stub?: boolean; // group has no tools yet; a later sprint fills it
  tools: ToolEntry[];
}

const titleCase = (slug: string): string =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Acronym/proper-noun casing where mechanical title-casing reads wrong.
export const LABEL_OVERRIDES: Record<string, string> = {
  cad: "CAD",
  fmea: "FMEA",
  rfq: "RFQ",
  ide: "IDE",
  "ai-providers": "AI Providers",
  "d1-explorer": "D1 Explorer",
};

const tools = (slugs: string[]): ToolEntry[] =>
  slugs.map((slug) => ({ slug, label: LABEL_OVERRIDES[slug] ?? titleCase(slug) }));

export const groups: NavGroup[] = [
  { id: "jobs", label: "Jobs", stub: true, tools: [] }, // FIRST. S4 fills it.
  { id: "design", label: "Design", tools: tools(["cad", "design", "design-studio", "standards", "library", "fmea"]) },
  { id: "commerce", label: "Commerce", tools: tools(["rfq", "proposal", "finance", "launch-desk"]) },
  { id: "operations", label: "Operations", tools: tools(["pipeline", "orchestrator", "agent", "maintenance", "history"]) },
  { id: "insight", label: "Insight", tools: tools(["analytics", "oracle", "learn"]) },
  { id: "system", label: "System", tools: tools(["settings", "ai-providers", "browser", "d1-explorer", "ide", "storage", "terminal"]) },
];
