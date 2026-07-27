"use client";

import { useSyncExternalStore } from "react";

// UI-only state; never enters invariant-walked data; no localStorage
// (forbidden here — artifacts/OpenNext). "Remembered across renders" means
// within-session React state, NOT across reloads. Rail/Brain collapse are
// booleans and any panel-size numbers live ONLY in this store — never in a
// vertical config, mission fixture, or any root the invariant test walks.

export interface ShellLayout {
  railCollapsed: boolean;
  brainCollapsed: boolean;
  // True once the user manually toggles Brain this session — suppresses the
  // per-vertical default (S3) from overriding an explicit choice.
  brainUserSet: boolean;
}

let state: ShellLayout = {
  railCollapsed: false,
  brainCollapsed: false,
  brainUserSet: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

const set = (patch: Partial<ShellLayout>) => {
  state = { ...state, ...patch };
  emit();
};

export const shellLayout = {
  toggleRail: () => set({ railCollapsed: !state.railCollapsed }),
  setRailCollapsed: (v: boolean) => set({ railCollapsed: v }),
  toggleBrain: () => set({ brainCollapsed: !state.brainCollapsed, brainUserSet: true }),
  setBrainCollapsed: (v: boolean) => set({ brainCollapsed: v }),
  // Apply a vertical's default only if the user hasn't chosen this session.
  applyBrainDefault: (collapsed: boolean) => {
    if (!state.brainUserSet && state.brainCollapsed !== collapsed) set({ brainCollapsed: collapsed });
  },
};

export function useShellLayout(): ShellLayout {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
