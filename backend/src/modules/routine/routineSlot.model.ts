import { model, Schema } from "mongoose";

const routineSlotSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"],
      required: true,
      index: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startMinutes: { type: Number, required: true, min: 0, max: 1439, select: false },
    endMinutes: { type: Number, required: true, min: 1, max: 1440, select: false },
    room: { type: String, required: true, uppercase: true, trim: true, maxlength: 60, index: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, required: true },
    status: { type: String, enum: ["active", "cancelled"], default: "active", index: true },
  },
  { timestamps: true, versionKey: false },
);

routineSlotSchema.index({ semester: 1, dayOfWeek: 1, room: 1 });
routineSlotSchema.index({ teacher: 1, dayOfWeek: 1 });
export const RoutineSlotModel = model("RoutineSlot", routineSlotSchema);
