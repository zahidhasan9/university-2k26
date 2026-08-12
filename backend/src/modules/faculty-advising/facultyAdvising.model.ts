import { model, Schema } from "mongoose";

const schema = new Schema({
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
  academicBatch: { type: Schema.Types.ObjectId, ref: "AcademicBatch", required: true, index: true },
  academicSection: { type: Schema.Types.ObjectId, ref: "AcademicSection", required: true, index: true },
  startsAt: { type: Date, required: true }, endsAt: { type: Date },
  status: { type: String, enum: ["active", "ended"], default: "active", index: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
schema.index({ academicSection: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "active" } });
export const FacultyAdvisingModel = model("FacultyAdvising", schema);
