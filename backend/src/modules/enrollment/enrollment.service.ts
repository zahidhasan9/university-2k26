import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { SemesterModel } from "../semester/semester.model";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { StudentModel } from "../student/student.model";
import { CourseModel } from "../university-structure/course.model";
import { EnrollmentModel } from "./enrollment.model";
import type { Types } from "mongoose";
import { createInvoice } from "../finance/finance.service";

const enrollmentPopulate = [
  { path: "student", select: "studentId user program status", populate: { path: "user", select: "firstName lastName email" } },
  { path: "course", select: "code title credits courseType program" },
  { path: "offering", select: "section teacher capacity deliveryMode status" },
  { path: "semester", select: "name code academicYear term status" },
];

export async function listEnrollments(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.studentId) filter.student = toObjectId(String(query.studentId), "student id");
  if (query.offeringId) filter.offering = toObjectId(String(query.offeringId), "offering id");
  if (query.courseId) filter.course = toObjectId(String(query.courseId), "course id");
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.status) filter.status = query.status;
  let findQuery = EnrollmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  for (const item of enrollmentPopulate) findQuery = findQuery.populate(item);
  const [items, total] = await Promise.all([findQuery.lean(), EnrollmentModel.countDocuments(filter)]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function listEnrollmentsByUser(userId: string, query: Record<string, unknown>) {
  const student = await StudentModel.findOne({ user: toObjectId(userId, "user id") }).select("_id").lean();
  if (!student) throw new AppError(404, "Student profile not found");
  return listEnrollments({ ...query, studentId: student._id.toString() });
}

export async function getEnrollment(id: string) {
  let query = EnrollmentModel.findById(toObjectId(id));
  for (const item of enrollmentPopulate) query = query.populate(item);
  const enrollment = await query.lean();
  if (!enrollment) throw new AppError(404, "Enrollment not found");
  return enrollment;
}

export async function createEnrollment(input: {
  studentId: string;
  offeringId: string;
}) {
  const studentId = toObjectId(input.studentId, "student id");
  const offeringId = toObjectId(input.offeringId, "offering id");
  const [student, offering] = await Promise.all([
    StudentModel.findOne({ _id: studentId, status: "active" }),
    CourseOfferingModel.findOne({ _id: offeringId, status: "open" }),
  ]);
  if (!student) throw new AppError(400, "Active student not found");
  if (!offering) throw new AppError(400, "Course offering is not open for enrollment");
  const [course, semester, enrolledCount] = await Promise.all([
    CourseModel.findOne({ _id: offering.course, status: "active" }),
    SemesterModel.findOne({ _id: offering.semester, status: { $in: ["registration", "ongoing"] } }),
    EnrollmentModel.countDocuments({ offering: offeringId, status: "enrolled" }),
  ]);
  if (!course) throw new AppError(400, "Active course not found");
  if (!semester) throw new AppError(400, "Semester is not open for enrollment");
  if (enrolledCount >= offering.capacity) throw new AppError(409, "Course offering has reached capacity");
  if (!student.program.equals(course.program)) {
    throw new AppError(400, "Course does not belong to the student's program");
  }
  if (await EnrollmentModel.exists({ student: studentId, offering: offeringId })) {
    throw new AppError(409, "Student is already enrolled in this course offering");
  }
  if (course.prerequisites.length) {
    const completedCount = await EnrollmentModel.countDocuments({
      student: studentId,
      course: { $in: course.prerequisites },
      status: "completed",
    });
    if (completedCount !== course.prerequisites.length) {
      throw new AppError(409, "Student has not completed all course prerequisites");
    }
  }
  const enrollment = await EnrollmentModel.create({
    student: studentId,
    offering: offeringId,
    course: offering.course,
    semester: offering.semester,
  });
  return getEnrollment(enrollment._id.toString());
}

export async function dropEnrollment(id: string, reason: string) {
  const enrollment = await EnrollmentModel.findOne({ _id: toObjectId(id), status: "enrolled" });
  if (!enrollment) throw new AppError(409, "Only an active enrollment can be dropped");
  enrollment.status = "dropped";
  enrollment.droppedAt = new Date();
  enrollment.dropReason = reason;
  await enrollment.save();
  return getEnrollment(id);
}

export async function registrationOptions(userId: Types.ObjectId) {
  const student = await StudentModel.findOne({ user: userId, status: "active" }).lean();
  if (!student) throw new AppError(404, "Active student profile not found");
  const semesters = await SemesterModel.find({ status: "registration" }).select("_id name code academicYear registrationEndsAt").lean();
  const semesterIds = semesters.map((semester) => semester._id);
  const offerings = await CourseOfferingModel.find({
    semester: { $in: semesterIds },
    status: "open",
  })
    .populate({
      path: "course",
      match: { program: student.program, semesterNumber: student.currentSemesterNumber, status: "active" },
      select: "code title credits courseType semesterNumber theoryHoursPerWeek labHoursPerWeek prerequisites",
    })
    .populate("semester", "name code academicYear registrationEndsAt")
    .populate({ path: "teacher", select: "user", populate: { path: "user", select: "firstName lastName" } })
    .lean();
  const existing = await EnrollmentModel.find({ student: student._id, semester: { $in: semesterIds } }).select("offering").lean();
  const existingIds = new Set(existing.map((item) => item.offering.toString()));
  return {
    student: { studentId: student.studentId, batch: student.batch, currentSemesterNumber: student.currentSemesterNumber },
    offerings: offerings.filter((item) => item.course && !existingIds.has(item._id.toString())),
  };
}

export async function selfRegister(userId: Types.ObjectId, offeringIdValues: string[]) {
  const student = await StudentModel.findOne({ user: userId, status: "active" });
  if (!student) throw new AppError(404, "Active student profile not found");
  const offeringIds = [...new Set(offeringIdValues)].map((id) => toObjectId(id, "offering id"));
  const offerings = await CourseOfferingModel.find({ _id: { $in: offeringIds }, status: "open" });
  if (offerings.length !== offeringIds.length) throw new AppError(400, "One or more course offerings are not open");
  const semesterIds = new Set(offerings.map((item) => item.semester.toString()));
  if (semesterIds.size !== 1) throw new AppError(400, "All selected courses must belong to the same semester");
  const semester = await SemesterModel.findOne({ _id: offerings[0]!.semester, status: "registration" });
  if (!semester || new Date() < semester.registrationStartsAt || new Date() > semester.registrationEndsAt) {
    throw new AppError(409, "Semester registration is not currently open");
  }
  const courses = await CourseModel.find({ _id: { $in: offerings.map((item) => item.course) }, status: "active" });
  if (courses.length !== offerings.length || courses.some((course) =>
    !course.program.equals(student.program) || course.semesterNumber !== student.currentSemesterNumber
  )) throw new AppError(400, "Selected courses are outside the student's curriculum semester");
  if (await EnrollmentModel.exists({ student: student._id, offering: { $in: offeringIds } })) {
    throw new AppError(409, "One or more selected courses are already registered");
  }
  for (const offering of offerings) {
    const enrolledCount = await EnrollmentModel.countDocuments({ offering: offering._id, status: "enrolled" });
    if (enrolledCount >= offering.capacity) throw new AppError(409, "A selected course has reached capacity");
  }
  const prerequisiteIds = [...new Set(courses.flatMap((course) => course.prerequisites.map(String)))];
  if (prerequisiteIds.length) {
    const completed = await EnrollmentModel.countDocuments({ student: student._id, course: { $in: prerequisiteIds }, status: "completed" });
    if (completed !== prerequisiteIds.length) throw new AppError(409, "Course prerequisites have not been completed");
  }
  const enrollments = await EnrollmentModel.insertMany(offerings.map((offering) => ({
    student: student._id,
    offering: offering._id,
    course: offering.course,
    semester: offering.semester,
  })));
  try {
    const invoice = await createInvoice(userId, {
      studentId: student._id.toString(),
      semesterId: semester._id.toString(),
      selectedOptionalItemCodes: [],
      discountMinor: 0,
      dueDate: semester.registrationEndsAt,
      allowRegistrationUpdate: true,
    });
    return { enrollments, invoice };
  } catch (error) {
    await EnrollmentModel.deleteMany({ _id: { $in: enrollments.map((item) => item._id) } });
    throw error;
  }
}
