import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { TeacherModel } from "../teacher/teacher.model";
import { DepartmentModel } from "../university-structure/department.model";
import { UserModel } from "../user/user.model";
import { EmployeeAttendanceModel } from "./employeeAttendance.model";
import { EmployeeModel } from "./employee.model";
import { LeaveRequestModel } from "./leaveRequest.model";
import { PayrollItemModel, PayrollRunModel, SalaryStructureModel } from "./payroll.model";

export async function listEmployees(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.departmentId) filter.department = toObjectId(String(query.departmentId), "department id");
  if (query.status) filter.status = query.status;
  if (query.employeeType) filter.employeeType = query.employeeType;
  if (query.search) filter.employeeId = { $regex: escapeRegex(String(query.search)), $options: "i" };
  const [items, total] = await Promise.all([
    EmployeeModel.find(filter)
      .populate("user", "firstName lastName email status")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EmployeeModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createEmployee(input: Record<string, unknown>) {
  const userId = toObjectId(String(input.userId), "user id");
  const [user, teacher, department] = await Promise.all([
    UserModel.findOne({ _id: userId, status: "active" }),
    input.teacherId
      ? TeacherModel.findOne({ _id: toObjectId(String(input.teacherId), "teacher id"), user: userId })
      : null,
    input.departmentId
      ? DepartmentModel.findOne({ _id: toObjectId(String(input.departmentId)), status: "active" })
      : null,
  ]);
  if (!user) throw new AppError(400, "Active user not found");
  if (input.teacherId && !teacher) throw new AppError(400, "Teacher profile does not match user");
  if (input.departmentId && !department) throw new AppError(400, "Active department not found");
  if (
    await EmployeeModel.countDocuments({
      $or: [{ user: userId }, { employeeId: String(input.employeeId) }],
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Employee profile or employee ID exists");
  }
  const { userId: _, teacherId: __, departmentId: ___, ...data } = input;
  return EmployeeModel.create({
    ...data,
    user: userId,
    ...(teacher ? { teacher: teacher._id } : {}),
    ...(department ? { department: department._id } : {}),
  });
}

export async function updateEmployee(id: string, input: Record<string, unknown>) {
  const employee = await EmployeeModel.findById(toObjectId(id)).select("+bankAccount.accountNumber +taxIdentifier");
  if (!employee) throw new AppError(404, "Employee not found");
  if (input.departmentId) {
    const department = await DepartmentModel.findOne({
      _id: toObjectId(String(input.departmentId)),
      status: "active",
    });
    if (!department) throw new AppError(400, "Active department not found");
    employee.department = department._id;
    delete input.departmentId;
  }
  if (input.employmentEndDate && new Date(String(input.employmentEndDate)) < employee.joiningDate) {
    throw new AppError(400, "Employment end date is invalid");
  }
  employee.set(input);
  await employee.save();
  return employee;
}

export async function recordAttendance(actorId: Types.ObjectId, input: Record<string, unknown>) {
  const employee = await EmployeeModel.findOne({
    _id: toObjectId(String(input.employeeId)),
    status: { $in: ["active", "on_leave"] },
  });
  if (!employee) throw new AppError(400, "Available employee not found");
  const date = new Date(input.date as Date);
  date.setUTCHours(0, 0, 0, 0);
  const { employeeId: _, ...data } = input;
  return EmployeeAttendanceModel.findOneAndUpdate(
    { employee: employee._id, date },
    { $set: { ...data, date, recordedBy: actorId } },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function listAttendance(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.employeeId) filter.employee = toObjectId(String(query.employeeId));
  if (query.from || query.to) {
    filter.date = {
      ...(query.from ? { $gte: new Date(String(query.from)) } : {}),
      ...(query.to ? { $lte: new Date(String(query.to)) } : {}),
    };
  }
  return EmployeeAttendanceModel.find(filter)
    .populate({ path: "employee", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } })
    .sort({ date: -1 })
    .lean();
}

async function employeeByUser(userId: Types.ObjectId) {
  const employee = await EmployeeModel.findOne({ user: userId }).lean();
  if (!employee) throw new AppError(404, "Employee profile not found");
  return employee;
}

export async function myAttendance(userId: Types.ObjectId, query: Record<string, unknown>) {
  const employee = await employeeByUser(userId);
  return listAttendance({ ...query, employeeId: employee._id.toString() });
}

function inclusiveDays(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export async function createLeave(
  userId: Types.ObjectId,
  input: {
    type: "casual" | "sick" | "annual" | "maternity" | "paternity" | "unpaid" | "other";
    startsAt: Date;
    endsAt: Date;
    reason: string;
  },
) {
  const employee = await employeeByUser(userId);
  const startsAt = new Date(input.startsAt as Date);
  const endsAt = new Date(input.endsAt as Date);
  startsAt.setUTCHours(0, 0, 0, 0);
  endsAt.setUTCHours(0, 0, 0, 0);
  if (
    await LeaveRequestModel.exists({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
      startsAt: { $lte: endsAt },
      endsAt: { $gte: startsAt },
    })
  ) {
    throw new AppError(409, "Leave overlaps an existing request");
  }
  return LeaveRequestModel.create({
    employee: employee._id,
    type: input.type,
    startsAt,
    endsAt,
    totalDays: inclusiveDays(startsAt, endsAt),
    reason: input.reason,
  });
}

export async function listLeaves(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.employeeId) filter.employee = toObjectId(String(query.employeeId));
  if (query.status) filter.status = query.status;
  return LeaveRequestModel.find(filter)
    .populate({ path: "employee", select: "employeeId user designation", populate: { path: "user", select: "firstName lastName email" } })
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
}

export async function myLeaves(userId: Types.ObjectId) {
  const employee = await employeeByUser(userId);
  return listLeaves({ employeeId: employee._id.toString() });
}

export async function decideLeave(
  id: string,
  reviewerId: Types.ObjectId,
  decision: "approve" | "reject",
  note?: string,
) {
  const reviewerEmployee = await EmployeeModel.findOne({ user: reviewerId }).select("_id").lean();
  const leave = await LeaveRequestModel.findOne({ _id: toObjectId(id), status: "pending" });
  if (!leave) throw new AppError(409, "Pending leave request not found");
  if (reviewerEmployee?._id.equals(leave.employee)) {
    throw new AppError(409, "Employees cannot approve their own leave");
  }
  leave.status = decision === "approve" ? "approved" : "rejected";
  leave.reviewedBy = reviewerId;
  leave.reviewedAt = new Date();
  leave.reviewNote = note;
  await leave.save();
  return leave;
}

export async function saveSalaryStructure(input: {
  employeeId: string;
  currency: string;
  earnings: Array<{ code: string; name: string; amountMinor: number }>;
  deductions: Array<{ code: string; name: string; amountMinor: number }>;
  effectiveFrom: Date;
}) {
  const employeeId = toObjectId(input.employeeId, "employee id");
  if (!(await EmployeeModel.exists({ _id: employeeId, status: "active" }))) {
    throw new AppError(400, "Active employee not found");
  }
  const grossMinor = input.earnings.reduce((sum, line) => sum + line.amountMinor, 0);
  const deductionMinor = input.deductions.reduce((sum, line) => sum + line.amountMinor, 0);
  if (deductionMinor > grossMinor) throw new AppError(400, "Deductions exceed gross salary");
  if (!Number.isSafeInteger(grossMinor) || !Number.isSafeInteger(deductionMinor)) {
    throw new AppError(400, "Salary amount is too large");
  }
  return SalaryStructureModel.findOneAndUpdate(
    { employee: employeeId, status: "active" },
    {
      $set: {
        currency: input.currency,
        earnings: input.earnings,
        deductions: input.deductions,
        grossMinor,
        deductionMinor,
        netMinor: grossMinor - deductionMinor,
        effectiveFrom: input.effectiveFrom,
      },
      $setOnInsert: { employee: employeeId, status: "active" },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function createPayrollRun(actorId: Types.ObjectId, input: { year: number; month: number; currency: string }) {
  if (await PayrollRunModel.exists(input)) throw new AppError(409, "Payroll run already exists");
  return PayrollRunModel.create({ ...input, createdBy: actorId });
}

export async function processPayroll(runId: string, actorId: Types.ObjectId) {
  const run = await PayrollRunModel.findOne({ _id: toObjectId(runId), status: "draft" });
  if (!run) throw new AppError(409, "Draft payroll run not found");
  const periodEnd = new Date(Date.UTC(run.year, run.month, 0, 23, 59, 59));
  const structures = await SalaryStructureModel.find({
    status: "active",
    currency: run.currency,
    effectiveFrom: { $lte: periodEnd },
  }).lean();
  if (!structures.length) throw new AppError(409, "No eligible salary structures found");
  const employeeIds = (await EmployeeModel.distinct("_id", {
    status: "active",
  })) as Types.ObjectId[];
  const active = new Set(employeeIds.map((id) => id.toString()));
  const eligible = structures.filter((item) => active.has(item.employee.toString()));
  if (!eligible.length) throw new AppError(409, "No active employees are eligible");
  try {
    await PayrollItemModel.insertMany(
      eligible.map((item) => ({
        run: run._id,
        employee: item.employee,
        currency: item.currency,
        earnings: item.earnings,
        deductions: item.deductions,
        grossMinor: item.grossMinor,
        deductionMinor: item.deductionMinor,
        netMinor: item.netMinor,
      })),
    );
    run.employeeCount = eligible.length;
    run.grossMinor = eligible.reduce((sum, item) => sum + item.grossMinor, 0);
    run.deductionMinor = eligible.reduce((sum, item) => sum + item.deductionMinor, 0);
    run.netMinor = eligible.reduce((sum, item) => sum + item.netMinor, 0);
    run.status = "processed";
    run.processedBy = actorId;
    run.processedAt = new Date();
    await run.save();
    return run;
  } catch (error) {
    await PayrollItemModel.deleteMany({ run: run._id });
    throw error;
  }
}

export async function payPayroll(runId: string, actorId: Types.ObjectId) {
  const run = await PayrollRunModel.findOneAndUpdate(
    { _id: toObjectId(runId), status: "processed" },
    { $set: { status: "paid", paidBy: actorId, paidAt: new Date() } },
    { new: true },
  );
  if (!run) throw new AppError(409, "Processed payroll run not found");
  try {
    await PayrollItemModel.updateMany({ run: run._id }, { $set: { status: "paid" } });
    return run;
  } catch (error) {
    await PayrollRunModel.updateOne(
      { _id: run._id },
      { $set: { status: "processed" }, $unset: { paidBy: 1, paidAt: 1 } },
    );
    throw error;
  }
}

export function listPayrollRuns() {
  return PayrollRunModel.find().sort({ year: -1, month: -1 }).lean();
}

export async function listPayrollItems(runId: string) {
  if (!(await PayrollRunModel.exists({ _id: toObjectId(runId) }))) {
    throw new AppError(404, "Payroll run not found");
  }
  return PayrollItemModel.find({ run: toObjectId(runId) })
    .populate({
      path: "employee",
      select: "employeeId designation user",
      populate: { path: "user", select: "firstName lastName email" },
    })
    .sort({ createdAt: 1 })
    .lean();
}

export async function myPayslips(userId: Types.ObjectId) {
  const employee = await employeeByUser(userId);
  return PayrollItemModel.find({ employee: employee._id })
    .populate("run", "year month status paidAt")
    .sort({ createdAt: -1 })
    .lean();
}
