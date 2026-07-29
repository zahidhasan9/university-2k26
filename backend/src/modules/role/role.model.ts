import { model, Schema, type InferSchemaType } from "mongoose";

const roleSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export type Role = InferSchemaType<typeof roleSchema>;
export const RoleModel = model("Role", roleSchema);
