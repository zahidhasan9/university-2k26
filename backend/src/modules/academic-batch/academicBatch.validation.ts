import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const code = z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase());
const fields = {
  departmentId: objectId,
  programId: objectId,
  curriculumId: objectId,
  code,
  name: z.string().trim().min(2).max(120),
  admissionYear: z.number().int().min(1900).max(2200),
  currentSemesterNumber: z.number().int().min(1),
};
export const batchIdSchema = z.object({ params: z.object({ id: objectId }) });
export const batchCreateSchema = z.object({ body: z.object(fields) });
export const batchUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: fields.name.optional(), curriculumId: fields.curriculumId.optional(),
    currentSemesterNumber: fields.currentSemesterNumber.optional(),
    status: z.enum(["planned", "active", "completed", "archived"]).optional(),
  }).refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
