import { z } from "zod";

const password = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(160).optional(),
    email: z.string().trim().min(3).max(160).optional(),
    password: z.string().min(1).max(128),
  }).refine((value) => value.identifier || value.email, {
    message: "Email or Student ID is required",
    path: ["identifier"],
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1).max(128),
      newPassword: password,
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      message: "New password must be different",
      path: ["newPassword"],
    }),
});
