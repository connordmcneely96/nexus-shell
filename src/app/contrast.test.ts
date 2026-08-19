import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Reads the ACTUAL token values from tokens.css and asserts WCAG contrast, so
// the proof stays honest across the deepened-surface commit. Cyan is much
// lighter than the old blue — the on-accent pairing is the whole risk here.

const css = readFileSync(fileURLToPath(new URL("./tokens.css", import.meta.url)), "utf8");
const tok = (name: string): string => {
  const m = css.match(new RegExp(`--nx-${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`token --nx-${name} not found in tokens.css`);
  return m[1];
};

const chan = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const L = (h: string) => {
  const [r, g, b] = chan(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("token contrast (WCAG)", () => {
  it("accent on surface-base >= 4.5:1 (accent as text/icon)", () => {
    expect(ratio(tok("accent"), tok("surface-base"))).toBeGreaterThanOrEqual(4.5);
  });
  it("on-accent on accent >= 4.5:1 (button text on accent bg)", () => {
    expect(ratio(tok("on-accent"), tok("accent"))).toBeGreaterThanOrEqual(4.5);
  });
  it("text-primary on surface-base >= 7:1", () => {
    expect(ratio(tok("text-primary"), tok("surface-base"))).toBeGreaterThanOrEqual(7);
  });
});
