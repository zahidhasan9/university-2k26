import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const currency = z.string().trim().length(3).regex(/^[A-Za-z]{3}$/).transform((v) => v.toUpperCase());
const amount = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

export const financeIdSchema = z.object({ params: z.object({ id: objectId }) });
export const feeStructureCreateSchema = z.object({
  body: z
    .object({
      programId: objectId,
      semesterId: objectId,
      name: z.string().trim().min(2).max(150),
      currency: currency.default("BDT"),
      perCreditFeeMinor: amount.default(0),
      items: z
        .array(
          z.object({
            code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
            name: z.string().trim().min(1).max(120),
            amountMinor: amount,
            mandatory: z.boolean().default(true),
          }),
        )
        .min(1)
        .max(100),
    })
    .refine((value) => new Set(value.items.map((item) => item.code)).size === value.items.length, {
      message: "Fee item codes must be unique",
      path: ["items"],
    }),
});
export const feeStructureUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      perCreditFeeMinor: amount.optional(),
      items: z
        .array(
          z.object({
            code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
            name: z.string().trim().min(1).max(120),
            amountMinor: amount,
            mandatory: z.boolean().default(true),
          }),
        )
        .min(1)
        .max(100)
        .optional(),
      status: z.enum(["draft", "active", "archived"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const invoiceCreateSchema = z.object({
  body: z.object({
    studentId: objectId,
    semesterId: objectId,
    selectedOptionalItemCodes: z.array(z.string().trim().transform((v) => v.toUpperCase())).max(100).default([]),
    discountMinor: amount.default(0),
    dueDate: z.coerce.date(),
  }),
});
export const waiverCreateSchema = z.object({
  body: z
    .object({
      studentId: objectId,
      name: z.string().trim().min(2).max(150),
      type: z.enum(["percentage", "fixed"]),
      value: z.number().min(0),
      currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
      appliesTo: z.enum(["tuition", "all"]).default("tuition"),
      reason: z.string().trim().min(3).max(500),
      validFrom: z.coerce.date(),
      validUntil: z.coerce.date(),
    })
    .refine((value) => value.validUntil >= value.validFrom, {
      message: "Waiver end date must be after its start date",
      path: ["validUntil"],
    })
    .refine((value) => value.type !== "percentage" || value.value <= 100, {
      message: "Percentage waiver cannot exceed 100",
      path: ["value"],
    })
    .refine((value) => value.type !== "fixed" || Number.isInteger(value.value), {
      message: "Fixed waiver must be stored in minor currency units",
      path: ["value"],
    }),
});
export const waiverUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ status: z.enum(["active", "inactive", "revoked"]) }),
});
export const invoiceVoidSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ reason: z.string().trim().min(3).max(500) }),
});
export const paymentCreateSchema = z.object({
  body: z
    .object({
      invoiceId: objectId,
      amountMinor: amount.refine((value) => value > 0, "Amount must be positive"),
      method: z.enum(["cash", "bank_transfer", "card", "mobile_banking", "cheque", "online"]),
      externalReference: z.string().trim().min(2).max(160).optional(),
      paidAt: z.coerce.date().optional(),
    })
    .refine((value) => value.method === "cash" || Boolean(value.externalReference), {
      message: "External reference is required for non-cash payments",
      path: ["externalReference"],
    }),
});
export const paymentRefundSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ reason: z.string().trim().min(3).max(500) }),
});
export const expenseCreateSchema = z.object({
  body: z.object({
    category: z.string().trim().min(2).max(80),
    description: z.string().trim().min(3).max(1000),
    vendor: z.string().trim().max(160).optional(),
    amountMinor: amount.refine((value) => value > 0, "Amount must be positive"),
    currency: currency.default("BDT"),
    expenseDate: z.coerce.date(),
    note: z.string().trim().max(500).optional(),
  }),
});
export const expenseActionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    action: z.enum(["approve", "reject", "mark_paid", "cancel"]),
    note: z.string().trim().max(500).optional(),
  }),
});
