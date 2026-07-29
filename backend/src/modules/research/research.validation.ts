import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
const code = z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase());
export const researchIdSchema = z.object({ params: z.object({ id: objectId }) });
export const projectCreateSchema = z.object({
  body: z
    .object({
      code,
      title: z.string().trim().min(3).max(300),
      abstract: z.string().trim().min(20).max(5000),
      leadResearcherId: objectId,
      memberUserIds: z.array(objectId).max(100).default([]),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date().optional(),
      funding: z
        .object({
          source: z.string().trim().min(2).max(160),
          amountMinor: z.number().int().min(0),
          currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("BDT"),
        })
        .optional(),
    })
    .refine((value) => !value.endsAt || value.startsAt <= value.endsAt, {
      message: "Project date range is invalid",
    }),
});
export const projectUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      title: z.string().trim().min(3).max(300).optional(),
      abstract: z.string().trim().min(20).max(5000).optional(),
      memberUserIds: z.array(objectId).max(100).optional(),
      endsAt: z.coerce.date().optional(),
      status: z.enum(["proposed", "approved", "ongoing", "completed", "suspended", "cancelled"]).optional(),
      funding: z
        .object({
          source: z.string().trim().min(2).max(160),
          amountMinor: z.number().int().min(0),
          currency: z.string().trim().length(3).transform((v) => v.toUpperCase()),
        })
        .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});
export const publicationCreateSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(400),
    type: z.enum(["journal", "conference", "book", "book_chapter", "patent", "report", "other"]),
    authorTeacherIds: z.array(objectId).min(1).max(100),
    projectId: objectId.optional(),
    venue: z.string().trim().max(250).optional(),
    doi: z.string().trim().min(3).max(200).transform((v) => v.toLowerCase()).optional(),
    url: z.string().trim().url().optional(),
    publishedAt: z.coerce.date(),
    status: z.enum(["published", "accepted", "in_review"]).default("published"),
  }),
});
export const thesisProposeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(400),
    abstract: z.string().trim().min(20).max(5000),
    supervisorId: objectId,
    coSupervisorIds: z.array(objectId).max(5).default([]),
  }),
});
export const thesisActionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ action: z.enum(["approve", "reject", "start", "complete_revision"]) }),
});
export const thesisSubmitSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ documentUrl: z.string().trim().url() }),
});
export const defenseScheduleSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    scheduledAt: z.coerce.date(),
    room: z.string().trim().min(1).max(80).transform((v) => v.toUpperCase()),
    panelTeacherIds: z.array(objectId).min(2).max(10),
  }),
});
export const defenseOutcomeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    outcome: z.enum(["pass", "pass_with_revision", "fail"]),
    remarks: z.string().trim().min(3).max(2000),
  }),
});
