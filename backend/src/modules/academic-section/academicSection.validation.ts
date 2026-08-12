import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const fields = {
  code: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().min(1).max(1000),
  shift: z.enum(["morning", "day", "evening", "weekend"]),
  homeRoom: z.string().trim().max(40).optional(),
};

export const sectionIdSchema = z.object({ params: z.object({ id: objectId }) });
export const sectionCreateSchema = z.object({
  body: z.object({ academicBatchId: objectId, ...fields }),
});
export const sectionUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    code: fields.code.optional(), name: fields.name.optional(), capacity: fields.capacity.optional(),
    shift: fields.shift.optional(), homeRoom: fields.homeRoom, status: z.enum(["active", "archived"]).optional(),
  }).refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
