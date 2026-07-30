import bcrypt from "bcrypt";
import { model, Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    status: {
      type: String,
      enum: ["active", "pending", "suspended", "disabled"],
      default: "active",
      index: true,
    },
    emailVerifiedAt: { type: Date },
    emailClaimedAt: { type: Date },
    phone: { type: String, trim: true, maxlength: 30 },
    avatarUrl: { type: String, trim: true, maxlength: 2048 },
    address: {
      line1: { type: String, trim: true, maxlength: 160 },
      line2: { type: String, trim: true, maxlength: 160 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      country: { type: String, trim: true, maxlength: 100 },
      postalCode: { type: String, trim: true, maxlength: 30 },
    },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    authVersion: { type: Number, default: 0, min: 0, select: false },
  },
  { timestamps: true, versionKey: false },
);

userSchema.methods.comparePassword = function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
