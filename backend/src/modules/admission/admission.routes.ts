import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./admission.controller";
import {
  admissionCreateSchema,
  admissionDecisionSchema,
  admissionIdSchema,
  admissionReviewSchema,
  admissionUpdateSchema,
} from "./admission.validation";

export const admissionRouter = Router();
admissionRouter.get("/options", asyncHandler(controller.options));
admissionRouter.use(authenticate);
admissionRouter.get("/mine", asyncHandler(controller.listMine));
admissionRouter.get("/", authorize("admissions.read"), asyncHandler(controller.list));
admissionRouter.post("/", validate(admissionCreateSchema), asyncHandler(controller.create));
admissionRouter.get("/:id", validate(admissionIdSchema), asyncHandler(controller.getOne));
admissionRouter.patch("/:id", validate(admissionUpdateSchema), asyncHandler(controller.update));
admissionRouter.post(
  "/:id/submit",
  validate(admissionIdSchema),
  asyncHandler(controller.submit),
);
admissionRouter.post(
  "/:id/review",
  authorize("admissions.review"),
  validate(admissionReviewSchema),
  asyncHandler(controller.review),
);
admissionRouter.post(
  "/:id/decision",
  authorize("admissions.review"),
  validate(admissionDecisionSchema),
  asyncHandler(controller.decide),
);
admissionRouter.post(
  "/:id/cancel",
  validate(admissionIdSchema),
  asyncHandler(controller.cancel),
);
