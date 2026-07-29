import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./lms.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
const all = (req: Request) => auth(req).permissions.includes("lms.manage_all");
async function audit(req: Request, action: string, resource: string, id: string) {
  await writeAuditLog(req, { actor: auth(req).userId, action, resource, resourceId: id });
}
export async function materials(req: Request, res: Response) {
  return sendSuccess(res, 200, "Course materials retrieved", {
    materials: await service.listMaterials(String(req.query.offeringId), auth(req).userId, all(req)),
  });
}
export async function createMaterial(req: Request, res: Response) {
  const material = await service.createMaterial(auth(req).userId, all(req), req.body);
  await audit(req, "lms.material_create", "course_material", material._id.toString());
  return sendSuccess(res, 201, "Course material created", { material });
}
export async function assignments(req: Request, res: Response) {
  return sendSuccess(res, 200, "Assignments retrieved", {
    assignments: await service.listAssignments(String(req.query.offeringId), auth(req).userId, all(req)),
  });
}
export async function createAssignment(req: Request, res: Response) {
  const assignment = await service.createAssignment(auth(req).userId, all(req), req.body);
  await audit(req, "lms.assignment_create", "lms_assignment", assignment._id.toString());
  return sendSuccess(res, 201, "Assignment created", { assignment });
}
export async function submitAssignment(req: Request, res: Response) {
  const submission = await service.submitAssignment(req.params.id as string, auth(req).userId, req.body);
  await audit(req, "lms.assignment_submit", "assignment_submission", submission._id.toString());
  return sendSuccess(res, 201, "Assignment submitted", { submission });
}
export async function submissions(req: Request, res: Response) {
  return sendSuccess(res, 200, "Submissions retrieved", {
    submissions: await service.listSubmissions(req.params.id as string, auth(req).userId, all(req)),
  });
}
export async function grade(req: Request, res: Response) {
  const id = req.params.id as string;
  const submission = await service.gradeSubmission(id, auth(req).userId, all(req), req.body.score, req.body.feedback);
  await audit(req, "lms.submission_grade", "assignment_submission", id);
  return sendSuccess(res, 200, "Submission graded", { submission });
}
export async function createQuiz(req: Request, res: Response) {
  const quiz = await service.createQuiz(auth(req).userId, all(req), req.body);
  await audit(req, "lms.quiz_create", "quiz", quiz._id.toString());
  return sendSuccess(res, 201, "Quiz created", { quiz });
}
export async function quiz(req: Request, res: Response) {
  return sendSuccess(res, 200, "Quiz retrieved", {
    quiz: await service.getQuiz(req.params.id as string, auth(req).userId, all(req)),
  });
}
export async function startQuiz(req: Request, res: Response) {
  return sendSuccess(res, 201, "Quiz attempt started", {
    attempt: await service.startQuiz(req.params.id as string, auth(req).userId),
  });
}
export async function submitQuiz(req: Request, res: Response) {
  const attempt = await service.submitQuiz(req.params.id as string, auth(req).userId, req.body.answers);
  await audit(req, "lms.quiz_submit", "quiz_attempt", attempt._id.toString());
  return sendSuccess(res, 201, "Quiz submitted", { attempt });
}
export async function discussion(req: Request, res: Response) {
  return sendSuccess(res, 200, "Discussion retrieved", {
    posts: await service.listDiscussion(String(req.query.offeringId), auth(req).userId, all(req)),
  });
}
export async function createDiscussion(req: Request, res: Response) {
  const post = await service.createDiscussion(auth(req).userId, all(req), req.body);
  return sendSuccess(res, 201, "Discussion post created", { post });
}
