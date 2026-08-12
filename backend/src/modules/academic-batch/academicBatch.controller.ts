import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./academicBatch.service";

export async function list(req: Request, res: Response) { return sendSuccess(res, 200, "Academic batches retrieved", await service.listBatches(req.query)); }
export async function getOne(req: Request, res: Response) { return sendSuccess(res, 200, "Academic batch retrieved", { batch: await service.getBatch(String(req.params.id)) }); }
export async function create(req: Request, res: Response) {
  const batch = await service.createBatch(req.body);
  await writeAuditLog(req, { actor: req.auth?.userId, action: "academic_batch.create", resource: "academic_batch", resourceId: batch._id.toString() });
  return sendSuccess(res, 201, "Academic batch created", { batch });
}
export async function update(req: Request, res: Response) {
  const id = req.params.id as string; const batch = await service.updateBatch(id, req.body);
  await writeAuditLog(req, { actor: req.auth?.userId, action: "academic_batch.update", resource: "academic_batch", resourceId: id });
  return sendSuccess(res, 200, "Academic batch updated", { batch });
}
export async function archive(req: Request, res: Response) {
  const id = req.params.id as string; const batch = await service.archiveBatch(id);
  await writeAuditLog(req, { actor: req.auth?.userId, action: "academic_batch.archive", resource: "academic_batch", resourceId: id });
  return sendSuccess(res, 200, "Academic batch archived", { batch });
}
