import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./exam.controller";
import { examCreateSchema, examIdSchema, examUpdateSchema, marksBulkSchema } from "./exam.validation";

export const examRouter = Router();
examRouter.use(authenticate);
examRouter.get("/", authorize("exams.read"), asyncHandler(controller.list));
examRouter.get("/:id", authorize("exams.read"), validate(examIdSchema), asyncHandler(controller.getOne));
examRouter.post("/", authorize("exams.manage"), validate(examCreateSchema), asyncHandler(controller.create));
examRouter.patch(
  "/:id",
  authorize("exams.manage"),
  validate(examUpdateSchema),
  asyncHandler(controller.update),
);
examRouter.get(
  "/:id/marks",
  authorize("exams.read"),
  validate(examIdSchema),
  asyncHandler(controller.marks),
);
examRouter.put(
  "/:id/marks",
  authorize("exams.manage"),
  validate(marksBulkSchema),
  asyncHandler(controller.enterMarks),
);
