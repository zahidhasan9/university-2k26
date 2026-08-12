import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./student.controller";
import { studentCreateSchema, studentIdParamSchema, studentSectionTransferSchema, studentUpdateSchema } from "./student.validation";

export const studentRouter = Router();
studentRouter.use(authenticate);
studentRouter.get("/me", asyncHandler(controller.me));
studentRouter.get("/", authorize("students.read"), asyncHandler(controller.list));
studentRouter.get(
  "/:id",
  authorize("students.read"),
  validate(studentIdParamSchema),
  asyncHandler(controller.getOne),
);
studentRouter.post(
  "/",
  authorize("students.manage"),
  validate(studentCreateSchema),
  asyncHandler(controller.create),
);
studentRouter.patch(
  "/:id",
  authorize("students.manage"),
  validate(studentUpdateSchema),
  asyncHandler(controller.update),
);
studentRouter.post(
  "/:id/section-transfer",
  authorize("students.manage"),
  validate(studentSectionTransferSchema),
  asyncHandler(controller.transferSection),
);
