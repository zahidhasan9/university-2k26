import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./research.controller";
import {
  defenseOutcomeSchema,
  defenseScheduleSchema,
  projectCreateSchema,
  projectUpdateSchema,
  publicationCreateSchema,
  thesisActionSchema,
  thesisProposeSchema,
  thesisSubmitSchema,
} from "./research.validation";

export const researchRouter = Router();
researchRouter.use(authenticate);
researchRouter.get("/theses/mine", asyncHandler(controller.mine));
researchRouter.post("/theses/propose", validate(thesisProposeSchema), asyncHandler(controller.propose));
researchRouter.post("/theses/:id/submit", validate(thesisSubmitSchema), asyncHandler(controller.submit));
researchRouter.post(
  "/theses/:id/supervisor-action",
  authorize("thesis.supervise"),
  validate(thesisActionSchema),
  asyncHandler(controller.thesisAction),
);
researchRouter.post(
  "/theses/:id/defense",
  authorize("thesis.manage"),
  validate(defenseScheduleSchema),
  asyncHandler(controller.scheduleDefense),
);
researchRouter.post(
  "/theses/:id/defense/outcome",
  authorize("thesis.manage"),
  validate(defenseOutcomeSchema),
  asyncHandler(controller.recordDefense),
);
researchRouter.get("/theses", authorize("thesis.read"), asyncHandler(controller.theses));
researchRouter.get("/projects", authorize("research.read"), asyncHandler(controller.projects));
researchRouter.post(
  "/projects",
  authorize("research.manage"),
  validate(projectCreateSchema),
  asyncHandler(controller.createProject),
);
researchRouter.patch(
  "/projects/:id",
  authorize("research.manage"),
  validate(projectUpdateSchema),
  asyncHandler(controller.updateProject),
);
researchRouter.get("/publications", authorize("research.read"), asyncHandler(controller.publications));
researchRouter.post(
  "/publications",
  authorize("research.manage"),
  validate(publicationCreateSchema),
  asyncHandler(controller.createPublication),
);
