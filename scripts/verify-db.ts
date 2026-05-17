import { asc, sql } from "drizzle-orm";
import { closeDb, db } from "../db";
import {
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  users,
} from "../db/schema";

async function main() {
  const [inventoryCount, requestCount, requestItemLineCount, userCount] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(inventoryItems),
      db.select({ count: sql<number>`count(*)::int` }).from(inventoryRequests),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inventoryRequestItems),
      db.select({ count: sql<number>`count(*)::int` }).from(users),
    ]);

  const [statusRows, categoryRows] = await Promise.all([
    db
      .select({
        status: inventoryRequests.status,
        count: sql<number>`count(*)::int`,
      })
      .from(inventoryRequests)
      .groupBy(inventoryRequests.status)
      .orderBy(asc(inventoryRequests.status)),
    db
      .select({
        category: inventoryItems.category,
        count: sql<number>`count(*)::int`,
      })
      .from(inventoryItems)
      .groupBy(inventoryItems.category)
      .orderBy(asc(inventoryItems.category)),
  ]);

  console.log(`inventory item count: ${inventoryCount[0]?.count ?? 0}`);
  console.log(`request count: ${requestCount[0]?.count ?? 0}`);
  console.log(
    `request item line count: ${requestItemLineCount[0]?.count ?? 0}`,
  );
  console.log(`user count: ${userCount[0]?.count ?? 0}`);
  console.log("counts by request status:");
  for (const row of statusRows) {
    console.log(`  ${row.status}: ${row.count}`);
  }
  console.log("counts by inventory category:");
  for (const row of categoryRows) {
    console.log(`  ${row.category}: ${row.count}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
