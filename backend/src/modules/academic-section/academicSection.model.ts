import { model, Schema, type InferSchemaType } from "mongoose";

const academicSectionSchema = new Schema(
  {
    academicBatch: { type: Schema.Types.ObjectId, ref: "AcademicBatch", required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    capacity: { type: Number, required: true, min: 1, max: 1000 },
    enrolledCount: { type: Number, required: true, min: 0, default: 0 },
    shift: { type: String, enum: ["morning", "day", "evening", "weekend"], default: "day" },
    homeRoom: { type: String, trim: true, maxlength: 40 },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true, versionKey: false },
);

academicSectionSchema.index({ academicBatch: 1, code: 1 }, { unique: true });
export type AcademicSection = InferSchemaType<typeof academicSectionSchema>;
export const AcademicSectionModel = model<AcademicSection>("AcademicSection", academicSectionSchema);
