import { model, Schema } from "mongoose";

const libraryPolicySchema = new Schema(
  {
    borrowerType: { type: String, enum: ["student", "teacher"], required: true, unique: true },
    maxActiveLoans: { type: Number, required: true, min: 1, max: 100 },
    loanDays: { type: Number, required: true, min: 1, max: 365 },
    finePerDayMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
  },
  { timestamps: true, versionKey: false },
);

export const LibraryPolicyModel = model("LibraryPolicy", libraryPolicySchema);
