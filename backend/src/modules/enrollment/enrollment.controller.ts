import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./enrollment.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Enrollments retrieved", await service.listEnrollments(req.query));
}
export async function listMine(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return sendSuccess(
    res,
    200,
    "Your enrollments retrieved",
    await service.listEnrollmentsByUser(req.auth.userId.toString(), req.query),
  );
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Enrollment retrieved", {
    enrollment: await service.getEnrollment(req.params.id as string),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const enrollment = await service.createEnrollment(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "enrollment.create",
    resource: "enrollment",
    resourceId: String(enrollment._id),
  });
  return sendSuccess(res, 201, "Enrollment created", { enrollment });
}
export async function drop(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const enrollment = await service.dropEnrollment(id, req.body.reason);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "enrollment.drop",
    resource: "enrollment",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Enrollment dropped", { enrollment });
}
