import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { AcademicBatchModel } from "../academic-batch/academicBatch.model";
import { StudentModel } from "../student/student.model";
import { CourseModel } from "../university-structure/course.model";
import { ProgramModel } from "../university-structure/program.model";
import { CurriculumModel } from "./curriculum.model";

type CoursePlanInput = { courseId: string; semesterNumber: number; required: boolean };
type CreateInput = { programId: string; code: string; name: string; effectiveYear: number; totalSemesters: number; coursePlans: CoursePlanInput[] };
const populate = [
  { path: "program", select: "name code totalSemesters department" },
  { path: "coursePlans.course", select: "code title credits courseType theoryHoursPerWeek labHoursPerWeek status" },
];

async function validatedPlans(programId: string, plans: CoursePlanInput[], totalSemesters: number) {
  if (plans.some((plan) => plan.semesterNumber > totalSemesters)) throw new AppError(400, "Course semester cannot exceed total semesters");
  const ids = plans.map((plan) => toObjectId(plan.courseId, "course id"));
  if (new Set(ids.map(String)).size !== ids.length) throw new AppError(400, "A course can appear only once in a curriculum");
  const count = await CourseModel.countDocuments({ _id: { $in: ids }, program: toObjectId(programId), status: "active" });
  if (count !== ids.length) throw new AppError(400, "Every curriculum course must be active and belong to the selected program");
  return plans.map((plan, index) => ({ course: ids[index]!, semesterNumber: plan.semesterNumber, required: plan.required }));
}

export async function listCurricula(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query); const filter: Record<string, unknown> = {};
  if (query.programId) filter.program = toObjectId(String(query.programId), "program id");
  if (query.status) filter.status = query.status;
  if (query.search) { const search = { $regex: escapeRegex(String(query.search)), $options: "i" }; filter.$or = [{ code: search }, { name: search }]; }
  const [items, total] = await Promise.all([CurriculumModel.find(filter).populate("program", "name code totalSemesters department").sort({ effectiveYear: -1, code: 1 }).skip(skip).limit(limit).lean(), CurriculumModel.countDocuments(filter)]);
  return { items, pagination: paginationMeta(total, page, limit) };
}
export async function getCurriculum(id: string) {
  let query = CurriculumModel.findById(toObjectId(id)); for (const item of populate) query = query.populate(item);
  const curriculum = await query.lean(); if (!curriculum) throw new AppError(404, "Curriculum not found"); return curriculum;
}
export async function createCurriculum(input: CreateInput) {
  const program = await ProgramModel.findOne({ _id: toObjectId(input.programId), status: "active" }).lean();
  if (!program) throw new AppError(400, "Active program not found");
  if (await CurriculumModel.exists({ program: program._id, code: input.code })) throw new AppError(409, "Curriculum code already exists in this program");
  const coursePlans = await validatedPlans(input.programId, input.coursePlans, input.totalSemesters);
  const { programId: _, ...data } = input; return CurriculumModel.create({ ...data, program: program._id, coursePlans, status: "draft" });
}
export async function updateCurriculum(id: string, input: Record<string, unknown>) {
  const curriculum = await CurriculumModel.findById(toObjectId(id)); if (!curriculum) throw new AppError(404, "Curriculum not found");
  if (curriculum.status === "archived") throw new AppError(409, "Archived curriculum cannot be changed");
  const totalSemesters = Number(input.totalSemesters ?? curriculum.totalSemesters);
  const totalChanged = totalSemesters !== curriculum.totalSemesters;
  if (totalChanged) {
    const batchIds = await AcademicBatchModel.distinct("_id", { curriculum: curriculum._id, status: { $in: ["planned", "active"] } });
    if (await AcademicBatchModel.exists({ _id: { $in: batchIds }, currentSemesterNumber: { $gt: totalSemesters } })) throw new AppError(409, "A batch is currently beyond the requested curriculum length");
    const incompatibleStudent = await StudentModel.findOne()
      .where("academicBatch").in(batchIds)
      .where("currentSemesterNumber").gt(totalSemesters)
      .where("status").equals("active")
      .select("_id").lean();
    if (incompatibleStudent) throw new AppError(409, "An active student is currently beyond the requested curriculum length");
  }
  if (input.coursePlans) curriculum.set("coursePlans", await validatedPlans(curriculum.program.toString(), input.coursePlans as CoursePlanInput[], totalSemesters));
  delete input.coursePlans;
  if (input.status === "active") {
    const planned = new Set(curriculum.coursePlans.map((plan) => plan.semesterNumber));
    const missing = Array.from({ length: totalSemesters }, (_, index) => index + 1).filter((number) => !planned.has(number));
    if (missing.length) throw new AppError(409, `Add courses to every semester before publishing. Missing: ${missing.join(", ")}`);
  }
  if (input.status === "archived" && await AcademicBatchModel.exists({ curriculum: curriculum._id, status: { $in: ["planned", "active"] } })) throw new AppError(409, "Curriculum is assigned to an active batch");
  curriculum.set(input); await curriculum.save();
  if (totalChanged) await AcademicBatchModel.updateMany({ curriculum: curriculum._id }, { $set: { totalSemesters } });
  return getCurriculum(id);
}
