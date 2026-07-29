import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { StudentModel } from "../student/student.model";
import { TeacherModel } from "../teacher/teacher.model";
import { UserModel } from "../user/user.model";
import { PublicationModel } from "./publication.model";
import { ResearchProjectModel } from "./researchProject.model";
import { ThesisDefenseModel, ThesisModel } from "./thesis.model";

async function activeTeachers(ids: string[]) {
  const unique = [...new Set(ids)];
  const objectIds = unique.map((id) => toObjectId(id, "teacher id"));
  const teachers = await TeacherModel.find({ _id: { $in: objectIds }, status: "active" }).lean();
  if (teachers.length !== objectIds.length) throw new AppError(400, "One or more active teachers were not found");
  return teachers;
}
async function activeUsers(ids: string[]) {
  const unique = [...new Set(ids)];
  const objectIds = unique.map((id) => toObjectId(id, "user id"));
  if ((await UserModel.countDocuments({ _id: { $in: objectIds }, status: "active" })) !== objectIds.length) {
    throw new AppError(400, "One or more active members were not found");
  }
  return objectIds;
}

export async function listProjects(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.departmentId) filter.department = toObjectId(String(query.departmentId));
  if (query.search) {
    const search = escapeRegex(String(query.search));
    filter.$or = [{ title: { $regex: search, $options: "i" } }, { code: { $regex: search, $options: "i" } }];
  }
  const [items, total] = await Promise.all([
    ResearchProjectModel.find(filter)
      .populate({ path: "leadResearcher", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } })
      .populate("members", "firstName lastName email")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ResearchProjectModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createProject(input: Record<string, unknown>) {
  const lead = await TeacherModel.findOne({
    _id: toObjectId(String(input.leadResearcherId)),
    status: "active",
  });
  if (!lead) throw new AppError(400, "Active lead researcher not found");
  if (
    await ResearchProjectModel.countDocuments({
      code: String(input.code),
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Project code exists");
  }
  const members = await activeUsers((input.memberUserIds as string[]) ?? []);
  const { leadResearcherId: _, memberUserIds: __, ...data } = input;
  return ResearchProjectModel.create({
    ...data,
    leadResearcher: lead._id,
    department: lead.department,
    members,
  });
}

export async function updateProject(id: string, input: Record<string, unknown>) {
  const project = await ResearchProjectModel.findById(toObjectId(id));
  if (!project) throw new AppError(404, "Research project not found");
  if (input.memberUserIds) {
    project.members = await activeUsers(input.memberUserIds as string[]);
    delete input.memberUserIds;
  }
  const transitions: Record<string, string[]> = {
    proposed: ["approved", "cancelled"],
    approved: ["ongoing", "cancelled"],
    ongoing: ["completed", "suspended", "cancelled"],
    suspended: ["ongoing", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (input.status && input.status !== project.status && !transitions[project.status]?.includes(String(input.status))) {
    throw new AppError(409, `Cannot move project from ${project.status} to ${input.status}`);
  }
  if (input.endsAt && new Date(input.endsAt as Date) < project.startsAt) {
    throw new AppError(400, "Project end date is invalid");
  }
  project.set(input);
  await project.save();
  return project;
}

export async function listPublications(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.authorId) filter.authors = toObjectId(String(query.authorId));
  if (query.projectId) filter.project = toObjectId(String(query.projectId));
  return PublicationModel.find(filter)
    .populate({ path: "authors", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } })
    .populate("project", "code title")
    .sort({ publishedAt: -1 })
    .lean();
}

export async function createPublication(input: Record<string, unknown>) {
  const authors = await activeTeachers(input.authorTeacherIds as string[]);
  if (input.doi && (await PublicationModel.exists({ doi: input.doi }))) {
    throw new AppError(409, "Publication DOI exists");
  }
  if (input.projectId && !(await ResearchProjectModel.exists({ _id: toObjectId(String(input.projectId)) }))) {
    throw new AppError(400, "Research project not found");
  }
  const { authorTeacherIds: _, projectId, ...data } = input;
  return PublicationModel.create({
    ...data,
    authors: authors.map((teacher) => teacher._id),
    ...(projectId ? { project: toObjectId(String(projectId)) } : {}),
  });
}

export async function proposeThesis(
  userId: Types.ObjectId,
  input: {
    title: string;
    abstract: string;
    supervisorId: string;
    coSupervisorIds: string[];
  },
) {
  const student = await StudentModel.findOne({ user: userId, status: "active" });
  if (!student) throw new AppError(404, "Active student profile not found");
  if (await ThesisModel.exists({ student: student._id })) throw new AppError(409, "Student already has a thesis");
  const supervisorIds = [input.supervisorId, ...(input.coSupervisorIds ?? [])];
  if (new Set(supervisorIds).size !== supervisorIds.length) {
    throw new AppError(400, "Supervisor list contains duplicates");
  }
  const teachers = await activeTeachers(supervisorIds);
  return ThesisModel.create({
    student: student._id,
    program: student.program,
    title: input.title,
    abstract: input.abstract,
    supervisor: teachers[0]!._id,
    coSupervisors: teachers.slice(1).map((teacher) => teacher._id),
  });
}

const thesisPopulate = [
  { path: "student", select: "studentId user program", populate: { path: "user", select: "firstName lastName email" } },
  { path: "supervisor", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } },
  { path: "coSupervisors", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } },
];
export async function listTheses(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.supervisorId) filter.supervisor = toObjectId(String(query.supervisorId));
  let mongoQuery = ThesisModel.find(filter).sort({ createdAt: -1 });
  for (const item of thesisPopulate) mongoQuery = mongoQuery.populate(item);
  return mongoQuery.lean();
}
export async function myThesis(userId: Types.ObjectId) {
  const student = await StudentModel.findOne({ user: userId }).select("_id").lean();
  if (!student) throw new AppError(404, "Student profile not found");
  let query = ThesisModel.findOne({ student: student._id });
  for (const item of thesisPopulate) query = query.populate(item);
  const thesis = await query.lean();
  if (!thesis) throw new AppError(404, "Thesis not found");
  const defense = await ThesisDefenseModel.findOne({ thesis: thesis._id }).populate("panel", "employeeId user").lean();
  return { thesis, defense };
}

async function supervisorForUser(userId: Types.ObjectId) {
  const teacher = await TeacherModel.findOne({ user: userId, status: "active" }).select("_id").lean();
  if (!teacher) throw new AppError(403, "Active teacher profile required");
  return teacher;
}
export async function thesisAction(
  id: string,
  userId: Types.ObjectId,
  action: "approve" | "reject" | "start" | "complete_revision",
) {
  const teacher = await supervisorForUser(userId);
  const thesis = await ThesisModel.findOne({ _id: toObjectId(id), supervisor: teacher._id });
  if (!thesis) throw new AppError(403, "Only the assigned supervisor can perform this action");
  const expected =
    action === "start" ? "approved" : action === "complete_revision" ? "defended" : "proposed";
  if (thesis.status !== expected) throw new AppError(409, `Thesis must be ${expected}`);
  thesis.status =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : action === "start"
          ? "in_progress"
          : "completed";
  if (action === "complete_revision") thesis.completedAt = new Date();
  await thesis.save();
  return thesis;
}
export async function submitThesis(id: string, userId: Types.ObjectId, documentUrl: string) {
  const student = await StudentModel.findOne({ user: userId }).select("_id").lean();
  const thesis = await ThesisModel.findOne({
    _id: toObjectId(id),
    student: student?._id,
    status: "in_progress",
  });
  if (!thesis) throw new AppError(409, "In-progress thesis owned by student not found");
  thesis.documentUrl = documentUrl;
  thesis.submittedAt = new Date();
  thesis.status = "submitted";
  await thesis.save();
  return thesis;
}
export async function scheduleDefense(
  thesisId: string,
  input: { scheduledAt: Date; room: string; panelTeacherIds: string[] },
) {
  const thesis = await ThesisModel.findOne({ _id: toObjectId(thesisId), status: "submitted" });
  if (!thesis) throw new AppError(409, "Submitted thesis not found");
  const panel = await activeTeachers(input.panelTeacherIds);
  if (new Set(panel.map((teacher) => teacher._id.toString())).size !== panel.length) {
    throw new AppError(400, "Defense panel contains duplicates");
  }
  const conflict = await ThesisDefenseModel.exists({
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    $or: [{ room: input.room }, { panel: { $in: panel.map((teacher) => teacher._id) } }],
  });
  if (conflict) throw new AppError(409, "Defense room or panel member has a schedule conflict");
  const defense = await ThesisDefenseModel.create({
    thesis: thesis._id,
    scheduledAt: input.scheduledAt,
    room: input.room,
    panel: panel.map((teacher) => teacher._id),
  });
  thesis.status = "defense_scheduled";
  await thesis.save();
  return defense;
}
export async function recordDefense(
  thesisId: string,
  actorId: Types.ObjectId,
  outcome: "pass" | "pass_with_revision" | "fail",
  remarks: string,
) {
  const thesis = await ThesisModel.findOne({ _id: toObjectId(thesisId), status: "defense_scheduled" });
  if (!thesis) throw new AppError(409, "Scheduled thesis defense not found");
  const defense = await ThesisDefenseModel.findOne({ thesis: thesis._id, status: "scheduled" });
  if (!defense) throw new AppError(409, "Active defense record not found");
  defense.status = "completed";
  defense.outcome = outcome;
  defense.remarks = remarks;
  defense.completedAt = new Date();
  defense.recordedBy = actorId;
  await defense.save();
  thesis.status = outcome === "fail" ? "rejected" : outcome === "pass" ? "completed" : "defended";
  if (outcome === "pass") thesis.completedAt = new Date();
  await thesis.save();
  return { thesis, defense };
}
