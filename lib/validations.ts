import { z } from "zod";
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from "./constants";

export const createItemSchema = z
  .object({
    name: z.string().trim().min(1, "Item name is required."),
    sku: z.string().trim().min(1, "SKU is required."),
    category: z.string().trim().min(1, "Category is required."),
    warehouse: z.string().trim().min(1, "Warehouse is required."),
    unit: z.string().trim().min(1, "Unit is required."),
    quantityOnHand: z
      .number()
      .int()
      .min(0, "On-hand quantity cannot be negative."),
    quantityReserved: z
      .number()
      .int()
      .min(0, "Reserved quantity cannot be negative.")
      .default(0),
    reorderPoint: z
      .number()
      .int()
      .min(0, "Reorder point cannot be negative.")
      .default(5),
  })
  .refine((value) => value.quantityReserved <= value.quantityOnHand, {
    message: "Reserved quantity cannot exceed on-hand quantity.",
    path: ["quantityReserved"],
  });

export const createRequestSchema = z
  .object({
    department: z.string().trim().min(1, "Department is required."),
    warehouse: z.string().trim().min(1, "Warehouse is required."),
    requiredBy: z.coerce.date(),
    priority: z.enum(REQUEST_PRIORITIES).default("normal"),
    reason: z.string().trim().min(1, "Reason is required."),
    items: z
      .array(
        z.object({
          itemId: z.string().uuid("Item is required."),
          quantityRequested: z
            .number()
            .int()
            .positive("Quantity must be greater than 0."),
        }),
      )
      .min(1, "At least one item is required."),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.itemId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate request items are not allowed.",
          path: ["items", index, "itemId"],
        });
      }
      seen.add(item.itemId);
    });
  });

export const updateRequestStatusSchema = z
  .object({
    status: z.enum(REQUEST_STATUSES),
    approverId: z.string().uuid().nullable().optional(),
    adminComment: z.string().trim().max(1000).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "rejected" && !value.adminComment?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A rejection comment is required.",
        path: ["adminComment"],
      });
    }
  });

export const itemFilterSchema = z.object({
  category: z.string().trim().optional(),
  lowStock: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const requestFilterSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
});
