import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { PermissionModel } from "../permission/permission.model";
import { UserModel } from "../user/user.model";
import { RoleModel } from "./role.model";

async function validatePermissions(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  const count = await PermissionModel.countDocuments({ _id: { $in: uniqueIds.map((id) => toObjectId(id)) } });
  if (count !== uniqueIds.length) throw new AppError(400, "One or more permissions do not exist");
}

export async function listRoles(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter = query.search
    ? {
        $or: [
          { code: { $regex: escapeRegex(String(query.search)), $options: "i" } },
          { name: { $regex: escapeRegex(String(query.search)), $options: "i" } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    RoleModel.find(filter)
      .populate("permissions", "code name")
      .sort({ isSystem: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RoleModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function getRole(id: string) {
  const role = await RoleModel.findById(toObjectId(id)).populate("permissions", "code name").lean();
  if (!role) throw new AppError(404, "Role not found");
  return role;
}

export async function createRole(input: {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}) {
  if (await RoleModel.exists({ code: input.code })) throw new AppError(409, "Role code already exists");
  await validatePermissions(input.permissionIds);
  return RoleModel.create({
    code: input.code,
    name: input.name,
    description: input.description,
    permissions: input.permissionIds.map((id) => toObjectId(id)),
    isSystem: false,
  });
}

export async function updateRole(
  id: string,
  input: { name?: string; description?: string; permissionIds?: string[] },
) {
  const role = await RoleModel.findById(toObjectId(id));
  if (!role) throw new AppError(404, "Role not found");
  if (role.code === "super_admin" && input.permissionIds) {
    throw new AppError(409, "Super Admin permissions cannot be changed through this endpoint");
  }
  if (input.permissionIds) {
    await validatePermissions(input.permissionIds);
    role.permissions = input.permissionIds.map((permissionId) => toObjectId(permissionId));
  }
  if (input.name !== undefined) role.name = input.name;
  if (input.description !== undefined) role.description = input.description;
  await role.save();
  return role.populate("permissions", "code name");
}

export async function deleteRole(id: string): Promise<void> {
  const roleId = toObjectId(id);
  const role = await RoleModel.findById(roleId);
  if (!role) throw new AppError(404, "Role not found");
  if (role.isSystem) throw new AppError(409, "System roles cannot be deleted");
  if (await UserModel.exists({ roles: roleId })) throw new AppError(409, "Role is assigned to users");
  await role.deleteOne();
}
