import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { RoleModel } from "../role/role.model";
import { PermissionModel } from "./permission.model";

export async function listPermissions(query: Record<string, unknown>) {
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
    PermissionModel.find(filter).sort({ code: 1 }).skip(skip).limit(limit).lean(),
    PermissionModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function createPermission(input: {
  code: string;
  name: string;
  description?: string;
}) {
  if (await PermissionModel.exists({ code: input.code })) {
    throw new AppError(409, "Permission code already exists");
  }
  return PermissionModel.create(input);
}

export async function updatePermission(
  id: string,
  input: { name?: string; description?: string },
) {
  const permission = await PermissionModel.findByIdAndUpdate(toObjectId(id), input, {
    new: true,
    runValidators: true,
  });
  if (!permission) throw new AppError(404, "Permission not found");
  return permission;
}

export async function deletePermission(id: string): Promise<void> {
  const permissionId = toObjectId(id);
  if (await RoleModel.exists({ permissions: permissionId })) {
    throw new AppError(409, "Permission is assigned to one or more roles");
  }
  const result = await PermissionModel.deleteOne({ _id: permissionId });
  if (!result.deletedCount) throw new AppError(404, "Permission not found");
}
