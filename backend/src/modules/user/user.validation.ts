import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const password = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const userIdSchema = z.object({ params: z.object({ id: objectId }) });
export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password,
    roleIds: z.array(objectId).max(20).default([]),
    status: z.enum(["active", "pending", "suspended", "disabled"]).default("active"),
  }),
});
export const updateUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      roleIds: z.array(objectId).max(20).optional(),
      status: z.enum(["active", "pending", "suspended", "disabled"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
