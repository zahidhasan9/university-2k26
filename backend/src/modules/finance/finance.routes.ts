import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./finance.controller";
import {
  expenseActionSchema,
  expenseCreateSchema,
  feeStructureCreateSchema,
  feeStructureUpdateSchema,
  invoiceCreateSchema,
  invoiceVoidSchema,
  paymentCreateSchema,
  paymentRefundSchema,
  waiverCreateSchema,
  waiverUpdateSchema,
} from "./finance.validation";

export const financeRouter = Router();
financeRouter.use(authenticate);

financeRouter.get("/invoices/mine", asyncHandler(controller.myInvoices));
financeRouter.get("/payments/mine", asyncHandler(controller.myPayments));
financeRouter.get("/waivers", authorize("finance.read"), asyncHandler(controller.waivers));
financeRouter.post(
  "/waivers",
  authorize("finance.manage"),
  validate(waiverCreateSchema),
  asyncHandler(controller.createWaiver),
);
financeRouter.patch(
  "/waivers/:id",
  authorize("finance.manage"),
  validate(waiverUpdateSchema),
  asyncHandler(controller.updateWaiver),
);

financeRouter.get("/fee-structures", authorize("finance.read"), asyncHandler(controller.feeStructures));
financeRouter.post(
  "/fee-structures",
  authorize("finance.manage"),
  validate(feeStructureCreateSchema),
  asyncHandler(controller.createFeeStructure),
);
financeRouter.patch(
  "/fee-structures/:id",
  authorize("finance.manage"),
  validate(feeStructureUpdateSchema),
  asyncHandler(controller.updateFeeStructure),
);

financeRouter.get("/invoices", authorize("finance.read"), asyncHandler(controller.invoices));
financeRouter.post(
  "/invoices",
  authorize("finance.manage"),
  validate(invoiceCreateSchema),
  asyncHandler(controller.createInvoice),
);
financeRouter.post(
  "/invoices/:id/void",
  authorize("finance.manage"),
  validate(invoiceVoidSchema),
  asyncHandler(controller.voidInvoice),
);

financeRouter.get("/payments", authorize("finance.read"), asyncHandler(controller.payments));
financeRouter.post(
  "/payments",
  authorize("finance.collect"),
  validate(paymentCreateSchema),
  asyncHandler(controller.collectPayment),
);
financeRouter.post(
  "/payments/:id/refund",
  authorize("finance.refund"),
  validate(paymentRefundSchema),
  asyncHandler(controller.refundPayment),
);

financeRouter.get("/expenses", authorize("finance.read"), asyncHandler(controller.expenses));
financeRouter.post(
  "/expenses",
  authorize("finance.manage"),
  validate(expenseCreateSchema),
  asyncHandler(controller.createExpense),
);
financeRouter.post(
  "/expenses/:id/action",
  authorize("finance.approve"),
  validate(expenseActionSchema),
  asyncHandler(controller.actionExpense),
);
financeRouter.get("/reports/summary", authorize("finance.read"), asyncHandler(controller.summary));
