import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { CourseOfferingModel } from "../course-offering/courseOffering.model";
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
  offering: Types.ObjectId,
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
    $or: [{ teacher }, { room: input.room }, { offering }],
  } as Record<string, unknown>).lean();
  if (conflict) throw new AppError(409, "Routine conflicts with the teacher, room, or section schedule");
  return { startMinutes, endMinutes };
}

export async function listRoutine(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.semesterId) filter.semester = toObjectId(String(query.semesterId), "semester id");
  if (query.offeringId) filter.offering = toObjectId(String(query.offeringId), "offering id");
  if (query.teacherId) filter.teacher = toObjectId(String(query.teacherId), "teacher id");
  if (query.dayOfWeek) filter.dayOfWeek = query.dayOfWeek;
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    RoutineSlotModel.find(filter)
      .populate({
        path: "offering",
        select: "course section deliveryMode",
        populate: { path: "course", select: "code title" },
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
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createRoutineSlot(input: SlotInput & { offeringId: string }) {
  const offering = await CourseOfferingModel.findOne({
    _id: toObjectId(input.offeringId, "offering id"),
    status: { $in: ["planned", "open", "ongoing"] },
  });
  if (!offering) throw new AppError(400, "Available course offering not found");
  const timing = await assertNoConflict(offering.semester, offering.teacher, offering._id, input);
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
    const timing = await assertNoConflict(slot.semester, slot.teacher, slot.offering, next, id);
    slot.startMinutes = timing.startMinutes;
    slot.endMinutes = timing.endMinutes;
  }
  slot.set({ ...input, ...next });
  await slot.save();
  return slot;
}
