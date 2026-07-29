import { model, Schema } from "mongoose";

const semesterSchema = new Schema(
  {
    university: { type: Schema.Types.ObjectId, ref: "University", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 30 },
    academicYear: { type: String, required: true, trim: true, maxlength: 20, index: true },
    term: {
      type: String,
      enum: ["spring", "summer", "fall", "winter", "annual"],
      required: true,
      index: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    registrationStartsAt: { type: Date, required: true },
    registrationEndsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["planned", "registration", "ongoing", "completed", "archived"],
      default: "planned",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

semesterSchema.index({ university: 1, code: 1 }, { unique: true });
semesterSchema.index({ university: 1, startsAt: 1, endsAt: 1 });
export const SemesterModel = model("Semester", semesterSchema);
