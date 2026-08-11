import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./enrollment.controller";
import { enrollmentCreateSchema, enrollmentDropSchema, enrollmentIdSchema, selfRegistrationSchema } from "./enrollment.validation";

export const enrollmentRouter = Router();
enrollmentRouter.use(authenticate);
enrollmentRouter.get("/mine", asyncHandler(controller.listMine));
enrollmentRouter.get("/registration-options/mine", asyncHandler(controller.registrationOptions));
enrollmentRouter.post(
  "/register/mine",
  validate(selfRegistrationSchema),
  asyncHandler(controller.registerMine),
);
enrollmentRouter.get("/", authorize("enrollments.read"), asyncHandler(controller.list));
enrollmentRouter.get(
  "/:id",
  authorize("enrollments.read"),
  validate(enrollmentIdSchema),
  asyncHandler(controller.getOne),
);
enrollmentRouter.post(
  "/",
  authorize("enrollments.manage"),
  validate(enrollmentCreateSchema),
  asyncHandler(controller.create),
);
enrollmentRouter.post(
  "/:id/drop",
  authorize("enrollments.manage"),
  validate(enrollmentDropSchema),
  asyncHandler(controller.drop),
);
