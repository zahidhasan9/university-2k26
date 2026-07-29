import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../modules/auth/auth.service";
import { UserModel } from "../modules/user/user.model";
import { asyncHandler } from "../utils/asyncHandler";

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  try {
    const header = req.get("authorization");
    if (!header?.startsWith("Bearer ")) throw new AppError(401, "Authentication required");
    const payload = verifyAccessToken(header.slice(7));
    const user = await UserModel.findById(payload.sub).select("+authVersion status").lean();
    if (!user || user.status !== "active" || user.authVersion !== payload.version) {
      throw new AppError(401, "Session is no longer valid");
    }

    req.auth = {
      userId: new Types.ObjectId(payload.sub),
      roleIds: Array.isArray(payload.roles) ? payload.roles : [],
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Invalid or expired access token"));
  }
});

export const authorize =
  (...requiredPermissions: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, "Authentication required"));
    const allowed = requiredPermissions.every((permission) =>
      req.auth?.permissions.includes(permission),
    );
    if (!allowed) return next(new AppError(403, "You do not have permission for this action"));
    next();
  };
