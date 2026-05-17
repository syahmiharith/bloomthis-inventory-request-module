import { readFileSync } from "node:fs";

const env = loadEnvFile(".vercel/.env.production.local");
const supabaseUrl = env.SUPABASE_URL;
const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !apiKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are required.",
  );
}

const headers = {
  apikey: apiKey,
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const departments = ["Marketing", "Sales", "IT", "Operations", "Finance"];
const categories = [
  "Office Supplies",
  "IT Supplies",
  "Packaging",
  "Operations",
  "Facilities",
  "Marketing",
];
const units = ["Each", "Pack", "Box", "Roll"];
const statuses = ["pending", "approved", "fulfilled", "rejected"];
const priorities = ["normal", "high", "low"];
const startedAt = new Date();

async function main() {
  const users = await ensureUsers();
  await ensureWarehouses();
  const items = await ensureItems();
  const requests = await ensureRequests(users, items);
  await ensureHistory(requests);

  const counts = await Promise.all([
    count("inventory_items"),
    count("inventory_requests"),
    count("inventory_request_items"),
    count("users"),
  ]);

  console.log(`inventory item count: ${counts[0]}`);
  console.log(`request count: ${counts[1]}`);
  console.log(`request item line count: ${counts[2]}`);
  console.log(`user count: ${counts[3]}`);
}

async function ensureUsers() {
  const existing = await select("users", "id,name,email,role,department");
  const byEmail = new Map(existing.map((user) => [user.email, user]));
  const required = [
    {
      name: "Aisha Admin",
      email: "admin@inventory.local",
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
  ].filter((user) => !byEmail.has(user.email));

  if (required.length > 0) {
    const inserted = await insert("users", required);
    for (const user of inserted) {
      byEmail.set(user.email, user);
    }
  }

  return Array.from(byEmail.values());
}

async function ensureWarehouses() {
  const existing = await select("warehouses", "name");
  const names = new Set(existing.map((warehouse) => warehouse.name));
  const required = ["Main Warehouse", "Secondary Warehouse"]
    .filter((name) => !names.has(name))
    .map((name) => ({ name }));
  if (required.length > 0) {
    await insert("warehouses", required);
  }
}

async function ensureItems() {
  const existing = await select(
    "inventory_items",
    "id,name,sku,category,warehouse,unit,quantity_on_hand,quantity_reserved,reorder_point",
  );
  const existingSkus = new Set(existing.map((item) => item.sku));
  const targetCount = 75;
  const missingCount = Math.max(0, targetCount - existing.length);
  const rows = [];

  for (let index = 0; rows.length < missingCount; index += 1) {
    const category = categories[index % categories.length];
    const sku = `PROD-${category.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`;
    if (existingSkus.has(sku)) {
      continue;
    }

    const quantityOnHand =
      index % 17 === 0 ? 0 : index % 11 === 0 ? 4 : 35 + index * 2;
    const reorderPoint = index % 11 === 0 ? 5 : 10;
    rows.push({
      name: `${category} Demo Item ${String(index + 1).padStart(3, "0")}`,
      sku,
      category,
      warehouse: index % 2 === 0 ? "Main Warehouse" : "Secondary Warehouse",
      unit: units[index % units.length],
      quantity_on_hand: quantityOnHand,
      quantity_reserved: quantityOnHand === 0 ? 0 : index % 3,
      reorder_point: reorderPoint,
    });
  }

  const inserted = rows.length > 0 ? await insert("inventory_items", rows) : [];
  return [...existing, ...inserted];
}

async function ensureRequests(users, items) {
  const existing = await select(
    "inventory_requests",
    "id,request_code,requester_id,status,created_at",
  );
  const existingCodes = new Set(
    existing.map((request) => request.request_code),
  );
  const employees = users.filter((user) => user.role === "employee");
  const admins = users.filter((user) => user.role === "admin");
  const admin = admins[0] ?? users[0];
  const targetCount = 40;
  const missingCount = Math.max(0, targetCount - existing.length);
  const requestRows = [];

  for (let index = 0; requestRows.length < missingCount; index += 1) {
    const requestCode = `REQ-PROD-${String(index + 1).padStart(4, "0")}`;
    if (existingCodes.has(requestCode)) {
      continue;
    }
    const status = statuses[index % statuses.length];
    const createdAt = new Date(
      startedAt.getTime() - (index + 1) * 3 * 60 * 60 * 1000,
    );
    requestRows.push({
      requester_id: employees[index % employees.length].id,
      request_code: requestCode,
      department: departments[index % departments.length],
      warehouse: index % 2 === 0 ? "Main Warehouse" : "Secondary Warehouse",
      required_by: new Date(
        createdAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      priority: priorities[index % priorities.length],
      reason:
        index % 2 === 0
          ? "Team replenishment for upcoming work."
          : "Scheduled restock for department operations.",
      status,
      approver_id: status === "pending" ? null : admin.id,
      admin_comment:
        status === "rejected"
          ? "Duplicate request; consolidate with weekly order."
          : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      fulfilled_at:
        status === "fulfilled"
          ? new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString()
          : null,
    });
  }

  const insertedRequests =
    requestRows.length > 0
      ? await insert("inventory_requests", requestRows)
      : [];
  const lineRows = [];
  for (const [requestIndex, request] of insertedRequests.entries()) {
    const lineCount =
      requestIndex % 3 === 0 ? 3 : requestIndex % 2 === 0 ? 2 : 1;
    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      const item = items[(requestIndex * 2 + lineIndex) % items.length];
      const quantityRequested = 1 + lineIndex + (requestIndex % 4);
      lineRows.push({
        request_id: request.id,
        item_id: item.id,
        quantity_requested: quantityRequested,
        quantity_approved:
          request.status === "approved" || request.status === "fulfilled"
            ? quantityRequested
            : null,
        unit: item.unit,
      });
    }
  }
  if (lineRows.length > 0) {
    await insert("inventory_request_items", lineRows);
  }

  return [...existing, ...insertedRequests];
}

async function ensureHistory(requests) {
  const existing = await select("request_history", "request_id,action");
  const existingKeys = new Set(
    existing.map((entry) => `${entry.request_id}:${entry.action}`),
  );
  const rows = [];

  for (const request of requests) {
    if (!existingKeys.has(`${request.id}:request_created`)) {
      rows.push({
        request_id: request.id,
        actor_name: "System",
        actor_role: "System",
        action: "request_created",
        to_status: "pending",
        created_at: request.created_at ?? startedAt.toISOString(),
      });
    }
    if (
      (request.status === "approved" || request.status === "fulfilled") &&
      !existingKeys.has(`${request.id}:request_approved`)
    ) {
      rows.push({
        request_id: request.id,
        actor_name: "Aisha Admin",
        actor_role: "Admin",
        action: "request_approved",
        from_status: "pending",
        to_status: "approved",
      });
    }
    if (
      request.status === "fulfilled" &&
      !existingKeys.has(`${request.id}:request_fulfilled`)
    ) {
      rows.push({
        request_id: request.id,
        actor_name: "Aisha Admin",
        actor_role: "Admin",
        action: "request_fulfilled",
        from_status: "approved",
        to_status: "fulfilled",
      });
    }
    if (
      request.status === "rejected" &&
      !existingKeys.has(`${request.id}:request_rejected`)
    ) {
      rows.push({
        request_id: request.id,
        actor_name: "Aisha Admin",
        actor_role: "Admin",
        action: "request_rejected",
        from_status: "pending",
        to_status: "rejected",
        note: "Duplicate request; consolidate with weekly order.",
      });
    }
  }

  if (rows.length > 0) {
    await insert("request_history", rows);
    await insert(
      "audit_logs",
      rows.map(({ actor_role: _actorRole, note: _note, ...row }) => ({
        ...row,
      })),
    );
  }
}

async function select(table, columns) {
  return request(table, {
    searchParams: { select: columns },
  });
}

async function insert(table, rows) {
  return request(table, {
    body: JSON.stringify(rows),
    method: "POST",
  });
}

async function count(table) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: { ...headers, Prefer: "count=exact" },
    method: "HEAD",
  });
  if (!response.ok) {
    throw new Error(`Unable to count ${table}: ${response.status}`);
  }
  const range = response.headers.get("content-range");
  return Number(range?.split("/")[1] ?? 0);
}

async function request(table, init = {}) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(init.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    ...init,
    headers,
  });
  if (!response.ok) {
    throw new Error(`Supabase ${table} request failed: ${response.status}`);
  }
  return response.status === 204 ? [] : response.json();
}

function loadEnvFile(path) {
  const result = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    result[trimmed.slice(0, index)] = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return result;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
