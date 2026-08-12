import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./student.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Students retrieved", await service.listStudents(req.query));
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Student retrieved", {
    student: await service.getStudent(req.params.id as string),
  });
}
export async function me(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return sendSuccess(res, 200, "Student profile retrieved", {
    student: await service.getStudentByUser(req.auth.userId.toString()),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const student = await service.createStudent(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "student.create",
    resource: "student",
    resourceId: String(student._id),
  });
  return sendSuccess(res, 201, "Student created", { student });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const student = await service.updateStudent(id, req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "student.update",
    resource: "student",
    resourceId: id,
    metadata: { changedFields: Object.keys(req.body) },
  });
  return sendSuccess(res, 200, "Student updated", { student });
}
export async function transferSection(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const id = req.params.id as string;
  const student = await service.transferStudentSection(id, req.body.academicSectionId, req.body.reason, req.auth.userId);
  await writeAuditLog(req, {
    actor: req.auth.userId,
    action: "student.section-transfer",
    resource: "student",
    resourceId: id,
    metadata: { academicSectionId: req.body.academicSectionId, reason: req.body.reason },
  });
  return sendSuccess(res, 200, "Student transferred to the selected section", { student });
}
