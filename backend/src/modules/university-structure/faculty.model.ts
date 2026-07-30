import { model, Schema } from "mongoose";

const facultySchema = new Schema(
  {
    university: {
      type: Schema.Types.ObjectId,
      ref: "University",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

facultySchema.index({ university: 1, code: 1 }, { unique: true });
facultySchema.index({ university: 1, name: 1 });
export const FacultyModel = model("Faculty", facultySchema);
