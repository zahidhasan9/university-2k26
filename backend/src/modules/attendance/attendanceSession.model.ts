import { model, Schema } from "mongoose";

const attendanceSessionSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    date: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    sessionNumber: { type: Number, required: true, min: 1 },
    classType: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "seminar", "exam", "other"],
      default: "lecture",
      index: true,
    },
    room: { type: String, trim: true, uppercase: true, maxlength: 60 },
    routineSlot: { type: Schema.Types.ObjectId, ref: "RoutineSlot", index: true },
    topic: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed", "cancelled"], default: "open", index: true },
    checkInStatus: { type: String, enum: ["closed", "open"], default: "closed", index: true },
    checkInOpenedAt: { type: Date },
    checkInClosedAt: { type: Date },
    qrTokenHash: { type: String, select: false },
    qrExpiresAt: { type: Date, select: false },
  },
  { timestamps: true, versionKey: false },
);

attendanceSessionSchema.index({ offering: 1, date: 1 }, { unique: true });
attendanceSessionSchema.index(
  { offering: 1, sessionNumber: 1 },
  { unique: true, partialFilterExpression: { sessionNumber: { $type: "number" } } },
);
export const AttendanceSessionModel = model("AttendanceSession", attendanceSessionSchema);
