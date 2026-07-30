import bcrypt from "bcrypt";
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
      .populate({
        path: "program",
        select: "name code department",
        populate: { path: "department", select: "name code" },
      })
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
  const studentId = String(input.studentId);
  const programId = toObjectId(String(input.programId), "program id");
  const semesterId = toObjectId(String(input.admissionSemesterId), "semester id");
  if (await StudentModel.exists({ studentId })) {
    throw new AppError(409, "Student ID already exists");
  }
  const [program, semester, studentRole] = await Promise.all([
    ProgramModel.findOne({ _id: programId, status: "active" }),
    SemesterModel.findOne({ _id: semesterId, status: { $ne: "archived" } }),
    RoleModel.findOne({ code: "student" }),
  ]);
  if (!program) throw new AppError(400, "Active program not found");
  if (!semester) throw new AppError(400, "Admission semester not found");
  if (!studentRole) throw new AppError(500, "Student role is not configured");

  let provisionedUserId: string | undefined;
  let user = input.userId
    ? await UserModel.findOne({
        _id: toObjectId(String(input.userId), "user id"),
        status: "active",
      }).select("+authVersion")
    : null;
  if (input.userId && !user) throw new AppError(400, "Active user not found");
  if (!user) {
    const internalEmail = `${studentId.toLowerCase()}@pending.unisphere.local`;
    if (await UserModel.exists({ email: internalEmail })) {
      throw new AppError(409, "A provisioned account already exists for this Student ID");
    }
    user = await UserModel.create({
      firstName: String(input.firstName),
      lastName: String(input.lastName),
      email: internalEmail,
      passwordHash: await bcrypt.hash(String(input.temporaryPassword), 12),
      roles: [studentRole._id],
      status: "active",
    });
    provisionedUserId = user._id.toString();
  } else if (await StudentModel.exists({ user: user._id })) {
    throw new AppError(409, "This user already has a student profile");
  }

  try {
    const {
      userId: _,
      firstName: __,
      lastName: ___,
      temporaryPassword: ____,
      programId: _____,
      admissionSemesterId: ______,
      admissionApplicationId,
      ...data
    } = input;
    const student = await StudentModel.create({
      ...data,
      user: user._id,
      program: programId,
      admissionSemester: semesterId,
      ...(admissionApplicationId
        ? {
            admissionApplication: toObjectId(
              String(admissionApplicationId),
              "admission application id",
            ),
          }
        : {}),
    });
    if (!user.roles.some((roleId) => roleId.equals(studentRole._id))) {
      user.roles.push(studentRole._id);
      user.authVersion += 1;
      await user.save();
    }
    return getStudent(student._id.toString());
  } catch (error) {
    if (provisionedUserId) await UserModel.findByIdAndDelete(provisionedUserId);
    throw error;
  }
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  const student = await StudentModel.findById(toObjectId(id));
  if (!student) throw new AppError(404, "Student not found");
  const user = await UserModel.findById(student.user);
  if (!user) throw new AppError(404, "Student user account not found");
  if (input.programId) {
    const program = await ProgramModel.findOne({
      _id: toObjectId(String(input.programId), "program id"),
      status: "active",
    });
    if (!program) throw new AppError(400, "Active program not found");
    student.program = program._id;
    delete input.programId;
  }
  if (input.firstName !== undefined) user.firstName = String(input.firstName);
  if (input.lastName !== undefined) user.lastName = String(input.lastName);
  if (input.email !== undefined) {
    const email = String(input.email);
    if (await UserModel.exists({ email, _id: { $ne: user._id } })) {
      throw new AppError(409, "Email already exists");
    }
    user.email = email;
    user.emailClaimedAt = new Date();
  }
  delete input.firstName;
  delete input.lastName;
  delete input.email;
  student.set(input);
  await Promise.all([student.save(), user.save()]);
  return getStudent(id);
}
