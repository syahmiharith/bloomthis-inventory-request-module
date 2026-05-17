"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createItem } from "@/services/item.service";

export type CreateInventoryItemState = {
  errors?: Record<string, string>;
  message?: string;
};

export async function createInventoryItemAction(
  _previousState: CreateInventoryItemState,
  formData: FormData,
): Promise<CreateInventoryItemState> {
  const actor = await requireAdmin();
  const lowStockThreshold = formData.get("lowStockThreshold");

  try {
    await createItem(
      {
        name: formData.get("name"),
        sku: formData.get("sku"),
        category: formData.get("category"),
        warehouse: "Main Warehouse",
        unit: "Each",
        quantityOnHand: numberFromForm(formData.get("quantityAvailable")),
        quantityReserved: 0,
        reorderPoint:
          lowStockThreshold === null || lowStockThreshold === ""
            ? 5
            : numberFromForm(lowStockThreshold),
      },
      actor.name,
    );
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
        error instanceof Error ? error.message : "Unable to create item.",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  redirect("/inventory?success=Inventory item created successfully.");
}

function numberFromForm(value: FormDataEntryValue | null) {
  return value === null || value === "" ? Number.NaN : Number(value);
}
