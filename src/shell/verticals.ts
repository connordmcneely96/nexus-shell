import type { VerticalStage } from "./contract";

// Static vertical configs for the v3 shell anatomy. Agent names are the REAL
// roster: INTAKE, HERMES, MODELER, CAD-REVIEWER, SENTINEL, ATLAS, FORGE.
// Operational labels (cycles, run counts, elapsed) are fine; a dimension,
// tolerance, stress, or check result must NEVER appear in any string here.

export const web: VerticalStage = {
  id: "web",
  crumb: ["Website Factory", "Acme", "Build Acme client portal"],
  status: "running",
  primaryAction: { label: "Deploy ↗", enabled: true, gate: "human" },
  // Mode IDs are load-bearing for S4b — do not restyle, rename, or reorder.
  modes: [
    { id: "preview", icon: "◉", label: "Preview" },
    { id: "canvas", icon: "▦", label: "Canvas" },
    { id: "code", icon: "⟨⟩", label: "Code" },
    { id: "data", icon: "▤", label: "Data" },
    { id: "workflow", icon: "↝", label: "Workflow" },
    { id: "terminal", icon: "❯_", label: "Terminal" },
  ],
  composerTarget: "@FORGE",
  crew: [
    { initial: "F", color: "accent" },
    { initial: "S", color: "success" },
    { initial: "H", color: "pending" },
  ],
  brain: {
    title: "Build Acme client portal",
    desc: "Design and ship a secure stakeholder portal grounded in Acme's existing visual system.",
    kv: [
      ["Client", "Acme"],
      ["Environment", "Preview"],
      ["Runs", "4"],
      ["Crew", "3 agents"],
    ],
    agents: [
      { code: "FORGE", name: "FORGE", role: "Site builder", state: "running" },
      { code: "SENTINEL", name: "SENTINEL", role: "Review gate", state: "waiting" },
      { code: "HERMES", name: "HERMES", role: "Orchestrator", state: "done" },
    ],
    context: [
      { icon: "▤", name: "acme-brand-kit", sub: "R2 · assets" },
      { icon: "≡", name: "portal-brief", sub: "R2 · brief" },
      { icon: "⌗", name: "deploy-config", sub: "KV · config" },
    ],
    activity: [
      { t: "3m", text: "FORGE building portal shell" },
      { t: "12m", text: "HERMES assigned subtasks to crew" },
      { t: "26m", text: "Mission brief accepted" },
    ],
  },
};

export const cad: VerticalStage = {
  id: "cad",
  crumb: ["CAD Vertical", "Acme Water District", "Booster pump shaft package"],
  status: "running",
  statusDetail: "CYCLE 3/20",
  primaryAction: { label: "Package — awaiting PE seal", enabled: false, gate: "pe-seal" },
  // Mode IDs are load-bearing for S4b — do not restyle, rename, or reorder.
  modes: [
    { id: "overview", icon: "◉", label: "Overview" },
    { id: "duty", icon: "▤", label: "Duty" },
    { id: "checks", icon: "✓", label: "Checks" },
    { id: "artifacts", icon: "◇", label: "Artifacts" },
    { id: "provenance", icon: "⛨", label: "Provenance" },
    { id: "model", icon: "◫", label: "Model" },
  ],
  composerTarget: "@HERMES",
  crew: [
    { initial: "I", color: "success" },
    { initial: "M", color: "accent" },
    { initial: "R", color: "pending" },
    { initial: "S", color: "pending" },
    { initial: "A", color: "verdict" },
  ],
  provisionalBanner:
    "PROVISIONAL PACK SECTIONS IN USE — FATIGUE · BEARING L10 — NOT FOR SALE UNTIL PE-SIGNED",
  brain: {
    title: "Booster pump shaft package",
    desc: "Mission for Acme Water District — solver mid-run, deliverable gated on PE seal.",
    kv: [
      ["Client", "Acme Water District"],
      ["Environment", "Staging"],
      ["Cycle", "3 of 20"],
      ["Crew", "5 agents"],
    ],
    agents: [
      { code: "INTAKE", name: "INTAKE", role: "Brief capture", state: "done" },
      { code: "MODELER", name: "MODELER", role: "Geometry synth", state: "running" },
      { code: "CAD-REVIEWER", name: "CAD-REVIEWER", role: "Geometry gate", state: "waiting" },
      { code: "SENTINEL", name: "SENTINEL", role: "Compliance gate", state: "waiting" },
      { code: "ATLAS", name: "ATLAS", role: "Spec citations", state: "running" },
    ],
    context: [
      { icon: "≡", name: "intake-brief", sub: "R2 · brief" },
      { icon: "⌗", name: "atlas-citations", sub: "RAG · standards" },
      { icon: "◇", name: "assembly-tree", sub: "D1 · structure" },
    ],
    activity: [
      { t: "2m", text: "MODELER started cycle 3" },
      { t: "9m", text: "ATLAS attached citation set" },
      { t: "14m", text: "INTAKE brief accepted" },
    ],
  },
};

export const verticals: VerticalStage[] = [web, cad];
