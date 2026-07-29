import { model, Schema } from "mongoose";

const attendanceSessionSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    date: { type: Date, required: true, index: true },
    topic: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed", "cancelled"], default: "open", index: true },
    qrTokenHash: { type: String, select: false },
    qrExpiresAt: { type: Date, select: false },
  },
  { timestamps: true, versionKey: false },
);

attendanceSessionSchema.index({ offering: 1, date: 1 }, { unique: true });
export const AttendanceSessionModel = model("AttendanceSession", attendanceSessionSchema);
