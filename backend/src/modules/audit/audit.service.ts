import type { Request } from "express";
import type { Types } from "mongoose";
import { AuditLogModel } from "./auditLog.model";

interface AuditInput {
  actor?: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export function writeAuditLog(req: Request, input: AuditInput): Promise<unknown> {
  return AuditLogModel.create({
    ...input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
}
