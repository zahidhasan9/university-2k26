import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { AcademicBatchModel } from "../academic-batch/academicBatch.model";
import { releaseSectionSeat, reserveSectionSeat } from "../academic-section/academicSection.service";
import { RoleModel } from "../role/role.model";
import { SemesterModel } from "../semester/semester.model";
import { ProgramModel } from "../university-structure/program.model";
import { UserModel } from "../user/user.model";
import { StudentModel } from "./student.model";

export async function listStudents(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.programId) {
    filter.program = toObjectId(String(query.programId), "program id");
  } else if (query.departmentId) {
    const programIds = await ProgramModel.distinct("_id", {
      department: toObjectId(String(query.departmentId), "department id"),
    });
    filter.program = { $in: programIds };
  }
  if (query.batch) filter.batch = String(query.batch);
  if (query.academicBatchId) filter.academicBatch = toObjectId(String(query.academicBatchId), "academic batch id");
  if (query.academicSectionId) filter.academicSection = toObjectId(String(query.academicSectionId), "academic section id");
  if (query.section) filter.section = String(query.section).trim();
  if (query.status) filter.status = query.status;
  if (query.search) {
    const search = { $regex: escapeRegex(String(query.search).trim()), $options: "i" };
    const matchingUserIds = await UserModel.distinct("_id", {
      $or: [{ firstName: search }, { lastName: search }, { email: search }],
    });
    filter.$or = [{ studentId: search }, { user: { $in: matchingUserIds } }];
  }
  const filterScope = { ...filter };
  delete filterScope.section;
  delete filterScope.$or;
  const [items, total, batches, sections] = await Promise.all([
    StudentModel.find(filter)
      .populate("user", "firstName lastName email status")
      .populate({
        path: "program",
        select: "name code department",
        populate: { path: "department", select: "name code" },
      })
      .populate("admissionSemester", "name code academicYear")
      .populate("academicBatch", "code name admissionYear curriculumVersion status")
      .populate("academicSection", "code name capacity enrolledCount shift homeRoom status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentModel.countDocuments(filter),
    StudentModel.distinct("batch", { batch: { $ne: "" } }),
    StudentModel.distinct("section", { ...filterScope, section: { $ne: "" } }),
  ]);
  return {
    items,
    filters: { batches: batches.sort((a, b) => a.localeCompare(b)), sections: sections.sort((a, b) => a.localeCompare(b)) },
    pagination: paginationMeta(total, page, limit),
  };
}

export async function getStudent(id: string) {
  const student = await StudentModel.findById(toObjectId(id))
    .populate("user", "firstName lastName email status")
    .populate({ path: "program", select: "name code department", populate: { path: "department", select: "name code" } })
    .populate("admissionSemester", "name code academicYear")
    .populate("academicBatch", "code name admissionYear curriculumVersion status")
    .populate("academicSection", "code name capacity enrolledCount shift homeRoom status")
    .lean();
  if (!student) throw new AppError(404, "Student not found");
  return student;
}

export async function getStudentByUser(userId: string) {
  const student = await StudentModel.findOne({ user: toObjectId(userId, "user id") })
    .populate("user", "firstName lastName email status")
    .populate({ path: "program", select: "name code department", populate: { path: "department", select: "name code" } })
    .populate("admissionSemester", "name code academicYear")
    .populate("academicBatch", "code name admissionYear curriculumVersion status")
    .populate("academicSection", "code name capacity enrolledCount shift homeRoom status")
    .lean();
  if (!student) throw new AppError(404, "Student profile not found");
  return student;
}

export async function createStudent(input: Record<string, unknown>) {
  const studentId = String(input.studentId);
  const programId = toObjectId(String(input.programId), "program id");
  const semesterId = toObjectId(String(input.admissionSemesterId), "semester id");
  const academicBatchId = toObjectId(String(input.academicBatchId), "academic batch id");
  const academicSectionId = String(input.academicSectionId);
  if (await StudentModel.exists({ studentId })) {
    throw new AppError(409, "Student ID already exists");
  }
  const [program, semester, academicBatch, studentRole] = await Promise.all([
    ProgramModel.findOne({ _id: programId, status: "active" }),
    SemesterModel.findOne({ _id: semesterId, status: { $ne: "archived" } }),
    AcademicBatchModel.findOne({ _id: academicBatchId, status: "active" }),
    RoleModel.findOne({ code: "student" }),
  ]);
  if (!program) throw new AppError(400, "Active program not found");
  if (!semester) throw new AppError(400, "Admission semester not found");
  if (!academicBatch || !academicBatch.program.equals(programId)) {
    throw new AppError(400, "Active academic batch does not belong to the selected program");
  }
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

  let academicSection;
  try {
    academicSection = await reserveSectionSeat(academicSectionId, academicBatchId.toString());
    const {
      userId: _,
      firstName: __,
      lastName: ___,
      temporaryPassword: ____,
      programId: _____,
      admissionSemesterId: ______,
      academicBatchId: _______,
      academicSectionId: ________,
      admissionApplicationId,
      ...data
    } = input;
    const student = await StudentModel.create({
      ...data,
      user: user._id,
      program: programId,
      admissionSemester: semesterId,
      academicBatch: academicBatch._id,
      academicSection: academicSection._id,
      batch: academicBatch.code,
      section: academicSection.code,
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
    await releaseSectionSeat(academicSection?._id);
    if (provisionedUserId) await UserModel.findByIdAndDelete(provisionedUserId);
    throw error;
  }
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  const student = await StudentModel.findById(toObjectId(id));
  if (!student) throw new AppError(404, "Student not found");
  const user = await UserModel.findById(student.user);
  if (!user) throw new AppError(404, "Student user account not found");
  const requestedProgramId = input.programId
    ? toObjectId(String(input.programId), "program id")
    : student.program;
  if (input.programId && !input.academicBatchId) {
    throw new AppError(400, "Academic batch is required when changing program");
  }
  if (input.academicBatchId && !input.academicSectionId) {
    throw new AppError(400, "Academic section is required when changing batch");
  }
  if (input.programId) {
    const program = await ProgramModel.findOne({
      _id: requestedProgramId,
      status: "active",
    });
    if (!program) throw new AppError(400, "Active program not found");
    student.program = program._id;
    delete input.programId;
  }
  if (input.academicBatchId) {
    const academicBatch = await AcademicBatchModel.findOne({
      _id: toObjectId(String(input.academicBatchId), "academic batch id"),
      program: requestedProgramId,
      status: "active",
    });
    if (!academicBatch) {
      throw new AppError(400, "Active academic batch does not belong to the selected program");
    }
    student.academicBatch = academicBatch._id;
    student.batch = academicBatch.code;
    delete input.academicBatchId;
  }
  if (input.academicSectionId) {
    if (student.academicSection?.toString() === String(input.academicSectionId)) {
      delete input.academicSectionId;
    } else {
    const previousSection = student.academicSection;
    const target = await reserveSectionSeat(String(input.academicSectionId), student.academicBatch.toString());
    student.academicSection = target._id;
    student.section = target.code;
    delete input.academicSectionId;
    await releaseSectionSeat(previousSection);
    }
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

export async function transferStudentSection(id: string, academicSectionId: string, reason: string | undefined, actorId: unknown) {
  const student = await StudentModel.findById(toObjectId(id));
  if (!student) throw new AppError(404, "Student not found");
  if (student.status !== "active") throw new AppError(409, "Only active students can be transferred");
  if (student.academicSection?.toString() === academicSectionId) throw new AppError(400, "Student is already assigned to this section");
  const previousSection = student.academicSection;
  const target = await reserveSectionSeat(academicSectionId, student.academicBatch.toString());
  try {
    student.academicSection = target._id;
    student.section = target.code;
    student.sectionTransfers.push({
      ...(previousSection ? { fromSection: previousSection } : {}),
      toSection: target._id,
      ...(reason ? { reason } : {}),
      transferredBy: toObjectId(String(actorId), "actor id"),
      transferredAt: new Date(),
    });
    await student.save();
    await releaseSectionSeat(previousSection);
    return getStudent(id);
  } catch (error) {
    await releaseSectionSeat(target._id);
    throw error;
  }
}
