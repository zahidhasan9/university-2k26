import { model, Schema } from "mongoose";

const gradeBandSchema = new Schema(
  {
    letter: { type: String, required: true, uppercase: true, trim: true, maxlength: 5 },
    minPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxPercentage: { type: Number, required: true, min: 0, max: 100 },
    gradePoint: { type: Number, required: true, min: 0, max: 5 },
    passed: { type: Boolean, required: true },
  },
  { _id: false },
);

const gradePolicySchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bands: { type: [gradeBandSchema], required: true },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true, versionKey: false },
);

gradePolicySchema.index(
  { program: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);
export const GradePolicyModel = model("GradePolicy", gradePolicySchema);
