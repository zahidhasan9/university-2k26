import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";
import { listAuditLogs, listLoginHistory } from "./audit.controller";

export const auditRouter = Router();
auditRouter.use(authenticate, authorize("audit.read"));
auditRouter.get("/", asyncHandler(listAuditLogs));
auditRouter.get("/login-history", asyncHandler(listLoginHistory));
