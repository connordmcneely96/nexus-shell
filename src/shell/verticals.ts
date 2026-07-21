import type { VerticalStage } from "./contract";

// Static vertical configs for the v3 shell anatomy. Agent names are the REAL
// roster: INTAKE, HERMES, MODELER, CAD-REVIEWER, SENTINEL, ATLAS, FORGE.
// Operational labels (cycles, run counts, elapsed) are fine; a dimension,
// tolerance, stress, or check result must NEVER appear in any string here.

export const web: VerticalStage = {
  id: "web",
  crumb: ["Website Factory", "Inner Animal Media", "Marketing site v7"],
  status: "converged",
  statusDetail: "V7 LIVE",
  primaryAction: { label: "Deploy ↗", enabled: true, gate: "human" },
  modes: [
    { id: "preview", icon: "◫", label: "Preview" },
    { id: "code", icon: "⌨", label: "Code" },
    { id: "runs", icon: "▶", label: "Runs" },
    { id: "analytics", icon: "∿", label: "Analytics" },
  ],
  composerTarget: "@FORGE",
  crew: [
    { initial: "F", color: "accent" },
    { initial: "S", color: "success" },
    { initial: "H", color: "pending" },
  ],
  brain: {
    title: "Website Factory",
    desc: "Production website vertical — v7 live, self-serve runs enabled.",
    kv: [
      ["Environment", "Production"],
      ["Version", "v7"],
      ["Runs", "128"],
      ["Crew", "3 agents"],
    ],
    agents: [
      { code: "FORGE", name: "FORGE", role: "Site builder", state: "done" },
      { code: "SENTINEL", name: "SENTINEL", role: "Review gate", state: "done" },
      { code: "HERMES", name: "HERMES", role: "Orchestrator", state: "waiting" },
    ],
    context: [
      { icon: "▤", name: "brand-kit", sub: "R2 · assets" },
      { icon: "≡", name: "site-brief", sub: "R2 · brief" },
      { icon: "⌗", name: "deploy-config", sub: "KV · config" },
    ],
    activity: [
      { t: "2m", text: "Deploy of v7 completed" },
      { t: "18m", text: "SENTINEL review passed" },
      { t: "31m", text: "FORGE build finished" },
    ],
  },
};

export const cad: VerticalStage = {
  id: "cad",
  crumb: ["CAD Vertical", "Acme Water District", "Booster pump shaft package"],
  status: "running",
  statusDetail: "CYCLE 3/20",
  primaryAction: { label: "Package — awaiting PE seal", enabled: false, gate: "pe-seal" },
  modes: [
    { id: "model", icon: "◇", label: "Model" },
    { id: "drawings", icon: "▤", label: "Drawings" },
    { id: "calcs", icon: "∑", label: "Calcs" },
    { id: "bom", icon: "☰", label: "BOM" },
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
    "PROVISIONAL — every engineering value is pending the TolerancePack. Not for sale, fabrication, or quotation until the PE seal is applied.",
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
