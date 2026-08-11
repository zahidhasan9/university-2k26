import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./lms.controller";
import {
  assignmentCreateSchema,
  discussionCreateSchema,
  lmsIdSchema,
  materialCreateSchema,
  quizCreateSchema,
  quizSubmitSchema,
  submissionCreateSchema,
  submissionGradeSchema,
} from "./lms.validation";

export const lmsRouter = Router();
lmsRouter.use(authenticate, authorize("lms.read"));
lmsRouter.get("/workspace", asyncHandler(controller.workspace));
lmsRouter.get("/materials", asyncHandler(controller.materials));
lmsRouter.post("/materials", authorize("lms.manage"), validate(materialCreateSchema), asyncHandler(controller.createMaterial));
lmsRouter.get("/assignments", asyncHandler(controller.assignments));
lmsRouter.post("/assignments", authorize("lms.manage"), validate(assignmentCreateSchema), asyncHandler(controller.createAssignment));
lmsRouter.post("/assignments/:id/submit", validate(submissionCreateSchema), asyncHandler(controller.submitAssignment));
lmsRouter.get("/assignments/:id/submissions", authorize("lms.manage"), validate(lmsIdSchema), asyncHandler(controller.submissions));
lmsRouter.patch("/submissions/:id/grade", authorize("lms.grade"), validate(submissionGradeSchema), asyncHandler(controller.grade));
lmsRouter.post("/quizzes", authorize("lms.manage"), validate(quizCreateSchema), asyncHandler(controller.createQuiz));
lmsRouter.get("/quizzes/:id", validate(lmsIdSchema), asyncHandler(controller.quiz));
lmsRouter.post("/quizzes/:id/start", validate(lmsIdSchema), asyncHandler(controller.startQuiz));
lmsRouter.post("/quizzes/:id/submit", validate(quizSubmitSchema), asyncHandler(controller.submitQuiz));
lmsRouter.get("/discussions", asyncHandler(controller.discussion));
lmsRouter.post("/discussions", validate(discussionCreateSchema), asyncHandler(controller.createDiscussion));
