import { describe, expect, it } from "vitest";
import {
  availableQuantity,
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
});
