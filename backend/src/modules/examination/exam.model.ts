import { model, Schema } from "mongoose";

const examSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    type: {
      type: String,
      enum: ["quiz", "class_test", "midterm", "final", "practical", "assignment", "viva"],
      required: true,
      index: true,
    },
    examDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startMinutes: { type: Number, required: true, select: false },
    endMinutes: { type: Number, required: true, select: false },
    room: { type: String, uppercase: true, trim: true, maxlength: 60 },
    totalMarks: { type: Number, required: true, min: 1, max: 1000 },
    weightPercentage: { type: Number, required: true, min: 0.01, max: 100 },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

examSchema.index({ offering: 1, title: 1 }, { unique: true });
examSchema.index({ examDate: 1, room: 1 });
export const ExamModel = model("Exam", examSchema);
