import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const code = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, "Use resource.action format");

export const permissionIdSchema = z.object({ params: z.object({ id: objectId }) });
export const createPermissionSchema = z.object({
  body: z.object({
    code,
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(300).optional(),
  }),
});
export const updatePermissionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(300).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
