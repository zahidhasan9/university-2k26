import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { notifyUser } from "../communication/communication.service";
import { StudentModel } from "../student/student.model";
import { UserModel } from "../user/user.model";
import { AlumniModel } from "./alumni.model";
import { ComplaintModel } from "./complaint.model";

export async function createComplaint(userId: Types.ObjectId, input: Record<string, unknown>) {
  return ComplaintModel.create({
    ...input,
    complaintNumber: `CMP-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 10)}`.toUpperCase(),
    complainant: userId,
  });
}
export function myComplaints(userId: Types.ObjectId) {
  return ComplaintModel.find({ complainant: userId })
    .populate("assignedTo", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
}
export async function listComplaints(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;
  const [items, total] = await Promise.all([
    ComplaintModel.find(filter)
      .populate("complainant assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ComplaintModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}
export async function actionComplaint(
  id: string,
  input: {
    action: "start_review" | "resolve" | "reject" | "close";
    assignedToUserId?: string;
    resolution?: string;
  },
) {
  const complaint = await ComplaintModel.findById(toObjectId(id));
  if (!complaint) throw new AppError(404, "Complaint not found");
  const allowed: Record<typeof input.action, string[]> = {
    start_review: ["submitted"],
    resolve: ["under_review"],
    reject: ["submitted", "under_review"],
    close: ["resolved", "rejected"],
  };
  if (!allowed[input.action].includes(complaint.status)) {
    throw new AppError(409, `Cannot ${input.action} complaint in ${complaint.status} status`);
  }
  if (input.action === "start_review") {
    if (!input.assignedToUserId) throw new AppError(400, "Assignee is required");
    const assignee = toObjectId(input.assignedToUserId);
    if (!(await UserModel.exists({ _id: assignee, status: "active" }))) {
      throw new AppError(400, "Active assignee not found");
    }
    complaint.assignedTo = assignee;
    complaint.status = "under_review";
  } else if (input.action === "resolve") {
    if (!input.resolution) throw new AppError(400, "Resolution is required");
    complaint.resolution = input.resolution;
    complaint.resolvedAt = new Date();
    complaint.status = "resolved";
  } else if (input.action === "reject") {
    if (!input.resolution) throw new AppError(400, "Rejection reason is required");
    complaint.resolution = input.resolution;
    complaint.resolvedAt = new Date();
    complaint.status = "rejected";
  } else {
    complaint.status = "closed";
  }
  await complaint.save();
  await notifyUser(
    complaint.complainant,
    "complaint.updated",
    "Complaint updated",
    `${complaint.complaintNumber} is now ${complaint.status}`,
    { complaintId: complaint._id.toString() },
  );
  return complaint;
}

export async function registerAlumni(userId: Types.ObjectId, input: Record<string, unknown>) {
  const student = await StudentModel.findOne({ user: userId, status: "graduated" });
  if (!student) throw new AppError(409, "A graduated student profile is required");
  if (await AlumniModel.exists({ user: userId })) throw new AppError(409, "Alumni profile exists");
  return AlumniModel.create({
    ...input,
    student: student._id,
    user: userId,
    program: student.program,
  });
}
export async function myAlumni(userId: Types.ObjectId) {
  const alumni = await AlumniModel.findOne({ user: userId })
    .populate("program", "name code")
    .lean();
  if (!alumni) throw new AppError(404, "Alumni profile not found");
  return alumni;
}
export function alumniDirectory(query: Record<string, unknown>, manage = false) {
  const filter: Record<string, unknown> = manage
    ? {}
    : { status: "verified", directoryVisible: true };
  if (query.programId) filter.program = toObjectId(String(query.programId));
  if (query.graduationYear) filter.graduationYear = Number(query.graduationYear);
  return AlumniModel.find(filter)
    .populate("user", "firstName lastName")
    .populate("program", "name code")
    .sort({ graduationYear: -1 })
    .lean();
}
export async function setAlumniStatus(id: string, actorId: Types.ObjectId, status: "verified" | "suspended") {
  const alumni = await AlumniModel.findById(toObjectId(id));
  if (!alumni) throw new AppError(404, "Alumni profile not found");
  alumni.status = status;
  if (status === "verified") {
    alumni.verifiedBy = actorId;
    alumni.verifiedAt = new Date();
  }
  await alumni.save();
  return alumni;
}
