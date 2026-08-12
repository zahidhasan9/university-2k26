import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { AcademicBatchModel } from "../modules/academic-batch/academicBatch.model";
import { CurriculumModel } from "../modules/curriculum/curriculum.model";
import { AdmissionModel } from "../modules/admission/admission.model";
import { AttendanceRecordModel } from "../modules/attendance/attendanceRecord.model";
import { AttendanceSessionModel } from "../modules/attendance/attendanceSession.model";
import { CourseOfferingModel } from "../modules/course-offering/courseOffering.model";
import { EnrollmentModel } from "../modules/enrollment/enrollment.model";
import { ExamMarkModel } from "../modules/examination/examMark.model";
import { ExamModel } from "../modules/examination/exam.model";
import { LmsAssignmentModel } from "../modules/lms/assignment.model";
import { CourseMaterialModel } from "../modules/lms/courseMaterial.model";
import { DiscussionPostModel } from "../modules/lms/discussionPost.model";
import { CourseResultModel } from "../modules/result/courseResult.model";
import { RoutineSlotModel } from "../modules/routine/routineSlot.model";
import { RoleModel } from "../modules/role/role.model";
import { SemesterModel } from "../modules/semester/semester.model";
import { StudentModel } from "../modules/student/student.model";
import { CourseModel } from "../modules/university-structure/course.model";
import { DepartmentModel } from "../modules/university-structure/department.model";
import { FacultyModel } from "../modules/university-structure/faculty.model";
import { ProgramModel } from "../modules/university-structure/program.model";
import { UniversityModel } from "../modules/university-structure/university.model";
import { UserModel } from "../modules/user/user.model";

const password = "Student@2026";

const departments = [
  {
    facultyCode: "FSE",
    facultyName: "Faculty of Science and Engineering",
    code: "CSE",
    name: "Department of Computer Science and Engineering",
    programCode: "BSC-CSE",
    programName: "BSc in Computer Science and Engineering",
    credits: 148,
    batchCodes: ["CSE-47", "CSE-48"],
    courses: [
      ["CSE-1101", "Introduction to Computing", 3, "core", 3, 0],
      ["CSE-1102", "Structured Programming", 3, "core", 3, 0],
      ["CSE-1103", "Structured Programming Laboratory", 1.5, "lab", 0, 3],
      ["MAT-1101", "Calculus and Analytical Geometry", 3, "general", 3, 0],
    ],
  },
  {
    facultyCode: "FBS",
    facultyName: "Faculty of Business Studies",
    code: "BBA",
    name: "Department of Business Administration",
    programCode: "BBA",
    programName: "Bachelor of Business Administration",
    credits: 126,
    batchCodes: ["BBA-35", "BBA-36"],
    courses: [
      ["BBA-1101", "Principles of Management", 3, "core", 3, 0],
      ["BBA-1102", "Financial Accounting", 3, "core", 3, 0],
      ["ECO-1101", "Principles of Microeconomics", 3, "general", 3, 0],
      ["BUS-1101", "Business Communication", 3, "core", 3, 0],
    ],
  },
  {
    facultyCode: "FLA",
    facultyName: "Faculty of Law and Social Sciences",
    code: "LAW",
    name: "Department of Law",
    programCode: "LLB-HONS",
    programName: "Bachelor of Laws (Honours)",
    credits: 144,
    batchCodes: ["LAW-21", "LAW-22"],
    courses: [
      ["LAW-1101", "Legal System of Bangladesh", 3, "core", 3, 0],
      ["LAW-1102", "Law of Contract", 3, "core", 3, 0],
      ["LAW-1103", "Constitutional Law", 3, "core", 3, 0],
      ["LAW-1104", "Legal Research and Writing", 3, "core", 3, 0],
    ],
  },
  {
    facultyCode: "FAD",
    facultyName: "Faculty of Architecture and Design",
    code: "ARCH",
    name: "Department of Architecture",
    programCode: "BARCH",
    programName: "Bachelor of Architecture",
    credits: 170,
    batchCodes: ["ARCH-15", "ARCH-16"],
    courses: [
      ["ARCH-1101", "Architectural Design Studio I", 6, "core", 0, 9],
      ["ARCH-1102", "Architectural Graphics", 3, "lab", 0, 6],
      ["ARCH-1103", "History of Architecture I", 3, "core", 3, 0],
      ["ARCH-1104", "Building Materials", 3, "core", 3, 0],
    ],
  },
  {
    facultyCode: "FSE",
    facultyName: "Faculty of Science and Engineering",
    code: "CE",
    name: "Department of Civil Engineering",
    programCode: "BSC-CE",
    programName: "BSc in Civil Engineering",
    credits: 160,
    batchCodes: ["CE-31", "CE-32"],
    courses: [
      ["CE-1101", "Engineering Mechanics", 3, "core", 3, 0],
      ["CE-1102", "Engineering Drawing", 1.5, "lab", 0, 3],
      ["CE-1103", "Civil Engineering Materials", 3, "core", 3, 0],
      ["MAT-1102", "Differential Equations", 3, "general", 3, 0],
    ],
  },
] as const;

const studentNames = [
  ["Ayan", "Rahman"],
  ["Nusrat", "Jahan"],
  ["Tahmid", "Hasan"],
] as const;

async function clearPreviousData() {
  const studentRole = await RoleModel.findOne({ code: "student" }).select("_id").lean();
  if (!studentRole) throw new Error("Student role is missing. Run npm run seed:bootstrap first.");
  const studentUserIds = await UserModel.distinct("_id", { roles: studentRole._id });
  await Promise.all([
    AttendanceRecordModel.deleteMany({}),
    AttendanceSessionModel.deleteMany({}),
    ExamMarkModel.deleteMany({}),
    ExamModel.deleteMany({}),
    CourseResultModel.deleteMany({}),
    EnrollmentModel.deleteMany({}),
    LmsAssignmentModel.deleteMany({}),
    CourseMaterialModel.deleteMany({}),
    DiscussionPostModel.deleteMany({}),
    RoutineSlotModel.deleteMany({}),
    CourseOfferingModel.deleteMany({}),
    AdmissionModel.deleteMany({}),
    StudentModel.deleteMany({}),
    AcademicBatchModel.deleteMany({}),
    CurriculumModel.deleteMany({}),
    CourseModel.deleteMany({}),
    ProgramModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    FacultyModel.deleteMany({}),
    SemesterModel.deleteMany({}),
    UniversityModel.deleteMany({}),
  ]);
  await UserModel.deleteMany({ _id: { $in: studentUserIds } });
}

async function seedAcademicData() {
  await connectDatabase();
  await clearPreviousData();

  const studentRole = await RoleModel.findOne({ code: "student" }).select("_id").lean();
  if (!studentRole) throw new Error("Student role is missing. Run npm run seed:bootstrap first.");
  const passwordHash = await bcrypt.hash(password, 12);

  const university = await UniversityModel.create({
    name: "UniSphere University",
    shortName: "UniSphere",
    code: "USU",
    email: "info@unisphere.edu.bd",
    phone: "+880255000000",
    website: "https://unisphere.edu.bd",
    address: { line1: "University Avenue", city: "Dhaka", state: "Dhaka", country: "Bangladesh", postalCode: "1207" },
    status: "active",
  });
  const semester = await SemesterModel.create({
    university: university._id,
    name: "Fall 2026",
    code: "FALL-2026",
    academicYear: "2026-2027",
    term: "fall",
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
    endsAt: new Date("2027-01-15T00:00:00.000Z"),
    registrationStartsAt: new Date("2026-08-15T00:00:00.000Z"),
    registrationEndsAt: new Date("2026-09-07T00:00:00.000Z"),
    status: "planned",
  });

  const faculties = new Map<string, mongoose.Types.ObjectId>();
  let studentSequence = 1;
  for (const specification of departments) {
    let facultyId = faculties.get(specification.facultyCode);
    if (!facultyId) {
      const faculty = await FacultyModel.create({ university: university._id, code: specification.facultyCode, name: specification.facultyName, status: "active" });
      facultyId = faculty._id;
      faculties.set(specification.facultyCode, facultyId);
    }
    const department = await DepartmentModel.create({ faculty: facultyId, code: specification.code, name: specification.name, status: "active" });
    const program = await ProgramModel.create({
      department: department._id,
      code: specification.programCode,
      name: specification.programName,
      degreeType: "bachelor",
      durationYears: specification.code === "ARCH" ? 5 : 4,
      totalCredits: specification.credits,
      totalSemesters: specification.code === "ARCH" ? 10 : 8,
      status: "active",
    });
    const batches = await AcademicBatchModel.insertMany(
      specification.batchCodes.map((code, index) => ({
        department: department._id,
        program: program._id,
        code,
        name: `${code} Academic Batch`,
        admissionYear: 2026 - index,
        curriculumVersion: index === 0 ? "2026-v1" : "2025-v1",
        totalSemesters: specification.code === "ARCH" ? 10 : 8,
        currentSemesterNumber: index + 1,
        status: "active",
      })),
    );
    const createdCourses = await CourseModel.insertMany(
      specification.courses.map(([code, title, credits, courseType, theoryHoursPerWeek, labHoursPerWeek]) => ({
        program: program._id,
        code,
        title,
        credits,
        courseType,
        semesterNumber: 1,
        theoryHoursPerWeek,
        labHoursPerWeek,
        prerequisites: [],
        status: "active",
      })),
    );
    const curriculum = await CurriculumModel.create({ program: program._id, code: "2026-V1", name: `${specification.programName} Curriculum 2026`, effectiveYear: 2026, totalSemesters: program.totalSemesters, coursePlans: createdCourses.map((course) => ({ course: course._id, semesterNumber: course.semesterNumber, required: true })), status: "active" });
    await AcademicBatchModel.updateMany({ program: program._id }, { $set: { curriculum: curriculum._id, curriculumVersion: curriculum.code, totalSemesters: curriculum.totalSemesters } });
    for (let index = 0; index < studentNames.length; index += 1) {
      const [firstName, lastName] = studentNames[index]!;
      const serial = String(studentSequence).padStart(3, "0");
      const email = `${specification.code.toLowerCase()}.student${index + 1}@unisphere.edu.bd`;
      const user = await UserModel.create({ firstName, lastName, email, passwordHash, roles: [studentRole._id], status: "active", phone: `+880170000${serial}` });
      const batch = batches[index === 2 ? 1 : 0]!;
      await StudentModel.create({
        user: user._id,
        studentId: `${specification.code}-2026-${serial}`,
        program: program._id,
        admissionSemester: semester._id,
        academicBatch: batch._id,
        batch: batch.code,
        section: index === 2 ? "B" : "A",
        currentSemesterNumber: batch.currentSemesterNumber,
        status: "active",
        phone: user.phone,
      });
      studentSequence += 1;
    }
  }

  console.info("Clean academic data inserted: 5 departments, 10 batches, 20 courses, 15 students.");
  console.info(`Student password: ${password}`);
}

void seedAcademicData()
  .catch((error) => {
    console.error("Academic reset seed failed", error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
