import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  inventoryItems,
  inventoryRequests,
  requestHistory,
  users,
} from "@/db/schema";
import { createItem } from "@/features/inventory/services/inventory.service";
import {
  createRequest,
  updateRequestStatus,
} from "@/features/requests/services/request.service";
import { resetDatabase } from "./test-db";

async function createUsers() {
  const [admin, employee] = await db
    .insert(users)
    .values([
      {
        name: "Admin",
        email: `admin-${crypto.randomUUID()}@test.local`,
        role: "admin",
      },
      {
        name: "Employee",
        email: `employee-${crypto.randomUUID()}@test.local`,
        role: "employee",
      },
    ])
    .returning();

  return { admin, employee };
}

async function createRequestFixture(
  quantityOnHand = 10,
  quantityRequested = 2,
) {
  const { admin, employee } = await createUsers();
  const item = await createItem(
    {
      name: `Test Item ${crypto.randomUUID()}`,
      sku: `SKU-${crypto.randomUUID()}`,
      category: "Assignment",
      warehouse: "Main Warehouse",
      unit: "Each",
      quantityOnHand,
      quantityReserved: 0,
      reorderPoint: 3,
    },
    admin.name,
  );
  const request = await createRequest(
    {
      department: "Operations",
      warehouse: "Main Warehouse",
      requiredBy: "2026-05-25",
      priority: "normal",
      reason: "Assignment verification",
      items: [{ itemId: item.id, quantityRequested }],
    },
    employee,
  );

  return { admin, employee, item, request };
}

describe("assignment verification flows", () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  it("creates inventory items with assignment fields", async () => {
    const { admin } = await createUsers();

    const item = await createItem(
      {
        name: "USB-C Dock",
        sku: `DOCK-${crypto.randomUUID()}`,
        category: "IT Supplies",
        warehouse: "Main Warehouse",
        unit: "Each",
        quantityOnHand: 12,
        quantityReserved: 0,
        reorderPoint: 4,
      },
      admin.name,
    );

    expect(item.name).toBe("USB-C Dock");
    expect(item.category).toBe("IT Supplies");
    expect(item.quantityOnHand).toBe(12);
    expect(item.reorderPoint).toBe(4);
  });

  it("creates requests as pending and writes creation history", async () => {
    const { request } = await createRequestFixture();

    const history = await db
      .select()
      .from(requestHistory)
      .where(eq(requestHistory.requestId, request.id));

    expect(request.status).toBe("pending");
    expect(history.map((entry) => entry.action)).toEqual(["request_created"]);
  });

  it("approves and rejects requests without deducting stock", async () => {
    const approvedFixture = await createRequestFixture(10, 2);
    const rejectedFixture = await createRequestFixture(8, 3);

    await updateRequestStatus(
      approvedFixture.request.id,
      { status: "approved" },
      approvedFixture.admin.name,
    );
    await updateRequestStatus(
      rejectedFixture.request.id,
      { status: "rejected", adminComment: "Not needed." },
      rejectedFixture.admin.name,
    );

    const [approvedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, approvedFixture.item.id));
    const [rejectedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, rejectedFixture.item.id));

    expect(approvedItem.quantityOnHand).toBe(10);
    expect(rejectedItem.quantityOnHand).toBe(8);
  });

  it("fulfills approved requests with sufficient stock", async () => {
    const { admin, item, request } = await createRequestFixture(10, 4);

    await updateRequestStatus(request.id, { status: "approved" }, admin.name);
    await updateRequestStatus(request.id, { status: "fulfilled" }, admin.name);

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

    expect(updatedItem.quantityOnHand).toBe(6);
    expect(updatedItem.quantityOnHand).toBeGreaterThanOrEqual(0);
    expect(updatedRequest.status).toBe("fulfilled");
    expect(history.map((entry) => entry.action)).toEqual([
      "request_created",
      "request_approved",
      "request_fulfilled",
    ]);
  });

  it("blocks insufficient fulfillment and leaves stock unchanged", async () => {
    const { admin, item, request } = await createRequestFixture(2, 5);

    await updateRequestStatus(request.id, { status: "approved" }, admin.name);
    await expect(
      updateRequestStatus(request.id, { status: "fulfilled" }, admin.name),
    ).rejects.toThrow("Insufficient stock");

    const [updatedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, item.id));
    const [updatedRequest] = await db
      .select()
      .from(inventoryRequests)
      .where(eq(inventoryRequests.id, request.id));

    expect(updatedItem.quantityOnHand).toBe(2);
    expect(updatedItem.quantityOnHand).toBeGreaterThanOrEqual(0);
    expect(updatedRequest.status).toBe("approved");
  });
});
