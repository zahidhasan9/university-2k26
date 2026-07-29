import { createHash, randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { Request } from "express";
import type { Types } from "mongoose";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { RefreshTokenModel } from "./refreshToken.model";
import { UserModel } from "../user/user.model";

interface AuthorizationSnapshot {
  roleIds: string[];
  permissions: string[];
  authVersion: number;
}

interface RefreshPayload extends JwtPayload {
  sub: string;
  type: "refresh";
  jti: string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getAuthorization(userId: Types.ObjectId | string): Promise<AuthorizationSnapshot> {
  const user = await UserModel.findById(userId)
    .select("+authVersion")
    .populate({ path: "roles", select: "_id permissions", populate: { path: "permissions", select: "code" } })
    .lean();

  if (!user) throw new AppError(401, "User account not found");

  const roles = user.roles as unknown as Array<{
    _id: Types.ObjectId;
    permissions: Array<{ code: string }>;
  }>;

  return {
    roleIds: roles.map((role) => role._id.toString()),
    permissions: [...new Set(roles.flatMap((role) => role.permissions.map((item) => item.code)))],
    authVersion: user.authVersion,
  };
}

export async function createAccessToken(userId: Types.ObjectId): Promise<string> {
  const authorization = await getAuthorization(userId);
  return jwt.sign(
    {
      type: "access",
      roles: authorization.roleIds,
      permissions: authorization.permissions,
      version: authorization.authVersion,
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: userId.toString(),
      expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
      issuer: "unisphere-api",
      audience: "unisphere-client",
    },
  );
}

export async function createRefreshToken(userId: Types.ObjectId, req: Request): Promise<string> {
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  const token = jwt.sign({ type: "refresh" }, env.JWT_REFRESH_SECRET, {
    subject: userId.toString(),
    jwtid: randomUUID(),
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions["expiresIn"],
    issuer: "unisphere-api",
    audience: "unisphere-client",
  });

  await RefreshTokenModel.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  return token;
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "unisphere-api",
    audience: "unisphere-client",
  });
  if (typeof payload === "string" || payload.type !== "access" || !payload.sub) {
    throw new AppError(401, "Invalid access token");
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "unisphere-api",
    audience: "unisphere-client",
  });
  if (typeof payload === "string" || payload.type !== "refresh" || !payload.sub || !payload.jti) {
    throw new AppError(401, "Invalid refresh token");
  }
  return payload as RefreshPayload;
}

export async function rotateRefreshToken(token: string, req: Request): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const payload = verifyRefreshToken(token);
  const currentHash = hashToken(token);
  const stored = await RefreshTokenModel.findOne({ tokenHash: currentHash }).select(
    "+tokenHash +replacedByTokenHash",
  );

  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    if (stored?.user) {
      await RefreshTokenModel.updateMany(
        { user: stored.user, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
    }
    throw new AppError(401, "Refresh token is expired, revoked, or reused");
  }

  const user = await UserModel.findById(payload.sub);
  if (!user || user.status !== "active") throw new AppError(401, "User account is unavailable");

  const refreshToken = await createRefreshToken(user._id, req);
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashToken(refreshToken);
  await stored.save();

  return { accessToken: await createAccessToken(user._id), refreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshTokenModel.updateOne(
    { tokenHash: hashToken(token), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}
