import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { listWarehouses } from "@/services/warehouse.service";

export async function GET() {
  try {
    const warehouses = await listWarehouses();
    return NextResponse.json({ warehouses });
  } catch (error) {
    return handleRouteError(error);
  }
}
