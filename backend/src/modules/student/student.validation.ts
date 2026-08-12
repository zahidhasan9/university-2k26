import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const guardian = z
  .object({
    name: z.string().trim().max(120).optional(),
    relationship: z.string().trim().max(60).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.string().trim().email().optional(),
  })
  .optional();
const address = z
  .object({
    line1: z.string().trim().max(160).optional(),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(20).optional(),
  })
  .optional();
const education = z.object({
  level: z.string().trim().min(1).max(100), institution: z.string().trim().min(1).max(180), board: z.string().trim().max(100).optional(),
  result: z.string().trim().min(1).max(80), passingYear: z.coerce.number().int().min(1950).max(2200), rollNumber: z.string().trim().max(50).optional(), registrationNumber: z.string().trim().max(60).optional(),
});
const studentDocument = z.object({ type: z.string().trim().min(1).max(80), url: z.string().trim().url(), status: z.enum(["pending", "verified", "rejected"]).default("pending") });
const profileFields = {
  registrationNumber: z.string().trim().max(60).optional(), admissionDate: z.coerce.date().optional(), admissionType: z.enum(["regular", "transfer", "credit_transfer"]).optional(),
  academicSession: z.string().trim().max(40).optional(), campus: z.string().trim().max(100).optional(), studentCategory: z.enum(["regular", "improvement", "retake"]).optional(), assignedAdvisorId: objectId.optional(),
  banglaName: z.string().trim().max(160).optional(), nationality: z.string().trim().max(80).optional(), religion: z.string().trim().max(60).optional(), bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(), maritalStatus: z.enum(["single", "married", "other"]).optional(),
  nidNumber: z.string().trim().max(30).optional(), birthCertificateNumber: z.string().trim().max(40).optional(), passportNumber: z.string().trim().max(30).optional(), alternatePhone: z.string().trim().max(30).optional(), universityEmail: z.string().trim().email().optional(),
  avatarUrl: z.string().trim().url().max(2048).optional(),
  permanentAddress: address, parents: z.object({ father: z.object({ name: z.string().trim().max(120).optional(), profession: z.string().trim().max(100).optional(), phone: z.string().trim().max(30).optional() }).optional(), mother: z.object({ name: z.string().trim().max(120).optional(), profession: z.string().trim().max(100).optional(), phone: z.string().trim().max(30).optional() }).optional() }).optional(),
  previousEducation: z.array(education).max(20).optional(), documents: z.array(studentDocument).max(30).optional(), waiverCategory: z.string().trim().max(80).optional(), residentialStatus: z.enum(["day_scholar", "hostel", "other"]).optional(), hostelRequired: z.boolean().optional(), transportRequired: z.boolean().optional(), administrativeNotes: z.string().trim().max(2000).optional(),
};

export const studentIdParamSchema = z.object({ params: z.object({ id: objectId }) });
export const studentCreateSchema = z.object({
  body: z.object({
    userId: objectId.optional(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    temporaryPassword: z.string().min(12).max(128).optional(),
    studentId: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
    academicBatchId: objectId,
    academicSectionId: objectId,
    programId: objectId,
    admissionSemesterId: objectId,
    admissionApplicationId: objectId.optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    phone: z.string().trim().max(30).optional(),
    guardian,
    address,
    ...profileFields,
  }).superRefine((value, context) => {
    if (!value.userId && (!value.firstName || !value.lastName || !value.temporaryPassword)) {
      context.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Name and temporary password are required when provisioning a student account",
      });
    }
  }),
});
export const studentUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      programId: objectId.optional(),
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
      academicBatchId: objectId.optional(),
      academicSectionId: objectId.optional(),
      currentSemesterNumber: z.number().int().min(1).optional(),
      dateOfBirth: z.coerce.date().optional(),
      gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
      phone: z.string().trim().max(30).optional(),
      guardian,
      address,
      ...profileFields,
      status: z.enum(["active", "graduated", "suspended", "withdrawn", "archived"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const studentSectionTransferSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ academicSectionId: objectId, reason: z.string().trim().max(300).optional() }),
});
