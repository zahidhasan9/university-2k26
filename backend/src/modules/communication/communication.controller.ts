import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./communication.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
export async function notices(req: Request, res: Response) {
  return sendSuccess(res, 200, "Notices retrieved", {
    notices: await service.listNotices(
      auth(req).roleIds,
      auth(req).permissions.includes("notices.manage"),
    ),
  });
}
export async function createNotice(req: Request, res: Response) {
  const notice = await service.createNotice(auth(req).userId, req.body);
  await writeAuditLog(req, { actor: auth(req).userId, action: "notice.create", resource: "notice", resourceId: notice._id.toString() });
  return sendSuccess(res, 201, "Notice created", { notice });
}
export async function conversations(req: Request, res: Response) {
  return sendSuccess(res, 200, "Conversations retrieved", {
    conversations: await service.listConversations(auth(req).userId),
  });
}
export async function createConversation(req: Request, res: Response) {
  const conversation = await service.createConversation(auth(req).userId, req.body);
  return sendSuccess(res, 201, "Conversation ready", { conversation });
}
export async function messages(req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    "Messages retrieved",
    await service.listMessages(req.params.id as string, auth(req).userId, req.query),
  );
}
export async function send(req: Request, res: Response) {
  const message = await service.sendMessage(req.params.id as string, auth(req).userId, req.body);
  return sendSuccess(res, 201, "Message sent", { message });
}
export async function notifications(req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    "Notifications retrieved",
    await service.listNotifications(auth(req).userId, req.query),
  );
}
export async function readNotification(req: Request, res: Response) {
  const notification = await service.readNotification(req.params.id as string, auth(req).userId);
  return sendSuccess(res, 200, "Notification marked read", { notification });
}
export async function dispatchNotification(req: Request, res: Response) {
  const notification = await service.dispatchExternalNotification(req.body);
  await writeAuditLog(req, {
    actor: auth(req).userId,
    action: "notification.dispatch",
    resource: "notification",
    resourceId: notification._id.toString(),
  });
  return sendSuccess(res, 202, "Notification accepted for delivery", { notification });
}
