import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./finance.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
async function audit(req: Request, action: string, resource: string, resourceId: string) {
  await writeAuditLog(req, { actor: auth(req).userId, action, resource, resourceId });
}
export async function waivers(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Student waivers retrieved", {
    waivers: await service.listWaivers(req.query),
  });
}
export async function createWaiver(req: Request, res: Response): Promise<Response> {
  const waiver = await service.createWaiver(auth(req).userId, req.body);
  await audit(req, "finance.waiver_create", "student_waiver", waiver._id.toString());
  return sendSuccess(res, 201, "Student waiver created", { waiver });
}
export async function updateWaiver(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const waiver = await service.updateWaiver(id, req.body.status);
  await audit(req, "finance.waiver_update", "student_waiver", id);
  return sendSuccess(res, 200, "Student waiver updated", { waiver });
}

export async function feeStructures(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Fee structures retrieved", {
    feeStructures: await service.listFeeStructures(req.query),
  });
}
export async function createFeeStructure(req: Request, res: Response): Promise<Response> {
  const feeStructure = await service.createFeeStructure(req.body);
  await audit(req, "finance.fee_structure_create", "fee_structure", feeStructure._id.toString());
  return sendSuccess(res, 201, "Fee structure created", { feeStructure });
}
export async function updateFeeStructure(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const feeStructure = await service.updateFeeStructure(id, req.body);
  await audit(req, "finance.fee_structure_update", "fee_structure", id);
  return sendSuccess(res, 200, "Fee structure updated", { feeStructure });
}
export async function invoices(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Invoices retrieved", await service.listInvoices(req.query));
}
export async function myInvoices(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Your invoices retrieved",
    await service.listMyInvoices(auth(req).userId, req.query),
  );
}
export async function createInvoice(req: Request, res: Response): Promise<Response> {
  const invoice = await service.createInvoice(auth(req).userId, req.body);
  await audit(req, "finance.invoice_create", "invoice", invoice._id.toString());
  return sendSuccess(res, 201, "Invoice issued", { invoice });
}
export async function voidInvoice(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const invoice = await service.voidInvoice(id, auth(req).userId, req.body.reason);
  await audit(req, "finance.invoice_void", "invoice", id);
  return sendSuccess(res, 200, "Invoice voided", { invoice });
}
export async function payments(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Payments retrieved", await service.listPayments(req.query));
}
export async function myPayments(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Your payments retrieved",
    await service.listMyPayments(auth(req).userId, req.query),
  );
}
export async function collectPayment(req: Request, res: Response): Promise<Response> {
  const payment = await service.collectPayment(auth(req).userId, req.body);
  await audit(req, "finance.payment_collect", "payment", payment._id.toString());
  return sendSuccess(res, 201, "Payment collected", { payment });
}
export async function refundPayment(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const payment = await service.refundPayment(id, auth(req).userId, req.body.reason);
  await audit(req, "finance.payment_refund", "payment", id);
  return sendSuccess(res, 200, "Payment refunded", { payment });
}
export async function expenses(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Expenses retrieved", await service.listExpenses(req.query));
}
export async function createExpense(req: Request, res: Response): Promise<Response> {
  const expense = await service.createExpense(auth(req).userId, req.body);
  await audit(req, "finance.expense_create", "expense", expense._id.toString());
  return sendSuccess(res, 201, "Expense created", { expense });
}
export async function actionExpense(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const expense = await service.actionExpense(
    id,
    auth(req).userId,
    req.body.action,
    req.body.note,
  );
  await audit(req, `finance.expense_${req.body.action}`, "expense", id);
  return sendSuccess(res, 200, "Expense updated", { expense });
}
export async function summary(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Finance summary generated", await service.financeSummary(req.query));
}
