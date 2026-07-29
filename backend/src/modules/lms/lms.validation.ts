import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const lmsIdSchema = z.object({ params: z.object({ id: objectId }) });
export const materialCreateSchema = z.object({
  body: z.object({
    offeringId: objectId,
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(["document", "video", "link", "slide", "other"]),
    url: z.string().trim().url(),
    order: z.number().int().min(0).default(0),
    published: z.boolean().default(false),
  }),
});
export const assignmentCreateSchema = z.object({
  body: z.object({
    offeringId: objectId,
    title: z.string().trim().min(2).max(200),
    instructions: z.string().trim().min(3).max(5000),
    attachmentUrls: z.array(z.string().url()).max(20).default([]),
    dueAt: z.coerce.date(),
    maxScore: z.number().min(1).max(1000),
    published: z.boolean().default(false),
  }),
});
export const submissionCreateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      text: z.string().trim().max(10000).optional(),
      attachmentUrls: z.array(z.string().url()).max(20).default([]),
    })
    .refine((value) => Boolean(value.text) || value.attachmentUrls.length > 0, {
      message: "Submission text or attachment is required",
    }),
});
export const submissionGradeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    score: z.number().min(0),
    feedback: z.string().trim().max(2000).optional(),
  }),
});
const question = z
  .object({
    prompt: z.string().trim().min(2).max(1000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(10),
    correctOptionIndex: z.number().int().min(0),
    points: z.number().min(0.01).max(1000),
  })
  .refine((value) => value.correctOptionIndex < value.options.length, {
    message: "Correct option index is out of range",
    path: ["correctOptionIndex"],
  });
export const quizCreateSchema = z.object({
  body: z
    .object({
      offeringId: objectId,
      title: z.string().trim().min(2).max(200),
      instructions: z.string().trim().max(3000).optional(),
      questions: z.array(question).min(1).max(200),
      opensAt: z.coerce.date(),
      closesAt: z.coerce.date(),
      durationMinutes: z.number().int().min(1).max(1440),
      published: z.boolean().default(false),
    })
    .refine((value) => value.opensAt < value.closesAt, {
      message: "Quiz date range is invalid",
    }),
});
export const quizSubmitSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: objectId,
          selectedOptionIndex: z.number().int().min(0),
        }),
      )
      .min(1)
      .max(200),
  }),
});
export const discussionCreateSchema = z.object({
  body: z.object({
    offeringId: objectId,
    parentId: objectId.optional(),
    title: z.string().trim().max(200).optional(),
    body: z.string().trim().min(1).max(5000),
  }),
});
