import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { ExamMarkModel } from "../examination/examMark.model";
import { ExamModel } from "../examination/exam.model";
import { assertExamAccess } from "../examination/exam.service";
import { StudentModel } from "../student/student.model";
import { CourseModel } from "../university-structure/course.model";
import { CourseResultModel } from "./courseResult.model";
import { GradePolicyModel } from "./gradePolicy.model";

export async function calculateOfferingResults(
  offeringIdValue: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
) {
  const offeringId = toObjectId(offeringIdValue, "offering id");
  const offering = await assertExamAccess(offeringId, actorId, unrestricted);
  const course = await CourseModel.findById(offering.course).lean();
  if (!course) throw new AppError(404, "Course not found");
  const [policy, exams, enrollments] = await Promise.all([
    GradePolicyModel.findOne({ program: course.program, status: "active" }).lean(),
    ExamModel.find({ offering: offeringId, status: { $ne: "cancelled" } }).lean(),
    EnrollmentModel.find({ offering: offeringId, status: "enrolled" }).lean(),
  ]);
  if (await CourseResultModel.exists({ offering: offeringId, status: "published" })) {
    throw new AppError(409, "Published results cannot be recalculated");
  }
  if (!policy) throw new AppError(409, "Active grade policy is not configured for this program");
  if (!exams.length) throw new AppError(409, "No examinations are configured");
  if (exams.some((exam) => exam.status !== "completed")) {
    throw new AppError(409, "Every examination must be completed before calculation");
  }
  const totalWeight = exams.reduce((sum, exam) => sum + exam.weightPercentage, 0);
  if (Math.abs(totalWeight - 100) > 0.001) {
    throw new AppError(409, `Examination weights must total 100%; current total is ${totalWeight}%`);
  }
  if (!enrollments.length) throw new AppError(409, "No active enrollments found");

  const marks = await ExamMarkModel.find({
    exam: { $in: exams.map((exam) => exam._id) },
    student: { $in: enrollments.map((enrollment) => enrollment.student) },
  }).lean();
  if (marks.length !== exams.length * enrollments.length) {
    throw new AppError(409, "Marks are incomplete for one or more enrolled students");
  }
  const marksByKey = new Map(
    marks.map((mark) => [`${mark.exam.toString()}:${mark.student.toString()}`, mark]),
  );
  const bands = [...policy.bands].sort((a, b) => b.minPercentage - a.minPercentage);
  const now = new Date();
  const operations = enrollments.map((enrollment) => {
    const percentage = exams.reduce((sum, exam) => {
      const mark = marksByKey.get(`${exam._id.toString()}:${enrollment.student.toString()}`)!;
      return sum + (mark.marksObtained / exam.totalMarks) * exam.weightPercentage;
    }, 0);
    const rounded = Math.round(percentage * 100) / 100;
    const band = bands.find(
      (item) => rounded >= item.minPercentage && rounded <= item.maxPercentage,
    );
    if (!band) throw new AppError(500, `Grade policy cannot grade ${rounded}%`);
    return {
      updateOne: {
        filter: { enrollment: enrollment._id },
        update: {
          $set: {
            offering: offeringId,
            student: enrollment.student,
            course: offering.course,
            semester: offering.semester,
            percentage: rounded,
            letterGrade: band.letter,
            gradePoint: band.gradePoint,
            passed: band.passed,
            status: "draft",
            calculatedAt: now,
            calculatedBy: actorId,
          },
          $unset: { publishedAt: 1, publishedBy: 1 },
        },
        upsert: true,
      },
    } as const;
  });
  await CourseResultModel.bulkWrite(operations);
  return getOfferingResults(offeringIdValue);
}

export async function getOfferingResults(offeringId: string) {
  const offering = await CourseOfferingModel.findById(toObjectId(offeringId)).lean();
  if (!offering) throw new AppError(404, "Course offering not found");
  const results = await CourseResultModel.find({ offering: offering._id })
    .populate({
      path: "student",
      select: "studentId user",
      populate: { path: "user", select: "firstName lastName email" },
    })
    .populate("course", "code title credits")
    .populate("semester", "name code academicYear term")
    .sort({ percentage: -1 })
    .lean();
  return { offering, results };
}

export async function publishOfferingResults(
  offeringIdValue: string,
  actorId: Types.ObjectId,
) {
  const offeringId = toObjectId(offeringIdValue, "offering id");
  const [offering, draftResults, activeEnrollments] = await Promise.all([
    CourseOfferingModel.findById(offeringId).select("status").lean(),
    CourseResultModel.find({ offering: offeringId, status: "draft" }).lean(),
    EnrollmentModel.countDocuments({ offering: offeringId, status: "enrolled" }),
  ]);
  if (!offering || offering.status !== "completed") {
    throw new AppError(409, "Course offering must be completed before results are published");
  }
  if (!draftResults.length || draftResults.length !== activeEnrollments) {
    throw new AppError(409, "Complete draft results must exist for every active enrollment");
  }
  const now = new Date();
  await CourseResultModel.updateMany(
    { offering: offeringId, status: "draft" },
    { $set: { status: "published", publishedAt: now, publishedBy: actorId } },
  );
  await EnrollmentModel.bulkWrite(
    draftResults.map((result) => ({
      updateOne: {
        filter: { _id: result.enrollment },
        update: { $set: { status: result.passed ? "completed" : "failed" } },
      },
    })),
  );
  return getOfferingResults(offeringIdValue);
}

async function loadStudentResults(
  studentFilter: Record<string, unknown>,
  semesterId?: string,
) {
  const student = await StudentModel.findOne(studentFilter)
    .populate("user", "firstName lastName email")
    .populate("program", "name code")
    .lean();
  if (!student) throw new AppError(404, "Student profile not found");
  const filter: Record<string, unknown> = { student: student._id, status: "published" };
  if (semesterId) filter.semester = toObjectId(semesterId, "semester id");
  const results = await CourseResultModel.find(filter)
    .populate("course", "code title credits")
    .populate("semester", "name code academicYear term startsAt")
    .sort({ createdAt: 1 })
    .lean();
  return { student, results };
}

export function studentResults(userId: Types.ObjectId, semesterId?: string) {
  return loadStudentResults({ user: userId }, semesterId);
}

export function studentResultsById(studentId: string, semesterId?: string) {
  return loadStudentResults({ _id: toObjectId(studentId, "student id") }, semesterId);
}

async function buildTranscript(
  studentResultPromise: ReturnType<typeof loadStudentResults>,
) {
  const { student, results } = await studentResultPromise;
  const semesterMap = new Map<
    string,
    {
      semester: unknown;
      courses: typeof results;
      attemptedCredits: number;
      earnedCredits: number;
      qualityPoints: number;
    }
  >();
  for (const result of results) {
    const course = result.course as unknown as { credits: number };
    const semester = result.semester as unknown as { _id: Types.ObjectId };
    const key = semester._id.toString();
    const group = semesterMap.get(key) ?? {
      semester: result.semester,
      courses: [],
      attemptedCredits: 0,
      earnedCredits: 0,
      qualityPoints: 0,
    };
    group.courses.push(result);
    group.attemptedCredits += course.credits;
    if (result.passed) group.earnedCredits += course.credits;
    group.qualityPoints += result.gradePoint * course.credits;
    semesterMap.set(key, group);
  }
  const semesters = [...semesterMap.values()].map((group) => ({
    ...group,
    gpa:
      group.attemptedCredits > 0
        ? Math.round((group.qualityPoints / group.attemptedCredits) * 100) / 100
        : 0,
  }));
  const totals = semesters.reduce(
    (acc, semester) => ({
      attemptedCredits: acc.attemptedCredits + semester.attemptedCredits,
      earnedCredits: acc.earnedCredits + semester.earnedCredits,
      qualityPoints: acc.qualityPoints + semester.qualityPoints,
    }),
    { attemptedCredits: 0, earnedCredits: 0, qualityPoints: 0 },
  );
  return {
    student,
    semesters,
    summary: {
      ...totals,
      cgpa:
        totals.attemptedCredits > 0
          ? Math.round((totals.qualityPoints / totals.attemptedCredits) * 100) / 100
          : 0,
    },
  };
}

export function transcript(userId: Types.ObjectId) {
  return buildTranscript(loadStudentResults({ user: userId }));
}

export function transcriptByStudentId(studentId: string) {
  return buildTranscript(
    loadStudentResults({ _id: toObjectId(studentId, "student id") }),
  );
}
