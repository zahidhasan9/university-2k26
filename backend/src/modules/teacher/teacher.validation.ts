import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const designation = z.enum([
  "lecturer",
  "assistant_professor",
  "associate_professor",
  "professor",
  "adjunct",
]);
const qualifications = z
  .array(
    z.object({
      degree: z.string().trim().min(1).max(120),
      institution: z.string().trim().min(1).max(180),
      year: z.number().int().min(1900).max(2200).optional(),
    }),
  )
  .max(20)
  .optional();
const professionalFields = {
  employmentType: z.enum(["permanent", "contractual", "adjunct", "visiting"]).optional(), campus: z.string().trim().max(100).optional(), officeRoom: z.string().trim().max(40).optional(), officialEmail: z.string().trim().email().optional(), confirmationDate: z.coerce.date().optional(), maxWeeklyHours: z.coerce.number().int().min(1).max(60).optional(),
  researchInterests: z.array(z.string().trim().min(1).max(120)).max(30).optional(), certifications: z.array(z.string().trim().min(1).max(180)).max(30).optional(),
  links: z.object({ orcid: z.string().trim().url().optional(), googleScholar: z.string().trim().url().optional(), website: z.string().trim().url().optional() }).optional(),
  officeHours: z.array(z.object({ day: z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) })).max(14).optional(),
  documents: z.array(z.object({ type: z.string().trim().min(1).max(80), url: z.string().trim().url(), status: z.enum(["pending", "verified", "rejected"]).default("pending") })).max(30).optional(),
};

export const teacherIdParamSchema = z.object({ params: z.object({ id: objectId }) });
export const teacherCreateSchema = z.object({
  body: z.object({
    userId: objectId,
    employeeId: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
    departmentId: objectId,
    designation,
    joiningDate: z.coerce.date(),
    phone: z.string().trim().max(30).optional(),
    specialization: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    qualifications,
    ...professionalFields,
  }),
});
export const teacherUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      departmentId: objectId.optional(),
      designation: designation.optional(),
      joiningDate: z.coerce.date().optional(),
      phone: z.string().trim().max(30).optional(),
      specialization: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
      qualifications,
      ...professionalFields,
      status: z.enum(["active", "on_leave", "retired", "resigned", "archived"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
