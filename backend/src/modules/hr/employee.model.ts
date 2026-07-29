import { model, Schema } from "mongoose";

const employeeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", unique: true, sparse: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", index: true },
    employeeType: {
      type: String,
      enum: ["academic", "administrative", "support", "contract"],
      required: true,
      index: true,
    },
    designation: { type: String, required: true, trim: true, maxlength: 120, index: true },
    joiningDate: { type: Date, required: true },
    employmentEndDate: { type: Date },
    phone: { type: String, trim: true, maxlength: 30 },
    bankAccount: {
      accountName: { type: String, trim: true, maxlength: 120 },
      accountNumber: { type: String, trim: true, maxlength: 80, select: false },
      bankName: { type: String, trim: true, maxlength: 120 },
      branch: { type: String, trim: true, maxlength: 120 },
    },
    taxIdentifier: { type: String, trim: true, maxlength: 80, select: false },
    status: {
      type: String,
      enum: ["active", "on_leave", "suspended", "resigned", "retired", "terminated"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

employeeSchema.index({ department: 1, status: 1 });
export const EmployeeModel = model("Employee", employeeSchema);
