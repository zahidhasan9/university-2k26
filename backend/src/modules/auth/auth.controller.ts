import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import { UserModel } from "../user/user.model";
import { LoginHistoryModel } from "./loginHistory.model";
import { RefreshTokenModel } from "./refreshToken.model";
import {
  createAccessToken,
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./auth.service";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  path: "/api/auth",
};

function readCookie(req: Request): string | undefined {
  const cookies = req.headers.cookie?.split(";") ?? [];
  const entry = cookies.find((item) => item.trim().startsWith(`${env.COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.trim().slice(env.COOKIE_NAME.length + 1)) : undefined;
}

function publicUser(user: {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles: unknown[];
  createdAt?: Date;
}) {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    roles: user.roles,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response): Promise<Response> {
  const { firstName, lastName, email, password } = req.body;
  if (await UserModel.exists({ email })) throw new AppError(409, "An account with this email exists");

  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    roles: [],
  });

  await writeAuditLog(req, {
    actor: user._id,
    action: "auth.register",
    resource: "user",
    resourceId: user._id.toString(),
  });

  return sendSuccess(res, 201, "Registration successful", { user: publicUser(user) });
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email }).select("+passwordHash");
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    await LoginHistoryModel.create({
      email,
      successful: false,
      failureReason: "invalid_credentials",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    throw new AppError(401, "Invalid email or password");
  }
  if (user.status !== "active") throw new AppError(403, "User account is not active");

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(user._id),
    createRefreshToken(user._id, req),
  ]);
  user.lastLoginAt = new Date();
  await user.save();
  await LoginHistoryModel.create({
    user: user._id,
    email,
    successful: true,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.cookie(env.COOKIE_NAME, refreshToken, cookieOptions);
  return sendSuccess(res, 200, "Login successful", {
    accessToken,
    user: publicUser(user),
  });
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  const token = readCookie(req);
  if (!token) throw new AppError(401, "Refresh token is required");
  const tokens = await rotateRefreshToken(token, req);
  res.cookie(env.COOKIE_NAME, tokens.refreshToken, cookieOptions);
  return sendSuccess(res, 200, "Token refreshed", { accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response): Promise<Response> {
  const token = readCookie(req);
  if (token) await revokeRefreshToken(token);
  res.clearCookie(env.COOKIE_NAME, cookieOptions);
  return sendSuccess(res, 200, "Logout successful", null);
}

export async function me(req: Request, res: Response): Promise<Response> {
  const user = await UserModel.findById(req.auth?.userId).populate("roles", "code name").lean();
  if (!user) throw new AppError(404, "User not found");
  return sendSuccess(res, 200, "Current user retrieved", { user: publicUser(user) });
}

export async function changePassword(req: Request, res: Response): Promise<Response> {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const user = await UserModel.findById(req.auth.userId).select("+passwordHash +authVersion");
  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw new AppError(400, "Current password is incorrect");
  }

  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.passwordChangedAt = new Date();
  user.authVersion += 1;
  await user.save();
  await RefreshTokenModel.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
  await writeAuditLog(req, {
    actor: user._id,
    action: "auth.password_change",
    resource: "user",
    resourceId: user._id.toString(),
  });
  res.clearCookie(env.COOKIE_NAME, cookieOptions);
  return sendSuccess(res, 200, "Password changed; please sign in again", null);
}
