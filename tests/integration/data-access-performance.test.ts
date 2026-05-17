import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  requestHistory,
  users,
} from "@/db/schema";
import {
  getItemById,
  listItems,
  listRequestableItems,
} from "@/features/inventory/services/inventory.service";
import {
  getRequestById,
  listRequests,
} from "@/features/requests/services/request.service";
import { resetDatabase } from "./test-db";

describe("bounded data access", () => {
  beforeEach(resetDatabase);

  it("returns paginated inventory rows and direct item details", async () => {
    const [paper, ink] = await db
      .insert(inventoryItems)
      .values([
        {
          name: "Alpha Paper",
          sku: "PERF-PAPER",
          category: "Office",
          warehouse: "Main Warehouse",
          unit: "Ream",
          quantityOnHand: 10,
          quantityReserved: 0,
          reorderPoint: 3,
        },
        {
          name: "Beta Ink",
          sku: "PERF-INK",
          category: "IT",
          warehouse: "Main Warehouse",
          unit: "Each",
          quantityOnHand: 2,
          quantityReserved: 0,
          reorderPoint: 5,
        },
        {
          name: "Gamma Labels",
          sku: "PERF-LABEL",
          category: "Packaging",
          warehouse: "Main Warehouse",
          unit: "Roll",
          quantityOnHand: 0,
          quantityReserved: 0,
          reorderPoint: 4,
        },
      ])
      .returning();

    const firstPage = await listItems({ page: 1, pageSize: 2 });
    const requestablePage = await listRequestableItems({
      page: 1,
      pageSize: 1,
      q: "PERF",
    });
    const lowStock = await listItems({ stock: "low" });
    const searched = await listItems({ q: "PERF-PAPER" });
    const detail = await getItemById(ink.id);

    expect(firstPage.rows).toHaveLength(2);
    expect(firstPage.totalCount).toBe(3);
    expect(firstPage.pageCount).toBe(2);
    expect(requestablePage.rows).toHaveLength(1);
    expect(requestablePage.totalCount).toBe(3);
    expect(requestablePage.pageCount).toBe(3);
    expect(lowStock.rows.map((item) => item.id)).toEqual([ink.id]);
    expect(searched.rows.map((item) => item.id)).toEqual([paper.id]);
    expect(detail?.id).toBe(ink.id);
    expect(detail?.available).toBe(2);
  });

  it("returns paginated request rows while detail includes items and history", async () => {
    const [admin, employee, otherEmployee] = await db
      .insert(users)
      .values([
        { name: "Admin", email: "perf-admin@test.local", role: "admin" },
        {
          name: "Employee",
          email: "perf-employee@test.local",
          role: "employee",
        },
        {
          name: "Other Employee",
          email: "perf-other@test.local",
          role: "employee",
        },
      ])
      .returning();
    const [paper, ink] = await db
      .insert(inventoryItems)
      .values([
        {
          name: "Performance Paper",
          sku: "REQ-PAPER",
          category: "Office",
          warehouse: "Main Warehouse",
          unit: "Ream",
          quantityOnHand: 10,
          quantityReserved: 0,
          reorderPoint: 3,
        },
        {
          name: "Performance Ink",
          sku: "REQ-INK",
          category: "IT",
          warehouse: "Main Warehouse",
          unit: "Each",
          quantityOnHand: 5,
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
          requestCode: "REQ-PERF-001",
          department: "Operations",
          warehouse: "Main Warehouse",
          requiredBy: new Date("2026-05-25"),
          priority: "normal",
          reason: "Need paper",
          status: "pending",
        },
        {
          requesterId: otherEmployee.id,
          requestCode: "REQ-PERF-002",
          department: "IT",
          warehouse: "Main Warehouse",
          requiredBy: new Date("2026-05-26"),
          priority: "high",
          reason: "Need ink",
          status: "approved",
          approverId: admin.id,
        },
      ])
      .returning();

    await db.insert(inventoryRequestItems).values([
      {
        requestId: ownRequest.id,
        itemId: paper.id,
        quantityRequested: 2,
        unit: paper.unit,
      },
      {
        requestId: otherRequest.id,
        itemId: ink.id,
        quantityRequested: 1,
        quantityApproved: 1,
        unit: ink.unit,
      },
    ]);
    await db.insert(requestHistory).values({
      requestId: ownRequest.id,
      actorName: employee.name,
      actorRole: "Employee",
      action: "request_created",
      toStatus: "pending",
    });

    const adminPage = await listRequests({ page: 1, pageSize: 1 }, admin);
    const employeePage = await listRequests({}, employee);
    const categoryPage = await listRequests({ category: "IT" }, admin);
    const searchPage = await listRequests({ q: "Performance Paper" }, admin);
    const detail = await getRequestById(ownRequest.id, employee);

    expect(adminPage.rows).toHaveLength(1);
    expect(adminPage.totalCount).toBe(2);
    expect(adminPage.pageCount).toBe(2);
    expect(employeePage.rows.map((request) => request.id)).toEqual([
      ownRequest.id,
    ]);
    expect(categoryPage.rows.map((request) => request.id)).toEqual([
      otherRequest.id,
    ]);
    expect(searchPage.rows.map((request) => request.id)).toEqual([
      ownRequest.id,
    ]);
    expect(detail.items).toHaveLength(1);
    expect(detail.requestHistory).toHaveLength(1);
    await expect(getRequestById(otherRequest.id, employee)).rejects.toThrow(
      "Request not found.",
    );
  });
});
