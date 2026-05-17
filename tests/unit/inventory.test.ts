import { describe, expect, it } from "vitest";
import {
  availableQuantity,
  calculateStockHealthPercent,
  calculateStockKpis,
  stockHealthInterpretation,
  stockRiskRank,
  stockStatusFromQuantities,
} from "@/lib/inventory";

describe("inventory helpers", () => {
  it("derives availability and stock status consistently", () => {
    expect(availableQuantity(120, 6)).toBe(114);
    expect(stockStatusFromQuantities(0, 0, 10)).toBe("Out of Stock");
    expect(stockStatusFromQuantities(5, 0, 5)).toBe("Low Stock");
    expect(stockStatusFromQuantities(8, 1, 10)).toBe("Low Stock");
    expect(stockStatusFromQuantities(120, 6, 15)).toBe("In Stock");
  });

  it("calculates operational stock KPIs", () => {
    expect(
      calculateStockKpis([
        {
          quantityOnHand: 0,
          quantityReserved: 0,
          reorderPoint: 10,
          warehouse: "Main",
        },
        {
          quantityOnHand: 8,
          quantityReserved: 1,
          reorderPoint: 10,
          warehouse: "Main",
        },
        {
          quantityOnHand: 20,
          quantityReserved: 3,
          reorderPoint: 10,
          warehouse: "Secondary",
        },
      ]),
    ).toEqual({
      totalItems: 3,
      warehouses: 2,
      riskItems: 2,
      outOfStock: 1,
      reservedStock: 4,
      healthyItems: 1,
    });
  });

  it("orders risk severity and explains stock health", () => {
    expect(stockRiskRank("Out of Stock")).toBeLessThan(
      stockRiskRank("Low Stock"),
    );
    expect(stockRiskRank("Low Stock")).toBeLessThan(stockRiskRank("In Stock"));
    expect(stockHealthInterpretation("In Stock")).toContain("Healthy");
  });

  it("calculates stock health with active demand and a nonzero target", () => {
    expect(
      calculateStockHealthPercent({
        activeDemand: 80,
        available: 65,
        reorderPoint: 50,
      }),
    ).toBe(50);
    expect(
      calculateStockHealthPercent({
        activeDemand: 0,
        available: 250,
        reorderPoint: 50,
      }),
    ).toBe(100);
  });

  it("never reports out-of-stock or invalid stock health as 100 percent", () => {
    expect(
      calculateStockHealthPercent({
        activeDemand: 0,
        available: 0,
        reorderPoint: 0,
      }),
    ).toBe(0);
    expect(
      calculateStockHealthPercent({
        activeDemand: 100,
        available: -5,
        reorderPoint: 10,
      }),
    ).toBe(0);
    expect(
      calculateStockHealthPercent({
        activeDemand: Number.NaN,
        available: 10,
        reorderPoint: 10,
      }),
    ).toBe(0);
  });
});
