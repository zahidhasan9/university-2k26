import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./role.controller";
import { createRoleSchema, roleIdSchema, updateRoleSchema } from "./role.validation";

export const roleRouter = Router();
roleRouter.use(authenticate);
roleRouter.get("/", authorize("roles.read"), asyncHandler(controller.list));
roleRouter.get("/:id", authorize("roles.read"), validate(roleIdSchema), asyncHandler(controller.getOne));
roleRouter.post("/", authorize("roles.manage"), validate(createRoleSchema), asyncHandler(controller.create));
roleRouter.patch(
  "/:id",
  authorize("roles.manage"),
  validate(updateRoleSchema),
  asyncHandler(controller.update),
);
roleRouter.delete(
  "/:id",
  authorize("roles.manage"),
  validate(roleIdSchema),
  asyncHandler(controller.remove),
);
