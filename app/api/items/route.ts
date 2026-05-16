import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { itemFilterSchema } from "@/lib/validations";
import { createItem, listItems } from "@/services/item.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = itemFilterSchema.parse({
      category: url.searchParams.get("category") ?? undefined,
      lowStock: url.searchParams.get("lowStock") ?? undefined,
    });
    const items = await listItems(filters);
    return NextResponse.json({
      items: items.map((item) => ({
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
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const item = await createItem(await request.json(), actor.name);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
