import { model, Schema } from "mongoose";

const courseSchema = new Schema(
  {
    program: {
      type: Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 2000 },
    credits: { type: Number, required: true, min: 0, max: 20 },
    courseType: {
      type: String,
      enum: ["core", "elective", "general", "lab", "thesis"],
      default: "core",
      index: true,
    },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

courseSchema.index({ program: 1, code: 1 }, { unique: true });
courseSchema.index({ program: 1, title: 1 });
export const CourseModel = model("Course", courseSchema);
