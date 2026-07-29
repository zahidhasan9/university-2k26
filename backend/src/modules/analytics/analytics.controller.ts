import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import * as service from "./analytics.service";

function userId(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth.userId;
}
export async function admin(req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    "Admin dashboard analytics retrieved",
    await service.adminDashboard(req.query),
  );
}
export async function departments(_req: Request, res: Response) {
  return sendSuccess(res, 200, "Department performance retrieved", {
    departments: await service.departmentPerformance(),
  });
}
export async function teacher(req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    "Teacher dashboard retrieved",
    await service.teacherDashboard(userId(req)),
  );
}
export async function student(req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    "Student dashboard retrieved",
    await service.studentDashboard(userId(req)),
  );
}
