import { model, Schema } from "mongoose";

const studentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    admissionSemester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    admissionApplication: { type: Schema.Types.ObjectId, ref: "Admission", unique: true, sparse: true },
    batch: { type: String, required: true, default: "Unassigned", trim: true, maxlength: 40, index: true },
    academicBatch: { type: Schema.Types.ObjectId, ref: "AcademicBatch", required: true, index: true },
    section: { type: String, required: true, default: "Unassigned", trim: true, maxlength: 20 },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    phone: { type: String, trim: true, maxlength: 30 },
    guardian: {
      name: { type: String, trim: true, maxlength: 120 },
      relationship: { type: String, trim: true, maxlength: 60 },
      phone: { type: String, trim: true, maxlength: 30 },
      email: { type: String, trim: true, lowercase: true },
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    currentSemesterNumber: { type: Number, min: 1, default: 1 },
    status: {
      type: String,
      enum: ["active", "graduated", "suspended", "withdrawn", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

studentSchema.index({ program: 1, status: 1 });
studentSchema.index({ program: 1, batch: 1, status: 1 });
export const StudentModel = model("Student", studentSchema);
