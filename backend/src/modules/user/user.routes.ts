import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./user.controller";
import { createUserSchema, updateUserSchema, userIdSchema } from "./user.validation";

export const userRouter = Router();
userRouter.use(authenticate);
userRouter.get("/", authorize("users.read"), asyncHandler(controller.list));
userRouter.get("/:id", authorize("users.read"), validate(userIdSchema), asyncHandler(controller.getOne));
userRouter.post("/", authorize("users.manage"), validate(createUserSchema), asyncHandler(controller.create));
userRouter.patch(
  "/:id",
  authorize("users.manage"),
  validate(updateUserSchema),
  asyncHandler(controller.update),
);
userRouter.delete(
  "/:id",
  authorize("users.manage"),
  validate(userIdSchema),
  asyncHandler(controller.disable),
);
