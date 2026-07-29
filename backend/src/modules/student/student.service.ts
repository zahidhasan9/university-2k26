import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { RoleModel } from "../role/role.model";
import { SemesterModel } from "../semester/semester.model";
import { ProgramModel } from "../university-structure/program.model";
import { UserModel } from "../user/user.model";
import { StudentModel } from "./student.model";

export async function listStudents(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.programId) filter.program = toObjectId(String(query.programId), "program id");
  if (query.status) filter.status = query.status;
  if (query.search) filter.studentId = { $regex: escapeRegex(String(query.search)), $options: "i" };
  const [items, total] = await Promise.all([
    StudentModel.find(filter)
      .populate("user", "firstName lastName email status")
      .populate("program", "name code department")
      .populate("admissionSemester", "name code academicYear")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getStudent(id: string) {
  const student = await StudentModel.findById(toObjectId(id))
    .populate("user", "firstName lastName email status")
    .populate({ path: "program", select: "name code department", populate: { path: "department", select: "name code" } })
    .populate("admissionSemester", "name code academicYear")
    .lean();
  if (!student) throw new AppError(404, "Student not found");
  return student;
}

export async function getStudentByUser(userId: string) {
  const student = await StudentModel.findOne({ user: toObjectId(userId, "user id") })
    .populate("user", "firstName lastName email status")
    .populate({ path: "program", select: "name code department", populate: { path: "department", select: "name code" } })
    .populate("admissionSemester", "name code academicYear")
    .lean();
  if (!student) throw new AppError(404, "Student profile not found");
  return student;
}

export async function createStudent(input: Record<string, unknown>) {
  const userId = toObjectId(String(input.userId), "user id");
  const programId = toObjectId(String(input.programId), "program id");
  const semesterId = toObjectId(String(input.admissionSemesterId), "semester id");
  const [user, program, semester, studentRole] = await Promise.all([
    UserModel.findOne({ _id: userId, status: "active" }).select("+authVersion"),
    ProgramModel.findOne({ _id: programId, status: "active" }),
    SemesterModel.findOne({ _id: semesterId, status: { $ne: "archived" } }),
    RoleModel.findOne({ code: "student" }),
  ]);
  if (!user) throw new AppError(400, "Active user not found");
  if (!program) throw new AppError(400, "Active program not found");
  if (!semester) throw new AppError(400, "Admission semester not found");
  if (!studentRole) throw new AppError(500, "Student role is not configured");
  if (
    await StudentModel.countDocuments({
      $or: [{ user: userId }, { studentId: String(input.studentId) }],
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Student profile or student ID already exists");
  }

  const { userId: _, programId: __, admissionSemesterId: ___, admissionApplicationId, ...data } = input;
  const student = await StudentModel.create({
    ...data,
    user: userId,
    program: programId,
    admissionSemester: semesterId,
    ...(admissionApplicationId
      ? { admissionApplication: toObjectId(String(admissionApplicationId), "admission application id") }
      : {}),
  });
  if (!user.roles.some((roleId) => roleId.equals(studentRole._id))) {
    user.roles.push(studentRole._id);
    user.authVersion += 1;
    await user.save();
  }
  return getStudent(student._id.toString());
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  const student = await StudentModel.findById(toObjectId(id));
  if (!student) throw new AppError(404, "Student not found");
  if (input.programId) {
    const program = await ProgramModel.findOne({
      _id: toObjectId(String(input.programId), "program id"),
      status: "active",
    });
    if (!program) throw new AppError(400, "Active program not found");
    student.program = program._id;
    delete input.programId;
  }
  student.set(input);
  await student.save();
  return getStudent(id);
}
