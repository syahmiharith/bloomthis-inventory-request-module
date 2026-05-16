import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { getDashboardSummary } from "@/services/dashboard.service";

export async function GET() {
  try {
    const viewer = await getCurrentUser();
    const summary = await getDashboardSummary(viewer);
    return NextResponse.json({ summary });
  } catch (error) {
    return handleRouteError(error);
  }
}
