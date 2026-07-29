import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { env } from "../config/env";
import { PermissionModel } from "../modules/permission/permission.model";
import { RoleModel } from "../modules/role/role.model";
import { UserModel } from "../modules/user/user.model";

const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  university_admin: "University Admin",
  registrar: "Registrar",
  department_head: "Department Head",
  teacher: "Teacher",
  student: "Student",
  accountant: "Accountant",
  librarian: "Librarian",
  hr_manager: "HR Manager",
  admission_officer: "Admission Officer",
};

const initialPermissions = [
  ["users.read", "View users"],
  ["users.manage", "Manage users"],
  ["roles.read", "View roles"],
  ["roles.manage", "Manage roles and permissions"],
  ["audit.read", "View audit logs"],
  ["structure.read", "View university structure"],
  ["structure.manage", "Manage university structure"],
  ["academic.read", "View academic records"],
  ["academic.manage", "Manage academic records"],
  ["admissions.read", "View admission applications"],
  ["admissions.review", "Review and decide admission applications"],
  ["students.read", "View student records"],
  ["students.manage", "Manage student records"],
  ["teachers.read", "View teacher records"],
  ["teachers.manage", "Manage teacher records"],
  ["enrollments.read", "View enrollments"],
  ["enrollments.manage", "Manage enrollments"],
  ["attendance.read", "View attendance"],
  ["attendance.manage", "Create and manage attendance"],
  ["exams.read", "View examinations and marks"],
  ["exams.manage", "Manage assigned examinations and marks"],
  ["exams.manage_all", "Manage all examinations"],
  ["results.read", "View academic results"],
  ["results.manage", "Calculate academic results"],
  ["results.publish", "Publish academic results"],
  ["grade_policies.manage", "Manage grade policies"],
  ["finance.read", "View finance records and reports"],
  ["finance.manage", "Manage fees, invoices, and expenses"],
  ["finance.collect", "Collect student payments"],
  ["finance.refund", "Refund student payments"],
  ["finance.approve", "Approve expenses"],
  ["library.read", "View library catalog and circulation"],
  ["library.manage", "Manage library catalog and policies"],
  ["library.circulation", "Issue and return library books"],
  ["facilities.read", "View hostel and transport records"],
  ["facilities.manage", "Manage hostels, rooms, vehicles, and routes"],
  ["facilities.allocate", "Manage hostel and transport allocations"],
  ["inventory.read", "View inventory"],
  ["inventory.manage", "Manage inventory and stock"],
  ["hr.read", "View employee and HR records"],
  ["hr.manage", "Manage employee records"],
  ["hr.attendance", "Manage employee attendance"],
  ["hr.leave_approve", "Approve or reject employee leave"],
  ["payroll.read", "View payroll"],
  ["payroll.manage", "Manage salary structures and process payroll"],
  ["payroll.pay", "Mark payroll as paid"],
  ["research.read", "View research projects and publications"],
  ["research.manage", "Manage research projects and publications"],
  ["thesis.read", "View thesis records"],
  ["thesis.manage", "Manage thesis and defense records"],
  ["thesis.supervise", "Manage assigned thesis supervision"],
  ["lms.read", "Access LMS courses"],
  ["lms.manage", "Manage assigned LMS courses"],
  ["lms.grade", "Grade LMS submissions"],
  ["lms.manage_all", "Manage all LMS courses"],
  ["notices.manage", "Manage notices and announcements"],
  ["complaints.manage", "Manage complaints"],
  ["alumni.manage", "Verify and manage alumni"],
  ["analytics.read", "View administrative analytics"],
  ["notifications.manage", "Dispatch external notifications"],
] as const;

const rolePermissionCodes: Record<string, string[]> = {
  university_admin: [
    "users.read",
    "structure.read",
    "structure.manage",
    "academic.read",
    "academic.manage",
    "admissions.read",
    "admissions.review",
    "students.read",
    "students.manage",
    "teachers.read",
    "teachers.manage",
    "enrollments.read",
    "enrollments.manage",
    "attendance.read",
    "attendance.manage",
    "exams.read",
    "exams.manage",
    "exams.manage_all",
    "results.read",
    "results.manage",
    "results.publish",
    "grade_policies.manage",
    "finance.read",
    "finance.manage",
    "finance.collect",
    "finance.refund",
    "finance.approve",
    "library.read",
    "library.manage",
    "library.circulation",
    "facilities.read",
    "facilities.manage",
    "facilities.allocate",
    "inventory.read",
    "inventory.manage",
    "hr.read",
    "hr.manage",
    "hr.attendance",
    "hr.leave_approve",
    "payroll.read",
    "payroll.manage",
    "payroll.pay",
    "research.read",
    "research.manage",
    "thesis.read",
    "thesis.manage",
    "thesis.supervise",
    "lms.read",
    "lms.manage",
    "lms.grade",
    "lms.manage_all",
    "notices.manage",
    "complaints.manage",
    "alumni.manage",
    "analytics.read",
    "notifications.manage",
    "audit.read",
  ],
  registrar: [
    "users.read",
    "structure.read",
    "academic.read",
    "academic.manage",
    "admissions.read",
    "admissions.review",
    "students.read",
    "students.manage",
    "enrollments.read",
    "enrollments.manage",
    "attendance.read",
    "research.read",
    "research.manage",
    "thesis.read",
    "thesis.manage",
    "lms.read",
    "lms.manage_all",
    "notices.manage",
    "complaints.manage",
    "alumni.manage",
    "analytics.read",
    "notifications.manage",
    "exams.read",
    "exams.manage_all",
    "results.read",
    "results.manage",
    "results.publish",
    "grade_policies.manage",
  ],
  department_head: [
    "structure.read",
    "academic.read",
    "academic.manage",
    "students.read",
    "teachers.read",
    "teachers.manage",
    "enrollments.read",
    "enrollments.manage",
    "attendance.read",
    "attendance.manage",
    "exams.read",
    "results.read",
  ],
  teacher: [
    "structure.read",
    "academic.read",
    "students.read",
    "enrollments.read",
    "attendance.read",
    "attendance.manage",
    "exams.read",
    "exams.manage",
    "results.read",
    "results.manage",
    "library.read",
    "research.read",
    "thesis.read",
    "thesis.supervise",
    "lms.read",
    "lms.manage",
    "lms.grade",
  ],
  student: ["structure.read", "academic.read", "library.read", "research.read", "lms.read"],
  admission_officer: [
    "structure.read",
    "admissions.read",
    "admissions.review",
    "students.read",
  ],
  accountant: [
    "structure.read",
    "students.read",
    "finance.read",
    "finance.manage",
    "finance.collect",
  ],
  librarian: ["library.read", "library.manage", "library.circulation", "users.read"],
  hr_manager: [
    "users.read",
    "teachers.read",
    "hr.read",
    "hr.manage",
    "hr.attendance",
    "hr.leave_approve",
    "payroll.read",
    "payroll.manage",
  ],
};

async function bootstrap(): Promise<void> {
  if (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
  }

  await connectDatabase();
  const permissions = await Promise.all(
    initialPermissions.map(([code, name]) =>
      PermissionModel.findOneAndUpdate(
        { code },
        { $set: { name }, $setOnInsert: { description: name } },
        { upsert: true, new: true },
      ),
    ),
  );

  const roles = await Promise.all(
    Object.entries(roleNames).map(([code, name]) =>
      RoleModel.findOneAndUpdate(
        { code },
        {
          $set: {
            name,
            isSystem: true,
          },
        },
        { upsert: true, new: true },
      ),
    ),
  );
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission._id]));
  await Promise.all(
    roles.map((role) => {
      const ids =
        role.code === "super_admin"
          ? permissions.map((permission) => permission._id)
          : (rolePermissionCodes[role.code] ?? [])
              .map((code) => permissionByCode.get(code))
              .filter((id) => id !== undefined);
      return RoleModel.updateOne({ _id: role._id }, { $addToSet: { permissions: { $each: ids } } });
    }),
  );
  const superAdminRole = roles.find((role) => role.code === "super_admin");
  if (!superAdminRole) throw new Error("Unable to create Super Admin role");

  await UserModel.findOneAndUpdate(
    { email: env.BOOTSTRAP_ADMIN_EMAIL },
    {
      $set: { roles: [superAdminRole._id], status: "active" },
      $setOnInsert: {
        firstName: "System",
        lastName: "Administrator",
        passwordHash: await bcrypt.hash(env.BOOTSTRAP_ADMIN_PASSWORD, 12),
      },
    },
    { upsert: true, new: true },
  );
  console.info("Roles, permissions, and bootstrap administrator are ready");
}

void bootstrap()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
