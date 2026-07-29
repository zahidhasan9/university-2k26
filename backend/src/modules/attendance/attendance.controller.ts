import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./attendance.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
function unrestricted(req: Request) {
  return auth(req).permissions.includes("academic.manage");
}
export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Attendance sessions retrieved", await service.listSessions(req.query));
}
export async function create(req: Request, res: Response): Promise<Response> {
  const session = await service.createSession(auth(req).userId, unrestricted(req), req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "attendance.session_create",
    resource: "attendance_session",
    resourceId: session._id.toString(),
  });
  return sendSuccess(res, 201, "Attendance session created", { session });
}
export async function records(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Attendance records retrieved",
    await service.getSessionRecords(req.params.id as string),
  );
}
export async function mark(req: Request, res: Response): Promise<Response> {
  const result = await service.markAttendance(
    req.params.id as string,
    auth(req).userId,
    unrestricted(req),
    req.body.records,
  );
  return sendSuccess(res, 200, "Attendance marked", result);
}
export async function close(req: Request, res: Response): Promise<Response> {
  const result = await service.closeSession(
    req.params.id as string,
    auth(req).userId,
    unrestricted(req),
  );
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "attendance.session_close",
    resource: "attendance_session",
    resourceId: req.params.id as string,
  });
  return sendSuccess(res, 200, "Attendance session closed", result);
}
export async function generateQr(req: Request, res: Response): Promise<Response> {
  const data = await service.generateQrToken(
    req.params.id as string,
    auth(req).userId,
    unrestricted(req),
    req.body.expiresInMinutes,
  );
  return sendSuccess(res, 200, "QR attendance token generated", data);
}
export async function checkIn(req: Request, res: Response): Promise<Response> {
  await service.qrCheckIn(auth(req).userId, req.body.sessionId, req.body.token);
  return sendSuccess(res, 200, "Attendance check-in successful", null);
}
export async function mine(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Your attendance retrieved",
    await service.studentAttendance(auth(req).userId, req.query),
  );
}
