import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const communicationIdSchema = z.object({ params: z.object({ id: objectId }) });
export const noticeCreateSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(250),
      body: z.string().trim().min(2).max(10000),
      category: z.enum(["general", "academic", "admission", "exam", "finance", "event", "emergency"]).default("general"),
      audienceRoleIds: z.array(objectId).max(30).default([]),
      attachmentUrls: z.array(z.string().url()).max(20).default([]),
      publishAt: z.coerce.date(),
      expiresAt: z.coerce.date().optional(),
      status: z.enum(["draft", "published"]).default("draft"),
    })
    .refine((value) => !value.expiresAt || value.publishAt < value.expiresAt, {
      message: "Notice expiry must be after publish time",
    }),
});
export const conversationCreateSchema = z.object({
  body: z.object({
    subject: z.string().trim().max(200).optional(),
    type: z.enum(["direct", "group"]),
    participantUserIds: z.array(objectId).min(1).max(50),
  }),
});
export const messageCreateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    body: z.string().trim().min(1).max(10000),
    attachmentUrls: z.array(z.string().url()).max(20).default([]),
  }),
});
export const notificationDispatchSchema = z.object({
  body: z
    .object({
      userId: objectId,
      channel: z.enum(["email", "sms"]),
      recipient: z.string().trim().max(320).optional(),
      type: z.string().trim().min(2).max(80),
      title: z.string().trim().min(2).max(250),
      body: z.string().trim().min(1).max(5000),
      data: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((value) => value.channel !== "sms" || Boolean(value.recipient), {
      message: "SMS recipient is required",
      path: ["recipient"],
    }),
});
