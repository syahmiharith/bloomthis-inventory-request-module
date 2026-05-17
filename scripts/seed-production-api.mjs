const baseUrl = "https://bloomthis-inventory-next.vercel.app";
const targetItems = 75;
const targetRequests = 40;
const categories = [
  "Office Supplies",
  "IT Supplies",
  "Packaging",
  "Operations",
  "Facilities",
  "Marketing",
];
const departments = ["Marketing", "Sales", "IT", "Operations", "Finance"];

async function main() {
  const inventory = await getJson("/api/items");
  const currentItemCount = inventory.totalCount ?? inventory.rows?.length ?? 0;
  const createdItems = [];

  for (let index = currentItemCount; index < targetItems; index += 1) {
    const category = categories[index % categories.length];
    const quantityOnHand =
      index % 17 === 0 ? 0 : index % 11 === 0 ? 4 : 35 + index * 2;
    const item = await postJson("/api/items", {
      name: `${category} Production Demo Item ${String(index + 1).padStart(3, "0")}`,
      sku: `API-SEED-${String(index + 1).padStart(4, "0")}`,
      category,
      warehouse: index % 2 === 0 ? "Main Warehouse" : "Secondary Warehouse",
      unit: "Each",
      quantityOnHand,
      quantityReserved: quantityOnHand === 0 ? 0 : index % 3,
      reorderPoint: index % 11 === 0 ? 5 : 10,
    });
    createdItems.push(item.item);
  }

  const refreshedInventory = await getJson("/api/items");
  const availableItems = [
    ...(refreshedInventory.rows ?? refreshedInventory.items ?? []),
    ...createdItems,
  ].filter(uniqueById);

  const requests = await getJson("/api/requests");
  const currentRequestCount = requests.totalCount ?? requests.rows?.length ?? 0;

  for (let index = currentRequestCount; index < targetRequests; index += 1) {
    const itemA = availableItems[index % availableItems.length];
    const itemB = availableItems[(index + 7) % availableItems.length];
    const lines =
      index % 3 === 0
        ? [
            { itemId: itemA.id, quantityRequested: 1 + (index % 4) },
            { itemId: itemB.id, quantityRequested: 2 + (index % 3) },
          ]
        : [{ itemId: itemA.id, quantityRequested: 1 + (index % 5) }];

    await postJson("/api/requests", {
      department: departments[index % departments.length],
      warehouse: index % 2 === 0 ? "Main Warehouse" : "Secondary Warehouse",
      requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: index % 5 === 0 ? "high" : "normal",
      reason:
        index % 2 === 0
          ? "Production demo replenishment request."
          : "Department stock request for review workflow.",
      items: lines,
    });
  }

  const finalInventory = await getJson("/api/items");
  const finalRequests = await getJson("/api/requests");
  console.log(`inventory item count: ${finalInventory.totalCount}`);
  console.log(`request count: ${finalRequests.totalCount}`);
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status}`);
  }
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text.slice(0, 160)}`);
  }
  return response.json();
}

function uniqueById(item, index, array) {
  return item?.id && array.findIndex((entry) => entry.id === item.id) === index;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
