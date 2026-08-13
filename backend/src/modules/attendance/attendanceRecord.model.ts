import { model, Schema } from "mongoose";

const attendanceRecordSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    status: { type: String, enum: ["present", "absent", "late", "excused", "invalid"], required: true, index: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    markedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300 },
    source: { type: String, enum: ["manual", "qr"], default: "manual" },
    evidence: {
      ipHash: { type: String, select: false },
      deviceHash: { type: String, select: false },
      checkedInAt: { type: Date },
    },
    suspicious: { type: Boolean, default: false, index: true },
    suspicionReasons: [{ type: String, trim: true, maxlength: 160 }],
    repeatOffenceCount: { type: Number, default: 0, min: 0 },
    correctionHistory: [
      {
        previousStatus: { type: String },
        nextStatus: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true, maxlength: 300 },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceRecordSchema.index({ student: 1, offering: 1, status: 1 });
export const AttendanceRecordModel = model("AttendanceRecord", attendanceRecordSchema);
