import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./semester.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Semesters retrieved", await service.listSemesters(req.query));
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Semester retrieved", {
    semester: await service.getSemester(req.params.id as string),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const semester = await service.createSemester(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "semester.create",
    resource: "semester",
    resourceId: semester._id.toString(),
  });
  return sendSuccess(res, 201, "Semester created", { semester });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const semester = await service.updateSemester(id, req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "semester.update",
    resource: "semester",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Semester updated", { semester });
}
