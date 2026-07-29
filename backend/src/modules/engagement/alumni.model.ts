import { model, Schema } from "mongoose";

const alumniSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    graduationYear: { type: Number, required: true, min: 1900, max: 2200, index: true },
    currentOrganization: { type: String, trim: true, maxlength: 180 },
    jobTitle: { type: String, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 160 },
    linkedInUrl: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 2000 },
    directoryVisible: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["pending", "verified", "suspended"], default: "pending", index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

alumniSchema.index({ program: 1, graduationYear: -1, status: 1 });
export const AlumniModel = model("Alumni", alumniSchema);
