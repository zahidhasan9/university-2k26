import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./academicBatch.controller";
import { batchCreateSchema, batchIdSchema, batchUpdateSchema } from "./academicBatch.validation";

export const academicBatchRouter = Router();
academicBatchRouter.use(authenticate);
academicBatchRouter.get("/", authorize("academic.read"), asyncHandler(controller.list));
academicBatchRouter.get("/:id", authorize("academic.read"), validate(batchIdSchema), asyncHandler(controller.getOne));
academicBatchRouter.post("/", authorize("academic.manage"), validate(batchCreateSchema), asyncHandler(controller.create));
academicBatchRouter.patch("/:id", authorize("academic.manage"), validate(batchUpdateSchema), asyncHandler(controller.update));
academicBatchRouter.delete("/:id", authorize("academic.manage"), validate(batchIdSchema), asyncHandler(controller.archive));
