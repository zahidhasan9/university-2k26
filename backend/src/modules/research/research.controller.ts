import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./research.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
async function audit(req: Request, action: string, resource: string, id: string) {
  await writeAuditLog(req, { actor: auth(req).userId, action, resource, resourceId: id });
}
export async function projects(req: Request, res: Response) {
  return sendSuccess(res, 200, "Research projects retrieved", await service.listProjects(req.query));
}
export async function createProject(req: Request, res: Response) {
  const project = await service.createProject(req.body);
  await audit(req, "research.project_create", "research_project", project._id.toString());
  return sendSuccess(res, 201, "Research project created", { project });
}
export async function updateProject(req: Request, res: Response) {
  const id = req.params.id as string;
  const project = await service.updateProject(id, req.body);
  await audit(req, "research.project_update", "research_project", id);
  return sendSuccess(res, 200, "Research project updated", { project });
}
export async function publications(req: Request, res: Response) {
  return sendSuccess(res, 200, "Publications retrieved", {
    publications: await service.listPublications(req.query),
  });
}
export async function createPublication(req: Request, res: Response) {
  const publication = await service.createPublication(req.body);
  await audit(req, "research.publication_create", "publication", publication._id.toString());
  return sendSuccess(res, 201, "Publication created", { publication });
}
export async function theses(req: Request, res: Response) {
  return sendSuccess(res, 200, "Theses retrieved", { theses: await service.listTheses(req.query) });
}
export async function mine(req: Request, res: Response) {
  return sendSuccess(res, 200, "Your thesis retrieved", await service.myThesis(auth(req).userId));
}
export async function propose(req: Request, res: Response) {
  const thesis = await service.proposeThesis(auth(req).userId, req.body);
  await audit(req, "thesis.propose", "thesis", thesis._id.toString());
  return sendSuccess(res, 201, "Thesis proposal submitted", { thesis });
}
export async function thesisAction(req: Request, res: Response) {
  const id = req.params.id as string;
  const thesis = await service.thesisAction(id, auth(req).userId, req.body.action);
  await audit(req, `thesis.${req.body.action}`, "thesis", id);
  return sendSuccess(res, 200, "Thesis updated", { thesis });
}
export async function submit(req: Request, res: Response) {
  const id = req.params.id as string;
  const thesis = await service.submitThesis(id, auth(req).userId, req.body.documentUrl);
  await audit(req, "thesis.submit", "thesis", id);
  return sendSuccess(res, 200, "Thesis submitted", { thesis });
}
export async function scheduleDefense(req: Request, res: Response) {
  const id = req.params.id as string;
  const defense = await service.scheduleDefense(id, req.body);
  await audit(req, "thesis.defense_schedule", "thesis", id);
  return sendSuccess(res, 201, "Thesis defense scheduled", { defense });
}
export async function recordDefense(req: Request, res: Response) {
  const id = req.params.id as string;
  const result = await service.recordDefense(id, auth(req).userId, req.body.outcome, req.body.remarks);
  await audit(req, "thesis.defense_record", "thesis", id);
  return sendSuccess(res, 200, "Thesis defense recorded", result);
}
