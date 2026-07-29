import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm");
const examType = z.enum(["quiz", "class_test", "midterm", "final", "practical", "assignment", "viva"]);
export const examIdSchema = z.object({ params: z.object({ id: objectId }) });
export const examCreateSchema = z.object({
  body: z
    .object({
      offeringId: objectId,
      title: z.string().trim().min(2).max(150),
      type: examType,
      examDate: z.coerce.date(),
      startTime: time,
      endTime: time,
      room: z.string().trim().max(60).transform((value) => value.toUpperCase()).optional(),
      totalMarks: z.number().min(1).max(1000),
      weightPercentage: z.number().min(0.01).max(100),
    })
    .refine((value) => value.startTime < value.endTime, {
      message: "Start time must be before end time",
      path: ["endTime"],
    }),
});
export const examUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      title: z.string().trim().min(2).max(150).optional(),
      type: examType.optional(),
      examDate: z.coerce.date().optional(),
      startTime: time.optional(),
      endTime: time.optional(),
      room: z.string().trim().max(60).transform((value) => value.toUpperCase()).optional(),
      totalMarks: z.number().min(1).max(1000).optional(),
      weightPercentage: z.number().min(0.01).max(100).optional(),
      status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const marksBulkSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    marks: z
      .array(
        z
          .object({
            studentId: objectId,
            marksObtained: z.number().min(0),
            absent: z.boolean().default(false),
            note: z.string().trim().max(300).optional(),
          })
          .refine((value) => !value.absent || value.marksObtained === 0, {
            message: "Absent students must have zero marks",
          }),
      )
      .min(1)
      .max(1000),
  }),
});
