import { describe, expect, test } from "bun:test";
import { buildPatch, canOpenCars, diffForm, fieldsFor, initialForm, resolveRole, validate } from "../src/korauto/kam-form";

const row = {
  id: "c1", make: "VW", model: "Tiguan", year: 2016, km: 106000, vin: "WVG", plate_number: "0770",
  shipping_name: "Young Shin", shipping_date: null, buy_price: 7500, sale_price: 8500, amount_paid_cash: 0,
  amount_paid_bank: 8500, deposit: 500, amount_paid_by_client: 9000, payment_method: null, sale_status: "shipped",
  status: "sold", delivery_status: "not_started", notes: null, tracking_vessel: null, brand_new_column: "x",
};

describe("KorAuto Manager car form", () => {
  test("every column is displayed, unknown ones under Other", () => {
    const keys = fieldsFor(row).map((f) => f.key);
    for (const k of Object.keys(row)) expect(keys).toContain(k);
    expect(fieldsFor(row).find((f) => f.key === "brand_new_column")?.group).toBe("other");
  });

  test("untouched form produces no changes and an empty patch", () => {
    const f = initialForm(row, true);
    expect(diffForm(row, f)).toEqual([]);
    expect(buildPatch(row, f)).toEqual({});
  });

  test("workers never get payment fields in the form", () => {
    const f = initialForm(row, false);
    expect("buy_price" in f).toBe(false);
    expect("make" in f).toBe(true);
  });

  test("patch only has changed columns, converted like the manager", () => {
    const f = { ...initialForm(row, true), km: "", plate_number: "", year: "2017", sale_price: "" };
    expect(buildPatch(row, f)).toEqual({ km: null, plate_number: null, year: 2017, sale_price: null });
  });

  test("derived columns follow the manager's rules", () => {
    const f = { ...initialForm(row, true), deposit: "1000", shipping_date: "2026-11-01" };
    const p = buildPatch(row, f);
    expect(p.amount_paid_by_client).toBe(9500);
    expect(p.car_group).toBe("2026-11-01 Young Shin");
    expect(buildPatch(row, { ...initialForm(row, true), buy_price: "" }).buy_price).toBe(0);
  });

  test("validation", () => {
    expect(validate({ make: "", model: "x" })).toBe("Make and model required");
    expect(validate({ make: "a", model: "b", year: "20.5" })).toContain("whole number");
    expect(validate({ make: "a", model: "b", buy_price: "abc" })).toContain("number");
    expect(validate(initialForm(row, true))).toBeNull();
  });

  test("access mirrors useMyAccess", () => {
    expect(resolveRole(["worker", "admin"])).toBe("admin");
    expect(resolveRole(["accountant"])).toBe("accountant");
    expect(resolveRole([])).toBe("worker");
    expect(canOpenCars("admin", [])).toBe(true);
    expect(canOpenCars("worker", ["cars"])).toBe(true);
    expect(canOpenCars("worker", ["sales"])).toBe(false);
    expect(canOpenCars("accountant", ["*"])).toBe(false);
  });
});
