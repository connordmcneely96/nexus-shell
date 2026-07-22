import { describe, it, expect } from "vitest";
import { jobs } from "./fixtures";
import { missions } from "./missions";
import { verticals } from "../shell/verticals";
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
]);

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
      if (OPERATIONAL_KEYS.has(key)) {
        if (typeof value !== "number") {
          out.push(`${here} = ${JSON.stringify(value)} (expected a number)`);
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
    expect(
      violations,
      `unclassified or mistyped fields:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
