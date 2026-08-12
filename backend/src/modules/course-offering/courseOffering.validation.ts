import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const status = z.enum(["planned", "open", "ongoing", "completed", "cancelled"]);
export const offeringIdSchema = z.object({ params: z.object({ id: objectId }) });
export const offeringCreateSchema = z.object({
  body: z.object({
    courseId: objectId,
    semesterId: objectId,
    teacherId: objectId,
    academicBatchId: objectId,
    section: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
    capacity: z.number().int().min(1).max(1000),
    deliveryMode: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  }),
});
export const offeringUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      teacherId: objectId.optional(),
      academicBatchId: objectId.optional(),
      section: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()).optional(),
      capacity: z.number().int().min(1).max(1000).optional(),
      deliveryMode: z.enum(["in_person", "online", "hybrid"]).optional(),
      status: status.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
