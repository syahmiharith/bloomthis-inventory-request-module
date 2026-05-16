import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  users,
} from "@/db/schema";
import {
  getDashboardPageData,
  getDashboardSummary,
} from "@/services/dashboard.service";
import { resetDatabase } from "./test-db";

describe("dashboard summaries", () => {
  beforeEach(resetDatabase);

  it("scopes employee counts and exposes admin-wide counts", async () => {
    const [admin, employee, otherEmployee] = await db
      .insert(users)
      .values([
        { name: "Admin", email: "admin-summary@test.local", role: "admin" },
        {
          name: "Employee",
          email: "employee-summary@test.local",
          role: "employee",
        },
        { name: "Other", email: "other-summary@test.local", role: "employee" },
      ])
      .returning();

    await db.insert(inventoryRequests).values([
      {
        requesterId: employee.id,
        requestCode: "REQ-SUMMARY-1",
        department: "Marketing",
        warehouse: "Main Warehouse",
        requiredBy: new Date(),
        priority: "normal",
        reason: "Own request",
        status: "pending",
      },
      {
        requesterId: otherEmployee.id,
        requestCode: "REQ-SUMMARY-2",
        department: "Sales",
        warehouse: "Main Warehouse",
        requiredBy: new Date(),
        priority: "high",
        reason: "Other request",
        status: "approved",
      },
    ]);

    const employeeSummary = await getDashboardSummary(employee);
    const adminSummary = await getDashboardSummary(admin);

    expect(employeeSummary.all.count).toBe(1);
    expect(employeeSummary.pending.count).toBe(1);
    expect(adminSummary.all.count).toBe(2);
    expect(adminSummary.approved.count).toBe(1);
  });

  it("returns role-specific dashboard page metrics and recent requests", async () => {
    const [admin, employee, otherEmployee] = await db
      .insert(users)
      .values([
        { name: "Admin", email: "admin-page@test.local", role: "admin" },
        {
          name: "Employee",
          email: "employee-page@test.local",
          role: "employee",
        },
        { name: "Other", email: "other-page@test.local", role: "employee" },
      ])
      .returning();

    const [availableItem, lowStockItem] = await db
      .insert(inventoryItems)
      .values([
        {
          name: "A4 Paper",
          sku: "DASH-PAPER",
          category: "Office",
          warehouse: "Main Warehouse",
          unit: "Ream",
          quantityOnHand: 10,
          quantityReserved: 0,
          reorderPoint: 2,
        },
        {
          name: "Ink",
          sku: "DASH-INK",
          category: "Office",
          warehouse: "Main Warehouse",
          unit: "Each",
          quantityOnHand: 1,
          quantityReserved: 0,
          reorderPoint: 2,
        },
      ])
      .returning();

    const [ownRequest, otherRequest] = await db
      .insert(inventoryRequests)
      .values([
        {
          requesterId: employee.id,
          requestCode: "REQ-PAGE-1",
          department: "Marketing",
          warehouse: "Main Warehouse",
          requiredBy: new Date(),
          priority: "normal",
          reason: "Own request",
          status: "pending",
        },
        {
          requesterId: otherEmployee.id,
          requestCode: "REQ-PAGE-2",
          department: "Sales",
          warehouse: "Main Warehouse",
          requiredBy: new Date(),
          priority: "normal",
          reason: "Other request",
          status: "approved",
        },
      ])
      .returning();

    await db.insert(inventoryRequestItems).values([
      {
        requestId: ownRequest.id,
        itemId: availableItem.id,
        quantityRequested: 3,
        unit: availableItem.unit,
      },
      {
        requestId: otherRequest.id,
        itemId: lowStockItem.id,
        quantityRequested: 1,
        unit: lowStockItem.unit,
      },
    ]);

    const employeeDashboard = await getDashboardPageData(employee);
    const adminDashboard = await getDashboardPageData(admin);

    expect(adminDashboard.inventory.totalItems).toBe(2);
    expect(adminDashboard.inventory.lowStockItems).toBe(1);
    expect(adminDashboard.requests.pendingRequests).toBe(1);
    expect(adminDashboard.recentRequests).toHaveLength(2);

    expect(employeeDashboard.inventory.availableItems).toBe(2);
    expect(employeeDashboard.requests.totalRequests).toBe(1);
    expect(employeeDashboard.requests.pendingRequests).toBe(1);
    expect(employeeDashboard.recentRequests).toHaveLength(1);
    expect(employeeDashboard.recentRequests[0].requestCode).toBe("REQ-PAGE-1");
  });
});
