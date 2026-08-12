import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./teacher.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Teachers retrieved", await service.listTeachers(req.query));
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Teacher retrieved", {
    teacher: await service.getTeacher(req.params.id as string),
  });
}
export async function me(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return sendSuccess(res, 200, "Teacher profile retrieved", {
    teacher: await service.getTeacherByUser(req.auth.userId.toString()),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const teacher = await service.createTeacher(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "teacher.create",
    resource: "teacher",
    resourceId: String(teacher._id),
  });
  return sendSuccess(res, 201, "Teacher created", { teacher });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const teacher = await service.updateTeacher(id, req.body, req.auth?.userId.toString());
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "teacher.update",
    resource: "teacher",
    resourceId: id,
    metadata: { changedFields: Object.keys(req.body) },
  });
  return sendSuccess(res, 200, "Teacher updated", { teacher });
}
export async function workload(req: Request, res: Response): Promise<Response> { return sendSuccess(res, 200, "Teacher workload retrieved", await service.getTeacherWorkload(String(req.params.id), req.query)); }
