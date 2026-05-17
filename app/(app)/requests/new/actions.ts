"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { revalidateRequestReads } from "@/lib/cache-tags";
import { createRequest } from "@/services/request.service";

export type CreateRequestState = {
  errors?: Record<string, string>;
  message?: string;
};

export async function createInventoryRequestAction(
  _previousState: CreateRequestState,
  formData: FormData,
): Promise<CreateRequestState> {
  const actor = await getCurrentUser();
  const requesterName = String(formData.get("requesterName") ?? "").trim();

  if (!requesterName) {
    return { errors: { requesterName: "Requester name is required." } };
  }

  try {
    const itemIds = formData.getAll("itemId");
    const quantities = formData.getAll("quantityRequested");

    const request = await createRequest(
      {
        department: actor.department,
        warehouse: "Main Warehouse",
        requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: "normal",
        reason: formData.get("reason"),
        items: itemIds.map((itemId, index) => ({
          itemId,
          quantityRequested: numberFromForm(quantities[index] ?? null),
        })),
      },
      actor,
    );
    revalidateRequestReads(request.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        errors: Object.fromEntries(
          error.issues.map((issue) => [
            issue.path.join(".") || "form",
            issue.message,
          ]),
        ),
      };
    }

    return {
      message:
        error instanceof Error ? error.message : "Unable to create request.",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  redirect("/requests?success=Request created successfully.");
}

function numberFromForm(value: FormDataEntryValue | null) {
  return value === null || value === "" ? Number.NaN : Number(value);
}
