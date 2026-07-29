import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./result.controller";
import {
  gradePolicyCreateSchema,
  gradePolicyUpdateSchema,
  offeringResultSchema,
  studentResultSchema,
} from "./result.validation";

export const resultRouter = Router();
resultRouter.use(authenticate);
resultRouter.get("/mine", asyncHandler(controller.mine));
resultRouter.get("/transcript/mine", asyncHandler(controller.myTranscript));
resultRouter.get(
  "/students/:studentId",
  authorize("results.read"),
  validate(studentResultSchema),
  asyncHandler(controller.studentResults),
);
resultRouter.get(
  "/students/:studentId/transcript",
  authorize("results.read"),
  validate(studentResultSchema),
  asyncHandler(controller.studentTranscript),
);
resultRouter.get("/grade-policies", authorize("results.read"), asyncHandler(controller.listPolicies));
resultRouter.post(
  "/grade-policies",
  authorize("grade_policies.manage"),
  validate(gradePolicyCreateSchema),
  asyncHandler(controller.createPolicy),
);
resultRouter.patch(
  "/grade-policies/:id",
  authorize("grade_policies.manage"),
  validate(gradePolicyUpdateSchema),
  asyncHandler(controller.updatePolicy),
);
resultRouter.get(
  "/offerings/:offeringId",
  authorize("results.read"),
  validate(offeringResultSchema),
  asyncHandler(controller.offeringResults),
);
resultRouter.post(
  "/offerings/:offeringId/calculate",
  authorize("results.manage"),
  validate(offeringResultSchema),
  asyncHandler(controller.calculate),
);
resultRouter.post(
  "/offerings/:offeringId/publish",
  authorize("results.publish"),
  validate(offeringResultSchema),
  asyncHandler(controller.publish),
);
