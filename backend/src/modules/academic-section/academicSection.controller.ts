import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./academicSection.service";

export async function list(req: Request, res: Response) { return sendSuccess(res, 200, "Academic sections retrieved", await service.listSections(req.query)); }
export async function create(req: Request, res: Response) {
  const section = await service.createSection(req.body);
  await writeAuditLog(req, { actor: req.auth?.userId, action: "academic-section.create", resource: "academic-section", resourceId: String(section._id) });
  return sendSuccess(res, 201, "Academic section created", { section });
}
export async function update(req: Request, res: Response) {
  const section = await service.updateSection(String(req.params.id), req.body);
  await writeAuditLog(req, { actor: req.auth?.userId, action: "academic-section.update", resource: "academic-section", resourceId: String(section._id) });
  return sendSuccess(res, 200, "Academic section updated", { section });
}
export async function archive(req: Request, res: Response) {
  const section = await service.archiveSection(String(req.params.id));
  await writeAuditLog(req, { actor: req.auth?.userId, action: "academic-section.archive", resource: "academic-section", resourceId: String(section._id) });
  return sendSuccess(res, 200, "Academic section archived", { section });
}
