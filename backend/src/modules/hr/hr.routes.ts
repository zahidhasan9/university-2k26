import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./hr.controller";
import {
  attendanceRecordSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  leaveActionSchema,
  leaveCreateSchema,
  payrollRunCreateSchema,
  salaryStructureSchema,
} from "./hr.validation";

export const hrRouter = Router();
hrRouter.use(authenticate);
hrRouter.get("/attendance/mine", asyncHandler(controller.myAttendance));
hrRouter.get("/leaves/mine", asyncHandler(controller.myLeaves));
hrRouter.post("/leaves", validate(leaveCreateSchema), asyncHandler(controller.createLeave));
hrRouter.get("/payslips/mine", asyncHandler(controller.myPayslips));

hrRouter.get("/employees", authorize("hr.read"), asyncHandler(controller.employees));
hrRouter.post(
  "/employees",
  authorize("hr.manage"),
  validate(employeeCreateSchema),
  asyncHandler(controller.createEmployee),
);
hrRouter.patch(
  "/employees/:id",
  authorize("hr.manage"),
  validate(employeeUpdateSchema),
  asyncHandler(controller.updateEmployee),
);
hrRouter.get("/attendance", authorize("hr.read"), asyncHandler(controller.attendance));
hrRouter.put(
  "/attendance",
  authorize("hr.attendance"),
  validate(attendanceRecordSchema),
  asyncHandler(controller.recordAttendance),
);
hrRouter.get("/leaves", authorize("hr.read"), asyncHandler(controller.leaves));
hrRouter.post(
  "/leaves/:id/decision",
  authorize("hr.leave_approve"),
  validate(leaveActionSchema),
  asyncHandler(controller.decideLeave),
);
hrRouter.put(
  "/salary-structures",
  authorize("payroll.manage"),
  validate(salaryStructureSchema),
  asyncHandler(controller.saveSalary),
);
hrRouter.get("/payroll-runs", authorize("payroll.read"), asyncHandler(controller.payrollRuns));
hrRouter.get(
  "/payroll-runs/:id/items",
  authorize("payroll.read"),
  asyncHandler(controller.payrollItems),
);
hrRouter.post(
  "/payroll-runs",
  authorize("payroll.manage"),
  validate(payrollRunCreateSchema),
  asyncHandler(controller.createPayroll),
);
hrRouter.post(
  "/payroll-runs/:id/process",
  authorize("payroll.manage"),
  asyncHandler(controller.processPayroll),
);
hrRouter.post(
  "/payroll-runs/:id/pay",
  authorize("payroll.pay"),
  asyncHandler(controller.payPayroll),
);
