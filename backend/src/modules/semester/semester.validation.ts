import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const status = z.enum(["planned", "registration", "ongoing", "completed", "archived"]);
const term = z.enum(["spring", "summer", "fall", "winter", "annual"]);
const dateFields = {
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  registrationStartsAt: z.coerce.date(),
  registrationEndsAt: z.coerce.date(),
};
const validDates = (value: {
  startsAt: Date;
  endsAt: Date;
  registrationStartsAt: Date;
  registrationEndsAt: Date;
}) =>
  value.startsAt < value.endsAt &&
  value.registrationStartsAt < value.registrationEndsAt &&
  value.registrationEndsAt <= value.endsAt;

export const semesterIdSchema = z.object({ params: z.object({ id: objectId }) });
export const semesterCreateSchema = z.object({
  body: z
    .object({
      universityId: objectId,
      name: z.string().trim().min(2).max(100),
      code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
      academicYear: z.string().trim().min(4).max(20),
      term,
      ...dateFields,
    })
    .refine(validDates, { message: "Semester and registration dates are invalid" }),
});
export const semesterUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    academicYear: z.string().trim().min(4).max(20).optional(),
    term: term.optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    registrationStartsAt: z.coerce.date().optional(),
    registrationEndsAt: z.coerce.date().optional(),
    status: status.optional(),
  }),
});
