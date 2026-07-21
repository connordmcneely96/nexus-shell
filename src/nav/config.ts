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

// ── v3 shell rail (S4a) ─────────────────────────────────────────────────────
export interface RailItem {
  id: string;
  label: string;
  badge?: number;
  expandable?: boolean; // Products
  active?: boolean; // default-active item
}

export const RAIL_ITEMS: RailItem[] = [
  { id: "home", label: "Home" },
  { id: "missions", label: "Missions", badge: 4, active: true },
  { id: "projects", label: "Projects" },
  { id: "products", label: "Products", expandable: true },
  { id: "agents", label: "Agents", badge: 12 },
  { id: "workflows", label: "Workflows" },
  { id: "artifacts", label: "Artifacts" },
  { id: "codebases", label: "Codebases" },
  { id: "knowledge", label: "Knowledge" },
];

export type ProductStatus = "SHIPPED" | "BUILDING" | "DEV" | "PLANNED";

export interface Product {
  id: string;
  name: string;
  status: ProductStatus;
  sub?: string;
}

export const PRODUCTS: Product[] = [
  { id: "web", name: "Website Factory", status: "SHIPPED", sub: "v7 live · 128 runs" },
  { id: "cad", name: "CAD Vertical · Calc Engine", status: "BUILDING", sub: "S3 shipped · 32 test runs" },
  { id: "hermes", name: "Hermes Core", status: "DEV" },
  { id: "automation", name: "Automation Studio", status: "PLANNED", sub: "n8n parity · T12" },
  { id: "research", name: "Research Desk", status: "PLANNED", sub: "ORACLE surface" },
];

export interface ActiveSystem {
  id: string;
  name: string;
  env: string;
  agentCount: number;
}

export const ACTIVE_SYSTEMS: ActiveSystem[] = [
  { id: "web", name: "Website Factory", env: "Production", agentCount: 3 },
  { id: "cad", name: "CAD Vertical", env: "Staging", agentCount: 5 },
  { id: "hermes", name: "Hermes Core", env: "Development", agentCount: 1 },
];

// ── legacy grouped IA (S3 — /g pages + CommandK) ───────────────────────────
export const groups: NavGroup[] = [
  { id: "jobs", label: "Jobs", stub: true, tools: [] }, // FIRST. S4 fills it.
  { id: "design", label: "Design", tools: tools(["cad", "design", "design-studio", "standards", "library", "fmea"]) },
  { id: "commerce", label: "Commerce", tools: tools(["rfq", "proposal", "finance", "launch-desk"]) },
  { id: "operations", label: "Operations", tools: tools(["pipeline", "orchestrator", "agent", "maintenance", "history"]) },
  { id: "insight", label: "Insight", tools: tools(["analytics", "oracle", "learn"]) },
  { id: "system", label: "System", tools: tools(["settings", "ai-providers", "browser", "d1-explorer", "ide", "storage", "terminal"]) },
];
