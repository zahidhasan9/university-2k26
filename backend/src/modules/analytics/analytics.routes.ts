import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./analytics.controller";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.get("/admin", authorize("analytics.read"), asyncHandler(controller.admin));
analyticsRouter.get(
  "/departments",
  authorize("analytics.read"),
  asyncHandler(controller.departments),
);
analyticsRouter.get("/teacher", asyncHandler(controller.teacher));
analyticsRouter.get("/student", asyncHandler(controller.student));
