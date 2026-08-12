import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const advisingCreateSchema = z.object({ body: z.object({ teacherId: id, academicBatchId: id, academicSectionId: id, startsAt: z.coerce.date(), endsAt: z.coerce.date().optional() }).refine((value) => !value.endsAt || value.endsAt >= value.startsAt, { path: ["endsAt"], message: "End date must follow start date" }) });
export const advisingIdSchema = z.object({ params: z.object({ id }) });
