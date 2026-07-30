import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as userService from "./user.service";

export async function list(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Users retrieved",
    await userService.listUsers(req.query),
  );
}
export async function getOne(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "User retrieved", {
    user: await userService.getUser(req.params.id as string),
  });
}
export async function create(req: Request, res: Response): Promise<Response> {
  const user = await userService.createUser(req.body);
  await writeAuditLog(req, {
    actor: req.auth?.userId,
    action: "user.create",
    resource: "user",
    resourceId: String(user._id),
  });
  return sendSuccess(res, 201, "User created", { user });
}
export async function update(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const id = req.params.id as string;
  const user = await userService.updateUser(id, req.auth.userId, req.body);
  await writeAuditLog(req, {
    actor: req.auth.userId,
    action: "user.update",
    resource: "user",
    resourceId: id,
    metadata: { changedFields: Object.keys(req.body) },
  });
  return sendSuccess(res, 200, "User updated", { user });
}
export async function disable(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const id = req.params.id as string;
  await userService.disableUser(id, req.auth.userId);
  await writeAuditLog(req, {
    actor: req.auth.userId,
    action: "user.disable",
    resource: "user",
    resourceId: id,
  });
  return sendSuccess(res, 200, "User disabled", null);
}

export async function updateMe(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const user = await userService.updateOwnProfile(req.auth.userId, req.body);
  await writeAuditLog(req, {
    actor: req.auth.userId,
    action: "user.profile_update",
    resource: "user",
    resourceId: req.auth.userId.toString(),
    metadata: { changedFields: Object.keys(req.body) },
  });
  return sendSuccess(res, 200, "Profile updated", { user });
}
