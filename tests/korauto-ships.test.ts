import { describe, expect, test } from "bun:test";
import { groupByShip, shipGroupKey, shipLabel } from "../src/korauto/ships";

const car = (id: string, o: Record<string, unknown>) => ({ id, ...o });

describe("ship grouping (mirrors KorAuto Manager)", () => {
  test("keys and labels", () => {
    expect(shipGroupKey("MV AH SHIN V.2609", "2026-10-16")).toBe("ah shin 2609@2026-10-16");
    expect(shipLabel("ah shin 2609@2026-10-16")).toBe("Ah Shin V.2609 · 16/10/2026");
    expect(shipGroupKey("CIG unassigned", "2026-01-01")).toBe("unassigned");
    expect(shipLabel("")).toBe("No shipment");
  });

  test("same ship, different arrival = separate groups; no-ship and unassigned pinned last", () => {
    const g = groupByShip([
      car("1", { shipping_name: "Ah Shin V.2609", tracking_eta: "2026-10-16" }),
      car("2", { tracking_vessel: "MV AH SHIN V.2609", tracking_eta: "2026-10-16" }),
      car("3", { shipping_name: "Ah Shin V.2609", tracking_eta: "2026-11-02" }),
      car("4", {}),
      car("5", { shipping_name: "CIG" }),
      car("6", { shipping_name: "Young Shin", shipping_date: "2026-08-01" }),
    ], "shipped");
    expect(g.map((x) => x.label)).toEqual(["Ah Shin V.2609 · 02/11/2026", "Ah Shin V.2609 · 16/10/2026", "Young Shin · 01/08/2026", "No shipment", "Unassigned"]);
    expect(g[1].list.map((c) => c.id)).toEqual(["1", "2"]);
    expect(g[1].span).toContain("ETA");
  });

  test("sales tab: soonest first, unassigned before no-shipment; autosallon sold go to archive", () => {
    const rows = [car("a", { shipping_name: "Hae Shin 101", tracking_eta: "2026-12-01" }), car("b", { shipping_name: "Sang Shin 7", tracking_eta: "2026-11-20" }), car("c", {}), car("d", { shipping_name: "unassigned" })];
    expect(groupByShip(rows, "sales").map((g) => g.key)).toEqual(["sang shin@2026-11-20", "hae shin 101@2026-12-01", "unassigned", ""]);
    expect(groupByShip([car("x", { status: "sold", shipping_name: "Ah Shin" })], "autosallon")[0].label).toBe("Sold — archive");
  });
});
