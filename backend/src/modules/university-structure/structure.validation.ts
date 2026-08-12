import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const code = z
  .string()
  .trim()
  .min(2)
  .max(30)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((v) => v.toUpperCase());
const status = z.enum(["active", "archived"]);
const description = z.string().trim().max(2000).optional();

export const idSchema = z.object({ params: z.object({ id: objectId }) });
export const universityCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(180),
    code,
    shortName: z.string().trim().max(30).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().max(30).optional(),
    website: z.string().trim().url().optional(),
    address: z
      .object({
        line1: z.string().trim().max(160).optional(),
        line2: z.string().trim().max(160).optional(),
        city: z.string().trim().max(80).optional(),
        state: z.string().trim().max(80).optional(),
        country: z.string().trim().max(80).optional(),
        postalCode: z.string().trim().max(20).optional(),
      })
      .optional(),
  }),
});
export const facultyCreateSchema = z.object({
  body: z.object({
    universityId: objectId,
    name: z.string().trim().min(2).max(160),
    code,
    description,
  }),
});
export const departmentCreateSchema = z.object({
  body: z.object({
    facultyId: objectId,
    name: z.string().trim().min(2).max(160),
    code,
    description,
  }),
});
export const programCreateSchema = z.object({
  body: z.object({
    departmentId: objectId,
    name: z.string().trim().min(2).max(180),
    code,
    degreeType: z.enum([
      "certificate",
      "diploma",
      "bachelor",
      "master",
      "doctorate",
    ]),
    durationYears: z.number().min(0.5).max(10),
    totalCredits: z.number().min(1).max(400),
    totalSemesters: z.number().int().min(1).default(8),
    description,
  }),
});
export const courseCreateSchema = z.object({
  body: z.object({
    programId: objectId,
    code,
    title: z.string().trim().min(2).max(180),
    description,
    credits: z.number().min(0).max(20),
    semesterNumber: z.number().int().min(1).default(1),
    theoryHoursPerWeek: z.number().min(0).max(40).default(0),
    labHoursPerWeek: z.number().min(0).max(40).default(0),
    courseType: z
      .enum(["core", "elective", "general", "lab", "thesis"])
      .default("core"),
    prerequisiteIds: z.array(objectId).max(20).default([]),
  }),
});

const mutable = {
  name: z.string().trim().min(2).max(180).optional(),
  code: code.optional(),
  description,
  status: status.optional(),
};
export const universityUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    ...mutable,
    shortName: z.string().trim().max(30).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().max(30).optional(),
    website: z.string().trim().url().optional(),
    address: universityCreateSchema.shape.body.shape.address,
  }),
});
export const facultyUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ ...mutable, universityId: objectId.optional() }),
});
export const departmentUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ ...mutable, facultyId: objectId.optional() }),
});
export const programUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    ...mutable,
    departmentId: objectId.optional(),
    degreeType: z
      .enum(["certificate", "diploma", "bachelor", "master", "doctorate"])
      .optional(),
    durationYears: z.number().min(0.5).max(10).optional(),
    totalCredits: z.number().min(1).max(400).optional(),
    totalSemesters: z.number().int().min(1).optional(),
  }),
});
export const courseUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    code: code.optional(),
    title: z.string().trim().min(2).max(180).optional(),
    description,
    status: status.optional(),
    programId: objectId.optional(),
    credits: z.number().min(0).max(20).optional(),
    semesterNumber: z.number().int().min(1).optional(),
    theoryHoursPerWeek: z.number().min(0).max(40).optional(),
    labHoursPerWeek: z.number().min(0).max(40).optional(),
    courseType: z
      .enum(["core", "elective", "general", "lab", "thesis"])
      .optional(),
    prerequisiteIds: z.array(objectId).max(20).optional(),
  }),
});
