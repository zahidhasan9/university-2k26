import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./upload.controller";
import { uploadSingleImage } from "./upload.middleware";

export const uploadRouter = Router();
uploadRouter.use(authenticate);
uploadRouter.post("/profile-image", uploadSingleImage, asyncHandler(controller.profileImage));
