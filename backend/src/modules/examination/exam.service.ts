import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { TeacherModel } from "../teacher/teacher.model";
import { ExamMarkModel } from "./examMark.model";
import { ExamModel } from "./exam.model";

function minutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours! * 60 + mins!;
}

async function teacherForUser(userId: Types.ObjectId) {
  return TeacherModel.findOne({ user: userId, status: "active" }).select("_id").lean();
}

export async function assertExamAccess(
  offeringId: Types.ObjectId,
  actorId: Types.ObjectId,
  unrestricted: boolean,
) {
  const offering = await CourseOfferingModel.findById(offeringId);
  if (!offering) throw new AppError(404, "Course offering not found");
  if (!unrestricted) {
    const teacher = await teacherForUser(actorId);
    if (!teacher || !offering.teacher.equals(teacher._id)) {
      throw new AppError(403, "Only the assigned teacher can manage this examination");
    }
  }
  return offering;
}

async function validateWeight(offeringId: Types.ObjectId, weight: number, excludedId?: string) {
  const exams = await ExamModel.find({
    offering: offeringId,
    status: { $ne: "cancelled" },
    ...(excludedId ? { _id: { $ne: toObjectId(excludedId) } } : {}),
  })
    .select("weightPercentage")
    .lean();
  const total = exams.reduce((sum, exam) => sum + exam.weightPercentage, 0) + weight;
  if (total > 100.0001) throw new AppError(409, "Total examination weight cannot exceed 100%");
}

async function validateSchedule(
  input: { examDate: Date; startTime: string; endTime: string; room?: string },
  offeringId: Types.ObjectId,
  excludedId?: string,
) {
  const examDate = new Date(input.examDate);
  examDate.setUTCHours(0, 0, 0, 0);
  const startMinutes = minutes(input.startTime);
  const endMinutes = minutes(input.endTime);
  if (startMinutes >= endMinutes) throw new AppError(400, "Start time must be before end time");
  const conflicts: Array<Record<string, unknown>> = [{ offering: offeringId }];
  if (input.room) conflicts.push({ room: input.room });
  const conflict = await ExamModel.findOne({
    ...(excludedId ? { _id: { $ne: toObjectId(excludedId) } } : {}),
    examDate,
    status: { $ne: "cancelled" },
    startMinutes: { $lt: endMinutes },
    endMinutes: { $gt: startMinutes },
    $or: conflicts,
  } as Record<string, unknown>).lean();
  if (conflict) throw new AppError(409, "Exam conflicts with an existing room or offering schedule");
  return { examDate, startMinutes, endMinutes };
}

export async function listExams(
  query: Record<string, unknown>,
  actorId: Types.ObjectId,
  unrestricted: boolean,
) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.offeringId) filter.offering = toObjectId(String(query.offeringId), "offering id");
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.status) filter.status = query.status;
  if (!unrestricted) {
    const teacher = await teacherForUser(actorId);
    if (!teacher) throw new AppError(403, "Teacher profile required");
    const offeringIds = (await CourseOfferingModel.distinct("_id", {
      teacher: teacher._id,
    })) as Types.ObjectId[];
    filter.offering = query.offeringId
      ? { $in: offeringIds.filter((id) => id.equals(toObjectId(String(query.offeringId)))) }
      : { $in: offeringIds };
  }
  const [items, total] = await Promise.all([
    ExamModel.find(filter)
      .populate({
        path: "offering",
        select: "course section teacher",
        populate: { path: "course", select: "code title" },
      })
      .populate("semester", "name code academicYear")
      .sort({ examDate: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ExamModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createExam(
  actorId: Types.ObjectId,
  unrestricted: boolean,
  input: {
    offeringId: string;
    title: string;
    type: "quiz" | "class_test" | "midterm" | "final" | "practical" | "assignment" | "viva";
    examDate: Date;
    startTime: string;
    endTime: string;
    room?: string;
    totalMarks: number;
    weightPercentage: number;
  },
) {
  const offeringId = toObjectId(input.offeringId, "offering id");
  const offering = await assertExamAccess(offeringId, actorId, unrestricted);
  await validateWeight(offeringId, input.weightPercentage);
  const schedule = await validateSchedule(input, offeringId);
  const { offeringId: _, ...data } = input;
  return ExamModel.create({
    ...data,
    ...schedule,
    offering: offeringId,
    semester: offering.semester,
    createdBy: actorId,
  });
}

export async function getExam(
  id: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
) {
  const exam = await ExamModel.findById(toObjectId(id))
    .populate({
      path: "offering",
      select: "course section teacher semester",
      populate: { path: "course", select: "code title" },
    })
    .populate("semester", "name code academicYear")
    .lean();
  if (!exam) throw new AppError(404, "Exam not found");
  const offering = exam.offering as unknown as { _id: Types.ObjectId };
  await assertExamAccess(offering._id, actorId, unrestricted);
  return exam;
}

export async function updateExam(
  id: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
  input: Record<string, unknown>,
) {
  const exam = await ExamModel.findById(toObjectId(id)).select("+startMinutes +endMinutes");
  if (!exam) throw new AppError(404, "Exam not found");
  await assertExamAccess(exam.offering, actorId, unrestricted);
  if (input.status && input.status !== exam.status) {
    const transitions: Record<string, string[]> = {
      scheduled: ["ongoing", "cancelled"],
      ongoing: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };
    if (!transitions[exam.status]?.includes(String(input.status))) {
      throw new AppError(409, `Cannot move examination from ${exam.status} to ${input.status}`);
    }
  }
  if (input.totalMarks && Number(input.totalMarks) < exam.totalMarks) {
    const invalidMark = await ExamMarkModel.exists({
      exam: exam._id,
      marksObtained: { $gt: Number(input.totalMarks) },
    });
    if (invalidMark) throw new AppError(409, "New total marks is below an entered mark");
  }
  await validateWeight(
    exam.offering,
    Number(input.weightPercentage ?? exam.weightPercentage),
    id,
  );
  const schedule = await validateSchedule(
    {
      examDate: (input.examDate as Date | undefined) ?? exam.examDate,
      startTime: String(input.startTime ?? exam.startTime),
      endTime: String(input.endTime ?? exam.endTime),
      room: (input.room as string | undefined) ?? exam.room ?? undefined,
    },
    exam.offering,
    id,
  );
  exam.set({ ...input, ...schedule });
  await exam.save();
  return exam;
}

export async function enterMarks(
  examId: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
  marks: Array<{
    studentId: string;
    marksObtained: number;
    absent: boolean;
    note?: string;
  }>,
) {
  const exam = await ExamModel.findOne({
    _id: toObjectId(examId),
    status: { $ne: "cancelled" },
  });
  if (!exam) throw new AppError(404, "Available exam not found");
  await assertExamAccess(exam.offering, actorId, unrestricted);
  const studentIds = [...new Set(marks.map((item) => item.studentId))].map((id) =>
    toObjectId(id, "student id"),
  );
  if (studentIds.length !== marks.length) throw new AppError(400, "Duplicate students in marks data");
  if (marks.some((item) => item.marksObtained > exam.totalMarks)) {
    throw new AppError(400, "Marks obtained cannot exceed total marks");
  }
  const enrolledCount = await EnrollmentModel.countDocuments({
    offering: exam.offering,
    student: { $in: studentIds },
    status: { $in: ["enrolled", "completed", "failed"] },
  });
  if (enrolledCount !== studentIds.length) {
    throw new AppError(400, "Marks can only be entered for enrolled students");
  }
  await ExamMarkModel.bulkWrite(
    marks.map((item) => ({
      updateOne: {
        filter: { exam: exam._id, student: toObjectId(item.studentId) },
        update: {
          $set: {
            offering: exam.offering,
            marksObtained: item.marksObtained,
            absent: item.absent,
            note: item.note,
            enteredBy: actorId,
          },
        },
        upsert: true,
      },
    })),
  );
  return listExamMarks(examId);
}

export async function listExamMarks(examId: string) {
  const exam = await ExamModel.findById(toObjectId(examId)).lean();
  if (!exam) throw new AppError(404, "Exam not found");
  const marks = await ExamMarkModel.find({ exam: exam._id })
    .populate({
      path: "student",
      select: "studentId user",
      populate: { path: "user", select: "firstName lastName" },
    })
    .sort({ createdAt: 1 })
    .lean();
  return { exam, marks };
}
