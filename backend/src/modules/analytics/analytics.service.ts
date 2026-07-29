import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { AttendanceRecordModel } from "../attendance/attendanceRecord.model";
import { AttendanceSessionModel } from "../attendance/attendanceSession.model";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { ExamModel } from "../examination/exam.model";
import { InvoiceModel } from "../finance/invoice.model";
import { PaymentModel } from "../finance/payment.model";
import { LmsAssignmentModel } from "../lms/assignment.model";
import { AdmissionModel } from "../admission/admission.model";
import { ResearchProjectModel } from "../research/researchProject.model";
import { ThesisModel } from "../research/thesis.model";
import { CourseResultModel } from "../result/courseResult.model";
import { StudentModel } from "../student/student.model";
import { TeacherModel } from "../teacher/teacher.model";
import { DepartmentModel } from "../university-structure/department.model";

function dateRange(query: Record<string, unknown>) {
  const to = query.to ? new Date(String(query.to)) : new Date();
  const from = query.from
    ? new Date(String(query.from))
    : new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new AppError(400, "Invalid analytics date range");
  }
  return { from, to };
}

export async function adminDashboard(query: Record<string, unknown>) {
  const { from, to } = dateRange(query);
  const [
    studentStatus,
    teacherStatus,
    admissionStatus,
    revenue,
    invoices,
    attendance,
    researchStatus,
    departmentCount,
    admissionTrend,
    revenueTrend,
  ] = await Promise.all([
    StudentModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    TeacherModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    AdmissionModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    PaymentModel.aggregate([
      { $match: { status: "completed", paidAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$currency", amountMinor: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
    ]),
    InvoiceModel.aggregate([
      { $match: { status: { $ne: "void" } } },
      {
        $group: {
          _id: "$currency",
          billedMinor: { $sum: "$totalMinor" },
          paidMinor: { $sum: "$paidMinor" },
          dueMinor: { $sum: "$dueMinor" },
        },
      },
    ]),
    AttendanceRecordModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ResearchProjectModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    DepartmentModel.countDocuments({ status: "active" }),
    AdmissionModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          applications: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    PaymentModel.aggregate([
      { $match: { status: "completed", paidAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            year: { $year: "$paidAt" },
            month: { $month: "$paidAt" },
            currency: "$currency",
          },
          amountMinor: { $sum: "$amountMinor" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);
  return {
    period: { from, to },
    students: studentStatus,
    teachers: teacherStatus,
    admissions: admissionStatus,
    finance: { revenue, invoices },
    attendance,
    research: researchStatus,
    activeDepartments: departmentCount,
    trends: { admissions: admissionTrend, revenue: revenueTrend },
  };
}

export async function departmentPerformance() {
  return DepartmentModel.aggregate([
    { $match: { status: "active" } },
    {
      $lookup: {
        from: "programs",
        localField: "_id",
        foreignField: "department",
        as: "programs",
      },
    },
    {
      $lookup: {
        from: "teachers",
        localField: "_id",
        foreignField: "department",
        as: "teachers",
      },
    },
    {
      $lookup: {
        from: "students",
        let: { programIds: "$programs._id" },
        pipeline: [{ $match: { $expr: { $in: ["$program", "$$programIds"] } } }],
        as: "students",
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        programCount: { $size: "$programs" },
        teacherCount: { $size: "$teachers" },
        studentCount: { $size: "$students" },
        activeStudentCount: {
          $size: {
            $filter: {
              input: "$students",
              as: "student",
              cond: { $eq: ["$$student.status", "active"] },
            },
          },
        },
      },
    },
    { $sort: { studentCount: -1 } },
  ]);
}

export async function teacherDashboard(userId: Types.ObjectId) {
  const teacher = await TeacherModel.findOne({ user: userId })
    .populate("user", "firstName lastName email")
    .populate("department", "name code")
    .lean();
  if (!teacher) throw new AppError(404, "Teacher profile not found");
  const offerings = await CourseOfferingModel.find({
    teacher: teacher._id,
    status: { $in: ["open", "ongoing"] },
  })
    .populate("course", "code title credits")
    .populate("semester", "name code academicYear")
    .lean();
  const offeringIds = offerings.map((offering) => offering._id);
  const [enrollmentCounts, exams, assignments, attendanceSessions, theses] = await Promise.all([
    EnrollmentModel.aggregate([
      { $match: { offering: { $in: offeringIds }, status: "enrolled" } },
      { $group: { _id: "$offering", count: { $sum: 1 } } },
    ]),
    ExamModel.countDocuments({
      offering: { $in: offeringIds },
      status: { $in: ["scheduled", "ongoing"] },
    }),
    LmsAssignmentModel.countDocuments({ offering: { $in: offeringIds }, published: true }),
    AttendanceSessionModel.countDocuments({
      offering: { $in: offeringIds },
      status: { $in: ["open", "closed"] },
    }),
    ThesisModel.countDocuments({
      supervisor: teacher._id,
      status: { $nin: ["completed", "rejected"] },
    }),
  ]);
  const countMap = new Map(enrollmentCounts.map((item) => [item._id.toString(), item.count]));
  return {
    teacher,
    offerings: offerings.map((offering) => ({
      ...offering,
      enrolledStudents: countMap.get(offering._id.toString()) ?? 0,
    })),
    summary: {
      activeOfferings: offerings.length,
      upcomingExams: exams,
      publishedAssignments: assignments,
      attendanceSessions,
      activeThesisSupervisions: theses,
    },
  };
}

export async function studentDashboard(userId: Types.ObjectId) {
  const student = await StudentModel.findOne({ user: userId })
    .populate("user", "firstName lastName email")
    .populate("program", "name code")
    .lean();
  if (!student) throw new AppError(404, "Student profile not found");
  const [enrollments, attendance, results, invoices] = await Promise.all([
    EnrollmentModel.find({ student: student._id, status: "enrolled" })
      .populate("course", "code title credits")
      .populate("semester", "name code academicYear")
      .populate("offering", "section deliveryMode")
      .lean(),
    AttendanceRecordModel.aggregate([
      { $match: { student: student._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    CourseResultModel.find({ student: student._id, status: "published" })
      .populate("course", "code title credits")
      .populate("semester", "name code academicYear")
      .sort({ createdAt: -1 })
      .lean(),
    InvoiceModel.aggregate([
      { $match: { student: student._id, status: { $ne: "void" } } },
      {
        $group: {
          _id: "$currency",
          billedMinor: { $sum: "$totalMinor" },
          paidMinor: { $sum: "$paidMinor" },
          dueMinor: { $sum: "$dueMinor" },
        },
      },
    ]),
  ]);
  const totalAttendance = attendance.reduce((sum, item) => sum + item.count, 0);
  const present = attendance
    .filter((item) => ["present", "late"].includes(item._id))
    .reduce((sum, item) => sum + item.count, 0);
  const resultCredits = results.reduce(
    (acc, result) => {
      const course = result.course as unknown as { credits: number };
      acc.credits += course.credits;
      acc.qualityPoints += result.gradePoint * course.credits;
      return acc;
    },
    { credits: 0, qualityPoints: 0 },
  );
  return {
    student,
    currentEnrollments: enrollments,
    attendance: {
      breakdown: attendance,
      percentage: totalAttendance ? Math.round((present / totalAttendance) * 10_000) / 100 : 0,
    },
    recentResults: results.slice(0, 10),
    cgpa: resultCredits.credits
      ? Math.round((resultCredits.qualityPoints / resultCredits.credits) * 100) / 100
      : 0,
    finance: invoices,
  };
}
