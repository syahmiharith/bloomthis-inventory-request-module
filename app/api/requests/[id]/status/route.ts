import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { updateRequestStatus } from "@/services/request.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const updated = await updateRequestStatus(
      id,
      await request.json(),
      actor.name,
    );
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/requests");
    revalidatePath(`/requests/${id}`);
    return NextResponse.json({ request: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
