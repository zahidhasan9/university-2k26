import { Types } from "mongoose";
import { AppError } from "./AppError";

export function toObjectId(value: string, fieldName = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) throw new AppError(400, `Invalid ${fieldName}`);
  return new Types.ObjectId(value);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
