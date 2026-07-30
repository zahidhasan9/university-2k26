import { model, Schema } from "mongoose";

const departmentSchema = new Schema(
  {
    faculty: {
      type: Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

departmentSchema.index({ faculty: 1, code: 1 }, { unique: true });
departmentSchema.index({ faculty: 1, name: 1 });
export const DepartmentModel = model("Department", departmentSchema);
