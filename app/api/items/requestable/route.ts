import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { listRequestableItems } from "@/features/inventory/services/inventory.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "25");
    const q = url.searchParams.get("q") ?? undefined;
    const selectedId = url.searchParams.get("selectedId") ?? undefined;
    const result = await listRequestableItems({
      page,
      pageSize,
      q,
      selectedId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
