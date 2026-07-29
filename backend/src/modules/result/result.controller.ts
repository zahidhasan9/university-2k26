import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as gradeService from "./gradePolicy.service";
import * as resultService from "./result.service";
import { assertExamAccess } from "../examination/exam.service";
import { toObjectId } from "../../utils/mongo";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
export async function listPolicies(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Grade policies retrieved", {
    policies: await gradeService.listGradePolicies(req.query),
  });
}
export async function createPolicy(req: Request, res: Response): Promise<Response> {
  const policy = await gradeService.createGradePolicy(req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "grade_policy.create",
    resource: "grade_policy",
    resourceId: policy._id.toString(),
  });
  return sendSuccess(res, 201, "Grade policy created", { policy });
}
export async function updatePolicy(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const policy = await gradeService.updateGradePolicy(id, req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "grade_policy.update",
    resource: "grade_policy",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Grade policy updated", { policy });
}
export async function calculate(req: Request, res: Response): Promise<Response> {
  const offeringId = req.params.offeringId as string;
  const result = await resultService.calculateOfferingResults(
    offeringId,
    auth(req).userId,
    auth(req).permissions.includes("exams.manage_all"),
  );
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "result.calculate",
    resource: "course_offering",
    resourceId: offeringId,
  });
  return sendSuccess(res, 200, "Draft results calculated", result);
}
export async function offeringResults(req: Request, res: Response): Promise<Response> {
  const offeringId = req.params.offeringId as string;
  await assertExamAccess(
    toObjectId(offeringId, "offering id"),
    auth(req).userId,
    auth(req).permissions.includes("exams.manage_all"),
  );
  return sendSuccess(
    res,
    200,
    "Course results retrieved",
    await resultService.getOfferingResults(offeringId),
  );
}
export async function publish(req: Request, res: Response): Promise<Response> {
  const offeringId = req.params.offeringId as string;
  const result = await resultService.publishOfferingResults(offeringId, auth(req).userId);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "result.publish",
    resource: "course_offering",
    resourceId: offeringId,
  });
  return sendSuccess(res, 200, "Results published", result);
}
export async function mine(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Your results retrieved",
    await resultService.studentResults(
      auth(req).userId,
      req.query.semesterId ? String(req.query.semesterId) : undefined,
    ),
  );
}
export async function myTranscript(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Transcript generated",
    await resultService.transcript(auth(req).userId),
  );
}
export async function studentResults(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Student results retrieved",
    await resultService.studentResultsById(
      req.params.studentId as string,
      req.query.semesterId ? String(req.query.semesterId) : undefined,
    ),
  );
}
export async function studentTranscript(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Student transcript generated",
    await resultService.transcriptByStudentId(req.params.studentId as string),
  );
}
