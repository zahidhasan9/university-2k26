import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./engagement.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
export async function createComplaint(req: Request, res: Response) {
  const complaint = await service.createComplaint(auth(req).userId, req.body);
  return sendSuccess(res, 201, "Complaint submitted", { complaint });
}
export async function mine(req: Request, res: Response) {
  return sendSuccess(res, 200, "Your complaints retrieved", {
    complaints: await service.myComplaints(auth(req).userId),
  });
}
export async function complaints(req: Request, res: Response) {
  return sendSuccess(res, 200, "Complaints retrieved", await service.listComplaints(req.query));
}
export async function actionComplaint(req: Request, res: Response) {
  const id = req.params.id as string;
  const complaint = await service.actionComplaint(id, req.body);
  await writeAuditLog(req, { actor: auth(req).userId, action: `complaint.${req.body.action}`, resource: "complaint", resourceId: id });
  return sendSuccess(res, 200, "Complaint updated", { complaint });
}
export async function registerAlumni(req: Request, res: Response) {
  const alumni = await service.registerAlumni(auth(req).userId, req.body);
  return sendSuccess(res, 201, "Alumni profile submitted", { alumni });
}
export async function myAlumni(req: Request, res: Response) {
  return sendSuccess(res, 200, "Your alumni profile retrieved", {
    alumni: await service.myAlumni(auth(req).userId),
  });
}
export async function directory(req: Request, res: Response) {
  return sendSuccess(res, 200, "Alumni directory retrieved", {
    alumni: await service.alumniDirectory(
      req.query,
      auth(req).permissions.includes("alumni.manage"),
    ),
  });
}
export async function alumniStatus(req: Request, res: Response) {
  const id = req.params.id as string;
  const alumni = await service.setAlumniStatus(id, auth(req).userId, req.body.status);
  await writeAuditLog(req, { actor: auth(req).userId, action: "alumni.status_update", resource: "alumni", resourceId: id });
  return sendSuccess(res, 200, "Alumni profile updated", { alumni });
}
