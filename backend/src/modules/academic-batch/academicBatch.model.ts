import { model, Schema, type InferSchemaType } from "mongoose";

const academicBatchSchema = new Schema(
  {
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    curriculum: { type: Schema.Types.ObjectId, ref: "Curriculum", index: true },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    admissionYear: { type: Number, required: true, min: 1900, max: 2200, index: true },
    curriculumVersion: { type: String, required: true, trim: true, maxlength: 40 },
    totalSemesters: { type: Number, required: true, min: 1 },
    currentSemesterNumber: { type: Number, required: true, min: 1, default: 1 },
    status: { type: String, enum: ["planned", "active", "completed", "archived"], default: "planned", index: true },
  },
  { timestamps: true, versionKey: false },
);

academicBatchSchema.index({ program: 1, code: 1 }, { unique: true });
academicBatchSchema.index({ department: 1, status: 1, admissionYear: -1 });
export type AcademicBatch = InferSchemaType<typeof academicBatchSchema>;
export const AcademicBatchModel = model<AcademicBatch>("AcademicBatch", academicBatchSchema);
