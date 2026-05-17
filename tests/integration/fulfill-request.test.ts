import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  auditLogs,
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  requestHistory,
  users,
} from "@/db/schema";
import { createRequest, updateRequestStatus } from "@/services/request.service";
import { resetDatabase } from "./test-db";

async function createFixture(
  quantityOnHand: number,
  quantityRequested: number,
) {
  const [admin, employee] = await db
    .insert(users)
    .values([
      {
        name: "Admin",
        email: `admin-${crypto.randomUUID()}@test.local`,
        role: "admin",
      },
      {
        name: "Ali",
        email: `ali-${crypto.randomUUID()}@test.local`,
        role: "employee",
      },
    ])
    .returning();
  const [item] = await db
    .insert(inventoryItems)
    .values({
      name: "A4 Paper",
      sku: `PAPER-${crypto.randomUUID()}`,
      category: "Stationery",
      warehouse: "Main Warehouse",
      unit: "Ream",
      quantityOnHand,
      quantityReserved: 0,
      reorderPoint: 5,
    })
    .returning();
  const request = await createRequest(
    {
      department: "Marketing",
      warehouse: "Main Warehouse",
      requiredBy: "2026-05-22",
      priority: "normal",
      reason: "Documents",
      items: [{ itemId: item.id, quantityRequested }],
    },
    employee,
  );
  return { admin, employee, item, request };
}

async function createMultiItemFixture() {
  const [admin, employee] = await db
    .insert(users)
    .values([
      {
        name: "Admin",
        email: `admin-${crypto.randomUUID()}@test.local`,
        role: "admin",
      },
      {
        name: "Ali",
        email: `ali-${crypto.randomUUID()}@test.local`,
        role: "employee",
      },
    ])
    .returning();
  const [firstItem, secondItem] = await db
    .insert(inventoryItems)
    .values([
      {
        name: "A4 Paper",
        sku: `PAPER-${crypto.randomUUID()}`,
        category: "Stationery",
        warehouse: "Main Warehouse",
        unit: "Ream",
        quantityOnHand: 10,
        quantityReserved: 0,
        reorderPoint: 5,
      },
      {
        name: "Ink",
        sku: `INK-${crypto.randomUUID()}`,
        category: "IT",
        warehouse: "Main Warehouse",
        unit: "Each",
        quantityOnHand: 8,
        quantityReserved: 0,
        reorderPoint: 2,
      },
    ])
    .returning();
  return { admin, employee, firstItem, secondItem };
}

describe("request approval and fulfillment", () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  it("does not deduct stock on approval and consumes it on fulfillment", async () => {
    const { admin, item, request } = await createFixture(10, 3);
    await updateRequestStatus(request.id, { status: "approved" }, admin.name);

    let [updatedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, item.id));
    expect(updatedItem.quantityOnHand).toBe(10);
    expect(updatedItem.quantityReserved).toBe(0);

    await updateRequestStatus(request.id, { status: "fulfilled" }, admin.name);
    [updatedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, item.id));
    const [updatedRequest] = await db
      .select()
      .from(inventoryRequests)
      .where(eq(inventoryRequests.id, request.id));
    const [line] = await db
      .select()
      .from(inventoryRequestItems)
      .where(eq(inventoryRequestItems.requestId, request.id));
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.requestId, request.id));
    const history = await db
      .select()
      .from(requestHistory)
      .where(eq(requestHistory.requestId, request.id));

    expect(updatedItem.quantityOnHand).toBe(7);
    expect(updatedItem.quantityReserved).toBe(0);
    expect(updatedRequest.status).toBe("fulfilled");
    expect(line.quantityApproved).toBe(3);
    expect(logs.some((log) => log.action === "request_fulfilled")).toBe(true);
    expect(history.map((entry) => entry.action)).toEqual([
      "request_created",
      "request_approved",
      "request_fulfilled",
    ]);
  });

  it("allows approval but blocks fulfillment when stock becomes unavailable", async () => {
    const { admin, item, request } = await createFixture(5, 4);
    await db
      .update(inventoryItems)
      .set({ quantityOnHand: 3 })
      .where(eq(inventoryItems.id, item.id));

    await updateRequestStatus(request.id, { status: "approved" }, admin.name);
    await expect(
      updateRequestStatus(request.id, { status: "fulfilled" }, admin.name),
    ).rejects.toThrow("Insufficient stock");

    const [updatedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, item.id));
    expect(updatedItem.quantityOnHand).toBe(3);
  });

  it("allows request creation even when requested quantity exceeds current stock", async () => {
    const { request } = await createFixture(2, 4);
    expect(request.status).toBe("pending");
  });

  it("rejects requests without deducting stock", async () => {
    const { admin, item, request } = await createFixture(10, 2);

    await updateRequestStatus(
      request.id,
      { status: "rejected", adminComment: "Not needed." },
      admin.name,
    );

    const [updatedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, item.id));
    const [updatedRequest] = await db
      .select()
      .from(inventoryRequests)
      .where(eq(inventoryRequests.id, request.id));
    const history = await db
      .select()
      .from(requestHistory)
      .where(eq(requestHistory.requestId, request.id));

    expect(updatedItem.quantityOnHand).toBe(10);
    expect(updatedItem.quantityReserved).toBe(0);
    expect(updatedRequest.status).toBe("rejected");
    expect(history.map((entry) => entry.action)).toEqual([
      "request_created",
      "request_rejected",
    ]);
  });

  it("blocks fulfilled requests from being fulfilled again", async () => {
    const { admin, request } = await createFixture(10, 3);
    await updateRequestStatus(request.id, { status: "approved" }, admin.name);
    await updateRequestStatus(request.id, { status: "fulfilled" }, admin.name);
    await expect(
      updateRequestStatus(request.id, { status: "fulfilled" }, admin.name),
    ).rejects.toThrow("Cannot change request status");
  });

  it("requires comments when rejecting requests", async () => {
    const { admin, request } = await createFixture(10, 2);
    await expect(
      updateRequestStatus(request.id, { status: "rejected" }, admin.name),
    ).rejects.toThrow("A rejection comment is required.");
  });

  it("creates and fulfills multi-item requests", async () => {
    const { admin, employee, firstItem, secondItem } =
      await createMultiItemFixture();
    const request = await createRequest(
      {
        department: "Marketing",
        warehouse: "Main Warehouse",
        requiredBy: "2026-05-22",
        priority: "normal",
        reason: "Multi item request",
        items: [
          { itemId: firstItem.id, quantityRequested: 3 },
          { itemId: secondItem.id, quantityRequested: 4 },
        ],
      },
      employee,
    );

    await updateRequestStatus(request.id, { status: "approved" }, admin.name);
    await updateRequestStatus(request.id, { status: "fulfilled" }, admin.name);

    const [updatedFirst] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, firstItem.id));
    const [updatedSecond] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, secondItem.id));

    expect(updatedFirst.quantityOnHand).toBe(7);
    expect(updatedSecond.quantityOnHand).toBe(4);
  });

  it("blocks multi-item fulfillment without partial stock deduction", async () => {
    const { admin, employee, firstItem, secondItem } =
      await createMultiItemFixture();
    const request = await createRequest(
      {
        department: "Marketing",
        warehouse: "Main Warehouse",
        requiredBy: "2026-05-22",
        priority: "normal",
        reason: "Blocked multi item request",
        items: [
          { itemId: firstItem.id, quantityRequested: 3 },
          { itemId: secondItem.id, quantityRequested: 9 },
        ],
      },
      employee,
    );

    await updateRequestStatus(request.id, { status: "approved" }, admin.name);
    await expect(
      updateRequestStatus(request.id, { status: "fulfilled" }, admin.name),
    ).rejects.toThrow("Insufficient stock");

    const [updatedFirst] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, firstItem.id));
    const [updatedSecond] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, secondItem.id));

    expect(updatedFirst.quantityOnHand).toBe(10);
    expect(updatedSecond.quantityOnHand).toBe(8);
  });

  it("rejects duplicate items in request creation", async () => {
    const { employee, firstItem } = await createMultiItemFixture();
    await expect(
      createRequest(
        {
          department: "Marketing",
          warehouse: "Main Warehouse",
          requiredBy: "2026-05-22",
          priority: "normal",
          reason: "Duplicate item request",
          items: [
            { itemId: firstItem.id, quantityRequested: 1 },
            { itemId: firstItem.id, quantityRequested: 2 },
          ],
        },
        employee,
      ),
    ).rejects.toThrow("Duplicate request items");
  });
});
