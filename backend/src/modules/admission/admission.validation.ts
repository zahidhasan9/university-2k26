import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const education = z.object({
  level: z.string().trim().min(1).max(100),
  institution: z.string().trim().min(1).max(180),
  result: z.string().trim().min(1).max(80),
  passingYear: z.number().int().min(1950).max(2200),
});
const document = z.object({
  type: z.string().trim().min(1).max(80),
  url: z.string().trim().url(),
  publicId: z.string().trim().max(200).optional(),
});
const personal = z.object({
  phone: z.string().trim().min(5).max(30),
  dateOfBirth: z.coerce.date().max(new Date(), "Date of birth cannot be in the future"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  nationality: z.string().trim().min(2).max(80),
  presentAddress: z.string().trim().min(5).max(500),
  permanentAddress: z.string().trim().min(5).max(500),
});
const guardian = z.object({
  name: z.string().trim().min(2).max(160),
  relationship: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
});

export const admissionIdSchema = z.object({ params: z.object({ id: objectId }) });
export const admissionCreateSchema = z.object({
  body: z.object({
    programId: objectId,
    intakeSemesterId: objectId,
    personal,
    guardian,
    statement: z.string().trim().max(5000).optional(),
    previousEducation: z.array(education).max(20).default([]),
    documents: z.array(document).max(30).default([]),
  }),
});
export const admissionUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      statement: z.string().trim().max(5000).optional(),
      personal: personal.optional(),
      guardian: guardian.optional(),
      previousEducation: z.array(education).max(20).optional(),
      documents: z.array(document).max(30).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const admissionReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ note: z.string().trim().max(2000).optional() }),
});
export const admissionDecisionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.discriminatedUnion("decision", [
    z.object({
      decision: z.literal("approve"),
      studentId: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
      academicBatchId: objectId,
      academicSectionId: objectId,
      note: z.string().trim().max(2000).optional(),
    }),
    z.object({
      decision: z.literal("reject"),
      note: z.string().trim().min(1).max(2000),
    }),
  ]),
});
