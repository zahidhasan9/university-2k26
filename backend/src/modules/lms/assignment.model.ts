import { model, Schema } from "mongoose";

const assignmentSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    instructions: { type: String, required: true, trim: true, maxlength: 5000 },
    attachmentUrls: [{ type: String, trim: true }],
    dueAt: { type: Date, required: true, index: true },
    maxScore: { type: Number, required: true, min: 1, max: 1000 },
    published: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);
export const LmsAssignmentModel = model("LmsAssignment", assignmentSchema);

const submissionSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "LmsAssignment", required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    text: { type: String, trim: true, maxlength: 10000 },
    attachmentUrls: [{ type: String, trim: true }],
    submittedAt: { type: Date, required: true, default: Date.now },
    score: { type: Number, min: 0 },
    feedback: { type: String, trim: true, maxlength: 2000 },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
    status: { type: String, enum: ["submitted", "graded"], default: "submitted", index: true },
  },
  { timestamps: true, versionKey: false },
);
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
export const AssignmentSubmissionModel = model("AssignmentSubmission", submissionSchema);
