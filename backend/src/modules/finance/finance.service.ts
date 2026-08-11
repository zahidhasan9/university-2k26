import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { SemesterModel } from "../semester/semester.model";
import { StudentModel } from "../student/student.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { CourseModel } from "../university-structure/course.model";
import { ProgramModel } from "../university-structure/program.model";
import { ExpenseModel } from "./expense.model";
import { FeeStructureModel } from "./feeStructure.model";
import { InvoiceModel } from "./invoice.model";
import { PaymentModel } from "./payment.model";
import { StudentWaiverModel } from "./studentWaiver.model";

const idNumber = (prefix: string) =>
  `${prefix}-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 10)}`.toUpperCase();

export async function listFeeStructures(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.programId) filter.program = toObjectId(String(query.programId), "program id");
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.status) filter.status = query.status;
  return FeeStructureModel.find(filter)
    .populate("program", "name code")
    .populate("semester", "name code academicYear")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createFeeStructure(input: {
  programId: string;
  semesterId: string;
  name: string;
  currency: string;
  perCreditFeeMinor: number;
  items: unknown[];
}) {
  const programId = toObjectId(input.programId, "program id");
  const semesterId = toObjectId(input.semesterId, "semester id");
  const [program, semester] = await Promise.all([
    ProgramModel.findOne({ _id: programId, status: "active" }),
    SemesterModel.findOne({ _id: semesterId, status: { $ne: "archived" } }),
  ]);
  if (!program || !semester) throw new AppError(400, "Active program and semester are required");
  if (await FeeStructureModel.exists({ program: programId, semester: semesterId })) {
    throw new AppError(409, "Fee structure already exists for this program and semester");
  }
  return FeeStructureModel.create({
    program: programId,
    semester: semesterId,
    name: input.name,
    currency: input.currency,
    perCreditFeeMinor: input.perCreditFeeMinor,
    items: input.items,
  });
}

export async function updateFeeStructure(id: string, input: Record<string, unknown>) {
  const structure = await FeeStructureModel.findById(toObjectId(id));
  if (!structure) throw new AppError(404, "Fee structure not found");
  if (structure.status === "archived") throw new AppError(409, "Archived fee structure is immutable");
  if (input.items && (await InvoiceModel.exists({ feeStructure: structure._id }))) {
    throw new AppError(409, "Fee items cannot change after invoices have been issued");
  }
  const transitions: Record<string, string[]> = {
    draft: ["active", "archived"],
    active: ["archived"],
    archived: [],
  };
  if (
    input.status &&
    input.status !== structure.status &&
    !transitions[structure.status]?.includes(String(input.status))
  ) {
    throw new AppError(409, `Cannot move fee structure from ${structure.status} to ${input.status}`);
  }
  structure.set(input);
  await structure.save();
  return structure;
}

export async function createInvoice(
  actorId: Types.ObjectId,
  input: {
    studentId: string;
    semesterId: string;
    selectedOptionalItemCodes: string[];
    discountMinor: number;
    dueDate: Date;
    allowRegistrationUpdate?: boolean;
  },
) {
  const studentId = toObjectId(input.studentId, "student id");
  const semesterId = toObjectId(input.semesterId, "semester id");
  const student = await StudentModel.findOne({ _id: studentId, status: "active" }).lean();
  if (!student) throw new AppError(400, "Active student not found");
  const structure = await FeeStructureModel.findOne({
    program: student.program,
    semester: semesterId,
    status: "active",
  }).lean();
  if (!structure) throw new AppError(409, "Active fee structure not found for this student");
  const existingInvoice = await InvoiceModel.findOne({ student: studentId, semester: semesterId });
  if (existingInvoice && !input.allowRegistrationUpdate) {
    throw new AppError(409, "Student already has an invoice for this semester");
  }
  const optionalCodes = new Set(input.selectedOptionalItemCodes);
  const validOptionalCodes = new Set(
    structure.items.filter((item) => !item.mandatory).map((item) => item.code),
  );
  if ([...optionalCodes].some((code) => !validOptionalCodes.has(code))) {
    throw new AppError(400, "One or more optional fee item codes are invalid");
  }
  const items = structure.items
    .filter((item) => item.mandatory || optionalCodes.has(item.code))
    .map((item) => ({ code: item.code, name: item.name, amountMinor: item.amountMinor }));
  const enrollments = await EnrollmentModel.find({
    student: studentId,
    semester: semesterId,
    status: "enrolled",
  }).select("course").lean();
  const courses = await CourseModel.find({ _id: { $in: enrollments.map((item) => item.course) } })
    .select("credits")
    .lean();
  const registeredCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const tuitionMinor = Math.round(registeredCredits * structure.perCreditFeeMinor);
  if (tuitionMinor > 0) items.unshift({
    code: "TUITION_CREDIT",
    name: `Tuition (${registeredCredits} credits × ${(structure.perCreditFeeMinor / 100).toFixed(2)} ${structure.currency})`,
    amountMinor: tuitionMinor,
  });
  const subtotalMinor = items.reduce((sum, item) => sum + item.amountMinor, 0);
  if (!Number.isSafeInteger(subtotalMinor)) throw new AppError(400, "Invoice total is too large");
  const semester = await SemesterModel.findById(semesterId).select("startsAt endsAt").lean();
  const waiver = semester
    ? await StudentWaiverModel.findOne({
        student: studentId,
        status: "active",
        validFrom: { $lte: semester.endsAt },
        validUntil: { $gte: semester.startsAt },
      }).sort({ createdAt: -1 }).lean()
    : null;
  const waiverBase = waiver?.appliesTo === "all" ? subtotalMinor : tuitionMinor;
  const waiverMinor = waiver
    ? Math.min(
        waiverBase,
        waiver.type === "percentage" ? Math.round(waiverBase * waiver.value / 100) : waiver.value,
      )
    : 0;
  const discountMinor = input.discountMinor + waiverMinor;
  if (discountMinor > subtotalMinor) throw new AppError(400, "Discount exceeds invoice subtotal");
  const totalMinor = subtotalMinor - discountMinor;
  if (existingInvoice) {
    existingInvoice.set({
      feeStructure: structure._id,
      currency: structure.currency,
      registeredCredits,
      perCreditFeeMinor: structure.perCreditFeeMinor,
      waiver: waiver?._id,
      waiverDescription: waiver ? `${waiver.name} (${waiver.type === "percentage" ? `${waiver.value}%` : `${(waiver.value / 100).toFixed(2)} ${structure.currency}`})` : undefined,
      items,
      subtotalMinor,
      discountMinor,
      totalMinor,
      dueMinor: Math.max(0, totalMinor - existingInvoice.paidMinor),
      status: totalMinor <= existingInvoice.paidMinor ? "paid" : existingInvoice.paidMinor > 0 ? "partially_paid" : "issued",
      dueDate: input.dueDate,
    });
    await existingInvoice.save();
    return existingInvoice;
  }
  return InvoiceModel.create({
    invoiceNumber: idNumber("INV"),
    student: studentId,
    semester: semesterId,
    feeStructure: structure._id,
    currency: structure.currency,
    registeredCredits,
    perCreditFeeMinor: structure.perCreditFeeMinor,
    waiver: waiver?._id,
    waiverDescription: waiver ? `${waiver.name} (${waiver.type === "percentage" ? `${waiver.value}%` : `${(waiver.value / 100).toFixed(2)} ${structure.currency}`})` : undefined,
    items,
    subtotalMinor,
    discountMinor,
    totalMinor,
    dueMinor: totalMinor,
    status: totalMinor === 0 ? "paid" : "issued",
    dueDate: input.dueDate,
    issuedBy: actorId,
  });
}

export async function listWaivers(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.studentId) filter.student = toObjectId(String(query.studentId), "student id");
  if (query.status) filter.status = query.status;
  return StudentWaiverModel.find(filter)
    .populate({ path: "student", select: "studentId user", populate: { path: "user", select: "firstName lastName email" } })
    .populate("approvedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createWaiver(actorId: Types.ObjectId, input: Record<string, unknown>) {
  const student = await StudentModel.findOne({
    _id: toObjectId(String(input.studentId), "student id"),
    status: "active",
  });
  if (!student) throw new AppError(400, "Active student not found");
  if (input.type === "percentage" && Number(input.value) > 100) {
    throw new AppError(400, "Percentage waiver cannot exceed 100");
  }
  const { studentId: _, ...data } = input;
  return StudentWaiverModel.create({ ...data, student: student._id, approvedBy: actorId });
}

export async function updateWaiver(id: string, status: "active" | "inactive" | "revoked") {
  const waiver = await StudentWaiverModel.findById(toObjectId(id));
  if (!waiver) throw new AppError(404, "Student waiver not found");
  waiver.status = status;
  await waiver.save();
  return waiver;
}

export async function listInvoices(query: Record<string, unknown>) {
  await InvoiceModel.updateMany(
    { status: "issued", dueDate: { $lt: new Date() }, dueMinor: { $gt: 0 } },
    { $set: { status: "overdue" } },
  );
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.studentId) filter.student = toObjectId(String(query.studentId), "student id");
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.invoiceNumber = { $regex: escapeRegex(String(query.search)), $options: "i" };
  }
  const [items, total] = await Promise.all([
    InvoiceModel.find(filter)
      .populate({
        path: "student",
        select: "studentId user program",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .populate("semester", "name code academicYear")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InvoiceModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function listMyInvoices(userId: Types.ObjectId, query: Record<string, unknown>) {
  const student = await StudentModel.findOne({ user: userId }).select("_id").lean();
  if (!student) throw new AppError(404, "Student profile not found");
  return listInvoices({ ...query, studentId: student._id.toString() });
}

export async function voidInvoice(
  id: string,
  actorId: Types.ObjectId,
  reason: string,
) {
  const invoice = await InvoiceModel.findOne({ _id: toObjectId(id), status: { $ne: "void" } });
  if (!invoice) throw new AppError(404, "Active invoice not found");
  if (invoice.paidMinor > 0) throw new AppError(409, "Paid invoices cannot be voided; refund payments first");
  invoice.status = "void";
  invoice.voidedAt = new Date();
  invoice.voidedBy = actorId;
  invoice.voidReason = reason;
  await invoice.save();
  return invoice;
}

async function refreshInvoiceStatus(invoiceId: Types.ObjectId) {
  const invoice = await InvoiceModel.findById(invoiceId);
  if (!invoice || invoice.status === "void") return invoice;
  invoice.status =
    invoice.dueMinor === 0
      ? "paid"
      : invoice.paidMinor > 0
        ? "partially_paid"
        : invoice.dueDate < new Date()
          ? "overdue"
          : "issued";
  await invoice.save();
  return invoice;
}

export async function collectPayment(
  actorId: Types.ObjectId,
  input: {
    invoiceId: string;
    amountMinor: number;
    method: "cash" | "bank_transfer" | "card" | "mobile_banking" | "cheque" | "online";
    externalReference?: string;
    paidAt?: Date;
  },
) {
  if (
    input.externalReference &&
    (await PaymentModel.exists({ externalReference: input.externalReference }))
  ) {
    throw new AppError(409, "Payment reference has already been processed");
  }
  const invoiceId = toObjectId(input.invoiceId, "invoice id");
  const invoice = await InvoiceModel.findOneAndUpdate(
    {
      _id: invoiceId,
      status: { $nin: ["void", "paid"] },
      dueMinor: { $gte: input.amountMinor },
    },
    { $inc: { paidMinor: input.amountMinor, dueMinor: -input.amountMinor } },
    { new: true },
  );
  if (!invoice) throw new AppError(409, "Invoice is unavailable or payment exceeds the balance");
  try {
    const payment = await PaymentModel.create({
      receiptNumber: idNumber("RCP"),
      invoice: invoice._id,
      student: invoice.student,
      amountMinor: input.amountMinor,
      currency: invoice.currency,
      method: input.method,
      externalReference: input.externalReference,
      collectedBy: actorId,
      paidAt: input.paidAt,
    });
    await refreshInvoiceStatus(invoice._id);
    return payment.populate("invoice", "invoiceNumber totalMinor paidMinor dueMinor status");
  } catch (error) {
    await InvoiceModel.updateOne(
      { _id: invoice._id },
      { $inc: { paidMinor: -input.amountMinor, dueMinor: input.amountMinor } },
    );
    await refreshInvoiceStatus(invoice._id);
    throw error;
  }
}

export async function listPayments(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.studentId) filter.student = toObjectId(String(query.studentId), "student id");
  if (query.invoiceId) filter.invoice = toObjectId(String(query.invoiceId), "invoice id");
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    PaymentModel.find(filter)
      .populate("invoice", "invoiceNumber totalMinor paidMinor dueMinor status")
      .populate({
        path: "student",
        select: "studentId user",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PaymentModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function listMyPayments(userId: Types.ObjectId, query: Record<string, unknown>) {
  const student = await StudentModel.findOne({ user: userId }).select("_id").lean();
  if (!student) throw new AppError(404, "Student profile not found");
  return listPayments({ ...query, studentId: student._id.toString() });
}

export async function refundPayment(
  id: string,
  actorId: Types.ObjectId,
  reason: string,
) {
  const payment = await PaymentModel.findOneAndUpdate(
    { _id: toObjectId(id), status: "completed" },
    {
      $set: {
        status: "refunded",
        refundedAt: new Date(),
        refundedBy: actorId,
        refundReason: reason,
      },
    },
    { new: true },
  );
  if (!payment) throw new AppError(409, "Completed payment not found");
  try {
    const invoiceUpdate = await InvoiceModel.updateOne(
      { _id: payment.invoice, paidMinor: { $gte: payment.amountMinor } },
      { $inc: { paidMinor: -payment.amountMinor, dueMinor: payment.amountMinor } },
    );
    if (!invoiceUpdate.modifiedCount) throw new AppError(409, "Invoice balance cannot accept this refund");
    await refreshInvoiceStatus(payment.invoice);
    return payment;
  } catch (error) {
    await PaymentModel.updateOne(
      { _id: payment._id },
      { $set: { status: "completed" }, $unset: { refundedAt: 1, refundedBy: 1, refundReason: 1 } },
    );
    throw error;
  }
}

export async function createExpense(actorId: Types.ObjectId, input: Record<string, unknown>) {
  return ExpenseModel.create({
    ...input,
    expenseNumber: idNumber("EXP"),
    createdBy: actorId,
  });
}

export async function listExpenses(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  const [items, total] = await Promise.all([
    ExpenseModel.find(filter)
      .populate("createdBy approvedBy", "firstName lastName email")
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ExpenseModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function actionExpense(
  id: string,
  actorId: Types.ObjectId,
  action: "approve" | "reject" | "mark_paid" | "cancel",
  note?: string,
) {
  const expense = await ExpenseModel.findById(toObjectId(id));
  if (!expense) throw new AppError(404, "Expense not found");
  const expected: Record<typeof action, string[]> = {
    approve: ["draft"],
    reject: ["draft"],
    mark_paid: ["approved"],
    cancel: ["draft", "approved"],
  };
  if (!expected[action].includes(expense.status)) {
    throw new AppError(409, `Cannot ${action} an expense in ${expense.status} status`);
  }
  expense.status =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : action === "mark_paid"
          ? "paid"
          : "cancelled";
  expense.note = note;
  if (action === "approve") {
    expense.approvedBy = actorId;
    expense.approvedAt = new Date();
  }
  await expense.save();
  return expense;
}

export async function financeSummary(query: Record<string, unknown>) {
  const from = query.from ? new Date(String(query.from)) : new Date(0);
  const to = query.to ? new Date(String(query.to)) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new AppError(400, "Invalid report date range");
  }
  const [payments, expenses, invoiceTotals] = await Promise.all([
    PaymentModel.aggregate([
      { $match: { status: "completed", paidAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$currency", amountMinor: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
    ]),
    ExpenseModel.aggregate([
      { $match: { status: "paid", expenseDate: { $gte: from, $lte: to } } },
      { $group: { _id: "$currency", amountMinor: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
    ]),
    InvoiceModel.aggregate([
      { $match: { status: { $ne: "void" } } },
      {
        $group: {
          _id: "$currency",
          billedMinor: { $sum: "$totalMinor" },
          paidMinor: { $sum: "$paidMinor" },
          dueMinor: { $sum: "$dueMinor" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);
  return { period: { from, to }, payments, expenses, invoices: invoiceTotals };
}
