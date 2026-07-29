import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./courseOffering.controller";
import { offeringCreateSchema, offeringIdSchema, offeringUpdateSchema } from "./courseOffering.validation";

export const courseOfferingRouter = Router();
courseOfferingRouter.use(authenticate);
courseOfferingRouter.get("/", authorize("academic.read"), asyncHandler(controller.list));
courseOfferingRouter.get(
  "/:id",
  authorize("academic.read"),
  validate(offeringIdSchema),
  asyncHandler(controller.getOne),
);
courseOfferingRouter.post(
  "/",
  authorize("academic.manage"),
  validate(offeringCreateSchema),
  asyncHandler(controller.create),
);
courseOfferingRouter.patch(
  "/:id",
  authorize("academic.manage"),
  validate(offeringUpdateSchema),
  asyncHandler(controller.update),
);
