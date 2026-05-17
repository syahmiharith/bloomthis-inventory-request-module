import { eq } from "drizzle-orm";
import { closeDb, db } from "./index";
import {
  auditLogs,
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  purchaseOrders,
  requestHistory,
  suppliers,
  users,
  warehouses,
} from "./schema";
import type { RequestStatus } from "@/lib/constants";

const departments = ["Marketing", "Sales", "IT", "Operations", "Finance"];
const statusCycle = ["pending", "approved", "fulfilled", "rejected"] as const;
const priorityCycle = ["normal", "high", "low"] as const;

async function seed() {
  await db.delete(auditLogs);
  await db.delete(requestHistory);
  await db.delete(inventoryRequestItems);
  await db.delete(inventoryRequests);
  await db.delete(purchaseOrders);
  await db.delete(suppliers);
  await db.delete(inventoryItems);
  await db.delete(warehouses);
  await db.delete(users);

  const [admin, opsLead, ...employees] = await db
    .insert(users)
    .values([
      {
        name: "Aisha Admin",
        email: "admin@inventory.local",
        role: "admin",
        department: "Operations",
      },
      {
        name: "Omar Operations",
        email: "ops@inventory.local",
        role: "admin",
        department: "Operations",
      },
      {
        name: "Evan Employee",
        email: "employee@inventory.local",
        role: "employee",
        department: "Marketing",
      },
      {
        name: "Maya Chen",
        email: "maya@inventory.local",
        role: "employee",
        department: "Sales",
      },
      {
        name: "Sarah Johnson",
        email: "sarah@inventory.local",
        role: "employee",
        department: "IT",
      },
      {
        name: "David Wilson",
        email: "david@inventory.local",
        role: "employee",
        department: "Finance",
      },
      {
        name: "Emily Davis",
        email: "emily@inventory.local",
        role: "employee",
        department: "Operations",
      },
    ])
    .returning();

  const warehouseRows = await db
    .insert(warehouses)
    .values([{ name: "Main Warehouse" }, { name: "Secondary Warehouse" }])
    .returning();

  const supplierRows = await db
    .insert(suppliers)
    .values([
      {
        name: "Northstar Office Supply",
        contactPerson: "Lina Park",
        email: "lina@northstar.local",
        phone: "+82-2-555-0101",
      },
      {
        name: "Metro IT Distribution",
        contactPerson: "Daniel Cho",
        email: "daniel@metro.local",
        phone: "+82-2-555-0102",
      },
      {
        name: "Han River Packaging",
        contactPerson: "Jisoo Kim",
        email: "jisoo@hanriver.local",
        phone: "+82-2-555-0103",
      },
    ])
    .returning();

  await db.insert(purchaseOrders).values([
    {
      poNumber: "PO-2026-0007",
      supplierId: supplierRows[0].id,
      warehouseId: warehouseRows[0].id,
      createdById: admin.id,
      orderDate: new Date(nowMinusDays(5)),
      expectedDate: new Date(nowPlusDays(4)),
      status: "ordered",
      totalItems: 6,
    },
    {
      poNumber: "PO-2026-0008",
      supplierId: supplierRows[1].id,
      warehouseId: warehouseRows[1].id,
      createdById: opsLead.id,
      orderDate: new Date(nowMinusDays(2)),
      expectedDate: new Date(nowPlusDays(6)),
      status: "in_transit",
      totalItems: 4,
    },
    {
      poNumber: "PO-2026-0009",
      supplierId: supplierRows[2].id,
      warehouseId: warehouseRows[0].id,
      createdById: admin.id,
      orderDate: new Date(nowMinusDays(9)),
      expectedDate: new Date(nowMinusDays(1)),
      status: "received",
      totalItems: 8,
    },
  ]);

  const baseItemDefinitions = [
    ["A4 Copy Paper", "ITM-1001", "Office Supplies", "Ream"],
    ["Ballpoint Pen (Blue)", "ITM-1002", "Office Supplies", "Box"],
    ["Stapler", "ITM-1003", "Office Supplies", "Each"],
    ["A4 File Folder", "ITM-1004", "Office Supplies", "Pack"],
    ["Printer Ink Cartridge", "ITM-1005", "IT Supplies", "Each"],
    ["USB-C Cable", "ITM-1006", "IT Supplies", "Each"],
    ["HDMI Adapter", "ITM-1007", "IT Supplies", "Each"],
    ["Laptop Stand", "ITM-1008", "IT Supplies", "Each"],
    ["Mouse", "ITM-1009", "IT Supplies", "Each"],
    ["Keyboard", "ITM-1010", "IT Supplies", "Each"],
    ["Packing Tape", "ITM-1011", "Packaging", "Roll"],
    ["Shipping Labels", "ITM-1012", "Packaging", "Roll"],
    ["Bubble Wrap", "ITM-1013", "Packaging", "Roll"],
    ["Gift Box Small", "ITM-1014", "Packaging", "Pack"],
    ["Gift Box Medium", "ITM-1015", "Packaging", "Pack"],
    ["Gift Box Large", "ITM-1016", "Packaging", "Pack"],
    ["Barcode Labels", "ITM-1017", "Operations", "Roll"],
    ["Shelf Tags", "ITM-1018", "Operations", "Pack"],
    ["Safety Gloves", "ITM-1019", "Operations", "Box"],
    ["Cleaning Wipes", "ITM-1020", "Operations", "Pack"],
    ["Toner Cartridge", "ITM-1021", "Office Supplies", "Each"],
    ["Desk Organizer", "ITM-1022", "Office Supplies", "Each"],
    ["Envelope Pack", "ITM-1023", "Office Supplies", "Pack"],
    ["Cable Ties", "ITM-1024", "Operations", "Pack"],
    ["Inventory Clipboard", "ITM-1025", "Operations", "Each"],
    [
      "Extra Long Ergonomic Standing Desk Converter With Cable Management Tray",
      "OPS-LONG-SKU-2026-ERGONOMIC-DESK-CONVERTER-XL",
      "Operations",
      "Each",
    ],
  ] as const;

  const generatedItemDefinitions = Array.from({ length: 96 }, (_, index) => {
    const categories = [
      "Office Supplies",
      "IT Supplies",
      "Packaging",
      "Operations",
      "Facilities",
      "Marketing",
    ];
    const units = ["Each", "Pack", "Box", "Roll"];
    const category = categories[index % categories.length];
    return [
      `${category} Standard Item ${String(index + 1).padStart(3, "0")}`,
      `GEN-${category.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`,
      category,
      units[index % units.length],
    ] as const;
  });
  const itemDefinitions = [...baseItemDefinitions, ...generatedItemDefinitions];

  const items = await db
    .insert(inventoryItems)
    .values(
      itemDefinitions.map(([name, sku, category, unit], index) => {
        const quantityOnHand =
          index === 0
            ? 120
            : index === 1
              ? 10
              : index === 2
                ? 5
                : index % 9 === 0 && index % 4 !== 0
                  ? 0
                  : index % 5 === 0
                    ? 8 + index
                    : 45 + index * 3;
        const quantityReserved =
          quantityOnHand === 0
            ? 0
            : index === 2
              ? 0
              : index % 4 === 0
                ? 5
                : index % 3;
        return {
          name,
          sku,
          category,
          warehouse: index % 2 === 0 ? "Main Warehouse" : "Secondary Warehouse",
          unit,
          quantityOnHand,
          quantityReserved,
          reorderPoint: index === 2 ? 5 : index % 5 === 0 ? 15 : 10,
        };
      }),
    )
    .returning();

  const now = new Date();
  const requests = await db
    .insert(inventoryRequests)
    .values(
      Array.from({ length: 60 }, (_, index) => {
        const status = statusCycle[index % statusCycle.length];
        const requester = employees[index % employees.length];
        const createdAt = new Date(now.getTime() - (index + 1) * 36e5 * 6);
        return {
          requesterId: requester.id,
          requestCode: `REQ-2026-${String(128 - index).padStart(4, "0")}`,
          department: departments[index % departments.length],
          warehouse: index % 2 === 0 ? "Main Warehouse" : "Secondary Warehouse",
          requiredBy: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
          priority: priorityCycle[index % priorityCycle.length],
          reason:
            index % 2 === 0
              ? "Team replenishment for upcoming operational work."
              : "Scheduled restock for departmental demand.",
          status,
          approverId:
            status === "pending"
              ? null
              : index % 2 === 0
                ? admin.id
                : opsLead.id,
          adminComment:
            status === "rejected"
              ? "Duplicate request; consolidate with the weekly order."
              : null,
          createdAt,
          updatedAt: createdAt,
          fulfilledAt:
            status === "fulfilled"
              ? new Date(createdAt.getTime() + 12 * 60 * 60 * 1000)
              : null,
        };
      }),
    )
    .returning();

  const requestItemRows = requests.flatMap((request, requestIndex) => {
    const lineCount =
      requestIndex % 3 === 0 ? 3 : requestIndex % 2 === 0 ? 2 : 1;
    return Array.from({ length: lineCount }, (_, lineIndex) => {
      const item = items[(requestIndex * 2 + lineIndex) % items.length];
      const quantityRequested = lineIndex + 1 + (requestIndex % 4);
      return {
        requestId: request.id,
        itemId: item.id,
        quantityRequested,
        quantityApproved:
          request.status === "approved" || request.status === "fulfilled"
            ? quantityRequested
            : null,
        unit: item.unit,
      };
    });
  });

  const fulfilledQuantityByItemId = new Map<string, number>();
  for (const line of requestItemRows) {
    const request = requests.find((entry) => entry.id === line.requestId)!;
    if (request.status !== "fulfilled") {
      continue;
    }
    const quantityApproved = line.quantityApproved ?? line.quantityRequested;
    fulfilledQuantityByItemId.set(
      line.itemId,
      (fulfilledQuantityByItemId.get(line.itemId) ?? 0) + quantityApproved,
    );
  }

  for (const item of items) {
    const fulfilledQuantity = fulfilledQuantityByItemId.get(item.id) ?? 0;
    if (fulfilledQuantity > 0 && item.quantityOnHand < fulfilledQuantity) {
      const replenishedQuantity = fulfilledQuantity + item.reorderPoint + 3;
      item.quantityOnHand = replenishedQuantity;
      await db
        .update(inventoryItems)
        .set({ quantityOnHand: replenishedQuantity })
        .where(eq(inventoryItems.id, item.id));
    }
  }

  await db.insert(inventoryRequestItems).values(requestItemRows);

  for (const request of requests) {
    const requester = employees.find(
      (employee) => employee.id === request.requesterId,
    )!;
    const lines = requestItemRows.filter(
      (line) => line.requestId === request.id,
    );
    const history: Array<{
      requestId: string;
      actorName: string;
      actorRole: "Admin" | "Employee" | "System";
      action: string;
      fromStatus?: RequestStatus;
      toStatus?: RequestStatus;
      metadata?: Record<string, unknown>;
      createdAt: Date;
    }> = [
      {
        requestId: request.id,
        actorName: requester.name,
        actorRole: "Employee",
        action: "request_created",
        toStatus: "pending" as const,
        createdAt: request.createdAt,
      },
    ];

    if (request.status === "approved" || request.status === "fulfilled") {
      history.push({
        requestId: request.id,
        actorName: request.approverId === admin.id ? admin.name : opsLead.name,
        actorRole: "Admin",
        action: "request_approved",
        fromStatus: "pending" as const,
        toStatus: "approved" as const,
        createdAt: new Date(request.createdAt.getTime() + 2 * 60 * 60 * 1000),
      });
    }

    if (request.status === "fulfilled") {
      history.push({
        requestId: request.id,
        actorName: request.approverId === admin.id ? admin.name : opsLead.name,
        actorRole: "Admin",
        action: "request_fulfilled",
        fromStatus: "approved" as const,
        toStatus: "fulfilled" as const,
        createdAt: new Date(request.createdAt.getTime() + 10 * 60 * 60 * 1000),
      });
    }

    if (request.status === "rejected") {
      history.push({
        requestId: request.id,
        actorName: request.approverId === admin.id ? admin.name : opsLead.name,
        actorRole: "Admin",
        action: "request_rejected",
        fromStatus: "pending" as const,
        toStatus: "rejected" as const,
        metadata: { comment: request.adminComment },
        createdAt: new Date(request.createdAt.getTime() + 90 * 60 * 1000),
      });
    }

    if (request.requestCode === "REQ-2026-0128") {
      history.push(
        {
          requestId: request.id,
          actorName: "System",
          actorRole: "System" as const,
          action: "pending_review",
          fromStatus: "pending" as const,
          toStatus: "pending" as const,
          createdAt: new Date(request.createdAt.getTime() + 15 * 60 * 1000),
        },
        {
          requestId: request.id,
          actorName: admin.name,
          actorRole: "Admin" as const,
          action: "comment_added",
          metadata: { comment: "Awaiting campaign confirmation." },
          createdAt: new Date(request.createdAt.getTime() + 45 * 60 * 1000),
        },
        {
          requestId: request.id,
          actorName: "System",
          actorRole: "System" as const,
          action: "sla_reminder_sent",
          metadata: { lineCount: lines.length },
          createdAt: new Date(request.createdAt.getTime() + 75 * 60 * 1000),
        },
        ...Array.from({ length: 12 }, (_, historyIndex) => ({
          requestId: request.id,
          actorName: historyIndex % 2 === 0 ? admin.name : "System",
          actorRole:
            historyIndex % 2 === 0 ? ("Admin" as const) : ("System" as const),
          action:
            historyIndex % 2 === 0
              ? "comment_added"
              : "review_follow_up_recorded",
          metadata: { sequence: historyIndex + 1 },
          createdAt: new Date(
            request.createdAt.getTime() + (90 + historyIndex * 15) * 60 * 1000,
          ),
        })),
      );
    }

    await db.insert(auditLogs).values(history);
    await db.insert(requestHistory).values(history);
  }

  const fulfilledLines = requestItemRows.filter((line) => {
    const request = requests.find((entry) => entry.id === line.requestId)!;
    return request.status === "fulfilled";
  });

  for (const line of fulfilledLines) {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, line.itemId));
    const quantityApproved = line.quantityApproved ?? line.quantityRequested;
    await db
      .update(inventoryItems)
      .set({
        quantityOnHand: item.quantityOnHand - quantityApproved,
      })
      .where(eq(inventoryItems.id, item.id));
  }

  console.log("Seed complete");
}

function nowMinusDays(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function nowPlusDays(days: number) {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
