import { model, Schema } from "mongoose";

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["enrolled", "dropped", "completed", "failed", "withdrawn"],
      default: "enrolled",
      index: true,
    },
    droppedAt: { type: Date },
    dropReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

enrollmentSchema.index({ student: 1, offering: 1 }, { unique: true });
enrollmentSchema.index({ semester: 1, course: 1, status: 1 });
export const EnrollmentModel = model("Enrollment", enrollmentSchema);
