"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { revalidateRequestReads } from "@/lib/cache-tags";
import type { RequestStatus } from "@/lib/constants";
import { updateRequestStatus } from "@/services/request.service";

export async function updateRequestStatusAction(formData: FormData) {
  const actor = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "") as RequestStatus;
  const adminComment = String(formData.get("adminComment") ?? "").trim();
  let errorMessage = "";

  try {
    await updateRequestStatus(
      requestId,
      {
        status,
        adminComment: adminComment || undefined,
      },
      actor.name,
    );
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to update request.";
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidateRequestReads(requestId);

  if (errorMessage) {
    const params = new URLSearchParams({ error: errorMessage });
    redirect(`/requests?${params.toString()}`);
  }

  const params = new URLSearchParams({
    success: `Request ${status} successfully.`,
  });
  redirect(`/requests?${params.toString()}`);
}
