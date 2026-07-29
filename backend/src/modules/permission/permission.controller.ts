import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as permissionService from "./permission.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Permissions retrieved", await permissionService.listPermissions(req.query));
}

export async function create(req: Request, res: Response): Promise<Response> {
  const permission = await permissionService.createPermission(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "permission.create",
    resource: "permission",
    resourceId: permission._id.toString(),
  });
  return sendSuccess(res, 201, "Permission created", { permission });
}

export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const permission = await permissionService.updatePermission(id, req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "permission.update",
    resource: "permission",
    resourceId: permission._id.toString(),
  });
  return sendSuccess(res, 200, "Permission updated", { permission });
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  await permissionService.deletePermission(id);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "permission.delete",
    resource: "permission",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Permission deleted", null);
}
