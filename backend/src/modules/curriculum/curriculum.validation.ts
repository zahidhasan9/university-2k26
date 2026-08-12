import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const coursePlan = z.object({ courseId: objectId, semesterNumber: z.number().int().min(1), required: z.boolean().default(true) });
const fields = {
  programId: objectId,
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  effectiveYear: z.number().int().min(1900).max(2200),
  totalSemesters: z.number().int().min(1),
  coursePlans: z.array(coursePlan).max(500),
};
const validatePlans = (value: { totalSemesters: number; coursePlans: Array<{ courseId: string; semesterNumber: number }> }, context: z.RefinementCtx) => {
  if (value.coursePlans.some((plan) => plan.semesterNumber > value.totalSemesters)) context.addIssue({ code: "custom", path: ["coursePlans"], message: "Course semester cannot exceed total semesters" });
  if (new Set(value.coursePlans.map((plan) => plan.courseId)).size !== value.coursePlans.length) context.addIssue({ code: "custom", path: ["coursePlans"], message: "A course can appear only once in a curriculum" });
};
export const curriculumIdSchema = z.object({ params: z.object({ id: objectId }) });
export const curriculumCreateSchema = z.object({ body: z.object(fields).superRefine(validatePlans) });
export const curriculumUpdateSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ name: fields.name.optional(), effectiveYear: fields.effectiveYear.optional(), totalSemesters: fields.totalSemesters.optional(), coursePlans: fields.coursePlans.optional(), status: z.enum(["draft", "active", "archived"]).optional() }).refine((value) => Object.keys(value).length > 0, "At least one field is required") });
