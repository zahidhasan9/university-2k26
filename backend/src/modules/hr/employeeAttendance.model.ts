import { model, Schema } from "mongoose";

const employeeAttendanceSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    date: { type: Date, required: true, index: true },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "leave", "holiday"],
      required: true,
      index: true,
    },
    note: { type: String, trim: true, maxlength: 300 },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

employeeAttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
export const EmployeeAttendanceModel = model("EmployeeAttendance", employeeAttendanceSchema);
