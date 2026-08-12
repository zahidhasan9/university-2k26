import { AppError } from "../../utils/AppError";
import { toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { AcademicBatchModel } from "../academic-batch/academicBatch.model";
import { AcademicSectionModel } from "./academicSection.model";

export async function listSections(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.academicBatchId) filter.academicBatch = toObjectId(String(query.academicBatchId), "academic batch id");
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    AcademicSectionModel.find(filter).populate({ path: "academicBatch", select: "code name program department status", populate: [{ path: "program", select: "code name" }, { path: "department", select: "code name" }] }).sort({ code: 1 }).skip(skip).limit(limit).lean(),
    AcademicSectionModel.countDocuments(filter),
  ]);
  return { items: items.map((item) => ({ ...item, availableSeats: Math.max(0, item.capacity - item.enrolledCount), isFull: item.enrolledCount >= item.capacity })), pagination: paginationMeta(total, page, limit) };
}

export async function createSection(input: Record<string, unknown>) {
  const academicBatch = await AcademicBatchModel.findOne({ _id: toObjectId(String(input.academicBatchId), "academic batch id"), status: { $in: ["planned", "active"] } });
  if (!academicBatch) throw new AppError(400, "Active or planned academic batch not found");
  const exists = await AcademicSectionModel.findOne().where("academicBatch").equals(academicBatch._id).where("code").equals(input.code).select("_id").lean();
  if (exists) throw new AppError(409, "Section code already exists in this batch");
  const { academicBatchId: _, ...data } = input;
  return AcademicSectionModel.create({ ...data, academicBatch: academicBatch._id });
}

export async function updateSection(id: string, input: Record<string, unknown>) {
  const section = await AcademicSectionModel.findById(toObjectId(id));
  if (!section) throw new AppError(404, "Academic section not found");
  if (input.capacity !== undefined && Number(input.capacity) < section.enrolledCount) throw new AppError(400, `Capacity cannot be lower than ${section.enrolledCount} enrolled students`);
  if (input.status === "archived" && section.enrolledCount > 0) throw new AppError(409, "Transfer assigned students before archiving this section");
  section.set(input);
  await section.save();
  return section;
}

export async function archiveSection(id: string) {
  return updateSection(id, { status: "archived" });
}

export async function reserveSectionSeat(sectionId: string, academicBatchId: string) {
  const section = await AcademicSectionModel.findOneAndUpdate(
    { _id: toObjectId(sectionId, "academic section id"), academicBatch: toObjectId(academicBatchId, "academic batch id"), status: "active", $expr: { $lt: ["$enrolledCount", "$capacity"] } },
    { $inc: { enrolledCount: 1 } }, { new: true },
  );
  if (!section) throw new AppError(409, "Section is unavailable, full, or does not belong to the selected batch");
  return section;
}

export async function releaseSectionSeat(sectionId: unknown) {
  if (!sectionId) return;
  await AcademicSectionModel.updateOne({ _id: sectionId, enrolledCount: { $gt: 0 } }, { $inc: { enrolledCount: -1 } });
}
