import { model, Schema } from "mongoose";

const examMarkSchema = new Schema(
  {
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    marksObtained: { type: Number, required: true, min: 0 },
    absent: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 300 },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

examMarkSchema.index({ exam: 1, student: 1 }, { unique: true });
export const ExamMarkModel = model("ExamMark", examMarkSchema);
