import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./courseOffering.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Course offerings retrieved", await service.listOfferings(req.query));
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Course offering retrieved", {
    offering: await service.getOffering(req.params.id as string),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const offering = await service.createOffering(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "course_offering.create",
    resource: "course_offering",
    resourceId: String(offering._id),
  });
  return sendSuccess(res, 201, "Course offering created", { offering });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const offering = await service.updateOffering(id, req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "course_offering.update",
    resource: "course_offering",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Course offering updated", { offering });
}
