import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./admission.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
export async function options(_req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Admission options retrieved", await service.getAdmissionOptions());
}
export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Admission applications retrieved", await service.listAdmissions(req.query));
}
export async function listMine(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Your applications retrieved",
    await service.listMyAdmissions(auth(req).userId, req.query),
  );
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  const unrestricted = auth(req).permissions.includes("admissions.read");
  return sendSuccess(res, 200, "Admission application retrieved", {
    application: await service.getAdmission(req.params.id as string, auth(req).userId, unrestricted),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const application = await service.createAdmission(auth(req).userId, req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "admission.create",
    resource: "admission",
    resourceId: application._id.toString(),
  });
  return sendSuccess(res, 201, "Admission draft created", { application });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const application = await service.updateDraft(req.params.id as string, auth(req).userId, req.body);
  return sendSuccess(res, 200, "Admission draft updated", { application });
}
export async function submit(req: Request, res: Response): Promise<Response> {
  const application = await service.submitApplication(req.params.id as string, auth(req).userId);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "admission.submit",
    resource: "admission",
    resourceId: application._id.toString(),
  });
  return sendSuccess(res, 200, "Application submitted", { application });
}
export async function review(req: Request, res: Response): Promise<Response> {
  const application = await service.startReview(
    req.params.id as string,
    auth(req).userId,
    req.body.note,
  );
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "admission.review",
    resource: "admission",
    resourceId: application._id.toString(),
  });
  return sendSuccess(res, 200, "Application moved to review", { application });
}
export async function decide(req: Request, res: Response): Promise<Response> {
  const result = await service.decideApplication(req.params.id as string, auth(req).userId, req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: `admission.${req.body.decision}`,
    resource: "admission",
    resourceId: result.application._id.toString(),
  });
  return sendSuccess(res, 200, `Application ${req.body.decision}d`, result);
}
export async function cancel(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  await service.cancelApplication(id, auth(req).userId);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "admission.cancel",
    resource: "admission",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Application cancelled", null);
}
