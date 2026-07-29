import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./permission.controller";
import {
  createPermissionSchema,
  permissionIdSchema,
  updatePermissionSchema,
} from "./permission.validation";

export const permissionRouter = Router();
permissionRouter.use(authenticate);
permissionRouter.get("/", authorize("roles.read"), asyncHandler(controller.list));
permissionRouter.post(
  "/",
  authorize("roles.manage"),
  validate(createPermissionSchema),
  asyncHandler(controller.create),
);
permissionRouter.patch(
  "/:id",
  authorize("roles.manage"),
  validate(updatePermissionSchema),
  asyncHandler(controller.update),
);
permissionRouter.delete(
  "/:id",
  authorize("roles.manage"),
  validate(permissionIdSchema),
  asyncHandler(controller.remove),
);
