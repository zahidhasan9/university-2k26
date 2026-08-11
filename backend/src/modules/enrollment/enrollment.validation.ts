import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const enrollmentIdSchema = z.object({ params: z.object({ id: objectId }) });
export const enrollmentCreateSchema = z.object({
  body: z.object({
    studentId: objectId,
    offeringId: objectId,
  }),
});
export const selfRegistrationSchema = z.object({
  body: z.object({ offeringIds: z.array(objectId).min(1).max(20) }),
});
export const enrollmentDropSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ reason: z.string().trim().min(1).max(500) }),
});
