import { describe, it, expect } from "vitest";
import { jobs } from "./fixtures";
import type { PendingValue } from "./types";

const PENDING: readonly string[] = ["<<dim>>", "<<tol - pending>>", "<<check - pending>>"];
const isPending = (v: unknown): v is PendingValue =>
  typeof v === "string" && PENDING.includes(v);

// Keys that carry an ENGINEERING value — must always hold a PendingValue.
const ENGINEERING_KEYS = [
  "dimension", "dim", "tolerance", "tol", "stress", "deflection",
  "load", "margin", "diameter", "thickness", "pressure", "result",
];
const isEngineeringKey = (key: string) =>
  ENGINEERING_KEYS.some((k) => key.toLowerCase().includes(k));

// Operational keys — REAL values, exempt by explicit name (written out, not
// inferred). These are numbers by design and must never be flagged.
const OPERATIONAL_ALLOWLIST = new Set([
  "cost", "elapsed", "runCount", "cycle", "maxCycles",
  "subtasks", "createdAt", "updatedAt", "percentComplete",
]);

function walk(node: unknown, path: string, out: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((el, i) => walk(el, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const here = path ? `${path}.${key}` : key;
      if (!OPERATIONAL_ALLOWLIST.has(key) && isEngineeringKey(key) && !isPending(value)) {
        out.push(`${here} = ${JSON.stringify(value)} (expected a PendingValue)`);
      }
      walk(value, here, out);
    }
  }
}

describe("engineering-value invariant", () => {
  it("no engineering-keyed field holds anything but a PendingValue", () => {
    const violations: string[] = [];
    walk(jobs, "", violations);
    expect(
      violations,
      `engineering fields must be PendingValue:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
