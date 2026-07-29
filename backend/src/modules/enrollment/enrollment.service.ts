import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { SemesterModel } from "../semester/semester.model";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { StudentModel } from "../student/student.model";
import { CourseModel } from "../university-structure/course.model";
import { EnrollmentModel } from "./enrollment.model";

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
