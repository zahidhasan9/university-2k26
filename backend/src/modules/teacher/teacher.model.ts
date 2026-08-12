import { model, Schema } from "mongoose";

const teacherSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    designation: {
      type: String,
      enum: ["lecturer", "assistant_professor", "associate_professor", "professor", "adjunct"],
      required: true,
      index: true,
    },
    joiningDate: { type: Date, required: true },
    employmentType: { type: String, enum: ["permanent", "contractual", "adjunct", "visiting"], default: "permanent" },
    campus: { type: String, trim: true, maxlength: 100 },
    officeRoom: { type: String, trim: true, maxlength: 40 },
    officialEmail: { type: String, trim: true, lowercase: true, maxlength: 160 },
    confirmationDate: { type: Date },
    maxWeeklyHours: { type: Number, min: 1, max: 60, default: 18 },
    phone: { type: String, trim: true, maxlength: 30 },
    specialization: [{ type: String, trim: true, maxlength: 100 }],
    researchInterests: [{ type: String, trim: true, maxlength: 120 }],
    certifications: [{ type: String, trim: true, maxlength: 180 }],
    links: { orcid: { type: String, trim: true }, googleScholar: { type: String, trim: true }, website: { type: String, trim: true } },
    officeHours: [{ day: { type: String, enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] }, startTime: { type: String, trim: true }, endTime: { type: String, trim: true }, _id: false }],
    qualifications: [
      {
        degree: { type: String, required: true, trim: true },
        institution: { type: String, required: true, trim: true },
        year: { type: Number, min: 1900, max: 2200 },
      },
    ],
    documents: [{ type: { type: String, required: true, trim: true }, url: { type: String, required: true, trim: true }, status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }, _id: false }],
    assignmentHistory: [{ department: { type: Schema.Types.ObjectId, ref: "Department" }, designation: { type: String }, changedAt: { type: Date, default: Date.now }, changedBy: { type: Schema.Types.ObjectId, ref: "User" }, _id: false }],
    status: {
      type: String,
      enum: ["active", "on_leave", "retired", "resigned", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

teacherSchema.index({ department: 1, status: 1 });
export const TeacherModel = model("Teacher", teacherSchema);
