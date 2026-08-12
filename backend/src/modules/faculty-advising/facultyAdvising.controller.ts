import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./facultyAdvising.service";
export async function list(req: Request, res: Response) { return sendSuccess(res, 200, "Faculty advising assignments retrieved", { items: await service.list(req.query) }); }
export async function create(req: Request, res: Response) { const assignment = await service.create(req.auth!.userId.toString(), req.body); await writeAuditLog(req, { actor: req.auth!.userId, action: "faculty.advising_assign", resource: "faculty_advising", resourceId: assignment._id.toString() }); return sendSuccess(res, 201, "Faculty advisor assigned", { assignment }); }
export async function end(req: Request, res: Response) { const assignment = await service.end(String(req.params.id)); await writeAuditLog(req, { actor: req.auth!.userId, action: "faculty.advising_end", resource: "faculty_advising", resourceId: assignment._id.toString() }); return sendSuccess(res, 200, "Faculty advising assignment ended", { assignment }); }
