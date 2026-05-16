import { describe, expect, it } from "vitest";
import {
  createItemSchema,
  createRequestSchema,
  updateRequestStatusSchema,
} from "@/lib/validations";

describe("validation", () => {
  it("accepts valid item input", () => {
    expect(
      createItemSchema.parse({
        name: "A4 Paper",
        sku: "PAPER-A4",
        category: "Stationery",
        warehouse: "Main Warehouse",
        unit: "Ream",
        quantityOnHand: 10,
        quantityReserved: 0,
        reorderPoint: 5,
      }),
    ).toMatchObject({ name: "A4 Paper" });
  });

  it("rejects invalid item input", () => {
    expect(() =>
      createItemSchema.parse({
        name: "",
        sku: "",
        category: "",
        warehouse: "",
        unit: "",
        quantityOnHand: -1,
        quantityReserved: -1,
        reorderPoint: -1,
      }),
    ).toThrow();
  });

  it("accepts multi-item requests", () => {
    expect(
      createRequestSchema.parse({
        department: "Marketing",
        warehouse: "Main Warehouse",
        requiredBy: "2026-05-22",
        priority: "normal",
        reason: "Campaign prep",
        items: [
          {
            itemId: crypto.randomUUID(),
            quantityRequested: 2,
          },
        ],
      }),
    ).toMatchObject({ department: "Marketing" });
  });

  it("rejects empty requests", () => {
    expect(() =>
      createRequestSchema.parse({
        department: "",
        warehouse: "",
        requiredBy: "",
        priority: "normal",
        reason: "",
        items: [],
      }),
    ).toThrow();
  });

  it("rejects duplicate request items", () => {
    const itemId = crypto.randomUUID();
    expect(() =>
      createRequestSchema.parse({
        department: "Marketing",
        warehouse: "Main Warehouse",
        requiredBy: "2026-05-22",
        priority: "normal",
        reason: "Campaign prep",
        items: [
          { itemId, quantityRequested: 1 },
          { itemId, quantityRequested: 2 },
        ],
      }),
    ).toThrow("Duplicate request items");
  });

  it("rejects invalid request statuses", () => {
    expect(() =>
      updateRequestStatusSchema.parse({ status: "unknown" }),
    ).toThrow();
  });

  it("requires a rejection comment", () => {
    expect(() =>
      updateRequestStatusSchema.parse({ status: "rejected" }),
    ).toThrow("A rejection comment is required.");
  });
});
