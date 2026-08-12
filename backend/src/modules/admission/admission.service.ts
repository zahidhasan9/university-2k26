import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { SemesterModel } from "../semester/semester.model";
import { createStudent } from "../student/student.service";
import { ProgramModel } from "../university-structure/program.model";
import { AdmissionModel } from "./admission.model";

const populate = [
  { path: "applicant", select: "firstName lastName email status" },
  { path: "program", select: "name code department" },
  { path: "intakeSemester", select: "name code academicYear status" },
  { path: "reviewedBy", select: "firstName lastName email" },
];

export async function listAdmissions(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.programId) filter.program = toObjectId(String(query.programId), "program id");
  if (query.semesterId) filter.intakeSemester = toObjectId(String(query.semesterId), "semester id");
  if (query.applicantId) filter.applicant = toObjectId(String(query.applicantId), "applicant id");
  if (query.search) {
    filter.applicationNumber = { $regex: escapeRegex(String(query.search)), $options: "i" };
  }
  let findQuery = AdmissionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  for (const item of populate) findQuery = findQuery.populate(item);
  const [items, total] = await Promise.all([findQuery.lean(), AdmissionModel.countDocuments(filter)]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function listMyAdmissions(userId: Types.ObjectId, query: Record<string, unknown>) {
  return listAdmissions({ ...query, applicantId: userId.toString() });
}

export async function getAdmission(id: string, userId?: Types.ObjectId, unrestricted = false) {
  let query = AdmissionModel.findById(toObjectId(id));
  for (const item of populate) query = query.populate(item);
  const admission = await query.lean();
  if (!admission) throw new AppError(404, "Admission application not found");
  const applicant = admission.applicant as unknown as { _id: Types.ObjectId };
  if (!unrestricted && (!userId || !applicant._id.equals(userId))) {
    throw new AppError(403, "You cannot access this application");
  }
  return admission;
}

export async function createAdmission(userId: Types.ObjectId, input: Record<string, unknown>) {
  const programId = toObjectId(String(input.programId), "program id");
  const semesterId = toObjectId(String(input.intakeSemesterId), "semester id");
  const [program, semester] = await Promise.all([
    ProgramModel.findOne({ _id: programId, status: "active" }),
    SemesterModel.findOne({ _id: semesterId, status: { $in: ["planned", "registration"] } }),
  ]);
  if (!program) throw new AppError(400, "Active program not found");
  if (!semester) throw new AppError(400, "Open intake semester not found");
  if (await AdmissionModel.exists({ applicant: userId, program: programId, intakeSemester: semesterId })) {
    throw new AppError(409, "An application already exists for this program and intake");
  }
  const { programId: _, intakeSemesterId: __, ...data } = input;
  return AdmissionModel.create({
    ...data,
    applicationNumber: `ADM-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8)}`.toUpperCase(),
    applicant: userId,
    program: programId,
    intakeSemester: semesterId,
  });
}

export async function updateDraft(id: string, userId: Types.ObjectId, input: Record<string, unknown>) {
  const application = await AdmissionModel.findOne({
    _id: toObjectId(id),
    applicant: userId,
    status: "draft",
  });
  if (!application) throw new AppError(404, "Editable draft application not found");
  application.set(input);
  await application.save();
  return application;
}

export async function submitApplication(id: string, userId: Types.ObjectId) {
  const application = await AdmissionModel.findOne({
    _id: toObjectId(id),
    applicant: userId,
    status: "draft",
  });
  if (!application) throw new AppError(404, "Draft application not found");
  if (!application.previousEducation.length) {
    throw new AppError(400, "Previous education information is required");
  }
  application.status = "submitted";
  application.submittedAt = new Date();
  await application.save();
  return application;
}

export async function startReview(id: string, reviewerId: Types.ObjectId, note?: string) {
  const application = await AdmissionModel.findOne({
    _id: toObjectId(id),
    status: "submitted",
  });
  if (!application) throw new AppError(409, "Only submitted applications can enter review");
  application.status = "under_review";
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.reviewNote = note;
  await application.save();
  return application;
}

export async function decideApplication(
  id: string,
  reviewerId: Types.ObjectId,
  input: { decision: "approve"; studentId: string; academicBatchId: string; academicSectionId: string; note?: string } | { decision: "reject"; note: string },
) {
  const application = await AdmissionModel.findOne({
    _id: toObjectId(id),
    status: "under_review",
  });
  if (!application) throw new AppError(409, "Only applications under review can be decided");

  let student: unknown;
  if (input.decision === "approve") {
    student = await createStudent({
      userId: application.applicant.toString(),
      studentId: input.studentId,
      academicBatchId: input.academicBatchId,
      academicSectionId: input.academicSectionId,
      programId: application.program.toString(),
      admissionSemesterId: application.intakeSemester.toString(),
      admissionApplicationId: application._id.toString(),
    });
    application.status = "approved";
  } else {
    application.status = "rejected";
  }
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.reviewNote = input.note;
  await application.save();
  return { application, student };
}

export async function cancelApplication(id: string, userId: Types.ObjectId) {
  const application = await AdmissionModel.findOne({
    _id: toObjectId(id),
    applicant: userId,
    status: { $in: ["draft", "submitted"] },
  });
  if (!application) throw new AppError(409, "Application can no longer be cancelled");
  application.status = "cancelled";
  await application.save();
}
