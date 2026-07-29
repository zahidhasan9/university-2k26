import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm");
const day = z.enum(["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]);
export const routineIdSchema = z.object({ params: z.object({ id: objectId }) });
export const routineCreateSchema = z.object({
  body: z
    .object({
      offeringId: objectId,
      dayOfWeek: day,
      startTime: time,
      endTime: time,
      room: z.string().trim().min(1).max(60).transform((v) => v.toUpperCase()),
      effectiveFrom: z.coerce.date(),
      effectiveTo: z.coerce.date(),
    })
    .refine((value) => value.startTime < value.endTime, {
      message: "Start time must be before end time",
      path: ["endTime"],
    })
    .refine((value) => value.effectiveFrom <= value.effectiveTo, {
      message: "Effective date range is invalid",
      path: ["effectiveTo"],
    }),
});
export const routineUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      dayOfWeek: day.optional(),
      startTime: time.optional(),
      endTime: time.optional(),
      room: z.string().trim().min(1).max(60).transform((v) => v.toUpperCase()).optional(),
      effectiveFrom: z.coerce.date().optional(),
      effectiveTo: z.coerce.date().optional(),
      status: z.enum(["active", "cancelled"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
