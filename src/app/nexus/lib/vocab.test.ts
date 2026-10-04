import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// M1.4 grep check: the entity is "Mission". Scans every source file under
// src/app/nexus (this test excluded) for banned user-facing vocabulary and for
// bare percentages / confidence language.
const root = join(__dirname, "..");
const files = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(d, e.name)) : /\.(tsx?)$/.test(e.name) && !e.name.endsWith(".test.ts") ? [join(d, e.name)] : []);

const BANNED: [string, RegExp][] = [
  ["Job/Project vocabulary", /\b(jobs?|projects?)\b/i],
  ["confidence language", /confidence/i],
  ["bare percentage", /\d\s?%/],
];

describe("nexus vocabulary", () => {
  for (const [name, re] of BANNED) {
    it(`has no ${name}`, () => {
      const hits = files(root).filter((f) => re.test(readFileSync(f, "utf8")));
      expect(hits).toEqual([]);
    });
  }
});
