import { createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { StudentModel } from "../student/student.model";
import { TeacherModel } from "../teacher/teacher.model";
import { AttendanceRecordModel } from "./attendanceRecord.model";
import { AttendanceSessionModel } from "./attendanceSession.model";

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function assertOfferingAccess(
  offeringId: Types.ObjectId,
  actorId: Types.ObjectId,
  unrestricted: boolean,
) {
  const offering = await CourseOfferingModel.findOne({
    _id: offeringId,
    status: { $in: ["open", "ongoing"] },
  });
  if (!offering) throw new AppError(400, "Active course offering not found");
  if (!unrestricted) {
    const teacher = await TeacherModel.findOne({ user: actorId, status: "active" }).select("_id").lean();
    if (!teacher || !offering.teacher.equals(teacher._id)) {
      throw new AppError(403, "Only the assigned teacher can manage this attendance");
    }
  }
  return offering;
}

export async function listSessions(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.offeringId) filter.offering = toObjectId(String(query.offeringId), "offering id");
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    AttendanceSessionModel.find(filter)
      .populate({
        path: "offering",
        select: "course section teacher semester",
        populate: { path: "course", select: "code title" },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AttendanceSessionModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createSession(
  actorId: Types.ObjectId,
  unrestricted: boolean,
  input: { offeringId: string; date: Date; topic?: string },
) {
  const offeringId = toObjectId(input.offeringId, "offering id");
  await assertOfferingAccess(offeringId, actorId, unrestricted);
  const date = new Date(input.date);
  date.setUTCHours(0, 0, 0, 0);
  if (await AttendanceSessionModel.exists({ offering: offeringId, date })) {
    throw new AppError(409, "Attendance session already exists for this offering and date");
  }
  return AttendanceSessionModel.create({
    offering: offeringId,
    date,
    topic: input.topic,
    createdBy: actorId,
  });
}

export async function markAttendance(
  sessionId: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
  records: Array<{
    studentId: string;
    status: "present" | "absent" | "late" | "excused";
    note?: string;
  }>,
) {
  const session = await AttendanceSessionModel.findOne({
    _id: toObjectId(sessionId),
    status: "open",
  });
  if (!session) throw new AppError(409, "Open attendance session not found");
  await assertOfferingAccess(session.offering, actorId, unrestricted);
  const studentIds = [...new Set(records.map((record) => record.studentId))].map((id) =>
    toObjectId(id, "student id"),
  );
  if (studentIds.length !== records.length) throw new AppError(400, "Duplicate students in attendance data");
  const enrolledCount = await EnrollmentModel.countDocuments({
    offering: session.offering,
    student: { $in: studentIds },
    status: "enrolled",
  });
  if (enrolledCount !== studentIds.length) {
    throw new AppError(400, "Every attendance record must belong to an enrolled student");
  }
  await AttendanceRecordModel.bulkWrite(
    records.map((record) => ({
      updateOne: {
        filter: { session: session._id, student: toObjectId(record.studentId) },
        update: {
          $set: {
            offering: session.offering,
            status: record.status,
            note: record.note,
            markedBy: actorId,
            markedAt: new Date(),
            source: "manual",
          },
        },
        upsert: true,
      },
    })),
  );
  return getSessionRecords(sessionId);
}

export async function getSessionRecords(sessionId: string) {
  const session = await AttendanceSessionModel.findById(toObjectId(sessionId))
    .populate("offering", "course section semester teacher")
    .lean();
  if (!session) throw new AppError(404, "Attendance session not found");
  const records = await AttendanceRecordModel.find({ session: session._id })
    .populate({
      path: "student",
      select: "studentId user",
      populate: { path: "user", select: "firstName lastName email" },
    })
    .sort({ createdAt: 1 })
    .lean();
  return { session, records };
}

export async function closeSession(
  sessionId: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
) {
  const session = await AttendanceSessionModel.findOne({
    _id: toObjectId(sessionId),
    status: "open",
  });
  if (!session) throw new AppError(409, "Open attendance session not found");
  await assertOfferingAccess(session.offering, actorId, unrestricted);

  const [enrollments, markedStudentIds] = await Promise.all([
    EnrollmentModel.find({ offering: session.offering, status: "enrolled" }).select("student").lean(),
    AttendanceRecordModel.distinct("student", { session: session._id }),
  ]);
  const marked = new Set(markedStudentIds.map((id) => id.toString()));
  const absent = enrollments.filter((item) => !marked.has(item.student.toString()));
  if (absent.length) {
    await AttendanceRecordModel.insertMany(
      absent.map((item) => ({
        session: session._id,
        offering: session.offering,
        student: item.student,
        status: "absent",
        markedBy: actorId,
        source: "manual",
      })),
    );
  }
  session.status = "closed";
  session.qrTokenHash = undefined;
  session.qrExpiresAt = undefined;
  await session.save();
  return getSessionRecords(sessionId);
}

export async function generateQrToken(
  sessionId: string,
  actorId: Types.ObjectId,
  unrestricted: boolean,
  expiresInMinutes: number,
) {
  const session = await AttendanceSessionModel.findOne({
    _id: toObjectId(sessionId),
    status: "open",
  }).select("+qrTokenHash +qrExpiresAt");
  if (!session) throw new AppError(409, "Open attendance session not found");
  await assertOfferingAccess(session.offering, actorId, unrestricted);
  const token = randomBytes(32).toString("base64url");
  session.qrTokenHash = tokenHash(token);
  session.qrExpiresAt = new Date(Date.now() + expiresInMinutes * 60_000);
  await session.save();
  return { token, expiresAt: session.qrExpiresAt };
}

export async function qrCheckIn(userId: Types.ObjectId, sessionId: string, token: string) {
  const session = await AttendanceSessionModel.findOne({
    _id: toObjectId(sessionId),
    status: "open",
  }).select("+qrTokenHash +qrExpiresAt");
  if (
    !session ||
    !session.qrTokenHash ||
    !session.qrExpiresAt ||
    session.qrExpiresAt <= new Date() ||
    session.qrTokenHash !== tokenHash(token)
  ) {
    throw new AppError(401, "QR attendance token is invalid or expired");
  }
  const student = await StudentModel.findOne({ user: userId, status: "active" }).select("_id").lean();
  if (!student) throw new AppError(404, "Active student profile not found");
  if (
    !(await EnrollmentModel.exists({
      student: student._id,
      offering: session.offering,
      status: "enrolled",
    }))
  ) {
    throw new AppError(403, "Student is not enrolled in this course offering");
  }
  await AttendanceRecordModel.updateOne(
    { session: session._id, student: student._id },
    {
      $set: {
        offering: session.offering,
        status: "present",
        markedBy: userId,
        markedAt: new Date(),
        source: "qr",
      },
    },
    { upsert: true },
  );
}

export async function studentAttendance(userId: Types.ObjectId, query: Record<string, unknown>) {
  const student = await StudentModel.findOne({ user: userId }).select("_id").lean();
  if (!student) throw new AppError(404, "Student profile not found");
  const filter: Record<string, unknown> = { student: student._id };
  if (query.offeringId) filter.offering = toObjectId(String(query.offeringId), "offering id");
  const records = await AttendanceRecordModel.find(filter)
    .populate({
      path: "session",
      select: "date topic status offering",
      populate: { path: "offering", select: "course section", populate: { path: "course", select: "code title" } },
    })
    .sort({ createdAt: -1 })
    .lean();
  const totals = records.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
  return { records, summary: { total: records.length, ...totals } };
}
