import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const libraryIdSchema = z.object({ params: z.object({ id: objectId }) });
export const bookCreateSchema = z.object({
  body: z.object({
    isbn: z.string().trim().max(30).transform((v) => v.toUpperCase()).optional(),
    title: z.string().trim().min(1).max(300),
    authors: z.array(z.string().trim().min(1).max(150)).min(1).max(30),
    publisher: z.string().trim().max(160).optional(),
    publicationYear: z.number().int().min(1000).max(2200).optional(),
    edition: z.string().trim().max(60).optional(),
    categories: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    language: z.string().trim().max(40).optional(),
    description: z.string().trim().max(3000).optional(),
    digitalUrl: z.string().trim().url().optional(),
  }),
});
export const bookUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      title: z.string().trim().min(1).max(300).optional(),
      authors: z.array(z.string().trim().min(1).max(150)).min(1).max(30).optional(),
      publisher: z.string().trim().max(160).optional(),
      publicationYear: z.number().int().min(1000).max(2200).optional(),
      edition: z.string().trim().max(60).optional(),
      categories: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
      language: z.string().trim().max(40).optional(),
      description: z.string().trim().max(3000).optional(),
      digitalUrl: z.string().trim().url().optional(),
      status: z.enum(["active", "archived"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const copyCreateSchema = z.object({
  body: z.object({
    bookId: objectId,
    accessionNumber: z.string().trim().min(2).max(60).transform((v) => v.toUpperCase()),
    barcode: z.string().trim().min(2).max(100).optional(),
    shelfLocation: z.string().trim().max(80).optional(),
    condition: z.enum(["new", "good", "fair", "damaged", "lost"]).default("good"),
  }),
});
export const copyUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      barcode: z.string().trim().min(2).max(100).optional(),
      shelfLocation: z.string().trim().max(80).optional(),
      condition: z.enum(["new", "good", "fair", "damaged", "lost"]).optional(),
      status: z.enum(["available", "maintenance", "lost", "archived"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const policyUpsertSchema = z.object({
  body: z.object({
    borrowerType: z.enum(["student", "teacher"]),
    maxActiveLoans: z.number().int().min(1).max(100),
    loanDays: z.number().int().min(1).max(365),
    finePerDayMinor: z.number().int().min(0),
    currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("BDT"),
  }),
});
export const issueBookSchema = z.object({
  body: z.object({
    copyId: objectId,
    borrowerUserId: objectId,
    borrowerType: z.enum(["student", "teacher"]),
    note: z.string().trim().max(500).optional(),
  }),
});
export const returnBookSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    returnedAt: z.coerce.date().optional(),
    condition: z.enum(["new", "good", "fair", "damaged"]).default("good"),
    note: z.string().trim().max(500).optional(),
  }),
});
