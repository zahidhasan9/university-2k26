import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./attendance.controller";
import {
  attendanceBulkSchema,
  attendanceSessionCreateSchema,
  attendanceSessionIdSchema,
  qrCheckInSchema,
  qrGenerateSchema,
} from "./attendance.validation";

export const attendanceRouter = Router();
attendanceRouter.use(authenticate);
attendanceRouter.get("/mine", asyncHandler(controller.mine));
attendanceRouter.post("/qr/check-in", validate(qrCheckInSchema), asyncHandler(controller.checkIn));
attendanceRouter.get("/", authorize("attendance.read"), asyncHandler(controller.list));
attendanceRouter.post(
  "/",
  authorize("attendance.manage"),
  validate(attendanceSessionCreateSchema),
  asyncHandler(controller.create),
);
attendanceRouter.get(
  "/:id/records",
  authorize("attendance.read"),
  validate(attendanceSessionIdSchema),
  asyncHandler(controller.records),
);
attendanceRouter.put(
  "/:id/records",
  authorize("attendance.manage"),
  validate(attendanceBulkSchema),
  asyncHandler(controller.mark),
);
attendanceRouter.post(
  "/:id/close",
  authorize("attendance.manage"),
  validate(attendanceSessionIdSchema),
  asyncHandler(controller.close),
);
attendanceRouter.post(
  "/:id/qr",
  authorize("attendance.manage"),
  validate(qrGenerateSchema),
  asyncHandler(controller.generateQr),
);
