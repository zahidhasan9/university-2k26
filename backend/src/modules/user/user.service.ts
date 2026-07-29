import bcrypt from "bcrypt";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { RefreshTokenModel } from "../auth/refreshToken.model";
import { RoleModel } from "../role/role.model";
import { UserModel } from "./user.model";

const publicFields = "-passwordHash -authVersion";

async function validateRoles(ids: string[]): Promise<Types.ObjectId[]> {
  const uniqueIds = [...new Set(ids)];
  const objectIds = uniqueIds.map((id) => toObjectId(id, "role id"));
  const count = await RoleModel.countDocuments({ _id: { $in: objectIds } });
  if (count !== objectIds.length) throw new AppError(400, "One or more roles do not exist");
  return objectIds;
}

async function protectLastSuperAdmin(
  userId: Types.ObjectId,
  nextRoleIds?: Types.ObjectId[],
  nextStatus?: string,
): Promise<void> {
  const superAdmin = await RoleModel.findOne({ code: "super_admin" }).select("_id").lean();
  if (!superAdmin) return;
  const current = await UserModel.findById(userId).select("roles status").lean();
  if (!current?.roles.some((roleId) => roleId.equals(superAdmin._id))) return;

  const losesRole = nextRoleIds && !nextRoleIds.some((roleId) => roleId.equals(superAdmin._id));
  const losesAccess = nextStatus !== undefined && nextStatus !== "active";
  if (!losesRole && !losesAccess) return;

  const otherCount = await UserModel.countDocuments({
    _id: { $ne: userId },
    roles: superAdmin._id,
    status: "active",
  });
  if (otherCount === 0) throw new AppError(409, "The final active Super Admin cannot be removed");
}

export async function listUsers(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.roleId) filter.roles = toObjectId(String(query.roleId), "role id");
  if (query.search) {
    const search = escapeRegex(String(query.search));
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    UserModel.find(filter)
      .select(publicFields)
      .populate("roles", "code name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getUser(id: string) {
  const user = await UserModel.findById(toObjectId(id))
    .select(publicFields)
    .populate("roles", "code name")
    .lean();
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleIds: string[];
  status: "active" | "pending" | "suspended" | "disabled";
}) {
  if (await UserModel.exists({ email: input.email })) throw new AppError(409, "Email already exists");
  const roles = await validateRoles(input.roleIds);
  const user = await UserModel.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    roles,
    status: input.status,
  });
  return getUser(user._id.toString());
}

export async function updateUser(
  id: string,
  actorId: Types.ObjectId,
  input: {
    firstName?: string;
    lastName?: string;
    roleIds?: string[];
    status?: "active" | "pending" | "suspended" | "disabled";
  },
) {
  const userId = toObjectId(id);
  if (userId.equals(actorId) && (input.roleIds || (input.status && input.status !== "active"))) {
    throw new AppError(409, "You cannot change your own roles or deactivate your own account");
  }
  const user = await UserModel.findById(userId).select("+authVersion");
  if (!user) throw new AppError(404, "User not found");

  const roleIds = input.roleIds ? await validateRoles(input.roleIds) : undefined;
  await protectLastSuperAdmin(userId, roleIds, input.status);

  if (input.firstName !== undefined) user.firstName = input.firstName;
  if (input.lastName !== undefined) user.lastName = input.lastName;
  if (roleIds) user.roles = roleIds;
  if (input.status !== undefined) user.status = input.status;
  if (roleIds || input.status !== undefined) user.authVersion += 1;
  await user.save();

  if (input.status && input.status !== "active") {
    await RefreshTokenModel.updateMany(
      { user: userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  }
  return getUser(id);
}

export async function disableUser(id: string, actorId: Types.ObjectId): Promise<void> {
  await updateUser(id, actorId, { status: "disabled" });
}
