import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./facultyAdvising.controller";
import { advisingCreateSchema, advisingIdSchema } from "./facultyAdvising.validation";
export const facultyAdvisingRouter = Router(); facultyAdvisingRouter.use(authenticate); facultyAdvisingRouter.get("/", authorize("teachers.read"), asyncHandler(controller.list)); facultyAdvisingRouter.post("/", authorize("teachers.manage"), validate(advisingCreateSchema), asyncHandler(controller.create)); facultyAdvisingRouter.patch("/:id/end", authorize("teachers.manage"), validate(advisingIdSchema), asyncHandler(controller.end));
