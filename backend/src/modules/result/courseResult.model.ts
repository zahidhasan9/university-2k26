import { model, Schema } from "mongoose";

const courseResultSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, unique: true },
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    letterGrade: { type: String, required: true, uppercase: true },
    gradePoint: { type: Number, required: true, min: 0, max: 5 },
    passed: { type: Boolean, required: true, index: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    calculatedAt: { type: Date, required: true },
    calculatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);

courseResultSchema.index({ student: 1, semester: 1, status: 1 });
courseResultSchema.index({ offering: 1, status: 1 });
export const CourseResultModel = model("CourseResult", courseResultSchema);
