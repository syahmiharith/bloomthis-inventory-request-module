"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { revalidateRequestReads } from "@/lib/cache-tags";
import { createRequest } from "@/features/requests/services/request.service";

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
    const requestItems = itemIds
      .map((itemId, index) => ({
        itemId: String(itemId ?? "").trim(),
        quantityRequested: numberFromForm(quantities[index] ?? null),
      }))
      .filter((item) => item.itemId.length > 0);

    if (requestItems.length === 0) {
      return { errors: { form: "Add at least one inventory item." } };
    }

    const duplicateItem = requestItems.find(
      (item, index) =>
        requestItems.findIndex((entry) => entry.itemId === item.itemId) !==
        index,
    );

    if (duplicateItem) {
      return {
        errors: {
          form: "Each item can only appear once. Combine duplicate quantities into one line.",
        },
      };
    }

    const request = await createRequest(
      {
        department: actor.department,
        warehouse: "Main Warehouse",
        requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: "normal",
        reason: formData.get("reason"),
        items: requestItems,
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
