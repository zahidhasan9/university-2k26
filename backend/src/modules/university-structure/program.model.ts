import { model, Schema } from "mongoose";

const programSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    degreeType: {
      type: String,
      enum: ["certificate", "diploma", "bachelor", "master", "doctorate"],
      required: true,
      index: true,
    },
    durationYears: { type: Number, required: true, min: 0.5, max: 10 },
    totalCredits: { type: Number, required: true, min: 1, max: 400 },
    totalSemesters: { type: Number, required: true, min: 1, default: 8 },
    description: { type: String, trim: true, maxlength: 1500 },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

programSchema.index({ department: 1, code: 1 }, { unique: true });
programSchema.index({ department: 1, name: 1 });
export const ProgramModel = model("Program", programSchema);
