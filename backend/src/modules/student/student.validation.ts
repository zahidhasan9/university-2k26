import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const guardian = z
  .object({
    name: z.string().trim().max(120).optional(),
    relationship: z.string().trim().max(60).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.string().trim().email().optional(),
  })
  .optional();
const address = z
  .object({
    line1: z.string().trim().max(160).optional(),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(20).optional(),
  })
  .optional();

export const studentIdParamSchema = z.object({ params: z.object({ id: objectId }) });
export const studentCreateSchema = z.object({
  body: z.object({
    userId: objectId.optional(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    temporaryPassword: z.string().min(12).max(128).optional(),
    studentId: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
    academicBatchId: objectId,
    section: z.string().trim().min(1).max(20).default("Unassigned"),
    programId: objectId,
    admissionSemesterId: objectId,
    admissionApplicationId: objectId.optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    phone: z.string().trim().max(30).optional(),
    guardian,
    address,
  }).superRefine((value, context) => {
    if (!value.userId && (!value.firstName || !value.lastName || !value.temporaryPassword)) {
      context.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Name and temporary password are required when provisioning a student account",
      });
    }
  }),
});
export const studentUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      programId: objectId.optional(),
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
      academicBatchId: objectId.optional(),
      section: z.string().trim().min(1).max(20).optional(),
      currentSemesterNumber: z.number().int().min(1).optional(),
      dateOfBirth: z.coerce.date().optional(),
      gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
      phone: z.string().trim().max(30).optional(),
      guardian,
      address,
      status: z.enum(["active", "graduated", "suspended", "withdrawn", "archived"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
