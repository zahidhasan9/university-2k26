import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./semester.controller";
import { semesterCreateSchema, semesterIdSchema, semesterUpdateSchema } from "./semester.validation";

export const semesterRouter = Router();
semesterRouter.use(authenticate);
semesterRouter.get("/", authorize("academic.read"), asyncHandler(controller.list));
semesterRouter.get(
  "/:id",
  authorize("academic.read"),
  validate(semesterIdSchema),
  asyncHandler(controller.getOne),
);
semesterRouter.post(
  "/",
  authorize("academic.manage"),
  validate(semesterCreateSchema),
  asyncHandler(controller.create),
);
semesterRouter.patch(
  "/:id",
  authorize("academic.manage"),
  validate(semesterUpdateSchema),
  asyncHandler(controller.update),
);
