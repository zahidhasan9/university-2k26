import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./curriculum.service";
export async function list(req: Request, res: Response) { return sendSuccess(res, 200, "Curricula retrieved", await service.listCurricula(req.query)); }
export async function getOne(req: Request, res: Response) { return sendSuccess(res, 200, "Curriculum retrieved", { curriculum: await service.getCurriculum(req.params.id as string) }); }
export async function create(req: Request, res: Response) { const curriculum = await service.createCurriculum(req.body); await writeAuditLog(req, { actor: req.auth?.userId, action: "curriculum.create", resource: "curriculum", resourceId: curriculum._id.toString() }); return sendSuccess(res, 201, "Curriculum created", { curriculum }); }
export async function update(req: Request, res: Response) { const id = req.params.id as string; const curriculum = await service.updateCurriculum(id, req.body); await writeAuditLog(req, { actor: req.auth?.userId, action: "curriculum.update", resource: "curriculum", resourceId: id }); return sendSuccess(res, 200, "Curriculum updated", { curriculum }); }
