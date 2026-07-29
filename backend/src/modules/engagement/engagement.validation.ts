import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB id");
export const engagementIdSchema = z.object({ params: z.object({ id: objectId }) });
export const complaintCreateSchema = z.object({
  body: z.object({
    category: z.enum(["academic", "finance", "hostel", "transport", "library", "harassment", "technical", "other"]),
    subject: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(5000),
    attachmentUrls: z.array(z.string().url()).max(20).default([]),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  }),
});
export const complaintActionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    action: z.enum(["start_review", "resolve", "reject", "close"]),
    assignedToUserId: objectId.optional(),
    resolution: z.string().trim().max(3000).optional(),
  }),
});
export const alumniCreateSchema = z.object({
  body: z.object({
    graduationYear: z.number().int().min(1900).max(2200),
    currentOrganization: z.string().trim().max(180).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    location: z.string().trim().max(160).optional(),
    linkedInUrl: z.string().trim().url().optional(),
    bio: z.string().trim().max(2000).optional(),
    directoryVisible: z.boolean().default(false),
  }),
});
export const alumniStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ status: z.enum(["verified", "suspended"]) }),
});
