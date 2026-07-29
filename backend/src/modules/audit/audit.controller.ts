import type { Request, Response } from "express";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { sendSuccess } from "../../utils/response";
import { LoginHistoryModel } from "../auth/loginHistory.model";
import { AuditLogModel } from "./auditLog.model";

export async function listAuditLogs(req: Request, res: Response): Promise<Response> {
  const { page, limit, skip } = getPagination(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.actorId) filter.actor = toObjectId(String(req.query.actorId), "actor id");
  if (req.query.resource) filter.resource = String(req.query.resource);
  if (req.query.action) filter.action = { $regex: escapeRegex(String(req.query.action)), $options: "i" };
  const [items, total] = await Promise.all([
    AuditLogModel.find(filter)
      .populate("actor", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLogModel.countDocuments(filter),
  ]);
  return sendSuccess(res, 200, "Audit logs retrieved", {
    items,
    pagination: paginationMeta(total, page, limit),
  });
}

export async function listLoginHistory(req: Request, res: Response): Promise<Response> {
  const { page, limit, skip } = getPagination(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.userId) filter.user = toObjectId(String(req.query.userId), "user id");
  if (req.query.successful !== undefined) filter.successful = String(req.query.successful) === "true";
  const [items, total] = await Promise.all([
    LoginHistoryModel.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LoginHistoryModel.countDocuments(filter),
  ]);
  return sendSuccess(res, 200, "Login history retrieved", {
    items,
    pagination: paginationMeta(total, page, limit),
  });
}
