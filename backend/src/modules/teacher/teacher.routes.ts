import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./teacher.controller";
import { teacherCreateSchema, teacherIdParamSchema, teacherUpdateSchema } from "./teacher.validation";

export const teacherRouter = Router();
teacherRouter.use(authenticate);
teacherRouter.get("/me", asyncHandler(controller.me));
teacherRouter.get("/", authorize("teachers.read"), asyncHandler(controller.list));
teacherRouter.get(
  "/:id",
  authorize("teachers.read"),
  validate(teacherIdParamSchema),
  asyncHandler(controller.getOne),
);
teacherRouter.post(
  "/",
  authorize("teachers.manage"),
  validate(teacherCreateSchema),
  asyncHandler(controller.create),
);
teacherRouter.patch(
  "/:id",
  authorize("teachers.manage"),
  validate(teacherUpdateSchema),
  asyncHandler(controller.update),
);
