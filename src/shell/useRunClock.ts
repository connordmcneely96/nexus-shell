"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stateAt, BASE_CYCLE } from "@/mock/timeline";

// The polling contract: tick every 15s AND immediately on window focus — no
// websockets, no new infra. State is a pure function of elapsed (stateAt), so
// the same elapsed always yields the same state; zero Math.random, zero Date.
// Pauseable (the plan card pauses it while the confirm gate is open).

const POLL_MS = 15_000;
const TICK_SEC = 15;

export interface RunActivity {
  t: string;
  text: string;
}

export interface RunClock {
  active: boolean;
  elapsed: number;
  cycle: number;
  agentStates: Record<string, "done" | "running" | "waiting">;
  activity: RunActivity[]; // newest first
  paused: boolean;
  setPaused: (p: boolean) => void;
  addActivity: (text: string) => void; // CONNOR / composer entries
  advanceCycle: (next: number) => void; // plan-card confirm
}

export function useRunClock(active: boolean): RunClock {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmedCycle, setConfirmedCycle] = useState(0);
  const [extra, setExtra] = useState<RunActivity[]>([]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Restart the clock whenever a run becomes active.
  useEffect(() => {
    if (active) {
      setElapsed(0);
      setConfirmedCycle(0);
      setExtra([]);
    }
  }, [active]);

  // Poll: every 15s + on window focus. Ticks advance elapsed by a fixed step,
  // so progression stays deterministic and reproducible.
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (!pausedRef.current) setElapsed((e) => e + TICK_SEC);
    };
    const id = setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [active]);

  const scripted = stateAt(elapsed);
  const cycle = Math.max(scripted.cycle, confirmedCycle);
  const firedNewestFirst = [...scripted.firedActivity].reverse();
  const activity = active ? [...extra, ...firedNewestFirst] : [];

  const addActivity = useCallback((text: string) => {
    setExtra((x) => [{ t: "now", text }, ...x]);
  }, []);
  const advanceCycle = useCallback((next: number) => {
    setConfirmedCycle((c) => Math.max(c, next));
  }, []);

  return {
    active,
    elapsed,
    cycle: active ? cycle : BASE_CYCLE,
    agentStates: active ? scripted.agentStates : {},
    activity,
    paused,
    setPaused,
    addActivity,
    advanceCycle,
  };
}
