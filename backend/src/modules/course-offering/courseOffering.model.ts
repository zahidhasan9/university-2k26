import { model, Schema } from "mongoose";

const courseOfferingSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    batch: { type: String, required: true, default: "Unassigned", trim: true, maxlength: 40, index: true },
    section: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    capacity: { type: Number, required: true, min: 1, max: 1000 },
    deliveryMode: {
      type: String,
      enum: ["in_person", "online", "hybrid"],
      default: "in_person",
    },
    status: {
      type: String,
      enum: ["planned", "open", "ongoing", "completed", "cancelled"],
      default: "planned",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

courseOfferingSchema.index({ course: 1, semester: 1, batch: 1, section: 1 }, { unique: true });
courseOfferingSchema.index({ teacher: 1, semester: 1, status: 1 });
courseOfferingSchema.index({ semester: 1, batch: 1, section: 1, status: 1 });
export const CourseOfferingModel = model("CourseOffering", courseOfferingSchema);
