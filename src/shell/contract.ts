// The VerticalStage contract — the shape every vertical must supply for the
// frame to render it. Configs are static data (S4a); no engineering value
// (dimension, tolerance, stress, check result) may appear in any string.

export type FiveState = 'pending' | 'running' | 'converged' | 'infeasible' | 'failed';

export interface Mode {
  id: string;
  icon: string;
  label: string;
}

export interface VerticalStage {
  id: 'web' | 'cad';
  crumb: string[]; // ['CAD Vertical','Acme Water District','Booster pump shaft package']
  status: FiveState;
  statusDetail?: string; // 'CYCLE 3/20'
  primaryAction: { label: string; enabled: boolean; gate?: 'human' | 'pe-seal' };
  modes: Mode[];
  composerTarget: string; // '@FORGE' | '@HERMES'
  crew: { initial: string; color: 'accent' | 'success' | 'warn' | 'verdict' | 'pending' }[];
  provisionalBanner?: string; // present => rendered UNDISMISSABLE
  brain: {
    title: string;
    desc: string;
    kv: [string, string][];
    agents: { code: string; name: string; role: string; state: FiveState | 'done' | 'waiting' }[];
    context: { icon: string; name: string; sub: string }[];
    activity: { t: string; text: string }[];
  };
}
