import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { ProgramModel } from "../university-structure/program.model";
import { CurriculumModel } from "../curriculum/curriculum.model";
import { AcademicBatchModel } from "./academicBatch.model";
type BatchCreateInput = {
  departmentId: string; programId: string; code: string; name: string;
  admissionYear: number; curriculumId: string; currentSemesterNumber: number;
};

export async function listBatches(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.departmentId) filter.department = toObjectId(String(query.departmentId), "department id");
  if (query.programId) filter.program = toObjectId(String(query.programId), "program id");
  if (query.status) filter.status = query.status;
  if (query.search) {
    const search = { $regex: escapeRegex(String(query.search)), $options: "i" };
    filter.$or = [{ code: search }, { name: search }, { curriculumVersion: search }];
  }
  const [items, total] = await Promise.all([
    AcademicBatchModel.find(filter).populate("department", "name code").populate("program", "name code totalSemesters").populate("curriculum", "name code effectiveYear totalSemesters status").sort({ admissionYear: -1, code: 1 }).skip(skip).limit(limit).lean(),
    AcademicBatchModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createBatch(input: BatchCreateInput) {
  const departmentId = toObjectId(input.departmentId);
  const programId = toObjectId(input.programId);
  const curriculumId = toObjectId(input.curriculumId, "curriculum id");
  const [program, curriculum] = await Promise.all([ProgramModel.findOne({ _id: programId, status: "active" }).lean(), CurriculumModel.findOne({ _id: curriculumId, program: programId, status: "active" }).lean()]);
  if (!program || !program.department.equals(departmentId)) throw new AppError(400, "Program does not belong to the selected department");
  if (!curriculum) throw new AppError(400, "Active curriculum does not belong to the selected program");
  if (input.currentSemesterNumber > curriculum.totalSemesters) throw new AppError(400, "Current semester cannot exceed curriculum semesters");
  if (await AcademicBatchModel.exists({ program: program._id, code: input.code })) throw new AppError(409, "Batch code already exists in this program");
  const { departmentId: _departmentId, programId: _programId, curriculumId: _curriculumId, ...data } = input;
  return AcademicBatchModel.create({ ...data, department: departmentId, program: programId, curriculum: curriculum._id, curriculumVersion: curriculum.code, totalSemesters: curriculum.totalSemesters });
}

export async function updateBatch(id: string, input: Record<string, unknown>) {
  const batch = await AcademicBatchModel.findById(toObjectId(id));
  if (!batch) throw new AppError(404, "Academic batch not found");
  if (input.curriculumId) {
    const curriculum = await CurriculumModel.findOne({ _id: toObjectId(String(input.curriculumId), "curriculum id"), program: batch.program, status: "active" });
    if (!curriculum) throw new AppError(400, "Active curriculum does not belong to the batch program");
    batch.curriculum = curriculum._id; batch.curriculumVersion = curriculum.code; batch.totalSemesters = curriculum.totalSemesters; delete input.curriculumId;
  }
  const total = batch.totalSemesters;
  const current = Number(input.currentSemesterNumber ?? batch.currentSemesterNumber);
  if (current > total) throw new AppError(400, "Current semester cannot exceed total semesters");
  batch.set(input); await batch.save(); return batch;
}

export async function archiveBatch(id: string) {
  const batch = await AcademicBatchModel.findById(toObjectId(id));
  if (!batch) throw new AppError(404, "Academic batch not found");
  if (batch.status === "archived") return batch;
  batch.status = "archived";
  await batch.save();
  return batch;
}
