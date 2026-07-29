import { model, Schema } from "mongoose";

const complaintSchema = new Schema(
  {
    complaintNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    complainant: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: ["academic", "finance", "hostel", "transport", "library", "harassment", "technical", "other"],
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    attachmentUrls: [{ type: String, trim: true }],
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", index: true },
    status: {
      type: String,
      enum: ["submitted", "under_review", "resolved", "rejected", "closed"],
      default: "submitted",
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolution: { type: String, trim: true, maxlength: 3000 },
    resolvedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

complaintSchema.index({ complainant: 1, createdAt: -1 });
export const ComplaintModel = model("Complaint", complaintSchema);
