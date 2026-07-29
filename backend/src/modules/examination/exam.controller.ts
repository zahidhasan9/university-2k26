import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./exam.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
function unrestricted(req: Request) {
  return auth(req).permissions.includes("exams.manage_all");
}
export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Examinations retrieved",
    await service.listExams(req.query, auth(req).userId, unrestricted(req)),
  );
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Examination retrieved", {
    exam: await service.getExam(req.params.id as string, auth(req).userId, unrestricted(req)),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const exam = await service.createExam(auth(req).userId, unrestricted(req), req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "exam.create",
    resource: "exam",
    resourceId: exam._id.toString(),
  });
  return sendSuccess(res, 201, "Examination created", { exam });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const exam = await service.updateExam(id, auth(req).userId, unrestricted(req), req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "exam.update",
    resource: "exam",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Examination updated", { exam });
}
export async function enterMarks(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const result = await service.enterMarks(
    id,
    auth(req).userId,
    unrestricted(req),
    req.body.marks,
  );
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "exam.marks_enter",
    resource: "exam",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Marks saved", result);
}
export async function marks(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  await service.getExam(id, auth(req).userId, unrestricted(req));
  return sendSuccess(res, 200, "Exam marks retrieved", await service.listExamMarks(id));
}
