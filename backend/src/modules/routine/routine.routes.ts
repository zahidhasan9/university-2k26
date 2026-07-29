import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./routine.controller";
import { routineCreateSchema, routineUpdateSchema } from "./routine.validation";

export const routineRouter = Router();
routineRouter.use(authenticate);
routineRouter.get("/", authorize("academic.read"), asyncHandler(controller.list));
routineRouter.post(
  "/",
  authorize("academic.manage"),
  validate(routineCreateSchema),
  asyncHandler(controller.create),
);
routineRouter.patch(
  "/:id",
  authorize("academic.manage"),
  validate(routineUpdateSchema),
  asyncHandler(controller.update),
);
