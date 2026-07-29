import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const band = z.object({
  letter: z.string().trim().min(1).max(5).transform((value) => value.toUpperCase()),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradePoint: z.number().min(0).max(5),
  passed: z.boolean(),
});

function validateBands(bands: Array<z.infer<typeof band>>, context: z.RefinementCtx) {
  const sorted = [...bands].sort((a, b) => a.minPercentage - b.minPercentage);
  if (sorted[0]?.minPercentage !== 0 || sorted.at(-1)?.maxPercentage !== 100) {
    context.addIssue({ code: "custom", message: "Grade bands must cover 0 through 100" });
  }
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    if (current.minPercentage >= current.maxPercentage) {
      context.addIssue({ code: "custom", message: `${current.letter} has an invalid range` });
    }
    if (index > 0 && current.minPercentage !== sorted[index - 1]!.maxPercentage) {
      context.addIssue({ code: "custom", message: "Grade bands cannot contain gaps or overlaps" });
    }
  }
  if (new Set(bands.map((item) => item.letter)).size !== bands.length) {
    context.addIssue({ code: "custom", message: "Letter grades must be unique" });
  }
}

export const gradePolicyIdSchema = z.object({ params: z.object({ id: objectId }) });
export const gradePolicyCreateSchema = z.object({
  body: z
    .object({
      programId: objectId,
      name: z.string().trim().min(2).max(120),
      bands: z.array(band).min(2).max(30),
    })
    .superRefine((value, context) => validateBands(value.bands, context)),
});
export const gradePolicyUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      bands: z.array(band).min(2).max(30).optional(),
      status: z.enum(["active", "archived"]).optional(),
    })
    .superRefine((value, context) => {
      if (value.bands) validateBands(value.bands, context);
      if (!Object.keys(value).length) {
        context.addIssue({ code: "custom", message: "At least one field is required" });
      }
    }),
});
export const offeringResultSchema = z.object({ params: z.object({ offeringId: objectId }) });
export const studentResultSchema = z.object({ params: z.object({ studentId: objectId }) });
