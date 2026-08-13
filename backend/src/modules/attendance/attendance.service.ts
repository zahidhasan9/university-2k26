import { createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { EnrollmentModel } from "../enrollment/enrollment.model";
import { StudentModel } from "../student/student.model";
import { TeacherModel } from "../teacher/teacher.model";
import { RoutineSlotModel } from "../routine/routineSlot.model";
import { AttendanceRecordModel } from "./attendanceRecord.model";
import { AttendanceSessionModel } from "./attendanceSession.model";

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function assertOfferingAccess(
  offeringId: Types.ObjectId,
  actorId: Types.ObjectId,
  unrestricted: boolean,
  requireActive = true,
) {
  const offering = await CourseOfferingModel.findOne({
    _id: offeringId,
    ...(requireActive ? { status: { $in: ["open", "ongoing"] } } : {}),
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

async function managedOfferingIds(
  actorId: Types.ObjectId,
  unrestricted: boolean,
): Promise<Types.ObjectId[] | undefined> {
  if (unrestricted) return undefined;
  const teacher = await TeacherModel.findOne({ user: actorId, status: "active" }).select("_id").lean();
  if (!teacher) return [];
  const ids = await CourseOfferingModel.distinct("_id", { teacher: teacher._id });
  return ids as Types.ObjectId[];
}

export async function attendanceOptions(actorId: Types.ObjectId, unrestricted: boolean) {
  const ids = await managedOfferingIds(actorId, unrestricted);
  const offeringFilter: Record<string, unknown> = { status: { $in: ["open", "ongoing"] } };
  if (ids) offeringFilter._id = { $in: ids };
  const offerings = await CourseOfferingModel.find(offeringFilter)
    .select("course section batch academicBatch teacher semester deliveryMode")
    .populate("course", "code title")
    .populate("semester", "name academicYear")
    .populate({ path: "teacher", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } })
    .sort({ batch: 1, section: 1 })
    .lean();
  const routines = await RoutineSlotModel.find({ offering: { $in: offerings.map((item) => item._id) }, status: "active" })
    .select("offering dayOfWeek startTime endTime room effectiveFrom effectiveTo")
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();
  return { offerings, routines };
}

export async function listSessions(query: Record<string, unknown>, actorId: Types.ObjectId, unrestricted: boolean) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  const ids = await managedOfferingIds(actorId, unrestricted);
  if (ids) filter.offering = { $in: ids };
  if (query.offeringId) {
    const offeringId = toObjectId(String(query.offeringId), "offering id");
    filter.offering = ids && !ids.some((id) => id.equals(offeringId)) ? { $in: [] } : offeringId;
  }
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    AttendanceSessionModel.find(filter)
      .populate({
        path: "offering",
        select: "course section teacher semester batch",
        populate: [
          { path: "course", select: "code title" },
          { path: "teacher", select: "employeeId user", populate: { path: "user", select: "firstName lastName" } },
        ],
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
  input: {
    offeringId: string;
    startsAt: Date;
    endsAt: Date;
    classType: "lecture" | "lab" | "tutorial" | "seminar" | "exam" | "other";
    room?: string;
    routineSlotId?: string;
    topic?: string;
  },
) {
  const offeringId = toObjectId(input.offeringId, "offering id");
  await assertOfferingAccess(offeringId, actorId, unrestricted);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const routineSlotId = input.routineSlotId;
  if (routineSlotId && !await RoutineSlotModel.exists({ _id: toObjectId(routineSlotId), offering: offeringId, status: "active" })) {
    throw new AppError(400, "Active routine slot does not belong to this course offering");
  }
  if (await AttendanceSessionModel.exists({ offering: offeringId, date: { $lt: endsAt }, endsAt: { $gt: startsAt }, status: { $ne: "cancelled" } })) {
    throw new AppError(409, "This class overlaps another attendance session for the course");
  }
  const sessionNumber = await AttendanceSessionModel.countDocuments({ offering: offeringId }) + 1;
  return AttendanceSessionModel.create({
    offering: offeringId,
    date: startsAt,
    endsAt,
    sessionNumber,
    classType: input.classType,
    room: input.room,
    routineSlot: routineSlotId ? toObjectId(routineSlotId) : undefined,
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
    status: "present" | "absent" | "late" | "excused" | "invalid";
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
  const existing = await AttendanceRecordModel.find({
    session: session._id,
    student: { $in: studentIds },
  });
  const documents = new Map(existing.map((item) => [item.student.toString(), item]));
  await Promise.all(records.map(async (record) => {
    const studentId = toObjectId(record.studentId);
    const attendance = documents.get(record.studentId) ?? new AttendanceRecordModel({
      session: session._id,
      offering: session.offering,
      student: studentId,
      status: record.status,
      markedBy: actorId,
    });
    const previousStatus = attendance.isNew ? undefined : attendance.status;
    attendance.set({
      status: record.status,
      note: record.note,
      markedBy: actorId,
      markedAt: new Date(),
      source: "manual",
    });
    attendance.correctionHistory.push({
      previousStatus,
      nextStatus: record.status,
      changedBy: actorId,
      changedAt: new Date(),
      note: record.note,
    });
    await attendance.save();
  }));
  return getSessionRecords(sessionId);
}

export async function getSessionRecords(
  sessionId: string,
  actorId?: Types.ObjectId,
  unrestricted = false,
) {
  const session = await AttendanceSessionModel.findById(toObjectId(sessionId))
    .populate("offering", "course section semester teacher")
    .lean();
  if (!session) throw new AppError(404, "Attendance session not found");
  const populatedOffering = session.offering as unknown as { _id: Types.ObjectId };
  if (actorId) await assertOfferingAccess(populatedOffering._id, actorId, unrestricted, false);
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
  session.checkInStatus = "closed";
  session.checkInClosedAt ??= new Date();
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
  const now = new Date();
  if (now < session.date) throw new AppError(409, "Self check-in cannot open before the class starts");
  if (now >= session.endsAt) throw new AppError(409, "Self check-in cannot open after the class ends");
  const token = randomBytes(32).toString("base64url");
  session.checkInStatus = "open";
  session.checkInOpenedAt = new Date();
  session.checkInClosedAt = undefined;
  session.qrTokenHash = tokenHash(token);
  session.qrExpiresAt = new Date(Math.min(Date.now() + expiresInMinutes * 60_000, session.endsAt.getTime()));
  await session.save();
  return { token, expiresAt: session.qrExpiresAt };
}

export async function closeCheckIn(sessionId: string, actorId: Types.ObjectId, unrestricted: boolean) {
  const session = await AttendanceSessionModel.findOne({ _id: toObjectId(sessionId), status: "open" }).select("+qrTokenHash +qrExpiresAt");
  if (!session) throw new AppError(409, "Open class session not found");
  await assertOfferingAccess(session.offering, actorId, unrestricted);
  session.checkInStatus = "closed";
  session.checkInClosedAt = new Date();
  session.qrTokenHash = undefined;
  session.qrExpiresAt = undefined;
  await session.save();
  return session;
}

export async function qrCheckIn(userId: Types.ObjectId, sessionId: string, token: string, evidence: { ip?: string; deviceId?: string }) {
  const session = await AttendanceSessionModel.findOne({
    _id: toObjectId(sessionId),
    status: "open",
  }).select("+qrTokenHash +qrExpiresAt");
  if (
    !session ||
    session.checkInStatus !== "open" || !session.qrTokenHash ||
    !session.qrExpiresAt ||
    session.qrExpiresAt <= new Date() ||
    session.endsAt <= new Date() ||
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
  const ipHash = evidence.ip ? tokenHash(evidence.ip) : undefined;
  const deviceHash = evidence.deviceId ? tokenHash(evidence.deviceId) : undefined;
  const reasons: string[] = [];
  if (deviceHash && await AttendanceRecordModel.exists({ session: session._id, student: { $ne: student._id }, "evidence.deviceHash": deviceHash })) reasons.push("Device already used by another student in this class");
  if (!deviceHash && ipHash && await AttendanceRecordModel.countDocuments({ session: session._id, student: { $ne: student._id }, "evidence.ipHash": ipHash }) >= 3) reasons.push("Multiple check-ins from the same network without device evidence");
  const repeatOffenceCount = reasons.length ? await AttendanceRecordModel.countDocuments({ student: student._id, suspicious: true }) : 0;
  await AttendanceRecordModel.updateOne(
    { session: session._id, student: student._id },
    {
      $set: {
        offering: session.offering,
        status: "present",
        markedBy: userId,
        markedAt: new Date(),
        source: "qr",
        evidence: { ipHash, deviceHash, checkedInAt: new Date() },
        suspicious: reasons.length > 0,
        suspicionReasons: reasons,
        repeatOffenceCount,
      },
    },
    { upsert: true },
  );
  return { suspicious: reasons.length > 0, reasons, repeatOffenceCount };
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
  const courseMap = new Map<string, { offeringId: string; courseCode: string; courseTitle: string; total: number; attended: number; present: number; late: number; excused: number; absent: number; invalid: number }>();
  for (const item of records) {
    const session = item.session as unknown as { offering: { _id: Types.ObjectId; course: { code: string; title: string } } };
    const key = session.offering._id.toString();
    const current = courseMap.get(key) ?? { offeringId: key, courseCode: session.offering.course.code, courseTitle: session.offering.course.title, total: 0, attended: 0, present: 0, late: 0, excused: 0, absent: 0, invalid: 0 };
    current.total += 1;
    current[item.status as "present" | "late" | "excused" | "absent" | "invalid"] += 1;
    if (item.status === "present" || item.status === "late") current.attended += 1;
    courseMap.set(key, current);
  }
  const byCourse = [...courseMap.values()].map((item) => {
    const countedClasses = item.total - item.excused - item.invalid;
    const percentage = countedClasses
      ? Math.round((item.attended / countedClasses) * 1000) / 10
      : 0;
    return {
      ...item,
      countedClasses,
      percentage,
      belowRequirement: countedClasses > 0 && percentage < 75,
    };
  });
  return { records, summary: { total: records.length, ...totals }, byCourse, minimumRequiredPercentage: 75 };
}
