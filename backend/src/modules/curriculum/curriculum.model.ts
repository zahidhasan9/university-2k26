import { model, Schema, type InferSchemaType } from "mongoose";

const curriculumCourseSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    semesterNumber: { type: Number, required: true, min: 1 },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const curriculumSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    effectiveYear: { type: Number, required: true, min: 1900, max: 2200, index: true },
    totalSemesters: { type: Number, required: true, min: 1 },
    coursePlans: { type: [curriculumCourseSchema], default: [] },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
  },
  { timestamps: true, versionKey: false },
);

curriculumSchema.index({ program: 1, code: 1 }, { unique: true });
curriculumSchema.index({ program: 1, status: 1, effectiveYear: -1 });
export type Curriculum = InferSchemaType<typeof curriculumSchema>;
export const CurriculumModel = model<Curriculum>("Curriculum", curriculumSchema);
