import { describe, it, expect } from "vitest";
import { jobs } from "./fixtures";
import { missions } from "./missions";
import { RUN_TIMELINE } from "./timeline";
import { verticals } from "../shell/verticals";
import { workbench } from "./workbench";
import type { PendingValue } from "./types";

const PENDING: readonly string[] = ["<<dim>>", "<<tol - pending>>", "<<check - pending>>"];
const isPending = (v: unknown): v is PendingValue =>
  typeof v === "string" && PENDING.includes(v);

// Fail-closed allowlist. Every key is either operational, structural, or it
// holds a PendingValue — there is no name matching and no fourth category, so
// a new field (`torque`, `rpm`, `flow`, …) fails until it is classified here.

// Operational keys — real numbers by design (S5 renders them).
const OPERATIONAL_KEYS = new Set([
  "cost", "elapsed", "runCount", "cycle", "maxCycles",
  "subtasks", "percentComplete", "createdAt", "updatedAt",
  // Timeline script (S5) — cycle already above.
  "atSec",
]);

// Geometric keys — real numbers, but a DISTINCT category from operational.
// Geometry (sketch coordinates, kernel/user-authored positions) is design
// INPUT, not a solver-produced engineering result — the same category as a
// duty value, which is why it is a real number and not a PendingValue. Keeping
// it separate from OPERATIONAL_KEYS keeps the boundary legible: operational =
// run bookkeeping (cost, cycles, timestamps), geometric = authored geometry.
const GEOMETRIC_KEYS = new Set(["sketchX", "sketchY"]);

// String-enum maps: agentStates is agent-code → run-state. The keys are
// dynamic (the roster), so it is classified here as a whole rather than
// per-key. Fail-closed still holds: every VALUE must be a string — a number
// smuggled in as a state would be flagged.
const STRING_MAP_KEYS = new Set(["agentStates"]);

// Structural keys — labels, ids, flags, containers. Never a number.
const STRUCTURAL_KEYS = new Set([
  "id", "name", "label", "status", "blockingConstraint",
  "runs", "checks", "assumptions",
  // VerticalStage contract (S4a) — every classification is an explicit key.
  "icon", "initial", "color", "t", "text", "desc", "kv", "crew", "modes",
  "context", "activity", "sub", "code", "role", "state", "crumb",
  "composerTarget", "statusDetail", "gate", "due", "owner",
  "primaryAction", "brain", "agents", "title", "provisionalBanner", "enabled",
  // Mission layer (S4b) — cost/elapsed/runCount are already operational,
  // blockingConstraint already structural.
  "vertical", "clientRef", "workspaceRef", "client",
  // Workbench document (Lane 6 S1) — sketchX/sketchY are geometric, not here.
  "docId", "nodeId", "group", "provenance", "citation", "nodes",
]);

const isStructuralValue = (v: unknown) =>
  typeof v === "string" || v === null || typeof v === "object" || typeof v === "boolean";

function walk(node: unknown, path: string, out: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((el, i) => walk(el, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const here = path ? `${path}.${key}` : key;
      if (STRING_MAP_KEYS.has(key)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          for (const [k2, v2] of Object.entries(value)) {
            if (typeof v2 !== "string") {
              out.push(`${here}.${k2} = ${JSON.stringify(v2)} (expected a string state)`);
            }
          }
        } else {
          out.push(`${here} = ${JSON.stringify(value)} (expected a string map)`);
        }
        continue; // classified leaf — do not recurse into dynamic roster keys
      }
      if (OPERATIONAL_KEYS.has(key)) {
        if (typeof value !== "number") {
          out.push(`${here} = ${JSON.stringify(value)} (expected a number)`);
        }
      } else if (GEOMETRIC_KEYS.has(key)) {
        if (typeof value !== "number") {
          out.push(`${here} = ${JSON.stringify(value)} (expected a number — geometry)`);
        }
      } else if (STRUCTURAL_KEYS.has(key)) {
        if (!isStructuralValue(value)) {
          out.push(`${here} = ${JSON.stringify(value)} (expected a string, null, boolean, array, or object — never a number)`);
        }
      } else if (!isPending(value)) {
        out.push(`${here} = ${JSON.stringify(value)} (expected a PendingValue)`);
      }
      walk(value, here, out);
    }
  }
}

describe("engineering-value invariant (fail-closed)", () => {
  it("every key is operational, structural, or holds a PendingValue", () => {
    const violations: string[] = [];
    walk(jobs, "", violations);
    walk(verticals, "verticals", violations);
    walk(missions, "missions", violations);
    walk(RUN_TIMELINE, "timeline", violations);
    walk(workbench, "workbench", violations);
    expect(
      violations,
      `unclassified or mistyped fields:\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  // Negative control — proves the guard still fails closed. An unclassified
  // numeric key (`torque`) is neither operational, geometric, structural, nor a
  // PendingValue, so it MUST be flagged. If this ever passes, the allowlist has
  // been widened into uselessness.
  it("flags an unclassified numeric key (fails closed)", () => {
    const violations: string[] = [];
    walk({ nodes: [{ torque: 42 }] }, "rogue", violations);
    expect(violations.length).toBeGreaterThan(0);
  });
});
