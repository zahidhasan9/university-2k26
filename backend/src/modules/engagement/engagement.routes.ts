import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./engagement.controller";
import {
  alumniCreateSchema,
  alumniStatusSchema,
  complaintActionSchema,
  complaintCreateSchema,
} from "./engagement.validation";

export const engagementRouter = Router();
engagementRouter.use(authenticate);
engagementRouter.get("/complaints/mine", asyncHandler(controller.mine));
engagementRouter.post("/complaints", validate(complaintCreateSchema), asyncHandler(controller.createComplaint));
engagementRouter.get("/complaints", authorize("complaints.manage"), asyncHandler(controller.complaints));
engagementRouter.post(
  "/complaints/:id/action",
  authorize("complaints.manage"),
  validate(complaintActionSchema),
  asyncHandler(controller.actionComplaint),
);
engagementRouter.get("/alumni/mine", asyncHandler(controller.myAlumni));
engagementRouter.post("/alumni/register", validate(alumniCreateSchema), asyncHandler(controller.registerAlumni));
engagementRouter.get("/alumni", asyncHandler(controller.directory));
engagementRouter.patch(
  "/alumni/:id/status",
  authorize("alumni.manage"),
  validate(alumniStatusSchema),
  asyncHandler(controller.alumniStatus),
);
