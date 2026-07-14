import { describe, expect, it } from "vitest";
import { calculateCurrencyAmount, convertCurrency } from "@/lib/currency";

describe("匯率換算", () => {
  it("支援日幣與台幣雙向換算", () => {
    expect(convertCurrency(5000, 0.21, "JPY_TWD")).toBe(1050);
    expect(convertCurrency(1050, 0.21, "TWD_JPY")).toBe(5000);
  });

  it("無效金額不產生 NaN", () => {
    expect(convertCurrency(Number.NaN, 0.21, "JPY_TWD")).toBe(0);
    expect(convertCurrency(1000, 0, "JPY_TWD")).toBe(0);
  });

  it("可以加總或扣除多筆金額", () => {
    expect(calculateCurrencyAmount(5000, 1000, "+")).toBe(6000);
    expect(calculateCurrencyAmount(5000, 1000, "-")).toBe(4000);
  });
});
