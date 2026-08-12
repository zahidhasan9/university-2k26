import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./academicSection.controller";
import { sectionCreateSchema, sectionIdSchema, sectionUpdateSchema } from "./academicSection.validation";

export const academicSectionRouter = Router();
academicSectionRouter.use(authenticate);
academicSectionRouter.get("/", authorize("academic.read"), asyncHandler(controller.list));
academicSectionRouter.post("/", authorize("academic.manage"), validate(sectionCreateSchema), asyncHandler(controller.create));
academicSectionRouter.patch("/:id", authorize("academic.manage"), validate(sectionUpdateSchema), asyncHandler(controller.update));
academicSectionRouter.delete("/:id", authorize("academic.manage"), validate(sectionIdSchema), asyncHandler(controller.archive));
