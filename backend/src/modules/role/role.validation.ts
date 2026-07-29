import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const fields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional(),
  permissionIds: z.array(objectId).max(250).default([]),
};

export const roleIdSchema = z.object({ params: z.object({ id: objectId }) });
export const createRoleSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(60).regex(/^[a-z][a-z0-9_]*$/),
    ...fields,
  }),
});
export const updateRoleSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: fields.name.optional(),
      description: fields.description,
      permissionIds: fields.permissionIds.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
