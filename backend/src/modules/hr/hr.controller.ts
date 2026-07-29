import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./hr.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
async function audit(req: Request, action: string, resource: string, id: string) {
  await writeAuditLog(req, { actor: auth(req).userId, action, resource, resourceId: id });
}
export async function employees(req: Request, res: Response) {
  return sendSuccess(res, 200, "Employees retrieved", await service.listEmployees(req.query));
}
export async function createEmployee(req: Request, res: Response) {
  const employee = await service.createEmployee(req.body);
  await audit(req, "hr.employee_create", "employee", employee._id.toString());
  return sendSuccess(res, 201, "Employee created", { employee });
}
export async function updateEmployee(req: Request, res: Response) {
  const id = req.params.id as string;
  const employee = await service.updateEmployee(id, req.body);
  await audit(req, "hr.employee_update", "employee", id);
  return sendSuccess(res, 200, "Employee updated", { employee });
}
export async function attendance(req: Request, res: Response) {
  return sendSuccess(res, 200, "Employee attendance retrieved", {
    attendance: await service.listAttendance(req.query),
  });
}
export async function recordAttendance(req: Request, res: Response) {
  const attendance = await service.recordAttendance(auth(req).userId, req.body);
  await audit(req, "hr.attendance_record", "employee_attendance", attendance._id.toString());
  return sendSuccess(res, 200, "Employee attendance saved", { attendance });
}
export async function myAttendance(req: Request, res: Response) {
  return sendSuccess(res, 200, "Your attendance retrieved", {
    attendance: await service.myAttendance(auth(req).userId, req.query),
  });
}
export async function leaves(req: Request, res: Response) {
  return sendSuccess(res, 200, "Leave requests retrieved", {
    leaves: await service.listLeaves(req.query),
  });
}
export async function myLeaves(req: Request, res: Response) {
  return sendSuccess(res, 200, "Your leave requests retrieved", {
    leaves: await service.myLeaves(auth(req).userId),
  });
}
export async function createLeave(req: Request, res: Response) {
  const leave = await service.createLeave(auth(req).userId, req.body);
  await audit(req, "hr.leave_create", "leave_request", leave._id.toString());
  return sendSuccess(res, 201, "Leave request submitted", { leave });
}
export async function decideLeave(req: Request, res: Response) {
  const id = req.params.id as string;
  const leave = await service.decideLeave(id, auth(req).userId, req.body.decision, req.body.note);
  await audit(req, `hr.leave_${req.body.decision}`, "leave_request", id);
  return sendSuccess(res, 200, "Leave request reviewed", { leave });
}
export async function saveSalary(req: Request, res: Response) {
  const salaryStructure = await service.saveSalaryStructure(req.body);
  await audit(req, "hr.salary_structure_save", "salary_structure", salaryStructure._id.toString());
  return sendSuccess(res, 200, "Salary structure saved", { salaryStructure });
}
export async function payrollRuns(_req: Request, res: Response) {
  return sendSuccess(res, 200, "Payroll runs retrieved", {
    payrollRuns: await service.listPayrollRuns(),
  });
}
export async function createPayroll(req: Request, res: Response) {
  const payrollRun = await service.createPayrollRun(auth(req).userId, req.body);
  await audit(req, "payroll.run_create", "payroll_run", payrollRun._id.toString());
  return sendSuccess(res, 201, "Payroll run created", { payrollRun });
}
export async function payrollItems(req: Request, res: Response) {
  return sendSuccess(res, 200, "Payroll items retrieved", {
    payrollItems: await service.listPayrollItems(req.params.id as string),
  });
}
export async function processPayroll(req: Request, res: Response) {
  const id = req.params.id as string;
  const payrollRun = await service.processPayroll(id, auth(req).userId);
  await audit(req, "payroll.process", "payroll_run", id);
  return sendSuccess(res, 200, "Payroll processed", { payrollRun });
}
export async function payPayroll(req: Request, res: Response) {
  const id = req.params.id as string;
  const payrollRun = await service.payPayroll(id, auth(req).userId);
  await audit(req, "payroll.pay", "payroll_run", id);
  return sendSuccess(res, 200, "Payroll marked paid", { payrollRun });
}
export async function myPayslips(req: Request, res: Response) {
  return sendSuccess(res, 200, "Your payslips retrieved", {
    payslips: await service.myPayslips(auth(req).userId),
  });
}
