import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { requestFilterSchema } from "@/lib/validations";
import { createRequest, listRequests } from "@/services/request.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = requestFilterSchema.parse({
      status: url.searchParams.get("status") ?? undefined,
    });
    const viewer = await getCurrentUser();
    const requests = await listRequests(filters, viewer);
    return NextResponse.json({ requests });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    const created = await createRequest(await request.json(), actor);
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/requests");
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
