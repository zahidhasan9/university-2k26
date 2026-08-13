import { model, Schema } from "mongoose";

const documentSchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true, timestamps: true },
);

const admissionSchema = new Schema(
  {
    applicationNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    intakeSemester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    personal: {
      phone: { type: String, required: true, trim: true, maxlength: 30 },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"], required: true },
      nationality: { type: String, required: true, trim: true, maxlength: 80 },
      presentAddress: { type: String, required: true, trim: true, maxlength: 500 },
      permanentAddress: { type: String, required: true, trim: true, maxlength: 500 },
    },
    guardian: {
      name: { type: String, required: true, trim: true, maxlength: 160 },
      relationship: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, required: true, trim: true, maxlength: 30 },
      email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    },
    statement: { type: String, trim: true, maxlength: 5000 },
    previousEducation: [
      {
        level: { type: String, required: true, trim: true },
        institution: { type: String, required: true, trim: true },
        result: { type: String, required: true, trim: true },
        passingYear: { type: Number, required: true, min: 1950, max: 2200 },
      },
    ],
    documents: [documentSchema],
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected", "cancelled"],
      default: "draft",
      index: true,
    },
    submittedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true, versionKey: false },
);

admissionSchema.index({ applicant: 1, program: 1, intakeSemester: 1 }, { unique: true });
admissionSchema.index({ createdAt: -1 });
export const AdmissionModel = model("Admission", admissionSchema);
