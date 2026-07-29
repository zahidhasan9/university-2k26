import { model, Schema, type InferSchemaType } from "mongoose";

const permissionSchema = new Schema(
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
  },
  { timestamps: true, versionKey: false },
);

export type Permission = InferSchemaType<typeof permissionSchema>;
export const PermissionModel = model("Permission", permissionSchema);
