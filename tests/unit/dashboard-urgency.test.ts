import { describe, expect, it } from "vitest";
import { deriveRequestRisk } from "@/services/dashboard.service";

describe("dashboard urgency labels", () => {
  const now = new Date("2026-05-16T00:00:00.000Z");
  const soon = new Date("2026-05-19T00:00:00.000Z");

  it("prioritizes strongest urgency reasons", () => {
    expect(
      deriveRequestRisk(
        {
          requiredBy: new Date("2026-05-15T00:00:00.000Z"),
          available: 10,
          reorderPoint: 5,
          priority: "high",
        },
        now,
        soon,
      ),
    ).toBe("Overdue");
    expect(
      deriveRequestRisk(
        {
          requiredBy: new Date("2026-05-18T00:00:00.000Z"),
          available: 0,
          reorderPoint: 5,
          priority: "high",
        },
        now,
        soon,
      ),
    ).toBe("Out of Stock");
    expect(
      deriveRequestRisk(
        {
          requiredBy: new Date("2026-05-18T00:00:00.000Z"),
          available: 3,
          reorderPoint: 5,
          priority: "normal",
        },
        now,
        soon,
      ),
    ).toBe("Low Stock");
  });
});
