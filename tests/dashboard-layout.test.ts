import { describe, expect, test } from "bun:test";
import { normalizeLayout, shouldRevealEdit } from "../src/hub/layout";

describe("dashboard preferences", () => {
  const defs = [{ id: "clock", size: "M" as const }, { id: "recordings", size: "S" as const, optional: true }];
  test("new widgets stay in Add card until chosen", () => {
    expect(normalizeLayout(null, defs)).toEqual({ v: 1, items: [{ id: "clock", size: "M" }], hidden: ["recordings"] });
  });
  test("chosen widgets and hidden cards survive normalization", () => {
    expect(normalizeLayout({ v: 1, items: [{ id: "recordings", size: "L" }], hidden: ["clock"] }, defs)).toEqual({ v: 1, items: [{ id: "recordings", size: "L" }], hidden: ["clock"] });
  });
  test("a downward swipe reveals editing but sideways/upward swipes do not", () => {
    expect(shouldRevealEdit({ x: 100, y: 100 }, { x: 110, y: 165 })).toBe(true);
    expect(shouldRevealEdit({ x: 100, y: 100 }, { x: 180, y: 165 })).toBe(false);
    expect(shouldRevealEdit({ x: 100, y: 100 }, { x: 100, y: 30 })).toBe(false);
  });
});