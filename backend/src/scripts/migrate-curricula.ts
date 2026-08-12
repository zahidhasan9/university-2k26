import { connectDatabase, disconnectDatabase } from "../config/database";
import { AcademicBatchModel } from "../modules/academic-batch/academicBatch.model";
import { CurriculumModel } from "../modules/curriculum/curriculum.model";
import { CourseModel } from "../modules/university-structure/course.model";
import { ProgramModel } from "../modules/university-structure/program.model";

async function migrateCurricula() {
  await connectDatabase();
  const programs = await ProgramModel.find({ status: "active" });
  let migrated = 0;
  for (const program of programs) {
    const courses = await CourseModel.find({ program: program._id, status: "active" }).sort({ semesterNumber: 1, code: 1 });
    const curriculum = await CurriculumModel.findOneAndUpdate(
      { program: program._id, code: "2026-V1" },
      { $set: { name: `${program.name} Curriculum 2026`, effectiveYear: 2026, totalSemesters: program.totalSemesters, coursePlans: courses.map((course) => ({ course: course._id, semesterNumber: course.semesterNumber, required: true })), status: "active" } },
      { upsert: true, new: true },
    );
    await AcademicBatchModel.updateMany(
      { program: program._id },
      { $set: { curriculum: curriculum._id, curriculumVersion: curriculum.code, totalSemesters: curriculum.totalSemesters } },
    );
    migrated += 1;
  }
  console.info(`Migrated ${migrated} programs to canonical curricula.`);
}
void migrateCurricula().catch((error) => { console.error("Curriculum migration failed", error); process.exitCode = 1; }).finally(disconnectDatabase);
