import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
import { CourseModel } from "../university-structure/course.model";
import { ProgramModel } from "../university-structure/program.model";
import { RoutineSlotModel } from "./routineSlot.model";

function minutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours! * 60 + mins!;
}

interface SlotInput {
  dayOfWeek:
    | "saturday"
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday";
  startTime: string;
  endTime: string;
  room: string;
  effectiveFrom: Date;
  effectiveTo: Date;
}

async function assertNoConflict(
  semester: Types.ObjectId,
  teacher: Types.ObjectId,
  conflictingOfferings: Types.ObjectId[],
  input: SlotInput,
  excludedId?: string,
) {
  const startMinutes = minutes(input.startTime);
  const endMinutes = minutes(input.endTime);
  if (startMinutes >= endMinutes) throw new AppError(400, "Start time must be before end time");
  const conflict = await RoutineSlotModel.findOne({
    ...(excludedId ? { _id: { $ne: toObjectId(excludedId) } } : {}),
    semester,
    dayOfWeek: input.dayOfWeek,
    status: "active",
    effectiveFrom: { $lte: input.effectiveTo },
    effectiveTo: { $gte: input.effectiveFrom },
    startMinutes: { $lt: endMinutes },
    endMinutes: { $gt: startMinutes },
    $or: [{ teacher }, { room: input.room }, { offering: { $in: conflictingOfferings } }],
  } as Record<string, unknown>).lean();
  if (conflict) throw new AppError(409, "Routine conflicts with the teacher, room, or section schedule");
  return { startMinutes, endMinutes };
}

export async function listRoutine(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.offeringId) {
    filter.offering = toObjectId(String(query.offeringId), "offering id");
  } else if (query.programId || query.departmentId || query.batch || query.section) {
    const offeringFilter: Record<string, unknown> = {};
    if (query.batch) offeringFilter.batch = String(query.batch);
    if (query.section) offeringFilter.section = String(query.section).toUpperCase();
    if (query.programId || query.departmentId) {
      const courseFilter: Record<string, unknown> = {};
      if (query.programId) {
        courseFilter.program = toObjectId(String(query.programId), "program id");
      } else {
        const programIds = await ProgramModel.distinct("_id", {
          department: toObjectId(String(query.departmentId), "department id"),
        });
        courseFilter.program = { $in: programIds };
      }
      offeringFilter.course = { $in: await CourseModel.distinct("_id", courseFilter) };
    }
    filter.offering = { $in: await CourseOfferingModel.distinct("_id", offeringFilter) };
  }
  if (query.teacherId) filter.teacher = toObjectId(String(query.teacherId), "teacher id");
  if (query.dayOfWeek) filter.dayOfWeek = query.dayOfWeek;
  if (query.room) filter.room = String(query.room).toUpperCase();
  if (query.status) filter.status = query.status;
  const [items, total, batches, sections, rooms] = await Promise.all([
    RoutineSlotModel.find(filter)
      .populate({
        path: "offering",
        select: "course batch section deliveryMode",
        populate: {
          path: "course",
          select: "code title program",
          populate: {
            path: "program",
            select: "name code department",
            populate: { path: "department", select: "name code" },
          },
        },
      })
      .populate({
        path: "teacher",
        select: "employeeId user",
        populate: { path: "user", select: "firstName lastName" },
      })
      .populate("semester", "name code academicYear")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RoutineSlotModel.countDocuments(filter),
    CourseOfferingModel.distinct("batch", { batch: { $ne: "" } }),
    CourseOfferingModel.distinct("section", { section: { $ne: "" } }),
    RoutineSlotModel.distinct("room", { status: "active" }),
  ]);
  return {
    items,
    filters: {
      batches: batches.sort((a, b) => a.localeCompare(b)),
      sections: sections.sort((a, b) => a.localeCompare(b)),
      rooms: rooms.sort((a, b) => a.localeCompare(b)),
    },
    pagination: paginationMeta(total, page, limit),
  };
}

export async function createRoutineSlot(input: SlotInput & { offeringId: string }) {
  const offering = await CourseOfferingModel.findOne({
    _id: toObjectId(input.offeringId, "offering id"),
    status: { $in: ["planned", "open", "ongoing"] },
  });
  if (!offering) throw new AppError(400, "Available course offering not found");
  const offeringBatch = offering.batch ?? "Unassigned";
  const conflictingOfferings = (await CourseOfferingModel.distinct("_id", {
    semester: offering.semester,
    batch: offeringBatch === "Unassigned" ? { $in: ["Unassigned", null] } : offeringBatch,
    section: offering.section,
  })) as Types.ObjectId[];
  const timing = await assertNoConflict(
    offering.semester,
    offering.teacher,
    conflictingOfferings,
    input,
  );
  const { offeringId: _, ...data } = input;
  return RoutineSlotModel.create({
    ...data,
    ...timing,
    offering: offering._id,
    semester: offering.semester,
    teacher: offering.teacher,
  });
}

export async function updateRoutineSlot(
  id: string,
  input: Partial<SlotInput> & { status?: "active" | "cancelled" },
) {
  const slot = await RoutineSlotModel.findById(toObjectId(id)).select("+startMinutes +endMinutes");
  if (!slot) throw new AppError(404, "Routine slot not found");
  const next: SlotInput = {
    dayOfWeek: input.dayOfWeek ?? slot.dayOfWeek,
    startTime: input.startTime ?? slot.startTime,
    endTime: input.endTime ?? slot.endTime,
    room: input.room ?? slot.room,
    effectiveFrom: input.effectiveFrom ?? slot.effectiveFrom,
    effectiveTo: input.effectiveTo ?? slot.effectiveTo,
  };
  if (next.effectiveFrom > next.effectiveTo) throw new AppError(400, "Effective date range is invalid");
  if (input.status !== "cancelled") {
    const offering = await CourseOfferingModel.findById(slot.offering).select("batch section").lean();
    if (!offering) throw new AppError(400, "Course offering not found");
    const offeringBatch = offering.batch ?? "Unassigned";
    const conflictingOfferings = (await CourseOfferingModel.distinct("_id", {
      semester: slot.semester,
      batch: offeringBatch === "Unassigned" ? { $in: ["Unassigned", null] } : offeringBatch,
      section: offering.section,
    })) as Types.ObjectId[];
    const timing = await assertNoConflict(
      slot.semester,
      slot.teacher,
      conflictingOfferings,
      next,
      id,
    );
    slot.startMinutes = timing.startMinutes;
    slot.endMinutes = timing.endMinutes;
  }
  slot.set({ ...input, ...next });
  await slot.save();
  return slot;
}
