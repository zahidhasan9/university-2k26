import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const attendanceSessionIdSchema = z.object({ params: z.object({ id: objectId }) });
export const attendanceSessionCreateSchema = z.object({
  body: z.object({
    offeringId: objectId,
    date: z.coerce.date(),
    topic: z.string().trim().max(300).optional(),
  }),
});
export const attendanceBulkSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    records: z
      .array(
        z.object({
          studentId: objectId,
          status: z.enum(["present", "absent", "late", "excused"]),
          note: z.string().trim().max(300).optional(),
        }),
      )
      .min(1)
      .max(1000),
  }),
});
export const qrGenerateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ expiresInMinutes: z.number().int().min(1).max(30).default(5) }),
});
export const qrCheckInSchema = z.object({
  body: z.object({
    sessionId: objectId,
    token: z.string().min(32).max(300),
  }),
});
