import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./upload.controller";
import { uploadSingleDocument, uploadSingleImage } from "./upload.middleware";

export const uploadRouter = Router();
uploadRouter.use(authenticate);
uploadRouter.post("/profile-image", uploadSingleImage, asyncHandler(controller.profileImage));
uploadRouter.post("/admission-document", uploadSingleDocument, asyncHandler(controller.admissionDocument));
uploadRouter.post("/student-document", authorize("students.manage"), uploadSingleDocument, asyncHandler(controller.studentDocument));
uploadRouter.post("/student-profile-image", authorize("students.manage"), uploadSingleImage, asyncHandler(controller.studentProfileImage));
