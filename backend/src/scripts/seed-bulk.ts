import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { CourseOfferingModel } from "../modules/course-offering/courseOffering.model";
import { EnrollmentModel } from "../modules/enrollment/enrollment.model";
import { EmployeeModel } from "../modules/hr/employee.model";
import { RoleModel } from "../modules/role/role.model";
import { RoutineSlotModel } from "../modules/routine/routineSlot.model";
import { SemesterModel } from "../modules/semester/semester.model";
import { StudentModel } from "../modules/student/student.model";
import { TeacherModel } from "../modules/teacher/teacher.model";
import { CourseModel } from "../modules/university-structure/course.model";
import { DepartmentModel } from "../modules/university-structure/department.model";
import { ProgramModel } from "../modules/university-structure/program.model";
import { UniversityModel } from "../modules/university-structure/university.model";
import { UserModel } from "../modules/user/user.model";

const password = "DemoUser@2026";
const firstNames = ["Ayaan", "Nusrat", "Tanvir", "Mehjabin", "Rafi", "Sadia", "Fahim", "Tasnim", "Nabil", "Afsana"];
const lastNames = ["Rahman", "Ahmed", "Islam", "Hossain", "Akter", "Khan", "Sultana", "Karim", "Hasan", "Jahan"];
const batches = ["2023", "2024", "2025", "2026"];
const sections = ["A", "B", "C", "D"];
const teacherDesignations = [
  "lecturer",
  "assistant_professor",
  "associate_professor",
  "professor",
] as const;
const officeRoles = [
  "university_admin",
  "registrar",
  "department_head",
  "accountant",
  "librarian",
  "hr_manager",
  "admission_officer",
] as const;

function person(index: number) {
  return {
    firstName: firstNames[index % firstNames.length]!,
    lastName: lastNames[Math.floor(index / firstNames.length) % lastNames.length]!,
  };
}

async function seedBulk() {
  await connectDatabase();
  await CourseOfferingModel.syncIndexes();
  const passwordHash = await bcrypt.hash(password, 12);
  const roles = await RoleModel.find({}).lean();
  const roleId = (code: string) => {
    const role = roles.find((item) => item.code === code);
    if (!role) throw new Error(`Role ${code} is missing. Run seed:bootstrap first.`);
    return role._id;
  };

  const university = await UniversityModel.findOne({ code: "UNI26" });
  const semester = await SemesterModel.findOne({ code: "FALL-2026" });
  const programs = await ProgramModel.find({ code: { $in: ["BSC-CSE", "BSC-EEE", "BBA"] } }).sort({ code: 1 });
  const departments = await DepartmentModel.find({ code: { $in: ["CSE", "EEE", "BBA"] } }).sort({ code: 1 });
  const courses = await CourseModel.find({ program: { $in: programs.map((item) => item._id) }, status: "active" }).sort({ code: 1 });
  if (!university || !semester || programs.length < 3 || departments.length < 3 || !courses.length) {
    throw new Error("Demo academic structure is missing. Run seed:demo first.");
  }

  await UserModel.bulkWrite(
    Array.from({ length: 30 }, (_, index) => {
      const name = person(index);
      return {
        updateOne: {
          filter: { email: `teacher${String(index + 1).padStart(2, "0")}@demo.unisphere.edu.bd` },
          update: {
            $set: { ...name, roles: [roleId("teacher")], status: "active", phone: `+8801710${String(index).padStart(6, "0")}` },
            $setOnInsert: { passwordHash },
          },
          upsert: true,
        },
      };
    }),
  );
  const teacherUsers = await UserModel.find({ email: /teacher\d{2}@demo\.unisphere\.edu\.bd$/ }).sort({ email: 1 });
  await TeacherModel.bulkWrite(
    teacherUsers.map((user, index) => ({
      updateOne: {
        filter: { user: user._id },
        update: {
          $set: {
            employeeId: `T-DEMO-${String(index + 1).padStart(3, "0")}`,
            department: departments[index % departments.length]!._id,
            designation: teacherDesignations[index % teacherDesignations.length]!,
            joiningDate: new Date(Date.UTC(2018 + (index % 8), index % 12, 1)),
            phone: user.phone,
            specialization: ["Teaching", "Research"],
            status: "active",
          },
        },
        upsert: true,
      },
    })),
  );
  const teachers = await TeacherModel.find({ user: { $in: teacherUsers.map((item) => item._id) } }).sort({ employeeId: 1 });

  await UserModel.bulkWrite(
    Array.from({ length: 400 }, (_, index) => {
      const name = person(index + 30);
      return {
        updateOne: {
          filter: { email: `student${String(index + 1).padStart(3, "0")}@demo.unisphere.edu.bd` },
          update: {
            $set: { ...name, roles: [roleId("student")], status: "active", phone: `+8801810${String(index).padStart(6, "0")}` },
            $setOnInsert: { passwordHash },
          },
          upsert: true,
        },
      };
    }),
  );
  const studentUsers = await UserModel.find({ email: /student\d{3}@demo\.unisphere\.edu\.bd$/ }).sort({ email: 1 });
  await StudentModel.bulkWrite(
    studentUsers.map((user, index) => ({
      updateOne: {
        filter: { user: user._id },
        update: {
          $set: {
            studentId: `DEMO-${String(index + 1).padStart(4, "0")}`,
            program: programs[index % programs.length]!._id,
            admissionSemester: semester._id,
            batch: batches[index % batches.length],
            section: sections[Math.floor(index / batches.length) % sections.length],
            currentSemesterNumber: 1 + (index % 8),
            phone: user.phone,
            status: "active",
          },
        },
        upsert: true,
      },
    })),
  );
  const students = await StudentModel.find({ user: { $in: studentUsers.map((item) => item._id) } }).sort({ studentId: 1 });

  await UserModel.bulkWrite(
    Array.from({ length: 20 }, (_, index) => {
      const name = person(index + 430);
      const role = officeRoles[index % officeRoles.length]!;
      return {
        updateOne: {
          filter: { email: `office${String(index + 1).padStart(2, "0")}@demo.unisphere.edu.bd` },
          update: {
            $set: { ...name, roles: [roleId(role)], status: "active", phone: `+8801910${String(index).padStart(6, "0")}` },
            $setOnInsert: { passwordHash },
          },
          upsert: true,
        },
      };
    }),
  );
  const officeUsers = await UserModel.find({ email: /office\d{2}@demo\.unisphere\.edu\.bd$/ }).sort({ email: 1 });
  await EmployeeModel.bulkWrite(
    officeUsers.map((user, index) => ({
      updateOne: {
        filter: { user: user._id },
        update: {
          $set: {
            employeeId: `O-DEMO-${String(index + 1).padStart(3, "0")}`,
            department: departments[index % departments.length]!._id,
            employeeType: index % 5 === 0 ? "support" : "administrative",
            designation: officeRoles[index % officeRoles.length]!.replaceAll("_", " "),
            joiningDate: new Date(Date.UTC(2020 + (index % 6), index % 12, 1)),
            phone: user.phone,
            status: "active",
          },
        },
        upsert: true,
      },
    })),
  );

  const offerings = [];
  let offeringIndex = 0;
  for (const course of courses) {
    for (const batch of batches) {
      for (const section of sections) {
        const teacher = teachers[offeringIndex % teachers.length]!;
        offerings.push(
          await CourseOfferingModel.findOneAndUpdate(
            { course: course._id, semester: semester._id, batch, section },
            { $set: { teacher: teacher._id, capacity: 60, deliveryMode: "in_person", status: "ongoing" } },
            { upsert: true, new: true },
          ),
        );
        offeringIndex += 1;
      }
    }
  }

  const offeringByGroup = new Map<string, typeof offerings>();
  for (const offering of offerings) {
    const course = courses.find((item) => item._id.equals(offering.course))!;
    const key = `${course.program}:${offering.batch}:${offering.section}`;
    offeringByGroup.set(key, [...(offeringByGroup.get(key) ?? []), offering]);
  }
  const enrollmentOps = students.flatMap((student) => {
    const relevant = offeringByGroup.get(`${student.program}:${student.batch}:${student.section}`) ?? [];
    return relevant.map((offering) => ({
      updateOne: {
        filter: { student: student._id, offering: offering._id },
        update: { $set: { course: offering.course, semester: semester._id, status: "enrolled" as const, enrolledAt: new Date() } },
        upsert: true as const,
      },
    }));
  });
  if (enrollmentOps.length) await EnrollmentModel.bulkWrite(enrollmentOps);

  const dayNames = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"] as const;
  const timeSlots = [[480, 570], [585, 675], [690, 780], [840, 930], [945, 1035]] as const;
  const effectiveFrom = semester.startsAt;
  const effectiveTo = semester.endsAt;
  await RoutineSlotModel.bulkWrite(
    offerings.map((offering, index) => {
      const dayOfWeek = dayNames[Math.floor(index / (timeSlots.length * 4)) % dayNames.length]!;
      const [startMinutes, endMinutes] = timeSlots[Math.floor(index / 4) % timeSlots.length]!;
      const room = `ROOM-${101 + (index % 4)}`;
      const format = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
      return {
        updateOne: {
          filter: { offering: offering._id, dayOfWeek },
          update: {
            $set: {
              semester: semester._id,
              teacher: offering.teacher,
              startTime: format(startMinutes),
              endTime: format(endMinutes),
              startMinutes,
              endMinutes,
              room,
              effectiveFrom,
              effectiveTo,
              status: "active",
            },
          },
          upsert: true,
        },
      };
    }),
  );

  console.info(`Bulk demo ready: ${teachers.length} teachers, ${students.length} students, ${officeUsers.length} office staff, ${offerings.length} offerings, ${enrollmentOps.length} enrollments.`);
  console.info(`Generated account password: ${password}`);
}

void seedBulk()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
