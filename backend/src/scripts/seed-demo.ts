import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { AdmissionModel } from "../modules/admission/admission.model";
import { AcademicBatchModel } from "../modules/academic-batch/academicBatch.model";
import { AttendanceRecordModel } from "../modules/attendance/attendanceRecord.model";
import { AttendanceSessionModel } from "../modules/attendance/attendanceSession.model";
import { AuditLogModel } from "../modules/audit/auditLog.model";
import { NoticeModel } from "../modules/communication/notice.model";
import { NotificationModel } from "../modules/communication/notification.model";
import { CourseOfferingModel } from "../modules/course-offering/courseOffering.model";
import { EnrollmentModel } from "../modules/enrollment/enrollment.model";
import { ComplaintModel } from "../modules/engagement/complaint.model";
import { ExamMarkModel } from "../modules/examination/examMark.model";
import { ExamModel } from "../modules/examination/exam.model";
import {
  HostelAllocationModel,
  HostelModel,
  RoomModel,
} from "../modules/facilities/hostel.model";
import {
  TransportAllocationModel,
  TransportRouteModel,
  VehicleModel,
} from "../modules/facilities/transport.model";
import { ExpenseModel } from "../modules/finance/expense.model";
import { FeeStructureModel } from "../modules/finance/feeStructure.model";
import { InvoiceModel } from "../modules/finance/invoice.model";
import { PaymentModel } from "../modules/finance/payment.model";
import { EmployeeModel } from "../modules/hr/employee.model";
import { LeaveRequestModel } from "../modules/hr/leaveRequest.model";
import {
  PayrollItemModel,
  PayrollRunModel,
  SalaryStructureModel,
} from "../modules/hr/payroll.model";
import {
  InventoryItemModel,
  InventoryTransactionModel,
} from "../modules/inventory/inventory.model";
import { BookModel } from "../modules/library/book.model";
import { BookCopyModel } from "../modules/library/bookCopy.model";
import { LibraryTransactionModel } from "../modules/library/libraryTransaction.model";
import { LmsAssignmentModel } from "../modules/lms/assignment.model";
import { CourseMaterialModel } from "../modules/lms/courseMaterial.model";
import { DiscussionPostModel } from "../modules/lms/discussionPost.model";
import { StudentWaiverModel } from "../modules/finance/studentWaiver.model";
import { PublicationModel } from "../modules/research/publication.model";
import { ResearchProjectModel } from "../modules/research/researchProject.model";
import { ThesisDefenseModel, ThesisModel } from "../modules/research/thesis.model";
import { CourseResultModel } from "../modules/result/courseResult.model";
import { GradePolicyModel } from "../modules/result/gradePolicy.model";
import { RoleModel } from "../modules/role/role.model";
import { RoutineSlotModel } from "../modules/routine/routineSlot.model";
import { SemesterModel } from "../modules/semester/semester.model";
import { StudentModel } from "../modules/student/student.model";
import { TeacherModel } from "../modules/teacher/teacher.model";
import { CourseModel } from "../modules/university-structure/course.model";
import { DepartmentModel } from "../modules/university-structure/department.model";
import { FacultyModel } from "../modules/university-structure/faculty.model";
import { ProgramModel } from "../modules/university-structure/program.model";
import { UniversityModel } from "../modules/university-structure/university.model";
import { UserModel } from "../modules/user/user.model";

const now = new Date();
const date = (monthOffset: number, day = 10) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, day, 9));
const demoPassword = "DemoUser@2026";

async function seedDemo() {
  await connectDatabase();

  const roles = await RoleModel.find({
    code: { $in: ["university_admin", "teacher", "student", "accountant", "librarian"] },
  }).lean();
  const roleId = (code: string) => {
    const role = roles.find((item) => item.code === code);
    if (!role) throw new Error(`Role ${code} is missing. Run npm run seed:bootstrap first.`);
    return role._id;
  };
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const university = await UniversityModel.findOneAndUpdate(
    { code: "UNI26" },
    {
      $set: {
        name: "UniSphere International University",
        shortName: "UniSphere",
        email: "info@unisphere.edu.bd",
        phone: "+880 2 55000000",
        website: "https://unisphere.edu.bd",
        address: {
          line1: "University Avenue",
          city: "Dhaka",
          state: "Dhaka",
          country: "Bangladesh",
          postalCode: "1207",
        },
        status: "active",
      },
    },
    { upsert: true, new: true },
  );

  const engineering = await FacultyModel.findOneAndUpdate(
    { university: university._id, code: "FSE" },
    { $set: { name: "Faculty of Science & Engineering", status: "active" } },
    { upsert: true, new: true },
  );
  const business = await FacultyModel.findOneAndUpdate(
    { university: university._id, code: "FBS" },
    { $set: { name: "Faculty of Business Studies", status: "active" } },
    { upsert: true, new: true },
  );
  const cse = await DepartmentModel.findOneAndUpdate(
    { faculty: engineering._id, code: "CSE" },
    { $set: { name: "Computer Science & Engineering", status: "active" } },
    { upsert: true, new: true },
  );
  const eee = await DepartmentModel.findOneAndUpdate(
    { faculty: engineering._id, code: "EEE" },
    { $set: { name: "Electrical & Electronic Engineering", status: "active" } },
    { upsert: true, new: true },
  );
  const bbaDepartment = await DepartmentModel.findOneAndUpdate(
    { faculty: business._id, code: "BBA" },
    { $set: { name: "Business Administration", status: "active" } },
    { upsert: true, new: true },
  );
  const cseProgram = await ProgramModel.findOneAndUpdate(
    { department: cse._id, code: "BSC-CSE" },
    {
      $set: {
        name: "BSc in Computer Science & Engineering",
        degreeType: "bachelor",
        durationYears: 4,
        totalCredits: 148,
        totalSemesters: 8,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  const eeeProgram = await ProgramModel.findOneAndUpdate(
    { department: eee._id, code: "BSC-EEE" },
    {
      $set: {
        name: "BSc in Electrical & Electronic Engineering",
        degreeType: "bachelor",
        durationYears: 4,
        totalCredits: 150,
        totalSemesters: 8,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  const bbaProgram = await ProgramModel.findOneAndUpdate(
    { department: bbaDepartment._id, code: "BBA" },
    {
      $set: {
        name: "Bachelor of Business Administration",
        degreeType: "bachelor",
        durationYears: 4,
        totalCredits: 126,
        totalSemesters: 8,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );

  const batchSeeds: Array<[typeof cse._id, typeof cseProgram._id, string, string]> = [
    [cse._id, cseProgram._id, "CSE-47", "CSE 47th Batch"],
    [eee._id, eeeProgram._id, "EEE-47", "EEE 47th Batch"],
    [bbaDepartment._id, bbaProgram._id, "BBA-47", "BBA 47th Batch"],
  ];
  const academicBatches = await Promise.all(batchSeeds.map(([department, program, code, name]) => AcademicBatchModel.findOneAndUpdate(
    { program, code },
    { $set: { department, name, admissionYear: 2026, curriculumVersion: "2026-v1", totalSemesters: 8, currentSemesterNumber: 3, status: "active" } },
    { upsert: true, new: true },
  )));

  const semester = await SemesterModel.findOneAndUpdate(
    { university: university._id, code: "FALL-2026" },
    {
      $set: {
        name: "Fall 2026",
        academicYear: "2026-2027",
        term: "fall",
        startsAt: date(1, 10),
        endsAt: date(6, 20),
        registrationStartsAt: date(0, 1),
        registrationEndsAt: date(1, 5),
        status: "registration",
      },
    },
    { upsert: true, new: true },
  );

  const courseSpecs = [
    [cseProgram._id, "CSE-2201", "Data Structures", 3, "core", 3, 3, 0],
    [cseProgram._id, "CSE-3201", "Database Systems", 3, "core", 3, 3, 0],
    [cseProgram._id, "CSE-3202", "Database Systems Lab", 1.5, "lab", 3, 0, 3],
    [eeeProgram._id, "EEE-2101", "Electronic Circuits", 3, "core", 3, 3, 0],
    [bbaProgram._id, "BBA-1101", "Principles of Management", 3, "core", 3, 3, 0],
    [cseProgram._id, "CSE-3301", "Web Engineering", 3, "elective", 3, 3, 0],
  ] as const;
  const courses = [];
  for (const [program, code, title, credits, courseType, semesterNumber, theoryHoursPerWeek, labHoursPerWeek] of courseSpecs) {
    courses.push(
      await CourseModel.findOneAndUpdate(
        { program, code },
        { $set: { title, credits, courseType, semesterNumber, theoryHoursPerWeek, labHoursPerWeek, status: "active" } },
        { upsert: true, new: true },
      ),
    );
  }

  const userSpecs = [
    ["teacher.rahman@unisphere.edu.bd", "Farhan", "Rahman", "teacher"],
    ["teacher.sultana@unisphere.edu.bd", "Nadia", "Sultana", "teacher"],
    ["student.arif@unisphere.edu.bd", "Arif", "Hossain", "student"],
    ["student.mim@unisphere.edu.bd", "Mim", "Akter", "student"],
    ["student.sami@unisphere.edu.bd", "Sami", "Ahmed", "student"],
    ["student.nila@unisphere.edu.bd", "Nila", "Khan", "student"],
    ["student.rifat@unisphere.edu.bd", "Rifat", "Islam", "student"],
    ["student.tania@unisphere.edu.bd", "Tania", "Jahan", "student"],
    ["accountant@unisphere.edu.bd", "Mahmud", "Karim", "accountant"],
    ["librarian@unisphere.edu.bd", "Sabina", "Yasmin", "librarian"],
  ] as const;
  const users = [];
  for (const [email, firstName, lastName, role] of userSpecs) {
    users.push(
      await UserModel.findOneAndUpdate(
        { email },
        {
          $set: {
            firstName,
            lastName,
            roles: [roleId(role)],
            status: "active",
            phone: "+8801700000000",
            address: { city: "Dhaka", country: "Bangladesh" },
          },
          $setOnInsert: { passwordHash },
        },
        { upsert: true, new: true },
      ),
    );
  }
  const [teacherUser1, teacherUser2, ...otherUsers] = users;
  const studentUsers = otherUsers.slice(0, 6);
  const accountant = otherUsers[6]!;
  const librarian = otherUsers[7]!;

  const teacher1 = await TeacherModel.findOneAndUpdate(
    { user: teacherUser1!._id },
    {
      $set: {
        employeeId: "T-CSE-001",
        department: cse._id,
        designation: "associate_professor",
        joiningDate: date(-48),
        phone: teacherUser1!.phone,
        specialization: ["Database Systems", "Software Engineering"],
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  const teacher2 = await TeacherModel.findOneAndUpdate(
    { user: teacherUser2!._id },
    {
      $set: {
        employeeId: "T-EEE-002",
        department: eee._id,
        designation: "assistant_professor",
        joiningDate: date(-30),
        phone: teacherUser2!.phone,
        specialization: ["Embedded Systems", "Renewable Energy"],
        status: "active",
      },
    },
    { upsert: true, new: true },
  );

  const students = [];
  for (let index = 0; index < studentUsers.length; index += 1) {
    const user = studentUsers[index]!;
    const program = index < 4 ? cseProgram : index === 4 ? eeeProgram : bbaProgram;
    const academicBatch = program._id.equals(cseProgram._id) ? academicBatches[0]! : program._id.equals(eeeProgram._id) ? academicBatches[1]! : academicBatches[2]!;
    students.push(
      await StudentModel.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            studentId: `2026-${String(index + 1).padStart(4, "0")}`,
            program: program._id,
            admissionSemester: semester._id,
            batch: program._id.equals(cseProgram._id)
              ? "CSE-47"
              : program._id.equals(eeeProgram._id)
                ? "EEE-47"
                : "BBA-47",
            academicBatch: academicBatch._id,
            section: "A",
            phone: user.phone,
            currentSemesterNumber: 3,
            status: "active",
          },
        },
        { upsert: true, new: true },
      ),
    );
  }

  const offerings = [];
  for (let index = 0; index < courses.length; index += 1) {
    const course = courses[index]!;
    const academicBatch = course.program.equals(cseProgram._id) ? academicBatches[0]! : course.program.equals(eeeProgram._id) ? academicBatches[1]! : academicBatches[2]!;
    offerings.push(
      await CourseOfferingModel.findOneAndUpdate(
        { course: course._id, semester: semester._id, section: "A" },
        {
          $set: {
            teacher: index === 3 ? teacher2._id : teacher1._id,
            academicBatch: academicBatch._id,
            batch: academicBatch.code,
            capacity: 45,
            deliveryMode: index === 2 ? "hybrid" : "in_person",
            status: index === 5 ? "open" : "ongoing",
          },
        },
        { upsert: true, new: true },
      ),
    );
  }

  let enrollmentIndex = 0;
  for (const student of students) {
    const relevantOfferings =
      student.program.toString() === cseProgram._id.toString()
        ? offerings.slice(0, 3)
        : student.program.toString() === eeeProgram._id.toString()
          ? offerings.slice(3, 4)
          : offerings.slice(4, 5);
    for (const offering of relevantOfferings) {
      await EnrollmentModel.findOneAndUpdate(
        { student: student._id, offering: offering!._id },
        {
          $set: {
            course: offering!.course,
            semester: semester._id,
            status: "enrolled",
            enrolledAt: date(-Math.min(5, enrollmentIndex % 6), 5 + enrollmentIndex),
          },
        },
        { upsert: true, new: true },
      );
      enrollmentIndex += 1;
    }
  }

  const session = await AttendanceSessionModel.findOneAndUpdate(
    { offering: offerings[0]!._id, date: date(0, 20) },
    {
      $set: {
        topic: "Balanced trees and indexing",
        createdBy: teacherUser1!._id,
        status: "closed",
      },
    },
    { upsert: true, new: true },
  );
  for (let index = 0; index < students.slice(0, 4).length; index += 1) {
    const student = students[index]!;
    await AttendanceRecordModel.findOneAndUpdate(
      { session: session._id, student: student._id },
      {
        $set: {
          offering: offerings[0]!._id,
          status: index === 3 ? "late" : "present",
          markedBy: teacherUser1!._id,
          source: "manual",
        },
      },
      { upsert: true, new: true },
    );
  }

  await GradePolicyModel.findOneAndUpdate(
    { program: cseProgram._id, status: "active" },
    {
      $set: {
        name: "Standard Undergraduate Grading",
        bands: [
          { letter: "A+", minPercentage: 80, maxPercentage: 100, gradePoint: 4, passed: true },
          { letter: "A", minPercentage: 75, maxPercentage: 79.99, gradePoint: 3.75, passed: true },
          { letter: "B+", minPercentage: 70, maxPercentage: 74.99, gradePoint: 3.5, passed: true },
          { letter: "B", minPercentage: 65, maxPercentage: 69.99, gradePoint: 3, passed: true },
          { letter: "C", minPercentage: 50, maxPercentage: 64.99, gradePoint: 2.5, passed: true },
          { letter: "F", minPercentage: 0, maxPercentage: 49.99, gradePoint: 0, passed: false },
        ],
      },
    },
    { upsert: true, new: true },
  );
  const exam = await ExamModel.findOneAndUpdate(
    { offering: offerings[0]!._id, title: "Midterm Examination" },
    {
      $set: {
        semester: semester._id,
        type: "midterm",
        examDate: date(0, 24),
        startTime: "10:00",
        endTime: "11:30",
        startMinutes: 600,
        endMinutes: 690,
        room: "CSE-301",
        totalMarks: 50,
        weightPercentage: 30,
        status: "completed",
        createdBy: teacherUser1!._id,
      },
    },
    { upsert: true, new: true },
  );
  for (let index = 0; index < students.slice(0, 4).length; index += 1) {
    const student = students[index]!;
    const mark = 42 - index * 3;
    await ExamMarkModel.findOneAndUpdate(
      { exam: exam._id, student: student._id },
      {
        $set: {
          offering: offerings[0]!._id,
          marksObtained: mark,
          absent: false,
          enteredBy: teacherUser1!._id,
        },
      },
      { upsert: true, new: true },
    );
    const enrollment = await EnrollmentModel.findOne({
      student: student._id,
      offering: offerings[0]!._id,
    });
    if (enrollment) {
      const percentage = mark * 2;
      await CourseResultModel.findOneAndUpdate(
        { enrollment: enrollment._id },
        {
          $set: {
            offering: offerings[0]!._id,
            student: student._id,
            course: offerings[0]!.course,
            semester: semester._id,
            percentage,
            letterGrade: percentage >= 80 ? "A+" : percentage >= 75 ? "A" : "B+",
            gradePoint: percentage >= 80 ? 4 : percentage >= 75 ? 3.75 : 3.5,
            passed: true,
            status: "published",
            calculatedAt: date(0, 25),
            calculatedBy: teacherUser1!._id,
            publishedAt: date(0, 26),
            publishedBy: teacherUser1!._id,
          },
        },
        { upsert: true, new: true },
      );
    }
  }
  await RoutineSlotModel.findOneAndUpdate(
    {
      offering: offerings[0]!._id,
      semester: semester._id,
      dayOfWeek: "sunday",
      room: "CSE-301",
    },
    {
      $set: {
        teacher: teacher1._id,
        startTime: "09:00",
        endTime: "10:30",
        startMinutes: 540,
        endMinutes: 630,
        effectiveFrom: semester.startsAt,
        effectiveTo: semester.endsAt,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );

  const feeStructure = await FeeStructureModel.findOneAndUpdate(
    { program: cseProgram._id, semester: semester._id },
    {
      $set: {
        name: "Fall 2026 CSE Tuition",
        currency: "BDT",
        perCreditFeeMinor: 250000,
        items: [
          { code: "REGISTRATION", name: "Registration Fee", amountMinor: 300000, mandatory: true },
          { code: "LAB", name: "Laboratory Fee", amountMinor: 850000, mandatory: true },
        ],
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  await StudentWaiverModel.findOneAndUpdate(
    { student: students[0]!._id, name: "Merit Scholarship 25%" },
    {
      $set: {
        type: "percentage",
        value: 25,
        appliesTo: "tuition",
        reason: "Academic merit scholarship",
        validFrom: semester.startsAt,
        validUntil: semester.endsAt,
        status: "active",
        approvedBy: accountant._id,
      },
    },
    { upsert: true, new: true },
  );
  for (let index = 0; index < students.slice(0, 4).length; index += 1) {
    const student = students[index]!;
    const registeredCredits = 7.5;
    const tuitionMinor = registeredCredits * feeStructure.perCreditFeeMinor;
    const subtotalMinor = tuitionMinor + 300000 + 850000;
    const discountMinor = index === 0 ? Math.round(tuitionMinor * 0.25) : 0;
    const totalMinor = subtotalMinor - discountMinor;
    const paidMinor = index < 3 ? totalMinor : 1500000;
    const invoice = await InvoiceModel.findOneAndUpdate(
      { student: student._id, semester: semester._id },
      {
        $set: {
          invoiceNumber: `INV-2026-${String(index + 1).padStart(4, "0")}`,
          feeStructure: feeStructure._id,
          currency: "BDT",
          registeredCredits,
          perCreditFeeMinor: feeStructure.perCreditFeeMinor,
          waiver: index === 0 ? (await StudentWaiverModel.findOne({ student: student._id, status: "active" }))?._id : undefined,
          waiverDescription: index === 0 ? "Merit Scholarship 25% (25%)" : undefined,
          items: [
            { code: "TUITION_CREDIT", name: "Tuition (7.5 registered credits)", amountMinor: tuitionMinor },
            ...feeStructure.items,
          ],
          subtotalMinor,
          discountMinor,
          totalMinor,
          paidMinor,
          dueMinor: totalMinor - paidMinor,
          dueDate: date(1, 10),
          status: paidMinor === totalMinor ? "paid" : "partially_paid",
          issuedBy: accountant._id,
        },
      },
      { upsert: true, new: true },
    );
    await PaymentModel.findOneAndUpdate(
      { receiptNumber: `RCP-2026-${String(index + 1).padStart(4, "0")}` },
      {
        $set: {
          invoice: invoice._id,
          student: student._id,
          amountMinor: paidMinor,
          currency: "BDT",
          method: index % 2 ? "mobile_banking" : "bank_transfer",
          status: "completed",
          collectedBy: accountant._id,
          paidAt: date(-index, 12),
        },
      },
      { upsert: true, new: true },
    );
  }
  await ExpenseModel.findOneAndUpdate(
    { expenseNumber: "EXP-2026-0001" },
    {
      $set: {
        category: "Laboratory",
        description: "Networking laboratory equipment purchase",
        vendor: "Dhaka Technology Supplies",
        amountMinor: 18500000,
        currency: "BDT",
        expenseDate: date(0, 8),
        status: "approved",
        createdBy: accountant._id,
        approvedBy: teacherUser1!._id,
        approvedAt: date(0, 9),
      },
    },
    { upsert: true, new: true },
  );

  const books = [
    ["9780132350884", "Clean Code", ["Robert C. Martin"], "Software Engineering"],
    ["9780262033848", "Introduction to Algorithms", ["Cormen", "Leiserson"], "Algorithms"],
    ["9781449373320", "Designing Data-Intensive Applications", ["Martin Kleppmann"], "Databases"],
  ] as const;
  const copies = [];
  for (let index = 0; index < books.length; index += 1) {
    const [isbn, title, authors, category] = books[index]!;
    const book = await BookModel.findOneAndUpdate(
      { isbn },
      {
        $set: {
          title,
          authors: [...authors],
          publisher: "International Academic Press",
          publicationYear: 2022,
          categories: [category],
          language: "English",
          status: "active",
        },
      },
      { upsert: true, new: true },
    );
    copies.push(
      await BookCopyModel.findOneAndUpdate(
        { accessionNumber: `LIB-${String(index + 1).padStart(5, "0")}` },
        {
          $set: {
            book: book._id,
            barcode: `8800000${index + 1}`,
            shelfLocation: `CSE-${index + 1}`,
            condition: "good",
            status: index === 0 ? "issued" : "available",
          },
        },
        { upsert: true, new: true },
      ),
    );
  }
  await LibraryTransactionModel.findOneAndUpdate(
    { transactionNumber: "LIB-TX-2026-0001" },
    {
      $set: {
        copy: copies[0]!._id,
        book: copies[0]!.book,
        borrower: studentUsers[0]!._id,
        borrowerType: "student",
        issuedAt: date(0, 15),
        dueAt: date(1, 1),
        fineMinor: 0,
        currency: "BDT",
        status: "issued",
        issuedBy: librarian._id,
      },
    },
    { upsert: true, new: true },
  );

  const inventory = await InventoryItemModel.findOneAndUpdate(
    { sku: "ICT-LAPTOP-001" },
    {
      $set: {
        name: "Faculty Laptop",
        category: "ICT Equipment",
        unit: "piece",
        quantity: 24,
        reorderLevel: 5,
        location: "Central Store",
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  await InventoryTransactionModel.findOneAndUpdate(
    { transactionNumber: "STK-2026-0001" },
    {
      $set: {
        item: inventory._id,
        type: "stock_in",
        quantity: 24,
        balanceAfter: 24,
        reason: "Annual equipment procurement",
        performedBy: accountant._id,
      },
    },
    { upsert: true, new: true },
  );

  const hostel = await HostelModel.findOneAndUpdate(
    { code: "HST-A" },
    {
      $set: {
        name: "Shaheed Minar Hall",
        gender: "male",
        address: "North Campus, UniSphere",
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  const room = await RoomModel.findOneAndUpdate(
    { hostel: hostel._id, roomNumber: "A-201" },
    {
      $set: { floor: "2", capacity: 4, occupied: 1, monthlyFeeMinor: 450000, status: "available" },
    },
    { upsert: true, new: true },
  );
  await HostelAllocationModel.findOneAndUpdate(
    { student: students[0]!._id, status: "active" },
    {
      $set: {
        hostel: hostel._id,
        room: room._id,
        bedNumber: "B1",
        startsAt: date(-1, 1),
        allocatedBy: teacherUser1!._id,
      },
    },
    { upsert: true, new: true },
  );
  const vehicle = await VehicleModel.findOneAndUpdate(
    { registrationNumber: "DHAKA-METRO-B-26-1001" },
    {
      $set: {
        name: "Campus Express 1",
        type: "bus",
        capacity: 45,
        assignedSeats: 1,
        driverName: "Abdul Malek",
        driverPhone: "+8801711002200",
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  const route = await TransportRouteModel.findOneAndUpdate(
    { code: "RT-MIRPUR" },
    {
      $set: {
        name: "Mirpur to Campus",
        vehicle: vehicle._id,
        stops: [
          { name: "Mirpur 10", pickupTime: "07:00" },
          { name: "Agargaon", pickupTime: "07:20" },
        ],
        monthlyFeeMinor: 250000,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  await TransportAllocationModel.findOneAndUpdate(
    { user: studentUsers[1]!._id, status: "active" },
    {
      $set: {
        route: route._id,
        vehicle: vehicle._id,
        pickupStop: "Mirpur 10",
        startsAt: date(-1, 1),
        assignedBy: teacherUser1!._id,
      },
    },
    { upsert: true, new: true },
  );

  const employee = await EmployeeModel.findOneAndUpdate(
    { user: teacherUser1!._id },
    {
      $set: {
        employeeId: "EMP-2026-001",
        teacher: teacher1._id,
        department: cse._id,
        employeeType: "academic",
        designation: "Associate Professor",
        joiningDate: teacher1.joiningDate,
        phone: teacherUser1!.phone,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );
  await LeaveRequestModel.findOneAndUpdate(
    { employee: employee._id, startsAt: date(1, 12), endsAt: date(1, 14) },
    {
      $set: {
        type: "casual",
        totalDays: 3,
        reason: "Family program outside Dhaka",
        status: "pending",
      },
    },
    { upsert: true, new: true },
  );
  const salary = await SalaryStructureModel.findOneAndUpdate(
    { employee: employee._id, status: "active" },
    {
      $set: {
        currency: "BDT",
        earnings: [
          { code: "BASIC", name: "Basic Salary", amountMinor: 8500000 },
          { code: "HOUSE", name: "Housing Allowance", amountMinor: 3400000 },
          { code: "MEDICAL", name: "Medical Allowance", amountMinor: 850000 },
        ],
        deductions: [{ code: "TAX", name: "Income Tax", amountMinor: 650000 }],
        grossMinor: 12750000,
        deductionMinor: 650000,
        netMinor: 12100000,
        effectiveFrom: date(-6, 1),
      },
    },
    { upsert: true, new: true },
  );
  const payroll = await PayrollRunModel.findOneAndUpdate(
    { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, currency: "BDT" },
    {
      $set: {
        employeeCount: 1,
        grossMinor: salary.grossMinor,
        deductionMinor: salary.deductionMinor,
        netMinor: salary.netMinor,
        status: "paid",
        createdBy: accountant._id,
        processedBy: accountant._id,
        processedAt: date(0, 25),
        paidBy: accountant._id,
        paidAt: date(0, 28),
      },
    },
    { upsert: true, new: true },
  );
  await PayrollItemModel.findOneAndUpdate(
    { run: payroll._id, employee: employee._id },
    {
      $set: {
        currency: "BDT",
        earnings: salary.earnings,
        deductions: salary.deductions,
        grossMinor: salary.grossMinor,
        deductionMinor: salary.deductionMinor,
        netMinor: salary.netMinor,
        status: "paid",
      },
    },
    { upsert: true, new: true },
  );

  const lmsMaterials = [
    {
      title: "Week 1: Data Structure Review",
      description: "Lecture notes and practice problems for arrays, linked lists, and complexity.",
      type: "document",
      url: "https://example.com/materials/data-structures-week-1.pdf",
    },
    {
      title: "AVL Tree Lecture",
      description: "A recorded walkthrough of rotations, insertion, and deletion in AVL trees.",
      type: "video",
      url: "https://example.com/videos/avl-tree-lecture",
    },
    {
      title: "Graph Traversal Slides",
      description: "Class slides covering breadth-first and depth-first search with examples.",
      type: "slide",
      url: "https://example.com/materials/graph-traversal-slides.pdf",
    },
  ] as const;
  for (const [index, material] of lmsMaterials.entries()) {
    await CourseMaterialModel.findOneAndUpdate(
      { offering: offerings[0]!._id, title: material.title },
      { $set: { ...material, order: index + 1, published: true, createdBy: teacherUser1!._id } },
      { upsert: true, new: true },
    );
  }

  const lmsAssignments = [
    {
      title: "Balanced Search Tree Implementation",
      instructions: "Implement an AVL tree and submit source code with a short report.",
      dueAt: date(1, 5),
      maxScore: 100,
    },
    {
      title: "Graph Traversal Problem Set",
      instructions: "Solve the BFS and DFS exercises and include the traversal order for each graph.",
      dueAt: date(1, 12),
      maxScore: 50,
    },
  ];
  for (const assignment of lmsAssignments) {
    await LmsAssignmentModel.findOneAndUpdate(
      { offering: offerings[0]!._id, title: assignment.title },
      { $set: { ...assignment, published: true, createdBy: teacherUser1!._id } },
      { upsert: true, new: true },
    );
  }

  const discussionPosts = [
    {
      title: "Welcome to the course discussion",
      body: "Use this space to ask questions about lectures, assignments, and lab exercises.",
      author: teacherUser1!._id,
    },
    {
      title: "AVL rotation practice",
      body: "Can someone explain when a left-right rotation is needed? I am comparing it with a right-left rotation.",
      author: studentUsers[0]!._id,
    },
  ];
  for (const post of discussionPosts) {
    await DiscussionPostModel.findOneAndUpdate(
      { offering: offerings[0]!._id, title: post.title },
      { $set: { ...post, status: "visible" } },
      { upsert: true, new: true },
    );
  }

  const project = await ResearchProjectModel.findOneAndUpdate(
    { code: "RES-AI-2026-01" },
    {
      $set: {
        title: "AI-Assisted Learning Analytics for Higher Education",
        abstract: "A privacy-aware analytics platform for identifying learning support needs.",
        leadResearcher: teacher1._id,
        members: [teacherUser1!._id, teacherUser2!._id],
        department: cse._id,
        startsAt: date(-3, 1),
        endsAt: date(9, 1),
        funding: { source: "University Research Grant", amountMinor: 120000000, currency: "BDT" },
        status: "ongoing",
      },
    },
    { upsert: true, new: true },
  );
  await PublicationModel.findOneAndUpdate(
    { doi: "10.1000/unisphere.2026.001" },
    {
      $set: {
        title: "Privacy-Aware Academic Early Warning Systems",
        type: "conference",
        authors: [teacher1._id, teacher2._id],
        project: project._id,
        venue: "International Conference on Learning Analytics",
        url: "https://example.com/publications/unisphere-2026-001",
        publishedAt: date(-2, 15),
        status: "published",
      },
    },
    { upsert: true, new: true },
  );
  const thesis = await ThesisModel.findOneAndUpdate(
    { student: students[3]!._id },
    {
      $set: {
        program: cseProgram._id,
        title: "Predictive Analytics for Student Success",
        abstract: "A machine-learning study of academic engagement and student success indicators.",
        supervisor: teacher1._id,
        coSupervisors: [teacher2._id],
        documentUrl: "https://example.com/theses/predictive-student-success.pdf",
        status: "defense_scheduled",
        submittedAt: date(-1, 20),
      },
    },
    { upsert: true, new: true },
  );
  await ThesisDefenseModel.findOneAndUpdate(
    { thesis: thesis._id },
    {
      $set: {
        scheduledAt: date(1, 15),
        room: "SEMINAR-201",
        panel: [teacher1._id, teacher2._id],
        status: "scheduled",
        recordedBy: teacherUser1!._id,
      },
    },
    { upsert: true, new: true },
  );

  await NoticeModel.findOneAndUpdate(
    { title: "Fall 2026 midterm examination schedule published" },
    {
      $set: {
        body: "The midterm examination schedule is now available from the examination portal.",
        category: "exam",
        audienceRoles: [roleId("student"), roleId("teacher")],
        attachmentUrls: [],
        publishAt: date(0, 18),
        expiresAt: date(2, 1),
        status: "published",
        createdBy: teacherUser1!._id,
      },
    },
    { upsert: true, new: true },
  );
  const activeUsers = await UserModel.find({ status: "active" }).select("_id");
  for (const user of activeUsers) {
    await NotificationModel.findOneAndUpdate(
      { user: user._id, type: "semester_update", title: "Fall 2026 semester is now active" },
      {
        $setOnInsert: {
          channel: "in_app",
          body: "Course schedules, notices, and academic services are available from your dashboard.",
          status: "sent",
          sentAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    await NotificationModel.findOneAndUpdate(
      { user: user._id, type: "exam_notice", title: "Midterm examination schedule published" },
      {
        $setOnInsert: {
          channel: "in_app",
          body: "Review the examination schedule and assigned rooms from the results workspace.",
          status: "sent",
          sentAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
  }
  await ComplaintModel.findOneAndUpdate(
    { complaintNumber: "CMP-2026-0001" },
    {
      $set: {
        complainant: studentUsers[2]!._id,
        category: "technical",
        subject: "Campus Wi-Fi coverage in engineering building",
        description: "The third-floor laboratory has intermittent Wi-Fi coverage.",
        priority: "normal",
        status: "under_review",
        assignedTo: teacherUser1!._id,
      },
    },
    { upsert: true, new: true },
  );

  const auditEvents = [
    ["student.profile_create", "student", students[0]!._id.toString()],
    ["finance.payment_collect", "payment", "RCP-2026-0001"],
    ["lms.assignment_create", "lms_assignment", offerings[0]!._id.toString()],
    ["library.issue", "library_transaction", "LIB-TX-2026-0001"],
  ] as const;
  for (const [action, resource, resourceId] of auditEvents) {
    await AuditLogModel.findOneAndUpdate(
      { action, resource, resourceId },
      { $set: { actor: teacherUser1!._id, metadata: { seeded: true } } },
      { upsert: true, new: true },
    );
  }

  console.info("Demo data is ready.");
  console.info(`LMS offering ID: ${offerings[0]!._id.toString()}`);
  console.info(`Teacher login: ${teacherUser1!.email} / ${demoPassword}`);
  console.info(`Student login: ${studentUsers[0]!.email} / ${demoPassword}`);
}

void seedDemo()
  .catch((error) => {
    console.error("Demo seed failed", error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
