import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./routine.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Routine retrieved", await service.listRoutine(req.query));
}
export async function create(req: Request, res: Response): Promise<Response> {
  const slot = await service.createRoutineSlot(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "routine.create",
    resource: "routine_slot",
    resourceId: slot._id.toString(),
  });
  return sendSuccess(res, 201, "Routine slot created", { slot });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const slot = await service.updateRoutineSlot(id, req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "routine.update",
    resource: "routine_slot",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Routine slot updated", { slot });
}
