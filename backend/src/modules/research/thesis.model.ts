import { model, Schema } from "mongoose";

const thesisSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 400 },
    abstract: { type: String, required: true, trim: true, maxlength: 5000 },
    supervisor: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    coSupervisors: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
    documentUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "proposed",
        "approved",
        "in_progress",
        "submitted",
        "defense_scheduled",
        "defended",
        "completed",
        "rejected",
      ],
      default: "proposed",
      index: true,
    },
    submittedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

thesisSchema.index({ supervisor: 1, status: 1 });
export const ThesisModel = model("Thesis", thesisSchema);

const defenseSchema = new Schema(
  {
    thesis: { type: Schema.Types.ObjectId, ref: "Thesis", required: true, unique: true },
    scheduledAt: { type: Date, required: true, index: true },
    room: { type: String, required: true, uppercase: true, trim: true, maxlength: 80 },
    panel: [{ type: Schema.Types.ObjectId, ref: "Teacher", required: true }],
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
    outcome: { type: String, enum: ["pass", "pass_with_revision", "fail"] },
    remarks: { type: String, trim: true, maxlength: 2000 },
    completedAt: { type: Date },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);

defenseSchema.index({ scheduledAt: 1, room: 1 });
export const ThesisDefenseModel = model("ThesisDefense", defenseSchema);
