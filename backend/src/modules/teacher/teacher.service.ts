import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { RoleModel } from "../role/role.model";
import { DepartmentModel } from "../university-structure/department.model";
import { UserModel } from "../user/user.model";
import { TeacherModel } from "./teacher.model";

export async function listTeachers(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.departmentId) filter.department = toObjectId(String(query.departmentId), "department id");
  if (query.status) filter.status = query.status;
  if (query.designation) filter.designation = query.designation;
  if (query.search) filter.employeeId = { $regex: escapeRegex(String(query.search)), $options: "i" };
  const [items, total] = await Promise.all([
    TeacherModel.find(filter)
      .populate("user", "firstName lastName email status")
      .populate("department", "name code faculty")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TeacherModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getTeacher(id: string) {
  const teacher = await TeacherModel.findById(toObjectId(id))
    .populate("user", "firstName lastName email status")
    .populate("department", "name code faculty")
    .lean();
  if (!teacher) throw new AppError(404, "Teacher not found");
  return teacher;
}

export async function getTeacherByUser(userId: string) {
  const teacher = await TeacherModel.findOne({ user: toObjectId(userId, "user id") })
    .populate("user", "firstName lastName email status")
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

export async function updateTeacher(id: string, input: Record<string, unknown>) {
  const teacher = await TeacherModel.findById(toObjectId(id));
  if (!teacher) throw new AppError(404, "Teacher not found");
  if (input.departmentId) {
    const department = await DepartmentModel.findOne({
      _id: toObjectId(String(input.departmentId), "department id"),
      status: "active",
    });
    if (!department) throw new AppError(400, "Active department not found");
    teacher.department = department._id;
    delete input.departmentId;
  }
  teacher.set(input);
  await teacher.save();
  return getTeacher(id);
}
