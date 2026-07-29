import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as roleService from "./role.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Roles retrieved", await roleService.listRoles(req.query));
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Role retrieved", {
    role: await roleService.getRole(req.params.id as string),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const role = await roleService.createRole(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "role.create",
    resource: "role",
    resourceId: role._id.toString(),
  });
  return sendSuccess(res, 201, "Role created", { role });
}
export async function update(req: Request, res: Response): Promise<Response> {
  const role = await roleService.updateRole(req.params.id as string, req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "role.update",
    resource: "role",
    resourceId: role._id.toString(),
  });
  return sendSuccess(res, 200, "Role updated", { role });
}
export async function remove(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  await roleService.deleteRole(id);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "role.delete",
    resource: "role",
    resourceId: id,
  });
  return sendSuccess(res, 200, "Role deleted", null);
}
