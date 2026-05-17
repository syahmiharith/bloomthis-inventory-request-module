import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateInventoryReads } from "@/lib/cache-tags";
import { handleRouteError } from "@/lib/http";
import { itemFilterSchema } from "@/lib/validations";
import {
  createItem,
  listItems,
} from "@/features/inventory/services/inventory.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = itemFilterSchema.parse({
      category: url.searchParams.get("category") ?? undefined,
      lowStock: url.searchParams.get("lowStock") ?? undefined,
    });
    const result = await listItems({
      ...filters,
      page: Number(url.searchParams.get("page") ?? "1"),
      q: url.searchParams.get("q") ?? undefined,
      stock: (url.searchParams.get("stock") ?? "") as "in" | "low" | "out" | "",
    });
    return NextResponse.json({
      items: result.rows.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        warehouse: item.warehouse,
        unit: item.unit,
        quantityOnHand: item.quantityOnHand,
        quantityReserved: item.quantityReserved,
        available: item.available,
        reorderPoint: item.reorderPoint,
        isLowStock: item.isLowStock,
      })),
      ...result,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const item = await createItem(await request.json(), actor.name);
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidateInventoryReads(item.id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
