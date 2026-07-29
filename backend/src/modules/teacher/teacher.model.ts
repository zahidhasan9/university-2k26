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
    phone: { type: String, trim: true, maxlength: 30 },
    specialization: [{ type: String, trim: true, maxlength: 100 }],
    qualifications: [
      {
        degree: { type: String, required: true, trim: true },
        institution: { type: String, required: true, trim: true },
        year: { type: Number, min: 1900, max: 2200 },
      },
    ],
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
