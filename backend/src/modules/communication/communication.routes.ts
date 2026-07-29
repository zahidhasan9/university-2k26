import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./communication.controller";
import {
  communicationIdSchema,
  conversationCreateSchema,
  messageCreateSchema,
  noticeCreateSchema,
  notificationDispatchSchema,
} from "./communication.validation";

export const communicationRouter = Router();
communicationRouter.use(authenticate);
communicationRouter.get("/notices", asyncHandler(controller.notices));
communicationRouter.post(
  "/notices",
  authorize("notices.manage"),
  validate(noticeCreateSchema),
  asyncHandler(controller.createNotice),
);
communicationRouter.get("/conversations", asyncHandler(controller.conversations));
communicationRouter.post(
  "/conversations",
  validate(conversationCreateSchema),
  asyncHandler(controller.createConversation),
);
communicationRouter.get(
  "/conversations/:id/messages",
  validate(communicationIdSchema),
  asyncHandler(controller.messages),
);
communicationRouter.post(
  "/conversations/:id/messages",
  validate(messageCreateSchema),
  asyncHandler(controller.send),
);
communicationRouter.get("/notifications", asyncHandler(controller.notifications));
communicationRouter.post(
  "/notifications/dispatch",
  authorize("notifications.manage"),
  validate(notificationDispatchSchema),
  asyncHandler(controller.dispatchNotification),
);
communicationRouter.patch(
  "/notifications/:id/read",
  validate(communicationIdSchema),
  asyncHandler(controller.readNotification),
);
