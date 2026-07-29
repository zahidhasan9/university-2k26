import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const inventoryItemCreateSchema = z.object({
  body: z.object({
    sku: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
    name: z.string().trim().min(2).max(180),
    category: z.string().trim().min(2).max(80),
    unit: z.string().trim().min(1).max(30),
    initialQuantity: z.number().min(0).default(0),
    reorderLevel: z.number().min(0).default(0),
    location: z.string().trim().max(100).optional(),
  }),
});
export const stockMovementSchema = z.object({
  body: z
    .object({
      itemId: objectId,
      type: z.enum(["stock_in", "stock_out", "adjustment"]),
      quantity: z.number(),
      reason: z.string().trim().min(2).max(500),
      issuedToUserId: objectId.optional(),
    })
    .refine((value) => value.type === "adjustment" || value.quantity > 0, {
      message: "Stock in/out quantity must be positive",
      path: ["quantity"],
    })
    .refine((value) => value.quantity !== 0, {
      message: "Quantity cannot be zero",
      path: ["quantity"],
    }),
});
