import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const attendanceSessionIdSchema = z.object({ params: z.object({ id: objectId }) });
export const attendanceSessionCreateSchema = z.object({
  body: z.object({
    offeringId: objectId,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    classType: z.enum(["lecture", "lab", "tutorial", "seminar", "exam", "other"]).default("lecture"),
    room: z.string().trim().max(60).optional(),
    routineSlotId: objectId.optional(),
    topic: z.string().trim().max(300).optional(),
  }).refine((value) => value.startsAt < value.endsAt, { message: "Class end time must be after start time", path: ["endsAt"] })
    .refine((value) => value.endsAt.getTime() - value.startsAt.getTime() <= 8 * 60 * 60 * 1000, { message: "A class cannot exceed 8 hours", path: ["endsAt"] }),
});
export const attendanceBulkSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    records: z
      .array(
        z.object({
          studentId: objectId,
          status: z.enum(["present", "absent", "late", "excused", "invalid"]),
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
