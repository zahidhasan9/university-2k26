import { model, Schema } from "mongoose";

const studentWaiverSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["tuition", "all"], default: "tuition" },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    validFrom: { type: Date, required: true, index: true },
    validUntil: { type: Date, required: true, index: true },
    status: { type: String, enum: ["active", "inactive", "revoked"], default: "active", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

studentWaiverSchema.index({ student: 1, status: 1, validFrom: 1, validUntil: 1 });
export const StudentWaiverModel = model("StudentWaiver", studentWaiverSchema);
