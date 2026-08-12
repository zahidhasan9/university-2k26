import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { RoleModel } from "../role/role.model";
import { DepartmentModel } from "../university-structure/department.model";
import { UserModel } from "../user/user.model";
import { TeacherModel } from "./teacher.model";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";

export async function listTeachers(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.departmentId) filter.department = toObjectId(String(query.departmentId), "department id");
  if (query.status) filter.status = query.status;
  if (query.designation) filter.designation = query.designation;
  if (query.search) filter.employeeId = { $regex: escapeRegex(String(query.search)), $options: "i" };
  const [items, total, workloads] = await Promise.all([
    TeacherModel.find(filter)
      .populate("user", "firstName lastName email avatarUrl status")
      .populate("department", "name code faculty")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TeacherModel.countDocuments(filter),
    CourseOfferingModel.aggregate<{ _id: unknown; courseCount: number }>([{ $match: { status: { $in: ["planned", "open", "ongoing"] } } }, { $group: { _id: "$teacher", courseCount: { $sum: 1 } } }]),
  ]);
  const counts = new Map(workloads.map((item) => [String(item._id), item.courseCount]));
  return { items: items.map((item) => ({ ...item, activeCourseCount: counts.get(String(item._id)) ?? 0 })), pagination: paginationMeta(total, page, limit) };
}

export async function getTeacher(id: string) {
  const teacher = await TeacherModel.findById(toObjectId(id))
    .populate("user", "firstName lastName email avatarUrl status")
    .populate("department", "name code faculty")
    .lean();
  if (!teacher) throw new AppError(404, "Teacher not found");
  return teacher;
}

export async function getTeacherByUser(userId: string) {
  const teacher = await TeacherModel.findOne({ user: toObjectId(userId, "user id") })
    .populate("user", "firstName lastName email avatarUrl status")
    .populate("department", "name code faculty")
    .lean();
  if (!teacher) throw new AppError(404, "Teacher profile not found");
  return teacher;
}

export async function createTeacher(input: Record<string, unknown>) {
  const userId = toObjectId(String(input.userId), "user id");
  const departmentId = toObjectId(String(input.departmentId), "department id");
  const [user, department, teacherRole] = await Promise.all([
    UserModel.findOne({ _id: userId, status: "active" }).select("+authVersion"),
    DepartmentModel.findOne({ _id: departmentId, status: "active" }),
    RoleModel.findOne({ code: "teacher" }),
  ]);
  if (!user) throw new AppError(400, "Active user not found");
  if (!department) throw new AppError(400, "Active department not found");
  if (!teacherRole) throw new AppError(500, "Teacher role is not configured");
  if (
    await TeacherModel.countDocuments({
      $or: [{ user: userId }, { employeeId: String(input.employeeId) }],
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Teacher profile or employee ID already exists");
  }

  const { userId: _, departmentId: __, ...data } = input;
  const teacher = await TeacherModel.create({ ...data, user: userId, department: departmentId });
  if (!user.roles.some((roleId) => roleId.equals(teacherRole._id))) {
    user.roles.push(teacherRole._id);
    user.authVersion += 1;
    await user.save();
  }
  return getTeacher(teacher._id.toString());
}

export async function updateTeacher(id: string, input: Record<string, unknown>, actorId?: string) {
  const teacher = await TeacherModel.findById(toObjectId(id));
  if (!teacher) throw new AppError(404, "Teacher not found");
  if (input.departmentId) {
    const department = await DepartmentModel.findOne({
      _id: toObjectId(String(input.departmentId), "department id"),
      status: "active",
    });
    if (!department) throw new AppError(400, "Active department not found");
    if (!teacher.department.equals(department._id)) teacher.assignmentHistory.push({ department: teacher.department, designation: teacher.designation, changedAt: new Date(), ...(actorId ? { changedBy: toObjectId(actorId, "actor id") } : {}) });
    teacher.department = department._id;
    delete input.departmentId;
  }
  if (input.designation && input.designation !== teacher.designation && !input.departmentId) teacher.assignmentHistory.push({ department: teacher.department, designation: teacher.designation, changedAt: new Date(), ...(actorId ? { changedBy: toObjectId(actorId, "actor id") } : {}) });
  teacher.set(input);
  await teacher.save();
  return getTeacher(id);
}

export async function getTeacherWorkload(id: string, query: Record<string, unknown>) {
  const teacherId = toObjectId(id, "teacher id");
  const teacher = await TeacherModel.findById(teacherId).select("maxWeeklyHours").lean();
  if (!teacher) throw new AppError(404, "Teacher not found");
  const filter: Record<string, unknown> = { teacher: teacherId, status: { $in: ["planned", "open", "ongoing"] } };
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  const offerings = await CourseOfferingModel.find(filter).populate("course", "code title credits theoryHoursPerWeek labHoursPerWeek").populate("semester", "name code academicYear").populate("academicBatch", "code name").sort({ semester: 1 }).lean();
  const weeklyHours = offerings.reduce((sum, offering) => { const course = offering.course as unknown as { theoryHoursPerWeek?: number; labHoursPerWeek?: number }; return sum + (course?.theoryHoursPerWeek ?? 0) + (course?.labHoursPerWeek ?? 0); }, 0);
  return { offerings, summary: { courseCount: offerings.length, weeklyHours, maxWeeklyHours: teacher.maxWeeklyHours, remainingHours: teacher.maxWeeklyHours - weeklyHours, overloaded: weeklyHours > teacher.maxWeeklyHours } };
}
