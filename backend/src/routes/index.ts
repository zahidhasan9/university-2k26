import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { auditRouter } from "../modules/audit/audit.routes";
import { admissionRouter } from "../modules/admission/admission.routes";
import { analyticsRouter } from "../modules/analytics/analytics.routes";
import { attendanceRouter } from "../modules/attendance/attendance.routes";
import { courseOfferingRouter } from "../modules/course-offering/courseOffering.routes";
import { enrollmentRouter } from "../modules/enrollment/enrollment.routes";
import { engagementRouter } from "../modules/engagement/engagement.routes";
import { communicationRouter } from "../modules/communication/communication.routes";
import { examRouter } from "../modules/examination/exam.routes";
import { financeRouter } from "../modules/finance/finance.routes";
import { facilitiesRouter } from "../modules/facilities/facilities.routes";
import { inventoryRouter } from "../modules/inventory/inventory.routes";
import { hrRouter } from "../modules/hr/hr.routes";
import { libraryRouter } from "../modules/library/library.routes";
import { lmsRouter } from "../modules/lms/lms.routes";
import { permissionRouter } from "../modules/permission/permission.routes";
import { roleRouter } from "../modules/role/role.routes";
import { resultRouter } from "../modules/result/result.routes";
import { researchRouter } from "../modules/research/research.routes";
import { routineRouter } from "../modules/routine/routine.routes";
import { userRouter } from "../modules/user/user.routes";
import { semesterRouter } from "../modules/semester/semester.routes";
import { studentRouter } from "../modules/student/student.routes";
import { teacherRouter } from "../modules/teacher/teacher.routes";
import {
  courseRouter,
  departmentRouter,
  facultyRouter,
  programRouter,
  universityRouter,
} from "../modules/university-structure/structure.routes";
import { sendSuccess } from "../utils/response";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) =>
  sendSuccess(res, 200, "UniSphere API is healthy", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
);
apiRouter.get("/health/live", (_req, res) =>
  sendSuccess(res, 200, "UniSphere API process is alive", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
);
apiRouter.get("/health/ready", (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError(503, "Database is not ready"));
  }
  return sendSuccess(res, 200, "UniSphere API is ready", {
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/audit-logs", auditRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/permissions", permissionRouter);
apiRouter.use("/universities", universityRouter);
apiRouter.use("/faculties", facultyRouter);
apiRouter.use("/departments", departmentRouter);
apiRouter.use("/programs", programRouter);
apiRouter.use("/courses", courseRouter);
apiRouter.use("/semesters", semesterRouter);
apiRouter.use("/admissions", admissionRouter);
apiRouter.use("/students", studentRouter);
apiRouter.use("/teachers", teacherRouter);
apiRouter.use("/enrollments", enrollmentRouter);
apiRouter.use("/course-offerings", courseOfferingRouter);
apiRouter.use("/routine", routineRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/exams", examRouter);
apiRouter.use("/results", resultRouter);
apiRouter.use("/finance", financeRouter);
apiRouter.use("/library", libraryRouter);
apiRouter.use("/facilities", facilitiesRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/hr", hrRouter);
apiRouter.use("/research", researchRouter);
apiRouter.use("/lms", lmsRouter);
apiRouter.use("/communication", communicationRouter);
apiRouter.use("/engagement", engagementRouter);
apiRouter.use("/analytics", analyticsRouter);
